---
id: l09-reading-a-schema
title: Reading a schema you did not write
minutes: 22
covers:
  - Reading a schema you did not write
---

It is your first week on a satellite operations data team. Someone posts in the team chat: "Which satellites ran hot yesterday — bus temperature over 45 °C?" You have a login to the database. You have never seen its tables. The person who built them left last year.

You could guess. There is probably a table called something like `telemetry`, probably a temperature column, probably in Celsius. Guessing takes two minutes and produces an answer that looks fine. It is also how wrong numbers end up in anomaly reports — and a wrong "no, nothing ran hot" is worse than no answer at all.

This lesson gives you a method instead. The database already knows most of what you need: which tables exist, what each column holds, which values are allowed, how rows connect. The rest you learn by looking at the data itself. The method takes perhaps fifteen minutes the first time, and it pays you back every time you touch that database again. At the end, you will answer the question in the chat — and see exactly which of the guesses would have been wrong.

A **schema** is the design of a database: its tables, their columns and types, and the rules (keys and constraints) that tie them together. (In PostgreSQL, "schema" also names a folder that groups tables, like the `sql01c` folder these examples live in. The two meanings are related: the folder holds one design.)

## The method

Think of a new piece of lab equipment. Before you press any buttons you read the labels on the front panel, check which connectors are inputs, read the manual if there is one, and then take a few test measurements to be sure it behaves the way the labels say. Reading a schema is the same, in eight steps.

::: key A method for reading an unfamiliar schema
1. **List the tables.** What is here?
2. **Read the columns and types** of the tables you need.
3. **Read the keys and constraints.** They are the rules the data must obey.
4. **Read the comments and lookup tables.** That is where meanings and units live.
5. **Look at real rows** — a handful, with LIMIT.
6. **Profile the data:** row counts, time range, NULL rates, value ranges, distinct values.
7. **Check units and time zones** against what you saw.
8. **Write the query, then sanity-check the result** row by row.
:::

The first four steps read what the designer *declared*. Steps 5 to 7 check what the data *actually does*. Declarations and reality disagree more often than you would hope, and the disagreements are where bugs live.

## Steps 1 and 2: what is here, and what does it hold?

In PostgreSQL's command-line program, `psql`, commands that start with a backslash are **[[meta-commands|psql-meta]]** — shortcuts that psql turns into catalog queries for you. `\dt` lists tables. Read it "backslash d t", for "describe tables".

```text
scratch=# \dt
          List of relations
 Schema |    Name     | Type  | Owner
--------+-------------+-------+-------
 sql01c | channel_def | table | root
 sql01c | satellite   | table | root
 sql01c | telemetry   | table | root
(3 rows)
```

Three tables. This is not the database from lesson 01 — another team designed it, with its own names and its own rules, which is the whole point. `telemetry` sounds like the measurements; `satellite` like the fleet list; `channel_def` is less obvious, which makes it interesting. `\d telemetry` ("describe telemetry") shows one table in full:

```text
scratch=# \d telemetry
                      Table "sql01c.telemetry"
 Column  |           Type           | Collation | Nullable | Default
---------+--------------------------+-----------+----------+---------
 sat_id  | text                     |           | not null |
 channel | text                     |           | not null |
 ts      | timestamp with time zone |           | not null |
 value   | double precision         |           |          |
 quality | smallint                 |           | not null | 0
Indexes:
    "telemetry_pkey" PRIMARY KEY, btree (sat_id, channel, ts)
Check constraints:
    "telemetry_quality_check" CHECK (quality = ANY (ARRAY[0, 1, 2]))
Foreign-key constraints:
    "telemetry_channel_fkey" FOREIGN KEY (channel) REFERENCES channel_def(channel)
    "telemetry_sat_id_fkey" FOREIGN KEY (sat_id) REFERENCES satellite(sat_id)
```

Read the column list first, one line at a time, and say out loud what each tells you:

- `ts` is `timestamp with time zone` — TIMESTAMPTZ, from lesson 07. Good: these are instants, not wall-clock readings.
- `value` is `double precision` and has no "not null", so **it can be NULL**. Expect gaps.
- `value` is one column for every channel. So it cannot have one unit. Temperatures, battery charge and anything else all share it. Hold on to that thought.
- `quality` is a small integer that defaults to 0. Nothing here says what 0 means yet.

