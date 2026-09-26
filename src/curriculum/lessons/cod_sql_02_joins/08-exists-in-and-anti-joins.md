---
id: l08-exists-in-and-anti-joins
title: EXISTS, IN and the anti-join
minutes: 24
covers:
  - EXISTS versus IN versus JOIN, and their NULL semantics
---

Two questions come up in fleet operations every single day. "Which satellites have reported?" And, far more urgently, "Which satellites have *not* reported since midnight?" The second one is how a ground team notices a spacecraft that has **[[gone quiet|gone-quiet]]** — a failed radio, a flat battery, a computer stuck in a reboot loop. The answer is a list of satellites for which *no* matching reading exists.

Neither question wants any columns from the reading table. They only ask whether a match is there. SQL gives you three ways to ask: EXISTS, IN, and a join. They look interchangeable, and on clean data they often give the same rows. They differ in three ways that matter: duplicate rows, NULLs, and speed. This lesson takes them apart, then settles on the tool for the second question — the **anti-join** — and shows why NOT IN is the wrong way to write it.

The running example is the module's two tables: `satellite` (Aurora, Borealis, Cirrus, Dorado) and `reading` (six bus temperatures on 1 and 2 March 2026). The "window" for the silence check is everything at or after `2026-03-02T00:00:00Z`, as in the module's second exercise.

## The semi-join: is there at least one match?

Picture a class register and a pile of homework. "Which students handed something in?" You go down the register and, for each name, check whether at least one sheet in the pile has that name. You write each student down once, however many sheets they handed in, and you never copy anything from the sheets themselves.

That is a **[[semi-join|semi-anti-picture]]**: keep each row of the left table that has *at least one* match in the right table, keep it *once*, and keep only the left table's columns. ("Semi" means "half": only one side's columns come through.)

There are three ways to write "satellites that have at least one reading".

```sql
-- 1. EXISTS
SELECT s.sat_id, s.name
FROM satellite AS s
WHERE EXISTS (SELECT 1 FROM reading AS r WHERE r.sat_id = s.sat_id);

-- 2. IN
SELECT s.sat_id, s.name
FROM satellite AS s
WHERE s.sat_id IN (SELECT r.sat_id FROM reading AS r);

-- 3. JOIN
SELECT s.sat_id, s.name
FROM satellite AS s
JOIN reading AS r ON r.sat_id = s.sat_id;
```

**EXISTS** takes a subquery and asks one thing: does it return at least one row? If yes, EXISTS is TRUE; if no, FALSE. What the subquery selects does not matter at all, which is why people write `SELECT 1` — a **[[placeholder|select-one]]** that says "I only care whether a row is there". The subquery is correlated, like the ones in the previous lesson: `r.sat_id = s.sat_id` ties it to the satellite being checked. A database can stop searching at the first match it finds.

**IN** compares the value on its left with every value the subquery returns, as you have used since the previous module.

**JOIN** pairs each satellite with each of its readings.

::: example Three ways, two answers
Run all three on the module's data.

EXISTS and IN both return three rows:

```text
 sat_id  |   name
---------+----------
 SAT-001 | Aurora
 SAT-002 | Borealis
 SAT-003 | Cirrus
```

The JOIN returns six:

```text
 sat_id  |   name
---------+----------
 SAT-001 | Aurora
 SAT-001 | Aurora
 SAT-001 | Aurora
 SAT-002 | Borealis
 SAT-002 | Borealis
 SAT-003 | Cirrus
```

The join is not wrong about *which* satellites; it is answering a different question. A join produces one output row per matching pair. Aurora has three readings, so it pairs three times. That is the fan-out from lessons 02 and 04: a one-to-many join repeats the "one" side once per match.

Sanity check: the join's row count equals the number of readings, $3 + 2 + 1 = 6$, because every reading matches exactly one satellite. Dorado, with no readings, is missing from all three.
:::

`SELECT DISTINCT` would tidy the join here, but only after building every pair — on a year of 1 Hz telemetry, billions of pairs to find a few thousand satellites. When you need only "is there a match?", say that, with EXISTS.

When you *do* need columns from the right-hand table — the reading's value, its timestamp — a join is the right tool, and fan-out is exactly what you asked for.

::: key Semi-join
A **semi-join** keeps each left row that has at least one match, once, with only the left columns. `EXISTS (SELECT 1 … WHERE r.key = s.key)` and `key IN (SELECT …)` are semi-joins. A plain JOIN is not: it returns one row per matching pair, so a one-to-many match repeats the left row.
:::

