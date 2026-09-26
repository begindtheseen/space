---
id: l07-subqueries
title: "Subqueries: queries inside queries"
minutes: 24
covers:
  - Scalar, row and table subqueries; correlated subqueries
---

Some questions contain another question. "Which readings were hotter than the fleet average?" You cannot answer it until you know the fleet average — and that is a question of its own. In everyday life you would work it out on scrap paper first, then use the number. SQL lets you write the scrap-paper step right inside the main query.

A **subquery** is a complete SELECT, wrapped in round brackets, sitting inside another statement. The database works out the inner query and uses its result in the outer one. You met one briefly in the previous module, as the list after `IN`. This lesson shows the whole family. A subquery can stand in for a single value, for one row, or for a whole table. And it can refer to the row the outer query is looking at, so that it is worked out afresh for every row — which is powerful, and has a cost worth understanding.

The examples use the module's `satellite` and `reading` tables. As a reminder, the six bus-temperature readings are Aurora 20, 24 and 30; Borealis 18 and 22; Cirrus 11 (all °C). Dorado has none.

## Three shapes a result can have

Every SELECT returns a table: some rows, some columns. What decides where a subquery may go is the **[[shape of that table|result-shapes]]**:

- One row and one column: a single value. That is a **scalar subquery**. ("Scalar" means "a single number or value", as opposed to a list.)
- One row with several columns: a **row subquery**.
- Any number of rows: a **table subquery**.

A scalar subquery can go wherever a single value can go: in the SELECT list, in WHERE, in an ORDER BY. A row subquery can be compared with a row of values. A table subquery can go after IN, after EXISTS (next lesson), or in FROM, where it acts like a table.

## Scalar subqueries: one value

Back to the opening question. The fleet average is `SELECT AVG(value) FROM reading`, which returns one row and one column: about 20.83. Put it in brackets and use it like a number:

```sql
SELECT sat_id, ts, value
FROM reading
WHERE value > (SELECT AVG(value) FROM reading)
ORDER BY sat_id, ts;
```

```text
 sat_id  |          ts          | value
---------+----------------------+-------
 SAT-001 | 2026-03-01T06:00:00Z |    24
 SAT-001 | 2026-03-02T01:00:00Z |    30
 SAT-002 | 2026-03-01T12:00:00Z |    22
```

Read the WHERE line aloud as "keep the rows whose value is greater than the average value of all readings". The inner query does not mention the outer one at all, so the database can work it out once, get 20.83, and then filter with that constant.

Why not write `WHERE value > AVG(value)`? Because of the order a query runs in, from the previous module: WHERE runs before any grouping, one row at a time, and an aggregate cannot go there. The subquery is a separate, complete query that has already finished its own aggregating.

::: example How far is each reading from the fleet average?
A scalar subquery works in the SELECT list too. This shows each reading's difference from the fleet mean, rounded to two decimals.

```sql
SELECT sat_id, ts, value,
       ROUND((value - (SELECT AVG(value) FROM reading))::numeric, 2) AS vs_fleet
FROM reading
ORDER BY sat_id, ts;
```

```text
 sat_id  |          ts          | value | vs_fleet
---------+----------------------+-------+----------
 SAT-001 | 2026-03-01T00:00:00Z |    20 |    -0.83
 SAT-001 | 2026-03-01T06:00:00Z |    24 |     3.17
 SAT-001 | 2026-03-02T01:00:00Z |    30 |     9.17
 SAT-002 | 2026-03-01T00:00:00Z |    18 |    -2.83
 SAT-002 | 2026-03-01T12:00:00Z |    22 |     1.17
 SAT-003 | 2026-03-02T00:00:00Z |    11 |    -9.83
```

Check the fleet mean by hand. The sum is $20 + 24 + 30 + 18 + 22 + 11 = 125$ and there are 6 readings, so the mean is $125 / 6 \approx 20.83$. Then Aurora's first reading is $20 - 20.83 = -0.83$, a little below average, and Cirrus's is $11 - 20.83 = -9.83$, well below.

