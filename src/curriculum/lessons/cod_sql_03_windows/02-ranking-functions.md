---
id: l02-ranking-functions
title: Ranking rows
minutes: 19
covers:
  - "Ranking: ROW_NUMBER, RANK, DENSE_RANK, NTILE, PERCENT_RANK"
---

"Show me the three lowest battery readings on each satellite." "Which satellite had the worst night?" "Is this reading in the bottom quarter of the fleet?" All three are questions about *position*: where a row stands when the rows are put in order. SQL answers them with the **ranking functions**, a family of window functions that give each row a number describing its place in line.

In the last lesson you learned the window clause, `OVER (PARTITION BY ... ORDER BY ...)`, and saw that an ORDER BY inside it makes an aggregate count "so far". Ranking functions are built on exactly that ORDER BY. They take no column to work on. They only need to know how the rows are ordered and, if you partition, where each set of rows starts again at 1.

This lesson teaches the five ranking functions this module uses — `ROW_NUMBER`, `RANK`, `DENSE_RANK`, `NTILE` and `PERCENT_RANK` — and, more importantly, what each one does when two rows **tie**. Ties are the whole difference between them, and choosing the wrong one is how a deduplication query quietly keeps two rows instead of one.

## ROW_NUMBER: counting off

Picture a line of students counting off: "one, two, three…". Every student gets a different number, and the numbers have no gaps. That is **ROW_NUMBER** (read "row number"): it numbers the rows of each partition 1, 2, 3, … in the order the window's ORDER BY gives.

Here are the lowest two readings on each satellite of the `soc` table from lesson 01. The window numbers each satellite's rows from lowest charge to highest, and a CTE keeps rows 1 and 2:

```sql
WITH ranked AS (
    SELECT sat_id, ts, value,
           ROW_NUMBER() OVER (PARTITION BY sat_id ORDER BY value, ts) AS n
    FROM soc
)
SELECT sat_id, ts, value, n
FROM ranked
WHERE n <= 2
ORDER BY sat_id, n;
```

```text
 sat_id  |           ts           | value | n
---------+------------------------+-------+---
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 | 1
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 | 2
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50 | 1
 SAT-002 | 2026-03-01 00:10:00+00 |  0.55 | 2
 SAT-003 | 2026-03-01 00:30:00+00 |  0.75 | 1
 SAT-003 | 2026-03-01 00:10:00+00 |  0.78 | 2
```

Three things to notice.

- `ROW_NUMBER()` has empty brackets. It needs no column; the window's ORDER BY supplies everything.
- The numbering starts again at 1 for each satellite, because of `PARTITION BY sat_id`.
- The ranking is computed in a CTE and filtered outside. You learned why in lesson 01: WHERE runs before window functions exist. This **[[top-N per group|top-n]]** shape — number the rows, keep the first N — is one of the most common queries in telemetry work.

### The tie-breaker

SAT-003 has two readings of 0.78, at 00:10 and 00:20. Which one is "second lowest"? With only `ORDER BY value`, the two rows are equal, and the database may put them in either order. It may even pick a different one next week, after the table has been reorganised on disk, with no change to the query. That is why the query above orders by `value, ts`: when values tie, the earlier time wins. The second column is a **tie-breaker**.

::: warning ROW_NUMBER over ties is a coin toss
ROW_NUMBER always hands out distinct numbers, even to rows that are equal on the ORDER BY. Which tied row gets the smaller number is not defined unless your ORDER BY decides it. Add columns until the order is unique — usually the timestamp, and then a key — or the same query can return **[[different rows on different days|nondeterministic]]**.
:::

## Ties: RANK and DENSE_RANK

Think of a race where two runners cross the line together in second place. Everyone agrees they both finished second. But what place is the next runner? Sports disagree. Most races say "fourth", because three people finished ahead of her. Some tables say "third", because she is the third distinct finishing time. SQL offers both.

