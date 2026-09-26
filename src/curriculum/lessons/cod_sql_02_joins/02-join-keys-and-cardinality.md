---
id: l02-join-keys-and-cardinality
title: Join conditions and how many rows come out
minutes: 22
covers:
  - ON versus USING; why NATURAL JOIN is a trap
  - Join cardinality reasoning and the fan-out trap when aggregating after a one-to-many join
---

Last lesson you met six kinds of join, and every one matched rows with an `ON` condition you wrote out in full. This lesson asks two follow-up questions that decide whether a joined result can be trusted.

The first is **how you say what to match on**. `ON` is not the only way. SQL also offers `USING`, a shorthand that is often handy, and `NATURAL JOIN`, a shorthand that looks even handier and is a trap. You will see exactly how the trap springs.

The second is **how many rows come out**. A join can return fewer rows than either table, the same number, or far more than both. Knowing which, before you run the query, is the single most useful habit in join-writing. Almost every wrong number in a telemetry report that "looked fine" traces back to a join that made more rows than its author expected. This lesson gives you the counting rule; lesson 04 shows what those extra rows do to a SUM.

## ON: the condition, written out

`ON` takes any condition that is TRUE, FALSE or UNKNOWN — the same kind of thing you write after WHERE. A pair of rows is joined when the condition is TRUE.

```sql
SELECT *
FROM satellite AS s
JOIN reading AS r ON r.sat_id = s.sat_id
WHERE s.sat_id = 'SAT-003';
```

```text
 sat_id  |  name  | plane |  launched  | sat_id  |          ts          | channel  | value
---------+--------+-------+------------+---------+----------------------+----------+-------
 SAT-003 | Cirrus |     2 | 2025-09-14 | SAT-003 | 2026-03-02T00:00:00Z | BUS_TEMP |    11
(1 row)
```

`SELECT *` means "every column". With a join it gives every column of both tables, so `sat_id` appears twice: once from `s`, once from `r`. With an inner join on equal ids, the two copies always agree, which is harmless but untidy.

Because ON accepts any condition, it can do things no shorthand can:

- match columns with **different names**, like last lesson's `a.ref_id = c.event_id`;
- add extra tests to the match, like last lesson's `AND r.ts >= '2026-03-02T00:00:00Z'` inside a left join;
- match on something other than equality, like `a.sat_id < b.sat_id` in the self-join, or `r.ts BETWEEN w.start_ts AND w.end_ts` to pair each reading with the time window it fell in.

## USING: when the key has the same name on both sides

Very often the join column has the same name in both tables: `sat_id` in `satellite` and `sat_id` in `reading`. For that case SQL has a shorthand:

```sql
SELECT *
FROM satellite AS s
JOIN reading AS r USING (sat_id)
WHERE sat_id = 'SAT-003';
```

```text
 sat_id  |  name  | plane |  launched  |          ts          | channel  | value
---------+--------+-------+------------+----------------------+----------+-------
 SAT-003 | Cirrus |     2 | 2025-09-14 | 2026-03-02T00:00:00Z | BUS_TEMP |    11
(1 row)
```

Read `USING (sat_id)` as "join using the sat-id column that both tables have". It means exactly `ON s.sat_id = r.sat_id`, with one difference in the output: the two copies of `sat_id` are **merged into one column**. That is why `SELECT *` now shows `sat_id` once, and why the WHERE could say plain `sat_id` without the "ambiguous" error from last lesson.

A key made of several columns goes in the same parentheses. The tables `daily_downlink` (megabytes sent to the ground per satellite per day) and `daily_power` (watt-hours of solar energy collected per satellite per day) both have the key `(sat_id, day)`:

```sql
SELECT sat_id, day, d.mb, p.energy_wh
FROM daily_downlink AS d
JOIN daily_power AS p USING (sat_id, day)
ORDER BY sat_id, day;
```

```text
 sat_id  |    day     | mb  | energy_wh
---------+------------+-----+-----------
 SAT-001 | 2026-03-01 | 120 |       410
 SAT-001 | 2026-03-02 |  90 |       380
 SAT-002 | 2026-03-01 | 150 |       395
(3 rows)
```

