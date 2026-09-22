---
id: l04-the-six-state-rotational-system
title: Coupling kinematics to Euler dynamics — the rotational 6-state
minutes: 18
covers:
  - combining kinematics with Euler dynamics into a 6-state rotational system
---

So far $\boldsymbol{\omega}$ has been an input: something a gyro reports or a test case specifies. That is the right model when you are propagating a measured attitude, and it is the wrong model when you are simulating a vehicle. In a simulation nothing hands you the rate. Torques act on the inertia, the inertia produces angular acceleration, the acceleration changes the rate, and the rate changes the attitude. Closing that loop turns two separate equations into one coupled system, and that system is the rotational plant every attitude controller is designed against.

This lesson builds it. The result is a first-order ordinary differential equation for a state with three attitude degrees of freedom and three rate components — the rotational 6-state — together with the conservation laws that tell you whether your implementation is right. Those conservation checks matter more than they might appear. Attitude code has a special talent for being wrong in ways that look correct: a sign error in the kinematics leaves the energy exactly conserved, the angular momentum magnitude exactly conserved and the quaternion exactly unit, while the vehicle rotates the wrong way. There is precisely one test that catches it, and this lesson is where you learn to run it.

## The coupled system

Two equations, written together for the first time:

$$
\begin{aligned}
\dot{\mathbf{q}} &= \tfrac{1}{2}\,\boldsymbol{\Omega}(\boldsymbol{\omega})\,\mathbf{q}, \\
\mathbf{I}\dot{\boldsymbol{\omega}} &= \mathbf{M} - \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega}) .
\end{aligned}
$$

The first is the quaternion kinematics of lesson 1. The second is Euler's rotational equation, with $\mathbf{I}$ the inertia tensor about the centre of mass expressed in body axes, $\mathbf{M}$ the external torque in the same axes, and the gyroscopic term $\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}$ carrying all of the coupling between axes. In principal axes, where $\mathbf{I} = \mathrm{diag}(I_1, I_2, I_3)$, the second line reads

$$
\begin{aligned}
I_1\dot{\omega}_1 &= (I_2 - I_3)\,\omega_2\omega_3 + M_1, \\
I_2\dot{\omega}_2 &= (I_3 - I_1)\,\omega_3\omega_1 + M_2, \\
I_3\dot{\omega}_3 &= (I_1 - I_2)\,\omega_1\omega_2 + M_3 .
\end{aligned}
$$

Stack them. Writing $\mathbf{y} = [\,\mathbf{q}\ \ \boldsymbol{\omega}\,]^\top$, the whole rotational plant is $\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y})$ with

$$
\mathbf{f}(t,\mathbf{y}) = \begin{bmatrix}\tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q}\\[4pt] \mathbf{I}^{-1}\bigl(\mathbf{M}(t,\mathbf{q},\boldsymbol{\omega}) - \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}\bigr)\end{bmatrix}.
$$

::: key The rotational 6-state
$\dot{\mathbf{q}} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q}$ and $\dot{\boldsymbol{\omega}} = \mathbf{I}^{-1}(\mathbf{M} - \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})$, integrated together. Three attitude degrees of freedom plus three rates; a quaternion implementation carries seven numbers and one constraint, an MRP implementation exactly six and none.
:::

### Six states, seven numbers

The name deserves a note, because the array in your code has seven entries. The *system* has six degrees of freedom: three to say where the body is pointing and three to say how fast it is turning. The quaternion spends four numbers on three degrees of freedom and makes up the difference with the unit-norm constraint, so the trajectory lives on a six-dimensional surface inside a seven-dimensional space. Propagate with modified Rodrigues parameters instead and the array is genuinely six long with nothing to maintain, at the price of the shadow-set switch. Either way the physics is six-dimensional, and when someone says "rotational 6-DOF" or "the 6-state attitude model" they mean this system. Reserve "full 6-DOF" for the twelve-state problem that adds position and velocity.

### One-way and two-way coupling

Look at which variables appear where. The kinematic block depends on $\boldsymbol{\omega}$ but never on $\mathbf{q}$ beyond the linear factor. The dynamic block depends on $\boldsymbol{\omega}$ always, and on $\mathbf{q}$ only through the torque.

With $\mathbf{M} = \mathbf{0}$ — or any torque that is a pure function of time — the system is block-triangular. Euler's equations solve on their own, and the attitude is an integral of the result. You can integrate the rates first and the attitude afterwards, and a bug in the kinematics cannot affect the rates at all. That is why the torque-free case is such a clean test article, and why it is where you should start every new propagator.

