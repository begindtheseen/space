---
id: l05-index-types
title: How an index works, and the kinds there are
minutes: 24
covers:
  - "Index types: B-tree, hash, GIN and GiST, and BRIN for append-only time-ordered data"
---

Try to find every page of a thick textbook that mentions "magnetometer". Without help, you read the whole book. With the index at the back, you flip to M, run your finger down a short sorted list, and read: pages 112, 187 and 403. Three pages instead of five hundred.

A database table without an index is the book without that list: to answer "readings from 12:00 to 12:10", the database must look at every row. A **database index** is the same trick — a separate, sorted structure that says where the rows you want live, so the database can jump straight to them.

A satellite fleet makes this matter. Six thousand satellites sending ten samples a second make billions of rows a day, and the engineer on console who asks "what did SAT-042's battery do in the last ten minutes?" needs an answer in a blink. This lesson builds a real five-million-row table, measures a query with and without an index, and then walks through PostgreSQL's five kinds of index: **B-tree**, **hash**, **GIN**, **GiST** and **BRIN**. Each is good at a different kind of question.

## The test table

Every number in this lesson and the next three comes from one PostgreSQL 16 table, built with `generate_series` from the recursive-CTE lesson: 100 satellites, four channels each, one sample a minute for nine days:

```sql
CREATE TABLE telemetry (
    sat_id   INTEGER          NOT NULL,
    ts       TIMESTAMPTZ      NOT NULL,
    channel  TEXT             NOT NULL,   -- BATT_V, BATT_T, GYRO_X, SUN_ANG
    value    DOUBLE PRECISION NOT NULL,
    status   TEXT             NOT NULL    -- NOMINAL, WARN or ANOMALY
);

INSERT INTO telemetry
SELECT s,
       timestamptz '2026-03-01 00:00:00+00' + m * interval '1 minute',
       c.channel,
       round((c.base + c.amp * sin(m / 47.0 + s))::numeric, 3)::double precision,
       CASE WHEN hashint4(s * 100000 + m + c.k) % 1000 = 0 THEN 'ANOMALY'
            WHEN abs(hashint4(s * 7 + m * 13 + c.k)) % 100 < 3 THEN 'WARN'
            ELSE 'NOMINAL' END
FROM generate_series(0, 12959) AS m,          -- 12,960 minutes = 9 days
     generate_series(1, 100)   AS s,          -- 100 satellites
     (VALUES (1, 'BATT_V', 28.0, 1.5), (2, 'BATT_T', 18.0, 6.0),
             (3, 'GYRO_X', 0.0, 0.05), (4, 'SUN_ANG', 90.0, 60.0))
       AS c(k, channel, base, amp)
ORDER BY m, s, c.k;                           -- rows arrive in time order
VACUUM ANALYZE telemetry;
```

The values are gentle sine waves, and `hashint4` scatters a few WARN and ANOMALY statuses at random. The `ORDER BY m` matters: rows land on disk in time order, the way real telemetry arrives.

```text
  count  | pg_size_pretty
---------+----------------
 5184000 | 338 MB
```

That is $12\,960 \times 100 \times 4 = 5\,184\,000$ rows in 338 MB. PostgreSQL stores a table as a pile of 8 kB **pages** — fixed-size blocks, the unit it reads from disk. This table has 43,200 of them, about 120 rows on each. The table itself is called the **[[heap|heap-word]]**, because rows are stacked in it in whatever order they arrived, not sorted by anything.

::: note Settings used for the plans in this module
The plans in lessons 05 to 08 were run with `SET max_parallel_workers_per_gather = 0` (no splitting of scans across worker processes) and mostly with `SET jit = off`, because both add lines ("Gather", "JIT") without changing the lesson. Where such lines or planning lines appeared, they are cut and the plan is marked "abbreviated". No number is changed.
:::

## Without an index: read everything

Ask for ten minutes of data. `EXPLAIN (ANALYZE, BUFFERS)` runs the query and prints the **plan**, the steps the database actually took (you met EXPLAIN in the windows module; lesson 08 of this module teaches you to read every line of it):

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT sat_id, channel, value FROM telemetry
WHERE ts >= '2026-03-05 12:00+00' AND ts < '2026-03-05 12:10+00';
```

```text
 Seq Scan on telemetry  (cost=0.00..120960.00 rows=3790 width=19) (actual time=112.391..216.596 rows=4000 loops=1)
   Filter: ((ts >= '2026-03-05 12:00:00+00'::timestamp with time zone) AND (ts < '2026-03-05 12:10:00+00'::timestamp with time zone))
   Rows Removed by Filter: 5180000
   Buffers: shared hit=16180 read=27020
 Execution Time: 230.823 ms
