# Report: claude/learn-bash-b

## Terminal · Advanced (`src/learn/tracks/bash.advanced.txt`)

Header now carries `@plainvoice true`. `npx vitest run src/learn` passes.

**Lessons rewritten (12):** term3-01 to term3-12. Each rewrite covers `--- teach`, `--- task` and the hints. Every lesson now:

- opens from the lesson before and uses an everyday picture;
- gives one idea per step, each with a small `~/project $` example;
- says every symbol and flag in words;
- has a "Watch out" and three hints, from gentle to nearly the answer.

Every fact and command from the old lessons is kept.

**Lessons added (5).** Each takes the first half of a lesson that held two ideas. Each is placed right **before** the lesson it came from, because that lesson's unchanged task and checks still need both ideas. That is why they use an `a` suffix, not `b`.

| New id | Title | Placed before |
| --- | --- | --- |
| term3-04a | Exit status: did it work? | term3-04 |
| term3-05a | Loops: for | term3-05 |
| term3-06a | Decisions: if | term3-06 |
| term3-07a | Scripts: commands saved in a file | term3-07 |
| term3-12a | Stopping a script: exit and standard error | term3-12 |

Each new lesson has its own task, starter, solution, three hints and `check shell` blocks. The solutions pass their checks and the starters pass none.

**Retitled (ids unchanged):**

| Id | New title |
| --- | --- |
| term3-04 | Either-or: && and \|\| |
| term3-05 | Renaming many files: cutting the ends off names |
| term3-06 | Decisions: asking questions with [ … ] |
| term3-07 | Scripts you run by name: #!, chmod +x and ./ |

**Notes:** 90 context notes across 17 lessons, 4–8 per lesson. About one in four has an svg picture.

| Lesson | Notes | Lesson | Notes | Lesson | Notes |
| --- | --- | --- | --- | --- | --- |
| term3-01 | 6 | term3-05a | 5 | term3-08 | 4 |
| term3-02 | 6 | term3-05 | 5 | term3-09 | 8 |
| term3-03 | 6 | term3-06a | 4 | term3-10 | 5 |
| term3-04a | 6 | term3-06 | 5 | term3-11 | 6 |
| term3-04 | 5 | term3-07a | 4 | term3-12a | 4 |
| | | term3-07 | 5 | term3-12 | 6 |

## Problems in the lessons' code or checks

None. No `starter`, `solution` or `check` in the twelve original lessons was changed; I compared them with the original file.

The practice terminal (`src/lib/shell.ts`) differs from real bash in four places. I left the code alone and worded the lessons so the learner does not run into them:

- `set -u`: it prints "unbound variable" but carries on to the next line. Real bash stops the script with status 1.
- `bash -x`: it does not print the `+ for f in *.txt` trace lines that real bash shows.
- `wc -l < ""`: it reports "Is a directory". Real bash says "No such file or directory".
- `mkdir -p NAME`, where NAME already exists as a file: it prints nothing. Real bash says "File exists" and fails.
