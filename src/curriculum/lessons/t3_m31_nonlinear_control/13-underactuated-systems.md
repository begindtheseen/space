---
id: l13-underactuated-systems
title: Control of underactuated systems
minutes: 25
covers:
  - 'Control of underactuated systems'
---

Every controller this module has designed so far assumed a torque available about every axis that needed one: three-axis wheels for three-axis attitude, a control input matched one-to-one with a coordinate to be steered. Real vehicles do not always have that. A reaction wheel fails — Kepler flew most of its extended mission on two working wheels instead of four — and the third body axis has no direct torque at all. A vehicle is designed from the start with fewer actuators than degrees of freedom, because mass, power, or cost made a full set the wrong trade. Either way, the vehicle is **underactuated**: fewer independent control inputs than configuration variables that need steering.

The central surprise of this lesson is that underactuated does not mean uncontrollable. A system can be fully reachable — any state connectable to any other by *some* trajectory — while no instantaneous combination of the available inputs can accelerate it in every direction. The gap between those two statements is filled by exactly the kind of nonlinear coupling this module has spent nine lessons proving does no harm: the gyroscopic term $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$ that vanished out of every Lyapunov derivative so far turns out, driven correctly rather than cancelled, to be the mechanism that reaches the axis you have no torque on at all.

This lesson does three things. First, it makes that mechanism concrete on a two-actuator spacecraft, with a maneuver you can carry through by hand and check in simulation. Second, it names the obstruction that makes underactuated control hard in practice — not reachability, but *smooth stabilizability* — and shows it is the same kind of topological fact the attitude lesson met on $SO(3)$, appearing again in a different guise. Third, it surveys what actually flies when the obstruction bites.

## What underactuated means, and where it comes from

A system $\dot{\mathbf{x}} = f(\mathbf{x}) + \sum_i g_i(\mathbf{x})u_i$ is underactuated if the number of independent inputs $u_i$ is less than the number of configuration coordinates you need to control. The **degree of underactuation** is that shortfall. A spacecraft with three-axis wheel torque controlling three-axis attitude is fully actuated; lose one wheel and it is underactuated by one. Momentum-bias vehicles — a spinning bus with two-axis torque steering the transverse attitude while the spin axis is left to its own momentum — are underactuated by design, not by failure. The academic literature's standard testbeds (a pendulum on a cart, an acrobot, a ball balanced on a beam) exist because they isolate the same mathematics with the fewest possible moving parts; this lesson keeps the examples on the vehicle.

Losing an actuator does not remove a degree of freedom from the plant — the third axis still has inertia and can still rotate — it removes your *direct* authority over it. Whatever control you achieve there has to come through coupling with the axes you do control.

## Controllable without being instantaneously actuated

Take a rigid body with wheel torque available only about body $x$ and $y$ — $u_z \equiv 0$, permanently, the third wheel gone:

$$
\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u}, \qquad u_z = 0 .
$$

Write out the $z$-component of the gyroscopic term for diagonal $\mathbf{J}=\mathrm{diag}(J_x,J_y,J_z)$: $(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega})_z = \omega_xJ_y\omega_y - \omega_yJ_x\omega_x = (J_y-J_x)\omega_x\omega_y$, so

$$
J_z\dot{\omega}_z = (J_x - J_y)\,\omega_x\omega_y .
$$

No $u_z$ anywhere, and yet $\dot\omega_z$ is not identically zero: it is driven, for free, by the *product* of the two rates you do control, provided $J_x\ne J_y$. This is not a special property of this equation — it is the same identity every earlier lesson used to prove the gyroscopic term does no *work* ($\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega})=0$ always); what those proofs never needed to notice is that a term contributing zero net power to $\dot V$ can still contribute a great deal to $\dot{\boldsymbol{\omega}}$ itself, axis by axis. It is a **Lie bracket** in the language of nonlinear controllability theory — the net motion available from two vector fields that a single instant of either one, alone, cannot produce — made concrete rather than abstract.

::: example Reaching the unactuated axis, four phases at a time
$\mathbf{J}=\mathrm{diag}(120,80,100)\,\mathrm{kg\,m^2}$ ($J_x\ne J_y$, by design), a high-gain rate servo on $x$ and $y$ only ($u_z\equiv0$), commanding this square-wave sequence of $(\omega_x,\omega_y)$ targets, each held for $T=5\,\mathrm{s}$:

$$
(\Omega_0,0) \to (\Omega_0,\Omega_0) \to (0,\Omega_0) \to (0,0), \qquad \Omega_0=0.1\,\mathrm{rad/s} .
$$

Every phase starts and ends with $\omega_x$ or $\omega_y$ at a commanded value; after all four, both are back at zero — a maneuver that is, on the actuated axes, rate-neutral. Integrating the full nonlinear dynamics at $\Delta t=0.1\,\mathrm{ms}$:

| After cycle | $\omega_z$ | $\omega_x,\omega_y$ (should return to 0) |
| --- | --- | --- |
| $1$ ($t=20\,\mathrm{s}$) | $0.020289\,\mathrm{rad/s}$ | $-0.000000,\ 0.000000$ |
| $2$ ($t=40\,\mathrm{s}$) | $0.040516\,\mathrm{rad/s}$ | $0.000007,\ 0.000000$ |
| $3$ ($t=60\,\mathrm{s}$) | $0.060680\,\mathrm{rad/s}$ | $0.000007,\ 0.000000$ |

$\omega_x$ and $\omega_y$ close the loop to within $10^{-5}\,\mathrm{rad/s}$ every cycle, exactly as commanded — and $\omega_z$ does not return to zero. It accumulates by essentially the same increment every time, $\approx0.0203\,\mathrm{rad/s}$ per cycle, entirely without a single newton-metre of $z$-torque. A quick averaging estimate confirms the size of the effect: with $\omega_x\approx\Omega_0$ held while $\omega_y$ ramps to $\Omega_0$ (phase 2, the only phase where both rates are simultaneously near $\Omega_0$),

$$
\Delta\omega_z \approx \frac{J_x-J_y}{J_z}\,\Omega_0^2\,T = \frac{40}{100}(0.1)^2(5) = 0.0200\,\mathrm{rad/s} ,
$$

against the simulated $0.020289\,\mathrm{rad/s}$ — a $1.4\%$ match from a two-line estimate. Repeating the identical maneuver with $J_x=J_y=100\,\mathrm{kg\,m^2}$ (a body symmetric about the unactuated axis) gives $\omega_z = -9\times10^{-19}\,\mathrm{rad/s}$ after one full cycle — zero to machine precision. The mechanism needs the asymmetry; take it away and the third axis is, correctly, unreachable.

The vehicle's attitude does not stay confined to a clean rotation about $z$ during this — $x$ and $y$ swing through real excursions along the way, even though their *rates* return to zero — so this is a source of controlled angular momentum in the unactuated axis, not by itself a finished three-axis pointing maneuver. It is the raw mechanism a full underactuated attitude controller is built on top of, the way the reaching law was the raw mechanism sliding mode built a full design around.
:::

## Brockett's obstruction

Reachability is not the whole story. Even where a system is fully controllable, **Brockett's necessary condition** (1983) asks a sharper question: can it be stabilized by a feedback law $\mathbf{u}=k(\mathbf{x})$ that is merely *continuous*, with no explicit dependence on time? For $\dot{\mathbf{x}}=f(\mathbf{x},\mathbf{u})$ smooth with $f(\mathbf{x}_0,\mathbf{0})=\mathbf{0}$, a necessary condition for such a $k$ to exist, making $\mathbf{x}_0$ asymptotically stable, is that the map $(\mathbf{x},\mathbf{u})\mapsto f(\mathbf{x},\mathbf{u})$ send every neighbourhood of $(\mathbf{x}_0,\mathbf{0})$ *onto* a neighbourhood of $\mathbf{0}$ — every small target acceleration, in every direction, must be achievable by *some* nearby state and input.

