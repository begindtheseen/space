---
id: l05-null-and-three-valued-logic
title: "NULL: the value that is not there"
minutes: 24
covers:
  - NULL and three-valued logic; the = NULL trap; IS NULL and IS NOT NULL
  - COALESCE, NULLIF, CAST
---

Telemetry has holes in it. A ground station loses the signal for forty seconds while the satellite passes behind a mountain. A sensor is switched off to save power. A frame arrives with a bad checksum and one field is thrown away. Every one of those leaves a row where some measurement should be and is not.

A database needs a way to write "nothing here". It cannot use zero, because zero is a real measurement: a battery at zero charge is a flat battery, which is very different from a battery nobody heard from. So SQL has a special marker called **NULL** that means *no value is known*.

NULL causes more wrong answers in real data work than anything else in SQL. Last lesson a CASE called a missing reading OK, and a set of counts came up one short. This lesson explains why, shows the one-line mistake almost everyone makes when testing for NULL, and gives you three tools — `IS NULL`, `COALESCE` and `NULLIF` — for handling it on purpose.

## NULL means "unknown", not zero and not empty

Picture a paper form with a box for "middle name". Three different things could be in that box:

- A name, like "Ann". That is a value.
- The box is filled in with nothing, because the person has no middle name. For text, that is the **empty string**, written `''` — a piece of text with zero characters in it. It is still a value: we know the answer, and the answer is "none".
- The box was never filled in. We do not know whether there is a middle name. That is **[[NULL|codd-nulls]]**.

Numbers work the same way. `0` is a value. NULL is the absence of one. Here is the telemetry table from the module exercise; the database shows a NULL in the fifth row. (By default psql prints a NULL as a blank, which is easy to mistake for an empty string, so the outputs in this lesson use the psql setting `\pset null '[NULL]'` to make them visible.)

```sql
SELECT sat_id, ts, channel, value
FROM telemetry;
```

```text
 sat_id  |          ts          | channel  | value
---------+----------------------+----------+--------
 SAT-001 | 2026-03-01T00:00:00Z | BATT_SOC |   0.94
 SAT-001 | 2026-03-01T00:01:00Z | BATT_SOC |   0.88
 SAT-001 | 2026-03-01T00:02:00Z | BATT_SOC |   0.61
 SAT-002 | 2026-03-01T00:00:00Z | BATT_SOC |   0.42
 SAT-002 | 2026-03-01T00:01:00Z | BATT_SOC | [NULL]
 SAT-002 | 2026-03-01T00:02:00Z | BATT_SOC |   0.19
 SAT-003 | 2026-03-01T00:00:00Z | BUS_TEMP |   21.5
 SAT-003 | 2026-03-01T00:01:00Z | BATT_SOC |   0.75
```

SAT-002 reported its battery at midnight and at two minutes past, but the reading at one minute past never arrived. The row exists — we know *when* there should have been a reading — but its `value` is NULL.

As lesson 01 showed, a column declared **NOT NULL** refuses missing values, and a primary key is never NULL. In this table only `value` is allowed to be missing.

## Anything combined with NULL is NULL

If you do not know a number, you do not know that number plus one either. SQL follows this exactly. Almost every operator and function that receives a NULL gives back a NULL:

```sql
SELECT NULL + 1       AS a,
       'SAT-' || NULL AS b,
       NULL * 0       AS c;
```

```text
   a    |   b    |   c
--------+--------+--------
 [NULL] | [NULL] | [NULL]
```

Even `NULL * 0` is NULL. You might argue that anything times zero is zero, but SQL does not reason about the other side; it sees an unknown input and returns an unknown output. This is called **[[NULL propagation|propagation]]**: one NULL flows through a whole calculation and comes out the other end.

## Three answers: TRUE, FALSE and UNKNOWN

Now the important part. What happens when you *compare* something with NULL?

Suppose someone asks, "Is SAT-002's reading at one minute past greater than 0.5?" You cannot say yes. You cannot say no. The honest answer is "I don't know". SQL gives exactly that answer. A comparison involving NULL is neither TRUE nor FALSE; it is **UNKNOWN**.

So SQL's logic has three truth values instead of the usual two. This is called **[[three-valued logic|truth-table]]**. And `NULL = NULL` is UNKNOWN too: two readings that both failed to arrive are not known to be equal — they are two separate unknowns.

