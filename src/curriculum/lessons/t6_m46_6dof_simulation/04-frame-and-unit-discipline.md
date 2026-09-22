---
id: l04-frame-and-unit-discipline
title: Frame and unit discipline
minutes: 24
covers:
  - "Frame and unit discipline: naming every vector by its frame, and the conventions that stop a sign error becoming a three-week debugging session"
---

The first three lessons fixed the simulation's clock: the plant integrated accurately, the flight software called on its true rate, the two joined by a zero-order hold. None of that protects you from the defect that actually eats the most engineering time in a large vehicle simulation — not a wrong equation, not an unstable integrator, but a vector expressed in the wrong frame, or a quantity carried in the wrong unit. Both defects share a property that makes them uniquely dangerous: the simulation runs, the numbers are the right order of magnitude, the trajectory looks like a trajectory, and everything about the output invites you to believe it.

This lesson is about the discipline that catches these errors before they cost three weeks: naming every vector for the frame it is expressed in, naming every rotation for both frames it connects, and never letting a number cross a unit boundary without the conversion written down where you can see it. None of this is difficult mathematics. All of it is the difference between a bug you find by reading a line of code and a bug you find by noticing, months later, that a spacecraft is not where the simulation says it should be.

## Naming a vector for the frame it is expressed in

A position, velocity or force is not a list of three numbers; it is a list of three numbers *in a specific basis*, and the same physical vector has different components in different frames. Write the frame as a subscript on every vector that could be expressed in more than one: $\mathbf{r}_I$ for a position in the inertial frame, $\mathbf{r}_B$ for the same physical point's components in the body frame, $\mathbf{v}_I$, $\mathbf{a}_B$, and so on. This is not decoration. It turns a whole class of bugs — adding a body-frame vector to an inertial-frame one, comparing a sensor reading against a truth value expressed in the wrong frame — into a visible mismatch in the subscripts, catchable by reading the line rather than by running the simulation and noticing the output looks strange.

## Naming a rotation for both frames, in order

A rotation between two frames needs both frames in its name, and the order matters. Write $\mathbf{C}_{B\leftarrow I}$ for the direction cosine matrix that turns an inertial-frame vector's *components* into body-frame components of the same physical vector:

$$
\mathbf{r}_B = \mathbf{C}_{B\leftarrow I}\,\mathbf{r}_I .
$$

Read the subscript right to left, like function composition: "from $I$, into $B$." The frame label touching the vector on the right of the matrix must match the vector's own subscript — that is the whole rule, and it is what makes a composed chain of rotations self-checking:

$$
\mathbf{C}_{C\leftarrow B}\,\mathbf{C}_{B\leftarrow I} = \mathbf{C}_{C\leftarrow I} .
$$

The inner $B$'s sit adjacent and identical, and cancel exactly the way units cancel in a dimensional-analysis check — $\mathrm{s} \times (\mathrm{m/s}) = \mathrm{m}$. If you ever write down a product where the adjacent labels do not match, $\mathbf{C}_{C\leftarrow B}\,\mathbf{C}_{D\leftarrow I}$ with $B \ne D$, the expression is wrong before you evaluate a single entry, and you know it from the notation alone. Quaternions carry the same discipline: name a quaternion $q_{B\leftarrow I}$ for the rotation from $I$ into $B$, and a composed attitude $q_{C\leftarrow I} = q_{C\leftarrow B} \otimes q_{B\leftarrow I}$ must have its inner frame labels agree the same way, whatever multiplication order and handedness convention the Attitude Representations module fixed for you — the convention decides how to *compute* the composition; frame-label agreement decides whether the composition you wrote down means anything at all.

