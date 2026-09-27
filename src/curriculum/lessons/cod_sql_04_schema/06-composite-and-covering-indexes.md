---
id: l06-composite-and-covering-indexes
title: Composite and covering indexes
minutes: 20
covers:
  - Composite indexes and the left-prefix rule; covering indexes and index-only scans
---

A school directory lists students sorted by last name, and within each last name by first name. Finding "Nguyen, Linh" takes seconds. Finding every Nguyen is as easy: they sit together on one page. But finding every student whose *first* name is Linh is hopeless. The Linhs are scattered through the whole book, one under Adams, one under Nguyen, one under Zhou. The directory is sorted by first name only *inside* each last name.

A database index can be sorted by several columns in the same way. That is a **composite index** (also called a multicolumn index): a B-tree whose entries are sorted by the first column, then by the second within ties of the first, and so on. Telemetry queries almost always name a satellite and a time window together, so the composite index on `(sat_id, ts)` is probably the most important index in flight-data work. It is also the one most often built in the wrong order.

This lesson uses the five-million-row `telemetry` table from the last lesson. It shows which queries a composite index can serve, why the order of its columns decides that, and how an index can hold enough columns to answer a query without touching the table at all.

## One index, sorted by two columns

Here is the index. The single-column indexes from lesson 05 have been dropped, so this is the only one:

```sql
CREATE INDEX telemetry_sat_ts ON telemetry (sat_id, ts);
-- CREATE INDEX   Time: 1989.372 ms
-- size: 72 MB, 9,240 pages, three levels
```

Picture its leaf pages laid end to end. First come all of satellite 1's entries, in time order from 1 March to 9 March. Then all of satellite 2's, in time order. Then satellite 3, and so on up to 100. The **[[picture of the leaves|composite-picture]]** shows it. Each satellite owns one unbroken stretch of the index, and inside that stretch, time runs in order.

That layout decides everything. A question the index can answer is one whose rows form **one unbroken stretch** of those leaves. The database then descends the tree to the start of the stretch — a **seek** — and walks along the leaves to its end — a **range scan**.

## The left-prefix rule, tested three ways

Take three predicates. Each is run with `EXPLAIN (ANALYZE, BUFFERS)`; plans are abbreviated (planning lines cut).

**A: satellite and time range.**

```sql
SELECT ts, channel, value FROM telemetry
WHERE sat_id = 42 AND ts >= '2026-03-05 12:00+00' AND ts < '2026-03-05 13:00+00';
```

```text
 Bitmap Heap Scan on telemetry  (cost=7.25..847.70 rows=221 width=23) (actual time=0.042..0.349 rows=240 loops=1)
   Recheck Cond: ((sat_id = 42) AND (ts >= '2026-03-05 12:00:00+00'::timestamp with time zone) AND (ts < '2026-03-05 13:00:00+00'::timestamp with time zone))
   Heap Blocks: exact=60
   Buffers: shared read=63
   ->  Bitmap Index Scan on telemetry_sat_ts  (cost=0.00..7.20 rows=221 width=0) (actual time=0.027..0.027 rows=240 loops=1)
         Index Cond: ((sat_id = 42) AND (ts >= '2026-03-05 12:00:00+00'::timestamp with time zone) AND (ts < '2026-03-05 13:00:00+00'::timestamp with time zone))
         Buffers: shared read=3
 Execution Time: 0.371 ms
```

The index part read **3 pages**. Both conditions are in the `Index Cond`: the seek went straight to "satellite 42, 12:00", and the scan walked forward to "satellite 42, 13:00". Satellite 42's hour is one small, unbroken stretch.

**B: satellite only.**

```sql
SELECT ts, channel, value FROM telemetry WHERE sat_id = 42;
```

```text
 Bitmap Heap Scan on telemetry  (cost=799.58..46946.81 rows=53568 width=23) (actual time=3.802..63.887 rows=51840 loops=1)
   Recheck Cond: (sat_id = 42)
   Heap Blocks: exact=12960
   ->  Bitmap Index Scan on telemetry_sat_ts  (cost=0.00..786.19 rows=53568 width=0) (actual time=1.964..1.965 rows=51840 loops=1)
         Index Cond: (sat_id = 42)
         Buffers: shared hit=3 read=92
```

