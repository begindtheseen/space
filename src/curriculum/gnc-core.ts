/* ============================================================================
   ORBIT — GNC core curriculum, Tiers 3–7
   ----------------------------------------------------------------------------
   Tier 3  Control theory            (m25–m32)
   Tier 4  Estimation & navigation   (m33–m39)
   Tier 5  Guidance                  (m40–m43)
   Tier 6  Flight software, sim, V&V (m44–m47)
   Tier 7  Integration & career      (m48–m49)

   Tiers 0–2 (math, dynamics, astrodynamics) live in the sibling file; this
   module list references them by id only.
   ========================================================================== */

import type { Module } from './types'

export const GNC_CORE: Module[] = [
  /* ══════════════════════════════════════════════════════════════════════════
     TIER 3 — CONTROL THEORY
     ══════════════════════════════════════════════════════════════════════════ */

  {
    id: 't3_m25_signals_systems',
    track: 'gnc',
    tier: 3,
    title: 'Signals, Systems & Transfer Functions',
    summary:
      'Turn a linear differential-equation model into a transfer function and read its behaviour straight off the pole-zero map. By the end you can sketch a Bode plot by hand, predict overshoot and settling time from zeta and omega-n, and reduce any block diagram to one ratio of polynomials.',
    prereqs: ['t0_m08_odes'],
    hours: 45,
    topics: [
      'LTI systems: linearity, time invariance, and why they buy you superposition',
      'Impulse response, step response, and convolution',
      'The Laplace transform and the transfer function',
      'Poles, zeros, and DC gain',
      'First- and second-order response: rise time, peak time, overshoot and settling time as functions of zeta and omega-n',
      'Dominant poles and model order reduction by inspection',
      'Added zeros, non-minimum-phase zeros, and right-half-plane zeros',
      'Time delay and the Pade approximation',
      'Frequency response: magnitude and phase; Bode plot construction by hand',
      'Block diagram algebra, reduction, and the Mason gain formula',
      'Open-loop vs closed-loop transfer functions',
      'Sensitivity S and complementary sensitivity T, and the identity S + T = 1',
    ],
    objectives: [
      'Sketch a Bode plot by hand from a transfer function and confirm it numerically',
      'Predict the time-domain step response from pole and zero locations alone',
      'Reduce an arbitrary block diagram to a single closed-loop transfer function',
      'Explain what a right-half-plane zero costs you in achievable bandwidth',
    ],
    resources: [
      {
        title: 'MIT OCW 16.06 — Principles of Automatic Control (Fall 2012)',
        kind: 'course',
        free: true,
        note: 'Feedback control design applied directly to air and spacecraft systems.',
      },
      {
        title: 'Control System Lectures (YouTube)',
        author: 'Brian Douglas',
        kind: 'video',
        free: true,
        note: 'The best intuition-building series anywhere: Routh-Hurwitz, root locus, Bode, lead-lag, PID, discrete control.',
      },
      {
        title: 'Feedback Systems: An Introduction for Scientists and Engineers',
        author: 'Astrom & Murray',
        kind: 'book',
        url: 'https://www.cds.caltech.edu/~murray/books/AM08/',
        free: true,
        note: 'Free PDF from the authors; also mirrored at fbswiki.org.',
      },
      {
        title: 'Feedback Control of Dynamic Systems',
        author: 'Franklin, Powell & Emami-Naeini',
        kind: 'book',
        free: false,
      },
      { title: 'Modern Control Engineering', author: 'Ogata', kind: 'book', free: false },
    ],
    exercises: [
      {
        id: 'ex_m25_bode',
        title: 'Bode by hand, then by machine',
        kind: 'code',
        lang: 'python',
        hours: 5,
        prompt: `Sketch the Bode magnitude and phase of these six plants **on paper first** — corner frequencies, asymptote slopes, phase at each decade:

1. 10/(s+1)
2. 100/(s(s+10))
3. (s+1)/(s+10)
4. (1-s)/(1+s)   (all-pass, non-minimum phase)
5. 25/(s^2 + 2s + 25)
6. 4/(s^2 + 0.4s + 4)   (lightly damped)

Then implement **bode(num, den, w)** below by evaluating the transfer function at s = jw directly, and overlay your sketch against it. Write one sentence per plant explaining where your hand sketch was wrong and why.

Success: your implementation matches scipy.signal.bode to 1e-6, and you can state the gain crossover frequency of plant 2 without running code.`,
        starter: `import numpy as np


def bode(num, den, w):
    """Frequency response of G(s) = num(s) / den(s).

    num, den : polynomial coefficients, highest power first (numpy.polyval order)
    w        : array of frequencies in rad/s

    Returns (mag_db, phase_deg) as numpy arrays.
    """
    # TODO: evaluate at s = 1j*w, then convert to dB and degrees.
    raise NotImplementedError


def gain_crossover(num, den, w):
    """Lowest frequency in w where |G(jw)| crosses 1 (0 dB). Interpolate."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'magnitude and phase of 100/(s(s+10))',
            assert: `import numpy as np
w = np.array([0.1, 1.0, 7.861, 10.0, 100.0])
mag, ph = bode([100.0], [1.0, 10.0, 0.0], w)
s = 1j * w
g = 100.0 / (s * (s + 10.0))
assert np.allclose(mag, 20 * np.log10(np.abs(g)), atol=1e-6), "magnitude is wrong"
assert np.allclose(ph, np.degrees(np.angle(g)), atol=1e-6), "phase is wrong"`,
          },
          {
            name: 'gain crossover of 100/(s(s+10)) is 7.86 rad/s',
            assert: `import numpy as np
w = np.logspace(-2, 2, 4001)
wc = gain_crossover([100.0], [1.0, 10.0, 0.0], w)
assert abs(wc - 7.8615) < 0.05, "expected gain crossover near 7.86 rad/s, got %r" % (wc,)`,
          },
          {
            name: 'all-pass (1-s)/(1+s) has unit magnitude everywhere',
            assert: `import numpy as np
w = np.logspace(-2, 2, 200)
mag, ph = bode([-1.0, 1.0], [1.0, 1.0], w)
assert np.max(np.abs(mag)) < 1e-9, "an all-pass must be 0 dB at every frequency"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m25_second_order',
        title: 'Map zeta and omega-n onto measured step response',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: `Implement the closed-form second-order metrics, then **measure** the same quantities from a numerically integrated step response on a grid of zeta in [0.1, 0.9] and omega-n in [1, 20] rad/s.

Report, as a table, the percentage error between formula and measurement. Explain the two places the formulas break down (hint: the 2% settling time approximation, and zeta near 1).

Success: formula and measurement agree within 5% over the grid interior, and you can say from memory what zeta = 0.707 gives you.`,
        starter: `import numpy as np


def overshoot(zeta):
    """Fractional peak overshoot of a standard second-order step response."""
    raise NotImplementedError


def peak_time(zeta, wn):
    """Time of first peak, seconds."""
    raise NotImplementedError


def settling_time_2pct(zeta, wn):
    """Standard 2% settling-time approximation, seconds."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'overshoot at zeta = 0.5 is 16.3%',
            assert: `assert abs(overshoot(0.5) - 0.16303) < 1e-4, "Mp = exp(-pi*z/sqrt(1-z**2))"`,
          },
          {
            name: 'zeta = 0.707 gives about 4.3% overshoot',
            assert: `assert abs(overshoot(0.7071) - 0.0432) < 2e-3, "the classic 'flat' damping value"`,
          },
          {
            name: 'peak and settling time for zeta=0.5, wn=10',
            assert: `assert abs(peak_time(0.5, 10.0) - 0.36276) < 1e-4, "tp = pi/(wn*sqrt(1-z**2))"
assert abs(settling_time_2pct(0.5, 10.0) - 0.8) < 1e-6, "ts ~ 4/(z*wn)"`,
          },
        ],
      },
      {
        id: 'ex_m25_block_algebra',
        title: 'Reduce a two-loop block diagram three ways',
        kind: 'derivation',
        hours: 3,
        prompt: `Take a cascaded plant G1 G2 with an inner rate loop closed by H1 around G2 and an outer position loop closed by unity feedback around the whole thing.

1. Reduce it by successive block-diagram algebra.
2. Reduce it again with the Mason gain formula, identifying every forward path and every loop.
3. Write S and T for the outer loop and verify **S + T = 1** symbolically.

Success: all three give the same expression, and you can state in one sentence why S + T = 1 is a structural identity rather than a design outcome.`,
      },
    ],
    quiz: [
      {
        id: 'q_m25_rhp_zero',
        q: 'A plant has a zero at s = +2. What does that do to the step response, and what limit does it place on the closed-loop design?',
        choices: [
          'It adds overshoot only; bandwidth is unaffected',
          'It causes an initial undershoot (the response goes the wrong way first) and practically limits achievable closed-loop bandwidth to a fraction of the zero location, roughly wc < z/2',
          'It makes the system unstable in open loop and must be cancelled by a pole at +2',
          'It adds pure phase lead, which improves stability margins',
        ],
        answer: 1,
        explain:
          'A right-half-plane zero contributes phase lag while adding magnitude slope, so it behaves like a delay: you cannot invert it and you cannot cancel it (cancelling puts an unstable pole in the controller). In the time domain it produces initial undershoot. Pushing crossover above the zero forces the sensitivity function into a waterbed violation, so practical designs keep gain crossover well below the zero, commonly around half of it. This is a fundamental limitation, not a tuning problem.',
        b: 0.8,
        bloom: 'analyze',
      },
      {
        id: 'q_m25_crossover',
        q: 'For G(s) = 100 / (s(s+10)), what is the gain crossover frequency and the resulting phase margin?',
        choices: [
          'wc = 10 rad/s, PM = 45 degrees',
          'wc = 7.9 rad/s, PM = 52 degrees',
          'wc = 100 rad/s, PM = 0 degrees',
          'wc = 3.2 rad/s, PM = 72 degrees',
        ],
        answer: 1,
        explain:
          'Set |G| = 100/(w*sqrt(w^2+100)) = 1, so w^2(w^2+100) = 10^4, giving w^2 = 61.8 and wc = 7.86 rad/s. Phase there is -90 - atan(7.86/10) = -128.2 degrees, so PM = 180 - 128.2 = 51.8 degrees. Being able to do this arithmetic on a whiteboard is a standard screening question.',
        b: 0.6,
        bloom: 'apply',
      },
      {
        id: 'q_m25_s_plus_t',
        q: 'Why does S + T = 1 constrain what any feedback design can achieve?',
        choices: [
          'It does not constrain anything; it is a normalisation convention',
          'Because S is the transfer from disturbance and reference error and T is the transfer from sensor noise, you cannot make both small at the same frequency — good disturbance rejection at a frequency forces full noise transmission there',
          'It forces the closed-loop DC gain to be exactly one',
          'It guarantees the closed loop is stable whenever the open loop is stable',
        ],
        answer: 1,
        explain:
          'S = 1/(1+L) and T = L/(1+L), so their sum is identically 1 at every frequency, for every plant and every controller. Since S governs disturbance and reference tracking error and T governs noise transmission and robustness to multiplicative uncertainty, small S means T is near 1 and vice versa. Loop shaping is therefore the art of choosing where in frequency to be good at each, not of being good at both.',
        b: 0.7,
        bloom: 'understand',
      },
      {
        id: 'q_m25_delay_phase',
        q: 'A pure time delay of T seconds appears in a loop. What does it do to the Bode plot?',
        choices: [
          'Reduces magnitude by 20 dB/decade, leaves phase alone',
          'Leaves magnitude unchanged and subtracts phase linearly with frequency, phi = -wT radians',
          'Adds a pole at s = 1/T',
          'Adds 90 degrees of phase lag at every frequency',
        ],
        answer: 1,
        explain:
          'exp(-sT) has magnitude 1 for all s = jw and phase -wT. The magnitude plot is untouched; the phase falls without bound. This is why delay is so corrosive: it eats phase margin fastest exactly where your crossover is, and no amount of gain reduction fixes the phase — only lowering crossover does.',
        b: 0.1,
        bloom: 'recall',
      },
      {
        id: 'q_m25_dominant',
        q: 'A system has poles at -1 +/- 2j and at -40. What does the step response look like?',
        choices: [
          'Dominated by the fast pole at -40; a near-first-order response with 25 ms time constant',
          'Dominated by the complex pair; roughly second order with about 20% overshoot and a 4 s settling time, with a small fast transient from the -40 pole',
          'Unstable, because there are three poles',
          'A pure exponential with no oscillation',
        ],
        answer: 1,
        explain:
          'The complex pair has zeta = 1/sqrt(5) = 0.447 and omega-n = sqrt(5) = 2.24 rad/s, giving about 20.5% overshoot and ts = 4/(zeta*wn) = 4 s. The real pole is 40 times further left, so its mode decays in 25 ms and contributes almost nothing after the first few samples. A pole more than about five times further left than the dominant pair can normally be neglected for design, though not for margin analysis.',
        b: 0.5,
        bloom: 'analyze',
      },
    ],
    cards: [
      {
        id: 'c_m25_tf',
        front: 'Definition of a transfer function',
        back: 'G(s) = Y(s)/U(s), the Laplace transform of the output over the input **with all initial conditions zero**. It exists only for LTI systems.',
        formula: true,
      },
      {
        id: 'c_m25_dcgain',
        front: 'DC gain of G(s)',
        back: 'G(0). It is the steady-state output for a unit step, provided the system is stable.',
        formula: true,
      },
      {
        id: 'c_m25_2nd_order',
        front: 'Standard second-order form',
        back: 'G(s) = wn^2 / (s^2 + 2*zeta*wn*s + wn^2). Poles at s = -zeta*wn +/- j*wn*sqrt(1-zeta^2).',
        formula: true,
      },
      {
        id: 'c_m25_overshoot',
        front: 'Peak overshoot of a second-order step response',
        back: 'Mp = exp(-pi*zeta / sqrt(1 - zeta^2)). Depends on zeta ONLY, never on wn. zeta = 0.5 -> 16.3%; zeta = 0.707 -> 4.3%.',
        formula: true,
      },
      {
        id: 'c_m25_settling',
        front: '2% settling time of a second-order system',
        back: 'ts ~ 4 / (zeta * wn) — four time constants of the envelope. The 5% rule of thumb is 3/(zeta*wn).',
        formula: true,
      },
      {
        id: 'c_m25_peaktime',
        front: 'Peak time and damped natural frequency',
        back: 'wd = wn*sqrt(1 - zeta^2) and tp = pi/wd. The oscillation you see is at wd, not wn.',
        formula: true,
      },
      {
        id: 'c_m25_bandwidth',
        front: 'Rise-time / bandwidth rule of thumb',
        back: 'tr * wbw ~ 1.8 for a well-damped second-order loop. Doubling the required rise time halves the bandwidth you must buy.',
        formula: true,
      },
      {
        id: 'c_m25_bode_slopes',
        front: 'Bode asymptote bookkeeping',
        back: 'Each real pole: -20 dB/decade and -90 deg of phase (spread over a decade either side of the corner). Each real zero: +20 dB/decade and +90 deg. A complex pair counts double.',
      },
      {
        id: 'c_m25_rhp_zero',
        front: 'Signature of a right-half-plane zero',
        back: 'Initial **undershoot** in the step response, and phase lag rather than the phase lead a left-half-plane zero gives. It hard-limits achievable bandwidth (rule of thumb wc < z/2) and cannot be cancelled.',
      },
      {
        id: 'c_m25_delay',
        front: 'Phase lag from a pure time delay',
        back: 'phi(w) = -w*T radians = -57.3*w*T degrees. Magnitude is unchanged. At 5 rad/s a 50 ms delay costs 14.3 degrees.',
        formula: true,
      },
      {
        id: 'c_m25_pade',
        front: 'First-order Pade approximation of a delay',
        back: 'exp(-sT) ~ (1 - sT/2) / (1 + sT/2). It reproduces the phase lag with a right-half-plane zero — which is exactly the right intuition about delay.',
        formula: true,
      },
      {
        id: 'c_m25_sensitivity',
        front: 'Sensitivity and complementary sensitivity',
        back: 'S = 1/(1 + L), T = L/(1 + L), where L is the loop transfer function. S maps disturbance and reference to error; T maps sensor noise to output.',
        formula: true,
      },
      {
        id: 'c_m25_s_plus_t',
        front: 'The identity every control engineer must have instantly',
        back: 'S + T = 1 at every frequency, always. You choose WHERE each is small; you never make both small at the same frequency.',
        formula: true,
      },
      {
        id: 'c_m25_dominant_pole',
        front: 'When can you ignore a pole?',
        back: 'When its real part is roughly 5x further left than the dominant pair, and it is not near a zero. Safe for time-domain design intuition; never safe when computing stability margins.',
      },
    ],
  },

  {
    id: 't3_m26_classical_control',
    track: 'gnc',
    tier: 3,
    title: 'Classical Feedback Control Design',
    summary:
      'Design PID and lead-lag compensators that actually meet overshoot, settling and margin specifications, and read gain, phase, delay and modulus margins straight off a Bode or Nyquist plot. You will also build the cascaded rate-inside-attitude architecture every launch vehicle flies, and notch a structural mode without giving away the phase you need.',
    prereqs: ['t3_m25_signals_systems'],
    hours: 65,
    topics: [
      'Feedback fundamentals: disturbance rejection, noise attenuation, insensitivity to plant variation',
      'PID control: the physical meaning of each term, ideal vs practical form, derivative filtering',
      'Integrator windup, anti-windup schemes, bumpless transfer, setpoint weighting',
      'PID tuning: Ziegler-Nichols, loop shaping, pole placement',
      'Root locus construction rules and root-locus design',
      'The Nyquist plot and the Nyquist stability criterion',
      'Gain margin, phase margin, delay margin, and the modulus (vector) margin',
      'Why margins can lie: MIMO coupling, nonlinearity, simultaneous perturbations',
      'Lead, lag and lead-lag compensators',
      'Notch filters for structural bending modes; gain stabilization vs phase stabilization',
      'The Bode gain-phase relationship, the Bode sensitivity integral, and the waterbed effect',
      'Cascade architecture: a fast rate loop inside a slower attitude loop',
      'Feedforward and 2-DOF control; gain scheduling across flight regimes',
    ],
    objectives: [
      'Design a PID or lead-lag controller that meets overshoot, settling time and margin specifications simultaneously',
      'Read gain margin, phase margin and delay margin off a Bode plot and off a Nyquist plot',
      'Design a notch filter for a bending mode and quantify the phase penalty it costs at crossover',
      'Build a cascaded rate/attitude loop and justify the bandwidth separation',
      'Implement anti-windup and demonstrate the difference under actuator saturation',
    ],
    resources: [
      { title: 'MIT OCW 16.06 — Principles of Automatic Control', kind: 'course', free: true },
      {
        title: 'Bode, Root Locus, Nyquist, PID and Lead-Lag playlists',
        author: 'Brian Douglas',
        kind: 'video',
        free: true,
      },
      {
        title: 'MATLAB Tech Talks — Control Systems in Practice',
        author: 'Brian Douglas (MathWorks)',
        kind: 'video',
        free: true,
        note: 'Gain and phase margin in practice, PID, gain scheduling. Short and unusually honest about what margins do not tell you.',
      },
      {
        title: 'Feedback Systems, Ch. 10-12',
        author: 'Astrom & Murray',
        kind: 'book',
        url: 'https://www.cds.caltech.edu/~murray/books/AM08/',
        free: true,
      },
      {
        title: 'PID Controllers: Theory, Design, and Tuning',
        author: 'Astrom & Hagglund',
        kind: 'book',
        free: false,
        note: 'The definitive treatment of windup, filtering and practical PID structure.',
      },
      { title: 'Modern Control Engineering, Ch. 6-7', author: 'Ogata', kind: 'book', free: false },
      {
        title: 'Feedback Control of Dynamic Systems, Ch. 5-6',
        author: 'Franklin & Powell',
        kind: 'book',
        free: false,
      },
    ],
    exercises: [
      {
        id: 'ex_m26_pid_margins',
        title: 'PID for an attitude rate loop to a margin spec',
        kind: 'code',
        lang: 'python',
        hours: 8,
        prompt: `Plant: a rigid body rate channel with actuator lag, G(s) = 1 / (J*s) * 1/(tau*s + 1) with J = 1200 kg*m^2 and tau = 0.02 s.

Design a PID (with a filtered derivative, N between 10 and 20) that achieves **at least 60 degrees of phase margin and 6 dB of gain margin**, with a rate-loop bandwidth of at least 8 rad/s.

Implement **margins(num, den)** returning gain margin in dB, phase margin in degrees, and delay margin in seconds. Then report your final gains and the three margins. Plot Bode and Nyquist and mark the margins on both.

Success: the automated margin check passes, and you can explain which gain you would back off first if the plant inertia turned out 30% higher.`,
        starter: `import numpy as np


def margins(num, den, w=None):
    """Classical stability margins of the OPEN-LOOP transfer function L(s).

    Returns dict with keys: gm_db, pm_deg, wgc (gain crossover, rad/s),
    wpc (phase crossover, rad/s), dm_s (delay margin in seconds).
    Use gm_db = inf and wpc = nan when the phase never reaches -180 deg.
    """
    raise NotImplementedError


def pid_loop(kp, ki, kd, N, J=1200.0, tau=0.02):
    """Return (num, den) of L(s) = C(s)*G(s) for the filtered-derivative PID

        C(s) = kp + ki/s + kd*N*s/(s + N)
        G(s) = 1 / (J*s*(tau*s + 1))
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'margins of the textbook loop 100/(s(s+10))',
            assert: `import numpy as np
m = margins([100.0], [1.0, 10.0, 0.0])
assert abs(m["wgc"] - 7.8615) < 0.05, "gain crossover should be 7.86 rad/s"
assert abs(m["pm_deg"] - 51.83) < 0.5, "phase margin should be about 51.8 deg"
assert not np.isfinite(m["gm_db"]), "this loop never reaches -180 deg, so GM is infinite"`,
          },
          {
            name: 'delay margin is phase margin over gain crossover',
            assert: `import numpy as np
m = margins([100.0], [1.0, 10.0, 0.0])
assert abs(m["dm_s"] - np.radians(m["pm_deg"]) / m["wgc"]) < 1e-9, "DM = PM(rad)/wgc"`,
          },
          {
            name: 'your PID meets the spec',
            assert: `import numpy as np
num, den = pid_loop(KP, KI, KD, N)
m = margins(num, den)
assert m["pm_deg"] >= 60.0, "phase margin %.1f deg is below spec" % m["pm_deg"]
assert m["gm_db"] >= 6.0, "gain margin %.1f dB is below spec" % m["gm_db"]
assert m["wgc"] >= 8.0, "bandwidth too low: wgc = %.2f rad/s" % m["wgc"]`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m26_antiwindup',
        title: 'Windup, and the two-line fix',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: `Simulate your PID rate loop with the actuator saturated at +/- 0.15 rad of gimbal deflection, and command a step large enough to saturate for about a second.

1. Run with a naive integrator. Record the overshoot and the time the actuator stays pinned.
2. Add **back-calculation anti-windup**: feed (u_sat - u) back into the integrator through a gain 1/Tt with Tt ~ sqrt(Ti*Td).
3. Add **conditional integration** (stop integrating while saturated) as an alternative.

Report overshoot and settling time for all three. Success: anti-windup cuts overshoot by more than half and you can explain in one sentence what the integrator state physically represents while saturated.`,
        starter: `import numpy as np


def simulate(kp, ki, kd, u_lim=0.15, dt=0.002, T=6.0, mode="naive"):
    """Closed-loop step response of the saturated rate loop.

    mode is one of "naive", "backcalc", "conditional".
    Returns (t, y, u_commanded, u_applied).
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'anti-windup beats the naive integrator',
            assert: `import numpy as np
t, y_n, _, _ = simulate(KP, KI, KD, mode="naive")
t, y_b, _, _ = simulate(KP, KI, KD, mode="backcalc")
os_n = y_n.max() / y_n[-1] - 1.0
os_b = y_b.max() / y_b[-1] - 1.0
assert os_b < 0.5 * os_n, "back-calculation should at least halve the overshoot (naive %.2f, aw %.2f)" % (os_n, os_b)`,
          },
          {
            name: 'the applied command never exceeds the limit',
            assert: `import numpy as np
t, y, uc, ua = simulate(KP, KI, KD, mode="backcalc")
assert np.max(np.abs(ua)) <= 0.15 + 1e-12, "saturation was not enforced"`,
          },
        ],
      },
      {
        id: 'ex_m26_bending_mode',
        title: 'Gain-stabilize a bending mode, then phase-stabilize it',
        kind: 'analysis',
        hours: 7,
        prompt: `Add a lightly damped flexible mode to your rate plant: a second-order pair at 18 rad/s with damping 0.005, with the sensor mounted so the modal residue is **positive** (in-phase). Then repeat with negative residue.

1. Show the loop goes unstable with your original PID.
2. **Gain-stabilize**: design a notch (or low-pass) so the loop gain is below -6 dB across the mode with uncertainty of +/-15% in modal frequency. Record how much phase the notch costs at your 8 rad/s crossover.
3. **Phase-stabilize**: instead, arrange the phase at the mode so the Nyquist encirclement count is unchanged, and note how much modal-frequency uncertainty that tolerates.

Deliver a short memo comparing the two, and state the condition under which phase stabilization is the only option (hint: think about what happens when the mode is BELOW crossover).`,
      },
    ],
    quiz: [
      {
        id: 'q_m26_margins',
        q: 'Which system is most fragile despite excellent classical margins?',
        choices: [
          'A loop with 12 dB gain margin and 65 degrees phase margin whose Nyquist plot passes within 0.15 of the -1 point',
          'A loop with 6 dB gain margin and 45 degrees phase margin whose Nyquist plot stays 0.6 away from -1',
          'A loop with infinite gain margin',
          'A loop with 30 degrees phase margin and 3 dB gain margin',
        ],
        answer: 0,
        explain:
          'Gain margin and phase margin each probe the Nyquist plot along one axis only — pure gain change, or pure phase change. A plot can dodge both tests and still skim the -1 point diagonally. The modulus (vector) margin, the minimum distance from the Nyquist curve to -1, equals 1/||S||inf and catches exactly this case. A distance of 0.15 means a sensitivity peak of 6.7, which is a loop that will misbehave on any simultaneous gain-and-phase perturbation. Modern practice uses disk margins for this reason.',
        b: 1.2,
        bloom: 'analyze',
      },
      {
        id: 'q_m26_dfilter',
        q: 'Why is the derivative term in a practical PID always filtered?',
        choices: [
          'To make the controller causal and to stop it amplifying sensor noise without bound — a pure s has infinite high-frequency gain',
          'To reduce the steady-state error',
          'Because integer arithmetic cannot represent a derivative',
          'To increase the phase margin at low frequency',
        ],
        answer: 0,
        explain:
          'A pure derivative kd*s is improper — its gain rises 20 dB/decade forever, so measurement noise and unmodelled high-frequency dynamics get amplified straight into the actuator. The standard fix is kd*N*s/(s+N) with N around 10-20, which is a derivative up to the corner and a constant above it. The price is a little phase lead lost near crossover, which is why N is chosen as a trade rather than made large.',
        b: 0.3,
        bloom: 'understand',
      },
      {
        id: 'q_m26_delay',
        q: 'Your loop crosses over at 5 rad/s with 50 degrees of phase margin. A 50 ms sensor transport delay is discovered. What happens?',
        choices: [
          'Nothing; delay does not affect stability',
          'You lose 14.3 degrees of phase, leaving about 36 degrees of margin — still stable but degraded; the delay margin was 175 ms',
          'The loop goes unstable immediately',
          'You lose 50 degrees of phase and the loop is marginally stable',
        ],
        answer: 1,
        explain:
          'Phase lost is w*T = 5 * 0.05 = 0.25 rad = 14.3 degrees. Remaining phase margin is 50 - 14.3 = 35.7 degrees, which is low but stable. The delay margin before the discovery was PM in radians divided by gain crossover, 0.873/5 = 175 ms, so a 50 ms delay consumes 29% of the available budget. Delay margin is the single most useful number when arguing about scheduling jitter and sensor latency with the flight software team.',
        b: 0.9,
        bloom: 'apply',
      },
      {
        id: 'q_m26_gain_stab',
        q: 'When would you gain-stabilize a bending mode rather than phase-stabilize it?',
        choices: [
          'Always — phase stabilization is never used in flight',
          'When the mode is well above control bandwidth and its frequency is uncertain, so you can simply attenuate it below 0 dB and stop caring about its phase',
          'When the mode is below crossover',
          'When the mode is very lightly damped, because notches only work on heavily damped modes',
        ],
        answer: 1,
        explain:
          'Gain stabilization means pushing loop gain below unity across the mode so its phase is irrelevant — robust to frequency uncertainty, which matters because modal frequencies shift with propellant load. It requires the mode to be above crossover, and it costs phase at crossover from the notch or roll-off. Phase stabilization keeps the gain up but arranges phase so the Nyquist encirclement count is unchanged; it is the only option when the mode is at or below crossover, and it demands a much better model because a modal frequency shift flips the sign of what you relied on.',
        b: 1.4,
        bloom: 'analyze',
      },
      {
        id: 'q_m26_cascade',
        q: 'In a cascaded rate-inside-attitude architecture, roughly what bandwidth separation do you design for and why?',
        choices: [
          'They should be equal so the loops respond together',
          'The inner rate loop is typically 3-10x faster than the outer attitude loop, so the outer loop sees the inner loop as a near-unity gain and can be designed against a simple integrator',
          'The outer loop should be 10x faster than the inner loop',
          'Separation is irrelevant provided both loops are individually stable',
        ],
        answer: 1,
        explain:
          'With the inner loop several times faster, its closed-loop transfer is close to 1 across the outer loop bandwidth, so the attitude designer sees the kinematic integrator from rate to angle and almost nothing else. Too little separation and the two designs interact, producing margins that neither loop analysis predicts. Too much and you are paying for actuator bandwidth and noise amplification you do not need. The inner loop also rejects torque disturbances before they ever become attitude error, which is the real reason for the architecture.',
        b: 0.8,
        bloom: 'understand',
      },
      {
        id: 'q_m26_waterbed',
        q: 'What does the Bode sensitivity integral say about a stable, strictly proper loop with relative degree 2 or more?',
        choices: [
          'The integral of ln|S| over all frequencies is zero, so any sensitivity reduction at one frequency must be paid for by amplification at another',
          'Sensitivity can be made arbitrarily small at every frequency with enough gain',
          'The integral of |S| equals the number of unstable poles',
          'Sensitivity is bounded by the gain margin',
        ],
        answer: 0,
        explain:
          'For a stable open loop with at least two more poles than zeros, the integral of ln|S(jw)| dw from 0 to infinity is exactly zero. Push |S| below 1 in your control band and a region of |S| > 1 must appear elsewhere — the waterbed effect. Unstable open-loop poles make it worse: the integral becomes pi times the sum of the unstable pole real parts, so an unstable vehicle is guaranteed a larger sensitivity peak somewhere. This is the single most important structural limitation in loop shaping.',
        b: 1.5,
        bloom: 'analyze',
      },
    ],
    cards: [
      {
        id: 'c_m26_gm',
        front: 'Gain margin — precise definition',
        back: 'The factor by which loop gain can increase before instability, measured **at the phase crossover frequency** where arg L = -180 deg. GM = 1/|L(j*wpc)|, usually quoted in dB. Aerospace loops target >= 6 dB.',
        formula: true,
      },
      {
        id: 'c_m26_pm',
        front: 'Phase margin — precise definition',
        back: 'Additional phase lag tolerable before instability, measured **at the gain crossover frequency** where |L| = 1. PM = 180 deg + arg L(j*wgc). Aerospace loops target >= 30-45 deg, often 60.',
        formula: true,
      },
      {
        id: 'c_m26_dm',
        front: 'Delay margin',
        back: 'DM = PM (in radians) / wgc (in rad/s), in seconds. The pure transport delay that would eat all remaining phase margin. This is the number you quote to the flight software team.',
        formula: true,
      },
      {
        id: 'c_m26_modulus',
        front: 'Modulus (vector) margin',
        back: 'The minimum distance from the Nyquist curve of L to the -1 point. It equals 1 / ||S||inf. A value >= 0.5 (peak sensitivity <= 2) is a common requirement — and it catches the fragile loops that GM and PM both miss.',
        formula: true,
      },
      {
        id: 'c_m26_nyquist',
        front: 'Nyquist stability criterion',
        back: 'Z = N + P: closed-loop unstable poles Z equal clockwise encirclements N of -1 by L(jw) plus open-loop unstable poles P. Stability requires Z = 0, so an open-loop-unstable plant REQUIRES counter-clockwise encirclements.',
        formula: true,
      },
      {
        id: 'c_m26_pid',
        front: 'What each PID term physically does',
        back: 'P: stiffness, responds to present error. I: removes steady-state error to constant disturbances, adds a pole at the origin and 90 deg of lag. D: damping, predicts error, adds phase lead but amplifies noise.',
      },
      {
        id: 'c_m26_practical_pid',
        front: 'Practical (filtered-derivative) PID',
        back: 'C(s) = kp + ki/s + kd*N*s/(s + N), with N ~ 10-20. The filter makes the controller proper and bounds high-frequency gain at kp + kd*N.',
        formula: true,
      },
      {
        id: 'c_m26_windup',
        front: 'Integrator windup',
        back: 'While the actuator is saturated the loop is open, but the integrator keeps accumulating error. The state must then be unwound before the actuator comes off the stop, producing large overshoot and long settling.',
      },
      {
        id: 'c_m26_antiwindup',
        front: 'Back-calculation anti-windup',
        back: 'Feed (u_sat - u_cmd) back into the integrator input through gain 1/Tt, with Tt ~ sqrt(Ti*Td). The integrator then tracks the achievable command instead of the impossible one.',
        formula: true,
      },
      {
        id: 'c_m26_zn',
        front: 'Ziegler-Nichols ultimate-gain tuning',
        back: 'Raise kp until sustained oscillation at gain Ku and period Tu. Classic PID: kp = 0.6*Ku, Ti = 0.5*Tu, Td = 0.125*Tu. Aggressive (roughly quarter-decay) and rarely flown as-is, but a useful starting point.',
        formula: true,
      },
      {
        id: 'c_m26_notch',
        front: 'Notch filter for a structural mode',
        back: 'N(s) = (s^2 + 2*zn*wm*s + wm^2) / (s^2 + 2*zd*wm*s + wm^2) with zn << zd. Depth is set by zn/zd. It always costs phase below and above wm, which is why a notch near crossover is expensive.',
        formula: true,
      },
      {
        id: 'c_m26_gain_vs_phase',
        front: 'Gain stabilization vs phase stabilization',
        back: 'Gain-stabilize: attenuate the mode below 0 dB so its phase does not matter — robust to modal frequency uncertainty, requires the mode above crossover. Phase-stabilize: keep the gain, arrange the phase so Nyquist encirclements are unchanged — the only option below crossover, but demands an accurate model.',
      },
      {
        id: 'c_m26_bode_integral',
        front: 'Bode sensitivity integral (the waterbed)',
        back: 'For a stable loop with relative degree >= 2, integral of ln|S(jw)| dw = 0. With unstable open-loop poles p_i it becomes pi * sum(Re p_i). Sensitivity reduction is conserved, never created.',
        formula: true,
      },
      {
        id: 'c_m26_cascade',
        front: 'Cascade (inner-outer) loop rule of thumb',
        back: 'Inner rate loop 3-10x the bandwidth of the outer attitude loop. The outer loop then sees the inner loop as ~1 and only the kinematic integrator remains. The inner loop also kills torque disturbances before they become attitude error.',
      },
    ],
    tags: ['interview'],
    importance: 1.4,
  },

  {
    id: 't3_m27_digital_control',
    track: 'gnc',
    tier: 3,
    title: 'Digital & Sampled-Data Control',
    summary:
      'Take a continuous design into flight code without silently destroying it: pick a sample rate, discretize correctly, and account for the phase the zero-order hold and the computational delay steal from you. You will implement a fixed-step discrete controller in the form flight software actually runs.',
    prereqs: ['t3_m26_classical_control'],
    hours: 45,
    topics: [
      'Sampling and the Nyquist-Shannon theorem; aliasing and anti-alias filtering',
      'The zero-order hold and its half-sample phase penalty',
      'The z-transform and discrete transfer functions',
      'Mapping the s-plane to the z-plane; the unit circle as the stability boundary',
      'Discretization methods: forward and backward Euler, Tustin, Tustin with prewarping, ZOH equivalence, matched pole-zero',
      'Computational delay and where it shows up in the loop',
      'Choosing a sample rate: the 20-40x bandwidth rule of thumb and what drives the ends of that range',
      'Quantization, finite word length, and fixed-point implementation',
      'Discrete PID realization forms (direct, parallel, delta) and their numerical conditioning',
      'Biquad sections for discrete filters and notches',
      'Multi-rate systems, jitter, and their effect on stability',
    ],
    objectives: [
      'Discretize a continuous controller correctly and predict the phase lag the discretization adds',
      'Pick a sample rate from a bandwidth requirement and defend both bounds',
      'Implement a discrete controller as a fixed-step flight-code routine with no dynamic allocation',
      'Demonstrate aliasing and design the anti-alias filter that prevents it',
    ],
    resources: [
      {
        title: 'Digital Control of Dynamic Systems',
        author: 'Franklin, Powell & Workman',
        kind: 'book',
        free: false,
      },
      {
        title: 'Computer-Controlled Systems: Theory and Design',
        author: 'Astrom & Wittenmark',
        kind: 'book',
        free: false,
      },
      { title: 'Discrete control video series', author: 'Brian Douglas', kind: 'video', free: true },
      {
        title: 'MATLAB Tech Talk — Control Systems in Practice: Discretization',
        kind: 'video',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'ex_m27_discretize',
        title: 'Three discretizations, two sample rates, one margin table',
        kind: 'code',
        lang: 'python',
        hours: 6,
        prompt: `Take the PID you designed in the previous module and discretize it three ways — forward Euler, Tustin, and ZOH equivalence — at **50 Hz** and at **500 Hz**.

For each of the six combinations, compute the discrete closed-loop gain and phase margin (include the ZOH in the plant model, and add one sample of computational delay). Present a 6-row table.

Success: you can state which combination fails first and why, and you can predict the 50 Hz Tustin phase margin to within 5 degrees before running anything.`,
        starter: `import numpy as np


def tustin(num, den, dt, prewarp_w=None):
    """Bilinear transform of a continuous transfer function.

    Substitute s = (2/dt) * (z-1)/(z+1), or with prewarping
    s = (w0 / tan(w0*dt/2)) * (z-1)/(z+1).
    Returns (bz, az), discrete polynomial coefficients in descending z.
    """
    raise NotImplementedError


def zoh_phase_lag_deg(w, dt):
    """Phase contributed by a zero-order hold at frequency w (rad/s)."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'ZOH lag is half a sample',
            assert: `import numpy as np
# at 100 Hz and 5 Hz the ZOH costs about 9 degrees
lag = zoh_phase_lag_deg(2 * np.pi * 5.0, 0.01)
assert abs(abs(lag) - 9.0) < 0.3, "expected about -9 deg, got %r" % (lag,)
assert lag < 0, "a hold contributes phase LAG"`,
          },
          {
            name: 'Tustin preserves DC gain',
            assert: `import numpy as np
bz, az = tustin([2.0], [1.0, 3.0], 0.01)
dc_c = 2.0 / 3.0
dc_d = np.sum(bz) / np.sum(az)
assert abs(dc_c - dc_d) < 1e-9, "bilinear transform must preserve DC gain"`,
          },
          {
            name: 'Tustin maps the left half plane inside the unit circle',
            assert: `import numpy as np
bz, az = tustin([1.0], [1.0, 2.0, 5.0], 0.005)
poles = np.roots(az)
assert np.all(np.abs(poles) < 1.0), "a stable continuous system must map to a stable discrete one"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m27_aliasing',
        title: 'Alias a 60 Hz vibration into your control band',
        kind: 'code',
        lang: 'python',
        hours: 3,
        prompt: `Generate a signal containing a 2 Hz command and a 60 Hz structural vibration. Sample it at 100 Hz with no anti-alias filter.

1. Show that the 60 Hz content reappears at 40 Hz, then at what frequency after sampling at 50 Hz?
2. Design a 2nd-order anti-alias filter that puts the 60 Hz content 20 dB down before the sampler, and show what it costs in phase at 2 Hz.
3. Explain why an anti-alias filter must be **analog** and why you cannot fix this in software.

Success: the aliased tone is identified correctly at both rates and the filter meets the attenuation spec.`,
        starter: `"""Aliasing: what a 60 Hz structural mode does to a 100 Hz control loop."""

import math

F_COMMAND = 2.0       # Hz — the signal you actually want
F_VIBRATION = 60.0    # Hz — a structural mode you do not


def alias_frequency(f_signal: float, fs: float) -> float:
    """Where f_signal appears after sampling at fs, folded into [0, fs/2].

    TODO: take f_signal modulo fs, then fold anything above fs/2 back down.
    """
    raise NotImplementedError


def butterworth2(f_cutoff: float, f: float) -> float:
    """Magnitude |H(jw)| of a 2nd-order Butterworth low-pass.

    TODO: |H| = 1 / sqrt(1 + (f / f_cutoff)**4)
    """
    raise NotImplementedError


def phase_lag_deg(f_cutoff: float, f: float) -> float:
    """Phase lag in POSITIVE degrees of that filter at frequency f.

    TODO: with r = f / f_cutoff, the lag is atan2(sqrt(2) * r, 1 - r * r),
    converted to degrees. This is what the anti-alias filter costs you inside
    the control band — the whole reason the cutoff cannot just be made low.
    """
    raise NotImplementedError


if __name__ == "__main__":
    for fs in (100.0, 50.0):
        print(f"{F_VIBRATION} Hz sampled at {fs} Hz appears at "
              f"{alias_frequency(F_VIBRATION, fs)} Hz")
`,
        tests: [
          {
            name: '60 Hz sampled at 100 Hz folds to 40 Hz',
            assert: `assert abs(alias_frequency(60.0, 100.0) - 40.0) < 1e-9`,
          },
          {
            name: '60 Hz sampled at 50 Hz folds to 10 Hz',
            assert: `assert abs(alias_frequency(60.0, 50.0) - 10.0) < 1e-9`,
          },
          {
            name: 'a signal already below Nyquist is unchanged',
            assert: `assert abs(alias_frequency(2.0, 100.0) - 2.0) < 1e-9`,
          },
          {
            name: 'the cutoff that puts 60 Hz 20 dB down is near 19.0 Hz',
            assert: `fc = 60.0 / (99.0 ** 0.25)
assert abs(fc - 19.021) < 0.01
assert abs(butterworth2(fc, 60.0) - 0.1) < 1e-6`,
          },
          {
            name: 'that filter is essentially transparent at the 2 Hz command',
            assert: `fc = 60.0 / (99.0 ** 0.25)
assert butterworth2(fc, 2.0) > 0.999`,
          },
          {
            name: 'but it still costs about 8.5 degrees of lag at 2 Hz',
            hidden: true,
            assert: `fc = 60.0 / (99.0 ** 0.25)
lag = phase_lag_deg(fc, 2.0)
assert 7.5 < lag < 9.5, f"expected about 8.5 deg of lag, got {lag:.2f}"`,
          },
        ],
      },
      {
        id: 'ex_m27_biquad',
        title: 'A biquad notch in fixed-step flight-code form',
        kind: 'build',
        hours: 5,
        prompt: `Implement a transposed direct-form II biquad in C++ with:

- no dynamic allocation, no exceptions, no recursion
- float64 state, coefficients loaded once at init
- a single **step(x) -> y** call with a bounded, constant instruction count

Use it to realise the 18 rad/s notch from the previous module at 200 Hz. Verify against a Python reference to 1e-12, then measure the worst-case execution time over 1e7 calls.

Success: bit-comparable output, WCET reported, and you can state why transposed direct-form II is preferred over direct-form I for numerical conditioning in fixed point.`,
      },
    ],
    quiz: [
      {
        id: 'q_m27_zoh',
        q: 'A control loop runs at 100 Hz. How much phase does the zero-order hold alone cost at 5 Hz?',
        choices: [
          'About 0.5 degrees',
          'About 9 degrees',
          'About 18 degrees',
          'None — a hold has unity magnitude and no phase',
        ],
        answer: 1,
        explain:
          'A ZOH is well approximated by a delay of half a sample, T/2 = 5 ms. Phase lag is w*T/2 = 2*pi*5 * 0.005 = 0.157 rad = 9.0 degrees. Add typically one more sample of computational delay and you are down about 27 degrees at 5 Hz from digital implementation alone. This is why a design with only 35 degrees of continuous phase margin often flies badly.',
        b: 0.7,
        bloom: 'apply',
      },
      {
        id: 'q_m27_tustin',
        q: 'Why is Tustin preferred over forward Euler for discretizing a notch filter?',
        choices: [
          'Tustin is cheaper to evaluate',
          'Forward Euler maps the left half plane to a region that extends outside the unit circle, so a lightly damped or fast pole can become unstable; Tustin maps the entire left half plane inside the unit circle',
          'Forward Euler cannot represent complex poles',
          'Tustin has no frequency warping',
        ],
        answer: 1,
        explain:
          'Forward Euler is z = 1 + sT, which maps the left half plane to a half plane offset left of z = 1 — stable continuous poles with |sT| large land outside the unit circle. A notch has high-Q poles near the imaginary axis, precisely the worst case. Tustin, z = (1 + sT/2)/(1 - sT/2), is a conformal map of the entire left half plane onto the open unit disk, so stability is always preserved. Its cost is frequency warping, fixed by prewarping at the notch centre frequency.',
        b: 1.0,
        bloom: 'understand',
      },
      {
        id: 'q_m27_overrun',
        q: 'Your 100 Hz control task occasionally exceeds its 10 ms budget. What are the failure modes and how does flight software handle them?',
        choices: [
          'There is one failure mode, a missed sample, and it is harmless',
          'Either the task is preempted and the output is late (variable delay, eating phase margin and adding jitter), or the frame is skipped entirely (a held command and an effective rate drop); flight software detects the overrun, holds the last valid output or runs a degraded path, counts the event, and trips a watchdog or mode change on repeats',
          'The controller automatically re-tunes to the slower rate',
          'The RTOS silently extends the budget',
        ],
        answer: 1,
        explain:
          'A late output is a time-varying delay, which is worse than a fixed delay because it cannot be compensated and it injects jitter noise. A dropped frame is a held zero-order-hold command plus a lost integrator update. Real flight software instruments overruns explicitly: an overrun counter in telemetry, a deterministic fallback (hold last command, or a reduced-fidelity path guaranteed to fit), and an escalation policy. The correct engineering answer is that WCET must be bounded by design, and the runtime handling is the last line of defence, not the plan.',
        b: 1.3,
        bloom: 'analyze',
      },
      {
        id: 'q_m27_rate',
        q: 'What drives the two ends of the 20-40x bandwidth sample-rate rule of thumb?',
        choices: [
          'Only the Nyquist criterion',
          'The lower end is set by the phase the ZOH and computational delay eat at crossover; the upper end by CPU budget, sensor update rate, quantization noise amplification by derivative terms, and numerical conditioning of the difference equations',
          'The lower end is set by CPU budget and the upper by Nyquist',
          'Both ends are arbitrary conventions with no physical basis',
        ],
        answer: 1,
        explain:
          'Nyquist only says you must sample above twice the signal bandwidth, which is far too loose for closed-loop control. The binding constraint at the bottom is phase: at 20x bandwidth the ZOH alone costs 9 degrees at crossover. At the top, faster sampling shrinks the coefficient differences in difference equations (conditioning), amplifies quantization noise through derivative terms, and burns CPU you need for the rest of the GNC stack. Sensor rate frequently sets it in practice.',
        b: 1.1,
        bloom: 'analyze',
      },
    ],
    cards: [
      {
        id: 'c_m27_nyquist',
        front: 'Nyquist-Shannon sampling theorem',
        back: 'A signal band-limited to fmax is recoverable only if sampled above 2*fmax. For closed-loop CONTROL this is far too loose; use 20-40x the closed-loop bandwidth.',
        formula: true,
      },
      {
        id: 'c_m27_zoh',
        front: 'Zero-order hold phase penalty',
        back: 'A ZOH behaves like a delay of T/2, so phi = -w*T/2. At 100 Hz and 5 Hz that is -9 degrees. Computational delay adds roughly one more sample on top.',
        formula: true,
      },
      {
        id: 'c_m27_stability',
        front: 'Discrete-time stability region',
        back: 'The unit circle. z = exp(s*T), so the imaginary axis maps to |z| = 1 and the left half plane to |z| < 1. A discrete pole is stable iff |z| < 1.',
        formula: true,
      },
      {
        id: 'c_m27_tustin',
        front: 'Tustin (bilinear) transform',
        back: 's -> (2/T) * (z-1)/(z+1). Maps the whole open left half plane into the open unit disk, so stability is always preserved. Cost: frequency warping.',
        formula: true,
      },
      {
        id: 'c_m27_prewarp',
        front: 'Tustin with prewarping',
        back: 's -> (w0 / tan(w0*T/2)) * (z-1)/(z+1). Makes the discrete response exact at the single frequency w0 — use the notch centre or the crossover frequency.',
        formula: true,
      },
      {
        id: 'c_m27_euler',
        front: 'Why forward Euler is dangerous',
        back: 'z = 1 + s*T maps stable continuous poles outside the unit circle once |s*T| is large. High-Q notch poles and fast actuator poles break first. Backward Euler is always stable but distorts badly.',
        formula: true,
      },
      {
        id: 'c_m27_aliasing',
        front: 'Aliased frequency after sampling',
        back: 'A tone at f sampled at fs appears at |f - round(f/fs)*fs|. 60 Hz at 100 Hz sampling shows up at 40 Hz. The fix must be an ANALOG filter before the sampler; software cannot undo it.',
        formula: true,
      },
      {
        id: 'c_m27_matched',
        front: 'Matched pole-zero discretization',
        back: 'Map every continuous pole and zero by z = exp(s*T) and rescale for DC gain. Preserves pole locations exactly; good for simple filters, awkward for improper or delay-bearing systems.',
        formula: true,
      },
      {
        id: 'c_m27_biquad',
        front: 'Biquad section',
        back: 'y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]. Cascade biquads rather than implementing a high-order polynomial directly — conditioning degrades fast with order.',
        formula: true,
      },
      {
        id: 'c_m27_df2t',
        front: 'Why transposed direct-form II',
        back: 'It has the best numerical conditioning of the standard forms for fixed and floating point, with only two state words per section and no large intermediate accumulator growth.',
      },
      {
        id: 'c_m27_delta',
        front: 'Delta form (and when you need it)',
        back: 'At very high sample rates, direct-form coefficients cluster near z = 1 and lose precision. The delta operator (z-1)/T keeps coefficients well scaled and is the standard remedy in fixed point.',
        formula: true,
      },
      {
        id: 'c_m27_jitter',
        front: 'Jitter vs delay',
        back: 'A fixed delay can be modelled and compensated. Jitter is a time-varying delay: it cannot be compensated, it injects broadband noise, and it invalidates the LTI analysis your margins came from. Bound it, do not correct it.',
      },
      {
        id: 'c_m27_quantization',
        front: 'Quantization noise power',
        back: 'For a uniform quantizer of step q, the error is approximately uniform with variance q^2/12. Derivative terms multiply this by roughly N/T, which is why filtered derivatives matter even more in fixed point.',
        formula: true,
      },
    ],
  },

  {
    id: 't3_m28_state_space',
    track: 'gnc',
    tier: 3,
    title: 'State-Space Control',
    summary:
      'Move from one loop at a time to the whole coupled MIMO plant: test controllability and observability, place poles, and build an observer whose error dynamics you can prove decouple from the controller. You will be able to look at a rank deficiency and say which physical state is unreachable or unobservable.',
    prereqs: ['t3_m26_classical_control', 't0_m05_linear_algebra_2'],
    hours: 60,
    topics: [
      'State-space representation and realizations: controllable canonical, observable canonical, modal',
      'Similarity transformations and what is invariant under them',
      'Solution of xdot = Ax + Bu via the matrix exponential; the discrete-time equivalent',
      'Controllability: the Kalman rank test, the controllability Gramian, the PBH test',
      'Observability and duality; stabilizability and detectability',
      'Pole placement: Ackermann, Bass-Gura, and robust (eigenstructure) pole placement',
      'Luenberger observers and the estimation error dynamics',
      'The separation principle and the exact conditions under which it holds',
      'Integral action in state feedback: servo and augmented-state design',
      'MIMO systems, transmission zeros, and the relative gain array',
      'Model reduction: balanced truncation and Hankel singular values',
    ],
    objectives: [
      'Test controllability and observability and interpret a deficiency physically, such as an unobservable gyro bias',
      'Place closed-loop poles for a MIMO plant and justify the locations against control effort',
      'Design a full-order observer and verify numerically that the separation principle holds',
      'Explain what a badly conditioned observability Gramian means operationally',
    ],
    resources: [
      {
        title: 'MIT OCW 16.30 Feedback Control Systems (Fall 2010) and 16.30/16.31 Estimation and Control of Aerospace Systems',
        kind: 'course',
        free: true,
        note: 'Full lecture notes: frequency domain and state space, Nyquist/Bode design, state feedback, state estimation.',
      },
      {
        title: 'Control Bootcamp (YouTube playlist)',
        author: 'Steve Brunton',
        kind: 'video',
        url: 'https://www.youtube.com/playlist?list=PLMrJAkhIeNNR20Mz-VpzgfQs5zrYi085m',
        free: true,
        note: 'State space, controllability/observability, pole placement, LQR, Kalman, LQG, robust control. The single best free video series for this tier.',
      },
      { title: 'Stanford EE263 — Introduction to Linear Dynamical Systems', kind: 'course', free: true },
      {
        title: 'Data-Driven Science and Engineering, Ch. 8-9',
        author: 'Brunton & Kutz',
        kind: 'book',
        free: true,
        note: 'Free PDF from the authors.',
      },
      { title: 'Linear System Theory and Design', author: 'Chi-Tsong Chen', kind: 'book', free: false },
    ],
    exercises: [
      {
        id: 'ex_m28_ctrb_obsv',
        title: 'Controllability of a 3-axis spacecraft with a failed wheel',
        kind: 'code',
        lang: 'python',
        hours: 6,
        prompt: `Build the linearised state-space model of a 3-axis rigid spacecraft with four reaction wheels in a pyramid configuration (state: three body rates and three small attitude angles; input: four wheel torques).

1. Compute the controllability matrix rank with all four wheels healthy.
2. Fail wheels one at a time and recompute. Which single failures still leave the system controllable? Which pairs do not?
3. For a failed case that is uncontrollable, find the uncontrollable mode with the PBH test and say **physically** what direction you have lost.
4. Repeat the exercise for observability with only a two-axis rate gyro.

Success: your rank results match the pyramid geometry, and you can name the lost physical direction without looking at the numbers.`,
        starter: `import numpy as np


def ctrb(A, B):
    """Kalman controllability matrix [B, AB, A^2 B, ..., A^(n-1) B]."""
    raise NotImplementedError


def obsv(A, C):
    """Kalman observability matrix stacked [C; CA; ...; CA^(n-1)]."""
    raise NotImplementedError


def pbh_uncontrollable_modes(A, B, tol=1e-9):
    """Return the eigenvalues of A for which rank([A - lam*I, B]) < n."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'double integrator is controllable from force',
            assert: `import numpy as np
A = np.array([[0.0, 1.0], [0.0, 0.0]])
B = np.array([[0.0], [1.0]])
assert np.linalg.matrix_rank(ctrb(A, B)) == 2, "a double integrator is controllable from force"`,
          },
          {
            name: 'a decoupled unactuated mode is caught by PBH',
            assert: `import numpy as np
A = np.diag([-1.0, -2.0, -3.0])
B = np.array([[1.0], [1.0], [0.0]])
bad = pbh_uncontrollable_modes(A, B)
assert len(bad) == 1 and abs(bad[0] + 3.0) < 1e-9, "the -3 mode has no input path"`,
          },
          {
            name: 'duality: obsv(A, C) == ctrb(A.T, C.T).T',
            assert: `import numpy as np
rng = np.random.default_rng(7)
A = rng.standard_normal((4, 4))
C = rng.standard_normal((2, 4))
assert np.allclose(obsv(A, C), ctrb(A.T, C.T).T), "observability is controllability of the dual system"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m28_place',
        title: 'Pole placement and the price of speed',
        kind: 'code',
        lang: 'python',
        hours: 5,
        prompt: `For the healthy 4-wheel spacecraft model, place the closed-loop poles at -a*(1 +/- j) for a swept from 0.05 to 5 rad/s.

For each a: record ||K||, the peak wheel torque for a 5 degree initial attitude error, and the closed-loop bandwidth. Plot peak torque against a on log-log axes and fit the slope.

Then answer, with your data: why can you not simply place poles far into the left half plane?

Success: the peak-torque scaling law is identified, and you can state two separate reasons (actuator saturation and noise amplification / model validity) that bound a.`,
        starter: `"""Pole placement for a single spacecraft axis, and what speed costs.

The plant is a rigid body about one axis: J * theta_ddot = u. Everything the
exercise asks about falls out of where you put the two closed-loop poles.
"""

import numpy as np
from scipy.signal import place_poles

J = 120.0                      # kg m^2, a small satellite about one axis
THETA0 = np.deg2rad(5.0)       # rad, the initial attitude error to recover from

A = np.array([[0.0, 1.0], [0.0, 0.0]])
B = np.array([[0.0], [1.0 / J]])


def gain_for(a: float) -> np.ndarray:
    """State-feedback gain K placing the closed-loop poles at -a*(1 +/- 1j).

    TODO: build the pole pair and call scipy.signal.place_poles(A, B, poles).
    Return its .gain_matrix, shape (1, 2).
    """
    raise NotImplementedError


def peak_torque(K: np.ndarray, theta0: float = THETA0) -> float:
    """Largest |u| while recovering from x0 = [theta0, 0] under u = -K x.

    TODO: the peak occurs at t = 0, before the rate has built up, so this is
    just |K[0, 0] * theta0|. Convince yourself by simulating before you
    shortcut it.
    """
    raise NotImplementedError


def closed_loop_poles(K: np.ndarray) -> np.ndarray:
    """Eigenvalues of A - B K, sorted, for checking your placement."""
    return np.sort_complex(np.linalg.eigvals(A - B @ K))


if __name__ == "__main__":
    sweep = np.logspace(np.log10(0.05), np.log10(5.0), 25)
    torque = np.array([peak_torque(gain_for(a)) for a in sweep])

    slope, _ = np.polyfit(np.log10(sweep), np.log10(torque), 1)
    print(f"peak torque scales as a^{slope:.2f}")
    for a in (0.05, 1.0, 5.0):
        print(f"  a={a:5.2f}  K={gain_for(a).ravel()}  peak={peak_torque(gain_for(a)):8.2f} N m")
`,
        tests: [
          {
            name: 'places the poles exactly where asked',
            assert: `K = gain_for(1.0)
p = closed_loop_poles(K)
assert abs(p[0] - (-1 - 1j)) < 1e-9 and abs(p[1] - (-1 + 1j)) < 1e-9`,
          },
          {
            name: 'the gain matches the hand-derived double-integrator result',
            assert: `a, K = 2.5, gain_for(2.5)
assert abs(K[0, 0] - 2 * a * a * J) < 1e-6, f"k1 was {K[0, 0]}"
assert abs(K[0, 1] - 2 * a * J) < 1e-6, f"k2 was {K[0, 1]}"`,
          },
          {
            name: 'peak torque for a 5 degree error at a = 1 rad/s is about 21 N m',
            assert: `assert abs(peak_torque(gain_for(1.0)) - 20.944) < 0.01`,
          },
          {
            name: 'the poles always land at damping 0.7071, whatever a is',
            assert: `for a in (0.1, 1.0, 4.0):
    p = closed_loop_poles(gain_for(a))[0]
    zeta = -p.real / abs(p)
    assert abs(zeta - 2 ** -0.5) < 1e-9`,
          },
          {
            name: 'the price of speed is quadratic, not linear',
            hidden: true,
            assert: `sweep = np.logspace(-1, 0.5, 20)
tq = np.array([peak_torque(gain_for(a)) for a in sweep])
slope = np.polyfit(np.log10(sweep), np.log10(tq), 1)[0]
assert abs(slope - 2.0) < 1e-6, f"expected a^2 scaling, fitted a^{slope:.3f}"`,
          },
        ],
      },
      {
        id: 'ex_m28_observer',
        title: 'Observer design and the separation principle, numerically',
        kind: 'code',
        lang: 'python',
        hours: 6,
        prompt: `Design a full-order Luenberger observer for the same plant with observer poles 4x faster than the controller poles.

1. Form the 2n x 2n closed-loop matrix in the (x, error) coordinates and show it is **block triangular**, so its eigenvalues are exactly the union of eig(A - BK) and eig(A - LC).
2. Verify numerically.
3. Now perturb the observer model by 20% in one inertia and show what happens to the eigenvalue split. State precisely when the separation principle fails.

Success: the eigenvalue union is confirmed to machine precision on the nominal model, and you can articulate the mismatch condition that breaks it.`,
        starter: `import numpy as np


def separation_check(A, B, C, K, L):
    """Return (combined_eigs, union_eigs) for the observer-based closed loop.

    Build the 2n x 2n matrix in coordinates (x, e) where e = x - xhat:
        [[A - B@K,  B@K],
         [0,        A - L@C]]
    and compare its spectrum to the union of eig(A - B@K) and eig(A - L@C).
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'the spectra match for a nominal model',
            assert: `import numpy as np
A = np.array([[0.0, 1.0], [-2.0, -3.0]])
B = np.array([[0.0], [1.0]])
C = np.array([[1.0, 0.0]])
K = np.array([[14.0, 5.0]])
L = np.array([[17.0], [64.0]])
comb, union = separation_check(A, B, C, K, L)
assert np.allclose(np.sort_complex(comb), np.sort_complex(union), atol=1e-9), "separation principle violated on a nominal model"`,
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q_m28_two_wheels',
        q: 'A spacecraft has reaction wheels on only two body axes. Is its attitude controllable?',
        choices: [
          'Yes, always — the Kalman rank test gives full rank because wheels produce internal torques',
          'Not for the linearised model about rest: the rank test drops by one and the missing direction is rotation about the unactuated axis. The true nonlinear system can be controllable via gyroscopic coupling, but not in the linear sense and not with arbitrary authority',
          'No, and no nonlinear scheme can ever reorient it',
          'Yes, because momentum is conserved',
        ],
        answer: 1,
        explain:
          'Linearised about rest, the angular acceleration about the unactuated axis has no input path, so the controllability matrix loses rank and the PBH test flags the corresponding eigenvalue. Physically you cannot produce torque about that axis directly. The nonlinear system with nonzero body rates can be controllable through the w x Jw coupling term (this is the classic underactuated attitude control result), but control authority is small, the manoeuvre is slow, and the linear design tools do not apply. The honest interview answer names both halves.',
        b: 1.3,
        bloom: 'analyze',
      },
      {
        id: 'q_m28_fast_poles',
        q: 'Why can you not simply place closed-loop poles arbitrarily far into the left half plane?',
        choices: [
          'Because Ackermann formula fails numerically beyond -10 rad/s',
          'Because the required gains, control effort and closed-loop bandwidth all grow with the pole distance — saturating actuators, amplifying sensor noise, and pushing the loop into frequencies where the model is no longer valid (unmodelled flex, delay)',
          'Because it would make the system non-minimum phase',
          'Because the separation principle only holds for slow poles',
        ],
        answer: 1,
        explain:
          'Pole placement can mathematically put poles anywhere for a controllable system, but the gains scale roughly as the pole distance to the power of the relative degree. Three separate walls stop you: actuator saturation (and the windup and loss of linearity that follow), noise amplification through the high gains, and model validity — the flex modes, delays and unmodelled actuator dynamics that you truncated all live at high frequency. Fast poles also mean high sensitivity peaks, so robustness collapses even when authority exists.',
        b: 0.9,
        bloom: 'understand',
      },
      {
        id: 'q_m28_separation',
        q: 'State the separation principle and when it fails.',
        choices: [
          'Controller and observer can be designed independently, and it never fails for linear systems',
          'For a linear time-invariant plant with an exact model, the observer-based closed-loop eigenvalues are exactly the union of eig(A-BK) and eig(A-LC), so the two designs can be done independently. It fails under model mismatch, nonlinearity, actuator saturation, and in general it says nothing about robustness margins even when it holds',
          'It says the closed-loop poles are the product of the controller and observer poles',
          'It only applies when the observer is faster than the controller',
        ],
        answer: 1,
        explain:
          'Writing the closed loop in (x, e) coordinates gives a block-triangular matrix whose spectrum is the union of the two designed spectra. That is an exact statement about pole locations for the nominal model. It is not a statement about margins: LQG is the canonical counterexample where both pieces are individually excellent and the combination has arbitrarily bad gain and phase margin. Mismatch, saturation and nonlinearity all break the block-triangular structure itself.',
        b: 1.2,
        bloom: 'understand',
      },
      {
        id: 'q_m28_gramian',
        q: 'Your observability Gramian has condition number 1e9. What does that mean operationally?',
        choices: [
          'The system is unobservable and no estimator will work',
          'Some state direction is roughly 1e4.5 times harder to observe than the best one — estimates along it will be slow to converge, noise-dominated and numerically fragile, and the filter covariance in that direction will stay large',
          'The measurement noise is too large',
          'The system needs a faster sample rate',
        ],
        answer: 1,
        explain:
          'The Gramian condition number is the squared ratio of observability in the best and worst state directions. It is formally observable, but the weak direction accumulates almost no information per unit time, so covariance stays large there, the estimate is dominated by process noise and model error, and forming the normal equations squares the conditioning again. The usual responses are to add a measurement with geometry that excites that direction, add the state to the consider set, or remove it from the estimated state entirely.',
        b: 1.5,
        bloom: 'analyze',
      },
      {
        id: 'q_m28_stabilizable',
        q: 'What is the difference between controllable and stabilizable?',
        choices: [
          'They are synonyms',
          'Controllable means every mode can be moved; stabilizable is the weaker condition that every UNSTABLE mode can be moved — uncontrollable stable modes are acceptable because they decay on their own',
          'Stabilizable means the open loop is stable',
          'Controllable applies to continuous systems, stabilizable to discrete ones',
        ],
        answer: 1,
        explain:
          'The PBH test makes this precise: a system is stabilizable if rank([A - lambda*I, B]) is full for every eigenvalue with non-negative real part. Uncontrollable modes in the open left half plane are harmless because they go to zero without help. The dual notion is detectability. Real designs are frequently stabilizable but not controllable — a well-damped structural mode with no input path is the usual example.',
        b: 0.8,
        bloom: 'recall',
      },
    ],
    cards: [
      {
        id: 'c_m28_ss',
        front: 'State-space form',
        back: 'xdot = A*x + B*u, y = C*x + D*u. A is n x n (dynamics), B is n x m (input map), C is p x n (measurement map).',
        formula: true,
      },
      {
        id: 'c_m28_solution',
        front: 'Solution of the linear state equation',
        back: 'x(t) = expm(A*t)*x0 + integral from 0 to t of expm(A*(t-s))*B*u(s) ds. The matrix exponential is the state transition matrix for a time-invariant A.',
        formula: true,
      },
      {
        id: 'c_m28_discrete',
        front: 'Exact discretization (ZOH) of a state-space model',
        back: 'Ad = expm(A*T), Bd = integral from 0 to T of expm(A*s) ds * B. Computed in practice by exponentiating the block matrix [[A, B], [0, 0]].',
        formula: true,
      },
      {
        id: 'c_m28_ctrb',
        front: 'Kalman controllability test',
        back: 'Cm = [B, A*B, A^2*B, ..., A^(n-1)*B]. Controllable iff rank(Cm) = n. Numerically prefer the Gramian or PBH — Cm conditioning is terrible for large n.',
        formula: true,
      },
      {
        id: 'c_m28_pbh',
        front: 'PBH (Popov-Belevitch-Hautus) test',
        back: 'Controllable iff rank([A - lambda*I, B]) = n for EVERY eigenvalue lambda of A. Its value is that it names the offending mode, not just the rank deficit.',
        formula: true,
      },
      {
        id: 'c_m28_obsv',
        front: 'Observability matrix and duality',
        back: 'Om = [C; C*A; ...; C*A^(n-1)], observable iff rank = n. Duality: (A, C) is observable exactly when (A-transpose, C-transpose) is controllable — so every controllability result has a free observability twin.',
        formula: true,
      },
      {
        id: 'c_m28_gramian',
        front: 'Controllability Gramian',
        back: 'Wc = integral of expm(A*t)*B*B-transpose*expm(A-transpose*t) dt; for a stable A it solves A*Wc + Wc*A-transpose + B*B-transpose = 0. Its small singular values are the expensive directions.',
        formula: true,
      },
      {
        id: 'c_m28_stab',
        front: 'Stabilizable and detectable',
        back: 'Stabilizable: every mode with Re(lambda) >= 0 is controllable. Detectable: every such mode is observable. These, not full controllability/observability, are the real requirements for a stabilizing design.',
      },
      {
        id: 'c_m28_ackermann',
        front: 'Ackermann formula',
        back: 'K = [0 ... 0 1] * inv(Cm) * alpha_d(A), where alpha_d is the desired characteristic polynomial. Elegant, SISO only, and numerically poor above about n = 10 — use a robust eigenstructure routine instead.',
        formula: true,
      },
      {
        id: 'c_m28_observer',
        front: 'Luenberger observer and its error dynamics',
        back: 'xhatdot = A*xhat + B*u + L*(y - C*xhat). With e = x - xhat, edot = (A - L*C)*e: the error dynamics are autonomous and independent of u.',
        formula: true,
      },
      {
        id: 'c_m28_separation',
        front: 'Separation principle',
        back: 'For an exact LTI model, the observer-based closed-loop spectrum is exactly eig(A - B*K) union eig(A - L*C). It fixes POLES only — it guarantees nothing about margins (see LQG).',
        formula: true,
      },
      {
        id: 'c_m28_observer_speed',
        front: 'How fast should the observer be?',
        back: 'Typically 2-6x the controller bandwidth, so estimation transients die before the controller reacts to them. Faster costs noise amplification through L, exactly as faster controller poles cost control effort through K.',
      },
      {
        id: 'c_m28_servo',
        front: 'Integral action in state feedback',
        back: 'Augment the state with the integral of the tracking error, xi_dot = r - y, and design K on the augmented plant. This gives zero steady-state error to step disturbances, the state-space analogue of the I term.',
        formula: true,
      },
      {
        id: 'c_m28_balred',
        front: 'Balanced truncation',
        back: 'Transform so Wc = Wo = diag(Hankel singular values), then discard the states with small sigma — those are simultaneously hard to reach and hard to observe. Error bound: twice the sum of the discarded sigmas.',
        formula: true,
      },
    ],
  },

  {
    id: 't3_m29_optimal_control_lqr',
    track: 'gnc',
    tier: 3,
    title: 'Optimal Control: LQR and LQG',
    summary:
      'Derive the Riccati equation two ways, tune Q and R against a real control-effort budget, and stabilize a nominal ascent or descent trajectory with time-varying LQR. You will also be able to say exactly why LQR ships with guaranteed margins and LQG ships with none.',
    prereqs: ['t3_m28_state_space', 't0_m11_optimization'],
    hours: 60,
    topics: [
      'The linear quadratic cost functional and what Q, R and the cross term weight',
      'LQR derived via dynamic programming (HJB) and via calculus of variations',
      'The algebraic and differential Riccati equations',
      'Choosing Q and R: Bryson rule, physical scaling, iterating against an effort budget',
      'The guaranteed margins of full-state-feedback LQR and why LQG loses them',
      'Infinite-horizon vs finite-horizon LQR',
      'LQR with integral action',
      'Cheap control and the asymptotic (Kalman) root locus',
      'Time-varying LQR along a nominal trajectory for trajectory stabilization',
      'LQG = LQR + Kalman filter, and the stochastic separation principle',
      'Loop transfer recovery and what it actually costs',
      'Discrete-time LQR and the DARE',
      'The Hamiltonian and the Pontryagin minimum principle as the general frame',
      'iLQR and DDP as the nonlinear extension',
    ],
    objectives: [
      'Derive the LQR gain and solve the continuous algebraic Riccati equation two independent ways',
      'Tune Q and R to hit a stated control-effort budget and explain the trade you made',
      'Implement TVLQR around a nominal trajectory and show it rejects an initial-condition dispersion',
      'Explain precisely why LQG margins can be arbitrarily bad and name the result that proves it',
    ],
    resources: [
      {
        title: 'Control Bootcamp — LQR, Kalman and LQG episodes',
        author: 'Steve Brunton',
        kind: 'video',
        url: 'https://www.youtube.com/playlist?list=PLMrJAkhIeNNR20Mz-VpzgfQs5zrYi085m',
        free: true,
      },
      { title: 'MIT 16.30/16.31 lecture notes', kind: 'course', free: true },
      {
        title: 'Optimal Control: Linear Quadratic Methods',
        author: 'Anderson & Moore',
        kind: 'book',
        free: false,
        note: 'Dover reprint, inexpensive, and still the clearest treatment of LQR margins.',
      },
      { title: 'Optimal Control', author: 'Lewis, Vrabie & Syrmos', kind: 'book', free: false },
      { title: 'Applied Optimal Control', author: 'Bryson & Ho', kind: 'book', free: false },
      {
        title: 'Underactuated Robotics (MIT 6.832)',
        author: 'Russ Tedrake',
        kind: 'course',
        url: 'https://underactuated.csail.mit.edu',
        free: true,
        note: 'Free interactive text. Outstanding on LQR, TVLQR, iLQR/DDP, Lyapunov and region of attraction.',
      },
    ],
    exercises: [
      {
        id: 'ex_m29_care',
        title: 'Solve the Riccati equation two ways',
        kind: 'code',
        lang: 'python',
        hours: 6,
        prompt: `Solve the continuous algebraic Riccati equation for a plant of your choice (use the spacecraft model from the state-space module) **twice**:

1. With a direct solver (scipy.linalg.solve_continuous_are).
2. By integrating the **differential** Riccati equation backwards from P(tf) = Qf over a long horizon and observing convergence to the steady-state solution.

Show the two agree, plot the convergence of ||P(t) - P_inf|| against time-to-go, and explain the time constant you see.

Success: agreement to 1e-8, and you can state what P represents physically.`,
        starter: `import numpy as np


def lqr_gain(A, B, Q, R):
    """Infinite-horizon continuous LQR: solve the CARE and return (K, P).

    CARE:  A.T @ P + P @ A - P @ B @ inv(R) @ B.T @ P + Q = 0
    Gain:  K = inv(R) @ B.T @ P        (control is u = -K @ x)
    """
    raise NotImplementedError


def dre_backward(A, B, Q, R, Qf, tf, n_steps=20000):
    """Integrate the differential Riccati equation backwards from P(tf) = Qf.

    Pdot = -(A.T @ P + P @ A - P @ B @ inv(R) @ B.T @ P + Q)

    Return the array of P matrices, earliest time first.
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'CARE residual is zero',
            assert: `import numpy as np
A = np.array([[0.0, 1.0], [0.0, 0.0]])
B = np.array([[0.0], [1.0]])
Q = np.eye(2)
R = np.array([[1.0]])
K, P = lqr_gain(A, B, Q, R)
res = A.T @ P + P @ A - P @ B @ np.linalg.inv(R) @ B.T @ P + Q
assert np.max(np.abs(res)) < 1e-8, "CARE residual too large: %r" % np.max(np.abs(res))
assert np.allclose(P, P.T, atol=1e-10) and np.all(np.linalg.eigvalsh(P) > 0), "P must be symmetric positive definite"`,
          },
          {
            name: 'double integrator with unit weights gives the known gain',
            assert: `import numpy as np
A = np.array([[0.0, 1.0], [0.0, 0.0]])
B = np.array([[0.0], [1.0]])
K, P = lqr_gain(A, B, np.eye(2), np.array([[1.0]]))
assert np.allclose(K.ravel(), [1.0, np.sqrt(3.0)], atol=1e-6), "expected K = [1, sqrt(3)], got %r" % (K,)`,
          },
          {
            name: 'backward DRE converges to the CARE solution',
            assert: `import numpy as np
A = np.array([[0.0, 1.0], [0.0, 0.0]])
B = np.array([[0.0], [1.0]])
Q = np.eye(2)
R = np.array([[1.0]])
K, P = lqr_gain(A, B, Q, R)
Ps = dre_backward(A, B, Q, R, np.zeros((2, 2)), 40.0)
assert np.max(np.abs(Ps[0] - P)) < 1e-5, "backward DRE should converge to the steady-state P"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m29_qr_sweep',
        title: 'Sweep R and find the effort/performance frontier',
        kind: 'code',
        lang: 'python',
        hours: 4,
        prompt: `Hold Q fixed and sweep R over six decades. For each R record settling time, peak control, and the closed-loop pole locations.

Plot settling time against peak control (the achievable frontier) and mark the "cheap control" end. Explain what the poles do as R goes to zero for a minimum-phase plant, and what happens instead if the plant has a right-half-plane zero.

Success: the frontier is monotone and you can state Bryson rule from memory and apply it to pick a starting Q and R for a real vehicle with stated pointing and gimbal limits.`,
        starter: `"""LQR on one attitude axis: what buying speed actually costs.

Plant: J * theta_ddot = u, written in state space. Q is held fixed and R is
swept over six decades, which traces the achievable frontier between settling
time and peak control.
"""

import numpy as np
from scipy.linalg import solve_continuous_are

J = 120.0                        # kg m^2
A = np.array([[0.0, 1.0], [0.0, 0.0]])
B = np.array([[0.0], [1.0 / J]])
Q = np.eye(2)


def lqr_gain(R: float) -> np.ndarray:
    """Optimal K for u = -K x, minimising the integral of x'Qx + R u^2.

    TODO: solve the continuous algebraic Riccati equation with
    scipy.linalg.solve_continuous_are, then form K = R^-1 B' P.
    """
    raise NotImplementedError


def bryson(max_state: np.ndarray, max_control: float) -> tuple[np.ndarray, float]:
    """Bryson's rule: weight each term by the inverse square of its budget.

    TODO: Q = diag(1 / max_state**2), R = 1 / max_control**2. Say it out loud
    once and you will never look it up again.
    """
    raise NotImplementedError


def settling_and_peak(K: np.ndarray, theta0: float = np.deg2rad(5.0)):
    """Simulate from [theta0, 0] and return (2% settling time, peak |u|)."""
    Acl = A - B @ K
    dt, T = 0.002, 400.0
    x = np.array([theta0, 0.0])
    peak, settle, n = 0.0, T, int(T / dt)
    for k in range(n):
        u = float(-K @ x)
        peak = max(peak, abs(u))
        x = x + dt * (Acl @ x)
        if abs(x[0]) > 0.02 * abs(theta0):
            settle = (k + 1) * dt
    return settle, peak


if __name__ == "__main__":
    for R in np.logspace(-3, 3, 7):
        K = lqr_gain(float(R))
        s, p = settling_and_peak(K)
        print(f"R={R:9.3g}  K={K.ravel()}  settle={s:7.2f}s  peak={p:9.3f} N m")
`,
        tests: [
          {
            name: 'the Riccati solution matches the hand-derived double-integrator gains',
            assert: `# With A = [[0,1],[0,0]], B = [[0],[1/J]] and Q = I the Riccati equation has a
# closed form: p12 = sqrt(R)*J, p22 = sqrt(R)*J*sqrt(2*J*sqrt(R) + 1), so
#     k1 = 1/sqrt(R)        k2 = sqrt((2*J*sqrt(R) + 1)/R)
# k1 does not depend on J at all: the 1/J in B cancels the 1/R in K = R^-1 B' P.
for R in (0.01, 1.0, 100.0):
    K = lqr_gain(R).ravel()
    k1 = 1.0/np.sqrt(R)
    k2 = np.sqrt((2.0*J*np.sqrt(R) + 1.0)/R)
    assert abs(K[0] - k1) < 1e-6 * max(1.0, k1), f'k1 wrong at R={R}'
    assert abs(K[1] - k2) < 1e-6 * max(1.0, k2), f'k2 wrong at R={R}'`,
          },
          {
            name: 'cheaper control buys a faster loop, monotonically',
            assert: `ks = [lqr_gain(R)[0, 0] for R in (1e-3, 1e-1, 1e1, 1e3)]
assert all(a > b for a, b in zip(ks, ks[1:])), 'gain must fall as R rises'`,
          },
          {
            name: 'the closed loop is always stable, whatever R is',
            assert: `for R in (1e-4, 1.0, 1e4):
    ev = np.linalg.eigvals(A - B @ lqr_gain(R))
    assert (ev.real < 0).all(), f'unstable at R={R}'`,
          },
          {
            name: 'Bryson\'s rule turns budgets into weights',
            assert: `Qb, Rb = bryson(np.array([np.deg2rad(0.5), np.deg2rad(2.0)]), 8.0)
assert abs(Qb[0, 0] - 1/np.deg2rad(0.5)**2) < 1e-6
assert abs(Rb - 1/64.0) < 1e-12`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m29_tvlqr',
        title: 'TVLQR around a nominal ascent trajectory',
        kind: 'code',
        lang: 'python',
        hours: 10,
        prompt: `Take a nominal planar ascent trajectory (state: position, velocity, pitch, pitch rate; control: gimbal angle). Linearise about the nominal at each knot to get A(t), B(t).

1. Integrate the differential Riccati equation backwards along the trajectory to get K(t).
2. Fly the nonlinear plant from a dispersed initial condition using u = u_nom(t) - K(t)*(x - x_nom(t)).
3. Compare against a single fixed gain computed at the midpoint.

Report terminal state error for both across 200 dispersed cases. Success: TVLQR beats the fixed gain by a clear margin and you can explain which part of the trajectory the fixed gain fails on and why.`,
        starter: `"""Time-varying LQR along a nominal trajectory.

The differential Riccati equation runs BACKWARDS from the terminal cost, which
is the part everyone gets wrong first. Integrate it once, store K(t), then fly
forwards using the stored schedule.
"""

import numpy as np
from scipy.linalg import solve_continuous_are


def riccati_backward(A_of_t, B_of_t, Q, R, S_T, t_grid):
    """Integrate -P_dot = A'P + PA - P B R^-1 B' P + Q backwards from S_T.

    Returns P at each grid point, earliest first.

    TODO: step backwards through t_grid with RK4 or simple Euler, evaluating
    A_of_t and B_of_t at each step. Remember the sign: you are integrating
    backwards in time, so the update adds +P_dot * dt as t decreases.
    """
    raise NotImplementedError


def gains_from_P(P_list, B_of_t, R, t_grid) -> list[np.ndarray]:
    """K(t) = R^-1 B(t)' P(t) at each grid point.

    TODO: one line per knot.
    """
    raise NotImplementedError


if __name__ == "__main__":
    # A time-invariant plant is the sanity case: far from the terminal time the
    # schedule must settle onto the steady-state LQR gain.
    A = np.array([[0.0, 1.0], [0.0, 0.0]])
    B = np.array([[0.0], [1.0]])
    Q, R = np.eye(2), np.array([[1.0]])
    t = np.linspace(0.0, 30.0, 3001)
    P = riccati_backward(lambda _: A, lambda _: B, Q, R, np.zeros((2, 2)), t)
    K = gains_from_P(P, lambda _: B, R, t)
    print("K(0)   =", K[0].ravel())
    print("K_inf  =", (np.linalg.inv(R) @ B.T @ solve_continuous_are(A, B, Q, R)).ravel())
`,
        tests: [
          {
            name: 'far from the terminal time, TVLQR settles onto the steady-state gain',
            assert: `A = np.array([[0.0, 1.0], [0.0, 0.0]])
B = np.array([[0.0], [1.0]])
Q, R = np.eye(2), np.array([[1.0]])
t = np.linspace(0.0, 30.0, 3001)
K = gains_from_P(riccati_backward(lambda _: A, lambda _: B, Q, R, np.zeros((2,2)), t),
                 lambda _: B, R, t)
Kinf = (np.linalg.inv(R) @ B.T @ solve_continuous_are(A, B, Q, R)).ravel()
assert np.allclose(K[0].ravel(), Kinf, atol=1e-3), f'{K[0].ravel()} vs {Kinf}'`,
          },
          {
            name: 'the gain schedule has one entry per knot',
            assert: `A = np.array([[0.0, 1.0], [0.0, 0.0]]); B = np.array([[0.0], [1.0]])
t = np.linspace(0.0, 5.0, 101)
P = riccati_backward(lambda _: A, lambda _: B, np.eye(2), np.array([[1.0]]), np.zeros((2,2)), t)
assert len(P) == len(t)`,
          },
          {
            name: 'P stays symmetric positive semi-definite throughout',
            assert: `A = np.array([[0.0, 1.0], [0.0, 0.0]]); B = np.array([[0.0], [1.0]])
t = np.linspace(0.0, 10.0, 501)
for P in riccati_backward(lambda _: A, lambda _: B, np.eye(2), np.array([[1.0]]), np.zeros((2,2)), t):
    assert np.allclose(P, P.T, atol=1e-8), 'P must stay symmetric'
    assert np.linalg.eigvalsh(P).min() > -1e-8, 'P must stay PSD'`,
            hidden: true,
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q_m29_gain',
        q: 'What is the infinite-horizon LQR gain, and what does P represent?',
        choices: [
          'K = R*B.T*P, and P is the controllability Gramian',
          'K = inv(R)*B.T*P where P solves the CARE, and x.T*P*x is the optimal cost-to-go from state x',
          'K = inv(Q)*A.T*P, and P is the observability Gramian',
          'K = B.T*inv(P), and P is the steady-state covariance',
        ],
        answer: 1,
        explain:
          'Stationarity of the Hamiltonian H = 0.5*(x.T*Q*x + u.T*R*u) + lambda.T*(A*x + B*u) in u gives R*u + B.T*lambda = 0. Taking lambda = P*x turns the costate equation into the algebraic Riccati equation and gives u = -inv(R)*B.T*P*x. From the HJB route, the value function is exactly V(x) = x.T*P*x, so P is the optimal cost-to-go kernel. Being able to run both derivations on a whiteboard is standard for a GNC controls round.',
        b: 1.0,
        bloom: 'apply',
      },
      {
        id: 'q_m29_margins',
        q: 'Why does full-state-feedback LQR have guaranteed margins while LQG does not?',
        choices: [
          'LQG uses a discrete Riccati equation which is less accurate',
          'The LQR return difference identity forces the Nyquist plot outside the unit circle centred at -1, giving at least 6 dB gain reduction margin, infinite gain increase margin and at least 60 degrees of phase margin. Inserting an observer breaks that identity, and Doyle 1978 showed LQG margins can be made arbitrarily small',
          'LQG has better margins than LQR, not worse',
          'LQR margins come from the separation principle, which LQG does not satisfy',
        ],
        answer: 1,
        explain:
          'The Kalman return-difference identity for LQR gives |1 + L(jw)| >= 1 at every frequency for the loop broken at the plant input. Geometrically the Nyquist curve never enters the unit disk about -1, which yields GM in [1/2, infinity) and PM at least 60 degrees. The observer sits between the measurement and the control, so the loop broken at the input is no longer the LQR loop and the identity no longer holds. Doyle, "Guaranteed Margins for LQG Regulators" (IEEE TAC, 1978), is a one-page paper whose abstract is essentially "there are none". Loop transfer recovery buys some of it back by deliberately detuning the filter.',
        b: 1.6,
        bloom: 'analyze',
      },
      {
        id: 'q_m29_tighter',
        q: 'You need tighter pointing without buying more actuator authority. Which weight do you change?',
        choices: [
          'Increase R, which increases bandwidth',
          'Increase Q on the pointing states (or equivalently decrease R), which raises the gain and bandwidth — but it buys the pointing with more control effort, more noise amplification and less robustness, so with a fixed authority budget you are trading margin, not getting something free',
          'Decrease Q on the pointing states',
          'Change Qf only; Q and R do not affect steady-state pointing',
        ],
        answer: 1,
        explain:
          'Only the ratio Q/R matters for the gain, so increasing the pointing entries of Q and decreasing R are the same move. The trap in the question is "without more control authority": the LQR frontier is a genuine trade curve, so tighter pointing at the same peak effort is only possible by re-shaping Q across states (spending effort where it buys the most pointing) or by improving the plant or sensors. Answering that you simply raise Q, with no mention of the cost, is the wrong answer in an interview.',
        b: 1.1,
        bloom: 'analyze',
      },
      {
        id: 'q_m29_tvlqr',
        q: 'What does TVLQR give you on an ascent trajectory that a fixed gain does not?',
        choices: [
          'Nothing; a fixed gain is equivalent if tuned at the midpoint',
          'A gain schedule matched to the plant as it actually varies — mass drops by most of the liftoff value, dynamic pressure rises and falls, and the control effectiveness of the gimbal changes by an order of magnitude; TVLQR also gives a Riccati-based certificate of stabilization around the nominal and a natural basis for a funnel / region-of-attraction argument',
          'Guaranteed global stability of the nonlinear system',
          'Lower computational cost onboard',
        ],
        answer: 1,
        explain:
          'A launch vehicle is a strongly time-varying plant: mass, inertia, centre of gravity, aerodynamic moment and thrust all change through the burn. A midpoint gain is too sluggish early and too aggressive late. TVLQR solves the differential Riccati equation backwards along the nominal, producing K(t) matched to A(t), B(t), and it is computed offline so the onboard cost is a table lookup. The cost-to-go x.T*P(t)*x also serves as a Lyapunov-like certificate for finite-time invariant funnels around the nominal.',
        b: 1.2,
        bloom: 'understand',
      },
      {
        id: 'q_m29_bryson',
        q: 'What is the Bryson rule for initialising Q and R?',
        choices: [
          'Set Q = I and R = I always',
          'Set the diagonal entries to the reciprocal of the square of the maximum acceptable value for each state and each input, which non-dimensionalises the problem so every term of the cost is order one at its limit',
          'Set Q proportional to A and R proportional to B',
          'Set R = inv(Q)',
        ],
        answer: 1,
        explain:
          'Q_ii = 1 / (x_i,max)^2 and R_jj = 1 / (u_j,max)^2. The point is scaling, not optimality: a state measured in metres and one measured in radians are otherwise incomparable, and an unscaled Q makes the tuning loop meaningless. Bryson rule gives a defensible starting point from requirements you already have (pointing spec, gimbal limit), after which you iterate on the frontier.',
        b: 0.6,
        bloom: 'recall',
      },
    ],
    cards: [
      {
        id: 'c_m29_cost',
        front: 'The LQR cost functional',
        back: 'J = integral of (x.T*Q*x + u.T*R*u) dt, with Q positive semi-definite and R positive definite. Finite horizon adds a terminal term x(tf).T*Qf*x(tf).',
        formula: true,
      },
      {
        id: 'c_m29_care',
        front: 'Continuous algebraic Riccati equation (CARE)',
        back: 'A.T*P + P*A - P*B*inv(R)*B.T*P + Q = 0. Solve for the unique symmetric positive definite P that stabilizes the closed loop.',
        formula: true,
      },
      {
        id: 'c_m29_gain',
        front: 'LQR gain',
        back: 'K = inv(R)*B.T*P, with control u = -K*x. Closed loop is A - B*K.',
        formula: true,
      },
      {
        id: 'c_m29_costtogo',
        front: 'What P means',
        back: 'V(x) = x.T*P*x is the optimal cost-to-go from state x. It is also a valid Lyapunov function for the closed loop, which is how TVLQR funnels are built.',
        formula: true,
      },
      {
        id: 'c_m29_dre',
        front: 'Differential Riccati equation',
        back: '-Pdot = A.T*P + P*A - P*B*inv(R)*B.T*P + Q, integrated BACKWARD from P(tf) = Qf. Steady state as the horizon grows is the CARE solution.',
        formula: true,
      },
      {
        id: 'c_m29_dare',
        front: 'Discrete algebraic Riccati equation',
        back: 'P = A.T*P*A - A.T*P*B*inv(R + B.T*P*B)*B.T*P*A + Q, with K = inv(R + B.T*P*B)*B.T*P*A. Note the gain is NOT simply inv(R)*B.T*P.',
        formula: true,
      },
      {
        id: 'c_m29_margins',
        front: 'LQR guaranteed margins',
        back: 'Loop broken at the plant input: gain margin from -6 dB to +infinity, phase margin at least 60 degrees. It follows from the return difference identity |1 + L(jw)| >= 1.',
        formula: true,
      },
      {
        id: 'c_m29_doyle',
        front: 'Guaranteed margins for LQG regulators',
        back: 'There are none. Doyle, IEEE TAC 1978. The observer destroys the LQR return-difference identity, so LQG margins can be made arbitrarily small. Always check LQG margins explicitly.',
      },
      {
        id: 'c_m29_bryson',
        front: 'Bryson rule',
        back: 'Q_ii = 1/(max acceptable x_i)^2, R_jj = 1/(max acceptable u_j)^2. A scaling heuristic to start tuning from requirements, not an optimality claim.',
        formula: true,
      },
      {
        id: 'c_m29_ratio',
        front: 'What actually matters in Q and R',
        back: 'Only the ratio. Scaling Q and R by the same positive constant leaves K unchanged, since P scales identically. Fix R = I and tune Q, or vice versa.',
      },
      {
        id: 'c_m29_cheap',
        front: 'Cheap control limit',
        back: 'As R goes to 0, the minimum-phase closed-loop poles run to infinity along a Butterworth pattern while poles mirror any right-half-plane zeros. A non-minimum-phase plant therefore has a hard performance ceiling no matter how cheap control is.',
      },
      {
        id: 'c_m29_lqg',
        front: 'LQG structure',
        back: 'LQG = LQR state feedback on the Kalman filter estimate. The stochastic separation theorem says the two designs are individually optimal, which is true for the cost and false for the margins.',
      },
      {
        id: 'c_m29_ltr',
        front: 'Loop transfer recovery',
        back: 'Deliberately inflate the assumed process noise (Q_filter = Q0 + q*B*B.T, q large) so the Kalman loop shape approaches the LQR loop shape and the margins come back. The cost is a noisier, more aggressive estimator.',
        formula: true,
      },
      {
        id: 'c_m29_pmp',
        front: 'Pontryagin minimum principle (the frame LQR sits in)',
        back: 'With H = L(x,u) + lambda.T*f(x,u): xdot = dH/dlambda, lambdadot = -dH/dx, and u* minimises H pointwise over the admissible set. LQR is the case where that minimisation is a solvable quadratic.',
        formula: true,
      },
      {
        id: 'c_m29_ilqr',
        front: 'iLQR / DDP in one line',
        back: 'Linearise the dynamics and quadratize the cost about the current trajectory, solve the resulting time-varying LQR backward pass for a feedforward plus feedback update, roll forward with line search, repeat. It is Newton method on a trajectory.',
      },
    ],
    tags: ['interview'],
    importance: 1.5,
  },

  {
    id: 't3_m30_robust_control',
    track: 'gnc',
    tier: 3,
    title: 'Robust & Multivariable Control',
    summary:
      'Build an honest uncertainty model, test robust stability with the small gain theorem, and synthesize an H-infinity controller against mixed-sensitivity weights. You will be able to explain, with a concrete counterexample, why a per-axis 6 dB / 60 degree margin claim means very little on a coupled three-axis vehicle.',
    prereqs: ['t3_m29_optimal_control_lqr'],
    hours: 55,
    topics: [
      'Modelling uncertainty: additive, multiplicative (input and output), parametric, unstructured',
      'The small gain theorem and its exact hypotheses',
      'The H2 and H-infinity norms and what each one measures',
      'H-infinity synthesis: mixed sensitivity S/KS/T weighting, the two-Riccati (DGKF) solution',
      'The structured singular value mu and mu-synthesis by D-K iteration',
      'Robust stability vs robust performance',
      'Singular values of MIMO transfer matrices and input/output directionality',
      'MIMO stability margins, disk margins, and why per-loop SISO margins mislead',
      'Performance limitations imposed by right-half-plane poles and zeros',
      'Linear parameter-varying control and gain scheduling with guarantees',
      'Adaptive control (MRAC, L1 adaptive) and its use and abuse in aerospace',
      'Flight qualification metrics: stability margin requirements across the envelope, discrete-time mu analysis, handling-qualities criteria',
    ],
    objectives: [
      'Build an uncertainty weight from real hardware tolerances and test robust stability with the small gain theorem',
      'Synthesize an H-infinity controller from mixed-sensitivity weights and interpret the achieved gamma',
      'Compute and interpret mu for a structured uncertainty set',
      'Explain why SISO margins per axis are insufficient for a coupled MIMO attitude loop, and compute a disk margin instead',
    ],
    resources: [
      {
        title: 'Multivariable Feedback Control: Analysis and Design (2nd ed.)',
        author: 'Skogestad & Postlethwaite',
        kind: 'book',
        url: 'https://skoge.folk.ntnu.no/book/',
        free: false,
        note: 'The standard reference. Supplementary material and errata on the author NTNU page.',
      },
      { title: 'Robust and Optimal Control', author: 'Zhou, Doyle & Glover', kind: 'book', free: false },
      { title: 'Essentials of Robust Control', author: 'Zhou & Doyle', kind: 'book', free: false },
      {
        title: 'Control Bootcamp — robust control episodes',
        author: 'Steve Brunton',
        kind: 'video',
        url: 'https://www.youtube.com/playlist?list=PLMrJAkhIeNNR20Mz-VpzgfQs5zrYi085m',
        free: true,
      },
      {
        title: 'MATLAB Robust Control Toolbox documentation, including diskmargin',
        kind: 'docs',
        free: true,
        note: 'The concepts transfer even if you never run the toolbox.',
      },
    ],
    exercises: [
      {
        id: 'ex_m30_uncertainty',
        title: 'Turn hardware tolerances into an uncertainty weight',
        kind: 'code',
        lang: 'python',
        hours: 6,
        prompt: `Your actuator has +/-20% gain uncertainty and an unknown delay between 0 and 10 ms.

1. Sample the uncertainty set on a grid, compute the relative error (G_p - G)/G at each frequency, and take the upper envelope.
2. Fit a stable, minimum-phase first- or second-order weight W(s) that covers the envelope.
3. Test robust stability with the small gain theorem: is ||W*T||inf < 1 for your PID from the classical module?
4. If not, retune until it is, and report what you gave up.

Success: the weight covers the sampled envelope everywhere, and your robust-stability conclusion is confirmed by directly checking the worst sampled plant.`,
        starter: `import numpy as np


def multiplicative_error(w, gain_grid, delay_grid):
    """Upper envelope of |(G_p(jw) - G(jw)) / G(jw)| over the uncertainty grid.

    The nominal actuator is G(s) = 1 with unity gain and no delay, so the
    perturbed actuator is G_p(s) = k * exp(-s*tau).
    Returns an array the same shape as w.
    """
    raise NotImplementedError


def hinf_norm(mag):
    """Peak of a magnitude response on a frequency grid (the H-infinity norm)."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'a pure 20% gain error gives a 0.2 envelope at DC',
            assert: `import numpy as np
w = np.array([1e-4])
env = multiplicative_error(w, np.array([0.8, 1.0, 1.2]), np.array([0.0]))
assert abs(env[0] - 0.2) < 1e-6, "at DC with no delay the relative error is just the gain error"`,
          },
          {
            name: 'delay uncertainty makes the envelope reach 2 at high frequency',
            assert: `import numpy as np
w = np.logspace(-2, 4, 400)
env = multiplicative_error(w, np.array([1.0]), np.linspace(0.0, 0.01, 21))
assert env[-1] > 1.9, "|exp(-jwT) - 1| saturates at 2, so the envelope must approach 2"
assert np.all(np.diff(env) > -1e-9), "the envelope of a delay set should be non-decreasing in w"`,
          },
          {
            name: 'small gain test is a peak test',
            assert: `import numpy as np
mag = np.array([0.1, 0.4, 0.95, 0.3])
assert abs(hinf_norm(mag) - 0.95) < 1e-12, "the H-infinity norm is the peak over frequency"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m30_hinf',
        title: 'Mixed-sensitivity H-infinity for a flexible spacecraft',
        kind: 'analysis',
        hours: 10,
        prompt: `Take the flexible spacecraft model (rigid mode plus two lightly damped bending modes).

1. Choose weights: W1 on S for low-frequency tracking, W2 on K*S to bound actuator effort, W3 on T to roll off above the first bending mode.
2. Synthesize an H-infinity controller and record the achieved gamma.
3. Compare against an LQG design with comparable bandwidth: plot S, T, K*S for both, and compute disk margins for both.
4. Write a paragraph on what the weights bought and what the higher controller order costs you in flight software.

Success: gamma near or below 1, a like-for-like comparison, and a clear statement of the LQG margin deficit.`,
      },
      {
        id: 'ex_m30_diskmargin',
        title: 'Disk margins for a coupled 3-axis loop',
        kind: 'code',
        lang: 'python',
        hours: 5,
        prompt: `Build a 3-axis attitude model with 15% cross-axis coupling (products of inertia) and close a per-axis PID designed as if the axes were independent.

1. Report per-axis SISO gain and phase margins.
2. Now apply simultaneous, independent gain and phase perturbations at all three inputs and find the smallest perturbation that destabilizes the loop.
3. Compare to the SISO margin claim.

Success: you demonstrate a concrete case with good per-axis margins and a small simultaneous-perturbation margin, and you can state what a disk margin measures.`,
        starter: `"""Per-axis margins lie when the axes are coupled.

Classical gain and phase margins are computed one loop at a time with the
others nominal. A disk margin perturbs gain AND phase together, at every input
simultaneously, which is much closer to what an unmodelled cross-coupling
actually does to you.
"""

import numpy as np

J = np.array([[120.0, 18.0, 12.0],      # 15% products of inertia
              [18.0, 100.0, 9.0],
              [12.0, 9.0, 140.0]])


def siso_margins(k_p: float, k_d: float, J_axis: float):
    """Gain and phase margin of one axis treated as independent.

    The open loop is L(s) = (k_d s + k_p) / (J s^2), which never crosses -180
    degrees, so the gain margin is infinite and only the phase margin bites.

    TODO: find the gain crossover where |L(jw)| = 1, then
    PM = 180 + angle(L(jw_gc)) in degrees.
    """
    raise NotImplementedError


def delay_margin(pm_deg: float, w_gc: float) -> float:
    """How much pure transport delay that phase margin will tolerate.

    TODO: tau = PM in radians / w_gc. This is the number that actually gets
    eaten by sensor filtering and computation, and it is the one people forget
    to check.
    """
    raise NotImplementedError


def worst_case_gain(J_mat: np.ndarray) -> float:
    """Ratio of largest to smallest principal inertia — how badly a per-axis
    design can be off once the axes are coupled."""
    e = np.linalg.eigvalsh(J_mat)
    return float(e.max() / e.min())


if __name__ == "__main__":
    pm, wgc = siso_margins(40.0, 90.0, 120.0)
    print(f"per-axis PM={pm:.1f} deg at w_gc={wgc:.3f} rad/s")
    print(f"delay margin = {delay_margin(pm, wgc)*1000:.1f} ms")
    print(f"coupled inertia spread = {worst_case_gain(J):.3f}x")
`,
        tests: [
          {
            name: 'the phase margin of a PD loop on a double integrator is what the algebra says',
            assert: `pm, wgc = siso_margins(40.0, 90.0, 120.0)
# |L(jw)| = 1  =>  sqrt(kp^2 + (kd w)^2) = J w^2
kp, kd, Jx = 40.0, 90.0, 120.0
assert abs(np.hypot(kp, kd*wgc) - Jx*wgc**2) < 1e-6*Jx*wgc**2, 'not the gain crossover'
expect = np.degrees(np.arctan2(kd*wgc, kp))
assert abs(pm - expect) < 1e-6, f'PM {pm} vs {expect}'`,
          },
          {
            name: 'delay margin is phase margin over crossover frequency',
            assert: `pm, wgc = siso_margins(40.0, 90.0, 120.0)
assert abs(delay_margin(pm, wgc) - np.deg2rad(pm)/wgc) < 1e-12`,
          },
          {
            name: 'more derivative gain buys phase margin',
            assert: `pm_low, _ = siso_margins(40.0, 40.0, 120.0)
pm_high, _ = siso_margins(40.0, 160.0, 120.0)
assert pm_high > pm_low`,
          },
          {
            name: 'the coupled inertia spread is above one and symmetric-safe',
            assert: `s = worst_case_gain(J)
assert 1.0 < s < 2.0 and np.isfinite(s)
# The ratio is not the point; what it does to your margin is. A per-axis design
# sized for J_axis can be presented with up to s times that, and the crossover,
# with the phase margin riding on it, moves down.
pm_nom, w_nom = siso_margins(40.0, 90.0, 120.0)
pm_hi, w_hi = siso_margins(40.0, 90.0, 120.0 * s)
assert w_hi < w_nom, 'a heavier effective axis crosses over lower'
assert pm_hi < pm_nom, 'and on this loop a lower crossover means less phase margin'`,
            hidden: true,
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q_m30_smallgain',
        q: 'State the small gain theorem and apply it to a multiplicative uncertainty weight W.',
        choices: [
          'If the loop gain is below 1 at DC the loop is stable',
          'For a feedback interconnection of two stable systems M and Delta, the loop is stable for all ||Delta||inf <= 1 if ||M||inf < 1. With output multiplicative uncertainty G_p = (I + W*Delta)*G, M = W*T, so robust stability requires ||W*T||inf < 1',
          'If the plant and controller are both stable the closed loop is stable',
          'The product of gain margin and phase margin must exceed one',
        ],
        answer: 1,
        explain:
          'The theorem requires both blocks stable and applies to the interconnection seen by the uncertainty. Pulling Delta out of the loop for output multiplicative uncertainty leaves M = W*T, so the test is sup over w of |W(jw)*T(jw)| < 1. Note the consequence: where the uncertainty is large (high frequency, typically), T must be small, which is exactly why you roll off. For input multiplicative uncertainty the relevant map is the input complementary sensitivity, which on a MIMO plant is a different matrix.',
        b: 1.3,
        bloom: 'apply',
      },
      {
        id: 'q_m30_margins_lie',
        q: 'Your loop shows 8 dB gain margin and 55 degrees phase margin on every axis, and it goes unstable in flight. Give the most likely explanations.',
        choices: [
          'The margins were computed incorrectly; recompute them',
          'Cross-axis coupling means per-axis margins do not bound simultaneous perturbations (use a disk or MIMO margin); the margins were computed at a single frozen flight condition and not across the envelope; and nonlinearity — saturation, rate limits, slosh, or a structural mode whose frequency moved with propellant load — invalidates the linear analysis entirely',
          'The vehicle had a hardware failure; the control design was fine',
          'The sample rate was too high',
        ],
        answer: 1,
        explain:
          'All three are routine findings in flight anomaly reports. Classical margins perturb one loop at a time at one operating point on a linear model. Real vehicles perturb everything at once, traverse an envelope, and are nonlinear once an actuator rate-limits. The practical antidotes are disk margins or mu for simultaneous MIMO perturbation, frozen-time margin plots swept across the whole trajectory, and Monte Carlo on the nonlinear six-degree-of-freedom sim, which is exactly why the V&V module exists.',
        b: 1.5,
        bloom: 'analyze',
      },
      {
        id: 'q_m30_mu',
        q: 'What does mu > 1 mean?',
        choices: [
          'The nominal closed loop is unstable',
          'There exists an admissible perturbation in the structured uncertainty set, of size less than the normalisation bound, that destabilizes the loop — so robust stability fails for that uncertainty structure',
          'The controller has too much gain at DC',
          'The H-infinity norm of the plant exceeds 1',
        ],
        answer: 1,
        explain:
          'mu(M) is the reciprocal of the size of the smallest structured Delta that makes I - M*Delta singular. Normalising the uncertainty set to ||Delta|| <= 1, robust stability holds iff the peak of mu over frequency is below 1, and mu > 1 exhibits a destabilizing perturbation strictly inside the modelled set. Because mu accounts for the block structure it is never more conservative than the unstructured small gain test, and is often much less conservative. mu is NP-hard to compute exactly, so tools report upper and lower bounds.',
        b: 1.7,
        bloom: 'understand',
      },
      {
        id: 'q_m30_diskmargin',
        q: 'What is a disk margin and why has it become the dominant aerospace practice?',
        choices: [
          'The radius of the Nyquist plot at crossover',
          'The largest disk of simultaneous gain and phase variation, applied at one or all loop-breaking points at once, for which the closed loop remains stable — it is a single number that covers combined gain-and-phase perturbation and extends naturally to MIMO, where classical one-at-a-time margins do not',
          'A frequency-domain plot of gain margin against phase margin',
          'The minimum singular value of the plant',
        ],
        answer: 1,
        explain:
          'A disk margin models the perturbation as a complex multiplicative factor confined to a disk in the complex plane, so it captures gain and phase varying together rather than one at a time. It is computed from ||S + T/2||inf style formulations and reports equivalent gain and phase ranges. For MIMO it comes in loop-at-a-time and multi-loop flavours, the latter perturbing every channel independently and simultaneously — the case that classical per-axis margins silently ignore, and the case that actually happens on a vehicle.',
        b: 1.4,
        bloom: 'understand',
      },
      {
        id: 'q_m30_rhp',
        q: 'A plant has an unstable pole at p = 2 and a right-half-plane zero at z = 6. What does that imply?',
        choices: [
          'The plant cannot be stabilized at all',
          'It is stabilizable but the ratio z/p = 3 is uncomfortably small: a RHP zero must be above the RHP pole for a reasonable design, the sensitivity peak is bounded below by a function that blows up as z approaches p, and bandwidth is squeezed between roughly 2p and z/2',
          'The zero cancels the pole so the plant behaves as first order',
          'Only the pole matters; RHP zeros are irrelevant for unstable plants',
        ],
        answer: 1,
        explain:
          'An unstable pole forces a lower bound on bandwidth (you must act faster than the divergence), while a RHP zero forces an upper bound. The interpolation constraints S(z) = 1 and T(p) = 1 combine into the bound ||S||inf >= |z + p| / |z - p|, here 8/4 = 2, so a sensitivity peak of at least 6 dB is unavoidable. Designs with z/p below about 4 are considered very hard; z < p is effectively impossible. This is a real design driver for aerodynamically unstable launch vehicles with sensor placement issues.',
        b: 2.0,
        bloom: 'analyze',
      },
    ],
    cards: [
      {
        id: 'c_m30_smallgain',
        front: 'Small gain theorem',
        back: 'If M and Delta are stable and ||M||inf * ||Delta||inf < 1, the feedback interconnection is stable. It is sufficient, not necessary, and it is conservative because it ignores phase and structure.',
        formula: true,
      },
      {
        id: 'c_m30_rs_test',
        front: 'Robust stability test for output multiplicative uncertainty',
        back: 'G_p = (I + W*Delta)*G with ||Delta||inf <= 1 is robustly stabilized iff ||W*T||inf < 1. Where uncertainty is large, T must be small.',
        formula: true,
      },
      {
        id: 'c_m30_hinf_norm',
        front: 'H-infinity norm',
        back: 'For a SISO system, the peak of |G(jw)| over frequency. For MIMO, the peak of the largest singular value sigma_max(G(jw)). It is the worst-case energy gain from input to output.',
        formula: true,
      },
      {
        id: 'c_m30_h2_norm',
        front: 'H2 norm',
        back: 'The root-mean-square output for unit-intensity white noise input; equivalently the square root of the integral of trace(G*(jw)G(jw)) dw / (2*pi). LQG minimises an H2 norm.',
        formula: true,
      },
      {
        id: 'c_m30_mixsens',
        front: 'Mixed-sensitivity H-infinity problem',
        back: 'Minimise the H-infinity norm of the stacked [W1*S; W2*K*S; W3*T]. W1 shapes tracking and disturbance rejection, W2 bounds actuator effort, W3 forces roll-off and robustness.',
        formula: true,
      },
      {
        id: 'c_m30_gamma',
        front: 'What gamma tells you',
        back: 'The achieved H-infinity norm. gamma <= 1 means every weighted specification is met simultaneously. gamma of 2 means you are a factor of two short somewhere — look at which channel peaks.',
      },
      {
        id: 'c_m30_mu',
        front: 'Structured singular value mu',
        back: 'mu(M) = 1 / min{ sigma_max(Delta) : Delta in the allowed structure, det(I - M*Delta) = 0 }. Robust stability iff peak mu < 1. NP-hard; tools give upper and lower bounds.',
        formula: true,
      },
      {
        id: 'c_m30_dk',
        front: 'D-K iteration',
        back: 'Alternate: (K step) H-infinity synthesis with current scalings D; (D step) fit frequency-varying D to reduce the mu upper bound. Not guaranteed to converge to a global optimum, but it is the workhorse of mu-synthesis.',
      },
      {
        id: 'c_m30_rp',
        front: 'Robust stability vs robust performance',
        back: 'RS: stable for every plant in the set. RP: the performance specification is met for every plant in the set. RP is an RS test on an augmented system with a fictitious performance block, so it is strictly harder.',
      },
      {
        id: 'c_m30_directionality',
        front: 'MIMO directionality',
        back: 'A MIMO plant has a different gain in every input direction, spanned by sigma_min to sigma_max. The condition number sigma_max/sigma_min warns of an ill-conditioned plant where one input direction is nearly ineffective.',
        formula: true,
      },
      {
        id: 'c_m30_diskmargin',
        front: 'Disk margin',
        back: 'The largest disk of simultaneous complex gain-and-phase perturbation tolerable at a loop-breaking point. Reported as an equivalent gain range and phase range. The multi-loop version perturbs all channels at once — the honest MIMO number.',
      },
      {
        id: 'c_m30_interp',
        front: 'Interpolation constraints from RHP poles and zeros',
        back: 'S(z) = 1 at every RHP zero z, T(p) = 1 at every RHP pole p. These force ||S||inf >= |z + p| / |z - p| when both are present. They are structural: no controller escapes them.',
        formula: true,
      },
      {
        id: 'c_m30_lpv',
        front: 'LPV control vs ad hoc gain scheduling',
        back: 'Classic gain scheduling interpolates point designs and proves nothing about the transitions. LPV synthesis designs a single parameter-dependent controller with a stability guarantee over the whole parameter trajectory, usually bounded by a parameter rate limit.',
      },
      {
        id: 'c_m30_adaptive',
        front: 'Why adaptive control is treated with suspicion in flight programs',
        back: 'MRAC can lose robustness to unmodelled dynamics and time delay, and its transient behaviour is hard to certify. L1 adaptive control decouples adaptation rate from robustness with a low-pass filter, which is why it is the variant that actually gets flown.',
      },
    ],
    tags: ['interview'],
    importance: 1.2,
  },

  {
    id: 't3_m31_nonlinear_control',
    track: 'gnc',
    tier: 3,
    title: 'Nonlinear Control',
    summary:
      'Prove closed-loop stability rather than assume it: construct a Lyapunov function for a quaternion attitude tracking law, estimate a region of attraction, and design a sliding-mode controller you can actually fly. You will also be able to diagnose and fix quaternion unwinding in one line of code.',
    prereqs: ['t3_m28_state_space', 't1_m17_attitude_kinematics'],
    hours: 65,
    topics: [
      'Nonlinear phenomena: multiple equilibria, limit cycles, finite escape time, bifurcation',
      'Phase-plane analysis and equilibrium classification',
      'Linearization and the Lyapunov indirect method, including its failure cases',
      'The Lyapunov direct method, Lyapunov functions, LaSalle invariance principle',
      'Region of attraction estimation, including sum-of-squares approaches',
      'Input-to-state stability',
      'Feedback linearization (input-state and input-output), relative degree, internal and zero dynamics',
      'Sliding mode control: sliding surface design, reaching phase, chattering, boundary layers, higher-order sliding modes',
      'Backstepping',
      'Passivity-based control and energy shaping',
      'Nonlinear spacecraft attitude control: quaternion feedback laws, the unwinding problem, MRP-based control, Lyapunov-derived tracking laws with proof',
      'Describing functions for limit-cycle prediction',
      'Control of underactuated systems',
      'Bang-bang and on-off thruster control: Schmitt trigger and pulse-width pulse-frequency modulation',
    ],
    objectives: [
      'Construct a Lyapunov function and prove closed-loop stability for a spacecraft attitude tracking law',
      'Design a sliding mode controller and mitigate chattering with a quantified residual error',
      'Explain and fix quaternion unwinding',
      'Give a concrete case where linearization says stable and the nonlinear system is not',
    ],
    resources: [
      {
        title: 'Nonlinear Systems (3rd ed.)',
        author: 'Hassan Khalil',
        kind: 'book',
        free: false,
        note: 'The standard graduate text. Lecture videos are available free online.',
      },
      {
        title: 'Applied Nonlinear Control',
        author: 'Slotine & Li',
        kind: 'book',
        free: false,
        note: 'More applied and far more readable: phase plane, Lyapunov, describing functions, feedback linearization, sliding control, adaptive control.',
      },
      {
        title: 'Analytical Mechanics of Space Systems, Ch. 8',
        author: 'Schaub & Junkins',
        kind: 'book',
        free: false,
        note: 'Nonlinear spacecraft control with complete Lyapunov proofs.',
      },
      {
        title: 'Control of Nonlinear Spacecraft Attitude Motion (Coursera, CU Boulder)',
        author: 'Hanspeter Schaub',
        kind: 'course',
        free: true,
      },
      {
        title: 'Underactuated Robotics',
        author: 'Russ Tedrake',
        kind: 'course',
        url: 'https://underactuated.csail.mit.edu',
        free: true,
        note: 'Lyapunov analysis and region of attraction via sum-of-squares.',
      },
    ],
    exercises: [
      {
        id: 'ex_m31_lyapunov_proof',
        title: 'Prove the quaternion feedback law stable',
        kind: 'derivation',
        hours: 8,
        prompt: `For a rigid body with J*wdot = -w x (J*w) + u and quaternion kinematics, take the control law

u = -K*q_v - P*w

with K and P positive definite.

1. Propose the candidate V = 0.5*w.T*J*w + 2*K*(1 - q_0) (or the general gain-weighted form).
2. Differentiate along the closed-loop trajectories, using the quaternion kinematic equation and the fact that w.T*(w x J*w) = 0.
3. Show Vdot = -w.T*P*w <= 0.
4. Apply LaSalle to conclude asymptotic stability, and identify the full equilibrium set on the quaternion manifold.

Success: a complete, correct proof, plus a clear statement of WHICH equilibrium your proof actually certifies and what that implies about unwinding.`,
      },
      {
        id: 'ex_m31_unwinding',
        title: 'Reproduce quaternion unwinding, then fix it',
        kind: 'code',
        lang: 'python',
        hours: 5,
        prompt: `Simulate the closed loop above from an initial attitude error of 179 degrees.

1. Use the sign-blind law u = -K*q_v - P*w and show the vehicle sometimes rotates nearly 360 degrees to reach an attitude it was already 1 degree away from.
2. Add the standard fix: multiply the vector part by sign(q_0) (equivalently, always work with the quaternion in the half where q_0 >= 0).
3. Plot the total rotation angle travelled with and without the fix over 200 random initial attitudes.

Success: mean path length drops sharply with the fix, and you can state why the double cover of SO(3) by the unit quaternions causes this and why no continuous state-feedback law on SO(3) can be globally asymptotically stabilizing.`,
        starter: `import numpy as np


def quat_mult(a, b):
    """Hamilton product, scalar-first convention [w, x, y, z]."""
    raise NotImplementedError


def control(q_err, w, K, P, fix_unwinding=True):
    """u = -K * sign(q0) * q_v - P * w  (sign term omitted if fix_unwinding is False)."""
    raise NotImplementedError


def simulate(q0, w0, J, K, P, dt=0.01, T=60.0, fix_unwinding=True):
    """Closed-loop rigid-body attitude simulation. Returns (t, quats, omegas, path_angle)."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'the sign fix never commands the long way round',
            assert: `import numpy as np
J = np.diag([120.0, 100.0, 80.0])
K = 20.0 * np.eye(3)
P = 80.0 * np.eye(3)
# an attitude error of 179 degrees about x, with the quaternion written in the
# negative-scalar half of the double cover
ang = np.radians(179.0)
q0 = -np.array([np.cos(ang / 2), np.sin(ang / 2), 0.0, 0.0])
_, _, _, path_fixed = simulate(q0, np.zeros(3), J, K, P, fix_unwinding=True)
_, _, _, path_naive = simulate(q0, np.zeros(3), J, K, P, fix_unwinding=False)
assert path_fixed < np.radians(200.0), "with the sign fix the vehicle should take the short way"
assert path_naive > path_fixed + np.radians(100.0), "the naive law should unwind the long way"`,
          },
          {
            name: 'quaternion stays unit norm',
            assert: `import numpy as np
J = np.diag([120.0, 100.0, 80.0])
_, q, _, _ = simulate(np.array([0.0, 1.0, 0.0, 0.0]), np.array([0.02, -0.01, 0.03]), J, 20 * np.eye(3), 80 * np.eye(3))
n = np.linalg.norm(q, axis=1)
assert np.max(np.abs(n - 1.0)) < 1e-6, "renormalise the quaternion each step"`,
          },
        ],
      },
      {
        id: 'ex_m31_smc',
        title: 'Sliding mode attitude control, chattering, and the boundary layer',
        kind: 'code',
        lang: 'python',
        hours: 7,
        prompt: `Design a sliding mode attitude controller with surface s = w + Lambda*q_v.

1. Implement the discontinuous law with the sign function and show chattering: plot the control at 500 Hz and count sign reversals per second. Include a 5 ms actuator lag.
2. Replace sign(s) with sat(s/phi) for a boundary layer of thickness phi and sweep phi.
3. Plot steady-state pointing error and control reversals against phi and find the knee.

Success: you quantify the trade — the boundary layer removes chattering but replaces asymptotic stability with ultimate boundedness, and you can state the resulting error bound in terms of phi and Lambda.`,
        starter: `"""Sliding mode attitude control and the boundary layer trade.

sign(s) gives you asymptotic convergence and chattering you cannot fly.
sat(s/phi) gives you a clean actuator and ultimate boundedness instead. The
exercise is to put a number on the exchange rate.
"""

import numpy as np

J = 120.0
LAMBDA = 0.8            # slope of the sliding surface
ETA = 0.5               # reaching-law gain


def sat(x: float, phi: float) -> float:
    """Saturation: x/phi clipped to [-1, 1]. With phi -> 0 this becomes sign.

    TODO: one line. Guard phi <= 0 by falling back to sign.
    """
    raise NotImplementedError


def surface(q_v: float, w: float) -> float:
    """Sliding surface s = w + LAMBDA * q_v.

    TODO: one line.
    """
    raise NotImplementedError


def control(q_v: float, w: float, phi: float) -> float:
    """u = -J * (LAMBDA * w + ETA * sat(s / phi) ... )

    TODO: cancel the known dynamics, then add the switching term
    -J * ETA * sat(surface / phi). The LAMBDA * w term is what keeps you on
    the surface once you reach it.
    """
    raise NotImplementedError


def ultimate_bound(phi: float) -> float:
    """Steady-state |q_v| you are left with for a given boundary layer.

    TODO: inside the layer the surface obeys s = w + LAMBDA q_v with
    |s| <= phi, so the attitude error settles to phi / LAMBDA.
    """
    raise NotImplementedError


if __name__ == "__main__":
    for phi in (0.0, 0.01, 0.05, 0.2):
        print(f"phi={phi:5.3f}  ultimate |q_v| = {ultimate_bound(phi) if phi else 0.0:.5f}")
`,
        tests: [
          {
            name: 'sat clips to the unit interval and is linear inside the layer',
            assert: `assert abs(sat(0.5, 1.0) - 0.5) < 1e-12
assert abs(sat(5.0, 1.0) - 1.0) < 1e-12
assert abs(sat(-5.0, 1.0) + 1.0) < 1e-12
assert abs(sat(0.02, 0.1) - 0.2) < 1e-12`,
          },
          {
            name: 'a vanishing boundary layer recovers the sign function',
            assert: `assert abs(sat(1e-9, 1e-12) - 1.0) < 1e-12
assert abs(sat(-1e-9, 1e-12) + 1.0) < 1e-12`,
          },
          {
            name: 'the sliding surface is zero exactly on the designed line',
            assert: `assert abs(surface(0.0, 0.0)) < 1e-12
assert abs(surface(1.0, -LAMBDA)) < 1e-12
assert abs(surface(0.1, 0.0) - LAMBDA*0.1) < 1e-12`,
          },
          {
            name: 'control pushes against the surface, never along it',
            assert: `assert control(0.2, 0.0, 0.01) < 0.0, 'positive error must command negative torque'
assert control(-0.2, 0.0, 0.01) > 0.0`,
          },
          {
            name: 'the ultimate bound is linear in the layer thickness',
            assert: `assert abs(ultimate_bound(0.05) - 0.05/LAMBDA) < 1e-12
assert abs(ultimate_bound(0.10)/ultimate_bound(0.05) - 2.0) < 1e-9`,
            hidden: true,
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q_m31_lyapunov',
        q: 'Which candidate proves asymptotic stability of u = -K*q_v - P*w for a rigid body?',
        choices: [
          'V = 0.5*w.T*w only',
          'V = 0.5*w.T*J*w + 2*K*(1 - q0), whose derivative along the closed loop is -w.T*P*w, made asymptotic by LaSalle',
          'V = q_v.T*q_v, whose derivative is negative definite directly',
          'No Lyapunov function exists for this law',
        ],
        answer: 1,
        explain:
          'The kinetic-energy term contributes w.T*J*wdot = w.T*(u - w x J*w) = w.T*u because w.T*(w x J*w) vanishes identically. The potential-like term 2*K*(1 - q0) differentiates to K*q_v.T*w using q0dot = -0.5*q_v.T*w. Summing, the q_v terms cancel against the -K*q_v part of the control and Vdot = -w.T*P*w, which is only negative SEMI-definite because it vanishes for all w = 0 regardless of attitude. LaSalle finishes the argument: on the set where Vdot = 0 the dynamics force q_v to zero as well.',
        b: 1.5,
        bloom: 'apply',
      },
      {
        id: 'q_m31_unwinding',
        q: 'What is quaternion unwinding and what is the one-line fix?',
        choices: [
          'Loss of quaternion normalisation from integration error; fix by renormalising',
          'The unit quaternions double cover SO(3), so q and -q are the same physical attitude. A law that drives q_v to zero without regard to the sign of q0 can choose the equilibrium at q = [+1,0,0,0] when the vehicle is already almost at [-1,0,0,0], commanding an unnecessary rotation of nearly 360 degrees. The fix is to multiply the feedback by sign(q0)',
          'Gimbal lock at 90 degrees of pitch; fix by switching to Euler angles',
          'An integrator wind-up specific to attitude loops; fix with anti-windup',
        ],
        answer: 1,
        explain:
          'Unwinding is a topological artifact, not a numerical one. Because the quaternion manifold is a double cover, a continuous feedback that stabilizes one of the two antipodal representations must destabilize the other, and a vehicle starting near the unstable one takes the long way. Using sign(q0)*q_v makes the control discontinuous on the measure-zero set q0 = 0, which resolves unwinding at the cost of that discontinuity — and a hysteresis band is the standard hardening. Note the deeper fact: no continuous time-invariant state feedback can globally asymptotically stabilize attitude on SO(3), because SO(3) is not contractible.',
        b: 1.4,
        bloom: 'understand',
      },
      {
        id: 'q_m31_chatter',
        q: 'Why does sliding mode control chatter, and what does a boundary layer cost?',
        choices: [
          'Chattering is caused by sensor noise only; the boundary layer costs nothing',
          'The ideal law switches infinitely fast on the surface, but finite sample rate, actuator lag and unmodelled dynamics turn that into a high-frequency limit cycle. A boundary layer replaces sign(s) with a saturation of width phi, removing chattering but replacing asymptotic convergence with ultimate boundedness proportional to phi',
          'Chattering comes from too small a switching gain; increase the gain to remove it',
          'The boundary layer makes the controller discontinuous, which causes chattering',
        ],
        answer: 1,
        explain:
          'Ideal sliding requires infinite switching bandwidth. Any real implementation has a sample period, an actuator with finite bandwidth, and unmodelled fast dynamics, so the trajectory crosses and re-crosses the surface at finite frequency — mechanically destructive and thermally expensive on valves and gimbals. The boundary layer is the standard mitigation: inside |s| < phi the control is continuous and the system is no longer driven onto the surface, so the tracking error converges to a set whose size scales with phi divided by the surface slope. Higher-order sliding modes such as super-twisting keep the robustness with a continuous control.',
        b: 1.3,
        bloom: 'understand',
      },
      {
        id: 'q_m31_linearization',
        q: 'Give a case where linearization predicts stability but the true nonlinear system is not stable in a useful sense.',
        choices: [
          'Linearization is always conclusive for smooth systems',
          'Any system whose linearization is stable but whose region of attraction is tiny — for instance a vehicle that is locally stable about hover yet diverges beyond a small attitude, or a loop that is locally stable but has a nearby unstable limit cycle. Linearization also says nothing when the Jacobian has eigenvalues exactly on the imaginary axis',
          'Only systems with time delay',
          'Only systems that are open-loop unstable',
        ],
        answer: 1,
        explain:
          'The Lyapunov indirect method is a purely local statement: a Hurwitz Jacobian buys asymptotic stability in SOME neighbourhood, with no claim about its size. A subcritical Hopf bifurcation produces exactly this — a stable equilibrium ringed by an unstable limit cycle, so any disturbance past that ring diverges. The marginal case, eigenvalues on the imaginary axis, is genuinely inconclusive: the nonlinear terms decide, as in xdot = -x^3 (stable) versus xdot = x^3 (finite escape time), whose linearizations are identical. This is why flight programs estimate regions of attraction rather than quoting local stability.',
        b: 1.6,
        bloom: 'analyze',
      },
      {
        id: 'q_m31_zero_dynamics',
        q: 'You feedback-linearize a plant input-output and the closed loop tracks perfectly in simulation, then the internal states diverge. What happened?',
        choices: [
          'The relative degree was computed incorrectly',
          'The plant has unstable zero dynamics — the internal dynamics rendered unobservable by the input-output linearization are unstable, which is the nonlinear analogue of cancelling a right-half-plane zero',
          'The controller gains were too small',
          'The integration step was too large',
        ],
        answer: 1,
        explain:
          'Input-output feedback linearization makes the map from the new input to the output a chain of integrators of length equal to the relative degree r. When r is less than the state dimension n, the remaining n - r states form the internal dynamics, whose zero-input behaviour is the zero dynamics. If those are unstable the plant is non-minimum phase and the design is unusable — exactly as pole-zero cancelling an unstable zero is in the linear case. The remedies are to choose a different output, accept approximate tracking, or use a method that does not require inverting the plant.',
        b: 1.8,
        bloom: 'analyze',
      },
    ],
    cards: [
      {
        id: 'c_m31_direct',
        front: 'Lyapunov direct method — the exact conditions',
        back: 'If V(0) = 0, V(x) > 0 for x nonzero (positive definite), and Vdot(x) <= 0 along trajectories, the origin is stable. If Vdot < 0 (negative definite) it is asymptotically stable. If in addition V is radially unbounded, it is globally asymptotically stable.',
        formula: true,
      },
      {
        id: 'c_m31_lasalle',
        front: 'LaSalle invariance principle',
        back: 'When Vdot <= 0 only (semi-definite), trajectories converge to the largest invariant set inside {x : Vdot(x) = 0}. This is how you finish attitude proofs where Vdot = -w.T*P*w vanishes for all attitudes at zero rate.',
      },
      {
        id: 'c_m31_indirect',
        front: 'Lyapunov indirect method and its limits',
        back: 'Jacobian Hurwitz implies local asymptotic stability; any eigenvalue with positive real part implies instability. Eigenvalues ON the imaginary axis are inconclusive. It never bounds the region of attraction.',
      },
      {
        id: 'c_m31_quat_law',
        front: 'The canonical quaternion attitude feedback law',
        back: 'u = -K*sign(q0)*q_v - P*w, with K, P positive definite. Proportional on the vector part of the error quaternion, derivative on body rate.',
        formula: true,
      },
      {
        id: 'c_m31_quat_lyap',
        front: 'Lyapunov function for the quaternion law',
        back: 'V = 0.5*w.T*J*w + 2*K*(1 - q0). Then Vdot = -w.T*P*w, negative semi-definite, and LaSalle gives asymptotic stability.',
        formula: true,
      },
      {
        id: 'c_m31_unwinding',
        front: 'Quaternion unwinding',
        back: 'q and -q are the same attitude (double cover of SO(3)). A sign-blind law can stabilize the far representation and rotate nearly 360 degrees unnecessarily. Fix: multiply the feedback by sign(q0), usually with hysteresis.',
      },
      {
        id: 'c_m31_topology',
        front: 'The topological obstruction on SO(3)',
        back: 'No continuous, time-invariant state feedback globally asymptotically stabilizes an attitude on SO(3), because SO(3) is not contractible. Global results require discontinuous or hybrid (hysteretic) control.',
      },
      {
        id: 'c_m31_smc_surface',
        front: 'Sliding surface and reaching condition',
        back: 'Choose s(x) = 0 so that the constrained motion is stable, e.g. s = w + Lambda*q_v. The reaching condition is 0.5 * d/dt (s.T*s) <= -eta*||s||, which guarantees the surface is reached in finite time.',
        formula: true,
      },
      {
        id: 'c_m31_boundary_layer',
        front: 'Boundary layer',
        back: 'Replace sign(s) by sat(s/phi). Chattering disappears; asymptotic stability is replaced by ultimate boundedness with error scaling like phi / Lambda. Higher-order (super-twisting) sliding modes keep robustness with a continuous control.',
        formula: true,
      },
      {
        id: 'c_m31_relative_degree',
        front: 'Relative degree',
        back: 'The number of times the output must be differentiated before the input appears explicitly. Feedback linearization gives a chain of r integrators; the remaining n - r states are the internal dynamics.',
      },
      {
        id: 'c_m31_zero_dynamics',
        front: 'Zero dynamics',
        back: 'The internal dynamics with the output held identically at zero. Unstable zero dynamics means non-minimum phase, and input-output feedback linearization is then unusable — the nonlinear version of cancelling an unstable zero.',
      },
      {
        id: 'c_m31_backstepping',
        front: 'Backstepping in one sentence',
        back: 'For a system in strict-feedback form, design a virtual control for the first subsystem with its own Lyapunov function, then recursively augment the Lyapunov function to handle the mismatch as you step out to the real input.',
      },
      {
        id: 'c_m31_iss',
        front: 'Input-to-state stability',
        back: 'The state is bounded by a decaying function of the initial condition plus a class-K function of the supremum of the input: ||x(t)|| <= beta(||x0||, t) + gamma(sup ||u||). The right notion of robustness for nonlinear systems with disturbances.',
        formula: true,
      },
      {
        id: 'c_m31_pwpf',
        front: 'PWPF modulation',
        back: 'Pulse-width pulse-frequency modulation converts a continuous torque command into on-off thruster pulses using a lag filter and a Schmitt trigger. It approximates linear behaviour on average while respecting the minimum impulse bit, and its hysteresis band sets the limit-cycle amplitude.',
      },
      {
        id: 'c_m31_describing',
        front: 'Describing function',
        back: 'The quasi-linear gain of a nonlinearity to a sinusoid of amplitude A. A limit cycle is predicted where the Nyquist plot of L(jw) intersects -1/N(A). Approximate (it assumes the loop filters the harmonics) but the standard tool for thruster and saturation limit cycles.',
        formula: true,
      },
    ],
    tags: ['interview'],
    importance: 1.4,
  },

  {
    id: 't3_m32_mpc',
    track: 'gnc',
    tier: 3,
    title: 'Model Predictive Control',
    summary:
      'Pose a constrained finite-horizon optimal control problem as a QP, add the terminal ingredients that make it provably stable and recursively feasible, and measure whether it can solve fast enough to fly. You will know when MPC earns its complexity and when a saturated LQR is the right answer.',
    prereqs: ['t3_m29_optimal_control_lqr', 't0_m11_optimization'],
    hours: 55,
    topics: [
      'The receding horizon principle',
      'The finite-horizon constrained optimal control problem',
      'Linear MPC as a quadratic program; condensed vs sparse formulations',
      'State and input constraints; soft constraints and slack variables',
      'Terminal cost and terminal constraint set for stability guarantees',
      'Feasibility, recursive feasibility, and the maximal control invariant set',
      'Explicit MPC and multi-parametric programming',
      'Nonlinear MPC',
      'Robust MPC: tube MPC and min-max formulations',
      'Economic MPC',
      'Real-time onboard MPC: warm starting, solver choice, worst-case iteration bounds, certifiable solve time',
      'Embedded QP solvers (OSQP, qpOASES, HPIPM) and code generation',
      'MPC vs LQR trade; MPC for powered descent, rendezvous and constrained attitude control',
    ],
    objectives: [
      'Formulate and solve a linear MPC problem as a QP in both condensed and sparse form',
      'Add terminal cost and terminal set and argue recursive feasibility',
      'Measure solve time against horizon length and reason about a real-time certification argument',
      'Choose correctly between MPC and a simpler controller for a given problem',
    ],
    resources: [
      {
        title: 'Model Predictive Control: Theory, Computation, and Design (2nd ed.)',
        author: 'Rawlings, Mayne & Diehl',
        kind: 'book',
        url: 'https://sites.engineering.ucsb.edu/~jbraw/mpc/',
        free: true,
        note: 'Free PDF from the authors. The theory reference for stability and recursive feasibility.',
      },
      {
        title: 'Predictive Control for Linear and Hybrid Systems',
        author: 'Borrelli, Bemporad & Morari',
        kind: 'book',
        free: true,
        note: 'Free draft. The reference for explicit MPC and invariant set computation.',
      },
      {
        title: 'MATLAB Tech Talks — Understanding Model Predictive Control',
        author: 'Melda Ulusoy',
        kind: 'video',
        free: true,
      },
      { title: 'OSQP documentation', kind: 'docs', free: true },
    ],
    exercises: [
      {
        id: 'ex_m32_double_integrator',
        title: 'MPC vs saturated LQR on a double integrator',
        kind: 'code',
        lang: 'python',
        hours: 7,
        prompt: `Plant: a double integrator with |u| <= 1 and a state constraint |x2| <= 0.5.

1. Build a condensed QP for horizon N and solve it in a receding-horizon loop.
2. Compare to LQR with the command simply clipped to the limits.
3. Sweep the initial condition out to where the clipped LQR violates the state constraint or overshoots badly, and identify the region where MPC is strictly better.

Success: the constraint is honoured by MPC at every step, and you can point to the specific initial conditions where clipping fails and explain why.`,
        starter: `import numpy as np


def build_condensed_qp(A, B, Q, R, P, N):
    """Condensed linear-MPC QP matrices.

    With x = Sx @ x0 + Su @ U (U the stacked input sequence), the cost
    0.5 * U.T @ H @ U + (F @ x0).T @ U is obtained by eliminating the states.
    Returns (H, F, Sx, Su).
    """
    raise NotImplementedError


def mpc_step(x0, H, F, Su, u_lim, x2_lim, N):
    """Solve one QP and return the first input of the optimal sequence."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'condensed cost matches an explicit rollout',
            assert: `import numpy as np
A = np.array([[1.0, 0.1], [0.0, 1.0]])
B = np.array([[0.005], [0.1]])
Q = np.eye(2); R = np.array([[0.1]]); P = np.eye(2); N = 5
H, F, Sx, Su = build_condensed_qp(A, B, Q, R, P, N)
rng = np.random.default_rng(0)
x0 = rng.standard_normal(2); U = rng.standard_normal(N)
X = (Sx @ x0 + Su @ U).reshape(N, 2)
explicit = sum(X[k] @ Q @ X[k] for k in range(N - 1)) + X[N - 1] @ P @ X[N - 1] + float(R[0, 0]) * (U @ U)
condensed = U @ H @ U + 2 * (F @ x0) @ U + x0 @ (Sx.reshape(N, 2, 2)[0].T @ Q @ Sx.reshape(N, 2, 2)[0]) @ x0
assert abs(explicit - condensed) < 1e-6 * max(1.0, abs(explicit)), "condensed and explicit costs disagree"`,
            hidden: true,
          },
          {
            name: 'MPC never violates the input limit',
            assert: `import numpy as np
A = np.array([[1.0, 0.1], [0.0, 1.0]])
B = np.array([[0.005], [0.1]])
H, F, Sx, Su = build_condensed_qp(A, B, np.eye(2), np.array([[0.1]]), np.eye(2), 20)
x = np.array([2.0, 0.0])
for _ in range(80):
    u = mpc_step(x, H, F, Su, 1.0, 0.5, 20)
    assert abs(u) <= 1.0 + 1e-8, "input constraint violated"
    x = A @ x + B.ravel() * u
assert np.linalg.norm(x) < 0.05, "MPC should drive the state to the origin"`,
          },
        ],
      },
      {
        id: 'ex_m32_rpo',
        title: 'MPC rendezvous with a keep-out zone',
        kind: 'code',
        lang: 'python',
        hours: 8,
        prompt: `Use the Clohessy-Wiltshire equations for a chaser approaching a target.

1. Set up an MPC that minimises fuel subject to thruster limits and a terminal box around the docking port.
2. Add an approach-corridor constraint (a cone) and a spherical keep-out zone. The keep-out zone is **non-convex** — handle it by a rotating separating hyperplane linearised about the previous solution, and state honestly what guarantee you lose.
3. Report delta-v and the number of QP iterations per step.

Success: the trajectory respects the corridor and avoids the sphere, and you can explain what the linearised keep-out constraint costs you in terms of global optimality and feasibility guarantees.`,
        starter: `"""MPC rendezvous in the Clohessy-Wiltshire frame.

CW linearises relative motion about a circular reference orbit. It is only
valid for separations small against the orbit radius — which covers the whole
of proximity operations, and nothing beyond it.
"""

import numpy as np

MU = 3.986004418e14
A_TARGET = 6_778_000.0                 # m, ~400 km circular
N = np.sqrt(MU / A_TARGET**3)          # mean motion, rad/s


def cw_stm(n: float, t: float) -> np.ndarray:
    """6x6 Clohessy-Wiltshire state transition matrix.

    State order is [x radial, y along-track, z cross-track, xdot, ydot, zdot].

    TODO: write out the standard closed form. The two blocks worth getting
    right are the 6*(sin(nt) - nt) term in the along-track row and the
    (4 sin(nt) - 3 n t)/n term next to it — those are where the secular drift
    comes from.
    """
    raise NotImplementedError


def propagate(x0: np.ndarray, t: float) -> np.ndarray:
    """Free drift for t seconds."""
    return cw_stm(N, t) @ x0


def keepout_halfspace(p_prev: np.ndarray, centre: np.ndarray, radius: float):
    """Linearise the non-convex keep-out sphere into a separating half-space.

    Returns (a, b) such that the constraint is a . p >= b.

    TODO: take the unit vector from the sphere centre toward the previous
    solution p_prev, and require the new point to stay on that side of the
    tangent plane. You lose the global guarantee: the result depends on which
    side the previous iterate happened to be on.
    """
    raise NotImplementedError


if __name__ == "__main__":
    print(f"mean motion  = {N:.6e} rad/s   period = {2*np.pi/N/60:.1f} min")
    x0 = np.array([0.0, -1000.0, 0.0, 0.0, 0.0, 0.0])
    print("after a quarter orbit:", propagate(x0, 0.25 * 2*np.pi/N)[:3])
`,
        tests: [
          {
            name: 'the CW transition matrix is the identity at zero elapsed time',
            assert: `assert np.allclose(cw_stm(N, 0.0), np.eye(6), atol=1e-12)`,
          },
          {
            name: 'it is symplectic, so its determinant is one',
            assert: `for t in (300.0, 1800.0, 2*np.pi/N):
    assert abs(np.linalg.det(cw_stm(N, t)) - 1.0) < 1e-6, f'det off at t={t}'`,
          },
          {
            name: 'radial and cross-track motion returns after exactly one orbit',
            assert: `P = cw_stm(N, 2*np.pi/N)
idx = [0, 2, 3, 5]
assert np.allclose(P[np.ix_(idx, idx)], np.eye(4), atol=1e-6), 'radial/cross-track must close'`,
          },
          {
            name: 'a pure along-track offset just sits there',
            assert: `x = propagate(np.array([0.0, -500.0, 0.0, 0.0, 0.0, 0.0]), 1200.0)
assert abs(x[1] + 500.0) < 1e-6 and abs(x[0]) < 1e-6`,
          },
          {
            name: 'the linearised keep-out plane passes through the sphere surface',
            assert: `c = np.array([0.0, 0.0, 0.0]); r = 50.0
a, b = keepout_halfspace(np.array([100.0, 0.0, 0.0]), c, r)
assert abs(np.linalg.norm(a) - 1.0) < 1e-9, 'normal must be a unit vector'
assert abs(b - r) < 1e-9, 'the plane must be tangent to the sphere'
assert a @ np.array([100.0, 0.0, 0.0]) >= b, 'the previous iterate must remain feasible'`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m32_realtime',
        title: 'Find the real-time boundary',
        kind: 'code',
        lang: 'python',
        hours: 5,
        prompt: `Profile your QP solve time as a function of horizon N, state dimension, and whether you warm start from the previous solution.

1. Plot median and 99.9th percentile solve time against N, for both the condensed and sparse formulations.
2. Identify the N at which the 99.9th percentile exceeds a 20 ms control period.
3. Write the paragraph you would put in a design review arguing whether this is flyable, naming what you would need in order to certify it.

Success: tail latency (not mean) drives your conclusion, and your argument mentions worst-case iteration bounds rather than measured averages.`,
        starter: `"""Tail latency, not mean latency, decides whether MPC is flyable.

A solver that averages 4 ms and spikes to 60 ms once every thousand cycles has
already missed a 20 ms deadline. This module is deliberately about the
statistics, not the QP.
"""

import numpy as np

CONTROL_PERIOD_MS = 20.0


def percentile(samples, q: float) -> float:
    """The q-th percentile of measured solve times, q in [0, 100].

    TODO: sort and interpolate, or just call np.percentile. Use the linear
    interpolation convention so it matches what your profiler reports.
    """
    raise NotImplementedError


def deadline_margin(samples, period_ms: float = CONTROL_PERIOD_MS) -> float:
    """Headroom at the 99.9th percentile, in milliseconds.

    TODO: period minus the 99.9th percentile. Negative means you are already
    missing deadlines, whatever the mean says.
    """
    raise NotImplementedError


def max_horizon(times_by_N: dict[int, list], period_ms: float = CONTROL_PERIOD_MS) -> int:
    """Largest horizon whose 99.9th percentile still fits the control period.

    TODO: walk the horizons in increasing order and return the last one that
    still has non-negative margin. Return 0 if even the shortest fails.
    """
    raise NotImplementedError


if __name__ == "__main__":
    rng = np.random.default_rng(7)
    # Lognormal is a fair caricature of solver timing: a tight body, a long tail.
    for n in (5, 10, 20, 40):
        t = rng.lognormal(mean=np.log(0.35 * n), sigma=0.45, size=20000)
        print(f"N={n:3d}  median={percentile(t,50):6.2f} ms  p99.9={percentile(t,99.9):7.2f} ms")
`,
        tests: [
          {
            name: 'percentile agrees with numpy on a known sample',
            assert: `s = list(range(101))
for q in (0.0, 25.0, 50.0, 99.0, 100.0):
    assert abs(percentile(s, q) - float(np.percentile(s, q))) < 1e-9, f'q={q}'`,
          },
          {
            name: 'the median is unmoved by a heavy tail that blows the deadline',
            assert: `s = [4.0]*999 + [500.0]
assert abs(percentile(s, 50) - 4.0) < 1e-9
assert percentile(s, 99.95) > 100.0`,
          },
          {
            name: 'deadline margin is driven by the tail, not the mean',
            assert: `# Half a percent of overruns is enough. One bad sample in a thousand is not:
# the p99.9 of 999 good samples and one bad one is still a good sample, which
# is the first thing people get wrong about tail latency.
s = [4.0]*995 + [500.0]*5
assert np.mean(s) < CONTROL_PERIOD_MS, 'the mean looks fine, which is the trap'
assert deadline_margin(s) < 0.0, 'the p99.9 must fail the deadline'`,
          },
          {
            name: 'max_horizon returns the last horizon that still fits',
            assert: `d = {5: [2.0]*1000, 10: [8.0]*1000, 20: [18.0]*1000, 40: [45.0]*1000}
assert max_horizon(d) == 20`,
          },
          {
            name: 'max_horizon returns zero when even the shortest horizon misses',
            assert: `assert max_horizon({5: [99.0]*1000}) == 0`,
            hidden: true,
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q_m32_vs_lqr',
        q: 'When does MPC beat LQR, and when is LQR the right answer?',
        choices: [
          'MPC is always better because it optimises over a horizon',
          'MPC wins when constraints are active and shape the optimal behaviour, when the plant or the references are strongly time-varying and known in advance, or when you need to plan around a state constraint. LQR wins when constraints are rarely active, when the CPU or certification budget is tight, and when you need guaranteed margins and a closed-form, testable gain',
          'LQR is always better because it has guaranteed margins',
          'They are mathematically identical',
        ],
        answer: 1,
        explain:
          'Unconstrained linear MPC with an infinite horizon IS LQR, so the entire value of MPC comes from constraints and preview. If your actuator is rarely saturated and there is no state constraint, MPC buys you an online optimiser, a solver failure mode and a certification headache in exchange for nothing. When constraints bind — thruster limits during a fuel-limited descent, a keep-out zone, a glideslope — MPC plans around them instead of discovering them at saturation. Preview of a known reference or disturbance (wind profile, target motion) is the other decisive advantage.',
        b: 1.0,
        bloom: 'analyze',
      },
      {
        id: 'q_m32_terminal',
        q: 'What do terminal cost and terminal constraint set buy you, and what do they cost?',
        choices: [
          'They buy faster solve time and cost nothing',
          'They buy a proof: with the terminal cost equal to the LQR cost-to-go and the terminal set a control-invariant set in which the LQR law is feasible, the MPC cost becomes a Lyapunov function, giving closed-loop stability and recursive feasibility. The cost is a smaller region of attraction and possibly infeasibility at states from which the terminal set is unreachable in N steps',
          'They guarantee global optimality over the infinite horizon',
          'They convert the QP into an LP',
        ],
        answer: 1,
        explain:
          'The standard stability argument shifts the previous optimal sequence forward, appends the terminal control law, and shows the optimal cost decreases. That requires the terminal set to be invariant under the terminal law and to satisfy all constraints, and the terminal cost to upper bound the cost-to-go of that law. In exchange for stability and recursive feasibility you shrink the feasible set, since every initial state must be able to reach the terminal set within the horizon. Lengthening N restores region of attraction at the cost of solve time, which is the central MPC design trade.',
        b: 1.7,
        bloom: 'understand',
      },
      {
        id: 'q_m32_infeasible',
        q: 'Your MPC becomes infeasible mid-flight. What are the standard mitigations?',
        choices: [
          'Restart the solver with a random initial guess',
          'Soften the state constraints with slack variables and an exact-penalty term so a solution always exists, and carry a certified fallback controller (saturated LQR or the previous feasible plan shifted forward) that runs when the solver fails or times out',
          'Increase the horizon until it becomes feasible again',
          'Remove all constraints from the formulation',
        ],
        answer: 1,
        explain:
          'Hard state constraints plus disturbance equals eventual infeasibility, so flight formulations almost never use hard state constraints. Softening with slacks and a large linear penalty keeps the QP always feasible and recovers the hard constraint whenever it is attainable (that is the role of an exact penalty). Separately, flight software must never depend on an optimiser succeeding: the standard architecture keeps the previous feasible plan and a simple certified fallback law, with a deterministic switch and a telemetry counter. Both mitigations are used together, not as alternatives.',
        b: 1.4,
        bloom: 'apply',
      },
      {
        id: 'q_m32_certify',
        q: 'How do you certify an onboard optimizer for flight?',
        choices: [
          'Run it a million times in simulation and report the mean solve time',
          'Bound the worst case, not the average: use a convex problem class where convergence is provable, bound the iteration count a priori (or cap iterations and prove the capped solution is still safe), fix the memory footprint and remove dynamic allocation, generate deterministic code, and pair it with a certified fallback. Testing supports the argument but cannot substitute for the bound',
          'Use a general nonlinear programming solver with a long timeout',
          'Certify it by flying it on a test vehicle first',
        ],
        answer: 1,
        explain:
          'A flight computer has a hard frame budget, so the question is not how fast the solver usually is but what it is guaranteed to do in the worst case. Convexity is what makes an a priori bound possible: interior-point and first-order methods on SOCPs and QPs have known iteration complexity, and a capped-iteration scheme can be shown to return a feasible suboptimal solution. Beyond that the code must be statically allocated, branch-bounded and deterministic. This certification argument is the whole reason convex guidance displaced general NLP onboard.',
        b: 1.8,
        bloom: 'analyze',
      },
    ],
    cards: [
      {
        id: 'c_m32_receding',
        front: 'Receding horizon principle',
        back: 'At each step solve an N-step optimal control problem from the current state, apply only the FIRST input, then re-solve at the next step with fresh measurements. The re-solve is what provides feedback.',
      },
      {
        id: 'c_m32_qp',
        front: 'Linear MPC as a QP',
        back: 'Quadratic cost plus linear dynamics and polytopic constraints gives min 0.5*z.T*H*z + f.T*z subject to A_in*z <= b_in and A_eq*z = b_eq. H is positive definite when R is, so the problem is convex with a unique minimiser.',
        formula: true,
      },
      {
        id: 'c_m32_condensed',
        front: 'Condensed vs sparse formulation',
        back: 'Condensed: eliminate the states, leaving a small dense QP in the inputs only — good for short horizons. Sparse: keep states as variables with dynamics as equality constraints — larger but banded, so cost grows linearly rather than cubically in N.',
      },
      {
        id: 'c_m32_terminal',
        front: 'Terminal ingredients for stability',
        back: 'Terminal cost = LQR cost-to-go x.T*P*x, terminal set = a control-invariant set where the LQR law satisfies all constraints. Then the optimal MPC cost is a Lyapunov function for the closed loop.',
        formula: true,
      },
      {
        id: 'c_m32_recursive',
        front: 'Recursive feasibility',
        back: 'If a feasible plan exists now, one exists at the next step. Proved by shifting the previous solution forward and appending the terminal control law. Without it, MPC can walk itself into a state with no solution.',
      },
      {
        id: 'c_m32_soft',
        front: 'Soft constraints and exact penalties',
        back: 'Replace a state constraint g(x) <= 0 with g(x) <= s, s >= 0, and add rho*s to the cost. With rho larger than the optimal dual variable, the penalty is EXACT: the constraint is met whenever it is attainable, and the QP is always feasible.',
        formula: true,
      },
      {
        id: 'c_m32_explicit',
        front: 'Explicit MPC',
        back: 'For small problems, multiparametric programming precomputes the optimal law offline as a piecewise-affine function of the state over a polytopic partition. Online cost becomes a table lookup, but the number of regions explodes with state dimension and horizon.',
      },
      {
        id: 'c_m32_tube',
        front: 'Tube MPC',
        back: 'Plan a nominal trajectory, then wrap it with an ancillary feedback law that keeps the true state inside a robust invariant tube. Tighten the nominal constraints by the tube cross-section so the true trajectory is always feasible.',
      },
      {
        id: 'c_m32_warmstart',
        front: 'Warm starting',
        back: 'Initialise the solver with the previous solution shifted one step and the terminal law appended. Typically cuts iterations by a large factor — but the WORST case, not the warm-started average, is what you certify against.',
      },
      {
        id: 'c_m32_osqp',
        front: 'OSQP in one line',
        back: 'An operator-splitting (ADMM) QP solver: division-free after a single factorisation, fixed memory, and it detects infeasibility. Its predictable per-iteration cost is why it appears in embedded code generation.',
      },
      {
        id: 'c_m32_horizon',
        front: 'Choosing the horizon',
        back: 'N must be long enough to reach the terminal set and to see the constraints that matter — typically covering the dominant closed-loop settling time. Solve time grows with N (linearly in sparse form), so N is the central cost/region-of-attraction trade.',
      },
      {
        id: 'c_m32_lqr_equiv',
        front: 'The equivalence to remember',
        back: 'Unconstrained linear MPC with an infinite horizon is exactly LQR. Every benefit of MPC comes from constraints, preview, or time variation — never from the optimisation alone.',
      },
      {
        id: 'c_m32_fallback',
        front: 'The flight-software rule for onboard optimisers',
        back: 'Never let a control cycle depend on a solver succeeding. Cap iterations, keep the last feasible plan, and carry a certified simple fallback law with a deterministic switch and a telemetry counter.',
      },
    ],
    tags: ['interview'],
    importance: 1.2,
  },

  /* ══════════════════════════════════════════════════════════════════════════
     TIER 4 — ESTIMATION & NAVIGATION
     ══════════════════════════════════════════════════════════════════════════ */

  {
    id: 't4_m33_least_squares',
    track: 'gnc',
    tier: 4,
    title: 'Least Squares & Static Estimation',
    summary:
      'Solve weighted least squares three different ways and know which one to reach for when the normal matrix is badly conditioned. You will implement TRIAD, the Davenport q-method and the SVD solution to the Wahba problem, and be able to say exactly when each attitude solution degrades.',
    prereqs: ['t0_m05_linear_algebra_2', 't0_m09_probability_stats'],
    hours: 50,
    topics: [
      'The linear least squares problem; normal equations, QR, and SVD solutions',
      'Weighted least squares and the information matrix',
      'Minimum variance and BLUE: the Gauss-Markov theorem',
      'Maximum likelihood and its equivalence to WLS under Gaussian noise',
      'Maximum a posteriori estimation',
      'Nonlinear least squares: Gauss-Newton and Levenberg-Marquardt',
      'Recursive least squares and the bridge to the Kalman filter',
      'The normal matrix condition number as an observability metric',
      'Residual analysis, outlier rejection, and robust estimation (Huber loss, RANSAC)',
      'The Wahba problem: find the rotation best aligning two sets of vector observations',
      'Wahba solutions: TRIAD, Davenport q-method, QUEST, ESOQ, and the SVD method',
      'Covariance of an attitude solution and the effect of sensor geometry',
    ],
    objectives: [
      'Solve a weighted least squares problem three ways and pick the numerically correct one for the conditioning at hand',
      'Implement TRIAD, the q-method and the SVD solution to Wahba and compare their accuracy against sensor geometry',
      'Diagnose an ill-conditioned estimation problem and name the physical cause',
      'Show that WLS with W = inv(R) is the maximum likelihood estimator under Gaussian noise',
    ],
    resources: [
      {
        title: 'Optimal Estimation of Dynamic Systems (2nd ed.), Ch. 1-2',
        author: 'Crassidis & Junkins',
        kind: 'book',
        free: false,
        note: 'The best aerospace treatment of static estimation and the Wahba problem.',
      },
      {
        title: 'Fundamentals of Spacecraft Attitude Determination and Control, Ch. 5',
        author: 'Markley & Crassidis',
        kind: 'book',
        free: false,
        note: 'Static attitude determination, canonical.',
      },
      { title: 'Numerical Methods for Least Squares Problems', author: 'Bjorck', kind: 'book', free: false },
      { title: 'Stanford EE263 — least squares lectures', kind: 'course', free: true },
    ],
    exercises: [
      {
        id: 'ex_m33_wahba',
        title: 'Three solutions to the Wahba problem',
        kind: 'code',
        lang: 'python',
        hours: 9,
        prompt: `Implement three attitude solutions from a set of unit vector pairs (body observations b_i, reference vectors r_i, weights a_i):

1. **TRIAD** (two vectors only, builds an orthonormal triad from the primary and the cross product).
2. **Davenport q-method** (build the attitude profile matrix B, form the 4x4 K matrix, take the eigenvector of the largest eigenvalue).
3. **SVD method** (B = U*S*V.T, then A = U*diag(1, 1, det(U)*det(V))*V.T).

Then sweep the angle between the two reference vectors from 90 degrees down to 2 degrees with fixed sensor noise, and plot attitude error for each method.

Success: all three agree to noise level at good geometry, TRIAD degrades visibly as the vectors become parallel, and the SVD method never produces a reflection.`,
        starter: `import numpy as np


def triad(b1, b2, r1, r2):
    """TRIAD attitude matrix. b1/r1 is the PRIMARY (more accurate) pair.

    Returns the 3x3 rotation A with b = A @ r.
    """
    raise NotImplementedError


def attitude_profile_matrix(bs, rs, weights):
    """B = sum_i a_i * outer(b_i, r_i)."""
    raise NotImplementedError


def davenport_q(bs, rs, weights):
    """Davenport q-method: return the optimal quaternion [w, x, y, z]."""
    raise NotImplementedError


def wahba_svd(bs, rs, weights):
    """SVD solution: return the optimal 3x3 rotation matrix (det = +1)."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'exact data is recovered exactly',
            assert: `import numpy as np
th = 0.7
A_true = np.array([[np.cos(th), np.sin(th), 0.0],
                   [-np.sin(th), np.cos(th), 0.0],
                   [0.0, 0.0, 1.0]])
rs = np.array([[1.0, 0.0, 0.0], [0.0, 0.3, 0.95]])
rs = rs / np.linalg.norm(rs, axis=1, keepdims=True)
bs = (A_true @ rs.T).T
A = wahba_svd(bs, rs, np.array([1.0, 1.0]))
assert np.max(np.abs(A - A_true)) < 1e-9, "noise-free Wahba must recover the rotation exactly"`,
          },
          {
            name: 'the SVD solution is a proper rotation, never a reflection',
            assert: `import numpy as np
rng = np.random.default_rng(3)
for _ in range(25):
    rs = rng.standard_normal((4, 3))
    rs /= np.linalg.norm(rs, axis=1, keepdims=True)
    bs = rs + 0.3 * rng.standard_normal((4, 3))
    bs /= np.linalg.norm(bs, axis=1, keepdims=True)
    A = wahba_svd(bs, rs, np.ones(4))
    assert abs(np.linalg.det(A) - 1.0) < 1e-9, "det must be +1"
    assert np.max(np.abs(A.T @ A - np.eye(3))) < 1e-9, "must be orthogonal"`,
          },
          {
            name: 'q-method and SVD method agree',
            assert: `import numpy as np
rng = np.random.default_rng(11)
rs = rng.standard_normal((5, 3)); rs /= np.linalg.norm(rs, axis=1, keepdims=True)
bs = rs + 0.02 * rng.standard_normal((5, 3)); bs /= np.linalg.norm(bs, axis=1, keepdims=True)
w = np.array([4.0, 1.0, 1.0, 1.0, 2.0])
q = davenport_q(bs, rs, w)
A_svd = wahba_svd(bs, rs, w)
# rotate a probe vector both ways
v = np.array([0.3, -0.5, 0.81]); v /= np.linalg.norm(v)
qv = np.concatenate([[0.0], v])
def qmul(a, b):
    w1, x1, y1, z1 = a; w2, x2, y2, z2 = b
    return np.array([w1*w2 - x1*x2 - y1*y2 - z1*z2,
                     w1*x2 + x1*w2 + y1*z2 - z1*y2,
                     w1*y2 - x1*z2 + y1*w2 + z1*x2,
                     w1*z2 + x1*y2 - y1*x2 + z1*w2])
qc = np.array([q[0], -q[1], -q[2], -q[3]])
rot = qmul(qmul(q, qv), qc)[1:]
assert np.max(np.abs(rot - A_svd @ v)) < 1e-7, "the two Wahba solutions must agree"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m33_lm',
        title: 'Levenberg-Marquardt on a nonlinear measurement model',
        kind: 'code',
        lang: 'python',
        hours: 6,
        prompt: `Fit a range-only position solution: four ground stations at known locations measure slant range to an unknown point with Gaussian noise.

1. Implement Gauss-Newton with an analytic Jacobian and show it diverges from a poor initial guess.
2. Implement Levenberg-Marquardt with an adaptive damping parameter and show it converges from the same guess.
3. Report the estimated covariance from inv(J.T*inv(R)*J) and compare it against the sample covariance from 1000 noise realisations.

Success: LM converges where GN does not, and the analytic covariance matches the sample covariance within a few percent.`,
        starter: `import numpy as np


def residual_and_jacobian(x, stations, measured_ranges):
    """Return (r, J) for the range measurement model h_i(x) = ||x - s_i||."""
    raise NotImplementedError


def levenberg_marquardt(x0, stations, measured_ranges, R, max_iter=200):
    """LM with adaptive lambda. Return (x_hat, P_hat, n_iter)."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'recovers a noise-free solution',
            assert: `import numpy as np
stations = np.array([[0.0, 0.0, 0.0], [1e4, 0.0, 0.0], [0.0, 1e4, 0.0], [0.0, 0.0, 8e3]])
x_true = np.array([3000.0, 4000.0, 12000.0])
rng_meas = np.linalg.norm(x_true - stations, axis=1)
x_hat, P, n = levenberg_marquardt(np.array([0.0, 0.0, 1.0]), stations, rng_meas, np.eye(4) * 1.0)
assert np.linalg.norm(x_hat - x_true) < 1e-4, "should converge to the true point"`,
          },
          {
            name: 'covariance is symmetric positive definite',
            assert: `import numpy as np
stations = np.array([[0.0, 0.0, 0.0], [1e4, 0.0, 0.0], [0.0, 1e4, 0.0], [0.0, 0.0, 8e3]])
x_true = np.array([3000.0, 4000.0, 12000.0])
meas = np.linalg.norm(x_true - stations, axis=1)
_, P, _ = levenberg_marquardt(np.array([100.0, 100.0, 100.0]), stations, meas, np.eye(4) * 4.0)
assert np.allclose(P, P.T, atol=1e-10) and np.all(np.linalg.eigvalsh(P) > 0), "P must be SPD"`,
          },
        ],
      },
      {
        id: 'ex_m33_conditioning',
        title: 'Normal equations versus QR on an ill-conditioned problem',
        kind: 'analysis',
        hours: 4,
        prompt: `Construct a design matrix with condition number 1e8 (a nearly collinear pair of columns is enough).

1. Solve via the normal equations in float64 and via QR.
2. Compare both to a float128 or exact reference.
3. Show empirically that the normal-equation error scales with the SQUARE of the condition number while QR scales with the condition number itself.

Write a short note explaining what physical situations in navigation create nearly collinear columns (hint: two sensors observing nearly the same direction; a short tracking arc).`,
      },
    ],
    quiz: [
      {
        id: 'q_m33_wahba',
        q: 'State the Wahba problem and give its SVD solution.',
        choices: [
          'Minimise the sum of squared range residuals; solve by normal equations',
          'Find the rotation A minimising 0.5 * sum of a_i * ||b_i - A*r_i||^2 over proper rotations. Form B = sum a_i * outer(b_i, r_i), take B = U*S*V.T, and set A = U * diag(1, 1, det(U)*det(V)) * V.T',
          'Find the quaternion that maximises the trace of B; solve by normal equations',
          'Fit a rotation by three successive Euler angle least-squares fits',
        ],
        answer: 1,
        explain:
          'Wahba (1965) asks for the least-squares rotation aligning two sets of unit vectors. Expanding the cost shows minimising it is the same as maximising trace(A*B.T), the orthogonal Procrustes problem. The SVD of the attitude profile matrix gives the maximiser, and the det(U)*det(V) correction is essential: without it the answer can be a reflection, which has determinant -1 and is not a physical attitude.',
        b: 1.3,
        bloom: 'recall',
      },
      {
        id: 'q_m33_triad',
        q: 'Why does TRIAD degrade badly when the two observed vectors are nearly parallel, and what does QUEST do better?',
        choices: [
          'TRIAD is slower to compute, so numerical error accumulates',
          'TRIAD builds its second axis from the cross product of the two observations, whose magnitude goes to zero as they align — so noise in either vector is amplified by 1/sin(angle). QUEST solves the weighted least-squares problem over all observations with proper weights, degrades gracefully, uses every measurement, and returns a covariance',
          'QUEST uses more vectors, but degrades identically for two vectors',
          'TRIAD assumes both vectors are equally accurate, which QUEST also does',
        ],
        answer: 1,
        explain:
          'TRIAD is a deterministic construction, not an estimator: it uses exactly two vectors, trusts the primary one completely, and discards information. The cross product that defines the second triad axis shrinks like sin of the separation angle, so the normalisation divides noise by a small number. QUEST solves Wahba by finding the largest eigenvalue of the K matrix with an efficient Newton iteration, weights observations by their actual accuracy, extends to many vectors, and produces an attitude covariance you can hand to a filter. Geometry still matters for QUEST, but it fails gracefully rather than catastrophically.',
        b: 1.2,
        bloom: 'analyze',
      },
      {
        id: 'q_m33_ml',
        q: 'Show that weighted least squares with W = inv(R) is the maximum likelihood estimator for a linear model under Gaussian noise.',
        choices: [
          'It is not; ML requires a prior on the state',
          'With y = H*x + v, v ~ N(0, R), the log-likelihood is -0.5*(y - H*x).T*inv(R)*(y - H*x) plus a constant, so maximising it is exactly minimising the inv(R)-weighted residual norm, giving x_hat = inv(H.T*inv(R)*H)*H.T*inv(R)*y',
          'It holds only when R is diagonal',
          'It holds only for scalar measurements',
        ],
        answer: 1,
        explain:
          'The Gaussian density has exponent -0.5 times the Mahalanobis norm of the residual, so the negative log-likelihood is the inv(R)-weighted sum of squares up to an additive constant. Maximum likelihood and weighted least squares are therefore the same optimisation. This also explains the weighting: measurements are weighted by their inverse covariance, that is, by their information. Adding a Gaussian prior turns the same argument into MAP estimation, and the resulting recursive form is the Kalman filter.',
        b: 1.1,
        bloom: 'apply',
      },
      {
        id: 'q_m33_condition',
        q: 'Your normal matrix H.T*W*H has condition number 1e12. Diagnose and fix.',
        choices: [
          'The measurements are wrong; discard the data',
          'One state direction is nearly unobservable from this data. Never form the normal equations at that conditioning — solve by QR or SVD on the weighted design matrix, which halves the effective condition number. Fix the underlying problem by adding geometry-diverse measurements, rescaling states to comparable units, estimating fewer parameters, or regularising with a prior',
          'Increase the numerical precision to float128 and proceed',
          'Reduce the measurement noise covariance R',
        ],
        answer: 1,
        explain:
          'A condition number of 1e12 on the normal matrix means roughly 1e6 on the design matrix, so forming H.T*W*H throws away half your significant digits before you start. Orthogonal factorisations work on the design matrix directly and avoid the squaring. Just as importantly, the conditioning usually has a physical cause worth fixing: poor observation geometry, an over-parameterised state where two parameters trade off (a classic being a constant accelerometer bias against a gravity error over a short arc), or states with wildly different units. Regularisation or a consider-covariance treatment is the answer when you cannot improve geometry.',
        b: 1.5,
        bloom: 'analyze',
      },
      {
        id: 'q_m33_rls',
        q: 'What is the relationship between recursive least squares and the Kalman filter?',
        choices: [
          'They are unrelated',
          'RLS is exactly the Kalman filter for a constant (static) state: no process noise, identity state transition. Adding state dynamics and process noise to RLS produces the Kalman filter',
          'The Kalman filter is a special case of RLS',
          'RLS is the smoother and the Kalman filter is the predictor',
        ],
        answer: 1,
        explain:
          'RLS updates the estimate and its information matrix as measurements arrive, with the update having exactly the Kalman gain form. Setting F = I and Q = 0 in the Kalman filter reduces it to RLS. This is the cleanest way to see what process noise is actually doing: it is the admission that the quantity being estimated is moving, which stops the covariance from collapsing to zero and keeps the filter responsive. An RLS with forgetting factor is the same idea in cruder form.',
        b: 0.9,
        bloom: 'understand',
      },
    ],
    cards: [
      {
        id: 'c_m33_normal',
        front: 'Normal equations',
        back: 'x_hat = inv(H.T*H)*H.T*y minimises ||y - H*x||^2. Correct in exact arithmetic; numerically it squares the condition number, so prefer QR or SVD.',
        formula: true,
      },
      {
        id: 'c_m33_wls',
        front: 'Weighted least squares solution',
        back: 'x_hat = inv(H.T*W*H)*H.T*W*y with W = inv(R). Its covariance is P = inv(H.T*inv(R)*H), the inverse of the Fisher information.',
        formula: true,
      },
      {
        id: 'c_m33_gaussmarkov',
        front: 'Gauss-Markov theorem',
        back: 'Among all linear unbiased estimators, WLS with W = inv(R) has minimum variance — it is BLUE. It requires only zero-mean noise with covariance R, not Gaussianity.',
      },
      {
        id: 'c_m33_ml_wls',
        front: 'ML equals WLS under Gaussian noise',
        back: 'The Gaussian negative log-likelihood is 0.5*(y - H*x).T*inv(R)*(y - H*x) plus a constant, so maximising likelihood IS minimising the inverse-covariance-weighted residual.',
        formula: true,
      },
      {
        id: 'c_m33_map',
        front: 'MAP estimate with a Gaussian prior',
        back: 'x_hat = inv(inv(P0) + H.T*inv(R)*H) * (inv(P0)*x0 + H.T*inv(R)*y). Information adds: prior information plus measurement information.',
        formula: true,
      },
      {
        id: 'c_m33_gn',
        front: 'Gauss-Newton step',
        back: 'dx = inv(J.T*W*J)*J.T*W*r, with J the Jacobian of the residual. It approximates the Hessian by J.T*W*J, dropping the second-derivative term — fine near the solution, unreliable far from it.',
        formula: true,
      },
      {
        id: 'c_m33_lm',
        front: 'Levenberg-Marquardt step',
        back: 'dx = inv(J.T*W*J + lambda*D)*J.T*W*r. Large lambda gives a short gradient-descent step; small lambda gives Gauss-Newton. Adapt lambda by whether the step reduced the cost.',
        formula: true,
      },
      {
        id: 'c_m33_wahba',
        front: 'The Wahba problem',
        back: 'Minimise 0.5 * sum of a_i * ||b_i - A*r_i||^2 over proper rotations A, given body observations b_i and reference vectors r_i. It is the orthogonal Procrustes problem on SO(3).',
        formula: true,
      },
      {
        id: 'c_m33_profile',
        front: 'Attitude profile matrix',
        back: 'B = sum of a_i * outer(b_i, r_i). Minimising the Wahba cost equals maximising trace(A*B.T). Every Wahba solver is a different way of doing that maximisation.',
        formula: true,
      },
      {
        id: 'c_m33_svd_wahba',
        front: 'SVD solution to Wahba',
        back: 'With B = U*S*V.T, A_opt = U * diag(1, 1, det(U)*det(V)) * V.T. The determinant correction is what keeps you on SO(3) instead of picking up a reflection.',
        formula: true,
      },
      {
        id: 'c_m33_davenport',
        front: 'Davenport q-method',
        back: 'Build K = [[trace(B), z.T], [z, B + B.T - trace(B)*I]] where z = [B23-B32, B31-B13, B12-B21]. The optimal quaternion is the eigenvector of the LARGEST eigenvalue of K.',
        formula: true,
      },
      {
        id: 'c_m33_quest',
        front: 'QUEST',
        back: 'Solves the q-method without a full eigendecomposition: the largest eigenvalue is close to the sum of the weights, so Newton iteration on the characteristic polynomial converges in a couple of steps. It is the flight-standard Wahba solver.',
      },
      {
        id: 'c_m33_triad',
        front: 'TRIAD and its weakness',
        back: 'Deterministic two-vector method: build an orthonormal triad from the primary observation and the normalised cross product. Error blows up like 1/sin(angle between the two vectors), and it cannot use a third measurement.',
      },
      {
        id: 'c_m33_cond',
        front: 'Condition number as an observability metric',
        back: 'cond(H.T*W*H) = cond(H_weighted)^2. A large value means some state direction carries almost no information. Solve by QR/SVD, and fix the geometry, the parameterisation or the state list.',
        formula: true,
      },
      {
        id: 'c_m33_huber',
        front: 'Huber loss',
        back: 'Quadratic for small residuals, linear beyond a threshold k (usually 1.345 sigma for 95% Gaussian efficiency). It bounds the influence of outliers without the all-or-nothing behaviour of hard rejection.',
        formula: true,
      },
    ],
    tags: ['interview'],
    importance: 1.2,
  },

  {
    id: 't4_m34_kalman_filter',
    track: 'gnc',
    tier: 4,
    title: 'The Kalman Filter',
    summary:
      'Derive the Kalman filter from scratch on a whiteboard, implement it in a numerically stable form, and prove it is consistent with NEES and NIS tests rather than merely believing it is. You will also be able to make a filter diverge on purpose and then diagnose which of the five usual causes did it.',
    prereqs: ['t4_m33_least_squares', 't0_m09_probability_stats', 't3_m28_state_space'],
    hours: 70,
    topics: [
      'The stochastic state-space model: process noise Q and measurement noise R',
      'Three derivations of the Kalman filter: minimum variance/orthogonality, Bayesian Gaussian conditioning, recursive least squares',
      'The predict and update steps',
      'The Kalman gain as a trust ratio between prediction and measurement',
      'Covariance propagation and the discrete Riccati equation',
      'Process noise tuning and the consequences of getting Q wrong',
      'The steady-state Kalman filter',
      'Observability and filter convergence',
      'Numerically stable formulations: Joseph form, square-root (Potter, Carlson), UD factorization (Bierman-Thornton)',
      'Filter divergence: causes and remedies (fading memory, Q inflation, covariance symmetrization)',
      'Consistency testing: innovation whiteness, NEES and NIS chi-square tests, innovation autocorrelation',
      'Sequential vs batch measurement updates; measurement editing and gating',
      'The Rauch-Tung-Striebel smoother',
      'The information filter form and its use in sensor fusion',
      'Correlated and time-varying noise; the Schmidt-Kalman consider filter',
    ],
    objectives: [
      'Derive the Kalman gain from the minimum-variance condition without notes',
      'Implement the filter in Joseph form and show it preserves positive definiteness where the naive form does not',
      'Tune Q and R from data and defend the choice',
      'Run NEES and NIS consistency tests over many Monte Carlo runs and interpret the result',
      'Deliberately induce divergence and diagnose it from the innovations',
    ],
    resources: [
      {
        title: 'Kalman and Bayesian Filters in Python',
        author: 'Roger Labbe',
        kind: 'book',
        url: 'https://github.com/rlabbe/Kalman-and-Bayesian-Filters-in-Python',
        free: true,
        note: 'Free Jupyter-notebook book. Intuition first, KF/EKF/UKF/PF, every exercise with a solution. Start here.',
      },
      {
        title: 'FilterPy',
        author: 'Roger Labbe',
        kind: 'tool',
        url: 'https://github.com/rlabbe/filterpy',
        free: true,
        note: 'The companion library to the book.',
      },
      {
        title: 'Optimal State Estimation: Kalman, H-infinity, and Nonlinear Approaches',
        author: 'Dan Simon',
        kind: 'book',
        free: false,
        note: 'Bottom-up with source code; covers unscented, particle, constrained and robust filtering.',
      },
      {
        title: 'Estimation with Applications to Tracking and Navigation',
        author: 'Bar-Shalom, Li & Kirubarajan',
        kind: 'book',
        free: false,
        note: 'The source for consistency testing: NEES, NIS, and how to run them properly.',
      },
      { title: 'Applied Optimal Estimation', author: 'Gelb', kind: 'book', free: false, note: 'The compact 1974 classic.' },
      {
        title: 'Introduction to Random Signals and Applied Kalman Filtering',
        author: 'Brown & Hwang',
        kind: 'book',
        free: false,
      },
      {
        title: 'MATLAB Tech Talks — Understanding Kalman Filters',
        kind: 'video',
        url: 'https://www.youtube.com/playlist?list=PLn8PRpmsu08pzi6EMiYnR-076Mh-q3tWr',
        free: true,
      },
      {
        title: 'NESC Academy — Fundamentals of Kalman Filtering and Estimation',
        author: 'NASA',
        kind: 'video',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'ex_m34_kf_scratch',
        title: 'A constant-velocity Kalman filter from scratch',
        kind: 'code',
        lang: 'python',
        hours: 8,
        prompt: `Implement a one-dimensional constant-velocity Kalman filter with position-only measurements, with **no filtering library**.

State x = [p, v]. Use the exact discrete process noise for a continuous white-noise-acceleration model:

Q = q * [[dt^3/3, dt^2/2], [dt^2/2, dt]]

1. Implement predict and update.
2. Implement the update in both the simplified form (I - K*H)*P and the **Joseph form** (I - K*H)*P*(I - K*H).T + K*R*K.T.
3. Drive both with a deliberately large gain error (perturb K by 1%) and show the simplified form loses symmetry and eventually positive definiteness while Joseph does not.

Success: both tests below pass and you can explain what the steady-state gain depends on.`,
        starter: `import numpy as np


def cv_matrices(dt, q):
    """Return (F, Q) for a 1-D constant-velocity model with white-noise acceleration."""
    raise NotImplementedError


def kf_predict(x, P, F, Q):
    """Return (x_pred, P_pred)."""
    raise NotImplementedError


def kf_update(x, P, z, H, R, joseph=True):
    """Return (x_upd, P_upd, innovation, S)."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'process noise matrix is the exact CV form',
            assert: `import numpy as np
F, Q = cv_matrices(0.1, 2.0)
assert np.allclose(F, [[1.0, 0.1], [0.0, 1.0]]), "F is wrong"
assert np.allclose(Q, 2.0 * np.array([[0.1**3 / 3, 0.1**2 / 2], [0.1**2 / 2, 0.1]])), "Q is wrong"`,
          },
          {
            name: 'the update reduces the covariance and the innovation is right',
            assert: `import numpy as np
x = np.array([0.0, 1.0]); P = np.diag([10.0, 4.0])
H = np.array([[1.0, 0.0]]); R = np.array([[1.0]])
x2, P2, nu, S = kf_update(x, P, np.array([3.0]), H, R)
assert abs(float(nu) - 3.0) < 1e-12, "innovation is z - H@x"
assert abs(float(S) - 11.0) < 1e-12, "S = H@P@H.T + R"
assert np.trace(P2) < np.trace(P), "an update must not increase uncertainty"
assert abs(x2[0] - 3.0 * 10.0 / 11.0) < 1e-12, "scalar gain should be P/(P+R)"`,
          },
          {
            name: 'Joseph form stays symmetric positive definite under a perturbed gain',
            assert: `import numpy as np
rng = np.random.default_rng(5)
F, Q = cv_matrices(0.05, 1.0)
H = np.array([[1.0, 0.0]]); R = np.array([[0.25]])
for joseph in (True, False):
    x = np.array([0.0, 0.0]); P = np.diag([100.0, 100.0])
    ok = True
    for k in range(4000):
        x, P = kf_predict(x, P, F, Q)
        x, P, _, _ = kf_update(x, P, np.array([rng.normal(0.0, 0.5)]), H, R, joseph=joseph)
        P = P + 1e-9 * rng.standard_normal((2, 2))   # simulate round-off
        if np.min(np.linalg.eigvalsh(0.5 * (P + P.T))) <= 0:
            ok = False
            break
    if joseph:
        assert ok, "Joseph form should remain positive definite"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m34_nees',
        title: 'Prove your filter is consistent (NEES and NIS)',
        kind: 'code',
        lang: 'python',
        hours: 7,
        prompt: `Run 500 independent Monte Carlo realisations of your constant-velocity filter against truth.

1. At each step compute NEES = e.T*inv(P)*e with e = x_true - x_hat, average over runs, and plot against the two-sided 95% chi-square bounds for 500*n degrees of freedom divided by 500.
2. Compute NIS = nu.T*inv(S)*nu from the innovations, which needs no truth and can therefore be run on real flight data.
3. Now mistune: set the filter Q to 1/100 of truth, and separately to 100x truth. Plot NEES for all three cases.

Success: the nominal filter sits inside the bounds, the under-Q case rides above them (optimistic covariance), the over-Q case sits below (conservative), and you can say which of those is dangerous and why.`,
        starter: `"""Filter consistency: the only honest way to know a filter is working.

A filter that tracks well but reports a covariance three times too small is
not working. NEES needs truth, so it lives in simulation. NIS needs only the
innovations, so it can run on real flight data — which is why it is the one
that ends up in the telemetry stream.
"""

import numpy as np
from scipy.stats import chi2


def nees(x_true: np.ndarray, x_hat: np.ndarray, P: np.ndarray) -> float:
    """Normalised estimation error squared: e' P^-1 e.

    TODO: form the error, then use np.linalg.solve rather than inv — the
    covariance is often near-singular and inv will happily hand you garbage.
    """
    raise NotImplementedError


def nis(innovation: np.ndarray, S: np.ndarray) -> float:
    """Normalised innovation squared: nu' S^-1 nu.

    TODO: same shape as NEES, but it needs no truth at all.
    """
    raise NotImplementedError


def consistency_bounds(dof: int, runs: int, alpha: float = 0.05):
    """Two-sided chi-square acceptance interval for a run-averaged statistic.

    TODO: the sum over \`runs\` independent samples has runs*dof degrees of
    freedom; divide both chi2.ppf bounds by \`runs\` to compare against the
    average.
    """
    raise NotImplementedError


if __name__ == "__main__":
    lo, hi = consistency_bounds(4, 500)
    print(f"a consistent 4-state filter over 500 runs should average within [{lo:.3f}, {hi:.3f}]")
`,
        tests: [
          {
            name: 'NEES of a whitened unit error equals the state dimension',
            assert: `for n in (2, 4, 6):
    e = np.ones(n)
    assert abs(nees(e, np.zeros(n), np.eye(n)) - n) < 1e-9`,
          },
          {
            name: 'NEES is invariant to an invertible change of coordinates',
            assert: `rng = np.random.default_rng(3)
n = 4
M = rng.normal(size=(n, n)); P = M @ M.T + n*np.eye(n)
e = rng.normal(size=n)
T = rng.normal(size=(n, n)) + 3*np.eye(n)
a = nees(e, np.zeros(n), P)
b = nees(T @ e, np.zeros(n), T @ P @ T.T)
assert abs(a - b) < 1e-6 * max(1.0, a), f'{a} vs {b}'`,
          },
          {
            name: 'NIS has the same algebra but needs no truth',
            assert: `S = np.diag([4.0, 9.0])
assert abs(nis(np.array([2.0, 3.0]), S) - 2.0) < 1e-12`,
          },
          {
            name: 'the acceptance interval brackets the expected value and tightens with runs',
            assert: `lo, hi = consistency_bounds(4, 500)
assert lo < 4.0 < hi
lo2, hi2 = consistency_bounds(4, 5000)
assert (hi2 - lo2) < (hi - lo), 'more runs must tighten the band'`,
          },
          {
            name: 'an over-optimistic covariance shows up as NEES above the band',
            assert: `lo, hi = consistency_bounds(4, 500)
e = np.ones(4)
assert nees(e, np.zeros(4), np.eye(4)/100.0) > hi, 'under-Q must ride high'`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m34_divergence',
        title: 'Make it diverge, then explain it',
        kind: 'analysis',
        hours: 5,
        prompt: `Produce four distinct divergence cases and write one paragraph of diagnosis each:

1. Underestimated Q with an unmodelled constant acceleration (the classic).
2. An unobservable direction with Q = 0, so the covariance goes to zero and the filter stops listening.
3. Numerical: accumulate round-off without symmetrization and show P losing positive definiteness.
4. A measurement outlier with no gating, which corrupts the state and then shrinks the covariance around the wrong answer.

For each, identify the signature in the **innovation sequence** (mean, whiteness, magnitude relative to sqrt(S)) and give the standard remedy.`,
      },
    ],
    quiz: [
      {
        id: 'q_m34_gain',
        q: 'Derive the Kalman gain from the minimum-variance condition. What is the result?',
        choices: [
          'K = P*H.T, minimising the innovation',
          'Minimising the trace of P_plus = (I - K*H)*P_minus*(I - K*H).T + K*R*K.T with respect to K gives K = P_minus*H.T*inv(H*P_minus*H.T + R)',
          'K = inv(R)*H*P_minus',
          'K = H*P_minus*inv(R)',
        ],
        answer: 1,
        explain:
          'Write the posterior covariance for an arbitrary linear update gain K (the Joseph form, which holds for any K), take the derivative of its trace with respect to K, and set it to zero: -2*(I - K*H)*P_minus*H.T + 2*K*R = 0, which rearranges to K = P_minus*H.T*inv(H*P_minus*H.T + R). Equivalently, the orthogonality principle says the optimal estimation error must be uncorrelated with the innovation, which yields the same expression. Substituting this K into the Joseph form collapses it to P_plus = (I - K*H)*P_minus.',
        b: 1.3,
        bloom: 'apply',
      },
      {
        id: 'q_m34_notwhite',
        q: 'Your innovations are not white and average NEES sits above the chi-square bound. Name causes and fixes.',
        choices: [
          'Only one cause is possible: the measurement noise R is too large',
          'Process noise Q too small for the true dynamics (inflate Q, or add the missing state such as an acceleration or bias); an unmodelled deterministic effect such as a sensor bias or a mismodelled dynamic (augment the state); and wrong R, timing errors, or unmodelled measurement correlation (fix the time tags, model the correlation, or use a consider state)',
          'The filter is fine; NEES above the bound means the estimate is more accurate than predicted',
          'The state dimension is too large; remove states',
        ],
        answer: 1,
        explain:
          'NEES above the bound means the actual error is larger than the covariance claims — an optimistic filter, which is the dangerous direction because downstream consumers trust the covariance. Correlated innovations point to structure the filter is not modelling: a bias, a mismodelled dynamic, or a timing error that makes every residual lean the same way. The three standard remedies in order of preference are: model the effect explicitly by augmenting the state, treat it with a consider covariance, or, as a blunt instrument, inflate Q. Timing and time-tag errors are a hugely underrated cause in real navigation systems.',
        b: 1.6,
        bloom: 'analyze',
      },
      {
        id: 'q_m34_joseph',
        q: 'Why does the Joseph form cost more flops, and when is it worth it?',
        choices: [
          'It is never worth it; the simplified form is always adequate',
          'It computes (I - K*H)*P*(I - K*H).T + K*R*K.T instead of (I - K*H)*P, which is symmetric by construction and stays positive definite for ANY gain, not only the optimal one. Worth it whenever the gain is suboptimal or approximate, in low precision, with very small R or badly scaled states, and in any long-running flight filter',
          'It is a shortcut that is faster but less accurate',
          'It is only required for nonlinear filters',
        ],
        answer: 1,
        explain:
          'The simplified update is a simplification valid only at the exactly optimal gain; any deviation (round-off, a steady-state gain table, a deliberately detuned or underweighted gain, a fixed-point implementation) can make it produce a non-symmetric or indefinite P, after which the filter is meaningless. The Joseph form is a sum of two symmetric positive semi-definite terms, so symmetry and positive semi-definiteness are structural. It costs roughly twice the flops of the simplified form. Square-root and UD factorizations go further, halving the dynamic range requirement, which is why they were essential on early flight computers and remain standard in high-precision orbit determination.',
        b: 1.4,
        bloom: 'understand',
      },
      {
        id: 'q_m34_unobservable',
        q: 'What happens to the filter if the system is unobservable in one direction?',
        choices: [
          'The filter immediately diverges to infinity',
          'Along that direction the covariance never decreases from measurements; with Q = 0 it stays at its initial value forever, and with Q > 0 it grows without bound. The estimate along that direction is driven only by the prior and the dynamics, so any initial error there is never corrected',
          'The Kalman gain grows to compensate',
          'The state estimate becomes exactly zero in that direction',
        ],
        answer: 1,
        explain:
          'Measurements only reduce covariance in directions the measurement Jacobian actually spans. The classic aerospace instance is a constant accelerometer bias in the direction of gravity for a stationary vehicle, or gyro bias about the line of sight to a single star: formally unobservable, so the covariance in that direction is governed entirely by Q. Two operational consequences: the covariance report tells you this if you look at its eigenvectors, and adding Q to an unobservable state makes it grow forever, which will eventually make the filter ignore good measurements in the observable directions through gain coupling.',
        b: 1.5,
        bloom: 'analyze',
      },
      {
        id: 'q_m34_gain_zero',
        q: 'Physically, what does it mean when the Kalman gain goes to zero?',
        choices: [
          'The measurement is perfect and fully trusted',
          'The filter has stopped listening to measurements: either its own prediction is far more certain than the measurement (P*H.T small relative to R), or the covariance has collapsed. If the collapse is not justified by the real accuracy this is smugness, and the filter will ignore even correct data — the canonical divergence mode',
          'The state has become unobservable and the filter is compensating',
          'The process noise has grown too large',
        ],
        answer: 1,
        explain:
          'K = P*H.T*inv(H*P*H.T + R) is a trust ratio: prediction confidence in the numerator, total innovation variance in the denominator. Zero gain means the filter believes its prediction completely. That is correct when the measurement really is comparatively poor, and catastrophic when the covariance shrank for the wrong reason — too little Q, unmodelled dynamics, or a stale model. The symptom is large innovations relative to sqrt(S) with a covariance that keeps claiming tiny errors. Fading memory, Q inflation, or a lower bound on P are the standard defences.',
        b: 1.2,
        bloom: 'understand',
      },
    ],
    cards: [
      {
        id: 'c_m34_model',
        front: 'The discrete stochastic model',
        back: 'x[k+1] = F*x[k] + G*u[k] + w[k], z[k] = H*x[k] + v[k], with w ~ N(0, Q), v ~ N(0, R), both white and mutually uncorrelated.',
        formula: true,
      },
      {
        id: 'c_m34_predict',
        front: 'Kalman filter PREDICT step',
        back: 'x_minus = F*x_plus + G*u; P_minus = F*P_plus*F.T + Q. The covariance always grows in prediction.',
        formula: true,
      },
      {
        id: 'c_m34_update',
        front: 'Kalman filter UPDATE step',
        back: 'nu = z - H*x_minus; S = H*P_minus*H.T + R; K = P_minus*H.T*inv(S); x_plus = x_minus + K*nu; P_plus = (I - K*H)*P_minus.',
        formula: true,
      },
      {
        id: 'c_m34_gain_meaning',
        front: 'The Kalman gain as a trust ratio',
        back: 'K = P*H.T*inv(H*P*H.T + R). Large P or small R means trust the measurement; small P or large R means trust the prediction. In the scalar case K = P/(P + R).',
        formula: true,
      },
      {
        id: 'c_m34_innovation',
        front: 'Innovation and innovation covariance',
        back: 'nu = z - H*x_minus with covariance S = H*P_minus*H.T + R. For a consistent filter the innovation sequence is zero-mean, white, and has covariance exactly S.',
        formula: true,
      },
      {
        id: 'c_m34_joseph',
        front: 'Joseph form covariance update',
        back: 'P_plus = (I - K*H)*P_minus*(I - K*H).T + K*R*K.T. Valid for ANY gain, symmetric and positive semi-definite by construction. Roughly 2x the flops, and worth it in flight code.',
        formula: true,
      },
      {
        id: 'c_m34_nees',
        front: 'NEES (normalized estimation error squared)',
        back: 'NEES = (x_true - x_hat).T * inv(P) * (x_true - x_hat). For a consistent filter its expectation is n, the state dimension, and it is chi-square with n degrees of freedom. Requires truth, so it is a simulation test.',
        formula: true,
      },
      {
        id: 'c_m34_nis',
        front: 'NIS (normalized innovation squared)',
        back: 'NIS = nu.T * inv(S) * nu, expectation equals the measurement dimension m, chi-square with m degrees of freedom. Needs NO truth, so it runs on real flight data — the consistency test you can actually fly.',
        formula: true,
      },
      {
        id: 'c_m34_consistency',
        front: 'Reading a consistency test',
        back: 'Average NEES above the bound means the filter is OPTIMISTIC (real error exceeds the claimed covariance) — the dangerous direction. Below the bound means it is conservative: safe but wasting information.',
      },
      {
        id: 'c_m34_q_tuning',
        front: 'What process noise Q really represents',
        back: 'Everything the dynamics model leaves out. Too small: the covariance collapses, the gain goes to zero, the filter ignores data and diverges. Too large: the estimate chases noise. Q is the primary tuning knob.',
      },
      {
        id: 'c_m34_riccati',
        front: 'The covariance recursion is a Riccati equation',
        back: 'P_minus[k+1] = F*(P_minus - P_minus*H.T*inv(H*P_minus*H.T + R)*H*P_minus)*F.T + Q. Its steady state is the dual of the LQR DARE — the same equation with A.T, C.T, Q and R exchanged.',
        formula: true,
      },
      {
        id: 'c_m34_divergence',
        front: 'The five causes of filter divergence',
        back: 'Underestimated Q; unmodelled dynamics or biases; unobservable states; numerical loss of symmetry or positive definiteness; and unrejected measurement outliers. Remedies: augment the state, inflate Q or fade memory, symmetrize, use Joseph or square-root forms, and gate measurements.',
      },
      {
        id: 'c_m34_gating',
        front: 'Measurement gating',
        back: 'Accept a measurement only if nu.T*inv(S)*nu < gamma, with gamma from the chi-square table (about 9 for 1 degree of freedom at 3 sigma). Always count and telemeter rejections — a rising rejection rate is an early warning.',
        formula: true,
      },
      {
        id: 'c_m34_info',
        front: 'Information filter form',
        back: 'Propagate Y = inv(P) and y = Y*x. Updates become simple additions: Y_plus = Y_minus + H.T*inv(R)*H. Ideal for fusing many sensors and for expressing no prior information at all (Y = 0).',
        formula: true,
      },
      {
        id: 'c_m34_rts',
        front: 'Rauch-Tung-Striebel smoother',
        back: 'A backward recursion over a stored forward pass: x_smooth[k] = x_plus[k] + C[k]*(x_smooth[k+1] - x_minus[k+1]) with C[k] = P_plus[k]*F.T*inv(P_minus[k+1]). Offline only, but strictly better than the filter estimate everywhere except the last sample.',
        formula: true,
      },
      {
        id: 'c_m34_schmidt',
        front: 'Schmidt-Kalman (consider) filter',
        back: 'Carry a nuisance parameter in the covariance so its uncertainty correctly inflates the estimate, but do not update it. Used for poorly observable biases where estimating them would destabilize the filter.',
      },
    ],
    tags: ['interview'],
    importance: 1.5,
  },

  {
    id: 't4_m35_nonlinear_filters',
    track: 'gnc',
    tier: 4,
    title: 'EKF, UKF, Particle Filters & Error-State Filters',
    summary:
      'Take the Kalman filter off the linear-Gaussian reservation: linearize it (EKF), sigma-point it (UKF), sample it (particle filter), or put it on a manifold (MEKF/ESKF). You will implement a multiplicative EKF that estimates attitude and gyro bias, and be able to explain precisely why a unit quaternion cannot live in an additive Kalman state.',
    prereqs: ['t4_m34_kalman_filter', 't1_m16_attitude_representations'],
    hours: 75,
    topics: [
      'The Extended Kalman Filter: linearization about the current estimate, Jacobians F and H, first-order truncation error',
      'Continuous-discrete EKF and the iterated EKF',
      'When and why the EKF diverges',
      'The Unscented Kalman Filter: the unscented transform, sigma point selection (alpha, beta, kappa), the square-root UKF',
      'Why the UKF beats the EKF for strong nonlinearity, and the cost comparison',
      'The cubature Kalman filter',
      'Particle filters: sequential importance sampling, resampling, degeneracy and sample impoverishment',
      'When a particle filter is genuinely required: multi-modal and non-Gaussian posteriors',
      'Gaussian sum filters',
      'The error-state (indirect) Kalman filter: why the error state is small and nearly linear, injection and reset, the Jacobian of the reset',
      'The Multiplicative EKF for attitude: the 3-parameter attitude error, covariance on the tangent space',
      'On-manifold and invariant EKF (IEKF), equivariant filtering',
      'Consider states and bias augmentation',
      'Multiple-model and IMM filters',
    ],
    objectives: [
      'Implement an EKF and a UKF on the same problem and compare accuracy, consistency and cost',
      'Implement a MEKF that fuses a gyro with vector observations and estimates gyro bias',
      'Explain why quaternion states demand a multiplicative formulation and what the reset step does to the covariance',
      'Identify the situations where only a particle filter will do, and its practical limitation',
    ],
    resources: [
      {
        title: 'Kalman and Bayesian Filters in Python — EKF, UKF and PF chapters',
        author: 'Roger Labbe',
        kind: 'book',
        url: 'https://github.com/rlabbe/Kalman-and-Bayesian-Filters-in-Python',
        free: true,
      },
      { title: 'Optimal State Estimation, Ch. 13-15', author: 'Dan Simon', kind: 'book', free: false },
      {
        title: 'Fundamentals of Spacecraft Attitude Determination and Control, Ch. 6',
        author: 'Markley & Crassidis',
        kind: 'book',
        free: false,
        note: 'The canonical MEKF treatment.',
      },
      {
        title: 'Quaternion kinematics for the error-state Kalman filter',
        author: 'Joan Sola',
        kind: 'paper',
        url: 'https://arxiv.org/abs/1711.02508',
        free: true,
        note: 'The single most practical document on error-state filtering with IMUs. Precise, complete, and implementable.',
      },
      { title: 'Optimal Estimation of Dynamic Systems, Ch. 7', author: 'Crassidis & Junkins', kind: 'book', free: false },
      {
        title: 'The Unscented Kalman Filter for Nonlinear Estimation',
        author: 'Wan & van der Merwe',
        kind: 'paper',
        free: true,
      },
      {
        title: 'Invariant EKF papers',
        author: 'Barrau & Bonnabel',
        kind: 'paper',
        free: true,
        note: 'Group-affine systems, log-linear error dynamics, and why the IEKF has convergence properties the EKF lacks.',
      },
      {
        title: 'MATLAB Tech Talk — Understanding the Particle Filter',
        kind: 'video',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'ex_m35_ekf_vs_ukf',
        title: 'EKF vs UKF on bearings-only tracking',
        kind: 'code',
        lang: 'python',
        hours: 9,
        prompt: `Classic hard problem: a stationary observer measures only the bearing to a constant-velocity target. The measurement is strongly nonlinear in the state and the geometry is weakly observable without an observer manoeuvre.

1. Implement an EKF with an analytic Jacobian.
2. Implement a UKF with the scaled unscented transform (alpha = 1e-3, beta = 2, kappa = 0).
3. Run 300 Monte Carlo trials. Report position RMSE, average NEES, and divergence rate (fraction of runs whose error exceeds 5 sigma) for both.
4. Repeat with an observer manoeuvre partway through and show the observability change.

Success: the UKF has a lower divergence rate, you can quantify the cost ratio (2n+1 propagations vs one propagation plus a Jacobian), and you can state which nonlinearity characteristic decides between them.`,
        starter: `import numpy as np


def sigma_points(x, P, alpha=1e-3, beta=2.0, kappa=0.0):
    """Scaled unscented transform sigma points.

    Returns (chi, Wm, Wc) with chi of shape (2n+1, n).
    lambda_ = alpha**2 * (n + kappa) - n
    """
    raise NotImplementedError


def unscented_transform(chi, Wm, Wc, noise_cov=None):
    """Reconstruct (mean, covariance) from propagated sigma points."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'sigma point weights sum correctly',
            assert: `import numpy as np
x = np.array([1.0, -2.0, 0.5]); P = np.diag([4.0, 1.0, 0.25])
chi, Wm, Wc = sigma_points(x, P)
assert chi.shape == (7, 3), "expected 2n+1 = 7 sigma points"
assert abs(np.sum(Wm) - 1.0) < 1e-9, "mean weights must sum to 1"`,
          },
          {
            name: 'the unscented transform reproduces mean and covariance exactly for a linear map',
            assert: `import numpy as np
rng = np.random.default_rng(1)
A = rng.standard_normal((3, 3))
x = np.array([1.0, -2.0, 0.5]); P = np.array([[4.0, 0.5, 0.1], [0.5, 1.0, -0.2], [0.1, -0.2, 0.25]])
chi, Wm, Wc = sigma_points(x, P)
y = chi @ A.T
m, C = unscented_transform(y, Wm, Wc)
assert np.allclose(m, A @ x, atol=1e-8), "UT must be exact for a linear map"
assert np.allclose(C, A @ P @ A.T, atol=1e-7), "UT covariance must be exact for a linear map"`,
          },
          {
            name: 'the transform is exact to second order for a quadratic',
            assert: `import numpy as np
x = np.array([2.0]); P = np.array([[0.5]])
chi, Wm, Wc = sigma_points(x, P, alpha=1.0, kappa=2.0)
y = chi ** 2
m, C = unscented_transform(y, Wm, Wc)
# E[x^2] = mu^2 + sigma^2 = 4.5
assert abs(float(m) - 4.5) < 1e-8, "UT should capture the second-order mean shift a first-order EKF misses"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m35_mekf',
        title: 'A MEKF for attitude and gyro bias',
        kind: 'code',
        lang: 'python',
        hours: 12,
        prompt: `Build a multiplicative EKF with a 6-element error state: three-axis attitude error (small-angle rotation vector) and three-axis gyro bias.

Nominal state: a unit quaternion plus a bias vector, propagated with the gyro measurement.
Error state: delta_theta and delta_b, propagated with the standard linearised model.
Measurements: a sun vector and a magnetometer vector, each with its own noise covariance.

Steps:
1. Propagate the quaternion with the bias-corrected gyro (use the exact rotation-vector exponential, not an Euler step).
2. Propagate the 6x6 covariance with the ARW and rate-random-walk spectral densities.
3. Update with the two vector measurements; the Jacobian of a rotated reference vector with respect to delta_theta is the skew-symmetric matrix of the predicted body vector.
4. **Inject** the correction multiplicatively into the quaternion, add the bias correction, and **reset** the error state to zero.

Success: bias converges to within 3 sigma of truth, attitude error stays inside the covariance, and NEES over 200 runs is consistent.`,
        starter: `import numpy as np


def skew(v):
    """3x3 skew-symmetric cross-product matrix."""
    raise NotImplementedError


def quat_from_rotvec(theta):
    """Unit quaternion [w, x, y, z] from a rotation vector (exact, not small-angle)."""
    raise NotImplementedError


def mekf_propagate(q, b, P, omega_meas, dt, arw_var, rrw_var):
    """Propagate nominal quaternion, bias, and the 6x6 error covariance.

    Error state ordering: [delta_theta (3), delta_b (3)].
    """
    raise NotImplementedError


def mekf_update(q, b, P, v_body, v_ref, R):
    """Vector-measurement update. Returns (q, b, P) after injection and reset."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'skew and rotation-vector exponential are correct',
            assert: `import numpy as np
v = np.array([1.0, 2.0, 3.0]); u = np.array([-0.5, 0.25, 4.0])
assert np.allclose(skew(v) @ u, np.cross(v, u), atol=1e-12), "skew(v)@u must equal cross(v,u)"
q = quat_from_rotvec(np.array([0.0, 0.0, np.pi / 2]))
assert abs(q[0] - np.cos(np.pi / 4)) < 1e-12 and abs(q[3] - np.sin(np.pi / 4)) < 1e-12, "90 deg about z"
assert abs(np.linalg.norm(quat_from_rotvec(np.array([1e-9, 0.0, 0.0]))) - 1.0) < 1e-14, "must stay unit norm for tiny angles"`,
          },
          {
            name: 'the quaternion stays unit norm through propagation',
            assert: `import numpy as np
q = np.array([1.0, 0.0, 0.0, 0.0]); b = np.zeros(3); P = np.eye(6) * 1e-4
for _ in range(2000):
    q, b, P = mekf_propagate(q, b, P, np.array([0.01, -0.02, 0.005]), 0.01, 1e-9, 1e-12)
assert abs(np.linalg.norm(q) - 1.0) < 1e-9, "renormalise the nominal quaternion"
assert np.allclose(P, P.T, atol=1e-12), "covariance must stay symmetric"`,
          },
          {
            name: 'the error state is reset to zero after injection',
            assert: `import numpy as np
q = np.array([1.0, 0.0, 0.0, 0.0]); b = np.zeros(3); P = np.eye(6) * 1e-3
v_ref = np.array([0.0, 0.0, 1.0])
v_body = np.array([0.02, 0.0, np.sqrt(1 - 0.02 ** 2)])
q2, b2, P2 = mekf_update(q, b, P, v_body, v_ref, np.eye(3) * 1e-4)
assert abs(np.linalg.norm(q2) - 1.0) < 1e-12, "injected quaternion must be unit norm"
assert np.trace(P2[:3, :3]) < np.trace(P[:3, :3]), "the attitude covariance must shrink"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m35_pf',
        title: 'A particle filter for bimodal terrain matching',
        kind: 'code',
        lang: 'python',
        hours: 7,
        prompt: `A vehicle flies over terrain whose height profile has two similar valleys. A radar altimeter measures height above ground.

1. Implement a bootstrap particle filter with systematic resampling and an effective-sample-size trigger.
2. Show the posterior is genuinely bimodal for the first part of the flight and that a single-Gaussian EKF locks onto the wrong mode roughly half the time.
3. Plot effective sample size against time and demonstrate sample impoverishment when you resample every step with no roughening.

Success: the particle filter resolves the ambiguity once the terrain becomes distinctive, and you can state the practical killer of particle filters for high-dimensional navigation states.`,
        starter: `"""A bootstrap particle filter, and the two failure modes that bite.

Terrain matching over two similar valleys is genuinely bimodal for a while. A
single-Gaussian filter has to pick one mode and will sometimes pick wrong; a
particle filter can carry both until the terrain disambiguates.
"""

import numpy as np


def effective_sample_size(w: np.ndarray) -> float:
    """ESS = 1 / sum(w^2) for weights that sum to one.

    TODO: normalise first, then one line. ESS near N means the cloud is
    healthy; ESS near 1 means a single particle carries all the weight.
    """
    raise NotImplementedError


def systematic_resample(w: np.ndarray, u: float) -> np.ndarray:
    """Systematic resampling. Returns the chosen parent indices.

    \`u\` is a single draw from [0, 1) — systematic resampling uses exactly one
    random number for the whole cloud, which is why it has lower variance than
    drawing N times independently.

    TODO: build the cumulative sum, then walk positions (arange(N) + u)/N
    through it with np.searchsorted.
    """
    raise NotImplementedError


def roughen(particles: np.ndarray, scale: float, rng) -> np.ndarray:
    """Add a little jitter after resampling to fight sample impoverishment.

    TODO: add zero-mean Gaussian noise of the given scale. Without this, every
    particle eventually becomes a copy of one ancestor.
    """
    raise NotImplementedError


if __name__ == "__main__":
    w = np.array([0.7, 0.2, 0.05, 0.05])
    print("ESS =", effective_sample_size(w), "of", len(w))
    print("parents =", systematic_resample(w, 0.5))
`,
        tests: [
          {
            name: 'uniform weights give the largest possible ESS',
            assert: `for n in (4, 16, 100):
    assert abs(effective_sample_size(np.ones(n)/n) - n) < 1e-9`,
          },
          {
            name: 'a degenerate cloud collapses to an ESS of one',
            assert: `w = np.zeros(50); w[7] = 1.0
assert abs(effective_sample_size(w) - 1.0) < 1e-9`,
          },
          {
            name: 'ESS ignores the scale of unnormalised weights',
            assert: `w = np.array([3.0, 1.0, 1.0, 1.0])
assert abs(effective_sample_size(w) - effective_sample_size(w*17.0)) < 1e-9`,
          },
          {
            name: 'systematic resampling returns exactly N valid parents',
            assert: `w = np.array([0.7, 0.2, 0.05, 0.05])
idx = systematic_resample(w, 0.31)
assert len(idx) == 4 and idx.min() >= 0 and idx.max() < 4`,
          },
          {
            name: 'a dominant particle is resampled roughly in proportion to its weight',
            assert: `w = np.array([0.7, 0.2, 0.05, 0.05])
idx = systematic_resample(w, 0.5)
assert int((idx == 0).sum()) == 3, f'expected 3 copies of the heavy particle, got {list(idx)}'`,
            hidden: true,
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q_m35_quaternion_state',
        q: 'Why can a unit quaternion not simply be a state in an additive Kalman filter, and what does the MEKF do instead?',
        choices: [
          'Because quaternions have four components and the Kalman filter requires three',
          'Because the unit quaternions form a 3-dimensional manifold embedded in R4: an additive update x + K*nu leaves the constraint ||q|| = 1, and the 4x4 covariance is necessarily singular along the radial direction. The MEKF keeps the quaternion as a nominal reference, estimates a 3-parameter attitude ERROR in the tangent space with a nonsingular 3x3 covariance, and injects it multiplicatively as q = delta_q(x) * q_nominal, then resets the error to zero',
          'Because quaternion multiplication is not commutative',
          'Because quaternions suffer from gimbal lock',
        ],
        answer: 1,
        explain:
          'The core issue is that attitude lives on a group, not a vector space. Adding a correction to a unit quaternion produces something off the unit sphere; renormalising afterwards is an unmodelled nonlinear operation that makes the covariance wrong. The 4x4 covariance also has a null direction along q itself, since motion in that direction is physically meaningless, which means the filter is estimating a quantity with a structurally singular covariance. The MEKF resolves both problems by separating a nominal (large, on-manifold) part from an error (small, in the tangent space at the nominal). The tangent space is genuinely 3-dimensional, the error stays small so linearization is excellent, and the injection keeps the nominal exactly on the manifold.',
        b: 1.7,
        bloom: 'understand',
      },
      {
        id: 'q_m35_ekf_ukf',
        q: 'Which characteristic decides between an EKF and a UKF, and what is the cost ratio?',
        choices: [
          'The state dimension; UKF is preferred for small states only',
          'How well a first-order Taylor expansion represents the transformation across the spread of the current covariance. When the nonlinearity has significant curvature over a few sigma, the EKF mean and covariance are biased and the UKF, which is accurate to second order for any nonlinearity, wins. Cost is roughly 2n+1 function evaluations per step against one evaluation plus a Jacobian, so within a small factor for moderate n',
          'Whether the noise is Gaussian; the UKF does not assume Gaussianity',
          'Whether the measurement model is linear; the EKF cannot handle nonlinear measurements',
        ],
        answer: 1,
        explain:
          'Both filters assume a Gaussian posterior; the UKF is not a non-Gaussian filter. The difference is purely in how the Gaussian is pushed through the nonlinearity. The EKF uses a single linearization at the mean, which is accurate to first order and systematically biased when the function curves over the covariance spread. The unscented transform propagates deterministic sample points and captures the mean to third order and the covariance to second order for any nonlinearity. The UKF also needs no Jacobians, which matters enormously when the model is complicated or supplied as code you did not write. Its costs are 2n+1 propagations, a matrix square root per step, and tuning parameters (alpha, beta, kappa) that can produce non-positive-definite covariance if set carelessly.',
        b: 1.5,
        bloom: 'analyze',
      },
      {
        id: 'q_m35_reset',
        q: 'What is the reset step in an error-state Kalman filter and why must a Jacobian be applied to the covariance?',
        choices: [
          'Reset simply zeroes the error state; no covariance change is needed',
          'After the error estimate is injected into the nominal state, the error state is set to zero, which re-anchors the tangent space at the NEW nominal. Because the map from the old error coordinates to the new ones is not the identity, the covariance must be transformed by the Jacobian of that reset map, G = I - skew(0.5*delta_theta) for the attitude block',
          'Reset reinitialises the covariance to its initial value',
          'The Jacobian is applied to the state, not the covariance',
        ],
        answer: 1,
        explain:
          'The error state parameterises a perturbation relative to a specific nominal. Once the nominal moves, the same physical uncertainty is described by different coordinates, so the covariance must be pushed through the change of coordinates. For attitude, the reset Jacobian is G = I - skew(0.5*delta_theta) (equivalently the left Jacobian of the exponential map to first order), and P is updated as G*P*G.T. The correction is second order in the error, so implementations that omit it often still work; but it matters for consistency in high-accuracy filters and it is a favourite interview detail because it shows whether you understand what the error state IS.',
        b: 2.0,
        bloom: 'analyze',
      },
      {
        id: 'q_m35_pf',
        q: 'When is a particle filter the only correct choice, and what is its practical killer?',
        choices: [
          'Whenever the dynamics are nonlinear; its killer is numerical instability',
          'When the posterior is genuinely multi-modal or strongly non-Gaussian — terrain-referenced navigation over ambiguous terrain, initial lost-in-space localisation, data association ambiguity. Its killer is the curse of dimensionality: the number of particles needed grows exponentially with the effective state dimension, so it is impractical beyond roughly a handful of dimensions unless you Rao-Blackwellise',
          'When the measurement rate is very high; its killer is compute cost per measurement',
          'When the noise is coloured; its killer is resampling',
        ],
        answer: 1,
        explain:
          'A Gaussian filter of any flavour represents the posterior with one mean and one covariance, so it cannot represent two competing hypotheses — it averages them, landing in a place neither hypothesis supports, or it locks arbitrarily onto one. A particle filter represents an arbitrary distribution by samples and handles this naturally. The price is that sample-based representation of a high-dimensional density needs exponentially many samples; in practice people Rao-Blackwellise, sampling only the few nonlinear or ambiguous dimensions and running an analytic Kalman filter conditioned on each sample. Degeneracy (all weight on one particle) and impoverishment after aggressive resampling are the other standard failure modes, handled by effective-sample-size triggered resampling and roughening.',
        b: 1.6,
        bloom: 'understand',
      },
      {
        id: 'q_m35_iekf',
        q: 'What does the invariant EKF buy you over a conventional EKF for navigation on a matrix Lie group?',
        choices: [
          'Lower computational cost',
          'For group-affine dynamics, the error defined in a left- or right-invariant sense obeys a log-linear equation whose propagation is independent of the estimated state. That removes a major source of EKF inconsistency — Jacobians that depend on the estimate and so bake in the estimate own errors — and yields provable local convergence with a larger domain of attraction',
          'It removes the need for measurements',
          'It handles non-Gaussian noise exactly',
        ],
        answer: 1,
        explain:
          'A classical EKF linearizes about the current estimate, so its error propagation depends on that estimate. If the estimate is wrong the propagation is wrong in a way that correlates with the error, and the filter can become inconsistent — notably by acquiring spurious information about unobservable directions, which is the well-documented failure in visual-inertial odometry. Barrau and Bonnabel showed that for group-affine systems the invariant error obeys an autonomous, state-independent log-linear equation, so the propagated Jacobian is exact regardless of estimation error. The practical payoff is better consistency and a larger convergence basin; the MEKF is essentially the attitude-only special case of the same idea.',
        b: 2.3,
        bloom: 'analyze',
      },
    ],
    cards: [
      {
        id: 'c_m35_ekf',
        front: 'EKF in one line',
        back: 'Run the Kalman equations with F = df/dx and H = dh/dx evaluated at the current estimate, but propagate the MEAN through the nonlinear functions f and h, not through the Jacobians.',
        formula: true,
      },
      {
        id: 'c_m35_ekf_fail',
        front: 'When the EKF fails',
        back: 'When the nonlinearity has significant curvature over the covariance spread, when the initial error is large, or when the Jacobian is evaluated at a bad estimate. The failure is biased mean and optimistic covariance, and it compounds.',
      },
      {
        id: 'c_m35_ut',
        front: 'Unscented transform',
        back: '2n+1 deterministic sigma points at the mean and at plus/minus the columns of the scaled matrix square root of P. Propagate each through the true nonlinear function, then recombine with weights. No Jacobians needed.',
        formula: true,
      },
      {
        id: 'c_m35_sigma_params',
        front: 'UKF tuning parameters',
        back: 'alpha sets the spread (typically 1e-3 to 1), kappa is usually 0 or 3-n, beta = 2 is optimal for a Gaussian prior. lambda = alpha^2*(n + kappa) - n. Careless values give negative weights and an indefinite covariance — use the square-root UKF.',
        formula: true,
      },
      {
        id: 'c_m35_ut_accuracy',
        front: 'UKF accuracy claim',
        back: 'The unscented transform captures the posterior mean to third order and the covariance to second order for ANY nonlinearity, against first order for the EKF. Cost: 2n+1 model evaluations plus a matrix square root per step.',
      },
      {
        id: 'c_m35_eskf',
        front: 'Error-state (indirect) Kalman filter',
        back: 'Split the state into a large nominal part integrated nonlinearly and a small error estimated by the filter. The error stays near zero, so its linearization is excellent and its dynamics are slow and well conditioned.',
      },
      {
        id: 'c_m35_inject_reset',
        front: 'Injection and reset',
        back: 'Inject: fold the estimated error into the nominal (multiplicatively for attitude, additively for position and bias). Reset: zero the error state and transform the covariance by the reset Jacobian G, P <- G*P*G.T.',
        formula: true,
      },
      {
        id: 'c_m35_reset_jac',
        front: 'Attitude reset Jacobian',
        back: 'G = I - skew(0.5*delta_theta) for the attitude block. Second order in the error, so often omitted — but required for a consistent high-accuracy filter.',
        formula: true,
      },
      {
        id: 'c_m35_mekf',
        front: 'MEKF error definition',
        back: 'q_true = delta_q(delta_theta) * q_nominal, with delta_q approximately [1, 0.5*delta_theta]. The filter state is the 3-vector delta_theta, whose covariance is a well-conditioned 3x3.',
        formula: true,
      },
      {
        id: 'c_m35_vector_jac',
        front: 'Measurement Jacobian for a rotated reference vector',
        back: 'With the predicted body vector v_hat = A(q)*r, the Jacobian with respect to delta_theta is skew(v_hat) (sign depends on the error convention). Memorise the convention you use and never mix two.',
        formula: true,
      },
      {
        id: 'c_m35_why_multiplicative',
        front: 'The one-sentence answer on quaternion states',
        back: 'A unit quaternion lives on a 3-dimensional manifold in R4, so an additive update breaks the norm constraint and the 4x4 covariance is singular along the radial direction. Estimate the error in the tangent space instead.',
      },
      {
        id: 'c_m35_pf',
        front: 'Bootstrap particle filter loop',
        back: 'Propagate each particle through the dynamics with sampled noise, weight by the measurement likelihood, normalise, and resample when the effective sample size drops below a threshold (often N/2).',
      },
      {
        id: 'c_m35_ess',
        front: 'Effective sample size',
        back: 'N_eff = 1 / sum of the squared normalised weights. It falls to 1 when one particle holds all the weight (degeneracy). Resample on N_eff, not every step, and add roughening to avoid impoverishment.',
        formula: true,
      },
      {
        id: 'c_m35_pf_curse',
        front: 'The practical killer of particle filters',
        back: 'Particle count needed grows exponentially with effective state dimension. Beyond a handful of dimensions you must Rao-Blackwellise: sample only the ambiguous dimensions, run an analytic Kalman filter for the rest.',
      },
      {
        id: 'c_m35_imm',
        front: 'IMM filter',
        back: 'Run a bank of filters for different motion models, mix their estimates each step according to a Markov transition matrix over models, and combine by model probability. Standard for manoeuvring-target tracking.',
      },
      {
        id: 'c_m35_iekf',
        front: 'Invariant EKF, one line',
        back: 'Define the error on the Lie group (left- or right-invariant). For group-affine dynamics the error propagation is log-linear and independent of the estimate, which removes a major source of EKF inconsistency.',
      },
    ],
    tags: ['interview'],
    importance: 1.5,
  },

  {
    id: 't4_m36_inertial_navigation',
    track: 'gnc',
    tier: 4,
    title: 'Inertial Navigation & IMU Mechanization',
    summary:
      'Write a strapdown mechanization that survives contact with a real IMU: coning and sculling corrections, Allan variance characterisation, and a 15-state error-state INS/GNSS filter. You will be able to predict free-inertial drift from a gyro bias spec and explain what the Schuler period actually bounds.',
    prereqs: ['t4_m35_nonlinear_filters', 't1_m15_rotating_frames', 't1_m17_attitude_kinematics'],
    hours: 70,
    topics: [
      'Accelerometer and gyroscope physics: MEMS, fiber optic, ring laser, hemispherical resonator',
      'IMU error models: turn-on and in-run bias, scale factor, non-orthogonality and misalignment, g-sensitivity, quantization',
      'Angle random walk, velocity random walk, rate random walk, and bias instability',
      'Allan variance for IMU characterization; temperature effects and calibration',
      'Strapdown mechanization in ECI, ECEF and local-level (NED) frames',
      'Attitude update, velocity update with Coriolis and gravity, position update',
      'Coning and sculling corrections and multi-sample algorithms',
      'The Schuler oscillation and why it bounds unaided INS horizontal error',
      'Free-inertial error propagation: how position error grows with time from each error source',
      'Initial alignment: coarse leveling, gyrocompassing, fine alignment via Kalman filter, transfer and in-flight alignment',
      'INS/GNSS integration architectures: loosely, tightly, and ultra-tightly (deeply) coupled',
      'Error-state filter formulation for INS: the 15-state and 21-state models',
      'Lever arm compensation, zero-velocity updates, vibration rectification',
    ],
    objectives: [
      'Implement a full strapdown mechanization and validate free-inertial drift against theory',
      'Compute an Allan deviation from IMU data and read off angle random walk and bias instability',
      'Build a 15-state error-state INS/GNSS filter and demonstrate it during simulated GNSS outages',
      'Explain the Schuler period physically and predict position error growth from a gyro bias spec',
    ],
    resources: [
      {
        title: 'Principles of GNSS, Inertial, and Multisensor Integrated Navigation Systems (2nd ed.)',
        author: 'Paul Groves',
        kind: 'book',
        free: false,
        note: 'The single best book for this module: full mechanization equations and every integration architecture.',
      },
      {
        title: 'Strapdown Inertial Navigation Technology (2nd ed.)',
        author: 'Titterton & Weston',
        kind: 'book',
        free: false,
        note: 'Sensor technology, testing and calibration, mechanization, alignment.',
      },
      { title: 'Aided Navigation: GPS with High Rate Sensors', author: 'Jay Farrell', kind: 'book', free: false },
      {
        title: 'Strapdown Analytics (2nd ed.)',
        author: 'Paul Savage',
        kind: 'book',
        free: false,
        note: 'The definitive coning and sculling algorithms.',
      },
      {
        title: 'Quaternion kinematics for the error-state Kalman filter',
        author: 'Joan Sola',
        kind: 'paper',
        url: 'https://arxiv.org/abs/1711.02508',
        free: true,
      },
      {
        title: 'IEEE Std 952 — Fiber Optic Gyro test and specification',
        kind: 'docs',
        free: false,
        note: 'Where the Allan variance conventions come from.',
      },
      {
        title: 'MATLAB Tech Talk — Fusing a Mag, Accel, and Gyro to Estimate Orientation',
        kind: 'video',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'ex_m36_strapdown',
        title: 'Strapdown mechanization in NED',
        kind: 'code',
        lang: 'python',
        hours: 12,
        prompt: `Implement a full local-level strapdown mechanization:

1. **Attitude**: integrate body-to-NED using the bias-corrected gyro, subtracting the transport rate and Earth rate.
2. **Velocity**: v_dot = C_bn * f_b - (2*w_ie + w_en) x v + g, with the normal-gravity model.
3. **Position**: latitude, longitude and height from velocity using the meridian and transverse radii of curvature.

Validate against three analytic cases: a stationary IMU at a known latitude (velocity must stay near zero and the Schuler oscillation must appear with bias injected), a pure vertical drop with no rotation, and a constant-rate turntable.

Success: stationary drift matches the theoretical prediction for your injected bias, and the Schuler period comes out at 84.4 minutes.`,
        starter: `import numpy as np

WGS84_A = 6378137.0
WGS84_E2 = 6.69437999014e-3
OMEGA_IE = 7.292115e-5   # rad/s


def radii_of_curvature(lat):
    """Return (R_meridian, R_transverse) at geodetic latitude lat in radians."""
    raise NotImplementedError


def earth_rate_ned(lat):
    """Earth rotation rate resolved in NED: [cos(lat), 0, -sin(lat)] * OMEGA_IE."""
    raise NotImplementedError


def transport_rate_ned(v_ned, lat, h):
    """Rate of the NED frame relative to Earth, resolved in NED."""
    raise NotImplementedError


def mechanize(C_bn, v_ned, lat, lon, h, f_b, w_ib_b, dt):
    """One strapdown step. Returns (C_bn, v_ned, lat, lon, h)."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'radii of curvature at the equator and pole',
            assert: `import numpy as np
Rm, Rt = radii_of_curvature(0.0)
assert abs(Rt - WGS84_A) < 1e-6, "transverse radius at the equator is the semi-major axis"
assert Rm < Rt, "the meridian radius is smaller at the equator"
Rm_p, Rt_p = radii_of_curvature(np.pi / 2)
assert abs(Rm_p - Rt_p) < 1e-3, "at the pole both radii equal the polar radius of curvature"`,
          },
          {
            name: 'Earth rate has the right magnitude and sign',
            assert: `import numpy as np
w = earth_rate_ned(np.radians(45.0))
assert abs(np.linalg.norm(w) - OMEGA_IE) < 1e-15, "magnitude must be the sidereal rate"
assert w[0] > 0 and w[2] < 0, "north component positive, down component negative in the northern hemisphere"`,
          },
          {
            name: 'a stationary perfect IMU does not drift',
            assert: `import numpy as np
lat0 = np.radians(28.5)
C = np.eye(3); v = np.zeros(3); lat, lon, h = lat0, 0.0, 0.0
g = 9.7803253359 * (1 + 0.001931853 * np.sin(lat0) ** 2) / np.sqrt(1 - WGS84_E2 * np.sin(lat0) ** 2)
f_b = np.array([0.0, 0.0, -g])          # specific force of a body at rest
w_ib_b = earth_rate_ned(lat0)           # a level, north-aligned IMU senses Earth rate
for _ in range(60000):                   # 10 minutes at 100 Hz
    C, v, lat, lon, h = mechanize(C, v, lat, lon, h, f_b, w_ib_b, 0.01)
assert np.linalg.norm(v) < 1.0, "a perfect stationary IMU should show under 1 m/s after 10 minutes"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m36_allan',
        title: 'Allan deviation of a real IMU',
        kind: 'code',
        lang: 'python',
        hours: 6,
        prompt: `Compute the overlapping Allan deviation of a long static gyro record (use a public IMU dataset or synthesise one with known ARW, bias instability and rate random walk).

1. Implement the overlapping Allan variance estimator.
2. Plot log-log Allan deviation against averaging time.
3. Read off **angle random walk** from the -1/2 slope at tau = 1 s, **bias instability** from the flat minimum (divide by 0.664), and **rate random walk** from the +1/2 slope at tau = 3 s.
4. Confirm your extracted parameters match the values you synthesised.

Success: all three parameters recovered within 10%, and you can name the slope for each noise type from memory.`,
        starter: `import numpy as np


def overlapping_allan_deviation(omega, dt, taus):
    """Overlapping Allan deviation of a rate signal.

    omega : rate samples (rad/s), uniformly sampled at dt
    taus  : averaging times in seconds
    Returns the Allan deviation at each tau, same units as omega.
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'white rate noise gives the -1/2 slope',
            assert: `import numpy as np
rng = np.random.default_rng(0)
dt = 0.01
sigma = 0.02
w = sigma * rng.standard_normal(2_000_00)
taus = np.array([0.1, 1.0, 10.0])
ad = overlapping_allan_deviation(w, dt, taus)
# for white noise, AD(tau) = sigma*sqrt(dt/tau)
expected = sigma * np.sqrt(dt / taus)
assert np.all(np.abs(ad / expected - 1.0) < 0.15), "white noise must follow the tau^-1/2 law"`,
          },
          {
            name: 'Allan deviation is positive and decreasing for white noise',
            assert: `import numpy as np
rng = np.random.default_rng(2)
ad = overlapping_allan_deviation(0.01 * rng.standard_normal(100000), 0.01, np.array([0.05, 0.5, 5.0]))
assert np.all(ad > 0), "Allan deviation must be positive"
assert ad[0] > ad[1] > ad[2], "for pure white noise it decreases monotonically"`,
          },
        ],
      },
      {
        id: 'ex_m36_coning',
        title: 'Coning correction under sinusoidal angular motion',
        kind: 'code',
        lang: 'python',
        hours: 6,
        prompt: `Drive a simulated gyro with coning motion: sinusoidal rotation about two orthogonal axes, 90 degrees out of phase, at 20 Hz with 1 degree amplitude. The true attitude drift is zero; naive integration produces a **systematic** drift about the third axis.

1. Integrate attitude by simple rate integration at 200 Hz and measure the drift rate.
2. Implement a two-sample coning correction and re-measure.
3. Sweep the coning frequency and plot residual drift against frequency for both.

Success: the corrected drift falls by orders of magnitude, and you can explain why this error is systematic rather than random and why it is invisible in a static test.`,
        starter: `"""Coning: a systematic attitude error that no amount of averaging removes.

Under sinusoidal rotation about two orthogonal axes 90 degrees out of phase,
naive rate integration accumulates a drift about the third axis. It is
systematic, not random, because successive rotations do not commute — and
non-commutativity does not average out.
"""

import numpy as np

CONING_FREQ_HZ = 20.0
CONING_AMP_DEG = 1.0
SAMPLE_HZ = 200.0


def body_rates(t: float, amp_deg: float = CONING_AMP_DEG, f_hz: float = CONING_FREQ_HZ):
    """Gyro-measured body rates for a coning motion, rad/s."""
    a, w = np.deg2rad(amp_deg), 2 * np.pi * f_hz
    return np.array([a * w * np.cos(w * t), a * w * np.sin(w * t), 0.0])


def two_sample_coning(d1: np.ndarray, d2: np.ndarray) -> np.ndarray:
    """Coning-corrected rotation vector from two consecutive angle increments.

    TODO: theta = d1 + d2 + (2/3) * cross(d1, d2). That coefficient is the
    whole algorithm — derive it once from the Bortz equation and it stops
    being magic.
    """
    raise NotImplementedError


def naive_sum(d1: np.ndarray, d2: np.ndarray) -> np.ndarray:
    """What you get if you simply add the increments."""
    return d1 + d2


def true_coning_rate(amp_deg: float = CONING_AMP_DEG, f_hz: float = CONING_FREQ_HZ) -> float:
    """Analytic drift rate of this motion about the third axis, rad/s.

    TODO: for small amplitude it is amp^2 * omega. Note the SQUARE — halving
    the cone angle cuts the drift by four.
    """
    raise NotImplementedError


if __name__ == "__main__":
    dt = 1.0 / SAMPLE_HZ
    d1, d2 = body_rates(0.0) * dt, body_rates(dt) * dt
    print("naive    :", naive_sum(d1, d2))
    print("corrected:", two_sample_coning(d1, d2))
    print(f"true coning rate = {np.degrees(true_coning_rate())*3600:.1f} deg/hr")
`,
        tests: [
          {
            name: 'the two-sample coning coefficient is two thirds',
            assert: `d1 = np.array([1e-3, 0.0, 0.0]); d2 = np.array([0.0, 1e-3, 0.0])
got = two_sample_coning(d1, d2) - naive_sum(d1, d2)
expect = (2.0/3.0)*np.cross(d1, d2)
assert np.allclose(got, expect, atol=1e-18), f'{got} vs {expect}'`,
          },
          {
            name: 'the correction vanishes when there is no coning',
            assert: `d = np.array([2e-3, 1e-3, -5e-4])
assert np.allclose(two_sample_coning(d, 2.0*d), naive_sum(d, 2.0*d), atol=1e-18), \\
    'parallel increments are a single-axis rotation and need no correction'`,
          },
          {
            name: 'the correction acts about the axis the naive sum misses',
            assert: `dt = 1.0/SAMPLE_HZ
d1, d2 = body_rates(0.0)*dt, body_rates(dt)*dt
corr = two_sample_coning(d1, d2) - naive_sum(d1, d2)
assert abs(corr[2]) > 10*max(abs(corr[0]), abs(corr[1])), 'drift is about the third axis'
assert corr[2] > 0.0`,
          },
          {
            name: 'coning drift goes as the SQUARE of the cone angle',
            assert: `assert abs(true_coning_rate(2.0, 20.0)/true_coning_rate(1.0, 20.0) - 4.0) < 1e-9`,
          },
          {
            name: 'and linearly in frequency',
            assert: `assert abs(true_coning_rate(1.0, 40.0)/true_coning_rate(1.0, 20.0) - 2.0) < 1e-9
a, w = np.deg2rad(1.0), 2*np.pi*20.0
assert abs(true_coning_rate(1.0, 20.0) - a*a*w) < 1e-12`,
            hidden: true,
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q_m36_bias_growth',
        q: 'A gyro has 1 deg/hr bias. How does unaided INS horizontal position error grow, and what bounds it?',
        choices: [
          'Linearly in time, bounded by the measurement noise',
          'A constant gyro bias tilts the computed platform linearly in time, which misprojects gravity into horizontal acceleration, so position error grows like t^3 in the short term. Over long times the Schuler loop bounds the growth into an 84.4-minute oscillation with a slowly growing envelope, so the error oscillates rather than diverging cubically forever',
          'Quadratically forever, bounded by nothing',
          'Exponentially, bounded by the Earth radius',
        ],
        answer: 1,
        explain:
          'Attitude error grows as bias times t. That tilt leaks gravity into the horizontal channel as an acceleration g*epsilon = g*b*t, which integrates twice into position error of order g*b*t^3/6. For 1 deg/hr = 4.85e-6 rad/s, after 60 seconds that is about 0.28 m, and after 600 seconds about 280 m — the cubic growth is brutal. The Schuler mechanism saves you at long times: the same gravity misprojection that causes the error also generates a restoring effect in a correctly mechanized local-level system, turning divergence into an 84.4-minute oscillation whose amplitude is set by g*b/w_s^2. Note an accelerometer bias produces a t^2 growth (also Schuler-bounded), and the third error, initial velocity, grows linearly.',
        b: 1.8,
        bloom: 'analyze',
      },
      {
        id: 'q_m36_coning',
        q: 'What is coning motion and why does naive attitude integration produce a systematic error?',
        choices: [
          'Coning is random gyro noise; the error is random and averages out',
          'Coning is angular motion where the body axis sweeps a cone — for example sinusoidal rotation about two orthogonal axes in quadrature. Because finite rotations do not commute, the integral of the angular rate is not the net rotation; the commutator term accumulates as a systematic drift about the third axis, which is why it never averages out',
          'Coning is an accelerometer effect caused by vibration; it is handled by sculling correction',
          'Coning is an artifact of quaternion normalisation',
        ],
        answer: 1,
        explain:
          'The rotation vector rate has a correction term 0.5 * (theta cross omega) beyond the raw angular rate. Under coning motion that cross product has a non-zero average, so simply integrating omega loses a constant amount of rotation every cycle — a drift, not a wander. The rate scales with the square of the cone half-angle and with the coning frequency, so it is worst in high-vibration environments like a launch vehicle. Multi-sample coning algorithms (Savage) reconstruct the commutator from several sub-samples within the attitude update interval. The corresponding velocity-channel effect from correlated angular and linear vibration is sculling, and both are invisible in a static test, which is exactly why launch vehicle IMU testing includes vibration.',
        b: 1.9,
        bloom: 'understand',
      },
      {
        id: 'q_m36_schuler',
        q: 'Explain the Schuler period physically.',
        choices: [
          'It is the orbital period of a satellite at the Earth surface, about 84.4 minutes, and an INS error loop oscillates at that frequency because a platform tilt error produces a gravity misprojection whose acceleration drives a position error that in turn feeds back as a tilt error — a pendulum of length equal to the Earth radius',
          'It is the Earth rotation period divided by 17',
          'It is the natural frequency of the gyro rotor',
          'It is the sampling period required to avoid aliasing Earth rate',
        ],
        answer: 0,
        explain:
          'The Schuler frequency is sqrt(g/R_earth), which gives a period of 84.4 minutes — identical to the period of a hypothetical pendulum whose length is the Earth radius, and to the orbital period at the surface. In a local-level mechanization, a horizontal position error changes the computed local vertical, which corrects the platform tilt, which changes the gravity misprojection. That negative feedback is what stops errors from growing without bound. Schuler tuning is why a correctly mechanized INS oscillates instead of diverging cubically, and why you see an 84-minute ripple in any long unaided run.',
        b: 1.4,
        bloom: 'understand',
      },
      {
        id: 'q_m36_coupling',
        q: 'Name two scenarios where tightly coupled GNSS/INS is decisively better than loosely coupled.',
        choices: [
          'Whenever more than four satellites are visible, and whenever the vehicle is stationary',
          'When fewer than four satellites are visible — tight coupling uses individual pseudoranges, so even one or two satellites still constrain the solution, while a loosely coupled filter gets no position fix at all; and in high-jamming or high-dynamics conditions, where tight coupling aids the tracking loops and lets you apply per-satellite integrity checks rather than trusting a single computed position',
          'On static ground tests and during laboratory calibration',
          'When the IMU is very accurate, and when the GNSS receiver is very accurate',
        ],
        answer: 1,
        explain:
          'Loose coupling feeds the receiver computed position and velocity into the filter, so it needs a full navigation solution and inherits whatever the receiver internal filter did, including its unmodelled time correlation. Tight coupling feeds raw pseudoranges and deltaranges, so partial constellations still contribute, and each measurement is individually gated. The two decisive cases are urban or terrain masking and dynamic or jammed environments such as a booster entry burn with plume attenuation and antenna switching. Ultra-tight (deep) coupling goes further, using the inertial solution to aid the receiver tracking loops so they can hold lock at far lower carrier-to-noise ratios and under high jerk.',
        b: 1.5,
        bloom: 'apply',
      },
      {
        id: 'q_m36_allan',
        q: 'What does an Allan deviation slope of -1/2 correspond to?',
        choices: [
          'Rate random walk',
          'Angle random walk, that is white noise on the rate measurement. The ARW coefficient is read off at tau = 1 s and is quoted in deg per square-root hour',
          'Bias instability',
          'Quantization noise',
        ],
        answer: 1,
        explain:
          'On a log-log Allan deviation plot each noise process has a signature slope: -1 is quantization noise, -1/2 is angle (or velocity) random walk from white rate noise, 0 (the flat floor) is bias instability, +1/2 is rate random walk, and +1 is a rate ramp or drift. ARW is read at tau = 1 s directly; bias instability is the minimum value divided by 0.664; rate random walk is read at tau = 3 s times a factor of 3. Those five slopes are worth memorising because every IMU datasheet is written in their language.',
        b: 1.0,
        bloom: 'recall',
      },
    ],
    cards: [
      {
        id: 'c_m36_arw',
        front: 'Angle random walk',
        back: 'White noise on the rate output, integrating into an attitude random walk. Quoted in deg/sqrt(hr). Read off the Allan deviation at tau = 1 s on the -1/2 slope.',
        formula: true,
      },
      {
        id: 'c_m36_slopes',
        front: 'Allan deviation slopes — the five signatures',
        back: '-1: quantization. -1/2: angle (or velocity) random walk. 0 (flat floor): bias instability. +1/2: rate random walk. +1: rate ramp / drift.',
      },
      {
        id: 'c_m36_bias_instability',
        front: 'Reading bias instability off an Allan plot',
        back: 'It is the flat minimum of the Allan deviation divided by 0.664. It is the floor below which averaging longer stops helping — the sensor is wandering, not just noisy.',
        formula: true,
      },
      {
        id: 'c_m36_schuler',
        front: 'Schuler frequency and period',
        back: 'w_s = sqrt(g / R_earth), period 2*pi/w_s = 84.4 minutes. A correctly mechanized local-level INS oscillates at this frequency instead of diverging.',
        formula: true,
      },
      {
        id: 'c_m36_error_growth',
        front: 'Free-inertial error growth laws',
        back: 'Gyro bias b: attitude error grows like b*t, position like g*b*t^3/6. Accelerometer bias a: position like a*t^2/2. Initial velocity error: linear in t. All Schuler-bounded at long times.',
        formula: true,
      },
      {
        id: 'c_m36_velocity_update',
        front: 'Strapdown velocity update in NED',
        back: 'v_dot = C_bn * f_b - (2*w_ie + w_en) cross v + g_local. The Coriolis term is Earth rate plus transport rate; the specific force f_b is what the accelerometer actually measures.',
        formula: true,
      },
      {
        id: 'c_m36_specific_force',
        front: 'What an accelerometer measures',
        back: 'Specific force, not acceleration. In free fall it reads zero; sitting on a bench it reads +g upward. Gravity must be ADDED analytically, which is why a gravity model error is indistinguishable from an accelerometer bias.',
      },
      {
        id: 'c_m36_coning',
        front: 'Coning error',
        back: 'Because finite rotations do not commute, integrating raw angular rate under two-axis quadrature motion accumulates a systematic drift about the third axis. It scales with the square of the cone angle times the frequency, and is invisible in static tests.',
      },
      {
        id: 'c_m36_sculling',
        front: 'Sculling error',
        back: 'The velocity-channel analogue of coning: correlated angular and linear vibration produces a systematic velocity error when specific force is integrated naively. Corrected with multi-sample sculling algorithms.',
      },
      {
        id: 'c_m36_earth_rate',
        front: 'Earth rate',
        back: 'w_ie = 7.292115e-5 rad/s, about 15.041 deg/hr. Any gyro whose bias instability is below this can gyrocompass; any gyro whose bias is a large fraction of it cannot find north.',
        formula: true,
      },
      {
        id: 'c_m36_gyrocompass',
        front: 'Gyrocompassing',
        back: 'Finding north from the horizontal component of the sensed Earth rate, w_ie*cos(latitude). Accuracy degrades as 1/cos(latitude), so it is impossible at the poles and needs a low-bias gyro everywhere.',
        formula: true,
      },
      {
        id: 'c_m36_15state',
        front: 'The 15-state INS error state',
        back: 'Position (3), velocity (3), attitude (3), accelerometer bias (3), gyro bias (3). Extend to 21 or more with scale factors and misalignments when the IMU grade and the mission justify it.',
      },
      {
        id: 'c_m36_coupling',
        front: 'INS/GNSS coupling architectures',
        back: 'Loose: fuse the receiver position/velocity solution. Tight: fuse raw pseudoranges and deltaranges, so fewer than four satellites still helps. Ultra-tight/deep: the inertial solution aids the receiver tracking loops, holding lock under jamming and high dynamics.',
      },
      {
        id: 'c_m36_zupt',
        front: 'Zero-velocity update (ZUPT)',
        back: 'When the vehicle is known to be stationary, inject a pseudo-measurement v = 0. It observes the tilt and accelerometer biases very effectively and is the cheapest accuracy improvement in pedestrian and ground-vehicle navigation.',
      },
      {
        id: 'c_m36_lever_arm',
        front: 'Lever arm compensation',
        back: 'An aiding sensor displaced from the IMU by r measures v_sensor = v_imu + w cross r. Omitting the term injects an error proportional to angular rate — significant on a rotating or tumbling vehicle.',
        formula: true,
      },
    ],
    tags: ['interview'],
    importance: 1.3,
  },

  {
    id: 't4_m37_gnss',
    track: 'gnc',
    tier: 4,
    title: 'GNSS / GPS',
    summary:
      'Compute a position fix from raw pseudoranges by iterative least squares, work out DOP from satellite geometry, and reason about what actually breaks a receiver on a launch vehicle. You will be able to explain what carries navigation through a lock outage and for how long.',
    prereqs: ['t4_m34_kalman_filter', 't2_m19_two_body'],
    hours: 55,
    topics: [
      'GNSS constellation and signal structure: L1/L2/L5, C/A and P(Y) codes, CDMA, the navigation message',
      'The pseudorange measurement and its error budget',
      'Receiver clock bias as the fourth unknown',
      'The navigation solution by iterative least squares / Newton iteration',
      'Dilution of precision: GDOP, PDOP, HDOP, VDOP, TDOP, and what geometry makes each bad',
      'Ionospheric and tropospheric delay, their models, and the dual-frequency ionosphere-free combination',
      'Multipath; ephemeris and satellite clock errors',
      'Carrier phase measurements, cycle slips, integer ambiguity resolution with LAMBDA',
      'Differential GNSS, RTK, and precise point positioning',
      'Space-based GNSS: use above the constellation, side-lobe reception, high-dynamics tracking, Doppler',
      'GNSS in a launch vehicle environment: acceleration, jerk, vibration, plume attenuation, antenna switching',
      'Jamming and spoofing; RAIM and integrity monitoring',
      'Receiver tracking loops (DLL, PLL, FLL) and the bandwidth/dynamics trade',
      'Vector tracking and deep coupling',
    ],
    objectives: [
      'Compute a GPS position and clock-bias fix from raw pseudoranges by iterative least squares',
      'Compute DOP from a satellite geometry and correlate it with achieved position error',
      'Derive the linearized pseudorange measurement Jacobian',
      'Explain the specific challenges of GNSS on a launch vehicle and what covers a lock outage',
    ],
    resources: [
      {
        title: 'Principles of GNSS, Inertial, and Multisensor Integrated Navigation Systems, Ch. 7-10',
        author: 'Paul Groves',
        kind: 'book',
        free: false,
      },
      {
        title: 'Global Positioning System: Signals, Measurements, and Performance',
        author: 'Misra & Enge',
        kind: 'book',
        free: false,
      },
      {
        title: 'Understanding GPS/GNSS: Principles and Applications',
        author: 'Kaplan & Hegarty',
        kind: 'book',
        free: false,
      },
      { title: 'Aided Navigation: GPS with High Rate Sensors', author: 'Jay Farrell', kind: 'book', free: false },
      {
        title: 'IS-GPS-200 — GPS Interface Specification',
        kind: 'docs',
        url: 'https://www.gps.gov',
        free: true,
        note: 'The authoritative signal and navigation-message definition, free from gps.gov.',
      },
      { title: 'RTKLIB', kind: 'tool', free: true, note: 'Open-source GNSS processing; read the code, it is an education.' },
    ],
    exercises: [
      {
        id: 'ex_m37_fix',
        title: 'A position fix from raw pseudoranges',
        kind: 'code',
        lang: 'python',
        hours: 8,
        prompt: `Given satellite ECEF positions and pseudoranges, solve for receiver position and clock bias by iterative least squares.

1. Linearize about the current estimate, form the geometry matrix G, and iterate the Newton step until the update is below 1e-4 m.
2. Apply the Sagnac (Earth rotation) correction for signal travel time.
3. Report the residuals and compare them to the expected user-equivalent range error.
4. Then implement the DOP computation from the same geometry matrix.

Success: convergence in under six iterations from a centre-of-Earth initial guess, and DOP values consistent with the geometry you supplied.`,
        starter: `import numpy as np

C_LIGHT = 299792458.0


def geometry_matrix(sat_positions, rx_position):
    """Rows are [-unit line-of-sight (3), 1] — the linearized pseudorange Jacobian."""
    raise NotImplementedError


def solve_position(sat_positions, pseudoranges, x0=None, tol=1e-4, max_iter=20):
    """Iterative least-squares GNSS fix.

    Returns (rx_position_ecef, clock_bias_metres, n_iter, residuals).
    """
    raise NotImplementedError


def dop(sat_positions, rx_position):
    """Return dict with gdop, pdop, hdop, vdop, tdop from Q = inv(G.T @ G)."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'noise-free pseudoranges are inverted exactly',
            assert: `import numpy as np
rng = np.random.default_rng(4)
R = 26_560_000.0
dirs = rng.standard_normal((6, 3)); dirs /= np.linalg.norm(dirs, axis=1, keepdims=True)
sats = dirs * R
x_true = np.array([1_130_000.0, -4_830_000.0, 3_994_000.0])
b_true = 1234.5
pr = np.linalg.norm(sats - x_true, axis=1) + b_true
x, b, n, res = solve_position(sats, pr)
assert np.linalg.norm(x - x_true) < 1e-3, "position should be recovered to sub-mm"
assert abs(b - b_true) < 1e-3, "clock bias should be recovered"
assert n <= 8, "Newton iteration should converge quickly"`,
          },
          {
            name: 'geometry matrix has the right shape and last column',
            assert: `import numpy as np
sats = np.array([[2.0e7, 0.0, 1.0e7], [0.0, 2.0e7, 1.0e7], [-2.0e7, 0.0, 1.0e7], [0.0, -2.0e7, 1.0e7]])
G = geometry_matrix(sats, np.zeros(3))
assert G.shape == (4, 4), "one row per satellite, four columns"
assert np.allclose(G[:, 3], 1.0), "the clock column is all ones"
assert np.allclose(np.linalg.norm(G[:, :3], axis=1), 1.0), "the first three columns are a unit vector"`,
          },
          {
            name: 'clustered satellites give terrible DOP',
            assert: `import numpy as np
good = np.array([[2.0e7, 0.0, 1.0e7], [0.0, 2.0e7, 1.0e7], [-2.0e7, 0.0, 1.0e7], [0.0, -2.0e7, 1.0e7]])
bad = np.array([[2.0e7, 0.0, 1.0e7], [2.01e7, 1.0e5, 1.0e7], [2.02e7, -1.0e5, 1.0e7], [2.0e7, 0.0, 1.02e7]])
assert dop(good, np.zeros(3))["gdop"] < dop(bad, np.zeros(3))["gdop"] / 10, "clustered geometry must give far worse GDOP"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m37_outage',
        title: 'Loosely coupled GNSS/INS through an outage',
        kind: 'code',
        lang: 'python',
        hours: 8,
        prompt: `Take your 15-state error-state INS filter and add a loosely coupled GNSS position update at 1 Hz.

1. Fly a representative booster entry trajectory.
2. Blank GNSS for 10, 30, 60 and 120 seconds during the highest-dynamics segment.
3. Plot position and velocity error and the filter 3-sigma envelope through each outage and the reconvergence afterwards.
4. Repeat with a tactical-grade and a navigation-grade IMU spec.

Success: error growth through the outage matches your free-inertial predictions, the covariance envelope contains the error, and you can state how long each IMU grade buys you for a stated accuracy requirement.`,
        starter: `"""What an IMU grade actually buys you when GNSS goes away.

Free-inertial error growth is a polynomial in outage duration, and the
coefficients are the sensor spec. Working this out on paper first tells you
what the filter should be doing before you ever run it.
"""

import numpy as np

# Representative specs. Bias is the term that dominates a long outage.
TACTICAL = {"accel_bias_mg": 1.0, "gyro_bias_dph": 1.0}
NAVIGATION = {"accel_bias_mg": 0.025, "gyro_bias_dph": 0.01}
G = 9.80665


def free_inertial_position_error(accel_bias_mg: float, t: float) -> float:
    """Position error from an uncompensated accelerometer bias, metres.

    TODO: a constant bias b integrates twice, so the error is 0.5 * b * t^2.
    Convert milli-g to m/s^2 first.
    """
    raise NotImplementedError


def tilt_induced_error(gyro_bias_dph: float, t: float) -> float:
    """Position error from gravity leaking through a growing tilt, metres.

    A gyro bias tilts the platform linearly in time; that tilt projects
    gravity into the horizontal channel, which then integrates twice more.

    TODO: tilt(t) = bias * t, horizontal accel = g * tilt, so the position
    error is g * bias * t^3 / 6. Convert degrees/hour to rad/s first.
    """
    raise NotImplementedError


def outage_budget(spec: dict, t: float) -> float:
    """Total free-inertial position error for an outage of t seconds."""
    return free_inertial_position_error(spec["accel_bias_mg"], t) + \\
        tilt_induced_error(spec["gyro_bias_dph"], t)


if __name__ == "__main__":
    for name, spec in (("tactical", TACTICAL), ("navigation", NAVIGATION)):
        row = "  ".join(f"{t:>4.0f}s: {outage_budget(spec, t):9.1f} m" for t in (10, 30, 60, 120))
        print(f"{name:>11}  {row}")
`,
        tests: [
          {
            name: 'accelerometer bias error grows as t squared',
            assert: `e30 = free_inertial_position_error(1.0, 30.0)
e60 = free_inertial_position_error(1.0, 60.0)
assert abs(e60/e30 - 4.0) < 1e-9
assert abs(e30 - 0.5*(1e-3*G)*30.0**2) < 1e-9`,
          },
          {
            name: 'tilt-induced error grows as t cubed',
            assert: `a = tilt_induced_error(1.0, 30.0)
b = tilt_induced_error(1.0, 60.0)
assert abs(b/a - 8.0) < 1e-9`,
          },
          {
            name: 'the tilt term uses the correct unit conversion',
            assert: `bias = np.deg2rad(1.0)/3600.0
assert abs(tilt_induced_error(1.0, 60.0) - G*bias*60.0**3/6.0) < 1e-9`,
          },
          {
            name: 'a navigation-grade IMU buys a long outage a tactical one cannot',
            assert: `assert outage_budget(NAVIGATION, 120.0) < outage_budget(TACTICAL, 120.0)/10.0`,
          },
          {
            name: 'the tilt term overtakes the bias term on a long enough outage',
            assert: `# t^3 against t^2, so the ratio grows linearly in t. For these numbers it
# crosses one at about 619 s, which means ten minutes of outage is still —
# just — bias-dominated and fifteen is not.
short = tilt_induced_error(1.0, 5.0)/free_inertial_position_error(1.0, 5.0)
near = tilt_induced_error(1.0, 600.0)/free_inertial_position_error(1.0, 600.0)
long = tilt_induced_error(1.0, 900.0)/free_inertial_position_error(1.0, 900.0)
assert short < near < long, 'the ratio has to be monotone in t'
assert near < 1.0, 'ten minutes is not yet long enough'
assert long > 1.0, 'fifteen minutes is'`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m37_dop',
        title: 'DOP against actual error',
        kind: 'analysis',
        hours: 4,
        prompt: `Using a real almanac (or a synthetic constellation), compute PDOP over 24 hours at a launch-site latitude with a 5 degree mask angle.

1. Plot PDOP against time and identify the worst windows.
2. Run Monte Carlo pseudorange noise at each epoch and confirm that position error standard deviation is PDOP times the user-equivalent range error.
3. Raise the mask angle to 15 degrees and re-plot.

Deliver a short note on how DOP would feed a launch-window analysis.`,
      },
    ],
    quiz: [
      {
        id: 'q_m37_four',
        q: 'Why are four satellites the minimum for a 3-D fix?',
        choices: [
          'Because three satellites give an ambiguous intersection of spheres',
          'Because the receiver clock bias is a fourth unknown alongside the three position coordinates — a receiver clock cannot be held to nanosecond accuracy, so every pseudorange is contaminated by the same unknown offset, which the fourth measurement resolves',
          'Because GPS satellites broadcast in pairs',
          'Because four is required for the ionospheric correction',
        ],
        answer: 1,
        explain:
          'A pseudorange is the true range plus the speed of light times the receiver clock bias (plus atmosphere and noise). With three unknowns of position and one of clock bias, four independent measurements are needed. This is also why GNSS delivers superb time transfer for free, and why a receiver with a disciplined external clock can fix from three satellites in what is called clock-coasting or clock-hold mode. Height-aiding (knowing altitude) similarly reduces the requirement to three.',
        b: 0.2,
        bloom: 'recall',
      },
      {
        id: 'q_m37_jacobian',
        q: 'What is the linearized pseudorange measurement Jacobian row for satellite i?',
        choices: [
          '[unit line of sight (3 components), 0]',
          '[-e_i.T, 1] where e_i is the unit vector from the receiver estimate toward satellite i, so the partial with respect to position is minus the line-of-sight unit vector and the partial with respect to clock bias (in metres) is 1',
          '[e_i.T, -1]',
          '[position difference (3 components), speed of light]',
        ],
        answer: 1,
        explain:
          'With rho = ||s_i - x|| + b, the partial with respect to x is -(s_i - x).T / ||s_i - x|| = -e_i.T, and the partial with respect to b (expressed in metres) is exactly 1. Stacking these rows gives the geometry matrix G, and inv(G.T*G) is the DOP matrix. Notice that the clock column being all ones is why a satellite directly overhead and a satellite on the horizon contribute so differently: DOP is entirely about how well the line-of-sight unit vectors span three dimensions while remaining distinguishable from the all-ones clock direction.',
        b: 1.2,
        bloom: 'apply',
      },
      {
        id: 'q_m37_pdop',
        q: 'What is PDOP and what geometry makes it bad?',
        choices: [
          'The ratio of measurement noise to position error; bad when the noise is large',
          'PDOP = sqrt(Q11 + Q22 + Q33) with Q = inv(G.T*G): the geometric amplification of ranging error into position error. It is bad when the satellites are clustered in a small part of the sky, all at similar elevation, or confined to one side — anything that makes the line-of-sight vectors nearly co-planar or nearly parallel',
          'The number of visible satellites divided by four',
          'The probability of detecting an outlier; bad when there are fewer than five satellites',
        ],
        answer: 1,
        explain:
          'Position error standard deviation is approximately PDOP times the user-equivalent range error, so DOP is a pure geometry number computable from an almanac before you ever take a measurement. The best geometry spreads satellites widely in azimuth and elevation — ideally one near zenith and several low and evenly distributed. The worst is a tight cluster, or all satellites near the horizon in one quadrant, which is exactly what a high mask angle in a canyon or a plume-shadowed antenna produces. VDOP is always worse than HDOP for a ground user because there are no satellites below the horizon to balance the vertical geometry.',
        b: 1.0,
        bloom: 'understand',
      },
      {
        id: 'q_m37_outage',
        q: 'A booster GNSS receiver loses lock during the entry burn. What carries navigation, and for how long?',
        choices: [
          'Nothing; navigation is lost until lock is regained',
          'The inertial solution coasts, with error growth set by IMU quality: a navigation-grade IMU holds metre-level position for tens of seconds and drifts through hundreds of metres over a couple of minutes, while a tactical-grade unit degrades far faster. Radar altimeter, optical or terrain-relative measurements can bound it, and the receiver reacquires faster if the inertial solution aids the tracking loops',
          'The star tracker provides position during the outage',
          'The flight computer extrapolates the last GNSS fix with a constant-velocity model',
        ],
        answer: 1,
        explain:
          'This is exactly what INS is for: it is the only sensor that keeps working through plume attenuation, antenna switching, high dynamics and jamming. The coast duration you can tolerate is a requirements calculation, not a guess: take the IMU bias and random-walk specs, propagate the error-growth laws, and compare against the accuracy needed at landing-burn ignition. That calculation is what sizes the IMU. Deep coupling helps twice over, by holding lock at lower carrier-to-noise and by reacquiring in a fraction of the time because the inertial solution narrows the code and Doppler search.',
        b: 1.4,
        bloom: 'apply',
      },
      {
        id: 'q_m37_iono',
        q: 'How does dual-frequency operation remove ionospheric delay?',
        choices: [
          'By averaging the two frequencies',
          'Ionospheric delay is dispersive, scaling as 1/f^2, so a linear combination of the L1 and L2 pseudoranges with coefficients f1^2/(f1^2 - f2^2) and -f2^2/(f1^2 - f2^2) cancels the first-order term exactly, at the cost of roughly tripling the noise',
          'By using the L2 signal only, which is unaffected by the ionosphere',
          'By modelling the ionosphere with the Klobuchar parameters broadcast on L2',
        ],
        answer: 1,
        explain:
          'The ionosphere is a dispersive medium for the ionised plasma: group delay on the code scales as 40.3*TEC/f^2, and it advances the carrier phase by the same amount. Because the frequency dependence is known, two frequencies give two equations for the delay and the true range, and the ionosphere-free combination eliminates the first-order term. The cost is a noise amplification of about a factor of three, so single-frequency receivers use a broadcast model (Klobuchar) that removes only about half the error. Second-order ionospheric terms matter only for the most precise geodetic work.',
        b: 1.5,
        bloom: 'understand',
      },
    ],
    cards: [
      {
        id: 'c_m37_pseudorange',
        front: 'The pseudorange equation',
        back: 'rho_i = ||s_i - x|| + c*dt_rx - c*dt_sat + I + T + eps. Four unknowns: three position coordinates plus receiver clock bias — hence four satellites minimum.',
        formula: true,
      },
      {
        id: 'c_m37_jacobian',
        front: 'Pseudorange measurement Jacobian',
        back: 'Row i is [-e_i.T, 1], with e_i the unit line-of-sight from the receiver to satellite i. Stacking the rows gives the geometry matrix G.',
        formula: true,
      },
      {
        id: 'c_m37_dop',
        front: 'Dilution of precision',
        back: 'Q = inv(G.T*G). GDOP = sqrt(trace Q); PDOP = sqrt(Q11+Q22+Q33); HDOP, VDOP and TDOP take the corresponding entries in a local ENU frame. Position sigma is approximately DOP times the UERE.',
        formula: true,
      },
      {
        id: 'c_m37_l1',
        front: 'GPS L1 carrier and C/A code',
        back: 'L1 at 1575.42 MHz (154 x 10.23 MHz), C/A code at 1.023 Mcps with a 1 ms repeat and a 300 m chip length. L2 is 1227.60 MHz, L5 is 1176.45 MHz.',
        formula: true,
      },
      {
        id: 'c_m37_iono',
        front: 'Ionosphere-free combination',
        back: 'rho_IF = (f1^2*rho1 - f2^2*rho2) / (f1^2 - f2^2). Cancels first-order ionospheric delay exactly because the delay scales as 1/f^2; noise grows roughly threefold.',
        formula: true,
      },
      {
        id: 'c_m37_tropo',
        front: 'Troposphere versus ionosphere',
        back: 'The troposphere is NOT dispersive, so dual-frequency does not help; it must be modelled (Saastamoinen, Hopfield) with a mapping function, or estimated as a zenith delay state. Zenith delay is about 2.3 m, rising steeply at low elevation.',
      },
      {
        id: 'c_m37_carrier',
        front: 'Carrier phase measurement',
        back: 'Millimetre-level precision but biased by an unknown integer number of wavelengths (19 cm on L1). Resolve the ambiguity (LAMBDA) and you have centimetre positioning; lose lock and the cycle slip must be detected and repaired.',
      },
      {
        id: 'c_m37_rtk',
        front: 'DGNSS, RTK and PPP',
        back: 'DGNSS: broadcast code corrections, metre to decimetre. RTK: carrier phase plus a nearby base station, centimetre, short baselines. PPP: precise orbit and clock products with no base station, decimetre after a long convergence.',
      },
      {
        id: 'c_m37_raim',
        front: 'RAIM',
        back: 'Receiver autonomous integrity monitoring: use redundant satellites to test the residual against a chi-square threshold. Five satellites detect a fault; six isolate it. It is a consistency test, exactly like NIS.',
      },
      {
        id: 'c_m37_loops',
        front: 'DLL, PLL and FLL',
        back: 'Delay lock loop tracks code phase (range), phase lock loop tracks carrier phase (precision but fragile under dynamics), frequency lock loop tracks Doppler (robust, less precise). Loop bandwidth trades noise against dynamic stress.',
      },
      {
        id: 'c_m37_dynamics',
        front: 'Dynamic stress on a tracking loop',
        back: 'Tracking error from vehicle motion scales with the derivative of range at the loop order — jerk is the killer for a third-order PLL. Widening the bandwidth admits more noise; inertial aiding removes the dynamics instead, which is why deep coupling exists.',
      },
      {
        id: 'c_m37_launch',
        front: 'Why GNSS is hard on a launch vehicle',
        back: 'High acceleration and jerk stress the tracking loops, vibration modulates the carrier, the exhaust plume attenuates and refracts the signal, the vehicle body shadows antennas so switching is needed, and staging events cause transients — all at once.',
      },
      {
        id: 'c_m37_above',
        front: 'GNSS above the constellation',
        back: 'Above about 3000 km the Earth blocks the main lobes, so you fly on side lobes: roughly 15-20 dB weaker, sparse geometry, and terrible DOP. It works up to and beyond GEO with a high-sensitivity receiver and long integration, and has been demonstrated near lunar distance.',
      },
      {
        id: 'c_m37_spoof',
        front: 'Jamming versus spoofing',
        back: 'Jamming raises the noise floor and you lose lock, which is obvious. Spoofing feeds a consistent but false solution, which is not — detect it with signal-power monitoring, angle-of-arrival checks, and cross-checks against the inertial solution.',
      },
    ],
  },

  {
    id: 't4_m38_sensors_optical_nav',
    track: 'gnc',
    tier: 4,
    title: 'Spacecraft Sensors & Optical Navigation',
    summary:
      'Write the measurement model and noise characterization for every sensor a spacecraft carries, from star trackers to terrain-relative cameras. You will implement lost-in-space star identification and a camera landmark model, and be able to say what sensor geometry makes an attitude solution collapse.',
    prereqs: ['t4_m33_least_squares', 't1_m16_attitude_representations'],
    hours: 45,
    topics: [
      'Star trackers: optics, centroiding, star catalogs, lost-in-space identification (triangle and pyramid algorithms), tracking mode',
      'Star tracker accuracy: cross-boresight vs about-boresight, update rate, exclusion angles, stray light',
      'Sun sensors: coarse analog and fine digital, field of view, albedo error',
      'Magnetometers, the IGRF and WMM field models, residual dipole, hard-iron and soft-iron calibration',
      'Earth and horizon sensors',
      'Radar altimeters, laser altimeters and lidar',
      'Cameras for optical navigation: the pinhole model, intrinsics and extrinsics, distortion',
      'Feature detection and tracking; terrain relative navigation; crater and landmark matching',
      'Hazard detection and avoidance; visual-inertial odometry basics',
      'Relative navigation sensors for docking: retroreflector tracking and pattern recognition',
      'Sensor fusion architectures and per-sensor measurement models',
      'Sensor calibration, alignment estimation, and fault detection',
    ],
    objectives: [
      'Write measurement models and noise characterizations for star tracker, sun sensor and magnetometer',
      'Implement lost-in-space star identification on synthetic star fields',
      'Build a camera measurement model for landmark-based navigation',
      'Identify the sensor geometries under which a two-vector attitude solution degrades and state the mitigation',
    ],
    resources: [
      {
        title: 'Fundamentals of Spacecraft Attitude Determination and Control, Ch. 4',
        author: 'Markley & Crassidis',
        kind: 'book',
        free: false,
        note: 'The definitive aerospace sensors and actuators chapter.',
      },
      {
        title: 'Spacecraft Dynamics and Control (hardware chapters)',
        author: 'Marcel Sidi',
        kind: 'book',
        free: false,
      },
      {
        title: 'Accuracy Performance of Star Trackers — A Tentative Approach',
        author: 'Carl Christian Liebe',
        kind: 'paper',
        free: false,
        note: 'IEEE Transactions on Aerospace and Electronic Systems, 2002. Where the cross-boresight error budget comes from.',
      },
      {
        title: 'Pyramid star identification papers',
        author: 'Daniele Mortari',
        kind: 'paper',
        free: false,
      },
      {
        title: 'Computer Vision: Algorithms and Applications',
        author: 'Richard Szeliski',
        kind: 'book',
        free: true,
        note: 'Free PDF from the author. Use it for the projective geometry and feature-tracking side.',
      },
      {
        title: 'NASA papers on the Mars 2020 Lander Vision System and terrain relative navigation',
        kind: 'paper',
        free: true,
      },
    ],
    exercises: [
      {
        id: 'ex_m38_starid',
        title: 'Lost-in-space star identification',
        kind: 'code',
        lang: 'python',
        hours: 9,
        prompt: `Generate synthetic star fields from a bright-star catalog (or a synthetic one) for random attitudes, with a 15 degree field of view, centroid noise, magnitude cutoff, and a few false detections.

1. Build an **interstar-angle** lookup table with a tolerance-based k-vector or sorted index.
2. Implement triangle matching: for each triple of observed stars, look up candidate catalog triples with matching angles, and vote.
3. Add the pyramid step: confirm with a fourth star to kill the false matches that triangle matching alone produces.
4. Report identification rate and false-identification rate against centroid noise and against the number of spurious detections.

Success: above 99% correct identification at realistic noise, and the pyramid confirmation reduces false IDs by orders of magnitude.`,
        starter: `import numpy as np


def interstar_angles(unit_vectors):
    """All pairwise angles (radians) between catalog unit vectors, as (i, j, angle)."""
    raise NotImplementedError


def match_triangle(obs_vectors, catalog_vectors, angle_index, tol):
    """Return candidate (obs_index -> catalog_index) assignments from triangle voting."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'interstar angles are symmetric and in range',
            assert: `import numpy as np
rng = np.random.default_rng(0)
v = rng.standard_normal((30, 3)); v /= np.linalg.norm(v, axis=1, keepdims=True)
tri = interstar_angles(v)
assert len(tri) == 30 * 29 // 2, "one entry per unordered pair"
for i, j, a in tri:
    assert 0.0 <= a <= np.pi + 1e-12, "angle out of range"
    assert abs(a - np.arccos(np.clip(v[int(i)] @ v[int(j)], -1, 1))) < 1e-9, "angle value is wrong"`,
          },
          {
            name: 'interstar angles are rotation invariant — the whole basis of star ID',
            assert: `import numpy as np
rng = np.random.default_rng(9)
v = rng.standard_normal((12, 3)); v /= np.linalg.norm(v, axis=1, keepdims=True)
q, _ = np.linalg.qr(rng.standard_normal((3, 3)))
if np.linalg.det(q) < 0:
    q[:, 0] *= -1
a1 = np.array(sorted(a for _, _, a in interstar_angles(v)))
a2 = np.array(sorted(a for _, _, a in interstar_angles(v @ q.T)))
assert np.allclose(a1, a2, atol=1e-12), "interstar angles must be invariant under rotation"`,
          },
        ],
      },
      {
        id: 'ex_m38_magcal',
        title: 'Magnetometer calibration by ellipsoid fit',
        kind: 'code',
        lang: 'python',
        hours: 5,
        prompt: `Synthesise magnetometer data from a tumbling spacecraft with a hard-iron offset, a soft-iron matrix and noise.

1. Show that the raw measurements lie on an ellipsoid rather than a sphere.
2. Fit the ellipsoid by least squares on the quadratic form.
3. Extract the hard-iron bias (centre) and the soft-iron correction (from the matrix square root of the quadratic form).
4. Apply the calibration and show the corrected data lies on a sphere of the expected field magnitude.

Success: residual radius spread drops by an order of magnitude and the recovered bias matches truth.`,
        starter: `import numpy as np


def fit_ellipsoid(m):
    """Least-squares ellipsoid fit to Nx3 magnetometer samples.

    Returns (A, b) such that the calibrated measurement is A @ (m - b) and lies on
    a unit-radius sphere scaled to the local field magnitude.
    """
    raise NotImplementedError
`,
        tests: [
          {
            name: 'recovers a pure hard-iron offset',
            assert: `import numpy as np
rng = np.random.default_rng(1)
v = rng.standard_normal((500, 3)); v /= np.linalg.norm(v, axis=1, keepdims=True)
B = 48000.0
bias = np.array([1200.0, -800.0, 400.0])
m = B * v + bias
A, b = fit_ellipsoid(m)
assert np.linalg.norm(b - bias) < 5.0, "hard-iron bias not recovered: %r" % (b,)
cal = (A @ (m - b).T).T
r = np.linalg.norm(cal, axis=1)
assert np.std(r) / np.mean(r) < 1e-3, "calibrated data should lie on a sphere"`,
          },
          {
            name: 'handles a soft-iron distortion too',
            assert: `import numpy as np
rng = np.random.default_rng(6)
v = rng.standard_normal((900, 3)); v /= np.linalg.norm(v, axis=1, keepdims=True)
S = np.array([[1.08, 0.04, -0.02], [0.04, 0.95, 0.03], [-0.02, 0.03, 1.02]])
m = (S @ (48000.0 * v).T).T + np.array([500.0, 300.0, -900.0])
A, b = fit_ellipsoid(m)
cal = (A @ (m - b).T).T
r = np.linalg.norm(cal, axis=1)
assert np.std(r) / np.mean(r) < 5e-3, "soft-iron correction failed"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m38_sunsensor',
        title: 'Coarse sun sensor with albedo error',
        kind: 'analysis',
        hours: 4,
        prompt: `Model a set of six cosine-law coarse sun sensors on a cube in low Earth orbit.

1. Compute the sun vector from the six currents by least squares.
2. Add Earth albedo as a diffuse contribution from the Earth-facing hemisphere, varying with beta angle and over an orbit.
3. Quantify the resulting sun-vector error in degrees across a full orbit, and identify where the error peaks.
4. Propose and evaluate two mitigations (eclipse and terminator masking, or an albedo model).

Deliver a plot of attitude error contribution against orbital position and a one-page recommendation.`,
      },
    ],
    quiz: [
      {
        id: 'q_m38_boresight',
        q: 'Why is a star tracker much less accurate about its boresight than cross-boresight?',
        choices: [
          'Because the detector is rectangular',
          'A centroid error moves a star across the focal plane, which maps to a large angle cross-boresight but only a small angle about the boresight — the lever arm for roll is the angular offset of the star from the boresight, which is at most half the field of view. The ratio is roughly 1/tan(FOV/2), typically five to ten times worse',
          'Because the star catalog is less accurate in the roll direction',
          'Because stray light affects only the roll axis',
        ],
        answer: 1,
        explain:
          'Think of it geometrically. A star displaced by delta pixels rotates the estimated attitude about an axis in the focal plane by delta/f radians — that is the cross-boresight sensitivity. To sense roll, the same delta must be interpreted as an arc about the boresight, and the arc radius is the star angular distance from the centre, which is bounded by the half field of view. So the roll sensitivity is smaller by a factor of about tan(half FOV). A narrow field of view therefore buys cross-boresight accuracy and pays for it in roll. The mitigation is either a wider field, or a second tracker whose boresight is orthogonal to the first — which is why flight vehicles fly two or three heads at different orientations.',
        b: 1.3,
        bloom: 'understand',
      },
      {
        id: 'q_m38_mag_only',
        q: 'What is the fundamental limitation of magnetometer-only attitude determination?',
        choices: [
          'Magnetometers are too noisy to be useful',
          'One vector measurement determines only two of three attitude degrees of freedom — rotation about the measured field direction is unobservable at a single instant. On top of that, the field model (IGRF/WMM) has errors of several hundred nanotesla, the field is weak and its direction changes slowly along an orbit, and the spacecraft own residual dipole and currents contaminate the reading',
          'Magnetometers only work below 400 km altitude',
          'Magnetometers cannot be calibrated in flight',
        ],
        answer: 1,
        explain:
          'Any single vector observation leaves a one-parameter rotation family about that vector undetermined. Pairing with a second, non-parallel vector (a sun sensor) fixes it, which is the classic coarse attitude determination scheme — and it fails in eclipse, and when the sun and field vectors align. Dynamic filtering recovers observability over time as the field direction changes along the orbit, but slowly. The accuracy ceiling is set by the field model plus the spacecraft magnetic cleanliness, and magnetometer attitude is typically a few degrees at best, which is why it is used for safe modes and for magnetorquer control rather than for pointing.',
        b: 1.1,
        bloom: 'understand',
      },
      {
        id: 'q_m38_trn',
        q: 'What is terrain relative navigation and what problem does it solve that inertial navigation cannot?',
        choices: [
          'It measures altitude above terrain, replacing the radar altimeter',
          'It matches camera imagery against an onboard map of the landing region (craters, landmarks, or template patches) to produce an ABSOLUTE position fix relative to the terrain. Inertial navigation drifts and has no knowledge of where the map is, so it cannot remove the accumulated position error or the map-tie error that dominates landing accuracy',
          'It uses terrain slope to estimate attitude',
          'It is a backup for GNSS on Earth only',
        ],
        answer: 1,
        explain:
          'The inertial solution answers "how have I moved" with drift; it never answers "where am I relative to the hazard-free landing site". Before TRN, Mars landing ellipses were kilometres across, dominated by delivery and map-tie uncertainty. The Mars 2020 Lander Vision System matched descent imagery to an orbital map during parachute descent and cut the position uncertainty to tens of metres, which is what made Terrain Relative Navigation and the associated divert possible in the Jezero hazard field. The same architecture — absolute fixes against a map, fused with an inertial solution in a filter — is what any precision landing system needs.',
        b: 1.2,
        bloom: 'understand',
      },
      {
        id: 'q_m38_two_vector',
        q: 'A sun sensor and a magnetometer give you two vectors. Under what geometry does the attitude solution degrade, and what do you do?',
        choices: [
          'When the two vectors are orthogonal; rotate the spacecraft',
          'When the two vectors become nearly parallel, since the cross product that fixes the third axis shrinks like the sine of the angle between them and noise is amplified by 1/sin. Mitigations: weight the measurements properly with QUEST rather than using TRIAD, propagate through the degraded window with the gyro in a filter, flag the epoch as low confidence, and add a third source',
          'When the spacecraft is in eclipse only; use the magnetometer alone',
          'When the magnetic field is strong; attenuate the magnetometer',
        ],
        answer: 1,
        explain:
          'Two-vector attitude determination fails precisely as the observation geometry collapses toward collinearity, and in low Earth orbit the sun vector and the magnetic field vector do become nearly parallel at predictable points in the orbit. The first and easiest fix is to stop using TRIAD: QUEST weights by measurement accuracy, uses everything and returns a covariance that honestly reports the degraded direction. The real fix is dynamic: a filter carrying gyro propagation coasts through the bad geometry with a covariance that grows and then shrinks again, which is exactly what a MEKF does for you.',
        b: 1.3,
        bloom: 'apply',
      },
      {
        id: 'q_m38_pinhole',
        q: 'In the pinhole camera model, what does a single landmark observation constrain?',
        choices: [
          'The full 3-D position of the camera',
          'A single bearing: the pixel gives a unit line-of-sight direction from the camera to the landmark, so one observation constrains two degrees of freedom and leaves range unknown. Position needs multiple landmarks, motion parallax, or an independent range measurement',
          'The camera attitude only, never position',
          'Nothing useful without stereo',
        ],
        answer: 1,
        explain:
          'Back-projecting a pixel through the intrinsics gives a ray, not a point. That is why monocular optical navigation needs several landmarks (three known landmarks give a P3P solution with up to four candidate poses), or motion over time to obtain parallax, or a laser altimeter to supply range directly. It is also why the scale of monocular visual odometry is unobservable without an accelerometer or a known baseline. When you write the measurement model, the residual is properly expressed in normalised image coordinates or as an angle, with the covariance derived from the centroid uncertainty in pixels times the inverse focal length.',
        b: 1.0,
        bloom: 'apply',
      },
    ],
    cards: [
      {
        id: 'c_m38_star_acc',
        front: 'Star tracker accuracy asymmetry',
        back: 'About-boresight (roll) error is roughly 1/tan(half FOV) times worse than cross-boresight, typically 5-10x. Fly two heads with different boresights to fix it.',
        formula: true,
      },
      {
        id: 'c_m38_lost',
        front: 'Lost-in-space problem',
        back: 'Identify stars with NO prior attitude. The invariant used is the interstar angle, which does not change under rotation: match observed angle patterns against a precomputed catalog index.',
      },
      {
        id: 'c_m38_pyramid',
        front: 'Pyramid star identification',
        back: 'Triangle matching votes on triples of stars; the pyramid step confirms with a fourth star consistent with all three angles. The confirmation is what collapses the false-identification rate in a crowded or noisy field.',
      },
      {
        id: 'c_m38_exclusion',
        front: 'Star tracker exclusion angles',
        back: 'Keep-out cones around the Sun (typically 30-45 deg), Earth limb (tens of degrees) and Moon. Violating them blinds the tracker, so they are a hard constraint on attitude planning, not a preference.',
      },
      {
        id: 'c_m38_centroid',
        front: 'Sub-pixel centroiding',
        back: 'Defocus the star deliberately across several pixels so an intensity-weighted centroid reaches roughly 1/10 pixel or better. A perfectly focused point source lands on one pixel and gives you no sub-pixel information at all.',
      },
      {
        id: 'c_m38_sun',
        front: 'Coarse sun sensor model',
        back: 'Current is proportional to cos(angle between the sun vector and the cell normal), clipped at zero. Several cells on different faces give a least-squares sun vector; accuracy is degrees, dominated by Earth albedo.',
        formula: true,
      },
      {
        id: 'c_m38_albedo',
        front: 'Albedo error',
        back: 'Earth reflects roughly 30% of incident sunlight, so a nadir-facing coarse sun sensor sees a large false signal. It peaks over bright terrain and cloud near the terminator and can cost several degrees of sun-vector accuracy.',
      },
      {
        id: 'c_m38_one_vector',
        front: 'What one vector measurement gives you',
        back: 'Two of three attitude degrees of freedom. Rotation about the measured vector is unobservable instantaneously; you need a second non-parallel vector, or time plus dynamics in a filter.',
      },
      {
        id: 'c_m38_hardsoft',
        front: 'Hard-iron and soft-iron',
        back: 'Hard iron is an additive offset from the spacecraft own permanent dipole; soft iron is a multiplicative distortion from induced magnetisation. Calibration fits an ellipsoid: centre gives hard iron, the shape matrix gives soft iron.',
        formula: true,
      },
      {
        id: 'c_m38_igrf',
        front: 'IGRF / WMM',
        back: 'Spherical harmonic models of the geomagnetic field, updated roughly every five years with secular variation terms. Model error of a few hundred nT sets the floor on magnetometer-based attitude.',
      },
      {
        id: 'c_m38_pinhole',
        front: 'Pinhole camera model',
        back: 'u = fx*(X/Z) + cx, v = fy*(Y/Z) + cy, in the camera frame. Inverting a pixel gives a RAY, not a point — one observation is a bearing, not a position.',
        formula: true,
      },
      {
        id: 'c_m38_trn',
        front: 'Terrain relative navigation',
        back: 'Match descent imagery to an onboard map (craters, landmarks, template patches) for an ABSOLUTE position fix relative to the terrain. It removes both inertial drift and map-tie error, which is what turns a kilometre landing ellipse into tens of metres.',
      },
      {
        id: 'c_m38_altimeter',
        front: 'Radar versus laser altimeter',
        back: 'Radar: long range, works through dust and in daylight, wide beam so it averages terrain. Lidar: narrow beam, centimetre precision, gives slant range and can build a hazard map — but it is scattered by dust and plume.',
      },
      {
        id: 'c_m38_alignment',
        front: 'Sensor alignment estimation',
        back: 'The mounting alignment between a star tracker, the IMU and the vehicle frame is never exactly as built and shifts with thermal load. Estimate the misalignment as filter states or calibrate it in flight — an uncorrected alignment error is a pure attitude bias.',
      },
    ],
  },

  {
    id: 't4_m39_orbit_determination',
    track: 'gnc',
    tier: 4,
    title: 'Orbit Determination',
    summary:
      'Turn tracking data into an orbit and an honest covariance: initial orbit determination from angles or positions, batch least squares with the state transition matrix, and sequential filtering. You will be able to read an RIC covariance ellipsoid and compute a collision probability from it.',
    prereqs: ['t4_m35_nonlinear_filters', 't2_m21_perturbations', 't4_m37_gnss'],
    hours: 50,
    topics: [
      'Initial orbit determination: angles-only (Gauss, Laplace, double-r), three position vectors (Gibbs, Herrick-Gibbs), range and range-rate methods',
      'Batch least-squares orbit determination with the state transition matrix',
      'The variational equations and computing the STM by integration',
      'Sequential orbit determination with EKF and UKF',
      'Measurement types and models: range, range-rate/Doppler, angles, GNSS, VLBI, inter-satellite links',
      'Station and tracking geometry and its effect on observability',
      'Process noise for orbit determination: Gauss-Markov acceleration and dynamic model compensation',
      'Consider-covariance analysis',
      'Residual editing and data weighting',
      'Orbit accuracy metrics and covariance in the RIC (radial, in-track, cross-track) frame',
      'Conjunction assessment and collision probability',
      'Maneuver estimation and reconstruction',
      'Relative orbit determination for constellations; autonomous onboard orbit determination',
    ],
    objectives: [
      'Implement batch least-squares orbit determination using the state transition matrix',
      'Build a sequential orbit determination filter and compare it to the batch solution',
      'Interpret an RIC covariance ellipsoid and explain why it is long in-track',
      'Compute a collision probability and explain the dilution paradox',
    ],
    resources: [
      {
        title: 'Fundamentals of Astrodynamics and Applications, Ch. 8 and 10',
        author: 'David Vallado',
        kind: 'book',
        free: false,
        note: 'The practical orbit determination reference, with algorithms you can implement directly.',
      },
      {
        title: 'Statistical Orbit Determination',
        author: 'Tapley, Schutz & Born',
        kind: 'book',
        free: false,
        note: 'The canonical text: batch, sequential, consider covariance, and the variational equations.',
      },
      { title: 'Orbital Mechanics for Engineering Students, Ch. 5', author: 'Howard Curtis', kind: 'book', free: false },
      {
        title: 'Satellite Orbits: Models, Methods and Applications, Ch. 8',
        author: 'Montenbruck & Gill',
        kind: 'book',
        free: false,
      },
      { title: 'NASA GMAT', kind: 'tool', free: true, note: 'Open-source mission analysis; useful for validating your own solutions.' },
      { title: 'Orekit', kind: 'tool', free: true, note: 'Open-source Java astrodynamics library with a full OD stack.' },
    ],
    exercises: [
      {
        id: 'ex_m39_gibbs',
        title: 'Gibbs and Herrick-Gibbs',
        kind: 'code',
        lang: 'python',
        hours: 6,
        prompt: `Implement both three-position-vector initial orbit determination methods.

1. **Gibbs**: purely geometric, uses only the three position vectors.
2. **Herrick-Gibbs**: a Taylor-series method that also uses the three times.
3. Sweep the angular separation between the vectors from 30 degrees down to 0.1 degrees and plot velocity error for both.
4. Identify the crossover separation below which Herrick-Gibbs is better.

Success: the crossover appears around a few degrees, matching the standard guidance, and you can explain the numerical reason for each method failing at its end of the range.`,
        starter: `import numpy as np

MU_EARTH = 3.986004418e14   # m^3/s^2


def gibbs(r1, r2, r3, mu=MU_EARTH):
    """Gibbs method: return the velocity at r2. Purely geometric."""
    raise NotImplementedError


def herrick_gibbs(r1, r2, r3, t1, t2, t3, mu=MU_EARTH):
    """Herrick-Gibbs method: return the velocity at r2, using the time tags."""
    raise NotImplementedError


def coplanarity_error_deg(r1, r2, r3):
    """Angle between r1 and the plane of r2, r3 — a sanity check before either method."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'Gibbs recovers a circular orbit velocity',
            assert: `import numpy as np
R = 7.0e6
v_circ = np.sqrt(MU_EARTH / R)
n = v_circ / R
ts = np.array([-120.0, 0.0, 120.0])
rs = np.array([[R * np.cos(n * t), R * np.sin(n * t), 0.0] for t in ts])
v = gibbs(rs[0], rs[1], rs[2])
v_true = np.array([-R * n * np.sin(0.0), R * n * np.cos(0.0), 0.0])
assert np.linalg.norm(v - v_true) / v_circ < 1e-6, "Gibbs should be near-exact at 10 deg separation"`,
          },
          {
            name: 'Herrick-Gibbs wins at small separation',
            assert: `import numpy as np
R = 7.0e6
v_circ = np.sqrt(MU_EARTH / R); n = v_circ / R
dt = 2.0                                  # about 0.06 deg of arc
ts = np.array([-dt, 0.0, dt])
rs = np.array([[R * np.cos(n * t), R * np.sin(n * t), 0.0] for t in ts])
v_true = np.array([0.0, R * n, 0.0])
e_g = np.linalg.norm(gibbs(rs[0], rs[1], rs[2]) - v_true)
e_hg = np.linalg.norm(herrick_gibbs(rs[0], rs[1], rs[2], ts[0], ts[1], ts[2]) - v_true)
assert e_hg < e_g, "at tiny separation Herrick-Gibbs must beat Gibbs (%.3e vs %.3e)" % (e_hg, e_g)`,
          },
          {
            name: 'coplanarity check catches non-coplanar input',
            assert: `import numpy as np
r1 = np.array([7e6, 0.0, 0.0]); r2 = np.array([0.0, 7e6, 0.0]); r3 = np.array([-7e6, 0.0, 0.0])
assert coplanarity_error_deg(r1, r2, r3) < 1e-6, "these are coplanar"
r3b = np.array([-7e6, 0.0, 1e6])
assert coplanarity_error_deg(r1, r2, r3b) > 1.0, "these are not coplanar and must be flagged"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m39_batch',
        title: 'Batch least-squares OD with the STM',
        kind: 'code',
        lang: 'python',
        hours: 10,
        prompt: `Simulate three ground-station passes of range and range-rate data over 12 hours for a low Earth orbit satellite, with realistic noise and an unmodelled drag coefficient error.

1. Integrate the trajectory AND the variational equations to get the state transition matrix.
2. Map each measurement partial back to the epoch state with the STM.
3. Accumulate the normal equations, solve, and iterate to convergence.
4. Report the epoch covariance, then map it forward and rotate it into the RIC frame.
5. Estimate the drag coefficient as a seventh state and show what it does to the covariance.

Success: residual RMS matches the injected noise, the RIC covariance is dramatically longest in-track, and adding the drag state removes a visible signature from the residuals.`,
        starter: `"""Batch least squares: the estimator that does not throw data away.

A Kalman filter is sequential and forgets. Batch OD holds every measurement
and maps them all back to one epoch through the state transition matrix, which
is why it is still what orbit determination uses for precise work.
"""

import numpy as np


def accumulate_normal_equations(H_list, y_list, W_list):
    """Build (Lambda, N) = (sum H' W H, sum H' W y).

    TODO: loop and accumulate. Everything about batch OD is in these two sums.
    """
    raise NotImplementedError


def solve_normal(Lambda: np.ndarray, N: np.ndarray) -> np.ndarray:
    """Solve for the epoch-state correction.

    TODO: np.linalg.solve, not inv. The normal matrix is routinely
    ill-conditioned and forming its inverse throws away digits you need.
    """
    raise NotImplementedError


def map_partial_to_epoch(H_at_t: np.ndarray, stm: np.ndarray) -> np.ndarray:
    """Chain rule: a partial taken at time t, expressed at the epoch.

    TODO: H_epoch = H_at_t @ Phi(t, t0). This is the only reason the STM is
    integrated alongside the trajectory.
    """
    raise NotImplementedError


def epoch_covariance(Lambda: np.ndarray) -> np.ndarray:
    """P = inverse of the normal matrix."""
    return np.linalg.inv(Lambda)


if __name__ == "__main__":
    rng = np.random.default_rng(11)
    truth = np.array([1.0, -2.0, 0.5])
    H = [rng.normal(size=(2, 3)) for _ in range(40)]
    W = [np.eye(2) for _ in H]
    y = [h @ truth + rng.normal(scale=1e-3, size=2) for h in H]
    L, N = accumulate_normal_equations(H, y, W)
    print("estimate:", solve_normal(L, N))
    print("truth   :", truth)
`,
        tests: [
          {
            name: 'noiseless data is recovered exactly',
            assert: `rng = np.random.default_rng(5)
truth = np.array([2.0, -1.0, 0.25])
H = [rng.normal(size=(2,3)) for _ in range(30)]
W = [np.eye(2) for _ in H]
y = [h @ truth for h in H]
L, N = accumulate_normal_equations(H, y, W)
assert np.allclose(solve_normal(L, N), truth, atol=1e-8)`,
          },
          {
            name: 'the normal matrix is symmetric and positive definite when observable',
            assert: `rng = np.random.default_rng(6)
H = [rng.normal(size=(2,3)) for _ in range(30)]
L, _ = accumulate_normal_equations(H, [np.zeros(2)]*30, [np.eye(2)]*30)
assert np.allclose(L, L.T, atol=1e-10)
assert np.linalg.eigvalsh(L).min() > 0`,
          },
          {
            name: 'weighting a measurement more pulls the solution toward it',
            assert: `H = [np.array([[1.0, 0.0]]), np.array([[1.0, 0.0]]), np.array([[0.0, 1.0]])]
y = [np.array([1.0]), np.array([3.0]), np.array([0.0])]
even = solve_normal(*accumulate_normal_equations(H, y, [np.eye(1)]*3))
tilt = solve_normal(*accumulate_normal_equations(H, y, [np.eye(1), 100*np.eye(1), np.eye(1)]))
assert abs(even[0] - 2.0) < 1e-9
assert tilt[0] > 2.9, 'the heavily weighted measurement must dominate'`,
          },
          {
            name: 'the STM chain rule composes partials correctly',
            assert: `rng = np.random.default_rng(9)
H_t = rng.normal(size=(2, 6)); Phi = rng.normal(size=(6, 6))
assert np.allclose(map_partial_to_epoch(H_t, Phi), H_t @ Phi)`,
          },
          {
            name: 'more measurements shrink the epoch covariance',
            assert: `rng = np.random.default_rng(12)
H = [rng.normal(size=(2,3)) for _ in range(60)]
few, _ = accumulate_normal_equations(H[:10], [np.zeros(2)]*10, [np.eye(2)]*10)
many, _ = accumulate_normal_equations(H, [np.zeros(2)]*60, [np.eye(2)]*60)
assert np.trace(epoch_covariance(many)) < np.trace(epoch_covariance(few))`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m39_pc',
        title: 'Conjunction assessment and the dilution paradox',
        kind: 'code',
        lang: 'python',
        hours: 5,
        prompt: `For a close approach with a given miss vector and combined covariance:

1. Implement the standard 2-D collision probability in the conjunction plane (Foster/Akella-Alfriend style), with a combined hard-body radius.
2. Sweep the covariance size from very small to very large with the miss distance fixed, and plot Pc.
3. Explain the non-monotonic result: Pc peaks at an intermediate covariance and FALLS for very large covariance.

Success: the dilution peak is reproduced, and you can explain why a large Pc from a poor orbit solution is not the same risk statement as a large Pc from a precise one.`,
        starter: `"""Collision probability, and why a bigger covariance can mean a smaller Pc.

The dilution paradox catches people out every time: as the covariance grows
from very small, Pc rises, peaks, and then FALLS. A large Pc from a sloppy
orbit solution is a different statement from a large Pc from a precise one.
"""

import numpy as np

HARD_BODY_M = 20.0          # combined radius of the two objects


def pc_circular(miss_m: float, sigma_m: float, radius_m: float = HARD_BODY_M) -> float:
    """2-D collision probability for an isotropic covariance in the
    conjunction plane, in the small-hard-body limit.

    TODO: with the hard body small against sigma the density is essentially
    constant across it, so
        Pc = (radius^2 / (2 sigma^2)) * exp(-miss^2 / (2 sigma^2))
    Derive it by integrating the 2-D Gaussian over a disc of radius \`radius\`
    centred at \`miss\`.
    """
    raise NotImplementedError


def dilution_peak_sigma(miss_m: float) -> float:
    """The sigma at which Pc is maximised for a fixed miss distance.

    TODO: differentiate log Pc with respect to sigma and set it to zero. The
    answer is miss / sqrt(2), and it does not depend on the hard-body radius
    at all.
    """
    raise NotImplementedError


if __name__ == "__main__":
    miss = 500.0
    for s in np.logspace(1, 4, 7):
        print(f"sigma={s:9.1f} m   Pc={pc_circular(miss, s):.3e}")
    print(f"peak at sigma = {dilution_peak_sigma(miss):.1f} m")
`,
        tests: [
          {
            name: 'Pc matches the closed form',
            assert: `m, s, r = 500.0, 300.0, HARD_BODY_M
expect = (r*r/(2*s*s))*np.exp(-m*m/(2*s*s))
assert abs(pc_circular(m, s, r) - expect) < 1e-15`,
          },
          {
            name: 'the dilution peak sits at miss over root two',
            assert: `for m in (100.0, 500.0, 2500.0):
    assert abs(dilution_peak_sigma(m) - m/np.sqrt(2)) < 1e-9`,
          },
          {
            name: 'that really is the maximum — sweeping sigma agrees',
            assert: `m = 500.0
s = np.logspace(0, 5, 20001)
pc = np.array([pc_circular(m, x) for x in s])
assert abs(s[pc.argmax()] - dilution_peak_sigma(m)) < 0.01*dilution_peak_sigma(m)`,
          },
          {
            name: 'Pc falls again for a very large covariance — the paradox itself',
            assert: `m = 500.0
peak = dilution_peak_sigma(m)
assert pc_circular(m, peak*100) < pc_circular(m, peak), 'a sloppier solution reports LESS risk'
assert pc_circular(m, peak/100) < pc_circular(m, peak), 'and so does a much tighter one'`,
          },
          {
            name: 'Pc scales with the square of the hard-body radius',
            assert: `m, s = 500.0, 400.0
assert abs(pc_circular(m, s, 40.0)/pc_circular(m, s, 20.0) - 4.0) < 1e-9`,
            hidden: true,
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q_m39_gibbs',
        q: 'Why does the Gibbs method degrade for closely spaced position vectors, and what do you use instead?',
        choices: [
          'Because it ignores the time tags; use Lambert targeting instead',
          'Gibbs is purely geometric and relies on cross products between the three position vectors. As the vectors converge, those cross products become differences of nearly equal numbers and catastrophic cancellation destroys the result. Herrick-Gibbs, which expands the position in a Taylor series about the middle time, is the right tool below roughly one to five degrees of separation',
          'Because it assumes a circular orbit; use the Gauss angles-only method instead',
          'Because it needs four position vectors, not three',
        ],
        answer: 1,
        explain:
          'The failure is numerical, not physical. Gibbs forms vectors like r1 cross r2 that shrink as the separation shrinks, so their relative error blows up even though the geometry is still well defined in exact arithmetic. Herrick-Gibbs instead assumes the three points are close enough for a truncated Taylor expansion in time, so it wants SMALL separation and degrades when the points are far apart. The standard practice is to run both and pick by separation angle, with the crossover typically quoted between one and five degrees. Both should be preceded by a coplanarity check, since a genuine non-coplanar triple means bad data association rather than a hard geometry.',
        b: 1.3,
        bloom: 'analyze',
      },
      {
        id: 'q_m39_stm',
        q: 'What role does the state transition matrix play in batch orbit determination?',
        choices: [
          'It integrates the orbit; the measurements are processed independently',
          'It maps a perturbation of the epoch state forward to any measurement time, so the measurement partial with respect to the epoch state is dh/dx(t) times Phi(t, t0). That is what lets measurements spread over days be accumulated into a single set of normal equations in the six (or more) epoch parameters',
          'It converts between inertial and Earth-fixed frames',
          'It propagates the covariance only; the estimate uses the nonlinear dynamics',
        ],
        answer: 1,
        explain:
          'Batch OD estimates a small number of parameters at a single epoch. Every measurement is taken at a different time, so its sensitivity has to be referred back to the epoch, and the STM is exactly that linear map. It is obtained by integrating the variational equations Phi_dot = A(t)*Phi alongside the trajectory, with Phi(t0, t0) = I. The same STM maps the epoch covariance forward for prediction. Note the STM is the linearization of the true nonlinear flow, so batch OD iterates: re-integrate the reference trajectory, recompute the STM, re-solve, until the correction is negligible.',
        b: 1.4,
        bloom: 'understand',
      },
      {
        id: 'q_m39_dmc',
        q: 'What is dynamic model compensation and what problem does it solve?',
        choices: [
          'A method for compensating station clock errors',
          'Augmenting the state with a first-order Gauss-Markov acceleration (exponentially correlated noise with a chosen time constant and steady-state sigma) to absorb unmodelled forces such as mismodelled drag, solar radiation pressure or small thrusting. It prevents the filter from becoming optimistic and the residuals from showing structure, without requiring you to model the physics exactly',
          'Recomputing the gravity field coefficients from the tracking data',
          'Inflating the measurement noise R to account for dynamics errors',
        ],
        answer: 1,
        explain:
          'A pure white process noise is a poor description of a mismodelled force, which is typically correlated over minutes to hours. DMC models it as a coloured process with a correlation time chosen to match the physics, so the filter can absorb a smooth error without over-fitting or drifting. It is the standard answer to residuals that show slow structure in a low Earth orbit solution where drag is uncertain. The alternatives are to model the effect explicitly (better when you can) or to use a consider covariance (better when the parameter is badly observable and you only want its uncertainty accounted for).',
        b: 1.6,
        bloom: 'understand',
      },
      {
        id: 'q_m39_optimistic',
        q: 'Your OD covariance is optimistic compared to the actual errors. Name three causes.',
        choices: [
          'Too many measurements; too many stations; too long an arc',
          'Unmodelled or mismodelled dynamics with too little process noise (drag, solar radiation pressure, an undetected manoeuvre); measurement errors that are correlated or biased rather than white and zero-mean (station biases, timing, tropospheric mismodelling), so the data carries less independent information than the filter assumes; and linearization error over a long arc, or neglected parameter uncertainty that a consider covariance would capture',
          'Numerical round-off only',
          'The reference trajectory was integrated with too small a step size',
        ],
        answer: 1,
        explain:
          'An optimistic covariance means the filter believes it has more information than it does. The three families of cause are dynamics, measurements and linearization. Correlated measurement error is the one people forget: if a station has a range bias, one hundred measurements from that pass are nearly one measurement in information content, yet the filter counts one hundred. The remedies mirror the causes: DMC or explicit force modelling, station bias states or consider parameters, data weighting and de-correlation, and covariance realism factors validated against overlapping-arc comparisons.',
        b: 1.7,
        bloom: 'analyze',
      },
      {
        id: 'q_m39_ric',
        q: 'Why is an orbit covariance ellipsoid much longer in-track than radial or cross-track?',
        choices: [
          'Because tracking stations are distributed in longitude',
          'Because a small error in semi-major axis (or energy) changes the orbital period, so a timing or along-track error grows linearly with every revolution while radial and cross-track errors remain bounded and oscillatory. Along-track uncertainty is therefore the dominant axis for any propagated orbit',
          'Because the Earth gravity field is strongest in the in-track direction',
          'Because drag acts only in the cross-track direction',
        ],
        answer: 1,
        explain:
          'The in-track direction is the secular one. Through the vis-viva relation, an error in semi-major axis maps to an error in mean motion, so phase error accumulates every orbit; radial and cross-track errors just oscillate at orbital frequency. That is why RIC covariance ellipsoids after a day of propagation are cigars pointed along track, and why conjunction analysis is largely a debate about along-track timing. It is also why drag uncertainty in low Earth orbit dominates long-term prediction: drag changes energy, which changes the period, which becomes along-track error.',
        b: 1.3,
        bloom: 'analyze',
      },
    ],
    cards: [
      {
        id: 'c_m39_gibbs',
        front: 'Gibbs method',
        back: 'Velocity at r2 from three POSITION vectors by pure geometry, no times required. Needs wide angular separation — cross-product cancellation destroys it below a few degrees.',
      },
      {
        id: 'c_m39_hgibbs',
        front: 'Herrick-Gibbs method',
        back: 'Velocity at r2 from three positions AND their times, via a truncated Taylor expansion. Wants SMALL separation; crossover with Gibbs is typically one to five degrees of arc.',
      },
      {
        id: 'c_m39_gauss',
        front: 'Gauss angles-only IOD',
        back: 'Three optical observations (right ascension and declination) plus observer positions give the orbit by solving an eighth-degree polynomial for the middle slant range. Sensitive to observation spacing; refine by iteration.',
      },
      {
        id: 'c_m39_stm',
        front: 'State transition matrix',
        back: 'Phi(t, t0) maps a state perturbation at t0 to one at t. Obtained by integrating Phi_dot = A(t)*Phi with Phi(t0,t0) = I, alongside the trajectory — the variational equations.',
        formula: true,
      },
      {
        id: 'c_m39_batch',
        front: 'Batch OD normal equations',
        back: 'Accumulate Lambda = sum of (H_i*Phi_i).T * inv(R_i) * (H_i*Phi_i) and N = sum of (H_i*Phi_i).T * inv(R_i) * y_i, then solve Lambda*dx0 = N. Iterate by re-integrating the reference trajectory.',
        formula: true,
      },
      {
        id: 'c_m39_ric',
        front: 'RIC frame',
        back: 'Radial, In-track, Cross-track — the natural frame for orbit errors. Always report covariance in RIC, never in inertial Cartesian, because the physical structure is only visible in RIC.',
      },
      {
        id: 'c_m39_intrack',
        front: 'Why the covariance is long in-track',
        back: 'A semi-major axis error changes the period, so along-track phase error grows linearly every revolution while radial and cross-track errors stay bounded and oscillatory.',
      },
      {
        id: 'c_m39_dmc',
        front: 'Dynamic model compensation',
        back: 'Augment the state with a first-order Gauss-Markov acceleration: adot = -a/tau + w. It absorbs correlated unmodelled forces (drag, solar radiation pressure, small thrusting) that white process noise describes badly.',
        formula: true,
      },
      {
        id: 'c_m39_consider',
        front: 'Consider covariance',
        back: 'Account for the uncertainty of a parameter you do NOT estimate (station bias, gravity coefficient, area-to-mass). The estimate is unchanged but the covariance is correctly inflated — the honest answer for poorly observable parameters.',
      },
      {
        id: 'c_m39_pc',
        front: 'Collision probability',
        back: 'Project the relative position and combined covariance into the conjunction plane perpendicular to the relative velocity, then integrate the 2-D Gaussian over a disc of the combined hard-body radius.',
        formula: true,
      },
      {
        id: 'c_m39_dilution',
        front: 'Probability dilution',
        back: 'Pc is non-monotonic in covariance size: it peaks at an intermediate uncertainty and FALLS for very large covariance, because the probability mass spreads out. A small Pc from a poor solution is not reassurance — it is ignorance.',
      },
      {
        id: 'c_m39_batch_vs_seq',
        front: 'Batch versus sequential OD',
        back: 'Batch: all data at once, iterated, best accuracy and easiest to diagnose from residuals, but offline. Sequential (EKF/UKF): recursive, real-time, onboard-capable, and needs careful process noise. Operations typically run both and compare.',
      },
      {
        id: 'c_m39_editing',
        front: 'Residual editing',
        back: 'Reject measurements whose normalised residual exceeds a threshold (commonly 3 sigma), but always count and trend the rejections. A rising edit rate is the first symptom of an unmodelled manoeuvre or a dynamics error.',
      },
      {
        id: 'c_m39_maneuver',
        front: 'Manoeuvre estimation',
        back: 'Either solve for an impulsive delta-v at a known epoch as extra state parameters, or detect the manoeuvre from a residual break and split the arc. An undetected manoeuvre is the classic cause of a wildly optimistic covariance.',
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════════════════════
     TIER 5 — GUIDANCE
     ══════════════════════════════════════════════════════════════════════════ */

  {
    id: 't5_m40_guidance_fundamentals',
    track: 'gnc',
    tier: 5,
    title: 'Guidance Fundamentals',
    summary:
      'Learn the small set of guidance laws that everything else is built on: proportional navigation derived from line-of-sight rate, ZEM/ZEV feedback for soft landing, and the gravity turn. You will be able to derive PN on a whiteboard and explain what happens when time-to-go is estimated badly.',
    prereqs: ['t3_m26_classical_control', 't2_m20_orbital_maneuvers', 't1_m13_classical_mechanics'],
    hours: 50,
    topics: [
      'The guidance / navigation / control decomposition and the loop rate of each',
      'Open-loop vs closed-loop guidance; reference-trajectory following vs explicit guidance',
      'Line-of-sight guidance and pursuit guidance',
      'Proportional navigation: derivation, the navigation constant N, and the LOS-rate nulling principle',
      'Why N between 3 and 5; augmented proportional navigation for manoeuvring targets',
      'True vs pure proportional navigation',
      'Optimal guidance from an LQ formulation and how PN emerges from it',
      'Zero-effort-miss and zero-effort-velocity guidance; the ZEM/ZEV feedback law for landing',
      'Miss-distance analysis and adjoint methods',
      'Time-to-go estimation and why it is the critical quantity',
      'Gravity turn ascent and zero-lift trajectories; the pitch program and open-loop pitch kick',
      'Terminal vs midcourse guidance; guidance under actuator limits',
    ],
    objectives: [
      'Derive the proportional navigation acceleration command from line-of-sight rate and closing velocity',
      'Implement ZEM/ZEV guidance for a soft landing and compare its fuel use against an optimal solution',
      'Design and fly a gravity-turn ascent that hits a target insertion condition',
      'Explain the failure modes of PN when time-to-go or closing velocity is poorly known',
    ],
    resources: [
      {
        title: 'Tactical and Strategic Missile Guidance',
        author: 'Paul Zarchan',
        kind: 'book',
        free: false,
        note: 'AIAA Progress in Astronautics and Aeronautics. The canonical guidance text, with complete simulation code and the definitive chapters on proportional navigation and miss distance.',
      },
      { title: 'Missile Guidance and Control Systems', author: 'George Siouris', kind: 'book', free: false },
      {
        title: 'An Introduction to the Mathematics and Methods of Astrodynamics',
        author: 'Richard Battin',
        kind: 'book',
        free: false,
        note: 'For the astrodynamic-guidance side, including the origins of explicit guidance.',
      },
      {
        title: 'ZEM/ZEV feedback guidance papers',
        author: 'Furfaro et al.',
        kind: 'paper',
        free: false,
        note: 'The modern treatment of zero-effort-miss / zero-effort-velocity landing guidance.',
      },
      {
        title: 'Survey papers on entry and powered descent guidance',
        author: 'Ping Lu',
        kind: 'paper',
        free: false,
        note: 'Published in the Journal of Guidance, Control, and Dynamics. Read these for the state of the field.',
      },
    ],
    exercises: [
      {
        id: 'ex_m40_pn',
        title: 'Proportional navigation, N swept from 2 to 6',
        kind: 'code',
        lang: 'python',
        hours: 7,
        prompt: `Implement planar proportional navigation against a non-manoeuvring and then a manoeuvring target.

1. Compute line-of-sight rate and closing velocity from the relative state.
2. Command a_c = N * Vc * lambda_dot perpendicular to the line of sight.
3. Sweep N from 2 to 6 and plot miss distance and peak commanded acceleration.
4. Add a first-order autopilot lag and re-run; show how the optimal N moves.
5. Implement augmented PN and show the improvement against a constant-g manoeuvring target.

Success: miss distance collapses for N >= 3 without lag, the lag case shows the classic trade, and APN visibly beats PN against the manoeuvring target.`,
        starter: `import numpy as np


def los_rate_and_closing(r_rel, v_rel):
    """Return (lambda_dot vector, closing velocity Vc) from the relative state.

    lambda_dot = cross(r_rel, v_rel) / dot(r_rel, r_rel)
    Vc = -dot(r_rel, v_rel) / norm(r_rel)
    """
    raise NotImplementedError


def pn_command(r_rel, v_rel, N=4.0, target_accel=None):
    """True proportional navigation, with the augmented term when target_accel is given."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'a collision course has zero line-of-sight rate',
            assert: `import numpy as np
r = np.array([1000.0, 0.0, 0.0])
v = np.array([-300.0, 0.0, 0.0])          # closing straight down the LOS
w, vc = los_rate_and_closing(r, v)
assert np.linalg.norm(w) < 1e-12, "a pure collision course must have zero LOS rate"
assert abs(vc - 300.0) < 1e-9, "closing velocity should be 300 m/s"
assert np.linalg.norm(pn_command(r, v)) < 1e-9, "PN commands nothing on a collision course"`,
          },
          {
            name: 'the command is perpendicular to the line of sight and scales with N',
            assert: `import numpy as np
r = np.array([1000.0, 0.0, 0.0])
v = np.array([-300.0, 20.0, 0.0])
a3 = pn_command(r, v, N=3.0)
a5 = pn_command(r, v, N=5.0)
assert abs(np.dot(a3, r)) < 1e-6 * np.linalg.norm(a3) * np.linalg.norm(r), "command must be perpendicular to the LOS"
assert abs(np.linalg.norm(a5) / np.linalg.norm(a3) - 5.0 / 3.0) < 1e-9, "magnitude is linear in N"`,
          },
          {
            name: 'augmented PN adds N/2 times the target acceleration',
            assert: `import numpy as np
r = np.array([1000.0, 0.0, 0.0]); v = np.array([-300.0, 20.0, 0.0])
at = np.array([0.0, 30.0, 0.0])
diff = pn_command(r, v, N=4.0, target_accel=at) - pn_command(r, v, N=4.0)
assert np.allclose(diff, 2.0 * at, atol=1e-9), "APN adds (N/2)*a_target"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m40_zemzev',
        title: 'ZEM/ZEV guidance for a lunar soft landing',
        kind: 'code',
        lang: 'python',
        hours: 8,
        prompt: `Implement the ZEM/ZEV feedback law for a soft landing under constant gravity.

ZEM = r_f - (r + v*tgo + 0.5*g*tgo^2)
ZEV = v_f - (v + g*tgo)
a = (6/tgo^2)*ZEM - (2/tgo)*ZEV

1. Fly it from a representative lunar descent initial condition to a zero-velocity touchdown.
2. Compare propellant used against an open-loop optimal solution from your trajectory-optimization tooling.
3. Add thrust magnitude limits and show what happens near the end when tgo becomes small.
4. Implement a tgo-selection rule (fixed schedule, energy-based, or optimal) and compare.

Success: soft touchdown within 1 m and 0.1 m/s, a quantified fuel gap against the optimum, and a clear demonstration of the tgo singularity and how you guard it.`,
        starter: `import numpy as np


def zem_zev(r, v, r_f, v_f, g, tgo):
    """Return (ZEM, ZEV) vectors for constant gravity g."""
    raise NotImplementedError


def zem_zev_accel(r, v, r_f, v_f, g, tgo):
    """The ZEM/ZEV feedback acceleration command."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'a coasting trajectory that already hits the target needs no command',
            assert: `import numpy as np
g = np.array([0.0, 0.0, -1.62])
r = np.array([0.0, 0.0, 1000.0]); v = np.array([5.0, 0.0, 0.0]); tgo = 20.0
r_f = r + v * tgo + 0.5 * g * tgo ** 2
v_f = v + g * tgo
zem, zev = zem_zev(r, v, r_f, v_f, g, tgo)
assert np.linalg.norm(zem) < 1e-9 and np.linalg.norm(zev) < 1e-9, "ZEM and ZEV must vanish on the natural trajectory"
assert np.linalg.norm(zem_zev_accel(r, v, r_f, v_f, g, tgo)) < 1e-9, "no command needed"`,
          },
          {
            name: 'the command is the optimal quadratic-cost gain pair',
            assert: `import numpy as np
g = np.array([0.0, 0.0, -1.62])
r = np.zeros(3); v = np.zeros(3); tgo = 10.0
r_f = np.array([100.0, 0.0, 0.0]); v_f = np.zeros(3)
zem, zev = zem_zev(r, v, r_f, v_f, g, tgo)
a = zem_zev_accel(r, v, r_f, v_f, g, tgo)
assert np.allclose(a, 6.0 / tgo ** 2 * zem - 2.0 / tgo * zev, atol=1e-12), "gains must be 6/tgo^2 and -2/tgo"`,
          },
        ],
      },
      {
        id: 'ex_m40_gravity_turn',
        title: 'Fly a gravity turn to orbital insertion',
        kind: 'code',
        lang: 'python',
        hours: 7,
        prompt: `Build a 3-DOF planar launch simulation with thrust, drag, and a spherical rotating Earth.

1. Fly vertically for a short period, apply a pitch kick of a few degrees, then let the vehicle fly at zero angle of attack (thrust along the velocity vector) through the atmosphere.
2. Tune the pitch-kick magnitude and time so the vehicle arrives at a target altitude and flight path angle at burnout.
3. Compute gravity losses, drag losses and steering losses and present the delta-v budget.
4. Show what happens to structural load (q*alpha) if you try to steer during max-Q.

Success: insertion within a few percent of the target and a loss budget whose terms you can each explain.`,
        starter: `"""A gravity turn, and where the delta-v actually goes.

After the pitch kick the vehicle flies at zero angle of attack and gravity
does the steering. The point of the exercise is the loss budget: gravity,
drag and steering losses are what separate the ideal delta-v from the real one.
"""

import numpy as np

G0 = 9.80665
RE = 6_371_000.0
MU = 3.986004418e14


def gravity_loss_vertical(t: float, g: float = G0) -> float:
    """Delta-v lost to gravity during a purely vertical rise, m/s.

    TODO: flying straight up, the whole of g opposes you for the whole burn,
    so the loss is just g * t. This is why vertical ascent is expensive and
    why the pitch kick comes early.
    """
    raise NotImplementedError


def gravity_loss(gamma_rad, dt: float, g: float = G0) -> float:
    """Loss over a trajectory with flight-path angle history gamma(t).

    TODO: integrate g * sin(gamma) dt. At gamma = 0 (horizontal) the loss
    vanishes, which is the whole reason for turning over.
    """
    raise NotImplementedError


def ideal_delta_v(isp_s: float, mass_ratio: float) -> float:
    """Tsiolkovsky: ve * ln(MR)."""
    return isp_s * G0 * np.log(mass_ratio)


def circular_speed(altitude_m: float) -> float:
    """Speed for a circular orbit at a given altitude."""
    return float(np.sqrt(MU / (RE + altitude_m)))


def q_alpha(rho: float, v: float, alpha_rad: float) -> float:
    """Dynamic pressure times angle of attack — the structural load indicator.

    TODO: 0.5 * rho * v^2 * alpha. Steering hard through max-Q is what this
    number exists to stop you doing.
    """
    raise NotImplementedError


if __name__ == "__main__":
    print(f"circular speed at 200 km = {circular_speed(200e3):.1f} m/s")
    print(f"ideal dv, Isp 300 s, MR 12 = {ideal_delta_v(300.0, 12.0):.1f} m/s")
    print(f"gravity loss over a 30 s vertical rise = {gravity_loss_vertical(30.0):.1f} m/s")
`,
        tests: [
          {
            name: 'vertical-rise gravity loss is g times time',
            assert: `assert abs(gravity_loss_vertical(30.0) - G0*30.0) < 1e-9
assert abs(gravity_loss_vertical(0.0)) < 1e-12`,
          },
          {
            name: 'a horizontal trajectory has no gravity loss at all',
            assert: `assert abs(gravity_loss(np.zeros(500), 0.1)) < 1e-9`,
          },
          {
            name: 'and a vertical one matches the closed form',
            assert: `n, dt = 300, 0.1
got = gravity_loss(np.full(n, np.pi/2), dt)
assert abs(got - G0*n*dt) < 1e-6*G0*n*dt, f'{got}'`,
          },
          {
            name: 'circular speed at 200 km is the familiar 7.8 km/s',
            assert: `v = circular_speed(200e3)
assert 7770.0 < v < 7800.0, f'{v}'
assert circular_speed(400e3) < circular_speed(200e3), 'higher orbit, slower'
# And the loss is no rounding error against it: thirty seconds of vertical
# rise alone spends more than 3% of orbital speed holding the vehicle up.
assert gravity_loss_vertical(30.0)/v > 0.03`,
          },
          {
            name: 'q-alpha is quadratic in speed and linear in angle of attack',
            assert: `base = q_alpha(0.4, 300.0, np.deg2rad(2.0))
assert abs(q_alpha(0.4, 600.0, np.deg2rad(2.0))/base - 4.0) < 1e-9
assert abs(q_alpha(0.4, 300.0, np.deg2rad(4.0))/base - 2.0) < 1e-9
assert abs(base - 0.5*0.4*300.0**2*np.deg2rad(2.0)) < 1e-9`,
            hidden: true,
          },
        ],
      },
    ],
    quiz: [
      {
        id: 'q_m40_pn_derive',
        q: 'Derive the proportional navigation command. What is it?',
        choices: [
          'a_c = N * lambda_dot, applied along the line of sight',
          'a_c = N * Vc * lambda_dot, applied perpendicular to the line of sight, where lambda_dot is the LOS rate and Vc is the closing velocity. It comes from the observation that a constant-bearing, decreasing-range geometry is a collision course, so nulling lambda_dot drives the intercept',
          'a_c = N * Vc / lambda_dot, applied along the velocity vector',
          'a_c = N * range * lambda_dot, applied along the LOS',
        ],
        answer: 1,
        explain:
          'The constant-bearing rule from navigation at sea is the whole idea: if the bearing to another vessel does not change and the range is closing, you will collide. So make the closure happen on purpose by commanding acceleration proportional to LOS rate. The Vc factor is what makes the loop gain (and therefore the effective time constant) independent of range, which is why PN is well behaved all the way to intercept. It also falls out of a linear-quadratic formulation with a terminal miss penalty, which is the deeper reason it is the right law rather than merely a clever one.',
        b: 1.2,
        bloom: 'apply',
      },
      {
        id: 'q_m40_n3',
        q: 'Why is N = 3 the theoretically optimal navigation constant against a non-manoeuvring target?',
        choices: [
          'Because three is the number of spatial dimensions',
          'Because minimising the integral of squared acceleration subject to zero terminal miss gives exactly a_c = 3*Vc*lambda_dot; N = 3 is the minimum-control-energy solution. Real designs use 4 or 5 to buy robustness against autopilot lag, noise and target manoeuvre, paying for it in peak acceleration',
          'Because miss distance is minimised at N = 3 in all cases',
          'Because the LOS rate transfer function has three poles',
        ],
        answer: 1,
        explain:
          'Pose the terminal guidance problem as minimising the integral of the squared commanded acceleration subject to driving zero-effort-miss to zero. The optimal feedback is a_c = 3*ZEM/tgo^2, which for a non-manoeuvring target is identical to 3*Vc*lambda_dot. Larger N nulls errors faster and is more tolerant of lag and of late disturbances, at the cost of higher peak acceleration and more sensitivity to LOS-rate noise (which grows near intercept as range shrinks). The practical range of 3 to 5 is where that trade lands for real seekers and real autopilots.',
        b: 1.5,
        bloom: 'understand',
      },
      {
        id: 'q_m40_tgo',
        q: 'What happens to guidance when time-to-go is badly estimated?',
        choices: [
          'Nothing; PN in the Vc*lambda_dot form does not use tgo',
          'Any ZEM-form or optimal law has gains scaling as 1/tgo^2 and 1/tgo, so a tgo error is a direct gain error: too small a tgo produces enormous commands and saturation, too large produces a sluggish response that runs out of time. Even PN is affected indirectly through the closing-velocity estimate, and near intercept every term becomes singular, so a guard or a terminal hold is mandatory',
          'The guidance becomes more robust because errors average out',
          'Only the terminal miss is affected, not the command history',
        ],
        answer: 1,
        explain:
          'tgo is the quantity that makes guidance a boundary-value problem rather than a regulator. It sets the gains, and the gains blow up as tgo goes to zero. Systems handle this with a floor on tgo, a switch to a terminal hold law in the last fraction of a second, or a reformulation that avoids the singularity. Getting tgo right is genuinely hard: for powered descent it depends on the thrust profile you have not flown yet, which is why the optimal-control formulations solve for final time as part of the problem instead of estimating it.',
        b: 1.5,
        bloom: 'analyze',
      },
      {
        id: 'q_m40_gravity_turn',
        q: 'Why is a gravity turn efficient, and what does it cost you?',
        choices: [
          'It minimises drag losses by flying the shortest path',
          'Flying at zero angle of attack means the aerodynamic side force and the associated q*alpha structural load are near zero, and no propellant is spent generating lift or fighting the atmosphere to turn — gravity does the turning for free. The cost is that the trajectory is then determined almost entirely by the initial pitch kick, so you give up in-flight shaping exactly where the vehicle is most load-limited',
          'It eliminates gravity losses entirely',
          'It allows the engines to be throttled down through max-Q',
        ],
        answer: 1,
        explain:
          'A gravity turn lets the gravity vector rotate the velocity vector while the vehicle keeps thrust aligned with velocity. Nothing is spent on turning, and because angle of attack is near zero the bending loads and the aerodynamic side force stay small — which is what lets you build a light vehicle. The price is control authority: once the kick is applied, the atmospheric trajectory is essentially ballistic in shape, so dispersions must be corrected later, and the day-of-launch wind profile has to be handled by updating the pitch program before flight rather than by steering during it.',
        b: 1.1,
        bloom: 'understand',
      },
      {
        id: 'q_m40_zem',
        q: 'What are ZEM and ZEV?',
        choices: [
          'The current position and velocity errors',
          'Zero-effort-miss is the terminal position error you would incur if you applied no further control from now on; zero-effort-velocity is the corresponding terminal velocity error. Under constant gravity, ZEM = r_f - (r + v*tgo + 0.5*g*tgo^2) and ZEV = v_f - (v + g*tgo), and the optimal feedback is a = (6/tgo^2)*ZEM - (2/tgo)*ZEV',
          'The zero-thrust and zero-velocity boundary conditions of the trajectory',
          'The minimum and maximum energy states reachable at the terminal time',
        ],
        answer: 1,
        explain:
          'ZEM and ZEV package the whole terminal boundary-value problem into two vectors with clear physical meaning: coast from here and see how far off you land, and how wrong your velocity is when you get there. Because they are computed by propagating the uncontrolled dynamics, they extend naturally beyond constant gravity to any model you can propagate. The 6/tgo^2 and -2/tgo gains are the minimum-energy solution for the double integrator with both terminal position and velocity constrained, which is why the same numbers appear in Apollo-lineage landing guidance and in modern ZEM/ZEV work.',
        b: 1.4,
        bloom: 'recall',
      },
    ],
    cards: [
      {
        id: 'c_m40_gnc',
        front: 'The G, N and C split',
        back: 'Navigation: where am I and how am I moving. Guidance: where should I go and what acceleration gets me there. Control: produce that acceleration with the actuators. Typical rates: navigation 100-1000 Hz, control 50-500 Hz, guidance 0.5-10 Hz.',
      },
      {
        id: 'c_m40_pn',
        front: 'Proportional navigation law',
        back: 'a_c = N * Vc * lambda_dot, perpendicular to the line of sight. lambda_dot is the LOS rate, Vc is closing velocity, N is the navigation constant (3 to 5).',
        formula: true,
      },
      {
        id: 'c_m40_los_rate',
        front: 'LOS rate from the relative state',
        back: 'lambda_dot = cross(r_rel, v_rel) / dot(r_rel, r_rel); Vc = -dot(r_rel, v_rel) / ||r_rel||.',
        formula: true,
      },
      {
        id: 'c_m40_constant_bearing',
        front: 'The collision-course principle',
        back: 'Constant bearing with decreasing range IS a collision course. PN works by driving the line-of-sight rate to zero, which is why it needs no knowledge of the target trajectory.',
      },
      {
        id: 'c_m40_n',
        front: 'Why N is 3 to 5',
        back: 'N = 3 is the minimum-control-energy optimum against a non-manoeuvring target. Higher N is more tolerant of autopilot lag and late disturbances but costs peak acceleration and amplifies LOS-rate noise near intercept.',
      },
      {
        id: 'c_m40_apn',
        front: 'Augmented proportional navigation',
        back: 'a_c = N*Vc*lambda_dot + (N/2)*a_target. The extra term is the optimal feedforward against a known constant target acceleration.',
        formula: true,
      },
      {
        id: 'c_m40_zem',
        front: 'Zero-effort miss',
        back: 'ZEM = r_f - (r + v*tgo + 0.5*g*tgo^2): the terminal position error if you never thrust again. Compute it by propagating the UNCONTROLLED dynamics, so it generalises to any force model.',
        formula: true,
      },
      {
        id: 'c_m40_zev',
        front: 'Zero-effort velocity',
        back: 'ZEV = v_f - (v + g*tgo): the terminal velocity error under no further control. Needed whenever the terminal velocity is constrained, as in a soft landing.',
        formula: true,
      },
      {
        id: 'c_m40_zemzev_law',
        front: 'ZEM/ZEV feedback law',
        back: 'a = (6/tgo^2)*ZEM - (2/tgo)*ZEV. The minimum-energy solution for a double integrator with both terminal position and velocity constrained.',
        formula: true,
      },
      {
        id: 'c_m40_pn_from_zem',
        front: 'PN as a ZEM law',
        back: 'a_c = N*ZEM/tgo^2. For a non-manoeuvring target this is identical to N*Vc*lambda_dot, which is why N = 3 is the minimum-energy constant.',
        formula: true,
      },
      {
        id: 'c_m40_tgo',
        front: 'Why tgo is the critical quantity',
        back: 'Every terminal guidance gain scales as 1/tgo or 1/tgo^2. A tgo error IS a gain error, and all these laws are singular at tgo = 0, so a floor and a terminal hold law are mandatory.',
      },
      {
        id: 'c_m40_gravity_turn',
        front: 'Gravity turn',
        back: 'After a small pitch kick, hold zero angle of attack so gravity rotates the velocity vector. Near-zero aerodynamic side load and no propellant spent turning — at the price of giving up in-atmosphere trajectory shaping.',
      },
      {
        id: 'c_m40_losses',
        front: 'Ascent delta-v loss terms',
        back: 'Gravity loss (integral of g*sin(gamma) dt), drag loss (integral of D/m dt), steering loss (from thrust not aligned with velocity), and back-pressure loss (from finite nozzle expansion at sea level). Gravity loss dominates.',
        formula: true,
      },
      {
        id: 'c_m40_adjoint',
        front: 'Adjoint method for miss distance',
        back: 'Run the linearised guidance loop BACKWARD from the terminal time to get miss-distance sensitivity to every disturbance in one integration, instead of one simulation per disturbance. Zarchan standard technique.',
      },
      {
        id: 'c_m40_explicit',
        front: 'Explicit vs reference-trajectory guidance',
        back: 'Reference-following tracks a precomputed trajectory, so it is simple but brittle to large dispersions. Explicit guidance solves the boundary-value problem onboard each cycle from the current state, so it retargets naturally — PEG and convex powered descent are both explicit.',
      },
    ],
    tags: ['interview'],
    importance: 1.3,
  },

  {
    id: 't5_m41_ascent_guidance',
    track: 'gnc',
    tier: 5,
    title: 'Ascent & Orbital Insertion Guidance',
    summary:
      'Derive the linear tangent steering law from the Euler-Lagrange conditions and turn it into a working Powered Explicit Guidance cycle that closes on a target orbit from dispersed states. You will also understand why nobody closes the loop during max-Q, and what guidance does when an engine fails.',
    prereqs: ['t5_m40_guidance_fundamentals', 't2_m20_orbital_maneuvers', 't0_m11_optimization'],
    hours: 50,
    topics: [
      'Ascent phases: liftoff, pitch kick, gravity turn, max-Q, staging, exoatmospheric closed loop',
      'Open-loop atmospheric steering (the pitch program) and why closed-loop guidance is avoided in dense atmosphere',
      'Optimal exoatmospheric steering: the linear tangent law from Pontryagin and the calculus of variations',
      'Powered Explicit Guidance and Unified Powered Flight Guidance; why explicit guidance needs no reference trajectory',
      'The two-phase throttle structure: constant thrust to a g-limit, then throttled constant acceleration',
      'Iterative Guidance Mode as flown on Saturn V',
      'Target orbit specification and the terminal constraint set',
      'Thrust vector control allocation and engine-out contingency',
      'Load relief and its interaction with guidance',
      'Ascent trajectory optimization as an offline problem feeding onboard guidance',
      'Day-of-launch trajectory updates from measured winds',
      'Abort modes: RTLS, TAL, AOA and the decision logic',
    ],
    objectives: [
      'Derive the linear tangent steering law from the Euler-Lagrange conditions',
      'Implement a simplified PEG that converges on a target orbit from dispersed initial conditions',
      'Explain the split between atmospheric open-loop and exoatmospheric closed-loop guidance',
      'Describe what guidance does on engine-out and how the fallback orbit is chosen',
    ],
    resources: [
      {
        title: 'Powered Explicit Guidance Modifications and Enhancements',
        author: 'NASA NTRS 20180002035',
        kind: 'paper',
        url: 'https://ntrs.nasa.gov/citations/20180002035',
        free: true,
      },
      {
        title: 'Enhancements to Space Shuttle Powered Explicit Guidance (AAS 25-844)',
        author: 'NASA NTRS 20250011251',
        kind: 'paper',
        url: 'https://ntrs.nasa.gov/citations/20250011251',
        free: true,
      },
      {
        title: 'Closed Loop Guidance Trade Study for Space Launch System (AAS 18-270)',
        kind: 'paper',
        free: true,
      },
      {
        title: 'PEGAS — an open-source UPFG implementation',
        author: 'Noiredd',
        kind: 'tool',
        url: 'https://github.com/Noiredd/PEGAS',
        free: true,
        note: 'A working Unified Powered Flight Guidance autopilot, plus pegas-matlab. Superb for learning by reading real code.',
      },
      {
        title: 'FlightGear wiki — Shuttle ascent guidance (PEG)',
        kind: 'site',
        free: true,
      },
      { title: 'Delta-V Budgets and Launch Vehicle Design', author: 'Brown', kind: 'book', free: false },
    ],
    exercises: [
      {
        id: 'ex_m41_linear_tangent',
        title: 'Linear tangent steering, derived and verified',
        kind: 'code',
        lang: 'python',
        hours: 8,
        prompt: `Consider flat-Earth, constant-gravity, vacuum ascent with constant exhaust velocity.

1. Write the Hamiltonian, apply the Euler-Lagrange conditions, and show the costates for the velocity components are linear in time, so the optimal thrust direction satisfies tan(pitch) = A + B*t.
2. Implement a two-parameter shooting solve for A and B that hits a target burnout altitude, horizontal velocity and vertical velocity.
3. Compare the propellant used against a direct-collocation optimal solution.

Success: the shooting solution matches the collocation optimum to under 0.1%, and you can reproduce the derivation from memory.`,
        starter: `import numpy as np


def linear_tangent_pitch(A, B, t):
    """Thrust pitch angle from the linear tangent law: tan(pitch) = A + B*t."""
    raise NotImplementedError


def integrate_ascent(A, B, t_burn, m0, mdot, ve, g=9.80665, dt=0.01):
    """Flat-Earth vacuum ascent under linear tangent steering.

    Returns the terminal state (x, z, vx, vz).
    """
    raise NotImplementedError


def solve_AB(target_vx, target_vz, target_z, m0, mdot, ve, t_burn, g=9.80665):
    """Two-parameter shooting for (A, B) that meets the terminal conditions."""
    raise NotImplementedError
`,
        tests: [
          {
            name: 'the law reduces to constant pitch when B = 0',
            assert: `import numpy as np
p0 = linear_tangent_pitch(1.0, 0.0, 0.0)
p9 = linear_tangent_pitch(1.0, 0.0, 9.0)
assert abs(p0 - p9) < 1e-12, "with B = 0 the pitch must be constant"
assert abs(p0 - np.arctan(1.0)) < 1e-12, "tan(pitch) = A"`,
          },
          {
            name: 'pitch decreases monotonically for negative B',
            assert: `import numpy as np
ts = np.linspace(0.0, 200.0, 50)
p = np.array([linear_tangent_pitch(2.5, -0.02, t) for t in ts])
assert np.all(np.diff(p) < 0), "negative B must pitch the vehicle over monotonically"`,
          },
          {
            name: 'shooting hits the terminal conditions',
            assert: `import numpy as np
m0, mdot, ve, t_burn = 100000.0, 300.0, 3000.0, 200.0
tgt = (5200.0, 0.0, 180000.0)
A, B = solve_AB(tgt[0], tgt[1], tgt[2], m0, mdot, ve, t_burn)
x, z, vx, vz = integrate_ascent(A, B, t_burn, m0, mdot, ve)
assert abs(vx - tgt[0]) < 5.0 and abs(vz - tgt[1]) < 5.0, "terminal velocity not met"`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m41_peg',
        title: 'A simplified PEG that actually converges',
        kind: 'code',
        lang: 'python',
        hours: 12,
        prompt: `Implement a simplified Powered Explicit Guidance cycle for the exoatmospheric phase.

Each cycle, from the current state and vehicle parameters:
1. Estimate time-to-go from the required velocity-to-be-gained and the vehicle exhaust velocity and mass flow (the rocket equation form).
2. Solve for the steering parameters A and B that satisfy the velocity and radial terminal constraints.
3. Compute the commanded thrust direction, apply it for one guidance period, and re-converge next cycle.

Then:
- Show convergence from initial conditions dispersed by +/-5% in velocity and +/-10 km in altitude.
- Plot the tgo estimate and steering parameters against time and demonstrate they settle.
- Show behaviour when the vehicle is short on performance so the target is unreachable.

Success: the vehicle inserts within tolerance from every dispersed case, and the unreachable case degrades in a controlled, detectable way rather than diverging.`,
        starter: `"""Powered Explicit Guidance, reduced to the part that matters.

PEG estimates time-to-go from the rocket equation, solves for a linear
steering law, applies it for one guidance period, and re-converges next cycle.
Closing that loop every cycle is what makes it robust to dispersions.
"""

import numpy as np

G0 = 9.80665


def exhaust_velocity(isp_s: float) -> float:
    """ve = Isp * g0."""
    return isp_s * G0


def time_to_go(mass_kg: float, mdot: float, ve: float, dv_needed: float) -> float:
    """Burn time to deliver dv_needed, from the rocket equation.

    TODO: invert Tsiolkovsky. With tau = m / mdot (the time to burn the whole
    vehicle at the current flow rate),
        tgo = tau * (1 - exp(-dv / ve))
    That exponential is why tgo is insensitive to dv when the tanks are full
    and very sensitive when they are nearly dry.
    """
    raise NotImplementedError


def steering_coefficients(dv_needed: np.ndarray, tgo: float):
    """Linear steering law: the unit thrust direction is A + B*t.

    Returns (A, B) for the simplified case where A points along the required
    velocity-to-be-gained and B is zero.

    TODO: A = dv_needed / ||dv_needed||, B = zeros_like(A). Real PEG solves a
    2x2 system for B from the radial terminal constraint; this reduction keeps
    the loop structure and drops that algebra.
    """
    raise NotImplementedError


def thrust_direction(A: np.ndarray, B: np.ndarray, t: float) -> np.ndarray:
    """Normalised commanded direction at time t into the cycle.

    TODO: normalise A + B*t. Never command an unnormalised vector: the
    autopilot will read the magnitude as a throttle request.
    """
    raise NotImplementedError


if __name__ == "__main__":
    ve = exhaust_velocity(348.0)
    tgo = time_to_go(120_000.0, 400.0, ve, 2500.0)
    print(f"ve   = {ve:.1f} m/s")
    print(f"tgo  = {tgo:.2f} s")
`,
        tests: [
          {
            name: 'time-to-go inverts the rocket equation',
            assert: `ve = exhaust_velocity(348.0)
got = time_to_go(120_000.0, 400.0, ve, 2500.0)
tau = 120_000.0/400.0
assert abs(got - tau*(1 - np.exp(-2500.0/ve))) < 1e-9, f'{got}'`,
          },
          {
            name: 'no velocity to gain means no burn left',
            assert: `assert abs(time_to_go(100_000.0, 350.0, exhaust_velocity(300.0), 0.0)) < 1e-12`,
          },
          {
            name: 'tgo rises with the velocity still to be gained',
            assert: `ve = exhaust_velocity(320.0)
a = time_to_go(90_000.0, 300.0, ve, 500.0)
b = time_to_go(90_000.0, 300.0, ve, 2000.0)
assert b > a > 0.0`,
          },
          {
            name: 'the steering direction is a unit vector, always',
            assert: `A, B = steering_coefficients(np.array([1200.0, -400.0, 250.0]), 90.0)
assert abs(np.linalg.norm(A) - 1.0) < 1e-12
for t in (0.0, 30.0, 90.0):
    assert abs(np.linalg.norm(thrust_direction(A, B, t)) - 1.0) < 1e-12`,
          },
          {
            name: 'and it points along the velocity that still has to be gained',
            assert: `v = np.array([1200.0, -400.0, 250.0])
A, B = steering_coefficients(v, 90.0)
assert np.allclose(thrust_direction(A, B, 0.0), v/np.linalg.norm(v), atol=1e-12)`,
            hidden: true,
          },
        ],
      },
      {
        id: 'ex_m41_engine_out',
        title: 'Engine-out at T+120 s',
        kind: 'analysis',
        hours: 6,
        prompt: `Using your PEG implementation and a multi-engine first stage:

1. Fail one engine of nine at T+120 s. Show that guidance automatically extends the burn and re-steers, because it targets terminal conditions rather than a reference trajectory.
2. Compute the performance reserve consumed and whether the nominal orbit is still reachable.
3. Define the decision logic for degrading to a lower-energy fallback orbit, and where the cut-off is.
4. Repeat for a failure at 60% of the burn and at 90%.

Deliver a one-page contingency note with the reachable-orbit envelope against failure time.`,
      },
    ],
    quiz: [
      {
        id: 'q_m41_linear_tangent',
        q: 'Where does the linear tangent steering law come from?',
        choices: [
          'It is an empirical fit to Saturn V flight data',
          'From the Euler-Lagrange conditions for the minimum-propellant flat-Earth vacuum ascent problem: the primer vector (the velocity costate) obeys a linear differential equation with constant gravity, so its components are linear in time, and the optimal thrust direction is along it — giving tan(pitch) = A + B*t',
          'From the requirement that angle of attack stay zero through the atmosphere',
          'From linearising proportional navigation about a nominal ascent trajectory',
        ],
        answer: 1,
        explain:
          'For the minimum-fuel problem, Pontryagin says thrust points along the primer vector, the costate of velocity. With constant gravity and no atmosphere the costate equations give lambda_v_dot = -lambda_r and lambda_r_dot = 0, so lambda_v is linear in time. Taking the ratio of the components of a vector whose components are linear in time gives a tangent that is linear in time — hence the name. The approximation breaks when gravity is not constant over the arc, which is why real implementations such as PEG and UPFG re-converge every cycle with an updated gravity estimate rather than trusting one open-loop solve.',
        b: 1.7,
        bloom: 'analyze',
      },
      {
        id: 'q_m41_maxq',
        q: 'Why is closed-loop guidance avoided during max-Q?',
        choices: [
          'Because the guidance computer is busy with other tasks',
          'Because the structural load is driven by dynamic pressure times angle of attack, and a guidance law that commands attitude to correct trajectory dispersions will command angle of attack exactly when q is highest. The vehicle is load-limited, not performance-limited, there, so the pitch program is flown open-loop (updated before launch for the measured wind profile) and the control system runs load relief instead',
          'Because the navigation solution is unavailable during max-Q',
          'Because thrust vector control is disabled during max-Q',
        ],
        answer: 1,
        explain:
          'The controlling constraint in the first ninety seconds is q*alpha bending moment, not insertion accuracy. Closed-loop guidance would trade structure for performance in the one regime where you cannot afford to. Instead the vehicle flies a precomputed pitch program, updated on the day of launch from balloon or lidar wind measurements (the day-of-launch I-load update), and the autopilot may actively reduce angle of attack using measured lateral acceleration or angle-of-attack estimates. Closed-loop explicit guidance is enabled once dynamic pressure has decayed, and it absorbs whatever dispersion the open-loop phase produced.',
        b: 1.4,
        bloom: 'understand',
      },
      {
        id: 'q_m41_peg',
        q: 'What does PEG solve for on each cycle and how does it converge?',
        choices: [
          'It integrates the full trajectory forward and searches for the best pitch program by gradient descent',
          'Each cycle it computes the velocity still to be gained, estimates time-to-go from the rocket equation given current mass and thrust, and solves for the linear tangent steering parameters that satisfy the terminal velocity and radial constraints. It converges because each cycle re-linearizes about the updated state and updated gravity estimate, so the predicted terminal error shrinks as tgo shrinks',
          'It looks up the steering angle in a precomputed table indexed by altitude and velocity',
          'It solves a nonlinear program for the full remaining trajectory at each cycle',
        ],
        answer: 1,
        explain:
          'PEG is explicit in the specific sense that it computes the steering directly from current state and desired terminal conditions, with no reference trajectory anywhere in the loop. Its ingredients are a tgo estimate from the rocket equation, an averaged gravity term over the remaining arc, and a small closed-form solve for the steering coefficients. The convergence mechanism is simply the receding horizon: errors in the gravity and thrust integrals matter less and less as the remaining burn gets shorter. This is also why PEG is enabled only after the atmosphere, and why it is monitored for convergence before being allowed to command.',
        b: 1.6,
        bloom: 'understand',
      },
      {
        id: 'q_m41_engine_out',
        q: 'An engine fails at 60% of the burn. What does explicit guidance do, and what is the fallback?',
        choices: [
          'It aborts immediately, since the reference trajectory can no longer be followed',
          'Nothing special is needed in the algorithm: because it targets terminal conditions rather than a reference trajectory, it recomputes tgo with the reduced thrust and mass flow, re-solves the steering, and simply burns longer with a flatter profile. Whether the nominal orbit is still reachable is a performance-reserve question; if not, the vehicle degrades to a predefined lower-energy target or an abort mode',
          'It increases the thrust of the remaining engines to compensate exactly',
          'It switches to a stored backup pitch program for the engine-out case',
        ],
        answer: 1,
        explain:
          'This is the single best argument for explicit guidance over reference-following, and it is a favourite interview question. A reference-tracking scheme has nothing sensible to track after a thrust loss. An explicit scheme sees only a different tgo and a different acceleration profile and keeps solving the same boundary-value problem. The flight-program work is not in the guidance algorithm but in the decision logic: how much performance reserve exists as a function of failure time, which degraded orbits are acceptable, when the crossover to an abort mode occurs, and how the attitude control system handles the thrust asymmetry and the changed control authority.',
        b: 1.5,
        bloom: 'apply',
      },
      {
        id: 'q_m41_iload',
        q: 'What is a day-of-launch I-load update and why does it exist?',
        choices: [
          'A software patch uploaded after liftoff',
          'A recomputation of the open-loop pitch program (and associated gain and constraint tables) on launch day using the measured upper-level wind profile from balloons or a wind lidar, so that the flown trajectory keeps q*alpha and bending loads within limits for that day rather than for a worst-case wind envelope',
          'A recalibration of the inertial measurement unit before launch',
          'A load test of the launch mount before release',
        ],
        answer: 1,
        explain:
          'Designing a single pitch program to survive a worst-case wind envelope would cost enormous structural margin and performance. Instead, wind is measured in the hours before launch, the trajectory is re-optimised against that actual profile, and the resulting steering commands are loaded. It converts a worst-case design problem into a day-specific one, buying both payload and launch availability. It is also a serious verification burden, since the updated loads must be checked automatically against limits inside the countdown timeline.',
        b: 1.2,
        bloom: 'recall',
      },
    ],
    cards: [
      {
        id: 'c_m41_linear_tangent',
        front: 'Linear tangent steering law',
        back: 'tan(pitch) = A + B*t. The optimal exoatmospheric thrust direction for minimum-propellant ascent under constant gravity, because the primer vector components are linear in time.',
        formula: true,
      },
      {
        id: 'c_m41_primer',
        front: 'Primer vector',
        back: 'The costate of velocity. Pontryagin says optimal thrust points along it, and its magnitude determines the throttle switching structure for a bounded-thrust problem.',
      },
      {
        id: 'c_m41_peg',
        front: 'What makes PEG explicit',
        back: 'It computes steering directly from the current state and the desired terminal conditions each cycle, with no stored reference trajectory. That is exactly why it handles engine-out and large dispersions without special logic.',
      },
      {
        id: 'c_m41_tgo',
        front: 'Time-to-go from the rocket equation',
        back: 'With exhaust velocity ve, initial acceleration a0 and tau = ve/a0, tgo = tau*(1 - exp(-dV_required/ve)). This is the standard PEG tgo estimate.',
        formula: true,
      },
      {
        id: 'c_m41_upfg',
        front: 'UPFG',
        back: 'Unified Powered Flight Guidance, the Space Shuttle ascent algorithm (Tim Brand, Draper Laboratory). PEG generalised to multiple phases, staging, and a variety of terminal targets.',
      },
      {
        id: 'c_m41_igm',
        front: 'Iterative Guidance Mode',
        back: 'The Saturn V exoatmospheric guidance, the ancestor of PEG. Also based on the linear tangent law, with closed-form terminal constraint solution — the first flown explicit guidance.',
      },
      {
        id: 'c_m41_throttle',
        front: 'The two-phase throttle structure',
        back: 'Constant thrust until the acceleration limit (often 3 g for crew or structure), then throttle to hold constant acceleration. Guidance must know which phase it is in because tgo depends on the thrust profile.',
      },
      {
        id: 'c_m41_maxq',
        front: 'Why guidance is open loop through max-Q',
        back: 'Bending load is driven by q*alpha. Closed-loop trajectory correction commands angle of attack exactly when q peaks. So: open-loop pitch program plus load relief, with explicit guidance enabled after q decays.',
      },
      {
        id: 'c_m41_load_relief',
        front: 'Load relief',
        back: 'A control mode that trades trajectory accuracy for reduced angle of attack, using measured lateral acceleration or an alpha estimate. It deliberately lets the vehicle weathervane into the wind instead of fighting it.',
      },
      {
        id: 'c_m41_iload',
        front: 'Day-of-launch I-load update',
        back: 'Re-optimise the pitch program on launch day against the measured wind profile, so loads are sized for the actual atmosphere and not a worst-case envelope. Buys payload and launch availability.',
      },
      {
        id: 'c_m41_targets',
        front: 'How a target orbit is specified to guidance',
        back: 'Usually as terminal radius, terminal speed, flight path angle and orbital plane (inclination and node), rather than as six Cartesian components. That leaves the unconstrained terminal argument of latitude free, which is what gives guidance the freedom to be efficient.',
      },
      {
        id: 'c_m41_engine_out',
        front: 'Engine-out behaviour of explicit guidance',
        back: 'Recompute tgo with the reduced thrust and mass flow, re-solve the steering, burn longer on a flatter profile. No special case in the algorithm — the work is in the reserve and fallback-target decision logic.',
      },
      {
        id: 'c_m41_aborts',
        front: 'Shuttle-era abort mode vocabulary',
        back: 'RTLS: return to launch site. TAL: transatlantic abort landing. AOA: abort once around. ATO: abort to orbit. The mode boundaries are functions of velocity and time, and knowing which you are in is a guidance responsibility.',
      },
      {
        id: 'c_m41_offline_online',
        front: 'Offline optimisation vs onboard guidance',
        back: 'The full ascent trajectory is optimised offline with high-fidelity models to set the pitch program, staging and I-loads. Onboard guidance then only has to close the remaining boundary-value problem in real time from the actual state.',
      },
    ],
    tags: ['interview'],
    importance: 1.3,
  },
]
