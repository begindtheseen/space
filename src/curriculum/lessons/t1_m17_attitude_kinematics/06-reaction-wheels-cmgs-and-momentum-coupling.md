---
id: l06-reaction-wheels-cmgs-and-momentum-coupling
title: Reaction wheels, CMGs and momentum coupling
minutes: 24
covers:
  - reaction wheel and CMG dynamics and momentum coupling
---

Sit on a [[swivel chair|swivel-chair]] with your feet off the floor and hold a spinning bicycle wheel. Spin the wheel faster one way, and you turn the other way. Nobody outside pushed you. You traded spin between yourself and the wheel.

A thruster changes a spacecraft's angular momentum. A **reaction wheel** — a flywheel inside the spacecraft, spun by an electric motor — does not. It moves momentum from the body into the spinning rotor and back, and the total stays exactly where it was. That one difference, *external torque* against *internal momentum exchange*, changes the equations of motion, changes what a simulation should be checked against, and sets the basic limit on what a wheel-controlled vehicle can do.

The consequences follow directly. A wheel-controlled spacecraft can point anywhere and hold there without spending propellant, which is why almost every science and imaging satellite uses wheels. It cannot soak up a steady outside torque forever: the momentum has to go somewhere, and the rotor has a top speed. So every such spacecraft also carries magnetorquers or thrusters to dump momentum. And its equations of motion must carry the wheel momentum, because a spinning rotor inside a turning body makes gyroscopic torque exactly as a spinning body does.

This lesson derives the body equation with wheels, gives you the one test that catches the bookkeeping errors, and then covers **control moment gyros** (CMGs). They use the same physics to make hundreds of times more torque per kilogram, at the cost of a geometry problem engineers have wrestled with for fifty years.

## The body equation with wheels

Let $\mathbf{I}$ be the inertia tensor of the whole vehicle — structure plus wheels, with the wheels treated as locked — about the center of mass. Let $\mathbf{h}_w$ ("h sub w") be the total angular momentum the wheels carry *relative to the body*, written in body axes. For $n$ wheels with rotor inertias $J_i$, spin axes $\hat{\mathbf{a}}_i$, and spin rates $\Omega_i$ relative to the body:

$$
\mathbf{h}_w = \sum_{i=1}^{n} J_i\,\Omega_i\,\hat{\mathbf{a}}_i .
$$

The system's total angular momentum, in body components, is the body's share plus the wheels' extra share: $\mathbf{H} = \mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w$.

**Step 1: Newton's law for spin.** The rate of change of $\mathbf{H}$, seen from the fixed stars, equals the external torque. The **[[transport theorem|transport-theorem]]** rewrites that rate in the turning body frame:

$$
\left.\frac{d\mathbf{H}}{dt}\right|_N = \dot{\mathbf{H}} + \boldsymbol{\omega}\times\mathbf{H} = \mathbf{M}_{ext}.
$$

**Step 2: put in $\mathbf{H}$.** The body-frame rate $\dot{\mathbf{H}}$ splits into $\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{\mathbf{h}}_w$:

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \dot{\mathbf{h}}_w + \boldsymbol{\omega}\times\bigl(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w\bigr) = \mathbf{M}_{ext}.
$$

**Step 3: move the wheel term across** to the torque side:

$$
\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times\bigl(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w\bigr) = \mathbf{M}_{ext} - \dot{\mathbf{h}}_w .
$$

::: key Body equation with reaction wheels
$\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w) = \mathbf{M}_{ext} - \dot{\mathbf{h}}_w$, with $\mathbf{h}_w$ the total wheel momentum mapped into body axes. The wheel torque appears with a **minus** sign because it is a reaction: torquing a wheel up torques the body down. Each wheel obeys $J_i\dot{\Omega}_i = u_i$, the motor torque.
:::

Two terms here carry two separate pieces of physics, and both are often lost.

$-\dot{\mathbf{h}}_w$ is the **[[reaction torque|motor-reaction]]**. It is the whole point of a wheel. The motor pushes on the rotor, and the rotor pushes back on the motor housing, which is bolted to the spacecraft. Command $+0.05\,\mathrm{N\,m}$ onto the wheel and the body gets $-0.05\,\mathrm{N\,m}$. Drop this term and the wheels spin up while the vehicle sits still.

$\boldsymbol{\omega}\times\mathbf{h}_w$ is the **gyroscopic coupling from stored momentum**. Suppose the wheels hold $10\,\mathrm{N\,m\,s}$ and the vehicle turns at $0.01\,\mathrm{rad/s}$ about a perpendicular axis. Then it feels $10 \times 0.01 = 0.1\,\mathrm{N\,m}$ about the third axis — more than typical wheel motors can make. Drop this term and the simulation still slews beautifully and still keeps the body-frame momentum size nearly constant, while the vehicle's inertial momentum wanders away. This is the subtle one.

### The wheel side

Each wheel is a rigid body that can only spin about its own axle:

$$
J_i\,\dot{\Omega}_i = u_i - u_{f,i},
$$

