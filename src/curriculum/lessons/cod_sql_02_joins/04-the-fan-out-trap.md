---
id: l04-the-fan-out-trap
title: The fan-out trap
minutes: 25
covers:
  - Join cardinality reasoning and the fan-out trap when aggregating after a one-to-many join
---

Here is a story that happens on every data team, sooner or later. A report of propellant used per satellite has been right for months. Someone is asked to add one more column — the number of temperature samples each satellite sent — and adds a join to the reading table to get it. The new column looks fine. Nobody notices that the propellant column has tripled for one satellite and doubled for another. A week later, a [[flight dynamics|flight-dynamics]] engineer asks why Aurora apparently burned [[three times its budget|propellant-bookkeeping]].

No error was raised. Every number in the new report came from real data. The query is adding up rows that the join had copied. This is the **[[fan-out trap|three-table]]**, and it is the most expensive silent bug in SQL analytics: wrong totals, looking completely plausible, feeding decisions about fuel, power and data budgets.

Lesson 02 gave you the counting rule for joins, and lesson 03 gave you the aggregates. This lesson puts them together. You will see the wrong SUM, work out exactly why it is wrong and by how much, learn the rule for which sums survive a join, and learn two fixes that work — plus two popular patches that do not.

## The report that grew

The `burn` table from lesson 02 logs thruster firings, one row per burn:

```text
 burn_id | sat_id  |          ts          | propellant_kg
---------+---------+----------------------+---------------
       1 | SAT-001 | 2026-03-01T03:00:00Z |           1.2
       2 | SAT-001 | 2026-03-02T03:00:00Z |           1.2
       3 | SAT-002 | 2026-03-01T09:00:00Z |           1.5
```

Aurora made two identical [[station-keeping|station-keeping]] burns of 1.2 kg each. Borealis made one of 1.5 kg. So the true figures are 2.4 kg for Aurora and 1.5 kg for Borealis, 3.9 kg for the fleet. Write those down; they are what every query in this lesson is checked against.

The original report was right:

```sql
SELECT s.name, SUM(b.propellant_kg) AS prop_kg
FROM satellite AS s
JOIN burn AS b ON b.sat_id = s.sat_id
GROUP BY s.name
ORDER BY s.name;
```

```text
   name   | prop_kg
----------+---------
 Aurora   |     2.4
 Borealis |     1.5
(2 rows)
```

::: example The wrong SUM
**The change.** To add a count of bus-temperature samples, a third table is joined in:

```sql
SELECT s.name,
       SUM(b.propellant_kg) AS prop_kg,
       COUNT(r.value)       AS n_temp
FROM satellite AS s
JOIN burn    AS b ON b.sat_id = s.sat_id
JOIN reading AS r ON r.sat_id = s.sat_id
GROUP BY s.name
ORDER BY s.name;
```

```text
   name   | prop_kg | n_temp
----------+---------+--------
 Aurora   |     7.2 |      6
 Borealis |       3 |      2
(2 rows)
```

(SQLite prints Aurora's figure as `7.199999999999999` — the floating-point rounding from the last module's lesson on data types.)

**Compare with the truth.** Aurora's propellant should be 2.4 kg and shows 7.2: three times too big. Borealis's should be 1.5 and shows 3.0: twice too big. And the new column is wrong too: Aurora sent 3 temperature samples, not 6. Only Borealis's count of 2 happens to be right. Cirrus has vanished altogether, because it has no burns and these are inner joins.

**Look at the rows before grouping.** Take out the GROUP BY and the aggregates, and show what the joins made:

```sql
SELECT s.name, b.burn_id, b.propellant_kg, r.ts
FROM satellite AS s
JOIN burn    AS b ON b.sat_id = s.sat_id
JOIN reading AS r ON r.sat_id = s.sat_id
ORDER BY s.name, b.burn_id, r.ts;
```

