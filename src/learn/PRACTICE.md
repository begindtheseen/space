# Practice problems and mastery gates

Learn to code is held to one bar: someone who finishes it can program as well as a computer
science graduate. Passing a lesson's task once, with the explanation open above it, does not
show that. These two additions do.

- **Practice problems:** 5 to 8 graded problems under every lesson, on the same idea with new
  data and new twists. A lesson is *mastered* only when its task and all of its practice
  problems pass.
- **A mastery gate:** one at the end of every course. It holds problems the learner has never
  seen, taken in one timed sitting with no hints, no solutions and no Explain. A course is
  *mastered* only when every lesson is mastered and the gate is passed.

Mastered lessons come back as re-tests (one of their practice problems, from memory) after 2, 7,
21, 60 and 150 days. So write every practice problem so that it still makes sense on its own,
months later.

## The format

A practice problem goes after a lesson's last section and before the next `===`:

````text
=== py2-04 | Dictionaries that count
--- teach
…
--- check output | …
…

+++ practice | Words longer than five letters
--- task
…
--- starter
…
--- solution
…
--- hint
…
--- check case | count_long(["orbit", "apogee", "burn"])
count_long(["orbit", "apogee", "burn"])
=> 1
--- check case | Empty list
count_long([])
=> 0

+++ practice | …
````

A practice problem has the same sections as a lesson, apart from `teach`: `task`, `starter`,
`solution`, one to three `hint`s, `stdin` and `schema` if it needs them, and its checks. It runs
in the lesson's language, on the lesson's database unless it has its own `--- schema`.

In a Terminal or Git course, the `starter` lines are shell commands that set up the problem's
files and folders. They are run, then forgotten, so they never count as something the learner
typed. The `solution` lines are the commands she would type. Both work exactly as in the lessons.

A gate is the course's last lesson:

````text
=== py2-gate | Python, intermediate: mastery gate
--- teach
Two to four sentences: what the gate covers and how to get ready for it (redo the practice
problems of the lessons that felt hard).
--- gate
pass 7
minutes 100

+++ problem | …
--- task
--- starter
--- solution
--- check …

+++ problem | …
````

## Practice problems: what makes a good set

Aim for **6 problems per lesson** (5 at the least, 8 at the most). Climb in this order:

1. **Warm-up.** The lesson's idea on new data, in a new setting. Near transfer, but never the
   lesson's own example with the names changed.
2. **Variation.** The same idea in a different shape. For example: read from input instead of
   using a literal, return instead of print, a different output format, or the reverse question.
3. **Combine.** This lesson's idea together with one or two earlier lessons of this course, or
   of the courses before it in the language.
4. **Edge cases.** A problem where the obvious solution breaks on empty input, zero, negatives,
   duplicates, one item, huge values or ties. Test those cases with checks, so a sloppy answer
   fails.
5. **Debug.** The starter is a short program with a real bug of the kind people really write
   (off by one, wrong condition, mutating while iterating, a missed edge case, wrong join or
   GROUP BY, a dangling reference). The task describes what the program should do and what it
   does instead; the checks prove the fixed behaviour. Keep the bug honest: one or two lines,
   not a puzzle.
6. **Stretch.** A small real problem that needs the idea plus judgement: telemetry, a mission
   log, sensor readings, a schedule, an inventory. Harder than anything in the lesson, still
   solvable with only what has been taught so far.

A 7th or 8th problem, where the idea deserves it, can be one of these:

- predict the output of given code and print it;
- write the tests;
- do it a second way, for example with a comprehension, a window function or an STL algorithm;
- a performance version, where the naive answer times out on the check's large input.

## The rules

- **Only what has been taught.** A problem may use this lesson, the lessons before it in this
  course, and the courses before this one in the language, and nothing else. Read the earlier
  lessons before writing.
- **Tasks are exact.** Name every function, parameter, file, table and column. Show the exact
  output format with an example line, and say what to return or print for the edge cases.
- **Checks mean something.**
  - Every problem needs at least three checks, or one `output` check over a stdin that covers
    several cases.
  - At least one check is an edge case the task mentions.
  - Never grade on the source text alone. A `source` check may add to real checks (for example
    "uses a comprehension"), never stand in for them.
  - The starter must fail the checks.
- **Solutions are the answer a strong engineer would write:** correct, idiomatic and clear. They
  are shown to a learner who is stuck, so they teach too.
- **No giveaways.** The lesson's examples must not contain a practice solution word for word,
  or with its names swapped. The validator checks this for practice problems too.
