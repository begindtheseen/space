---
id: l02-star-schemas-and-keys
title: Star schemas, surrogate keys and natural keys
minutes: 20
covers:
  - Star and snowflake schemas; surrogate versus natural keys
---

Think about a store receipt. Most of it is a list of lines: this item, this many, this price. Each line is short. But every line also points at things with a lot more to say about them — the product (its name, brand, aisle), the store (its city, its manager), the day (a weekday? a holiday?). Nobody prints the store's whole address on every line. The receipt keeps the lines lean and lets you look up the rest.

Last lesson you split a messy telemetry sheet into one big `reading` table and three small tables that describe what each reading is about. That shape — a tall, thin table of events surrounded by short, wide tables of descriptions — is so common in analytics that it has a name: the **star schema**. This lesson names its parts, compares it with its more normalised cousin, the snowflake, and then settles a question every one of those tables forces on you: what should its key be?

The key question matters more than it looks. The telemetry table for a six-thousand-satellite fleet gets trillions of rows a year, and every one of them carries the keys of the tables it points to. A key that is a few bytes too big, or one that changes when it should not, is a problem multiplied by a trillion.

## Facts and dimensions

Every analytics question about telemetry has the same shape: *measure something*, *sliced by something*. "Average battery charge, by orbital plane, per day." "Maximum bus temperature, by subsystem owner, last week." The first part is a number that was measured. The second part is how you want to group and filter it.

A **fact table** holds the measurements: one row per event, with the numbers that were measured and keys pointing to what the event was about. Its rows are called **facts**. In telemetry, one fact is one sample: which satellite, which channel, when, and the value.

A **dimension table** holds the descriptions: one row per thing, with all the attributes you might want to group or filter by. The satellite dimension has the name, catalog numbers, plane and inclination. The channel dimension has the mnemonic, the subsystem and the units. A dimension row is written once and referenced by millions or billions of facts.

Before you design a fact table, you state its **[[grain|grain-word]]**: exactly what one row represents. For our fact table the grain is "one sample of one channel from one satellite at one instant". Writing the grain down stops a common mistake — mixing rows at different grains (say, raw samples and per-minute averages) in one table, where a `SUM` or `COUNT` would then add apples to baskets of apples.

::: key Facts and dimensions
A **fact table** holds measurements, one row per event at a stated **grain**, with foreign keys to the dimensions. A **dimension table** holds descriptive attributes used to filter and group, one row per thing. Facts are tall and thin; dimensions are short and wide.
:::

## The star schema

Here is the fleet as a star. Two dimensions and one fact table, in PostgreSQL:

```sql
CREATE TABLE dim_satellite (
  sat_key    int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  norad_id   int  NOT NULL UNIQUE,
  cospar_id  text NOT NULL UNIQUE,
  sat_name   text NOT NULL,
  plane      int  NOT NULL,
  incl_deg   numeric NOT NULL
);
CREATE TABLE dim_channel (
  channel_key smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mnemonic    text NOT NULL UNIQUE,
  subsystem   text NOT NULL,
  units       text NOT NULL
);
CREATE TABLE fact_sample (
  sat_key     int      NOT NULL REFERENCES dim_satellite,
  channel_key smallint NOT NULL REFERENCES dim_channel,
  ts          timestamptz NOT NULL,
  value       double precision,
  PRIMARY KEY (sat_key, channel_key, ts)
);
```

The names follow a habit many teams use: `dim_` for dimensions and `fact_` for facts, so anyone reading a query knows which is which. Drawn out, the fact table sits in the middle and each dimension hangs off it by one foreign key, like the points of a **[[star|star-picture]]**. Every dimension is exactly one join away from the facts.

A star-schema query always has the same rhythm: start from the facts, join each dimension you need, filter on dimension columns, group by dimension columns, aggregate fact columns.

```sql
SELECT s.plane, c.subsystem, c.mnemonic, round(avg(f.value)::numeric, 3) AS mean, count(*) AS n
FROM fact_sample f
JOIN dim_satellite s ON s.sat_key = f.sat_key
JOIN dim_channel   c ON c.channel_key = f.channel_key
WHERE c.subsystem = 'EPS'
GROUP BY s.plane, c.subsystem, c.mnemonic
ORDER BY s.plane, c.mnemonic;
```

