---
id: l10-passivity-based-control
title: Passivity-based control and energy shaping
minutes: 22
covers:
  - 'Passivity-based control and energy shaping'
---

Think of a bicycle pump and a tire. You push air in, the tire stores it, and some leaks out around the valve. What the tire can never do is hand you back more air than you pushed in. Energy works the same way in most machines. A spinning wheel, a spring, a swinging pendulum: each one can store the energy you give it and can lose some to friction, but none of them can make energy out of nothing.

Every proof in this module so far has leaned on a statement like that somewhere in the middle: torque goes in, kinetic energy comes out, and never a fraction more. This lesson makes that bookkeeping the whole method. A system is **passive** if, measured at the place where you push on it, it never hands back more energy than it has stored. Once you know a plant is passive, you know something about every loop you might close around it, before you have written a line of the controller.

That is a new kind of guarantee. A damping loop steadies a spacecraft whether its inertia matrix is $\mathrm{diag}(120, 100, 80)\,\mathrm{kg\,m^2}$ or a number nobody pinned down. A force-feedback **[[docking|docking-passivity]]** controller keeps a probe from pumping energy into the structure it touches, whatever the probe's stiffness. Each is two passive pieces wired together, and the stability argument is the same three lines whatever sits inside. Feedback linearization and backstepping needed the model, to cancel particular terms. Passivity needs only a *property* of the model.

First comes the exact definition, and the one theorem that makes a loop of two passive systems stable for free. Then **energy shaping**: building a control law from an invented potential energy plus a damper, so the loop settles where you want. You already built one — the quaternion law's Lyapunov function in lesson 4. This lesson names that construction and shows it works on any plant whose rate you can measure.

## Passivity: the power bookkeeping

Take a system with state $\mathbf{x}$, an input $\mathbf{u}(t)$ and an output $\mathbf{y}(t)$. Make $\mathbf{u}$ and $\mathbf{y}$ the same size, chosen so that their dot product $\mathbf{y}^\mathsf{T}\mathbf{u}$ (read "y transpose u") is a **power**, in watts. Torque times angular rate is a power. So is force times velocity, and voltage times current. The pair $(\mathbf{u}, \mathbf{y})$ is called a **[[port|port-word]]** — the place where energy goes in and out.

Next, a **storage function** $V(\mathbf{x})$: a smooth function that is never negative, with $V(\mathbf{0}) = 0$. Think of it as the energy stored inside. The system is **passive** if

$$
\dot{V}(\mathbf{x}) \le \mathbf{y}^\mathsf{T}\mathbf{u}
$$

along every trajectory. Read it as the tire rule: the rate at which energy piles up inside can never be more than the rate at which you deliver it at the port. The system may lose some of what comes in — to friction, electrical resistance, heat — but it can make none.

Two special cases get their own names.

- If the two sides are always *equal*, the system is **lossless**: everything delivered is stored, nothing is lost.
- If you can take a margin off the right-hand side,

$$
\dot{V}(\mathbf{x}) \le \mathbf{y}^\mathsf{T}\mathbf{u} - \varepsilon\lVert\mathbf{y}\rVert^2 \qquad (\varepsilon \gt 0),
$$

the system is **output-strictly passive**. Here $\varepsilon$ ("epsilon") is a positive number, and $\lVert\mathbf{y}\rVert$ is the length of the output vector. The margin says: whenever the output is not zero, some energy is definitely being lost. That margin is what will later turn a loop that is merely stable into one that is asymptotically stable.

### The rigid body is lossless

You met a lossless system in lesson 4 without the name. Take a spacecraft's rotation. Let the input $\mathbf{u}$ be the applied torque, the output $\mathbf{y} = \boldsymbol{\omega}$ the body rate, and the storage $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$, the kinetic energy of spin. Differentiate and substitute the rigid-body equation $\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u}$:

$$
\dot{V} = \boldsymbol{\omega}^\mathsf{T}\mathbf{J}\dot{\boldsymbol{\omega}} = \boldsymbol{\omega}^\mathsf{T}\left(-\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u}\right) = \boldsymbol{\omega}^\mathsf{T}\mathbf{u} .
$$

The last step uses $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}) = 0$: a cross product is at right angles to both of its vectors, so its dot product with $\boldsymbol{\omega}$ is zero. That leaves an equality, not an inequality. The map from torque to body rate is lossless.

The gyroscopic term $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$ does more than stay out of the way. It is the reason the rigid body is *exactly* passive: it moves energy between the axes without ever changing the total, like a force that is always **[[sideways to the motion|no-work]]**.

::: key Passivity
A system with input $\mathbf{u}$ and output $\mathbf{y}$ is passive if there is a storage function $V(\mathbf{x}) \ge 0$, $V(\mathbf{0}) = 0$, with $\dot{V} \le \mathbf{y}^\mathsf{T}\mathbf{u}$ along trajectories: power delivered at the port is never less than the rate at which stored energy grows. Lossless means equality. Output-strictly passive means a margin $-\varepsilon\lVert\mathbf{y}\rVert^2$ can be taken out. The rigid body from torque to body rate is lossless with $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$, because the gyroscopic term does no work.
:::

