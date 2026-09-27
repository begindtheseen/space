# Content tranche t1 — final report

Branch `claude/content-t1`. Modules rewritten in the plain voice with context notes, each marked `.plain-voice` and passing `LESSON_MODULE=<id> NOTES_REQUIRED=<id> npx vitest run src/curriculum/lessons.test.ts`:

| Module | Lessons | Notes (with SVG) |
|---|---|---|
| t1_m13_classical_mechanics | 9 | 75 (29) |
| t1_m14_rigid_body_dynamics | 12 | 110 (36) |
| t1_m15_rotating_frames | 9 | 81 (27) |
| t1_m16_attitude_representations | 13 | 110 (39) |
| t1_m17_attitude_kinematics | 10 | 93 (31) |
| t1_m18_atmospheric_flight | 12 | 109 (37) |

All module definitions are in `src/curriculum/gnc-foundations.ts`. None were edited.

## Module-definition problems and recommended fixes

### Real errors

1. **t1_m15_rotating_frames / `ex_eci_ecef`**
   - **Wrong:** says a 500 km orbit's ground track "shifts west by about 22.5° per revolution". A 500 km circular orbit has a period of 94.6 min, which gives 23.7°. 22.5° needs an 89.75 min period (about 270 km). This contradicts `q_groundtrack_shift`, which says 23.7°.
   - **Fix:** replace `about 22.5° per revolution` with `about 23.7° per revolution`.

2. **t1_m15_rotating_frames / `ex_coriolis_magnitude`**
   - **Wrong:** the success line says "roughly 0.05 m/s² of Coriolis directed east". The term 2ω×v_rel in a_I points west for northward flight at 45° N. The eastward quantity is the apparent Coriolis acceleration −2ω×v_rel, which is the deflection.
   - **Fix:** change it to `roughly 0.05 m/s² of Coriolis acceleration (−2ω×v_rel, the deflection) directed east`.

3. **t1_m16_attitude_representations / `q_dcm_det_minus_one`** (correct choice)
   - **Wrong:** "(NED vs ENU is a common culprit)". NED and ENU are both right-handed, so the matrix between them has det +1 (a 180° rotation), not −1.
   - **Fix:** replace it with `(e.g. a north-east-up frame, which is left-handed)`, or drop the parenthesis.

4. **t1_m18_atmospheric_flight / `c_grid_fins`**
   - **Wrong:** "The lattice form stays efficient across transonic and supersonic Mach". Grid fins lose effectiveness near Mach 0.8–1.2 (the transonic "bucket", where the cells choke) and recover above about Mach 1.5.
   - **Fix:** `The lattice form works well subsonic and supersonic (above ~Mach 1.5), with a transonic dip near Mach 0.8–1.2, has a short chord, keeps hinge moments low, and stows flat against the body.`

5. **t1_m17_attitude_kinematics / `c_coning`**
   - **Wrong:** "summing ωΔt underestimates the net rotation". The sign of the missed term depends on the motion. In the classic coning case the naive sum overstates the axial rotation: the lesson's example gives −9.57e-5 against a true −8.95e-5 rad, and 2π(1−cos β) against 0 per cone revolution.
   - **Fix:** `…summing ωΔt misses the coning term of the net rotation and leaves a secular attitude error…`.

6. **t1_m18_atmospheric_flight / `ex_atmosphere_model`**
   - **Wrong:** `us1976(h)` is specified only for 0–20 km, but the prompt then asks the learner to "Plot both densities on a log axis from 0 to 80 km and quantify the error … across that range", which needs the layers above 20 km.
   - **Fix (either one):**
     - Widen the scope: `us1976(h)` for 0–86 km using the seven 1976 layers (lesson 01 lists them).
     - Or change the comparison to `from 0 to 20 km`.

7. **t1_m14_rigid_body_dynamics / `ex_inertia_tensor`**
   - **Wrong:** the solar arrays are 1 m × 3 m plates "mounted ±1.1 m along the y axis" on a 1.2 m cube. If the 3 m side runs along y, each array spans −0.4 m to 2.6 m, reaching inside the bus.
   - **Fix:** `mounted with centers ±2.1 m along the y axis, long side along y` (root at the bus face, 0.6 m).

