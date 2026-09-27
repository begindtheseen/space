---
id: l04-transactions-and-acid
title: Transactions, isolation and deadlocks
minutes: 27
covers:
  - Transactions and ACID; isolation levels; deadlocks
---

Think about moving money between two piggy banks. You take five dollars out of the first and put it in the second. Drop the coins halfway and the money has left one bank without reaching the other. Let your brother count both banks while your hand is in between and his total is five dollars short. Two steps have to look like *one*: all or nothing, and nobody sees the half-way state.

Databases have the same problem all day long. A downlinked telemetry frame holds fifty channels, and they should arrive together or not at all. A satellite's move into a new orbital plane (last-but-one lesson) closed one dimension row and opened another, and nobody should ever see Relay-3 with no current row. The tool for this is a **transaction**: a group of statements the database treats as one indivisible change.

This lesson explains what a transaction promises — the four properties called ACID — and then what happens when many transactions run at once, which in a fleet database is always. You will watch two real PostgreSQL sessions collide, see each classic anomaly and the isolation level that prevents it, and finish with a real deadlock.

## BEGIN, COMMIT and ROLLBACK

A transaction starts with `BEGIN` and ends with either `COMMIT` ("make all of this permanent") or `ROLLBACK` ("undo all of this, as if it never happened"). Between the two, your changes are visible to you but to nobody else.

If you do not write `BEGIN`, PostgreSQL wraps each statement in its own small transaction and commits it immediately. That is called **[[autocommit|autocommit]]**, and it is why every statement in earlier lessons took effect at once.

Here is a telemetry frame ingested as one transaction: three samples, plus an update to the satellite's latest-state table. The third sample has lost its value somewhere upstream:

```sql
BEGIN;
INSERT INTO frame_sample VALUES ('SAT-001','2026-03-01 00:00Z','BATT_SOC',0.94);
INSERT INTO frame_sample VALUES ('SAT-001','2026-03-01 00:00Z','BUS_TEMP',18.2);
INSERT INTO frame_sample VALUES ('SAT-001','2026-03-01 00:00Z','BATT_V',NULL);
UPDATE sat_state SET soc = 0.94 WHERE sat_id = 'SAT-001';
COMMIT;
SELECT count(*) FROM frame_sample;
```

```text
BEGIN
INSERT 0 1
INSERT 0 1
ERROR:  null value in column "value" of relation "frame_sample" violates not-null constraint
DETAIL:  Failing row contains (SAT-001, 2026-03-01 00:00:00+00, BATT_V, null).
ERROR:  current transaction is aborted, commands ignored until end of transaction block
ROLLBACK
 count
-------
     0
(1 row)
```

Walk through it. The first two inserts succeeded. The third broke the `NOT NULL` constraint from last lesson, and from that moment the transaction is **aborted**: PostgreSQL refuses every further statement in it, so the `UPDATE` never ran. The reply to `COMMIT` says `ROLLBACK` — a broken transaction cannot commit, so PostgreSQL undid everything, including the two inserts that had worked. The count is 0: no half-frame reached the table.

Fix the frame and send it again, and all four changes land together:

```sql
BEGIN;
INSERT INTO frame_sample VALUES ('SAT-001','2026-03-01 00:00Z','BATT_SOC',0.94),
  ('SAT-001','2026-03-01 00:00Z','BUS_TEMP',18.2),('SAT-001','2026-03-01 00:00Z','BATT_V',16.4);
UPDATE sat_state SET soc = 0.94 WHERE sat_id = 'SAT-001';
COMMIT;
```

```text
BEGIN
INSERT 0 3
UPDATE 1
COMMIT
```

`ROLLBACK` is also yours to use on purpose: run a risky `DELETE` inside `BEGIN`, look at what it did, and undo it.

SQLite understands the same three words, `BEGIN`, `COMMIT` and `ROLLBACK`, and also rolls back a transaction as a whole.