## Two passive systems in feedback are stable, for free

Here is the theorem that makes the definition worth having. Take two passive systems. System 1 has input $\mathbf{u}_1$, output $\mathbf{y}_1$ and storage $V_1$. System 2 has $\mathbf{u}_2$, $\mathbf{y}_2$ and $V_2$. Wire them in the standard **[[negative-feedback loop|feedback-picture]]**, each one's output driving the other's input:

$$
\mathbf{u}_1 = -\mathbf{y}_2, \qquad \mathbf{u}_2 = \mathbf{y}_1 .
$$

Picture two people passing a bucket of water back and forth, with no tap anywhere. The water can only stay the same or leak away. So can the energy in this loop.

Use the total storage $V = V_1 + V_2$ as a Lyapunov candidate. Each block obeys its own passivity inequality, so

$$
\dot{V} \le \mathbf{y}_1^\mathsf{T}\mathbf{u}_1 + \mathbf{y}_2^\mathsf{T}\mathbf{u}_2
= \mathbf{y}_1^\mathsf{T}(-\mathbf{y}_2) + \mathbf{y}_2^\mathsf{T}\mathbf{y}_1
= -\mathbf{y}_1^\mathsf{T}\mathbf{y}_2 + \mathbf{y}_1^\mathsf{T}\mathbf{y}_2 = 0 .
$$

Step by step: the first inequality adds the two passivity statements. The next step substitutes the wiring. The last step uses the fact that $\mathbf{y}_1^\mathsf{T}\mathbf{y}_2$ is a single number, so it equals its own transpose $\mathbf{y}_2^\mathsf{T}\mathbf{y}_1$. The two cross terms cancel exactly.

So $\dot{V} \le 0$, and Lyapunov's direct method gives stability. No model terms were canceled, and nothing inside either block was needed.

If either block is output-strictly passive, its margin survives the sum: $\dot{V} \le -\varepsilon\lVert\mathbf{y}\rVert^2$. Now $\dot{V}$ is strictly negative whenever that output is not zero. That is still only negative *semi*-definite in the full state, so LaSalle's principle finishes the job, as it has every time in this module. It works as long as the output being zero forever forces the whole state to rest — engineers call that property **zero-state detectability**.

::: key The passivity theorem
The negative-feedback interconnection of two passive systems is stable, with Lyapunov function $V = V_1 + V_2$, because the cross terms $\mathbf{y}_1^\mathsf{T}\mathbf{y}_2$ cancel exactly. If either system is output-strictly passive, the interconnection is asymptotically stable (by LaSalle, provided a zero output forces the state to rest). Neither conclusion needs a model of either block beyond its passivity — this is the sense in which the method is model-free where feedback linearization and backstepping are not.
:::

### The damper: the simplest passive block

A car's shock absorber is a **[[damper|dashpot]]**: it pushes back in proportion to how fast it is squeezed, stores nothing, and turns motion into heat.

In symbols, take a block whose input is the plant's output, $\mathbf{u}_2 = \mathbf{y}_1$, and whose output is $\mathbf{y}_2 = \mathbf{P}\mathbf{y}_1$, where $\mathbf{P}$ is a symmetric positive definite matrix ($\mathbf{P} = \mathbf{P}^\mathsf{T} \gt 0$). It has no storage, $V_2 \equiv 0$ (read "$\equiv$" as "equals for all time"), and its power is $\mathbf{y}_2^\mathsf{T}\mathbf{u}_2 = \mathbf{y}_1^\mathsf{T}\mathbf{P}\mathbf{y}_1 \ge 0$. So it is passive, with a built-in margin because $\mathbf{P}$ is positive definite. Wire it in through $\mathbf{u}_1 = -\mathbf{y}_2 = -\mathbf{P}\mathbf{y}_1$ and you have added strict passivity to the plant. The only price is the sensor that measures $\mathbf{y}_1$.

## Energy shaping: choosing where the minimum sits

A marble in a salad bowl rolls to the bottom. To make it settle somewhere else, you reshape the bowl.

A passive plant's storage function is smallest wherever it is zero. For the rigid body that is $\boldsymbol{\omega} = \mathbf{0}$ at *any* attitude. Kinetic energy has no opinion about which way you point. To steer to one particular attitude, you must give the closed loop a storage function whose lowest point is there. That means building a potential energy the plant does not have. **Energy shaping** — designing the stored energy of the closed loop — does it in two independent pieces.

**Potential shaping.** Pick a function $U_d$ of the configuration (the "d" is for *desired*) that is zero at the target and positive nearby: the new **[[bowl|shaped-bowl]]**. Then design a control term $\mathbf{u}_p$ whose power exactly pays for the change in $U_d$ along the plant's own motion:

$$
\mathbf{y}^\mathsf{T}\mathbf{u}_p = -\dot{U}_d .
$$

This is called the **matching condition**. Add $U_d$ to the plant's own storage to get the shaped candidate $V = (\text{kinetic part}) + U_d$. When you differentiate it, the power of $\mathbf{u}_p$ and the rate $\dot{U}_d$ cancel by construction. So $\mathbf{u}_p$ never shows up in $\dot{V}$ at all. It has been absorbed into the shape of $V$.

**Damping injection.** Add $\mathbf{u}_d = -\mathbf{P}\mathbf{y}$, the damper from the last section. It stores nothing and only ever removes energy: $\mathbf{y}^\mathsf{T}\mathbf{u}_d = -\mathbf{y}^\mathsf{T}\mathbf{P}\mathbf{y} \le 0$.

Put the two together, $\mathbf{u} = \mathbf{u}_p + \mathbf{u}_d$, and the shaped storage obeys

$$
\dot{V} \le -\mathbf{y}^\mathsf{T}\mathbf{P}\mathbf{y} .
$$

That is negative semi-definite: strictly negative wherever $\mathbf{y} \ne \mathbf{0}$, but silent about the configuration once the rate is zero. So LaSalle is needed again.

### You have already done this

This recipe is exactly what the quaternion law did in lesson 4. Recall the quaternion error $(q_0, \mathbf{q}_v)$ — a scalar part $q_0$ ("q zero") and a vector part $\mathbf{q}_v$ ("q sub v") — and its kinematics $\dot{q}_0 = -\tfrac{1}{2}\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$. Line up the pieces:

- the invented potential is $U_d = 2K(1 - q_0)$;
- the shaping term is $\mathbf{u}_p = -K\mathbf{q}_v$;
- the damping term is $-\mathbf{P}\boldsymbol{\omega}$.

Check the matching condition. The shaping term's power is $\boldsymbol{\omega}^\mathsf{T}\mathbf{u}_p = -K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$. The potential changes at $\dot{U}_d = -2K\dot{q}_0 = -2K\left(-\tfrac{1}{2}\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}\right) = K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$. So $\boldsymbol{\omega}^\mathsf{T}\mathbf{u}_p = -\dot{U}_d$ exactly, as the recipe demands.

What looked like a quaternion trick is a general recipe, applied to one kinematic relation.

::: example Power balance on a small satellite, term by term
A small satellite has $\mathbf{J} = \mathrm{diag}(40, 55, 35)\,\mathrm{kg\,m^2}$. Use $K = 15\,\mathrm{N\,m}$ and $\mathbf{P} = 25\,\mathbf{I}\,\mathrm{N\,m\,s}$. The starting error is $60^\circ$ about the axis $\hat{\mathbf{n}} = (1,1,1)/\sqrt{3}$, so $q_0(0) = \cos 30^\circ = 0.866025$ and $\lVert\mathbf{q}_v(0)\rVert = \sin 30^\circ = 0.500000$. The starting rate is $\boldsymbol{\omega}(0) = (0.05, -0.02, 0.04)\,\mathrm{rad/s}$.

Integrate the closed loop $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$ with steps of $\Delta t = 1\,\mathrm{ms}$. At a few moments, record three things the passivity argument says are related: the kinetic storage $\tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$, the delivered power $\boldsymbol{\omega}^\mathsf{T}\mathbf{u}$, and the gyroscopic power $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega})$, which should be zero.

| $t$ | Kinetic $V$ (J) | $\boldsymbol{\omega}^\mathsf{T}\mathbf{u}$ (W) | $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega})$ (W) | $\lVert\mathbf{q}_v\rVert$ |
| --- | --- | --- | --- | --- |
| $0$ | $0.089000$ | $-0.4156089$ | $-1.0\times10^{-19}$ | $0.500000$ |
| $2\,\mathrm{s}$ | $0.714360$ | $0.2914562$ | $-3.0\times10^{-18}$ | $0.412151$ |
| $5\,\mathrm{s}$ | $0.492853$ | $-0.2262131$ | $8.6\times10^{-18}$ | $0.149752$ |
| $10\,\mathrm{s}$ | $0.003196$ | $-0.0068173$ | $4.4\times10^{-23}$ | $0.027460$ |
| $20\,\mathrm{s}$ | $0.000057$ | $-0.0000902$ | $2.4\times10^{-25}$ | $0.001767$ |

**Read the gyroscopic column first.** It is zero to within computer round-off at every row — never bigger than $10^{-17}$, against other terms near $1$. The identity holds numerically, not only on paper.

**Check the lossless claim.** Compute the storage rate a second way, as $\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\dot{\boldsymbol{\omega}}$ from the simulated $\dot{\boldsymbol{\omega}}$. It matches $\boldsymbol{\omega}^\mathsf{T}\mathbf{u}$ to eight figures at every row. The plant is lossless along a real trajectory, not only at $t = 0$.

