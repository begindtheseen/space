---
id: l09-common-table-expressions
title: Common table expressions
minutes: 22
covers:
  - Common table expressions and chained CTEs for readability
---

By now you can write queries with a lot going on inside them: a join, a GROUP BY, a subquery in FROM, another subquery in WHERE. Each piece is fine. Put together, they turn into a set of boxes inside boxes, and you have to read the query from the middle outwards to find out what it does. The person who reads it next — a teammate, or you in three months — has to do the same untangling again.

This lesson teaches a way to write the same query as a list of steps, top to bottom, each with a name. The tool is the **common table expression**, or **CTE**: a named query written at the top of a statement with the keyword `WITH`, which the rest of the statement can use as if it were a table. Nothing about what the query means has to change. Only the way it reads changes.

That matters in real flight-data work. A daily health report for a fleet of satellites is often five or six steps: pick the channel, average per satellite per day, compare each day to a fleet baseline, flag the outliers, attach names. Written as nested subqueries it is a puzzle. Written as a chain of CTEs it reads like the list of steps you would say out loud, and each step can be checked on its own. By the end of this lesson you will be able to take a nested query apart into chained CTEs and prove that the result did not change.

## A query inside a query, read inside out

Start with a problem you met in the last module. In lesson 08 there, you saw that WHERE runs before SELECT, so WHERE cannot use a name that SELECT invents. Here is the same trap with temperatures. The `reading` table stores bus temperatures in degrees Celsius. Converting to kelvin means adding 273.15, and suppose you want the readings above 295 K:

```sql
SELECT sat_id, ts, value + 273.15 AS temp_k
FROM reading
WHERE temp_k > 295;
```

```text
ERROR:  column "temp_k" does not exist
```

The name `temp_k` does not exist yet when WHERE runs. Lesson 07 of this module gave you one fix: put the first query inside the FROM of a second one, as a **[[derived table|derived-table]]** — a table that exists only while this query runs, built from the query in the brackets.

```sql
SELECT sat_id, ts, temp_k
FROM (
    SELECT sat_id, ts, value + 273.15 AS temp_k
    FROM reading
) AS kelvin
WHERE temp_k > 295
ORDER BY sat_id, ts;
```

Now the inner query runs first, as a whole, and its column `temp_k` is a real column of the derived table `kelvin`. The outer WHERE can test it.

This works. But notice how you read it. The first line you see is the *last* step. To understand it you jump into the brackets, read the inner query, then jump back out. With one level that is fine. With three levels, it is like reading a recipe where step 4 is written first, and steps 1 to 3 are tucked inside it, inside each other.

## WITH: give a step a name

A CTE moves the inner query to the top and gives it a name:

```sql
WITH kelvin AS (
    SELECT sat_id, ts, value + 273.15 AS temp_k
    FROM reading
)
SELECT sat_id, ts, temp_k
FROM kelvin
WHERE temp_k > 295
ORDER BY sat_id, ts;
```

```text
 sat_id  |          ts          | temp_k
---------+----------------------+--------
 SAT-001 | 2026-03-01T06:00:00Z | 297.15
 SAT-001 | 2026-03-02T01:00:00Z | 303.15
 SAT-002 | 2026-03-01T12:00:00Z | 295.15
(3 rows)
```

Read the first line aloud as "with kelvin as…". The parts are:

- `WITH` starts the list of named steps. It comes first, before the main query.
- `kelvin` is the name you are giving the step. Pick a name that says what the rows are.
- `AS ( … )` holds the step's query, in round brackets.
- After the closing bracket comes the **main query** — the ordinary SELECT that produces the final result. It can use `kelvin` anywhere a table name could go.

The result is the same three rows the derived-table version gives. It has to be: a CTE used once like this means exactly the same as putting its query in brackets where its name appears.

A CTE lives only for the one statement it belongs to. After the semicolon it is gone. It is not saved in the database like a table, and it is not saved like a view (lesson 02 of the last module). Think of it as a sticky note on the query: useful while you work on this one thing, then thrown away.

::: key A common table expression
`WITH name AS (query) SELECT … FROM name …` defines a named, temporary result that exists only while this one statement runs. The main query (and later CTEs) can use `name` like a table. Used once, it means the same as writing `(query) AS name` where the name appears.
:::