In an outer join the merged column is especially handy. Its value is whichever side's copy is not NULL — the `COALESCE(s.sat_id, c.sat_id)` you wrote by hand last lesson. Here is last lesson's reconciliation of the fleet against the contact plan, with USING:

```sql
SELECT sat_id, s.name, c.station
FROM satellite AS s
FULL JOIN contact_plan AS c USING (sat_id)
ORDER BY sat_id, c.station;
```

```text
 sat_id  |   name   | station
---------+----------+----------
 SAT-001 | Aurora   | Svalbard
 SAT-002 | Borealis | Hawaii
 SAT-002 | Borealis | Svalbard
 SAT-003 | Cirrus   | Hawaii
 SAT-004 | Dorado   |
 SAT-009 |          | Svalbard
(6 rows)
```

One `sat_id` column, filled in on every row: SAT-004 from the fleet side, SAT-009 from the plan side.

::: key ON versus USING
`ON condition` accepts any condition: different column names, extra tests, inequalities. `USING (col, …)` is shorthand for equality on columns with the same name in both tables, and it merges each pair into one output column (in an outer join, whichever side is not NULL). Both state the join key out loud.
:::

`USING` works the same way in PostgreSQL and SQLite. Many style guides prefer `ON` everywhere, for one reason: it always shows which table each side comes from. Either is fine. The thing both do, and the next shorthand does not, is **name the key**.

## NATURAL JOIN: the key nobody wrote down

[[`NATURAL JOIN`|natural-origin]] goes one step further. It looks at the two tables, finds **every** column name they have in common, and joins on all of them — as if you had written USING with that whole list. You never name a column.

```sql
SELECT *
FROM satellite NATURAL JOIN reading
WHERE sat_id = 'SAT-003';
```

Today that returns the same row as the USING version, because today `sat_id` is the only name the two tables share. That word "today" is the whole problem.

::: example The column that broke the join
**The setup.** A dashboard query counts joined rows:

```sql
SELECT COUNT(*) FROM satellite NATURAL JOIN reading;
```

```text
 count
-------
     6
(1 row)
```

Six readings, each paired with its satellite. Correct.

**The change.** Months later, a platform engineer adds an [[audit column|audit-columns]] to every table in the database: `created_at`, the moment the row was stored. It is a sensible change that has nothing to do with this query:

```sql
ALTER TABLE satellite ADD COLUMN created_at TEXT;
ALTER TABLE reading   ADD COLUMN created_at TEXT;
UPDATE satellite SET created_at = '2026-02-27T09:00:00Z';
UPDATE reading   SET created_at = '2026-03-02T04:00:00Z';
```

(`ALTER TABLE … ADD COLUMN` adds a column to an existing table; `UPDATE … SET` changes values in rows that are already there.)

**The same query again:**

```text
 count
-------
     0
(1 row)
```

**What happened.** The two tables now share *two* names, `sat_id` and `created_at`, so `NATURAL JOIN` now means `USING (sat_id, created_at)`. A satellite row was stored on 27 February, and its readings were stored on 2 March. No pair has equal `created_at`, so no pair matches. Nobody touched the query, no error was raised, and the dashboard now says the fleet sent nothing.

**The version that survived:**

```sql
SELECT COUNT(*) FROM satellite JOIN reading USING (sat_id);
```

```text
 count
-------
     6
(1 row)
```

It named its key, so an unrelated new column could not change what it meant. The same thing happens, row for row, in SQLite.
:::

The failure can go the other way too. If two tables share **no** column names, `NATURAL JOIN` has nothing to match on and quietly becomes a cross join: `satellite NATURAL JOIN channel` returns all $4 \times 2 = 8$ pairings. And if the added column had happened to hold equal values on both sides, rows would match only by coincidence, and you might not notice for months.

::: key Why avoid NATURAL JOIN?
It joins on every column that happens to share a name, so adding an unrelated column called created_at to both tables silently changes the join condition and the result. Always state the join key.
:::

::: warning A review cannot catch what is not written
When someone reviews a change that adds a `created_at` column, they look at the table, not at every query in the company that mentions it. A `NATURAL JOIN` makes the join key a side effect of how columns happen to be named. `ON` and `USING` put the key in the query text, where the person changing it can see it.
:::

