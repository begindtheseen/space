---
id: l13-underactuated-systems
title: Control of underactuated systems
minutes: 22
covers:
  - 'Control of underactuated systems'
---

Picture a rowboat with only one oar. You can still get across the lake. You cannot shove the boat sideways, and you cannot go straight without some zigzagging, but by pulling at the right moments you can reach any spot on the shore. What you have lost is not *where* you can go. You have lost the ability to push directly in every direction at once.

Every controller in this module so far had a full set of oars. It assumed a torque about every axis that needed one: three reaction wheels for three axes of attitude, one control input for each coordinate to be steered. Real vehicles do not always have that. A reaction wheel fails. The **[[Kepler space telescope|kepler-two-wheels]]** had four wheels, lost two, and spent its whole second mission, K2, on the two that were left — with no wheel able to push about the third axis directly. Other vehicles are built from the start with fewer actuators than axes, because mass, power or cost made a full set the wrong choice. Either way the vehicle is **underactuated**: it has fewer independent control inputs than coordinates you need to steer.

The big surprise of this lesson is that underactuated does not mean uncontrollable. A system can be able to reach every state, by *some* path, even though no mix of its inputs can push it in every direction at a given instant. What fills that gap is a term you have met in every attitude proof in this module: the gyroscopic term $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$. Each Lyapunov proof so far showed that it does no harm, because it drops out of $\dot V$. Here it gets a job. Driven the right way, it is the thing that moves the axis you have no torque on.

This lesson makes that mechanism concrete on a spacecraft with two working wheels. Then it names what makes underactuated control hard: not reaching the target, but *holding* the vehicle there with a smooth feedback law — a cousin of the fact the attitude lesson met on $SO(3)$. Last, it surveys what engineers actually fly.

## What underactuated means, and where it comes from

Start with the general control-affine system from earlier lessons,

$$
\dot{\mathbf{x}} = f(\mathbf{x}) + \sum_i g_i(\mathbf{x})\,u_i .
$$

Read it as "the rate of change of the state is a drift $f$, plus each input $u_i$ pushing along its own direction $g_i$." The system is **underactuated** if the number of independent inputs $u_i$ is smaller than the number of configuration coordinates you need to control. The **degree of underactuation** is how many you are short.

A spacecraft with torque about all three body axes, steering its three-axis attitude, is **fully actuated** — one input per coordinate. Lose one wheel and it is underactuated by one.

Some vehicles are underactuated on purpose. A **momentum-bias** spacecraft carries a lot of spin — either the whole body spins, or a wheel inside spins fast. Its two-axis torque steers the two directions across the spin axis, and the spin axis is left to hold itself steady with its own angular momentum. That is underactuated by design, not by failure.

Textbooks study underactuation with small machines — a pendulum balanced on a moving cart, a two-link "acrobot" swinging like a gymnast, a ball on a tilting beam — because they show the same mathematics with the fewest parts. This lesson stays on the spacecraft.

One point matters for everything that follows. Losing an actuator does not remove a **[[degree of freedom|degree-of-freedom]]** — a separate way the body can move — from the vehicle. The third axis still has inertia and can still rotate. What you lose is *direct* authority over it. Any control you get there has to come through coupling with the axes you still command.

## Controllable without a direct push

Take a rigid body with wheel torque about body $x$ and $y$ only. The torque about $z$, $u_z$, is zero forever — the third wheel is gone. Euler's equation for the body rates is

$$
\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u}, \qquad u_z = 0 .
$$

Here $\boldsymbol{\omega}$ ("omega") is the body angular-rate vector, $\mathbf{J}$ is the inertia matrix, and $\mathbf{u}$ is the control torque.

Let the inertia matrix be diagonal, $\mathbf{J}=\mathrm{diag}(J_x,J_y,J_z)$ — the body axes are its principal axes. Write out the $z$-part of the gyroscopic term. The cross product's $z$-component is (first component of $\boldsymbol{\omega}$) times (second of $\mathbf{J}\boldsymbol{\omega}$) minus (second of $\boldsymbol{\omega}$) times (first of $\mathbf{J}\boldsymbol{\omega}$):