If you are not in psql — say, in a notebook or a graphical tool — the same facts are in **[[information_schema|information-schema]]**, a set of standard read-only views that describe the database. You query them with ordinary SELECTs:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'sql01c' AND table_name = 'telemetry'
ORDER BY ordinal_position;
```

```text
 column_name |        data_type         | is_nullable | column_default
-------------+--------------------------+-------------+----------------
 sat_id      | text                     | NO          |
 channel     | text                     | NO          |
 ts          | timestamp with time zone | NO          |
 value       | double precision         | YES         |
 quality     | smallint                 | NO          | 0
```

`ordinal_position` is the column's place in the table, 1, 2, 3…, so ordering by it lists the columns as they were declared. `information_schema.tables` lists the tables the same way.

## Step 3: keys and constraints are the rules

A constraint is a promise the database enforces on every insert. That makes constraints the most trustworthy documentation you will ever find: a comment can be out of date, but a constraint that is in place is being checked right now.

The bottom half of `\d` already listed them. To see every constraint of one table with its full definition, ask the catalog directly:

```sql
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'telemetry'::regclass
ORDER BY conname;
```

```text
         conname         |                      definition
-------------------------+-------------------------------------------------------
 telemetry_channel_fkey  | FOREIGN KEY (channel) REFERENCES channel_def(channel)
 telemetry_pkey          | PRIMARY KEY (sat_id, channel, ts)
 telemetry_quality_check | CHECK ((quality = ANY (ARRAY[0, 1, 2])))
 telemetry_sat_id_fkey   | FOREIGN KEY (sat_id) REFERENCES satellite(sat_id)
```

(`'telemetry'::regclass` turns the table's name into the internal id the catalog uses. Copy the pattern; you do not need to know more about it.)

Each line answers a question:

- **The primary key** `(sat_id, channel, ts)` tells you the **[[grain|grain]]** of the table — what one row stands for. Here: one satellite, one channel, one instant. So there can never be two BUS_TEMP readings for SAT-003 at the same instant, and if you count rows you are counting samples.
- **The foreign keys** tell you where codes are explained. Every `channel` in telemetry must exist in `channel_def`, and every `sat_id` in `satellite`. So `channel_def` is the dictionary for channel codes. Go and read it.
- **The CHECK** says `quality` is always 0, 1 or 2. Three states — but which is which?

::: key What one row means
Before writing any query, say the table's grain in one sentence: "one row is one ___". The primary key tells you. A count, a sum or an average only means something once you know what you are counting.
:::

## Step 4: comments and lookup tables

A designer can attach a **comment** to a table or column with `COMMENT ON`. `\d+ telemetry` (with a plus) shows them in a Description column. Or ask for them directly:

```sql
SELECT column_name, col_description('telemetry'::regclass, ordinal_position) AS comment
FROM information_schema.columns
WHERE table_schema = 'sql01c' AND table_name = 'telemetry'
ORDER BY ordinal_position;
```

```text
 column_name |                          comment
-------------+------------------------------------------------------------
 sat_id      |
 channel     |
 ts          | Spacecraft sample time, UTC
 value       |
 quality     | 0 = good, 1 = suspect, 2 = filled on ground (not measured)
```

Two important facts. `ts` is UTC. And `quality = 2` rows are **not measurements** — somebody on the ground **[[filled them in|ground-fill]]**. A "temperature" in such a row is a made-up number.

Now the dictionary the foreign key pointed to:

```sql
SELECT * FROM channel_def ORDER BY channel;
```

```text
   channel    |           description           | unit
--------------+---------------------------------+-------
 BATT_SOC     | Battery state of charge, 0 to 1 | 1
 BUS_TEMP     | Bus panel temperature           | degC
 BUS_TEMP_RAW | Bus thermistor, raw ADC reading | count
 WHEEL_SPD    | Reaction wheel 1 speed          | rpm