```

(abbreviated: planning and JIT lines removed.) A **Seq Scan**, or sequential scan, reads the table front to back and tests every row. It kept 4,000 rows and threw away 5,180,000. "Buffers" counts pages touched: $16\,180 + 27\,020 = 43\,200$, every page in the table. That took about 230 ms — and a real table is thousands of times bigger.

## The B-tree: a phone book with signposts

Think of an old paper phone book. Names are sorted, so you open near the middle, see "Martinez", know "Nguyen" is later, and in a few jumps you are on the right page. The words at the top of each page — "Nash — Nolan" — are signposts that let you skip whole pages.

A **B-tree** is that phone book, built by the database. It is the default index, and the one you get if you write `CREATE INDEX` with no type:

```sql
CREATE INDEX telemetry_ts_btree ON telemetry (ts);
-- CREATE INDEX   Time: 945.459 ms
```

It keeps every `ts` value in sorted order, each one paired with a pointer to the row in the heap. Those sorted entries fill the **leaf pages**, the bottom layer. Above them sit **internal pages** holding signposts ("everything from 2026-03-04 09:12 onward is to the right of here"), and at the very top a single **root page**. A search starts at the root and follows one signpost per level down to the right leaf. The **[[picture of the tree|btree-picture]]** shows the shape.

One 8 kB page holds hundreds of entries, so every level multiplies the reach by hundreds. This index has three levels — root, internal, leaves — enough to find any of five million rows by reading three pages. A range query then walks sideways, because each leaf links to the next.

Here is the same query with the index in place:

```text
 Index Scan using telemetry_ts_btree on telemetry  (cost=0.43..127.23 rows=3790 width=19) (actual time=0.027..0.676 rows=4000 loops=1)
   Index Cond: ((ts >= '2026-03-05 12:00:00+00'::timestamp with time zone) AND (ts < '2026-03-05 12:10:00+00'::timestamp with time zone))
   Buffers: shared read=40 written=5
 Execution Time: 0.849 ms
```

(abbreviated.) An **Index Scan** descends the tree, walks the leaves, and fetches each matching row from the heap. Forty pages instead of 43,200. Under a millisecond instead of 230.

::: example How many levels does a B-tree need?
**Question.** Suppose each B-tree page holds about 400 entries. How many levels does it take to index 5,184,000 rows? And 3.8 trillion rows, roughly what ten samples a second from six thousand satellites adds up to over two years?

**Step 1: what each level can reach.** One root page points at 400 pages. Two levels reach $400 \times 400 = 160\,000$ leaf entries. Three levels reach $400^3 = 64\,000\,000$.

**Step 2: our table.** 5,184,000 is more than 160,000 but less than 64,000,000, so three levels are enough. That matches the index we built, which has exactly three.

**Step 3: the fleet.** Four levels reach $400^4 = 2.56 \times 10^{10}$, five reach $1.02 \times 10^{13}$. So 3.8 trillion rows need five levels.

**Sanity check.** The table grew about 700,000 times, and the number of pages a lookup must read went from 3 to 5. That is the magic of the B-tree: its depth grows with the *[[logarithm|logarithm-growth]]* of the row count, so it barely notices the data growing.
:::

What can a B-tree answer? Anything that uses the sort order:

- equality: `ts = '2026-03-05 12:00+00'`;
- ranges: `<`, `<=`, `>`, `>=`, `BETWEEN`;
- sorting: `ORDER BY ts` can read the leaves in order instead of sorting;
- a text prefix: `LIKE 'SAT-0%'`, which is a range in disguise (in the default "C" collation, or with a special operator class).

It cannot help with `LIKE '%GYRO'` (the unknown part is at the front, so there is nowhere in the sorted list to start) or with what is *inside* a value, such as "which arrays contain this tag?". You have been making B-trees already: every `PRIMARY KEY` and `UNIQUE` constraint from lesson 03 is enforced by one.

::: key The B-tree
The default index. It stores the column's values sorted, in a shallow tree of pages, each value pointing at its row. It serves equality, ranges (`<`, `>`, `BETWEEN`) and `ORDER BY`. Its depth grows with the logarithm of the row count, so a lookup reads only a few pages even in a huge table. PRIMARY KEY and UNIQUE constraints create one automatically.
:::

## Hash indexes: equality only

A **hash index** stores, for each row, a **[[hash|hash-word]]** of the value: a number computed from it, like a fingerprint, that scatters similar values into far-apart buckets. To find `ts = x`, the database hashes `x`, goes to that bucket, and checks the few rows there.

```sql
CREATE INDEX telemetry_ts_hash ON telemetry USING hash (ts);
```

Equality uses it. (A **Bitmap Index Scan** under a **Bitmap Heap Scan** is a two-step way of using an index: first collect where all the matching rows live, then visit those pages in disk order. Lesson 08 says when the planner prefers it.)

```sql
EXPLAIN SELECT count(*) FROM telemetry WHERE ts = '2026-03-05 12:00+00';
```

```text
 Aggregate  (cost=1555.44..1555.45 rows=1 width=8)
   ->  Bitmap Heap Scan on telemetry  (cost=11.22..1554.40 rows=416 width=0)
         Recheck Cond: (ts = '2026-03-05 12:00:00+00'::timestamp with time zone)
         ->  Bitmap Index Scan on telemetry_ts_hash  (cost=0.00..11.12 rows=416 width=0)
               Index Cond: (ts = '2026-03-05 12:00:00+00'::timestamp with time zone)