Still one unbroken stretch — all of satellite 42 — so the index serves it: 95 index pages for 51,840 entries. (The 12,960 heap pages are another matter: satellite 42's rows are sprinkled through the time-ordered table, one page per minute. That cost is about where rows live, not about the index.)

**C: time range only.**

```sql
SELECT ts, channel, value FROM telemetry
WHERE ts >= '2026-03-05 12:00+00' AND ts < '2026-03-05 13:00+00';
```

```text
 Seq Scan on telemetry  (cost=0.00..120960.00 rows=21360 width=23) (actual time=126.125..255.450 rows=24000 loops=1)
   Filter: ((ts >= '2026-03-05 12:00:00+00'::timestamp with time zone) AND (ts < '2026-03-05 13:00:00+00'::timestamp with time zone))
   Rows Removed by Filter: 5160000
   Buffers: shared hit=5813 read=37387
 Execution Time: 256.339 ms
```

The index is ignored. The rows for 12:00 to 13:00 are not one stretch; they are a hundred little stretches, one inside each satellite's section. There is [[no single place to seek to|skip-scan]]. This is the Linh problem from the directory.

That gives the rule. Name the index's columns from the left: `sat_id` is its first column, `(sat_id, ts)` its first two. A **left prefix** is any run of columns starting from the first. The index can seek only when the query constrains a left prefix.

::: key The left-prefix rule
A composite index on (a, b) can serve predicates on a, and on a plus b, but not on b alone, because the index is sorted by a first. Order the columns by how they are queried, with equality columns before range columns.
:::

### "Cannot seek" is not quite "cannot use"

One twist. Ask C's question, but only count the rows:

```sql
SELECT count(*) FROM telemetry
WHERE ts >= '2026-03-05 12:00+00' AND ts < '2026-03-05 13:00+00';
```

```text
 Aggregate  (cost=89067.43..89067.44 rows=1 width=8) (actual time=47.089..47.090 rows=1 loops=1)
   ->  Index Only Scan using telemetry_sat_ts on telemetry  (cost=0.43..89014.03 rows=21360 width=0) (actual time=0.280..45.917 rows=24000 loops=1)
         Index Cond: ((ts >= '2026-03-05 12:00:00+00'::timestamp with time zone) AND (ts < '2026-03-05 13:00:00+00'::timestamp with time zone))
         Heap Fetches: 0
         Buffers: shared hit=1 read=9194 written=2727
```

(abbreviated.) The index *was* used — but look at the buffers: 9,195 pages, very nearly all 9,240 pages of the index. This is not a seek. The database read the **whole index** from end to end, testing `ts` in every entry, because the index (72 MB) is much smaller than the table (338 MB) and holds every column this query needs. That kind of plan is called an **index-only scan**, and the second half of this lesson is about it. It was five times faster than the table scan, but it is still reading everything; it only reads a thinner copy.

::: key Given INDEX(sat_id, ts), which predicates use it: ts > x, sat_id = 5, sat_id = 5 AND ts > x?
sat_id = 5 uses it; sat_id = 5 AND ts > x uses it best, as an equality seek followed by a range scan; ts > x alone cannot use it as a seek, though an index-only scan may still be chosen for a narrow query.
:::

::: example Which predicates can INDEX(sat_id, channel, ts) seek on?
**Question.** An index is built on `(sat_id, channel, ts)`. For each predicate, say whether the index can seek, and on which columns.

1. `sat_id = 7 AND channel = 'BATT_T' AND ts >= x AND ts < y`
2. `sat_id = 7 AND ts >= x AND ts < y`
3. `channel = 'BATT_T' AND ts >= x`
4. `sat_id = 7 AND channel = 'BATT_T'`

**Step 1: find the left prefix each one constrains.**

1. `sat_id`, `channel`, `ts` — all three, in order. Full seek: equality on the first two, then a range on the third. One unbroken stretch.
2. `sat_id` yes, `channel` no. The prefix stops at `sat_id`: the index seeks to satellite 7 and scans all of its entries, every channel, checking `ts` on each entry as it passes. Useful, but the `ts` condition does not narrow the stretch.
3. `sat_id` has no condition, so the left prefix is empty. No seek; at most a full index scan.
4. `sat_id`, `channel`: a left prefix of two. Seek to (7, BATT_T) and scan that satellite-channel's whole time history.

**Step 2: sanity check with the picture.** In the leaves, entries run satellite by satellite, and inside each satellite channel by channel, and inside each channel by time. Queries 1 and 4 pick one unbroken piece. Query 2 picks four pieces (one per channel) inside satellite 7's stretch, so it reads the whole stretch. Query 3's rows are spread across all 100 satellites. The answers agree.
:::

## Equality first, then range

Order matters even when a query names both columns. Put the columns the other way round, `(ts, sat_id)`, and ask for one satellite's whole day:

```sql
SELECT ts, channel, value FROM telemetry
WHERE sat_id = 42 AND ts >= '2026-03-05 00:00+00' AND ts < '2026-03-06 00:00+00';
```

With `(ts, sat_id)`:

```text
 Index Scan using telemetry_ts_sat on telemetry  (cost=0.43..20643.70 rows=5583 width=23) (actual time=0.036..14.638 rows=5760 loops=1)
   Index Cond: ((ts >= '2026-03-05 00:00:00+00'::timestamp with time zone) AND (ts < '2026-03-06 00:00:00+00'::timestamp with time zone) AND (sat_id = 42))
   Buffers: shared hit=104 read=2360
 Execution Time: 14.908 ms
```

With `(sat_id, ts)`:

```text
 Bitmap Heap Scan on telemetry  (cost=108.85..15230.30 rows=5366 width=23) (actual time=0.350..1.948 rows=5760 loops=1)
   Heap Blocks: exact=1440
   Buffers: shared hit=1440 read=13
   ->  Bitmap Index Scan on telemetry_sat_ts  (cost=0.00..107.51 rows=5366 width=0) (actual time=0.203..0.204 rows=5760 loops=1)
         Buffers: shared read=13
 Execution Time: 2.166 ms
```

(both abbreviated.) Both return the same 5,760 rows, and both must visit the same 1,440 heap pages. The difference is in the index itself. With `(sat_id, ts)`, 13 index pages. With `(ts, sat_id)`, about a thousand: $104 + 2360 - 1440 = 1024$.

Here is why. With `ts` first, the stretch for "5 March" holds every satellite's entries for that day, 576,000 of them, interleaved: 12:00 SAT-1, 12:00 SAT-2, … The `sat_id = 42` condition cannot shrink the stretch, because inside it `sat_id` is not in order across the whole day; it only sorts ties of the *same* `ts`. So the scan walks all 576,000 entries and keeps 5,760 of them. With `sat_id` first, the equality picks one satellite, and inside it the range is one tight stretch of 5,760 entries.

The rule: put columns tested with **equality** (`=`, or `IN` with a short list) first, and the one tested with a **range** (`<`, `>`, `BETWEEN`) after them. Once the index hits a range column, the columns after it can only filter, not narrow.

::: example How much of the index does each order read?
**Question.** Using the plans above, estimate how many index entries each order walks for "SAT-042, all of 5 March", and compare with the pages read.

**Step 1: rows in the answer.** One satellite, 4 channels, 1,440 minutes: $4 \times 1440 = 5760$ entries. Both plans say `rows=5760`.

**Step 2: entries walked with (sat_id, ts).** Exactly the answer: 5,760. The index holds 5,184,000 entries in 9,240 pages, about 561 entries per page, so $5760 / 561 \approx 10$ leaf pages, plus the descent from the root. The plan read 13. That fits.

**Step 3: entries walked with (ts, sat_id).** All of 5 March for all satellites: $100 \times 4 \times 1440 = 576\,000$ entries. At a similar density, $576\,000 / 561 \approx 1027$ pages. The plan read 1,024 index pages. That fits too.

**Sanity check.** The ratio of entries walked is $576\,000 / 5760 = 100$, the number of satellites, and the ratio of index pages is $1024 / 13 \approx 79$. Same size of difference: a range column first makes the index read every satellite's data to find one satellite's.
:::

::: warning The right order depends on the query, not on the table
"Time first, because it is a time series" sounds sensible and is usually wrong. The console query names one satellite and a time window, so `(sat_id, ts)` wins. A fleet-wide query ("every satellite, the last five minutes") names only a time window, and wants `ts` first — or a BRIN index on `ts`. Write down the queries that matter before you choose. If both patterns matter, you may need two indexes; lesson 07 counts what each one costs.
:::

## Covering indexes and index-only scans

An ordinary index scan does two things per row: find the entry in the index, then go to the heap to fetch the row's other columns. Those heap visits are usually most of the work — 1,440 of the 1,453 pages in the last plan.

If the index itself already holds every column the query mentions, the heap visit can be skipped. Such an index **covers** the query, and the plan is an **Index Only Scan**. You saw one in the count query above.

PostgreSQL lets you add columns to an index purely so it can cover, with `INCLUDE`. Included columns ride along in the leaf entries but are not part of the sort order, so they cannot be searched on:

```sql
CREATE INDEX telemetry_sat_chan_ts_incl
    ON telemetry (sat_id, channel, ts) INCLUDE (value);
VACUUM ANALYZE telemetry;
```

Now the battery-temperature trace for one satellite and one day:

```sql
SELECT ts, value FROM telemetry
WHERE sat_id = 42 AND channel = 'BATT_T'
  AND ts >= '2026-03-05 00:00+00' AND ts < '2026-03-06 00:00+00';
```

```text
 Index Only Scan using telemetry_sat_chan_ts_incl on telemetry  (cost=0.56..78.76 rows=1528 width=16) (actual time=0.034..0.228 rows=1440 loops=1)
   Index Cond: ((sat_id = 42) AND (channel = 'BATT_T'::text) AND (ts >= '2026-03-05 00:00:00+00'::timestamp with time zone) AND (ts < '2026-03-06 00:00:00+00'::timestamp with time zone))
   Heap Fetches: 0
   Buffers: shared hit=1 read=13
 Execution Time: 0.286 ms
```

(abbreviated.) Fourteen pages, 0.29 ms. With only `(sat_id, ts)` the same query read 1,453 pages and had to throw away the other three channels' rows (`Rows Removed by Filter: 4320`). Add `status` to the `SELECT` list, though, and the index no longer covers: the plan goes back to a Bitmap Heap Scan of 1,453 pages. Covering is all or nothing.

::: warning Covering indexes are big
This index is 246 MB, about three quarters the size of the table, because it copies `sat_id`, `channel`, `ts` and `value` for every row. (Included columns also switch off the B-tree's deduplication.) Cover the one or two queries that run constantly, like a console's live trace, not everything.
:::

## Why an index-only scan sometimes visits the table anyway

Look again at `Heap Fetches: 0` in that plan. It is not always zero, and the reason is how PostgreSQL handles changes.

When a row is updated, PostgreSQL does not overwrite it. It writes a **new version** of the row and marks the old one as dead once no running transaction can still see it. That is how two transactions can read and write at once without blocking each other (lesson 04's isolation, done by **[[keeping old versions|mvcc]]**). The index points at *both* versions, and the index alone cannot tell which one your transaction is allowed to see. Only the heap row knows.

So PostgreSQL keeps a **visibility map**: two bits per heap page, one of which means "every row on this page is visible to everyone". An index-only scan checks that bit for each entry's page. Bit set: trust the index. Bit clear: go and look at the heap row — a **heap fetch**. The **[[visibility map picture|vm-picture]]** shows the check. The bit is set by **[[VACUUM|vacuum-word]]**, which also clears away dead row versions, and any change to a page clears it again.

Watch it happen. Update the day's 1,440 battery-temperature rows (with autovacuum switched off on the table so it cannot tidy up behind our backs), and run the same query:

```sql
UPDATE telemetry SET value = value + 0.001
WHERE sat_id = 42 AND channel = 'BATT_T'
  AND ts >= '2026-03-05 00:00+00' AND ts < '2026-03-06 00:00+00';
-- UPDATE 1440
```

```text
 Index Only Scan using telemetry_sat_chan_ts_incl on telemetry  (cost=0.56..82.76 rows=1528 width=16) (actual time=0.032..4.794 rows=1440 loops=1)
   Heap Fetches: 2880
   Buffers: shared hit=5789
 Execution Time: 4.860 ms
```

(abbreviated.) Still called an "Index Only Scan", but it made 2,880 heap fetches: 1,440 old versions and 1,440 new ones, each of whose pages had been touched. 5,789 pages instead of 14. Then:

```sql
VACUUM telemetry;
```

```text
 Index Only Scan using telemetry_sat_chan_ts_incl on telemetry  (cost=0.56..78.76 rows=1528 width=16) (actual time=0.021..0.223 rows=1440 loops=1)
   Heap Fetches: 0
   Buffers: shared hit=30
 Execution Time: 0.304 ms
```

(abbreviated.) VACUUM removed the dead versions from table and index and set the all-visible bits again. Heap fetches back to zero.

::: key Index-only scans and the visibility map
An index-only scan answers from the index alone when the index holds every column the query uses (add extra columns with `INCLUDE`). It must still visit the heap for any row on a page not marked all-visible in the visibility map. VACUUM sets those bits; recent inserts and updates clear them. Watch `Heap Fetches` in EXPLAIN ANALYZE.
:::

For append-only telemetry this works out well: old pages never change, so once VACUUM (or autovacuum) has passed over them they stay all-visible, and index-only scans over past days are genuinely index-only.

## The same ideas in SQLite

The app's exercises run on SQLite, whose indexes are B-trees and follow the same left-prefix rule. Its version of EXPLAIN is `EXPLAIN QUERY PLAN`, which prints one line per step. With `CREATE INDEX idx_packet_sat_ts ON packet (sat_id, ts)`, here is what SQLite 3.45 prints for four queries:

```sql
EXPLAIN QUERY PLAN SELECT ts, value FROM packet
WHERE sat_id = 'SAT-042' AND ts >= '2026-03-05T00:00:00Z' AND ts < '2026-03-06T00:00:00Z';
-- SEARCH packet USING INDEX idx_packet_sat_ts (sat_id=? AND ts>? AND ts<?)

EXPLAIN QUERY PLAN SELECT ts, value FROM packet WHERE sat_id = 'SAT-042';
-- SEARCH packet USING INDEX idx_packet_sat_ts (sat_id=?)

EXPLAIN QUERY PLAN SELECT ts, value FROM packet
WHERE ts >= '2026-03-05T00:00:00Z' AND ts < '2026-03-06T00:00:00Z';
-- SCAN packet

EXPLAIN QUERY PLAN SELECT sat_id, ts FROM packet
WHERE ts >= '2026-03-05T00:00:00Z' AND ts < '2026-03-06T00:00:00Z';
-- SCAN packet USING COVERING INDEX idx_packet_sat_ts
```

**SEARCH** means a seek; **SCAN** means reading everything. The last line is the same twist as PostgreSQL's full index-only scan: no seek, but the index covers the query, so SQLite reads the thinner index instead of the table. SQLite has no `INCLUDE`; to cover, add the extra columns at the end of the index key. In SQLite, timestamps are [[ISO-8601 text, which sorts in time order|iso-text]], so a range on text works exactly like a range on `TIMESTAMPTZ`.

## Check yourself

::: check
A table has `INDEX (channel, ts)`. Which of these can seek on it: (a) `channel = 'GYRO_X' AND ts > x`, (b) `ts > x`, (c) `channel IN ('GYRO_X', 'GYRO_Y')`, (d) `sat_id = 3 AND channel = 'GYRO_X'`?
:::

::: answer
(a) Yes, fully: equality on the first column, range on the second. (b) No: `ts` is not a left prefix, so its rows are split among every channel's stretch; at best a full index scan. (c) Yes: `IN` with a short list is a few equalities, so the database seeks once per channel. (d) Yes, on `channel` only: the index knows nothing about `sat_id`, so it seeks to GYRO_X and filters `sat_id = 3` from the rows it finds.
:::

::: check
Your console runs `WHERE sat_id = ? AND ts >= ? AND ts < ?` thousands of times an hour. A colleague proposes `INDEX (ts, sat_id)` "because time is the most important column". What do you say, with a number from this lesson?
:::

::: answer
Put the equality column first: `INDEX (sat_id, ts)`. With `ts` first, the time range is one stretch holding every satellite's entries, and the `sat_id` test can only filter inside it. For one satellite's day in our table that meant walking 576,000 entries (about 1,024 index pages) to keep 5,760; with `sat_id` first it read 13 index pages. A fleet-wide time query would want `ts` first, so check which query really dominates.
:::

::: check
A query `SELECT ts, value FROM telemetry WHERE sat_id = 7 AND channel = 'BATT_V' AND ts >= x AND ts < y` shows `Index Only Scan ... Heap Fetches: 1440`. What does that mean and what would you do?
:::

::: answer
The index covers the query, but for 1,440 entries the pages were not marked all-visible in the visibility map, so PostgreSQL had to check each row in the heap to see whether this transaction may see it. That happens after recent inserts or updates, before VACUUM has run. Run `VACUUM` on the table (or check that autovacuum is keeping up, for example in `pg_stat_user_tables.last_autovacuum`); the next run should show `Heap Fetches: 0`.
:::

::: check
Why can't `INCLUDE (value)` columns be used to search, while key columns can?
:::

::: answer
The index is sorted only by its key columns. An included column is carried along in each leaf entry but plays no part in the order, so the entries for `value = 28.4` are scattered through the whole index and there is no stretch to seek to. It can still be read back (that is its purpose, covering the query), and it can be tested row by row as a filter while scanning, but it cannot narrow a search.
:::

::: check
In SQLite, `EXPLAIN QUERY PLAN` shows `SCAN packet USING COVERING INDEX idx_packet_sat_ts` for a query filtering only on `ts`. Is the query using the index well?
:::

::: answer
It is using the index, but not to seek: SCAN means every entry is read. SQLite chose the index because it holds both columns the query needs (`sat_id`, `ts`) and is smaller than the table. It is better than scanning the table, but the work still grows with the whole table. If time-only queries matter, give them an index that starts with `ts`.
:::

## Summary

| Idea | Rule or fact |
| --- | --- |
| Composite index | B-tree sorted by first column, then second within ties, and so on |
| Left prefix | Index can seek only if the query constrains its first column(s) |
| Column order | Equality columns first, then the range column |
| Measured | (sat_id, ts) read 13 index pages for one satellite-day; (ts, sat_id) read 1,024 |
| Covering index | Holds every column the query uses; `INCLUDE` adds non-key columns |
| Index-only scan | No heap visits — except for pages not all-visible |
| Visibility map | Per-page "all visible" bit, set by VACUUM, cleared by writes |
| SQLite | `EXPLAIN QUERY PLAN`: SEARCH is a seek, SCAN reads everything |

Every index you add makes some reads faster. The next lesson looks at the other side of the ledger: indexes on only some rows, indexes that never help, and what each index costs every time a new row arrives.

::: context composite-picture Leaves of an index on (sat_id, ts)
The leaves hold one stretch per satellite, and time is sorted only inside each stretch. A query for "satellite 2, from 12:00 to 12:02" is one short, contiguous run (blue). A query for "12:01, any satellite" is scattered, one entry in each satellite's stretch (red).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="20">sat 1</text><text x="180" y="20">sat 2</text><text x="300" y="20">sat 3</text>
  </g>
  <g stroke="#1f2a44" fill="#ffffff">
    <rect x="10" y="30" width="30" height="30"/><rect x="40" y="30" width="30" height="30"/><rect x="70" y="30" width="30" height="30"/><rect x="100" y="30" width="20" height="30"/>
    <rect x="130" y="30" width="30" height="30" fill="#8fb8f0"/><rect x="160" y="30" width="30" height="30" fill="#8fb8f0"/><rect x="190" y="30" width="30" height="30" fill="#8fb8f0"/><rect x="220" y="30" width="20" height="30"/>
    <rect x="250" y="30" width="30" height="30"/><rect x="280" y="30" width="30" height="30"/><rect x="310" y="30" width="30" height="30"/><rect x="340" y="30" width="15" height="30"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="25" y="50">12:00</text><text x="55" y="50">12:01</text><text x="85" y="50">12:02</text><text x="110" y="50">…</text>
    <text x="145" y="50">12:00</text><text x="175" y="50">12:01</text><text x="205" y="50">12:02</text><text x="230" y="50">…</text>
    <text x="265" y="50">12:00</text><text x="295" y="50">12:01</text><text x="325" y="50">12:02</text><text x="347" y="50">…</text>
  </g>
  <g stroke="#b4232c" stroke-width="2" fill="none">
    <rect x="42" y="66" width="26" height="6"/><rect x="162" y="66" width="26" height="6"/><rect x="282" y="66" width="26" height="6"/>
  </g>
  <text x="185" y="98" font-size="11" fill="#1d6fd1" text-anchor="middle">sat_id = 2 AND ts from 12:00 to 12:02: one run, a seek</text>
  <text x="185" y="118" font-size="11" fill="#b4232c" text-anchor="middle">ts = 12:01 alone: one entry per satellite, no seek</text>
  <text x="185" y="138" font-size="11" fill="#6c7a93" text-anchor="middle">(entries for the four channels at each minute are drawn as one box)</text>
</svg>
```
:::

::: context skip-scan Newer databases can sometimes skip
Some databases can use a composite index without its first column by "skipping": for each distinct value of the first column, seek into that value's stretch. SQLite has done this for a long time when statistics show the first column has few distinct values, and PostgreSQL added B-tree skip scan in version 18. It is a useful rescue when the first column has a handful of values, and hopeless when it has millions. It does not change the advice: order columns for the queries you actually run.
:::

::: context mvcc Many versions of a row
The technique is called multi-version concurrency control, MVCC for short. Every row version carries the id of the transaction that created it and, once it is replaced or deleted, the id of the one that ended it. A reading transaction compares those ids with its own snapshot to decide which version it sees. Readers never wait for writers, which is exactly what a telemetry system with constant ingest and constant dashboards needs. The price is dead versions that someone must clean up, and that someone is VACUUM.
:::

::: context vm-picture Checking the visibility map
For each index entry, the index-only scan looks up the entry's heap page in the visibility map. Pages 0 and 1 were last changed long ago and VACUUM marked them all-visible, so their entries are answered from the index. Page 2 was recently updated, so its bit is clear and the scan must fetch the rows from the heap.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="11" fill="#1f2a44">index entries</text>
  <g stroke="#1f2a44" fill="#8fb8f0">
    <rect x="10" y="26" width="60" height="22"/><rect x="80" y="26" width="60" height="22"/><rect x="150" y="26" width="60" height="22"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="41">page 0</text><text x="110" y="41">page 1</text><text x="180" y="41">page 2</text>
  </g>
  <text x="10" y="80" font-size="11" fill="#1f2a44">visibility map</text>
  <g stroke="#1f2a44">
    <rect x="10" y="88" width="60" height="22" fill="#ffffff"/><rect x="80" y="88" width="60" height="22" fill="#ffffff"/><rect x="150" y="88" width="60" height="22" fill="#f2b880"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="103">visible</text><text x="110" y="103">visible</text><text x="180" y="103">not set</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1.2">
    <line x1="40" y1="48" x2="40" y2="88"/><line x1="110" y1="48" x2="110" y2="88"/><line x1="180" y1="48" x2="180" y2="88"/>
  </g>
  <rect x="250" y="88" width="90" height="60" fill="#ffffff" stroke="#1f2a44"/>
  <text x="295" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">heap</text>
  <text x="295" y="128" font-size="11" fill="#1f2a44" text-anchor="middle">page 2</text>
  <line x1="210" y1="99" x2="248" y2="112" stroke="#b4232c" stroke-width="1.5"/>
  <text x="229" y="160" font-size="11" fill="#b4232c" text-anchor="middle">heap fetch</text>
  <text x="75" y="135" font-size="11" fill="#1d6fd1" text-anchor="middle">answered from index</text>
</svg>
```
:::

::: context vacuum-word Where VACUUM's name comes from
The name is literal: it sweeps up the dead row versions that updates and deletes leave behind, so their space can be reused. PostgreSQL runs it automatically through the autovacuum background workers, which wake up when a table has changed by a set fraction (20 percent of rows by default, plus a small fixed number). On a table with billions of rows, 20 percent is a lot of change to wait for, so busy telemetry tables are often given lower per-table thresholds.
:::

::: context iso-text Why ISO-8601 text sorts like time
Text compares character by character, left to right. ISO-8601 puts the biggest unit first — year, month, day, hour, minute, second — with fixed widths and leading zeros, so the character order is the time order: `2026-03-05T09:00:00Z` sorts before `2026-03-05T10:00:00Z` because `0` comes before `1` at the first difference. This only holds if every timestamp uses the same format and the same zone (UTC, the `Z`). Mix in `2026-3-5 9:00` and the order breaks.
:::