## How many rows come out?

Now the second question. Before running any join, you should be able to say roughly how many rows it will return, and why. The answer depends on the **[[cardinality|cardinality-word]]** of the relationship — how many rows on each side can share one value of the join key.

Think about people and things they own. Each person has one passport, and each passport belongs to one person: **one-to-one**. A person can own many socks, but each sock has one owner: **one-to-many**. A person can belong to many clubs, and a club has many members: **many-to-many**.

The fleet database has all three:

- **One-to-one.** `daily_downlink` and `daily_power`, joined on their whole key `(sat_id, day)`. Each satellite-day appears at most once in each table.
- **One-to-many.** `satellite` to `reading`, joined on `sat_id`. A satellite has many readings; a reading has one satellite. The "one" side is `satellite`, because `sat_id` is its primary key — it cannot repeat there.
- **Many-to-many.** Satellites and ground stations. A satellite can be booked with several stations (Borealis has two passes), and a station talks to many satellites. The table in the middle, `contact_plan`, holds one row per pairing. A middle table like that is called a **[[junction table|junction]]**.

How do you tell which side is "one"? Look for a **[[uniqueness guarantee|unique-guarantee]]** on the join columns: a primary key, or a `UNIQUE` constraint. If the join columns of a table are its key, each value appears there at most once, and that table is a "one" side. If there is no such guarantee, assume "many" — even if the data you are looking at happens to have no repeats today.

::: key Cardinality of a join
The cardinality of a relationship says how many rows on each side can share one join-key value: one-to-one, one-to-many, or many-to-many. A side is a "one" side only when its join columns are guaranteed unique (a primary key or UNIQUE constraint).
:::

### The counting rule

Here is [[the rule|counting-picture]] that predicts an inner join's size. Group each table by the join key. For each key value, the join produces every pairing of that value's rows on the left with that value's rows on the right:

$$
\text{rows out} = \sum_{k} n_A(k) \times n_B(k)
$$

Read it aloud as: "the sum, over every key value $k$, of the number of A rows with key $k$ times the number of B rows with key $k$". The $\sum$ (the Greek capital sigma) means "add up over all the values". A key value missing from either side contributes $0$, because anything times zero is zero.

Apply it to `satellite JOIN reading`. Each `sat_id` appears once in `satellite`, and 3, 2, 1 and 0 times in `reading`:

$$
1 \times 3 + 1 \times 2 + 1 \times 1 + 1 \times 0 = 6
$$

Six rows, as last lesson found. For a left join, add one row for each left key value with no partner: Dorado adds 1, giving 7 — also as last lesson found.

Three consequences are worth memorising:

- **A "one" side on the right can never multiply the left.** If B's join columns are unique, every $n_B(k)$ is 0 or 1, so an inner join returns *at most* as many rows as A has, and a left join returns *exactly* as many. That is why labelling readings with satellite names kept exactly six readings.
- **The "one" side's rows get repeated.** In the same join, Aurora's single satellite row appears three times, once per reading. That repetition is called **fan-out** — one row fanning out into several.
- **Many-to-many multiplies.** When both $n_A(k)$ and $n_B(k)$ can exceed 1, the output for that key is their product, which can be far larger than either table.

::: example Predicting a many-to-many join
**Question.** How many rows does this join return?

```sql
SELECT r.sat_id, r.ts AS reading_ts, b.burn_id
FROM reading AS r
JOIN burn AS b ON b.sat_id = r.sat_id
ORDER BY r.sat_id, r.ts, b.burn_id;
```

The `burn` table logs thruster firings — one row per burn, with its own `burn_id` key:

```text
 burn_id | sat_id  |          ts          | propellant_kg
---------+---------+----------------------+---------------
       1 | SAT-001 | 2026-03-01T03:00:00Z |           1.2
       2 | SAT-001 | 2026-03-02T03:00:00Z |           1.2
       3 | SAT-002 | 2026-03-01T09:00:00Z |           1.5
```

**Count per key.** Neither side is unique on `sat_id`: a satellite has many readings *and* may have many burns. So use the rule.