::: example A frame bug that looks completely reasonable
A vehicle is at $\mathbf{r}_I = (4000, 3000, 5000)\,\mathrm{km}$ — about $693\,\mathrm{km}$ altitude — and the Environment box computes the true inertial-frame gravitational acceleration, $\mathbf{g}_I = -\mu\,\mathbf{r}_I/\lVert\mathbf{r}_I\rVert^3$ with $\mu = 398{,}600.4418\,\mathrm{km^3/s^2}$. Something downstream — an accelerometer model, say — needs this in body-frame components, so it applies a rotation. The vehicle's attitude relative to inertial, as a $3$-$2$-$1$ Euler sequence, is yaw $30^\circ$, pitch $15^\circ$, roll $10^\circ$.

```python
import numpy as np
from scipy.spatial.transform import Rotation as R

mu = 398600.4418                            # km^3/s^2, Earth
r_I = np.array([4000.0, 3000.0, 5000.0])    # km, about 693 km altitude
g_I = -mu * r_I / np.linalg.norm(r_I)**3    # km/s^2, truth gravity from the Environment box

att = R.from_euler('ZYX', [30, 15, 10], degrees=True)
C_I_from_B = att.as_matrix()                # body axes expressed in the inertial frame
C_B_from_I = C_I_from_B.T                   # the rotation actually needed: inertial components -> body

g_B_correct = C_B_from_I @ g_I
g_B_wrong = C_I_from_B @ g_I                # the bug: the un-transposed matrix used instead

print("g_B_correct (km/s^2):", g_B_correct)
print("g_B_wrong   (km/s^2):", g_B_wrong)
print("|g_B_correct| =", np.linalg.norm(g_B_correct), " |g_B_wrong| =", np.linalg.norm(g_B_wrong))
angle = np.degrees(np.arccos(np.dot(g_B_correct, g_B_wrong) /
                              (np.linalg.norm(g_B_correct) * np.linalg.norm(g_B_wrong))))
print("angle between them (deg):", angle)
# g_B_correct (km/s^2): [-0.00394691 -0.00186108 -0.00667167]
# g_B_wrong   (km/s^2): [-0.00397236 -0.00500929 -0.00476239]
# |g_B_correct| = 0.007972008836000001  |g_B_wrong| = 0.007972008836000001
# angle between them (deg): 26.704141754181958
```

`C_I_from_B` is the attitude matrix as most rotation libraries hand it to you — the orientation of the body axes *expressed in* the inertial frame. The rotation this calculation actually needs is its transpose, $\mathbf{C}_{B\leftarrow I}$; using `C_I_from_B` directly is a one-character bug — a missing `.T` — and one of the most common frame errors there is. The two results have *identical* magnitude, $7.972\,\mathrm{m/s^2}$ to every digit, because any rotation matrix preserves length; a sanity check that only looks at magnitude passes both. The two vectors point $26.7^\circ$ apart. Written with frame labels, the bug is visible without running anything: `C_I_from_B @ g_I` is $\mathbf{C}_{I\leftarrow B}\,\mathbf{g}_I$, a matrix that expects a $B$-labelled vector multiplying an $I$-labelled one — the labels do not touch, and the line should never have compiled, let alone run.
:::

## Why quaternion normalisation is not optional

The kinematic equation carrying the attitude quaternion forward is $\dot q = \tfrac12\, q \otimes \boldsymbol\omega$ (treating $\boldsymbol\omega$ as the pure quaternion $(0, \omega_1, \omega_2, \omega_3)$), which is a linear equation in $q$ for any instant's $\boldsymbol\omega$: $\dot q = \tfrac12\boldsymbol\Omega(\boldsymbol\omega)\,q$ for a $4\times4$ matrix $\boldsymbol\Omega(\boldsymbol\omega)$ built from the Hamilton product. That matrix is exactly skew-symmetric, $\boldsymbol\Omega^\top = -\boldsymbol\Omega$, which is enough on its own to prove $\lVert q\rVert$ is exactly conserved in continuous time: for any skew-symmetric $\mathbf{A}$, $q^\top\mathbf{A}q = (q^\top\mathbf{A}q)^\top = q^\top\mathbf{A}^\top q = -q^\top\mathbf{A}q$, forcing $q^\top\mathbf{A}q = 0$, so $\tfrac{d}{dt}\lVert q\rVert^2 = 2q\cdot\dot q = q^\top\boldsymbol\Omega q = 0$. A unit quaternion that starts on the unit sphere never leaves it — as long as the equation is solved exactly.

