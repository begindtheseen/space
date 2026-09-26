/* ============================================================================
   ORBIT — GNC track, tiers 0–2
   ----------------------------------------------------------------------------
   Foundations (mathematics + computation), dynamics, and astrodynamics: the
   24 modules that a complete beginner has to own before control theory,
   estimation, guidance and flight software make any sense at all.

   Tier 0  mathematical & computational foundations  (t0_m01 … t0_m12)
   Tier 1  dynamics                                  (t1_m13 … t1_m18)
   Tier 2  astrodynamics                             (t2_m19 … t2_m24)

   Every module in this file depends only on modules in this file — tiers 3–7
   live in their own file and depend on these, never the other way around.
   ========================================================================== */

import type { Module } from './types'

export const GNC_FOUNDATIONS: Module[] = [
  /* ══ TIER 0 — MATHEMATICAL & COMPUTATIONAL FOUNDATIONS ═══════════════════ */

  {
    id: 't0_m01_algebra_precalc',
    track: 'foundations',
    tier: 0,
    title: 'Algebra & Precalculus',
    summary:
      "Rebuild the symbolic fluency every later module silently assumes: rearrange and solve equations without arithmetic slips, move between engineering unit systems, and defend an order-of-magnitude estimate of a rocket-sized quantity.",
    prereqs: [],
    hours: 45,
    topics: [
      'arithmetic with signed numbers and fractions',
      'exponents and radicals',
      'polynomial manipulation and factoring',
      'linear and quadratic equations',
      'systems of equations',
      'functions: domain, range, composition, inverses',
      'exponentials and logarithms',
      'sequences, series, and sigma notation',
      'inequalities',
      'units and dimensional analysis',
      'scientific notation and significant figures',
      'order-of-magnitude (Fermi) estimation',
    ],
    objectives: [
      'Manipulate symbolic expressions fluently without arithmetic slips',
      'Solve linear and quadratic systems by hand',
      'Convert between and reason in engineering units (SI and US customary)',
      'Produce a defensible Fermi estimate and state its assumptions',
    ],
    resources: [
      {
        title: 'Algebra I / Algebra II / Precalculus',
        author: 'Khan Academy',
        kind: 'course',
        url: 'https://www.khanacademy.org/math/algebra',
        free: true,
        note: 'Full problem banks with mastery tracking — grind these until the algebra is invisible.',
      },
      {
        title: "Paul's Online Math Notes — Algebra",
        author: 'Paul Dawkins',
        kind: 'site',
        url: 'https://tutorial.math.lamar.edu',
        free: true,
        note: 'Terse, worked-example-heavy; the fastest refresher if the material is rusty rather than new.',
      },
      {
        title: 'College Algebra',
        author: 'OpenStax',
        kind: 'book',
        url: 'https://openstax.org',
        free: true,
        note: 'Free PDF with an exercise set per section.',
      },
      {
        title: 'Precalculus',
        author: 'Stitz & Zeager',
        kind: 'book',
        url: 'https://www.stitz-zeager.com',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'ex_massratio',
        title: 'Derive the mass-ratio relation symbolically',
        kind: 'derivation',
        hours: 1.5,
        prompt: [
          'A single stage has **dry mass** `m_d`, **propellant mass** `m_p`, and carries **payload** `m_L`.',
          '',
          '1. Write the initial mass `m_0` and the burnout mass `m_f` in terms of those three symbols.',
          '2. Define the mass ratio `MR = m_0 / m_f` and the propellant mass fraction `zeta = m_p / (m_p + m_d)`.',
          '3. Solve for `m_f` given `m_0` and `MR`, and for `m_p` given `m_0` and `MR`.',
          '4. Show algebraically that with a fixed `MR`, adding payload forces you to add propellant in the same ratio.',
          '',
          'Success: every step is a symbolic identity you can justify in one line, and step 4 is an inequality or identity — not a numerical example.',
        ].join('\n'),
      },
      {
        id: 'ex_fermi_f9prop',
        title: 'Fermi-estimate Falcon 9 first-stage propellant mass',
        kind: 'analysis',
        hours: 2,
        prompt: [
          'Using only publicly published *dimensions* (stage diameter 3.7 m, first-stage length ~41 m) and propellant densities',
          '(RP-1 ~ 810 kg/m³, liquid oxygen ~ 1141 kg/m³, mixture ratio roughly 2.3:1 by mass, O/F), estimate the first-stage',
          'propellant load.',
          '',
          '- State every assumption explicitly (ullage fraction, common bulkhead, intertank volume, tank domes).',
          '- Carry units through every line.',
          '- Compare your answer to the published ~411 t and explain the sign and size of your error.',
          '',
          'Success: your estimate lands within a factor of 1.5, and you can name the single assumption that dominates the residual error.',
        ].join('\n'),
      },
      {
        id: 'ex_unitconv',
        title: 'Engineering unit-conversion library',
        kind: 'code',
        lang: 'python',
        hours: 2,
        prompt: [
          'Aerospace work mixes SI and US customary constantly: thrust in lbf, tank pressure in psi, ranges in nautical miles.',
          'Write a small converter that **refuses** to convert across physical dimensions — a silent lbf→kg conversion is exactly',
          'the class of bug that loses vehicles.',
          '',
          'Implement `convert(value, frm, to)` supporting at minimum: `lbf`/`N`, `psi`/`Pa`, `slug`/`kg`, `nmi`/`km`, `ft`/`m`.',
          'Raise `ValueError` when the two units belong to different dimensions.',
        ].join('\n'),
        starter: `"""Engineering unit conversions.

Each entry of FACTORS maps a unit name to (dimension, value_in_SI_base_units),
so that converting is a multiply-then-divide through the SI base unit.
"""

FACTORS: dict[str, tuple[str, float]] = {
    # TODO: fill these in. Example of the intended shape:
    #   "N":   ("force", 1.0),
    #   "lbf": ("force", 4.4482216152605),
    # Cover: lbf/N, psi/Pa, slug/kg, nmi/km, ft/m.
}


def convert(value: float, frm: str, to: str) -> float:
    """Convert \`value\` from unit \`frm\` to unit \`to\`.

    Raises
    ------
    KeyError
        if a unit name is unknown.
    ValueError
        if the two units measure different physical dimensions.
    """
    # TODO: look both units up, check the dimensions match, then scale.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'pound-force to newtons',
            assert: `assert abs(convert(1.0, "lbf", "N") - 4.4482216) < 1e-6`,
          },
          {
            name: 'nautical mile is exactly 1.852 km',
            assert: `assert abs(convert(1.0, "nmi", "km") - 1.852) < 1e-12`,
          },
          {
            name: 'psi to pascals',
            assert: `assert abs(convert(300.0, "psi", "Pa") - 2.0684e6) < 1e3`,
          },
          {
            name: 'cross-dimension conversion is rejected',
            hidden: true,
            assert: `try:
    convert(1.0, "lbf", "kg")
except ValueError:
    pass
else:
    raise AssertionError("converting force to mass must raise ValueError")`,
          },
        ],
      },
    ],
    cards: [
      {
        id: 'c_massratio_def',
        front: 'Define the mass ratio MR of a rocket stage.',
        back: 'MR = m₀ / m_f — initial (wet) mass over burnout (dry + payload) mass. It is dimensionless and always > 1.',
        formula: true,
      },
      {
        id: 'c_log_product',
        front: 'log(ab) = ?  and  log(a/b) = ?',
        back: 'log(ab) = log a + log b;  log(a/b) = log a − log b. Logs turn multiplication into addition.',
        formula: true,
      },
      {
        id: 'c_log_changebase',
        front: 'State the change-of-base formula for logarithms.',
        back: 'log_b(x) = ln(x) / ln(b)',
        formula: true,
      },
      {
        id: 'c_quadratic',
        front: 'State the quadratic formula for ax² + bx + c = 0.',
        back: 'x = (−b ± √(b² − 4ac)) / (2a). For b² ≫ 4ac compute the small root as c/(a·x_large) to avoid cancellation.',
        formula: true,
      },
      {
        id: 'c_geometric_series',
        front: 'Sum of an infinite geometric series with |r| < 1?',
        back: 'S = a / (1 − r), where a is the first term. Finite n terms: S_n = a(1 − rⁿ)/(1 − r).',
        formula: true,
      },
      {
        id: 'c_g0',
        front: 'Value of standard gravity g₀ (the constant in Isp·g₀)?',
        back: '9.80665 m/s² — a defined constant, not the local gravity at your launch site.',
        formula: true,
      },
      {
        id: 'c_isp_ve',
        front: 'Relate specific impulse Isp to effective exhaust velocity v_e.',
        back: 'v_e = Isp · g₀. Isp of 311 s ⇒ v_e ≈ 3050 m/s.',
        formula: true,
      },
      {
        id: 'c_lbf_N',
        front: '1 lbf in newtons?',
        back: '4.4482216 N (≈ 4.45 N). So 1 000 000 lbf ≈ 4.45 MN.',
        formula: true,
      },
      {
        id: 'c_psi_pa',
        front: '1 psi in pascals?',
        back: '6894.76 Pa ≈ 6.895 kPa. 1 atm ≈ 14.7 psi ≈ 101.325 kPa.',
        formula: true,
      },
      {
        id: 'c_nmi_km',
        front: '1 nautical mile in kilometres?',
        back: '1.852 km, exactly (defined as one minute of latitude at the equator, rounded to a defined value).',
        formula: true,
      },
      {
        id: 'c_slug_kg',
        front: '1 slug in kilograms?',
        back: '14.5939 kg. A slug is the mass that 1 lbf accelerates at 1 ft/s².',
        formula: true,
      },
      {
        id: 'c_dimensional_homogeneity',
        front: 'What does dimensional homogeneity require of an equation?',
        back: 'Every additive term must carry identical dimensions, and the arguments of exp, ln, sin and cos must be dimensionless. It is the cheapest error check you own.',
      },
      {
        id: 'c_sigfigs',
        front: 'Rule of thumb for significant figures through a multiply/divide chain?',
        back: 'The result carries no more significant figures than the least-precise input. Additions instead track the coarsest decimal place, not the fewest sig figs.',
      },
    ],
    quiz: [
      {
        id: 'q_massratio_num',
        q: 'A single stage has 25 t dry mass and 400 t of propellant, carrying no payload. What is its mass ratio m₀/m_f?',
        choices: ['17.0', '16.0', '1.0625', '0.0588'],
        answer: 0,
        explain:
          'm₀ = 25 + 400 = 425 t and m_f = 25 t, so MR = 425/25 = 17.0. The common slip is 400/25 = 16, which forgets that the dry mass is also part of the initial mass.',
        b: -1.2,
        bloom: 'apply',
      },
      {
        id: 'q_log_staging',
        q: 'Why is it useful that Δv depends on the logarithm of the mass ratio?',
        choices: [
          'Because logs turn the multiplicative stacking of stage mass ratios into an additive stacking of Δv',
          'Because the logarithm makes the rocket equation linear in propellant mass',
          'Because logarithms remove the dependence on exhaust velocity',
          'Because the log keeps the mass ratio dimensionless',
        ],
        answer: 0,
        explain:
          'Δv = v_e ln(MR). Staging multiplies mass ratios, and ln turns that product into a sum: total Δv is the sum of per-stage Δv. That additivity is why staging is analysed stage-by-stage. The mass ratio is dimensionless whether or not you take its log.',
        b: -0.3,
        bloom: 'understand',
      },
      {
        id: 'q_mr_for_dv',
        q: 'With an effective exhaust velocity of 3000 m/s, what mass ratio is required for Δv = 2 km/s (ignoring losses)?',
        choices: ['1.95', '1.51', '2.72', '0.67'],
        answer: 0,
        explain:
          'MR = exp(Δv / v_e) = exp(2000/3000) = exp(0.667) ≈ 1.95, i.e. about 49% of the initial mass must be propellant. 0.67 is the exponent itself and 2.72 is e, both classic mis-picks.',
        b: -0.1,
        bloom: 'apply',
      },
      {
        id: 'q_psi_mpa',
        q: 'A tank is regulated to 300 psi. What is that in MPa?',
        choices: ['2.07 MPa', '0.207 MPa', '20.7 MPa', '4.35 MPa'],
        answer: 0,
        explain: '300 psi × 6894.76 Pa/psi ≈ 2.068 × 10⁶ Pa = 2.07 MPa. The other options are decimal-place slips or the inverse conversion.',
        b: -1.0,
        bloom: 'apply',
      },
    ],
    tags: ['math', 'foundations'],
  },

  {
    id: 't0_m02_trigonometry',
    track: 'foundations',
    tier: 0,
    title: 'Trigonometry & Analytic Geometry',
    summary:
      "Make the unit circle, atan2 and the conic sections automatic. By the end you can move a vector between Cartesian, polar and spherical coordinates, difference two angles without a wrap bug, and recognise every two-body orbit as a conic.",
    prereqs: ['t0_m01_algebra_precalc'],
    hours: 35,
    topics: [
      'radians vs degrees',
      'the unit circle',
      'sin, cos, tan and their inverses',
      'atan2 and quadrant correctness',
      'identities: Pythagorean, sum/difference, double-angle',
      'law of sines and law of cosines',
      'small-angle approximations',
      'polar and spherical coordinates',
      'conic sections in geometric and polar form',
      'complex numbers and Euler formula',
    ],
    objectives: [
      'Use atan2 correctly and explain why atan alone is a bug in flight code',
      'Switch fluently between Cartesian, polar and spherical coordinates',
      'Recognise conics as the shape of every two-body orbit',
      'Apply the small-angle approximation and state where it breaks',
    ],
    resources: [
      {
        title: 'Trigonometry',
        author: 'Khan Academy',
        kind: 'course',
        url: 'https://www.khanacademy.org/math/trigonometry',
        free: true,
      },
      {
        title: "Paul's Online Math Notes — Trig review",
        author: 'Paul Dawkins',
        kind: 'site',
        url: 'https://tutorial.math.lamar.edu',
        free: true,
      },
      {
        title: 'Euler formula with introductory group theory',
        author: '3Blue1Brown',
        kind: 'video',
        url: 'https://www.youtube.com/c/3blue1brown',
        free: true,
        note: 'Builds the intuition that e^(iθ) is rotation, which pays off again in quaternions.',
      },
    ],
    exercises: [
      {
        id: 'ex_ecef_geodetic',
        title: 'ECEF to geodetic latitude / longitude / altitude',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'Every ground track, every GPS fix and every launch-site vector needs this conversion, and it is pure trigonometry',
          'plus one iteration.',
          '',
          'Implement `ecef_to_geodetic(x, y, z)` on the **WGS-84 ellipsoid** (a = 6378137.0 m, f = 1/298.257223563), returning',
          '`(lat_rad, lon_rad, alt_m)` with *geodetic* (not geocentric) latitude. Use either the Bowring closed-form',
          'approximation or a fixed-point iteration on latitude; state which and why.',
          '',
          'Then answer in a comment: at 45° latitude, how far apart are geodetic and geocentric latitude?',
        ].join('\n'),
        starter: `import math

A = 6378137.0                    # WGS-84 semi-major axis, metres
F = 1.0 / 298.257223563          # WGS-84 flattening
B = A * (1.0 - F)                # semi-minor axis
E2 = F * (2.0 - F)               # first eccentricity squared


def ecef_to_geodetic(x: float, y: float, z: float) -> tuple[float, float, float]:
    """Convert ECEF metres to (geodetic latitude, longitude, altitude).

    Returns
    -------
    (lat_rad, lon_rad, alt_m)
        Latitude in [-pi/2, pi/2], longitude in (-pi, pi] via atan2.
    """
    # TODO: longitude is the easy one -- use atan2, never atan.
    # TODO: iterate (or use Bowring) for geodetic latitude, then back out altitude
    #       from the prime-vertical radius of curvature N = A / sqrt(1 - E2 sin^2(lat)).
    raise NotImplementedError
`,
        tests: [
          {
            name: 'equatorial prime-meridian point',
            assert: `lat, lon, alt = ecef_to_geodetic(6378137.0, 0.0, 0.0)
assert abs(lat) < 1e-9 and abs(lon) < 1e-9 and abs(alt) < 1e-6`,
          },
          {
            name: 'north pole sits at latitude +90 deg, zero altitude',
            assert: `import math
lat, lon, alt = ecef_to_geodetic(0.0, 0.0, 6356752.314245)
assert abs(lat - math.pi / 2) < 1e-9 and abs(alt) < 1e-6`,
          },
          {
            name: 'longitude uses all four quadrants',
            hidden: true,
            assert: `import math
lat, lon, alt = ecef_to_geodetic(-4000000.0, -4000000.0, 0.0)
assert abs(lon - (-3.0 * math.pi / 4.0)) < 1e-9`,
          },
        ],
      },
      {
        id: 'ex_conic_sweep',
        title: 'Sweep eccentricity through all four conics',
        kind: 'code',
        lang: 'python',
        hours: 2,
        prompt: [
          'The two-body orbit equation is a conic in polar form:',
          '',
          '```',
          'r(nu) = p / (1 + e cos nu),   p = h^2 / mu',
          '```',
          '',
          'Implement `conic_radius(p, e, nu)` and `conic_type(e)`, then plot r(nu) for e = 0, 0.5, 1.0, 1.5 on one polar axis.',
          'For e >= 1 you must clip the sweep: the radius blows up at the asymptote where 1 + e cos nu = 0.',
          '',
          'Success: your plot shows a circle, an ellipse, a parabola and a hyperbola, and `conic_type` classifies correctly at the boundaries.',
        ].join('\n'),
        starter: `import math


def conic_type(e: float) -> str:
    """Classify a conic by eccentricity: circle / ellipse / parabola / hyperbola."""
    # TODO: mind the boundaries -- e == 0 and e == 1 are their own cases.
    raise NotImplementedError


def conic_radius(p: float, e: float, nu: float) -> float:
    """Radius at true anomaly nu for semi-latus rectum p and eccentricity e.

    Raises ValueError if the denominator is non-positive (nu beyond the
    asymptote of an open orbit).
    """
    # TODO: implement r = p / (1 + e cos nu) with the guard described above.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'classification at the boundaries',
            assert: `assert conic_type(0.0) == "circle"
assert conic_type(0.5) == "ellipse"
assert conic_type(1.0) == "parabola"
assert conic_type(1.5) == "hyperbola"`,
          },
          {
            name: 'periapsis radius is p/(1+e)',
            assert: `assert abs(conic_radius(7000.0, 0.2, 0.0) - 7000.0 / 1.2) < 1e-9`,
          },
          {
            name: 'circle has constant radius',
            assert: `import math
vals = [conic_radius(7000.0, 0.0, nu) for nu in (0.0, 1.0, 2.5, math.pi)]
assert max(vals) - min(vals) < 1e-9`,
          },
        ],
      },
    ],
    cards: [
      {
        id: 'c_atan2_why',
        front: 'Why does flight software use atan2(y, x) instead of atan(y/x)?',
        back: 'atan2 resolves all four quadrants and is defined at x = 0; atan(y/x) can only answer in quadrants I and IV, so a point in III is reported as I and one in II as IV, and it divides by zero on the ±90° axis.',
      },
      {
        id: 'c_euler_formula',
        front: 'State Euler formula.',
        back: 'e^(iθ) = cos θ + i sin θ. Multiplying by e^(iθ) rotates a complex number by θ.',
        formula: true,
      },
      {
        id: 'c_pythag_identity',
        front: 'State the Pythagorean identity and its tangent form.',
        back: 'sin²θ + cos²θ = 1;  1 + tan²θ = sec²θ',
        formula: true,
      },
      {
        id: 'c_small_angle',
        front: 'Small-angle approximations for sin, cos and tan (θ in radians).',
        back: 'sin θ ≈ θ − θ³/6,  cos θ ≈ 1 − θ²/2,  tan θ ≈ θ + θ³/3',
        formula: true,
      },
      {
        id: 'c_small_angle_error',
        front: 'At roughly what angle does sin θ ≈ θ exceed 1% relative error?',
        back: 'About 14° (0.245 rad). The relative error grows as θ²/6, so 15° is already ≈ 1.15%.',
      },
      {
        id: 'c_law_cosines',
        front: 'State the law of cosines.',
        back: 'c² = a² + b² − 2ab·cos C, where C is the angle opposite side c.',
        formula: true,
      },
      {
        id: 'c_orbit_polar',
        front: 'Polar (conic) form of the two-body orbit equation.',
        back: 'r = p / (1 + e cos ν), with semi-latus rectum p = h²/μ and ν the true anomaly.',
        formula: true,
      },
      {
        id: 'c_conic_by_e',
        front: 'Classify a conic by eccentricity e.',
        back: 'e = 0 circle · 0 < e < 1 ellipse · e = 1 parabola (escape, zero energy) · e > 1 hyperbola (positive energy).',
      },
      {
        id: 'c_deg_rad',
        front: 'Convert degrees to radians and back.',
        back: 'rad = deg × π/180;  deg = rad × 180/π. One radian ≈ 57.2958°.',
        formula: true,
      },
      {
        id: 'c_angle_wrap',
        front: 'How do you difference two angles without a wrap bug?',
        back: 'Δ = atan2(sin(a − b), cos(a − b)), which always returns the shortest signed angle in (−π, π]. Equivalently wrap (a − b) with mod 2π then subtract 2π if the result exceeds π.',
        formula: true,
      },
      {
        id: 'c_double_angle',
        front: 'Double-angle identities for sin and cos.',
        back: 'sin 2θ = 2 sin θ cos θ;  cos 2θ = cos²θ − sin²θ = 1 − 2sin²θ = 2cos²θ − 1',
        formula: true,
      },
      {
        id: 'c_spherical_to_cart',
        front: 'Cartesian components from radius r, latitude φ and longitude λ.',
        back: 'x = r cos φ cos λ,  y = r cos φ sin λ,  z = r sin φ',
        formula: true,
      },
      {
        id: 'c_geodetic_vs_geocentric',
        front: 'Geodetic vs geocentric latitude — what is the difference?',
        back: 'Geocentric latitude is the angle at the centre of the Earth to the point; geodetic latitude is the angle of the local ellipsoid normal. On WGS-84 they differ by up to ≈ 0.19° (≈ 11.5 arcmin) near 45°.',
      },
    ],
    quiz: [
      {
        id: 'q_atan2',
        q: 'A vector has components x = −1, y = −1. What does atan(y/x) return, and what does atan2(y, x) return?',
        choices: [
          'atan returns +45°, atan2 returns −135° — atan cannot see that the vector is in the third quadrant',
          'Both return −135°; atan2 is only a convenience wrapper',
          'atan returns −45°, atan2 returns +135°',
          'Both return +45°; the sign information is lost either way',
        ],
        answer: 0,
        explain:
          'y/x = 1, so atan(1) = +45°, pointing into the first quadrant — the wrong half of the plane. atan2(−1, −1) keeps both signs and returns −135°, the correct direction. This is why atan2 is mandatory for any bearing, azimuth or gimbal angle.',
        b: -0.6,
        bloom: 'apply',
      },
      {
        id: 'q_conic_transition',
        q: 'In r = p/(1 + e cos ν), what happens physically as e passes through 1?',
        choices: [
          'The orbit stops being closed: specific energy passes through zero and the trajectory becomes an escape (parabolic) then hyperbolic path',
          'The orbit flips from prograde to retrograde',
          'The semi-latus rectum p becomes negative',
          'The true anomaly becomes complex-valued',
        ],
        answer: 0,
        explain:
          'Specific mechanical energy ε = −μ/(2a) and e² = 1 + 2εh²/μ². At e = 1, ε = 0, a → ∞: the vehicle just barely escapes. Above e = 1 the energy is positive and r → ∞ at the finite asymptote angle where 1 + e cos ν = 0.',
        b: 0.2,
        bloom: 'understand',
      },
      {
        id: 'q_angle_wrap_bug',
        q: 'A gimbal feedback loop computes error as (commanded − measured) with both angles in degrees. Commanded is 179.9°, measured is −179.9°. What does the naive difference produce?',
        choices: [
          '359.8°, which commands a full-rate slew the wrong way around instead of the true 0.2° correction',
          '0.2°, which is correct — degrees wrap automatically',
          '−0.2°, the right size but the wrong sign',
          '180°, saturating the actuator',
        ],
        answer: 0,
        explain:
          'The true shortest error is 0.2°, but subtraction gives 359.8°. The controller sees a huge error and slews the long way around — a real class of actuator failure. Fix by wrapping the error into (−180°, 180°], e.g. atan2(sin Δ, cos Δ).',
        b: -0.2,
        bloom: 'analyze',
      },
      {
        id: 'q_small_angle_limit',
        q: 'You approximate sin θ ≈ θ in a control law. Above roughly what angle does the approximation carry more than 1% relative error?',
        choices: ['≈ 14°', '≈ 1°', '≈ 30°', '≈ 45°'],
        answer: 0,
        explain:
          'The leading error term is θ³/6, giving a relative error of about θ²/6. Setting θ²/6 = 0.01 gives θ ≈ 0.245 rad ≈ 14°. This is why small-angle linearised attitude control is fine for a few degrees of error and not for a large-angle slew.',
        b: 0.1,
        bloom: 'apply',
      },
    ],
    tags: ['math', 'foundations'],
  },

  {
    id: 't0_m03_python_scicomp',
    track: 'foundations',
    tier: 0,
    title: 'Python for Scientific Computing',
    summary:
      'Turn Python into a flight-analysis instrument: vectorised NumPy, SciPy integration and optimisation, matplotlib, pytest and git. Every later module ships as tested, version-controlled code instead of scratch work.',
    prereqs: ['t0_m01_algebra_precalc'],
    hours: 60,
    topics: [
      'Python syntax, control flow, functions, classes',
      'NumPy arrays, broadcasting, vectorisation, dtypes, float64 semantics',
      'SciPy: integrate.solve_ivp, optimize, linalg, signal, stats',
      'matplotlib and publication-grade plots',
      'Jupyter notebooks',
      'virtual environments and pip',
      'pytest and test-driven numerical code',
      'git and GitHub',
      'reading and plotting CSV / HDF5 telemetry',
      'floating-point pitfalls: catastrophic cancellation, machine epsilon',
    ],
    objectives: [
      'Vectorise a Monte Carlo instead of looping over samples',
      'Write a unit-tested module with a real pytest suite',
      'Version-control every project from the first commit',
      'Produce publication-grade plots of trajectories and time histories',
    ],
    resources: [
      {
        title: 'Python Data Science Handbook',
        author: 'Jake VanderPlas',
        kind: 'book',
        url: 'https://jakevdp.github.io/PythonDataScienceHandbook/',
        free: true,
        note: 'The NumPy and matplotlib chapters are the fastest route to fluency.',
      },
      {
        title: 'Scientific Python Lectures',
        kind: 'course',
        url: 'https://scipy-lectures.org',
        free: true,
      },
      {
        title: 'Think Python',
        author: 'Allen B. Downey',
        kind: 'book',
        url: 'https://greenteapress.com/wp/think-python-2e/',
        free: true,
      },
      { title: 'Pro Git', author: 'Chacon & Straub', kind: 'book', url: 'https://git-scm.com/book', free: true },
      { title: 'pytest documentation', kind: 'docs', url: 'https://docs.pytest.org', free: true },
      { title: 'NumPy documentation', kind: 'docs', url: 'https://numpy.org/doc/stable/', free: true },
    ],
    exercises: [
      {
        id: 'ex_mc_projectile',
        title: 'Vectorised Monte Carlo of a dispersed projectile',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'Monte Carlo is how GNC teams certify a trajectory. Learn the vectorised idiom now, because at SpaceX these run',
          'over tens of thousands of CPUs and a Python `for` loop over samples is not an option.',
          '',
          'Implement `monte_carlo_range(v0, mean_deg, sigma_deg, n, g=9.80665, seed=0)` that draws `n` launch angles from a',
          'normal distribution and returns a NumPy array of flat-ground ranges `R = v0² sin(2θ)/g`.',
          '',
          '- Use a single `numpy.random.default_rng(seed)` and **no Python loop over samples**.',
          '- Then report the mean, the standard deviation, and the 99.87th percentile (the +3σ range).',
          '',
          'Success: 100 000 samples run in well under a second, and with sigma = 0 every sample equals the analytic range.',
        ].join('\n'),
        starter: `import numpy as np


def monte_carlo_range(
    v0: float,
    mean_deg: float,
    sigma_deg: float,
    n: int,
    g: float = 9.80665,
    seed: int = 0,
) -> np.ndarray:
    """Flat-ground ranges for n samples of a normally dispersed launch angle.

    Parameters
    ----------
    v0 : muzzle speed, m/s
    mean_deg, sigma_deg : launch elevation mean and 1-sigma, degrees
    n : number of samples
    seed : RNG seed, so the run is reproducible

    Returns
    -------
    np.ndarray of shape (n,) -- range in metres for each sample.
    """
    rng = np.random.default_rng(seed)
    # TODO: draw all n angles at once, convert to radians, and evaluate
    #       R = v0**2 * sin(2 theta) / g as a single vectorised expression.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'zero dispersion reproduces the analytic range',
            assert: `import numpy as np
r = monte_carlo_range(100.0, 45.0, 0.0, 1000)
assert r.shape == (1000,)
assert np.allclose(r, 100.0 ** 2 / 9.80665)`,
          },
          {
            name: 'result is a float64 array, not a list',
            assert: `import numpy as np
r = monte_carlo_range(100.0, 30.0, 2.0, 500)
assert isinstance(r, np.ndarray) and r.dtype == np.float64`,
          },
          {
            name: 'same seed gives the same samples',
            hidden: true,
            assert: `import numpy as np
a = monte_carlo_range(100.0, 30.0, 2.0, 100, seed=7)
b = monte_carlo_range(100.0, 30.0, 2.0, 100, seed=7)
assert np.array_equal(a, b)`,
          },
        ],
      },
      {
        id: 'ex_vec3_quat_class',
        title: 'A Vec3 / Quaternion module with a real pytest suite',
        kind: 'code',
        lang: 'python',
        hours: 5,
        prompt: [
          'Write `vecquat.py` containing a `Vec3` and a `Quaternion` class, then a `test_vecquat.py` that actually earns its keep.',
          '',
          'Required behaviour:',
          '- `Vec3`: addition, scalar multiplication, `dot`, `cross`, `norm`, `normalized`.',
          '- `Quaternion`: **scalar-first** (w, x, y, z) storage, Hamilton product, `conjugate`, `norm`, `normalized`,',
          '  and `rotate(v)` applying the rotation to a `Vec3`.',
          '- Tests must cover: q ⊗ q* = identity, ‖q₁ ⊗ q₂‖ = ‖q₁‖‖q₂‖, rotation preserves vector length,',
          '  and that rotating by q and by −q gives the same result (the double cover).',
          '',
          'Success: `pytest -q` is green, and the suite fails if you deliberately flip a sign in the Hamilton product.',
        ].join('\n'),
        starter: `"""Minimal 3-vector and quaternion types, with real invariants.

Convention: quaternions are UNIT and SCALAR-FIRST, q = (w, x, y, z),
Hamilton product, and rotate() applies the rotation to a Vec3.
"""

from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass(frozen=True)
class Vec3:
    x: float
    y: float
    z: float

    def __add__(self, other: "Vec3") -> "Vec3":
        # TODO: componentwise addition
        raise NotImplementedError

    def scale(self, k: float) -> "Vec3":
        # TODO
        raise NotImplementedError

    def dot(self, other: "Vec3") -> float:
        # TODO
        raise NotImplementedError

    def cross(self, other: "Vec3") -> "Vec3":
        # TODO: (y1 z2 - z1 y2, z1 x2 - x1 z2, x1 y2 - y1 x2)
        raise NotImplementedError

    def norm(self) -> float:
        # TODO
        raise NotImplementedError

    def normalized(self) -> "Vec3":
        """Raise ZeroDivisionError on a zero vector rather than returning NaN."""
        # TODO
        raise NotImplementedError


@dataclass(frozen=True)
class Quaternion:
    w: float
    x: float
    y: float
    z: float

    def __mul__(self, other: "Quaternion") -> "Quaternion":
        """Hamilton product: (w1 w2 - v1.v2, w1 v2 + w2 v1 + v1 x v2)."""
        # TODO
        raise NotImplementedError

    def conjugate(self) -> "Quaternion":
        # TODO: negate the vector part
        raise NotImplementedError

    def norm(self) -> float:
        # TODO
        raise NotImplementedError

    def normalized(self) -> "Quaternion":
        # TODO
        raise NotImplementedError

    def rotate(self, v: Vec3) -> Vec3:
        """Apply this rotation to v. Either q * (0, v) * q.conjugate(), or the
        expanded form v + 2 w (qv x v) + 2 qv x (qv x v), which is cheaper."""
        # TODO
        raise NotImplementedError
`,
      },
      {
        id: 'ex_traj_plot',
        title: 'Publication-grade 3D trajectory plot',
        kind: 'build',
        hours: 2,
        prompt: [
          'Integrate a simple 3-DOF ballistic trajectory with `scipy.integrate.solve_ivp` and produce a figure that would',
          'survive a design review:',
          '',
          '- 3D trajectory with the ground track projected onto the z = 0 plane.',
          '- Axis labels with units, an equal-aspect 3D box, a title that states the initial conditions.',
          '- A second panel with altitude, speed and flight-path angle vs time sharing the time axis.',
          '- Saved to PNG at 200 dpi from a script (not from a notebook cell), so it regenerates reproducibly.',
        ].join('\n'),
      },
    ],
    cards: [
      {
        id: 'c_broadcasting',
        front: 'State the NumPy broadcasting rule.',
        back: 'Shapes are compared right to left; two dimensions are compatible if they are equal or one of them is 1, and size-1 dimensions are stretched. (3,1) with (1,5) broadcasts to (3,5).',
      },
      {
        id: 'c_eps64',
        front: 'Machine epsilon for IEEE-754 float64?',
        back: '≈ 2.22 × 10⁻¹⁶ (2⁻⁵²) — about 15–16 significant decimal digits.',
        formula: true,
      },
      {
        id: 'c_cancellation',
        front: 'What is catastrophic cancellation?',
        back: 'Subtracting two nearly equal floating-point numbers annihilates the leading digits, so the small absolute error of the inputs becomes a large relative error in the result. Fix by algebraic rearrangement, not by more precision.',
      },
      {
        id: 'c_solve_ivp',
        front: 'Minimum call signature of scipy.integrate.solve_ivp?',
        back: 'solve_ivp(fun, t_span, y0, method="RK45", t_eval=None, rtol=1e-3, atol=1e-6), where fun(t, y) returns dy/dt. For orbits tighten rtol/atol to ~1e-12/1e-12 and use DOP853.',
        formula: true,
      },
      {
        id: 'c_at_operator',
        front: 'What does the @ operator do in NumPy?',
        back: 'Matrix multiplication (__matmul__). For 1-D operands it contracts them into a scalar dot product; * is always elementwise.',
      },
      {
        id: 'c_dot_vs_cross',
        front: 'Geometric meaning of dot vs cross product of two 3-vectors?',
        back: 'a·b = |a||b| cos θ, a scalar projection. a×b is a vector perpendicular to both, |a||b| sin θ in magnitude, with direction by the right-hand rule.',
        formula: true,
      },
      {
        id: 'c_quat_norm_test',
        front: 'Why unit-test a quaternion normalisation routine?',
        back: 'A quaternion that drifts off unit norm silently corrupts the DCM built from it — the rotation picks up a scale factor and stops being orthonormal, so every rotated vector is subtly wrong with no exception thrown.',
      },
      {
        id: 'c_vectorize_why',
        front: 'Why is a per-sample Python loop slow in a 100k-run Monte Carlo?',
        back: 'The CPython interpreter pays type dispatch and object overhead on every iteration. NumPy pushes the loop into compiled C over a contiguous buffer, typically 50–200× faster.',
      },
      {
        id: 'c_pytest_approx',
        front: 'How do you assert floating-point closeness in pytest / NumPy?',
        back: 'assert x == pytest.approx(expected, rel=1e-9), or np.testing.assert_allclose(actual, desired, rtol=..., atol=...). Never assert exact float equality on a computed value.',
        formula: true,
      },
      {
        id: 'c_venv',
        front: 'Create and activate an isolated Python environment.',
        back: 'python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt',
        formula: true,
      },
      {
        id: 'c_git_snapshot',
        front: 'Git commands to record a snapshot and push it.',
        back: 'git add -A · git commit -m "message" · git push origin <branch>. Commit before every experiment so you can bisect a regression later.',
        formula: true,
      },
      {
        id: 'c_float32_vs_64',
        front: 'float32 vs float64 — when does the difference bite in GNC?',
        back: 'float32 carries ~7 decimal digits, which is ~0.5 m of resolution on a 6.4 × 10⁶ m Earth radius. Orbit propagation and covariance work run in float64; float32 shows up only in bandwidth-limited telemetry or GPU work.',
      },
    ],
    quiz: [
      {
        id: 'q_broadcast_shapes',
        q: 'You multiply arrays of shape (3,1) and (1,5). What shape comes out, and why does that matter when you build a covariance?',
        choices: [
          '(3,5) — the outer-product shape, which is exactly how v @ v.T style covariance blocks get built (and how a shape bug silently produces a matrix instead of a scalar)',
          '(3,5), but it is an error unless you call np.outer explicitly',
          '(1,1) — the dimensions contract like a dot product',
          'It raises a ValueError: the shapes are incompatible',
        ],
        answer: 0,
        explain:
          'Right-to-left, 1 vs 5 stretches to 5 and 3 vs 1 stretches to 3, giving (3,5). This is useful for building outer products such as σσᵀ, and dangerous because forgetting a .ravel() turns an intended (3,) vector into a (3,3) array with no error raised.',
        b: -0.2,
        bloom: 'apply',
      },
      {
        id: 'q_cancellation_fix',
        q: 'Computing √(x² + 1) − x for large x loses all significant digits. What is the numerically stable rewrite?',
        choices: [
          '1 / (√(x² + 1) + x)',
          'x(√(1 + 1/x²) − 1)',
          '√(x² + 1 − x²)',
          'Use float128 instead',
        ],
        answer: 0,
        explain:
          'Multiply by the conjugate: (√(x²+1) − x)(√(x²+1) + x) = 1, so the expression equals 1/(√(x²+1) + x), which adds two positive quantities and never cancels. Increasing precision only delays the failure; rearranging removes it.',
        b: 0.5,
        bloom: 'analyze',
      },
      {
        id: 'q_pytest_quat',
        q: 'Which property is the most valuable single unit test for a quaternion library?',
        choices: [
          'That rotating a vector preserves its length, since that catches sign errors, convention mismatches and norm drift at once',
          'That the w component is always positive',
          'That the library runs faster than the NumPy equivalent',
          'That the quaternion prints in scalar-last order',
        ],
        answer: 0,
        explain:
          'Length preservation is the defining property of a rotation. A flipped sign in the Hamilton product, a transposed DCM or an un-normalised quaternion all break it, so one test catches a whole family of bugs. A positive w is a convention choice, not a correctness property — q and −q are the same rotation.',
        b: 0.0,
        bloom: 'understand',
      },
      {
        id: 'q_solve_ivp_tol',
        q: 'Your two-body propagator drifts in energy over 100 revolutions using solve_ivp defaults. What is the first thing to change?',
        choices: [
          'Tighten rtol and atol (defaults of 1e-3 / 1e-6 are far too loose) and move to a higher-order method such as DOP853',
          'Switch the state to float32 to reduce memory traffic',
          'Shorten t_span and stitch the segments together',
          'Add more points to t_eval',
        ],
        answer: 0,
        explain:
          'solve_ivp defaults to rtol = 1e-3, which is fine for a rough ODE and catastrophic for orbits. Tightening tolerances and using DOP853 is the first move; t_eval only controls output sampling and changes nothing about the internal steps.',
        b: 0.4,
        bloom: 'analyze',
      },
    ],
    tags: ['code', 'python', 'spacex-core', 'interview'],
    importance: 1.3,
  },

  {
    id: 't0_m04_linear_algebra_1',
    track: 'foundations',
    tier: 0,
    title: 'Linear Algebra I: Vectors, Matrices, Solving',
    summary:
      'Learn to read a matrix as a linear map between reference frames rather than a table of numbers: solve and factor systems, interpret rank and null space as observability, and build the skew-symmetric cross-product matrix that appears in every rotation expression.',
    prereqs: ['t0_m02_trigonometry', 't0_m03_python_scicomp'],
    hours: 50,
    topics: [
      'vectors, dot and cross products, norms, projections',
      'matrix multiplication as composition of maps',
      'identity, inverse, transpose',
      'Gaussian elimination and LU factorisation',
      'rank, null space, column space',
      'linear independence and basis',
      'determinant and its geometric meaning',
      'change of basis between reference frames',
      'orthogonality, Gram-Schmidt, QR',
      'skew-symmetric matrices and the cross-product matrix',
    ],
    objectives: [
      'Read a matrix as a linear map, not a table of numbers',
      'Compute and interpret null space and rank for a sensor geometry',
      'Construct a change-of-basis matrix between two reference frames',
      'Write the cross-product matrix and connect it to rotation',
    ],
    resources: [
      {
        title: 'Essence of Linear Algebra',
        author: '3Blue1Brown',
        kind: 'video',
        url: 'https://www.3blue1brown.com/topics/linear-algebra',
        free: true,
        note: 'Watch the whole series first. It installs the geometric picture that the rest of the module formalises.',
      },
      {
        title: '18.06 Linear Algebra (Spring 2010)',
        author: 'Gilbert Strang — MIT OCW',
        kind: 'course',
        url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/',
        free: true,
        note: '35 lecture videos. The 18.06SC Scholar version adds 36 TA problem-solving sessions.',
      },
      { title: 'Introduction to Linear Algebra', author: 'Gilbert Strang', kind: 'book', free: false },
      {
        title: 'EE263 Introduction to Linear Dynamical Systems',
        author: 'Stanford',
        kind: 'course',
        free: true,
        note: 'As of Fall 2025 split into EE263 (matrix methods and SVD) and EE363 (linear dynamical systems). The notes are the best GNC-shaped treatment anywhere.',
      },
    ],
    exercises: [
      {
        id: 'ex_gauss_pivot',
        title: 'Gaussian elimination with partial pivoting',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: [
          'Write the solver yourself once, so you know what `numpy.linalg.solve` is doing and why it pivots.',
          '',
          'Implement `solve_lin(A, b)` using Gaussian elimination with **partial pivoting** and back substitution.',
          'Do not call `np.linalg.solve`, `np.linalg.inv`, or `scipy.linalg` anywhere in the implementation.',
          '',
          'Then answer in a comment: construct a 2×2 system where *skipping* the pivot loses most of the significant digits,',
          'and explain in one sentence why pivoting fixes it.',
        ].join('\n'),
        starter: `import numpy as np


def solve_lin(A: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Solve A x = b by Gaussian elimination with partial pivoting.

    Parameters
    ----------
    A : (n, n) array
    b : (n,)   array

    Returns
    -------
    (n,) array x such that A @ x == b to within round-off.

    Raises
    ------
    ValueError if A is singular to working precision.
    """
    A = np.array(A, dtype=float, copy=True)
    b = np.array(b, dtype=float, copy=True)
    n = A.shape[0]
    # TODO: for each column k, swap in the row with the largest |A[k:, k]|,
    #       eliminate below the pivot, then back-substitute.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'matches numpy on a well-conditioned system',
            assert: `import numpy as np
rng = np.random.default_rng(0)
A = rng.normal(size=(6, 6)) + 6 * np.eye(6)
b = rng.normal(size=6)
assert np.allclose(solve_lin(A, b), np.linalg.solve(A, b), rtol=1e-10, atol=1e-12)`,
          },
          {
            name: 'requires pivoting: zero leading pivot',
            assert: `import numpy as np
A = np.array([[0.0, 1.0], [1.0, 0.0]])
b = np.array([2.0, 3.0])
assert np.allclose(solve_lin(A, b), np.array([3.0, 2.0]))`,
          },
          {
            name: 'singular matrix is rejected',
            hidden: true,
            assert: `import numpy as np
A = np.array([[1.0, 2.0], [2.0, 4.0]])
try:
    solve_lin(A, np.array([1.0, 2.0]))
except ValueError:
    pass
else:
    raise AssertionError("a singular matrix must raise ValueError")`,
          },
        ],
      },
      {
        id: 'ex_skew_matrix',
        title: 'The cross-product matrix',
        kind: 'code',
        lang: 'python',
        hours: 1.5,
        prompt: [
          'Implement `skew(v)` returning the 3×3 matrix `[v×]` such that `skew(a) @ b == np.cross(a, b)` for all a, b.',
          '',
          'Then verify numerically, for random vectors:',
          '- `skew(a).T == -skew(a)` (skew-symmetry),',
          '- `skew(a) @ a == 0` (a vector cannot rotate about itself),',
          '- `skew(a) @ skew(b) - skew(b) @ skew(a) == skew(np.cross(a, b))` (the so(3) Lie bracket).',
        ].join('\n'),
        starter: `import numpy as np


def skew(v: np.ndarray) -> np.ndarray:
    """Return the 3x3 cross-product (skew-symmetric) matrix of a 3-vector.

    skew(v) @ w == np.cross(v, w) for every w.
    """
    # TODO: lay out the entries. Row 0 is [0, -v2, v1].
    raise NotImplementedError
`,
        tests: [
          {
            name: 'skew(a) @ b equals a x b',
            assert: `import numpy as np
rng = np.random.default_rng(3)
for _ in range(20):
    a, b = rng.normal(size=3), rng.normal(size=3)
    assert np.allclose(skew(a) @ b, np.cross(a, b))`,
          },
          {
            name: 'skew-symmetry and self-annihilation',
            assert: `import numpy as np
a = np.array([1.0, -2.0, 0.5])
assert np.allclose(skew(a).T, -skew(a))
assert np.allclose(skew(a) @ a, np.zeros(3))`,
          },
          {
            name: 'the so(3) Lie bracket identity',
            hidden: true,
            assert: `import numpy as np
rng = np.random.default_rng(11)
a, b = rng.normal(size=3), rng.normal(size=3)
assert np.allclose(skew(a) @ skew(b) - skew(b) @ skew(a), skew(np.cross(a, b)))`,
          },
        ],
      },
      {
        id: 'ex_frame_orthonormal',
        title: 'Build and audit a body-to-inertial rotation matrix',
        kind: 'code',
        lang: 'python',
        hours: 2,
        prompt: [
          'Build `R_IB`, the matrix that takes a vector expressed in body coordinates to inertial coordinates, from a 3-2-1',
          '(yaw-pitch-roll) Euler sequence.',
          '',
          'Then write `is_rotation(R, tol)` that checks the two defining properties: `R.T @ R == I` and `det(R) == +1`.',
          'Feed it a deliberately corrupted matrix (scale one column by 1.001) and confirm the audit catches it.',
          '',
          'Success: round-tripping a random vector through `R_IB` and `R_IB.T` returns it to within 1e-12, and',
          '`is_rotation` rejects the corrupted matrix at tol = 1e-9.',
        ].join('\n'),
        starter: `import numpy as np


def dcm_from_euler321(yaw: float, pitch: float, roll: float) -> np.ndarray:
    """Body-to-inertial rotation matrix from a 3-2-1 (yaw, pitch, roll) sequence.

    R_IB = R3(yaw) @ R2(pitch) @ R1(roll), each an elementary rotation about
    the named axis. Build the three elementary matrices explicitly so the
    convention is visible in the code.
    """
    # TODO: implement the three elementary rotations and multiply them.
    raise NotImplementedError


def is_rotation(R: np.ndarray, tol: float = 1e-9) -> bool:
    """True iff R is a proper rotation: R.T @ R == I and det(R) == +1.

    This is the audit you run on every matrix that crosses a module boundary.
    """
    # TODO: check both properties against tol and return a bool.
    raise NotImplementedError
`,
      },
    ],
    cards: [
      {
        id: 'c_dot_def',
        front: 'Define the dot product two ways.',
        back: 'a·b = Σᵢ aᵢbᵢ  =  |a||b| cos θ. Zero means orthogonal.',
        formula: true,
      },
      {
        id: 'c_projection',
        front: 'Projection of b onto a?',
        back: 'proj_a(b) = ((a·b)/(a·a)) a. The residual b − proj_a(b) is orthogonal to a — the whole idea behind least squares.',
        formula: true,
      },
      {
        id: 'c_rotation_props',
        front: 'Two defining properties of a rotation matrix R ∈ SO(3).',
        back: 'RᵀR = I (orthonormal columns) and det R = +1 (no reflection). Together they give R⁻¹ = Rᵀ.',
        formula: true,
      },
      {
        id: 'c_skew_def',
        front: 'Write the cross-product matrix [a×].',
        back: '[a×] = [[0, −a₃, a₂], [a₃, 0, −a₁], [−a₂, a₁, 0]], so that [a×]b = a × b.',
        formula: true,
      },
      {
        id: 'c_skew_transpose',
        front: 'What is [a×]ᵀ, and why?',
        back: '[a×]ᵀ = −[a×]. The matrix is skew-symmetric because the cross product is antisymmetric: a × b = −b × a.',
        formula: true,
      },
      {
        id: 'c_rank_nullity',
        front: 'State the rank-nullity theorem.',
        back: 'For A with n columns: rank(A) + dim null(A) = n. Rank counts independent measurements; the null space counts directions you cannot see.',
        formula: true,
      },
      {
        id: 'c_det_geometry',
        front: 'Geometric meaning of the determinant?',
        back: 'The signed factor by which the map scales volume. det = 0 means the map collapses a dimension (singular); a negative determinant means the map also mirrors.',
      },
      {
        id: 'c_transpose_product',
        front: '(AB)ᵀ = ?   (AB)⁻¹ = ?',
        back: '(AB)ᵀ = BᵀAᵀ and (AB)⁻¹ = B⁻¹A⁻¹ — both reverse the order.',
        formula: true,
      },
      {
        id: 'c_frame_chain',
        front: 'How do you chain frame rotations written as R_A^B?',
        back: 'Adjacent indices cancel: R_C^A = R_C^B R_B^A. Read right to left, and check that the inner labels match before you multiply.',
        formula: true,
      },
      {
        id: 'c_qr',
        front: 'What is the QR factorisation and what is Q good for?',
        back: 'A = QR with Q having orthonormal columns and R upper triangular. Q comes from Gram-Schmidt; because Q preserves the 2-norm, solving least squares through QR avoids squaring the condition number.',
        formula: true,
      },
      {
        id: 'c_pivoting_why',
        front: 'Why does Gaussian elimination use partial pivoting?',
        back: 'Dividing by a tiny pivot amplifies round-off into the multipliers. Swapping in the largest magnitude entry of the column bounds those multipliers by 1 and keeps the elimination numerically stable.',
      },
      {
        id: 'c_norms',
        front: 'Define the 2-norm and the infinity-norm of a vector.',
        back: '‖x‖₂ = √(Σ xᵢ²) — energy or distance. ‖x‖∞ = maxᵢ|xᵢ| — the worst single channel, used for actuator limits.',
        formula: true,
      },
      {
        id: 'c_orthogonal_preserves',
        front: 'What does an orthogonal matrix preserve?',
        back: 'Lengths and angles: ‖Qx‖₂ = ‖x‖₂ and (Qx)·(Qy) = x·y. This is why changing frames never changes a physical magnitude.',
        formula: true,
      },
    ],
    quiz: [
      {
        id: 'q_rot_inverse',
        q: 'Which property of a rotation matrix makes R⁻¹ = Rᵀ true?',
        choices: [
          'Its columns form an orthonormal set, so RᵀR = I',
          'Its determinant is +1',
          'It is symmetric',
          'Its eigenvalues all have magnitude 1',
        ],
        answer: 0,
        explain:
          'Orthonormal columns mean entry (i,j) of RᵀR is the dot product of columns i and j, which is δᵢⱼ. Hence RᵀR = I and Rᵀ is the inverse. det R = +1 only rules out reflections (which also satisfy RᵀR = I but have det = −1), and rotation matrices are emphatically not symmetric in general.',
        b: -0.4,
        bloom: 'understand',
      },
      {
        id: 'q_rank_sensor',
        q: 'A 3×5 measurement matrix H has rank 3. What are dim(null space) and dim(column space), and what does that mean physically?',
        choices: [
          'Null space 2, column space 3: five states but only three independent measurements, so a 2-dimensional subspace of state is unobservable',
          'Null space 3, column space 2: the system is over-determined',
          'Null space 0, column space 3: the state is fully observable',
          'Null space 2, column space 5: the measurements span the whole state space',
        ],
        answer: 0,
        explain:
          'Rank-nullity with n = 5 columns gives dim null = 5 − 3 = 2, and the column space lives in R³ with dimension 3 (so it is all of measurement space). Two combinations of the state produce identically zero measurement: no estimator can resolve them without more geometry or a dynamic model.',
        b: 0.4,
        bloom: 'analyze',
      },
      {
        id: 'q_skew_transpose',
        q: 'What is [a×]ᵀ?',
        choices: ['−[a×]', '[a×]', '[a×]⁻¹', '[−a×]ᵀ = [a×]'],
        answer: 0,
        explain:
          'The cross-product matrix is skew-symmetric, so its transpose is its negative. Equivalently [a×]ᵀb = −a × b = b × a, which is exactly the antisymmetry of the cross product. Note [a×] is singular (a is in its null space), so the inverse does not exist.',
        b: -0.5,
        bloom: 'recall',
      },
      {
        id: 'q_frame_chain_order',
        q: 'You have R_I^B (inertial from body) and R_B^S (body from sensor). Which product gives inertial from sensor?',
        choices: [
          'R_I^S = R_I^B R_B^S',
          'R_I^S = R_B^S R_I^B',
          'R_I^S = (R_I^B)ᵀ R_B^S',
          'R_I^S = R_I^B (R_B^S)ᵀ',
        ],
        answer: 0,
        explain:
          'Written with matching inner labels, R_I^B R_B^S consumes the B label and leaves I from S. Reversing the order is the single most common frame bug in flight code, and it is silent: both products are valid 3×3 matrices.',
        b: 0.3,
        bloom: 'apply',
      },
    ],
    tags: ['math', 'foundations', 'interview'],
    importance: 1.2,
  },

  {
    id: 't0_m05_linear_algebra_2',
    track: 'foundations',
    tier: 0,
    title: 'Linear Algebra II: Eigen, SVD, Least Squares',
    summary:
      'The machinery estimation and control actually run on: eigenvalues for stability, the matrix exponential for state transition, SVD for observability and rank-deficient least squares, and positive definiteness for every covariance matrix you will ever debug.',
    prereqs: ['t0_m04_linear_algebra_1'],
    hours: 45,
    topics: [
      'eigenvalues, eigenvectors, diagonalisation',
      'similarity transforms',
      'the matrix exponential and the state transition matrix',
      'symmetric matrices and the spectral theorem',
      'positive definiteness and quadratic forms',
      'singular value decomposition',
      'pseudoinverse and rank deficiency',
      'condition number',
      'least squares: normal equations vs QR vs SVD',
      'Cholesky factorisation',
      'matrix calculus: gradients and Jacobians',
    ],
    objectives: [
      'Explain why a covariance matrix must be symmetric positive semi-definite',
      'Compute a least-squares solution three ways and say which is numerically safest',
      'Interpret the condition number of an observability or information matrix',
      'Compute e^(At) and connect eigenvalues to stability',
    ],
    resources: [
      {
        title: 'Essence of Linear Algebra, chapters 10-15',
        author: '3Blue1Brown',
        kind: 'video',
        url: 'https://www.3blue1brown.com/topics/linear-algebra',
        free: true,
      },
      {
        title: '18.06 Linear Algebra, lectures 21-33',
        author: 'Gilbert Strang — MIT OCW',
        kind: 'course',
        url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/',
        free: true,
      },
      {
        title: 'EE263 lecture notes: SVD, pseudoinverse, least squares',
        author: 'Stephen Boyd — Stanford',
        kind: 'course',
        free: true,
        note: 'The single best treatment of least squares and the SVD for GNC purposes.',
      },
      { title: 'Linear Algebra and Learning from Data', author: 'Gilbert Strang', kind: 'book', free: false },
      {
        title: 'The Matrix Cookbook',
        author: 'Petersen & Pedersen',
        kind: 'docs',
        free: true,
        note: 'Reference card for matrix derivative identities — keep it open while deriving a Jacobian.',
      },
    ],
    exercises: [
      {
        id: 'ex_lsq_three_ways',
        title: 'Least squares three ways, and what conditioning costs you',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'Fit a degree-`d` polynomial to noisy data on a Vandermonde basis, using three methods:',
          '',
          '1. normal equations, `x = inv(A.T @ A) @ A.T @ b`',
          '2. QR, via `np.linalg.qr` and back substitution',
          '3. SVD, via `np.linalg.lstsq` or your own `V @ diag(1/s) @ U.T @ b`',
          '',
          'Sweep the degree from 3 to 15 and plot the residual and `np.linalg.cond(A)` and `np.linalg.cond(A.T @ A)`.',
          '',
          'Success: you can state the observed relationship between the two condition numbers and identify the degree at which',
          'the normal equations visibly lose accuracy while QR and SVD do not.',
        ].join('\n'),
        starter: `import numpy as np


def fit_normal(A: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Least-squares fit via the normal equations A.T A x = A.T b."""
    # TODO: form the normal equations and solve. Note where the conditioning goes.
    raise NotImplementedError


def fit_qr(A: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Least-squares fit via the reduced QR factorisation."""
    # TODO: A = Q R, then solve R x = Q.T b by back substitution.
    raise NotImplementedError


def fit_svd(A: np.ndarray, b: np.ndarray, rcond: float = 1e-12) -> np.ndarray:
    """Least-squares fit via the SVD pseudoinverse, truncating tiny singular values."""
    # TODO: U, s, Vt = np.linalg.svd(A, full_matrices=False); invert only s > rcond * s[0].
    raise NotImplementedError
`,
        tests: [
          {
            name: 'all three agree on a well-conditioned problem',
            assert: `import numpy as np
rng = np.random.default_rng(1)
t = np.linspace(-1.0, 1.0, 50)
A = np.vander(t, 4, increasing=True)
b = A @ np.array([1.0, -2.0, 0.5, 3.0]) + 1e-6 * rng.normal(size=50)
xn, xq, xs = fit_normal(A, b), fit_qr(A, b), fit_svd(A, b)
assert np.allclose(xn, xq, atol=1e-6) and np.allclose(xq, xs, atol=1e-6)`,
          },
          {
            name: 'SVD returns the minimum-norm solution when A is rank deficient',
            assert: `import numpy as np
A = np.array([[1.0, 1.0], [2.0, 2.0], [3.0, 3.0]])
b = np.array([2.0, 4.0, 6.0])
x = fit_svd(A, b)
assert np.allclose(A @ x, b, atol=1e-9)
assert abs(x[0] - x[1]) < 1e-9`,
          },
        ],
      },
      {
        id: 'ex_expm_scaling',
        title: 'Matrix exponential by scaling and squaring',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'The state transition matrix of a linear system is `Phi(t) = e^(At)`. Implement it yourself:',
          '',
          '1. Choose `s` so that `norm(A*t) / 2**s <= 0.5`.',
          '2. Evaluate the Taylor series (or a Pade approximant) of `e^(A t / 2**s)`.',
          '3. Square the result `s` times.',
          '',
          'Compare against `scipy.linalg.expm` for a stiff 2×2 system with eigenvalues −1 and −1000 and report the relative error.',
          'Explain in a comment why the naive Taylor series alone fails for that matrix.',
        ].join('\n'),
        starter: `import numpy as np


def expm_scaling_squaring(A: np.ndarray, terms: int = 18) -> np.ndarray:
    """Matrix exponential by scaling and squaring with a truncated Taylor series.

    Parameters
    ----------
    A : (n, n) array
    terms : number of Taylor terms to use on the scaled matrix

    Returns
    -------
    (n, n) array approximating expm(A).
    """
    # TODO: pick s from the matrix norm, build the series on A / 2**s,
    #       then square s times.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'diagonal matrix exponentiates elementwise',
            assert: `import numpy as np
A = np.diag([0.0, -1.0, 2.0])
assert np.allclose(expm_scaling_squaring(A), np.diag(np.exp([0.0, -1.0, 2.0])), atol=1e-10)`,
          },
          {
            name: 'matches a rotation generator: expm(skew) is a rotation',
            assert: `import numpy as np
S = np.array([[0.0, -0.3, 0.0], [0.3, 0.0, 0.0], [0.0, 0.0, 0.0]])
R = expm_scaling_squaring(S)
assert np.allclose(R.T @ R, np.eye(3), atol=1e-10)
assert abs(np.linalg.det(R) - 1.0) < 1e-10
assert abs(R[0, 0] - np.cos(0.3)) < 1e-10`,
          },
          {
            name: 'stiff system matches scipy',
            hidden: true,
            assert: `import numpy as np
from scipy.linalg import expm
A = np.array([[-1.0, 0.0], [0.0, -1000.0]]) * 0.01
assert np.allclose(expm_scaling_squaring(A), expm(A), rtol=1e-10, atol=1e-14)`,
          },
        ],
      },
      {
        id: 'ex_svd_observability',
        title: 'Singular values as observability',
        kind: 'analysis',
        hours: 2,
        prompt: [
          'Build the geometry matrix of a 2-D ranging problem: four beacons at known positions, one unknown receiver position,',
          'rows equal to the unit line-of-sight vectors from receiver to beacon.',
          '',
          '- Take the SVD and record the singular values for a well-spread beacon geometry.',
          '- Now cluster all four beacons within a 10° cone and recompute.',
          '- Plot the error ellipse implied by `(HᵀH)⁻¹` in both cases.',
          '',
          'Write up: which direction becomes unobservable in the clustered case, what happens to `cond(H)`, and the connection',
          'to geometric dilution of precision (GDOP) in GPS.',
        ].join('\n'),
      },
    ],
    cards: [
      {
        id: 'c_eig_def',
        front: 'Define an eigenvalue and eigenvector.',
        back: 'Av = λv for some v ≠ 0: the map leaves the direction of v unchanged and only scales it by λ.',
        formula: true,
      },
      {
        id: 'c_spectral_theorem',
        front: 'State the spectral theorem for real symmetric matrices.',
        back: 'A = QΛQᵀ with Q orthogonal and Λ real diagonal — a real symmetric matrix always has real eigenvalues and a full orthonormal eigenbasis.',
        formula: true,
      },
      {
        id: 'c_psd_def',
        front: 'Define positive semi-definite.',
        back: 'A is PSD iff xᵀAx ≥ 0 for all x, equivalently all its eigenvalues are ≥ 0. Positive definite replaces ≥ with > for x ≠ 0.',
        formula: true,
      },
      {
        id: 'c_cov_psd',
        front: 'Why must a covariance matrix be symmetric positive semi-definite?',
        back: 'Because for any vector a, aᵀPa = Var(aᵀx) ≥ 0 — a variance cannot be negative — and Cov(xᵢ,xⱼ) = Cov(xⱼ,xᵢ) forces symmetry.',
      },
      {
        id: 'c_cov_transform',
        front: 'How does a covariance transform under a linear map y = Ax?',
        back: 'P_y = A P_x Aᵀ. The sandwich form is what keeps the result symmetric.',
        formula: true,
      },
      {
        id: 'c_svd_def',
        front: 'Write the singular value decomposition.',
        back: 'A = UΣVᵀ with U and V orthogonal and Σ diagonal with σ₁ ≥ σ₂ ≥ … ≥ 0. Every matrix — square or not, singular or not — has one.',
        formula: true,
      },
      {
        id: 'c_pseudoinverse',
        front: 'Pseudoinverse in terms of the SVD?',
        back: 'A⁺ = VΣ⁺Uᵀ, where Σ⁺ inverts the non-zero singular values and leaves the rest at zero. x = A⁺b is the least-squares solution of minimum norm.',
        formula: true,
      },
      {
        id: 'c_condition_number',
        front: 'Define the 2-norm condition number and its rule of thumb.',
        back: 'κ₂(A) = σ_max/σ_min. You lose roughly log₁₀κ decimal digits in a solve, so κ = 10⁸ leaves ~8 of float64s ~16 digits.',
        formula: true,
      },
      {
        id: 'c_normal_eq_conditioning',
        front: 'What does forming AᵀA do to the conditioning of a least-squares problem?',
        back: 'It squares it: κ(AᵀA) = κ(A)². That is the whole argument for solving least squares by QR or SVD instead of the normal equations.',
        formula: true,
      },
      {
        id: 'c_expm_series',
        front: 'Define the matrix exponential and its role in linear systems.',
        back: 'e^(At) = Σₖ (At)ᵏ/k!, and the solution of ẋ = Ax is x(t) = e^(At)x(0). For an LTI system e^(AΔt) is the state transition matrix Φ.',
        formula: true,
      },
      {
        id: 'c_ct_stability',
        front: 'Stability condition for the continuous-time LTI system ẋ = Ax?',
        back: 'Asymptotically stable iff every eigenvalue of A has strictly negative real part. Any eigenvalue on or right of the imaginary axis kills it.',
        formula: true,
      },
      {
        id: 'c_cholesky',
        front: 'What is the Cholesky factorisation and where does GNC use it?',
        back: 'A = LLᵀ for symmetric positive definite A, at about half the cost of LU. GNC uses it for covariance square roots — sigma-point generation in a UKF, and square-root filters that keep P positive definite by construction.',
        formula: true,
      },
      {
        id: 'c_jacobian_def',
        front: 'Define the Jacobian of a vector function.',
        back: 'J_ij = ∂f_i/∂x_j — an m×n matrix for f: Rⁿ → Rᵐ. It is the best linear approximation of f at a point, and the EKF calls it H (measurement) or F (dynamics).',
        formula: true,
      },
      {
        id: 'c_quadform_grad',
        front: 'Gradient of the quadratic form xᵀAx?',
        back: '∇(xᵀAx) = (A + Aᵀ)x, which is 2Ax when A is symmetric. Also ∇(bᵀx) = b.',
        formula: true,
      },
    ],
    quiz: [
      {
        id: 'q_negative_eig_cov',
        q: 'Your filter reports a covariance matrix with a small negative eigenvalue. What happened, and what are two standard fixes?',
        choices: [
          'Round-off in the P update destroyed symmetry and positive definiteness; fix with the Joseph-form update and by symmetrising P ← (P + Pᵀ)/2, or move to a square-root / UD-factorised filter',
          'The measurement noise R was set too large; reduce R',
          'The state has become unobservable, which always produces negative eigenvalues',
          'It is harmless and can be ignored, since covariance only matters up to sign',
        ],
        answer: 0,
        explain:
          'The short-form update P = (I − KH)P is a difference of nearly equal matrices, and catastrophic cancellation can push a small eigenvalue negative. The Joseph form (I − KH)P(I − KH)ᵀ + KRKᵀ is a sum of PSD terms and stays PSD; symmetrising and square-root filtering are the other standard defences. A negative variance is never harmless — the gain computed from it is garbage.',
        b: 0.9,
        bloom: 'analyze',
      },
      {
        id: 'q_svd_rank_deficient',
        q: 'Why does the SVD pseudoinverse handle a rank-deficient A gracefully while the normal equations do not?',
        choices: [
          'Because SVD lets you discard singular values below a threshold and return the minimum-norm solution, whereas AᵀA is singular and cannot be inverted at all',
          'Because the SVD is faster than forming AᵀA',
          'Because the SVD implicitly adds regularisation to every singular value',
          'Because AᵀA is not symmetric when A is rank deficient',
        ],
        answer: 0,
        explain:
          'If A is rank deficient, AᵀA is singular and the normal equations have no unique solution. The SVD exposes the rank explicitly: zeroing the reciprocals of the tiny singular values projects the answer onto the row space and yields the minimum-norm least-squares solution. AᵀA is always symmetric, and truncation is a deliberate choice rather than automatic regularisation.',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'q_eig_stability',
        q: 'A has eigenvalues {−1, −0.1, +0.01}. Is ẋ = Ax stable, and which mode governs the long-term behaviour?',
        choices: [
          'Unstable — the +0.01 mode grows with a ~100 s time constant and eventually dominates, even though it is the slowest',
          'Stable — two of the three eigenvalues are negative, so the response decays',
          'Marginally stable — +0.01 is close enough to the axis to count as neutral',
          'Unstable, and the −1 mode dominates because it has the largest magnitude',
        ],
        answer: 0,
        explain:
          'Any eigenvalue with positive real part makes the system unstable regardless of the others. The −1 mode decays in ~1 s and the −0.1 mode in ~10 s, but the +0.01 mode grows as e^(0.01t), so after a few hundred seconds it is all you see. Slow instabilities are the dangerous kind: they look fine in a short simulation.',
        b: 0.3,
        bloom: 'analyze',
      },
      {
        id: 'q_condition_digits',
        q: 'An information matrix has condition number 1e10. Roughly how many decimal digits of accuracy survive a float64 solve?',
        choices: ['About 6', 'About 16', 'About 10', 'None — the solve fails outright'],
        answer: 0,
        explain:
          'float64 carries ~16 decimal digits and a solve loses roughly log₁₀κ = 10 of them, leaving about 6. The solve does not fail; it silently returns an answer with far less precision than you assume — which is why condition number is worth monitoring in an estimator.',
        b: 0.6,
        bloom: 'apply',
      },
    ],
    tags: ['math', 'foundations', 'interview', 'spacex-core'],
    importance: 1.3,
  },

  {
    id: 't0_m06_calculus_single',
    track: 'foundations',
    tier: 0,
    title: 'Single-Variable Calculus',
    summary:
      'Differentiate and integrate without hesitation, and master the one move that the rest of GNC is built on: linearising a nonlinear function about an operating point and knowing what the truncated terms cost you.',
    prereqs: ['t0_m02_trigonometry'],
    hours: 75,
    topics: [
      'limits and continuity',
      'the derivative: definition, chain, product and quotient rules',
      'implicit differentiation and related rates',
      'linearisation and differentials',
      'Taylor series and truncation error',
      'maxima, minima and optimisation of a scalar function',
      'the definite integral and the fundamental theorem of calculus',
      'integration by parts and substitution',
      'improper integrals',
      'separable first-order ODEs',
    ],
    objectives: [
      'Take a derivative and an integral without hesitation',
      'Linearise a nonlinear function about an operating point',
      'Estimate truncation error from a Taylor expansion',
      'Derive the ideal rocket equation from Newton second law with variable mass',
    ],
    resources: [
      {
        title: 'Essence of Calculus',
        author: '3Blue1Brown',
        kind: 'video',
        url: 'https://www.3blue1brown.com/topics/calculus',
        free: true,
      },
      {
        title: '18.01SC Single Variable Calculus',
        author: 'MIT OCW',
        kind: 'course',
        url: 'https://ocw.mit.edu/courses/18-01sc-single-variable-calculus-fall-2010/',
        free: true,
      },
      {
        title: "Paul's Online Math Notes — Calculus I & II",
        author: 'Paul Dawkins',
        kind: 'site',
        url: 'https://tutorial.math.lamar.edu',
        free: true,
      },
      {
        title: 'Calculus (RES.18-001)',
        author: 'Gilbert Strang — MIT OCW',
        kind: 'book',
        url: 'https://ocw.mit.edu/courses/res-18-001-calculus-fall-2023/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'ex_tsiolkovsky',
        title: 'Derive the ideal rocket equation',
        kind: 'derivation',
        hours: 2,
        prompt: [
          'Start from momentum conservation for a vehicle of instantaneous mass `m` expelling mass at constant effective',
          'exhaust velocity `v_e` relative to the vehicle.',
          '',
          '1. Write the momentum balance over an interval `dt` for vehicle plus expelled propellant, in an inertial frame.',
          '2. Show it reduces to `m dv/dt = −v_e dm/dt` in field-free space.',
          '3. Separate and integrate from `m_0` to `m_f` to get `Δv = v_e ln(m_0/m_f)`.',
          '4. Add a uniform gravity field along the flight direction and show the extra term is `−∫ g sin(gamma) dt`, the gravity loss.',
          '',
          'Success: step 2 is justified, not asserted — state explicitly where the `v dm` term went and why that is legitimate.',
        ].join('\n'),
      },
      {
        id: 'ex_taylor_bound',
        title: 'Third-order expansions and their error bound',
        kind: 'code',
        lang: 'python',
        hours: 2,
        prompt: [
          'Implement third-order Taylor expansions of sine and cosine about zero and measure where they stop being good enough.',
          '',
          '- `sin3(theta) = theta - theta**3/6`',
          '- `cos3(theta) = 1 - theta**2/2` (the cubic term vanishes)',
          '- `max_abs_error(fn, exact, lo, hi, n)` sweeping the interval',
          '',
          'Then report the absolute error of each at 15° and compare it to the Lagrange remainder bound `|theta|^(k+1)/(k+1)!`.',
        ].join('\n'),
        starter: `import math
from collections.abc import Callable


def sin3(theta: float) -> float:
    """Third-order Taylor expansion of sin about theta = 0."""
    # TODO: implement
    raise NotImplementedError


def cos3(theta: float) -> float:
    """Third-order Taylor expansion of cos about theta = 0."""
    # TODO: implement
    raise NotImplementedError


def max_abs_error(
    approx: Callable[[float], float],
    exact: Callable[[float], float],
    lo: float,
    hi: float,
    n: int = 1001,
) -> float:
    """Largest absolute difference between approx and exact on [lo, hi]."""
    # TODO: sample the interval and take the max of |approx - exact|.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'sin3 is accurate to better than 1e-4 at 15 degrees',
            assert: `import math
e = abs(sin3(math.radians(15.0)) - math.sin(math.radians(15.0)))
assert 0.0 < e < 1e-4`,
          },
          {
            name: 'cos3 error at 15 degrees matches the theta^4/24 bound',
            assert: `import math
th = math.radians(15.0)
e = abs(cos3(th) - math.cos(th))
assert e < th ** 4 / 24.0 + 1e-12`,
          },
          {
            name: 'error sweep grows with the interval',
            hidden: true,
            assert: `import math
small = max_abs_error(sin3, math.sin, -0.2, 0.2)
big = max_abs_error(sin3, math.sin, -1.0, 1.0)
assert big > small > 0.0`,
          },
        ],
      },
    ],
    cards: [
      {
        id: 'c_derivative_def',
        front: 'Write the limit definition of the derivative.',
        back: "f'(x) = lim_{h→0} [f(x + h) − f(x)] / h",
        formula: true,
      },
      {
        id: 'c_chain_rule',
        front: 'State the chain rule.',
        back: "d/dx f(g(x)) = f'(g(x)) · g'(x). Every EKF Jacobian is an application of this rule to a composition of frame transforms and sensor models.",
        formula: true,
      },
      {
        id: 'c_product_quotient',
        front: 'Product and quotient rules.',
        back: "(uv)' = u'v + uv';  (u/v)' = (u'v − uv')/v²",
        formula: true,
      },
      {
        id: 'c_common_derivs',
        front: 'Derivatives of sin, cos, e^x and ln x.',
        back: "d(sin x) = cos x · dx · d(cos x) = −sin x · dx · d(e^x) = e^x dx · d(ln x) = dx/x",
        formula: true,
      },
      {
        id: 'c_taylor_series',
        front: 'Write the Taylor expansion of f about x₀.',
        back: "f(x₀ + h) = f(x₀) + f'(x₀)h + f''(x₀)h²/2! + f'''(x₀)h³/3! + …",
        formula: true,
      },
      {
        id: 'c_linearization',
        front: 'Write the first-order linearisation of f about x₀ and state its error order.',
        back: "f(x) ≈ f(x₀) + f'(x₀)(x − x₀), with error O((x − x₀)²) — the Lagrange remainder is f''(ξ)(x − x₀)²/2.",
        formula: true,
      },
      {
        id: 'c_tsiolkovsky',
        front: 'State the ideal rocket (Tsiolkovsky) equation.',
        back: 'Δv = v_e ln(m₀/m_f) = Isp·g₀·ln(m₀/m_f)',
        formula: true,
      },
      {
        id: 'c_variable_mass_eom',
        front: 'Equation of motion for a rocket in field-free space.',
        back: 'm dv/dt = −v_e dm/dt, with dm/dt < 0. Thrust is T = −v_e ṁ = ṁ_prop · v_e.',
        formula: true,
      },
      {
        id: 'c_ftc',
        front: 'State the fundamental theorem of calculus.',
        back: "∫ₐᵇ f'(x) dx = f(b) − f(a), and d/dx ∫ₐˣ f(t) dt = f(x). Integration and differentiation undo each other.",
        formula: true,
      },
      {
        id: 'c_parts',
        front: 'State integration by parts.',
        back: '∫ u dv = uv − ∫ v du',
        formula: true,
      },
      {
        id: 'c_separable_ode',
        front: 'How do you solve a separable first-order ODE dy/dx = g(x)h(y)?',
        back: 'Separate to dy/h(y) = g(x)dx and integrate both sides, then apply the initial condition. The rocket equation is exactly this move.',
      },
      {
        id: 'c_time_constant',
        front: 'For ẋ = −x/τ, what is τ and how much decay has occurred after τ, 3τ, 5τ?',
        back: 'τ is the time constant: x(t) = x₀e^(−t/τ). After 1τ ≈ 63% decayed, 3τ ≈ 95%, 5τ ≈ 99.3%.',
        formula: true,
      },
      {
        id: 'c_stationary_point',
        front: "Condition for an interior extremum of f(x), and how to classify it.",
        back: "f'(x) = 0 for a stationary point; f''(x) > 0 means minimum, f''(x) < 0 maximum, f'' = 0 is inconclusive.",
        formula: true,
      },
    ],
    quiz: [
      {
        id: 'q_rocket_eq_derivation',
        q: 'In deriving Δv = v_e ln(m₀/m_f), which step is doing the real work?',
        choices: [
          'Separating m dv = −v_e dm and integrating dm/m, which is what produces the logarithm',
          'Assuming thrust is constant over the burn',
          'Neglecting the mass of the expelled propellant',
          'Applying F = ma directly to the vehicle with its instantaneous mass',
        ],
        answer: 0,
        explain:
          'The 1/m in dv = −v_e dm/m is what integrates to a logarithm — that is the entire origin of the log in rocketry. Constant thrust is not required (only constant v_e), the propellant mass is central rather than neglected, and applying F = ma naively to a variable-mass body is exactly the error the derivation avoids.',
        b: 0.0,
        bloom: 'understand',
      },
      {
        id: 'q_linearize_example',
        q: 'Linearise f(x) = x/(1 + x²) about x = 0. What is the linearisation, and roughly where does it hold to better than 1%?',
        choices: [
          'f(x) ≈ x, good to about 1% for |x| ≲ 0.1',
          'f(x) ≈ 1 + x, good to about 1% for |x| ≲ 0.5',
          'f(x) ≈ x − x², good for all |x| < 1',
          'f(x) ≈ x/2, good to about 1% for |x| ≲ 0.3',
        ],
        answer: 0,
        explain:
          "f(0) = 0 and f'(0) = 1, so f(x) ≈ x. Expanding, f(x) = x − x³ + O(x⁵), so the relative error is about x². Setting x² = 0.01 gives |x| ≈ 0.1.",
        b: 0.4,
        bloom: 'apply',
      },
      {
        id: 'q_ekf_taylor',
        q: 'Why does a first-order Taylor expansion sit at the heart of the Extended Kalman Filter, and what does it cost?',
        choices: [
          'Because the Kalman update is only optimal for linear-Gaussian systems, so the EKF linearises about the current estimate — and the neglected second-order terms bias the covariance, so a bad estimate or strong curvature makes the filter inconsistent or divergent',
          'Because linearisation makes the filter run faster, at no accuracy cost',
          'Because the first-order term is the only one that can be computed numerically',
          'Because the Gaussian assumption requires the dynamics to be exactly linear, which linearisation makes true',
        ],
        answer: 0,
        explain:
          'The Kalman recursion propagates a mean and a covariance, which is exact only under linear dynamics and Gaussian noise. The EKF keeps the recursion by replacing f and h with their Jacobians at the current estimate. The cost is real: the covariance no longer reflects the true error distribution, and with strong nonlinearity or a poor reference the filter becomes over-confident and can diverge. That is precisely the gap the UKF and particle filters address.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'q_gravity_loss_integral',
        q: 'Realised Δv falls short of the ideal rocket-equation Δv during ascent. Which integral captures the gravity loss?',
        choices: [
          '∫ g sin(γ) dt, with γ the flight-path angle above the local horizon',
          '∫ g dt, independent of attitude',
          '∫ g cos(γ) dt',
          '∫ (T/m) dt, the thrust-acceleration integral',
        ],
        answer: 0,
        explain:
          'Only the component of gravity along the velocity vector removes speed, and that component is g sin γ. Flying flat (γ → 0) drives gravity loss toward zero, which is exactly why a gravity turn pitches over as early as structural loads allow. ∫(T/m)dt is the ideal Δv itself, not a loss.',
        b: 0.7,
        bloom: 'analyze',
      },
    ],
    tags: ['math', 'foundations'],
  },

  {
    id: 't0_m07_calculus_multi',
    track: 'foundations',
    tier: 0,
    title: 'Multivariable & Vector Calculus',
    summary:
      'Differentiate vector functions of vectors. You will build the Jacobian of a real sensor model — literally the H matrix of an EKF — and express gravitational acceleration as the gradient of a potential.',
    prereqs: ['t0_m06_calculus_single', 't0_m04_linear_algebra_1'],
    hours: 70,
    topics: [
      'partial derivatives',
      'gradient and directional derivative',
      'Jacobian and Hessian',
      'chain rule for vector functions',
      'multiple integrals',
      'line and surface integrals',
      'divergence, curl, Laplacian',
      'divergence and Stokes theorems',
      'conservative fields and potential functions',
      'vector-valued functions of time, arc length, curvature',
    ],
    objectives: [
      'Compute the Jacobian of a nonlinear measurement model',
      'Express gravitational acceleration as the gradient of a potential',
      'Differentiate a vector expressed in a rotating frame',
      'Read the Hessian of an optimisation problem as a statement about the local solution',
    ],
    resources: [
      {
        title: '18.02SC Multivariable Calculus',
        author: 'Denis Auroux — MIT OCW',
        kind: 'course',
        url: 'https://ocw.mit.edu/courses/18-02sc-multivariable-calculus-fall-2010/',
        free: true,
      },
      {
        title: 'Multivariable Calculus',
        author: 'Khan Academy (content by Grant Sanderson)',
        kind: 'course',
        url: 'https://www.khanacademy.org/math/multivariable-calculus',
        free: true,
      },
      {
        title: "Paul's Online Math Notes — Calculus III",
        author: 'Paul Dawkins',
        kind: 'site',
        url: 'https://tutorial.math.lamar.edu',
        free: true,
      },
      { title: 'Div, Grad, Curl, and All That', author: 'H. M. Schey', kind: 'book', free: false },
    ],
    exercises: [
      {
        id: 'ex_range_jacobian',
        title: 'Jacobian of a range / range-rate measurement',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'A ground station at fixed ECI position `r_s` measures range `rho = ||r - r_s||` and range-rate',
          '`rhodot = (r - r_s) . v / rho` of a satellite with state `[r, v]`.',
          '',
          'Derive and implement `H(r, v, r_s)` returning the 2×6 measurement Jacobian `d[rho, rhodot] / d[r, v]`.',
          'Validate every entry against a central finite difference with step 1e-4 and confirm agreement to ~1e-7 relative.',
          '',
          'This matrix is the `H` of an orbit-determination EKF. Getting it wrong is the classic reason a filter diverges',
          'while every individual component unit-tests clean.',
        ].join('\n'),
        starter: `import numpy as np


def measurement(r: np.ndarray, v: np.ndarray, r_s: np.ndarray) -> np.ndarray:
    """Return [range, range_rate] for satellite state (r, v) and station r_s."""
    # TODO: implement rho and rhodot.
    raise NotImplementedError


def measurement_jacobian(r: np.ndarray, v: np.ndarray, r_s: np.ndarray) -> np.ndarray:
    """Analytic 2x6 Jacobian d[rho, rhodot] / d[r, v].

    Row 0: d rho / d r  = unit line-of-sight (transposed);  d rho / d v = 0.
    Row 1: d rhodot / d r and d rhodot / d v -- derive these by hand first.
    """
    # TODO: implement the analytic partials. Do not finite-difference here.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'range row is the unit line-of-sight, with zero velocity partials',
            assert: `import numpy as np
r = np.array([7000.0, 100.0, -200.0])
v = np.array([0.5, 7.4, 0.1])
rs = np.array([6378.0, 0.0, 0.0])
H = measurement_jacobian(r, v, rs)
d = r - rs
assert H.shape == (2, 6)
assert np.allclose(H[0, :3], d / np.linalg.norm(d))
assert np.allclose(H[0, 3:], np.zeros(3))`,
          },
          {
            name: 'analytic Jacobian matches central differences',
            assert: `import numpy as np
r = np.array([7000.0, 100.0, -200.0])
v = np.array([0.5, 7.4, 0.1])
rs = np.array([6378.0, 0.0, 0.0])
x = np.concatenate([r, v])
H = measurement_jacobian(r, v, rs)
Hn = np.zeros((2, 6))
for j in range(6):
    e = np.zeros(6)
    e[j] = 1e-4
    hp = measurement(*np.split(x + e, 2), rs)
    hm = measurement(*np.split(x - e, 2), rs)
    Hn[:, j] = (hp - hm) / (2e-4)
assert np.allclose(H, Hn, rtol=1e-6, atol=1e-9)`,
          },
          {
            name: 'range-rate partial with respect to velocity is the unit line-of-sight',
            hidden: true,
            assert: `import numpy as np
r = np.array([7000.0, 100.0, -200.0])
v = np.array([0.5, 7.4, 0.1])
rs = np.array([6378.0, 0.0, 0.0])
d = r - rs
H = measurement_jacobian(r, v, rs)
assert np.allclose(H[1, 3:], d / np.linalg.norm(d))`,
          },
        ],
      },
      {
        id: 'ex_j2_gradient',
        title: 'J2 acceleration as the gradient of a potential',
        kind: 'derivation',
        hours: 3,
        prompt: [
          'The second zonal term of the geopotential is',
          '',
          '```',
          'U_J2 = (mu J2 Re^2 / (2 r^3)) (3 sin^2(phi) - 1),   sin(phi) = z / r',
          '```',
          '',
          '1. Rewrite `U_J2` purely in Cartesian `(x, y, z)` and `r = sqrt(x^2+y^2+z^2)`.',
          '2. Take `a = -grad(U_J2)` component by component. Keep every chain-rule term.',
          '3. Show you arrive at the standard result',
          '   `a = (3/2) J2 mu Re^2 / r^4 * [ (x/r)(5 z^2/r^2 - 1), (y/r)(5 z^2/r^2 - 1), (z/r)(5 z^2/r^2 - 3) ]`.',
          '4. Evaluate its magnitude at 400 km altitude over the equator and over the pole, and compare to the',
          '   two-body term mu/r^2.',
          '',
          'Success: the sign and the −3 vs −1 in the z component both fall out of your algebra rather than being copied.',
        ].join('\n'),
      },
    ],
    cards: [
      {
        id: 'c_gradient_def',
        front: 'Define the gradient and state its geometric meaning.',
        back: '∇f = [∂f/∂x₁, …, ∂f/∂xₙ]ᵀ. It points in the direction of steepest ascent, with magnitude equal to that steepest slope, and is normal to the level set of f.',
        formula: true,
      },
      {
        id: 'c_directional_deriv',
        front: 'Directional derivative of f along a unit vector u?',
        back: 'D_u f = ∇f · u = ‖∇f‖ cos θ. It is maximal along ∇f and zero along the level set.',
        formula: true,
      },
      {
        id: 'c_hessian',
        front: 'Define the Hessian and state what positive definiteness at a stationary point means.',
        back: 'H_ij = ∂²f/∂xᵢ∂xⱼ. At a point where ∇f = 0, H ≻ 0 certifies a strict local minimum; H indefinite means a saddle.',
        formula: true,
      },
      {
        id: 'c_vector_chain',
        front: 'Chain rule for f(x(t)) with vector x?',
        back: 'df/dt = ∇f · ẋ for scalar f, and df/dt = J_f ẋ for vector f, where J_f is the Jacobian.',
        formula: true,
      },
      {
        id: 'c_range_jacobian',
        front: 'Derivative of range ρ = ‖r_sat − r_sta‖ with respect to r_sat?',
        back: '∂ρ/∂r = (r_sat − r_sta)ᵀ / ρ — the transposed unit line-of-sight vector. It is the first row of the H matrix in an orbit-determination filter.',
        formula: true,
      },
      {
        id: 'c_rangerate_jacobian',
        front: 'Derivative of range-rate ρ̇ = (Δr·Δv)/ρ with respect to velocity?',
        back: '∂ρ̇/∂v = Δrᵀ/ρ, again the unit line-of-sight. Only the component of velocity along the line of sight is observable from Doppler.',
        formula: true,
      },
      {
        id: 'c_conservative',
        front: 'Three equivalent statements that a force field is conservative.',
        back: 'F = −∇U for some potential U; ∇ × F = 0 on a simply connected domain; the work ∮F·dr around any closed path is zero.',
      },
      {
        id: 'c_grav_potential',
        front: 'Two-body gravitational potential and the acceleration derived from it.',
        back: 'U = −μ/r, so a = −∇U = −μ r̂/r² = −μ r/r³.',
        formula: true,
      },
      {
        id: 'c_divergence_curl',
        front: 'Define divergence and curl of a vector field.',
        back: '∇·F = ∂F₁/∂x + ∂F₂/∂y + ∂F₃/∂z — net outflow per unit volume. ∇×F measures local circulation; it is zero for any gradient field.',
        formula: true,
      },
      {
        id: 'c_laplacian_gravity',
        front: 'What does ∇²U = 0 say about the gravity field outside a body?',
        back: "Laplace's equation holds in vacuum, which is exactly why the exterior geopotential can be expanded in spherical harmonics — those are the solutions of ∇²U = 0.",
        formula: true,
      },
      {
        id: 'c_divergence_theorem',
        front: 'State the divergence theorem.',
        back: '∭_V (∇·F) dV = ∯_S F·n̂ dS — the volume integral of divergence equals the net flux through the closed bounding surface.',
        formula: true,
      },
      {
        id: 'c_curvature',
        front: 'Curvature of a trajectory in terms of velocity and acceleration.',
        back: 'κ = ‖v × a‖ / ‖v‖³, and the radius of curvature is 1/κ. Only the component of a perpendicular to v bends the path.',
        formula: true,
      },
      {
        id: 'c_energy_from_conservative',
        front: 'What does gravity being conservative buy you in orbit analysis?',
        back: 'Specific mechanical energy ε = v²/2 − μ/r is conserved on a two-body orbit, which immediately yields vis-viva and gives you a free numerical check on any propagator.',
      },
    ],
    quiz: [
      {
        id: 'q_range_partial',
        q: 'For h(x) = ‖r_sat − r_station‖, what is ∂h/∂r_sat?',
        choices: [
          'The transposed unit line-of-sight vector (r_sat − r_station)ᵀ/‖r_sat − r_station‖',
          '(r_sat − r_station)ᵀ, unnormalised',
          '2(r_sat − r_station)ᵀ',
          'The identity matrix, since range is linear in position',
        ],
        answer: 0,
        explain:
          'Write h = (ΔrᵀΔr)^(1/2); differentiating gives (1/2)(ΔrᵀΔr)^(−1/2)·2Δrᵀ = Δrᵀ/‖Δr‖. The result is a unit row vector, which makes sense dimensionally: metres of range per metre of position along the line of sight, and nothing perpendicular to it.',
        b: 0.2,
        bloom: 'apply',
      },
      {
        id: 'q_conservative_energy',
        q: 'Why does gravity being conservative matter for orbital analysis?',
        choices: [
          'It gives a scalar potential, so specific mechanical energy v²/2 − μ/r is conserved and can be used both to derive vis-viva and to check a propagator',
          'It guarantees the orbit is closed regardless of eccentricity',
          'It means the gravitational acceleration has zero magnitude at the barycentre',
          'It makes angular momentum conserved; energy conservation comes from something else',
        ],
        answer: 0,
        explain:
          'A conservative field is the gradient of a potential, so the work done is path-independent and total energy is an integral of the motion. That is the direct source of vis-viva. Orbit closure comes from the inverse-square law specifically (and fails under J2), and angular momentum conservation comes from the force being central, which is a separate property.',
        b: 0.1,
        bloom: 'understand',
      },
      {
        id: 'q_hessian_pd',
        q: 'At a solution of a trajectory-optimisation problem the Hessian of the Lagrangian is positive definite on the tangent space of the active constraints. What does that certify?',
        choices: [
          'That the point is a strict local minimum — second-order sufficiency is met, though global optimality is still not implied for a nonconvex problem',
          'That the point is the global minimum',
          'That the constraints are inactive at the solution',
          'That the problem is convex',
        ],
        answer: 0,
        explain:
          'Together with the first-order KKT conditions, positive definiteness of the reduced Hessian is the second-order sufficient condition for a strict local minimiser. It says nothing about other basins: only convexity (or an exhaustive global method) gives you global optimality, which is precisely the argument for convexifying landing guidance.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'q_gradient_level_set',
        q: 'What is the relationship between ∇f at a point and the level set of f through that point?',
        choices: [
          '∇f is normal to the level set',
          '∇f is tangent to the level set',
          '∇f is zero on every level set',
          '∇f is parallel to the level set only when f is linear',
        ],
        answer: 0,
        explain:
          'Moving along a level set leaves f unchanged, so the directional derivative along any tangent direction is zero: ∇f·t = 0 for every tangent t. The gradient is therefore normal to the level set — which is why gravity (the gradient of a potential) is perpendicular to the geoid.',
        b: -0.1,
        bloom: 'understand',
      },
    ],
    tags: ['math', 'foundations'],
  },

  {
    id: 't0_m08_odes',
    track: 'foundations',
    tier: 0,
    title: 'Differential Equations & Laplace Transforms',
    summary:
      'Move fluently between the time domain, the Laplace domain and state space. You will read damping ratio and natural frequency straight off a pole pair and predict overshoot and settling time before running a simulation.',
    prereqs: ['t0_m07_calculus_multi', 't0_m05_linear_algebra_2'],
    hours: 70,
    topics: [
      'first-order ODEs: separable, linear, integrating factor',
      'second-order linear constant-coefficient ODEs and the characteristic equation',
      'the damped oscillator: natural frequency and damping ratio',
      'forced response and resonance',
      'systems of first-order ODEs and state-space form',
      'matrix exponential solution',
      'Laplace transform, inverse transform, partial fractions',
      'initial and final value theorems',
      'transfer functions',
      'convolution and impulse response',
      'stability from pole locations',
      'phase-plane basics',
    ],
    objectives: [
      'Convert any n-th order ODE into first-order state-space form',
      'Read ζ and ωₙ off a pole pair and predict overshoot and settling time',
      'Move fluently between time domain, Laplace domain and state space',
      'Identify stability directly from pole locations',
    ],
    resources: [
      {
        title: '18.03SC Differential Equations',
        author: 'Arthur Mattuck — MIT OCW',
        kind: 'course',
        url: 'https://ocw.mit.edu/courses/18-03sc-differential-equations-fall-2011/',
        free: true,
      },
      {
        title: "Paul's Online Math Notes — Differential Equations",
        author: 'Paul Dawkins',
        kind: 'site',
        url: 'https://tutorial.math.lamar.edu',
        free: true,
      },
      {
        title: 'Differential equations series',
        author: '3Blue1Brown',
        kind: 'video',
        url: 'https://www.3blue1brown.com/topics/differential-equations',
        free: true,
      },
      { title: 'Elementary Differential Equations', author: 'Boyce & DiPrima', kind: 'book', free: false },
    ],
    exercises: [
      {
        id: 'ex_smd_sweep',
        title: 'Damping ratio sweep of a second-order system',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'Implement the unit-step response of the canonical second-order system',
          '',
          '```',
          'ydd + 2 zeta wn yd + wn^2 y = wn^2 u,   y(0) = yd(0) = 0',
          '```',
          '',
          'analytically for all three damping regimes, then overlay the responses for zeta = 0.1, 0.707, 1.0 and 2.0.',
          '',
          'Measure percent overshoot and 2% settling time numerically from your own traces and compare to the textbook',
          'formulas `PO = 100 exp(-pi zeta / sqrt(1 - zeta^2))` and `ts ~ 4/(zeta wn)`. Report the discrepancy for zeta = 0.707.',
        ].join('\n'),
        starter: `import math


def second_order_step(zeta: float, wn: float, t: float) -> float:
    """Unit-step response of ydd + 2 zeta wn yd + wn^2 y = wn^2 u at time t.

    Handle all three regimes explicitly:
      zeta < 1  underdamped   -- decaying sinusoid about 1
      zeta == 1 critically damped
      zeta > 1  overdamped    -- two real exponentials

    Returns y(t) with y(0) = 0 and dy/dt(0) = 0.
    """
    # TODO: implement each branch. For the overdamped case the roots are
    #       s = -zeta*wn +/- wn*sqrt(zeta**2 - 1).
    raise NotImplementedError
`,
        tests: [
          {
            name: 'starts at zero for every damping ratio',
            assert: `for z in (0.1, 0.707, 1.0, 2.0):
    assert abs(second_order_step(z, 3.0, 0.0)) < 1e-12`,
          },
          {
            name: 'settles to the unit step',
            assert: `for z in (0.1, 0.707, 1.0, 2.0):
    assert abs(second_order_step(z, 3.0, 200.0) - 1.0) < 1e-6`,
          },
          {
            name: 'peak overshoot matches the analytic formula at zeta = 0.1',
            assert: `import math
wn = 2.0
ts = [i * 0.001 for i in range(0, 20001)]
peak = max(second_order_step(0.1, wn, t) for t in ts)
po = math.exp(-math.pi * 0.1 / math.sqrt(1.0 - 0.01))
assert abs(peak - (1.0 + po)) < 2e-3`,
          },
          {
            name: 'critically damped response never overshoots',
            hidden: true,
            assert: `ts = [i * 0.002 for i in range(0, 5001)]
assert max(second_order_step(1.0, 2.0, t) for t in ts) <= 1.0 + 1e-9`,
          },
        ],
      },
      {
        id: 'ex_laplace_by_hand',
        title: 'Laplace transform a second-order system by hand',
        kind: 'derivation',
        hours: 2,
        prompt: [
          'For `ydd + 3 yd + 2 y = u(t)` with `y(0) = 1`, `yd(0) = 0` and `u` a unit step:',
          '',
          '1. Transform both sides, carrying the initial-condition terms explicitly.',
          '2. Solve for `Y(s)` and split it into the zero-input and zero-state parts.',
          '3. Do the partial-fraction expansion and invert to get `y(t)` in closed form.',
          '4. Verify the pole locations and the final value numerically (`scipy.signal` or a direct integration).',
          '',
          'Success: your closed-form `y(t)` matches a numerical integration to 1e-9, and you can state what the final value',
          'theorem predicts and why it is legitimate here.',
        ].join('\n'),
      },
    ],
    cards: [
      {
        id: 'c_canonical_2nd',
        front: 'Write the canonical second-order system.',
        back: 'ÿ + 2ζωₙẏ + ωₙ²y = ωₙ²u, with transfer function G(s) = ωₙ²/(s² + 2ζωₙs + ωₙ²).',
        formula: true,
      },
      {
        id: 'c_pole_pair',
        front: 'Pole locations of the canonical second-order system in terms of ζ and ωₙ.',
        back: 's = −ζωₙ ± jωₙ√(1 − ζ²). The real part sets the decay rate, the imaginary part is the damped frequency ω_d.',
        formula: true,
      },
      {
        id: 'c_zeta_from_poles',
        front: 'Given poles at −σ ± jω_d, recover ζ and ωₙ.',
        back: 'ωₙ = √(σ² + ω_d²) and ζ = σ/ωₙ = cos(angle from the negative real axis).',
        formula: true,
      },
      {
        id: 'c_overshoot',
        front: 'Percent overshoot of a second-order step response?',
        back: 'PO = 100·exp(−πζ/√(1 − ζ²)). ζ = 0.707 gives ≈ 4.3%, ζ = 0.5 gives ≈ 16%, ζ = 0.1 gives ≈ 73%.',
        formula: true,
      },
      {
        id: 'c_settling_time',
        front: '2% settling time of a second-order system?',
        back: 't_s ≈ 4/(ζωₙ) — set by the real part of the pole pair alone. The 5% criterion uses 3/(ζωₙ).',
        formula: true,
      },
      {
        id: 'c_damped_freq',
        front: 'Damped natural frequency?',
        back: 'ω_d = ωₙ√(1 − ζ²), so the ringing period is 2π/ω_d.',
        formula: true,
      },
      {
        id: 'c_damping_regimes',
        front: 'Classify the response by damping ratio.',
        back: 'ζ = 0 undamped · 0 < ζ < 1 underdamped (oscillatory) · ζ = 1 critically damped (fastest without overshoot) · ζ > 1 overdamped.',
      },
      {
        id: 'c_laplace_derivative',
        front: 'Laplace transform of a derivative, with initial conditions.',
        back: 'L{ḟ} = sF(s) − f(0);  L{f̈} = s²F(s) − s f(0) − ḟ(0)',
        formula: true,
      },
      {
        id: 'c_laplace_pairs',
        front: 'Laplace transforms of 1, e^(−at), sin ωt and cos ωt.',
        back: '1 ↔ 1/s · e^(−at) ↔ 1/(s+a) · sin ωt ↔ ω/(s²+ω²) · cos ωt ↔ s/(s²+ω²)',
        formula: true,
      },
      {
        id: 'c_final_value',
        front: 'State the final value theorem and its precondition.',
        back: 'lim_{t→∞} f(t) = lim_{s→0} sF(s), valid only when all poles of sF(s) lie strictly in the open left half plane. Apply it to an unstable system and you get a confident wrong number.',
        formula: true,
      },
      {
        id: 'c_transfer_function',
        front: 'Define a transfer function.',
        back: 'G(s) = Y(s)/U(s) with all initial conditions zero — the Laplace transform of the impulse response. It only exists for LTI systems.',
        formula: true,
      },
      {
        id: 'c_state_space_companion',
        front: 'Convert ÿ + 3ẏ + 2y = u to state space with x = [y, ẏ]ᵀ.',
        back: 'A = [[0, 1], [−2, −3]], B = [0, 1]ᵀ, C = [1, 0], D = 0.',
        formula: true,
      },
      {
        id: 'c_lti_stability',
        front: 'Stability test for a continuous-time LTI system from its poles.',
        back: 'Asymptotically stable iff every pole (eigenvalue of A) has Re(s) < 0. Poles exactly on the imaginary axis are marginally stable; anything to the right is unstable.',
      },
      {
        id: 'c_convolution',
        front: 'Time-domain equivalent of multiplying transfer functions?',
        back: 'y(t) = (h * u)(t) = ∫₀ᵗ h(τ)u(t − τ)dτ. Multiplication in the s-domain is convolution in time.',
        formula: true,
      },
    ],
    quiz: [
      {
        id: 'q_poles_to_specs',
        q: 'A system has poles at −2 ± 5j. Give ζ, ωₙ, percent overshoot and 2% settling time.',
        choices: [
          'ζ ≈ 0.37, ωₙ ≈ 5.39 rad/s, PO ≈ 28%, t_s ≈ 2.0 s',
          'ζ ≈ 0.40, ωₙ ≈ 5.0 rad/s, PO ≈ 25%, t_s ≈ 5.0 s',
          'ζ ≈ 0.93, ωₙ ≈ 2.15 rad/s, PO ≈ 0%, t_s ≈ 2.0 s',
          'ζ ≈ 0.37, ωₙ ≈ 5.39 rad/s, PO ≈ 28%, t_s ≈ 0.8 s',
        ],
        answer: 0,
        explain:
          'ωₙ = √(2² + 5²) = √29 ≈ 5.39 rad/s and ζ = 2/5.39 ≈ 0.371. PO = 100exp(−π·0.371/√(1−0.371²)) ≈ 28.5%. The 2% settling time depends only on the real part: 4/(ζωₙ) = 4/2 = 2.0 s.',
        b: 0.3,
        bloom: 'apply',
      },
      {
        id: 'q_state_space_convert',
        q: 'Convert ÿ + 3ẏ + 2y = u to state space with x = [y, ẏ]ᵀ. What are A and B?',
        choices: [
          'A = [[0, 1], [−2, −3]], B = [0, 1]ᵀ',
          'A = [[0, 1], [2, 3]], B = [0, 1]ᵀ',
          'A = [[−3, −2], [1, 0]], B = [1, 0]ᵀ',
          'A = [[0, 1], [−3, −2]], B = [0, 1]ᵀ',
        ],
        answer: 0,
        explain:
          'ẋ₁ = x₂ gives the first row [0, 1]. Solving the ODE for ÿ gives ÿ = −2y − 3ẏ + u, so the second row is [−2, −3] with B = [0, 1]ᵀ. Option 4 swaps the coefficients, which is the most common slip — check it by confirming that det(sI − A) reproduces s² + 3s + 2.',
        b: 0.2,
        bloom: 'apply',
      },
      {
        id: 'q_zeta_0707',
        q: 'Why is ζ ≈ 0.707 a common design target, and when is it the wrong target for a launch vehicle?',
        choices: [
          'It gives ≈ 4% overshoot with a maximally flat closed-loop magnitude and ≈ 65° phase margin — but an ascent controller is driven by structural load (q̄α), bending-mode separation and an unstable plant, so margins and load relief set the design, not step overshoot',
          'It minimises settling time for any system, and is therefore always correct',
          'It is the value that guarantees infinite gain margin; launch vehicles need finite gain margin instead',
          'It eliminates steady-state error, which a launch vehicle does not need',
        ],
        answer: 0,
        explain:
          'ζ = 1/√2 is the Butterworth value: no resonant peak in the closed-loop magnitude, ~4.3% overshoot, and roughly 65° phase margin for the standard second-order loop. A launch vehicle is a different animal: the rigid-body plant is statically unstable, bending and slosh modes constrain the achievable bandwidth from above, and the real constraint is keeping q̄α within structural limits. Damping ratio is a by-product there, not the specification.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'q_fvt_trap',
        q: 'You apply the final value theorem to G(s) = 1/(s − 1) with a step input and get a finite answer. What went wrong?',
        choices: [
          'The precondition fails: sF(s) = 1/(s − 1) has a pole at +1, so the limit is meaningless — the true response diverges',
          'Nothing; the theorem applies to any rational transfer function',
          'The step input must be scaled to unit area first',
          'The theorem requires a strictly proper transfer function, and this one is not',
        ],
        answer: 0,
        explain:
          'The final value theorem is only valid when every pole of sF(s) is strictly in the left half plane. Here F(s) = 1/(s(s−1)) and sF(s) = 1/(s−1) has a right-half-plane pole, so the algebraic limit (−1) is a fiction: the actual response grows as e^t. Always check the pole locations before quoting a final value.',
        b: 0.9,
        bloom: 'analyze',
      },
    ],
    tags: ['math', 'control', 'interview'],
    importance: 1.2,
  },

  {
    id: 't0_m09_probability_stats',
    track: 'foundations',
    tier: 0,
    title: 'Probability & Statistics',
    summary:
      'The language of navigation. You will propagate a covariance through a linear map, model a gyro bias as a Gauss-Markov process, and size a Monte Carlo campaign to bound a tail probability with an honest confidence statement.',
    prereqs: ['t0_m06_calculus_single', 't0_m04_linear_algebra_1'],
    hours: 70,
    topics: [
      'sample spaces, conditional probability, Bayes theorem',
      'random variables, PDF and CDF',
      'expectation, variance, moments',
      'the Gaussian and multivariate Gaussian, covariance matrices, correlation',
      'linear transformations of random vectors',
      'sums of random variables and the central limit theorem',
      'white noise, random walk, Gauss-Markov processes',
      'power spectral density and autocorrelation',
      'stochastic processes and Brownian motion',
      'maximum likelihood estimation',
      'confidence intervals and hypothesis testing',
      'Monte Carlo methods and convergence rates',
      'the chi-square distribution and filter consistency testing',
    ],
    objectives: [
      'Propagate a covariance through a linear map',
      'Write down a multivariate Gaussian and interpret its 3σ ellipsoid',
      'Build a first-order Gauss-Markov noise model for a gyro bias',
      'Size a Monte Carlo campaign to bound a tail probability',
    ],
    resources: [
      {
        title: 'Stat 110: Probability',
        author: 'Joe Blitzstein — Harvard',
        kind: 'course',
        url: 'https://projects.iq.harvard.edu/stat110',
        free: true,
        note: '34 lecture videos, 250+ practice problems with solutions. The best probability course available free.',
      },
      {
        title: 'Introduction to Probability',
        author: 'Blitzstein & Hwang',
        kind: 'book',
        url: 'http://probabilitybook.net',
        free: true,
      },
      {
        title: '6.041SC Probabilistic Systems Analysis and Applied Probability',
        author: 'John Tsitsiklis — MIT OCW',
        kind: 'course',
        url: 'https://ocw.mit.edu/courses/6-041sc-probabilistic-systems-analysis-and-applied-probability-fall-2013/',
        free: true,
      },
      {
        title: 'Probability, Random Variables, and Stochastic Processes',
        author: 'Papoulis & Pillai',
        kind: 'book',
        free: false,
        note: 'Reference rather than a first read.',
      },
      {
        title: 'Introduction to Random Signals and Applied Kalman Filtering',
        author: 'Brown & Hwang',
        kind: 'book',
        free: false,
        note: 'The bridge text from probability into estimation — read its random-process chapters alongside this module.',
      },
    ],
    exercises: [
      {
        id: 'ex_gauss_ellipsoid',
        title: 'Sample a 3D Gaussian and draw its covariance ellipsoids',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'Draw 10 000 samples from a 3-D Gaussian with a deliberately correlated covariance, recover the sample covariance,',
          'and plot the 1σ, 2σ and 3σ ellipsoids over the scatter.',
          '',
          '- Generate the samples as `mu + L @ z` with `L` the Cholesky factor and `z` standard normal, then verify against',
          '  `rng.multivariate_normal`.',
          '- Build the ellipsoid from the eigen-decomposition of the covariance: axes along the eigenvectors, semi-axis',
          '  lengths k·√λᵢ.',
          '- Report what fraction of the samples fall inside the 3σ ellipsoid, and explain why it is **not** 99.73%.',
        ].join('\n'),
        starter: `import numpy as np


def sample_gaussian(mu: np.ndarray, P: np.ndarray, n: int, seed: int = 0) -> np.ndarray:
    """Draw n samples from N(mu, P) using a Cholesky factor. Shape (n, len(mu))."""
    # TODO: L = np.linalg.cholesky(P); draw standard normals; map them.
    raise NotImplementedError


def mahalanobis_sq(x: np.ndarray, mu: np.ndarray, P: np.ndarray) -> np.ndarray:
    """Squared Mahalanobis distance of each row of x from mu under P."""
    # TODO: d2 = (x - mu) @ inv(P) @ (x - mu).T, but solve rather than invert.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'sample covariance converges to the requested covariance',
            assert: `import numpy as np
P = np.array([[4.0, 1.0, 0.0], [1.0, 2.0, -0.5], [0.0, -0.5, 1.0]])
mu = np.array([1.0, -2.0, 0.5])
x = sample_gaussian(mu, P, 200000, seed=42)
assert x.shape == (200000, 3)
assert np.allclose(np.cov(x, rowvar=False), P, atol=0.05)
assert np.allclose(x.mean(axis=0), mu, atol=0.02)`,
          },
          {
            name: 'Mahalanobis distance is invariant to the correlation structure',
            assert: `import numpy as np
P = np.array([[4.0, 1.0], [1.0, 2.0]])
mu = np.zeros(2)
L = np.linalg.cholesky(P)
z = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]])
x = z @ L.T
assert np.allclose(mahalanobis_sq(x, mu, P), np.array([1.0, 1.0, 2.0]))`,
          },
          {
            name: 'three-sigma containment in 3-D is about 97 percent, not 99.7',
            hidden: true,
            assert: `import numpy as np
P = np.eye(3)
mu = np.zeros(3)
x = sample_gaussian(mu, P, 200000, seed=7)
frac = float(np.mean(mahalanobis_sq(x, mu, P) <= 9.0))
assert 0.96 < frac < 0.98`,
          },
        ],
      },
      {
        id: 'ex_gauss_markov',
        title: 'First-order Gauss-Markov gyro bias',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'A gyro bias is almost never modelled as a constant. The standard model is a first-order Gauss-Markov process',
          '`bdot = -b/T + w`, which has a finite steady-state variance and an autocorrelation that decays as `exp(-|tau|/T)`.',
          '',
          'Implement the exact discrete-time form `b[k+1] = phi b[k] + n[k]` with `phi = exp(-dt/T)` and',
          '`n ~ N(0, sigma_ss^2 (1 - phi^2))`, then:',
          '',
          '- confirm the sample variance converges to `sigma_ss^2`,',
          '- estimate the autocorrelation and confirm it hits `sigma_ss^2 / e` at lag `T`,',
          '- take `T -> infinity` and show the process degenerates into a random walk.',
        ].join('\n'),
        starter: `import numpy as np


def gauss_markov(sigma_ss: float, tau: float, dt: float, n: int, seed: int = 0) -> np.ndarray:
    """Simulate a scalar first-order Gauss-Markov process.

    Parameters
    ----------
    sigma_ss : steady-state standard deviation
    tau      : correlation time constant, seconds
    dt       : sample interval, seconds
    n        : number of samples

    Returns
    -------
    (n,) array, started from a draw of the stationary distribution so there is
    no start-up transient.
    """
    # TODO: phi = exp(-dt / tau); drive with N(0, sigma_ss**2 * (1 - phi**2)).
    raise NotImplementedError
`,
        tests: [
          {
            name: 'stationary variance matches the spec',
            assert: `import numpy as np
b = gauss_markov(0.5, 100.0, 1.0, 400000, seed=1)
assert b.shape == (400000,)
assert abs(np.std(b) - 0.5) < 0.02`,
          },
          {
            name: 'autocorrelation decays by 1/e at one time constant',
            assert: `import numpy as np
tau, dt = 100.0, 1.0
b = gauss_markov(0.5, tau, dt, 400000, seed=2)
lag = int(tau / dt)
r = float(np.mean(b[:-lag] * b[lag:]) / np.mean(b * b))
assert abs(r - np.exp(-1.0)) < 0.03`,
          },
        ],
      },
      {
        id: 'ex_cov_transform',
        title: 'Verify covariance propagation through a linear map',
        kind: 'code',
        lang: 'python',
        hours: 1.5,
        prompt: [
          'Demonstrate numerically that `Cov(Ax) = A Cov(x) Aᵀ`, which is the single most-used identity in estimation.',
          '',
          '- Draw samples from a correlated 3-D Gaussian, map them through a non-square `A` (say 2×3), and compare the',
          '  sample covariance of the output against `A P Aᵀ`.',
          '- Show what happens when `A` has a null space: the output covariance is singular, and state which direction of',
          '  the input uncertainty has been destroyed.',
          '- Write one sentence on why this identity, plus a Jacobian, *is* the EKF covariance propagation step.',
        ].join('\n'),
        starter: `import numpy as np


def propagate_covariance(A: np.ndarray, P: np.ndarray) -> np.ndarray:
    """Covariance of y = A x given the covariance P of x.

    Returns A @ P @ A.T, symmetrised to kill round-off asymmetry.
    """
    # TODO: implement, and symmetrise the result with 0.5 * (M + M.T).
    raise NotImplementedError


def sample_covariance_through(A: np.ndarray, P: np.ndarray, n: int, seed: int = 0) -> np.ndarray:
    """Empirical covariance of A x for n samples drawn from N(0, P).

    Used to confirm numerically that the analytic sandwich formula is right.
    """
    # TODO: draw samples via the Cholesky factor of P, map them through A,
    #       and return np.cov(..., rowvar=False).
    raise NotImplementedError
`,
      },
    ],
    cards: [
      {
        id: 'c_bayes',
        front: 'State Bayes theorem.',
        back: 'P(A|B) = P(B|A)P(A)/P(B). In estimation: posterior ∝ likelihood × prior.',
        formula: true,
      },
      {
        id: 'c_cov_def',
        front: 'Define the covariance matrix of a random vector.',
        back: 'P = E[(x − μ)(x − μ)ᵀ], symmetric positive semi-definite, with variances on the diagonal and covariances off it.',
        formula: true,
      },
      {
        id: 'c_cov_linear_map',
        front: 'How does covariance propagate through y = Ax + b?',
        back: 'μ_y = Aμ_x + b and P_y = A P_x Aᵀ. Replace A by a Jacobian and this becomes the EKF propagation step.',
        formula: true,
      },
      {
        id: 'c_mvn_pdf',
        front: 'Write the multivariate Gaussian density.',
        back: 'p(x) = ((2π)^(n/2)|P|^(1/2))⁻¹ · exp(−½(x−μ)ᵀP⁻¹(x−μ))',
        formula: true,
      },
      {
        id: 'c_sigma_1d',
        front: 'Containment of ±1σ, ±2σ, ±3σ for a scalar Gaussian.',
        back: '68.27%, 95.45%, 99.73%.',
        formula: true,
      },
      {
        id: 'c_sigma_3d',
        front: 'What fraction of a 3-D Gaussian lies inside the 3σ ellipsoid?',
        back: 'About 97.07%, not 99.73% — the containment probability of a k-sigma ellipsoid comes from the chi-square CDF with n degrees of freedom (2D 3σ ≈ 98.89%).',
      },
      {
        id: 'c_white_noise',
        front: 'Define white noise.',
        back: 'Zero-mean, with a flat power spectral density and autocorrelation E[w(t)w(τ)ᵀ] = Qδ(t − τ) — uncorrelated between any two distinct instants. It is a mathematical idealisation: infinite power, physically unrealisable.',
        formula: true,
      },
      {
        id: 'c_random_walk',
        front: 'How does the standard deviation of an integrated white-noise (random walk) process grow?',
        back: 'σ(t) = σ_w √t. Doubling the time only increases the uncertainty by √2 — but it never stops growing, which is why inertial navigation needs aiding.',
        formula: true,
      },
      {
        id: 'c_arw',
        front: 'What does gyro angle random walk (ARW) specify, in what units?',
        back: 'The random-walk growth of attitude error from white rate noise, quoted in °/√hr (or equivalently the rate noise PSD). Attitude error grows as σ_θ = ARW·√t.',
        formula: true,
      },
      {
        id: 'c_fogm',
        front: 'Write the first-order Gauss-Markov process and its autocorrelation.',
        back: 'ḃ = −b/T + w, with R(τ) = σ²e^(−|τ|/T). It is the standard model for gyro and accelerometer bias drift.',
        formula: true,
      },
      {
        id: 'c_mc_convergence',
        front: 'How does Monte Carlo error converge with sample count?',
        back: 'The standard error falls as σ/√N — independent of dimension. Ten times the accuracy costs a hundred times the runs.',
        formula: true,
      },
      {
        id: 'c_mc_tail_sizing',
        front: 'Rough sample count to estimate a tail probability p by direct Monte Carlo?',
        back: 'N ≈ 10…100 / p, so a 1e-4 event needs 1e5–1e6 runs for a usable relative error of √((1−p)/(Np)).',
        formula: true,
      },
      {
        id: 'c_nis',
        front: 'What is the NIS test and what distribution does it follow?',
        back: 'Normalised innovation squared: ε = ỹᵀS⁻¹ỹ, which is χ² with m degrees of freedom (m = measurement dimension) for a consistent filter. Consistently high ε means the filter is over-confident.',
        formula: true,
      },
      {
        id: 'c_clt',
        front: 'State the central limit theorem and one caveat for GNC.',
        back: 'The normalised sum of N i.i.d. finite-variance random variables converges to a Gaussian. The caveat: it says nothing useful about the far tails, which is exactly where miss-distance and load requirements live.',
      },
    ],
    quiz: [
      {
        id: 'q_imu_drift',
        q: 'A gyro has ARW 0.05 °/√hr and a bias of 0.5 °/hr treated as constant over the interval. What is the attitude error after a 600 s coast, and which term dominates?',
        choices: [
          '≈ 0.086° total: the bias contributes ≈ 0.083° and the random walk only ≈ 0.020° — bias dominates',
          '≈ 0.020°: the random walk dominates because it grows continuously',
          '≈ 0.55°: the two specs simply add',
          '≈ 0.5°: the bias spec is already the total error',
        ],
        answer: 0,
        explain:
          '600 s = 1/6 hr. The bias term grows linearly: 0.5 °/hr × (1/6) hr ≈ 0.083°. The random walk grows as √t: 0.05 °/√hr × √(1/6) ≈ 0.020°. Root-sum-squared, ≈ 0.086°. Bias dominates for anything but very short intervals — which is why the bias is a filter state rather than a constant you calibrate once.',
        b: 1.0,
        bloom: 'apply',
      },
      {
        id: 'q_mc_sizing',
        q: 'You must show P(miss distance > 50 m) < 1e-4. Roughly how many direct Monte Carlo runs does that take, and what is the alternative if it is too many?',
        choices: [
          'Order 1e5–1e6 runs to see enough tail events; alternatives are importance sampling, extreme-value fitting of the tail, or linear covariance analysis to propagate the statistics analytically',
          'About 1e4 runs — one per unit of the target probability',
          'About 100 runs, since the central limit theorem guarantees convergence',
          'Direct Monte Carlo cannot estimate tail probabilities at any sample count',
        ],
        answer: 0,
        explain:
          'To resolve a probability p you need on the order of 10–100 events in the tail, i.e. N ≈ 10/p to 100/p, so 1e5–1e6 runs at p = 1e-4. When that is infeasible the standard moves are importance sampling (bias the draws toward the tail and reweight), fitting a generalised Pareto tail, or replacing sampling with linear covariance analysis where the linearisation is defensible.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'q_fogm_params',
        q: 'A first-order Gauss-Markov bias model has σ = 0.5 °/hr and correlation time T = 100 s. What distinguishes it from a random walk?',
        choices: [
          'It is stationary: the variance saturates at σ² instead of growing without bound, and the correlation decays as e^(−|τ|/T)',
          'It has zero mean, whereas a random walk does not',
          'It is deterministic once the seed is fixed, whereas a random walk is not',
          'Nothing — a Gauss-Markov process is a random walk with a different name',
        ],
        answer: 0,
        explain:
          'The −b/T restoring term pulls the process back toward zero, giving a finite steady-state variance σ² and an exponentially decaying autocorrelation. Letting T → ∞ removes the restoring term and recovers a random walk, whose variance grows linearly in time forever. Choosing between the two models changes how a navigation filter treats long coasts.',
        b: 0.8,
        bloom: 'understand',
      },
      {
        id: 'q_cov_psd_reason',
        q: 'Why must every covariance matrix be symmetric positive semi-definite?',
        choices: [
          'Because aᵀPa = Var(aᵀx) for any a, and a variance cannot be negative; symmetry follows from Cov(xᵢ,xⱼ) = Cov(xⱼ,xᵢ)',
          'Because it has to be invertible for the Kalman gain to exist',
          'Because it is always a product of a matrix with its own transpose',
          'Because its diagonal entries are variances, which is sufficient on its own',
        ],
        answer: 0,
        explain:
          'The quadratic form aᵀPa is the variance of the scalar projection aᵀx, so it must be non-negative for every a — that is the definition of positive semi-definiteness. Symmetry follows from the definition of covariance. Note that PSD does not imply invertible: a perfectly known linear combination of states gives a singular but perfectly legal covariance.',
        b: 0.5,
        bloom: 'understand',
      },
    ],
    tags: ['math', 'estimation', 'interview', 'spacex-core'],
    importance: 1.35,
  },

  {
    id: 't0_m10_numerical_methods',
    track: 'foundations',
    tier: 0,
    title: 'Numerical Methods',
    summary:
      'Write RK4 from memory, pick an integrator on purpose rather than by habit, and use energy drift as a correctness check on an orbit propagator. Includes the complex-step trick that gives machine-precision Jacobians for free.',
    prereqs: ['t0_m08_odes', 't0_m05_linear_algebra_2', 't0_m03_python_scicomp'],
    hours: 60,
    topics: [
      'floating-point representation, machine epsilon, catastrophic cancellation',
      'root finding: bisection, Newton-Raphson, secant, and convergence rates',
      'numerical ODE integration: Euler, Heun, RK4, RK45 / Dormand-Prince',
      'adaptive step-size control',
      'Adams-Bashforth / Adams-Moulton multistep methods',
      'stiffness and implicit methods: backward Euler, BDF',
      'symplectic integrators for long orbit propagation',
      'local vs global truncation error',
      'energy drift as a correctness check',
      'interpolation: linear and cubic spline',
      'numerical differentiation and complex-step derivatives',
      'quadrature: Simpson, Gauss-Legendre',
      'conditioning and stability of linear solves, sparse matrices',
    ],
    objectives: [
      'Write RK4 from memory',
      'Choose an integrator for a given problem and justify the choice',
      'Detect and diagnose energy drift in an orbit propagator',
      'Use complex-step differentiation to get machine-precision Jacobians',
    ],
    resources: [
      {
        title: 'Numerical Recipes (3rd ed.)',
        author: 'Press, Teukolsky, Vetterling & Flannery',
        kind: 'book',
        free: false,
        note: 'Opinionated and practical; read the ODE and root-finding chapters.',
      },
      {
        title: 'Solving Ordinary Differential Equations I: Nonstiff Problems',
        author: 'Hairer, Nørsett & Wanner',
        kind: 'book',
        free: false,
        note: 'The definitive reference on Runge-Kutta theory and step-size control.',
      },
      {
        title: 'Numerical Computing with MATLAB',
        author: 'Cleve Moler',
        kind: 'book',
        url: 'https://www.mathworks.com/moler/chapters.html',
        free: true,
        note: 'The concepts transfer directly to NumPy; the exposition is unusually clear.',
      },
      {
        title: 'scipy.integrate.solve_ivp — method selection',
        kind: 'docs',
        url: 'https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'ex_integrators_scratch',
        title: 'Euler, RK4 and adaptive RK45 from scratch',
        kind: 'code',
        lang: 'python',
        hours: 5,
        prompt: [
          'Implement three fixed-signature integrators and convince yourself of their orders empirically.',
          '',
          '- `euler_step(f, t, y, h)`',
          '- `rk4_step(f, t, y, h)`',
          '- `rk45_adaptive(f, t0, y0, t1, rtol, atol)` using an embedded pair (Dormand-Prince or Cash-Karp) and the standard',
          '  step-size controller `h_new = h * safety * (tol/err)**(1/(p+1))`',
          '',
          'Then produce a log-log convergence plot of global error vs step size for Euler and RK4 on `ydot = -y` and confirm',
          'the slopes are 1 and 4.',
        ].join('\n'),
        starter: `import numpy as np
from collections.abc import Callable

State = np.ndarray
Deriv = Callable[[float, State], State]


def euler_step(f: Deriv, t: float, y: State, h: float) -> State:
    """One explicit Euler step. Global error O(h)."""
    # TODO: one line.
    raise NotImplementedError


def rk4_step(f: Deriv, t: float, y: State, h: float) -> State:
    """One classical Runge-Kutta 4 step. Global error O(h^4).

    k1 = f(t, y)
    k2 = f(t + h/2, y + h k1 / 2)
    k3 = f(t + h/2, y + h k2 / 2)
    k4 = f(t + h,   y + h k3)
    y_next = y + (h/6)(k1 + 2 k2 + 2 k3 + k4)
    """
    # TODO: implement exactly the tableau above.
    raise NotImplementedError


def integrate_fixed(
    f: Deriv, t0: float, y0: State, t1: float, h: float, stepper=rk4_step
) -> tuple[np.ndarray, np.ndarray]:
    """Fixed-step integration from t0 to t1. Returns (times, states)."""
    # TODO: step until t1, taking a short final step so you land exactly on t1.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'RK4 solves ydot = -y to high accuracy',
            assert: `import numpy as np
f = lambda t, y: -y
ts, ys = integrate_fixed(f, 0.0, np.array([1.0]), 1.0, 0.01, rk4_step)
assert abs(float(ys[-1][0]) - np.exp(-1.0)) < 1e-8`,
          },
          {
            name: 'Euler is first order: halving h halves the error',
            assert: `import numpy as np
f = lambda t, y: -y
def err(h):
    _, ys = integrate_fixed(f, 0.0, np.array([1.0]), 1.0, h, euler_step)
    return abs(float(ys[-1][0]) - np.exp(-1.0))
r = err(0.002) / err(0.001)
assert 1.8 < r < 2.2`,
          },
          {
            name: 'RK4 is fourth order: halving h cuts the error by about 16',
            hidden: true,
            assert: `import numpy as np
f = lambda t, y: -y
def err(h):
    _, ys = integrate_fixed(f, 0.0, np.array([1.0]), 1.0, h, rk4_step)
    return abs(float(ys[-1][0]) - np.exp(-1.0))
r = err(0.02) / err(0.01)
assert 13.0 < r < 19.0`,
          },
        ],
      },
      {
        id: 'ex_energy_drift',
        title: 'Energy drift over 100 revolutions',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: [
          'Propagate a circular 500 km orbit for 100 revolutions with (a) fixed-step Euler, (b) fixed-step RK4, (c) adaptive',
          'RK45 at rtol 1e-12, and (d) a second-order symplectic leapfrog, all at comparable cost.',
          '',
          'Plot specific orbital energy `eps = v^2/2 - mu/r` against time for each.',
          '',
          'Write up: which methods drift secularly, which oscillate about the true value without drifting, and why the',
          'symplectic method behaves the way it does even at a coarse step size.',
        ].join('\n'),
        starter: `import numpy as np

MU_EARTH = 398600.4418  # km^3/s^2
R_EARTH = 6378.137      # km


def two_body_deriv(t: float, y: np.ndarray) -> np.ndarray:
    """State derivative for y = [rx, ry, rz, vx, vy, vz] in km and km/s."""
    # TODO: rdot = v;  vdot = -mu r / |r|^3
    raise NotImplementedError


def specific_energy(y: np.ndarray) -> float:
    """Specific mechanical energy v^2/2 - mu/r, km^2/s^2. Constant on a true two-body orbit."""
    # TODO: implement
    raise NotImplementedError


def leapfrog(y0: np.ndarray, dt: float, n: int) -> np.ndarray:
    """Velocity-Verlet (symplectic, 2nd order) propagation of the two-body problem.

    v_half = v + a(r) dt/2 ;  r_new = r + v_half dt ;  v_new = v_half + a(r_new) dt/2
    """
    # TODO: implement the kick-drift-kick sequence.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'circular orbit energy matches -mu/(2a)',
            assert: `import numpy as np
r = R_EARTH + 500.0
v = np.sqrt(MU_EARTH / r)
y = np.array([r, 0.0, 0.0, 0.0, v, 0.0])
assert abs(specific_energy(y) + MU_EARTH / (2 * r)) < 1e-9`,
          },
          {
            name: 'leapfrog keeps energy bounded over 100 revolutions',
            assert: `import numpy as np
r = R_EARTH + 500.0
v = np.sqrt(MU_EARTH / r)
y0 = np.array([r, 0.0, 0.0, 0.0, v, 0.0])
period = 2 * np.pi * np.sqrt(r ** 3 / MU_EARTH)
dt = period / 500.0
ys = leapfrog(y0, dt, 50000)
e0 = specific_energy(y0)
drift = max(abs(specific_energy(s) - e0) for s in ys[::500])
assert drift / abs(e0) < 1e-4`,
          },
        ],
      },
      {
        id: 'ex_complex_step',
        title: 'Complex-step differentiation vs finite differences',
        kind: 'code',
        lang: 'python',
        hours: 2,
        prompt: [
          "The complex-step derivative `f'(x) ~ Im(f(x + i h))/h` has no subtractive term, so it suffers no cancellation",
          'and stays accurate down to `h = 1e-200`.',
          '',
          '- Implement `complex_step(f, x, h=1e-200)` and `central_diff(f, x, h)`.',
          '- Sweep `h` from 1e-1 to 1e-16 and plot the relative error of the central difference against the exact derivative.',
          '  Identify the V-shaped minimum near `h ~ eps**(1/3)` and label the truncation and round-off branches.',
          '- Show the complex-step result is flat and correct across the whole sweep.',
          '- Note the restriction: `f` must be analytic and implemented without `abs`, `max`, or `conj`.',
        ].join('\n'),
        starter: `import numpy as np
from collections.abc import Callable


def complex_step(f: Callable[[complex], complex], x: float, h: float = 1e-200) -> float:
    """Derivative of f at x by the complex-step method.

    f(x + i h) = f(x) + i h f'(x) - h^2 f''(x)/2 - ...
    so Im(f(x + i h)) / h = f'(x) + O(h^2), with no subtraction anywhere.
    """
    # TODO: one line.
    raise NotImplementedError


def central_diff(f: Callable[[float], float], x: float, h: float) -> float:
    """Central finite difference, error O(h^2) truncation + O(eps/h) round-off."""
    # TODO: implement
    raise NotImplementedError
`,
        tests: [
          {
            name: 'complex step is exact to machine precision on a polynomial',
            assert: `assert abs(complex_step(lambda z: z ** 3, 2.0) - 12.0) < 1e-12`,
          },
          {
            name: 'complex step works on a transcendental function',
            assert: `import numpy as np
d = complex_step(lambda z: np.exp(z) / np.sqrt(np.sin(z) ** 3 + np.cos(z) ** 3), 1.5)
assert abs(d - 4.05342789389862) < 1e-9`,
          },
          {
            name: 'central differences degrade at tiny h but complex step does not',
            hidden: true,
            assert: `import numpy as np
f = lambda x: np.exp(x)
exact = np.exp(1.0)
assert abs(central_diff(f, 1.0, 1e-14) - exact) > 1e-6
assert abs(complex_step(lambda z: np.exp(z), 1.0) - exact) < 1e-12`,
          },
        ],
      },
    ],
    cards: [
      {
        id: 'c_rk4_tableau',
        front: 'Write the classical RK4 step.',
        back: 'k₁ = f(t,y), k₂ = f(t+h/2, y+hk₁/2), k₃ = f(t+h/2, y+hk₂/2), k₄ = f(t+h, y+hk₃); y_{n+1} = y_n + (h/6)(k₁ + 2k₂ + 2k₃ + k₄)',
        formula: true,
      },
      {
        id: 'c_rk4_order',
        front: 'Local and global truncation error of RK4 and of Euler?',
        back: 'RK4: local O(h⁵), global O(h⁴). Euler: local O(h²), global O(h). Global is always one order below local because you take O(1/h) steps.',
        formula: true,
      },
      {
        id: 'c_newton_raphson',
        front: 'Newton-Raphson iteration and its convergence rate.',
        back: "x_{n+1} = x_n − f(x_n)/f'(x_n), converging quadratically near a simple root — the number of correct digits roughly doubles per iteration.",
        formula: true,
      },
      {
        id: 'c_bisection_secant',
        front: 'Convergence orders of bisection and the secant method.',
        back: 'Bisection is linear (one bit per step) but guaranteed given a sign change; secant is superlinear with order ≈ 1.618 and needs no derivative.',
      },
      {
        id: 'c_stiffness',
        front: 'What makes an ODE stiff, and what does it force you to do?',
        back: 'Widely separated time constants: an explicit method must take steps set by the fastest decaying mode for *stability*, not accuracy. Use an implicit method (backward Euler, BDF/Radau) instead.',
      },
      {
        id: 'c_symplectic',
        front: 'Why do symplectic integrators matter for long orbit propagation?',
        back: 'They exactly conserve a nearby (shadow) Hamiltonian, so energy error oscillates within a bound instead of drifting secularly — over thousands of revolutions that is the difference between a bounded wobble and a spiral.',
      },
      {
        id: 'c_euler_spiral',
        front: 'Why does fixed-step explicit Euler make a circular orbit spiral outward?',
        back: 'Its amplification factor |1 + hλ| exceeds 1 for the purely imaginary eigenvalues of an oscillatory system, so every step injects energy. The error is secular, not random.',
      },
      {
        id: 'c_step_controller',
        front: 'Standard adaptive step-size update law?',
        back: 'h_new = h · safety · (tol/err)^(1/(p+1)), with safety ≈ 0.9 and growth/shrink factors clamped (e.g. 0.2 to 5).',
        formula: true,
      },
      {
        id: 'c_complex_step',
        front: 'Write the complex-step derivative and state its advantage.',
        back: "f'(x) ≈ Im(f(x + ih))/h. There is no subtraction, so no cancellation: h can be 1e-200 and the result is accurate to machine precision. Requires analytic f with no abs/max/conj.",
        formula: true,
      },
      {
        id: 'c_fd_optimal_h',
        front: 'Optimal step size for a central finite difference, and the resulting accuracy?',
        back: 'h ≈ ε^(1/3) ≈ 6e-6 for float64, giving about ε^(2/3) ≈ 4e-11 relative accuracy — you lose a third of your digits no matter what.',
        formula: true,
      },
      {
        id: 'c_flight_integrator',
        front: 'Why is an adaptive-step integrator usually wrong inside a fixed-rate flight control loop?',
        back: 'It makes execution time data-dependent, so worst-case execution time cannot be bounded and the loop can overrun its deadline. Flight code uses a fixed-step method at the loop rate, with the step chosen offline by analysis.',
      },
      {
        id: 'c_energy_check',
        front: 'Cheapest correctness check on a two-body propagator?',
        back: 'Specific mechanical energy ε = v²/2 − μ/r and specific angular momentum h = r × v must both be constant. A secular trend in either means an integrator or force-model bug.',
        formula: true,
      },
      {
        id: 'c_simpson',
        front: "Simpson's rule and its error order.",
        back: '∫ₐᵇ f dx ≈ (h/3)[f₀ + 4f₁ + 2f₂ + … + 4f_{n−1} + f_n] with h = (b−a)/n, n even; error O(h⁴).',
        formula: true,
      },
      {
        id: 'c_cubic_spline',
        front: 'What continuity does a natural cubic spline guarantee?',
        back: 'C² — value, first and second derivative are continuous at every knot, with the second derivative set to zero at the ends. That smoothness is why splines are used for guidance reference trajectories.',
      },
    ],
    quiz: [
      {
        id: 'q_euler_spiral',
        q: 'Why does fixed-step explicit Euler cause a circular orbit to spiral outward?',
        choices: [
          'Its amplification factor has magnitude greater than 1 for the imaginary eigenvalues of oscillatory motion, so each step adds energy — a secular, one-way error',
          'Round-off accumulates randomly and happens to push outward',
          'The gravitational acceleration is evaluated at the end of the step instead of the start',
          'Because Euler conserves angular momentum but not energy, and the two are incompatible',
        ],
        answer: 0,
        explain:
          'For ẋ = λx with λ purely imaginary, explicit Euler gives |1 + hλ| = √(1 + h²ω²) > 1. The radius of the numerical solution therefore grows every step regardless of round-off. Implicit Euler has the mirror-image defect and spirals inward; symplectic leapfrog keeps the energy error bounded.',
        b: 0.6,
        bloom: 'analyze',
      },
      {
        id: 'q_flight_integrator_choice',
        q: 'A flight computer runs a fixed 100 Hz control loop. Which integrator goes in the flight code, and why is adaptive stepping usually wrong there?',
        choices: [
          'A fixed-step method (commonly RK4, sometimes RK2 or trapezoidal) at the loop rate, because adaptive stepping makes execution time data-dependent and destroys the worst-case timing guarantee the scheduler needs',
          'Adaptive RK45, because accuracy always matters more than timing',
          'Backward Euler, because implicit methods are unconditionally stable and therefore always safe',
          'Whatever the offline simulation uses, so the flight code and the sim match exactly',
        ],
        answer: 0,
        explain:
          'Real-time flight software needs a bounded, analysable worst-case execution time. An adaptive controller may take one step or twenty depending on the data, which cannot be scheduled. Fixed-step RK4 at the loop rate with the step validated offline is the standard answer. Implicit methods additionally require solving a nonlinear system each step — even worse for determinism.',
        b: 0.7,
        bloom: 'analyze',
      },
      {
        id: 'q_complex_step_benefit',
        q: 'What error does the complex-step derivative eliminate that central differences cannot?',
        choices: [
          'Subtractive cancellation: there is no difference of nearly equal numbers, so h can shrink until truncation error vanishes without round-off blowing up',
          'Truncation error, which is exactly zero for complex step',
          'The cost of evaluating the function twice',
          'The requirement that the function be differentiable',
        ],
        answer: 0,
        explain:
          'Im(f(x + ih))/h has no subtraction, so the round-off floor that forces central differences to stop at h ≈ ε^(1/3) simply is not there. Truncation error remains O(h²), but since h can be 1e-200 it is irrelevant. The price is that f must be analytic and written in complex-safe code.',
        b: 0.8,
        bloom: 'understand',
      },
      {
        id: 'q_rk4_order_check',
        q: 'You halve the step size of an RK4 propagation. By roughly what factor should the global error fall?',
        choices: ['16', '4', '2', '8'],
        answer: 0,
        explain:
          'RK4 has global error O(h⁴), so halving h gives 2⁴ = 16× less error. Measuring this ratio empirically is the standard way to confirm an integrator was implemented correctly — a measured ratio of 8 usually means one of the k-stages is wrong.',
        b: 0.1,
        bloom: 'apply',
      },
    ],
    tags: ['math', 'code', 'simulation', 'interview'],
    importance: 1.2,
  },

  {
    id: 't0_m11_optimization',
    track: 'foundations',
    tier: 0,
    title: 'Optimization',
    summary:
      'Recognise convexity on sight, put a problem into second-order-cone standard form, and explain why a landing algorithm that has to run onboard with a hard deadline wants a convex problem and an interior-point solver.',
    prereqs: ['t0_m07_calculus_multi', 't0_m05_linear_algebra_2', 't0_m10_numerical_methods'],
    hours: 80,
    topics: [
      'unconstrained optimisation: gradient descent, Newton, BFGS, line search, trust region',
      'constrained optimisation and Lagrange multipliers',
      'KKT conditions',
      'convex sets and convex functions',
      'why convexity matters: global optimum, polynomial time, certificates',
      'linear and quadratic programming',
      'second-order cone programming',
      'semidefinite programming',
      'duality and the dual problem',
      'interior-point methods',
      'sequential quadratic programming',
      'nonlinear programming solvers (IPOPT, SNOPT)',
      'modelling languages and solvers: CVXPY, ECOS, SCS, OSQP, Clarabel',
      'real-time embedded convex solvers and code generation',
    ],
    objectives: [
      'Recognise whether a problem is convex',
      'Write a problem in second-order-cone standard form',
      'State and apply the KKT conditions',
      'Use CVXPY to solve a real trajectory problem',
      'Explain why a launch vehicle wants a convex problem onboard',
    ],
    resources: [
      {
        title: 'Convex Optimization',
        author: 'Boyd & Vandenberghe',
        kind: 'book',
        url: 'https://web.stanford.edu/~boyd/cvxbook/',
        free: true,
        note: 'Free PDF. Chapters 1-5 are the core; chapter 4 has the SOCP material that landing guidance runs on.',
      },
      {
        title: 'EE364a Convex Optimization I',
        author: 'Stephen Boyd — Stanford',
        kind: 'course',
        url: 'https://web.stanford.edu/class/ee364a/',
        free: true,
        note: 'Full video lectures, slides and homework with solutions.',
      },
      {
        title: 'Numerical Optimization (2nd ed.)',
        author: 'Nocedal & Wright',
        kind: 'book',
        free: false,
        note: 'The nonconvex / NLP side: line search, trust region, SQP, interior point.',
      },
      { title: 'CVXPY documentation and examples', kind: 'docs', url: 'https://www.cvxpy.org', free: true },
    ],
    exercises: [
      {
        id: 'ex_lp_landing',
        title: 'Minimum-fuel 1-D landing as a linear program',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: [
          'Discretise a vertical landing into N steps with state `[h, v]`, control `T` (thrust acceleration), constant gravity,',
          'and constant mass (relax that later).',
          '',
          'Minimise total impulse `sum(T_k) dt` subject to:',
          '- the discretised dynamics,',
          '- `0 <= T_k <= T_max`,',
          '- terminal conditions `h_N = 0`, `v_N = 0`,',
          '- altitude never negative.',
          '',
          'Solve it in CVXPY. Then plot the optimal thrust profile and observe that it is **bang-bang**: coast, then full',
          'thrust. Explain why an LP objective produces a bang-bang solution, and what changes when you add a non-zero',
          'minimum throttle.',
        ].join('\n'),
        starter: `import cvxpy as cp
import numpy as np


def min_fuel_landing(
    h0: float, v0: float, g: float, t_max: float, n: int, dt: float
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Solve the 1-D minimum-fuel soft landing as an LP.

    Dynamics (explicit Euler is fine here):
        h[k+1] = h[k] + v[k] dt
        v[k+1] = v[k] + (T[k] - g) dt

    Returns
    -------
    (h, v, T) optimal trajectories, or raises RuntimeError if infeasible.
    """
    h = cp.Variable(n + 1)
    v = cp.Variable(n + 1)
    T = cp.Variable(n)
    # TODO: build the constraint list (dynamics, bounds, boundary conditions),
    #       set the objective to cp.Minimize(cp.sum(T) * dt), solve, and return
    #       the .value arrays.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'a feasible descent lands softly',
            assert: `import numpy as np
h, v, T = min_fuel_landing(h0=1000.0, v0=-50.0, g=9.80665, t_max=30.0, n=200, dt=0.1)
assert abs(h[-1]) < 1e-4 and abs(v[-1]) < 1e-4
assert h.min() > -1e-6
assert T.min() > -1e-6 and T.max() < 30.0 + 1e-6`,
          },
          {
            name: 'the optimal profile is bang-bang',
            assert: `import numpy as np
h, v, T = min_fuel_landing(h0=1000.0, v0=-50.0, g=9.80665, t_max=30.0, n=200, dt=0.1)
interior = np.sum((T > 0.05 * 30.0) & (T < 0.95 * 30.0))
assert interior <= 5`,
          },
        ],
      },
      {
        id: 'ex_gd_vs_newton',
        title: 'Gradient descent vs Newton on Rosenbrock',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'The Rosenbrock function `f(x,y) = (1-x)^2 + 100(y - x^2)^2` has a narrow curved valley — the standard stress test.',
          '',
          '- Implement `f`, its gradient and its exact Hessian.',
          '- Run gradient descent with backtracking line search, and Newton with the same line search, both from `(-1.2, 1.0)`.',
          '- Record the iteration counts to reach `||grad f|| < 1e-8` and overlay both paths on a contour plot.',
          '',
          'Success: Newton reaches the tolerance in a couple of dozen iterations while gradient descent needs thousands, and',
          'you can explain the difference in terms of the condition number of the Hessian in the valley.',
        ].join('\n'),
        starter: `import numpy as np


def rosenbrock(x: np.ndarray) -> float:
    """f(x, y) = (1 - x)^2 + 100 (y - x^2)^2, minimised at (1, 1) with f = 0."""
    # TODO: implement
    raise NotImplementedError


def rosenbrock_grad(x: np.ndarray) -> np.ndarray:
    """Analytic gradient. Check it against a complex-step derivative before trusting it."""
    # TODO: implement
    raise NotImplementedError


def rosenbrock_hess(x: np.ndarray) -> np.ndarray:
    """Analytic 2x2 Hessian."""
    # TODO: implement
    raise NotImplementedError


def minimize(x0: np.ndarray, use_newton: bool, tol: float = 1e-8, max_iter: int = 200000):
    """Descent with backtracking line search. Returns (x_star, n_iter)."""
    # TODO: direction is -grad (gradient descent) or -solve(H, grad) (Newton);
    #       backtrack on alpha until the Armijo condition holds.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'function and gradient agree at the optimum',
            assert: `import numpy as np
assert abs(rosenbrock(np.array([1.0, 1.0]))) < 1e-14
assert np.allclose(rosenbrock_grad(np.array([1.0, 1.0])), np.zeros(2), atol=1e-12)`,
          },
          {
            name: 'gradient matches finite differences away from the optimum',
            assert: `import numpy as np
x = np.array([-1.2, 1.0])
g = rosenbrock_grad(x)
gn = np.zeros(2)
for j in range(2):
    e = np.zeros(2); e[j] = 1e-6
    gn[j] = (rosenbrock(x + e) - rosenbrock(x - e)) / 2e-6
assert np.allclose(g, gn, rtol=1e-5)`,
          },
          {
            name: 'Newton converges in far fewer iterations than gradient descent',
            hidden: true,
            assert: `import numpy as np
x0 = np.array([-1.2, 1.0])
xn, kn = minimize(x0, use_newton=True)
xg, kg = minimize(x0, use_newton=False)
assert np.allclose(xn, np.ones(2), atol=1e-6)
assert kn < 100 and kg > 10 * kn`,
          },
        ],
      },
      {
        id: 'ex_socp_thrust',
        title: 'Put a norm-bounded thrust constraint in SOCP form',
        kind: 'derivation',
        hours: 2,
        prompt: [
          'A 3-D thruster produces a vector `u` with `u_min <= ||u||_2 <= u_max`.',
          '',
          '1. Show `||u||_2 <= u_max` is a convex set (a second-order cone slice) and write it in the standard form',
          '   `||A u + b||_2 <= c^T u + d`.',
          '2. Show `||u||_2 >= u_min` is **not** convex, by exhibiting two feasible points whose midpoint is infeasible.',
          '3. Introduce a slack `Gamma` with `||u||_2 <= Gamma` and `u_min <= Gamma <= u_max`, and state what the relaxation',
          '   costs. Look up why this relaxation is called *lossless convexification* and under what conditions the optimum',
          '   of the relaxed problem satisfies `||u|| = Gamma` exactly.',
          '',
          'Success: step 2 is a concrete counterexample with numbers, not a hand-wave.',
        ].join('\n'),
      },
    ],
    cards: [
      {
        id: 'c_convex_set',
        front: 'Define a convex set.',
        back: 'A set C where for all x, y ∈ C and θ ∈ [0,1], θx + (1−θ)y ∈ C — every segment between two points stays inside.',
        formula: true,
      },
      {
        id: 'c_convex_function',
        front: 'Define a convex function.',
        back: 'f(θx + (1−θ)y) ≤ θf(x) + (1−θ)f(y) for θ ∈ [0,1]. Twice-differentiable equivalent: ∇²f ⪰ 0 everywhere.',
        formula: true,
      },
      {
        id: 'c_why_convex',
        front: 'Three things convexity buys you.',
        back: 'Every local minimum is global; the problem is solvable in polynomial time with a known iteration bound; duality provides a certificate of optimality or of infeasibility.',
      },
      {
        id: 'c_kkt',
        front: 'State the KKT conditions.',
        back: 'For min f s.t. gᵢ ≤ 0, hⱼ = 0: stationarity ∇f + Σλᵢ∇gᵢ + Σνⱼ∇hⱼ = 0; primal feasibility; dual feasibility λᵢ ≥ 0; complementary slackness λᵢgᵢ = 0.',
        formula: true,
      },
      {
        id: 'c_multiplier_meaning',
        front: 'Physical meaning of a Lagrange multiplier on an active constraint?',
        back: 'The shadow price: the rate at which the optimal cost improves per unit relaxation of that constraint. A multiplier on a thrust bound tells you how much fuel one more newton would save.',
      },
      {
        id: 'c_socp_form',
        front: 'Write second-order cone programming standard form.',
        back: 'minimise cᵀx subject to ‖Aᵢx + bᵢ‖₂ ≤ cᵢᵀx + dᵢ for each i, and Fx = g. LP and QP are both special cases.',
        formula: true,
      },
      {
        id: 'c_thrust_convexity',
        front: 'Is ‖u‖₂ ≤ u_max convex? Is ‖u‖₂ ≥ u_min?',
        back: 'The upper bound is convex (a ball). The lower bound is not — it is the complement of a ball, and the midpoint of two opposing feasible thrust vectors is the infeasible origin.',
      },
      {
        id: 'c_lossless_convexification',
        front: 'What is lossless convexification of the minimum-throttle constraint?',
        back: 'Introduce a slack Γ with ‖u‖₂ ≤ Γ and u_min ≤ Γ ≤ u_max. The relaxed problem is an SOCP, and under stated controllability conditions its optimum provably satisfies ‖u‖ = Γ, so the relaxation is exact (Açıkmeşe & Ploen).',
      },
      {
        id: 'c_gd_newton',
        front: 'Gradient descent vs Newton step.',
        back: 'Gradient descent: x ← x − α∇f, linear convergence with rate set by the Hessian condition number. Newton: x ← x − H⁻¹∇f, quadratic local convergence, cost of a factorisation per step.',
        formula: true,
      },
      {
        id: 'c_bfgs',
        front: 'What does BFGS do?',
        back: 'Builds an approximate inverse Hessian from successive gradient differences (a rank-two update), giving near-Newton convergence without ever forming or factorising the true Hessian.',
      },
      {
        id: 'c_duality',
        front: 'State weak and strong duality.',
        back: 'Weak: d* ≤ p*, always, and the gap is a bound you can trust. Strong: d* = p*, which holds for convex problems satisfying a constraint qualification such as Slater condition.',
        formula: true,
      },
      {
        id: 'c_interior_point_flight',
        front: 'Why do flight-certifiable guidance algorithms prefer interior-point SOCP solvers to general NLP solvers?',
        back: 'An interior-point method on a convex problem converges to the global optimum in a bounded, essentially data-independent number of iterations (tens), detects infeasibility, and has no local minima to get trapped in — so you can certify the worst-case runtime for a real-time deadline.',
      },
      {
        id: 'c_lp_qp',
        front: 'Distinguish LP, QP and SOCP.',
        back: 'LP: linear objective and linear constraints. QP: convex quadratic objective, linear constraints. SOCP: linear objective with second-order cone constraints — strictly more general than both.',
      },
      {
        id: 'c_bangbang',
        front: 'Why does a minimum-fuel problem with linear cost produce a bang-bang thrust profile?',
        back: 'The optimum of a linear objective over a polytope lies at a vertex, so the control sits at a bound almost everywhere and switches when the multiplier (switching function) changes sign. Singular arcs are the exception.',
      },
    ],
    quiz: [
      {
        id: 'q_thrust_convexity',
        q: 'Is ‖u‖₂ ≤ u_max convex? Is ‖u‖₂ ≥ u_min? Why does the answer matter for rocket landing guidance?',
        choices: [
          'The upper bound is convex, the lower bound is not — and since a liquid engine cannot throttle below a minimum, the physically necessary constraint is exactly the nonconvex one, which is why lossless convexification exists',
          'Both are convex, so the landing problem is convex as written',
          'Neither is convex; landing guidance is solved by nonlinear programming only',
          'The lower bound is convex and the upper bound is not',
        ],
        answer: 0,
        explain:
          'A norm ball is convex; its complement is not. Take u = (+u_min, 0, 0) and u = (−u_min, 0, 0): both satisfy the lower bound, but their midpoint is the origin, which does not. Real engines have a minimum throttle, so the honest problem is nonconvex — and the Açıkmeşe / Ploen lossless convexification, which adds a slack variable Γ, is what makes the onboard SOCP formulation legitimate rather than merely convenient.',
        b: 1.2,
        bloom: 'analyze',
      },
      {
        id: 'q_kkt_multiplier',
        q: 'At the optimum of a fuel-optimal problem, the multiplier on an active thrust upper bound is 0.8 kg of propellant per newton. What does that mean?',
        choices: [
          'Relaxing the thrust limit by one newton would reduce the optimal propellant cost by about 0.8 kg — the constraint shadow price',
          'The constraint is inactive and can be dropped',
          'The solution violates the thrust bound by 0.8 N',
          'The optimiser has not converged, since multipliers should be zero at a solution',
        ],
        answer: 0,
        explain:
          'A Lagrange multiplier is a sensitivity: dp*/db for a constraint g ≤ b. A nonzero multiplier means the constraint is active and binding, and its size tells you how much the optimum would improve per unit of relaxation — exactly the number that justifies (or refuses) a hardware change. Complementary slackness guarantees that an inactive constraint has a zero multiplier, so a positive value means the opposite of option 2.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'q_interior_point_flight',
        q: 'Why do flight-certifiable guidance algorithms prefer interior-point SOCP solvers over general nonlinear programming solvers?',
        choices: [
          'Because a convex problem has no local minima and an interior-point method converges in a bounded, roughly data-independent number of iterations, so the worst-case runtime and the optimality of the answer can both be certified before flight',
          'Because SOCP solvers use less memory than NLP solvers',
          'Because NLP solvers cannot handle inequality constraints',
          'Because SOCP solvers can be written without floating-point arithmetic',
        ],
        answer: 0,
        explain:
          'The certification argument is about guarantees, not speed alone. An NLP solver may converge to a local minimum, stall, or take an unpredictable number of iterations — none of which can be bounded for a real-time deadline. On a convex problem an interior-point method reaches the global optimum in a small, predictable iteration count and returns an infeasibility certificate when no solution exists.',
        b: 1.1,
        bloom: 'understand',
      },
      {
        id: 'q_convexity_test',
        q: 'Which of these functions is NOT convex on its stated domain?',
        choices: [
          'f(x) = −log(x) − x² on x > 0',
          'f(x) = ‖Ax − b‖₂',
          'f(x) = max(a₁ᵀx + b₁, a₂ᵀx + b₂)',
          'f(x) = xᵀPx with P positive semi-definite',
        ],
        answer: 0,
        explain:
          "−log x is convex but −x² is concave, and their sum has f'' = 1/x² − 2, which is negative for x > 1/√2 — so the sum is not convex. Norms are convex, the pointwise maximum of affine functions is convex, and a quadratic form with PSD matrix is convex. Knowing the closure rules (nonnegative sums, max, affine composition) is faster than differentiating.",
        b: 0.9,
        bloom: 'analyze',
      },
    ],
    tags: ['math', 'guidance', 'interview', 'spacex-core'],
    importance: 1.3,
  },

  {
    id: 't0_m12_cpp',
    track: 'foundations',
    tier: 0,
    title: 'Modern C++ for Flight and Simulation',
    summary:
      'C++ is the production language of SpaceX GNC. You will write allocation-free, unit-tested numerical code with Eigen, build it with CMake, test it with GoogleTest, and expose the simulation core to Python through pybind11.',
    prereqs: ['t0_m03_python_scicomp'],
    hours: 100,
    topics: [
      'C++17/20 core language',
      'value semantics, references, const-correctness',
      'RAII, ownership, smart pointers',
      'move semantics',
      'templates and generic programming',
      'the STL: containers, algorithms, iterators',
      'classes, inheritance, virtual dispatch and its cost',
      'Eigen, including the Geometry module',
      'memory layout, cache behaviour, allocation-free hot loops',
      'constexpr and compile-time computation',
      'error handling without exceptions',
      'CMake, with Bazel awareness',
      'GoogleTest',
      'profiling and sanitizers: perf, valgrind, ASan/UBSan',
      'pybind11 bindings over a C++ simulation core',
      'undefined behaviour',
      'static analysis: clang-tidy, cppcheck',
    ],
    objectives: [
      'Write a numerically heavy, allocation-free, unit-tested C++ module',
      'Use Eigen fluently for 3-vectors, quaternions and matrices',
      'Build with CMake and test with GoogleTest',
      'Expose a C++ simulation core to Python',
    ],
    resources: [
      { title: 'A Tour of C++ (3rd ed.)', author: 'Bjarne Stroustrup', kind: 'book', free: false },
      { title: 'Effective Modern C++', author: 'Scott Meyers', kind: 'book', free: false },
      { title: 'learncpp.com', kind: 'site', url: 'https://www.learncpp.com', free: true, note: 'Free, thorough, and current — the best from-zero path.' },
      {
        title: 'Eigen documentation (including the Geometry module)',
        kind: 'docs',
        url: 'https://eigen.tuxfamily.org',
        free: true,
        note: 'Quaternion, AngleAxis and the fixed-size vectorisable types are the parts GNC lives in.',
      },
      {
        title: 'The Power of Ten — Rules for Developing Safety-Critical Code',
        author: 'Gerard J. Holzmann (NASA/JPL)',
        kind: 'paper',
        url: 'https://spinroot.com/gerard/pdf/P10.pdf',
        free: true,
        note: 'Ten rules, four pages. Read it twice; the expanded P10exp.pdf explains the reasoning.',
      },
      { title: 'GoogleTest primer', kind: 'docs', url: 'https://google.github.io/googletest/primer.html', free: true },
      {
        title: 'Real-time programming in C++ (CppCon talks)',
        author: 'Timur Doumler and others',
        kind: 'video',
        free: true,
        note: 'What you may and may not call on a thread with a deadline.',
      },
    ],
    exercises: [
      {
        id: 'ex_cpp_rk4_eigen',
        title: 'Port the RK4 propagator to C++ with Eigen',
        kind: 'build',
        hours: 8,
        prompt: [
          'Rewrite your Python two-body RK4 propagator as a C++ library:',
          '',
          '- `Eigen::Matrix<double, 6, 1>` state, fixed-size so it lives on the stack.',
          '- A templated `rk4_step` taking the derivative as a callable, with **no heap allocation** inside the step.',
          '- CMake build producing a static library plus a GoogleTest binary.',
          '- Tests: energy conservation over one orbit, agreement with the Python implementation to 1e-10, and a',
          '  `static_assert` that the state type is fixed size.',
          '',
          'Benchmark 1e6 steps against the NumPy version and report the speedup. Then run the binary under',
          '`valgrind --tool=massif` (or set a custom allocator that aborts) and demonstrate zero allocations in the loop.',
        ].join('\n'),
      },
      {
        id: 'ex_ring_buffer',
        title: 'Allocation-free telemetry ring buffer',
        kind: 'code',
        lang: 'cpp',
        hours: 4,
        prompt: [
          'Flight software logs telemetry from a hard-real-time loop, so the buffer must be fixed-size and allocation-free.',
          '',
          'Implement `template <typename T, std::size_t N> class RingBuffer` with `push` (overwriting the oldest element when',
          'full), `size`, `capacity`, `empty`, `full`, and indexed access from oldest to newest.',
          '',
          'Requirements:',
          '- storage is a `std::array<T, N>` member — no `new`, no `std::vector`,',
          '- `push` is O(1) with no branching on allocation,',
          '- `capacity()` is `constexpr`,',
          '- GoogleTest covers wraparound, overwrite ordering, and the empty and full boundaries.',
        ].join('\n'),
        starter: `#pragma once

#include <array>
#include <cstddef>

// Fixed-capacity ring buffer for hard-real-time telemetry.
// No dynamic allocation, no exceptions, O(1) push.
template <typename T, std::size_t N>
class RingBuffer {
 public:
  static_assert(N > 0, "RingBuffer capacity must be positive");

  constexpr std::size_t capacity() const noexcept { return N; }
  std::size_t size() const noexcept { return size_; }
  bool empty() const noexcept { return size_ == 0; }
  bool full() const noexcept { return size_ == N; }

  // Append one element, overwriting the oldest when the buffer is full.
  void push(const T& value) noexcept {
    // TODO: write at head_, advance head_ modulo N, and grow size_ up to N.
    (void)value;
  }

  // Indexed access from oldest (0) to newest (size() - 1).
  // Precondition: i < size(). No bounds check in the hot path.
  const T& operator[](std::size_t i) const noexcept {
    // TODO: map the logical index onto the physical slot.
    return data_[0];
  }

 private:
  std::array<T, N> data_{};
  std::size_t head_ = 0;   // next write position
  std::size_t size_ = 0;   // number of valid elements
};
`,
      },
      {
        id: 'ex_pybind_core',
        title: 'Drive the C++ core from a Python Monte Carlo',
        kind: 'build',
        hours: 5,
        prompt: [
          'Wrap the C++ propagator with pybind11 so the fast core runs under a Python analysis layer — the exact split used',
          'in production GNC tooling.',
          '',
          '- Expose a `propagate(state, dt, n_steps)` returning a NumPy array without copying more than necessary.',
          '- Release the GIL around the compute loop so a `multiprocessing`-free thread pool can actually use cores.',
          '- Run a 10 000-case dispersed Monte Carlo from Python and compare wall-clock time against the pure-NumPy version.',
          '',
          'Success: identical results to 1e-12, a measured speedup you can explain, and a `pip install -e .` that builds',
          'from a clean checkout.',
        ].join('\n'),
      },
    ],
    cards: [
      {
        id: 'c_raii',
        front: 'What is RAII?',
        back: 'Resource Acquisition Is Initialisation: a resource is owned by an object, acquired in its constructor and released in its destructor, so scope exit — including by exception — always cleans up. It is the reason well-written C++ needs no explicit free.',
      },
      {
        id: 'c_smart_pointers',
        front: 'unique_ptr vs shared_ptr — when to use which?',
        back: 'unique_ptr is exclusive ownership with zero overhead; it is the default. shared_ptr adds an atomic reference count and should appear only when ownership genuinely is shared. Neither belongs in a hard-real-time hot loop, because both can trigger deallocation.',
      },
      {
        id: 'c_move_semantics',
        front: 'What does std::move actually do?',
        back: 'Nothing at runtime — it is a cast to an rvalue reference, which lets overload resolution pick a move constructor or move assignment that steals the resource instead of copying it. The moved-from object is left valid but unspecified.',
      },
      {
        id: 'c_hot_loop_forbidden',
        front: 'Three things forbidden in a hard-real-time hot loop, and why.',
        back: 'Dynamic allocation (unbounded, non-deterministic latency, can fail); exceptions and unbounded recursion (unbounded stack and unwinding time); unbounded loops or blocking calls such as I/O, locks and logging (no provable worst-case execution time).',
      },
      {
        id: 'c_power_of_ten_loops',
        front: 'Why does the Power of Ten require every loop to have a fixed upper bound?',
        back: 'A statically provable bound makes termination checkable by a static analyser and gives a finite worst-case execution time for the real-time scheduler. A runaway loop in flight software is a missed deadline, not a slow program.',
      },
      {
        id: 'c_power_of_ten_rules',
        front: 'Name four of the Power of Ten rules.',
        back: 'No complex control flow (no goto, setjmp, recursion); all loops have a fixed upper bound; no dynamic memory allocation after initialisation; functions short enough to fit one page (~60 lines); at least two assertions per function; check every return value; minimal preprocessor use; restricted pointer use and no function pointers; compile with all warnings on and zero warnings tolerated.',
      },
      {
        id: 'c_eigen_quat_storage',
        front: 'Eigen quaternion: constructor order vs internal storage order?',
        back: 'Eigen::Quaterniond(w, x, y, z) takes the scalar first, but coeffs() returns [x, y, z, w] with the scalar last. Reading raw memory as though it were scalar-first is a classic silent bug.',
      },
      {
        id: 'c_eigen_quat_mult',
        front: 'What does Eigen::Quaterniond::operator* do?',
        back: 'The Hamilton product, composing rotations: q1 * q2 applies q2 first then q1. Against a Vector3d it applies the rotation to the vector. Eigen uses the Hamilton (not JPL) convention throughout.',
      },
      {
        id: 'c_eigen_fixed_size',
        front: 'Why prefer Eigen fixed-size types (Vector3d, Matrix3d) in flight code?',
        back: 'Fixed-size objects are stack-allocated with dimensions known at compile time, so there is no heap traffic, loops can be unrolled and vectorised, and the sizes are checked at compile time rather than asserted at run time.',
      },
      {
        id: 'c_eigen_auto',
        front: 'Why is `auto` dangerous with Eigen expressions?',
        back: 'Eigen returns lazily evaluated expression templates. `auto x = A + B;` stores the expression, not the result; if A or B goes out of scope you evaluate a dangling reference. Assign to a concrete type, or call .eval().',
      },
      {
        id: 'c_ub_examples',
        front: 'Name four sources of undefined behaviour in C++.',
        back: 'Signed integer overflow; out-of-bounds array access; use of an uninitialised value; use-after-free or dangling reference. The compiler may assume UB never happens, which is how a null check gets optimised away.',
      },
      {
        id: 'c_gtest_assert_expect',
        front: 'GoogleTest: ASSERT_* vs EXPECT_*?',
        back: 'ASSERT_* aborts the current test function on failure (use when continuing would crash or be meaningless); EXPECT_* records the failure and continues, so one run reports several problems. For floats use EXPECT_NEAR or EXPECT_DOUBLE_EQ.',
      },
      {
        id: 'c_cmake_minimal',
        front: 'Minimal modern CMake for a library plus a test binary?',
        back: 'cmake_minimum_required(VERSION 3.20) · project(x CXX) · add_library(core src/core.cpp) · target_include_directories(core PUBLIC include) · target_compile_features(core PUBLIC cxx_std_20) · add_executable(tests test/test_core.cpp) · target_link_libraries(tests PRIVATE core GTest::gtest_main)',
        formula: true,
      },
      {
        id: 'c_cache_layout',
        front: 'Struct-of-arrays vs array-of-structs — which and why for a Monte Carlo?',
        back: 'Struct-of-arrays. Sweeping one field over many cases touches contiguous memory, so every cache line is fully used and the loop vectorises. Array-of-structs strides over unused fields and wastes most of each line.',
      },
      {
        id: 'c_sanitizers',
        front: 'What do ASan and UBSan catch that a normal build does not?',
        back: 'AddressSanitizer catches out-of-bounds access, use-after-free and leaks; UndefinedBehaviorSanitizer catches signed overflow, misaligned access, invalid casts and null dereference. Both are compile flags (-fsanitize=address,undefined) and belong in CI, not in the flight build.',
      },
    ],
    quiz: [
      {
        id: 'q_hot_loop_forbidden',
        q: 'Name three things forbidden in the hot loop of flight software, with the reason for each.',
        choices: [
          'Dynamic allocation (unbounded latency and possible failure), exceptions or unbounded recursion (unbounded unwinding and stack), and blocking calls such as I/O, locks or logging (no provable worst-case execution time)',
          'Floating-point arithmetic, templates, and const references — all three are too slow',
          'Function calls, arrays, and struct members, because they defeat the optimiser',
          'Integer arithmetic, switch statements, and inline functions, because they break determinism',
        ],
        answer: 0,
        explain:
          'The unifying criterion is determinism, not speed. Anything whose execution time cannot be bounded — a heap allocation, an exception unwind, a lock the scheduler may hold, a write to a file system — breaks the worst-case-execution-time analysis the real-time schedule is built on. Floating-point maths, templates and const references are all perfectly fine and routine in flight code.',
        b: 0.6,
        bloom: 'understand',
      },
      {
        id: 'q_power_of_ten_loops',
        q: 'Why does the Power of Ten rule say "give all loops a fixed upper bound"?',
        choices: [
          'So that termination is statically provable and worst-case execution time is finite and analysable — a runaway loop in flight software is a missed deadline, not merely a slow program',
          'Because variable-length loops cannot be compiled on embedded targets',
          'Because it makes the code shorter and easier to read',
          'Because the C++ standard requires bounded loops in freestanding implementations',
        ],
        answer: 0,
        explain:
          'The rule exists so that a static analyser can prove termination and so that WCET analysis produces a real number. Holzmann pairs it with the convention that a loop intended to be unbounded (a scheduler loop) is annotated as such so the checker can distinguish intent from bug.',
        b: 0.5,
        bloom: 'understand',
      },
      {
        id: 'q_eigen_quat_convention',
        q: 'What convention does Eigen use for the scalar part of a quaternion, in the constructor versus in storage?',
        choices: [
          'Constructor is scalar-first, Quaterniond(w, x, y, z), but coeffs() stores [x, y, z, w] scalar-last',
          'Both the constructor and the storage are scalar-first',
          'Both are scalar-last',
          'Constructor is scalar-last, storage is scalar-first',
        ],
        answer: 0,
        explain:
          'This mismatch is deliberate (the storage order suits SIMD) and it is a well-known trap: memcpy-ing four doubles from a scalar-first message straight into a Quaterniond::coeffs() buffer silently produces a wrong rotation that still has unit norm, so no assertion fires. Always convert explicitly through the constructor.',
        b: 0.9,
        bloom: 'recall',
      },
      {
        id: 'q_eigen_auto_trap',
        q: 'A colleague writes `auto delta = R_target - R_current;` with Eigen matrices and returns delta from the function. What is wrong?',
        choices: [
          'auto captures a lazy expression template holding references to R_target and R_current, which are destroyed on return — the result is a dangling reference, not a matrix',
          'Nothing; Eigen overloads auto to force evaluation',
          'Matrix subtraction is not defined in Eigen; it requires .cwiseDifference()',
          'The result is correct but allocates on the heap, which is forbidden in flight code',
        ],
        answer: 0,
        explain:
          'Eigen returns expression templates so that chains such as A + B - C can be fused into one loop with no temporary. The cost is that the expression object only borrows its operands. Writing `Eigen::Matrix3d delta = R_target - R_current;` (or calling .eval()) forces evaluation while the operands are still alive.',
        b: 1.2,
        bloom: 'analyze',
      },
    ],
    tags: ['code', 'cpp', 'flight-software', 'spacex-core', 'interview'],
    importance: 1.4,
  },

  /* ══ TIER 1 — DYNAMICS ═══════════════════════════════════════════════════ */

  {
    id: 't1_m13_classical_mechanics',
    track: 'foundations',
    tier: 1,
    title: 'Newtonian Particle Mechanics',
    summary:
      'Derive the equations of motion of a variable-mass vehicle from first principles — the whiteboard question SpaceX actually asks — and decompose the gap between ideal and realised Δv into gravity, drag and steering losses.',
    prereqs: ['t0_m08_odes', 't0_m07_calculus_multi'],
    hours: 45,
    topics: [
      'Newton laws and inertial frames',
      'force, momentum, impulse',
      'the work-energy theorem',
      'conservative forces and potential energy',
      'systems of particles and the centre of mass',
      'variable-mass systems and the rocket equation done properly',
      'constraints and generalised coordinates',
      'Lagrangian mechanics and the Euler-Lagrange equation',
      'Hamilton principle',
    ],
    objectives: [
      'Derive equations of motion for a variable-mass vehicle',
      'Choose between Newton-Euler and Lagrangian formulations and justify it',
      'Apply conservation laws as sanity checks on a simulation',
      'Decompose realised Δv into gravity, drag and steering losses',
    ],
    resources: [
      {
        title: '16.07 Dynamics (Fall 2009)',
        author: 'MIT OCW',
        kind: 'course',
        url: 'https://ocw.mit.edu/courses/16-07-dynamics-fall-2009/',
        free: true,
        note: 'Explicitly aerospace: accelerated frames, 3-D rigid body dynamics, plus introductory orbital mechanics, flight dynamics, inertial navigation and attitude dynamics.',
      },
      {
        title: '8.01SC Classical Mechanics',
        author: 'MIT OCW',
        kind: 'course',
        url: 'https://ocw.mit.edu/courses/8-01sc-classical-mechanics-fall-2016/',
        free: true,
      },
      { title: 'Classical Mechanics', author: 'John R. Taylor', kind: 'book', free: false, note: 'The best self-study mechanics text at this level.' },
      { title: 'Classical Mechanics (3rd ed.)', author: 'Goldstein, Poole & Safko', kind: 'book', free: false, note: 'Reference for the Lagrangian and Hamiltonian material.' },
    ],
    exercises: [
      {
        id: 'ex_rocket_eom_losses',
        title: 'Rocket equation with gravity and drag losses',
        kind: 'derivation',
        hours: 3,
        prompt: [
          'Derive the powered-flight equation of motion for a rocket climbing at flight-path angle `gamma` through an',
          'atmosphere, then integrate it.',
          '',
          '1. Momentum balance over `dt` for the vehicle plus the mass `|dm|` it expels at relative speed `v_e`.',
          '2. Add gravity and drag to get `m dv/dt = T - D - m g sin(gamma)`.',
          '3. Integrate to obtain',
          '   `dv_realised = v_e ln(m0/mf) - integral(g sin(gamma) dt) - integral((D/m) dt)`.',
          '4. Add the steering loss for a thrust vector offset by angle `alpha` from velocity:',
          '   `integral((T/m)(1 - cos(alpha)) dt)`.',
          '5. Put representative numbers on each loss for a Falcon-class LEO ascent (ideal ~9.3-9.5 km/s vs ~7.8 km/s orbital).',
          '',
          'Success: every loss term is derived, not quoted, and your numbers add up to the right total within a few hundred m/s.',
        ].join('\n'),
      },
      {
        id: 'ex_gravity_turn',
        title: '3-DOF gravity-turn ascent',
        kind: 'code',
        lang: 'python',
        hours: 5,
        prompt: [
          'Simulate a flat-Earth gravity-turn ascent and measure the gravity-loss integral directly.',
          '',
          'State: `[v, gamma, h, x, m]`. Dynamics:',
          '',
          '```',
          'vdot     = T/m - D/m - g sin(gamma)',
          'gammadot = -(g/v) cos(gamma)          # gravity turn: no lift, no attitude command',
          'hdot     = v sin(gamma)',
          'xdot     = v cos(gamma)',
          'mdot     = -T/(Isp g0)',
          '```',
          '',
          'Kick the vehicle off vertical with a small pitch-over at ~50 m/s, integrate to burnout, and report ideal Δv,',
          'realised Δv, gravity loss and drag loss. Sweep the pitch-over angle and find the value that minimises total loss.',
        ].join('\n'),
        starter: `import numpy as np

G0 = 9.80665  # m/s^2


def gravity_turn_deriv(
    t: float,
    y: np.ndarray,
    thrust: float,
    isp: float,
    cd_a: float,
    rho0: float = 1.225,
    h_scale: float = 8500.0,
    g: float = G0,
) -> np.ndarray:
    """Derivative of [v, gamma, h, x, m] for a flat-Earth gravity turn.

    Parameters
    ----------
    thrust : newtons, constant
    isp    : seconds
    cd_a   : drag coefficient times reference area, m^2
    rho0, h_scale : exponential atmosphere parameters

    Notes
    -----
    Drag is D = 0.5 rho v^2 cd_a with rho = rho0 exp(-h / h_scale).
    Guard the gammadot term against v -> 0 at lift-off.
    """
    # TODO: unpack the state, build the five derivatives listed in the prompt.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'straight up with no thrust and no drag decelerates at exactly g',
            assert: `import numpy as np
y = np.array([100.0, np.pi / 2, 1000.0, 0.0, 5000.0])
d = gravity_turn_deriv(0.0, y, thrust=0.0, isp=300.0, cd_a=0.0)
assert abs(d[0] + G0) < 1e-9`,
          },
          {
            name: 'flight-path angle does not change while flying exactly vertical',
            assert: `import numpy as np
y = np.array([100.0, np.pi / 2, 1000.0, 0.0, 5000.0])
d = gravity_turn_deriv(0.0, y, thrust=1e5, isp=300.0, cd_a=0.0)
assert abs(d[1]) < 1e-12`,
          },
          {
            name: 'mass flow follows the thrust and Isp',
            assert: `import numpy as np
y = np.array([100.0, 1.2, 1000.0, 0.0, 5000.0])
d = gravity_turn_deriv(0.0, y, thrust=1.2e6, isp=311.0, cd_a=0.0)
assert abs(d[4] + 1.2e6 / (311.0 * G0)) < 1e-9`,
          },
          {
            name: 'drag opposes motion and decays with altitude',
            hidden: true,
            assert: `import numpy as np
lo = gravity_turn_deriv(0.0, np.array([300.0, 1.0, 0.0, 0.0, 5000.0]), 0.0, 300.0, 4.0)
hi = gravity_turn_deriv(0.0, np.array([300.0, 1.0, 40000.0, 0.0, 5000.0]), 0.0, 300.0, 4.0)
assert lo[0] < hi[0]`,
          },
        ],
      },
    ],
    cards: [
      {
        id: 'c_newton_momentum',
        front: 'State Newton second law in the form that survives variable mass.',
        back: 'F_ext = dp/dt applied to a *fixed* system of matter. For a rocket you must include the momentum carried off by the exhaust; F = m·a applied to the shrinking vehicle alone is wrong.',
        formula: true,
      },
      {
        id: 'c_rocket_thrust_eq',
        front: 'Write the rocket thrust equation including back pressure.',
        back: 'F = ṁ v_e,exit + (p_e − p_a)A_e. The pressure term is why sea-level and vacuum Isp differ for the same engine.',
        formula: true,
      },
      {
        id: 'c_variable_mass_correct',
        front: 'Correct equation of motion for a rocket under external forces.',
        back: 'm dv/dt = F_ext + v_e|ṁ| = F_ext + T, with T the thrust. The propellant term appears as a force because of the momentum it carries away, not because mass is changing in F = ma.',
        formula: true,
      },
      {
        id: 'c_work_energy',
        front: 'State the work-energy theorem.',
        back: 'W_net = ΔKE = ½mv₂² − ½mv₁². For conservative forces W = −ΔU, giving conservation of E = KE + U.',
        formula: true,
      },
      {
        id: 'c_impulse',
        front: 'Define impulse and relate it to momentum.',
        back: 'J = ∫F dt = Δp = mΔv. Total impulse divided by propellant weight is specific impulse.',
        formula: true,
      },
      {
        id: 'c_com_dynamics',
        front: 'How does the centre of mass of a system move?',
        back: 'M R̈_cm = ΣF_ext — internal forces cancel in pairs. This is why a tumbling vehicle still has a clean translational trajectory.',
        formula: true,
      },
      {
        id: 'c_angular_momentum_particle',
        front: 'Angular momentum of a particle and its rate of change.',
        back: 'L = r × p, and dL/dt = r × F = τ. Zero torque about a point means L about that point is conserved.',
        formula: true,
      },
      {
        id: 'c_euler_lagrange',
        front: 'Write the Euler-Lagrange equation.',
        back: 'd/dt(∂L/∂q̇ᵢ) − ∂L/∂qᵢ = Qᵢ, with L = T − V and Qᵢ the generalised non-conservative force.',
        formula: true,
      },
      {
        id: 'c_lagrangian_advantage',
        front: 'When is a Lagrangian formulation decisively better than Newton-Euler?',
        back: 'When holonomic constraints dominate — multibody chains, gimbals, flexible appendages, slosh pendulums — because generalised coordinates eliminate the constraint forces you never wanted to compute.',
      },
      {
        id: 'c_dv_losses',
        front: 'Decompose ideal Δv into realised Δv plus losses.',
        back: 'Δv_ideal = Δv_realised + gravity loss + drag loss + steering loss (+ back-pressure loss). For a LEO ascent, ideal ≈ 9.3–9.5 km/s against ≈ 7.8 km/s orbital speed.',
        formula: true,
      },
      {
        id: 'c_gravity_loss',
        front: 'Write the gravity-loss integral.',
        back: '∫ g sin γ dt, with γ the flight-path angle above the local horizon. Vertical flight loses at the full g; horizontal flight loses nothing.',
        formula: true,
      },
      {
        id: 'c_steering_loss',
        front: 'Write the steering-loss integral.',
        back: '∫ (T/m)(1 − cos α) dt, where α is the angle between the thrust vector and the velocity vector. Small α is cheap because 1 − cos α ≈ α²/2.',
        formula: true,
      },
      {
        id: 'c_gravity_turn_def',
        front: 'What is a gravity turn and why is it used?',
        back: 'After a small initial pitch-over, the vehicle flies at zero angle of attack and lets gravity rotate the velocity vector. It costs no steering loss and keeps q̄α near zero through max-Q, which is why every orbital launcher flies one.',
      },
      {
        id: 'c_inertial_frame',
        front: 'What makes a frame inertial, and is ECI one?',
        back: 'A frame in which a free particle moves in a straight line at constant speed — i.e. non-rotating and unaccelerated. ECI is inertial to excellent approximation for launch and orbit work, though it does orbit the Sun, which matters for interplanetary dynamics.',
      },
    ],
    quiz: [
      {
        id: 'q_variable_mass',
        q: 'Why does naively applying F = ma to a rocket give the wrong answer?',
        choices: [
          'Because the vehicle is not a closed system: the exhaust carries momentum away, and the correct statement is F_ext = dp/dt applied to vehicle plus expelled mass, which yields m dv/dt = F_ext + v_e|ṁ|',
          'Because the mass changes, so you must instead write F = d(mv)/dt = m dv/dt + v dm/dt for the vehicle alone',
          'Because thrust is not a real force and so cannot appear in Newton second law',
          'Because acceleration must be measured in the body frame for a rocket',
        ],
        answer: 0,
        explain:
          'Option 2 is the classic trap and is frame-dependent nonsense: the v·dm/dt term it produces depends on the observer velocity, so it cannot be physics. The right move is to apply momentum conservation to a fixed collection of matter over dt — vehicle plus the bit of propellant about to leave — which produces the thrust term v_e|ṁ| with no ambiguity.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'q_dv_budget_losses',
        q: 'A LEO ascent needs about 9.4 km/s of ideal Δv to reach an orbital speed of about 7.8 km/s. Where does the difference go?',
        choices: [
          'Mostly gravity loss (≈ 1.2–1.5 km/s), with drag loss (≈ 0.1–0.2 km/s) and steering loss small by comparison; a rotating-Earth launch also gives back up to ~0.46 km/s of eastward velocity',
          'Mostly drag loss, since the atmosphere is the dominant resistance throughout the flight',
          'Mostly steering loss, since the vehicle must rotate from vertical to horizontal',
          'Mostly engine inefficiency, captured by Isp being lower than theoretical',
        ],
        answer: 0,
        explain:
          'Gravity loss dominates because the vehicle spends the first minute or two nearly vertical with modest thrust-to-weight. Drag is small because dynamic pressure only matters for the ~80 s around max-Q, and a well-flown gravity turn keeps steering loss near zero by holding α ≈ 0. Isp inefficiency is a separate accounting item folded into the ideal Δv itself.',
        b: 0.9,
        bloom: 'analyze',
      },
      {
        id: 'q_lagrangian_when',
        q: 'When is a Lagrangian formulation decisively better than Newton-Euler for a spacecraft?',
        choices: [
          'When holonomic constraints dominate — gimballed appendages, multibody chains, flexible modes, slosh pendulums — because generalised coordinates remove the constraint forces from the problem entirely',
          'Whenever there are external torques, because Newton-Euler cannot represent torque',
          'When the system is linear, because the Euler-Lagrange equation only applies to linear systems',
          'Never; the two are mathematically identical so the choice is purely stylistic',
        ],
        answer: 0,
        explain:
          'The formulations describe the same physics, but the work differs enormously. Newton-Euler requires you to introduce and then eliminate every joint reaction force. The Lagrangian route picks coordinates that satisfy the constraints by construction, so a solar-array gimbal or a slosh pendulum falls out in a few lines instead of pages of free-body diagrams.',
        b: 0.9,
        bloom: 'understand',
      },
      {
        id: 'q_thrust_backpressure',
        q: 'The same engine produces 845 kN at sea level and 914 kN in vacuum. Which term explains the difference?',
        choices: [
          'The pressure term (p_e − p_a)A_e: ambient pressure pushes back on the nozzle exit plane at sea level and vanishes in vacuum',
          'Mass flow rate increases in vacuum because the turbopump is unloaded',
          'Exhaust velocity increases in vacuum because there is no air friction on the plume',
          'Gravity is slightly weaker at altitude, so the same thrust weighs less',
        ],
        answer: 0,
        explain:
          'Thrust is F = ṁv_e + (p_e − p_a)A_e. At sea level p_a ≈ 101 kPa acts against the exit plane, reducing thrust; in vacuum p_a = 0 and the full pressure term is recovered. Mass flow is set by the injector and chamber pressure and barely changes. This is also why vacuum-optimised engines carry much larger area-ratio nozzles.',
        b: 0.5,
        bloom: 'apply',
      },
    ],
    tags: ['dynamics', 'interview', 'spacex-core'],
    importance: 1.3,
  },

  {
    id: 't1_m14_rigid_body_dynamics',
    track: 'foundations',
    tier: 1,
    title: 'Rigid Body Dynamics',
    summary:
      'Inertia tensors, Euler rotational equations, and spin stability. You will reproduce the tennis-racket instability numerically and explain why an energy-dissipating spacecraft is only stable spinning about its major axis.',
    prereqs: ['t1_m13_classical_mechanics', 't0_m05_linear_algebra_2'],
    hours: 50,
    topics: [
      'rigid body kinematics and the angular velocity vector',
      'the moment of inertia tensor, products of inertia, parallel axis theorem',
      'principal axes and principal moments',
      'angular momentum H = I omega',
      'Euler rotational equations of motion',
      'torque-free motion, polhode and herpolhode',
      'major/minor axis spin stability and the intermediate axis theorem',
      'energy dissipation and the flat-spin instability',
      'gyroscopic effects, nutation, precession',
      'dual-spin spacecraft',
      'momentum wheels and control moment gyros',
      'introduction to flexible modes and propellant slosh',
    ],
    objectives: [
      'Compute an inertia tensor and its principal axes',
      'Integrate Euler equations numerically and reproduce the tennis-racket instability',
      'Explain why an energy-dissipating spacecraft is stable only about its major axis',
      'Size and reason about reaction wheel momentum storage and desaturation',
    ],
    resources: [
      {
        title: 'Analytical Mechanics of Space Systems (4th ed.)',
        author: 'Hanspeter Schaub & John L. Junkins',
        kind: 'book',
        free: false,
        note: 'AIAA Education Series. The reference text for this module and for everything attitude-related that follows.',
      },
      {
        title: 'Space Vehicle Dynamics and Control',
        author: 'Bong Wie',
        kind: 'book',
        free: false,
        note: 'AIAA Education Series. Strong on launch vehicle and flexible-body material.',
      },
      {
        title: 'Spacecraft Dynamics and Control Specialization',
        author: 'Hanspeter Schaub — University of Colorado Boulder (Coursera)',
        kind: 'course',
        free: false,
        note: 'Kinematics, Kinetics, Control of Nonlinear Spacecraft Attitude Motion, and a Mission to Mars capstone. Auditable free, certificate paid.',
      },
      {
        title: '16.07 Dynamics — rigid body lectures',
        author: 'MIT OCW',
        kind: 'course',
        url: 'https://ocw.mit.edu/courses/16-07-dynamics-fall-2009/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'ex_euler_stability',
        title: 'Reproduce the intermediate axis theorem numerically',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: [
          'Integrate the torque-free Euler equations for a body with principal inertias `I = diag(1, 2, 3)`.',
          '',
          'For each principal axis, start with a large spin about that axis and a 1% perturbation on the other two.',
          'Propagate for a few hundred seconds and plot the three body rates.',
          '',
          'You should see bounded oscillation about the major (I = 3) and minor (I = 1) axes, and exponential growth followed',
          'by periodic flipping about the intermediate (I = 2) axis. Verify that `||H||` and rotational kinetic energy are',
          'conserved to integrator tolerance in **all three** cases — instability is not the same as non-conservation.',
        ].join('\n'),
        starter: `import numpy as np


def euler_deriv(t: float, w: np.ndarray, I: np.ndarray, M: np.ndarray | None = None) -> np.ndarray:
    """Torque-free (or torqued) Euler rotational equations in principal axes.

        I1 w1dot = (I2 - I3) w2 w3 + M1
        I2 w2dot = (I3 - I1) w3 w1 + M2
        I3 w3dot = (I1 - I2) w1 w2 + M3

    Parameters
    ----------
    w : (3,) body angular rates
    I : (3,) principal moments of inertia
    M : (3,) external torque, or None for torque free
    """
    # TODO: implement the three scalar equations above.
    raise NotImplementedError


def angular_momentum_norm(w: np.ndarray, I: np.ndarray) -> float:
    """Magnitude of H = I w in the body frame -- constant under torque-free motion."""
    # TODO: implement
    raise NotImplementedError


def rotational_energy(w: np.ndarray, I: np.ndarray) -> float:
    """T = 0.5 w^T I w."""
    # TODO: implement
    raise NotImplementedError
`,
        tests: [
          {
            name: 'pure spin about a principal axis has zero derivative',
            assert: `import numpy as np
I = np.array([1.0, 2.0, 3.0])
for k in range(3):
    w = np.zeros(3); w[k] = 2.0
    assert np.allclose(euler_deriv(0.0, w, I), np.zeros(3), atol=1e-14)`,
          },
          {
            name: 'a sphere-like body with equal inertias never changes its rates',
            assert: `import numpy as np
I = np.array([2.0, 2.0, 2.0])
w = np.array([0.3, -0.7, 1.1])
assert np.allclose(euler_deriv(0.0, w, I), np.zeros(3), atol=1e-14)`,
          },
          {
            name: 'energy and momentum are conserved along the torque-free flow',
            hidden: true,
            assert: `import numpy as np
I = np.array([1.0, 2.0, 3.0])
w = np.array([0.02, 1.0, 0.02])
h0, e0 = angular_momentum_norm(w, I), rotational_energy(w, I)
dt = 1e-4
for _ in range(20000):
    k1 = euler_deriv(0.0, w, I)
    k2 = euler_deriv(0.0, w + 0.5 * dt * k1, I)
    k3 = euler_deriv(0.0, w + 0.5 * dt * k2, I)
    k4 = euler_deriv(0.0, w + dt * k3, I)
    w = w + (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
assert abs(angular_momentum_norm(w, I) - h0) / h0 < 1e-8
assert abs(rotational_energy(w, I) - e0) / e0 < 1e-8`,
          },
        ],
      },
      {
        id: 'ex_energy_dissipation',
        title: 'Energy dissipation drives a body to major-axis spin',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'Add a small energy sink to the previous simulation — the simplest model is a torque `M = -k (w - H_hat (w . H_hat))`',
          'that removes energy while leaving `H` nearly unchanged, or an explicit damped internal mass.',
          '',
          '- Start the body spinning about its **minor** axis with a small perturbation.',
          '- Show that `||H||` stays essentially constant while kinetic energy decays.',
          '- Show the spin migrates to the **major** axis, and explain the result from `T = H²/(2I)` at fixed `H`.',
          '',
          'Write up the connection to Explorer 1 in three sentences.',
        ].join('\n'),
        starter: `import numpy as np


def dissipation_torque(w: np.ndarray, I: np.ndarray, k: float) -> np.ndarray:
    """A simple internal energy sink that leaves angular momentum nearly intact.

    Project the angular velocity onto the angular momentum direction and damp
    only the component perpendicular to it:

        H     = I * w              (elementwise, principal axes)
        h_hat = H / |H|
        M     = -k * (w - h_hat * (w . h_hat))

    This removes kinetic energy while the transverse rates decay, which is
    exactly what a flexing antenna or a damped fluid does.
    """
    # TODO: implement the projection and return the damping torque.
    raise NotImplementedError


def spin_axis_index(w: np.ndarray) -> int:
    """Index of the body axis carrying most of the spin -- used to detect the
    migration from minor-axis to major-axis rotation."""
    # TODO: return int(np.argmax(np.abs(w)))
    raise NotImplementedError
`,
      },
      {
        id: 'ex_inertia_tensor',
        title: 'Inertia tensor of an assembled spacecraft',
        kind: 'analysis',
        hours: 3,
        prompt: [
          'Build the inertia tensor of a simple spacecraft: a 1.2 m cube bus (400 kg), two solar arrays modelled as thin',
          'plates (30 kg each, 1 m × 3 m, mounted ±1.1 m along the y axis), and a propellant tank modelled as a sphere',
          '(120 kg, r = 0.45 m, offset 0.3 m along +z).',
          '',
          '- Compute each component tensor about its own centre of mass.',
          '- Move each to the assembly centre of mass with the parallel axis theorem.',
          '- Sum, then find the principal moments and principal axes by eigen-decomposition.',
          '- State which axis is major, which is intermediate and which is minor, and what that implies for a spin-stabilised',
          '  configuration.',
        ].join('\n'),
      },
    ],
    cards: [
      {
        id: 'c_inertia_tensor',
        front: 'Define the inertia tensor.',
        back: 'I = ∫(‖r‖²I₃ − rrᵀ)dm, i.e. Iᵢⱼ = ∫(‖r‖²δᵢⱼ − rᵢrⱼ)dm. Symmetric, positive definite, and frame dependent.',
        formula: true,
      },
      {
        id: 'c_parallel_axis',
        front: 'State the parallel axis theorem in tensor form.',
        back: 'I_P = I_cm + m(‖d‖²I₃ − ddᵀ), where d is the vector from the centre of mass to the new reference point.',
        formula: true,
      },
      {
        id: 'c_principal_axes',
        front: 'What are the principal axes of a rigid body?',
        back: 'The eigenvectors of the inertia tensor. In that basis I is diagonal and all products of inertia vanish, so H is parallel to ω only when ω lies along one of them.',
      },
      {
        id: 'c_H_eq_Iw',
        front: 'Angular momentum of a rigid body about its centre of mass.',
        back: 'H = Iω. H and ω are parallel only along a principal axis — which is exactly why an off-axis spin nutates.',
        formula: true,
      },
      {
        id: 'c_euler_equations',
        front: 'Write Euler rotational equations of motion.',
        back: 'I ω̇ + ω × (Iω) = M. In principal axes: I₁ω̇₁ = (I₂−I₃)ω₂ω₃ + M₁, and cyclic permutations.',
        formula: true,
      },
      {
        id: 'c_rotational_ke',
        front: 'Rotational kinetic energy of a rigid body.',
        back: 'T = ½ωᵀIω = ½ω·H. For a spin about a single principal axis, T = H²/(2I).',
        formula: true,
      },
      {
        id: 'c_intermediate_axis',
        front: 'State the intermediate axis theorem.',
        back: 'Torque-free rotation about the major (largest I) or minor (smallest I) principal axis is stable; rotation about the intermediate axis is unstable, with perturbations growing exponentially and the body periodically flipping.',
      },
      {
        id: 'c_intermediate_proof',
        front: 'How do you prove the intermediate axis theorem?',
        back: 'Linearise Euler equations about a spin ω₃ = n on axis 3. The transverse pair obeys ω̈₁ = −k ω₁ with k = n²(I₃−I₂)(I₃−I₁)/(I₁I₂). If I₃ is largest or smallest both factors share a sign so k > 0 (oscillation); if I₃ is intermediate the signs differ, k < 0, and the solution grows as e^(√|k| t).',
        formula: true,
      },
      {
        id: 'c_major_axis_rule',
        front: 'Why is only major-axis spin stable for a body that dissipates energy?',
        back: 'With H fixed, T = H²/(2I) is minimised by the largest I. Dissipation drives T monotonically down toward that minimum, so the spin migrates to the major axis and stays there.',
        formula: true,
      },
      {
        id: 'c_explorer1',
        front: 'What happened to Explorer 1, and what did it teach?',
        back: 'It was spun about its minor (long-axis) direction, but its flexible whip antennas dissipated energy. Kinetic energy fell at constant H, so the satellite transitioned to a flat spin about its major axis within a few orbits — the first flight demonstration of the major-axis rule.',
      },
      {
        id: 'c_nutation',
        front: 'What is nutation?',
        back: 'The coning of the angular velocity vector (and body axis) about the fixed angular momentum vector when ω is not aligned with a principal axis. For an axisymmetric body the body cone rolls on the space cone.',
      },
      {
        id: 'c_axisym_precession',
        front: 'Precession rate of a torque-free axisymmetric body.',
        back: 'The body-frame transverse rate precesses at λ = ω₃(I₃ − I_t)/I_t, where I_t is the transverse moment. Oblate (I₃ > I_t) and prolate bodies precess in opposite senses.',
        formula: true,
      },
      {
        id: 'c_wheel_momentum_exchange',
        front: 'What conserves what when a reaction wheel spins up?',
        back: 'Total system angular momentum H_body + Σ I_w Ω_w is conserved under zero external torque. The wheel takes momentum from the body — it cannot create or remove system momentum, only shuffle it.',
        formula: true,
      },
      {
        id: 'c_desaturation',
        front: 'Reaction wheel desaturation options in LEO and what each costs.',
        back: 'Magnetorquers — free propellant-wise, but slow, power-hungry, and can produce no torque about the local magnetic field direction. Thrusters — fast and always available, but consume propellant and disturb the orbit. Environmental torques (gravity gradient, aero) — free but very slow and require holding a biased attitude.',
      },
      {
        id: 'c_dual_spin',
        front: 'What is a dual-spin spacecraft and why build one?',
        back: 'A spinning rotor plus a de-spun platform. The rotor supplies gyroscopic stiffness while the platform points continuously, and — per the Iorillo/energy-sink result — damping on the de-spun section can stabilise a configuration that would otherwise violate the major-axis rule.',
      },
    ],
    quiz: [
      {
        id: 'q_intermediate_axis',
        q: 'State the intermediate axis theorem and identify the step in the proof that produces the instability.',
        choices: [
          'Spin about the major or minor principal axis is stable, about the intermediate axis unstable: linearising Euler equations gives ω̈ = −k ω with k ∝ (I₃−I₂)(I₃−I₁), and only for the intermediate axis do those two factors have opposite signs, making k negative and the solution exponential',
          'Spin is stable only about the major axis; the minor axis is always unstable because it has the least inertia',
          'All three principal axes are stable for a rigid body; only flexibility creates instability',
          'The theorem follows from conservation of energy alone, without linearising the equations of motion',
        ],
        answer: 0,
        explain:
          'The mechanism is the sign of the product (I₃−I₂)(I₃−I₁) in the linearised transverse dynamics. For the largest or smallest moment both factors share a sign, giving simple harmonic (bounded) motion. For the intermediate moment the signs oppose, k < 0, and the perturbation grows as e^(√|k| t). Note this is a *rigid-body* result: for a rigid body minor-axis spin is stable, and it is energy dissipation — a separate argument — that rules it out in practice.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'q_explorer1',
        q: 'Explorer 1 was spun about its long, slender axis and tumbled into a flat spin within hours. What is the physics?',
        choices: [
          'Its flexible antennas dissipated kinetic energy at essentially constant angular momentum, and since T = H²/(2I) is minimised at the largest inertia, the spin migrated from the minor to the major axis',
          'Aerodynamic torque at 350 km reversed the spin direction',
          'A residual magnetic dipole interacting with the geomagnetic field flipped the vehicle',
          'The intermediate axis theorem: the spin axis happened to be the intermediate axis',
        ],
        answer: 0,
        explain:
          'Rigid-body theory says minor-axis spin is stable, so the flight result was a surprise at the time. The resolution is that no spacecraft is truly rigid: the whip antennas flexed and dissipated energy. With H conserved and T decreasing, the only end state is spin about the axis of maximum inertia — a flat spin. This is the origin of the engineering rule that spin-stabilised vehicles must be major-axis spinners.',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'q_wheel_desat',
        q: 'A reaction wheel is approaching saturation in LEO. What are your desaturation options and what does each cost?',
        choices: [
          'Magnetorquers (no propellant but slow, power-hungry, and no torque about the local B field), thrusters (fast and unconditional but spend propellant and perturb the orbit), or environmental torques such as gravity gradient and aero (free but very slow and require biasing the attitude)',
          'Simply command the wheel to zero speed; the momentum disappears with it',
          'Reverse the wheel direction, which cancels the stored momentum without any external torque',
          'Wait: wheel momentum decays naturally through bearing friction, which is an external torque',
        ],
        answer: 0,
        explain:
          'Momentum dumping requires an *external* torque — nothing internal can change total system angular momentum. Commanding the wheel to zero just transfers its momentum back into the body, spinning the spacecraft up. Bearing friction is internal too. The real options are magnetic (m × B), propulsive, or environmental, and choosing among them is a genuine mission trade.',
        b: 0.8,
        bloom: 'apply',
      },
      {
        id: 'q_H_parallel_w',
        q: 'Under what condition is the angular momentum vector H parallel to the angular velocity vector ω?',
        choices: [
          'Only when ω lies along a principal axis, or when the inertia tensor is isotropic (all three principal moments equal)',
          'Always, since H = Iω and I is a scalar multiple of the identity for any rigid body',
          'Only when the body is torque free',
          'Only when the body is spinning about its major axis',
        ],
        answer: 0,
        explain:
          'H = Iω with I a tensor, so H is generally rotated away from ω. They align exactly when ω is an eigenvector of I (a principal axis) or when every eigenvalue is equal. This misalignment is the source of nutation, and of the ω × Iω gyroscopic term in Euler equations.',
        b: 0.6,
        bloom: 'understand',
      },
    ],
    tags: ['dynamics', 'attitude', 'interview', 'spacex-core'],
    importance: 1.25,
  },

  {
    id: 't1_m15_rotating_frames',
    track: 'foundations',
    tier: 1,
    title: 'Reference Frames & Rotating Coordinate Systems',
    summary:
      'The transport theorem and the aerospace frame zoo. You will derive Coriolis and centrifugal terms yourself, build a verified ECI to ECEF chain, and adopt the naming discipline that keeps frame bugs out of flight code.',
    prereqs: ['t1_m14_rigid_body_dynamics'],
    hours: 35,
    topics: [
      'the transport theorem',
      'velocity and acceleration in rotating frames',
      'Coriolis, centrifugal and Euler acceleration terms',
      'ECI (J2000 / GCRF) and ECEF (ITRF)',
      'NED and ENU local-level frames',
      'body, LVLH / RIC, perifocal, topocentric and sensor frames',
      'frame transformation chains and notation discipline',
      'Earth rotation rate',
      'precession, nutation, polar motion',
      'UT1, TAI, GPS and TT time scales',
      'geodetic vs geocentric latitude and the WGS-84 ellipsoid',
    ],
    objectives: [
      'Apply the transport theorem to derive relative-motion equations',
      'Build and verify a multi-hop frame transformation chain',
      'State which frame every vector in your code lives in and enforce it in naming or types',
      'Convert between the principal time scales used in navigation',
    ],
    resources: [
      { title: 'Analytical Mechanics of Space Systems, Ch. 1-3', author: 'Schaub & Junkins', kind: 'book', free: false },
      {
        title: 'Fundamentals of Astrodynamics and Applications (4th ed.), Ch. 3',
        author: 'David A. Vallado',
        kind: 'book',
        free: false,
        note: 'Coordinate and time systems — the definitive practical treatment, with algorithms you can implement directly.',
      },
      {
        title: 'Orbital Mechanics & Astrodynamics — Reference Frames',
        author: 'Bryan Weber',
        kind: 'site',
        url: 'https://orbital-mechanics.space',
        free: true,
      },
      {
        title: '16.07 Dynamics — accelerated reference frames',
        author: 'MIT OCW',
        kind: 'course',
        url: 'https://ocw.mit.edu/courses/16-07-dynamics-fall-2009/',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'ex_eci_ecef',
        title: 'ECI to ECEF, and a ground track you can check',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: [
          'Implement the simple-rotation ECI↔ECEF transformation: a rotation about the z axis through the Greenwich',
          'apparent sidereal angle `theta(t) = theta0 + omega_E (t - t0)`.',
          '',
          '- `R_eci_to_ecef(theta)` and `R_ecef_to_eci(theta)`, each returning a 3×3 matrix.',
          '- `eci_to_ecef(r_eci, theta)` and the inverse.',
          '- Propagate a circular 500 km orbit at 51.6° inclination, convert to ECEF, convert to geodetic, and plot the',
          '  ground track. Confirm the track shifts west by about 22.5° per revolution and explain that number.',
          '',
          'Stretch: compare against a real ISS TLE propagated with SGP4 and quantify how far the simple rotation model drifts',
          'over a day (precession, nutation, polar motion and UT1-UTC are all missing).',
        ].join('\n'),
        starter: `import numpy as np

OMEGA_EARTH = 7.292115e-5  # rad/s, Earth inertial rotation rate


def R_eci_to_ecef(theta: float) -> np.ndarray:
    """Rotation matrix taking an ECI vector into ECEF, given Earth rotation angle theta."""
    # TODO: a rotation about +z by -theta, expressed as a coordinate transformation.
    #       Get the sign right by checking a known case in the tests below.
    raise NotImplementedError


def earth_rotation_angle(t_since_epoch_s: float, theta0: float = 0.0) -> float:
    """Greenwich rotation angle at t seconds after the epoch, wrapped to [0, 2 pi)."""
    # TODO: theta0 + OMEGA_EARTH * t, wrapped.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'the rotation axis is unchanged',
            assert: `import numpy as np
R = R_eci_to_ecef(1.234)
assert np.allclose(R @ np.array([0.0, 0.0, 1.0]), np.array([0.0, 0.0, 1.0]))`,
          },
          {
            name: 'the transform is a proper rotation',
            assert: `import numpy as np
R = R_eci_to_ecef(0.7)
assert np.allclose(R.T @ R, np.eye(3), atol=1e-12)
assert abs(np.linalg.det(R) - 1.0) < 1e-12`,
          },
          {
            name: 'a quarter turn maps the ECI x axis onto the ECEF -y axis',
            assert: `import numpy as np
R = R_eci_to_ecef(np.pi / 2)
assert np.allclose(R @ np.array([1.0, 0.0, 0.0]), np.array([0.0, -1.0, 0.0]), atol=1e-12)`,
          },
          {
            name: 'one sidereal day returns to the identity',
            hidden: true,
            assert: `import numpy as np
th = earth_rotation_angle(86164.0905)
assert min(abs(th), abs(th - 2 * np.pi)) < 1e-4`,
          },
        ],
      },
      {
        id: 'ex_coriolis_magnitude',
        title: 'Coriolis acceleration on a vehicle flying north',
        kind: 'derivation',
        hours: 2,
        prompt: [
          'A vehicle flies due north at 500 m/s at 45° latitude.',
          '',
          '1. Write the full rotating-frame acceleration from the transport theorem and name every term.',
          '2. Evaluate the Coriolis term `2 omega x v_rel` in the local NED frame and give its magnitude and direction.',
          '3. Evaluate the centrifugal term `omega x (omega x r)` at the same point and compare its magnitude to g.',
          '4. Integrate the Coriolis deflection over 10 minutes of flight and state the cross-range error in kilometres.',
          '',
          'Success: you get roughly 0.05 m/s² of Coriolis directed east, a centrifugal term near 0.024 m/s² (~0.24% of g),',
          'and a cross-range deflection of order 9 km — and you can say why a ballistic missile must model this and a',
          'commercial airliner does not.',
        ].join('\n'),
      },
    ],
    cards: [
      {
        id: 'c_transport_theorem',
        front: 'State the transport theorem.',
        back: '(d a/dt)_I = (d a/dt)_B + ω_{B/I} × a — the inertial derivative of any vector equals its body-frame derivative plus the rotation term.',
        formula: true,
      },
      {
        id: 'c_rotating_accel',
        front: 'Write the full acceleration of a point in a rotating frame.',
        back: 'a_I = a_rel + 2ω × v_rel + ω × (ω × r) + ω̇ × r — relative, Coriolis, centrifugal, and Euler (angular acceleration) terms.',
        formula: true,
      },
      {
        id: 'c_coriolis_term',
        front: 'Write the Coriolis acceleration and state when it vanishes.',
        back: 'a_cor = 2ω × v_rel. It is zero when the body is at rest in the rotating frame, or when its relative velocity is parallel to ω.',
        formula: true,
      },
      {
        id: 'c_centrifugal_term',
        front: 'Write the centrifugal acceleration and its magnitude at the equator.',
        back: 'a_cf = ω × (ω × r) = −ω²r_perp. At the equator ω²R ≈ (7.292e-5)² × 6.378e6 ≈ 0.0339 m/s², about 0.35% of g.',
        formula: true,
      },
      {
        id: 'c_earth_rate',
        front: 'Earth inertial rotation rate and sidereal day length.',
        back: 'ω_E = 7.292115 × 10⁻⁵ rad/s ≈ 15.041 °/hr; one sidereal day is 86 164.0905 s, about 3 min 56 s shorter than the solar day.',
        formula: true,
      },
      {
        id: 'c_eci_ecef',
        front: 'Distinguish ECI (GCRF) from ECEF (ITRF).',
        back: 'ECI/GCRF is quasi-inertial: axes fixed relative to distant quasars, origin at Earth centre. ECEF/ITRF rotates with the crust, so ground stations and launch pads have fixed coordinates in it. They differ by Earth rotation plus precession, nutation and polar motion.',
      },
      {
        id: 'c_ned_enu',
        front: 'Define the NED and ENU local-level frames.',
        back: 'NED: x north, y east, z down along the local ellipsoid normal (aerospace default, right-handed with gravity positive). ENU: x east, y north, z up (geodesy and robotics default). Mixing them flips two axes and is a classic sign bug.',
      },
      {
        id: 'c_lvlh',
        front: 'Define the LVLH / RIC frame.',
        back: 'Radial (along r, outward or nadir depending on convention), In-track (along-track, completing the triad), Cross-track (along the orbit normal h). It is the natural frame for relative motion and for reporting orbit errors.',
      },
      {
        id: 'c_perifocal',
        front: 'Define the perifocal frame.',
        back: 'p̂ toward periapsis, ŵ along the angular momentum h, q̂ = ŵ × p̂ completing the right-handed set 90° ahead of periapsis. Position is (r cos ν, r sin ν, 0) in it.',
        formula: true,
      },
      {
        id: 'c_time_scales',
        front: 'Relate TAI, UTC, GPS time and TT.',
        back: 'TAI is continuous atomic time. UTC = TAI − leap seconds (37 s since 2017). GPS time = TAI − 19 s, with no leap seconds. TT = TAI + 32.184 s. UT1 tracks actual Earth rotation and differs from UTC by |ΔUT1| < 0.9 s.',
        formula: true,
      },
      {
        id: 'c_ut1_why',
        front: 'Why does a navigation system need UT1 rather than UTC?',
        back: 'The ECI to ECEF rotation angle is driven by the actual rotation of the Earth, which is UT1. Using UTC instead introduces up to 0.9 s of rotation error — about 400 m of position error at the equator.',
      },
      {
        id: 'c_precession_nutation',
        front: 'Distinguish precession, nutation and polar motion.',
        back: 'Precession: the ~26 000-year conical drift of the spin axis in inertial space. Nutation: smaller periodic wobbles on top of it, dominated by an 18.6-year lunar term. Polar motion: the metre-scale wander of the rotation axis relative to the crust, measured and published by the IERS.',
      },
      {
        id: 'c_frame_naming',
        front: 'Naming discipline for vectors in GNC flight code.',
        back: 'Every vector carries its frame, and ideally its reference point: r_eci, v_ecef, omega_body_wrt_eci_in_body. Matrices carry both: R_eci_from_body. Better still, make the frame a template or type parameter so a mismatch will not compile.',
      },
      {
        id: 'c_wgs84',
        front: 'Key WGS-84 constants.',
        back: 'a = 6 378 137.0 m, f = 1/298.257223563, μ = 3.986004418 × 10¹⁴ m³/s², ω = 7.292115 × 10⁻⁵ rad/s.',
        formula: true,
      },
    ],
    quiz: [
      {
        id: 'q_transport_terms',
        q: 'Which of these is the complete rotating-frame acceleration, with the terms correctly named?',
        choices: [
          'a_I = a_rel + 2ω × v_rel (Coriolis) + ω × (ω × r) (centrifugal) + ω̇ × r (Euler / angular acceleration)',
          'a_I = a_rel + ω × v_rel + ω² r',
          'a_I = a_rel + 2ω × r + ω × (ω × v_rel)',
          'a_I = a_rel + ω̇ × v_rel + ω × (ω × r)',
          ],
        answer: 0,
        explain:
          'Apply the transport theorem twice to the position vector. The factor of 2 on the Coriolis term comes from differentiating both the rotating basis and the relative velocity, and it is the single most common thing people get wrong. The Euler term ω̇ × r is zero for a constant rotation rate such as the Earth, which is why it is often dropped and then forgotten.',
        b: 0.7,
        bloom: 'recall',
      },
      {
        id: 'q_frame_naming',
        q: 'Why must every vector variable in GNC flight code carry its frame in the name or the type? Give the failure mode.',
        choices: [
          'Because a frame mismatch is dimensionally valid and therefore silent — adding an ECI velocity to an ECEF velocity compiles, runs, and is wrong by up to 465 m/s at the equator, which shows up as a slow navigation divergence rather than a crash',
          'Because the compiler cannot otherwise determine the size of the array',
          'Because units differ between frames, so the conversion factor would be lost',
          'Because flight software coding standards forbid short variable names',
        ],
        answer: 0,
        explain:
          'All these vectors are three doubles, so nothing in the language stops you from mixing them. A missing ECI-to-ECEF rotation produces an error of ω × r — up to 465 m/s at the equator — that looks like a plausible but drifting state. Encoding the frame in the type (or at minimum the name) turns a silent flight anomaly into a compile error.',
        b: 0.4,
        bloom: 'analyze',
      },
      {
        id: 'q_gcrf_itrf_startracker',
        q: 'What is the difference between GCRF and ITRF, and which does a star tracker naturally measure in?',
        choices: [
          'GCRF is the quasi-inertial celestial frame and ITRF is the Earth-fixed terrestrial frame; a star tracker matches a star catalogue and therefore produces attitude relative to the inertial frame (GCRF)',
          'GCRF rotates with the Earth and ITRF is inertial; a star tracker measures in ITRF',
          'They differ only by a translation, and a star tracker measures in neither',
          'ITRF is inertial but epoch-dependent; a star tracker measures in ITRF because catalogues are Earth-referenced',
        ],
        answer: 0,
        explain:
          'A star tracker solves a lost-in-space problem against a catalogue of inertial star directions, so its native output is attitude with respect to the celestial frame. Getting a body-to-ECEF attitude requires the full Earth-orientation chain — precession, nutation, sidereal rotation with UT1, and polar motion.',
        b: 0.8,
        bloom: 'understand',
      },
      {
        id: 'q_groundtrack_shift',
        q: 'A satellite in a 500 km circular orbit has a period of about 94.6 minutes. How far west does each successive ground track shift at the equator?',
        choices: [
          'About 23.7° — the Earth turns 15.04°/hr, so in 1.577 hr it rotates by roughly 23.7° under the orbit',
          'About 15°, one hour of Earth rotation',
          'It does not shift: the orbit is fixed relative to the ground',
          'About 90°, one quarter turn per revolution',
        ],
        answer: 0,
        explain:
          'The orbit plane is approximately fixed in inertial space (J2 nodal regression aside) while the Earth rotates beneath it at 15.041 °/hr. In 94.6 min = 1.577 hr the Earth turns 23.7°, so the track repeats one revolution later that much further west. This is exactly the calculation behind repeat-ground-track orbit design.',
        b: 0.5,
        bloom: 'apply',
      },
    ],
    tags: ['dynamics', 'frames', 'navigation', 'interview', 'spacex-core'],
    importance: 1.3,
  },

  {
    id: 't1_m16_attitude_representations',
    track: 'foundations',
    tier: 1,
    title: 'Attitude Representations',
    summary:
      'DCMs, Euler angles, quaternions and MRPs — how to convert among them, which convention your data is in, and why gimbal lock, the quaternion double cover and the Hamilton/JPL split cause real flight bugs.',
    prereqs: ['t1_m15_rotating_frames', 't0_m05_linear_algebra_2'],
    hours: 45,
    topics: [
      'the direction cosine matrix and SO(3)',
      'Euler angles, the twelve sequences, the 3-2-1 aerospace sequence',
      'gimbal lock and its mathematical cause',
      'Euler rotation theorem, principal rotation axis and angle',
      'quaternions: Hamilton vs JPL, scalar-first vs scalar-last',
      'quaternion multiplication, conjugate, inverse, unit-norm constraint',
      'the double cover and the shortest-path sign convention',
      'SLERP',
      'classical and modified Rodrigues parameters, and the MRP shadow set',
      'conversions between every representation',
      'active vs passive rotation (operator vs coordinate transformation)',
      'attitude error representations',
      'introduction to SO(3), so(3) and the exp/log maps',
    ],
    objectives: [
      'Convert fluently among DCM, Euler angles, quaternion and MRP',
      'State the convention your code uses and detect a mismatch from data',
      'Explain exactly why quaternions are used in flight software and what they cost',
      'Use the MRP shadow set to avoid the singularity',
    ],
    resources: [
      {
        title: 'Fundamentals of Spacecraft Attitude Determination and Control',
        author: 'F. Landis Markley & John L. Crassidis',
        kind: 'book',
        free: false,
        note: 'Space Technology Library Vol. 33, Springer 2014. Chapter 2 is the canonical treatment of attitude representations.',
      },
      { title: 'Analytical Mechanics of Space Systems, Ch. 3', author: 'Schaub & Junkins', kind: 'book', free: false },
      {
        title: 'Quaternion kinematics for the error-state Kalman filter',
        author: 'Joan Solà',
        kind: 'paper',
        url: 'https://arxiv.org/abs/1711.02508',
        free: true,
        note: 'The single best practical quaternion reference, and unusually explicit about conventions. Read it before writing any quaternion code.',
      },
      {
        title: 'Kinematics: Describing the Motions of Spacecraft',
        author: 'Hanspeter Schaub — CU Boulder (Coursera)',
        kind: 'course',
        free: false,
      },
      { title: 'Eigen Geometry module documentation', kind: 'docs', url: 'https://eigen.tuxfamily.org', free: true },
    ],
    exercises: [
      {
        id: 'ex_attitude_conversions',
        title: 'A complete attitude conversion library with property tests',
        kind: 'code',
        lang: 'python',
        hours: 6,
        prompt: [
          'Build `attitude.py` converting among DCM, unit quaternion (scalar-first, Hamilton), 3-2-1 Euler angles,',
          'axis-angle and MRP. Declare your convention in the module docstring and hold to it everywhere.',
          '',
          'Required functions: `dcm_from_quat`, `quat_from_dcm`, `euler321_from_dcm`, `dcm_from_euler321`,',
          '`quat_from_axis_angle`, `axis_angle_from_quat`, `mrp_from_quat`, `quat_from_mrp`, `quat_mult`, `quat_conj`.',
          '',
          '`quat_from_dcm` must use the Shepperd / Markley branch selection (pick the largest of the four candidate',
          'denominators) rather than the naive trace formula, which loses precision or divides by zero near 180°.',
          '',
          'Test with **property tests over random rotations**: round-trip identity up to the quaternion sign,',
          '`dcm_from_quat(q).T @ dcm_from_quat(q) == I`, and composition consistency',
          '`dcm_from_quat(quat_mult(a, b)) == dcm_from_quat(a) @ dcm_from_quat(b)`.',
        ].join('\n'),
        starter: `"""Attitude representations.

Convention (state it and never deviate):
  * Quaternions are UNIT, SCALAR-FIRST: q = [w, x, y, z].
  * Hamilton convention: quat_mult(a, b) composes so that the resulting DCM
    equals dcm(a) @ dcm(b).
  * A DCM here is the coordinate transformation C such that v_A = C @ v_B.
  * Euler 3-2-1 is yaw (about z), then pitch (about y), then roll (about x).
"""

import numpy as np


def quat_mult(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Hamilton product of two scalar-first quaternions.

    (w1, v1) * (w2, v2) = (w1 w2 - v1 . v2,  w1 v2 + w2 v1 + v1 x v2)
    """
    # TODO: implement exactly the formula in the docstring.
    raise NotImplementedError


def quat_conj(q: np.ndarray) -> np.ndarray:
    """Conjugate: negate the vector part. For a unit quaternion this is the inverse."""
    # TODO: implement
    raise NotImplementedError


def dcm_from_quat(q: np.ndarray) -> np.ndarray:
    """Rotation matrix from a unit scalar-first quaternion."""
    # TODO: implement. A good check: the trace should equal 4 w^2 - 1.
    raise NotImplementedError


def quat_from_dcm(C: np.ndarray) -> np.ndarray:
    """Unit quaternion from a rotation matrix, using Shepperd branch selection.

    Compute the four candidates 1 + tr, 1 + 2 C00 - tr, 1 + 2 C11 - tr,
    1 + 2 C22 - tr; divide by the square root of the LARGEST one so the
    denominator is never small. Return with w >= 0.
    """
    # TODO: implement with the branch selection described above.
    raise NotImplementedError


def euler321_from_dcm(C: np.ndarray) -> tuple[float, float, float]:
    """Return (yaw, pitch, roll) in radians from a 3-2-1 DCM. Use atan2 twice."""
    # TODO: implement, and clamp the arcsin argument to [-1, 1] before calling it.
    raise NotImplementedError


def mrp_from_quat(q: np.ndarray) -> np.ndarray:
    """Modified Rodrigues parameters sigma = qv / (1 + w), switching to the
    shadow set -sigma / (sigma . sigma) whenever |sigma| > 1."""
    # TODO: implement
    raise NotImplementedError
`,
        tests: [
          {
            name: 'identity quaternion gives the identity matrix',
            assert: `import numpy as np
assert np.allclose(dcm_from_quat(np.array([1.0, 0.0, 0.0, 0.0])), np.eye(3))`,
          },
          {
            name: 'every generated DCM is a proper rotation',
            assert: `import numpy as np
rng = np.random.default_rng(5)
for _ in range(50):
    q = rng.normal(size=4); q /= np.linalg.norm(q)
    C = dcm_from_quat(q)
    assert np.allclose(C.T @ C, np.eye(3), atol=1e-12)
    assert abs(np.linalg.det(C) - 1.0) < 1e-12`,
          },
          {
            name: 'quat -> dcm -> quat round-trips up to sign',
            assert: `import numpy as np
rng = np.random.default_rng(6)
for _ in range(50):
    q = rng.normal(size=4); q /= np.linalg.norm(q)
    if q[0] < 0:
        q = -q
    assert np.allclose(quat_from_dcm(dcm_from_quat(q)), q, atol=1e-10)`,
          },
          {
            name: 'composition is consistent between quaternions and matrices',
            assert: `import numpy as np
rng = np.random.default_rng(7)
for _ in range(50):
    a = rng.normal(size=4); a /= np.linalg.norm(a)
    b = rng.normal(size=4); b /= np.linalg.norm(b)
    assert np.allclose(dcm_from_quat(quat_mult(a, b)), dcm_from_quat(a) @ dcm_from_quat(b), atol=1e-10)`,
          },
          {
            name: 'quat_from_dcm survives a 180 degree rotation',
            hidden: true,
            assert: `import numpy as np
C = np.diag([1.0, -1.0, -1.0])
q = quat_from_dcm(C)
assert abs(np.linalg.norm(q) - 1.0) < 1e-12
assert np.allclose(dcm_from_quat(q), C, atol=1e-10)`,
          },
          {
            name: 'MRP stays inside the unit ball thanks to the shadow set',
            hidden: true,
            assert: `import numpy as np
rng = np.random.default_rng(8)
for _ in range(200):
    q = rng.normal(size=4); q /= np.linalg.norm(q)
    assert np.linalg.norm(mrp_from_quat(q)) <= 1.0 + 1e-12`,
          },
        ],
      },
      {
        id: 'ex_gimbal_lock',
        title: 'Make gimbal lock happen on purpose',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'Demonstrate the 3-2-1 singularity numerically rather than accepting it on faith.',
          '',
          '- Build the Euler-angle kinematic matrix that maps body rates to Euler-angle rates. Its determinant carries a',
          '  `1/cos(pitch)` factor.',
          '- Drive pitch from 0 toward 90° and plot the condition number of that matrix. Watch it diverge.',
          '- Propagate the same manoeuvre twice, once in Euler angles and once in quaternions, and plot the attitude error',
          '  between the two as pitch passes 89.9°.',
          '- Write one paragraph: what physically is lost at pitch = 90°, and why does the quaternion propagation not care?',
        ].join('\n'),
        starter: `import numpy as np


def euler321_rate_matrix(yaw: float, pitch: float, roll: float) -> np.ndarray:
    """Matrix B such that [yawdot, pitchdot, rolldot] = B @ omega_body.

    For a 3-2-1 sequence,

        B = (1/cos(pitch)) * [[0,        sin(roll),              cos(roll)           ],
                              [0,        cos(roll)*cos(pitch),  -sin(roll)*cos(pitch)],
                              [cos(pitch), sin(roll)*sin(pitch), cos(roll)*sin(pitch)]]

    The 1/cos(pitch) factor is the gimbal-lock singularity. Do NOT guard it
    here -- the point of the exercise is to watch it blow up.
    """
    # TODO: implement exactly as written above.
    raise NotImplementedError


def rate_matrix_condition(pitch: float) -> float:
    """2-norm condition number of the rate matrix at a given pitch (yaw and
    roll set to zero). Plot this against pitch approaching 90 degrees."""
    # TODO: np.linalg.cond(euler321_rate_matrix(0.0, pitch, 0.0))
    raise NotImplementedError
`,
      },
      {
        id: 'ex_slerp',
        title: 'SLERP versus naive component interpolation',
        kind: 'code',
        lang: 'python',
        hours: 2,
        prompt: [
          'Implement `slerp(q0, q1, t)` with the standard shortest-path guard (negate `q1` when `dot(q0, q1) < 0`) and a',
          'small-angle fallback to normalised linear interpolation.',
          '',
          '- Compare against interpolating the four components linearly and renormalising, for a 170° rotation.',
          '- Plot the angular rate implied by each interpolation. SLERP should be constant; LERP should not.',
          '- Show what happens without the sign guard: the interpolation takes the 190° path instead of the 170° one.',
        ].join('\n'),
        starter: `import numpy as np


def slerp(q0: np.ndarray, q1: np.ndarray, t: float) -> np.ndarray:
    """Spherical linear interpolation between two unit scalar-first quaternions.

        cos(Omega) = q0 . q1
        slerp = (sin((1-t) Omega) q0 + sin(t Omega) q1) / sin(Omega)

    Two things must be handled or the result is wrong:
      * if q0 . q1 < 0, negate q1 so the interpolation takes the short path;
      * if Omega is tiny, sin(Omega) underflows -- fall back to normalised
        linear interpolation.
    """
    # TODO: implement with both guards.
    raise NotImplementedError


def nlerp(q0: np.ndarray, q1: np.ndarray, t: float) -> np.ndarray:
    """Naive componentwise interpolation followed by renormalisation.

    Compare its implied angular rate against slerp -- it is not constant.
    """
    # TODO: implement
    raise NotImplementedError
`,
      },
    ],
    cards: [
      {
        id: 'c_euler_rotation_theorem',
        front: 'State Euler rotation theorem.',
        back: 'Any orientation of a rigid body relative to a reference frame can be reached by a single rotation through a principal angle Φ about a fixed principal axis ê. Three parameters always suffice — and always come with a singularity somewhere.',
      },
      {
        id: 'c_principal_angle_from_dcm',
        front: 'Extract the principal rotation angle from a DCM.',
        back: 'cos Φ = (tr(C) − 1)/2, so Φ = arccos((tr(C) − 1)/2) ∈ [0, π]. The axis comes from the skew part of C, or safely from the quaternion.',
        formula: true,
      },
      {
        id: 'c_gimbal_lock',
        front: 'What is gimbal lock in a 3-2-1 sequence and what causes it mathematically?',
        back: 'At pitch θ = ±90° the yaw and roll axes become parallel, so one degree of freedom is lost. The Euler-rate kinematic matrix picks up a 1/cos θ factor and becomes singular — the required angle rates go to infinity.',
      },
      {
        id: 'c_quat_def',
        front: 'Define a unit quaternion in terms of axis and angle.',
        back: 'q = [cos(Φ/2), ê sin(Φ/2)] with ‖q‖ = 1. The half-angle is the reason q and −q describe the same rotation.',
        formula: true,
      },
      {
        id: 'c_quat_product',
        front: 'Write the Hamilton quaternion product.',
        back: '(w₁,v₁) ⊗ (w₂,v₂) = (w₁w₂ − v₁·v₂,  w₁v₂ + w₂v₁ + v₁ × v₂). Non-commutative, exactly like rotation composition.',
        formula: true,
      },
      {
        id: 'c_quat_inverse',
        front: 'Conjugate and inverse of a quaternion.',
        back: 'q* = (w, −v); for a unit quaternion q⁻¹ = q*. In general q⁻¹ = q*/‖q‖².',
        formula: true,
      },
      {
        id: 'c_double_cover',
        front: 'What is the quaternion double cover, and what does it cost?',
        back: 'q and −q map to the same rotation: the unit 3-sphere covers SO(3) twice. Costs: a sign ambiguity that must be resolved (keep the scalar part non-negative) before differencing or interpolating, and a rank-deficient 4-parameter covariance, which is why filters estimate a 3-parameter error state.',
      },
      {
        id: 'c_dcm_from_quat',
        front: 'DCM from a unit scalar-first quaternion q = [w, x, y, z].',
        back: 'C = (w² − vᵀv)I₃ + 2vvᵀ − 2w[v×] (sign of the last term flips with the active/passive convention). Check: tr(C) = 4w² − 1.',
        formula: true,
      },
      {
        id: 'c_hamilton_vs_jpl',
        front: 'Hamilton vs JPL quaternion conventions — what actually differs?',
        back: 'Hamilton: ijk = −1, usually scalar-first, and q₁ ⊗ q₂ corresponds to C(q₁)C(q₂) (used by Eigen, ROS, Solà). JPL/Shuster: ij = −k, scalar-last storage, and the composition order is reversed. Mixing them produces a transposed rotation that still has unit norm and determinant +1.',
      },
      {
        id: 'c_convention_detection',
        front: 'How do you detect which quaternion convention a dataset uses?',
        back: 'Compose two known rotations and see which ordering reproduces the truth; check whether the component with magnitude near 1 for a small rotation sits first or last; and rotate a known vector and compare against the transpose. Never infer it from the variable name.',
      },
      {
        id: 'c_crp_mrp',
        front: 'Define classical and modified Rodrigues parameters and their singularities.',
        back: 'CRP (Gibbs): g = ê tan(Φ/2), singular at Φ = 180°. MRP: σ = ê tan(Φ/4), singular only at Φ = 360°, and σ = q_v/(1 + w).',
        formula: true,
      },
      {
        id: 'c_mrp_shadow',
        front: 'What is the MRP shadow set and why use it?',
        back: 'σˢ = −σ/(σᵀσ) describes the same attitude via the other principal rotation. Switching whenever ‖σ‖ > 1 keeps the parameters bounded by 1 and pushes the singularity permanently out of reach.',
        formula: true,
      },
      {
        id: 'c_attitude_error_quat',
        front: 'Write the attitude error quaternion and its small-angle form.',
        back: 'δq = q_cmd ⊗ q_est⁻¹. For small errors δq ≈ [1, δθ/2], so the vector part is half the rotation-vector error — the standard feedback signal.',
        formula: true,
      },
      {
        id: 'c_active_passive',
        front: 'Active vs passive rotation — what is the difference?',
        back: 'An active (operator) rotation moves the vector within a fixed frame. A passive (coordinate transformation) rotation re-expresses the same physical vector in a rotated frame. They are transposes of one another, and conflating them is the other great source of silent sign errors.',
      },
      {
        id: 'c_rodrigues_formula',
        front: 'Write the Rodrigues rotation formula (exponential map on SO(3)).',
        back: 'R = exp([φ×]) = I + sin Φ [û×] + (1 − cos Φ)[û×]², with φ = Φû the rotation vector.',
        formula: true,
      },
      {
        id: 'c_slerp',
        front: 'Write SLERP between two unit quaternions.',
        back: 'slerp(q₀,q₁,t) = (sin((1−t)Ω)q₀ + sin(tΩ)q₁)/sin Ω with cos Ω = q₀·q₁. Negate q₁ first if the dot product is negative, so you take the short way round.',
        formula: true,
      },
    ],
    quiz: [
      {
        id: 'q_quat_vs_euler',
        q: 'Why do quaternions have no singularity while Euler angles do, and what does the double cover cost you in a filter?',
        choices: [
          'Four parameters with one norm constraint cover SO(3) smoothly, so no chart boundary exists — but the constraint makes a 4-parameter covariance singular, and q/−q ambiguity must be resolved, which is why filters use a 3-parameter error state (the multiplicative EKF)',
          'Quaternions are singularity free because they use half angles, and they cost nothing in a filter',
          'Quaternions avoid the singularity by normalising after every operation; the double cover means the filter must estimate twice as many states',
          'They do have a singularity, at a 360° rotation, but it is never reached in practice',
        ],
        answer: 0,
        explain:
          'Any three-parameter representation of SO(3) must be singular somewhere — a topological fact, not an accident of choice. Quaternions dodge it with a fourth parameter and a norm constraint. The price: the constraint makes a naive 4×4 attitude covariance rank-deficient, and q and −q represent the same attitude. Both are handled by carrying the global attitude as a quaternion and estimating a small 3-vector error (rotation vector or MRP) multiplicatively.',
        b: 1.0,
        bloom: 'understand',
      },
      {
        id: 'q_negative_scalar',
        q: 'A quaternion coming out of your estimator has a negative scalar part. Is it a different rotation, and what do you do in a control error signal?',
        choices: [
          'It is the same rotation (double cover), but you must negate it so the scalar part is non-negative before forming the error — otherwise the controller commands the long way around, up to a 359° slew instead of a 1° correction',
          'It is a different rotation, specifically the inverse, so you should conjugate it',
          'It is invalid and should be rejected as a bad measurement',
          'It is the same rotation and the sign is irrelevant to a controller',
        ],
        answer: 0,
        explain:
          'q and −q give the same DCM, so as an attitude they are identical. But the error quaternion vector part is the feedback signal, and its sign flips with the scalar. Without the shortest-path guard (force w ≥ 0), a small attitude error can be interpreted as nearly a full revolution the other way — a real, spectacular failure mode in slew control.',
        b: 0.8,
        bloom: 'apply',
      },
      {
        id: 'q_dcm_det_minus_one',
        q: 'A DCM read off telemetry has determinant −1. What is wrong?',
        choices: [
          'It is not a rotation but an improper orthogonal matrix — a rotation composed with a reflection, typically caused by a flipped axis sign or by mixing a right-handed frame with a left-handed one (NED vs ENU is a common culprit)',
          'It represents a 180° rotation, which always has determinant −1',
          'The matrix was transposed somewhere in the pipeline',
          'Nothing; determinant −1 is valid for a passive coordinate transformation',
        ],
        answer: 0,
        explain:
          'Every element of SO(3) has determinant exactly +1. A value of −1 means a reflection has crept in: an axis sign flip, a left-handed frame definition, or a column swap. A transpose preserves the determinant, and a 180° rotation is still +1 (e.g. diag(1,−1,−1)). Checking det(C) and CᵀC in your ingest layer catches this before it propagates.',
        b: 0.6,
        bloom: 'analyze',
      },
      {
        id: 'q_hamilton_jpl',
        q: 'How do you detect whether a dataset uses the Hamilton or the JPL quaternion convention?',
        choices: [
          'Compose two known rotations and see which multiplication order reproduces the truth, and rotate a known vector to see whether you get the rotation or its transpose — the two conventions differ in the sign of ijk and in composition order, so the wrong one produces a transposed DCM that still passes orthonormality checks',
          'Check whether the scalar component is stored first or last; that alone determines the convention',
          'Check whether the norm is 1; JPL quaternions are not normalised',
          'The two conventions produce numerically identical results, so no test is possible',
        ],
        answer: 0,
        explain:
          'Storage order (scalar-first vs scalar-last) is a separate axis from the algebra, and most JPL-convention code is scalar-last while most Hamilton code is scalar-first — but that correlation is not a rule. The reliable test is behavioural: compose two known rotations, or rotate a known vector, and compare. A convention mismatch gives you the transpose, which passes CᵀC = I and det = +1 while being wrong.',
        b: 1.3,
        bloom: 'analyze',
      },
    ],
    tags: ['attitude', 'interview', 'spacex-core', 'flight-software'],
    importance: 1.45,
  },

  {
    id: 't1_m17_attitude_kinematics',
    track: 'foundations',
    tier: 1,
    title: 'Attitude Kinematics & Rotational Dynamics',
    summary:
      'Couple attitude kinematics to Euler dynamics into a full rotational 6-state propagator, then add real actuators — reaction wheels, thrusters and TVC gimbals — and verify total system angular momentum is conserved.',
    prereqs: ['t1_m16_attitude_representations', 't1_m14_rigid_body_dynamics'],
    hours: 40,
    topics: [
      'kinematic differential equations for DCM, quaternion, Euler angles and MRP',
      'numerical integration of attitude with re-normalisation',
      'quaternion integration schemes and norm drift',
      'combining kinematics with Euler dynamics into a 6-state rotational system',
      'external torques: gravity gradient, aerodynamic, solar radiation pressure, residual magnetic dipole',
      'reaction wheel and CMG dynamics and momentum coupling',
      'thruster attitude control and minimum impulse bit',
      'thrust vector control gimbal dynamics for launch vehicles',
      'actuator saturation and rate limits',
      'coning motion and coning correction',
    ],
    objectives: [
      'Build and validate a full rotational 6-DOF (attitude plus rate) propagator',
      'Select an integration and renormalisation strategy for attitude',
      'Model reaction wheels including momentum exchange back onto the body',
      'Diagnose angular-momentum drift in a simulation',
    ],
    resources: [
      { title: 'Analytical Mechanics of Space Systems, Ch. 3-4', author: 'Schaub & Junkins', kind: 'book', free: false },
      { title: 'Fundamentals of Spacecraft Attitude Determination and Control, Ch. 3 & 7', author: 'Markley & Crassidis', kind: 'book', free: false },
      {
        title: 'Spacecraft Dynamics and Control: A Practical Engineering Approach',
        author: 'Marcel J. Sidi',
        kind: 'book',
        free: false,
        note: 'Unusually good on actuator sizing and on what the hardware actually does.',
      },
      { title: 'Space Vehicle Dynamics and Control, Ch. 5-7', author: 'Bong Wie', kind: 'book', free: false },
      {
        title: 'Basilisk astrodynamics simulation framework',
        kind: 'tool',
        url: 'https://avslab.github.io/basilisk/',
        free: true,
        note: 'Open-source C++/Python spacecraft simulation from the Schaub lab — a reference implementation to check yourself against.',
      },
    ],
    exercises: [
      {
        id: 'ex_quat_euler_prop',
        title: 'Full rotational propagator with conservation checks',
        kind: 'code',
        lang: 'python',
        hours: 5,
        prompt: [
          'Propagate the coupled attitude-plus-rate system for a torque-free asymmetric body:',
          '',
          '```',
          'qdot = 0.5 Omega(w) q',
          'wdot = I^-1 (-w x (I w))',
          '```',
          '',
          'with `I = diag(10, 20, 30)` kg m² and an initial rate that is not aligned with any principal axis.',
          '',
          'Verify, over 10⁵ steps:',
          '- the quaternion norm stays within 1e-12 of 1 (choose and justify a renormalisation strategy),',
          '- `||H||` in the **body** frame is constant,',
          '- `H` expressed in the **inertial** frame is constant as a vector, not just in magnitude,',
          '- rotational kinetic energy is constant.',
          '',
          'The inertial-frame check is the one that catches a wrong sign in the kinematics; the body-frame magnitude check',
          'alone will not.',
        ].join('\n'),
        starter: `import numpy as np


def omega_matrix(w: np.ndarray) -> np.ndarray:
    """4x4 Omega(w) for scalar-first quaternion kinematics qdot = 0.5 Omega(w) q.

        [  0   -wx  -wy  -wz ]
        [ wx    0    wz  -wy ]
        [ wy   -wz   0    wx ]
        [ wz    wy  -wx   0  ]
    """
    # TODO: build exactly the matrix above.
    raise NotImplementedError


def attitude_deriv(t: float, y: np.ndarray, I: np.ndarray, torque: np.ndarray) -> np.ndarray:
    """Derivative of y = [qw, qx, qy, qz, wx, wy, wz].

    Parameters
    ----------
    I : (3,) principal moments of inertia
    torque : (3,) external torque in the body frame
    """
    # TODO: qdot from omega_matrix, wdot from Euler's equations.
    raise NotImplementedError


def inertial_momentum(y: np.ndarray, I: np.ndarray) -> np.ndarray:
    """Angular momentum expressed in the INERTIAL frame: H_N = C_NB @ (I w)."""
    # TODO: build the DCM from the quaternion, then rotate the body momentum.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'Omega is skew-symmetric, which is what preserves the quaternion norm',
            assert: `import numpy as np
W = omega_matrix(np.array([0.1, -0.2, 0.3]))
assert np.allclose(W.T, -W)`,
          },
          {
            name: 'zero rate leaves the attitude frozen',
            assert: `import numpy as np
y = np.array([1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])
d = attitude_deriv(0.0, y, np.array([10.0, 20.0, 30.0]), np.zeros(3))
assert np.allclose(d, np.zeros(7))`,
          },
          {
            name: 'quaternion derivative is orthogonal to the quaternion (norm preserving)',
            assert: `import numpy as np
q = np.array([0.5, 0.5, 0.5, 0.5])
y = np.concatenate([q, np.array([0.3, -0.1, 0.05])])
d = attitude_deriv(0.0, y, np.array([10.0, 20.0, 30.0]), np.zeros(3))
assert abs(float(np.dot(q, d[:4]))) < 1e-14`,
          },
          {
            name: 'inertial angular momentum is conserved along the torque-free flow',
            hidden: true,
            assert: `import numpy as np
I = np.array([10.0, 20.0, 30.0])
y = np.array([1.0, 0.0, 0.0, 0.0, 0.4, 0.9, 0.2])
H0 = inertial_momentum(y, I)
dt = 1e-3
for _ in range(20000):
    k1 = attitude_deriv(0.0, y, I, np.zeros(3))
    k2 = attitude_deriv(0.0, y + 0.5 * dt * k1, I, np.zeros(3))
    k3 = attitude_deriv(0.0, y + 0.5 * dt * k2, I, np.zeros(3))
    k4 = attitude_deriv(0.0, y + dt * k3, I, np.zeros(3))
    y = y + (dt / 6.0) * (k1 + 2 * k2 + 2 * k3 + k4)
    y[:4] /= np.linalg.norm(y[:4])
assert np.allclose(inertial_momentum(y, I), H0, atol=1e-6)`,
          },
        ],
      },
      {
        id: 'ex_reaction_wheels',
        title: 'Three reaction wheels, and a momentum audit',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: [
          'Add three orthogonal reaction wheels to the propagator. The body equation becomes',
          '',
          '```',
          'I wdot + w x (I w + h_w) = T_ext - h_w_dot',
          '```',
          '',
          'with `h_w = J_w Omega_w` the wheel momentum in body axes and `h_w_dot` the commanded wheel torque.',
          '',
          '- Command a 30° slew with a simple quaternion-feedback law and watch the wheels take up the momentum.',
          '- Assert that total system angular momentum in the **inertial** frame is conserved to integrator tolerance with',
          '  `T_ext = 0` — this is the single best test for a wheel model.',
          '- Saturate a wheel at its momentum limit and show the resulting attitude error, then implement a simple',
          '  magnetorquer dump and show the recovery.',
        ].join('\n'),
        starter: `import numpy as np


def wheel_body_deriv(
    t: float,
    y: np.ndarray,
    I: np.ndarray,
    Jw: np.ndarray,
    wheel_torque: np.ndarray,
    ext_torque: np.ndarray,
) -> np.ndarray:
    """Derivative of y = [q(4), omega(3), wheel_speeds(3)] for three orthogonal wheels.

    Body equation:
        I wdot + w x (I w + h_w) = T_ext - hdot_w
    with h_w = Jw * wheel_speeds (elementwise, wheels along the body axes) and
    hdot_w = wheel_torque, the commanded torque on each wheel.

    Wheel equation:
        Jw * wheel_accel = wheel_torque
    """
    # TODO: unpack, build h_w, apply the two equations above, and return the
    #       stacked derivative. Remember the MINUS sign on the reaction torque.
    raise NotImplementedError


def total_inertial_momentum(y: np.ndarray, I: np.ndarray, Jw: np.ndarray) -> np.ndarray:
    """Body plus wheel angular momentum expressed in the INERTIAL frame.

    This is the quantity that must stay exactly constant with no external
    torque. Comparing body-frame magnitudes instead will hide a sign error.
    """
    # TODO: H_body = C_NB @ (I * w + Jw * wheel_speeds)
    raise NotImplementedError
`,
      },
      {
        id: 'ex_tvc_torque',
        title: 'TVC gimbal authority for a launch vehicle',
        kind: 'analysis',
        hours: 3,
        prompt: [
          'For a booster with 7 600 kN of thrust, a gimbal-to-centre-of-mass distance of 22 m, a pitch inertia of',
          '3.5 × 10⁸ kg m², and ±5° of gimbal travel at 10 °/s:',
          '',
          '- Compute the maximum control torque `T L sin(delta)` and the resulting maximum angular acceleration.',
          '- Compare it against the aerodynamic destabilising torque at max-Q for a 2° angle of attack, using a plausible',
          '  normal-force coefficient slope and a centre of pressure 8 m ahead of the centre of mass.',
          '- State the control-authority margin, and explain what the gimbal *rate* limit does to achievable bandwidth.',
          '',
          'Write up whether this vehicle is controllable at max-Q, and what you would change if it were not.',
        ].join('\n'),
      },
    ],
    cards: [
      {
        id: 'c_dcm_kinematics',
        front: 'Kinematic differential equation for a DCM.',
        back: 'Ċ = −[ω×]C, where C transforms inertial components into body components and ω is the body rate expressed in body axes.',
        formula: true,
      },
      {
        id: 'c_quat_kinematics',
        front: 'Write the quaternion kinematic equation.',
        back: 'q̇ = ½ Ω(ω) q = ½ q ⊗ [0, ω], with Ω(ω) = [[0, −ωᵀ],[ω, −[ω×]]] for scalar-first quaternions.',
        formula: true,
      },
      {
        id: 'c_omega_skew',
        front: 'Why does the quaternion kinematic equation preserve unit norm exactly?',
        back: 'Ω(ω) is skew-symmetric, so d(qᵀq)/dt = qᵀΩq = 0. The continuous flow stays on the unit sphere; only the discrete integrator pushes it off.',
        formula: true,
      },
      {
        id: 'c_norm_drift_fix',
        front: 'Your quaternion norm reaches 1.0003 after 10⁶ RK4 steps. Consequence and two fixes?',
        back: 'The derived DCM picks up a scale factor of ‖q‖² ≈ 1.0006, so every rotated vector is 0.06% too long and the matrix is no longer orthonormal. Fix by renormalising every step (cheap, standard) or by using a norm-preserving update q_{k+1} = q_k ⊗ exp(½ωΔt).',
      },
      {
        id: 'c_mrp_kinematics',
        front: 'MRP kinematic differential equation.',
        back: 'σ̇ = ¼[(1 − σᵀσ)I₃ + 2[σ×] + 2σσᵀ] ω',
        formula: true,
      },
      {
        id: 'c_coning',
        front: 'What is coning motion, and why does naive rate integration get it wrong?',
        back: 'When the angular velocity vector itself rotates, finite rotations do not commute, so summing ωΔt underestimates the net rotation and leaves a secular attitude error. Strapdown algorithms add multi-sample coning-correction terms to recover it.',
      },
      {
        id: 'c_gravity_gradient',
        front: 'Write the gravity gradient torque.',
        back: 'T_gg = (3μ/r³)(r̂ × I r̂), with r̂ the nadir direction in body axes. It vanishes when a principal axis points at nadir — the basis of gravity-gradient stabilisation.',
        formula: true,
      },
      {
        id: 'c_magnetic_torque',
        front: 'Torque from a residual magnetic dipole, and from a magnetorquer.',
        back: 'T = m × B. It is always perpendicular to B, so no magnetic actuator can produce torque about the local field direction — the reason magnetic-only control needs orbital motion to become controllable.',
        formula: true,
      },
      {
        id: 'c_srp_torque',
        front: 'Order of magnitude of solar radiation pressure, and how it makes a torque.',
        back: 'P_SRP ≈ 4.5 × 10⁻⁶ N/m² at 1 AU. Force ≈ P·A·(1 + reflectivity); it becomes a torque through the offset between the centre of pressure and the centre of mass, and it dominates the disturbance budget at GEO.',
        formula: true,
      },
      {
        id: 'c_wheel_body_eq',
        front: 'Body equation of motion with reaction wheels.',
        back: 'I ω̇ + ω × (Iω + h_w) = T_ext − ḣ_w, with h_w the total wheel momentum mapped into body axes. The wheel torque appears with a minus sign because it is a reaction.',
        formula: true,
      },
      {
        id: 'c_wheel_momentum_audit',
        front: 'Best single test for a reaction-wheel simulation?',
        back: 'With zero external torque, total angular momentum in the *inertial* frame — body plus wheels — must be constant as a vector. Body-frame magnitude alone passes even when the kinematics have a sign error.',
      },
      {
        id: 'c_cmg',
        front: 'Control moment gyro vs reaction wheel — what is the trade?',
        back: 'A CMG gimbals a constant-speed rotor, producing torque by changing momentum *direction*: far more torque per watt and per kilogram. The cost is singular gimbal configurations where no torque can be produced in some direction, requiring steering logic to avoid or escape them.',
      },
      {
        id: 'c_min_impulse_bit',
        front: 'What is minimum impulse bit and why does it matter?',
        back: 'The smallest impulse a thruster can reliably deliver, set by valve open/close time. It sets the finest attitude and rate increment available, so it puts a floor on pointing deadband and produces limit-cycle behaviour in thruster-only control.',
      },
      {
        id: 'c_tvc_torque',
        front: 'Control torque from a gimballed engine.',
        back: 'T_c = F·L·sin δ ≈ F·L·δ, with L the distance from the gimbal to the centre of mass and δ the deflection. Gimbal rate and deflection limits cap both the achievable torque and the loop bandwidth.',
        formula: true,
      },
      {
        id: 'c_saturation_windup',
        front: 'What does actuator saturation do to a controller with integral action?',
        back: 'The integrator keeps accumulating error while the actuator cannot respond, so the command overshoots badly on recovery — integrator windup. Fix with clamping, back-calculation anti-windup, or by conditioning the integrator on being out of saturation.',
      },
    ],
    quiz: [
      {
        id: 'q_omega_matrix',
        q: 'In q̇ = ½Ω(ω)q with scalar-first quaternions, what is the structure of Ω(ω) and why does it matter?',
        choices: [
          'Ω = [[0, −ωᵀ],[ω, −[ω×]]] — skew-symmetric, which is exactly what makes the exact solution preserve the unit norm',
          'Ω is symmetric with ω on the diagonal, so the norm grows unless renormalised',
          'Ω = [[0, ωᵀ],[ω, [ω×]]], and it is the identity when ω = 0',
          'Ω is the cross-product matrix of ω padded with zeros, and its structure is arbitrary',
        ],
        answer: 0,
        explain:
          'The first row couples the scalar to the vector part through −ωᵀ, the first column through +ω, and the lower-right block is −[ω×]. Skew-symmetry gives d(qᵀq)/dt = qᵀΩq = 0, the analytic norm-preservation property. Discrete integration still drifts, which is why you renormalise — but if your Ω is not skew, you have a sign error, not a round-off problem.',
        b: 0.9,
        bloom: 'recall',
      },
      {
        id: 'q_norm_drift',
        q: 'After 10⁶ RK4 steps your quaternion norm reads 1.0003. What is the consequence, and what are two fixes?',
        choices: [
          'The DCM built from it carries a scale factor of about 1.0006 and is no longer orthonormal, so rotated vectors are systematically too long; fix by renormalising every step, or by switching to a norm-preserving exponential-map update',
          'Nothing measurable happens; the norm error is well within float64 precision',
          'The attitude is rotated by 0.03°; fix by subtracting the excess from the scalar component',
          'The quaternion now represents a reflection; fix by negating it',
        ],
        answer: 0,
        explain:
          'The rotation matrix built from a non-unit quaternion scales by ‖q‖², so a norm of 1.0003 stretches every rotated vector by 0.06% — a systematic error that a downstream filter will interpret as a real signal. It is not merely a rotation offset. The two standard fixes are per-step renormalisation and integrating with q_{k+1} = q_k ⊗ exp(½ωΔt), which is exactly unit-norm by construction.',
        b: 0.9,
        bloom: 'analyze',
      },
      {
        id: 'q_wheel_momentum_drift',
        q: 'Total system angular momentum drifts in your reaction-wheel simulation with no external torque. Name three likely bugs.',
        choices: [
          'The wheel reaction torque is not applied back onto the body; the wheel momentum h_w is omitted from the gyroscopic term ω × (Iω + h_w); or the momentum audit mixes frames, comparing a body-frame sum against an inertial-frame one',
          'The integrator step is too large, which is the only possible cause',
          'The inertia tensor is not diagonal, which always breaks momentum conservation',
          'The wheels have friction, which always destroys angular momentum',
        ],
        answer: 0,
        explain:
          'All three named bugs break the action-reaction bookkeeping or the frame bookkeeping, and all produce a secular drift. Step size produces a small oscillation, not a one-way trend, and is easy to rule out by halving it. A non-diagonal inertia is perfectly fine. Wheel bearing friction is an internal torque: it converts momentum between wheel and body and dissipates energy, but leaves total angular momentum untouched.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'q_gravity_gradient',
        q: 'A long, slender satellite in LEO experiences a gravity gradient torque. When does that torque vanish?',
        choices: [
          'When a principal axis of inertia is aligned with the nadir direction, since T = (3μ/r³)(r̂ × I r̂) and I r̂ is then parallel to r̂',
          'Only in a perfectly circular orbit',
          'When the satellite is in eclipse',
          'Never; the gravity gradient torque is always non-zero in orbit',
        ],
        answer: 0,
        explain:
          'The cross product vanishes when I r̂ is parallel to r̂, i.e. when r̂ is an eigenvector of the inertia tensor. That is the basis of gravity-gradient stabilisation: point the minimum-inertia axis at nadir and the torque restores it after a disturbance. The torque scales as 1/r³, so it is a dominant disturbance in LEO and negligible at GEO.',
        b: 0.8,
        bloom: 'understand',
      },
    ],
    tags: ['attitude', 'dynamics', 'simulation', 'interview', 'spacex-core'],
    importance: 1.3,
  },

  {
    id: 't1_m18_atmospheric_flight',
    track: 'foundations',
    tier: 1,
    title: 'Atmospheric Flight & Vehicle Aerodynamics',
    summary:
      'Why a launch vehicle is aerodynamically unstable, what q̄α means to the structures team, and how bending and slosh modes constrain the control bandwidth you are allowed to use.',
    prereqs: ['t1_m15_rotating_frames', 't1_m13_classical_mechanics'],
    hours: 40,
    topics: [
      'standard atmosphere models: US Standard 1976, exponential, NRLMSISE-00',
      'density, pressure and temperature vs altitude',
      'dynamic pressure and max-Q',
      'Mach number and the subsonic / transonic / supersonic / hypersonic regimes',
      'drag coefficient vs Mach',
      'angle of attack and sideslip; body vs wind frame',
      'normal force, centre of pressure vs centre of gravity, static margin',
      'aerodynamic instability of a boosting rocket',
      'the q-alpha load indicator and load relief control',
      'wind profiles and gust models (Dryden, von Karman), wind shear',
      'bending modes, flexible body dynamics and structural filter design',
      'propellant slosh as a pendulum or mass-spring',
      'control-structure interaction',
      'grid fins and aerodynamic control surfaces',
      'ballistic coefficient and lift-to-drag ratio in entry',
    ],
    objectives: [
      'Compute dynamic pressure and locate max-Q on a trajectory',
      'Explain why a launch vehicle is aerodynamically unstable and what that implies for the controller',
      'Identify a bending mode in a Bode plot and design a notch filter for it',
      'Describe load relief and its trade against trajectory accuracy',
    ],
    resources: [
      { title: 'Space Vehicle Dynamics and Control — launch vehicle chapters', author: 'Bong Wie', kind: 'book', free: false },
      {
        title: 'Analysis and Design of Space Vehicle Flight Control Systems',
        author: 'Arthur L. Greensite',
        kind: 'book',
        free: false,
        note: 'The classic NASA-era reference on launch vehicle control, bending and slosh.',
      },
      { title: 'Introduction to Flight / Fundamentals of Aerodynamics', author: 'John D. Anderson', kind: 'book', free: false },
      { title: 'Automatic Control of Aircraft and Missiles', author: 'John H. Blakelock', kind: 'book', free: false },
      {
        title: 'NASA Technical Reports Server — SLS ascent control and load relief papers',
        kind: 'paper',
        url: 'https://ntrs.nasa.gov',
        free: true,
        note: 'Search for ascent flight control, load relief and bending filter design; the SLS-era papers are unusually explicit.',
      },
    ],
    exercises: [
      {
        id: 'ex_atmosphere_model',
        title: 'Standard atmosphere, exponential and US-1976',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'Implement two atmosphere models and compare them.',
          '',
          '- `exponential_atmosphere(h)` with `rho = rho0 exp(-h/H)`, `rho0 = 1.225`, `H = 8500 m`.',
          '- `us1976(h)` for the troposphere and lower stratosphere (0-20 km): a 6.5 K/km lapse rate to 11 km, then',
          '  isothermal at 216.65 K, using the hydrostatic relation and the ideal gas law.',
          '- Also return speed of sound `a = sqrt(gamma R T)` with `gamma = 1.4`, `R = 287.053 J/(kg K)`.',
          '',
          'Plot both densities on a log axis from 0 to 80 km and quantify the error of the exponential fit across that range.',
        ].join('\n'),
        starter: `import math

RHO0 = 1.225        # kg/m^3
P0 = 101325.0       # Pa
T0 = 288.15         # K
LAPSE = 0.0065      # K/m, troposphere
R_AIR = 287.053     # J/(kg K)
GAMMA = 1.4
G0 = 9.80665


def exponential_atmosphere(h: float, rho0: float = RHO0, h_scale: float = 8500.0) -> float:
    """Density in kg/m^3 from a single-scale-height exponential fit."""
    # TODO: one line.
    raise NotImplementedError


def us1976(h: float) -> tuple[float, float, float]:
    """US Standard Atmosphere 1976 for 0 <= h <= 20 km.

    Returns
    -------
    (temperature_K, pressure_Pa, density_kg_m3)

    Troposphere (h < 11 km): T = T0 - LAPSE h,
        p = P0 (T/T0) ** (G0 / (LAPSE * R_AIR))
    Lower stratosphere (11-20 km): isothermal at 216.65 K,
        p = p11 * exp(-G0 (h - 11000) / (R_AIR * 216.65))
    """
    # TODO: implement both layers and finish with rho = p / (R_AIR * T).
    raise NotImplementedError


def speed_of_sound(temperature_k: float) -> float:
    """a = sqrt(gamma R T), m/s."""
    # TODO: implement
    raise NotImplementedError
`,
        tests: [
          {
            name: 'sea-level conditions',
            assert: `T, p, rho = us1976(0.0)
assert abs(T - 288.15) < 1e-9
assert abs(p - 101325.0) < 1e-6
assert abs(rho - 1.225) < 1e-3`,
          },
          {
            name: 'tropopause at 11 km',
            assert: `T, p, rho = us1976(11000.0)
assert abs(T - 216.65) < 1e-6
assert abs(p - 22632.0) < 5.0
assert abs(rho - 0.3639) < 1e-3`,
          },
          {
            name: 'speed of sound at sea level is about 340 m/s',
            assert: `assert abs(speed_of_sound(288.15) - 340.29) < 0.5`,
          },
          {
            name: 'exponential fit is within a factor of two at 20 km',
            hidden: true,
            assert: `_, _, rho = us1976(20000.0)
approx = exponential_atmosphere(20000.0)
assert 0.5 < approx / rho < 2.0`,
          },
        ],
      },
      {
        id: 'ex_maxq',
        title: 'Find max-Q and the q-alpha profile',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'Take your gravity-turn ascent from the dynamics module, add the atmosphere model, and compute `q = 0.5 rho v^2`',
          'and `q alpha` along the trajectory.',
          '',
          '- Find max-Q: report its value in kPa, the altitude and the Mach number at which it occurs. For an orbital',
          '  launcher expect roughly 25-40 kPa somewhere between 10 and 14 km, near Mach 1.2-1.5.',
          '- Inject a wind shear (a 30 m/s gust over 1 km of altitude) and plot the resulting `q alpha` spike.',
          '- Implement a crude load-relief law that commands a fraction of the measured lateral acceleration back into the',
          '  attitude command, and show the peak `q alpha` falling and the terminal position error rising.',
          '',
          'Success: you can state the trade — how many kPa-deg of load you bought with how many metres of insertion error.',
        ].join('\n'),
        starter: `import numpy as np


def dynamic_pressure(rho: float, v_rel: float) -> float:
    """q = 0.5 rho v_rel^2, in pascals. v_rel is speed relative to the AIR."""
    # TODO: one line.
    raise NotImplementedError


def angle_of_attack(v_body_rel: np.ndarray) -> float:
    """Angle of attack, radians, from the air-relative velocity in body axes.

    alpha = atan2(w, u) for body components (u, v, w). Use atan2, not atan.
    """
    # TODO: implement
    raise NotImplementedError


def q_alpha_profile(
    times: np.ndarray, altitudes: np.ndarray, speeds: np.ndarray, alphas: np.ndarray,
    rho_of_h,
) -> tuple[np.ndarray, float, float]:
    """Dynamic pressure and q*alpha along a trajectory.

    Returns
    -------
    (q_array, max_q_pa, altitude_of_max_q_m)

    q*alpha is conventionally quoted in kPa-deg, so convert before reporting.
    """
    # TODO: evaluate rho at each altitude, build q, find the maximum and where.
    raise NotImplementedError
`,
      },
      {
        id: 'ex_bending_notch',
        title: 'Destabilise a TVC loop with a bending mode, then fix it',
        kind: 'build',
        hours: 5,
        prompt: [
          'Build a rigid-body pitch TVC plant with an unstable pole (an aerodynamically unstable booster), close a PD loop,',
          'and confirm stability with a gain margin of at least 6 dB and phase margin at least 30°.',
          '',
          '- Add a lightly damped second-order bending mode at 12 Hz (zeta = 0.005) in series, with the gyro mounted so that',
          '  the mode appears with positive sign in the feedback path.',
          '- Show on a Bode plot that the mode crosses 0 dB with the wrong phase and the closed loop goes unstable.',
          '- Design a notch filter at 12 Hz and show the mode is now gain-stabilised with at least 8 dB of attenuation,',
          '  without eating more than ~10° of phase margin at the rigid-body crossover.',
          '- Then move the mode to 3 Hz, just above a 2 Hz crossover, and explain why a notch no longer works and what you',
          '  would do instead.',
        ].join('\n'),
      },
    ],
    cards: [
      {
        id: 'c_dynamic_pressure',
        front: 'Write dynamic pressure.',
        back: 'q̄ = ½ρv². Units of pressure; every aerodynamic force is q̄ × reference area × a coefficient.',
        formula: true,
      },
      {
        id: 'c_maxq_values',
        front: 'Typical max-Q value and where it occurs for an orbital launcher.',
        back: 'Roughly 25-40 kPa, at 10-14 km altitude and Mach 1.2-1.5. It is a maximum because ρ falls exponentially while v² grows: the product peaks.',
      },
      {
        id: 'c_exponential_atmosphere',
        front: 'Exponential atmosphere model and its scale height.',
        back: 'ρ = ρ₀e^(−h/H), with ρ₀ = 1.225 kg/m³ and H ≈ 7.2-8.5 km for the lower atmosphere. Convenient for analysis, wrong above ~30 km.',
        formula: true,
      },
      {
        id: 'c_us1976_anchors',
        front: 'US Standard Atmosphere 1976 anchor values at sea level and 11 km.',
        back: 'Sea level: T = 288.15 K, p = 101 325 Pa, ρ = 1.225 kg/m³, lapse rate 6.5 K/km. Tropopause (11 km): T = 216.65 K, p = 22 632 Pa, ρ = 0.3639 kg/m³.',
        formula: true,
      },
      {
        id: 'c_speed_of_sound',
        front: 'Speed of sound in air, and its sea-level value.',
        back: 'a = √(γRT) with γ = 1.4 and R = 287.053 J/(kg·K); at 288.15 K that is 340.3 m/s. It depends on temperature only, not on pressure or density.',
        formula: true,
      },
      {
        id: 'c_mach_regimes',
        front: 'Name the flow regimes by Mach number.',
        back: 'Subsonic M < 0.8 · transonic 0.8-1.2 (drag rise, shifting centre of pressure) · supersonic 1.2-5 · hypersonic M > 5 (real-gas effects, strong shock layer).',
      },
      {
        id: 'c_alpha_beta',
        front: 'Define angle of attack and sideslip.',
        back: 'α is the angle between the body x axis and the velocity vector projected into the x-z body plane; β is the angle of the velocity out of that plane. Aerodynamic forces respond to the wind-relative velocity, not the inertial one.',
      },
      {
        id: 'c_static_margin',
        front: 'Define static margin and the sign that means stable.',
        back: 'SM = (x_cp − x_cg)/d in calibres. Positive — centre of pressure aft of the centre of mass — is statically stable, because a disturbance produces a restoring moment.',
        formula: true,
      },
      {
        id: 'c_lv_unstable',
        front: 'Why is a boosting launch vehicle statically unstable in pitch?',
        back: 'It is a slender body with its centre of pressure well forward (near the nose and payload fairing) and its centre of mass far aft over the full tanks and engines, and it carries no tail fins. Any α produces a moment that increases α, so the TVC loop must actively stabilise it.',
      },
      {
        id: 'c_qalpha',
        front: 'What is q̄α and why does the structures team care?',
        back: 'The product of dynamic pressure and angle of attack, proportional to the aerodynamic normal force and therefore to the bending moment on the airframe. It is a hard structural constraint during ascent, typically quoted in kPa-deg.',
        formula: true,
      },
      {
        id: 'c_load_relief',
        front: 'What is load relief and what does it cost?',
        back: 'The controller partially steers into the wind — accepting attitude and trajectory error to reduce α and hence q̄α. The cost is insertion accuracy and extra Δv; the benefit is not breaking the vehicle. It is active only through the high-q̄ region.',
      },
      {
        id: 'c_bending_modes',
        front: 'What are bending modes and why do they threaten a control loop?',
        back: 'Elastic deformation of the airframe, typically first mode at 2-10 Hz for a large launch vehicle, with damping ratios of ~0.005. Rate gyros sense the local slope of the deformed structure, so the mode feeds straight back into the controller and can go unstable.',
      },
      {
        id: 'c_gain_vs_phase_stab',
        front: 'Gain stabilisation vs phase stabilisation of a flexible mode.',
        back: 'Gain-stabilise: attenuate the mode below 0 dB with a notch or roll-off — the right answer when it sits well above crossover. Phase-stabilise: let it exceed 0 dB but shape the phase so the loop still encircles correctly — necessary when the mode is too close to crossover to attenuate without destroying phase margin.',
      },
      {
        id: 'c_slosh_frequency',
        front: 'First slosh mode frequency in a cylindrical tank.',
        back: 'ω² = (1.841 g_eff/R)·tanh(1.841 h/R), with R the tank radius, h the fill height and g_eff the axial acceleration. For a large booster this lands near 0.2-1 Hz — uncomfortably close to rigid-body control bandwidth.',
        formula: true,
      },
      {
        id: 'c_ballistic_coefficient',
        front: 'Define ballistic coefficient.',
        back: 'β = m/(C_D A), in kg/m². High β means the body penetrates deeper before decelerating; low β decelerates high in thin air, which is gentler on the thermal protection system.',
        formula: true,
      },
      {
        id: 'c_grid_fins',
        front: 'What do grid fins do on a returning booster, and why grid rather than planar?',
        back: 'They provide aerodynamic control authority during the unpowered supersonic descent, where the engines are off. The lattice form stays efficient across transonic and supersonic Mach with a short chord, keeps hinge moments low, and stows flat against the body.',
      },
    ],
    quiz: [
      {
        id: 'q_lv_instability',
        q: 'Why is a launch vehicle statically unstable in pitch, and what does that imply for the controller?',
        choices: [
          'Its centre of pressure sits forward of its centre of mass, so any α produces a divergent moment; the TVC loop must have bandwidth comfortably above the unstable pole, and a control outage of even a second or two is unrecoverable',
          'It is statically stable but dynamically unstable, so only damping is needed',
          'Instability comes from engine gimbal lag, and is removed by a faster actuator',
          'It is unstable only above Mach 1, so the controller can be open-loop below that',
        ],
        answer: 0,
        explain:
          'A slender finless body has its centre of pressure near the nose while the centre of mass is far aft over full tanks — the opposite of the stable arrangement on a finned model rocket. The resulting unstable rigid-body pole has a time-to-double of order a second, so the loop must be closed and fast. This is exactly why loss of TVC authority is catastrophic rather than merely degrading.',
        b: 0.8,
        bloom: 'understand',
      },
      {
        id: 'q_qalpha',
        q: 'What is q̄α and why is it a constraint rather than just a number?',
        choices: [
          'Dynamic pressure times angle of attack, proportional to the aerodynamic normal force and hence to the bending moment on the airframe — exceeding the structural limit breaks the vehicle, so guidance and control must keep it inside a certified envelope',
          'The product of dynamic pressure and the gimbal angle, which limits actuator authority',
          'A measure of engine performance loss due to atmospheric back pressure',
          'The heating rate on the nose cone, limited by the thermal protection system',
        ],
        answer: 0,
        explain:
          'Normal force scales as q̄·C_Nα·α·A, so for a given vehicle the bending moment tracks q̄α directly. Structures certify a q̄α envelope, and ascent guidance plus load relief exist largely to stay inside it while the wind does its best to push α around.',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'q_bending_stabilization',
        q: 'A bending mode sits at 12 Hz and your rigid-body control bandwidth is 2 Hz. Do you gain-stabilise or phase-stabilise, and why?',
        choices: [
          'Gain-stabilise: the mode is six times above crossover, so a notch plus natural roll-off can push it well below 0 dB without costing meaningful phase margin at 2 Hz',
          'Phase-stabilise: high-frequency modes always need phase shaping because notches are unreliable',
          'Neither: raise the control bandwidth above 12 Hz so the mode falls inside the loop',
          'Gain-stabilise by lowering the overall loop gain until the mode is attenuated, accepting the slower rigid-body response',
        ],
        answer: 0,
        explain:
          'With a factor of six separation, the loop is already rolling off at the mode frequency, and a notch centred at 12 Hz adds the remaining attenuation while its phase distortion at 2 Hz is small. Phase stabilisation is what you resort to when the mode is close to crossover — say 3 Hz against a 2 Hz bandwidth — where you cannot attenuate it without wrecking the rigid-body loop. Reducing overall gain would also slow the unstable rigid body, which you cannot afford.',
        b: 1.2,
        bloom: 'analyze',
      },
      {
        id: 'q_slosh_near_crossover',
        q: 'A propellant slosh mode sits at 0.4 Hz, right near your rigid-body crossover. What goes wrong?',
        choices: [
          'The lightly damped slosh mass couples into the control loop at the frequency where loop gain is highest, so the controller can pump it — producing a limit cycle or outright instability; fixes are baffles to add damping, notching, or explicitly modelling the slosh state in the controller',
          'The slosh mode simply adds mass, lowering the natural frequency of the vehicle with no stability consequence',
          'Slosh only matters on orbit, where there is no axial acceleration',
          'The mode is far enough from the bending modes that it can be ignored',
        ],
        answer: 0,
        explain:
          'Slosh modes have very little inherent damping (~0.001-0.01) and, unlike bending, sit low in frequency — often right on top of the rigid-body bandwidth. There the controller has full authority to drive them, and the energy exchange can build into a divergent oscillation. Baffles are the standard hardware answer because they add real damping rather than merely hiding the mode from the loop.',
        b: 1.2,
        bloom: 'analyze',
      },
    ],
    tags: ['aero', 'launch-vehicle', 'control', 'spacex-core'],
    importance: 1.25,
  },

  /* ══ TIER 2 — ASTRODYNAMICS ══════════════════════════════════════════════ */

  {
    id: 't2_m19_two_body',
    track: 'foundations',
    tier: 2,
    title: 'The Two-Body Problem & Orbital Elements',
    summary:
      'Derive Kepler laws rather than quoting them, convert state vectors to orbital elements with every edge case handled, and solve Kepler equation robustly for eccentricities from circular to nearly parabolic.',
    prereqs: ['t1_m15_rotating_frames', 't0_m08_odes', 't0_m10_numerical_methods'],
    hours: 75,
    topics: [
      'Newton law of gravitation and the restricted two-body equation',
      'constants of motion: specific angular momentum, eccentricity vector, specific energy',
      'the orbit equation and conic sections',
      'Kepler three laws, derived',
      'circular, elliptical, parabolic and hyperbolic orbits',
      'classical orbital elements and equinoctial alternatives',
      'state vector to orbital element conversion, both directions',
      'Kepler equation: elliptic, hyperbolic and parabolic (Barker)',
      'true, eccentric and mean anomaly',
      'time of flight',
      'universal variables and the Stumpff functions',
      'Lagrange f and g coefficients',
      'vis-viva',
      'ground tracks and orbit types: LEO, MEO, GEO, GTO, SSO, Molniya, frozen',
      'TLE format and SGP4',
    ],
    objectives: [
      'Convert state vector to classical elements and back with full quadrant and edge-case correctness',
      'Solve Kepler equation robustly for e approaching 1',
      'Propagate an orbit both numerically and analytically and show the two agree',
      'Reproduce a real ground track from a TLE',
    ],
    resources: [
      {
        title: 'Orbital Mechanics for Engineering Students',
        author: 'Howard D. Curtis',
        kind: 'book',
        free: false,
        note: 'The best first book: worked examples with code, and the standard undergraduate text.',
      },
      {
        title: 'Fundamentals of Astrodynamics',
        author: 'Bate, Mueller & White',
        kind: 'book',
        free: false,
        note: 'Dover, 1971. Cheap, classic, universal-variable-centric, and still used professionally.',
      },
      {
        title: 'Fundamentals of Astrodynamics and Applications (4th ed.)',
        author: 'David A. Vallado',
        kind: 'book',
        free: false,
        note: 'The professional reference, with numbered algorithms you can implement verbatim.',
      },
      {
        title: 'Orbital Mechanics & Astrodynamics',
        author: 'Bryan Weber',
        kind: 'site',
        url: 'https://orbital-mechanics.space',
        free: true,
        note: 'Free and complete: reference frames, orbital elements, Kepler equation, universal anomaly, impulsive manoeuvres, interplanetary transfer.',
      },
      {
        title: 'An Introduction to the Mathematics and Methods of Astrodynamics',
        author: 'Richard H. Battin',
        kind: 'book',
        free: false,
        note: 'The deep mathematical treatment. Read it after Curtis, not instead of it.',
      },
    ],
    exercises: [
      {
        id: 'ex_rv2coe',
        title: 'State vector to orbital elements, edge cases included',
        kind: 'code',
        lang: 'python',
        hours: 6,
        prompt: [
          'Implement `rv2coe(r, v, mu)` returning `(a, e, i, raan, argp, nu)` in km and radians, and `coe2rv` for the',
          'inverse.',
          '',
          'Handle every degenerate case explicitly rather than producing NaN:',
          '- **circular inclined** (e ≈ 0): argument of periapsis is undefined — return the argument of latitude `u = argp + nu`.',
          '- **elliptical equatorial** (i ≈ 0): RAAN is undefined — return the longitude of periapsis.',
          '- **circular equatorial**: both undefined — return the true longitude.',
          '- **retrograde** orbits: the inclination quadrant must come out right.',
          '',
          'Validate against Curtis Example 4.3: `r = [-6045, -3490, 2500]` km, `v = [-3.457, 6.618, 2.533]` km/s.',
        ].join('\n'),
        starter: `import numpy as np

MU_EARTH = 398600.4418  # km^3/s^2


def rv2coe(r: np.ndarray, v: np.ndarray, mu: float = MU_EARTH):
    """Classical orbital elements from an inertial state vector.

    Returns
    -------
    (a, e, i, raan, argp, nu) with angles in radians.

    Method
    ------
    h = r x v                       specific angular momentum
    n = zhat x h                    node vector
    e = ((v^2 - mu/r) r - (r.v) v) / mu
    i     = arccos(h_z / |h|)
    raan  = arctan2(n_y, n_x)
    argp  = angle from n to e, flipped if e_z < 0
    nu    = angle from e to r, flipped if r.v < 0
    a     = 1 / (2/|r| - |v|^2/mu)

    Use a tolerance (say 1e-8) to detect the degenerate cases described in the
    prompt, and document what you return in each.
    """
    # TODO: implement, using atan2 everywhere an angle spans more than pi.
    raise NotImplementedError


def coe2rv(a: float, e: float, i: float, raan: float, argp: float, nu: float, mu: float = MU_EARTH):
    """Inertial state vector from classical elements.

    Build r and v in the perifocal frame, then rotate by R3(-raan) R1(-i) R3(-argp).
    """
    # TODO: implement
    raise NotImplementedError
`,
        tests: [
          {
            name: 'Curtis example 4.3 elements',
            assert: `import numpy as np
r = np.array([-6045.0, -3490.0, 2500.0])
v = np.array([-3.457, 6.618, 2.533])
a, e, i, raan, argp, nu = rv2coe(r, v)
assert abs(a - 8788.08) < 0.5
assert abs(e - 0.171212) < 1e-5
assert abs(np.degrees(i) - 153.2492) < 1e-3
assert abs(np.degrees(raan) - 255.2793) < 1e-3
assert abs(np.degrees(argp) - 20.0681) < 1e-3
assert abs(np.degrees(nu) - 28.4458) < 1e-3`,
          },
          {
            name: 'round trip through coe2rv reproduces the state',
            assert: `import numpy as np
r = np.array([-6045.0, -3490.0, 2500.0])
v = np.array([-3.457, 6.618, 2.533])
r2, v2 = coe2rv(*rv2coe(r, v))
assert np.allclose(r2, r, atol=1e-6) and np.allclose(v2, v, atol=1e-9)`,
          },
          {
            name: 'circular equatorial orbit does not produce NaN',
            assert: `import numpy as np
r = np.array([7000.0, 0.0, 0.0])
v = np.array([0.0, np.sqrt(MU_EARTH / 7000.0), 0.0])
vals = rv2coe(r, v)
assert all(np.isfinite(x) for x in vals)
assert abs(vals[0] - 7000.0) < 1e-6 and vals[1] < 1e-10`,
          },
          {
            name: 'retrograde orbit has inclination above 90 degrees',
            hidden: true,
            assert: `import numpy as np
r = np.array([7000.0, 0.0, 0.0])
v = np.array([0.0, -np.sqrt(MU_EARTH / 7000.0), 0.0])
a, e, i, raan, argp, nu = rv2coe(r, v)
assert abs(np.degrees(i) - 180.0) < 1e-6`,
          },
        ],
      },
      {
        id: 'ex_kepler_solver',
        title: 'A Kepler equation solver that survives e = 0.99',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: [
          'Solve `M = E - e sin(E)` for `E`, for eccentricities from 0 to 0.999.',
          '',
          '- Start with plain Newton from `E0 = M` and find the eccentricity at which it fails or takes absurdly many',
          '  iterations.',
          '- Replace the initial guess with a good one — `E0 = pi` when `e > 0.8`, or the Vallado/Battin starter — and',
          '  re-measure.',
          '- Implement a fallback that cannot fail: bisection on `[0, 2pi]`, or the Laguerre-Conway iteration which is far',
          '  less sensitive to the starting point.',
          '- Plot iteration count against `e` for each variant.',
          '',
          'Also implement the hyperbolic form `M = e sinh(H) - H`.',
        ].join('\n'),
        starter: `import math


def solve_kepler(M: float, e: float, tol: float = 1e-12, max_iter: int = 100) -> float:
    """Solve M = E - e sin(E) for the eccentric anomaly E.

    Parameters
    ----------
    M : mean anomaly, radians (any value; wrap internally to [-pi, pi] or [0, 2pi])
    e : eccentricity, 0 <= e < 1

    Notes
    -----
    Newton's iteration is E <- E - (E - e sin E - M) / (1 - e cos E).
    The derivative approaches 1 - e near periapsis for high e, so a poor
    starting point makes the first step enormous. Choose E0 carefully, and
    fall back to a bracketed method if Newton stalls.
    """
    # TODO: implement with the initial guess and fallback described above.
    raise NotImplementedError


def solve_kepler_hyperbolic(M: float, e: float, tol: float = 1e-12) -> float:
    """Solve M = e sinh(H) - H for the hyperbolic anomaly H, e > 1."""
    # TODO: implement
    raise NotImplementedError
`,
        tests: [
          {
            name: 'circular orbit gives E = M',
            assert: `import math
for M in (0.0, 1.0, 3.0, 6.0):
    assert abs(solve_kepler(M, 0.0) - (M % (2 * math.pi))) < 1e-12`,
          },
          {
            name: 'the solution satisfies Kepler equation across the eccentricity range',
            assert: `import math
for e in (0.01, 0.3, 0.7, 0.9, 0.99, 0.999):
    for k in range(1, 24):
        M = k * 2 * math.pi / 24.0
        E = solve_kepler(M, e)
        assert abs((E - e * math.sin(E)) - M) < 1e-9`,
          },
          {
            name: 'periapsis and apoapsis are exact',
            assert: `import math
assert abs(solve_kepler(0.0, 0.9)) < 1e-12
assert abs(solve_kepler(math.pi, 0.9) - math.pi) < 1e-12`,
          },
          {
            name: 'hyperbolic solver is consistent',
            hidden: true,
            assert: `import math
for e in (1.2, 2.0, 5.0):
    for M in (0.1, 1.0, 10.0):
        H = solve_kepler_hyperbolic(M, e)
        assert abs((e * math.sinh(H) - H) - M) < 1e-8`,
          },
        ],
      },
      {
        id: 'ex_universal_variable',
        title: 'Universal-variable propagation across every conic',
        kind: 'code',
        lang: 'python',
        hours: 6,
        prompt: [
          'Implement the universal-variable Kepler propagator: given `(r0, v0, dt)`, solve the universal Kepler equation for',
          'the universal anomaly `chi` with the Stumpff functions `C(z)` and `S(z)`, then build the Lagrange coefficients',
          '`f, g, fdot, gdot` and form the new state.',
          '',
          '- Implement `stumpff_C(z)` and `stumpff_S(z)` with the series expansion near `z = 0` (do **not** let the',
          '  `(1 - cos(sqrt(z)))/z` form cancel catastrophically).',
          '- Validate against your classical Kepler propagation for an ellipse, and against a numerical integration for a',
          '  hyperbola.',
          '- Confirm the same code path handles `e = 0.0`, `0.7`, `1.0` and `1.5` with no special-casing.',
        ].join('\n'),
        starter: `import numpy as np

MU_EARTH = 398600.4418  # km^3/s^2


def stumpff_C(z: float) -> float:
    """C(z): 1/2 at z = 0, (1 - cos(sqrt(z)))/z for z > 0, (cosh(sqrt(-z)) - 1)/(-z) for z < 0.

    Use the series 1/2 - z/24 + z**2/720 for |z| < 1e-6 to avoid cancellation.
    """
    # TODO: implement all three branches.
    raise NotImplementedError


def stumpff_S(z: float) -> float:
    """S(z): 1/6 at z = 0, (sqrt(z) - sin(sqrt(z)))/z**1.5 for z > 0, hyperbolic form for z < 0."""
    # TODO: implement all three branches.
    raise NotImplementedError


def propagate_universal(
    r0: np.ndarray, v0: np.ndarray, dt: float, mu: float = MU_EARTH
) -> tuple[np.ndarray, np.ndarray]:
    """Propagate a state by dt using the universal variable formulation.

    Solve for the universal anomaly chi by Newton iteration on

        F(chi) = r0v0/sqrt(mu) chi^2 C(z) + (1 - alpha r0) chi^3 S(z) + r0 chi - sqrt(mu) dt

    with z = alpha chi^2 and alpha = 1/a = 2/r0 - v0^2/mu, then build the
    Lagrange coefficients f, g, fdot, gdot and form the new state.

    The same code path must work for alpha > 0 (ellipse), alpha == 0 (parabola)
    and alpha < 0 (hyperbola) -- that is the whole point of the formulation.
    """
    # TODO: implement, starting from chi0 = sqrt(mu) |alpha| dt.
    raise NotImplementedError
`,
      },
    ],
    cards: [
      {
        id: 'c_two_body_eq',
        front: 'Write the restricted two-body equation of motion.',
        back: 'r̈ = −μ r / r³, with μ = G(M + m) ≈ GM. It assumes point masses, no other bodies and no non-gravitational forces.',
        formula: true,
      },
      {
        id: 'c_mu_values',
        front: 'Gravitational parameters and radii you should know cold.',
        back: 'Earth μ = 398 600.4418 km³/s², R = 6378.137 km. Sun μ = 1.327 124 × 10¹¹ km³/s². Moon μ = 4902.8 km³/s². Mars μ = 42 828 km³/s².',
        formula: true,
      },
      {
        id: 'c_angular_momentum_orbit',
        front: 'Specific angular momentum of an orbit, and what it fixes.',
        back: 'h = r × v, constant for a central force. Its magnitude sets the semi-latus rectum p = h²/μ, and its direction fixes the orbit plane.',
        formula: true,
      },
      {
        id: 'c_ecc_vector',
        front: 'Write the eccentricity vector and say where it points.',
        back: 'e = ((v² − μ/r)r − (r·v)v)/μ = (v × h)/μ − r̂. It is constant, points from the focus toward periapsis, and its magnitude is the eccentricity.',
        formula: true,
      },
      {
        id: 'c_specific_energy',
        front: 'Specific mechanical energy of an orbit.',
        back: 'ε = v²/2 − μ/r = −μ/(2a). Negative for an ellipse, zero for a parabola, positive for a hyperbola.',
        formula: true,
      },
      {
        id: 'c_vis_viva',
        front: 'State the vis-viva equation.',
        back: 'v² = μ(2/r − 1/a)',
        formula: true,
      },
      {
        id: 'c_orbit_equation',
        front: 'Write the orbit equation.',
        back: 'r = (h²/μ)/(1 + e cos ν) = p/(1 + e cos ν). Periapsis at ν = 0, apoapsis at ν = 180°.',
        formula: true,
      },
      {
        id: 'c_keplers_third',
        front: 'Write Kepler third law for an orbit about a central body.',
        back: 'T = 2π√(a³/μ), and the mean motion is n = √(μ/a³). Period depends on semi-major axis alone — not on eccentricity.',
        formula: true,
      },
      {
        id: 'c_kepler_equation',
        front: 'Write Kepler equation and its hyperbolic counterpart.',
        back: 'Elliptic: M = E − e sin E, with M = n(t − t_p). Hyperbolic: M_h = e sinh H − H.',
        formula: true,
      },
      {
        id: 'c_anomaly_relation',
        front: 'Relate true anomaly and eccentric anomaly.',
        back: 'tan(ν/2) = √((1 + e)/(1 − e)) · tan(E/2). Also r = a(1 − e cos E).',
        formula: true,
      },
      {
        id: 'c_apsides',
        front: 'Periapsis and apoapsis radius from a and e.',
        back: 'r_p = a(1 − e), r_a = a(1 + e), and a = (r_p + r_a)/2.',
        formula: true,
      },
      {
        id: 'c_coe_list',
        front: 'Name the six classical orbital elements and what each fixes.',
        back: 'a size · e shape · i tilt of the plane · Ω where the plane crosses the equator going north · ω orientation of the ellipse within the plane · ν position along the orbit at the epoch.',
      },
      {
        id: 'c_coe_singularities',
        front: 'Where do the classical elements go singular, and what do you use instead?',
        back: 'ω is undefined for e = 0 (use argument of latitude u = ω + ν); Ω is undefined for i = 0 (use longitude of periapsis); both fail for a circular equatorial orbit (use true longitude). Equinoctial elements remove all of these.',
      },
      {
        id: 'c_circ_escape_velocity',
        front: 'Circular and escape speed at radius r.',
        back: 'v_c = √(μ/r), v_esc = √(2μ/r) = √2·v_c. At 200 km altitude v_c ≈ 7.78 km/s; at GEO v_c ≈ 3.07 km/s.',
        formula: true,
      },
      {
        id: 'c_geo_radius',
        front: 'GEO radius, altitude and period.',
        back: 'r = 42 164 km, altitude 35 786 km, period one sidereal day = 86 164 s. It follows directly from T = 2π√(a³/μ).',
        formula: true,
      },
      {
        id: 'c_lagrange_fg',
        front: 'What are the Lagrange f and g coefficients?',
        back: 'r(t) = f·r₀ + g·v₀ and v(t) = ḟ·r₀ + ġ·v₀ — the new state as a linear combination of the old position and velocity, valid because the motion stays in the plane they span. They satisfy fġ − ḟg = 1.',
        formula: true,
      },
      {
        id: 'c_tle_sgp4',
        front: 'What is in a TLE and what must you propagate it with?',
        back: 'Two lines of *mean* elements in the Brouwer-Lyddane sense used by SGP4, plus a drag term B*. They must be propagated with SGP4/SDP4; feeding them to a Cowell integrator mixes theories and produces kilometre-level errors immediately.',
      },
    ],
    quiz: [
      {
        id: 'q_vis_viva_derivation',
        q: 'Which chain of reasoning derives the vis-viva equation?',
        choices: [
          'Specific energy ε = v²/2 − μ/r is constant; evaluate it at periapsis and apoapsis and eliminate to get ε = −μ/(2a); substitute back to obtain v² = μ(2/r − 1/a)',
          'Apply Kepler third law and solve for velocity directly',
          'Differentiate the orbit equation with respect to true anomaly and set the result to zero',
          'Take the magnitude of the angular momentum h = r × v and substitute into Newton law of gravitation',
        ],
        answer: 0,
        explain:
          'The whole content of vis-viva is energy conservation plus the identification of the constant with −μ/(2a). Energy is conserved because gravity is conservative; evaluating at the apsides (where r and v are perpendicular) lets you eliminate the angular-momentum terms and identify the constant geometrically.',
        b: 0.6,
        bloom: 'understand',
      },
      {
        id: 'q_rv2coe_nan',
        q: 'Your rv2coe returns NaN for a near-circular orbit. Why, and what is the fix?',
        choices: [
          'The argument of periapsis is computed from the eccentricity vector, whose direction is undefined as e → 0, so the arccos argument divides by a near-zero magnitude; return the argument of latitude u = ω + ν instead, or switch to equinoctial elements',
          'The semi-major axis becomes infinite for a circular orbit',
          'The angular momentum vanishes for a circular orbit, so the node vector is undefined',
          'arccos is being called with an argument slightly greater than 1 because of round-off, and clamping it fixes everything',
        ],
        answer: 0,
        explain:
          'As e → 0 there is no periapsis, so ω has no meaning and its formula divides by ‖e‖ ≈ 0. The physically meaningful replacement is the argument of latitude, the angle from the ascending node to the spacecraft. Round-off in the arccos argument is a genuine and separate bug worth clamping for, but it is not what produces the NaN here — and angular momentum is maximal, not zero, for a circular orbit.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'q_kepler_convergence',
        q: 'Newton iteration on Kepler equation fails to converge at e = 0.995 starting from E₀ = M. What do you do?',
        choices: [
          'Use a better starting point (E₀ = π for high e, or a Vallado/Battin starter) and keep a bracketed fallback such as bisection or the Laguerre-Conway iteration, which is far less sensitive to the initial guess',
          'Reduce the convergence tolerance until it converges',
          'Switch to the hyperbolic form of Kepler equation',
          'Use double-double arithmetic; the problem is round-off',
        ],
        answer: 0,
        explain:
          "At high eccentricity the derivative 1 − e cos E is nearly zero near periapsis, so a Newton step from a poor guess overshoots wildly and can land outside the basin. E₀ = π is a classic robust choice for e > 0.8 because it starts on the flat side of the curve. Laguerre-Conway converges from almost anywhere, which is why production code uses it. Loosening the tolerance hides divergence rather than fixing it, and the orbit is still elliptical so the hyperbolic form does not apply.",
        b: 1.2,
        bloom: 'analyze',
      },
      {
        id: 'q_ecc_vector_direction',
        q: 'What is the eccentricity vector physically, and which way does it point?',
        choices: [
          'A constant of the two-body motion (the Laplace-Runge-Lenz vector scaled by μ) that points from the focus toward periapsis, with magnitude equal to the eccentricity',
          'A unit vector along the orbit normal, with magnitude equal to the eccentricity',
          'A vector from the centre of the ellipse to the occupied focus, pointing toward apoapsis',
          'The time derivative of the angular momentum vector',
        ],
        answer: 0,
        explain:
          'e = (v × h)/μ − r̂ is conserved for an inverse-square force, which is exactly why closed orbits do not precess in the pure two-body problem. It lies in the orbit plane (not along the normal) and points at periapsis, so it fixes ω. Adding J2 or any other perturbation makes it rotate — apsidal precession is literally the eccentricity vector turning.',
        b: 0.7,
        bloom: 'understand',
      },
    ],
    tags: ['astrodynamics', 'interview', 'spacex-core'],
    importance: 1.4,
  },

  {
    id: 't2_m20_orbital_maneuvers',
    track: 'foundations',
    tier: 2,
    title: 'Impulsive Maneuvers & Transfers',
    summary:
      'Build a Δv budget you can defend: Hohmann vs bi-elliptic vs low-thrust, where to spend a plane change, and how much margin a real mission carries.',
    prereqs: ['t2_m19_two_body'],
    hours: 45,
    topics: [
      'the impulsive approximation and its validity limits',
      'Hohmann transfer and its optimality',
      'bi-elliptic transfer and the crossover ratio',
      'one-tangent burns',
      'plane change and combined plane-change-plus-raise optimisation',
      'apsidal rotation',
      'phasing manoeuvres and rendezvous phasing',
      'finite-burn and gravity losses',
      'low-thrust transfers: Edelbaum, spirals, electric propulsion',
      'station-keeping for GEO and LEO',
      'constellation management, drift orbits and deorbit',
      'patched conics, sphere of influence, C3, gravity assists',
      'porkchop plots and launch windows',
    ],
    objectives: [
      'Compute Δv budgets for any two-impulse transfer',
      'Decide between Hohmann, bi-elliptic and low-thrust for a given scenario',
      'Build a mission Δv budget including margin',
      'Explain why constellation operators raise orbit with electric propulsion',
    ],
    resources: [
      { title: 'Orbital Mechanics for Engineering Students, Ch. 6 & 8', author: 'Howard D. Curtis', kind: 'book', free: false },
      { title: 'Fundamentals of Astrodynamics and Applications, Ch. 6', author: 'David A. Vallado', kind: 'book', free: false },
      {
        title: 'Orbital Mechanics — Impulsive Maneuvers, Hohmann Transfer, Heliocentric Trajectories',
        author: 'Bryan Weber',
        kind: 'site',
        url: 'https://orbital-mechanics.space',
        free: true,
      },
      {
        title: 'GMAT (General Mission Analysis Tool)',
        author: 'NASA',
        kind: 'tool',
        url: 'https://software.nasa.gov/software/GSC-18094-1',
        free: true,
        note: 'Free, flight-qualified mission analysis software — use it to validate your own numbers.',
      },
      {
        title: 'Orekit',
        kind: 'tool',
        url: 'https://www.orekit.org',
        free: true,
        note: 'Open-source, thoroughly validated flight dynamics library. A good independent cross-check.',
      },
    ],
    exercises: [
      {
        id: 'ex_hohmann_bielliptic',
        title: 'Hohmann vs bi-elliptic, and the crossover',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'Implement `hohmann(r1, r2, mu)` returning `(dv1, dv2, tof)` and `bielliptic(r1, r2, rb, mu)` returning',
          '`(dv1, dv2, dv3, tof)`.',
          '',
          '- Sweep the radius ratio `r2/r1` from 2 to 60 and plot total Δv for the Hohmann transfer and for bi-elliptic',
          '  transfers with several intermediate radii `rb`.',
          '- Locate the crossover numerically and confirm it lands near the classical value of 11.94.',
          '- Plot time of flight on a second axis and comment on why bi-elliptic is rarely flown even where it wins on Δv.',
        ].join('\n'),
        starter: `import numpy as np

MU_EARTH = 398600.4418  # km^3/s^2


def hohmann(r1: float, r2: float, mu: float = MU_EARTH) -> tuple[float, float, float]:
    """Two-impulse coplanar circle-to-circle transfer.

    dv1 = sqrt(mu/r1) (sqrt(2 r2 / (r1 + r2)) - 1)
    dv2 = sqrt(mu/r2) (1 - sqrt(2 r1 / (r1 + r2)))
    tof = pi sqrt(a_t^3 / mu),  a_t = (r1 + r2)/2

    Returns (dv1, dv2, tof) in km/s and seconds.
    """
    # TODO: implement
    raise NotImplementedError


def bielliptic(r1: float, r2: float, rb: float, mu: float = MU_EARTH):
    """Three-impulse transfer via an intermediate apoapsis radius rb > r2.

    Returns (dv1, dv2, dv3, tof).
    """
    # TODO: implement
    raise NotImplementedError
`,
        tests: [
          {
            name: 'LEO to GEO Hohmann matches the textbook numbers',
            assert: `dv1, dv2, tof = hohmann(6678.0, 42164.0)
assert abs(dv1 - 2.4258) < 1e-3
assert abs(dv2 - 1.4668) < 1e-3
assert abs(tof / 3600.0 - 5.275) < 1e-2`,
          },
          {
            name: 'a transfer to the same radius costs nothing',
            assert: `dv1, dv2, tof = hohmann(7000.0, 7000.0)
assert abs(dv1) < 1e-12 and abs(dv2) < 1e-12`,
          },
          {
            name: 'bi-elliptic loses below the crossover and wins far above it',
            assert: `r1 = 7000.0
lo = 5.0 * r1
hi = 40.0 * r1
assert sum(bielliptic(r1, lo, 3.0 * lo)[:3]) > sum(hohmann(r1, lo)[:2])
assert sum(bielliptic(r1, hi, 8.0 * hi)[:3]) < sum(hohmann(r1, hi)[:2])`,
          },
        ],
      },
      {
        id: 'ex_plane_change_split',
        title: 'Split a plane change optimally between two burns',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: [
          'For a LEO (6678 km, 28.5° inclination) to GEO (42 164 km, 0°) transfer, the plane change can be split between',
          'the perigee and apogee burns.',
          '',
          '- Write the combined-burn cost `dv = sqrt(v_a^2 + v_b^2 - 2 v_a v_b cos(di))` for each end.',
          '- Sweep the fraction of the 28.5° done at perigee from 0 to 1 and plot the total.',
          '- Find the optimum numerically. You should get a small but non-zero share at perigee (roughly 2°), because the',
          '  perigee burn is already changing speed and the vector addition is not linear.',
          '- Report the Δv saved relative to doing the whole plane change at apogee.',
        ].join('\n'),
        starter: `import numpy as np

MU_EARTH = 398600.4418  # km^3/s^2


def combined_burn(v_before: float, v_after: float, d_inc: float) -> float:
    """Delta-v for a burn that changes speed and rotates the velocity by d_inc.

        dv = sqrt(v_before^2 + v_after^2 - 2 v_before v_after cos(d_inc))

    The law of cosines on the velocity triangle. With d_inc = 0 it collapses to
    |v_after - v_before|, which is a good self-check.
    """
    # TODO: one line.
    raise NotImplementedError


def geo_transfer_total(
    frac_at_perigee: float, r1: float, r2: float, d_inc_total: float, mu: float = MU_EARTH
) -> float:
    """Total delta-v for a LEO-to-GEO transfer with the plane change split
    between the perigee and apogee burns.

    Parameters
    ----------
    frac_at_perigee : fraction of d_inc_total performed at the first burn, 0..1

    Build the four speeds (circular at r1, transfer perigee, transfer apogee,
    circular at r2) from vis-viva, then apply combined_burn at each end.
    """
    # TODO: implement, then minimise over frac_at_perigee numerically.
    raise NotImplementedError
`,
      },
      {
        id: 'ex_low_thrust_spiral',
        title: 'Low-thrust spiral versus impulsive Hohmann',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: [
          'Simulate a continuous low-thrust tangential spiral from a 350 km circular orbit to 550 km, with a thrust',
          'acceleration typical of a small Hall thruster (order 1e-4 m/s²).',
          '',
          '- Integrate the full dynamics with a tangential thrust and record Δv and elapsed time.',
          '- Compare Δv to the Edelbaum coplanar result `|v1 - v0|` and to the impulsive Hohmann total.',
          '- Compare *propellant mass* for the two options given Isp of 1500 s (Hall) against 300 s (chemical).',
          '',
          'Write up which one a constellation operator picks and why the answer is not simply the smaller Δv.',
        ].join('\n'),
        starter: `import numpy as np

MU_EARTH = 398600.4418  # km^3/s^2


def spiral_deriv(t: float, y: np.ndarray, thrust_accel: float, mu: float = MU_EARTH) -> np.ndarray:
    """Two-body dynamics with a constant-magnitude TANGENTIAL thrust.

    y = [rx, ry, rz, vx, vy, vz] in km and km/s; thrust_accel in km/s^2.
    The thrust direction is v / |v|, which is the (near-)optimal direction for
    raising a circular orbit.
    """
    # TODO: gravity plus thrust_accel along the unit velocity vector.
    raise NotImplementedError


def edelbaum_dv(r0: float, r1: float, mu: float = MU_EARTH) -> float:
    """Coplanar low-thrust circle-to-circle delta-v: |v1 - v0| with v = sqrt(mu/r).

    Compare this against the impulsive Hohmann total for the same radii, and
    note which is larger.
    """
    # TODO: one line.
    raise NotImplementedError


def propellant_mass(m0: float, dv: float, isp: float, g0: float = 9.80665e-3) -> float:
    """Propellant mass from the rocket equation. g0 is in km/s^2 here to match
    delta-v in km/s -- get this wrong and the answer is off by 1000."""
    # TODO: m0 * (1 - exp(-dv / (isp * g0)))
    raise NotImplementedError
`,
      },
    ],
    cards: [
      {
        id: 'c_hohmann_dv',
        front: 'Write the two Hohmann burns.',
        back: 'Δv₁ = √(μ/r₁)(√(2r₂/(r₁+r₂)) − 1);  Δv₂ = √(μ/r₂)(1 − √(2r₁/(r₁+r₂)))',
        formula: true,
      },
      {
        id: 'c_hohmann_tof',
        front: 'Hohmann transfer time of flight.',
        back: 't = π√(a_t³/μ) with a_t = (r₁ + r₂)/2 — half the period of the transfer ellipse. LEO to GEO is about 5.3 hours.',
        formula: true,
      },
      {
        id: 'c_leo_geo_dv',
        front: 'Coplanar LEO (6678 km) to GEO Hohmann Δv?',
        back: 'Δv₁ ≈ 2.43 km/s, Δv₂ ≈ 1.47 km/s, total ≈ 3.89 km/s. Add a 28.5° plane change at GEO and the total rises to roughly 4.3 km/s.',
        formula: true,
      },
      {
        id: 'c_bielliptic_crossover',
        front: 'When does a bi-elliptic transfer beat a Hohmann transfer?',
        back: 'Above a radius ratio r₂/r₁ ≈ 11.94 a bi-elliptic with a sufficiently large intermediate apoapsis always wins; below 11.94 Hohmann always wins. Between 11.94 and 15.58 it depends on the intermediate radius.',
      },
      {
        id: 'c_plane_change_dv',
        front: 'Δv for a pure plane change of Δi at speed v.',
        back: 'Δv = 2v·sin(Δi/2). At LEO speed 7.73 km/s a 28.5° change costs 3.80 km/s; at GEO speed 3.07 km/s the same change costs 1.51 km/s.',
        formula: true,
      },
      {
        id: 'c_combined_burn',
        front: 'Δv for a combined speed change and plane change.',
        back: 'Δv = √(v₁² + v₂² − 2v₁v₂cos Δi) — the law of cosines on the velocity triangle. Always cheaper than doing the two separately.',
        formula: true,
      },
      {
        id: 'c_plane_change_where',
        front: 'Where on an orbit is a plane change cheapest, and why?',
        back: 'At the slowest point — apoapsis — because Δv scales directly with the speed being rotated. This is why GTO missions carry the inclination change to apogee.',
      },
      {
        id: 'c_oberth',
        front: 'State the Oberth effect.',
        back: 'A given Δv applied at higher speed produces a larger change in specific energy, since Δε = v·Δv + Δv²/2. Burning deep in a gravity well is therefore more efficient for escape — the reason for perigee kick burns and powered flybys.',
        formula: true,
      },
      {
        id: 'c_finite_burn_loss',
        front: 'What is finite-burn loss and when does the impulsive approximation break down?',
        back: 'A real burn takes time, during which the vehicle moves and the thrust direction is not always optimal, so realised Δv falls short of the impulsive calculation. The approximation degrades when burn arc length becomes a significant fraction of the orbit — roughly when burn time exceeds a few percent of the period.',
      },
      {
        id: 'c_edelbaum',
        front: 'Write the Edelbaum result for a low-thrust circle-to-circle transfer with plane change.',
        back: 'Δv = √(v₀² + v₁² − 2v₀v₁cos(½πΔi)). For a coplanar spiral it reduces to Δv = |v₁ − v₀|, which is *larger* than the Hohmann total for the same radii.',
        formula: true,
      },
      {
        id: 'c_geo_stationkeeping',
        front: 'GEO station-keeping budget, north-south and east-west.',
        back: 'North-south (inclination, driven by lunisolar perturbation) costs roughly 45-55 m/s per year and dominates. East-west (longitude drift from Earth triaxiality) costs only about 2-4 m/s per year.',
      },
      {
        id: 'c_c3',
        front: 'Define C3.',
        back: 'C3 = v_∞² = −μ/a, the characteristic energy of a hyperbolic departure. C3 = 0 is exactly escape; a porkchop plot contours C3 against departure and arrival date.',
        formula: true,
      },
      {
        id: 'c_soi',
        front: 'Sphere of influence radius, and Earth value.',
        back: 'r_SOI = a(m/M)^(2/5). For Earth about 924 000 km. Inside it you patch to a planet-centred conic; outside, to a heliocentric one.',
        formula: true,
      },
      {
        id: 'c_gravity_assist',
        front: 'What does a gravity assist actually change?',
        back: 'It rotates v_∞ in the planet-centred frame without changing its magnitude; adding the planet heliocentric velocity back in changes the spacecraft heliocentric speed. The maximum turn is sin(δ/2) = 1/(1 + r_p v_∞²/μ), so a close pass at a massive body turns the most.',
        formula: true,
      },
      {
        id: 'c_phasing',
        front: 'How does a phasing manoeuvre work?',
        back: 'Change the period so the chaser drifts relative to the target, then restore the original orbit once the phase angle is right. Cost trades against time: a smaller Δv means a slower drift and more revolutions.',
      },
    ],
    quiz: [
      {
        id: 'q_hohmann_optimal',
        q: 'Under what condition does the Hohmann transfer stop being the optimal two-impulse coplanar circle-to-circle transfer?',
        choices: [
          'When the radius ratio exceeds about 11.94, where a three-impulse bi-elliptic transfer with a large enough intermediate apoapsis costs less Δv (at the price of far longer flight time)',
          'It never stops being optimal for coplanar circular orbits',
          'When the transfer time exceeds one orbital period of the target',
          'When the two orbits have different inclinations, which is the only case where it fails',
        ],
        answer: 0,
        explain:
          'Hohmann is optimal among *two*-impulse coplanar circle-to-circle transfers, and it is only beaten by allowing a third impulse. Above r₂/r₁ ≈ 11.94 the bi-elliptic route wins because the plane-change-free apoapsis burn happens where the speed is tiny. Between 11.94 and 15.58 the answer depends on the intermediate radius. Flight time is the reason it is rarely used: a bi-elliptic LEO-to-high-orbit transfer can take weeks.',
        b: 0.9,
        bloom: 'analyze',
      },
      {
        id: 'q_plane_change_apogee',
        q: 'Quantify why a plane change is cheaper at apogee. Take 28.5° at LEO speed 7.73 km/s versus GEO speed 3.07 km/s.',
        choices: [
          'Δv = 2v sin(Δi/2): 3.80 km/s at LEO versus 1.51 km/s at GEO — a factor of 2.5, because the cost scales directly with the speed being rotated',
          'About 10% cheaper, since the geometry barely changes with altitude',
          'Equally expensive: the plane change cost depends only on Δi, not on speed',
          'Cheaper at perigee, because the Oberth effect makes all burns more efficient there',
        ],
        answer: 0,
        explain:
          'Rotating a velocity vector of magnitude v through Δi costs 2v sin(Δi/2), so the price falls linearly with speed. The Oberth effect applies to changes in *energy*, not direction, so it argues for perigee burns when raising apoapsis and does nothing for a pure rotation. Combining the plane change with the apogee circularisation burn is cheaper still, via the law of cosines.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'q_lowthrust_why',
        q: 'Starlink raises orbit with low-thrust Hall thrusters over weeks rather than with an impulsive burn. Give reasons beyond propulsion hardware availability.',
        choices: [
          'Electric propulsion has roughly five times the Isp, so even though a spiral needs more Δv than a Hohmann transfer it needs far less propellant mass; and the slow drift is itself useful for phasing satellites around the plane and for a fail-safe low insertion altitude that decays naturally',
          'Low thrust produces less gravity loss than an impulsive burn',
          'Spiral transfers need less Δv than Hohmann transfers for the same altitude change',
          'Low thrust avoids the plane change that an impulsive transfer would require',
        ],
        answer: 0,
        explain:
          'A coplanar spiral needs Δv = |v₁ − v₀|, which is *more* than the Hohmann total — but the rocket equation is exponential in Δv/(Isp·g₀), so a 1500 s Isp beats a 300 s Isp by a wide margin even with the penalty. The operational arguments matter just as much: satellites are deployed low so that a failed unit re-enters quickly, and the slow raise doubles as the phasing manoeuvre that spreads the plane.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'q_oberth',
        q: 'Why is a burn deep in a gravity well more effective at raising the final escape speed?',
        choices: [
          'Because the change in specific energy is Δε = v·Δv + Δv²/2, so the same Δv applied at higher speed buys more energy — the Oberth effect',
          'Because gravity adds to the thrust when you burn at perigee',
          'Because atmospheric drag is lower at perigee',
          'Because the engine produces more thrust at higher velocity',
        ],
        answer: 0,
        explain:
          'Kinetic energy is quadratic in speed, so adding Δv to a large v adds more energy than adding it to a small v. The physical accounting is that propellant expelled at high vehicle speed is left with less kinetic energy of its own, so more of the chemical energy ends up in the vehicle. Thrust itself is unchanged by vehicle speed.',
        b: 0.8,
        bloom: 'understand',
      },
    ],
    tags: ['astrodynamics', 'mission-design', 'interview'],
    importance: 1.2,
  },

  {
    id: 't2_m21_perturbations',
    track: 'foundations',
    tier: 2,
    title: 'Orbital Perturbations & Special Perturbations',
    summary:
      'Everything the two-body problem left out: J2 and the higher geopotential, drag, solar radiation pressure and third bodies — including how to design a sun-synchronous orbit from the J2 nodal regression rate.',
    prereqs: ['t2_m19_two_body', 't0_m10_numerical_methods'],
    hours: 45,
    topics: [
      'perturbation sources ranked by magnitude in LEO and GEO',
      'non-spherical gravity, spherical harmonics, J2 and higher zonals',
      'J2 secular effects: nodal regression and apsidal rotation',
      'sun-synchronous orbits',
      'atmospheric drag, ballistic coefficient and density model uncertainty',
      'solar radiation pressure and eclipse modelling',
      'third-body lunar and solar perturbations',
      'tides and relativistic corrections',
      'general vs special perturbations',
      'Cowell and Encke methods',
      'Gauss variational equations and Lagrange planetary equations',
      'mean vs osculating elements',
      'SGP4/SDP4 and why TLEs are theory-specific',
      'long-term orbit evolution and lifetime estimation',
    ],
    objectives: [
      'Add J2, drag, SRP and third-body accelerations to a numerical propagator and quantify each',
      'Design a sun-synchronous orbit from the J2 nodal regression requirement',
      'Explain why a TLE must be propagated with SGP4 rather than your own integrator',
      'Estimate the orbital lifetime of a LEO satellite',
    ],
    resources: [
      { title: 'Orbital Mechanics for Engineering Students, Ch. 10 & 12', author: 'Howard D. Curtis', kind: 'book', free: false },
      {
        title: 'Fundamentals of Astrodynamics and Applications, Ch. 8 & 9',
        author: 'David A. Vallado',
        kind: 'book',
        free: false,
        note: 'The practical reference for force models and for the difference between mean and osculating elements.',
      },
      { title: 'Satellite Orbits: Models, Methods, Applications', author: 'Montenbruck & Gill', kind: 'book', free: false },
      {
        title: 'Orbital Mechanics — Perturbations',
        author: 'Bryan Weber',
        kind: 'site',
        url: 'https://orbital-mechanics.space',
        free: true,
      },
      {
        title: 'GMAT force models',
        author: 'NASA',
        kind: 'tool',
        url: 'https://software.nasa.gov/software/GSC-18094-1',
        free: true,
        note: 'Validate your propagator against a flight-qualified one before trusting it.',
      },
    ],
    exercises: [
      {
        id: 'ex_j2_propagator',
        title: 'Add J2 and verify the nodal regression rate',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: [
          'Extend your two-body propagator with the J2 acceleration and validate it against theory.',
          '',
          '- Implement `j2_accel(r, mu, J2, Re)` in Cartesian components.',
          '- Propagate a 500 km, 51.6° circular orbit for 30 days.',
          '- Convert to osculating elements at each step and fit the secular trend in RAAN.',
          '- Compare the fitted rate to the analytic `raan_dot = -1.5 n J2 (Re/a)^2 cos(i) / (1-e^2)^2` and confirm agreement',
          '  to better than 1%.',
          '',
          'Then plot the *osculating* inclination and watch it oscillate at twice per revolution while the *mean* value',
          'stays put — that difference is the whole mean-vs-osculating story.',
        ].join('\n'),
        starter: `import numpy as np

MU_EARTH = 398600.4418  # km^3/s^2
R_EARTH = 6378.137      # km
J2_EARTH = 1.08263e-3


def j2_accel(
    r: np.ndarray, mu: float = MU_EARTH, j2: float = J2_EARTH, re: float = R_EARTH
) -> np.ndarray:
    """J2 perturbing acceleration in an Earth-centred inertial frame, km/s^2.

    a = (3/2) J2 mu Re^2 / rmag^4 * [
            (x/rmag)(5 z^2/rmag^2 - 1),
            (y/rmag)(5 z^2/rmag^2 - 1),
            (z/rmag)(5 z^2/rmag^2 - 3) ]
    """
    # TODO: implement exactly the expression above.
    raise NotImplementedError


def raan_rate(a: float, e: float, i: float, mu: float = MU_EARTH,
              j2: float = J2_EARTH, re: float = R_EARTH) -> float:
    """Secular nodal regression rate in rad/s.

    raan_dot = -1.5 * n * j2 * (re/a)**2 * cos(i) / (1 - e**2)**2,  n = sqrt(mu/a**3)
    """
    # TODO: implement
    raise NotImplementedError
`,
        tests: [
          {
            name: 'J2 acceleration over the equator points inward along the radius',
            assert: `import numpy as np
a = j2_accel(np.array([7000.0, 0.0, 0.0]))
assert a[0] < 0.0
assert abs(a[1]) < 1e-15 and abs(a[2]) < 1e-15`,
          },
          {
            name: 'J2 acceleration magnitude at 400 km is of order 1e-5 km/s^2',
            assert: `import numpy as np
mag = float(np.linalg.norm(j2_accel(np.array([6778.137, 0.0, 0.0]))))
assert 5e-6 < mag < 3e-5`,
          },
          {
            name: 'a prograde orbit regresses and a retrograde orbit advances',
            assert: `import numpy as np
assert raan_rate(6928.137, 0.0, np.radians(51.6)) < 0.0
assert raan_rate(6928.137, 0.0, np.radians(98.0)) > 0.0
assert abs(raan_rate(6928.137, 0.0, np.radians(90.0))) < 1e-18`,
          },
          {
            name: 'sun-synchronous condition is met near 97.6 degrees at 550 km',
            hidden: true,
            assert: `import numpy as np
target = 2 * np.pi / (365.2421897 * 86400.0)
rate = raan_rate(6928.137, 0.0, np.radians(97.5929))
assert abs(rate - target) / target < 1e-3`,
          },
        ],
      },
      {
        id: 'ex_drag_lifetime',
        title: 'Estimate a LEO satellite lifetime',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: [
          'Add exponential-atmosphere drag to the propagator and estimate how long a 400 km satellite survives.',
          '',
          '- `a_drag = -0.5 rho v_rel |v_rel| / B` with `B = m/(Cd A)` the ballistic coefficient and `v_rel` the velocity',
          '  relative to the co-rotating atmosphere (do not forget the rotation term).',
          '- Propagate with `B = 50`, `100` and `200 kg/m²` and record altitude vs time until re-entry at 120 km.',
          '- Repeat with the density scaled by 0.5 and 2.0 to represent solar-cycle uncertainty.',
          '',
          'Write up: how sensitive is lifetime to B, and how sensitive to the density model? Which uncertainty dominates,',
          'and what does that mean for a re-entry prediction quoted to the hour?',
        ].join('\n'),
        starter: `import numpy as np

MU_EARTH = 398600.4418   # km^3/s^2
R_EARTH = 6378.137       # km
OMEGA_EARTH = 7.292115e-5  # rad/s


def atmospheric_density(alt_km: float, rho0: float = 1.225e9, h_scale: float = 8.5) -> float:
    """Exponential density in kg/km^3 (note the units) at a given altitude in km.

    A single scale height is crude above ~180 km; a piecewise-exponential table
    (Vallado Table 8-4) is the usual next step, and swapping it in should be a
    one-line change here.
    """
    # TODO: rho0 * exp(-alt_km / h_scale)
    raise NotImplementedError


def drag_accel(r: np.ndarray, v: np.ndarray, bc: float) -> np.ndarray:
    """Drag acceleration in km/s^2 for ballistic coefficient bc = m/(Cd A) in kg/km^2.

    The velocity that matters is relative to the CO-ROTATING atmosphere:

        v_rel = v - omega_earth x r

    Forgetting that term costs roughly 6 percent of the drag at low inclination.
    """
    # TODO: build v_rel, then a = -0.5 * rho * |v_rel| * v_rel / bc.
    raise NotImplementedError


def lifetime_days(r0: np.ndarray, v0: np.ndarray, bc: float, reentry_alt_km: float = 120.0) -> float:
    """Propagate with two-body plus drag until the altitude drops below
    reentry_alt_km, and return the elapsed time in days."""
    # TODO: integrate with an event that stops at the re-entry altitude.
    raise NotImplementedError
`,
      },
      {
        id: 'ex_sso_design',
        title: 'Design a sun-synchronous orbit',
        kind: 'analysis',
        hours: 2,
        prompt: [
          'A sun-synchronous orbit has its node regress at exactly the rate the Earth orbits the Sun: +360° per',
          'tropical year, i.e. +1.99106e-7 rad/s (about +0.9856°/day).',
          '',
          '1. Set the analytic J2 nodal rate equal to that and solve for inclination as a function of altitude.',
          '2. Tabulate the required inclination at 400, 550, 700 and 800 km. (You should get roughly 97.0°, 97.6°, 98.2°',
          '   and 98.6°.)',
          '3. Explain why the inclination must be retrograde.',
          '4. Verify one of your answers by numerical propagation and quote the residual drift in degrees per year.',
          '5. Bonus: explain what "local time of the ascending node" means and why an imaging constellation cares.',
        ].join('\n'),
      },
    ],
    cards: [
      {
        id: 'c_j2_value',
        front: 'Value of Earth J2, and what it physically represents.',
        back: 'J2 = 1.08263 × 10⁻³, the oblateness term of the geopotential — the equatorial bulge. It is about a thousand times larger than any other harmonic coefficient.',
        formula: true,
      },
      {
        id: 'c_j2_accel',
        front: 'Write the J2 perturbing acceleration in Cartesian coordinates.',
        back: 'a = (3/2)J₂μR_e²/r⁴ · [(x/r)(5z²/r² − 1), (y/r)(5z²/r² − 1), (z/r)(5z²/r² − 3)]',
        formula: true,
      },
      {
        id: 'c_nodal_regression',
        front: 'Write the J2 secular nodal regression rate.',
        back: 'Ω̇ = −(3/2)·n·J₂·(R_e/a)²·cos i/(1 − e²)², with n = √(μ/a³). Prograde orbits regress; retrograde orbits advance; polar orbits do neither.',
        formula: true,
      },
      {
        id: 'c_apsidal_rotation',
        front: 'Write the J2 secular apsidal rotation rate and its critical inclination.',
        back: 'ω̇ = (3/4)·n·J₂·(R_e/a)²·(5cos²i − 1)/(1 − e²)². It vanishes at i = 63.435° — the critical inclination used by Molniya and Tundra orbits to freeze the apogee over one hemisphere.',
        formula: true,
      },
      {
        id: 'c_sso_condition',
        front: 'Sun-synchronous condition and typical inclinations.',
        back: 'Ω̇ must equal +1.99106 × 10⁻⁷ rad/s (+0.9856°/day). That requires a retrograde inclination: ≈ 97.0° at 400 km, 97.6° at 550 km, 98.6° at 800 km.',
        formula: true,
      },
      {
        id: 'c_sso_retrograde',
        front: 'Why must a sun-synchronous orbit be retrograde?',
        back: 'The required nodal drift is positive (eastward), but the J2 rate carries a factor of cos i with a leading minus sign. Positive Ω̇ therefore demands cos i < 0, i.e. i > 90°.',
      },
      {
        id: 'c_perturbation_ranking_leo',
        front: 'Rank the perturbations at 400 km altitude by magnitude.',
        back: 'Two-body ≈ 8.7 m/s² · J2 ≈ 1.2 × 10⁻² · higher geopotential harmonics ≈ 10⁻⁵ · drag ≈ 10⁻⁶ to 10⁻⁵ (solar-cycle dependent) · lunar third body ≈ 10⁻⁶ · solar third body ≈ 5 × 10⁻⁷ · SRP ≈ 10⁻⁷.',
        formula: true,
      },
      {
        id: 'c_perturbation_ranking_geo',
        front: 'Rank the perturbations at GEO by magnitude.',
        back: 'Two-body ≈ 0.22 m/s² · J2 ≈ 10⁻⁵ · lunar third body ≈ 7 × 10⁻⁶ · solar third body ≈ 3 × 10⁻⁶ · SRP ≈ 10⁻⁷ to 10⁻⁶ · drag negligible. Lunisolar perturbation is what drives the expensive north-south station-keeping.',
        formula: true,
      },
      {
        id: 'c_drag_accel',
        front: 'Write the drag acceleration and define ballistic coefficient.',
        back: 'a_D = −½ρ(v_rel²/B)v̂_rel with B = m/(C_D A) in kg/m². v_rel must be measured against the co-rotating atmosphere.',
        formula: true,
      },
      {
        id: 'c_drag_paradox',
        front: 'Why does drag make a satellite speed up?',
        back: 'Drag removes energy, lowering the semi-major axis, and v = √(μ/a) rises as a falls. The satellite ends up faster in a lower orbit — the drag paradox. Drag also circularises, because it bites hardest at perigee.',
      },
      {
        id: 'c_srp_eclipse',
        front: 'Solar radiation pressure magnitude and why eclipse modelling matters.',
        back: 'P ≈ 4.56 × 10⁻⁶ N/m² at 1 AU; a = P(A/m)(1 + reflectivity). It switches on and off at eclipse entry and exit, so a shadow model (cylindrical, or conical with penumbra) is needed or the along-track error accumulates.',
        formula: true,
      },
      {
        id: 'c_mean_vs_osculating',
        front: 'Mean vs osculating elements — what is the difference?',
        back: 'Osculating elements describe the instantaneous two-body orbit tangent to the true trajectory, and they wobble every revolution under J2. Mean elements have the short-period variations analytically removed, so they evolve smoothly. The two can differ by tens of kilometres in semi-major axis.',
      },
      {
        id: 'c_cowell_encke',
        front: 'Distinguish Cowell and Encke methods.',
        back: "Cowell integrates the total acceleration directly — simple, general, and demanding on step size. Encke integrates only the *deviation* from a reference conic, so the integrator sees a small quantity and can take larger steps, at the cost of periodic rectification.",
      },
      {
        id: 'c_gauss_variational',
        front: 'What do the Gauss variational equations give you?',
        back: 'The time derivatives of the orbital elements directly in terms of the perturbing acceleration resolved into radial, transverse and normal components — so you can see which element each force actually moves.',
      },
      {
        id: 'c_tle_theory_specific',
        front: 'Why can a TLE not be fed to your own Cowell propagator?',
        back: 'TLE elements are mean elements defined *within* the SGP4 theory, with its particular analytic removal of periodic terms and its own B* drag model. Treating them as osculating elements introduces kilometre-level error at epoch and grows from there. Propagate with SGP4, then convert the resulting state if you need one.',
      },
      {
        id: 'c_lifetime_uncertainty',
        front: 'What dominates the uncertainty in a LEO lifetime prediction?',
        back: 'Thermospheric density, which varies by a factor of several over the solar cycle and responds to geomagnetic storms within hours. Ballistic coefficient uncertainty and attitude (tumbling vs stable) matter too, but density is the leading term — which is why re-entry predictions are quoted with wide windows until the final orbits.',
      },
    ],
    quiz: [
      {
        id: 'q_sso_design',
        q: 'You need a sun-synchronous orbit at 550 km. What inclination, and why is the sign of cos i forced?',
        choices: [
          'About 97.6°, retrograde: the required nodal rate is +0.9856°/day but Ω̇ = −(3/2)nJ₂(R_e/a)²cos i, so a positive rate requires cos i < 0',
          'About 82.4°, prograde: the orbit must move with the Earth rotation',
          'Exactly 90°, polar: only a polar orbit keeps a constant sun angle',
          'About 63.4°, the critical inclination',
        ],
        answer: 0,
        explain:
          'Setting the J2 rate equal to the Earth mean motion about the Sun (1.991 × 10⁻⁷ rad/s) and solving gives cos i ≈ −0.132, i.e. i ≈ 97.59° at a = 6928 km. The minus sign in the J2 formula is what forces retrograde. 63.4° is the critical inclination for frozen apsides, a different design condition entirely.',
        b: 1.0,
        bloom: 'apply',
      },
      {
        id: 'q_perturbation_ranking',
        q: 'Rank the dominant perturbations at 400 km altitude and at GEO.',
        choices: [
          'At 400 km: J2 ≫ higher harmonics ≳ drag ≳ lunisolar ≳ SRP. At GEO: J2 ≈ lunisolar ≫ SRP, with drag negligible',
          'Drag dominates at both altitudes',
          'SRP dominates at 400 km; drag dominates at GEO',
          'J2 dominates at 400 km; at GEO all perturbations are negligible',
        ],
        answer: 0,
        explain:
          'J2 falls off as 1/r⁴ against the 1/r² of the two-body term, so it drops from ~1.2 × 10⁻² m/s² at 400 km to ~10⁻⁵ at GEO, where lunisolar perturbation (which grows with distance from Earth) catches up with it. Drag is significant only in LEO and vanishes above roughly 1000 km. SRP is small everywhere but secular and matters for high area-to-mass ratios.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'q_tle_cowell',
        q: 'Why does feeding TLE elements directly into a Cowell propagator give wrong answers?',
        choices: [
          'TLE elements are mean elements defined inside the SGP4 theory, with its specific removal of periodic terms and its own B* drag parameter — treating them as osculating elements is a theory mismatch that costs kilometres immediately',
          'TLEs are always several days stale, so any propagator gives wrong answers',
          'TLEs are given in ECEF while Cowell propagators work in ECI',
          'TLE elements use degrees where Cowell propagators expect radians',
        ],
        answer: 0,
        explain:
          'The error is conceptual, not clerical. SGP4 mean elements have short-period and some long-period variations analytically removed; an osculating-element propagator expects the instantaneous values, which differ by the very terms SGP4 stripped out. Stale data and unit errors are real problems too, but even a fresh, correctly converted TLE used this way is wrong by kilometres at epoch.',
        b: 1.1,
        bloom: 'understand',
      },
      {
        id: 'q_critical_inclination',
        q: 'A Molniya orbit is flown at 63.4° inclination. What does that specific value buy?',
        choices: [
          'The J2 apsidal rotation rate is proportional to (5cos²i − 1), which vanishes at i = 63.435°, so the argument of perigee stops drifting and apogee stays parked over the intended hemisphere',
          'It is the inclination that makes the orbit sun-synchronous',
          'It minimises the nodal regression rate',
          'It maximises the ground-station coverage from a mid-latitude site',
        ],
        answer: 0,
        explain:
          'At the critical inclination the secular drift of ω is zero, so a highly eccentric orbit keeps its apogee over the same latitude band for years. Without it, perigee would rotate around the orbit and the long dwell time would wander off the intended hemisphere. Nodal regression is non-zero at 63.4° and sun-synchronicity requires a retrograde inclination near 98°.',
        b: 1.0,
        bloom: 'understand',
      },
    ],
    tags: ['astrodynamics', 'mission-design', 'spacex-core'],
    importance: 1.2,
  },

  {
    id: 't2_m22_lambert_targeting',
    track: 'foundations',
    tier: 2,
    title: "Lambert's Problem & Orbit Targeting",
    summary:
      'Given two positions and a time of flight, find the orbit. You will write a robust Lambert solver, generate an Earth-Mars porkchop plot from it, and close a differential-correction loop that hits a target state.',
    prereqs: ['t2_m19_two_body', 't0_m10_numerical_methods', 't0_m11_optimization'],
    hours: 40,
    topics: [
      "Lambert's problem statement and Lambert's theorem",
      'solution methods: Gauss, universal variables / Battin, Izzo',
      'multi-revolution solutions and their multiplicity',
      'convergence and singular geometries near a 180 degree transfer',
      'targeting and differential correction',
      'the state transition matrix and its use in targeting',
      'B-plane targeting',
      'porkchop plots from repeated Lambert solutions',
      'trajectory correction manoeuvres',
      'linear covariance analysis of targeting errors',
    ],
    objectives: [
      'Implement a robust Lambert solver',
      'Generate a porkchop plot for an Earth-Mars launch window',
      'Use differential correction to hit a target state',
      'Explain how Lambert sits inside a rendezvous targeting loop',
    ],
    resources: [
      { title: 'Orbital Mechanics for Engineering Students, Ch. 5', author: 'Howard D. Curtis', kind: 'book', free: false },
      {
        title: 'Fundamentals of Astrodynamics and Applications, Ch. 7 (Algorithms 57-58)',
        author: 'David A. Vallado',
        kind: 'book',
        free: false,
      },
      { title: 'An Introduction to the Mathematics and Methods of Astrodynamics, Ch. 6-7', author: 'Richard H. Battin', kind: 'book', free: false },
      {
        title: "Revisiting Lambert's problem",
        author: 'Dario Izzo',
        kind: 'paper',
        url: 'https://arxiv.org/abs/1403.2705',
        free: true,
        note: 'Celestial Mechanics and Dynamical Astronomy, 2015. The modern, fast, robust formulation — read it after you have written a universal-variable solver by hand.',
      },
      {
        title: 'lamberthub',
        kind: 'tool',
        url: 'https://github.com/jorgepiloto/lamberthub',
        free: true,
        note: 'A collection of Lambert solvers in Python — use it to cross-validate, not to replace your own.',
      },
    ],
    exercises: [
      {
        id: 'ex_lambert_uv',
        title: 'Universal-variable Lambert solver',
        kind: 'code',
        lang: 'python',
        hours: 8,
        prompt: [
          'Implement `lambert(r1, r2, dt, mu, prograde=True)` returning `(v1, v2)` using the universal-variable formulation',
          '(Curtis Algorithm 5.2 / Vallado Algorithm 57).',
          '',
          '- Compute the transfer angle from the cross product, using the `prograde` flag to choose the branch.',
          '- Form `A = sin(dtheta) sqrt(r1 r2 / (1 - cos(dtheta)))`.',
          '- Solve `F(z) = 0` by Newton iteration on the universal variable `z`, with the Stumpff functions `C(z)` and `S(z)`',
          '  evaluated by series near zero.',
          '- Recover the Lagrange coefficients and thus both velocity vectors.',
          '',
          'Validate against Curtis Example 5.2. Then map the solver failure modes: transfer angles at 179.9° and 180.1°,',
          'and very short and very long times of flight.',
        ].join('\n'),
        starter: `import numpy as np

MU_EARTH = 398600.4418  # km^3/s^2


def stumpff_C(z: float) -> float:
    """C(z) = (1 - cos(sqrt(z)))/z for z > 0, (cosh(sqrt(-z)) - 1)/(-z) for z < 0, 1/2 at z = 0.

    Use the series 1/2 - z/24 + z**2/720 - ... for |z| < 1e-6 to avoid cancellation.
    """
    # TODO: implement all three branches.
    raise NotImplementedError


def stumpff_S(z: float) -> float:
    """S(z) = (sqrt(z) - sin(sqrt(z)))/z**1.5 for z > 0, and the hyperbolic analogue for z < 0, 1/6 at z = 0."""
    # TODO: implement all three branches.
    raise NotImplementedError


def lambert(
    r1: np.ndarray, r2: np.ndarray, dt: float, mu: float = MU_EARTH, prograde: bool = True
) -> tuple[np.ndarray, np.ndarray]:
    """Solve Lambert's problem for the zero-revolution transfer.

    Returns
    -------
    (v1, v2) : departure and arrival velocity vectors, km/s.

    Raises
    ------
    RuntimeError if the Newton iteration fails to converge.
    """
    # TODO: transfer angle -> A -> Newton on z -> Lagrange f, g, gdot -> velocities.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'Stumpff functions have the right values at zero',
            assert: `assert abs(stumpff_C(0.0) - 0.5) < 1e-14
assert abs(stumpff_S(0.0) - 1.0 / 6.0) < 1e-14
assert abs(stumpff_C(1e-10) - 0.5) < 1e-9
assert abs(stumpff_S(1e-10) - 1.0 / 6.0) < 1e-9`,
          },
          {
            name: 'Curtis example 5.2',
            assert: `import numpy as np
r1 = np.array([5000.0, 10000.0, 2100.0])
r2 = np.array([-14600.0, 2500.0, 7000.0])
v1, v2 = lambert(r1, r2, 3600.0)
assert np.allclose(v1, np.array([-5.9925, 1.9254, 3.2456]), atol=1e-3)
assert np.allclose(v2, np.array([-3.3125, -4.1966, -0.38529]), atol=1e-3)`,
          },
          {
            name: 'the solution actually connects the two positions when propagated',
            hidden: true,
            assert: `import numpy as np
from scipy.integrate import solve_ivp
mu = 398600.4418
r1 = np.array([5000.0, 10000.0, 2100.0])
r2 = np.array([-14600.0, 2500.0, 7000.0])
v1, _ = lambert(r1, r2, 3600.0)
f = lambda t, y: np.concatenate([y[3:], -mu * y[:3] / np.linalg.norm(y[:3]) ** 3])
sol = solve_ivp(f, [0.0, 3600.0], np.concatenate([r1, v1]), rtol=1e-12, atol=1e-12)
assert np.linalg.norm(sol.y[:3, -1] - r2) < 1.0`,
          },
        ],
      },
      {
        id: 'ex_porkchop',
        title: 'Earth to Mars porkchop plot',
        kind: 'build',
        hours: 6,
        prompt: [
          'Use your Lambert solver plus planetary ephemerides (`astropy`, JPL SPICE via `spiceypy`, or the approximate',
          'Meeus/Standish series) to build a real porkchop plot.',
          '',
          '- Grid departure dates across a 2 to 3 month window and arrival dates across a 6 to 12 month window.',
          '- At each grid point solve Lambert and compute departure C3 and arrival v_infinity.',
          '- Contour C3 and v_infinity on the same axes; mark the minimum-C3 departure and the total-Δv optimum.',
          '- Identify the Type I and Type II transfer lobes and the ridge between them (the 180° transfer singularity).',
          '',
          'Success: your minimum C3 lands within a km²/s² or so of published values for that synodic window, and you can',
          'explain why the two lobes exist.',
        ].join('\n'),
      },
      {
        id: 'ex_diff_correction',
        title: 'Differential correction with the state transition matrix',
        kind: 'code',
        lang: 'python',
        hours: 5,
        prompt: [
          'Lambert gives you a two-body answer; the real trajectory has J2, drag and finite burns. Close the gap with',
          'differential correction.',
          '',
          '- Propagate the perturbed dynamics *and* the 6×6 state transition matrix by integrating `Phidot = A(t) Phi`',
          '  alongside the state, with `A` the Jacobian of the dynamics.',
          '- Given a target position at a fixed final time, solve `dr_f = Phi_rv dv_0` for the velocity correction, using the',
          '  3×3 position-from-velocity block of Phi.',
          '- Iterate to convergence and report the miss distance per iteration (it should fall roughly quadratically once',
          '  you are in the linear regime).',
          '- Show what happens when the initial guess is bad enough that the linearisation is invalid.',
        ].join('\n'),
        starter: `import numpy as np

MU_EARTH = 398600.4418  # km^3/s^2


def two_body_jacobian(r: np.ndarray, mu: float = MU_EARTH) -> np.ndarray:
    """6x6 Jacobian A = d(state derivative)/d(state) for two-body motion.

    The upper right block is the identity; the lower left is the gravity
    gradient matrix

        G = -mu/|r|^3 * (I3 - 3 * outer(r_hat, r_hat))

    and the other two blocks are zero.
    """
    # TODO: implement
    raise NotImplementedError


def propagate_with_stm(
    x0: np.ndarray, dt: float, mu: float = MU_EARTH
) -> tuple[np.ndarray, np.ndarray]:
    """Propagate the state and the state transition matrix together.

    Integrate the 42-element vector [state(6), Phi.flatten()(36)] with
    Phidot = A(t) @ Phi and Phi(0) = I.

    Returns (state_at_dt, Phi_at_dt).
    """
    # TODO: implement
    raise NotImplementedError


def correct_velocity(x0: np.ndarray, r_target: np.ndarray, dt: float, tol: float = 1e-6):
    """Newton-iterate on the initial velocity until the propagated position
    hits r_target at time dt.

    Each step solves Phi_rv @ dv0 = (r_target - r_final), where Phi_rv is the
    upper-right 3x3 block of the state transition matrix.
    """
    # TODO: loop: propagate, form the miss, solve for dv0, apply, repeat.
    raise NotImplementedError
`,
      },
    ],
    cards: [
      {
        id: 'c_lambert_statement',
        front: "State Lambert's problem.",
        back: 'Given two position vectors r₁ and r₂, a time of flight Δt, and the transfer direction and revolution count, find the conic connecting them — equivalently, find v₁ and v₂.',
      },
      {
        id: 'c_lambert_theorem',
        front: "State Lambert's theorem.",
        back: 'The transfer time depends only on the semi-major axis a, the chord length c = ‖r₂ − r₁‖, and the sum r₁ + r₂ — not on any other detail of the geometry.',
        formula: true,
      },
      {
        id: 'c_lambert_min_energy',
        front: 'Semi-major axis of the minimum-energy Lambert transfer.',
        back: 'a_min = s/2, with the semiperimeter s = (r₁ + r₂ + c)/2. It is the smallest a for which a solution exists, and it corresponds to the longest parabolic-free transfer time boundary.',
        formula: true,
      },
      {
        id: 'c_lambert_180',
        front: "Why does Lambert's problem become ill-conditioned near a 180° transfer angle?",
        back: 'r₁ and r₂ become collinear, so their cross product vanishes and the orbit plane is undefined — infinitely many planes contain both points. The solution stays mathematically defined but the out-of-plane component becomes arbitrarily sensitive to the inputs.',
      },
      {
        id: 'c_lambert_multirev',
        front: 'How many Lambert solutions exist for N revolutions?',
        back: 'For each revolution count N ≥ 1 there are generally two solutions — a short-period (low-energy) and a long-period (high-energy) branch — that merge at a minimum time of flight for that N. Counting the zero-revolution case gives 2N + 1 solutions for up to N revolutions.',
      },
      {
        id: 'c_stumpff',
        front: 'Define the Stumpff functions C(z) and S(z).',
        back: 'C(z) = (1 − cos√z)/z and S(z) = (√z − sin√z)/z^(3/2) for z > 0, with the hyperbolic analogues for z < 0 and C(0) = 1/2, S(0) = 1/6. Near z = 0 use the series to avoid cancellation.',
        formula: true,
      },
      {
        id: 'c_stm_targeting',
        front: 'How is the state transition matrix used for targeting?',
        back: 'δx_f = Φ(t_f, t₀)δx₀. Taking the 3×3 block that maps initial velocity to final position, Φ_rv, the correction is δv₀ = Φ_rv⁻¹ δr_f — one Newton step on a shooting problem.',
        formula: true,
      },
      {
        id: 'c_stm_propagation',
        front: 'How do you propagate the state transition matrix numerically?',
        back: 'Integrate Φ̇ = A(t)Φ with Φ(t₀) = I alongside the state, where A is the Jacobian of the dynamics. For 6 states that is 36 extra ODEs — expensive but exact, and far better conditioned than finite-differencing the whole trajectory.',
        formula: true,
      },
      {
        id: 'c_bplane',
        front: 'What is the B-plane and what are its coordinates?',
        back: 'The plane through the target body centre perpendicular to the incoming asymptote v_∞. The aim point is described by B·R and B·T, which behave almost linearly with respect to a correction manoeuvre — which is why interplanetary targeting is done there rather than in position space.',
      },
      {
        id: 'c_porkchop',
        front: 'What does a porkchop plot show?',
        back: 'Contours of departure C3 and arrival v_∞ (or total Δv) over a grid of departure and arrival dates, each point being one Lambert solution. The closed contours give the launch window its name and shape.',
      },
      {
        id: 'c_type_i_ii',
        front: 'Type I vs Type II interplanetary transfers.',
        back: 'Type I sweeps a heliocentric transfer angle below 180°, Type II above it. They appear as the two lobes of a porkchop plot, separated by the 180° ridge where the solution degenerates.',
      },
      {
        id: 'c_tcm',
        front: 'What is a trajectory correction manoeuvre and when is it cheapest?',
        back: 'A small burn that removes accumulated targeting error. Early TCMs are cheap because the error has not yet propagated into a large miss, but they must wait long enough for orbit determination to have converged — a genuine trade, not a preference.',
      },
      {
        id: 'c_lambert_in_rendezvous',
        front: 'How does Lambert sit inside a rendezvous targeting loop?',
        back: 'Propagate the target to a chosen intercept time, solve Lambert from the chaser current state to that point, apply the first impulse, then re-solve every cycle as navigation improves. The repeated re-solve is what absorbs execution error and unmodelled dynamics.',
      },
      {
        id: 'c_linear_covariance',
        front: 'What does linear covariance analysis give you in targeting?',
        back: 'It propagates a covariance through the same STM that propagates the state, producing a predicted dispersion at the target (and the Δv statistics of the correction) without running a Monte Carlo — valid only while the linearisation holds.',
      },
    ],
    quiz: [
      {
        id: 'q_lambert_180',
        q: "Why does Lambert's problem become ill-conditioned near a 180° transfer angle?",
        choices: [
          'The two position vectors become collinear, so r₁ × r₂ → 0 and the orbit plane is undefined — infinitely many planes contain both points and the out-of-plane solution becomes arbitrarily sensitive',
          'The time of flight goes to infinity',
          'The eccentricity necessarily exceeds 1, so the elliptic formulation no longer applies',
          'The Stumpff functions become singular at that transfer angle',
        ],
        answer: 0,
        explain:
          'The plane of the transfer is fixed by the cross product of the two position vectors. When they are antiparallel that cross product vanishes and the plane is undetermined — a genuine degeneracy of the problem, not an artefact of a particular solver. Practically, a mission designer nudges the arrival date to avoid the ridge; this is the gap between the Type I and Type II lobes on a porkchop plot.',
        b: 1.0,
        bloom: 'understand',
      },
      {
        id: 'q_lambert_multirev',
        q: 'What extra information distinguishes multi-revolution Lambert solutions, and how many are there?',
        choices: [
          'You must specify the revolution count N and which of the two branches (short-period or long-period) you want; with up to N revolutions there are 2N + 1 solutions in total',
          'Only the direction of motion, prograde or retrograde; there is exactly one solution per revolution count',
          'The eccentricity must be specified in advance; there is one solution per eccentricity',
          'Multi-revolution solutions are unique once the time of flight is fixed',
        ],
        answer: 0,
        explain:
          'For each N ≥ 1 the time-of-flight curve has a minimum, and a given Δt above that minimum is achieved by two different semi-major axes — the low-energy and high-energy branches. Adding the single zero-revolution solution gives 2N + 1. A solver that only returns one answer is silently choosing a branch for you, which matters a great deal for low-thrust-seeded or multi-rev transfers.',
        b: 1.3,
        bloom: 'analyze',
      },
      {
        id: 'q_lambert_rendezvous',
        q: 'How is Lambert used inside a rendezvous targeting loop?',
        choices: [
          'Propagate the target to a chosen intercept time, solve Lambert from the chaser current navigated state to that point, execute the first impulse, and re-solve each guidance cycle so navigation updates and execution errors are absorbed',
          'Solve it once before launch and fly the resulting open-loop burn schedule',
          'Use it to compute the target orbital elements from ground tracking data',
          'Use it to size the propellant tanks, then discard it for the flight phase',
        ],
        answer: 0,
        explain:
          'Lambert is the guidance kernel: it converts "where I am, where the target will be, when I want to arrive" into a required velocity. Closing the loop around it — re-solving each cycle — is what turns a two-body idealisation into a robust targeting law, exactly as Apollo did with Lambert-based powered flight guidance.',
        b: 0.9,
        bloom: 'apply',
      },
      {
        id: 'q_stm_targeting',
        q: 'In differential correction, which block of the state transition matrix do you invert to correct a position miss at a fixed final time?',
        choices: [
          'The 3×3 block mapping initial velocity to final position, Φ_rv, giving δv₀ = Φ_rv⁻¹ δr_f',
          'The full 6×6 Φ, inverted directly',
          'The block mapping initial position to final position, Φ_rr',
          'The transpose of Φ, since the correction runs backwards in time',
        ],
        answer: 0,
        explain:
          'You control the departure velocity and you care about the arrival position, so the relevant sensitivity is ∂r_f/∂v₀ — the upper-right 3×3 block. Inverting it gives the Newton step. The full Φ is not square-invertible against a 3-vector requirement, and Φ_rr describes a position change you cannot command.',
        b: 1.1,
        bloom: 'apply',
      },
    ],
    tags: ['astrodynamics', 'guidance', 'mission-design'],
    importance: 1.2,
  },

  {
    id: 't2_m23_relative_motion_rpo',
    track: 'foundations',
    tier: 2,
    title: 'Relative Motion, Rendezvous & Proximity Operations',
    summary:
      'Derive and implement the Clohessy-Wiltshire equations, design a two-burn rendezvous that survives a missed burn, and understand the approach corridors and abort logic that let Dragon near the ISS.',
    prereqs: ['t2_m22_lambert_targeting', 't2_m19_two_body', 't0_m08_odes'],
    hours: 50,
    topics: [
      'relative motion frames: LVLH, Hill, RIC',
      'derivation of the Clohessy-Wiltshire equations',
      'the CW state transition matrix',
      'secular in-track drift and why it dominates',
      'football and drifting relative orbits',
      'V-bar and R-bar approaches and their safety properties',
      'natural motion circumnavigation',
      'passive safety and safety ellipses',
      'two-impulse CW rendezvous targeting',
      'Tschauner-Hempel equations for eccentric reference orbits',
      'glideslope algorithms',
      'approach corridors and keep-out spheres',
      'docking vs berthing',
      'ISS visiting vehicle requirements',
      'relative navigation sensors: relative GPS, lidar, cameras, retroreflectors',
      'abort trajectories and collision avoidance manoeuvres',
    ],
    objectives: [
      'Derive and implement the CW equations and their state transition matrix',
      'Design a two-burn rendezvous and verify it in a nonlinear propagator',
      'Design a passively safe approach and show it stays outside the keep-out sphere after a missed burn',
      'Explain the ISS approach profile and the abort options at each point',
    ],
    resources: [
      { title: 'Orbital Mechanics for Engineering Students, Ch. 7', author: 'Howard D. Curtis', kind: 'book', free: false },
      { title: 'Analytical Mechanics of Space Systems, Ch. 14', author: 'Schaub & Junkins', kind: 'book', free: false, note: 'The best treatment of relative motion, including the eccentric-reference-orbit case.' },
      {
        title: 'Automated Rendezvous and Docking of Spacecraft',
        author: 'Wigbert Fehse',
        kind: 'book',
        free: false,
        note: 'Cambridge. The operational bible: corridors, sensors, failure modes, real mission profiles.',
      },
      { title: 'Fundamentals of Astrodynamics and Applications, Ch. 6.6', author: 'David A. Vallado', kind: 'book', free: false },
      {
        title: 'ISS Visiting Vehicle documentation',
        author: 'NASA',
        kind: 'docs',
        url: 'https://ntrs.nasa.gov',
        free: true,
        note: 'Search NTRS for visiting vehicle approach and proximity operations requirements.',
      },
    ],
    exercises: [
      {
        id: 'ex_cw_stm',
        title: 'The CW state transition matrix, checked against nonlinear truth',
        kind: 'code',
        lang: 'python',
        hours: 5,
        prompt: [
          'Implement the closed-form CW state transition matrix `Phi(t)` for a circular reference orbit of mean motion `n`,',
          'using the LVLH convention x = radial, y = in-track, z = cross-track.',
          '',
          '- Verify `Phi(0) = I` and `det(Phi(t)) = 1` for all t (the flow is symplectic).',
          '- Verify the drift-free condition: starting with `ydot0 = -2 n x0` leaves no secular in-track drift.',
          '- Propagate both the CW model and full nonlinear two-body relative motion for separations of 100 m, 1 km and',
          '  50 km, and plot the divergence over five orbits.',
          '',
          'Report the separation at which the CW error exceeds 1% of the separation after one orbit.',
        ].join('\n'),
        starter: `import numpy as np


def cw_stm(n: float, t: float) -> np.ndarray:
    """Clohessy-Wiltshire state transition matrix for [x, y, z, xdot, ydot, zdot].

    x = radial (outward), y = in-track (velocity direction), z = cross-track.

    Position rows:
        x(t) = (4 - 3 cos nt) x0 + (sin(nt)/n) xd0 + (2/n)(1 - cos nt) yd0
        y(t) = 6 (sin nt - nt) x0 + y0 - (2/n)(1 - cos nt) xd0 + (1/n)(4 sin nt - 3 nt) yd0
        z(t) = cos(nt) z0 + (sin(nt)/n) zd0

    Differentiate those for the velocity rows.
    """
    # TODO: build and return the 6x6 matrix.
    raise NotImplementedError


def cw_deriv(t: float, s: np.ndarray, n: float) -> np.ndarray:
    """CW equations of motion as a first-order system.

        xdd = 3 n^2 x + 2 n yd
        ydd = -2 n xd
        zdd = -n^2 z
    """
    # TODO: implement
    raise NotImplementedError
`,
        tests: [
          {
            name: 'the STM is the identity at t = 0',
            assert: `import numpy as np
assert np.allclose(cw_stm(0.0011, 0.0), np.eye(6), atol=1e-12)`,
          },
          {
            name: 'the CW flow is symplectic, so the STM has unit determinant',
            assert: `import numpy as np
for t in (100.0, 1000.0, 5000.0):
    assert abs(np.linalg.det(cw_stm(0.0011, t)) - 1.0) < 1e-8`,
          },
          {
            name: 'ydot0 = -2 n x0 removes the secular in-track drift',
            assert: `import numpy as np
n = 0.0011
x0 = 0.1
s0 = np.array([x0, 0.0, 0.0, 0.0, -2.0 * n * x0, 0.0])
period = 2 * np.pi / n
a = cw_stm(n, 10 * period) @ s0
b = cw_stm(n, 20 * period) @ s0
assert abs(a[1] - b[1]) < 1e-6`,
          },
          {
            name: 'a pure radial offset without the drift condition does drift in-track',
            assert: `import numpy as np
n = 0.0011
s0 = np.array([0.1, 0.0, 0.0, 0.0, 0.0, 0.0])
period = 2 * np.pi / n
assert abs((cw_stm(n, 5 * period) @ s0)[1]) > 1.0`,
          },
          {
            name: 'the STM agrees with integrating the CW equations',
            hidden: true,
            assert: `import numpy as np
from scipy.integrate import solve_ivp
n = 0.0011
s0 = np.array([0.05, -0.2, 0.01, 1e-4, -2e-4, 5e-5])
sol = solve_ivp(cw_deriv, [0.0, 3000.0], s0, args=(n,), rtol=1e-12, atol=1e-14)
assert np.allclose(sol.y[:, -1], cw_stm(n, 3000.0) @ s0, rtol=1e-6, atol=1e-9)`,
          },
        ],
      },
      {
        id: 'ex_vbar_approach',
        title: 'V-bar approach from 1 km to 10 m with hold points',
        kind: 'build',
        hours: 6,
        prompt: [
          'Design and simulate a V-bar (along-track) approach from 1 km behind the target to 10 m, with hold points at',
          '250 m, 30 m and 10 m.',
          '',
          '- Use two-impulse CW transfers between hold points, and station-keeping burns to hold.',
          '- Track total Δv and elapsed time.',
          '- Impose a 200 m keep-out sphere with an approach corridor — a cone of half-angle 10° along the docking axis —',
          '  and verify the trajectory stays inside it.',
          '- Verify the whole profile again in a nonlinear propagator with J2 and differential drag.',
          '',
          'Deliverable: a plot in the LVLH frame with the corridor and keep-out sphere drawn, a Δv table by phase, and a',
          'short note on why hold points exist at all.',
        ].join('\n'),
      },
      {
        id: 'ex_passive_safety',
        title: 'Prove your approach is passively safe',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: [
          'Passive safety means: if the next burn never happens, the vehicle still misses the target.',
          '',
          '- Take each point on your approach trajectory, zero all subsequent burns, and propagate for 24 hours.',
          '- Compute the minimum miss distance over that free-drift arc.',
          '- Plot minimum miss distance against the point along the approach where the failure occurs.',
          '- Identify where passive safety is lost, and redesign — biasing the approach off the V-bar, or using an R-bar',
          '  segment — so the free-drift miss distance stays above the keep-out sphere radius for as long as possible.',
          '',
          'Then add a 3σ burn-execution error and re-run as a Monte Carlo. Report the probability of corridor violation.',
        ].join('\n'),
        starter: `import numpy as np


def free_drift_miss(state0: np.ndarray, n: float, horizon_s: float, samples: int = 20000) -> float:
    """Minimum distance to the target over a free-drift arc.

    Propagate the CW state with no further burns for horizon_s seconds and
    return the smallest ||[x, y, z]|| reached. This is the number that decides
    whether an approach point is passively safe.
    """
    # TODO: sample the CW state transition matrix over the horizon and take the
    #       minimum position norm.
    raise NotImplementedError


def is_passively_safe(
    state0: np.ndarray, n: float, keepout_m: float = 200.0, horizon_s: float = 86400.0
) -> bool:
    """True iff a total loss of propulsion at this state keeps the vehicle
    outside the keep-out sphere for the whole horizon."""
    # TODO: compare free_drift_miss against keepout_m.
    raise NotImplementedError
`,
      },
    ],
    cards: [
      {
        id: 'c_cw_equations',
        front: 'Write the Clohessy-Wiltshire equations.',
        back: 'ẍ − 3n²x − 2nẏ = 0 ·  ÿ + 2nẋ = 0 ·  z̈ + n²z = 0, with x radial, y in-track, z cross-track, and n the reference mean motion.',
        formula: true,
      },
      {
        id: 'c_cw_assumptions',
        front: 'What assumptions go into the CW equations?',
        back: 'A circular reference orbit, separation small compared with the orbit radius (so the gravity difference can be linearised), two-body gravity only, and no differential drag or J2.',
      },
      {
        id: 'c_cw_solution_x',
        front: 'Write the CW solution for the radial coordinate.',
        back: 'x(t) = (4 − 3cos nt)x₀ + (sin nt / n)ẋ₀ + (2/n)(1 − cos nt)ẏ₀',
        formula: true,
      },
      {
        id: 'c_cw_secular_drift',
        front: 'Which term in the CW solution is secular, and what drives it?',
        back: 'The in-track terms 6(sin nt − nt)x₀ and −(3t)ẏ₀: both grow linearly in time. A radial offset or an in-track velocity offset produces unbounded along-track drift, because it is really a semi-major axis (and therefore period) mismatch.',
        formula: true,
      },
      {
        id: 'c_cw_no_drift',
        front: 'Condition for a drift-free (closed) relative orbit.',
        back: 'ẏ₀ = −2n x₀. It is exactly the statement that the two vehicles have the same semi-major axis and therefore the same period.',
        formula: true,
      },
      {
        id: 'c_drift_per_rev',
        front: 'In-track drift per revolution from a semi-major axis difference δa.',
        back: 'Δy ≈ −3π·δa per orbit. A 1 km difference in semi-major axis drifts you nearly 10 km along-track every revolution.',
        formula: true,
      },
      {
        id: 'c_football_orbit',
        front: 'What is a football (2:1 ellipse) relative orbit?',
        back: 'A closed relative orbit satisfying ẏ₀ = −2n x₀ in which the chaser traces an ellipse around the target with in-track semi-axis exactly twice the radial semi-axis, traversed once per orbit in the retrograde sense.',
      },
      {
        id: 'c_vbar_rbar',
        front: 'V-bar vs R-bar approach — what is the difference?',
        back: 'V-bar approaches along the velocity (in-track) direction; R-bar approaches along the radius, from below (+R-bar) or above. R-bar exploits the natural orbital-mechanics braking of the radial direction, so a missed burn tends to drop the chaser away rather than carry it into the target.',
      },
      {
        id: 'c_rbar_safety',
        front: 'Why is an R-bar approach considered passively safer, and what does it cost?',
        back: 'On R-bar the gravity-gradient term naturally decelerates an approaching vehicle, so an unplanned free drift tends to move it away along-track. The cost is continuous thrusting against the gradient — more propellant — and plume impingement geometry that points at the target.',
      },
      {
        id: 'c_passive_safety',
        front: 'Define passive safety in proximity operations.',
        back: 'If every subsequent manoeuvre fails to execute, the free-drift trajectory still misses the target by more than the keep-out distance for a specified time (often 24 hours). It is a design requirement, not a hope, and it is verified by propagating from every point on the approach.',
      },
      {
        id: 'c_keepout_corridor',
        front: 'What are the keep-out sphere and the approach corridor?',
        back: 'The keep-out sphere (200 m for the ISS) may only be entered with explicit authorisation and a demonstrated safe trajectory. Inside it the vehicle must stay within an approach corridor — a cone about the docking axis — with bounded rate and attitude.',
      },
      {
        id: 'c_docking_vs_berthing',
        front: 'Docking vs berthing.',
        back: 'Docking: the visiting vehicle flies itself into the mechanism under its own GNC and the capture is dynamic. Berthing: the vehicle holds a station a few metres away, is grappled by a robotic arm and is then bolted on. Berthing is gentler on the structure; docking is autonomous and faster.',
      },
      {
        id: 'c_tschauner_hempel',
        front: 'When do the CW equations fail, and what replaces them?',
        back: 'They assume a circular reference orbit; at meaningful eccentricity the linearisation must retain the time-varying terms. Use the Tschauner-Hempel equations (or the Yamanaka-Ankersen closed-form STM) for an eccentric reference orbit.',
      },
      {
        id: 'c_glideslope',
        front: 'What is a glideslope algorithm?',
        back: 'A guidance law that commands closing rate as a decreasing function of range, typically ṙ = −(a + b·r), executed as a sequence of small burns. It gives a predictable, bounded approach with a well-defined arrival rate.',
        formula: true,
      },
      {
        id: 'c_rpo_sensors',
        front: 'Relative navigation sensors, by range.',
        back: 'Far field: relative GPS and ground tracking, kilometres to hundreds of metres. Mid field: lidar and radar against retroreflectors, kilometres to metres. Near field: cameras with pattern recognition on docking targets, tens of metres to contact. Each hand-off is a point of failure that must be tested.',
      },
    ],
    quiz: [
      {
        id: 'q_cw_drift',
        q: 'Which term in the CW solution produces secular in-track drift, and what physically causes it?',
        choices: [
          'The terms 6(sin nt − nt)x₀ and −3t·ẏ₀ in y(t) — a radial offset or in-track velocity offset is really a semi-major axis (hence period) mismatch, so the vehicles separate a little more every revolution',
          'The cross-track term z(t) = z₀cos nt, which accumulates because of the orbital plane difference',
          'The 2n ẏ coupling in the radial equation, which pumps energy into the radial motion',
          'There is no secular term; all CW motion is periodic',
        ],
        answer: 0,
        explain:
          'The linear-in-t terms live only in the in-track channel. Their physical meaning is that a radial displacement or along-track speed difference changes the orbital energy and therefore the period, and a period difference integrates into drift. The cross-track channel is a pure undamped oscillator at the orbit rate and never drifts, which is why plane errors behave completely differently from in-plane ones.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'q_rbar_vbar',
        q: 'Why is an R-bar approach often considered passively safer than V-bar, and what does it cost?',
        choices: [
          'On R-bar the gravity gradient naturally decelerates the approach, so a missed burn tends to carry the chaser away rather than through the target; the cost is continuous thrust against that gradient and plume impingement pointed at the target',
          'R-bar is safer because it is out of the orbital plane, so a failure cannot cause a collision',
          'R-bar requires no thrusting at all, which is why it is safer and cheaper',
          'R-bar is safer only because it is shorter; the propellant cost is identical',
        ],
        answer: 0,
        explain:
          'Approaching along the radius means the orbital dynamics themselves oppose the closure — free drift decelerates and then departs. That is real passive safety rather than a procedural one. The price is propellant (you are fighting the gradient the whole way) and geometry: your thrusters point at the target, so plume impingement and contamination become design drivers. The Shuttle used +R-bar to the ISS for exactly this trade.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'q_cw_eccentric',
        q: 'Your reference orbit has e = 0.05. What breaks in the CW model, and what do you use instead?',
        choices: [
          'CW assumes a circular reference, so the mean motion and the gravity-gradient coefficients are no longer constant; use the Tschauner-Hempel equations or the Yamanaka-Ankersen closed-form solution for an eccentric reference',
          'Nothing breaks; CW is exact for any eccentricity below 0.1',
          'Only the cross-track equation breaks; the in-plane equations remain valid',
          'CW remains valid but the state transition matrix loses its unit determinant',
        ],
        answer: 0,
        explain:
          'The CW derivation linearises about a circular orbit, so n is constant and the coefficients are constant. At e = 0.05 the reference radius and angular rate vary by several percent over a revolution, which shows up as a growing phase and amplitude error — typically metres over an orbit at kilometre separations, which matters for a corridor. Tschauner-Hempel keeps the time-varying coefficients; Yamanaka-Ankersen gives a closed-form STM for it.',
        b: 1.1,
        bloom: 'understand',
      },
      {
        id: 'q_abort_30m',
        q: 'A thruster fails at 30 m on final approach. What does a well-designed abort do?',
        choices: [
          'Fire a pre-computed collision avoidance manoeuvre using the remaining thrusters that puts the vehicle onto a free-drift trajectory clearing the keep-out sphere, verified beforehand for every point on the approach and for every credible single failure',
          'Immediately null all relative velocity and hold position until the ground can analyse the failure',
          'Continue the approach, since 30 m is too close to abort safely',
          'Rotate the vehicle so the failed thruster points away from the target and continue',
        ],
        answer: 0,
        explain:
          'Abort trajectories are designed, verified and loaded in advance for every phase, because at 30 m there is no time for analysis and the geometry is unforgiving. The design must assume the failure has already reduced your authority, so the CAM has to work with the remaining thrusters. Holding position is not safe: residual rates and unmodelled dynamics close the gap. The whole approach is laid out so that the free-drift consequence of a failure is already acceptable.',
        b: 1.2,
        bloom: 'analyze',
      },
    ],
    tags: ['astrodynamics', 'rendezvous', 'dragon', 'spacex-core', 'interview'],
    importance: 1.3,
  },

  {
    id: 't2_m24_edl',
    track: 'foundations',
    tier: 2,
    title: 'Entry, Descent & Landing',
    summary:
      'From hypersonic entry to touchdown: derive the Allen-Eggers ballistic solution, find peak deceleration and heating, and formulate the hoverslam ignition problem that a Falcon booster solves every flight.',
    prereqs: ['t1_m18_atmospheric_flight', 't2_m19_two_body', 't0_m08_odes'],
    hours: 45,
    topics: [
      'entry interface conditions',
      'ballistic entry and the Allen-Eggers solution',
      'peak deceleration and peak heating relations',
      'ballistic coefficient and its effect on the trajectory',
      'the entry corridor: undershoot and overshoot boundaries',
      'skip entry',
      'lifting entry and bank-angle modulation',
      'Apollo entry guidance and its descendants',
      'Shuttle drag-vs-energy entry guidance',
      'aerothermodynamics: convective and radiative heating, Sutton-Graves',
      'thermal protection systems, heat rate vs heat load',
      'hypersonic aerodynamics and the transonic transition',
      'propulsive descent: entry burn, aerodynamic guidance, landing burn',
      'divert capability and the landing ellipse',
      'terminal descent sensors: radar altimeter, lidar, terrain relative navigation',
      'landing burn timing and the hoverslam problem',
      'Mars EDL: thin atmosphere, supersonic parachutes, sky crane',
      'reusable booster return modes: RTLS vs droneship, boostback burns',
    ],
    objectives: [
      'Derive and implement the Allen-Eggers ballistic entry solution',
      'Compute peak-g and peak-heating altitudes and explain what each depends on',
      'Formulate the 1-D hoverslam ignition problem and solve for ignition altitude',
      'Describe the Falcon 9 EDL phases and what GNC does in each',
    ],
    resources: [
      { title: 'Orbital Mechanics for Engineering Students, Ch. 11', author: 'Howard D. Curtis', kind: 'book', free: false },
      { title: 'Hypersonic and Planetary Entry Flight Mechanics', author: 'Vinh, Busemann & Culp', kind: 'book', free: false },
      { title: 'Dynamics of Atmospheric Re-Entry', author: 'Regan & Anandakrishnan', kind: 'book', free: false },
      {
        title: 'NASA Technical Reports Server — Apollo lunar descent guidance (Klumpp) and Shuttle entry guidance',
        kind: 'paper',
        url: 'https://ntrs.nasa.gov',
        free: true,
        note: 'Klumpp on the Apollo lunar descent guidance equations is still the clearest description of a real, flown guidance law.',
      },
      {
        title: 'Ping Lu — entry guidance and powered descent papers',
        kind: 'paper',
        free: false,
        note: 'Journal of Guidance, Control, and Dynamics. The modern predictor-corrector entry guidance literature.',
      },
    ],
    exercises: [
      {
        id: 'ex_allen_eggers',
        title: 'Allen-Eggers ballistic entry vs a numerical 3-DOF',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: [
          'Implement the Allen-Eggers closed-form ballistic entry solution and check it against numerical integration.',
          '',
          '```',
          'v(h) = v_E exp( -(rho(h) H) / (2 beta |sin(gamma_E)|) ),   beta = m/(Cd A)',
          '```',
          '',
          '- Implement `allen_eggers_velocity(h, ...)`, `peak_deceleration(...)` and `peak_decel_altitude(...)`.',
          '- Integrate a flat-planet 3-DOF ballistic entry with an exponential atmosphere and overlay the two.',
          '- Sweep beta over 50, 200 and 1000 kg/m² and confirm that the peak deceleration *magnitude* is unchanged while',
          '  the *altitude* at which it occurs drops as beta rises.',
          '- Sweep the entry flight-path angle and confirm the peak deceleration scales with sin(gamma_E).',
        ].join('\n'),
        starter: `import math

RHO0 = 1.225     # kg/m^3
H_SCALE = 7200.0  # m


def allen_eggers_velocity(
    h: float, v_entry: float, beta: float, gamma_entry: float,
    rho0: float = RHO0, h_scale: float = H_SCALE
) -> float:
    """Velocity at altitude h for a ballistic entry (Allen-Eggers).

    Parameters
    ----------
    v_entry : entry interface velocity, m/s
    beta : ballistic coefficient m/(Cd A), kg/m^2
    gamma_entry : entry flight path angle, radians, NEGATIVE for descending
    """
    # TODO: rho = rho0 exp(-h/h_scale); v = v_entry * exp(-rho * h_scale / (2 beta |sin gamma|))
    raise NotImplementedError


def peak_deceleration(v_entry: float, gamma_entry: float, h_scale: float = H_SCALE) -> float:
    """Maximum deceleration magnitude, m/s^2.

    a_max = v_entry^2 |sin(gamma_entry)| / (2 e h_scale)

    Note what is ABSENT from this expression -- that absence is the point of the exercise.
    """
    # TODO: implement
    raise NotImplementedError


def peak_decel_altitude(
    beta: float, gamma_entry: float, rho0: float = RHO0, h_scale: float = H_SCALE
) -> float:
    """Altitude of peak deceleration, m.

    Peak occurs where rho = beta |sin(gamma_entry)| / h_scale, so
    h = h_scale * ln(rho0 * h_scale / (beta |sin(gamma_entry)|)).
    """
    # TODO: implement
    raise NotImplementedError
`,
        tests: [
          {
            name: 'velocity is unchanged at the top of the atmosphere and decays below',
            assert: `import math
v = allen_eggers_velocity(200000.0, 7800.0, 200.0, math.radians(-6.0))
assert abs(v - 7800.0) / 7800.0 < 1e-6
assert allen_eggers_velocity(20000.0, 7800.0, 200.0, math.radians(-6.0)) < 1000.0`,
          },
          {
            name: 'peak deceleration does not depend on ballistic coefficient',
            assert: `import math
a1 = peak_deceleration(7800.0, math.radians(-6.0))
assert a1 > 0.0
assert abs(a1 - 7800.0 ** 2 * math.sin(math.radians(6.0)) / (2 * math.e * 7200.0)) < 1e-6`,
          },
          {
            name: 'a higher ballistic coefficient pushes the peak lower in the atmosphere',
            assert: `import math
g = math.radians(-6.0)
assert peak_decel_altitude(50.0, g) > peak_decel_altitude(200.0, g) > peak_decel_altitude(1000.0, g)`,
          },
          {
            name: 'a steeper entry gives a higher peak deceleration',
            hidden: true,
            assert: `import math
assert peak_deceleration(7800.0, math.radians(-12.0)) > peak_deceleration(7800.0, math.radians(-3.0))`,
          },
        ],
      },
      {
        id: 'ex_hoverslam',
        title: 'Hoverslam ignition altitude and its sensitivity',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: [
          'A booster whose minimum throttle already gives thrust-to-weight greater than one cannot hover. There is exactly',
          'one ignition point that brings velocity and altitude to zero together — the hoverslam, or suicide burn.',
          '',
          '- Derive and implement `ignition_altitude(v, thrust_accel, g)` for the 1-D constant-thrust case:',
          '  `h = v^2 / (2 (a_T - g))`.',
          '- Simulate the descent and confirm both `h` and `v` reach zero simultaneously.',
          '- Sweep thrust-to-weight from 1.5 to 4 and plot ignition altitude and burn duration.',
          '- Introduce a 1% error in the assumed thrust and a 50 m error in the altitude estimate, and report the resulting',
          '  touchdown velocity. That number is why the real system throttles rather than flying open loop.',
        ].join('\n'),
        starter: `import math

G_EARTH = 9.80665


def ignition_altitude(v: float, thrust_accel: float, g: float = G_EARTH) -> float:
    """Altitude above the pad at which a constant-thrust braking burn must start.

    Parameters
    ----------
    v : descent speed magnitude at ignition, m/s (positive number)
    thrust_accel : thrust / mass, m/s^2, which must exceed g

    Returns
    -------
    Altitude in metres such that velocity and altitude reach zero together.

    Raises
    ------
    ValueError if thrust_accel <= g (the vehicle cannot decelerate).
    """
    # TODO: implement, including the guard.
    raise NotImplementedError


def touchdown_velocity(
    v0: float, h0: float, thrust_accel: float, g: float = G_EARTH
) -> float:
    """Speed at h = 0 if the burn starts at altitude h0 with descent speed v0.

    Negative return value means the vehicle stopped above the pad and is climbing.
    """
    # TODO: use v^2 = v0^2 - 2 (thrust_accel - g) h0, taking care with the sign
    #       when the bracket goes negative.
    raise NotImplementedError
`,
        tests: [
          {
            name: 'ignition altitude for a simple case',
            assert: `h = ignition_altitude(100.0, 2.0 * G_EARTH)
assert abs(h - 100.0 ** 2 / (2 * G_EARTH)) < 1e-9`,
          },
          {
            name: 'insufficient thrust is rejected',
            assert: `try:
    ignition_altitude(100.0, 0.9 * G_EARTH)
except ValueError:
    pass
else:
    raise AssertionError("thrust below weight must raise ValueError")`,
          },
          {
            name: 'starting at the computed altitude lands at zero velocity',
            assert: `a = 2.5 * G_EARTH
h = ignition_altitude(250.0, a)
assert abs(touchdown_velocity(250.0, h, a)) < 1e-6`,
          },
          {
            name: 'igniting late leaves residual velocity at the pad',
            hidden: true,
            assert: `a = 2.5 * G_EARTH
h = ignition_altitude(250.0, a)
assert touchdown_velocity(250.0, h - 50.0, a) > 5.0`,
          },
        ],
      },
      {
        id: 'ex_falcon_edl',
        title: 'Three-phase Falcon-like booster return',
        kind: 'build',
        hours: 8,
        prompt: [
          'Simulate a 3-DOF booster return with the three real phases, and report what GNC is doing in each.',
          '',
          '1. **Entry burn**: ignite at roughly 70 km descending near 2 km/s, burn to reduce velocity before the dense',
          '   atmosphere, and show the peak heating rate with and without it.',
          '2. **Aerodynamic phase**: grid fins only, from hypersonic through transonic, steering toward a target point.',
          '   Model the lift as a small L/D and show the achievable divert footprint.',
          '3. **Landing burn**: single-engine hoverslam onto the target, with throttling to absorb navigation error.',
          '',
          'Deliverables: altitude, velocity, dynamic pressure and heating-rate time histories; the divert footprint; the',
          'propellant used by each phase; and a paragraph on why RTLS costs more propellant than a droneship recovery.',
        ].join('\n'),
      },
    ],
    cards: [
      {
        id: 'c_allen_eggers',
        front: 'Write the Allen-Eggers ballistic entry velocity solution.',
        back: 'v(h) = v_E·exp(−ρ(h)H / (2β|sin γ_E|)), with β = m/(C_D A) the ballistic coefficient, H the atmospheric scale height and γ_E the entry flight-path angle.',
        formula: true,
      },
      {
        id: 'c_peak_decel',
        front: 'Peak deceleration for a ballistic entry — write it and say what it does NOT depend on.',
        back: 'a_max = v_E²|sin γ_E|/(2eH). It is independent of the ballistic coefficient and of vehicle mass — only entry speed, entry angle and scale height matter.',
        formula: true,
      },
      {
        id: 'c_peak_decel_altitude',
        front: 'Altitude of peak deceleration in a ballistic entry.',
        back: 'h* = H·ln(ρ₀H/(β|sin γ_E|)), reached where ρ = β|sin γ_E|/H. Unlike the peak magnitude, the altitude *does* depend on β — and not on entry velocity.',
        formula: true,
      },
      {
        id: 'c_ballistic_coefficient_tps',
        front: 'What does a low ballistic coefficient do to entry heating?',
        back: 'It decelerates the vehicle higher up in thinner air, which lowers the *peak heat rate* but stretches the deceleration out, often raising the integrated *heat load*. Peak rate sizes the TPS material; total load sizes its thickness and mass.',
      },
      {
        id: 'c_sutton_graves',
        front: 'Write the Sutton-Graves convective stagnation heating correlation.',
        back: 'q̇ = k√(ρ/R_n)·v³ with k ≈ 1.7415 × 10⁻⁴ in SI units. The cubic velocity dependence is why entry speed dominates the thermal problem, and why the nose radius R_n is made large.',
        formula: true,
      },
      {
        id: 'c_peak_heat_vs_peak_g',
        front: 'Does peak heating occur before or after peak deceleration?',
        back: 'Before — higher and faster. Heating scales as √ρ·v³ while deceleration scales as ρ·v², so the heating maximum sits at a lower density, meaning earlier in the entry.',
      },
      {
        id: 'c_entry_corridor',
        front: 'What bounds the entry corridor?',
        back: 'Undershoot (too steep): peak deceleration and peak heating exceed structural or crew limits. Overshoot (too shallow): insufficient deceleration, so the vehicle skips back out of the atmosphere. The corridor width is set by the available L/D.',
      },
      {
        id: 'c_bank_modulation',
        front: 'How does bank-angle modulation control a lifting entry?',
        back: 'The lift magnitude is fixed by the trim angle of attack, so the guidance rolls the vehicle to change the *vertical component* of lift, controlling the descent rate and downrange. Periodic bank reversals then null the accumulated crossrange.',
      },
      {
        id: 'c_apollo_guidance',
        front: 'What did Apollo entry guidance do?',
        back: 'It flew a reference drag-vs-velocity profile with analytic predictors, commanding bank angle to null the predicted range error, with a skip-out phase for lunar-return energies. Its descendants still fly on crew capsules today.',
      },
      {
        id: 'c_shuttle_guidance',
        front: 'What was distinctive about Shuttle entry guidance?',
        back: 'It tracked a drag acceleration profile scheduled against specific energy rather than against time, which made the guidance robust to atmospheric dispersion, with bank reversals triggered by a crossrange deadband.',
      },
      {
        id: 'c_falcon_phases',
        front: 'Name the phases of a Falcon 9 booster return and what each accomplishes.',
        back: 'Boostback (RTLS only) reverses the downrange velocity. Entry burn slows the stage before the dense atmosphere, cutting peak heating and dynamic pressure. Aerodynamic descent steers with grid fins. Landing burn is a single-engine hoverslam with throttling to null the residual error.',
      },
      {
        id: 'c_hoverslam',
        front: 'What is a hoverslam and why is it forced?',
        back: 'A single braking burn timed so that velocity and altitude reach zero together. It is forced because the minimum achievable thrust still exceeds the vehicle weight — the stage cannot hover, so there is exactly one correct ignition time and no opportunity to stop and reassess.',
      },
      {
        id: 'c_hoverslam_altitude',
        front: 'Ignition altitude for a 1-D constant-thrust landing burn.',
        back: 'h = v²/(2(a_T − g)), with a_T = T/m. Note it grows as the square of the velocity, so a small velocity error moves the ignition point a lot.',
        formula: true,
      },
      {
        id: 'c_radar_altimeter',
        front: 'What does a radar altimeter give you during terminal descent that GNSS does not?',
        back: 'Direct, precise range to the actual surface beneath you — the droneship deck or the terrain — with no dependence on a geoid or terrain model, no multipath-prone geometry, and no reliance on GNSS availability. GNSS gives ellipsoidal height with metre-level error, which is not good enough at touchdown.',
      },
      {
        id: 'c_trn',
        front: 'What is terrain relative navigation?',
        back: 'Matching onboard camera or lidar imagery against a stored map to fix position relative to the terrain, not to an inertial frame. It is what let Mars 2020 pick a safe spot inside a hazardous landing ellipse in real time.',
      },
      {
        id: 'c_mars_edl',
        front: 'Why is Mars EDL harder than Earth EDL?',
        back: 'The atmosphere is about 1% of Earth density — enough to demand a heat shield but not enough to slow a heavy lander to a safe speed. Parachutes must deploy supersonically (around Mach 1.7-2.1), there is not enough atmosphere for a subsonic chute-only landing, and the light-time delay makes the whole sequence necessarily autonomous.',
      },
      {
        id: 'c_rtls_vs_droneship',
        front: 'RTLS vs droneship recovery — what is the trade?',
        back: 'RTLS needs a boostback burn to reverse the downrange velocity, which costs significant propellant and therefore payload. A droneship sits downrange so no boostback is needed, buying performance at the price of ship operations, weather sensitivity and a moving landing target.',
      },
    ],
    quiz: [
      {
        id: 'q_peak_decel_independence',
        q: 'For an Allen-Eggers ballistic entry, which statement about peak deceleration is correct?',
        choices: [
          'The peak magnitude a_max = v_E²|sin γ_E|/(2eH) is independent of ballistic coefficient, while the altitude at which it occurs depends on β but not on entry velocity',
          'Both the magnitude and the altitude are independent of the ballistic coefficient',
          'The magnitude depends on β and the altitude does not',
          'Both depend strongly on β, which is why heavy capsules pull more g',
        ],
        answer: 0,
        explain:
          'Maximising ρv²/(2β) with v = v_E·exp(−Hρ/(2β|sin γ|)) gives ρ* = β|sin γ|/H, and substituting back cancels β entirely: a_max = v_E²|sin γ|/(2eH). So a heavy, streamlined body and a light, blunt one pull the same peak g on the same entry — but the heavy one pulls it far lower in the atmosphere, where the air is denser and the heating environment is different.',
        b: 1.3,
        bloom: 'analyze',
      },
      {
        id: 'q_low_beta',
        q: 'Why does a low ballistic coefficient decelerate higher in the atmosphere, and what is the TPS consequence?',
        choices: [
          'Low β means lots of drag area per unit mass, so the vehicle is slowed by thinner air higher up; peak heat *rate* falls, but the deceleration takes longer so integrated heat *load* can rise — rate sizes the material, load sizes the mass',
          'Low β means it penetrates deeper, so the heat rate is higher and the heat load lower',
          'Low β has no effect on the altitude of deceleration, only on the peak g',
          'Low β lowers both peak heat rate and total heat load, which is why all entry vehicles minimise β',
        ],
        answer: 0,
        explain:
          'β = m/(C_D A) is the resistance to deceleration. A low value — a blunt capsule — is stopped by very thin air, which is exactly why blunt bodies were chosen for crewed entry. Since q̇ ∝ √ρ·v³, decelerating in thin air keeps the peak rate down. The trade is exposure time: a long, gentle entry can accumulate more total energy into the TPS, which is why both numbers appear in a TPS requirement.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'q_suicide_burn',
        q: 'A booster landing engine cannot throttle below a thrust-to-weight of 1. What does that do to the guidance problem?',
        choices: [
          'Hovering is impossible, so there is exactly one ignition point that brings altitude and velocity to zero together — a single-shot problem with no hold option, demanding accurate navigation and enough throttle range to absorb the residual error',
          'Nothing: the guidance simply commands a constant descent rate all the way down',
          'It makes the problem easier, because constant thrust means an analytic solution',
          'It forces the vehicle to land on parachutes instead',
        ],
        answer: 0,
        explain:
          'With minimum T/W above 1 the vehicle accelerates upward the moment the engine lights, so it cannot stop and hold. The burn must start at precisely the right altitude — hence hoverslam or suicide burn. Igniting late means hitting the ground with residual velocity; igniting early means arriving at zero velocity above the pad and then climbing. The available throttle range is the only margin, which is why deep throttling capability is a landing requirement rather than a nicety.',
        b: 1.0,
        bloom: 'understand',
      },
      {
        id: 'q_radar_altimeter',
        q: 'What does a radar altimeter provide during terminal descent that GNSS cannot?',
        choices: [
          'Direct precise range to the actual surface below — a ship deck or terrain — independent of geoid and terrain models and of GNSS availability, at the centimetre-to-decimetre accuracy touchdown requires',
          'Absolute position in an Earth-fixed frame, which GNSS does not provide',
          'Velocity relative to the atmosphere, which GNSS cannot measure',
          'Attitude information, which GNSS receivers do not supply',
        ],
        answer: 0,
        explain:
          'GNSS gives you height above a mathematical ellipsoid, with metre-level error and degraded geometry near the ground. What the landing needs is height above the thing you are about to touch, which may be a droneship deck that is itself moving in the swell. A radar altimeter (or landing lidar) measures exactly that. GNSS gives absolute position well and says nothing about attitude from a single antenna.',
        b: 0.8,
        bloom: 'understand',
      },
    ],
    tags: ['edl', 'guidance', 'falcon', 'spacex-core', 'interview'],
    importance: 1.35,
  },
]