with $u_i$ the commanded motor torque and $u_{f,i}$ bearing and drag **friction**. Friction is internal. It moves momentum from wheel to body and turns energy into heat, but it cannot change the system total.

Three wheels at right angles, along the body axes, give $\mathbf{h}_w = (J_1\Omega_1, J_2\Omega_2, J_3\Omega_3)$ and simply $\dot{\mathbf{h}}_w = \mathbf{u}$. Four wheels in a [[pyramid|wheel-pyramid]] give a $3\times 4$ distribution matrix $\mathbf{A}$ with $\mathbf{h}_w = \mathbf{A}\,\mathbf{J}\boldsymbol{\Omega}$. The fourth wheel is a spare degree of freedom, and it can be used to keep every wheel away from zero speed, where friction is worst.

Typical hardware: rotor inertia $0.005$ to $0.1\,\mathrm{kg\,m^2}$; top speed $4000$ to $6000\,\mathrm{rpm}$ ([[revolutions per minute|rpm-units]]); so momentum capacity $0.1$ to $50\,\mathrm{N\,m\,s}$; motor torque $0.005$ to $0.3\,\mathrm{N\,m}$. Momentum capacity sizes the mission against disturbances. Torque sizes how fast it can slew.

## The momentum audit

With $\mathbf{M}_{ext} = \mathbf{0}$, the total angular momentum written in the **inertial** frame,

$$
\mathbf{H}_N = \mathbf{C}^\top\bigl(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w\bigr),
$$

must stay constant as a vector. That is the best single test of a reaction-wheel simulation. It is worth seeing why the obvious alternatives fail.

The **body-frame size** $\lVert\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w\rVert$ is constant in a correct model. But it is also constant with a sign error in the kinematics, because the kinematics never enters it. Worse, a wrong gyroscopic term only disturbs it slightly.

The **body-frame vector** $\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w$ is *not* constant even when everything is right, because the body frame [[turns underneath a fixed arrow|turning-frame]]. Comparing it with its starting value shows a large "drift" in a perfectly correct simulation — a false alarm that has wasted many afternoons.

::: key The momentum audit
With no external torque, assert that $\mathbf{H}_N = \mathbf{C}^\top(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w)$ is constant **as a vector in the inertial frame**. A body-frame magnitude passes even with a sign error in the kinematics; a body-frame vector fails even when the model is right. Mixing the two is itself one of the classic bugs.
:::

The code below adds three wheels to the previous lesson's propagator and slews the bus with a **[[proportional–derivative|pd-control]]** (PD) controller.

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
**The setup.** The bus of the previous lessons, $\mathbf{I} = \mathrm{diag}(900, 1200, 1500)\,\mathrm{kg\,m^2}$, carries three wheels at right angles with $J_w = 0.02\,\mathrm{kg\,m^2}$ each. It starts at rest, wheels at rest, $30^\circ$ from its target about the axis $(1,1,1)/\sqrt{3}$.

**The controller.** The commanded body torque is $\mathbf{T}_c = -K_p\,\mathrm{sgn}(\delta q_0)\,\delta\mathbf{q}_v - K_d\boldsymbol{\omega}$: a spring pulling toward the target plus a damper resisting motion. Here $\delta\mathbf{q}_v$ is the vector part of the error quaternion, and $\mathrm{sgn}(\delta q_0)$, its sign, picks the short way round. For small errors $\delta\mathbf{q}_v \approx \delta\boldsymbol{\theta}/2$, half the error angle. Choose each axis to behave like a spring–damper with natural frequency $\omega_n = 0.01\,\mathrm{rad/s}$ and damping ratio $\zeta = 0.7$. That needs $K_p = 2I_k\omega_n^2$ and $K_d = 2\zeta\omega_n I_k$:

$$
K_p = 2 \times (900, 1200, 1500) \times 0.01^2 = (0.18,\, 0.24,\, 0.30), \qquad
K_d = 2 \times 0.7 \times 0.01 \times (900, 1200, 1500) = (12.6,\, 16.8,\, 21.0).
$$

The wheels get the opposite torque, $\mathbf{u} = -\mathbf{T}_c$.

**The result.** Run for 1200 s with RK4 at $\Delta t = 0.05\,\mathrm{s}$. The peak wheel torque is $0.0448\,\mathrm{N\,m}$. The peak body rate is $0.137^\circ/\mathrm{s}$, which is $0.079^\circ/\mathrm{s}$ about each axis. The error first passes through zero at $t = 330\,\mathrm{s}$, then overshoots to $1.37^\circ$ at $442\,\mathrm{s}$ and settles back. It stays below $1^\circ$ after $533\,\mathrm{s}$, below $0.1^\circ$ after $718\,\mathrm{s}$, and ends at $0.0007^\circ$.

**Sanity check.** A spring–damper with $\zeta = 0.7$ should overshoot by $e^{-\pi\zeta/\sqrt{1-\zeta^2}} = 4.6\,\%$. And $4.6\,\%$ of $30^\circ$ is $1.38^\circ$ — just what the simulation shows.

