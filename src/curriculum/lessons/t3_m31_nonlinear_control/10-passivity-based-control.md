---
id: l10-passivity-based-control
title: Passivity-based control and energy shaping
minutes: 24
covers:
  - 'Passivity-based control and energy shaping'
---

Every proof in this module so far has turned, somewhere in the middle, on a statement about energy: torque in, kinetic energy out, and never a fraction more than that. Passivity takes that bookkeeping and makes it the whole method rather than a trick reached for once per problem. A system is **passive** if, measured at the port where you push on it, it can never hand back more energy than it has stored. Once you know a plant has that property, you know something about every loop you might close around it, before you have written a single line of the controller.

The payoff is a different kind of guarantee than the rest of this module has offered. A PD attitude loop steadies a spacecraft whether the inertia matrix is $\mathrm{diag}(120,100,80)\,\mathrm{kg\,m^2}$ or something the ground crew never pinned down exactly; a force-feedback docking controller keeps a berthing probe from pumping energy into the structure it is approaching regardless of the probe's exact stiffness; an admittance-controlled robot arm stays safe to touch without a model of what it touches. Every one of those loops is two passive pieces wired together, and the stability argument is the same three lines no matter what is inside either piece. Feedback linearization and backstepping needed the model, to cancel specific terms. Passivity needs only a property of the model.

The lesson has two parts. First, the formal statement of passivity and the one theorem that makes a feedback interconnection of passive systems stable for free. Second, **energy shaping** — the recipe for building a control law, out of an invented potential and an added damper, whose closed loop is passive about the equilibrium you actually want rather than whichever one the physics handed you. You have already built one of these: the quaternion feedback law's Lyapunov function from earlier in this module. This lesson names what that construction was, and shows it generalizes to any plant you can measure a rate from.

## Passivity: the power bookkeeping

Take a system with state $\mathbf{x}$, input $\mathbf{u}(t)$, and output $\mathbf{y}(t)$, with $\mathbf{u}$ and $\mathbf{y}$ the same dimension so that $\mathbf{y}^\mathsf{T}\mathbf{u}$ has units of power — a **port**, in the language this borrows from circuit theory. A continuously differentiable $V(\mathbf{x}) \ge 0$ with $V(\mathbf{0}) = 0$ is a **storage function**, and the system is **passive** if

$$
\dot{V}(\mathbf{x}) \le \mathbf{y}^\mathsf{T}\mathbf{u}
$$

along every trajectory. Read it as a physical statement: the rate at which energy is stored can never exceed the rate at which it is delivered at the port. The system may dissipate some of what comes in — friction, resistance, electrical losses — but it can manufacture none of it. If equality holds identically the system is **lossless**: everything delivered is stored, nothing is lost. If a margin can be taken out of either side,

$$
\dot{V}(\mathbf{x}) \le \mathbf{y}^\mathsf{T}\mathbf{u} - \varepsilon\lVert\mathbf{y}\rVert^2 \qquad (\varepsilon \gt 0),
$$

the system is **output-strictly passive**, and that margin is what will later turn a merely stable loop into an asymptotically stable one.

The rigid body already gave you a lossless example without calling it one. Take $\mathbf{y} = \boldsymbol{\omega}$, $\mathbf{u}$ the applied torque, and $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$, the kinetic energy. Then, exactly as the Lyapunov lesson derived,

$$
\dot{V} = \boldsymbol{\omega}^\mathsf{T}\mathbf{J}\dot{\boldsymbol{\omega}} = \boldsymbol{\omega}^\mathsf{T}\left(-\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u}\right) = \boldsymbol{\omega}^\mathsf{T}\mathbf{u},
$$

using $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}) = 0$. Equality, not inequality: the map from torque to body rate is lossless. The gyroscopic term does not merely fail to spoil the proof — it is the reason the rigid body is exactly passive rather than only approximately so, because it is the one term in the dynamics that moves energy between axes without ever touching the total.