$$
(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega})_z = \omega_x\,(J_y\omega_y) - \omega_y\,(J_x\omega_x) = (J_y-J_x)\,\omega_x\omega_y .
$$

Put that into the $z$-row of Euler's equation, with the minus sign in front and $u_z=0$:

$$
J_z\dot{\omega}_z = (J_x - J_y)\,\omega_x\omega_y .
$$

There is no $u_z$ anywhere in that line. Yet $\dot\omega_z$ ("omega-z dot", the rate of change of the $z$ rate) is not stuck at zero. It is driven, for free, by the *product* of the two rates you *do* control — as long as $J_x\ne J_y$.

::: key Coupling into an unactuated axis
With $\mathbf{J}=\mathrm{diag}(J_x,J_y,J_z)$ and no torque about $z$:
$$
J_z\dot\omega_z=(J_x-J_y)\,\omega_x\omega_y .
$$
Driving $\omega_x$ and $\omega_y$ together changes $\omega_z$, but only if $J_x\ne J_y$.
:::

This is not a new fact. It is the same gyroscopic term every earlier lesson used, looked at one axis at a time — and the same [[product term that flips a tossed tennis racket|tennis-racket]]. Those lessons needed the identity $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega})=0$: the term adds no net power, so it never changes the rotational energy or $\dot V$. What they never needed to notice is that a term with zero net power can still move a lot of motion *between* axes. It takes nothing from the total and hands rate from one axis to another. That is exactly the handle you need on an axis with no motor.

In the language of nonlinear controllability, new directions reached this way — by combining the drift with the inputs, rather than by any single input alone — are generated by **[[Lie brackets|lie-bracket]]**. The worked example below is that abstract idea made concrete.

::: example Reaching the unactuated axis, four phases at a time
**The setup.** $\mathbf{J}=\mathrm{diag}(120,80,100)\,\mathrm{kg\,m^2}$, so $J_x\ne J_y$ on purpose. A rate servo runs on $x$ and $y$ only: $u_x = J_x k(\omega_{x,\mathrm{cmd}}-\omega_x)$ and the same for $y$, with $k=5\,\mathrm{s^{-1}}$ (it settles to a new rate in about a second). There is no $z$-torque. The servo is commanded through this square-wave sequence of $(\omega_x,\omega_y)$ targets, each held for $T=5\,\mathrm{s}$:

$$
(\Omega_0,0) \to (\Omega_0,\Omega_0) \to (0,\Omega_0) \to (0,0), \qquad \Omega_0=0.1\,\mathrm{rad/s} .
$$

After all four phases, $\omega_x$ and $\omega_y$ are both back to zero. On the axes you control, the maneuver ends where it started.

**The simulation.** Integrating the full nonlinear equations with a time step of $0.1\,\mathrm{ms}$:

| After cycle | $\omega_z$ | $\omega_x,\ \omega_y$ (should be back at 0) |
| --- | --- | --- |
| $1$ ($t=20\,\mathrm{s}$) | $0.019972\,\mathrm{rad/s}$ | below $10^{-11}\,\mathrm{rad/s}$ |
| $2$ ($t=40\,\mathrm{s}$) | $0.039879\,\mathrm{rad/s}$ | below $10^{-11}\,\mathrm{rad/s}$ |
| $3$ ($t=60\,\mathrm{s}$) | $0.059722\,\mathrm{rad/s}$ | below $10^{-11}\,\mathrm{rad/s}$ |

The two controlled rates return to zero every cycle, exactly as commanded. But $\omega_z$ does not go back. It grows by nearly the same step every cycle, about $0.0199\,\mathrm{rad/s}$, without a single newton-meter of torque about $z$.

**A hand estimate.** When is the product $\omega_x\omega_y$ not zero? In phase 1, $\omega_y=0$. In phase 3, $\omega_x=0$. In phase 4, both are zero. Only in phase 2 are both rates near $\Omega_0$ at once. So for the $5\,\mathrm{s}$ of phase 2,

