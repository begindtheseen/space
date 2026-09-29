---
id: l09-downsampling-and-binning
title: Downsampling into time buckets
minutes: 21
covers:
  - Downsampling and binning with date_trunc or time_bucket
---

A weather report does not read out every thermometer reading of the day. It says "high of 31, low of 18". Notice what it does *not* say: "average of 24". The average is a fine number, but it would hide the one thing you needed to know — that the afternoon was hot. So the report keeps the extremes.

Spacecraft telemetry needs the same treatment, only more so. A **[[gyro|gyro-word]]** channel sampled at 10 Hz — ten readings a second — produces $10 \times 86\,400 = 864\,000$ samples per day, and over six million a week. A plot of that week is perhaps [[1,500 pixels wide|pixel-budget]]. Nobody can look at six million points, and the database should not have to send them. The data has to be reduced first.

**Downsampling** means turning many samples into fewer, each standing for a stretch of time. The usual way is **binning**, also called **bucketing**: cut time into equal slices — **buckets** or **bins**, such as whole minutes — and replace all the samples in each bucket with a few summary numbers. This lesson shows how to make the buckets in PostgreSQL with `date_trunc` and `date_bin`, what the TimescaleDB extension's `time_bucket` adds, how to do the same in SQLite, and — most important — which summary numbers to keep so that nothing important disappears.

## The high-rate channel

The running example is one satellite's body rate about one axis, in degrees per second, sampled at 10 Hz for two and a half minutes: 1,500 rows. PostgreSQL can make the rows for you with `generate_series` from the last module's recursive-CTE lesson:

```sql
CREATE TABLE gyro (
    sat_id   TEXT         NOT NULL,
    ts       TIMESTAMPTZ  NOT NULL,
    rate_dps NUMERIC(6,4) NOT NULL    -- body rate, degrees per second
);

INSERT INTO gyro
SELECT 'SAT-001',
       timestamptz '2026-03-01 00:00:00+00' + i * interval '100 milliseconds',
       round((0.05 * sin(i / 40.0)
              + CASE WHEN i BETWEEN 830 AND 839 THEN 1.2 ELSE 0 END)::numeric, 4)
FROM generate_series(0, 1499) AS i;
```

Read it as: sample number `i` runs from 0 to 1499; its time is `i` tenths of a second after midnight; its value is a gentle wobble between −0.05 and +0.05 °/s. Samples 830 to 839, one second starting at 00:01:23, get an extra 1.2 °/s. That is a **transient**: a short excursion, the kind a thruster misfire or a [[micrometeoroid hit|transient-causes]] leaves in a rate channel.

```text
            ts            | rate_dps
--------------------------+----------
 2026-03-01 00:01:22.8+00 |   0.0481
 2026-03-01 00:01:22.9+00 |   0.0477
 2026-03-01 00:01:23+00   |   1.2473
 2026-03-01 00:01:23.1+00 |   1.2469
 ...                      |   ...
 2026-03-01 00:01:23.9+00 |   1.2425
 2026-03-01 00:01:24+00   |   0.0418
```

Ten samples out of 1,500 — and they are the only ones anybody will care about.

## Making the bucket key with date_trunc

To put samples into minute buckets, each sample needs a **bucket key**: a value that is the same for every sample in the same minute. The natural key is the minute's starting time. PostgreSQL's `date_trunc(unit, ts)` makes it by cutting off everything smaller than the unit. Read `date_trunc('minute', ts)` as "ts, truncated to the minute" — the way you truncate a number by chopping off its decimals:

```sql
SELECT date_trunc('second', t) AS to_second,
       date_trunc('minute', t) AS to_minute,
       date_trunc('hour',   t) AS to_hour,
       date_trunc('day',    t) AS to_day
FROM (SELECT timestamptz '2026-03-01 14:37:52.8+00' AS t) AS x;
```

```text
       to_second        |       to_minute        |        to_hour         |         to_day
------------------------+------------------------+------------------------+------------------------
 2026-03-01 14:37:52+00 | 2026-03-01 14:37:00+00 | 2026-03-01 14:00:00+00 | 2026-03-01 00:00:00+00
```

Truncation always rounds *down*, never to the nearest. 14:37:52.8 belongs to the minute that starts at 14:37:00, even though it is closer to 14:38. So each bucket is **[[half-open|half-open-buckets]]**: it holds every time from its label up to, but not including, the next label. The minute labeled 14:37 holds 14:37:00.0 through 14:37:59.999999. No sample can fall into two buckets, and none falls between them.

Other units work the same way: `'week'`, `'month'`, `'year'`, and smaller ones like `'millisecond'`.

::: key date_trunc
`date_trunc('minute', ts)` rounds a timestamp down to the start of its minute, so every sample in the same minute gets the same bucket key. Buckets are half-open and labeled by their start time. GROUP BY the key to make one row per bucket.
:::

## What to keep from each bucket