::: key Transactions
`BEGIN` starts a transaction; `COMMIT` makes all its changes permanent together; `ROLLBACK` discards them all. Without `BEGIN`, each statement is its own transaction (autocommit). In PostgreSQL, after any error inside a transaction, every later statement is refused until the transaction ends, and `COMMIT` then rolls back.
:::

## ACID: what a transaction promises

Database people sum up the promises in four letters, **[[ACID|acid-name]]**. Each one answers a different "what if".

**A is for Atomicity.** *What if something fails halfway?* All of the transaction's changes happen, or none do. You saw it above: the frame with a missing value left no trace. "Atomic" means "cannot be split", the same word as in atomic values in lesson 1.

**C is for Consistency.** *What if a change would break the rules?* A transaction takes the database from one state where every constraint holds to another where every constraint holds. The rules are the ones you declared: `NOT NULL`, `UNIQUE`, `CHECK`, foreign keys. Deferred constraints from last lesson are checked at `COMMIT`, so a transaction may pass through a rule-breaking moment in the middle, but never end in one. Consistency is partly your job: the database can only enforce rules you wrote down.

**I is for Isolation.** *What if two transactions run at the same time?* Each should behave as if it were alone, at least to the degree its **isolation level** promises. This is the hard letter, and most of this lesson.

**D is for Durability.** *What if the power fails a millisecond after COMMIT?* Once `COMMIT` returns, the change survives crashes. PostgreSQL does this by writing each change first to the **[[write-ahead log|wal]]** (WAL), an append-only file, and forcing that file onto disk before it tells you "COMMIT". After a crash, it replays the log.

::: example ACID for one telemetry frame
A ground station receives a frame from SAT-001 with 50 channel samples. The ingest service writes the 50 rows and updates `sat_state` with the latest battery charge, in one transaction.

- **Atomicity.** Sample 37 has a corrupt value and breaks a `CHECK`. All 50 inserts and the update roll back. The frame is retried or quarantined whole; no dashboard ever shows 36 channels of it.
- **Consistency.** The frame names `SAT-0O4` (a letter O). The foreign key to the satellite table refuses it, so the transaction cannot commit an orphan.
- **Isolation.** An alarm query reading `sat_state` while the frame is half-written sees the *old* battery charge, never a value from a frame whose other channels are not in yet.
- **Durability.** The service logs "frame 88412 stored" after `COMMIT` returns; the server loses power a second later. After restart, all 51 changes are there.

**Check.** Each letter protected against a different failure: a bad value, a bad reference, a concurrent reader, a crash.
:::

::: key ACID
**Atomicity**: all or nothing. **Consistency**: every committed state satisfies the declared constraints. **Isolation**: concurrent transactions do not see each other's partial work, to the degree the isolation level promises. **Durability**: once COMMIT returns, the change survives a crash (PostgreSQL writes it to the WAL on disk first).
:::

## Watching two sessions at once

To see isolation at work you need two **sessions** — two separate connections to the database, like two people at two keyboards. The demonstrations below ran as two real `psql` processes started together, each pausing with `SELECT pg_sleep(n)` (wait n seconds) so their steps interleave in a known order. The tables are small:

```text
sat_state                                 ingest_stats
 sat_id  | plane |   mode    | soc         station  | frames
---------+-------+-----------+------       ----------+--------
 SAT-001 |     1 | ACTIVE    | 0.94        SVALBARD |    100
 SAT-002 |     1 | ACTIVE    | 0.42
 SAT-003 |     2 | SAFE_MODE | 0.19
 SAT-004 |     2 | ACTIVE    | 0.77
```

Each demo shows a timeline (who ran what, when), then real output.

PostgreSQL makes this work with **[[MVCC|mvcc]]**, multi-version concurrency control: when a row is updated, the old version is kept alongside the new one for a while, so a reader can be shown whichever version its snapshot calls for. A **snapshot** is a picture of which transactions had committed at a given moment. The isolation level decides *when* your transaction takes its snapshot.

### Dirty reads: never in PostgreSQL

A **dirty read** is seeing another transaction's change before it commits — a change that might yet be rolled back. Session B puts SAT-001 into safe mode with a battery of 0.05 but has not committed; session A reads at the lowest level the SQL standard names, `READ UNCOMMITTED`:

```text
0 s   B: BEGIN; UPDATE sat_state SET mode = 'SAFE_MODE', soc = 0.05 WHERE sat_id = 'SAT-001';
1 s   A: BEGIN ISOLATION LEVEL READ UNCOMMITTED; SELECT mode, soc ... WHERE sat_id = 'SAT-001';
2 s   A: COMMIT;          B: ROLLBACK;
```

```text
  mode  | soc
--------+------
 ACTIVE | 0.94
(1 row)
```

A saw the committed value. PostgreSQL accepts the words `READ UNCOMMITTED` but behaves as `READ COMMITTED`: it never shows uncommitted data. Good thing — B rolled back, so an alarm raised from that 0.05 would have been for something that never happened.

### Non-repeatable reads: the default allows them

A **non-repeatable read** is reading the same row twice in one transaction and getting different values, because another transaction committed a change in between.

```text
0 s   A: BEGIN; SELECT soc FROM sat_state WHERE sat_id = 'SAT-002';
1 s   B: UPDATE sat_state SET soc = 0.40 WHERE sat_id = 'SAT-002';   -- autocommit
2 s   A: SELECT soc FROM sat_state WHERE sat_id = 'SAT-002'; COMMIT;
```

Under PostgreSQL's default level, **READ COMMITTED**, A printed:

```text
 soc
------
 0.42
(1 row)

 soc
------
 0.40
(1 row)
```

In READ COMMITTED, each *statement* takes a fresh snapshot, so the second `SELECT` saw B's committed change. Now the same timeline with A starting `BEGIN ISOLATION LEVEL REPEATABLE READ;`:

```text
 soc
------
 0.42
(1 row)

 soc
------
 0.42
(1 row)
```

In **REPEATABLE READ**, the snapshot is taken at the transaction's first statement and kept to the end, so every read inside it sees the same committed world — what a multi-query report wants.

### Phantom reads

A **phantom read** is when a query for a *set* of rows returns different rows the second time, because another transaction inserted or deleted matching rows.

```text
0 s   A: BEGIN; SELECT count(*) FROM sat_state WHERE mode = 'SAFE_MODE';
1 s   B: INSERT INTO sat_state VALUES ('SAT-005', 3, 'SAFE_MODE', 0.12);
2 s   A: SELECT count(*) FROM sat_state WHERE mode = 'SAFE_MODE'; COMMIT;
```

READ COMMITTED gave A counts of 1 then 2. REPEATABLE READ gave 1 then 1. One snapshot for the whole transaction hides newly committed rows too. (The SQL standard would *allow* phantoms at repeatable read; PostgreSQL is stricter.)

::: key Isolation levels in PostgreSQL
**READ COMMITTED** (the default): each statement sees data committed before *that statement* began. **REPEATABLE READ**: the whole transaction sees one snapshot, taken at its first statement. **SERIALIZABLE**: as repeatable read, plus PostgreSQL aborts any transaction whose outcome could not have happened in some one-at-a-time order. **READ UNCOMMITTED** is accepted but behaves as READ COMMITTED, so dirty reads never happen in PostgreSQL. Set a level with `BEGIN ISOLATION LEVEL …`.
:::

## The lost update

The anomalies so far only confused readers. The next two lose or break data.

A **lost update** happens when two transactions each read a value, compute a new one from it in the application, and write it back: the second write overwrites the first, and the [[first change vanishes|lost-update-picture]]. Two ingest workers each count frames they received from the Svalbard ground station. The `\gset` command is a [[psql feature|gset]] that stores a query's result in a variable, here `:frames`, standing in for a program that reads a value into its own memory. `\echo` prints a line, and `\g /dev/null` runs the sleep and throws its output away.

::: example Two workers, one counter
**The script each session runs** (A adds 50, B adds 30; B starts half a second later):

```sql
BEGIN;
SELECT frames FROM ingest_stats WHERE station = 'SVALBARD' \gset
\echo A read frames = :frames
SELECT pg_sleep(1) \g /dev/null
UPDATE ingest_stats SET frames = :frames + 50 WHERE station = 'SVALBARD';
COMMIT;
```

