---
id: l05-frames
title: "Frames: ROWS, RANGE and the default"
minutes: 22
covers:
  - "Frames: ROWS BETWEEN n PRECEDING AND CURRENT ROW versus RANGE BETWEEN an interval"
  - The default frame and the classic LAST_VALUE surprise
---

Imagine two ways to describe "what I listened to recently": "my last five songs", or "everything I played in the last twenty minutes". On a normal afternoon they are the same songs. But skip through a dozen songs in two minutes and "the last five" covers only a moment. Pause for an hour and "the last five" reaches back more than an hour, while "the last twenty minutes" holds only the song playing now.

A window function faces exactly this choice every time it looks back. The rule that says which neighboring rows it uses is the **frame**. You have already met two frames: the whole-partition frame that fixed LAST_VALUE in lesson 03, and the sliding `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` behind lesson 04's moving average. This lesson takes the frame apart completely.

By the end you will know what the frame is when you write none at all — the **default frame** — and why that default makes LAST_VALUE return the current row. You will also know when to count rows (ROWS) and when to measure a span of time (RANGE), which matters on every telemetry stream whose samples do not arrive on a [[perfectly regular beat|irregular-sampling]].

## The parts of a frame clause

A frame clause sits inside `OVER (...)`, after the ORDER BY. Its full shape is:

```sql
function(...) OVER (PARTITION BY p ORDER BY o
                    {ROWS | RANGE | GROUPS} BETWEEN start AND end)
```

The curly brackets with bars mean "pick one of these". That choice is the **mode**: how distance from the current row is measured. ROWS counts rows, RANGE measures the difference in the ORDER BY value (such as minutes of time), and GROUPS counts groups of tied rows. Then come the **start** and the **end** of the frame.

The start and end are each one of five **bounds**:

| Bound | Read it as | Means |
| --- | --- | --- |
| `UNBOUNDED PRECEDING` | "from the very start" | the first row of the partition |
| `n PRECEDING` | "n before" | n rows back (ROWS), or n units of the ORDER BY value back (RANGE) |
| `CURRENT ROW` | "this row" | the current row (in RANGE and GROUPS mode, with its ties) |
| `n FOLLOWING` | "n after" | n rows, or n units, forward |
| `UNBOUNDED FOLLOWING` | "to the very end" | the last row of the partition |

The frame never leaves the partition, which is why lesson 04's moving average had short frames on its first rows. And the start must not come after the end: PostgreSQL refuses `ROWS BETWEEN CURRENT ROW AND 2 PRECEDING` with `frame starting from current row cannot have preceding rows`.

There is also a short form. Write only a start, and the end is CURRENT ROW:

```sql
SUM(value) OVER (PARTITION BY sat_id ORDER BY ts ROWS 2 PRECEDING)
-- means exactly
SUM(value) OVER (PARTITION BY sat_id ORDER BY ts
                 ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)
```

### Which functions look at the frame

The aggregates (SUM, AVG, COUNT, MIN, MAX) use the frame, and so do FIRST_VALUE, LAST_VALUE and NTH_VALUE, which pick a row by its position *in the frame*. The ranking functions and LAG and LEAD ignore it: they work on the whole partition in order, whatever frame you write.

::: key The frame
The frame is the set of rows, inside the current row's partition, that the function uses: `ROWS | RANGE | GROUPS BETWEEN start AND end`. Aggregates and FIRST_VALUE / LAST_VALUE / NTH_VALUE use it; ranking functions and LAG / LEAD ignore it.
:::

## The default frame

Most window queries never write a frame. Then the database [[uses a default|why-this-default]], and the default depends on one thing: whether there is an ORDER BY inside OVER.

- **No ORDER BY:** the frame is the whole partition. That is lesson 01's `AVG(value) OVER (PARTITION BY sat_id)`: every row sees all four of its satellite's readings.
- **With ORDER BY:** the frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. Read it as "from the very start, up to this row and every row tied with it". That is the "so far" window from lessons 01 and 04.

The phrase "and every row tied with it" is the part people miss. Rows that have the same ORDER BY value as the current row are called its **[[peers|peers-picture]]**. In RANGE mode, CURRENT ROW does not mean "this one row". It means "this row and all its peers", because RANGE measures by the ORDER BY value, and peers have exactly the same value. A distance of zero from the current row takes in all of them.

::: key The default frame
With ORDER BY inside OVER and no frame clause, the frame is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`: from the partition's first row up to the current row and all its peers (rows tied on the ORDER BY value). Without ORDER BY, the frame is the whole partition.
:::

When nothing ties, you never notice the difference. When rows do tie, you notice.

::: example Two thrusters, one timestamp
SAT-003 fires two thrusters, A and B, in the same instant on 6 March. The flight software logs each firing as its own row, with the same timestamp.

```sql
CREATE TABLE firings (
    sat_id   TEXT         NOT NULL,
    ts       TIMESTAMPTZ  NOT NULL,
    thruster TEXT         NOT NULL,
    prop_kg  NUMERIC(5,2) NOT NULL
);

