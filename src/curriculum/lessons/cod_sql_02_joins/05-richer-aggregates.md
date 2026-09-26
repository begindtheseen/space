---
id: l05-richer-aggregates
title: Lists, percentiles and conditional aggregates
minutes: 23
covers:
  - STRING_AGG and ARRAY_AGG; PERCENTILE_CONT
  - FILTER (WHERE ...) for conditional aggregation
---

So far every aggregate you have used squeezes a group of rows down to one plain number: a count, a sum, an average, a smallest or a largest. That answers a lot of questions. But an operator looking at a fleet summary often wants a little more in each row. Which satellites are in plane 1, written out by name? What were Aurora's temperatures, in order? What is the *typical* temperature, not dragged around by one wild reading? And how many readings were warm, next to how many there were in total?

This lesson adds three tools that answer those in the same `GROUP BY` query you already know. **STRING_AGG** and **ARRAY_AGG** turn a group into a list. **PERCENTILE_CONT** finds the middle of a group, or any other point along it. And **FILTER (WHERE …)** lets one aggregate look at only some of the group's rows while the others look at all of them.

You will use the same two tables as the rest of the module: `satellite` (four spacecraft, Aurora, Borealis, Cirrus and Dorado, in two orbital planes) and `reading` (six bus-temperature samples, in degrees Celsius, spread over 1 and 2 March 2026). Dorado has no readings at all. Every query here was run on PostgreSQL 16, and each section says what changes in SQLite, where the module's exercises run.

## STRING_AGG: a group written out as one line of text

Picture a teacher taking attendance and writing every name present on one line of the board, with commas between them. That is what **STRING_AGG** does. It is an aggregate, so it takes all the rows in a group and gives back one value — but the value is a piece of text that strings the group's values together. Read it aloud as "string ag", short for "string aggregate". (A **string** is programmers' word for a piece of text.)

It takes two arguments: the value to collect, and the **separator** — the text to put between neighbours.

```sql
SELECT plane,
       STRING_AGG(name, ', ' ORDER BY name) AS names
FROM satellite
GROUP BY plane
ORDER BY plane;
```

```text
 plane |      names
-------+------------------
     1 | Aurora, Borealis
     2 | Cirrus, Dorado
```

Two rows came out, one per plane, exactly as with `COUNT(*)`. The only difference is what each group turned into.

Notice the `ORDER BY name` *inside* the brackets. That orders the items within each list. It has nothing to do with the `ORDER BY plane` at the bottom, which orders the output rows. Without the inner one, the database may join the names in whatever order it happened to read them, and that order can change from one run to the next.

Two more things fit inside the brackets. `DISTINCT` drops repeats before joining, so `STRING_AGG(DISTINCT substr(ts, 1, 10), ',' ORDER BY substr(ts, 1, 10))` over the readings gives `2026-03-01,2026-03-02` — each day once, not six dates. And the value must be text: STRING_AGG in PostgreSQL will not join numbers until you cast them, as in `value::text` (read "value cast to text", the shorthand you met with CAST in the previous module).

::: example Each satellite's temperature history on one line
An operator wants one row per satellite showing its bus temperatures in time order, with an arrow between them, plus how many there were.

```sql
SELECT s.name,
       STRING_AGG(r.value::text, ' -> ' ORDER BY r.ts) AS history,
       COUNT(*) AS n
FROM reading AS r
JOIN satellite AS s ON s.sat_id = r.sat_id
WHERE r.channel = 'BUS_TEMP'
GROUP BY s.name
ORDER BY s.name;
```

```text
   name   |    history     | n
----------+----------------+---
 Aurora   | 20 -> 24 -> 30 | 3
 Borealis | 18 -> 22       | 2
 Cirrus   | 11             | 1
```

Walk through Aurora. The join gives three rows for it. `ORDER BY r.ts` puts them in time order: midnight on 1 March (20), 06:00 on 1 March (24), 01:00 on 2 March (30). STRING_AGG writes the three values with `' -> '` between each pair. There are two gaps between three items, so two arrows.

