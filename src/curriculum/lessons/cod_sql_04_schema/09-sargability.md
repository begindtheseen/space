---
id: l09-sargability
title: SARGable predicates
minutes: 23
covers:
  - "SARGability: why wrapping an indexed column in a function kills the index"
---

Picture a phone book. It is sorted by last name, so "everyone named Garcia" takes a few seconds: open near the middle, flip toward the G's, read one block of pages. Now try "everyone whose last name has a *c* as its third letter". The book is still sorted, and every Garcia is still there. But the sorting no longer helps you. You have to read every page.

A database index is that phone book. It keeps the values of a column in sorted order, with a pointer from each value to its row. A question asked about the column's *own* values can jump straight to the right page. A question asked about some *changed version* of the values — the third letter, the day part of a time, the value in lowercase — cannot. The index is there, and the planner walks past it.

This lesson is about writing conditions the index can use. The ugly word for such a condition is **SARGable**. You will learn the everyday ways people break it, how to rewrite each one, and how to prove the fix with `EXPLAIN ANALYZE` from the last lesson. On a fleet's telemetry table this is often the difference between five milliseconds and reading every row.

## The table we will query

Every plan in this lesson comes from one table in PostgreSQL 16: ninety days of telemetry from ten satellites, four channels each, one sample per minute. That is $10 \times 4 \times 1440 \times 90 = 5\,184\,000$ rows, about 354 MB on disk.

```sql
CREATE TABLE telemetry (
    sat_id  integer          NOT NULL,
    ts      timestamptz      NOT NULL,
    channel text             NOT NULL,   -- 'EPS_BATT_V', 'EPS_BUS_I', 'THM_BUS_TEMP', 'ADCS_WHEEL_RPM'
    value   double precision NOT NULL
);
CREATE INDEX telemetry_sat_ts     ON telemetry (sat_id, ts);
CREATE INDEX telemetry_ts         ON telemetry (ts);
CREATE INDEX telemetry_channel_ts ON telemetry (channel, ts);
```

Three ordinary B-tree indexes. The first is a composite index (lesson 06): sorted by satellite, then by time. The second is sorted by time alone. The session's time zone is UTC throughout.

## What SARGable means

**SARG** is short for **[[search argument|sarg-origin]]**: a condition the database can hand straight to an index as "go find where this starts, and read from there". A predicate — a condition in a `WHERE` clause — is **SARGable** (say "SAR-gable") when it can be answered by *seeking* in an index. **Seeking** means jumping down the tree to the first matching entry, instead of reading the index or the table from the beginning.

For a B-tree, a predicate is SARGable when it has this shape:

- on one side, the indexed column **alone** — bare, untouched, not inside any function or sum;
- in the middle, one of the comparisons a B-tree understands: `=`, `<`, `<=`, `>`, `>=` (read "greater than or equal to"), `BETWEEN`, `IN`, or a `LIKE` whose pattern has a fixed start;
- on the other side, something the database can work out *once*, before it touches a single row: a constant, a parameter, or an expression built only from constants, like `now() - interval '6 hours'`.

So `ts >= '2026-03-02 00:00:00+00'` is SARGable. So is `sat_id = 3`. But `date_trunc('day', ts) = '2026-03-02'` is not, even though `ts` is indexed. The column is inside a function.

::: key What is SARGability?
Whether a predicate can be answered by seeking in an index. Wrapping the indexed column in a function or an arithmetic expression destroys it. Rewrite as a range on the raw column, or build an index on the expression.
:::

## Why a function on the column hides it from the index

The index on `ts` is a long sorted list of timestamps. To answer `ts >= X`, PostgreSQL finds $X$ in the list with a few page reads, then walks forward. That works because the list is sorted by exactly the thing the condition talks about.

Now ask for `date_trunc('day', ts) = '2026-03-02'`. The index holds `ts`, not the day. You can see that all the matching rows sit together, between midnight on the 2nd and midnight on the 3rd. The planner does not reason that way. It treats a function of the column as a **[[black box|black-box]]** whose output order it does not know, so the only safe plan is to compute the function for every row and test the result.

