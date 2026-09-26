---
id: l02-select-from-where
title: "Asking questions: SELECT, FROM, WHERE"
minutes: 22
covers:
  - SELECT, FROM, WHERE; comparison, BETWEEN, IN, LIKE
---

Last lesson you met the fleet database: a `satellite` table with one row per spacecraft, and a `telemetry` table with one row per reading. You saw one statement, `SELECT * FROM satellite;`, which prints the whole table. For eight satellites that is fine. For six thousand satellites and billions of readings, printing everything is useless. You need to ask for exactly the rows and columns you want.

That is what this lesson teaches. A question to a database is called a **[[query|query-word]]**, and almost every query you will ever write is built on three words: `SELECT` says which columns you want, `FROM` says which table to look in, and `WHERE` says which rows to keep. Add a handful of ways to write the condition — comparisons, `BETWEEN`, `IN` and `LIKE` — and you can already answer most of the questions an operator asks on a busy shift.

Every query here was run on the fleet data from lesson 01, and the output shown is exactly what the database printed.

## SELECT and FROM: which columns, which table

Think of a table as a big class photo. `FROM` picks the photo. `SELECT` says which parts of each person you want to see — only the names, or the names and the heights.

```sql
SELECT sat_id, name, status
FROM satellite;
```

Read it aloud: "select sat-id, name and status from satellite". The columns you want go after `SELECT`, separated by commas, in the order you want them printed. The table goes after `FROM`.

```text
 sat_id  |     name     |    status
---------+--------------+---------------
 SAT-001 | Pathfinder-1 | ACTIVE
 SAT-002 | Pathfinder-2 | ACTIVE
 SAT-003 | Pathfinder-3 | SAFE_MODE
 SAT-004 | Relay-1      | ACTIVE
 SAT-005 | Relay-2      | ACTIVE
 SAT-006 | Relay-3      | DEORBITED
 SAT-007 | Mini-1       | ACTIVE
 SAT-008 | Mini-2       | COMMISSIONING
(8 rows)
```

All eight rows came back, but only three of the seven columns. The answer to a query is itself a table — a grid of rows and named columns — called the **result set**. That fact will matter a lot later: because a result is a table, you can feed it into another query.

`SELECT *` means "every column", in the order the table was created. It is handy for a first look at a table you do not know. In code that other people depend on, name the columns you need instead. If someone later adds a column to the table, a `SELECT *` query quietly starts returning it too, and whatever reads your result may break.

You can also give a column a new name in the result with `AS`, read "as":

```sql
SELECT sat_id, name AS satellite_name, altitude_km AS alt
FROM satellite
WHERE plane = 4;
```

```text
 sat_id  | satellite_name | alt
---------+----------------+-----
 SAT-007 | Mini-1         | 530
 SAT-008 | Mini-2         | 530
(2 rows)
```

The new name is an **alias**. It changes only the label on the result, not the table. Lesson 04 uses aliases a lot, to name columns you compute. (That query already used `WHERE`, which is next.)

::: key The three core clauses
`SELECT` lists the columns to return, `FROM` names the table, and `WHERE` keeps only the rows whose condition is true. The result of a query is itself a table, called the result set.
:::

## WHERE: which rows to keep

`WHERE` is a filter. Picture every row of the table walking up to a gate one at a time. At the gate is a yes-or-no question. Rows that answer *yes* go through into the result; every other row is dropped.

```sql
SELECT sat_id, name
FROM satellite
WHERE status = 'ACTIVE';
```

```text
 sat_id  |     name
---------+--------------
 SAT-001 | Pathfinder-1
 SAT-002 | Pathfinder-2
 SAT-004 | Relay-1
 SAT-005 | Relay-2
 SAT-007 | Mini-1
(5 rows)
```

The question at the gate was `status = 'ACTIVE'`, read "status equals the text ACTIVE". Five satellites answered yes. The other three — SAFE_MODE, DEORBITED and COMMISSIONING — answered no and were **[[filtered out|where-filter]]**.