Sanity check: the differences from a mean always add to zero. $-0.83 + 3.17 + 9.17 - 2.83 + 1.17 - 9.83 = 0.02$, which is zero apart from the rounding of each value to two decimals.
:::

### When a "scalar" subquery is not one value

Two things can go wrong with the shape.

**No rows.** If the inner query finds nothing, the value is NULL. `(SELECT value FROM reading WHERE sat_id = 'SAT-004')` is NULL, because Dorado has no readings. Any comparison with it is then UNKNOWN, so a WHERE using it keeps nothing — the NULL rules from the previous module apply unchanged.

**Several rows.** If the inner query returns more than one row, PostgreSQL stops the whole statement:

```sql
SELECT name, (SELECT value FROM reading) FROM satellite;
```

```text
ERROR:  more than one row returned by a subquery used as an expression
```

::: warning SQLite quietly takes the first row
Run the same query in SQLite and there is no error. It uses the first row the inner query happens to produce and ignores the rest — here 20.0 for every satellite. The answer looks fine and is meaningless. When you write a scalar subquery for SQLite, make sure it can only return one row: use an aggregate such as MAX or COUNT, filter on a key, or add `ORDER BY … LIMIT 1` so that "first" means something you chose.
:::

::: key Scalar subquery
A subquery that returns one row and one column is a single value and can go anywhere a value can. No rows gives NULL. More than one row is an error in PostgreSQL; SQLite silently uses the first row.
:::

## Row subqueries: one row, several columns

Sometimes the thing you want to match is a pair, such as "this satellite at this time". SQL can compare whole rows at once. `(sat_id, ts)` in brackets is a **row constructor**, read "the row made of sat_id and ts". Two rows are equal when every matching pair of columns is equal.

Here is the single hottest reading in the table, found by matching its satellite and timestamp:

```sql
SELECT sat_id, ts, value
FROM reading
WHERE (sat_id, ts) = (SELECT sat_id, ts
                      FROM reading
                      ORDER BY value DESC
                      LIMIT 1);
```

```text
 sat_id  |          ts          | value
---------+----------------------+-------
 SAT-001 | 2026-03-02T01:00:00Z |    30
```

The inner query sorts hottest first and keeps one row: SAT-001 at 01:00 on 2 March. The outer query keeps the reading whose pair matches it.

Row comparisons work with `IN` too, which leads straight into table subqueries. Each satellite's latest reading is the one whose `(sat_id, ts)` pair appears in the list of "each satellite with its latest timestamp":

```sql
SELECT sat_id, ts, value
FROM reading
WHERE (sat_id, ts) IN (SELECT sat_id, MAX(ts)
                       FROM reading
                       GROUP BY sat_id)
ORDER BY sat_id;
```

```text
 sat_id  |          ts          | value
---------+----------------------+-------
 SAT-001 | 2026-03-02T01:00:00Z |    30
 SAT-002 | 2026-03-01T12:00:00Z |    22
 SAT-003 | 2026-03-02T00:00:00Z |    11
```

`MAX(ts)` works on these timestamps because they are **[[ISO-8601 text|iso-order]]**, whose alphabetical order is time order. SQLite has supported row values like these since version 3.15, so both queries run there unchanged.

## Table subqueries: a result you can use as a table

A subquery that returns many rows can be used in two main ways.

**After IN**, as a list. `sat_id IN (SELECT sat_id FROM reading)` means "satellites with at least one reading". You know this one already, and you know `NOT IN` has a NULL trap. The next lesson compares IN with EXISTS and joins properly.

**In FROM**, as a table. Put a subquery where a table name would go, give it a name with `AS`, and the outer query can select from it, join it and group it like any table. This is called a **[[derived table|derived-table]]**. The name matters: it is how the outer query refers to its columns, and older PostgreSQL versions (before 16) and many other databases refuse a derived table without one. Always give it a name.

