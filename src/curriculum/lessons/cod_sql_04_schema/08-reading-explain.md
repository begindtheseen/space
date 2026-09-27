---
id: l08-reading-explain
title: Reading EXPLAIN plans
minutes: 22
covers:
  - "EXPLAIN and EXPLAIN ANALYZE: sequential versus index versus bitmap heap scan; nested loop versus hash versus merge join"
  - Estimated versus actual rows as the tell for stale statistics
---

Before a long drive, a navigation app plans a route. It does not know the traffic for sure, so it guesses from what it knew last time: this road is usually clear, that bridge is usually slow. If its information is old — the bridge was closed last week — it confidently sends you the wrong way. The route was the best one *for the map it had*.

A database does the same thing with every query. SQL says *what* you want, never *how* to get it. A part of PostgreSQL called the **[[planner|planner-word]]** (or optimizer) decides how: which index to use, which table to read first, which way to join. It chooses by estimating how many rows each step will produce, from statistics it gathered earlier. The result is the **plan**, and `EXPLAIN` shows it to you.

You have seen plans in every lesson of this module. This one teaches you to read them line by line, so that when a query on the flight-data warehouse is slow, you can say *why* in a sentence: "it's scanning the whole table because there is no index on that column", or "it thinks this step makes 399 rows and it really makes 3.4 million, so the statistics are stale". Those are the two diagnoses you will make most often.

## EXPLAIN and EXPLAIN ANALYZE

`EXPLAIN` in front of a query prints the plan the planner chose, with its *estimates*, without running the query. `EXPLAIN ANALYZE` *runs* the query and prints the estimates next to what actually happened. Adding `BUFFERS` also counts the 8 kB pages each step touched: `EXPLAIN (ANALYZE, BUFFERS)`.

::: warning EXPLAIN ANALYZE really runs the statement
It executes the query in full, so `EXPLAIN ANALYZE DELETE ...` deletes the rows. To look at the plan of a write safely, wrap it: `BEGIN; EXPLAIN ANALYZE DELETE ...; ROLLBACK;`. And a query that takes an hour takes an hour under EXPLAIN ANALYZE too; plain EXPLAIN is instant.
:::

Here is the plan from lesson 05 for ten minutes of data with no index (abbreviated), taken apart:

```text
 Seq Scan on telemetry  (cost=0.00..120960.00 rows=3790 width=19) (actual time=112.391..216.596 rows=4000 loops=1)
   Filter: ((ts >= '2026-03-05 12:00:00+00'::timestamp with time zone) AND (ts < '2026-03-05 12:10:00+00'::timestamp with time zone))
   Rows Removed by Filter: 5180000
   Buffers: shared hit=16180 read=27020
```

Every step, called a **node**, has one line with two brackets.

The first bracket is the **estimate**:

- `cost=0.00..120960.00` — the **startup cost** (work before the first row can come out) and the **total cost** (work to produce every row). Costs are in made-up units, roughly "the price of reading one page in order". They are for comparing plans, not for converting to seconds.
- `rows=3790` — how many rows the planner *expects* this node to produce.
- `width=19` — the expected average size of each output row in bytes. Here `sat_id` (4 bytes) plus `channel` (about 7) plus `value` (8).

The second bracket is **what really happened** (only with ANALYZE):

- `actual time=112.391..216.596` — milliseconds until the first row came out, and until the last.
- `rows=4000` — rows it *actually* produced.
- `loops=1` — how many times the node ran. When a node runs many times, its `rows` and `time` are **per loop**: multiply by `loops` to get the total. This trips up almost everyone once.

The lines underneath give details: the condition applied (`Filter`), how many rows it threw away, and `Buffers` — `hit` pages were already in PostgreSQL's memory, `read` ones had to be fetched from the operating system or disk.

::: example Where does cost=120960.00 come from?
**Question.** For a sequential scan, PostgreSQL's cost model charges `seq_page_cost` = 1.0 per page read, `cpu_tuple_cost` = 0.01 per row handled, and `cpu_operator_cost` = 0.0025 per operator evaluated per row. The table had 43,200 pages and 5,184,000 rows, and the filter has two comparisons (`>=` and `<`). Reproduce the total cost.