```

There it is. There are **two** temperature-sounding channels. `BUS_TEMP` is in degrees Celsius. `BUS_TEMP_RAW` is a raw **[[ADC count|adc-count]]** — the number the sensor electronics produced before anyone converted it to a temperature. And battery state of charge is a fraction from 0 to 1 (unit "1" means "no unit"), not a percentage.

::: warning A column name is not a unit
`value` does not say what it measures, and even a name like `temp` does not say Celsius, kelvin or Fahrenheit. Find the unit written down — in a comment, a lookup table or a data dictionary — and then confirm it against the data's range (step 6). If you cannot find it, ask. Never assume.
:::

## Step 5: look at real rows

Now look at some data. Always with a LIMIT: a telemetry table can hold billions of rows, and `SELECT *` without one can run for an hour. Sorting newest-first shows you what the data looks like today:

```sql
SELECT * FROM telemetry ORDER BY ts DESC, sat_id, channel LIMIT 6;
```

```text
 sat_id  |   channel    |           ts           | value | quality
---------+--------------+------------------------+-------+---------
 SAT-001 | BATT_SOC     | 2026-03-02 23:50:00+00 | 0.787 |       0
 SAT-001 | BUS_TEMP     | 2026-03-02 23:50:00+00 |  31.6 |       0
 SAT-001 | BUS_TEMP_RAW | 2026-03-02 23:50:00+00 |  2838 |       0
 SAT-002 | BATT_SOC     | 2026-03-02 23:50:00+00 | 0.737 |       0
 SAT-002 | BUS_TEMP     | 2026-03-02 23:50:00+00 |  33.1 |       0
 SAT-002 | BUS_TEMP_RAW | 2026-03-02 23:50:00+00 |  2876 |       0
```

This matches what the declarations promised. Each sample time has one row per channel. A temperature of 31.6 sits next to a raw count of 2838 for the same instant. Samples land on round ten-minute marks.

The newest rows are not a fair picture of the whole table, though. For a spread from everywhere, `ORDER BY random() LIMIT 10` picks ten rows at random (it works in PostgreSQL and SQLite). On a very large table it is slow, because it must draw a random number for every row before choosing, so run it on a time slice.

## Step 6: profile the data

**Profiling** means measuring the data in bulk: how many rows, over what time span, how often values are missing, what range they cover. You met the tools last lesson — `COUNT(*)`, `COUNT(col)`, `MIN`, `MAX` and GROUP BY.

```sql
SELECT COUNT(*) AS n_rows, COUNT(value) AS n_values,
       MIN(ts) AS first_ts, MAX(ts) AS last_ts
FROM telemetry;
```

```text
 n_rows | n_values |        first_ts        |        last_ts
--------+----------+------------------------+------------------------
   4320 |     4296 | 2026-03-01 00:00:00+00 | 2026-03-02 23:50:00+00
```

Two days of data, and $4320 - 4296 = 24$ NULL values somewhere. Break it down by channel, and compute the **NULL rate** — the percentage of rows with no value:

```sql
SELECT channel,
       COUNT(*) AS n_rows,
       COUNT(*) - COUNT(value) AS n_null,
       ROUND(100.0 * (COUNT(*) - COUNT(value)) / COUNT(*), 1) AS pct_null,
       MIN(value) AS lo,
       MAX(value) AS hi
FROM telemetry
GROUP BY channel
ORDER BY channel;
```

```text
   channel    | n_rows | n_null | pct_null |  lo   |  hi
--------------+--------+--------+----------+-------+------
 BATT_SOC     |   1440 |      0 |      0.0 | 0.402 |  0.9
 BUS_TEMP     |   1440 |     12 |      0.8 |     8 |   48
 BUS_TEMP_RAW |   1440 |     12 |      0.8 |  2248 | 3248
```

(The `100.0` rather than `100` makes the division use decimals. With whole numbers, $12 / 1440$ would round down to 0.)

And the quality flag:

```sql
SELECT quality, COUNT(*) AS n FROM telemetry GROUP BY quality ORDER BY quality;
```

```text
 quality |  n
---------+------
       0 | 4318
       2 |    2
