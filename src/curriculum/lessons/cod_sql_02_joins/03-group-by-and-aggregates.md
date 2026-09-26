---
id: l03-group-by-and-aggregates
title: GROUP BY, HAVING and the basic aggregates
minutes: 22
covers:
  - GROUP BY and HAVING; the difference between WHERE and HAVING
  - COUNT(*) versus COUNT(col); SUM, AVG, MIN, MAX
---

A satellite that sends one temperature a second sends [[86,400 a day|telemetry-volume]]. Nobody reads 86,400 numbers. An operator reads one line: "Aurora, 1 March: mean 22 °C, peak 24 °C, 2 samples." Turning many rows into a few meaningful numbers is called **aggregation**, and it is most of what telemetry analysis is.

You met the idea at the end of the last module, in the lesson on the order a query runs in: GROUP BY sorts rows into piles, an aggregate function says one thing about each pile, and HAVING throws away whole piles. This lesson teaches all of it properly: how the piles are formed, exactly what each of the five basic aggregates does with NULL and with an empty pile, how to group by more than one thing, and when a condition belongs in WHERE and when in HAVING.

By the end you can compute a per-satellite, per-day summary from a joined fleet and reading table — the exact shape of this module's first exercise.

## An aggregate turns many values into one

Picture a bag of coins. You could list every coin. Or you could say "23 coins, worth \$4.35 in all, the biggest a quarter". Each of those phrases looks at the whole bag and gives back one number.

An **aggregate function** does that for a column: it takes all the values in a set of rows and returns a single value. The five you need first:

| Function | Returns | Read it as |
| --- | --- | --- |
| [[`COUNT(*)`|count-star]] | the number of rows | "count star" |
| `COUNT(col)` | the number of rows where `col` is not NULL | "count of col" |
| `SUM(col)` | the total of the non-NULL values | |
| `AVG(col)` | the mean of the non-NULL values | "average" |
| `MIN(col)`, `MAX(col)` | the smallest and largest non-NULL value | "min", "max" |

With no GROUP BY, the whole table is one pile, and the query returns exactly one row:

```sql
SELECT COUNT(*)   AS n,
       SUM(value) AS total,
       AVG(value) AS mean,
       MIN(value) AS lo,
       MAX(value) AS hi
FROM reading;
```

```text
 n | total |        mean        | lo | hi
---+-------+--------------------+----+----
 6 |   125 | 20.833333333333332 | 11 | 30
(1 row)
```

Check it by hand against the six bus-temperature readings from lesson 01 (20, 24, 30, 18, 22, 11). The total is $20 + 24 + 30 + 18 + 22 + 11 = 125$. The mean is the total divided by the count, $125 / 6 \approx 20.83$. The smallest is 11 and the largest is 30. Every number agrees.

`MIN` and `MAX` work on text and timestamps too, not only numbers: `MAX(ts)` is the latest timestamp, because ISO-8601 text sorts in time order. That makes `MAX(ts)` the standard way to ask "when did we last hear from it?".

## GROUP BY: one row per pile

**[[GROUP BY|group-picture]]** splits the rows into groups that share the same value in the listed column (or columns), then runs the aggregates once per group. Every group becomes exactly one output row.

```sql
SELECT sat_id,
       COUNT(*)   AS n,
       AVG(value) AS mean_temp,
       MIN(value) AS lo,
       MAX(value) AS hi
FROM reading
GROUP BY sat_id
ORDER BY sat_id;
```

```text
 sat_id  | n |     mean_temp      | lo | hi
---------+---+--------------------+----+----
 SAT-001 | 3 | 24.666666666666668 | 20 | 30
 SAT-002 | 2 |                 20 | 18 | 22
 SAT-003 | 1 |                 11 | 11 | 11
(3 rows)
```

