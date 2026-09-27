---
id: l06-deduplication-and-latest-per-key
title: Deduplicating and picking the latest per key
minutes: 21
covers:
  - Deduplication with ROW_NUMBER filtered to 1
  - DISTINCT ON in PostgreSQL for latest-per-key
---

Your phone backs up your photos. The Wi-Fi drops halfway through, the phone is not sure the upload finished, so it sends the same photo again. Now the album has two copies. Nobody wants to delete photos by hand, so a good app notices "same photo, same moment" and keeps one. And when you open a friend's profile, you do not want every picture they ever posted — you want the latest one.

Those two jobs have names. **Deduplication** means finding rows that describe the same thing and keeping exactly one of each. **Latest per key** means keeping, for each thing you track — each satellite, each sensor — only its most recent row. They look like different problems, but in SQL they are the same pattern with one word changed.

Both are daily work with telemetry. The same frame from a satellite is often [[received twice|why-duplicates]], by two ground stations or by one station that asked for a resend. A dashboard's "current status" panel is a latest-per-key query over thousands of satellites and channels. This lesson builds both from ROW_NUMBER, which you met in lesson 02, and the "window in a CTE, filter outside" shape from lesson 01. Then it shows PostgreSQL's shortcut, `DISTINCT ON`, and what to write in SQLite, which does not have it.

## A table with duplicates

Here is this lesson's table. Each row is one sample of one **channel** — one measured quantity, such as state of charge (`soc`) or battery temperature (`temp`) — as it arrived on the ground.

```sql
CREATE TABLE tlm (
    ingest_id INTEGER      PRIMARY KEY,  -- numbered by the ground system as rows arrive
    sat_id    TEXT         NOT NULL,
    channel   TEXT         NOT NULL,
    ts        TIMESTAMPTZ  NOT NULL,     -- when the satellite took the sample
    value     NUMERIC(6,2) NOT NULL,
    station   TEXT         NOT NULL,     -- which ground station received it
    rx_at     TIMESTAMPTZ  NOT NULL      -- when the station received it
);

INSERT INTO tlm VALUES
  ( 1,'SAT-001','soc', '2026-03-01T00:00:00Z', 0.90,'svalbard','2026-03-01T00:04:12Z'),
  ( 2,'SAT-001','soc', '2026-03-01T00:00:00Z', 0.90,'troll',   '2026-03-01T00:04:12Z'),
  ( 3,'SAT-001','temp','2026-03-01T00:00:00Z',18.5, 'svalbard','2026-03-01T00:04:12Z'),
  ( 4,'SAT-001','soc', '2026-03-01T00:10:00Z', 0.85,'svalbard','2026-03-01T00:14:05Z'),
  ( 5,'SAT-001','soc', '2026-03-01T00:20:00Z', 0.70,'svalbard','2026-03-01T00:24:30Z'),
  ( 6,'SAT-001','soc', '2026-03-01T00:20:00Z', 0.70,'svalbard','2026-03-01T00:24:30Z'),
  ( 7,'SAT-001','temp','2026-03-01T00:20:00Z',19.0, 'svalbard','2026-03-01T00:24:30Z'),
  ( 8,'SAT-002','soc', '2026-03-01T00:00:00Z', 0.50,'hawaii',  '2026-03-01T00:03:40Z'),
  ( 9,'SAT-002','soc', '2026-03-01T00:10:00Z', 0.55,'hawaii',  '2026-03-01T00:13:50Z'),
  (10,'SAT-002','soc', '2026-03-01T00:10:00Z', 0.56,'chile',   '2026-03-01T00:13:58Z'),
  (11,'SAT-002','temp','2026-03-01T00:10:00Z',21.2, 'hawaii',  '2026-03-01T00:13:50Z');
```

Two columns hold two different times, and it matters which is which. `ts` is when the satellite *took* the sample. `rx_at` is when the ground *received* it, a few minutes later, once the satellite passed over a station.

One sample is identified by three columns together: `sat_id`, `channel` and `ts`. That combination is the **key** here — the thing that should be unique and is not. Grouping on it, as you learned in the joins module, finds the duplicates:

```sql
SELECT sat_id, channel, ts, COUNT(*) AS copies
FROM tlm
GROUP BY sat_id, channel, ts
HAVING COUNT(*) > 1
ORDER BY sat_id, channel, ts;
```

```text
 sat_id  | channel |           ts           | copies
---------+---------+------------------------+--------
 SAT-001 | soc     | 2026-03-01 00:00:00+00 |      2
 SAT-001 | soc     | 2026-03-01 00:20:00+00 |      2
 SAT-002 | soc     | 2026-03-01 00:10:00+00 |      2
```

Three samples arrived twice, each in a different way:

- **Rows 1 and 2:** the same frame heard by two stations, Svalbard and Troll, at the same second.
- **Rows 5 and 6:** an exact copy, every column equal. The ground system logged one frame twice.
- **Rows 9 and 10:** two stations, and the copies *disagree*: 0.55 against 0.56. One of them picked up a [[bit error|bit-errors]] on the way down.

Eleven rows describe eight real samples. The goal is those eight.

## Why DISTINCT is not enough

The first tool people reach for is DISTINCT, from the first SQL module. It removes output rows that are equal in every column you selected:

```sql
SELECT COUNT(*) FROM (SELECT DISTINCT sat_id, channel, ts, value, station, rx_at FROM tlm) d;   -- 10
SELECT COUNT(*) FROM (SELECT DISTINCT sat_id, channel, ts, value FROM tlm) d;                   -- 9
```

With all the columns, DISTINCT removes only the exact copy (rows 5 and 6), leaving 10 rows. Rows 1 and 2 differ in `station`, so they stay. Drop `station` and `rx_at` from the list, and rows 1 and 2 merge too, leaving 9. But rows 9 and 10 still differ in `value`, so both stay.

DISTINCT can only say "these rows are identical". It cannot say "these rows are the same *sample*, keep the better one". For that you need to decide two things yourself: which rows count as the same, and which one of them you prefer.

## Number the copies, keep number 1

Picture a lost-and-found desk. Every item is tagged with its owner's name. For each owner, the staff line up that owner's items by some rule — newest first, say — and number them 1, 2, 3. Then they hand back only the items tagged 1. Every owner gets exactly one item back, whatever the number of items they had.

That is the pattern, with ROW_NUMBER doing the numbering:

- **PARTITION BY** says which rows are "the same thing": here, `sat_id, channel, ts`.
- **ORDER BY** says which copy you prefer: here, the one received first, `rx_at`, and then the lower `ingest_id` if two arrived in the same second.
- ROW_NUMBER hands out 1, 2, 3 within each partition, in that order.

```sql
SELECT ingest_id, sat_id, channel, ts, value, station,
       ROW_NUMBER() OVER (PARTITION BY sat_id, channel, ts
                          ORDER BY rx_at, ingest_id) AS rn
FROM tlm
ORDER BY sat_id, channel, ts, rn;
```

```text
 ingest_id | sat_id  | channel |           ts           | value | station  | rn
-----------+---------+---------+------------------------+-------+----------+----
         1 | SAT-001 | soc     | 2026-03-01 00:00:00+00 |  0.90 | svalbard |  1
         2 | SAT-001 | soc     | 2026-03-01 00:00:00+00 |  0.90 | troll    |  2
         4 | SAT-001 | soc     | 2026-03-01 00:10:00+00 |  0.85 | svalbard |  1
         5 | SAT-001 | soc     | 2026-03-01 00:20:00+00 |  0.70 | svalbard |  1
         6 | SAT-001 | soc     | 2026-03-01 00:20:00+00 |  0.70 | svalbard |  2
         3 | SAT-001 | temp    | 2026-03-01 00:00:00+00 | 18.50 | svalbard |  1
         7 | SAT-001 | temp    | 2026-03-01 00:20:00+00 | 19.00 | svalbard |  1
         8 | SAT-002 | soc     | 2026-03-01 00:00:00+00 |  0.50 | hawaii   |  1
         9 | SAT-002 | soc     | 2026-03-01 00:10:00+00 |  0.55 | hawaii   |  1
        10 | SAT-002 | soc     | 2026-03-01 00:10:00+00 |  0.56 | chile    |  2
        11 | SAT-002 | temp    | 2026-03-01 00:10:00+00 | 21.20 | hawaii   |  1
```

Every sample that arrived once got `rn` = 1. Every duplicate got a 1 and a 2. [[Keeping the 1s|keep-the-ones]] keeps exactly one copy of everything.

### Filter in the next step

The filter `rn = 1` cannot go in the same SELECT's WHERE:

```sql
SELECT ingest_id, sat_id, channel, ts, value
FROM tlm
WHERE ROW_NUMBER() OVER (PARTITION BY sat_id, channel, ts ORDER BY rx_at) = 1;
```

```text
ERROR:  window functions are not allowed in WHERE
```

This is lesson 01's rule. On the query's assembly line, WHERE runs before the window functions are computed, so when WHERE looks for `rn`, there is no `rn` yet. SQLite refuses too, with `misuse of window function ROW_NUMBER()`.

::: key Window functions in WHERE
Can you use a window function in a WHERE clause? No: windows are evaluated after WHERE, in the SELECT stage. Compute it in a subquery or a CTE and filter on the result in the outer query, which is exactly the shape of the deduplication pattern.
:::

So compute the number in one step and filter in the next. With a CTE:

::: example Deduplicate the downlink
**Step 1.** The CTE `numbered` is the query above: every row, with its `rn`. Nothing is removed yet, so each window sees all the copies.

**Step 2.** The outer query treats `numbered` as a table. `rn` is now an ordinary column, and WHERE can test it.

```sql
WITH numbered AS (
    SELECT ingest_id, sat_id, channel, ts, value, station,
           ROW_NUMBER() OVER (PARTITION BY sat_id, channel, ts
                              ORDER BY rx_at, ingest_id) AS rn
    FROM tlm
)
SELECT ingest_id, sat_id, channel, ts, value, station
FROM numbered
WHERE rn = 1
ORDER BY sat_id, channel, ts;
```

```text
 ingest_id | sat_id  | channel |           ts           | value | station
-----------+---------+---------+------------------------+-------+----------
         1 | SAT-001 | soc     | 2026-03-01 00:00:00+00 |  0.90 | svalbard
         4 | SAT-001 | soc     | 2026-03-01 00:10:00+00 |  0.85 | svalbard
         5 | SAT-001 | soc     | 2026-03-01 00:20:00+00 |  0.70 | svalbard
         3 | SAT-001 | temp    | 2026-03-01 00:00:00+00 | 18.50 | svalbard
         7 | SAT-001 | temp    | 2026-03-01 00:20:00+00 | 19.00 | svalbard
         8 | SAT-002 | soc     | 2026-03-01 00:00:00+00 |  0.50 | hawaii
         9 | SAT-002 | soc     | 2026-03-01 00:10:00+00 |  0.55 | hawaii
        11 | SAT-002 | temp    | 2026-03-01 00:10:00+00 | 21.20 | hawaii
```

**Step 3. Check.** Eight rows, one per real sample, as the GROUP BY count promised: 11 rows minus 3 extra copies. The disagreeing pair kept Hawaii's 0.55, because Hawaii received it at 00:13:50, eight seconds before Chile. Rows 1 and 2 arrived in the same second, so `ingest_id` decided: row 1 wins.

**Step 4. Sanity check.** Run the GROUP BY ... HAVING query on this result and it returns nothing: no key appears twice.
:::

The same thing works with a subquery in FROM instead of a CTE. Give it a name (`AS n`); PostgreSQL before version 16 insists on one, and it never hurts:

```sql
SELECT sat_id, channel, ts, value
FROM (
    SELECT sat_id, channel, ts, value,
           ROW_NUMBER() OVER (PARTITION BY sat_id, channel, ts
                              ORDER BY rx_at, ingest_id) AS rn
    FROM tlm
) AS n
WHERE rn = 1;
```

Some databases, but not PostgreSQL or SQLite, offer a [[QUALIFY|qualify]] clause that filters on a window directly.

::: key Deduplicating with ROW_NUMBER
Number rows within each key by a preference order, then keep the rows numbered 1. It is the standard way to take the latest reading per satellite per channel when duplicate downlinks exist.
:::

## Choosing the winner, every time

The ORDER BY inside OVER is your **preference order**: it decides which copy is "number 1". Two rules make it trustworthy.

**State a real preference.** "Earliest received" is one choice. Others are common: prefer a frame whose checksum passed, prefer a primary station over a backup, prefer the most recently *corrected* value. Whatever you choose, it should be something you could defend in a review, because when copies disagree — like 0.55 against 0.56 — this line of SQL decides which number the whole fleet sees.

**End with something unique.** Rows 1 and 2 have the same `rx_at`. If the ORDER BY were only `rx_at`, those two rows would tie, and ROW_NUMBER would still hand out a 1 and a 2 — but which row gets the 1 is not defined. The database may pick Svalbard today and Troll after the table has been [[reorganised on disk|nondeterminism]]. Here the two copies hold the same value, so nobody would notice. With a disagreeing pair, the dashboard would flicker between two numbers with no change to the data. Adding `ingest_id`, which is unique, as the last ORDER BY column makes the order complete, so the same input always gives the same output. That property is called being **deterministic**.

::: warning A tie in the preference order
If two copies tie on every ORDER BY column, ROW_NUMBER picks between them arbitrarily, and may pick differently next time. Always finish the ORDER BY inside OVER with a column that is unique within the partition, such as an ingest id or a primary key.
:::

### Why ROW_NUMBER and not RANK

Lesson 02 showed that RANK gives tied rows the *same* number. Swap it in with ORDER BY `rx_at` alone, and rows 1 and 2 both get rank 1, as do the identical rows 5 and 6:

```sql
SELECT ingest_id, sat_id, channel, ts, station,
       RANK() OVER (PARTITION BY sat_id, channel, ts ORDER BY rx_at) AS rnk
FROM tlm
WHERE sat_id = 'SAT-001' AND channel = 'soc'
ORDER BY ts, ingest_id;
```