INSERT INTO firings VALUES
 ('SAT-003','2026-03-04T09:00:00Z','A',0.30),
 ('SAT-003','2026-03-06T15:10:00Z','A',0.20),
 ('SAT-003','2026-03-06T15:10:00Z','B',0.15),
 ('SAT-003','2026-03-11T06:30:00Z','A',0.25);
```

You want a running total of propellant used, as in lesson 04. Here is the same total four ways:

```sql
SELECT ts, thruster, prop_kg,
  SUM(prop_kg) OVER (ORDER BY ts) AS default_frame,
  SUM(prop_kg) OVER (ORDER BY ts RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS range_explicit,
  SUM(prop_kg) OVER (ORDER BY ts ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS rows_frame,
  SUM(prop_kg) OVER (ORDER BY ts, thruster) AS tiebroken,
  SUM(prop_kg) OVER () AS no_order
FROM firings
ORDER BY ts, thruster;
```

```text
           ts           | thruster | prop_kg | default_frame | range_explicit | rows_frame | tiebroken | no_order
------------------------+----------+---------+---------------+----------------+------------+-----------+----------
 2026-03-04 09:00:00+00 | A        |    0.30 |          0.30 |           0.30 |       0.30 |      0.30 |     0.90
 2026-03-06 15:10:00+00 | A        |    0.20 |          0.65 |           0.65 |       0.50 |      0.50 |     0.90
 2026-03-06 15:10:00+00 | B        |    0.15 |          0.65 |           0.65 |       0.65 |      0.65 |     0.90
 2026-03-11 06:30:00+00 | A        |    0.25 |          0.90 |           0.90 |       0.90 |      0.90 |     0.90
```

**Step 1: the default.** On the thruster-A row of 6 March, the frame is "everything up to this row and its peers". Its peer is the thruster-B row, same timestamp. So the sum is $0.30 + 0.20 + 0.15 = 0.65$, and the B row gets the same 0.65. The two tied rows share one running total. The `range_explicit` column is identical, which proves the default really is that RANGE frame.

**Step 2: ROWS.** A ROWS frame stops at exactly the current row. The A row gets $0.30 + 0.20 = 0.50$, the B row $0.50 + 0.15 = 0.65$. The total climbs one row at a time. But which of the two tied rows comes first is not defined by `ORDER BY ts` alone, so on another day the database may put B first, and the 0.50 would become 0.45.

**Step 3: a tie-breaker.** With `ORDER BY ts, thruster` no two rows are peers any more, so RANGE and ROWS agree, and the result cannot change from run to run.

**Step 4: no ORDER BY.** The frame is the whole partition: every row shows the grand total, $0.30 + 0.20 + 0.15 + 0.25 = 0.90$. The other versions also end at 0.90 and differ only on the tied rows, as they should.
:::

::: warning Ties in a running total
With the default frame, rows that tie on the ORDER BY value all get the same running total — the total *after* the whole tied group. If you want the total to climb one row at a time, either add columns to the ORDER BY until no two rows tie, or write `ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` and still add a tie-breaker so the order is repeatable.
:::

## Why LAST_VALUE returns the current row

Lesson 03 showed the surprise and a fix: `LAST_VALUE(value) OVER (PARTITION BY sat_id ORDER BY ts)` gives each row its own value, not the satellite's final reading. Now you can see exactly why, in three steps.

1. There is an ORDER BY and no frame clause, so the frame is the default, `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`.
2. That frame ends at the current row (plus its peers). Nothing after the current row is in it.
3. LAST_VALUE returns the value from the last row *of the frame*. The last row of a [[frame that ends at the current row|lopsided-frame]] is the current row.

So LAST_VALUE did exactly what it was told; it was told the wrong thing. FIRST_VALUE never has this problem, because the default frame starts at the partition's first row. NTH_VALUE is caught halfway: `NTH_VALUE(value, 3)` is NULL on the first two rows, whose frames do not yet hold three rows.

The fix is to state the frame you meant: the whole partition.

```sql
SELECT sat_id, ts, value,
       LAST_VALUE(value) OVER (PARTITION BY sat_id ORDER BY ts
           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS latest,
       value - LAST_VALUE(value) OVER (PARTITION BY sat_id ORDER BY ts
           ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS above_latest
FROM soc
WHERE sat_id IN ('SAT-002', 'SAT-003')
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value | latest | above_latest
---------+------------------------+-------+--------+--------------
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50 |   0.63 |        -0.13
 SAT-002 | 2026-03-01 00:10:00+00 |  0.55 |   0.63 |        -0.08
 SAT-002 | 2026-03-01 00:20:00+00 |  0.60 |   0.63 |        -0.03
 SAT-002 | 2026-03-01 00:50:00+00 |  0.63 |   0.63 |         0.00
 SAT-003 | 2026-03-01 00:00:00+00 |  0.81 |   0.75 |         0.06
 SAT-003 | 2026-03-01 00:10:00+00 |  0.78 |   0.75 |         0.03
 SAT-003 | 2026-03-01 00:20:00+00 |  0.78 |   0.75 |         0.03
 SAT-003 | 2026-03-01 00:30:00+00 |  0.75 |   0.75 |         0.00
```

Every SAT-002 row now sees its latest reading, 0.63. Check one difference: $0.50 - 0.63 = -0.13$.

::: key Why LAST_VALUE without a frame returns the current row
The default frame with ORDER BY is RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW, so the last row seen so far is the current one. Specify ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING to mean the last row of the partition.
:::

### The twist: peers again

Strictly, the default frame ends at the current row's *last peer*. When nothing ties, that is the current row. When something ties, LAST_VALUE can hand back another row's value. Order SAT-003's readings by value, and ask for the time of the frame's last row:

```sql
SELECT ts, value,
       LAST_VALUE(ts) OVER (PARTITION BY sat_id ORDER BY value) AS lv_ts,
       COUNT(*) OVER (PARTITION BY sat_id ORDER BY value) AS n_at_or_below
FROM soc
WHERE sat_id = 'SAT-003'
ORDER BY value, ts;
```

```text
           ts           | value |         lv_ts          | n_at_or_below
------------------------+-------+------------------------+---------------
 2026-03-01 00:30:00+00 |  0.75 | 2026-03-01 00:30:00+00 |             1
 2026-03-01 00:10:00+00 |  0.78 | 2026-03-01 00:20:00+00 |             3
 2026-03-01 00:20:00+00 |  0.78 | 2026-03-01 00:20:00+00 |             3
 2026-03-01 00:00:00+00 |  0.81 | 2026-03-01 00:00:00+00 |             4
```

Look at the two 0.78 rows. Both frames hold the same three rows (the 0.75 and both 0.78s), so both show `n_at_or_below` = 3. The frame's last row is whichever 0.78 the database put last. Here that was 00:20, so the 00:10 row reports 00:20 — another row's time. On another day the database may order the tie the other way.

::: warning LAST_VALUE with ties
Without an explicit frame, LAST_VALUE returns the last *peer* of the current row, which is the current row only when nothing ties. With ties it can return another row's value, chosen arbitrarily. Either give the whole-partition frame, or make the ORDER BY unique, or use `FIRST_VALUE(x) OVER (... ORDER BY t DESC)`, which needs no frame at all.
:::

## ROWS versus RANGE: counting samples or measuring time

Lesson 04 ended on a problem: three samples of SAT-002 cover 40 minutes on one row and 20 on another. The fix is a frame measured on the clock.

A **RANGE frame with an offset** measures distance using the ORDER BY value itself. With `ORDER BY ts`, the offset is a length of time:

```sql
RANGE BETWEEN INTERVAL '20 minutes' PRECEDING AND CURRENT ROW
```

Read it as "every row whose time is at most 20 minutes before this row's time, up to this row". For a row at 00:50, that is every row with `ts` from 00:30 to 00:50, both ends included, however many or few there are. `INTERVAL '20 minutes'` is PostgreSQL's way to write a length of time, as you met in the first SQL module. Other databases spell it differently — MySQL writes `INTERVAL 20 MINUTE` with no quotes — but the idea is identical.

Here are the two side by side on SAT-002:

```sql
SELECT ts, value,
       ROUND(AVG(value) OVER by_rows, 3) AS rows_avg,
       COUNT(*)         OVER by_rows     AS rows_n,
       ROUND(AVG(value) OVER by_time, 3) AS time_avg,
       COUNT(*)         OVER by_time     AS time_n
FROM soc
WHERE sat_id = 'SAT-002'
WINDOW by_rows AS (PARTITION BY sat_id ORDER BY ts
                   ROWS BETWEEN 2 PRECEDING AND CURRENT ROW),
       by_time AS (PARTITION BY sat_id ORDER BY ts
                   RANGE BETWEEN INTERVAL '20 minutes' PRECEDING AND CURRENT ROW)
ORDER BY ts;
```

```text
           ts           | value | rows_avg | rows_n | time_avg | time_n
------------------------+-------+----------+--------+----------+--------
 2026-03-01 00:00:00+00 |  0.50 |    0.500 |      1 |    0.500 |      1
 2026-03-01 00:10:00+00 |  0.55 |    0.525 |      2 |    0.525 |      2
 2026-03-01 00:20:00+00 |  0.60 |    0.550 |      3 |    0.550 |      3
 2026-03-01 00:50:00+00 |  0.63 |    0.593 |      3 |    0.630 |      1
```

On the first three rows the samples are regular, and the frames agree. On the 00:50 row they split. The ROWS frame reached back to 00:10 and averaged $(0.55 + 0.60 + 0.63)/3 = 0.593$. The RANGE frame looked for readings from 00:30 to 00:50, found only the current one, and gave 0.630. That is honest: in the last 20 minutes there really was only one reading, and `time_n` = 1 says so.

::: example A burst of fast samples
Telemetry often speeds up during an event. Here SAT-001's bus temperature is logged once a minute, until a heater switches on at 00:03 and the flight software samples every 10 seconds for half a minute:

```sql
CREATE TABLE bus_temp (
    sat_id TEXT         NOT NULL,
    ts     TIMESTAMPTZ  NOT NULL,
    temp_c NUMERIC(4,1) NOT NULL
);

INSERT INTO bus_temp VALUES
 ('SAT-001','2026-03-01T00:00:00Z',20.0),
 ('SAT-001','2026-03-01T00:01:00Z',20.2),
 ('SAT-001','2026-03-01T00:02:00Z',20.4),
 ('SAT-001','2026-03-01T00:03:00Z',20.6),
 ('SAT-001','2026-03-01T00:03:10Z',23.9),
 ('SAT-001','2026-03-01T00:03:20Z',24.3),
 ('SAT-001','2026-03-01T00:03:30Z',24.1),
 ('SAT-001','2026-03-01T00:04:30Z',21.0),
 ('SAT-001','2026-03-01T00:05:30Z',20.8);
```

The monitoring page wants "the average over the last two minutes". One engineer writes a three-sample ROWS frame (three once-a-minute samples span two minutes); another writes a two-minute RANGE frame. The query shows both, plus the seconds the ROWS frame really spans:

```sql
SELECT ts, temp_c,
       EXTRACT(EPOCH FROM ts - MIN(ts) OVER by_rows)::int AS rows_span_s,
       ROUND(AVG(temp_c) OVER by_rows, 2) AS rows_avg,
       COUNT(*) OVER by_time AS time_n,
       ROUND(AVG(temp_c) OVER by_time, 2) AS time_avg
FROM bus_temp
WINDOW by_rows AS (ORDER BY ts ROWS BETWEEN 2 PRECEDING AND CURRENT ROW),
       by_time AS (ORDER BY ts RANGE BETWEEN INTERVAL '2 minutes' PRECEDING AND CURRENT ROW)
ORDER BY ts;
```

```text
           ts           | temp_c | rows_span_s | rows_avg | time_n | time_avg
------------------------+--------+-------------+----------+--------+----------
 2026-03-01 00:00:00+00 |   20.0 |           0 |    20.00 |      1 |    20.00
 2026-03-01 00:01:00+00 |   20.2 |          60 |    20.10 |      2 |    20.10
 2026-03-01 00:02:00+00 |   20.4 |         120 |    20.20 |      3 |    20.20
 2026-03-01 00:03:00+00 |   20.6 |         120 |    20.40 |      3 |    20.40
 2026-03-01 00:03:10+00 |   23.9 |          70 |    21.63 |      3 |    21.63
 2026-03-01 00:03:20+00 |   24.3 |          20 |    22.93 |      4 |    22.30
 2026-03-01 00:03:30+00 |   24.1 |          20 |    24.10 |      5 |    22.66
 2026-03-01 00:04:30+00 |   21.0 |          70 |    23.13 |      5 |    22.78
 2026-03-01 00:05:30+00 |   20.8 |         120 |    21.97 |      3 |    21.97
```

(`EXTRACT(EPOCH FROM ...)` turns an interval into seconds, as in lesson 03; `::int` rounds it to a whole number.)

**Step 1: the quiet minutes.** Up to 00:03:00 the samples are a minute apart, both frames hold the same rows, and they agree: at 00:03:00, $(20.2 + 20.4 + 20.6)/3 = 20.40$.

**Step 2: the burst.** At 00:03:30 the ROWS frame is the last three samples, 00:03:10 to 00:03:30. It spans only **20 seconds**, not two minutes, as the [[time line|burst-timeline]] shows. Its average, $(23.9 + 24.3 + 24.1)/3 = 72.3/3 = 24.10$, is the heater's peak alone. The RANGE frame reaches back to 00:01:30 and holds five rows: 00:02:00, 00:03:00 and the three burst samples. Its average is $(20.4 + 20.6 + 23.9 + 24.3 + 24.1)/5 = 113.3/5 = 22.66$.

**Result.** The label "two-minute average" is true of `time_avg` on every row, and of `rows_avg` only where the sampling happened to be regular: the ROWS frame's span wandered from 20 s to 120 s.

**Sanity check.** Both averages sit between their frame's lowest and highest readings. And at 00:05:30, with samples a minute apart again, the two frames hold the same three rows and agree at 21.97.
:::

::: key ROWS frame versus RANGE frame
ROWS counts a fixed number of neighboring rows; RANGE spans a value interval of the ORDER BY column, for example five minutes of time. For irregularly sampled telemetry, ROWS gives an inconsistent time window and RANGE gives a consistent one.
:::

### Choosing between them

Ask one question: **is my window a number of samples, or a length of time?**

- "The last 10 samples", "the previous 3 burns", "smooth over 5 points": a count. Use **ROWS**.
- "The last 5 minutes", "within 1 hour either side", "the past 24 hours": a time span. Use **RANGE** with an interval.
- On perfectly regular data the two agree. But telemetry guaranteed never to have a dropout, a retransmission or a rate change is rare. When in doubt, choose RANGE, and add a `COUNT(*)` over the same window so you can see when a frame is thin.

A RANGE frame is also not the same thing as a **[[time-weighted average|time-weighted]]**. In the burst example, the three burst samples cover 30 seconds but count as three votes in the RANGE average. RANGE fixes *which* rows are in the frame; it still weights each row equally.

::: warning RANGE with an offset has two rules
PostgreSQL enforces both, with clear errors:

- The ORDER BY must be **exactly one column**. `ORDER BY sat_id, ts RANGE BETWEEN INTERVAL '20 minutes' PRECEDING ...` fails with `RANGE with offset PRECEDING/FOLLOWING requires exactly one ORDER BY column`. Put `sat_id` in PARTITION BY, where it belongs.
- The offset must be the **right kind of quantity** for that column: an interval for a timestamp, a number for a number. `ORDER BY ts RANGE BETWEEN 20 PRECEDING ...` fails, because "20 what?" has no answer for a time.

The default frame, which has no offset, works with any ORDER BY.
:::

## GROUPS: counting groups of ties

The third mode is [[less common|groups-history]], but it finishes the picture. **GROUPS** counts **peer groups** — sets of rows tied on the ORDER BY value — instead of single rows. `GROUPS BETWEEN 1 PRECEDING AND CURRENT ROW` means "the current row's group of ties, plus the one group before it".

On the thruster table, the two 6 March firings form one group:

```sql
SELECT ts, thruster, prop_kg,
  SUM(prop_kg) OVER (ORDER BY ts GROUPS BETWEEN 1 PRECEDING AND CURRENT ROW) AS groups1,
  SUM(prop_kg) OVER (ORDER BY ts ROWS BETWEEN 1 PRECEDING AND CURRENT ROW) AS rows1
FROM firings
ORDER BY ts, thruster;
```

```text
           ts           | thruster | prop_kg | groups1 | rows1
------------------------+----------+---------+---------+-------
 2026-03-04 09:00:00+00 | A        |    0.30 |    0.30 |  0.30
 2026-03-06 15:10:00+00 | A        |    0.20 |    0.65 |  0.50
 2026-03-06 15:10:00+00 | B        |    0.15 |    0.65 |  0.35
 2026-03-11 06:30:00+00 | A        |    0.25 |    0.60 |  0.40
```

On 11 March, GROUPS takes the whole 6 March group plus the current row: $0.20 + 0.15 + 0.25 = 0.60$. ROWS takes one row back, $0.15 + 0.25 = 0.40$, splitting the 6 March event in half. Use GROUPS when "one step back" should mean "one distinct timestamp back".

## Frames in SQLite

SQLite supports all three modes and every bound. Two points matter for the exercises.

**RANGE offsets must be numbers.** SQLite has no interval type, and the timestamps are ISO-8601 text. So you order by a number that stands for the time, and give the offset in the same unit. The best choice is `unixepoch(ts)`, whole seconds since 1970, which you met in the first SQL module. Twenty minutes is 1200 seconds:

```sql
SELECT ts, value,
       ROUND(AVG(value) OVER (PARTITION BY sat_id ORDER BY unixepoch(ts)
             RANGE BETWEEN 1200 PRECEDING AND CURRENT ROW), 3) AS time_avg,
       COUNT(*) OVER (PARTITION BY sat_id ORDER BY unixepoch(ts)
             RANGE BETWEEN 1200 PRECEDING AND CURRENT ROW) AS time_n
FROM soc
WHERE sat_id = 'SAT-002'
ORDER BY ts;
```

```text
ts                    value  time_avg  time_n
--------------------  -----  --------  ------
2026-03-01T00:00:00Z  0.5    0.5       1
2026-03-01T00:10:00Z  0.55   0.525     2
2026-03-01T00:20:00Z  0.6    0.55      3
2026-03-01T00:50:00Z  0.63   0.63      1
```

Same answers as the PostgreSQL version. `unixepoch(ts)` is a single expression, so the one-column rule still holds.

::: warning Two SQLite traps with RANGE
**Forgetting the conversion gives a wrong answer, not an error.** `ORDER BY ts RANGE BETWEEN 1200 PRECEDING AND CURRENT ROW` on the text column runs without complaint, and every row's frame holds only itself (`time_n` is 1 on all four rows). Text minus a number is not a time, and SQLite does not stop you. Always check a RANGE frame with a `COUNT(*)` beside it.

**Avoid `julianday()` for the edges.** `julianday(ts)` gives days as a [[floating-point number|julianday-float]], so twenty minutes is $20/1440$ of a day, which binary floating point cannot store exactly. A sample exactly 20 minutes back may land a hair inside or a hair outside the frame, depending on rounding. `unixepoch()` gives whole seconds, so the edge is exact.
:::

GROUPS frames and numeric RANGE offsets need SQLite 3.28 or later; the browser build the exercises use is far newer.

## Check yourself

::: check
For each query below, say which frame the database uses, in full.

1. `AVG(value) OVER (PARTITION BY sat_id)`
2. `AVG(value) OVER (PARTITION BY sat_id ORDER BY ts)`
3. `AVG(value) OVER (PARTITION BY sat_id ORDER BY ts ROWS 4 PRECEDING)`
:::

::: answer
1. No ORDER BY, so the frame is the whole partition: every row of that satellite, whatever its position.
2. ORDER BY and no frame clause, so the default: `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` — from the satellite's first row up to the current row and its peers.
3. The short form with only a start: `ROWS BETWEEN 4 PRECEDING AND CURRENT ROW` — the current row and up to four rows before it, five rows at most.
:::

::: check
A query uses `FIRST_VALUE(value) OVER (PARTITION BY sat_id ORDER BY ts)` and `LAST_VALUE(value)` with the same OVER. One gives what the author expected on every row and the other does not. Which is which, and why does the default frame treat them differently?
:::

::: answer
FIRST_VALUE is right: it returns each satellite's first reading on every row. LAST_VALUE is "wrong": it returns each row's own value.

The default frame, `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`, is lopsided. Its start is the partition's first row, which is what FIRST_VALUE reports. Its end is the current row (with its peers), which is what LAST_VALUE reports. `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` makes it reach both ways.
:::

::: check
Using the `bus_temp` table, how many rows are in the frame `RANGE BETWEEN INTERVAL '1 minute' PRECEDING AND CURRENT ROW` on the 00:03:30 row, and what is the average?
:::

::: answer
The frame holds every row with `ts` from 00:02:30 to 00:03:30, ends included. Those are 00:03:00 (20.6), 00:03:10 (23.9), 00:03:20 (24.3) and 00:03:30 (24.1): **4 rows**. (00:02:00 is 90 seconds back, outside the frame.)

Average: $(20.6 + 23.9 + 24.3 + 24.1)/4 = 92.9/4 = 23.225$, about 23.2 °C. It sits between the lowest (20.6) and highest (24.3) readings in the frame, as an average must.
:::

::: check
A ground-station link reports the signal strength whenever it changes by more than 1 dB, so samples come anywhere from 0.1 s to 30 s apart. You need "the mean signal over the last 10 seconds". Which frame do you write in PostgreSQL, and what changes in SQLite?
:::

::: answer
The window is a length of time, and the sampling is very irregular, so a RANGE frame:

```sql
AVG(signal_db) OVER (PARTITION BY station ORDER BY ts
                     RANGE BETWEEN INTERVAL '10 seconds' PRECEDING AND CURRENT ROW)
```

A ROWS frame of 10 samples might cover one second or five minutes.

In SQLite, order by seconds and give the offset in seconds: `ORDER BY unixepoch(ts) RANGE BETWEEN 10 PRECEDING AND CURRENT ROW`. (`unixepoch(ts, 'subsec')` keeps fractions of a second.) Put a `COUNT(*)` over the same window beside it: a mean of one sample is not a mean of fifty.
:::

## Summary

| Idea | SQL | Meaning |
| --- | --- | --- |
| Frame | `ROWS / RANGE / GROUPS BETWEEN start AND end` | the rows of the partition a frame-aware function uses |
| Bounds | `UNBOUNDED PRECEDING`, `n PRECEDING`, `CURRENT ROW`, `n FOLLOWING`, `UNBOUNDED FOLLOWING` | where the frame starts and stops; never outside the partition |
| Default frame | `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` | with ORDER BY: start of partition to the current row and its peers; without: whole partition |
| Peers | — | rows tied on the ORDER BY value; RANGE and GROUPS treat them together |
| LAST_VALUE fix | `ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING` | the partition's last row, not the current row |
| ROWS | `ROWS BETWEEN n PRECEDING AND CURRENT ROW` | a fixed count of samples; its time span varies |
| RANGE with interval | `RANGE BETWEEN INTERVAL '5 minutes' PRECEDING AND CURRENT ROW` | a fixed span of time; its sample count varies |
| GROUPS | `GROUPS BETWEEN 1 PRECEDING AND CURRENT ROW` | counts groups of ties |
| SQLite | `ORDER BY unixepoch(ts) RANGE BETWEEN 300 PRECEDING AND CURRENT ROW` | numeric offsets only; seconds, not `julianday()` |

Next lesson returns to ROW_NUMBER from lesson 02 and puts it to its most common real job: throwing away duplicate downlinked samples and keeping exactly one row — often the latest one — per satellite and channel.

::: context irregular-sampling Why telemetry is rarely regular
On paper a channel is "sampled at 1 Hz". In the database it rarely looks like that. Packets are lost when a pass ends or the link fades, so there are gaps. Flight software often raises the rate during an event — a burn, a fault, a heater switching — so there are bursts. Some channels are only sent when they change by more than a set amount, so quiet periods produce almost nothing. And the same frame can arrive twice over two ground stations, which lesson 06 deals with. Any window you describe in minutes should be measured in minutes, not in rows.
:::

::: context why-this-default Why the standard picked this default
The default is easiest to understand from what it buys. Stopping at the current row makes `SUM(x) OVER (ORDER BY t)` a running total with no extra typing. Measuring in RANGE rather than ROWS means the result never depends on an order the query did not give: rows tied on the ORDER BY value are treated as one step, so every run returns the same numbers. The price is the LAST_VALUE surprise, and the tie behavior you see in the thruster example. Many style guides now say: whenever the frame matters, write it out.
:::

::: context peers-picture Peers share one step
Ordered by time, SAT-003's thruster log has two rows at 15:10 on 6 March. They are peers. Under the default RANGE frame, a running total treats them as one step; under ROWS it takes them one at a time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="100" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">RANGE (default)</text>
  <text x="270" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">ROWS</text>
  <g stroke="#1f2a44" stroke-width="1" fill="#ffffff">
    <rect x="20" y="26" width="160" height="24"/><rect x="20" y="74" width="160" height="24"/>
    <rect x="200" y="26" width="140" height="24"/><rect x="200" y="50" width="140" height="24"/>
    <rect x="200" y="74" width="140" height="24"/><rect x="200" y="98" width="140" height="24"/>
  </g>
  <rect x="20" y="50" width="160" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="20" y="98" width="160" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="18" y="48" width="164" height="52" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44">
    <text x="26" y="42">04 Mar  A  0.30</text><text x="140" y="42">0.30</text>
    <text x="26" y="66">06 Mar  A  0.20</text><text x="140" y="66">0.65</text>
    <text x="26" y="90">06 Mar  B  0.15</text><text x="140" y="90">0.65</text>
    <text x="26" y="114">11 Mar  A  0.25</text><text x="140" y="114">0.90</text>
    <text x="206" y="42">04 Mar  A</text><text x="300" y="42">0.30</text>
    <text x="206" y="66">06 Mar  A</text><text x="300" y="66">0.50</text>
    <text x="206" y="90">06 Mar  B</text><text x="300" y="90">0.65</text>
    <text x="206" y="114">11 Mar  A</text><text x="300" y="114">0.90</text>
  </g>
  <text x="100" y="146" font-size="11" fill="#1d6fd1" text-anchor="middle">blue box: one group of peers</text>
</svg>
```

The numbers on the right of each column are the running totals from the thruster example.
:::

::: context lopsided-frame The default frame reaches back, never forward
For SAT-001 ordered by time, each row's default frame (blue) runs from the partition's first row down to the row itself. FIRST_VALUE reads the top of the blue bar; LAST_VALUE reads its bottom, which is the current row.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="92" y="41">00:00  0.90</text><text x="92" y="69">00:10  0.85</text>
    <text x="92" y="97">00:20  0.70</text><text x="92" y="125">00:30  0.75</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="130" y="16">row 1</text><text x="180" y="16">row 2</text><text x="230" y="16">row 3</text><text x="280" y="16">row 4</text>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="115" y="28" width="30" height="20"/>
    <rect x="165" y="28" width="30" height="48"/>
    <rect x="215" y="28" width="30" height="76"/>
    <rect x="265" y="28" width="30" height="104"/>
  </g>
  <g fill="#1d6fd1">
    <rect x="115" y="40" width="30" height="8"/><rect x="165" y="68" width="30" height="8"/>
    <rect x="215" y="96" width="30" height="8"/><rect x="265" y="124" width="30" height="8"/>
  </g>
  <g font-size="11" fill="#b4232c" text-anchor="middle">
    <text x="130" y="152">0.90</text><text x="180" y="152">0.85</text><text x="230" y="152">0.70</text><text x="280" y="152">0.75</text>
  </g>
  <text x="205" y="168" font-size="11" fill="#b4232c" text-anchor="middle">what LAST_VALUE returns on each row</text>
</svg>
```

The dark strip at the bottom of each bar is the current row. The red numbers are what LAST_VALUE returns: each row's own value.
:::

::: context burst-timeline Three samples: two minutes or twenty seconds
Each dot is one `bus_temp` sample on a time line from 00:00 to 00:05:30. The two frames are drawn for the 00:03:30 row.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="345" y2="70" stroke="#1f2a44" stroke-width="1.2"/>
  <g fill="#1f2a44">
    <circle cx="30" cy="70" r="3.5"/><circle cx="85" cy="70" r="3.5"/><circle cx="140" cy="70" r="3.5"/>
    <circle cx="195" cy="70" r="3.5"/><circle cx="204.2" cy="70" r="3.5"/><circle cx="213.3" cy="70" r="3.5"/>
    <circle cx="222.5" cy="70" r="3.5"/><circle cx="277.5" cy="70" r="3.5"/><circle cx="332.5" cy="70" r="3.5"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="90">00:00</text><text x="85" y="90">00:01</text><text x="140" y="90">00:02</text>
    <text x="195" y="90">00:03</text><text x="277.5" y="90">00:04:30</text><text x="332.5" y="90">00:05:30</text>
  </g>
  <rect x="202" y="44" width="23" height="12" fill="#f2b880" stroke="#1f2a44" stroke-width="0.8"/>
  <text x="213" y="36" font-size="11" fill="#1f2a44" text-anchor="middle">ROWS 2 PRECEDING: 20 s, 3 rows</text>
  <rect x="112.5" y="102" width="110" height="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="0.8"/>
  <text x="168" y="131" font-size="11" fill="#1f2a44" text-anchor="middle">RANGE 2 minutes: 5 rows</text>
</svg>
```

The scale is 55 pixels to the minute. The orange bar is a sliver because three burst samples sit 10 s apart; the blue bar is always two minutes long.
:::

::: context time-weighted Equal votes, unequal time
A RANGE frame decides which samples are in the window. It then averages them like any average: each sample one vote. If the burst samples come every 10 s and the quiet ones every 60 s, the burst gets six times as many votes per minute. A **time-weighted average** instead weights each sample by how long it stayed the current value, which gives the true mean of a signal held between samples. SQL can compute it — multiply each value by the gap to the next sample (LEAD from lesson 03), sum, and divide by the total time — but it is a separate calculation, not a frame setting. Downsampling in lesson 09 raises the same question.
:::

::: context groups-history A later addition, not everywhere
ROWS and RANGE came with window functions themselves; GROUPS is a later addition to the SQL standard, in its 2011 revision. The standard also has an `EXCLUDE` option that drops rows from the frame: `EXCLUDE CURRENT ROW`, for example, turns `ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING` into "the average of my two neighbors, without me", handy for spotting a reading that disagrees with the samples around it. PostgreSQL added GROUPS, EXCLUDE and RANGE offsets in version 11 (2018); SQLite in 3.28 (2019). Several popular databases still lack GROUPS, so check before relying on it.
:::

::: context julianday-float The edge that moves
`julianday()` counts days since a date more than 6,700 years ago, as a floating-point number. One second is $1/86400$ of a day, which binary floating point cannot hold exactly, and neither can most timestamps. A test run for this lesson: a day of samples one second apart, with the frame `ORDER BY julianday(ts) RANGE BETWEEN 60/86400.0 PRECEDING AND CURRENT ROW`. Every frame should hold 61 samples. Of the 82,800 rows from 01:00 onwards, 7,359 held only 60: rounding pushed the sample exactly 60 s back a hair outside. The same frame on `unixepoch(ts)` with `60 PRECEDING` held 61 every time.
:::
