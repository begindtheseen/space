# Content report — Tier 2 astrodynamics (branch `claude/content-t2`)

All six modules were rewritten in the plain voice with context notes, marked `.plain-voice`, and pass
`LESSON_MODULE=<id> NOTES_REQUIRED=<id> npx vitest run src/curriculum/lessons.test.ts`.

| Module | Lessons | Notes per lesson |
| --- | --- | --- |
| t2_m19_two_body | 14 | 8–11 |
| t2_m20_orbital_maneuvers | 11 | 7–10 |
| t2_m21_perturbations | 12 | 7–10 |
| t2_m22_lambert_targeting | 9 | 6–10 |
| t2_m23_relative_motion_rpo | 12 | 7–9 |
| t2_m24_edl | 13 | 6–11 |

About a third of notes carry an SVG. Every number was recomputed with python3 (several tables re-derived by
numerical integration). All module definitions live in `src/curriculum/gnc-foundations.ts`; none were edited.

## Module-definition problems (recommended fixes)

Ordered by importance. "Wrong" items teach or reward something false; "Imprecise" items are defensible but
loose.

### Wrong

1. **t2_m22_lambert_targeting / `c_lambert_min_energy`** (back)
   - Problem: "it corresponds to the longest parabolic-free transfer time boundary" is garbled. a_min is the
     lowest-energy transfer; its flight time is not a bound on flight time, it separates the two ellipses of
     each size.
   - Fix: replace that clause with "Its flight time separates the faster and slower ellipse families; it is
     neither the fastest nor the slowest transfer."

2. **t2_m23_relative_motion_rpo / `c_rbar_safety`** (back) and **`q_rbar_vbar`** (choice 0 and explain)
   - Problem: says R-bar plume impingement "points at the target" / "your thrusters point at the target".
     Braking against the gravity gradient from below means thrusting up, so the exhaust goes down, away from
     the station. R-bar's natural braking is usually counted as *reducing* plume impingement.
   - Fix (card): "The cost is continuous thrusting against the gradient — more propellant — and long thruster
     firings close to the target whose plume geometry must be managed."
   - Fix (quiz choice 0): "…the cost is continuous thrust against that gradient and long thruster firings near
     the target"; in `explain` replace "your thrusters point at the target, so plume impingement and
     contamination become design drivers" with "the thrusters fire for a long time close to the target, so
     plume geometry and contamination still need managing".

3. **t2_m24_edl / `c_ballistic_coefficient_tps`** (back) and **`q_low_beta`** (choice 0 and explain)
   - Problem: says a low β "stretches the deceleration out, often raising the integrated heat load". For a
     ballistic entry at a fixed angle, heat load falls as √β (lesson 04 derives Q ∝ √(β/R_n)·v_E²). Load rises
     only through trajectory shape — shallow or lifting entries that spend longer in the air.
   - Fix (card): "It decelerates the vehicle higher up in thinner air, which lowers the *peak heat rate*; for a
     ballistic entry at a fixed angle the integrated *heat load* falls too (∝ √β), but shallow or lifting
     trajectories that stretch the entry out can raise it. Peak rate sizes the TPS material; total load sizes
     its thickness and mass."
   - Fix (quiz choice 0): "…peak heat *rate* falls; heat *load* depends on trajectory shape — a longer,
     shallower entry can raise it — rate sizes the material, load sizes the mass".

4. **t2_m23_relative_motion_rpo / `q_cw_eccentric`** (explain)
   - Problem: "typically metres over an orbit at kilometre separations". Numerically (lesson 04), fixed-n CW at
     e = 0.05 and 1 km separation misses by about 274 m at a quarter orbit and about 3.3 km after one orbit.
   - Fix: replace with "typically hundreds of metres to kilometres over an orbit at kilometre separations".

5. **t2_m22_lambert_targeting / `ex_diff_correction`** (prompt/starter)
   - Problem: the starter's `two_body_jacobian` has only the two-body gravity gradient, but the prompt uses
     perturbed dynamics and expects "roughly quadratic" convergence. With the two-body Jacobian convergence is
     linear (lesson 06: seven iterations instead of three).
   - Fix: add to the prompt "`A` must include the gradient of every perturbation you propagate (at least
     ∂a_J2/∂r; central differences are fine) — with the two-body Jacobian alone, convergence is only linear."

