---
id: l01-normalisation
title: Normalisation, and when to break it
minutes: 23
covers:
  - Normalisation to third normal form and deliberate denormalisation for analytics
---

Picture a class sign-up sheet that has been passed around for a whole school year. Every time someone signs up for a club, they write their name, their homeroom, their homeroom teacher's name and the club's meeting room on a fresh line. Then the math teacher gets married and changes her name. Somebody fixes it on three lines and misses the other forty. Now the sheet says two different things about the same teacher, and nobody can tell which one is right.

That sheet has a design problem, not a spelling problem. The same fact — who teaches homeroom 7B — is written down many times, so it can be written down *differently*. Every one of those copies is a chance to disagree.

This module is about designing storage for a real fleet: six thousand satellites, each sending dozens of measurements every second, kept for years. Before indexes, partitions and ingest pipelines, you need tables that cannot contradict themselves. The method for getting there is called **[[normalisation|codd]]** — rearranging columns into tables so that each fact is stored in exactly one place. By the end of this lesson you will be able to take a messy telemetry table apart into clean ones, prove you lost nothing, and then — on purpose, for speed — glue some of it back together.

## The spreadsheet that became a table

Real telemetry databases often start as a spreadsheet that one engineer kept during early testing. It gets imported into a database as-is, and then a pipeline keeps appending rows to it. Here is one, in PostgreSQL, trimmed to seven rows:

```sql
CREATE TABLE sheet (
  sat_id text NOT NULL, sat_name text, plane int, plane_incl_deg numeric,
  ts timestamptz NOT NULL, channel text NOT NULL, units text, value numeric,
  PRIMARY KEY (sat_id, ts, channel)
);
SELECT * FROM sheet;
```

```text
 sat_id  |   sat_name   | plane | plane_incl_deg |           ts           | channel  |  units   | value
---------+--------------+-------+----------------+------------------------+----------+----------+-------
 SAT-001 | Pathfinder-1 |     1 |           53.0 | 2026-03-01 00:00:00+00 | BATT_SOC | fraction |  0.94
 SAT-001 | Pathfinder-1 |     1 |           53.0 | 2026-03-01 00:00:00+00 | BUS_TEMP | degC     |  18.2
 SAT-001 | Pathfinder-1 |     1 |           53.0 | 2026-03-01 00:01:00+00 | BATT_SOC | fraction |  0.91
 SAT-001 | Pathfinder-1 |     1 |           53.0 | 2026-03-01 00:01:00+00 | BUS_TEMP | degC     |  18.4
 SAT-002 | Pathfinder-2 |     1 |           53.0 | 2026-03-01 00:00:00+00 | BATT_SOC | fraction |  0.42
 SAT-002 | Pathfinder-2 |     1 |           53.0 | 2026-03-01 00:00:00+00 | BUS_TEMP | degC     |  24.9
 SAT-006 | Relay-3      |     3 |           70.0 | 2026-03-01 00:00:00+00 | BATT_SOC | fraction |  0.66
(7 rows)
```

Read the columns once. `sat_id` and `sat_name` identify the satellite. `plane` is its orbital plane, and `plane_incl_deg` is that plane's **[[inclination|inclination]]** — the tilt of the orbit against the equator, in degrees. `ts` is the sample time, stored as `timestamptz` so it is an unambiguous instant in UTC, as you learned in the first SQL module. `channel` is what was measured, `units` says how, and `value` is the number.

The primary key is `(sat_id, ts, channel)`: one satellite, one moment, one measurement. That part is right. The trouble is everything else that rides along on every row.

## Three ways a table can lie

A table that stores one fact in many places misbehaves in three recognisable ways. Database people call them **anomalies** — situations where an ordinary insert, update or delete leaves the data wrong or makes a fact impossible to record.

### The update anomaly

Mission control renames SAT-001 to Pathfinder-1A. A script updates the rows it can see — the ones from the first minute:

```sql
UPDATE sheet SET sat_name = 'Pathfinder-1A'
WHERE sat_id = 'SAT-001' AND ts = '2026-03-01 00:00:00Z';
SELECT sat_id, sat_name, count(*) FROM sheet GROUP BY sat_id, sat_name ORDER BY 1, 2;
```

```text
UPDATE 2
 sat_id  |   sat_name    | count
---------+---------------+-------
 SAT-001 | Pathfinder-1  |     2
 SAT-001 | Pathfinder-1A |     2
 SAT-002 | Pathfinder-2  |     2
 SAT-006 | Relay-3       |     1
(4 rows)
```

SAT-001 now has two names. Nothing failed, no error appeared, and a dashboard grouping by `sat_name` will show two satellites where there is one. An **update anomaly** is this: changing one real-world fact needs many row changes, and missing any of them leaves the table contradicting itself.

### The insert anomaly

A new satellite, SAT-009 "Relay-4", launches into plane 3. It has not sent a single reading yet, but operators want it on the fleet list today. Try to record it:

```sql
INSERT INTO sheet (sat_id, sat_name, plane, plane_incl_deg)
VALUES ('SAT-009', 'Relay-4', 3, 70.0);
```

```text
ERROR:  null value in column "ts" of relation "sheet" violates not-null constraint
DETAIL:  Failing row contains (SAT-009, Relay-4, 3, 70.0, null, null, null, null).
```

The table cannot hold a satellite without a reading, because every row *is* a reading. An **insert anomaly** is this: you cannot record one fact until some unrelated fact exists. The usual "fix" is worse — someone invents a fake reading with a made-up time and channel, and now the telemetry has a sample that never happened.

### The delete anomaly

SAT-006 is the only satellite in plane 3 with data here. A retention job deletes its old readings:

```sql
DELETE FROM sheet WHERE sat_id = 'SAT-006';
SELECT DISTINCT plane, plane_incl_deg FROM sheet ORDER BY plane;
```

```text
DELETE 1
 plane | plane_incl_deg
-------+----------------
     1 |           53.0
(1 row)
```

Plane 3 — and the fact that it is inclined at 70 degrees — has vanished from the database. Nobody asked to forget it. A **delete anomaly** is this: removing one fact destroys a different fact that happened to live on the same row.

::: key The three anomalies
Redundancy causes **update anomalies** (one fact, many copies, some missed), **insert anomalies** (cannot record a fact without an unrelated one) and **delete anomalies** (removing one fact loses another). Normalisation removes them by storing each fact once.
:::

## What depends on what

To fix the table you need a precise way to say "this column's value is decided by that column". That idea is a **functional dependency**. We write it with an arrow:

```text
sat_id → sat_name
```

Read it aloud as "sat_id determines sat_name". It means: any two rows with the same `sat_id` must have the same `sat_name`. Knowing the satellite pins down its name. It is a statement about the *meaning* of the data, which you learn by asking the people who own it — not by staring at seven rows, where coincidences can fool you.

For the sheet, the dependencies are:

```text
sat_id                → sat_name, plane
plane                 → plane_incl_deg
channel               → units
(sat_id, ts, channel) → value
```

Each line is a real rule of the fleet. A satellite has one name and flies in one plane. A plane has one inclination. A channel is always reported in the same units. And a measurement is decided only by all three parts of the key together.

A **candidate key** is a smallest set of columns that determines every other column. Here `(sat_id, ts, channel)` is the only one. Columns inside a candidate key are **key columns**; the rest are **non-key columns**.

::: key Functional dependency
`A → B` ("A determines B") means rows that agree on A must agree on B. Normal forms are rules about which dependencies a table may contain.
:::

## First normal form: one value per cell

Before the sheet above existed, there was an even messier ancestor — an operations log where somebody typed several readings into one cell:

```text
 sat_id  |   sat_name   |      minute      |     batt_soc
---------+--------------+------------------+------------------
 SAT-001 | Pathfinder-1 | 2026-03-01 00:00 | 0.94, 0.91, 0.89
 SAT-002 | Pathfinder-2 | 2026-03-01 00:00 | 0.42, 0.40
```

The database sees `batt_soc` as text, so it cannot do arithmetic on it:

```sql
SELECT avg(batt_soc) FROM ops_log;
```

```text
ERROR:  function avg(text) does not exist
```

A table is in **first normal form (1NF)** when every cell holds one **[[atomic|atomic]]** value — a single value the database treats as a whole — there are no **repeating groups** (lists in a cell, or columns named `soc_1`, `soc_2`, `soc_3`), and every row can be told apart by a key. The fix is one row per reading. PostgreSQL can split the list for you, which is how a one-off cleanup would do it:

```sql
SELECT sat_id, unnest(string_to_array(batt_soc, ', '))::numeric AS soc FROM ops_log;
```

```text
 sat_id  | soc
---------+------
 SAT-001 | 0.94
 SAT-001 | 0.91
 SAT-001 | 0.89
 SAT-002 | 0.42
 SAT-002 | 0.40
(5 rows)
```

`string_to_array` cuts the text at each comma-and-space into an array, `unnest` turns an array into one row per element, and `::numeric` (read "cast to numeric") makes each piece a number. Notice the lost information, though: the log said "minute 00:00" for all three SAT-001 values, so the time of each sample is gone. Repeating groups usually hide missing detail like this.

The `sheet` table is already in 1NF: one value per cell, and a primary key.

## Second normal form: the whole key

Look at `sat_name` in the sheet. The key is `(sat_id, ts, channel)`, but `sat_name` depends on only one part of it, `sat_id`. The time and the channel have nothing to do with the name. A dependency on part of a composite key is a **partial dependency**, and it is exactly what made the name repeat on every reading.

A table is in **second normal form (2NF)** when it is in 1NF and no non-key column depends on only part of a candidate key. The cure is to move each partially dependent group into its own table, keyed by the part it depends on:

- `sat_name` and `plane` depend on `sat_id` alone → a `satellite` table keyed by `sat_id`.
- `units` depends on `channel` alone → a `channel` table keyed by `channel`.
- `value` depends on the whole key → it stays, in a `reading` table.

(A table whose key is a single column cannot have a partial dependency, so it is automatically in 2NF once it is in 1NF.)

## Third normal form: nothing but the key

After that split, the `satellite` table would hold `sat_id`, `sat_name`, `plane` and `plane_incl_deg`. Its key is `sat_id`, and every column depends on it — but `plane_incl_deg` depends on it only *through* `plane`:

```text
sat_id → plane → plane_incl_deg
```

That chain is a **[[transitive dependency|transitive-dependency]]**: a non-key column determined by another non-key column. It is why 70.0 would be copied onto every satellite in plane 3, and why deleting the last one forgot the plane.

A table is in **[[third normal form (3NF)|beyond-3nf]]** when it is in 2NF and no non-key column depends on another non-key column. The cure is the same move again: give `plane` its own table, `orbital_plane`, and keep only `plane` in `satellite` as a foreign key.

::: key The normal forms, in one line each
**1NF**: one atomic value per cell, no repeating groups, rows identified by a key. **2NF**: 1NF, and every non-key column depends on the *whole* key (no partial dependencies). **3NF**: 2NF, and no non-key column depends on another non-key column (no transitive dependencies). In a phrase: every non-key column depends on the key, the whole key, and nothing but the key.
:::

::: warning Dependencies come from meaning, not from the data you happen to have
In the seven rows, every satellite in plane 1 has a name starting "Pathfinder". That does not mean `plane → sat_name`. The next satellite launched into plane 1 might be called anything. Ask what the rule *is* in the real fleet; a sample can only disprove a dependency, never prove one.
:::

