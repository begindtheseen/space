---
id: l06-reaction-wheels-cmgs-and-momentum-coupling
title: Reaction wheels, CMGs and momentum coupling
minutes: 22
covers:
  - reaction wheel and CMG dynamics and momentum coupling
---

A thruster changes a spacecraft's angular momentum. A reaction wheel does not: it moves momentum from the body into a spinning rotor and back, and the total stays exactly where it was. That single distinction — external torque against internal momentum exchange — changes the equations of motion, changes what a simulation should be checked against, and sets the fundamental limit on what a wheel-controlled vehicle can do.

The practical consequences follow directly. A wheel-controlled spacecraft can point anywhere and hold there indefinitely without spending propellant, which is why almost every science and imaging satellite uses wheels. It cannot absorb a net external torque forever, because the momentum has to go somewhere and the rotor has a speed limit, which is why every such spacecraft also carries magnetorquers or thrusters to dump momentum. And it has to carry the wheel momentum in its own equations of motion, because a spinning rotor inside a turning body produces gyroscopic torque exactly as a spinning body does.

This lesson derives the body equation with wheels, gives you the one test that catches the bookkeeping errors, and then covers control moment gyros, which use the same physics in a way that produces hundreds of times more torque per kilogram at the cost of a geometry problem that has occupied the field for fifty years.

## The body equation with wheels

Let $\mathbf{I}$ be the inertia tensor of the whole vehicle — structure plus wheels — about the centre of mass, with the wheels treated as locked to the body. Let $\mathbf{h}_w$ be the total angular momentum the wheels carry *relative to the body*, mapped into body axes: for $n$ wheels with rotor inertias $J_i$ about spin axes $\hat{\mathbf{a}}_i$ turning at relative rates $\Omega_i$,

$$
\mathbf{h}_w = \sum_{i=1}^{n} J_i\,\Omega_i\,\hat{\mathbf{a}}_i .
$$

The total angular momentum of the system, in body components, is then $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w$. Newton's law says its inertial derivative equals the external torque, and the transport theorem moves that derivative into the body frame:

$$
\left.\frac{d\mathbf{H}}{dt}\right|_N = \dot{\mathbf{H}} + \boldsymbol{\omega}\times\mathbf{H} = \mathbf{M}_{ext}.
$$

Substitute and split the body derivative:

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{\mathbf{h}}_w + \boldsymbol{\omega}\times\bigl(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w\bigr) = \mathbf{M}_{ext},
$$

and move the wheel term across:

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times\bigl(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w\bigr) = \mathbf{M}_{ext} - \dot{\mathbf{h}}_w .
$$

::: key Body equation with reaction wheels
$\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w) = \mathbf{M}_{ext} - \dot{\mathbf{h}}_w$, with $\mathbf{h}_w$ the total wheel momentum mapped into body axes. The wheel torque appears with a **minus** sign because it is a reaction: torquing a wheel up torques the body down. Each wheel obeys $J_i\dot{\Omega}_i = u_i$, the motor torque.
:::

Two terms, two distinct pieces of physics, and both are routinely lost.

$-\dot{\mathbf{h}}_w$ is the **reaction torque**. It is the whole point of a wheel: the motor pushes on the rotor and the rotor pushes back on the stator, which is bolted to the spacecraft. Commanding $+0.05\,\mathrm{N\,m}$ onto the wheel applies $-0.05\,\mathrm{N\,m}$ to the body. Drop this term and the wheels spin up while the vehicle sits motionless.

$\boldsymbol{\omega}\times\mathbf{h}_w$ is the **gyroscopic coupling from stored momentum**. A vehicle carrying $10\,\mathrm{N\,m\,s}$ of wheel momentum and rotating at $0.01\,\mathrm{rad/s}$ about a perpendicular axis feels $0.1\,\mathrm{N\,m}$ of torque about the third axis — more than the wheel motors can produce. Drop this term and the simulation still slews beautifully and still conserves the body-frame momentum magnitude, while the vehicle's inertial momentum walks away. This is the subtle one.

### The wheel side

Each wheel is a one-degree-of-freedom rigid body:

$$
J_i\,\dot{\Omega}_i = u_i - u_{f,i},
$$

