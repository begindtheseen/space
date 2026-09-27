---
id: l07-partial-indexes-and-write-cost
title: Partial indexes and what indexes cost
minutes: 21
covers:
  - Partial indexes; why a low-cardinality index is usually useless
  - Index maintenance cost on a write-heavy ingest path
---

You are studying with a highlighter. If you highlight the three sentences that matter on a page, the highlighting is gold: your eye jumps straight to them. If you highlight every sentence but one, the highlighter has told you nothing, and you spent the afternoon highlighting. Worse, every time the teacher hands out a new chapter, you have to highlight that too.

Indexes behave the same way. An index that points at a few rows out of millions is a shortcut. An index that points at nearly all of them is no shortcut at all, because the database would visit nearly every page anyway. And every index, useful or not, has to be updated for every row that arrives. On a telemetry system that ingests rows around the clock, that second cost is often the one that hurts.

This lesson measures both sides on the same five-million-row `telemetry` table. First, reads: why an index on a column with only a few distinct values usually goes unused, and how a **partial index** — one that holds only the rare rows you care about — fixes that. Then writes: how much each index slows ingest, what a **HOT update** saves, and why bulk loads drop their indexes and rebuild them afterwards.

## Selectivity: what fraction of the rows match?

The `status` column has three values. `pg_stats`, the statistics PostgreSQL gathers with `ANALYZE`, knows how common each one is:

```sql
SELECT most_common_vals, most_common_freqs, n_distinct
FROM pg_stats WHERE tablename = 'telemetry' AND attname = 'status';
```

```text
    most_common_vals    |       most_common_freqs        | n_distinct
------------------------+--------------------------------+------------
 {NOMINAL,WARN,ANOMALY} | {0.9698667,0.029,0.0011333333} |          3
```

These come from a sample, so they are close to, not exactly, the true shares: counting every row gives 5,023,452 NOMINAL (96.9 percent), 155,408 WARN (3.0 percent) and 5,140 ANOMALY (0.1 percent).

The fraction of rows a condition keeps is its **selectivity**. `status = 'ANOMALY'` keeps 0.1 percent: very selective. `status = 'NOMINAL'` keeps 97 percent: hardly selective at all. The number of distinct values in a column is its **cardinality**. A column with few distinct values — a boolean, a three-value status, a channel name out of four — is **low-cardinality**, and most of its values are unselective.

## Why a low-cardinality index usually goes unused

Build a B-tree on `status` and ask for NOMINAL rows:

```sql
CREATE INDEX telemetry_status ON telemetry (status);   -- 34 MB

EXPLAIN (ANALYZE, BUFFERS)
SELECT sat_id, ts, value FROM telemetry WHERE status = 'NOMINAL';
```

```text
 Seq Scan on telemetry  (cost=0.00..108011.77 rows=5027771 width=20) (actual time=0.010..545.701 rows=5023452 loops=1)
   Filter: (status = 'NOMINAL'::text)
   Rows Removed by Filter: 160548
   Buffers: shared hit=1836 read=41376
 Execution Time: 730.089 ms
```

(abbreviated.) The planner ignored the index. To see why, forbid the sequential scan (`SET enable_seqscan = off; SET enable_bitmapscan = off;`, switches meant for experiments like this, never for production) and make it use the index:

```text
 Index Scan using telemetry_status on telemetry  (cost=0.43..162098.37 rows=5027771 width=20) (actual time=0.032..617.893 rows=5023452 loops=1)
   Index Cond: (status = 'NOMINAL'::text)
   Buffers: shared read=47443
 Execution Time: 799.616 ms
```

(abbreviated.) Slower, and it read *more* pages: 47,443, against 43,212 for the whole table. Every heap page holds NOMINAL rows, so the index scan still visits every heap page, and on top of that it reads about 4,200 pages of index. An index can only save work by letting the database skip pages. Here there was nothing to skip.

### Rare rows, but on every page

The subtle part is that "rare" is not enough. WARN rows are only 3 percent of the table. Yet:

```sql
SELECT count(DISTINCT (ctid::text::point)[0]) AS pages_with_warn
FROM telemetry WHERE status = 'WARN';
-- 42105       (the table has 43212 pages)
```