6. **t2_m21_perturbations / `ex_drag_lifetime`** (starter)
   - Problem: `atmospheric_density(..., h_scale=8.5)` uses one sea-level scale height from the ground up; at
     400 km that gives a density many orders of magnitude too low, so the satellite never decays.
   - Fix: replace with a piecewise exponential model referenced near the orbit (e.g. ρ₀ ≈ 3–4×10⁻¹² kg/m³ at
     400 km with H ≈ 55–60 km, or the standard Vallado piecewise table), or state in the prompt that the
     learner must replace the placeholder.

7. **t2_m21_perturbations / `c_j2_value`** (back)
   - Problem: "about a thousand times larger than any other harmonic coefficient". Actual ratios: J2/|J3| ≈ 430,
     J2/|J4| ≈ 670.
   - Fix: "…It is several hundred times larger than any other harmonic coefficient (about 430× J3)."

8. **t2_m21_perturbations / `c_mean_vs_osculating`** (back)
   - Problem: "The two can differ by tens of kilometres in semi-major axis." For near-circular LEO the gap is at
     most about 10 km (a 12–19 km peak-to-trough swing); for eccentric orbits it is larger (about 95 km at
     perigee for a Molniya orbit).
   - Fix: "The two can differ by up to about 10 km in semi-major axis in LEO, and by much more on eccentric
     orbits."

9. **t2_m24_edl / `q_radar_altimeter`** (choice 0)
   - Problem: "at the centimetre-to-decimetre accuracy touchdown requires" is stronger than the card and
     lesson support (metre to sub-metre).
   - Fix: "…at the sub-metre accuracy touchdown requires".

### Imprecise

10. **t2_m21_perturbations / `c_perturbation_ranking_leo`** (back)
    - Problem: "higher geopotential harmonics ≈ 10⁻⁵" — at 400 km the J3/J4 terms range from about 1.8×10⁻⁵ to
      1.3×10⁻⁴ m/s² with latitude. "drag ≈ 10⁻⁶ to 10⁻⁵" omits quiet-Sun values (about 3×10⁻⁷ at B = 100).
    - Fix: "higher geopotential harmonics ≈ a few × 10⁻⁵ · drag ≈ 10⁻⁷ to 10⁻⁵ (solar-cycle and B dependent)".

11. **t2_m21_perturbations / `c_perturbation_ranking_geo`** (back)
    - Problem: "lunar third body ≈ 7 × 10⁻⁶" is the tidal approximation; the exact worst case is 8.7×10⁻⁶.
    - Fix: "lunar third body ≈ 7–9 × 10⁻⁶".

12. **t2_m19_two_body / `q_ecc_vector_direction`** (choice 0)
    - Problem: "the Laplace-Runge-Lenz vector scaled by μ". Strictly e = A/(m²μ) for A = p × L.
    - Fix: "(the Laplace-Runge-Lenz vector divided by m²μ)" or "(a scaled Laplace-Runge-Lenz vector)".

13. **t2_m22_lambert_targeting / `c_lambert_multirev`** (back) and **`q_lambert_multirev`** (choice 0)
    - Problem: 2N + 1 counts solutions for one direction of travel only.
    - Fix: append "for a given direction of travel (prograde or retrograde)".

14. **t2_m22_lambert_targeting / `q_lambert_rendezvous`** (explain)
    - Problem: "exactly as Apollo did with Lambert-based powered flight guidance" is loose; Apollo carried a
      Lambert routine for rendezvous targeting and midcourse corrections.
    - Fix: "…as Apollo's guidance computer did, using a Lambert routine for rendezvous and midcourse targeting."

15. **t2_m19_two_body / `q_kepler_convergence`** (choice 0)
    - Problem: mentions a "Vallado/Battin starter"; the lessons teach Vallado's M ± e, E₀ = π and Danby's
      starter, not a Battin starter specifically.
    - Fix: "(E₀ = π for high e, or a Vallado/Danby starter)".

