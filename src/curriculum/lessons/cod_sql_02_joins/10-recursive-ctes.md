---
id: l10-recursive-ctes
title: "Recursive CTEs: hierarchies and gap-filling"
minutes: 22
covers:
  - Recursive CTEs for hierarchies and for gap-filling a time series
---

Think of the folders on a computer. A folder holds files and other folders, and those folders hold more folders. If someone asks "what is inside *Projects*, all the way down?", you cannot answer with a fixed number of steps, because you do not know how deep it goes. You open a folder, then open everything inside it, then everything inside *those*, and you stop when a round turns up nothing new.

Every query you have written so far has a fixed number of steps. A join goes one level. Two joins go two levels. That is no good for a question whose depth depends on the data. This lesson teaches the **[[recursive|recursion-word]] CTE**: a CTE that refers to its own result, so the database can repeat a step round after round until there is nothing left to add.

Satellite teams need this for two very different jobs. The first is a **hierarchy**: a spacecraft is built from subsystems, which are built from assemblies and parts, and you want everything under one node, or above it. The second is **gap-filling**: a report that must show every hour of a day, including the hours when a satellite sent nothing. The data cannot give you rows for hours that are not there, so you have to make those rows. A recursive CTE can do both.

## A query that uses its own output

Start with the smallest recursive CTE there is, one that counts from 1 to 5:

```sql
WITH RECURSIVE counter (k) AS (
    SELECT 1
    UNION ALL
    SELECT k + 1
    FROM counter
    WHERE k < 5
)
SELECT k FROM counter;
```

```text
 k
---
 1
 2
 3
 4
 5
(5 rows)
```

Read the first line aloud as "with recursive counter, of k, as…". The parts are:

- `WITH RECURSIVE` says that at least one CTE in this list may refer to itself.
- `counter (k)` names the CTE and its one column, `k`.
- `SELECT 1` is the **anchor member** — the starting rows. It does not mention `counter`.
- `UNION ALL` joins the anchor to the next part. (Lesson 11 teaches UNION ALL properly. Here it means "add these rows to the result".)
- `SELECT k + 1 FROM counter WHERE k < 5` is the **recursive member** — the step that is repeated. It reads from `counter` itself.

The key question is: which rows of `counter` does the recursive member see? Not the whole growing result. It sees **[[only the rows made in the round before|working-table]]**. That is what makes the process walk forward instead of going back over old ground. Here is every round:

| Round | Rows the step reads | Rows it makes |
| --- | --- | --- |
| 0 (anchor) | — | 1 |
| 1 | 1 | 2 |
| 2 | 2 | 3 |
| 3 | 3 | 4 |
| 4 | 4 | 5 |
| 5 | 5 | none, because `5 < 5` is false |

The moment a round makes no rows, the recursion stops. The result is every row from every round, stacked: 1, 2, 3, 4, 5.

::: key How WITH RECURSIVE runs
`WITH RECURSIVE name (cols) AS (anchor UNION ALL recursive_step)`. The anchor runs once and gives the first rows. Then the recursive step runs again and again, each time reading only the rows the previous round produced. It stops when a round produces no rows. The CTE's result is all the rows from all the rounds.
:::

The `WHERE k < 5` is doing a vital job: it is the only thing that ever makes a round come back empty. Delete it and each round makes one new row forever. You will come back to that danger later in this lesson, because in real data the stop condition is not always a line you wrote yourself.

## Walking down a tree

Here is Aurora, broken into parts. Each row of the `component` table names one part and the part it sits inside, its **parent**:

```sql
CREATE TABLE component (
    comp_id   TEXT PRIMARY KEY,
    parent_id TEXT REFERENCES component(comp_id),
    name      TEXT NOT NULL
);
```

```text
 comp_id | parent_id |       name
---------+-----------+-------------------
 AUR     |           | Aurora spacecraft
 EPS     | AUR       | Electrical power
 BAT     | EPS       | Battery pack
 SA      | EPS       | Solar array
 SA-A    | SA        | Solar string A
 SA-B    | SA        | Solar string B
 ADCS    | AUR       | Attitude control
 RW      | ADCS      | Reaction wheels
 ST      | ADCS      | Star tracker
 TTC     | AUR       | Radio
```

This way of storing a tree is called an **[[adjacency list|adjacency-list]]**: every row points to its parent, and the one row with no parent (a NULL `parent_id`) is the **root**, the top of the tree. `EPS` is the electrical power system; `ADCS` is the attitude determination and control system, which points the spacecraft using [[reaction wheels and a star tracker|adcs-parts]].