::: key Passivity
A system with input $\mathbf{u}$ and output $\mathbf{y}$ is passive if there is a storage function $V(\mathbf{x}) \ge 0$, $V(\mathbf{0}) = 0$, with $\dot{V} \le \mathbf{y}^\mathsf{T}\mathbf{u}$ along trajectories: power delivered at the port is never less than the rate of increase of stored energy. Lossless means equality. Output-strictly passive means a margin $-\varepsilon\lVert\mathbf{y}\rVert^2$ can be taken out. The rigid body from torque to body rate is lossless with $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$, because the gyroscopic term does no work.
:::

## Two passive systems in feedback are stable, for free

Here is the theorem that makes the definition worth having. Take two passive systems, $(\mathbf{u}_1, \mathbf{y}_1)$ with storage $V_1$ and $(\mathbf{u}_2, \mathbf{y}_2)$ with storage $V_2$, and close them in the standard negative-feedback loop, each one's output driving the other's input:

$$
\mathbf{u}_1 = -\mathbf{y}_2, \qquad \mathbf{u}_2 = \mathbf{y}_1 .
$$

Take $V = V_1 + V_2$ as a candidate for the interconnection. Then

$$
\dot{V} \le \mathbf{y}_1^\mathsf{T}\mathbf{u}_1 + \mathbf{y}_2^\mathsf{T}\mathbf{u}_2
= \mathbf{y}_1^\mathsf{T}(-\mathbf{y}_2) + \mathbf{y}_2^\mathsf{T}\mathbf{y}_1
= -\mathbf{y}_1^\mathsf{T}\mathbf{y}_2 + \mathbf{y}_1^\mathsf{T}\mathbf{y}_2 = 0,
$$

where the last step uses that $\mathbf{y}_1^\mathsf{T}\mathbf{y}_2$ is a scalar and therefore equal to its own transpose $\mathbf{y}_2^\mathsf{T}\mathbf{y}_1$. So $\dot{V} \le 0$ for the interconnection, and Lyapunov's direct method gives stability — with no cancellation, no knowledge of either system's internal parameters, and no computation beyond the definition itself. If either block is output-strictly passive, its $-\varepsilon\lVert\mathbf{y}\rVert^2$ margin survives the sum, $\dot{V} \le -\varepsilon\lVert\mathbf{y}\rVert^2$, and the LaSalle argument that has closed every semi-definite case in this module closes this one too.

::: key The passivity theorem
The negative-feedback interconnection of two passive systems is stable, with Lyapunov function $V = V_1 + V_2$, because the cross terms $\mathbf{y}_1^\mathsf{T}\mathbf{y}_2$ cancel exactly. If either system is output-strictly passive, the interconnection is asymptotically stable. Neither conclusion needs a model of either block beyond its passivity — this is the sense in which the method is model-free where feedback linearization and backstepping are not.
:::

This is the reason a pure damper is such a useful building block. A damper with output $\mathbf{y}_2 = \mathbf{P}\mathbf{y}_1$ fed straight from a plant's own output ($\mathbf{u}_2 = \mathbf{y}_1$, $\mathbf{P} = \mathbf{P}^\mathsf{T} \gt 0$) has zero storage of its own, $V_2 \equiv 0$, and $\mathbf{y}_2^\mathsf{T}\mathbf{u}_2 = \mathbf{y}_1^\mathsf{T}\mathbf{P}\mathbf{y}_1 \ge 0$: trivially passive, with a built-in margin because $\mathbf{P}$ is positive definite. Wire it in through $\mathbf{u}_1 = -\mathbf{y}_2 = -\mathbf{P}\mathbf{y}_1$ and you have added strict passivity to whatever you connected it to, at the cost of nothing but the sensor needed to measure $\mathbf{y}_1$.

## Energy shaping: choosing where the minimum sits

A passive plant's storage function is minimized wherever it happens to be zero, and for the rigid body that is $\boldsymbol{\omega} = \mathbf{0}$ at *any* attitude — kinetic energy alone has no opinion about where you point. To steer the closed loop to a particular attitude you have to hand it a storage function whose minimum is there, and that means building a potential the plant does not already have. **Energy shaping** does it in two independent pieces.

**Potential shaping.** Pick a positive definite function $U_d$ of the configuration, zero at the target and nowhere else nearby, and design a control term $\mathbf{u}_p$ so that the power it delivers exactly supplies $\dot{U}_d$ along the plant's own kinematics:

$$
\mathbf{y}^\mathsf{T}\mathbf{u}_p = -\dot{U}_d .
$$

Add $U_d$ to the plant's own storage to get the shaped candidate $V = (\text{kinetic part}) + U_d$; differentiating, the $\mathbf{u}_p$ power and $\dot U_d$ cancel by construction, so $\mathbf u_p$ never appears in $\dot V$ at all — it has been absorbed into the shape of $V$ itself; only $\dot V$ against whatever else is in the loop.

**Damping injection.** Add $\mathbf{u}_d = -\mathbf{P}\mathbf{y}$, the pure damper from the previous section. It contributes no storage and only ever removes energy: $\mathbf{y}^\mathsf{T}\mathbf{u}_d = -\mathbf{y}^\mathsf{T}\mathbf{P}\mathbf{y} \le 0$.

Put the two together, $\mathbf{u} = \mathbf{u}_p + \mathbf{u}_d$, and the shaped storage obeys $\dot{V} \le -\mathbf{y}^\mathsf{T}\mathbf{P}\mathbf{y}$: negative semi-definite everywhere, strictly negative wherever $\mathbf{y} \ne \mathbf{0}$ — the same pattern that has needed LaSalle every time it has appeared in this module, and needs it again here, because $\dot V$ still says nothing directly about the configuration once the rate is zero.

This is not a new trick. It is what the quaternion law already did. The kinematic identity $\dot{q}_0 = -\tfrac{1}{2}\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$ is the relation the shaping has to work through; $U_d = 2K(1 - q_0)$ is the invented potential; $\mathbf{u}_p = -K\mathbf{q}_v$ is the shaping term. Check the matching condition directly: $\boldsymbol{\omega}^\mathsf{T}\mathbf{u}_p = -K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$, while $\dot{U}_d = -2K\dot{q}_0 = K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$ — so $\boldsymbol{\omega}^\mathsf{T}\mathbf{u}_p = -\dot{U}_d$ exactly, as the recipe demands. The $-\mathbf{P}\boldsymbol{\omega}$ term is damping injection, word for word. What looked in the Lyapunov lesson like a construction specific to quaternions is a general recipe applied to one particular kinematic relation; the same two steps build a controller for any passive plant whose configuration you can shape.

::: example Power balance on a small satellite, term by term
Take $\mathbf{J} = \mathrm{diag}(40, 55, 35)\,\mathrm{kg\,m^2}$, $K = 15\,\mathrm{N\,m}$, $\mathbf{P} = 25\,\mathbf{I}\,\mathrm{N\,m\,s}$, an initial attitude error of $60^\circ$ about $\hat{\mathbf{n}} = (1,1,1)/\sqrt{3}$ (so $q_0(0) = \cos 30^\circ = 0.866025$, $\lVert\mathbf{q}_v(0)\rVert = \sin 30^\circ = 0.500000$ exactly), and $\boldsymbol{\omega}(0) = (0.05, -0.02, 0.04)\,\mathrm{rad/s}$. Integrating the closed loop $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$ at $\Delta t = 1\,\mathrm{ms}$ and evaluating the three quantities that the passivity argument claims are related — kinetic storage $\tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$, delivered power $\boldsymbol{\omega}^\mathsf{T}\mathbf{u}$, and the gyroscopic power $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega})$ that the identity says must vanish:

| $t$ | Kinetic $V$ (J) | $\boldsymbol{\omega}^\mathsf{T}\mathbf{u}$ (W) | $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega})$ | $\lVert\mathbf{q}_v\rVert$ |
| --- | --- | --- | --- | --- |
| $0$ | $0.089000$ | $-0.4156089$ | $-1.0\times10^{-19}$ | $0.500000$ |
| $2\,\mathrm{s}$ | $0.714360$ | $0.2914562$ | $-3.0\times10^{-18}$ | $0.412151$ |
| $5\,\mathrm{s}$ | $0.492853$ | $-0.2262131$ | $8.6\times10^{-18}$ | $0.149752$ |
| $10\,\mathrm{s}$ | $0.003196$ | $-0.0068173$ | $4.4\times10^{-23}$ | $0.027460$ |
| $20\,\mathrm{s}$ | $0.000057$ | $-0.0000902$ | $2.4\times10^{-25}$ | $0.001767$ |