The condition is checked separately for each row, using only that row's own values. A condition can mention any column of the table, even one you are not selecting: this query tests `status` but prints only `sat_id` and `name`.

### Comparison operators

These are the symbols you can use to compare two values:

| Operator | Read it as | Example | True for |
| --- | --- | --- | --- |
| `=` | equals | `plane = 2` | SAT-003, SAT-004 |
| `<>` or `!=` | is not equal to | `status <> 'ACTIVE'` | the three non-active satellites |
| `<` | is less than | `altitude_km < 540` | SAT-007, SAT-008 |
| `>` | is greater than | `altitude_km > 540` | SAT-001, 002, 005, 006 |
| `<=` | is less than or equal to | `mass_kg <= 306` | SAT-001, 002, 003 |
| `>=` | is greater than or equal to | `launch_date >= '2025-01-01'` | SAT-007, SAT-008 |

Notice that SQL uses a single `=` to test equality. (Many programming languages use `==`; SQL does not.) `<>` is the standard way to write "not equal"; `!=` works in PostgreSQL and SQLite too.

Comparisons work on text and dates as well as numbers. Text compares letter by letter, like the order of words in a dictionary. Dates compare by time, so `launch_date >= '2025-01-01'` means "launched on or after New Year's Day 2025".

### Quotes: single for values, double for names

A piece of text written inside a query is called a **string literal**, and it goes in **single quotes**: `'ACTIVE'`. Numbers go bare: `540`, `0.30`. Without the quotes, the database would read ACTIVE as the name of a column.

Double quotes mean something completely different: they wrap a **[[name|double-quotes]]**, such as a column name. Mixing them up gives a confusing error in PostgreSQL:

```sql
SELECT sat_id FROM satellite WHERE status = "ACTIVE";
```

```text
ERROR:  column "ACTIVE" does not exist
```

The database looked for a column called ACTIVE and found none.

::: warning String comparisons are exact
`WHERE status = 'active'` returns zero rows, because the stored text is `ACTIVE` in capitals and `=` compares text exactly, letter for letter and case for case. A trailing space counts too: `'ACTIVE '` is a different string. When a filter you are sure is right returns nothing, check the exact spelling of the stored values first.
:::

::: warning SQLite forgives double quotes, which hides bugs
If you write `"ACTIVE"` in SQLite and no column has that name, SQLite quietly treats it as the text `'ACTIVE'`, and the query works. Then someone adds a column named `active`, and the same query silently changes meaning. Always use single quotes for values, in every database.
:::

## Combining conditions: AND, OR, NOT

One condition is rarely enough. You combine them with three words:

- `A AND B` is true only when both A and B are true.
- `A OR B` is true when at least one of them is true.
- `NOT A` is true when A is false.

Here is a trap. Suppose you want the satellites in plane 1 that are either active or in safe mode. It is natural to write this:

```sql
SELECT sat_id, plane, status
FROM satellite
WHERE status = 'ACTIVE' OR status = 'SAFE_MODE' AND plane = 1;
```

```text
 sat_id  | plane | status
---------+-------+--------
 SAT-001 |     1 | ACTIVE
 SAT-002 |     1 | ACTIVE
 SAT-004 |     2 | ACTIVE
 SAT-005 |     3 | ACTIVE
 SAT-007 |     4 | ACTIVE
(5 rows)
```

Satellites from planes 2, 3 and 4 came back. Why? Because `AND` is done before `OR`, the same way multiplication is done before addition in arithmetic. The database read the condition as

```text
status = 'ACTIVE'  OR  (status = 'SAFE_MODE' AND plane = 1)
```

— every active satellite anywhere, plus safe-mode satellites in plane 1. Parentheses fix it:

```sql
SELECT sat_id, plane, status
FROM satellite
WHERE (status = 'ACTIVE' OR status = 'SAFE_MODE') AND plane = 1;
```