```text
   name   | burn_id | propellant_kg |          ts
----------+---------+---------------+----------------------
 Aurora   |       1 |           1.2 | 2026-03-01T00:00:00Z
 Aurora   |       1 |           1.2 | 2026-03-01T06:00:00Z
 Aurora   |       1 |           1.2 | 2026-03-02T01:00:00Z
 Aurora   |       2 |           1.2 | 2026-03-01T00:00:00Z
 Aurora   |       2 |           1.2 | 2026-03-01T06:00:00Z
 Aurora   |       2 |           1.2 | 2026-03-02T01:00:00Z
 Borealis |       3 |           1.5 | 2026-03-01T00:00:00Z
 Borealis |       3 |           1.5 | 2026-03-01T12:00:00Z
(8 rows)
```

Every one of Aurora's 2 burns is paired with every one of its 3 readings: $2 \times 3 = 6$ rows. Each burn appears 3 times, so its propellant is added 3 times. Each reading appears 2 times, so it is counted twice.

**Check the arithmetic.** Aurora: $3 \times (1.2 + 1.2) = 3 \times 2.4 = 7.2$. Borealis: its one burn appears once per reading, $2 \times 1.5 = 3.0$. The counts: Aurora $2 \times 3 = 6$, Borealis $1 \times 2 = 2$. Every wrong number is explained.
:::

That is the whole mechanism. Once you have seen the rows, the wrong totals are not mysterious at all. The hard part is that nobody looks at the rows — they look at the totals, which seem reasonable.

## Why it happens, in one rule

Recall lesson 02's counting rule. For each key value $k$, an inner join produces $n_A(k) \times n_B(k)$ rows. Now follow one row of B through it. It is paired with every A row that has the same key, so it appears $n_A(k)$ times in the output.

So when you sum a column of B after the join, each B value is added $n_A(k)$ times:

$$
\text{joined SUM for key } k = n_A(k) \times \text{true SUM for key } k
$$

For Aurora, $n_\text{reading} = 3$ and the true propellant sum is 2.4, so the joined sum is $3 \times 2.4 = 7.2$. The **multiplier** — how many times each row is repeated — is the number of matching rows on the *other* side.

That gives the rule for which aggregates you can trust after a join:

- A column's SUM or COUNT is right **only if every row of its table appears exactly once** in the joined result. That is true when everything joined to it is on the "one" side: each of its rows matches at most one row of each other table.
- Summing the **many** side of a single one-to-many join is safe. Each burn matches exactly one satellite, so `satellite JOIN burn` repeats satellites but never burns. That is why the original report was right.
- Summing the **one** side of a one-to-many join is inflated. The satellite's (or day's) row is repeated once per matching row on the many side.
- Joining **two independent many sides** to the same parent — burns and readings both hanging off `satellite` — makes each of them repeat once per row of the other. Both sides' sums and counts are inflated.

::: key What is join fan-out?
Joining one row to many duplicates the one side, so a later SUM counts it once per match. Aggregate the many side first in a CTE, then join, or aggregate with a DISTINCT-safe expression. Adding DISTINCT afterwards does not repair the sum.
:::

::: warning MIN, MAX and AVG can hide the problem
Duplicates do not change a minimum or a maximum, so `MIN` and `MAX` survive fan-out. `AVG` survives only by luck: if every row in a group is repeated the same number of times, the average comes out unchanged. In the example, Aurora's mean temperature over the 6 joined rows is still $148 / 6 \approx 24.67$, the true mean, because each reading appears exactly twice. Group by something coarser — the orbital plane, say, with satellites that have different numbers of burns — and the repetition is uneven, and the average silently becomes a weighted one. Do not use "the averages looked right" as evidence the join is safe.
:::

## A one-to-many join with the one side summed

The three-table report is the classic case. Here is the plainer one, where there are only two tables, the key is right, and the SUM is still wrong.

::: example Downlink volume against temperature
**Question.** For each satellite, how many megabytes did it downlink, and what was its mean bus temperature, over the days in `daily_downlink`?

`daily_downlink` has one row per satellite per day (key `(sat_id, day)`):

```text
 sat_id  |    day     | mb
---------+------------+-----
 SAT-001 | 2026-03-01 | 120
 SAT-001 | 2026-03-02 |  90
 SAT-002 | 2026-03-01 | 150
```