```

Now write down what you learned, because every line matters for the question:

- `WHEEL_SPD` is defined in `channel_def` but has **no rows at all**. A lookup table lists what *could* exist, not what does.
- `BUS_TEMP` has 12 missing values out of 1440, 0.8 percent. Small, but if they are all on one satellite, that satellite has a hole in its record.
- Two rows are ground-filled (`quality = 2`). They could be anywhere.
- `BATT_SOC` runs 0.402 to 0.9. That confirms "fraction, not percent" — a percentage would run into the tens.

::: note Why the NULL rate is worth a whole query
A NULL rate is a health signal for the pipeline, not only for the analysis. A channel that is normally 0.1 percent NULL and jumps to 20 percent tells you a ground station is dropping frames or a decoder has broken — often before anyone notices the missing data any other way. Many teams chart NULL rate per channel per day for exactly that reason.
:::

## Step 7: units and time

Compare the ranges with the units from step 4.

- `BUS_TEMP` spans 8 to 48. For a satellite bus in degrees Celsius, that is plausible. If you had seen 281 to 321, you would suspect kelvin mislabelled as Celsius (subtract 273.15 and you get about the same range).
- `BUS_TEMP_RAW` spans 2248 to 3248. Every raw value is far above 45. That will matter in a moment.
- `ts` is TIMESTAMPTZ and the comment says UTC. So "yesterday" in the question needs a decision: whose yesterday? For a fleet team, the answer is the UTC day (lesson 07). Today is 3 March 2026, so yesterday is the half-open window from `2026-03-02 00:00:00+00` up to, but not including, `2026-03-03 00:00:00+00`.

## Step 8: write the query, and check it

::: example The guess against the method
**The two-minute guess.** Without reading anything, someone might write:

```sql
SELECT DISTINCT sat_id
FROM telemetry
WHERE channel LIKE 'BUS_TEMP%'
  AND value > 45
ORDER BY sat_id;
```

```text
 sat_id
---------
 SAT-001
 SAT-002
 SAT-003
 SAT-004
 SAT-005
```

Every satellite in the fleet "ran hot". The pattern `'BUS_TEMP%'` also matched `BUS_TEMP_RAW`, and every raw count is above 45. There is no time window either, so the query looked at two days, not yesterday. This answer would start a fleet-wide alarm.

**The method's query.** Use what steps 1 to 7 found: the Celsius channel only, measured rows only, yesterday in UTC.

```sql
SELECT sat_id, ts, value
FROM telemetry
WHERE channel = 'BUS_TEMP'
  AND quality = 0
  AND ts >= '2026-03-02 00:00:00+00'
  AND ts <  '2026-03-03 00:00:00+00'
  AND value > 45
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value
---------+------------------------+-------
 SAT-003 | 2026-03-02 13:00:00+00 |  46.2
 SAT-003 | 2026-03-02 13:10:00+00 |  47.8
 SAT-003 | 2026-03-02 13:20:00+00 |  46.9
```

One satellite, SAT-003, above 45 °C for three consecutive samples, from 13:00 to 13:20 UTC. The rows are shown rather than only the satellite name, because "for twenty minutes, peaking at 47.8" is what the person asking actually needs.

**Sanity check: account for everything the filters removed.** Drop the quality and time filters, keep only the channel and the threshold, and look at what is above 45 in the whole table:

```sql
SELECT sat_id, ts, value, quality
FROM telemetry
WHERE channel = 'BUS_TEMP' AND value > 45
ORDER BY ts;
```

```text
 sat_id  |           ts           | value | quality
---------+------------------------+-------+---------
 SAT-002 | 2026-03-01 23:50:00+00 |  45.6 |       0
 SAT-005 | 2026-03-02 04:20:00+00 |    48 |       2
 SAT-003 | 2026-03-02 13:00:00+00 |  46.2 |       0
 SAT-003 | 2026-03-02 13:10:00+00 |  47.8 |       0
 SAT-003 | 2026-03-02 13:20:00+00 |  46.9 |       0
```

Each extra row has a reason. SAT-002's 45.6 is at 23:50 on **1 March** UTC — the day before yesterday. (In Tokyo it was already 08:50 on 2 March, which is exactly why you pick one clock and say which.) SAT-005's 48 is a ground-filled value, not a measurement. Neither belongs in the answer, but both deserve a sentence in your reply.

**One more check: were we blind anywhere?** A "no" for the other satellites is only as good as their data. Count expected and measured samples yesterday:

```sql
SELECT sat_id, COUNT(*) AS expected, COUNT(value) AS measured
FROM telemetry
WHERE channel = 'BUS_TEMP'
  AND ts >= '2026-03-02 00:00:00+00' AND ts < '2026-03-03 00:00:00+00'
GROUP BY sat_id
ORDER BY sat_id;
```

```text
 sat_id  | expected | measured