A numerical integrator does not solve it exactly. Freezing $\boldsymbol\omega$ over one step makes the kinematic equation a genuine linear system $\dot q = \mathbf{A}q$ with $\mathbf{A} = \tfrac12\boldsymbol\Omega(\boldsymbol\omega)$ skew-symmetric and purely imaginary eigenvalues $\pm i\lVert\boldsymbol\omega\rVert/2$ — the factor of two is the quaternion double cover: a physical rotation rate $\boldsymbol\omega$ advances the quaternion at half that rate. RK4 approximates the exact flow $e^{\mathbf{A}h}$ with the same fourth-order polynomial $R(z) = 1+z+z^2/2+z^3/6+z^4/24$ the Numerical Methods module derived for the scalar case, now evaluated at the matrix argument. On a purely imaginary eigenvalue $i\theta$ with $\theta = (\lVert\boldsymbol\omega\rVert/2)h$, that module's result carries over unchanged: $\lvert R(i\theta)\rvert^2 = 1 - \theta^6/72 + \theta^8/576 < 1$. RK4 does not preserve $\lVert q\rVert$; it very slowly shrinks it, at exactly the rate the orbit-energy analysis predicted for a different conserved quantity of a different equation, because the underlying mechanism — a fourth-order truncation of the matrix exponential of a skew-symmetric generator — is identical.

::: example Measuring the quaternion drift, and checking it against the theory
Hold $\boldsymbol\omega = (0, 0, 2)\,\mathrm{rad/s}$ fixed and integrate the kinematic equation with RK4 at $h = 0.05\,\mathrm{s}$ (a $20\,\mathrm{Hz}$ attitude update) for $1{,}000\,\mathrm{s}$, 20,000 steps.

```python
import numpy as np

def quat_mult(q, p):
    q0, q1, q2, q3 = q
    p0, p1, p2, p3 = p
    return np.array([
        q0*p0 - q1*p1 - q2*p2 - q3*p3,
        q0*p1 + q1*p0 + q2*p3 - q3*p2,
        q0*p2 - q1*p3 + q2*p0 + q3*p1,
        q0*p3 + q1*p2 - q2*p1 + q3*p0,
    ])

def qdot(q, w):
    return 0.5 * quat_mult(q, np.array([0.0, *w]))

def rk4_step(q, w, h):
    k1 = qdot(q, w)
    k2 = qdot(q + 0.5*h*k1, w)
    k3 = qdot(q + 0.5*h*k2, w)
    k4 = qdot(q + h*k3, w)
    return q + h/6.0*(k1 + 2*k2 + 2*k3 + k4)

w = np.array([0.0, 0.0, 2.0])      # rad/s, held fixed for this idealised test
q = np.array([1.0, 0.0, 0.0, 0.0])
h = 0.05                            # s, 20 Hz
n_steps = 20000                     # 1000 s

norms = [np.linalg.norm(q)]
for _ in range(n_steps):
    q = rk4_step(q, w, h)
    norms.append(np.linalg.norm(q))

theta = (np.linalg.norm(w) / 2) * h
predicted = (1 - theta**6/72 + theta**8/576) ** n_steps
print("theta per step:", theta)
print("||q|| after", n_steps, "steps:", norms[-1])
print("predicted ||q||^2 after", n_steps, "steps:", predicted, " -> ||q||:", np.sqrt(predicted))
print("||q||-1 at step 1000:", norms[1000] - 1, " at step 20000:", norms[20000] - 1)
# theta per step: 0.05
# ||q|| after 20000 steps: 0.9999978305416315
# predicted ||q||^2 after 20000 steps: 0.9999956610890784  -> ||q||: 0.9999978305421859
# ||q||-1 at step 1000: -1.0847302955863114e-07  at step 20000: -2.1694583685061275e-06
```