- **RANK** gives tied rows the same number, then **skips** ahead so that the next rank counts every row before it: 1, 2, 2, 4.
- **DENSE_RANK** (read "dense rank") gives tied rows the same number and does **not** skip: 1, 2, 2, 3. "Dense" means no gaps.
- **ROW_NUMBER**, as you saw, ignores ties and always counts 1, 2, 3, 4.

Here are all three over the whole fleet, lowest charge first:

```sql
SELECT sat_id, ts, value,
       ROW_NUMBER() OVER (ORDER BY value, sat_id, ts) AS row_num,
       RANK()       OVER (ORDER BY value) AS rnk,
       DENSE_RANK() OVER (ORDER BY value) AS dense
FROM soc
ORDER BY value, sat_id, ts;
```

```text
 sat_id  |           ts           | value | row_num | rnk | dense
---------+------------------------+-------+---------+-----+-------
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50 |       1 |   1 |     1
 SAT-002 | 2026-03-01 00:10:00+00 |  0.55 |       2 |   2 |     2
 SAT-002 | 2026-03-01 00:20:00+00 |  0.60 |       3 |   3 |     3
 SAT-002 | 2026-03-01 00:50:00+00 |  0.63 |       4 |   4 |     4
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 |       5 |   5 |     5
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |       6 |   6 |     6
 SAT-003 | 2026-03-01 00:30:00+00 |  0.75 |       7 |   6 |     6
 SAT-003 | 2026-03-01 00:10:00+00 |  0.78 |       8 |   8 |     7
 SAT-003 | 2026-03-01 00:20:00+00 |  0.78 |       9 |   8 |     7
 SAT-003 | 2026-03-01 00:00:00+00 |  0.81 |      10 |  10 |     8
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 |      11 |  11 |     9
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |      12 |  12 |    10
```

Walk down the table. The first five values are all different, so all three columns agree: 1 to 5. Then two readings tie at 0.75, one from SAT-001 and one from SAT-003.

- `row_num` gives them 6 and 7. The tie-breaker `sat_id` decided which came first.
- `rnk` gives both 6. The next value, 0.78, gets rank 8, because seven rows came before it. Rank 7 is **skipped**.
- `dense` gives both 6, and 0.78 gets 7: the next distinct value, no gap.

The 0.78 pair repeats the pattern: `rnk` gives 8, 8 and then jumps to 10; `dense` gives 7, 7 and then 8. By the bottom, `rnk` reaches 12 (the number of rows) and `dense` reaches only 10 (the number of distinct values). Both checks hold: there are 12 readings and 10 [[different values|tie-picture]].

::: key RANK versus DENSE_RANK versus ROW_NUMBER
ROW_NUMBER is always distinct; RANK leaves gaps after ties (1,1,3); DENSE_RANK does not (1,1,2). For deduplication you want ROW_NUMBER, because ties must still resolve to one row.
:::

### Which one to use

The choice depends on what the number is for.

- **Exactly one row per group** — the latest reading, the single worst sample, one copy of a duplicated downlink: **ROW_NUMBER**, with a tie-breaker. RANK or DENSE_RANK would give two tied rows the number 1, and a "keep number 1" filter would keep both. Lesson 06 builds deduplication on this.
- **A fair league table**, where tied rows should share a place and the next place should say how many rows beat it: **RANK**. It matches how [[sports report places|league-table]].
- **"The top three distinct values"** — the three worst charge levels, however many readings share each: **DENSE_RANK**, filtered to 3 or less.

::: example The two highest charge levels on SAT-003
An engineer asks for the readings at SAT-003's two *highest* charge levels — the peaks after the last recharge — and wants every reading at those levels, ties included.

**Step 1: choose the function.** "Two levels, ties included" means distinct values, so DENSE_RANK. For highest first, the ORDER BY is `value DESC` ("descending": largest first).

**Step 2: rank in a CTE, filter outside.**