```text
 sat_id  | plane | status
---------+-------+--------
 SAT-001 |     1 | ACTIVE
 SAT-002 |     1 | ACTIVE
(2 rows)
```

::: key AND binds tighter than OR
In a WHERE clause, `AND` is evaluated before `OR`, like multiplication before addition. Whenever a condition mixes `AND` and `OR`, write the parentheses yourself.
:::

## BETWEEN: a range with both ends included

Checking that a value lies in a range comes up constantly: altitudes in a band, readings in a time window, charge between two limits. `BETWEEN` is the short way to say it:

```sql
SELECT sat_id, altitude_km
FROM satellite
WHERE altitude_km BETWEEN 540 AND 550;
```

```text
 sat_id  | altitude_km
---------+-------------
 SAT-001 |         550
 SAT-002 |         550
 SAT-003 |         540
 SAT-004 |         540
(4 rows)
```

Read it "altitude between 540 and 550". The satellites at exactly 540 and exactly 550 were included. `BETWEEN` includes **both ends**, so

```text
x BETWEEN low AND high      means      x >= low AND x <= high
```

Two details catch people. The smaller number must come first: `BETWEEN 550 AND 540` asks for values that are at least 550 *and* at most 540, which nothing is, so it returns no rows (PostgreSQL has `BETWEEN SYMMETRIC` if you want the order not to matter). And `NOT BETWEEN 540 AND 550` keeps values below 540 or above 550.

::: key BETWEEN is inclusive
`x BETWEEN a AND b` is the same as `x >= a AND x <= b`: both end values are included, and `a` must be the smaller one.
:::

::: example A battery triage band
**Question.** Operations defines a battery state of charge from 0.30 to 0.70 as the "watch" band: not critical, but worth a look. Which battery readings are in the band?

**Step 1: pick the rows.** Only battery readings count, so one condition is `channel = 'BATT_SOC'`. The other is the band itself.

**Step 2: write the query.**

```sql
SELECT sat_id, ts, value
FROM telemetry
WHERE channel = 'BATT_SOC'
  AND value BETWEEN 0.30 AND 0.70;
```

```text
 sat_id  |          ts          | value
---------+----------------------+-------
 SAT-002 | 2026-03-01T00:00:00Z |  0.42
 SAT-005 | 2026-03-01T00:00:00Z |  0.66
 SAT-008 | 2026-03-01T00:00:00Z |  0.55
(3 rows)
```

**Step 3: check it by hand.** The ten battery readings are 0.94, 0.91, 0.42, (empty), 0.19, 0.77, 0.75, 0.66, 0.88 and 0.55. The ones from 0.30 to 0.70 are 0.42, 0.66 and 0.55 — three, matching the result. 0.19 is below the band and the rest are above it.

**Step 4: notice what is missing.** SAT-002's reading at 00:01 has no value at all (it is NULL). It is not in the result, and it is not "outside the band" either — the database cannot say where a missing number lies, so it did not keep the row. That behavior is the subject of lesson 05. For now, remember that a missing value never passes a comparison.
:::

::: warning Do not test measured values with =
`WHERE value = 0.94` returns **zero rows** in PostgreSQL, even though SAT-001 reported 0.94. The column type `REAL` stores a close binary approximation of 0.94, and it is not exactly equal to the number 0.94 you typed. (SQLite happens to find the row, because it stores the value differently.) For measurements, always ask for a range — `value BETWEEN 0.935 AND 0.945`, or `value >= 0.94` — never exact equality. Lesson 06 explains why.
:::

### Ranges of time

The `ts` column is text in a fixed pattern, year-month-day-T-hour:minute:second-Z. Because every part is written with the same number of digits, from biggest unit to smallest, alphabetical order and time order are the same, so comparisons on this [[ISO 8601|iso-8601]] text work. (Lesson 07 introduces a proper time type.)

