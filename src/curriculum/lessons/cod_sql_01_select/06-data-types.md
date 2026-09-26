---
id: l06-data-types
title: "Data types: choosing what a column holds"
minutes: 22
covers:
  - "Data types: INTEGER, NUMERIC versus REAL, and why timestamps and money never use floats"
  - COALESCE, NULLIF, CAST
---

In lesson 01 you learned that every column has a **domain**: the set of values it is allowed to hold. When you write `CREATE TABLE`, you name that domain with a **data type** — `INTEGER`, `TEXT`, `REAL` and so on. It is easy to treat the type as paperwork: pick something that seems to fit and move on.

It is not paperwork. The type decides how the value is stored in memory, which values are allowed, and what `=`, `<` and `+` actually do. Pick the wrong one and nothing crashes. Instead, a total comes out a thousandth of a dollar short, two telemetry samples a minute apart get the same timestamp, and a query for `value = 0.42` finds nothing even though you can see 0.42 on the screen.

This lesson walks through the number types — whole numbers, exact decimals and floating point — and shows precisely why two things in flight-data work, **money** and **timestamps**, never go in a floating-point column. Then it teaches `CAST`, the tool for converting a value from one type to another, and puts it to work with `COALESCE` and `NULLIF` from the last lesson. It ends with what is different in SQLite, where this course's exercises run.

## What a type decides

Here is a small demonstration. The digits `10` and `9`, compared as text and then as numbers:

```sql
SELECT '10' < '9' AS as_text,
       10 < 9     AS as_numbers;
```

```text
 as_text | as_numbers
---------+------------
 t       | f
```

(`t` and `f` are how psql prints TRUE and FALSE.) As text, `'10'` comes *before* `'9'`, for the same reason "apple" comes before "banana": the database compares the first character, and `1` sorts before `9`. As numbers, 10 is bigger. Same digits, different type, opposite answer. A column of frame counters stored as `TEXT` will sort frame 10 before frame 9, and every `BETWEEN` on it will be quietly wrong.

So a type is a promise about three things: what form the value is stored in, which values are allowed at all, and what the operators mean. That last one is the one that bites.

## Whole numbers: INTEGER and friends

For counts, IDs, frame numbers and anything else that is always a whole number, use an **integer type**. PostgreSQL has three sizes. The size is how many **bytes** each value takes (a byte is 8 **bits**, the 0s and 1s a computer stores everything in), and that fixes the range:

| Type | Bytes | Range |
| --- | --- | --- |
| `SMALLINT` | 2 | −32,768 to 32,767 |
| `INTEGER` | 4 | about ±2.1 billion (2,147,483,647) |
| `BIGINT` | 8 | about ±9.2 × 10¹⁸ |

Integers are **exact**: 7 is stored as exactly 7, and adding, subtracting and multiplying them gives exactly the right answer. There are only two ways to go wrong. Dividing two integers throws away the fraction (`7 / 2` is `3`, from lesson 04). And going past the top of the range is an error:

```sql
SELECT 2147483647 + 1;
```

```text
ERROR:  integer out of range
```

That error is a good thing: PostgreSQL refuses rather than wrapping round to a negative number, as some programming languages do. When a count could ever pass two billion — packets received across a fleet of thousands of satellites, for instance — use `BIGINT` from the start.

## Exact decimals: NUMERIC

Now numbers with a fractional part. The first choice is **NUMERIC**, also spelled **DECIMAL**. It stores a number as base-ten digits, the same way you write it on paper, so `0.1` is stored as exactly one tenth.

You usually give it two settings: `NUMERIC(p, s)`. Read it as "numeric with precision *p* and scale *s*". The **[[precision|numeric-digits]]** is the total number of digits it may hold; the **scale** is how many of those come after the decimal point. So `NUMERIC(6, 2)` holds up to four digits before the point and exactly two after: the biggest value is 9999.99. Give it more decimal places and it rounds; give it too many whole digits and it refuses:

```sql
SELECT CAST(12.345 AS NUMERIC(5,2)) AS a,
       CAST(12.344 AS NUMERIC(5,2)) AS b;
```