```text
 plane | subsystem | mnemonic |  mean  | n
-------+-----------+----------+--------+---
     1 | EPS       | BATT_SOC |  0.757 | 3
     1 | EPS       | BATT_V   | 15.933 | 3
     3 | EPS       | BATT_SOC |  0.660 | 1
     3 | EPS       | BATT_V   | 15.800 | 1
(4 rows)
```

EPS is the **[[electrical power subsystem|eps]]**; its channels here are battery charge and battery voltage. (The fact table holds twelve samples: three channels for SAT-001 at two minutes, and for Pathfinder-2 and Relay-3 at one minute each. The `::numeric` cast is there because `round(x, 3)` in PostgreSQL wants a `numeric`, and `avg` of a `double precision` column returns a `double precision`.)

Notice what the fact rows do *not* contain: no names, no units, no subsystem. Those live once, in the dimensions. Notice also what the query did not need: any join between dimensions. That is the point of a star — every question is "facts plus a few one-hop joins", which databases and analytics tools handle very well.

## The snowflake schema

A star's dimensions are usually left a little *denormalised* on purpose. `dim_satellite` holds both `plane` and `incl_deg`, which you know from last lesson is a transitive dependency (`sat_id → plane → incl_deg`). In a dimension that is often an accepted trade: dimensions are small (six thousand satellites, a few thousand channels), rarely updated, and every extra table is another join in every query.

If you normalise the dimensions anyway, each dimension grows its own smaller dimensions, and the drawing starts to branch like a **[[snowflake|snowflake-picture]]**. That is the **snowflake schema**: a star whose dimension tables are normalised into further tables.

```sql
CREATE TABLE dim_plane (plane int PRIMARY KEY, incl_deg numeric NOT NULL, alt_km int NOT NULL);
CREATE TABLE dim_subsystem (subsystem text PRIMARY KEY, owner_team text NOT NULL);
CREATE TABLE snow_satellite (sat_key int PRIMARY KEY, norad_id int UNIQUE, sat_name text,
                             plane int REFERENCES dim_plane);
CREATE TABLE snow_channel (channel_key smallint PRIMARY KEY, mnemonic text UNIQUE,
                           subsystem text REFERENCES dim_subsystem, units text);
```

Now a question about inclination and owning team needs four joins instead of two:

```sql
SELECT p.incl_deg, ss.owner_team, round(avg(f.value)::numeric, 3) AS mean, count(*) AS n
FROM fact_sample f
JOIN snow_satellite s ON s.sat_key = f.sat_key
JOIN dim_plane p      ON p.plane = s.plane
JOIN snow_channel c   ON c.channel_key = f.channel_key
JOIN dim_subsystem ss ON ss.subsystem = c.subsystem
WHERE c.mnemonic = 'BATT_V'
GROUP BY p.incl_deg, ss.owner_team ORDER BY p.incl_deg;
```

```text
 incl_deg | owner_team |  mean  | n
----------+------------+--------+---
     53.0 | Power      | 15.933 | 3
     70.0 | Power      | 15.800 | 1
(2 rows)
```

Same facts, same kind of answer, more joins. What you get back for them: a plane's altitude or a subsystem's owning team is stored once, so changing it is a one-row update.

::: key Star versus snowflake
A **star schema** has a central fact table joined directly to denormalised dimension tables, each one join away. A **snowflake schema** normalises the dimensions into sub-dimensions, so some attributes are two or more joins away. Stars are simpler and usually faster to query; snowflakes store each dimension fact once. Most analytics teams choose the star unless a dimension is large or changes often.
:::

::: warning Normalise facts, relax dimensions — not the other way around
The redundancy you allow in a star lives in the *small* tables. Copying a satellite's plane into six thousand dimension rows is harmless. Copying it into ten trillion fact rows is the sheet from last lesson again. If you find yourself adding a descriptive column to the fact table "to save a join", stop: it belongs in a dimension.
:::

## Natural keys: identifiers the world already gave you

Now the keys. Each dimension row needs a primary key, and there are two families to choose from.

A **natural key** is an identifier that already exists in the real world, outside your database, and means something to people. Satellites and channels come with several:

- The **NORAD catalog number** (also called the satellite catalog number): a whole number the US Space Force assigns to every tracked object in orbit. The International Space Station is 25544.
- The **COSPAR ID**, or international designator: launch year, the launch's number within that year, and a letter for each piece that launch put in orbit. The ISS's first module is 1998-067A.
- The **channel mnemonic**: the short name the telemetry dictionary gives a channel, such as `BATT_SOC` or `BUS_TEMP`.

Natural keys are attractive because everybody already uses them. An operator says "25544", not "row 7". But they have three weaknesses that bite in a telemetry database:

1. **They may not exist yet.** A satellite is catalogued only after it has been tracked in orbit. For the first hours or days after launch, your own satellite has telemetry but no NORAD number.
2. **They can change or be wrong.** When a rocket drops off dozens of satellites at once, the catalog sometimes pairs numbers with the wrong objects for a while and later corrects them. Channel mnemonics get renamed when the telemetry dictionary is revised.
3. **They can run out or change format.** The catalog number was designed with **[[five digits|norad-digits]]**, and the number of tracked objects is closing in on that limit.

If a natural key is your primary key, every one of those events means rewriting the key in every fact row that points to it — billions of rows — and updating every foreign key along the way.

## Surrogate keys: identifiers you make up

A **surrogate key** is an identifier the database invents, with no meaning outside it: usually a counter (1, 2, 3, …) or a random unique value. The satellite's real-world numbers are still stored, as ordinary columns with a `UNIQUE` constraint, so you can still look a satellite up by them. They are not what other tables point at.

PostgreSQL gives you three common ways to make one.

**An identity column** is the SQL-standard way (PostgreSQL 10 and later):

```sql
sat_key int GENERATED ALWAYS AS IDENTITY PRIMARY KEY
```

Read it as "sat_key is an integer that the database always generates itself". Insert rows without mentioning it, and `RETURNING` shows what was assigned:

```sql
INSERT INTO dim_satellite (norad_id, cospar_id, sat_name, plane, incl_deg) VALUES
 (60101,'2024-012A','Pathfinder-1',1,53.0),
 (60102,'2024-012B','Pathfinder-2',1,53.0),
 (60315,'2024-047C','Relay-3',3,70.0)
RETURNING sat_key, norad_id, sat_name;
```

```text
 sat_key | norad_id |   sat_name
---------+----------+--------------
       1 |    60101 | Pathfinder-1
       2 |    60102 | Pathfinder-2
       3 |    60315 | Relay-3
(3 rows)
```

(These catalog numbers and designators are made up for the example.) `ALWAYS` means the database refuses a hand-typed value:

```sql
INSERT INTO dim_satellite (sat_key, norad_id, cospar_id, sat_name, plane, incl_deg)
VALUES (99, 60999, '2025-001A', 'Test', 1, 53.0);
```

```text
ERROR:  cannot insert a non-DEFAULT value into column "sat_key"
DETAIL:  Column "sat_key" is an identity column defined as GENERATED ALWAYS.
HINT:  Use OVERRIDING SYSTEM VALUE to override.
```

That refusal protects the counter: if someone slipped in 99 by hand, the counter would one day reach 99 on its own and collide. (`GENERATED BY DEFAULT AS IDENTITY` allows hand-typed values, for loading old data.)

**`serial`** is the older PostgreSQL shorthand, `sat_key serial PRIMARY KEY`. It creates the same kind of counter (a **sequence**) but does not block hand-typed values. You will see it in many existing schemas; for new tables, prefer identity.

**A UUID** — a **[[universally unique identifier|uuid-hex]]** — is a 128-bit random value written as 32 hexadecimal digits in five groups:

```sql
SELECT gen_random_uuid() AS a_uuid;
```

```text
                a_uuid
--------------------------------------
 55d74bf0-b541-44a5-9550-4c48dccfa63a
(1 row)
```

(You will get a different one; that is the point.) A UUID can be generated anywhere — on a ground-station computer, in an ingest service, on two continents at once — without asking a central counter, and two will essentially never collide. The cost is size and order: a UUID is 16 bytes, and random ones scatter new rows all over an index instead of appending at the end, which slows heavy inserts (lesson 7 comes back to write cost).

In SQLite, where the exercises run, a column declared `INTEGER PRIMARY KEY` is the surrogate counter: leave it out of an `INSERT` and SQLite fills in 1, 2, 3, …. SQLite has no built-in UUID function, so UUIDs there come from your application.