```text
 ingest_id | sat_id  | channel |           ts           | station  | rnk
-----------+---------+---------+------------------------+----------+-----
         1 | SAT-001 | soc     | 2026-03-01 00:00:00+00 | svalbard |   1
         2 | SAT-001 | soc     | 2026-03-01 00:00:00+00 | troll    |   1
         4 | SAT-001 | soc     | 2026-03-01 00:10:00+00 | svalbard |   1
         5 | SAT-001 | soc     | 2026-03-01 00:20:00+00 | svalbard |   1
         6 | SAT-001 | soc     | 2026-03-01 00:20:00+00 | svalbard |   1
```

Filter on `rnk = 1` over the whole table and 10 rows survive, not 8: the "deduplicated" table still has two duplicates in it. DENSE_RANK fails the same way.

::: key ROW_NUMBER for deduplication
ROW_NUMBER is always distinct; RANK leaves gaps after ties (1,1,3); DENSE_RANK does not (1,1,2). For deduplication you want ROW_NUMBER, because ties must still resolve to one row.
:::

## Latest per key: the same pattern, a different partition

Now the dashboard question: what is the *current* value of each channel on each satellite? That is the same lost-and-found desk with a different tag. The "thing" is now a satellite and channel, `PARTITION BY sat_id, channel`, and the preference is "newest sample first", `ORDER BY ts DESC`.

::: example Latest reading per satellite per channel
**Step 1.** Partition by the key you want one row for: `sat_id, channel`.

**Step 2.** Order by preference. Newest sample first is `ts DESC` (read "descending": largest, which for times means latest, first). After that, the dedup preferences still apply, because the newest sample may itself have arrived twice: `rx_at`, then `ingest_id`.

**Step 3.** Keep number 1.

```sql
WITH numbered AS (
    SELECT sat_id, channel, ts, value, station,
           ROW_NUMBER() OVER (PARTITION BY sat_id, channel
                              ORDER BY ts DESC, rx_at, ingest_id) AS rn
    FROM tlm
)
SELECT sat_id, channel, ts, value, station
FROM numbered
WHERE rn = 1
ORDER BY sat_id, channel;
```

```text
 sat_id  | channel |           ts           | value | station
---------+---------+------------------------+-------+----------
 SAT-001 | soc     | 2026-03-01 00:20:00+00 |  0.70 | svalbard
 SAT-001 | temp    | 2026-03-01 00:20:00+00 | 19.00 | svalbard
 SAT-002 | soc     | 2026-03-01 00:10:00+00 |  0.55 | hawaii
 SAT-002 | temp    | 2026-03-01 00:10:00+00 | 21.20 | hawaii
```

**Step 4. Check.** Two satellites times two channels is four keys, and there are four rows. SAT-001's newest `soc` sample is 00:20, and it arrived twice (rows 5 and 6); exactly one copy came back. SAT-002's newest `soc` is the disagreeing pair at 00:10, and the query kept 0.55, the same winner the dedup example chose, because the same tie-breakers follow `ts DESC`.
:::

::: warning Forgetting DESC
`ORDER BY ts` without DESC puts the *oldest* sample first, and "keep number 1" then returns the earliest reading per key. The query runs and looks plausible. On this table it would show SAT-001's charge as 0.90 instead of 0.70 — a battery looking healthier than it is.
:::

### Two tempting shortcuts, and why they fail

**MAX of the value.** `SELECT sat_id, channel, MAX(value) ... GROUP BY sat_id, channel` gives the *largest* value, not the latest. For SAT-001's `soc` it returns 0.90, the reading from 00:00, while the battery now sits at 0.70.

**MAX of the time, joined back.** Find each key's newest `ts` with GROUP BY, then join back to fetch the value:

```sql
SELECT t.sat_id, t.channel, t.ts, t.value, t.station
FROM tlm AS t
JOIN (SELECT sat_id, channel, MAX(ts) AS max_ts
      FROM tlm GROUP BY sat_id, channel) AS m
  ON m.sat_id = t.sat_id AND m.channel = t.channel AND m.max_ts = t.ts
ORDER BY t.sat_id, t.channel, t.ingest_id;
```

```text
 sat_id  | channel |           ts           | value | station
---------+---------+------------------------+-------+----------
 SAT-001 | soc     | 2026-03-01 00:20:00+00 |  0.70 | svalbard
 SAT-001 | soc     | 2026-03-01 00:20:00+00 |  0.70 | svalbard
 SAT-001 | temp    | 2026-03-01 00:20:00+00 | 19.00 | svalbard
 SAT-002 | soc     | 2026-03-01 00:10:00+00 |  0.55 | hawaii
 SAT-002 | soc     | 2026-03-01 00:10:00+00 |  0.56 | chile
 SAT-002 | temp    | 2026-03-01 00:10:00+00 | 21.20 | hawaii
```

