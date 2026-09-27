---
id: l04-frame-and-unit-discipline
title: Frame and unit discipline
minutes: 23
covers:
  - "Frame and unit discipline: naming every vector by its frame, and the conventions that stop a sign error becoming a three-week debugging session"
---

Stand face to face with a friend and ask her to raise her left hand. From where you stand, the hand goes up on *your* right. Nothing is wrong with her hand or with your eyes. "Left" only means something once you say whose left. Now picture a recipe that says "add 2" of flour, and one cook reads cups while another reads kilograms. Both followed the recipe. Only one of them made bread.

A vehicle simulation is full of exactly these two mix-ups. A direction written as three numbers only means something once you say which set of axes the numbers are measured along. A size written as one number only means something once you say its unit. Get either wrong and the simulation does not crash. It runs, the numbers have a sensible size, the trajectory looks like a trajectory — and it is wrong.

The first three lessons fixed the simulation's clock: an accurate plant, flight software called at its true rate, a zero-order hold between them. None of that protects you from the defect that eats the most engineering time in a big simulation. That defect is a vector in the wrong frame, or a number in the wrong unit. This lesson is the habit that catches both by *reading* a line of code, instead of by noticing, months later, that a spacecraft is not where the simulation said it would be.

## Every vector says which frame it is in

Think of an arrow painted on the floor of a room. You can describe it as "3 steps along the wall with the door, 4 steps along the wall with the window". Turn to face a different corner and the same arrow gets different numbers. The arrow did not change. Only your measuring directions did.

A set of three measuring directions is a **[[frame|what-a-frame-is]]** — three perpendicular axes you read a vector's components along. A simulation uses several. The **inertial frame**, $I$, is fixed to the stars and does not spin. The **body frame**, $B$, is bolted to the vehicle and turns with it.

So a position, velocity or force is not only a list of three numbers. It is three numbers *in a stated frame*. Write that frame as a subscript on every vector that could live in more than one:

- $\mathbf{r}_I$, read "r sub I": a position's components in the inertial frame;
- $\mathbf{r}_B$, read "r sub B": the *same* physical point's components in the body frame;
- likewise $\mathbf{v}_I$, $\mathbf{a}_B$, and so on.

This is not decoration. It turns a whole family of bugs into a visible mismatch of letters. Adding a body-frame vector to an inertial one reads as $\mathbf{a}_B + \mathbf{g}_I$, and the clash is right there on the line. Comparing a sensor reading against truth held in the wrong frame looks the same. You catch it by reading, not by running the simulation and squinting at the output.

## Every rotation names both frames, in order

To move a vector's components from one frame to another, you multiply by a rotation matrix. The usual one is the **[[direction cosine matrix|dcm-name]]**, or DCM: a $3\times3$ grid of numbers that turns components in one frame into components in another.

A rotation connects two frames, so its name needs both, and the order matters. Write $\mathbf{C}_{B\leftarrow I}$, read "C, B from I", for the matrix that turns an inertial vector's *components* into body-frame components of the same physical vector:

$$
\mathbf{r}_B = \mathbf{C}_{B\leftarrow I}\,\mathbf{r}_I .
$$

Read the subscript right to left: "from $I$, into $B$". Here is the whole rule: **the frame label on the right of the matrix must match the label of the vector it touches.** Above, the $I$ on the matrix sits right next to the $I$ on $\mathbf{r}_I$. They match, so the line makes sense.

That one rule makes a chain of rotations check itself. Rotate from $I$ into $B$, then from $B$ into a third frame $C$:

$$
\mathbf{C}_{C\leftarrow B}\,\mathbf{C}_{B\leftarrow I} = \mathbf{C}_{C\leftarrow I} .
$$

The two inner $B$'s sit side by side and agree, so they [[cancel, the way units cancel|labels-cancel]]. It is the same move as $\mathrm{s} \times (\mathrm{m/s}) = \mathrm{m}$ in a units check. If you ever write $\mathbf{C}_{C\leftarrow B}\,\mathbf{C}_{D\leftarrow I}$ with $B \ne D$, the expression is wrong before you work out a single entry. The notation alone tells you.