| sat_id | readings $n_r$ | burns $n_b$ | rows $n_r \times n_b$ |
| --- | --- | --- | --- |
| SAT-001 | 3 | 2 | 6 |
| SAT-002 | 2 | 1 | 2 |
| SAT-003 | 1 | 0 | 0 |

Total: $6 + 2 + 0 = 8$ rows.

**Run it:**

```text
 sat_id  |      reading_ts      | burn_id
---------+----------------------+---------
 SAT-001 | 2026-03-01T00:00:00Z |       1
 SAT-001 | 2026-03-01T00:00:00Z |       2
 SAT-001 | 2026-03-01T06:00:00Z |       1
 SAT-001 | 2026-03-01T06:00:00Z |       2
 SAT-001 | 2026-03-02T01:00:00Z |       1
 SAT-001 | 2026-03-02T01:00:00Z |       2
 SAT-002 | 2026-03-01T00:00:00Z |       3
 SAT-002 | 2026-03-01T12:00:00Z |       3
(8 rows)
```

**Check.** Eight, as predicted. Look at what the rows mean: every reading paired with every burn of the same satellite, whether or not they have anything to do with each other. A reading taken before a burn is paired with it anyway. Each reading shows up once per burn, and each burn shows up once per reading — both sides have fanned out. Adding up `propellant_kg` over these rows would count SAT-001's burns three times each. Lesson 04 is about exactly that.
:::

## The incomplete key

The most common way to create a many-to-many join by accident is to join on **part of a key**. `daily_downlink` and `daily_power` are one-to-one on `(sat_id, day)`. Drop `day` from the condition and each is only unique on the pair, not on `sat_id` alone.

::: example Joining on half the key
**Wrong:**

```sql
SELECT d.sat_id, d.day, d.mb, p.day AS p_day, p.energy_wh
FROM daily_downlink AS d
JOIN daily_power AS p ON p.sat_id = d.sat_id
ORDER BY d.sat_id, d.day, p.day;
```

```text
 sat_id  |    day     | mb  |   p_day    | energy_wh
---------+------------+-----+------------+-----------
 SAT-001 | 2026-03-01 | 120 | 2026-03-01 |       410
 SAT-001 | 2026-03-01 | 120 | 2026-03-02 |       380
 SAT-001 | 2026-03-02 |  90 | 2026-03-01 |       410
 SAT-001 | 2026-03-02 |  90 | 2026-03-02 |       380
 SAT-002 | 2026-03-01 | 150 | 2026-03-01 |       395
(5 rows)
```

**Count it with the rule.** Per `sat_id`: SAT-001 has 2 rows in each table, giving $2 \times 2 = 4$; SAT-002 has 1 and 1, giving 1. Total 5 — two more than the 3 satellite-days that exist. The middle two rows pair 1 March's downlink with 2 March's power and the other way round: they describe days that never happened.

**Right:** join on the whole key, `USING (sat_id, day)` as earlier in this lesson, and every $n$ is 0 or 1 again. Three rows.

**Check.** Both tables have 3 rows and share all three keys, so a one-to-one join must return exactly 3. Five is impossible, which is how you know the join is wrong before you even look at the rows.
:::

::: warning Join on the whole key
A composite key such as `(sat_id, day)` is unique only as a whole. Join on part of it and a one-to-one relationship turns many-to-many. Write down the key of each table before joining, and make sure the join condition names every column of the key on the side you expect to be "one".
:::

## A habit: count before and after

The counting rule is only as good as your knowledge of the keys, and real tables surprise people. So [[check with data|pipeline-tests]], twice.

**Before joining**, test whether the side you think is "one" really is unique on the join columns. This uses GROUP BY and HAVING, which you met at the end of the last module and which next lesson teaches in full:

```sql
SELECT sat_id, COUNT(*) AS n
FROM contact_plan
GROUP BY sat_id
HAVING COUNT(*) > 1;
```

```text
 sat_id  | n
---------+---
 SAT-002 | 2
(1 row)
```

Any row here means `contact_plan` is *not* unique on `sat_id`. Joining it to readings would double every one of Borealis's readings.

**After joining**, compare the row count with what you predicted. If you joined readings to a table you believed was a "one" side, the count must equal the number of readings (for an inner join, no more). If it went up, something fanned out.