Add a torque that depends on attitude and the triangle closes. Gravity gradient depends on where nadir sits in body axes; aerodynamic torque depends on the angle of attack; any feedback controller depends on the attitude error. The system becomes fully coupled and nonlinear, and only the conservation laws that survive the added torque remain as checks.

## Building the derivative function

The implementation is short. The only decisions are where the constraint gets repaired and what gets recorded.

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

Note what is *not* in the derivative function: no re-normalisation, no shadow switch, no logging. The right-hand side is a pure function of the state, which is what the integrator was derived assuming, and the housekeeping happens between steps.

## Four checks, and only one of them is decisive

With $\mathbf{M} = \mathbf{0}$ the torque-free system conserves three physical quantities and one numerical one.

**The quaternion norm** stays at 1. Numerical, not physical — the subject of the previous two lessons.

**Rotational kinetic energy** $E = \tfrac{1}{2}\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega}$ is constant. Dot Euler's equation with $\boldsymbol{\omega}$: the triple product $\boldsymbol{\omega}\cdot(\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})$ vanishes because it repeats a vector, leaving $\boldsymbol{\omega}\cdot\mathbf{I}\dot{\boldsymbol{\omega}} = \dot{E} = \boldsymbol{\omega}\cdot\mathbf{M}$.

**The magnitude of angular momentum** $\lVert\mathbf{H}\rVert$ with $\mathbf{H} = \mathbf{I}\boldsymbol{\omega}$ is constant. Dot Euler's equation with $\mathbf{H}$ instead: the same triple product vanishes and $\tfrac{d}{dt}\tfrac{1}{2}\lVert\mathbf{H}\rVert^2 = \mathbf{H}\cdot\mathbf{M}$.

**Angular momentum expressed in the inertial frame** is constant *as a vector*:

$$
\mathbf{H}_N = \mathbf{C}^\top\,(\mathbf{I}\boldsymbol{\omega}) = \mathbf{C}_{NB}\,\mathbf{H}_B .
$$

Here is the decisive point. The first three checks never touch the kinematics. Energy and $\lVert\mathbf{H}\rVert$ come out of Euler's equation alone, which in the torque-free case does not know that $\mathbf{q}$ exists; the norm check looks at $\mathbf{q}$ without asking what it means. Reverse the sign of $\boldsymbol{\omega}$ in the kinematic equation, or transpose $\mathbf{C}$ where you should not, and all three still pass exactly. Only $\mathbf{H}_N$ involves both blocks at once, and only its *direction* is sensitive: since $\mathbf{C}$ is orthonormal, $\lVert\mathbf{H}_N\rVert = \lVert\mathbf{H}_B\rVert$ no matter how wrong $\mathbf{C}$ is. Checking the magnitude in the inertial frame is the same blind test written out in a longer form.

::: key The single best test of a rotational propagator
With no external torque, $\mathbf{H}_N = \mathbf{C}^\top(\mathbf{I}\boldsymbol{\omega})$ must be constant **as a vector**, to integrator tolerance. It is the only one of the standard checks that exercises the kinematics and the dynamics together. Energy, $\lVert\mathbf{H}\rVert$ and the quaternion norm all pass with a sign error in the kinematics.
:::

::: example A tumbling bus, and what the checks report
An Earth-observing bus separates from its dispenser with a residual tumble. Its principal inertias are $\mathbf{I} = \mathrm{diag}(900,\, 1200,\, 1500)\,\mathrm{kg\,m^2}$ and its rate is $\boldsymbol{\omega}_0 = (0.05,\, 0.02,\, -0.03)\,\mathrm{rad/s}$, a magnitude of $0.0616\,\mathrm{rad/s} = 3.53^\circ/\mathrm{s}$ — a revolution every 102 seconds.

The invariants: $\mathbf{H}_B = \mathbf{I}\boldsymbol{\omega}_0 = (45,\, 24,\, -45)\,\mathrm{N\,m\,s}$, so $\lVert\mathbf{H}\rVert = 68.01\,\mathrm{N\,m\,s}$, and $E = \tfrac{1}{2}(45 \times 0.05 + 24 \times 0.02 + (-45)(-0.03)) = 2.04\,\mathrm{J}$.

The ratio $2E/\lVert\mathbf{H}\rVert^2 = 8.82\times 10^{-4}\,\mathrm{kg^{-1}m^{-2}}$ sits between $1/I_2 = 8.33\times 10^{-4}$ and $1/I_1 = 1.111\times 10^{-3}$, which tells you before running anything that the body-frame rate vector circles the minimum-inertia axis. The simulation confirms it: $\omega_1$ never changes sign, oscillating between $0.0316$ and $0.0526\,\mathrm{rad/s}$, while $\omega_2$ and $\omega_3$ swing through zero with a period of $479\,\mathrm{s}$.