The true totals: Aurora $120 + 90 = 210$ MB, Borealis 150 MB.

**The tempting query** joins each reading to its satellite-day, using the full key:

```sql
SELECT d.sat_id,
       SUM(d.mb)    AS mb,
       AVG(r.value) AS mean_temp
FROM daily_downlink AS d
JOIN reading AS r
  ON r.sat_id = d.sat_id AND substr(r.ts, 1, 10) = d.day
GROUP BY d.sat_id
ORDER BY d.sat_id;
```

```text
 sat_id  | mb  |     mean_temp
---------+-----+--------------------
 SAT-001 | 330 | 24.666666666666668
 SAT-002 | 300 |                 20
(2 rows)
```

**Diagnose.** The mean temperatures are right. The megabytes are not: 330 instead of 210, and 300 instead of 150. The join is [[one-to-many|one-side-picture]] — one satellite-day, many readings in that day — and the SUM is on the one side. Aurora's 1 March row (120 MB) matched 2 readings, and its 2 March row (90 MB) matched 1:

$$
2 \times 120 + 1 \times 90 = 240 + 90 = 330.
$$

Borealis's single day matched 2 readings: $2 \times 150 = 300$.

**Notice** that the multiplier differs from day to day (2 on 1 March, 1 on 2 March). There is no single number you could divide by to undo it. Fan-out does not always multiply by a neat factor, which is why "divide by the count" patches go wrong.
:::

## Fix 1: aggregate before you join

The cure for almost every fan-out is to **reduce each many side to one row per key before joining**. Then every join is one-to-one or many-to-one, and nothing is repeated.

Doing that needs a query whose result is used as a table. SQL lets you put a whole query in parentheses in FROM, give it a name, and join to it like any table. That is called a **[[derived table|derived-table]]** (a kind of subquery; lesson 07 covers them all):

```sql
SELECT s.name,
       COALESCE(b.prop_kg, 0) AS prop_kg,
       COALESCE(r.n_temp, 0)  AS n_temp
FROM satellite AS s
LEFT JOIN (SELECT sat_id, SUM(propellant_kg) AS prop_kg
           FROM burn
           GROUP BY sat_id) AS b
       ON b.sat_id = s.sat_id
LEFT JOIN (SELECT sat_id, COUNT(*) AS n_temp
           FROM reading
           WHERE channel = 'BUS_TEMP'
           GROUP BY sat_id) AS r
       ON r.sat_id = s.sat_id
ORDER BY s.name;
```

```text
   name   | prop_kg | n_temp
----------+---------+--------
 Aurora   |     2.4 |      3
 Borealis |     1.5 |      2
 Cirrus   |       0 |      1
 Dorado   |       0 |      0
(4 rows)
```

Every number is right, and every satellite is present. Walk through why:

- The first derived table, `b`, has one row per satellite that burned: SAT-001 with 2.4 and SAT-002 with 1.5. Its key is `sat_id`.
- The second, `r`, has one row per satellite that reported: 3, 2 and 1.
- Each is joined to `satellite` on `sat_id`, which is unique on *both* sides now. One-to-one: no row can repeat.
- The joins are LEFT joins, so satellites with no burns or no readings stay, with NULLs that `COALESCE` turns into honest zeros (lesson 03: the sum of nothing is NULL).

The same query reads more easily with a **[[common table expression|cte-bridge]]**, or **CTE**: a named query written up front with `WITH`, then used by name below. Lesson 09 teaches CTEs properly; here is the shape, and it works the same in PostgreSQL and SQLite:

```sql
WITH burn_per_sat AS (
    SELECT sat_id, SUM(propellant_kg) AS prop_kg
    FROM burn
    GROUP BY sat_id
),
temp_per_sat AS (
    SELECT sat_id, COUNT(*) AS n_temp
    FROM reading
    WHERE channel = 'BUS_TEMP'
    GROUP BY sat_id
)
SELECT s.name,
       COALESCE(b.prop_kg, 0) AS prop_kg,
       COALESCE(t.n_temp, 0)  AS n_temp
FROM satellite AS s
LEFT JOIN burn_per_sat AS b ON b.sat_id = s.sat_id
LEFT JOIN temp_per_sat AS t ON t.sat_id = s.sat_id
ORDER BY s.name;
```