Six rows went in; three groups came out. Aurora's pile holds 20, 24 and 30, so its mean is $74 / 3 \approx 24.67$. Borealis's holds 18 and 22, mean $40 / 2 = 20$. Cirrus has one reading, so its mean, minimum and maximum are all 11. Dorado has no readings, so it forms no pile — GROUP BY only makes groups out of rows that exist.

The counts add back up to the table: $3 + 2 + 1 = 6$. Every row landed in exactly one pile. That is a check worth making on any grouped result.

### The one rule of SELECT after GROUP BY

Once rows are grouped, each output row stands for a whole pile. So SELECT may name only two kinds of thing:

- the **grouping columns** themselves, which have one value per pile by definition;
- **aggregates**, which turn a pile into one value.

Anything else is a question with no single answer. "What is the `value` of Aurora's pile?" — it has three. PostgreSQL refuses:

```sql
SELECT sat_id, value FROM reading GROUP BY sat_id;
```

```text
ERROR:  column "reading.value" must appear in the GROUP BY clause or be used in an aggregate function
```

SQLite, as the last module warned, answers anyway, with some value from each group (20, 18 and 11 here). That value is not the first, the latest or the largest in any promised sense. If you want the largest, write `MAX(value)`.

::: key The rule of SELECT after GROUP BY
After GROUP BY, every SELECT expression must be a grouping column, an aggregate, or built only from those. PostgreSQL enforces this. SQLite does not, and returns an arbitrary row's value for anything else.
:::

### Grouping by more than one column

List several columns and a group is formed for each **combination** that occurs. To summarise per satellite *per day*, group by the satellite and by the day. With ISO-8601 text timestamps, the day is the first ten characters, [[`substr(ts, 1, 10)`|substr-one]] — "substring of ts, starting at character 1, ten characters long", which turns `2026-03-01T06:00:00Z` into `2026-03-01`.

::: example A per-satellite, per-day summary
**Question.** For each satellite and each calendar day (UTC), how many bus-temperature samples arrived, and what were the lowest and highest?

**Predict the groups first.** Aurora has readings on 1 March (two) and 2 March (one). Borealis has two on 1 March. Cirrus has one on 2 March. So four satellite-day combinations, with counts 2, 1, 2, 1.

```sql
SELECT sat_id,
       substr(ts, 1, 10) AS day,
       COUNT(*)   AS n,
       MIN(value) AS lo,
       MAX(value) AS hi
FROM reading
WHERE channel = 'BUS_TEMP'
GROUP BY sat_id, substr(ts, 1, 10)
ORDER BY sat_id, day;
```

```text
 sat_id  |    day     | n | lo | hi
---------+------------+---+----+----
 SAT-001 | 2026-03-01 | 2 | 20 | 24
 SAT-001 | 2026-03-02 | 1 | 30 | 30
 SAT-002 | 2026-03-01 | 2 | 18 | 22
 SAT-003 | 2026-03-02 | 1 | 11 | 11
(4 rows)
```

**Walk it through.** WHERE keeps rows of the right channel (all six, here — but in a real table with fifty channels it would keep only these). GROUP BY forms one pile per distinct pair of sat-id and day. Aurora's 1 March pile holds 20 and 24, so `lo` is 20 and `hi` is 24. Its 2 March pile holds only 30.

**Check.** Four rows, as predicted. Counts $2 + 1 + 2 + 1 = 6$, the whole table.

**With names.** To label the rows with satellite names instead of ids, join first and group by the name: `FROM reading AS r JOIN satellite AS s ON s.sat_id = r.sat_id … GROUP BY s.name, substr(r.ts, 1, 10)`. The join happens in FROM, before grouping, so the name is on every row by the time the piles are made. Because it is an inner join, a satellite with no readings (Dorado) produces no rows at all.
:::

Notice the GROUP BY repeats the whole expression `substr(ts, 1, 10)` instead of the alias `day`. That is the portable way. PostgreSQL and SQLite also accept `GROUP BY sat_id, day` (they look up the output alias), but some databases do not, and in PostgreSQL an alias that happens to match a real column name means the column instead.