When you combine conditions with `AND`, `OR` and `NOT`, UNKNOWN behaves like "could be either":

| A | B | A AND B | A OR B |
| --- | --- | --- | --- |
| TRUE | UNKNOWN | UNKNOWN | TRUE |
| FALSE | UNKNOWN | FALSE | UNKNOWN |
| UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

And `NOT UNKNOWN` is UNKNOWN. You do not need to memorise this. Ask, "if the unknown were TRUE, and then if it were FALSE, would the answer change?" `FALSE AND anything` is FALSE either way. `TRUE OR anything` is TRUE either way. `TRUE AND UNKNOWN` could go either way, so it stays UNKNOWN.

Here is the rule that turns all of this into real results: **WHERE keeps a row only when its condition is TRUE.** FALSE rows are dropped, and so are UNKNOWN rows. The same goes for a `WHEN` in CASE: only a TRUE condition picks its branch. That is exactly why, last lesson, the missing reading skipped every `WHEN` and landed in `ELSE`.

::: key
NULL means unknown. Any comparison with NULL — including `NULL = NULL` — evaluates to **UNKNOWN**, not TRUE or FALSE. SQL uses **three-valued logic**: TRUE, FALSE, UNKNOWN. `WHERE` keeps only rows whose condition is TRUE, so UNKNOWN rows are silently dropped. Arithmetic with NULL gives NULL.
:::

::: example Where did the seventh row go?
Every battery reading is either above 0.5 or not, surely? Count both sides:

```sql
SELECT COUNT(*) FROM telemetry
WHERE channel = 'BATT_SOC' AND value > 0.5;
-- 4

SELECT COUNT(*) FROM telemetry
WHERE channel = 'BATT_SOC' AND NOT (value > 0.5);
-- 2

SELECT COUNT(*) FROM telemetry
WHERE channel = 'BATT_SOC';
-- 7
```

(`COUNT(*)` counts the rows, as in the last lesson; `--` starts a comment, and the comment shows what each query printed.)

Step by step. The readings above 0.5 are 0.94, 0.88, 0.61 and 0.75: four rows. The readings not above 0.5 are 0.42 and 0.19: two rows. But $4 + 2 = 6$, and there are 7 battery rows.

The missing row is the NULL. For it, `value > 0.5` is UNKNOWN, so the first query drops it. `NOT (UNKNOWN)` is still UNKNOWN, so the second query drops it too. It falls through **both** sides of what looked like an either-or.

Sanity check: this is the database refusing to guess, not a bug. Whenever a "this or not this" split does not add up to the total, look for NULLs.
:::

## The = NULL trap

Now you can see the trap coming. You want the rows with no value. The natural thing to type is:

```sql
SELECT sat_id, ts, value
FROM telemetry
WHERE value = NULL;
```

```text
 sat_id | ts | value
--------+----+-------
(0 rows)
```

Zero rows, no error. For every row, `value = NULL` asks "is this value equal to an unknown?" and the answer is UNKNOWN — even for the row whose value *is* NULL. WHERE keeps only TRUE, so nothing survives. The query fails silently, the worst way to fail.

`WHERE value <> NULL` (read `<>` as "is not equal to") also returns zero rows, not the seven rows that have values.

SQL has a separate test for this job. **IS NULL** asks "is this the NULL marker?", and it only ever answers TRUE or FALSE, never UNKNOWN:

```sql
SELECT sat_id, ts, value
FROM telemetry
WHERE value IS NULL;
```

```text
 sat_id  |          ts          | value
---------+----------------------+--------
 SAT-002 | 2026-03-01T00:01:00Z | [NULL]
```

Its partner **IS NOT NULL** keeps the rows that do have a value. `WHERE value IS NOT NULL` returns the other seven.

::: key
`WHERE col = NULL` returns nothing: NULL means unknown, so any comparison with it evaluates to UNKNOWN rather than TRUE, and WHERE keeps only TRUE rows. Use **IS NULL** and **IS NOT NULL**, which test for the marker rather than comparing values. `<> NULL` fails the same way `= NULL` does.
:::