The fix is to do that reasoning yourself, once, and write the answer down. Leave the column bare. Move all the work to the **constant side**.

::: key Rewrite the constant side, not the column
Keep the indexed column bare on one side of the comparison. Anything you want to do to it — truncating, shifting, casting — do to the constant instead, or turn it into a range on the raw column.
:::

## The half-open range: the rewrite you will use most

"All readings on 2 March" means "every reading at or after midnight on 2 March, and before midnight on 3 March". You met that shape in the first SQL module: the **half-open range**, which includes its start and excludes its end.

$$
\text{2 March} \iff t_0 \le ts < t_1, \qquad t_0 = \text{2026-03-02 00:00}, \; t_1 = \text{2026-03-03 00:00}
$$

Read it as "ts is at least $t_0$ and less than $t_1$". Every instant belongs to exactly one day, however fine the timestamps are, and the column is bare.

::: example One satellite, one day: before and after
A colleague's dashboard asks for the mean of every reading from satellite 3 on 2 March:

```sql
EXPLAIN ANALYZE
SELECT avg(value) FROM telemetry
WHERE sat_id = 3 AND date_trunc('day', ts) = '2026-03-02';
```

```text
 Finalize Aggregate  (actual time=185.000..190.868 rows=1 loops=1)
   ->  Gather  (actual time=184.714..190.859 rows=3 loops=1)
         Workers Planned: 2
         ->  Partial Aggregate  (actual time=179.756..179.757 rows=1 loops=3)
               ->  Parallel Bitmap Heap Scan on telemetry  (actual time=140.471..179.610 rows=1920 loops=3)
                     Recheck Cond: (sat_id = 3)
                     Filter: (date_trunc('day'::text, ts) = '2026-03-02 00:00:00+00'::timestamp with time zone)
                     Rows Removed by Filter: 170880
                     ->  Bitmap Index Scan on telemetry_sat_ts  (actual time=32.280..32.281 rows=518400 loops=1)
                           Index Cond: (sat_id = 3)
 Execution Time: 190.910 ms
```

(Abbreviated: cost figures and a few lines removed; every number shown is as printed.)

**Step 1: find the Index Cond.** It says only `sat_id = 3`. The index was used, but only its first column. The date condition is down in `Filter`, which means "tested row by row after fetching".

**Step 2: count the damage.** The index handed over 518,400 rows — every reading satellite 3 sent in ninety days ($4 \times 1440 \times 90 = 518\,400$). The filter threw most of them away. The plan ran in three **[[parallel processes|parallel-workers]]** (`loops=3`), and the per-process numbers are averages, so multiply by 3: $170\,880 \times 3 = 512\,640$ rows removed, $1920 \times 3 = 5760$ kept. Check: $512\,640 + 5760 = 518\,400$. Every row was accounted for.

**Step 3: rewrite as a half-open range.**

```sql
EXPLAIN ANALYZE
SELECT avg(value) FROM telemetry
WHERE sat_id = 3
  AND ts >= '2026-03-02 00:00:00+00'
  AND ts <  '2026-03-03 00:00:00+00';
```

```text
 Aggregate  (actual time=4.850..4.851 rows=1 loops=1)
   ->  Index Scan using telemetry_ts on telemetry  (actual time=0.031..4.462 rows=5760 loops=1)
         Index Cond: ((ts >= '2026-03-02 00:00:00+00'::timestamp with time zone) AND (ts < '2026-03-03 00:00:00+00'::timestamp with time zone))
         Filter: (sat_id = 3)
         Rows Removed by Filter: 51840
 Execution Time: 4.869 ms
```

(Abbreviated as before.) Now the time range is in `Index Cond`. The planner chose the index on `ts` alone and filtered the satellite afterwards; it judged one day of the whole fleet (57,600 rows) cheap enough to read. Either index would now work, because both can seek on `ts`.

**Step 4: the answer did not change.** Both queries return 5760 rows and a mean of 763.6450 — four channels times 1440 minutes is 5760, as it should be. Only the path changed.