**READ COMMITTED.** Real output:

```text
===== A
BEGIN
A read frames = 100
UPDATE 1
COMMIT
===== B
BEGIN
B read frames = 100
UPDATE 1
COMMIT
 frames
--------
    130
(1 row)
```

Both read 100. A wrote 150 and committed. B then wrote $100 + 30 = 130$ over it. The right answer is $100 + 50 + 30 = 180$. A's 50 frames are lost, and no error appeared anywhere.

**REPEATABLE READ.** Same scripts, with `BEGIN ISOLATION LEVEL REPEATABLE READ;`:

```text
===== A
BEGIN
A read frames = 100
UPDATE 1
COMMIT
===== B
BEGIN
B read frames = 100
psql:lur_B.sql:7: ERROR:  could not serialize access due to concurrent update
ROLLBACK
 frames
--------
    150
(1 row)
```

B tried to update a row changed and committed after B's snapshot was taken. Repeatable read refuses that; B's `COMMIT` came back as `ROLLBACK`. The counter says 150 — wrong for now, but *not silently*: B can retry, read 150 and write 180.

**The two real fixes.** First, let the database do the arithmetic, so there is no read-then-write gap at all:

```sql
UPDATE ingest_stats SET frames = frames + 50 WHERE station = 'SVALBARD';
```

With A doing `+ 50` and B doing `+ 30` this way, in READ COMMITTED, the result was:

```text
 frames
--------
    180
(1 row)
```

B's `UPDATE` waited for A's row lock, then re-read the committed row (150) and added 30. Second, when the new value really must be computed outside the database, lock the row while reading it with `SELECT … FOR UPDATE`:

```sql
SELECT frames FROM ingest_stats WHERE station = 'SVALBARD' FOR UPDATE \gset
```

```text
===== A
BEGIN
A read frames = 100
UPDATE 1
COMMIT
===== B
BEGIN
B read frames = 150
UPDATE 1
COMMIT
 frames
--------
    180
(1 row)
```

B's `SELECT … FOR UPDATE` waited until A committed, then read 150. **Check:** $100 + 50 + 30 = 180$ in both fixed runs.
:::

::: warning Read, compute, write is the pattern that loses updates
Any code that `SELECT`s a value, changes it in the program, and `UPDATE`s it back is a lost update waiting for a busy day. Write `SET x = x + n`, read with `FOR UPDATE`, or use REPEATABLE READ and retry. Tests with one worker never catch it.
:::

## Write skew

**Write skew** is subtler. Two transactions read the *same* rows, each checks a rule that involves several rows, and then each writes to a *different* row. Neither overwrote the other, so no update is lost — but together they break the rule each one checked.

::: example Taking two satellites down for maintenance
**The rule.** Orbital plane 1 must keep at least one ACTIVE satellite for coverage. Plane 1 has two: SAT-001 and SAT-002. Two operators each want to put one satellite into maintenance, and each runs a script that checks the rule first:

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT count(*) AS active_in_plane_1 FROM sat_state WHERE plane = 1 AND mode = 'ACTIVE';
SELECT pg_sleep(1) \g /dev/null
UPDATE sat_state SET mode = 'MAINTENANCE' WHERE sat_id = 'SAT-001';  -- B: SAT-002
COMMIT;
```

The operator only runs the `UPDATE` if the count is at least 2, so taking one away leaves at least one.

**REPEATABLE READ.** Both saw 2, both updated, both committed:

```text
 active_in_plane_1
-------------------
                 2
(1 row)

UPDATE 1
COMMIT
```

(the same for B), leaving plane 1 like this:

```text
 sat_id  |    mode
---------+-------------
 SAT-001 | MAINTENANCE
 SAT-002 | MAINTENANCE