with $u_i$ the commanded motor torque and $u_{f,i}$ bearing and drag friction. Friction is internal: it transfers momentum from wheel to body and dissipates energy, but it cannot change the system total. Three orthogonal wheels give $\mathbf{h}_w = (J_1\Omega_1, J_2\Omega_2, J_3\Omega_3)$ and $\dot{\mathbf{h}}_w = \mathbf{u}$ directly. Four wheels in a pyramid or tetrahedron give a $3\times 4$ distribution matrix $\mathbf{A}$ with $\mathbf{h}_w = \mathbf{A}\,\mathbf{J}\boldsymbol{\Omega}$, one redundant degree of freedom, and a null-space direction you can use to keep wheels away from zero speed where the friction is worst.

Typical hardware: rotor inertia $0.005$ to $0.1\,\mathrm{kg\,m^2}$, maximum speed $4000$ to $6000\,\mathrm{rpm}$, so momentum capacity $0.1$ to $50\,\mathrm{N\,m\,s}$, and motor torque $0.005$ to $0.3\,\mathrm{N\,m}$. Momentum capacity sizes the mission against disturbances; torque capacity sizes the slew rate.

## The momentum audit

With $\mathbf{M}_{ext} = \mathbf{0}$, the total angular momentum expressed in the **inertial** frame,

$$
\mathbf{H}_N = \mathbf{C}^\top\bigl(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w\bigr),
$$

must be constant as a vector. That is the single best test of a reaction-wheel simulation, and it is worth being precise about why the obvious alternatives fail.

The **body-frame magnitude** $\lVert\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w\rVert$ is constant for the correct model, but it is also constant under a sign error in the kinematics, because the kinematics does not enter it at all. Worse, it stays nearly constant under a wrong gyroscopic term, which perturbs it only at second order.

The **body-frame vector** $\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w$ is *not* constant even when everything is right, because the body frame is rotating underneath a fixed inertial vector. Comparing it against its initial value produces a large apparent drift in a perfectly correct simulation — a false alarm that has cost many afternoons.

::: key The momentum audit
With no external torque, assert that $\mathbf{H}_N = \mathbf{C}^\top(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w)$ is constant **as a vector in the inertial frame**. A body-frame magnitude passes even with a sign error in the kinematics; a body-frame vector fails even when the model is right. Mixing the two is itself one of the classic bugs.
:::

```python
import numpy as np

def skew(v):
    return np.array([[0.0, -v[2], v[1]], [v[2], 0.0, -v[0]], [-v[1], v[0], 0.0]])

def omega_matrix(w):
    wx, wy, wz = w
    return np.array([[0.0, -wx, -wy, -wz], [wx, 0.0, wz, -wy],
                     [wy, -wz, 0.0, wx], [wz, wy, -wx, 0.0]])

def dcm(q):
    q0, qv = q[0], q[1:]
    return (q0 * q0 - qv @ qv) * np.eye(3) + 2 * np.outer(qv, qv) - 2 * q0 * skew(qv)

def wheel_deriv(y, I, Jw, u, ext):
    """y = [q(4), omega(3), wheel_speeds(3)]; wheels along the body axes.
    I wdot + w x (I w + h_w) = ext - u,   Jw * Omega_dot = u."""
    q, w, Ow = y[:4], y[4:7], y[7:]
    h_w = Jw * Ow
    wdot = (ext - u - np.cross(w, I * w + h_w)) / I
    return np.concatenate([0.5 * omega_matrix(w) @ q, wdot, u / Jw])

def total_inertial_momentum(y, I, Jw):
    return dcm(y[:4]).T @ (I * y[4:7] + Jw * y[7:])

I = np.array([900.0, 1200.0, 1500.0])
Jw = 0.02
wn, zeta = 0.01, 0.7
Kp, Kd = 2 * I * wn**2, 2 * zeta * wn * I

axis = np.array([1.0, 1.0, 1.0]) / np.sqrt(3.0)
half = np.radians(30.0) / 2
y = np.concatenate([[np.cos(half)], np.sin(half) * axis, np.zeros(6)])

def command(y):
    """PD on the quaternion error toward the identity attitude; returns wheel torque."""
    q, w = y[:4], y[4:7]
    eps = np.sign(q[0]) * q[1:]
    return Kp * eps + Kd * w          # = -(desired body torque)

dt, ext = 0.05, np.zeros(3)
H0 = total_inertial_momentum(y, I, Jw)
worst, peak_h, peak_u = 0.0, 0.0, 0.0
for _ in range(24000):                # 1200 s
    u = command(y)
    k1 = wheel_deriv(y, I, Jw, u, ext)
    k2 = wheel_deriv(y + 0.5 * dt * k1, I, Jw, u, ext)
    k3 = wheel_deriv(y + 0.5 * dt * k2, I, Jw, u, ext)
    k4 = wheel_deriv(y + dt * k3, I, Jw, u, ext)
    y = y + dt / 6.0 * (k1 + 2 * k2 + 2 * k3 + k4)
    y[:4] /= np.linalg.norm(y[:4])
    worst = max(worst, np.linalg.norm(total_inertial_momentum(y, I, Jw) - H0))
    peak_h = max(peak_h, np.max(np.abs(Jw * y[7:])))
    peak_u = max(peak_u, np.max(np.abs(u)))

err = 2 * np.degrees(np.arctan2(np.linalg.norm(y[1:4]), abs(y[0])))
print(f"final attitude error = {err:.4f} deg")
print(f"peak wheel momentum  = {peak_h:.4f} N m s  ({peak_h / Jw * 60 / (2 * np.pi):.0f} rpm)")
print(f"peak wheel torque    = {peak_u:.4f} N m")
print(f"worst |H_N - H_N0|   = {worst:.3e} N m s")
# final attitude error = 0.0007 deg
# peak wheel momentum  = 2.0678 N m s  (987 rpm)
# peak wheel torque    = 0.0448 N m
# worst |H_N - H_N0|   = 8.826e-15 N m s
```