```sql
WITH r AS (
    SELECT sat_id, ts, value,
           DENSE_RANK() OVER (PARTITION BY sat_id ORDER BY value DESC) AS d
    FROM soc
)
SELECT sat_id, ts, value, d
FROM r
WHERE d <= 2 AND sat_id = 'SAT-003'
ORDER BY d, ts;
```

```text
 sat_id  |           ts           | value | d
---------+------------------------+-------+---
 SAT-003 | 2026-03-01 00:00:00+00 |  0.81 | 1
 SAT-003 | 2026-03-01 00:10:00+00 |  0.78 | 2
 SAT-003 | 2026-03-01 00:20:00+00 |  0.78 | 2
```

**Step 3: sanity check.** SAT-003's values are 0.81, 0.78, 0.78 and 0.75. The two highest levels are 0.81 and 0.78, and 0.78 happens twice, so three rows is right.

**What the others would have done.** `ROW_NUMBER() ... <= 2` returns two rows and silently drops one of the 0.78s. `RANK() ... <= 2` happens to give the same three rows here (ranks 1, 2, 2, 4), but ask for the top *three* and RANK still returns those three, because no row has rank 3, while DENSE_RANK also brings in 0.75 as level 3.

(The `sat_id = 'SAT-003'` test could go in the CTE instead, before ranking. Because the window is partitioned by satellite, filtering on `sat_id` first does not change any rank — each partition is ranked alone. Filtering on something else, like time, *would* change the ranks, as lesson 01 showed.)
:::

## NTILE: sharing rows into buckets

Picture dealing a deck of cards into piles, one card at a time down the sorted order, so that every pile gets the same number of cards, or as close as possible. **NTILE(n)** (read "n-tile") does that: it splits each partition, in the window's order, into `n` buckets numbered 1 to `n`, and tells each row its bucket. `NTILE(4)` makes **[[quartiles|quartile-words]]**: bucket 1 is the lowest quarter of the rows, bucket 4 the highest.

When the rows do not divide evenly, the sizes differ by at most one, and the bigger buckets come first. Twelve rows into 4 buckets is 3 each. Twelve rows into 5 buckets is $12 = 5 \times 2 + 2$: every bucket gets 2, and the 2 left over go one each to the first two buckets, giving sizes 3, 3, 2, 2, 2. You can [[see the deal|ntile-picture]] in a note.

::: key NTILE(n)
NTILE(n) splits each partition, in window order, into n buckets numbered 1 to n. Bucket sizes differ by at most one; the larger buckets come first. With R rows, the first R mod n buckets hold one extra row.
:::

NTILE counts rows, not values. Tied rows can land in different buckets, because the cut falls wherever the row count says. In the table below, the two readings of 0.75 are in quartiles 2 and 3. If "which quarter is this reading in?" must treat equal readings equally, use PERCENT_RANK instead.

## PERCENT_RANK: where a row sits, from 0 to 1

A rank of 6 means a lot in a list of 12 and very little in a list of 12,000. **PERCENT_RANK** turns a rank into a fraction, so rows from partitions of different sizes can be compared:

$$
\text{percent rank} = \frac{\text{rank} - 1}{\text{rows in the partition} - 1}
$$

Read it as "how many rows are strictly below me, out of all the other rows". The lowest row gets $0$, the highest gets $1$, and tied rows share a value, because the formula uses RANK. A partition with only one row gets $0$ (the database does not divide by zero there). Despite the name, the answer is a fraction from 0 to 1, not a number out of 100.

```sql
SELECT sat_id, to_char(ts, 'HH24:MI') AS hhmm, value,
       RANK() OVER (ORDER BY value) AS rnk,
       ROUND(CAST(PERCENT_RANK() OVER (ORDER BY value) AS NUMERIC), 3) AS pct_rank,
       NTILE(4) OVER (ORDER BY value, sat_id, ts) AS quartile
FROM soc
ORDER BY value, sat_id, ts;
```

