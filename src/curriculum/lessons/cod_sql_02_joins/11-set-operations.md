---
id: l11-set-operations
title: "Set operations: UNION, INTERSECT and EXCEPT"
minutes: 21
covers:
  - UNION, UNION ALL, INTERSECT and EXCEPT
---

Imagine two class lists for a school trip: one from the morning group, one from the afternoon group. You might want three different things from them. One long list of everybody, to order enough lunches. The names that appear on *both* lists, because those students signed up twice by mistake. And the names on the morning list but *not* the afternoon one, to know who leaves early.

Those are the three **[[set operations|set-venn]]**: stack two lists, keep what they share, and subtract one from the other. In SQL each one takes two complete query results and combines them into one. A join puts rows side by side, making them wider. A set operation puts results one *under* another, or compares them row against row, and the width stays the same.

Telemetry work reaches for these all the time. Recent readings often live in one table and older ones in an archive table, and a report needs both stacked together. A fleet engineer compares yesterday's list of reporting satellites with today's. And in lesson 09 you already used one of them, EXCEPT, to prove that a rewritten query returned the same rows as the original. This last lesson of the module teaches all four operators properly — UNION ALL, UNION, INTERSECT and EXCEPT — and the rules that decide which rows they line up.

## Two tables with the same shape

So far, every reading has lived in `reading`. Now suppose a nightly job moves readings older than a day into a second table, `reading_archive`, with exactly the same columns:

```sql
CREATE TABLE reading_archive (
    sat_id  TEXT NOT NULL,
    ts      TEXT NOT NULL,
    channel TEXT NOT NULL,
    value   REAL NOT NULL
);
```

```text
 sat_id  |          ts          | channel  | value
---------+----------------------+----------+-------
 SAT-001 | 2026-02-28T00:00:00Z | BUS_TEMP |    21
 SAT-001 | 2026-02-28T12:00:00Z | BUS_TEMP |    23
 SAT-002 | 2026-02-28T00:00:00Z | BUS_TEMP |    22
 SAT-001 | 2026-03-01T00:00:00Z | BUS_TEMP |    20
```

The first three rows are from 28 February, the day before the live table starts. Look closely at the last row. Aurora's reading of 20 °C at midnight on 1 March is *also* still in `reading`. The job copied it to the archive but never deleted it from the live table. Keep that row in mind; it is the bug this lesson is going to catch.

## UNION ALL: stack one result under another

**UNION ALL** takes the rows of the first query and puts the rows of the second query underneath. Nothing is removed and nothing is compared. Read it as "union all", and think of it as stacking two piles of paper:

```sql
SELECT sat_id, ts, value FROM reading
UNION ALL
SELECT sat_id, ts, value FROM reading_archive
ORDER BY sat_id, ts;
```

```text
 sat_id  |          ts          | value
---------+----------------------+-------
 SAT-001 | 2026-02-28T00:00:00Z |    21
 SAT-001 | 2026-02-28T12:00:00Z |    23
 SAT-001 | 2026-03-01T00:00:00Z |    20
 SAT-001 | 2026-03-01T00:00:00Z |    20
 SAT-001 | 2026-03-01T06:00:00Z |    24
 SAT-001 | 2026-03-02T01:00:00Z |    30
 SAT-002 | 2026-02-28T00:00:00Z |    22
 SAT-002 | 2026-03-01T00:00:00Z |    18
 SAT-002 | 2026-03-01T12:00:00Z |    22
 SAT-003 | 2026-03-02T00:00:00Z |    11
(10 rows)
```

Six rows from `reading` plus four from `reading_archive` make 10. The midnight reading appears twice, once from each table. UNION ALL does not hide it.

### How the columns are matched

A set operation does not look at column names. It lines the columns up **by position**: the first column of the second query goes under the first column of the first query, the second under the second, and so on. That gives three rules.

1. **Both queries must return the same number of columns.** PostgreSQL says `each UNION query must have the same number of columns`; SQLite says the SELECTs "do not have the same number of result columns".
2. **Columns in the same position must have compatible types.** PostgreSQL refuses to stack an integer column on a text column: `UNION types integer and text cannot be matched`. SQLite does not check, and will happily put a timestamp under a plane number.
3. **The result's column names come from the first query.** Aliases in the second query are ignored.

::: warning Columns in the wrong order still run
Since matching is by position, this runs without an error in both databases, because `sat_id` and `ts` are both text:

```sql
SELECT sat_id, ts FROM reading
UNION ALL
SELECT ts, sat_id FROM reading_archive;
```

The archive rows come out with a timestamp in the `sat_id` column and a satellite id in the `ts` column. Nothing warns you. Always write the column lists of every branch in the same order, and list them explicitly — never `SELECT *` on two tables that merely look alike.
:::

::: key How set operations line up columns
`query1 UNION ALL query2` (and UNION, INTERSECT, EXCEPT) need the same number of columns in each query. Columns are matched by position, not by name; types in the same position must be compatible (PostgreSQL checks, SQLite does not); the result takes the first query's column names.
:::

## UNION: stack, then remove duplicates

**UNION**, without ALL, stacks the two results and then throws away any row that is an exact copy of another. Two rows count as copies when every column matches.

```sql
SELECT sat_id, ts, value FROM reading
UNION
SELECT sat_id, ts, value FROM reading_archive
ORDER BY sat_id, ts;
```

This gives 9 rows: the same as before, but with the midnight reading once.

Removing duplicates is not free. To find the copies, the database has to bring equal rows together, either by [[sorting the whole result or by building a hash table|dedup-work]] of every row. `EXPLAIN` shows the extra step. Here is UNION ALL, which only reads one table after the other (an "Append"):

```text
            QUERY PLAN
-----------------------------------
 Append
   ->  Seq Scan on reading
   ->  Seq Scan on reading_archive
(3 rows)
```

And here is UNION, which does the same and then groups every row on all its columns (a "HashAggregate"):

```text
                       QUERY PLAN
--------------------------------------------------------
 HashAggregate
   Group Key: reading.sat_id, reading.ts, reading.value
   ->  Append
         ->  Seq Scan on reading
         ->  Seq Scan on reading_archive
(5 rows)
```

On ten rows that is nothing. On a month of telemetry — hundreds of millions of rows — the hash table or the sort can be the most expensive part of the query, and if it does not fit in memory it [[spills to disk|spill]]. UNION ALL can also start sending rows back at once, while UNION must see every row before it can be sure which are duplicates.

::: key UNION versus UNION ALL
UNION removes duplicates, which requires a sort or hash over the whole result; UNION ALL just concatenates. Use ALL unless you specifically need deduplication, which on large telemetry sets is a large cost.
:::

### The bug that UNION hides

There is a second reason to prefer UNION ALL, and it matters more than speed. UNION removes duplicates *silently*, and a duplicate is often a message about your data.

The midnight reading is in both tables because the [[archive job|archive-job]] is broken. With UNION ALL, a per-satellite count shows Aurora with 6 readings when it only sent 5, and someone asks why. With UNION, the count comes out right, the report looks healthy, and the broken job keeps copying without deleting, night after night, until the live table is twice the size it should be. UNION did not fix the bug. It hid it.

UNION can also do the opposite damage and throw away rows that are *not* copies at all. It compares only the columns you selected. Leave out the column that told two rows apart, and two different readings become one.

::: example Three ways to count the same readings
**Question.** Across both tables, how many bus-temperature readings does each satellite have, and what is its mean? The honest answer counts each real reading once: Aurora has 5 (21, 23, 20, 24, 30), Borealis 3 (22, 18, 22), Cirrus 1 (11).

**Try 1: UNION ALL on `sat_id, value`.**

```sql
SELECT sat_id, COUNT(*) AS n, ROUND(AVG(value)::numeric, 2) AS mean_temp
FROM (
    SELECT sat_id, value FROM reading
    UNION ALL
    SELECT sat_id, value FROM reading_archive
) AS all_temps
GROUP BY sat_id
ORDER BY sat_id;
```

```text
 sat_id  | n | mean_temp
---------+---+-----------
 SAT-001 | 6 |     23.00
 SAT-002 | 3 |     20.67
 SAT-003 | 1 |     11.00
(3 rows)
```

Aurora is counted 6 times, because the midnight 20 °C appears in both tables. Its mean is pulled down: $(21 + 23 + 20 + 20 + 24 + 30) / 6 = 138 / 6 = 23.00$ instead of $118 / 5 = 23.6$. Borealis is right.

**Try 2: UNION on `sat_id, value`.** Change only `UNION ALL` to `UNION`:

```text
 sat_id  | n | mean_temp
---------+---+-----------
 SAT-001 | 5 |     23.60
 SAT-002 | 2 |     20.00
 SAT-003 | 1 |     11.00
(3 rows)
```