You can also name the CTE's columns in a list after its name, instead of with `AS` inside the query:

```sql
WITH daily (sat_id, day, mean_temp) AS (
    SELECT sat_id, substr(ts, 1, 10), AVG(value)
    FROM reading
    GROUP BY sat_id, substr(ts, 1, 10)
)
SELECT * FROM daily ORDER BY sat_id, day;
```

The list gives the three columns their names in order, so the inner SELECT does not need any. Next lesson you will see that recursive CTEs almost always use this form.

::: example Readings above 295 kelvin, checked
**Question.** Which bus-temperature readings are above 295 K?

**Think first.** 295 K is $295 - 273.15 = 21.85$ degrees Celsius. The six readings are 20, 24, 30, 18, 22 and 11 °C. The ones above 21.85 are 24, 30 and 22. So you expect three rows.

**Write the step, then the filter.** The CTE `kelvin` adds 273.15 to every reading and names the result `temp_k`. The main query keeps the rows where `temp_k > 295`.

**Result.** Three rows, as shown above: Aurora's 24 °C (297.15 K) and 30 °C (303.15 K), and Borealis's 22 °C (295.15 K).

**Sanity check.** Borealis's 22 °C is the closest call: $22 + 273.15 = 295.15$, which is above 295 by only 0.15 K. Aurora's 20 °C gives 293.15 K, which is below. The count matches the prediction.
:::

## Chaining: each step can use the ones before

One named step is handy. The real power comes from several. Put a comma after the first CTE's closing bracket and write the next one. There is still only one `WITH`, at the very top:

```sql
WITH first_step AS (
    ...
),
second_step AS (
    SELECT ... FROM first_step ...
),
third_step AS (
    SELECT ... FROM second_step ...
)
SELECT ... FROM third_step ...;
```

Each CTE may use any CTE written *above* it, and any real table. The main query may use all of them. This is a **chain of CTEs**: a pipeline where rows flow down from one named step to the next, like water through a row of [[filters|pipeline-picture]].

::: warning Two small syntax slips
Only the first step gets the word `WITH`. Writing `WITH a AS (…), WITH b AS (…)` is a syntax error; the second one is `b AS (…)`.

There is no comma after the last CTE. The main SELECT follows its closing bracket directly. A stray comma there gives `syntax error at or near "SELECT"` in PostgreSQL.
:::

The order of the steps matters, too. PostgreSQL refuses a CTE that uses one written *below* it:

```text
ERROR:  relation "counts" does not exist
DETAIL:  There is a WITH item named "counts", but it cannot be referenced from this part of the query.
```

SQLite is more forgiving and accepts the forward reference. Do not lean on that. Write the steps in the order they happen, which is also the order a reader wants.

## Before and after: untangling a nested query

Here is a real question for the fleet: **which satellite-days ran hotter than a typical day?** Say it as steps first, in plain words:

1. For each satellite and each calendar day, average the bus temperature.
2. Average those daily means across the whole fleet. That is the baseline.
3. Keep the satellite-days whose mean is above the baseline.
4. Attach the satellite's name, and sort.

Here is how the query looks when written with nested subqueries only. It is correct, and it is exactly the kind of query that shows up in a [[code review|code-review]]:

```sql
SELECT s.name, d.day, d.mean_temp
FROM (
    SELECT sat_id, substr(ts, 1, 10) AS day, AVG(value) AS mean_temp
    FROM reading
    WHERE channel = 'BUS_TEMP'
    GROUP BY sat_id, substr(ts, 1, 10)
) AS d
JOIN satellite AS s ON s.sat_id = d.sat_id
WHERE d.mean_temp > (
    SELECT AVG(d2.mean_temp)
    FROM (
        SELECT sat_id, substr(ts, 1, 10) AS day, AVG(value) AS mean_temp
        FROM reading
        WHERE channel = 'BUS_TEMP'
        GROUP BY sat_id, substr(ts, 1, 10)
    ) AS d2
)
ORDER BY s.name, d.day;
```