::: example Readings in a one-minute window
**Question.** Which readings arrived during the minute starting at 00:01:00?

**Step 1: decide on the edges.** The window starts at `2026-03-01T00:01:00Z` and includes it. It ends at `2026-03-01T00:02:00Z` and does *not* include it, because that instant is the start of the next minute.

**Step 2: write it as two comparisons.** "Greater than or equal to the start, and strictly less than the end":

```sql
SELECT sat_id, ts, value
FROM telemetry
WHERE ts >= '2026-03-01T00:01:00Z'
  AND ts <  '2026-03-01T00:02:00Z';
```

```text
 sat_id  |          ts          | value
---------+----------------------+-------
 SAT-001 | 2026-03-01T00:01:00Z |  0.91
 SAT-002 | 2026-03-01T00:01:00Z |
 SAT-004 | 2026-03-01T00:01:00Z |  0.75
(3 rows)
```

**Step 3: check.** Three readings in the table carry the time 00:01:00, and all three came back. Nothing from 00:00:00 slipped in.

**Why not BETWEEN?** `BETWEEN '…00:01:00Z' AND '…00:02:00Z'` would include both ends, so a reading at exactly 00:02:00 would land in this minute *and* the next one, and be counted twice when you add up minute after minute. A window that includes its start but not its end is called **half-open**. It is the safe habit for time: back-to-back windows then cover every instant exactly once.
:::

## IN: matching any value in a list

When you want "status is SAFE_MODE or status is COMMISSIONING", writing `OR` over and over gets long. `IN` takes a list in parentheses:

```sql
SELECT sat_id, status
FROM satellite
WHERE status IN ('SAFE_MODE', 'COMMISSIONING');
```

```text
 sat_id  |    status
---------+---------------
 SAT-003 | SAFE_MODE
 SAT-008 | COMMISSIONING
(2 rows)
```

`x IN (a, b, c)` means exactly `x = a OR x = b OR x = c`. The opposite, `NOT IN`, keeps rows that match none of them: `status NOT IN ('ACTIVE', 'DEORBITED')` returns the same two satellites.

The list does not have to be typed out. In place of the list you can write a whole query in parentheses — a **subquery** — and `IN` compares against every value it returns. `sat_id IN (SELECT sat_id FROM telemetry)` means "satellites that have at least one reading". The next module teaches subqueries properly; here the point is one trap they share with plain lists.

### The NOT IN trap

Watch what happens when a NULL sneaks into the list:

```sql
SELECT sat_id
FROM satellite
WHERE sat_id NOT IN ('SAT-001', 'SAT-002', NULL);
```

```text
 sat_id
--------
(0 rows)
```

You might expect six satellites. You get none. Here is why, one step at a time. `NOT IN` means "not equal to each item", so for SAT-005 the database checks

```text
'SAT-005' <> 'SAT-001'  AND  'SAT-005' <> 'SAT-002'  AND  'SAT-005' <> NULL
```

The first two parts are true. The third asks "is SAT-005 different from a value we do not know?" The honest answer is "we cannot tell", and SQL has a third truth value for exactly that: **[[UNKNOWN|unknown-truth]]**. True AND true AND unknown is unknown — it might be true, it might not. And `WHERE` keeps only rows whose condition is **true**. So every row is dropped.

With a typed list you would notice the NULL. With a subquery you usually cannot see it: if the column the subquery returns can hold even one NULL, the whole `NOT IN` goes silent. `NOT EXISTS`, which the next module teaches, asks the same question without this trap.

::: key NOT IN with a subquery that can return NULL
If any returned value is NULL the whole NOT IN is never TRUE, so the query silently returns zero rows. Use NOT EXISTS, which has no such trap.
:::

## LIKE: matching patterns in text

Sometimes you do not know the whole value, only its shape: every satellite whose name starts with "Relay", every id ending in 1. `LIKE` matches text against a **pattern** that can contain two **wildcards** — symbols that stand for "anything":

