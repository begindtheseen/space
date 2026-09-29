---
id: l10-partitioning-and-aggregates
title: Partitioning by time and precomputed aggregates
minutes: 27
covers:
  - Range partitioning by time; clustering; materialised views and continuous aggregates
---

Picture a filing cabinet for a school's homework, with one drawer per month. Looking for something handed in on 2 March? Open the March drawer and ignore the rest. At the end of the year, the school throws out last year's work by pulling out whole drawers and emptying them into the recycling bin — nobody goes through a single giant drawer pulling out old sheets one by one.

A telemetry table that grows forever needs the same cabinet. Last lesson you made single queries touch fewer rows. This lesson changes the shape of the storage itself. **Partition** the table by time, so a query about March opens only March and deleting a month is instant. Keep rows in **physical time order**, so a tiny BRIN index can skip most of the table. **Precompute** the summaries dashboards ask for. Then see what the **TimescaleDB** extension automates, and sketch storage for six thousand satellites.

Start with the size of that fleet's data, because the size forces every decision.

## How big is the fleet's data?

Suppose each of 6000 satellites sends one channel at 10 Hz — ten samples a second. The arithmetic is multiplication, but the numbers get large fast, so go step by step.

::: example Counting samples and bytes for the fleet
**Samples per second.** $6000 \times 10 = 60\,000$ samples every second.

**Samples per day.** A day is $86\,400$ seconds, so $60\,000 \times 86\,400 = 5\,184\,000\,000$: about 5.18 billion. Here is a handy comparison. The practice table from the last lesson has 5,184,000 rows. One day of the fleet is a **thousand** of those tables.

**Samples over two years.** Take two years as $730$ days: $730 \times 86\,400 = 63\,072\,000$ seconds. Then $60\,000 \times 63\,072\,000 = 3.784 \times 10^{12}$ samples, about 3.8 trillion.

**Bytes in a row store.** How big is one sample stored as a narrow PostgreSQL row, with columns `ts timestamptz, value double precision, sat_id integer, channel_id smallint`? Rather than guess, measure: a million such rows took 52,183,040 bytes of table (52.2 bytes per row) and 31.6 bytes per row more for a B-tree on `(sat_id, ts)`. Every row carries a 23-byte **[[row header|row-header]]** before its 22 bytes of data.

- Table: $3.784 \times 10^{12} \times 52.2 \approx 1.975 \times 10^{14}$ bytes, about 198 TB.
- B-tree: $3.784 \times 10^{12} \times 31.6 \approx 1.196 \times 10^{14}$ bytes, about 120 TB.
- Per day: $5.184 \times 10^9 \times 52.2 \approx 2.706 \times 10^{11}$ bytes, about 271 GB of table.

**Sanity check.** 198 TB over 730 days is about 271 GB a day, which matches the per-day line. And this is **one** channel. A real bus sends dozens, so multiply.
:::

::: key How you store 10 Hz data from 6000 satellites for two years
Roughly 3.8e12 samples per channel (6000 × 10 Hz × 2 years), so: narrow rows or columnar storage, range partitioning by time (daily or weekly), compression on older partitions, continuous aggregates for the common queries, a short hot window in a row store and the archive in Parquet on object storage.
:::

The rest of this lesson and the next explain each piece of that answer.

## Range partitioning by time

**Partitioning** splits one logical table into several physical tables, called **partitions**, each holding one slice of the rows. Queries and inserts still name the one table, the **partitioned table** (or parent); PostgreSQL routes each row to the right partition. **Range partitioning** slices by ranges of one column, the **partition key**. For telemetry the key is time.

PostgreSQL calls this **declarative partitioning**, because you declare the slices with SQL:

```sql
CREATE TABLE telemetry_p (
    sat_id  integer          NOT NULL,
    ts      timestamptz      NOT NULL,
    channel text             NOT NULL,
    value   double precision NOT NULL
) PARTITION BY RANGE (ts);

CREATE TABLE telemetry_p_2026_01 PARTITION OF telemetry_p
    FOR VALUES FROM ('2026-01-01 00:00:00+00') TO ('2026-02-01 00:00:00+00');
CREATE TABLE telemetry_p_2026_02 PARTITION OF telemetry_p
    FOR VALUES FROM ('2026-02-01 00:00:00+00') TO ('2026-03-01 00:00:00+00');
CREATE TABLE telemetry_p_2026_03 PARTITION OF telemetry_p
    FOR VALUES FROM ('2026-03-01 00:00:00+00') TO ('2026-04-01 00:00:00+00');
CREATE TABLE telemetry_p_2026_04 PARTITION OF telemetry_p
    FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-05-01 00:00:00+00');
CREATE TABLE telemetry_p_default PARTITION OF telemetry_p DEFAULT;

CREATE INDEX ON telemetry_p (sat_id, ts);
```

Read `FOR VALUES FROM (a) TO (b)` as "rows with `a <= ts < b`". The lower bound is included and the upper bound is excluded: a **[[half-open range|partition-bounds]]**, exactly the shape from the last lesson. So each month's bound is the next month's start, and a reading at midnight on 1 February belongs to February only.

The index created on the parent is created on every partition too. Load the same 5,184,000 rows (11.0 s) and ask where they went:

```sql
SELECT tableoid::regclass AS partition, count(*)
FROM telemetry_p GROUP BY 1 ORDER BY 1;
```

```text
      partition      |  count
---------------------+---------
 telemetry_p_2026_01 | 1785600
 telemetry_p_2026_02 | 1612800
 telemetry_p_2026_03 | 1785600
```

`tableoid` is a hidden column naming the physical table each row lives in. Check: January has 31 days, and $31 \times 1440 \times 40 = 1\,785\,600$ (40 is 10 satellites times 4 channels); February has 28, and $28 \times 1440 \times 40 = 1\,612\,800$. April and the default partition are empty.

::: warning Keys on a partitioned table must include the partition key
A primary key or unique constraint on `telemetry_p` must contain `ts`. PostgreSQL enforces uniqueness partition by partition, so it can only promise a key is unique across the whole table if that key decides the partition. The natural key `(sat_id, ts, channel)` qualifies — which matters in lesson 12, where that key makes ingest safe to repeat.
:::

## Partition pruning: reading only the drawers you need

**Partition pruning** is the planner skipping partitions whose range cannot contain a matching row. It is the reason partitioning speeds up reads, and you can see it in `EXPLAIN`.

```sql
EXPLAIN ANALYZE SELECT avg(value) FROM telemetry_p
WHERE sat_id = 3 AND ts >= '2026-03-02 00:00:00+00' AND ts < '2026-03-03 00:00:00+00';
```

```text
 Aggregate  (actual time=4.171..4.172 rows=1 loops=1)
   ->  Bitmap Heap Scan on telemetry_p_2026_03 telemetry_p  (actual time=0.455..3.757 rows=5760 loops=1)
         Recheck Cond: ((sat_id = 3) AND (ts >= '2026-03-02 00:00:00+00'::timestamp with time zone) AND (ts < '2026-03-03 00:00:00+00'::timestamp with time zone))
         Heap Blocks: exact=480
         ->  Bitmap Index Scan on telemetry_p_2026_03_sat_id_ts_idx  (actual time=0.383..0.383 rows=5760 loops=1)
               Index Cond: ((sat_id = 3) AND (ts >= '2026-03-02 00:00:00+00'::timestamp with time zone) AND (ts < '2026-03-03 00:00:00+00'::timestamp with time zone))
 Execution Time: 4.192 ms
```

(Abbreviated: cost figures removed.) Only one table appears: `telemetry_p_2026_03`. January, February, April and the default partition are not in the plan at all. A range from 20 February to 10 March keeps exactly two partitions, February and March, under an `Append` node that reads them one after another.