::: warning Group by the key, not the label
Grouping by `s.name` merges two satellites that share a name into one pile — and nothing in the schema says names are unique. Grouping by `s.sat_id` cannot merge anything. If you want the name on the output, group by both: `GROUP BY s.sat_id, s.name`. PostgreSQL even lets you write only `GROUP BY s.sat_id` and still select `s.name`, because it knows `sat_id` is the primary key, so the name cannot vary inside a pile.
:::

## NULL, empty piles and COUNT

Aggregates have firm rules about NULL, and those rules are what make them useful for real telemetry, where values go missing.

**Every aggregate except `COUNT(*)` skips NULL.** `SUM`, `AVG`, `MIN`, `MAX` and `COUNT(col)` look only at the values that are there. `COUNT(*)` counts rows, whatever is in them.

So `COUNT(*)` and `COUNT(col)` answer different questions:

- `COUNT(*)` — how many rows are in this group?
- `COUNT(value)` — how many of those rows actually have a value?

The gap between them is the number of rows whose `value` is NULL.

::: key COUNT(*) versus COUNT(col)
COUNT(*) counts rows; COUNT(col) counts rows where col is not NULL. The difference between them is a one-line data-quality check for a channel with dropouts.
:::

::: example Measuring dropouts
The exercise's `reading` table declares `value REAL NOT NULL`, so it cannot hold a missing value. Real ground systems often keep a raw table first, where a row is written for every scheduled sample slot even when the sample was garbled in transmission. Here is such a table, `raw_reading`, with a [[battery state-of-charge|battery-soc]] channel (`BATT_SOC`, the battery's charge as a fraction of full, from 0 to 1), sampled every six hours on 1 March:

```text
 sat_id  |          ts          | channel  | value
---------+----------------------+----------+-------
 SAT-001 | 2026-03-01T00:00:00Z | BATT_SOC |  0.91
 SAT-001 | 2026-03-01T06:00:00Z | BATT_SOC |  0.84
 SAT-001 | 2026-03-01T12:00:00Z | BATT_SOC |  0.78
 SAT-001 | 2026-03-01T18:00:00Z | BATT_SOC |
 SAT-002 | 2026-03-01T00:00:00Z | BATT_SOC |  0.66
 SAT-002 | 2026-03-01T06:00:00Z | BATT_SOC |
 SAT-002 | 2026-03-01T12:00:00Z | BATT_SOC |
 SAT-002 | 2026-03-01T18:00:00Z | BATT_SOC |  0.58
```

```sql
SELECT sat_id,
       COUNT(*)                AS n_rows,
       COUNT(value)            AS n_values,
       COUNT(*) - COUNT(value) AS n_missing,
       ROUND(AVG(value)::numeric, 3) AS mean_soc
FROM raw_reading
GROUP BY sat_id
ORDER BY sat_id;
```

```text
 sat_id  | n_rows | n_values | n_missing | mean_soc
---------+--------+----------+-----------+----------
 SAT-001 |      4 |        3 |         1 |    0.843
 SAT-002 |      4 |        2 |         2 |    0.620
(2 rows)
```

(`ROUND(x::numeric, 3)` rounds to three decimals in PostgreSQL, as in the last module. In SQLite write `ROUND(AVG(value), 3)`.)

**Read it.** Both satellites had all four slots on the schedule. Aurora lost one sample; Borealis lost half its day. In a real system the slots come every second, and a sudden jump in `n_missing` is often the first sign of a failing radio link.

**Check the averages.** Aurora: $(0.91 + 0.84 + 0.78) / 3 = 2.53 / 3 \approx 0.843$. Borealis: $(0.66 + 0.58) / 2 = 1.24 / 2 = 0.62$. Each divides by the number of *values*, not rows. If the NULLs had been counted as zero, Borealis would show $1.24 / 4 = 0.31$ — a battery emergency that never happened. That is the same trap as `COALESCE(value, 0)` from the last module.
:::