**Result:** 190.9 ms down to 4.87 ms, about 39 times faster. Timings wander by a few milliseconds from run to run; the ratio is the point.
:::

The same rewrite rescues every "pull a piece out of the timestamp" habit:

| Non-SARGable | Rewritten as a range on the bare column |
| --- | --- |
| `date_trunc('day', ts) = '2026-03-02'` | `ts >= '2026-03-02 00:00+00' AND ts < '2026-03-03 00:00+00'` |
| `ts::date = '2026-03-02'` | the same range |
| `EXTRACT(month FROM ts) = 3` (in 2026) | `ts >= '2026-03-01 00:00+00' AND ts < '2026-04-01 00:00+00'` |
| `date_trunc('hour', ts) = '2026-03-02 14:00+00'` | `ts >= '2026-03-02 14:00+00' AND ts < '2026-03-02 15:00+00'` |

`ts::date` (read "ts cast to date") looks harmless, but a cast is a function too. Across the whole fleet, `WHERE ts::date = '2026-03-02'` made PostgreSQL read all 5,184,000 rows in a parallel sequential scan: 200.5 ms. The range version sought into `telemetry_ts` and read only the 57,600 rows of that day: 11.2 ms. `EXTRACT` behaves the same way.

::: warning EXTRACT(month) is not the same question
`EXTRACT(month FROM ts) = 3` means "March of *any* year". Over one year of data the range and the EXTRACT agree. Over two years they do not. When you rewrite, write the range you actually mean, with the year in it. If you really do want "every March", that is a different query, and a case for an expression index (later in this lesson).
:::

::: warning Do not rewrite into BETWEEN
`ts BETWEEN '2026-03-02' AND '2026-03-03'` is SARGable, but it includes both ends, so the reading at exactly midnight on the 3rd lands in two days. Use `>=` and `<`. And never end a day with `23:59:59`: at 10 Hz that drops ten readings every night.
:::

### Arithmetic on the column

Arithmetic is a function too. "Readings whose time, plus six hours, is past midnight on 31 March":

```sql
WHERE ts + interval '6 hours' >= '2026-03-31 00:00:00+00'
```

gave a parallel sequential scan over all 5,184,000 rows (99.2 ms). Move the six hours across, the way you would in algebra — subtract them from both sides:

```sql
WHERE ts >= timestamptz '2026-03-31 00:00:00+00' - interval '6 hours'
```

```text
 Index Scan using telemetry_ts on telemetry  (actual time=0.010..7.138 rows=72000 loops=1)
   Index Cond: (ts >= ('2026-03-31 00:00:00+00'::timestamp with time zone - '06:00:00'::interval))
 Execution Time: 11.936 ms
```

(Abbreviated.) The subtraction on the right is done once, before the scan. The column is bare, and the index seeks. The answer is the last 30 hours of data: $30 \times 60 \times 40 = 72\,000$ rows, matching `rows=72000`.

## Implicit casts: the function you did not write

Sometimes the function is added for you. `sat_id` is an `integer`. Write the number with a decimal point:

```sql
WHERE sat_id = 3.0 AND ts >= '2026-03-02 00:00:00+00' AND ts < '2026-03-03 00:00:00+00'
```

The plan's filter line reads:

```text
         Filter: ((sat_id)::numeric = 3.0)
```

`3.0` is a `numeric` constant, and there is no `integer = numeric` operator. So PostgreSQL inserts an **implicit cast** — a type conversion you did not write. Converting `integer` to `numeric` loses nothing, so that is the one it picks, and the cast lands on the **column**: `(sat_id)::numeric`. The index on `sat_id` is now blind. Here the planner escaped through the `ts` index; with no time range, the query would read every row.

The rule: match the constant's type to the column's. Write `sat_id = 3`, not `3.0`, and in application code bind parameters with the column's type. Not every mismatch hurts: PostgreSQL compares `integer`, `smallint` and `bigint` with each other inside one index without casting the column. The tell in a plan is always the same: a `::` cast wrapped around the column's name.

::: key Implicit casts
When the constant's type differs from the column's, the database converts one side. If it converts the column, the predicate is no longer SARGable. Match the literal's or parameter's type to the column; look for `(column)::type` in the plan.
:::

