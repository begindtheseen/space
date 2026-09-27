---
id: l12-upserts-and-data-quality
title: Upserts, duplicates and data quality
minutes: 26
covers:
  - Upserts and idempotent ingest for duplicated downlink frames
  - "Data quality: gap detection, out-of-order packets, vehicle-to-ground clock skew, duplicate frames"
---

Think about a class trip sign-up sheet. A friend texts you "I'm in!" Your phone glitches and the same text arrives twice. If you write a new line on the sheet for every text, your friend is now two people, and the bus is one seat short. The right rule is: look for their name first. If it is there, leave it (or fix it). If it is not, add it. Getting the same message twice should leave the sheet exactly as getting it once.

Telemetry has the same problem every day. A satellite's data reaches the ground in **frames** — fixed-size blocks of bits sent over the radio link — and the same frame can arrive twice, or ten times. Other frames never arrive, some arrive in the wrong order, and every timestamp was written by an onboard clock that does not quite agree with the ground's.

The first half of this lesson is the write side: the **upsert**, an insert that updates instead when the row already exists, and the key that makes loading data safe to repeat. The second half is the read side: four data-quality problems and a runnable SQL check for each.

## Why the same frame arrives twice

Duplicates are not a rare fault. They are how the system is built:

- **Retransmission.** The ground asks for a frame again; if the first copy did arrive after all, you have two.
- **Overlapping ground stations.** Two antennas can both hear the same pass and forward everything. The **[[overlap|station-overlap]]** is on purpose, as a backup.
- **Onboard playback.** A satellite replays data recorded out of contact; an interrupted replay is repeated next pass.
- **Reprocessing.** After an outage, someone reloads yesterday's files, some already loaded.

So the question is never "how do we stop duplicates arriving?" It is "how do we make arrival harmless?"

## Idempotent ingest: twice is the same as once

An operation is **[[idempotent|idempotent-word]]** if doing it twice leaves things exactly as doing it once. Pressing an elevator's call button is idempotent: pressing it five times does not bring five elevators. Adding a row to a list is not.

You make ingest idempotent in two steps.

1. **Name the natural key** — the columns that say "this is the same measurement". For a sample that is satellite, instant and channel: `(sat_id, ts, channel)`, a natural key in lesson 2's sense.
2. **Enforce it and upsert against it.** Put a `PRIMARY KEY` or `UNIQUE` constraint on those columns, then write with an insert that knows what to do when the key already exists.

Here is the table, the same shape as the module's first exercise.

```sql
CREATE TABLE sample (
  sat_id   text        NOT NULL,
  ts       timestamptz NOT NULL,
  channel  text        NOT NULL,
  value    double precision NOT NULL,
  quality  smallint    NOT NULL DEFAULT 0 CHECK (quality BETWEEN 0 AND 3),
  PRIMARY KEY (sat_id, ts, channel)
);
```

`quality` is a small flag the ground software sets: 0 means clean, and higher numbers mean less trustworthy (1 repaired by error correction, 2 suspect, 3 invalid). The `CHECK` from lesson 3 keeps it in that range.

Every example here runs with `SET timezone = 'UTC'`, so the times typed in are UTC. Load two samples, then send one again with a plain `INSERT`:

```sql
INSERT INTO sample VALUES
  ('SAT-0417', '2026-03-01 04:12:00', 'BATT_V', 28.1, 0),
  ('SAT-0417', '2026-03-01 04:12:01', 'BATT_V', 28.0, 0);
-- INSERT 0 2

INSERT INTO sample VALUES
  ('SAT-0417', '2026-03-01 04:12:01', 'BATT_V', 28.0, 0);
```

```text
ERROR:  duplicate key value violates unique constraint "sample_pkey"
DETAIL:  Key (sat_id, ts, channel)=(SAT-0417, 2026-03-01 04:12:01+00, BATT_V) already exists.
```

The constraint did its job. But an error is the wrong answer for a routine event: in a batch of ten thousand samples, one repeat would fail the whole batch.

::: key What makes telemetry ingest idempotent?
A natural key of satellite, timestamp and channel with a unique constraint plus an upsert. A duplicated downlink frame then updates rather than duplicating, which matters because replays and retransmissions are routine.
:::

::: warning Do not push deduplication onto the readers
A table without the key, "cleaned up" by `SELECT DISTINCT` in every query, will one day be read by someone who forgot the `DISTINCT`, and their averages will lean toward whichever minutes were downlinked twice. Idempotency belongs on the write path, once.
:::

## INSERT … ON CONFLICT DO NOTHING

PostgreSQL's upsert is an `INSERT` with an extra clause, `ON CONFLICT`. Read it aloud as "insert these rows; on a conflict over this key, do that instead".