Pruning needs the planner to compare your condition with the partition bounds, and that needs a **SARGable** condition on the partition key. Ask for `date_trunc('day', ts) = '2026-03-02'` and the plan lists **all five** partitions — an `Append` over January, February, March, April and the default — because the planner cannot tell which months a truncated day could fall in. Everything from the last lesson matters twice on a partitioned table.

::: key Partition pruning
The planner skips every partition whose bounds cannot match the `WHERE` clause on the partition key. `EXPLAIN` shows only the partitions it will read. A function wrapped around the key defeats pruning in the same way it defeats an index.
:::

## Retention: drop a partition instead of deleting rows

Flight data has a **[[retention period|retention]]**: how long it must be kept, and when it may be thrown away. When the oldest month falls out of the window, you must remove it. Compare the two ways.

::: example Removing January, two ways
**The unpartitioned table.** Delete January's rows (inside a transaction, rolled back afterwards, so the table survived for later examples):

```sql
DELETE FROM telemetry WHERE ts < '2026-02-01 00:00:00+00';
-- DELETE 1785600
-- Time: 924.260 ms
```

**The partitioned table.** Detach January's partition, then drop it:

```sql
ALTER TABLE telemetry_p DETACH PARTITION telemetry_p_2026_01;
-- Time: 11.258 ms
DROP TABLE telemetry_p_2026_01;
-- Time: 1.096 ms
```

