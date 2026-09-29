---
id: l04-running-totals-and-moving-averages
title: Running totals and moving averages
minutes: 21
covers:
  - "Aggregate windows: running totals and moving averages"
---

Think of a bank statement. Every line shows one payment, and beside it the balance after that payment. Nobody adds up the whole statement by hand to find the balance on the 14th; the running balance is printed right there on the line. Now think of a teacher who reports "your average over your last three tests" instead of your average for the whole year. That number moves as you go: an old test drops off the back each time a new one arrives.

Those two numbers have names. The bank balance is a **running total** — a sum that grows row by row, from the first row up to the current one. The teacher's number is a **moving average** — the average of a fixed-size group of recent rows, which slides forward one row at a time.

Both are everywhere in flight data. A satellite's **[[propellant budget|propellant-budget]]** is a running total: every thruster firing uses a little, and what is left in the tank decides how many years the satellite can stay in orbit. A moving average is the first thing an engineer reaches for when a sensor is noisy: it smooths the wiggles so the trend shows through. In lesson 01 you saw that putting an ORDER BY inside `OVER (...)` turns an aggregate into a "so far" number. This lesson puts that to work. Then it takes the **frame clause** you met in lesson 03 — there it stretched the window over the whole partition to fix LAST_VALUE — and uses it to make the window slide.

## A running total: SUM with ORDER BY

Here is a new table for this lesson: one row per thruster firing (a **burn**), with the propellant it used, in kilograms. It is small on purpose, so you can check every number by hand.

```sql
CREATE TABLE burns (
    sat_id  TEXT         NOT NULL,
    ts      TIMESTAMPTZ  NOT NULL,   -- when the burn happened, UTC
    prop_kg NUMERIC(5,2) NOT NULL    -- propellant used, kg
);

INSERT INTO burns VALUES
  ('SAT-001','2026-03-02T04:12:00Z',0.42),
  ('SAT-001','2026-03-05T11:30:00Z',1.10),
  ('SAT-001','2026-03-09T02:45:00Z',0.35),
  ('SAT-001','2026-03-14T18:05:00Z',0.80),
  ('SAT-002','2026-03-03T07:20:00Z',0.60),
  ('SAT-002','2026-03-08T13:00:00Z',0.25),
  ('SAT-002','2026-03-12T21:40:00Z',0.55);
```

Start with the whole fleet: how much propellant has been used, in total, after each burn?

```sql
SELECT sat_id, ts, prop_kg,
       SUM(prop_kg) OVER (ORDER BY ts) AS used_so_far
FROM burns
ORDER BY ts;
```

```text
 sat_id  |           ts           | prop_kg | used_so_far
---------+------------------------+---------+-------------
 SAT-001 | 2026-03-02 04:12:00+00 |    0.42 |        0.42
 SAT-002 | 2026-03-03 07:20:00+00 |    0.60 |        1.02
 SAT-001 | 2026-03-05 11:30:00+00 |    1.10 |        2.12
 SAT-002 | 2026-03-08 13:00:00+00 |    0.25 |        2.37
 SAT-001 | 2026-03-09 02:45:00+00 |    0.35 |        2.72
 SAT-002 | 2026-03-12 21:40:00+00 |    0.55 |        3.27
 SAT-001 | 2026-03-14 18:05:00+00 |    0.80 |        4.07
```

Read `SUM(prop_kg) OVER (ORDER BY ts)` aloud as "the sum of prop kg, over the rows in time order, so far". Each row's window is every row from the first burn up to itself. So the first line is 0.42, the second is $0.42 + 0.60 = 1.02$, the third is $1.02 + 1.10 = 2.12$, and so on, like the [[balance column|running-total-picture]] on a statement. The last line, 4.07 kg, is the plain total of the table, as the last line of a running total always is.

There is no PARTITION BY here, so the two satellites are mixed together in one line of time. That is right for a fleet-wide question. For a question about one satellite's tank, it is wrong.

### One running total per satellite

Add `PARTITION BY sat_id` and each satellite gets its own running total, starting again from zero:

::: example How much propellant is left in each tank?
Each satellite in this example was launched with $12.00\,\mathrm{kg}$ of propellant. You want, after every burn, what that satellite has used so far and what it has left.

**Step 1.** The running total per satellite is `SUM(prop_kg) OVER (PARTITION BY sat_id ORDER BY ts)`.

**Step 2.** What is left is the starting load minus that running total. A window result is an ordinary number on the row, so you can subtract it from 12.00 like any other value.

```sql
SELECT sat_id, ts, prop_kg,
       SUM(prop_kg) OVER (PARTITION BY sat_id ORDER BY ts) AS used_so_far,
       12.00 - SUM(prop_kg) OVER (PARTITION BY sat_id ORDER BY ts) AS remaining_kg
FROM burns
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | prop_kg | used_so_far | remaining_kg
---------+------------------------+---------+-------------+--------------
 SAT-001 | 2026-03-02 04:12:00+00 |    0.42 |        0.42 |        11.58
 SAT-001 | 2026-03-05 11:30:00+00 |    1.10 |        1.52 |        10.48
 SAT-001 | 2026-03-09 02:45:00+00 |    0.35 |        1.87 |        10.13
 SAT-001 | 2026-03-14 18:05:00+00 |    0.80 |        2.67 |         9.33
 SAT-002 | 2026-03-03 07:20:00+00 |    0.60 |        0.60 |        11.40
 SAT-002 | 2026-03-08 13:00:00+00 |    0.25 |        0.85 |        11.15
 SAT-002 | 2026-03-12 21:40:00+00 |    0.55 |        1.40 |        10.60
```

**Step 3. Check by hand.** SAT-001: $0.42$, then $0.42 + 1.10 = 1.52$, then $1.52 + 0.35 = 1.87$, then $1.87 + 0.80 = 2.67$. What is left at the end: $12.00 - 2.67 = 9.33\,\mathrm{kg}$. SAT-002 starts again at 0.60, not at $2.67 + 0.60 = 3.27$, because PARTITION BY gave it its own window. Its last line: $0.60 + 0.25 + 0.55 = 1.40$ used and $10.60$ left.

**Sanity check.** The remaining column only ever goes down, because propellant is only ever used. If you saw it go up, either a burn had a negative amount or the running total crossed from one satellite into another.
:::

::: key Running total
A running total is `SUM(x) OVER (PARTITION BY k ORDER BY t)`: each row gets the sum from the first row of its partition up to itself. PARTITION BY restarts the total for each key; ORDER BY says which rows come "before".
:::

::: warning A running total that forgot its partition
Leave out `PARTITION BY sat_id` and the running total runs straight across satellites. The fleet table above is exactly that: SAT-002's first burn shows 1.02, which includes SAT-001's 0.42. The query does not fail and the numbers look reasonable, which is what makes this mistake dangerous. Whenever a table has more than one satellite, ask yourself: "Should this total restart for each one?"
:::

### Other running aggregates

Any aggregate works the same way. `MIN` with ORDER BY gives "the lowest so far", and `MAX` gives "the highest so far". On the battery table from lesson 01, the lowest charge so far is the deepest the battery has been drained, which is what battery engineers call the **[[depth of discharge|depth-of-discharge]]** (measured from full):

```sql
SELECT sat_id, ts, value,
       MIN(value) OVER (PARTITION BY sat_id ORDER BY ts) AS lowest_so_far,
       MAX(value) OVER (PARTITION BY sat_id ORDER BY ts) AS highest_so_far
FROM soc
WHERE sat_id = 'SAT-001'
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value | lowest_so_far | highest_so_far
---------+------------------------+-------+---------------+----------------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |          0.90 |           0.90
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 |          0.85 |           0.90
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 |          0.70 |           0.90
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |          0.70 |           0.90
```

At 00:30 the charge has climbed back to 0.75, but `lowest_so_far` stays at 0.70. A running minimum can only stay level or fall, and a running maximum can only stay level or rise. That is a quick check on any output you see.

### A share of the total, so far

Two windows on one row can be divided. The running total over the partition's whole total gives "what fraction of this satellite's propellant use had happened by now":