Running RK4 at $\Delta t = 0.01\,\mathrm{s}$ for $10^5$ steps — 1000 seconds, ten tumble revolutions — the code above reports a worst quaternion norm error of $3.3\times 10^{-16}$ before each re-normalisation, a worst relative energy error of $2.6\times 10^{-14}$, and a worst inertial momentum error of $2.09\times 10^{-12}\,\mathrm{N\,m\,s}$, which is $3.1\times 10^{-14}$ of $\lVert\mathbf{H}\rVert$. Every number is at the level of accumulated round-off, not truncation: with $\theta = \lVert\boldsymbol{\omega}\rVert\Delta t/2 = 3.08\times 10^{-4}$, RK4's predicted norm drift over $10^5$ steps is $N\theta^6/144 = 6\times 10^{-19}$, far below what is measured. Run the same case with the re-normalisation removed entirely and the norm stays within $5.6\times 10^{-15}$ of 1 — comfortably inside a $10^{-12}$ requirement. At these rates re-normalisation is insurance, not necessity; at launch-vehicle rates it stops being optional.
:::

::: example The sign error that passes three checks
Take the same bus and the same code, and make one change: write the kinematics as $\dot{\mathbf{q}} = \tfrac{1}{2}\boldsymbol{\Omega}(-\boldsymbol{\omega})\mathbf{q}$, the mistake you make when the quaternion you inherited represents body-to-inertial rather than inertial-to-body. Nothing else changes.

The quaternion norm behaves the same way, with a worst error of $2.2\times 10^{-16}$. The energy is identical to fourteen digits. $\lVert\mathbf{H}_B\rVert$ is identical, because the dynamics never saw the change. Three checks, three passes, and the vehicle is rotating backwards.

The fourth check fails immediately. After 10 seconds — a tenth of one tumble revolution — the computed $\mathbf{H}_N$ has already swung $16.3^\circ$ away from where it started, and $\lVert\mathbf{H}_N - \mathbf{H}_N(0)\rVert$ has reached $19.3\,\mathrm{N\,m\,s}$. By 60 seconds the swing is $43.6^\circ$ and the error vector is $58.1\,\mathrm{N\,m\,s}$, most of the momentum itself. Note that $\lVert\mathbf{H}_N\rVert$ has not moved by so much as a bit throughout, because an orthonormal matrix preserves length whether or not it is the right orthonormal matrix.

Ten seconds of simulation and one line of comparison finds a bug that a magnitude check would never have found at all.
:::

## Choosing the step

A rigid body has no stiff modes, so a fixed-step explicit method is the natural choice and RK4 is the standard one. Size the step against the fastest timescale in the motion, which is the largest of:

- the body rotation period, $2\pi/\lVert\boldsymbol{\omega}\rVert_{\max}$ — 102 s for the bus above, under a second for a spinning upper stage;
- the polhode period, over which the rate vector circles in body axes — 479 s here, and comparable to the rotation period for a strongly asymmetric body;
- any timescale imposed by the torque model: a control loop's bandwidth, a structural mode, or the rate at which an actuator command changes.

A rule that serves well is 100 or more steps per shortest period for engineering accuracy and 1000 for a validation run. At $\Delta t = 0.01\,\mathrm{s}$ the bus gets $10^4$ steps per revolution, which is why its errors sit at round-off. In practice the control-loop rate usually decides the step before the dynamics do.

::: warning Do not conclude "momentum conserved" from a magnitude
$\lVert\mathbf{H}\rVert$ is conserved by the dynamics block on its own, so reporting it as a check of the coupled propagator proves only that Euler's equation was implemented correctly. The same is true of a norm computed in the inertial frame, because rotating a vector cannot change its length. Compare the inertial vector component by component, against its initial value, and report the largest deviation.
:::

::: warning Every check assumes the model you are checking
Energy is conserved only for a torque-free rigid body. Add a control torque and $\dot{E} = \boldsymbol{\omega}\cdot\mathbf{M}$ is non-zero; add a reaction wheel and the body's own momentum is no longer the total; let propellant slosh and neither energy nor rigid-body momentum means anything. The checks remain valuable — the correct generalisation is that $\mathbf{H}_N$ changes at exactly the rate $\int\mathbf{M}_N\,dt$ — but you have to update them alongside the model, and a check you forgot to update is worse than no check.
:::