::: key Predict, then check
Before a join, name each side's key and say whether the join is one-to-one, one-to-many or many-to-many. Predict the row count with $\sum_k n_A(k)\,n_B(k)$. After the join, compare the real count with the prediction. A count that rose where it should have stayed the same means fan-out.
:::

Fan-out is not a bug by itself. Labelling six readings with satellite names *must* repeat Aurora's name three times; that is what the question asks for. It becomes a bug when you **add things up** afterwards, and the repeated rows get counted as if they were separate. Lesson 04 shows that trap and the ways out of it. First, next lesson teaches the adding-up itself.

## Check yourself

::: check
Rewrite `FROM daily_downlink AS d JOIN daily_power AS p ON p.sat_id = d.sat_id AND p.day = d.day` using USING. How many `day` columns does `SELECT *` return in each version?
:::

::: answer
`FROM daily_downlink AS d JOIN daily_power AS p USING (sat_id, day)`.

With ON, `SELECT *` returns every column of both tables, so `sat_id` and `day` each appear twice (`d.day` and `p.day`). With USING, each named column is merged, so `sat_id` and `day` appear once each, followed by `mb` and `energy_wh`.
:::

::: check
The `event_log` self-join from last lesson matched `a.ref_id = c.event_id`. Could it be written with USING? With NATURAL JOIN?
:::

::: answer
No to both. USING needs the join columns to have the same name on both sides, and here one side is `ref_id` and the other is `event_id`. It also added `a.kind = 'ACK'` to the match, which only ON can hold.

NATURAL JOIN of a table with itself shares *every* column name, so it would require all five columns to be equal — each row would match only itself. Only ON expresses this join.
:::

::: check
A table `pass` has one row per ground-station pass, with its own key `pass_id` and a `sat_id`. In a week, Aurora has 30 passes and 4,000 readings, Borealis 25 passes and 3,500 readings. How many rows does `reading JOIN pass ON pass.sat_id = reading.sat_id` return for those two satellites?
:::

::: answer
Neither side is unique on `sat_id`, so it is many-to-many and the rule multiplies per key:

$$
4000 \times 30 + 3500 \times 25 = 120000 + 87500 = 207500
$$

About 207,500 rows from 7,500 readings and 55 passes. Every reading is paired with every pass of the same satellite, whether or not it was taken during that pass. To pair a reading with the pass it fell in, the ON condition also needs a time test, such as `reading.ts >= pass.start_ts AND reading.ts < pass.end_ts`.
:::

::: check
A colleague says: "`satellite LEFT JOIN reading` can never return fewer rows than `satellite` has, and `reading LEFT JOIN satellite` always returns exactly as many rows as `reading` has." Is each half right? Why?
:::

::: answer
Both halves are right.

A left join keeps every left row at least once, so `satellite LEFT JOIN reading` returns at least 4 rows. (It returns 7, because satellites with several readings fan out.)

In `reading LEFT JOIN satellite`, the right side is joined on `sat_id`, which is `satellite`'s primary key. So each reading matches at most one satellite, never two, and the left join keeps it even if it matched none. Exactly one row per reading: 6.
:::

::: check
Why is `satellite NATURAL JOIN channel` a cross join, and why would `reading NATURAL JOIN channel` not be?
:::

::: answer
`satellite` has columns `sat_id, name, plane, launched` and `channel` has `channel, units`. No name is shared, so NATURAL JOIN has no condition at all, and every satellite pairs with every channel: $4 \times 2 = 8$ rows.

`reading` has a column named `channel`, the same as the `channel` table's column. So `reading NATURAL JOIN channel` joins on `channel` — each reading gets its channel's units. It happens to be the join you wanted, which is exactly why NATURAL JOIN is dangerous: whether it is right depends on names nobody chose with the join in mind.
:::

## Summary

