---
id: l01-joining-tables
title: "Joining tables: inner, outer, cross and self"
minutes: 22
covers:
  - INNER, LEFT, RIGHT and FULL OUTER joins; CROSS join; self-joins
---

In the last module every question you asked lived inside one table. Real questions almost never do. "What was Aurora's bus temperature this morning?" sounds like one question, but the answer is spread across two tables: the readings know only a satellite's id, and only the fleet table knows that SAT-001 is called Aurora.

That split is on purpose: a relational database stores each fact once and lets tables point at each other by key (lesson 01 of the last module). The price is that you must put the pieces back together when you ask. The tool that does it is the **join** — an instruction to combine rows from two tables into one result, pairing up rows that belong together.

Every telemetry team leans on joins all day: a dashboard of readings by satellite name, a report of satellites with no ground contact planned, a check that every command was acknowledged. This lesson teaches all six kinds: inner, left, right, full outer, cross, and a table joined to itself.

## The two tables

This whole module uses the same two tables as its exercises. (In the last module the readings lived in a table called `telemetry`; here it is called `reading`, and the satellites carry a `launched` date instead of a mass.) The fleet table, `satellite`, has one row per spacecraft:

```text
 sat_id  |   name   | plane |  launched
---------+----------+-------+------------
 SAT-001 | Aurora   |     1 | 2025-06-01
 SAT-002 | Borealis |     1 | 2025-06-01
 SAT-003 | Cirrus   |     2 | 2025-09-14
 SAT-004 | Dorado   |     2 | 2026-01-20
```

The telemetry table, `reading`, has one row per measurement. Here every row is from the `BUS_TEMP` channel, the temperature of the satellite's main electronics in degrees Celsius:

```text
 sat_id  |          ts          | channel  | value
---------+----------------------+----------+-------
 SAT-001 | 2026-03-01T00:00:00Z | BUS_TEMP |    20
 SAT-001 | 2026-03-01T06:00:00Z | BUS_TEMP |    24
 SAT-001 | 2026-03-02T01:00:00Z | BUS_TEMP |    30
 SAT-002 | 2026-03-01T00:00:00Z | BUS_TEMP |    18
 SAT-002 | 2026-03-01T12:00:00Z | BUS_TEMP |    22
 SAT-003 | 2026-03-02T00:00:00Z | BUS_TEMP |    11
```

Here is the full definition, exactly as the exercises create it:

```sql
CREATE TABLE satellite (
    sat_id     TEXT PRIMARY KEY,
    name       TEXT NOT NULL,
    plane      INTEGER NOT NULL,
    launched   TEXT NOT NULL
);
CREATE TABLE reading (
    sat_id  TEXT NOT NULL REFERENCES satellite(sat_id),
    ts      TEXT NOT NULL,
    channel TEXT NOT NULL,
    value   REAL NOT NULL
);
```

Two details matter. `reading.sat_id` is a **foreign key** pointing at `satellite.sat_id`, so every reading belongs to a real satellite. The timestamps are stored as [[ISO-8601 text|iso-sort]], like `2026-03-01T06:00:00Z`, because the exercises run on SQLite, which has no timestamp type (lesson 07 of the last module). Text in this fixed format sorts in time order, so comparisons like `ts >= '2026-03-02T00:00:00Z'` work.

Aurora has three readings, Borealis two, Cirrus one — and **Dorado has none**. Dorado is the star of this lesson, because the joins disagree about what to do with it.

## INNER JOIN: keep the pairs that match

Picture a school dance where every student wears a number, and the rule is "pair up with someone whose number matches yours". Students with a match dance. Students with no match sit out. An **inner join** is that rule for rows.

```sql
SELECT s.name, r.ts, r.value
FROM reading AS r
JOIN satellite AS s ON s.sat_id = r.sat_id
ORDER BY s.name, r.ts;
```

```text
   name   |          ts          | value
----------+----------------------+-------
 Aurora   | 2026-03-01T00:00:00Z |    20
 Aurora   | 2026-03-01T06:00:00Z |    24
 Aurora   | 2026-03-02T01:00:00Z |    30
 Borealis | 2026-03-01T00:00:00Z |    18
 Borealis | 2026-03-01T12:00:00Z |    22
 Cirrus   | 2026-03-02T00:00:00Z |    11
(6 rows)
```