Sanity check: the number of values in each history matches `n`. Cirrus has one value and no arrow, because a one-item list has no neighbours to separate. Dorado is missing because the inner join drops a satellite with no readings — which is what you want here.
:::

::: warning Lists are for people to read, not for further computing
A comma-joined string is the end of the line for data. You cannot average it, and splitting it back apart is slow and fragile. Build lists at the very last step, for a report or a log message. Keep the rows themselves as rows.
:::

### STRING_AGG in SQLite

SQLite's long-standing name for this is **group_concat**: `group_concat(name, ', ')`. It works in every version. SQLite 3.44 (from late 2023) added `string_agg` as another name for the same thing, and also allowed `ORDER BY` inside an aggregate's brackets: `group_concat(name, ', ' ORDER BY name)`. In an older SQLite you cannot order the items inside the call at all, so the list comes out in whatever order the rows arrive. SQLite does not need the `::text` cast, because it turns numbers into text by itself.

## ARRAY_AGG: a list the database can still use

An **array** is a numbered list stored inside a single value: a row of boxes, each holding one item, with the positions counted 1, 2, 3 in PostgreSQL. **ARRAY_AGG** ("array ag") collects a group into one.

```sql
SELECT sat_id,
       ARRAY_AGG(value ORDER BY ts) AS temps
FROM reading
GROUP BY sat_id
ORDER BY sat_id;
```

```text
 sat_id  |   temps
---------+------------
 SAT-001 | {20,24,30}
 SAT-002 | {18,22}
 SAT-003 | {11}
```

PostgreSQL prints an array between curly braces. It looks like STRING_AGG's output, but it is not text: the database still knows these are three numbers, in order. You can ask for one box by its position with square brackets. A neat trick follows. Sort the list newest first and take box 1, and you get each satellite's latest reading:

```sql
SELECT sat_id,
       (ARRAY_AGG(value ORDER BY ts DESC))[1] AS latest
FROM reading
GROUP BY sat_id
ORDER BY sat_id;
```

```text
 sat_id  | latest
---------+--------
 SAT-001 |     30
 SAT-002 |     22
 SAT-003 |     11
```

(The extra brackets around the ARRAY_AGG call are needed so that `[1]` applies to the finished array.)

SQLite has no array type. Its nearest match is **json_group_array**, which builds a list in **[[JSON|json-lists]]** text form: `json_group_array(value)` gives `[20.0,24.0,30.0]` for Aurora. It is text, so the same warning as for STRING_AGG applies.

::: key STRING_AGG and ARRAY_AGG
`STRING_AGG(expr, separator ORDER BY …)` joins a group's values into one text value; `ARRAY_AGG(expr ORDER BY …)` collects them into one **[[array|array-picture]]** value. The `ORDER BY` inside the brackets orders the items in each list; without it the order is not promised. In SQLite use `group_concat(expr, separator)` (or `string_agg` from 3.44) and `json_group_array(expr)`.
:::

## Percentiles: the middle, and other points along the line

Line up seven students by height, shortest to tallest. The one standing fourth — with three on each side — is the **median**: the middle value once everything is sorted. Half the group is at or below it and half at or above it.

Why would you want the median when you already have `AVG`? Because the average listens to every value equally, including a wild one. A median only cares about order, so a single wild value can move it by at most one place in the line.

A **percentile** generalises the median. The **[[90th percentile|p-numbers]]** is the value that 90 percent of the group sits at or below. The median is the 50th percentile. Engineers usually write percentiles as fractions from 0 to 1, so the median is 0.5 and the 90th percentile is 0.9.

PostgreSQL computes one with **PERCENTILE_CONT**, where CONT is short for "continuous". The way you write it is new:

```sql
SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) AS median,
       PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY value) AS p90,
       AVG(value) AS mean
FROM reading
WHERE channel = 'BUS_TEMP';
```