## What each one does with NULL

EXISTS and IN also differ in how many answers they can give.

**EXISTS can only be TRUE or FALSE.** Either the subquery produced a row or it did not. There is no third answer. A NULL inside the subquery's rows makes no difference to EXISTS, because it never compares those values — it only counts whether any row came back.

**IN can be TRUE, FALSE or UNKNOWN**, because it is a chain of `=` comparisons, and you know from the previous module that a comparison with NULL is UNKNOWN. `x IN (a, b, NULL)` means `x = a OR x = b OR x = NULL`. If `x` matches `a`, one TRUE is enough and the result is TRUE. If `x` matches nothing, the result is not FALSE but UNKNOWN, because of the NULL on the end.

To see it, take a small table from the ground stations. `downlink` logs each radio frame received. Frame 3 could not be decoded far enough to tell which spacecraft sent it, so its `sat_id` is NULL:

```text
 frame_id | sat_id  |          ts
----------+---------+----------------------
        1 | SAT-001 | 2026-03-02T03:00:00Z
        2 | SAT-003 | 2026-03-02T04:10:00Z
        3 | [NULL]  | 2026-03-02T05:25:00Z
```

Now print both tests as columns, instead of filtering on them, so you can see their raw answers:

```sql
SELECT s.sat_id,
       s.sat_id IN (SELECT d.sat_id FROM downlink AS d)                AS in_list,
       EXISTS (SELECT 1 FROM downlink AS d WHERE d.sat_id = s.sat_id)  AS has_frame
FROM satellite AS s
ORDER BY s.sat_id;
```

```text
 sat_id  | in_list | has_frame
---------+---------+-----------
 SAT-001 | t       | t
 SAT-002 | [NULL]  | f
 SAT-003 | t       | t
 SAT-004 | [NULL]  | f
```

(PostgreSQL prints TRUE as `t` and FALSE as `f`; UNKNOWN shows as NULL. SQLite prints 1, 0 and NULL, with the same pattern.)

For SAT-002, EXISTS says plainly "no frame". IN says "I cannot tell", because SAT-002 might, for all the database knows, be the unidentified frame 3.

In a positive `WHERE … IN`, that UNKNOWN does no harm: WHERE keeps only TRUE, so UNKNOWN is dropped exactly as FALSE would be. The difference bites the moment you put NOT in front. `NOT TRUE` is FALSE and `NOT FALSE` is TRUE, but `NOT UNKNOWN` is still UNKNOWN — so SAT-002 can never pass `NOT IN`, and neither can anything else.

::: key EXISTS versus IN with NULLs
EXISTS is a pure existence test and is unaffected by NULL. IN is a comparison, so NOT IN against a set containing NULL is never TRUE and silently returns nothing. Prefer EXISTS and NOT EXISTS for anti-joins.
:::

## The anti-join: rows with no match

Turn the homework question round: "Which students handed in *nothing*?" Go down the register and keep each name for which no sheet exists. That is an **anti-join**: keep each left row that has *no* match on the right.

The module's second exercise is exactly this, with a time window: which satellites have no reading at or after `2026-03-02T00:00:00Z`?

::: example Satellites silent since midnight on 2 March
```sql
SELECT s.sat_id, s.name
FROM satellite AS s
WHERE NOT EXISTS (
    SELECT 1
    FROM reading AS r
    WHERE r.sat_id = s.sat_id
      AND r.ts >= '2026-03-02T00:00:00Z'
)
ORDER BY s.sat_id;
```

```text
 sat_id  |   name
---------+----------
 SAT-002 | Borealis
 SAT-004 | Dorado
```

Read the inner query aloud as "readings from this satellite, at or after midnight on 2 March". NOT EXISTS keeps the satellite when that list is empty. Go through all four:

- **Aurora** sent 30 °C at `2026-03-02T01:00:00Z`, which is after the cutoff. A row exists, so NOT EXISTS is FALSE and Aurora is dropped.
- **Borealis** sent two readings, both on 1 March. None is in the window, so NOT EXISTS is TRUE: kept.
- **Cirrus** sent one reading at exactly `2026-03-02T00:00:00Z`. The test is `>=`, so the cutoff instant counts as inside the window. Dropped.
- **Dorado** sent nothing ever. The inner list is empty: kept.