- `%` (percent) matches any run of characters, including none at all.
- `_` (underscore) matches exactly one character.

```sql
SELECT sat_id, name FROM satellite WHERE name LIKE 'Relay%';
```

```text
 sat_id  |  name
---------+---------
 SAT-004 | Relay-1
 SAT-005 | Relay-2
 SAT-006 | Relay-3
(3 rows)
```

Read `'Relay%'` as "Relay, then anything". Putting the wildcard first finds names by their ending:

```sql
SELECT sat_id, name FROM satellite WHERE name LIKE '%-1';
```

```text
 sat_id  |     name
---------+--------------
 SAT-001 | Pathfinder-1
 SAT-004 | Relay-1
 SAT-007 | Mini-1
(3 rows)
```

And `sat_id LIKE 'SAT-00_'` matches all eight ids, because each is "SAT-00" followed by exactly one more character. A pattern with no wildcard at all, `LIKE 'Mini-1'`, is the same as `= 'Mini-1'`.

::: warning LIKE and capital letters differ between databases
In PostgreSQL `LIKE` is case-sensitive: `name LIKE 'relay%'` finds nothing. PostgreSQL adds `ILIKE` (the I is for "insensitive") to ignore case. In SQLite, `LIKE` ignores case for the letters A to Z by default, so `'relay%'` finds all three relays, and `ILIKE` does not exist. If your query must behave the same on both, match the stored case exactly.
:::

### Why a leading wildcard is slow

Remember the index from lesson 01: the database keeps a column's values in sorted order, in a tree, so it can jump to one value in a few steps. Sorted order is also great for a pattern that starts with fixed text. Every name beginning "Unit-1234" sits in one block of the sorted list, the way every word starting "sat" sits together in a [[dictionary|btree-prefix]]. Here is PostgreSQL planning that search on a test table, `big_sat`, filled with 200,000 made-up names from `Unit-1` to `Unit-200000`, with an index on `name` built for pattern matching:

```sql
EXPLAIN SELECT * FROM big_sat WHERE name LIKE 'Unit-1234%';
```

```text
 Index Scan using big_sat_name_idx on big_sat  (cost=0.42..8.44 rows=20 width=21)
   Index Cond: ((name ~>=~ 'Unit-1234'::text) AND (name ~<~ 'Unit-1235'::text))
   Filter: (name ~~ 'Unit-1234%'::text)
```

(`EXPLAIN` shows the plan instead of running the query.) The database turned the pattern into a range — at least `Unit-1234`, less than `Unit-1235` — and used the index to jump straight there. Now put the wildcard first:

```sql
EXPLAIN SELECT * FROM big_sat WHERE name LIKE '%1234';
```

```text
 Seq Scan on big_sat  (cost=0.00..3780.00 rows=20 width=21)
   Filter: (name ~~ '%1234'::text)
```

A **Seq Scan** (sequential scan) reads every row, one after another. Names ending in 1234 are scattered all through the sorted order, so the index cannot help, and the estimated cost — in the planner's own units of work — rose from about 8 to about 3,780. On a billion-row table that difference is seconds versus hours. For searching the middle or end of text, databases offer other kinds of index, such as full-text and [[trigram|trigram]] indexes.

::: key Why a leading wildcard is slow
A B-tree index is ordered by prefix, so a pattern starting with a wildcard cannot narrow the search and the engine scans. Full-text or trigram indexing exists precisely for that case.
:::

## Saving a query as a view

In this module's exercises you hand in your answer as a **[[view|view-word]]** — a query saved in the database under a name. You create one with `CREATE VIEW name AS` followed by the query:

```sql
DROP VIEW IF EXISTS answer;
CREATE VIEW answer AS
SELECT sat_id, ts, value
FROM telemetry
WHERE channel = 'BATT_SOC'
  AND value < 0.5;
```

