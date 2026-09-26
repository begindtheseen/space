---
id: l08-the-order-a-query-runs-in
title: The order a query really runs in
minutes: 19
covers:
  - "Logical versus physical query order: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY, LIMIT"
---

You write a query starting with `SELECT`. The database does not start there.

Think about ordering at a sandwich counter. You say "a toasted turkey sandwich, cut in half, to go". You said *toasted* first, but nobody toasts anything until they have picked up bread and turkey. The order you *say* things in is built for the listener. The order they get *done* in is set by what depends on what.

SQL is the same. Its written order — `SELECT … FROM … WHERE … ORDER BY …` — was designed to read like an English sentence. Underneath, every query has a fixed **logical order**: the order the clauses take effect in, as if each were a separate step. Once you know it, a whole family of confusing error messages turns into common sense, and you can predict what a query will do before you run it.

This lesson gives you that order, walks a real telemetry query through it step by step, and then shows that the database's *actual* work — the **physical order** — can look completely different, without changing the answer.

## The logical order

Here is a full single-table query with every clause you know, plus two new ones, `GROUP BY` and `HAVING`, that you will meet properly in a moment:

```sql
SELECT   sat_id, AVG(value) AS avg_soc      -- 5
FROM     telemetry                          -- 1
WHERE    channel = 'BATT_SOC'               -- 2
GROUP BY sat_id                             -- 3
HAVING   COUNT(value) >= 2                  -- 4
ORDER BY avg_soc                            -- 7
LIMIT    1;                                 -- 8
```

The numbers in the comments are the logical order. Read them top to bottom and the query jumps around; read them 1 to 8 and it tells a story:

1. **FROM** — fetch the table (and, from next module, join other tables to it). This is the raw pile of rows.
2. **WHERE** — throw away rows that fail the condition.
3. **GROUP BY** — sort the surviving rows into groups.
4. **HAVING** — throw away whole groups that fail a condition.
5. **SELECT** — work out the output columns, including any computed ones and their aliases.
6. **DISTINCT** — remove duplicate output rows (if asked; this query does not).
7. **ORDER BY** — sort what is left.
8. **LIMIT** (and OFFSET) — keep only the requested slice.

Picture an **[[assembly line|assembly-line]]**. Each station receives a table, does one job, and passes a table on. A station can only work with what the stations before it have made.

::: key The logical order of evaluation of a SELECT
FROM (and joins), then WHERE, then GROUP BY, then HAVING, then SELECT, then DISTINCT, then ORDER BY, then LIMIT. It explains why a SELECT alias is usable in ORDER BY but not in WHERE.
:::

A memory aid, if you like one: "**F**ind **W**hich **G**roups **H**ave **S**ome **D**ata, **O**rdered, **L**imited." Better still, remember the *reasons*: you cannot filter rows you have not fetched, cannot filter groups you have not made, and cannot sort columns you have not computed.

## Meeting GROUP BY and HAVING

You need these two clauses to see the whole order. The next module teaches them in depth; here is what they do.

Picture a laundry basket of socks. You tip them out and sort them into piles by colour. Then for each pile you say one thing: "seven blue socks", "three red socks". You started with many socks and ended with one line per pile.

**GROUP BY** is the sorting into piles. `GROUP BY sat_id` makes one pile per satellite. After it, the rows are no longer separate — each pile will become **one** output row.

An **[[aggregate function|aggregate]]** is what you say about each pile. It takes a whole group of values and returns one value. The first five you need:

- `COUNT(*)` — how many rows are in the group.
- `COUNT(value)` — how many rows have a non-NULL `value`. (Lesson 05: NULL means "not there", so it is not counted.)
- `AVG(value)`, `MIN(value)`, `MAX(value)` — the average, smallest and largest, all ignoring NULLs.

Here is the exercise's battery data, eight rows of telemetry, grouped by satellite:

```sql
SELECT sat_id,
       COUNT(*)     AS n_rows,
       COUNT(value) AS n_values,
       MIN(value)   AS lowest,
       MAX(value)   AS highest
FROM telemetry
WHERE channel = 'BATT_SOC'
GROUP BY sat_id
ORDER BY sat_id;
```