::: note Where the 6-state goes next
Linearise this system about a nominal attitude and rate and you get the plant that classical attitude control design uses: a double integrator per axis, plus the gyroscopic cross-coupling terms, plus whatever the actuator dynamics add. Keep it nonlinear and it is the simulation you verify that design against. Both start from the seven lines of the derivative function above.
:::

## Check yourself

::: check
For a torque-free body, argue from the equations that a bug in the quaternion kinematics cannot change the propagated body rates at all. What does that imply about debugging order?
:::

::: answer
With $\mathbf{M} = \mathbf{0}$ the rate equation is $\dot{\boldsymbol{\omega}} = -\mathbf{I}^{-1}(\boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})$, which contains no $\mathbf{q}$. The system is block-triangular: the $\boldsymbol{\omega}$ block is closed, and the $\mathbf{q}$ block reads from it. So any error in the kinematic half leaves the rate history bit-for-bit identical.

For debugging, that means you can and should validate in two stages. First run torque-free and check energy and $\lVert\mathbf{H}\rVert$ — these test the dynamics alone, and if they fail the kinematics is not the suspect. Only when the dynamics is clean does the inertial momentum vector test become meaningful, and at that point it tests the kinematics and the quaternion-to-DCM conversion, since those are the only remaining ingredients. Debugging the two halves separately is far faster than staring at a coupled failure.
:::

::: check
A propagator carries $\mathbf{H}_N$ constant to $10^{-12}$ with zero torque. You add a constant body-axis torque $\mathbf{M} = (0.01, 0, 0)\,\mathrm{N\,m}$. What replaces the conservation check, and what would you assert?
:::

::: answer
The general statement is $\dot{\mathbf{H}}_N = \mathbf{M}_N = \mathbf{C}^\top\mathbf{M}_B$: inertial momentum changes at the rate of the torque expressed in inertial axes. A constant *body-axis* torque is not a constant inertial torque, because the body is turning, so the assertion is an integral:

$$
\mathbf{H}_N(t) - \mathbf{H}_N(0) = \int_0^{t}\mathbf{C}(\tau)^\top\mathbf{M}_B\,d\tau ,
$$

accumulated with the same integrator and the same step as the state, so that the comparison is not limited by a cruder quadrature. Assert that the difference between the propagated $\mathbf{H}_N$ and that integral stays at integrator tolerance.

Energy gets the matching treatment: $\dot{E} = \boldsymbol{\omega}\cdot\mathbf{M}$, so accumulate $\int\boldsymbol{\omega}\cdot\mathbf{M}\,dt$ alongside and compare. Both checks keep their diagnostic power; they stop being conservation laws and become balance equations.
:::

::: check
The bus of the worked example has $2E/\lVert\mathbf{H}\rVert^2 = 8.82\times 10^{-4}$. Show why that number must lie between $1/I_3$ and $1/I_1$, and what it tells you.
:::

::: answer
In principal axes $2E = \sum I_k\omega_k^2$ and $\lVert\mathbf{H}\rVert^2 = \sum I_k^2\omega_k^2$. Write $h_k = I_k\omega_k$, so $2E = \sum h_k^2/I_k$ and $\lVert\mathbf{H}\rVert^2 = \sum h_k^2$. Then

$$
\frac{2E}{\lVert\mathbf{H}\rVert^2} = \frac{\sum h_k^2/I_k}{\sum h_k^2},
$$

a weighted average of the three numbers $1/I_k$ with non-negative weights summing to one. An average lies between the smallest and largest of the values averaged, so the ratio is between $1/I_3$ (largest moment, smallest reciprocal) and $1/I_1$.

Its position says which axis the motion circles. Here $1/I_3 = 6.67\times 10^{-4}$, $1/I_2 = 8.33\times 10^{-4}$, $1/I_1 = 1.111\times 10^{-3}$, and the ratio $8.82\times 10^{-4}$ falls between $1/I_2$ and $1/I_1$, so the weight sits toward the small-moment end and the body-frame rate vector loops around the minimum-inertia axis. Equality with $1/I_1$ or $1/I_3$ would mean a pure spin about that axis; equality with $1/I_2$ is the separatrix through the unstable intermediate axis.
:::

::: check
Your simulation re-normalises the quaternion inside the derivative function, once per call. The torque-free energy and $\lVert\mathbf{H}\rVert$ checks still pass perfectly. Is anything wrong?
:::

::: answer
Yes, and the passing checks are exactly why it goes unnoticed. Re-normalising inside $\mathbf{f}(t,\mathbf{y})$ means the integrator is no longer applied to the differential equation you wrote down; each stage evaluates a different, non-smooth function, and the RK4 order conditions no longer hold, so the attitude accuracy silently degrades toward first or second order. The energy and $\lVert\mathbf{H}\rVert$ checks cannot see it because they depend only on $\boldsymbol{\omega}$, and the rate block is untouched by anything done to $\mathbf{q}$.

