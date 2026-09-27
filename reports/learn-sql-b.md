# Learn to code: SQL expert and projects — final report (branch claude/learn-sql-b)

Both courses are in the plain voice with context notes and carry `@plainvoice true`. `npx vitest run src/learn` passes (65/65).

Beyond the suite, every lesson was run through a scratch validator. It ran every solution and every starter in sql.js 1.14.2, the SQLite build the app loads, through the app's own `buildProgram` and `gradeRun`. Every solution passes all its checks, and every starter fails at least one. The validator also confirmed that no existing schema, starter, solution or check changed.

The example outputs, query plans and error messages shown in the lessons were produced by running them, in python sqlite3 3.45 or sql.js.

## Per course

| Course | Lessons rewritten | Lessons added | Notes per lesson |
| --- | --- | --- | --- |
| `sql.expert.txt` | 14 (sql4-01 … sql4-14) | sql4-08b | 5–6, one svg each |
| `sql.projects.txt` | 15 (sqlp-01 … sqlp-15) | sqlp-01b | 3–6, one or two svgs each |

Every lesson now opens by linking to the lesson before, by title. Each lesson has:
- an everyday picture before the jargon;
- one idea per `###` step, each with a small example and its real output;
- a **Watch out:**;
- a numbered task;
- 2–3 hints, from gentle to nearly the answer.

Tools the earlier courses never taught are now taught where they are first needed: `group_concat` (sql4-11), `json_object` (sql4-10), `FIRST_VALUE` (sqlp-07), `CAST` with `ROUND` for money (sqlp-01b), scalar two-argument `MIN` (sqlp-11), the interval-overlap test and `a.id < b.id` pairs (sqlp-15). `COLLATE NOCASE` (sqlp-15) is explained in a context note.

The capstones (sqlp-13…15) keep their "design it from a written spec" form. Each has a table naming the lesson every tool it needs came from.

## Lessons added

- **sql4-08b | JSON: giving a field its own column.** This was one sentence at the end of sql4-08, now taught properly: `ALTER TABLE … ADD COLUMN`, generated columns, VIRTUAL versus STORED, and indexing the column (the plan goes from `SCAN` to `SEARCH`).
  - Schema: the same as sql4-08.
  - Starter: a plain `ADD COLUMN coupon TEXT` plus the index. It fails, because every coupon stays NULL.
  - Solution: `ADD COLUMN coupon TEXT GENERATED ALWAYS AS (payload ->> '$.coupon')`, then `CREATE INDEX idx_events_coupon ON events(coupon)`.
  - Checks: the coupon value in each row; the `SEARCH … USING INDEX idx_events_coupon (coupon=?)` plan; and a new row inserted with `RETURNING coupon` gives `WINTER`.
- **sqlp-01b | Store 1b: cleaning the export.** Split out of sqlp-02, so that cleaning and loading are separate lessons. It covers `lower(trim(…))` for emails and statuses, `CAST`, `ROUND` before `CAST` for cents, and `DISTINCT`.
  - Schema: the `import_rows` table.
  - Starter: returns cents without rounding.
  - Solution: one `SELECT DISTINCT` that returns the 11 cleaned lines.
  - Checks: the ordered 11 rows, and a source check that `ROUND(` is used (it accepts any letter case).

## Starters, solutions and checks

No existing schema, starter, solution or check was changed. None was wrong, though several are loose (see the last section).

## Facts corrected in the teaching text