Quaternions follow the same discipline. A **quaternion** is a list of four numbers that stores a rotation more compactly than a $3\times3$ matrix. Name it $q_{B\leftarrow I}$ for the rotation from $I$ into $B$. A composed attitude,

$$
q_{C\leftarrow I} = q_{C\leftarrow B} \otimes q_{B\leftarrow I},
$$

must have its inner labels agree in exactly the same way. ($\otimes$, read "quaternion times", is the quaternion product.) The Attitude Representations module fixed a multiplication order and a handedness convention for you. That convention decides how to *compute* the product. Label agreement decides whether the product you wrote down means anything at all.

::: example A frame bug that looks completely reasonable
A vehicle is at $\mathbf{r}_I = (4000, 3000, 5000)\,\mathrm{km}$. Its distance from Earth's center is $\sqrt{4000^2 + 3000^2 + 5000^2} = 7071\,\mathrm{km}$, so it is about $7071 - 6378 = 693\,\mathrm{km}$ up. The Environment box computes the true gravitational acceleration in the inertial frame, $\mathbf{g}_I = -\mu\,\mathbf{r}_I/\lVert\mathbf{r}_I\rVert^3$, with Earth's gravitational parameter $\mu = 398{,}600.4418\,\mathrm{km^3/s^2}$. ($\lVert\mathbf{r}\rVert$, read "the norm of r", is the vector's length.)

An accelerometer model downstream needs this in body-frame components, so it applies a rotation. The vehicle's attitude is given as a **[[3-2-1 Euler sequence|euler-321]]**: yaw $30^\circ$, pitch $15^\circ$, roll $10^\circ$.

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

Step by step, here is what happened.

1. The library hands back `C_I_from_B`: the body axes written out in inertial components. That matrix is $\mathbf{C}_{I\leftarrow B}$. It takes body components *into* inertial ones.
2. We need the other direction, $\mathbf{C}_{B\leftarrow I}$. For a rotation, going backward is the **[[transpose|transpose-undoes]]** — the matrix flipped across its diagonal, written with a superscript ${}^\top$. In code that is `.T`.
3. The bug forgets `.T`. One missing character.
4. Both answers have length $0.007972\,\mathrm{km/s^2}$, which is $7.972\,\mathrm{m/s^2}$, identical to every digit. A rotation never changes a vector's length, so a check on the size passes both.
5. The two answers point $26.7^\circ$ apart.

Now read the buggy line with labels. `C_I_from_B @ g_I` is $\mathbf{C}_{I\leftarrow B}\,\mathbf{g}_I$. The matrix expects a $B$ vector on its right and is handed an $I$ vector. The labels do not match. With frame names in the code, that line should never have survived review.
:::

::: warning A magnitude check is not a frame check
A rotation keeps length exactly. So a frame error made with the wrong (but still valid) rotation matrix gives a vector of the *right* size pointing the *wrong* way. "The number looks about right" is worthless evidence against a frame bug, because the bug cannot change the number you are looking at if that number is a length. Instead, check components against an independent calculation in a *known* frame, or check a quantity that a frame error really would disturb.
:::

## Why the quaternion must be renormalized

A rotation quaternion has a rule: its length must be exactly $1$. Picture it as a point on the surface of a ball of radius $1$ (in four dimensions, but the idea is the same). Every point on that surface is a valid attitude. A point inside or outside the surface is not a rotation at all.

The attitude quaternion moves forward in time by the **kinematic equation**:

$$
\dot q = \tfrac12\, q \otimes \boldsymbol\omega .
$$

Read $\dot q$ as "q dot", the rate of change of $q$. Here $\boldsymbol\omega$ ("omega") is the body's spin rate, treated as the quaternion $(0, \omega_1, \omega_2, \omega_3)$ with a zero in front. For any one instant's $\boldsymbol\omega$ this is a linear equation in $q$. You can write it as a $4\times4$ matrix $\boldsymbol\Omega(\boldsymbol\omega)$ ("capital omega of omega"), built from the quaternion product, times $q$:

$$
\dot q = \tfrac12\boldsymbol\Omega(\boldsymbol\omega)\,q .
$$

That matrix is **[[skew-symmetric|skew-symmetric]]**: flipping it across its diagonal gives its negative, $\boldsymbol\Omega^\top = -\boldsymbol\Omega$. And that single fact means $\dot q$ always points *sideways* to $q$, never in or out. Think of a ball on a string swung in a circle. Its velocity is always at right angles to the string, so the string's length never changes. In the same way, a quaternion that starts on the surface of the unit ball never leaves it — as long as the equation is solved exactly.

::: note Why it has to be true
The rate of change of the squared length is $\tfrac{d}{dt}\lVert q\rVert^2 = 2q\cdot\dot q = q^\top\boldsymbol\Omega q$. For any skew-symmetric matrix $\mathbf{A}$, the number $q^\top\mathbf{A}q$ is a single number, so it equals its own transpose:

$$
q^\top\mathbf{A}q = (q^\top\mathbf{A}q)^\top = q^\top\mathbf{A}^\top q = -q^\top\mathbf{A}q .
$$

The only number equal to its own negative is zero. So $q^\top\boldsymbol\Omega q = 0$, and $\tfrac{d}{dt}\lVert q\rVert^2 = 0$: the length is exactly conserved in continuous time.
:::

A numerical integrator does not solve the equation exactly. Freeze $\boldsymbol\omega$ over one step of length $h$. Then the equation is a plain linear system $\dot q = \mathbf{A}q$ with $\mathbf{A} = \tfrac12\boldsymbol\Omega(\boldsymbol\omega)$. Its eigenvalues are purely imaginary, $\pm i\lVert\boldsymbol\omega\rVert/2$. That factor of two is the quaternion's **[[double cover|double-cover]]**: a body spinning at rate $\boldsymbol\omega$ moves its quaternion at half that rate.

RK4 replaces the exact one-step answer $e^{\mathbf{A}h}$ with the fourth-order polynomial the Numerical Methods module derived for the scalar case,

$$
R(z) = 1+z+\frac{z^2}{2}+\frac{z^3}{6}+\frac{z^4}{24},
$$

now fed a matrix. On an imaginary eigenvalue, with $\theta = (\lVert\boldsymbol\omega\rVert/2)h$ ("theta", the quaternion's turn per step), that module's result carries over unchanged:

$$
\lvert R(i\theta)\rvert^2 = 1 - \frac{\theta^6}{72} + \frac{\theta^8}{576} < 1 .
$$

So each RK4 step multiplies the squared length by a number a hair below $1$. RK4 does not keep $\lVert q\rVert$; it shrinks it, very slowly. It is the same mechanism that made RK4 drain energy from an orbit in the Numerical Methods module. A different conserved quantity, a different equation — but the same fourth-order stand-in for the exponential of a skew-symmetric matrix.

::: example Measuring the quaternion drift, and checking it against the theory
Hold $\boldsymbol\omega = (0, 0, 2)\,\mathrm{rad/s}$ fixed. Integrate the kinematic equation with RK4 at $h = 0.05\,\mathrm{s}$ (a $20\,\mathrm{Hz}$ attitude update) for $1{,}000\,\mathrm{s}$, which is 20,000 steps.

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

First the prediction. The turn per step is $\theta = (2/2)(0.05) = 0.05$. Each step multiplies $\lVert q\rVert^2$ by $1 - 0.05^6/72 + \ldots$, and 20,000 steps give $\lVert q\rVert^2 = 0.99999566$. Take the square root: $\lVert q\rVert = 0.99999783$.

Now the measurement: $0.99999783$. Theory and simulation agree to six significant figures.

Last, the pattern. The drift is $-1.085\times10^{-7}$ at step 1,000 and $-2.169\times10^{-6}$ at step 20,000. Twenty times the steps, almost exactly twenty times the drift. Growth in a straight line with time is the signature of a **[[secular|secular-word]]** error: each step takes off nearly the same tiny amount. It is the same signature the Numerical Methods module used to diagnose RK4's orbital energy drift.
:::

Over 1,000 s of a test this tidy, the drift is tiny. It is not tiny in general. Real body rates change within a step. Propellant use and staging add their own jolts. A mission lasts far longer than 1,000 s. And the drift is invisible in a plot: a quaternion of length $0.999998$ still looks like a perfectly sensible attitude.

The fix costs almost nothing and removes the problem instead of slowing it down. After every integration step, **renormalize**: divide the quaternion by its own length, $q \leftarrow q/\lVert q\rVert$. This is a projection straight back onto the surface of the unit ball, not an approximation. It costs four multiplies and a square root, next to a whole rigid-body RK4 step. There is no engineering reason to do it less often than every step.

::: warning Renormalizing "when it seems to matter"
Renormalizing only when a check flags a large deviation feels efficient. It is a mistake. The drift is secular, so by the time it is big enough to notice, it has been quietly biasing every attitude-dependent quantity for a long time — and you have no record of when it started to matter. Renormalizing every step is nearly free next to the rest of the plant. There is no efficiency case for doing it less often, and no case at all for making it conditional.
:::

## Unit discipline

Frame errors hide in *direction*. Unit errors hide in *size*. And a unit error also produces a believable number, because it is off by a clean factor:

- $1000$ for kilometers versus meters;
- $57.3$ for radians versus degrees (one radian is $57.3^\circ$);
- $4.448$ for pound-force versus newtons.

A number off by one of those factors is still an ordinary-looking number. Nothing about it says "wrong unit".

So keep SI units — meters, kilograms, seconds, radians — throughout the simulation's internal state, as the rest of this course does. Then treat every **boundary**, every place a number enters or leaves that system, as a spot where a conversion must be written down and tested, never assumed. Boundaries include a hardware interface specified in other units, a file supplied by the ground team, and an older component's documentation. (The gravity example above used kilometers to keep the numbers short. That is fine for a hand check. Inside the simulation the state is in meters, and a kilometer value coming in is exactly such a boundary.)

::: example The unit bug that ended a Mars mission, in miniature
A trajectory correction arrives from the ground as an **impulse** — force multiplied by how long it acts — of $100\,\mathrm{lbf\cdot s}$ (pound-force seconds). This exact pairing, a US-customary number handed to a metric flight system, was at the heart of the loss of the **[[Mars Climate Orbiter|mars-climate-orbiter]]**. Suppose the receiving software has no conversion and treats the $100$ as newton-seconds.

```python
lbf_to_N = 4.4482216152605      # exact, by definition of the pound-force
impulse_lbf_s = 100.0
mass = 500.0                    # kg

dv_correct = (impulse_lbf_s * lbf_to_N) / mass
dv_wrong = impulse_lbf_s / mass  # the bug: the 100 used as if it were already newton-seconds

print(dv_correct, dv_wrong, dv_correct / dv_wrong)
# 0.8896443230521 0.2 4.4482216152605
```

A change in speed is impulse divided by mass.

- Correct: $100 \times 4.448 = 444.8\,\mathrm{N\cdot s}$, and $444.8 / 500 = 0.890\,\mathrm{m/s}$.
- Buggy: $100 / 500 = 0.200\,\mathrm{m/s}$.

The software asked for a burn $4.448$ times too small. No error, no warning, no unit anywhere in the code to object. And a $0.2\,\mathrm{m/s}$ burn looks perfectly normal on its own — it is the right size for a trajectory correction.

The only defense is to never let a bare number cross a unit boundary. Carry the unit in the variable's name (`impulse_lbf_s`) or, better, in its **[[type|typed-quantities]]**, so a pound-force value refuses to mix with a newton value until it is converted. Then test the conversion against a known reference value, instead of trusting a vendor's document to be unambiguous.
:::

::: key Frame and unit discipline
Name every vector for the frame it is expressed in ($\mathbf{r}_I$, $\mathbf{r}_B$) and every rotation for both frames it connects, source then destination ($\mathbf{C}_{B\leftarrow I}$), so that a composed or applied transformation's adjacent frame labels must agree — the way units cancel in a dimensional check. Frame errors preserve magnitude and produce plausible numbers that survive testing; only notation and types, checked by reading rather than by running, catch them reliably. Carry SI units throughout and write every unit conversion down explicitly at the boundary where it happens.
:::

## Check yourself

::: check
What does the subscript order in $\mathbf{C}_{B\leftarrow I}$ mean? What must be true of neighboring labels in a chain such as $\mathbf{C}_{C\leftarrow B}\,\mathbf{C}_{B\leftarrow I}$ for the chain to make sense?
:::

::: answer
$\mathbf{C}_{B\leftarrow I}$ turns the components of a vector expressed in frame $I$ into the components of the same physical vector expressed in frame $B$. Read it right to left: "from $I$, into $B$".

In a chain, the label on the right of one matrix must match the label on the left of the matrix (or vector) it multiplies. In $\mathbf{C}_{C\leftarrow B}\,\mathbf{C}_{B\leftarrow I}$ the inner $B$'s agree, so the product is $\mathbf{C}_{C\leftarrow I}$. If the inner labels differ, the product is not a real composed transformation, whatever numbers come out of it.
:::

::: check
In the gravity example, the correct and buggy body-frame vectors had identical length but were $26.7^\circ$ apart. Why does this kind of frame error — using the transpose of the rotation you needed — always keep the length?
:::

::: answer
A direction cosine matrix is **orthogonal**: $\mathbf{C}^\top\mathbf{C} = \mathbf{I}$, where $\mathbf{I}$ is the identity matrix. Its transpose is orthogonal too, because $(\mathbf{C}^\top)^\top\mathbf{C}^\top = \mathbf{C}\mathbf{C}^\top = \mathbf{I}$.

An orthogonal matrix keeps the length of any vector it multiplies. So using the wrong rotation still gives a vector of the correct length. Only the direction changes. That is exactly why a check that looks only at magnitude cannot catch this bug.
:::

::: check
Show that $\tfrac{d}{dt}\lVert q\rVert^2 = 0$ follows from $\dot q = \tfrac12\boldsymbol\Omega(\boldsymbol\omega)q$ whenever $\boldsymbol\Omega$ is skew-symmetric, without assuming anything else about $\boldsymbol\Omega$.
:::

::: answer
Start with $\tfrac{d}{dt}\lVert q\rVert^2 = 2q\cdot\dot q = 2q\cdot\tfrac12\boldsymbol\Omega q = q^\top\boldsymbol\Omega q$.

That is a single number, so it equals its own transpose: $q^\top\boldsymbol\Omega q = (q^\top\boldsymbol\Omega q)^\top = q^\top\boldsymbol\Omega^\top q$. Skew-symmetry says $\boldsymbol\Omega^\top = -\boldsymbol\Omega$, so this is $-q^\top\boldsymbol\Omega q$.

A number equal to its own negative is zero. So $q^\top\boldsymbol\Omega q = 0$ and $\tfrac{d}{dt}\lVert q\rVert^2 = 0$, for any skew-symmetric $\boldsymbol\Omega$ at any $\boldsymbol\omega$.
:::

::: check
The measured RK4 quaternion drift was $-1.085\times10^{-7}$ at step 1,000 and $-2.169\times10^{-6}$ at step 20,000 — close to a factor of 20 for 20 times the steps. What does that straight-line growth tell you? How should the drift at a fixed time, say $50\,\mathrm{s}$, change if the step size $h$ were halved?
:::

::: answer
Straight-line growth with the number of steps means a **secular** error: every step takes off nearly the same small amount, so after $N$ steps the total is about $N$ times one step's loss. It is the same signature the Numerical Methods module used to show that RK4's orbital energy drift was truncation error, not physics.

Now halve $h$. Each step's loss is about $\theta^6/72$ in $\lVert q\rVert^2$, and $\theta$ is proportional to $h$. Halving $h$ divides $\theta^6$ by $2^6 = 64$. But reaching the same time now takes twice as many steps. So the total drift falls by $64/2 = 32$.

That is one power of $h$ better than RK4's usual fourth-order global error ($2^4 = 16$), exactly as in the orbital case. The reason: the $\theta^2$ and $\theta^4$ terms of $\lvert R(i\theta)\rvert^2$ cancel, leaving $\theta^6$ as the first term.
:::

::: check
A teammate says: the quaternion drift here was only a few parts in a million after 1,000 seconds, so renormalizing is unnecessary overhead. What is wrong with using this number to reach that conclusion in general?
:::

::: answer
The number came from a best case: a perfectly constant $\boldsymbol\omega$ held for the whole test. That is exactly when the skew-symmetric analysis is exact and the drift is smallest.

A real vehicle's body rate changes during each step, is itself only approximately integrated, and jumps at events like staging. None of that makes the drift smaller. The drift is also secular, so its size depends on how long the mission is, and 1,000 s was not chosen to match any mission.

Renormalizing every step costs a handful of arithmetic operations and makes the question disappear, instead of forcing you to bound the drift for every mission profile.
:::

::: check
A vendor delivers a thruster's total impulse rating in pound-force seconds. Beyond "remember to convert", what one engineering practice would have prevented the Mars Climate Orbiter–style error in this lesson's example?
:::

::: answer
Carry the unit explicitly in the variable's name or type at the point the value enters the simulation, and test the conversion against a known reference value.

"Remember to convert" depends on a person noticing every single time. A value named `impulse_lbf_s`, or a typed quantity that refuses to combine with a newton-second value until it is converted, makes the missing conversion a visible mismatch where it is used. That is the same trick a mismatched frame subscript plays.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Vector naming | Subscript the frame a vector is expressed in | $\mathbf{r}_I$, $\mathbf{r}_B$ |
| Rotation naming | Source then destination, read right to left | $\mathbf{r}_B = \mathbf{C}_{B\leftarrow I}\mathbf{r}_I$ |
| Chains | Neighboring inner labels must match | $\mathbf{C}_{C\leftarrow B}\mathbf{C}_{B\leftarrow I} = \mathbf{C}_{C\leftarrow I}$ |
| Frame errors | Keep length exactly, change only direction | A magnitude check cannot catch them |
| Quaternion length, exact | $\boldsymbol\Omega$ is skew-symmetric | $\tfrac{d}{dt}\lVert q\rVert^2 = q^\top\boldsymbol\Omega q = 0$ |
| Quaternion length, RK4 | Secular shrinkage each step | $\lvert R(i\theta)\rvert^2 = 1-\theta^6/72+\cdots$, $\theta = (\lVert\boldsymbol\omega\rVert/2)h$ |
| The fix | Renormalize every step; a projection, and cheap | $q \leftarrow q/\lVert q\rVert$ |
| Unit discipline | SI inside; every boundary conversion written and tested | lbf·s vs N·s is a factor of $4.448$ |

With the clock and the bookkeeping both in place, the next lesson turns to what actually pushes on the plant: the environment models — gravity, atmosphere, wind, magnetic field, sunlight — and every one of them needs this lesson's frame and unit discipline applied to it.

::: context what-a-frame-is One arrow, two sets of numbers
The arrow below does not move. Measured along the inertial axes ($x_I$, $y_I$), its components are about $(0.50, 0.87)$ times its length, because it points $60^\circ$ above $x_I$. The body axes are turned $30^\circ$, so the same arrow sits only $30^\circ$ above $x_B$, and its components are $(0.87, 0.50)$ times its length.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="80" y1="120" x2="185" y2="120" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="80" y1="120" x2="80" y2="15" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="190" y="124" font-size="12" fill="#6c7a93">x_I</text>
  <text x="70" y="13" font-size="12" fill="#6c7a93">y_I</text>
  <line x1="80" y1="120" x2="166.6" y2="70" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 3"/>
  <line x1="80" y1="120" x2="30" y2="33.4" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="170" y="68" font-size="12" fill="#1d6fd1">x_B</text>
  <text x="14" y="32" font-size="12" fill="#1d6fd1">y_B</text>
  <line x1="80" y1="120" x2="125" y2="42.1" stroke="#b4232c" stroke-width="3"/>
  <polygon points="125,42.1 115.3,49.6 124.8,55.1" fill="#b4232c"/>
  <text x="130" y="40" font-size="12" fill="#b4232c">same arrow</text>
  <text x="215" y="95" font-size="12" fill="#1f2a44">in I: (0.50, 0.87)</text>
  <text x="215" y="115" font-size="12" fill="#1d6fd1">in B: (0.87, 0.50)</text>
</svg>
```

A frame is a choice of measuring directions, nothing more. The subscript records the choice.
:::

::: context dcm-name Why "direction cosines"
Each entry of the matrix $\mathbf{C}_{B\leftarrow I}$ is the cosine of the angle between one body axis and one inertial axis. Row 1 holds the cosines between $x_B$ and each of $x_I$, $y_I$, $z_I$ — the "direction cosines" of $x_B$ — and so on for the other rows. So the rows of $\mathbf{C}_{B\leftarrow I}$ are the body axes written in inertial components, and its columns are the inertial axes written in body components. That is why one matrix and its transpose are the two directions of the same rotation.
:::

::: context labels-cancel Labels that snap together like dominoes
Treat each frame label like a domino end. A matrix $\mathbf{C}_{C\leftarrow B}$ has a $C$ end on the left and a $B$ end on the right. A vector $\mathbf{r}_I$ has one end, $I$. You may only place pieces next to each other where the touching ends match.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="20" width="100" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="20" x2="60" y2="60" stroke="#1f2a44" stroke-width="1"/>
  <text x="35" y="45" font-size="14" text-anchor="middle" fill="#1f2a44">C</text>
  <text x="85" y="45" font-size="14" text-anchor="middle" fill="#1d6fd1">B</text>
  <rect x="120" y="20" width="100" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="170" y1="20" x2="170" y2="60" stroke="#1f2a44" stroke-width="1"/>
  <text x="145" y="45" font-size="14" text-anchor="middle" fill="#1d6fd1">B</text>
  <text x="195" y="45" font-size="14" text-anchor="middle" fill="#f2b880">I</text>
  <rect x="230" y="20" width="50" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="255" y="45" font-size="14" text-anchor="middle" fill="#f2b880">I</text>
  <text x="115" y="80" font-size="12" text-anchor="middle" fill="#1d6fd1">match</text>
  <text x="225" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">match</text>
  <text x="300" y="45" font-size="13" fill="#1f2a44">= r_C</text>
  <text x="10" y="102" font-size="12" fill="#1f2a44">C(C←B) · C(B←I) · r_I : every join matches</text>
</svg>
```

The outer ends that are left over, $C$, name the result.
:::

::: context euler-321 Yaw, then pitch, then roll
A 3-2-1 Euler sequence builds an attitude from three turns done in order. First turn about the $z$ axis (axis 3): that is **yaw**, like a car steering left or right. Then turn about the new $y$ axis (axis 2): **pitch**, nose up or down. Then turn about the newest $x$ axis (axis 1): **roll**, a wing dipping. The order matters: yaw $30^\circ$ then pitch $15^\circ$ is not the same attitude as pitch $15^\circ$ then yaw $30^\circ$. In SciPy, the capital letters in `'ZYX'` mean each turn is about the already-turned axes.
:::

::: context transpose-undoes Why the transpose runs a rotation backward
For a rotation matrix, $\mathbf{C}^\top\mathbf{C} = \mathbf{I}$: multiplying by the transpose undoes the rotation. So $\mathbf{C}_{I\leftarrow B} = \mathbf{C}_{B\leftarrow I}^\top$. Libraries disagree about which of the two they hand you, and forgetting to transpose gives this:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="110" x2="172.8" y2="69" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="172.8,69 160.9,69.0 164.4,78.4" fill="#1d6fd1"/>
  <line x1="60" y1="110" x2="142.3" y2="22.7" stroke="#b4232c" stroke-width="3"/>
  <polygon points="142.3,22.7 131.4,27.5 138.7,34.4" fill="#b4232c"/>
  <path d="M 107 92.9 A 50 50 0 0 0 94.3 73.6" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="116" y="80" font-size="12" fill="#1f2a44">26.7°</text>
  <text x="180" y="72" font-size="12" fill="#1d6fd1">correct g_B</text>
  <text x="150" y="22" font-size="12" fill="#b4232c">missing .T</text>
  <text x="200" y="112" font-size="12" fill="#1f2a44">both 7.972 m/s²</text>
</svg>
```

Same length, different direction: exactly what a rotation-shaped mistake looks like.
:::

::: context skew-symmetric A matrix that is its own negative mirror
Flip a matrix across its main diagonal (top-left to bottom-right) and you get its transpose. A **skew-symmetric** matrix comes back as its own negative: the entry in row 1, column 2 is minus the entry in row 2, column 1, and every diagonal entry is zero (it must equal its own negative). Skew-symmetric matrices are the "pure turning" matrices. You met the $3\times3$ kind as the cross-product matrix $[\boldsymbol\omega\times]$; the quaternion's $4\times4$ $\boldsymbol\Omega$ is its bigger cousin.
:::

::: context double-cover Why the quaternion moves at half speed
A quaternion stores a turn by angle $\phi$ as $(\cos\tfrac{\phi}{2}, \sin\tfrac{\phi}{2}\,\hat{\mathbf{n}})$, where $\hat{\mathbf{n}}$ is the turning axis. The half angle is built in. Turn the body a full $360^\circ$ and the quaternion only goes halfway round, to $-q$. It takes $720^\circ$ to bring $q$ back to where it started. So $q$ and $-q$ describe the same attitude — two quaternions "cover" each rotation — and a body spinning at $\boldsymbol\omega$ drives $q$ at $\boldsymbol\omega/2$. That is where the $\tfrac12$ in $\dot q = \tfrac12 q\otimes\boldsymbol\omega$ comes from.
:::

::: context secular-word Where "secular" comes from
The Latin *saeculum* means an age or a lifetime. Astronomers borrowed it for changes that build up steadily over ages, like the slow turning of a planet's orbit, as opposed to *periodic* changes that swing back and forth and average out. A secular error in a simulation is one that keeps growing in the same direction, step after step, and never cancels. That is why it matters over a long run even when one step's share is tiny.
:::

::: context mars-climate-orbiter What happened to Mars Climate Orbiter
NASA's Mars Climate Orbiter was lost on September 23, 1999, as it arrived at Mars. Through the nine-month cruise, small thruster firings nudged its path. Ground software reported those firings' impulse in pound-force seconds; the navigation software that used them expected newton-seconds. Every firing was undercounted by a factor of about $4.45$. The error built up, and the spacecraft reached Mars far lower than planned — deep enough in the atmosphere to be destroyed. Nothing crashed in the software along the way. Every number looked like a reasonable number.
:::

::: context typed-quantities Letting the compiler check units
Many languages have libraries that attach a unit to a number as part of its type — in C++ a typed-units library, in Python a package such as `pint`. Adding a length to a time then fails at compile time or with an error, instead of producing a number. The same idea works for frames: a vector type that carries its frame as part of the type makes $\mathbf{C}_{I\leftarrow B}\,\mathbf{g}_I$ a compile error. You will meet this again when the flight software itself is compiled into the simulation.
:::
