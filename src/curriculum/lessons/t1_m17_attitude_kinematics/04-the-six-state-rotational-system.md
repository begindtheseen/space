---
id: l04-the-six-state-rotational-system
title: Coupling kinematics to Euler dynamics — the rotational 6-state
minutes: 22
covers:
  - combining kinematics with Euler dynamics into a 6-state rotational system
---

Think of a spinning top on a table. If someone tells you how fast it is spinning at every instant, you can work out which way it faces — that was the first three lessons of this module. But a real top is not told how fast to spin. Its spin rate changes because of how its mass is spread out and because of the pushes it feels. The rate changes the way it faces, and the way it faces can change the pushes. Everything feeds into everything else.

So far in this module the angular velocity $\boldsymbol{\omega}$ ("omega", how fast and about which axis the body turns) has been an **input**: a number a gyro reports, or a test case hands you. That is the right model when you are tracking a measured attitude. It is the wrong model when you are simulating a vehicle. In a simulation nothing hands you the rate. Torques act on the inertia. The inertia turns them into angular acceleration. The acceleration changes the rate, and the rate changes the attitude. Closing that loop joins two separate equations into one **coupled** system — a system where each part feeds the other. That system is the rotational **[[plant|plant-word]]** every attitude controller is designed against.

This lesson builds it. You will also learn the checks that tell you whether your code is right. Those checks matter more than they look. Attitude code has a special talent for being wrong in ways that look correct. A sign error in the kinematics can leave the energy exactly conserved, the size of the angular momentum exactly conserved and the quaternion exactly unit length — while the vehicle rotates the wrong way. Exactly one standard test catches it, and this is where you learn to run it.

## The coupled system

Here are the two equations, written together for the first time:

$$
\begin{aligned}
\dot{\mathbf{q}} &= \tfrac{1}{2}\,\boldsymbol{\Omega}(\boldsymbol{\omega})\,\mathbf{q}, \\
\mathbf{I}\dot{\boldsymbol{\omega}} &= \mathbf{M} - \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) .
\end{aligned}
$$

The first line is the quaternion kinematics of lesson 1. Read it as "q dot equals one half big-Omega of omega times q". It says how the attitude quaternion $\mathbf{q}$ changes, given the rate.

The second line is **Euler's rotational equation** from the rigid-body module. It says how the rate changes, given the torque. The symbols:

- $\mathbf{I}$ is the **inertia tensor** — the $3\times 3$ matrix that says how hard the body is to spin about each axis — taken about the center of mass and written in body axes;
- $\mathbf{M}$ is the external torque, in the same body axes;
- $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ is the **[[gyroscopic term|gyroscopic-term]]**. It carries all the coupling between the three axes: spin about one axis can push the rate about another.

In **principal axes**, where the inertia matrix is diagonal, $\mathbf{I} = \mathrm{diag}(I_1, I_2, I_3)$, the second line splits into three:

$$
\begin{aligned}
I_1\dot{\omega}_1 &= (I_2 - I_3)\,\omega_2\omega_3 + M_1, \\
I_2\dot{\omega}_2 &= (I_3 - I_1)\,\omega_3\omega_1 + M_2, \\
I_3\dot{\omega}_3 &= (I_1 - I_2)\,\omega_1\omega_2 + M_3 .
\end{aligned}
$$

Now stack everything into one tall column. Call it the **state** $\mathbf{y}$ — the list of numbers that, together, fully describe the motion right now: $\mathbf{y} = [\,\mathbf{q}\ \ \boldsymbol{\omega}\,]^\top$. The whole rotational plant becomes one equation, $\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y})$, with

$$
\mathbf{f}(t,\mathbf{y}) = \begin{bmatrix}\tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q}\\[4pt] \mathbf{I}^{-1}\bigl(\mathbf{M}(t,\mathbf{q},\boldsymbol{\omega}) - \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}\bigr)\end{bmatrix}.
$$

That is a first-order **ordinary differential equation** (ODE): a rule that gives the rate of change of every state number from the current state. Any integrator from lessons 2 and 3 can step it forward.

::: key The rotational 6-state
$\dot{\mathbf{q}} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q}$ and $\dot{\boldsymbol{\omega}} = \mathbf{I}^{-1}(\mathbf{M} - \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})$, integrated together. Three attitude degrees of freedom plus three rates; a quaternion implementation carries seven numbers and one constraint, an MRP implementation exactly six and none.
:::

### Six states, seven numbers

The name needs a word of explanation, because the array in your code has seven entries.