16. **t2_m24_edl / `c_shuttle_guidance`** (back)
    - Problem: the flown reference drag profile was built in segments, several scheduled against velocity;
      energy was used mainly in the final transition phase.
    - Fix: "It tracked a reference drag-acceleration profile built in segments against velocity and energy
      rather than time, which made it robust to atmospheric dispersion, with bank reversals triggered by a
      crossrange deadband."

17. **t2_m24_edl / `c_falcon_phases`** (back)
    - Problem: "Boostback (RTLS only)" — some droneship missions also fly a partial boostback.
    - Fix: "Boostback (full on RTLS, partial or none on droneship landings) reverses or trims the downrange
      velocity."

18. **t2_m20_orbital_maneuvers / `c_finite_burn_loss`** (back)
    - Note, not an error: "a few percent of the period" fits the speed-loss measure. By true energy cost the
      impulsive approximation holds longer (about 0.8% loss at a burn lasting 10.6% of the period). Optional
      addition: "(measured as speed shortfall; the energy penalty is much smaller)".

19. **t2_m23_relative_motion_rpo / `ex_cw_stm`** (prompt)
    - Note: the unit-determinant check cannot catch any error in the y (along-track) row, because Φ's y column
      is always (0,1,0,0,0,0). The drift and nonlinear tests do catch it. Optional addition: "(det = 1 is
      blind to errors in the y row — the drift test covers it)".

20. **t2_m24_edl / `ex_allen_eggers`** (prompt)
    - Note: asks for a flat-planet 3-DOF while lesson 03 teaches a spherical-planet truth model. Close enough;
      optionally say "flat- or spherical-planet".

21. **t2_m23_relative_motion_rpo / `c_docking_vs_berthing`**, corridor exercise — British spelling
    ("metres", "manoeuvre") while lessons use American. Cosmetic.

22. **t2_m19_two_body** — no exercise tests the ground-track/TLE objective or the orbit-types material.
    Consider adding one (e.g. propagate a real TLE with `sgp4` and plot the ground track).

### Previously untaught (fixed in lessons — no definition change needed)

- m20 `c_oberth` / `q_oberth`: taught nowhere → derivation and key block in lesson 03.
- m20 objective "Build a mission Δv budget including margin": added worked example in lesson 10.
- m21 Lagrange planetary equations (a `covers` topic): added section in lesson 03.
- m21 `c_sso_condition`, `c_sso_retrograde`: lesson 05 had no key blocks → added.
- m21 `c_lifetime_uncertainty`: storms and attitude were not taught → added to lessons 07 and 12.
- m22 `c_stumpff`, `c_bplane`, `c_porkchop`: no key blocks → added (02, 07, 08).
- m22 `c_lambert_in_rendezvous`, `q_lambert_rendezvous` and the rendezvous-loop objective: untaught → section
  in lesson 09.
- m23 safety ellipses (a `covers` topic of lesson 09): untaught → section, key and example.
- m23 `c_tschauner_hempel`, `c_cw_secular_drift`, `c_cw_no_drift`: key blocks added.
- m24 `c_hoverslam_altitude`, `ex_hoverslam`, objective 3: ignition altitude h = v²/(2(a_T − g)) taught
  nowhere → derived in lesson 12.
- m24 `c_ballistic_coefficient_tps`, `c_falcon_phases`, `c_radar_altimeter`, `c_trn`, `c_mars_edl`: key blocks
  and missing facts added (04, 10, 11, 13).

## Errors fixed in the lessons

### t2_m19_two_body
- 01: GEO "forty times more slowly" wrong (period is about 15.5× longer); J2 ratio at GEO reworded.
- 02: ISS v² − μ/r was 0.0312, is 0.0304 km²/s².
- 03: directrix placed on the far side; it is on the periapsis side (x = p/e). r_a 12,902.3 km.
- 04: vis-viva rounding; perigee/apogee dwell times now computed.
- 05: Molniya perigee/apogee about 530/39,800 km; wrong cross-reference.
- 06: GTO eccentricity rounding carried inconsistently.
- 07: v_PQW component; unit-free tolerance norm(n)/h.
- 08: sin E and cosh H values; hyperbola wrongly said to be "accelerating away".
- 09: Kepler solver code could fail when a guess hit the root exactly (f == 0 at bracket end) — fixed and
  stress-tested on 10⁶ random cases; iteration-count claims restated on a defined grid; rounding.
