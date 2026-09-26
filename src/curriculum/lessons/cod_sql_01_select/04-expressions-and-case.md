---
id: l04-expressions-and-case
title: Computed columns and CASE WHEN
minutes: 21
covers:
  - Expressions and CASE WHEN
---

So far every column in your results has been a column that was already in the table. You asked for `sat_id` and `value`, and the database handed them back, filtered and sorted. That is useful, but it is only half of what an analyst does. The other half is *working things out* from what is stored.

A battery sensor stores a voltage and a current. Nobody stores the power, because power is voltage times current and the database can work it out. A temperature sensor reports degrees Celsius, but the thermal model wants kelvin. And the flight controller on console does not want to read a column of numbers like `0.19`, `0.42`, `0.94` at all. She wants a word: CRITICAL, LOW, OK.

This lesson teaches both halves. First, **expressions**: little calculations you write inside `SELECT` that produce a new value for every row. Then **CASE WHEN**, the tool that turns a number into a label by checking conditions in order. Together they are how a fleet of thousands of satellites gets boiled down to a screen a person can read in one glance.

## A column can be a calculation

Here is a small table of battery readings, one row per satellite, all taken at the same moment. Each battery reports its voltage in volts, its current in amperes, and its temperature in degrees Celsius. Positive current means the battery is charging; negative means it is discharging.

```sql
SELECT sat_id, voltage_v, current_a, temp_c
FROM battery_reading;
```

```text
 sat_id  | voltage_v | current_a | temp_c
---------+-----------+-----------+--------
 SAT-001 |      28.4 |       3.2 |     18
 SAT-002 |      27.9 |      -1.5 |     -4
 SAT-003 |      29.1 |         4 |   47.5
 SAT-004 |      25.2 |      -2.8 |  -12.5
 SAT-005 |      28.8 |         0 |     22
```

The power flowing into or out of a battery is its voltage times its current. In SQL you write exactly that, right in the `SELECT` list:

```sql
SELECT sat_id,
       voltage_v,
       current_a,
       voltage_v * current_a AS power_w
FROM battery_reading;
```

```text
 sat_id  | voltage_v | current_a | power_w
---------+-----------+-----------+---------
 SAT-001 |      28.4 |       3.2 |   90.88
 SAT-002 |      27.9 |      -1.5 |  -41.85
 SAT-003 |      29.1 |         4 |   116.4
 SAT-004 |      25.2 |      -2.8 |  -70.56
 SAT-005 |      28.8 |         0 |       0
```

Read the new line aloud as "voltage times current, as power W". Three new ideas are packed into it.

An **expression** is any piece of SQL that works out to a value: a column name, a number, or a calculation built from them. `voltage_v * current_a` is an expression. So is `28.4`, and so is `voltage_v` on its own.

A **[[computed column|per-row]]** is a column in your result that comes from an expression instead of straight from the table. The database works it out once for each row, using that row's own values. For SAT-001 it did $28.4 \times 3.2 = 90.88$. For SAT-002 it did $27.9 \times (-1.5) = -41.85$. It never mixes one row's voltage with another row's current.

An **[[alias|alias-name]]** is the name you give a result column with the word `AS`. Without `AS power_w`, PostgreSQL would call the column `?column?`, which is no help to anyone reading the output. Always name your computed columns.

One more thing matters a lot: **the table does not change**. `SELECT` only reads. The computed column exists in your result and nowhere else. Run the query again tomorrow with new readings and the powers are worked out fresh.

::: key
An **expression** is anything that evaluates to a value: a column, a constant, or an arithmetic or function call built from them. An expression in the `SELECT` list is evaluated once per row, using that row's values, and `AS name` gives the resulting column an **alias**. `SELECT` never changes the stored table.
:::

### The arithmetic you can use

SQL has the arithmetic operators you know from school:

| Operator | Read it as | Example | Result |
| --- | --- | --- | --- |
| `+` | plus | `temp_c + 273.15` | kelvin from Celsius |
| `-` | minus | `29.1 - 25.2` | `3.9` |
| `*` | times | `voltage_v * current_a` | power in watts |
| `/` | divided by | `value / 2` | half the value |
| `%` | remainder after dividing (modulo) | `17 % 5` | `2` |

