# Learn to code: C++ — final report (branch claude/learn-cpp-a)

All three C++ courses on my list are rewritten in the plain voice with context notes and carry `@plainvoice true`. `npx vitest run src/learn/learn.test.ts` passes (65/65). The suite does not compile C++, so I also compiled and graded every solution and starter in the three courses locally. That check used g++ with the app's flags (`-std=c++20 -O1 -Wall -Wextra -fno-exceptions`) and the real `buildProgram`/`gradeRun`. Every solution passes and every starter fails.

## Per course

| Course | Lessons rewritten | Lessons added | Notes per lesson |
| --- | --- | --- | --- |
| `cpp.txt` | 13 | cpp-01b, cpp-02b, cpp-03b, cpp-07b, cpp-09b | 4–7 |
| `cpp.intermediate.txt` | 15 | cpp2-11b | 3–6 |
| `cpp.advanced.txt` | 16 | none | 4–7 |

About one note in four has a small svg picture. Teach examples that claim a particular output, error or warning were compiled with g++ and clang++ to confirm them.

## Lessons added

- **cpp-01b | Printing text and numbers together.** Chaining `<<`, numbers vs strings, spacing, statements over several lines, errors vs warnings. Task: print `Crew: 4` / `Days in orbit: 182` with the numbers unquoted. It has an output check and two source checks.
- **cpp-02b | Writing your own function.** Return type, parameters, arguments, calling, and why these lessons have no `main`. This was split out of cpp-03, which was carrying both functions and integer division. Task: `add` and `fuel_left`. It has three case checks.
- **cpp-03b | Reading a value with std::cin.** `>>`, chained reads, whitespace skipping, `getline`. Task: read `7 5` and print `7 + 5 = 12`. It has an output check, a source check for `std::cin >>`, and a source-absent check for a hard-coded 12.
- **cpp-07b | Recursion: a function that calls itself.** cpp-07 gave recursion only one sentence. Task: a recursive `long long power(int, int)`. It has four case checks, including `power(2, 40)`, and a source check that `power` calls itself.
- **cpp-09b | Finding text inside a string.** `find`, `npos`, `substr`, and the `npos + 1` wrap-around trap. Task: `field_name` and `field_value` for `ALT:4200`-style lines. It has five case checks and a source check for `find`.
- **cpp2-11b | Building text with std::ostringstream.** `ostringstream`, `.str()`, `std::fixed`, `std::setprecision`, and the "separator before every item but the first" pattern. cpp2-11's task never used `ostringstream`, and cpp2-15 relies on it. Task: `reading(name, value)` with one decimal place, and `join(v, sep)`. It has six case checks and a source check for `ostringstream`.

## Problems in the lessons' code or checks

None. No existing starter, solution, stdin or check was wrong, and none was changed. A script compared every one of those sections byte for byte with the originals.

## Facts corrected in the teaching text

- **cpp2-13:** the task said three 1.5 GB files make the starter's total "come out negative". Under both clang++ and g++ it actually comes out as 205,032,704, a wrong positive number. The lesson also no longer suggests that clang warns about the uninitialised variable, because only g++ does ("may be used uninitialized").
- **cpp2-08:** the text said the `return` after a complete enum `switch` "keeps the compiler happy". Only g++ warns without it; clang does not. The text now says so.
- **cpp3-11:** the text said "leave out a case and it does not compile". That is not always true: if the `double` lambda is left out, a `double` silently goes to the `int` lambda with no warning. The lesson now says "usually" and adds a "Watch out" about it. A teach example with an unused named parameter, which `-Wextra` warns about, was also fixed.
- **cpp3-15:** the text called 200,000 × 10,000 "past `int`". That product fits, because the largest `int` is 2,147,483,647. The text now says it is right at the edge and a little more would overflow.
- **cpp.txt:** references like "lesson 3" and "lesson 8" were replaced with lesson names, because the inserted lessons made the numbers wrong.

## Things in the app that look off

- The app compiles C++ with `-fno-exceptions` (`src/lib/cppRemote.ts`), so `throw` and `try` do not compile there. The lessons that talk about errors now say this.
- clang++ (the app) and g++ differ on several warnings the old lessons relied on: uninitialised variables and a missing `return` after a complete `switch`. The lessons now describe what clang actually does.
- Outside my list: cpp4-06 in `cpp.expert.txt` fails when its solution is compiled with g++ locally. It may only be a g++ versus clang++ difference, but it is worth checking in the browser.
