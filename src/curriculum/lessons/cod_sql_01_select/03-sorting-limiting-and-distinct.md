---
id: l03-sorting-limiting-and-distinct
title: Sorting, limiting and removing duplicates
minutes: 22
covers:
  - ORDER BY, LIMIT and OFFSET; DISTINCT
---

An operator comes on shift and asks three questions. Which three satellites have the weakest batteries right now? Show me the fleet list one page at a time. Which telemetry channels do we even have?

Last lesson gave you the tools to pick rows and columns: `SELECT`, `FROM` and `WHERE`. But none of these three questions is only about picking. The first needs the rows **sorted** — weakest first — and then **cut off** after three. The second needs the sorted rows cut into **pages**. The third needs **repeats removed**: the `telemetry` table has ten `BATT_SOC` rows and four `BUS_TEMP` rows, and the operator wants to see each channel name once.

This lesson adds the three tools for that: `ORDER BY` to sort, `LIMIT` and `OFFSET` to cut, and `DISTINCT` to remove duplicates. Each is easy to type. Each also has a trap that has put wrong numbers in front of real engineers, and those traps are most of what this lesson is about.

## Rows come back in no particular order

Recall from lesson 01 that a table is a *set* of rows, and a set has no order. When you run a query without asking for an order, the database hands rows back in whatever order is quickest for it. Often that happens to be the order they were inserted, which makes it look as if there is an order. There is not. Watch what PostgreSQL returns for "every channel name, once each" (`DISTINCT`, the last tool in this lesson, removes the repeats):

```sql
SELECT DISTINCT channel FROM telemetry;
```

```text
 channel
----------
 BUS_TEMP
 BATT_SOC
(2 rows)
```

`BUS_TEMP` came first, even though `BATT_SOC` was inserted first and comes first in the alphabet. SQLite, running the very same query on the same data, returns `BATT_SOC` first. Neither is wrong. With no order requested, any order is a correct answer.

## ORDER BY: sorting the result

`ORDER BY` goes after `WHERE` and names the column to sort on:

```sql
SELECT sat_id, altitude_km
FROM satellite
ORDER BY altitude_km;
```

```text
 sat_id  | altitude_km
---------+-------------
 SAT-008 |         530
 SAT-007 |         530
 SAT-003 |         540
 SAT-004 |         540
 SAT-001 |         550
 SAT-002 |         550
 SAT-006 |         560
 SAT-005 |         560
(8 rows)
```

Read it "order by altitude". The rows now climb from 530 to 560 kilometers. The default direction is **ascending** — smallest first — and you can say so out loud with `ASC`. For largest first, write `DESC`, for **descending**.

Now look closely at the rows with equal altitudes. SAT-008 printed before SAT-007, and SAT-006 before SAT-005. Rows that have the same sort value are called **ties**, and you did not say how to order ties, so [[the database chose|tie-order]] — and it did not choose by id. Ties come back in any order, exactly like an unsorted table.

### Several sort keys

The fix is to give a second column to break the ties, the way a phone book sorts by last name and then, among the Smiths, by first name. List the columns in order of importance, each with its own direction:

```sql
SELECT sat_id, altitude_km
FROM satellite
ORDER BY altitude_km DESC, sat_id;
```

```text
 sat_id  | altitude_km
---------+-------------
 SAT-005 |         560
 SAT-006 |         560
 SAT-001 |         550
 SAT-002 |         550
 SAT-003 |         540
 SAT-004 |         540
 SAT-007 |         530
 SAT-008 |         530
(8 rows)
```

The database sorts by altitude, highest first. Only among rows with the same altitude does it look at `sat_id`, in ascending order (the default for that key). `DESC` applies only to the column right before it.

Because `sat_id` is the primary key, no two rows share it, so after sorting by `sat_id` there are no ties left at all. An order with no ties is called **[[deterministic|deterministic]]**: the same data always comes back in the same order. Ending your `ORDER BY` with a unique column is the habit that makes it so.

You can also sort by an alias from the `SELECT` list, such as `ORDER BY alt` after `altitude_km AS alt`. (Lesson 08 explains why an alias works here but not in `WHERE`.) You can even write a column's position, `ORDER BY 2`, but that breaks silently the day someone reorders the columns, so use names.