With a key, the downsampling query is GROUP BY plus aggregates, straight from the last module. The only real question is which aggregates:

```sql
SELECT date_trunc('minute', ts) AS minute,
       COUNT(*)                 AS n,
       MIN(rate_dps)            AS min_dps,
       MAX(rate_dps)            AS max_dps,
       ROUND(AVG(rate_dps), 4)  AS mean_dps
FROM gyro
GROUP BY date_trunc('minute', ts)
ORDER BY minute;
```

```text
         minute         |  n  | min_dps | max_dps | mean_dps
------------------------+-----+---------+---------+----------
 2026-03-01 00:00:00+00 | 600 | -0.0500 |  0.0500 |   0.0058
 2026-03-01 00:01:00+00 | 600 | -0.0500 |  1.2473 |   0.0170
 2026-03-01 00:02:00+00 | 300 | -0.0500 |  0.0500 |  -0.0056
```

Look at the minute that holds the transient. Its **mean** is 0.0170 °/s — barely different from the quiet minute before it, and far below any alarm limit. The spike of 1.2 °/s lasted 10 samples out of 600, so it moved the mean by only about $1.2 \times 10 / 600 = 0.02$ °/s. A plot of means would show a gentle bump, if that. The **max** column, 1.2473, shouts it. [[The picture|mean-vs-max]] makes this plain.

That is the rule the whole lesson turns on. Averaging is a smoothing filter; its job is to make short things disappear. When the short things are what a reviewer is hunting for, you must keep the extremes alongside the average.

::: key Downsampling 10 Hz data to one-minute buckets: what to keep
Minimum, maximum, mean and the last value per bucket, not just the mean. Keeping the extremes is what stops a downsampled plot from hiding a transient excursion.
:::

Two more columns earn their place. **`n`**, the count, says how full the bucket is. The last bucket has 300 samples, not 600, because the data stops at 00:02:29.9. A half-empty bucket is not a problem, but a reader should be able to see it. And the **last** value, next.

## The last value in each bucket

The last value is the reading at the end of the bucket. It matters for two reasons. For a signal that holds its value between changes — a mode, a switch position, a counter — the last value is "the state the minute ended in", which the mean and extremes cannot tell you. And when you draw the buckets as a line, the last value of one bucket joins smoothly to the next, so the shape of the curve survives.

The trap is to reach for MAX. `MAX(rate_dps)` is the *largest* value, not the *latest* one. You need the value on the row with the largest `ts`. That is a question about order inside a group, and there are two good ways to ask it.

**With a window.** Number the rows of each bucket from the latest back, using ROW_NUMBER from lesson 02, and keep the value on row 1. It is lesson 06's "latest per key" pattern, with the bucket as the key:

```sql
WITH b AS (
    SELECT date_trunc('minute', ts) AS minute, ts, rate_dps,
           ROW_NUMBER() OVER (PARTITION BY sat_id, date_trunc('minute', ts)
                              ORDER BY ts DESC) AS rn_desc
    FROM gyro
)
SELECT minute,
       COUNT(*)                                      AS n,
       MIN(rate_dps)                                 AS min_dps,
       MAX(rate_dps)                                 AS max_dps,
       ROUND(AVG(rate_dps), 4)                       AS mean_dps,
       MAX(CASE WHEN rn_desc = 1 THEN rate_dps END)  AS last_dps
FROM b
GROUP BY minute
ORDER BY minute;
```

The trick in the last column: `CASE WHEN rn_desc = 1 THEN rate_dps END` is the value on the latest row and NULL on every other row. MAX of one number and 599 NULLs is that number, because aggregates skip NULLs. So the whole summary comes out of one GROUP BY.

**With an ordered aggregate.** PostgreSQL lets you put an ORDER BY *inside* an aggregate's brackets. `array_agg(rate_dps ORDER BY ts DESC)` collects the bucket's values into an **array** — a list in one cell — latest first, and `[1]` takes the first element:

```sql
SELECT date_trunc('minute', ts) AS minute,
       (array_agg(rate_dps ORDER BY ts DESC))[1] AS last_dps
FROM gyro
GROUP BY date_trunc('minute', ts)
ORDER BY minute;
```

It is shorter, but PostgreSQL-only, and it builds an array of 600 values per bucket only to keep one. The window form works in SQLite too.

::: example A one-minute summary with min, max, mean and last
**Question.** Downsample the gyro channel to one-minute buckets, keeping the count, minimum, maximum, mean and last value.

**Think first.** Three buckets: 00:00 and 00:01 with 600 samples each, 00:02 with 300. The maximum of the 00:01 bucket must be the spike, about 1.25. The last values must be the readings at 00:00:59.9, 00:01:59.9 and 00:02:29.9.

**Run the window query above:**