::: example Decomposing the telemetry sheet into 3NF
**Step 1: write one table per determinant.** A **[[determinant|four-tables]]** is the left side of a dependency arrow. There are four: `(sat_id, ts, channel)`, `sat_id`, `plane` and `channel`. Each becomes a table keyed by it.

```sql
CREATE TABLE orbital_plane (plane int PRIMARY KEY, incl_deg numeric NOT NULL);
CREATE TABLE satellite (sat_id text PRIMARY KEY, sat_name text NOT NULL,
                        plane int NOT NULL REFERENCES orbital_plane);
CREATE TABLE channel (channel text PRIMARY KEY, units text NOT NULL);
CREATE TABLE reading (sat_id text REFERENCES satellite, ts timestamptz,
                      channel text REFERENCES channel, value numeric,
                      PRIMARY KEY (sat_id, ts, channel));
```

`REFERENCES orbital_plane` with no column list points at that table's primary key.

**Step 2: fill them from the sheet.** `SELECT DISTINCT` collapses the repeated copies to one row per fact:

```sql
INSERT INTO orbital_plane SELECT DISTINCT plane, plane_incl_deg FROM sheet;
INSERT INTO satellite     SELECT DISTINCT sat_id, sat_name, plane FROM sheet;
INSERT INTO channel       SELECT DISTINCT channel, units FROM sheet;
INSERT INTO reading       SELECT sat_id, ts, channel, value FROM sheet;
```

```text
INSERT 0 2
INSERT 0 3
INSERT 0 2
INSERT 0 7
```

Two planes, three satellites, two channels, seven readings. (Had the rename mistake been left in, `satellite` would have received two rows for SAT-001 and the primary key would have refused the second — normalising often exposes contradictions like that, which is a feature.)

**Step 3: prove nothing was lost.** Join the four tables back together and compare with the original in both directions using `EXCEPT` from the joins module:

```sql
(SELECT r.sat_id, s.sat_name, s.plane, p.incl_deg, r.ts, r.channel, c.units, r.value
   FROM reading r JOIN satellite s USING (sat_id)
   JOIN orbital_plane p USING (plane) JOIN channel c USING (channel)
 EXCEPT SELECT * FROM sheet)
UNION ALL
(SELECT * FROM sheet EXCEPT
 SELECT r.sat_id, s.sat_name, s.plane, p.incl_deg, r.ts, r.channel, c.units, r.value
   FROM reading r JOIN satellite s USING (sat_id)
   JOIN orbital_plane p USING (plane) JOIN channel c USING (channel));
```

```text
 sat_id | sat_name | plane | incl_deg | ts | channel | units | value
--------+----------+-------+----------+----+---------+-------+-------
(0 rows)
```

Zero rows each way: the join rebuilds the sheet exactly. The split is **[[lossless|lossless-join]]**.

**Step 4: check the anomalies are gone.**

```sql
UPDATE satellite SET sat_name = 'Pathfinder-1A' WHERE sat_id = 'SAT-001';
INSERT INTO satellite VALUES ('SAT-009', 'Relay-4', 3);
DELETE FROM reading WHERE sat_id = 'SAT-006';
SELECT s.sat_id, s.sat_name, p.incl_deg
FROM satellite s JOIN orbital_plane p USING (plane) WHERE plane = 3 ORDER BY 1;
```

```text
UPDATE 1
INSERT 0 1
DELETE 1
 sat_id  | sat_name | incl_deg
---------+----------+----------
 SAT-006 | Relay-3  |     70.0
 SAT-009 | Relay-4  |     70.0
(2 rows)
```

The rename touched one row. The new satellite went in with no reading. Deleting SAT-006's only reading left the satellite and its plane intact. **Sanity check:** 2 + 3 + 2 + 7 = 14 rows hold what the sheet's 7 wide rows held, but each name, inclination and unit is now written once.
:::

