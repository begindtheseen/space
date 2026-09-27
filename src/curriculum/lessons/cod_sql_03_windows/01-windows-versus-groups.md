---
id: l01-windows-versus-groups
title: "Windows: aggregates that keep every row"
minutes: 22
covers:
  - OVER (PARTITION BY ... ORDER BY ...) and how a window differs from a group
---

Three questions come up every single day on a satellite operations team. How does this reading compare with that satellite's usual level? How much did it change since the sample before? Which are the three worst readings on each satellite? The last module gave you GROUP BY, which answers "what is each satellite's average?" beautifully. But GROUP BY answers by squashing each satellite's rows into one line. The moment you want the reading *and* the average on the same line, GROUP BY is in the way.

This module is about the tool built for exactly that: the **window function**. A window function looks at a set of rows — "all the readings from this satellite", or "every reading up to this one" — works something out from them, and writes the answer onto each row, without removing any rows. You keep the detail and get the summary beside it.

This first lesson teaches the one piece of syntax every window function shares, the `OVER (...)` clause, and the difference between a window and a group. It also shows you where windows sit in the order a query runs in, which explains the one rule people trip over most: you cannot filter on a window function in WHERE. The next two lessons use the same clause for ranking rows and for looking at the previous and next row.

## The running example: battery charge

Every lesson in this module uses one small table of battery telemetry, shaped like the one in this module's first exercise. Each row is one sample of a satellite's **[[state of charge|state-of-charge]]** — how full its battery is, as a fraction from 0 (empty) to 1 (full). The samples are ten minutes apart, with one exception you will meet in lesson 03.

```sql
CREATE TABLE soc (
    sat_id TEXT         NOT NULL,
    ts     TIMESTAMPTZ  NOT NULL,   -- when the sample was taken, in UTC
    value  NUMERIC(4,2) NOT NULL    -- state of charge, 0 to 1
);

INSERT INTO soc VALUES
  ('SAT-001','2026-03-01T00:00:00Z',0.90),
  ('SAT-001','2026-03-01T00:10:00Z',0.85),
  ('SAT-001','2026-03-01T00:20:00Z',0.70),
  ('SAT-001','2026-03-01T00:30:00Z',0.75),
  ('SAT-002','2026-03-01T00:00:00Z',0.50),
  ('SAT-002','2026-03-01T00:10:00Z',0.55),
  ('SAT-002','2026-03-01T00:20:00Z',0.60),
  ('SAT-002','2026-03-01T00:50:00Z',0.63),
  ('SAT-003','2026-03-01T00:00:00Z',0.81),
  ('SAT-003','2026-03-01T00:10:00Z',0.78),
  ('SAT-003','2026-03-01T00:20:00Z',0.78),
  ('SAT-003','2026-03-01T00:30:00Z',0.75);
```

Twelve rows: three satellites, four samples each. This is the PostgreSQL version, with the time type and the exact-decimal type you met in the first SQL module. The exercises run on SQLite, where the same table is written with `ts TEXT` holding ISO-8601 strings like `'2026-03-01T00:10:00Z'` and `value REAL`. Every window query in this lesson runs unchanged on both. The only visible difference is that SQLite's `REAL` numbers can print with **[[floating-point crumbs|numeric-vs-real]]** in the last digits.

## What GROUP BY does to your rows

Here is the per-satellite average, the way you learned it last module:

```sql
SELECT sat_id, COUNT(*) AS n, ROUND(AVG(value), 3) AS avg_soc
FROM soc
GROUP BY sat_id
ORDER BY sat_id;
```

```text
 sat_id  | n | avg_soc
---------+---+---------
 SAT-001 | 4 |   0.800
 SAT-002 | 4 |   0.570
 SAT-003 | 4 |   0.780
```

Twelve rows went in; three came out. Each pile of four readings became one line. That is what GROUP BY is for. It also means the individual readings are gone. Ask for them alongside the average and PostgreSQL refuses, for the reason you learned last module — a pile of four readings has no single `ts` to show:

```sql
SELECT sat_id, ts, value, AVG(value)
FROM soc
GROUP BY sat_id;
```

```text
ERROR:  column "soc.ts" must appear in the GROUP BY clause or be used in an aggregate function
```

You already know one way round this. Compute the averages in a subquery, then join them back onto every row:

```sql
SELECT s.sat_id, s.ts, s.value, g.sat_avg
FROM soc AS s
JOIN (SELECT sat_id, ROUND(AVG(value), 3) AS sat_avg
      FROM soc
      GROUP BY sat_id) AS g
  ON g.sat_id = s.sat_id;
```