## LIKE: a fixed start is a range, a wildcard start is not

`LIKE` matches text against a pattern: `%` stands for any run of characters, `_` for exactly one. In a plan, `LIKE` is printed as `~~`.

A pattern with a **fixed prefix**, like `'gs-svalbard/2026/03/02/%'`, is secretly a range. Every string that starts with those characters sorts between the prefix and "the prefix with its last character bumped up by one". So the index can seek to the prefix and stop at the first string past it. A pattern with a **leading wildcard**, like `'%/sat03_pass017.bin'`, has no fixed start. Matching strings are scattered all through the sorted list, so no seek is possible: `LIKE '%abc'` is never SARGable for a B-tree.

There is a catch. The range trick is only safe when the index is sorted byte by byte. Text is usually sorted by a **[[collation|collation]]** — a language's rules for alphabetical order — and under those rules the trick can miss rows. So PostgreSQL turns `LIKE` into a range only on a byte-ordered index. Two ways to get one:

- `CREATE INDEX … (path text_pattern_ops)` — an **operator class** that tells the B-tree to sort byte by byte, for pattern matching;
- an index (or column) with `COLLATE "C"`, which is byte-by-byte order by definition.

::: example Finding one day's downlink files
A second table lists 810,000 files written by six ground stations, one row per pass file:

```text
                  path
----------------------------------------
 gs-alaska/2026/01/01/sat01_pass001.bin
 gs-alaska/2026/01/01/sat02_pass001.bin
```

It has a plain B-tree index on `path`, in a database whose default collation is `C.UTF-8`, which PostgreSQL 16 does not treat as byte order for `LIKE`. Question: how many files did the Svalbard station write on 2 March?

**Before.**

```sql
EXPLAIN ANALYZE SELECT count(*) FROM downlink_file
WHERE path LIKE 'gs-svalbard/2026/03/02/%';
```

```text
               ->  Parallel Seq Scan on downlink_file  (actual time=9.156..13.608 rows=500 loops=3)
                     Filter: (path ~~ 'gs-svalbard/2026/03/02/%'::text)
                     Rows Removed by Filter: 269500
 Execution Time: 17.241 ms
```

(Abbreviated.) A full scan: $3 \times (500 + 269\,500) = 810\,000$ rows read, 1500 kept.

**After.** Add a pattern index and ask again:

```sql
CREATE INDEX downlink_file_path_pat ON downlink_file (path text_pattern_ops);
```

```text
   ->  Index Only Scan using downlink_file_path_pat on downlink_file  (actual time=0.030..0.227 rows=1500 loops=1)
         Index Cond: ((path ~>=~ 'gs-svalbard/2026/03/02/'::text) AND (path ~<~ 'gs-svalbard/2026/03/020'::text))
         Filter: (path ~~ 'gs-svalbard/2026/03/02/%'::text)
 Execution Time: 0.301 ms
```

(Abbreviated.) Read the `Index Cond`. `~>=~` and `~<~` are the byte-order versions of `>=` and `<`. PostgreSQL turned the pattern into a half-open range: from the prefix, up to the prefix with its final `/` bumped to the next character, `0`. The same trick as before, done for you.

**Answer:** 1500 files, which is 10 satellites times 150 passes, in 0.30 ms instead of 17.2 ms. A search for `'%/sat03_pass017.bin'`, with its leading wildcard, stayed a full scan (38.4 ms) even with the new index.
:::

::: warning The underscore is a wildcard
In `LIKE 'sat03_pass%'`, the `_` matches *any* single character, so `sat03Xpass` would match too. To mean a literal underscore, escape it: `LIKE 'sat03\_pass%'`. A leading `_` is as bad as a leading `%` for the index.
:::

For searches that really need a wildcard in front — "any file for satellite 3" — a B-tree cannot help. That is the job of a trigram index (the `pg_trgm` extension, which builds a GIN index from lesson 05 over every three-character piece of the text), or of storing the satellite in its own column so the question becomes `sat_id = 3`.

## OR, IN and UNION