::: note Why one table per determinant works
Every non-key value in the old sheet was placed there because some determinant decided it. Put each determinant in its own table as the key, with exactly the columns it decides, and each fact has one home: its determinant's row. A join along the foreign keys then finds, for every reading, the one satellite row, the one plane row and the one channel row that belong to it, so it rebuilds each original row once — neither losing rows nor inventing extra ones.
:::

## How much the redundancy costs at fleet scale

Seven rows make the problem look small. The real fleet makes it enormous, and the numbers are worth doing once.

::: example How many copies of one name?
**Setup.** One satellite sends 50 channels at 1 sample per second for a year, into a sheet-shaped table that repeats `sat_name` on every row.

**Rows per satellite-year.** There are $86\,400$ seconds in a day and $365$ days in a year:

$$
50 \times 86\,400 \times 365 = 1\,576\,800\,000
$$

rows — about 1.58 billion copies of "Pathfinder-1".

**Space.** A 12-character text value takes 13 bytes in PostgreSQL (one length byte plus the characters). So the name alone costs $1\,576\,800\,000 \times 13 = 20\,498\,400\,000$ bytes, about $20.5\,\mathrm{GB}$, for one satellite for one year.

**The rename.** In the sheet, renaming SAT-001 must rewrite all 1.58 billion rows (and until it finishes, some rows disagree). In the 3NF design it is `UPDATE 1`.

**Whole fleet.** For 6,000 satellites the reading count is $6000 \times 1\,576\,800\,000 \approx 9.46 \times 10^{12}$ rows a year. **Sanity check:** that is the $2.59 \times 10^{10}$ readings a day of 50-channel, 1 Hz telemetry from the first SQL module, times 365 — it matches.
:::

## Breaking the rules on purpose

Normalisation makes writes safe. It makes some reads slower. Every question an analyst asks — "average bus temperature by plane, last month" — now needs joins, and a join across billions of readings is real work. Analytics tools and the engineers using them also prefer one wide, flat table they can filter and group without knowing the schema.

So teams **denormalise**: they deliberately store a copy of data in a less normalised shape, trading redundancy for faster, simpler reads. The rule that keeps this safe is about *which* copy is the truth.

- The normalised tables are the **[[source of truth|source-of-truth]]**. All writes go there, and only there.
- The denormalised table is **derived**: rebuilt from the source by a job you can re-run at any time. Nobody edits it by hand.
- The copy states how fresh it is ("rebuilt nightly at 02:00 UTC"), because between rebuilds it can be behind.

Common shapes of deliberate denormalisation in telemetry work:

- a **pre-joined flat table** with satellite name, plane and units on every reading, for analysts;
- a **[[wide table|wide-table]]** with one column per channel (`batt_soc`, `bus_temp`, …) and one row per satellite per second;
- **stored rollups** such as per-minute averages, which lesson 10 builds as materialised views.

::: example A flat table for the analysts
Build the pre-joined copy from the 3NF tables (after the rename, the new satellite and the deletion above):

```sql
CREATE TABLE reading_flat AS
SELECT r.sat_id, s.sat_name, s.plane, p.incl_deg, r.ts, r.channel, c.units, r.value
FROM reading r JOIN satellite s USING (sat_id)
JOIN orbital_plane p USING (plane) JOIN channel c USING (channel);
```

```text
SELECT 6
```

Six rows: the seven readings minus SAT-006's deleted one. Now an analyst's question needs no join:

```sql
SELECT plane, channel, round(avg(value), 3) AS mean_value, count(*) AS n
FROM reading_flat GROUP BY plane, channel ORDER BY plane, channel;
```

```text
 plane | channel  | mean_value | n
-------+----------+------------+---
     1 | BATT_SOC |      0.757 | 3
     1 | BUS_TEMP |     20.500 | 3
(2 rows)
```

**Check by hand.** Battery: $(0.94 + 0.91 + 0.42) / 3 = 2.27 / 3 \approx 0.757$. Temperature: $(18.2 + 18.4 + 24.9) / 3 = 61.5 / 3 = 20.5$. Plane 3 has no rows left, as expected.