Look at what a reader has to do. Step 1 appears as the derived table `d`. Step 2 is a scalar subquery (lesson 07) in the WHERE, and inside *that* is step 1 again, copied word for word as `d2`. Step 3 is the `>` in the WHERE. Step 4 is scattered across the top line, the join and the ORDER BY. The steps are all there, but out of order and with one of them written twice. If someone later changes the channel in one copy of step 1 and forgets the other, the query quietly compares apples to oranges.

Now the same four steps as a chain of CTEs:

```sql
WITH daily AS (
    SELECT sat_id, substr(ts, 1, 10) AS day, AVG(value) AS mean_temp
    FROM reading
    WHERE channel = 'BUS_TEMP'
    GROUP BY sat_id, substr(ts, 1, 10)
),
fleet AS (
    SELECT AVG(mean_temp) AS fleet_mean
    FROM daily
),
hot_days AS (
    SELECT d.sat_id, d.day, d.mean_temp
    FROM daily AS d
    CROSS JOIN fleet AS f
    WHERE d.mean_temp > f.fleet_mean
)
SELECT s.name, h.day, h.mean_temp
FROM hot_days AS h
JOIN satellite AS s ON s.sat_id = h.sat_id
ORDER BY s.name, h.day;
```

```text
  name  |    day     | mean_temp
--------+------------+-----------
 Aurora | 2026-03-01 |        22
 Aurora | 2026-03-02 |        30
(2 rows)
```

Walk through it:

- `daily` is step 1. It is written once.
- `fleet` is step 2. It reads from `daily`, not from `reading`. It returns one row with one column, `fleet_mean`.
- `hot_days` is step 3. Because `fleet` has exactly one row, a `CROSS JOIN` (lesson 01) pins that one number onto every daily row, so the WHERE can compare the two side by side. Cross-joining a one-row table never multiplies the row count: $n \times 1 = n$.
- The main query is step 4: attach names, sort.

The steps are in the order you said them. Each has a name that tells you what its rows are. And `daily` is used twice — by `fleet` and by `hot_days` — without being written twice. Change the channel in one place and both uses change together.

::: key When a CTE is better than a nested subquery
When the query has more than one logical step. Named steps read top to bottom and can be tested independently. Be aware that in some engines a CTE is an optimisation fence, so check the plan for hot queries.
:::

## Proving the rewrite changed nothing

A rewrite for readability is only allowed if the result stays exactly the same. "It looks right" is not proof. Here is a check you can run every time.

Save each version as a view, so each can be named in one word. Then ask two questions with **[[EXCEPT|except-both-ways]]**. `A EXCEPT B` returns the rows that are in A's result but not in B's. (Lesson 11 teaches it fully; for now, that one sentence is all you need.) If the old query's rows minus the new query's rows is empty, *and* the new minus the old is empty, the two results contain the same rows.

::: example Proving the CTE version matches the nested version
**Set up.** Save the nested version as `CREATE VIEW v_nested AS SELECT s.name, …` and the CTE version as `CREATE VIEW v_cte AS WITH daily AS (…) …`, pasting each query unchanged after `AS`. A view can start with `WITH`, in PostgreSQL and in SQLite alike.

**Run one checking query.**

```sql
SELECT (SELECT COUNT(*) FROM v_nested) AS n_nested,
       (SELECT COUNT(*) FROM v_cte)    AS n_cte,
       (SELECT COUNT(*) FROM (SELECT * FROM v_nested
                              EXCEPT
                              SELECT * FROM v_cte) AS a) AS only_in_nested,
       (SELECT COUNT(*) FROM (SELECT * FROM v_cte
                              EXCEPT
                              SELECT * FROM v_nested) AS b) AS only_in_cte;
```

```text
 n_nested | n_cte | only_in_nested | only_in_cte
----------+-------+----------------+-------------
        2 |     2 |              0 |           0
(1 row)
```

**Read the four numbers.**

- `only_in_nested` is 0: every row the old query returns, the new one returns too.
- `only_in_cte` is 0: the new query invents no rows the old one lacked.
- `n_nested` and `n_cte` are both 2. This check is needed because EXCEPT works on distinct rows. If one version returned a row twice and the other once, both EXCEPT counts would still be 0. Equal row counts close that gap here, because neither result has duplicates.