```

A range cannot. Hashing destroys order: 12:00 and 12:01 land in unrelated buckets, so there is no "walk from here to there". With only the hash index on `ts`, the ten-minute query goes straight back to a full Seq Scan:

```text
 Aggregate  (cost=120969.48..120969.49 rows=1 width=8)
   ->  Seq Scan on telemetry  (cost=0.00..120960.00 rows=3790 width=0)
         Filter: ((ts >= '2026-03-05 12:00:00+00'::timestamp with time zone) AND (ts < '2026-03-05 12:10:00+00'::timestamp with time zone))
```

It was not even smaller: 187 MB against the B-tree's 34 MB, because the B-tree stores each repeated timestamp once with a list of row pointers (**deduplication**), while the hash index keeps an entry per row. A hash index can pay off for equality on long values, such as long text identifiers. Most of the time a B-tree does the same job and more.

::: key Hash indexes
Equality only (`=`). They cannot serve ranges or ORDER BY, because hashing throws away order. A B-tree covers the same lookups and more, so a hash index is a rare choice.
:::

## GIN: an index of what is inside

The index at the back of a book is not a sorted list of pages. It is a list of *words*, and after each word, the pages that contain it. That shape is called an **inverted index**, and PostgreSQL's version is **GIN**, the Generalized Inverted Index.

GIN is for columns that hold many things in one value: an array of tags, a JSON document, or a paragraph of text. It indexes each element separately. Here is an event log of 400,000 rows, each with a tag array, a `jsonb` details document (JSON stored in binary form), and an operator's note:

```sql
CREATE TABLE event_log (
    event_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sat_id   INTEGER     NOT NULL,
    ts       TIMESTAMPTZ NOT NULL,
    tags     TEXT[]      NOT NULL,   -- e.g. {propulsion,thruster,anomaly}
    details  JSONB       NOT NULL,   -- e.g. {"fsw": "4.2.3", "mode": "SAFE"}
    note     TEXT        NOT NULL
);
CREATE INDEX event_tags_gin    ON event_log USING gin (tags);
CREATE INDEX event_details_gin ON event_log USING gin (details);
CREATE INDEX event_note_fts    ON event_log USING gin (to_tsvector('english', note));
```

Three kinds of question now go through GIN. Read `@>` as "contains":

```sql
SELECT event_id, sat_id, ts FROM event_log WHERE tags @> ARRAY['thruster'];
SELECT count(*) FROM event_log WHERE details @> '{"mode": "SAFE"}';
SELECT count(*) FROM event_log
WHERE to_tsvector('english', note) @@ to_tsquery('english', 'valve & stuck');
```

```text
 Bitmap Heap Scan on event_log  (cost=51.87..1369.45 rows=400 width=20) (actual time=0.078..0.494 rows=401 loops=1)
   Recheck Cond: (tags @> '{thruster}'::text[])
   Heap Blocks: exact=401
   ->  Bitmap Index Scan on event_tags_gin  (cost=0.00..51.77 rows=400 width=0) (actual time=0.039..0.039 rows=401 loops=1)
         Index Cond: (tags @> '{thruster}'::text[])
 Execution Time: 0.523 ms