```text
   a   |   b
-------+-------
 12.35 | 12.34
```

```sql
SELECT CAST(999.999 AS NUMERIC(5,2));
```

```text
ERROR:  numeric field overflow
```

(999.999 rounds to 1000.00, which needs six digits.) The `CAST(… AS …)` you see here converts a value to a type; it has its own section below.

NUMERIC arithmetic is exact in base ten. `0.1 + 0.2` is exactly `0.3`. The cost is speed and space: each NUMERIC value takes more bytes than a float, and the computer does its arithmetic digit by digit in software instead of in one hardware instruction.

## Floating point: REAL and DOUBLE PRECISION

The other choice for fractional numbers is **floating point**, the kind of number your calculator and every physics simulation uses. PostgreSQL has two: **REAL** (4 bytes, about 6 to 7 significant digits) and **DOUBLE PRECISION** (8 bytes, about 15 to 16 significant digits). In the `telemetry` table, `value` is a `REAL`.

A float stores a number in **binary** — base two — as a string of significant bits times a power of two. That is what "floating" means: the point can float to wherever the number's size needs it. It is fast, compact, and covers a huge range, from $10^{-38}$ to $10^{38}$ for REAL.

But it has one property you must never forget. **Most decimal fractions cannot be stored exactly in binary.** One tenth in binary is a repeating pattern, 0.000110011001100…, that goes on forever, the same way one third in decimal is 0.3333… forever. A float has to stop somewhere, so it stores the **[[nearest number it can|binary-fraction]]**. Ask PostgreSQL what is really stored:

```sql
SELECT CAST(0.1 AS DOUBLE PRECISION) + CAST(0.2 AS DOUBLE PRECISION) AS float_sum,
       0.1 + 0.2 AS numeric_sum;
```

```text
      float_sum      | numeric_sum
---------------------+-------------
 0.30000000000000004 |         0.3
```

(A plain `0.1` typed into PostgreSQL is a NUMERIC, which is why the second sum is exact.)

This also explains the long tails of digits in lesson 05's average. The battery readings are `REAL`s, so what is stored for 0.42 is not 0.42:

```sql
SELECT value, CAST(value AS DOUBLE PRECISION) AS stored_exactly
FROM telemetry
WHERE sat_id = 'SAT-002' AND value IS NOT NULL
ORDER BY ts;
```

```text
 value |   stored_exactly
-------+---------------------
  0.42 | 0.41999998688697815
  0.19 |  0.1899999976158142
```

psql prints `0.42` to be friendly, but the bits in the column say 0.41999998688697815. For a battery state of charge that does not matter at all: the sensor itself is not accurate to one part in ten million. That is the right way to think about floats. **Physical measurements are already approximate**, so a float's tiny rounding is far below the sensor's own noise, and floats are the right type for them.

::: key
**NUMERIC (DECIMAL)** is exact base-ten with declared precision and scale; **REAL** and **DOUBLE PRECISION** are binary floating point. Use NUMERIC where exactness is the requirement, floating point for physical measurements where it is not. **INTEGER** (and `SMALLINT`, `BIGINT`) is exact for whole numbers.
:::

::: warning Never test a float with =
Because 0.42 is stored as 0.41999998688…, in PostgreSQL `WHERE value = 0.42` on the REAL column finds **zero rows**. The typed `0.42` is an exact NUMERIC, the stored value is not, and they are not equal. (SQLite happens to find the row, because it stores and compares both as the same 8-byte float — which only teaches you a habit that will fail elsewhere.) Compare floats with a range instead: `WHERE value BETWEEN 0.415 AND 0.425` finds it in both.
:::

## Why money never uses floats

Money is the classic case where exactness *is* the requirement. A cent is a cent; an account that is off by a fraction of a cent is wrong, and auditors will find it.

::: example A thousand ten-cent charges
A ground-station network bills a satellite operator \$0.10 for each of 1,000 short contacts. The total must be exactly \$100.00. Add up 1,000 copies of 0.10 as each type (`generate_series(1, 1000)` is a PostgreSQL function that makes a throwaway set of 1,000 rows, one per number):