::: key Surrogate versus natural keys
A **natural key** comes from the real world (NORAD catalog number, COSPAR ID, channel mnemonic): meaningful, but it can be missing, wrong, renamed or reformatted. A **surrogate key** is generated by the database (`GENERATED ALWAYS AS IDENTITY`, `serial`, or a UUID): meaningless, stable and compact. The usual design is a surrogate primary key that facts reference, plus the natural key kept as a `UNIQUE NOT NULL` column for lookups.
:::

::: example What the key costs at fleet scale
**Setup.** The fleet stores 6,000 satellites × 50 channels × 1 sample per second. Every fact row carries a satellite key. How much disk does that one column take in a year, as an `int` surrogate versus a UUID?

**Rows per year.**

$$
6000 \times 50 \times 86\,400 \times 365 = 9.4608 \times 10^{12}
$$

**Measure the sizes.** PostgreSQL reports the stored size of each type:

```sql
SELECT pg_column_size(1::int) AS int_bytes, pg_column_size(1::bigint) AS bigint_bytes,
       pg_column_size(gen_random_uuid()) AS uuid_bytes;
```

```text
 int_bytes | bigint_bytes | uuid_bytes
-----------+--------------+------------
         4 |            8 |         16
(1 row)
```

**Multiply.** With `int`: $9.4608 \times 10^{12} \times 4 \approx 3.78 \times 10^{13}$ bytes, about $37.8\,\mathrm{TB}$. With a UUID: $\times 16 \approx 1.51 \times 10^{14}$ bytes, about $151\,\mathrm{TB}$. The difference is about $114\,\mathrm{TB}$ a year for one column, before indexes (which copy the key again) and before compression.

**Sanity check.** 16 bytes is four times 4 bytes, and 151 is four times 37.8. An `int` holds up to about 2.1 billion values — far more than six thousand satellites — so the small key costs nothing in range. (Compressed columnar storage, in lesson 11, shrinks all of these a lot, but the ratio between choices still matters.)
:::

::: warning A surrogate key does not stop duplicates by itself
With only `sat_key` as the key, inserting Pathfinder-1 twice gives two rows, keys 1 and 4, both perfectly valid to the database. The natural key is what says "this is the same satellite". Always pair a surrogate key with a `UNIQUE` constraint on the natural key, as `dim_satellite` does on `norad_id` and `cospar_id`. The next lesson shows exactly what `UNIQUE` refuses.
:::

## When a dimension changes: slowly changing dimensions

Dimensions are called "slowly changing" because their rows do change, but rarely. A satellite gets renamed, or raises its orbit into a different plane. What should the dimension do?

Take Relay-3. It flew in plane 3 until 10 March 2026, when it moved to plane 4. There are three classic answers, known by numbers.

- **Type 1: overwrite.** `UPDATE` the row to plane 4. Simple, but history is rewritten: every old sample now looks as if it came from plane 4.
- **Type 2: add a new row.** Close the old row and insert a new one with a new surrogate key and the [[dates it is valid for|scd-timeline]]. Old facts keep pointing at the old row.
- **Type 3: add a column.** Keep `plane` and add `previous_plane`. Holds one step of history and no more.

Type 2 is the one analytics teams mean when they say they "track history", and it only works with surrogate keys — the whole trick is that one satellite can have several dimension rows.

::: example A type 2 change for Relay-3
**The dimension.** Each row carries the period it is valid for. `valid_to` is NULL while the row is current. The natural key is no longer unique on its own, so the unique constraint becomes `(norad_id, valid_from)`:

```sql
CREATE TABLE dim_sat_hist (
  sat_key    int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  norad_id   int  NOT NULL,
  sat_name   text NOT NULL,
  plane      int  NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_to   timestamptz,
  is_current boolean NOT NULL,
  UNIQUE (norad_id, valid_from)
);
```

Relay-3 starts with one row, `sat_key` 1, in plane 3, and two samples (8 and 9 March) point at it.

**The move.** Close the old row and open a new one, together:

```sql
BEGIN;
UPDATE dim_sat_hist SET valid_to = '2026-03-10Z', is_current = false
 WHERE norad_id = 60315 AND is_current;
INSERT INTO dim_sat_hist (norad_id, sat_name, plane, valid_from, valid_to, is_current)
 VALUES (60315, 'Relay-3', 4, '2026-03-10Z', NULL, true);
COMMIT;
SELECT * FROM dim_sat_hist ORDER BY sat_key;
```

```text
 sat_key | norad_id | sat_name | plane |       valid_from       |        valid_to        | is_current
---------+----------+----------+-------+------------------------+------------------------+------------
       1 |    60315 | Relay-3  |     3 | 2024-06-20 00:00:00+00 | 2026-03-10 00:00:00+00 | f
       2 |    60315 | Relay-3  |     4 | 2026-03-10 00:00:00+00 |                        | t
(2 rows)
```

`BEGIN` and `COMMIT` wrap the two changes so nobody ever sees Relay-3 with no current row, or with two; lesson 4 explains exactly how. New samples (11 and 12 March) are loaded with `sat_key` 2.

**History-correct answer.** Group by the plane on the row each fact points at:

```sql
SELECT d.plane, count(*) AS samples, round(avg(h.batt_soc),3) AS mean_soc
FROM hist_sample h JOIN dim_sat_hist d ON d.sat_key = h.sat_key
GROUP BY d.plane ORDER BY d.plane;
```

```text
 plane | samples | mean_soc
-------+---------+----------
     3 |       2 |    0.690
     4 |       2 |    0.820
(2 rows)
```

**Current-view answer.** To ask "as the fleet is today", hop through the natural key to the current row:

```sql
SELECT cur.plane, count(*) AS samples
FROM hist_sample h
JOIN dim_sat_hist d   ON d.sat_key = h.sat_key
JOIN dim_sat_hist cur ON cur.norad_id = d.norad_id AND cur.is_current
GROUP BY cur.plane;
```

```text
 plane | samples
-------+---------
     4 |       4
(1 row)
```

**Check.** Four samples in both answers — 2 + 2 and 4 — so no rows were lost or doubled. The means make sense: $(0.70 + 0.68)/2 = 0.69$ before the move, $(0.81 + 0.83)/2 = 0.82$ after.
:::

::: key Slowly changing dimensions
**Type 1** overwrites (no history). **Type 2** closes the old row and inserts a new one with a new surrogate key and a validity period, so old facts keep their original context. **Type 3** keeps one previous value in an extra column. Type 2 needs surrogate keys.
:::

## Check yourself

::: check
A table `pass_summary` has one row per ground-station pass with columns `station_key`, `sat_key`, `aos_ts`, `bytes_downlinked`, `max_elevation_deg`. Is it a fact table or a dimension table, and what is its grain?
:::

::: answer
It is a **fact table**: each row is an event (a pass) with measurements (`bytes_downlinked`, `max_elevation_deg`) and keys to dimensions (station and satellite). Its grain is "one pass of one satellite over one ground station", identified by `(station_key, sat_key, aos_ts)`. The station's name, location and antenna size would live in a station dimension.
:::

::: check
Your team's channel dimension is `dim_channel(channel_key, mnemonic, subsystem, subsystem_owner, subsystem_lead_email)`. Is this a star or a snowflake dimension? What would the other design look like, and what would it cost each query?
:::

::: answer
It is a **star** dimension: `subsystem_owner` and `subsystem_lead_email` depend on `subsystem`, not on the channel, so the table is deliberately not in 3NF. The **snowflake** version moves them into `dim_subsystem(subsystem PRIMARY KEY, owner, lead_email)` and keeps only `subsystem` in `dim_channel`. Every query that groups or filters by owner then needs one more join (facts → channel → subsystem), but changing a subsystem's lead is a one-row update instead of one per channel.
:::

::: check
Give two concrete reasons not to make the NORAD catalog number the primary key that fact rows reference.
:::

::: answer
Any two of: (1) a newly launched satellite has no catalog number for its first hours or days, yet it is already sending telemetry that must be stored; (2) catalog numbers are sometimes assigned to the wrong object after a multi-satellite deployment and corrected later, which would mean rewriting every fact row; (3) the five-digit number is running out and changing format. Keep it as a `UNIQUE` column in the dimension and point the facts at a surrogate key.
:::