**Does it make sense?** Kinetic energy first *rises*, from $0.089$ to $0.714\,\mathrm{J}$ at $2\,\mathrm{s}$, and the delivered power turns positive. That is the shaped potential pushing the vehicle toward the target, turning stored "spring" energy into spin. Then the damper wins, and $\lVert\mathbf{q}_v\rVert$ falls from $0.500$ to $0.0018$ by $20\,\mathrm{s}$. This is the convergence lesson 4 proved with LaSalle, now read as a lossless shaped plant wired to a strictly passive damper.
:::

### Shaping without the damper

Leave the damper out and the result changes in kind. Set $\mathbf{P} = \mathbf{0}$. The shaped storage then obeys

$$
\dot{V} = \boldsymbol{\omega}^\mathsf{T}\mathbf{u}_p + \dot{U}_d = -\dot{U}_d + \dot{U}_d = 0
$$

at every instant — exactly zero, not merely small. Run the same starting point for $60\,\mathrm{s}$ with $\mathbf{P} = \mathbf{0}$. $V$ stays within $1.4\times10^{-12}\,\mathrm{J}$ of its starting value, $4.108238\,\mathrm{J}$ (that is $0.089$ of spin plus $2(15)(1 - 0.866025) = 4.019$ of shaped potential). Meanwhile $\lVert\mathbf{q}_v\rVert$ swings between $0.0732$ and $0.5020$ and never settles. The vehicle behaves like a frictionless pendulum released off-center: bounded, and moving forever.

::: warning
Passive does not mean asymptotically stable. Lossless energy shaping alone gives Lyapunov stability — stored energy that never grows — and nothing more. The state can circle the target forever at whatever energy it started with. Getting there needs strict passivity somewhere in the loop, and in every design in this module that margin has come from an explicit damping term, never from the shaping. If a design's $\dot{V}$ is identically zero rather than negative semi-definite, that is not an error in the proof. It is a missing damper.
:::

## A torque-limited pendulum: pumping energy instead of forcing it

On a playground swing, you do not reach the top by one mighty kick. You **[[pump|swing-pumping]]** a little on each pass, at the right moment, and the swings grow. That is energy control, and it works on hardware too.

Take one axis with a weak motor — a test-stand actuator, an antenna pointer, a solar-array drive — modeled as a pendulum:

$$
J\ddot{\theta} = -mgl\sin\theta - b\dot{\theta} + u, \qquad |u| \le u_{\max} .
$$

Here $\theta$ ("theta") is the angle, with $\theta = 0$ hanging straight down and $\theta = \pi$ balanced upside down, which is where you want it. $J$ is the inertia, $mgl$ is the largest gravity torque, $b \ge 0$ is a small friction coefficient, and $u$ is the motor torque, never more than $u_{\max}$ in size.

The total mechanical energy is spin plus height:

$$
E = \tfrac{1}{2}J\dot{\theta}^2 + mgl(1 - \cos\theta) .
$$

Differentiating, the same way as for the rigid body, gives

$$
\dot{E} = -b\dot{\theta}^2 + u\dot{\theta} \le u\dot{\theta} .
$$

So the pendulum is passive from torque $u$ to rate $\dot{\theta}$, and output-strictly passive because of the friction. The energy you want — at the top, at rest — is $E_d = mgl(1 - \cos\pi) = 2mgl$.

### Why one big push fails

Take $mgl = 2.0\,\mathrm{N\,m}$, $u_{\max} = 1.2\,\mathrm{N\,m}$, $J = 0.45\,\mathrm{kg\,m^2}$ and $b = 0.02\,\mathrm{N\,m\,s/rad}$. Push at full torque from rest. The pendulum speeds up until gravity's pull back, $mgl\sin\theta$, is bigger than the motor. That happens at $\theta = \arcsin(u_{\max}/mgl) = \arcsin(0.6) = 36.87^\circ$. After that it slows, coasting, and a simulation shows it stops at $\theta = 79.666^\circ$ at $t = 1.770\,\mathrm{s}$. There gravity pulls back with $mgl\sin(79.666^\circ) = 1.9676\,\mathrm{N\,m}$, far more than the motor's $1.2$. It falls back. The pendulum needs *energy*, not force, and it can collect energy over several swings with a motor too weak to lift it in one.

### The energy-pumping law

Use

$$
u = k\dot{\theta}(E_d - E), \qquad \text{clipped to } \pm u_{\max} .
$$

When there is too little energy ($E \lt E_d$), it pushes the same way the pendulum is already moving, which adds energy. When there is too much, it pushes against the motion. Here $k$ is a positive gain.

To see why it works, ignore friction ($b = 0$) and use the candidate $W = \tfrac{1}{2}(E - E_d)^2$, which measures how far the energy is from the target. Then