Read the FROM part aloud as: "from `reading`, called `r`, joined to `satellite`, called `s`, on the condition that `s`'s sat-id equals `r`'s sat-id".

Each piece has a job:

- `AS r` and `AS s` give each table a short **alias** — a nickname used for the rest of the query.
- `JOIN` with no other word means `INNER JOIN`. The two are the same thing; many teams write `INNER JOIN` in full so a reader never has to wonder.
- `ON s.sat_id = r.sat_id` is the **join condition** — the test a pair of rows must pass to be kept. Here it says "these two rows are about the same satellite".
- `s.name` and `r.value` are **qualified** column names: table alias, dot, column. Read `r.value` as "r dot value".

Here is the clean way to think about it. Imagine the database lines up **every** reading next to **every** satellite — $6 \times 4 = 24$ possible pairs — and keeps only the pairs where the ON condition is true. Six pass, one per reading. (It does not really build all 24; the planner finds matches much faster. But the result is always what [[this picture predicts|join-algorithms]].)

Dorado matched no reading, so Dorado is not in the result. For "label the readings with names", that is right. For "list every satellite and its latest reading", it would silently lose a satellite.

::: key INNER JOIN
`A JOIN B ON condition` (the same as `A INNER JOIN B ON condition`) returns one row for every pair of an A row and a B row for which the condition is TRUE. Rows with no partner on the other side do not appear at all.
:::

### Qualify your column names

Both tables have a column called `sat_id`. If you name it without saying which table, the database refuses to guess:

```sql
SELECT sat_id, name
FROM reading JOIN satellite ON satellite.sat_id = reading.sat_id;
```

```text
ERROR:  column reference "sat_id" is ambiguous
```

SQLite says `ambiguous column name: sat_id`. Write `r.sat_id` or `s.sat_id`. A good habit is to qualify *every* column in a query with a join: a reader sees where each value comes from, and the query keeps working if someone later adds a column with a clashing name.

::: example Readings from plane 2
**Question.** List every bus-temperature reading from satellites in orbital plane 2, with the satellite's name.

**Think first.** Plane 2 holds Cirrus and Dorado. Cirrus has one reading; Dorado has none. So the answer should be one row.

```sql
SELECT s.name, r.ts, r.value
FROM reading AS r
JOIN satellite AS s ON s.sat_id = r.sat_id
WHERE s.plane = 2
ORDER BY r.ts;
```

```text
  name  |          ts          | value
--------+----------------------+-------
 Cirrus | 2026-03-02T00:00:00Z |    11
(1 row)
```

**Why it works.** The join is part of FROM, which runs first, so the six joined rows — each carrying a reading's columns and its satellite's columns — exist before WHERE runs. WHERE keeps the one whose `s.plane` is 2. The plane lives only in `satellite` and the value only in `reading`; the join put them on the same row.

**Check.** One row, as predicted, and it is Cirrus's only reading.
:::

## LEFT JOIN: keep everything on the left

Now suppose the question is "for every satellite, show its readings — and show me the satellites that have none". The inner join cannot answer that; it throws Dorado away.

Back at the dance: this time the rule is "everyone from the left side of the room stays on the floor, partner or not". A student with no partner dances with an empty space. A **left outer join**, written `LEFT JOIN` (or `LEFT OUTER JOIN` — same thing), keeps every row of the table on its left, and fills the missing partner's columns with NULL.

```sql
SELECT s.name, r.ts, r.value
FROM satellite AS s
LEFT JOIN reading AS r ON r.sat_id = s.sat_id
ORDER BY s.name, r.ts;
```

```text
   name   |          ts          | value
----------+----------------------+-------
 Aurora   | 2026-03-01T00:00:00Z |    20
 Aurora   | 2026-03-01T06:00:00Z |    24
 Aurora   | 2026-03-02T01:00:00Z |    30
 Borealis | 2026-03-01T00:00:00Z |    18
 Borealis | 2026-03-01T12:00:00Z |    22
 Cirrus   | 2026-03-02T00:00:00Z |    11
 Dorado   |                      |
(7 rows)
```

Seven rows: the six matches, plus Dorado with NULL in `ts` and `value` (psql prints NULL as blank). "Left" means "the table named before the word JOIN", so `satellite` now comes first. For an inner join the order of the tables did not matter; for a left join it is the whole point.