### COUNT after a LEFT JOIN

The same distinction does real work after an outer join, where the NULLs are made by the join. Count each satellite's readings, keeping silent satellites:

```sql
SELECT s.name,
       COUNT(*)       AS n_rows,
       COUNT(r.value) AS n_readings
FROM satellite AS s
LEFT JOIN reading AS r ON r.sat_id = s.sat_id
GROUP BY s.name
ORDER BY s.name;
```

```text
   name   | n_rows | n_readings
----------+--------+------------
 Aurora   |      3 |          3
 Borealis |      2 |          2
 Cirrus   |      1 |          1
 Dorado   |      1 |          0
(4 rows)
```

Dorado's pile holds one row — the NULL-filled row the left join made for it. `COUNT(*)` counts that row and says 1, which is wrong: Dorado sent nothing. `COUNT(r.value)` skips the NULL and says 0, which is right.

::: warning COUNT(*) after a LEFT JOIN
A left join gives every unmatched row a single NULL-filled partner row, so `COUNT(*)` reports 1 for a satellite that has nothing. To count matches, count a column from the right-hand table that is never NULL in real data, such as `COUNT(r.sat_id)` or `COUNT(r.value)`.
:::

### Empty groups and empty tables

What do aggregates return when there are no values at all? Ask about Dorado directly:

```sql
SELECT SUM(value), AVG(value), MAX(value), COUNT(*), COUNT(value)
FROM reading
WHERE sat_id = 'SAT-004';
```

```text
 sum | avg | max | count | count
-----+-----+-----+-------+-------
     |     |     |     0 |     0
(1 row)
```

`COUNT` of nothing is 0. But `SUM`, `AVG`, `MIN` and `MAX` of nothing are **NULL**, not 0. There is no average of no numbers, and [[SQL chose NULL for the sum as well|sum-null]]. If a report needs a zero, say so: `COALESCE(SUM(value), 0)`.

Notice also that this query returned one row, even though no reading matched. An aggregate with no GROUP BY always returns exactly one row. With a GROUP BY, an empty input gives *no* rows, because there are no piles.

::: key Aggregates and NULL
`SUM`, `AVG`, `MIN`, `MAX` and `COUNT(col)` ignore NULLs. Over no values at all, `COUNT` returns 0 and the others return NULL; use `COALESCE(SUM(x), 0)` when a report needs zero. `AVG` divides by the number of non-NULL values, not the number of rows.
:::

One more variation: `COUNT(DISTINCT col)` counts **different** non-NULL values. `COUNT(DISTINCT sat_id)` over `reading` is 3 — three satellites reported — while `COUNT(sat_id)` is 6, one per reading. Lesson 04 needs this one.

## HAVING: filtering whole groups

WHERE tests rows. Sometimes you want to test a *pile*: "only satellites whose mean temperature is above 20", "only days with at least 100 samples". A pile's mean does not exist until the pile has been made, so that test cannot go in WHERE. It goes in **[[HAVING|having-picture]]**, which runs right after GROUP BY and can use aggregates:

```sql
SELECT sat_id, AVG(value) AS mean_temp
FROM reading
GROUP BY sat_id
HAVING AVG(value) > 20
ORDER BY sat_id;
```

```text
 sat_id  |     mean_temp
---------+--------------------
 SAT-001 | 24.666666666666668
(1 row)
```

Borealis's mean is exactly 20, and $20 > 20$ is false, so it is dropped. Cirrus at 11 is dropped too.

Why repeat `AVG(value)` instead of writing `HAVING mean_temp > 20`? Because in the logical order HAVING (station 4) runs before SELECT (station 5) invents the alias. PostgreSQL says `column "mean_temp" does not exist`. SQLite is lenient and accepts the alias, which is one more way code written for SQLite can fail on PostgreSQL.