**Sanity check by hand.** The daily means are Aurora 22 and 30, Borealis 20, Cirrus 11. The baseline is $(22 + 30 + 20 + 11) / 4 = 83 / 4 = 20.75$. Only Aurora's two days are above 20.75, so both versions should return exactly those two rows. They do.
:::

::: warning The check only proves agreement on this data
Two different queries can return the same rows on a small table by luck. Suppose a teammate's "rewrite" computes the baseline as the average of all six raw readings instead of the average of the daily means. That baseline is $125 / 6 \approx 20.83$, not 20.75. On these six rows no satellite-day falls between 20.75 and 20.83, so the check passes — and the rewrite is still wrong. Run the check on data that includes awkward cases: days with one reading and days with many, a silent satellite, ties with the threshold.
:::

A second catch is [[floating-point rounding|float-order]]. If a rewrite adds the same numbers in a different order, an average can differ in its last digit, and EXCEPT will report the rows as different. When that happens, compare `ROUND(mean_temp, 6)` in both versions: a difference in the sixth decimal place is rounding, while a difference in the first is a bug.

## Test each step on its own

Named steps give you a debugging trick that nested queries do not. Keep the `WITH` part and swap the main query for `SELECT * FROM` the step you want to see:

```sql
WITH daily AS (
    SELECT sat_id, substr(ts, 1, 10) AS day, AVG(value) AS mean_temp
    FROM reading
    WHERE channel = 'BUS_TEMP'
    GROUP BY sat_id, substr(ts, 1, 10)
)
SELECT * FROM daily ORDER BY sat_id, day;
```

```text
 sat_id  |    day     | mean_temp
---------+------------+-----------
 SAT-001 | 2026-03-01 |        22
 SAT-001 | 2026-03-02 |        30
 SAT-002 | 2026-03-01 |        20
 SAT-003 | 2026-03-02 |        11
(4 rows)
```

Check it against the raw data: Aurora read 20 and 24 on 1 March, mean 22; 30 on 2 March. Borealis read 18 and 22, mean 20. Cirrus read 11. Four satellite-days, and Dorado is absent because it has no readings. Step 1 is right.

Add the `fleet` step back and select from it:

```text
 fleet_mean
------------
      20.75
(1 row)
```

Step 2 is right too. You tested each step against numbers you worked out by hand, which is the same habit as a sanity check in an arithmetic example. On a real team this is how a report gets **reviewed**: the reviewer runs each step and asks "is this what the name promises?"

The same shape — one step that summarises, then a step that joins — is the fix for the fan-out trap from lesson 04. Aggregate the many side in its own CTE first, so it has one row per key, and only then join it to the one side. As a CTE, the order of the fix is written right there on the page.

## What a CTE may cost

A CTE is about how the query reads. It should not change what the query computes. Whether it changes *how fast* the query runs depends on the database.

A database has two ways to run a CTE:

- **Inline it**: paste the CTE's query into the place where it is used, as if you had written a subquery, and plan the whole thing together. Then a filter in the main query can be pushed down into the CTE's scan.
- **Materialise it**: run the CTE once on its own, store its rows in a temporary result, and let the main query read that stored result. The main query's filters cannot reach inside.

When the database materialises, the CTE is an **[[optimisation fence|fence]]**: the planner does not look across it. Sometimes that is good (an expensive step used three times is computed once). Sometimes it is bad (a filter on one satellite cannot shrink a scan of the whole fleet).

PostgreSQL before [[version 12|pg12]] always materialised every CTE. Since version 12, it inlines a CTE that is used once, is not recursive, and does not change data. A CTE used two or more times is still materialised. You can overrule the choice with `AS MATERIALIZED (…)` or `AS NOT MATERIALIZED (…)`.

You can see the difference with `EXPLAIN`, which shows the plan without running the query. Here a one-use CTE is inlined, and both conditions end up in one scan:

```sql
EXPLAIN (COSTS OFF)
WITH hot AS (SELECT * FROM reading WHERE value > 21)
SELECT * FROM hot WHERE sat_id = 'SAT-001';
```

```text
                                 QUERY PLAN
-----------------------------------------------------------------------------
 Seq Scan on reading
   Filter: ((value > '21'::double precision) AND (sat_id = 'SAT-001'::text))
(2 rows)
```