`IN` is SARGable: `sat_id IN (3, 7)` becomes `sat_id = ANY ('{3,7}')`, and a B-tree can seek once per value. An `OR` between conditions that are *each* SARGable is also fine in PostgreSQL. It runs a separate index scan for each side and merges the results with a **BitmapOr**:

```sql
WHERE (sat_id = 3 AND ts >= '2026-03-02' AND ts < '2026-03-03')
   OR (sat_id = 7 AND ts >= '2026-03-10' AND ts < '2026-03-11')
```

```text
   ->  Bitmap Heap Scan on telemetry  (actual time=0.600..8.846 rows=11520 loops=1)
         ->  BitmapOr  (actual time=0.482..0.484 rows=0 loops=1)
               ->  Bitmap Index Scan on telemetry_sat_ts  (actual time=0.245..0.246 rows=5760 loops=1)
               ->  Bitmap Index Scan on telemetry_sat_ts  (actual time=0.237..0.237 rows=5760 loops=1)
 Execution Time: 9.542 ms
```

(Abbreviated; the `Index Cond` lines are removed.) Two seeks, 5760 rows each, merged: 11,520.

The trap is an `OR` with **one** branch the index cannot serve. Replace the second branch with `value < 1.0` (there is no index on `value`) and the planner is stuck. To find the rows where `value < 1.0` it must read every row anyway, so it tests both branches on every row: a full parallel scan, 234.0 ms. An `OR` is only as SARGable as its worst branch.

The classic rewrite is to split the `OR` into two queries glued with `UNION`, so each half gets its own access path:

```sql
SELECT … WHERE <branch A>
UNION
SELECT … WHERE <branch B>
```

It pays off when each branch is SARGable on its own index but the planner fails to combine them — common in other databases, and in PostgreSQL when the branches test columns of *different* joined tables. It cannot rescue a branch that is not SARGable at all: that half still reads everything. `UNION` removes duplicates, so a row matching both branches is kept once; use `UNION ALL` only when the branches cannot overlap.

## Expression indexes: the other way out

When you cannot change the query, or the question really is about the transformed value ("every March, any year"), change the index instead. An **expression index** stores the result of an expression for each row, sorted:

```sql
CREATE INDEX telemetry_day_utc ON telemetry (date_trunc('day', ts, 'UTC'));
```

A query whose predicate uses *exactly* the same expression can now seek:

```text
   ->  Index Scan using telemetry_day_utc on telemetry  (actual time=0.035..6.499 rows=57600 loops=1)
         Index Cond: (date_trunc('day'::text, ts, 'UTC'::text) = '2026-03-02 00:00:00+00'::timestamp with time zone)
 Execution Time: 10.139 ms
```

Notice the third argument, `'UTC'`. The obvious index fails:

```sql
CREATE INDEX telemetry_day_bad ON telemetry (date_trunc('day', ts));
-- ERROR:  functions in index expression must be marked IMMUTABLE
```

For a `timestamptz`, "which day" depends on the session's time zone: 23:30 UTC is already tomorrow in Tokyo. The two-argument `date_trunc` reads that setting, so its answer for the same row can change, and an index must never change under a row. PostgreSQL marks such a function **[[STABLE rather than IMMUTABLE|immutable]]** and refuses it. The three-argument form names the zone, gives the same answer forever, and is allowed. `ts::date` fails for the same reason. And the query must say `date_trunc('day', ts, 'UTC')` too: the two-argument form in a `WHERE` clause still does a full scan, because it is a different expression from the one indexed.

The other everyday use is case-insensitive search: an index on `lower(callsign)` serves `WHERE lower(callsign) = 'pathfinder-7'`.

::: warning An expression index is not free
It is one more index that every insert must update — the write cost from lesson 07. This one took 1.5 s to build and 34 MB, about as big as the plain index on `ts` (35 MB). On a telemetry ingest path, prefer rewriting the query into a range on the column you already index. Reach for an expression index when the query cannot be changed.
:::

## The same idea in SQLite