::: example Which satellite-days ran hot?
**Question.** List every satellite-day on which the bus temperature reached 24 °C or more, with that day's peak.

The condition is about a day's *maximum* — a property of the pile — so it goes in HAVING:

```sql
SELECT sat_id, substr(ts, 1, 10) AS day, MAX(value) AS hi
FROM reading
GROUP BY sat_id, substr(ts, 1, 10)
HAVING MAX(value) >= 24
ORDER BY sat_id, day;
```

```text
 sat_id  |    day     | hi
---------+------------+----
 SAT-001 | 2026-03-01 | 24
 SAT-001 | 2026-03-02 | 30
(2 rows)
```

**Check against the per-day summary** in the earlier example: the four piles had maxima 24, 30, 22 and 11. The two at 24 or above are both Aurora's. Borealis's 22 and Cirrus's 11 fail.

**Compare with WHERE.** `WHERE value >= 24` would keep the same two satellite-days here, but it would compute everything else — the count, the mean — from the hot readings only. Aurora's 1 March count would be 1 instead of 2. HAVING keeps whole piles, with every reading in them.
:::

### WHERE or HAVING?

Here is the decision in one sentence: **if the condition is about a single row, it goes in WHERE; if it needs an aggregate, it goes in HAVING.**

A condition on a single row *can* be written in HAVING when it is about a grouping column. This is legal:

```sql
SELECT sat_id, COUNT(*)
FROM reading
GROUP BY sat_id
HAVING sat_id <> 'SAT-003';
```

It returns the right answer, but it says the wrong thing. Logically it builds every pile, including Cirrus's, and then throws Cirrus's away. `WHERE sat_id <> 'SAT-003'` removes Cirrus's rows before any pile is made. WHERE also runs early enough to use an **[[index|index]]**: with an index on `sat_id` or `ts`, the database can skip the unwanted rows without reading them at all. On a table of billions of readings, that is the difference between a query that takes milliseconds and one that takes minutes.

To be fair to PostgreSQL: its planner notices a HAVING condition like this one that uses no aggregate, and quietly moves it into WHERE (`EXPLAIN` shows it as a filter on the table scan). But not every engine does, not every condition can be moved, and the reader of your query should not have to know the planner's habits to see what it does.

::: key WHERE versus HAVING
WHERE filters rows before grouping and can use indexes; HAVING filters groups after aggregation and can reference aggregate results. Putting a non-aggregate condition in HAVING is legal and usually slower.
:::

A query can have both, and most real ones do: WHERE narrows to the channel and time window, GROUP BY makes the piles, HAVING keeps the interesting piles.

```sql
SELECT sat_id, AVG(value) AS mean_temp
FROM reading
WHERE channel = 'BUS_TEMP'
  AND ts >= '2026-03-01T00:00:00Z' AND ts < '2026-03-03T00:00:00Z'
GROUP BY sat_id
HAVING COUNT(*) >= 2
ORDER BY sat_id;
```

That returns Aurora (24.67) and Borealis (20). Cirrus had only one reading in the window, so its pile failed the HAVING test.

## Grouping by day with real timestamps

The exercises store timestamps as text, so `substr(ts, 1, 10)` gives the day. In a PostgreSQL table with a proper `TIMESTAMPTZ` column, you would instead write `date_trunc('day', ts)` (which cuts a timestamp down to midnight at the start of its day) or cast to a date. Either way, the day is computed in the session's time zone, which is why lesson 07 of the last module told you to keep sessions in UTC: `(ts AT TIME ZONE 'UTC')::date` makes the choice explicit. The text version gets UTC for free, because the stored strings all end in `Z`.

## Check yourself

::: check
Without running it, give the output of this query on the six-row `reading` table:

```sql
SELECT substr(ts, 1, 10) AS day, COUNT(*) AS n, SUM(value) AS total
FROM reading
GROUP BY substr(ts, 1, 10)
ORDER BY day;
```
:::