```text
         minute         |  n  | min_dps | max_dps | mean_dps | last_dps
------------------------+-----+---------+---------+----------+----------
 2026-03-01 00:00:00+00 | 600 | -0.0500 |  0.0500 |   0.0058 |   0.0335
 2026-03-01 00:01:00+00 | 600 | -0.0500 |  1.2473 |   0.0170 |  -0.0496
 2026-03-01 00:02:00+00 | 300 | -0.0500 |  0.0500 |  -0.0056 |  -0.0111
```

**Check the last values** against the raw rows:

```sql
SELECT ts, rate_dps FROM gyro
WHERE ts IN ('2026-03-01 00:00:59.9+00', '2026-03-01 00:01:59.9+00',
             '2026-03-01 00:02:29.9+00');
```

```text
            ts            | rate_dps
--------------------------+----------
 2026-03-01 00:00:59.9+00 |   0.0335
 2026-03-01 00:01:59.9+00 |  -0.0496
 2026-03-01 00:02:29.9+00 |  -0.0111
```

They match. The ordered-aggregate version gives the same three last values.

**Sanity check.** 1,500 rows became 3, a reduction of 500 to 1, and the transient is still in plain view in `max_dps`. Notice also that `last_dps` for 00:01 is −0.0496 — close to the *minimum*, not the maximum. MAX would have reported 1.2473 as the "last" value, pinning the spike to the end of the minute, where it never was.
:::

::: warning The latest value is not the largest value
`MAX(value)` per bucket answers "what was the highest reading?", not "what was the reading at the end?". The two agree only by luck. Get "last" from the row order — a ROW_NUMBER window or an ordered aggregate — never from the value order.
:::

## Buckets of any width: date_bin

`date_trunc` only knows whole units. For 15-second or 5-minute buckets you need something else. PostgreSQL 14 added `date_bin(stride, ts, origin)`. Read it as "put ts in a bin of this width, counting bins from this origin":

```sql
SELECT date_bin(interval '15 seconds', ts, timestamptz '2026-01-01 00:00:00+00') AS bin,
       COUNT(*)      AS n,
       MIN(rate_dps) AS min_dps,
       MAX(rate_dps) AS max_dps
FROM gyro
WHERE ts >= '2026-03-01 00:01:00+00' AND ts < '2026-03-01 00:02:00+00'
GROUP BY 1
ORDER BY 1;
```

```text
          bin           |  n  | min_dps | max_dps
------------------------+-----+---------+---------
 2026-03-01 00:01:00+00 | 150 | -0.0500 |  0.0325
 2026-03-01 00:01:15+00 | 150 | -0.0233 |  1.2473
 2026-03-01 00:01:30+00 | 150 | -0.0500 |  0.0444
 2026-03-01 00:01:45+00 | 150 | -0.0500 |  0.0500
```

(`GROUP BY 1` means "group by the first column in the SELECT list", a shorthand that saves repeating a long expression.) The minute with the spike is now four 15-second bins, and the spike is placed more precisely: somewhere between 00:01:15 and 00:01:30.

The **stride** is the bucket width. The **origin** is any instant that should be a bucket boundary. Bins are laid out every stride forwards and backwards from it, and each time falls into the bin that starts at or before it. The origin [[changes the boundaries|origin-picture]]:

```sql
SELECT date_bin(interval '5 minutes', t, timestamptz '2026-01-01 00:00:00+00') AS five_min,
       date_bin(interval '5 minutes', t, timestamptz '2026-01-01 00:02:00+00') AS shifted
FROM (SELECT timestamptz '2026-03-01 14:37:52.8+00' AS t) AS x;
```

```text
        five_min        |        shifted
------------------------+------------------------
 2026-03-01 14:35:00+00 | 2026-03-01 14:37:00+00
```

With a midnight origin, 5-minute bins start at :00, :05, :10, …, so 14:37:52.8 lands in the 14:35 bin. Shift the origin by two minutes and bins start at :02, :07, :12, …, so the same instant lands in the 14:37 bin. Pick a midnight origin unless you have a reason not to; everyone then agrees on the boundaries. `date_bin` does not accept strides of months or years, because months are not all the same length.

Before PostgreSQL 14, or in any database with a seconds-since-1970 function, the same bins come from arithmetic. Turn the time into seconds, divide by the width, round down, and multiply back:

```sql
SELECT to_timestamp(floor(EXTRACT(EPOCH FROM t) / 300) * 300) AS five_min
FROM (SELECT timestamptz '2026-03-01 14:37:52.8+00' AS t) AS x;
-- 2026-03-01 14:35:00+00
```

`EXTRACT(EPOCH FROM t)` is the number of seconds since 1970-01-01 00:00 UTC, the **[[Unix epoch|unix-epoch]]**. `floor` rounds down to a whole number of 300-second steps, and `to_timestamp` turns seconds back into a time. The implicit origin is the epoch itself, which is a midnight, so these bins agree with `date_bin` on a midnight origin.