A **degree of freedom** is one independent way the system can change. The rotating body has six: three to say where it points, three to say how fast it turns. The quaternion spends four numbers on three degrees of freedom. It makes up the difference with one rule, the **unit-norm constraint** $\lVert\mathbf{q}\rVert = 1$. So the motion lives on a [[six-dimensional surface inside a seven-dimensional space|surface-inside]].

Store the attitude as **modified Rodrigues parameters** (MRPs, lesson 1) instead, and the array is six long with no rule to maintain. The price is the shadow-set switch. Either way the physics is six-dimensional. When engineers say "rotational 6-DOF" or "the 6-state attitude model", they mean this system. Save "full 6-DOF" for the twelve-state problem that adds position and velocity.

### One-way and two-way coupling

Look at which variables appear where. The kinematic half depends on $\boldsymbol{\omega}$, and on $\mathbf{q}$ only as the thing being multiplied. The dynamic half depends on $\boldsymbol{\omega}$ always, and on $\mathbf{q}$ only through the torque.

Now suppose $\mathbf{M} = \mathbf{0}$, or any torque that depends only on time. Then the rate equation contains no $\mathbf{q}$ at all. The system is **[[block-triangular|one-way-street]]**: information flows one way, from the rates to the attitude, never back. Euler's equations can be solved on their own, and the attitude is added up from the result afterwards. A bug in the kinematics cannot touch the rates. That is why the torque-free case is such a clean test, and why every new propagator should start there.

Add a torque that depends on attitude and the loop closes. Gravity gradient depends on where "down" sits in body axes. Aerodynamic torque depends on the angle to the oncoming air. Any feedback controller depends on the attitude error. Now the system is fully coupled and **nonlinear** (doubling a cause no longer doubles the effect), and only the conservation laws that survive the new torque remain as checks.

## Building the derivative function

The code is short. The only decisions are where the unit-norm constraint gets repaired and what gets recorded. Here `skew(v)` builds the cross-product matrix $[\mathbf{v}\times]$, `omega_matrix` builds $\boldsymbol{\Omega}(\boldsymbol{\omega})$, and `dcm(q)` builds the inertial-to-body rotation matrix $\mathbf{C}$ from a scalar-first quaternion.

```python
import numpy as np

def skew(v):
    return np.array([[0.0, -v[2], v[1]],
                     [v[2], 0.0, -v[0]],
                     [-v[1], v[0], 0.0]])

def omega_matrix(w):
    wx, wy, wz = w
    return np.array([[0.0, -wx, -wy, -wz],
                     [wx, 0.0, wz, -wy],
                     [wy, -wz, 0.0, wx],
                     [wz, wy, -wx, 0.0]])

def dcm(q):
    """Inertial-to-body matrix C from a scalar-first unit quaternion."""
    q0, qv = q[0], q[1:]
    return (q0 * q0 - qv @ qv) * np.eye(3) + 2 * np.outer(qv, qv) - 2 * q0 * skew(qv)

def deriv(y, I, torque):
    """y = [q(4), omega(3)]; I holds the principal moments; torque is in body axes."""
    q, w = y[:4], y[4:]
    return np.concatenate([0.5 * omega_matrix(w) @ q,
                           (torque - np.cross(w, I * w)) / I])

I = np.array([900.0, 1200.0, 1500.0])                  # kg m^2
y = np.array([1.0, 0.0, 0.0, 0.0, 0.05, 0.02, -0.03])  # identity attitude, rad/s
tau = np.zeros(3)
dt = 0.01

H_N0 = dcm(y[:4]).T @ (I * y[4:])          # inertial-frame angular momentum
E0 = 0.5 * y[4:] @ (I * y[4:])
worst_norm = worst_HN = worst_E = 0.0
for _ in range(100000):                    # 1000 s
    k1 = deriv(y, I, tau)
    k2 = deriv(y + 0.5 * dt * k1, I, tau)
    k3 = deriv(y + 0.5 * dt * k2, I, tau)
    k4 = deriv(y + dt * k3, I, tau)
    y = y + dt / 6.0 * (k1 + 2 * k2 + 2 * k3 + k4)
    worst_norm = max(worst_norm, abs(np.linalg.norm(y[:4]) - 1.0))
    y[:4] /= np.linalg.norm(y[:4])
    worst_HN = max(worst_HN, np.linalg.norm(dcm(y[:4]).T @ (I * y[4:]) - H_N0))
    worst_E = max(worst_E, abs(0.5 * y[4:] @ (I * y[4:]) / E0 - 1.0))

print(f"|H_N0| = {np.linalg.norm(H_N0):.4f} N m s,  E0 = {E0:.4f} J")
print(f"worst |q| - 1        = {worst_norm:.3e}")
print(f"worst |H_N - H_N0|   = {worst_HN:.3e} N m s")
print(f"worst relative E err = {worst_E:.3e}")
# |H_N0| = 68.0147 N m s,  E0 = 2.0400 J
# worst |q| - 1        = 3.331e-16
# worst |H_N - H_N0|   = 2.093e-12 N m s
# worst relative E err = 2.576e-14
```