$$
\dot{W} = (E - E_d)\dot{E} = (E - E_d)\,k\dot{\theta}^2(E_d - E) = -k\dot{\theta}^2(E - E_d)^2 \le 0 .
$$

Clipping the torque changes only its size, never its sign, so $\dot{W} \le 0$ survives the limit. $\dot{W}$ is zero in two situations, and LaSalle has to look at both.

- **The energy is already right**, $E = E_d$. The law commands zero, and the pendulum glides on the one energy level that exactly reaches the top — the goal.
- **The rate stays zero**, $\dot{\theta} \equiv 0$. Then $\ddot{\theta} \equiv 0$ too, and $u = 0$, so the dynamics force $mgl\sin\theta = 0$: $\theta$ is $0$ or $\pi$. The top already has $E = E_d$. The bottom is a resting point the law cannot leave on its own, because $u \propto \dot{\theta}$ is zero there.

So every trajectory that ever moves heads for $E = E_d$. This is weaker than the attitude proof: the *energy* converges, not the pendulum's position. A pendulum with exactly $E = E_d$ can sweep through every angle on its way up. Catching and holding the inverted point is a second, local job — a stabilizing controller of the kind from lesson 5, switched on once the state is close — that the energy law was never built to do.

::: example Pumping a torque-limited pendulum up to the energy it needs
Same numbers, with gain $k = 0.6$. Start at the bottom with a small nudge of $0.05\,\mathrm{rad/s}$. (At exact rest the law commands zero, since $u \propto \dot{\theta}$, so some starting rate is needed. On real hardware, sensor noise or vibration supplies it.) Integrate with $\Delta t = 0.2\,\mathrm{ms}$. The target is $E_d = 2mgl = 4.0\,\mathrm{J}$.

| $t$ | $\theta$ (deg) | $\dot{\theta}$ (rad/s) | $E$ (J) | $E_d - E$ (J) | $u$ (N m) |
| --- | --- | --- | --- | --- | --- |
| $0$ | $0.00$ | $0.0500$ | $0.00056$ | $3.99944$ | $0.1200$ |
| $2\,\mathrm{s}$ | $69.09$ | $-0.8807$ | $1.46064$ | $2.53936$ | $-1.2000$ |
| $4\,\mathrm{s}$ | $-165.68$ | $-0.2439$ | $3.95125$ | $0.04875$ | $-0.0071$ |
| $6\,\mathrm{s}$ | $13.69$ | $4.1686$ | $3.96661$ | $0.03339$ | $0.0835$ |
| $10\,\mathrm{s}$ | $-97.38$ | $-2.7566$ | $3.96667$ | $0.03333$ | $-0.0551$ |
| $20\,\mathrm{s}$ | $-69.63$ | $3.4402$ | $3.96667$ | $0.03333$ | $0.0688$ |
| $30\,\mathrm{s}$ | $155.49$ | $-0.8079$ | $3.96667$ | $0.03333$ | $-0.0162$ |

**Step 1: the first command.** At $t = 0$, $u = 0.6 \times 0.05 \times 3.99944 = 0.120\,\mathrm{N\,m}$. Small, because the rate is small.

**Step 2: the climb.** By $t = 6\,\mathrm{s}$ the energy is $3.96661/4.0 = 99.17\,\%$ of the target. The motor never used more than its $u_{\max} = 1.2\,\mathrm{N\,m}$ — the same torque that, pushed steadily, stalled at $79.7^\circ$.

**Step 3: why it stops short of $4.0\,\mathrm{J}$.** The proof ignored friction. With it, and the torque inside its limit,

$$
\dot{E} = -b\dot{\theta}^2 + k\dot{\theta}^2(E_d - E) = \dot{\theta}^2\big(k(E_d - E) - b\big) .
$$

Energy stops changing when $k(E_d - E) = b$, that is, when $E_d - E = b/k = 0.02/0.6 = 0.03333\,\mathrm{J}$. That is exactly the gap in the table.

**Step 4: how high it swings.** At the turning points the rate is zero, so all the energy is height: $mgl(1 - \cos\theta) = E$. Solve: $\theta = \arccos(1 - E/mgl) = \arccos(1 - 3.96667/2) = 169.525^\circ$. The simulation reverses at $\pm169.5247^\circ$ every swing, $3.59\,\mathrm{s}$ apart, matching the prediction.

**Does it make sense?** Reaching $180^\circ$ at zero rate needs exactly $E = 4.0\,\mathrm{J}$, and the pendulum is $0.033\,\mathrm{J}$ short, so it turns back about $10^\circ$ below the top. A pendulum that keeps grazing the top is not balanced on it — the gap the proof warned about.
:::

