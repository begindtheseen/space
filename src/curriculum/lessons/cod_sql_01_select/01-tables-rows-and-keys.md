---
id: l01-tables-rows-and-keys
title: Tables, rows and keys
minutes: 22
covers:
  - Relations, rows, columns and domains; primary and foreign keys
---

Imagine you look after a fleet of satellites. Every one of them talks to the ground: its battery charge, the temperature of its electronics, the voltage on its power bus, where it thinks it is, which way it is pointing. Each of those numbers arrives again and again, once a second or faster, for years.

Where do you keep all of that, and how do you find the one reading you need? A notebook would fill up in minutes. A spreadsheet would fill up in seconds. What engineers use instead is a **database** — a program whose whole job is to store large amounts of data safely and answer questions about it quickly. You ask the questions in a language called **[[SQL|sql-name]]**, short for Structured Query Language, read aloud either as the letters "S-Q-L" or as the word "sequel".

This module exists because of a real job: a data engineer on a satellite guidance, navigation and control (GNC) team, building the pipelines that watch the health of thousands of spacecraft in orbit. Everything in the next nine lessons is something that person does every day. This first lesson has almost no queries in it. It is about the shape the data lives in — tables, rows, columns and keys — because every question you ever ask a database depends on understanding that shape.

## What a database is, and why not a spreadsheet

You have probably used a spreadsheet: a grid of cells, with letters across the top and numbers down the side. A spreadsheet is a fine tool for a few hundred rows that one person edits. A satellite fleet breaks it in four ways.

**It is too big.** Suppose a fleet has 6,000 satellites and each one sends 50 measurements, called **channels**, once a second. That is $6000 \times 50 = 300000$ readings every second. A popular spreadsheet program stops at [[1,048,576 rows|spreadsheet-limit]]. At 300,000 readings a second, that sheet is full in about three and a half seconds. In one day the fleet sends

$$
6000 \times 50 \times 86400 = 25920000000
$$

readings — about 26 billion. (There are $86400$ seconds in a day.)

**Many people need it at once.** Operators, analysts and automatic alarms all read the same data while new readings stream in. A database lets thousands of readers and writers share it safely.

**The data must obey rules.** A satellite id that does not exist, a battery charge written as the word "heavy", two different records claiming to be the same satellite — a spreadsheet lets you type any of these. A database refuses them, every time, for everyone.

**You ask questions in words, not clicks.** "Every battery reading below 30 percent in the last hour, worst first" is one short SQL sentence. The database works out how to find those rows among billions, and the same sentence gives the same answer tomorrow, run by a colleague or by a script at 3 a.m.

The program that runs a database is called a **database management system**, or DBMS. This module uses two of them. **[[PostgreSQL|postgres-sqlite]]** (say "post-gres-Q-L", usually shortened to "Postgres") is a large, free database that runs as a **server** — a program on a shared computer that many people connect to over a network — and real telemetry teams run it. **SQLite** (say "S-Q-Lite") is a tiny one that lives inside a single file or even a web page — it is what runs the exercises in this app. They speak nearly the same SQL, and where they differ, these lessons say so.

::: key What a database is for
A database stores data under rules it enforces, lets many people read and write it at once, and answers questions written in SQL. You say *what* you want; the database decides *how* to find it.
:::

## Tables: the shape data lives in

A database holds its data in **tables**. A table looks like a spreadsheet grid, but it is stricter. Here is the first table of the fleet database this module uses all the way through. It is called `satellite`, and it has one row per spacecraft:

```text
 sat_id  |     name     | plane | altitude_km | launch_date |    status     | mass_kg
---------+--------------+-------+-------------+-------------+---------------+---------
 SAT-001 | Pathfinder-1 |     1 |         550 | 2024-01-15  | ACTIVE        |     306
 SAT-002 | Pathfinder-2 |     1 |         550 | 2024-01-15  | ACTIVE        |     306
 SAT-003 | Pathfinder-3 |     2 |         540 | 2024-03-02  | SAFE_MODE     |     306
 SAT-004 | Relay-1      |     2 |         540 | 2024-03-02  | ACTIVE        |     800
 SAT-005 | Relay-2      |     3 |         560 | 2024-06-20  | ACTIVE        |     800
 SAT-006 | Relay-3      |     3 |         560 | 2024-06-20  | DEORBITED     |     800
 SAT-007 | Mini-1       |     4 |         530 | 2025-02-11  | ACTIVE        |     740
 SAT-008 | Mini-2       |     4 |         530 | 2025-02-11  | COMMISSIONING |     740
```

