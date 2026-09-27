---
id: l03-constraints
title: "Constraints: letting the database say no"
minutes: 21
covers:
  - "Constraints: NOT NULL, UNIQUE, CHECK, foreign keys with ON DELETE"
---

A vending machine will not take a bent coin. It does not ask you why, and it does not take the coin now and hope someone sorts it out later. It refuses at the slot, and you find out immediately. Because every machine refuses bent coins, the coin box at the end of the day never holds any.

A **constraint** is a rule you attach to a table that the database checks on every insert, update and delete, refusing any change that would break it. You met the first two in the very first SQL lesson — a primary key refuses duplicates and empty ids, and a foreign key refuses readings for satellites that do not exist. This lesson goes through the full set: `NOT NULL`, `UNIQUE`, `CHECK`, `PRIMARY KEY` and `FOREIGN KEY`, including what a foreign key should do when the row it points at is deleted.

Why bother, when the ingest code could check these things itself? Because a telemetry database is written by many programs — the real-time ingest, a replay tool, a backfill script someone wrote at 2 a.m., an analyst fixing one row by hand. Each one would need the same checks, written correctly, forever. A constraint is written once, next to the data, and nothing gets past it. When a bad value appears in a report two years later, "the database would have refused it" is the answer that ends the investigation.

## NOT NULL: this cell must be filled

The simplest rule says a column may never hold NULL, the "no value here" marker from the first SQL module. Take a satellite table:

```sql
CREATE TABLE sat (
  sat_id   text PRIMARY KEY,
  norad_id int UNIQUE,
  sat_name text NOT NULL,
  mass_kg  numeric CHECK (mass_kg > 0)
);
INSERT INTO sat VALUES ('SAT-001', 60101, 'Pathfinder-1', 306);
INSERT INTO sat VALUES ('SAT-002', NULL, NULL, 306);
```

```text
INSERT 0 1
ERROR:  null value in column "sat_name" of relation "sat" violates not-null constraint
DETAIL:  Failing row contains (SAT-002, null, null, 306).
```

Read the error from left to right: what was wrong (a null value), where (column `sat_name` of the table — PostgreSQL says **[[relation|relation-word]]** — `sat`), and which rule (the not-null constraint). The `DETAIL` line prints the whole row that was refused, which is often enough to find the program that sent it.

Make a column `NOT NULL` unless you can say out loud what a NULL in it would *mean*. `norad_id` is allowed to be NULL here on purpose: a newly launched satellite has no catalog number yet, as you saw last lesson. That NULL means "not assigned yet", which is a real state. A NULL `sat_name` means nothing useful, so it is refused.

::: key NOT NULL
`NOT NULL` refuses NULL in a column. Declare it on every column where a missing value has no meaning — keys, timestamps, channel names, measured values that must be present — and leave it off only where NULL stands for a real state such as "not assigned yet".
:::

## UNIQUE: no two rows the same

`UNIQUE` says no two rows may share a value in that column (or that combination of columns). Try giving SAT-002 the catalog number SAT-001 already has:

```sql
INSERT INTO sat VALUES ('SAT-002', 60101, 'Pathfinder-2', 306);
```

```text
ERROR:  duplicate key value violates unique constraint "sat_norad_id_key"
DETAIL:  Key (norad_id)=(60101) already exists.
```

PostgreSQL named the constraint for you: table, column, and `_key`. Like a primary key, a unique constraint is enforced by a unique **index**, a sorted structure the database can search in a few steps; the lessons from lesson 5 onwards are about indexes.

### What UNIQUE does with NULL

Now insert two new satellites, neither of which has a catalog number yet:

```sql
INSERT INTO sat VALUES ('SAT-002', NULL, 'Pathfinder-2', 306);
INSERT INTO sat VALUES ('SAT-003', NULL, 'Pathfinder-3', 306);
SELECT * FROM sat ORDER BY sat_id;
```

