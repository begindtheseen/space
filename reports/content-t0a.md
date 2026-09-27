# Tier 0, part A — final report (branch `claude/content-t0a`)

Modules rewritten in the plain voice with context notes, each marked `.plain-voice`:

| Module | Lessons | Context notes per lesson |
| --- | --- | --- |
| t0_m03_python_scicomp | 9 | 9–11 (3–4 with SVG) |
| t0_m04_linear_algebra_1 | 8 | 8–12 (3 with SVG) |
| t0_m05_linear_algebra_2 | 11 | 10–12 (3–4 with SVG) |
| t0_m06_calculus_single | 11 | 9–12 (3 with SVG) |
| t0_m07_calculus_multi | 10 | 9–12 (3–4 with SVG) |

Every module passes `LESSON_MODULE=<id> NOTES_REQUIRED=<id> npx vitest run src/curriculum/lessons.test.ts`. No lesson contains control characters.

## Module-definition problems (not edited — all in `src/curriculum/gnc-foundations.ts`)

### t0_m03_python_scicomp

1. **ex_vec3_quat_class** (prompt, "Tests must cover…" and "Success…" lines)
   - Wrong: the required tests (q ⊗ q\* = identity, product norm, length preservation, double cover) do not catch flipping the sign of the whole cross-product term in the Hamilton product. That bug still gives a valid unit quaternion that preserves length. So the success criterion "the suite fails if you deliberately flip a sign in the Hamilton product" is not guaranteed by the required tests.
   - Fix: add to the "Tests must cover" list: `a known-answer product, e.g. i ⊗ j = k (Quaternion(0,1,0,0) * Quaternion(0,0,1,0) == Quaternion(0,0,0,1))`. Lesson 04 now teaches this test (`test_hamilton_known_answer`).

2. **q_pytest_quat** (explanation)
   - Wrong: "A flipped sign in the Hamilton product … all break it [length preservation]" overstates. Flipping one term's sign breaks it, but flipping the whole cross term does not.
   - Fix: replace the first two sentences with: `Length preservation is the defining property of a rotation. A transposed DCM, an un-normalised quaternion or most sign errors in the Hamilton product break it, so one test catches a whole family of bugs — though a flip of the entire cross term still preserves length, which is why a known-answer test such as i ⊗ j = k belongs beside it.`

3. **c_vectorize_why** (back)
   - Wrong: "typically 50–200× faster". The lesson's own `np.sin` example measured about 38×, and the real speed-up depends on the operation.
   - Fix: change to `typically tens to hundreds of times faster`.

4. **q_broadcast_shapes** (choice 0 text)
   - Wrong: a (3,1) × (1,5) broadcast is an elementwise outer product, not a matrix product. Calling it "v @ v.T style" is loose.
   - Fix: `'(3,5) — the outer-product shape, the same result as np.outer(a, b) (and how a shape bug silently produces a matrix instead of a scalar)'`.

### t0_m05_linear_algebra_2

5. **ex_lsq_three_ways** (prompt line `1. normal equations, \`x = inv(A.T @ A) @ A.T @ b\``)
   - Wrong: lesson 11 warns never to form an explicit inverse, and the exercise tells learners to do exactly that. The lesson currently has to explain the mismatch.
   - Fix: `1. normal equations, \`x = np.linalg.solve(A.T @ A, A.T @ b)\` (or a Cholesky solve)`.

6. **c_condition_number** (back)
   - Wrong: typo — "float64s ~16 digits".
   - Fix: `float64's ~16 digits`.

### t0_m06_calculus_single

7. **Objective** "Derive the ideal rocket equation from Newton second law with variable mass"
   - Wrong: lesson 11 and ex_tsiolkovsky derive the equation from momentum conservation of vehicle plus exhaust. They explicitly warn that applying F = d(mv)/dt to the vehicle alone gives the wrong answer. The objective's wording points learners at that trap.
   - Fix: `Derive the ideal rocket equation from conservation of momentum for a vehicle expelling mass`.

8. **q_linearize_example**: no change needed. The original lesson 03 Check yourself question used the same function, x/(1+x²), and gave away the quiz's answer. The lesson now uses x/(x²+4) instead.

### t0_m04_linear_algebra_1 and t0_m07_calculus_multi

No problems found. Every card, quiz question and exercise these lessons support is taught and answerable.

## Errors fixed in the lessons (main ones)

**t0_m03_python_scicomp**
- **02:** the mutable-default fix was a one-line syntax error. It is now a runnable block.
- **03:** the `git bisect` sequence was wrong; it is now 4, 6, 5 with "3 revisions left", matching real git. The `git diff` hunk is now real output. The text said `git restore` undoes any uncommitted edit; it only undoes unstaged edits. Added a note on stale `__pycache__` during bisect.
- **04:** the drift claim for a quaternion with norm 1.01 only holds for vectors perpendicular to the axis. Added the i ⊗ j = k known-answer test.
- **05:** the float32 print output was wrong for NumPy 2. A check question claimed `np.arange(0, 1, 0.1)` can have 11 elements; the question now uses `arange(1.0, 1.3, 0.1)`, which really does return 1.3.
- **06:** the variance-cancellation demo no longer failed on current NumPy, so it was replaced. The float32 clock answer was wrong: each step adds exactly one ulp, 22% short. A sentence pointed to a missing "opening puzzle".
- **07:** RK45 default-tolerance drift is about 1,800 km and about 5% energy per orbit, not "a kilometre". `curve_fit` uses Levenberg–Marquardt, not `least_squares`. The `sf` versus `1 − cdf` example now uses z = 9. An undefined `y_noisy` is now defined.
- **08:** the Monte Carlo mean is 881 m, not 883 m. "Byte for byte" reproducibility now applies to PNG only. Missing setup code was added.