---------+----------+----------
 SAT-001 |      144 |      144
 SAT-002 |      144 |      144
 SAT-003 |      144 |      144
 SAT-004 |      144 |      132
 SAT-005 |      144 |      144
```

A day has $24 \times 6 = 144$ ten-minute slots, so 144 is complete. SAT-004 is missing 12 samples — two hours with no temperature at all. All 12 of the table's NULL temperatures are there. The honest answer is: "SAT-003 exceeded 45 °C from 13:00 to 13:20 UTC, peaking at 47.8. No other satellite exceeded it in measured data, but SAT-004 has a two-hour gap, so we cannot rule it out."
:::

::: warning LIKE with a wildcard catches more than you meant
`channel LIKE 'BUS_TEMP%'` means "starts with BUS_TEMP", and that includes `BUS_TEMP_RAW`, `BUS_TEMP_2` and anything a future engineer adds. Worse, the underscore is itself a wildcard in LIKE (lesson 02: `_` matches any one character), so the pattern would also match a code like `BUSXTEMP`. When you know the exact code, use `=`. Use LIKE when you are exploring — and then read every value it matched with `SELECT DISTINCT channel … WHERE channel LIKE …` before trusting it.
:::

## The same method in SQLite

SQLite has no `information_schema` and no psql, but every step has an equivalent. The table catalog is called **`sqlite_master`** (newer versions also accept the name `sqlite_schema`), and a set of **PRAGMA** commands describe tables. A PRAGMA is SQLite's own statement for asking about, or changing, how the database is set up.

Here is the same three-table design created in SQLite, with `ts` as ISO-8601 text as lesson 07 recommended:

```sql
SELECT type, name FROM sqlite_master ORDER BY name;
```

```text
('table', 'channel_def')
('table', 'satellite')
('index', 'sqlite_autoindex_channel_def_1')
('index', 'sqlite_autoindex_satellite_1')
('index', 'sqlite_autoindex_satellite_2')
('index', 'sqlite_autoindex_telemetry_1')
('table', 'telemetry')
```

The `autoindex` entries are the indexes SQLite built to enforce each PRIMARY KEY and UNIQUE constraint. `PRAGMA table_info` is the `\d` of SQLite:

```sql
PRAGMA table_info(telemetry);
```

```text
cid | name    | type    | notnull | dflt_value | pk
  0 | sat_id  | TEXT    |       1 | None       |  1
  1 | channel | TEXT    |       1 | None       |  2
  2 | ts      | TEXT    |       1 | None       |  3
  3 | value   | REAL    |       0 | None       |  0
  4 | quality | INTEGER |       1 | '0'        |  0
```

(Formatted as a table here; Python prints each row as a tuple.) The `pk` column numbers the primary-key columns in order: `sat_id` first, `channel` second, `ts` third — the same grain as before. `PRAGMA foreign_key_list(telemetry)` lists the foreign keys, and this query shows the original `CREATE TABLE` text, **including any comments the designer typed into it** — SQLite's only form of column documentation:

```sql
SELECT sql FROM sqlite_master WHERE name = 'telemetry';
```

```text
CREATE TABLE telemetry (
  sat_id  TEXT NOT NULL REFERENCES satellite (sat_id),
  channel TEXT NOT NULL REFERENCES channel_def (channel),
  ts      TEXT NOT NULL,             -- ISO-8601, UTC, e.g. 2026-03-02T13:10:00Z
  value   REAL,
  quality INTEGER NOT NULL DEFAULT 0 CHECK (quality IN (0, 1, 2)),
  PRIMARY KEY (sat_id, channel, ts)
)
```

::: warning Two SQLite promises that are weaker than they look
**Foreign keys are not checked by default.** Unless the connection runs `PRAGMA foreign_keys = ON`, SQLite accepts a telemetry row for `SAT-999` even though no such satellite exists. A declared foreign key in SQLite is a statement of intent, not proof.

**Declared types are suggestions.** As lesson 06 showed, SQLite uses **[[type affinity|type-affinity]]**: a column declared REAL will happily store the text `'n/a'`. Check what is really there with `typeof()`:

```sql
SELECT typeof(value) AS stored_as, COUNT(*) AS n FROM telemetry GROUP BY typeof(value);
-- ('real', 1)
-- ('text', 1)
```

So in SQLite, step 6 (profile the data) matters even more than in PostgreSQL.
:::

::: example Reading the exercise's table before solving it
The module exercise gives you a `telemetry` table in SQLite and asks for a battery triage view. Run the method on it first.

**Steps 1–3.** `sqlite_master` shows one table. `PRAGMA table_info(telemetry)` shows four columns — `sat_id`, `ts`, `channel` (all TEXT, not null) and `value` (REAL, nullable) — and `pk` is 0 for all of them. **There is no primary key.** Nothing stops a duplicate row. Worth knowing before you trust any count.

**Step 6: profile.**

```sql
SELECT channel, COUNT(*) AS n_rows, COUNT(value) AS n_values,
       MIN(value) AS lo, MAX(value) AS hi