Those NULLs are not in any table. The join made them up to mean "no partner here", and everything from lesson 05 of the last module applies: `r.value > 0` is UNKNOWN on Dorado's row.

::: key LEFT JOIN
`A LEFT JOIN B ON condition` returns every row the inner join returns, plus each A row that matched nothing, once, with every B column set to NULL. No A row is ever lost.
:::

### ON or WHERE: where a condition sits changes the answer

For an inner join, a condition in ON and the same condition in WHERE give the same result. For an outer join they do not, and the difference is one of the most common bugs in SQL.

Suppose you want every satellite, with any reading it sent on or after 2 March. First attempt, with the time condition in WHERE:

```sql
SELECT s.name, r.ts, r.value
FROM satellite AS s
LEFT JOIN reading AS r ON r.sat_id = s.sat_id
WHERE r.ts >= '2026-03-02T00:00:00Z'
ORDER BY s.name;
```

```text
  name  |          ts          | value
--------+----------------------+-------
 Aurora | 2026-03-02T01:00:00Z |    30
 Cirrus | 2026-03-02T00:00:00Z |    11
(2 rows)
```

Borealis and Dorado are gone. Here is why, station by station. FROM builds the seven-row left join above. Then WHERE tests every row. On Dorado's row `r.ts` is NULL, and `NULL >= '2026-03-02…'` is UNKNOWN, so the row is dropped. Borealis's two rows have March 1 timestamps, so they fail too. The left join kept Dorado, and then WHERE threw it away.

Second attempt, with the time condition inside ON:

```sql
SELECT s.name, r.ts, r.value
FROM satellite AS s
LEFT JOIN reading AS r
       ON r.sat_id = s.sat_id
      AND r.ts >= '2026-03-02T00:00:00Z'
ORDER BY s.name;
```

```text
   name   |          ts          | value
----------+----------------------+-------
 Aurora   | 2026-03-02T01:00:00Z |    30
 Borealis |                      |
 Cirrus   | 2026-03-02T00:00:00Z |    11
 Dorado   |                      |
(4 rows)
```

Now the condition is part of the matching rule: "a reading is a partner only if it is this satellite's *and* it is recent". Borealis has no recent reading, so it has no partner, and a left join keeps partnerless left rows.

So the rule is: in an outer join, **ON decides what counts as a match; WHERE decides which finished rows survive.** Put conditions on the right-hand table in ON if you want to keep the unmatched left rows.

::: warning LEFT JOIN then WHERE on the right table
The most common way this goes wrong looks like this:

```sql
SELECT s.name, r.ts, r.value
FROM satellite AS s
LEFT JOIN reading AS r ON r.sat_id = s.sat_id
WHERE r.sat_id IS NOT NULL;
```

It returns exactly the six rows of the inner join. The rows the LEFT JOIN added are precisely the ones with NULL on the right, and the WHERE removes precisely those. The same thing happens with any WHERE condition on a right-table column that NULL cannot pass, like the `r.ts >= …` test above.
:::

::: key LEFT JOIN then WHERE right.col IS NOT NULL
An inner join, expressed confusingly. The WHERE clause discards exactly the rows the outer join added. Either write INNER JOIN, or move the condition into the ON clause if you meant to keep the unmatched rows.
:::

Those NULL-filled rows are useful in their own right. Keeping only them — `WHERE r.sat_id IS NULL` — finds the satellites with no partner at all. That is called an **anti-join**, and lesson 08 treats it properly, alongside `NOT EXISTS`, which is usually the clearer way to write it.

## RIGHT JOIN: the mirror image

A **right outer join** keeps every row of the table on the *right* of the word JOIN. To see one, meet a third table: the operations team keeps a `contact_plan`: which [[ground station|svalbard]] will talk to which satellite tomorrow. It was imported from a planning spreadsheet, so it has no foreign key, and nobody checks its ids.

```text
 sat_id  | station
---------+----------
 SAT-001 | Svalbard
 SAT-002 | Svalbard
 SAT-002 | Hawaii
 SAT-003 | Hawaii
 SAT-009 | Svalbard
```

Borealis gets two passes. And SAT-009 is not in the fleet at all — a typo, or a satellite retired after the plan was written.

```sql
SELECT c.station, c.sat_id, s.name
FROM satellite AS s
RIGHT JOIN contact_plan AS c ON c.sat_id = s.sat_id
ORDER BY c.station, c.sat_id;
```