::: key Buckets wider or narrower than one unit
`date_bin(interval '15 seconds', ts, origin)` (PostgreSQL 14 and later) makes buckets of any fixed width, aligned to `origin`. Without it, `floor(epoch_seconds / width) * width` does the same job, aligned to the Unix epoch.
:::

### time_bucket in TimescaleDB

**[[TimescaleDB|timescale-context]]** is an **extension** to PostgreSQL: an add-on package, installed separately on the database server, that adds new functions and storage features. It is popular for telemetry, but it is not part of PostgreSQL itself. The database used for this course's examples does not have it, and many servers you meet will not either. On a server where it is installed, it is switched on per database with `CREATE EXTENSION timescaledb;`, and then gives you:

```sql
-- only works where the TimescaleDB extension is installed
SELECT time_bucket(interval '1 minute', ts) AS minute,
       MIN(rate_dps), MAX(rate_dps), AVG(rate_dps)
FROM gyro
GROUP BY 1
ORDER BY 1;
```

`time_bucket(width, ts)` does what `date_bin` does, with a built-in default origin (midnight at the start of Monday, 3 January 2000), so for buckets that divide a day evenly it gives the same boundaries as `date_bin` with a midnight origin. It came first; `date_bin` is PostgreSQL's own version of the idea. The extension adds more around it, such as a gap-filling form of `time_bucket` and **continuous aggregates**, which keep a downsampled table up to date as new data arrives. The next module, on schema design and the telemetry lifecycle, is where those belong.

## The same buckets in SQLite

SQLite stores time as ISO-8601 text, has no `date_trunc`, and has no `date_bin`. Two tools do the job.

**Whole units by formatting.** `strftime` rewrites a time in any pattern, so write it with the smaller parts fixed at zero. `strftime('%Y-%m-%dT%H:%M:00Z', ts)` turns `'2026-03-01T00:01:23.400Z'` into `'2026-03-01T00:01:00Z'`: the minute's key. For hours, use `'%Y-%m-%dT%H:00:00Z'`; for days, `substr(ts, 1, 10)` as in the first SQL module.

**Any width by integer division.** `unixepoch(ts)` gives whole seconds since 1970 as an **integer**. When both sides are integers, SQLite's `/` is whole-number division and drops the remainder. So `(unixepoch(ts) / 15) * 15` rounds down to a multiple of 15 seconds. The `'unixepoch'` modifier turns the seconds back into a time.

::: example 15-second bins in SQLite
**Question.** In SQLite, with `ts` stored as text like `'2026-03-01T00:01:23.400Z'`, bin the minute 00:01 into 15-second buckets with count, minimum and maximum.

**Step 1: the bucket key.** Take one sample, 00:01:23.4. `unixepoch` gives 1772323283 (the fraction is dropped). Divide by 15: $1772323283 / 15 = 118154885.5$, and whole-number division keeps 118154885. Multiply back: $118154885 \times 15 = 1772323275$, which is 00:01:15. So 00:01:23.4 goes in the bin that starts at 00:01:15, as it should.

**Step 2: the query.**

```sql
SELECT strftime('%Y-%m-%dT%H:%M:%SZ', (unixepoch(ts) / 15) * 15, 'unixepoch') AS bin,
       COUNT(*)      AS n,
       MIN(rate_dps) AS min_dps,
       MAX(rate_dps) AS max_dps
FROM gyro
WHERE ts >= '2026-03-01T00:01:00.000Z' AND ts < '2026-03-01T00:02:00.000Z'
GROUP BY bin
ORDER BY bin;
-- ('2026-03-01T00:01:00Z', 150, -0.05, 0.0325)
-- ('2026-03-01T00:01:15Z', 150, -0.0233, 1.2473)
-- ('2026-03-01T00:01:30Z', 150, -0.05, 0.0444)
-- ('2026-03-01T00:01:45Z', 150, -0.05, 0.05)
```

**Sanity check.** The same four bins, counts and extremes as `date_bin` gave in PostgreSQL. Each bin holds $15 \times 10 = 150$ samples at 10 Hz, and $4 \times 150 = 600$, the whole minute.

**The "last" column** works exactly as in PostgreSQL: compute the bin key in a CTE, add `ROW_NUMBER() OVER (PARTITION BY sat_id, bin ORDER BY ts DESC)`, and take `MAX(CASE WHEN rn_desc = 1 THEN rate_dps END)`. For one-minute buckets that gives last values 0.0335, −0.0496 and −0.0111, the same as before.
:::

::: warning Text bounds must match the text format exactly
Look at the WHERE clause above: the bounds are written `'…00:01:00.000Z'`, with milliseconds, because the column is. Write them as `'…00:01:00Z'` instead and SQLite compares text letter by letter. At the position where the column has `.` the bound has `Z`, and `.` sorts before `Z`. So `'2026-03-01T00:01:00.000Z' >= '2026-03-01T00:01:00Z'` is *false*. The query then silently drops the first ten samples of 00:01 and picks up the first ten of 00:02 instead. The count is still 600, so nothing looks wrong. Either write bounds in the column's exact format, or compare numbers: `unixepoch(ts) >= unixepoch('2026-03-01T00:01:00Z')`.
:::