```sql
INSERT INTO sample VALUES
  ('SAT-0417', '2026-03-01 04:12:01', 'BATT_V', 28.0, 0),
  ('SAT-0417', '2026-03-01 04:12:02', 'BATT_V', 27.9, 0)
ON CONFLICT (sat_id, ts, channel) DO NOTHING;
```

```text
INSERT 0 1
```

The first row's key existed, so it was skipped; the second was new and went in. In `INSERT 0 1`, the `0` is a leftover field that is always zero, and the `1` is the number of rows written.

The part in brackets is the **conflict target**: the columns of a unique constraint or index, naming which clash you are prepared to handle. Any *other* failure — a `CHECK`, say — still raises an error. `DO NOTHING` suits repeats that are exact copies: the first wins.

## DO UPDATE and the EXCLUDED row

Sometimes the second copy is *better*: the first came through a noisy link, flagged `quality = 2`, and the retransmission is clean. Then you want `DO UPDATE`. Inside it you talk about two rows: the one already in the table, and the one you tried to insert. PostgreSQL names the second one **`EXCLUDED`** — read `EXCLUDED.value` aloud as "the excluded row's value" — because it is the row that was shut out by the conflict. The row already in the table goes by the table's name, or by an alias you give it with `AS`.

::: example Let a clean retransmission replace a corrupted copy
The first copy of the 04:12:03 sample arrived with a bit error: value 31.9 V, quality 2.

```sql
INSERT INTO sample VALUES ('SAT-0417', '2026-03-01 04:12:03', 'BATT_V', 31.9, 2);
```

The retransmission arrives clean: 27.9 V, quality 0. The rule is "replace the stored row only if the new copy is more trustworthy":

```sql
INSERT INTO sample AS s (sat_id, ts, channel, value, quality)
VALUES ('SAT-0417', '2026-03-01 04:12:03', 'BATT_V', 27.9, 0)
ON CONFLICT (sat_id, ts, channel) DO UPDATE
  SET value   = EXCLUDED.value,
      quality = EXCLUDED.quality
  WHERE EXCLUDED.quality < s.quality;
-- INSERT 0 1
```

The key clashes, so PostgreSQL checks the `WHERE`: is the new quality, 0, less than the stored 2? Yes, so the stored row takes the new value and quality.

Now a third, worse copy arrives — 12.0 V with quality 3, from a station having a bad day:

```sql
INSERT INTO sample AS s (sat_id, ts, channel, value, quality)
VALUES ('SAT-0417', '2026-03-01 04:12:03', 'BATT_V', 12.0, 3)
ON CONFLICT (sat_id, ts, channel) DO UPDATE
  SET value   = EXCLUDED.value,
      quality = EXCLUDED.quality
  WHERE EXCLUDED.quality < s.quality;
-- INSERT 0 0
```

Is 3 less than 0? No, so nothing is written: `INSERT 0 0`. The table holds:

```text
  sat_id  |           ts           | channel | value | quality
----------+------------------------+---------+-------+---------
 SAT-0417 | 2026-03-01 04:12:03+00 | BATT_V  |  27.9 |       0
```

**Check:** copies arrived bad, good, worse, and the table kept the good one. It would in any arrival order, because the rule is a comparison — a running best — not "last one wins".
:::

::: key INSERT … ON CONFLICT
`ON CONFLICT (key columns) DO NOTHING` skips a row whose key already exists. `ON CONFLICT (key columns) DO UPDATE SET col = EXCLUDED.col` replaces it, where `EXCLUDED` is the row you tried to insert. A `WHERE` on the `DO UPDATE` makes the replacement conditional; when it is false, the row is left alone.
:::

Another useful `WHERE`: `(s.value, s.quality) IS DISTINCT FROM (EXCLUDED.value, EXCLUDED.quality)` skips updates that would write the same values back. In PostgreSQL even a no-change update writes a new row version and index entries — lesson 7's write cost.

::: warning The same key twice in one statement
If one `INSERT` carries the same key twice, `DO UPDATE` refuses:

```text
ERROR:  ON CONFLICT DO UPDATE command cannot affect row a second time
HINT:  Ensure that no rows proposed for insertion within the same command have duplicate constrained values.
```

PostgreSQL will not guess which copy should win. (`DO NOTHING` keeps the first quietly.) Downlink files often contain their own repeats, so deduplicate the batch *before* the upsert, with `DISTINCT ON` or `ROW_NUMBER()` as in the windows module.
:::

## Replaying a downlink file twice

A file first lands in a **[[staging table|staging-table]]** — a plain table with no key. Then one statement deduplicates and upserts into the real table. The file `pass_0412.csv` has eight lines; the last two repeat 04:20:01 because playback overlapped.

