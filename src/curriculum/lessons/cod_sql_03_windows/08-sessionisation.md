---
id: l08-sessionisation
title: Sessionising event streams
minutes: 20
covers:
  - Sessionisation of event streams
---

Think of a group chat. Messages do not arrive evenly. There is a burst of twenty messages about weekend plans, then silence for three hours, then a burst about homework. Without anyone saying so, you know those were two separate conversations. The rule your brain uses is simple: if nobody has said anything for a long while, the next message starts something new.

A satellite's radio link behaves the same way. A satellite in **[[low Earth orbit|leo-pass]]** is above a given ground station's horizon for only about ten minutes at a time. While it is overhead, packets pour in. Then it drops below the horizon and the station hears nothing until the next pass, an hour or more later. The stored telemetry is one long list of packet timestamps. The operations team wants it as a list of **passes**: which station, when contact started, when it ended, how many packets arrived.

Cutting a stream of events into bursts separated by quiet time is called **[[sessionisation|session-word]]**. Each burst is a **session**, and the rule is an **inactivity threshold**: a silence longer than the threshold ends one session, and the next event starts a new one. This lesson builds it from pieces you already have. In the last lesson you marked where a run starts and counted the marks. Sessionisation is that same method with only one reason to start a run: a long enough silence.

## The packet log

Here is a small **[[event stream|event-stream]]**: one row for each packet a ground station received. To keep it short, each satellite sends one packet a minute while in contact. A real link sends many per second, but the method does not care.

```sql
CREATE TABLE packet (
    sat_id  TEXT        NOT NULL,
    station TEXT        NOT NULL,   -- the ground station that heard it
    ts      TIMESTAMPTZ NOT NULL    -- when the packet arrived, UTC
);

INSERT INTO packet VALUES
  ('SAT-001','SVALBARD','2026-03-01T10:00:00Z'),
  ('SAT-001','SVALBARD','2026-03-01T10:01:00Z'),
  ('SAT-001','SVALBARD','2026-03-01T10:02:00Z'),
  ('SAT-001','SVALBARD','2026-03-01T10:03:00Z'),
  ('SAT-001','SVALBARD','2026-03-01T10:06:00Z'),
  ('SAT-001','SVALBARD','2026-03-01T10:07:00Z'),
  ('SAT-001','SVALBARD','2026-03-01T10:08:00Z'),
  ('SAT-001','INUVIK',  '2026-03-01T11:35:00Z'),
  ('SAT-001','INUVIK',  '2026-03-01T11:36:00Z'),
  ('SAT-001','INUVIK',  '2026-03-01T11:37:00Z'),
  ('SAT-001','INUVIK',  '2026-03-01T11:38:00Z'),
  ('SAT-001','INUVIK',  '2026-03-01T11:39:00Z'),
  ('SAT-001','INUVIK',  '2026-03-01T11:40:00Z'),
  ('SAT-002','TROLL',   '2026-03-01T10:20:00Z'),
  ('SAT-002','TROLL',   '2026-03-01T10:21:00Z'),
  ('SAT-002','TROLL',   '2026-03-01T10:22:00Z'),
  ('SAT-002','TROLL',   '2026-03-01T10:23:00Z'),
  ('SAT-002','TROLL',   '2026-03-01T10:24:00Z'),
  ('SAT-002','TROLL',   '2026-03-01T12:01:00Z'),
  ('SAT-002','TROLL',   '2026-03-01T12:02:00Z'),
  ('SAT-002','TROLL',   '2026-03-01T12:03:00Z');
```

Twenty-one packets. The three stations are real polar ground sites: **[[Svalbard, Inuvik and Troll|polar-stations]]**. Look at SAT-001's first pass. Packets arrive at 10:00, 10:01, 10:02, 10:03 — and then nothing until 10:06. Three minutes of silence in the middle of a pass. That is a **dropout**: a short loss of signal while the satellite is still overhead, from a bad antenna angle or radio interference. A good sessionisation keeps it inside the pass. A bad one splits the pass in two.

## Step 1: how long since the last packet?

The time since the previous event is LAG from lesson 03, subtracted from the current time, per satellite:

```sql
SELECT sat_id, station, ts,
       ts - LAG(ts) OVER (PARTITION BY sat_id ORDER BY ts) AS gap
FROM packet
WHERE sat_id = 'SAT-001'
ORDER BY ts;
```