```text
 sat_id  | n_rows | n_values | lowest | highest
---------+--------+----------+--------+---------
 SAT-001 |      3 |        3 |   0.61 |    0.94
 SAT-002 |      3 |        2 |   0.19 |    0.42
 SAT-003 |      1 |        1 |   0.75 |    0.75
```

SAT-002 has three rows but only two values: one of its readings was NULL. `COUNT(*)` counts rows; `COUNT(value)` counts measurements.

**HAVING** is a filter for piles. `HAVING COUNT(value) >= 2` keeps a satellite's group only if it has at least two measurements. It runs after grouping, so it can use aggregates. WHERE runs before grouping, on single rows, so it cannot.

::: key WHERE filters rows; HAVING filters groups
WHERE runs before GROUP BY and decides which rows go into the piles. HAVING runs after GROUP BY and decides which piles survive. An aggregate like `AVG(value)` can appear in HAVING, SELECT and ORDER BY, but never in WHERE.
:::

One rule follows directly from "each pile becomes one row". After GROUP BY, SELECT may name only the grouping columns or aggregates. Ask for a plain column and PostgreSQL refuses, because a pile of three readings has no single `value` to show:

```sql
SELECT sat_id, value FROM telemetry GROUP BY sat_id;
```

```text
ERROR:  column "telemetry.value" must appear in the GROUP BY clause or be used in an aggregate function
```

::: warning SQLite answers anyway
SQLite accepts `SELECT sat_id, value FROM telemetry GROUP BY sat_id` and returns *some* value from each group — here `0.94`, `0.42` and `21.5`, which happen to be the first rows stored. That is not "the latest", "the highest" or anything else meaningful. If you mean the highest, write `MAX(value)`.
:::

## Walking a query through the line

::: example Following eight rows through the stations
Take the query from the top of the lesson: "Of the satellites with at least two battery measurements, which has the lowest average state of charge?" Follow the table of telemetry from station to station.

**1. FROM telemetry** — all 8 rows: six from SAT-001 and SAT-002 on `BATT_SOC`, one SAT-003 `BUS_TEMP` row (21.5 °C), one SAT-003 `BATT_SOC` row.

**2. WHERE channel = 'BATT_SOC'** — the bus-temperature row fails and is dropped. 7 rows remain. The NULL reading stays: its *channel* is `BATT_SOC`, and the condition is only about the channel.

**3. GROUP BY sat_id** — the 7 rows go into 3 piles: SAT-001 (3 rows), SAT-002 (3 rows, one NULL), SAT-003 (1 row).

**4. HAVING COUNT(value) >= 2** — count the measurements in each pile: 3, 2 and 1. SAT-003's pile has only 1 and is dropped. 2 groups remain.

**5. SELECT sat_id, AVG(value) AS avg_soc** — one row per surviving group:

- SAT-001: $(0.94 + 0.88 + 0.61) / 3 = 2.43 / 3 = 0.81$.
- SAT-002: the NULL is ignored, so $(0.42 + 0.19) / 2 = 0.61 / 2 = 0.305$.

**7. ORDER BY avg_soc** — ascending: SAT-002 (0.305), then SAT-001 (0.81).

**8. LIMIT 1** — keep the first row.

```text
 sat_id  | avg_soc
---------+---------
 SAT-002 |   0.305
```

**Sanity check.** SAT-002's readings, 0.42 and 0.19, are both below every one of SAT-001's, so its average must be lower. It is. Notice too that SAT-002's average divides by 2, not 3: the missing reading was not treated as zero. (If someone had written `COALESCE(value, 0)` — lesson 05 — the average would have been $0.61/3 \approx 0.203$, a fake emergency.)
:::

## Consequences you can now predict

Each rule below used to be a thing to memorize. With the order in hand, each is a one-line deduction.

### A SELECT alias does not exist yet in WHERE

In lesson 04 you gave computed columns names with `AS`. Suppose you want battery readings below 50 percent and write:

```sql
SELECT sat_id, ts, value * 100 AS soc_pct
FROM telemetry
WHERE soc_pct < 50;
```

```text
ERROR:  column "soc_pct" does not exist
LINE 1: ..., ts, value * 100 AS soc_pct FROM telemetry WHERE soc_pct < ...
                                                             ^
```

WHERE is station 2. The alias `soc_pct` is made at station 5. When WHERE runs, there is no such column — exactly what the error says.

### But it does exist in ORDER BY

ORDER BY is station 7, after SELECT, so the alias is ready:

```sql
SELECT sat_id, ts, value * 100 AS soc_pct
FROM telemetry
WHERE channel = 'BATT_SOC' AND value * 100 < 50
ORDER BY soc_pct;
```

```text
 sat_id  |           ts           | soc_pct
---------+------------------------+---------
 SAT-002 | 2026-03-01 00:02:00+00 |      19
 SAT-002 | 2026-03-01 00:00:00+00 |      42
```

The fix for WHERE was to **repeat the expression**: `value * 100 < 50` instead of `soc_pct < 50`. (Here you could equally write `value < 0.5`.) In the next module you will learn to wrap a query inside another — a subquery or a CTE — so the outer query's WHERE can see the inner query's aliases. That is the tidy fix when the expression is long.

::: warning Two quirks of aliases
PostgreSQL lets ORDER BY use an alias only on its own. `ORDER BY soc_pct` works; `ORDER BY soc_pct + 0` fails with `column "soc_pct" does not exist`, because inside an expression the name is looked up among the table's real columns.

SQLite goes the other way and is **[[more lenient|sqlite-leniency]]**: it accepts `WHERE soc_pct < 50` and returns the right two rows. The exercises run on SQLite, so such a query will pass there — and fail the day it is moved to PostgreSQL. Write the portable form.
:::

### An aggregate cannot go in WHERE

"Satellites whose average charge is below 0.5" is not a WHERE question:

```sql
SELECT sat_id FROM telemetry WHERE AVG(value) < 0.5 GROUP BY sat_id;
```

```text
ERROR:  aggregate functions are not allowed in WHERE
```

At station 2 there are no groups, so there is nothing to average. SQLite says the same thing its own way: `misuse of aggregate: AVG()`. The condition belongs in HAVING, at station 4.

### DISTINCT happens before ORDER BY

DISTINCT is station 6. After it, each output row may stand for several original rows. So ORDER BY, at station 7, cannot sort by a column that is not in the output — which of the merged rows' values would it use?

```sql
SELECT DISTINCT sat_id FROM telemetry ORDER BY ts;
```

```text
ERROR:  for SELECT DISTINCT, ORDER BY expressions must appear in select list
```

(SQLite, again, answers anyway, using an arbitrary `ts` from each group.)

### LIMIT comes last

LIMIT is station 8, after the sort. That is why `ORDER BY value LIMIT 3` really does give the three lowest values: the sort finishes first, then the slice is taken. It is also why, as lesson 03 warned, `LIMIT` with no ORDER BY promises nothing about *which* rows you get — there was no sorting station for it to follow.

::: example WHERE and HAVING give different answers
Two engineers are asked: "For satellites whose battery ever dropped below 0.7, what was the average state of charge?" They write:

```sql
-- Engineer A: filter groups
SELECT sat_id, ROUND(AVG(value)::numeric, 3) AS avg_soc
FROM telemetry
WHERE channel = 'BATT_SOC'
GROUP BY sat_id
HAVING MIN(value) < 0.7
ORDER BY sat_id;
```

```text
 sat_id  | avg_soc
---------+---------
 SAT-001 |   0.810
 SAT-002 |   0.305
```

```sql
-- Engineer B: filter rows
SELECT sat_id, ROUND(AVG(value)::numeric, 3) AS avg_soc
FROM telemetry
WHERE channel = 'BATT_SOC' AND value < 0.7
GROUP BY sat_id
ORDER BY sat_id;
```

```text
 sat_id  | avg_soc
---------+---------
 SAT-001 |   0.610
 SAT-002 |   0.305
```