The gyroscopic power is zero at every row to within machine round-off, never larger than $10^{-17}$ against terms of order $1$ — confirming the identity numerically rather than only symbolically. And the kinetic storage rate, computed independently from the simulated $\dot{\boldsymbol{\omega}}$ as $\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\dot{\boldsymbol{\omega}}$, matches $\boldsymbol{\omega}^\mathsf{T}\mathbf{u}$ to eight figures at every row: the plant is lossless exactly as claimed, all the way through a real trajectory, not only at $t = 0$. $\lVert\mathbf{q}_v\rVert$ falling from $0.500$ to $0.0018$ by $20\,\mathrm{s}$ is the shaped potential and the damping doing their job together — this is the same convergence the Lyapunov lesson proved with LaSalle, now read off as the interconnection of a lossless shaped plant and a strictly passive damper.
:::

Shaping without the damper is not a smaller version of this result — it is a different result. Set $\mathbf{P} = \mathbf{0}$ in the law above and the shaped storage obeys $\dot{V} = \boldsymbol{\omega}^\mathsf{T}\mathbf{u}_p + \dot{U}_d = -\dot{U}_d + \dot{U}_d \equiv 0$: exactly zero, not merely small, at every instant. Running the same initial condition for $60\,\mathrm{s}$ with $\mathbf{P} = \mathbf{0}$ confirms it: $V$ stays within $1.4\times10^{-12}\,\mathrm{J}$ of its initial value of $4.108238\,\mathrm{J}$, while $\lVert\mathbf{q}_v\rVert$ oscillates between $0.0732$ and $0.5020$ without ever settling. The vehicle behaves like a torque-free pendulum released off-centre: conservative, bounded, and permanently in motion.

::: warning
Passive is not a synonym for asymptotically stable. Lossless energy shaping alone gives Lyapunov stability — bounded, non-increasing storage — and nothing more; the state can orbit the target forever at whatever energy it started with. Asymptotic convergence needs strict passivity somewhere in the loop, and in every design in this module that margin has been supplied by an explicit damping term, never by the shaping alone. If a design's $\dot{V}$ is identically zero rather than negative semi-definite, that is not a proof error — it is a missing damper.
:::

## A torque-limited pendulum: pumping energy instead of muscling through

Spacecraft attitude is not the only place this recipe pays for itself. A single-axis, torque-limited gimbal — a test stand actuator, an antenna pointing mechanism, a solar-array drive fighting stiction — obeys

$$
J\ddot{\theta} = -mgl\sin\theta - b\dot{\theta} + u, \qquad |u| \le u_{\max},
$$

with $\theta = 0$ the hanging equilibrium, $\theta = \pi$ the inverted one you want, and $b \ge 0$ a small physical damping. Total mechanical energy $E = \tfrac{1}{2}J\dot{\theta}^2 + mgl(1 - \cos\theta)$ obeys, by the same computation as the rigid body,

$$
\dot{E} = -b\dot{\theta}^2 + u\dot{\theta} \le u\dot{\theta} :
$$

passive from $u$ to $\dot\theta$, output-strictly so because of the physical damping. The desired energy — at the top, at rest — is $E_d = mgl(1 - \cos\pi) = 2mgl$.

With $mgl = 2.0\,\mathrm{N\,m}$ and $u_{\max} = 1.2\,\mathrm{N\,m}$, direct force cannot do the job: pushing at full torque from rest, the pendulum decelerates as soon as the gravity torque $mgl\sin\theta$ exceeds $u_{\max}$, at $\theta = \arcsin(u_{\max}/mgl) = \arcsin(0.6) = 36.87^\circ$, and coasts on its accumulated kinetic energy only a little further before turning back — a simulation with $J = 0.45\,\mathrm{kg\,m^2}$, $b = 0.02\,\mathrm{N\,m\,s/rad}$ stalls at $\theta = 79.666^\circ$ at $t = 1.770\,\mathrm{s}$, where $mgl\sin(79.666^\circ) = 1.9676\,\mathrm{N\,m}$ has eaten almost the whole torque budget. No amount of patience fixes a fixed push; the pendulum needs energy, not force, and it can collect energy over several swings using far less torque than it would need in one.