```text
 sat_id  | station  |           ts           |   gap
---------+----------+------------------------+----------
 SAT-001 | SVALBARD | 2026-03-01 10:00:00+00 |
 SAT-001 | SVALBARD | 2026-03-01 10:01:00+00 | 00:01:00
 SAT-001 | SVALBARD | 2026-03-01 10:02:00+00 | 00:01:00
 SAT-001 | SVALBARD | 2026-03-01 10:03:00+00 | 00:01:00
 SAT-001 | SVALBARD | 2026-03-01 10:06:00+00 | 00:03:00
 SAT-001 | SVALBARD | 2026-03-01 10:07:00+00 | 00:01:00
 SAT-001 | SVALBARD | 2026-03-01 10:08:00+00 | 00:01:00
 SAT-001 | INUVIK   | 2026-03-01 11:35:00+00 | 01:27:00
 SAT-001 | INUVIK   | 2026-03-01 11:36:00+00 | 00:01:00
 SAT-001 | INUVIK   | 2026-03-01 11:37:00+00 | 00:01:00
 SAT-001 | INUVIK   | 2026-03-01 11:38:00+00 | 00:01:00
 SAT-001 | INUVIK   | 2026-03-01 11:39:00+00 | 00:01:00
 SAT-001 | INUVIK   | 2026-03-01 11:40:00+00 | 00:01:00
```

Three kinds of gap show up. One minute: the normal packet rate. Three minutes: the dropout. One hour and 27 minutes (read `01:27:00` as "1 hour, 27 minutes, 0 seconds"): the satellite went around the Earth and came into view of a different station. The first row's gap is NULL, because there is no packet before it. As in lesson 03, that NULL is correct.

## Steps 2 and 3: mark new sessions, count the marks

Pick a threshold. Here, five minutes: longer than any dropout we expect inside a pass, far shorter than the time between passes. A row starts a new session when its gap is longer than that, *or* when it has no gap at all because it is the satellite's first packet. Then a running SUM of the marks numbers the sessions, exactly as in lesson 07:

```sql
WITH stepped AS (
    SELECT sat_id, station, ts,
           ts - LAG(ts) OVER (PARTITION BY sat_id ORDER BY ts) AS gap
    FROM packet
),
flagged AS (
    SELECT sat_id, station, ts, gap,
           CASE WHEN gap IS NULL OR gap > INTERVAL '5 minutes'
                THEN 1 ELSE 0 END AS new_pass
    FROM stepped
)
SELECT sat_id, ts, gap, new_pass,
       SUM(new_pass) OVER (PARTITION BY sat_id ORDER BY ts
                           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS pass_no
FROM flagged
ORDER BY sat_id, ts;
```

```text
 sat_id  |           ts           |   gap    | new_pass | pass_no
---------+------------------------+----------+----------+---------
 SAT-001 | 2026-03-01 10:00:00+00 |          |        1 |       1
 SAT-001 | 2026-03-01 10:01:00+00 | 00:01:00 |        0 |       1
 SAT-001 | 2026-03-01 10:02:00+00 | 00:01:00 |        0 |       1
 SAT-001 | 2026-03-01 10:03:00+00 | 00:01:00 |        0 |       1
 SAT-001 | 2026-03-01 10:06:00+00 | 00:03:00 |        0 |       1
 SAT-001 | 2026-03-01 10:07:00+00 | 00:01:00 |        0 |       1
 SAT-001 | 2026-03-01 10:08:00+00 | 00:01:00 |        0 |       1
 SAT-001 | 2026-03-01 11:35:00+00 | 01:27:00 |        1 |       2
 SAT-001 | 2026-03-01 11:36:00+00 | 00:01:00 |        0 |       2
 SAT-001 | 2026-03-01 11:37:00+00 | 00:01:00 |        0 |       2
 SAT-001 | 2026-03-01 11:38:00+00 | 00:01:00 |        0 |       2
 SAT-001 | 2026-03-01 11:39:00+00 | 00:01:00 |        0 |       2
 SAT-001 | 2026-03-01 11:40:00+00 | 00:01:00 |        0 |       2
 SAT-002 | 2026-03-01 10:20:00+00 |          |        1 |       1
 SAT-002 | 2026-03-01 10:21:00+00 | 00:01:00 |        0 |       1
 SAT-002 | 2026-03-01 10:22:00+00 | 00:01:00 |        0 |       1
 SAT-002 | 2026-03-01 10:23:00+00 | 00:01:00 |        0 |       1
 SAT-002 | 2026-03-01 10:24:00+00 | 00:01:00 |        0 |       1
 SAT-002 | 2026-03-01 12:01:00+00 | 01:37:00 |        1 |       2
 SAT-002 | 2026-03-01 12:02:00+00 | 00:01:00 |        0 |       2
 SAT-002 | 2026-03-01 12:03:00+00 | 00:01:00 |        0 |       2
```