It returns the same four rows. Each step has a name that says what it holds — "burns per satellite", "temperature samples per satellite" — and each can be run and checked on its own.

::: example Fixing the downlink report
Apply the same idea to the downlink example. The many side is `reading`, so summarise it to one row per satellite-day first. Then the join to `daily_downlink` is one-to-one on `(sat_id, day)`:

```sql
WITH temp_per_day AS (
    SELECT sat_id, substr(ts, 1, 10) AS day,
           SUM(value) AS sum_temp, COUNT(value) AS n_temp
    FROM reading
    GROUP BY sat_id, substr(ts, 1, 10)
)
SELECT d.sat_id,
       SUM(d.mb) AS mb,
       SUM(t.sum_temp) / SUM(t.n_temp) AS mean_temp
FROM daily_downlink AS d
JOIN temp_per_day AS t ON t.sat_id = d.sat_id AND t.day = d.day
GROUP BY d.sat_id
ORDER BY d.sat_id;
```

```text
 sat_id  | mb  |     mean_temp
---------+-----+--------------------
 SAT-001 | 210 | 24.666666666666668
 SAT-002 | 150 |                 20
(2 rows)
```

**Why carry the [[sum and the count|mean-of-means]], not the mean?** Aurora's two days have means of 22 (from 20 and 24) and 30 (one reading). Averaging those two means gives $(22 + 30) / 2 = 26$, which weights 2 March's single reading as heavily as 1 March's two. Adding the sums and the counts gives $(44 + 30) / (2 + 1) = 74 / 3 \approx 24.67$, the true mean of all three readings.

**Check.** 210 and 150 MB are the true totals; 24.67 °C and 20 °C match lesson 03's per-satellite means.
:::

::: key Aggregate before joining
Reduce each many-side table to one row per join key (with GROUP BY, in a derived table or a CTE), then join. Every join is then one-to-one or many-to-one, so no row is repeated and every SUM and COUNT is correct. Use LEFT JOIN and `COALESCE(…, 0)` to keep parents with no children.
:::

## Fix 2: join on the correct key

Sometimes the fan-out is not a feature of the question at all. It comes from a join condition that names **too little of the key**, like lesson 02's half-key join. Then the fix is to join on the whole key, and the relationship goes back to one-to-one.

::: example Downlink and power, per satellite
**Question.** For each satellite, total megabytes downlinked and total solar energy collected. `daily_downlink` and `daily_power` both have one row per `(sat_id, day)`. True totals: Aurora 210 MB and $410 + 380 = 790$ Wh; Borealis 150 MB and 395 Wh.

**Wrong key:**

```sql
SELECT d.sat_id, SUM(d.mb) AS mb, SUM(p.energy_wh) AS wh
FROM daily_downlink AS d
JOIN daily_power AS p ON p.sat_id = d.sat_id
GROUP BY d.sat_id
ORDER BY d.sat_id;
```

```text
 sat_id  | mb  |  wh
---------+-----+------
 SAT-001 | 420 | 1580
 SAT-002 | 150 |  395
(2 rows)
```

Aurora is exactly doubled. On `sat_id` alone, each of Aurora's 2 downlink days pairs with each of its 2 power days — $2 \times 2 = 4$ rows — so each value is added twice: $2 \times 210 = 420$ and $2 \times 790 = 1580$. Borealis has one day in each table, so its multiplier is 1 and its numbers look right, which is what makes this bug so easy to miss in testing.

**Right key:**

```sql
SELECT d.sat_id, SUM(d.mb) AS mb, SUM(p.energy_wh) AS wh
FROM daily_downlink AS d
JOIN daily_power AS p ON p.sat_id = d.sat_id AND p.day = d.day
GROUP BY d.sat_id
ORDER BY d.sat_id;
```