::: warning
Energy shaping needs a control that can push on every coordinate the invented potential depends on. The pendulum has one coordinate and one motor. The spacecraft has three attitude degrees of freedom and three-axis torque. In both, the actuator reaches everything the potential shapes. When it does not — fewer driven channels than coordinates — the matching condition $\mathbf{y}^\mathsf{T}\mathbf{u}_p = -\dot{U}_d$ cannot be solved for an arbitrary $U_d$, because some of the power has nowhere to be delivered. Then the equilibria you can reach are limited by dynamics the actuator cannot touch directly, and choosing $U_d$ becomes as much the problem as differentiating it. That is the world of **[[underactuated|underactuated-bridge]]** systems.
:::

## Check yourself

::: check
A DC motor has input voltage $u$, output current $y$, inductance $L$ and resistance $R \ge 0$: $L\dot{y} = u - Ry$. Propose a storage function and decide whether the motor is passive, and whether it is lossless.
:::

::: answer
Take $V = \tfrac{1}{2}Ly^2$, the energy stored in the inductor's magnetic field. Differentiate: $\dot{V} = Ly\dot{y}$. Substitute the circuit equation: $\dot{V} = y(u - Ry) = yu - Ry^2$.

Since $R \ge 0$, the term $-Ry^2$ is never positive, so $\dot{V} \le yu$: passive.

It is lossless only if $R = 0$, an ideal inductor with no resistance. With $R \gt 0$ it is output-strictly passive with margin $\varepsilon = R$, because the resistor turns some of the delivered power into heat instead of storing it. Same structure as the rigid body and the pendulum: a store of energy plus a loss.
:::

::: check
Why does closing two passive systems in negative feedback give $\dot{V} \le 0$ for their sum without any assumption about either system's internal dynamics?
:::

::: answer
Because the proof never opens either block. It uses only the two inequalities $\dot{V}_1 \le \mathbf{y}_1^\mathsf{T}\mathbf{u}_1$ and $\dot{V}_2 \le \mathbf{y}_2^\mathsf{T}\mathbf{u}_2$, plus the wiring $\mathbf{u}_1 = -\mathbf{y}_2$, $\mathbf{u}_2 = \mathbf{y}_1$.

The wiring makes the power terms $\mathbf{y}_1^\mathsf{T}\mathbf{u}_1 + \mathbf{y}_2^\mathsf{T}\mathbf{u}_2$ become $-\mathbf{y}_1^\mathsf{T}\mathbf{y}_2 + \mathbf{y}_2^\mathsf{T}\mathbf{y}_1 = 0$ by algebra alone, whatever produces $\mathbf{y}_1$ and $\mathbf{y}_2$ inside. The theorem is about the structure of the connection, not either plant's equations.
:::

::: check
In the quaternion law $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$, which part is potential shaping, which part is damping injection, and which stored quantity does each one touch?
:::

::: answer
$-K\mathbf{q}_v$ is the shaping term. Its power, $\boldsymbol{\omega}^\mathsf{T}(-K\mathbf{q}_v)$, exactly pays for $-\dot{U}_d$ with the invented potential $U_d = 2K(1 - q_0)$. So it moves the lowest point of the storage function to $q_0 = 1$, without ever appearing in $\dot{V}$ itself.

$-\mathbf{P}\boldsymbol{\omega}$ is damping injection. It stores nothing, and its only effect is $\boldsymbol{\omega}^\mathsf{T}\mathbf{u}_d = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} \le 0$: it removes kinetic energy whenever the body turns.

The first builds the resting point; the second makes the vehicle arrive instead of circling it.
:::

::: check
For the pendulum example, if the friction $b$ were exactly zero, would the closed-loop energy settle exactly at $E_d = 2mgl$, or still short of it? Explain using $\dot{W}$.
:::

::: answer
Exactly at it, in the limit. With $b = 0$, $\dot{W} = -k\dot{\theta}^2(E - E_d)^2 \le 0$ has no competing positive term. So $W = \tfrac{1}{2}(E - E_d)^2$ never grows, and for any trajectory that does not sit still at the bottom forever, $E \to E_d$.

The $0.03333\,\mathrm{J}$ shortfall in the simulation is entirely friction's doing. Friction removes energy at the rate $b\dot{\theta}^2$, which the proof left out. The loop settles where pumping and friction balance, $k(E_d - E) = b$, giving $E_d - E = b/k$. Set $b = 0$ and the gap is zero.
:::

::: check
A colleague wants to point a two-axis gimbal (azimuth and elevation, one motor each) at a fixed target using energy shaping. She proposes a single potential $U_d$ that is zero only at the target and grows in every other direction. Is the matching condition automatically satisfied here?
:::

::: answer
Yes. The gimbal has one motor per coordinate, so the control has as many channels as the configuration has coordinates.

Choose the shaping term as $\mathbf{u}_p = -\nabla U_d$, minus the **gradient** (the vector of slopes of $U_d$ in each coordinate). With output $\mathbf{y} = (\dot{\theta}_{az}, \dot{\theta}_{el})$, the chain rule gives $\dot{U}_d = \nabla U_d^\mathsf{T}\mathbf{y}$, so $\mathbf{y}^\mathsf{T}\mathbf{u}_p = -\nabla U_d^\mathsf{T}\mathbf{y} = -\dot{U}_d$ for *any* smooth $U_d$. That is the same way $-K\mathbf{q}_v$ matched $2K(1 - q_0)$ for attitude.

