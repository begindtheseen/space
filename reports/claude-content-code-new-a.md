# Report: claude/content-code-new-a — Coding track, new modules

All seven modules on the list were written from scratch in the plain voice with context notes. Each module folder has a `.plain-voice` marker and passes `npx vitest run src/curriculum/lessons.test.ts`.

The lessons were written by subagents working to the plan in WRITERS.md, then checked by the coordinator.

**How the content was checked**
- Every SQL query was run on PostgreSQL 16. Wherever SQLite behaves differently, the query was also run on SQLite 3.45, because the app's exercises run on SQLite (sql.js); the lessons point out each difference.
- Every git command was run in a scratch repository.
- Every Python and NumPy snippet was run on NumPy 2.4.
- Numbers were computed with python3.

## Per module

| Module | Lessons | Context notes | What the lessons cover |
|---|---|---|---|
| cod_sql_01_select | 9 | 65 | Tables and keys; SELECT/WHERE; ORDER BY/LIMIT/DISTINCT; CASE; NULL and three-valued logic, COALESCE/NULLIF; data types and CAST; TIMESTAMPTZ, intervals and UTC; logical query order; reading an unfamiliar schema |
| cod_git_01_basics | 10 | 78 | Object model and DAG; the three areas and first commits; history and commit messages; branches; merging and conflicts; reset/revert/restore; stash and reflog (recovery after `reset --hard`); .gitignore/.gitattributes/LFS; tags and semver; bisect (a real `bisect run` on 60 commits, 6 steps) |
| cod_sql_02_joins | 11 | 85 | Joins of all kinds; ON/USING and cardinality; GROUP BY/HAVING; the fan-out trap and its fixes; STRING_AGG/ARRAY_AGG/PERCENTILE_CONT/FILTER; GROUPING SETS/ROLLUP/CUBE; subqueries; EXISTS/IN and anti-joins; CTEs; recursive CTEs and gap-filling; set operations |
| cod_git_02_collab | 11 | 82 | Remotes, fetch and pull; merge vs rebase; interactive rebase and `--force-with-lease`; conflict strategy and rerere; team workflows; pull requests; reviewing a numerical diff (with unit and frame errors planted in it); release branches and changelogs; cherry-pick and backports; submodules, subtrees and vendoring; binary files and LFS locking |
| cod_sql_03_windows | 10 | 77 | OVER vs GROUP BY; ranking; LAG/LEAD and the other offset functions; running totals and moving averages; frames and the LAST_VALUE surprise; dedup and DISTINCT ON; gaps and islands; sessionisation; downsampling into time buckets; window vs self-join |
| cod_py_03_numpy | 13 | 99 | ndarray and strides; creating arrays; views vs copies; fancy indexing and masks; broadcasting; axes and reductions; reshaping and stacking; @, dot, cross and einsum (with DCMs); linear algebra (solve vs inv, lstsq, eig, svd, cond); floating-point pitfalls; random numbers; save/load and memmap; vectorisation (speedups measured for real) |
| cod_sql_04_schema | 14 | 101 | Normalisation; star schemas and keys; constraints; transactions, isolation and deadlocks (shown with two concurrent psql sessions); index types (B-tree, hash, GIN, GiST, BRIN); composite and covering indexes; partial indexes and write cost; EXPLAIN and stale statistics; SARGability; partitioning and materialised views; columnar storage and Parquet (a real file written with pyarrow); upserts and data quality; the telemetry lifecycle; export control, retention and reproducible plots |

**Wording fixed during review:** banned words ("just", "simply") were removed from cod_sql_01_select lessons 04 and 06 and from cod_py_03_numpy lesson 11. Where a flashcard's own wording contains such a word, the lesson copies the card verbatim, as the style guide requires.

**What was not run for real**
- TimescaleDB and ClickHouse are not installed. Their SQL is shown without output and labelled as not run.
- Git LFS was installed and its lock workflow was run. The two server refusal messages shown came from a local stand-in LFS server, and the lesson says the wording varies by host.

## Problems in the module definitions