```text
 sat_id  | mb  | wh
---------+-----+-----
 SAT-001 | 210 | 790
 SAT-002 | 150 | 395
(2 rows)
```

**Check.** With the whole key, each day's downlink row meets only the same day's power row: 3 joined rows, one per satellite-day, no repeats. Both columns now match their true totals.
:::

This fix has a limit. It works because both tables really are one row per satellite-day, and here both tables hold the same three days. If `daily_power` were missing a day that `daily_downlink` had, the inner join would drop that day's megabytes, and the total would be too *small*. When the two sides might not cover the same keys, use a FULL OUTER JOIN on the whole key, or fall back on Fix 1 and aggregate each table per satellite before joining.

And the correct key cannot fix a join that is one-to-many by nature. In the downlink-and-temperature example, the key `(sat_id, day)` was already complete; a day really does have many readings. There, only aggregating first helps.

## Patches that look like fixes

Two quick patches get suggested every time this bug turns up. One does nothing; the other is right only by accident.

**`SELECT DISTINCT` on the result.** DISTINCT runs after the aggregates (station 6 in the logical order), so it can only remove duplicate *output rows*. The sums were computed from the fanned-out rows before it ever ran:

```sql
SELECT DISTINCT s.name, SUM(b.propellant_kg) AS prop_kg, COUNT(r.value) AS n_temp
FROM satellite AS s
JOIN burn    AS b ON b.sat_id = s.sat_id
JOIN reading AS r ON r.sat_id = s.sat_id
GROUP BY s.name
ORDER BY s.name;
```

```text
   name   | prop_kg | n_temp
----------+---------+--------
 Aurora   |     7.2 |      6
 Borealis |       3 |      2
(2 rows)
```

Exactly the same wrong numbers. As the last module's lesson on DISTINCT warned, it hides duplicates you can see and leaves the damage you cannot.

**`SUM(DISTINCT …)`.** This adds each *different value* once. It is tempting because it removes the repeats of a burn. But it also removes a second burn that happens to have the same size:

```sql
SELECT s.name,
       SUM(DISTINCT b.propellant_kg) AS prop_kg,
       COUNT(DISTINCT b.burn_id)     AS n_burns
FROM satellite AS s
JOIN burn    AS b ON b.sat_id = s.sat_id
JOIN reading AS r ON r.sat_id = s.sat_id
GROUP BY s.name
ORDER BY s.name;
```

```text
   name   | prop_kg | n_burns
----------+---------+---------
 Aurora   |     1.2 |       2
 Borealis |     1.5 |       1
(2 rows)
```

Aurora's two 1.2 kg burns collapse into one, and the total comes out 1.2 instead of 2.4 — now too *small*. Identical station-keeping burns are normal, so this is not a rare case.

Look at the other column, though. `COUNT(DISTINCT b.burn_id)` is right: 2 and 1. That is what the card means by a **DISTINCT-safe expression**. DISTINCT removes repeats of a *value*, so it undoes fan-out exactly when each real row has its own value — when you are counting distinct **keys**. `burn_id` is the primary key of `burn`, so "different burn ids" means "different burns". Propellant masses are not a key, so "different masses" does not mean "different burns".

::: key DISTINCT and fan-out
`SELECT DISTINCT` after grouping does not change a sum computed from fanned-out rows. `SUM(DISTINCT x)` merges different rows that share a value, so it is wrong whenever two real rows can have equal `x`. `COUNT(DISTINCT key)` is safe, because a key's values are different for different rows by definition.
:::

## Catching fan-out before anyone else does

The bug is silent, so you need habits that make it loud. Four cheap ones:

1. **Predict the multiplier.** Before writing a SUM after a join, ask of the summed column's table: "can one of its rows match more than one row of anything else in this FROM?" If yes, its sum will be multiplied.
2. **[[Reconcile|reconcile]] against one table.** A total over the joined result should equal the same total over the source table alone. `SELECT SUM(propellant_kg) FROM burn` gives 3.9. The broken three-table join gives $7.2 + 3.0 = 10.2$. The mismatch is visible in one line.
3. **Count rows before and after.** If the joined row count is larger than the table you are summing, some of its rows were repeated. For Aurora, 2 burns became 6 rows.
4. **Look at the rows.** Remove the GROUP BY for one key and read what the join made, as in the first example. Thirty seconds of looking beats a week of wrong reports.