```text
 station  | sat_id  |   name
----------+---------+----------
 Hawaii   | SAT-002 | Borealis
 Hawaii   | SAT-003 | Cirrus
 Svalbard | SAT-001 | Aurora
 Svalbard | SAT-002 | Borealis
 Svalbard | SAT-009 |
(5 rows)
```

Every planned contact is kept, and SAT-009's missing name comes out NULL. Any right join can be turned into a left join by swapping the two tables, and most teams do that, so every outer join reads the same way: "keep everything from the first table".

## FULL OUTER JOIN: keep everything from both sides

A **[[full outer join|join-venn]]** keeps every row from both tables. Pairs that match are joined; leftovers from either side appear once, with NULLs for the other side. It is the tool for **reconciliation** — lining up two lists that should agree and seeing where they do not.

```sql
SELECT s.sat_id AS fleet_id, s.name, c.sat_id AS plan_id, c.station
FROM satellite AS s
FULL OUTER JOIN contact_plan AS c ON c.sat_id = s.sat_id
ORDER BY COALESCE(s.sat_id, c.sat_id), c.station;
```

```text
 fleet_id |   name   | plan_id | station
----------+----------+---------+----------
 SAT-001  | Aurora   | SAT-001 | Svalbard
 SAT-002  | Borealis | SAT-002 | Hawaii
 SAT-002  | Borealis | SAT-002 | Svalbard
 SAT-003  | Cirrus   | SAT-003 | Hawaii
 SAT-004  | Dorado   |         |
          |          | SAT-009 | Svalbard
(6 rows)
```

The last two rows are the two kinds of disagreement. Dorado is in the fleet with no contact planned. SAT-009 has a contact planned but is not in the fleet, so a station will listen to empty sky. Both deserve an alert. `COALESCE(s.sat_id, c.sat_id)` in the ORDER BY picks whichever id is present, so the orphan sorts in with the others instead of landing wherever NULLs go.

::: key The four matching joins
**INNER** keeps only matched pairs. **LEFT** adds unmatched rows from the left table. **RIGHT** adds unmatched rows from the right table. **FULL OUTER** adds unmatched rows from both. The word OUTER is optional in LEFT, RIGHT and FULL. In the added rows, the missing side's columns are NULL.
:::

::: warning Older SQLite has no RIGHT or FULL
SQLite added `RIGHT JOIN` and `FULL OUTER JOIN` in version 3.39 (2022). The copy that runs this app's exercises is newer, so both work there. On an older SQLite you will get a syntax error: swap the tables to turn a right join into a left join, and build a full join from a left join plus the unmatched right rows (lesson 11 shows how to glue two results together).
:::

## CROSS JOIN: every row with every row

A **cross join** pairs every row of one table with every row of the other, with no condition at all. Think of a restaurant that offers four main dishes and two sides: the menu of possible meals has $4 \times 2 = 8$ lines. This result is also called the **[[Cartesian product|cartesian]]** of the two tables.

By accident it is a disaster. On purpose it is how you build a **grid of everything that should exist**. A small table `channel` lists the channels every satellite must report:

```sql
SELECT s.name, ch.channel, ch.units
FROM satellite AS s
CROSS JOIN channel AS ch
ORDER BY s.name, ch.channel;
```

```text
   name   | channel  |  units
----------+----------+----------
 Aurora   | BATT_SOC | fraction
 Aurora   | BUS_TEMP | degC
 Borealis | BATT_SOC | fraction
 Borealis | BUS_TEMP | degC
 Cirrus   | BATT_SOC | fraction
 Cirrus   | BUS_TEMP | degC
 Dorado   | BATT_SOC | fraction
 Dorado   | BUS_TEMP | degC
(8 rows)
```

Four satellites times two channels gives eight rows, one per pair that ought to have data. Left-join the readings onto that grid and every missing pair shows up as a row of NULLs — the grid supplies rows the data cannot, because a missing reading is not a row anywhere. Lesson 10 builds the same kind of grid for time, one row per hour.

::: key CROSS JOIN
`A CROSS JOIN B` returns every pairing of an A row with a B row: $|A| \times |B|$ rows, where $|A|$ (read "the size of A") is the number of rows in A. It is the inner join with a condition that is always true.
:::