Aurora is now right, but Borealis has lost a reading. It really did read 22 °C twice: once on 28 February and once at noon on 1 March. Without `ts` in the SELECT, those two rows are identical, so UNION kept one. The mean becomes $(22 + 18) / 2 = 20$ instead of $(22 + 18 + 22) / 3 \approx 20.67$.

**Try 3: find the real problem.** Stack with UNION ALL on the columns that identify a reading, and ask which ones appear more than once:

```sql
SELECT sat_id, ts, channel, COUNT(*) AS copies
FROM (
    SELECT sat_id, ts, channel FROM reading
    UNION ALL
    SELECT sat_id, ts, channel FROM reading_archive
) AS both_tables
GROUP BY sat_id, ts, channel
HAVING COUNT(*) > 1;
```

```text
 sat_id  |          ts          | channel  | copies
---------+----------------------+----------+--------
 SAT-001 | 2026-03-01T00:00:00Z | BUS_TEMP |      2
(1 row)
```

**Result.** One reading is in both tables. That is the bug to report and fix at its source. Once the archive job deletes what it copies, plain UNION ALL gives Aurora 5, Borealis 3, Cirrus 1 — the honest answer.

**Sanity check.** 10 stacked rows minus 1 extra copy is 9 real readings, and $5 + 3 + 1 = 9$.
:::

::: warning UNION is not a way to clean data
If you reach for UNION "to get rid of duplicates", stop and ask where the duplicates came from. Either they are real separate events that only look alike because you dropped a column, and UNION is deleting data; or they are a real copying bug, and UNION is hiding it. In both cases UNION ALL, plus a duplicate check on the columns that identify a row, tells you the truth.
:::

## INTERSECT: rows that are in both

**INTERSECT** keeps only the rows that appear in the first result *and* in the second. It is the trip-list question "who signed up twice?". Run it on the two tables and it finds the leftover copy directly:

```sql
SELECT sat_id, ts, value FROM reading
INTERSECT
SELECT sat_id, ts, value FROM reading_archive;
```

```text
 sat_id  |          ts          | value
---------+----------------------+-------
 SAT-001 | 2026-03-01T00:00:00Z |    20
(1 row)
```

A daily check that this query returns zero rows would have caught the archive job the first night it failed.

INTERSECT is useful on single columns too. Which satellites reported both on 1 March and on 2 March?

```sql
SELECT sat_id FROM reading WHERE ts <  '2026-03-02T00:00:00Z'
INTERSECT
SELECT sat_id FROM reading WHERE ts >= '2026-03-02T00:00:00Z';
```

```text
 sat_id
---------
 SAT-001
(1 row)
```

On 1 March, Aurora and Borealis reported. On 2 March, Aurora and Cirrus. Only Aurora is in both lists. Aurora sent two readings on 1 March, but it appears once in the answer: INTERSECT, like UNION, returns **distinct** rows — each different row once.

You could ask the same question with EXISTS (lesson 08): satellites from the first day for which a reading exists on the second. The EXISTS form can return any columns you like from the outer table; INTERSECT can only return the columns the two queries share. INTERSECT is shortest when the question really is "which rows are in both lists".

## EXCEPT: rows in the first but not in the second

**EXCEPT** keeps the rows of the first result that do not appear anywhere in the second. It is subtraction, so order matters: `A EXCEPT B` and `B EXCEPT A` are different questions.

Here is the "which satellites went silent" question from this module's exercises, as a subtraction: every satellite, minus the satellites that reported at or after midnight on 2 March.

```sql
SELECT sat_id FROM satellite
EXCEPT
SELECT sat_id FROM reading WHERE ts >= '2026-03-02T00:00:00Z'
ORDER BY sat_id;
```

```text
 sat_id
---------
 SAT-002
 SAT-004
(2 rows)
```

Satellites: 001, 002, 003, 004. Reporting since 2 March: 001 and 003. Take those away and 002 and 004 are left — Borealis, which stopped, and Dorado, which never started. Flip the two queries around and the result is empty, because every satellite that sent a reading is in the fleet table.

EXCEPT is an anti-join (lesson 08) for whole rows. Like NOT EXISTS, and unlike NOT IN, it copes with NULLs (see below). Its limit is that it only returns the compared columns. To show names too, either join the result back to `satellite`, or write the anti-join with NOT EXISTS, which can return any columns of the outer table directly. That is why the exercise asks for NOT EXISTS.