## Traps when bucketing

**Days depend on the time zone.** `date_trunc('day', ts)` on a TIMESTAMPTZ cuts at midnight *in the session's time zone*. The same instant, 03:00 UTC on 1 March, belongs to 28 February in Los Angeles:

```sql
SET TIME ZONE 'America/Los_Angeles';
SELECT date_trunc('day', t)        AS local_day,
       date_trunc('day', t, 'UTC') AS utc_day
FROM (SELECT timestamptz '2026-03-01 03:00:00+00' AS t) AS x;
```

```text
       local_day        |        utc_day
------------------------+------------------------
 2026-02-28 00:00:00-08 | 2026-02-28 16:00:00-08
```

Both columns are printed in Los Angeles time. The first is local midnight on 28 February. The second, from the three-argument form (PostgreSQL 12 and later), is midnight UTC on 1 March — shown as 16:00 the day before, Los Angeles time. Daily telemetry buckets should be UTC days, so set the session to UTC, as the first SQL module recommended, or pass `'UTC'` explicitly.

**Empty buckets vanish.** GROUP BY makes one row per bucket that *has* data. A minute with no samples is not a row with a count of zero; it is no row at all, and a chart will draw a straight line across the hole. The fix is the one from the last module's lesson on recursive CTEs: generate every bucket with `generate_series` (or a recursive CTE in SQLite) and LEFT JOIN the summary onto it.

**Averages of averages are wrong.** Once you have one-minute rows, it is tempting to make hourly rows from them. MIN of the minimums, MAX of the maximums and the last of the last values are all correct. But the mean of the minute means is not the mean of the samples when buckets hold different numbers of samples. For the gyro data the three minute means are 0.00584, 0.01702 and −0.00557, whose plain average is 0.00576. The true mean of all 1,500 samples is 0.00803. The half-full last minute got the same vote as the full ones.

::: warning Store the sum and the count, not only the mean
To combine buckets later, keep `SUM(value)` and `COUNT(*)` per bucket. The combined mean is $\frac{\sum s_i}{\sum n_i}$ — read "the sum of the bucket sums over the sum of the bucket counts". For the gyro data that is $(3.5027 + 10.2132 - 1.6710) / (600 + 600 + 300) = 12.0449 / 1500 = 0.00803$, the right answer.
:::

## Check yourself

::: check
What bucket label does `date_trunc('hour', ts)` give for 23:59:59.9 on 31 March, and what does `date_bin(interval '10 minutes', ts, timestamptz '2026-01-01 00:00:00+00')` give for 08:47:30? Explain each.
:::

::: answer
`date_trunc('hour', …)` of 23:59:59.9 on 31 March is **23:00:00 on 31 March**. Truncation rounds down, so it stays in the same hour even though the next hour is only a tenth of a second away.

With 10-minute bins from a midnight origin, the boundaries are :00, :10, :20, :30, :40, :50. 08:47:30 is at or after 08:40 and before 08:50, so the label is **08:40:00**.
:::

::: check
A power engineer downsamples bus current to one-minute means and sees nothing unusual. The raw data shows a 200 ms spike to three times normal current once an hour. How much does one spike move its minute's mean, if normal current is $I$? What single extra column would have exposed it?
:::

::: answer
A 200 ms spike is $0.2 / 60 = 1/300$ of a minute. During it the current is $3I$ instead of $I$, an extra $2I$. So the minute's mean rises by $2I \times \frac{1}{300} \approx 0.0067\,I$, about two-thirds of one percent — invisible on a plot.

`MAX(current)` per minute would show $3I$ in that minute, a 200 percent jump, impossible to miss.
:::

::: check
Write, in words, how to get the last value per 5-minute bucket in SQLite, where there is no `array_agg` and no `date_bin`. Why can't you use `MAX(value)`?
:::

::: answer
In a CTE, compute the bucket key as `(unixepoch(ts) / 300) * 300` (whole-number division rounds down to a multiple of 300 s). In the same CTE, add `ROW_NUMBER() OVER (PARTITION BY sat_id, bucket ORDER BY ts DESC)`, which gives 1 to the latest row in each bucket. In the outer query, GROUP BY the bucket and take `MAX(CASE WHEN rn_desc = 1 THEN value END)`, which picks the value on that row, since every other row gives NULL.

`MAX(value)` returns the largest value in the bucket, which is the latest only by coincidence.
:::

::: check
Minute buckets of a temperature channel hold these (count, mean) pairs: (60, 20.0), (60, 22.0), (15, 30.0). What is the mean of the three means, and what is the true mean of all the samples? Which minute is causing the difference?
:::

