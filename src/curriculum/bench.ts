/* ============================================================================
   ORBIT — workbench tasks
   ----------------------------------------------------------------------------
   Small pieces of the actual job, each framed the way it would arrive: someone
   tells you what is wrong, hands you a scenario, and the numbers decide.

   What makes these different from the exercises in the curriculum:

     - There is no single right answer. A rate loop that meets its margins is
       correct whatever gains got it there.
     - The feedback is engineering feedback. Not "wrong", but "gain margin
       4.2 dB, you need 6, and you are already overshooting 18%".
     - Several of them start from something broken, because most days do.

   Every harness runs real numerics in the same Pyodide runtime the playground
   uses, so a controller that is unstable really does go unstable. Nothing is
   pattern-matched against a reference solution.

   None of this counts for anything — see the note in src/lib/bench.ts.
   ========================================================================== */

export type BenchArea = 'control' | 'navigation' | 'guidance' | 'simulation' | 'flight-software'
export type BenchDifficulty = 'warm-up' | 'realistic' | 'hard'

export interface BenchTask {
  id: string
  title: string
  area: BenchArea
  difficulty: BenchDifficulty
  /** Roughly how long this takes when it goes well. */
  minutes: number
  /** How the job would arrive: who is asking and what went wrong. */
  brief: string
  /** What "done" means, in the engineer's own words. Markdown. */
  spec: string
  lang: 'python'
  starter: string
  /** Runs after her code and prints the report block. Never shown to her. */
  harness: string
  /** Shown only when she asks for it. */
  hint: string
}

export const BENCH_AREAS: Record<BenchArea, { label: string; blurb: string }> = {
  control: { label: 'Control', blurb: 'Loops, margins, and making something stable enough to fly.' },
  navigation: { label: 'Navigation', blurb: 'Working out where you are from sensors that all lie a little.' },
  guidance: { label: 'Guidance', blurb: 'Deciding where to point and how hard to burn.' },
  simulation: { label: 'Simulation', blurb: 'Making the model tell the truth before the vehicle does.' },
  'flight-software': { label: 'Flight software', blurb: 'The code that has to work the first time.' },
}