**Where the momentum goes.** The peak wheel momentum on any one axis is $2.07\,\mathrm{N\,m\,s}$. At $J_w = 0.02\,\mathrm{kg\,m^2}$ that is $2.07/0.02 = 103\,\mathrm{rad/s}$, or $103 \times 60/2\pi = 987\,\mathrm{rpm}$. Every newton-meter-second the body picks up comes out of a wheel and goes back in. The total $\mathbf{H}_N$ starts at zero and stays at zero, to $8.8\times 10^{-15}\,\mathrm{N\,m\,s}$ over the whole run. Nothing external acted, so nothing could change, and the simulation agrees.

Notice how little it takes: a $2\,\mathrm{N\,m\,s}$ swing and a $0.045\,\mathrm{N\,m}$ motor turn half a metric ton through $30^\circ$.
:::

::: example Two bugs, and which check finds them
**The setup.** Start the same vehicle with a **momentum bias** — wheels already spinning. Speeds $(200, -150, 300)\,\mathrm{rad/s}$ give $\mathbf{h}_w = 0.02 \times (200, -150, 300) = (4, -3, 6)\,\mathrm{N\,m\,s}$. Add a small body rate $(0.002, -0.003, 0.001)\,\mathrm{rad/s}$. The total is $\lVert\mathbf{H}\rVert = 11.55\,\mathrm{N\,m\,s}$. Now $\boldsymbol{\omega}\times\mathbf{h}_w$ is not zero, which it was in the first slew.

**Correct model.** $\mathbf{H}_N$ holds constant to $1.2\times 10^{-13}\,\mathrm{N\,m\,s}$, about one part in $10^{14}$. The body-frame size $\lVert\mathbf{H}_B\rVert$ holds to $7\times 10^{-14}$. The body-frame *vector* moves by up to $6.08\,\mathrm{N\,m\,s}$ — more than half the total. That is correct: the body is turning underneath a fixed arrow.

**Bug 1: the reaction torque never reaches the body.** Delete the $-\dot{\mathbf{h}}_w$ term. The $\mathbf{H}_N$ error reaches $5.70\,\mathrm{N\,m\,s}$ in the first minute, $42.7$ by five minutes, and up to $180$ during the run. The wheels wind up to $144\,\mathrm{N\,m\,s}$ while the attitude wanders, ending $111^\circ$ from target. Any check catches this one, including looking out of the window.

**Bug 2: $\mathbf{h}_w$ left out of the gyroscopic term.** Write $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega})$ instead of $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w)$. The slew works. The attitude converges to $0.004^\circ$, the wheel speeds look sensible, and the peak torque is unchanged at $0.0658\,\mathrm{N\,m}$. The body-frame momentum size is off by only $0.18\,\mathrm{N\,m\,s}$ — one and a half percent, easy to shrug off as integrator error. Meanwhile the inertial momentum vector has drifted by $5.84\,\mathrm{N\,m\,s}$: **half the total momentum in the system**, created from nothing.

That is the case the audit exists for: a simulation that slews correctly while inventing half its angular momentum will pass every review it is shown.
:::

::: warning Three ways total momentum drifts, and one that is not a bug
When the audit fails with zero external torque, the usual causes, most common first: the wheel reaction torque is not applied back onto the body; $\mathbf{h}_w$ is missing from the gyroscopic term $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w)$; or the audit itself mixes frames, comparing a body-frame sum against an inertial-frame reference. What is *not* a cause: the integrator step, which makes a small wobble rather than a one-way trend and is ruled out by halving it; a non-diagonal inertia tensor, which is perfectly legitimate; or wheel bearing friction, an internal torque that moves momentum between wheel and body and turns energy into heat, but leaves the total untouched.
:::

### Dumping momentum with magnetorquers

Draining the wheels takes an outside torque. In low orbit the usual source is a magnetorquer, commanded with the **cross-product law**:

$$
\mathbf{m} = k\,\frac{\mathbf{h}_w\times\mathbf{B}}{\lVert\mathbf{B}\rVert^2}.
$$

Here $k$ is a gain in $\mathrm{s^{-1}}$. To see why it works, work out the torque, using $(\mathbf{a}\times\mathbf{b})\times\mathbf{b} = (\mathbf{a}\cdot\mathbf{b})\mathbf{b} - \lVert\mathbf{b}\rVert^2\mathbf{a}$:

$$
\mathbf{m}\times\mathbf{B} = -k\,\mathbf{h}_{\perp}, \qquad \mathbf{h}_{\perp} = \mathbf{h}_w - (\mathbf{h}_w\cdot\hat{\mathbf{B}})\hat{\mathbf{B}}.
$$

The torque points straight against the part of the stored momentum that is perpendicular to the field. While the attitude controller holds the body still, that torque lands in the wheels, $\dot{\mathbf{h}}_w \approx -k\,\mathbf{h}_{\perp}$, so $\mathbf{h}_{\perp}$ shrinks with time constant $1/k$. The part along $\mathbf{B}$ cannot be touched now; it is drained later, as the field turns. **Sign check:** with $k > 0$ the torque opposes $\mathbf{h}_{\perp}$; a flipped sign pumps momentum *in*.