::: answer
The days are 1 March and 2 March. On 1 March: Aurora's 20 and 24, Borealis's 18 and 22 — four readings, total $20 + 24 + 18 + 22 = 84$. On 2 March: Aurora's 30 and Cirrus's 11 — two readings, total $41$.

```text
    day     | n | total
------------+---+-------
 2026-03-01 | 4 |    84
 2026-03-02 | 2 |    41
```

Check: counts $4 + 2 = 6$ and totals $84 + 41 = 125$, the whole table, as they must be.
:::

::: check
A channel sampled once a minute should have 1,440 rows a day. For one day, `COUNT(*)` is 1,440 and `COUNT(value)` is 1,391. What does that tell you? What would it mean if instead `COUNT(*)` were 1,391?
:::

::: answer
In the first case every scheduled slot has a row, but $1440 - 1391 = 49$ of them have a NULL value: the ground system knew a sample was due but received nothing usable. About $49 / 1440 \approx 3.4\%$ of the day's samples dropped out.

In the second case 49 rows are missing altogether. `COUNT(*)` cannot see rows that do not exist, so the difference between the two counts would be zero and would not reveal the gap. To find missing rows you compare against a list of the times that should exist — a grid built with a cross join or, in lesson 10, a generated time series.
:::

::: check
Explain why `AVG(value)` and `SUM(value) / COUNT(*)` can disagree, and which one is the mean of the measured values.
:::

::: answer
`AVG(value)` adds the non-NULL values and divides by how many non-NULL values there are, `COUNT(value)`. `SUM(value) / COUNT(*)` divides the same sum by the number of *rows*, including rows whose value is NULL. When any value is NULL, the second is smaller.

`AVG(value)` — equivalently `SUM(value) / COUNT(value)` — is the mean of the measured values. On `raw_reading`, Borealis gives $1.24 / 2 = 0.62$ the right way and $1.24 / 4 = 0.31$ the wrong way.
:::

::: check
Rewrite this query so it says what it means, and explain what changed for the database:

```sql
SELECT sat_id, MAX(value) AS hi
FROM reading
GROUP BY sat_id
HAVING sat_id IN ('SAT-001', 'SAT-002') AND MAX(value) > 25;
```
:::

::: answer
The test on `sat_id` is about single rows, so it belongs in WHERE. The test on `MAX(value)` needs the pile, so it stays in HAVING:

```sql
SELECT sat_id, MAX(value) AS hi
FROM reading
WHERE sat_id IN ('SAT-001', 'SAT-002')
GROUP BY sat_id
HAVING MAX(value) > 25;
```

Now the rows of other satellites are removed before any pile is made, and an index on `sat_id` could find the two satellites' rows directly. The result is the same: Aurora, with a maximum of 30. Borealis's maximum, 22, fails the HAVING test.
:::

::: check
What does `SELECT COUNT(*), MAX(value) FROM reading WHERE value > 100` return? And what does the same query return with `GROUP BY sat_id` added?
:::

::: answer
No reading is above 100, so WHERE leaves nothing. Without GROUP BY, the whole (empty) input is one group and the query returns one row: `COUNT(*)` is 0 and `MAX(value)` is NULL.

