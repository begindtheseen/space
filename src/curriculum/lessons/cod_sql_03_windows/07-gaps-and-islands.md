---
id: l07-gaps-and-islands
title: Gaps and islands
minutes: 22
covers:
  - "Gaps and islands: detecting contiguous runs"
---

Picture a street at night, seen from a plane. Some porch lights are on and some are off. You do not care about single houses. You want to know where the *stretches* of lit houses are: "numbers 4 to 9 are all lit, then 12 to 13". Each stretch is an **island** — a run of neighbors that share a property, with no break in between. The dark stretches between them are the **gaps**.

Telemetry asks this question all the time. A battery sensor reports every minute, and [[the rule|limit-checking]] says it must stay at or below 40 °C. The safety engineer does not want a list of 700 hot readings. She wants a list of *episodes*: "SAT-001 ran hot from 00:02 to 00:04, three readings, peak 41.0 °C; then again from 00:06 to 00:09". Each episode is a **[[contiguous|contiguous-word]]** run of rows — rows that follow one another in time with nothing else in between — where a limit was exceeded. Finding them is called the **[[gaps-and-islands|gaps-islands-name]]** problem.

This lesson solves it two ways with window functions you already know, and turns each island into one line with a start, an end and a duration.

## Why GROUP BY cannot find runs

Start with the table from this module's second exercise. A **reaction wheel** is a spinning flywheel a satellite uses to turn itself; spin it faster one way and the satellite turns the other way. Above 5000 rpm (revolutions per minute) it is in **[[overspeed|wheel-overspeed]]**. One sample every 10 seconds, with the time `t_s` in whole seconds:

```sql
CREATE TABLE wheel (
    sat_id TEXT    NOT NULL,
    t_s    INTEGER NOT NULL,   -- seconds since the start of the test
    rpm    REAL    NOT NULL
);

INSERT INTO wheel VALUES
  ('SAT-001', 0, 1000),('SAT-001',10, 5200),('SAT-001',20, 5300),
  ('SAT-001',30, 5400),('SAT-001',40, 1200),('SAT-001',50, 5100),
  ('SAT-001',60, 5050),('SAT-001',70,  900),
  ('SAT-002', 0, 5500),('SAT-002',10, 5600),('SAT-002',20,  100);
```

Read SAT-001's rows in order: over 5000 from 10 s to 30 s, calm at 40 s, over again at 50 s and 60 s, calm at 70 s. Two overspeed episodes. The first try most people write:

```sql
SELECT sat_id, MIN(t_s) AS t_start, MAX(t_s) AS t_end, COUNT(*) AS samples
FROM wheel
WHERE rpm > 5000
GROUP BY sat_id
ORDER BY sat_id;
```

```text
 sat_id  | t_start | t_end | samples
---------+---------+-------+---------
 SAT-001 |      10 |    60 |       5
 SAT-002 |       0 |    10 |       2
```

It reports one SAT-001 episode from 10 s to 60 s. That is wrong: at 40 s the wheel was at a calm 1200 rpm. WHERE threw that calm row away before GROUP BY ever saw it, and GROUP BY puts every surviving row with the same `sat_id` in one pile, whether or not the rows were next to each other.

The fix needs something GROUP BY does not have: a sense of *order*. Window functions have it. The plan is always the same three steps.

1. **Flag** every row: 1 if it breaks the limit, 0 if not.
2. **Label** each run with a number that is the same for every row in the run and different from run to run.
3. **Collapse** each run with an ordinary GROUP BY on that label.

Step 1 is a CASE expression. Step 3 is the GROUP BY you know. All the cleverness is in step 2.

::: key The three steps
Flag each row with the condition, give every row of a run the same label using window functions, then GROUP BY the label to get one line per run. Compute the label on all the rows, before any filtering, so the rows that break a run are still there to break it.
:::

## Method one: the difference of two row numbers

Here is the classic trick. Picture two people walking along SAT-001's samples in time order, each with a clicker counter.

- The first person clicks on **every** sample. Call their count `rn_all`.
- The second person clicks only on samples of **the same kind** as the one they are standing on: they keep one count for "over" samples and a separate count for "not over" samples. Call it `rn_kind`.

While you walk through an island of "over" samples, both people click at every step. Their counts rise together, so the difference `rn_all - rn_kind` (read "row number over all, minus row number within its kind") **[[stays the same|why-constant]]** for the whole island. When a "not over" sample interrupts, the first person clicks but the "over" count does not move. So when the next island starts, the difference has jumped to a new value. Each island gets its own constant.