| Idea | In one line |
| --- | --- |
| `ON condition` | any condition; different names, extra tests, inequalities |
| `USING (col, …)` | equality on same-named columns; merges each into one output column |
| `NATURAL JOIN` | joins on every shared column name; a new column silently changes it; no shared names gives a cross join |
| One-to-one | each key value at most once on both sides |
| One-to-many | unique on one side (a key), repeated on the other |
| Many-to-many | repeated on both sides; usually connected through a junction table |
| Counting rule | inner join rows $= \sum_k n_A(k)\,n_B(k)$; a left join adds one row per unmatched left row |
| Fan-out | the "one" side's row repeated once per matching row on the other side |
| Incomplete key | joining on part of a composite key turns one-to-one into many-to-many |
| Habit | predict the row count; check uniqueness with `GROUP BY … HAVING COUNT(*) > 1`; compare after |

Next lesson turns many rows into few: GROUP BY, HAVING and the aggregates COUNT, SUM, AVG, MIN and MAX. With those in hand, lesson 04 returns to fan-out and shows what it does to a total.

::: context natural-origin Where "natural join" comes from
The natural join is older than SQL. Edgar F. Codd, the IBM researcher who invented the relational model around 1970, described a small set of operations on tables, and one of them combined two tables on their shared attributes. In the mathematics that made sense: an attribute's name *was* its meaning, so two columns with the same name had to be the same thing. Real schemas break that assumption constantly. Columns like `id`, `name`, `status` and `created_at` appear in dozens of unrelated tables, meaning different things in each.
:::

::: context audit-columns Columns every table grows
Data teams often add the same bookkeeping columns to every table: when the row was created, when it was last changed, which job or person wrote it. They answer questions like "when did this reading reach the ground?" — which for a satellite that stores data during a long gap between ground passes can be hours after it was measured. They are exactly the kind of column that appears in many tables at once, with the same name and unrelated values, which is what makes them lethal to a natural join.
:::

::: context cardinality-word Cardinality means "how many"
In mathematics the **cardinality** of a set is the number of things in it; "cardinal numbers" are the counting numbers one, two, three. Database people borrowed the word for "how many rows on one side can go with one row on the other". The three shapes, drawn as rows with a line for each pairing:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="18">one-to-one</text>
    <text x="180" y="18">one-to-many</text>
    <text x="300" y="18">many-to-many</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="30" y1="45" x2="90" y2="45"/><line x1="30" y1="80" x2="90" y2="80"/><line x1="30" y1="115" x2="90" y2="115"/>
    <line x1="150" y1="62" x2="210" y2="40"/><line x1="150" y1="62" x2="210" y2="70"/><line x1="150" y1="62" x2="210" y2="100"/>
    <line x1="150" y1="110" x2="210" y2="130"/>
    <line x1="270" y1="50" x2="330" y2="50"/><line x1="270" y1="50" x2="330" y2="110"/>
    <line x1="270" y1="110" x2="330" y2="50"/><line x1="270" y1="110" x2="330" y2="110"/>
  </g>
  <g fill="#1f2a44">
    <circle cx="30" cy="45" r="5"/><circle cx="30" cy="80" r="5"/><circle cx="30" cy="115" r="5"/>
    <circle cx="90" cy="45" r="5"/><circle cx="90" cy="80" r="5"/><circle cx="90" cy="115" r="5"/>
    <circle cx="150" cy="62" r="5"/><circle cx="150" cy="110" r="5"/>
    <circle cx="210" cy="40" r="5"/><circle cx="210" cy="70" r="5"/><circle cx="210" cy="100" r="5"/><circle cx="210" cy="130" r="5"/>
    <circle cx="270" cy="50" r="5"/><circle cx="270" cy="110" r="5"/>
    <circle cx="330" cy="50" r="5"/><circle cx="330" cy="110" r="5"/>
  </g>