::: warning Tests with tidy data miss fan-out
In both wrong-key examples, Borealis had exactly one row on each side, so its multiplier was 1 and its numbers were right. Test data with one row per key cannot show fan-out. When you test a join, make sure at least one key has several rows on each side.
:::

## Check yourself

::: check
A table `pass` has one row per ground-station pass, with a `sat_id`. Aurora has 4 passes this week and 2 burns. What does `SUM(b.propellant_kg)` give for Aurora in `satellite JOIN burn ON … JOIN pass ON …`, if its burns were 1.2 kg and 1.2 kg? What does `COUNT(*)` give?
:::

::: answer
Each burn is paired with each of Aurora's 4 passes, so every burn appears 4 times. The joined sum is $4 \times (1.2 + 1.2) = 4 \times 2.4 = 9.6$ kg instead of 2.4 kg.

`COUNT(*)` counts joined rows: $2 \times 4 = 8$. It is neither the number of burns (2) nor the number of passes (4).
:::

::: check
Is `SUM(b.propellant_kg)` correct in this query? Explain using the rule from this lesson.

```sql
SELECT s.plane, SUM(b.propellant_kg)
FROM burn AS b
JOIN satellite AS s ON s.sat_id = b.sat_id
GROUP BY s.plane;
```
:::

::: answer
Yes. The summed column comes from `burn`. Each burn joins on `sat_id`, which is the primary key of `satellite`, so each burn matches exactly one satellite and appears exactly once in the result. The satellites are repeated (Aurora twice), but nothing from `satellite` is being summed.

On the data it gives plane 1 with $2.4 + 1.5 = 3.9$ kg, matching `SELECT SUM(propellant_kg) FROM burn`. Plane 2 does not appear, because neither of its satellites burned.
:::

::: check
A colleague "fixes" the three-table report by dividing: `SUM(b.propellant_kg) / COUNT(DISTINCT r.ts)`. On this data, is Aurora's answer right? Why is the idea fragile anyway?
:::

::: answer
Aurora's readings have 3 different timestamps, so the result is $7.2 / 3 = 2.4$ — right, this time.

It is fragile because it assumes every burn was multiplied by the same number, and that the number equals the count of distinct timestamps. Two readings of different channels at the same instant share a `ts`, so the divisor would be too small. Group by something coarser, like the plane, and each satellite has its own multiplier, so no single divisor exists. And if a satellite has burns but no readings, the inner join drops it entirely. Aggregating each table per satellite first has none of these problems.
:::

::: check
Write the query that reports, per satellite, the number of burns and the number of bus-temperature readings, correctly, including satellites with neither.
:::

::: answer
Aggregate each many side first, then left-join both summaries to `satellite`:

```sql
WITH burns AS (
    SELECT sat_id, COUNT(*) AS n_burns FROM burn GROUP BY sat_id
),
temps AS (
    SELECT sat_id, COUNT(*) AS n_temp FROM reading
    WHERE channel = 'BUS_TEMP' GROUP BY sat_id
)
SELECT s.name,
       COALESCE(b.n_burns, 0) AS n_burns,
       COALESCE(t.n_temp, 0)  AS n_temp
FROM satellite AS s
LEFT JOIN burns AS b ON b.sat_id = s.sat_id
LEFT JOIN temps AS t ON t.sat_id = s.sat_id
ORDER BY s.name;
```

Aurora 2 and 3, Borealis 1 and 2, Cirrus 0 and 1, Dorado 0 and 0.

(An alternative that also works here is `COUNT(DISTINCT b.burn_id)` and a distinct count of readings over the fanned-out join. But `reading` has no single-column key — you would need to count distinct `(ts, channel)` pairs — and you would still need left joins to keep Cirrus and Dorado. Aggregating first is simpler to get right.)
:::