(`ROUND(x::numeric, 3)` rounds to three decimal places. The cast to NUMERIC is there because PostgreSQL's two-argument ROUND accepts only NUMERIC.)

**Trace A.** WHERE keeps all 7 battery rows. The piles are the same as before. HAVING asks each pile "is your minimum below 0.7?" SAT-001: minimum 0.61, yes. SAT-002: 0.19, yes. SAT-003: 0.75, no. The averages use *every* reading in the surviving piles: SAT-001 is $(0.94 + 0.88 + 0.61)/3 = 0.81$.

**Trace B.** WHERE drops every row at or above 0.7 *before* grouping. SAT-001's pile now holds only 0.61, so its "average" is 0.61. SAT-003's only reading, 0.75, is gone, so SAT-003 never forms a pile.

**Which is right?** A. The question selects *satellites* by a property of their whole history, then averages that whole history. B averages only the low readings, which answers a different question ("average of the sub-0.7 readings"). Same satellites, different numbers — and neither query raised an error. Knowing which station a condition sits at is how you tell them apart.
:::

## Logical order is not physical order

Everything so far describes what a query *means*. It does not describe what the database *does*. SQL is **[[declarative|declarative]]**: you describe the result you want, and a part of the database called the **[[query planner|planner]]** decides how to produce it. The planner's plan is the **physical order**. The only rule is that the result must be exactly what the logical order would give.

Here is an example of how different the two can be. A bigger table, `reading_big`, holds one battery reading per minute for a full day for 500 satellites: $500 \times 1440 = 720{,}000$ rows. It has an **[[index|index]]** on `ts` — a separate, sorted structure that lets the database find rows by time without reading the whole table, like the index at the back of a book. Ask for the five most recent low-battery readings:

```sql
SELECT sat_id, ts, value
FROM reading_big
WHERE value < 0.25
ORDER BY ts DESC
LIMIT 5;
```

Logically: fetch 720,000 rows, filter, sort all survivors, keep five. `EXPLAIN ANALYZE` in front of the query shows the plan PostgreSQL actually ran:

```text
 Limit  (actual time=0.054..0.061 rows=5 loops=1)
   ->  Index Scan Backward using reading_big_ts on reading_big  (actual time=0.053..0.059 rows=5 loops=1)
         Filter: (value < '0.25'::double precision)
         Rows Removed by Filter: 75
 Execution Time: 0.069 ms
```

(Cost estimates trimmed; the timings are from one run on a laptop-class machine.)

Read it from the inside out. The planner walked the `ts` index **backwards** — newest first, which is already the ORDER BY order, so no sort was needed. It tested each row against the WHERE condition *as it walked*. After 80 rows (5 kept + 75 removed) it had five matches, and the LIMIT told it to stop. It looked at 80 rows out of 720,000 and finished in well under a millisecond.

So physically, ORDER BY ran *first*, WHERE ran *during*, and LIMIT stopped everything *early*. The answer is still exactly what the logical order defines.

::: key Logical versus physical order
The logical order (FROM, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, LIMIT) defines what a query means and which names are visible where. The physical order is the planner's choice — indexes, reordering, stopping early — and may be completely different, but it must produce the same result. `EXPLAIN` shows the physical plan.
:::

### Do not rely on the order inside WHERE

Because the planner is free to rearrange work, you cannot count on the parts of a WHERE clause being tested left to right. Suppose you want readings whose inverse, `1 / value`, is above 4, and you try to protect against dividing by zero like this:

```sql
WHERE value <> 0 AND 1 / value > 4
```

In many languages the left test would run first and **[[short-circuit|short-circuit]]** the right one. PostgreSQL does not promise that. It may evaluate `1 / value` first and fail with a division-by-zero error. Make each piece safe on its own instead. `NULLIF` from lesson 05 does it: `1 / NULLIF(value, 0)` turns a zero into NULL, and dividing by NULL gives NULL rather than an error.

```sql
SELECT sat_id, ts, value, 1 / NULLIF(value, 0) AS inv
FROM telemetry
WHERE sat_id = 'SAT-002';
```

```text
 sat_id  |           ts           | value |        inv
---------+------------------------+-------+--------------------
 SAT-002 | 2026-03-01 00:00:00+00 |  0.42 |  2.380952380952381
 SAT-002 | 2026-03-01 00:01:00+00 |       |
 SAT-002 | 2026-03-01 00:02:00+00 |  0.19 | 5.2631578947368425
```

Check: $1 / 0.42 \approx 2.38$ and $1 / 0.19 \approx 5.26$. The NULL row gives NULL, as it should.

::: warning Put row conditions in WHERE, not HAVING
`HAVING sat_id = 'SAT-002'` works — PostgreSQL returns the right group. But it asks the database to build every pile and then throw most away. `WHERE sat_id = 'SAT-002'` removes the other rows before the piles are made. Conditions on single rows belong in WHERE; keep HAVING for conditions that need an aggregate.
:::

## Check yourself

::: check
Put these clauses in their logical order: ORDER BY, HAVING, FROM, LIMIT, SELECT, WHERE, DISTINCT, GROUP BY. Which one comes first, and what does it produce?
:::

::: answer
FROM, WHERE, GROUP BY, HAVING, SELECT, DISTINCT, ORDER BY, LIMIT. FROM comes first: it produces the working set of rows — the table, plus any joined tables — that every later step works on.
:::

::: check
A colleague writes `SELECT sat_id, value * 9 / 5 + 32 AS temp_f FROM telemetry WHERE channel = 'BUS_TEMP' AND temp_f > 100;` PostgreSQL rejects it. Explain why using the logical order, and rewrite it so it runs.
:::

::: answer
WHERE runs at step 2 and the alias `temp_f` is created at step 5, in SELECT. When WHERE runs, `temp_f` does not exist, so PostgreSQL reports `column "temp_f" does not exist`. Repeat the expression:

```sql
SELECT sat_id, value * 9 / 5 + 32 AS temp_f
FROM telemetry
WHERE channel = 'BUS_TEMP' AND value * 9 / 5 + 32 > 100;
```

(Equivalently `value > 37.777…`, but repeating the expression is clearer.) SQLite would have accepted the original — which is exactly why you should not rely on it.
:::

::: check
Using the eight-row telemetry table from this lesson, what does this return, and why is SAT-003 missing?

```sql
SELECT sat_id, COUNT(*) AS n
FROM telemetry
WHERE value IS NOT NULL
GROUP BY sat_id
HAVING COUNT(*) >= 2
ORDER BY sat_id;
```
:::

::: answer
WHERE drops only the NULL row (SAT-002, 00:01), leaving 7 rows. Note there is no channel filter, so SAT-003's bus-temperature row stays. Piles: SAT-001 has 3, SAT-002 has 2, SAT-003 has 2 (one `BUS_TEMP`, one `BATT_SOC`). All three pass HAVING, so the result is SAT-001 3, SAT-002 2, SAT-003 2.

SAT-003 is *not* missing — that was the trap. It would have been dropped if the WHERE clause had also said `channel = 'BATT_SOC'`, leaving it only one row.
:::

::: check
Why can `ORDER BY avg_soc` refer to the alias from `AVG(value) AS avg_soc`, while `HAVING avg_soc < 0.5` is refused by PostgreSQL? What do you write instead?
:::

::: answer
ORDER BY is step 7, after SELECT (step 5) has created the alias. HAVING is step 4, before SELECT, so the alias does not exist yet. Repeat the aggregate: `HAVING AVG(value) < 0.5`.
:::

::: check
A query `SELECT … FROM reading_big WHERE sat_id = 'SAT-042' ORDER BY ts DESC LIMIT 10` runs in a millisecond. A teammate says: "That proves the database only read ten rows." Is that right? What would you run to find out?
:::

::: answer
Not necessarily. The logical order says nothing about how many rows were physically read. It depends on the plan: with an index on `ts`, the database might walk backwards and stop once it has ten SAT-042 rows, as in the lesson. Without a useful index, it might scan every row and sort. Run `EXPLAIN ANALYZE` in front of the query and read the plan: the node types (index scan or full scan) and the "Rows Removed by Filter" line tell you what really happened.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Logical order | FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT |
| Why it matters | each step sees only what earlier steps made |
| GROUP BY | sorts rows into groups; each group becomes one output row |
| Aggregates | `COUNT(*)`, `COUNT(col)`, `AVG`, `MIN`, `MAX` — one value per group, NULLs ignored (except by `COUNT(*)`) |
| WHERE vs HAVING | WHERE filters rows before grouping; HAVING filters groups after |
| Aliases | not visible in WHERE or HAVING; visible in ORDER BY; repeat the expression or wrap the query |
| DISTINCT + ORDER BY | can sort only by output columns |
| Physical order | the planner's plan (`EXPLAIN`); may use indexes, reorder, stop early; same result |
| Inside WHERE | no guaranteed left-to-right; guard with `NULLIF` or CASE, not with AND order |

Next lesson closes the module. You will sit down in front of a database someone else built — tables you have never seen, columns with unexplained names — and learn a method for reading it well enough to write a correct query without guessing.

::: context assembly-line The query as an assembly line
Each clause is a station. Every station takes a table in and hands a table out, so you can stop the line at any station and look at what it has made.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <rect x="8" y="20" width="76" height="30" rx="4" fill="#8fb8f0"/><text x="46" y="39">1 FROM</text>
    <rect x="96" y="20" width="76" height="30" rx="4" fill="#8fb8f0"/><text x="134" y="39">2 WHERE</text>
    <rect x="184" y="20" width="76" height="30" rx="4" fill="#f2b880"/><text x="222" y="39">3 GROUP BY</text>
    <rect x="272" y="20" width="80" height="30" rx="4" fill="#f2b880"/><text x="312" y="39">4 HAVING</text>
    <rect x="8" y="94" width="76" height="30" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/><text x="46" y="113">5 SELECT</text>
    <rect x="96" y="94" width="76" height="30" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/><text x="134" y="113">6 DISTINCT</text>
    <rect x="184" y="94" width="76" height="30" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/><text x="222" y="113">7 ORDER BY</text>
    <rect x="272" y="94" width="80" height="30" rx="4" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/><text x="312" y="113">8 LIMIT</text>
  </g>
  <g stroke="#1f2a44" stroke-width="2" fill="none">
    <line x1="84" y1="35" x2="94" y2="35"/><line x1="172" y1="35" x2="182" y2="35"/><line x1="260" y1="35" x2="270" y2="35"/>
    <polyline points="312,50 312,72 46,72 46,92"/>
    <line x1="84" y1="109" x2="94" y2="109"/><line x1="172" y1="109" x2="182" y2="109"/><line x1="260" y1="109" x2="270" y2="109"/>
  </g>
  <text x="180" y="144" font-size="11" fill="#b4232c" text-anchor="middle">aliases are born at 5: usable at 7, not at 2 or 4</text>
</svg>
```

Blue boxes work on rows, orange boxes on groups, white boxes on the finished output.
:::

::: context aggregate Where "aggregate" comes from
The word comes from the Latin *aggregare*, "to add to the flock" — to gather many into one. In SQL an aggregate function gathers a group of values into a single value: a count, a sum, an average, a minimum.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <rect x="20" y="14" width="100" height="22" fill="#8fb8f0"/><text x="30" y="30">SAT-001 0.94</text>
    <rect x="20" y="38" width="100" height="22" fill="#8fb8f0"/><text x="30" y="54">SAT-001 0.88</text>
    <rect x="20" y="62" width="100" height="22" fill="#8fb8f0"/><text x="30" y="78">SAT-001 0.61</text>
    <rect x="230" y="38" width="110" height="22" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/><text x="240" y="54">SAT-001 0.81</text>
  </g>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="122" y1="25" x2="226" y2="47"/><line x1="122" y1="49" x2="226" y2="49"/><line x1="122" y1="73" x2="226" y2="51"/>
  </g>
  <polygon points="228,49 218,44 218,54" fill="#1f2a44"/>
  <text x="170" y="112" font-size="12" fill="#1d6fd1" text-anchor="middle">three rows in, one row out: AVG(value) = 0.81</text>
</svg>
```

Everyday aggregates are everywhere: a class average, a team's total score, the highest temperature this week.
:::

::: context sqlite-leniency Why SQLite accepts more
SQLite was designed to be small, forgiving and embedded inside other programs (lesson 06 told that story). Its author chose to accept many queries that the SQL standard forbids, such as an alias in WHERE or a bare column in a grouped SELECT, and do something reasonable.

PostgreSQL follows the standard more strictly. Neither is wrong, but a query that relies on SQLite's generosity will break when your team moves the analysis onto a PostgreSQL warehouse. Practise the strict form and you are safe on both.
:::

::: context declarative Saying what, not how
Most programming languages are **imperative**: you list the steps. "Open the file, read each line, if the value is below 0.5 add it to a list, sort the list."

SQL is **declarative**: you describe the result. "The rows where the value is below 0.5, sorted." How to get there is the database's problem. That is why the same SQL can run on a table of ten rows or ten billion, and why a new index can make yesterday's slow query fast without anyone changing a word of it.

The idea goes back to Edgar Codd's relational model of 1970.
:::

::: context planner How the planner chooses
The planner builds many candidate plans — scan the whole table or use an index, filter here or there — and estimates the **cost** of each, using statistics it keeps about the table: how many rows, how many distinct values, how values are spread. It runs the cheapest.

The statistics are refreshed by a command called `ANALYZE`, which PostgreSQL also runs automatically in the background. When a plan is surprisingly bad, stale statistics are one of the first suspects.
:::

::: context index An index is a sorted shortcut
An index on `ts` is a separate structure holding every `ts` value in sorted order, each with a pointer back to its row. PostgreSQL's default kind is a **B-tree**, which stays sorted as rows are added.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="70" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">index on ts (sorted)</text>
  <text x="270" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">table rows (any order)</text>
  <g font-size="11" fill="#1f2a44">
    <rect x="20" y="26" width="100" height="22" fill="#8fb8f0"/><text x="30" y="41">23:57</text>
    <rect x="20" y="50" width="100" height="22" fill="#8fb8f0"/><text x="30" y="65">23:58</text>
    <rect x="20" y="74" width="100" height="22" fill="#8fb8f0"/><text x="30" y="89">23:59</text>
    <rect x="210" y="26" width="120" height="22" fill="#ffffff" stroke="#6c7a93"/><text x="218" y="41">23:59  0.22</text>
    <rect x="210" y="50" width="120" height="22" fill="#ffffff" stroke="#6c7a93"/><text x="218" y="65">23:57  0.64</text>
    <rect x="210" y="74" width="120" height="22" fill="#ffffff" stroke="#6c7a93"/><text x="218" y="89">23:58  0.41</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="120" y1="37" x2="208" y2="61"/><line x1="120" y1="61" x2="208" y2="85"/><line x1="120" y1="85" x2="208" y2="37"/>
  </g>
  <line x1="10" y1="96" x2="10" y2="30" stroke="#b4232c" stroke-width="2"/>
  <polygon points="10,26 5,36 15,36" fill="#b4232c"/>
  <text x="20" y="124" font-size="11" fill="#b4232c">"Index Scan Backward": start at the newest</text>
  <text x="20" y="140" font-size="11" fill="#b4232c">entry and follow pointers until LIMIT is met</text>
</svg>
```

Like the index at the back of a book, it saves reading every page — as long as you are looking things up by the same thing it is sorted on.
:::

::: context short-circuit Short-circuiting
In Python, `x != 0 and 1 / x > 4` never divides by zero: if the left side is false, Python does not bother with the right side. That shortcut is called **short-circuit evaluation**, because the rest of the circuit is skipped.

SQL's standard does not require it, and PostgreSQL's documentation says the order in which parts of an expression are evaluated is not defined. The planner may even test the cheaper-looking condition first. So in SQL, protect each piece separately — with `NULLIF`, or with a `CASE` expression, whose branches are tried in order.
:::