- **sql4-01:** the text said `SELECT COUNT(*) … WHERE date(created) = …` plans as `SCAN orders`. It really plans as `SCAN orders USING COVERING INDEX idx_orders_created`. The example now selects `id, created, total`, which does give `SCAN orders`.
- **sql4-05:** the text said julianday arithmetic "can give 29.9999999" for 30 minutes. On this lesson's own data it gives 30.000000223517418, which would wrongly count as more than 30 minutes (`> 30`). The lesson now shows the real value.
- **sql4-08:** the text said a missing key and a JSON `null` can't be told apart. That is true for `->>` only; `->` and `json_type` do tell them apart. The lesson now says so.
- **sql4-14:** the text told her to look for `AUTOMATIC INDEX` in the starting plan. The real plan has none (`SCAN o`, then `SEARCH c USING INTEGER PRIMARY KEY`). The fact is kept, with a real automatic-index plan line shown in a note.
- **sqlp-02:** the text and a hint said `89.99 * 100` gives `8998.999999999999`, which truncates to 8998. In fact `89.99 * 100` is exactly 8999.0. The prices in this data that really fall short are 79.99 (7998.999999999999, which truncates to 7998) and 4.35 (434.99999999999994, which truncates to 434). The text and hints now use those two.
- **sqlp-10:** the text said that without the open-loan condition in the `ON`, "copies with no loans would drop out". That is false. The lesson now shows the real counts:
  - With the condition in `WHERE`, copies whose loans were all returned drop out.
  - With the condition left out, the join fans out.

## Problems in the module definitions

None of the checks is wrong. These ones are loose, and would accept some wrong answers. They are left unchanged, per the brief.

| Lesson | What is loose | Possible fix |
| --- | --- | --- |
| sql4-06 | Nothing checks that the unique index is on `lower(trim(email))`. The behaviour is tested, so this is minor. | Add `SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = 'customers'`, or insert a mixed-case, padded duplicate. |
| sql4-08 | The source check only looks for the word `json_each`, so a comment containing it plus hard-coded numbers passes. The result check is exact, so the risk is low. | None needed. |
| sql4-09 | The "same link cannot be added twice" check also passes with `UNIQUE (note_id, tag_id)` instead of the primary key. | Check `pragma_table_info('note_tags')` for `pk` values if the key itself matters. |
| sql4-10 | A `WHEN` written with `<>` also passes. Both columns are `NOT NULL`, so no data can tell `<>` from `IS NOT`. | Make `price` nullable in the schema and test an update from NULL to a value. |
| sql4-11 | Nothing can check that the repair ran inside a transaction. | None possible. |
| sql4-12, sql4-13 | Only the final result is checked, so a hard-coded `VALUES` table of the right rows passes. | A `source absent` check on `VALUES`. |
| sqlp-01 | The check named "A zero quantity, or the same product twice in one order, is refused" only inserts a duplicate `(order_id, product_id)`. A table without `CHECK (qty > 0)` passes. `unit_cents >= 0` and the `NOT NULL` columns are never tested. | Add a query check that inserts a row with `qty = 0` inside `INSERT OR IGNORE` and counts the rows. |
| sqlp-02 | Product `name` and `category` are never checked. | Minor. |
| sqlp-05 | A missing `ORDER BY id` passes, because the two `e2` copies are identical. The `user_id IS NOT NULL` filter is not needed to pass, because `OR IGNORE` skips that row anyway. | Minor. |
| sqlp-08 | Typing `'2024-07-10'` instead of `MAX(date(ts))` passes, although the task forbids it. | Add a `source absent` check for `2024-07-10`. |
| sqlp-09 | The `NOT NULL` columns and the `copies.book_id` foreign key are never tested. | Minor. |
| sqlp-12 | The fine amount is only tested on returns 2, 4 and 6 days late. | Add a return at 1 day late. |
| sqlp-13 | Nothing tests that an unknown `venue_id` or `event_id` is refused, or that `title`, `starts_at` or `seat` are required. | Minor. |
| sqlp-14 | Nothing tests that an unknown `paid_by` or `person_id` is refused, or that `description` is required. | Minor. |
| sqlp-15 | No check reads `PRAGMA foreign_keys`, and the staff and client foreign keys are not tested. `CHECK (ends_at > starts_at)` compares text, so it only holds while every timestamp is written as `'YYYY-MM-DD HH:MM'`. | Minor. |

Outside my files: in `sql.advanced.txt`, sql3-07 credits `julianday` to the lesson "Dates and times". It is actually taught in "Date arithmetic and date ranges" (sql2-09b). I did not change it, because that course is not on my list.