FROM telemetry
GROUP BY channel
ORDER BY channel;
```

```text
('BATT_SOC', 7, 6, 0.19, 0.94)
('BUS_TEMP', 1, 1, 21.5, 21.5)
```

Read the two lines. `BATT_SOC` has 7 rows but 6 values: one NULL. Its range, 0.19 to 0.94, says **fraction, not percent**, so thresholds like 0.30 and 0.70 are on the right scale. And a `BUS_TEMP` row, value 21.5, shares the `value` column — so a query that forgets `channel = 'BATT_SOC'` would put a temperature into the battery triage.

**Step 7: time.**

```sql
SELECT MIN(ts), MAX(ts), COUNT(DISTINCT sat_id) FROM telemetry;
-- ('2026-03-01T00:00:00Z', '2026-03-01T00:02:00Z', 3)
SELECT DISTINCT length(ts) FROM telemetry;
-- (20,)
```

`COUNT(DISTINCT sat_id)` counts different satellites: 3. Three minutes of data, in UTC with a `Z`. Every `ts` is exactly 20 characters, so they all share one format and sort correctly as text.

**What you now know before writing a line of the answer:** filter on the channel, exclude the NULL with `IS NOT NULL` (lesson 05), compare against fractions, and expect $7 - 1 = 6$ rows in the result. When your view returns six rows, that is a check you designed yourself.
:::

## Check yourself

::: check
You find a table `pass (station TEXT, sat_id TEXT, aos TIMESTAMPTZ, los TIMESTAMPTZ, bytes BIGINT)` with `PRIMARY KEY (station, aos)`. State its grain in one sentence. Could the same satellite appear twice at the same `aos`?
:::

::: answer
One row is one pass at one ground station, identified by the station and the instant the pass began. Yes, the same satellite can appear twice at the same `aos` — at two *different* stations, because the key only forbids repeating a (station, aos) pair. That is physically sensible: two stations can hear one satellite at once.

Notice what the key *does* forbid: one station logging two passes that begin at the same instant, even of two different satellites. A station with two antennas could really do that, so this is worth asking the designer about.
:::

::: check
A column is called `alt` and is `DOUBLE PRECISION`. Its profile shows `MIN = 540123.5`, `MAX = 561870.2`. There is no comment. What is your best reading of the unit, and what do you do next?
:::

::: answer
For a satellite in low Earth orbit, altitudes of about 540 to 562 km are typical. The numbers are about 540,000 to 562,000, so the most likely unit is **metres**. But that is an inference, not a fact: it could be a radius, a distance from a ground station, or something else. Check a lookup table or data dictionary, ask the owner, and add a comment once you know (`COMMENT ON COLUMN … IS 'altitude above WGS-84 ellipsoid, m'`), so the next person does not have to guess.
:::

::: check
In PostgreSQL, write the query that lists the columns of a table `downlink` in schema `ops`, with each column's type and whether it may be NULL, in declared order. What is the SQLite equivalent?
:::

::: answer
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'ops' AND table_name = 'downlink'
ORDER BY ordinal_position;
```

In psql, `\d ops.downlink` shows the same, plus keys and constraints. In SQLite: `PRAGMA table_info(downlink);` — its `notnull` column is 1 for NOT NULL columns, and `pk` shows the primary-key order.
:::

::: check
A profile of `BATT_SOC` for one week shows `n_rows = 10080`, `n_values = 10080`, `lo = 0.0`, `hi = 0.97`. Nobody has reported a dead battery. What would you look at before trusting the minimum?
:::

