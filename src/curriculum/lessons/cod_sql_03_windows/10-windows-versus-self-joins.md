---
id: l10-windows-versus-self-joins
title: Window or self-join?
minutes: 25
covers:
  - When a window function beats a self-join, and when it does not
---

Picture a long line of people waiting for a bus, and you want to know who is standing right in front of you. One way: look over your shoulder. Another way: walk up to every single person in the line, ask each one "are you ahead of me?", write down everyone who says yes, and then pick the one who is closest. Both give the right answer. The second takes the whole morning.

A window function is the first way: it walks each satellite's rows once, in order, and every row sees its neighbors as it goes by. Before window functions existed, SQL writers did the second way. They **joined a table to itself** — a **self-join** — pairing each row with other rows of the same table and filtering the pairs. Plenty of queries are still written like that.

This last lesson of the module puts the two side by side, measures them with the database's own tools, and then turns to the problems where a join is the right tool after all: matching rows from *two different* tables by time, finding the nearest timestamp, and matching on ranges.

## The previous row, three ways

Start with the question lesson 03 answered in one line: the change in battery charge since the previous sample, per satellite, on the `soc` table.

**With a window.**

```sql
SELECT sat_id, ts, value,
       value - LAG(value) OVER (PARTITION BY sat_id ORDER BY ts) AS delta
FROM soc;
```

**With a self-join.** Join `soc` to itself under two names, `cur` for the current row and `prev` for the previous one. The hard part is saying *which* row is previous. It is the row of the same satellite whose time is the largest time before `cur.ts`, which takes a subquery:

```sql
SELECT cur.sat_id, cur.ts, cur.value,
       cur.value - prev.value AS delta
FROM soc AS cur
LEFT JOIN soc AS prev
       ON prev.sat_id = cur.sat_id
      AND prev.ts = (SELECT MAX(p.ts)
                     FROM soc AS p
                     WHERE p.sat_id = cur.sat_id
                       AND p.ts < cur.ts)
WHERE cur.sat_id = 'SAT-001'
ORDER BY cur.ts;
```

```text
 sat_id  |           ts           | value | delta
---------+------------------------+-------+-------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 | -0.05
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 | -0.15
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |  0.05
```

The same answers LAG gives, including the NULL on the first row: there the subquery finds no earlier time, returns NULL, and the LEFT JOIN keeps the row with an empty `prev`. But the query is three times as long, it reads `soc` three times, and it has a hidden assumption. If two rows of a satellite share a timestamp, `prev.ts = (…)` matches both, and the current row comes out twice.

**With a plain self-join and GROUP BY.** A third version skips the subquery: join every row to *every* earlier row of its satellite, then keep the latest per group.

```sql
SELECT cur.sat_id, cur.ts, MAX(prev.ts) AS prev_ts
FROM soc AS cur
LEFT JOIN soc AS prev
       ON prev.sat_id = cur.sat_id
      AND prev.ts < cur.ts
GROUP BY cur.sat_id, cur.ts;
```