Notice what is *not* inside the derivative function: no renormalization, no shadow switch, no logging. The right-hand side is a pure function of the state — same input, same output, no side effects. That is what the integrator's accuracy was derived assuming. The housekeeping happens between steps.

## Four checks, and only one of them is decisive

Picture a figure skater spinning on smooth ice. Nothing outside twists her, so certain totals cannot change, however she moves her arms. A torque-free spacecraft is the same. With $\mathbf{M} = \mathbf{0}$ it keeps three physical quantities fixed, and the code keeps one numerical one. Each is a **conservation check**: compute it at the start, compute it again later, and they must agree.

**The quaternion norm** stays at 1. This one is numerical, not physical — the subject of the previous two lessons.

**The rotational kinetic energy** $E = \tfrac{1}{2}\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega}$ stays constant. To see why, dot Euler's equation with $\boldsymbol{\omega}$. The piece $\boldsymbol{\omega}\cdot(\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})$ is zero, because a cross product is [[perpendicular to both of its vectors|triple-product]], including $\boldsymbol{\omega}$ itself. What is left is $\boldsymbol{\omega}\cdot\mathbf{I}\dot{\boldsymbol{\omega}} = \dot{E} = \boldsymbol{\omega}\cdot\mathbf{M}$. No torque, no change.

**The size of the angular momentum** $\lVert\mathbf{H}\rVert$, with $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$, stays constant. Dot Euler's equation with $\mathbf{H}$ instead. The same kind of piece vanishes, and $\tfrac{d}{dt}\tfrac{1}{2}\lVert\mathbf{H}\rVert^2 = \mathbf{H}\cdot\mathbf{M}$.

**The angular momentum written in the inertial frame** stays constant *as a vector* — every component, not only the length:

$$
\mathbf{H}_N = \mathbf{C}^\top\,(\mathbf{I}\boldsymbol{\omega}) = \mathbf{C}_{NB}\,\mathbf{H}_B .
$$

Here $\mathbf{H}_B$ is the momentum in body axes, and $\mathbf{C}^\top = \mathbf{C}_{NB}$ ("C, N from B") turns body components into inertial ones.

Now the decisive point. The first three checks never touch the kinematics. Energy and $\lVert\mathbf{H}\rVert$ come from Euler's equation alone, which in the torque-free case does not know $\mathbf{q}$ exists. The norm check looks at $\mathbf{q}$ without asking what it means. Flip the sign of $\boldsymbol{\omega}$ in the kinematic equation, or transpose $\mathbf{C}$ where you should not, and all three still pass exactly.

Only $\mathbf{H}_N$ uses both halves at once, and only its *direction* is sensitive. $\mathbf{C}$ is **orthonormal** — a pure rotation — so $\lVert\mathbf{H}_N\rVert = \lVert\mathbf{H}_B\rVert$ [[no matter how wrong the matrix is|rotation-keeps-length]]. Checking the magnitude in the inertial frame is the same blind test written out at greater length.

::: key The single best test of a rotational propagator
With no external torque, $\mathbf{H}_N = \mathbf{C}^\top(\mathbf{I}\boldsymbol{\omega})$ must be constant **as a vector**, to integrator tolerance. It is the only one of the standard checks that exercises the kinematics and the dynamics together. Energy, $\lVert\mathbf{H}\rVert$ and the quaternion norm all pass with a sign error in the kinematics.
:::

::: example A tumbling bus, and what the checks report
An Earth-observing satellite **bus** — the spacecraft body that carries the instruments — separates from its launcher with a leftover tumble. Its principal inertias are $\mathbf{I} = \mathrm{diag}(900,\, 1200,\, 1500)\,\mathrm{kg\,m^2}$. Its rate is $\boldsymbol{\omega}_0 = (0.05,\, 0.02,\, -0.03)\,\mathrm{rad/s}$.

**How fast is it tumbling?** The size of the rate is $\sqrt{0.05^2 + 0.02^2 + 0.03^2} = 0.0616\,\mathrm{rad/s}$. In degrees that is $0.0616 \times 57.3 = 3.53^\circ/\mathrm{s}$. One full turn takes $2\pi/0.0616 = 102\,\mathrm{s}$.