- **git01_q1 (explain):** it says unreachable objects are pruned "typically after 30 days for loose objects". That mixes up two timers. Reflog entries for commits no longer on any branch expire after 30 days, and `git gc` prunes unreachable loose objects after 2 weeks.
  Fix: `explain: 'Objects survive until garbage collection prunes unreachable ones (reflog entries for unreachable commits expire after 30 days by default, and gc prunes unreferenced loose objects older than 2 weeks). `git reflog` gives you the hash to check out or branch from.'`
- **git01_c2 (back):** "A 41-byte file under .git/refs/heads" is true only in a SHA-1 repository whose ref has not been packed into `.git/packed-refs`.
  Fix: `back: 'A ref: a file under .git/refs/heads (41 bytes in a SHA-1 repo: the hash plus a newline), or a line in .git/packed-refs, naming a commit. Creating a branch is free; moving it is a one-line write. HEAD is a ref that usually points at a branch ref.'`
- **git01_c5 (back):** "about 90 days" is right only for entries that are still reachable. Entries for unreachable commits expire after 30 days.
  Fix: replace "for about 90 days by default" with "for 90 days by default (30 days for entries no longer reachable from a branch)".
- **git02_c2 (back):** stated absolutely, it contradicts exercise git02_ex1, which rewrites a pushed branch and force-pushes it with `--force-with-lease`.
  Fix: append "The usual exception is your own pushed feature branch that nobody else builds on, rewritten and pushed with --force-with-lease."
- **sql02_c4 (back):** "usually slower" is not true in PostgreSQL. The planner moves a HAVING condition that has no aggregate into WHERE; this was confirmed with EXPLAIN on PostgreSQL 16.
  Fix: replace "is legal and usually slower." with "is legal but misleading; some databases evaluate it after grouping (PostgreSQL's planner pushes it down into WHERE)."
- **sql03_q3 (choice 1):** `RANGE BETWEEN INTERVAL 5 MINUTE PRECEDING AND CURRENT ROW` is MySQL syntax. The course teaches PostgreSQL, which rejects it.
  Fix: `'RANGE BETWEEN INTERVAL \'5 minutes\' PRECEDING AND CURRENT ROW'`.
- **sql04_c8 (back):** "costs more random I/O than simply scanning" overstates it. On a warm cache, PostgreSQL 16 used an index on a value matching 3% of rows and was faster (134 ms against 321 ms), even though it touched almost every page.
  Fix: `'If a value matches a large fraction of the table, the matching rows are spread over nearly every page, so following the index reads about as many pages as a full scan, plus random I/O. Partial indexes on the rare value are the useful variant.'`
- **sql04_c9 (back):** the 3.8e12 figure assumes one 10 Hz channel per satellite. 6000 × 10 Hz × 63.1 million seconds (two years) is about 3.8e12 samples per channel.
  Fix: "Roughly 3.8e12 samples per channel (6000 × 10 Hz × 2 years), so: …".
- **sql04_c13 (back):** could not be verified against a primary source. Search snippets point to a 2021 Stack Overflow blog profile describing .NET, Kafka, HBase, HDFS, Docker and Kubernetes; nothing verifiable was found for the second sentence's tool list.
  Fix: keep the first sentence and add the source ("as described in a 2021 Stack Overflow blog profile of SpaceX software"). Either cite a source for the second sentence or delete it.
- **py03_ex1 (test message):** "a 90 degree pitch must map body x onto inertial z in this convention" has the frames backwards. C is body-from-inertial, so `C @ [1,0,0]` gives the inertial x axis expressed in body axes, and that lies along body +z. The assertion itself is correct.
  Fix: message `"a 90 degree pitch must put inertial x along body +z in this convention"`.

**Not wrong, but the coordinator may want to adjust these:**
- **Cross-module dependencies in cod_sql_01_select:** sql01_q3 and card c12 (NOT IN with a subquery) and card c7 and quiz q7 (join fan-out) lean on subqueries and joins. Those are only fully taught in cod_sql_02_joins; module 01 teaches just enough to answer them.
- **Table names in sql01_q3:** the question uses tables `sat` and `reading`, while the module's lessons use `satellite` and `telemetry`. It is harmless but inconsistent.
- **An unsourced figure:** cod_sql_04_schema lesson 13 says Starlink handled "more than 5 TB of telemetry a day in 2020". This is from memory of a public Q&A and is worth checking against a source.