::: answer
A charge of exactly 0.0 on a working satellite is suspicious. Possibly the loader wrote 0 instead of NULL for a missing sample — a silent version of the COALESCE trap from lesson 05. The perfect NULL rate (zero missing out of 10,080) is itself a hint, since real links drop samples. Count how many rows are exactly 0 (`WHERE value = 0`), look at their times and satellites, and check whether there is a quality flag on them. Then ask how the loader handles missing data.
:::

::: check
Why is `WHERE channel LIKE 'BUS_TEMP%'` risky in the lesson's database even though it looks right, and what would you run to see the risk before using it?
:::

::: answer
`LIKE 'BUS_TEMP%'` matches every channel whose code *starts* with `BUS_TEMP`, which here includes `BUS_TEMP_RAW` — a raw sensor count whose values (about 2,250 to 3,250) are all above 45. To see what a pattern matches before trusting it:

```sql
SELECT DISTINCT channel FROM telemetry WHERE channel LIKE 'BUS_TEMP%';
```

It returns both codes. Then use `channel = 'BUS_TEMP'`.
:::

## Summary

| Step | PostgreSQL | SQLite |
| --- | --- | --- |
| 1. List tables | `\dt`, `information_schema.tables` | `SELECT … FROM sqlite_master` |
| 2. Columns and types | `\d t`, `information_schema.columns` | `PRAGMA table_info(t)` |
| 3. Keys and constraints | `\d t`, `pg_constraint` with `pg_get_constraintdef` | `pk` in `table_info`, `PRAGMA foreign_key_list(t)`, the `CREATE TABLE` text |
| 4. Comments, lookups | `\d+ t`, `col_description`, lookup tables | comments inside the `CREATE TABLE` text |
| 5. Look at rows | `ORDER BY … LIMIT`, `ORDER BY random() LIMIT` | same |
| 6. Profile | `COUNT(*)`, `COUNT(col)`, `MIN`, `MAX`, NULL rate, GROUP BY | same, plus `typeof()` |
| 7. Units and time | compare ranges with stated units; UTC half-open windows | same; one ISO-8601 format |
| 8. Query and check | account for every row the filters removed; report gaps | same |

Grain first: say what one row means. Trust constraints over comments, and data over both.

That completes the module: one table, read carefully and queried precisely. But the answer to "which satellites ran hot" wanted the satellite's *name* from `satellite`, and the unit from `channel_def` — facts that live in other tables, reachable through the foreign keys you have learned to read. Putting tables together is a **[[join|next-join]]**, and the next module, *Joins, Aggregation and Subqueries*, starts there.

::: context psql-meta Backslash commands belong to psql
`\dt` and `\d` are not SQL. The PostgreSQL server never sees them. The `psql` program recognizes the backslash, writes a catalog query for you, sends that, and formats the result.

That is why they do not work from Python, a notebook or a graphical client — there you use `information_schema` or the `pg_catalog` tables instead. If you are curious what psql is doing, start it with `psql -E`, and it prints the real SQL behind every backslash command. It is a good way to learn the catalog.
:::

::: context information-schema A standard way to ask "what is in here?"
`information_schema` is defined by the SQL standard itself, so the same queries work, with small differences, in PostgreSQL, MySQL, SQL Server and others. It is a set of views: `tables`, `columns`, `table_constraints`, `key_column_usage` and more.

Each database also has its own, richer catalog underneath — in PostgreSQL, the `pg_catalog` tables such as `pg_constraint` and `pg_class`. Use `information_schema` when you want portable queries, and the native catalog when you need a detail the standard views leave out, such as the full text of a CHECK constraint.
:::