- **Hints:** one to three per problem, from gentle to nearly the answer. Name the idea, never
  paste the code.
- **Voice:** the same plain voice as the lessons. Short sentences, and every term and symbol said
  in words. No context notes in tasks.
- **Ids:** never write ids by hand. They come from position (`py2-04.p1`, `py2-04.p2`, …), and
  saved progress is keyed by them, so add new problems at the end of a lesson's list. Never
  reorder or remove problems once they have shipped.
- Write files with the Write and Edit tools or raw strings. A Python or JavaScript string turns
  "\t", "\v" and "\a" into control characters, and the validator fails on them.

## Gates: what makes a good one

- **8 to 12 problems** covering the whole course. Most of them combine two or more lessons, and
  every major idea of the course appears at least once.
- **Harder than the practice.** A gate problem is the kind a course's final exam or a technical
  interview would set. Each one should be solvable in 5 to 15 minutes by someone who has
  mastered the course.
- **Pass mark about 70%**, rounded (7 of 10, 8 of 11). **Time:** about 10 minutes a problem, plus
  1 minute a question (`minutes 100` to `minutes 160`).
- **No hints** (leave the `hint` sections out). Every problem is unseen: never reuse a practice
  problem, even with the data changed.
- Checks include edge cases, as in practice problems. The starter fails and the solution passes.

## Gate questions: understanding, not just code

A gate also tests understanding with **10 to 12 questions**, each answered once per sitting. The
pass mark for the questions is about 80% (`questions 8` of 10). Mix these kinds:

- **Predict the output:** show a short program and ask what it prints. The answer is typed.
- **What does it cost:** the time or space of a piece of code, in big-O. Multiple choice.
- **Spot the bug:** which line is wrong, and why. Multiple choice.
- **Explain why:** the choice that gives the real reason. Wrong choices are the misconceptions
  people actually hold.
- **What happens if:** an edge case, an error, or a change to one line.

````text
+++ question | What the loop prints
--- ask
What does this print?

```python
total = 0
for n in range(1, 5):
    total += n
print(total)
```
--- answer
10
--- why
range(1, 5) is 1, 2, 3 and 4 — it stops before 5 — and 1 + 2 + 3 + 4 is 10.

+++ question | Why a set
--- ask
Why is `x in s` faster when `s` is a set than when it is a list?
--- choice
Sets are sorted, so Python uses binary search.
--- choice correct
A set hashes `x` to find where it would be, so it checks about one place instead of every item.
--- choice
Sets are stored in C and lists are not.
--- why
A set is a hash table: `x in s` is O(1) on average, while a list has to be scanned item by item.
````

Rules for questions:

- A multiple-choice question needs at least three choices. The wrong ones are the mistakes
  people really make, never jokes.
- A typed answer accepts every sensible spelling: one accepted answer per line under
  `--- answer`. Case and extra spaces do not matter.
- Every question has a `--- why` that teaches the point. It is shown after the sitting.
- Questions never repeat a practice problem.

The gate's header line then reads:

```text
--- gate
pass 7
questions 8
minutes 120
```

## Checking your work

```sh
LEARN_ONLY=python-intermediate npx vitest run src/learn/solutions.test.ts   # your course's problems, run for real
npx vitest run src/learn/learn.test.ts src/learn/practice.test.ts           # format, voice, giveaways
```

The first command runs every problem's solution and starter against its checks:

- Python runs on CPython. In the app it runs on Pyodide, which is 32-bit WebAssembly: NumPy's default
  integer there is int32, so never let a check depend on a default dtype, its size or strides.
- C++ runs on clang with the in-browser compiler's flags: `-std=c++20 -fno-exceptions`, so no
  `throw` or `try`. Avoid function names that the system headers already declare (`truncate`,
  `index`, `link`, `remove`, `time`, `log`, `abs`), or the checks will not compile.
- In the app, C++ is built for wasm32, where `long`, `size_t` and pointers are 4 bytes, while the
  verifier builds for 64 bits. Use `long long` or `std::int64_t` for anything above about 2 billion,
  and never let an expected output depend on the size of `long`, `size_t` or a pointer.
- SQL runs on SQLite 3.49 through sql.js 1.14.2, in the browser and in the checker alike, so a check on `EXPLAIN QUERY PLAN` text sees exactly what the learner sees. Newer SQLite can report `COVERING INDEX` where older versions said `INDEX`: expect the sql.js wording.
- Terminal and Git problems run on the practice shell.

The course id is the file's `@course`, or the language for a basics course, or
`<language>-<level>`.