**Compare.** $11.258 + 1.096 = 12.354$ ms against 924.260 ms: about 75 times faster. That is the small part of the story. `DELETE` marks each of 1,785,600 rows as dead one at a time, writing a record of each change to the **write-ahead log** (the WAL, the database's journal of every change). The disk space is not reused until **[[VACUUM|vacuum]]** walks the table and cleans up, and it is not returned to the operating system at all. `DROP TABLE` removes a whole file.

**Scale it up.** At fleet scale one day is about 271 GB of table and 5.18 billion rows. Deleting that row by row, every night, while ingest is running, is a job that never finishes. Dropping a daily partition takes milliseconds whatever its size.
:::

A detached partition is an ordinary table, so you can export it to the archive (next lesson) before dropping it. On a busy database, `DETACH PARTITION … CONCURRENTLY` (PostgreSQL 14 and later) avoids blocking queries on the parent while it works.

## The default partition

What happens to a row whose time fits no partition — a packet stamped in May when partitions exist only to April, or one stamped 1970 by a satellite whose clock reset? Without a **default partition**, the insert fails:

```text
ERROR:  no partition of relation "telemetry_p" found for row
DETAIL:  Partition key of the failing row contains (ts) = (2026-07-04 00:00:00+00).
```

With one, the row lands in `telemetry_p_default`, a catch-all. That keeps ingest running, but it has a cost you meet later. Put one May row in the default partition and then try to create May's partition:

```text
ERROR:  updated partition constraint for default partition "telemetry_p_default" would be violated by some row
```

A May row already sits in the default, so you must move it out first. Treat the default partition as an alarm, not a home: it should normally be empty. Create each new partition well before its time arrives, with a scheduled job or an extension such as **pg_partman**, which exists to do exactly that.

::: warning A partition for every day is not free either
Daily partitions over two years make 730 tables, each with its own indexes, and thousands of tiny partitions slow the planner down. Aim for partitions big enough to be worth a file and few enough to plan quickly: hundreds, not hundreds of thousands. For our practice table, monthly is plenty; for the real fleet, at 271 GB a day, daily is the natural slice.
:::

## Physical order: CLUSTER and BRIN

Partitioning decides **which file** a row lives in. Inside a file, row order still matters, because of the **BRIN** index from lesson 05. A BRIN index stores only a summary — the minimum and maximum — for each **[[block range|block-range]]** (128 pages of 8 kB by default). That works only when rows that are close in time are also close on disk.

PostgreSQL measures this for every column. `pg_stats.correlation` runs from $-1$ to $+1$. Read it as "how closely does the physical row order follow the sorted order of this column?" $+1$ means perfectly in order; $0$ means scattered.

To see what happens when order is lost, make a shuffled copy of the telemetry table and compare:

```sql
CREATE TABLE telemetry_shuffled AS SELECT * FROM telemetry ORDER BY random();
CREATE INDEX telemetry_shuffled_brin ON telemetry_shuffled USING brin (ts);
CREATE INDEX telemetry_brin ON telemetry USING brin (ts);
ANALYZE telemetry_shuffled; ANALYZE telemetry;

SELECT tablename, attname, round(correlation::numeric, 4) AS correlation
FROM pg_stats WHERE tablename IN ('telemetry', 'telemetry_shuffled') AND attname = 'ts';
```

```text
     tablename      | attname | correlation
--------------------+---------+-------------
 telemetry          | ts      |      1.0000
 telemetry_shuffled | ts      |      0.0000
```

The BRIN index on the ordered table is 32 kB; the B-tree on `ts` is 35 MB. To watch BRIN on its own, the B-tree indexes were set aside (dropped inside a transaction that was rolled back afterwards) and parallel workers turned off. On the ordered table, one day's query then read 4 block ranges:

```text
   ->  Bitmap Heap Scan on telemetry  (actual time=0.099..8.774 rows=57600 loops=1)
         Rows Removed by Index Recheck: 3840
         Heap Blocks: lossy=512
 Execution Time: 13.418 ms
```

`lossy=512` means 512 pages were read ($4 \times 128$), and only 3840 rows in them were outside the day. On the shuffled table, every block range contains readings from every day, so every summary says "maybe". Forced to use the BRIN index anyway, PostgreSQL read `lossy=43200` pages — the whole table — and threw away 5,126,400 rows: 495.9 ms. Left to itself, the planner, which knows the correlation is 0, chose a sequential scan instead.

**CLUSTER** puts the order back. `CLUSTER telemetry_shuffled USING telemetry_shuffled_ts;` rewrites the whole table in the order of a B-tree index — here one on `ts` — and rebuilds its indexes. It took 12.7 s. Afterwards the correlation was 1.0000, and the same BRIN query read `lossy=512` pages in 9.6 ms.

::: warning CLUSTER is a one-time sort, and it locks the table
`CLUSTER` holds an **[[ACCESS EXCLUSIVE lock|access-exclusive]]** while it rewrites: nobody can read or write the table until it finishes. And the order is not maintained: rows inserted later go wherever there is space. For telemetry, better not to lose order in the first place — insert in time order — and `CLUSTER` a partition only once it is closed.
:::

::: key When a BRIN index is the right choice
On a large append-only table whose physical order correlates with the column, which is exactly time-ordered telemetry. It stores a summary per block range, so it is tiny compared with a B-tree and excellent for wide time-range scans.
:::

## Materialised views: answers computed ahead of time

A dashboard shows one satellite's daily maximum bus temperature over ninety days, and redraws every thirty seconds. On the raw table that reads 129,600 rows every time, almost none of which changed since yesterday.

A **view** (from the first SQL module) is a saved query that is re-run on every use. A **materialised view** is a saved query whose **result** is stored like a table, and re-computed only when you say so. The SQL keyword is spelled `MATERIALIZED`.

```sql
CREATE MATERIALIZED VIEW telemetry_hourly AS
SELECT sat_id, channel, date_trunc('hour', ts) AS hour,
       count(*) AS n, avg(value) AS avg_value,
       min(value) AS min_value, max(value) AS max_value
FROM telemetry
GROUP BY sat_id, channel, date_trunc('hour', ts);
-- SELECT 86400      Time: 856.059 ms
```

Check the row count: 10 satellites × 4 channels × 2160 hours (90 days × 24) $= 86\,400$. Keeping `min` and `max` as well as `avg` is the downsampling rule from the windows module: an average hides a spike, and the maximum keeps it.

::: example The dashboard, before and after
**Raw table.** `SELECT date_trunc('day', ts), max(value) FROM telemetry WHERE sat_id = 3 AND channel = 'THM_BUS_TEMP' GROUP BY 1 ORDER BY 1;`

```text
 Sort  (actual time=259.907..259.913 rows=90 loops=1)
   ->  HashAggregate  (actual time=259.655..259.889 rows=90 loops=1)
         ->  Bitmap Heap Scan on telemetry  (actual time=24.870..243.332 rows=129600 loops=1)
 Execution Time: 260.366 ms
```

**Materialised view**, with a unique index on `(sat_id, channel, hour)` and fresh statistics. The same question, now `max(max_value)` grouped by `date_trunc('day', hour)`:

```text
 Sort  (actual time=0.836..0.840 rows=90 loops=1)
   ->  HashAggregate  (actual time=0.807..0.819 rows=90 loops=1)
         ->  Bitmap Heap Scan on telemetry_hourly  (actual time=0.160..0.598 rows=2160 loops=1)
 Execution Time: 0.879 ms
```

(Both abbreviated to their main nodes.) **Rows read:** 129,600 against 2160, which is 60 times fewer — one hourly row stands for 60 minute samples. **Time:** 260.4 ms against 0.88 ms, about 296 times faster. **Same answer:** the first three days' maxima are 29.156, 29.152 and 29.15 both ways, because the maximum of hourly maxima is the daily maximum.
:::

The price is **staleness**. Insert a new reading and the view does not notice: its latest hour stays at 23:00 on 31 March until you run

```sql
REFRESH MATERIALIZED VIEW telemetry_hourly;          -- Time: 881.728 ms
```

A plain refresh recomputes everything and locks readers out meanwhile. `REFRESH MATERIALIZED VIEW CONCURRENTLY` lets dashboards keep reading the old version while the new one is built, then applies only the differences. To match old rows to new ones it needs a unique index, and without one it refuses:

```text
ERROR:  cannot refresh materialized view "sql04c.telemetry_hourly" concurrently
HINT:  Create a unique index with no WHERE clause on one or more columns of the materialized view.
```

With `CREATE UNIQUE INDEX telemetry_hourly_key ON telemetry_hourly (sat_id, channel, hour);` it ran, in 1279.9 ms — slower than the plain refresh, but without blocking readers. Refreshes are usually scheduled, for example every five minutes with the **pg_cron** extension.

::: key What a continuous aggregate or materialised view is for
Precomputing the per-minute or per-hour rollups that dashboards ask for, so a query touches thousands of rows instead of billions. The cost is refresh logic and a lag window you must state on the dashboard.
:::

::: warning A plain materialised view recomputes everything
Every `REFRESH` re-reads the whole source table, even if only the last five minutes changed. On 5 million rows that is under a second. On 3.8 trillion it is impossible. At fleet scale you need a rollup that updates only the time buckets that changed — which is what a continuous aggregate does.
:::

## TimescaleDB: hypertables and continuous aggregates

**TimescaleDB** is an **extension** for PostgreSQL — an add-on package installed into the database that adds new functions and table types. It is not part of PostgreSQL and was not installed for this lesson, so its SQL is shown without output. It automates what you did by hand above.

A **hypertable** is a table that TimescaleDB partitions by time for you, into partitions it calls **[[chunks|chunks]]**. You create an ordinary table and convert it:

```sql
SELECT create_hypertable('telemetry', 'ts', chunk_time_interval => INTERVAL '1 day');
```

New chunks are created automatically as data arrives, so there is no default-partition alarm to watch, and pruning works as you saw above.

A **continuous aggregate** is a materialised view that refreshes **incrementally**: it tracks which time buckets have received new or changed rows and recomputes only those. It is declared like a materialised view, with `time_bucket` (from the windows module) in place of `date_trunc`, plus a policy that says when to refresh:

```sql
CREATE MATERIALIZED VIEW telemetry_hourly_ca
WITH (timescaledb.continuous) AS
SELECT sat_id, channel, time_bucket(INTERVAL '1 hour', ts) AS hour,
       count(*) AS n, avg(value) AS avg_value, min(value) AS min_value, max(value) AS max_value
FROM telemetry
GROUP BY sat_id, channel, time_bucket(INTERVAL '1 hour', ts);

SELECT add_continuous_aggregate_policy('telemetry_hourly_ca',
       start_offset      => INTERVAL '3 days',
       end_offset        => INTERVAL '1 hour',
       schedule_interval => INTERVAL '10 minutes');
```

Read the policy as: "every 10 minutes, refresh the buckets between 3 days ago and 1 hour ago." The last hour is left alone because it is still filling up; that hour is the **lag window** you state on the dashboard. TimescaleDB can also answer queries by combining the stored buckets with the newest raw rows (it calls this real-time aggregation); whether that is on by default has changed between versions, so check the version you run.

**Policies** do the rest on a schedule. `add_retention_policy('telemetry', INTERVAL '2 years')` drops chunks older than two years, and a compression policy turns older chunks into a compressed, column-by-column format — the idea of the next lesson.

TimescaleDB is one of several time-series stores; lesson 13 compares it with InfluxDB and ClickHouse.

## Putting it together

::: example A storage sketch for the fleet
**The load:** 6000 satellites, one 10 Hz channel each, kept for two years: 60,000 samples a second, 5.18 billion a day, $3.78 \times 10^{12}$ in all.

**1. Hot window in a row store.** Keep the most recent 7 days in PostgreSQL (or a hypertable), in narrow rows, **partitioned by day**. That is $7 \times 270.6 \approx 1894$ GB of table, about 1.9 TB, plus the indexes. Use a BRIN index on `ts` (kilobytes per partition) and one B-tree on `(sat_id, ts)` for "one satellite, recent hours" queries. The B-tree adds about 164 GB a day, so it earns its place only for queries that need it.

**2. Rollups.** A per-minute rollup (count, min, max, mean per satellite) has $6000 \times 1440 = 8\,640\,000$ rows a day, 600 times fewer than the raw data, and $6.3 \times 10^9$ over two years. A per-hour rollup has $6000 \times 24 \times 730 = 105\,120\,000$ rows in all — small enough for any dashboard. Keep these for the whole two years, as continuous aggregates or scheduled materialised views.

**3. Retention by partition.** Each night, detach the day that has left the hot window, export it to the archive, and drop it. Never `DELETE`.

**4. The archive.** Store older days as compressed columnar files (Parquet) on cheap **object storage**. The next lesson measures how much smaller that is.

**Sanity check.** Two years as rows would need about 198 TB of table plus 120 TB of B-tree, per channel. The sketch keeps under 2 TB of raw rows hot and small rollups for the rest: the expensive format holds only the data people are actively reading.
:::

## Check yourself

::: check
A partition is declared `FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-05-01 00:00:00+00')`. Which partition gets a row stamped exactly `2026-05-01 00:00:00+00`, if May's partition exists? And if it does not, but a default partition exists?
:::

::: answer
The upper bound is excluded, so the row does not belong to April. If May's partition exists (`FROM ('2026-05-01…')`, lower bound included), the row goes there. If it does not, the row goes to the default partition — and it will stop you creating May's partition later until you move it out. Without a default partition, the insert fails with "no partition of relation … found for row".
:::

::: check
Your plan for "SAT-3 during the second week of March" on a monthly-partitioned table shows an `Append` over all twelve monthly partitions of the year. The query's condition is `WHERE sat_id = 3 AND ts::date BETWEEN '2026-03-08' AND '2026-03-14'`. What is wrong, and what should it be?
:::

::: answer
The partition key `ts` is wrapped in a cast, so the planner cannot compare the condition with the partition bounds, and pruning fails — every month is scanned. Rewrite as a half-open range on the bare column: `ts >= '2026-03-08 00:00:00+00' AND ts < '2026-03-15 00:00:00+00'`. Note the end is the 15th, excluded, so all of the 14th is included. The plan should then show only the March partition.
:::

::: check
`pg_stats` says `ts` has a correlation of 0.02 on a two-year-old table, and the BRIN index on `ts` is being ignored. What happened, and what are your options?
:::

::: answer
The rows are no longer stored in time order (a bulk reload in another order, or late data filling freed space). Each block range's min and max now span nearly all of time, so the BRIN index rules nothing out and the planner rightly ignores it. Options: `CLUSTER` the table (or each closed partition) on a B-tree over `ts`, accepting an exclusive lock during the rewrite, or copy it into a fresh partition with `INSERT … SELECT … ORDER BY ts`. Then fix the cause.
:::

::: check
A dashboard reads from a materialised view refreshed every 15 minutes, and each refresh takes 40 s. What is the oldest the data on the dashboard can be in the moment before a refresh finishes, and what should the dashboard say?
:::

::: answer
The view shows data as of the moment the last refresh started. In the moment before the next refresh finishes, that was one refresh interval plus one refresh duration ago: 15 min + 40 s = 15 min 40 s. The dashboard should state this lag — for example "data up to 16 minutes old" — because an engineer reading a temperature needs to know it may not include the last quarter of an hour.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| Range partitioning | `PARTITION BY RANGE (ts)`; each partition `FROM (a) TO (b)` holds $a \le ts < b$ |
| Partition pruning | the planner skips partitions that cannot match; needs a SARGable condition on the key |
| Retention | detach and drop a partition (milliseconds), never `DELETE` a month (dead rows, WAL, vacuum) |
| Default partition | catch-all for rows that fit nowhere; should be empty; blocks creating a partition over its rows |
| Correlation | `pg_stats.correlation`, $-1$ to $+1$: physical order versus sorted order |
| BRIN | tiny min/max per block range; useful only when correlation is near 1 |
| CLUSTER | one-time rewrite in index order; exclusive lock; not maintained |
| Materialised view | stored query result; `REFRESH` recomputes all; `CONCURRENTLY` needs a unique index |
| Continuous aggregate | TimescaleDB's incrementally refreshed materialised view, with a stated lag |
| Fleet scale | $6000 \times 10 \times 63\,072\,000 \approx 3.8 \times 10^{12}$ samples in two years; about 271 GB of rows per day |

The next lesson opens up the archive: why storing a table column by column makes it many times smaller, how a Parquet file is laid out, and how data gets into all of this, in batches or as a stream.

::: context row-header What the 23 bytes are for
Every PostgreSQL row starts with a header: which transaction created it, which one deleted it (if any), where the newer version lives if it was updated, and a few flag bits. That is how PostgreSQL lets readers and writers work at once without blocking each other. Add padding to line things up and a 4-byte pointer from the page to the row, and a sample with 22 bytes of real data costs about 52 bytes on disk. For a table of a few thousand rows nobody cares. For 3.8 trillion samples it is the difference between 83 TB and 198 TB, and one reason archives use a columnar format instead.
:::

::: context partition-bounds Why the bounds touch without overlapping
Monthly partitions tile the time line like floor tiles: each starts exactly where the last one ended, with no gap and no overlap. That only works if each tile includes its left edge and excludes its right edge. PostgreSQL enforces it: create two partitions whose ranges overlap and it refuses.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="30" width="110" height="36" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="120" y="30" width="100" height="36" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="220" y="30" width="110" height="36" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="65" y="53" font-size="12" fill="#1f2a44" text-anchor="middle">2026_01</text>
  <text x="170" y="53" font-size="12" fill="#1f2a44" text-anchor="middle">2026_02</text>
  <text x="275" y="53" font-size="12" fill="#1f2a44" text-anchor="middle">2026_03</text>
  <circle cx="120" cy="84" r="5" fill="#1d6fd1"/>
  <text x="120" y="104" font-size="11" fill="#1f2a44" text-anchor="middle">1 Feb 00:00</text>
  <text x="120" y="120" font-size="11" fill="#1d6fd1" text-anchor="middle">belongs to 2026_02 only</text>
  <text x="10" y="20" font-size="11" fill="#6c7a93">FROM included, TO excluded</text>
</svg>
```
:::

::: context retention How long flight data is kept
Retention rules come from several places at once: contracts with a customer, the rules of a government agency, the needs of an anomaly investigation, and the plain cost of disks. Raw high-rate data is often kept for a limited time, while rollups, event logs and anything tied to an anomaly are kept far longer, sometimes for the life of the program. Lesson 14 treats retention and export control properly. For storage design, the point is that "delete everything older than N" happens every single day, so it must be cheap.
:::

::: context vacuum Why deleted rows do not vanish
In PostgreSQL a `DELETE` does not erase a row. It stamps the row as deleted by your transaction, because other transactions that started earlier may still need to see it. Once no running transaction can see it any more, the row is **dead**, and `VACUUM` (usually the automatic autovacuum) marks its space as reusable. Deleting 1.8 million rows therefore creates 1.8 million dead rows for vacuum to visit, and the table file stays the same size. Dropping a partition skips all of that: the file is removed.
:::

::: context block-range What a BRIN index actually stores
A table file is a sequence of 8 kB pages. BRIN groups them into ranges of 128 pages (1 MB) and remembers only the smallest and largest `ts` in each range. A query for 2 March asks each summary "could you contain 2 March?" and reads only ranges that say yes. If rows arrive in time order, each range covers a narrow slice of time and almost all say no.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="16" font-size="12" fill="#1f2a44">In time order (correlation 1)</text>
  <rect x="10" y="24" width="80" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="95" y="24" width="80" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="180" y="24" width="80" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="265" y="24" width="80" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <text x="50" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">1-2 Mar</text>
  <text x="135" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">2-3 Mar</text>
  <text x="220" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">3-4 Mar</text>
  <text x="305" y="44" font-size="11" fill="#1f2a44" text-anchor="middle">4-5 Mar</text>
  <text x="10" y="72" font-size="11" fill="#1d6fd1">only the matching ranges are read (blue)</text>
  <text x="10" y="100" font-size="12" fill="#1f2a44">Shuffled (correlation 0)</text>
  <rect x="10" y="108" width="80" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="95" y="108" width="80" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="180" y="108" width="80" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="265" y="108" width="80" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">1 Jan-31 Mar</text>
  <text x="135" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">1 Jan-31 Mar</text>
  <text x="220" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">1 Jan-31 Mar</text>
  <text x="305" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">1 Jan-31 Mar</text>
  <text x="10" y="158" font-size="11" fill="#b4232c">every range says "maybe", so all are read</text>
</svg>
```
:::

::: context access-exclusive The strongest lock there is
PostgreSQL has several lock levels. Ordinary reads and writes take weak locks that coexist happily. ACCESS EXCLUSIVE is the strongest: while one transaction holds it, no other transaction may even read the table. `CLUSTER`, `DROP TABLE`, a plain `REFRESH MATERIALIZED VIEW` and many kinds of `ALTER TABLE` take it. On a live telemetry database, any command that takes it on a busy table needs a maintenance window or a smaller target, such as one closed partition.
:::

::: context chunks Chunks are partitions with a different name
Under the hood, each TimescaleDB chunk is an ordinary PostgreSQL table, attached to the hypertable much as a partition is attached to its parent. The default chunk interval is 7 days; you choose a smaller one for high-rate data so each chunk's recent indexes fit comfortably in memory. Because chunks are real tables, everything in this lesson applies to them: pruning by time, dropping old ones for retention, and keeping rows in time order for BRIN-style skipping.
:::