::: check
The fact table uses `channel_key smallint` (2 bytes) instead of storing the mnemonic text such as `BATT_SOC`, which takes 9 bytes in a PostgreSQL row. For $9.46 \times 10^{12}$ rows a year, roughly how much space does that save, uncompressed?
:::

::: answer
The saving is $9 - 2 = 7$ bytes per row. $9.46 \times 10^{12} \times 7 \approx 6.62 \times 10^{13}$ bytes, about $66\,\mathrm{TB}$ a year. A `smallint` holds up to 32,767 values, comfortably more than the few thousand channels a satellite type has. The mnemonic is still stored once, in `dim_channel`.
:::

::: check
A satellite is renamed from Relay-3 to Relay-3B. Your analysts want old plots to keep the old name, but the operations dashboard to show the new one. Which slowly-changing-dimension type fits, and which query pattern serves each audience?
:::

::: answer
**Type 2**: close the old row (`valid_to` set, `is_current = false`) and insert a new row with a new `sat_key` and the new name. Old facts still point at the old row, so the analysts' history-correct query — join each fact to the dimension row it references — shows Relay-3 for old samples. The operations dashboard joins through the natural key to the row with `is_current = true`, so every sample, old or new, shows Relay-3B.
:::

## Summary

| Idea | Meaning |
| --- | --- |
| Fact table | measurements, one row per event at a stated grain, keys to dimensions |
| Dimension table | descriptive attributes to filter and group by, one row per thing |
| Grain | exactly what one fact row represents |
| Star schema | facts joined directly to denormalised dimensions |
| Snowflake schema | dimensions normalised into sub-dimensions; more joins |
| Natural key | NORAD catalog number, COSPAR ID, channel mnemonic |
| Surrogate key | `GENERATED ALWAYS AS IDENTITY`, `serial`, UUID |
| Key sizes | `int` 4 bytes, `bigint` 8, UUID 16 |
| SCD type 1 / 2 / 3 | overwrite / new row with validity dates / previous-value column |

Several times this lesson said "a `UNIQUE` constraint does that" or "the database refuses it". Next lesson is about exactly those refusals: `NOT NULL`, `UNIQUE`, `CHECK` and foreign keys, and what each one does when a delete would leave a fact pointing at nothing.

::: context grain-word Why "grain"
Think of the grain of a photograph or of sand: how fine the smallest piece is. A fact table at the grain of "one sample" is as fine as the data gets; one at "one satellite per minute" is coarser, each row already a summary. You can always roll a fine grain up into a coarse one with GROUP BY, but you can never get the fine detail back out of a coarse table. That is why telemetry teams keep the raw samples as the base fact table and build coarser rollups beside it, never instead of it.
:::

::: context star-picture The star, drawn
The fact table in the middle holds the keys and the measured value. Each dimension is one arrow away. Adding a new way to slice the data — a ground-station dimension, say — adds one more point to the star and one more key column to the facts.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="68" width="120" height="58" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="86" font-size="13" font-weight="700" fill="#1f2a44" text-anchor="middle">fact_sample</text>
  <text x="180" y="102" font-size="11" fill="#1f2a44" text-anchor="middle">sat_key, channel_key</text>
  <text x="180" y="117" font-size="11" fill="#1f2a44" text-anchor="middle">ts, value</text>
  <rect x="8" y="8" width="112" height="46" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="64" y="27" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">dim_satellite</text>
  <text x="64" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">name, plane, incl</text>
  <rect x="240" y="8" width="112" height="46" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="296" y="27" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">dim_channel</text>
  <text x="296" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">mnemonic, units</text>
  <rect x="124" y="140" width="112" height="44" rx="6" fill="#ffffff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="180" y="158" font-size="12" font-weight="700" fill="#6c7a93" text-anchor="middle">dim_station</text>
  <text x="180" y="175" font-size="11" fill="#6c7a93" text-anchor="middle">(a new point)</text>
  <line x1="130" y1="68" x2="104" y2="54" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="230" y1="68" x2="256" y2="54" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="126" x2="180" y2="140" stroke="#6c7a93" stroke-width="2" stroke-dasharray="4 3"/>