- 10: code unit bug (×10⁶ where ×10⁹ was needed for micrometres); eccentric anomalies in the ISS example;
  double-precision and RK4 error claims; sinh value.
- 11: uniqueness argument tightened (F′ = r ≥ r_p); digits-surviving claim.
- 12: χ³ and circular-orbit check values.
- 13: ISS sub-point is over western Kazakhstan, not the Urals; GEO sees 42% of Earth, not a third; J3 value
  consistency; Molniya p; geodetic latitude at altitude.
- 14: code called an undefined `gmst_deg` (now self-contained); tracked-object count; checksum labeling;
  SGP4 offset about 10 km; perigee altitude rounding.

### t2_m20_orbital_maneuvers
- 01: inconsistent validity rule (now about 15°); orbits "tangent" at the burn point → intersect.
- 02: Hohmann cost is not monotonic in r₂/r₁ — peaks at R ≈ 15.58; misleading GPS comment.
- 03: r_b → r₂ limit backwards (burn 3 vanishes); r_b → ∞ gets worse, not better.
- 04: "24 m/s per minute" → about 3.6 m/s per minute; arriving late with r_a < r₂ is impossible (never
  reaches the target) → second crossing.
- 05: optimal plane-change split is not near-even (f* ≈ 0.27 for the example); 53% not 52%.
- 06: second crossing is at 180° ± Δω/2, not a mirror image; mirror across the local horizontal; Molniya's
  critical inclination stops J2 from rotating the apse line.
- 07: unsupported "flown operationally" claim replaced with numbers.
- 08: burnout radius mislabeled (it was the new periapsis); speed loss treated as propellant cost — true
  energy shortfall about 0.8% vs 10.6% speed shortfall; several apoapsis values.
- 09: wrong angle in the plane-change working (44.8°, not 14.25°); the π/2 penalty comes from |cos u|
  averaging 2/π; "almost every GEO satellite" overstated.
- 10: 8° eastward move paired with a raise (a raise drifts west); GEO disposal about 1/15 of LEO deorbit;
  GEO deorbit about 1.49 km/s.
- 11: "negative a (bound orbit)" backwards; wrong next-module pointer (Lambert is m22).

### t2_m21_perturbations
- 01: lunar ratio 6.22; wrong lesson pointer; higher-zonal magnitudes; Moon/Sun growth 6–7×; J2 is about
  1,100× stronger at perigee on an eccentric orbit, not even.
- 02: J2 vector over the pole is K(0,0,±2); J4 size contradiction.
- 03: SRP-on-equatorial example false (replaced); J2 averaging reasoning (it is sin u·N that survives);
  periapsis-burn answer; "(mostly) e" removed; full de/dt, dω/dt derivations added.
- 04: critical-inclination example (ω climbs about 130° in 30 days, not 49°); run length and rates.
- 05: SSO inclinations beyond the table; dawn–dusk "never eclipsed" softened; residual node drift added.
- 06: extrema count (four per orbit).
- 07: circularization ratio about 13, not 18; density bracket factor about 800 at 800 km.
- 08: J2 perigee rate given in deg/day as rad/s (correct 7.035×10⁻⁷ rad/s); lunisolar vs J2 four orders, not
  three; lunar growth 7.2× vs solar 6.2×; tides one order below lunisolar, not two; GPS drift 11.5 km/day.
- 09: 1361/c = 4.54×10⁻⁶ N/m² (4.56×10⁻⁶ is from 1367 W/m²); one symbol meant two directions; SRP vs
  lunisolar in LEO overstated; eclipse 36 min; umbra radius, not cross-section.
