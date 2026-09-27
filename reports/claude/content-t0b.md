# Report: claude/content-t0b (Tier 0, part B)

Every lesson in the five modules below was rewritten in place in the plain voice and given context notes. Each module folder has its `.plain-voice` marker, and every lesson passes `LESSON_MODULE=<id> NOTES_REQUIRED=<id> npx vitest run src/curriculum/lessons.test.ts`. The writers recomputed every number with python3 and ran every code block: Python with python3, and C++ with g++ -std=c++20 against Eigen 3.4, GoogleTest, the sanitizers, valgrind, clang-tidy and pybind11. The exceptions are the CMake FetchContent snippet, which needs a network download, and the `perf` and cppcheck commands, which were not installed and are shown as commands only.

## t0_m08_odes: Differential Equations & Laplace Transforms

- **Lessons:** 8. **Notes:** 86, 25 of them with an SVG picture (9–12 per lesson).
- **Errors fixed in the old lessons:**
  - 03: an overdamped system at ζ = 2 settles about 2.5× slower than a critically damped one (14.9/ωₙ against 5.83/ωₙ), not about 4×.
  - 02: a garbled sentence in the hinge example was rewritten.
  - 05: several quoted values now match what the formulas and simulation actually give (the first-second amplitude and the ringing time).
  - 06: the f(0⁺) ≠ 0 explanation said F is "only proper". The real reason is that the denominator's degree is exactly one more than the numerator's. Also, "seven decimals" became "six".
  - 08: a ζ = 0.005 mode circles more than 100 times before damping out (about 147 to reach 1%), not about 30.
- **Added:** short sections in 03 and 05 on why ζ ≈ 0.707 is popular and when it is the wrong target, so that `q_zeta_0707` can be answered (see below).

## t0_m09_probability_stats: Probability & Statistics

- **Lessons:** 13. **Notes:** 120, 39 of them with an SVG picture (8–11 per lesson).
- **Errors fixed in the old lessons:**
  - 03: the Chebyshev worst-case distribution was impossible; the real one puts 1/8 at μ ± 2σ and 3/4 at μ. Dividing by N instead of N − 1 makes the variance 12.5% too small, not "about 6%".
  - 05: correlation and wording slips in the coasting example.
  - 06: the Erlang tail value was given at the wrong s.
  - 07: the random-walk sampling step had inconsistent units.
  - 08: the Gauss-Markov/ARW crossover is about 40 s, not about 1 min.
  - 09: whiteness-test numbers now match the seeded code, and the Gauss-Markov table was regenerated.
  - 10: σ is not "much better determined" than T; both are limited by the same record length.
  - 11: sample size grows as 1/gap², not "exponentially". The Clopper–Pearson interval needs α/2.
  - 12: an antithetic-variates figure was corrected, and the exact Clopper–Pearson interval was added.
  - 13: "the only closed form" became "the simplest", and the mistuned-filter table was rebuilt from a seeded simulation.

## t0_m10_numerical_methods: Numerical Methods

- **Lessons:** 11. **Notes:** 106, 33 of them with an SVG picture (9–11 per lesson).
- **Errors fixed in the old lessons:**
  - 01: the float32 clock starts ticking fast at 32,768 s, not 65,536 s. The n·u figure is a worst-case bound, not the actual error.
  - 03: the RK4 bug claims were wrong. Building k₃ from k₁ gives 2nd order; building k₄ from k₂ gives 3rd.
  - 04: the step-size clamp is active in the worked example. Figures from an irreproducible run were replaced. The failure mode with atol = 0 is 0/0 = NaN on a component that is exactly zero.
  - 04: Dormand–Prince is now taught in full (the 5(4) pair, FSAL, the error estimate and the controller).
  - 05: the perigee figure was irreproducible and was replaced. Gauss–Jackson is not symplectic.
  - 06: the error factors were corrected, and DOP853 is a Runge–Kutta method, not multistep.
  - 07: RK45's stability limit is about 3.3 ms, not RK4's 2.785/|λ|. The implicit-solver step counts were corrected.
  - 09: Check yourself question 3 blamed the central difference; the real bug is an abs/hypot call in the altitude path. The question was rewritten.
  - 10: the split-Simpson call counts were corrected.
  - 11: the GPS condition number is 1.09e9. An explicit inverse costs about 3× the work, not 6×.

## t0_m11_optimization: Optimization

- **Lessons:** 13. **Notes:** 133, 41 of them with an SVG picture (9–12 per lesson).
- **Errors fixed in the old lessons:**
  - 01: the old lesson said Newton's method and BFGS were taught in lesson 10; they were not taught anywhere. Lesson 01 now teaches them.
  - 02: an off-by-one decimal place was corrected.
  - 03: "a nonlinear equality is always nonconvex" now allows the degenerate cases.
  - 04: the condition number grows at least as N², not exactly as N².
  - 06: the reference mass for the throttle convexification had contradictory signs.
  - 07: the rate answer missed the kink at 30 kN.
  - 08: an arithmetic slip was corrected.
  - 09: the interior-point iteration table was wrong and was re-run with Mehrotra's method. The slack prices were mislabelled.
  - 10: the SQP iteration table was irreproducible and was re-run. Powell damping picks the largest θ. BFGS is not the unique rank-two secant update. Two wrong SVGs were redrawn.
  - 11: colored finite differences need 21 evaluations, not 43. The CasADi example could not run and was replaced by a working IPOPT example.
  - 12: the CVXPY landing example was infeasible and now runs. A small CVXPY LP example was added.
  - 13: the workspace is 928 kB, not 906 kB. The golden-section search takes 10 solves, not 9.