It works, but it reads the table twice and says in a roundabout way something very simple: "put the satellite's average on each row". Window functions say it directly.

## OVER: an aggregate that keeps every row

Picture a class photo. Each student stands in a row with their class. Now picture writing, on each student's name tag, the average height of *their own class*. Nobody leaves the photo. Every student still stands where they stood. Each one just gets an extra number, worked out from the people around them.

That is a window function. Here it is in SQL:

```sql
SELECT sat_id, ts, value,
       ROUND(AVG(value) OVER (PARTITION BY sat_id), 3) AS sat_avg
FROM soc
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value | sat_avg
---------+------------------------+-------+---------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |   0.800
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 |   0.800
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 |   0.800
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |   0.800
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50 |   0.570
 SAT-002 | 2026-03-01 00:10:00+00 |  0.55 |   0.570
 SAT-002 | 2026-03-01 00:20:00+00 |  0.60 |   0.570
 SAT-002 | 2026-03-01 00:50:00+00 |  0.63 |   0.570
 SAT-003 | 2026-03-01 00:00:00+00 |  0.81 |   0.780
 SAT-003 | 2026-03-01 00:10:00+00 |  0.78 |   0.780
 SAT-003 | 2026-03-01 00:20:00+00 |  0.78 |   0.780
 SAT-003 | 2026-03-01 00:30:00+00 |  0.75 |   0.780
```

All twelve rows are still there. Each one carries its own satellite's average, the same numbers GROUP BY gave: 0.800, 0.570 and 0.780. Compare the two shapes [[side by side|group-vs-window]].

Read `AVG(value) OVER (PARTITION BY sat_id)` aloud as "the average of value, over the rows partitioned by sat id". The pieces:

- `AVG(value)` is the ordinary aggregate you know.
- **OVER** is the word that turns it into a window function. Read it as "computed over". Without `OVER`, `AVG` is a normal aggregate and needs GROUP BY. With `OVER`, it keeps every row.
- The brackets after `OVER` describe the **window** — the set of rows the function looks at for each row. The word comes from the picture of each row looking out through a **[[window|word-window]]** at some of the other rows.
- **PARTITION BY sat_id** splits the rows into **partitions**: separate sets, one per satellite, the way GROUP BY makes piles. A row's window only ever contains rows from its own partition.
- The row being worked on is called the **current row**. For each current row, the function looks at [[its window|current-row]] and writes one answer onto that row.

::: key Window function versus GROUP BY
GROUP BY collapses rows into one per group; a window function computes across a set of rows while keeping every row. That is why you can show a sample and its running average side by side.
:::

PARTITION BY takes the same kinds of things GROUP BY does: one column, several columns (`PARTITION BY sat_id, channel`), or an expression. The **[[word "partition"|partition-word]]** means the same as "pile" here.

### Several windows in one query

A query can hold as many window functions as you like, each with its own OVER clause. Here is each reading's distance from its satellite's average, and the satellite's lowest reading, on every row:

```sql
SELECT sat_id, ts, value,
       ROUND(value - AVG(value) OVER (PARTITION BY sat_id), 3) AS vs_avg,
       MIN(value) OVER (PARTITION BY sat_id) AS sat_min
FROM soc
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value | vs_avg | sat_min
---------+------------------------+-------+--------+---------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |  0.100 |    0.70
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 |  0.050 |    0.70
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 | -0.100 |    0.70
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 | -0.050 |    0.70
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50 | -0.070 |    0.50
 SAT-002 | 2026-03-01 00:10:00+00 |  0.55 | -0.020 |    0.50
 SAT-002 | 2026-03-01 00:20:00+00 |  0.60 |  0.030 |    0.50
 SAT-002 | 2026-03-01 00:50:00+00 |  0.63 |  0.060 |    0.50
 SAT-003 | 2026-03-01 00:00:00+00 |  0.81 |  0.030 |    0.75
 SAT-003 | 2026-03-01 00:10:00+00 |  0.78 |  0.000 |    0.75
 SAT-003 | 2026-03-01 00:20:00+00 |  0.78 |  0.000 |    0.75
 SAT-003 | 2026-03-01 00:30:00+00 |  0.75 | -0.030 |    0.75
```