The first line removes any older view called `answer`, so you can run the script again and again. After that, `SELECT * FROM answer;` runs the saved query as if `answer` were a table:

```text
 sat_id  |          ts          | value
---------+----------------------+-------
 SAT-002 | 2026-03-01T00:00:00Z |  0.42
 SAT-003 | 2026-03-01T00:00:00Z |  0.19
(2 rows)
```

A view stores the question, not the answer. Add a new low reading to `telemetry` and the view shows it the next time you look.

## Check yourself

::: check
Write a query that lists the id and launch date of every satellite in plane 3 or plane 4 that is heavier than 750 kg. Which rows come back?
:::

::: answer
```sql
SELECT sat_id, launch_date
FROM satellite
WHERE plane IN (3, 4) AND mass_kg > 750;
```

Planes 3 and 4 hold SAT-005 and SAT-006 (800 kg each) and SAT-007 and SAT-008 (740 kg each). Only the 800 kg ones pass `mass_kg > 750`, so the result is SAT-005 and SAT-006, both launched 2024-06-20. Using `IN (3, 4)` avoids the AND/OR trap; with `OR` you would need `(plane = 3 OR plane = 4) AND mass_kg > 750`, parentheses included.
:::

::: check
How many satellites does `WHERE altitude_km BETWEEN 530 AND 540` return, and how many does `WHERE altitude_km > 530 AND altitude_km < 540` return?
:::

::: answer
`BETWEEN` includes both ends. The altitudes are 550, 550, 540, 540, 560, 560, 530 and 530, so 530 and 540 both count: four satellites (SAT-003, SAT-004, SAT-007, SAT-008). The strict version needs an altitude above 530 and below 540, and no satellite has one — zero rows. The whole difference is the two ends.
:::

::: check
A teammate writes `WHERE name LIKE 'Mini_'` to find the Mini satellites and gets nothing. Why, and what should it be?
:::

::: answer
The names are `Mini-1` and `Mini-2`: six characters. The pattern `'Mini_'` means "Mini" plus exactly one character, which is only five characters long, so it cannot match. `'Mini-_'` (six characters) or `'Mini%'` (Mini, then anything) both return SAT-007 and SAT-008.
:::

::: check
A list of satellites to exclude from a report comes from another system and contains `'SAT-003'`, `'SAT-006'` and one NULL. The report query uses `WHERE sat_id NOT IN (...)` with that list. What does the report show, and how could you make the list safe?
:::

::: answer
It shows no rows at all. For each satellite, `NOT IN` checks "not equal to SAT-003, and not equal to SAT-006, and not equal to NULL". The last comparison is UNKNOWN, so the whole condition is at best UNKNOWN, never TRUE, and WHERE drops every row. Remove the NULL from the list (or, when the list comes from a subquery, filter the NULLs out inside it or use NOT EXISTS). Then the report shows the six other satellites.
:::

::: check
Which of these can use an ordinary sorted index on `sat_id`, and which force a scan of every row: `sat_id = 'SAT-004'`, `sat_id LIKE 'SAT-00%'`, `sat_id LIKE '%4'`?
:::

::: answer
`= 'SAT-004'` can jump straight to one entry. `LIKE 'SAT-00%'` starts with fixed text, so the database can turn it into a range (from `SAT-00` up to, but not including, `SAT-01`) and read that one block of the index. `LIKE '%4'` starts with a wildcard: ids ending in 4 are spread all through the sorted order, so the database must scan every row.
:::

## Summary