::: warning The accidental cross join
Older SQL lists tables with commas and puts the join condition in WHERE: `FROM satellite s, reading r WHERE r.sat_id = s.sat_id`. Forget the condition and you get a cross join: 6,000 satellites and a million readings make six billion rows, and the query runs until something runs out. `JOIN … ON` keeps the condition next to its table, where a missing one is easy to spot.
:::

## Self-joins: a table meets itself

Nothing stops a table from being joined to itself. You name it twice with two different aliases, and from then on the query treats them as two separate copies. This is a **[[self-join|self-join-picture]]**, and it is how you compare rows of one table with other rows of the same table.

::: example Which satellites share a plane
**Question.** List each pair of satellites that fly in the same orbital plane. Planes matter because satellites in one plane can cover for each other.

Call one copy of the table `a` and the other `b`, and match on the plane:

```sql
SELECT a.name AS sat_a, b.name AS sat_b, a.plane
FROM satellite AS a
JOIN satellite AS b ON b.plane = a.plane
ORDER BY a.plane, a.name, b.name;
```

```text
  sat_a   |  sat_b   | plane
----------+----------+-------
 Aurora   | Aurora   |     1
 Aurora   | Borealis |     1
 Borealis | Aurora   |     1
 Borealis | Borealis |     1
 Cirrus   | Cirrus   |     2
 Cirrus   | Dorado   |     2
 Dorado   | Cirrus   |     2
 Dorado   | Dorado   |     2
(8 rows)
```

Eight rows, six of them junk. Each plane's 2 satellites make $2 \times 2 = 4$ pairs: two self-pairs, and the one real pair written both ways round.

**The fix** is to demand that the first id be smaller than the second:

```sql
SELECT a.name AS sat_a, b.name AS sat_b, a.plane
FROM satellite AS a
JOIN satellite AS b ON b.plane = a.plane AND a.sat_id < b.sat_id
ORDER BY a.plane;
```

```text
 sat_a  |  sat_b   | plane
--------+----------+-------
 Aurora | Borealis |     1
 Cirrus | Dorado   |     2
(2 rows)
```

`a.sat_id < b.sat_id` is false when the two are the same satellite (an id is not less than itself), and it is true for exactly one of the two orders of a real pair. Text comparison works here because the ids all have the same format.

**Check.** A plane with $n$ satellites has $n(n-1)/2$ different pairs. For $n = 2$ that is $2 \times 1 / 2 = 1$ per plane, 2 in all. It matches.
:::

### Pairing a command with its acknowledgement

The classic telemetry self-join lives in an event log. When the ground sends a command, the log records a `CMD` row. When the satellite [[confirms it|command-ack]], the log records an `ACK` row whose `ref_id` points back at the command's `event_id`:

```text
 event_id | sat_id  |          ts          | kind | ref_id
----------+---------+----------------------+------+--------
        1 | SAT-001 | 2026-03-01T00:10:00Z | CMD  |
        2 | SAT-001 | 2026-03-01T00:10:04Z | ACK  |      1
        3 | SAT-002 | 2026-03-01T00:12:00Z | CMD  |
        4 | SAT-003 | 2026-03-01T00:15:00Z | CMD  |
        5 | SAT-003 | 2026-03-01T00:15:07Z | ACK  |      4
```

Commands and acknowledgements are in the same table, so pairing them is a self-join. Make it a left join, so a command with no acknowledgement still shows up:

```sql
SELECT c.event_id AS cmd, c.sat_id, c.ts AS sent, a.ts AS acked
FROM event_log AS c
LEFT JOIN event_log AS a ON a.ref_id = c.event_id AND a.kind = 'ACK'
WHERE c.kind = 'CMD'
ORDER BY c.event_id;
```

```text
 cmd | sat_id  |         sent         |        acked
-----+---------+----------------------+----------------------
   1 | SAT-001 | 2026-03-01T00:10:00Z | 2026-03-01T00:10:04Z
   3 | SAT-002 | 2026-03-01T00:12:00Z |
   4 | SAT-003 | 2026-03-01T00:15:00Z | 2026-03-01T00:15:07Z
(3 rows)
```

Command 3 to Borealis was never acknowledged. Notice where each condition sits. `c.kind = 'CMD'` is about the left copy, so it goes in WHERE. `a.kind = 'ACK'` is about the partner, so it goes in ON, where it cannot throw away the unanswered command.