A window function's answer is an ordinary value on the row, so you can do arithmetic with it: `value - AVG(value) OVER (...)`. Sanity check on the first row: $0.90 - 0.80 = 0.10$. And within each satellite the `vs_avg` column adds up to zero — $0.10 + 0.05 - 0.10 - 0.05 = 0$ — as distances from an average always do.

## OVER (): the whole result is one window

Leave the brackets empty and there is no partition: every row's window is every row. That gives a fleet-wide figure on every line.

```sql
SELECT sat_id, ts, value,
       COUNT(*) OVER () AS n_all,
       ROUND(AVG(value) OVER (), 3) AS fleet_avg
FROM soc
ORDER BY sat_id, ts
LIMIT 4;
```

```text
 sat_id  |           ts           | value | n_all | fleet_avg
---------+------------------------+-------+-------+-----------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |    12 |     0.717
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 |    12 |     0.717
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 |    12 |     0.717
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |    12 |     0.717
```

Check: the twelve values add to $8.60$, and $8.60 / 12 = 0.7167$, which rounds to 0.717. Notice also that `n_all` is 12 even though LIMIT kept only four rows. The window was computed first, on the whole table; LIMIT trimmed the output afterwards. You will see why when we place windows in the query's order below.

## ORDER BY inside OVER: "so far"

The window clause can also hold an ORDER BY. Adding one changes the question from "the whole partition" to "the partition *so far*":

```sql
SELECT sat_id, ts, value,
       ROUND(AVG(value) OVER (PARTITION BY sat_id ORDER BY ts), 3) AS avg_so_far,
       COUNT(*) OVER (PARTITION BY sat_id ORDER BY ts) AS n_so_far
FROM soc
WHERE sat_id = 'SAT-001'
ORDER BY ts;
```

```text
 sat_id  |           ts           | value | avg_so_far | n_so_far
---------+------------------------+-------+------------+----------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |      0.900 |        1
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 |      0.875 |        2
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 |      0.817 |        3
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |      0.800 |        4
```

Read the rows one at a time. At 00:00 the window holds one reading, so the average is 0.90. At 00:10 it holds two: $(0.90 + 0.85)/2 = 0.875$. At 00:20, three: $(0.90 + 0.85 + 0.70)/3 = 2.45/3 = 0.8167$. At 00:30, all four: $3.20/4 = 0.800$ — the same as the whole-partition average, as it must be on the last row.

So with an ORDER BY inside OVER, an aggregate becomes a **[[running aggregate|running-rule]]**: each row sees the rows from the start of its partition up to and including itself. That is how you get a running total or a running average. The exact rule for which rows are "so far" is called the **frame**. Lesson 04 builds running totals and moving averages on it, and lesson 05 takes the frame apart piece by piece.

The ORDER BY inside OVER matters even more for the functions in the next two lessons. "Rank these rows" and "give me the previous row" only mean something once you say what order the rows are in.

::: warning Two different ORDER BYs
The ORDER BY inside `OVER (...)` says how rows are ordered *for that window function*. The ORDER BY at the end of the query says how the *output* is sorted. They are independent. You can compute a running average in time order and then print the rows sorted by value, or not sorted at all. If you want the output in time order, you still need the final ORDER BY — the one inside OVER does not do it for you.
:::

::: key The window clause
`function(...) OVER (PARTITION BY p ORDER BY o)`. PARTITION BY splits rows into independent sets (leave it out and the whole result is one set). ORDER BY orders rows within each set; for an aggregate it turns "the whole set" into "the set so far". `OVER ()` means one window of all rows.
:::

## Where windows sit in the logical order

In the first SQL module you learned that a query runs, logically, as an assembly line: FROM, then WHERE, then GROUP BY, then HAVING, then SELECT, then DISTINCT, then ORDER BY, then LIMIT. Window functions have a precise place on that line:

1. **FROM** and joins — fetch the rows.
2. **WHERE** — drop rows that fail the condition.
3. **GROUP BY** — make piles.
4. **HAVING** — drop whole piles.
5. **Window functions** — computed now, over the rows that are left.
6. **SELECT** — finish the output columns, using the window results.
7. **DISTINCT** — remove duplicate output rows.
8. **ORDER BY** — sort.
9. **LIMIT** — keep a slice.

Windows are evaluated as part of the SELECT stage, after WHERE, GROUP BY and HAVING have finished, and before ORDER BY and LIMIT. [[Picture the line|logical-order-picture]] and the consequences fall out one by one.