```text
 median | p90 |        mean
--------+-----+--------------------
     21 |  27 | 20.833333333333332
```

Read `PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value)` aloud as "the 0.5 percentile, within the group sorted by value". The fraction goes in the first brackets. The `WITHIN GROUP (ORDER BY …)` part says which column to line the rows up by. It is required, because a percentile means nothing until the values are in order. Aggregates written this way are called **[[ordered-set aggregates|ordered-set]]**.

### How the in-between value is found

There are six temperatures. Sorted, they are 11, 18, 20, 22, 24, 30. There is no single middle one: 20 and 22 share the middle. So which is the median?

PERCENTILE_CONT treats the sorted values as points on a line and **[[interpolates|interpolation-picture]]** — it reads off a value partway between two neighbours. Here is the rule. Number the sorted values from position 0 to position $n - 1$, where $n$ is how many there are. The percentile $p$ sits at position

$$
\text{position} = p \times (n - 1).
$$

For the median of six values: $0.5 \times (6 - 1) = 2.5$. Position 2 holds 20 and position 3 holds 22. Position 2.5 is halfway between them, so the median is $20 + 0.5 \times (22 - 20) = 21$.

For the 90th percentile: $0.9 \times 5 = 4.5$. Position 4 holds 24 and position 5 holds 30, so the answer is $24 + 0.5 \times (30 - 24) = 27$. Both match the output.

PostgreSQL has a sister function, **PERCENTILE_DISC** ("discrete"), that never blends. It returns an actual value from the group: the first one, going up the sorted list, at which at least a fraction $p$ of the values have been passed. For the median of these six that is the third value, 20. Use DISC when the answer must be a value that really occurred, such as a mode setting; use CONT for measurements.

To get several percentiles in one go, pass an **array** of fractions and you get an array back: `PERCENTILE_CONT(ARRAY[0.1, 0.5, 0.9]) WITHIN GROUP (ORDER BY value)` returns `{14.5,21,27}`.

::: key PERCENTILE_CONT
`PERCENTILE_CONT(p) WITHIN GROUP (ORDER BY col)` returns the value below which a fraction `p` of the group lies, interpolating between neighbours at position $p \times (n - 1)$ of the sorted values (counting from 0). `PERCENTILE_CONT(0.5)` is the median. `PERCENTILE_DISC(p)` returns an actual member of the group instead.
:::

::: example One glitch, two summaries
Suppose Aurora sent seven bus temperatures on a later day: 20, 21, 21, 22, 23, 24 and 180 °C. The 180 is a glitch — a corrupted frame, not a fire. Compare the mean and the median. (`FROM (VALUES …) AS t(v)` builds a throwaway one-column table named `t` with a column `v`, so you can try this without inserting anything.)

```sql
SELECT AVG(v) AS mean,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY v) AS median
FROM (VALUES (20.0), (21.0), (21.0), (22.0), (23.0), (24.0), (180.0)) AS t(v);
```

```text
        mean         | median
---------------------+--------
 44.4285714285714286 |     22
```

By hand, the mean first. The sum is $20 + 21 + 21 + 22 + 23 + 24 + 180 = 311$, and $311 / 7 \approx 44.4$ °C.

Now the median. There are $n = 7$ values, already sorted. The position is $0.5 \times (7 - 1) = 3$, a whole number, so no blending is needed. Counting from 0, position 3 holds 22.

The mean says the bus ran at about 44 °C, more than twice what any real sample shows. The median says 22 °C, right in the middle of the six honest readings. Sanity check: replace 180 with 25 and the median is still 22, because 25 is still the largest value, but the mean drops to about 22.3. The median did not care how wrong the glitch was, only which end of the line it sat at.
:::

### Percentiles in SQLite