```text
INSERT 0 1
INSERT 0 1
 sat_id  | norad_id |   sat_name   | mass_kg
---------+----------+--------------+---------
 SAT-001 |    60101 | Pathfinder-1 |     306
 SAT-002 |          | Pathfinder-2 |     306
 SAT-003 |          | Pathfinder-3 |     306
(3 rows)
```

Both were accepted, and two rows now have NULL in a `UNIQUE` column. This is on purpose, and it follows from what NULL means. A unique constraint refuses two rows whose values are *equal*. Is NULL equal to NULL? In SQL the comparison `NULL = NULL` is not true; it is UNKNOWN, because two unknown values might or might not be the same. So the database cannot say the two rows clash, and it [[lets them in|null-unique-picture]]. For catalog numbers that is exactly right: two satellites waiting for numbers are not a duplicate.

Sometimes you want the opposite — "at most one row may have no value". PostgreSQL 15 added a switch for that, `NULLS NOT DISTINCT`, which treats NULLs as equal *for this constraint only*:

```sql
CREATE TABLE sat2 (sat_id text PRIMARY KEY, norad_id int UNIQUE NULLS NOT DISTINCT);
INSERT INTO sat2 VALUES ('SAT-002', NULL);
INSERT INTO sat2 VALUES ('SAT-003', NULL);
```

```text
INSERT 0 1
ERROR:  duplicate key value violates unique constraint "sat2_norad_id_key"
DETAIL:  Key (norad_id)=(null) already exists.
```

SQLite behaves like default PostgreSQL: many NULLs are allowed in a `UNIQUE` column, and it has no `NULLS NOT DISTINCT`.

::: key UNIQUE and NULL
`UNIQUE` refuses two rows with equal values in the column or column list. Because `NULL = NULL` is UNKNOWN, not true, a `UNIQUE` column accepts **any number of NULLs** by default. In PostgreSQL 15 and later, `UNIQUE NULLS NOT DISTINCT` treats NULLs as equal, so at most one is allowed.
:::

::: warning A composite UNIQUE with a nullable column lets duplicates through
A unique constraint on `(sat_id, channel, valid_from)` does not stop two identical rows if `valid_from` is NULL in both: one NULL in the list makes the comparison UNKNOWN, so the rows do not "clash". If every part of a uniqueness rule must be present, make every column in it `NOT NULL`.
:::

## CHECK: any rule you can write as a condition

A `CHECK` constraint holds a condition, written the way you would write a `WHERE` clause, and refuses any row for which the condition is **false**. The `sat` table already has one, `CHECK (mass_kg > 0)`:

```sql
INSERT INTO sat VALUES ('SAT-004', NULL, 'Relay-1', -800);
```

```text
ERROR:  new row for relation "sat" violates check constraint "sat_mass_kg_check"
DETAIL:  Failing row contains (SAT-004, null, Relay-1, -800).
```

A negative mass is a sign error somewhere upstream, and now it cannot land in the table. You can give a check a name of your own with `CONSTRAINT name CHECK (...)`, which makes error messages easier to read and the constraint easier to change later. A check can also compare two columns of the same row. For a ground-station pass, the moment the satellite drops below the horizon ([[loss of signal|aos-los]], `los_ts`) must come after the moment it rose (acquisition of signal, `aos_ts`):

```sql
CREATE TABLE pass (
  sat_id text NOT NULL, aos_ts timestamptz NOT NULL, los_ts timestamptz NOT NULL,
  CONSTRAINT pass_los_after_aos CHECK (los_ts > aos_ts)
);
INSERT INTO pass VALUES ('SAT-001', '2026-03-01 00:10Z', '2026-03-01 00:02Z');
```

```text
ERROR:  new row for relation "pass" violates check constraint "pass_los_after_aos"
DETAIL:  Failing row contains (SAT-001, 2026-03-01 00:10:00+00, 2026-03-01 00:02:00+00).
```

Someone swapped the two times. The named constraint says exactly which rule broke.