</svg>
```
:::

::: context eps The power subsystem
A spacecraft is built from **subsystems**, each owned by a team: EPS (electrical power: solar arrays, batteries, power distribution), thermal, attitude control, communications, propulsion, and flight software. Telemetry channels are grouped by subsystem, which is why "subsystem" is such a natural dimension column — the power team wants every EPS channel, the thermal team every THERMAL channel. Battery state of charge and battery voltage are two of the most-watched EPS channels on any satellite, because a battery that runs flat in eclipse can end a mission.
:::

::: context snowflake-picture The snowflake, drawn
In the snowflake version, the plane and subsystem facts moved out of the dimensions into tables of their own. Arrows now reach two steps out from the facts.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="52" width="100" height="44" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="79" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">fact_sample</text>
  <rect x="12" y="52" width="92" height="44" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="58" y="79" font-size="12" fill="#1f2a44" text-anchor="middle">satellite</text>
  <rect x="256" y="52" width="92" height="44" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="302" y="79" font-size="12" fill="#1f2a44" text-anchor="middle">channel</text>
  <rect x="12" y="116" width="92" height="30" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="58" y="136" font-size="12" fill="#1f2a44" text-anchor="middle">plane</text>
  <rect x="256" y="116" width="92" height="30" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="302" y="136" font-size="12" fill="#1f2a44" text-anchor="middle">subsystem</text>
  <line x1="130" y1="74" x2="104" y2="74" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="230" y1="74" x2="256" y2="74" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="58" y1="96" x2="58" y2="116" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="302" y1="96" x2="302" y2="116" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="24" font-size="11" fill="#6c7a93" text-anchor="middle">one hop: satellite, channel</text>
  <text x="180" y="138" font-size="11" fill="#6c7a93" text-anchor="middle">two hops: plane, subsystem</text>
</svg>
```
:::

::: context norad-digits Running out of catalog numbers
Five digits allow catalog numbers up to 99,999, and with large constellations and debris from breakups, the count of catalogued objects is closing in on that. Much older software stores the number in a fixed five-character field — the classic "two-line element" format for orbits has exactly five columns for it. A stopgap called Alpha-5 replaces the first digit with a letter so the same five characters reach further, and newer data formats allow longer numbers. Any database that used the catalog number as a five-digit key would have to change its key. A surrogate key does not care.
:::

::: context uuid-hex Reading a UUID
A UUID is 128 bits. Written in hexadecimal — base 16, digits 0 to 9 then a to f — each digit carries 4 bits, so it takes 32 digits, grouped 8-4-4-4-12 with dashes. The random kind (version 4, which `gen_random_uuid()` makes) has 122 random bits; the digit right after the second dash is always 4, which you can see in the example. With $2^{122}$ possibilities, generating a billion every second for a whole year gives about a 1-in-10,000 chance of even one repeat. Newer "version 7" UUIDs put a timestamp in the first bits so they arrive in order, which is kinder to indexes; PostgreSQL 18 added a function for them.
:::

::: context scd-timeline Two rows, one satellite
Each fact points at the dimension row that was current when it was loaded. The validity periods meet exactly at the change time and never overlap.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="16" y1="70" x2="344" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="344,70 335,65 335,75" fill="#1f2a44"/>
  <rect x="16" y="46" width="184" height="20" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="108" y="60" font-size="11" fill="#1f2a44" text-anchor="middle">sat_key 1: plane 3</text>
  <rect x="200" y="46" width="130" height="20" fill="#f2b880" stroke="#1f2a44"/>
  <text x="265" y="60" font-size="11" fill="#1f2a44" text-anchor="middle">sat_key 2: plane 4</text>
  <line x1="200" y1="36" x2="200" y2="84" stroke="#b4232c" stroke-width="2"/>
  <text x="200" y="30" font-size="11" fill="#b4232c" text-anchor="middle">10 Mar: moved</text>
  <circle cx="150" cy="96" r="4" fill="#1d6fd1"/><circle cx="175" cy="96" r="4" fill="#1d6fd1"/>
  <circle cx="225" cy="96" r="4" fill="#1f2a44"/><circle cx="250" cy="96" r="4" fill="#1f2a44"/>
  <text x="162" y="118" font-size="11" fill="#1d6fd1" text-anchor="middle">8, 9 Mar</text>
  <text x="238" y="118" font-size="11" fill="#1f2a44" text-anchor="middle">11, 12 Mar</text>
</svg>
```
:::