(2 rows)
```

Zero active satellites. Each transaction was correct alone; together they were not. Repeatable read did not object, because they wrote *different* rows.

**SERIALIZABLE.** The same scripts with `BEGIN ISOLATION LEVEL SERIALIZABLE;`. A committed; B got:

```text
ERROR:  could not serialize access due to read/write dependencies among transactions
DETAIL:  Reason code: Canceled on identification as a pivot, during write.
HINT:  The transaction might succeed if retried.
```

and plane 1 kept SAT-002 active. PostgreSQL saw that each transaction had read rows the other then wrote — a pattern no one-after-the-other order could produce — and cancelled one. Retried, B reads a count of 1 and declines.

**Check.** Serial order A-then-B would give "A takes SAT-001 down; B sees 1 active, refuses". B-then-A is the mirror. Neither order ends with zero active, so ending with zero active cannot be serializable — which is exactly what the error said.
:::

::: key The anomalies and the levels that stop them
**Dirty read**: never in PostgreSQL. **Non-repeatable read** and **phantom read**: possible in READ COMMITTED, prevented from REPEATABLE READ up. **Lost update** (read, compute, write back): silent in READ COMMITTED, an error in REPEATABLE READ and SERIALIZABLE. **Write skew** (each checks a multi-row rule, each writes a different row): allowed in REPEATABLE READ, prevented only by **SERIALIZABLE**. Stricter levels prevent anomalies by aborting a transaction, so code at those levels must **retry** on a serialization failure.
:::

::: warning Serializable is not free and not automatic
SERIALIZABLE has to [[track what every transaction read|ssi]], and it aborts more often under load. Fine for a few operator actions a minute; a poor fit for a pipeline inserting a hundred thousand samples a second, which should rely on keys and constraints. Whatever level you choose, the error path must retry the whole transaction from `BEGIN` — not one statement.
:::

## Deadlocks

When a transaction updates a row, it holds a **lock** on that row until it commits or rolls back. Another transaction that wants to change the same row waits in line. Waiting is normal. A **deadlock** is waiting that can never end: A holds a lock B needs, while B holds a lock A needs. Each [[waits for the other forever|deadlock-cycle]].

Picture two people in a narrow hallway, each holding one door open and waiting for the other to go through first.

::: example A real deadlock, and the fix
**The collision.** Two jobs both update battery charges for SAT-001 and SAT-002, in opposite orders:

```sql
-- Session A                                   -- Session B
BEGIN;                                         BEGIN;
UPDATE sat_state SET soc = 0.93                UPDATE sat_state SET soc = 0.39
  WHERE sat_id = 'SAT-001';                      WHERE sat_id = 'SAT-002';
SELECT pg_sleep(1);                            SELECT pg_sleep(1);
UPDATE sat_state SET soc = 0.41                UPDATE sat_state SET soc = 0.92
  WHERE sat_id = 'SAT-002';                      WHERE sat_id = 'SAT-001';
COMMIT;                                        COMMIT;
```

At 0 s, A locks SAT-001 and B locks SAT-002. At 1 s, A asks for SAT-002 (held by B) and B asks for SAT-001 (held by A). Neither can move. Real output:

```text
===== A
BEGIN
UPDATE 1
psql:dl_A.sql:5: ERROR:  deadlock detected
DETAIL:  Process 3287 waits for ShareLock on transaction 41774; blocked by process 3288.
Process 3288 waits for ShareLock on transaction 41773; blocked by process 3287.
HINT:  See server log for query details.
CONTEXT:  while updating tuple (0,2) in relation "sat_state"
ROLLBACK
===== B
BEGIN
UPDATE 1
UPDATE 1
COMMIT
```

**Reading the error.** After a transaction has waited for `deadlock_timeout` (1 second by default), PostgreSQL looks for a cycle in who-waits-for-whom. It found one — process 3287 waits for 3288, and 3288 waits for 3287 — and cancelled A to break it. A's whole transaction rolled back; B got its lock and committed, leaving SAT-001 at 0.92 and SAT-002 at 0.39. The run took about 2.1 seconds: 1 second of sleep, about 1 of waiting.

**The fix: one order for everyone.** Change B to update SAT-001 first, then SAT-002, the same order as A. Real output:

```text
===== A
BEGIN
UPDATE 1
UPDATE 1
COMMIT
===== B
BEGIN
UPDATE 1
UPDATE 1
COMMIT
 sat_id  | soc