With `AS MATERIALIZED`, the fence is back. The CTE is computed on its own, and the satellite filter is applied afterwards to its stored rows (a "CTE Scan"):

```text
                     QUERY PLAN
----------------------------------------------------
 CTE Scan on hot
   Filter: (sat_id = 'SAT-001'::text)
   CTE hot
     ->  Seq Scan on reading
           Filter: (value > '21'::double precision)
(5 rows)
```

On six rows this makes no difference. On a reading table with a billion rows and an index on `sat_id`, it can be the difference between milliseconds and minutes. So for a query that runs thousands of times a day, look at the plan.

SQLite has supported `WITH` since version 3.8.3 (2014), including inside `CREATE VIEW`, so everything in this lesson works in [[the exercises|sqlite-cte]]. It decides for itself whether to inline, and since version 3.35 it accepts the same `MATERIALIZED` and `NOT MATERIALIZED` hints.

::: key Readable first, then check the plan
A CTE changes how a query reads, not what it returns. PostgreSQL 12 and later inline a CTE used once; a CTE used more than once, or marked `AS MATERIALIZED`, is computed on its own first and acts as an optimisation fence. For a hot query, run `EXPLAIN` and choose `MATERIALIZED` or `NOT MATERIALIZED` on purpose.
:::

## Check yourself

::: check
Rewrite this nested query as chained CTEs with two steps, `counts` and `busy`, then attach names. What does it return on the lesson's six readings?

```sql
SELECT s.name, c.n
FROM (SELECT sat_id, COUNT(*) AS n FROM reading GROUP BY sat_id) AS c
JOIN satellite AS s ON s.sat_id = c.sat_id
WHERE c.n >= 2
ORDER BY s.name;
```
:::

::: answer
Name the count step, then the filter step, then attach names in the main query:

```sql
WITH counts AS (
    SELECT sat_id, COUNT(*) AS n
    FROM reading
    GROUP BY sat_id
),
busy AS (
    SELECT sat_id, n
    FROM counts
    WHERE n >= 2
)
SELECT s.name, b.n
FROM busy AS b
JOIN satellite AS s ON s.sat_id = b.sat_id
ORDER BY s.name;
```

```text
   name   | n
----------+---
 Aurora   | 3
 Borealis | 2
(2 rows)
```

Aurora has three readings and Borealis two, so both pass `n >= 2`. Cirrus has one and is dropped. Dorado has none, so it never reaches `counts` at all.
:::

::: check
This query fails in PostgreSQL. Find both mistakes.

```sql
WITH daily AS (
    SELECT sat_id, substr(ts, 1, 10) AS day, AVG(value) AS mean_temp
    FROM reading GROUP BY sat_id, substr(ts, 1, 10)
),
WITH fleet AS (
    SELECT AVG(mean_temp) AS fleet_mean FROM daily
),
SELECT * FROM fleet;
```
:::

::: answer
First, the second step repeats `WITH`. Only the first CTE is introduced by `WITH`; the second is `fleet AS (…)`. Second, there is a comma after the last CTE's closing bracket. The main SELECT follows directly, with no comma. Fixed, it returns one row, `fleet_mean` = 20.75.
:::

::: check
A teammate rewrites the hot-days query so that `fleet` is `SELECT AVG(value) AS fleet_mean FROM reading WHERE channel = 'BUS_TEMP'`. The two-way EXCEPT check against `v_nested` gives 0 and 0, with 2 rows each. Then Dorado sends one reading, 20.8 °C, on 2 March. Do the two versions still agree?
:::

::: answer
No. Work out both baselines with Dorado's reading added.

The correct baseline averages the five daily means 22, 30, 20, 11 and 20.8: $(83 + 20.8) / 5 = 103.8 / 5 = 20.76$. Dorado's 20.8 is above it, so the correct query returns three rows: Aurora twice and Dorado.

The teammate's baseline averages the seven raw readings: $(125 + 20.8) / 7 = 145.8 / 7 \approx 20.83$. Dorado's 20.8 is below it, so their query returns only Aurora's two rows.