The matching condition becomes a real constraint only when there are fewer independently driven channels than coordinates in the potential.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\dot{V} \le \mathbf{y}^\mathsf{T}\mathbf{u}$ | Passivity: stored energy never grows faster than power delivered at the port |
| Lossless | Equality; rigid body torque $\to$ rate, $V = \tfrac12\boldsymbol\omega^\mathsf{T}\mathbf J\boldsymbol\omega$ |
| Output-strictly passive | $\dot V \le \mathbf y^\mathsf T\mathbf u - \varepsilon\lVert\mathbf y\rVert^2$ |
| $\mathbf{u}_1=-\mathbf{y}_2$, $\mathbf{u}_2=\mathbf{y}_1$, $V=V_1+V_2$ | Feedback of two passive systems: $\dot V \le 0$, cross terms cancel exactly |
| Pure damper, $\mathbf{y}_2=\mathbf P\mathbf y_1$ | $V_2\equiv0$; adds strict passivity for the price of a sensor |
| Potential shaping | Choose $U_d$, zero at the target and positive nearby; solve $\mathbf y^\mathsf T\mathbf u_p=-\dot U_d$ |
| Damping injection | $\mathbf u_d=-\mathbf P\mathbf y$; removes energy, never adds it |
| $\mathbf u=-K\mathbf q_v-\mathbf P\boldsymbol\omega$ | Shaping ($U_d=2K(1-q_0)$) plus damping injection, in one law |
| Shaping alone ($\mathbf P=\mathbf 0$) | $\dot V\equiv0$; stable, not asymptotically stable; $V$ held to $1.4\times10^{-12}\,\mathrm J$ over 60 s |
| Pendulum: $E=\tfrac12J\dot\theta^2+mgl(1-\cos\theta)$, $E_d=2mgl$ | $u=k\dot\theta(E_d-E)$ pumps energy; $\dot W=-k\dot\theta^2(E-E_d)^2\le0$ |
| With friction $b$ | Energy settles at $E_d - b/k$ |
| $mgl=2.0$, $u_{\max}=1.2\,\mathrm{N\,m}$ | Steady push stalls at $79.666^\circ$; energy law reaches $99.17\,\%$ of $E_d$ by $6\,\mathrm s$, then swings to $\pm169.52^\circ$ |

The passivity theorem says a loop of two passive pieces needs no model to be stable. The next lesson returns to the spacecraft and asks what happens when the model is right, the proof is right, and the attitude estimator still hands the controller the wrong one of two labels that describe the same physical orientation.

::: context docking-passivity Why docking and robot arms lean on passivity
When a robot arm or a docking probe touches something, the thing it touches becomes part of the control loop — and nobody gives you its model. A wall, a berthing fixture, another spacecraft: each one is passive, because it cannot create energy on contact.

That is exactly the situation the passivity theorem is built for. If the controller, seen from the contact point, is passive too, then the arm and the object together form a loop of two passive pieces, and it cannot run away however stiff or soft the object turns out to be. Designers of robot arms that work alongside people rely on this for safety, and the same thinking keeps capture mechanisms from bouncing or ringing on contact.
:::

::: context port-word Where "port" comes from
The word comes from electrical engineering. A port is a pair of terminals where you can connect a wire: one voltage across, one current through. Their product is the power flowing in.

Mechanics has the same pairs. Force and velocity multiply to power, and so do torque and angular rate. A spacecraft's "port" is the pair (commanded torque, body rate). Choosing the output so that it pairs with the input to make power is the whole trick. If you picked the angle instead of the rate as the output, the product would not be a power, and none of the bookkeeping in this lesson would work.
:::

::: context no-work A push that does no work
Swing a ball on a string in a circle. The string pulls the ball toward the center, but the ball moves along the circle, at right angles to the pull. A force at right angles to the motion changes the ball's direction, never its speed, so it adds no energy.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="85" r="60" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="150" cy="85" r="3" fill="#1f2a44"/>
  <line x1="150" y1="85" x2="210" y2="85" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="210" cy="85" r="8" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="210" y1="77" x2="210" y2="28" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="210,20 204,32 216,32" fill="#1d6fd1"/>
  <text x="220" y="34" font-size="12" fill="#1d6fd1">velocity</text>
  <line x1="200" y1="85" x2="172" y2="85" stroke="#b4232c" stroke-width="3"/>
  <polygon points="164,85 176,79 176,91" fill="#b4232c"/>
  <text x="170" y="110" font-size="12" fill="#b4232c">string's pull</text>
  <text x="232" y="92" font-size="12" fill="#1f2a44">90° apart:</text>
  <text x="232" y="108" font-size="12" fill="#1f2a44">power = 0</text>