</svg>
```

On the left every dot has one line. In the middle, a left dot may have many lines but every right dot has exactly one. On the right, dots on both sides have several.
:::

::: context junction Tables in the middle
A relational table cannot store a list inside one cell, so a many-to-many relationship gets a table of its own. Each row of the junction table records one pairing, and it has a foreign key to each side. `contact_plan` is one: each row says "this satellite, this station". Joining satellite to station goes through it, which is two one-to-many joins in a row.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="50" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">satellite</text>
  <text x="180" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">contact_plan</text>
  <text x="310" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">station</text>
  <g stroke="#1f2a44" stroke-width="1" font-size="11" fill="#1f2a44">
    <rect x="10" y="28" width="80" height="24" fill="#8fb8f0"/>
    <rect x="10" y="60" width="80" height="24" fill="#8fb8f0"/>
    <rect x="10" y="92" width="80" height="24" fill="#8fb8f0"/>
    <rect x="130" y="28" width="100" height="22" fill="#ffffff"/>
    <rect x="130" y="54" width="100" height="22" fill="#ffffff"/>
    <rect x="130" y="80" width="100" height="22" fill="#ffffff"/>
    <rect x="130" y="106" width="100" height="22" fill="#ffffff"/>
    <rect x="270" y="44" width="80" height="24" fill="#f2b880"/>
    <rect x="270" y="88" width="80" height="24" fill="#f2b880"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="44">Aurora</text><text x="50" y="76">Borealis</text><text x="50" y="108">Cirrus</text>
    <text x="180" y="43">001 · Svalbard</text><text x="180" y="69">002 · Svalbard</text>
    <text x="180" y="95">002 · Hawaii</text><text x="180" y="121">003 · Hawaii</text>
    <text x="310" y="60">Svalbard</text><text x="310" y="104">Hawaii</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="90" y1="40" x2="130" y2="39"/>
    <line x1="90" y1="72" x2="130" y2="65"/>
    <line x1="90" y1="72" x2="130" y2="91"/>
    <line x1="90" y1="104" x2="130" y2="117"/>
    <line x1="230" y1="39" x2="270" y2="56"/>
    <line x1="230" y1="65" x2="270" y2="56"/>
    <line x1="230" y1="91" x2="270" y2="100"/>
    <line x1="230" y1="117" x2="270" y2="100"/>
  </g>
</svg>
```

Borealis has two lines out; Svalbard and Hawaii have two lines in each. (The orphan SAT-009 row is left out of the drawing.) That is many-to-many, made of one-to-many links.
:::

::: context unique-guarantee Declaring that a column cannot repeat
A primary key is one way to promise uniqueness. Another is a `UNIQUE` constraint, written in the table definition like `UNIQUE (sat_id, day)` or on a single column as `sat_id TEXT UNIQUE`. The database then refuses any insert that would repeat a value, and it builds an index to check quickly. When you reason about a join, only such a declared promise counts. "There are no duplicates in the data right now" is an observation about today, and tomorrow's load may break it.
:::

::: context counting-picture The counting rule as a grid
For one key value, the inner join makes every pairing of that key's left rows with its right rows — a little grid. SAT-001 has 3 readings and 2 burns, so its grid has $3 \times 2 = 6$ cells, and each cell is one output row. The join's total is the sum of all the grids.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="180" y="16" font-size="12" fill="#1f2a44" text-anchor="middle">SAT-001: 3 readings × 2 burns = 6 rows</text>
  <g font-size="11" fill="#1f2a44">
    <text x="16" y="62">1 Mar 00:00</text>
    <text x="16" y="94">1 Mar 06:00</text>
    <text x="16" y="126">2 Mar 01:00</text>
    <text x="170" y="38" text-anchor="middle">burn 1</text>
    <text x="270" y="38" text-anchor="middle">burn 2</text>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="120" y="46" width="100" height="26"/><rect x="220" y="46" width="100" height="26"/>
    <rect x="120" y="78" width="100" height="26"/><rect x="220" y="78" width="100" height="26"/>
    <rect x="120" y="110" width="100" height="26"/><rect x="220" y="110" width="100" height="26"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="170" y="63">row 1</text><text x="270" y="63">row 2</text>
    <text x="170" y="95">row 3</text><text x="270" y="95">row 4</text>
    <text x="170" y="127">row 5</text><text x="270" y="127">row 6</text>
  </g>
</svg>
```

Down each column, one burn appears three times; along each row, one reading appears twice. Both sides fanned out.
:::

::: context pipeline-tests Automatic checks in real pipelines
Teams that run SQL pipelines for a living do not rely on remembering to check. Tools such as dbt let you attach tests to a table: "this column is unique", "this column is never NULL", "every value here exists in that other table". The tests run every time the pipeline does, and a failure stops bad data before it reaches a dashboard. The uniqueness query in this section is, underneath, what such a test runs.
:::