Sanity check: two satellites reported in the window and two did not, $2 + 2 = 4$, the whole fleet. On the **[[timeline|silence-timeline]]**, the two kept satellites are the two with no dot on or to the right of the cutoff line. The query runs unchanged in SQLite, which is where the exercise checks it.
:::

Notice where the time condition lives: *inside* the subquery, next to the key match. It is part of the definition of "a matching row". Put it outside, on the satellite, and it would mean something else entirely.

### The same anti-join as an outer join

There is a second correct way to write an anti-join, and you will meet it in other people's code constantly. LEFT JOIN the readings, then keep only the satellites that got no partner:

```sql
SELECT s.sat_id, s.name
FROM satellite AS s
LEFT JOIN reading AS r
       ON r.sat_id = s.sat_id
      AND r.ts >= '2026-03-02T00:00:00Z'
WHERE r.sat_id IS NULL
ORDER BY s.sat_id;
```

It returns the same Borealis and Dorado. It works because a LEFT JOIN fills a satellite with no matching reading with NULLs, and `r.sat_id` cannot be NULL in any real reading (the column is `NOT NULL`), so `r.sat_id IS NULL` is TRUE exactly for the padded rows.

Here the window *must* be in the ON clause. ON decides which readings count as a match, before the padding happens. Move it to WHERE and everything breaks:

```sql
SELECT s.sat_id, s.name
FROM satellite AS s
LEFT JOIN reading AS r ON r.sat_id = s.sat_id
WHERE r.ts >= '2026-03-02T00:00:00Z'
  AND r.sat_id IS NULL;
```

```text
 sat_id | name
--------+------
(0 rows)
```

Now the join matches every reading of every satellite, so Borealis is not padded — it has two real, old readings. Only Dorado is padded. Then WHERE asks each row for a timestamp in the window *and* a NULL satellite id. The padded Dorado row has `r.ts` NULL, so `r.ts >= …` is UNKNOWN; every real row has a non-NULL `r.sat_id`. No row can pass both, and the query returns nothing.

And if you forget the window altogether, the LEFT JOIN version finds only Dorado: the satellites that have *never* reported, not the ones that have gone quiet.

::: warning Test the join key, or another NOT NULL column
In the LEFT JOIN anti-join, check `IS NULL` on a right-hand column that is never NULL in real rows — the join key is the safe choice. If you tested a column that can legitimately be NULL, such as a `value` with dropouts, a real reading with a missing value would look like "no match" and its satellite would be wrongly reported silent.
:::

## Why NOT IN is the wrong tool

The third way to write the anti-join looks the most natural of all:

```sql
SELECT s.sat_id, s.name
FROM satellite AS s
WHERE s.sat_id NOT IN (SELECT r.sat_id
                       FROM reading AS r
                       WHERE r.ts >= '2026-03-02T00:00:00Z')
ORDER BY s.sat_id;
```

On today's data it even returns the right answer, Borealis and Dorado. So what is wrong with it? You already know the trap from the previous module: one NULL in the list and NOT IN returns nothing. Here is why that makes NOT IN the wrong *tool*, not merely a query to write carefully. There are three reasons.

**1. Its correctness depends on a rule somewhere else.** This query is right only because `reading.sat_id` is declared `NOT NULL`. Nothing in the query says so; a reader has to go and look at the schema. Point the same query at a column that allows NULL — the `downlink` table above — and it fails silently:

```sql
SELECT s.sat_id
FROM satellite AS s
WHERE s.sat_id NOT IN (SELECT d.sat_id
                       FROM downlink AS d
                       WHERE d.ts >= '2026-03-02T00:00:00Z');
```

```text
 sat_id
--------
(0 rows)
```

The real answer to "which satellites did the ground not hear from?" is SAT-002 and SAT-004, and NOT EXISTS with `d.sat_id = s.sat_id` returns exactly those, because frame 3 matches no satellite. NOT IN returns nothing, raises no error, and a dashboard built on it would show "all satellites heard". A column that is NOT NULL today can be relaxed next year by someone who never sees this query.

**2. It treats NULL on the left side differently too.** If the value being tested is itself NULL, `NULL NOT IN (…)` is UNKNOWN whenever the list has anything in it, so that row is dropped. NOT EXISTS with `d.sat_id = s.sat_id` finds no match for a NULL key and *keeps* the row. The two are not the same operation, and only NOT EXISTS means plainly "no matching row exists".