In SQL both counters are ROW_NUMBER from lesson 02. The first is partitioned by satellite. The second is partitioned by satellite *and* by the flag, so it counts "over" and "not over" rows separately:

```sql
WITH flagged AS (
    SELECT sat_id, t_s, rpm,
           CASE WHEN rpm > 5000 THEN 1 ELSE 0 END AS over
    FROM wheel
)
SELECT t_s, rpm, over,
       ROW_NUMBER() OVER (PARTITION BY sat_id ORDER BY t_s)       AS rn_all,
       ROW_NUMBER() OVER (PARTITION BY sat_id, over ORDER BY t_s) AS rn_kind,
       ROW_NUMBER() OVER (PARTITION BY sat_id ORDER BY t_s)
     - ROW_NUMBER() OVER (PARTITION BY sat_id, over ORDER BY t_s) AS grp
FROM flagged
WHERE sat_id = 'SAT-001'
ORDER BY t_s;
```

```text
 t_s | rpm  | over | rn_all | rn_kind | grp
-----+------+------+--------+---------+-----
   0 | 1000 |    0 |      1 |       1 |   0
  10 | 5200 |    1 |      2 |       1 |   1
  20 | 5300 |    1 |      3 |       2 |   1
  30 | 5400 |    1 |      4 |       3 |   1
  40 | 1200 |    0 |      5 |       2 |   3
  50 | 5100 |    1 |      6 |       4 |   2
  60 | 5050 |    1 |      7 |       5 |   2
  70 |  900 |    0 |      8 |       3 |   5
```

(Filtering to SAT-001 in WHERE is safe here only because every window is partitioned by `sat_id`, so SAT-002's rows could never have changed SAT-001's numbers.)

Follow the "over" rows. At 10, 20 and 30 s the two counts are 2 and 1, 3 and 2, 4 and 3: the difference is 1 each time. At 40 s the calm reading makes `rn_all` tick to 5 while the "over" count waits at 3. At 50 and 60 s the counts are 6 and 4, 7 and 5: the difference is now 2. Two islands, labeled `grp = 1` and `grp = 2`. The name `grp` is short for "group".

::: key Gaps and islands
Finding contiguous runs of rows satisfying a condition. The classic trick is the difference between a row number over all rows and a row number over the flagged subset: within a run that difference is constant, so grouping by it isolates each island.
:::

::: note Why the difference cannot change inside a run
Take two neighboring rows in the same run. Both have the same flag, so they sit in the same `rn_kind` partition, and no row of that kind lies between them (they are neighbors). So `rn_kind` goes up by exactly 1 from the first to the second. `rn_all` also goes up by exactly 1, because they are neighbors in the whole partition. Both go up by 1, so the difference stays put.

Now take the last row of one "over" run and the first row of the next "over" run. Between them sit $k \ge 1$ rows of the other kind. `rn_all` goes up by $k + 1$, but `rn_kind` goes up by only 1. So the difference grows by $k$, which is at least 1. Differences between runs of the same kind only ever grow, so two runs of the same kind can never share a label.
:::

### Collapsing each island into one line

Now step 3. Keep the flagged rows, group by satellite and label, and read each island's edges off with MIN, MAX and COUNT. The module's second exercise does this on the `wheel` table, so here it is on battery temperatures instead.

::: example Hot-battery episodes with start, end and duration
The `batt_temp` table holds one reading a minute for two satellites. The limit is 40.0 °C: a reading above it counts as hot.

```sql
CREATE TABLE batt_temp (
    sat_id TEXT         NOT NULL,
    ts     TIMESTAMPTZ  NOT NULL,
    deg_c  NUMERIC(4,1) NOT NULL
);
-- SAT-001, 00:00 to 00:11: 38.2 39.5 40.4 41.0 40.7 39.8 40.2 40.9 41.3 40.6 39.9 39.1
-- SAT-002, 00:00 to 00:05: 40.5 40.8 39.7 39.2 38.8 40.1
```

**Think first.** SAT-001 is hot from 00:02 to 00:04 (three readings), cools at 00:05, and is hot again from 00:06 to 00:09 (four readings). SAT-002 is hot at 00:00 and 00:01, then once more at 00:05, its last reading. So we expect four islands.

**Steps 1 and 2.** Flag and label in two CTEs:

```sql
WITH flagged AS (
    SELECT sat_id, ts, deg_c,
           CASE WHEN deg_c > 40.0 THEN 1 ELSE 0 END AS hot
    FROM batt_temp
),
numbered AS (
    SELECT sat_id, ts, deg_c, hot,
           ROW_NUMBER() OVER (PARTITION BY sat_id ORDER BY ts)
         - ROW_NUMBER() OVER (PARTITION BY sat_id, hot ORDER BY ts) AS grp
    FROM flagged
)
SELECT sat_id,
       MIN(ts)           AS t_start,
       MAX(ts)           AS t_end,
       MAX(ts) - MIN(ts) AS duration,
       COUNT(*)          AS samples,
       MAX(deg_c)        AS peak_c
FROM numbered
WHERE hot = 1
GROUP BY sat_id, grp
ORDER BY sat_id, t_start;
```

**Step 3** is the outer query. The `WHERE hot = 1` runs on the CTE's output, *after* the labels were computed from all eighteen rows.

```text
 sat_id  |        t_start         |         t_end          | duration | samples | peak_c
---------+------------------------+------------------------+----------+---------+--------
 SAT-001 | 2026-03-01 00:02:00+00 | 2026-03-01 00:04:00+00 | 00:02:00 |       3 |   41.0
 SAT-001 | 2026-03-01 00:06:00+00 | 2026-03-01 00:09:00+00 | 00:03:00 |       4 |   41.3
 SAT-002 | 2026-03-01 00:00:00+00 | 2026-03-01 00:01:00+00 | 00:01:00 |       2 |   40.8
 SAT-002 | 2026-03-01 00:05:00+00 | 2026-03-01 00:05:00+00 | 00:00:00 |       1 |   40.1
```

**Sanity check.** Four islands, as predicted. The sample counts add to $3 + 4 + 2 + 1 = 10$, and there are exactly ten readings above 40.0 in the data. The durations match the clock: 00:02 to 00:04 is two minutes. The single-reading island has a duration of zero, which is a warning sign about what "duration" means; the next section deals with it.

**In SQLite**, where `ts` is ISO-8601 text, the same query works with one change: the duration is `unixepoch(MAX(ts)) - unixepoch(MIN(ts)) AS duration_s`, which gives 120, 180, 60 and 0 seconds. For the exercise's `wheel` table, where `t_s` is already a number of seconds, plain `MAX(t_s) - MIN(t_s)` does it.
:::

::: warning Label first, filter second
If you write `WHERE deg_c > 40.0` inside the CTE that computes the row numbers, the cool readings are gone before anyone counts them. Then `rn_all` and `rn_kind` count the same rows, the difference is 0 everywhere, and every hot reading of a satellite lands in one giant island — the same wrong answer GROUP BY gave. The filter on the flag belongs in the outer query, after the labels exist. This is the "window in a CTE, filter outside" shape from lesson 01.
:::

::: warning Group by the satellite, and keep only one kind
A label is only unique *within one satellite and one kind of row*. Look at SAT-001 in the example: the cool reading at 00:05 gets `grp = 3`, and so does the hot island from 00:06 to 00:09. If you forget `WHERE hot = 1` (or forget to add `hot` to the GROUP BY), those two collapse into one fake island from 00:05 to 00:09. And SAT-002's first hot island has `grp = 0`, the same number as SAT-001's first cool run. Always partition both row numbers by the satellite, and always group by `sat_id` as well as `grp`.
:::

### What "duration" should mean

A reading is a snapshot. Between two snapshots you do not know what happened. When the log says 39.8 °C at 00:05 and 40.2 °C at 00:06, the true moment the battery crossed 40.0 °C lies somewhere [[between those two samples|crossing-time]].

So there are two honest ways to state how long an episode lasted:

- **First to last hot sample**, `MAX(ts) - MIN(ts)`. This is a lower bound: the battery was certainly hot at least this long. It gives zero for a single hot sample. The exercise uses this one.
- **First hot sample to the first cool sample after it**: from when the problem was first seen to when it was seen to be over. The true time above the limit can be at most one sampling step longer than this. You get the "cleared" time with LEAD over the collapsed runs, keeping both kinds of run so that each hot run's next neighbor is the cool run that ended it:

```sql
-- all_runs: every island of either kind, one row each, with t_start and t_end
SELECT sat_id, hot, t_start, t_end,
       LEAD(t_start) OVER (PARTITION BY sat_id ORDER BY t_start) AS cleared_at
FROM all_runs
ORDER BY sat_id, t_start;
```

