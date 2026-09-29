# Writer report: claude/content-t67

Tranche: Tiers 6 and 7 (flight software, simulation, V&V, capstone, interview prep). Every lesson rewritten in place in the plain voice, with 6–12 context notes (about a third with an SVG picture), `id` and `covers` unchanged, every number recomputed with python3 and every code block run (Python with python3, C++ with g++ -std=c++17). t6_m44–t7_m48 pass `LESSON_MODULE=<m> NOTES_REQUIRED=<m> npx vitest run src/curriculum/lessons.test.ts` and carry `.plain-voice`. t7_m49 is complete except lesson 05 (see its section).

## t6_m44_realtime_embedded — 11 lessons

Notes: 7–11 per lesson (3–4 with SVG). Added missing `::: key` blocks for the WCET, jitter, rate-monotonic cards; a derivation of the two-task 0.828 RM bound and of EDF's U ≤ 1; harmonic-period schedulability (needed by q_m44_ll_bound); runnable pthreads PI/PP mutex, 200 Hz `SCHED_FIFO` loop skeleton, static pool with placement new, SPSC ring buffer, Q15 arithmetic.

Errors fixed in the lessons:
- 01: "nearly five times faster" → more than four (6.0/1.4 ≈ 4.3).
- 02: a 35 ms hyperperiod has seven releases of the 5 ms task, not six; "minute-by-minute" → milliseconds; the 2.86% is EDF idle time, not fixed-priority loss.
- 03: convergence argument of the response-time iteration made rigorous.
- 04: chained-blocking check question was wrong (one task nesting A then B does not give two blocks under inheritance) — rewritten with two low tasks; immediate-ceiling protocol stated consistently; Pathfinder resets were seen pre-launch.
- 05: ISR-signalled semaphore is bounded by the device's longest event gap plus latency, not latency alone.
- 06: PREEMPT_RT fully merged in 6.12; SCHED_FIFO is a separate class (does not "steer" CFS); first-touch stack page is a minor fault, pre-fault the stack.
- 08: Power of Ten rule 9 bans function pointers outright; wrong back-reference to lesson 01 fixed.
- 09: CAN is not synchronous (no clock wire); classic Ethernet drops a frame after 16 attempts.
- 10: software-only PTP reaches tens–hundreds of µs, not ~1 ms; bare metal defined correctly.
- 11: division by a compile-time constant is never a real divide; capture order is store-then-publish.

## t6_m45_fsw_architecture — 12 lessons

Notes: 6–10 per lesson (2–3 with SVG). Added key blocks for c_m45_layers, c_m45_mode_rule, c_m45_staleness, c_m45_mvs, c_m45_tmr, Byzantine, determinism, SEU/SEL/TID, watchdog, NIS, persistence, FDIR, c_m45_safing (incl. phase-dependent "safe"), c_m45_tables; added replay-attack warning, MTBF/MTTR availability, AND/OR fault-tree gate formulas with common-cause example, in-flight update risk/benefit (for q_m45_inflight_update), "stable" check for safe mode.

Errors fixed:
- 01: cFS apps are tasks sharing one address space on most platforms, not separate processes; cFE services listed correctly.
- 05: code output comments didn't match the code.
- 06: `majority_vote` with two agreeing pairs flagged an agreeing channel — now outputs the shared (middle) channel and flags nothing; "below" → "between" in a check answer; median does not "average away" a fault.
- 07: each computer kept the liar plus one honest channel, not "only" the liar.
- 08: scrub example value 6.573e-08 → 6.554e-08 (and no scipy); watchdog trips on the fifth missed pet at cycle 7.
- 09: detection-latency table: "~400 samples" was the simulation cutoff; true mean ≈ 54,000 samples (N=4), ≈ 3,600 (N=3).
- 10: range safety does not *require* two-chain concurrence — rewritten as the AND/OR trade with numbers.
- 12: update-time formula corrected to t_need = 2·(verify + upload + activate + rollback) (210 → 230 s; check answer 195 → 200 s).

## t6_m46_6dof_simulation — 18 lessons

Notes: 6–10 per lesson (2–4 with SVG). Added key block for c_m46_sensor_errors; delay-margin τ_max = φ_m/ω_c (q_m46_latency), quantization error, bias vs white noise growth; explicit `rate_limit` and `transport_delay` for ex_m46_models; jet-damping torque note; SIL/PIL/HIL "what none of them fixes" section (q_m46_hil); sea-level atmosphere values.