The price: `reading_flat` now carries `sat_name` on every row. If SAT-002 is renamed tomorrow, the flat table is wrong until the next rebuild — which is fine, because it is a derived copy with a stated refresh time, and the truth is still in `satellite`.
:::

::: warning Denormalising the write path brings the anomalies back
If the ingest pipeline writes readings *directly* into a flat table with names and units on every row, you have rebuilt the sheet — with all three anomalies — at billions of rows. Denormalise downstream, in copies you can throw away and rebuild, never in the table that is the only record of what the satellite said.
:::

::: key Normalise the truth, denormalise the copies
Keep the source of truth in 3NF so every fact is written once. Build denormalised tables for analytics as derived, rebuildable copies with a stated freshness. A denormalised copy is a cache, not a record.
:::

## Check yourself

::: check
A table `pass(station_id, station_country, sat_id, aos_ts, los_ts)` records ground-station passes: `aos_ts` is when the satellite came over the horizon (acquisition of signal) and `los_ts` when it went below (loss of signal). Its key is `(station_id, aos_ts)`. Which normal form does it break, and how would you fix it?
:::

::: answer
`station_country` depends on `station_id` alone, which is only part of the key `(station_id, aos_ts)`. That is a partial dependency, so the table breaks **2NF** (it is fine for 1NF: one value per cell, and it has a key).

Fix: move the country into `station(station_id PRIMARY KEY, station_country)` and keep `pass(station_id REFERENCES station, aos_ts, sat_id, los_ts, PRIMARY KEY (station_id, aos_ts))`. Now a station's country is written once and a station can exist before its first pass.
:::

::: check
A `satellite(sat_id, sat_name, bus_model, bus_mass_kg)` table has key `sat_id`. Every satellite built on the same bus model has the same dry bus mass. Is the table in 3NF? What anomaly would you expect first?
:::

::: answer
No. `sat_id → bus_model → bus_mass_kg` is a transitive dependency: a non-key column (`bus_mass_kg`) is determined by another non-key column (`bus_model`). The table is in 2NF (single-column key, so no partial dependency) but not 3NF.

The first anomaly you would likely meet is an update anomaly: the bus mass is revised after a design change and only some satellites' rows get updated, so two satellites on the same bus disagree. Fix it with `bus(bus_model PRIMARY KEY, bus_mass_kg)` and keep `bus_model` in `satellite` as a foreign key.
:::

::: check
Someone proposes storing each satellite's channel list as one text column, `channels = 'BATT_SOC,BUS_TEMP,WHEEL_RPM'`, in the `satellite` table. Which normal form does that break, and what query becomes hard?
:::

::: answer
It breaks **1NF**: the cell holds a list, not one atomic value. Questions like "which satellites report WHEEL_RPM?" now need text searching (`LIKE '%WHEEL_RPM%'`, which also wrongly matches a channel called `WHEEL_RPM_2`), and the database cannot use a foreign key to check each name against the `channel` table. The 1NF design is a separate table `sat_channel(sat_id, channel, PRIMARY KEY (sat_id, channel))` with one row per pair.
:::

::: check
After decomposing a table, how can you show with a query that the decomposition lost no rows and invented none?
:::

::: answer
Join the new tables back along their foreign keys to rebuild the original columns, then compare with the original both ways: `rebuilt EXCEPT original` must return zero rows (nothing invented) and `original EXCEPT rebuilt` must return zero rows (nothing lost). One direction alone is not enough — it would miss the other kind of error. It is also worth comparing `count(*)` of each, since `EXCEPT` removes duplicate rows before comparing.
:::

::: check
Your team's dashboard reads from `reading_flat`, which is rebuilt every hour. A colleague wants to fix a wrong unit by running `UPDATE reading_flat SET units = 'degC' WHERE channel = 'BUS_TEMP'`. What goes wrong, and what should be done instead?
:::