```text
 sat_id  | hot |        t_start         |         t_end          |       cleared_at
---------+-----+------------------------+------------------------+------------------------
 SAT-001 |   0 | 2026-03-01 00:00:00+00 | 2026-03-01 00:01:00+00 | 2026-03-01 00:02:00+00
 SAT-001 |   1 | 2026-03-01 00:02:00+00 | 2026-03-01 00:04:00+00 | 2026-03-01 00:05:00+00
 SAT-001 |   0 | 2026-03-01 00:05:00+00 | 2026-03-01 00:05:00+00 | 2026-03-01 00:06:00+00
 SAT-001 |   1 | 2026-03-01 00:06:00+00 | 2026-03-01 00:09:00+00 | 2026-03-01 00:10:00+00
 SAT-001 |   0 | 2026-03-01 00:10:00+00 | 2026-03-01 00:11:00+00 |
 SAT-002 |   1 | 2026-03-01 00:00:00+00 | 2026-03-01 00:01:00+00 | 2026-03-01 00:02:00+00
 SAT-002 |   0 | 2026-03-01 00:02:00+00 | 2026-03-01 00:04:00+00 | 2026-03-01 00:05:00+00
 SAT-002 |   1 | 2026-03-01 00:05:00+00 | 2026-03-01 00:05:00+00 |
```