**3. The planner cannot treat it as an anti-join.** Because of those NULL rules, PostgreSQL may not rewrite NOT IN into its fast anti-join machinery; the answers could differ. NOT EXISTS and the LEFT JOIN version carry no such baggage. On a test with 2,000 satellites and 500,000 readings, the plans were:

```text
-- NOT EXISTS (and, identically, LEFT JOIN … IS NULL)
 Hash Right Anti Join
   Hash Cond: (r.sat_id = s.sat_id)
   ->  Seq Scan on big_reading r
   ->  Hash
         ->  Seq Scan on big_sat s

-- NOT IN
 Seq Scan on big_sat s
   Filter: (NOT (SubPlan 1))
   SubPlan 1
     ->  Materialize
           ->  Seq Scan on big_reading
```

The anti-join reads each table once. The NOT IN plan, for every satellite, walks through a stored copy of the half-million ids — the per-row SubPlan from the previous lesson. On that machine NOT EXISTS took about 0.06 seconds and NOT IN about 3.3 seconds, some fifty times slower, for the same 100 silent satellites. (When the list is small enough, PostgreSQL uses a faster **[["hashed SubPlan"|hashed-subplan]]** for NOT IN, but it is still not a true anti-join, and it falls back to the slow form as the list grows.)

::: key The anti-join
To find rows with **no** match — satellites with no telemetry in a window — use `NOT EXISTS (SELECT 1 FROM reading r WHERE r.sat_id = s.sat_id AND <window>)`, or `LEFT JOIN … ON <key> AND <window> WHERE r.key IS NULL`. Both are NULL-safe and plan as an anti-join. NOT IN is the wrong tool: one NULL in the subquery makes it return nothing, its correctness hangs on a NOT NULL constraint elsewhere, and PostgreSQL cannot plan it as an anti-join.
:::

## When LEFT JOIN plus IS NOT NULL is an inner join in disguise

The LEFT JOIN anti-join keeps the rows where the right side is NULL. Its mirror image is a pattern that should always make you stop:

```sql
SELECT s.name, r.ts, r.value
FROM satellite AS s
LEFT JOIN reading AS r
       ON r.sat_id = s.sat_id
      AND r.ts >= '2026-03-02T00:00:00Z'
WHERE r.sat_id IS NOT NULL;
```

::: example Watching the outer join undo itself
First, the LEFT JOIN alone, with no WHERE. Every satellite appears; those with no reading in the window are padded with NULLs:

```text
   name   |          ts          | value
----------+----------------------+--------
 Aurora   | 2026-03-02T01:00:00Z |     30
 Borealis | [NULL]               | [NULL]
 Cirrus   | 2026-03-02T00:00:00Z |     11
 Dorado   | [NULL]               | [NULL]
```

The two **[[padded rows|padded-rows]]**, Borealis and Dorado, are exactly what LEFT JOIN added beyond an inner join. Now apply `WHERE r.sat_id IS NOT NULL`:

```text
  name  |          ts          | value
--------+----------------------+-------
 Aurora | 2026-03-02T01:00:00Z |    30
 Cirrus | 2026-03-02T00:00:00Z |    11
```

The WHERE removed precisely the padded rows. What is left is exactly what `JOIN reading AS r ON r.sat_id = s.sat_id AND r.ts >= '2026-03-02T00:00:00Z'` would have produced. Sanity check: four rows went in, the two padded ones came out, and the two real pairs remain — the same count an inner join gives.
:::

So a LEFT JOIN followed by `WHERE right.col IS NOT NULL` is an inner join written in a roundabout way. A reader sees "LEFT" and assumes unmatched satellites are kept, then has to discover three lines later that they are not.

The more common version is accidental. Someone writes a LEFT JOIN to keep silent satellites, then adds a filter on a right-hand column to the WHERE — `WHERE r.ts >= '2026-03-02T00:00:00Z'`. For every padded row `r.ts` is NULL, the comparison is UNKNOWN, and the row is dropped, exactly as with IS NOT NULL. The silent satellites the LEFT JOIN was written to keep are gone, and nobody notices, because the result looks tidy.

::: key LEFT JOIN then WHERE right.col IS NOT NULL
An inner join, expressed confusingly. The WHERE clause discards exactly the rows the outer join added. Either write INNER JOIN, or move the condition into the ON clause if you meant to keep the unmatched rows.
:::