With `GROUP BY sat_id` there are no rows to form piles from, so there are no groups, and the query returns no rows at all.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Aggregate | many values in, one value out: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX` |
| GROUP BY | one output row per distinct value (or combination) of the grouping columns |
| SELECT after GROUP BY | only grouping columns and aggregates; SQLite does not enforce it |
| `COUNT(*)` vs `COUNT(col)` | rows versus non-NULL values; the gap measures dropouts |
| `COUNT(DISTINCT col)` | how many different non-NULL values |
| NULL | ignored by every aggregate except `COUNT(*)` |
| No values | `COUNT` gives 0; `SUM`, `AVG`, `MIN`, `MAX` give NULL |
| After a LEFT JOIN | count a right-table column, not `*` |
| HAVING | filters groups after aggregation; may use aggregates |
| WHERE vs HAVING | row conditions in WHERE (earlier, can use indexes); aggregate conditions in HAVING |
| Day from ISO text | `substr(ts, 1, 10)`; with TIMESTAMPTZ, `date_trunc('day', ts)` in UTC |

You now have both tools: joins that multiply rows, and aggregates that add them up. Next lesson puts them together and shows what goes wrong when the rows being added up were multiplied first — the fan-out trap — and the ways to fix it.

::: context telemetry-volume Nobody reads raw telemetry
A modern satellite reports hundreds or thousands of channels — temperatures, voltages, currents, wheel speeds, attitude estimates — many of them several times a second. A fleet of thousands turns that into billions of rows a day. People and alarms work from summaries: the mean, minimum, maximum and sample count per channel per minute, hour or day. Those summaries are GROUP BY queries, run over and over, often stored in their own tables so dashboards do not have to recompute them from the raw rows.
:::

::: context count-star What the star means
In `SELECT *` the star means "every column". In `COUNT(*)` it means something slightly different: "the row itself". `COUNT(*)` does not look inside any column, so a row full of NULLs still counts. Some people write `COUNT(1)`, which counts a constant 1 on every row and gives the same answer. `COUNT(col)` is the one that looks inside a column and skips the NULLs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">Borealis, BATT_SOC</text>
  <g stroke="#1f2a44" stroke-width="1" font-size="11" fill="#1f2a44">
    <rect x="20" y="26" width="140" height="22" fill="#8fb8f0"/>
    <rect x="20" y="50" width="140" height="22" fill="#ffffff"/>
    <rect x="20" y="74" width="140" height="22" fill="#ffffff"/>
    <rect x="20" y="98" width="140" height="22" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="28" y="41">00:00   0.66</text>
    <text x="28" y="65">06:00   NULL</text>
    <text x="28" y="89">12:00   NULL</text>
    <text x="28" y="113">18:00   0.58</text>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="190" y="56">COUNT(*) = 4</text>
    <text x="190" y="76" fill="#1d6fd1">COUNT(value) = 2</text>
    <text x="190" y="96" fill="#b4232c">missing = 4 − 2 = 2</text>
  </g>
</svg>
```
:::

::: context group-picture Piles, then one line per pile
GROUP BY sat_id sorts the six readings into three piles. Each aggregate then looks at one pile at a time, and each pile becomes one output row.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="55" y="16">6 rows</text><text x="165" y="16">3 piles</text><text x="298" y="16">3 output rows</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="15" y="26" width="80" height="18" fill="#8fb8f0"/><rect x="15" y="46" width="80" height="18" fill="#f2b880"/>
    <rect x="15" y="66" width="80" height="18" fill="#8fb8f0"/><rect x="15" y="86" width="80" height="18" fill="#ffffff"/>
    <rect x="15" y="106" width="80" height="18" fill="#f2b880"/><rect x="15" y="126" width="80" height="18" fill="#8fb8f0"/>
    <rect x="130" y="26" width="70" height="18" fill="#8fb8f0"/><rect x="130" y="46" width="70" height="18" fill="#8fb8f0"/><rect x="130" y="66" width="70" height="18" fill="#8fb8f0"/>
    <rect x="130" y="96" width="70" height="18" fill="#f2b880"/><rect x="130" y="116" width="70" height="18" fill="#f2b880"/>
    <rect x="130" y="146" width="70" height="18" fill="#ffffff"/>
    <rect x="236" y="45" width="122" height="20" fill="#8fb8f0"/>
    <rect x="236" y="105" width="122" height="20" fill="#f2b880"/>
    <rect x="236" y="145" width="122" height="20" fill="#ffffff"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="55" y="39">001 · 20</text><text x="55" y="59">002 · 18</text><text x="55" y="79">001 · 24</text>
    <text x="55" y="99">003 · 11</text><text x="55" y="119">002 · 22</text><text x="55" y="139">001 · 30</text>
    <text x="165" y="39">20</text><text x="165" y="59">24</text><text x="165" y="79">30</text>
    <text x="165" y="109">18</text><text x="165" y="129">22</text><text x="165" y="159">11</text>
    <text x="297" y="59">001: n 3, max 30</text>
    <text x="297" y="119">002: n 2, max 22</text>
    <text x="297" y="159">003: n 1, max 11</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="200" y1="55" x2="236" y2="55"/><line x1="200" y1="115" x2="236" y2="115"/><line x1="200" y1="155" x2="236" y2="155"/>
  </g>