The course's exercises run in SQLite, which has the same B-tree indexes and the same weakness. SQLite stores time as ISO-8601 text such as `'2026-03-02T12:00:00Z'`, and the everyday non-SARGable habit there is `substr(ts, 1, 10) = '2026-03-02'` — "the first ten characters". Ask SQLite how it would run each version with `EXPLAIN QUERY PLAN`, on a table `event_log` with an index on `(sat_id, ts)`:

```sql
EXPLAIN QUERY PLAN SELECT * FROM event_log
WHERE sat_id = 'SAT-001' AND substr(ts, 1, 10) = '2026-03-02';
-- SEARCH event_log USING INDEX idx_event_sat_ts (sat_id=?)

EXPLAIN QUERY PLAN SELECT * FROM event_log
WHERE sat_id = 'SAT-001' AND ts >= '2026-03-02T00:00:00Z' AND ts < '2026-03-03T00:00:00Z';
-- SEARCH event_log USING INDEX idx_event_sat_ts (sat_id=? AND ts>? AND ts<?)
```

**SEARCH** means SQLite seeks in the index; **SCAN** means it reads the whole table. The first plan seeks on `sat_id` only, like PostgreSQL's did; the second seeks on both columns. Without the `sat_id` condition, `substr(ts, 1, 10) = …` gives `SCAN event_log`, and so does `ts LIKE '2026-03-02%'` (SQLite's `LIKE` ignores case by default, so an ordinary index cannot serve it). The half-open range on ISO text is the fix here too. The rules of this lesson carry over, almost word for word, to [[every major SQL database|further-reading]].

## Check yourself

::: check
Which of these can seek in a B-tree on `ts`? (a) `ts < now() - interval '1 hour'` (b) `now() - ts < interval '1 hour'` (c) `ts::date >= '2026-03-01'` (d) `ts >= '2026-03-01 00:00:00+00'`
:::

::: answer
(a) and (d). In (a) the column is bare and the right side, `now() - interval '1 hour'`, is worked out once before the scan. (d) is a plain comparison against a constant. (b) buries `ts` inside a subtraction; rewrite it by moving `now()` across: `now() - ts < 1 h` is the same as `ts > now() - 1 h`. (c) casts the column; `ts::date >= '2026-03-01'` means the same as `ts >= '2026-03-01 00:00:00+00'` for a UTC session, so write that.
:::

::: check
A query sent by a data-pipeline program shows this plan line under a `Parallel Seq Scan`: `Filter: ((sat_id)::numeric = '3'::numeric)`. The column `sat_id` is an `integer` with an index. What happened, and how do you fix it?
:::

::: answer
The program sent the satellite number as a `numeric` parameter (some drivers send every number that way). There is no `integer = numeric` operator, so PostgreSQL cast the *column* up to `numeric` — the `(sat_id)::numeric` in the filter is the proof — and with the column wrapped, the index cannot be searched. Fix it where the value is sent: bind the parameter as an integer type, or write `sat_id = 3` so the constant takes the column's type. Afterwards the plan shows `Index Cond: (sat_id = '3'::bigint)` or `(sat_id = 3)`, and the full scan is gone. (A `bigint` parameter is fine: PostgreSQL can compare integers of different sizes inside the index without casting the column.)
:::

::: check
Rewrite `WHERE date_trunc('hour', ts) = '2026-03-02 14:00:00+00'` so that it can use the index on `ts`, and say which of the endpoints are included.
:::

::: answer
`WHERE ts >= '2026-03-02 14:00:00+00' AND ts < '2026-03-02 15:00:00+00'`. The start, 14:00:00 exactly, is included, because `date_trunc` of 14:00:00 is 14:00. The end, 15:00:00, is excluded, because a reading at 15:00 truncates to 15:00, not 14:00. Every reading from 14:00:00.000000 up to 14:59:59.999999 is in — nothing is lost at the end of the hour.
:::

::: check
Which of these can a B-tree with `text_pattern_ops` serve with a seek: `LIKE 'EPS%'`, `LIKE '%_V'`, `LIKE 'gs-perth/2026/0_/15/%'`?
:::