```text
sat_id,ts,channel,value,quality
SAT-0417,2026-03-01T04:20:00Z,BATT_V,28.2,0
SAT-0417,2026-03-01T04:20:00Z,BUS_T,21.5,0
SAT-0417,2026-03-01T04:20:01Z,BATT_V,28.2,0
SAT-0417,2026-03-01T04:20:01Z,BUS_T,21.5,0
SAT-0417,2026-03-01T04:20:02Z,BATT_V,28.1,0
SAT-0417,2026-03-01T04:20:02Z,BUS_T,21.6,0
SAT-0417,2026-03-01T04:20:01Z,BATT_V,28.2,0
SAT-0417,2026-03-01T04:20:01Z,BUS_T,21.5,0
```

::: example Load the same file twice and prove nothing changed
The target `tm_sample` has the same columns and key as `sample`, and `tm_staging` was made with `CREATE TABLE tm_staging (LIKE tm_sample)` — same columns, no key. The load script:

```sql
SET timezone = 'UTC';
TRUNCATE tm_staging;
\copy tm_staging FROM 'pass_0412.csv' WITH (FORMAT csv, HEADER true)

INSERT INTO tm_sample AS t
SELECT DISTINCT ON (sat_id, ts, channel) *
FROM tm_staging
ORDER BY sat_id, ts, channel, quality
ON CONFLICT (sat_id, ts, channel) DO UPDATE
  SET value = EXCLUDED.value, quality = EXCLUDED.quality
  WHERE (t.value, t.quality) IS DISTINCT FROM (EXCLUDED.value, EXCLUDED.quality);

SELECT count(*) AS n_rows,
       md5(string_agg(concat_ws('|', sat_id, ts, channel, value, quality), ','
                      ORDER BY sat_id, ts, channel)) AS fingerprint
FROM tm_sample;
```