| Piece | What it does | Example |
| --- | --- | --- |
| `SELECT a, b` | choose columns (`*` for all) | `SELECT sat_id, name` |
| `AS` | rename a result column | `altitude_km AS alt` |
| `FROM t` | choose the table | `FROM telemetry` |
| `WHERE cond` | keep rows whose condition is true | `WHERE status = 'ACTIVE'` |
| `=`, `<>`, `<`, `>`, `<=`, `>=` | compare values | `altitude_km > 540` |
| `AND`, `OR`, `NOT` | combine conditions; AND before OR | `(a OR b) AND c` |
| `BETWEEN a AND b` | range, both ends included | `value BETWEEN 0.30 AND 0.70` |
| `ts >= s AND ts < e` | half-open time window | one minute of readings |
| `IN (…)` / `NOT IN (…)` | match any / none of a list | beware a NULL in `NOT IN` |
| `LIKE` with `%` and `_` | pattern match on text | `name LIKE 'Relay%'` |
| `CREATE VIEW v AS …` | save a query under a name | `CREATE VIEW answer AS …` |

You can now pick exactly the rows and columns you want, but they come back in whatever order the database likes, possibly with repeats. Next lesson puts them in order with `ORDER BY`, keeps only the top few with `LIMIT`, and removes duplicates with `DISTINCT`.

::: context query-word Asking, in Latin
"Query" comes from the Latin *quaerere*, "to ask" or "to seek" — the same root as "question" and "quest". In databases a query is any statement that asks for data back. Engineers use the word loosely for any SQL statement, but strictly `INSERT` and `CREATE TABLE` change things, while a query only reads.
:::

::: context where-filter WHERE as a gate
Every row meets the same yes-or-no question. Only the rows that answer a clear *yes* go through.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <text x="60" y="16" font-size="11" fill="#1f2a44" text-anchor="middle">satellite</text>
  <g font-size="11" text-anchor="middle">
    <rect x="20" y="24" width="80" height="18" fill="#8fb8f0" stroke="#1f2a44"/><text x="60" y="37" fill="#1f2a44">SAT-001</text>
    <rect x="20" y="44" width="80" height="18" fill="#8fb8f0" stroke="#1f2a44"/><text x="60" y="57" fill="#1f2a44">SAT-002</text>
    <rect x="20" y="64" width="80" height="18" fill="#fff" stroke="#6c7a93"/><text x="60" y="77" fill="#6c7a93">SAT-003</text>
    <rect x="20" y="84" width="80" height="18" fill="#8fb8f0" stroke="#1f2a44"/><text x="60" y="97" fill="#1f2a44">SAT-004</text>
    <rect x="20" y="104" width="80" height="18" fill="#8fb8f0" stroke="#1f2a44"/><text x="60" y="117" fill="#1f2a44">SAT-005</text>
    <rect x="20" y="124" width="80" height="18" fill="#fff" stroke="#6c7a93"/><text x="60" y="137" fill="#6c7a93">SAT-006</text>
    <rect x="20" y="144" width="80" height="18" fill="#8fb8f0" stroke="#1f2a44"/><text x="60" y="157" fill="#1f2a44">SAT-007</text>
    <rect x="20" y="164" width="80" height="18" fill="#fff" stroke="#6c7a93"/><text x="60" y="177" fill="#6c7a93">SAT-008</text>
  </g>
  <rect x="140" y="60" width="90" height="70" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="185" y="88" font-size="11" fill="#1f2a44" text-anchor="middle">status =</text>
  <text x="185" y="104" font-size="11" fill="#1f2a44" text-anchor="middle">'ACTIVE' ?</text>
  <line x1="104" y1="95" x2="136" y2="95" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="138,95 130,90 130,100" fill="#1f2a44"/>
  <line x1="230" y1="80" x2="262" y2="60" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="300" y="46" font-size="12" fill="#1d6fd1" text-anchor="middle">yes: 5 rows kept</text>
  <line x1="230" y1="112" x2="262" y2="140" stroke="#b4232c" stroke-width="1.5"/>
  <text x="300" y="156" font-size="12" fill="#b4232c" text-anchor="middle">no: 3 dropped</text>