The acknowledgement delay is a subtraction: `EXTRACT(EPOCH FROM a.ts::timestamptz - c.ts::timestamptz)` in PostgreSQL, or `unixepoch(a.ts) - unixepoch(c.ts)` in SQLite, gives 4 seconds for command 1 and 7 for command 4.

The other old use of a self-join is comparing each reading with the one before it. It works, but it is clumsy and slow. The next module teaches **[[window functions|window-bridge]]**, which do "compare with the previous row" directly.

::: key Self-join: one telemetry use
Pairing each command with its acknowledgement from the same table, or comparing a reading with the previous one before window functions were available. A window function is usually the better modern answer.
:::

## Joins in the logical order

Joins live inside FROM, the first station of the logical order. Every later station sees one wide table whose rows carry columns from both sides. That is why WHERE can test `s.plane` while SELECT shows `r.value`, and why WHERE can undo the extra rows an outer join made.

You can chain joins: `FROM a JOIN b ON … JOIN c ON …` joins `a` to `b`, then joins that result to `c`. Lesson 04 chains three tables, and shows what can go wrong when you do.

## Check yourself

::: check
Using the two tables from this lesson, how many rows does `satellite CROSS JOIN reading` return? And how many of those rows would pass the condition `s.sat_id = r.sat_id`?
:::

::: answer
A cross join returns $4 \times 6 = 24$ rows. The condition keeps a pair only when the reading belongs to that satellite, and each reading belongs to exactly one, so 6 rows survive — the inner join's result. An inner join is a cross join followed by a filter.
:::

::: check
A teammate writes the query below to list every satellite with its bus temperature readings, including silent satellites. Dorado does not appear. Explain why, and fix it.

```sql
SELECT s.name, r.value
FROM satellite AS s
LEFT JOIN reading AS r ON r.sat_id = s.sat_id
WHERE r.channel = 'BUS_TEMP';
```
:::

::: answer
The left join produces Dorado's row with `r.channel` NULL. WHERE then tests `NULL = 'BUS_TEMP'`, which is UNKNOWN, so the row is dropped. The WHERE condition on a right-table column has turned the left join back into an inner join.

Move the channel test into ON, so it becomes part of what counts as a match:

```sql
SELECT s.name, r.value
FROM satellite AS s
LEFT JOIN reading AS r
       ON r.sat_id = s.sat_id
      AND r.channel = 'BUS_TEMP';
```

Now Dorado has no matching bus-temperature reading, so it is kept with `r.value` NULL.
:::

::: check
Rewrite the RIGHT JOIN of `satellite` and `contact_plan` from this lesson as a LEFT JOIN that gives the same rows. Which table is on the left now?
:::

::: answer
Swap the tables so the one whose rows must all be kept comes first:

```sql
SELECT c.station, c.sat_id, s.name
FROM contact_plan AS c
LEFT JOIN satellite AS s ON s.sat_id = c.sat_id
ORDER BY c.station, c.sat_id;
```

`contact_plan` is on the left, so every planned contact is kept and the same five rows come back. The ON condition does not care which side of the `=` each column is on.
:::

::: check
A plane holds 5 satellites. How many rows does the self-join `ON b.plane = a.plane` give for that plane, and how many with `ON b.plane = a.plane AND a.sat_id < b.sat_id`?
:::

::: answer
Without the extra test, every satellite in the plane pairs with every one, itself included: $5 \times 5 = 25$ rows.

With `a.sat_id < b.sat_id`, the 5 self-pairs are removed (leaving 20), and of the 20 remaining, each real pair appears twice, in both orders, so half go: $20 / 2 = 10$. That matches the formula $n(n-1)/2 = 5 \times 4 / 2 = 10$.
:::

::: check
The ground team wants a list of every command in `event_log` that has *no* acknowledgement. Starting from the self-join in this lesson, what one line would you add?
:::

::: answer
The left self-join already gives unanswered commands a NULL `a.ts` (and a NULL `a.event_id`). Keep only those rows by adding a condition to the WHERE:

```sql
WHERE c.kind = 'CMD' AND a.event_id IS NULL
```

That returns command 3 to SAT-002 alone. Keeping only the NULL-filled rows of a left join is the anti-join mentioned in this lesson; lesson 08 shows the `NOT EXISTS` form, which says the same thing more directly.
:::

## Summary