### Convention and notation mismatches

8. **t1_m16_attitude_representations / `c_dcm_from_quat`**
   - **Wrong:** writes `− 2w[v×]`. Every lesson in the module, and the exercise's Hamilton convention dcm(a⊗b) = dcm(a)·dcm(b), use `+ 2w[v×]`. The card's caveat keeps it defensible, but it will trip learners.
   - **Fix:** `C = (w² − vᵀv)I₃ + 2vvᵀ + 2w[v×] (active/Hamilton; the passive or JPL-style transpose uses −2w[v×])`.

9. **t1_m16_attitude_representations / `c_attitude_error_quat`**
   - **Wrong:** `δq = q_cmd ⊗ q_est⁻¹` without naming the convention. It gives the body-frame error with the right sign only for B←N storage with the JPL/Shuster product. In the module's own Hamilton N←B convention it is the reference-frame error.
   - **Fix:** append `(q = q_B←N with the JPL/Shuster product; with Hamilton N←B storage use δq = q_est⁻¹ ⊗ q_cmd for the body-frame error)`.

10. **t1_m17_attitude_kinematics / `ex_tvc_torque`**
    - **Wrong:** writes `T L sin(delta)` with T meaning thrust. Card `c_tvc_torque` uses `T_c` for torque and `F` for thrust.
    - **Fix:** use `F L sin(delta)` (thrust F) in the exercise.

11. **t1_m13_classical_mechanics / `c_variable_mass_correct`**
    - **Minor:** scalar notation, while the lessons use vectors. The lesson key block follows the card, so no change is required.
    - **Optional fix:** `m dv/dt = F_ext + v_e|ṁ|` with bold vectors, or leave as is.

### Imprecise or incomplete wording

12. **t1_m17_attitude_kinematics / `q_gravity_gradient`** (explain)
    - **Wrong:** "point the minimum-inertia axis at nadir" is necessary but not sufficient. Full three-axis stability also needs the orbit-normal axis to carry the largest moment, I_y > I_x > I_z.
    - **Fix:** `…point the minimum-inertia axis at nadir, with the maximum-inertia axis along the orbit normal, and the torque restores it…`.

13. **t1_m18_atmospheric_flight / `q_lv_instability`** (correct choice)
    - **Wrong:** "a control outage of even a second or two is unrecoverable". The lesson's numbers support "a few seconds": a 2° error reaches about 140 kPa·deg after about 3 s, and 1.5° reaches only about 104 kPa·deg after 3 s.
    - **Fix:** `a control outage of more than a few seconds is unrecoverable`.

14. **t1_m13_classical_mechanics / `q_dv_budget_losses`** (correct choice)
    - **Wrong:** drag loss "≈ 0.1–0.2 km/s". Lesson 07's table gives 0.05–0.2 km/s, and its Falcon-class example is about 23 m/s.
    - **Fix:** `drag loss (≈ 0.05–0.2 km/s)`.

15. **t1_m14_rigid_body_dynamics / `c_explorer1` vs `q_explorer1`**
    - **Wrong:** the card says "within a few orbits" and the quiz says "within hours". Both are roughly right, but they differ.
    - **Fix:** use `within its first few orbits (a few hours)` in both.

16. **t1_m14_rigid_body_dynamics / `c_axisym_precession`**
    - **Minor:** uses λ with ω₃ where the lessons used n. The lessons now state both forms, so no change is required.

### Overlaps with teaching

17. **t1_m17_attitude_kinematics / `c_norm_drift_fix` and `q_norm_drift`**
    - **Problem:** they ask the same question (norm 1.0003 after 10⁶ RK4 steps). Teaching the card's fact necessarily teaches the quiz answer.
    - **Fix:** change the quiz numbers, for example `norm 0.9996 after 2×10⁶ steps; what is the length error of rotated vectors and two fixes?`. The answer is 0.08% shrink, with the same fixes.