Take $k = 10^{-3}\,\mathrm{s^{-1}}$ (a time constant of about $17$ minutes), $\mathbf{h}_w = (1, 0, 0.5)\,\mathrm{N\,m\,s}$ and $\mathbf{B} = (0, 0, 2.6\times 10^{-5})\,\mathrm{T}$. The law asks for $\lVert\mathbf{m}\rVert = k\lVert\mathbf{h}_{\perp}\rVert/\lVert\mathbf{B}\rVert = 10^{-3} \times 1/(2.6\times 10^{-5}) = 38.5\,\mathrm{A\,m^2}$, inside a typical coil's range. The torque is $(-10^{-3}, 0, 0)\,\mathrm{N\,m}$: it drains the $1\,\mathrm{N\,m\,s}$ across the field and leaves the $0.5$ along it for later. A real law clips $\mathbf{m}$ at the coil's limit.

## Control moment gyros

Hold a spinning bicycle wheel by its axle and tilt it. It twists hard against your hands, sideways to your tilt. That twist is how a control moment gyro works.

A reaction wheel makes torque by changing the *size* of a stored momentum. A CMG changes its *direction*, and that turns out to be a far more efficient way to make torque. Spin a rotor at constant speed so it carries momentum $\mathbf{h}$. Mount it on a **[[gimbal|cmg-gimbal]]** — a pivoting frame — with axis $\hat{\mathbf{g}}$. Turning the gimbal at rate $\dot{\delta}$ ("delta dot") swings $\mathbf{h}$ around, and the body feels the reaction:

$$
\mathbf{M}_{CMG} = -\dot{\delta}\,\bigl(\hat{\mathbf{g}}\times\mathbf{h}\bigr),
\qquad \lVert\mathbf{M}\rVert = \lvert\dot{\delta}\rvert\,h\,\sin\angle(\hat{\mathbf{g}}, \mathbf{h}) = \lvert\dot{\delta}\rvert\,h .
$$

The last step uses the usual layout, with the gimbal axis at right angles to the spin axis, so the sine is 1. The output torque is stored momentum times gimbal rate, and neither needs a big motor. The gimbal motor only fights friction and the gimbal's own small inertia, not the output torque.

::: key Reaction wheel against control moment gyro
A CMG gimbals a constant-speed rotor, producing torque by changing momentum *direction*: $\lVert\mathbf{M}\rVert = h\,\lvert\dot{\delta}\rvert$, which is far more torque per watt and per kilogram than spinning a wheel up. The cost is singular gimbal configurations in which no torque can be produced along some direction, requiring steering logic to avoid or escape them.
:::

::: example CMG against reaction wheel, on the same rotor
**The rotor.** $J_r = 0.08\,\mathrm{kg\,m^2}$ spinning at $6000\,\mathrm{rpm}$. Convert: $6000 \times 2\pi/60 = 628.3\,\mathrm{rad/s}$. So $h = 0.08 \times 628.3 = 50.3\,\mathrm{N\,m\,s}$.

**As a CMG.** Gimbal it at $1\,\mathrm{rad/s}$: the torque is $h\dot{\delta} = 50.3 \times 1 = 50.3\,\mathrm{N\,m}$. At $2\,\mathrm{rad/s}$ it is $101\,\mathrm{N\,m}$.

**As a reaction wheel.** To get $50.3\,\mathrm{N\,m}$ the motor would have to apply $50.3\,\mathrm{N\,m}$ to the rotor directly, accelerating it at $M/J_r = 628\,\mathrm{rad/s^2}$ (torque divided by rotor inertia) — from rest to $6000\,\mathrm{rpm}$ in one second. Real wheel motors give $0.05$ to $0.3\,\mathrm{N\,m}$. So the CMG makes about $50.3/0.1 \approx 500$ times the torque of a $0.1\,\mathrm{N\,m}$ wheel, from the same spinning mass.

**What it buys.** An agile imaging satellite with $I \approx 10^4\,\mathrm{kg\,m^2}$ must slew $30^\circ = 0.5236\,\mathrm{rad}$ in $T = 60\,\mathrm{s}$. A **[[bang-bang|bang-bang]]** profile — full push for half the time, full brake for the rest — needs

$$
\ddot{\theta} = \frac{4\theta}{T^2} = \frac{4 \times 0.5236}{3600} = 5.82\times 10^{-4}\,\mathrm{rad/s^2},
$$

so a torque of $10^4 \times 5.82\times 10^{-4} = 5.82\,\mathrm{N\,m}$. The peak rate, at half time, is $5.82\times 10^{-4} \times 30 = 0.0175\,\mathrm{rad/s} = 1.0^\circ/\mathrm{s}$, and the peak body momentum $10^4 \times 0.0175 = 175\,\mathrm{N\,m\,s}$. No realistic reaction wheel makes $5.8\,\mathrm{N\,m}$. Four of the CMGs above make up to $200\,\mathrm{N\,m}$ and hold about $4h = 201\,\mathrm{N\,m\,s}$ — enough, with the momentum room, not the torque, as the tight limit. That is the trade in a paragraph: CMGs for agility, wheels for precision and simplicity.
:::