A derived table is the natural home for "aggregate first, then do something with the aggregates" — including the fix for the fan-out trap from lesson 04.

::: example Readings per satellite, silent ones included
The operator wants every satellite with its number of readings, and a 0 for any that sent none.

```sql
SELECT s.name, COALESCE(c.n, 0) AS n_readings
FROM satellite AS s
LEFT JOIN (SELECT sat_id, COUNT(*) AS n
           FROM reading
           GROUP BY sat_id) AS c
       ON c.sat_id = s.sat_id
ORDER BY s.name;
```

```text
   name   | n_readings
----------+------------
 Aurora   |          3
 Borealis |          2
 Cirrus   |          1
 Dorado   |          0
```

Step by step. The derived table `c` groups the readings first and has three rows: SAT-001 with 3, SAT-002 with 2, SAT-003 with 1. It holds exactly one row per satellite, so joining it to `satellite` cannot fan out. The LEFT JOIN keeps Dorado, which has no match in `c`, with `c.n` NULL. COALESCE, which returns its first non-NULL argument, turns that NULL into 0.

Sanity check: $3 + 2 + 1 + 0 = 6$, the number of rows in `reading`. Any extra join added later to this query sees one row per satellite, so this total cannot be inflated.
:::

A derived table can also feed a second round of grouping. How many satellites reported each day, and what was the most readings one satellite sent that day?

```sql
SELECT day, COUNT(*) AS sats_reporting, MAX(n) AS busiest
FROM (SELECT sat_id, substr(ts, 1, 10) AS day, COUNT(*) AS n
      FROM reading
      GROUP BY sat_id, substr(ts, 1, 10)) AS per_sat_day
GROUP BY day
ORDER BY day;
```

```text
    day     | sats_reporting | busiest
------------+----------------+---------
 2026-03-01 |              2 |       2
 2026-03-02 |              2 |       1
```

The inner query makes one row per satellite per day. The outer query groups those rows again by day. Two layers of GROUP BY cannot live in one SELECT, but a derived table stacks them.

## Correlated subqueries: re-asked for every row

So far every subquery could be worked out once, on its own. Now make the inner query *look outward*.

"What was each satellite's most recent temperature?" For Aurora you would ask "Aurora's readings, newest first, top one". For Borealis the same question with Borealis. The inner question is the same shape each time, with the outer row filled in:

```sql
SELECT s.name,
       (SELECT r.value
        FROM reading AS r
        WHERE r.sat_id = s.sat_id
        ORDER BY r.ts DESC
        LIMIT 1) AS last_temp
FROM satellite AS s
ORDER BY s.name;
```

```text
   name   | last_temp
----------+-----------
 Aurora   |        30
 Borealis |        22
 Cirrus   |        11
 Dorado   |    [NULL]
```

Look at `r.sat_id = s.sat_id`. The `r` belongs to the inner query, but `s` belongs to the outer one. Read it as "readings whose satellite is the satellite on the current outer row". A subquery that refers to a column of the outer query is a **correlated subquery** ("correlated" means "tied to": its answer depends on which outer row you are on). Logically, the database runs it once per outer row, with that row's values plugged in, like a **[[loop|correlated-loop]]**.

This is why the table aliases matter so much here. Leave off the prefixes and write `sat_id = sat_id`, and there is no error: a bare column name is looked up in the nearest query first, so both sides mean the inner reading's own `sat_id`. The condition compares each reading with itself, is true for every row, and every satellite gets the fleet's newest reading.

Dorado's inner query finds no rows, so its scalar result is NULL, which is honest: there is no latest reading.

::: example Readings above their own satellite's average
The thermal team wants readings that ran hot *for that satellite* — above that satellite's own mean, not the fleet's.

```sql
SELECT r.sat_id, r.ts, r.value
FROM reading AS r
WHERE r.value > (SELECT AVG(r2.value)
                 FROM reading AS r2
                 WHERE r2.sat_id = r.sat_id)
ORDER BY r.sat_id;
```