::: warning Filtering "everything except" can drop NULLs you meant to keep
The `anomaly` table (you will meet it properly below) has three rows: one for SAT-002, one for SAT-004, and one whose `sat_id` is NULL because nobody knows yet which satellite it belongs to. `WHERE sat_id <> 'SAT-002'` does not return "every anomaly except SAT-002's". It returns only anomaly 2. The unattributed one gives UNKNOWN and vanishes. If you want it, say so: `WHERE sat_id <> 'SAT-002' OR sat_id IS NULL`. PostgreSQL also has a NULL-safe comparison that does this in one step, `sat_id IS DISTINCT FROM 'SAT-002'`, which treats NULL as an ordinary, comparable value. SQLite accepts the same words.
:::

::: example A triage that cannot hide a gap
Last lesson's CASE called a missing battery reading OK. The fix is to catch the NULL in its own branch, and to put that branch *first*, before any comparison gets a chance to go UNKNOWN:

```sql
SELECT sat_id, ts, value,
       CASE WHEN value IS NULL THEN 'NO DATA'
            WHEN value < 0.30  THEN 'CRITICAL'
            WHEN value < 0.70  THEN 'LOW'
            ELSE 'OK'
       END AS status
FROM telemetry
WHERE channel = 'BATT_SOC' AND sat_id = 'SAT-002'
ORDER BY ts;
```

```text
 sat_id  |          ts          | value  |  status
---------+----------------------+--------+----------
 SAT-002 | 2026-03-01T00:00:00Z |   0.42 | LOW
 SAT-002 | 2026-03-01T00:01:00Z | [NULL] | NO DATA
 SAT-002 | 2026-03-01T00:02:00Z |   0.19 | CRITICAL
```

Walk the middle row through: `value IS NULL` is TRUE, so NO DATA, and the database stops. The other two rows fail that first test (IS NULL is FALSE for them, never UNKNOWN) and go on to the ordinary thresholds.

Sanity check: SAT-002's charge fell from 0.42 to 0.19 in two minutes, and the reading in between is missing. That is the stretch an operator most needs to see, and now the report shows it. If you want only the readings that exist, as the module exercise does, filter with `WHERE value IS NOT NULL` instead.
:::

## NOT IN and the NULL that poisons it

Lesson 02 showed you the `NOT IN` trap with a typed list. You can now see exactly why it happens. `x NOT IN (a, b, NULL)` means `x <> a AND x <> b AND x <> NULL`. The last part is UNKNOWN for every row. Because `NOT IN` needs **[[every single check|not-in-picture]]** in its chain to be TRUE, one UNKNOWN link breaks the chain.

The dangerous version is the one where the list comes from a **subquery** — a whole `SELECT` in brackets, which the database runs first and uses as the list. Here is a realistic case. The `anomaly` table logs problems. Anomaly 3 is radio interference the team has not yet traced to any satellite, so its `sat_id` is NULL.

```sql
SELECT anomaly_id, sat_id, summary FROM anomaly;
```

```text
 anomaly_id | sat_id  |           summary
------------+---------+------------------------------
          1 | SAT-002 | Battery SOC below 0.20
          2 | SAT-004 | Reaction wheel 3 over-speed
          3 | [NULL]  | Unattributed RF interference
```