::: check
A fleet summary joins `satellite` to a per-satellite table `config` and sums `config.battery_wh` per plane. The totals were right last month and are too high this month. `config` had no primary key. What would you check first, and what probably happened?
:::

::: answer
Check whether `config` is still one row per satellite:

```sql
SELECT sat_id, COUNT(*) FROM config GROUP BY sat_id HAVING COUNT(*) > 1;
```

Most likely someone added a second row for some satellite — a new configuration version, say, without removing the old one. With no primary key nothing stopped it. The join is now one-to-many for that satellite, and its battery capacity is summed twice. The lasting fix is to decide what one row means (the current configuration only, or one row per version with a date) and enforce it with a key; the query then joins on the full key or filters to the current version.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Fan-out | a row appears once per matching row on the other side of a join |
| Multiplier | joined SUM for key $k$ $= n_\text{other}(k) \times$ true SUM for key $k$ |
| Safe to sum | a column whose rows each appear once — everything joined to it is a "one" side |
| Inflated | the one side of a one-to-many join; both sides when two many-tables share a parent |
| MIN, MAX, AVG | MIN and MAX ignore duplicates; AVG survives only if every row is repeated equally |
| Fix 1 | aggregate each many side to one row per key (derived table or CTE), then join |
| Fix 2 | join on the whole key, so one-to-one stays one-to-one |
| Not fixes | `SELECT DISTINCT` afterwards; `SUM(DISTINCT x)` |
| DISTINCT-safe | `COUNT(DISTINCT key)` — distinct keys are distinct rows |
| Catch it | predict the multiplier, reconcile with a single-table total, count rows, look at rows |

Every fix in this lesson aggregated one table at a time with the five basic aggregates. Next lesson widens the toolkit: aggregates that build lists and percentiles, and `FILTER (WHERE …)`, which lets one pass over the data compute several conditional counts side by side.

::: context flight-dynamics Who asks about propellant
On a spacecraft operations team, **flight dynamics** is the group that works out where each satellite is (orbit determination), predicts where it will be, and plans the burns that keep it where it should be. They own the propellant budget: how much each satellite has left and how long that lets it stay in service. A report that triples a satellite's propellant use lands on their desk as an apparent emergency.
:::

::: context propellant-bookkeeping Counting fuel you cannot see
In weightlessness, propellant does not sit at the bottom of the tank, so there is no simple fuel gauge. One standard method is **bookkeeping**: start from the mass loaded before launch and subtract the estimated mass used in every burn, from how long each thruster fired. Another infers the remaining mass from the pressure and temperature of the tank. Bookkeeping is a running SUM over a table of burns — exactly the column this lesson's bug inflates.
:::

::: context three-table Two many sides on one parent
Burns and readings both hang off the satellite. Joining both to it pairs every burn with every reading of that satellite, so each burn is repeated once per reading and each reading once per burn.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="50" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">burn</text>
  <text x="180" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">satellite</text>
  <text x="310" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">reading</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="10" y="44" width="80" height="24" fill="#f2b880"/>
    <rect x="10" y="84" width="80" height="24" fill="#f2b880"/>
    <rect x="140" y="64" width="80" height="24" fill="#ffffff"/>
    <rect x="270" y="30" width="80" height="24" fill="#8fb8f0"/>
    <rect x="270" y="64" width="80" height="24" fill="#8fb8f0"/>
    <rect x="270" y="98" width="80" height="24" fill="#8fb8f0"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="60">burn 1 · 1.2</text><text x="50" y="100">burn 2 · 1.2</text>
    <text x="180" y="80">Aurora</text>
    <text x="310" y="46">20 °C</text><text x="310" y="80">24 °C</text><text x="310" y="114">30 °C</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="90" y1="56" x2="140" y2="76"/><line x1="90" y1="96" x2="140" y2="76"/>
    <line x1="220" y1="76" x2="270" y2="42"/><line x1="220" y1="76" x2="270" y2="76"/><line x1="220" y1="76" x2="270" y2="110"/>
  </g>
  <text x="180" y="142" font-size="12" fill="#b4232c" text-anchor="middle">2 × 3 = 6 rows: each burn ×3, each reading ×2</text>