::: answer
The fix is lost at the next hourly rebuild, because `reading_flat` is recreated from the source tables, which still hold the wrong unit. Worse, for up to an hour the flat table and the source disagree, and anyone querying the source gets the old answer. The fix belongs in the source of truth: `UPDATE channel SET units = 'degC' WHERE channel = 'BUS_TEMP'` — one row — and the next rebuild carries it into the copy.
:::

## Summary

| Idea | Meaning |
| --- | --- |
| Update anomaly | one fact stored many times; changing it misses copies |
| Insert anomaly | cannot record a fact without an unrelated one |
| Delete anomaly | deleting one fact loses another |
| `A → B` | functional dependency: A determines B |
| Candidate key | smallest set of columns that determines all the others |
| 1NF | one atomic value per cell, no repeating groups, a key |
| 2NF | 1NF, no partial dependency on part of a composite key |
| 3NF | 2NF, no transitive dependency between non-key columns |
| Lossless check | rebuild by joining; `EXCEPT` both ways gives zero rows |
| Deliberate denormalisation | derived, rebuildable copies for analytics; truth stays normalised |

The `reading` table you built is the start of a pattern analytics teams use everywhere: one big table of measurements surrounded by small tables that describe them. Next lesson gives that shape its name — the star schema — and asks what kind of key each of those small tables should have.

::: context codd Where "normal form" comes from
The relational database was proposed by Edgar F. Codd, a mathematician at IBM, in a 1970 paper. That paper already asked for tables with no lists inside cells, which became first normal form. In 1971 he defined second and third normal form, and in 1974 he and Raymond Boyce tightened the third into "Boyce-Codd normal form". "Normal" is used the way mathematicians use it: a standard, tidy shape that everything can be rewritten into. The British spelling "normalisation" and the American "normalization" name the same thing.
:::

::: context inclination The tilt of an orbit
An orbit is a flat ellipse around Earth. Its **inclination** is the angle between that flat plane and the plane of the equator. An inclination of 0 degrees means the satellite circles above the equator. 90 degrees means it passes over both poles. Large constellations put many satellites in each of several planes that share an inclination, so the inclination is a fact about the *plane*, not about any single satellite — which is exactly why it belongs in the `orbital_plane` table.
:::

::: context atomic Atomic, as in "cannot be split"
"Atom" comes from the Greek for "uncuttable". An atomic value is one the database treats as a single thing, not something it looks inside. The boundary is a design choice: a timestamp has a year, month and day inside it, but you still store it as one value because the database has operators for it. A comma-separated list in a text cell is not atomic in the useful sense, because the database cannot check, count or join its pieces. PostgreSQL arrays and JSON columns blur the line; use them for data you read as a whole, not for things you filter and join on.
:::

::: context transitive-dependency A chain of arrows
"Transitive" is borrowed from mathematics: if A decides B and B decides C, then A decides C through B. The trouble is the middle link. Whatever sits at the end of the chain is really a fact about the middle column, so it gets copied onto every row that shares that middle value.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="90" height="36" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="55" y="63" font-size="13" fill="#1f2a44" text-anchor="middle">sat_id</text>
  <rect x="135" y="40" width="90" height="36" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="180" y="63" font-size="13" fill="#1f2a44" text-anchor="middle">plane</text>
  <rect x="260" y="40" width="92" height="36" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="306" y="63" font-size="12" fill="#1f2a44" text-anchor="middle">incl_deg</text>
  <line x1="100" y1="58" x2="129" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="135,58 126,53 126,63" fill="#1f2a44"/>
  <line x1="225" y1="58" x2="254" y2="58" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="260,58 251,53 251,63" fill="#1f2a44"/>
  <path d="M55 40 C 90 6, 270 6, 300 36" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <polygon points="302,40 295,31 305,32" fill="#b4232c"/>
  <text x="180" y="16" font-size="11" fill="#b4232c" text-anchor="middle">only through plane</text>
  <text x="55" y="98" font-size="11" fill="#1d6fd1" text-anchor="middle">key</text>
  <text x="243" y="98" font-size="11" fill="#6c7a93" text-anchor="middle">non-key columns</text>