**The invariants.** Multiply each rate by its inertia: $\mathbf{H}_B = \mathbf{I}\boldsymbol{\omega}_0 = (900 \times 0.05,\ 1200 \times 0.02,\ 1500 \times (-0.03)) = (45,\, 24,\, -45)\,\mathrm{N\,m\,s}$. Its length is $\sqrt{45^2 + 24^2 + 45^2} = 68.01\,\mathrm{N\,m\,s}$. The energy is half of $\boldsymbol{\omega}\cdot\mathbf{H}$:

$$
E = \tfrac{1}{2}\bigl(45 \times 0.05 + 24 \times 0.02 + (-45)(-0.03)\bigr) = \tfrac{1}{2}(2.25 + 0.48 + 1.35) = 2.04\,\mathrm{J}.
$$

**A prediction before running anything.** Divide: $2E/\lVert\mathbf{H}\rVert^2 = 4.08/68.01^2 = 8.82\times 10^{-4}\,\mathrm{kg^{-1}m^{-2}}$. This sits between $1/I_2 = 8.33\times 10^{-4}$ and $1/I_1 = 1.111\times 10^{-3}$. (The third check question shows why that placement matters.) It says the rate vector, seen from the body, circles the minimum-inertia axis, axis 1. The simulation agrees: $\omega_1$ never changes sign, staying between $0.0316$ and $0.0526\,\mathrm{rad/s}$, while $\omega_2$ and $\omega_3$ swing through zero. One full loop of that swing — the **[[polhode|polhode-loop]]** period — takes $479\,\mathrm{s}$.

**What the checks report.** Run RK4 at $\Delta t = 0.01\,\mathrm{s}$ for $10^5$ steps. That is 1000 seconds, about ten tumble revolutions. The code above reports:

- worst quaternion norm error before each renormalization: $3.3\times 10^{-16}$;
- worst relative energy error: $2.6\times 10^{-14}$;
- worst inertial momentum error: $2.09\times 10^{-12}\,\mathrm{N\,m\,s}$, which is $2.09\times 10^{-12}/68.01 = 3.1\times 10^{-14}$ of $\lVert\mathbf{H}\rVert$.

**Sanity check.** Every number sits at the level of [[round-off, not truncation|roundoff-truncation]]. With $\theta = \lVert\boldsymbol{\omega}\rVert\Delta t/2 = 0.0616 \times 0.01/2 = 3.08\times 10^{-4}$, lesson 3's formula predicts an RK4 norm drift over $N = 10^5$ steps of $N\theta^6/144 = 6\times 10^{-19}$ — far below what is measured. So the measured errors are rounding noise, as they should be. Run the same case with renormalization removed entirely and the norm stays within $5.6\times 10^{-15}$ of 1, comfortably inside a $10^{-12}$ requirement. At these slow rates renormalization is insurance, not necessity. At launch-vehicle rates it stops being optional.
:::

::: example The sign error that passes three checks
Take the same bus and the same code, and make one change. Write the kinematics as $\dot{\mathbf{q}} = \tfrac{1}{2}\boldsymbol{\Omega}(-\boldsymbol{\omega})\mathbf{q}$. This is the mistake you make when the [[quaternion you inherited|quaternion-conventions]] means body-to-inertial rather than inertial-to-body. Nothing else changes.

**Check by check.** The quaternion norm behaves the same way, with a worst error of $2.2\times 10^{-16}$. The energy is identical to fourteen digits. $\lVert\mathbf{H}_B\rVert$ is identical, because the dynamics never saw the change. Three checks, three passes — and the vehicle is rotating backwards.

**The fourth check fails at once.** After 10 seconds, a tenth of one tumble, the computed $\mathbf{H}_N$ has already swung $16.3^\circ$ away from where it started. The error vector $\lVert\mathbf{H}_N - \mathbf{H}_N(0)\rVert$ has reached $19.3\,\mathrm{N\,m\,s}$. By 60 seconds the swing is $43.6^\circ$ and the error is $50.5\,\mathrm{N\,m\,s}$ — three quarters of the whole momentum.

**Sanity check.** Two arrows of length $68.01$ with $43.6^\circ$ between them are $2 \times 68.01 \times \sin(21.8^\circ) = 50.5$ apart, which matches. Meanwhile $\lVert\mathbf{H}_N\rVert$ has not moved by so much as a bit, because a rotation matrix keeps lengths whether or not it is the right rotation.

Ten seconds of simulation and one line of comparison find a bug that a magnitude check would never find at all.
:::