```sql
SELECT sat_id, ts, prop_kg,
       SUM(prop_kg) OVER (PARTITION BY sat_id ORDER BY ts) AS used_so_far,
       ROUND(100 * SUM(prop_kg) OVER (PARTITION BY sat_id ORDER BY ts)
                 / SUM(prop_kg) OVER (PARTITION BY sat_id), 1) AS pct_of_total
FROM burns
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | prop_kg | used_so_far | pct_of_total
---------+------------------------+---------+-------------+--------------
 SAT-001 | 2026-03-02 04:12:00+00 |    0.42 |        0.42 |         15.7
 SAT-001 | 2026-03-05 11:30:00+00 |    1.10 |        1.52 |         56.9
 SAT-001 | 2026-03-09 02:45:00+00 |    0.35 |        1.87 |         70.0
 SAT-001 | 2026-03-14 18:05:00+00 |    0.80 |        2.67 |        100.0
 SAT-002 | 2026-03-03 07:20:00+00 |    0.60 |        0.60 |         42.9
 SAT-002 | 2026-03-08 13:00:00+00 |    0.25 |        0.85 |         60.7
 SAT-002 | 2026-03-12 21:40:00+00 |    0.55 |        1.40 |        100.0
```

The top of the fraction has ORDER BY, so it is "so far". The bottom has no ORDER BY, so it is the whole partition, 2.67 kg for SAT-001. Check the second line: $1.52 / 2.67 = 0.569$, or 56.9%. The last line of each satellite is 100.0%, as it must be. Notice the big jump on SAT-001's second burn: 1.10 kg in one go, 41% of everything it used. On a real fleet, that is the kind of line that makes someone ask what that burn was for.

## Moving averages: a window that slides

A running total looks all the way back to the start. A moving average looks back only a fixed distance. For that you need to tell the window exactly which rows to include, and that is what the frame clause does. The **frame** is the part of the partition that the function actually uses for the current row. In lesson 03 both ends of the frame were UNBOUNDED, the edges of the partition. Here the start is a fixed number of rows back from the current row.

Here is a three-sample moving average of state of charge:

```sql
SELECT sat_id, ts, value,
       ROUND(AVG(value) OVER (PARTITION BY sat_id ORDER BY ts
                              ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 3) AS ma3,
       COUNT(*) OVER (PARTITION BY sat_id ORDER BY ts
                      ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS n_in_window
FROM soc
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value |  ma3  | n_in_window
---------+------------------------+-------+-------+-------------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 | 0.900 |           1
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 | 0.875 |           2
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 | 0.817 |           3
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 | 0.767 |           3
 SAT-002 | 2026-03-01 00:00:00+00 |  0.50 | 0.500 |           1
 SAT-002 | 2026-03-01 00:10:00+00 |  0.55 | 0.525 |           2
 SAT-002 | 2026-03-01 00:20:00+00 |  0.60 | 0.550 |           3
 SAT-002 | 2026-03-01 00:50:00+00 |  0.63 | 0.593 |           3
 SAT-003 | 2026-03-01 00:00:00+00 |  0.81 | 0.810 |           1
 SAT-003 | 2026-03-01 00:10:00+00 |  0.78 | 0.795 |           2
 SAT-003 | 2026-03-01 00:20:00+00 |  0.78 | 0.790 |           3
 SAT-003 | 2026-03-01 00:30:00+00 |  0.75 | 0.770 |           3
```

Read `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` aloud as "rows from two before this one, up to this one". It has three parts:

- **ROWS** says the frame is measured by counting rows. (Lesson 05 meets the other ways to measure it.)
- **2 PRECEDING** is where the frame starts: two rows before the current row, in the window's ORDER BY. "Preceding" means "coming before".
- **CURRENT ROW** is where the frame ends: the current row itself.

So each row's frame holds at most three rows: itself and the two before it. As you move down one row, the oldest row falls off the back and the new one comes in at the front. That is the [[sliding picture|sliding-frame]] that gives the moving average its name.

::: key Moving average
A moving average is `AVG(x) OVER (PARTITION BY k ORDER BY t ROWS BETWEEN n PRECEDING AND CURRENT ROW)`: the average of the current row and the $n$ rows before it, inside the partition. A window of $N$ samples uses $n = N - 1$.
:::