</svg>
```

The blue rows (ACTIVE) pass; the grey ones (SAFE_MODE, DEORBITED, COMMISSIONING) do not. The gate never looks at more than one row at a time.
:::

::: context double-quotes What double quotes are for
Double quotes let a name contain things a bare name cannot: spaces, capital letters, or a word SQL already uses. `"Battery SOC"` could be a column name; `Battery SOC` without quotes would be two words and an error. PostgreSQL also turns unquoted names into lowercase, so `SELECT Sat_ID` finds the column `sat_id`, but `SELECT "Sat_ID"` looks for a column spelled exactly with those capitals. The easy life is to name everything in lowercase with underscores and never need double quotes at all.
:::

::: context iso-8601 Why this time format sorts correctly
The pattern `2026-03-01T00:01:00Z` comes from an international standard called ISO 8601. It writes the biggest unit first (year), then month, day, hour, minute and second, each padded with zeros to a fixed width. That means comparing two of these strings character by character gives the same answer as comparing the times. A format like `3/1/2026 12:01 AM` does not have this property: as text, "10/1" sorts before "3/1", even though October comes after March. Telemetry systems stick to ISO 8601 for exactly this reason.
:::

::: context unknown-truth A third answer: unknown
Most logic has two answers, true and false. SQL has three: TRUE, FALSE and UNKNOWN. Any comparison with a missing value (NULL) gives UNKNOWN, because nobody can say whether an unknown number is bigger, smaller or equal. Then AND, OR and NOT follow sensible rules: FALSE AND anything is FALSE, TRUE OR anything is TRUE, and most other mixes with UNKNOWN stay UNKNOWN. WHERE keeps only TRUE. Lesson 05 lays out the full rules in a table and shows how to test for a missing value properly.
:::

::: context btree-prefix Beginnings are together, endings are scattered
In a sorted list, every entry that begins the same way sits in one block. Entries that end the same way are spread everywhere.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44">
    <rect x="30" y="10" width="130" height="160" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
    <text x="40" y="28">Mini-1</text>
    <text x="40" y="46">Mini-2</text>
    <text x="40" y="64">Pathfinder-1</text>
    <text x="40" y="82">Pathfinder-2</text>
    <text x="40" y="100">Pathfinder-3</text>
    <text x="40" y="118">Relay-1</text>
    <text x="40" y="136">Relay-2</text>
    <text x="40" y="154">Relay-3</text>
  </g>
  <rect x="34" y="106" width="122" height="54" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="130" font-size="11" fill="#1d6fd1">'Relay%': one block</text>
  <g fill="none" stroke="#b4232c" stroke-width="2">
    <rect x="34" y="15" width="122" height="17"/>
    <rect x="34" y="51" width="122" height="17"/>
    <rect x="34" y="105" width="122" height="17"/>
  </g>
  <text x="180" y="44" font-size="11" fill="#b4232c">'%-1': three places,</text>
  <text x="180" y="60" font-size="11" fill="#b4232c">anywhere in the list</text>
</svg>
```

A dictionary works the same way: finding words that *start* with "sat" is one flip of the pages; finding words that *end* in "ite" means reading the whole book.
:::

::: context trigram Indexing the middle of words
A trigram index, offered in PostgreSQL by an extension called `pg_trgm`, chops every value into overlapping three-letter pieces. `relay` (it lowercases first) becomes pieces such as `rel`, `ela` and `lay`, plus a few with padding spaces at the ends. A search for `'%lay%'` then looks up the piece `lay` in the index and checks only the rows that contain it, instead of all of them. Full-text indexes do something similar with whole words. Both cost disk space and slow down inserts, so teams add them only where people really do search inside text, such as fault-log messages.
:::

::: context view-word A view is a saved question
A view is like a saved search in your email. The search itself is stored, not a copy of the emails, so every time you open it you see today's matches. In a telemetry system, views give names to questions people ask every day — "latest battery reading per satellite", "satellites currently in safe mode" — so that everyone asks them the same way. The exercise checker in this app reads your view named `answer` and compares its rows with the expected ones.
:::