::: example Silent satellites with their names
**Question.** List the id and name of each satellite with no reading at or after 2026-03-02T00:00:00Z, using EXCEPT for the subtraction.

**Plan.** Put the EXCEPT in a CTE (lesson 09), so it has a name, then join it back to `satellite` to fetch the names.

```sql
WITH silent AS (
    SELECT sat_id FROM satellite
    EXCEPT
    SELECT sat_id FROM reading WHERE ts >= '2026-03-02T00:00:00Z'
)
SELECT s.sat_id, s.name
FROM silent AS q
JOIN satellite AS s ON s.sat_id = q.sat_id
ORDER BY s.sat_id;
```

```text
 sat_id  |   name
---------+----------
 SAT-002 | Borealis
 SAT-004 | Dorado
(2 rows)
```

**Check.** The same two satellites as the NOT EXISTS answer in lesson 08. Joining back on the primary key cannot multiply rows, because each `sat_id` matches exactly one satellite. Two ids in, two named rows out.
:::

You met the other big use of EXCEPT in lesson 09: `A EXCEPT B` empty *and* `B EXCEPT A` empty means the two queries return the same distinct rows. Now you know why that check needed row counts as well: EXCEPT, like UNION, works on distinct rows.

::: key INTERSECT and EXCEPT
`A INTERSECT B` returns the distinct rows found in both A and B. `A EXCEPT B` returns the distinct rows of A that are not in B; `B EXCEPT A` is a different question. Both compare whole rows, all columns, matched by position.
:::

## NULLs: two blanks count as the same

A join condition `a.note = b.note` is never true when both notes are NULL, because `NULL = NULL` is UNKNOWN (lesson 05 of the last module). Set operations follow a different rule. When they compare rows, two NULLs in the same position count as **the same**, the way DISTINCT treats them:

```sql
SELECT 'SAT-009' AS sat_id, NULL::text AS note
INTERSECT
SELECT 'SAT-009', NULL::text;
```

```text
 sat_id  | note
---------+------
 SAT-009 |
(1 row)
```

The row is found in both, NULL and all. The same two rows joined on `a.note = b.note` give 0 rows. This is why EXCEPT is a NULL-safe way to subtract lists, unlike NOT IN: it never asks "is this equal to NULL?", it only asks "is this exact row there?". PostgreSQL has an operator with the same meaning for single values, [[IS NOT DISTINCT FROM|not-distinct]].

## Keeping duplicates: INTERSECT ALL and EXCEPT ALL

UNION has an ALL version that keeps copies. So do the other two, in PostgreSQL. They treat each result as a pile where the same row can appear several times, and they [[count copies|bag-counting]]:

- `A INTERSECT ALL B`: a row that appears $m$ times in A and $n$ times in B appears $\min(m, n)$ times (the smaller of the two).
- `A EXCEPT ALL B`: it appears $m - n$ times, or not at all if $n \ge m$.

For example, `reading` has SAT-001 three times, SAT-002 twice and SAT-003 once; `reading_archive` has SAT-001 three times and SAT-002 once. So:

```sql
SELECT sat_id FROM reading
EXCEPT ALL
SELECT sat_id FROM reading_archive
ORDER BY sat_id;
```

```text
 sat_id
---------
 SAT-002
 SAT-003
(2 rows)
```

SAT-001: $3 - 3 = 0$ copies. SAT-002: $2 - 1 = 1$. SAT-003: $1 - 0 = 1$. In lesson 09's proof, running `EXCEPT ALL` in both directions checks the counts too, in one step. SQLite does not have `INTERSECT ALL` or `EXCEPT ALL` (it reports a syntax error near `ALL`), so there you compare row counts separately, as lesson 09 did.

## Several operators, and ORDER BY on the whole result

You can chain set operations: `A UNION ALL B UNION ALL C` stacks three results. Mixing *different* operators raises the question of which runs first, and here the two databases disagree.

- In PostgreSQL (and standard SQL), **INTERSECT binds tighter** than UNION and EXCEPT, the way multiplication goes before addition. `A UNION B INTERSECT C` means `A UNION (B INTERSECT C)`.
- In SQLite, all set operators have **equal rank and run left to right**. The same text means `(A UNION B) INTERSECT C`.