Follow SAT-001. Its first packet has a NULL gap, so it is marked 1 and the running count becomes 1. The dropout's three-minute gap is under five minutes, so it is marked 0 and the count stays 1: the dropout stays inside pass 1. The 1 h 27 min gap is marked 1, and the count becomes 2. SAT-002's count starts again from 1, because the SUM is partitioned by satellite. You can [[see the whole thing on a timeline|sessions-picture]].

Why write `gap IS NULL OR …` rather than leaning on the NULL? Because `NULL > INTERVAL '5 minutes'` is UNKNOWN, and CASE treats UNKNOWN like false. Without the `IS NULL` test, every satellite's first packet would get `new_pass = 0`, its first pass would be numbered 0, and the numbering would be off by one — the same slip as the `<>` versus IS DISTINCT FROM question in the last lesson.

::: key Sessionisation with an inactivity threshold
Compute the gap to the previous event with LAG, mark a row as a new session when the gap is NULL or longer than the threshold, and number sessions with a running SUM of the marks. Partition every window by the thing whose sessions you want, such as the satellite.
:::

## One line per pass

With every packet carrying its `pass_no`, a pass is a group. GROUP BY the satellite and the pass number, and read the pass's edges with MIN and MAX. The ground-station words for those edges are **[[AOS and LOS|aos-los]]**: acquisition of signal, the first packet heard, and loss of signal, the last.

::: example A contact-pass table from raw packets
**Question.** For each satellite, list every pass with its station, AOS, LOS, how long contact lasted, and the packet count.

**Think first.** From the timeline: SAT-001 has passes from 10:00 to 10:08 and from 11:35 to 11:40; SAT-002 from 10:20 to 10:24 and from 12:01 to 12:03. So four passes, and their packet counts must add up to all 21 packets.

**The query.** The first two CTEs are the ones above; the third collapses:

```sql
WITH stepped AS (
    SELECT sat_id, station, ts,
           ts - LAG(ts) OVER (PARTITION BY sat_id ORDER BY ts) AS gap
    FROM packet
),
flagged AS (
    SELECT sat_id, station, ts,
           CASE WHEN gap IS NULL OR gap > INTERVAL '5 minutes'
                THEN 1 ELSE 0 END AS new_pass
    FROM stepped
),
numbered AS (
    SELECT sat_id, station, ts,
           SUM(new_pass) OVER (PARTITION BY sat_id ORDER BY ts
                               ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS pass_no
    FROM flagged
)
SELECT sat_id, pass_no,
       MIN(station)      AS station,
       MIN(ts)           AS aos,
       MAX(ts)           AS los,
       MAX(ts) - MIN(ts) AS duration,
       COUNT(*)          AS packets
FROM numbered
GROUP BY sat_id, pass_no
ORDER BY sat_id, pass_no;
```

```text
 sat_id  | pass_no | station  |          aos           |          los           | duration | packets
---------+---------+----------+------------------------+------------------------+----------+---------
 SAT-001 |       1 | SVALBARD | 2026-03-01 10:00:00+00 | 2026-03-01 10:08:00+00 | 00:08:00 |       7
 SAT-001 |       2 | INUVIK   | 2026-03-01 11:35:00+00 | 2026-03-01 11:40:00+00 | 00:05:00 |       6
 SAT-002 |       1 | TROLL    | 2026-03-01 10:20:00+00 | 2026-03-01 10:24:00+00 | 00:04:00 |       5
 SAT-002 |       2 | TROLL    | 2026-03-01 12:01:00+00 | 2026-03-01 12:03:00+00 | 00:02:00 |       3
```

**Sanity check.** Four passes, as predicted. The packets add to $7 + 6 + 5 + 3 = 21$, every packet in the table. The first pass lasted 8 minutes and still includes the dropout. The durations of 2 to 8 minutes are the right size for passes of a low satellite.

**Why `MIN(station)`?** GROUP BY makes one row per pass, and a pass could in principle hold packets from more than one station, so PostgreSQL insists on an aggregate. Here each pass has one station, so MIN returns it. If you are not sure, add `COUNT(DISTINCT station)` as a column and check that it is 1 everywhere.

**In SQLite**, `ts` is ISO-8601 text and there is no INTERVAL type, so measure gaps in whole seconds with `unixepoch`:

```sql
WITH stepped AS (
    SELECT sat_id, station, ts,
           unixepoch(ts) - unixepoch(LAG(ts) OVER (PARTITION BY sat_id ORDER BY ts)) AS gap_s
    FROM packet
),
numbered AS (
    SELECT sat_id, station, ts,
           SUM(CASE WHEN gap_s IS NULL OR gap_s > 300 THEN 1 ELSE 0 END)
             OVER (PARTITION BY sat_id ORDER BY ts
                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS pass_no
    FROM stepped
)
SELECT sat_id, pass_no, MIN(station) AS station,
       MIN(ts) AS aos, MAX(ts) AS los,
       unixepoch(MAX(ts)) - unixepoch(MIN(ts)) AS duration_s,
       COUNT(*) AS packets
FROM numbered
GROUP BY sat_id, pass_no
ORDER BY sat_id, pass_no;
-- ('SAT-001', 1, 'SVALBARD', '2026-03-01T10:00:00Z', '2026-03-01T10:08:00Z', 480, 7)
-- ('SAT-001', 2, 'INUVIK',   '2026-03-01T11:35:00Z', '2026-03-01T11:40:00Z', 300, 6)
-- ('SAT-002', 1, 'TROLL',    '2026-03-01T10:20:00Z', '2026-03-01T10:24:00Z', 240, 5)
-- ('SAT-002', 2, 'TROLL',    '2026-03-01T12:01:00Z', '2026-03-01T12:03:00Z', 120, 3)
```

Five minutes is 300 seconds. This version also shows a small shortcut: the CASE can sit directly inside the SUM, so the `flagged` step disappears. Same four passes.
:::

::: warning Partition by the satellite, every time
Leave `PARTITION BY sat_id` out of the LAG and the gaps are measured between *any* two packets, from any satellite. When two satellites are in contact at overlapping times — which happens all day in a large fleet — their packets interleave, the gaps all look short, and the two contacts merge into one "session" containing both satellites. The running SUM needs the same partition, or pass numbers run on across satellites.
:::

## Choosing the threshold

The whole method rests on one number, so choose it on purpose. Try two minutes instead of five, and the dropout is now "too long":

```text
 sat_id  | pass_no |          aos           |          los           | packets
---------+---------+------------------------+------------------------+---------
 SAT-001 |       1 | 2026-03-01 10:00:00+00 | 2026-03-01 10:03:00+00 |       4
 SAT-001 |       2 | 2026-03-01 10:06:00+00 | 2026-03-01 10:08:00+00 |       3
 SAT-001 |       3 | 2026-03-01 11:35:00+00 | 2026-03-01 11:40:00+00 |       6
 SAT-002 |       1 | 2026-03-01 10:20:00+00 | 2026-03-01 10:24:00+00 |       5
 SAT-002 |       2 | 2026-03-01 12:01:00+00 | 2026-03-01 12:03:00+00 |       3
```

The Svalbard pass has split in two, and SAT-001 appears to have had three passes. Go the other way and pick three hours, and every packet of each satellite lands in one session, ignoring the orbit completely.

A good threshold sits in the empty space between two families of gaps: the short ones *inside* sessions and the long ones *between* them. You can see that space by counting the gaps by size:

```sql
WITH stepped AS (
    SELECT ts - LAG(ts) OVER (PARTITION BY sat_id ORDER BY ts) AS gap
    FROM packet
)
SELECT gap, COUNT(*) AS n
FROM stepped
WHERE gap IS NOT NULL
GROUP BY gap
ORDER BY gap;
```

```text
   gap    | n
----------+----
 00:01:00 | 16
 00:03:00 |  1
 01:27:00 |  1
 01:37:00 |  1
```

Sixteen normal one-minute steps, one three-minute dropout, then nothing at all until 87 minutes. Any threshold between 3 and 87 minutes gives the same four passes. Five minutes sits safely near the short end. On real data with millions of packets you would group the gaps into bins — whole minutes, say — and look for the [[valley in the histogram|gap-histogram]].

Physics helps too. A low satellite takes about 92 to 96 minutes to go once around the Earth, so the same station cannot see it twice within a few minutes. And a single pass lasts at most about a quarter of an hour. So any silence of, say, 20 minutes or more means the pass is over.

::: warning Too small splits, too big merges
A threshold shorter than the longest in-pass dropout splits one pass into several, and pass counts and contact-time totals go up. A threshold longer than the shortest gap between passes merges two passes into one — for example when a satellite leaves one station's view and enters another's a few minutes later. Check both edges against the gap histogram before trusting the numbers.
:::

## Using the sessions

Once each pass is a row, everything from this module works on the passes themselves. Two common questions are "was anything lost during the pass?" and "how long was the satellite out of contact before it?".