export const BENCH_TASKS: BenchTask[] = [
  /* ── 1 ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bench_rate_loop',
    title: 'The rate loop misses its margins',
    area: 'control',
    difficulty: 'warm-up',
    minutes: 25,
    brief:
      'The pitch rate loop on the upper stage was tuned by someone who has since left. It tracks well enough in the nominal case, but the margin analysis fails and the review board will not sign it off. Retune it.',
    spec: `The vehicle's pitch-rate response is modelled as a first-order lag with a delay:

$$
G(s) = \\frac{K_v}{\\tau s + 1} e^{-T_d s}, \\qquad K_v = 2.4,\\ \\tau = 0.45\\ \\mathrm{s},\\ T_d = 0.03\\ \\mathrm{s}
$$

Write a proportional-integral controller by setting \`KP\` and \`KI\`.

It has to meet all of these at once:

| Requirement | Value |
| --- | --- |
| Gain margin | at least 6 dB |
| Phase margin | at least 35° |
| Settling time to 2% | at most 2.5 s |
| Steady-state error to a step | essentially zero |

The last one is what the integrator is for. The first two are what stops you
simply turning the gain up until it tracks.`,
    lang: 'python',
    starter: `# Pitch rate loop, upper stage.
#
# Plant:  G(s) = Kv / (tau*s + 1) * exp(-Td*s)
#         Kv = 2.4, tau = 0.45 s, Td = 0.03 s
#
# Controller: C(s) = KP + KI/s
#
# Set the two gains. Everything else is measured for you.

KP = 0.10
KI = 0.05
`,
    harness: `
import math

Kv, tau, Td = 2.4, 0.45, 0.03

def openloop(w):
    """L(jw) = C(jw) * G(jw), returned as (magnitude, phase in radians)."""
    # C = KP + KI/(jw)
    c_re, c_im = KP, -KI / w
    # G = Kv/(tau*jw + 1) * exp(-j*w*Td)
    den = complex(1.0, tau * w)
    g = Kv / den * complex(math.cos(w * Td), -math.sin(w * Td))
    c = complex(c_re, c_im)
    l = c * g
    return abs(l), math.atan2(l.imag, l.real)

def crossings():
    """Gain crossover (|L|=1) and phase crossover (angle = -180 deg)."""
    ws = [10 ** (-3 + 6 * i / 4000) for i in range(4001)]
    gc = pc = None
    prev_m = prev_p = None
    for w in ws:
        m, p = openloop(w)
        if prev_m is not None:
            if (prev_m - 1.0) * (m - 1.0) < 0 and gc is None:
                gc = (w, p)
            if (prev_p + math.pi) * (p + math.pi) < 0 and pc is None:
                pc = (w, m)
        prev_m, prev_p = m, p
    return gc, pc

gc, pc = crossings()

if gc is None:
    pm_deg = -999.0
else:
    pm_deg = math.degrees(gc[1] + math.pi)

if pc is None:
    # Phase never reaches -180 within the sweep: the loop cannot be driven
    # unstable by gain alone here, which is a very large margin, not an error.
    gm_db = 60.0
else:
    gm_db = -20.0 * math.log10(pc[1]) if pc[1] > 0 else 60.0

# Closed-loop step response by explicit integration, delay included.
dt = 0.001
T = 12.0
n = int(T / dt)
delay_steps = int(round(Td / dt))
y = 0.0
integ = 0.0
u_hist = [0.0] * (delay_steps + 1)
ys = []
for k in range(n):
    e = 1.0 - y
    integ += e * dt
    u = KP * e + KI * integ
    u_hist.append(u)
    u_delayed = u_hist[-(delay_steps + 1)]
    # tau*ydot + y = Kv*u
    ydot = (Kv * u_delayed - y) / tau
    y += ydot * dt
    ys.append(y)
    if not math.isfinite(y) or abs(y) > 1e6:
        break

diverged = (not math.isfinite(y)) or abs(y) > 1e6
final = ys[-1] if ys else float('nan')

# Settling: last time it leaves the 2% band.
settle = float('inf')
if not diverged and ys:
    band = 0.02
    settle = 0.0
    for k in range(len(ys) - 1, -1, -1):
        if abs(ys[k] - 1.0) > band:
            settle = (k + 1) * dt
            break

sse = abs(1.0 - final) if not diverged else float('nan')
overshoot = (max(ys) - 1.0) * 100.0 if ys and not diverged else float('nan')

print("METRIC gain_margin %.2f >= 6 dB" % gm_db)
print("METRIC phase_margin %.2f >= 35 deg" % pm_deg)
print("METRIC settling_time %.2f <= 2.5 s" % (settle if math.isfinite(settle) else 999.0))
print("METRIC steady_state_error %.4f <= 0.02 rad/s" % (sse if math.isfinite(sse) else 999.0))
print("CHECK closed_loop_stable %s" % ("fail" if diverged else "pass"))
if math.isfinite(overshoot):
    print("NOTE Overshoot is %.0f%%." % overshoot)
if gm_db < 6 and pm_deg > 60:
    print("NOTE Lots of phase margin but not enough gain margin — that usually means KI is doing too much at low frequency.")
if pm_deg < 35 and gm_db > 10:
    print("NOTE Plenty of gain margin but thin phase margin — the delay is eating it. Try backing KP off.")
`,
    hint: 'Start with KI at zero and raise KP until the phase margin is around 45 degrees, then add integral action back slowly. Integral gain buys you zero steady-state error and costs you phase margin near crossover, which is exactly where you cannot afford to spend it.',
  },

  /* ── 2 ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bench_frame_sign',
    title: 'Somebody flipped a frame',
    area: 'navigation',
    difficulty: 'warm-up',
    minutes: 20,
    brief:
      'A star tracker is reporting attitude, and the pointing error is coming out roughly twice as large as it should be whenever the vehicle is rotated about the body Y axis. Nobody has touched the tracker. Somebody has touched the transform. Find it and fix it.',
    spec: `\`body_to_eci\` is supposed to return the rotation matrix taking a vector
expressed in the body frame into the inertial frame, built from a 3-2-1
(yaw, then pitch, then roll) Euler sequence.

It is wrong. Fix it so that all of these hold:

- Rotating a vector into the inertial frame and back returns the original.
- The matrix is a proper rotation: orthonormal, determinant \`+1\`.
- For yaw = 30°, pitch = 0, roll = 0, the body X axis lands at 30° from the
  inertial X axis, rotated towards inertial Y.
- Composing two rotations equals rotating twice.

Change as little as you can. The bug is small, which is the point: this is the
category of bug that flies.`,
    lang: 'python',
    starter: `import math

def body_to_eci(yaw, pitch, roll):
    """3-2-1 Euler sequence. Angles in radians. Returns a 3x3 list of lists
    that takes a body-frame vector into the inertial frame."""
    cy, sy = math.cos(yaw), math.sin(yaw)
    cp, sp = math.cos(pitch), math.sin(pitch)
    cr, sr = math.cos(roll), math.sin(roll)

    Rz = [[cy, -sy, 0.0],
          [sy,  cy, 0.0],
          [0.0, 0.0, 1.0]]

    Ry = [[cp, 0.0, -sp],
          [0.0, 1.0, 0.0],
          [sp, 0.0,  cp]]

    Rx = [[1.0, 0.0, 0.0],
          [0.0, cr, -sr],
          [0.0, sr,  cr]]

    return matmul(matmul(Rz, Ry), Rx)


def matmul(A, B):
    return [[sum(A[i][k] * B[k][j] for k in range(3)) for j in range(3)] for i in range(3)]


def matvec(A, v):
    return [sum(A[i][k] * v[k] for k in range(3)) for i in range(3)]
`,
    harness: `
import math

def _t(A):
    return [[A[j][i] for j in range(3)] for i in range(3)]

def _det(A):
    return (A[0][0]*(A[1][1]*A[2][2]-A[1][2]*A[2][1])
          - A[0][1]*(A[1][0]*A[2][2]-A[1][2]*A[2][0])
          + A[0][2]*(A[1][0]*A[2][1]-A[1][1]*A[2][0]))

angles = [(0.3, -0.2, 0.15), (1.1, 0.4, -0.9), (-2.0, 0.7, 2.5), (0.0, 1.2, 0.0)]

max_orth = 0.0
max_det_err = 0.0
max_roundtrip = 0.0
for (y, p, r) in angles:
    R = body_to_eci(y, p, r)
    RtR = matmul(_t(R), R)
    for i in range(3):
        for j in range(3):
            want = 1.0 if i == j else 0.0
            max_orth = max(max_orth, abs(RtR[i][j] - want))
    max_det_err = max(max_det_err, abs(_det(R) - 1.0))
    v = [0.3, -0.7, 0.64]
    back = matvec(_t(R), matvec(R, v))
    max_roundtrip = max(max_roundtrip, max(abs(back[i] - v[i]) for i in range(3)))

# Yaw-only: body X must land 30 degrees towards inertial Y.
R30 = body_to_eci(math.radians(30.0), 0.0, 0.0)
x_eci = matvec(R30, [1.0, 0.0, 0.0])
yaw_err = math.degrees(abs(math.atan2(x_eci[1], x_eci[0]) - math.radians(30.0)))

# Pitch-only: body X must tip towards -Z for a positive (nose-up) pitch in
# this convention, which is the sign that was reported wrong.
Rp = body_to_eci(0.0, math.radians(20.0), 0.0)
xp = matvec(Rp, [1.0, 0.0, 0.0])
pitch_err = math.degrees(abs(math.atan2(-xp[2], xp[0]) - math.radians(20.0)))

# Composition: R(a) applied after R(b) equals rotating twice.
Ra = body_to_eci(0.2, 0.0, 0.0)
Rb = body_to_eci(0.5, 0.0, 0.0)
Rab = body_to_eci(0.7, 0.0, 0.0)
comp = matmul(Ra, Rb)
comp_err = max(abs(comp[i][j] - Rab[i][j]) for i in range(3) for j in range(3))

print("METRIC orthonormality_error %.3e <= 1e-9" % max_orth)
print("METRIC determinant_error %.3e <= 1e-9" % max_det_err)
print("METRIC roundtrip_error %.3e <= 1e-9" % max_roundtrip)
print("METRIC yaw_30_error %.4f <= 0.001 deg" % yaw_err)
print("METRIC pitch_20_error %.4f <= 0.001 deg" % pitch_err)
print("METRIC composition_error %.3e <= 1e-9" % comp_err)
if max_orth < 1e-9 and pitch_err > 1.0:
    print("NOTE The matrix is a valid rotation but it turns the wrong way about one axis. Compare your Ry against the other two.")
`,
    hint: 'A rotation about Y has its minus sign in the opposite corner to a rotation about X or Z. Write the three elementary matrices next to each other and look at where the minus signs sit.',
  },

  /* ── 3 ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bench_landing_burn',
    title: 'Size the landing burn',
    area: 'guidance',
    difficulty: 'realistic',
    minutes: 30,
    brief:
      'Trajectory wants a first cut at the suicide burn for a booster coming back to the pad. They need the ignition altitude, and they need to know how much propellant margin is left when it touches down. Rough is fine; wrong is not.',
    spec: `A booster is falling vertically. At the start of the problem it is at
\`h0 = 3000\` m with velocity \`v0 = -200\` m/s (downward) and mass
\`m0 = 28000\` kg.

The engine produces a constant \`T = 845\` kN at a specific impulse of
\`Isp = 282\` s once lit, and cannot be throttled or relit. Gravity is
\`g = 9.81\` m/s², and you may ignore drag.

Write \`ignition_altitude()\` returning the altitude in metres at which the
engine must light so that velocity and altitude both reach zero together.

Then write \`propellant_used()\` returning the propellant mass in kg burned
between ignition and touchdown.

It must be good to within 1% of a numerically integrated answer. Note that the
vehicle is losing mass while it burns, so constant-acceleration formulas will
not get you there.`,
    lang: 'python',
    starter: `import math

h0 = 3000.0      # m
v0 = -200.0      # m/s, negative is downward
m0 = 28000.0     # kg
T  = 845e3       # N
Isp = 282.0      # s
g0 = 9.80665     # m/s^2, for the Isp definition
g  = 9.81        # m/s^2, local gravity

def ignition_altitude():
    """Altitude in metres at which to light the engine."""
    # TODO
    return 0.0

def propellant_used():
    """Propellant burned from ignition to touchdown, in kg."""
    # TODO
    return 0.0
`,
    harness: `
import math

_mdot = T / (Isp * g0)

def _simulate(h_ign):
    """Fall to h_ign, then burn. Returns (touchdown velocity, propellant)."""
    # Free fall from h0 to h_ign.
    if h_ign > h0:
        return float('nan'), float('nan')
    v_sq = v0 * v0 + 2.0 * g * (h0 - h_ign)
    v = -math.sqrt(v_sq)
    h = h_ign
    m = m0
    dt = 1e-4
    burned = 0.0
    steps = 0
    while h > 0.0 and steps < 4000000:
        a = T / m - g
        v += a * dt
        h += v * dt
        m -= _mdot * dt
        burned += _mdot * dt
        steps += 1
        if v > 0.0:      # stopped and started climbing: lit too early
            break
    return v, burned

h_ign = float(ignition_altitude())
prop = float(propellant_used())

ok_inputs = math.isfinite(h_ign) and math.isfinite(prop) and 0.0 < h_ign <= h0

if not ok_inputs:
    print("CHECK plausible_answer fail returned %r and %r" % (h_ign, prop))
    print("METRIC touchdown_speed 999 <= 2 m/s")
else:
    v_td, burned = _simulate(h_ign)
    print("METRIC touchdown_speed %.3f <= 2.0 m/s" % abs(v_td))
    rel = abs(prop - burned) / burned * 100.0 if burned > 0 else 999.0
    print("METRIC propellant_error %.2f <= 1.0 %%" % rel)
    print("CHECK plausible_answer pass")
    print("NOTE Simulated propellant from your ignition altitude: %.0f kg." % burned)
    # Tolerance on the advice, not just on the metric: a correct answer stops
    # within a hair of zero and must not then be told it lit too high.
    if v_td < -2.0:
        print("NOTE Still moving downward at the pad — you lit too low.")
    elif v_td > 2.0:
        print("NOTE The vehicle stopped above the pad and started climbing — you lit too high.")
`,
    hint: 'Work backwards. With mass changing, integrate the rocket equation over the burn rather than assuming constant thrust-to-weight: the deceleration rises as propellant leaves. Solving the burn from touchdown upwards, with zero velocity at the ground, is much easier than solving it forwards.',
  },

  /* ── 4 ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bench_filter_diverging',
    title: 'The filter is lying with confidence',
    area: 'navigation',
    difficulty: 'realistic',
    minutes: 35,
    brief:
      'A one-dimensional altitude filter passed every unit test and then diverged on a hardware-in-the-loop run. Its covariance shrinks to almost nothing while the estimate drifts away from truth. Classic. Make it consistent.',
    spec: `The filter estimates altitude and vertical velocity from a noisy altimeter.

The implementation below runs, and it is wrong in a way that makes it
overconfident. Fix \`predict\` and \`update\` so the filter is *consistent* —
meaning its stated uncertainty actually matches the errors it makes.

Judged on:

| Requirement | Value |
| --- | --- |
| RMS altitude error | under 12 m |
| Average NEES | between 0.4 and 2.6 |
| Final altitude variance | above 0.5 m² |

NEES is the normalised estimation error squared. For a two-state filter that is
working properly it averages about 2. Far below means the filter is too
uncertain; far above means it believes itself more than it has earned, which is
what is happening here.`,
    lang: 'python',
    starter: `# 1-D altitude filter: state is [altitude, vertical velocity].
#
# Process noise: acceleration is unmodelled, with standard deviation SIGMA_A.
# Measurement: altimeter, standard deviation SIGMA_Z.

SIGMA_A = 0.35     # m/s^2, unmodelled acceleration
SIGMA_Z = 8.0      # m, altimeter noise

def predict(x, P, dt):
    """Propagate state x = [h, v] and covariance P (2x2 list of lists)."""
    F = [[1.0, dt],
         [0.0, 1.0]]
    x_new = [x[0] + x[1] * dt, x[1]]

    # FPF' ...
    FP = [[sum(F[i][k] * P[k][j] for k in range(2)) for j in range(2)] for i in range(2)]
    P_new = [[sum(FP[i][k] * F[j][k] for k in range(2)) for j in range(2)] for i in range(2)]

    # ... and the process noise. This is where the trouble is.
    Q = [[0.0, 0.0],
         [0.0, 0.0]]

    P_new = [[P_new[i][j] + Q[i][j] for j in range(2)] for i in range(2)]
    return x_new, P_new


def update(x, P, z):
    """Fold in an altimeter reading z."""
    R = SIGMA_Z * SIGMA_Z
    S = P[0][0] + R
    K = [P[0][0] / S, P[1][0] / S]

    y = z - x[0]
    x_new = [x[0] + K[0] * y, x[1] + K[1] * y]

    P_new = [[P[0][0] - K[0] * P[0][0], P[0][1] - K[0] * P[0][1]],
             [P[1][0] - K[1] * P[0][0], P[1][1] - K[1] * P[0][1]]]
    return x_new, P_new
`,
    harness: `
import math, random

random.seed(20260922)

dt = 0.1
N = 1200

h, v = 2000.0, -15.0
x = [2000.0, -15.0]
P = [[100.0, 0.0], [0.0, 25.0]]

sq_err = 0.0
nees_sum = 0.0
nees_n = 0
blew_up = False

for k in range(N):
    # Truth: constant descent disturbed by real unmodelled acceleration.
    a = random.gauss(0.0, 0.35)
    v += a * dt
    h += v * dt

    x, P = predict(x, P, dt)
    z = h + random.gauss(0.0, 8.0)
    x, P = update(x, P, z)

    if not all(math.isfinite(t) for t in x) or not all(
        math.isfinite(P[i][j]) for i in range(2) for j in range(2)
    ):
        blew_up = True
        break

    eh = x[0] - h
    ev = x[1] - v
    sq_err += eh * eh

    det = P[0][0] * P[1][1] - P[0][1] * P[1][0]
    if det > 1e-12:
        i00 = P[1][1] / det
        i01 = -P[0][1] / det
        i11 = P[0][0] / det
        nees = eh * eh * i00 + 2.0 * eh * ev * i01 + ev * ev * i11
        if math.isfinite(nees):
            nees_sum += nees
            nees_n += 1

if blew_up:
    print("CHECK filter_finite fail the filter produced non-finite values")
    print("METRIC rms_altitude_error 999 <= 12 m")
    print("METRIC average_nees 999 <= 2.6")
else:
    rms = math.sqrt(sq_err / N)
    avg_nees = nees_sum / nees_n if nees_n else 999.0
    print("CHECK filter_finite pass")
    print("METRIC rms_altitude_error %.2f <= 12 m" % rms)
    print("METRIC average_nees %.2f <= 2.6" % avg_nees)
    print("METRIC average_nees_floor %.2f >= 0.4" % avg_nees)
    print("METRIC final_altitude_variance %.3f >= 0.5 m^2" % P[0][0])
    if avg_nees > 2.6:
        print("NOTE The filter is overconfident: its errors are larger than its covariance says they should be.")
    if avg_nees < 0.4:
        print("NOTE The filter is now under-confident — you may have overshot on process noise.")
`,
    hint: 'Look at Q. A filter that assumes zero process noise is claiming its model is perfect, so its covariance collapses and the gain goes to zero, after which new measurements change nothing. For a constant-velocity model driven by acceleration noise, the standard discrete Q is sigma_a squared times [[dt^4/4, dt^3/2], [dt^3/2, dt^2]].',
  },

  /* ── 5 ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bench_integrator_choice',
    title: 'The sim loses energy overnight',
    area: 'simulation',
    difficulty: 'realistic',
    minutes: 30,
    brief:
      'A long-duration orbit propagator is being used for a coverage study. Over a few days of simulated time the orbit visibly shrinks, and nobody believes the results any more. The dynamics are right. The integrator is not.',
    spec: `Propagate a two-body orbit for 20 orbital periods and keep it closed.

Implement \`step(state, dt)\` taking \`[x, y, vx, vy]\` in metres and metres per
second, under Earth point-mass gravity with
\`mu = 3.986004418e14\` m³/s².

Judged on:

| Requirement | Value |
| --- | --- |
| Specific energy drift over 20 orbits | under 0.05% |
| Final radius error against the analytic orbit | under 5 km |
| Steps per orbit | at most 20000, so brute force will not save you |

The initial state is a circular orbit at 500 km altitude. Forward Euler will
fail this no matter how small you make the step, which is the lesson.`,
    lang: 'python',
    starter: `import math

mu = 3.986004418e14   # m^3/s^2

def accel(x, y):
    r2 = x * x + y * y
    r = math.sqrt(r2)
    a = -mu / (r2 * r)
    return a * x, a * y

def step(state, dt):
    """One integration step. state = [x, y, vx, vy]. Returns the new state."""
    x, y, vx, vy = state
    ax, ay = accel(x, y)
    # Forward Euler — this is what is losing the energy.
    return [x + vx * dt, y + vy * dt, vx + ax * dt, vy + ay * dt]
`,
    harness: `
import math

Re = 6378137.0
r0 = Re + 500e3
v0 = math.sqrt(mu / r0)
period = 2.0 * math.pi * math.sqrt(r0 ** 3 / mu)

def energy(s):
    x, y, vx, vy = s
    r = math.sqrt(x * x + y * y)
    return 0.5 * (vx * vx + vy * vy) - mu / r

state = [r0, 0.0, 0.0, v0]
e0 = energy(state)

n_orbits = 20
steps_per_orbit = 4000
dt = period / steps_per_orbit
total = n_orbits * steps_per_orbit

bad = False
for k in range(total):
    state = step(state, dt)
    if not all(math.isfinite(t) for t in state):
        bad = True
        break

if bad:
    print("CHECK propagation_finite fail the state went non-finite")
    print("METRIC energy_drift 999 <= 0.05 %")
    print("METRIC final_radius_error 999 <= 5 km")
else:
    e1 = energy(state)
    drift = abs((e1 - e0) / e0) * 100.0
    r_final = math.sqrt(state[0] ** 2 + state[1] ** 2)
    r_err_km = abs(r_final - r0) / 1000.0
    print("CHECK propagation_finite pass")
    print("METRIC steps_per_orbit %d <= 20000" % steps_per_orbit)
    print("METRIC energy_drift %.5f <= 0.05 %%" % drift)
    print("METRIC final_radius_error %.3f <= 5 km" % r_err_km)
    print("NOTE Circular orbit, so the radius should come back to %.1f km every time." % (r0 / 1000.0))
    if drift > 0.05:
        print("NOTE Energy is walking in one direction rather than oscillating. That is the signature of a non-symplectic integrator, not of too large a step.")
`,
    hint: 'Try semi-implicit (symplectic) Euler first: update velocity using the current position, then update position using the new velocity. One line moved, and the energy error stops accumulating and starts oscillating instead. Velocity Verlet does better still for the same cost.',
  },

  /* ── 6 ─────────────────────────────────────────────────────────────────── */
  {
    id: 'bench_deadline_budget',
    title: 'The control loop misses its deadline',
    area: 'flight-software',
    difficulty: 'hard',
    minutes: 35,
    brief:
      'A 100 Hz control task is occasionally overrunning its 10 ms slot. The scheduler logs show it mostly finishes in 4 ms and sometimes takes 14. Intermittent, so nobody can reproduce it on the bench. Write the scheduling analysis that decides whether this is schedulable at all.',
    spec: `Three periodic tasks share one core, scheduled rate-monotonically:

| Task | Period | Worst-case execution time |
| --- | --- | --- |
| Control | 10 ms | 4.0 ms |
| Navigation | 40 ms | 9.0 ms |
| Telemetry | 100 ms | 12.0 ms |

Write two functions.

\`utilisation()\` returns total processor utilisation as a fraction.

\`response_time(i)\` returns the worst-case response time in milliseconds of
task \`i\` (0 = control, highest priority) using standard response-time
analysis: a task's response time is its own execution plus the interference
from every higher-priority task that can preempt it, solved to a fixed point.

$$
R_i = C_i + \\sum_{j \\in hp(i)} \\left\\lceil \\frac{R_i}{T_j} \\right\\rceil C_j
$$

A task is schedulable when its response time does not exceed its period. Do
not guess — iterate the recurrence until it stops changing.`,
    lang: 'python',
    starter: `import math

# (period_ms, wcet_ms), highest priority first under rate monotonic.
TASKS = [(10.0, 4.0), (40.0, 9.0), (100.0, 12.0)]

def utilisation():
    """Total processor utilisation as a fraction, e.g. 0.75."""
    # TODO
    return 0.0

def response_time(i):
    """Worst-case response time of task i, in milliseconds."""
    # TODO
    return 0.0
`,
    harness: `
import math

def _ref_util():
    return sum(c / t for (t, c) in TASKS)

def _ref_response(i):
    T_i, C_i = TASKS[i]
    R = C_i
    for _ in range(1000):
        interference = 0.0
        for j in range(i):
            T_j, C_j = TASKS[j]
            interference += math.ceil(R / T_j) * C_j
        R_next = C_i + interference
        if abs(R_next - R) < 1e-12:
            return R_next
        R = R_next
        if R > T_i * 100:
            return float('inf')
    return R

u = float(utilisation())
u_ref = _ref_util()
print("METRIC utilisation_error %.6f <= 1e-6" % abs(u - u_ref))

worst_err = 0.0
for i in range(len(TASKS)):
    got = float(response_time(i))
    want = _ref_response(i)
    if not math.isfinite(got) or not math.isfinite(want):
        worst_err = max(worst_err, 0.0 if got == want else 999.0)
    else:
        worst_err = max(worst_err, abs(got - want))
print("METRIC response_time_error %.6f <= 1e-6 ms" % worst_err)

names = ["control", "navigation", "telemetry"]
for i in range(len(TASKS)):
    want = _ref_response(i)
    T_i = TASKS[i][0]
    print("NOTE %s: response %.2f ms against a %.0f ms deadline%s"
          % (names[i], want, T_i, "" if want <= T_i else "  <-- misses"))
print("NOTE Utilisation is %.3f. The rate-monotonic sufficient bound for three tasks is %.3f, so a utilisation test alone cannot settle this." % (u_ref, 3 * (2 ** (1.0 / 3) - 1)))
`,
    hint: 'The recurrence starts at R = C_i and is iterated: compute the interference at the current R, get a new R, repeat until it stops moving. It converges from below, so starting at C_i and going up is correct. Watch the ceiling — the interference is a step function, which is exactly why the utilisation bound is not enough.',
  },
]

export function benchTaskById(id: string): BenchTask | undefined {
  return BENCH_TASKS.find((t) => t.id === id)
}