Try `SELECT 1 AS k UNION SELECT 2 INTERSECT SELECT 3`. PostgreSQL works out `2 INTERSECT 3` first (nothing), then `1 UNION` nothing, and returns 1. SQLite works out `1 UNION 2` first, giving {1, 2}, then intersects with {3}, and returns no rows. The same query, two answers.

The cure is to never leave it to the rules. PostgreSQL accepts brackets around the parts. SQLite does not allow a bracketed SELECT inside a compound query, but both accept each part as a named step in a CTE, or as a subquery in FROM. A CTE per part is also the most readable.

**ORDER BY and LIMIT belong to the whole result.** Write them once, at the very end, after the last query. They sort and cut the combined rows:

```sql
SELECT sat_id, value FROM reading
UNION ALL
SELECT sat_id, value FROM reading_archive
ORDER BY value DESC
LIMIT 3;
```

```text
 sat_id  | value
---------+-------
 SAT-001 |    30
 SAT-001 |    24
 SAT-001 |    23
(3 rows)
```

The top three are drawn from both tables together: 30 and 24 from the live table, 23 from the archive. An ORDER BY in the middle, after the first query, is a syntax error (PostgreSQL: `syntax error at or near "UNION"`; SQLite: `ORDER BY clause should come after UNION ALL not before`).

The final ORDER BY may use the result's column names — which come from the first query — or positions such as `ORDER BY 2`. In PostgreSQL it may not use an expression: `ORDER BY value * 2` fails with `invalid UNION/INTERSECT/EXCEPT ORDER BY clause`. SQLite also refuses it. If you need to sort by a calculation, add it as a column in every branch, or wrap the whole set operation in a CTE and sort the outer SELECT.

::: warning Mixed operators without brackets
`A UNION B INTERSECT C` gives different rows in PostgreSQL and SQLite. Whenever a query mixes UNION, INTERSECT and EXCEPT, put each part in its own CTE (or brackets in PostgreSQL) so the order is written down, not remembered.
:::

## Check yourself

::: check
How many rows does `SELECT sat_id FROM reading UNION ALL SELECT sat_id FROM reading_archive` return? How many with `UNION` instead, and which are they?
:::

::: answer
UNION ALL stacks every row: 6 from `reading` plus 4 from `reading_archive`, 10 rows.

UNION keeps each different row once. The only values are SAT-001, SAT-002 and SAT-003, so it returns 3 rows. (SAT-004 never appears in either table.)
:::

::: check
A teammate stacks the live and archive tables with `SELECT sat_id, ts FROM reading UNION ALL SELECT ts, sat_id FROM reading_archive`. PostgreSQL runs it without complaint. What is wrong with the result, and why was there no error?
:::

::: answer
The second query lists its columns in the opposite order, so the archive rows land with timestamps in the `sat_id` column and satellite ids in the `ts` column. Set operations match columns by position, not by name. There is no error because both columns are text, so the types in each position are compatible. The fix is to list the columns in the same order in both queries.
:::

::: check
Write a set operation that lists the satellites that reported on 2 March but not on 1 March. What does it return?
:::

::: answer
Subtract the first day's list from the second day's:

```sql
SELECT sat_id FROM reading WHERE ts >= '2026-03-02T00:00:00Z'
EXCEPT
SELECT sat_id FROM reading WHERE ts <  '2026-03-02T00:00:00Z';
```

On 2 March: SAT-001 and SAT-003. On 1 March: SAT-001 and SAT-002. Taking the second list away from the first leaves SAT-003 (Cirrus). Swapping the two queries would ask the opposite question and return SAT-002.
:::

::: check
What does `SELECT 1 AS k UNION SELECT 2 INTERSECT SELECT 2` return in PostgreSQL, and in SQLite?
:::

::: answer
In PostgreSQL, INTERSECT goes first: `2 INTERSECT 2` is {2}, then `1 UNION {2}` is {1, 2}. Two rows, 1 and 2.

In SQLite, the operators run left to right: `1 UNION 2` is {1, 2}, then intersecting with {2} leaves {2}. One row, 2.
:::

::: check
In PostgreSQL, what does `SELECT sat_id FROM reading EXCEPT ALL SELECT sat_id FROM reading_archive` return? And plain `EXCEPT`?
:::