::: example The nonholonomic integrator fails Brockett's test
$\dot{x}_1=u_1$, $\dot{x}_2=u_2$, $\dot{x}_3=x_1u_2-x_2u_1$ — the kinematic model of a car that can drive and steer but not slide sideways, and the standard textbook case for this obstruction. Near the origin, ask whether $f(\mathbf{x},\mathbf{u})=(u_1,u_2,x_1u_2-x_2u_1)$ can hit an arbitrary small target $(0,0,\varepsilon_3)$ with $\varepsilon_3\ne0$. Matching the first two components forces $u_1=u_2=0$ — and with both inputs zero, the third component $x_1u_2-x_2u_1$ is identically zero as well, for *any* $\mathbf{x}$. No nearby state-input pair reaches $(0,0,\varepsilon_3)$: the image misses points arbitrarily close to the origin along that one direction, so Brockett's condition fails. **No continuous, let alone smooth, static state feedback stabilizes this system to the origin** — even though it is completely controllable, by the same bracket mechanism as the worked example above: driving $u_1,u_2$ around a small loop moves $x_3$ exactly the way driving $\omega_x,\omega_y$ around a loop moved $\omega_z$.
:::

The same obstruction has been proven, by the identical argument applied to the coupled equations above, for a rigid body actuated on only two axes: no continuous time-invariant feedback asymptotically stabilizes a two-wheel spacecraft to a target attitude either. This is worth setting next to the fact the attitude lesson proved: there, the obstacle was topological — $SO(3)$ is not contractible, so no continuous law can be *globally* stabilizing. Here, the obstacle shows up even *locally*, on a system that is not even trying to cover a sphere. Two different proofs, one recurring shape: **reachability is not stabilizability**, and closing that gap costs you continuity every time.

::: key Brockett's necessary condition
If $\mathbf{u}=k(\mathbf{x})$, continuous, asymptotically stabilizes $\dot{\mathbf{x}}=f(\mathbf{x},\mathbf{u})$ at $\mathbf{x}_0$, then $f$ must map every neighbourhood of $(\mathbf{x}_0,\mathbf{0})$ onto a neighbourhood of $\mathbf{0}$. The nonholonomic integrator, and a two-axis-actuated rigid body, both fail this test while remaining fully controllable: they can be *driven* anywhere, by a suitably clever trajectory, but not *regulated* there by any fixed continuous law.
:::

## What actually flies

Since continuity is the casualty, every practical answer gives it up deliberately, in one of a few ways.

**Discontinuous or hybrid switching.** The same tool the unwinding fix used: accept a control law with a jump — switching gain sets, or the sign convention itself — at a chosen boundary, and design the jump so it never happens on a trajectory that matters. Underactuated spacecraft recovery modes commonly switch between a coarse-pointing law and a fine one as the state crosses a threshold, precisely because no single continuous law spans both regimes cleanly.

**Time-varying feedback.** Brockett's condition is a statement about *time-invariant* laws only; making the gains explicitly periodic in time is enough to stabilize some systems that fail it, the nonholonomic integrator among them (a result due to Samson). The price is a design that has to be checked against a moving target rather than a fixed one, and slower convergence than a well-behaved smooth law would give if one existed.

**Passive gyroscopic stiffening.** If the vehicle carries an angular momentum bias — a wheel still spinning even though its torque motor has failed, or the body itself spun up on purpose — the same $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$ coupling that reached the unactuated axis above also resists disturbances on the *other* two axes automatically, the way a spinning top resists being tipped over rather than falling. This converts part of the underactuation problem into free stability rather than something to be actively controlled, at the cost of the vehicle now precessing rather than sitting still under a disturbance — a trade many missions with a degraded wheel set have made deliberately.

**Accept a smaller controlled subspace.** Drive the actuated coordinates directly — feedback linearize them, if the model supports it — and let the unactuated coordinate evolve under whatever dynamics that leaves it. That is exactly the **zero dynamics** the feedback linearization lesson defined: the internal behaviour of what you cannot directly command. An underactuated design lives or dies on whether that leftover dynamics is stable, for the same reason a non-minimum-phase plant broke input-output linearization there — the two problems are the same shape, one arising from too few actuators and the other from cancelling too much of the model.

::: warning
"Controllable" is a claim about where the system can eventually go; it says nothing about how fast, how directly, or under what feedback structure. The maneuver above needed three full cycles and a minute of torque to build up a modest $0.06\,\mathrm{rad/s}$ on the unactuated axis — usable, but nothing like the direct authority a working third wheel would have given. Underactuated control recovers *reachability*, not the performance a full actuator set bought you before it failed.
:::

## Check yourself

::: check
Why does the mechanism in the worked example require $J_x \ne J_y$, and what happens physically if the body is close to axisymmetric about $z$ but not exactly?
:::

