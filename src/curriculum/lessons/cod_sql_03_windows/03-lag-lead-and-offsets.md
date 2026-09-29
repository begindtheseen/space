---
id: l03-lag-lead-and-offsets
title: "Looking back and ahead: LAG, LEAD and friends"
minutes: 21
covers:
  - "Offsets: LAG and LEAD, FIRST_VALUE, LAST_VALUE, NTH_VALUE"
---

A single telemetry reading tells you where something is. Two readings in a row tell you where it is *going*. A battery at 0.70 is fine; a battery at 0.70 that was at 0.85 ten minutes ago is draining fast, and an operator wants to know now. Almost every alarm that matters on a spacecraft is about change: a temperature climbing, a wheel speeding up, a pressure dropping, a stream of samples that suddenly stops arriving.

To see change, each row needs to reach its neighbor. In the joins module you did that with a [[self-join|self-join-callback]], pairing each reading with the one before it, and you saw how clumsy that is. This lesson teaches the **offset functions**, the window functions that reach straight to another row of the same window: `LAG` for the row before, `LEAD` for the row after, and `FIRST_VALUE`, `LAST_VALUE` and `NTH_VALUE` for a row at a fixed position.

By the end you will compute a per-satellite rate of change, explain exactly why the first row of each satellite comes out NULL, find gaps in a telemetry stream, and know about the one offset function — LAST_VALUE — that surprises nearly everyone the first time.

## LAG: the row before

Picture a queue of people, each holding a card with a number. Everyone turns round and reads the card of the person behind them in the queue — the one who arrived just before. The person at the very front of the line has nobody before them, so they read nothing.

That is **LAG** (say it like the word "lag", as in "lagging behind"). `LAG(value)` returns `value` from the previous row of the window, in the window's ORDER BY. **LEAD** is the mirror image: `LEAD(value)` returns `value` from the next row.

Here they are on two satellites from the `soc` table of lesson 01:

```sql
SELECT sat_id, ts, value,
       LAG(value)  OVER (PARTITION BY sat_id ORDER BY ts) AS prev_value,
       LEAD(value) OVER (PARTITION BY sat_id ORDER BY ts) AS next_value
FROM soc
WHERE sat_id IN ('SAT-001', 'SAT-002')
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value | prev_value | next_value
---------+------------------------+-------+------------+------------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |            |       0.85
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 |       0.90 |       0.70
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 |       0.85 |       0.75
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |       0.70 |
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50 |            |       0.55
 SAT-002 | 2026-03-01 00:10:00+00 |  0.55 |       0.50 |       0.60
 SAT-002 | 2026-03-01 00:20:00+00 |  0.60 |       0.55 |       0.63
 SAT-002 | 2026-03-01 00:50:00+00 |  0.63 |       0.60 |
```

Read `LAG(value) OVER (PARTITION BY sat_id ORDER BY ts)` aloud as "the previous value, within each satellite, in time order". Each piece of the window clause has a job:

- **ORDER BY ts** decides what "previous" means. Without an order, there is no "before".
- **PARTITION BY sat_id** puts a wall between satellites. SAT-002's first row does not see SAT-001's last row, because they are in different partitions.

The blanks in the table are NULLs (psql prints NULL as nothing). The first row of each satellite has no previous row, so `prev_value` is NULL. The last row of each has no next row, so `next_value` is NULL. You can [[see the arrows|lag-lead-picture]] in a note.

## The change since the last sample

The **delta** — the change from the previous sample, from the Greek letter $\Delta$ ("delta") that engineers use for "change in" — is the current value minus the previous one:

```sql
SELECT sat_id, ts, value,
       value - LAG(value) OVER (PARTITION BY sat_id ORDER BY ts) AS delta
FROM soc
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value | delta
---------+------------------------+-------+-------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 | -0.05
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 | -0.15
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |  0.05
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50 |
 SAT-002 | 2026-03-01 00:10:00+00 |  0.55 |  0.05
 SAT-002 | 2026-03-01 00:20:00+00 |  0.60 |  0.05
 SAT-002 | 2026-03-01 00:50:00+00 |  0.63 |  0.03
 SAT-003 | 2026-03-01 00:00:00+00 |  0.81 |
 SAT-003 | 2026-03-01 00:10:00+00 |  0.78 | -0.03
 SAT-003 | 2026-03-01 00:20:00+00 |  0.78 |  0.00
 SAT-003 | 2026-03-01 00:30:00+00 |  0.75 | -0.03
```