The usual order of operations applies: multiply and divide before add and subtract, and brackets first of all. So `2 + 3 * 4` is `14`, and `(2 + 3) * 4` is `20`. When in doubt, add brackets. They cost nothing and they tell the next reader what you meant.

::: warning Whole numbers divide into whole numbers
In both PostgreSQL and SQLite, dividing one **integer** (a whole number) by another throws away the fraction. `SELECT 7 / 2` gives `3`, not `3.5`. The database is doing **[[integer division|integer-division]]**, the way you did it in elementary school before you learned decimals: 7 divided by 2 is 3 remainder 1. Write `7.0 / 2` and you get `3.5`, because now one side has a decimal point. This bites hardest when you compute a percentage like `good_frames / total_frames`: if both columns are integers, every answer below 100% comes out as `0`. Lesson 06 shows how to fix it properly with `CAST`.
:::

### Text and functions

Expressions are not only about numbers. Two vertical bars, `||`, glue pieces of text together. Read `||` aloud as "concatenate", which means "join end to end".

```sql
SELECT 'SAT' || '-' || '001' AS label;
```

```text
  label
---------
 SAT-001
```

SQL also has **functions**: named operations you call with brackets around their inputs. A few you will use all the time:

- `ABS(x)` is the absolute value, the size without the sign. `ABS(current_a)` gives the current's size whether charging or discharging.
- `UPPER(t)` and `LOWER(t)` change text to capitals or small letters.
- `LENGTH(t)` counts the characters in a piece of text.
- `ROUND(x)` rounds to the nearest whole number.

Functions and operators combine freely. `ABS(voltage_v * current_a)` is the size of the power, in watts, ignoring direction.

::: example Power and temperature, worked out per row
The thermal team wants each battery's power in watts, its size regardless of direction, and its temperature in kelvin (Celsius plus 273.15), sorted from the most power moving to the least.

```sql
SELECT sat_id,
       voltage_v * current_a      AS power_w,
       ABS(voltage_v * current_a) AS power_size_w,
       temp_c + 273.15            AS temp_k
FROM battery_reading
ORDER BY power_size_w DESC;
```

```text
 sat_id  | power_w | power_size_w | temp_k
---------+---------+--------------+--------
 SAT-003 |   116.4 |        116.4 | 320.65
 SAT-001 |   90.88 |        90.88 | 291.15
 SAT-004 |  -70.56 |        70.56 | 260.65
 SAT-002 |  -41.85 |        41.85 | 269.15
 SAT-005 |       0 |            0 | 295.15
```

Step by step, for SAT-004: power is $25.2 \times (-2.8) = -70.56$ W. The minus sign says energy is flowing *out* of the battery. Its size is $70.56$ W. Its temperature is $-12.5 + 273.15 = 260.65$ K.

Sanity checks: every kelvin value is positive, as it must be, since nothing is colder than absolute zero. The two satellites with negative current are exactly the two with negative power. SAT-005 has zero current, so zero power, whatever its voltage. And the `ORDER BY` used the alias `power_size_w`, which is allowed — more on that next.
:::

### Where an alias works, and where it does not

You can sort by an alias, as the example did. But try to *filter* by one and PostgreSQL refuses:

```sql
SELECT sat_id, voltage_v * current_a AS power_w
FROM battery_reading
WHERE power_w < 0;
```

```text
ERROR:  column "power_w" does not exist
LINE 3: WHERE power_w < 0;
              ^
```

The alias is not wrong. It is *early*. Behind the scenes the database handles `WHERE` before it builds the `SELECT` list, so when the filter runs, `power_w` has not been named yet. `ORDER BY` runs after `SELECT`, so the name is ready by then. Lesson 08 walks through the full order a query runs in. For now, when you need to filter on a calculation, write the calculation out again:

```sql
SELECT sat_id, voltage_v * current_a AS power_w
FROM battery_reading
WHERE voltage_v * current_a < 0;
```

```text
 sat_id  | power_w
---------+---------
 SAT-002 |  -41.85
 SAT-004 |  -70.56
```

::: warning SQLite lets you get away with it
[[SQLite is more forgiving|sqlite-alias]] than the standard here: it will quietly accept `WHERE power_w < 0`. Since the exercises in this course run on SQLite, a query that works in the exercise can fail the day you move it to PostgreSQL at work. Write the portable form — repeat the expression in `WHERE` — and it runs everywhere.
:::

## CASE WHEN: turning numbers into words

