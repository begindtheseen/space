# Writer report: claude/content-code-new-c2

Tranche: new coding modules with no lessons, written from scratch in the plain voice with context notes. All four modules have a `.plain-voice` marker, pass `LESSON_MODULE=<id> NOTES_REQUIRED=<id> npx vitest run src/curriculum/lessons.test.ts`, and the full lessons suite passes. Every C++ program and CMake project in the lessons was compiled/built and run (g++ 13.3, CMake 3.28, Eigen 3.4, GoogleTest/GoogleMock 1.14, arm-none-eabi-gcc 13.2); outputs shown are real, trimmed where marked.

## cod_cpp_08_realtime — Real-Time Constraints and Allocation-Free Flight Code

12 lessons, 100 context notes (30 with svg).

01 WCET · 02 bounded loops (Power of Ten rules 1–2) · 03 stack depth and no recursion (`-fstack-usage` on Cortex-M4, VLAs, stack painting) · 04 pools, arenas, fixed-capacity containers, allocation guard via `operator new` (ex1 pieces taught; the learner builds `Pool<T,N>`) · 05 ISRs (real Cortex-M4 ISR disassembly, SPSC hand-off) · 06 watchdogs and health monitoring · 07 FDIR and safe modes · 08 radiation effects and mitigations · 09 fixed point and determinism (`-ffast-math` demo) · 10 cross-compiling and linker scripts (real arm-none-eabi CMake build, function in RAM) · 11 the Power of Ten rules (worked compliance report for ex2) · 12 MISRA C++:2023, JSF++, static analysers (real cppcheck/clang-tidy output).

## cod_cpp_09_eigen — Eigen: Numerical Linear Algebra in C++

12 lessons, 97 context notes (34 with svg).

01 Matrix types and fixed size · 02 storage order and Map (real pybind11/NumPy example) · 03 block operations · 04 `.array()` vs matrix, reductions, broadcasting · 05 expression templates, aliasing, `eval()`, `noalias()` · 06 IEEE-754 in practice · 07 decompositions · 08 solve, do not invert (full 6-state/3-measurement Joseph-form update = ex2) · 09 Geometry module (ex1 worked) · 10 quaternion element order · 11 alignment and proving no allocation · 12 NumPy mapping and neighbours.

## cod_cpp_10_cmake — CMake and the C++ Build System

10 lessons, 79 context notes (26 with svg).

01 first project, out-of-source builds, `CMAKE_BUILD_TYPE` · 02 targets: STATIC/SHARED/INTERFACE · 03 usage requirements, PUBLIC/PRIVATE/INTERFACE (ex2 bug reproduced) · 04 generator expressions and multi-config · 05 find_package, FetchContent, submodules, Conan/vcpkg (Conan/vcpkg snippets not executed) · 06 layout and ctest (ex1 layout) · 07 presets · 08 sanitizer, coverage, ccache · 09 toolchain files (arm-none-eabi) · 10 install and export.

## cod_cpp_11_gtest — Testing C++ with GoogleTest and GoogleMock

11 lessons, 89 context notes (30 with svg).

01 TEST/TEST_F and fixtures · 02 ASSERT vs EXPECT · 03 floating-point assertions (RK4 tolerance derived from h⁴) · 04 parameterised tests · 05 typed and death tests · 06 dependency injection · 07 GoogleMock basics (includes a staleness check, which ex1 needs) · 08 Nice/Strict/naggy mocks · 09 gtest_discover_tests, labels, filters, Catch2 · 10 coverage and sanitizers in the test matrix · 11 testing numerical kernels (invariants, convergence order, golden data).

## Problems in the module definitions

All in `src/curriculum/coding.ts`. None were edited.

### cod_cpp_09_eigen

- **summary and cpp09_q3.** Both say PX4 ships/uses fixed-size Eigen types. PX4's flight stack uses its own header-only `matrix` library (same fixed-size design), not Eigen.
  - Fix, summary: "…which is exactly why flight-adjacent codebases ship it (PX4's own matrix library copies the same fixed-size design)."
  - Fix, q3 stem: "Why does flight-adjacent code prefer fixed-size matrix types such as Eigen's Matrix3d?"
- **cpp09_q4.** The stem "A = A * B silently gives the wrong answer in a coefficient-wise expression" is loose. A pure coefficient-wise product (`A = A.array() * B.array()`) cannot alias. Aliasing needs an entry that reads a different position of the destination (transpose, overlapping blocks, reverse).
  - Fix, stem: "`A = A.transpose()` or an overlapping block copy silently gives the wrong answer in release builds. The cause is:" (keep choices and answer).