Take the energy-shaping law $u = k\dot{\theta}(E_d - E)$, saturated to $\pm u_{\max}$: it pushes with the sign of $\dot\theta$ when there is too little energy, and against it when there is too much, so that on average it pumps energy in only while the pendulum is short of the target. With $b = 0$ idealized away, the candidate $W = \tfrac{1}{2}(E - E_d)^2$ gives

$$
\dot{W} = (E - E_d)\dot{E} = (E-E_d)\,k\dot{\theta}^2(E_d - E) = -k\dot{\theta}^2(E - E_d)^2 \le 0,
$$

negative semi-definite, vanishing when $\dot\theta = 0$. LaSalle's argument applies once more: if a trajectory stays at $\dot\theta \equiv 0$, then $\ddot\theta \equiv 0$ too, and since $u = k\dot\theta(E_d-E) = 0$ there as well, the dynamics force $mgl\sin\theta = 0$, so $\theta \in \{0, \pi\}$ — the two equilibria of the pendulum itself, one of which is the target. This is weaker than the attitude proof: it certifies that energy converges toward $E_d$, not that the vehicle comes to rest at the top, and a state can sit exactly at $E = E_d$ while sweeping through every angle a trajectory of that energy visits. Reaching and holding the inverted equilibrium itself is a second, local problem — the certified-region idea from earlier in this module, engaged once the state is close enough — not something the energy law was ever built to finish alone.

::: example Pumping a torque-limited pendulum over the energy it needs
Same numbers, $k = 0.6$, released from the bottom with a small $0.05\,\mathrm{rad/s}$ nudge (the law commands zero torque at exact rest, since $u \propto \dot\theta$, so some initial rate is needed to leave the bottom at all — reaction wheel jitter or sensor noise supplies it on real hardware). Integrating at $\Delta t = 0.2\,\mathrm{ms}$:

| $t$ | $\theta$ (deg, unwrapped) | $\dot\theta$ (rad/s) | $E$ (J) | $E_d - E$ (J) | $u$ (N m) |
| --- | --- | --- | --- | --- | --- |
| $0$ | $0.00$ | $0.0500$ | $0.00056$ | $3.99944$ | $0.1200$ |
| $2\,\mathrm{s}$ | $69.09$ | $-0.8807$ | $1.46064$ | $2.53936$ | $-1.2000$ |
| $4\,\mathrm{s}$ | $-165.68$ | $-0.2439$ | $3.95125$ | $0.04875$ | $-0.0071$ |
| $6\,\mathrm{s}$ | $13.69$ | $4.1686$ | $3.96661$ | $0.03339$ | $0.0835$ |
| $10\,\mathrm{s}$ | $-97.38$ | $-2.7566$ | $3.96667$ | $0.03333$ | $-0.0551$ |
| $20\,\mathrm{s}$ | $-69.63$ | $3.4402$ | $3.96667$ | $0.03333$ | $0.0688$ |
| $30\,\mathrm{s}$ | $155.49$ | $-0.8079$ | $3.96667$ | $0.03333$ | $-0.0162$ |

Energy climbs from essentially nothing to $99.17\,\%$ of $E_d = 4.0\,\mathrm{J}$ by $t = 6\,\mathrm{s}$, using at most $u_{\max} = 1.2\,\mathrm{N\,m}$ — less than the $1.97\,\mathrm{N\,m}$ the direct push had already spent to get less than half as far. It then holds at $E = 3.96667\,\mathrm{J}$ rather than $4.0\,\mathrm{J}$ exactly, because the small physical damping $b$, ignored in the idealised proof, bleeds off on average exactly what the law pumps in once $\theta$ dithers around the top. At that energy the pendulum cannot quite clear $\theta = 180^\circ$ — reaching there at zero rate needs $E \ge 2mgl = 4.0\,\mathrm{J}$ exactly — and the simulation shows it: after settling, the swing reverses at $\theta = \pm169.5247^\circ$, every cycle, with a period of $3.59\,\mathrm{s}$ between reversals. The value predicted from the energy alone, $\arccos(1 - E/mgl) = \arccos(1 - 3.96667/2) = 169.5252^\circ$, agrees with the simulated peak to five figures. The controller delivered exactly what the proof promised — energy converging to $E_d$ — and exactly the gap the proof warned about: a pendulum endlessly grazing the inverted equilibrium is not a pendulum balanced on it.
:::