## Choosing the step

A rigid body has no **stiff** modes — no very fast motions hiding beside slow ones — so a fixed-step explicit method such as RK4 is the natural choice. Size the step against the fastest timescale in the motion, which is the shortest of:

- the body rotation period, $2\pi/\lVert\boldsymbol{\omega}\rVert_{\max}$ — 102 s for the bus above, under a second for a spinning upper stage;
- the polhode period, over which the rate vector circles in body axes — 479 s here, and close to the rotation period for a strongly lopsided body;
- any timescale set by the torque model: a control loop's speed, a structural wobble, or how fast an actuator command changes.

A good rule is at least 100 steps per shortest period for engineering accuracy, and 1000 for a validation run. At $\Delta t = 0.01\,\mathrm{s}$ the bus gets $102/0.01 \approx 10^4$ steps per revolution, which is why its errors sit at round-off. In practice the control-loop rate usually decides the step before the dynamics do.

::: warning Do not conclude "momentum conserved" from a magnitude
$\lVert\mathbf{H}\rVert$ is conserved by the dynamics half on its own. Reporting it as a check of the coupled propagator proves only that Euler's equation was typed correctly. The same goes for a length computed in the inertial frame, because rotating a vector cannot change its length. Compare the inertial vector component by component against its starting value, and report the largest difference.
:::

::: warning Every check assumes the model you are checking
Energy is conserved only for a torque-free rigid body. Add a control torque and $\dot{E} = \boldsymbol{\omega}\cdot\mathbf{M}$ is no longer zero. Add a reaction wheel and the body's own momentum is no longer the total. Let propellant slosh and neither energy nor rigid-body momentum means anything. The checks stay valuable — in general $\mathbf{H}_N$ changes at exactly the rate $\mathbf{M}_N$, the torque in inertial axes, so over time it changes by $\int\mathbf{M}_N\,dt$ — but you must update them along with the model. A check you forgot to update is worse than no check.
:::

::: note Where the 6-state goes next
**Linearize** this system — replace it with its straight-line version for small motions about a chosen attitude and rate — and you get the plant that classical attitude control design uses. It is a **double integrator** per axis (torque sets acceleration, which adds up to rate, which adds up to angle), plus the gyroscopic cross-coupling, plus whatever the actuators add. Keep it nonlinear and it is the simulation you check that design against. Both start from the seven lines of the derivative function above.
:::

## Check yourself

::: check
For a torque-free body, argue from the equations that a bug in the quaternion kinematics cannot change the propagated body rates at all. What does that tell you about the order to debug in?
:::

::: answer
With $\mathbf{M} = \mathbf{0}$ the rate equation is $\dot{\boldsymbol{\omega}} = -\mathbf{I}^{-1}(\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})$. There is no $\mathbf{q}$ anywhere in it. The system is block-triangular: the $\boldsymbol{\omega}$ half runs on its own, and the $\mathbf{q}$ half only reads from it. So any error in the kinematic half leaves the rate history bit-for-bit identical.

For debugging, that means you can and should check in two stages. First run torque-free and check energy and $\lVert\mathbf{H}\rVert$. These test the dynamics alone; if they fail, the kinematics is not the suspect. Only when the dynamics is clean does the inertial momentum vector test mean something — and at that point it tests the kinematics and the quaternion-to-DCM conversion, since those are the only ingredients left. Debugging the two halves separately is far faster than staring at a coupled failure.
:::

::: check
A propagator holds $\mathbf{H}_N$ constant to $10^{-12}$ with zero torque. You add a constant body-axis torque $\mathbf{M} = (0.01, 0, 0)\,\mathrm{N\,m}$. What replaces the conservation check, and what would you assert?
:::

::: answer
In general $\dot{\mathbf{H}}_N = \mathbf{M}_N = \mathbf{C}^\top\mathbf{M}_B$: inertial momentum changes at the rate of the torque written in inertial axes. A torque that is constant in *body* axes is not constant in inertial axes, because the body is turning. So the assertion is an integral:

$$
\mathbf{H}_N(t) - \mathbf{H}_N(0) = \int_0^{t}\mathbf{C}(\tau)^\top\mathbf{M}_B\,d\tau .
$$

Add up that integral with the same integrator and the same step as the state, so the comparison is not spoiled by a cruder sum. Then assert that the gap between the propagated $\mathbf{H}_N$ and the integral stays at integrator tolerance.