---------+------
 SAT-001 | 0.92
 SAT-002 | 0.39
(2 rows)
```

B's first update waited for A to commit, then went through. Waiting, but no cycle.

**Check.** If everyone locks in the same order (here, by `sat_id`), whoever gets SAT-001 first also gets SAT-002 first, and the other waits behind it; a cycle cannot form.
:::

The three habits that keep deadlocks rare, and harmless when they happen:

1. **Lock in a consistent order.** When one transaction touches several rows, sort them by key first. A batch update that sorts its input by `(sat_id, ts)` cannot deadlock with another batch doing the same.
2. **Keep transactions short.** Locks are held until the end of the transaction. Never wait for a user, a network call or a long computation inside one. A frame-ingest transaction should take milliseconds.
3. **Retry.** Deadlocks and serialization failures are normal in a busy system. Catch them by their **SQLSTATE**, the five-character code every SQL error carries — `40P01` for a deadlock, `40001` for a serialization failure — roll back, wait a short random time, and rerun the whole transaction, a limited number of times.

::: key Deadlocks
A **deadlock** is two (or more) transactions each waiting for a lock the other holds. PostgreSQL detects it after `deadlock_timeout` (1 s by default) and aborts one with `ERROR: deadlock detected` (SQLSTATE `40P01`). Prevent it with a **consistent lock order** and **short transactions**; handle it by **retrying** the whole transaction.
:::

::: note Where SQLite fits
SQLite allows only one writer to the whole database file at a time; a second writer waits and then gets `database is locked`. Its transactions are effectively serializable, but it cannot run concurrent writes at all — one reason fleet-scale telemetry lives in a server database.
:::

## Check yourself

::: check
Inside a transaction you run three `INSERT`s. The second fails a `CHECK` constraint. You then type `COMMIT`. What does PostgreSQL reply, and how many of the three rows are in the table?
:::

::: answer
It replies `ROLLBACK`. After the error, the transaction is aborted: the third `INSERT` is refused with "current transaction is aborted, commands ignored until end of transaction block", and `COMMIT` on an aborted transaction rolls back. Zero rows are in the table — including the first one, which had succeeded, because atomicity means all or nothing.
:::

::: check
A nightly report runs eight queries in one transaction to summarise the fleet: counts by mode, mean battery by plane, and so on. Ingest keeps writing the whole time. Which isolation level should the report use, and why does READ COMMITTED risk a report that does not add up?
:::

::: answer
REPEATABLE READ. It takes one snapshot at the first query and uses it for all eight, so every number describes the same moment. In READ COMMITTED each query takes a new snapshot, so rows committed between query 1 and query 5 appear in one and not the other — for example, "satellites by mode" might total 6,001 while "mean battery by plane" was computed over 6,000. The report does not need SERIALIZABLE because it only reads.
:::

::: check
Name the letter of ACID each of these protects against: (a) a power cut 1 ms after `COMMIT` returned; (b) a frame whose 12th sample has an invalid timestamp, leaving 11 samples stored; (c) a reading for a satellite id that is not in the satellite table.
:::

::: answer
(a) **Durability**: the commit was written to the write-ahead log on disk before `COMMIT` returned, so it survives. (b) **Atomicity**: in a transaction, the failed 12th insert rolls back the first 11 too. (c) **Consistency**: the foreign-key constraint refuses the orphan, so the transaction cannot commit a state that breaks a declared rule.
:::

::: check
Two operators run the maintenance-check script from the write-skew example at the same time, but on *different* planes: one takes down SAT-001 (plane 1), the other SAT-004 (plane 2). At SERIALIZABLE, would PostgreSQL be expected to abort either? Explain.
:::

::: answer
It should not need to. Each transaction reads only its own plane's rows and writes a row the other did not read, so running them one after the other in either order gives the same result. (PostgreSQL tracks reads coarsely when it has no index to work with, so it can occasionally abort a transaction that was actually safe — one more reason every serializable transaction needs a retry path.)
:::

::: check
A backfill job updates a million rows of `sat_state` in whatever order its input file lists them, in one transaction that takes ten minutes. The live ingest updates the same rows, one frame at a time, sorted by `sat_id`. The team sees several deadlocks a day. Give two changes that would help.
:::

::: answer
Any two of: (1) **sort the backfill's input by `sat_id`** so it takes locks in the same order as ingest; then no cycle can form between them. (2) **Split the backfill into small transactions**, say a thousand rows each, so each holds locks for well under a second instead of ten minutes. (3) **Retry** the backfill batch on `40P01` instead of failing the whole job. Making the ingest transaction shorter would help a little, but it is already short; the long, unsorted transaction is the real problem.
:::

## Summary

| Idea | Meaning |
| --- | --- |
| `BEGIN` / `COMMIT` / `ROLLBACK` | start / make permanent / undo a transaction |
| Atomicity | all of a transaction or none |
| Consistency | committed states satisfy declared constraints |
| Isolation | concurrent transactions do not see partial work |
| Durability | committed changes survive a crash (WAL on disk) |
| READ COMMITTED | PG default; new snapshot per statement |
| REPEATABLE READ | one snapshot per transaction; lost update becomes an error |
| SERIALIZABLE | also stops write skew; aborts with `40001`, retry |
| Deadlock | cycle of lock waits; `40P01`; consistent order, short transactions, retry |

With keys, constraints and transactions, the telemetry table now stores the right data safely. Next lesson turns to finding it fast: how an index works inside, and why a B-tree, a hash, GIN, GiST and BRIN index each suit a different kind of question.

::: context autocommit One statement, one transaction
Autocommit is the default in `psql` and in most database drivers: each statement is sent, run, and committed on its own. It is convenient for exploring, and dangerous for multi-step changes, because a failure between step 2 and step 3 leaves step 2 committed. Some tools work the other way round — Python's standard database interface, for instance, opens a transaction for you and waits for an explicit commit — so always check which mode your program is in before trusting it with a multi-row change.
:::

::: context acid-name Where the four letters came from
The properties were worked out by database researchers through the 1970s, and the acronym ACID was coined by Theo Härder and Andreas Reuter in a 1983 paper on recovery in databases. The chemistry pun is deliberate and stuck. You will also hear its jokey opposite, BASE ("basically available, soft state, eventually consistent"), used for distributed stores that relax isolation to stay available when parts of the network fail.
:::

::: context wal Write it down before you do it
The write-ahead log is like a pilot's logbook written before each manoeuvre: record the intent first, then act. Changing a data page on disk in place is slow and could be torn in half by a crash; appending a short record to the end of one file is fast and safe. PostgreSQL forces the WAL to disk at `COMMIT` and writes the actual table pages later, at its own pace. After a crash, it reads the WAL from the last checkpoint and replays every committed change. The same log is what streams to a replica server, which is how a second copy of a telemetry database stays up to date.
:::

::: context mvcc Several versions of one row
When a transaction updates a row, PostgreSQL does not overwrite it. It marks the old version as ended by that transaction and writes a new version marked as created by it. Each reader's snapshot decides which version it sees.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="12" y="20" width="160" height="34" rx="4" fill="#ffffff" stroke="#1f2a44"/>
  <text x="92" y="36" font-size="12" fill="#1f2a44" text-anchor="middle">SAT-002 soc 0.42</text>
  <text x="92" y="49" font-size="11" fill="#6c7a93" text-anchor="middle">old version, ended by B</text>
  <rect x="12" y="74" width="160" height="34" rx="4" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="92" y="90" font-size="12" fill="#1f2a44" text-anchor="middle">SAT-002 soc 0.40</text>
  <text x="92" y="103" font-size="11" fill="#1f2a44" text-anchor="middle">new version, made by B</text>
  <text x="200" y="36" font-size="11" fill="#1f2a44">snapshot before B commits</text>
  <line x1="196" y1="33" x2="176" y2="37" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="200" y="94" font-size="11" fill="#1d6fd1">snapshot after B commits</text>
  <line x1="196" y1="91" x2="176" y2="91" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="12" y="136" font-size="11" fill="#6c7a93">Old versions are cleaned up later by VACUUM.</text>
</svg>
```