Standard SQLite builds have no PERCENTILE_CONT, PERCENTILE_DISC or median function. (There is an optional percentile extension, but the browser build the exercises use does not include it.) You have three honest options: compute the percentile afterwards in Python, sort and pick the middle rows with `ORDER BY`, `LIMIT` and `OFFSET` — lesson 07 builds exactly that median from subqueries — or use the window functions of the next module.

::: warning A median of medians is not the median
Per-satellite medians cannot be combined into a fleet median, and per-day p90s cannot be averaged into a weekly p90. A percentile depends on every value in the group. To get the fleet's median, run PERCENTILE_CONT over all the fleet's rows. (Averages have the same problem unless you weight them by count; the next lesson meets it again with subtotals.)
:::

## FILTER: an aggregate that only looks at some rows

Picture a traffic survey. You stand by a road with two clicker counters. Every car that passes, you click the left one. Only red cars, you also click the right one. At the end you have the total and the red count from one watch of the road, not two.

That is **conditional aggregation**: computing several aggregates in the same pass, each over its own subset of the group's rows. SQL writes the "only red cars" part as a **FILTER** clause after the aggregate:

```sql
COUNT(*) FILTER (WHERE r.value > 21)
```

Read it as "count the rows, keeping only those where the value is above 21". The condition inside `FILTER (WHERE …)` decides which of the group's rows *this one aggregate* sees. The other aggregates in the same SELECT are not affected.

That is the difference from the query's own `WHERE`. The main `WHERE` throws rows away before grouping, so every aggregate loses them. A FILTER only hides rows from the aggregate it is attached to.

FILTER goes on any ordinary aggregate: COUNT, SUM, AVG, MIN, MAX, and also STRING_AGG and ARRAY_AGG. When no rows in a group pass the filter, the aggregate gives the same answer it gives for an empty group: `COUNT` gives 0, while `SUM`, `AVG`, `MIN` and `MAX` give NULL.

::: example A per-satellite scorecard in one pass
The thermal team wants, for every satellite including silent ones: how many readings it sent, how many were warm (above 21 °C), and its mean temperature on each of the two days, side by side.

```sql
SELECT s.name,
       COUNT(r.value)                                  AS n,
       COUNT(*)     FILTER (WHERE r.value > 21)        AS n_warm,
       AVG(r.value) FILTER (WHERE r.ts <  '2026-03-02') AS mean_d1,
       AVG(r.value) FILTER (WHERE r.ts >= '2026-03-02') AS mean_d2
FROM satellite AS s
LEFT JOIN reading AS r ON r.sat_id = s.sat_id
GROUP BY s.name
ORDER BY s.name;
```

```text
   name   | n | n_warm | mean_d1 | mean_d2
----------+---+--------+---------+---------
 Aurora   | 3 |      2 |      22 |      30
 Borealis | 2 |      1 |      20 |  [NULL]
 Cirrus   | 1 |      0 |  [NULL] |      11
 Dorado   | 0 |      0 |  [NULL] |  [NULL]
```

(Missing values print as `[NULL]` here, as in the previous module.)

Check Aurora by hand. Its three readings are 20, 24 and 30. Two are above 21, so `n_warm` is 2. Before 2 March there are 20 and 24, with mean $(20 + 24) / 2 = 22$. On or after 2 March there is only 30, so `mean_d2` is 30.

Borealis sent 18 and 22, both on 1 March. One is above 21. Its day-one mean is $(18 + 22) / 2 = 20$, and nothing passes the day-two filter, so that AVG is NULL — "no data", which is honest.

Dorado is kept by the LEFT JOIN as one row with every reading column NULL. `COUNT(r.value)` skips that NULL and gives 0. A NULL value is not above 21, so `n_warm` is 0 as well.

Turning one column of values into several columns, one per day, is called a **[[pivot|pivot-word]]**, and FILTER is the cleanest way to write one. Sanity check: the day means use disjoint sets of rows (before and on-or-after the same instant), so no reading was counted twice.
:::

### The older idiom: CASE inside the aggregate