Energy gets the matching treatment: $\dot{E} = \boldsymbol{\omega}\cdot\mathbf{M}$, so add up $\int\boldsymbol{\omega}\cdot\mathbf{M}\,dt$ alongside and compare. Both checks keep their power to find bugs. They stop being conservation laws and become **balance equations**: change equals what was put in.
:::

::: check
The bus of the worked example has $2E/\lVert\mathbf{H}\rVert^2 = 8.82\times 10^{-4}$. Show why that number must lie between $1/I_3$ and $1/I_1$, and say what its position tells you.
:::

::: answer
In principal axes, $2E = \sum I_k\omega_k^2$ and $\lVert\mathbf{H}\rVert^2 = \sum I_k^2\omega_k^2$. Write $h_k = I_k\omega_k$ for each momentum component. Then $I_k\omega_k^2 = h_k^2/I_k$, so $2E = \sum h_k^2/I_k$ and $\lVert\mathbf{H}\rVert^2 = \sum h_k^2$. Divide:

$$
\frac{2E}{\lVert\mathbf{H}\rVert^2} = \frac{\sum h_k^2/I_k}{\sum h_k^2}.
$$

This is a **weighted average** of the three numbers $1/I_k$, with weights $h_k^2/\sum h_j^2$ that are never negative and add up to one. An average always lies between the smallest and largest of the things averaged. So the ratio is between $1/I_3$ (largest moment, smallest reciprocal) and $1/I_1$.

Its position says which axis the motion circles. Here $1/I_3 = 6.67\times 10^{-4}$, $1/I_2 = 8.33\times 10^{-4}$ and $1/I_1 = 1.111\times 10^{-3}$. The ratio $8.82\times 10^{-4}$ falls between $1/I_2$ and $1/I_1$, toward the small-moment end, so the body-frame rate vector loops around the minimum-inertia axis. Equality with $1/I_1$ or $1/I_3$ would mean a pure spin about that axis. Equality with $1/I_2$ is the **separatrix** — the dividing path through the unstable intermediate axis.
:::

::: check
Your simulation renormalizes the quaternion inside the derivative function — it divides $\mathbf{q}$ by its norm before using it, on every call — and never touches the stored state. The torque-free energy and $\lVert\mathbf{H}\rVert$ checks pass perfectly. Is anything wrong?
:::

::: answer
Yes, though not what you might first fear. The accuracy is fine. The function $\tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\,\mathbf{q}/\lVert\mathbf{q}\rVert$ is smooth, and on the unit sphere it equals the true right-hand side, so RK4 stays fourth order. (Halving the step still cuts the attitude error by 16 or more.)

What is wrong is that the renormalization does nothing useful. The stored quaternion is never repaired, so its norm drifts exactly as if there were no renormalization at all. Anything that reads the state directly — the DCM builder, a filter, telemetry — gets a quaternion that slowly stops being unit length, and a DCM that stretches vectors by $\lVert\mathbf{q}\rVert^2$. It also costs a square root on every stage.

The energy and $\lVert\mathbf{H}\rVert$ checks cannot see any of this, because they depend only on $\boldsymbol{\omega}$, and nothing done to $\mathbf{q}$ reaches the rate half. A norm check on the stored state catches it at once. The fix is to move the renormalization out of the derivative and apply it to the state after each complete step, as the code in this lesson does.
:::

::: check
Write the rotational 6-state using modified Rodrigues parameters instead of a quaternion, and say what changes in the propagator loop.
:::

::: answer
The state becomes $\mathbf{y} = [\boldsymbol{\sigma}\ \ \boldsymbol{\omega}]^\top$ — six numbers — with

$$
\dot{\boldsymbol{\sigma}} = \tfrac{1}{4}\bigl[(1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})\mathbf{I}_3 + 2[\boldsymbol{\sigma}\times] + 2\boldsymbol{\sigma}\boldsymbol{\sigma}^\top\bigr]\boldsymbol{\omega},
\qquad
\dot{\boldsymbol{\omega}} = \mathbf{I}^{-1}\bigl(\mathbf{M} - \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}\bigr).
$$

The dynamics half is unchanged.

In the loop, the renormalization disappears, because there is no constraint. In its place goes a test after each completed step: if $\boldsymbol{\sigma}^\top\boldsymbol{\sigma} > 1$, set $\boldsymbol{\sigma} \leftarrow -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$. Unlike a renormalization this is a real jump in the state, so anything that remembers values across steps must be told.