## t0_m12_cpp: Modern C++ for Flight and Simulation

- **Lessons:** 14. **Notes:** 125, 42 of them with an SVG picture (7–11 per lesson).
- **Errors fixed in the old lessons:**
  - 02: the "const binds left" rule was wrong for a leading const.
  - 03: `return std::move` on an rvalue-reference parameter is only needed in C++17.
  - 05: the `std::function` small buffer in libstdc++ is 16 bytes, not 32. The RK4 order evidence now uses the velocity error.
  - 08: the `[[nodiscard]]` demo named the wrong function.
  - 09: SoA "vectorises the sum" is false at -O2 for floating point without permission to reorder.
  - 10: Eigen does detect transpose aliasing in debug builds.
  - 12: an `enum class` always has a fixed underlying type.
  - 13: the -Wuninitialized claim and the allocation counts were wrong.
  - 14: returning an Eigen matrix through pybind11 moves it rather than copying.
  - Several code fragments were made into complete programs, and every output comment now matches a real run.

## Problems in the module definitions

1. **`ex_lp_landing`** (t0_m11_optimization)
   - **What is wrong:** with constant mass and a fixed horizon, every feasible thrust history has the same total impulse (246.133 m/s for n = 200, dt = 0.1). So the LP optimum is not unique, and "observe that it is bang-bang" depends on the solver: HiGHS dual simplex returns 51 in-between thrust steps.
   - **Fix:** add a small tie-breaking term to the objective, `sum(T_k) dt + 1e-4 * sum(k * T_k) dt`, which pushes the thrust late and gives the coast-then-full-thrust profile. Also add a line to the prompt: "with a fixed horizon and constant mass the impulse is fixed; the tie-breaker selects the bang-bang optimum". Alternatively, make the final time free and minimise it.
2. **`q_zeta_0707`** (t0_m08_odes)
   - **What is wrong:** the answer relies on phase margin (≈ 65°), q̄α load relief, bending-mode bandwidth limits and a statically unstable plant, none of which this module teaches. Lessons 03 and 05 now carry a short section, but phase margin is only introduced there.
   - **Fix:** move the question to the classical-control module (t3_m26). Or keep it here and shorten the correct choice to: "It gives ≈ 4% overshoot and a maximally flat closed-loop magnitude — but a launch vehicle's ascent design is set by structural load and bending-mode limits, not step overshoot."
3. **`c_lti_stability`** (t0_m08_odes)
   - **What is wrong:** "Poles exactly on the imaginary axis are marginally stable" holds only for simple poles. A repeated axis pole, such as 1/(Is²), is unstable.
   - **Fix:** change the back to: "…Simple (non-repeated) poles exactly on the imaginary axis are marginally stable; repeated ones, or anything to the right, are unstable."
4. **`c_arw`** (t0_m09_probability_stats)
   - **What is wrong:** "(or equivalently the rate noise PSD)" — ARW is the square root of the rate-noise PSD, not the PSD.
   - **Fix:** change it to "(or equivalently the square root of the rate-noise PSD)".
5. **`c_cache_layout`** (t0_m12_cpp)
   - **What is wrong:** "and the loop vectorises" — at -O2 GCC will not vectorise a floating-point sum unless it may reorder it.
   - **Fix:** change it to "…so every cache line is fully used and the loop can vectorise (for a floating-point reduction, only if the compiler may reorder it, e.g. -ffast-math or -fassociative-math)…".
6. **`c_power_of_ten_rules`** (t0_m12_cpp)
   - **What is wrong:** the front asks for four rules, but the back lists nine items. It merges and drops rules (data at smallest scope is missing), so it isn't Holzmann's list of ten.
   - **Fix:** list the ten rules in order:
     1. simple control flow (no goto, setjmp/longjmp, recursion);
     2. fixed upper bound on every loop;
     3. no dynamic allocation after initialisation;
     4. functions ≤ ~60 lines;
     5. ≥ 2 assertions per function on average;
     6. data declared at the smallest possible scope;
     7. check every return value and validate parameters;
     8. limited preprocessor use;
     9. restricted pointer use (one dereference level, no function pointers);
     10. all warnings on, zero warnings, static analysis clean.
7. **`ex_pybind_core`** (t0_m12_cpp)
   - **What is wrong:** "identical results to 1e-12" does not say absolute or relative. The lesson meets both, but `-ffast-math` breaks the relative version.
   - **Fix:** change it to "identical results to 1e-12 relative (`np.allclose(a, b, rtol=1e-12, atol=0)`)".

Not a defect, noted for the exercise author: the `ex_energy_drift` starter's `leapfrog(y0, dt, n)` returns a whole trajectory, while lesson 05's leapfrog returns only the final (r, v). The step inside is the same.
