---
id: l07-time-in-the-database
title: "Time: TIMESTAMPTZ, intervals and UTC"
minutes: 22
covers:
  - TIMESTAMPTZ versus TIMESTAMP, intervals, and why aerospace stores UTC
---

Every row of telemetry carries a time. A battery reading means nothing until you know *when* it was taken, and an anomaly report begins "at 13:10 the bus temperature went above 45 degrees". Time is the column you will filter, sort and subtract more than any other.

It is also the column that goes wrong most quietly. A time can be stored so that it means one instant in California and another in Tokyo, or as a number that rounds away the last few milliseconds. Neither raises an error. Both give you a plausible answer that is wrong.

In the last lesson you chose between INTEGER, NUMERIC and REAL. This lesson finishes the job for time: PostgreSQL's two timestamp types, which one a fleet database uses and why, arithmetic with **intervals** (lengths of time), and how the same work is done in SQLite, where the course's exercises run.

## Two kinds of "3 o'clock"

Suppose a friend texts you: "Call me at 3:00." If you both live in the same town, that is fine. If your friend is in London and you are in Los Angeles, it is not. Their 3:00 and your 3:00 are eight hours apart. The words "3:00" are a **[[wall-clock reading|wall-clock]]** — what a clock on the wall shows — and a wall-clock reading only picks out a moment once you know *which* wall.

Now suppose instead your friend says: "Call me in exactly five hours." That picks out one moment for everybody on Earth, no matter which clock they look at. It names an **instant** — one single point in time, the same everywhere.

Databases have a type for each idea, and mixing them up is the classic time bug.

