---
id: l06-grouping-sets-rollup-cube
title: "Subtotals: GROUPING SETS, ROLLUP and CUBE"
minutes: 20
covers:
  - GROUPING SETS, ROLLUP and CUBE
---

Think of a shop receipt. Each item has its own line. Near the bottom there is a subtotal, then tax, then one grand total. Nobody has to add the lines up in their head, because the receipt does it at several levels at once.

Fleet reports want the same thing. The thermal team's weekly sheet has one line per satellite, a subtotal line for each **[[orbital plane|plane-word]]** (a group of satellites sharing the same orbit shape and tilt), and a single line for the whole fleet. With the GROUP BY you know, one query gives you exactly one level of grouping. Three levels means three queries, and then someone gluing their outputs together in a spreadsheet — where the numbers can **[[drift apart|spreadsheet-drift]]** from the database's.

SQL has a better way. **GROUPING SETS** runs several groupings in one query and stacks their results. **ROLLUP** is the shorthand for subtotals that go up a hierarchy, satellite to plane to fleet. **CUBE** is the shorthand for every combination of totals, like the margins of a two-way table. And a small function, **GROUPING()**, tells you which rows are subtotals. The running example is the module's `satellite` and `reading` tables; the end of the lesson shows how to get the same results in SQLite, which has none of these words.

## Several groupings, stacked

Start with what you could already write. Here are three separate questions about readings: how many per satellite, how many per plane, and how many in total.

```sql
SELECT s.plane, s.name, COUNT(*) AS n
FROM reading AS r JOIN satellite AS s ON s.sat_id = r.sat_id
GROUP BY s.plane, s.name;          -- one row per satellite

SELECT s.plane, COUNT(*) AS n
FROM reading AS r JOIN satellite AS s ON s.sat_id = r.sat_id
GROUP BY s.plane;                  -- one row per plane

SELECT COUNT(*) AS n
FROM reading AS r JOIN satellite AS s ON s.sat_id = r.sat_id;   -- one row for everything
```

Each query has a different **grouping set** — the list of columns it groups by. The first uses `(plane, name)`, the second `(plane)`, and the third groups by nothing at all. Grouping by nothing is written `()`, read "**[[the empty grouping set|empty-set]]**": every row falls into one single group, which is why the third query returns one row.

**GROUPING SETS** lets you hand the database all three lists at once:

```sql
GROUP BY GROUPING SETS ((s.plane, s.name), (s.plane), ())
```

The database runs each grouping and stacks the resulting rows into one output. Every output row has the same columns. So what goes in the `name` column of a per-plane row, where there is no single name? NULL. And in the grand-total row, both `plane` and `name` are NULL. A NULL in a grouping column of a stacked result means "this column was **[[rolled up|rolled-up]]** — the row covers all of its values".

::: key GROUPING SETS
`GROUP BY GROUPING SETS ((a, b), (a), ())` computes the aggregates once for each listed grouping and stacks the results. A column that is not in a row's grouping set comes out NULL in that row. `()` is the empty grouping set: one group containing every row, which gives the grand total.
:::

The grouping sets do not have to form a ladder. Here is readings per plane and readings per day, plus a grand total, in one result:

```sql
SELECT s.plane, substr(r.ts, 1, 10) AS day, COUNT(*) AS n
FROM reading AS r
JOIN satellite AS s ON s.sat_id = r.sat_id
GROUP BY GROUPING SETS ((s.plane), (substr(r.ts, 1, 10)), ())
ORDER BY s.plane, day;
```

```text
 plane  |    day     | n
--------+------------+---
      1 | [NULL]     | 5
      2 | [NULL]     | 1
 [NULL] | 2026-03-01 | 4
 [NULL] | 2026-03-02 | 2
 [NULL] | [NULL]     | 6
```

The first two rows came from the `(plane)` grouping, so their `day` is NULL. The next two came from the `(day)` grouping, so their `plane` is NULL. The last is the grand total. Sanity check: the plane rows add to $5 + 1 = 6$ and the day rows add to $4 + 2 = 6$, both equal to the total, as they must be.