- **cpp09_c3.** "using it when it does gives a silently wrong result" overstates it: a false `noalias()` promise sometimes happens to give the right answer (seen for `P.noalias() = F*P*F.transpose()+Q`).
  - Fix: "…using it when it does is undefined in effect: the result may be silently wrong, or may happen to pass, so treat it as a bug either way."
- **cpp09_c4.** "for coefficient-wise expressions and some in-place ops you must call .eval() yourself" is loose in the same way as q4. Also, Eigen's debug check does not catch `P = 0.5*(P + P.transpose())`.
  - Fix: "…but for expressions that read other positions of the destination (a transpose, overlapping blocks) you must call .eval() yourself; Eigen's debug assertion catches `a = a.transpose()` but not every case, e.g. `P = 0.5*(P + P.transpose())`."
- **cpp09_c9 and cpp09_q5 explain.** Two points are missing:
  - The `EIGEN_RUNTIME_NO_MALLOC` check is an `eigen_assert`, so it is silently off under `NDEBUG`. The test must be built without `NDEBUG`.
  - Eigen allocates with `malloc`, not `operator new`, so a global `operator new` counter does not see Eigen allocations, and Eigen's check does not see `std::vector`.
  - Fix: append to c9: "The check is an assertion, so run it in a build without NDEBUG." Change q5's explain last sentence to: "A global operator new counter covers non-Eigen allocations; Eigen itself uses malloc, so use both."
- **cpp09_ex2.**
  - The prompt says "the allocation counter reads zero", but an `operator new` counter reads zero even with a `MatrixXd`, for the reason above. Fix: "…and that no dynamic allocation happens in the update (EIGEN_RUNTIME_NO_MALLOC with set_is_malloc_allowed(false) in a build without NDEBUG)."
  - The starter uses `K_t` in the solution but does not define it. Fix: add `using K_t = Eigen::Matrix<double, 6, 3>;` to the starter.
- **Prerequisites (note, not a data error).** Lessons 10 and 11 use GoogleTest, which is only taught in cod_cpp_11_gtest (a later tier). The lessons include a one-line reading guide.

### cod_cpp_11_gtest

- **cpp11_ex1.** The prompt requires asserting "that it does not propagate a stale sample as fresh", but the solution's estimator has no staleness check. Its stuck-sensor test asserts `valid()` is true and a comment admits the gap.
  - Fix: add a staleness check to the solution's `Estimator` (count consecutive identical gyro samples; set `valid_ = false` and a `stale_` flag after N, e.g. 3). Change `StuckSensorStillReadsButValueNeverChanges` to expect `EXPECT_FALSE(e.valid())` after N identical samples.
- **cpp11_ex2.**
  - The prompt asks for tolerances "derived from the step size and method order", but the solution hard-codes a tolerance per case.
  - The prompt's claim that "doubling the step makes exactly the cases with the tightest tolerance fail" is false for the given table. At 100 steps instead of 200, the cases that fail are `large_y0`, `small_y0` and `growth`, while `zero` (the tightest, 1e-15) still passes.
  - Fix:
    - Compute the tolerance as `tol = C * |y0*exp(lambda*t_end)| * |lambda|^5 * t_end * h^4 / 120` with a stated safety factor `C` (e.g. 4), instead of a table column. RK4's local error term for y' = λy is (λh)⁵/120.
    - Reword the expected result: "…all pass, and with a fixed tolerance computed for h, rerunning at 2h fails every nonzero case (error grows about 16×) while the zero case still passes."
  - The prompt's "six named test cases appear in the ctest listing" needs `gtest_discover_tests(... NO_PRETTY_VALUES)` on CMake 3.28: with a custom name generator, CMake appends the `GetParam()` comment to each CTest name. Fix: mention `NO_PRETTY_VALUES` in the prompt. Lesson 09 teaches it.
- **Spelling (minor).** The topic strings, TEST_P lesson file name and card c4 use British "parameterise(d)", but STYLE.md asks for American words. Lessons 07–09 say "parameterized". Optional fix: change the topic string to "TEST_P parameterized tests and value generators" and card cpp11_c4 to "parameterize", then rename lesson 04's covers to match.

### cod_cpp_08_realtime

none

### cod_cpp_10_cmake

none