### The NULL loophole in CHECK

Here is the surprise. Insert a satellite with no mass at all:

```sql
INSERT INTO sat VALUES ('SAT-004', NULL, 'Relay-1', NULL);
```

```text
INSERT 0 1
```

Accepted. The condition `NULL > 0` is UNKNOWN, and a `CHECK` refuses only rows where the condition is *false*. [[UNKNOWN passes|check-unknown]]. That is the opposite of `WHERE`, which keeps only rows where the condition is *true*. If the value must be present *and* in range, you need both rules: `mass_kg numeric NOT NULL CHECK (mass_kg > 0)`.

::: key CHECK
`CHECK (condition)` refuses a row when the condition is **false**. A condition that is UNKNOWN because of a NULL **passes**. Pair `CHECK` with `NOT NULL` when the value must exist. A check may compare several columns of the same row, and can be named with `CONSTRAINT name CHECK (...)`.
:::

::: warning CHECK sees one row, not the table
A check cannot say "at most one satellite per plane may be in safe mode" or "this value must be higher than yesterday's", because those need other rows. Rules across rows belong to `UNIQUE`, foreign keys, or code that runs inside a transaction (lesson 4 shows why that last one is harder than it looks).
:::

## PRIMARY KEY: UNIQUE plus NOT NULL, once per table

A primary key is a unique constraint whose columns are also all `NOT NULL`, and a table may have only one. It is the identity other tables point at. A table may still have other `UNIQUE` constraints — `dim_satellite` last lesson had a surrogate primary key plus unique `norad_id` and `cospar_id`.

For telemetry, the primary key is usually the natural key of a sample: `(sat_id, ts, channel)`. That one line is what stops a retransmitted downlink frame from turning into a second copy of the same sample.

::: example A packet table that refuses bad data
**The rules.** One row per satellite, timestamp and channel. The value must be present. A quality flag must be 0, 1, 2 or 3 (0 = good, higher = more suspect), and defaults to 0.

**PostgreSQL.**

```sql
CREATE TABLE packet (
  sat_id  text NOT NULL,
  ts      timestamptz NOT NULL,
  channel text NOT NULL,
  value   double precision NOT NULL,
  quality smallint NOT NULL DEFAULT 0,
  CONSTRAINT packet_quality_range CHECK (quality BETWEEN 0 AND 3),
  PRIMARY KEY (sat_id, ts, channel)
);
```

`DEFAULT 0` fills in `quality` when an insert leaves it out. `BETWEEN 0 AND 3` includes both ends, as in the first SQL module.

**Try three inserts.**

```sql
INSERT INTO packet VALUES ('SAT-001','2026-03-01 00:00Z','BUS_TEMP',20.0,7);
INSERT INTO packet VALUES ('SAT-001','2026-03-01 00:00Z','BUS_TEMP',20.0,0);
INSERT INTO packet VALUES ('SAT-001','2026-03-01 00:00Z','BUS_TEMP',20.5,0);
```

```text
ERROR:  new row for relation "packet" violates check constraint "packet_quality_range"
DETAIL:  Failing row contains (SAT-001, 2026-03-01 00:00:00+00, BUS_TEMP, 20, 7).
INSERT 0 1
ERROR:  duplicate key value violates unique constraint "packet_pkey"
DETAIL:  Key (sat_id, ts, channel)=(SAT-001, 2026-03-01 00:00:00+00, BUS_TEMP) already exists.
```

The first is refused for quality 7. The second goes in. The third is the same sample arriving again with a different value, and the key refuses it.

**SQLite**, where the exercises run, accepts the same declarations with its own types (timestamps are ISO-8601 text there):

```sql
CREATE TABLE packet (
    sat_id  TEXT    NOT NULL,
    ts      TEXT    NOT NULL,
    channel TEXT    NOT NULL,
    value   REAL    NOT NULL,
    quality INTEGER NOT NULL DEFAULT 0 CHECK (quality BETWEEN 0 AND 3),
    PRIMARY KEY (sat_id, ts, channel)
);
```