A self-join (lesson 01) finds a part's children, one level down; two find grandchildren. But a real part list can be ten levels deep. So you recurse:

```sql
WITH RECURSIVE tree (comp_id, name, depth, path) AS (
    SELECT comp_id, name, 0, '/' || comp_id || '/'
    FROM component
    WHERE parent_id IS NULL
    UNION ALL
    SELECT c.comp_id, c.name, t.depth + 1, t.path || c.comp_id || '/'
    FROM component AS c
    JOIN tree AS t ON c.parent_id = t.comp_id
)
SELECT depth, path, name
FROM tree
ORDER BY path;
```

```text
 depth |       path        |       name
-------+-------------------+-------------------
     0 | /AUR/             | Aurora spacecraft
     1 | /AUR/ADCS/        | Attitude control
     2 | /AUR/ADCS/RW/     | Reaction wheels
     2 | /AUR/ADCS/ST/     | Star tracker
     1 | /AUR/EPS/         | Electrical power
     2 | /AUR/EPS/BAT/     | Battery pack
     2 | /AUR/EPS/SA/      | Solar array
     3 | /AUR/EPS/SA/SA-A/ | Solar string A
     3 | /AUR/EPS/SA/SA-B/ | Solar string B
     1 | /AUR/TTC/         | Radio
(10 rows)
```

Walk through the rounds:

- **Anchor.** The one part with no parent: `AUR`, at depth 0, with path `/AUR/`.
- **Round 1.** The step joins `component` to last round's rows on `c.parent_id = t.comp_id`: "find the parts whose parent is a part I found last time". Last time found `AUR`, so this round finds its three children, `EPS`, `ADCS` and `TTC`, at depth 1.
- **Round 2.** Children of those three: `BAT` and `SA` (inside EPS), `RW` and `ST` (inside ADCS). `TTC` has no children. Four rows at depth 2.
- **Round 3.** Children of those four: only `SA` has any, `SA-A` and `SA-B`. Two rows at depth 3.
- **Round 4.** The solar strings have no children. The round is empty, so the recursion stops.

Sanity check: $1 + 3 + 4 + 2 = 10$ rows, one per row of `component`. Every part is reached exactly once, as it should be in a tree.

Two extra columns ride along. `depth` counts the levels: each round adds 1 to its parent's depth. `path` is the chain of ids from the root, built by gluing each child's id onto its parent's path with `||` (read "concatenate", or "glued to"). Sorting by `path` puts every part directly under its parent, the way a file browser lists folders.

::: example Everything inside the power system
**Question.** An engineer is writing a test plan for the electrical power system and needs every part inside it, at any depth.

**Think first.** Under EPS are the battery and the solar array, and under the array are two strings. With EPS itself, that should be 5 rows.

**Change only the anchor.** Start from `EPS` instead of the root. The recursive step does not change at all:

```sql
WITH RECURSIVE tree (comp_id, name, depth) AS (
    SELECT comp_id, name, 0
    FROM component
    WHERE comp_id = 'EPS'
    UNION ALL
    SELECT c.comp_id, c.name, t.depth + 1
    FROM component AS c
    JOIN tree AS t ON c.parent_id = t.comp_id
)
SELECT depth, comp_id, name
FROM tree
ORDER BY depth, comp_id;
```

```text
 depth | comp_id |       name
-------+---------+------------------
     0 | EPS     | Electrical power
     1 | BAT     | Battery pack
     1 | SA      | Solar array
     2 | SA-A    | Solar string A
     2 | SA-B    | Solar string B
(5 rows)
```

**Check.** Five rows, as predicted. Depth now counts from EPS, so the strings are at depth 2 here and at depth 3 in the full tree. Nothing from ADCS or the radio appears, because the walk only ever follows parent-to-child links that start at EPS.
:::

The same query works for any tree stored as parent pointers. A fleet is a tree, too: a constellation holds orbital planes, and each plane holds satellites.

### Walking up

Turn the join around and you climb instead of descend. Start at one part and repeatedly look up its parent. This answers "if solar string B fails, which assemblies above it are affected?":

```sql
WITH RECURSIVE up (comp_id, parent_id, name, steps) AS (
    SELECT comp_id, parent_id, name, 0
    FROM component
    WHERE comp_id = 'SA-B'
    UNION ALL
    SELECT c.comp_id, c.parent_id, c.name, u.steps + 1
    FROM component AS c
    JOIN up AS u ON c.comp_id = u.parent_id
)
SELECT steps, comp_id, name FROM up ORDER BY steps;
```