::: warning Any WHERE test on the right-hand table does the same
`WHERE r.value > 20`, `WHERE r.channel = 'BUS_TEMP'` and `WHERE r.ts >= …` all turn a LEFT JOIN into an inner join, because they are UNKNOWN on padded rows. A condition that describes *which right-hand rows count as a match* belongs in ON. Only `IS NULL`, `IS NOT NULL`, COALESCE and other deliberately NULL-aware tests belong in WHERE.
:::

## Choosing the tool

| You want | Write | Why |
| --- | --- | --- |
| left rows with at least one match | `EXISTS (SELECT 1 … )` | once per row, stops at first match |
| same, from a short, NULL-free list | `IN (…)` | fine; UNKNOWN is harmless without NOT |
| left rows with no match | `NOT EXISTS (SELECT 1 … )` | NULL-safe anti-join |
| same, older style | `LEFT JOIN … ON key AND window WHERE r.key IS NULL` | NULL-safe, same plan |
| columns from both tables | `JOIN` | fan-out is intended |
| left rows with no match, via `NOT IN (SELECT …)` | do not | silent on NULL, slow plan |

PostgreSQL plans EXISTS and IN alike, as a semi-join, and NOT EXISTS and the LEFT JOIN form alike, as an anti-join. So pick whichever says the question most plainly. For "no match", that is almost always **[[NOT EXISTS|not-exists-reading]]**.

## Check yourself

::: check
Write a query listing satellites that sent at least one BUS_TEMP reading above 21 °C, each satellite once, without DISTINCT.
:::

::: answer
```sql
SELECT s.sat_id, s.name
FROM satellite AS s
WHERE EXISTS (SELECT 1
              FROM reading AS r
              WHERE r.sat_id = s.sat_id
                AND r.channel = 'BUS_TEMP'
                AND r.value > 21)
ORDER BY s.sat_id;
```

This returns SAT-001 Aurora (24 and 30) and SAT-002 Borealis (22), once each, even though Aurora has two qualifying readings. EXISTS only asks whether any row exists, so there is nothing to de-duplicate.
:::

::: check
For each expression, say whether it is TRUE, FALSE or UNKNOWN:
(a) `'SAT-001' IN ('SAT-001', NULL)` (b) `'SAT-009' IN ('SAT-001', NULL)` (c) `'SAT-009' NOT IN ('SAT-001', NULL)` (d) `EXISTS (SELECT NULL)`
:::

::: answer
(a) TRUE: the first comparison is TRUE, and TRUE OR anything is TRUE.

(b) UNKNOWN: `'SAT-009' = 'SAT-001'` is FALSE and `'SAT-009' = NULL` is UNKNOWN; FALSE OR UNKNOWN is UNKNOWN.

(c) UNKNOWN: it is NOT of (b), and NOT UNKNOWN is UNKNOWN. So a WHERE with it keeps nothing.

(d) TRUE. `SELECT NULL` returns one row (holding a NULL). EXISTS only asks whether a row came back, and one did. The NULL inside is never compared.
:::

::: check
A teammate writes the silence check as below and gets Dorado only. What did the query ask, and how do you fix it?

```sql
SELECT s.sat_id FROM satellite AS s
WHERE NOT EXISTS (SELECT 1 FROM reading AS r WHERE r.sat_id = s.sat_id)
  AND s.launched < '2026-03-02';
```
:::

::: answer
The time condition went on the wrong table. The subquery now means "any reading from this satellite, ever", so only Dorado, which has never reported, passes. The extra condition filters satellites by *launch* date, which has nothing to do with silence. The window belongs inside the subquery, as part of what counts as a match: `WHERE r.sat_id = s.sat_id AND r.ts >= '2026-03-02T00:00:00Z'`. That returns SAT-002 and SAT-004.
:::

::: check
This report is meant to list every satellite with its latest reading value on 2 March, showing NULL for satellites with none. It lists only Aurora and Cirrus. Why, and what is the fix?

```sql
SELECT s.name, r.value
FROM satellite AS s
LEFT JOIN reading AS r ON r.sat_id = s.sat_id
WHERE substr(r.ts, 1, 10) = '2026-03-02';
```
:::

::: answer
The date test is on a right-hand column in WHERE. For satellites without a 2 March reading — Borealis's readings are all on 1 March and Dorado has none — the rows that survive the join either have the wrong date (FALSE) or are padded with a NULL `ts` (UNKNOWN), and WHERE drops them. The LEFT JOIN has become an inner join. Move the condition into ON:

```sql
SELECT s.name, r.value
FROM satellite AS s
LEFT JOIN reading AS r
       ON r.sat_id = s.sat_id
      AND substr(r.ts, 1, 10) = '2026-03-02'
ORDER BY s.name;
```

Now it gives Aurora 30, Borealis NULL, Cirrus 11, Dorado NULL. (Each satellite has at most one 2 March reading here, so no further step is needed to pick the latest.)
:::

::: check
A reviewer says: "`reading.sat_id` is NOT NULL, so NOT IN is perfectly safe in our silence check. Why change it?" Give two reasons that still hold.
:::

::: answer
First, the query's correctness would depend on a constraint that lives in another file and can change: if the column is ever relaxed, or the query is copied onto a table like `downlink` where the id can be NULL, NOT IN silently returns no satellites and the dashboard shows the whole fleet as healthy. NOT EXISTS gives the right answer either way. Second, PostgreSQL cannot plan NOT IN as an anti-join, so on a large reading table it can run a per-row SubPlan that is many times slower than the NOT EXISTS anti-join. NOT EXISTS is also the plainer statement of the question: "no reading exists in the window".
:::

## Summary

| Idea | In one line |
| --- | --- |
| Semi-join | left rows with at least one match, once each: `EXISTS`, or `IN` |
| JOIN | one row per matching pair; repeats the left row on one-to-many |
| EXISTS | TRUE or FALSE only; never compares values, so NULL cannot affect it |
| IN | TRUE, FALSE or UNKNOWN; UNKNOWN when there is no match and the list holds a NULL |
| Anti-join | left rows with no match: `NOT EXISTS`, or `LEFT JOIN … WHERE r.key IS NULL` |
| Window in an anti-join | inside the subquery, or in the ON clause; never in the WHERE |
| NOT IN | one NULL makes it return nothing; cannot plan as an anti-join |
| LEFT JOIN + `WHERE r.col IS NOT NULL` | an inner join in disguise; filters on the right side belong in ON |

The queries in these last lessons have started to nest: subqueries inside WHERE, derived tables inside FROM. Next lesson pulls those steps out into common table expressions — named steps you read top to bottom — without changing a single row of the result.

::: context gone-quiet How operators notice silence
Mission control software usually tracks a "time since last contact" for every spacecraft and raises an alarm when it passes a limit — a few orbits for a satellite in low Earth orbit, which passes over some ground station many times a day.

That alarm is an anti-join at heart: the fleet list, minus every spacecraft with a frame received inside the window. Silence is often the only symptom of the worst failures, because a spacecraft that has lost power or its radio cannot send a message saying so.
:::

::: context semi-anti-picture Semi-join and anti-join side by side
Both go down the satellite list and look for any reading in the window. The semi-join keeps the ticks; the anti-join keeps the crosses. Every satellite lands in exactly one of the two.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="22" font-weight="700">satellite</text>
    <text x="130" y="22" font-weight="700">reading in window?</text>
  </g>
  <g fill="#ffffff" stroke="#1f2a44">
    <rect x="20" y="32" width="90" height="26"/><rect x="20" y="62" width="90" height="26"/>
    <rect x="20" y="92" width="90" height="26"/><rect x="20" y="122" width="90" height="26"/>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="28" y="50">Aurora</text><text x="28" y="80">Borealis</text>
    <text x="28" y="110">Cirrus</text><text x="28" y="140">Dorado</text>
  </g>
  <g font-size="12">
    <text x="130" y="50" fill="#1d6fd1">yes (01:00)</text>
    <text x="130" y="80" fill="#b4232c">no</text>
    <text x="130" y="110" fill="#1d6fd1">yes (00:00)</text>
    <text x="130" y="140" fill="#b4232c">no</text>
  </g>
  <g font-size="12">
    <text x="240" y="50" fill="#1d6fd1">semi-join</text>
    <text x="240" y="80" fill="#b4232c">anti-join</text>
    <text x="240" y="110" fill="#1d6fd1">semi-join</text>
    <text x="240" y="140" fill="#b4232c">anti-join</text>
  </g>