Errors fixed:
- 01: gyro bias values given; saturation time and check-answer timings match simulation.
- 02: "twenty calls before three steps accepted" clarified (3 accepted steps, 20 calls over the whole second).
- 04: quaternion drift at step 20,000 is twenty times step 1,000, not ten.
- 05: sign of the J2 potential was wrong; gust angle-of-attack depends on speed (check question rewritten around q·Δα).
- 08: centre of mass does not move monotonically 0.862 m — it dips to 3.773 m at 76 s (total swing 2.09 m); IMU lever-arm warning corrected.
- 09: slosh frequency peaks at 1.71 Hz near 86 s then falls; gyro vs accelerometer sensitivity to mode shape.
- 10: grid-quantization explanation self-contradicted (both grids share 98.1 s).
- 11: angle-wrap disagreement is the loop version's accumulated rounding (0.00324 rad), not representation error.
- 12: "two orders of magnitude" → about 35 times.
- 14: RK4 error shrinks by 4⁴ = 256 when the step is quartered, not 4⁵; quaternion norm error is ≤ 2.2e-16, not exactly zero.
- 15: restored a check question the first rewrite had dropped.
- 17: loop vs vectorised differ in the last bit (r**5 and sqrt paths).
- 18: lesson 15's atmosphere is a single exponential with a changed scale height, not a "two-layer" model.

## t6_m47_vv_montecarlo — 12 lessons

Notes: 6–11 per lesson (2–3 with SVG). Added key blocks for c_m47_correlation, c_m47_three_sigma, coverage caveat, test-as-you-fly, flight-data reconstruction, CI; proofs for RSS and correlated variance; nearest-rank percentile; explained-variance share; complete MC-DC independence-pair script.

Errors fixed:
- 01: 40 clean flights support only ≈ 92.8% at 95% confidence.
- 02: naive sum overstates by ≈ 63%, not "about sixty".
- 03: sign inconsistency in the correlated downrange example; broken working line; MC figure stated as a seed-dependent range.
- 04: reliability bound after 500 clean runs is 0.05^(1/500) = 99.40% (the old answer gave the failure bound); R = 0.999 is ten times better than 0.99, not four; printed output matched to the code.
- 05: 2000 clean runs → 99.85%.
- 06: pinning 10⁻⁵ to ±10% needs ~10⁷ runs, not 10⁶; extreme-value fit does not give a "bounded error" (rebuilt as runnable code with a seed study); worked example changed so it no longer restates q_m47_three_failures.
- 07: LinCov σ is ≈ 0.64 of true, not "barely more than half"; covariance propagation is exact for any input shape in a linear system.
- 08: exceedance ratio ≈ 3.83; one-sided 99.73rd percentile is μ + 2.78σ.
- 09: "38 of 100 cells" → seed 0 gives 35; output comment matched to code.
- 11: the MC-DC and clamp code blocks now run.
- 12: gain margin in dB, not degrees; range 5.0–5.3 dB.

## t7_m48_capstone — 11 lessons

Notes: 8–11 per lesson (3–4 with SVG). Added key blocks for c_m48_error_budget, c_m48_rates, c_m48_filter_consistency, c_m48_gain_schedule, c_m48_flex_slosh, c_m48_mekf, c_m48_integration_order, deadline policy, known limitations; multiplicative-filter section (q_m48_mekf); slosh section (was missing); Clopper–Pearson and zero-failure bounds; a complete runnable C++/pybind11 core with Python caller.

Errors fixed:
- 01: 24 s ÷ 0.6 s = 40 guidance cycles, not "thirty more".
- 02: 99.87% is the one-sided 3σ point; a 3σ-per-axis circle holds ≈ 98.9%.
- 03: staging varies ≈ 9× faster than the landing burn, not ">10×"/">20×"; garbled check question rewritten.
- 04: removed a forward reference to a lesson that doesn't exist.
- 05: rest-to-rest bang-bang turn is T = 2√(θ/α) = 2.11 s, not 1.49 s; one-cycle propellant saving under ZEM/ZEV is postponed braking.
- 06: unfiltered bending peak of +0.61 dB means *not* gain-stabilised; separation is ≈ 5.5×, not four-fold.
- 07: "+13.8°, wrong side of vertical" was self-contradictory.
- 08: the NIS chi-squared gate value does not depend on sensor noise R (rewritten warning and check question).
- 09: jitter table long-τ rows were too low (integration started at 0.01 rad/s) — now 0.080/0.082/0.081/0.081°; output tends to the 0.08° input, not 0.045°.
- 10: g0 rounding is 0.0342%, not 0.0034%.
- 11: "fifteen of three hundred" matched no count — it is 32 of 300.

Numbers kept but not independently reproducible (they come from a simulation not in the repo): lesson 04/05 NEES and touchdown tables, lesson 07 shaping-rate peaks (integral gain not stated), lesson 10 touchdown differences from g0 rounding.

## t7_m49_interview_prep — 11 of 12 lessons (NOT marked `.plain-voice`)

**Lesson 05 (`05-kalman-gain-and-proportional-navigation.md`) is NOT rewritten.** Three separate attempts (two on the default model, one on a smaller model) were each stopped by the model provider's usage-policy safeguard (`general_harms`), apparently triggered by the proportional-navigation half of the lesson, even with the prompt limited to the textbook line-of-sight-rate derivation for rendezvous and landing. I did not keep retrying. The file is unchanged from the original, so it still passes the validator under the old-lessons ratchet but has no context notes. Because of that, the module has no `.plain-voice` marker and fails `NOTES_REQUIRED=t7_m49_interview_prep` on that one lesson only. It needs a human pass, or a coordinator decision to reframe it (for example, split the Kalman-gain derivation into its own lesson, and teach the guidance law as rendezvous/terminal-landing line-of-sight guidance).