Six rows for four keys. The join matched *every* row carrying the newest time, and the newest samples of both `soc` channels were duplicated. This is the fan-out you met in the joins module. It gets the right answer only when the table has no duplicates — the one thing you cannot promise with downlinked data. ROW_NUMBER always returns one row per key.

### Latest N, and dedup first

Change `rn = 1` to `rn <= 3` and you get the three newest readings per key. But mind the duplicates: on this raw table, SAT-001's two newest `soc` rows are the two copies of 00:20. The safe order is to deduplicate first, then rank by time, as two CTEs:

```sql
WITH deduped AS (
    SELECT sat_id, channel, ts, value
    FROM (
        SELECT sat_id, channel, ts, value,
               ROW_NUMBER() OVER (PARTITION BY sat_id, channel, ts
                                  ORDER BY rx_at, ingest_id) AS copy_no
        FROM tlm
    ) AS c
    WHERE copy_no = 1
),
newest AS (
    SELECT sat_id, channel, ts, value,
           ROW_NUMBER() OVER (PARTITION BY sat_id, channel ORDER BY ts DESC) AS age_rank
    FROM deduped
)
SELECT sat_id, channel, ts, value, age_rank
FROM newest
WHERE age_rank <= 2
ORDER BY sat_id, channel, age_rank;
```

```text
 sat_id  | channel |           ts           | value | age_rank
---------+---------+------------------------+-------+----------
 SAT-001 | soc     | 2026-03-01 00:20:00+00 |  0.70 |        1
 SAT-001 | soc     | 2026-03-01 00:10:00+00 |  0.85 |        2
 SAT-001 | temp    | 2026-03-01 00:20:00+00 | 19.00 |        1
 SAT-001 | temp    | 2026-03-01 00:00:00+00 | 18.50 |        2
 SAT-002 | soc     | 2026-03-01 00:10:00+00 |  0.55 |        1
 SAT-002 | soc     | 2026-03-01 00:00:00+00 |  0.50 |        2
 SAT-002 | temp    | 2026-03-01 00:10:00+00 | 21.20 |        1
```

Seven rows: two per key, except SAT-002's `temp`, which only ever had one sample. After deduplication each `ts` is unique within its key, so `ts DESC` alone is a complete order in the second step.

## DISTINCT ON in PostgreSQL

The latest-per-key query is so common that PostgreSQL has a shortcut for it. **DISTINCT ON** keeps the first row of each group, where "first" is decided by the query's ORDER BY:

```sql
SELECT DISTINCT ON (sat_id, channel)
       sat_id, channel, ts, value, station
FROM tlm
ORDER BY sat_id, channel, ts DESC, rx_at, ingest_id;
```

```text
 sat_id  | channel |           ts           | value | station
---------+---------+------------------------+-------+----------
 SAT-001 | soc     | 2026-03-01 00:20:00+00 |  0.70 | svalbard
 SAT-001 | temp    | 2026-03-01 00:20:00+00 | 19.00 | svalbard
 SAT-002 | soc     | 2026-03-01 00:10:00+00 |  0.55 | hawaii
 SAT-002 | temp    | 2026-03-01 00:10:00+00 | 21.20 | hawaii
```

The same four rows as the ROW_NUMBER version. Read `DISTINCT ON (sat_id, channel)` as "one row for each distinct sat id and channel". Here is how it works: PostgreSQL sorts the rows by the ORDER BY, walks down them, and keeps the [[first row of each group|distinct-on-picture]], skipping the rest until the key changes.

That is why the ORDER BY has a rule. Its leftmost columns must be **exactly the DISTINCT ON columns**, so that each group's rows sit together. (PostgreSQL lets those leading columns come in either order, but writing them in the same order as the DISTINCT ON is clearer.) The columns *after* them decide which row of the group comes first, and so which row is kept. Break the rule and PostgreSQL stops you:

```sql
SELECT DISTINCT ON (sat_id, channel) sat_id, channel, ts, value
FROM tlm
ORDER BY ts DESC;
```

```text
ERROR:  SELECT DISTINCT ON expressions must match initial ORDER BY expressions
```

The rule stops a broken query, but not a wrong one. `ORDER BY sat_id, channel, ts` — no DESC — is legal, and keeps the *oldest* row per key: SAT-001's `soc` comes back as 0.90 from 00:00. And with no ORDER BY at all, DISTINCT ON keeps an arbitrary row from each group. The tie-breaking advice is the same as before: end the ORDER BY with something unique.

::: key DISTINCT ON
What is DISTINCT ON in PostgreSQL? A shorthand for the first row per key under a given ORDER BY, which is the latest-per-satellite query in one clause. It is not standard SQL, so the window-function form is the portable equivalent.
:::

