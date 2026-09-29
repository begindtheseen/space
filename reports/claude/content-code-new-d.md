# Writer report: claude/content-code-new-d

Tranche: new coding modules with no lessons — planned and written from scratch in the plain voice, with context notes in every lesson.

All six modules pass `LESSONS_STRICT=1 LESSON_MODULE=<id> NOTES_REQUIRED=<id> npx vitest run src/curriculum/lessons.test.ts`, carry `.plain-voice`, and are in `manifest.ts`.

Tooling used for checking: GNU Octave 8.4 with the `control` package for runnable MATLAB; python3 with NumPy/SciPy for every number; gcc/g++ for C and C++. MATLAB features Octave lacks (tables, timetables, `string`, `arguments` blocks, `classdef` handle semantics, Aerospace Toolbox, `stepinfo`, `allmargin`, `balred`, `pidtune`) and everything Simulink/Stateflow/Embedded Coder were written from MathWorks' documented behaviour, kept to API names the writers were sure of, and cross-checked numerically in Python. Generated-code C is always labelled as a hand-written sketch of the pattern.

## Per module

| Module | Lessons | Context notes (with SVG) |
|---|---|---|
| cod_mat_01_core — MATLAB: Core Language and Program Structure | 14 | 110 (36) |
| cod_mat_02_gnc_toolboxes — MATLAB for GNC: Control System and Aerospace Toolboxes | 13 | 95 (35) |
| cod_slk_01_models — Simulink: Block Diagrams and First Models | 10 | 77 (25) |
| cod_slk_02_solvers — Simulink Solvers, Sample Times and Numerical Correctness | 9 | 67 (24) |
| cod_slk_03_architecture — Simulink Architecture and Stateflow | 12 | 90 (35) |
| cod_slk_04_codegen — Verification and Embedded Coder: Models to Flight Code | 12 | 85 (30) |

Every flashcard sits in a `::: key` block in its own wording; every quiz question is answerable without being restated; each exercise's prerequisites are taught (where an exercise is faulty, the lesson teaches the correct numbers so a learner can reconcile them — see below).

Fixes made while writing (errors in drafts, not in module definitions): an arithmetic slip in cod_mat_02 lesson 10 (0.9659 × 0.9962), cos 278.9° = 0.154 in the same lesson, and a wrong claim in cod_slk_03 lesson 04 that reordering a struct member would grow it (padding only moves; gcc confirms 64 bytes either way).

## Problems in the module definitions

Not edited — for the coordinator.

### cod_mat_01_core
- **mat01_ex1** — expects the `x(end+1)` version to be "orders of magnitude slower" and the preallocated loop "close to" vectorised. For a 1-D row vector, growth is amortised in recent MATLAB (and in Octave was about as fast as preallocation), and loop-vs-vectorised speed depends on the JIT. Fix: grow rows (`X(end+1,:) = ...`) or concatenate (`x = [x v]`), which really are quadratic, or soften the expected result.
- **mat01_ex2** — prompt requires `zeros(1,3)` for an empty input, but the solution's `data (:,3)` size validation can reject a 0-by-0 `[]` before the `isempty` check runs (a 0-by-3 input passes). Fix: say "an empty 0-by-3 input", or validate `data (:,:)` and check columns in the body. `{mustBeNumeric}` on a `double` argument is redundant.