Which satellites have no anomalies? (In this lesson's copy of the database, the `satellite` table holds SAT-001 to SAT-005.)

```sql
SELECT sat_id
FROM satellite
WHERE sat_id NOT IN (SELECT sat_id FROM anomaly);
```

```text
 sat_id
--------
(0 rows)
```

Zero. The subquery produced `('SAT-002', 'SAT-004', NULL)`, and that one NULL made `NOT IN` UNKNOWN for every satellite. The report says "no clean satellites" when three of five are clean.

The quick fix keeps NULLs out of the list: add `WHERE sat_id IS NOT NULL` inside the subquery. The better fix uses **NOT EXISTS**, which asks, satellite by satellite, "is there no anomaly row that matches this one?":

```sql
SELECT sat_id
FROM satellite s
WHERE NOT EXISTS (SELECT 1 FROM anomaly a WHERE a.sat_id = s.sat_id)
ORDER BY sat_id;
```

```text
 sat_id
---------
 SAT-001
 SAT-003
 SAT-005
```

(`satellite s` gives the table a short nickname, so the inner query can say `s.sat_id`: "the satellite we are checking right now". The next module teaches this shape fully.) EXISTS only ever answers TRUE or FALSE — a matching row exists or it does not. The NULL anomaly matches nobody, so it is harmlessly ignored.

::: key
With **NOT IN** and a subquery that can return NULL: if any returned value is NULL the whole NOT IN is never TRUE, so the query silently returns zero rows. Use **NOT EXISTS**, which has no such trap.
:::

## Sorting and DISTINCT with NULL

**Sorting.** A NULL is not bigger or smaller than anything, so databases have to pick a place for it. PostgreSQL treats NULL as larger than every value: it comes *last* in `ORDER BY value` (ascending) and first with `DESC`. SQLite does the opposite: NULLs come *first* when ascending. To be sure, say what you want: `ORDER BY value NULLS LAST` or `NULLS FIRST`, which both databases understand.

**DISTINCT.** Here SQL is pragmatic: if a column holds several NULLs, `SELECT DISTINCT` returns one NULL row for all of them, not one each. For removing duplicates, all NULLs count as the same.

## COALESCE: the first value that is not NULL

Often you want a fallback. If an anomaly has no satellite yet, show the word UNATTRIBUTED instead of a blank. **[[COALESCE|coalesce-word]]** takes any number of arguments and returns the first one that is not NULL. Read it aloud as "co-a-LESS". `COALESCE(NULL, NULL, 3, 4)` is `3`.

```sql
SELECT anomaly_id, COALESCE(sat_id, 'UNATTRIBUTED') AS owner, summary
FROM anomaly;
```

```text
 anomaly_id |    owner     |           summary
------------+--------------+------------------------------
          1 | SAT-002      | Battery SOC below 0.20
          2 | SAT-004      | Reaction wheel 3 over-speed
          3 | UNATTRIBUTED | Unattributed RF interference
```

That is COALESCE doing its job: filling a *display* with a sensible default. The danger comes when you use it on a *measurement*.

First, a fact. Aggregate functions, such as `AVG` (the average, or mean) and `COUNT(column)`, **skip NULLs**. `AVG(value)` averages only the values that exist. `COUNT(*)` counts rows, but `COUNT(value)` counts only rows where `value` is not NULL. That is right for telemetry: you average what you measured, not what you missed.

::: example What COALESCE(value, 0) does to an average
Compare the mean state of charge with and without a "default of zero":

```sql
SELECT COUNT(*)                 AS n_rows,
       COUNT(value)             AS n_values,
       AVG(value)               AS mean_soc,
       AVG(COALESCE(value, 0))  AS mean_with_zeros
FROM telemetry
WHERE channel = 'BATT_SOC';
```

```text
 n_rows | n_values |      mean_soc      |  mean_with_zeros
--------+----------+--------------------+--------------------
      7 |        6 | 0.6316666652758917 | 0.5414285702364785
```

(The long tails of digits come from how the `REAL` column stores decimals. Lesson 06 explains them; read these as about 0.632 and 0.541.)

Check by hand. The six real readings add up to $0.94 + 0.88 + 0.61 + 0.42 + 0.19 + 0.75 = 3.79$. The true mean is $3.79 / 6 \approx 0.632$. With the gap turned into a zero, the sum is still $3.79$ but it is now divided by 7: $3.79 / 7 \approx 0.541$.

One missing reading pulled the average down by about $0.09$ — and worse, the gap has disappeared. Every report built on top now sees seven ordinary numbers, one saying a battery was completely flat, and nobody downstream can tell it was really a dropout.

Sanity check: the second mean is smaller, as it must be after adding a zero.
:::

::: key
**COALESCE** returns the first non-NULL argument, which is how you supply a default. It is dangerous when it silently converts a missing measurement into a plausible number, hiding a telemetry gap from every downstream aggregate. `AVG` and `COUNT(col)` already ignore NULL; `COUNT(*)` counts every row.
:::

## NULLIF: turning a value into NULL

**NULLIF** does the opposite job. `NULLIF(a, b)` returns NULL if `a` equals `b`, and returns `a` otherwise. `NULLIF(5, 5)` is NULL; `NULLIF(5, 4)` is `5`.

Why would you ever want to *make* a NULL? Two everyday reasons.

**Sentinel values.** Many systems cannot store NULL, so they use a made-up number to mean "no reading", such as `-999`. This number is called a **[[sentinel value|sentinel]]**. Here is the `thermistor` table (a thermistor is a small temperature sensor), whose readout wrote `-999` when it glitched:

```sql
SELECT ts, temp_c, NULLIF(temp_c, -999) AS temp_clean
FROM thermistor;
```

```text
          ts          | temp_c | temp_clean
----------------------+--------+------------
 2026-03-01T00:00:00Z |     18 |         18
 2026-03-01T00:01:00Z |   18.5 |       18.5
 2026-03-01T00:02:00Z |   -999 |     [NULL]
 2026-03-01T00:03:00Z |   19.5 |       19.5
```

Average the raw column and you get $(18 + 18.5 - 999 + 19.5)/4 = -235.75$ °C, for a battery that read 18 °C a minute earlier. Average `NULLIF(temp_c, -999)` and AVG skips the glitch: $(18 + 18.5 + 19.5)/3 \approx 18.7$ °C. NULLIF turned a fake number back into an honest "unknown", which the aggregate knows how to skip.

**Dividing safely.** In PostgreSQL, `SELECT 10 / 0` stops the whole query with `ERROR: division by zero`. Wrap the bottom in NULLIF — `10 / NULLIF(0, 0)` — and a zero becomes NULL, so the answer is NULL instead of an error. (SQLite quietly returns NULL for division by zero anyway, so there it only makes your intent visible.)

::: key
**NULLIF(a, b)** returns NULL when `a = b`, otherwise `a`. Use it to turn sentinel values (like `-999`) into NULL, and to avoid division by zero: `x / NULLIF(y, 0)`. **COALESCE** and **NULLIF** are opposites: one replaces NULL with a value, the other replaces a value with NULL.
:::

::: warning Never use COALESCE to undo NULLIF
`COALESCE(NULLIF(temp_c, -999), 0)` takes a sentinel, correctly turns it into "unknown", and then turns it right back into a fake measurement of 0 °C. If a number is missing, let it stay missing; where a human reads it, show "no data", not a number.
:::

A third tool usually travels with these two: `CAST`, which converts a value from one type to another. It belongs with data types, so the next lesson teaches it and puts all three to work together.

## Check yourself

::: check
For each expression, say whether it is TRUE, FALSE, UNKNOWN or NULL: (a) `NULL = NULL`, (b) `NULL IS NULL`, (c) `5 > 3 OR NULL > 1`, (d) `5 < 3 AND NULL > 1`, (e) `value - value` for SAT-002's missing reading.
:::

::: answer
- (a) UNKNOWN: two unknowns are not known to be equal.
- (b) TRUE: IS NULL tests for the marker and never answers UNKNOWN.
- (c) TRUE: `5 > 3` is TRUE, and TRUE OR anything is TRUE, whatever the unknown turns out to be.
- (d) FALSE: `5 < 3` is FALSE, and FALSE AND anything is FALSE.
- (e) NULL: arithmetic with a NULL input gives NULL. It is not 0, even though any number minus itself is 0 — SQL does not look at the two sides and notice they are the same; it sees an unknown input and returns an unknown output.
:::

::: check
A teammate wants the battery readings *outside* the band from 0.30 to 0.70 and runs `SELECT COUNT(*) FROM telemetry WHERE channel = 'BATT_SOC' AND NOT (value BETWEEN 0.30 AND 0.70)`. There are 7 battery rows and 2 inside the band, so she expects 5. It returns 4. Explain, and write a query that returns 5.
:::

::: answer
Inside the band are 0.61 and 0.42. Outside are 0.94, 0.88, 0.19 and 0.75 — four rows. The seventh row is the NULL: `NULL BETWEEN 0.30 AND 0.70` is UNKNOWN, and `NOT UNKNOWN` is still UNKNOWN, so WHERE drops it. If "outside the band" should include "no reading at all", say so:

```sql
SELECT COUNT(*) FROM telemetry
WHERE channel = 'BATT_SOC'
  AND (NOT (value BETWEEN 0.30 AND 0.70) OR value IS NULL);
```

That returns $4 + 1 = 5$. The brackets around the `OR` matter: without them, `AND` would bind tighter and the `OR value IS NULL` would let in NULL rows from every channel.
:::

::: check
To find the emptiest battery, a query runs `SELECT sat_id, ts, value FROM telemetry WHERE channel = 'BATT_SOC' ORDER BY value LIMIT 1`. In PostgreSQL it returns SAT-002's reading of 0.19. In SQLite it returns SAT-002's row at 00:01 with no value. Why the difference, and how do you make both give 0.19?
:::

::: answer
The two databases put NULLs at opposite ends of an ascending sort. PostgreSQL treats NULL as larger than any value, so it goes last and 0.19 comes first. SQLite puts NULL first, so `LIMIT 1` picks the missing reading. Either exclude the gap or say where it goes:

```sql
SELECT sat_id, ts, value FROM telemetry
WHERE channel = 'BATT_SOC' AND value IS NOT NULL
ORDER BY value
LIMIT 1;
```

(`ORDER BY value NULLS LAST` also works in both.) Both now return SAT-002 at 00:02 with 0.19. Filtering is clearer: the question was about readings that exist.
:::

::: check
A dashboard shows "average bus temperature today" as `AVG(COALESCE(temp_c, 0))`. Today one satellite dropped out for a third of its readings. Which way is its average wrong, and what should the query be?
:::

::: answer
A third of its readings became 0 °C. If the bus normally sits around 20 °C, the average is dragged toward zero: roughly $\frac{2}{3} \times 20 \approx 13$ °C instead of about 20 °C. It reads as if the satellite got cold, when in fact it went quiet. The query should be `AVG(temp_c)`, which skips the NULLs, alongside `COUNT(temp_c)` and `COUNT(*)` so the gap is visible as "coverage" instead of hidden in the average.
:::

::: check
A power table stores `energy_wh` and `duration_s`, and some rows have `duration_s = 0` from a logging glitch. Write an expression for average power in watts that does not crash PostgreSQL on those rows. (Power in watts is energy in watt-hours times 3600, divided by the duration in seconds.)
:::

::: answer
```sql
SELECT energy_wh * 3600 / NULLIF(duration_s, 0) AS power_w
FROM power_log;
```

Where `duration_s` is 0, `NULLIF(duration_s, 0)` is NULL, so the division gives NULL instead of `ERROR: division by zero`. The glitched rows show as unknown, which is honest, and any later `AVG(power_w)` skips them. Check the units: watt-hours times 3600 seconds per hour gives joules, and joules per second is watts.
:::

## Summary

| Idea | In one line |
| --- | --- |
| NULL | the marker for "no value known"; not 0, not `''` |
| Propagation | `NULL + 1`, `'x' \|\| NULL` and `NULL * 0` are all NULL |
| Three-valued logic | comparisons give TRUE, FALSE or UNKNOWN; `NULL = NULL` is UNKNOWN |
| WHERE | keeps only TRUE rows; UNKNOWN rows vanish silently |
| The = NULL trap | `= NULL` and `<> NULL` return nothing; use `IS NULL`, `IS NOT NULL` |
| NULL-safe compare | `a IS DISTINCT FROM b` treats NULL as an ordinary value |
| NOT IN | one NULL in the list or subquery makes it never TRUE; use `NOT EXISTS` |
| Sorting | PostgreSQL puts NULLs last ascending, SQLite first; say `NULLS FIRST/LAST` |
| Aggregates | `AVG(col)` and `COUNT(col)` skip NULL; `COUNT(*)` counts rows |
| COALESCE(a, b, …) | first non-NULL argument; fine for labels, dangerous for measurements |
| NULLIF(a, b) | NULL if `a = b`, else `a`; sentinels to NULL, `x / NULLIF(y, 0)` |

Next lesson asks what kind of value a column holds in the first place — whole numbers, exact decimals or floating point — and why the long digits in this lesson's average are a warning about timestamps and money. It also teaches `CAST`, the third tool of this set.

::: context codd-nulls One NULL, several meanings
E. F. Codd, the IBM researcher who invented the relational model in 1970, later argued that databases should have two kinds of missing value: "applicable but unknown" (the battery has a charge; we did not receive it) and "inapplicable" (a satellite with no battery has no charge at all). SQL ended up with only one NULL for both.

That is why good schemas document what NULL means in each column. In a telemetry table it should mean one thing — "no sample received" — and anything else, like "sensor not fitted", belongs in a column of its own.
:::

::: context propagation One unknown poisons the whole calculation
Think of a recipe card with one smudged number. If the smudge covers "grams of flour", you cannot know the total weight of the dough, the number of loaves, or the calories per slice. Everything computed from the smudge is smudged too.

That is the logic behind NULL propagation, and it is the safe choice. A calculation that quietly treated the unknown as zero would print a confident, wrong number. A NULL at the output tells you, "go and look at the input".

String concatenation is one place the databases disagree: Oracle treats the empty string as NULL, so `'x' || NULL` there gives `'x'`. PostgreSQL and SQLite give NULL.
:::

::: context truth-table The three-valued truth table as a picture
Put the three truth values on a line from FALSE through UNKNOWN to TRUE. Then `AND` picks the *lower* of its two inputs, `OR` picks the *higher*, and `NOT` flips the line end for end, which leaves UNKNOWN where it was.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="50" x2="320" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="60" cy="50" r="8" fill="#b4232c"/>
  <circle cx="180" cy="50" r="8" fill="#6c7a93"/>
  <circle cx="300" cy="50" r="8" fill="#1d6fd1"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="28">FALSE</text><text x="180" y="28">UNKNOWN</text><text x="300" y="28">TRUE</text>
  </g>
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="92">AND = the lower:  TRUE AND UNKNOWN → UNKNOWN</text>
    <text x="20" y="114">OR = the higher:  FALSE OR UNKNOWN → UNKNOWN</text>
    <text x="20" y="136">NOT = flip:  NOT UNKNOWN → UNKNOWN</text>
  </g>
</svg>
```

Check it against the table in the lesson: FALSE AND UNKNOWN is the lower of the two, FALSE; TRUE OR UNKNOWN is the higher, TRUE.
:::

::: context not-in-picture Why one NULL empties NOT IN
`NOT IN` checks the value against every item in the list and needs every check to be TRUE. One UNKNOWN in the chain, and the whole chain can no longer be TRUE.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="20" font-size="12" fill="#1f2a44">'SAT-001' NOT IN ('SAT-002', 'SAT-004', NULL)</text>
  <rect x="20" y="36" width="96" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="68" y="55" font-size="11" fill="#1f2a44" text-anchor="middle">≠ 'SAT-002'</text>
  <rect x="132" y="36" width="96" height="30" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="180" y="55" font-size="11" fill="#1f2a44" text-anchor="middle">≠ 'SAT-004'</text>
  <rect x="244" y="36" width="96" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="292" y="55" font-size="11" fill="#1f2a44" text-anchor="middle">≠ NULL</text>
  <g font-size="12" text-anchor="middle">
    <text x="68" y="84" fill="#1d6fd1">TRUE</text>
    <text x="124" y="84" fill="#1f2a44">AND</text>
    <text x="180" y="84" fill="#1d6fd1">TRUE</text>
    <text x="236" y="84" fill="#1f2a44">AND</text>
    <text x="292" y="84" fill="#6c7a93">UNKNOWN</text>
  </g>
  <text x="180" y="116" font-size="12" fill="#b4232c" text-anchor="middle">= UNKNOWN, so WHERE drops the row</text>
</svg>
```

`IN` is the mirror image: it needs only *one* TRUE, so `'SAT-002' IN ('SAT-002', NULL)` is still TRUE. The trap is specific to the NOT.
:::

::: context coalesce-word Growing together
"Coalesce" comes from the Latin *coalescere*, "to grow together". Drops of water on a window coalesce into one larger drop. In SQL, COALESCE takes several possible sources for a value and merges them into one answer, taking the first that is there.

A common, legitimate use in fleet data is a priority list: `COALESCE(onboard_estimate, ground_estimate, predicted)` uses the best source available for each row. It is fine as long as a column somewhere records *which* source was used.
:::

::: context sentinel Sentinels in the wild
A **sentinel** is a guard standing watch; in computing, it is a special value standing in for "nothing real here". You will meet them constantly in flight and science data: `-999`, `-9999`, `9.96921e36` (the default fill value in the NetCDF files used for weather and Earth-observation data), `0xFFFF` in a 16-bit telemetry field, or a date of 1970-01-01.

They exist because many file formats and older systems have no NULL. The first job when loading such data into a database is to find every sentinel and turn it into NULL, usually with NULLIF, before anyone computes an average.
:::