Check a row: SAT-001 at 00:20 is $0.70 - 0.85 = -0.15$. A minus sign means the charge fell. SAT-001 lost 0.15 of a full battery in ten minutes, went into the [[Earth's shadow|eclipse-drain]], and began recharging by 00:30. This query is the shape of this module's first exercise.

### Why the first row is NULL

The first row of each satellite has a blank delta, and that blank is correct. Follow it step by step:

1. SAT-002 at 00:00 is the first row of its partition. There is no row before it.
2. So `LAG(value)` has nothing to return, and returns NULL — "unknown".
3. The delta is `0.50 - NULL`. You learned in the first SQL module that any arithmetic with NULL gives NULL. So the delta is NULL.

And NULL is the honest answer. The table does not say what SAT-002's charge was before midnight, so the change at midnight is genuinely unknown. It is *not* zero. Zero would claim "the charge did not change", which nobody measured.

::: key What LAG gives you, and the first row
LAG gives the value from the previous row in the window ordering, or NULL when there is none. Partitioning by satellite means the first row of each satellite is NULL, which is correct and must be handled downstream.
:::

"Handled downstream" means whatever uses the delta must expect the NULL. Often nothing special is needed: aggregates like `AVG(delta)` and `MAX(delta)` skip NULLs on their own, as you learned in the GROUP BY lesson. When you want only rows with a real delta — say, to list the biggest drops — compute the delta in a CTE and filter `WHERE delta IS NOT NULL` outside, because you cannot use a window function in WHERE (lesson 01).

::: warning Do not paper over the NULL with zero
`COALESCE(delta, 0)` makes the first row look like "no change". That pulls averages towards zero. On this table SAT-001's three real deltas average $(-0.05 - 0.15 + 0.05)/3 = -0.050$ per sample; with a fake zero added, the average becomes $-0.15/4 = -0.0375$, a quarter smaller. It also hides real problems: a satellite with only one sample would report a calm "0" instead of "not enough data". Keep the NULL until you have a reason to replace it, and then replace it with something true.
:::

### The satellite boundary

The PARTITION BY is not decoration. Leave it out and the delta walks straight across from one satellite to the next:

```sql
SELECT sat_id, ts, value,
       value - LAG(value) OVER (ORDER BY sat_id, ts) AS delta
FROM soc
WHERE sat_id IN ('SAT-001', 'SAT-002')
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value | delta
---------+------------------------+-------+-------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 | -0.05
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 | -0.15
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |  0.05
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50 | -0.25
 SAT-002 | 2026-03-01 00:10:00+00 |  0.55 |  0.05
 SAT-002 | 2026-03-01 00:20:00+00 |  0.60 |  0.05
 SAT-002 | 2026-03-01 00:50:00+00 |  0.63 |  0.03
```

Look at SAT-002 at 00:00: a delta of $0.50 - 0.75 = -0.25$. That subtracts SAT-001's last reading from SAT-002's first. It is a drop that never happened, and it is exactly the size that sets off a "battery falling fast" alarm. Only one row is wrong, which is what makes it hard to spot.

::: warning A delta must never cross a satellite boundary
Partition by the thing whose change you are measuring: `PARTITION BY sat_id`, or `PARTITION BY sat_id, channel` when one table holds many channels. Writing only `OVER (ORDER BY ts)` is worse still: rows from all satellites are interleaved by time, so almost every delta subtracts one satellite's reading from another's, and when two satellites share a timestamp, which one counts as "previous" is not even defined.
:::

## Rate of change: divide by the time step

A delta is "how much it changed". A **rate of change** is "how much it changed *per unit of time*": the delta divided by the time between the two samples,

$$
\text{rate} = \frac{\Delta\text{value}}{\Delta t} = \frac{\text{value} - \text{previous value}}{t - \text{previous } t} .
$$

When samples are evenly spaced, deltas and rates tell the same story. When they are not, only the rate can be compared. SAT-002's last delta, $+0.03$, looks like its charging slowed down. But that delta covers thirty minutes, not ten. LAG on the `ts` column gives the time step, so you can divide.

Two new tools keep the query readable. The time step in seconds is `EXTRACT(EPOCH FROM ts - LAG(ts) ...)`, read "extract the [[epoch|epoch-word]] from": one timestamp minus another is an interval (first SQL module), and `EXTRACT(EPOCH FROM ...)` turns an interval into seconds. And because two window functions share the same window, it is written once at the bottom in a **[[WINDOW clause|named-window]]**, `WINDOW w AS (PARTITION BY sat_id ORDER BY ts)`, and used by name as `OVER w`. The named window means exactly the same as writing the brackets out each time, and both PostgreSQL and SQLite accept it.

::: example Charge rate per satellite, per hour
**Step 1: delta and time step on each row.** A CTE computes both with LAG over the same named window.

**Step 2: divide and scale.** The outer query divides the delta by the seconds and multiplies by 3,600 seconds per hour, giving the change in state of charge per hour.

```sql
WITH d AS (
    SELECT sat_id, ts, value,
           value - LAG(value) OVER w AS delta,
           EXTRACT(EPOCH FROM ts - LAG(ts) OVER w) AS dt_s
    FROM soc
    WINDOW w AS (PARTITION BY sat_id ORDER BY ts)
)
SELECT sat_id, ts, delta, dt_s,
       ROUND(delta / dt_s * 3600, 3) AS rate_per_h
FROM d
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | delta |    dt_s     | rate_per_h
---------+------------------------+-------+-------------+------------
 SAT-001 | 2026-03-01 00:00:00+00 |       |             |
 SAT-001 | 2026-03-01 00:10:00+00 | -0.05 |  600.000000 |     -0.300
 SAT-001 | 2026-03-01 00:20:00+00 | -0.15 |  600.000000 |     -0.900
 SAT-001 | 2026-03-01 00:30:00+00 |  0.05 |  600.000000 |      0.300
 SAT-002 | 2026-03-01 00:00:00+00 |       |             |
 SAT-002 | 2026-03-01 00:10:00+00 |  0.05 |  600.000000 |      0.300
 SAT-002 | 2026-03-01 00:20:00+00 |  0.05 |  600.000000 |      0.300
 SAT-002 | 2026-03-01 00:50:00+00 |  0.03 | 1800.000000 |      0.060
 SAT-003 | 2026-03-01 00:00:00+00 |       |             |
 SAT-003 | 2026-03-01 00:10:00+00 | -0.03 |  600.000000 |     -0.180
 SAT-003 | 2026-03-01 00:20:00+00 |  0.00 |  600.000000 |      0.000
 SAT-003 | 2026-03-01 00:30:00+00 | -0.03 |  600.000000 |     -0.180
```

**Check two rows by hand.** SAT-001 at 00:20: $-0.15 / 600 \times 3600 = -0.15 \times 6 = -0.90$ per hour. At that rate a full battery would empty in about 67 minutes. SAT-002 at 00:50: $0.03 / 1800 \times 3600 = 0.03 \times 2 = 0.06$ per hour — five times slower than its earlier $0.30$, which the raw deltas ($0.05$ versus $0.03$) completely hid.

**The first rows.** Both the delta and the time step are NULL on each satellite's first row, so the rate is NULL too: NULL divided by NULL. That is the same honest "unknown" as before, carried through.

**In SQLite**, where `ts` is ISO-8601 text, replace the time step with whole seconds from `unixepoch`, which you met in the first SQL module:

```sql
unixepoch(ts) - unixepoch(LAG(ts) OVER w) AS dt_s
```

SQLite gives the same rates: -0.3, -0.9, 0.3, 0.3, 0.3, 0.06, -0.18, 0.0, -0.18.
:::

## Finding gaps with LAG

The time step has a second use. A satellite that normally reports every ten minutes and then goes quiet for thirty has a **gap** in its telemetry: a period with no samples. A gap can mean a missed ground-station pass, a full onboard recorder, or a spacecraft that rebooted. Operators want every one listed.

::: example Every gap longer than 15 minutes
**Step 1: put the previous timestamp on each row** with LAG, partitioned by satellite, in a CTE.

**Step 2: keep rows where the step is too long.** The [[threshold|gap-threshold]] is a judgment call: one and a half times the normal 10-minute step, 15 minutes, catches a missing sample without firing on small timing jitter.

```sql
WITH g AS (
    SELECT sat_id, ts,
           LAG(ts) OVER (PARTITION BY sat_id ORDER BY ts) AS prev_ts
    FROM soc
)
SELECT sat_id, prev_ts, ts, ts - prev_ts AS gap
FROM g
WHERE ts - prev_ts > INTERVAL '15 minutes';
```

```text
 sat_id  |        prev_ts         |           ts           |   gap
---------+------------------------+------------------------+----------
 SAT-002 | 2026-03-01 00:20:00+00 | 2026-03-01 00:50:00+00 | 00:30:00
```

**Read the answer.** SAT-002 was silent from 00:20 to 00:50, thirty minutes; the samples due at 00:30 and 00:40 never arrived. That is the [[gap in SAT-002's timeline|gap-picture]] that made its last delta look small.

**The first rows.** Each satellite's first row has `prev_ts` NULL, so `ts - prev_ts > INTERVAL '15 minutes'` is UNKNOWN, and WHERE drops it. That is right: the first sample is not a gap.

**In SQLite:** `WHERE unixepoch(ts) - unixepoch(prev_ts) > 900` gives the same one row, with a gap of 1,800 seconds.
:::

This method finds gaps *between* samples that arrived. It cannot see a satellite that went silent at 00:20 and never came back, because there is no later row to compare with. For that, you compare against a list of the times that *should* exist — a **dense time series**, one row per expected sample time, which you can generate and left-join the telemetry onto. Slots with no matching sample are missing.

::: key Detecting a telemetry gap in SQL
Compute the time difference to the previous sample with LAG and flag rows whose gap exceeds a threshold, or left-join against a generated dense time series. The first finds gaps between present samples; the second also finds a leading or trailing absence.
:::

## LEAD, and reaching further

LEAD is LAG facing the other way. It is natural when the question is about what comes *next*: "how long until the next sample?", "what did the charge do after this command?".

```sql
SELECT sat_id, ts, value,
       LEAD(ts) OVER (PARTITION BY sat_id ORDER BY ts) - ts AS time_to_next
FROM soc
WHERE sat_id = 'SAT-002'
ORDER BY ts;
```

```text
 sat_id  |           ts           | value | time_to_next
---------+------------------------+-------+--------------
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50 | 00:10:00
 SAT-002 | 2026-03-01 00:10:00+00 |  0.55 | 00:10:00
 SAT-002 | 2026-03-01 00:20:00+00 |  0.60 | 00:30:00
 SAT-002 | 2026-03-01 00:50:00+00 |  0.63 |
```

The same gap appears, this time on the row *before* it — the last sample before the silence. Now the NULL is on the last row.

Both functions take two optional extra arguments: `LAG(value, n, default)`.

- **n** is how many rows to reach: `LAG(value, 2)` is the value two rows back. It is NULL on the first *two* rows of each partition.
- **default** is what to return instead of NULL when there is no such row.

```sql
SELECT sat_id, ts, value,
       LAG(value, 2)       OVER (PARTITION BY sat_id ORDER BY ts) AS two_back,
       LAG(value, 1, 0.00) OVER (PARTITION BY sat_id ORDER BY ts) AS prev_or_zero
FROM soc
WHERE sat_id = 'SAT-001'
ORDER BY ts;
```

```text
 sat_id  |           ts           | value | two_back | prev_or_zero
---------+------------------------+-------+----------+--------------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |          |         0.00
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 |          |         0.90
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 |     0.90 |         0.85
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |     0.85 |         0.70
```

The default argument is the same trap as COALESCE with zero: `prev_or_zero` says the battery was empty just before 00:00, and a delta built on it would report a jump of $+0.90$. Use the default only when there is a true value to give — for example, a counter that is known to start at zero.

::: key LAG and LEAD
`LAG(x, n, d)` is x from n rows earlier in the window (n defaults to 1), `LEAD(x, n, d)` from n rows later; either returns d, or NULL when d is omitted, when that row does not exist. Always give the window an ORDER BY, and a PARTITION BY that stops the offset crossing a boundary.
:::

## FIRST_VALUE, LAST_VALUE and NTH_VALUE

LAG and LEAD reach a fixed distance from the current row. The other three offset functions reach a fixed *position* in the window: the first row, the last row, or the n-th row.

- **FIRST_VALUE(x)** — x from the first row of the window.
- **LAST_VALUE(x)** — x from the last row of the window.
- **NTH_VALUE(x, n)** — x from the n-th row of the window, counting from 1.

Here are all three on SAT-001, sharing one named window:

```sql
SELECT sat_id, ts, value,
       FIRST_VALUE(value) OVER w AS first_v,
       value - FIRST_VALUE(value) OVER w AS since_start,
       LAST_VALUE(value) OVER w AS last_v,
       NTH_VALUE(value, 2) OVER w AS second_v
FROM soc
WHERE sat_id = 'SAT-001'
WINDOW w AS (PARTITION BY sat_id ORDER BY ts)
ORDER BY ts;
```

```text
 sat_id  |           ts           | value | first_v | since_start | last_v | second_v
---------+------------------------+-------+---------+-------------+--------+----------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |    0.90 |        0.00 |   0.90 |
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 |    0.90 |       -0.05 |   0.85 |     0.85
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 |    0.90 |       -0.20 |   0.70 |     0.85
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |    0.90 |       -0.15 |   0.75 |     0.85
```

FIRST_VALUE behaves as you would hope: 0.90, SAT-001's first reading, on every row. `since_start` is the change since the start of the period: at 00:20 the battery is $0.70 - 0.90 = -0.20$ below where it began. Reverse the order — `ORDER BY ts DESC` — and FIRST_VALUE gives the *latest* reading on every row instead, 0.75 here.

Now look at `last_v`. You probably expected 0.75, SAT-001's last reading, on every row. Instead each row shows *its own* value: 0.90, 0.85, 0.70, 0.75. And `second_v` is NULL on the first row, even though SAT-001 plainly has a second reading.

Both come from one fact you met in lesson 01: with an ORDER BY inside OVER, the window stops at the current row — it holds the rows "so far". So on each row, the last row of the window *is* the current row. And on the first row, the window holds only one row, so there is no second row yet. The rule that decides where a window starts and stops is called the **[[frame|frame-preview]]**. Lesson 05 takes it apart properly. For now, here is the fix — a frame that says "the whole partition, from its first row to its last":

```sql
SELECT sat_id, ts, value,
       LAST_VALUE(value) OVER (PARTITION BY sat_id ORDER BY ts
           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS last_v,
       NTH_VALUE(value, 2) OVER (PARTITION BY sat_id ORDER BY ts
           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS second_v
FROM soc
WHERE sat_id = 'SAT-001'
ORDER BY ts;
```

```text
 sat_id  |           ts           | value | last_v | second_v
---------+------------------------+-------+--------+----------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |   0.75 |     0.85
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 |   0.75 |     0.85
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 |   0.75 |     0.85
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |   0.75 |     0.85
```

Read the new line as "rows between the unbounded preceding one and the unbounded following one": from the very first row of the partition to the very last. Now `last_v` is 0.75 everywhere and `second_v` is 0.85 everywhere.

::: warning LAST_VALUE surprises almost everyone
`LAST_VALUE(x) OVER (PARTITION BY ... ORDER BY ...)` with no frame returns the current row's own value, not the partition's last value, because the default window ends at the current row. Add `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` to mean the last row of the partition — or use `FIRST_VALUE(x)` with the ORDER BY reversed, which needs no frame. NTH_VALUE has the same catch: it is NULL until the window has grown to n rows. Lesson 05 explains why.
:::

FIRST_VALUE never hits this problem, because the window always *starts* at the first row of the partition, whatever row it ends at.

## Offset functions in SQLite

Everything in this lesson runs in SQLite 3.25 or later with the same results, including the WINDOW clause and the ROWS frame. Two differences are worth knowing for the exercises.

- **Time arithmetic.** SQLite has no interval type. Use `unixepoch(ts) - unixepoch(LAG(ts) OVER w)` for a step in whole seconds, as in the examples.
- **Floating-point crumbs.** With `value REAL`, the deltas print as `-0.050000000000000044` and `0.04999999999999993` instead of `-0.05` and `0.05`, because binary floating point cannot store 0.85 exactly. The values are right to far more digits than any battery sensor. Round them for display with `ROUND(delta, 2)`, and when you check a result, compare within a tolerance — `ABS(delta + 0.15) < 1e-9` — never with `=`.

## Check yourself

::: check
Without running it, write out `next_value` for SAT-003:

```sql
SELECT ts, value,
       LEAD(value) OVER (PARTITION BY sat_id ORDER BY ts) AS next_value
FROM soc
WHERE sat_id = 'SAT-003'
ORDER BY ts;
```
:::

::: answer
SAT-003's values in time order are 0.81, 0.78, 0.78, 0.75. LEAD reads the next row's value:

- 00:00: 0.78
- 00:10: 0.78
- 00:20: 0.75
- 00:30: NULL — there is no later row in SAT-003's partition.

The NULL sits on the *last* row, where LAG's NULL sat on the first.
:::

::: check
A teammate computes the change per sample with `value - LAG(value) OVER (ORDER BY ts)` on a table of three satellites all sampled at the same times. Describe what their deltas mean, and fix the query.
:::

::: answer
With no PARTITION BY, all satellites form one window ordered by time. At each timestamp there are three rows, one per satellite, so the "previous row" of most rows is a *different satellite's* reading at the same time or at the time before. The deltas mostly measure the difference between two satellites, not a change over time. Worse, the three rows that share a timestamp tie on the ORDER BY, so which one counts as "previous" is not defined and can change between runs.

The fix partitions by satellite:

```sql
value - LAG(value) OVER (PARTITION BY sat_id ORDER BY ts) AS delta
```

Now each satellite's rows are ordered alone, and the first row of each has a NULL delta.
:::

::: check
SAT-003's charge went from 0.81 at 00:00 to 0.78 at 00:10. What is its rate of change per hour? At that rate, how long would it take to lose another 0.10?
:::

::: answer
Delta: $0.78 - 0.81 = -0.03$. Time step: 10 minutes, 600 seconds. Rate: $-0.03 / 600 \times 3600 = -0.03 \times 6 = -0.18$ per hour, matching the table in the example.

To lose 0.10 at 0.18 per hour takes $0.10 / 0.18 = 0.556$ hours, about 33 minutes. Sanity check: it lost 0.03 in 10 minutes, so 0.10 should take a little over three times as long — about 33 minutes. Good.
:::

::: check
You want each satellite's average change per sample. Explain what these two give on SAT-001 (real deltas $-0.05$, $-0.15$, $+0.05$ plus the first row's NULL), and which one is right:

```sql
AVG(delta)
AVG(COALESCE(delta, 0))
```
:::

::: answer
`AVG(delta)` skips the NULL, so it averages the three real deltas: $(-0.05 - 0.15 + 0.05)/3 = -0.15/3 = -0.050$.

`AVG(COALESCE(delta, 0))` turns the NULL into a made-up 0 and averages four numbers: $-0.15/4 = -0.0375$.

The first is right. The first row has no measured change; counting it as "no change" invents a sample and drags the average towards zero. (Both need the delta computed in a CTE first, since an aggregate cannot wrap a window function directly in the same SELECT.)
:::

::: check
This query is meant to put each satellite's final reading on every row. What does it return for SAT-002, and how do you fix it two different ways?

```sql
SELECT sat_id, ts, value,
       LAST_VALUE(value) OVER (PARTITION BY sat_id ORDER BY ts) AS final_v
FROM soc;
```
:::

::: answer
With an ORDER BY and no frame, each row's window ends at the current row, so LAST_VALUE returns each row's own value: for SAT-002, 0.50, 0.55, 0.60, 0.63. Only the last row happens to be right.

Fix 1, stretch the window to the whole partition:

```sql
LAST_VALUE(value) OVER (PARTITION BY sat_id ORDER BY ts
    ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS final_v
```

Fix 2, turn the order round and take the first value, which needs no frame because every window starts at the partition's first row:

```sql
FIRST_VALUE(value) OVER (PARTITION BY sat_id ORDER BY ts DESC) AS final_v
```

Either way, `final_v` is 0.63 on all four SAT-002 rows.
:::

## Summary

| Function | Returns | NULL when |
| --- | --- | --- |
| `LAG(x)` | x from the previous row | on the first row of each partition |
| `LEAD(x)` | x from the next row | on the last row of each partition |
| `LAG(x, n, d)`, `LEAD(x, n, d)` | x from n rows away; d instead of NULL | n rows away does not exist (and no d) |
| `FIRST_VALUE(x)` | x from the window's first row | never, for a non-NULL x |
| `LAST_VALUE(x)` | x from the window's last row — the current row, under the default frame | — |
| `NTH_VALUE(x, n)` | x from the window's n-th row | the window has fewer than n rows so far |

| Pattern | How |
| --- | --- |
| Delta | `value - LAG(value) OVER (PARTITION BY sat_id ORDER BY ts)`; first row NULL, and that is correct |
| Rate | delta divided by the time step: `EXTRACT(EPOCH FROM ts - LAG(ts) OVER w)` in PostgreSQL, `unixepoch(ts) - unixepoch(LAG(ts) OVER w)` in SQLite |
| Gap | time step to the previous sample above a threshold, filtered in an outer query |
| Named window | `WINDOW w AS (...)`, used as `OVER w` |
| Whole-partition frame | `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` |

Next lesson returns to the aggregate functions with an ORDER BY inside OVER — the "so far" behavior you have now seen from both sides — and builds running totals and moving averages from it, the smoothing that turns a noisy telemetry channel into a readable trend.

::: context self-join-callback The self-join this replaces
In the joins module, pairing each reading with the one before it meant joining the table to itself and matching each row to the latest earlier row of the same satellite — a join condition plus a subquery to find "the latest earlier one". It works, but the database may compare each row with many others, and the query hides a simple idea under a lot of syntax. `LAG(value) OVER (PARTITION BY sat_id ORDER BY ts)` says the same thing in one expression, and the database answers it by sorting each satellite's rows once and reading them in order. The last lesson of this module weighs the two against each other.
:::

::: context lag-lead-picture Arrows between neighboring rows
LAG points each row at the one before it; LEAD at the one after. The wall between partitions stops both arrows, which is where the NULLs come from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="120" y="10" width="120" height="20" fill="#8fb8f0"/><rect x="120" y="34" width="120" height="20" fill="#8fb8f0"/>
    <rect x="120" y="58" width="120" height="20" fill="#8fb8f0"/><rect x="120" y="82" width="120" height="20" fill="#8fb8f0"/>
    <rect x="120" y="116" width="120" height="20" fill="#f2b880"/><rect x="120" y="140" width="120" height="20" fill="#f2b880"/>
    <rect x="120" y="164" width="120" height="20" fill="#f2b880"/>
  </g>
  <line x1="100" y1="109" x2="260" y2="109" stroke="#b4232c" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="268" y="113" font-size="11" fill="#b4232c">partition wall</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="180" y="24">SAT-001 00:00 0.90</text><text x="180" y="48">SAT-001 00:10 0.85</text>
    <text x="180" y="72">SAT-001 00:20 0.70</text><text x="180" y="96">SAT-001 00:30 0.75</text>
    <text x="180" y="130">SAT-002 00:00 0.50</text><text x="180" y="154">SAT-002 00:10 0.55</text>
    <text x="180" y="178">SAT-002 00:20 0.60</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5" fill="none">
    <path d="M118,44 C98,40 98,24 116,20"/><path d="M118,68 C98,64 98,48 116,44"/><path d="M118,92 C98,88 98,72 116,68"/>
    <path d="M118,150 C98,146 98,130 116,126"/><path d="M118,174 C98,170 98,154 116,150"/>
  </g>
  <text x="60" y="60" font-size="12" fill="#1d6fd1" text-anchor="middle">LAG</text>
  <text x="60" y="76" font-size="11" fill="#1d6fd1" text-anchor="middle">looks up</text>
  <text x="60" y="130" font-size="11" fill="#b4232c" text-anchor="middle">first row:</text>
  <text x="60" y="144" font-size="11" fill="#b4232c" text-anchor="middle">LAG is NULL</text>
  <text x="300" y="60" font-size="11" fill="#1f2a44" text-anchor="middle">last row:</text>
  <text x="300" y="74" font-size="11" fill="#1f2a44" text-anchor="middle">LEAD is NULL</text>
</svg>
```

Each blue arrow runs from a row to the row it reads with LAG. No arrow crosses the red wall, so SAT-002's first row gets NULL rather than SAT-001's 0.75.
:::

::: context eclipse-drain How fast does a real battery drain?
The numbers in this table are rounded to be easy to read, and they swing faster than most real batteries do. A well-sized satellite battery typically gives up no more than about a quarter to a third of its charge across a whole eclipse of about half an hour, and designers keep the deepest drain modest because deep cycles wear a battery out. A drop of 0.15 in ten minutes on a real spacecraft would be a strong hint that something is drawing far more power than planned — exactly the kind of change a delta query is written to catch.
:::

::: context epoch-word What the epoch is
An **epoch** is a fixed reference moment that times are counted from. Computers commonly use the Unix epoch: midnight UTC at the start of 1 January 1970. `EXTRACT(EPOCH FROM an_instant)` gives the seconds since that moment. `EXTRACT(EPOCH FROM an_interval)` — the use here — gives the interval's length in seconds, with no reference moment involved, so 30 minutes becomes 1800. SQLite's `unixepoch(ts)` gives seconds since the same 1970 moment, which is why subtracting two of them gives the step in seconds too.
:::

::: context named-window Why name a window
When three or four functions in one SELECT share a window, writing `OVER (PARTITION BY sat_id ORDER BY ts)` each time invites a typo: one copy ends up ordered by a different column, and one column of the result quietly disagrees with the others. `WINDOW w AS (...)` goes after WHERE, GROUP BY and HAVING and before ORDER BY, defines the window once, and every `OVER w` refers to it. It changes nothing about the result; it only makes a mismatch impossible. PostgreSQL and SQLite both accept it.
:::

::: context gap-threshold Choosing a gap threshold
Real samples never arrive exactly on the dot. Clocks drift, packets queue, and a sample due at 00:10:00 may be stamped 00:10:02. A threshold equal to the normal step, 10 minutes, would flag every sample that came a second late. A threshold of 1.5 steps flags a gap only when at least one whole sample is missing, since the next possible arrival after a missed one is about 2 steps later. Teams pick the factor from how much jitter their own telemetry shows.
:::

::: context gap-picture SAT-002's timeline
Samples are due every 10 minutes. SAT-002's samples at 00:30 and 00:40 never arrived, so the step from 00:20 to 00:50 is 30 minutes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="80">00:00</text><text x="90" y="80">00:10</text><text x="150" y="80">00:20</text>
    <text x="210" y="80">00:30</text><text x="270" y="80">00:40</text><text x="330" y="80">00:50</text>
  </g>
  <g fill="#1d6fd1">
    <circle cx="30" cy="50" r="6"/><circle cx="90" cy="50" r="6"/><circle cx="150" cy="50" r="6"/><circle cx="330" cy="50" r="6"/>
  </g>
  <g fill="#ffffff" stroke="#b4232c" stroke-width="1.5">
    <circle cx="210" cy="50" r="6"/><circle cx="270" cy="50" r="6"/>
  </g>
  <path d="M150,30 L150,24 L330,24 L330,30" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="240" y="18" font-size="12" fill="#b4232c" text-anchor="middle">gap: 30 min, 2 samples missing</text>
  <text x="180" y="102" font-size="11" fill="#6c7a93" text-anchor="middle">filled: received · open: expected but missing</text>
</svg>
```

LAG sees only the filled dots. On the 00:50 row it looks back to 00:20, and the 30-minute step is what flags the gap.
:::

::: context frame-preview The window grows, row by row
With `ORDER BY ts` and no frame, the window of each row runs from the partition's first row to the current row. On the 00:10 row, SAT-001's window holds two rows, so its last row is 00:10 itself. The explicit frame stretches the window over all four rows.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="110" y="16" width="130" height="22" fill="#8fb8f0"/><rect x="110" y="40" width="130" height="22" fill="#1d6fd1"/>
    <rect x="110" y="64" width="130" height="22" fill="#ffffff"/><rect x="110" y="88" width="130" height="22" fill="#ffffff"/>
  </g>
  <g font-size="12" text-anchor="middle">
    <text x="175" y="31" fill="#1f2a44">00:00  0.90</text><text x="175" y="55" fill="#ffffff">00:10  0.85</text>
    <text x="175" y="79" fill="#1f2a44">00:20  0.70</text><text x="175" y="103" fill="#1f2a44">00:30  0.75</text>
  </g>
  <path d="M104,16 L96,16 L96,62 L104,62" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="88" y="36" font-size="11" fill="#1d6fd1" text-anchor="end">default:</text>
  <text x="88" y="50" font-size="11" fill="#1d6fd1" text-anchor="end">2 rows so far</text>
  <path d="M246,16 L256,16 L256,110 L246,110" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="262" y="56" font-size="11" fill="#b4232c">UNBOUNDED</text>
  <text x="262" y="70" font-size="11" fill="#b4232c">FOLLOWING:</text>
  <text x="262" y="84" font-size="11" fill="#b4232c">all 4 rows</text>
  <text x="175" y="126" font-size="11" fill="#1f2a44" text-anchor="middle">current row: 00:10 (dark blue)</text>
</svg>
```

LAST_VALUE takes the bottom row of whichever bracket is in force: 0.85 (the current row) under the default, 0.75 under the explicit frame.
:::
