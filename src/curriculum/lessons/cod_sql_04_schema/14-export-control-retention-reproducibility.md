---
id: l14-export-control-retention-reproducibility
title: Export control, retention and reproducible plots
minutes: 26
covers:
  - Export control and retention for flight data; reproducibility of every published plot
---

Think about a science-fair project. Three questions can come up that have nothing to do with how clever your graph is. *Who may see it?* Maybe part of your project uses a company's private data, and you promised not to share it. *How long do you keep your notes?* You cannot keep every scrap forever, but you had better not throw away the notebook the week before the judges ask about it. *Can you make the graph again?* A judge asks, "How exactly did you get this line?" If the answer is "I ran something once on my laptop and I'm not sure what", the graph is not worth much.

Flight data raises the same three questions, with more at stake. Some of it is legally controlled, and showing it to the wrong person is a federal offense in the United States. All of it costs money to store, and some of it must be kept for years because an investigation may need it. And every plot that leaves your screen — in a review, a report, a decision to change how a vehicle flies — must be reproducible, exactly, by someone else, long after you have moved on.

This lesson covers each in turn: **export control**, **retention**, and **reproducibility**. It closes the module, and the SQL track.

::: warning This lesson is not legal advice
Export-control law is detailed, it changes, and whether a particular dataset is controlled is a decision for trained people. What follows is the general shape, so you recognize when a question needs asking. The answer always comes from your company's **export-control office** (sometimes called trade compliance). When in doubt, ask them before you share, copy or upload anything.
:::

## Export control: who may see the data

Some technology is useful for weapons as well as for peaceful work. Rockets are the classic case: the same engineering puts a satellite in orbit or a warhead on a target. So governments control who can receive that technology, the way a school controls who can get the keys to the chemistry storeroom.

In the United States there are two main sets of **[[rules|itar-ear-where]]**.

- **ITAR**, the International Traffic in Arms Regulations, run by the State Department. It covers items on the **U.S. Munitions List**, which includes launch vehicles and many spacecraft and their parts, plus the **technical data** about them: information needed to design, build, operate or repair them.
- **EAR**, the Export Administration Regulations, run by the Commerce Department. It covers "dual-use" items and technology on the **Commerce Control List** — including many commercial satellites and their components since a reform in 2014 moved them from ITAR.

Which list something falls under, if either, is called its **jurisdiction and classification**, and it is decided by the export-control office, not by the engineer holding the file.

For data work, three ideas matter most.

**Technical data can be controlled, not just hardware.** Drawings, performance analyses, flight software and, in many cases, flight telemetry that reveals how a launch vehicle or spacecraft performs can all be controlled technical data. A CSV file can be as sensitive as a part.

**An export does not need a border.** Sending controlled data abroad is an export. So is emailing it to someone in another country, uploading it to a server located abroad, or showing it on your screen during a video call. And releasing it to a foreign person *inside* the United States — a visiting colleague, a contractor at the next desk — is treated as an export to that person's country. The EAR calls this a **[[deemed export|deemed-export]]**.

**Access depends on who you are.** Many controlled datasets may be released without a license only to **U.S. persons**: U.S. citizens, lawful permanent residents (green-card holders), and certain protected individuals such as people granted asylum. Others may need a license from the government first. That is why launch companies ask about citizenship and residency, and why some roles are open only to U.S. persons.

::: key Export control, in general terms
**ITAR** (State Department, U.S. Munitions List) and **EAR** (Commerce Department, Commerce Control List) can control technical data about launch vehicles and spacecraft, not only hardware. Releasing controlled data to a foreign person, even inside the U.S., counts as an export. Access is often limited to **U.S. persons** (citizens, permanent residents, protected individuals). The export-control office decides what is controlled; ask them, and do not treat this as legal advice.
:::

### What that means for a database

The engineering side is yours. Controlled data needs a label, access rules the database enforces, and a record of who read what.

- **Label every dataset** with its export classification, set by the export office, as a column or a table-level tag.
- **Enforce access in the database**, not only in the dashboard. A dashboard filter is one bug away from showing everything.
- **Log access**, so a question like "who pulled this channel last March?" has an answer.
- **Watch the copies.** A controlled table copied into a personal notebook, a public cloud bucket, a chat message or a question on a public forum is still controlled — and now outside every control above.