```text
 steps | comp_id |       name
-------+---------+-------------------
     0 | SA-B    | Solar string B
     1 | SA      | Solar array
     2 | EPS     | Electrical power
     3 | AUR     | Aurora spacecraft
(4 rows)
```

The only change is the join: `c.comp_id = u.parent_id` means "find the part that is my parent". Each round finds exactly one row, and the walk stops at `AUR`, whose parent is NULL. `NULL = anything` is never true (lesson 05 of the last module), so round 4 is empty.

::: key What a recursive CTE is good for in telemetry
Generating a dense series of time buckets to left-join against, so gaps appear as rows with NULL rather than as missing rows. Also hierarchies, such as a subsystem containment tree.
:::

## Guarding against infinite recursion

A tree has no loops: follow parents upward and you always reach the root. But one bad row can make a loop.

Suppose someone mistypes an update and sets the parent of `EPS` to `BAT`. Now EPS is inside the battery, and the battery is inside EPS. Walk down from EPS and the rounds go EPS, then BAT and SA, then EPS again (because EPS's parent is now BAT), then BAT and SA again, and so on. No round is ever empty. In PostgreSQL the query runs until something stops it from outside:

```text
ERROR:  canceling statement due to statement timeout
```

That error only appeared because a **[[statement timeout|statement-timeout]]** of 2 seconds had been set. Without one, the query runs until the server runs out of memory or disk for the growing result. SQLite has no timeout by default, so there it keeps going until memory runs out or you cancel it.

You cannot always trust the data to be a tree, so put a guard in the recursive step. There are two common ones.

**A depth limit.** Add `WHERE t.depth < 6` to the recursive step. No round can go past depth 6, so the recursion must stop. With the bad row in place, walking down from EPS gives 16 rows, with EPS, BAT and SA each showing up again and again at depths 0 to 6. The query ends, which is the point, but the answer is still wrong. A depth limit is a seat belt, not a fix. Set it well above the deepest real tree, so that it only ever fires on bad data.

**A visited check.** Keep the path, and refuse to step onto a part that is already on it:

```sql
WITH RECURSIVE tree (comp_id, depth, path) AS (
    SELECT comp_id, 0, '/' || comp_id || '/'
    FROM component
    WHERE comp_id = 'EPS'
    UNION ALL
    SELECT c.comp_id, t.depth + 1, t.path || c.comp_id || '/'
    FROM component AS c
    JOIN tree AS t ON c.parent_id = t.comp_id
    WHERE t.path NOT LIKE '%/' || c.comp_id || '/%'
)
SELECT depth, comp_id, path FROM tree ORDER BY path;
```

```text
 depth | comp_id |     path
-------+---------+---------------
     0 | EPS     | /EPS/
     1 | BAT     | /EPS/BAT/
     1 | SA      | /EPS/SA/
     2 | SA-A    | /EPS/SA/SA-A/
     2 | SA-B    | /EPS/SA/SA-B/
(5 rows)
```

When the step tries to go from BAT back to EPS, the path is `/EPS/BAT/`, which already contains `/EPS/`. The condition is false, the row is not made, and the loop is cut. The slashes around each id matter: without them, a part called `SA` would look like it is already inside the path `/SA-A/`. This query runs in both PostgreSQL and SQLite.

PostgreSQL 14 and later can do the visited check for you. Put `CYCLE comp_id SET is_cycle USING visited` after the CTE's closing bracket. It adds a column `is_cycle` that is true on the row where a loop closes, and it does not recurse past that row.

::: warning The loop can be in the data, not in your query
A recursive CTE that is correct on a clean tree can hang on a table with one bad row. Any recursive query that runs over data people edit — part lists, network maps, org charts — needs a guard: a depth limit, a visited check on the path, or PostgreSQL's `CYCLE` clause. And a query that hits the depth limit is telling you the data has a loop; do not treat its rows as an answer.
:::

## Gap-filling a time series

Now the second job. Aurora's battery voltage channel, `BATT_V`, sends a sample about every half hour. On 1 March the samples are:

```text
          ts          | value
----------------------+-------
 2026-03-01T00:00:00Z |  28.1
 2026-03-01T00:30:00Z |    28
 2026-03-01T01:00:00Z |  27.9
 2026-03-01T01:30:00Z |  27.9
 2026-03-01T04:00:00Z |  27.6
 2026-03-01T04:30:00Z |  27.7
 2026-03-01T05:00:00Z |  27.8
```

Between 01:30 and 04:00 there is nothing. Perhaps the satellite was out of contact with every ground station. An hourly summary built the usual way hides that completely:

```sql
SELECT substr(ts, 1, 13) AS hour, COUNT(*) AS n
FROM reading
WHERE sat_id = 'SAT-001' AND channel = 'BATT_V'
GROUP BY substr(ts, 1, 13)
ORDER BY hour;
```

```text
     hour      | n
---------------+---
 2026-03-01T00 | 2
 2026-03-01T01 | 2
 2026-03-01T04 | 2
 2026-03-01T05 | 1
(4 rows)
```

Hours 02 and 03 are not in the result with a count of zero. They are not in the result at all. GROUP BY makes one row per group that *exists*, and no reading means no group. A chart drawn from these four rows would [[draw a straight line from 01:00 to 04:00|charts-lie]], as if the satellite had reported the whole time.

This is the difference between a **NULL** and a **missing row**. A NULL is a row that is there with an empty box in it; you can find it, count it, or replace it with COALESCE. A missing row is not there, and nothing you do to the rows you have will create it. The fix is to make the rows yourself: first build a **dense series** — every hour in the window, one row each, whether or not any data exists — and then LEFT JOIN the readings onto it. A left join keeps every row on the left (lesson 01), so every hour survives, and the hours with no readings get NULLs.

### In PostgreSQL: generate_series

PostgreSQL has a built-in function for the series. `generate_series(start, stop, step)` returns one row for each value from start to stop, counting by step, with both ends included:

```sql
SELECT hour_start
FROM generate_series(timestamptz '2026-03-01 00:00:00+00',
                     timestamptz '2026-03-01 05:00:00+00',
                     interval '1 hour') AS hour_start;
```

```text
       hour_start
------------------------
 2026-03-01 00:00:00+00
 2026-03-01 01:00:00+00
 2026-03-01 02:00:00+00
 2026-03-01 03:00:00+00
 2026-03-01 04:00:00+00
 2026-03-01 05:00:00+00
(6 rows)
```

(The session's time zone is set to UTC with `SET TIME ZONE 'UTC'`, so times print in UTC, as lesson 07 of the last module recommends.) Now put the series in a CTE and left-join the readings onto it:

```sql
WITH hours AS (
    SELECT hour_start
    FROM generate_series(timestamptz '2026-03-01 00:00:00+00',
                         timestamptz '2026-03-01 05:00:00+00',
                         interval '1 hour') AS hour_start
)
SELECT h.hour_start,
       COUNT(r.value)                  AS n,
       ROUND(AVG(r.value)::numeric, 2) AS mean_v
FROM hours AS h
LEFT JOIN reading AS r
       ON r.sat_id = 'SAT-001'
      AND r.channel = 'BATT_V'
      AND r.ts::timestamptz >= h.hour_start
      AND r.ts::timestamptz <  h.hour_start + interval '1 hour'
GROUP BY h.hour_start
ORDER BY h.hour_start;
```

```text
       hour_start       | n | mean_v
------------------------+---+--------
 2026-03-01 00:00:00+00 | 2 |  28.05
 2026-03-01 01:00:00+00 | 2 |  27.90
 2026-03-01 02:00:00+00 | 0 |
 2026-03-01 03:00:00+00 | 0 |
 2026-03-01 04:00:00+00 | 2 |  27.65
 2026-03-01 05:00:00+00 | 1 |  27.80
(6 rows)
```

Six rows, one per hour. The gap is now visible: two rows with a count of 0 and an empty mean.

Look at how the join matches a reading to an hour. The condition is a **half-open window**: at or after the start of the hour, and strictly before the start of the next one. A reading at exactly 05:00 belongs to the 05:00 hour and to no other. `r.ts::timestamptz` turns the stored ISO text into a timestamp to compare with the series. `COUNT(r.value)` counts only the rows where a reading was found (lesson 03), which is what turns an empty hour into 0.

::: warning Keep the reading filters in ON
Every condition on `reading` — the satellite, the channel, the time window — goes in the ON clause. If you move `r.sat_id = 'SAT-001' AND r.channel = 'BATT_V'` into a WHERE, the empty hours carry NULL in those columns, fail the test, and vanish. The result goes back to four rows and the gap is hidden again: the left join has turned back into an inner join (lesson 01). Likewise, use `COUNT(r.value)`, not `COUNT(*)`: an empty hour is still one row after the left join, so `COUNT(*)` would report 1 reading where there were none.
:::

### In SQLite: WITH RECURSIVE

SQLite supports `WITH RECURSIVE` (since version 3.8.3). `generate_series` is not part of SQLite's core library (the command-line shell adds one as an extension), so you cannot count on it in the exercises. Grow the series with a recursive CTE instead. SQLite also has no timestamp type; the times are ISO-8601 text. Its `strftime` function can add an hour to such a string and write the answer back in the same format:

```sql
WITH RECURSIVE hours (hour_start) AS (
    SELECT '2026-03-01T00:00:00Z'
    UNION ALL
    SELECT strftime('%Y-%m-%dT%H:%M:%SZ', hour_start, '+1 hour')
    FROM hours
    WHERE hour_start < '2026-03-01T05:00:00Z'
)
SELECT h.hour_start,
       COUNT(r.value)         AS n,
       ROUND(AVG(r.value), 2) AS mean_v
FROM hours AS h
LEFT JOIN reading AS r
       ON r.sat_id = 'SAT-001'
      AND r.channel = 'BATT_V'
      AND r.ts >= h.hour_start
      AND r.ts <  strftime('%Y-%m-%dT%H:%M:%SZ', h.hour_start, '+1 hour')
GROUP BY h.hour_start
ORDER BY h.hour_start;
```

```text
      hour_start      | n | mean_v
----------------------+---+--------
 2026-03-01T00:00:00Z | 2 |  28.05
 2026-03-01T01:00:00Z | 2 |   27.9
 2026-03-01T02:00:00Z | 0 |
 2026-03-01T03:00:00Z | 0 |
 2026-03-01T04:00:00Z | 2 |  27.65
 2026-03-01T05:00:00Z | 1 |   27.8
(6 rows)
```

Read the `strftime` call as "format this time as year-month-day T hour:minute:second Z, after adding one hour". The recursive step makes the next hour from the last one; the WHERE stops it once the last hour made is 05:00. Because the ISO text sorts in time order, plain text comparisons work for both the stop test and the join. The numbers are the ones PostgreSQL gave (laid out here in the same table style); only the way the time and the trailing zeros are written differs.

The same pattern works at any step. Change `'+1 hour'` to `'+1 minute'` and the stop to `'2026-03-01T23:59:00Z'`, and you get $24 \times 60 = 1440$ rows, one for every minute of the day. A per-minute grid is how teams find [[short dropouts|minute-grid]] that an hourly count would average away.

::: example Every satellite, every day
**Question.** For 1 to 3 March, show each satellite's number of bus-temperature readings per day, with zero for a day when it sent nothing. A satellite with no data at all must still appear.

**Think first.** Four satellites and three days make $4 \times 3 = 12$ rows. The six readings are spread over 1 and 2 March, so the counts must add up to 6, and every 3 March row must be 0.

**Build the grid.** Make the days with a recursive CTE, then CROSS JOIN them to `satellite` (lesson 01) so every satellite gets every day. Then LEFT JOIN the readings onto that grid. This is SQLite; `date(day, '+1 day')` moves a date string forward one day:

```sql
WITH RECURSIVE days (day) AS (
    SELECT '2026-03-01'
    UNION ALL
    SELECT date(day, '+1 day')
    FROM days
    WHERE day < '2026-03-03'
)
SELECT s.name, d.day, COUNT(r.value) AS n
FROM satellite AS s
CROSS JOIN days AS d
LEFT JOIN reading AS r
       ON r.sat_id = s.sat_id
      AND r.channel = 'BUS_TEMP'
      AND substr(r.ts, 1, 10) = d.day
GROUP BY s.name, d.day
ORDER BY s.name, d.day;
```

```text
   name   |    day     | n
----------+------------+---
 Aurora   | 2026-03-01 | 2
 Aurora   | 2026-03-02 | 1
 Aurora   | 2026-03-03 | 0
 Borealis | 2026-03-01 | 2
 Borealis | 2026-03-02 | 0
 Borealis | 2026-03-03 | 0
 Cirrus   | 2026-03-01 | 0
 Cirrus   | 2026-03-02 | 1
 Cirrus   | 2026-03-03 | 0
 Dorado   | 2026-03-01 | 0
 Dorado   | 2026-03-02 | 0
 Dorado   | 2026-03-03 | 0
(12 rows)
```

**Check.** Twelve rows, as predicted. The counts add up to $2 + 1 + 2 + 1 = 6$, every reading. Dorado has three rows of zeros instead of disappearing, and the whole of 3 March is visible as a day with no data. In PostgreSQL the days CTE is `SELECT DATE '2026-03-01' UNION ALL SELECT day + 1 FROM days WHERE day < DATE '2026-03-03'`, and the join compares `substr(r.ts, 1, 10)` with `d.day::text`; the output is the same twelve rows.
:::

## Check yourself

::: check
The counter CTE is changed to `WHERE k < 10`. How many rows does it return, and in which round does it stop? What happens if the WHERE line is deleted?
:::

::: answer
It returns 10 rows, the numbers 1 to 10. The anchor makes 1; rounds 1 to 9 make 2 to 10; in round 10 the step reads the row 10, `10 < 10` is false, no row is made, and the recursion stops.

Without the WHERE, every round makes exactly one new row from the one before, so no round is ever empty and the query never stops on its own.
:::

::: check
Using the walk-down query, change the anchor to `WHERE comp_id = 'ADCS'`. How many rows come back, and at what depths?
:::

::: answer
Three rows. The anchor gives `ADCS` at depth 0. Round 1 finds its children, `RW` and `ST`, at depth 1. Neither has children, so round 2 is empty and the recursion stops.
:::

::: check
You want every hour of 1 March, from `'2026-03-01T00:00:00Z'` through `'2026-03-01T23:00:00Z'`, from the SQLite recursive CTE. What should the stop condition be, and how many rows will you get? Why is it not `WHERE hour_start <= '2026-03-01T23:00:00Z'`?
:::

::: answer
`WHERE hour_start < '2026-03-01T23:00:00Z'`, giving 24 rows (00:00 to 23:00).

The condition is tested on the row from the previous round, before the new one is made. When the last row made is 22:00, `22:00 < 23:00` is true, so 23:00 is made. When the last row is 23:00, the test is false and nothing more is made. With `<=`, the round that reads 23:00 would pass the test and make 00:00 on 2 March, a 25th row.
:::

::: check
In the PostgreSQL gap-filling query, a teammate writes `COUNT(*)` instead of `COUNT(r.value)`. What does the 02:00 row show, and why?
:::

::: answer
It shows 1. After the left join, the 02:00 hour is still one row, with every `reading` column NULL. `COUNT(*)` counts rows, so it counts that row. `COUNT(r.value)` counts only rows where `r.value` is not NULL, so it gives the honest answer, 0.
:::

::: check
With the looped data (EPS's parent set to BAT), a colleague guards the walk down from EPS with `WHERE t.depth < 6` only. The query returns 16 rows. Is the report safe to use? What would the visited check return?
:::

::: answer
No. The query stopped, but the 16 rows repeat EPS, BAT and SA at every depth from 0 to 6: they describe going round the loop, not the real contents of EPS. The depth guard kept the database safe; it did not make the answer right. The fact that rows reached the depth limit at all is the signal that the data has a loop.

The visited check returns 5 rows (EPS, BAT, SA, SA-A, SA-B), because the step from BAT back to EPS is refused when `/EPS/` is already in the path. The broken row still needs fixing in the table.
:::

## Summary

| Idea | Form | Notes |
| --- | --- | --- |
| recursive CTE | `WITH RECURSIVE t (cols) AS (anchor UNION ALL step)` | step reads only last round's rows; stops on an empty round |
| walk down a tree | step joins `c.parent_id = t.comp_id` | anchor at the root, or at any node for a subtree |
| walk up a tree | step joins `c.comp_id = u.parent_id` | stops at the root, whose parent is NULL |
| depth and path | depth adds 1 per round; path glues each id on with a slash | path sorts like a file browser |
| loop guards | depth limit `WHERE t.depth < N`; visited check on the path; `CYCLE … SET … USING …` (PostgreSQL 14+) | a depth guard stops the query but does not fix the answer |
| dense series (PostgreSQL) | `generate_series(start, stop, interval '1 hour')` | both ends included |
| dense series (SQLite) | recursive CTE with `strftime(…, '+1 hour')` or `date(…, '+1 day')` | ISO text compares in time order |
| gap-fill | series LEFT JOIN data, filters in ON, `COUNT(col)` | empty buckets become rows with 0 and NULL |

The recursive CTE glued its rounds together with UNION ALL. Next lesson, the last of this module, looks at UNION ALL and its relatives as tools in their own right: stacking two results, keeping only the rows two results share, and subtracting one result from another.

::: context recursion-word Where the word comes from
*Recursive* comes from the Latin *recurrere*, "to run back". A recursive definition runs back to itself. Mathematicians use it all the time: the factorial of $n$ is $n$ times the factorial of $n-1$, and the factorial of 0 is 1. The second half is the "bottom" that stops the running back. Programmers meet the same idea as a function that calls itself. The SQL version is gentler than either, because the database does the repeating for you, round by round, and only asks you for the first rows and the step.
:::

::: context working-table The rows each round works on
Inside the database, the rows a round produces are kept in a small scratch table, often called the **working table**. The next round reads only that table, then replaces it with its own new rows, while every round's rows are also added to the final result. Here are the rounds of the tree walk from later in this lesson. Each column is one working table; the arrows show which row found which.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="36" y="14">round 0</text>
    <text x="108" y="14">round 1</text>
    <text x="180" y="14">round 2</text>
    <text x="252" y="14">round 3</text>
    <text x="324" y="14">round 4</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="12" y="26" width="48" height="22" rx="3" fill="#f2b880"/>
    <rect x="84" y="26" width="48" height="22" rx="3" fill="#8fb8f0"/>
    <rect x="84" y="56" width="48" height="22" rx="3" fill="#8fb8f0"/>
    <rect x="84" y="86" width="48" height="22" rx="3" fill="#8fb8f0"/>
    <rect x="156" y="26" width="48" height="22" rx="3" fill="#ffffff"/>
    <rect x="156" y="56" width="48" height="22" rx="3" fill="#ffffff"/>
    <rect x="156" y="86" width="48" height="22" rx="3" fill="#ffffff"/>
    <rect x="156" y="116" width="48" height="22" rx="3" fill="#ffffff"/>
    <rect x="228" y="26" width="48" height="22" rx="3" fill="#ffffff"/>
    <rect x="228" y="56" width="48" height="22" rx="3" fill="#ffffff"/>
    <rect x="300" y="26" width="48" height="22" rx="3" fill="#ffffff" stroke-dasharray="4 3"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.2">
    <line x1="60" y1="37" x2="84" y2="37"/>
    <line x1="60" y1="37" x2="84" y2="67"/>
    <line x1="60" y1="37" x2="84" y2="97"/>
    <line x1="132" y1="37" x2="156" y2="37"/>
    <line x1="132" y1="37" x2="156" y2="67"/>
    <line x1="132" y1="67" x2="156" y2="97"/>
    <line x1="132" y1="67" x2="156" y2="127"/>
    <line x1="204" y1="67" x2="228" y2="37"/>
    <line x1="204" y1="67" x2="228" y2="67"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="36" y="41">AUR</text>
    <text x="108" y="41">EPS</text>
    <text x="108" y="71">ADCS</text>
    <text x="108" y="101">TTC</text>
    <text x="180" y="41">BAT</text>
    <text x="180" y="71">SA</text>
    <text x="180" y="101">RW</text>
    <text x="180" y="131">ST</text>
    <text x="252" y="41">SA-A</text>
    <text x="252" y="71">SA-B</text>
    <text x="324" y="41">empty</text>
    <text x="180" y="162">1 + 3 + 4 + 2 = 10 rows in the result</text>
  </g>
</svg>
```
:::

::: context adjacency-list Other ways to store a tree
Storing each node's parent is the simplest layout and the easiest to edit: moving the solar array to another subsystem is a one-row update. The price is that reading a whole subtree needs recursion. Other layouts make reads cheaper and edits dearer. One stores the full path as text in every row, so a subtree is a `LIKE '/AUR/EPS/%'` search; PostgreSQL has an `ltree` extension built for this. Another keeps a separate table with one row for every ancestor–descendant pair. Most telemetry databases start with parent pointers and a recursive CTE.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.3">
    <line x1="180" y1="34" x2="70" y2="74"/>
    <line x1="180" y1="34" x2="180" y2="74"/>
    <line x1="180" y1="34" x2="264" y2="74"/>
    <line x1="70" y1="94" x2="35" y2="130"/>
    <line x1="70" y1="94" x2="105" y2="130"/>
    <line x1="180" y1="94" x2="150" y2="130"/>
    <line x1="180" y1="94" x2="210" y2="130"/>
    <line x1="105" y1="150" x2="75" y2="172"/>
    <line x1="105" y1="150" x2="135" y2="172"/>
  </g>
  <g stroke="#1f2a44" stroke-width="1.2">
    <rect x="152" y="14" width="56" height="20" rx="4" fill="#f2b880"/>
    <rect x="46" y="74" width="48" height="20" rx="4" fill="#8fb8f0"/>
    <rect x="156" y="74" width="48" height="20" rx="4" fill="#8fb8f0"/>
    <rect x="240" y="74" width="48" height="20" rx="4" fill="#8fb8f0"/>
    <rect x="13" y="130" width="44" height="20" rx="4" fill="#ffffff"/>
    <rect x="83" y="130" width="44" height="20" rx="4" fill="#ffffff"/>
    <rect x="128" y="130" width="44" height="20" rx="4" fill="#ffffff"/>
    <rect x="188" y="130" width="44" height="20" rx="4" fill="#ffffff"/>
    <rect x="51" y="172" width="48" height="20" rx="4" fill="#ffffff"/>
    <rect x="111" y="172" width="48" height="20" rx="4" fill="#ffffff"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="180" y="28">AUR</text>
    <text x="70" y="88">EPS</text>
    <text x="180" y="88">ADCS</text>
    <text x="264" y="88">TTC</text>
    <text x="35" y="144">BAT</text>
    <text x="105" y="144">SA</text>
    <text x="150" y="144">RW</text>
    <text x="210" y="144">ST</text>
    <text x="75" y="186">SA-A</text>
    <text x="135" y="186">SA-B</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="end">
    <text x="352" y="28">depth 0</text>
    <text x="352" y="88">depth 1</text>
    <text x="352" y="144">depth 2</text>
    <text x="352" y="186">depth 3</text>
  </g>
</svg>
```

Each line is one row's `parent_id` pointing up. Ten boxes, ten rows.
:::

::: context adcs-parts What these parts do
A **reaction wheel** is a heavy disc spun by an electric motor. Speed it up one way and the spacecraft turns the other way, because the total spin must stay the same; three or four wheels let a satellite point anywhere without burning propellant. A **star tracker** is a small camera that photographs the stars and matches the pattern against a catalogue, telling the spacecraft which way it faces to within a few arcseconds. Together they are the heart of the attitude determination and control system.
:::

::: context statement-timeout A time limit on every query
`statement_timeout` is a PostgreSQL setting: any single statement that runs longer than the limit is cancelled with an error. `SET statement_timeout = '30s'` sets it for your session; a database administrator can set it for a user or a whole database. Operations teams set it on shared databases so that one runaway query — a missing join condition, a loop in a hierarchy — cannot tie up the server that the live telemetry dashboards also depend on.
:::

::: context charts-lie Why a line chart hides a gap
A plotting tool given the points 01:00 and 04:00, and nothing in between, draws a line segment from one to the other. On a slowly changing channel like battery voltage, that line looks perfectly believable: nothing in the picture says "no data here". With the dense series, the 02:00 and 03:00 rows carry NULL, and most tools break the line there, leaving a visible hole.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="104" y="16" width="92" height="88" fill="#f2b880" fill-opacity="0.35"/>
  <line x1="30" y1="104" x2="260" y2="104" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="40,34 60,40 80,46 100,46" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="200,64 220,58 240,52" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="100" y1="46" x2="200" y2="64" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <g fill="#1d6fd1">
    <circle cx="40" cy="34" r="3"/><circle cx="60" cy="40" r="3"/>
    <circle cx="80" cy="46" r="3"/><circle cx="100" cy="46" r="3"/>
    <circle cx="200" cy="64" r="3"/><circle cx="220" cy="58" r="3"/>
    <circle cx="240" cy="52" r="3"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="120">00</text><text x="80" y="120">01</text>
    <text x="120" y="120">02</text><text x="160" y="120">03</text>
    <text x="200" y="120">04</text><text x="240" y="120">05</text>
    <text x="150" y="30">no data</text>
  </g>
  <text x="150" y="86" font-size="11" fill="#b4232c" text-anchor="middle">drawn anyway</text>
  <g font-size="11" fill="#6c7a93" text-anchor="start">
    <text x="270" y="38">BATT_V</text>
    <text x="270" y="54">28.1 to 27.6 V</text>
    <text x="270" y="120">hour (UTC)</text>
  </g>
</svg>
```
:::

::: context minute-grid How big a minute grid gets
One satellite for one day is 1440 minute rows, which is nothing. A fleet of 6,000 satellites is $6000 \times 1440 = 8{,}640{,}000$ grid rows per day, per channel you check. That is still fine for a database, but it is why teams build the grid only for the window and the satellites a question needs, rather than for all time. A common pattern is a small table of one row per minute, built once and reused, instead of generating it inside every query.
:::