::: key ORDER BY
`ORDER BY a, b DESC` sorts by `a` ascending, then breaks ties by `b` descending. `ASC` (smallest first) is the default. Rows tied on every sort key come back in any order, so end the list with a unique column when the order must be repeatable.
:::

::: warning Numbers stored as text sort like words
If numbers are stored as text, they sort letter by letter: `'10'`, `'100'`, `'25'`, `'9'` — because the character 1 comes before 2, which comes before 9. Store numbers in number columns. For ids that must be text, pad them to a fixed width with leading zeros — `SAT-001` rather than `SAT-1` — so that text order and number order agree.
:::

### Where does NULL go?

A missing value has no size, so it has no natural place in a sorted list. The databases [[disagree on where to put it|nulls-order]]:

- **PostgreSQL** treats NULL as larger than every value: last in ascending order, **first** in descending order.
- **SQLite** treats NULL as smaller than every value: **first** in ascending order, last in descending order.

Both let you say which you want, with `NULLS FIRST` or `NULLS LAST` after the direction (SQLite since version 3.30). This matters more than it sounds:

```sql
SELECT sat_id, ts, value
FROM telemetry
WHERE channel = 'BATT_SOC'
ORDER BY value DESC
LIMIT 2;
```

```text
 sat_id  |          ts          | value
---------+----------------------+-------
 SAT-002 | 2026-03-01T00:01:00Z |
 SAT-001 | 2026-03-01T00:00:00Z |  0.94
(2 rows)
```

"The two best batteries" in PostgreSQL begins with a reading that has no value at all. Adding `NULLS LAST` gives 0.94 and 0.91. Often the cleaner fix is to leave missing readings out on purpose with `WHERE value IS NOT NULL`. (`IS NOT NULL` is the correct way to test for a value being present; lesson 05 explains why `<> NULL` does not work.)

::: key Where NULLs sort
PostgreSQL sorts NULL as larger than any value (last in ASC, first in DESC); SQLite sorts it as smaller (first in ASC). Say `NULLS FIRST` or `NULLS LAST`, or filter NULLs out, whenever a column can be empty.
:::

## LIMIT: keeping only the first few rows

`LIMIT n` goes at the very end of a query and keeps only the first `n` rows of the result. Together with `ORDER BY` it answers every "top three" or "worst five" question.

::: example The three weakest batteries
**Question.** Which three battery readings are lowest? Ignore readings that never arrived.

**Step 1: pick the rows.** Battery readings only, and only those with a value: `channel = 'BATT_SOC' AND value IS NOT NULL`.

**Step 2: sort weakest first.** Ascending on `value`. Add `sat_id` and `ts` after it so that two equal readings would still come back in a fixed order.

**Step 3: keep three.**

```sql
SELECT sat_id, ts, value
FROM telemetry
WHERE channel = 'BATT_SOC'
  AND value IS NOT NULL
ORDER BY value, sat_id, ts
LIMIT 3;
```

```text
 sat_id  |          ts          | value
---------+----------------------+-------
 SAT-003 | 2026-03-01T00:00:00Z |  0.19
 SAT-002 | 2026-03-01T00:00:00Z |  0.42
 SAT-008 | 2026-03-01T00:00:00Z |  0.55
(3 rows)
```

**Step 4: check by hand.** The nine battery readings that have values, from lowest up, are 0.19, 0.42, 0.55, 0.66, 0.75, 0.77, 0.88, 0.91 and 0.94. The three lowest are 0.19, 0.42 and 0.55 — matching the result. SAT-003, in safe mode, is weakest, which is what you would expect of a satellite in trouble.

**Why Step 1 mattered.** Without `value IS NOT NULL`, SQLite would put SAT-002's missing reading first (NULL sorts smallest there), and the "three weakest" would be one blank and two real readings. PostgreSQL would happen to get it right, by putting the NULL last. A query whose answer depends on which database runs it is a query that will one day be wrong.
:::

### LIMIT without ORDER BY promises nothing

It is tempting to write `SELECT * FROM telemetry LIMIT 10` and think of it as "the first ten rows". But there is no "first" in a set. Here is a copy of the `satellite` table, asked for three rows, before and after one ordinary update:

```sql
SELECT sat_id, status FROM sat_copy LIMIT 3;
```

```text
 sat_id  |  status
---------+-----------
 SAT-001 | ACTIVE
 SAT-002 | ACTIVE
 SAT-003 | SAFE_MODE
(3 rows)
```