::: warning Off by one
"A three-sample average" is `2 PRECEDING`, not `3 PRECEDING`. The current row counts as one of the three. `3 PRECEDING AND CURRENT ROW` is a four-sample window. When in doubt, add `COUNT(*) OVER (...)` with the same window and look at the largest number it prints.
:::

::: example Walking the moving average by hand
Take SAT-001, whose readings in time order are 0.90, 0.85, 0.70 and 0.75. Work out the three-sample moving average on each row.

**00:00.** Two rows before this one would be before the start of the partition, and there is nothing there. The frame is cut off at the partition's first row, so it holds one row: $0.90 / 1 = 0.900$.

**00:10.** The frame holds 00:00 and 00:10: $(0.90 + 0.85) / 2 = 1.75 / 2 = 0.875$.

**00:20.** Now the frame is full, three rows: $(0.90 + 0.85 + 0.70) / 3 = 2.45 / 3 = 0.817$.

**00:30.** The frame slides. 00:00 falls off the back; the frame is 00:10, 00:20 and 00:30: $(0.85 + 0.70 + 0.75) / 3 = 2.30 / 3 = 0.767$.

**Compare with the running average** from lesson 01, which was 0.800 on the last row. The running average still remembers the 0.90 at the start; the moving average has forgotten it. That is the point of a moving average: it follows the recent level, not the whole history.

**Sanity check.** Every moving average lies between the smallest and largest value in its frame. On the last row the frame's values run from 0.70 to 0.85, and 0.767 sits between them.
:::

### The first rows are not full

Look at `n_in_window` again: 1, 2, 3, 3. The frame never reaches outside its own partition, so the first rows of each satellite average fewer samples than the rest. This start-up stretch is often called the **[[warm-up|warm-up]]**. The numbers there are real averages, but they are noisier, because fewer samples went into them.

Sometimes that is fine. When it is not — a plot that should only show fully smoothed values, or an alarm that should not fire on a half-empty average — blank out the rows whose frame is not full. The count is a window result, so the cleanest way is to compute it in a CTE and test it outside, the same shape you used in lesson 01:

```sql
WITH w AS (
  SELECT sat_id, ts, value,
         AVG(value) OVER (PARTITION BY sat_id ORDER BY ts
                          ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS ma3,
         COUNT(*)   OVER (PARTITION BY sat_id ORDER BY ts
                          ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS n
  FROM soc
)
SELECT sat_id, ts, value, CASE WHEN n = 3 THEN ROUND(ma3, 3) END AS ma3
FROM w
WHERE sat_id = 'SAT-001'
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value |  ma3
---------+------------------------+-------+-------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 |
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 | 0.817
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 | 0.767
```

A `CASE` with no `ELSE` gives NULL when its condition fails, so the first two rows show an empty cell. (Strictly, CASE can test a window result directly in the same SELECT, since both live in the SELECT stage; the CTE keeps it readable.)

### Trailing and centered

The frame so far looks only backwards. That is a **trailing** moving average. It is the only kind you can compute live, as data arrives, because it never needs a sample that has not come in yet. Its cost is that it **[[lags behind|trailing-lag]]** real changes: when the charge drops suddenly, the average takes a few samples to follow.

For looking back at old data, you can put the current row in the middle instead. That is a **centered** moving average:

```sql
SELECT sat_id, ts, value,
       ROUND(AVG(value) OVER (PARTITION BY sat_id ORDER BY ts
                              ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING), 3) AS centred3
FROM soc
WHERE sat_id = 'SAT-001'
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value | centred3
---------+------------------------+-------+----------
 SAT-001 | 2026-03-01 00:00:00+00 |  0.90 |    0.875
 SAT-001 | 2026-03-01 00:10:00+00 |  0.85 |    0.817
 SAT-001 | 2026-03-01 00:20:00+00 |  0.70 |    0.767
 SAT-001 | 2026-03-01 00:30:00+00 |  0.75 |    0.725
```