</svg>
```

The rows can arrive in any order; the piles do not care.
:::

::: context substr-one Why the count starts at 1
In `substr(ts, 1, 10)` the first character is number 1, so this takes characters 1 through 10. SQL counts positions from 1, like people do. Python counts from 0, so the same slice there is `ts[0:10]`. Mixing the two conventions up gives `2026-03-0` or `026-03-01T`, and because the result is still a plausible-looking string, nothing errors. It pays to check one output row by eye.
:::

::: context battery-soc Why operators watch the battery
A satellite in low Earth orbit passes into Earth's shadow on most orbits — up to about 35 minutes of every 95 or so. With no sunlight on the solar panels, everything runs from the battery. The state of charge dips in every eclipse and recovers in sunlight, so a daily mean that drifts down, or a minimum that gets lower each day, is an early warning of ageing cells or a power budget that no longer balances.
:::

::: context sum-null Why the sum of nothing is not zero
In most programming languages the sum of an empty list is 0: Python's `sum([])` is `0`. SQL made a different choice. Its aggregates return NULL when they have no values to work on, to say "there was no data", and only `COUNT` returns 0. The two readings mean different things in a report — "Dorado used 0 kg of propellant" is a claim about Dorado, while NULL admits there was nothing to add up — which is why the conversion to 0 is left for you to write, on purpose, with COALESCE.
:::

::: context having-picture Two filters, two places
WHERE stands before the piles are made and removes single rows. HAVING stands after, and removes whole piles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <rect x="6" y="34" width="66" height="30" rx="4" fill="#8fb8f0"/><text x="39" y="53">FROM</text>
    <rect x="96" y="34" width="66" height="30" rx="4" fill="#ffffff" stroke="#b4232c" stroke-width="2"/><text x="129" y="53">WHERE</text>
    <rect x="186" y="34" width="72" height="30" rx="4" fill="#f2b880"/><text x="222" y="53">GROUP BY</text>
    <rect x="282" y="34" width="72" height="30" rx="4" fill="#ffffff" stroke="#b4232c" stroke-width="2"/><text x="318" y="53">HAVING</text>
    <text x="129" y="84">drops rows</text>
    <text x="318" y="84">drops piles</text>
    <text x="222" y="24">makes piles</text>
  </g>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="72" y1="49" x2="90" y2="49"/><line x1="162" y1="49" x2="180" y2="49"/><line x1="258" y1="49" x2="276" y2="49"/>
  </g>
  <g fill="#1f2a44">
    <polygon points="96,49 88,45 88,53"/><polygon points="186,49 178,45 178,53"/><polygon points="282,49 274,45 274,53"/>
  </g>
</svg>
```
:::

::: context index Why WHERE can skip rows and HAVING cannot
An index is a separate, sorted copy of one or more columns, with a pointer from each entry back to its row — like the index at the back of a book. With an index on `sat_id`, the condition `sat_id = 'SAT-001'` can jump straight to Aurora's entries and read only those rows. A HAVING condition is tested on finished groups, and to finish a group the database has already read every row in it, so there is nothing left to skip. That is the whole reason for putting row conditions in WHERE.
:::