::: key Where window functions run
Window functions are computed after WHERE, GROUP BY and HAVING, in the SELECT stage, and before DISTINCT, ORDER BY and LIMIT. So they see only the rows that survived filtering and grouping, and they may appear only in SELECT and ORDER BY.
:::

### Not in WHERE

Suppose you want only the readings that are below their own satellite's average. The natural first try:

```sql
SELECT sat_id, ts, value
FROM soc
WHERE value < AVG(value) OVER (PARTITION BY sat_id);
```

```text
ERROR:  window functions are not allowed in WHERE
```

SQLite says it differently — `misuse of window function AVG()` — but means the same. WHERE is station 2; the window is not computed until station 5. WHERE is being asked to test a number that does not exist yet. The same goes for GROUP BY and HAVING, which also run before the window: PostgreSQL answers `window functions are not allowed in GROUP BY` if you try.

The fix is the one you already know from the CTE lesson: compute the window in one step, then filter in the next.

::: key Window functions cannot go in WHERE
No: windows are evaluated after WHERE, in the SELECT stage. Compute it in a subquery or a CTE and filter on the result in the outer query, which is exactly the shape of the deduplication pattern.
:::

::: example Readings below their own satellite's average
**Step 1.** A CTE named `w` computes the average on every row. Nothing is filtered yet, so each partition still has all four rows.

**Step 2.** The outer query treats `w` as a table. `sat_avg` is now an ordinary column, so WHERE can test it.

```sql
WITH w AS (
    SELECT sat_id, ts, value,
           AVG(value) OVER (PARTITION BY sat_id) AS sat_avg
    FROM soc
)
SELECT sat_id, ts, value, ROUND(sat_avg, 3) AS sat_avg
FROM w
WHERE value < sat_avg
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value | sat_avg
---------+------------------------+-------+---------
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 |   0.800
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |   0.800
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50 |   0.570
 SAT-002 | 2026-03-01 00:10:00+00 |  0.55 |   0.570
 SAT-003 | 2026-03-01 00:30:00+00 |  0.75 |   0.780
```

**Sanity check.** SAT-001's readings are 0.90, 0.85, 0.70 and 0.75 against an average of 0.80: two above, two below, and the two below are listed. SAT-003's 0.78s equal the average exactly, so `<` correctly leaves them out. Five rows in all.

**Why the order of steps matters.** Filtering happened *after* the averages were fixed. Had we filtered first, each average would have been computed from fewer rows, and would have been a different number.
:::

This "window in a CTE, filter outside" shape is the most common one in the whole module. Lesson 06 uses it to keep only the latest reading per satellite, and lesson 07 uses it to find runs of bad readings.

### Windows see only the rows that survived WHERE

Because WHERE runs first, it changes what is inside every window. Keep only the samples before 00:20 and each satellite's partition shrinks to two rows:

```sql
SELECT sat_id, ts, value,
       ROUND(AVG(value) OVER (PARTITION BY sat_id), 3) AS sat_avg
FROM soc
WHERE ts < '2026-03-01T00:20:00Z'
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value | sat_avg
---------+------------------------+-------+---------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |   0.875
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 |   0.875
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50 |   0.525
 SAT-002 | 2026-03-01 00:10:00+00 |  0.55 |   0.525
 SAT-003 | 2026-03-01 00:00:00+00 |  0.81 |   0.795
 SAT-003 | 2026-03-01 00:10:00+00 |  0.78 |   0.795
```

SAT-001's average is now $(0.90 + 0.85)/2 = 0.875$, not 0.800. This is usually what you want: "the average over the time range I asked about". But it is a real trap when you want a *baseline* from the whole table and a filtered list of rows. Then the window must be computed in a CTE before the filter, exactly as in the example above.

::: warning The filter moved the baseline
If a report says "readings more than 0.1 below the satellite's average" and the query puts the time filter in the same SELECT as the window, the average is taken over the filtered time range only. Change the date range and the baseline moves with it. Decide which you mean, and if you mean a fixed baseline, compute it in its own step.
:::

### After GROUP BY, windows see the groups

When a query has GROUP BY, the window runs *after* the piles are made. So its rows are the grouped rows — one per satellite — and it can use aggregates as its input.

::: example Each satellite against the fleet
You want each satellite's average charge, and how far it sits from the fleet's average of those averages.

**Step 1.** GROUP BY makes three rows, one per satellite, each with `AVG(value)`.

**Step 2.** The window `AVG(AVG(value)) OVER ()` runs over those three rows. Read it from the inside: the inner `AVG(value)` is the per-satellite aggregate from step 1; the outer `AVG(...) OVER ()` averages those three numbers across the whole result.