::: example A 30-degree slew, and where the momentum goes
The bus of the previous lessons, $\mathbf{I} = \mathrm{diag}(900, 1200, 1500)\,\mathrm{kg\,m^2}$, carries three orthogonal wheels with $J_w = 0.02\,\mathrm{kg\,m^2}$ each. It starts $30^\circ$ away from its target attitude, about the axis $(1,1,1)/\sqrt{3}$, at rest, with the wheels at rest.

The control law is proportional–derivative on the quaternion error, $\mathbf{T}_c = -K_p\,\mathrm{sgn}(\delta q_0)\,\delta\mathbf{q}_v - K_d\boldsymbol{\omega}$, with per-axis gains chosen for a natural frequency $\omega_n = 0.01\,\mathrm{rad/s}$ and damping $\zeta = 0.7$: linearising $\delta\mathbf{q}_v \approx \delta\boldsymbol{\theta}/2$ gives $K_p = 2I_k\omega_n^2$ and $K_d = 2\zeta\omega_n I_k$, so $K_p = (0.18, 0.24, 0.30)$ and $K_d = (12.6, 16.8, 21.0)$. The wheel torque command is $\mathbf{u} = -\mathbf{T}_c$.

Running it for 1200 s with RK4 at $\Delta t = 0.05\,\mathrm{s}$: the peak commanded wheel torque is $0.0448\,\mathrm{N\,m}$, the peak body rate $0.079^\circ/\mathrm{s}$, and the attitude error falls below $1^\circ$ at $t = 303\,\mathrm{s}$, below $0.1^\circ$ at $327\,\mathrm{s}$ and below $0.01^\circ$ at $330\,\mathrm{s}$.

The momentum story is the interesting part. The peak wheel momentum on any one axis is $2.07\,\mathrm{N\,m\,s}$, which at $J_w = 0.02\,\mathrm{kg\,m^2}$ is $103\,\mathrm{rad/s}$ or $987\,\mathrm{rpm}$. Every newton-metre-second the body picks up comes out of a wheel and goes back into it: the total $\mathbf{H}_N$ starts at zero and stays at zero, to $8.8\times 10^{-15}\,\mathrm{N\,m\,s}$ over the whole run. Nothing external acted, so nothing could change, and the simulation agrees.

Note how little is needed. A $2\,\mathrm{N\,m\,s}$ excursion and a $0.045\,\mathrm{N\,m}$ motor slew half a tonne of spacecraft through $30^\circ$ — at a leisurely five minutes, because the gains were chosen to stay inside the actuators.
:::