- 10: rectification tables rebuilt; the explanation for over-frequent rectification was wrong (integrator
  error, not roundoff); synthetic-drag runs are physically impossible (noted).
- 11: Kozai and Brouwer published in 1959, not "the 1960s"; new sgp4-computed ISS example.
- 12: HEO perigee drag used circular speed; J2 exceeds drag all the way down to 120 km.

### t2_m22_lambert_targeting
- 01/03: short way and long way are opposite directions of travel, not two options for one direction; 80°/280°
  are not supplementary; a_min is not "the floor on how slow"; check Q5 "c > 2s" is impossible (c > s).
- 02: g derivation wrong (g = A√(y/μ)); y(z) now derived; "smaller than an atom" wrong; Izzo's x ranges; Gauss
  history.
- 03: example transfers pass through Earth (warning added); counterexample to "short way usually cheaper".
- 04: "sub-nanometre" precision → within a metre.
- 05: STM is not more expensive than finite differencing.
- 06: Jacobian must include the J2 gradient for quadratic convergence; convergence argument corrected.
- 07: reason for B-plane targeting is linearity, not arrival-time conditioning.
- 08: 180° ridge is only numerical in the coplanar model (real ridge shown with 1° inclination); grid
  spacing.
- 09: TCM must use the predicted arrival miss (1σ cost 9.34 m/s, not 5.18); cruise about 608 million km.

### t2_m23_relative_motion_rpo
- 01: relative-state example misread (chaser sinking, heading back to the plane).
- 02: "exact equation" example could not be reproduced — rebuilt; dropping the 3 in 3n²x changes the
  frequency, not stability; wrong-sign coupling keeps det = 1 while x grows exponentially.
- 03: sin(nt) value; determinant check is blind to the y row.
- 04: 30-minute error values; check Q1 reasoning (3× separation → 9× faster growth).
- 05: energy explanation false (δE = v₀Δv); "altitude" → radius.
- 06: radial-burn discrepancy; along-track figure 1,671 m/orbit; broken direction-of-travel passage rebuilt;
  ÿ + 2nẋ = 0 typo.
- 07: singular transfer times wrong (in-plane block singular at whole orbits and where tan(nT/2) = 3nT/8;
  half-orbit is fine); naive push direction.
- 08: rounding (270.3 s).
- 09: R-bar radial acceleration value and units (−7.64×10⁻⁴ m/s²); arm-captured cargo ships came up the R-bar.
- 10: corridor offset about 33× the limit, not six; 100% cancellation parks the chaser at a V-bar equilibrium
  (not an abort); approach ellipsoid and keep-out sphere both exist.
- 11: timeline 74–84 min.
- 12: relative GPS reaches decimetres to centimetres.

### t2_m24_edl
- 01: density at 120 km is 58 billionths of sea level, not millionths.
- 02: "nearly two-thirds of speed" → 53%.
- 03: peak-heating derivation had the wrong exponent (e^(−3cρ/2)); −1° curvature-error row 8.18 g / 196%, not
  25.4 g / 820%; peak values recomputed; altitude-gap sign.
- 04: larger nose → thicker boundary layer; heat-load table did not match its formula; Sutton–Graves was
  fitted to computed solutions; speed sensitivity 6×, not 3×.
- 05: footprint arithmetic; self-contradicting answer; meteoroid β.
- 06: missing g-limit column; skip threshold about 7,835 m/s; corridor-center check.
- 07: at 11 km/s the heating limit closes the L/D 0.1 corridor (warning added).
- 08: false cross-reference replaced with a computed 135 km shift; overclaims softened.
- 09: capsule C_D > 1 comes from shield flatness (C_D = 1 + cos²φ_c), not base pressure; C_p = 2 is the
  Newtonian limit (real air 1.81–1.84); event triggers.
- 11: "tens of metres above/below the ellipsoid" misleading → surface-model framing.
- 12: divert propellant summed per-axis Δv (wrong) — thrust binds, not propellant; feasible-window table.
- 13: "sky crane can hover because Mars gravity is low" is backwards (lower g makes hovering harder);
  entry-burn numbers reconciled with lesson 10; parachute Mach 1.7–2.1.