FILTER arrived in the SQL standard in 2003, and plenty of code predates it or runs on databases without it. You will read the same idea written with the CASE expression from the previous module:

```sql
SUM(CASE WHEN r.value > 21 THEN 1 ELSE 0 END)             -- warm count
COUNT(CASE WHEN r.value > 21 THEN 1 END)                  -- warm count
AVG(CASE WHEN r.ts < '2026-03-02' THEN r.value END)       -- day-one mean
```

All three give the same numbers as the FILTER versions above. The second and third lean on a fact you already know: a CASE with no matching WHEN and no ELSE produces NULL, and COUNT(col) and AVG skip NULLs.

::: warning ELSE 0 inside AVG changes the answer
`AVG(CASE WHEN r.ts < '2026-03-02' THEN r.value ELSE 0 END)` looks harmless, but every row outside the condition now counts as a reading of 0 °C. For Aurora it returns $(20 + 24 + 0) / 3 \approx 14.7$ instead of 22, and for silent Dorado it reports 0 °C instead of NULL. ELSE 0 is right inside a SUM that counts; for AVG, MIN and MAX leave the ELSE out, or use FILTER, which cannot make this mistake.
:::

::: key FILTER (WHERE ...)
Conditional aggregation in one pass: count the critical rows and the total in the same query without a CASE inside SUM. It is clearer than the CASE idiom and lets the planner do one **[[scan|one-scan]]**. Example: `COUNT(*) FILTER (WHERE value > 21)` next to `COUNT(*)`.
:::

### FILTER in SQLite

SQLite has understood FILTER on aggregate functions since version 3.30 (2019), so every query in this section runs there unchanged, apart from STRING_AGG and ARRAY_AGG, which need the SQLite names above. If you are ever stuck on an older engine, the CASE forms work everywhere.

## Check yourself

::: check
Write a query that returns one row per orbital plane with the plane number and a list of the `sat_id`s in it, sorted and separated by semicolons. Give a PostgreSQL version and one for an older SQLite.
:::

::: answer
PostgreSQL (and SQLite 3.44 or later):

```sql
SELECT plane, STRING_AGG(sat_id, ';' ORDER BY sat_id) AS sats
FROM satellite
GROUP BY plane
ORDER BY plane;
```

This gives `1 | SAT-001;SAT-002` and `2 | SAT-003;SAT-004`. In an older SQLite write `group_concat(sat_id, ';')`. That version cannot sort inside the call, so the order of the ids within each list is not promised. `sat_id` is already text, so no cast is needed.
:::

::: check
A channel has eleven samples which, sorted, are 3, 4, 4, 5, 5, 6, 6, 7, 8, 9 and 40. Find PERCENTILE_CONT(0.5) and PERCENTILE_CONT(0.25) by hand, and compare the median with the mean.
:::

::: answer
There are $n = 11$ values, at positions 0 to 10.

Median: $0.5 \times 10 = 5$. Position 5 (the sixth value) is 6, so the median is 6.

Lower quartile: $0.25 \times 10 = 2.5$, halfway between position 2 (4) and position 3 (5): $4 + 0.5 \times (5 - 4) = 4.5$.

The sum is 97, so the mean is $97 / 11 \approx 8.8$. The single 40 drags the mean up to 8.8, higher than all but two of the eleven samples, while the median of 6 sits in the middle of the ordinary values.
:::

::: check
What is the difference between these two queries' results?

```sql
-- A
SELECT sat_id, COUNT(*) FROM reading WHERE value > 21 GROUP BY sat_id;
-- B
SELECT sat_id, COUNT(*) FILTER (WHERE value > 21) FROM reading GROUP BY sat_id;
```
:::

::: answer
Query A's WHERE removes the cool readings before grouping. Cirrus's only reading is 11, so Cirrus has no rows left and vanishes: A returns SAT-001 with 2 and SAT-002 with 1. Query B keeps every row for grouping and only hides the cool ones from the count, so Cirrus survives with a count of 0: B returns SAT-001 2, SAT-002 1, SAT-003 0. Use B when a zero is an answer you want to see.
:::