```text
 sat_id  | hhmm  | value | rnk | pct_rank | quartile
---------+-------+-------+-----+----------+----------
 SAT-002 | 00:00 |  0.50 |   1 |    0.000 |        1
 SAT-002 | 00:10 |  0.55 |   2 |    0.091 |        1
 SAT-002 | 00:20 |  0.60 |   3 |    0.182 |        1
 SAT-002 | 00:50 |  0.63 |   4 |    0.273 |        2
 SAT-001 | 00:20 |  0.70 |   5 |    0.364 |        2
 SAT-001 | 00:30 |  0.75 |   6 |    0.455 |        2
 SAT-003 | 00:30 |  0.75 |   6 |    0.455 |        3
 SAT-003 | 00:10 |  0.78 |   8 |    0.636 |        3
 SAT-003 | 00:20 |  0.78 |   8 |    0.636 |        3
 SAT-003 | 00:00 |  0.81 |  10 |    0.818 |        4
 SAT-001 | 00:10 |  0.85 |  11 |    0.909 |        4
 SAT-001 | 00:00 |  0.90 |  12 |    1.000 |        4
```

Two helpers keep the table narrow. `to_char(ts, 'HH24:MI')` prints only the hours and minutes; in SQLite, with ISO text, `substr(ts, 12, 5)` does the same. And PERCENT_RANK returns a floating-point number, which PostgreSQL's two-argument ROUND does not accept, so it is **[[cast to NUMERIC|round-numeric]]** first. In SQLite, `ROUND(PERCENT_RANK() OVER (ORDER BY value), 3)` works as it stands.

Check a row by hand. The 0.75 readings have rank 6 among 12 rows: $(6 - 1)/(12 - 1) = 5/11 = 0.4545$, printed as 0.455. Both 0.75 rows get it, because both have rank 6 — unlike NTILE, which split them.

::: key PERCENT_RANK
PERCENT_RANK = (rank − 1) / (rows in partition − 1): 0 for the lowest row, 1 for the highest, shared by ties. It is a fraction from 0 to 1, not a percentage; a one-row partition gives 0.
:::

A close cousin, **CUME_DIST** ("cumulative distribution"), gives the fraction of rows at or below the current one: for the 0.75 rows, 7 of 12 rows are 0.75 or less, so $7/12 = 0.583$. PERCENT_RANK counts rows strictly below; CUME_DIST counts rows at or below. You will meet CUME_DIST less often, but it is there in PostgreSQL and SQLite alike.

## Ranking whole groups

Lesson 01 showed that a window runs after GROUP BY, over the grouped rows. That lets you rank satellites, not readings.

::: example Which satellite had the worst low point?
**Step 1: one row per satellite.** GROUP BY `sat_id`, with `MIN(value)` as each satellite's lowest charge.

**Step 2: rank the groups.** `RANK() OVER (ORDER BY MIN(value))` runs after grouping, over the three satellite rows, with the lowest minimum first.

```sql
SELECT sat_id,
       MIN(value) AS lowest,
       RANK() OVER (ORDER BY MIN(value)) AS worst_first
FROM soc
GROUP BY sat_id
ORDER BY worst_first;
```

```text
 sat_id  | lowest | worst_first
---------+--------+-------------
 SAT-002 |   0.50 |           1
 SAT-001 |   0.70 |           2
 SAT-003 |   0.75 |           3
```

**Sanity check.** From the full table: SAT-002 bottoms out at 0.50, SAT-001 at 0.70 and SAT-003 at 0.75. So SAT-002 is worst, as ranked. No two minimums tie, so RANK, DENSE_RANK and ROW_NUMBER would all agree here. Across a fleet of hundreds of satellites they would not, and RANK would give tied satellites the same place in the list.
:::

## Rules that apply to all five

A few facts hold for every ranking function.