::: answer
`LIKE 'EPS%'` can: it is the range from `EPS` up to, but not including, `EPT`. `LIKE '%_V'` cannot: it starts with a wildcard, so matches are scattered through the sorted list. The third partly can. The fixed prefix stops at the first wildcard, the `_`, so the index seeks the strings starting `gs-perth/2026/0` (the first nine months of 2026) and tests the rest of the pattern row by row as a `Filter`.
:::

::: check
Your colleague writes `WHERE sat_id = 3 OR lower(channel) = 'eps_batt_v'`. The table has indexes on `(sat_id, ts)` and `(channel, ts)`. Will PostgreSQL use them? What would you change?
:::

::: answer
No. The second branch wraps `channel` in `lower()`, so it cannot use the channel index, and to find its rows the database must read every row. Because an `OR` keeps a row that matches *either* branch, the whole condition then becomes a full scan: an `OR` is only as SARGable as its worst branch. Fix the branch: the channel names are stored in upper case, so write `channel = 'EPS_BATT_V'`. Now both branches are SARGable, and PostgreSQL can combine two bitmap index scans with a BitmapOr. If mixed case really does occur in the data, build an expression index on `lower(channel)` instead.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| SARGable | the predicate can be answered by seeking in an index |
| The shape | bare column, then `=`, `<`, `<=`, `>`, `>=`, `BETWEEN`, `IN` or a prefix `LIKE`, then a value computed once |
| Killers | functions (`date_trunc`, `EXTRACT`, `lower`, `substr`), casts (`ts::date`), arithmetic (`ts + interval`), implicit casts, leading wildcards, `OR` with one bad branch |
| The rewrite | move the work to the constant side; for days and hours, use the half-open range `ts >= t0 AND ts < t1` |
| Plan tell | the condition sits in `Filter`, not `Index Cond`; a `(column)::type` cast |
| Prefix `LIKE` | needs `text_pattern_ops` or `COLLATE "C"` unless the database collation is C |
| Expression index | stores `f(column)`; the query must use the same expression; the function must be IMMUTABLE |
| SQLite | `EXPLAIN QUERY PLAN`: SEARCH seeks, SCAN reads everything; use ISO text ranges, not `substr` |

Rewriting predicates makes one query touch fewer rows. The next lesson works at a bigger scale: splitting the table itself by time, so whole months are skipped or dropped at once, and precomputing the summaries that dashboards ask for every few seconds.

::: context sarg-origin Where the odd word comes from
"SARG" comes from IBM's System R, the research database of the 1970s that also gave the world SQL. Its 1979 paper on how to choose an access path, by Patricia Selinger and colleagues, called simple column-versus-value conditions "search arguments", or SARGs, because the storage layer could take them as arguments to its scans. Database people later turned the noun into an adjective. The word is ugly, and nobody has found a better one, so you will hear it in code reviews at any company that runs SQL.
:::

::: context black-box Why the planner does not look inside date_trunc
To use an index for `f(ts) = c`, the planner would need to know that `f` keeps the sorted order and how to undo it: which `ts` values give `c`. For `date_trunc` a human sees that at once. But PostgreSQL has thousands of functions, including ones users write themselves, and most do not keep order at all. `sin(ts)`, `abs(value)` and `lower(name)` all scramble it. Rather than keep a special rulebook for a few friendly functions, the planner uses one safe rule: a function of the column is evaluated per row. That rule is predictable, and predictable beats clever when you are reading plans.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">Index on ts: entries sorted by time</text>
  <rect x="10" y="28" width="340" height="30" fill="#ffffff" stroke="#1f2a44"/>
  <line x1="95" y1="28" x2="95" y2="58" stroke="#1f2a44"/>
  <line x1="180" y1="28" x2="180" y2="58" stroke="#1f2a44"/>
  <line x1="265" y1="28" x2="265" y2="58" stroke="#1f2a44"/>
  <rect x="180" y="28" width="85" height="30" fill="#8fb8f0"/>
  <text x="52" y="48" font-size="11" fill="#1f2a44" text-anchor="middle">28 Feb</text>
  <text x="137" y="48" font-size="11" fill="#1f2a44" text-anchor="middle">1 Mar</text>
  <text x="222" y="48" font-size="11" fill="#1f2a44" text-anchor="middle">2 Mar</text>
  <text x="307" y="48" font-size="11" fill="#1f2a44" text-anchor="middle">3 Mar</text>
  <line x1="180" y1="66" x2="180" y2="86" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="265" y1="66" x2="265" y2="86" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="100" font-size="11" fill="#1d6fd1" text-anchor="middle">seek: ts &gt;= t0</text>
  <text x="265" y="116" font-size="11" fill="#1d6fd1" text-anchor="middle">stop: ts &lt; t1</text>
  <text x="10" y="142" font-size="12" fill="#b4232c">date_trunc('day', ts) = '2 Mar':</text>
  <text x="10" y="160" font-size="12" fill="#b4232c">the index holds ts, not the day, so every entry is tested</text>