Measured and predicted agree to six significant figures: $\lVert q\rVert$ after 20,000 steps is $0.99999783$, against a closed-form prediction of $0.99999783$. The drift is secular — $-1.085\times10^{-7}$ at step 1,000 and almost exactly ten times that, $-2.169\times10^{-6}$, at step 20,000 — the same signature the Numerical Methods module used to diagnose RK4's orbital energy drift, now confirmed on a completely different conserved quantity of a completely different equation, because the mechanism is the same fourth-order truncation.
:::

The magnitude here is tiny over 1,000 s of an idealised, constant-rate test. It is not tiny in general: real body rates are not held fixed between steps, propellant depletion and staging inject their own discontinuities, and a mission runs far longer than 1,000 s. The drift is also invisible in a plot of attitude versus time — a quaternion at $\lVert q\rVert = 0.999998$ still represents a perfectly plausible-looking orientation. The fix costs almost nothing and removes the problem exactly, rather than merely slowing it: renormalise after every integration step, $q \leftarrow q/\lVert q\rVert$. This is a projection back onto the constraint manifold, not an approximation, and it is cheap enough — four multiplies and a square root against the cost of a full rigid-body RK4 step — that there is no engineering reason to do it less often than every step.

## Unit discipline

Frame errors hide in direction; unit errors hide in magnitude, and they are just as capable of producing a plausible-looking number, because a value that is off by a clean factor — a thousand for km versus m, $57.3$ for radians versus degrees, $4.448$ for pound-force versus newton — is still just a number, with no dimension attached to flag it as wrong. Carry SI units throughout the simulation's internal state, exactly as the rest of this curriculum has, and treat every boundary where a number enters or leaves that convention — a hardware interface specified in different units, a ground-supplied file, a legacy component's documentation — as a place a conversion must be written down explicitly and tested, never assumed.

::: example The unit bug that ended a Mars mission, reproduced in miniature
A ground-supplied trajectory correction is specified as an impulse of $100\,\mathrm{lbf\cdot s}$ (pound-force-seconds) — a real unit pairing that shows up at the interface between a vendor's tooling and a metric flight system, and the specific pairing implicated in the loss of the Mars Climate Orbiter. If the receiving software's unit conversion is missing and it treats the number $100$ as newton-seconds directly:

```python
lbf_to_N = 4.4482216152605      # exact, by definition of the pound-force
impulse_lbf_s = 100.0
mass = 500.0                    # kg

dv_correct = (impulse_lbf_s * lbf_to_N) / mass
dv_wrong = impulse_lbf_s / mass  # the bug: the 100 used as if it were already newton-seconds

print(dv_correct, dv_wrong, dv_correct / dv_wrong)
# 0.8896443230521 0.2 4.4482216152605
```

The correction the vehicle actually needed was $0.890\,\mathrm{m/s}$; the correction the flight software computed was $0.200\,\mathrm{m/s}$ — a factor of $4.448$ short, silently, with no error, no warning, and no dimension anywhere in the code to catch it. Nothing about a $0.2\,\mathrm{m/s}$ burn looks wrong in isolation; it is the right order of magnitude for a trajectory correction. The only defence is never letting a bare number cross a unit boundary — always carrying the unit in the variable's name or type, and testing the conversion against a known reference value rather than trusting a vendor's documentation to be unambiguous.
:::

::: key Frame and unit discipline
Name every vector for the frame it is expressed in ($\mathbf{r}_I$, $\mathbf{r}_B$) and every rotation for both frames it connects, source then destination ($\mathbf{C}_{B\leftarrow I}$), so that a composed or applied transformation's adjacent frame labels must agree — the way units cancel in a dimensional check. Frame errors preserve magnitude and produce plausible numbers; only this kind of notation, checked by reading rather than by running, catches them reliably. Carry SI units throughout and write every unit conversion down explicitly at the boundary where it happens.
:::