- **They need OVER.** `RANK()` on its own is an error; a rank means nothing without a window.
- **They need an ORDER BY inside OVER to mean anything.** Without one, every row ties with every other: RANK and DENSE_RANK give every row 1, and ROW_NUMBER numbers rows in whatever order the database happens to meet them.
- **The ORDER BY direction decides what "1" means.** `ORDER BY value` makes the lowest value rank 1; `ORDER BY value DESC` makes the highest rank 1. Say which one you mean in the column name — `worst_first`, `lowest_first`.
- **They cannot go in WHERE.** Rank in a CTE or subquery, filter outside.
- **They work in SQLite.** All five, and CUME_DIST, exist in SQLite from version 3.25 with the same meaning.

::: warning NULL in the ORDER BY
If the column you rank on can be NULL, those rows still get ranks. PostgreSQL sorts NULL as larger than every value, so with `ORDER BY value` the NULL rows land at the bottom of the list, and with `ORDER BY value DESC` they come out at rank 1 — "the highest reading" turns out to be a missing one. SQLite does the opposite and sorts NULL first. Write `NULLS LAST` (both databases accept it; SQLite from 3.30) or filter the NULLs out first.
:::

## Check yourself

::: check
A column holds the five values 10, 20, 20, 20, 30. Write out ROW_NUMBER, RANK and DENSE_RANK for each row, ordered by the value.
:::

::: answer
| value | ROW_NUMBER | RANK | DENSE_RANK |
| --- | --- | --- | --- |
| 10 | 1 | 1 | 1 |
| 20 | 2 | 2 | 2 |
| 20 | 3 | 2 | 2 |
| 20 | 4 | 2 | 2 |
| 30 | 5 | 5 | 3 |

ROW_NUMBER counts every row. RANK gives the three 20s the rank 2, then skips 3 and 4, because four rows come before 30. DENSE_RANK does not skip: 30 is the third distinct value. Checks: the last RANK equals the row count here (5), and the last DENSE_RANK equals the number of distinct values (3).
:::

::: check
For the same five values, what is PERCENT_RANK of each row?
:::

::: answer
Use $(\text{rank} - 1)/(5 - 1)$ with the RANK column.

- 10: $(1 - 1)/4 = 0$.
- each 20: $(2 - 1)/4 = 0.25$.
- 30: $(5 - 1)/4 = 1$.

Lowest 0, highest 1, ties shared: as expected.
:::

::: check
You run `NTILE(3)` over 7 rows. How many rows go in each bucket? And over 12 rows with `NTILE(5)`?
:::

::: answer
Seven rows into 3 buckets: $7 = 3 \times 2 + 1$. Every bucket gets 2 rows, and the 1 left over goes to the first bucket. Sizes: 3, 2, 2 (rows 1–3 in bucket 1, rows 4–5 in bucket 2, rows 6–7 in bucket 3).

Twelve rows into 5 buckets: $12 = 5 \times 2 + 2$. Every bucket gets 2, and the first two buckets get one extra each. Sizes: 3, 3, 2, 2, 2. Check: $3 + 3 + 2 + 2 + 2 = 12$.
:::

::: check
A teammate keeps "the latest reading per satellite" with `ROW_NUMBER() OVER (PARTITION BY sat_id ORDER BY ts DESC)` filtered to 1. The table sometimes holds the same sample twice, with the same `ts`, from two ground stations. What can go wrong, and what would go wrong if they switched to RANK?
:::

::: answer
With ROW_NUMBER, two rows with the same latest `ts` still get 1 and 2, so exactly one row per satellite comes back — good. But which of the two gets 1 is not defined. If the two copies differ (say, one station received a corrupted value), the query may return the good one today and the bad one tomorrow. The fix is a tie-breaker that states a preference, for example `ORDER BY ts DESC, station_priority` or a unique key.

With RANK, both copies share rank 1, and the filter keeps **both** rows. The "one row per satellite" promise is broken, and anything joined to the result doubles. That is why deduplication uses ROW_NUMBER.
:::

