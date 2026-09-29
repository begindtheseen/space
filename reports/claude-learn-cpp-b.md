# claude/learn-cpp-b: C++ Expert and C++ Projects

Both courses are rewritten in the plain voice, carry `@plainvoice true`, and pass `npx vitest run src/learn`. Every lesson's solution was also compiled with g++ (`-std=c++20 -O1`) together with its checks and passes them all, and no starter passes.

## C++, expert (`cpp.expert.txt`)

- Lessons rewritten: 16 (cpp4-01 to cpp4-16): teach, task and hints.
- Lessons added: 1.
  - **cpp4-05b, "Raw memory: room first, objects later"** comes before the growable array.
  - It teaches `std::allocator`, `std::construct_at` and `std::destroy_at` on their own. Before, cpp4-06 piled that on top of growth, aliasing and the rule of five.
  - Its task is a fixed-capacity `FixedStack<T>`. It has 5 test checks and 1 source check, all compiled and run.
- Context notes: 4–8 per lesson, 97 in all across the 17 lessons, and 19 pictures, at least one in every lesson.

## C++ projects (`cpp.projects.txt`)

- Lessons rewritten: 15 (cppp-01 to cppp-15): teach, task and hints.
- Lessons added: none.
- Context notes: 4–9 per lesson, 88 in all, and 19 pictures, 1–2 in every lesson.
- The capstones still leave the design to her. Each new tool they need is taught on its own example, for instance `std::priority_queue` and its `operator<` direction, `std::nullptr_t`, `std::pow` and `std::isfinite`.
- cppp-15 ends with where to go after the C++ courses.

## Problems in the lessons' code or checks

- **cpp4-06 (fixed):** the check "Works with range-for and standard algorithms" calls `std::sort`. Neither the starter, the solution nor the grader's helper headers include `<algorithm>`, so the solution did not compile with g++ or with the local clang++. I added `#include <algorithm>` as the first line of the starter and the solution. Nothing else changed.
- **cpp4-11 (not a code change):** the bug report says the optimiser deletes an overflow check done after the fact. That happens with clang at `-O1`, which is what the app uses (`cppRemote.ts`, `cpp.worker.ts`). g++ 13 at `-O1` keeps the check. The explanation now says clang deletes it and that not every compiler does every time. The checks do not depend on this.
- **cppp-07 and cppp-08 (not a code change):** the starters do not include the headers the solutions need: `<map>` and `<memory>` in cppp-07, `<vector>` and `<sstream>` in cppp-08. The tasks now tell her to add them. The starters are unchanged.