::: example Completeness and quiet time for each pass
**Completeness.** At one packet a minute, a pass from AOS to LOS should hold one packet per whole minute of duration, plus one for the starting minute. For SAT-001's first pass that is $8 + 1 = 9$ expected; 7 arrived, so 2 were lost — the packets due at 10:04 and 10:05, inside the dropout.

**Quiet time.** The silence before a pass is this pass's AOS minus the previous pass's LOS — a LAG over the *passes*, per satellite.

```sql
-- stepped and numbered: the first two CTEs of the previous example,
-- with the CASE folded into the SUM as in its SQLite version
WITH stepped AS (
    SELECT sat_id, station, ts,
           ts - LAG(ts) OVER (PARTITION BY sat_id ORDER BY ts) AS gap
    FROM packet
),
numbered AS (
    SELECT sat_id, station, ts,
           SUM(CASE WHEN gap IS NULL OR gap > INTERVAL '5 minutes' THEN 1 ELSE 0 END)
             OVER (PARTITION BY sat_id ORDER BY ts
                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS pass_no
    FROM stepped
),
passes AS (
    SELECT sat_id, pass_no, MIN(station) AS station,
           MIN(ts) AS aos, MAX(ts) AS los, COUNT(*) AS packets
    FROM numbered
    GROUP BY sat_id, pass_no
)
SELECT sat_id, pass_no, station, aos, los, packets,
       EXTRACT(EPOCH FROM los - aos)::int / 60 + 1 AS expected,
       aos - LAG(los) OVER (PARTITION BY sat_id ORDER BY aos) AS quiet_before
FROM passes
ORDER BY sat_id, pass_no;
```

```text
 sat_id  | pass_no | station  |          aos           |          los           | packets | expected | quiet_before
---------+---------+----------+------------------------+------------------------+---------+----------+--------------
 SAT-001 |       1 | SVALBARD | 2026-03-01 10:00:00+00 | 2026-03-01 10:08:00+00 |       7 |        9 |
 SAT-001 |       2 | INUVIK   | 2026-03-01 11:35:00+00 | 2026-03-01 11:40:00+00 |       6 |        6 | 01:27:00
 SAT-002 |       1 | TROLL    | 2026-03-01 10:20:00+00 | 2026-03-01 10:24:00+00 |       5 |        5 |
 SAT-002 |       2 | TROLL    | 2026-03-01 12:01:00+00 | 2026-03-01 12:03:00+00 |       3 |        3 | 01:37:00
```

**Read the pieces.** `EXTRACT(EPOCH FROM los - aos)` turns the pass duration into seconds (480 for the first pass). `::int` makes it a whole number, so `/ 60` is whole-number division: $480 / 60 = 8$ minutes, plus 1 gives 9. The LAG runs over the `passes` rows, not the packets, so it looks back one *pass*.

**Sanity check.** Only the Svalbard pass is short of packets, by $9 - 7 = 2$, exactly the two minutes of the dropout. The quiet times, 87 and 97 minutes, are each about one orbit, which is what you expect when a satellite comes back after a lap of the Earth. The first pass of each satellite has no quiet time, because no earlier pass is in the table.
:::

### Naming the sessions

`pass_no` restarts at 1 for each satellite, so on its own it is not a name for a pass. Two ways to give each pass a fleet-wide name:

```sql
-- passes: the CTE from the example above
SELECT ROW_NUMBER() OVER (ORDER BY aos, sat_id) AS contact_id,
       sat_id || '#' || pass_no                  AS pass_key,
       aos, los
FROM passes
ORDER BY contact_id;
```

```text
 contact_id | pass_key  |          aos           |          los
------------+-----------+------------------------+------------------------
          1 | SAT-001#1 | 2026-03-01 10:00:00+00 | 2026-03-01 10:08:00+00
          2 | SAT-002#1 | 2026-03-01 10:20:00+00 | 2026-03-01 10:24:00+00
          3 | SAT-001#2 | 2026-03-01 11:35:00+00 | 2026-03-01 11:40:00+00
          4 | SAT-002#2 | 2026-03-01 12:01:00+00 | 2026-03-01 12:03:00+00
```