18. **t1_m18_atmospheric_flight / `q_bending_stabilization`**
    - **Problem:** it uses exactly the 12 Hz vs 2 Hz case that lessons 09 and 11 work as examples, and `ex_bending_notch` uses it too.
    - **Fix:** change the quiz to, for example, `a bending mode at 15 Hz with a 2.5 Hz bandwidth` (same answer and reasoning).

### Spelling

19. **Several items** use British spellings: `c_gain_vs_phase_stab` ("stabilisation"), the explain text of `c_gravity_gradient` and `q_gravity_gradient` ("stabilisation"), `ex_inertia_tensor` ("modelled"), and the m13 topic "systems of particles and the centre of mass".
    - **Fix:** use American spelling to match the lessons. Topic strings must change together with the lessons' `covers` lines.

## Errors fixed in the lessons (selected)

- **m13:**
  - Oberth effect: the vehicle gets all of the released energy at v = v_e/2, not at v_e.
  - Lesson 06: the exhaust speed drop is 3,050 m/s, not 4,000 m/s.
  - Lesson 06: "control volume" was misused for the fixed system of matter.
  - Lesson 07: the turn rate peaks at γ = 0, not 45°.
  - Lesson 07: halving the diameter doubles area-to-mass, it doesn't quadruple it.
  - Lesson 08: the degrees-of-freedom count is 6, not 5, with 7 constraint forces, not 8.
  - Lesson 09: the slosh axial ripple is 2.1 kN at twice the slosh frequency, not 23.7 kN.
- **m14:**
  - The product-of-inertia symmetry-plane rule was wrong.
  - Two code bugs: an eigenvector sign error, and `ptp` crashing on NumPy 2.
  - The inertia ellipsoid's orientation was stated backwards.
  - Gyroscopic stiffness moves the axis along the torque, not perpendicular to it.
  - False history claims about Explorer 1.
  - Lesson 10's time-constant sign disagreed with lesson 08's.
  - Gravity-gradient cycling was wrong for an Earth-pointing satellite.
  - The collocated pole/zero order was reversed.
- **m15:**
  - The sine-sign rule was wrong for R₂.
  - The Molniya flight-path angle is 36.5°, not 53.5°.
  - A late time stamp shifts the ground track west, not east.
  - The GPS relativity net is 38.6 µs/day.
  - A 90-minute orbit's daily ground-track repeat confused the solar and sidereal day.
  - The inertial navigation transport-rate error is about 1 milli-g, not tens.
- **m16:**
  - A transpose-bug test couldn't work.
  - The yaw/roll divergence sign near gimbal lock was wrong.
  - An arccos error floor was an artifact of the measurement.
  - A composite rotation axis was wrong.
  - An example quaternion described a different attitude.
  - NLERP rate figures were wrong.
  - A routine count said 20 where 30 is needed.
  - The error growth of the naive DCM→quaternion conversion was wrong.
  - Two tables couldn't be reproduced.
  - The "three parameters must be singular" proof was invalid.
- **m17:**
  - CᵀC = 1.0012 I, not 1.0006 I.
  - Renormalizing inside the derivative does not break RK4's order.
  - A "stable" gravity-gradient example was unstable in roll and yaw.
  - Slew settling times ignored the overshoot.
  - A thruster regime test was off by a factor of 4.
  - To pitch the nose up, the TVC pushes the tail down, not up.
  - A describing-function table was misread.
  - The coning sign was wrong.
  - Added the magnetorquer dump law m = k(h_w × B)/‖B‖², which `ex_reaction_wheels` needs.
- **m18:**
  - Tropopause density quoted the pressure ratio.
  - The max-Q stagnation pressure is 1.7 q̄, not 2.8 q̄.
  - The tail-wags-dog sign was wrong (Tδ + mₑℓₑδ̈, zeros at ±jω).
  - The second bending mode's slope peaks at the ends, not mid-body.
  - A notched phase margin is 22°, not 13°.
  - A modal-gain example used 12 Hz for a 6.3 Hz vehicle.
  - An irreproducible slosh pole result was replaced.
  - Several entry numbers were wrong, including Apollo β ≈ 330 kg/m².
- **All modules:** American spelling throughout the prose; all numbers recomputed with python3; every code block runs and prints what its comments show.