The conservation checks are the same three physical ones, with the DCM for $\mathbf{H}_N$ now built from $\boldsymbol{\sigma}$. The MRP derivative takes more arithmetic per call than the quaternion's matrix–vector product. That is the usual reason propagators keep the quaternion and use MRPs only where the control law wants them.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{y} = [\mathbf{q}\ \ \boldsymbol{\omega}]^\top$ | The rotational state; six degrees of freedom, seven stored numbers |
| $\dot{\mathbf{q}} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q}$ | Kinematic half; reads $\boldsymbol{\omega}$, writes attitude |
| $\dot{\boldsymbol{\omega}} = \mathbf{I}^{-1}(\mathbf{M} - \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})$ | Dynamic half; free of $\mathbf{q}$ unless the torque depends on attitude |
| $E = \tfrac{1}{2}\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega}$, $\dot{E} = \boldsymbol{\omega}\cdot\mathbf{M}$ | Energy check; tests the dynamics only |
| $\lVert\mathbf{H}\rVert$, $\tfrac{d}{dt}\tfrac{1}{2}\lVert\mathbf{H}\rVert^2 = \mathbf{H}\cdot\mathbf{M}$ | Momentum-size check; tests the dynamics only |
| $\mathbf{H}_N = \mathbf{C}^\top\mathbf{I}\boldsymbol{\omega}$ constant as a vector | The decisive check; the only one that exercises the kinematics |
| $2E/\lVert\mathbf{H}\rVert^2$ | Weighted average of $1/I_k$; says which axis the polhode circles |
| Bus example | $\mathbf{I} = \mathrm{diag}(900,1200,1500)$, $\boldsymbol{\omega}_0 = (0.05, 0.02, -0.03)$: $\lVert\mathbf{H}\rVert = 68.0\,\mathrm{N\,m\,s}$, $E = 2.04\,\mathrm{J}$ |
| RK4 at $10\,\mathrm{ms}$, $10^5$ steps | Norm $3\times 10^{-16}$, energy $3\times 10^{-14}$, $\mathbf{H}_N$ to $2\times 10^{-12}\,\mathrm{N\,m\,s}$ |
| Sign error in kinematics | Passes norm, energy and $\lVert\mathbf{H}\rVert$; $\mathbf{H}_N$ swings $16^\circ$ in 10 s |
| Renormalize | Between steps, on the stored state — never inside the derivative |

The next lesson fills in $\mathbf{M}$. Gravity gradient, air drag, sunlight pressure and a leftover magnetic dipole are the four torques that act on a spacecraft whether or not anyone commands them. Their sizes decide how much momentum the attitude control system must soak up every orbit.

::: context plant-word Why engineers call it a "plant"
In control engineering the **plant** is the thing being controlled — here, the spinning spacecraft — as opposed to the controller that commands it. The word comes from the early days of the field in industrial process control, where the thing being regulated really was a plant: a boiler, a chemical works, a power station. The name stuck. A flight dynamics engineer will say "the plant model" to mean exactly the equations in this lesson, and "the controller" for the software that computes $\mathbf{M}$.
:::

::: context gyroscopic-term Where the cross product comes from
Euler's equation is Newton's law for spin, $\dot{\mathbf{H}} = \mathbf{M}$, but written in axes glued to the body. Those axes turn. So even if $\mathbf{H}$ is fixed in space, its *components* along the turning axes keep changing, and the equation must account for it. The **transport theorem** from the rotating-frames module does the bookkeeping: the rate seen in the body frame plus $\boldsymbol{\omega}\times\mathbf{H}$ equals the true rate. That extra $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ is why a spinning object can wobble and tumble with no torque at all.
:::

::: context surface-inside Fewer freedoms than numbers
A point on a circle is a good small example. You can store it as two numbers, $(x, y)$, but it only has one freedom — the angle around the circle — because the rule $x^2 + y^2 = 1$ ties the two together.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="90" x2="190" y2="90" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="110" y1="160" x2="110" y2="15" stroke="#6c7a93" stroke-width="1.2"/>
  <circle cx="110" cy="90" r="60" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="110" y1="90" x2="152.43" y2="47.57" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="152.43" cy="47.57" r="5" fill="#b4232c"/>
  <line x1="152.43" y1="47.57" x2="152.43" y2="90" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="4 3"/>
  <text x="160" y="42" font-size="12" fill="#b4232c">(x, y)</text>
  <text x="196" y="94" font-size="12" fill="#1f2a44">x</text>
  <text x="104" y="12" font-size="12" fill="#1f2a44">y</text>
  <text x="212" y="60" font-size="12" fill="#1f2a44">2 stored numbers</text>
  <text x="212" y="80" font-size="12" fill="#1d6fd1">1 rule: x² + y² = 1</text>
  <text x="212" y="100" font-size="12" fill="#1f2a44">1 freedom: the angle</text>