```sql
SELECT SUM(CAST(0.10 AS REAL))             AS real_sum,
       SUM(CAST(0.10 AS DOUBLE PRECISION)) AS double_sum,
       SUM(CAST(0.10 AS NUMERIC(12,2)))    AS numeric_sum
FROM generate_series(1, 1000);
```

```text
 real_sum |    double_sum    | numeric_sum
----------+------------------+-------------
 99.99905 | 99.9999999999986 |      100.00
```

Step by step. Each REAL 0.10 is really 0.100000001490116…, slightly too big, but as the running total grows, each addition is rounded to the REAL's 7 or so significant digits, and those rounding errors pile up. After 1,000 additions the REAL total is \$99.99905: short by \$0.00095, about a tenth of a cent. DOUBLE PRECISION has about 15 digits, so its error is far smaller, but it still misses: \$99.9999999999986. Only NUMERIC gives \$100.00 exactly.

Sanity check: $1000 \times 0.10 = 100$ exactly, so any answer other than 100.00 is an error, however small.

The fix is to store money as `NUMERIC(12,2)` (up to ten digits before the point and two after, so up to \$9,999,999,999.99), or as an `INTEGER` or `BIGINT` count of **cents**. Both are exact.
:::

## Why timestamps never use floats

Timestamps are the case that matters most in telemetry work, and one where a **[[float rounding error has cost lives|patriot-clock]]**.

A simple way to store a moment in time is as a count of seconds since an agreed starting moment, called an **[[epoch|epoch-word]]**. The most common one is the Unix epoch, midnight UTC on 1 January 1970. Midnight UTC on 1 March 2026 is 1,772,323,200 seconds after it. It is tempting to store that count in a float column, so fractions of a second fit too.

A float keeps a fixed number of *significant digits*, not a fixed number of decimal places. The bigger the number, the bigger the **[[gap between neighboring floats|float-gaps]]**. Near 1.77 billion, a REAL can only land on multiples of 128 seconds. A DOUBLE PRECISION does much better — its gap there is about 0.00000024 s, or 240 nanoseconds — but it still cannot hold 0.1 s exactly.

::: example Two samples, one timestamp
Store two readings taken exactly one minute apart, at 1,772,323,200 s and 1,772,323,260 s, as REAL:

```sql
SELECT CAST(1772323200 AS REAL) = CAST(1772323260 AS REAL) AS same_instant;
```

```text
 same_instant
--------------
 t
```

Both round to the nearest multiple of 128, which is 1,772,323,200 for each. Two different samples now claim the same moment. A key on `(sat_id, ts)` rejects the second one; a sort cannot tell which came first.

DOUBLE PRECISION survives that, but not arithmetic. A 10 Hz sensor (ten samples per second) stamps each sample 0.1 s after the last. Step three samples from midnight and compare with the timestamp you would type:

```sql
SELECT CAST(1772323200 AS DOUBLE PRECISION) + 0.1 + 0.1 + 0.1 AS stepped,
       CAST(1772323200.3 AS DOUBLE PRECISION) AS direct,
       CAST(1772323200 AS DOUBLE PRECISION) + 0.1 + 0.1 + 0.1
         = CAST(1772323200.3 AS DOUBLE PRECISION) AS equal;
```

```text
      stepped       |    direct    | equal
--------------------+--------------+-------
 1772323200.2999997 | 1772323200.3 | f
```

Each `+ 0.1` was rounded to the nearest representable double, and the errors added up to about 0.0000003 s. The two values print differently and are not equal. Join a table of stepped timestamps to a table of typed ones on `ts = ts` and those rows fail to match. No error — only missing data.

Now do the same with an **integer count of nanoseconds** since the epoch, in a `BIGINT`. One tenth of a second is exactly 100,000,000 ns:

```sql
SELECT CAST(1772323200000000000 AS BIGINT) + 100000000 + 100000000 + 100000000
         = 1772323200300000000 AS equal;
```

```text
 equal
-------
 t
```

Exact. Sanity check on the range: the largest BIGINT is about $9.22 \times 10^{18}$ ns, and $9.22 \times 10^{18} / 10^9 / 86400 / 365.25 \approx 292$ years, so nanoseconds since 1970 fit until the 2260s.
:::