::: example Two bugs, and which check finds them
Now start the same vehicle with a momentum bias: wheel speeds $(200, -150, 300)\,\mathrm{rad/s}$, so $\mathbf{h}_w = (4, -3, 6)\,\mathrm{N\,m\,s}$, plus a small body rate $(0.002, -0.003, 0.001)\,\mathrm{rad/s}$. The total is $\lVert\mathbf{H}\rVert = 11.55\,\mathrm{N\,m\,s}$, and the bias makes $\boldsymbol{\omega}\times\mathbf{h}_w$ non-zero, which the previous example's on-axis slew did not.

**Correct model.** $\mathbf{H}_N$ holds constant to $2.2\times 10^{-13}\,\mathrm{N\,m\,s}$, two parts in $10^{14}$. The body-frame magnitude $\lVert\mathbf{H}_B\rVert$ holds to $5.5\times 10^{-14}$. The body-frame *vector* moves by up to $6.08\,\mathrm{N\,m\,s}$ — more than half the total — and that is correct behaviour, not a bug: the body is turning underneath a fixed vector.

**Bug 1: the reaction torque is never applied to the body.** Delete the $-\dot{\mathbf{h}}_w$ term. $\mathbf{H}_N$ reaches $5.71\,\mathrm{N\,m\,s}$ of error in the first minute, $42.7$ by five minutes and $180$ by the end of the run. The attitude barely moves, ending $63^\circ$ from target while the wheels wind up to $144\,\mathrm{N\,m\,s}$. Any check catches this one, including looking out of the window.

**Bug 2: $\mathbf{h}_w$ is omitted from the gyroscopic term.** Write $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega})$ instead of $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w)$. The slew works. The attitude converges to $0.0013^\circ$, the wheel speeds look sensible, the peak torque is unchanged at $0.0658\,\mathrm{N\,m}$, and the body-frame momentum magnitude is off by only $0.18\,\mathrm{N\,m\,s}$ — one and a half per cent, easily written off as integrator error. The inertial momentum vector, meanwhile, has drifted by $5.84\,\mathrm{N\,m\,s}$: **half the total momentum in the system**, created from nothing.

That is the case the audit exists for. A simulation that slews correctly, holds its wheel speeds in range and conserves a body-frame magnitude to one per cent, while inventing half its angular momentum, will pass every review it is shown.
:::

::: warning Three ways total momentum drifts, and one that is not a bug
When the audit fails with zero external torque, the causes in order of frequency are: the wheel reaction torque is not applied back onto the body; $\mathbf{h}_w$ is missing from the gyroscopic term $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w)$; or the audit itself mixes frames, comparing a body-frame sum against an inertial-frame reference. What is *not* a cause: the integrator step, which produces a small oscillation rather than a one-way trend and is ruled out by halving it; a non-diagonal inertia tensor, which is perfectly legitimate; or wheel bearing friction, which is an internal torque — it moves momentum between wheel and body and dissipates energy, but leaves the total untouched.
:::

## Control moment gyros

A reaction wheel changes the *magnitude* of a stored momentum vector. A control moment gyro changes its *direction*, and that turns out to be a far more efficient way to make torque.

Spin a rotor at constant speed so it carries momentum $\mathbf{h}$, and mount it on a gimbal with axis $\hat{\mathbf{g}}$. Rotating the gimbal at rate $\dot{\delta}$ swings $\mathbf{h}$ around, and the body feels the reaction:

$$
\mathbf{M}_{CMG} = -\dot{\delta}\,\bigl(\hat{\mathbf{g}}\times\mathbf{h}\bigr),
\qquad \lVert\mathbf{M}\rVert = \lvert\dot{\delta}\rvert\,h\,\sin\angle(\hat{\mathbf{g}}, \mathbf{h}) = \lvert\dot{\delta}\rvert\,h
$$

for the usual arrangement with the gimbal axis perpendicular to the spin axis. The output torque is the product of the stored momentum and the gimbal rate, and neither has to come from a large motor: the gimbal drive works against friction and the gimbal's own small inertia, not against the output torque.

::: key Reaction wheel against control moment gyro
A CMG gimbals a constant-speed rotor, producing torque by changing momentum *direction*: $\lVert\mathbf{M}\rVert = h\,\lvert\dot{\delta}\rvert$, which is far more torque per watt and per kilogram than spinning a wheel up. The cost is singular gimbal configurations in which no torque can be produced along some direction, requiring steering logic to avoid or escape them.
:::