</svg>
```
:::

::: context beyond-3nf Are there more normal forms?
Yes: Boyce-Codd normal form (BCNF), fourth and fifth normal form, and a few more. BCNF closes a rare gap in 3NF that appears when a table has two overlapping candidate keys. The fourth and fifth deal with independent lists stuffed into one table. In practice, a design that reaches 3NF by the method in this lesson — one table per determinant — is almost always in BCNF too, and 3NF is the level working engineers mean when they say "normalised".
:::

::: context four-tables The four tables and how they point
Each arrow is a foreign key, drawn from the column that points to the table it points at. Following arrows from a reading reaches exactly one satellite, one plane and one channel.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="60" width="130" height="62" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="75" y="78" font-size="13" font-weight="700" fill="#1f2a44" text-anchor="middle">reading</text>
  <text x="75" y="95" font-size="11" fill="#1f2a44" text-anchor="middle">sat_id, ts, channel</text>
  <text x="75" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">value</text>
  <rect x="200" y="10" width="150" height="50" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="275" y="29" font-size="13" font-weight="700" fill="#1f2a44" text-anchor="middle">satellite</text>
  <text x="275" y="47" font-size="11" fill="#1f2a44" text-anchor="middle">sat_id, sat_name, plane</text>
  <rect x="200" y="110" width="150" height="50" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="275" y="129" font-size="13" font-weight="700" fill="#1f2a44" text-anchor="middle">channel</text>
  <text x="275" y="147" font-size="11" fill="#1f2a44" text-anchor="middle">channel, units</text>
  <rect x="10" y="4" width="130" height="44" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="75" y="22" font-size="13" font-weight="700" fill="#1f2a44" text-anchor="middle">orbital_plane</text>
  <text x="75" y="39" font-size="11" fill="#1f2a44" text-anchor="middle">plane, incl_deg</text>
  <line x1="140" y1="75" x2="194" y2="42" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="200,38 189,40 194,48" fill="#1d6fd1"/>
  <line x1="140" y1="108" x2="194" y2="128" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="200,131 190,123 188,132" fill="#1d6fd1"/>
  <line x1="200" y1="26" x2="146" y2="26" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="140,26 149,21 149,31" fill="#1d6fd1"/>
</svg>
```
:::

::: context lossless-join Why "lossless" and not "no data lost"
A careless split can do something stranger than losing rows: it can *add* rows that never existed. Split a table into two pieces that share a column which is not a key of either, and joining them back pairs every row of one with every matching row of the other, producing combinations the original never had. Those are called spurious rows. A decomposition is lossless when the join gives back exactly the original — no more, no fewer. Splitting along functional dependencies, with the determinant as the key of the new table, always passes this test.
:::

::: context source-of-truth One place where the answer is decided
"Source of truth" is engineering slang for the one copy that wins any argument. If the flat table says SAT-002 is called one thing and `satellite` says another, `satellite` is right by definition, and the flat table is stale. Flight software teams use the same phrase for configuration: one repository holds the real parameter values, and every other file is generated from it. Naming the source of truth out loud, in the documentation, prevents weeks of people "fixing" data in the wrong place.
:::

::: context wide-table One column per channel
A wide table turns rows into columns: instead of one row per (satellite, second, channel), it has one row per (satellite, second) with a column for each channel. You met the query that does this in the joins module — `avg(value) FILTER (WHERE channel = 'BATT_SOC') AS batt_soc` and so on, grouped by satellite and time. Analysts like it because a plot of battery against temperature needs both on the same row. The cost is the schema: a new channel means a new column, and a satellite without that channel gets a NULL. That is why it is a derived copy, not the store of record.
:::