::: key
Telemetry timestamps are never stored as floats: binary floating point cannot represent decimal fractions of a second exactly and loses resolution as the epoch offset grows, so equality and joins break. Use a timestamp type, or an integer count of nanoseconds since a stated epoch.
:::

The "timestamp type" in that key is PostgreSQL's `TIMESTAMPTZ`, which stores an exact instant to the microsecond. The next lesson is all about it. Either way, **say which epoch**: a count of seconds with no stated starting moment is a number nobody can turn back into a time.

## CAST: converting between types

Sometimes a value arrives as the wrong type. Numbers come in as text from a comma-separated (CSV) file, or you need an exact division from integer columns. **CAST** converts a value to another type. Read `CAST(x AS type)` as "x, treated as type":

```sql
SELECT CAST('42' AS INTEGER) + 1 AS a,
       7 / 2                     AS int_div,
       CAST(7 AS NUMERIC) / 2    AS num_div,
       CAST(3.7 AS INTEGER)      AS rounded;
```

```text
 a  | int_div |      num_div       | rounded
----+---------+--------------------+---------
 43 |       3 | 3.5000000000000000 |       4
```

The text `'42'` became the number 42, so `+ 1` did arithmetic. Casting 7 to NUMERIC made the division keep its fraction — the proper fix for lesson 04's integer-division trap. And casting 3.7 to an integer rounded it to 4.

PostgreSQL also has a shorthand: `x::type`, read "x cast to type". `'42'::INTEGER` is the same as `CAST('42' AS INTEGER)`. You will see `::` everywhere in PostgreSQL code, but it is PostgreSQL-only; `CAST` works in every database.

A cast can fail. `CAST('abc' AS INTEGER)` stops the query in PostgreSQL with `ERROR: invalid input syntax for type integer: "abc"`. That error is your friend: it tells you the data is not what you thought.

::: key
`CAST(x AS type)` converts a value to another type; PostgreSQL's shorthand is `x::type`. Casting text to a number fails loudly in PostgreSQL if the text is not a number. `CAST(int AS NUMERIC)` before dividing keeps the fraction.
:::

### CAST with NULLIF and COALESCE

The three tools work well together, as long as you remember what each one does. Here is raw battery data loaded from a ground-station file. Every field arrived as text, and a dropped sample was written as an empty string, `''`:

```sql
SELECT sat_id, ts, CAST(soc_text AS REAL) AS soc
FROM raw_import;
```

```text
ERROR:  invalid input syntax for type real: ""
```

An empty string is not a number, so the cast fails. What the empty string *means* is "no reading", and SQL's word for that is NULL. So turn `''` into NULL first with NULLIF, then cast — a cast of NULL is NULL, with no error:

```sql
SELECT sat_id, ts, CAST(NULLIF(soc_text, '') AS REAL) AS soc
FROM raw_import;
```

```text
 sat_id  |          ts          |  soc
---------+----------------------+--------
 SAT-006 | 2026-03-01T00:00:00Z |   0.91
 SAT-006 | 2026-03-01T00:01:00Z | [NULL]
 SAT-006 | 2026-03-01T00:02:00Z |   0.87
```