```sql
UPDATE sat_copy SET status = 'SAFE_MODE' WHERE sat_id = 'SAT-001';
SELECT sat_id, status FROM sat_copy LIMIT 3;
```

```text
 sat_id  |  status
---------+-----------
 SAT-002 | ACTIVE
 SAT-003 | SAFE_MODE
 SAT-004 | ACTIVE
(3 rows)
```

Same query, different rows. SAT-001 did not go anywhere; PostgreSQL wrote its [[new version at the end of the table|row-storage]], so it is now the last row the database happens to read. A new index, a table that grew, a database upgrade or a query running on several processors at once can all shuffle rows the same way.

::: key What LIMIT without ORDER BY guarantees
Nothing about which rows you get. Without an ORDER BY the engine may return any rows in any order, and the answer can change between runs or after an index change.
:::

The same goes for ties. Earlier, `ORDER BY altitude_km` put SAT-008 before SAT-007. Yet here is the same sort cut to one row:

```sql
SELECT sat_id, altitude_km FROM satellite ORDER BY altitude_km LIMIT 1;
```

```text
 sat_id  | altitude_km
---------+-------------
 SAT-007 |         530
(1 row)
```

Two lowest satellites tie at 530 km, and `LIMIT 1` must drop one of them. Which one depends on how the database chose to sort that time. Adding `sat_id` to the `ORDER BY` makes the answer SAT-007 every time.

::: warning LIMIT cuts ties arbitrarily
If the row at the cut-off point is tied with the row right after it, which of them makes it in is chance. Either break ties with a unique column, or decide that ties matter and handle them deliberately (window functions, in a later module, can keep every tied row).
:::

## OFFSET: paging through a result

`OFFSET k` says "skip the first `k` rows, then start". With `LIMIT` it cuts a sorted result into **pages** — how a web page shows 50 alarms at a time. For pages of size $n$, page $p$ (counting from 1) skips the rows on all the pages before it:

$$
\text{OFFSET} = (p - 1) \times n
$$

Read it "offset equals p minus one, times n".

::: example Paging the fleet list
**Question.** Show the fleet sorted by id, three satellites per page. What is on pages 2 and 3?

**Step 1: page 2.** Here $p = 2$ and $n = 3$, so $\text{OFFSET} = (2 - 1) \times 3 = 3$. Skip three rows, then keep three:

```sql
SELECT sat_id, name
FROM satellite
ORDER BY sat_id
LIMIT 3 OFFSET 3;
```

```text
 sat_id  |  name
---------+---------
 SAT-004 | Relay-1
 SAT-005 | Relay-2
 SAT-006 | Relay-3
(3 rows)
```

**Step 2: page 3.** Now $\text{OFFSET} = (3 - 1) \times 3 = 6$. With `LIMIT 3 OFFSET 6` the result is SAT-007 (Mini-1) and SAT-008 (Mini-2).

**Step 3: check.** Page 3 has only two rows. That is right: 8 satellites are two full pages of 3 (six satellites) plus 2 left over. An app knows it has reached the end when a page comes back shorter than $n$.

**Why ORDER BY is not optional here.** Without it, each page is a separate query, and each may see the rows in a different order. A satellite could appear on two pages, and another on none.
:::

`OFFSET` has two costs worth knowing. First, it is not free: to skip 100,000 rows, the database still finds and sorts them, then throws them away, so deep pages get slower and slower. Second, if rows are added while someone is paging, everything after the new row slides down one place, so the next page repeats a row. Busy systems often page with **[[keyset pagination|keyset]]** instead: remember the last id you showed, and ask for rows after it.

```sql
SELECT sat_id, name
FROM satellite
WHERE sat_id > 'SAT-006'
ORDER BY sat_id
LIMIT 3;
```

```text
 sat_id  |  name
---------+--------
 SAT-007 | Mini-1
 SAT-008 | Mini-2
(2 rows)
```

That is page 3 again, but found by jumping through the primary-key index rather than by skipping six rows.

`LIMIT` and `OFFSET` are understood by PostgreSQL, SQLite, MySQL and many others, but they are not in the official SQL standard. The standard spelling is [[FETCH FIRST|fetch-first]]: `ORDER BY sat_id OFFSET 3 ROWS FETCH FIRST 3 ROWS ONLY`. PostgreSQL accepts both; SQLite accepts only `LIMIT`.