PostgreSQL can enforce a rule per row with **[[row-level security|rls]]** (RLS): a policy is a `WHERE` condition the database adds to every query from a given role, invisibly and unavoidably.

::: example Let the database hide controlled rows
A table documents each channel, with an `export_class` set by the export office. Two roles stand for two groups of users.

```sql
CREATE ROLE us_person_analyst;
CREATE ROLE general_analyst;

CREATE TABLE channel_doc (
  channel      text PRIMARY KEY,
  description  text NOT NULL,
  export_class text NOT NULL CHECK (export_class IN ('public', 'controlled'))
);
INSERT INTO channel_doc VALUES
  ('BATT_V',   'Main bus battery voltage',            'public'),
  ('BUS_T',    'Avionics bay temperature',            'public'),
  ('THR_GAIN', 'Thruster control-loop gain schedule', 'controlled');
GRANT SELECT ON channel_doc TO us_person_analyst, general_analyst;

ALTER TABLE channel_doc ENABLE ROW LEVEL SECURITY;
CREATE POLICY see_public ON channel_doc FOR SELECT
  TO general_analyst USING (export_class = 'public');
CREATE POLICY see_all ON channel_doc FOR SELECT
  TO us_person_analyst USING (true);
```

(The schema also needs `GRANT USAGE ON SCHEMA … TO` both roles.) Now run the same query as each role. `SET ROLE` switches who you are; `RESET ROLE` switches back.

```sql
SET ROLE general_analyst;
SELECT channel, export_class FROM channel_doc ORDER BY channel;
RESET ROLE;
```

```text
 channel | export_class
---------+--------------
 BATT_V  | public
 BUS_T   | public
(2 rows)
```

As `us_person_analyst`, the same query returns three rows, including `THR_GAIN | controlled`.

**Check:** the general role's query never mentioned `export_class`, yet it got two rows, not three. The database added `WHERE export_class = 'public'` for it. That is the point: a user cannot forget, or remove, a filter they never wrote.
:::

SQLite has no users, roles or row-level security: whoever can open the file can read all of it. Controlled data in SQLite has to be protected outside the database, by file permissions, encryption and where the file is allowed to live.

## Retention: how long to keep what

Keeping data costs money, and so does losing it. A **retention policy** is the written rule for each kind of data: how long it is kept, where, and what happens when time is up. A typical policy for a fleet might keep raw frames for a set number of years, engineering-unit samples for longer, and hourly aggregates for the life of the program. The numbers come from contracts, regulators, company lawyers and cost — not from whoever runs the database. Your job is to make the policy easy and safe to carry out.

### Tiering: hot, warm, cold

Most questions are about recent data, so storage is arranged in **[[tiers|tiers-picture]]** by age.