A spacecraft operator watching a fleet does not want to read a thousand numbers. She wants each reading sorted into a few named states, and the bad ones shouted at her. Doctors call this **[[triage|triage-word]]**: sorting patients by how urgently they need help. For telemetry you need a way to say "if the value is below this, call it that; otherwise, if it is below this other thing, call it something else".

That is **CASE**. Here it is sorting battery temperatures into three states:

```sql
SELECT sat_id,
       temp_c,
       CASE WHEN temp_c < -10 THEN 'COLD'
            WHEN temp_c > 45  THEN 'HOT'
            ELSE 'NOMINAL'
       END AS thermal_state
FROM battery_reading;
```

```text
 sat_id  | temp_c | thermal_state
---------+--------+---------------
 SAT-001 |     18 | NOMINAL
 SAT-002 |     -4 | NOMINAL
 SAT-003 |   47.5 | HOT
 SAT-004 |  -12.5 | COLD
 SAT-005 |     22 | NOMINAL
```

Read it aloud the way you would say it: "In the case when the temperature is below minus ten, then COLD. When it is above forty-five, then HOT. Otherwise, NOMINAL. End." **Nominal** is engineering language for "as planned, within limits". Here are the parts:

- `CASE` opens the expression and `END` closes it. Everything between is one expression that produces one value per row, so you can give it an alias like any other.
- Each `WHEN condition THEN result` is a **branch**. The condition is any test you could write in a `WHERE`: `<`, `=`, `BETWEEN`, `IN`, `LIKE`, joined with `AND` and `OR` if you like.
- `ELSE result` is the catch-all, used when no branch matched.

The rule that makes CASE work is this: **the database checks the branches top to bottom and stops at the first condition that is true.** It takes that branch's result and ignores everything below it. For SAT-003, `47.5 < -10` is false, so it moves on; `47.5 > 45` is true, so the answer is HOT and the `ELSE` is never looked at.

If no branch is true and there is no `ELSE`, the answer is `NULL` — SQL's marker for "no value", which is the whole subject of the next lesson. Leave out the `ELSE` and every nominal battery gets a blank:

```sql
SELECT sat_id, temp_c,
       CASE WHEN temp_c > 45 THEN 'HOT' END AS flag
FROM battery_reading;
```

```text
 sat_id  | temp_c | flag
---------+--------+------
 SAT-001 |     18 |
 SAT-002 |     -4 |
 SAT-003 |   47.5 | HOT
 SAT-004 |  -12.5 |
 SAT-005 |     22 |
```

Sometimes that is what you want. Usually it is an accident. Write the `ELSE`.

::: key
**CASE WHEN** buckets a continuous measurement into named states (nominal, caution, critical); it is also the tool for conditional aggregation and pivoting. It is evaluated top to bottom, and the first true condition wins, so put the most restrictive condition first. With no `ELSE`, a row that matches no branch gets `NULL`.
:::

::: example Triage of the power bus voltage
The power team's limits for this bus are: below 26.0 V is CRITICAL, below 28.0 V is CAUTION, and anything else is NOMINAL. They want the worst first.

```sql
SELECT sat_id,
       voltage_v,
       CASE WHEN voltage_v < 26.0 THEN 'CRITICAL'
            WHEN voltage_v < 28.0 THEN 'CAUTION'
            ELSE 'NOMINAL'
       END AS bus_state
FROM battery_reading
ORDER BY voltage_v;
```

```text
 sat_id  | voltage_v | bus_state
---------+-----------+-----------
 SAT-004 |      25.2 | CRITICAL
 SAT-002 |      27.9 | CAUTION
 SAT-001 |      28.4 | NOMINAL
 SAT-005 |      28.8 | NOMINAL
 SAT-003 |      29.1 | NOMINAL
```

Walk each row through the branches in order:

- SAT-004, 25.2: is it below 26.0? Yes. Stop. CRITICAL.
- SAT-002, 27.9: below 26.0? No. Below 28.0? Yes. Stop. CAUTION.
- SAT-001, 28.4: below 26.0? No. Below 28.0? No. ELSE. NOMINAL.

Notice the second branch only says `voltage_v < 28.0`, not "between 26.0 and 28.0". It does not need to: any row that reaches the second branch has *already failed* the first test, so it is at least 26.0. The order of the branches is doing half the work.