$$
\dot\omega_z \approx \frac{J_x-J_y}{J_z}\,\Omega_0^2 = \frac{120-80}{100}\,(0.1)^2 = 0.4\times0.01 = 0.004\,\mathrm{rad/s^2},
$$

and multiplying by the $5\,\mathrm{s}$ it lasts,

$$
\Delta\omega_z \approx \frac{J_x-J_y}{J_z}\,\Omega_0^2\,T = 0.004\times5 = 0.0200\,\mathrm{rad/s} .
$$

The simulation gave $0.019972$ — within $0.14\%$ of a two-line estimate. The small gap comes from the other gyroscopic terms on $x$ and $y$ once $\omega_z$ is no longer zero; the servo has to fight them a little.

**The control experiment.** Repeat the identical maneuver with $J_x=J_y=100\,\mathrm{kg\,m^2}$ — a body symmetric about the unactuated axis. After one full cycle, $\omega_z$ is about $2\times10^{-18}\,\mathrm{rad/s}$: zero, to the rounding of the computer. The mechanism needs the lopsided inertia. Take it away and the third axis is, correctly, out of reach.

**Does it make sense?** One thing to watch: the attitude does not stay a clean spin about $z$ during all this. In phase 1 the body turns $0.1\times5=0.5\,\mathrm{rad}$ about $x$, so $x$ and $y$ swing through real angles along the way, even though their *rates* come back to zero. So this maneuver is a source of controlled spin on the unactuated axis, not a finished three-axis pointing maneuver on its own. It is the raw mechanism that a full underactuated attitude controller is built on — the way the reaching law was the raw mechanism that sliding-mode control built a full design around.
:::

::: note Why only phase 2 counts, exactly
Integrate the $z$-equation over one cycle: $J_z\,\Delta\omega_z = (J_x-J_y)\int\omega_x\omega_y\,dt$. With a perfect, instant servo, $\omega_x\omega_y$ is $\Omega_0^2$ during phase 2 and zero in the other three, so the integral is exactly $\Omega_0^2T$ and $\Delta\omega_z$ is exactly $0.0200\,\mathrm{rad/s}$. A real servo takes about a second to settle. In phase 2, $\omega_y$ is still climbing at the start, which loses a little of the product. In phase 3, $\omega_x$ is still dying away while $\omega_y$ is full, which wins back almost exactly the same amount. The two edges nearly cancel. That is why the estimate is so good even though the servo is far from instant.
:::

## Brockett's obstruction: reaching is not holding

Getting somewhere is not staying there. Think of balancing on a skateboard that can only roll forward and back: you can reach any spot on the pavement by a clever wiggle, but can a simple rule like "push opposite to your error" hold you still at one spot?