The same three inserts give SQLite's shorter messages:

```text
CHECK constraint failed: quality BETWEEN 0 AND 3
(second insert succeeds)
UNIQUE constraint failed: packet.sat_id, packet.ts, packet.channel
```

And leaving out the value:

```text
NOT NULL constraint failed: packet.value
```

**Check.** Every rule in the list has a line in the table that enforces it, and each bad insert was refused with a message naming that line. Refusing a retransmitted sample is only half of real ingest, though: usually you want the second copy to *replace* the first quietly instead of raising an error. That is an **upsert**, `INSERT … ON CONFLICT`, and lesson 12 is built around it.
:::

::: warning SQLite lets NULL into a primary key unless you say NOT NULL
For historical reasons, SQLite allows NULL in the columns of an ordinary `PRIMARY KEY` (every column except a lone `INTEGER PRIMARY KEY`). With `PRIMARY KEY (sat_id, ts)` and no `NOT NULL`, SQLite happily stores two rows of `(NULL, NULL)`. PostgreSQL never allows it. Write `NOT NULL` on every key column explicitly, and the table behaves the same in both.
:::

## Foreign keys and what happens on delete

A foreign key says every value in a column must exist as a key in another table — every reading belongs to a real satellite. The first SQL module showed it refusing a reading for `SAT-099`, and refusing to delete a satellite that still had readings. That second refusal is only one of several possible answers to the question: *when a referenced row is deleted, what should happen to the rows pointing at it?*

You choose the answer per foreign key with an **[[ON DELETE|on-delete-picture]]** clause:

| Action | What happens to the pointing (child) rows |
| --- | --- |
| `NO ACTION` (the default) | the delete fails if any child rows remain |
| `RESTRICT` | the delete fails if any child rows remain, checked immediately |
| `CASCADE` | the child rows are deleted too |
| `SET NULL` | the child's foreign-key column is set to NULL |
| `SET DEFAULT` | the child's foreign-key column is set to its default value |

The table being pointed at is often called the **parent**, and the table doing the pointing the **child**. Here is a small fleet with three child tables, each with a different action chosen on purpose:

```sql
CREATE TABLE fleet   (sat_id text PRIMARY KEY);
CREATE TABLE station (station_id text PRIMARY KEY);
CREATE TABLE tlm (
  sat_id text NOT NULL REFERENCES fleet ON DELETE RESTRICT,
  ts timestamptz NOT NULL, channel text NOT NULL, value double precision,
  PRIMARY KEY (sat_id, ts, channel));
CREATE TABLE chan_limit (
  sat_id text NOT NULL REFERENCES fleet ON DELETE CASCADE,
  channel text NOT NULL, lo double precision NOT NULL, hi double precision NOT NULL,
  CHECK (lo < hi), PRIMARY KEY (sat_id, channel));
CREATE TABLE anomaly (
  ticket int PRIMARY KEY, sat_id text NOT NULL REFERENCES fleet,
  station_id text REFERENCES station ON DELETE SET NULL, note text);
```

`chan_limit` holds each satellite's alarm limits: the low (`lo`) and high (`hi`) values outside which a channel raises an alarm. `anomaly` holds investigation tickets, each optionally tagged with the ground station where the problem was seen.

::: example Three deletes, three behaviours
The fleet holds SAT-001, SAT-002 and a test entry SAT-099. SAT-001 has one telemetry row and one limit row; SAT-099 has two limit rows and nothing else. Tickets 101 and 102 were seen at HAWAII, ticket 103 at SVALBARD.

**RESTRICT: telemetry protects its satellite.**

```sql
DELETE FROM fleet WHERE sat_id = 'SAT-001';
```

```text
ERROR:  update or delete on table "fleet" violates foreign key constraint "tlm_sat_id_fkey" on table "tlm"
DETAIL:  Key (sat_id)=(SAT-001) is still referenced from table "tlm".
```