(`ctid` is each row's [[physical address|ctid-word]], a page number and a slot; the expression pulls out the page number.) Three percent of the rows are spread over 97 percent of the pages. Asking the index for WARN rows still means reading nearly the whole table, one page at a time. The **[[dots on pages picture|scatter-picture]]** shows why.

::: example Predicting how many pages a rare value touches
**Question.** Rows are 3.0 percent WARN, scattered at random, 120 rows to a page, 43,212 pages. How many pages hold at least one WARN row? Repeat for ANOMALY at 0.1 percent.

**Step 1: one row.** The chance a given row is not WARN is $1 - 0.030 = 0.970$.

**Step 2: a whole page.** A page has no WARN row only if all 120 of its rows miss. For independent rows, multiply: $0.970^{120} \approx 0.0259$. So only about 2.6 percent of pages are WARN-free, and $1 - 0.0259 = 0.974$ of pages have at least one.

**Step 3: count them.** $0.974 \times 43\,212 \approx 42\,090$ pages. The measured count was 42,105.

**Step 4: ANOMALY.** With 0.0992 percent of rows, $1 - (1 - 0.000992)^{120} \approx 0.112$, so about $0.112 \times 43\,212 \approx 4850$ pages. Measured: 4,855.

**Sanity check.** The WARN index narrows 43,212 pages to 42,105 — it saves almost nothing. The ANOMALY index narrows to 4,855, about a ninth. The row fraction went down 30 times, and that is what finally made the index worth using. What matters is the fraction of *pages* touched, not rows.
:::

The planner makes this call from the statistics every time. In this table it used the index for ANOMALY (11 ms, 4,862 pages) and never for NOMINAL. For WARN it did choose the index, and on this machine, with every page already in memory, the index scan took 134 ms against 321 ms for the table scan, because it skipped testing five million rows one by one. But look at what it read: 42,239 pages, almost the whole table. When those pages have to come from disk in scattered order — **random I/O**, where I/O means input and output to storage — that advantage melts, and the next index added "for the WARN query" pays its write cost (below) for very little.

::: key Why is an index on a low-cardinality column usually useless?
If a value matches a large fraction of the table, following the index costs more random I/O than simply scanning. Partial indexes on the rare value are the useful variant.
:::

::: warning A boolean column is the classic trap
`is_eclipse BOOLEAN`, `is_valid BOOLEAN`, `downlinked BOOLEAN`: two values, each usually a big share of the table. A plain index on such a column is almost never used, but it is maintained on every insert. If one value is rare and queried often (say, `downlinked = false` for the few frames still waiting), index only that value, as in the next section.
:::

## Partial indexes: index only the rows you ask about

A **partial index** has a `WHERE` clause. Only rows that satisfy it get an entry:

```sql
CREATE INDEX telemetry_anomaly ON telemetry (sat_id, ts)
WHERE status = 'ANOMALY';
```

Read it as "an index on `(sat_id, ts)`, for anomaly rows only". It holds 5,140 entries instead of 5,184,000, and it is **176 kB**, where the full index on `status` was 34 MB and a full `(sat_id, ts)` index 72 MB. It is sorted by satellite and time, so it serves the questions people actually ask about anomalies:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT ts, channel, value FROM telemetry
WHERE status = 'ANOMALY' AND sat_id = 42 ORDER BY ts;
```

```text
 Sort  (cost=217.34..217.47 rows=54 width=23) (actual time=0.068..0.070 rows=44 loops=1)
   Sort Key: ts
   ->  Bitmap Heap Scan on telemetry  (cost=4.70..215.78 rows=54 width=23) (actual time=0.026..0.059 rows=44 loops=1)
         Recheck Cond: ((sat_id = 42) AND (status = 'ANOMALY'::text))
         Heap Blocks: exact=44
         ->  Bitmap Index Scan on telemetry_anomaly  (cost=0.00..4.69 rows=54 width=0) (actual time=0.015..0.016 rows=44 loops=1)
               Index Cond: (sat_id = 42)
               Buffers: shared read=3
 Execution Time: 0.087 ms
```

(abbreviated.) Forty-four anomalies for SAT-042, found in under a tenth of a millisecond. Notice the `Index Cond` is only `sat_id = 42`: the status test is built into the index, since every entry in it is an anomaly. "All anomalies across the fleet on 5 March" used the same index too — 591 rows in 0.69 ms.

The planner uses a partial index only when it can prove the query's `WHERE` implies the index's `WHERE`. `status = 'ANOMALY' AND sat_id = 42` implies `status = 'ANOMALY'`: yes. `status IN ('ANOMALY', 'WARN')` does not — it also wants WARN rows the index does not have — so that query fell back to the full `(sat_id, ts)` index plus a filter. Write the condition in the query the same way as in the index; the planner's proof is careful but not clever.

::: key Partial indexes
`CREATE INDEX ... WHERE condition` indexes only the rows that satisfy the condition. It is small and cheap to maintain, and the planner uses it only for queries whose WHERE clause implies that condition. Typical uses: the rare value of a low-cardinality column (`status = 'ANOMALY'`), a work queue (`WHERE NOT processed`), recent or flagged rows.
:::

A partial index can also be **unique**. `CREATE UNIQUE INDEX ... ON pass_schedule (sat_id) WHERE state = 'ACTIVE'` says each satellite may have many past passes but only one active one — a rule no plain UNIQUE constraint from lesson 03 can express.

## What every index costs on the way in

Now the other side. When a row is inserted, the database writes it into a heap page. Then, for **every** index on the table, it must descend that index's tree, find the right leaf page, and insert an entry there. If the leaf is full, it has to be split into two pages, with the parent updated to point at both — a **[[page split|page-split]]**. And every one of those page changes is recorded first in the **WAL**, the write-ahead log that makes a committed transaction survive a crash (the "D" in lesson 04's ACID). One row, one heap write; five indexes, five more trips down a tree, five more WAL records.

To measure it, 1,152,000 rows (two days of the table, in time order) were copied into an empty table with the same columns, with `INSERT INTO ingest SELECT * FROM staging`, under four different sets of indexes. Each load was run twice, emptying the table and running a `CHECKPOINT` in between:

| Indexes on the target table | Load time, run 1 | Load time, run 2 |
| --- | --- | --- |
| none | 0.79 s | 0.62 s |
| BRIN on `ts` | 0.90 s | 0.86 s |
| PRIMARY KEY `(sat_id, ts, channel)` | 2.42 s | 2.26 s |
| that key plus `(channel, ts)`, `(status)`, `(ts)` | 7.48 s | 8.18 s |

The primary key alone [[roughly tripled|insert-cost-picture]] the load time. Four B-trees made it about ten times slower. A BRIN index cost almost nothing: it only has to widen one block range's min and max now and then, and for time-ordered data the newest range is the only one that ever changes.

::: example What four indexes do to an ingest budget
**Question.** Using the averages of the two runs, how many rows per second can this machine ingest with no indexes, and with the key plus three indexes? What fraction of the ingest capacity did the indexes take?

**Step 1: no indexes.** Average time $(0.79 + 0.62)/2 \approx 0.70\,\mathrm{s}$. Rate $1\,152\,000 / 0.70 \approx 1.6$ million rows per second.

**Step 2: four indexes.** Average $(7.48 + 8.18)/2 = 7.83\,\mathrm{s}$. Rate $1\,152\,000 / 7.83 \approx 147\,000$ rows per second.

**Step 3: the fraction.** $147\,000 / 1\,640\,000 \approx 0.09$. The indexes cost about 91 percent of ingest capacity.

**Sanity check.** A satellite ground segment that must absorb a burst of stored telemetry after a long pass — minutes of data arriving in seconds — cares about exactly this number. With these four indexes, this machine could absorb one-eleventh of the burst it could absorb bare. (Timings vary by machine and run; the ratio is what carries over.)
:::

::: key Why does adding an index slow ingest by 40 percent?
Every insert must also maintain each index, which costs a page write, possible page splits and extra WAL. On a write-heavy telemetry path, indexes are paid for on every row and read back only sometimes.
:::

So when ingest slows after an index is added, the question is not "how do I make inserts faster?" It is "is the query this index serves worth what it costs on every row?" Often the answer is to keep the query fast some cheaper way: a partial index that only rare rows enter, a BRIN index instead of a B-tree on the time column, or a query that runs against a summary table instead of the raw one (lesson 10).

::: warning Indexes built one row at a time end up bloated
After the four-index load, the primary-key index on `(sat_id, ts, channel)` was **80 MB**. Rebuilt from scratch on the same rows, it was **45 MB**. Rows arrived in time order, but the key starts with `sat_id`, so each minute's rows were inserted at 100 different places across the index. Pages kept filling and splitting, leaving many half full. A time-first index, like `(ts)`, grows only at its right-hand end and stays compact (7.7 MB both ways).
:::

## HOT updates: when an update can skip the indexes

Telemetry is mostly inserted, but some rows are updated: a quality flag corrected, a calibration applied. An update writes a new row version (lesson 06), and normally every index gets a new entry pointing at it.

PostgreSQL has a shortcut. If the update changes **no indexed column**, and the new version fits on the **same heap page** as the old one, it becomes a **HOT update** (Heap-Only Tuple). The indexes are not touched at all; the old version on the page points on to the new one, and index lookups follow that [[little chain|hot-chain]].

To see it, a 24,000-row table was made with `fillfactor = 90` — which leaves 10 percent of every page empty, room for new versions — and indexes on `(sat_id, ts)` and `status`. Then two updates, reading the counters in `pg_stat_user_tables` after each:

```sql
UPDATE hot_demo SET value = value + 0.001
WHERE sat_id <= 10 AND channel = 'BATT_T';              -- value is not indexed
--  n_tup_upd | n_tup_hot_upd
--        600 |           600

UPDATE hot_demo SET status = 'WARN'
WHERE sat_id > 90 AND channel = 'BATT_T' AND status = 'NOMINAL';   -- status is indexed
--  n_tup_upd | n_tup_hot_upd
--       1178 |           600
```

All 600 value updates were HOT. None of the 578 status updates were: `status` has an index, so its index needed a new entry. Remember that `INCLUDE` columns count as indexed: the covering index in lesson 06 made every update of `value` a non-HOT one.

::: key HOT updates
An update that changes no indexed column, and whose new version fits on the same page, is a HOT (heap-only tuple) update: no index is touched. Fewer indexed columns and a fillfactor below 100 on update-heavy tables make more updates HOT.
:::

## Bulk loads: drop, load, rebuild

Building a B-tree all at once is much cheaper than growing it one entry at a time: the database sorts all the values once and writes full, tidy pages. So when you load a big batch into a table nobody is querying — a backfill of last year's archive, a rebuilt reporting table — the standard recipe is:

1. drop the indexes (and primary key);
2. load the data;
3. recreate the indexes and key.

Measured on the same 1,152,000 rows and the same four indexes: loading with the indexes in place took 6.36 s. Dropping them, loading in 0.66 s and rebuilding the key and three indexes in 2.43 s took **3.09 s** in all — half the time — and left the key index at 45 MB instead of 80 MB.

::: warning Dropping a key also drops its protection
While the primary key is gone, nothing stops duplicates. The re-added key will then fail, after the whole load. Deduplicate the batch before loading, or load into a staging table and insert with a duplicate-aware statement (lesson 12's upserts). And never drop indexes on a table that live queries depend on; for those, `CREATE INDEX CONCURRENTLY` builds a new index [[without blocking writes|concurrently-word]].
:::

In SQLite, the same logic holds: every `CREATE INDEX` is a B-tree that each `INSERT` must update, and bulk loads run faster inside a single transaction with indexes created afterwards. SQLite also supports partial indexes with the same `CREATE INDEX ... WHERE` syntax.

## Check yourself

::: check
A table of 20 million downlink frames has `crc_ok BOOLEAN`, true for 99.8 percent of frames. Engineers often ask for the bad frames. What index do you build, and why not a plain index on `crc_ok`?
:::

::: answer
A partial index on only the rare rows, for example `CREATE INDEX frames_bad ON frames (sat_id, received_at) WHERE NOT crc_ok`. It holds about $0.002 \times 20\,000\,000 = 40\,000$ entries, is tiny, and every insert of a good frame skips it. A plain index on `crc_ok` would hold all 20 million entries, would never be used for `crc_ok = true` (that matches nearly every page), and would slow every insert. Queries must say `WHERE NOT crc_ok` (or `crc_ok = false`) so the planner can match them to the index.
:::

::: check
In a table with 100 rows per page, a value makes up 1 percent of the rows, scattered at random. About what fraction of pages hold at least one such row? Would an index on it save much reading?
:::

::: answer
The chance a page has none is $0.99^{100} \approx 0.366$, so about $1 - 0.366 = 0.634$ — nearly two pages in three — hold at least one. An index would skip only about a third of the table, while adding random jumps between pages and its own index pages. It is borderline; the planner will decide from statistics and costs. At 0.1 percent, $1 - 0.999^{100} \approx 0.095$, under a tenth of the pages, and the index pays.
:::

::: check
Ingest throughput fell by 40 percent after a colleague added a B-tree on `(channel, ts)` to the raw telemetry table, so that a weekly report could find one channel's data. List three responses better than "drop all the indexes".
:::

::: answer
First, weigh it: the index costs something on every one of millions of inserts per hour, and serves one query a week. Then options: (1) serve the report from a precomputed summary table or materialised view instead of the raw table; (2) if the report scans wide time ranges, a BRIN index on `ts` costs almost nothing to maintain and still narrows the scan; (3) if the report only needs rare rows (say, flagged samples), a partial index with that condition is small and skipped by most inserts. Or accept a slow weekly report run at a quiet hour.
:::

::: check
Why was the value update HOT but the status update not, on the same table with the same free space?
:::

::: answer
A HOT update needs two things: the new version fits on the same page (the 10 percent fillfactor space made sure of that), and no indexed column changes. `value` is not in any index, so no index needed a new entry and the update stayed inside the heap page. `status` has its own index, so the new version had a different indexed value and every index needed a new entry pointing at it. Non-HOT.
:::

::: check
A nightly job reloads a 50-million-row reporting table from scratch. It currently truncates the table and inserts into it with four indexes in place. What would you change, and what must you watch for?
:::

::: answer
Drop the indexes (and primary key) after the truncate, load, then recreate them: building each B-tree once from sorted data is much cheaper than 50 million single inserts, and the result is compact (in this lesson's test, half the time and a 45 MB key instead of 80 MB). Watch for duplicates, since nothing enforces the key during the load, and make sure no one queries the table mid-reload (or load into a new table and swap it in with a rename inside a transaction).
:::

## Summary

| Idea | Rule or fact |
| --- | --- |
| Selectivity | Fraction of rows a condition keeps |
| Low cardinality | Few distinct values; common values are unselective |
| Pages, not rows | 3 % of rows (WARN) sat on 97 % of pages; 0.1 % (ANOMALY) on 11 % |
| Partial index | `CREATE INDEX ... WHERE cond`; 176 kB versus 34 MB here; used when the query implies `cond` |
| Write cost | Each index = another tree descent, page write, possible split, WAL, per row |
| Measured | 1.15 M rows: 0.70 s bare, 0.88 s with BRIN, 2.3 s with the key, 7.8 s with four B-trees |
| HOT update | No indexed column changed and room on the page: indexes untouched |
| Bulk load | Drop, load, rebuild: 3.09 s versus 6.36 s, and smaller indexes |

You now know what the planner can choose from. The next lesson reads its choices: every line of an EXPLAIN plan, the three ways to join, and the telltale sign that the planner is working from out-of-date statistics.

::: context ctid-word A row's street address
Every row in a PostgreSQL heap has a `ctid`: a pair like `(19200,37)`, meaning page 19,200, slot 37. Indexes store exactly this pair as their pointer to the row. It is not a permanent id — an update gives the new version a new ctid, and `VACUUM FULL` or `CLUSTER` renumbers everything — so never use it as a key. It is handy for experiments like counting which pages hold which rows.
:::

::: context scatter-picture Rare rows, nearly every page
Each row of boxes is a heap page, drawn with 20 slots instead of 120. Red slots are the rare rows, here 5 in 100. Even so, most pages have at least one, so an index on WARN still sends the database to most pages.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="31">page 1</text><text x="44" y="55">page 2</text><text x="44" y="79">page 3</text><text x="44" y="103">page 4</text><text x="44" y="127">page 5</text>
  </g>
  <g fill="#8fb8f0" stroke="#ffffff">
    <rect x="52" y="20" width="240" height="16"/><rect x="52" y="44" width="240" height="16"/><rect x="52" y="68" width="240" height="16"/><rect x="52" y="92" width="240" height="16"/><rect x="52" y="116" width="240" height="16"/>
  </g>
  <g fill="#b4232c">
    <rect x="112" y="20" width="12" height="16"/><rect x="232" y="20" width="12" height="16"/>
    <rect x="184" y="44" width="12" height="16"/>
    <rect x="76" y="92" width="12" height="16"/>
    <rect x="256" y="116" width="12" height="16"/>
  </g>
  <g font-size="11" text-anchor="start">
    <text x="300" y="31" fill="#1f2a44">read</text><text x="300" y="55" fill="#1f2a44">read</text><text x="300" y="79" fill="#6c7a93">skip</text>
    <text x="300" y="103" fill="#1f2a44">read</text><text x="300" y="127" fill="#1f2a44">read</text>
  </g>
  <text x="172" y="146" font-size="11" fill="#1f2a44" text-anchor="middle">5 WARN rows out of 100; 4 pages of 5 must be read</text>
</svg>
```

With 120 slots per page, as in the real table, the chance a page escapes is $0.97^{120}$, about 2.6 percent.
:::

::: context page-split What happens in a page split
A B-tree leaf page is full and a new entry belongs in the middle of it. PostgreSQL allocates a new page, moves about half the entries into it, links it into the chain of leaves, and adds a signpost for it in the parent page — which might itself be full and split, all the way to the root. The two halves are each about half full. If later entries keep landing in the middle of the index, as they do when the first column is `sat_id` and time only increases within it, many pages stay half empty. If entries always go at the right-hand end, as with a time-first key, PostgreSQL splits so that the left page stays mostly full.
:::

::: context insert-cost-picture Load time by index set
Bars show the average of the two measured runs for loading 1,152,000 rows. The four-B-tree bar is more than ten times the bare one; the BRIN bar is barely longer than bare.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="104" y="32">no indexes</text><text x="104" y="60">BRIN on ts</text><text x="104" y="88">primary key</text><text x="104" y="116">key + 3 B-trees</text>
  </g>
  <g>
    <rect x="110" y="20" width="20" height="18" fill="#8fb8f0"/>
    <rect x="110" y="48" width="25" height="18" fill="#8fb8f0"/>
    <rect x="110" y="76" width="67" height="18" fill="#1d6fd1"/>
    <rect x="110" y="104" width="224" height="18" fill="#b4232c"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="start">
    <text x="136" y="33">0.70 s</text><text x="141" y="61">0.88 s</text><text x="183" y="89">2.34 s</text><text x="252" y="140">7.83 s</text>
  </g>
  <line x1="110" y1="14" x2="110" y2="126" stroke="#6c7a93"/>
</svg>
```

The bars are drawn at about 28.6 pixels per second.
:::

::: context hot-chain How a HOT chain works
With a HOT update the index keeps pointing at the old slot on the page. That slot now says "moved: see slot 41 on this page", and slot 41 holds the new version. A lookup arrives through the index, follows the short chain within the page, and finds the current row. Because the whole chain stays on one page, the extra step costs almost nothing, and later cleanup can reclaim the dead versions in between without touching any index.
:::

::: context concurrently-word Building an index without stopping the world
A plain `CREATE INDEX` blocks inserts, updates and deletes on the table until it finishes, which on a large live telemetry table could mean minutes of lost ingest. `CREATE INDEX CONCURRENTLY` scans the table twice and waits for running transactions, so it takes longer, but writes continue throughout. If it fails partway, it leaves an invalid index behind that you must drop and try again. On a live flight-data system, concurrently is the default habit.
:::