::: answer
Count copies. `reading` has SAT-001 ×3, SAT-002 ×2, SAT-003 ×1. `reading_archive` has SAT-001 ×3, SAT-002 ×1. EXCEPT ALL subtracts counts: SAT-001 $3 - 3 = 0$, SAT-002 $2 - 1 = 1$, SAT-003 $1 - 0 = 1$. So two rows: SAT-002 and SAT-003.

Plain EXCEPT asks only whether each distinct value is in the second result at all. SAT-001 and SAT-002 both are, so only SAT-003 is left: one row.
:::

## Summary

| Operator | Returns | Duplicates |
| --- | --- | --- |
| `A UNION ALL B` | every row of A, then every row of B | kept; no extra work |
| `A UNION B` | rows in A or B | removed; costs a sort or hash of everything |
| `A INTERSECT B` | rows in both A and B | removed (`INTERSECT ALL`: $\min(m, n)$ copies, PostgreSQL only) |
| `A EXCEPT B` | rows of A not in B; order matters | removed (`EXCEPT ALL`: $m - n$ copies, PostgreSQL only) |
| column matching | by position; same count; compatible types; names from A | — |
| NULLs | two NULLs count as the same row value | — |
| precedence | PostgreSQL: INTERSECT first; SQLite: left to right | use CTEs or brackets |
| ORDER BY, LIMIT | once, at the end, on the whole result; names or positions only | — |

That completes this module. You can now join tables and reason about how many rows come out, aggregate and subtotal them, nest and name queries, walk trees and fill gaps, and combine whole results. Many of the hardest telemetry questions still need one more tool: comparing each reading with the one before it, a running total, the top three readings per satellite. The next module, on [[window functions|window-bridge]], does those without collapsing rows into groups and without joining a table to itself.

::: context set-venn The three questions as pictures
Each circle is the set of distinct rows one query returns. The shaded part is what each operator keeps. UNION ALL has no picture here, because it is not a set operation in the strict sense: it keeps copies, and a circle cannot show a row twice.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <circle cx="48" cy="58" r="30" fill="#1d6fd1"/>
    <circle cx="80" cy="58" r="30" fill="#1d6fd1"/>
    <path d="M164,32.62 A30,30 0 0 1 164,83.38 A30,30 0 0 1 164,32.62 Z" fill="#1d6fd1"/>
    <circle cx="148" cy="58" r="30" fill="none"/>
    <circle cx="180" cy="58" r="30" fill="none"/>
    <circle cx="264" cy="58" r="30" fill="#1d6fd1"/>
    <circle cx="296" cy="58" r="30" fill="#ffffff"/>
    <circle cx="264" cy="58" r="30" fill="none"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="64" y="112">A UNION B</text>
    <text x="164" y="112">A INTERSECT B</text>
    <text x="280" y="112">A EXCEPT B</text>
    <text x="40" y="20">A</text><text x="88" y="20">B</text>
    <text x="140" y="20">A</text><text x="188" y="20">B</text>
    <text x="256" y="20">A</text><text x="304" y="20">B</text>
  </g>
</svg>
```
:::

::: context dedup-work How a database finds duplicates
There are two ways, and the planner picks one. **Sort**: put all the rows in order, so identical rows end up next to each other, then walk down the list and drop each row that matches the one before it. **Hash**: run each row through a function that turns it into a bucket number, keep one row per distinct value in a table in memory, and skip any row already there. Either way the database must look at every row before it can return the full answer, and must hold a lot of them at once.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="16">UNION ALL</text>
    <text x="250" y="16">UNION</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="26" width="80" height="18" fill="#8fb8f0"/>
    <rect x="20" y="46" width="80" height="18" fill="#8fb8f0"/>
    <rect x="20" y="66" width="80" height="18" fill="#8fb8f0"/>
    <rect x="20" y="92" width="80" height="18" fill="#f2b880"/>
    <rect x="20" y="112" width="80" height="18" fill="#f2b880"/>
    <rect x="210" y="26" width="80" height="18" fill="#8fb8f0"/>
    <rect x="210" y="46" width="80" height="18" fill="#8fb8f0"/>
    <rect x="210" y="66" width="80" height="18" fill="#8fb8f0"/>
    <rect x="210" y="92" width="80" height="18" fill="#f2b880"/>
    <rect x="210" y="112" width="80" height="18" fill="#ffffff" stroke-dasharray="4 3"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="39">a</text><text x="60" y="59">b</text><text x="60" y="79">c</text>
    <text x="60" y="105">d</text><text x="60" y="125">b</text>
    <text x="250" y="39">a</text><text x="250" y="59">b</text><text x="250" y="79">c</text>
    <text x="250" y="105">d</text><text x="250" y="125">b</text>
  </g>
  <line x1="222" y1="121" x2="278" y2="121" stroke="#b4232c" stroke-width="2"/>
  <g font-size="11" fill="#6c7a93" text-anchor="start">
    <text x="110" y="59">first query</text>
    <text x="110" y="115">second query</text>
    <text x="298" y="59">5 in</text>
    <text x="298" y="125">copy of b</text>
    <text x="298" y="141">dropped</text>
  </g>
</svg>
```
:::