::: context grain Grain: the most important sentence about a table
Data engineers call the meaning of one row the table's **grain**. "One row per satellite per channel per sample time." "One row per ground-station pass." "One row per satellite per day."

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <text x="14" y="18" font-weight="700">sat_id</text><text x="84" y="18" font-weight="700">channel</text><text x="190" y="18" font-weight="700">ts</text><text x="258" y="18" font-weight="700">value</text>
    <rect x="10" y="26" width="340" height="22" fill="#8fb8f0"/>
    <text x="14" y="41">SAT-003</text><text x="84" y="41">BUS_TEMP</text><text x="190" y="41">13:00</text><text x="258" y="41">46.2</text>
    <rect x="10" y="50" width="340" height="22" fill="#ffffff" stroke="#6c7a93"/>
    <text x="14" y="65">SAT-003</text><text x="84" y="65">BUS_TEMP</text><text x="190" y="65">13:10</text><text x="258" y="65">47.8</text>
    <rect x="10" y="74" width="340" height="22" fill="#ffffff" stroke="#6c7a93"/>
    <text x="14" y="89">SAT-003</text><text x="84" y="89">BUS_TEMP_RAW</text><text x="190" y="89">13:00</text><text x="258" y="89">3203</text>
  </g>
  <rect x="10" y="4" width="236" height="94" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="14" y="118" font-size="11" fill="#b4232c">primary key (sat_id, channel, ts): unique per row</text>
  <text x="14" y="136" font-size="11" fill="#1f2a44">grain: one satellite, one channel, one instant</text>
</svg>
```

Get the grain wrong and every count is wrong. If you think a table is one row per pass but it is really one row per pass per data file, "number of passes" comes out several times too big.
:::

::: context ground-fill Values filled in on the ground
When a satellite's data does not arrive — a pass is missed, a frame is corrupted — some pipelines fill the hole so that charts have no gaps: repeating the last value, interpolating between neighbours, or inserting a default. That can be useful for a display.

It is dangerous for analysis, because a filled value looks exactly like a real one. A good pipeline marks filled rows, as the `quality` column does here, so that anyone computing a maximum, an average or an alarm can leave them out. If a table you inherit has no such flag, ask whether filling happens upstream.
:::

::: context adc-count Raw counts and calibrated values
A temperature sensor on a spacecraft is often a **thermistor**, a resistor whose resistance changes with temperature. An **analogue-to-digital converter** (ADC) measures the resulting voltage and outputs a whole number — a **count**. A 12-bit ADC gives counts from 0 to 4095.

Turning counts into degrees needs a **calibration curve** measured on the ground before launch. Telemetry systems often keep both: the raw count, which never changes, and the converted value, which can be recomputed if the calibration is improved. In this lesson's made-up database, the raw count is $2048 + 25 \times T$, so 45 °C would be a count of 3173.
:::

::: context type-affinity Why SQLite lets text into a REAL column
Most databases give each column a strict type and reject values that do not fit. SQLite instead gives each column an **affinity**, a preferred type. When you insert a value, SQLite converts it to the preferred type if it can do so without losing information, and otherwise stores it as it came.

So `'21.5'` inserted into a REAL column becomes the number 21.5, but `'n/a'` stays text. When you read an SQLite schema, look at the end of the `CREATE TABLE` text: a table declared with the word `STRICT` after its closing bracket rejects mismatches, and one without it does not. Most tables you inherit will not be strict.
:::

::: context next-join Where the next module starts
The three tables in this lesson are linked by the foreign keys you read in step 3. A join follows those links to put facts from different tables side by side in one result.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <rect x="10" y="20" width="104" height="92" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
    <text x="18" y="38" font-weight="700">satellite</text>
    <text x="18" y="56">sat_id (PK)</text><text x="18" y="72">name</text><text x="18" y="88">plane</text><text x="18" y="104">status</text>
    <rect x="128" y="20" width="104" height="108" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
    <text x="136" y="38" font-weight="700">telemetry</text>
    <text x="136" y="56">sat_id (FK)</text><text x="136" y="72">channel (FK)</text><text x="136" y="88">ts</text><text x="136" y="104">value</text><text x="136" y="120">quality</text>
    <rect x="246" y="20" width="104" height="76" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
    <text x="254" y="38" font-weight="700">channel_def</text>
    <text x="254" y="56">channel (PK)</text><text x="254" y="72">description</text><text x="254" y="88">unit</text>
  </g>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="128" y1="52" x2="114" y2="52"/>
    <line x1="232" y1="68" x2="246" y2="52"/>
  </g>
  <polygon points="114,52 122,47 122,57" fill="#b4232c"/>
  <polygon points="246,52 236,53 241,61" fill="#b4232c"/>
  <text x="180" y="156" font-size="11" fill="#b4232c" text-anchor="middle">foreign keys point to the table that explains each code</text>
</svg>
```

With a join, the hot-satellite answer could say "Kestrel-3 (plane 2), bus panel temperature, degC" in one query instead of three.
:::