### Singularities

The price is geometry. For a cluster of $n$ single-gimbal CMGs, the total torque is

$$
\mathbf{M} = -\sum_{i=1}^{n}\bigl(\hat{\mathbf{g}}_i\times\mathbf{h}_i\bigr)\dot{\delta}_i = -\mathbf{A}(\boldsymbol{\delta})\,\dot{\boldsymbol{\delta}},
$$

where the $3\times n$ **Jacobian** $\mathbf{A}$ has each unit's torque direction $\hat{\mathbf{g}}_i\times\mathbf{h}_i$ as a column. Those directions move as the gimbals turn. At certain gimbal angles they all fall into one plane. Then $\mathbf{A}$ drops to rank 2, and there is a direction in which the cluster can make **no torque at all**, at any gimbal rate. That is a **singularity**.

Some singularities can be steered through. Others cannot — such as the "saturation" singularity, where every rotor's momentum has lined up with the commanded direction and the cluster is full.

A steering law turns a wanted torque into gimbal rates, usually with the **[[pseudo-inverse|pseudo-inverse]]** $\dot{\boldsymbol{\delta}} = \mathbf{A}^\top(\mathbf{A}\mathbf{A}^\top)^{-1}\mathbf{M}$. Near a singularity $\mathbf{A}\mathbf{A}^\top$ can hardly be inverted and the gimbal rates blow up. So practical laws add a damping term that accepts a small torque error in return for bounded rates, and use a fourth or fifth unit to steer the cluster away from trouble. It is still an active research area, and the main reason CMGs fly only where agility is worth the complexity: the [[International Space Station|iss-cmgs]], agile Earth-imaging satellites, and few others.

::: warning A wheel-only spacecraft cannot hold attitude forever
Wheels exchange momentum; they never remove it. Under a secular external torque the wheel speeds ramp up until one saturates, and then the vehicle loses control about that axis. The previous lesson's disturbance budget sets how often you must dump: at $2\times 10^{-4}\,\mathrm{N\,m}$ secular, a $1\,\mathrm{N\,m\,s}$ wheel fills in $1/(2\times 10^{-4}) = 5000\,\mathrm{s}$, about one orbit. Dumping means applying a real external torque — magnetorquers in low orbit, thrusters anywhere — while the wheels unwind. Plan it into the mission timeline, not the contingency list.
:::

::: note Momentum bias and zero-speed crossings
Two design details. A *momentum-biased* spacecraft deliberately runs a wheel fast and steady so the whole vehicle behaves like a gyroscope, gaining free stiffness about two axes; this was standard on early communications satellites. And a wheel passing through zero speed is a nuisance: bearing friction is worst there, the torque is least predictable, and the disturbance shows up directly in the pointing. Four-wheel clusters use their spare degree of freedom to keep all four away from zero.
:::

## Check yourself

::: check
A spacecraft with $\mathbf{I} = \mathrm{diag}(900, 1200, 1500)\,\mathrm{kg\,m^2}$ is at rest with its wheels at rest. A single wheel on body axis 3, $J_w = 0.02\,\mathrm{kg\,m^2}$, is commanded to $3000\,\mathrm{rpm}$. What is the final body rate, and what is the total momentum at every instant?
:::

::: answer
**Total momentum.** It is zero at the start and no external torque acts, so it is zero forever: $\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w = \mathbf{0}$ at every instant, in any frame.

**The wheel.** $3000\,\mathrm{rpm} = 3000 \times 2\pi/60 = 314.2\,\mathrm{rad/s}$, so $h_w = 0.02 \times 314.2 = 6.283\,\mathrm{N\,m\,s}$ about axis 3.

**The body.** It must hold $-6.283\,\mathrm{N\,m\,s}$ about axis 3, so $\omega_3 = -6.283/1500 = -4.19\times 10^{-3}\,\mathrm{rad/s} = -0.240^\circ/\mathrm{s}$.

The vehicle ends up slowly turning backwards — expected, and exactly wrong if you wanted to point somewhere. To stop, the wheel must come back down. A wheel makes a *rotation* only while its speed is changing. To hold a new attitude at rest, the wheel must return to its old speed; any leftover is stored momentum that must be dumped.
:::

::: check
A vehicle carries $\mathbf{h}_w = (0, 0, 12)\,\mathrm{N\,m\,s}$ and is commanded to rotate at $\boldsymbol{\omega} = (0.02, 0, 0)\,\mathrm{rad/s}$ about body axis 1. What torque must the wheels supply beyond the acceleration torque, and about which axis?
:::

::: answer
The gyroscopic term is $\boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w)$. Work out the part from the stored wheel momentum, component by component:

$$
\boldsymbol{\omega}\times\mathbf{h}_w = (0.02, 0, 0)\times(0, 0, 12) = (0\cdot 12 - 0\cdot 0,\ 0\cdot 0 - 0.02\cdot 12,\ 0) = (0,\, -0.24,\, 0)\,\mathrm{N\,m}.
$$

The body equation reads $\mathbf{I}\dot{\boldsymbol{\omega}} = -\dot{\mathbf{h}}_w - \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w)$. To keep $\dot{\omega}_2 = 0$, the wheels must supply $\dot{h}_{w,2} = -0.24\,\mathrm{N\,m}$ about axis 2 — an axis nobody commanded, with a torque bigger than most wheel motors make. This is the cross-coupling that momentum bias costs: free gyroscopic stiffness, paid for by fighting it on every maneuver. It is also why a lightly loaded wheel cluster is easier to control than a heavily biased one.
:::

::: check
Your reaction-wheel simulation reports that $\lVert\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w\rVert$ is constant to $10^{-13}$, but the inertial vector $\mathbf{H}_N$ drifts steadily. Where is the bug, and where is it not?
:::

::: answer
The size is computed only from $\boldsymbol{\omega}$ and the wheel speeds, so it tests the two dynamic equations and nothing else. Its holding to $10^{-13}$ says the body and wheel equations agree with each other: the reaction torque is applied, the signs match, and momentum is traded, not created.

$\mathbf{H}_N = \mathbf{C}^\top\mathbf{H}_B$ adds exactly one ingredient: the attitude. $\mathbf{C}$ is a rotation, so it cannot change the size. A drifting vector with a constant size means the *direction* is wrong, which means $\mathbf{C}$ is wrong. Suspects, in order: a sign error in the kinematic equation; a quaternion-to-DCM conversion that returns the transpose; a convention mismatch between the quaternion the propagator makes and the one the conversion expects.

Where it is not: the wheel model, the inertia tensor, the friction model or the step size. Those would show up in the size first.
:::

::: check
Compare the momentum room and the torque of a four-wheel cluster ($J_w = 0.05\,\mathrm{kg\,m^2}$, $5000\,\mathrm{rpm}$, $0.2\,\mathrm{N\,m}$ motors) against a four-CMG cluster built from the same rotors, gimbaled at up to $1\,\mathrm{rad/s}$.
:::

::: answer
**Each rotor.** $5000\,\mathrm{rpm} = 523.6\,\mathrm{rad/s}$, so $h = 0.05 \times 523.6 = 26.2\,\mathrm{N\,m\,s}$.

**Storage is the same:** four rotors of $26.2\,\mathrm{N\,m\,s}$ give room of order $4 \times 26.2 = 105\,\mathrm{N\,m\,s}$ either way, since storage depends on the rotors, not on how they are steered. In practice the wheel cluster's room is a box lined up with its four axes, while the CMG cluster's is a lumpy solid whose useful inside is smaller, because its outer shell can only be reached in singular configurations.

**Torque is not the same.** The wheels give $0.2\,\mathrm{N\,m}$ each, at most about $0.4\,\mathrm{N\,m}$ combined for a well-spread set of four. The CMGs give $h\dot{\delta} = 26.2 \times 1 = 26.2\,\mathrm{N\,m}$ each — two orders of magnitude more, limited by gimbal rate, not motor torque. Same stored momentum, same mass, over a hundred times the torque — plus a steering law to write, singularities to avoid, and two moving parts per unit instead of one.
:::

::: check
Bearing friction slowly spins down every wheel of an unattended spacecraft. Does the total angular momentum change? Does the total energy?
:::

::: answer
**Momentum: no.** Friction between rotor and housing is an internal torque, equal and opposite on the two. Whatever momentum a wheel loses, the body gains, and $\mathbf{H}_N$ is untouched. A spacecraft whose wheels spin down does not come to rest; the body ends up turning, having taken over the wheels' momentum.