::: key The DISTINCT ON ORDER BY rule
`SELECT DISTINCT ON (k1, k2) ... ORDER BY k1, k2, t DESC, tiebreak`: the ORDER BY must begin with the DISTINCT ON expressions; the columns after them choose which row of each group is kept.
:::

DISTINCT ON is short and easy to read, and PostgreSQL often runs it efficiently. The window-function form is longer, but runs on nearly every database and extends naturally to "latest three" or "second latest", which DISTINCT ON cannot express.

## In SQLite

SQLite has no DISTINCT ON. It fails at the parser: `near "ON": syntax error`. The ROW_NUMBER form works unchanged, CTE or subquery, and gives the same four rows, with `ts` printed as the ISO-8601 text it is stored as. Since those strings sort in time order, `ORDER BY ts DESC` still means newest first.

You may also meet an older SQLite trick. When a query has a single `MAX()` or `MIN()` aggregate, SQLite fills the other, non-grouped columns from the row that had the maximum:

```sql
SELECT sat_id, channel, MAX(ts) AS ts, value, station
FROM tlm
GROUP BY sat_id, channel
ORDER BY sat_id, channel;
```

```text
sat_id   channel  ts                    value  station
-------  -------  --------------------  -----  --------
SAT-001  soc      2026-03-01T00:20:00Z  0.7    svalbard
SAT-001  temp     2026-03-01T00:20:00Z  19.0   svalbard
SAT-002  soc      2026-03-01T00:10:00Z  0.55   hawaii
SAT-002  temp     2026-03-01T00:10:00Z  21.2   hawaii
```

It gave the right rows here, but it is a [[SQLite-only behaviour|bare-columns]], PostgreSQL rejects the query outright, and when two rows tie for the maximum — the disagreeing pair at 00:10 — you cannot say which one's `value` you get. Use the ROW_NUMBER form in the exercises and in anything you share.

::: warning One key, one row, one rule
Whatever the tool, write down the key (what "the same thing" means), the preference order (which copy wins), and a final unique tie-breaker. A latest-per-key query missing any of the three either returns too many rows or returns different rows on different days.
:::

## Check yourself

::: check
Using `tlm`, write a query that keeps, for each sample (`sat_id, channel, ts`), the copy received *last* rather than first. Which station's value wins for SAT-002's `soc` at 00:10?
:::

::: answer
Only the preference order changes: newest reception first, then a unique tie-breaker.

```sql
WITH numbered AS (
    SELECT sat_id, channel, ts, value, station,
           ROW_NUMBER() OVER (PARTITION BY sat_id, channel, ts
                              ORDER BY rx_at DESC, ingest_id DESC) AS rn
    FROM tlm
)
SELECT sat_id, channel, ts, value, station
FROM numbered
WHERE rn = 1;
```

For SAT-002 at 00:10, Chile received its copy at 00:13:58 and Hawaii at 00:13:50, so Chile's **0.56** wins. The result still has eight rows: the preference changes which copy survives, never how many.
:::

::: check
A teammate writes the dedup with `ORDER BY rx_at` only (no `ingest_id`). The query returns eight rows every time. Why might the result still differ from one run to the next, and for which sample in this table?
:::

::: answer
Rows 1 and 2 (SAT-001 `soc` at 00:00) have the same `rx_at`, 00:04:12, so they tie in the ORDER BY. ROW_NUMBER still gives them 1 and 2, so the count stays at eight, but which of the two gets the 1 is undefined. One run may keep Svalbard's row and another Troll's. (Rows 5 and 6 tie too, but they are identical in every column except `ingest_id`, so nobody would see a difference.) Here both 00:00 copies hold 0.90, so only the `station` column would change; had they disagreed, the kept value would too. Adding `ingest_id` as a final ORDER BY column fixes it.
:::

::: check
Rewrite the latest-per-key query with DISTINCT ON so that it returns the *earliest* sample per satellite and channel, with the copy received first. Then say what SQLite user would write instead.
:::

::: answer
In PostgreSQL, keep the DISTINCT ON columns first in the ORDER BY and flip the time to ascending:

```sql
SELECT DISTINCT ON (sat_id, channel)
       sat_id, channel, ts, value, station
FROM tlm
ORDER BY sat_id, channel, ts, rx_at, ingest_id;
```

In SQLite, which has no DISTINCT ON, number the rows and keep 1:

```sql
SELECT sat_id, channel, ts, value, station
FROM (
    SELECT sat_id, channel, ts, value, station,
           ROW_NUMBER() OVER (PARTITION BY sat_id, channel
                              ORDER BY ts, rx_at, ingest_id) AS rn
    FROM tlm
) AS n
WHERE rn = 1;
```

Both return four rows; SAT-001's `soc`, for example, comes back as 0.90 at 00:00 from Svalbard.
:::