::: warning
Energy shaping needs a control that can push on every coordinate the invented potential depends on. The pendulum has one coordinate and one motor; the spacecraft has three attitude degrees of freedom and three-axis torque authority; in both cases the actuator spans exactly what the potential shapes. When it does not — when the control acts on fewer channels than the configuration has — the matching condition $\mathbf{y}^\mathsf{T}\mathbf{u}_p = -\dot{U}_d$ cannot be solved for an arbitrary $U_d$, because some of the power has nowhere to be delivered. The achievable closed-loop equilibria are then limited by dynamics the actuator cannot reach directly, and choosing $U_d$ becomes as much the problem as differentiating it.
:::

## Check yourself

::: check
A DC motor has input voltage $u$, output current $y$, inductance $L$, resistance $R \ge 0$: $L\dot{y} = u - Ry$. Propose a storage function and determine whether the motor is passive, and whether it is lossless.
:::

::: answer
Take $V = \tfrac{1}{2}Ly^2$, the energy stored in the inductor. Then $\dot{V} = Ly\dot{y} = y(u - Ry) = yu - Ry^2$. Since $R \ge 0$, $\dot{V} \le yu$: passive. It is lossless only if $R = 0$ (an ideal, resistance-free inductor); with $R \gt 0$ it is output-strictly passive with margin $\varepsilon = R$, because the resistor dissipates some of the delivered power as heat rather than storing all of it. This is the same structure as the rigid body and the pendulum: an energy-storing element plus whatever dissipates, read directly off the equation of motion.
:::

::: check
Why does closing two passive systems in negative feedback give $\dot{V} \le 0$ for their sum without any assumption about either system's internal dynamics?
:::

::: answer
Because the proof never opens either block. It uses only the two inequalities $\dot{V}_1 \le \mathbf{y}_1^\mathsf{T}\mathbf{u}_1$ and $\dot{V}_2 \le \mathbf{y}_2^\mathsf{T}\mathbf{u}_2$, and the interconnection $\mathbf{u}_1 = -\mathbf{y}_2$, $\mathbf{u}_2 = \mathbf{y}_1$, which makes the cross terms $\mathbf{y}_1^\mathsf{T}\mathbf{u}_1 + \mathbf{y}_2^\mathsf{T}\mathbf{u}_2$ collapse to $-\mathbf{y}_1^\mathsf{T}\mathbf{y}_2 + \mathbf{y}_2^\mathsf{T}\mathbf{y}_1 = 0$ algebraically, regardless of what generates $\mathbf{y}_1$ or $\mathbf{y}_2$ internally. Any two systems with that port property sum this way; the theorem is about the interconnection's structure, not either plant's equations.
:::

::: check
In the quaternion law $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$, which part is potential shaping, which part is damping injection, and which stored quantity does each one touch?
:::

::: answer
$-K\mathbf{q}_v$ is the shaping term: its power $\boldsymbol{\omega}^\mathsf{T}(-K\mathbf{q}_v)$ exactly supplies $-\dot{U}_d$ for the invented potential $U_d = 2K(1-q_0)$, so it changes where the storage function's minimum sits (at $q_0=1$) without ever appearing in $\dot{V}$ itself. $-\mathbf{P}\boldsymbol{\omega}$ is damping injection: it has no storage of its own and its only effect is $\mathbf{y}^\mathsf{T}\mathbf{u}_d = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} \le 0$, strictly removing kinetic energy whenever the body rotates. The first term builds the equilibrium you want; the second is what makes you actually get there instead of orbiting it.
:::