Telemetry is the record of what happened. Losing it because someone tidied the fleet list would be a disaster, so the database refuses.

**CASCADE: limits go with their satellite.**

```sql
DELETE FROM fleet WHERE sat_id = 'SAT-099';
SELECT * FROM chan_limit;
```

```text
DELETE 1
 sat_id  | channel  | lo  | hi
---------+----------+-----+----
 SAT-001 | BATT_SOC | 0.2 |  1
(1 row)
```

`DELETE 1` counts only the fleet row, but both of SAT-099's limit rows vanished with it. Alarm limits for a satellite that does not exist mean nothing, so cascading is right.

**SET NULL: tickets outlive a station.**

```sql
DELETE FROM station WHERE station_id = 'HAWAII';
SELECT * FROM anomaly ORDER BY ticket;
```

```text
DELETE 1
 ticket | sat_id  | station_id |        note
--------+---------+------------+---------------------
    101 | SAT-001 |            | Dropout during pass
    102 | SAT-002 |            | Late AOS
    103 | SAT-002 | SVALBARD   | Bit errors
(3 rows)
```

The tickets stay — they are about satellites, and the investigation still matters — but they no longer point at a station that is gone. (For `SET NULL` to work, the column must allow NULL, which is why `station_id` has no `NOT NULL`.)

**Check.** One refusal, one delete that removed 1 + 2 = 3 rows in total, one delete that removed 1 row and blanked 2 references. Each action matched what the child data means.
:::

::: key ON DELETE actions
`ON DELETE NO ACTION` (default) and `RESTRICT` refuse to delete a parent that still has children; `CASCADE` deletes the children too; `SET NULL` blanks the child's reference; `SET DEFAULT` sets it to the column default. Choose by asking what the child row means once the parent is gone: raw telemetry — RESTRICT; per-parent configuration — CASCADE; records about something else that merely mention the parent — SET NULL.
:::

::: warning CASCADE travels further than you think
Cascades chain. If `fleet` cascades to `pass`, and `pass` cascades to `pass_frame`, one `DELETE` of a satellite can remove millions of rows across tables you were not thinking about, and PostgreSQL still reports it as `DELETE 1`. Never put `CASCADE` on a path that reaches raw telemetry.
:::

### NO ACTION, RESTRICT and deferring the check

`NO ACTION` and `RESTRICT` both refuse, and their error messages look the same. The difference is *when* they check. `RESTRICT` checks at the moment each row is touched. `NO ACTION` checks at the end of the statement — or, if the constraint is declared **deferrable**, as late as the end of the whole transaction (a group of statements that succeed or fail together; next lesson is about them).

Deferring lets you do things in an order that is briefly inconsistent, as long as it is consistent when you finish:

```sql
CREATE TABLE d_parent (id text PRIMARY KEY);
CREATE TABLE d_child  (id text REFERENCES d_parent DEFERRABLE INITIALLY IMMEDIATE);

BEGIN;
SET CONSTRAINTS ALL DEFERRED;
INSERT INTO d_child  VALUES ('SAT-200');  -- parent does not exist yet
INSERT INTO d_parent VALUES ('SAT-200');  -- now it does
COMMIT;
```

```text
BEGIN
SET CONSTRAINTS
INSERT 0 1
INSERT 0 1
COMMIT
```

`DEFERRABLE INITIALLY IMMEDIATE` means "checked at once, unless a transaction asks to defer it", and `SET CONSTRAINTS ALL DEFERRED` asks. If the parent never arrives, the check still happens — at `COMMIT`, which fails:

```text
ERROR:  insert or update on table "d_child" violates foreign key constraint "d_child_id_fkey"
DETAIL:  Key (id)=(SAT-201) is not present in table "d_parent".
```

Only `UNIQUE`, `PRIMARY KEY`, foreign keys and `EXCLUDE` constraints can be deferrable in PostgreSQL. `NOT NULL` and `CHECK` are always checked immediately.