::: check
A dashboard computes the day-two mean per satellite as `AVG(CASE WHEN ts >= '2026-03-02' THEN value ELSE NULL END)`. A reviewer wants it "tidied" to `ELSE 0`. What happens to Borealis and Cirrus?
:::

::: answer
With `ELSE NULL` (or no ELSE), AVG sees only the day-two values. Borealis has none, so it gets NULL; Cirrus has 11, so it gets 11. With `ELSE 0`, every day-one reading becomes a zero that AVG counts. Borealis becomes $(0 + 0)/2 = 0$ °C, a satellite apparently frozen when it did not report that day. Cirrus has no day-one readings, so it stays at 11. Keep the NULL, or write `AVG(value) FILTER (WHERE ts >= '2026-03-02')`.
:::

::: check
Write one query that returns, for the whole reading table, the total number of rows, the number of BUS_TEMP rows above 25 °C, and the list of satellites that had such a reading, in id order.
:::

::: answer
```sql
SELECT COUNT(*) AS n_all,
       COUNT(*) FILTER (WHERE channel = 'BUS_TEMP' AND value > 25) AS n_hot,
       STRING_AGG(sat_id, ',' ORDER BY sat_id)
         FILTER (WHERE channel = 'BUS_TEMP' AND value > 25) AS hot_sats
FROM reading;
```

It returns 6, 1 and `SAT-001`: only Aurora's 30 °C reading is above 25. FILTER works on STRING_AGG like any other aggregate. With no GROUP BY, the whole table is one group, so one row comes out.
:::

## Summary

| Tool | What it returns | SQLite |
| --- | --- | --- |
| `STRING_AGG(x, sep ORDER BY …)` | the group's values joined into one text | `group_concat(x, sep)`; `string_agg` from 3.44 |
| `ARRAY_AGG(x ORDER BY …)` | the values as one array; `(…)[1]` picks box 1 | none; `json_group_array(x)` gives JSON text |
| `PERCENTILE_CONT(p) WITHIN GROUP (ORDER BY x)` | value at position $p \times (n-1)$, interpolated | none; compute elsewhere or by subquery |
| `PERCENTILE_DISC(p) …` | an actual value from the group | none |
| `agg FILTER (WHERE cond)` | that aggregate over only the rows passing `cond` | yes, 3.30+ |
| `COUNT(CASE WHEN c THEN 1 END)` | the older idiom for the same thing | yes |

Every aggregate so far has worked at one level of grouping at a time. Next lesson asks for several levels in one result — each satellite, each plane's subtotal, and a fleet grand total — with GROUPING SETS, ROLLUP and CUBE.

::: context json-lists JSON, the text format for lists
**JSON** (say "JAY-son") stands for JavaScript Object Notation. It is a plain-text way of writing lists and labelled values that almost every programming language can read: a list goes in square brackets, `[20.0,24.0,30.0]`, and labelled values in curly braces, `{"sat_id": "SAT-001", "temp": 20.0}`.

It is the everyday format for web services and for many ground-software configuration files, which is why SQLite chose it as its stand-in for arrays. SQLite has functions such as `json_extract` to reach back inside, but at that point the list is text being parsed again.
:::

::: context array-picture An array is a row of numbered boxes
Aurora's `ARRAY_AGG(value ORDER BY ts)` is one value holding three boxes. In PostgreSQL the first box is number 1. (In Python and C the first is number 0, which catches people moving between them.)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="20" y="24" font-size="12" fill="#1f2a44">temps for SAT-001 = {20,24,30}</text>
  <rect x="60" y="40" width="70" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="130" y="40" width="70" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="200" y="40" width="70" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <text x="95" y="65">20</text><text x="165" y="65">24</text><text x="235" y="65">30</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="95" y="98">[1] 00:00</text><text x="165" y="98">[2] 06:00</text><text x="235" y="98">[3] next day</text>
  </g>
  <text x="300" y="65" font-size="11" fill="#1d6fd1">in ts order</text>
