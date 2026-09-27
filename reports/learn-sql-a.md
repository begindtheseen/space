# Learn to code: SQL — final report (branch claude/learn-sql-a)

All three SQL courses on my list are rewritten in the plain voice with context notes and carry `@plainvoice true`. `npx vitest run src/learn` passes (65/65). The vitest suite does not run SQL solutions, so I also ran every lesson through a small sqlite3 checker that grades `result`, `query` and `source` checks the way `grade.ts` does. Every solution passes its checks and every starter fails them.

## Per course

| Course | Lessons rewritten | Lessons added | Lessons now | Notes (per lesson) | Pictures |
| --- | --- | --- | --- | --- | --- |
| `sql.txt` | 12 | sql-03b, sql-08b, sql-12b | 15 | 72 (4–7) | 16 |
| `sql.intermediate.txt` | 17 | sql2-04b, sql2-08b, sql2-09b | 20 | 98 (4–6) | 18 |
| `sql.advanced.txt` | 19 | sql3-01b, sql3-12b | 21 | 109 (4–6) | 23 |

Each lesson opens from the one before it and gives an everyday picture before any jargon. It says every keyword and symbol in words, takes one idea per step with its own example and result rows, and has a **Watch out** and 3 hints. SQL in the explanations and notes was run in SQLite 3.45.

Across all three courses:
- Lessons refer to each other by title, not by number, because the added lessons shift the numbering.
- People in the example data (Ada, Lin, Sam…) are named, never "he" or "she".

## Lessons added

Each one was split out of a lesson that packed several ideas into one step. Each has its own starter, solution, hints and checks; the solution passes and the starter fails.

- **sql-03b | More ways to match: OR, NOT, IN and LIKE.** From sql-03, which keeps comparisons and `AND`.
  - Task: users whose email starts with `k` or `l`.
  - Checks: the result (lin and kai), and a source check for `LIKE`.
- **sql-08b | Testing for NULL.** From sql-08. Covers `IS NULL`, `IS NOT NULL`, `COALESCE`, and why `= NULL` never matches.
  - Starter: the `= NULL` mistake.
  - Checks: the result `[["sam@example.com"]]`, and a source check for `IS NULL`.
- **sql-12b | WITH: naming the steps.** Takes sql-12's old WITH task, starter, solution and both checks word for word (see sql-12 below).
- **sql2-04b | GROUP BY: expressions, NULLs and extra columns.**
  - Task: orders and distinct customers per month.
  - Checks: an ordered result, and a source check for `substr` or `strftime`.
- **sql2-08b | Building text: joining, replacing and LIKE.**
  - Task: builds `contact` with `||`, `replace`, `lower` and `trim`.
  - Checks: an ordered result, and source checks for `||` and `replace(`.
- **sql2-09b | Date arithmetic and date ranges.**
  - Task: April 2024 orders with `date(placed)` and a `+14 days` reply-by date.
  - Checks: an ordered result, and a source check for a half-open `< '2024-05-01'` range.
- **sql3-01b | Recursive CTEs: a query that counts.** Recursion on its own, as a launch countdown from 10 to 0.
  - It sits before sql3-02 rather than after it. The idea came out of sql3-02, but it has to be taught before that lesson's calendar task.
  - Checks: an ordered result, and a source check for `RECURSIVE`.
- **sql3-12b | Indexes: queries that skip them.** Shows that wrapping `placed` in `strftime` forces a SCAN, and that a range on the bare column uses the index.
  - Its schema is sql3-12's plus `idx_orders_placed`.
  - Checks: the result, a source check for `placed >=`, and a source-absent check for `strftime`.

## Problems in the lessons' code or checks

- **sql-12 (changed on purpose, not a bug).** The old task needed a subquery and WITH together. When the lesson was split, that task moved unchanged to sql-12b, and sql-12 got a subquery-only exercise.
  - New task: requests whose `input_tokens` are above the average.
  - New solution: `SELECT id, model, input_tokens FROM requests WHERE input_tokens > (SELECT AVG(input_tokens) FROM requests);`
  - New checks: the result `[[2,"sonnet",5400],[4,"sonnet",15000]]`, a source check for a `(SELECT` subquery, and a source-absent check for `4150` so the average can't be typed in.
  - The id is still the subquery lesson, but a learner who already finished sql-12 did the old exercise.
- **Every other starter, solution, schema and check:** unchanged. None was wrong.

## Facts corrected in the teaching text

- **sql3-14:** `INSERT OR REPLACE` fires delete triggers only when `PRAGMA recursive_triggers` is on. The old text said it always does.
- **sql3-14:** an `INSERT … SELECT … ON CONFLICT` needs `WHERE true` only when the `SELECT` ends right after its `FROM`, because of a parsing ambiguity. The old text said it is always needed. The lesson still teaches it as the habit the SQLite docs recommend.
- **sql3-11:** the old text said "delete Bo's only order", but Bo has two orders in the data. It now says "delete Bo Chen's orders".
- **sql3-07:** the solution uses a `WINDOW w AS (…)` clause that the old explanation never showed. The explanation now teaches it.
- **sql2-07:** the task needs `CASE` on an aggregate (`SUM(...)`), which the old explanation never showed. The explanation now has that step.