::: example CMG against reaction wheel, on the same rotor
Take a rotor with $J_r = 0.08\,\mathrm{kg\,m^2}$ spinning at $6000\,\mathrm{rpm} = 628.3\,\mathrm{rad/s}$, so $h = 50.3\,\mathrm{N\,m\,s}$.

**As a CMG.** Gimbal it at $1\,\mathrm{rad/s}$ and the output torque is $h\dot{\delta} = 50.3\,\mathrm{N\,m}$. At $2\,\mathrm{rad/s}$ it is $101\,\mathrm{N\,m}$.

**As a reaction wheel.** To get $50.3\,\mathrm{N\,m}$ out of the same rotor the motor would have to apply $50.3\,\mathrm{N\,m}$ directly to it, accelerating it at $628\,\mathrm{rad/s^2}$ — from rest to $6000\,\mathrm{rpm}$ in one second. Real wheel motors deliver $0.05$ to $0.3\,\mathrm{N\,m}$. The CMG produces about 500 times the torque of a $0.1\,\mathrm{N\,m}$ wheel using the same spinning mass.

**What it buys.** Consider an agile imaging satellite, $\mathbf{I} \approx 10^4\,\mathrm{kg\,m^2}$, required to slew $30^\circ$ in 60 seconds. A bang-bang profile needs $\ddot{\theta} = 4\theta/T^2 = 4(0.5236)/3600 = 5.82\times 10^{-4}\,\mathrm{rad/s^2}$, so $5.82\,\mathrm{N\,m}$ of torque, with a peak rate of $1.0^\circ/\mathrm{s}$ and a peak body momentum of $175\,\mathrm{N\,m\,s}$. No realistic reaction wheel produces $5.8\,\mathrm{N\,m}$. A cluster of four of the CMGs above produces up to $200\,\mathrm{N\,m}$ and holds a momentum envelope of about $4h = 201\,\mathrm{N\,m\,s}$ — enough for the slew, with the envelope, not the torque, as the binding constraint. That is the trade in one paragraph: CMGs for agility, wheels for precision and simplicity.
:::

### Singularities

The price is geometric. For a cluster of $n$ single-gimbal CMGs, the total output torque is

$$
\mathbf{M} = -\sum_{i=1}^{n}\bigl(\hat{\mathbf{g}}_i\times\mathbf{h}_i\bigr)\dot{\delta}_i = -\mathbf{A}(\boldsymbol{\delta})\,\dot{\boldsymbol{\delta}},
$$

where the $3\times n$ Jacobian $\mathbf{A}$ has the individual torque directions $\hat{\mathbf{g}}_i\times\mathbf{h}_i$ as its columns. Those directions depend on the gimbal angles, and at certain configurations they all become coplanar: $\mathbf{A}$ drops to rank 2, and there is a direction in which the cluster can produce **no torque at all**, at any gimbal rate. That is a singularity.

Some are avoidable by steering through them; some — the "saturation" singularity where all rotor momenta have aligned with the commanded direction and the cluster is full — are not. A steering law inverts $\mathbf{A}$, usually with the pseudo-inverse $\dot{\boldsymbol{\delta}} = \mathbf{A}^\top(\mathbf{A}\mathbf{A}^\top)^{-1}\mathbf{M}$, which blows up as $\mathbf{A}\mathbf{A}^\top$ becomes singular, so practical laws add a damping term that accepts a small torque error in exchange for a bounded gimbal rate, and use the redundancy of four or more units to steer the cluster away from trouble. This is an active research area and the main reason CMGs are used only where the agility is worth the complexity — the International Space Station, defence imaging satellites, and little else.

::: warning A wheel-only spacecraft cannot hold attitude forever
Wheels exchange momentum; they never remove it. Under a secular external torque the wheel speeds ramp until one saturates, and at that moment the vehicle loses control authority about that axis. The disturbance budget of the previous lesson is exactly what sets how often you must dump: at $2\times 10^{-4}\,\mathrm{N\,m}$ secular, a $1\,\mathrm{N\,m\,s}$ wheel fills in $5000\,\mathrm{s}$, or about one orbit. Dumping means applying a real external torque — magnetorquers in low orbit, thrusters anywhere — while the wheels unwind. Plan it into the mission timeline, not into the contingency list.
:::