</svg>
```
:::

::: context parallel-workers Three processes, one query
`Workers Planned: 2` means PostgreSQL started two helper processes for the scan, plus the main process: three in all. Each reads part of the table, and a `Gather` node collects their results. That is why the scan line says `loops=3`: the node ran three times, once per process. Row counts and times on such a line are averages per loop, so multiply by the loops to get totals. Parallel workers make a full scan finish sooner, but the machine still reads every page — three people reading the phone book, instead of one looking up a name.
:::

::: context collation Why alphabetical order is not simple
A collation is a set of rules for sorting text. In byte order (the "C" collation), every capital letter comes before every small letter, so "Zulu" sorts before "alpha". Human-language collations fix that, and they also do things like ignoring hyphens on a first pass or treating accented letters as near their plain ones. Under such rules, strings starting "gs-svalbard" need not sit in one neat block, so the range trick for `LIKE` could miss rows. Byte order has no such surprises, which is why the prefix trick demands it. Telemetry identifiers such as channel names and file paths are machine-made ASCII, so byte order is the right order for them anyway.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">Byte order ("C")</text>
  <text x="270" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">English dictionary order</text>
  <rect x="20" y="28" width="140" height="110" fill="#ffffff" stroke="#1f2a44"/>
  <rect x="200" y="28" width="140" height="110" fill="#ffffff" stroke="#1f2a44"/>
  <text x="32" y="50" font-size="12" fill="#1f2a44">Bravo</text>
  <text x="32" y="72" font-size="12" fill="#1f2a44">Zulu</text>
  <text x="32" y="94" font-size="12" fill="#1f2a44">alpha</text>
  <text x="32" y="116" font-size="12" fill="#1f2a44">charlie</text>
  <text x="212" y="50" font-size="12" fill="#1f2a44">alpha</text>
  <text x="212" y="72" font-size="12" fill="#1f2a44">Bravo</text>
  <text x="212" y="94" font-size="12" fill="#1f2a44">charlie</text>
  <text x="212" y="116" font-size="12" fill="#1f2a44">Zulu</text>
</svg>
```
:::

::: context immutable IMMUTABLE, STABLE and VOLATILE
Every PostgreSQL function carries a label saying how far you can trust it to repeat itself. IMMUTABLE: the same inputs always give the same output, forever — `lower('ABC')`, or `date_trunc` with a named zone. STABLE: the same answer within one query, but it may depend on settings such as the session's time zone — two-argument `date_trunc` on a `timestamptz`, or `now()`. VOLATILE: may change on every call — `random()`. An index stores results to be looked up later, maybe years later, by sessions in other time zones, so only IMMUTABLE functions are allowed in one. The error message is PostgreSQL protecting you from an index that would silently disagree with its own table.
:::

::: context further-reading Where to read more
Markus Winand's free site *Use The Index, Luke!* is the classic treatment of everything in this lesson, with examples for PostgreSQL, SQLite, MySQL, Oracle and SQL Server side by side. Its chapter on functions in the WHERE clause is worth reading after this lesson. The PostgreSQL manual's pages on "Indexes on Expressions" and "Operator Classes and Operator Families" cover expression indexes and `text_pattern_ops` exactly.
:::