::: check
Why does `DISTINCT ON (sat_id, channel) ... ORDER BY sat_id, ts DESC, channel` fail, when the ORDER BY mentions both key columns?
:::

::: answer
The rule is about the *leftmost* ORDER BY columns: they must be exactly the DISTINCT ON columns. Here the first two are `sat_id` and `ts`, and `channel` only comes third. Sorted that way, SAT-001's `soc` and `temp` rows are interleaved by time, so rows with the same `(sat_id, channel)` are not next to each other, and "keep the first row of each run of equal keys" would not mean "one per key". PostgreSQL refuses with `SELECT DISTINCT ON expressions must match initial ORDER BY expressions`. The fix is `ORDER BY sat_id, channel, ts DESC, rx_at, ingest_id`: the key first, then the preference.
:::

::: check
The table gains a row `(12,'SAT-002','temp','2026-03-01T00:10:00Z',21.2,'chile','2026-03-01T00:13:58Z')`. How many rows does the MAX-of-time join return now, and how many does the ROW_NUMBER latest-per-key query return?
:::

::: answer
Row 12 is a second copy of SAT-002's newest `temp` sample (same key as row 11, received 8 seconds later).

The MAX-of-time join returns every row whose `ts` equals its key's newest time. Before, that was six rows; now SAT-002 `temp` matches two rows instead of one, so **seven** rows for four keys.

The ROW_NUMBER query still returns **four**: SAT-002's `temp` partition now has rows 11 and 12 at the same `ts`, and the tie-breakers `rx_at, ingest_id` give row 11 (received first) the number 1. One row per key, whatever the duplicates.
:::

## Summary

| Idea | SQL | Point |
| --- | --- | --- |
| Find duplicates | `GROUP BY key HAVING COUNT(*) > 1` | shows which keys have more than one row |
| DISTINCT | `SELECT DISTINCT ...` | removes only rows equal in every selected column; cannot pick a winner |
| Deduplicate | `ROW_NUMBER() OVER (PARTITION BY key ORDER BY preference, unique_col)` in a CTE, then `WHERE rn = 1` | exactly one row per key |
| Not in WHERE | — | windows run after WHERE; filter in the outer query |
| Tie-breaker | last ORDER BY column unique | makes the result deterministic |
| ROW_NUMBER, not RANK | — | RANK and DENSE_RANK give ties the same number, so duplicates survive |
| Latest per key | `PARTITION BY sat_id, channel ORDER BY ts DESC, ...` then `rn = 1` | current value of every channel |
| Latest N | `rn <= N`, after deduplicating | N newest real samples per key |
| DISTINCT ON | `SELECT DISTINCT ON (k) ... ORDER BY k, t DESC, ...` | PostgreSQL only; ORDER BY must start with k |
| SQLite | ROW_NUMBER form | no DISTINCT ON; avoid the bare-column MAX trick |

Next lesson keeps the same "number the rows, then group by the numbers" idea and uses two ROW_NUMBERs at once to find islands: every unbroken run of samples where a reaction wheel spun faster than its limit.

::: context why-duplicates Why the ground hears things twice
A satellite in low Earth orbit is overhead for only a few minutes per pass, so operators build networks of ground stations, and near the poles several stations can see the same satellite at once. Each one decodes the same downlink and forwards it, so the ground system receives two copies. Retransmission adds more: when a station misses part of a pass, the satellite may resend its stored data on the next pass, including frames that had in fact got through. Deduplicating is cheaper than preventing every repeat, so ground systems plan for it.
:::

::: context bit-errors When a copy disagrees
Radio links flip the odd bit. Downlink frames carry error-detecting codes, such as a cyclic redundancy check (CRC), so most damaged frames are caught and thrown away. A few damaged frames can still reach the database, for example when a check is skipped or a bad frame passes by chance. That is how two copies of one sample end up with different values. Real pipelines store a quality flag with each frame and put "prefer a frame that passed its check" first in the preference order.
:::