| Join | Rows it returns |
| --- | --- |
| `A JOIN B ON c` (INNER) | every pair where `c` is TRUE; unmatched rows vanish |
| `A LEFT JOIN B ON c` | the inner pairs, plus each unmatched A row with B's columns NULL |
| `A RIGHT JOIN B ON c` | the inner pairs, plus each unmatched B row with A's columns NULL |
| `A FULL OUTER JOIN B ON c` | the inner pairs, plus unmatched rows from both sides |
| `A CROSS JOIN B` | every pairing: $\lvert A\rvert \times \lvert B\rvert$ rows |
| self-join | a table joined to itself under two aliases |
| ON vs WHERE (outer join) | ON decides what counts as a match; WHERE filters the finished rows |
| LEFT JOIN + `WHERE right.col IS NOT NULL` | an inner join in disguise |

Every join in this lesson matched on a condition you wrote out with ON. Next lesson looks at the other ways to say what to match on — `USING`, and the dangerous `NATURAL JOIN` — and at the question that decides whether a joined result can be trusted: how many rows will come out.

::: context iso-sort Why this text sorts like time
In `2026-03-01T06:00:00Z` the parts run from biggest to smallest: year, month, day, hour, minute, second. Every part has a fixed number of digits, padded with zeros (`03`, not `3`). So when the database compares two such strings letter by letter, the first place they differ is the biggest unit of time that differs, and alphabetical order comes out the same as time order.

That only holds while every row uses the same layout and the same zone. Mix in `2026-3-1 6:00` or a `+02:00` offset and the comparison quietly goes wrong, which is why lesson 07 of the last module insisted on one format.
:::

::: context join-algorithms How the database really finds the pairs
PostgreSQL has three main ways to carry out a join, and the planner picks one per join. A **nested loop** takes each row of one table and looks up its partners in the other, fast when there is an index on the join column. A **hash join** reads the smaller table into a lookup table in memory, keyed by the join column, then streams the bigger table past it. A **merge join** sorts both tables by the join column and walks down them side by side like zipping a zipper.

All three return exactly the pairs the "every row against every row, keep the true ones" picture predicts. Putting `EXPLAIN` in front of a query shows which one was chosen.
:::

::: context svalbard Ground stations near the pole
A satellite in low Earth orbit is in radio range of a given ground station for only about ten minutes at a time, so operators book passes in advance. Stations near the poles are prized. Many Earth-watching satellites fly in orbits that cross close to both poles, so a station at high latitude sees them on nearly every one of their roughly 15 orbits a day. The SvalSat station on Svalbard, an island group at about 78° north, is one of the busiest in the world for exactly this reason.
:::

::: context join-venn The four matching joins as pictures
Think of each circle as the rows of one table, and the overlap as the rows that found a partner. The shaded part is what the join keeps. In the outer joins, the shaded part outside the overlap is where the NULL-filled rows come from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <path d="M45,41.56 A22,22 0 0 1 45,78.44 A22,22 0 0 1 45,41.56 Z" fill="#1d6fd1"/>
    <circle cx="33" cy="60" r="22" fill="none"/><circle cx="57" cy="60" r="22" fill="none"/>
    <circle cx="123" cy="60" r="22" fill="#1d6fd1"/><circle cx="147" cy="60" r="22" fill="none"/>
    <circle cx="237" cy="60" r="22" fill="#1d6fd1"/><circle cx="213" cy="60" r="22" fill="none"/>
    <circle cx="303" cy="60" r="22" fill="#1d6fd1"/><circle cx="327" cy="60" r="22" fill="#1d6fd1"/>
    <circle cx="303" cy="60" r="22" fill="none"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="45" y="104">INNER</text>
    <text x="135" y="104">LEFT</text>
    <text x="225" y="104">RIGHT</text>
    <text x="315" y="104">FULL</text>
    <text x="30" y="30">A</text><text x="60" y="30">B</text>
    <text x="120" y="30">A</text><text x="150" y="30">B</text>
    <text x="210" y="30">A</text><text x="240" y="30">B</text>
    <text x="300" y="30">A</text><text x="330" y="30">B</text>
  </g>