::: answer
Mean of means: $(20.0 + 22.0 + 30.0) / 3 = 72.0 / 3 = 24.0$.

True mean: rebuild the sums first. $60 \times 20.0 = 1200$, $60 \times 22.0 = 1320$, $15 \times 30.0 = 450$. Total $1200 + 1320 + 450 = 2970$ over $60 + 60 + 15 = 135$ samples, so $2970 / 135 = 22.0$.

The third minute has only 15 samples but got a full one-third vote in the mean of means, dragging it up by 2.0 degrees. Keeping sum and count per bucket avoids this.
:::

::: check
A colleague says, "Our database has `time_bucket`, so it must be PostgreSQL 14 or later." Is that reasoning right?
:::

::: answer
No. `time_bucket` comes from the TimescaleDB extension, not from PostgreSQL, so its presence says the extension is installed, not which PostgreSQL version is underneath; TimescaleDB has run on PostgreSQL versions older than 14. The function that arrived with PostgreSQL 14 is `date_bin`. Check the version directly with `SELECT version();`.
:::

## Summary

| Tool | What it does | Example |
| --- | --- | --- |
| `date_trunc(unit, ts)` | Rounds down to a whole unit | `date_trunc('minute', ts)` |
| `date_trunc(unit, ts, zone)` | Same, in a named time zone (PostgreSQL 12+) | `date_trunc('day', ts, 'UTC')` |
| `date_bin(stride, ts, origin)` | Buckets of any fixed width (PostgreSQL 14+) | `date_bin(interval '15 seconds', ts, '2026-01-01')` |
| Epoch arithmetic | Any width, aligned to 1970 | `to_timestamp(floor(EXTRACT(EPOCH FROM ts) / 300) * 300)` |
| `time_bucket(width, ts)` | TimescaleDB extension, only where installed | `time_bucket(interval '1 minute', ts)` |
| SQLite, whole units | Format with zeros | `strftime('%Y-%m-%dT%H:%M:00Z', ts)` |
| SQLite, any width | Integer division of seconds | `strftime('%Y-%m-%dT%H:%M:%SZ', (unixepoch(ts) / 15) * 15, 'unixepoch')` |
| What to keep | Min, max, mean, last, and the count | Keep extremes so transients survive |
| Last per bucket | Value on the latest row | `MAX(CASE WHEN rn_desc = 1 THEN v END)` or `(array_agg(v ORDER BY ts DESC))[1]` |
| Re-aggregating | Combine sums and counts | $\bar{x} = \sum s_i / \sum n_i$ |

Buckets are a fixed grid laid over time. The last lesson of the module steps back and asks, of every pattern so far, when a window function is the right tool and when a join — including a join between two different tables' timestamps — does the job better.

::: context gyro-word What a gyro measures
A **gyro**, short for gyroscope, measures how fast the spacecraft is rotating about an axis, in degrees per second. Modern spacecraft gyros have no spinning wheel inside; many use light traveling both ways around a coil of optical fiber, or a tiny vibrating structure. A satellite holding still in attitude reads close to zero, so a sudden reading of 1.2 °/s is large: at that rate it would turn a full circle in five minutes.
:::

::: context pixel-budget Four numbers per pixel column
A line chart on a screen can only draw one column of pixels at each horizontal position. However many samples fall into that column, what you see is a vertical stroke from the lowest to the highest, entered from the left at the first value and left to the right at the last. A 2014 database paper called M4 made this precise: keep the first, last, minimum and maximum per pixel column and the chart comes out the same as if you had drawn every sample. That is why min, max and last (plus first) are the natural summary for plotting.
:::

::: context transient-causes What leaves a spike in a rate channel
A one-second jump in body rate can come from a thruster that fired when it should not, a stuck valve releasing gas, a deployable part such as an antenna snapping into place, or — rarely — a hit from a tiny particle of space debris or a micrometeoroid. It can also be a sensor glitch with no real motion behind it. Telling these apart needs the full-rate data, which is why a downsampled summary must at least show *that* something happened and when.
:::

::: context half-open-buckets Buckets that tile time
Each minute bucket includes its start and excludes its end, so the buckets fit together like floor tiles with no overlaps and no cracks. A sample at exactly 00:01:00.0 belongs to the 00:01 bucket, never to 00:00. The first SQL module used the same idea for time windows in WHERE clauses: `ts >= start AND ts < end`.
:::