::: context spill What spilling to disk means
PostgreSQL gives each sort or hash step a budget of memory, set by `work_mem` (4 MB by default). If the rows it must hold are bigger than that, it writes the overflow to temporary files on disk and reads them back later. Disk is far slower than memory, so a UNION over a month of readings can run many times slower than the same UNION ALL. `EXPLAIN ANALYZE` reports it: a sort that says "external merge  Disk: …" instead of "quicksort  Memory: …" has spilled.
:::

::: context archive-job Why telemetry gets split into live and archive
A table that grows by millions of rows a day gets slower to search, back up and maintain. So teams keep the recent days — the ones dashboards and on-call engineers query constantly — in a small, fast "hot" table, and move older rows to an archive on cheaper storage. The move is a two-step job: copy the old rows, then delete them from the live table. If the job crashes between the two steps, or the delete uses a slightly different cut-off time than the copy, rows end up in both places. A well-written job does both steps inside one transaction, so either both happen or neither does.
:::

::: context not-distinct A NULL-safe equals sign
`a IS NOT DISTINCT FROM b` is true when `a` and `b` are equal, *or* when both are NULL; it is never UNKNOWN. Its opposite, `a IS DISTINCT FROM b`, is true when they differ, counting "one is NULL and the other is not" as different. These are the comparisons that DISTINCT, GROUP BY and the set operations use behind the scenes. SQLite writes the same idea as `a IS b` and `a IS NOT b`.
:::

::: context bag-counting Sets and bags
In mathematics a **set** holds each thing at most once, and the set operations there — union, intersection, difference — are where these SQL names come from. A SQL result is really a **bag** (also called a multiset): the same row can be in it several times. The plain operators turn bags back into sets by removing copies. The ALL versions work on bags, counting copies.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="16">reading</text>
    <text x="170" y="16">archive</text>
    <text x="290" y="16">EXCEPT ALL</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="24" y="44">001</text><text x="24" y="80">002</text><text x="24" y="116">003</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="30" y="32" width="18" height="18" fill="#8fb8f0"/>
    <rect x="52" y="32" width="18" height="18" fill="#8fb8f0"/>
    <rect x="74" y="32" width="18" height="18" fill="#8fb8f0"/>
    <rect x="30" y="68" width="18" height="18" fill="#8fb8f0"/>
    <rect x="52" y="68" width="18" height="18" fill="#8fb8f0"/>
    <rect x="30" y="104" width="18" height="18" fill="#8fb8f0"/>
    <rect x="140" y="32" width="18" height="18" fill="#f2b880"/>
    <rect x="162" y="32" width="18" height="18" fill="#f2b880"/>
    <rect x="184" y="32" width="18" height="18" fill="#f2b880"/>
    <rect x="140" y="68" width="18" height="18" fill="#f2b880"/>
    <rect x="270" y="68" width="18" height="18" fill="#1d6fd1"/>
    <rect x="270" y="104" width="18" height="18" fill="#1d6fd1"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="start">
    <text x="300" y="44">3 − 3 = 0</text>
    <text x="300" y="80">2 − 1 = 1</text>
    <text x="300" y="116">1 − 0 = 1</text>
  </g>
</svg>
```
:::

::: context window-bridge What comes next
A **window function** computes a value for each row from a group of related rows — its "window" — while keeping every row in the result. `LAG(value) OVER (PARTITION BY sat_id ORDER BY ts)` gives each reading the previous reading of the same satellite, which replaces the self-join from lesson 01. `SUM(value) OVER (…)` gives a running total, and `ROW_NUMBER()` numbers rows so you can keep the top three per satellite. Everything in this module carries straight over: the window functions usually sit in a CTE step, on top of a join, feeding an aggregate or a gap-filled series.
:::