The inertial momentum vector check would see it, as a slow drift that scales with the wrong power of the step. The diagnosis is the step-halving test: if the attitude error falls by 4 rather than 16, the method is not behaving as fourth order. The fix is to move the re-normalisation out of the derivative and apply it to the state after the complete step.
:::

::: check
Write the rotational 6-state using modified Rodrigues parameters instead of a quaternion, and say what changes in the propagator loop.
:::

::: answer
The state becomes $\mathbf{y} = [\boldsymbol{\sigma}\ \ \boldsymbol{\omega}]^\top$, six numbers, with

$$
\dot{\boldsymbol{\sigma}} = \tfrac{1}{4}\bigl[(1 - \boldsymbol{\sigma}^\top\boldsymbol{\sigma})\mathbf{I}_3 + 2[\boldsymbol{\sigma}\times] + 2\boldsymbol{\sigma}\boldsymbol{\sigma}^\top\bigr]\boldsymbol{\omega},
\qquad
\dot{\boldsymbol{\omega}} = \mathbf{I}^{-1}\bigl(\mathbf{M} - \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega}\bigr),
$$

and the dynamics half is unchanged.

In the loop, the re-normalisation disappears — there is no constraint — and is replaced by a test after each completed step: if $\boldsymbol{\sigma}^\top\boldsymbol{\sigma} > 1$, set $\boldsymbol{\sigma} \leftarrow -\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$. Unlike a re-normalisation this is a genuine jump in the state, so anything with memory across steps must be told. The conservation checks are the same three physical ones, with the DCM for $\mathbf{H}_N$ now built from $\boldsymbol{\sigma}$. The derivative is more arithmetic per call than the quaternion's matrix–vector product, which is the usual reason propagators keep the quaternion and use MRPs only where the control law wants them.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{y} = [\mathbf{q}\ \ \boldsymbol{\omega}]^\top$ | The rotational state; six degrees of freedom, seven stored numbers |
| $\dot{\mathbf{q}} = \tfrac{1}{2}\boldsymbol{\Omega}(\boldsymbol{\omega})\mathbf{q}$ | Kinematic half; reads $\boldsymbol{\omega}$, writes attitude |
| $\dot{\boldsymbol{\omega}} = \mathbf{I}^{-1}(\mathbf{M} - \boldsymbol{\omega}\times\mathbf{I}\boldsymbol{\omega})$ | Dynamic half; independent of $\mathbf{q}$ unless the torque is attitude-dependent |
| $E = \tfrac{1}{2}\boldsymbol{\omega}^\top\mathbf{I}\boldsymbol{\omega}$, $\dot{E} = \boldsymbol{\omega}\cdot\mathbf{M}$ | Energy check; tests the dynamics only |
| $\lVert\mathbf{H}\rVert$, $\tfrac{d}{dt}\tfrac{1}{2}\lVert\mathbf{H}\rVert^2 = \mathbf{H}\cdot\mathbf{M}$ | Momentum magnitude check; tests the dynamics only |
| $\mathbf{H}_N = \mathbf{C}^\top\mathbf{I}\boldsymbol{\omega}$ constant as a vector | The decisive check; the only one that exercises the kinematics |
| $2E/\lVert\mathbf{H}\rVert^2$ | Weighted average of $1/I_k$; says which axis the polhode encircles |
| Bus example | $\mathbf{I} = \mathrm{diag}(900,1200,1500)$, $\boldsymbol{\omega}_0 = (0.05, 0.02, -0.03)$: $\lVert\mathbf{H}\rVert = 68.0\,\mathrm{N\,m\,s}$, $E = 2.04\,\mathrm{J}$ |
| RK4 at $10\,\mathrm{ms}$, $10^5$ steps | Norm $3\times 10^{-16}$, energy $3\times 10^{-14}$, $\mathbf{H}_N$ to $2\times 10^{-12}\,\mathrm{N\,m\,s}$ |
| Sign error in kinematics | Passes norm, energy and $\lVert\mathbf{H}\rVert$; $\mathbf{H}_N$ swings $16^\circ$ in 10 s |

The next lesson fills in $\mathbf{M}$. Gravity gradient, aerodynamic drag, solar radiation pressure and a residual magnetic dipole are the four torques that act on a spacecraft whether or not anyone commands them, and their magnitudes decide how much momentum the attitude control system has to absorb every orbit.