Readers never wait for writers and writers never wait for readers; only two writers to the same row wait for each other.
:::

::: context lost-update-picture The lost update, on a clock
Both workers read 100 before either writes. Whoever writes last wins, and the other's increment disappears.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="340" y2="120" stroke="#6c7a93" stroke-width="1"/>
  <text x="44" y="134" font-size="11" fill="#6c7a93">0 s</text>
  <text x="300" y="134" font-size="11" fill="#6c7a93">1.5 s</text>
  <text x="10" y="40" font-size="12" font-weight="700" fill="#1f2a44">A</text>
  <text x="10" y="90" font-size="12" font-weight="700" fill="#1f2a44">B</text>
  <line x1="30" y1="36" x2="340" y2="36" stroke="#1f2a44" stroke-width="1"/>
  <line x1="30" y1="86" x2="340" y2="86" stroke="#1f2a44" stroke-width="1"/>
  <circle cx="50" cy="36" r="5" fill="#1d6fd1"/><text x="50" y="24" font-size="11" fill="#1d6fd1" text-anchor="middle">read 100</text>
  <circle cx="190" cy="36" r="5" fill="#1f2a44"/><text x="190" y="24" font-size="11" fill="#1f2a44" text-anchor="middle">write 150</text>
  <circle cx="120" cy="86" r="5" fill="#1d6fd1"/><text x="120" y="74" font-size="11" fill="#1d6fd1" text-anchor="middle">read 100</text>
  <circle cx="260" cy="86" r="5" fill="#b4232c"/><text x="260" y="74" font-size="11" fill="#b4232c" text-anchor="middle">write 130</text>
  <text x="260" y="108" font-size="11" fill="#b4232c" text-anchor="middle">A's +50 is gone</text>