**1 FOLLOWING** means "one row after the current one". Now both ends are short: the first row has no row before it, so it averages $(0.90 + 0.85)/2 = 0.875$, and the last has no row after it, so $(0.70 + 0.75)/2 = 0.725$. In the middle, 00:10 averages $(0.90 + 0.85 + 0.70)/3 = 0.817$.

The centered average is lined up with the thing it describes: the dip at 00:20 shows up as the lowest average around 00:20. But it uses a sample from the future, so it is for after-the-fact analysis, not for a live alarm.

### Any aggregate can move

AVG is only the most common. The same frame works with MIN, MAX, SUM and COUNT: "the highest temperature in the last five samples", "propellant used in the last three burns". When several columns share one window, write the window once and give it a name with the WINDOW clause from lesson 03. A frame can be part of the named window:

```sql
SELECT sat_id, ts, value,
       ROUND(AVG(value) OVER w3, 3) AS ma3,
       MIN(value) OVER w3 AS min3,
       MAX(value) OVER w3 AS max3,
       COUNT(*)   OVER w3 AS n
FROM soc
WHERE sat_id = 'SAT-003'
WINDOW w3 AS (PARTITION BY sat_id ORDER BY ts
              ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           | value |  ma3  | min3 | max3 | n
---------+------------------------+-------+-------+------+------+---
 SAT-003 | 2026-03-01 00:00:00+00 |  0.81 | 0.810 | 0.81 | 0.81 | 1
 SAT-003 | 2026-03-01 00:10:00+00 |  0.78 | 0.795 | 0.78 | 0.81 | 2
 SAT-003 | 2026-03-01 00:20:00+00 |  0.78 | 0.790 | 0.78 | 0.81 | 3
 SAT-003 | 2026-03-01 00:30:00+00 |  0.75 | 0.770 | 0.75 | 0.78 | 3
```

As in lesson 03, `WINDOW w3 AS (...)` goes after WHERE (and after GROUP BY and HAVING, if there are any) and before the final ORDER BY, and `OVER w3` means "over the window called w3". Writing the window once, frame and all, means the four columns cannot drift apart when someone edits one of them and forgets the others. On the last row the frame is 0.78, 0.78, 0.75, so the minimum 0.75 and maximum 0.78 are right, and the gap between them, 0.03, is a quick measure of how much the charge wandered in those three samples.

## Rows are not minutes

Look back at SAT-002 in the moving-average table. Its samples come at 00:00, 00:10, 00:20 and then 00:50: the sample that should have come at 00:30 and the one at 00:40 are missing. The three-sample frame on the 00:50 row therefore holds 00:10, 00:20 and 00:50. On SAT-001, three samples covered 20 minutes. On this row of SAT-002, three samples cover 40 minutes.

That is what ROWS means: it counts samples, whatever time they cover. If you meant "the average over the last 20 minutes", ROWS gave you the wrong window whenever a sample was late, missing, or extra. Telemetry is full of those: dropouts during a pass, faster sampling during an event, retransmissions. [[Drawn on a time line|rows-not-minutes]], the problem is plain.

::: warning A sample count is not a time span
`ROWS BETWEEN 2 PRECEDING AND CURRENT ROW` means "three samples", not "twenty minutes", even when the samples are usually ten minutes apart. Use ROWS when the count of samples is what you care about, or when you know the data is perfectly regular. When the window should be a length of time, you need a frame measured in time, which is the next lesson.
:::

## The same queries in SQLite

Everything in this lesson runs unchanged in SQLite, which the exercises use, including the `WINDOW` clause and ROWS frames. Timestamps stored as ISO-8601 text such as `'2026-03-05T11:30:00Z'` sort correctly as text, so `ORDER BY ts` inside OVER still means time order, as long as every row uses the same format.

The one visible difference is floating-point crumbs, as lesson 01 warned. With `prop_kg REAL`, SAT-001's third remaining value prints as `10.129999999999999` instead of `10.13`. Wrap outputs in `ROUND(..., 2)` for display, and compare with a tolerance when you test.

## Check yourself

::: check
Using the `burns` table, write down the `used_so_far` column for SAT-002 if the query were `SUM(prop_kg) OVER (PARTITION BY sat_id ORDER BY ts DESC)`, and say what that column means.
:::