::: check
For the pendulum example, if the physical damping $b$ were exactly zero, would the closed-loop energy settle exactly at $E_d = 2mgl$, or still short of it? Explain using the $\dot W$ expression.
:::

::: answer
Exactly at it, in the limit. With $b = 0$, $\dot{W} = -k\dot\theta^2(E-E_d)^2 \le 0$ has no competing positive term, so $W = \tfrac12(E-E_d)^2$ is non-increasing and, away from the measure-zero set where $\dot\theta \equiv 0$ forever, $E \to E_d$. The $0.03333\,\mathrm{J}$ shortfall measured in the simulation is entirely the physical damping's doing: it removes energy at a rate $b\dot\theta^2$ that the idealised proof assumed away, and the closed loop settles wherever the average energy the law pumps in over a cycle balances what friction removes — not because the control law is imperfect, but because the model it was designed against was intentionally the frictionless one.
:::

::: check
A colleague wants to point a two-axis gimbal (azimuth and elevation, one motor each) to a fixed target using energy shaping, and proposes a single scalar potential $U_d$ that is zero only at the target and grows in every other direction. Is the matching condition automatically satisfied here?
:::

::: answer
Yes, and the reason is worth stating precisely: the actuator has one motor per coordinate, so the control input space and the configuration space have the same dimension, and any smooth $U_d(\theta_{az}, \theta_{el})$ can be matched by choosing $\mathbf{u}_p = -\nabla U_d$ directly — the power identity $\mathbf{y}^\mathsf{T}\mathbf{u}_p = -\dot U_d$ then holds by the chain rule for any $U_d$ at all, the same way $-K\mathbf{q}_v$ matched $2K(1-q_0)$ on the attitude sphere. The matching condition only becomes a real constraint when the number of independently driven channels is less than the number of coordinates the desired potential depends on.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\dot{V} \le \mathbf{y}^\mathsf{T}\mathbf{u}$ | Passivity: stored power never exceeds delivered power |
| Lossless | Equality; rigid body torque $\to$ rate, $V = \tfrac12\boldsymbol\omega^\mathsf{T}\mathbf J\boldsymbol\omega$ |
| Output-strictly passive | $\dot V \le \mathbf y^\mathsf T\mathbf u - \varepsilon\lVert\mathbf y\rVert^2$ |
| $\mathbf{u}_1=-\mathbf{y}_2$, $\mathbf{u}_2=\mathbf{y}_1$, $V=V_1+V_2$ | Feedback of two passive systems: $\dot V \le 0$, cross terms cancel exactly |
| Pure damper, $\mathbf{y}_2=\mathbf P\mathbf y_1$ | $V_2\equiv0$; adds strict passivity for free |
| Potential shaping | Choose $U_d\gt0$ at target; solve $\mathbf y^\mathsf T\mathbf u_p=-\dot U_d$ |
| Damping injection | $\mathbf u_d=-\mathbf P\mathbf y$; removes energy, never adds it |
| $\mathbf u=-K\mathbf q_v-\mathbf P\boldsymbol\omega$ | Shaping ($U_d=2K(1-q_0)$) plus damping injection, in one law |
| Shaping alone ($\mathbf P=\mathbf 0$) | $\dot V\equiv0$; stable, not asymptotically stable; measured spread $1.4\times10^{-12}\,\mathrm J$ over 60 s |
| Pendulum: $E=\tfrac12J\dot\theta^2+mgl(1-\cos\theta)$, $E_d=2mgl$ | $u=k\dot\theta(E_d-E)$ pumps energy; $\dot W=-k\dot\theta^2(E-E_d)^2\le0$ |
| $mgl=2.0$, $u_{\max}=1.2\,\mathrm{N\,m}$ | Direct push stalls at $79.666^\circ$; energy law reaches $99.17\,\%$ of $E_d$ by $6\,\mathrm s$, swings to $\pm169.52^\circ$ thereafter |

The passivity theorem said a feedback loop of two passive pieces needs no model to be stable. The next lesson returns to the spacecraft and asks what happens when the model is right, the proof is right, and the attitude estimator still hands the controller the wrong member of a pair that happen to describe the same physical orientation.