## Foreign keys in SQLite are off until you turn them on

SQLite parses `REFERENCES` and `ON DELETE` clauses, but for [[backward compatibility|pragma-history]] it does not enforce them unless each connection switches them on. With the default setting, this orphan reading goes straight in:

```sql
CREATE TABLE fleet (sat_id TEXT PRIMARY KEY);
CREATE TABLE tlm (sat_id TEXT NOT NULL REFERENCES fleet(sat_id) ON DELETE CASCADE,
                  ts TEXT NOT NULL, value REAL);
PRAGMA foreign_keys;                 -- 0: off
INSERT INTO tlm VALUES ('SAT-404','2026-03-01T00:00:00Z',1.0);   -- accepted!
PRAGMA foreign_keys = ON;
INSERT INTO tlm VALUES ('SAT-405','2026-03-01T00:00:00Z',1.0);
```

```text
FOREIGN KEY constraint failed
```

A **PRAGMA** is SQLite's command for reading or changing a setting. The setting lasts only for that connection, so every program that opens the file must run `PRAGMA foreign_keys = ON;` first. Note what switching it on did *not* do: the SAT-404 orphan that slipped in earlier is still there. `NOT NULL`, `UNIQUE` and `CHECK` are always enforced in SQLite; only foreign keys need the pragma.

::: key SQLite foreign keys
SQLite enforces foreign keys only after `PRAGMA foreign_keys = ON;`, run on each connection. Without it, `REFERENCES` and `ON DELETE` are accepted but ignored.
:::

## Adding a constraint to a table that already has data

On a live telemetry table, you often discover a rule after the data is already there. `ALTER TABLE … ADD CONSTRAINT` checks every existing row before it succeeds, which on billions of rows takes a long time and can [[hold up writers|not-valid-lock]]. PostgreSQL lets you split that into two steps:

```sql
ALTER TABLE tlm ADD CONSTRAINT tlm_soc_range
  CHECK (channel <> 'BATT_SOC' OR value BETWEEN 0 AND 1) NOT VALID;
ALTER TABLE tlm VALIDATE CONSTRAINT tlm_soc_range;
```

`NOT VALID` means "enforce this on new rows from now on, but do not check the old ones yet". Read the condition as "either this row is not a battery reading, or its value is between 0 and 1" — a way of saying "battery charge is a fraction" in one check. `VALIDATE CONSTRAINT` scans the old rows later, at a quiet time. Here an old reading of 1.7 was already in the table, so validation fails and tells you the history needs cleaning:

```text
ERROR:  check constraint "tlm_soc_range" of relation "tlm" is violated by some row
```

## Check yourself

::: check
A table has `station_id text UNIQUE` and holds five rows, three of which have `station_id` NULL. Is the table breaking its constraint? What would change with `UNIQUE NULLS NOT DISTINCT`?
:::

::: answer
No. By default a `UNIQUE` constraint compares values with equality, and `NULL = NULL` is UNKNOWN rather than true, so the three NULL rows do not clash and all are allowed. With `UNIQUE NULLS NOT DISTINCT` (PostgreSQL 15+), NULLs count as equal to each other, so at most one row could have a NULL `station_id`; adding that constraint to this table would fail until two of the NULL rows were fixed.
:::

::: check
A column is declared `battery_temp_c numeric CHECK (battery_temp_c BETWEEN -20 AND 60)`. Which of these inserts succeed: `75`, `-5`, `NULL`? How would you make all but one of them fail?
:::

::: answer
`75` fails: the condition is false. `-5` succeeds: the condition is true. `NULL` succeeds: `NULL BETWEEN -20 AND 60` is UNKNOWN, and a `CHECK` only refuses *false*. To refuse the NULL as well, add `NOT NULL` to the column. Then only `-5` is accepted.
:::