::: warning A magnitude check is not a frame check
A rotation preserves length exactly, so any frame error made by applying the wrong (but still orthogonal) matrix produces a vector with the *correct* magnitude and the *wrong* direction. "The number looks about right" is worthless evidence against a frame bug specifically because the bug cannot change the number you are looking at if that number is a magnitude. Check components against an independent computation in a *known* frame, or check a derived quantity that a frame error would actually disturb — not the magnitude of the vector the bug operates on.
:::

::: warning Renormalising "when it seems to matter"
Renormalising the quaternion only when a check flags a large deviation feels efficient and is a mistake: the drift measured above is secular, so by the time it is large enough to notice by eye, it has been silently biasing every attitude-dependent quantity in the simulation for a long time, and you have no record of when it became significant. Since the cost of renormalising every step is negligible next to the cost of the rest of the plant integration, there is no efficiency argument for doing it less often, and there is no argument at all for making it conditional.
:::

## Check yourself

::: check
What does the subscript order in $\mathbf{C}_{B\leftarrow I}$ mean, and what must be true of adjacent labels in a chain such as $\mathbf{C}_{C\leftarrow B}\,\mathbf{C}_{B\leftarrow I}$ for the chain to be valid?
:::

::: answer
$\mathbf{C}_{B\leftarrow I}$ turns the components of a vector expressed in frame $I$ into the components of the same physical vector expressed in frame $B$ — read right to left, "from $I$, into $B$." In a chain, the frame label on the right of one matrix must match the frame label on the left of the matrix (or vector) it multiplies; in $\mathbf{C}_{C\leftarrow B}\,\mathbf{C}_{B\leftarrow I}$, the inner $B$'s agree and the product simplifies to $\mathbf{C}_{C\leftarrow I}$. A mismatched inner label means the product does not represent a valid composed transformation, regardless of what numbers come out.
:::

::: check
In the gravity-vector example, $\mathbf{g}_B^{\text{correct}}$ and $\mathbf{g}_B^{\text{wrong}}$ had identical magnitude but were $26.7^\circ$ apart. Why does a frame error of this kind — using the transpose of the needed rotation matrix — always preserve magnitude?
:::

::: answer
Any direction cosine matrix is orthogonal, and both a matrix and its transpose are orthogonal (if $\mathbf{C}^\top\mathbf{C} = \mathbf{I}$ then $(\mathbf{C}^\top)^\top\mathbf{C}^\top = \mathbf{C}\mathbf{C}^\top = \mathbf{I}$ too). An orthogonal transformation preserves the length of any vector it acts on by definition, so applying the wrong rotation still produces a vector of the correct length — it is only ever the direction that changes. This is precisely why a magnitude-only sanity check cannot catch this class of bug.
:::

::: check
Show that $\tfrac{d}{dt}\lVert q\rVert^2 = 0$ follows from $\dot q = \tfrac12\boldsymbol\Omega(\boldsymbol\omega)q$ whenever $\boldsymbol\Omega$ is skew-symmetric, without assuming any particular form for $\boldsymbol\Omega$.
:::

::: answer
$\tfrac{d}{dt}\lVert q\rVert^2 = 2q\cdot\dot q = q^\top\boldsymbol\Omega q$. For any skew-symmetric matrix, $q^\top\boldsymbol\Omega q$ is a scalar, so it equals its own transpose: $q^\top\boldsymbol\Omega q = (q^\top\boldsymbol\Omega q)^\top = q^\top\boldsymbol\Omega^\top q = -q^\top\boldsymbol\Omega q$. A quantity equal to its own negative is zero, so $q^\top\boldsymbol\Omega q = 0$ and $\tfrac{d}{dt}\lVert q\rVert^2 = 0$, for any skew-symmetric $\boldsymbol\Omega$, at any $\boldsymbol\omega$.
:::

::: check
The measured quaternion-norm drift under RK4 was $-1.085\times10^{-7}$ at step 1,000 and $-2.169\times10^{-6}$ at step 20,000 — almost exactly a factor of 20 for 20 times the steps. What does that linearity tell you, and how would you expect the drift at step 1,000 to change if the step size $h$ were halved?
:::