::: note Momentum bias and zero-speed crossings
Two design details worth knowing. A *momentum-biased* spacecraft deliberately runs a wheel at high constant speed so the whole vehicle behaves gyroscopically, gaining passive stiffness about two axes for free; this was standard on early communications satellites. And a wheel passing through zero speed is a nuisance: bearing friction is worst near zero, the torque is least predictable, and the disturbance it injects shows up directly in the pointing. Four-wheel clusters exploit their redundant degree of freedom to bias all four away from zero.
:::

## Check yourself

::: check
A spacecraft with $\mathbf{I} = \mathrm{diag}(900, 1200, 1500)\,\mathrm{kg\,m^2}$ is at rest with its wheels at rest. A single wheel on body axis 3, $J_w = 0.02\,\mathrm{kg\,m^2}$, is commanded to $3000\,\mathrm{rpm}$. What is the final body rate, and what is the total momentum at every instant?
:::

::: answer
Total angular momentum is zero at the start and no external torque acts, so it is zero forever: $\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w = \mathbf{0}$ at every instant, expressed in any frame.

The wheel momentum at $3000\,\mathrm{rpm} = 314.2\,\mathrm{rad/s}$ is $h_w = 0.02 \times 314.2 = 6.283\,\mathrm{N\,m\,s}$ about axis 3. So the body momentum must be $-6.283\,\mathrm{N\,m\,s}$ about axis 3, and the body rate is $\omega_3 = -6.283/1500 = -4.19\times 10^{-3}\,\mathrm{rad/s} = -0.240^\circ/\mathrm{s}$.

The vehicle ends up slowly rotating backwards, which is exactly what you would expect and exactly what is wrong if you wanted to point somewhere: to stop, the wheel has to come back down. A wheel can produce a *rotation* only transiently; to hold a new attitude with the vehicle at rest, the wheel must return to its original speed, and any residual is stored momentum that has to be dumped.
:::

::: check
A vehicle carries $\mathbf{h}_w = (0, 0, 12)\,\mathrm{N\,m\,s}$ and is commanded to rotate at $\boldsymbol{\omega} = (0.02, 0, 0)\,\mathrm{rad/s}$ about body axis 1. What torque must the wheels supply beyond the acceleration torque, and about which axis?
:::

::: answer
The gyroscopic term is $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w)$. The part from the stored wheel momentum is

$$
\boldsymbol{\omega}\times\mathbf{h}_w = (0.02, 0, 0)\times(0, 0, 12) = (0\cdot 12 - 0\cdot 0,\ 0\cdot 0 - 0.02\cdot 12,\ 0) = (0,\, -0.24,\, 0)\,\mathrm{N\,m}.
$$

The body equation reads $\mathbf{I}\dot{\boldsymbol{\omega}} = -\dot{\mathbf{h}}_w - \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w)$, so to hold $\dot{\omega}_2 = 0$ the wheels must supply $\dot{h}_{w,2} = -0.24\,\mathrm{N\,m}$ about axis 2 — a torque about an axis nobody commanded, of a size that exceeds most wheel motors. This is the cross-coupling that momentum bias buys you: free gyroscopic stiffness in exchange for having to fight it on every manoeuvre. It also explains why a lightly loaded wheel cluster is easier to control than a heavily biased one.
:::

::: check
Your reaction-wheel simulation reports that $\lVert\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w\rVert$ is constant to $10^{-13}$ but the inertial vector $\mathbf{H}_N$ drifts steadily. Where is the bug, and where is it not?
:::

::: answer
The magnitude is computed entirely from $\boldsymbol{\omega}$ and the wheel speeds, so it tests the two dynamic equations and nothing else. Its holding to $10^{-13}$ says the body equation and the wheel equation are consistent with each other: the reaction torque is applied, the signs match, momentum is being exchanged rather than created.

$\mathbf{H}_N = \mathbf{C}^\top\mathbf{H}_B$ adds exactly one ingredient, the attitude. Since $\mathbf{C}$ is orthonormal it cannot change the magnitude, so a drift in the vector with a constant magnitude means the *direction* is wrong, which means $\mathbf{C}$ is wrong. Suspects, in order: a sign error in the kinematic equation; the quaternion-to-DCM conversion returning the transpose; a convention mismatch between the quaternion the propagator produces and the one the conversion expects.