::: context mean-vs-max The spike in the mean and in the max
The gray trace is the raw 10 Hz signal: a small wobble with one 1-second spike. The bars show each minute's mean (blue) and max (red), drawn to the same scale as the trace, 80 pixels per degree per second.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1"/>
  <line x1="40" y1="14" x2="40" y2="130" stroke="#1f2a44" stroke-width="1"/>
  <line x1="160" y1="14" x2="160" y2="130" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <line x1="280" y1="14" x2="280" y2="130" stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3"/>
  <rect x="80" y="118.5" width="16" height="1.5" fill="#1d6fd1"/><rect x="104" y="116.0" width="16" height="4.0" fill="#b4232c"/><rect x="222" y="118.5" width="16" height="1.5" fill="#1d6fd1"/><rect x="246" y="20.2" width="16" height="99.8" fill="#b4232c"/><rect x="290" y="120.0" width="16" height="1.5" fill="#1d6fd1"/><rect x="314" y="116.0" width="16" height="4.0" fill="#b4232c"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1" points="40.0,120.0 41.0,119.5 42.0,119.0 43.0,118.5 44.0,118.1 45.0,117.7 46.0,117.3 47.0,116.9 48.0,116.6 49.0,116.4 50.0,116.2 51.0,116.1 52.0,116.0 53.0,116.0 54.0,116.1 55.0,116.2 56.0,116.4 57.0,116.6 58.0,116.9 59.0,117.2 60.0,117.6 61.0,118.0 62.0,118.5 63.0,118.9 64.0,119.4 65.0,119.9 66.0,120.4 67.0,120.9 68.0,121.4 69.0,121.9 70.0,122.3 71.0,122.7 72.0,123.0 73.0,123.3 74.0,123.6 75.0,123.8 76.0,123.9 77.0,124.0 78.0,124.0 79.0,123.9 80.0,123.8 81.0,123.7 82.0,123.4 83.0,123.2 84.0,122.8 85.0,122.4 86.0,122.0 87.0,121.6 88.0,121.1 89.0,120.6 90.0,120.1 91.0,119.6 92.0,119.1 93.0,118.7 94.0,118.2 95.0,117.8 96.0,117.4 97.0,117.0 98.0,116.7 99.0,116.5 100.0,116.2 101.0,116.1 102.0,116.0 103.0,116.0 104.0,116.0 105.0,116.1 106.0,116.3 107.0,116.5 108.0,116.8 109.0,117.1 110.0,117.5 111.0,117.9 112.0,118.4 113.0,118.8 114.0,119.3 115.0,119.8 116.0,120.3 117.0,120.8 118.0,121.3 119.0,121.7 120.0,122.2 121.0,122.6 122.0,122.9 123.0,123.3 124.0,123.5 125.0,123.7 126.0,123.9 127.0,124.0 128.0,124.0 129.0,124.0 130.0,123.9 131.0,123.7 132.0,123.5 133.0,123.2 134.0,122.9 135.0,122.6 136.0,122.1 137.0,121.7 138.0,121.2 139.0,120.8 140.0,120.3 141.0,119.8 142.0,119.3 143.0,118.8 144.0,118.3 145.0,117.9 146.0,117.5 147.0,117.1 148.0,116.8 149.0,116.5 150.0,116.3 151.0,116.1 152.0,116.0 153.0,116.0 154.0,116.0 155.0,116.1 156.0,116.3 157.0,116.5 158.0,116.7 159.0,117.0 160.0,117.4 161.0,117.8 162.0,118.2 163.0,118.7 164.0,119.2 165.0,119.7 166.0,120.2 167.0,120.7 168.0,121.2 169.0,121.6 170.0,122.1 171.0,122.5 172.0,122.8 173.0,123.2 174.0,123.5 175.0,123.7 176.0,123.8 177.0,124.0 178.0,124.0 179.0,124.0 180.0,123.9 181.0,123.8 182.0,123.6 183.0,123.3 184.0,123.0 185.0,122.7 186.0,122.3 187.0,121.8 188.0,121.4 189.0,120.9 190.0,120.4 191.0,119.9 192.0,119.4 193.0,118.9 194.0,118.4 195.0,118.0 196.0,117.6 197.0,117.2 198.0,116.9 199.0,116.6 200.0,116.3 201.0,116.2 202.0,116.1 203.0,116.0 204.0,116.0 205.0,116.1 205.8,116.2 206.0,20.2 206.2,20.2 206.4,20.3 206.6,20.3 206.8,20.4 207.0,20.4 207.2,20.5 207.4,20.5 207.6,20.5 207.8,20.6 208.0,116.7 209.0,117.0 210.0,117.3 211.0,117.7 212.0,118.1 213.0,118.6 214.0,119.0 215.0,119.5 216.0,120.0 217.0,120.5 218.0,121.0 219.0,121.5 220.0,121.9 221.0,122.4 222.0,122.8 223.0,123.1 224.0,123.4 225.0,123.6 226.0,123.8 227.0,123.9 228.0,124.0 229.0,124.0 230.0,123.9 231.0,123.8 232.0,123.6 233.0,123.4 234.0,123.1 235.0,122.7 236.0,122.4 237.0,121.9 238.0,121.5 239.0,121.0 240.0,120.5 241.0,120.0 242.0,119.5 243.0,119.0 244.0,118.6 245.0,118.1 246.0,117.7 247.0,117.3 248.0,116.9 249.0,116.7 250.0,116.4 251.0,116.2 252.0,116.1 253.0,116.0 254.0,116.0 255.0,116.1 256.0,116.2 257.0,116.4 258.0,116.6 259.0,116.9 260.0,117.2 261.0,117.6 262.0,118.0 263.0,118.4 264.0,118.9 265.0,119.4 266.0,119.9 267.0,120.4 268.0,120.9 269.0,121.4 270.0,121.8 271.0,122.3 272.0,122.7 273.0,123.0 274.0,123.3 275.0,123.6 276.0,123.8 277.0,123.9 278.0,124.0 279.0,124.0 280.0,124.0 281.0,123.8 282.0,123.7 283.0,123.5 284.0,123.2 285.0,122.8 286.0,122.5 287.0,122.1 288.0,121.6 289.0,121.1 290.0,120.7 291.0,120.2 292.0,119.7 293.0,119.2 294.0,118.7 295.0,118.2 296.0,117.8 297.0,117.4 298.0,117.0 299.0,116.7 300.0,116.5 301.0,116.3 302.0,116.1 303.0,116.0 304.0,116.0 305.0,116.0 306.0,116.1 307.0,116.3 308.0,116.5 309.0,116.8 310.0,117.1 311.0,117.5 312.0,117.9 313.0,118.3 314.0,118.8 315.0,119.3 316.0,119.8 317.0,120.3 318.0,120.8 319.0,121.2 320.0,121.7 321.0,122.2 322.0,122.6 323.0,122.9 324.0,123.2 325.0,123.5 326.0,123.7 327.0,123.9 328.0,124.0 329.0,124.0 330.0,124.0 331.0,123.9 332.0,123.7 333.0,123.5 334.0,123.3 335.0,122.9 336.0,122.6 337.0,122.2 338.0,121.7 339.0,121.3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="100" y="154">00:00</text><text x="220" y="154">00:01</text><text x="310" y="154">00:02</text>
  </g>
  <text x="268" y="30" font-size="11" fill="#b4232c">max 1.25</text>
  <text x="230" y="138" font-size="11" fill="#1d6fd1" text-anchor="middle">mean 0.017</text>
  <text x="34" y="28" font-size="11" fill="#1f2a44" text-anchor="end">1.2</text>
  <text x="34" y="124" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="190" y="174" font-size="11" fill="#1f2a44" text-anchor="middle">body rate, degrees per second, 00:00 to 00:02:30</text>