```sql
SELECT sat_id,
       COUNT(*) AS n,
       ROUND(AVG(value), 3) AS avg_soc,
       ROUND(AVG(value) - AVG(AVG(value)) OVER (), 3) AS vs_fleet
FROM soc
GROUP BY sat_id
ORDER BY sat_id;
```

```text
 sat_id  | n | avg_soc | vs_fleet
---------+---+---------+----------
 SAT-001 | 4 |   0.800 |    0.083
 SAT-002 | 4 |   0.570 |   -0.147
 SAT-003 | 4 |   0.780 |    0.063
```

**Check by hand.** The mean of the three averages is $(0.80 + 0.57 + 0.78)/3 = 2.15/3 = 0.7167$. Then $0.80 - 0.7167 = 0.083$, $0.57 - 0.7167 = -0.147$ and $0.78 - 0.7167 = 0.063$. The three differences add to $0.083 - 0.147 + 0.063 = -0.001$, which is zero up to rounding, as it should be.

SAT-002 sits well below the rest of the fleet: that is the one the battery engineer will look at first.
:::

The nested `AVG(AVG(value))` looks odd the first time. It is only legal because of the order: the inner aggregate belongs to GROUP BY (station 3), and the outer window runs later (station 5) on its results. Two aggregates nested without an OVER would be an error.

### ORDER BY and LIMIT come after

Windows are computed before the final ORDER BY, so you may sort by a window result — by its alias, or even by writing the window function in the ORDER BY itself. And they are computed before LIMIT, which is why `COUNT(*) OVER ()` said 12 while only four rows were printed. LIMIT never shrinks a window; it only trims what you see.

::: warning LIMIT does not make a window smaller
`SELECT ..., AVG(value) OVER () FROM soc LIMIT 4` averages all twelve rows, not the four shown. If you want a statistic over "the first four", pick those four rows in a CTE first, then compute the window over the CTE.
:::

## Three families of window function

Every window function uses the same OVER clause. What changes is the function in front of it. They come in three families:

| Family | Examples | Answers questions like | Lesson |
| --- | --- | --- | --- |
| Aggregate | `AVG`, `SUM`, `COUNT`, `MIN`, `MAX` with OVER | "the satellite's average", "the total so far" | this one, and 04 |
| Ranking | `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `NTILE`, `PERCENT_RANK` | "the three worst readings per satellite" | 02 |
| Offset | `LAG`, `LEAD`, `FIRST_VALUE`, `LAST_VALUE`, `NTH_VALUE` | "the change since the last sample" | 03 |

The aggregates you already know work with or without OVER. The ranking and offset functions work *only* with OVER: `LAG(value)` on its own is an error, because "the previous row" means nothing until a window says which rows and in what order.

All of this works in PostgreSQL and in SQLite, which gained window functions in [[version 3.25|sqlite-version]]. So everything in this module can be tried in the exercises.

## Check yourself

::: check
The `soc` table has 12 rows. How many rows does each of these queries return, and what is in the last column?

```sql
SELECT sat_id, COUNT(*) FROM soc GROUP BY sat_id;
SELECT sat_id, COUNT(*) OVER (PARTITION BY sat_id) FROM soc;
```
:::

::: answer
The first returns **3 rows**, one per satellite, each with the count 4. GROUP BY collapses each pile of four into one row.

The second returns **12 rows**, one per reading, each with the count 4 — the size of that reading's own partition. A window function never removes rows. The number 4 appears twelve times, once on each row.
:::

::: check
You want each satellite's lowest reading, with its time. A teammate writes:

```sql
SELECT sat_id, ts, value
FROM soc
WHERE value = MIN(value) OVER (PARTITION BY sat_id);
```

Why does it fail, and what is the fix? What should the result be?
:::

::: answer
It fails because WHERE runs before window functions are computed; the minimum does not exist yet when WHERE looks for it. PostgreSQL says `window functions are not allowed in WHERE`.

Compute the window in a CTE, then filter outside:

```sql
WITH w AS (
    SELECT sat_id, ts, value,
           MIN(value) OVER (PARTITION BY sat_id) AS sat_min
    FROM soc
)
SELECT sat_id, ts, value
FROM w
WHERE value = sat_min
ORDER BY sat_id;
```

```text
 sat_id  |           ts           | value
---------+------------------------+-------
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50
 SAT-003 | 2026-03-01 00:30:00+00 |  0.75