</svg>
```

The picture is a memory aid, not the whole truth: a join pairs rows, so one left row with three partners becomes three rows, which no circle can show.
:::

::: context cartesian Where "Cartesian" comes from
The name honours René Descartes, the French philosopher and mathematician of the 1600s who tied geometry to numbers with a grid of $x$ and $y$ axes. Every point on that grid is a pairing of one $x$ value with one $y$ value — all possible pairings of two sets. Mathematicians call that set of pairs the Cartesian product and write it $A \times B$. The multiplication sign is honest: if $A$ has 4 members and $B$ has 2, the product has $4 \times 2 = 8$ pairs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="180" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">satellite × channel = 4 × 2 = 8 pairs</text>
  <g font-size="11" fill="#1f2a44">
    <text x="12" y="62">Aurora</text>
    <text x="12" y="92">Borealis</text>
    <text x="12" y="122">Cirrus</text>
    <text x="12" y="152">Dorado</text>
    <text x="140" y="36" text-anchor="middle">BATT_SOC</text>
    <text x="260" y="36" text-anchor="middle">BUS_TEMP</text>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="90" y="46" width="100" height="24"/><rect x="210" y="46" width="100" height="24"/>
    <rect x="90" y="76" width="100" height="24"/><rect x="210" y="76" width="100" height="24"/>
    <rect x="90" y="106" width="100" height="24"/><rect x="210" y="106" width="100" height="24"/>
    <rect x="90" y="136" width="100" height="24"/><rect x="210" y="136" width="100" height="24"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="140" y="62">1</text><text x="260" y="62">2</text>
    <text x="140" y="92">3</text><text x="260" y="92">4</text>
    <text x="140" y="122">5</text><text x="260" y="122">6</text>
    <text x="140" y="152">7</text><text x="260" y="152">8</text>
  </g>
</svg>
```
:::

::: context self-join-picture Two names, one table
A self-join does not copy any data. It reads the same table twice, and the two aliases let the query talk about "a row" and "another row" of it separately. Here each arrow is a pair that passes `b.plane = a.plane AND a.sat_id < b.sat_id`.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="72" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">satellite AS a</text>
  <text x="288" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">satellite AS b</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="6" y="30" width="132" height="28" fill="#8fb8f0"/>
    <rect x="6" y="62" width="132" height="28" fill="#8fb8f0"/>
    <rect x="6" y="94" width="132" height="28" fill="#f2b880"/>
    <rect x="6" y="126" width="132" height="28" fill="#f2b880"/>
    <rect x="222" y="30" width="132" height="28" fill="#8fb8f0"/>
    <rect x="222" y="62" width="132" height="28" fill="#8fb8f0"/>
    <rect x="222" y="94" width="132" height="28" fill="#f2b880"/>
    <rect x="222" y="126" width="132" height="28" fill="#f2b880"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="12" y="48">SAT-001 Aurora p1</text>
    <text x="12" y="80">SAT-002 Borealis p1</text>
    <text x="12" y="112">SAT-003 Cirrus p2</text>
    <text x="12" y="144">SAT-004 Dorado p2</text>
    <text x="228" y="48">SAT-001 Aurora p1</text>
    <text x="228" y="80">SAT-002 Borealis p1</text>
    <text x="228" y="112">SAT-003 Cirrus p2</text>
    <text x="228" y="144">SAT-004 Dorado p2</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="2" fill="none">
    <line x1="138" y1="44" x2="214" y2="74"/>
    <line x1="138" y1="108" x2="214" y2="138"/>
  </g>
  <polygon points="222,76 212,69 210,79" fill="#1d6fd1"/>
  <polygon points="222,140 212,133 210,143" fill="#1d6fd1"/>
</svg>
```
:::

::: context command-ack How a spacecraft says "got it"
A command sent to a satellite can be lost to radio noise, arrive garbled, or arrive fine and then be refused because it is unsafe right now. So spacecraft report back. Most keep counters of commands accepted and rejected in their housekeeping telemetry, and many echo the id of the last command they ran. Missions that follow the CCSDS standards (the shared rulebook many space agencies use) also run a telecommand protocol in which the spacecraft reports which command frames arrived, so the ground can resend the rest. On the ground, all of this becomes rows in a log, and a self-join is how a report lines them up.
:::

::: context window-bridge Where window functions come in
A window function computes something for each row by looking at nearby rows of the same table — the previous reading, a running total, the average of the last ten minutes — without collapsing them into groups and without joining the table to itself. `LAG(value)` returns the previous row's value for the same satellite, which replaces the whole "previous reading" self-join with one expression. The next module, on window functions, is built around them.
:::