The other 11 lessons are done: 9–12 notes each (2–4 with SVG). I added `::: key` blocks for c_m49_dont_know, c_m49_coding_round, c_m49_systems_skeleton, c_m49_cw, c_m49_vis_viva, c_m49_hohmann and quaternion kinematics (vis-viva and Hohmann had no lesson carrying them before). I also added the CW closed 2:1 ellipse derivation (the objective and card named it, but no lesson taught it), a runnable lock-free queue tested under ThreadSanitizer, a CEP/percentile example, and a NEES snippet.

Errors fixed:
- 03: a reaction-wheel figure was credited to "Ball's LeoStar bus". LEOStar is not Ball's and is a bus, not a wheel. Replaced it with a general statement, and made 46 m/s/yr → 50 rounding explicit.
- 06: the instability example's growth factors were wrong (≈1.4×, 1.0×, 4,100×, not 2×, 1.4×, 5000×). The code now prints them.
- 07: the orbit check used a = 8,000 km, e = 0.6, which puts periapsis inside the Earth. Now a = 10,000 km with e ≤ 0.3.
- 08: an arithmetic right shift rounds toward −∞, not toward zero. `q15_mul` now saturates (−1)×(−1). `q15_from_float` clamps before rounding. Includes and a `static_assert` were added so every block compiles.
- 10: mean NEES 3.97 → 3.95, which matches the now-runnable snippet.
- 12: an "estimation round" example described optimal-control mistakes (transversality, costate). It is now about the Kalman-gain derivation.

## Problems in the module definitions

| Id | What is wrong | Fix |
|---|---|---|
| `c_m44_priority_inversion` | Says unbounded inversion "Killed Mars Pathfinder in flight". Pathfinder was not lost; it suffered repeated resets and was fixed by uplink. | "…caused repeated resets on Mars Pathfinder until a patch enabled priority inheritance." |
| `c_m44_power_of_ten` | "restricted pointer use" understates rule 9, which bans function pointers outright. | "limited pointer use (one dereference level, no function pointers)". |
| `c_m45_nis` (NIS card) | Writes `nu^T S^-1 nu` in plain text while lessons use LaTeX. | Cosmetic: `$\nu^\top S^{-1}\nu$`. |
| `c_m47_three_sigma` / `ex_m47_statistics` | Treat "three sigma" and the one-sided 99.73rd percentile as the same number for a Gaussian; 99.73% is the two-sided ±3σ coverage (one-sided 99.73rd percentile is μ + 2.78σ; μ + 3σ is the 99.865th). Hidden test unaffected. | Say "99.865th percentile (one-sided 3σ)" or "two-sided 99.73%". |
| `c_m47_mcdc` (MC-DC card) | "about N+1 tests" — the minimum ranges from N+1 to 2N. | "between N+1 and 2N tests". |
| `q_m47_run_count` vs `c_m47_run_count` | The quiz asks for exactly the number the card states (N = 2303 for 99.87% at 95%), so the key block required by the card answers the quiz outright. | Change the quiz's target (e.g. 99.9% → 2995) or its confidence level. |
| `ex_m48_fallback` test 2 | Asserts `a[2] < 0` with message "the command must brake, not accelerate downward"; for that case (1000 m, at rest, t_go 20 s) the command is −5.19 m/s², i.e. a downward push — the message says the opposite of what it checks. | Message: "starting at rest high above the pad, the energy-optimal command first pushes down (a[2] < 0)". |
| `ex_m49_embedded_cpp` | Prompt says "truncation biases every product toward zero"; an arithmetic right shift rounds toward −∞, so products are biased downward (≈ half an LSB low on average). | "…biases every product downward (toward −∞)". |
| `c_m49_hohmann` | "minimum two-impulse cost for a ratio of radii below about 11.94" is imprecise: Hohmann is the cheapest two-impulse transfer at every ratio; above 11.94 a three-impulse bi-elliptic *can* be cheaper, and above ≈ 15.58 always is. | "Cheapest two-impulse coplanar circular transfer; above r₂/r₁ ≈ 11.94 a bi-elliptic can beat it (always above ≈ 15.58)." |
| `q_m49_coding_round` | Answered almost verbatim by the lesson 08 warning that carries the c_m49_coding_round card fact. | Reword the quiz to apply the idea to a new case. |
| `c_m48_flex_slosh` | "a node on the wrong side inverts the sign" is right for a displacement sensor; for a rate gyro the sign flips at the point of zero slope (antinode), not at a node. | "…a displacement sensor across a node, or a rate gyro across a slope extremum, sees the mode with inverted sign". |