(`||` is SQL's text glue, read "concatenated with".) The ROW_NUMBER without PARTITION BY numbers all passes of the fleet in time order.

::: warning Session numbers are not stable names
Both names above are computed from whatever rows are in the table *today*. Telemetry often arrives [[late and out of order|late-data]]. If yesterday's packets from an earlier pass are loaded tomorrow, every later `pass_no` of that satellite shifts up by one, and a report that said "SAT-001#2 had a dropout" now points at a different pass. When a pass must keep its name — in a ticket, or as a key in another table — name it by something that does not move: the satellite and its AOS time, `('SAT-001', '2026-03-01 10:00:00+00')`.
:::

### What to partition by

"Session" means a burst of events *of one thing*. Partitioning by `sat_id` gives each satellite's contact periods, whichever station heard them. Partitioning by `sat_id, station` gives each satellite–station contact separately. The two differ when a satellite is handed from one station straight to another with no silence between. By satellite, that is one session. By satellite and station, it is two. Neither is wrong; choose the one that answers the question being asked.

::: key Sessions are islands of activity
A session is an island whose only rule is time: it continues while the gap to the previous event is at most the threshold. The start-marking method from gaps and islands — LAG to mark, running SUM to number, GROUP BY to collapse — is sessionisation with a time-gap condition.
:::

## Check yourself

::: check
A star tracker logs an event at these times (seconds): 0, 2, 4, 30, 31, 33, 90. With an inactivity threshold of 10 s, write the `gap`, `new_session` and running `session_no` for each event. How many sessions are there, and how long is each, first to last event?
:::

::: answer
Gaps: NULL, 2, 2, 26, 1, 2, 57.

Marks (gap NULL or over 10): 1, 0, 0, 1, 0, 0, 1.

Running sum: 1, 1, 1, 2, 2, 2, 3.

**Three sessions**: 0–4 s (4 s long, 3 events), 30–33 s (3 s long, 3 events), and 90–90 s (0 s long, a single event). The event counts add to $3 + 3 + 1 = 7$, all of them.
:::

::: check
Your colleague's pass query numbers every satellite's first pass as 0 and the rest from 1. Their mark is `CASE WHEN gap > INTERVAL '5 minutes' THEN 1 ELSE 0 END`. What went wrong, and does it change which packets end up grouped together?
:::

::: answer
Each satellite's first packet has a NULL gap, because LAG found no earlier packet. `NULL > INTERVAL '5 minutes'` is UNKNOWN, CASE treats it as not true, and the mark is 0. So the running SUM starts at 0 and the first pass is numbered 0.

The grouping itself is unchanged: the first pass is still one group (label 0) and the rest keep their own labels, one lower. But "pass 1" now means the second pass, which will confuse anyone reading the report, and a query that adds up `new_pass` to count passes will undercount by one per satellite. Fix it with `gap IS NULL OR gap > INTERVAL '5 minutes'`.
:::

::: check
The gap histogram for a year of SAT-007 packets has a huge peak at 1 s (the packet rate), a small bump between 20 s and 90 s, nothing from 2 minutes to 40 minutes, and a big bump from 45 minutes to 11 hours. What are the small bump and the big bump, and what threshold would you pick?
:::

::: answer
The big bump from 45 minutes to 11 hours is the time *between* passes: at least most of an orbit, and much longer when the satellite's ground track misses every station for a while. The small bump from 20 s to 90 s is dropouts *inside* passes.

The threshold belongs in the empty valley between 2 and 40 minutes, with room on both sides. Something like 5 minutes is well clear of the longest dropouts (90 s) and far below the shortest real break (45 minutes). The exact value barely matters because nothing lives in the valley, which is the sign of a good choice.
:::

::: check
SAT-004 is heard by station A from 14:00 to 14:07, and station B picks it up at 14:07 and hears it until 14:15, with packets every 20 s throughout. Using a 5-minute threshold, how many sessions do you get partitioning by `sat_id`, and how many partitioning by `sat_id, station`? When would each be the right choice?
:::

::: answer
By `sat_id`: **one** session from 14:00 to 14:15. No silence anywhere is longer than 20 s, so nothing ever starts a new one.

By `sat_id, station`: **two** sessions, 14:00–14:07 at A and 14:07–14:15 at B, because each station's packets form their own partition with their own first row.

By satellite is right for "how long was SAT-004 in contact with the ground?" — the answer is 15 minutes, with no break. By satellite and station is right for "how much did each station contribute?" — useful for a station's billing or for spotting an antenna that performs badly.
:::

::: check
Using the `passes` CTE from the completeness example, you want one row per satellite with its total contact time and its longest quiet period. A colleague writes `MAX(aos - LAG(los) OVER (PARTITION BY sat_id ORDER BY aos))` next to `SUM(los - aos)` in a single GROUP BY query, and PostgreSQL refuses. Why, and what is the fix? What are the answers for SAT-001 and SAT-002?
:::

::: answer
PostgreSQL says `aggregate function calls cannot contain window function calls`. In the logical order, GROUP BY and its aggregates run *before* window functions (lesson 01). MAX would need the LAG results while the rows are being grouped, but LAG has not been computed yet.

The fix is the usual two steps. First a CTE that computes `quiet_before` with LAG on every pass row, then an outer query that groups by `sat_id` and takes `SUM(los - aos)` and `MAX(quiet_before)`.

SAT-001: contact $8 + 5 = 13$ minutes, longest quiet 1 h 27 min. SAT-002: contact $4 + 2 = 6$ minutes, longest quiet 1 h 37 min. MAX ignores the NULL quiet time on each satellite's first pass, which is what you want.
:::

## Summary

| Idea | What it means | In SQL |
| --- | --- | --- |
| Session | A burst of events with no silence longer than the threshold | — |
| Gap to previous event | Time since the last event of the same thing | `ts - LAG(ts) OVER (PARTITION BY sat_id ORDER BY ts)`; SQLite `unixepoch(ts) - unixepoch(LAG(ts) OVER (...))` |
| New-session mark | 1 on a session's first event | `CASE WHEN gap IS NULL OR gap > threshold THEN 1 ELSE 0 END` |
| Session number | Running count of marks | `SUM(mark) OVER (PARTITION BY sat_id ORDER BY ts ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)` |
| One row per session | Collapse with GROUP BY | `MIN(ts) AS aos, MAX(ts) AS los, COUNT(*)` |
| Threshold | Goes in the empty valley of the gap histogram | Between the longest in-session gap and the shortest between-session gap |
| Stable name | Does not change when late data arrives | `(sat_id, aos)`, not the running `pass_no` |

Sessions cut a stream by quiet time. The next lesson cuts it by the clock instead, into fixed buckets such as one minute, and asks what to keep from each bucket so that a thousand samples can be shown as one without hiding anything important.

::: context leo-pass Why a pass lasts only minutes
A satellite 550 km up circles the Earth in about 95.5 minutes, moving at roughly 7.6 km/s. From the ground it rises over one horizon and sets over the other in about ten minutes at best, less when it passes off to one side. Meanwhile the Earth turns underneath, so the next orbit carries it over a different strip of ground. A single station therefore sees a given satellite a few times a day, a few minutes each time.
:::

::: context session-word From web traffic to spacecraft
The word "session" in this sense comes from web analytics. A website logs each click with a time, and the analytics software groups a visitor's clicks into visits with an inactivity timeout; Google Analytics, for example, ends a session after 30 minutes without activity by default. The technique is the same whether the events are clicks, commands, log lines or radio packets. The spelling "sessionisation" is British; American writers usually spell it "sessionization".
:::

::: context event-stream Samples versus events
The telemetry tables earlier in this module held **samples**: a value measured on a schedule, every ten minutes or every minute. An **event** is something that happened at a moment: a packet arrived, a command was sent, a fault was flagged. Events do not come on a schedule, so the time between them carries information by itself. Sessionisation reads exactly that information.
:::

::: context polar-stations Three real ground stations near the poles
Svalbard (SvalSat, in the Norwegian Arctic), Inuvik (in Canada's Northwest Territories) and Troll (TrollSat, in Antarctica's Queen Maud Land) are real ground stations. They sit near the poles for a reason: a satellite in a polar orbit passes over both polar regions on every lap, so a station there can talk to it on most orbits, while a station near the equator sees it only a few times a day. The contact times in this lesson are made up.
:::

::: context sessions-picture The packet timeline
Each tick is one packet. Blue ticks are SAT-001, orange ticks SAT-002. The long quiet stretches (87 and 97 minutes) end one pass and start the next; the three-minute dropout at 10:03 is shorter than the 5-minute threshold, so pass 1 stays whole.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="70" y1="50" x2="345" y2="50" stroke="#6c7a93" stroke-width="1"/>
  <line x1="70" y1="105" x2="345" y2="105" stroke="#6c7a93" stroke-width="1"/>
  <text x="10" y="54" font-size="11" fill="#1f2a44">SAT-001</text>
  <text x="10" y="109" font-size="11" fill="#1f2a44">SAT-002</text>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="70.0" y1="40" x2="70.0" y2="60"/><line x1="72.2" y1="40" x2="72.2" y2="60"/><line x1="74.4" y1="40" x2="74.4" y2="60"/><line x1="76.6" y1="40" x2="76.6" y2="60"/><line x1="83.2" y1="40" x2="83.2" y2="60"/><line x1="85.4" y1="40" x2="85.4" y2="60"/><line x1="87.6" y1="40" x2="87.6" y2="60"/><line x1="278.5" y1="40" x2="278.5" y2="60"/><line x1="280.7" y1="40" x2="280.7" y2="60"/><line x1="282.9" y1="40" x2="282.9" y2="60"/><line x1="285.1" y1="40" x2="285.1" y2="60"/><line x1="287.3" y1="40" x2="287.3" y2="60"/><line x1="289.5" y1="40" x2="289.5" y2="60"/>
  </g>
  <g stroke="#f2b880" stroke-width="1.5">
    <line x1="113.9" y1="95" x2="113.9" y2="115"/><line x1="116.1" y1="95" x2="116.1" y2="115"/><line x1="118.3" y1="95" x2="118.3" y2="115"/><line x1="120.5" y1="95" x2="120.5" y2="115"/><line x1="122.7" y1="95" x2="122.7" y2="115"/><line x1="335.6" y1="95" x2="335.6" y2="115"/><line x1="337.8" y1="95" x2="337.8" y2="115"/><line x1="340.0" y1="95" x2="340.0" y2="115"/>
  </g>
  <text x="183" y="44" font-size="11" fill="#6c7a93" text-anchor="middle">87 min quiet</text>
  <text x="229" y="99" font-size="11" fill="#6c7a93" text-anchor="middle">97 min quiet</text>
  <text x="79" y="75" font-size="11" fill="#1d6fd1" text-anchor="middle">pass 1</text>
  <text x="284" y="75" font-size="11" fill="#1d6fd1" text-anchor="middle">pass 2</text>
  <text x="118" y="130" font-size="11" fill="#1f2a44" text-anchor="middle">pass 1</text>
  <text x="338" y="130" font-size="11" fill="#1f2a44" text-anchor="middle">pass 2</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="70.0" y="146">10:00</text><text x="201.7" y="146">11:00</text><text x="333.4" y="146">12:00</text>
  </g>
</svg>
```

The scale is about 2.2 pixels per minute, so each pass is a thin cluster. Pass 1's small hole between 10:03 and 10:06 is the dropout.
:::

::: context aos-los Acquisition and loss of signal
AOS, acquisition of signal, is the moment a ground station first locks onto a satellite's radio signal as it rises. LOS, loss of signal, is the moment the lock is lost as it sets. Contact schedules are written in AOS and LOS times predicted from the orbit. Measuring them from the packets, as here, gives the times contact *actually* happened, and comparing the two is how a team spots an antenna or a satellite radio that is not performing.
:::

::: context gap-histogram Two humps and a valley
Counted by size, the gaps in a packet log form two humps: a tall one of short gaps inside passes and a lower, wider one of long gaps between passes. The threshold goes in the empty valley between them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1"/>
  <line x1="30" y1="20" x2="30" y2="120" stroke="#1f2a44" stroke-width="1"/>
  <g fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1">
    <rect x="36" y="30" width="16" height="90"/>
    <rect x="54" y="92" width="16" height="28"/>
    <rect x="72" y="108" width="16" height="12"/>
    <rect x="228" y="100" width="16" height="20"/>
    <rect x="246" y="84" width="16" height="36"/>
    <rect x="264" y="92" width="16" height="28"/>
    <rect x="282" y="104" width="16" height="16"/>
    <rect x="300" y="112" width="16" height="8"/>
  </g>
  <line x1="150" y1="20" x2="150" y2="120" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="150" y="16" font-size="11" fill="#b4232c" text-anchor="middle">threshold</text>
  <text x="62" y="22" font-size="11" fill="#1f2a44" text-anchor="start">inside passes</text>
  <text x="272" y="74" font-size="11" fill="#1f2a44" text-anchor="middle">between passes</text>
  <text x="185" y="140" font-size="11" fill="#1f2a44" text-anchor="middle">gap length (longer to the right)</text>
  <text x="14" y="70" font-size="11" fill="#1f2a44" text-anchor="middle" transform="rotate(-90 14 70)">count</text>
</svg>
```

Real gap lengths span from a second to many hours, so these plots usually use a logarithmic axis for gap length.
:::

::: context late-data Why telemetry arrives out of order
Many satellites record telemetry on board and play it back later, when they are next over a station — often newest first, or in blocks. Different stations upload their files to the ground database at different times. So the database may receive Tuesday's packets from one station on Wednesday, after Wednesday's packets from another. Queries that number things "from the start" must be rerun, and their numbers can change, whenever older data lands.
:::