::: key LIMIT and OFFSET
`LIMIT n` keeps the first `n` rows of the sorted result; `OFFSET k` skips `k` rows first. Page $p$ of size $n$ uses `LIMIT n OFFSET (p − 1) × n`, and only makes sense with a deterministic `ORDER BY`.
:::

## DISTINCT: removing repeated rows

`SELECT DISTINCT` removes duplicate rows from the result, so each different row appears once. Read it "select distinct". Which satellites have ever reported a bus temperature?

```sql
SELECT DISTINCT sat_id
FROM telemetry
WHERE channel = 'BUS_TEMP';
```

```text
 sat_id
---------
 SAT-001
 SAT-002
 SAT-003
 SAT-005
(4 rows)
```

`DISTINCT` looks at the **whole row** of the result, not only the first column. With two columns, two rows are duplicates only if both columns match:

```sql
SELECT DISTINCT plane, status
FROM satellite
ORDER BY plane, status;
```

```text
 plane |    status
-------+---------------
     1 | ACTIVE
     2 | ACTIVE
     2 | SAFE_MODE
     3 | ACTIVE
     3 | DEORBITED
     4 | ACTIVE
     4 | COMMISSIONING
(7 rows)
```

Eight satellites, seven different (plane, status) pairs: only SAT-001 and SAT-002, both plane 1 and ACTIVE, collapse into one row. Plane 2 appears twice because its two satellites have different statuses.

Two more details. For `DISTINCT`, NULLs count as equal to each other, so several missing values collapse into one NULL row (even though, as lesson 05 shows, `NULL = NULL` is not true in a `WHERE`). And `DISTINCT` happens before `ORDER BY`, so in PostgreSQL you can only sort a `DISTINCT` result by columns you selected: `SELECT DISTINCT sat_id FROM telemetry ORDER BY ts` fails with "for SELECT DISTINCT, ORDER BY expressions must appear in select list". That makes sense: after collapsing SAT-001's three rows into one, which of its three timestamps would you sort by? (SQLite runs the query anyway and picks one for you, which is worse.)

::: key DISTINCT
`SELECT DISTINCT` keeps one copy of each different result row, comparing all selected columns together. NULLs count as equal for this purpose. It is applied after `SELECT` and before `ORDER BY` and `LIMIT`.
:::

### When DISTINCT is hiding a bug

`DISTINCT` is honest when the repeats are real and expected, like channel names in a long telemetry log. It is dangerous when you reach for it because a result "has duplicates it should not have". Those duplicates almost always mean something upstream is wrong, and `DISTINCT` only covers it up.

The usual culprit is combining two tables whose link is [[one-to-many|fan-out]]. The next module teaches that tool, called a **join**, properly; you only need to see its effect here.

::: example Total mass, and a DISTINCT that does not help
**Question.** What is the total mass of the satellites that have sent at least one battery reading?

**Step 1: the right answer, by hand.** From lesson 02, `sat_id IN (SELECT sat_id FROM telemetry WHERE channel = 'BATT_SOC')` finds those satellites: every one except SAT-006. Three weigh 306 kg, two weigh 800 kg and two weigh 740 kg:

$$
3 \times 306 + 2 \times 800 + 2 \times 740 = 918 + 1600 + 1480 = 3998\,\mathrm{kg}.
$$

The query agrees:

```sql
SELECT SUM(mass_kg)
FROM satellite
WHERE sat_id IN (SELECT sat_id FROM telemetry WHERE channel = 'BATT_SOC');
```

```text
 sum
------
 3998
(1 row)
```

(`SUM` adds up a column; the next module covers it and its relatives.)

**Step 2: the join.** A teammate instead joins the tables, pairing each satellite row with each of its battery readings:

```sql
SELECT satellite.sat_id, mass_kg, ts
FROM satellite JOIN telemetry ON telemetry.sat_id = satellite.sat_id
WHERE channel = 'BATT_SOC'
ORDER BY satellite.sat_id, ts;
```