::: context keep-the-ones Number, then keep the 1s
Each coloured band is one partition: the copies of one sample. ROW_NUMBER numbers inside each band; the filter keeps the rows marked 1 (blue).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="10" width="230" height="20" fill="#8fb8f0"/>
    <rect x="20" y="30" width="230" height="20" fill="#ffffff"/>
    <rect x="20" y="56" width="230" height="20" fill="#8fb8f0"/>
    <rect x="20" y="82" width="230" height="20" fill="#8fb8f0"/>
    <rect x="20" y="102" width="230" height="20" fill="#ffffff"/>
    <rect x="20" y="128" width="230" height="20" fill="#8fb8f0"/>
    <rect x="20" y="148" width="230" height="20" fill="#ffffff"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="26" y="24">SAT-001 soc 00:00  svalbard</text>
    <text x="26" y="44">SAT-001 soc 00:00  troll</text>
    <text x="26" y="70">SAT-001 soc 00:10  svalbard</text>
    <text x="26" y="96">SAT-001 soc 00:20  svalbard</text>
    <text x="26" y="116">SAT-001 soc 00:20  svalbard</text>
    <text x="26" y="142">SAT-002 soc 00:10  hawaii 0.55</text>
    <text x="26" y="162">SAT-002 soc 00:10  chile 0.56</text>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="235" y="24">1</text><text x="235" y="44">2</text><text x="235" y="70">1</text>
    <text x="235" y="96">1</text><text x="235" y="116">2</text><text x="235" y="142">1</text><text x="235" y="162">2</text>
  </g>
  <g font-size="11" fill="#1d6fd1">
    <text x="262" y="24">keep</text><text x="262" y="70">keep</text><text x="262" y="96">keep</text><text x="262" y="142">keep</text>
  </g>
  <g font-size="11" fill="#b4232c">
    <text x="262" y="44">drop</text><text x="262" y="116">drop</text><text x="262" y="162">drop</text>
  </g>
</svg>
```

Seven of the eleven `tlm` rows are shown: the three duplicated samples and one sample that arrived once. The gaps separate partitions.
:::

::: context qualify A clause that saves a step
Snowflake, BigQuery, DuckDB and Teradata accept `QUALIFY`, a filter that runs after the window functions, the way HAVING runs after GROUP BY. There the dedup fits in one SELECT: `... QUALIFY ROW_NUMBER() OVER (PARTITION BY sat_id, channel, ts ORDER BY rx_at, ingest_id) = 1`. It is not part of standard SQL, and PostgreSQL and SQLite do not have it, so in this course you write the CTE. When you read QUALIFY in someone else's query, translate it in your head to "compute in a CTE, filter outside".
:::

::: context nondeterminism Why a tie can go either way
SQL promises an order only for what the ORDER BY states. Among rows that tie, the database uses whatever order they happen to reach the sort in, and that depends on things you do not control: where each row sits on disk, whether the query ran in parallel on several workers, which plan the optimizer chose. Updating rows, cleaning up a table, loading more data or upgrading the database can all change it. So "it gave the same answer every time I tried" proves nothing about a query with a tie.
:::

::: context distinct-on-picture How DISTINCT ON walks the rows
The rows are sorted by `sat_id, channel, ts DESC, ...`. DISTINCT ON keeps the first row each time the key `(sat_id, channel)` changes, and skips the rest.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1" fill="#ffffff">
    <rect x="30" y="10" width="220" height="16" fill="#8fb8f0"/><rect x="30" y="26" width="220" height="16"/>
    <rect x="30" y="42" width="220" height="16"/><rect x="30" y="58" width="220" height="16"/>
    <rect x="30" y="80" width="220" height="16" fill="#8fb8f0"/><rect x="30" y="96" width="220" height="16"/>
    <rect x="30" y="118" width="220" height="16" fill="#8fb8f0"/><rect x="30" y="134" width="220" height="16"/>
    <rect x="30" y="150" width="220" height="16"/>
    <rect x="30" y="172" width="220" height="16" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="36" y="22">SAT-001 soc  00:20  0.70</text><text x="36" y="38">SAT-001 soc  00:20  0.70</text>
    <text x="36" y="54">SAT-001 soc  00:10  0.85</text><text x="36" y="70">SAT-001 soc  00:00  0.90 (x2)</text>
    <text x="36" y="92">SAT-001 temp 00:20  19.0</text><text x="36" y="108">SAT-001 temp 00:00  18.5</text>
    <text x="36" y="130">SAT-002 soc  00:10  0.55</text><text x="36" y="146">SAT-002 soc  00:10  0.56</text>
    <text x="36" y="162">SAT-002 soc  00:00  0.50</text>
    <text x="36" y="184">SAT-002 temp 00:10  21.2</text>
  </g>
  <g font-size="11" fill="#1d6fd1">
    <text x="260" y="22">kept</text><text x="260" y="92">kept</text><text x="260" y="130">kept</text><text x="260" y="184">kept</text>
  </g>
  <text x="300" y="60" font-size="11" fill="#6c7a93" text-anchor="middle">skipped</text>
</svg>
```

The two copies of SAT-001's 00:00 reading share one line to save space. Four groups, four kept rows.
:::

::: context bare-columns SQLite's bare columns
Standard SQL does not allow a column in SELECT that is neither grouped nor inside an aggregate, and PostgreSQL enforces that, as you saw in the joins module. SQLite allows these **bare columns** and documents one special case: if the query has exactly one `MIN()` or `MAX()`, the bare columns come from a row that holds that minimum or maximum. With any other aggregate, or two of them, the bare values come from an arbitrary row of the group. It is a handy trick at a SQLite prompt, but it will not survive a move to another database.
:::