Line by line: empty staging; copy the file in (`\copy` is psql's command for reading a file on *your* machine); keep one row per key, best quality first; upsert; then print a **fingerprint** — every row glued into one string in a fixed order and run through `md5`, which turns any text into a 32-character code that changes if any character changes.

First run:

```text
COPY 8
INSERT 0 6
 n_rows |           fingerprint
--------+----------------------------------
      6 | ece801325e7534f678d1669ccdc87f60
```

Eight lines in the file, six distinct keys, six rows written. Second run, same file:

```text
COPY 8
INSERT 0 0
 n_rows |           fingerprint
--------+----------------------------------
      6 | ece801325e7534f678d1669ccdc87f60
```

**Check:** the file was read again (`COPY 8`), nothing was written (`INSERT 0 0`), and the fingerprint matches to the last character: idempotent. Without `DISTINCT ON` the first run fails ("cannot affect row a second time"); without `ON CONFLICT` the second run fails (duplicate key).
:::

::: warning Idempotent columns, not idempotent bookkeeping
Add `ingested_at = now()` to the `SET` list and every replay changes that column and the fingerprint. That can be useful, but say clearly which columns are the measurement (idempotent) and which are bookkeeping (not).
:::

## MERGE: the standard's version

The SQL standard's own upsert is **[[MERGE|merge-history]]**, in PostgreSQL since version 15. It matches incoming rows to the target on a condition, then says what to do when they match and when they do not.

```sql
MERGE INTO tm_sample AS t
USING tm_staging AS s
   ON t.sat_id = s.sat_id AND t.ts = s.ts AND t.channel = s.channel
WHEN MATCHED AND s.quality < t.quality THEN
  UPDATE SET value = s.value, quality = s.quality
WHEN NOT MATCHED THEN
  INSERT (sat_id, ts, channel, value, quality)
  VALUES (s.sat_id, s.ts, s.channel, s.value, s.quality);
```

With one existing row (same quality) and two new rows in staging, PostgreSQL 16 reports `MERGE 2`. `MERGE` can also `DELETE` and needs no unique constraint. But under concurrency `ON CONFLICT` is safer: it works through the unique index, whereas two `MERGE`s can both decide "not matched" and one then fails with a duplicate-key error. Keep `ON CONFLICT` for ingest; use `MERGE` for batch reconciliation.

## Upserts in SQLite

SQLite, the engine the exercises run on, has used PostgreSQL's syntax since version 3.24:

```sql
INSERT INTO sample (sat_id, ts, channel, value, quality)
VALUES ('SAT-0417', '2026-03-01T04:12:03Z', 'BATT_V', 27.9, 0)
ON CONFLICT (sat_id, ts, channel) DO UPDATE
  SET value = excluded.value, quality = excluded.quality
  WHERE excluded.quality < sample.quality;
```

Three differences are worth knowing.

- Timestamps are ISO-8601 text. The key works as long as every writer formats time alike — `04:12:03Z` and `04:12:03+00:00` are different strings.
- After `INSERT … SELECT`, the parser cannot tell the upsert's `ON` from a join's. `INSERT INTO sample SELECT * FROM staging ON CONFLICT … DO NOTHING` fails with `near "DO": syntax error`; add `WHERE true` to the `SELECT`.
- `INSERT OR REPLACE` is a trap: it *deletes* the old row and inserts the new one, so unsupplied columns reset. A row tagged `anomaly_tag = 'AR-112'`, replaced without the tag, comes back NULL. `DO UPDATE` touches only the columns you name.

SQLite has no `DISTINCT ON`; deduplicate a batch with `ROW_NUMBER() OVER (PARTITION BY sat_id, ts, channel ORDER BY quality)` and keep number 1.

## Frame counters as keys, and wraparound

Raw packets are often keyed by a counter. Under the CCSDS standards (next lesson), each packet stream is named by an **APID** (application process identifier, an 11-bit number saying what the packet carries) and numbered by a 14-bit **packet sequence count**, up by one per packet. It runs from 0 to $2^{14} - 1 = 16383$ and then **wraps around** to 0, like an odometer rolling over: every $16384\,\mathrm{s}$ (about $4.55$ hours) at one packet per second. So `(sat_id, apid, seq)` is *not* unique over a day; add the vehicle timestamp, or a wrap counter your ingest increments.

## Four data-quality problems

Now to what the data itself can get wrong.

::: key Name four telemetry data-quality problems SQL has to cope with
Gaps from lost downlink, out-of-order packets, duplicate frames from retransmission, and clock skew between vehicle and ground. Each needs an explicit rule, and each is visible as a specific query.
:::

The examples use a small landing table that keeps every copy of every packet, exactly as received:

```sql
CREATE TABLE rx_packet (
  sat_id     text        NOT NULL,
  apid       int         NOT NULL,
  seq        int         NOT NULL CHECK (seq BETWEEN 0 AND 16383),
  vehicle_ts timestamptz NOT NULL,   -- time stamped by the onboard clock
  rx_ts      timestamptz NOT NULL,   -- time the ground station received it
  station    text        NOT NULL,
  batt_v     numeric(4,2) NOT NULL
);
INSERT INTO rx_packet VALUES
  ('SAT-0417', 100, 16381, '2026-03-01 05:00:00', '2026-03-01 05:00:00.42', 'GS-A', 28.10),
  ('SAT-0417', 100, 16382, '2026-03-01 05:00:01', '2026-03-01 05:00:01.42', 'GS-A', 28.10),
  ('SAT-0417', 100, 16383, '2026-03-01 05:00:02', '2026-03-01 05:00:02.42', 'GS-A', 28.09),
  ('SAT-0417', 100,     0, '2026-03-01 05:00:03', '2026-03-01 05:00:03.42', 'GS-A', 28.09),
  ('SAT-0417', 100,     1, '2026-03-01 05:00:04', '2026-03-01 05:00:04.42', 'GS-A', 28.08),
  ('SAT-0417', 100,     4, '2026-03-01 05:00:07', '2026-03-01 05:00:07.42', 'GS-A', 28.07),
  ('SAT-0417', 100,     6, '2026-03-01 05:00:09', '2026-03-01 05:00:09.42', 'GS-A', 28.06),
  ('SAT-0417', 100,     5, '2026-03-01 05:00:08', '2026-03-01 05:00:09.93', 'GS-A', 28.06),
  ('SAT-0417', 100,     7, '2026-03-01 05:00:10', '2026-03-01 05:00:10.42', 'GS-A', 28.05),
  ('SAT-0417', 100,     7, '2026-03-01 05:00:10', '2026-03-01 05:00:10.45', 'GS-B', 28.05),
  ('SAT-0417', 100,     8, '2026-03-01 05:00:11', '2026-03-01 05:00:11.42', 'GS-A', 28.05);
```

The stream runs at 1 Hz (one packet per second). Look first: a wraparound, a jump from 1 to 4, a 5 arriving after the 6, and a 7 arriving twice.

### Duplicate frames

Group by the key, keep groups with more than one row, and count distinct values too:

```sql
SELECT sat_id, apid, seq, vehicle_ts,
       count(*)               AS copies,
       count(DISTINCT batt_v) AS distinct_values,
       string_agg(station, ',' ORDER BY rx_ts) AS stations
FROM rx_packet
GROUP BY sat_id, apid, seq, vehicle_ts
HAVING count(*) > 1;
```

```text
  sat_id  | apid | seq |       vehicle_ts       | copies | distinct_values | stations
----------+------+-----+------------------------+--------+-----------------+-----------
 SAT-0417 |  100 |   7 | 2026-03-01 05:00:10+00 |      2 |               1 | GS-A,GS-B
```

Both stations heard packet 7 and the copies agree: a **benign duplicate**, which the upsert absorbs. Two distinct values would be a **conflicting duplicate** — an uncaught bit error or a decoder bug — and deserves a human look, not a silent "last one wins".

### Gaps, by counter and by clock

In vehicle-time order, without duplicates, compare each count with the one before using `LAG`. The step should be 1. Because the counter wraps, take the step **modulo** 16384 — the remainder after dividing by 16384 — adding 16384 first, since PostgreSQL's `%` keeps a negative sign.

::: example Find the lost packets
```sql
WITH dedup AS (
  SELECT DISTINCT ON (sat_id, apid, seq, vehicle_ts) *
  FROM rx_packet
  ORDER BY sat_id, apid, seq, vehicle_ts, rx_ts
), stepped AS (
  SELECT sat_id, apid, seq, vehicle_ts,
         lag(seq) OVER w AS prev_seq,
         (seq - lag(seq) OVER w + 16384) % 16384 AS step
  FROM dedup
  WINDOW w AS (PARTITION BY sat_id, apid ORDER BY vehicle_ts)
)
SELECT *, step - 1 AS missing
FROM stepped
WHERE step <> 1;
```

```text
  sat_id  | apid | seq |       vehicle_ts       | prev_seq | step | missing
----------+------+-----+------------------------+----------+------+---------
 SAT-0417 |  100 |   4 | 2026-03-01 05:00:07+00 |        1 |    3 |       2
```

By hand: at seq 0 the previous count was 16383; $0 - 16383 = -16383$, plus 16384 is $1$, mod 16384 is $1$ — a normal step. At seq 4: $(4 - 1 + 16384) \bmod 16384 = 3$, so $3 - 1 = 2$ packets (2 and 3) are missing. The first row's step is NULL, and `NULL <> 1` is not true, so it drops out.

**Check:** the stream runs from 05:00:00 to 05:00:11 at 1 Hz, which is 12 packets. There are 11 rows, one of them a duplicate, so 10 distinct packets arrived. $12 - 10 = 2$ missing. It matches.
:::

Not every channel has a counter. The clock check works on anything timestamped: flag steps longer than, say, 1.5 times the expected period.

```sql
WITH g AS (
  SELECT sat_id, apid,
         lag(vehicle_ts) OVER w AS gap_start,
         vehicle_ts             AS gap_end
  FROM (SELECT DISTINCT sat_id, apid, vehicle_ts FROM rx_packet) AS d
  WINDOW w AS (PARTITION BY sat_id, apid ORDER BY vehicle_ts)
)
SELECT *, gap_end - gap_start AS gap
FROM g
WHERE gap_end - gap_start > interval '1.5 seconds';
```

```text
  sat_id  | apid |       gap_start        |        gap_end         |   gap
----------+------+------------------------+------------------------+----------
 SAT-0417 |  100 | 2026-03-01 05:00:04+00 | 2026-03-01 05:00:07+00 | 00:00:03
```

It is the windows module's sessionisation pattern, reporting the pauses instead of splitting on them. SQLite has no `interval`; measure seconds as `(julianday(vehicle_ts) - julianday(lag(vehicle_ts) OVER w)) * 86400`.

::: warning A gap is not final until late packets have had their chance
Packet 5 arrived half a second after packet 6, so a check run between the two would have called it lost. Pipelines wait a **grace period** before declaring a gap final, and some gaps fill only at the next pass's playback. Report gaps with the time you checked.
:::

### Out-of-order packets

Every packet has two times: **vehicle time**, when it was measured, and **arrival time**, when the ground got it. They disagree in order whenever packets take different routes — a retransmission, a slower station, or **[[store-and-forward|store-and-forward]]** playback of hours-old data.

A packet is out of order if an *earlier* arrival already carried a *later* vehicle time: a running maximum over the frame that stops one row short of the current one.

```sql
SELECT seq, vehicle_ts, rx_ts, station, latest_before
FROM (
  SELECT *,
         max(vehicle_ts) OVER (PARTITION BY sat_id, apid ORDER BY rx_ts
                               ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING)
           AS latest_before
  FROM rx_packet
) AS a
WHERE vehicle_ts < latest_before;
```

```text
 seq |       vehicle_ts       |           rx_ts           | station |     latest_before
-----+------------------------+---------------------------+---------+------------------------
   5 | 2026-03-01 05:00:08+00 | 2026-03-01 05:00:09.93+00 | GS-A    | 2026-03-01 05:00:09+00
```

Packet 6 (05:00:09) was already in when packet 5 (05:00:08) arrived. The rule: **analyze in vehicle time, diagnose the link in arrival time.**

::: key Two clocks on every packet
Vehicle time (`vehicle_ts`) is when the sample was taken; arrival time (`rx_ts`) is when the ground received it. Sort by vehicle time for analysis. A packet is out of order when an earlier arrival already carried a later vehicle time. Sequence steps are computed modulo the counter size, $(s_i - s_{i-1} + 2^{14}) \bmod 2^{14}$ for a 14-bit count: 1 is normal, 0 is a duplicate, more than 1 is a gap.
:::

### Vehicle-to-ground clock skew

The onboard clock is a quartz crystal, like a wristwatch's. It starts a little off and **drifts** — runs slightly fast or slow — so its error grows day by day. Ground clocks are disciplined by GPS to well under a microsecond. **Clock skew** is the difference.

To measure it, the spacecraft sends **time-correlation packets**, stamped onboard at a precisely known moment; the ground stamps their arrival. The difference is the offset plus the signal's flight time, the **[[light time|light-time]]**: distance divided by the speed of light, $c = 299\,792.458\,\mathrm{km/s}$.

$$
\text{offset} = t_{rx} - t_{vehicle} - \frac{r}{c}
$$

Here $t_{rx}$ (read "t sub r x") is the ground receive time, $t_{vehicle}$ is the onboard stamp, and $r$ is the **slant range** — the straight-line distance from antenna to spacecraft at that moment. A positive offset means the onboard clock is behind.

::: example Estimate a satellite's clock offset and drift
Table `time_corr` holds twelve correlation packets — three per pass, four passes over one day — with slant ranges of 700 to 1800 km. Per pass:

```sql
WITH o AS (
  SELECT pass, rx_ts,
         extract(epoch FROM rx_ts - vehicle_ts) - range_km / 299792.458 AS offset_s
  FROM time_corr
)
SELECT pass,
       min(rx_ts)                                          AS pass_start,
       round(avg(offset_s)::numeric, 4)                    AS mean_offset_s,
       round((max(offset_s) - min(offset_s))::numeric, 4)  AS spread_s
FROM o
GROUP BY pass
ORDER BY pass;
```

```text
 pass |       pass_start       | mean_offset_s | spread_s
------+------------------------+---------------+----------
    1 | 2026-03-01 00:00:00+00 |        0.4121 |   0.0010
    2 | 2026-03-01 08:00:00+00 |        0.4188 |   0.0003
    3 | 2026-03-01 16:00:00+00 |        0.4254 |   0.0013
    4 | 2026-03-02 00:00:00+00 |        0.4321 |   0.0010
```

`extract(epoch FROM …)` turns an interval into seconds. At 1800 km the light time is $1800 / 299\,792.458 \approx 0.0060\,\mathrm{s}$ — bigger than the spread within a pass, so it must come out.

The clock is about 0.41 s behind and slips about $0.0067\,\mathrm{s}$ every 8 hours. `regr_slope(y, x)` fits the best straight line of $y$ against $x$ and returns its slope:

```sql
WITH o AS (
  SELECT extract(epoch FROM rx_ts) AS t,
         extract(epoch FROM rx_ts - vehicle_ts) - range_km / 299792.458 AS offset_s
  FROM time_corr
)
SELECT round((regr_slope(offset_s, t) * 86400 * 1000)::numeric, 2) AS drift_ms_per_day,
       round((regr_slope(offset_s, t) * 1e6)::numeric, 3)         AS drift_ppm,
       round(regr_r2(offset_s, t)::numeric, 4)                     AS r2
FROM o;
```

```text
 drift_ms_per_day | drift_ppm |   r2
------------------+-----------+--------
            20.00 |     0.231 | 0.9966
```

The slope is seconds of offset per second; times 86 400 s per day and 1000 ms per second gives 20 ms per day, or 0.231 **[[parts per million|ppm]]**. `regr_r2` near 1 says the line fits well.

**Check:** from pass 1 to pass 4 is exactly one day, and $0.4321 - 0.4121 = 0.0200\,\mathrm{s}$ = 20 ms. The fit and the eyeball agree. Using the fitted line (`regr_intercept` gives its other number, the height where it crosses $t = 0$), the correction at 05:00:03 is about 0.4162 s, so packet 0 of `rx_packet`, stamped 05:00:03, really happened at about 05:00:03.416.
:::

Keep offset estimates in their own versioned table and apply them into a `corrected_ts` column or view — never overwrite raw `vehicle_ts`, because the estimate will improve.

Many spacecraft keep **GPS time**, which has no **[[leap seconds|leap-seconds-gps]]** and has been exactly 18 s ahead of UTC since 1 January 2017. An offset of 18.4 s instead of 0.4 s means someone skipped the GPS-to-UTC conversion.

::: key Clock skew
Offset $= t_{rx} - t_{vehicle} - r/c$, measured with time-correlation packets and fitted as a straight line (offset plus drift) over several passes. Keep raw vehicle time; add a corrected time from a versioned offset estimate. A skew of exactly 18 s is GPS time mistaken for UTC.
:::

## Check yourself

::: check
A sample table has `PRIMARY KEY (sat_id, ts, channel)`. A downlink batch of 5000 rows contains 40 keys that are already in the table and, separately, 3 keys that appear twice within the batch. What happens with (a) a plain `INSERT`, (b) `ON CONFLICT … DO NOTHING`, (c) `ON CONFLICT … DO UPDATE`?
:::

::: answer
(a) The first clash raises a duplicate-key error and the whole statement is undone: zero rows loaded.

(b) The 40 existing keys and the second copy of each of the 3 repeated keys are skipped: $5000 - 40 - 3 = 4957$ rows inserted, `INSERT 0 4957`.

(c) It fails with "cannot affect row a second time" because of the 3 in-batch repeats. Deduplicate the batch first; then it updates the 40 and inserts the rest.
:::

::: check
A 14-bit packet sequence count reads 16380, 16382, 1, 2 in vehicle-time order. How many packets are missing, and where? Show the modulo arithmetic.
:::

::: answer
From 16380 to 16382: $(16382 - 16380 + 16384) \bmod 16384 = 2$, so one packet (16381) is missing.

From 16382 to 1: $(1 - 16382 + 16384) \bmod 16384 = 3$, so two packets (16383 and 0) are missing.

From 1 to 2: step 1, normal. Three packets are missing in total. A naive subtraction would have given $1 - 16382 = -16381$ at the wrap and reported nonsense.
:::

::: check
A satellite at 1100 km slant range sends a time-correlation packet stamped 12:00:00.000 by its onboard clock. The ground receives it at 12:00:00.254. What is the clock offset, and is the onboard clock ahead or behind?
:::

::: answer
Light time $= 1100 / 299\,792.458 \approx 0.00367\,\mathrm{s}$, about 3.7 ms.

Offset $= 0.254 - 0.000 - 0.00367 \approx 0.250\,\mathrm{s}$.

Positive, so the onboard clock is about 0.25 s behind; add 0.250 s to correct its timestamps.
:::

::: check
Your team's dashboard shows battery voltage with a strange sawtooth: every few minutes the line jumps back in time and redraws a short stretch. What is the likely cause, and what one change fixes the plot?
:::

::: answer
The query sorts by arrival (or insertion) order, and late packets — playback or a slow station — make the line jump back in time. Sort by vehicle time (`ORDER BY vehicle_ts`, or the corrected time) instead.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Idempotent ingest | doing the load twice leaves the table exactly as doing it once |
| Natural key | `(sat_id, ts, channel)` with `PRIMARY KEY` or `UNIQUE` |
| `ON CONFLICT (…) DO NOTHING` | skip a row whose key exists; first copy wins |
| `ON CONFLICT (…) DO UPDATE SET c = EXCLUDED.c` | replace with the incoming row; add `WHERE` to make it conditional |
| In-batch repeats | deduplicate first, or `DO UPDATE` fails with "cannot affect row a second time" |
| `MERGE` (PostgreSQL 15+) | standard upsert with matched and not-matched branches; `ON CONFLICT` is safer under concurrency |
| SQLite | same `ON CONFLICT` syntax; `WHERE true` after `INSERT … SELECT`; avoid `INSERT OR REPLACE` |
| Counter wraparound | 14-bit count: step $= (s_i - s_{i-1} + 16384) \bmod 16384$ |
| Duplicates | group by key, `HAVING count(*) > 1`; distinct values > 1 means conflicting |
| Gaps | `LAG` on seq or time; wait a grace period before calling a gap final |
| Out of order | earlier arrival already had later vehicle time; analyze in vehicle time |
| Clock skew | offset $= t_{rx} - t_{vehicle} - r/c$; fit offset and drift; 18 s means GPS vs UTC |

Next lesson steps back to see the whole road these packets travel — from the sensor on the spacecraft, through packetization, ground stations and decommutation, to a time-series store and a report — and the systems real fleets use to carry them.

::: context station-overlap Why two antennas hear the same pass
A low-orbit satellite is visible from a ground station for only about ten minutes per pass, and only above a few degrees of elevation. Ground networks place stations so their circles of view overlap, which gives a second chance when one antenna has rain fade, a hardware fault or a network outage. The price is duplicate data from the overlap, which is exactly what idempotent ingest absorbs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="130" cy="100" r="80" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1"/>
  <circle cx="230" cy="100" r="80" fill="#f2b880" fill-opacity="0.35" stroke="#1f2a44"/>
  <circle cx="130" cy="100" r="4" fill="#1d6fd1"/>
  <circle cx="230" cy="100" r="4" fill="#1f2a44"/>
  <text x="100" y="118" font-size="12" fill="#1f2a44">GS-A</text>
  <text x="238" y="118" font-size="12" fill="#1f2a44">GS-B</text>
  <line x1="20" y1="40" x2="340" y2="80" stroke="#b4232c" stroke-width="2"/>
  <polygon points="340,80 328,74 327,83" fill="#b4232c"/>
  <text x="24" y="28" font-size="12" fill="#b4232c">satellite ground track</text>
  <text x="180" y="160" font-size="11" fill="#1f2a44" text-anchor="middle">overlap: both stations receive</text>
  <line x1="180" y1="150" x2="180" y2="75" stroke="#6c7a93" stroke-dasharray="3 3"/>
</svg>
```
:::

::: context idempotent-word A word from algebra
"Idempotent" is Latin glued together: *idem*, "the same", and *potent*, "power". A mathematician in the 1870s, Benjamin Peirce, coined it for a quantity whose square is itself, like 1 or 0: $1 \times 1 = 1$. Applying it again changes nothing. Computer people borrowed the word for operations you can safely repeat. It appears everywhere systems talk over unreliable links: web requests, message queues, payment systems and telemetry ingest all lean on it, because "did my message get through?" often has no answer except "send it again".
:::

::: context staging-table Land first, then decide
A staging table (also called a landing table) accepts a file exactly as it came, with no key and few constraints, so the copy never fails halfway. The rules — deduplicate, validate, upsert — then run in one SQL statement where you can see and test them. It also leaves evidence: if a file was strange, the raw rows are still there to inspect. Many teams keep the landing rows for a few days for exactly that reason, and only then truncate them.
:::

::: context merge-history An old statement, newly arrived
`MERGE` entered the SQL standard in 2003, and Oracle, SQL Server and DB2 have had it for many years. PostgreSQL went its own way first, adding `INSERT … ON CONFLICT` in version 9.5 in 2016, and only added `MERGE` in version 15 in 2022. That is why PostgreSQL code you meet in the wild almost always upserts with `ON CONFLICT`. Version 17 extended `MERGE` further, with `RETURNING` and a branch for target rows that have no match in the source; version 16, used in this module, has neither.
:::

::: context store-and-forward Record now, send later
A satellite is in contact with a ground station for only part of each orbit. Out of contact, it keeps measuring and writes the samples to onboard memory. At the next pass it sends two streams at once: live data, and a playback of the recording. So the ground receives brand-new samples and hours-old samples interleaved. Arrival order and vehicle order can differ by hours, not seconds.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">vehicle time</text>
  <line x1="10" y1="40" x2="350" y2="40" stroke="#1f2a44"/>
  <rect x="20" y="30" width="190" height="20" fill="#f2b880"/>
  <text x="115" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">out of contact: recorded</text>
  <rect x="220" y="30" width="120" height="20" fill="#8fb8f0"/>
  <text x="280" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">pass: live</text>
  <text x="10" y="90" font-size="12" fill="#1f2a44">arrival time</text>
  <line x1="10" y1="112" x2="350" y2="112" stroke="#1f2a44"/>
  <rect x="220" y="102" width="120" height="10" fill="#8fb8f0"/>
  <rect x="220" y="112" width="120" height="10" fill="#f2b880"/>
  <text x="280" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">both arrive during the pass</text>
  <line x1="115" y1="52" x2="250" y2="110" stroke="#6c7a93" stroke-dasharray="3 3"/>
</svg>
```
:::

::: context light-time Why the signal's travel time matters
Radio waves travel at the speed of light, about 300 000 km per second. That is fast, but not instant. A satellite 550 km straight overhead is about 1.8 ms away; near the horizon the slant range can be 2000 km or more, about 7 ms. Those milliseconds are the same size as the clock errors you are trying to measure, so they must come out of the calculation. For a spacecraft at the Moon, about 384 000 km away, the light time is about 1.3 seconds.
:::

::: context ppm How good is a quartz clock?
"Parts per million" means millionths. A clock that is off by 1 ppm gains or loses one second in a million seconds, about 0.086 s per day. The example's 0.231 ppm is about 20 ms a day, typical of a good temperature-compensated crystal. Temperature changes the rate, so a satellite's clock drifts a little differently in sunlight and eclipse — one reason to refit the drift every few passes rather than trust one old number.
:::

::: context leap-seconds-gps Why GPS time and UTC differ by a whole number of seconds
UTC is kept close to Earth's slightly irregular rotation by adding a leap second now and then; 27 have been added since 1972. GPS time started on 6 January 1980, lined up with UTC, and has never added one since, so it has fallen ahead by every leap second added after that date — 18 of them, the last at the end of 2016. The first SQL module's time lesson met this from the database side: PostgreSQL ignores leap seconds, so the conversion is your pipeline's job.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="40" x2="340" y2="40" stroke="#1d6fd1" stroke-width="2"/>
  <text x="20" y="28" font-size="12" fill="#1d6fd1">GPS time: steady, no leap seconds</text>
  <polyline points="20,70 90,70 90,76 160,76 160,82 230,82 230,88 300,88 300,94 340,94" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="20" y="112" font-size="12" fill="#1f2a44">UTC: steps back at each leap second</text>
  <line x1="330" y1="42" x2="330" y2="92" stroke="#b4232c"/>
  <text x="325" y="68" font-size="12" fill="#b4232c" text-anchor="end">18 s today</text>
</svg>
```
:::