That is the honest result: two readings and a gap. (Wrapping it all in `COALESCE(…, 0)` would turn the gap into a flat battery — lesson 05's warning again.)

COALESCE also cares about types: all of its arguments must be one type. `COALESCE(value, 'missing')` fails in PostgreSQL, because `value` is a REAL and `'missing'` cannot be turned into one. To show the word in a report, cast the number to text first: `COALESCE(CAST(value AS TEXT), 'missing')`.

::: warning Casts that fail loudly in PostgreSQL fail silently in SQLite
SQLite never raises an error on a bad cast. It converts as much as it can and uses 0 for the rest. `CAST('abc' AS INTEGER)` is `0`. `CAST('' AS REAL)` is `0.0` — so an empty telemetry field becomes a battery at zero charge without a word of warning. And SQLite *truncates* toward zero when casting to an integer (`CAST(3.7 AS INTEGER)` is `3`), where PostgreSQL rounds (`4`). In SQLite, always `NULLIF` the empty string before casting, and never trust a cast you have not checked.
:::

## Other types you will meet

- **TEXT** holds text of any length; `VARCHAR(n)` caps it at *n* characters.
- **BOOLEAN** holds TRUE or FALSE (or NULL). Good for flags like `in_eclipse`.
- **DATE** holds a calendar day, like `2024-01-15`, with no time.
- **TIMESTAMPTZ** holds an exact instant in time, and **INTERVAL** a length of time. They are the subject of the next lesson.

## The same ideas in SQLite

This course's SQL exercises run on SQLite, which treats types very differently. SQLite has only five **storage classes** — NULL, INTEGER, REAL, TEXT and BLOB (raw bytes) — and the type you write in `CREATE TABLE` is only a *preference*, which SQLite calls **[[type affinity|affinity]]**. It will store the text `'hello'` in an INTEGER column without complaint. You can ask what it actually stored with `typeof(x)`.

Three consequences for your work:

- SQLite's `REAL` is always the 8-byte float, the same as PostgreSQL's `DOUBLE PRECISION`.
- SQLite has **no exact decimal**. A column declared `NUMERIC` stores `0.61` as a REAL float. For money, store integer cents.
- SQLite has no timestamp type at all. The standard practice — the one the module exercise uses — is ISO-8601 text like `'2026-03-01T00:01:00Z'`, always in UTC and always the same width. Because every field is fixed-width and ordered from biggest unit (year) to smallest (second), sorting these strings as text puts them in time order, and `BETWEEN` works on them. Lesson 07 goes further.

## Check yourself

::: check
For each column, pick a type and give one reason: (a) a satellite's count of reboots since launch; (b) the purchase price of a launch contract in US dollars; (c) a gyroscope's measured rotation rate in degrees per second; (d) the number of telemetry frames received by the whole fleet, all time.
:::

::: answer
- (a) `INTEGER`: a whole number that will never come near two billion; exact.
- (b) `NUMERIC(14,2)` (or a `BIGINT` count of cents): money must be exact to the cent, and a launch contract can run to tens of millions of dollars, so allow plenty of digits before the point.
- (c) `REAL` or `DOUBLE PRECISION`: a physical measurement, already approximate from the sensor; floats are fast and their rounding is far below the sensor noise.
- (d) `BIGINT`: a fleet of thousands of satellites sending frames every second passes 2,147,483,647 frames within days, which would overflow an `INTEGER`.
:::

::: check
What does each of these return in PostgreSQL: (a) `SELECT 9 / 4`, (b) `SELECT CAST(9 AS NUMERIC) / 4`, (c) `SELECT CAST(2.5 AS INTEGER)`, (d) `SELECT '9' < '10'`?
:::

::: answer
- (a) `2`: both are integers, so the fraction ($9/4 = 2.25$) is thrown away.
- (b) `2.25` (printed as `2.2500000000000000`): casting to NUMERIC keeps the fraction.
- (c) `3`: PostgreSQL rounds a NUMERIC to the nearest integer, and a half rounds away from zero. (SQLite would give `2`, because it truncates.)
- (d) FALSE: as text, `'9'` is compared with `'10'` character by character, and `'9'` comes after `'1'`, so `'9'` is *greater*. As numbers it would be TRUE.
:::

::: check
A mission-log table stores `t_s REAL` as seconds since the Unix epoch. An engineer notices several rows from the same satellite have identical `t_s` values, although the satellite logs one event every 30 seconds. Explain, and propose a better column.
:::

::: answer
Seconds since 1970 are about 1.77 billion today. A REAL keeps only about 7 significant digits, so near that size it can only represent multiples of 128 seconds; events 30 seconds apart get rounded to the same stored number. Even DOUBLE PRECISION, which is fine at this resolution, would break exact comparisons when fractional steps are added. Store the time as `TIMESTAMPTZ` in UTC (next lesson), or as a `BIGINT` count of nanoseconds with the epoch written into the column's documentation and name, such as `t_unix_ns`.
:::

::: check
A text column `temp_text` holds values like `'21.5'`, `''` and `'N/A'`. Write an expression that turns it into a REAL, with both kinds of missing value becoming NULL, and say what happens to `'N/A'` in each database if you forget it.
:::

::: answer
```sql
CAST(NULLIF(NULLIF(temp_text, ''), 'N/A') AS REAL)
```

The inner NULLIF turns `''` into NULL. The outer one turns `'N/A'` into NULL (a NULL passes through NULLIF unchanged, since `NULL = 'N/A'` is not TRUE). Then CAST converts real numbers and leaves NULLs as NULL. If you forget the `'N/A'` step, PostgreSQL stops with `invalid input syntax for type real: "N/A"`, which at least tells you. SQLite quietly returns `0.0`, which puts a fake 0 °C reading in your data.
:::

::: check
A monthly report adds `cost_usd REAL` across 50,000 invoices and is off by a few cents from the finance system. The analyst proposes rounding the final sum to two decimal places. Why is that not a real fix?
:::

::: answer
Every invoice is stored as the nearest binary float, not its exact cents, and the sum rounds again at every step. Rounding the final answer hides the symptom this month, but the error grows with the number of rows, and any query that compares, groups or joins on individual amounts (for example `cost_usd = 19.99`) is still unreliable. The fix is to store the amounts exactly: change the column to `NUMERIC(12,2)` or to an integer number of cents.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Data type | decides storage, allowed values, and what `=`, `<`, `+` mean |
| INTEGER family | `SMALLINT` 2 B, `INTEGER` 4 B (±2.1 × 10⁹), `BIGINT` 8 B (±9.2 × 10¹⁸); exact; overflow is an error |
| NUMERIC(p, s) | exact base ten; *p* total digits, *s* after the point; for money |
| REAL, DOUBLE PRECISION | binary floats, about 7 and 15 digits; for physical measurements |
| Float equality | `0.42` is stored as 0.41999998…; compare floats with a range, never `=` |
| Money | `NUMERIC(12,2)` or integer cents; never a float |
| Timestamps | `TIMESTAMPTZ` or integer nanoseconds since a stated epoch; never a float |
| CAST(x AS type) | converts types; `x::type` in PostgreSQL; fails loudly there, silently in SQLite |
| NULLIF then CAST | `CAST(NULLIF(t, '') AS REAL)` turns blanks into NULL before converting |
| SQLite | type affinity, REAL is 8-byte, no exact decimal, timestamps as ISO-8601 UTC text |

The next lesson takes the timestamp problem all the way: what `TIMESTAMPTZ` stores, why it differs from plain `TIMESTAMP`, how intervals add and subtract, and why aerospace keeps every clock in UTC.

::: context numeric-digits Precision and scale, drawn
`NUMERIC(6, 2)` gives you six digit slots in total, with the decimal point fixed after the fourth. The largest number it can hold is 9999.99.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <rect x="40" y="40" width="40" height="40" fill="#8fb8f0"/>
    <rect x="80" y="40" width="40" height="40" fill="#8fb8f0"/>
    <rect x="120" y="40" width="40" height="40" fill="#8fb8f0"/>
    <rect x="160" y="40" width="40" height="40" fill="#8fb8f0"/>
    <rect x="220" y="40" width="40" height="40" fill="#f2b880"/>
    <rect x="260" y="40" width="40" height="40" fill="#f2b880"/>
  </g>
  <circle cx="210" cy="74" r="4" fill="#1f2a44"/>
  <g font-size="18" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="67">9</text><text x="100" y="67">9</text><text x="140" y="67">9</text><text x="180" y="67">9</text>
    <text x="240" y="67">9</text><text x="280" y="67">9</text>
  </g>
  <text x="170" y="24" font-size="12" fill="#1f2a44" text-anchor="middle">precision p = 6 digits in all</text>
  <text x="120" y="104" font-size="12" fill="#1d6fd1" text-anchor="middle">4 before the point</text>
  <text x="260" y="104" font-size="12" fill="#b4232c" text-anchor="middle">scale s = 2 after</text>
</svg>
```

The whole-number part gets $p - s$ slots. That is why 999.999 fits nowhere in `NUMERIC(5, 2)`: it rounds to 1000.00, which needs four slots before the point and the type only has three.
:::

::: context binary-fraction Why one tenth never ends in binary
In base ten, a fraction ends only if its bottom number is built from 2s and 5s, the factors of 10. That is why $\frac{1}{4} = 0.25$ ends and $\frac{1}{3} = 0.333\ldots$ does not. In base two, a fraction ends only if its bottom is built from 2s alone. One tenth has a 5 in its bottom ($10 = 2 \times 5$), so in binary it repeats forever:

$$
0.1_{\text{ten}} = 0.0001100110011\ldots_{\text{two}}
$$

A float keeps 24 bits (REAL) or 53 bits (DOUBLE PRECISION) of that pattern and rounds off the rest. So 0.5, 0.25 and 0.125 are stored exactly, while 0.1, 0.2 and 0.42 are not.
:::

::: context patriot-clock A clock that drifted by a third of a second
In February 1991, a Patriot air-defense battery in Dhahran, Saudi Arabia, failed to intercept an incoming Scud missile, and 28 soldiers were killed. A US government investigation traced the failure to timekeeping. The system counted time in tenths of a second and multiplied by 0.1, stored in a 24-bit register — and 0.1 cannot be stored exactly in binary. The tiny error per tick grew with uptime. After about 100 hours running, the clock was off by about 0.34 seconds, enough for the tracking software to look in the wrong part of the sky.

It is the same arithmetic as this lesson's timestamp example, and it is why flight software and flight data store time as exact integer counts.
:::

::: context epoch-word Epochs in spaceflight
"Epoch" comes from the Greek for "a pause" or "a fixed point", and in astronomy it has long meant the reference moment that other times are counted from.

Spaceflight uses several epochs, which is why "seconds since the epoch" means nothing until you name one. Unix time counts from 1970-01-01 00:00:00 UTC. GPS time counts from 1980-01-06 00:00:00 and does not add leap seconds, so it has drifted away from UTC by 18 seconds. Orbital mechanics often uses J2000, noon on 1 January 2000. A telemetry column named `t_s` with no stated epoch is a puzzle; `t_unix_ns` answers the question in its name.
:::

::: context float-gaps The gaps between floats grow with size
A float has a fixed number of significant bits, so the spacing between neighboring values is proportional to the number's size. A REAL has 24 significant bits, so between 1 and 2 its neighbors are about 0.00000012 apart. Near 1.77 billion they are 128 apart.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="20" y="20" font-size="12" fill="#1f2a44">REAL values near 1,772,323,200 s</text>
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1d6fd1" stroke-width="3">
    <line x1="40" y1="48" x2="40" y2="72"/>
    <line x1="168" y1="48" x2="168" y2="72"/>
    <line x1="296" y1="48" x2="296" y2="72"/>
  </g>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="40" y="88">…3200</text><text x="168" y="88">…3328</text><text x="296" y="88">…3456</text>
  </g>
  <circle cx="100" cy="60" r="5" fill="#b4232c"/>
  <text x="100" y="40" font-size="11" fill="#b4232c" text-anchor="middle">…3260</text>
  <line x1="95" y1="66" x2="46" y2="66" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="42,66 50,62 50,70" fill="#b4232c"/>
  <text x="104" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">1 minute later rounds back to …3200</text>
  <text x="180" y="138" font-size="11" fill="#6c7a93" text-anchor="middle">neighbors 128 s apart; nothing in between exists</text>
</svg>
```

The red reading, 60 s after midnight, has no REAL of its own. It snaps to the nearest blue tick, which is midnight again.
:::

::: context affinity Why SQLite is so relaxed
SQLite was designed to be tiny and to live inside other programs — phones, web browsers, cars, and even aircraft systems. Its author chose flexible typing so it would accept whatever the host program handed it, much like a scripting language.

The price is that the database no longer guards your data. PostgreSQL rejects `'hello'` in an INTEGER column; SQLite stores it. Since version 3.37 SQLite offers `STRICT` tables, which enforce the declared types, and they are worth using for anything that matters.
:::