```

(abbreviated; the other two plans have the same shape, on `event_details_gin` and `event_note_fts`, in 1.5 ms and 0.4 ms.) The third query is **full-text search**: `to_tsvector` turns "thruster 3 valve stuck open during orbit raise" into the word **[[stems|stemming]]** `'3' 'open' 'orbit' 'rais' 'stuck' 'thruster' 'valv'`, and `@@`, read "matches", asks whether they include both `valv` and `stuck`.

A B-tree cannot do this: it sorts whole values, so `{propulsion,thruster,anomaly}` sorts under P and "contains thruster" gives it nowhere to start.

::: key GIN
An inverted index: each element (array item, JSON key and value, word stem) maps to the list of rows that contain it. Use it for "contains" questions on arrays (`@>`), `jsonb` (`@>`, `?`) and full-text search (`@@`). It is slower to update than a B-tree, because one row adds many entries.
:::

## GiST: shapes and time windows that overlap

Some questions ask "do these two things overlap?" — two ground-station passes in time, two footprints on a map. No single sort order puts all overlapping things next to each other, so a B-tree cannot help.

**GiST**, the Generalized Search Tree, handles these. It is a tree whose signposts describe regions — "everything below me lies within this time span" — instead of points in a sorted list, and a search goes down only into branches whose region could overlap the question. PostgreSQL uses it for **range types** (like `tstzrange`, a span of time with a start and an end), for geometry, and for "nearest to" searches.

GiST also powers the **exclusion constraint**: no two rows may overlap. An antenna can track only one satellite at a time, so its bookings must never overlap:

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;   -- lets GiST also compare plain text with =

CREATE TABLE antenna_booking (
    antenna TEXT      NOT NULL,
    sat_id  INTEGER   NOT NULL,
    pass    TSTZRANGE NOT NULL,
    EXCLUDE USING gist (antenna WITH =, pass WITH &&)
);
```

Read `&&` as "overlaps". The constraint says: reject a new row if some existing row has an equal `antenna` *and* an overlapping `pass`.

```sql
INSERT INTO antenna_booking VALUES
  ('SVALBARD-1', 17, '[2026-03-05 10:02+00, 2026-03-05 10:11+00)'),
  ('SVALBARD-1', 42, '[2026-03-05 10:15+00, 2026-03-05 10:23+00)'),
  ('SVALBARD-2', 42, '[2026-03-05 10:05+00, 2026-03-05 10:12+00)');
-- INSERT 0 3
INSERT INTO antenna_booking VALUES
  ('SVALBARD-1', 63, '[2026-03-05 10:09+00, 2026-03-05 10:16+00)');
```

```text
ERROR:  conflicting key value violates exclusion constraint "antenna_booking_antenna_pass_excl"
DETAIL:  Key (antenna, pass)=(SVALBARD-1, ["2026-03-05 10:09:00+00","2026-03-05 10:16:00+00")) conflicts with existing key (antenna, pass)=(SVALBARD-1, ["2026-03-05 10:02:00+00","2026-03-05 10:11:00+00")).
```

SAT-042's two passes are on different antennas, so the first three rows are fine. The fourth wants [[SVALBARD-1|svalbard]] from 10:09, but SAT-017 has it until 10:11. The brackets are half-open: `[` includes the start, `)` excludes the end, so passes that touch at 10:11 do not clash.

::: key GiST
A tree whose signposts are regions, not sorted points. Use it for overlap and containment on ranges and geometry (`&&`, `@>`), for nearest-neighbour searches, and for EXCLUDE constraints such as "no two bookings of one antenna overlap".
:::

## BRIN: a tiny index for data that arrives in order

Now the index made for telemetry. Picture a shelf of diaries, one per month, in order. To find March 14th you need no index of every entry: the label on each spine — "1 March to 31 March" — lets you skip every diary but one.

**BRIN**, the Block Range INdex, is those spine labels. It groups the heap into **block ranges** of 128 consecutive pages (the default) and stores only a summary for each: the smallest and largest value in those pages. No entry per row.

```sql
CREATE INDEX telemetry_ts_brin ON telemetry USING brin (ts);
-- CREATE INDEX   Time: 536.435 ms
```

Compare the sizes with `pg_relation_size`, which reports how many bytes a table or index takes on disk:

```sql
SELECT relname, pg_size_pretty(pg_relation_size(oid)) AS size, pg_relation_size(oid) AS bytes
FROM pg_class
WHERE relname IN ('telemetry', 'telemetry_ts_btree', 'telemetry_ts_brin')
  AND relnamespace = 'sql04b'::regnamespace       -- the schema these tables live in
ORDER BY bytes DESC;
```

```text
      relname       |  size  |   bytes
--------------------+--------+-----------
 telemetry          | 338 MB | 353894400
 telemetry_ts_btree | 34 MB  |  35586048
 telemetry_ts_brin  | 32 kB  |     32768
```

Thirty-two kilobytes against thirty-four megabytes. With the B-tree dropped, here is the ten-minute query again:

```text
 Bitmap Heap Scan on telemetry  (cost=16.98..30891.17 rows=3790 width=19) (actual time=0.934..2.566 rows=4000 loops=1)
   Recheck Cond: ((ts >= '2026-03-05 12:00:00+00'::timestamp with time zone) AND (ts < '2026-03-05 12:10:00+00'::timestamp with time zone))
   Rows Removed by Index Recheck: 26720
   Heap Blocks: lossy=256
   Buffers: shared hit=40 read=222
   ->  Bitmap Index Scan on telemetry_ts_brin  (cost=0.00..16.03 rows=15337 width=0) (actual time=0.047..0.047 rows=2560 loops=1)
         Index Cond: ((ts >= '2026-03-05 12:00:00+00'::timestamp with time zone) AND (ts < '2026-03-05 12:10:00+00'::timestamp with time zone))
         Buffers: shared hit=6
 Execution Time: 2.724 ms
```

(abbreviated.) Read it bottom up. The BRIN index said "only these block ranges could hold 12:00 to 12:10". The heap scan read those 256 pages — "lossy" means whole pages, not exact rows — and **rechecked** every row, keeping 4,000. That is 2.7 ms: slower than the B-tree's 0.8 ms, about a hundred times faster than the full scan, from an index a thousand times smaller.

For a wide time range, BRIN shines. A whole day, averaged per channel:

```text
 HashAggregate  (cost=54699.48..54699.53 rows=4 width=15) (actual time=151.035..151.039 rows=4 loops=1)
   ->  Bitmap Heap Scan on telemetry  (cost=158.62..51870.80 rows=565735 width=15) (actual time=0.100..68.135 rows=576000 loops=1)
         Rows Removed by Index Recheck: 7680
         Heap Blocks: lossy=4864
         ->  Bitmap Index Scan on telemetry_ts_brin  (cost=0.00..17.18 rows=567479 width=0) (actual time=0.089..0.090 rows=48640 loops=1)
```

(abbreviated.) It read 4,864 of 43,200 pages, and threw away only 7,680 extra rows out of 583,680 read. Almost no waste.

::: example Where did 256 and 4,864 pages come from?
**The ten-minute query.** Ten minutes of 100 satellites times 4 channels is $10 \times 400 = 4000$ rows. At 120 rows per page, that is $4000 / 120 \approx 33$ pages. BRIN cannot hand out 33 pages; it hands out whole block ranges of 128 pages. Those 33 pages straddled the boundary between two ranges, so it read $2 \times 128 = 256$ pages. Most of them were not needed, which is where the 26,720 rechecked-and-discarded rows came from: $256 \times 120 = 30\,720$ rows read, minus 4,000 kept, is 26,720. Exactly the plan's number.

**The one-day query.** One day is $1440 \times 400 = 576\,000$ rows, or $576\,000 / 120 = 4800$ pages. That is $4800 / 128 = 37.5$ block ranges, so at least 38 whole ranges: $38 \times 128 = 4864$ pages. Again the plan's number, and again $4864 \times 120 - 576\,000 = 7680$ extra rows, matching "Rows Removed by Index Recheck".

**Sanity check.** The waste is at most a range at each end of the query, about $2 \times 128$ pages. For ten minutes, that dwarfs the useful 33 pages. For a day, it is less than 2 percent of the 4,800 useful pages. So BRIN's waste is fixed and small, and the wider the time window, the less it matters.
:::

### Why BRIN needs correlation

BRIN only works if each block range covers a *narrow* slice of values. That happens when the physical order of rows follows the column's order. PostgreSQL measures this as the column's **[[correlation|correlation-word]]**, a number from −1 to +1 saved in `pg_stats`. Near +1 means "the rows lie on disk in nearly the same order as this column's values".

```sql
SELECT attname, correlation FROM pg_stats
WHERE schemaname = 'sql04b' AND tablename = 'telemetry' AND attname = 'ts';
--  ts | 1
```

A perfect 1, because rows were inserted in time order. To see what happens otherwise, copy the table in shuffled order and build the same BRIN index:

```sql
CREATE TABLE telemetry_shuffled AS SELECT * FROM telemetry ORDER BY random();
CREATE INDEX shuf_ts_brin ON telemetry_shuffled USING brin (ts);
VACUUM ANALYZE telemetry_shuffled;
-- correlation of ts: -0.0012012457
```

Now every block range holds rows from all nine days, so every summary reads "1 March to 9 March" and nothing can be ruled out. The planner picks a plain Seq Scan (286 ms). Forcing the BRIN index (with `SET enable_seqscan = off`) shows why:

```text
 Bitmap Heap Scan on telemetry_shuffled  (cost=27.83..120987.83 rows=4039 width=19) (actual time=1.059..432.264 rows=4000 loops=1)
   Rows Removed by Index Recheck: 5180000
   Heap Blocks: lossy=43200
```

(abbreviated.) All 43,200 pages, in 432 ms: worse than no index. Same data, same index, useless — because the order on disk changed. The **[[picture of block ranges|brin-picture]]** shows the two cases side by side.