### cod_mat_02_gnc_toolboxes
- **mat02_ex1 (important)** — the reference solution's nominal loop is closed-loop unstable: with Kp = 4, Kd = 2.5, a 50 rad/s derivative filter and the ζ = 0.01 mode at 20 rad/s, closed-loop poles are at +0.95 ± 19.6j (checked in Python). The resonance lifts |L| above 0 dB near 20 rad/s (GM ≈ −14.7 dB) and `margin` reports the bending crossover; only the notched loop with delay is stable (PM 43.7° at 2.94 rad/s, GM 35.2 dB). Fix: lower Kd or notch the nominal loop, or reword so finding the instability is the point.
- **mat02_q2** — the correct choice `stepinfo(step(T))` passes a response with no time vector; documented forms are `stepinfo(sys)` and `stepinfo(y,t)`. Fix: `stepinfo(T)`.
- **mat02_c5** — "sensor placement relative to a flexible mode node": for a rate gyro the sign of the measured slope flips across an antinode (maximum deflection), not a node. Fix: "relative to the mode shape".
- **mat02_c9** — "Up to 86 km geopotential altitude": 86 km is geometric; the geopotential limit MathWorks documents is 84.852 km. Fix: "86 km geometric (84.852 km geopotential)".
- Minor: **mat02_c4** lists time from lift-off as a scheduling variable while **mat02_q5** argues against scheduling on time; **mat02_c10** says NED rotates with the "local meridian" (it rotates with latitude and longitude). Both taught consistently; consider rewording.

### cod_slk_01_models
- **slk01_ex1** — "first peak is about 1.73": with m = 1, c = 0.4, k = 4 and a unit-step force the first peak is 0.432 m at 1.58 s (final value 0.25 m); 1.73 is peak ÷ final value. Fix: "normalised peak (peak / steady state) ≈ 1.73". The solution also reads `out.yout{1}.Values` (Outport logging) while the prompt says To Workspace, calls `step(G,t)` with the solver's non-uniform time vector (use `lsim` or evaluate the analytic formula at the logged times), and contains a no-op `step(G,t)*(1/k)*k`.
- **slk01_q4 / slk01_c5** — `plot` in a MATLAB Function block is not refused in simulation (it becomes an extrinsic call back into MATLAB); "cannot appear" is true only for generated code. Unbounded variable-size data is allowed in newer releases via dynamic memory allocation. Fix: frame both as flight-code rules.
- Minor: **slk01_c2 / slk01_q2** say a Mux "forces a common type"; more exactly, a vector has one type, so dissimilar signals either fail or get converted.

### cod_slk_02_solvers
- **slk02_ex1** — with a fastest eigenvalue of 200 rad/s and a 50 Hz loop, h = 0.02 s exceeds both limits (ode1 0.01 s, ode4 0.0139 s), and at h = 0.01 s ode1 sits exactly on its limit (growth factor −1), so it neither converges nor diverges. Fix: use a step between the limits (e.g. 0.012 s), or a 250 rad/s mode at h = 0.01 s so ode1 diverges and ode4 converges cleanly.
- **slk02_c3** — "shortens the step to land on the crossing" is true for variable-step solvers only; fixed-step zero-crossing keeps major steps on the grid.

### cod_slk_03_architecture
- **slk03_ex2** — the state list has nothing for the unpowered fall between ENTRY_BURN and LANDING_BURN (the lesson adds DESCENT), and "100 percent coverage" needs one test run per failure path (a nominal flight alone covers 9 of 12 transitions in the lesson's chart). Fix: add the state or say it may be folded in, and say coverage needs the failure-path tests.
- **slk03_c6** — "all run simultaneously": parallel states are all active in the same step but execute one after another in execution order.

### cod_slk_04_codegen
- **slk04_c4** — lists "scopes with certain settings" as blocking ERT code generation; Scopes normally generate no code rather than block the build. Fix: replace with a genuinely blocking construct (e.g. a variable-step solver, or an Interpreted MATLAB Function block).
- Minor: **slk04_c11** (4 ms delay) nearly duplicates **slk04_q5**.
- **slk04_q3 / slk04_c4** state that an algebraic loop prevents code generation; true for Embedded Coder production code as taught, though not every code generator refuses every algebraic loop.
- **slk04_c13** — says a qualification kit means "Embedded Coder output does not have to be re-verified from scratch". In practice the code generator is rarely qualified (at Level A that would need TQL-1); teams qualify the verification tools that check its output (code inspection, SIL equivalence tests, coverage). Fix: reword to that effect.