- **Hot**: the last days or weeks, in a row store on fast disks, fully indexed, for operators and live dashboards.
- **Warm**: the last months, compressed (lesson 10's compressed partitions or continuous aggregates), still queryable in seconds.
- **Cold**: years of archive, as columnar Parquet files on cheap object storage (lesson 11). Queries take minutes, and nobody minds, because they are rare.

Data moves down the tiers on a schedule. Nothing about the data changes as it moves, only where it lives and how fast it answers.

### Dropping a partition, not deleting rows

When data passes its retention date, removing it with `DELETE … WHERE ts < cutoff` is the wrong tool. On a table of billions of rows it reads and marks every old row, writes all of that to the log, and leaves dead space behind that the database must clean up later. With range partitioning by time (lesson 10), a whole month is one partition, and removing it is one quick **[[metadata operation|drop-vs-delete]]**:

```sql
ALTER TABLE hk_sample DETACH PARTITION hk_sample_2026_01;
DROP TABLE hk_sample_2026_01;
```

`DETACH` unhooks the partition from its parent, so it stops appearing in queries; `DROP` then deletes it. In between, you could copy the detached table to the cold tier — the usual order is archive, verify, then drop.

### Legal holds

Sometimes data must be kept *past* its retention date. When an anomaly investigation or a lawsuit begins, the company places a **[[legal hold|legal-hold]]** on the relevant data: nobody may delete it until the hold is lifted, whatever the retention policy says. A retention job that ignores holds is how a company ends up destroying evidence by accident.

::: example A retention job that respects holds
`hk_sample` is partitioned by month from January to April 2026, with three satellites sampled hourly. The policy keeps 90 days. Today is 1 June 2026, so the cutoff is $1\text{ June} - 90\text{ days} = 3\text{ March}$. One hold is active:

```sql
CREATE TABLE legal_hold (
  hold_id   text PRIMARY KEY,
  sat_id    text NOT NULL,
  hold_from timestamptz NOT NULL,
  hold_to   timestamptz NOT NULL,
  reason    text NOT NULL
);
INSERT INTO legal_hold VALUES
  ('AR-112', 'SAT-0002', '2026-02-14', '2026-02-16', 'battery anomaly review');
```

The partitions are named `hk_sample_YYYY_MM`, so each one's month can be read from its name. `pg_inherits` is PostgreSQL's own table listing which partitions belong to which parent.

```sql
WITH parts AS (
  SELECT c.relname AS partition,
         to_date(right(c.relname, 7), 'YYYY_MM')::timestamptz AS range_from,
         (to_date(right(c.relname, 7), 'YYYY_MM') + interval '1 month')::timestamptz AS range_to
  FROM pg_inherits AS i
  JOIN pg_class AS c ON c.oid = i.inhrelid
  WHERE i.inhparent = 'hk_sample'::regclass
)
SELECT p.partition, p.range_from::date, p.range_to::date,
       p.range_to <= timestamptz '2026-06-01' - interval '90 days' AS past_retention,
       EXISTS (SELECT 1 FROM legal_hold AS h
               WHERE h.hold_from < p.range_to AND h.hold_to > p.range_from) AS on_hold
FROM parts AS p
ORDER BY p.range_from;
```

```text
     partition     | range_from |  range_to  | past_retention | on_hold
-------------------+------------+------------+----------------+---------
 hk_sample_2026_01 | 2026-01-01 | 2026-02-01 | t              | f
 hk_sample_2026_02 | 2026-02-01 | 2026-03-01 | t              | t
 hk_sample_2026_03 | 2026-03-01 | 2026-04-01 | f              | f
 hk_sample_2026_04 | 2026-04-01 | 2026-05-01 | f              | f
```

Read it row by row. A partition is past retention only if its *whole* range ends on or before the cutoff: January (ends 1 Feb) and February (ends 1 March) are; March (ends 1 April) is not. The hold test is the overlap test for two half-open ranges: they overlap when each starts before the other ends. The hold, 14–16 February, overlaps February only.

So only January may be dropped. Count, drop, count again:

```sql
SELECT count(*) FROM hk_sample;
ALTER TABLE hk_sample DETACH PARTITION hk_sample_2026_01;
DROP TABLE hk_sample_2026_01;
SELECT count(*), min(ts) FROM hk_sample;
```

```text
 count
-------
  8640
(1 row)

ALTER TABLE
DROP TABLE
 count |          min
-------+------------------------
  6408 | 2026-02-01 00:00:00+00
(1 row)
```

The first count is 3 satellites × 120 days × 24 hours = 8640.

**Check:** January has $3 \times 31 \times 24 = 2232$ rows, and $8640 - 2232 = 6408$. The earliest remaining sample is 1 February, as it should be. February stays whole, even though the hold covers one satellite for two days; a team that needs the space can first copy the held rows into a separate hold table, then drop the partition.
:::

::: warning Deleting means deleting everywhere
When data reaches its end, it must go from every place it was copied: replicas, backups (on their own schedule), the Kafka topic, the cold archive, and the CSV someone exported into a notebook. A retention policy that only covers the main database is a policy for one copy.
:::

## Reproducibility: every published plot

Here is the question this whole section answers. Two years from now, a satellite has a battery problem. The review board pulls up a plot from today's fleet report that said the batteries were healthy. Can anyone make *exactly* that plot again, and see what it was based on?

::: key Why must every published plot be traceable to a query and a data version?
Because an anomaly investigation may reopen the analysis years later and must be able to reproduce it exactly. A plot whose provenance is a notebook someone ran once is not evidence.
:::

**Provenance** means "where it came from". A plot's provenance needs four things:

1. **The query**, exactly as run, with its parameters.
2. **The code version**: the **[[git commit hash|commit-hash]]** of the analysis code, and whether there were uncommitted changes ("dirty").
3. **The data version**: an **[[as-of time|as-of-picture]]**, a snapshot identifier, and the calibration version — so the same query sees the same rows.
4. **The environment**: the versions of Python, the libraries and the database.

The third one is the one people miss. Telemetry keeps arriving after the fact: lesson 12's onboard playback delivers hours-old samples at the next pass. A query for "the 06:00 hour" run at 08:00 and again at 10:00 can give different answers, with nobody having changed anything.

::: example Late data changes the answer, unless you pin the as-of time
Table `batt (sat_id, ts, value, ingested_at)` has one sample per minute for 06:00–06:59. Live data (28.0 V) was ingested at 07:05. Twenty eclipse minutes, 06:20–06:39, were out of contact and are not in yet. At 08:00 an analyst asks for the hour's mean, pinning the as-of time:

```sql
SELECT count(*) AS n, round(avg(value)::numeric, 3) AS mean_v
FROM batt
WHERE sat_id = 'SAT-0417'
  AND ts >= '2026-03-01 06:00' AND ts < '2026-03-01 07:00'
  AND ingested_at <= '2026-03-01 08:00';
```

```text
 n  | mean_v
----+--------
 40 | 28.000
```

At 09:40 the playback lands: twenty rows at 27.4 V (lower, because the battery was discharging in eclipse). Without the as-of filter the same question now says:

```text
 n  | mean_v
----+--------
 60 | 27.800
```

Check: $(40 \times 28.0 + 20 \times 27.4) / 60 = (1120 + 548) / 60 = 1668 / 60 = 27.8$. With `ingested_at <= '2026-03-01 08:00'` restored, it returns `40 | 28.000` again, today and in two years.

Both answers are "right". The 08:00 plot was right about the data it had; the later one is more complete. Reproducibility means being able to say which one a published plot was, and to rebuild it.
:::

::: warning An ingest timestamp is not a full snapshot
The as-of trick works only if old rows are never changed in place. A `DO UPDATE` upsert that overwrites a value (lesson 12) destroys the old version, and no as-of filter can bring it back. Tables that must support exact replay either keep every version of a row with its own ingest time, or rely on a storage layer with snapshots, such as table formats that let you query a table as it was at an earlier version.
:::

### Stamping a plot with its provenance

The pattern is simple: every plotting script computes a provenance record, writes it next to the figure as a small JSON **sidecar file**, and prints a one-line **stamp** on the figure itself (in matplotlib, with `fig.text` in a corner). The stamp is short enough for a slide; the sidecar has the full detail.

::: example A provenance stamp in Python
The script lives in a git repository and queries a SQLite copy of the `batt` table. It takes the as-of time as an argument.

```python
import hashlib, json, platform, sqlite3, subprocess, sys

QUERY = """
SELECT count(*) AS n, round(avg(value), 3) AS mean_v
FROM batt
WHERE sat_id = ? AND ts >= ? AND ts < ? AND ingested_at <= ?
"""
AS_OF = sys.argv[1]                      # e.g. 2026-03-01T08:00:00Z
PARAMS = ("SAT-0417", "2026-03-01T06:00:00Z", "2026-03-01T07:00:00Z", AS_OF)

def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True).stdout.strip()

con = sqlite3.connect("fleet.db")
rows = con.execute(QUERY, PARAMS).fetchall()

prov = {
    "query_sha256": hashlib.sha256(QUERY.encode()).hexdigest()[:12],
    "params": PARAMS,
    "as_of": AS_OF,
    "git_commit": git("rev-parse", "--short", "HEAD"),
    "git_dirty": git("status", "--porcelain") != "",
    "python": platform.python_version(),
    "sqlite": sqlite3.sqlite_version,
    "result_sha256": hashlib.sha256(repr(rows).encode()).hexdigest()[:12],
}
stamp = (f"{prov['git_commit']}{'+dirty' if prov['git_dirty'] else ''}"
         f" | query {prov['query_sha256']} | as of {AS_OF}"
         f" | data {prov['result_sha256']}")

print(rows)
print(stamp)
with open("batt_0600.provenance.json", "w") as f:
    json.dump(prov, f, indent=2)
```

`hashlib.sha256(...).hexdigest()[:12]` makes a short fingerprint of a text, like lesson 12's `md5`. `git rev-parse --short HEAD` prints the current commit's short hash, and `git status --porcelain` prints nothing when there are no uncommitted changes.

Run it twice with the same as-of time, then once with a later one:

```bash
python3 provenance.py 2026-03-01T08:00:00Z
python3 provenance.py 2026-03-01T08:00:00Z
python3 provenance.py 2026-03-01T10:00:00Z
```

```text
[(40, 28.0)]
8c8e5b5 | query 9c74636021e2 | as of 2026-03-01T08:00:00Z | data cfd94e9e8288
[(40, 28.0)]
8c8e5b5 | query 9c74636021e2 | as of 2026-03-01T08:00:00Z | data cfd94e9e8288
[(60, 27.8)]
8c8e5b5 | query 9c74636021e2 | as of 2026-03-01T10:00:00Z | data 3aba8424bf71
```

The first two stamps are identical: same code, same query, same as-of time, same data fingerprint. The third differs only in the as-of time and the data fingerprint — the stamp tells you *why* the number changed. Edit the script without committing and run again, and the stamp starts `8c8e5b5+dirty`: a warning that no commit holds the exact code that made this plot.

**Check:** to reproduce a stamped plot, you check out commit `8c8e5b5`, run with the as-of time on the stamp, and compare the data fingerprint. If it matches, you have the same numbers. If it does not, something upstream changed, and the sidecar tells you which versions to compare.
:::

::: key Provenance of a plot
Record the **query** (text and parameters, hashed), the **code version** (git commit, and whether the tree was dirty), the **data version** (as-of time or snapshot, calibration version) and the **environment** (language, library and database versions). Stamp a short line on the figure; save the full record as a sidecar file. A dirty tree means no commit holds the code.
:::

::: warning Do not publish from a dirty tree
If the stamp says `+dirty`, commit first and re-run. Plots made from uncommitted code are the most common reason a result cannot be reproduced six months later: the notebook cell was edited, the file was overwritten, and the commit hash points at code that did not make the figure.
:::

## Check yourself

::: check
A colleague who is not a U.S. person joins your team in the U.S. office next week. She will need access to the fleet telemetry database. What should happen, and who decides?
:::

::: answer
Releasing controlled technical data to a foreign person inside the U.S. is treated as an export (a deemed export), so it may need a license or may not be allowed at all. You do not decide. Raise it with the export-control office before she gets access; they determine which datasets are controlled and whether an authorization exists or is needed. Meanwhile, the database should enforce what she can see — roles plus row-level security or separate schemas — rather than relying on people to avoid certain tables.
:::

::: check
Your partitioned table has weekly partitions. The policy is "keep 180 days". Why is `DELETE FROM hk_sample WHERE ts < now() - interval '180 days'` a poor way to enforce it, and what should the job do instead? What must it check first?
:::

::: answer
`DELETE` touches every expired row: it reads them, marks each one dead, writes all of it to the log, and leaves space that must be vacuumed later — slow and heavy on a billion-row table. Instead, find whole partitions whose ranges end on or before the cutoff and `DETACH` then `DROP` them (after archiving to the cold tier if the policy says so). First, check each candidate partition against the legal-hold table with an overlap test (`hold_from < range_to AND hold_to > range_from`) and skip any that overlap an active hold.
:::

::: check
A plot's stamp reads `4f1a2c9 | query 1b7e0d33aa21 | as of 2026-05-02T00:00:00Z | data 77c02e19f4b0`. You rerun it at that commit with that as-of time and get data fingerprint `a90b11d2c6e4`. List two likely reasons.
:::

::: answer
The code and query match, so the data changed underneath. Likely reasons: (1) rows ingested before the as-of time were later overwritten in place, for example by a `DO UPDATE` upsert or a recalibration that updated engineering units, so the as-of filter no longer recovers the old values; (2) data in the as-of window was deleted by a retention job, or a reprocessing job re-ingested old data with new ingest times. A third possibility is an environment difference, such as a changed rounding in a library or database version, which is why the sidecar records versions too.
:::

::: check
Hold AR-200 covers 28 February 18:00 to 1 March 06:00. With monthly partitions for February and March, which partitions does it overlap? Show the test.
:::

::: answer
February is $[\text{1 Feb}, \text{1 Mar})$: hold_from (28 Feb 18:00) < 1 Mar, and hold_to (1 Mar 06:00) > 1 Feb, so it overlaps.

March is $[\text{1 Mar}, \text{1 Apr})$: hold_from (28 Feb 18:00) < 1 Apr, and hold_to (1 Mar 06:00) > 1 Mar, so it overlaps too.

The hold straddles midnight, so both partitions must be kept until it is lifted.
:::

::: check
Name the four things a plot's provenance record must contain, and for each say what goes wrong later if it is missing.
:::

::: answer
The query and parameters — without them you do not know which satellites, channels and time window were used. The code version (commit and dirty flag) — without it the processing steps, such as filters and averaging, cannot be recovered. The data version (as-of time or snapshot, calibration version) — without it late-arriving or corrected data silently changes the numbers. The environment (language, library and database versions) — without it a library change can shift results and nobody can tell why.
:::

## Summary

| Idea | In one line |
| --- | --- |
| ITAR | State Department; U.S. Munitions List; launch vehicles, many spacecraft, their technical data |
| EAR | Commerce Department; Commerce Control List; dual-use items, many commercial satellites |
| Deemed export | releasing controlled data to a foreign person inside the U.S. |
| U.S. person | citizen, lawful permanent resident, protected individual |
| Who decides | the export-control office; this is not legal advice |
| Row-level security | a policy adds a hidden `WHERE` per role; not available in SQLite |
| Tiering | hot (recent, fast), warm (compressed), cold (Parquet archive) |
| Retention | `DETACH` and `DROP` whole partitions past the cutoff, never bulk `DELETE` |
| Legal hold | overrides retention; test overlap `hold_from < range_to AND hold_to > range_from` |
| Provenance | query + code version (git hash, dirty flag) + data version (as-of, calibration) + environment |
| Stamp | a short line on the figure plus a JSON sidecar with the full record |

That closes the SQL track. You started with `SELECT` on one table, learned to join tables and to count without fanning out, then to look along rows with window functions, and here to design the tables, indexes and pipelines that hold a fleet's telemetry and to make every answer you draw from it one you can defend years later.

::: context itar-ear-where Where the rules are written
Both sets of rules are federal regulations, printed in the Code of Federal Regulations (CFR). ITAR is Title 22, parts 120 to 130, administered by the State Department's Directorate of Defense Trade Controls. EAR is Title 15, parts 730 to 774, administered by the Commerce Department's Bureau of Industry and Security. Other countries have their own export-control laws, and many coordinate through international agreements, so a company outside the U.S. has a similar office asking similar questions.
:::

::: context deemed-export An export without a shipment
The idea behind a deemed export is that knowledge travels with people. If a foreign national learns controlled technology in a U.S. lab, that knowledge can go home with them, just as surely as a shipped crate. So the law treats the moment of release — letting someone read the file, see the screen, or hear the explanation — as the export itself. For data engineers, this is why "who can query this table?" is a compliance question, not only a technical one.
:::

::: context rls How row-level security behaves
Once RLS is switched on for a table, a role with no matching policy sees no rows at all: the default is to deny. Superusers and the table's owner skip the policies unless the table is set to `FORCE ROW LEVEL SECURITY`, which is why the example switched to other roles to test it. Policies can also limit `INSERT`, `UPDATE` and `DELETE`, and a policy's condition can call functions, for instance to look up a user's clearance in another table.
:::

::: context tiers-picture Three shelves for data
Think of a kitchen: what you use today sits on the counter, what you use this month in the cupboard, and the holiday dishes in the attic. Each step down is cheaper and slower to reach.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="90" height="40" fill="#b4232c"/>
  <text x="65" y="45" font-size="12" fill="#ffffff" text-anchor="middle">Hot</text>
  <rect x="20" y="70" width="180" height="40" fill="#f2b880"/>
  <text x="110" y="95" font-size="12" fill="#1f2a44" text-anchor="middle">Warm</text>
  <rect x="20" y="120" width="320" height="40" fill="#8fb8f0"/>
  <text x="180" y="145" font-size="12" fill="#1f2a44" text-anchor="middle">Cold</text>
  <text x="120" y="38" font-size="11" fill="#1f2a44">days to weeks: row store, indexed</text>
  <text x="120" y="52" font-size="11" fill="#1f2a44">fastest, most costly per byte</text>
  <text x="210" y="88" font-size="11" fill="#1f2a44">months:</text>
  <text x="210" y="102" font-size="11" fill="#1f2a44">compressed, aggregates</text>
  <text x="180" y="167" font-size="11" fill="#1f2a44" text-anchor="middle">years: Parquet on object storage, slow, cheap</text>
</svg>
```
:::

::: context drop-vs-delete Why dropping is instant
Each partition is its own set of files on disk. Dropping it removes the files and a few catalog entries, no matter how many rows it held. A `DELETE` works row by row: every removed row gets marked dead and logged, and the space comes back only after vacuum runs. On a partition of a billion rows, one is a blink and the other is hours of disk traffic.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">hk_sample, partitioned by month</text>
  <rect x="10" y="30" width="80" height="40" fill="#ffffff" stroke="#b4232c" stroke-dasharray="4 3"/>
  <line x1="10" y1="30" x2="90" y2="70" stroke="#b4232c" stroke-width="2"/>
  <line x1="90" y1="30" x2="10" y2="70" stroke="#b4232c" stroke-width="2"/>
  <rect x="95" y="30" width="80" height="40" fill="#f2b880" stroke="#1f2a44"/>
  <rect x="180" y="30" width="80" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="265" y="30" width="80" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="90">Jan</text><text x="135" y="90">Feb</text>
    <text x="220" y="90">Mar</text><text x="305" y="90">Apr</text>
  </g>
  <text x="50" y="110" font-size="11" fill="#b4232c" text-anchor="middle">dropped</text>
  <text x="135" y="110" font-size="11" fill="#1f2a44" text-anchor="middle">on hold</text>
  <text x="262" y="110" font-size="11" fill="#1f2a44" text-anchor="middle">within retention</text>
</svg>
```
:::

::: context legal-hold A pause button on deletion
A legal hold (also called a litigation hold) is issued by a company's legal team when an investigation, dispute or lawsuit is expected. From then on, relevant records must be preserved, including data that routine processes would otherwise delete. Destroying held data, even by an automated job, can bring serious penalties. That is why the hold table is checked by the retention job itself, not remembered by a person.
:::

::: context commit-hash What the hash on a commit is
A git commit hash is a fingerprint computed from the commit's content: the files' contents, the commit message, the author, and the hash of the parent commit. Change any of it and the hash changes. So a hash names one exact state of the code, and nobody can quietly edit that state and keep the name. If you have done the git module, you met this there. The short form, the first seven or so characters, is enough to identify a commit in one repository.
:::

::: context as-of-picture Two clocks for every sample
A sample has the time it describes (`ts`) and the time your database learned it (`ingested_at`). An as-of query cuts along the second clock. Data engineers call tables that keep both "bitemporal".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="340" y2="120" stroke="#1f2a44"/>
  <line x1="40" y1="120" x2="40" y2="20" stroke="#1f2a44"/>
  <text x="190" y="142" font-size="11" fill="#1f2a44" text-anchor="middle">ts: 06:00 to 07:00</text>
  <text x="12" y="70" font-size="11" fill="#1f2a44" transform="rotate(-90 12 70)" text-anchor="middle">ingested_at</text>
  <rect x="50" y="85" width="95" height="12" fill="#1d6fd1"/>
  <rect x="245" y="85" width="95" height="12" fill="#1d6fd1"/>
  <rect x="145" y="35" width="100" height="12" fill="#f2b880"/>
  <line x1="40" y1="65" x2="340" y2="65" stroke="#b4232c" stroke-dasharray="5 4"/>
  <text x="338" y="59" font-size="11" fill="#b4232c" text-anchor="end">as of 08:00</text>
  <text x="97" y="110" font-size="11" fill="#1f2a44" text-anchor="middle">07:05</text>
  <text x="195" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">playback at 09:40</text>
</svg>
```
:::