- **TIMESTAMP** (in full, `TIMESTAMP WITHOUT TIME ZONE`) stores a wall-clock reading: a date and a time of day, and nothing else. It does not know which wall.
- **TIMESTAMPTZ** (in full, `TIMESTAMP WITH TIME ZONE`, read "timestamp T Z") stores an instant. When you type a time in, PostgreSQL uses the time zone you give (or the session's time zone) to work out which instant you mean. It stores that instant. When it shows the time back to you, it converts it into your session's time zone.

::: key TIMESTAMPTZ versus TIMESTAMP
TIMESTAMPTZ records an absolute instant and converts on input and output using a time zone; TIMESTAMP is a wall-clock reading with no zone, so the same value means different instants in different places. Aerospace stores UTC in a zone-aware type.
:::

### Watching the two types behave differently

Watch it happen. Here is a table of ground-station passes with the same moment stored both ways. A **time zone** is a region's rule for how far its clocks sit from UTC; the **session time zone** is the one your connection to the database is set to, and you can change it with `SET TIME ZONE`.

```sql
CREATE TABLE pass_log (
  pass_id   INTEGER PRIMARY KEY,
  aos_local TIMESTAMP,     -- wall-clock reading, no zone
  aos_utc   TIMESTAMPTZ    -- an instant
);

SET TIME ZONE 'UTC';
INSERT INTO pass_log VALUES (1, '2026-03-01 14:05:00', '2026-03-01 14:05:00+00');
SELECT * FROM pass_log;
```

```text
 pass_id |      aos_local      |        aos_utc
---------+---------------------+------------------------
       1 | 2026-03-01 14:05:00 | 2026-03-01 14:05:00+00
```

The `+00` on the end of the second column is an **offset**: how many hours this reading sits ahead of UTC. Plus zero means "this is UTC itself". (AOS stands for **[[acquisition of signal|aos-los]]**, the moment a ground antenna first hears the satellite.)

Now change only the session's time zone and ask again. Nothing in the table is touched.

```sql
SET TIME ZONE 'America/Los_Angeles';
SELECT * FROM pass_log;
```

```text
 pass_id |      aos_local      |        aos_utc
---------+---------------------+------------------------
       1 | 2026-03-01 14:05:00 | 2026-03-01 06:05:00-08
```

```sql
SET TIME ZONE 'Asia/Tokyo';
SELECT * FROM pass_log;
```

```text
 pass_id |      aos_local      |        aos_utc
---------+---------------------+------------------------
       1 | 2026-03-01 14:05:00 | 2026-03-01 23:05:00+09
```

Read the right-hand column across the three results: 14:05 in UTC, 06:05 in Los Angeles (eight hours behind, so `-08`), 23:05 in Tokyo (nine hours ahead, so `+09`). Those are three ways of writing **one** instant. The satellite came over the horizon once, and every engineer sees that one moment on their own clock.

The left-hand column says 14:05 to everybody. To the engineer in Tokyo it looks like 14:05 Tokyo time — nine hours away from when the pass happened. The TIMESTAMP column has thrown away the one fact that made it an instant.

::: note How PostgreSQL stores a TIMESTAMPTZ
The name suggests the column stores a time zone next to each value. It does not. PostgreSQL converts your input to UTC and stores a single 8-byte integer: the number of microseconds since midnight UTC on 1 January 2000. That is why the column can show the same row as `+00`, `-08` or `+09`. The zone is applied only when the value is printed. It is also why the resolution is exactly one **[[microsecond|microsecond]]** (a millionth of a second): PostgreSQL rounds anything finer. `TIMESTAMPTZ '2026-03-01 14:05:00.123456789+00'` comes back as `14:05:00.123457+00`.
:::

### Where the zone on input comes from

When you type a TIMESTAMPTZ value, PostgreSQL decides which instant you mean in this order:

1. An offset written in the text, like `+00`, `-08` or `Z` (Z means UTC).
2. A zone name written in the text, like `America/Los_Angeles`.
3. If there is neither, the session's time zone.

That third rule is a trap. The same characters become different instants depending on how the connection happens to be set up:

```sql
SET TIME ZONE 'America/Los_Angeles';
SELECT '2026-03-01 14:05:00'::timestamptz AS no_offset_given;
-- 2026-03-01 14:05:00-08

SET TIME ZONE 'UTC';
SELECT '2026-03-01 14:05:00'::timestamptz AS no_offset_given;
-- 2026-03-01 14:05:00+00
```

The first is 22:05 UTC; the second is 14:05 UTC. Eight hours apart, from identical text. (The `::timestamptz` after the string is PostgreSQL's short way of writing `CAST(… AS TIMESTAMPTZ)`, which you met last lesson.)

::: warning Always write the offset
When you type a timestamp into a query or a loader script, end it with `Z` or `+00`. Then the value means the same instant no matter whose laptop runs the script. `'2026-03-02 00:00:00+00'` is safe. `'2026-03-02 00:00:00'` is a guess about the session.
:::

The opposite mistake is quieter still. Cast a string that *has* an offset into plain TIMESTAMP, and PostgreSQL throws the offset away without a word:

```sql
SELECT '2026-03-01 14:05:00-08'::timestamp AS offset_dropped;
-- 2026-03-01 14:05:00
```

The `-08` is gone. Nothing now tells you this was Los Angeles time.

### Converting on purpose: AT TIME ZONE

Sometimes you do want a wall-clock reading — say, for the Los Angeles operations screen. The operator `AT TIME ZONE` converts between the two types. Read it aloud as it looks: "this instant, at time zone Los Angeles".

```sql
SELECT TIMESTAMPTZ '2026-03-01 14:05:00+00' AT TIME ZONE 'America/Los_Angeles';
-- 2026-03-01 06:05:00      (a TIMESTAMP: the LA wall clock at that instant)

SELECT TIMESTAMP '2026-03-01 06:05:00' AT TIME ZONE 'America/Los_Angeles';
-- 2026-03-01 14:05:00+00   (a TIMESTAMPTZ: the instant when LA clocks read 06:05)
```

Instant in, wall clock out, and back. Convert only for display; keep the stored data as instants.

## Why aerospace stores UTC

**UTC** — **[[Coordinated Universal Time|utc-name]]** — is the world's reference clock. It is what the clock at the Greenwich meridian in London shows in winter. Every civil time zone is defined as an offset from it.

A satellite sweeps over the whole planet about every 95 minutes. It talks to ground stations in Alaska, Norway, Australia and Chile, and its data is read by engineers in several cities. No "local" time makes sense for it. So the whole industry agrees: **store every timestamp in UTC**, and convert to a local clock only on a screen meant for one person.

UTC has two more properties that make it the right choice.

- **No daylight saving.** Many zones jump their clocks forward one hour in spring and back one hour in autumn. In Los Angeles in 2026, clocks jump from 02:00 straight to 03:00 on 8 March, and on 1 November they run from 01:00 to 02:00 **[[twice|dst]]**. A local wall-clock column can hold times that never happened and times that happened twice. UTC never jumps.
- **It lines up with the spacecraft.** Onboard clocks usually count GPS time or seconds from a fixed start. Those convert to UTC by a fixed, published rule — not by a political calendar of daylight-saving dates.

Here is the daylight-saving problem in a query. In a session set to Los Angeles, "one day later" and "24 hours later" differ across the spring jump:

```sql
SET TIME ZONE 'America/Los_Angeles';
SELECT TIMESTAMPTZ '2026-03-07 12:00:00' + INTERVAL '1 day'    AS plus_1_day,
       TIMESTAMPTZ '2026-03-07 12:00:00' + INTERVAL '24 hours' AS plus_24_hours;
```

```text
       plus_1_day       |     plus_24_hours
------------------------+------------------------
 2026-03-08 12:00:00-07 | 2026-03-08 13:00:00-07
```

"Noon tomorrow" was only 23 hours away, because that night had only 23 hours. Run the same query with the session in UTC and both columns say `2026-03-08 12:00:00+00`. In UTC, a day is always 24 hours (apart from rare **[[leap seconds|leap-seconds]]**, which PostgreSQL ignores).

::: example A pass logged in local time
A ground station in Los Angeles logs the start of a pass as `2026-03-01 06:05:00` in a plain TIMESTAMP column. A station in Tokyo logs the start of the *next* pass of the same satellite as `2026-03-01 23:10:00`, also plain TIMESTAMP. How long between the two passes?

**The naive subtraction.** Subtracting the columns gives $23{:}10 - 06{:}05 = 17$ hours $5$ minutes. For a satellite that goes around every 95 minutes, 17 hours is absurd. That is the sanity check firing.

**The fix: attach each reading's zone, then subtract.** Convert each wall-clock reading to an instant.

- Los Angeles was UTC minus 8 hours in March: $06{:}05 + 8\,\mathrm{h} = 14{:}05$ UTC.
- Tokyo is UTC plus 9 hours: $23{:}10 - 9\,\mathrm{h} = 14{:}10$ UTC.

So the gap is $14{:}10 - 14{:}05 = 5$ minutes. Two stations on opposite sides of the Pacific heard the satellite five minutes apart — plausible for one satellite moving at about 7.6 km/s, which covers about 2,300 km in five minutes.

In SQL:

```sql
SELECT (TIMESTAMP '2026-03-01 23:10:00' AT TIME ZONE 'Asia/Tokyo')
     - (TIMESTAMP '2026-03-01 06:05:00' AT TIME ZONE 'America/Los_Angeles') AS gap;
-- 00:05:00
```

**The lesson.** This worked only because *you* knew which station wrote which row. If that knowledge lives in someone's head, the data is unrecoverable once they move on. With TIMESTAMPTZ, the first subtraction would have been right.
:::

## Intervals: lengths of time

An **interval** is a length of time, like "12 minutes 30 seconds" or "3 days". It is not a moment; it is a gap between moments. Think of the difference between a date on a calendar and a number of days on a countdown.

PostgreSQL has a type for it, `INTERVAL`, and three rules of arithmetic that follow the everyday meaning:

- instant minus instant gives an interval (how long between them);
- instant plus or minus an interval gives an instant (a moment that far later or earlier);
- interval times a number gives an interval (twice as long).

```sql
SELECT TIMESTAMPTZ '2026-03-01 14:17:30+00' - TIMESTAMPTZ '2026-03-01 14:05:00+00' AS pass_length;
-- 00:12:30

SELECT TIMESTAMPTZ '2026-03-01 14:05:00+00' + INTERVAL '95 minutes' AS next_pass;
-- 2026-03-01 15:40:00+00

SELECT INTERVAL '1 day 3 hours' * 2 AS doubled;
-- 2 days 06:00:00
```

Read `00:12:30` as "zero hours, twelve minutes, thirty seconds". An interval literal is written as the word `INTERVAL` followed by a quoted phrase in plain English units: `'90 minutes'`, `'2 hours'`, `'1 day 3 hours'`.

To turn an interval into a plain number of seconds — for example to divide by the sample period — use `EXTRACT(EPOCH FROM …)`:

```sql
SELECT EXTRACT(EPOCH FROM INTERVAL '12 minutes 30 seconds') AS seconds;
-- 750.000000
```

Check: $12 \times 60 + 30 = 750$. Good.

Two more functions you will use constantly: `now()` returns the current instant, and `date_trunc('hour', ts)` chops a timestamp down to the start of its hour (or `'day'`, `'minute'`, and so on).

```sql
SELECT date_trunc('hour', TIMESTAMPTZ '2026-03-01 14:47:12.25+00') AS hour_start;
-- 2026-03-01 14:00:00+00
```

::: key Instants and intervals
instant − instant = interval; instant ± interval = instant; interval × number = interval. `EXTRACT(EPOCH FROM interval)` gives seconds. In a zone with daylight saving, `INTERVAL '1 day'` and `INTERVAL '24 hours'` can differ; in UTC they do not.
:::

## Choosing a time window

The most common time question is "what happened during this period?" `BETWEEN`, from lesson 02, is tempting here. It is the wrong tool.

`BETWEEN a AND b` includes **both** ends. Days, hours and minutes butt up against each other, so the end of one period is the start of the next. With BETWEEN, a reading at exactly midnight belongs to two days.

Here are five battery readings from SAT-001 around midnight at the end of 1 March:

```sql
SELECT sat_id, ts, value FROM telemetry
WHERE ts BETWEEN '2026-03-01 00:00:00Z' AND '2026-03-02 00:00:00Z'
ORDER BY ts;
```

```text
 sat_id  |           ts           | value
---------+------------------------+-------
 SAT-001 | 2026-03-01 23:58:00+00 |  0.91
 SAT-001 | 2026-03-01 23:59:00+00 |   0.9
 SAT-001 | 2026-03-02 00:00:00+00 |   0.9
```

The midnight reading of 2 March has leaked into 1 March. The report for 2 March will count it again.

The fix is a **[[half-open window|half-open]]**: include the start, exclude the end. Written with `>=` and `<`:

```sql
SELECT sat_id, ts, value FROM telemetry
WHERE ts >= '2026-03-01 00:00:00Z'
  AND ts <  '2026-03-02 00:00:00Z'
ORDER BY ts;
```

```text
 sat_id  |           ts           | value
---------+------------------------+-------
 SAT-001 | 2026-03-01 23:58:00+00 |  0.91
 SAT-001 | 2026-03-01 23:59:00+00 |   0.9
```

Every instant now falls in exactly one day, at any resolution: a reading at 23:59:59.999999 is still inside.

::: warning Do not end a window with 23:59:59
`ts <= '2026-03-01 23:59:59Z'` looks like "all of 1 March". It silently drops every reading in the final second, such as `23:59:59.5`. Telemetry sampled at 10 Hz puts ten readings in that second. Use `ts < '2026-03-02 00:00:00Z'`.
:::

::: example Finding a gap in the data
SAT-001 is supposed to send one battery reading every 60 seconds. You see these rows shortly after midnight on 2 March:

```text
           ts           | value
------------------------+-------
 2026-03-02 00:00:00+00 |   0.9
 2026-03-02 00:01:00+00 |  0.89
 2026-03-02 00:07:00+00 |  0.86
```

How much data is missing between 00:01 and 00:07?

**Step 1: the length of the hole.** Subtract the instants:

```sql
SELECT TIMESTAMPTZ '2026-03-02 00:07:00Z' - TIMESTAMPTZ '2026-03-02 00:01:00Z' AS hole;
-- 00:06:00
```

**Step 2: turn it into seconds.** `EXTRACT(EPOCH FROM INTERVAL '6 minutes')` is $6 \times 60 = 360$ seconds.

**Step 3: count the missing samples.** At one sample per 60 s, a 360 s hole should have held samples at 00:02, 00:03, 00:04, 00:05 and 00:06. That is $360 / 60 - 1 = 5$ missing readings. (Subtract one because the reading at 00:07 did arrive.)

**Sanity check.** Count them: 2, 3, 4, 5, 6. Five. In the window-functions module you will meet a tool (`LAG`) that finds every gap in a table in one query. The arithmetic underneath it is this subtraction.
:::

## Why not store time as a number?

Lesson 06 showed why a count of seconds since an epoch must never sit in a float column. Here is that result in the setting of this lesson, because it decides the column type you choose for a timestamp.

On 1 March 2026 at 14:05 UTC, the Unix count is 1,772,373,900 seconds.

- In an 8-byte float (DOUBLE PRECISION, or REAL in SQLite), neighbouring values near 1.77 billion are about $2.4 \times 10^{-7}$ seconds apart. Add 0.1 s and you get 0.09999990463 s, not 0.1. Two systems that computed "the same" time by different routes disagree in the last digits, so `=` fails and a join on time finds no match.
- In a 4-byte float (REAL in PostgreSQL), neighbouring values near 1.77 billion are **[[128 seconds apart|float-spacing]]**. The value 1,772,373,900 itself becomes 1,772,373,888, twelve seconds early.

::: key Why telemetry timestamps are never stored as floats
Binary floating point cannot represent decimal fractions of a second exactly and loses resolution as the epoch offset grows, so equality and joins break. Use a timestamp type, or an integer count of nanoseconds since a stated epoch.
:::

So a telemetry timestamp goes in TIMESTAMPTZ, in UTC — microsecond resolution, an absolute instant, and all the interval arithmetic of this lesson. The one good alternative is a `BIGINT` count of nanoseconds, common in high-rate systems: exact, lasting about 292 years from its epoch, with the epoch written into the column's name (`t_ns_unix`) and comment.

## Time in SQLite

The exercises in this course run on SQLite, which has **no timestamp types at all**. The convention is to store time as text in **[[ISO-8601|iso-8601]]** format, in UTC, with a `Z` on the end — exactly like the exercise starter:

```sql
CREATE TABLE telemetry (
    sat_id  TEXT NOT NULL,
    ts      TEXT NOT NULL,     -- e.g. '2026-03-01T00:01:00Z'
    channel TEXT NOT NULL,
    value   REAL
);
```

ISO-8601 text is written biggest unit first, so comparing two such strings letter by letter gives the same answer as comparing the times. `ORDER BY ts` sorts in time order, and a half-open window is ordinary text comparison:

```sql
SELECT ts, value FROM telemetry
WHERE ts >= '2026-03-01T00:00:00Z' AND ts < '2026-03-02T00:00:00Z'
ORDER BY ts;
-- ('2026-03-01T23:58:00Z', 0.91)
-- ('2026-03-01T23:59:00Z', 0.9)
```

To pull out the day, take the first ten characters: `substr(ts, 1, 10)` gives `'2026-03-01'`. To do arithmetic, SQLite has date functions that take a time string plus **modifiers** like `'+90 minutes'`:

```sql
SELECT unixepoch('2026-03-02T00:07:00Z') - unixepoch('2026-03-02T00:01:00Z') AS gap_s;
-- 360
SELECT strftime('%Y-%m-%dT%H:%M:%SZ', '2026-03-02T00:01:00Z', '+90 minutes');
-- '2026-03-02T01:31:00Z'
```

`unixepoch()` returns whole seconds since 1970 as an integer, so the gap is exact. `strftime` formats a result in the same shape as the column.

::: warning In SQLite, every timestamp must have the same format
Text comparison only works if every value is written the same way. SQLite's own `datetime()` function returns a *different* format — a space instead of `T`, and no `Z`:

```sql
SELECT datetime('2026-03-02T00:01:00Z', '+90 minutes');
-- '2026-03-02 01:31:00'
```

Compare that with a column full of `...T...Z` strings and the letter-by-letter rule goes wrong. A space sorts before `T`, so `'2026-03-02T00:00:00Z' <= '2026-03-02 00:00:00'` is false, and this query silently loses the midnight row:

```sql
SELECT ts FROM telemetry WHERE ts <= datetime('2026-03-02T00:00:00Z');
-- ('2026-03-01T23:58:00Z',)
-- ('2026-03-01T23:59:00Z',)      midnight is missing
```

Build comparison values with `strftime('%Y-%m-%dT%H:%M:%SZ', …)` so they match the column exactly. Also avoid `julianday()` for gaps: it returns a float, and the 360 s gap above comes back as 360.0000187754631.
:::

## Check yourself

::: check
A colleague's table has a column `event_time TIMESTAMP` holding `2026-06-10 09:30:00`. You are in Tokyo; they are in Los Angeles. What do you know about when the event happened, and what would you ask them?
:::

::: answer
Only that some clock read 09:30 on 10 June. It could be 09:30 UTC, 09:30 Los Angeles time (which is 16:30 UTC in June, because of daylight saving: UTC minus 7), or 09:30 Tokyo time (00:30 UTC). Those span sixteen hours. Ask: "Which clock wrote this column — the loader's local time, or UTC?" Then propose changing the column to TIMESTAMPTZ so the next person does not have to ask.
:::

::: check
A session is set to `America/Los_Angeles`. You run `INSERT INTO pass_log (pass_id, aos_utc) VALUES (7, '2026-04-02 10:00:00');` where `aos_utc` is TIMESTAMPTZ. The pass actually started at 10:00 UTC. What instant is now stored, and how do you fix the statement?
:::

::: answer
The text has no offset, so PostgreSQL uses the session zone. In April, Los Angeles is on daylight time, UTC minus 7, so the stored instant is 10:00 + 7 h = 17:00 UTC — seven hours late. The column name `aos_utc` does not help; names are not checked. Fix it by writing the offset: `'2026-04-02 10:00:00+00'` (or `'2026-04-02T10:00:00Z'`).
:::

::: check
Write a PostgreSQL WHERE clause that selects every telemetry row from the hour 14:00 to 15:00 UTC on 1 March 2026, counting a reading at exactly 15:00:00 in the next hour, not this one.
:::

::: answer
A half-open window, with offsets written:

```sql
WHERE ts >= '2026-03-01 14:00:00+00'
  AND ts <  '2026-03-01 15:00:00+00'
```

`>=` keeps 14:00:00 itself; `<` excludes 15:00:00, which will be picked up by the 15:00 window instead. Each reading lands in exactly one hour.
:::

::: check
A pass starts at `2026-03-01 14:05:00+00` and lasts 11 minutes 40 seconds. Write the SQL for its end time, and work out the answer by hand. How many seconds long is the pass?
:::

::: answer
```sql
SELECT TIMESTAMPTZ '2026-03-01 14:05:00+00' + INTERVAL '11 minutes 40 seconds';
```

By hand: 14:05:00 plus 11 min is 14:16:00, plus 40 s is 14:16:40. The result is `2026-03-01 14:16:40+00`. In seconds, $11 \times 60 + 40 = 700$, which is what `EXTRACT(EPOCH FROM INTERVAL '11 minutes 40 seconds')` returns.
:::

::: check
In SQLite, one teammate selects the readings of 2 March with `WHERE substr(ts, 1, 10) = '2026-03-02'`, another with `WHERE ts >= '2026-03-02T00:00:00Z' AND ts < '2026-03-03T00:00:00Z'`. On the exercise's table, do they agree? What kind of stored value would make the first one wrong?
:::

::: answer
On a column where every value looks like `2026-03-02T…Z` — UTC, one format — they agree: both keep exactly the values whose first ten characters are `2026-03-02`.

The first breaks as soon as a value carries a local offset. `'2026-03-02T08:50:00+09:00'` is Tokyo time; as an instant it is 23:50 UTC on **1 March**. `substr` reads the local date, 2 March, and keeps it. (The second query would mishandle it too, because text comparison knows nothing about offsets.) The real fix is upstream: convert everything to UTC with a `Z` before it is stored, and the day is then the first ten characters.
:::

## Summary

| Idea | In one line |
| --- | --- |
| TIMESTAMP | wall-clock date and time, no zone; means different instants in different places |
| TIMESTAMPTZ | an absolute instant; stored as UTC microseconds, converted with a zone on input and output |
| Input without an offset | uses the session time zone — always write `Z` or `+00` |
| `AT TIME ZONE` | converts instant ↔ wall clock for one named zone; use it for display only |
| Why UTC | one clock for a worldwide fleet, no daylight-saving jumps, fixed link to spacecraft time |
| INTERVAL | a length of time; instant − instant = interval, instant + interval = instant |
| `EXTRACT(EPOCH FROM …)` | interval → seconds |
| Time windows | half-open: `ts >= start AND ts < end`; not BETWEEN, not `23:59:59` |
| Floats for time | never: they lose resolution far from the epoch (4-byte floats near 2026 are 128 s apart) |
| Integer time | BIGINT nanoseconds since a **stated** epoch; exact, lasts about 292 years |
| SQLite | ISO-8601 UTC text (`2026-03-01T00:00:00Z`); `substr(ts,1,10)` for the day; `unixepoch()` for gaps; keep one format |

You can now pick columns, filter, sort, compute, handle NULL and store time properly. Next lesson steps back and asks what the database does with all those clauses — in what order it *really* runs them — which explains several error messages you may already have met.

::: context wall-clock Why engineers say "wall clock"
"Wall-clock time" means the time a person would read off a clock on the wall of the room they are in. Programmers use it to contrast with other kinds of time: the **elapsed** time a stopwatch measures, or the **CPU time** a program actually spent computing.

A wall clock is local by nature. The wall in Houston and the wall in Toulouse show different numbers at the same moment. That is exactly why a wall-clock reading, alone, is not enough to pin down an instant.
:::

::: context aos-los AOS and LOS
A satellite in low Earth orbit is in view of any one ground antenna for only a few minutes at a time. **AOS**, acquisition of signal, is when the antenna first locks on as the satellite rises over the horizon. **LOS**, loss of signal, is when it sets and the link drops.

The stretch between them is a **pass**, usually 5 to 12 minutes for a low satellite. Pass tables — station, satellite, AOS, LOS, bytes received — are some of the first tables a ground-segment data engineer meets, and every AOS and LOS in them is a timestamp that must be in UTC.
:::

::: context microsecond How small is a microsecond?
A microsecond is one millionth of a second, written μs (the Greek letter mu, for "micro"). In one microsecond, light travels about 300 m. A satellite in low orbit, moving at about 7.6 km/s, moves about 7.6 mm.

So a timestamp with microsecond resolution pins down *where* a satellite was to within a centimetre or so. That is fine for most telemetry. Systems that time-tag radio signals for navigation need nanoseconds, a thousand times finer, which is one reason they keep time as an integer count instead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="20" y1="50" x2="20" y2="70"/><line x1="340" y1="50" x2="340" y2="70"/>
  </g>
  <text x="20" y="88" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="340" y="88" font-size="12" text-anchor="middle" fill="#1f2a44">1 μs</text>
  <circle cx="30" cy="40" r="6" fill="#1d6fd1"/>
  <line x1="36" y1="40" x2="318" y2="40" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 4"/>
  <polygon points="330,40 318,35 318,45" fill="#1d6fd1"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1d6fd1">satellite moves about 7.6 mm</text>
  <text x="180" y="104" font-size="12" text-anchor="middle" fill="#6c7a93">light moves about 300 m in the same time</text>
</svg>
```
:::

::: context utc-name Why the letters are UTC
The English name would give the initials CUT; the French name, *temps universel coordonné*, gives TUC. When the standard was agreed in the late 1960s and 1970s, the international committees settled on **UTC** for every language, so that nobody's initials won.

UTC is kept by atomic clocks around the world and is the successor to Greenwich Mean Time. For database work you can treat "UTC" and "the +00 offset" as the same thing.
:::

::: context dst The hour that happens twice
On 1 November 2026, Los Angeles clocks reach 01:59:59 in daylight time, then go back to 01:00:00 in standard time and run through that hour again. A wall-clock reading of 01:30 that night names two different instants, an hour apart.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="12" y="22" font-size="12" fill="#1f2a44">UTC (always steady)</text>
  <line x1="20" y1="40" x2="340" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="58">07:00</text><text x="140" y="58">08:00</text><text x="220" y="58">09:00</text><text x="300" y="58">10:00</text>
  </g>
  <g stroke="#1f2a44"><line x1="60" y1="34" x2="60" y2="46"/><line x1="140" y1="34" x2="140" y2="46"/><line x1="220" y1="34" x2="220" y2="46"/><line x1="300" y1="34" x2="300" y2="46"/></g>
  <text x="12" y="88" font-size="12" fill="#1f2a44">Los Angeles wall clock</text>
  <line x1="20" y1="106" x2="340" y2="106" stroke="#1f2a44" stroke-width="2"/>
  <rect x="60" y="98" width="80" height="16" fill="#8fb8f0"/>
  <rect x="140" y="98" width="80" height="16" fill="#f2b880"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="130">00:00</text><text x="140" y="130">01:00</text><text x="220" y="130">01:00</text><text x="300" y="130">02:00</text>
  </g>
  <text x="100" y="146" font-size="11" fill="#1d6fd1" text-anchor="middle">01:xx daylight</text>
  <text x="180" y="146" font-size="11" fill="#b4232c" text-anchor="middle">01:xx again</text>
</svg>
```

Given the ambiguous TIMESTAMP `2026-11-01 01:30:00` and the zone `America/Los_Angeles`, PostgreSQL picks the later one (standard time) and returns `09:30:00+00`. It does not warn you that `08:30:00+00` was equally possible.
:::

::: context leap-seconds Leap seconds and spacecraft clocks
Earth's spin is slightly irregular, so every so often UTC inserts an extra second, 23:59:60, to stay in step with the sky. There have been 27 since 1972. PostgreSQL and Unix time both pretend they do not exist: every UTC day is exactly 86,400 seconds to them.

Spacecraft usually avoid the problem by keeping a time scale with no leap seconds. GPS time is one: it has run steadily since 6 January 1980 and is now 18 seconds ahead of UTC. Converting to UTC on the ground means applying that published offset. When you meet a column called `gps_time`, find out whether anyone has done that conversion yet.
:::

::: context half-open Why half-open windows tile perfectly
A half-open window, written $[a, b)$ in maths — square bracket "includes", round bracket "excludes" — contains its start but not its end. Line up $[0{:}00, 1{:}00)$, $[1{:}00, 2{:}00)$, $[2{:}00, 3{:}00)$ and every instant lands in exactly one window: no gaps, no overlaps.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="340" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <rect x="40" y="38" width="96" height="24" fill="#8fb8f0"/>
  <rect x="136" y="38" width="96" height="24" fill="#f2b880"/>
  <rect x="232" y="38" width="96" height="24" fill="#8fb8f0"/>
  <g fill="#1f2a44"><circle cx="40" cy="50" r="5"/><circle cx="136" cy="50" r="5"/><circle cx="232" cy="50" r="5"/></g>
  <circle cx="328" cy="50" r="5" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="84">00:00</text><text x="136" y="84">01:00</text><text x="232" y="84">02:00</text><text x="328" y="84">03:00</text>
  </g>
  <text x="180" y="24" font-size="11" fill="#6c7a93" text-anchor="middle">filled dot = included, open dot = excluded</text>
</svg>
```

With closed windows (BETWEEN), each boundary instant sits in two windows; with fully open ones, it sits in none.
:::


::: context float-spacing Float spacing near 1.77 billion
A 4-byte float keeps about 7 significant decimal digits. At 1,772,373,900 that leaves no room below the hundreds, so the values it can hold go up in steps of 128.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="340" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1d6fd1" stroke-width="3">
    <line x1="60" y1="48" x2="60" y2="72"/><line x1="180" y1="48" x2="180" y2="72"/><line x1="300" y1="48" x2="300" y2="72"/>
  </g>
  <g font-size="11" fill="#1d6fd1" text-anchor="middle">
    <text x="60" y="90">…760</text><text x="180" y="90">…888</text><text x="300" y="90">…4016</text>
  </g>
  <circle cx="191" cy="60" r="5" fill="#b4232c"/>
  <text x="200" y="36" font-size="11" fill="#b4232c">true time …900</text>
  <text x="120" y="112" font-size="11" fill="#1f2a44" text-anchor="middle">128 s between neighbours</text>
  <line x1="62" y1="100" x2="178" y2="100" stroke="#1f2a44"/>
</svg>
```

The labels are the last digits of 1,772,373,760, 1,772,373,888 and 1,772,374,016. The true time 1,772,373,900 is closest to …888, so that is what gets stored: 12 seconds early.
:::

::: context iso-8601 ISO-8601, the one date format to use
ISO-8601 is the international standard for writing dates and times: `2026-03-01T14:05:00Z`. Year, month, day, then `T`, then hours, minutes, seconds, then the zone — `Z` for UTC or an offset like `+09:00`.

Its great trick is that the biggest unit comes first, so sorting the text alphabetically sorts it by time. Formats like `03/01/2026` do not have this property, and they are ambiguous as well: an American reads 1 March, a European reads 3 January.
:::