**Step 1: reading pages.** $43\,200 \times 1.0 = 43\,200$.

**Step 2: handling rows.** $5\,184\,000 \times 0.01 = 51\,840$.

**Step 3: evaluating the filter.** Two comparisons per row: $5\,184\,000 \times 2 \times 0.0025 = 25\,920$.

**Step 4: add.** $43\,200 + 51\,840 + 25\,920 = 120\,960$. Exactly the plan's total cost.

**Sanity check.** The startup cost is 0.00 because a sequential scan can hand out its first matching row as soon as it finds one. And the number of rows the query keeps does not appear anywhere in the sum: a Seq Scan costs the same whether it keeps 4,000 rows or 4 million. That is why it loses so badly to an index for a narrow query, and wins for a wide one.
:::

## Reading a plan as a tree

A plan with several nodes is a [[tree|plan-tree]], printed with indentation. The arrows `->` mark a node's children. Data flows **upward**: the most indented nodes run first and hand rows to their parent. So you read a plan from the inside out, bottom up. The top line's `actual time` and the final `Execution Time` are the whole query.

## The four ways to read a table

Every plan bottoms out in a **scan**, a node that reads one table. You have now met all four kinds.

**Seq Scan**, sequential scan. Read every page in order and test every row. Cheap per page, so it wins when the query keeps a big fraction of the table (lesson 07's NOMINAL rows), and it is the only option when no index fits.

**Index Scan**. Descend a B-tree, walk the matching leaf entries, and fetch each row from the heap as you go. Wins when a few rows are wanted. The fetches can jump around the heap, so each one may cost a random page read. It also hands out rows *in index order*, which can save a Sort.

**Bitmap Heap Scan**, always with a **Bitmap Index Scan** under it. A two-step compromise. First the index scan collects the locations of all matching rows into a **[[bitmap|bitmap-word]]**, one bit per heap page (or per row). Then the heap scan visits those pages **in physical order**, each page once, and rechecks the condition. It wins in the middle ground — too many rows for scattered single fetches, too few for a full scan — and it can combine two indexes (`BitmapAnd`, `BitmapOr`) before touching the heap. When the bitmap gets too big for memory, it remembers only whole pages; the plan then says `Heap Blocks: lossy`, as with BRIN in lesson 05.

**Index Only Scan**. Answer from the index alone, when it covers the query, visiting the heap only for pages not marked all-visible (`Heap Fetches`, lesson 06).

::: key Scan types in a plan
Seq Scan reads the whole table; best for large fractions or when no index fits. Index Scan follows the index row by row; best for few rows, and returns them in index order. Bitmap Heap Scan collects matches from one or more indexes, then reads the heap pages in physical order; best in between. Index Only Scan reads only the index when it covers the query.
:::

## The three ways to join

A join node takes rows from two children, the **outer** (listed first) and the **inner** (listed second), and pairs them up. PostgreSQL has three **join algorithms**, and it picks one by estimating how many rows each side will bring.

### Nested loop

For every row of the outer side, go and look up matching rows on the inner side. It is the way you would check a class list against a sign-up sheet by hand: take each name, search the sheet. It is excellent when the outer side is tiny and the inner side has an index to search with, and terrible when the outer side is big, because the inner search runs once per outer row.

```sql
EXPLAIN ANALYZE
SELECT s.name, d.ts, d.value
FROM satellite AS s
JOIN downlink AS d ON d.sat_id = s.sat_id
WHERE s.name IN ('SAT-017', 'SAT-142')
  AND d.channel = 'BATT_V'
  AND d.ts >= '2026-03-02 06:00+00' AND d.ts < '2026-03-02 06:10+00';
```

```text
 Nested Loop  (cost=0.43..162.59 rows=10 width=24) (actual time=0.075..0.167 rows=10 loops=1)
   ->  Seq Scan on satellite s  (cost=0.00..4.50 rows=2 width=12) (actual time=0.010..0.026 rows=2 loops=1)
         Filter: (name = ANY ('{SAT-017,SAT-142}'::text[]))
         Rows Removed by Filter: 198
   ->  Index Scan using downlink_sat_ts on downlink d  (cost=0.43..78.99 rows=5 width=20) (actual time=0.026..0.068 rows=5 loops=2)
         Index Cond: ((sat_id = s.sat_id) AND (ts >= '2026-03-02 06:00:00+00'::timestamp with time zone) AND (ts < '2026-03-02 06:10:00+00'::timestamp with time zone))
         Filter: (channel = 'BATT_V'::text)
         Rows Removed by Filter: 15
 Planning Time: 0.959 ms
 Execution Time: 0.207 ms
```

Here `satellite` is a 200-row list of the fleet, `CREATE TABLE satellite (sat_id INTEGER PRIMARY KEY, name TEXT NOT NULL, batch TEXT NOT NULL)`, with SAT-001 to SAT-100 in launch batch G11 and SAT-101 to SAT-200 in batch G12. `downlink` is a four-million-row telemetry table with an index on `(sat_id, ts)`, described in full below. The outer side found 2 satellites. The inner Index Scan ran `loops=2` times, once per satellite, averaging 5 rows per loop: $5 \times 2 = 10$ rows in all. (In fact all 10 came from SAT-142; SAT-017's data in this table ends on 1 March.) A fifth of a millisecond.

### Hash join

Read the smaller side completely and build a **[[hash table|hash-table-word]]** from it in memory: a lookup table keyed on the join column. Then stream the bigger side past it, looking each row up in the hash table. It is how you would match two long lists by first sorting one into labeled cubbyholes. It needs an equality condition (`=`), and wins for large, unsorted inputs. You will see it in the stale-statistics example below: 200 satellites hashed, 3,456,000 downlink rows streamed past.

### Merge join

Sort both sides on the join key, then walk down them together [[like a zipper|zipper-picture]], pairing equal keys. If both inputs *already* come sorted — from an index, or from an earlier step — there is nothing to sort and the merge is very cheap. Here, pairing battery voltage with battery temperature at the same minute for SAT-042:

```sql
EXPLAIN ANALYZE
SELECT v.sat_id, v.ts, v.value AS volts, t.value AS temp_c
FROM telemetry AS v
JOIN telemetry AS t ON t.sat_id = v.sat_id AND t.ts = v.ts
WHERE v.channel = 'BATT_V' AND t.channel = 'BATT_T'
  AND v.sat_id = 42 AND t.sat_id = 42;
```

```text
 Merge Join  (cost=96062.27..96354.76 rows=15036 width=28) (actual time=353.083..357.330 rows=12960 loops=1)
   Merge Cond: (v.ts = t.ts)
   ->  Sort  (cost=48027.71..48061.19 rows=13390 width=20) (actual time=307.780..308.389 rows=12960 loops=1)
         Sort Key: v.ts
         ->  Bitmap Heap Scan on telemetry v  (cost=797.42..47109.91 rows=13390 width=20) (actual time=238.012..304.975 rows=12960 loops=1)
   ->  Sort  (cost=48034.56..48068.26 rows=13480 width=20) (actual time=45.258..45.840 rows=12960 loops=1)
         Sort Key: t.ts
         ->  Bitmap Heap Scan on telemetry t  (cost=797.45..47109.93 rows=13480 width=20) (actual time=5.618..43.337 rows=12960 loops=1)
 Execution Time: 358.075 ms
```

(abbreviated.) Each side fetched 12,960 rows, sorted them by `ts` in memory, and the Merge Join zipped them into 12,960 pairs. Notice the Merge Join's high *startup* cost (96,062): it cannot emit a row until both sorts are finished. Most of the time went on the first Bitmap Heap Scan, fetching pages from disk.

::: key Nested loop versus hash versus merge join
Nested loop wins when the outer side is tiny and the inner side is indexed; hash join wins for large unsorted inputs with an equality condition; merge join wins when both inputs are already sorted on the key. The planner picks from its row estimates.
:::

That last sentence is the hinge of the whole lesson. The planner does not measure; it *predicts*. A nested loop over an outer side it believes has 3 rows is a fine plan. If the outer side really has three million rows, the same plan is a disaster.

## Where the estimates come from

The planner's row counts come from **statistics** stored per column, which you have already peeked at in `pg_stats`: the most common values and how often each occurs, a **[[histogram|histogram-word]]** (the column's values cut into buckets of equal row count, so the planner knows how the rest are spread), the number of distinct values, and the correlation from lesson 05. The table's total row count and page count are kept in `pg_class` as `reltuples` and `relpages`.

These are gathered by **ANALYZE**, which reads a random sample of the table (30,000 rows by default). **Autovacuum** runs it automatically once roughly 10 percent of a table's rows have changed since the last time. Between runs, the statistics describe the table *as it was*. For a table that changes slowly, nobody notices. For a telemetry table that has received a bulk load, they can be badly out of date.

## The tell: estimated versus actual rows

Here is stale statistics produced for real. The `downlink` table has the same columns as `telemetry`, an index on `(sat_id, ts)`, and autovacuum switched off so nothing refreshes it behind our backs:

```sql
CREATE TABLE downlink (
    sat_id INTEGER NOT NULL, ts TIMESTAMPTZ NOT NULL,
    channel TEXT NOT NULL, value DOUBLE PRECISION NOT NULL
) WITH (autovacuum_enabled = false);
CREATE INDEX downlink_sat_ts ON downlink (sat_id, ts);

-- day one: 100 satellites of batch G11
INSERT INTO downlink SELECT sat_id, ts, channel, value FROM telemetry WHERE ts < '2026-03-02';
ANALYZE downlink;                                                      -- 576,000 rows

-- then six days from the new batch G12, satellites 101 to 200, arrive in bulk
INSERT INTO downlink
SELECT sat_id + 100, ts + interval '1 day', channel, value FROM telemetry
WHERE ts < '2026-03-07';                                               -- 3,456,000 rows
```

PostgreSQL's own bookkeeping shows the problem:

```sql
SELECT n_live_tup, n_mod_since_analyze FROM pg_stat_user_tables
WHERE relid = 'downlink'::regclass;
SELECT reltuples FROM pg_class WHERE oid = 'downlink'::regclass;
```

```text
 n_live_tup | n_mod_since_analyze
------------+---------------------
    4032000 |             3456000

 reltuples
-----------
    576000
```

Six out of every seven rows arrived after the last ANALYZE. The histogram for `ts` still ends at `2026-03-01 23:59:00+00`: as far as the statistics know, nothing exists after day one. Now the operations team asks how many samples the fleet has sent since 2 March, by batch:

```sql
EXPLAIN ANALYZE
SELECT s.batch, count(*) AS samples
FROM downlink AS d
JOIN satellite AS s ON s.sat_id = d.sat_id
WHERE d.ts >= '2026-03-02 00:00+00'
GROUP BY s.batch;
```

```text
 GroupAggregate  (cost=4087.04..4090.05 rows=2 width=12) (actual time=2142.763..2142.766 rows=1 loops=1)
   Group Key: s.batch
   ->  Sort  (cost=4087.04..4088.03 rows=399 width=4) (actual time=1712.928..1937.406 rows=3456000 loops=1)
         Sort Key: s.batch
         Sort Method: external merge  Disk: 27144kB
         ->  Nested Loop  (cost=0.43..4069.80 rows=399 width=4) (actual time=0.724..1229.715 rows=3456000 loops=1)
               ->  Seq Scan on satellite s  (cost=0.00..4.00 rows=200 width=8) (actual time=0.003..0.085 rows=200 loops=1)
               ->  Index Only Scan using downlink_sat_ts on downlink d  (cost=0.43..20.29 rows=4 width=4) (actual time=0.009..4.842 rows=17280 loops=200)
                     Index Cond: ((sat_id = s.sat_id) AND (ts >= '2026-03-02 00:00:00+00'::timestamp with time zone))
                     Heap Fetches: 3456000
 Planning Time: 0.272 ms
 Execution Time: 2144.753 ms
```

Read it bottom up and compare `rows=` in the two brackets on every line:

- The inner Index Only Scan: estimated **4** rows per loop, actual **17,280** per loop, over 200 loops.
- The Nested Loop: estimated **399**, actual **3,456,000**. Off by a factor of about 8,700.
- The Sort: planned for 399 rows, it got 3.4 million, overflowed its memory, and spilled to disk (`external merge  Disk: 27144kB`).

Every choice in this plan was sensible for 399 rows: a nested loop with index lookups, a sort that fits in memory. Every choice was wrong for 3.4 million. And the `Heap Fetches: 3456000` is lesson 06's visibility map again: with autovacuum off, nothing had marked the new pages all-visible. Now refresh the statistics:

```sql
ANALYZE downlink;
```

```text
 HashAggregate  (cost=106629.50..106629.52 rows=2 width=12) (actual time=1078.732..1078.736 rows=1 loops=1)
   Group Key: s.batch
   Batches: 1  Memory Usage: 24kB
   ->  Hash Join  (cost=6.50..89329.48 rows=3460005 width=4) (actual time=28.663..731.500 rows=3456000 loops=1)
         Hash Cond: (d.sat_id = s.sat_id)
         ->  Seq Scan on downlink d  (cost=0.00..80048.00 rows=3460005 width=4) (actual time=28.604..323.432 rows=3456000 loops=1)
               Filter: (ts >= '2026-03-02 00:00:00+00'::timestamp with time zone)
               Rows Removed by Filter: 576000
         ->  Hash  (cost=4.00..4.00 rows=200 width=8) (actual time=0.049..0.050 rows=200 loops=1)
               Buckets: 1024  Batches: 1  Memory Usage: 16kB
               ->  Seq Scan on satellite s  (cost=0.00..4.00 rows=200 width=8) (actual time=0.008..0.023 rows=200 loops=1)
 Planning Time: 0.279 ms
 Execution Time: 1078.769 ms
```

Estimated 3,460,005, actual 3,456,000: within 0.2 percent. With the right numbers, the planner chose a completely different plan: a Seq Scan of `downlink` (it wants six-sevenths of the table, so no index can help), a Hash Join against the 200 hashed satellites, and a HashAggregate that needs no sort at all. Twice as fast, no disk spill. The answer, for the record, is 3,456,000 samples, all from batch G12.

::: key In EXPLAIN ANALYZE, what does a large gap between estimated and actual rows indicate?
Stale or insufficient statistics, or a correlation the planner cannot see. It is the usual root cause of a bad join order or a nested loop chosen where a hash join was needed.
:::

::: warning Run ANALYZE after a bulk load, yourself
Autovacuum will analyze the table eventually, but "eventually" is after the dashboards have run for an hour on a bad plan. Any job that loads a large batch — a backfill, a replay of stored telemetry, a nightly rebuild — should end with `ANALYZE table_name`. It reads a sample, so it takes seconds, not the time of a full scan.
:::

### When ANALYZE is not enough

A big estimate gap with fresh statistics has two other usual causes. One is a sample too small for a skewed column; `ALTER TABLE ... ALTER COLUMN ... SET STATISTICS 1000` makes ANALYZE keep a finer histogram and a longer most-common-values list. The other is **[[columns that depend on each other|dependent-columns]]**. The planner assumes conditions on different columns are independent and multiplies their selectivities. If `sat_id = 42` always means `orbital_plane = 3`, then `WHERE sat_id = 42 AND orbital_plane = 3` is estimated as far rarer than it is. `CREATE STATISTICS` on the pair teaches the planner the link.

## Two diagnoses, side by side

When a query is slow, run `EXPLAIN (ANALYZE, BUFFERS)` and look for one of two patterns.

**Missing index.** A Seq Scan (or a big Filter) whose `Rows Removed by Filter` dwarfs the rows kept, with estimates roughly right. The planner *knew* it was keeping few rows and scanned anyway, because it had no better way. The fix is an index that fits the predicate (lessons 05 to 07).

**Stale statistics.** Estimated `rows` far from actual `rows` — by a factor of ten or more — on a scan or join low in the tree, with the bad choices stacked above it. The fix is `ANALYZE`, then more statistics or extended statistics if the gap survives.

::: example Diagnosing two slow queries
**Plan 1** (from lesson 05, abbreviated):

```text
 Seq Scan on telemetry  (cost=0.00..120960.00 rows=3790 width=19) (actual time=112.391..216.596 rows=4000 loops=1)
   Filter: ((ts >= '2026-03-05 12:00:00+00'::timestamp with time zone) AND (ts < '2026-03-05 12:10:00+00'::timestamp with time zone))
   Rows Removed by Filter: 5180000
```

**Step 1: estimate against actual.** 3,790 against 4,000: within 6 percent. The statistics are fine.

**Step 2: work against result.** 5,180,000 rows read and thrown away to keep 4,000 — that is $4000 / 5\,184\,000 \approx 0.08$ percent kept. A tiny fraction, found by reading everything.

**Diagnosis.** Missing index on `ts`. Lesson 05 added one and the query went from 231 ms to 0.85 ms.

**Plan 2** (the stale-statistics plan above): the Nested Loop shows `rows=399` estimated and `rows=3456000` actual. **Step 1** gives a ratio of $3\,456\,000 / 399 \approx 8660$. **Step 2**: follow it down the tree to the lowest node where the gap starts: the Index Only Scan on `downlink`, estimated 4 rows per loop, actual 17,280. That table's statistics are wrong about `ts`. **Diagnosis**: stale statistics; `pg_stat_user_tables` confirms 3,456,000 rows changed since the last analyze. `ANALYZE downlink` fixed it, 2.14 s down to 1.08 s.

**Sanity check.** In plan 1, adding `ANALYZE` would change nothing, since the estimate was already right. In plan 2, adding another index would change nothing, since the planner already used an index — it used it for the wrong job. Naming the right problem is what picks the right fix.
:::

## Plans in SQLite

SQLite's `EXPLAIN QUERY PLAN` (lesson 06) gives only the shape, with no costs or row counts. SQLite always joins with nested loops, so what you check is the order and whether each inner table is searched through an index. For the join above, on a `packet` table with an index on `(sat_id, ts)`:

```text
SCAN s
SEARCH p USING INDEX idx_packet_sat_ts (sat_id=? AND ts>? AND ts<?)
```

Read it as: loop over `satellite s`; for each satellite, seek into `packet` with the index. A `SCAN` on the *inner* table of a join would be the SQLite version of a missing index. SQLite also has an `ANALYZE` command, which stores its statistics in a table called `sqlite_stat1`.

## Check yourself

::: check
A plan line reads `Index Scan using x on readings (cost=0.43..8.45 rows=1 width=16) (actual time=0.010..0.050 rows=24 loops=500)`. How many rows did this node produce in total, and is the estimate a worry?
:::

::: answer
`rows=24` is per loop, and the node ran 500 times, so it produced $24 \times 500 = 12\,000$ rows in total. The planner expected 1 row per loop, 500 in total, so it was 24 times too low. That is big enough to matter: if this is the inner side of a nested loop, the planner may have picked the nested loop because it expected only 500 lookups to return anything. Check the statistics on `readings`.
:::

::: check
What is the difference between `cost=0.00..120960.00` and `actual time=112.391..216.596`, and why does a Merge Join usually have a large first number?
:::

::: answer
`cost` is the planner's estimate in abstract units, known before running; `actual time` is measured milliseconds, known only with ANALYZE. In each pair, the first number is up to the first row out, the second up to the last. A Merge Join must have both inputs sorted before it can pair anything, so if it sorts them itself, all the sorting is startup work: its first row cannot come out until both sorts are done.
:::

::: check
The planner chose a hash join for `telemetry JOIN satellite` (5 million rows against 200). Why is that sensible, and when would a nested loop be better for the same two tables?
:::

::: answer
The query reads many telemetry rows; hashing the 200 satellites takes microseconds, and each of the millions of telemetry rows then finds its satellite with one lookup in memory. A nested loop would be better when the outer side is tiny and the inner side has an index: for example, "SAT-017 and SAT-142, ten minutes of BATT_V", where 2 satellites each drive one index seek into telemetry and 10 rows come back.
:::

::: check
After a nightly backfill, a dashboard query that took 40 ms now takes 30 seconds. EXPLAIN ANALYZE shows `Nested Loop (... rows=35 ...) (actual ... rows=1800000 loops=1)` where last week's plan had a hash join. What happened, what do you run, and what do you change so it does not happen again?
:::

::: answer
The planner estimated 35 rows and got 1.8 million: its statistics describe the table before the backfill, so it chose a nested loop that ran millions of inner lookups. Run `ANALYZE` on the backfilled table (check `n_mod_since_analyze` in `pg_stat_user_tables` to confirm), then re-run EXPLAIN ANALYZE and expect a hash join with estimates close to actuals. To prevent it, make the backfill job end with `ANALYZE` on every table it loaded.
:::

::: check
A query shows `Seq Scan on events (... rows=51 ...) (actual ... rows=48 loops=1)` with `Rows Removed by Filter: 9999952`. Stale statistics or missing index?
:::

::: answer
Missing index. The estimate (51) is very close to the actual (48), so the statistics are fine. But the scan read ten million rows to keep 48, a vanishingly small fraction. An index fitting the WHERE clause (a B-tree on the filtered column, a composite index with the equality column first, or a partial index if the condition picks rare rows) would let it seek straight to them.
:::

## Summary

| Plan element | What it tells you |
| --- | --- |
| `cost=a..b` | Estimated startup and total cost, in abstract units |
| `rows=`, `width=` | Estimated rows out, and bytes per row |
| `actual time=a..b rows= loops=` | Measured ms to first and last row, rows per loop, times run |
| Seq Scan | Whole table; fine for large fractions |
| Index Scan / Index Only Scan | Few rows via B-tree; only-index when covered |
| Bitmap Heap Scan | Many rows from index(es), heap read in page order |
| Nested Loop | Tiny outer side, indexed inner side |
| Hash Join | Large unsorted inputs, equality condition |
| Merge Join | Both inputs already sorted on the key |
| Estimated far from actual | Stale statistics: run ANALYZE |
| Huge "Rows Removed by Filter", right estimates | Missing index |

The next lesson looks at a way to lose an index even when the right one exists: writing the WHERE clause so that the planner cannot seek on it.

::: context planner-word Why databases plan at all
In 1979 a team at IBM building System R, one of the first SQL databases, published a method for choosing among join orders and access paths by estimating their costs from statistics. Almost every relational database since, PostgreSQL included, descends from that idea. It is what lets you write SQL that says only what you want: the database works out how, and can change its mind as the data grows, without anyone rewriting the query.
:::

::: context plan-tree A plan is a tree read from the bottom
The stale-statistics plan drawn as a tree. Rows flow upward. The two scans at the bottom run first; the nested loop pairs their rows; the sort orders them; the aggregate counts them. Estimated rows are in blue, actual in red — and the gap opens at the lowest node on the right.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" fill="#ffffff">
    <rect x="110" y="8" width="140" height="30"/>
    <rect x="110" y="56" width="140" height="30"/>
    <rect x="110" y="104" width="140" height="30"/>
    <rect x="10" y="160" width="150" height="40"/>
    <rect x="200" y="160" width="150" height="40"/>
  </g>
  <g stroke="#6c7a93" stroke-width="1.2">
    <line x1="180" y1="38" x2="180" y2="56"/><line x1="180" y1="86" x2="180" y2="104"/>
    <line x1="160" y1="134" x2="85" y2="160"/><line x1="200" y1="134" x2="275" y2="160"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="180" y="21">GroupAggregate</text>
    <text x="180" y="69">Sort (spilled to disk)</text>
    <text x="180" y="117">Nested Loop</text>
    <text x="85" y="174">Seq Scan satellite</text>
    <text x="275" y="174">Index Only Scan downlink</text>
  </g>
  <g font-size="11" text-anchor="middle">
    <text x="150" y="33" fill="#1d6fd1">est 2</text><text x="210" y="33" fill="#b4232c">act 1</text>
    <text x="150" y="81" fill="#1d6fd1">est 399</text><text x="215" y="81" fill="#b4232c">act 3,456,000</text>
    <text x="150" y="129" fill="#1d6fd1">est 399</text><text x="215" y="129" fill="#b4232c">act 3,456,000</text>
    <text x="55" y="192" fill="#1d6fd1">est 200</text><text x="115" y="192" fill="#b4232c">act 200</text>
    <text x="240" y="192" fill="#1d6fd1">est 4 x 200</text><text x="315" y="192" fill="#b4232c">act 17,280 x 200</text>
  </g>
</svg>
```
:::

::: context bitmap-word What the bitmap is
A bitmap here is a long row of yes/no bits, one for each heap page (or each row slot). The Bitmap Index Scan sets a bit for every page holding a match. Because the bits are laid out in page order, the Bitmap Heap Scan that follows reads the table front to back, skipping unset pages, and never visits a page twice. Two bitmaps from two indexes can be combined bit by bit with AND or OR before any table page is read, which is how PostgreSQL uses two single-column indexes for `a = 1 AND b = 2`.
:::

::: context hash-table-word A hash table in the kitchen
A hash table is a set of numbered bins plus a rule, the hash function, that turns a key into a bin number. To build it, drop each satellite row into the bin its `sat_id` hashes to. To probe it, hash the incoming row's `sat_id`, go to that one bin, and compare against the few rows there. Building costs one pass over the small side; each probe costs about the same no matter how many rows are in the table. That is why a hash join's work grows in step with the rows, not with their product, as a nested loop without an index would.
:::

::: context zipper-picture A merge join is a zipper
Both inputs are sorted by the key. Two pointers start at the top of each list. If the keys are equal, emit a pair and step on; otherwise step the pointer on the smaller key. Each list is walked once.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="70" y="16" font-size="11" fill="#1f2a44" text-anchor="middle">voltage, by ts</text>
  <text x="290" y="16" font-size="11" fill="#1f2a44" text-anchor="middle">temperature, by ts</text>
  <g stroke="#1f2a44" fill="#8fb8f0">
    <rect x="30" y="26" width="80" height="22"/><rect x="30" y="56" width="80" height="22"/><rect x="30" y="86" width="80" height="22"/><rect x="30" y="116" width="80" height="22"/>
  </g>
  <g stroke="#1f2a44" fill="#f2b880">
    <rect x="250" y="26" width="80" height="22"/><rect x="250" y="56" width="80" height="22"/><rect x="250" y="86" width="80" height="22"/><rect x="250" y="116" width="80" height="22"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="70" y="41">12:00</text><text x="70" y="71">12:01</text><text x="70" y="101">12:02</text><text x="70" y="131">12:03</text>
    <text x="290" y="41">12:00</text><text x="290" y="71">12:01</text><text x="290" y="101">12:02</text><text x="290" y="131">12:03</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="110" y1="37" x2="250" y2="37"/><line x1="110" y1="67" x2="250" y2="67"/><line x1="110" y1="97" x2="250" y2="97"/><line x1="110" y1="127" x2="250" y2="127"/>
  </g>
  <text x="180" y="32" font-size="11" fill="#1d6fd1" text-anchor="middle">pair</text>
</svg>
```

In the lesson's merge join, each side had 12,960 minutes and every minute matched once, giving 12,960 pairs.
:::

::: context histogram-word What the histogram records
ANALYZE sorts its sample of a column and cuts it into 100 slices with equal numbers of rows (the default statistics target is 100), storing the boundary values. To estimate `ts >= x`, the planner finds which slice `x` falls in and counts the slices above it. If `x` is beyond the last boundary, the histogram says almost nothing is there. That is exactly what happened with `downlink`: the last boundary was 23:59 on 1 March, so "from 2 March on" looked nearly empty.
:::

::: context dependent-columns When two columns move together
The planner estimates `a = 1 AND b = 2` as (fraction with `a = 1`) times (fraction with `b = 2`), which is right only if the two are unrelated. In telemetry many columns are tied: a satellite belongs to one orbital plane, a channel to one subsystem, a firmware version to one launch batch. For tied columns the product is far too small. `CREATE STATISTICS sat_plane (dependencies) ON sat_id, orbital_plane FROM telemetry;` followed by ANALYZE lets the planner see the link and stop multiplying.
:::