::: answer
With `ORDER BY ts DESC` the "first" row of each partition is the newest burn, so the running total starts from the latest burn and works backwards in time. SAT-002's burns, newest first, are 0.55 (12 March), 0.25 (8 March) and 0.60 (3 March).

- 12 March: $0.55$
- 8 March: $0.55 + 0.25 = 0.80$
- 3 March: $0.80 + 0.60 = 1.40$

Each row now says "propellant used from this burn onward", including this burn. The oldest row carries the full total, 1.40 kg, which matches the forward version's last line, as it must.
:::

::: check
A teammate wants a five-sample moving maximum of battery temperature per satellite. Write the window clause, and say how many rows the frame holds on the second row of a partition.
:::

::: answer
Five samples means the current row plus four before it:

```sql
MAX(temp_c) OVER (PARTITION BY sat_id ORDER BY ts
                  ROWS BETWEEN 4 PRECEDING AND CURRENT ROW)
```

On the second row of a partition there is only one row before it, and the frame never reaches into another partition, so the frame holds **2 rows**. It reaches its full five on the fifth row.
:::

::: check
Without running it, give the `ma3` value for SAT-002 at 00:50 if the query had been written with `OVER (ORDER BY sat_id, ts ROWS BETWEEN 2 PRECEDING AND CURRENT ROW)` — no PARTITION BY. Then give the value at SAT-002's 00:00 row. Which one is wrong, and why?
:::

::: answer
Without a partition, all twelve rows form one long line ordered by satellite, then time. The frame on any row is itself and the two rows above it in that line.

- SAT-002 at 00:50: the two rows above are SAT-002 at 00:10 and 00:20, so $(0.55 + 0.60 + 0.63)/3 = 1.78/3 = 0.593$. Same as the partitioned answer, by luck.
- SAT-002 at 00:00: the two rows above are SAT-001 at 00:20 and 00:30, so $(0.70 + 0.75 + 0.50)/3 = 1.95/3 = 0.650$.

The 0.650 is wrong: it mixes two satellites' batteries into one average. The partitioned query correctly gives 0.500 there. Only the first two rows of each later satellite are affected, which is why this mistake can survive a quick glance.
:::

::: check
Why can a trailing moving average be computed live on a ground station as data arrives, when a centered one cannot? What does the trailing one pay for that?
:::

::: answer
A trailing frame, `n PRECEDING AND CURRENT ROW`, uses only the current sample and older ones. The moment a sample arrives, everything its average needs is already there.

A centered frame, `n PRECEDING AND n FOLLOWING`, needs $n$ samples that have not arrived yet. Its value for "now" can only be computed $n$ samples later.

The price of the trailing average is lag: because every sample in its frame is from now or earlier, it follows a sudden change a few samples late. With a three-sample frame, a sudden step in the charge takes three samples to show fully in the average.
:::

::: check
SAT-002's samples arrive at 00:00, 00:10, 00:20 and 00:50. A report says "20-minute moving average", and the query uses `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`. On which row is the report's label untrue, and how long a span does that row's frame actually cover?
:::

::: answer
On the 00:50 row. Its frame is the current row and the two rows before it: 00:10, 00:20 and 00:50. That spans from 00:10 to 00:50, which is **40 minutes**, twice what the label says. On the other rows the frame covers 20 minutes or less (0, 10 and 20 minutes on the first three rows). The query counted three samples; it never looked at the clock.
:::

## Summary

| Idea | SQL | What it gives |
| --- | --- | --- |
| Running total | `SUM(x) OVER (PARTITION BY k ORDER BY t)` | sum from the partition's first row to the current row |
| Running min / max | `MIN(x)` or `MAX(x)` with the same OVER | lowest or highest so far; only ever falls or rises |
| Share so far | running total ÷ `SUM(x) OVER (PARTITION BY k)` | fraction of the partition's total reached by this row |
| Frame clause | `ROWS BETWEEN a AND b` | which rows of the partition the function uses |
| Trailing moving average | `ROWS BETWEEN n PRECEDING AND CURRENT ROW` | average of this row and the $n$ before; $N$ samples means $n = N - 1$ |
| Centered moving average | `ROWS BETWEEN n PRECEDING AND n FOLLOWING` | no lag, but needs future rows |
| Warm-up | `COUNT(*) OVER` the same window | first rows of a partition have short frames |
| Named window | `WINDOW w AS (...)` then `OVER w` | one definition shared by several columns |
| ROWS counts samples | — | not a time span when samples are irregular |