Where it is not: the wheel model, the inertia tensor, the friction model, or the step size. Those would show in the magnitude first.
:::

::: check
Compare the momentum envelope and the torque of a four-wheel cluster ($J_w = 0.05\,\mathrm{kg\,m^2}$, $5000\,\mathrm{rpm}$, $0.2\,\mathrm{N\,m}$ motors) against a four-CMG cluster built from the same rotors gimballed at up to $1\,\mathrm{rad/s}$.
:::

::: answer
Each rotor at $5000\,\mathrm{rpm} = 523.6\,\mathrm{rad/s}$ carries $h = 0.05 \times 523.6 = 26.2\,\mathrm{N\,m\,s}$.

Storage is identical: four rotors of $26.2\,\mathrm{N\,m\,s}$ give an envelope of order $105\,\mathrm{N\,m\,s}$ either way, since storage depends on the rotors, not on how they are steered. In practice the wheel cluster's envelope is a box aligned with its four axes and the CMG cluster's is a lumpy solid whose useful interior is smaller, because the outer shell is reachable only in singular configurations.

Torque is not identical. The wheels give $0.2\,\mathrm{N\,m}$ each, at most about $0.4\,\mathrm{N\,m}$ resultant for a well-distributed four-wheel set. The CMGs give $h\dot{\delta} = 26.2\,\mathrm{N\,m}$ each, two orders of magnitude more, limited by the gimbal rate rather than by the motor. Same stored momentum, same mass, more than a hundred times the torque — and a steering law to write, singularities to avoid, and two moving parts per unit instead of one.
:::

::: check
Bearing friction slows every wheel in an unattended spacecraft. Does the total angular momentum change? Does the total energy?
:::

::: answer
Momentum: no. Friction between the rotor and the stator is an internal torque, equal and opposite on the two bodies. Whatever momentum the wheel loses, the body gains, and $\mathbf{H}_N$ is untouched. A spacecraft whose wheels all spin down does not stop rotating; it ends up rotating faster, having taken the wheels' momentum into the structure.

Energy: yes, it falls. Friction dissipates rotational kinetic energy as heat, monotonically. With $\mathbf{H}$ fixed and energy decreasing, the system tends toward the configuration of least energy at that momentum, which for a rigid body is a flat spin about the axis of *maximum* inertia. This is the same energy-dissipation argument that decides passive spin stability — a body with any internal damping will eventually end up spinning about its major axis, whatever it was doing at the start.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{h}_w = \sum J_i\Omega_i\hat{\mathbf{a}}_i$ | Wheel momentum relative to the body, in body axes |
| $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w) = \mathbf{M}_{ext} - \dot{\mathbf{h}}_w$ | Body equation with wheels; the minus sign is the reaction |
| $J_i\dot{\Omega}_i = u_i$ | Wheel equation; friction is internal and conserves total $\mathbf{H}$ |
| $\mathbf{H}_N = \mathbf{C}^\top(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w)$ | The momentum audit: constant as a vector with no external torque |
| Typical wheel | $0.005$–$0.1\,\mathrm{kg\,m^2}$, $4000$–$6000\,\mathrm{rpm}$, $0.1$–$50\,\mathrm{N\,m\,s}$, $0.005$–$0.3\,\mathrm{N\,m}$ |
| Slew example | $30^\circ$ in $330\,\mathrm{s}$ needs $0.045\,\mathrm{N\,m}$ and $2.07\,\mathrm{N\,m\,s}$ of wheel momentum |
| $\lVert\mathbf{M}_{CMG}\rVert = h\lvert\dot{\delta}\rvert$ | CMG torque: stored momentum times gimbal rate |
| CMG against wheel | $50.3\,\mathrm{N\,m}$ from the same rotor that gives $0.1\,\mathrm{N\,m}$ as a wheel |
| $\mathbf{M} = -\mathbf{A}(\boldsymbol{\delta})\dot{\boldsymbol{\delta}}$ | CMG steering; singular when the columns of $\mathbf{A}$ become coplanar |
| Saturation | Wheels exchange momentum, never remove it; secular disturbance forces a dump |

The next lesson turns to the actuator that *does* change total momentum. Thrusters apply real external torque, they cannot be commanded smaller than their minimum impulse bit, and what that quantisation does to a pointing loop is a limit cycle rather than a settling transient.