Each **row** (one line across) is one thing — here, one satellite. Each **column** (one field down) is one fact about every thing — here, its id, its name, its orbital **plane** (which ring of orbits it flies in), its height above Earth in kilometers, the day it launched, its state, and its mass in kilograms. (ACTIVE means working normally. SAFE_MODE means it hit a problem and shut down everything nonessential. COMMISSIONING means newly launched and still being checked out. DEORBITED means steered down to burn up in the atmosphere.) The spot where one row meets one column is a **cell**, and it holds exactly one value: SAT-004's altitude is 540.

Column names use lowercase and underscores (`altitude_km`, say "altitude underscore k-m"). Putting the unit in the name means nobody has to guess whether 540 is kilometers or miles.

The second table holds the readings themselves. It is called `telemetry` — the word for measurements a spacecraft sends home — and it has one row per reading:

```text
 sat_id  |          ts          | channel  | value
---------+----------------------+----------+-------
 SAT-001 | 2026-03-01T00:00:00Z | BATT_SOC |  0.94
 SAT-001 | 2026-03-01T00:00:00Z | BUS_TEMP |  18.2
 SAT-001 | 2026-03-01T00:01:00Z | BATT_SOC |  0.91
 SAT-002 | 2026-03-01T00:00:00Z | BATT_SOC |  0.42
 SAT-002 | 2026-03-01T00:00:00Z | BUS_TEMP |  24.9
 SAT-002 | 2026-03-01T00:01:00Z | BATT_SOC |
 SAT-003 | 2026-03-01T00:00:00Z | BATT_SOC |  0.19
 SAT-003 | 2026-03-01T00:00:00Z | BUS_TEMP |  31.4
 SAT-004 | 2026-03-01T00:00:00Z | BATT_SOC |  0.77
 SAT-004 | 2026-03-01T00:01:00Z | BATT_SOC |  0.75
 SAT-005 | 2026-03-01T00:00:00Z | BATT_SOC |  0.66
 SAT-005 | 2026-03-01T00:00:00Z | BUS_TEMP |  21.5
 SAT-007 | 2026-03-01T00:00:00Z | BATT_SOC |  0.88
 SAT-008 | 2026-03-01T00:00:00Z | BATT_SOC |  0.55
```

`ts` is the **timestamp**, the moment the reading was taken, written year-month-day, then `T`, then hours:minutes:seconds, then `Z` for [[UTC|utc-z]], the world's reference clock. `channel` says what was measured: `BATT_SOC` is the battery **state of charge**, a fraction from 0 (empty) to 1 (full), and `BUS_TEMP` is the temperature of the electronics in degrees Celsius. `value` is the number itself.

Look at SAT-002 at one minute past midnight. Its value cell is empty. The reading was expected but never arrived — maybe the radio link dropped. Databases mark an empty cell with a special marker called **NULL**, meaning "no value here". NULL is not zero and it is not blank text. It behaves strangely enough that lesson 05 is all about it.

::: warning A table is not a spreadsheet
In a spreadsheet you can merge cells, leave a note in a random corner, or put two numbers in one cell. A table allows none of that. Every row has the same columns, every cell holds one value (or NULL), and every value in a column is the same kind of thing. That strictness is what makes billions of rows searchable.
:::

## Relations, columns and domains

The people who invented databases borrowed words from mathematics, and you will meet them in books and job interviews.

A table is formally called a **[[relation|relation-name]]** — a named set of rows that all have the same columns. A row is also called a **tuple** (rhymes with "couple"), and a column is also called an **attribute**. So "the `satellite` relation has seven attributes" means "the `satellite` table has seven columns".