```

Check against the table: SAT-001's readings are 0.90, 0.85, 0.70, 0.75, so 0.70 at 00:20 is the lowest. SAT-003's are 0.81, 0.78, 0.78, 0.75, so 0.75 at 00:30. If a satellite had two readings tied at its minimum, both would come back — which is honest. Lesson 02 shows how to keep exactly one.
:::

::: check
Without running it, write out the `running` column for SAT-003:

```sql
SELECT ts, value,
       SUM(value) OVER (PARTITION BY sat_id ORDER BY ts) AS running
FROM soc
WHERE sat_id = 'SAT-003'
ORDER BY ts;
```
:::

::: answer
With ORDER BY inside OVER, each row's window runs from the first row of the partition up to itself, so SUM gives a running total. SAT-003's values in time order are 0.81, 0.78, 0.78, 0.75.

- 00:00: $0.81$
- 00:10: $0.81 + 0.78 = 1.59$
- 00:20: $1.59 + 0.78 = 2.37$
- 00:30: $2.37 + 0.75 = 3.12$

The last value, 3.12, is the plain total of the partition, and $3.12 / 4 = 0.78$ matches SAT-003's average from the lesson. (A running total of a state of charge has no physical meaning, but the arithmetic is the point here; lesson 04 uses running sums on quantities where it does.)
:::

::: check
This query adds `WHERE sat_id <> 'SAT-002'` (read `<>` as "is not equal to"). What numbers appear in `n_all` and `n_sat`, and why?

```sql
SELECT sat_id, ts,
       COUNT(*) OVER () AS n_all,
       COUNT(*) OVER (PARTITION BY sat_id) AS n_sat
FROM soc
WHERE sat_id <> 'SAT-002';
```
:::

::: answer
WHERE runs first and removes SAT-002's four rows, leaving 8. The windows only ever see those 8 rows.

- `n_all` is **8** on every row: `OVER ()` makes one window of all surviving rows.
- `n_sat` is **4** on every row: each of the two remaining satellites still has four rows in its partition.

If you had expected 12 in `n_all`, that is the trap in "Windows see only the rows that survived WHERE".
:::

::: check
Explain in your own words why `AVG(AVG(value)) OVER ()` is legal in a query with `GROUP BY sat_id`, but `AVG(AVG(value))` without OVER is not.
:::

::: answer
With GROUP BY, the inner `AVG(value)` is an ordinary aggregate: it runs at the grouping step and produces one number per satellite. The outer `AVG(...) OVER ()` is a window function, which runs later, after grouping, over the grouped rows. So the two averages happen at two different stations of the assembly line, one feeding the other.

Without OVER, both would be ordinary aggregates wanting to run at the same grouping step, on the same piles. An aggregate cannot take the result of another aggregate at that step, so the database rejects it. (Without GROUP BY at all, you would compute the per-satellite averages in a CTE and average them in the outer query.)
:::

## Summary

| Idea | In one line |
| --- | --- |
| Window function | computes across a set of rows and writes the answer onto each row; no rows removed |
| GROUP BY | collapses each group into one row |
| `OVER (...)` | the clause that makes a function a window function and describes its window |
| `PARTITION BY p` | splits rows into independent sets; each row's window stays inside its own set |
| `OVER ()` | one window holding every row of the result |
| `ORDER BY` inside OVER | orders rows for the function; an aggregate becomes "so far" (a running aggregate) |
| Final `ORDER BY` | sorts the output; independent of the one inside OVER |
| Logical position | after WHERE, GROUP BY, HAVING; in the SELECT stage; before DISTINCT, ORDER BY, LIMIT |
| Not in WHERE | compute the window in a CTE or subquery, filter in the outer query |
| After GROUP BY | the window runs over the grouped rows: `AVG(AVG(value)) OVER ()` |
| Families | aggregate, ranking (lesson 02), offset (lesson 03) |

Next lesson puts an ORDER BY inside OVER to work straight away: numbering and ranking rows with `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `NTILE` and `PERCENT_RANK`, and choosing between them when two readings tie.

::: context state-of-charge Why a satellite's battery goes up and down
A satellite in low Earth orbit goes round the planet about every 90 to 100 minutes. For part of each orbit it is in Earth's shadow, where its solar panels make no power, so it runs on its battery and the **state of charge** falls. Back in sunlight, the panels recharge the battery and the charge climbs again. Operators watch the lowest point of each orbit most closely: a battery drained too deep, too often, wears out years early. In this lesson's table, SAT-001 falls from 0.90 to 0.70 and starts climbing again — the shape of one trip through the shadow.
:::