::: key When a BRIN index is the right choice
On a large append-only table whose physical order correlates with the column, which is exactly time-ordered telemetry. It stores a summary (min and max) per block range of 128 pages, so it is tiny compared with a B-tree and excellent for wide time-range scans. On data whose physical order does not follow the column (correlation near 0), it rules nothing out and is useless.
:::

::: warning BRIN is not a small B-tree
BRIN finds *block ranges that might hold* a row, then rechecks every row in them. For a point lookup ("SAT-042 at exactly 12:03") a B-tree reads a few pages, BRIN at least 128. And correlation can decay: bulk `UPDATE`s, back-filling old data into free space, or reloading in a different order all widen each range's min-to-max. Check `pg_stats.correlation` before trusting a BRIN index.
:::

## Choosing an index type

| Question you are asking | Index type | Operators |
| --- | --- | --- |
| equal, less than, between, sorted | B-tree (default) | `=`, `<`, `>`, `BETWEEN`, `ORDER BY` |
| equal only, on long values | hash | `=` |
| does this array, document or text contain X? | GIN | `@>`, `?`, `@@` |
| do these ranges or shapes overlap? nearest? | GiST | `&&`, `@>`, `<->` |
| a wide time range on append-only data | BRIN | `<`, `>`, `BETWEEN` on correlated columns |

::: example Picking indexes for a ground-segment database
**Task.** Choose an index for each query.

1. "Show event 81,337." Equality on a unique key: the PRIMARY KEY already made a **B-tree**.
2. "Every event tagged `battery` this week." Contains, on an array: **GIN** on `tags`, used through `@>`.
3. "Is antenna SVALBARD-2 free from 14:05 to 14:13?" Overlap of time spans: **GiST** on the `tstzrange` column, with an EXCLUDE constraint so a double booking can never be saved.
4. "Fleet battery voltage per hour for the last 30 days" on a two-billion-row, append-only, time-ordered table: **BRIN** on `ts`. A B-tree would work too, but would cost gigabytes, and every insert would have to update it (lesson 07 measures that cost).

**Sanity check.** Each answer's operator (`=`, `@>`, `&&`, a wide `>=`/`<`) appears in that type's row of the table above. If it does not, the index cannot be used.
:::

### What SQLite has

The app's SQL exercises run on SQLite, whose `CREATE INDEX` always builds a B-tree: no `USING`, no hash, GIN, GiST or BRIN. (Its FTS5 and R*Tree add-ons do the jobs of GIN and GiST as separate "virtual tables".) Everything this module says about B-trees applies to SQLite unchanged.

## Check yourself

::: check
A table of ground-station contacts has a column `station TEXT` and a B-tree index on it. Which of these can the index help with: `station = 'AWARUA'`, `station LIKE 'AWA%'`, `station LIKE '%RUA'`, `ORDER BY station`?
:::

::: answer
A B-tree helps with anything that is a place, or a stretch, in sorted order. `= 'AWARUA'` is a place: yes. `LIKE 'AWA%'` is the stretch from `AWA` to just before `AWB`: yes, if the index is built for prefix matching (the "C" collation or the `text_pattern_ops` operator class). `ORDER BY station` reads the leaves in order: yes. `LIKE '%RUA'` has its unknown part at the front, so there is no starting point: no.
:::

::: check
Why does a hash index on `ts` not help `ts >= '2026-03-05 12:00+00' AND ts < '2026-03-05 12:10+00'`, when a B-tree does?
:::

::: answer
The query asks for a stretch of consecutive values. A B-tree finds 12:00 and walks the sorted leaves to 12:10. A hash index stores a scrambled fingerprint of each value, so 12:00 and 12:01 sit in unrelated buckets and there is no order to walk; it answers only "which rows equal exactly this?".
:::

::: check
A BRIN index on `ts` over a 338 MB, 43,200-page table uses 128-page block ranges. How many summaries does it hold, and why is the index only 32 kB?
:::

::: answer
$43\,200 / 128 = 337.5$, so 338 block ranges, each with one summary: the smallest and largest `ts` in those pages. Two timestamps are 16 bytes, so 338 summaries are a few kilobytes; with page overhead the index fits in four 8 kB pages, 32 kB. A B-tree points at every one of the 5,184,000 rows, which is why it is about a thousand times bigger.
:::

::: check
An engineer loads a year of old telemetry into a table in random order, builds a BRIN index on `ts`, and finds that a one-hour query still takes as long as a full scan. What went wrong, and what are two ways to fix it?
:::