Sanity check: the three states cover every possible voltage with no gaps and no overlaps, and exactly one satellite is below 26.0 V in the data, so exactly one CRITICAL.
:::

### Order matters: the most restrictive test goes first

Because the first true branch wins, putting the branches in the wrong order gives wrong answers with no error message. Here is a battery state-of-charge triage written backwards, run on the small `telemetry` table from the module exercise. **State of charge**, SOC for short, is how full the battery is, from 0 (empty) to 1 (full).

```sql
SELECT sat_id, value,
       CASE WHEN value < 0.70 THEN 'LOW'
            WHEN value < 0.30 THEN 'CRITICAL'
            ELSE 'OK'
       END AS status
FROM telemetry
WHERE channel = 'BATT_SOC';
```

```text
 sat_id  | value | status
---------+-------+--------
 SAT-001 |  0.94 | OK
 SAT-001 |  0.88 | OK
 SAT-001 |  0.61 | LOW
 SAT-002 |  0.42 | LOW
 SAT-002 |       | OK
 SAT-002 |  0.19 | LOW
 SAT-003 |  0.75 | OK
```

Look at the reading of 0.19. It is below 0.30, so it should be CRITICAL. But 0.19 is *also* below 0.70, and that test comes first. The database found a true branch, stopped, and called a nearly flat battery LOW. The CRITICAL branch can never fire: every number below 0.30 is also below 0.70, so it gets caught one line earlier. The branch is **[[dead code|dead-branch]]**.

::: warning Put the narrowest condition first
When your branches are "less than" tests, go from the smallest threshold up (`< 0.30`, then `< 0.70`). When they are "greater than" tests, go from the largest down (`> 45`, then `> 35`). Ask of each branch: "could a row that belongs here have been caught by a branch above?" If yes, the order is wrong.
:::

### The row with no value

Look again at the output above. The row for SAT-002 at one minute past midnight has a blank value, and CASE called it **OK**.

It is not OK. That blank is a `NULL`: no reading arrived. The test `NULL < 0.70` is not true (you cannot say an unknown number is less than 0.70), so no branch matched and the row fell through to `ELSE 'OK'`. A missing reading from a battery that might be dying was reported as healthy.

::: warning ELSE catches the missing values too
`ELSE` does not mean "everything that is fine". It means "everything that matched nothing above", and that includes rows where the value is missing. Either filter those rows out first, or give them their own branch so they cannot hide. The next lesson shows exactly how to test for a missing value, and why the obvious way does not work.
:::

### The short form: CASE on one column

When every branch compares the *same* column to a fixed value with `=`, there is a shorter way to write CASE. You name the column once after `CASE`, and each `WHEN` gives a value to match:

```sql
SELECT sat_id,
       channel,
       CASE channel
            WHEN 'BATT_SOC' THEN 'Battery state of charge'
            WHEN 'BUS_TEMP' THEN 'Bus temperature'
            ELSE 'Unknown channel'
       END AS description
FROM telemetry
WHERE ts = '2026-03-01T00:00:00Z';
```

```text
 sat_id  | channel  |       description
---------+----------+-------------------------
 SAT-001 | BATT_SOC | Battery state of charge
 SAT-002 | BATT_SOC | Battery state of charge
 SAT-003 | BUS_TEMP | Bus temperature
```

This is called a **simple CASE**; the kind with a full condition in every `WHEN` is a **searched CASE**. The simple form only does equality. For thresholds like `<` you need the searched form.

## CASE goes anywhere a value goes

A CASE expression produces a value, so you can use it anywhere SQL expects a value, not only in `SELECT`.

**In ORDER BY**, to invent your own sort order. To put out-of-limits batteries at the top of a list, and everything else below, sort on a number that CASE hands out:

```sql
SELECT sat_id, temp_c
FROM battery_reading
ORDER BY CASE WHEN temp_c < -10 OR temp_c > 45 THEN 0 ELSE 1 END,
         sat_id;
```

```text
 sat_id  | temp_c
---------+--------
 SAT-003 |   47.5
 SAT-004 |  -12.5
 SAT-001 |     18
 SAT-002 |     -4
 SAT-005 |     22
```

Out-of-limits rows get a 0 and sort first; the rest get a 1. Within each group, `sat_id` breaks the tie.