::: context numeric-vs-real Why the two versions of the table print differently
In PostgreSQL the lesson declares `value NUMERIC(4,2)`: an exact decimal with four digits, two after the point, so $0.85 - 0.90$ prints as exactly $-0.05$. SQLite's `REAL` is a binary floating-point number, the type you met in the data-types lesson. It cannot store 0.85 or 0.90 exactly, so the same subtraction prints as $-0.050000000000000044$. Both are "the same number" to the precision a battery sensor has. When you check answers in SQLite, compare with a tolerance, such as `ABS(delta + 0.05) < 1e-9`, rather than with `=`; the exercise tests do exactly that.
:::

::: context group-vs-window The same four rows, grouped and windowed
GROUP BY turns SAT-001's four readings into one row. A window over the same partition keeps all four and writes the average on each.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <text x="55" y="36" font-size="12" fill="#1f2a44" text-anchor="middle">SAT-001: 4 rows</text>
  <g stroke="#1f2a44" stroke-width="1" fill="#8fb8f0">
    <rect x="10" y="50" width="90" height="20"/><rect x="10" y="72" width="90" height="20"/>
    <rect x="10" y="94" width="90" height="20"/><rect x="10" y="116" width="90" height="20"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="55" y="64">0.90</text><text x="55" y="86">0.85</text><text x="55" y="108">0.70</text><text x="55" y="130">0.75</text>
  </g>
  <text x="275" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">GROUP BY sat_id: 1 row</text>
  <rect x="200" y="28" width="150" height="20" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="275" y="42" font-size="12" fill="#1f2a44" text-anchor="middle">SAT-001 · avg 0.800</text>
  <text x="275" y="70" font-size="12" fill="#1d6fd1" text-anchor="middle">OVER (PARTITION BY sat_id): 4 rows</text>
  <g stroke="#1f2a44" stroke-width="1" fill="#ffffff">
    <rect x="200" y="78" width="150" height="20"/><rect x="200" y="100" width="150" height="20"/>
    <rect x="200" y="122" width="150" height="20"/><rect x="200" y="144" width="150" height="20"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="275" y="92">0.90 · avg 0.800</text><text x="275" y="114">0.85 · avg 0.800</text>
    <text x="275" y="136">0.70 · avg 0.800</text><text x="275" y="158">0.75 · avg 0.800</text>
  </g>
  <line x1="104" y1="80" x2="189" y2="41" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="196,38 187.1,37.7 190.4,45" fill="#6c7a93"/>
  <line x1="104" y1="100" x2="188" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <polygon points="196,111 188.5,106.1 187.6,114" fill="#6c7a93"/>
</svg>
```

Both use the same number, 0.800. What differs is how many rows come out: one, or all four.
:::

::: context word-window Why "window"
Imagine sitting at each row in turn and looking out of a window. Through it you can see some of the other rows — your own satellite's readings, say, or only the ones that came before you. The function works out its answer from what it can see. A different row sits at a different window and may see a different view. The SQL standard added window functions in 2003. PostgreSQL has had them since version 8.4 in 2009, and nearly every analytics database has them now, because they replaced a great many slow self-joins.
:::

::: context current-row One row, and the window it sees
Each row takes a turn as the **current row**. Here the current row is SAT-002 at 00:10. With `PARTITION BY sat_id`, its window is the four SAT-002 rows, shaded; the other satellites' rows are invisible to it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="60" y="10" width="140" height="14" fill="#ffffff"/><rect x="60" y="24" width="140" height="14" fill="#ffffff"/>
    <rect x="60" y="38" width="140" height="14" fill="#ffffff"/><rect x="60" y="52" width="140" height="14" fill="#ffffff"/>
    <rect x="60" y="72" width="140" height="14" fill="#8fb8f0"/><rect x="60" y="86" width="140" height="14" fill="#1d6fd1"/>
    <rect x="60" y="100" width="140" height="14" fill="#8fb8f0"/><rect x="60" y="114" width="140" height="14" fill="#8fb8f0"/>
    <rect x="60" y="134" width="140" height="14" fill="#ffffff"/><rect x="60" y="148" width="140" height="14" fill="#ffffff"/>
    <rect x="60" y="162" width="140" height="14" fill="#ffffff"/><rect x="60" y="176" width="140" height="14" fill="#ffffff"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="54" y="42">SAT-001</text><text x="54" y="104">SAT-002</text><text x="54" y="166">SAT-003</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="130" y="21">00:00  0.90</text><text x="130" y="35">00:10  0.85</text><text x="130" y="49">00:20  0.70</text><text x="130" y="63">00:30  0.75</text>
    <text x="130" y="83">00:00  0.50</text><text x="130" y="97" fill="#ffffff">00:10  0.55</text><text x="130" y="111">00:20  0.60</text><text x="130" y="125">00:50  0.63</text>
    <text x="130" y="145">00:00  0.81</text><text x="130" y="159">00:10  0.78</text><text x="130" y="173">00:20  0.78</text><text x="130" y="187">00:30  0.75</text>
  </g>
  <line x1="208" y1="93" x2="226" y2="93" stroke="#1d6fd1" stroke-width="2"/>
  <text x="232" y="97" font-size="12" fill="#1d6fd1">current row</text>
  <path d="M206,72 L214,72 L214,128 L206,128" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="222" y="118" font-size="12" fill="#1f2a44">its window: 4 rows</text>
  <text x="222" y="134" font-size="12" fill="#1f2a44">AVG = 0.570</text>
</svg>
```