```text
 sat_id  |          ts          | value
---------+----------------------+-------
 SAT-001 | 2026-03-02T01:00:00Z |    30
 SAT-002 | 2026-03-01T12:00:00Z |    22
```

The same table appears twice, so the two copies get different names: `r` for the outer row being tested, `r2` for the inner rows being averaged.

Work through it. For each of Aurora's rows the inner average is $(20 + 24 + 30) / 3 \approx 24.67$; only 30 is above it. For Borealis the average is $(18 + 22) / 2 = 20$; only 22 is above it. Cirrus's only reading equals its own average of 11, and 11 is not greater than 11, so it is dropped.

Sanity check: a satellite's readings cannot all be above its own mean, so each satellite must lose at least one row. Aurora kept 1 of 3, Borealis 1 of 2, Cirrus 0 of 1.
:::

### What a correlated subquery costs

"Once per outer row" is the logical meaning. Taken literally it can be expensive. PostgreSQL's **[[EXPLAIN|explain-word]]** command prints the plan it will use without running the query. For the query above:

```text
 Seq Scan on reading r
   Filter: (value > (SubPlan 1))
   SubPlan 1
     ->  Aggregate
           ->  Seq Scan on reading r2
                 Filter: (sat_id = r.sat_id)
```

(That is the output of `EXPLAIN (COSTS OFF)` followed by the query; `COSTS OFF` hides the planner's cost estimates.) A **Seq Scan** is a read of every row of a table. The plan says: read the readings one by one, and for each one run **SubPlan 1**, which reads the whole table again to average one satellite. With 6 readings that is $6 + 6 \times 6 = 42$ row reads. With a million readings it would be about a million million.

The same question can be written so the averages are computed once, in a derived table, and then joined:

```sql
SELECT r.sat_id, r.ts, r.value
FROM reading AS r
JOIN (SELECT sat_id, AVG(value) AS mean_temp
      FROM reading
      GROUP BY sat_id) AS m ON m.sat_id = r.sat_id
WHERE r.value > m.mean_temp;
```

It returns the same two rows, and its plan reads the table twice in total — once to build the averages, once to test each reading:

```text
 Hash Join
   Hash Cond: (r.sat_id = reading.sat_id)
   Join Filter: (r.value > (avg(reading.value)))
   ->  Seq Scan on reading r
   ->  Hash
         ->  HashAggregate
               Group Key: reading.sat_id
               ->  Seq Scan on reading
```

Modern planners do this kind of rewriting for you surprisingly often. PostgreSQL turns most EXISTS and IN subqueries into joins by itself, as the next lesson shows. But it did not rewrite this one, and no database promises to. An **[[index|index-help]]** on `reading(sat_id)` would also help the SubPlan, by letting each inner query read only one satellite's rows.

::: key What does a correlated subquery cost?
Logically it re-evaluates per outer row; planners often rewrite it as a join or a semi-join, but not always. If a correlated subquery is in a hot path, check the plan and consider rewriting it explicitly.
:::

## A median in SQLite

Lesson 05 promised a way to get a median in SQLite, which has no PERCENTILE_CONT. Scalar subqueries make it possible, because `LIMIT` and `OFFSET` accept any expression that gives a single number.

::: example The median of the bus temperatures, without PERCENTILE_CONT
The idea: sort the values, **[[skip to the middle|median-picture]]**, and average the one or two values found there.

```sql
SELECT AVG(value) AS median
FROM (SELECT value
      FROM reading
      WHERE channel = 'BUS_TEMP'
      ORDER BY value
      LIMIT  2 - (SELECT COUNT(*) FROM reading WHERE channel = 'BUS_TEMP') % 2
      OFFSET ((SELECT COUNT(*) FROM reading WHERE channel = 'BUS_TEMP') - 1) / 2) AS middle;
```

```text
 median
--------
     21
```

Work through it with $n = 6$. The `%` sign is the remainder after division, read "mod": $6 \bmod 2 = 0$, so `LIMIT` is $2 - 0 = 2$ — an even count has two middle values. `OFFSET` is $(6 - 1) / 2$; both numbers are whole, so SQL does **[[whole-number division|integer-division]]** and drops the fraction: $5 / 2 = 2$. Skip 2 of the sorted values 11, 18, 20, 22, 24, 30, take the next 2, which are 20 and 22, and average them: 21.

For an odd count, say Aurora's three readings: $3 \bmod 2 = 1$ so `LIMIT` is 1, and `OFFSET` is $(3 - 1) / 2 = 1$. Skip 20, take 24. The median is 24.

Sanity check: both answers match PERCENTILE_CONT(0.5) from lesson 05. The same query runs in PostgreSQL and SQLite. It computes one median for one group; a per-group median in SQLite needs the window functions of the next module.
:::

## When nesting gets hard to read

Subqueries nest. A derived table can contain a subquery in its WHERE, which contains another. Each level is correct on its own, but the whole thing reads inside-out: to follow it you start at the deepest bracket and work outwards, holding every layer in your head. Two lessons from now, common table expressions let you pull each step out, give it a name, and write the steps top to bottom in the order you think them.

## Check yourself

::: check
Label each subquery as scalar, row or table, and say whether it is correlated:
(a) `WHERE launched = (SELECT MIN(launched) FROM satellite)`
(b) `FROM (SELECT plane, COUNT(*) AS n FROM satellite GROUP BY plane) AS p`
(c) `WHERE (sat_id, ts) = (SELECT sat_id, MAX(ts) FROM reading WHERE sat_id = 'SAT-002' GROUP BY sat_id)`
(d) `SELECT s.name, (SELECT COUNT(*) FROM reading r WHERE r.sat_id = s.sat_id) FROM satellite s`
:::

::: answer
(a) Scalar, not correlated: one value, the earliest launch date, worked out once. It returns Aurora and Borealis, both launched 2025-06-01.

(b) Table, not correlated: a derived table with one row per plane.

(c) Row, not correlated: one row with two columns, compared with the row constructor `(sat_id, ts)`. It matches Borealis's reading at 12:00 on 1 March.

(d) Scalar and correlated: `s.sat_id` comes from the outer query, so the count is re-asked for each satellite. It gives Aurora 3, Borealis 2, Cirrus 1 and Dorado 0 — COUNT of no rows is 0, not NULL, because COUNT always returns a number.
:::

::: check
Write a query listing the most recently launched satellite in each plane, using a correlated subquery.
:::

::: answer
```sql
SELECT name, plane
FROM satellite AS s
WHERE launched = (SELECT MAX(launched)
                  FROM satellite AS s2
                  WHERE s2.plane = s.plane)
ORDER BY plane;
```

For plane 1 the inner MAX is 2025-06-01, and both Aurora and Borealis have it, so both are listed — a tie. For plane 2 it is 2026-01-20, which is Dorado. The two copies of `satellite` need different names (`s` and `s2`) so the inner query can say which plane it means.
:::

::: check
A query runs in SQLite and returns a sensible-looking number for every satellite, but crashes in PostgreSQL with "more than one row returned by a subquery used as an expression". What is wrong, and which result was right?
:::

::: answer
A subquery used as a single value returns several rows. PostgreSQL refuses; SQLite silently used the first row it produced. Neither result was right: the SQLite numbers depend on the order rows happened to come out, which nobody chose. Fix the subquery so it returns one row by design — aggregate it, filter it down to a key, or add `ORDER BY … LIMIT 1` with an order that means something, such as newest first.
:::

::: check
A correlated subquery computes each reading's satellite average, on a table of 2 million readings from 1,000 satellites, with no index. Roughly how many row reads does the literal "once per outer row" plan need, and how many does the derived-table rewrite need?
:::

::: answer
Literal plan: one pass over the 2 million outer rows, and for each one a full pass over 2 million rows to average. That is about $2 \times 10^6 \times 2 \times 10^6 = 4 \times 10^{12}$ row reads — far too many. The derived-table version reads the table once to compute 1,000 averages and once more to test each reading: about $4 \times 10^6$ row reads, a million times fewer. That is why you check the plan of a correlated subquery on a big table.
:::

::: check
Use the median recipe to find Borealis's median bus temperature (readings 18 and 22). Show the LIMIT and OFFSET values.
:::

::: answer
$n = 2$. `LIMIT` is $2 - (2 \bmod 2) = 2 - 0 = 2$. `OFFSET` is $(2 - 1) / 2$, which in whole-number division is 0. So skip nothing, take both values 18 and 22, and average them: $(18 + 22) / 2 = 20$. In the recipe, change the channel condition in all three places to `sat_id = 'SAT-002' AND channel = 'BUS_TEMP'`.
:::

## Summary

| Kind | Returns | Where it goes | Example |
| --- | --- | --- | --- |
| Scalar | one row, one column | anywhere a value goes | `value > (SELECT AVG(value) FROM reading)` |
| Row | one row, several columns | compared with a row constructor | `(sat_id, ts) = (SELECT …)` |
| Table | many rows | after IN / EXISTS, or in FROM as a named derived table | `FROM (SELECT …) AS c` |
| Correlated | any of the above | refers to the outer row | `WHERE r2.sat_id = r.sat_id` |
| Empty scalar | NULL | — | Dorado's latest reading |
| Too many rows | error in PostgreSQL; first row in SQLite | — | guard with an aggregate or LIMIT 1 |

Next lesson takes the most common correlated subquery of all — "is there any matching row?" — and compares EXISTS, IN and a plain JOIN for asking it. Then it turns the question around to find satellites that sent nothing in a time window, and shows why NOT EXISTS, not NOT IN, is the tool for that.

::: context result-shapes Three shapes of result
Every query returns a grid. What you can do with a subquery depends only on the grid's shape.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="40" width="40" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <g fill="#f2b880" stroke="#1f2a44">
    <rect x="130" y="40" width="40" height="24"/><rect x="170" y="40" width="40" height="24"/>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44">
    <rect x="260" y="30" width="40" height="20"/><rect x="300" y="30" width="40" height="20"/>
    <rect x="260" y="50" width="40" height="20"/><rect x="300" y="50" width="40" height="20"/>
    <rect x="260" y="70" width="40" height="20"/><rect x="300" y="70" width="40" height="20"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="110">scalar</text><text x="60" y="128">1 × 1</text>
    <text x="170" y="110">row</text><text x="170" y="128">1 × many</text>
    <text x="300" y="110">table</text><text x="300" y="128">many × any</text>
  </g>
</svg>
```

A table subquery with one column is the kind IN needs; one with several columns can go after IN with a row constructor, or in FROM.
:::

::: context iso-order Why ISO timestamps sort correctly as text
ISO-8601 writes a time from the biggest unit to the smallest, each padded to a fixed width: year, month, day, `T`, hours, minutes, seconds, and `Z` for UTC. Comparing two such strings character by character therefore compares the years first, then the months, and so on — exactly time order.

It only works if every value uses the same format and the same zone. Mix `2026-03-02T01:00:00Z` with `2026-3-2 1:00` and alphabetical order stops meaning anything. That is one reason the previous module stored time as proper timestamp types in PostgreSQL.
:::

::: context derived-table Why it is called a derived table
The table is not stored anywhere. It exists only while the query runs, derived from other tables by the SELECT inside the brackets. A view, from the previous module, is the same idea with a name saved in the database so you can reuse it.

You may also hear "inline view" for the same thing, especially from people who learned SQL on Oracle.
:::

::: context correlated-loop A loop in disguise
If you have written a `for` loop, a correlated subquery is one: for each outer row, run the inner query with that row's values filled in.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="22" font-weight="700">outer: satellite s</text>
    <text x="210" y="22" font-weight="700">inner: reading r</text>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44">
    <rect x="20" y="32" width="120" height="24"/><rect x="20" y="60" width="120" height="24"/>
    <rect x="20" y="88" width="120" height="24"/><rect x="20" y="116" width="120" height="24"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="30" y="49">Aurora</text><text x="30" y="77">Borealis</text>
    <text x="30" y="105">Cirrus</text><text x="30" y="133">Dorado</text>
  </g>
  <rect x="210" y="46" width="130" height="52" fill="#f2b880" stroke="#1f2a44"/>
  <text x="275" y="68" font-size="11" fill="#1f2a44" text-anchor="middle">WHERE r.sat_id =</text>
  <text x="275" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">s.sat_id → newest</text>
  <line x1="140" y1="44" x2="208" y2="60" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="140" y1="72" x2="208" y2="66" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="140" y1="100" x2="208" y2="78" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="140" y1="128" x2="208" y2="88" stroke="#b4232c" stroke-width="1.5"/>
  <text x="275" y="130" font-size="11" fill="#1f2a44" text-anchor="middle">runs 4 times: 30, 22, 11, NULL</text>
</svg>
```

The planner is free to run it some cleverer way, as long as the answer is the same as this picture's.
:::

::: context explain-word Asking the database how it will work
`EXPLAIN` followed by a query prints the **plan** — the steps the database has chosen — without running it. `EXPLAIN ANALYZE` runs it too and adds the real times and row counts.

Plans read from the most indented line outwards: the innermost steps feed the ones above them. You do not need to understand every word yet. For a correlated subquery, look for **SubPlan**: it means "run this part again for each row". Seeing a SubPlan under a big Seq Scan in a slow telemetry query is often the whole diagnosis.
:::

::: context index-help What an index does for a correlated subquery
An **index** is a sorted lookup structure kept beside a table, like the index at the back of a book. With an index on `reading(sat_id)`, the inner query "readings of this satellite" jumps straight to that satellite's rows instead of reading the whole table.

That turns the SubPlan's cost from "the whole table, per outer row" into "one satellite's rows, per outer row". It is still repeated work, but often small enough not to matter. The schema-design module later in this track shows how to build them and read their plans.
:::

::: context median-picture Skip, then take
With six sorted values, OFFSET 2 skips the first two and LIMIT 2 takes the next two. Their average is the median.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44">
    <rect x="30" y="30" width="50" height="30" fill="#ffffff"/><rect x="80" y="30" width="50" height="30" fill="#ffffff"/>
    <rect x="130" y="30" width="50" height="30" fill="#f2b880"/><rect x="180" y="30" width="50" height="30" fill="#f2b880"/>
    <rect x="230" y="30" width="50" height="30" fill="#ffffff"/><rect x="280" y="30" width="50" height="30" fill="#ffffff"/>
  </g>
  <g font-size="13" fill="#1f2a44" text-anchor="middle">
    <text x="55" y="50">11</text><text x="105" y="50">18</text><text x="155" y="50">20</text>
    <text x="205" y="50">22</text><text x="255" y="50">24</text><text x="305" y="50">30</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="80" y="20">OFFSET 2: skip</text><text x="180" y="20">LIMIT 2: take</text>
  </g>
  <text x="180" y="88" font-size="12" fill="#b4232c" text-anchor="middle">(20 + 22) / 2 = 21</text>
</svg>
```

With seven values it would be OFFSET 3 and LIMIT 1: skip three, take the single middle one.
:::

::: context integer-division Whole-number division
When both numbers are whole (integers), PostgreSQL and SQLite divide the way you did before learning decimals: how many whole times does it go, throw the remainder away. So $5 / 2$ is 2, and $7 / 2$ is 3. Write $5.0 / 2$ and you get 2.5.

Usually this is a trap — an average computed as `SUM(n) / COUNT(*)` on integer columns silently loses its fraction. In the median recipe it is exactly what is wanted, because an OFFSET must be a whole number of rows.
:::
