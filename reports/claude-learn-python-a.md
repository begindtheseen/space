# Report: claude/learn-python-a

Courses: `python.txt`, `python.intermediate.txt`, `python.advanced.txt`. All three are in the plain voice with context notes and carry `@plainvoice true`. `npx vitest run` passes, and every Python lesson's solution was run with python3 against its checks (solution passes, starter does not).

## Python (`python.txt`)

- Rewritten: 12 of 12 (py-01 to py-12).
- Added: 4 lessons.
  - `py-02b` What type is it? (str/int/float/bool, `type()`, `36` vs `"36"`)
  - `py-03b` Whole-number division, remainder and powers (`//`, `%`, `**`)
  - `py-07b` While loops, break and continue
  - `py-08b` Default values and None
- Notes: 84 in 16 lessons (3–7 per lesson), 20 with pictures.

## Python · Intermediate (`python.intermediate.txt`)

- Rewritten: 14 of 14 (py2-01 to py2-14).
- Added: 2 lessons.
  - `py2-01b` Two loops and a choice inside a comprehension (moved out of py2-01, whose task never used them)
  - `py2-06b` Spreading arguments and keyword-only parameters (moved out of py2-06, whose task never used them)
- Notes: 93 in 16 lessons (3–8 per lesson), 21 with pictures.

## Python · Advanced (`python.advanced.txt`)

- Rewritten: 14 of 14 (py3-01 to py3-14).
- Added: none. Every lesson's checks test all of its ideas, so a split would have needed changed checks. Instead each lesson is a series of short `###` steps with one idea and one example each. The explanations now teach things the tasks used but the old text never showed: `issubclass`, the `object()` marker, `!r`, `len()` on an enum, and `except Exception` with a bare `raise`.
- Notes: 94 in 14 lessons (5–9 per lesson), 21 with pictures.

## Problems in the lessons' code or checks

None. No starter, solution, stdin or check was changed; a script confirmed they are byte-identical to the originals. Two wording errors in the old explanations were corrected:

- py2-09: the explanation said the bad value was `"3"`. It is `" 3"`, with a leading space.
- py3-11: the explanation said the number of `fib` calls "doubles with each step". It grows about 1.6 times per step.

## Outside the course files

`src/learn/learn.test.ts` assumed py-03 comes right after py-02 in the Continue test. Adding `py-02b` broke that, so the test now checks py-01 → py-02 (commit `dfe5986`, already merged).