Next lesson takes the frame clause apart completely: what the frame is when you write none at all, why that default makes LAST_VALUE look broken, and how a RANGE frame measures the window in minutes instead of rows.

::: context propellant-budget Propellant is a satellite's lifetime
A satellite cannot refuel, so the propellant loaded before launch is all it will ever have. It spends it raising its orbit, dodging debris, holding its slot, and finally lowering itself to burn up at the end of its life — and that last burn must be saved for. So operators keep a running total of propellant used for every satellite, and from it a remaining-propellant estimate. When the estimate reaches the amount reserved for disposal, the mission ends, however healthy the rest of the satellite is. The 12 kg in this lesson is an illustrative number, not any real satellite's load.
:::

::: context running-total-picture A running total is a staircase
Each burn adds a step. The height of the staircase after a step is the running total on that row. Here are SAT-001's four burns.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="160" x2="340" y2="160" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="160" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="34" y="164" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="34" y="37" font-size="11" fill="#1f2a44" text-anchor="end">2.67</text>
  <line x1="37" y1="33" x2="43" y2="33" stroke="#1f2a44" stroke-width="1"/>
  <path d="M40,160 L70,160 L70,140 L130,140 L130,88 L200,88 L200,71 L290,71 L290,33 L330,33" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g font-size="11" fill="#1f2a44">
    <text x="74" y="134">0.42</text>
    <text x="134" y="82">1.52</text>
    <text x="204" y="65">1.87</text>
    <text x="294" y="27">2.67</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="70" y="176">2 Mar</text>
    <text x="130" y="176">5 Mar</text>
    <text x="200" y="176">9 Mar</text>
    <text x="290" y="176">14 Mar</text>
  </g>
  <text x="100" y="114" font-size="11" fill="#b4232c">+1.10</text>
</svg>
```

The tallest step is the 1.10 kg burn on 5 March. Heights are to scale: each kilogram is about 48 pixels.
:::

::: context depth-of-discharge Why the lowest charge matters
**Depth of discharge** is how much of a battery's capacity was used before it was recharged. A battery run from 0.90 down to 0.70 has a depth of discharge of 0.20 of its capacity, or 20%. Lithium-ion cells last many more charge cycles when each cycle is shallow. A satellite in low Earth orbit goes through about fifteen or sixteen shadow periods a day, which is over five thousand cycles a year, so power engineers set a limit on depth of discharge and watch the running minimum of each orbit against it.
:::

::: context sliding-frame The frame slides down the rows
With `ROWS BETWEEN 2 PRECEDING AND CURRENT ROW`, each row's frame is the blue box: the row itself and the two above it. Shown for SAT-001 at 00:20 and at 00:30.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="85" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">current row 00:20</text>
  <text x="265" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">current row 00:30</text>
  <g stroke="#1f2a44" stroke-width="1">
    <rect x="25" y="26" width="120" height="22" fill="#8fb8f0"/>
    <rect x="25" y="48" width="120" height="22" fill="#8fb8f0"/>
    <rect x="25" y="70" width="120" height="22" fill="#1d6fd1"/>
    <rect x="25" y="92" width="120" height="22" fill="#ffffff"/>
    <rect x="205" y="26" width="120" height="22" fill="#ffffff"/>
    <rect x="205" y="48" width="120" height="22" fill="#8fb8f0"/>
    <rect x="205" y="70" width="120" height="22" fill="#8fb8f0"/>
    <rect x="205" y="92" width="120" height="22" fill="#1d6fd1"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="85" y="41">00:00  0.90</text><text x="85" y="63">00:10  0.85</text>
    <text x="85" y="85" fill="#ffffff">00:20  0.70</text><text x="85" y="107">00:30  0.75</text>
    <text x="265" y="41">00:00  0.90</text><text x="265" y="63">00:10  0.85</text>
    <text x="265" y="85">00:20  0.70</text><text x="265" y="107" fill="#ffffff">00:30  0.75</text>
  </g>
  <text x="85" y="134" font-size="12" fill="#1d6fd1" text-anchor="middle">avg 2.45 / 3 = 0.817</text>
  <text x="265" y="134" font-size="12" fill="#1d6fd1" text-anchor="middle">avg 2.30 / 3 = 0.767</text>
</svg>
```