**Inside a total**, to count things by category. You need one new tool for this, and it is a preview of the next module. `SUM(expression)` adds the expression up over all the rows and returns one number; `COUNT(*)` counts the rows. Functions like these that squash many rows into one value are called **aggregates**. Now put a CASE inside a SUM:

```sql
SELECT SUM(CASE WHEN value < 0.30 THEN 1 ELSE 0 END)                   AS n_critical,
       SUM(CASE WHEN value >= 0.30 AND value < 0.70 THEN 1 ELSE 0 END) AS n_low,
       SUM(CASE WHEN value >= 0.70 THEN 1 ELSE 0 END)                  AS n_ok,
       COUNT(*)                                                         AS n_rows
FROM telemetry
WHERE channel = 'BATT_SOC';
```

```text
 n_critical | n_low | n_ok | n_rows
------------+-------+------+--------
          1 |     2 |    3 |      7
```

Each CASE turns a row into a 1 ("this row counts") or a 0 ("it does not"), and SUM adds up the 1s. This trick is called **[[conditional aggregation|pivot-picture]]**: an aggregate that only counts the rows meeting a condition. It is also how you **pivot** data — turn categories that were *values in a column* (CRITICAL, LOW, OK) into *separate columns* side by side.

Sanity check: $1 + 2 + 3 = 6$, but there are 7 rows. The missing one is the reading with no value. Each branch here says exactly which range it counts, so the blank row matched none of them and scored 0 everywhere. This time the counts told the truth: six readings sorted, one missing.

::: key
CASE can appear anywhere an expression can: in `SELECT`, `ORDER BY`, `WHERE`, and inside aggregates. `SUM(CASE WHEN condition THEN 1 ELSE 0 END)` counts the rows meeting a condition; several of them side by side pivot categories into columns.
:::

## Check yourself

::: check
A table `wheel` has columns `sat_id`, `wheel_no` and `speed_rpm`. Write a query that returns each wheel's speed in revolutions per second as `speed_rps`, and explain why `SELECT speed_rpm / 60 AS speed_rps` might give strange answers if `speed_rpm` is an integer column.
:::

::: answer
```sql
SELECT sat_id, wheel_no, speed_rpm / 60.0 AS speed_rps
FROM wheel;
```

There are 60 seconds in a minute, so revolutions per second is revolutions per minute divided by 60. If `speed_rpm` is an integer column and you divide by the integer `60`, the database does integer division and throws away the fraction: a wheel at 3000 rpm gives exactly `50`, fine, but a wheel at 90 rpm gives `1` instead of `1.5`, and anything under 60 rpm gives `0`. Writing `60.0` makes one side a decimal, so the fraction is kept.
:::

::: check
Three branches classify a reaction wheel's speed: `WHEN speed_rpm > 4000 THEN 'CAUTION'`, then `WHEN speed_rpm > 5500 THEN 'CRITICAL'`, then `ELSE 'NOMINAL'`. What status does a wheel at 6000 rpm get? Fix the CASE.
:::

::: answer
It gets CAUTION. The database checks `6000 > 4000` first, finds it true and stops, so the CRITICAL branch is never reached — no wheel can ever be called CRITICAL. With "greater than" tests the largest threshold must come first:

```sql
CASE WHEN speed_rpm > 5500 THEN 'CRITICAL'
     WHEN speed_rpm > 4000 THEN 'CAUTION'
     ELSE 'NOMINAL'
END
```

Now 6000 rpm matches the first branch (CRITICAL), 4500 rpm fails it and matches the second (CAUTION), and 3000 rpm falls to NOMINAL.
:::

::: check
Why does `SELECT temp_c + 273.15 AS temp_k FROM battery_reading WHERE temp_k > 300` fail in PostgreSQL, and what would you write instead?
:::

::: answer
The database handles `WHERE` before it builds the `SELECT` list, so the alias `temp_k` does not exist yet when the filter runs; PostgreSQL reports `column "temp_k" does not exist`. Repeat the expression in the filter:

```sql
SELECT sat_id, temp_c + 273.15 AS temp_k
FROM battery_reading
WHERE temp_c + 273.15 > 300;
```

With the data in this lesson, that returns only SAT-003 (320.65 K). SQLite would accept the alias, but the repeated form works in both.
:::

::: check
Write one query that returns a single row with two columns: how many batteries in `battery_reading` are charging (`current_a > 0`) and how many are discharging (`current_a < 0`). What does it return for the data in this lesson?
:::