</svg>
```

The mean bars are one or two pixels tall — the one under the spike is hardly taller than its neighbors. Only the max bar tells you something happened.
:::

::: context origin-picture Same stride, different origin
Both rows cut time into 5-minute bins. The top row counts from midnight, so bins start at :30, :35, :40. The bottom row counts from 00:02, so bins start at :32, :37, :42. The red mark, 14:37:52.8, falls in a different bin in each row.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1" fill="#ffffff">
    <rect x="20" y="30" width="100" height="26"/><rect x="120" y="30" width="100" height="26" fill="#8fb8f0"/><rect x="220" y="30" width="100" height="26"/>
    <rect x="60" y="80" width="100" height="26"/><rect x="160" y="80" width="100" height="26" fill="#8fb8f0"/><rect x="260" y="80" width="80" height="26"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="24">14:30</text><text x="120" y="24">14:35</text><text x="220" y="24">14:40</text><text x="320" y="24">14:45</text>
    <text x="60" y="122">14:32</text><text x="160" y="122">14:37</text><text x="260" y="122">14:42</text>
  </g>
  <line x1="177.6" y1="26" x2="177.6" y2="110" stroke="#b4232c" stroke-width="2"/>
  <text x="186" y="72" font-size="11" fill="#b4232c">14:37:52.8</text>
</svg>
```

Each row is drawn at 20 pixels per minute. The shaded bin is the one the red instant falls in: 14:35 in the top row, 14:37 in the bottom.
:::

::: context unix-epoch Counting seconds from 1970
Unix systems count time as seconds since 00:00:00 UTC on 1 January 1970, a date chosen by the Unix designers as a convenient round starting point. Stored as a signed 32-bit integer, that count runs out at 03:14:07 UTC on 19 January 2038 — the "year 2038 problem" — which is why modern systems use 64-bit counts. Leap seconds are not counted, so every Unix day is exactly 86,400 seconds, which is what makes bucket arithmetic like `floor(seconds / 300) * 300` line up with clock minutes.
:::

::: context timescale-context What TimescaleDB is
TimescaleDB is an open-source extension, first released in 2017, that turns ordinary PostgreSQL tables into **hypertables**: tables split behind the scenes into many time-ordered chunks, so that recent data stays fast to insert and old data can be compressed or dropped a chunk at a time. Because it lives inside PostgreSQL, all the SQL in this module still works on it. Whether you have it depends on who runs your database server; managed PostgreSQL services offer it on some plans and not on others.
:::