::: answer
The coupling term is $(J_x-J_y)\omega_x\omega_y$: with $J_x=J_y$ it vanishes identically regardless of how $\omega_x,\omega_y$ are driven, exactly as the simulation confirmed to machine precision. Near-axisymmetric bodies do not lose the mechanism, only its strength — the same maneuver produces a $\Delta\omega_z$ scaled by however small $J_x-J_y$ actually is, so recovering authority on a near-symmetric vehicle costs proportionally more cycles or larger $\Omega_0$ for the same result.
:::

::: check
A colleague says the worked-example maneuver "proves the two-wheel spacecraft is controllable." What is missing from that claim?
:::

::: answer
It demonstrates *reachability* along one specific maneuver, in one direction, with an estimate of how much rate it buys per cycle — real evidence, but not a proof of full controllability, which would require showing every direction in the state space is reachable this way (or invoking the general Lie algebra rank condition this example is a concrete instance of). It also says nothing about *stabilizability*: Brockett's condition, separately, rules out a continuous static feedback doing the regulating even once controllability is granted.
:::

::: check
Restate Brockett's condition in terms of what it does *not* rule out, given that the nonholonomic integrator is a completely standard, solved control problem in practice.
:::

::: answer
It rules out only continuous, time-invariant, static state feedback. Every practical car-steering controller violates one of those three restrictions on purpose — parallel parking is a time-varying (or explicitly staged, discontinuous) sequence of manoeuvres, not a single fixed law evaluated at each instant. Brockett's theorem says that particular restricted class cannot do the job; it does not say the job is impossible, and the remedies in this lesson are exactly the ways engineers give up one of the three restrictions deliberately.
:::

::: check
How is the zero-dynamics framing from feedback linearization the same underlying idea as underactuation, rather than a coincidence of vocabulary?
:::

::: answer
Both describe a split between what a control law directly commands and what is left to evolve on its own. In input-output feedback linearization, the split is chosen — you decide which output to control and inherit whatever internal dynamics that choice leaves uncontrolled. In underactuation, the split is imposed by the hardware — the actuator set decides it for you. In both cases the design is only as good as the stability of the part you did not directly touch, and an unstable leftover (unstable zero dynamics there, an unreachable-and-unstable axis here) is the same failure mode wearing two names.
:::

::: check
Why is passive gyroscopic stiffening not simply "free" performance recovery, and what does a mission accept in exchange for it?
:::

::: answer
The stiffening comes from the vehicle's own angular momentum, which is a fixed physical quantity, not a tunable gain — you cannot increase it without spending propellant or accepting a faster spin, and it stiffens the two transverse axes only while trading away any hope of holding the spin axis fixed, since that axis's own momentum is what is doing the stabilizing. A mission that adopts this mode accepts precession about a disturbance-driven direction on the spin axis in exchange for automatic, control-free stability on the other two — a genuine trade, not a loophole.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Underactuated | Fewer independent inputs than coordinates needing control |
| $J_z\dot\omega_z=(J_x-J_y)\omega_x\omega_y$ | Coupling into an unactuated axis; needs $J_x\ne J_y$ |
| $J=\mathrm{diag}(120,80,100)$, $\Omega_0=0.1$, $T=5\,\mathrm s$ | $\Delta\omega_z\approx0.0203\,\mathrm{rad/s}$ per 4-phase cycle, matches $0.0200$ estimate |
| $J_x=J_y$ | Coupling vanishes to machine precision; axis genuinely unreachable |
| Brockett's condition | Continuous stabilizing feedback needs $f$ onto near $(\mathbf x_0,\mathbf 0)$; necessary, not sufficient |
| Nonholonomic integrator | $\dot x_3=x_1u_2-x_2u_1$; controllable, fails Brockett, no continuous static law stabilizes it |
| Two-axis rigid body | Same obstruction proven for underactuated spacecraft attitude |
| Remedies | Discontinuous/hybrid switching; time-varying feedback; passive gyroscopic bias; accept a smaller controlled subspace |
| Zero dynamics (backward ref.) | The uncommanded coordinate's leftover dynamics decides whether any of this works |

Every remedy in this lesson still needs an actuator that can execute the commanded torque profile at all — and the two hardware types behind almost every attitude actuator, thrusters and momentum devices near their limits, do not deliver a continuous torque in the first place. The next lesson is where that constraint stops being a simplifying assumption and becomes the actuator itself.