</svg>
```

The gyroscopic torque $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$ is the same kind of push. It is always at right angles to $\boldsymbol{\omega}$, so its power $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega})$ is zero.
:::

::: context feedback-picture The loop drawn
Block 1 is the plant and block 2 is the controller. Each one's output becomes the other's input, with a minus sign on one side of the loop.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="20" width="100" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="45" font-size="13" text-anchor="middle" fill="#1f2a44">Block 1</text>
  <rect x="130" y="110" width="100" height="40" rx="6" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="135" font-size="13" text-anchor="middle" fill="#1f2a44">Block 2</text>
  <line x1="230" y1="40" x2="300" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="300" y1="40" x2="300" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="300" y1="130" x2="238" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="230,130 240,125 240,135" fill="#1f2a44"/>
  <text x="306" y="88" font-size="12" fill="#1f2a44">y₁ = u₂</text>
  <line x1="130" y1="130" x2="60" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="130" x2="60" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="40" x2="122" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="130,40 120,35 120,45" fill="#1f2a44"/>
  <text x="14" y="88" font-size="12" fill="#1f2a44">y₂</text>
  <text x="68" y="32" font-size="12" fill="#b4232c">u₁ = −y₂</text>
</svg>
```

The minus sign is what makes the two power terms cancel. Flip it to a plus and the proof fails — positive feedback can pump energy around the loop.
:::

::: context dashpot The dashpot
Engineers draw a damper as a **dashpot**: a piston in a cylinder of oil. Push it slowly and it barely resists. Push it fast and it pushes back hard, because oil has to squeeze past the piston. The force is proportional to speed, and the energy ends up as warm oil.

A spacecraft has no oil. The "damper" in $-\mathbf{P}\boldsymbol{\omega}$ is software: the computer measures the rate with a gyro and commands a torque against it. The effect on the energy is the same — it only ever drains.
:::

::: context shaped-bowl The bowl the quaternion law builds
For a rotation error of angle $\Phi$, $q_0 = \cos(\Phi/2)$, so the shaped potential is $U_d = 2K(1 - \cos(\Phi/2))$. Here it is in units of $2K$, across a full turn and a bit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,140.0 55.0,139.4 70.0,137.6 85.0,134.6 100.0,130.5 115.0,125.4 130.0,119.4 145.0,112.7 160.0,105.5 175.0,97.8 190.0,90.0 205.0,82.2 220.0,74.5 235.0,67.3 250.0,60.6 265.0,54.6 280.0,49.5 295.0,45.4 310.0,42.4 325.0,40.6 340.0,40.0"/>
  <line x1="40" y1="90" x2="190" y2="90" stroke="#6c7a93" stroke-dasharray="4 4"/>
  <line x1="190" y1="140" x2="190" y2="90" stroke="#6c7a93" stroke-dasharray="4 4"/>
  <circle cx="40" cy="140" r="4" fill="#1d6fd1"/>
  <circle cx="340" cy="40" r="4" fill="#b4232c"/>
  <text x="40" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">0°</text>
  <text x="190" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">180°</text>
  <text x="340" y="158" font-size="11" text-anchor="middle" fill="#1f2a44">360°</text>
  <text x="34" y="94" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="34" y="44" font-size="11" text-anchor="end" fill="#1f2a44">2</text>
  <text x="200" y="175" font-size="11" text-anchor="middle" fill="#1f2a44">error angle Φ</text>
  <text x="70" y="126" font-size="11" fill="#1d6fd1">bottom: target</text>
  <text x="332" y="30" font-size="11" text-anchor="end" fill="#b4232c">top: same attitude, q₀ = −1</text>
</svg>
```

The curve climbs all the way to $360^\circ$ — but a $360^\circ$ error is no error at all. That strange top is the subject of the next lesson.
:::

::: context swing-pumping The swing-up trick
A child on a swing pumps by leaning back and pulling on the ropes at the right points in each swing. Each pump adds a little energy, timed to the motion. Nobody lifts the swing to the top in one go.

The pendulum law does the same thing: push with the motion when energy is low. Control engineers call this **energy-based swing-up**. Karl Johan Åström and Katsuhisa Furuta published a well-known analysis of it around 2000, and it is the classic way to swing a pendulum on a cart, or on a rotating arm, up toward the top before a local controller catches it there.
:::

::: context underactuated-bridge Fewer motors than coordinates
A system with fewer independent actuators than coordinates to control is called **underactuated**. A spacecraft whose third reaction wheel has failed is one. So is a pendulum on a cart, which has one motor driving the cart and nothing pushing the pendulum directly.

For these, energy shaping has to find potentials that the available channels can pay for, and some resting points cannot be reached with smooth control at all. Lesson 13 takes this up, and you will find the same kind of obstacle there that the next lesson meets for attitude.
:::