(`substr(r.ts, 1, 10)` takes the first ten characters of the timestamp text, the day, exactly as in the module's first exercise.)

## ROLLUP: subtotals up a hierarchy

Most subtotal reports climb a ladder. Satellites sit inside planes, and planes sit inside the fleet. Days sit inside months, and months inside years. Writing out every rung by hand gets tedious, so SQL has a shorthand. **ROLLUP** takes a list of columns, from the biggest category to the smallest, and makes **[[one grouping set for each rung|rollup-ladder]]**:

```sql
GROUP BY ROLLUP (a, b)      -- means GROUPING SETS ((a, b), (a), ())
GROUP BY ROLLUP (a, b, c)   -- means GROUPING SETS ((a, b, c), (a, b), (a), ())
```

It drops columns off the right-hand end one at a time until nothing is left. With $n$ columns you get $n + 1$ grouping sets.

Because it drops from the right, **the order of the columns matters**. `ROLLUP (plane, name)` gives per-satellite rows, per-plane subtotals and a grand total. `ROLLUP (name, plane)` gives per-satellite rows, then "per name" rows (the same numbers again, with plane NULL), and a grand total — no plane subtotals at all. Always list the columns from the outermost category inwards.

::: example A satellite report with plane subtotals
The thermal team wants reading counts and mean bus temperature per satellite, with a subtotal per plane and one for the whole fleet.

```sql
SELECT s.plane, s.name,
       COUNT(*)     AS n,
       AVG(r.value) AS mean_temp
FROM reading AS r
JOIN satellite AS s ON s.sat_id = r.sat_id
GROUP BY ROLLUP (s.plane, s.name)
ORDER BY s.plane, s.name;
```

```text
 plane  |   name   | n |     mean_temp
--------+----------+---+--------------------
      1 | Aurora   | 3 | 24.666666666666668
      1 | Borealis | 2 |                 20
      1 | [NULL]   | 5 |               22.8
      2 | Cirrus   | 1 |                 11
      2 | [NULL]   | 1 |                 11
 [NULL] | [NULL]   | 6 | 20.833333333333332
```

Check the plane 1 subtotal by hand. Aurora's readings are 20, 24 and 30; Borealis's are 18 and 22. That is 5 readings with a sum of $20 + 24 + 30 + 18 + 22 = 114$, so the mean is $114 / 5 = 22.8$ °C.

Notice what the subtotal is *not*. It is not the average of the two satellites' averages, which would be $(24.67 + 20) / 2 \approx 22.33$. ROLLUP recomputes each aggregate from the raw rows in the bigger group, so Aurora's three readings weigh more than Borealis's two. That is the honest answer, and the one people get wrong when they add subtotals by hand in a spreadsheet.

Plane 2's subtotal equals Cirrus's own row, because Cirrus is plane 2's only satellite with readings. Dorado, also in plane 2, has none, and the inner join dropped it. The grand total is $125 / 6 \approx 20.83$ °C over all six readings.

Sanity check: the counts in each subtotal add up from the rows above it, $3 + 2 = 5$, and the two subtotals add to the grand total, $5 + 1 = 6$.
:::

::: key ROLLUP
`ROLLUP (a, b, c)` is short for `GROUPING SETS ((a, b, c), (a, b), (a), ())`: detail rows, subtotals up a hierarchy, and a grand total — $n + 1$ grouping sets for $n$ columns. List the columns from the outermost category to the innermost. Each subtotal is recomputed from the raw rows, not from the rows above it.
:::

You can also roll up only part of the grouping. `GROUP BY s.plane, ROLLUP (substr(r.ts, 1, 10))` keeps `plane` in every grouping set and rolls up only the day, so you get per-plane-per-day rows and a subtotal for each plane, but no grand total.

## CUBE: every combination of totals

Picture a two-way table on paper: planes down the side, days across the top, a count in each cell. Then add a total at the end of every row, at the foot of every column, and one in the bottom corner. Those **[[margins|cube-margins]]** are every combination of "keep this column or roll it up".

**CUBE** makes exactly that. For two columns:

```sql
GROUP BY CUBE (a, b)   -- means GROUPING SETS ((a, b), (a), (b), ())
```

For each column you choose "keep it" or "roll it up". Two choices per column across $n$ columns gives $2^n$ grouping sets: 4 for two columns, 8 for three. A CUBE over many columns **[[grows fast|cube-growth]]**, so use it on two or three.

The difference from ROLLUP is the $(b)$ set. ROLLUP gives subtotals only up its one ladder. CUBE also gives the totals across the other way — here, per day across all planes.

::: example Readings by plane and by day, with every margin
```sql
SELECT s.plane, substr(r.ts, 1, 10) AS day,
       COUNT(*)     AS n,
       MAX(r.value) AS max_temp
FROM reading AS r
JOIN satellite AS s ON s.sat_id = r.sat_id
GROUP BY CUBE (s.plane, substr(r.ts, 1, 10))
ORDER BY GROUPING(s.plane, substr(r.ts, 1, 10)), s.plane, day;
```

```text
 plane  |    day     | n | max_temp
--------+------------+---+----------
      1 | 2026-03-01 | 4 |       24
      1 | 2026-03-02 | 1 |       30
      2 | 2026-03-02 | 1 |       11
      1 | [NULL]     | 5 |       30
      2 | [NULL]     | 1 |       11
 [NULL] | 2026-03-01 | 4 |       24
 [NULL] | 2026-03-02 | 2 |       30
 [NULL] | [NULL]     | 6 |       30
```

(The ORDER BY uses the GROUPING function, explained in the next section, to put detail rows first and the grand total last.)

Read it as a table. The first three rows are the cells. Plane 2 had no readings on 1 March, so there is no cell for that pair; CUBE only reports groups that contain rows. The next two rows are the plane margins, the two after that the day margins, and the last is the corner.

Check the day margin for 2 March. Plane 1 sent one reading that day (Aurora's 30) and plane 2 one (Cirrus's 11), so $n = 1 + 1 = 2$ and the hottest is 30. The row says 2 and 30.

Sanity check: MAX in every margin equals the largest MAX among the cells it covers, and the corner's 30 is the hottest reading in the whole table.
:::

::: key CUBE
`CUBE (a, b)` is short for `GROUPING SETS ((a, b), (a), (b), ())`: every combination of kept and rolled-up columns, $2^n$ grouping sets for $n$ columns. Use ROLLUP for a hierarchy, CUBE for a cross-tabulation with every margin.
:::

## Telling a subtotal from a real NULL: GROUPING()

A NULL in a grouping column usually means "rolled up". But a column can also hold a real NULL from the data. When both happen in one result you cannot tell them apart by eye — and neither can the code that reads the report.

This happens with the module's data as soon as you keep silent satellites. A LEFT JOIN from `satellite` keeps Dorado with no reading, so Dorado's "day" is a real NULL. Now roll up by satellite and day:

::: example Two rows that look the same
```sql
SELECT s.name, substr(r.ts, 1, 10) AS day, COUNT(r.value) AS n,
       GROUPING(s.name)              AS g_name,
       GROUPING(substr(r.ts, 1, 10)) AS g_day
FROM satellite AS s
LEFT JOIN reading AS r ON r.sat_id = s.sat_id
GROUP BY ROLLUP (s.name, substr(r.ts, 1, 10))
ORDER BY s.name, day;
```

```text
   name   |    day     | n | g_name | g_day
----------+------------+---+--------+-------
 Aurora   | 2026-03-01 | 2 |      0 |     0
 Aurora   | 2026-03-02 | 1 |      0 |     0
 Aurora   | [NULL]     | 3 |      0 |     1
 Borealis | 2026-03-01 | 2 |      0 |     0
 Borealis | [NULL]     | 2 |      0 |     1
 Cirrus   | 2026-03-02 | 1 |      0 |     0
 Cirrus   | [NULL]     | 1 |      0 |     1
 Dorado   | [NULL]     | 0 |      0 |     0
 Dorado   | [NULL]     | 0 |      0 |     1
 [NULL]   | [NULL]     | 6 |      1 |     1
```

The last row is the grand total, with both columns rolled up, so both GROUPING columns are 1. The two Dorado rows are the point. Both show `Dorado | [NULL] | 0`. The first is Dorado's one "day" group, whose day really is NULL because Dorado sent nothing: `g_day` is 0, meaning "day was a grouping column here, and its value was NULL". The second is Dorado's subtotal over all days: `g_day` is 1, meaning "day was rolled up".

Without the GROUPING columns, a report reader would see a duplicated line and could not tell which one was the subtotal.
:::

**GROUPING(col)** returns 1 when `col` was rolled up in that row and 0 when it was a real grouping column. It only ever looks at how the row was grouped, never at the value, so a data NULL gives 0.

Given several columns, `GROUPING(a, b)` packs the answers into one whole number, one **[[bit per column|grouping-bits]]**, with the first column worth 2 and the second worth 1. A detail row gives 0, a row with only `b` rolled up gives 1, only `a` rolled up gives 2, and the grand total gives 3. That is why the CUBE example could sort by it.

The most common use is labelling. A CASE on GROUPING turns the NULLs into words a reader cannot misread:

```sql
SELECT CASE WHEN GROUPING(s.plane) = 1 THEN 'all planes'
            ELSE 'plane ' || s.plane END            AS plane_label,
       CASE WHEN GROUPING(s.name) = 1 THEN '(subtotal)'
            ELSE s.name END                          AS sat,
       COUNT(*) AS n,
       ROUND(AVG(r.value)::numeric, 2) AS mean_temp
FROM reading AS r
JOIN satellite AS s ON s.sat_id = r.sat_id
GROUP BY ROLLUP (s.plane, s.name)
ORDER BY GROUPING(s.plane), s.plane, GROUPING(s.name), s.name;
```

```text
 plane_label |    sat     | n | mean_temp
-------------+------------+---+-----------
 plane 1     | Aurora     | 3 |     24.67
 plane 1     | Borealis   | 2 |     20.00
 plane 1     | (subtotal) | 5 |     22.80
 plane 2     | Cirrus     | 1 |     11.00
 plane 2     | (subtotal) | 1 |     11.00
 all planes  | (subtotal) | 6 |     20.83
```

The ORDER BY is worth reading slowly. `GROUPING(s.plane)` first puts every row that belongs to a plane (0) before the fleet total (1). Then `s.plane` orders the planes. Then `GROUPING(s.name)` puts a plane's satellites (0) before its subtotal (1). The result reads like a receipt.

::: key GROUPING()
`GROUPING(col)` is 1 when `col` was rolled up in that row and 0 otherwise, so it tells a subtotal NULL from a NULL in the data. `GROUPING(a, b)` returns $2 \times$ GROUPING(a) $+$ GROUPING(b). Use it in CASE to label subtotal rows and in ORDER BY to place them.
:::

::: warning Do not add up a rolled-up result
A result with subtotals holds every reading more than once: in its detail row, in its plane subtotal and in the grand total. `SUM(n)` over the whole ROLLUP output above would give $3 + 2 + 5 + 1 + 1 + 6 = 18$, three times the real 6. If a later step needs to total the rows, filter to one level first, for example `WHERE GROUPING(...) = 0` inside the query, or keep the level in a column and filter on it.
:::

## The same report in SQLite

SQLite has no GROUPING SETS, ROLLUP, CUBE or GROUPING(). Try `GROUP BY ROLLUP (plane)` and it reads ROLLUP as an ordinary function it has never heard of: `no such function: rollup`.

The results are still easy to build, because a grouping set is only a GROUP BY. Write one query per grouping set, put NULL in the columns that set rolls up, and stack them with **[[UNION ALL|union-all-bridge]]**, which glues the rows of several queries with matching columns into one result. (Lesson 11 teaches UNION ALL and its relatives properly.) Add a column that says which level each row came from; it does the job GROUPING() does.

```sql
SELECT s.plane, s.name, COUNT(*) AS n, AVG(r.value) AS mean_temp, 0 AS lvl
FROM reading AS r JOIN satellite AS s ON s.sat_id = r.sat_id
GROUP BY s.plane, s.name
UNION ALL
SELECT s.plane, NULL, COUNT(*), AVG(r.value), 1
FROM reading AS r JOIN satellite AS s ON s.sat_id = r.sat_id
GROUP BY s.plane
UNION ALL
SELECT NULL, NULL, COUNT(*), AVG(r.value), 2
FROM reading AS r JOIN satellite AS s ON s.sat_id = r.sat_id
ORDER BY lvl, plane, name;
```

```text
(1, 'Aurora', 3, 24.666666666666668, 0)
(1, 'Borealis', 2, 20.0, 0)
(2, 'Cirrus', 1, 11.0, 0)
(1, None, 5, 22.8, 1)
(2, None, 1, 11.0, 1)
(None, None, 6, 20.833333333333332, 2)
```

(That output is from Python's `sqlite3` module, which prints each row in brackets and NULL as `None`.) The numbers match the ROLLUP example row for row. The same query runs in PostgreSQL too. The column names come from the first SELECT, which is why only it needs the `AS` names. ROLLUP of $n$ columns needs $n + 1$ pieces this way, and CUBE needs $2^n$, so for anything larger than two columns the built-in forms are much easier to read — when your database has them.

## Check yourself

::: check
Write out, as GROUPING SETS, what `ROLLUP (plane, day, sat_id)` and `CUBE (plane, day)` each mean. How many grouping sets does `CUBE (plane, day, sat_id)` have?
:::

::: answer
`ROLLUP (plane, day, sat_id)` is `GROUPING SETS ((plane, day, sat_id), (plane, day), (plane), ())` — four sets, dropping from the right.

`CUBE (plane, day)` is `GROUPING SETS ((plane, day), (plane), (day), ())`.

`CUBE` over three columns has $2^3 = 8$ grouping sets: every choice of keeping or rolling up each of the three columns, from all three kept down to `()`.
:::

::: check
A colleague writes `GROUP BY ROLLUP (s.name, s.plane)` for the plane-subtotal report. What comes out, and what should she have written?
:::

::: answer
ROLLUP drops columns from the right, so the sets are `(name, plane)`, `(name)` and `()`. She gets each satellite's row twice — once with its plane and once with plane NULL, carrying the same numbers — plus a grand total, and no plane subtotals. She should list the outer category first: `ROLLUP (s.plane, s.name)`.
:::

::: check
In the ROLLUP example, the plane 1 subtotal of mean temperature is 22.8. A report instead shows 22.33 for plane 1. What did the report do, and which number is right for "mean temperature of plane 1's readings"?
:::

::: answer
22.33 is the average of the two satellites' means: $(24.67 + 20) / 2$. That treats Borealis's two readings as weighing the same as Aurora's three. The mean of all five readings is $114 / 5 = 22.8$, which is what ROLLUP computes, because it recomputes AVG from the raw rows of the bigger group. 22.8 is right for "the mean reading in plane 1". (22.33 would answer a different question: "the mean of the per-satellite means", which only matches when every satellite has the same number of readings.)
:::

::: check
In a CUBE over `(plane, day)`, a row has `plane = 2`, `day = NULL`, and `GROUPING(plane, day) = 0`. What is it? What would `GROUPING(plane, day) = 1` have meant for the same printed row?
:::

::: answer
`GROUPING(plane, day) = 0` means neither column was rolled up, so this is a detail cell: plane 2 on a "day" whose value really is NULL in the data (for example, a reading with no timestamp, or a satellite kept by an outer join with no readings). If it had been 1, the day bit would be set: the row would be plane 2's subtotal across all days. Same print-out, different meaning — which is exactly what GROUPING() exists to tell apart.
:::

::: check
Your exercise runs on SQLite and needs per-day reading counts plus a grand total. Write it without ROLLUP.
:::

::: answer
```sql
SELECT substr(ts, 1, 10) AS day, COUNT(*) AS n, 0 AS lvl
FROM reading
GROUP BY substr(ts, 1, 10)
UNION ALL
SELECT NULL, COUNT(*), 1
FROM reading
ORDER BY lvl, day;
```

With the module's data this gives `2026-03-01 | 4 | 0`, `2026-03-02 | 2 | 0` and `NULL | 6 | 1`. The `lvl` column plays the part of GROUPING(): 1 marks the total row. It is equivalent to `GROUP BY ROLLUP (substr(ts, 1, 10))` in PostgreSQL.
:::

## Summary

| Form | Means | Sets for $n$ columns |
| --- | --- | --- |
| `GROUPING SETS ((a, b), (a), ())` | run each grouping, stack the rows | as listed |
| `()` | one group of all rows: grand total | 1 |
| `ROLLUP (a, b)` | `((a, b), (a), ())`: a hierarchy of subtotals | $n + 1$ |
| `CUBE (a, b)` | `((a, b), (a), (b), ())`: every margin | $2^n$ |
| `GROUPING(col)` | 1 if `col` was rolled up, 0 if it is a real value | — |
| SQLite | one GROUP BY per set, NULL for rolled-up columns, `UNION ALL`, plus a level column | — |

Every query so far has been a single SELECT with its FROM, WHERE and GROUP BY. Next lesson puts one query inside another: a subquery can stand in for a single value, a row, or a whole table, and it can even be re-run for each row of the query around it.

::: context plane-word What an orbital plane is
Every orbit lies in a flat sheet through the centre of the Earth, like a hula hoop around a ball. That sheet is the orbit's **plane**. Satellites in the same plane follow each other around the same hoop, spaced out along it.

Big constellations are built plane by plane. Starlink's first shell, for example, was designed as 72 planes of 22 satellites each, at about 550 km altitude. Grouping by plane is natural because satellites in one plane share launch batches, lighting conditions and ground-track timing.
:::

::: context spreadsheet-drift Why two copies of a number drift apart
When a total is computed in the database and a subtotal is added up again by hand in a spreadsheet, there are now two sources for "the same" figure. Someone re-runs the query next week but forgets to refresh the sheet, or pastes a filtered copy, or averages averages. The numbers stop matching, and nobody can say which is right.

Computing every level in one query means each subtotal is derived from exactly the same rows as the detail lines beside it.
:::

::: context empty-set Why grouping by nothing means everything
A grouping set lists the columns whose values must match for two rows to share a group. With no columns listed, there is nothing that could differ, so every row matches every other and they all land in one group.

It is the same group you get from an aggregate query with no GROUP BY at all: `SELECT COUNT(*) FROM reading` returns one row for the whole table. Writing it as `()` lets it sit in a list beside the other grouping sets.
:::

::: context rolled-up Where "roll up" comes from
Accountants have long "rolled up" figures: the sales of each shop roll up into a regional total, and the regions roll up into the company's. ROLLUP and CUBE were proposed for SQL in a 1996 paper on the "data cube" by Jim Gray and colleagues, and entered the SQL standard in 1999, together with GROUPING SETS.

In a rolled-up row the column is not unknown in the usual NULL sense. It stands for "all of them". That is a different meaning squeezed into the same marker, which is why SQL needed the GROUPING() function to say which meaning each NULL has.
:::

::: context rollup-ladder ROLLUP climbs a ladder
Each rung drops the rightmost column still in the list, until nothing is left.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="16" width="170" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="30" y="62" width="170" height="28" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="30" y="108" width="170" height="28" fill="#b4232c" stroke="#1f2a44"/>
  <g font-size="12" text-anchor="middle">
    <text x="115" y="35" fill="#1f2a44">(plane, name)</text>
    <text x="115" y="81" fill="#1f2a44">(plane)</text>
    <text x="115" y="127" fill="#ffffff">()</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="115" y1="44" x2="115" y2="60"/><line x1="115" y1="90" x2="115" y2="106"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="215" y="35">one row per satellite</text>
    <text x="215" y="81">plane subtotals</text>
    <text x="215" y="127">fleet grand total</text>
  </g>
</svg>
```

Three columns would give a four-rung ladder; the rungs never skip, which is how ROLLUP differs from CUBE.
:::

::: context cube-margins The margins of a two-way table
Planes down the side, days across the top. The inner cells are the `(plane, day)` groups; the right-hand column is `(plane)`, the bottom row is `(day)`, and the corner is `()`. CUBE fills in all four kinds at once.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="140" y="22">1 Mar</text><text x="220" y="22">2 Mar</text><text x="300" y="22">all days</text>
    <text x="50" y="57">plane 1</text><text x="50" y="97">plane 2</text><text x="50" y="137">all planes</text>
  </g>
  <rect x="100" y="34" width="160" height="80" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="260" y="34" width="80" height="80" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="100" y="114" width="160" height="40" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="260" y="114" width="80" height="40" fill="#b4232c" stroke="#1f2a44"/>
  <line x1="180" y1="34" x2="180" y2="154" stroke="#1f2a44"/>
  <line x1="100" y1="74" x2="340" y2="74" stroke="#1f2a44"/>
  <g font-size="14" fill="#1f2a44" text-anchor="middle">
    <text x="140" y="59">4</text><text x="220" y="59">1</text><text x="300" y="59">5</text>
    <text x="140" y="99">–</text><text x="220" y="99">1</text><text x="300" y="99">1</text>
    <text x="140" y="139">4</text><text x="220" y="139">2</text>
  </g>
  <text x="300" y="139" font-size="14" fill="#ffffff" text-anchor="middle">6</text>
</svg>
```

Blue cells are the detail groups, orange the margins, red the corner. The dash is a pair with no readings, which CUBE leaves out.
:::

::: context cube-growth Two to the power of the column count
Each column in a CUBE doubles the number of grouping sets. Five columns give $2^5 = 32$ sets; ten give $2^{10} = 1024$. Each set is a full aggregation of the input, so a careless ten-column CUBE over a large telemetry table asks for a thousand reports at once, most of which nobody reads.

Data-warehouse tools that build "OLAP cubes" do precompute every combination, but they choose the dimensions carefully and store the results. In a query, keep CUBE to two or three columns, and use GROUPING SETS to list only the combinations you actually need.
:::

::: context grouping-bits One bit per column
`GROUPING(a, b)` writes a 1 or a 0 for each column, as the digits of a binary number, with `a` as the left digit. Binary 10 is two and binary 11 is three.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="22" font-weight="700">row kind</text>
    <text x="170" y="22" font-weight="700">a b</text>
    <text x="260" y="22" font-weight="700">value</text>
    <text x="20" y="50">detail (a, b)</text><text x="170" y="50">0 0</text><text x="270" y="50">0</text>
    <text x="20" y="78">b rolled up (a)</text><text x="170" y="78">0 1</text><text x="270" y="78">1</text>
    <text x="20" y="106">a rolled up (b)</text><text x="170" y="106">1 0</text><text x="270" y="106">2</text>
    <text x="20" y="134">grand total ()</text><text x="170" y="134">1 1</text><text x="270" y="134">3</text>
  </g>
  <line x1="20" y1="30" x2="340" y2="30" stroke="#6c7a93"/>
</svg>
```

Sorting by this number puts detail rows first and the grand total last, which is usually the order a report wants.
:::

::: context union-all-bridge Why UNION ALL and not UNION
There are two ways to stack query results. `UNION` removes any rows that come out identical, which needs a sort or a hash of the whole result. `UNION ALL` keeps every row and costs almost nothing.

Here the pieces can never produce the same row, because each carries a different `lvl`, so there is nothing to remove and the plain ALL is right. Lesson 11 covers both, plus INTERSECT and EXCEPT.
:::