::: check
For each child table, pick an `ON DELETE` action for its foreign key to `satellite`, and say why: (a) `raw_frame`, the downlinked bytes; (b) `sat_tag`, labels like "demo" or "customer-A" attached to a satellite; (c) `conjunction_alert`, warnings about close approaches between two objects, with a nullable `our_sat_id` column.
:::

::: answer
(a) `RESTRICT` (or the default `NO ACTION`): raw frames are the primary record and must never disappear as a side effect of tidying the satellite list. (b) `CASCADE`: a tag has no meaning without its satellite. (c) `SET NULL`: the alert is a record of an event involving another object too; it should survive, with the reference to our deleted satellite blanked. The column is nullable, so `SET NULL` can work.
:::

::: check
A colleague builds a SQLite test database with `REFERENCES fleet(sat_id)` on the telemetry table, runs the test suite, and it happily inserts readings for satellites that do not exist. What is missing, and what should the test setup do?
:::

::: answer
SQLite does not enforce foreign keys unless the connection runs `PRAGMA foreign_keys = ON;`. The `REFERENCES` clause was accepted but ignored. The test setup should run the pragma right after opening every connection — the setting does not persist in the file — and ideally assert `PRAGMA foreign_keys` returns 1 before running tests.
:::

::: check
Write a single-table rule that says a ground-station pass must last no more than 20 minutes, where `aos_ts` and `los_ts` are `timestamptz NOT NULL`. Why is this a `CHECK` and not something that needs a trigger or application code?
:::

::: answer
`CONSTRAINT pass_max_20_min CHECK (los_ts - aos_ts <= interval '20 minutes')`. Subtracting two `timestamptz` values gives an `interval`, which can be compared with another interval. It is a `CHECK` because it involves only columns of the same row. (Combine it with `CHECK (los_ts > aos_ts)` so the length is also positive.) A rule that compared against *other* passes — "no two passes for the same satellite overlap" — would need something beyond `CHECK`.
:::

## Summary

| Constraint | Refuses | Notes |
| --- | --- | --- |
| `NOT NULL` | NULL in the column | use unless NULL has a real meaning |
| `UNIQUE` | two equal values | many NULLs allowed; `NULLS NOT DISTINCT` in PG 15+ |
| `CHECK (cond)` | rows where `cond` is false | UNKNOWN passes; one row only |
| `PRIMARY KEY` | duplicates and NULLs | one per table; UNIQUE + NOT NULL |
| `REFERENCES … ON DELETE` | orphans | NO ACTION, RESTRICT, CASCADE, SET NULL, SET DEFAULT |
| `DEFERRABLE` | checks at COMMIT when deferred | UNIQUE, PK, FK, EXCLUDE only |
| SQLite FKs | nothing, until `PRAGMA foreign_keys = ON` | per connection |

Constraints guard one change at a time. But the type 2 update last lesson, and the deferred foreign key above, both needed several changes to happen *together* or not at all, and both used `BEGIN` and `COMMIT` without explaining them. Next lesson does: transactions, what ACID promises, and what happens when two sessions change the same rows at once.

::: context relation-word Why PostgreSQL says "relation"
"Relation" is the mathematician's word for a table, from the relational model you met in the first SQL module. PostgreSQL uses it in messages because the same machinery holds tables, views, indexes and sequences, and they are all "relations" inside the system catalog. So `relation "sat"` in an error means the table `sat` here. You will also meet it in `pg_class`, the catalog table listing every relation in a database.
:::