</svg>
```
:::

::: context station-keeping Burns that hold a satellite in place
Even at 500 km there is a trace of atmosphere, and its drag slowly lowers a satellite's orbit. Other nudges come from Earth's uneven gravity and from the Sun and Moon. **Station-keeping** burns are small, regular thruster firings that undo that drift and keep the satellite in its assigned slot. Because they correct the same drift over and over, consecutive burns are often nearly identical in size — which is why two burns with exactly equal propellant masses are ordinary, not a coincidence.
:::

::: context one-side-picture One day's row, copied per reading
Aurora's 1 March row in `daily_downlink` matches two readings, so the join writes it out twice, and SUM adds its 120 MB twice.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="70" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">daily_downlink</text>
  <text x="260" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">joined rows</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="10" y="44" width="120" height="26" fill="#f2b880"/>
    <rect x="180" y="28" width="160" height="24" fill="#f2b880"/>
    <rect x="180" y="62" width="160" height="24" fill="#f2b880"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="70" y="61">1 Mar · 120 MB</text>
    <text x="260" y="44">120 MB · 00:00 · 20 °C</text>
    <text x="260" y="78">120 MB · 06:00 · 24 °C</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="130" y1="57" x2="180" y2="40"/><line x1="130" y1="57" x2="180" y2="74"/>
  </g>
  <text x="260" y="110" font-size="12" fill="#b4232c" text-anchor="middle">SUM(mb) = 240, true 120</text>
</svg>
```
:::

::: context derived-table A query standing in for a table
A derived table is any query in parentheses in FROM. Its output columns become the columns of a temporary, unnamed table, and the name after `AS` is how the rest of the query refers to it. SQL's standard and older PostgreSQL versions require that name; PostgreSQL 16 and SQLite let you leave it off, but giving one is clearer and keeps the query portable. Nothing is stored — the database may even fold the subquery into the outer query when it plans it.
:::

::: context cte-bridge Why named steps help here
A CTE is the same idea as a derived table, moved to the top and given a name. For fan-out that matters, because the fix is "summarise each table on its own, then join", and a CTE writes that as a list of named steps. You can run each step alone and check its row count is one per key before trusting the join. Lesson 09 covers CTEs in full, including chaining one step into the next.
:::

::: context mean-of-means Averaging averages
The mean of all three readings is where their total balances. The mean of the two daily means gives 2 March's single reading as much say as 1 March's two, so it lands too high.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="328" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="20" y1="64" x2="20" y2="76"/><line x1="328" y1="64" x2="328" y2="76"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="20" y="92">18 °C</text><text x="328" y="92">32 °C</text>
  </g>
  <g fill="#1f2a44">
    <circle cx="64" cy="70" r="5"/><circle cx="152" cy="70" r="5"/><circle cx="284" cy="70" r="5"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="64" y="56">20</text><text x="140" y="56">24</text><text x="284" y="56">30</text>
  </g>
  <line x1="166.7" y1="36" x2="166.7" y2="70" stroke="#1d6fd1" stroke-width="2"/>
  <text x="166.7" y="28" font-size="11" fill="#1d6fd1" text-anchor="middle">true mean 24.67</text>
  <line x1="196" y1="70" x2="196" y2="104" stroke="#b4232c" stroke-width="2"/>
  <text x="196" y="120" font-size="11" fill="#b4232c" text-anchor="middle">mean of daily means 26</text>
</svg>
```
:::

::: context reconcile Totals that must agree
Accountants call it footing and cross-footing: add a ledger two different ways, and if the totals disagree, something is wrong even before you know what. Data teams borrow the same idea as **control totals**. After any transformation, a quantity that should be conserved — total propellant, total samples, total megabytes — is recomputed from the source and compared. A join that fans out breaks conservation immediately, so this one comparison catches most fan-out bugs.
:::