It finds the right previous time (one more join would fetch that row's value), and on twelve rows it is instant. Look at what it builds, though. SAT-001's sample at 00:30 is paired with the three samples before it; the one at 00:20 with two; and so on. A satellite with $n$ samples makes $0 + 1 + 2 + \dots + (n-1)$ pairs, which adds up to

$$
\frac{n(n-1)}{2}.
$$

Read it as "n times n minus one, over two". For $n = 4$ that is $4 \times 3 / 2 = 6$ pairs. For a day of one-second telemetry, $n = 86\,400$, it is about 3.7 billion pairs — to find 86,400 answers. That growth, roughly with the *square* of the number of rows, is called **[[quadratic|quadratic-word]]**. It is the reason the second way to find the person in front of you takes all morning.

::: note Why the pairs add up to n(n − 1)/2
Write the sum forwards and backwards and add the two lines column by column:

$$
\begin{aligned}
S &= 0 + 1 + 2 + \dots + (n-1) \\
S &= (n-1) + (n-2) + \dots + 0 \\
2S &= (n-1) + (n-1) + \dots + (n-1)
\end{aligned}
$$

There are $n$ columns, each adding to $n - 1$, so $2S = n(n-1)$ and $S = n(n-1)/2$. For $n = 4$: $0 + 1 + 2 + 3 = 6$, and $4 \times 3 / 2 = 6$.
:::

## Measuring the difference with EXPLAIN

Arguments about speed are cheap; PostgreSQL will tell you what it actually did. Put **EXPLAIN** in front of a query and it prints the **plan**: the steps the database chose to run the query, as an upside-down tree whose innermost steps run first. Write **EXPLAIN ANALYZE** and it also *runs* the query and reports how many rows each step really produced and how long the whole thing took.

To make the difference visible, `soc_big` is a bigger copy of `soc`: 20 satellites, 2,000 samples each, one every 10 seconds, 40,000 rows, filled with `generate_series` as the gyro table was in the last lesson:

```sql
INSERT INTO soc_big
SELECT 'SAT-' || lpad(s::text, 3, '0'),                        -- SAT-001 … SAT-020
       timestamptz '2026-03-01 00:00:00+00' + i * interval '10 seconds',
       round((0.75 + 0.2 * sin(i / 50.0 + s))::numeric, 2)
FROM generate_series(1, 20) AS s, generate_series(0, 1999) AS i;
```

The options in brackets after EXPLAIN switch off detail we do not need, and a line or two of memory statistics has been trimmed from the output, so each plan fits on the screen.

```sql
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT sat_id, ts, value - LAG(value) OVER (PARTITION BY sat_id ORDER BY ts) AS delta
FROM soc_big;
```

```text
 WindowAgg (actual rows=40000 loops=1)
   ->  Sort (actual rows=40000 loops=1)
         Sort Key: sat_id, ts
         Sort Method: quicksort  Memory: 3241kB
         ->  Seq Scan on soc_big (actual rows=40000 loops=1)
 Planning Time: 0.407 ms
 Execution Time: 31.149 ms
```

Read it from the bottom up. `actual rows` is how many rows a step produced, and `loops` how many times it ran. **Seq Scan** — a sequential scan, reading the table start to finish — produced 40,000 rows. **Sort** put them in `sat_id, ts` order, which is the window's PARTITION BY and ORDER BY. **WindowAgg** walked the sorted rows once and computed LAG. Every step handled 40,000 rows, once. Total: about 31 milliseconds.

Now the pair-everything self-join on the same table:

```sql
EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF)
SELECT cur.sat_id, cur.ts, MAX(prev.ts) AS prev_ts
FROM soc_big AS cur
LEFT JOIN soc_big AS prev
       ON prev.sat_id = cur.sat_id AND prev.ts < cur.ts
GROUP BY cur.sat_id, cur.ts;
```

```text
 HashAggregate (actual rows=40000 loops=1)
   Group Key: cur.sat_id, cur.ts
   ->  Hash Left Join (actual rows=39980020 loops=1)
         Hash Cond: (cur.sat_id = prev.sat_id)
         Join Filter: (prev.ts < cur.ts)
         Rows Removed by Join Filter: 40020000
         ->  Seq Scan on soc_big cur (actual rows=40000 loops=1)
         ->  Hash (actual rows=40000 loops=1)
               ->  Seq Scan on soc_big prev (actual rows=40000 loops=1)
 Planning Time: 0.221 ms
 Execution Time: 5361.446 ms
```

The **Hash Left Join** matched rows by building a quick lookup table of `prev` keyed on `sat_id`. Look at what came out of it: **39,980,020** rows, and another 40,020,000 pairs were built and thrown away by the `prev.ts < cur.ts` filter. All that, to be squeezed back down to 40,000 rows by the aggregate at the top. It took about 5.4 seconds, around 170 times as long as the window.

::: example Predicting the row count in the plan
**Question.** Where does the number 39,980,020 in the plan come from?

**Step 1: pairs per satellite.** Each satellite has $n = 2000$ samples. The join keeps pairs where `prev` is earlier than `cur`, which is $n(n-1)/2 = 2000 \times 1999 / 2 = 1\,999\,000$ pairs.

**Step 2: all satellites.** Twenty satellites give $20 \times 1\,999\,000 = 39\,980\,000$ pairs.

**Step 3: the first rows.** Each satellite's first sample has no earlier partner. A LEFT JOIN still keeps it once, with NULLs on the `prev` side. That adds 20 rows: $39\,980\,000 + 20 = 39\,980\,020$. Exactly the plan's number.

**The thrown-away pairs.** For each satellite the hash join first matches all $2000 \times 2000 = 4\,000\,000$ same-satellite pairs, then the filter drops those where `prev` is not earlier. Kept: 1,999,000. Dropped: $4\,000\,000 - 1\,999\,000 = 2\,001\,000$ per satellite, and $20 \times 2\,001\,000 = 40\,020\,000$ in all — the plan's "Rows Removed by Join Filter".

**Sanity check.** Double the samples per satellite and the pairs roughly quadruple, while the window's work only doubles. That gap is what grows into minutes, then hours, on real data.
:::

The `MAX(p.ts)` subquery version fares little better on its own: it rescans the table for every row, and took about 2.5 seconds for only one satellite's 2,000 rows. With an **index** on `(sat_id, ts)` — a sorted lookup structure, the subject of the next module — each lookup jumps straight to the right place, and all 40,000 rows took about 0.6 seconds. Still some thirty times slower than the window, which with the same index took about 18 ms.

::: key When a window function beats a self-join
Nearly always for previous or next row, running totals and rankings: one pass over the ordered data instead of a join that may be quadratic. A self-join stays useful when the pairing rule is not an ordering.
:::

::: warning Timings are for comparing, not quoting
The milliseconds in this lesson came from one small test database, and yours will differ. What carries over is the *shape*: a window's work grows in step with the rows, a pair-everything self-join's with their square. Compare queries on the same machine, run each a few times, and trust the row counts in the plan, which do not depend on the machine.
:::

## When the pairing is not an ordering

A window function works *inside one set of rows*, walking them in one order. It is perfect when the row you want is "the one before me in this list". It is awkward when the row you want lives in a **different table**, ordered by its own clock. The classic case is the **[[as-of join|asof-name]]**: for each row of one table, find the latest row of another table [[at or before the same moment|asof-picture]].

Here is a table of commanded mode changes, next to the familiar `soc` samples:

```sql
CREATE TABLE mode_change (
    sat_id TEXT        NOT NULL,
    ts     TIMESTAMPTZ NOT NULL,   -- when the new mode took effect
    mode   TEXT        NOT NULL
);

INSERT INTO mode_change VALUES
  ('SAT-001','2026-03-01T00:00:00Z','NOMINAL'),
  ('SAT-001','2026-03-01T00:15:00Z','SAFE'),
  ('SAT-001','2026-03-01T00:28:00Z','NOMINAL'),
  ('SAT-002','2026-02-28T23:50:00Z','NOMINAL'),
  ('SAT-002','2026-03-01T00:25:00Z','ECLIPSE');
```

The question: "for every battery sample, which mode was the satellite in?". SAT-001 went into **[[SAFE mode|safe-mode]]** at 00:15, so its 00:20 sample should say SAFE. There is no ordering that runs through both tables, so there is no "previous row" for LAG to fetch. This is a join — but a join on "the latest time at or before mine", not on equal values.

### LATERAL: a subquery for each row

PostgreSQL's cleanest tool for this is **[[LATERAL|lateral-word]]**. A subquery in FROM normally cannot see the other tables in the same FROM. Put the word LATERAL in front of it and it may use the columns of the tables to its left, so it runs once *for each row* of them, like a small query tailored to that row. Read `JOIN LATERAL (…)` as "join, for each row, to what this subquery finds for that row":

```sql
SELECT s.sat_id, s.ts, s.value, m.mode
FROM soc AS s
LEFT JOIN LATERAL (
    SELECT mc.mode
    FROM mode_change AS mc
    WHERE mc.sat_id = s.sat_id
      AND mc.ts <= s.ts
    ORDER BY mc.ts DESC
    LIMIT 1
) AS m ON true
ORDER BY s.sat_id, s.ts;
```

```text
 sat_id  |           ts           | value |  mode
---------+------------------------+-------+---------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 | NOMINAL
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 | NOMINAL
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 | SAFE
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 | NOMINAL
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50 | NOMINAL
 SAT-002 | 2026-03-01 00:10:00+00 |  0.55 | NOMINAL
 SAT-002 | 2026-03-01 00:20:00+00 |  0.60 | NOMINAL
 SAT-002 | 2026-03-01 00:50:00+00 |  0.63 | ECLIPSE
 SAT-003 | 2026-03-01 00:00:00+00 |  0.81 |
 SAT-003 | 2026-03-01 00:10:00+00 |  0.78 |
 SAT-003 | 2026-03-01 00:20:00+00 |  0.78 |
 SAT-003 | 2026-03-01 00:30:00+00 |  0.75 |
```

For each sample, the subquery looks at that satellite's mode changes at or before the sample's time, newest first, and keeps one. `LEFT JOIN … ON true` keeps samples for which it finds nothing — SAT-003 has no mode history — with a NULL mode. (A join needs an ON; the real matching is inside the subquery.) The `<=` makes a change at exactly 00:00:00 apply to a sample at 00:00:00, and SAT-002's mode from 23:50 the night before correctly carries into 1 March.

**In SQLite**, which has no LATERAL, the same lookup goes in the SELECT list as a **correlated scalar subquery** — a subquery that returns one value and may use the outer row's columns:

```sql
SELECT s.sat_id, s.ts, s.value,
       (SELECT mc.mode
        FROM mode_change AS mc
        WHERE mc.sat_id = s.sat_id
          AND mc.ts <= s.ts
        ORDER BY mc.ts DESC
        LIMIT 1) AS mode
FROM soc AS s
ORDER BY s.sat_id, s.ts;
```

It gives the same twelve modes. It can return only one column; for several columns from the matched row, LATERAL is the tidier tool.

### Windows can help: turn changes into spans

A window cannot do the matching by itself, but it can prepare the ground. Each mode lasts from its own start until the *next* change's start — and "the next row's time" is LEAD from lesson 03. Turn the change log into **spans**, then join each sample to the span that contains it:

::: example The mode at every sample, from spans
**Step 1: build the spans with LEAD.**

```sql
SELECT sat_id, mode,
       ts AS valid_from,
       LEAD(ts, 1, 'infinity') OVER (PARTITION BY sat_id ORDER BY ts) AS valid_to
FROM mode_change
ORDER BY sat_id, valid_from;
```

```text
 sat_id  |  mode   |       valid_from       |        valid_to
---------+---------+------------------------+------------------------
 SAT-001 | NOMINAL | 2026-03-01 00:00:00+00 | 2026-03-01 00:15:00+00
 SAT-001 | SAFE    | 2026-03-01 00:15:00+00 | 2026-03-01 00:28:00+00
 SAT-001 | NOMINAL | 2026-03-01 00:28:00+00 | infinity
 SAT-002 | NOMINAL | 2026-02-28 23:50:00+00 | 2026-03-01 00:25:00+00
 SAT-002 | ECLIPSE | 2026-03-01 00:25:00+00 | infinity
```

`LEAD(ts, 1, 'infinity')` means "the next row's `ts`, or the special timestamp *infinity* if there is no next row" — the third argument is LEAD's default. The last mode of each satellite is open-ended. Each span is half-open: it includes `valid_from` and stops short of `valid_to`, so the spans of one satellite tile time with no overlaps.

**Step 2: join with a range condition.**

```sql
WITH spans AS (
    SELECT sat_id, mode,
           ts AS valid_from,
           LEAD(ts, 1, 'infinity') OVER (PARTITION BY sat_id ORDER BY ts) AS valid_to
    FROM mode_change
)
SELECT s.sat_id, s.ts, s.value, sp.mode
FROM soc AS s
LEFT JOIN spans AS sp
       ON sp.sat_id = s.sat_id
      AND s.ts >= sp.valid_from
      AND s.ts <  sp.valid_to
ORDER BY s.sat_id, s.ts;
```

The output is the same twelve rows as the LATERAL query, mode for mode.

**Check one row by hand.** SAT-001 at 00:20: it is at or after 00:15 and before 00:28, so it falls in the SAFE span, and in no other. Because the spans tile without overlapping, every sample matches at most one span, and the join cannot multiply rows.

**In SQLite**, where there is no `'infinity'`, use a far-future text time as the default: `LEAD(ts, 1, '9999-12-31T23:59:59Z')`. ISO-8601 text sorts in time order, so the range test works on the strings.
:::

This pattern — a window to build intervals, then a **non-equi join** (a join whose ON condition uses `<`, `>=` or BETWEEN rather than `=`) to match against them — shows up everywhere in telemetry: samples inside contact passes from lesson 08, events inside eclipse periods, commands inside maneuver windows.

### A windows-only as-of, and a trap

Windows alone can do it too. Stack both tables into one stream with UNION ALL, sort by time, and carry each mode forward. The carrying is lesson 07's start-marking idea: a running `COUNT(mode)` counts only non-NULL modes, so it rises by one at each mode change and stays flat across the samples after it. That count labels groups of one mode row plus the samples in that mode:

```sql
WITH events AS (
    SELECT sat_id, ts, 0 AS kind, mode, NULL::numeric AS value FROM mode_change
    UNION ALL
    SELECT sat_id, ts, 1 AS kind, NULL, value FROM soc
),
grouped AS (
    SELECT sat_id, ts, kind, value, mode,
           COUNT(mode) OVER (PARTITION BY sat_id ORDER BY ts, kind
                             ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS grp
    FROM events
),
filled AS (
    SELECT sat_id, ts, kind, value,
           MAX(mode) OVER (PARTITION BY sat_id, grp) AS mode
    FROM grouped
)
SELECT sat_id, ts, value, mode
FROM filled
WHERE kind = 1
ORDER BY sat_id, ts;
```

It returns the same twelve modes. The `kind` column puts a mode change before a sample at the same instant, which is what makes `<=` behave. `MAX(mode)` over the group picks up the group's one non-NULL mode.

::: warning Filter after the window, not before
Put `WHERE kind = 1` in the same SELECT as `MAX(mode) OVER (…)` and every mode comes out NULL. WHERE runs before window functions (lesson 01), so it throws away the mode rows before the window can copy their values onto the samples. That is why the `filled` CTE exists: finish the window, then filter.
:::

## Which as-of is fastest? It depends on the left side

On the 40,000-row `soc_big` with 800 mode changes (and indexes on `(sat_id, ts)` for both), the three as-of methods took roughly:

| Method | Time for 40,000 samples | Time for 5 lookups |
| --- | --- | --- |
| LATERAL, newest first, LIMIT 1 | about 90 ms | about 0.1 ms |
| LEAD spans + range join | about 110 ms | — |
| UNION ALL + windows | about 40 ms | about 42 ms |

With 40,000 samples to label, the windows-only version won: one sorted pass over both tables, against 40,000 separate index lookups for LATERAL. Now flip the question: "what was the battery reading at each of these **5** anomaly times?". LATERAL does 5 lookups in a tenth of a millisecond. The windows version still reads and sorts all 40,000 samples, and takes over 400 times longer.

So the rule is about sizes. A window's cost follows the total rows it must read and sort; a LATERAL's cost follows the number of rows on its left, each cheap if an index can find the match.

::: key Picking the as-of method
For each row of A, "the latest row of B at or before it" is an as-of join. Use LATERAL with ORDER BY … DESC LIMIT 1 (SQLite: a correlated scalar subquery) when A is small or an index on B's key and time exists. Use LEAD to turn B into spans and join on the range when B is a change log. Use a single sorted window pass over both when A is large.
:::

## The nearest timestamp in either direction

Sometimes "at or before" is not the question. An operator logs an anomaly at 00:14 and wants the battery reading *nearest* in time, before or after. A window cannot answer it: the anomalies are in their own table. Two LATERAL lookups can — one looking back, one looking forward — and then CASE picks the closer:

::: example Nearest sample to each anomaly
```sql
CREATE TABLE anomaly (sat_id TEXT NOT NULL, ts TIMESTAMPTZ NOT NULL, code TEXT NOT NULL);
INSERT INTO anomaly VALUES
  ('SAT-001','2026-03-01T00:14:00Z','BUS_UV'),
  ('SAT-002','2026-03-01T00:38:00Z','PKT_CRC'),
  ('SAT-003','2026-03-01T00:31:00Z','HTR_ON');

SELECT a.sat_id, a.ts AS event_ts, a.code,
       b.ts AS before_ts, f.ts AS after_ts,
       CASE WHEN f.ts IS NULL
              OR (b.ts IS NOT NULL AND a.ts - b.ts <= f.ts - a.ts)
            THEN b.value ELSE f.value END AS nearest_value
FROM anomaly AS a
LEFT JOIN LATERAL (
    SELECT s.ts, s.value FROM soc AS s
    WHERE s.sat_id = a.sat_id AND s.ts <= a.ts
    ORDER BY s.ts DESC LIMIT 1
) AS b ON true
LEFT JOIN LATERAL (
    SELECT s.ts, s.value FROM soc AS s
    WHERE s.sat_id = a.sat_id AND s.ts > a.ts
    ORDER BY s.ts LIMIT 1
) AS f ON true
ORDER BY a.sat_id;
```

```text
 sat_id  |        event_ts        |  code   |       before_ts        |        after_ts        | nearest_value
---------+------------------------+---------+------------------------+------------------------+---------------
 SAT-001 | 2026-03-01 00:14:00+00 | BUS_UV  | 2026-03-01 00:10:00+00 | 2026-03-01 00:20:00+00 |          0.85
 SAT-002 | 2026-03-01 00:38:00+00 | PKT_CRC | 2026-03-01 00:20:00+00 | 2026-03-01 00:50:00+00 |          0.63
 SAT-003 | 2026-03-01 00:31:00+00 | HTR_ON  | 2026-03-01 00:30:00+00 |                        |          0.75
```

**Check each row.** SAT-001 at 00:14: the sample before is 4 minutes earlier, the one after 6 minutes later, so the earlier one wins: 0.85. SAT-002 at 00:38: 18 minutes back to 00:20, 12 minutes forward to 00:50 (the gap from lesson 03 is why both are far), so the later one wins: 0.63. SAT-003 at 00:31: nothing after, so the CASE takes the one before, 0.75.

**Why two lookups instead of one?** A single LATERAL with `ORDER BY abs(EXTRACT(EPOCH FROM s.ts - a.ts)) LIMIT 1` ("sorted by distance in seconds") gives the same answers, but it must compute the distance to every sample of the satellite first. The two one-sided lookups are each a single hop in an index.
:::

## Other pairings a window cannot make

The last family matches rows by a rule that no single ORDER BY can express. From flight data:

- Every pair of satellites whose position samples at the **same second** were closer than 10 km — a [[conjunction|conjunction-word]] screen. The pairing runs *across* partitions (satellite A with satellite B), which a window, stuck inside one partition, cannot see.
- Every command whose execution time fell inside a thruster-firing window from another table — a range join, like the spans above.
- Every pair of readings from two redundant sensors taken within 50 ms of each other, to compare them.

Each is a join with a non-equality condition, and would be contorted or impossible as a window. The danger is the one you measured: too many candidate pairs. The cure is to make the ON condition as narrow as possible (same second, a band of ±50 ms) so that each row meets only a few partners, and to give the database an index to find them.

::: warning A self-join with only an inequality is a red flag
`ON prev.sat_id = cur.sat_id AND prev.ts < cur.ts` looks harmless and builds $n(n-1)/2$ pairs per satellite. Whenever a self-join's condition is "all rows before" or "all rows after", stop and ask whether LAG, LEAD, a running aggregate or a frame from lesson 05 answers the question. If it must stay a join, bound it on both sides: `prev.ts >= cur.ts - interval '5 seconds' AND prev.ts < cur.ts`.
:::

## A decision table

| Question | Best tool | Why |
| --- | --- | --- |
| Previous or next value, delta, rate | LAG / LEAD | One ordered pass |
| Running total, moving average | Aggregate with a frame | One ordered pass |
| Rank, top n per group, dedup | ROW_NUMBER, RANK | One ordered pass |
| Runs and sessions | LAG marks + running SUM | One or two ordered passes |
| Latest B at or before each A, few A rows | LATERAL … LIMIT 1 (SQLite: scalar subquery) | One index hop per A row |
| Latest B at or before each A, many A rows | Window pass over UNION ALL, or LEAD spans + range join | No per-row lookups |
| Nearest B either side | Two LATERAL lookups | Each can use an index |
| Across partitions, bands, ranges | Join with a narrow ON | Windows cannot pair across partitions |

Several rows lean on **indexes**, which make a lookup a hop instead of a search, and all of them are worth checking with **EXPLAIN**. The next module, on **[[schema design, indexes, EXPLAIN and partitioning|next-module]]**, teaches both properly.

## Check yourself

::: check
A table holds 5,000 samples for each of 12 satellites. Roughly how many rows does `soc_big AS cur JOIN soc_big AS prev ON prev.sat_id = cur.sat_id AND prev.ts < cur.ts` produce? How many rows does the LAG version's WindowAgg step produce?
:::

::: answer
Per satellite, $n(n-1)/2 = 5000 \times 4999 / 2 = 12\,497\,500$ pairs. For 12 satellites, $12 \times 12\,497\,500 = 149\,970\,000$ — about 150 million rows. (It is an inner join, so the first rows with no partner add nothing.)

The WindowAgg step produces one row per input row: $12 \times 5000 = 60\,000$. Two and a half thousand times fewer.
:::

::: check
Why can't `LAG(mode) OVER (PARTITION BY sat_id ORDER BY ts)` on the `soc` table tell you which mode each battery sample was taken in?
:::

::: answer
LAG only looks at other rows of the *same* result, in the window's order. The `soc` table has no `mode` column at all; the modes live in `mode_change`, with their own timestamps that do not line up with the samples. To bring them together you must either join the two tables (LATERAL, a scalar subquery, or a range join on LEAD-built spans) or first stack them into one stream with UNION ALL, after which windows can carry the mode forward.
:::

::: check
You need the GPS fix at or before each of 20 anomaly timestamps, from a GPS table of 50 million rows with an index on `(sat_id, ts)`. Which as-of method would you choose, and why not the windows-only one?
:::

::: answer
LATERAL with `WHERE g.sat_id = a.sat_id AND g.ts <= a.ts ORDER BY g.ts DESC LIMIT 1` (or a scalar subquery in SQLite). Each of the 20 lookups is one hop down the index, so the whole query touches a few dozen rows.

The windows-only method stacks both tables and sorts them, so it reads all 50 million GPS rows to produce 20 answers. It is the right choice when you need an answer for most rows of a big table, not for a handful.
:::

::: check
In the windows-only as-of query, what goes wrong if the `kind` tie-breaker is left out of `ORDER BY ts, kind`, and a mode change and a sample share exactly the same timestamp?
:::

::: answer
Without `kind`, the two rows tie on `ts`, and their order is not defined. If the sample happens to come first, the running `COUNT(mode)` has not yet counted the new mode when it reaches the sample, so the sample lands in the *previous* group and gets the old mode. The query then answers "before" instead of "at or before", and it may answer differently from one run to the next. With `kind` (0 for mode changes, 1 for samples), the mode change always sorts first, matching the `<=` of the LATERAL version.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| Self-join | A table joined to itself under two names, pairing rows with rows |
| Pairs from "all earlier rows" | $n(n-1)/2$ per partition — quadratic growth |
| Window for neighbors | One ordered pass: LAG, LEAD, running aggregates, ranks |
| EXPLAIN / EXPLAIN ANALYZE | The plan; with ANALYZE, real row counts and time |
| As-of join | For each A, latest B at or before it |
| LATERAL | A FROM subquery that sees the row to its left; `LEFT JOIN LATERAL (…) ON true` |
| SQLite as-of | Correlated scalar subquery with ORDER BY … DESC LIMIT 1 |
| Spans | `LEAD(ts, 1, 'infinity')` turns a change log into half-open intervals for a range join |
| Few lookups vs many | Few: LATERAL with an index. Many: one window pass |
| Pairing not an ordering | Across partitions, bands, ranges: a join with a narrow ON |

That completes window functions. The next module, schema design, turns to what makes all of these queries fast or slow underneath: how telemetry tables are laid out, how indexes and partitions work, and how to read EXPLAIN properly.

::: context quadratic-word Why "quadratic" means "squared"
"Quadratic" comes from the Latin *quadratus*, "made square" — the same root as "quadrilateral". A quadratic formula has a squared term, and $n(n-1)/2 = \tfrac{1}{2}n^2 - \tfrac{1}{2}n$ is dominated by its $n^2$ part once $n$ is large. Engineers say the pairing is "order n squared", written $O(n^2)$. Doubling the data makes an $O(n)$ job take twice as long and an $O(n^2)$ job four times as long.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="16">window: n steps</text>
    <text x="260" y="16">all-earlier join: n(n-1)/2 pairs</text>
  </g>
  <g fill="#1d6fd1">
    <rect x="30" y="100" width="18" height="18"/><rect x="50" y="100" width="18" height="18"/><rect x="70" y="100" width="18" height="18"/>
    <rect x="90" y="100" width="18" height="18"/><rect x="110" y="100" width="18" height="18"/><rect x="130" y="100" width="18" height="18"/>
  </g>
  <g fill="#b4232c">
    <rect x="190" y="40" width="18" height="18"/>
    <rect x="190" y="60" width="18" height="18"/><rect x="210" y="60" width="18" height="18"/>
    <rect x="190" y="80" width="18" height="18"/><rect x="210" y="80" width="18" height="18"/><rect x="230" y="80" width="18" height="18"/>
    <rect x="190" y="100" width="18" height="18"/><rect x="210" y="100" width="18" height="18"/><rect x="230" y="100" width="18" height="18"/><rect x="250" y="100" width="18" height="18"/>
    <rect x="190" y="120" width="18" height="18"/><rect x="210" y="120" width="18" height="18"/><rect x="230" y="120" width="18" height="18"/><rect x="250" y="120" width="18" height="18"/><rect x="270" y="120" width="18" height="18"/>
  </g>
  <text x="90" y="138" font-size="11" fill="#1f2a44" text-anchor="middle">n = 6: 6 steps</text>
  <text x="330" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">n = 6:</text>
  <text x="330" y="114" font-size="11" fill="#1f2a44" text-anchor="middle">15 pairs</text>
</svg>
```

Row $k$ of the red triangle holds the pairs of the $(k+1)$-th sample with the samples before it: 1, 2, 3, 4, 5, adding to 15, which is $6 \times 5 / 2$.
:::

::: context asof-name Where "as-of join" comes from
The name comes from finance, where the question "what was the latest quoted price as of the moment of this trade?" is asked billions of times a day. Time-series databases built for trading, such as kdb+, have long had an as-of join as a single built-in operation, and the Python library pandas has `merge_asof` for the same job. In spacecraft operations the same question is "which mode, which commanded attitude, which calibration was in force as of this sample?".
:::

::: context asof-picture Each sample looks back to the latest change
The top band is SAT-001's mode history, one box per span. The dots are its battery samples. Each blue line runs from a sample back to the mode change in force at that moment: the latest change at or before the sample's time. The 00:20 sample reaches back to 00:15 and reads SAFE; the 00:30 sample reaches back to 00:28 and reads NOMINAL.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="40" width="120" height="20" fill="#8fb8f0"/>
  <rect x="160" y="40" width="104" height="20" fill="#f2b880"/>
  <rect x="264" y="40" width="56" height="20" fill="#8fb8f0"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="100.0" y="54">NOMINAL</text><text x="212.0" y="54">SAFE</text><text x="292.0" y="54">NOM.</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="40" y1="36" x2="40" y2="64"/><line x1="160" y1="36" x2="160" y2="64"/><line x1="264" y1="36" x2="264" y2="64"/>
  </g>
  <text x="40" y="28" font-size="11" fill="#1f2a44" text-anchor="start">mode changes (spans)</text>
  <line x1="40" y1="120" x2="320" y2="120" stroke="#6c7a93" stroke-width="1"/>
  <g stroke="#1d6fd1" stroke-width="1.5" fill="none">
    <line x1="40" y1="114" x2="40" y2="66"/>
    <line x1="120" y1="114" x2="43" y2="66"/>
    <line x1="200" y1="114" x2="162" y2="66"/>
    <line x1="280" y1="114" x2="265" y2="66"/>
  </g>
  <g fill="#1f2a44">
    <circle cx="40" cy="120" r="4"/><circle cx="120" cy="120" r="4"/><circle cx="200" cy="120" r="4"/><circle cx="280" cy="120" r="4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="140">00:00</text><text x="120" y="140">00:10</text><text x="200" y="140">00:20</text><text x="280" y="140">00:30</text>
  </g>
  <text x="160" y="160" font-size="11" fill="#1f2a44" text-anchor="middle">SAT-001 battery samples</text>
</svg>
```

The lines always slant back in time, never forward: an as-of join never uses a change that had not happened yet.
:::

::: context safe-mode What safe mode is
Safe mode is what a spacecraft does when something has gone wrong and it cannot wait for the ground to decide. It switches off non-essential loads, points its solar arrays at the Sun so the batteries stay charged, and waits for instructions. Entering safe mode is a big event in operations, and "every sample taken in safe mode" is exactly the kind of set an engineer wants to pull out of the telemetry afterwards.
:::

::: context lateral-word Looking sideways
"Lateral" means "to the side", from the Latin *latus*, "side". Tables in a FROM clause are normally independent: none can refer to another's columns. LATERAL lets a subquery look sideways at the tables listed before it and use the current row's values. PostgreSQL has supported it since version 9.3; SQL Server's CROSS APPLY and OUTER APPLY do the same job under other names. SQLite does not have it, which is why its as-of lookups go in the SELECT list instead.
:::

::: context conjunction-word Close approaches between satellites
A conjunction is a close approach between two objects in orbit. Operators of large fleets screen for them constantly: for every pair of objects, at matching times, how close do their predicted positions come? Real screening uses orbit predictions and specialized software rather than a SQL self-join over raw samples, but the shape of the problem — pairs across different objects, filtered by a distance limit — is the reason it cannot be a window function.
:::

::: context next-module Where these tools are taught
The schema-design module covers how to lay out a telemetry table (keys, types, one row per sample or one row per packet), what an index really is — a sorted structure, usually a B-tree, that lets the database jump to `(sat_id, ts)` instead of scanning — how to read every line of an EXPLAIN ANALYZE plan, and how partitioning splits a huge table by time so old data can be archived or dropped a piece at a time. Every timing in this lesson changes with those choices.
:::