**[[Brockett's necessary condition|brockett]]** (Roger Brockett, 1983) asks exactly that. The question is sharper than controllability: can the system be held at a point by a feedback law $\mathbf{u}=k(\mathbf{x})$ that is only required to be **continuous** (no jumps) and **time-invariant** (the same rule at every instant, no clock inside)? Call a system that can be held that way **stabilizable** by continuous static feedback.

Here is the condition. Take $\dot{\mathbf{x}}=f(\mathbf{x},\mathbf{u})$, smooth, with an equilibrium at $\mathbf{x}_0$ when the input is zero: $f(\mathbf{x}_0,\mathbf{0})=\mathbf{0}$. If a continuous $k(\mathbf{x})$ makes $\mathbf{x}_0$ asymptotically stable, then the map $(\mathbf{x},\mathbf{u})\mapsto f(\mathbf{x},\mathbf{u})$ must send every neighborhood of $(\mathbf{x}_0,\mathbf{0})$ **onto** a neighborhood of $\mathbf{0}$. In words: every small velocity $\dot{\mathbf{x}}$, pointing in *any* direction, must be produced by *some* state and input close by. If some direction of $\dot{\mathbf{x}}$ is missing, no matter how near you look, then no continuous time-invariant law can do the holding.

Why? A stabilizing feedback must push back against small errors in every direction. If some nearby push is impossible, a smooth law runs out of room — the full proof is topological, but that is the idea.

::: example The nonholonomic integrator fails Brockett's test
The system is

$$
\dot{x}_1=u_1,\qquad \dot{x}_2=u_2,\qquad \dot{x}_3=x_1u_2-x_2u_1 .
$$

It is the standard textbook case for this obstruction, and a close cousin of the kinematics of a car that can drive and steer but cannot slide sideways — a **[[nonholonomic|nonholonomic]]** system.

**The test.** Near the origin, can $f(\mathbf{x},\mathbf{u})=(u_1,\ u_2,\ x_1u_2-x_2u_1)$ equal a small target $(0,\ 0,\ \varepsilon_3)$, with $\varepsilon_3\ne0$ ("epsilon three", any small nonzero number)?

- The first component must be $0$, so $u_1=0$.
- The second component must be $0$, so $u_2=0$.
- With both inputs zero, the third component is $x_1\cdot0-x_2\cdot0=0$, for *any* state $\mathbf{x}$. It can never equal $\varepsilon_3$.

So no nearby state-and-input pair produces $(0,0,\varepsilon_3)$. The image misses points as close to the origin as you like, along that one direction. Brockett's condition fails.

**The conclusion.** No continuous — let alone smooth — static state feedback stabilizes this system at the origin. And yet the system is completely controllable, by the same mechanism as the spacecraft example: drive $u_1$ and $u_2$ around a small loop and $x_3$ moves, the way driving $\omega_x$ and $\omega_y$ through their sequence moved $\omega_z$.
:::

The same obstruction has been proven for a rigid body with torque on only two axes: no continuous, time-invariant feedback asymptotically stabilizes a two-wheel spacecraft to a target attitude with zero rate.

Set that next to what the attitude lesson proved. There, the obstacle was **topological**: $SO(3)$, the space of all attitudes, is not contractible, so no continuous law can be *globally* stabilizing — it always fails somewhere far away. Here, the obstacle appears even *locally*, right next to the target, on a system that is not trying to cover a whole sphere. Two different proofs, one repeating shape: **reachability is not stabilizability**, and closing that gap costs you continuity every time.

::: key Brockett's necessary condition
If $\mathbf{u}=k(\mathbf{x})$, continuous, asymptotically stabilizes $\dot{\mathbf{x}}=f(\mathbf{x},\mathbf{u})$ at $\mathbf{x}_0$, then $f$ must map every neighborhood of $(\mathbf{x}_0,\mathbf{0})$ onto a neighborhood of $\mathbf{0}$. The condition is necessary, not sufficient. The nonholonomic integrator, and a two-axis-actuated rigid body, both fail this test while remaining fully controllable: they can be *driven* anywhere, by a suitably clever trajectory, but not *regulated* there by any fixed continuous law.
:::

## What actually flies

Continuity has to go, so every practical answer gives it up on purpose.

**Discontinuous or hybrid switching.** This is the same tool the unwinding fix used. Accept a control law that jumps — switching between sets of gains, or flipping a sign convention — at a chosen boundary, and design it so the jump never happens on a trajectory that matters. Underactuated spacecraft recovery modes often switch between a coarse-pointing law and a fine one as the state crosses a threshold, because no single continuous law covers both regimes cleanly.

**Time-varying feedback.** Brockett's condition talks only about *time-invariant* laws. Put a clock into the law — make the gains repeat periodically in time — and some systems that fail the test can be stabilized after all, the nonholonomic integrator among them. The idea goes back to **[[Claude Samson|time-varying]]**'s work on wheeled robots. The price: the design must be checked against a moving target instead of a fixed one, and convergence is slower than a well-behaved smooth law would give, if one existed.

**Passive gyroscopic stiffening.** Suppose the vehicle carries an angular momentum bias — a wheel still spinning even though its motor has failed, or the body itself spun up on purpose. The same $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$ coupling that reached the unactuated axis above now resists disturbances on the *other* two axes automatically, the way a **[[spinning top|spinning-top]]** resists being tipped over. That turns part of the underactuation problem into free stability. The cost is that the vehicle now *precesses* — its spin axis slowly wanders sideways — under a disturbance instead of sitting still. Many missions with a degraded wheel set have made this trade deliberately.

**Accept a smaller controlled subspace.** Drive the actuated coordinates directly — feedback-linearize them, if the model allows — and let the unactuated coordinate move under whatever dynamics that leaves it. That leftover motion is exactly the **[[zero dynamics|zero-dynamics]]** from the feedback-linearization lesson: the internal behavior of what you cannot command directly. An underactuated design lives or dies on whether that leftover motion is stable. It is the same reason a non-minimum-phase plant broke input-output linearization there. The two problems have the same shape: one comes from too few actuators, the other from cancelling too much of the model.

::: warning Controllable is not the same as capable
"Controllable" is a claim about where the system can *eventually* go. It says nothing about how fast, how directly, or with what kind of feedback. The maneuver above needed three full cycles — a whole minute of work on the other two axes — to build up a modest $0.06\,\mathrm{rad/s}$ on the unactuated axis. Usable, but nothing like the direct authority a working third wheel would give. Underactuated control recovers *reachability*, not the performance a full set of actuators bought you before one failed.
:::

## Check yourself

::: check
Why does the mechanism in the worked example need $J_x \ne J_y$? What happens physically if the body is close to symmetric about $z$, but not exactly?
:::

::: answer
The coupling term is $(J_x-J_y)\,\omega_x\omega_y$. With $J_x=J_y$ it is zero no matter how $\omega_x$ and $\omega_y$ are driven — which is what the simulation showed, down to rounding error.

A nearly symmetric body does not lose the mechanism, only its strength. The same maneuver produces a $\Delta\omega_z$ scaled by how small $J_x-J_y$ is. For example, with $J_x-J_y=4\,\mathrm{kg\,m^2}$ instead of $40$, each cycle buys a tenth as much. So gaining authority on a near-symmetric vehicle costs proportionally more cycles, or a larger $\Omega_0$ (the gain grows as $\Omega_0^2$), for the same result.
:::

::: check
A colleague says the worked-example maneuver "proves the two-wheel spacecraft is controllable." What is missing from that claim?
:::

::: answer
The maneuver shows *reachability* along one specific path, in one direction, with an estimate of how much rate it buys per cycle. That is real evidence, but not a proof of full controllability. A proof would have to show that *every* direction in the state space can be reached — or invoke the general rank condition on Lie brackets that this example is one concrete instance of.

It also says nothing about *stabilizability*. Brockett's condition, separately, rules out a continuous static feedback doing the holding, even once controllability is granted.
:::

::: check
Restate Brockett's condition in terms of what it does *not* rule out, given that the nonholonomic integrator is a standard, solved control problem in practice.
:::

::: answer
It rules out only laws that are all three of: continuous, time-invariant, and static state feedback. Every practical car-steering controller breaks one of those three on purpose. Parallel parking is a time-varying (or explicitly staged, switching) sequence of maneuvers, not one fixed rule evaluated at each instant.

Brockett's theorem says that particular restricted class cannot do the job. It does not say the job is impossible. The remedies in this lesson are exactly the ways engineers give up one of the three restrictions deliberately.
:::

::: check
How is the zero-dynamics idea from feedback linearization the same underlying idea as underactuation, rather than a coincidence of words?
:::

::: answer
Both describe a split between what a control law commands directly and what is left to move on its own.

In input-output feedback linearization, you *choose* the split: you decide which output to control, and you inherit whatever internal dynamics that choice leaves uncontrolled. In underactuation, the hardware *imposes* the split: the set of actuators decides it for you.

In both cases the design is only as good as the stability of the part you did not touch. An unstable leftover — unstable zero dynamics there, an unstable unactuated axis here — is the same failure wearing two names.
:::

::: check
Why is passive gyroscopic stiffening not "free" performance recovery, and what does a mission accept in exchange for it?
:::

::: answer
The stiffening comes from the vehicle's own angular momentum. That is a physical quantity, not a gain you can turn up. You cannot increase it without spending propellant or accepting a faster spin.

It also stiffens only the two axes across the spin. It gives up any hope of holding the spin axis still, because that axis's own momentum is what is doing the stabilizing. A disturbance makes the spin axis precess instead of being corrected. So the mission accepts slow precession in a disturbance-driven direction in exchange for automatic, control-free stability on the other two axes — a genuine trade, not a loophole.
:::

::: check
In the worked example, how much would $\omega_z$ grow per cycle if you doubled $\Omega_0$ to $0.2\,\mathrm{rad/s}$ but kept $T=5\,\mathrm{s}$? And if instead you held phase 2 for $10\,\mathrm{s}$ with $\Omega_0=0.1\,\mathrm{rad/s}$?
:::

::: answer
The estimate is $\Delta\omega_z\approx\dfrac{J_x-J_y}{J_z}\,\Omega_0^2\,T$.

Doubling $\Omega_0$: $\Omega_0^2$ goes from $0.01$ to $0.04$, four times bigger, so $\Delta\omega_z\approx0.4\times0.04\times5=0.080\,\mathrm{rad/s}$ per cycle.

Doubling the time in phase 2 instead: $\Delta\omega_z\approx0.4\times0.01\times10=0.040\,\mathrm{rad/s}$, twice as much.

Faster rates pay off more than longer holds: the gain is quadratic in $\Omega_0$, linear in $T$. The limit is how much rate the wheels and pointing constraints allow on $x$ and $y$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Underactuated | Fewer independent inputs than coordinates needing control |
| Degree of underactuation | How many inputs you are short |
| $J_z\dot\omega_z=(J_x-J_y)\,\omega_x\omega_y$ | Coupling into an unactuated axis; needs $J_x\ne J_y$ |
| $\Delta\omega_z\approx\frac{J_x-J_y}{J_z}\Omega_0^2T$ | Rate gained per four-phase cycle |
| $\mathbf{J}=\mathrm{diag}(120,80,100)$, $\Omega_0=0.1$, $T=5\,\mathrm s$ | $\Delta\omega_z\approx0.0199\,\mathrm{rad/s}$ per cycle simulated, vs $0.0200$ estimate |
| $J_x=J_y$ | Coupling vanishes to rounding error; the axis is genuinely unreachable |
| Brockett's condition | Continuous stabilizing feedback needs $f$ to map neighborhoods of $(\mathbf x_0,\mathbf 0)$ onto neighborhoods of $\mathbf 0$; necessary, not sufficient |
| Nonholonomic integrator | $\dot x_3=x_1u_2-x_2u_1$; controllable, fails Brockett, no continuous static law stabilizes it |
| Two-axis rigid body | Same obstruction, proven for underactuated spacecraft attitude |
| Remedies | Discontinuous or hybrid switching; time-varying feedback; passive gyroscopic bias; accept a smaller controlled subspace |
| Zero dynamics | The uncommanded coordinate's leftover dynamics decides whether any of this works |

Every remedy here still needs an actuator that can deliver the commanded torque at all. The actuators behind most attitude control — thrusters especially — do not deliver a smooth torque in the first place. They are on or off. The next lesson is where that stops being a simplifying assumption and becomes the thing you design around.

::: context kepler-two-wheels Kepler on two wheels
NASA's Kepler space telescope, launched in 2009 to hunt for planets around other stars, carried four reaction wheels and needed three to point. One failed in 2012 and a second in May 2013, ending the original mission.

Engineers found a way to keep going. They pointed the telescope so that sunlight pressed evenly on its solar panels, and used that gentle push from sunlight, balanced like a pencil on a fingertip, as a stand-in for the missing third wheel, with small thruster firings to clean up. The new mission, called K2, ran from 2014 until the spacecraft ran out of fuel in 2018. It is a real example of flying an underactuated vehicle by borrowing a force the hardware never provided.
:::

::: context degree-of-freedom Counting the ways to move
A **degree of freedom** is one independent way something can move. A bead on a wire has one: along the wire. A hockey puck on ice has three: slide left-right, slide forward-back, and spin.

A rigid spacecraft's attitude has three rotational degrees of freedom — roll, pitch and yaw, or turning about $x$, $y$ and $z$. Counting degrees of freedom and counting actuators is the quickest first check on any vehicle. If the second number is smaller, the vehicle is underactuated, and every control you get on the missing ones must come through coupling.
:::

::: context tennis-racket The same equation flips a tennis racket
Set all torques to zero and Euler's equations become three lines like $J_z\dot\omega_z=(J_x-J_y)\,\omega_x\omega_y$, one for each axis. Those torque-free lines explain a famous trick: toss a tennis racket or a phone spinning about its middle axis, and it flips over by itself partway through the flight.

That flip is rate being moved between axes by the product terms — the same mechanism this lesson steers on purpose. On a phone, nothing controls it, so the rate trades back and forth wildly. With a servo on two axes, you choose the product $\omega_x\omega_y$ and so choose how much rate lands on the third.
:::

::: context lie-bracket What a Lie bracket measures
Try this with a car. Drive forward a little, steer left, reverse a little, steer right, and repeat. None of the individual moves slides the car sideways, yet after a few rounds the car has shifted sideways. The net motion comes from doing two moves *in combination*, not from either alone.

A **Lie bracket** (after the Norwegian mathematician Sophus Lie, said "lee") is the formula that computes that net direction from two vector fields. The rule that says a system is controllable if its input directions and all their brackets together span every direction is called the Lie algebra rank condition.

The picture below shows the ideal version of this lesson's maneuver. Only the stretch where both controlled rates are high at once feeds the third axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3">
    <line x1="115" y1="22" x2="115" y2="178"/><line x1="190" y1="22" x2="190" y2="178"/><line x1="265" y1="22" x2="265" y2="178"/>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="77" y="16">phase 1</text><text x="152" y="16">phase 2</text><text x="227" y="16">phase 3</text><text x="302" y="16">phase 4</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1">
    <line x1="40" y1="65" x2="340" y2="65"/><line x1="40" y1="115" x2="340" y2="115"/><line x1="40" y1="170" x2="340" y2="170"/>
  </g>
  <polyline points="40,65 40,35 190,35 190,65 340,65" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="40,115 115,115 115,85 265,85 265,115 340,115" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="40,170 115,170 190,140 340,140" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <rect x="115" y="30" width="75" height="145" fill="#f2b880" fill-opacity="0.25"/>
  <g font-size="12" fill="#1f2a44" text-anchor="end">
    <text x="34" y="54">ωx</text><text x="34" y="104">ωy</text><text x="34" y="160">ωz</text>
  </g>
  <text x="300" y="134" font-size="11" fill="#b4232c" text-anchor="middle">+0.02 rad/s</text>
  <text x="190" y="194" font-size="11" fill="#1f2a44" text-anchor="middle">time: four phases of 5 s each</text>
</svg>
```
:::

::: context brockett Who Brockett is
Roger Brockett, a control theorist at Harvard, published this condition in 1983 in a paper on asymptotic stability and feedback stabilization. It surprised people because the systems it ruled out — cars, wheeled robots, underactuated spacecraft — were known to be fully controllable.

The result changed how the field worked on such systems. Instead of hunting for a clever smooth law, researchers accepted that one could not exist and turned to switching laws, time-varying laws and planned maneuvers. Much of the robotics research on steering wheeled vehicles in the following decade grew out of that shift.
:::

::: context nonholonomic A car cannot slide sideways
**Nonholonomic** describes a limit on how fast you can move in some direction that does *not* limit where you can end up. A car's wheels roll forward and back but will not skid sideways, so at any instant its sideways velocity is zero. Still, by parallel parking, the car can end up anywhere, facing any way.

Compare a train on a track: it cannot leave the track at all, so its limit shrinks the set of places it can reach. That kind of limit is called holonomic. The word comes from Greek roots meaning roughly "whole law" — a holonomic rule constrains the whole position, a nonholonomic one only the velocity.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="55" width="100" height="44" rx="8" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <g fill="#1f2a44">
    <rect x="142" y="47" width="20" height="8"/><rect x="198" y="47" width="20" height="8"/>
    <rect x="142" y="99" width="20" height="8"/><rect x="198" y="99" width="20" height="8"/>
  </g>
  <line x1="232" y1="77" x2="300" y2="77" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="310,77 298,71 298,83" fill="#1d6fd1"/>
  <line x1="128" y1="77" x2="60" y2="77" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="50,77 62,71 62,83" fill="#1d6fd1"/>
  <text x="305" y="100" font-size="12" fill="#1d6fd1" text-anchor="middle">drive</text>
  <text x="55" y="100" font-size="12" fill="#1d6fd1" text-anchor="middle">reverse</text>
  <line x1="180" y1="45" x2="180" y2="14" stroke="#b4232c" stroke-width="3" stroke-dasharray="5,4"/>
  <line x1="170" y1="16" x2="190" y2="32" stroke="#b4232c" stroke-width="3"/>
  <line x1="190" y1="16" x2="170" y2="32" stroke="#b4232c" stroke-width="3"/>
  <text x="250" y="24" font-size="12" fill="#b4232c" text-anchor="middle">no sideways slide</text>
  <text x="180" y="132" font-size="12" fill="#1f2a44" text-anchor="middle">yet parallel parking reaches any spot</text>
</svg>
```
:::

::: context time-varying A law with a clock in it
In the early 1990s Claude Samson showed that a wheeled robot, which fails Brockett's test, can be steered to a parking spot by a feedback law whose gains wiggle periodically in time. Jean-Michel Coron then proved that this works in general for a large class of controllable systems with no drift.

The intuition: a time-varying law keeps "stirring" the inputs in little loops, like the forward-steer-reverse-steer shuffle of parallel parking. Those loops reach the missing direction through Lie brackets. A fixed rule cannot stir, because at the target it must output one single value.
:::

::: context spinning-top Why spin makes things steady
A bicycle wheel spinning fast is hard to tip. Push on its axle and it does not fall toward the push. Instead the axle swings slowly sideways — it **precesses**. The faster it spins, the smaller and slower that swing.

A spacecraft with a spinning wheel inside, or a spinning body, works the same way. Small disturbance torques only nudge the spin axis slowly around. For decades many communications satellites held their pitch axis this way with one big momentum wheel, and used small torques only for the slow corrections. The stiffness is real, but so is the drift: nothing brings the axis back unless something pushes it.

The rule behind it is $\dot{\mathbf{H}}=\boldsymbol{\tau}$: a torque changes the angular momentum $\mathbf{H}$ *in the direction of the torque*. When $\mathbf{H}$ is large, a small torque only tilts it by a small angle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="280" y2="120" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="292,120 278,113 278,127" fill="#1d6fd1"/>
  <text x="160" y="142" font-size="12" fill="#1d6fd1" text-anchor="middle">spin momentum H (large)</text>
  <line x1="292" y1="120" x2="292" y2="68" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="292,58 286,70 298,70" fill="#b4232c"/>
  <text x="300" y="80" font-size="12" fill="#b4232c">τ Δt</text>
  <line x1="40" y1="120" x2="283" y2="61" stroke="#1f2a44" stroke-width="2" stroke-dasharray="6,4"/>
  <polygon points="292,58 279,57 282,69" fill="#1f2a44"/>
  <text x="150" y="70" font-size="12" fill="#1f2a44" text-anchor="middle">new H: tilted toward τ</text>
  <text x="180" y="162" font-size="11" fill="#6c7a93" text-anchor="middle">the bigger H is, the smaller the tilt</text>
</svg>
```
:::

::: context zero-dynamics A bridge back to feedback linearization
In the feedback-linearization lesson you held a chosen output at zero and asked what the remaining states did. Those were the zero dynamics. If they were unstable, the design was unusable, no matter how perfect the output looked.

An underactuated vehicle forces the same question on you. Hold the two wheel-controlled axes exactly where you want them. What does the third axis do on its own? If it drifts away, your fine-looking controller is hiding a slow failure. Checking that leftover motion first is the habit that saves the design.
:::