</svg>
```

EXISTS gives the blue rows, NOT EXISTS the red ones, and together they make the whole fleet.
:::

::: context select-one Why SELECT 1 inside EXISTS
EXISTS throws away whatever the subquery selects, so `SELECT 1`, `SELECT *` and `SELECT NULL` all behave identically — the planner does not even fetch the columns. `SELECT 1` became the habit because it tells the reader, at a glance, "only the existence of a row matters here".

You will occasionally hear that `SELECT *` inside EXISTS is slower. In modern PostgreSQL and SQLite it is not; the choice is purely about being clear.
:::

::: context silence-timeline The silence check on a timeline
Each row is a satellite, each dot a reading. The red line is the cutoff, midnight on 2 March. A satellite is silent if it has no dot on or to the right of the line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="10" y="44">Aurora</text><text x="10" y="74">Borealis</text>
    <text x="10" y="104">Cirrus</text><text x="10" y="134">Dorado</text>
  </g>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="90" y1="40" x2="340" y2="40"/><line x1="90" y1="70" x2="340" y2="70"/>
    <line x1="90" y1="100" x2="340" y2="100"/><line x1="90" y1="130" x2="340" y2="130"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="90" cy="40" r="5"/><circle cx="138" cy="40" r="5"/><circle cx="290" cy="40" r="5"/>
    <circle cx="90" cy="70" r="5"/><circle cx="186" cy="70" r="5"/>
    <circle cx="282" cy="100" r="5"/>
  </g>
  <line x1="282" y1="24" x2="282" y2="146" stroke="#b4232c" stroke-width="2"/>
  <text x="282" y="18" font-size="11" fill="#b4232c" text-anchor="middle">2 Mar 00:00</text>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="90" y="164">1 Mar 00:00</text><text x="186" y="164">12:00</text>
  </g>
  <g font-size="11" fill="#b4232c">
    <text x="300" y="74">silent</text><text x="300" y="134">silent</text>
  </g>
</svg>
```

Cirrus's single dot sits exactly on the line. With `>=` it counts as inside the window, so Cirrus is not silent; with `>` it would be.
:::

::: context hashed-subplan Why the list's size matters
For a hashed SubPlan, PostgreSQL loads the subquery's ids into a **hash table** in memory — a lookup structure that answers "is this id present?" almost instantly. It only does this when it expects the whole list to fit in its per-operation memory budget, a setting called `work_mem` (4 MB by default).

A half-million text ids did not fit, so the planner chose the plain SubPlan instead: for each satellite, scan the stored list from the top. A true anti-join has no such cliff, because it is allowed to spill to disk and still reads each table only once.
:::

::: context padded-rows What the WHERE removes
The LEFT JOIN adds a padded row for each satellite with no match. `WHERE r.sat_id IS NOT NULL` strikes out exactly those rows.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="22" font-weight="700">name</text><text x="120" y="22" font-weight="700">r.ts</text><text x="280" y="22" font-weight="700">value</text>
  </g>
  <rect x="14" y="30" width="330" height="24" fill="#8fb8f0"/>
  <rect x="14" y="58" width="330" height="24" fill="#f2b880"/>
  <rect x="14" y="86" width="330" height="24" fill="#8fb8f0"/>
  <rect x="14" y="114" width="330" height="24" fill="#f2b880"/>
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="47">Aurora</text><text x="120" y="47">2026-03-02T01:00</text><text x="280" y="47">30</text>
    <text x="20" y="75">Borealis</text><text x="120" y="75">NULL</text><text x="280" y="75">NULL</text>
    <text x="20" y="103">Cirrus</text><text x="120" y="103">2026-03-02T00:00</text><text x="280" y="103">11</text>
    <text x="20" y="131">Dorado</text><text x="120" y="131">NULL</text><text x="280" y="131">NULL</text>
  </g>
  <line x1="14" y1="70" x2="344" y2="70" stroke="#b4232c" stroke-width="2"/>
  <line x1="14" y1="126" x2="344" y2="126" stroke="#b4232c" stroke-width="2"/>
</svg>
```

Blue rows are real matches, orange rows are padding. Strike the orange rows and you are left with the inner join.
:::

::: context not-exists-reading Reading NOT EXISTS aloud
The clearest way to read an anti-join is as a sentence about each outer row: "keep this satellite if there does not exist a reading from it at or after the cutoff". That sentence is exactly the question an operator asks.

The words also explain why NULLs cannot hurt. The sentence is about whether rows exist, not about what values they hold. A frame with no satellite id is a row that exists, but it is not "a reading from *this* satellite", because NULL = SAT-002 is not TRUE — so it never counts as a match for anyone.
:::