</svg>
```
:::

::: context gset psql variables
`\gset` is a `psql` command, not SQL. It runs the query you typed and stores each output column in a `psql` variable of the same name, so `:frames` later expands to the number read. Here it stands in for what a real ingest program does: pull a value into the program's memory, compute with it, and send a new value back. The gap between that read and that write is where the lost update hides.
:::

::: context ssi How PostgreSQL makes serializable cheap enough
Before version 9.1, released in 2011, asking PostgreSQL for SERIALIZABLE gave you what is now called repeatable read. Version 9.1 introduced Serializable Snapshot Isolation, based on research by Michael Cahill and colleagues. It lets transactions run on snapshots without extra blocking, tracks which transactions read data that others wrote, and aborts one when it finds a "dangerous structure" of such dependencies. The "pivot" in the error message is the transaction in the middle of that structure.
:::

::: context deadlock-cycle The circle of waiting
PostgreSQL keeps a graph of who is waiting for whom. A deadlock is a cycle in that graph. Breaking any one arrow — aborting one transaction — ends it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="55" width="100" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="80" y="72" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">A</text>
  <text x="80" y="87" font-size="11" fill="#1f2a44" text-anchor="middle">holds SAT-001</text>
  <rect x="230" y="55" width="100" height="40" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="280" y="72" font-size="12" font-weight="700" fill="#1f2a44" text-anchor="middle">B</text>
  <text x="280" y="87" font-size="11" fill="#1f2a44" text-anchor="middle">holds SAT-002</text>
  <path d="M130 62 C 170 30, 190 30, 226 58" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="230,62 220,58 227,52" fill="#b4232c"/>
  <text x="180" y="28" font-size="11" fill="#b4232c" text-anchor="middle">A waits for SAT-002</text>
  <path d="M230 90 C 190 122, 170 122, 134 92" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="130,88 140,91 133,98" fill="#b4232c"/>
  <text x="180" y="136" font-size="11" fill="#b4232c" text-anchor="middle">B waits for SAT-001</text>
</svg>
```
:::