Move the current row to SAT-003 and the shaded window jumps to SAT-003's four rows.
:::

::: context partition-word Two meanings of "partition"
In a window clause, a **partition** is a set of rows that share the PARTITION BY value, and it exists only while the query runs. The next module uses the same word for something different: **table partitioning**, where a big table is physically stored as many smaller tables, often one per day or month of telemetry. The two are unrelated. When someone says "partition" in a design review, it is worth asking which one they mean.
:::

::: context running-rule Which rows count as "so far"
With ORDER BY inside OVER and nothing else, the window runs from the first row of the partition up to the current row — and also includes any later rows that tie with the current row on the ORDER BY value, because the database cannot tell which of two equal timestamps came "first". In this table no satellite has two samples at the same time, so "so far" means exactly "up to this row". Lesson 05 names this default precisely and shows when the tie rule changes a result.
:::

::: context logical-order-picture Windows on the assembly line
Each station receives a table and passes one on. The window station comes after every filter and grouping step, so WHERE and HAVING cannot see its results, but ORDER BY and LIMIT can.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="10" y="20" width="72" height="30" fill="#ffffff"/><rect x="98" y="20" width="72" height="30" fill="#ffffff"/>
    <rect x="186" y="20" width="72" height="30" fill="#ffffff"/><rect x="274" y="20" width="72" height="30" fill="#ffffff"/>
    <rect x="10" y="90" width="72" height="30" fill="#8fb8f0"/><rect x="98" y="90" width="72" height="30" fill="#ffffff"/>
    <rect x="186" y="90" width="72" height="30" fill="#ffffff"/><rect x="274" y="90" width="72" height="30" fill="#ffffff"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="46" y="40">FROM</text><text x="134" y="40">WHERE</text><text x="222" y="40">GROUP BY</text><text x="310" y="40">HAVING</text>
    <text x="46" y="104">windows</text><text x="46" y="116" font-size="11">+ SELECT</text>
    <text x="134" y="110">DISTINCT</text><text x="222" y="110">ORDER BY</text><text x="310" y="110">LIMIT</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="82" y1="35" x2="96" y2="35"/><line x1="170" y1="35" x2="184" y2="35"/><line x1="258" y1="35" x2="272" y2="35"/>
    <line x1="82" y1="105" x2="96" y2="105"/><line x1="170" y1="105" x2="184" y2="105"/><line x1="258" y1="105" x2="272" y2="105"/>
    <path d="M310,50 L310,70 L46,70 L46,88" fill="none"/>
  </g>
  <text x="134" y="64" font-size="11" fill="#b4232c" text-anchor="middle">cannot see windows</text>
  <text x="266" y="140" font-size="11" fill="#1d6fd1" text-anchor="middle">can see windows</text>
</svg>
```

The top row runs first. By the time the blue station computes a window, every row-dropping and pile-making decision has already been made.
:::

::: context sqlite-version Checking your SQLite
SQLite added window functions in version 3.25.0, released in September 2018, and the FILTER clause on aggregates in 3.30. Anything older reports a syntax error at the word OVER. You can check which version you are running with `SELECT sqlite_version();`. The browser build the exercises use, and the Python `sqlite3` module on any recent system, are far newer than that — the queries in this lesson were checked on 3.45.
:::