Every column has a **domain** — the set of values it is allowed to hold. The domain of `altitude_km` is whole numbers. The domain of `launch_date` is calendar dates. The domain of `status` should be exactly four words: ACTIVE, SAFE_MODE, COMMISSIONING, DEORBITED. You tell the database the domain when you create the table, mostly by giving each column a **data type** (lesson 06 covers the choices), and sometimes with an extra rule such as `CHECK (status IN (...))`. The database then refuses any value outside it.

The word "set" in "a set of rows" matters. In mathematics a set has no order and no repeats. So in the pure model:

- **Rows have no order.** SAT-001 printed first above, but that means nothing. The database may hand rows back in any order it likes, unless you ask for an order (lesson 03 shows how, and why forgetting to ask is a classic bug).
- **No two rows are identical.** Real SQL is looser here — a table *can* hold two identical rows unless you stop it — and the tool for stopping it is a key, the subject of the next section.
- **Columns are found by name, not by position.** You ask for `altitude_km`, not "the fourth column".

::: key Relations, rows, columns and domains
A **relation** (table) is a set of rows with the same named columns. A **row** (tuple) is one thing; a **column** (attribute) is one fact about every thing; a **domain** is the set of values a column may hold. Rows have no built-in order.
:::

## Creating a table

Here is how the `satellite` table was made. This is your first SQL, so read it slowly:

```sql
CREATE TABLE satellite (
    sat_id       TEXT    PRIMARY KEY,
    name         TEXT    NOT NULL,
    plane        INTEGER NOT NULL,
    altitude_km  INTEGER NOT NULL,
    launch_date  DATE    NOT NULL,
    status       TEXT    NOT NULL,
    mass_kg      INTEGER NOT NULL
);
```

Read it aloud as: "Create a table named satellite, with a column sat_id holding text, which is the primary key; a column name holding text, which may not be null; …" and so on down the list. The parentheses hold the list of columns, separated by commas. Each column gets a name, then a type (`TEXT` for words, `INTEGER` for whole numbers, `DATE` for calendar days), then any rules. `NOT NULL` is a rule meaning "this cell may never be empty". The semicolon `;` at the end says "this statement is finished".

SQL ignores capitals in its own words, so `create table` works too, but capitals for SQL words and lowercase for your own names make a statement easier to scan.

Rows go in with `INSERT`:

```sql
INSERT INTO satellite (sat_id, name, plane, altitude_km, launch_date, status, mass_kg)
VALUES ('SAT-001', 'Pathfinder-1', 1, 550, '2024-01-15', 'ACTIVE', 306);
```

Text and dates go inside single quotes; numbers do not. The first list names the columns, and the `VALUES` list gives one value for each, in the same order.

And to look at a whole table — this is the statement that printed the grids above — you write:

```sql
SELECT * FROM satellite;
```

Say it "select star from satellite": `*` means "every column". Next lesson takes this sentence apart.

## Primary keys: every row gets an identity

Two of your friends might both be called Sam. A school tells them apart with an id number nobody else has. A table needs the same thing.

A **primary key** is a column, or a group of columns, whose value picks out exactly one row. In `satellite` it is `sat_id`. Once `sat_id` is the primary key, the database guarantees two things for every row, forever:

1. **Unique** — no two rows share the same `sat_id`.
2. **Not null** — every row has a `sat_id`; none is left empty.