::: check
Write a query that lists each satellite's single *highest* reading with its time, one row per satellite, where an earlier reading wins a tie. Say what it returns for SAT-003.
:::

::: answer
```sql
WITH r AS (
    SELECT sat_id, ts, value,
           ROW_NUMBER() OVER (PARTITION BY sat_id ORDER BY value DESC, ts) AS n
    FROM soc
)
SELECT sat_id, ts, value
FROM r
WHERE n = 1
ORDER BY sat_id;
```

ROW_NUMBER, because exactly one row per satellite is wanted. `value DESC` puts the highest first; `ts` (ascending) breaks ties in favour of the earlier reading. SAT-003's highest value is 0.81 at 00:00, which has no tie, so that is its row. SAT-001 gives 0.90 at 00:00 and SAT-002 gives 0.63 at 00:50.
:::

## Summary

| Function | Ties get | After a tie | Typical use |
| --- | --- | --- | --- |
| `ROW_NUMBER()` | different numbers (order undefined without a tie-breaker) | continues 1, 2, 3, … | exactly one row per group; deduplication |
| `RANK()` | the same number | skips: 1, 1, 3 | league tables; "how many rows beat this one" |
| `DENSE_RANK()` | the same number | no gap: 1, 1, 2 | "the top N distinct values" |
| `NTILE(n)` | possibly different buckets | — | quartiles, deciles; bucket sizes differ by at most one, larger first |
| `PERCENT_RANK()` | the same value | — | $(\text{rank} - 1)/(n - 1)$, from 0 to 1 |
| `CUME_DIST()` | the same value | — | fraction of rows at or below this one |

All of them need OVER with an ORDER BY, and all of them are filtered in an outer query, never in WHERE. Next lesson keeps the same window and asks a different question of it: not "what is my place in line?" but "what is the row just before me?" — the question behind every rate of change and every telemetry gap.

::: context top-n The top-N-per-group query
"The three worst readings per satellite", "the five hottest components per spacecraft", "the latest command per subsystem" are all the same query: number rows within each group by a preference order, then keep numbers 1 to N. Before window functions, people wrote it with a correlated subquery that counted, for each row, how many rows in the same group beat it. That works, but it compares every row with every other row in its group. The ranking version sorts each group once. Dashboards that show "top offenders" across a fleet of thousands of satellites run this pattern all day.
:::

::: context nondeterministic Why tied rows can come back in any order
A table has no built-in order. You learned in the first SQL module that rows come back in whatever order the database finds convenient. When the ORDER BY leaves two rows equal, the database is free to put either first, and the order it picks depends on things you do not control: how the rows are laid out on disk, whether the query ran in parallel across several workers, what was cached. An engineer can test a query ten times, see the same answer, and then get a different one after a routine clean-up of the table. A unique ORDER BY is the only guarantee.
:::

::: context tie-picture Three ways to number the same tie
Five readings in order, with two tied at 0.75. ROW_NUMBER splits the tie; RANK shares it and skips; DENSE_RANK shares it and does not skip.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="18">value</text><text x="150" y="18">ROW_NUMBER</text><text x="235" y="18">RANK</text><text x="315" y="18">DENSE_RANK</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="20" y="28" width="80" height="24" fill="#ffffff"/><rect x="20" y="54" width="80" height="24" fill="#f2b880"/>
    <rect x="20" y="80" width="80" height="24" fill="#f2b880"/><rect x="20" y="106" width="80" height="24" fill="#ffffff"/>
    <rect x="20" y="132" width="80" height="24" fill="#ffffff"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="44">0.70</text><text x="60" y="70">0.75</text><text x="60" y="96">0.75</text><text x="60" y="122">0.78</text><text x="60" y="148">0.81</text>
    <text x="150" y="44">1</text><text x="150" y="70">2</text><text x="150" y="96">3</text><text x="150" y="122">4</text><text x="150" y="148">5</text>
    <text x="235" y="44">1</text><text x="235" y="70">2</text><text x="235" y="96">2</text><text x="235" y="122" fill="#b4232c">4</text><text x="235" y="148">5</text>
    <text x="315" y="44">1</text><text x="315" y="70">2</text><text x="315" y="96">2</text><text x="315" y="122" fill="#1d6fd1">3</text><text x="315" y="148">4</text>
  </g>
  <text x="262" y="122" font-size="11" fill="#b4232c">skips 3</text>