One step down, the 0.90 falls out of the top of the frame and the 0.75 comes in at the bottom.
:::

::: context warm-up Why "warm-up"
Engineers borrowed the word from engines and instruments that read wrong until they have run for a while. A filter or average that needs $N$ samples is "warming up" until it has them. Signal-processing people call the same effect the filter's start-up transient. You meet it again whenever you smooth data in Python with NumPy or pandas: `pandas` rolling windows, for example, return empty values on those first rows unless you tell them a smaller count is acceptable — the same choice you made here with `CASE WHEN n = 3`.
:::

::: context trailing-lag How far behind a trailing average runs
Here the charge steps from 0.90 down to 0.60 and stays there. The three-sample trailing average (blue) needs three samples to catch up: 0.80, then 0.70, then 0.60.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="140" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="34" y="34">0.90</text><text x="34" y="124">0.60</text>
  </g>
  <path d="M60,30 L100,30 L140,30 L140,120 L180,120 L220,120 L260,120 L300,120" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <path d="M60,30 L100,30 L140,60 L180,90 L220,120 L260,120 L300,120" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#1d6fd1">
    <circle cx="60" cy="30" r="3"/><circle cx="100" cy="30" r="3"/><circle cx="140" cy="60" r="3"/>
    <circle cx="180" cy="90" r="3"/><circle cx="220" cy="120" r="3"/><circle cx="260" cy="120" r="3"/><circle cx="300" cy="120" r="3"/>
  </g>
  <g font-size="11" fill="#1d6fd1">
    <text x="146" y="56">0.80</text><text x="186" y="86">0.70</text>
  </g>
  <text x="240" y="158" font-size="11" fill="#6c7a93" text-anchor="middle">grey: the readings</text>
  <text x="110" y="158" font-size="11" fill="#1d6fd1" text-anchor="middle">blue: 3-sample average</text>
</svg>
```

That delay is why fast-acting alarms test the raw reading against a limit, and use the smoothed one only to spot slow trends.
:::

::: context rows-not-minutes Three samples, two different spans
Each dot is one SAT-002 sample. The three-sample frame at 00:20 spans 20 minutes; at 00:50, because of the missing samples, the same three-sample frame spans 40 minutes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="1.2"/>
  <g fill="#1f2a44">
    <circle cx="40" cy="60" r="4"/><circle cx="95" cy="60" r="4"/><circle cx="150" cy="60" r="4"/><circle cx="315" cy="60" r="4"/>
  </g>
  <g fill="none" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="3,3">
    <circle cx="205" cy="60" r="4"/><circle cx="260" cy="60" r="4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="82">00:00</text><text x="95" y="82">00:10</text><text x="150" y="82">00:20</text>
    <text x="315" y="82">00:50</text>
  </g>
  <g font-size="11" fill="#b4232c" text-anchor="middle">
    <text x="205" y="82">00:30</text><text x="260" y="82">00:40</text>
  </g>
  <rect x="32" y="40" width="126" height="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="0.8"/>
  <text x="95" y="34" font-size="11" fill="#1f2a44" text-anchor="middle">frame at 00:20: 20 min</text>
  <rect x="87" y="96" width="236" height="10" fill="#f2b880" stroke="#1f2a44" stroke-width="0.8"/>
  <text x="205" y="122" font-size="11" fill="#1f2a44" text-anchor="middle">frame at 00:50: 40 min</text>
</svg>
```

The dashed red circles are the samples that never arrived. ROWS cannot see that they are missing; it only counts the dots that are there.
:::