::: answer
Linear growth in the number of steps is the signature of a secular error: each step contributes very nearly the same small decrement, so the total after $N$ steps is close to $N$ times the per-step decrement — the same signature the Numerical Methods module used to identify RK4's orbital energy drift as truncation error rather than a physical effect. Since the per-step factor is $1 - \theta^6/72 + \cdots$ with $\theta \propto h$, halving $h$ divides $\theta^6$ by $64$; over the same physical time span the number of steps doubles, so the drift at a fixed elapsed time should fall by a factor of about $32$ — one power of $h$ better than RK4's usual fourth-order global error, exactly as it was for the orbital case, because the leading $\theta^4$ term of $\lvert R(i\theta)\rvert^2$ cancels.
:::

::: check
A teammate argues that since the quaternion drift measured here is only a few parts in $10^{6}$ after 1,000 seconds, renormalisation is unnecessary engineering overhead. What is wrong with using this specific number to justify that conclusion in general?
:::

::: answer
The number was measured under an idealised, best-case assumption — a perfectly constant $\boldsymbol\omega$ held fixed for the entire test — which is exactly the condition under which the skew-symmetric linear analysis is exact and the drift is at its theoretical minimum. A real vehicle's body rate changes throughout a step, is itself only approximately integrated, and experiences genuine discontinuities at events like staging; none of these make the drift smaller. The drift is also secular, so its size after any given mission duration depends on that duration, which the 1,000 s test was not chosen to represent. Renormalising every step costs a handful of floating-point operations and removes the question entirely rather than requiring you to bound it for every mission profile.
:::

::: check
A vendor delivers a thruster's total impulse rating in pound-force-seconds. What is the one engineering practice that would have prevented the Mars Climate Orbiter-style error reproduced in this lesson's example, beyond simply "remembering to convert"?
:::

::: answer
Carrying the unit explicitly in the variable's name or type at the point the value enters the simulation, and testing the conversion against a known reference value, rather than trusting that a bare number means what the receiving code assumes it means. "Remembering to convert" relies on a person noticing every time; a value labelled `impulse_lbf_s` (or a typed quantity that refuses to combine with a newton-second value without an explicit conversion) makes the missing conversion a visible mismatch at the point it is used, the same way a mismatched frame subscript does.
:::

## Summary

| Item | Statement |
| --- | --- |
| Vector naming | $\mathbf{r}_I$, $\mathbf{r}_B$: subscript the frame a vector is expressed in |
| Rotation naming | $\mathbf{C}_{B\leftarrow I}$: source then destination; composed rotations require adjacent inner labels to match, $\mathbf{C}_{C\leftarrow B}\mathbf{C}_{B\leftarrow I} = \mathbf{C}_{C\leftarrow I}$ |
| Frame errors | Preserve magnitude exactly (rotations are orthogonal), change only direction — a magnitude check cannot catch them |
| Quaternion norm, continuous time | $\dot q = \tfrac12\boldsymbol\Omega(\boldsymbol\omega)q$, $\boldsymbol\Omega$ skew-symmetric $\Rightarrow$ $\tfrac{d}{dt}\lVert q\rVert^2 = q^\top\boldsymbol\Omega q = 0$ exactly |
| Quaternion norm, RK4 | Secular drift, $\lvert R(i\theta)\rvert^2 = 1-\theta^6/72+\cdots$ per step, $\theta = (\lVert\boldsymbol\omega\rVert/2)h$; measured $-2.17\times10^{-6}$ after 20,000 steps matched theory to six figures |
| Fix | Renormalise $q \leftarrow q/\lVert q\rVert$ every step — a projection, not an approximation, and cheap |
| Unit discipline | SI throughout; every boundary conversion (lbf·s vs N·s, km vs m, deg vs rad) written down and tested, never assumed — a factor-of-4.448 miss reproduced above |

With the clock and the bookkeeping both in place, the next lesson turns to what actually drives the plant: the environment models — gravity, atmosphere, wind, magnetic field, radiation pressure — that the frame and unit discipline just built has to be applied to correctly on every single one of them.