```text
 sat_id  | mass_kg |          ts
---------+---------+----------------------
 SAT-001 |     306 | 2026-03-01T00:00:00Z
 SAT-001 |     306 | 2026-03-01T00:01:00Z
 SAT-002 |     306 | 2026-03-01T00:00:00Z
 SAT-002 |     306 | 2026-03-01T00:01:00Z
 SAT-003 |     306 | 2026-03-01T00:00:00Z
 SAT-004 |     800 | 2026-03-01T00:00:00Z
 SAT-004 |     800 | 2026-03-01T00:01:00Z
 SAT-005 |     800 | 2026-03-01T00:00:00Z
 SAT-007 |     740 | 2026-03-01T00:00:00Z
 SAT-008 |     740 | 2026-03-01T00:00:00Z
(10 rows)
```

Seven satellites have become ten rows: SAT-001, SAT-002 and SAT-004 each appear twice, once per reading. That multiplication is called **fan-out**. Summing `mass_kg` over these rows gives 5410 kg, counting three satellites twice:

$$
3998 + 306 + 306 + 800 = 5410.
$$

**Step 3: the tempting patch.** `SELECT DISTINCT satellite.sat_id, mass_kg …` does print seven tidy rows, so the list *looks* fixed. But the total is still computed from the ten fanned-out rows. And the other quick patch, `SUM(DISTINCT mass_kg)`, adds each *different mass* once — $306 + 800 + 740 = 1846$ — which is not the fleet's mass at all, because satellites that happen to weigh the same get merged.