Now `v_nested EXCEPT v_teammate` returns Dorado's row. The first check passed only because the original data had no satellite-day between the two baselines.
:::

::: check
In PostgreSQL 16, a CTE named `daily` is used by two later steps. Is it computed once or twice? What would you write to make the planner treat each use like a pasted-in subquery instead?
:::

::: answer
Once. A CTE referenced more than once is materialised: computed on its own, its rows stored, and both later steps read the stored rows. To ask for inlining instead, write `daily AS NOT MATERIALIZED (…)`. Then each use is planned as if the query had been pasted in, which lets filters from each use reach the scan of `reading`, at the price of doing the work twice. Which is faster depends on the data, so compare the plans with `EXPLAIN`.
:::

::: check
Why does the lesson's proof use two EXCEPT queries *and* two row counts, instead of only `v_nested EXCEPT v_cte`?
:::

::: answer
`v_nested EXCEPT v_cte` being empty only shows that every old row is also in the new result. The new query could still return extra rows, which only `v_cte EXCEPT v_nested` would reveal. Even both directions together only compare the sets of distinct rows: if one version returned a row twice and the other once, both would be empty. Comparing the row counts catches that last case.
:::

## Summary

| Idea | Form | What it gives you |
| --- | --- | --- |
| CTE | `WITH name AS (query) SELECT … FROM name` | a named step that lives for one statement |
| column list | `WITH name (c1, c2) AS (…)` | names the step's columns in order |
| chain | `WITH a AS (…), b AS (… FROM a …) SELECT …` | steps in reading order; each can use the ones above |
| reuse | two steps both read `daily` | one definition, no copy to drift |
| debug | swap the main query for `SELECT * FROM step` | test each step against hand-worked numbers |
| proof of a rewrite | counts equal, `A EXCEPT B` and `B EXCEPT A` both empty | same rows, same number of rows |
| cost | PostgreSQL ≥ 12 inlines a single-use CTE; multi-use or `MATERIALIZED` is a fence | check `EXPLAIN` for hot queries |
| SQLite | `WITH` since 3.8.3, also inside `CREATE VIEW` | works in the exercises |

Every CTE in this lesson could only look at steps above it. Next lesson breaks that rule on purpose: a **recursive** CTE refers to itself, which lets one query walk down a tree of parts of any depth and generate a row for every hour of a day, so gaps in telemetry show up as rows instead of disappearing.

::: context derived-table The name after the brackets
Until version 16, PostgreSQL required every derived table to have a name, so the `AS kelvin` after the closing bracket was compulsory there; SQLite and PostgreSQL 16 let you leave it off. Keep it anyway. The name is how the outer query talks about the derived table's columns (`kelvin.temp_k`), and it is the first hint to a reader of what the brackets hold. A CTE is the same idea with the name moved to the front, where a reader meets it before the query rather than after.
:::