::: context null-unique-picture Two blanks never clash
A `UNIQUE` check asks, for the new value, "is there an equal value already?" For a number the answer is yes or no. For NULL, every comparison is UNKNOWN, so the answer is never yes, and the row is let in.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="12" y="20" font-size="12" font-weight="700" fill="#1f2a44">norad_id  UNIQUE</text>
  <rect x="12" y="30" width="110" height="24" fill="#ffffff" stroke="#1f2a44"/>
  <text x="67" y="47" font-size="12" fill="#1f2a44" text-anchor="middle">60101</text>
  <rect x="12" y="54" width="110" height="24" fill="#ffffff" stroke="#1f2a44"/>
  <text x="67" y="71" font-size="12" fill="#6c7a93" text-anchor="middle">NULL</text>
  <rect x="12" y="78" width="110" height="24" fill="#ffffff" stroke="#1f2a44"/>
  <text x="67" y="95" font-size="12" fill="#6c7a93" text-anchor="middle">NULL</text>
  <text x="150" y="47" font-size="12" fill="#b4232c">new 60101: equal, refused</text>
  <text x="150" y="83" font-size="12" fill="#1d6fd1">new NULL: UNKNOWN, accepted</text>
  <line x1="146" y1="42" x2="126" y2="42" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="146" y1="79" x2="126" y2="79" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="12" y="132" font-size="11" fill="#6c7a93">NULLS NOT DISTINCT would refuse the second NULL</text>
</svg>
```
:::

::: context aos-los Rising and setting
A satellite in low Earth orbit is in view of any one ground station for only a few minutes per pass. **Acquisition of signal** (AOS) is when the station's antenna first locks onto it as it rises over the horizon; **loss of signal** (LOS) is when it sets and the link drops. At about 550 km altitude even a pass straight overhead lasts only about twelve minutes, which is why fleets need many ground stations spread around the world and why a pass table with LOS before AOS is certainly a bug.
:::

::: context check-unknown Why a CHECK lets UNKNOWN through
The SQL standard defines a check as violated only when its condition is false. The designers chose this so that a column could be optional and still carry a range rule: "if a mass is given, it must be positive". Under the other choice, every checked column would silently become required. The price is that you must remember `NOT NULL` separately. `WHERE`, by contrast, keeps rows only when the condition is true, because a query should return what you *know* matches.
:::

::: context on-delete-picture Three children, three answers
Deleting a parent row sends a question down every foreign key that points at it. Each child table answers in its own way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="8" width="100" height="32" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="29" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">parent row</text>
  <line x1="160" y1="40" x2="60" y2="84" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="40" x2="180" y2="84" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="200" y1="40" x2="300" y2="84" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="10" y="84" width="100" height="32" rx="6" fill="#ffffff" stroke="#b4232c"/>
  <text x="60" y="105" font-size="12" fill="#b4232c" text-anchor="middle">RESTRICT</text>
  <rect x="130" y="84" width="100" height="32" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="180" y="105" font-size="12" fill="#1f2a44" text-anchor="middle">CASCADE</text>
  <rect x="250" y="84" width="100" height="32" rx="6" fill="#ffffff" stroke="#1d6fd1"/>
  <text x="300" y="105" font-size="12" fill="#1d6fd1" text-anchor="middle">SET NULL</text>
  <text x="60" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">delete refused</text>
  <text x="180" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">children deleted</text>
  <text x="300" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">children kept,</text>
  <text x="300" y="156" font-size="11" fill="#1f2a44" text-anchor="middle">pointer blanked</text>
</svg>
```
:::

::: context pragma-history Why SQLite leaves foreign keys off
SQLite added foreign-key enforcement in version 3.6.19, in 2009. By then millions of applications had schemas with `REFERENCES` clauses that had always been ignored, and some of their data broke those rules. Turning enforcement on by default would have made those programs start failing after an upgrade. So SQLite kept it off and let each program opt in. The sql.js engine that runs this app's exercises is SQLite compiled for the browser, so the same rule applies there.
:::

::: context not-valid-lock Why split adding a check in two
A plain `ADD CONSTRAINT` must read every row while holding a lock that blocks writes to the table. On a telemetry table taking tens of thousands of rows a second, blocking writes for the length of a full scan means the ingest pipeline backs up. `ADD … NOT VALID` finishes almost instantly, and `VALIDATE CONSTRAINT` scans under a weaker lock that lets inserts continue. The same two-step trick works for foreign keys.
:::