</svg>
```

Sorting newest first reverses the boxes, which is why `(ARRAY_AGG(value ORDER BY ts DESC))[1]` is the latest reading.
:::

::: context p-numbers p50, p95, p99
Operations teams shorten percentiles to "p" and a number: p50 is the median, p95 the 95th percentile, p99 the 99th. A ground-segment dashboard might show the p99 delay between a frame leaving the spacecraft and landing in the database, because the average hides the slow tail that actually breaks things.

Thermal engineers use high percentiles the same way: a component rated to 45 °C cares whether its p99 temperature over an orbit stays below that, not whether its mean does.
:::

::: context ordered-set Why the odd WITHIN GROUP syntax
Most aggregates do not care about order: a sum is the same whichever way you add. A percentile is different — it is defined by position in a sorted list. The SQL standard therefore gives these functions a separate slot for the sort, `WITHIN GROUP (ORDER BY …)`, and calls them **ordered-set aggregates**.

The first brackets hold settings that are the same for the whole group (the fraction 0.5); the WITHIN GROUP brackets hold the column that varies row by row. Keeping them apart is what lets you write `PERCENTILE_CONT(ARRAY[0.1, 0.5, 0.9])` and get three answers from a single sort.
:::

::: context interpolation-picture Reading between two samples
Put the six sorted temperatures at positions 0 to 5 on a line. The median sits at position 2.5, halfway between 20 and 22; the 90th percentile at 4.5, halfway between 24 and 30.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="330" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <g fill="#1d6fd1">
    <circle cx="40" cy="70" r="6"/><circle cx="96" cy="70" r="6"/><circle cx="152" cy="70" r="6"/>
    <circle cx="208" cy="70" r="6"/><circle cx="264" cy="70" r="6"/><circle cx="320" cy="70" r="6"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="54">11</text><text x="96" y="54">18</text><text x="152" y="54">20</text>
    <text x="208" y="54">22</text><text x="264" y="54">24</text><text x="320" y="54">30</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="40" y="92">0</text><text x="96" y="92">1</text><text x="152" y="92">2</text>
    <text x="208" y="92">3</text><text x="264" y="92">4</text><text x="320" y="92">5</text>
  </g>
  <line x1="180" y1="62" x2="180" y2="108" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="124" font-size="12" fill="#b4232c" text-anchor="middle">2.5 → 21</text>
  <line x1="292" y1="62" x2="292" y2="108" stroke="#b4232c" stroke-width="2"/>
  <text x="292" y="124" font-size="12" fill="#b4232c" text-anchor="middle">4.5 → 27</text>
  <text x="30" y="24" font-size="11" fill="#1f2a44">sorted values (top), positions (bottom)</text>
</svg>
```

Positions are spaced evenly even though the values are not; the blending happens between the two values either side.
:::

::: context pivot-word Turning rows into columns
"Pivot" comes from the spreadsheet world: a pivot table swings a column of values round so each category becomes its own column. The readings table stores one row per sample, with the day inside the timestamp. The scorecard pivots that into one column per day.

It only works when you know the categories in advance, because each one needs its own FILTER. For a week of days that is fine; for "one column per satellite in a 6,000-strong fleet" it is not, and the report should stay as rows.
:::

::: context one-scan What "one scan" buys you
A **scan** is the database reading through a table's rows. On a small table it is instant. On a year of 1 Hz telemetry from a large constellation it is billions of rows, and reading them is most of the cost of the query.

Counting the critical rows in one query and the total in another reads the table twice. Counting both with FILTER reads it once and updates both counters as each row goes past. The planner — the part of the database that decides how to run a query — can do this because both aggregates share one GROUP BY. You will see plans printed with `EXPLAIN` in lesson 07.
:::