</svg>
```

Count the rows listed before 0.78: three. RANK reports 4 = 3 + 1. DENSE_RANK reports 3, because 0.78 is the third distinct value.
:::

::: context league-table Places in sports and in SQL
Many sports competitions give two tied athletes the same place and skip the next one — if two share silver, the next finisher is fourth, not third. Statisticians call this "standard competition ranking", sometimes written "1224" for its pattern. The no-gap version, "1223", is called dense ranking, and that is where DENSE_RANK gets its name. Neither is more correct; they answer different questions. RANK answers "how many beat me?", DENSE_RANK answers "how many different scores beat mine?".
:::

::: context quartile-words Quartiles, deciles, percentiles
A **quartile** is a quarter of the sorted rows; NTILE(4) labels which quarter each row is in. NTILE(10) gives **deciles** (tenths) and NTILE(100) **percentiles** (hundredths). Be careful with the words: statisticians also use "quartile" for the *cut point* between two quarters — the value below which a quarter of the data lies — which is what PERCENTILE_CONT computed in the last module. NTILE gives each row a bucket label, not a cut point.
:::

::: context ntile-picture Dealing 12 rows into 5 buckets
Twelve rows do not split evenly into five. Each bucket gets two, and the two rows left over go to the first two buckets.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="10" y="30" width="26" height="30" fill="#1d6fd1"/><rect x="38" y="30" width="26" height="30" fill="#1d6fd1"/><rect x="66" y="30" width="26" height="30" fill="#1d6fd1"/>
    <rect x="98" y="30" width="26" height="30" fill="#8fb8f0"/><rect x="126" y="30" width="26" height="30" fill="#8fb8f0"/><rect x="154" y="30" width="26" height="30" fill="#8fb8f0"/>
    <rect x="186" y="30" width="26" height="30" fill="#f2b880"/><rect x="214" y="30" width="26" height="30" fill="#f2b880"/>
    <rect x="246" y="30" width="26" height="30" fill="#ffffff"/><rect x="274" y="30" width="26" height="30" fill="#ffffff"/>
    <rect x="306" y="30" width="20" height="30" fill="#6c7a93"/><rect x="328" y="30" width="20" height="30" fill="#6c7a93"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="51" y="20">bucket 1</text><text x="139" y="20">bucket 2</text><text x="213" y="20">3</text><text x="273" y="20">4</text><text x="327" y="20">5</text>
    <text x="51" y="80">3 rows</text><text x="139" y="80">3 rows</text><text x="213" y="80">2</text><text x="273" y="80">2</text><text x="327" y="80">2</text>
  </g>
  <text x="180" y="102" font-size="12" fill="#1f2a44" text-anchor="middle">lowest values on the left, highest on the right</text>
</svg>
```

Sizes 3, 3, 2, 2, 2: never more than one apart, and the bigger ones first.
:::

::: context round-numeric Why the CAST before ROUND
PostgreSQL has two ROUND functions. `ROUND(x)` rounds to a whole number and works on any number. `ROUND(x, 3)`, with a number of decimal places, exists only for NUMERIC, the exact decimal type. PERCENT_RANK and CUME_DIST return `double precision`, a floating-point type, so `ROUND(PERCENT_RANK() OVER (...), 3)` fails with "function round(double precision, integer) does not exist". Casting to NUMERIC first fixes it. SQLite has one ROUND that takes floats and a number of places, so it needs no cast.
:::