</svg>
```

A unit quaternion is the same idea one size up: four numbers, one rule, three freedoms. Add the three rates and you get seven numbers, one rule, six freedoms.
:::

::: context one-way-street The rates drive the attitude, not the other way
With no torque, the arrows only point one way. The rates feed the attitude; nothing flows back. A torque that depends on attitude — gravity gradient, a controller — adds the dashed return path and closes the loop.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="40" width="120" height="50" rx="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">rates ω</text>
  <text x="80" y="79" font-size="11" text-anchor="middle" fill="#1f2a44">Euler's equation</text>
  <rect x="220" y="40" width="120" height="50" rx="8" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">attitude q</text>
  <text x="280" y="79" font-size="11" text-anchor="middle" fill="#1f2a44">kinematics</text>
  <line x1="140" y1="65" x2="210" y2="65" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="220,65 208,59 208,71" fill="#1f2a44"/>
  <path d="M280,90 C280,135 80,135 80,100" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <polygon points="80,90 74,102 86,102" fill="#b4232c"/>
  <text x="180" y="146" font-size="11" text-anchor="middle" fill="#b4232c">only through a torque M(q)</text>
  <text x="180" y="28" font-size="11" text-anchor="middle" fill="#1f2a44">always</text>
</svg>
```
:::

::: context triple-product Why the energy piece is zero
The cross product $\mathbf{a}\times\mathbf{b}$ always points at right angles to both $\mathbf{a}$ and $\mathbf{b}$. A dot product between two perpendicular vectors is zero. So $\boldsymbol{\omega}\cdot(\boldsymbol{\omega}\times\mathbf{v})$ is zero for any $\mathbf{v}$ — the gyroscopic term can steer the rate around but can never pump energy in or out. The same argument with $\mathbf{H}$ in place of $\boldsymbol{\omega}$ shows it cannot change the length of $\mathbf{H}$ either.
:::

::: context rotation-keeps-length A rotation cannot change a length
Turn an arrow about its tail and its tip slides around a circle. The arrow points somewhere new, but its length never changes. Every rotation matrix does exactly this, whether it is the right rotation or a wrong one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="120" r="90" fill="none" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <line x1="120" y1="120" x2="197.94" y2="75" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="197.94,75 184.4,76.6 190.4,87" fill="#1d6fd1"/>
  <line x1="120" y1="120" x2="120" y2="30" stroke="#b4232c" stroke-width="3"/>
  <polygon points="120,30 114,43 126,43" fill="#b4232c"/>
  <circle cx="120" cy="120" r="3" fill="#1f2a44"/>
  <text x="202" y="72" font-size="12" fill="#1d6fd1">right H_N</text>
  <text x="128" y="36" font-size="12" fill="#b4232c">wrong H_N</text>
  <text x="228" y="115" font-size="12" fill="#1f2a44">same length:</text>
  <text x="228" y="132" font-size="12" fill="#1f2a44">only the direction</text>
  <text x="228" y="149" font-size="12" fill="#1f2a44">gives the bug away</text>
</svg>
```

That is why the inertial check must compare the vector, component by component, and not its length.
:::

::: context polhode-loop The path the spin axis traces
Seen from inside the body, the rate vector of a tumbling object does not stay put. Its tip traces a closed loop called the **polhode** (Greek for "pole path"), which you met in the rigid-body module. For the bus the loop goes around axis 1, the axis of least inertia, once every $479\,\mathrm{s}$. Loops around the smallest or largest axis are stable; a path through the middle axis is the dividing line between the two families.
:::

::: context roundoff-truncation Two kinds of numerical error
**Truncation error** comes from the method: RK4 uses a clever average of four slopes instead of the exact curve, and the leftover shrinks as the step shrinks. **Round-off error** comes from the computer: a double-precision number keeps only about 16 significant digits, so each operation loses a little in the last place. Truncation is predictable and has a formula. Round-off looks like random noise near $10^{-16}$ per step. When a measured error is far above the truncation formula but near $10^{-16}$ times the number of steps, you are seeing round-off.
:::

::: context quaternion-conventions The same four numbers, two meanings
There are two widespread quaternion conventions. One (often called Hamilton) and another (often called JPL, after NASA's Jet Propulsion Laboratory) differ in the order of multiplication and in which frame the rotation goes from. A quaternion copied from a library, a paper or another team can mean the rotation you expect or its reverse, and nothing in the four numbers tells you which. Engineers write the convention next to every quaternion interface for exactly this reason — and run the inertial momentum check.
:::