**Energy: yes, it falls.** Friction turns rotational energy into heat, steadily. With $\mathbf{H}$ fixed and energy falling, the system heads for the lowest-energy motion at that momentum, which for a rigid body is a **[[flat spin|flat-spin]]** about the axis of *largest* inertia. It is the same energy argument that decides passive spin stability: a body with any internal damping ends up spinning about its major axis, whatever it was doing at first.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\mathbf{h}_w = \sum J_i\Omega_i\hat{\mathbf{a}}_i$ | Wheel momentum relative to the body, in body axes |
| $\mathbf{I}\dot{\boldsymbol{\omega}} + \boldsymbol{\omega}\times(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w) = \mathbf{M}_{ext} - \dot{\mathbf{h}}_w$ | Body equation with wheels; the minus sign is the reaction |
| $J_i\dot{\Omega}_i = u_i$ | Wheel equation; friction is internal and keeps total $\mathbf{H}$ |
| $\mathbf{H}_N = \mathbf{C}^\top(\mathbf{I}\boldsymbol{\omega} + \mathbf{h}_w)$ | The momentum audit: constant as a vector with no external torque |
| Typical wheel | $0.005$–$0.1\,\mathrm{kg\,m^2}$, $4000$–$6000\,\mathrm{rpm}$, $0.1$–$50\,\mathrm{N\,m\,s}$, $0.005$–$0.3\,\mathrm{N\,m}$ |
| Slew example | $30^\circ$: $0.045\,\mathrm{N\,m}$ peak, $2.07\,\mathrm{N\,m\,s}$ wheel momentum, within $1^\circ$ after $533\,\mathrm{s}$ |
| $\lVert\mathbf{M}_{CMG}\rVert = h\lvert\dot{\delta}\rvert$ | CMG torque: stored momentum times gimbal rate |
| CMG against wheel | $50.3\,\mathrm{N\,m}$ from a rotor whose wheel motor would give about $0.1\,\mathrm{N\,m}$ |
| $\mathbf{M} = -\mathbf{A}(\boldsymbol{\delta})\dot{\boldsymbol{\delta}}$ | CMG steering; singular when the columns of $\mathbf{A}$ fall into one plane |
| Saturation | Wheels exchange momentum, never remove it; a secular disturbance forces a dump |

The next lesson turns to the actuator that *does* change total momentum. Thrusters apply real external torque, they cannot fire a smaller pulse than their minimum impulse bit, and that graininess turns a pointing loop's settling into a never-ending limit cycle.

::: context swivel-chair Spin you can trade but not make
On a swivel chair with your feet up, nothing outside can twist you, so the total spin of you plus the wheel stays fixed. Spin the wheel up clockwise, and you must turn counterclockwise to keep the total the same. Slow the wheel back down and you stop. A reaction wheel does exactly this for a spacecraft — which is why it can turn the vehicle, but never get rid of spin the vehicle already has.
:::

::: context transport-theorem Derivatives in a turning frame
The body axes turn with the spacecraft. A vector fixed in space therefore has components along those axes that keep changing, even though the vector does not. The **transport theorem** fixes the bookkeeping: the true rate of change equals the rate seen in the turning frame plus $\boldsymbol{\omega}\times$ the vector. You used it in the rotating-frames module to get Euler's equation; here it is applied to body-plus-wheel momentum.
:::

::: context motor-reaction Every motor pushes both ways
An electric motor has two halves: the spinning rotor and the fixed housing (the stator). The magnetic force between them is equal and opposite — Newton's third law. Twist the rotor one way and the housing, bolted to the spacecraft, is twisted the other way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="20" width="300" height="110" rx="10" fill="#fff" stroke="#6c7a93" stroke-width="2"/>
  <text x="44" y="40" font-size="11" fill="#6c7a93">spacecraft body</text>
  <circle cx="180" cy="80" r="34" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="80" r="4" fill="#1f2a44"/>
  <path d="M152,60 A34,34 0 0,1 208,60" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="214,68 212,54 202,62" fill="#1d6fd1"/>
  <text x="180" y="138" font-size="11" text-anchor="middle" fill="#1f2a44">wheel</text>
  <path d="M292,110 A120,120 0 0,0 292,50" fill="none" stroke="#b4232c" stroke-width="3"/>
  <polygon points="292,42 286,55 298,55" fill="#b4232c"/>
  <path d="M68,50 A120,120 0 0,0 68,110" fill="none" stroke="#b4232c" stroke-width="3"/>
  <polygon points="68,118 62,105 74,105" fill="#b4232c"/>
  <text x="180" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">motor torque on wheel: +u</text>
  <text x="250" y="118" font-size="11" text-anchor="end" fill="#b4232c">body gets −u</text>
</svg>
```

That is the $-\dot{\mathbf{h}}_w$ in the body equation.
:::

::: context wheel-pyramid Four wheels, three directions
Three wheels at right angles cover all three directions, but lose one direction if any wheel fails. Four wheels tilted like the edges of a pyramid still cover all three if one fails, and with all four working there is one spare combination — spinning them so their momenta cancel — that can move wheel speeds away from zero without twisting the spacecraft at all. Most modern three-axis satellites fly four wheels for this reason.
:::

::: context rpm-units Converting rpm
Wheel speeds are quoted in **revolutions per minute** (rpm). The equations need radians per second. One revolution is $2\pi$ radians and one minute is $60$ seconds, so multiply rpm by $2\pi/60 \approx 0.1047$. So $6000\,\mathrm{rpm} = 628\,\mathrm{rad/s}$ — about a hundred turns every second, faster than a car engine at the redline.
:::

::: context turning-frame A fixed arrow, turning axes
Hold an arrow still and turn the axes underneath it. The arrow has not moved, but its components along the axes have changed completely. That is why the body-frame momentum vector changes in a correct simulation.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g transform="translate(90,120)">
    <line x1="0" y1="0" x2="70" y2="0" stroke="#6c7a93" stroke-width="1.5"/>
    <line x1="0" y1="0" x2="0" y2="-70" stroke="#6c7a93" stroke-width="1.5"/>
    <line x1="0" y1="0" x2="50" y2="-80" stroke="#b4232c" stroke-width="3"/>
    <polygon points="50,-80 39.3,-71.5 49.5,-65.2" fill="#b4232c"/>
    <text x="0" y="36" font-size="11" text-anchor="middle" fill="#1f2a44">before: mostly "up"</text>
  </g>
  <g transform="translate(250,120)">
    <line x1="0" y1="0" x2="60.6" y2="-35" stroke="#6c7a93" stroke-width="1.5"/>
    <line x1="0" y1="0" x2="-35" y2="-60.6" stroke="#6c7a93" stroke-width="1.5"/>
    <line x1="0" y1="0" x2="50" y2="-80" stroke="#b4232c" stroke-width="3"/>
    <polygon points="50,-80 39.3,-71.5 49.5,-65.2" fill="#b4232c"/>
    <text x="0" y="36" font-size="11" text-anchor="middle" fill="#1f2a44">axes turned 30°</text>
  </g>
  <text x="180" y="20" font-size="12" text-anchor="middle" fill="#b4232c">same arrow, new components</text>
</svg>
```