::: answer
```sql
SELECT SUM(CASE WHEN current_a > 0 THEN 1 ELSE 0 END) AS n_charging,
       SUM(CASE WHEN current_a < 0 THEN 1 ELSE 0 END) AS n_discharging
FROM battery_reading;
```

Charging: SAT-001 (3.2 A) and SAT-003 (4 A), so 2. Discharging: SAT-002 (−1.5 A) and SAT-004 (−2.8 A), so 2. SAT-005 has exactly 0 A, so it counts in neither column; $2 + 2 = 4$, one fewer than the 5 rows, which is correct.
:::

::: check
A teammate writes `CASE WHEN value < 0.30 THEN 'CRITICAL' WHEN value < 0.70 THEN 'LOW' ELSE 'OK' END` over the whole `BATT_SOC` channel, including the row where no value arrived. What status does that row get, and why is that dangerous?
:::

::: answer
It gets OK. The value is missing (`NULL`), so neither `value < 0.30` nor `value < 0.70` is true, and the row falls through to `ELSE`. That is dangerous because a satellite that has stopped reporting its battery might be the one in trouble, and the report calls it healthy. The row should either be filtered out before the CASE runs (the next lesson shows how) or given a branch of its own such as `'NO DATA'`.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Expression | anything that evaluates to a value; in `SELECT` it is worked out once per row |
| Alias | `expression AS name` names a result column; usable in `ORDER BY`, not in `WHERE` |
| Integer division | `7 / 2` is `3`; make one side a decimal (`7.0 / 2`) to keep the fraction |
| Concatenation | `'SAT' \|\| '-001'` joins text end to end |
| Searched CASE | `CASE WHEN cond THEN result … ELSE result END`; first true branch wins |
| Simple CASE | `CASE col WHEN value THEN result … END`; equality only |
| Branch order | most restrictive condition first, or later branches become dead code |
| No ELSE | an unmatched row gets `NULL` |
| Missing value | falls through to `ELSE` unless you catch it |
| Conditional aggregation | `SUM(CASE WHEN cond THEN 1 ELSE 0 END)` counts rows meeting a condition |

Twice in this lesson a blank value slipped through: CASE called it OK, and the counts came up one short. Next lesson is about that blank — `NULL`, the value that is not there — and the strange three-valued logic the database uses whenever it meets one.

::: context per-row One row at a time
Picture the database walking down the table with a calculator. At each row it reads that row's voltage and that row's current, multiplies, writes the answer in a new column on the result, and moves to the next row.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="20" font-weight="700">sat_id</text>
    <text x="100" y="20" font-weight="700">voltage_v</text>
    <text x="180" y="20" font-weight="700">current_a</text>
    <text x="268" y="20" font-weight="700" fill="#1d6fd1">power_w</text>
  </g>
  <line x1="12" y1="28" x2="348" y2="28" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="258" y="32" width="84" height="84" fill="#8fb8f0" opacity="0.35"/>
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="50">SAT-001</text><text x="112" y="50">28.4</text><text x="192" y="50">3.2</text><text x="276" y="50">90.88</text>
    <text x="20" y="78">SAT-002</text><text x="112" y="78">27.9</text><text x="192" y="78">-1.5</text><text x="276" y="78">-41.85</text>
    <text x="20" y="106">SAT-003</text><text x="112" y="106">29.1</text><text x="192" y="106">4</text><text x="276" y="106">116.4</text>
  </g>
  <path d="M150,82 Q210,98 256,82" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="258,81 248,78 251,87" fill="#b4232c"/>
  <text x="20" y="140" font-size="12" fill="#6c7a93">each answer uses only its own row: 27.9 × (−1.5) = −41.85</text>
</svg>
```

The shaded column exists only in the result. Nothing is written back to the table.
:::

::: context alias-name A name for the answer
"Alias" comes from Latin *alias*, meaning "otherwise" or "at another time" — as in a person known *otherwise* by a different name. In SQL the column has a long real identity (`voltage_v * current_a`) and a short name you give it for this one query (`power_w`).

The word `AS` is optional in PostgreSQL and SQLite: `voltage_v * current_a power_w` also works. Write the `AS` anyway. Without it, a forgotten comma between two columns silently turns the second column into an alias for the first.
:::

::: context integer-division Why computers keep whole numbers whole
Inside a computer, whole numbers and numbers with fractions are stored in completely different ways, a bit like the difference between counting marbles and measuring water. When both sides of a division are whole numbers, the database assumes you want a whole-number answer and gives you the quotient, dropping the remainder. The `%` operator gives you the remainder that was dropped: `7 / 2` is `3` and `7 % 2` is `1`, and $3 \times 2 + 1 = 7$.

Python 3 made the opposite choice: `7 / 2` is `3.5` there, and you write `7 // 2` for the whole-number answer. Moving code between the two is a classic way to lose a fraction.
:::