It enforces both by building an **[[index|btree-index]]** on the key — a sorted lookup structure, like the index at the back of a book, that lets it check "does SAT-004 already exist?" in a few steps instead of reading every row. Try to break the promise and the database says no. (With no column list after the table name, the values go in the table's own column order.)

```sql
INSERT INTO satellite VALUES ('SAT-004','Relay-9',2,540,'2024-03-02','ACTIVE',800);
```

```text
ERROR:  duplicate key value violates unique constraint "satellite_pkey"
DETAIL:  Key (sat_id)=(SAT-004) already exists.
```

```sql
INSERT INTO satellite VALUES (NULL,'Mystery',2,540,'2024-03-02','ACTIVE',800);
```

```text
ERROR:  null value in column "sat_id" of relation "satellite" violates not-null constraint
DETAIL:  Failing row contains (null, Mystery, 2, 540, 2024-03-02, ACTIVE, 800).
```

A rule like this that the database enforces is called a **constraint**. (`satellite_pkey` is the name Postgres gave the primary-key constraint: "satellite primary key".)

::: key What a primary key promises
A primary key promises uniqueness and non-nullability for that combination of columns, enforced by the database with a supporting index. It is the identity contract other tables reference, which is why choosing it is a modelling decision, not a formality.
:::

### Keys made of several columns

What is the primary key of `telemetry`? No single column works. `sat_id` repeats (SAT-001 has three rows). `ts` repeats (many satellites report at midnight). `channel` repeats. But the *combination* of all three — which satellite, at what moment, measuring what — happens only once. A key made of several columns is a **[[composite key|composite-key]]**, and it is declared on its own line:

```sql
CREATE TABLE telemetry (
    sat_id   TEXT NOT NULL REFERENCES satellite (sat_id),
    ts       TEXT NOT NULL,
    channel  TEXT NOT NULL,
    value    REAL,
    PRIMARY KEY (sat_id, ts, channel)
);
```

Notice what the key does *not* include: `value`. Two different readings of the same channel at the same moment from the same satellite would be a contradiction — the satellite cannot have two battery charges at once — and the key makes the database reject that. (`REAL` is a type for measured numbers with a decimal point; lesson 06 explains it. The `REFERENCES` part is the next section.)

::: example Choosing the key for the telemetry table
**Question.** A teammate proposes `PRIMARY KEY (sat_id, ts)` for `telemetry`. Would that work?

**Step 1: look for two rows that would clash.** SAT-001 has a `BATT_SOC` row and a `BUS_TEMP` row, both at `2026-03-01T00:00:00Z`. With the key `(sat_id, ts)` both rows have the key value (SAT-001, 2026-03-01T00:00:00Z).

**Step 2: see what the database would do.** A primary key must be unique, so the second of those rows would be rejected with a duplicate-key error. The satellite's temperature reading would be thrown away every time its battery reading arrived first.

**Step 3: fix it.** Add `channel` to the key: `(sat_id, ts, channel)`. Now the two rows have different key values, (SAT-001, …, BATT_SOC) and (SAT-001, …, BUS_TEMP), and both are kept.

**Check.** Could the three-column key let a real duplicate in? A true duplicate is same satellite, same moment, same channel — exactly what the key forbids. Picking it needed you to think about what one row *means*, which is why choosing a key is a modelling decision.
:::

::: warning Do not use a name as the key
`name` looks unique today, but names get changed, reused and misspelled. When a satellite is renamed, every other table that stored the old name is now wrong. Use an id that never changes and carries no meaning of its own, and keep the human-friendly name in an ordinary column.
:::

## Foreign keys: tables that point at each other

The `telemetry` table does not repeat the satellite's name, plane or mass in every reading. It stores only `sat_id`, and anyone who wants the name looks it up in `satellite`. That is the central trick of a **relational** database: each fact is stored once, in one place, and tables point at each other by key.

The pointer is declared with `REFERENCES satellite (sat_id)` on the `telemetry.sat_id` column (read `telemetry.sat_id` as "telemetry dot sat-id": the `sat_id` column of the `telemetry` table). That makes `telemetry.sat_id` a **foreign key** — a column whose values must match a primary key in another table. "Foreign" because the key it points to lives in a different table.

The promise a foreign key makes is called **referential integrity**: every reading belongs to a satellite that really exists. The database enforces it both ways. It will not accept a reading for a satellite it has never heard of:

```sql
INSERT INTO telemetry VALUES ('SAT-099','2026-03-01T00:02:00Z','BATT_SOC',0.80);
```

```text
ERROR:  insert or update on table "telemetry" violates foreign key constraint "telemetry_sat_id_fkey"
DETAIL:  Key (sat_id)=(SAT-099) is not present in table "satellite".
```

And it will not let you delete a satellite that still has readings pointing at it, which would leave those readings **orphaned** — pointing at nothing. (`DELETE` removes rows; its `WHERE` part picks which ones, as next lesson explains.)

```sql
DELETE FROM satellite WHERE sat_id = 'SAT-001';
```

```text
ERROR:  update or delete on table "satellite" violates foreign key constraint "telemetry_sat_id_fkey" on table "telemetry"
DETAIL:  Key (sat_id)=(SAT-001) is still referenced from table "telemetry".
```

The link between the two tables is **[[one-to-many|one-to-many]]**: one satellite row, many telemetry rows. SAT-001 has three readings; SAT-006 has none. Keep that shape in mind. In lesson 03 you will see how it can quietly multiply rows, and the next module is all about combining tables along these links.

::: key Primary and foreign keys
A **primary key** identifies each row of its own table: unique and never NULL. A **foreign key** is a column whose every value must appear as a primary key in another table, so every reference points at a real row.
:::

::: example A typo the database catches
**Situation.** A ground-station script uploads a reading and mistypes the satellite id as `SAT-0O4` — a capital letter O where the digit 0 belongs.

**Without a foreign key**, the row goes in. Later, an analyst asks for every reading from SAT-004 and gets two rows instead of three. Nobody gets an error. The reading is hidden under a name nobody will ever search for, and every alarm built on SAT-004's data quietly misses it.

**With the foreign key**, the insert fails at once: `Key (sat_id)=(SAT-0O4) is not present in table "satellite"`. The script's author sees the error the same day and fixes the typo.

**The lesson.** A constraint turns a silent, months-later data problem into a loud, immediate one. That trade is almost always worth it.
:::

::: warning SQLite needs foreign keys switched on
PostgreSQL always enforces foreign keys. SQLite, for historic reasons, ignores `REFERENCES` unless you first run `PRAGMA foreign_keys = ON;` on each connection. SQLite is also relaxed about types: by default it will store the text `'heavy'` in an `INTEGER` column instead of refusing it, and it allows NULL in a primary key column unless you also write `NOT NULL`. When you care about the rules, check them on the database you actually use.
:::

## Check yourself

::: check
In the `satellite` table, what is one row, what is one column, and what is one cell? Give an example of each from the table.
:::

::: answer
A row is one satellite — for example, the line for SAT-005 (Relay-2, plane 3, 560 km, launched 2024-06-20, ACTIVE, 800 kg). A column is one fact about every satellite — for example, `mass_kg`, which runs down the table: 306, 306, 306, 800, 800, 800, 740, 740. A cell is where one row meets one column — for example, SAT-005's `mass_kg`, which is 800.
:::

::: check
A spreadsheet program holds at most 1,048,576 rows. A small constellation of 400 satellites sends 20 channels once a second. How long until the sheet is full?
:::

::: answer
Readings per second: $400 \times 20 = 8000$. Seconds to fill the sheet: $1048576 \div 8000 \approx 131$ seconds, a little over two minutes. Even a small fleet outgrows a spreadsheet before you finish your coffee — which is why the data lives in a database.
:::

::: check
Someone suggests making `status` the primary key of `satellite`. What goes wrong, and which error would you see?
:::

::: answer
A primary key must be unique, and `status` is not: five satellites are ACTIVE. The database would accept the first ACTIVE satellite and reject the second with a duplicate-key error ("duplicate key value violates unique constraint"). Beyond that, status changes over a satellite's life, and an identity should never change. `sat_id` is the right key.
:::

::: check
A new table `pass` records each time a satellite flies over a ground station, with columns `sat_id`, `station`, `start_ts` and `end_ts`. Which column should be a foreign key, what should it reference, and what does that protect against?
:::

::: answer
`pass.sat_id` should be a foreign key referencing `satellite (sat_id)`. It guarantees every pass belongs to a satellite that exists: a pass for a mistyped or unknown id is refused, and a satellite with recorded passes cannot be deleted and leave those passes orphaned. (If there were also a `station` table, `pass.station` would be a second foreign key pointing at it.)
:::

::: check
The database printed `SAT-001` as the first row of `satellite`. A colleague says "so SAT-001 is the first satellite in the table". Is that a safe thing to rely on?
:::

::: answer
No. A table is a set of rows, and a set has no order. The database returned the rows in whatever order was convenient — today, the order they were inserted. After an update, a reorganization or a different query plan, the order can change. If order matters, you must ask for it, which lesson 03 teaches.
:::

## Summary

| Term | Meaning |
| --- | --- |
| database, DBMS | a program that stores data under rules and answers questions about it |
| SQL | the language for asking; "S-Q-L" or "sequel" |
| table (relation) | a set of rows sharing the same named columns; rows have no order |
| row (tuple) | one thing, such as one satellite or one reading |
| column (attribute) | one fact about every row, with a name and a type |
| domain | the set of values a column may hold |
| NULL | the marker for "no value here" (lesson 05) |
| constraint | a rule the database enforces, such as `NOT NULL` |
| primary key | unique and not null; the row's identity; backed by an index |
| composite key | a primary key made of several columns, like `(sat_id, ts, channel)` |
| foreign key | a column that must match a primary key in another table (`REFERENCES`) |

Next lesson you start asking it questions: `SELECT` to choose columns, `FROM` to choose a table, and `WHERE` to keep only the rows you care about.

::: context sql-name Why it has two pronunciations
SQL was designed at IBM in the early 1970s by Donald Chamberlin and Raymond Boyce. Its first name was SEQUEL, for "Structured English Query Language" — the idea was that a query should read almost like an English sentence. The name had to change because another company already owned SEQUEL as a trademark, so it became SQL. Many people still say "sequel" out of habit, and many say the letters. Both are correct, and nobody in an interview will mind which you choose.
:::

::: context spreadsheet-limit Where that odd number comes from
1,048,576 is $2^{20}$ — two multiplied by itself twenty times. Computers count in powers of two, so limits often land on numbers like this. The same spreadsheet program allows 16,384 columns, which is $2^{14}$. Those limits are generous for a budget or a class list. They are tiny next to a satellite fleet, which can produce a million readings in the time it takes to say "spreadsheet".
:::

::: context postgres-sqlite Two databases, two jobs
PostgreSQL grew out of a research project called POSTGRES at the University of California, Berkeley, in the 1980s, led by Michael Stonebraker. Today it is one of the most widely used databases in the world, run by companies from small startups to space operators.

SQLite was written by D. Richard Hipp and first released in 2000. It has no server at all. The whole database is one file, and the database engine is a small library built into whatever program uses it. Your phone almost certainly has dozens of SQLite files on it right now, and the exercises in this app run a copy of SQLite inside the web page.
:::

::: context utc-z What the Z means
The `Z` at the end of `2026-03-01T00:00:00Z` stands for "Zulu", the radio word for the letter Z, which aviators and militaries use to mean UTC — Coordinated Universal Time, the reference clock the whole world agrees on. Writing the Z says "this time is UTC, not the local time wherever the computer happened to be". A satellite fleet has operators in several countries and time zones, so every timestamp is stored in UTC. Lesson 07 explains why this matters so much and how the database handles it.
:::

::: context relation-name Relation does not mean relationship
It is natural to guess that "relational" means "tables that are related to each other". It does not. In 1970 Edgar F. Codd, a mathematician at IBM, published the paper that started relational databases. He used "relation" in its mathematical sense: a set of tuples, each tuple listing values in the same named slots. So *each table* is a relation.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="30" width="280" height="96" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="30" width="280" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="78" x2="320" y2="78" stroke="#1f2a44" stroke-width="1"/>
  <line x1="40" y1="102" x2="320" y2="102" stroke="#1f2a44" stroke-width="1"/>
  <line x1="120" y1="30" x2="120" y2="126" stroke="#1f2a44" stroke-width="1"/>
  <line x1="230" y1="30" x2="230" y2="126" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44">
    <text x="48" y="46">sat_id</text><text x="128" y="46">name</text><text x="238" y="46">altitude_km</text>
    <text x="48" y="70">SAT-001</text><text x="128" y="70">Pathfinder-1</text><text x="238" y="70">550</text>
    <text x="48" y="94">SAT-002</text><text x="128" y="94">Pathfinder-2</text><text x="238" y="94">550</text>
    <text x="48" y="118">SAT-003</text><text x="128" y="118">Pathfinder-3</text><text x="238" y="118">540</text>
  </g>
  <rect x="40" y="56" width="280" height="20" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="326" y="70" font-size="11" fill="#b4232c">row</text>
  <rect x="232" y="32" width="86" height="92" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="275" y="144" font-size="11" fill="#1d6fd1" text-anchor="middle">column</text>
  <text x="80" y="144" font-size="11" fill="#6c7a93" text-anchor="middle">primary key</text>
  <text x="180" y="20" font-size="12" fill="#1f2a44" text-anchor="middle">relation = table</text>
</svg>
```

The formal words — relation, tuple, attribute — are the same things as table, row, column.
:::

::: context btree-index How an index finds a key fast
Finding SAT-004 by reading every row is fine for eight satellites and hopeless for eight million. So alongside the table the database keeps an index: the key values in sorted order, arranged as a shallow tree called a **B-tree**. To find a key, it starts at the top and at each level picks the branch whose range contains the key.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="120" y="14" width="120" height="28" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="33" font-size="12" fill="#1f2a44" text-anchor="middle">SAT-003 | SAT-006</text>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="130" y1="42" x2="60" y2="90"/>
    <line x1="180" y1="42" x2="180" y2="90"/>
    <line x1="230" y1="42" x2="300" y2="90"/>
  </g>
  <rect x="10" y="90" width="100" height="28" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="130" y="90" width="100" height="28" fill="#fff" stroke="#b4232c" stroke-width="2.5"/>
  <rect x="250" y="90" width="100" height="28" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="60" y="109">001 002</text>
    <text x="180" y="109">003 004 005</text>
    <text x="300" y="109">006 007 008</text>
  </g>
  <text x="180" y="140" font-size="11" fill="#b4232c" text-anchor="middle">looking for SAT-004: top, then middle branch</text>
</svg>
```

Each level cuts the search down to one branch, so even billions of keys need only a handful of steps. The price is that the index must be updated on every insert. You will meet the B-tree again in the next lesson, where its sorted order explains why some searches are fast and others are not.
:::

::: context composite-key One key, three columns
A composite key is unique as a combination, even though each of its columns repeats on its own. Think of a seat at a concert: many seats are in row F, many are seat number 12, but only one is row F, seat 12. The telemetry key works the same way. SAT-001 appears in three rows, the midnight timestamp in eleven, and BATT_SOC in ten, but the triple (SAT-001, midnight, BATT_SOC) appears exactly once. The order of the columns inside the key also matters for speed: the index is sorted by `sat_id` first, so "all readings for SAT-001" is a fast lookup.
:::

::: context one-to-many Picturing one-to-many
Each telemetry row points to exactly one satellite. Each satellite can be pointed at by many readings, or by none.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="60" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">satellite</text>
  <text x="270" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">telemetry</text>
  <rect x="20" y="40" width="80" height="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="20" y="120" width="80" height="24" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="56" font-size="11" fill="#1f2a44" text-anchor="middle">SAT-001</text>
  <text x="60" y="136" font-size="11" fill="#1f2a44" text-anchor="middle">SAT-006</text>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="200" y="28" width="140" height="22"/>
    <rect x="200" y="56" width="140" height="22"/>
    <rect x="200" y="84" width="140" height="22"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="206" y="43">SAT-001 00:00 BATT_SOC</text>
    <text x="206" y="71">SAT-001 00:00 BUS_TEMP</text>
    <text x="206" y="99">SAT-001 00:01 BATT_SOC</text>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5" fill="none">
    <line x1="200" y1="39" x2="104" y2="50"/>
    <line x1="200" y1="67" x2="104" y2="52"/>
    <line x1="200" y1="95" x2="104" y2="54"/>
  </g>
  <polygon points="100,52 108,47 108,57" fill="#1d6fd1"/>
  <text x="200" y="138" font-size="11" fill="#6c7a93">no readings point at SAT-006</text>
</svg>
```

Three readings point at SAT-001; nothing points at SAT-006, which has been deorbited. Arrows always run from the foreign key to the primary key, from the "many" side to the "one" side.
:::