::: context pipeline-picture The chain as a pipeline
Each box is one named step; each arrow says "reads from". Notice that `daily` feeds two later steps. In the nested version, that fork had to be written as two copies of the same subquery.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ah09" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/>
    </marker>
  </defs>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="8" y="66" width="62" height="30" rx="4" fill="#ffffff"/>
    <rect x="96" y="66" width="62" height="30" rx="4" fill="#8fb8f0"/>
    <rect x="186" y="20" width="62" height="30" rx="4" fill="#8fb8f0"/>
    <rect x="186" y="112" width="70" height="30" rx="4" fill="#8fb8f0"/>
    <rect x="284" y="112" width="68" height="30" rx="4" fill="#f2b880"/>
    <rect x="284" y="20" width="68" height="30" rx="4" fill="#ffffff"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5" fill="none" marker-end="url(#ah09)">
    <line x1="70" y1="81" x2="94" y2="81"/>
    <line x1="158" y1="76" x2="184" y2="42"/>
    <line x1="158" y1="88" x2="184" y2="122"/>
    <line x1="217" y1="50" x2="217" y2="110"/>
    <line x1="256" y1="127" x2="282" y2="127"/>
    <line x1="318" y1="50" x2="318" y2="110"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="39" y="85">reading</text>
    <text x="127" y="85">daily</text>
    <text x="217" y="39">fleet</text>
    <text x="221" y="131">hot_days</text>
    <text x="318" y="131">final</text>
    <text x="318" y="39">satellite</text>
    <text x="39" y="112">table</text>
    <text x="318" y="160">main query</text>
  </g>
</svg>
```
:::

::: context code-review Queries get reviewed like flight code
On a flight software or operations team, a query that feeds a report people act on — a daily battery-health summary, a list of satellites due for a manoeuvre — is stored in version control and changed through a review, the same as code that flies. A second engineer reads the change and has to be convinced it is right before it merges. A reviewer can check a chain of named steps one at a time; a four-level nest mostly gets a shrug and an approval, which is how wrong numbers reach a status meeting.
:::

::: context except-both-ways Two empty differences mean the same rows
Picture each result as a circle of rows. `A EXCEPT B` is the part of A outside B; `B EXCEPT A` is the part of B outside A. If both crescents are empty, the circles cover exactly the same rows.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="62" r="46" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="210" cy="62" r="46" fill="#8fb8f0" fill-opacity="0.5" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="130" y="66">A only</text>
    <text x="230" y="66">B only</text>
    <text x="150" y="12">v_nested (A)</text>
    <text x="222" y="124">v_cte (B)</text>
  </g>
  <g font-size="11" fill="#b4232c" text-anchor="start">
    <text x="4" y="40">A EXCEPT B</text>
    <text x="4" y="56">must be empty</text>
    <text x="270" y="40">B EXCEPT A</text>
    <text x="270" y="56">must be empty</text>
  </g>
</svg>
```

When both are empty, the two circles would sit exactly on top of each other. The row counts then check that no row appears more times in one result than in the other.
:::

::: context float-order Why adding in a different order can change a sum
A computer stores a number like 0.1 in binary, and most decimals cannot be written exactly in binary, so each is stored slightly off. Adding rounds again at every step. In Python, `(0.1 + 0.2) + 0.3` gives `0.6000000000000001`, while `0.1 + (0.2 + 0.3)` gives `0.6`. A database summing a million readings in a different order, after a rewrite changed the plan, can land on a different last digit the same way. It is not a bug in either query; it is how floating point works (lesson 06 of the last module).
:::

::: context fence Why it is called a fence
A planner improves a query by moving work around: pushing a filter down so it runs before a join, or using an index because a later condition narrows the rows. A fence is a boundary it will not move work across. When a CTE is materialised, its query is planned on its own, and the conditions written in the main query stay on the outside.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="16">inlined</text>
    <text x="270" y="16">materialised</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="20" y="40" width="140" height="70" rx="4" fill="#8fb8f0"/>
    <rect x="200" y="30" width="140" height="36" rx="4" fill="#ffffff"/>
    <rect x="200" y="96" width="140" height="36" rx="4" fill="#8fb8f0"/>
  </g>
  <line x1="200" y1="81" x2="350" y2="81" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 4"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="64">one scan of reading</text>
    <text x="90" y="82">value &gt; 21 AND</text>
    <text x="90" y="98">sat_id = 'SAT-001'</text>
    <text x="270" y="52">sat_id = 'SAT-001'</text>
    <text x="270" y="112">scan: value &gt; 21</text>
    <text x="196" y="85" text-anchor="end" fill="#b4232c">fence</text>
  </g>
</svg>
```
:::

::: context pg12 The PostgreSQL 12 change
PostgreSQL 12 came out in October 2019. Before it, every CTE was materialised, and experienced PostgreSQL users learned to avoid CTEs in performance-critical queries, or to use them on purpose as a fence to force a plan. Version 12 made single-use CTEs inline by default and added the `MATERIALIZED` and `NOT MATERIALIZED` keywords so the old behaviour is still available when you want it. Older blog posts that say "CTEs are always a fence in PostgreSQL" describe the world before 2019.
:::

::: context sqlite-cte CTEs in the exercises
The exercises run on SQLite compiled into the browser (sql.js), and every exercise asks you to create a view called `answer`. `CREATE VIEW answer AS WITH … SELECT …` is valid SQLite. So if an exercise has several steps, you can write them as a chain of CTEs inside the view, test each step by selecting from it, and then put the final SELECT back.
:::