::: context sqlite-alias SQL has one standard and many dialects
SQL is an international standard, but every database adds its own extras and leniencies, called its **dialect**. SQLite, which runs inside phones, browsers and this course's exercise engine, accepts an alias in `WHERE`. PostgreSQL, the database many flight-data teams run on their servers, follows the standard and does not.

A good habit for a data engineer: write the plain, standard form unless you have a reason not to. Your query will then survive being moved from a laptop prototype into the production pipeline.
:::

::: context triage-word Sorting by urgency
"Triage" comes from the French *trier*, to sort. It was used for sorting goods such as wool and coffee beans by quality long before battlefield medics took it over for sorting the wounded by how urgently they needed care.

Spacecraft operations uses the same idea every shift. Ground software compares each telemetry channel against **limits** — typically a yellow (caution) band and a red (alarm) band — and colors the display to match. A CASE expression is that same limit check, written in SQL.
:::

::: context dead-branch Why the CRITICAL branch can never fire
Draw the state-of-charge scale from 0 to 1. The first branch, `value < 0.70`, claims everything left of 0.70. The second branch, `value < 0.30`, wants the region left of 0.30 — but that region is already inside the first one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="330" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="88">0</text><text x="120" y="88">0.30</text><text x="240" y="88">0.70</text><text x="330" y="88">1</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="64" x2="30" y2="76"/><line x1="120" y1="64" x2="120" y2="76"/>
    <line x1="240" y1="64" x2="240" y2="76"/><line x1="330" y1="64" x2="330" y2="76"/>
  </g>
  <rect x="30" y="40" width="210" height="18" fill="#f2b880"/>
  <text x="135" y="53" font-size="11" fill="#1f2a44" text-anchor="middle">branch 1: value &lt; 0.70 → LOW</text>
  <rect x="30" y="16" width="90" height="18" fill="#b4232c" opacity="0.35"/>
  <text x="75" y="29" font-size="11" fill="#1f2a44" text-anchor="middle">branch 2: never reached</text>
  <text x="285" y="53" font-size="11" fill="#1d6fd1" text-anchor="middle">ELSE → OK</text>
  <text x="180" y="112" font-size="11" fill="#6c7a93" text-anchor="middle">every row under 0.30 is caught by branch 1 first</text>
</svg>
```

Code that can never run is called **dead code**. It is worse than useless: it makes a reviewer believe the CRITICAL case is handled.
:::

::: context pivot-picture From rows to columns
Conditional aggregation turns a long column of labels into a short row of counts. Each SUM(CASE …) is a separate bucket that catches only its own kind of row.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="20" y="18" font-size="12" font-weight="700" fill="#1f2a44">status</text>
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="38">CRITICAL</text><text x="20" y="56">LOW</text><text x="20" y="74">LOW</text>
    <text x="20" y="92">OK</text><text x="20" y="110">OK</text><text x="20" y="128">OK</text>
    <text x="20" y="146" fill="#6c7a93">(no value)</text>
  </g>
  <line x1="110" y1="85" x2="170" y2="85" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="178,85 168,80 168,90" fill="#1d6fd1"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="215" y="66" font-weight="700">critical</text><text x="275" y="66" font-weight="700">low</text><text x="330" y="66" font-weight="700">ok</text>
    <text x="215" y="96">1</text><text x="275" y="96">2</text><text x="330" y="96">3</text>
  </g>
  <line x1="186" y1="74" x2="354" y2="74" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="130" font-size="11" fill="#6c7a93" text-anchor="middle">7 rows in, 1 row out</text>
</svg>
```

Mission dashboards are full of rows like this one: how many satellites are nominal, in caution, in alarm, right now. The next module adds `GROUP BY`, which gives one such row per satellite, per orbital plane or per day.
:::