**t0_m04_linear_algebra_1**
- **01:** altitude is 519.7 km. ‖r‖‖v‖ is 52,496. The forward reference to matrices now points to the next lesson.
- **02:** the quadratic-form size measure is xᵀP⁻¹x, not xᵀPx.
- **03:** the operation count is 15, not 18. `numpy.linalg.solve` calls `gesv`, which uses `getrf`.
- **05:** the triangular-matrix proof now picks the right dependent rows. The rank-2 image is a flat hexagon, not a parallelogram.
- **06:** the radar slope means the target is opening (moving away), not closing.
- **07:** gravity had the wrong sign in the frame-change example; the corrected result is g^B = (−1.703, 0.842, 9.621). The star-tracker claim was fixed, and a check question that restated q_frame_chain_order was reworded.
- **08:** the [a×] sign rule was stated backwards: the positive entries are anticyclic. A wrong output comment was replaced with `np.allclose`.

**t0_m05_linear_algebra_2**
- **01:** the Jordan-block forward reference now points to lesson 2.
- **02:** the e^(−10) partial sums are 13.4 at k = 20 and 0.00097 at k = 30. The stiff-series error is now stated correctly.
- **03:** added a counterexample for the 3×3 trace/determinant test. The settling claim is now a computed figure.
- **04:** the frame-order description was reversed. Values that were only approximate are now marked with ≈. The eigenvector sign and output were fixed.
- **05:** the eigenvalue output was corrected. The off-diagonal bound is now stated for i ≠ j.
- **06:** the UD-filter history claim was softened to what can be sourced.
- **07:** 4.8 is exact, not "within round-off". G = −Hessian, not the Hessian. HPHᵀ₂₂ is 3.459. The finite-difference error is 2.6e-7. Added the missing direction of the PSD-at-a-minimum proof.
- **08:** the output comment was fixed. The line-of-sight sign convention was reconciled with lesson 07. Vᵀ is a rotation combined with a reflection.
- **10:** the beacon semi-axis is 8.11 m. The m→km scaling multiplies H's column by 1000, not divides. Machine-dependent clock-fit values are now labeled as such.
- **11:** the accuracy table was regenerated to match the code, and the surrounding text follows it. The rank-deficient QR behavior is now described correctly.

**t0_m06_calculus_single**
- **01:** the proof of (1 − cos θ)/θ² → ½ is now written out.
- **02:** the Falcon 9 climb takes about 5.9 s. A dangling "rocket-equation lesson" reference was fixed.
- **03:** density halves in about 14 s at the constant rate, or about 20 s exponentially. The thrust rise is 0.66. The check question that gave away q_linearize_example was replaced.
- **04:** the camera tilt rate peaks at lift-off.
- **06:** a 1 s-per-orbit error gives 15.6 s/day (the 19 s/day figure belongs to Δa = 1 km). The small-angle accuracy comes from f″(0) = 0. The Newton error is 1.5e-10, about nine digits.
- **07:** the Euler example was reframed as an oscillator, which gives 37% growth. The "below round-off" claim was fixed. The exponential-series cancellation happens at x = −5, not +5.
- **08:** the pitch-over example now uses t_b = 162 s, giving a gravity loss of 1,314 m/s. The units of the per-step inertial error were corrected. The garbled check answer was cleaned up.
- **10:** the Gaussian comparison and the Laplace region-of-convergence statement were corrected.
- **11:** the real Δv is 4,243 − 1,314 = 2,929 m/s. Scale height is 7.49 km. γ is now defined. The F = d(mv)/dt warning was clarified.

**t0_m07_calculus_multi**
- **01:** the finite-difference output and error table were regenerated to match what the code prints. The forward difference is about 5× worse, not 60×.
- **02:** a/b = 1.003364.
- **03:** the output comment was fixed.
- **04:** the determinant has units m²/rad². Rounding was made consistent.
- **05:** the arc-minus-range difference is 1,356 m. Two SVGs were redrawn to be exact.
- **06:** the 1.99999 midpoint-sum figure applies only to the iterated sum.
- **07:** carried 6.764e-3 so the arithmetic checks. Flagged that the slanted path runs underground. Stated the radius behind the sphere area.
- **08:** the div a numerical check was replaced with numbers that reproduce. The inverse-square field points inward.
- **09:** the asteroid's μ is 1.99 × 10⁵ m³/s², not 199.
- **10:** fixed the sign in the −∇U derivation. The apoapsis is 21,095 km. Stated the integrator run length.

**All modules:** unit and verb spellings are American (meter, center, normalize). The module's own terms were left as the definitions spell them (linearisation, diagonalisation, optimisation, vectorisation).