(`all_runs` is the example's query with two changes: no `WHERE hot = 1`, and `GROUP BY sat_id, hot, grp`, so that cool runs get a line too.) SAT-001's first hot episode was seen from 00:02 until 00:04 and seen cleared at 00:05, so the battery was above 40 °C for at least two minutes and at most four. SAT-002's last episode has no `cleared_at` at all. That NULL is real news: the data ends while the battery is still hot. An anomaly report should say "still in progress", not "zero seconds".

::: warning Say which duration you mean
"Duration 0" for a one-sample island does not mean the event took no time. It means you saw it once. Put the convention in the column name — `first_to_last_s` or `until_clear_s` — so nobody downstream mistakes a lower bound for the real length.
:::

## Method two: mark the starts, then count them

The second method thinks about islands the way you would with a pencil. Walk down the rows. Every time the flag *changes* from the row before, put a tick mark: "a new run starts here". Then, on every row, write how many tick marks you have made so far. That running count is the label. It goes up by one at each new run and stays flat inside a run.

Both halves are tools from earlier lessons. "Is this row different from the one before?" is LAG from lesson 03. "How many so far?" is a running SUM from lesson 04.

```sql
WITH flagged AS (
    SELECT sat_id, ts, deg_c,
           CASE WHEN deg_c > 40.0 THEN 1 ELSE 0 END AS hot
    FROM batt_temp
),
marked AS (
    SELECT sat_id, ts, deg_c, hot,
           CASE WHEN hot IS DISTINCT FROM LAG(hot) OVER (PARTITION BY sat_id ORDER BY ts)
                THEN 1 ELSE 0 END AS is_start
    FROM flagged
),
runs AS (
    SELECT sat_id, ts, deg_c, hot, is_start,
           SUM(is_start) OVER (PARTITION BY sat_id ORDER BY ts
                               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS run_id
    FROM marked
)
SELECT sat_id, ts, deg_c, hot, is_start, run_id
FROM runs
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | deg_c | hot | is_start | run_id
---------+------------------------+-------+-----+----------+--------
 SAT-001 | 2026-03-01 00:00:00+00 |  38.2 |   0 |        1 |      1
 SAT-001 | 2026-03-01 00:01:00+00 |  39.5 |   0 |        0 |      1
 SAT-001 | 2026-03-01 00:02:00+00 |  40.4 |   1 |        1 |      2
 SAT-001 | 2026-03-01 00:03:00+00 |  41.0 |   1 |        0 |      2
 SAT-001 | 2026-03-01 00:04:00+00 |  40.7 |   1 |        0 |      2
 SAT-001 | 2026-03-01 00:05:00+00 |  39.8 |   0 |        1 |      3
 SAT-001 | 2026-03-01 00:06:00+00 |  40.2 |   1 |        1 |      4
 SAT-001 | 2026-03-01 00:07:00+00 |  40.9 |   1 |        0 |      4
 SAT-001 | 2026-03-01 00:08:00+00 |  41.3 |   1 |        0 |      4
 SAT-001 | 2026-03-01 00:09:00+00 |  40.6 |   1 |        0 |      4
 SAT-001 | 2026-03-01 00:10:00+00 |  39.9 |   0 |        1 |      5
 SAT-001 | 2026-03-01 00:11:00+00 |  39.1 |   0 |        0 |      5
 SAT-002 | 2026-03-01 00:00:00+00 |  40.5 |   1 |        1 |      1
 SAT-002 | 2026-03-01 00:01:00+00 |  40.8 |   1 |        0 |      1
 SAT-002 | 2026-03-01 00:02:00+00 |  39.7 |   0 |        1 |      2
 SAT-002 | 2026-03-01 00:03:00+00 |  39.2 |   0 |        0 |      2
 SAT-002 | 2026-03-01 00:04:00+00 |  38.8 |   0 |        0 |      2
 SAT-002 | 2026-03-01 00:05:00+00 |  40.1 |   1 |        1 |      3
```

Read `hot IS DISTINCT FROM LAG(hot) OVER (...)` aloud as "hot is different from the previous row's hot". **[[IS DISTINCT FROM|null-safe]]** is a not-equal test that treats NULL as an ordinary value. That matters on each satellite's first row, where LAG gives NULL (lesson 03): the first row then counts as a start, which it is.

The running SUM spells out a ROWS frame so that it counts strictly row by row, instead of the default RANGE frame that lumps together tied rows (lesson 05).

::: example The same four episodes, by counting starts
**Step 3.** Collapse the `runs` CTE above exactly as before, grouping by `run_id` instead of `grp`:

```sql
SELECT sat_id, run_id,
       MIN(ts)           AS t_start,
       MAX(ts)           AS t_end,
       MAX(ts) - MIN(ts) AS duration,
       COUNT(*)          AS samples
FROM runs
WHERE hot = 1
GROUP BY sat_id, run_id
ORDER BY sat_id, t_start;
```

```text
 sat_id  | run_id |        t_start         |         t_end          | duration | samples
---------+--------+------------------------+------------------------+----------+---------
 SAT-001 |      2 | 2026-03-01 00:02:00+00 | 2026-03-01 00:04:00+00 | 00:02:00 |       3
 SAT-001 |      4 | 2026-03-01 00:06:00+00 | 2026-03-01 00:09:00+00 | 00:03:00 |       4
 SAT-002 |      1 | 2026-03-01 00:00:00+00 | 2026-03-01 00:01:00+00 | 00:01:00 |       2
 SAT-002 |      3 | 2026-03-01 00:05:00+00 | 2026-03-01 00:05:00+00 | 00:00:00 |       1
```

**Check against method one.** The same four islands, the same starts, ends, durations and counts. Only the labels differ: 2 and 4 instead of 1 and 2. Labels are only name tags, so their values do not matter, as long as each run has its own.
:::

### Why you might prefer counting starts

The row-number trick is shorter and famous — the exercise asks for it by name. But it knows only one thing about a row: its flag. The start-marking method lets you say *anything* about what starts a new run, because `is_start` is an ordinary CASE expression.

That matters when the data itself has holes. Suppose SAT-003's wheel was over the limit at 10 and 20 s, then the radio dropped three samples, then the wheel was over the limit again at 60 and 70 s:

```text
 t_s  |  0   | 10   | 20   | (30, 40, 50 missing) | 60   | 70   | 80
 rpm  | 1000 | 5200 | 5300 |                      | 5300 | 5250 | 800
```

To the row-number trick, the rows at 20 s and 60 s are neighbors. It reports one island from 10 to 70 s, claiming a full minute of overspeed. Nobody knows that: the wheel might have slowed during the silence. Add a second reason to start a run — a time step longer than one and a half sampling steps — and the claim becomes honest:

```sql
CASE WHEN (rpm > 5000) IS DISTINCT FROM
          LAG(rpm > 5000) OVER (PARTITION BY sat_id ORDER BY t_s)
       OR t_s - LAG(t_s) OVER (PARTITION BY sat_id ORDER BY t_s) > 15
     THEN 1 ELSE 0 END AS is_start
```

```text
 sat_id  | t_start | t_end | samples
---------+---------+-------+---------
 SAT-003 |      10 |    20 |       2
 SAT-003 |      60 |    70 |       2
```

Two islands, with the silence between them left as an unknown instead of being counted as overspeed.

::: warning Row numbers do not see missing time
The difference-of-row-numbers trick treats "the next row" as "the next moment". When telemetry has a dropout inside an episode, it glues the two sides together across the hole. Either check for time gaps first (lesson 03) or use the start-marking method with a time-gap condition.
:::

::: warning The order must be unique
Both methods walk the rows in `ORDER BY ts`. If two rows of a satellite share a timestamp — a duplicate downlink, say — their order is a coin toss, and a hot and a cool row at the same instant can land in either order and split or merge islands at random. Deduplicate first with ROW_NUMBER filtered to 1 (lesson 06), or add a tie-breaker column to every ORDER BY.
:::

## Gaps are islands too

So far the islands were runs of a *condition*. Turn the picture around and the same idea finds holes in the data itself.

Lesson 03 found gaps by time delta: compute `ts - LAG(ts)` per satellite and keep the rows whose step is longer than a threshold, like SAT-002's silence from 00:20 to 00:50 in the `soc` table. Each such row is the first sample after a gap — exactly an `is_start` mark for an island of **coverage**, a stretch of time with data arriving on schedule. The next lesson counts those marks to find ground-station passes.

For data on a fixed schedule there is also a neat shortcut. When samples are due every 10 s, the number `t_s / 10` is the sample's **slot**: 0, 1, 2, 3, … If every slot were present, slot and row number would rise together, so `t_s / 10 - ROW_NUMBER()` would be constant. A missing slot makes the slot number jump ahead of the row number, and the constant changes. It is the same two-counters idea, with the clock as the first counter:

```sql
WITH over AS (
    SELECT sat_id, t_s FROM wheel WHERE rpm > 5000
)
SELECT sat_id, t_s,
       t_s / 10                                              AS slot,
       ROW_NUMBER() OVER (PARTITION BY sat_id ORDER BY t_s)  AS rn,
       t_s / 10 - ROW_NUMBER() OVER (PARTITION BY sat_id ORDER BY t_s) AS grp
FROM over
ORDER BY sat_id, t_s;
```

```text
 sat_id  | t_s | slot | rn | grp
---------+-----+------+----+-----
 SAT-001 |  10 |    1 |  1 |   0
 SAT-001 |  20 |    2 |  2 |   0
 SAT-001 |  30 |    3 |  3 |   0
 SAT-001 |  50 |    5 |  4 |   1
 SAT-001 |  60 |    6 |  5 |   1
 SAT-002 |   0 |    0 |  1 |  -1
 SAT-002 |  10 |    1 |  2 |  -1
```

Here filtering *first* is fine, because the slot number remembers where the missing rows were. The same islands appear. The trick needs samples exactly on schedule, and real clocks **[[jitter|clock-jitter]]** — each sample lands a few milliseconds early or late — so round the time to the nearest slot first, or use the start-marking method, which does not care.

::: key Gaps and islands, both ways round
An island is a run of rows that belong together: a condition that holds, or data that keeps arriving on time. A gap is the space between islands. Mark where each island starts — the flag changed, or the time step exceeded a threshold — and a running SUM of the marks labels every island.
:::

## Check yourself

::: check
A pressure sensor on SAT-004 gives, in time order, the flags `0 1 1 0 0 1 1 1 0`. Work out `rn_all`, `rn_kind` and their difference for the rows flagged 1. How many islands of 1s are there, and what are their labels?
:::

::: answer
Number the rows 1 to 9; that is `rn_all`. The rows flagged 1 are rows 2, 3, 6, 7 and 8. Counting only the 1-rows, they get `rn_kind` 1, 2, 3, 4 and 5.

The differences are $2 - 1 = 1$, $3 - 2 = 1$, $6 - 3 = 3$, $7 - 4 = 3$ and $8 - 5 = 3$.

So there are **two islands**: rows 2–3 with label 1, and rows 6–8 with label 3. The label jumped by 2 because two 0-rows (rows 4 and 5) sat between the islands — exactly the $k$ from the "why" note.
:::

::: check
A colleague writes the row-number trick but puts `WHERE rpm > 5000` inside the same SELECT as the two ROW_NUMBER calls. What does the query return for SAT-001 in the `wheel` table, and why?
:::

::: answer
One island from 10 s to 60 s with five samples — the same wrong answer as plain GROUP BY.

WHERE runs before the window functions (lesson 01), so only the five "over" rows get numbered. Both counters then count the same rows, 1 to 5, and the difference is 0 everywhere: one label, one island. The calm reading at 40 s never got counted, so nothing split the run.
:::

::: check
Why does the start-marking method use `IS DISTINCT FROM` rather than `<>` to compare `hot` with `LAG(hot)`? What would go wrong on the `batt_temp` data with `<>`?
:::

::: answer
On each satellite's first row, `LAG(hot)` is NULL. `hot <> NULL` is UNKNOWN, so the CASE falls through to its ELSE and gives `is_start = 0`, even though that row does start a run.

On this data the islands still come out right, by luck: SAT-002's first run gets the label 0, which is as good a name tag as any. But the start marks are now wrong, and they are useful on their own. Count hot episodes per satellite with `SUM(is_start)` over the hot rows and SAT-002 gets 1 instead of 2: the episode that began on its very first reading has lost its mark. `IS DISTINCT FROM` says the first row differs from "nothing", and marks the start it really is.
:::

::: check
Flight software on a satellite declares a wheel fault only if overspeed persists for at least three consecutive samples. Using the `wheel` table and the row-number method, which of the three overspeed islands would count as faults? What would you add to the query to get only those?
:::

::: answer
The islands are SAT-001 from 10 to 30 s (3 samples), SAT-001 from 50 to 60 s (2 samples), and SAT-002 from 0 to 10 s (2 samples). Only the first has at least three samples, so only it is a fault.

After the GROUP BY, add `HAVING COUNT(*) >= 3`. HAVING filters whole groups (from the last module), and here each group is one island, so it filters islands by their length. A rule on time instead of samples would be `HAVING MAX(t_s) - MIN(t_s) >= 20`.
:::

## Summary

| Idea | What it does | In SQL |
| --- | --- | --- |
| Flag | Marks each row as in or out | `CASE WHEN rpm > 5000 THEN 1 ELSE 0 END` |
| Row-number difference | Constant within a run of the same flag | `ROW_NUMBER() OVER (PARTITION BY sat ORDER BY ts) - ROW_NUMBER() OVER (PARTITION BY sat, flag ORDER BY ts)` |
| Start mark | 1 where a new run begins | `flag IS DISTINCT FROM LAG(flag) OVER (...)`, optionally `OR` a time-gap test |
| Run label from marks | Running count of starts | `SUM(is_start) OVER (PARTITION BY sat ORDER BY ts ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` |
| Collapse | One line per island | `GROUP BY sat, label` with `MIN(ts)`, `MAX(ts)`, `COUNT(*)` |
| Minimum length | Keep only long islands | `HAVING COUNT(*) >= n` or `HAVING MAX(ts) - MIN(ts) >= d` |
| Duration | First to last sample is a lower bound | `MAX(ts) - MIN(ts)`; SQLite `unixepoch(MAX(ts)) - unixepoch(MIN(ts))` |
| Slot trick | Islands of on-schedule data | `t_s / step - ROW_NUMBER() OVER (...)` |

Label on all rows, filter after, and group by the satellite as well as the label. The next lesson takes the start-marking method, drops the condition and keeps only the time gap, and uses it to cut a stream of radio packets into ground-station passes.

::: context limit-checking Red lines and yellow lines
Every telemetry channel on a spacecraft has limits written down before launch. Ground software colors a value yellow when it passes a caution limit and red when it passes an alarm limit, and operators react to the color. After a pass, engineers go back through the stored data to list every *episode* of limit violation, because a single reading tells them little and a long episode tells them a lot. The queries in this lesson are how that list is made from a database.
:::

::: context contiguous-word Touching, with nothing in between
"Contiguous" comes from the Latin *contingere*, "to touch". Contiguous rows touch each other in the chosen order: no other row of the same satellite sits between them. The lower 48 United States are often called the contiguous states because each one shares a border with the next, while Alaska and Hawaii are separated from them. In this lesson "in order" always means the ORDER BY inside the window, usually time.
:::

::: context gaps-islands-name Where the name comes from
Draw the rows along a line. The runs you want stand up like islands out of the sea, and the rows between them are the water — the gaps. The phrase has circulated among SQL writers for decades; Itzik Ben-Gan's books and articles on Microsoft SQL Server did much to make it the standard name, and "gaps and islands" is now what people search for on any database.
:::

::: context wheel-overspeed Why a wheel has a speed limit
A reaction wheel stores momentum. Each time the satellite fights a small steady push, such as sunlight pressure on one side, the wheel speeds up a little to cancel it. Left alone it would keep speeding up. Above its rated speed, the bearings wear fast and the motor runs out of torque to control it. So ground teams watch wheel speed and, well before the limit, fire thrusters or use magnetic torquers to "dump" the extra momentum and slow the wheel down. Overspeed islands in the telemetry show when that housekeeping was late.
:::

::: context why-constant Two counters walking together
The top row counts every sample; the bottom row counts only samples of the same kind. Inside the first over-limit run (blue) both counters rise by one per step, so their difference stays at 1. The calm sample at 40 s moves only the top counter, so the second run's difference is 2.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="58" y="30">t_s</text>
    <text x="58" y="62">rn_all</text>
    <text x="58" y="94">rn_kind</text>
    <text x="58" y="126">grp</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="66" y="42" width="34" height="96" fill="#ffffff"/>
    <rect x="100" y="42" width="34" height="96" fill="#8fb8f0"/>
    <rect x="134" y="42" width="34" height="96" fill="#8fb8f0"/>
    <rect x="168" y="42" width="34" height="96" fill="#8fb8f0"/>
    <rect x="202" y="42" width="34" height="96" fill="#ffffff"/>
    <rect x="236" y="42" width="34" height="96" fill="#f2b880"/>
    <rect x="270" y="42" width="34" height="96" fill="#f2b880"/>
    <rect x="304" y="42" width="34" height="96" fill="#ffffff"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="83" y="30">0</text><text x="117" y="30">10</text><text x="151" y="30">20</text><text x="185" y="30">30</text>
    <text x="219" y="30">40</text><text x="253" y="30">50</text><text x="287" y="30">60</text><text x="321" y="30">70</text>
    <text x="83" y="62">1</text><text x="117" y="62">2</text><text x="151" y="62">3</text><text x="185" y="62">4</text>
    <text x="219" y="62">5</text><text x="253" y="62">6</text><text x="287" y="62">7</text><text x="321" y="62">8</text>
    <text x="83" y="94">1</text><text x="117" y="94">1</text><text x="151" y="94">2</text><text x="185" y="94">3</text>
    <text x="219" y="94">2</text><text x="253" y="94">4</text><text x="287" y="94">5</text><text x="321" y="94">3</text>
    <text x="83" y="126">0</text><text x="117" y="126" font-weight="bold">1</text><text x="151" y="126" font-weight="bold">1</text><text x="185" y="126" font-weight="bold">1</text>
    <text x="219" y="126">3</text><text x="253" y="126" font-weight="bold">2</text><text x="287" y="126" font-weight="bold">2</text><text x="321" y="126">5</text>
  </g>
  <text x="151" y="158" font-size="11" fill="#1d6fd1" text-anchor="middle">island 1: grp = 1</text>
  <text x="270" y="158" font-size="11" fill="#b4232c" text-anchor="middle">island 2: grp = 2</text>
</svg>
```

White columns are calm samples. Their own differences (0, 3, 5) belong to the calm kind and are thrown away by `WHERE over = 1`.
:::

::: context crossing-time The crossing hides between samples
The dots are SAT-001's battery readings, one a minute, from 00:00 to 00:11. The dashed red line is the 40.0 °C limit. The battery crossed the line somewhere inside each shaded strip, but no reading was taken there, so SQL can only say "between these two samples".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g fill="#f2b880" opacity="0.5">
    <rect x="44" y="40" width="24" height="80"/>
    <rect x="116" y="40" width="24" height="80"/>
    <rect x="140" y="40" width="24" height="80"/>
    <rect x="236" y="40" width="24" height="80"/>
  </g>
  <line x1="12" y1="120" x2="300" y2="120" stroke="#1f2a44" stroke-width="1"/>
  <line x1="12" y1="81" x2="300" y2="81" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="304" y="85" font-size="11" fill="#b4232c">40.0 °C</text>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1" points="20,99 44,86 68,77 92,71 116,74 140,83 164,79 188,72 212,68 236,75 260,82 284,90"/>
  <g fill="#1f2a44">
    <circle cx="20" cy="99" r="3"/><circle cx="44" cy="86" r="3"/><circle cx="140" cy="83" r="3"/>
    <circle cx="260" cy="82" r="3"/><circle cx="284" cy="90" r="3"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="68" cy="77" r="3.5"/><circle cx="92" cy="71" r="3.5"/><circle cx="116" cy="74" r="3.5"/>
    <circle cx="164" cy="79" r="3.5"/><circle cx="188" cy="72" r="3.5"/><circle cx="212" cy="68" r="3.5"/><circle cx="236" cy="75" r="3.5"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="136">00:00</text><text x="116" y="136">00:04</text><text x="212" y="136">00:08</text><text x="284" y="136">00:11</text>
  </g>
  <text x="152" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">shaded: the crossing happened in here</text>
</svg>
```

Blue dots are above the limit, black dots below: two islands, 00:02 to 00:04 and 00:06 to 00:09. The grey line joining the dots is a guess; the real temperature between readings is unknown.
:::

::: context null-safe A not-equal that understands NULL
Ordinary comparisons with NULL give UNKNOWN: `1 <> NULL` is neither true nor false. `a IS DISTINCT FROM b` is true when the two differ, counting NULL as a value of its own, so `1 IS DISTINCT FROM NULL` is true and `NULL IS DISTINCT FROM NULL` is false. Its opposite is `IS NOT DISTINCT FROM`. PostgreSQL has had both for a long time. SQLite accepts the same words from version 3.39, and has always had a shorter spelling of the same test: `a IS NOT b`.
:::

::: context clock-jitter Why samples are never exactly on time
A flight computer schedules a sample "every 10 seconds", but the task that takes it competes with other tasks, and the timestamp comes from a clock that is itself corrected now and then. So real samples land at 10.003 s, 19.998 s, 30.001 s and so on. The spread is called jitter. It is harmless for plotting, but any trick that needs `t_s / 10` to be an exact whole number breaks on it. Rounding first — `ROUND(t_s / 10.0)` — puts each sample back in its slot.
:::