::: answer
BRIN rules out only block ranges whose min-to-max misses the query. With rows in random order, every range holds timestamps from the whole year, so nothing is ruled out: the correlation of `ts` is near 0. Fix one: rewrite the table in time order (`CREATE TABLE ... AS SELECT ... ORDER BY ts`, or PostgreSQL's `CLUSTER` command), after which BRIN works. Fix two: use a B-tree on `ts`, which does not care about physical order, and pay its larger size.
:::

## Summary

| Idea | What it means |
| --- | --- |
| Heap, page | The table's rows, unsorted, stored in 8 kB pages |
| Seq Scan | Read every page and test every row |
| B-tree | Sorted values in a shallow tree; `=`, ranges, ORDER BY; the default |
| Hash | Equality only; no ranges, no order |
| GIN | Inverted index for arrays, `jsonb`, full text (`@>`, `@@`) |
| GiST | Regions in a tree: overlap, containment, nearest; EXCLUDE constraints |
| BRIN | Min and max per 128-page block range; tiny; needs correlation near 1 |
| Measured here | Seq Scan 43,200 pages, 231 ms; B-tree 40 pages, 0.85 ms; BRIN 256 pages, 2.7 ms |
| Sizes here | Table 338 MB, B-tree on `ts` 34 MB, BRIN on `ts` 32 kB |

Every index so far was on a single column. The next lesson builds B-trees on two and three columns at once, and shows why the order you list them in decides which queries can use the index at all.

::: context heap-word Why it is called a heap
In everyday English a heap is an untidy pile, and that is the point: a PostgreSQL table stores rows in whatever order they arrived, in whatever space is free, with no sorting at all. (Computer science also has a "heap" data structure that *is* partly sorted — a different thing that happens to share the name.) Some databases, such as SQLite and MySQL's InnoDB, store the table itself as a B-tree sorted by its row id or primary key instead. PostgreSQL keeps the heap and the indexes separate, which is why every index entry needs a pointer back into the heap.
:::

::: context btree-picture The shape of a three-level B-tree
The root holds signposts that split the whole range of values. Each internal page splits its share further. The leaves hold every value in order, each pointing to a row in the heap, and are linked left to right so a range scan can walk sideways. The drawing uses tiny pages of three entries; real ones hold hundreds.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="140" y="10" width="80" height="24" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="26" font-size="11" fill="#1f2a44" text-anchor="middle">root: 40 | 70</text>
  <rect x="20" y="70" width="80" height="24" fill="#ffffff" stroke="#1f2a44"/>
  <text x="60" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">10 | 25</text>
  <rect x="140" y="70" width="80" height="24" fill="#ffffff" stroke="#1f2a44"/>
  <text x="180" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">50 | 60</text>
  <rect x="260" y="70" width="80" height="24" fill="#ffffff" stroke="#1f2a44"/>
  <text x="300" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">80 | 90</text>
  <g stroke="#1f2a44" stroke-width="1.2">
    <line x1="160" y1="34" x2="60" y2="70"/>
    <line x1="180" y1="34" x2="180" y2="70"/>
    <line x1="200" y1="34" x2="300" y2="70"/>
  </g>
  <g fill="#f2b880" stroke="#1f2a44">
    <rect x="4" y="130" width="36" height="22"/><rect x="44" y="130" width="36" height="22"/>
    <rect x="84" y="130" width="36" height="22"/><rect x="124" y="130" width="36" height="22"/>
    <rect x="164" y="130" width="36" height="22"/><rect x="204" y="130" width="36" height="22"/>
    <rect x="244" y="130" width="36" height="22"/><rect x="284" y="130" width="36" height="22"/>
    <rect x="324" y="130" width="32" height="22"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="22" y="145">3,7</text><text x="62" y="145">12,18</text><text x="102" y="145">27,33</text>
    <text x="142" y="145">41,47</text><text x="182" y="145">52,58</text><text x="222" y="145">63,66</text>
    <text x="262" y="145">72,77</text><text x="302" y="145">84,88</text><text x="340" y="145">93</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="40" y1="94" x2="22" y2="130"/><line x1="60" y1="94" x2="62" y2="130"/><line x1="80" y1="94" x2="102" y2="130"/>
    <line x1="160" y1="94" x2="142" y2="130"/><line x1="180" y1="94" x2="182" y2="130"/><line x1="200" y1="94" x2="222" y2="130"/>
    <line x1="280" y1="94" x2="262" y2="130"/><line x1="300" y1="94" x2="302" y2="130"/><line x1="320" y1="94" x2="340" y2="130"/>
  </g>
  <text x="180" y="176" font-size="11" fill="#1d6fd1" text-anchor="middle">leaves: every value, sorted, linked left to right</text>
  <text x="180" y="192" font-size="11" fill="#6c7a93" text-anchor="middle">each leaf entry points to a row in the heap</text>
</svg>
```

To find 58: the root says 58 is between 40 and 70, so go to the middle page; that page says 58 is between 50 and 60, so go to the fifth leaf. Three pages read.
:::

::: context logarithm-growth Why the depth grows so slowly
The number of levels needed is the answer to "how many times must I multiply by 400 to reach the row count?" That question is what a logarithm answers: levels $\approx \log_{400} N$, rounded up. Because each extra level multiplies the reach by 400, going from five million rows to five trillion — a millionfold jump — adds only about $\log_{400} 10^6 \approx 2.3$ levels. The same idea makes binary search fast, and it comes back whenever an algorithm splits its problem into pieces at every step.
:::

::: context hash-word What a hash is
A hash function turns any value into a fixed-size number in a way that looks random but is repeatable: the same input always gives the same number, and inputs that differ by one character give wildly different numbers. It is how a coat check works — your coat goes on hook 417, and the ticket, not the coat's color, tells the attendant where to look. Hashes turn up all over computing: in Python's `dict`, in git's commit ids, and in the checksums that catch corrupted downlink frames.
:::

::: context stemming Why "valve" becomes "valv"
Full-text search does not match exact words. It first reduces each word to a **stem** with a set of rules for the language (for English, PostgreSQL uses the Snowball stemmer). "valve", "valves" and "valved" all become `valv`; "raise", "raised" and "raising" all become `rais`. The stems look odd, but only the database ever sees them. Very common words such as "during" and "the", called stop words, are dropped altogether because they would match nearly every row.
:::

::: context svalbard Why so many antennas are in Svalbard
Svalbard is a Norwegian archipelago at about 78 degrees north. A satellite in a polar orbit crosses near both poles on every revolution, so a ground station that far north can see it on most of its roughly 14 to 15 orbits a day, where a station near the equator sees it only a few times. That is why the Svalbard Satellite Station hosts a large field of antennas used by many operators, and why booking antenna time without overlaps is a real scheduling problem.
:::

::: context correlation-word What the correlation number measures
PostgreSQL's `ANALYZE` samples the table, sorts the sampled values, and compares that sorted order with the order the rows sit on disk. If they agree perfectly, the correlation is +1; if the disk order is the exact reverse, −1; if there is no relation, about 0. It is the same correlation coefficient you meet in statistics, applied to "position on disk" against "position in sorted order". The planner also uses it to price B-tree index scans: a high correlation means neighbouring index entries point to neighbouring pages, so reading them is cheap.
:::

::: context brin-picture Block ranges in time order and shuffled
Each box is one block range, labeled with the smallest and largest day it holds. On the left, rows arrived in time order, so each range covers a narrow slice and a query for day 5 reads one range. On the right, the same rows shuffled: every range holds days 1 to 9, so nothing can be skipped.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">time order (correlation 1)</text>
  <text x="270" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">shuffled (correlation 0)</text>
  <g stroke="#1f2a44" font-size="11" text-anchor="middle">
    <rect x="30" y="28" width="120" height="22" fill="#ffffff"/>
    <rect x="30" y="54" width="120" height="22" fill="#ffffff"/>
    <rect x="30" y="80" width="120" height="22" fill="#8fb8f0"/>
    <rect x="30" y="106" width="120" height="22" fill="#ffffff"/>
    <rect x="30" y="132" width="120" height="22" fill="#ffffff"/>
    <rect x="210" y="28" width="120" height="22" fill="#f2b880"/>
    <rect x="210" y="54" width="120" height="22" fill="#f2b880"/>
    <rect x="210" y="80" width="120" height="22" fill="#f2b880"/>
    <rect x="210" y="106" width="120" height="22" fill="#f2b880"/>
    <rect x="210" y="132" width="120" height="22" fill="#f2b880"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="43">days 1 to 2</text><text x="90" y="69">days 3 to 4</text>
    <text x="90" y="95">days 5 to 6</text><text x="90" y="121">days 7 to 8</text>
    <text x="90" y="147">day 9</text>
    <text x="270" y="43">days 1 to 9</text><text x="270" y="69">days 1 to 9</text>
    <text x="270" y="95">days 1 to 9</text><text x="270" y="121">days 1 to 9</text>
    <text x="270" y="147">days 1 to 9</text>
  </g>
  <text x="90" y="172" font-size="11" fill="#1d6fd1" text-anchor="middle">day 5: read 1 range</text>
  <text x="270" y="172" font-size="11" fill="#b4232c" text-anchor="middle">day 5: read all 5 ranges</text>
</svg>
```

Blue marks the one range read; orange marks ranges that cannot be ruled out.
:::