**Step 4: the real fix.** Stop the fan-out at its source: ask about satellites without multiplying them by readings (Step 1's query), or summarize the readings down to one row per satellite *before* joining. Three different numbers — 3998, 5410, 1846 — and only the first is the answer. It matched the hand count, which is the check that caught the others.
:::

::: key Why DISTINCT often indicates a bug rather than a fix
Unexpected duplicates usually come from a join fanning out one-to-many. DISTINCT hides the fan-out but leaves aggregates wrong; the correct fix is to aggregate before joining or to join on the right key.
:::

## Check yourself

::: check
Write a query that lists every satellite's id, plane and launch date, newest launch first, and within the same launch date by id. What are the first three rows?
:::

::: answer
```sql
SELECT sat_id, plane, launch_date
FROM satellite
ORDER BY launch_date DESC, sat_id;
```

The newest launch date is 2025-02-11 (SAT-007 and SAT-008, plane 4), so those come first, in id order. Next is 2024-06-20 (SAT-005 and SAT-006). The first three rows are SAT-007, SAT-008 and SAT-005. Because `sat_id` is unique, the order is deterministic.
:::

::: check
A dashboard shows "latest reading" with `SELECT * FROM telemetry WHERE sat_id = 'SAT-004' LIMIT 1`. It worked in testing. Why is it wrong, and how do you fix it?
:::

::: answer
Without `ORDER BY`, `LIMIT 1` returns an arbitrary one of SAT-004's rows — whichever the database reads first. In testing that was probably the latest by luck of insertion order; after updates, a new index or a bigger table it may be any row. Fix: `ORDER BY ts DESC LIMIT 1`. Since several channels share a timestamp, also filter to one channel (for example `AND channel = 'BATT_SOC'`) so "latest reading" means one well-defined row.
:::

::: check
An alarm list shows 25 alarms per page. Which `LIMIT` and `OFFSET` fetch page 5? Which alarms (by position in the sorted list) are on it?
:::

::: answer
$\text{OFFSET} = (5 - 1) \times 25 = 100$, so `LIMIT 25 OFFSET 100`. It skips alarms 1 to 100 and returns alarms 101 to 125. (Check: pages 1 to 4 hold $4 \times 25 = 100$ alarms, so page 5 starts at alarm 101.) It needs an `ORDER BY` ending in a unique column, or alarms may repeat or vanish between pages.
:::

::: check
How many rows does `SELECT DISTINCT altitude_km, mass_kg FROM satellite` return? List them.
:::

::: answer
Pair each satellite's altitude and mass: (550, 306) twice, (540, 306), (540, 800), (560, 800) twice, (530, 740) twice. The different pairs are (550, 306), (540, 306), (540, 800), (560, 800) and (530, 740): **five rows**. Plane 2's satellites stay separate because their masses differ even though their altitudes match.
:::

::: check
A report of "satellites with a battery reading below 0.8" returned SAT-004 twice, so someone added `DISTINCT`. Is that a fine fix here? Would the same fix be fine for a report that sums up satellite masses from a join?
:::

::: answer
For a plain list of which satellites qualify, yes: SAT-004 appears twice because it has two readings below 0.8 (0.77 and 0.75), and "which satellites" genuinely wants each once. `DISTINCT` states that intent. For a sum built on a join, no: the extra rows come from fan-out, and `DISTINCT` on the displayed rows does not change the total, while `SUM(DISTINCT …)` merges different satellites that happen to weigh the same. The fix there is to avoid the fan-out, not hide it.
:::

## Summary

| Piece | What it does | Watch out for |
| --- | --- | --- |
| `ORDER BY a` | sort ascending (`ASC`, the default) | ties come back in any order |
| `ORDER BY a DESC, id` | sort descending, break ties by `id` | `DESC` applies to one column |
| `NULLS FIRST` / `NULLS LAST` | say where missing values go | PostgreSQL and SQLite default differently |
| `LIMIT n` | keep the first `n` rows | without `ORDER BY`, any `n` rows |
| `OFFSET k` | skip `k` rows first | page $p$: `OFFSET (p − 1) × n`; slow when deep |
| keyset paging | `WHERE id > last ORDER BY id LIMIT n` | needs a unique sort key |
| `SELECT DISTINCT` | one copy of each different row | often hides a one-to-many fan-out |

You can now pick, sort, cut and de-duplicate rows. So far every column you printed was stored in the table. Next lesson you compute new columns — arithmetic, text and `CASE WHEN`, which turns a raw battery charge into a status like CRITICAL, LOW or OK.

::: context tie-order Why ties came out in a different order
To sort, PostgreSQL picks an algorithm to suit the job. For the full list it used quicksort; for the same sort cut to one row with `LIMIT 1`, it used a "top-N heapsort", which keeps only the best few rows as it goes. Neither promises to keep tied rows in the order they arrived — a sort with that promise is called **stable**, and these are not. So SAT-008 came first in one query and SAT-007 in the other, and both were correct answers to what was asked.
:::

::: context deterministic Same input, same output
Something is **deterministic** when the same input always gives the same output, with no chance involved. Engineers prize it. A test that passes on Monday and fails on Tuesday with no code change is often a missing tie-breaker. So is a flight-data report whose "top five anomalies" shuffle every time it is rerun, which makes two analysts argue about different lists. Ending every `ORDER BY` with a unique column costs nothing and removes that whole class of puzzle.
:::

::: context nulls-order Two answers for the same question
Where a missing value lands in a sort is a choice each database made, not a law of nature.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="30" font-size="12" fill="#1f2a44">PostgreSQL, ASC</text>
  <g font-size="11" text-anchor="middle">
    <rect x="130" y="16" width="44" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="152" y="31" fill="#1f2a44">0.19</text>
    <rect x="178" y="16" width="44" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="200" y="31" fill="#1f2a44">0.42</text>
    <rect x="226" y="16" width="44" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="248" y="31" fill="#1f2a44">…</text>
    <rect x="274" y="16" width="60" height="22" fill="#f2b880" stroke="#1f2a44"/><text x="304" y="31" fill="#1f2a44">NULL</text>
  </g>
  <text x="20" y="86" font-size="12" fill="#1f2a44">SQLite, ASC</text>
  <g font-size="11" text-anchor="middle">
    <rect x="130" y="72" width="60" height="22" fill="#f2b880" stroke="#1f2a44"/><text x="160" y="87" fill="#1f2a44">NULL</text>
    <rect x="194" y="72" width="44" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="216" y="87" fill="#1f2a44">0.19</text>
    <rect x="242" y="72" width="44" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="264" y="87" fill="#1f2a44">0.42</text>
    <rect x="290" y="72" width="44" height="22" fill="#8fb8f0" stroke="#1f2a44"/><text x="312" y="87" fill="#1f2a44">…</text>
  </g>
  <text x="180" y="120" font-size="11" fill="#6c7a93" text-anchor="middle">DESC flips both: PostgreSQL then puts NULL first</text>
</svg>
```

The SQL standard leaves the default up to each database, which is why writing `NULLS LAST` yourself is the portable choice.
:::

::: context row-storage Why the update moved the row
PostgreSQL never overwrites a row in place. An `UPDATE` writes a complete new version of the row, usually in the next free spot in the table's storage, and marks the old version as dead so it can be cleaned up later. This lets someone who started reading before the update keep seeing the old version while the change happens.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="90" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">before</text>
  <text x="270" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">after UPDATE</text>
  <g font-size="11" text-anchor="middle">
    <rect x="30" y="26" width="120" height="20" fill="#8fb8f0" stroke="#1f2a44"/><text x="90" y="40" fill="#1f2a44">SAT-001</text>
    <rect x="30" y="48" width="120" height="20" fill="#8fb8f0" stroke="#1f2a44"/><text x="90" y="62" fill="#1f2a44">SAT-002</text>
    <rect x="30" y="70" width="120" height="20" fill="#8fb8f0" stroke="#1f2a44"/><text x="90" y="84" fill="#1f2a44">SAT-003</text>
    <rect x="30" y="92" width="120" height="20" fill="#fff" stroke="#1f2a44"/><text x="90" y="106" fill="#1f2a44">SAT-004 … 008</text>
    <rect x="210" y="26" width="120" height="20" fill="#fff" stroke="#6c7a93" stroke-dasharray="4 3"/><text x="270" y="40" fill="#6c7a93">SAT-001 (dead)</text>
    <rect x="210" y="48" width="120" height="20" fill="#8fb8f0" stroke="#1f2a44"/><text x="270" y="62" fill="#1f2a44">SAT-002</text>
    <rect x="210" y="70" width="120" height="20" fill="#8fb8f0" stroke="#1f2a44"/><text x="270" y="84" fill="#1f2a44">SAT-003</text>
    <rect x="210" y="92" width="120" height="20" fill="#8fb8f0" stroke="#1f2a44"/><text x="270" y="106" fill="#1f2a44">SAT-004 … 008</text>
    <rect x="210" y="114" width="120" height="20" fill="#f2b880" stroke="#1f2a44"/><text x="270" y="128" fill="#1f2a44">SAT-001 (new)</text>
  </g>
  <text x="90" y="134" font-size="11" fill="#1d6fd1" text-anchor="middle">LIMIT 3 reads 001–003</text>
</svg>
```

A plain `LIMIT 3` reads rows in storage order and stops after three live ones. After the update, the first live rows are SAT-002, 003 and 004.
:::

::: context keyset Keyset pagination
With `OFFSET`, page 1,000 of a big table means finding and discarding 999 pages of rows first. Keyset pagination instead remembers where the last page ended — "the last id I showed was SAT-006" — and asks for rows after it. The primary-key index jumps straight to that spot, so page 1,000 is as fast as page 1. It also copes with new rows: a row inserted earlier in the order does not shift the later pages. The price is that you cannot jump to "page 37" directly, only to the next page, which is why infinite-scroll feeds on the web usually work this way.
:::

::: context fetch-first Why two spellings exist
`LIMIT` was added to PostgreSQL and MySQL in the 1990s, long before the SQL standard had any way to say "only the first few rows". When the standards committee finally added one, in SQL:2008, it chose the wordier `FETCH FIRST n ROWS ONLY`. By then `LIMIT` was everywhere, so most databases now support one spelling or both. Oracle and SQL Server use the standard form (SQL Server also has its own `TOP n`). Which you use is mostly a matter of what your team's database accepts.
:::

::: context fan-out Picturing fan-out
When one satellite row is paired with each of its readings, the satellite's columns are copied once per reading.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="60" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">satellite</text>
  <text x="270" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">joined rows</text>
  <rect x="10" y="60" width="100" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="76" font-size="11" fill="#1f2a44" text-anchor="middle">SAT-004 · 800 kg</text>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="190" y="40" width="160" height="24"/>
    <rect x="190" y="80" width="160" height="24"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="198" y="56">SAT-004 · 800 kg · 00:00</text>
    <text x="198" y="96">SAT-004 · 800 kg · 00:01</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="110" y1="70" x2="186" y2="52"/>
    <line x1="110" y1="74" x2="186" y2="92"/>
  </g>
  <polygon points="190,52 181,49 183,57" fill="#1d6fd1"/>
  <polygon points="190,92 183,87 181,95" fill="#1d6fd1"/>
  <text x="270" y="130" font-size="11" fill="#b4232c" text-anchor="middle">SUM(mass_kg) counts 800 twice</text>
  <text x="60" y="130" font-size="11" fill="#6c7a93" text-anchor="middle">one satellite</text>
</svg>
```

Nothing is wrong with the joined rows themselves: each pairs a satellite with a real reading. The mistake is adding up a satellite fact (mass) over rows that exist once per *reading*. The next module shows how to summarize before joining so each satellite counts once.
:::