The inertial frame does not turn, so there the components stay put — which is what the audit checks.
:::

::: context pd-control A spring and a shock absorber
A **proportional–derivative** controller commands a torque made of two parts. The proportional part pulls toward the target harder the farther away you are, like a spring. The derivative part resists motion, like a car's shock absorber. The gains $K_p$ and $K_d$ set how stiff the spring and how strong the damper. Too little damping and the vehicle swings past the target again and again; a damping ratio near $0.7$ gives one small overshoot and a quick settle.
:::

::: context cmg-gimbal Tilting a spinning rotor
The rotor spins at a fixed speed, so its momentum arrow $\mathbf{h}$ keeps its length. Turning the gimbal swings the arrow's tip around a circle; the change in $\mathbf{h}$ points sideways, and the body feels the opposite.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="140" cy="100" r="80" fill="none" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <circle cx="140" cy="100" r="5" fill="#1f2a44"/>
  <text x="120" y="124" font-size="11" fill="#1f2a44">gimbal axis g</text>
  <text x="120" y="138" font-size="11" fill="#1f2a44">(out of page)</text>
  <line x1="140" y1="100" x2="220" y2="100" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="220,100 208,94 208,106" fill="#1d6fd1"/>
  <text x="200" y="118" font-size="12" fill="#1d6fd1">h</text>
  <line x1="140" y1="100" x2="209.3" y2="60" stroke="#8fb8f0" stroke-width="3"/>
  <text x="212" y="54" font-size="11" fill="#1d6fd1">h a moment later</text>
  <line x1="226" y1="96" x2="226" y2="50" stroke="#f2b880" stroke-width="3"/>
  <polygon points="226,40 220,52 232,52" fill="#f2b880"/>
  <text x="234" y="80" font-size="11" fill="#1f2a44">change: δ̇ g × h</text>
  <line x1="300" y1="60" x2="300" y2="106" stroke="#b4232c" stroke-width="3"/>
  <polygon points="300,116 294,104 306,104" fill="#b4232c"/>
  <text x="300" y="134" font-size="11" text-anchor="middle" fill="#b4232c">torque on body</text>
</svg>
```

A small gimbal motor steers the arrow; the rotor's big momentum does the pushing.
:::

::: context bang-bang Full on, then full off
A **bang-bang** maneuver uses the actuator at full strength the whole time: maximum torque to speed up for the first half, maximum torque the other way to stop for the second half. It is the fastest way to turn through an angle with a torque limit. Half the angle is covered in half the time, so $\tfrac{1}{2}\theta = \tfrac{1}{2}\ddot{\theta}(T/2)^2$, which gives $\ddot{\theta} = 4\theta/T^2$.
:::

::: context pseudo-inverse Solving with more unknowns than equations
With four CMGs there are four gimbal rates but only three torque components, so many choices of rates give the same torque. The **pseudo-inverse** picks the one with the smallest total gimbal rate. It needs $(\mathbf{A}\mathbf{A}^\top)^{-1}$, and when the torque directions fall into one plane that inverse does not exist — the mathematical face of a singularity.
:::

::: context iss-cmgs The Space Station's gyros
The International Space Station holds its attitude with four large double-gimbal CMGs, each storing about $4760\,\mathrm{N\,m\,s}$ — a steel rotor spinning at about $6600\,\mathrm{rpm}$. They let the Station stay steady without burning propellant for day-to-day control. When they near saturation, the Station either uses thrusters or flies an attitude where gravity gradient helps unload them.
:::

::: context flat-spin The satellite that taught the lesson
In 1958 the first American satellite, Explorer 1, was spun about its long axis — the axis of *least* inertia. Its flexible wire antennas flexed and turned a little energy into heat each turn. Soon after launch the spin had shifted into a tumble about the axis of largest inertia, just as the energy argument predicts. The event helped establish the major-axis rule you met in the rigid-body module.
:::
