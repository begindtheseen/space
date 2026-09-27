---
id: l08-cheap-control-and-the-symmetric-root-locus
title: Cheap control and the asymptotic (Kalman) root locus
minutes: 22
covers:
  - Cheap control and the asymptotic (Kalman) root locus
---

Imagine a thermostat with a single dial marked "how much do you care about the electric bill?" Turn it all the way to "a lot" and the heater barely runs. Turn it all the way to "not at all" and the heater blasts at full power the moment the room drifts. Somewhere in between is the setting you actually want. But it is worth knowing what happens at the two ends of the dial, because the ends tell you what the heater *can* and *cannot* ever do.

In LQR, that dial is the control weight $\mathbf{R}$. The tuning lesson swept it and traced a frontier of designs. This lesson asks what sits at each end of the frontier. At the **expensive** end, where control is nearly forbidden, the closed-loop poles go somewhere specific and predictable. At the **cheap** end, where control is nearly free, they go somewhere else. And whether that somewhere is "arbitrarily fast" or "stuck against a wall" is decided by a property of the plant that no amount of actuator authority can change.

That wall is the practical payoff. A **right-half-plane zero** puts a hard ceiling on how fast any controller can make the loop. LQR is the cleanest place to see it, because the optimizer is by construction doing the best that can be done. If the optimal closed loop refuses to go faster as control gets cheaper, nothing else will either. When a program asks why the drift loop cannot be sped up, or why a flexible vehicle with a badly placed sensor cannot be tightened, the answer is usually a zero. The argument below is how you *demonstrate* it rather than assert it.

The tool is a [[root locus|root-locus-recap]] in which the thing being varied is the control weight. It is called the **symmetric root locus**, or the **Kalman root locus** after the return-difference identity it comes from.

## The symmetric root locus

Take a single-input plant. Write the state weight as $\mathbf{Q} = \mathbf{C}_z^\top\mathbf{C}_z$, where $\mathbf{C}_z$ picks out a made-up output $z = \mathbf{C}_z\mathbf{x}$ — the combination of states the cost penalizes. Write the control weight as a single number, $R = \rho$ ("rho"). The transfer function from the input to that made-up output is

$$
G(s) = \mathbf{C}_z(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} = \frac{b(s)}{a(s)}, \qquad a(s) = \det(s\mathbf{I}-\mathbf{A}).
$$

So $a(s)$ is the plant's characteristic polynomial — its roots are the open-loop poles — and $b(s)$ is the numerator, whose roots are the zeros.

Here is the headline result, before the derivation:

> **The LQR closed-loop poles are the $n$ left-half-plane roots of $\rho\,a(s)a(-s) + b(s)b(-s) = 0$.**

This is the **symmetric root locus equation**. It is a polynomial of degree $2n$. Whenever $s$ is a root, so is $-s$, because swapping $s$ for $-s$ leaves the expression unchanged. And since its coefficients are real, complex roots come in conjugate pairs. So the $2n$ roots form a pattern that is **symmetric about both axes** — hence the name. The optimal closed loop takes the half that lies in the left half plane.

::: note Why it has to be true
Start from the return-difference identity of the margins lesson, which holds for any complex $s$:

$$
\big[\mathbf{I}+\mathbf{L}(-s)\big]^\top R\big[\mathbf{I}+\mathbf{L}(s)\big] = R + G(-s)G(s).
$$

Next, a determinant fact: $\det\big(\mathbf{I} + \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}\big) = \det(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K})/\det(s\mathbf{I}-\mathbf{A})$. For one input this reads $1 + L(s) = \chi_{cl}(s)/a(s)$, where $\chi_{cl}$ ("chi c-l") is the closed-loop characteristic polynomial, whose roots are the closed-loop poles.

Substitute that into the identity, with $R = \rho$ and $G = b/a$:

$$
\rho\,\frac{\chi_{cl}(-s)}{a(-s)}\cdot\frac{\chi_{cl}(s)}{a(s)} = \rho + \frac{b(-s)b(s)}{a(-s)a(s)}.
$$

Multiply both sides by $a(s)a(-s)$ to clear the fractions:

$$
\rho\,\chi_{cl}(s)\,\chi_{cl}(-s) = \rho\,a(s)a(-s) + b(s)b(-s).
$$

The left side has as its roots the closed-loop poles *and their mirror images*. The closed loop is stable, so its poles are the left-half-plane ones.
:::

Divide the equation by $\rho\,a(s)a(-s)$ and it takes the classical root-locus form

$$
1 + \frac{1}{\rho}G(s)G(-s) = 0,
$$

a locus in the gain $1/\rho$. Its "open-loop poles" are the plant poles and their mirrors. Its "open-loop zeros" are the plant zeros and their mirrors. Everything you know about sketching a root locus now applies, and the two ends of the dial can be read straight off.

## The expensive-control limit

Let $\rho \to \infty$: control is very expensive. The term $\rho\,a(s)a(-s)$ swamps everything else, so the roots approach the roots of $a(s)a(-s)$ — the open-loop poles and their [[reflections|reflection-picture]]. Keep the left-half-plane ones:

> Stable open-loop poles stay where they are. Unstable open-loop poles are **reflected** across the imaginary axis.

This makes physical sense. If control is nearly worthless, do nothing. But "nothing" is not allowed for an unstable mode, because an unstable mode grows without limit and so does its cost. The cheapest legal move is to shift that mode to its own mirror image.

::: example Expensive control on an unstable launch vehicle
The pitch plane at maximum dynamic pressure, from the first lesson, has open-loop poles $-0.699622$ and $+0.693366\,\mathrm{s^{-1}}$. The positive one is the aerodynamic instability. Penalize angle of attack only ($\mathbf{C}_z = [1\ \ 0]$) and sweep $\rho$:

| $\rho$ | $\mathbf{K}$ | closed-loop poles $(\mathrm{s^{-1}})$ |
| --- | --- | --- |
| $10^{-2}$ | $(-10.062,\ -1.730)$ | $-5.819 \pm 5.777j$ |
| $1$ | $(-1.0712,\ -0.5645)$ | $-1.901 \pm 1.769j$ |
| $10^{2}$ | $(-0.1940,\ -0.2402)$ | $-0.811 \pm 0.415j$ |
| $10^{4}$ | $(-0.1437,\ -0.2068)$ | $-0.698 \pm 0.048j$ |
| $10^{8}$ | $(-0.1430,\ -0.2063)$ | $-0.6934,\ -0.6996$ |

At $\rho = 10^{8}$ the poles are $-0.6934$ and $-0.6996$. The first is the mirror image of the unstable pole $+0.693366$. The second is the stable pole $-0.699622$, left alone. Both match to four digits.

Now look at the gain column. It does **not** go to zero as $\rho \to \infty$. It settles at $(-0.1430,\ -0.2063)$, the smallest feedback that stabilizes this plant in the mirror-image sense. Sanity check: if the gain did go to zero, the rocket would be flying open loop, and it is unstable — so a nonzero floor is exactly what we should see. An unstable vehicle always costs something to fly.
:::

## The cheap-control limit

Now let $\rho \to 0$: control is almost free. Two numbers matter. Let $n = \deg a$ (the number of poles) and $m = \deg b$ (the number of zeros). The difference $n - m$ is the **[[relative degree|relative-degree]]**. The roots split into two groups that behave differently.

**The ones that stay finite.** At $\rho = 0$ the equation becomes $b(s)b(-s) = 0$, whose roots are the zeros of $G$ and their reflections. Taking the left-half-plane ones:

> $m$ closed-loop poles approach the **[[minimum-phase|minimum-phase-word]] zeros** of $G$ and the **reflections of its right-half-plane zeros**.

**The ones that run away.** The other $n-m$ roots must head off to infinity. Far from the origin only the highest powers matter. With leading coefficients $a_n$ and $b_m$, the equation becomes $\rho\,(-1)^n a_n^2 s^{2n} + (-1)^m b_m^2 s^{2m} \approx 0$. Divide by $s^{2m}$ and solve:

$$
s^{2(n-m)} = -\frac{(-1)^{n-m}\,b_m^2}{\rho\,a_n^2},
\qquad |s| = \left(\frac{|b_m|}{|a_n|\sqrt{\rho}}\right)^{1/(n-m)} .
$$

The $2(n-m)$ solutions sit evenly spaced on a circle of that radius. The $n-m$ in the left half plane form a **[[Butterworth pattern|butterworth]]** of order $n-m$:

- relative degree two: a pair at $\pm135^\circ$ from the positive real axis, damping $\zeta = 1/\sqrt2 = 0.7071$;
- relative degree three: one real pole and a pair at $\pm120^\circ$, damping $\zeta = 0.5$;
- and so on, spreading out around the left half of the circle.

(Here $\zeta$, "zeta", is the damping ratio: $1$ is no overshoot, and smaller values ring more.)

This is where the $0.707$ that kept showing up in the tuning lesson comes from. There, the double integrator's damping sat near $0.707$ once the rate penalty stopped mattering. With only the angle penalized, the relative degree is two, and a Butterworth pair at $0.707$ is forced. Nobody chose it.

::: key Cheap control limit
As $\mathbf{R} \to \mathbf{0}$, the minimum-phase closed-loop poles run to infinity along a Butterworth pattern while poles mirror any right-half-plane zeros. A non-minimum-phase plant therefore has a hard performance ceiling no matter how cheap control is.
:::

::: example The double integrator: Butterworth, and a cost that goes to zero
Use the wheel axis: $\mathbf{A} = \begin{bmatrix}0&1\\0&0\end{bmatrix}$, $\mathbf{B} = (0,\ 1/J)^\top$ with $J = 120\,\mathrm{kg\,m^2}$, and $\mathbf{C}_z = [1\ \ 0]$. Then $G(s) = (1/J)/s^2$, so $a(s) = s^2$, $b(s) = 1/J$, $n = 2$ and $m = 0$.

Step 1, build the locus equation. $a(s)a(-s) = s^2 \cdot s^2 = s^4$ and $b(s)b(-s) = 1/J^2$, so

$$
\rho\,s^4 + \frac{1}{J^2} = 0 \qquad\Longrightarrow\qquad |s| = \left(\frac{1}{\rho J^2}\right)^{1/4}.
$$

Step 2, find the angles. $s^4$ must be a negative real number, so the four roots sit at $45^\circ$, $135^\circ$, $225^\circ$ and $315^\circ$. The two in the left half plane, at $135^\circ$ and $225^\circ$, have $\zeta = \cos45^\circ = 0.7071$.

Step 3, check against the Riccati solver. The last column is the optimal cost from a $5^\circ$ starting error, $\mathbf{x}_0^\top\mathbf{P}\mathbf{x}_0$:

| $\rho$ | closed-loop poles $(\mathrm{s^{-1}})$ | $\lvert s\rvert$ | predicted $\lvert s\rvert$ | $\zeta$ | cost from $5^\circ$ |
| --- | --- | --- | --- | --- | --- |
| $10^{2}$ | $-0.0204 \pm 0.0204j$ | $0.02887$ | $0.02887$ | $0.70711$ | $3.73\times10^{-1}$ |
| $1$ | $-0.0645 \pm 0.0645j$ | $0.09129$ | $0.09129$ | $0.70711$ | $1.18\times10^{-1}$ |
| $10^{-4}$ | $-0.6455 \pm 0.6455j$ | $0.9129$ | $0.9129$ | $0.70711$ | $1.18\times10^{-2}$ |
| $10^{-8}$ | $-6.455 \pm 6.455j$ | $9.1287$ | $9.1287$ | $0.70711$ | $1.18\times10^{-3}$ |

For example at $\rho = 1$: $1/(1 \times 120^2) = 6.944\times10^{-5}$, and its fourth root is $0.09129$. Every prediction is exact.

Three things to take away.

1. **Bandwidth grows as $\rho^{-1/4}$.** Each factor of $10^4$ in $\rho$ moves the poles out by a factor of $10$. That is the fourth-root law from the tuning lesson, now derived rather than observed.
2. **The damping is pinned at $0.7071$** for every $\rho$, because the relative degree is two and nothing else.
3. **The cost falls as $\rho^{1/4}$, toward zero.** With unlimited authority this plant can be regulated perfectly. That is what a minimum-phase plant offers.
:::

## Non-minimum phase: the wall

A right-half-plane zero changes the ending. The finite poles now go to the *reflections* of the right-half-plane zeros. Those locations are fixed by the plant, not by the weights. However small $\rho$ becomes, a closed-loop pole sits at $-|s_z|$, where $s_z$ is the zero's location, and the response can be no faster than that pole allows. The cost stops falling too, at a floor above zero.

::: example Lateral drift of a launch vehicle
To move sideways, a rocket must first tilt. To tilt, it must swing its engine. And swinging the engine pushes the tail sideways — which shoves the whole rocket the *wrong way* first. That [[wrong-way start|wrong-way-start]] is the signature of a right-half-plane zero, and here it comes from the geometry, not from any modeling error.

Take states $\mathbf{x} = (z, \dot z, \theta, \dot\theta)$, with $z$ the sideways displacement, $\theta$ the pitch angle, and $\delta$ the gimbal deflection. Use thrust $T = 7.6\times10^{6}\,\mathrm{N}$, mass $m = 3.2\times10^{5}\,\mathrm{kg}$, gimbal arm $\ell = 23\,\mathrm{m}$ (the distance from the gimbal to the center of mass), and pitch inertia $J = 2.6\times10^{7}\,\mathrm{kg\,m^2}$. Then

$$
\ddot z = \frac{T}{m}(\theta - \delta) = 23.75(\theta-\delta), \qquad \ddot\theta = \frac{T\ell}{J}\delta = 6.7231\,\delta .
$$

Check the numbers: $7.6\times10^6 / 3.2\times10^5 = 23.75\,\mathrm{m/s^2}$, and $7.6\times10^6 \times 23 / 2.6\times10^7 = 6.7231\,\mathrm{s^{-2}}$.

Take Laplace transforms, which turn $\ddot\theta$ into $s^2\theta$. From the second equation $\theta = 6.7231\,\delta/s^2$. Put that into the first and collect terms:

$$
\frac{z(s)}{\delta(s)} = \frac{T}{m}\cdot\frac{T\ell/J - s^2}{s^4},
$$

with zeros at $s = \pm\sqrt{T\ell/J} = \pm 2.59289\,\mathrm{s^{-1}}$. Call the positive one $s_z = 2.59289\,\mathrm{s^{-1}}$. It is the wall.

Penalize drift alone ($\mathbf{C}_z = [1\ 0\ 0\ 0]$), sweep $\rho$, and use a $50\,\mathrm{m}$ sideways dispersion, $z_0 = 50\,\mathrm{m}$, as the starting error:

| $\rho$ | closed-loop poles $(\mathrm{s^{-1}})$ | cost $(\mathrm{m^2\,s})$ |
| --- | --- | --- |
| $10^{2}$ | $-1.722\pm0.513j$, $-1.059\pm1.956j$ | $3737$ |
| $1$ | $-3.153\pm3.993j$, $-2.467\pm0.290j$ | $2608$ |
| $10^{-2}$ | $-10.75\pm11.06j$, $-2.591\pm0.037j$ | $2155$ |
| $10^{-4}$ | $-34.41\pm34.51j$, $-2.5929\pm0.004j$ | $2001$ |
| $10^{-6}$ | $-108.96\pm108.99j$, $-2.5929$ (double) | $1951$ |
| $10^{-8}$ | $-344.60\pm344.61j$, $-2.5929$ (double) | $1936$ |

Two poles run off to infinity. The relative degree is $4 - 2 = 2$, so they form a Butterworth pair at $\zeta = 0.707$ with radius $|s| = \big((T/m)^2/\rho\big)^{1/4}$. At $\rho = 10^{-8}$ that predicts $\sqrt{23.75}/0.01 = 487.3$. The computed poles give $\sqrt{344.60^2+344.61^2} = 487.3$. They agree.

The other two poles stop dead at $-2.5929$ and refuse to move, however much authority is offered. Both zeros put a pole there: the left-half-plane zero $-2.5929$ directly, and the right-half-plane zero $+2.5929$ by reflection.

The cost stops too. The costs shrink by smaller and smaller steps: $2155$, $2001$, $1951$, $1936$. Extrapolating the sequence to $\rho = 0$ (it is close to a straight line in $\rho^{1/4}$) gives a floor of

$$
\text{cost}_{\min} = \frac{2 z_0^2}{s_z} = \frac{2 \times 50^2}{2.59289} = 1928\,\mathrm{m^2\,s},
$$

and the extrapolated $P_{11}$ is $0.771326$ against $2/s_z = 0.771340$ — five-digit agreement. Unlike the double integrator, this plant cannot be regulated perfectly at any price, and the size of what is left over is set entirely by where the zero is.

What this means for design: as a common rule of thumb, a closed-loop bandwidth beyond about half the zero frequency cannot be reached, so the drift loop is capped near $1.3\,\mathrm{rad/s}$. Real launch vehicles run their drift loops far slower than that, around $0.1$ to $0.3\,\mathrm{rad/s}$, so on this vehicle the zero is not the limit that bites first — the bending modes are. The skill is knowing which wall you are up against, because raising gains helps with neither.
:::

::: warning "Cheap control" is a limit, not a design
Nothing in this lesson says to set $\rho = 10^{-8}$. At that value the double integrator's closed-loop poles are $9.13\,\mathrm{rad/s}$ from the origin and its angle gain is $\sqrt{q_1/\rho} = 10^{4}$ (with $q_1 = 1$ here), so a one-milliradian attitude error commands $10\,\mathrm{N\,m}$. Three things break before the mathematics does. The actuator saturates. The unmodeled flexible modes now sit inside the new bandwidth and get excited instead of ignored. And sensor noise is amplified by the same factor as the signal. The asymptotic locus is a *diagnostic*: it tells you where the limits are and what kind of limit you face. The design itself lives in the middle of the sweep, not at the ends.
:::

::: note Where right-half-plane zeros come from on real vehicles
They are usually geometry, not modeling error. A rocket steering by gimbal has one at $\sqrt{T\ell/J}$, because the sideways engine force and the turning moment it produces start out pushing opposite ways. An aircraft commanding altitude with its elevator has one, because the tail must push down before the wing lifts. A flexible vehicle whose rate gyro sits on the wrong side of a [[mode-shape node|mode-node]] has one, and moving the sensor a meter can move the zero from the right half plane to the left. A boiler, a bicycle steered by countersteering, and a hard-disk arm all have them. The common signature is a first response in the wrong direction, and the size of that wrong-way dip is directly tied to how hard the bandwidth limit bites.
:::

## Check yourself

::: check
Derive the symmetric root locus equation for a plant $G(s) = b(s)/a(s)$ and explain why the locus is symmetric about both axes.
:::

::: answer
Start from the return-difference identity $[1+L(-s)]\,\rho\,[1+L(s)] = \rho + G(-s)G(s)$.

Substitute $1+L(s) = \chi_{cl}(s)/a(s)$. That comes from $\det(\mathbf{I}+\mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}) = \det(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K})/\det(s\mathbf{I}-\mathbf{A})$.

Multiply through by $a(s)a(-s)$ to get $\rho\chi_{cl}(s)\chi_{cl}(-s) = \rho a(s)a(-s) + b(s)b(-s)$.

Symmetry about the imaginary axis is built in. The right-hand side is unchanged when $s$ is replaced by $-s$, since each factor appears with both arguments, so roots come in $\pm$ pairs. Symmetry about the real axis is the usual consequence of real coefficients, which give conjugate pairs. Together, the $2n$ roots form a pattern symmetric about both axes, and the optimal closed loop takes the left-hand half.
:::

::: check
A plant has relative degree three. Sketch where the cheap-control poles go and give the damping ratios.
:::

::: answer
Three poles run to infinity on a circle of radius $\big(|b_m|/(|a_n|\sqrt\rho)\big)^{1/3}$. The six equally spaced roots on that circle form a regular hexagon, and the optimal loop takes its left half — the third-order Butterworth pattern:

- one pole on the negative real axis, at $180^\circ$;
- a complex pair at $\pm120^\circ$ from the positive real axis.

The real pole has $\zeta = 1$ by definition. The complex pair has $\zeta = -\cos(120^\circ) = 0.5$. The remaining $n-3$ poles go to the minimum-phase zeros and to the reflections of any right-half-plane zeros.

Practical note: $\zeta = 0.5$ is lightly damped, about $16\,\%$ overshoot. So a high relative degree plus cheap control gives a ringing response — one more reason the cheap end of the sweep is not where designs live.
:::

::: check
The drift example's cost floor was $2z_0^2/s_z$. What does that formula say about where to put the gimbal, and is it good advice?
:::

::: answer
The zero is at $s_z = \sqrt{T\ell/J}$, so the floor is $2z_0^2/s_z = 2z_0^2\sqrt{J/(T\ell)}$. It falls as the gimbal arm $\ell$ grows. A longer arm pushes the zero farther from the origin, deeper into the right half plane, and that relaxes the limit.

Numerically, doubling $\ell$ from $23$ to $46\,\mathrm{m}$ moves the zero from $2.593$ to $3.667\,\mathrm{s^{-1}}$ and lowers the floor from $1928$ to $1363\,\mathrm{m^2\,s}$.

As advice it is nearly useless. $\ell$ is the distance from the gimbal to the center of mass, set by the vehicle's layout and by where the propellant is as it drains — not by the control engineer. What the formula is really good for is telling you what the limit *is*. Then, when the drift loop cannot be tightened, you know whether you are up against the zero, the actuator, or a bending mode, and you stop trying to fix the wrong one.
:::

::: check
Why does the expensive-control limit reflect unstable poles rather than leaving them or moving them somewhere else?
:::

::: answer
As $\rho \to \infty$ the locus equation becomes $a(s)a(-s) = 0$. Its roots are the open-loop poles together with their negatives — nothing else is on the list.

The optimal closed loop must be stable, so it picks the left-half-plane members of that set. Every stable open-loop pole is already there and is kept. For each unstable pole $p$, the only left-half-plane root of the pair $\pm p$ is $-p$. There is no third option, because the set of limiting roots is fixed by the plant alone.

The physical reading: the cheapest stabilizing action against an unstable mode moves it as little as this cost allows, and that lands exactly on the mirror image. Numerically, $+0.693366$ became $-0.6934$, and the stable $-0.699622$ stayed at $-0.6996$.
:::

::: check
Your flexible spacecraft has a rate gyro placed so that the first bending mode gives the attitude loop a right-half-plane zero at $8\,\mathrm{rad/s}$. The pointing requirement implies a closed-loop bandwidth of $6\,\mathrm{rad/s}$. What do you report?
:::

::: answer
That the requirement cannot be met with that sensor location, by any controller, and that the problem is structural rather than a matter of tuning.

The cheap-control limit puts a closed-loop pole at $-8\,\mathrm{rad/s}$ however small $\rho$ is. The usual practical ceiling of about half the zero frequency gives roughly $4\,\mathrm{rad/s}$ of usable bandwidth, against the $6$ required.

Three real options:

- move the gyro — a right-half-plane zero caused by a mode-shape node usually becomes a left-half-plane zero on the other side of the node, often a matter of a fraction of a meter;
- add a second sensor and blend the two, which changes the effective $\mathbf{C}_z$ and so the zeros;
- renegotiate the pointing requirement.

What is *not* an option is a cleverer control law. Presenting the argument as an LQR limit is powerful for exactly that reason: LQR is provably doing the best available, so "try a different controller" has already been answered.
:::

## Summary

| Result | Statement |
| --- | --- |
| Symmetric root locus | Closed-loop poles are the left-half-plane roots of $\rho\,a(s)a(-s) + b(s)b(-s) = 0$ |
| Equivalent form | $1 + \tfrac{1}{\rho}G(s)G(-s) = 0$, a root locus in the gain $1/\rho$ |
| Expensive limit $\rho\to\infty$ | Poles $\to$ stable open-loop poles and reflections of unstable ones; the gain does not go to zero for an unstable plant |
| Cheap limit, finite poles | $m$ poles $\to$ minimum-phase zeros and reflections of right-half-plane zeros |
| Cheap limit, runaway poles | $n-m$ poles on a circle of radius $\big(\lvert b_m\rvert/(\lvert a_n\rvert\sqrt\rho)\big)^{1/(n-m)}$, Butterworth of order $n-m$ |
| Relative degree two | Butterworth pair at $\zeta = 1/\sqrt2 = 0.7071$; bandwidth $\propto \rho^{-1/4}$ |
| Double integrator | $\rho s^4 + 1/J^2 = 0$; $\lvert s\rvert = (1/\rho J^2)^{1/4}$; cost $\propto \rho^{1/4} \to 0$ |
| Non-minimum phase | A pole pins at $-\lvert s_z\rvert$; bandwidth capped near $\lvert s_z\rvert/2$; cost has a floor above zero |
| Rocket drift zero | $s_z = \sqrt{T\ell/J} = 2.5929\,\mathrm{s^{-1}}$ for $T = 7.6\,\mathrm{MN}$, $\ell = 23\,\mathrm{m}$, $J = 2.6\times10^{7}\,\mathrm{kg\,m^2}$ |
| Its cost floor | $2z_0^2/s_z = 1928\,\mathrm{m^2\,s}$ from a $50\,\mathrm{m}$ dispersion; $P_{11} \to 2/s_z = 0.7713$ |
| Design reading | The locus is a diagnostic of limits; the design lives in the middle of the sweep |

The next lesson leaves the time-invariant world. On a vehicle whose mass, inertia and control effectiveness change through the flight, there is no single set of closed-loop poles to place, and the Riccati equation has to be solved along a trajectory.

::: context root-locus-recap What a root locus is
A root locus is a map of where a system's poles travel as one number is turned up from zero to infinity. In classical control that number is a feedback gain: at zero gain the poles sit at the open-loop poles, and as the gain grows they slide along branches toward the zeros or off to infinity. Here the number being turned is $1/\rho$, how cheap control is. The sketching rules are the same ones — branches start at poles, end at zeros or run to infinity along evenly spaced directions — which is why the two limits in this lesson can be read off without solving anything.
:::

::: context reflection-picture The mirror in the imaginary axis
Every pole of the plant has a partner reflected across the imaginary axis. When control is expensive, the optimal closed loop keeps stable poles where they are and swaps each unstable pole for its reflection.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="340" y2="70" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="15" x2="180" y2="120" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="92">−0.70</text><text x="279" y="92">+0.69</text><text x="180" y="128">imaginary axis</text>
  </g>
  <path d="M75,65 l10,10 M85,65 l-10,10" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M274,65 l10,10 M284,65 l-10,10" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="81" cy="70" r="9" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M270,50 Q180,10 92,50" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="92,50 102,40 104,50" fill="#b4232c"/>
  <text x="180" y="30" font-size="11" text-anchor="middle" fill="#b4232c">unstable pole reflected</text>
  <text x="80" y="112" font-size="11" text-anchor="middle" fill="#1d6fd1">stable pole kept</text>
</svg>
```

For the launch vehicle the two end up almost on top of each other, at $-0.6934$ and $-0.6996$, because the open-loop poles happen to be nearly mirror images already.
:::

::: context relative-degree What relative degree measures
Relative degree is the number of poles minus the number of zeros, $n - m$. Physically it counts how many integrations stand between pushing on the input and seeing the output move. For the double integrator it is two: torque changes the rate, and only then does the rate change the angle. The higher the relative degree, the more sluggish the plant's first reaction, and the more directions the runaway poles fan out in.
:::

::: context minimum-phase-word Why "minimum phase"
Among all systems with the same gain at every frequency, the one with every zero in the left half plane has the smallest possible phase lag — hence "minimum phase". Move a zero into the right half plane and the gain curve stays exactly the same, but extra phase lag appears. That hidden extra lag is what a feedback loop cannot get around, and it is why a right-half-plane zero limits bandwidth even though a gain plot would never reveal it.
:::

::: context butterworth The Butterworth pattern
Stephen Butterworth, a British engineer, described in 1930 a filter whose poles are spread evenly around a half circle in the left half plane. That arrangement gives the flattest possible response in the passband. LQR arrives at the same pattern on its own, for runaway poles, when control becomes cheap.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1" fill="none">
    <circle cx="95" cy="100" r="55"/><circle cx="265" cy="100" r="55"/>
    <line x1="30" y1="100" x2="160" y2="100"/><line x1="95" y1="35" x2="95" y2="165"/>
    <line x1="200" y1="100" x2="330" y2="100"/><line x1="265" y1="35" x2="265" y2="165"/>
  </g>
  <g fill="#1d6fd1"><circle cx="56.1" cy="61.1" r="5"/><circle cx="56.1" cy="138.9" r="5"/>
    <circle cx="237.5" cy="52.4" r="5"/><circle cx="210" cy="100" r="5"/><circle cx="237.5" cy="147.6" r="5"/></g>
  <g fill="#fff" stroke="#6c7a93" stroke-width="1.5"><circle cx="133.9" cy="61.1" r="5"/><circle cx="133.9" cy="138.9" r="5"/>
    <circle cx="292.5" cy="52.4" r="5"/><circle cx="320" cy="100" r="5"/><circle cx="292.5" cy="147.6" r="5"/></g>
  <text x="95" y="188" font-size="12" text-anchor="middle" fill="#1f2a44">relative degree 2: ζ = 0.707</text>
  <text x="265" y="188" font-size="12" text-anchor="middle" fill="#1f2a44">relative degree 3: ζ = 0.5</text>
</svg>
```

Filled dots are the closed-loop poles; hollow ones are their mirror images, the other half of the symmetric root locus.
:::

::: context wrong-way-start The wrong-way start
A right-half-plane zero makes the output first move the wrong way. Compare two plants with the same poles: $1/(s+1)^2$ (blue) rises smoothly to its final value, while $(1 - s)/(s+1)^2$ (red) first dips about $21\,\%$ below zero, bottoming out at $t = 0.5\,\mathrm{s}$, before heading the right way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="345" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="40" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="40" x2="340" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,120.0 47.5,118.6 55.0,115.1 62.5,110.2 70.0,104.7 77.5,98.9 85.0,93.0 92.5,87.3 100.0,82.0 107.5,77.0 115.0,72.5 122.5,68.4 130.0,64.7 137.5,61.4 145.0,58.5 152.5,55.9 160.0,53.7 167.5,51.7 175.0,50.1 182.5,48.6 190.0,47.3 197.5,46.2 205.0,45.3 212.5,44.5 220.0,43.8 227.5,43.2 235.0,42.7 242.5,42.3 250.0,42.0 257.5,41.6 265.0,41.4 272.5,41.2 280.0,41.0 287.5,40.8 295.0,40.7 302.5,40.6 310.0,40.5 317.5,40.4 325.0,40.3 332.5,40.3 340.0,40.2"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,120.0 47.5,131.7 55.0,136.5 62.5,136.6 70.0,133.5 77.5,128.3 85.0,121.9 92.5,115.0 100.0,107.8 107.5,100.8 115.0,94.1 122.5,87.9 130.0,82.1 137.5,76.8 145.0,72.1 152.5,67.9 160.0,64.1 167.5,60.8 175.0,57.9 182.5,55.4 190.0,53.2 197.5,51.3 205.0,49.6 212.5,48.2 220.0,47.0 227.5,45.9 235.0,45.0 242.5,44.3 250.0,43.6 257.5,43.1 265.0,42.6 272.5,42.2 280.0,41.8 287.5,41.5 295.0,41.3 302.5,41.1 310.0,40.9 317.5,40.8 325.0,40.6 332.5,40.5 340.0,40.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end"><text x="34" y="44">1</text><text x="34" y="124">0</text></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="115" y="136">2</text><text x="190" y="136">4</text><text x="265" y="136">6</text><text x="340" y="136">8 s</text></g>
  <text x="70" y="158" font-size="11" fill="#b4232c">dips the wrong way first</text>
</svg>
```

For the rocket, the dip is the tail being kicked sideways by the gimbal before the vehicle has tilted.
:::

::: context mode-node Nodes of a bending mode
Pluck a guitar string and watch closely: some points along a vibrating string barely move while the rest swings. Those still points are **nodes**. A flexible spacecraft or rocket bends in the same kind of shapes. A sensor on one side of a node sees the bending in step with the main body's motion; a sensor on the other side sees it reversed. That sign flip is exactly what turns a harmless left-half-plane zero into a right-half-plane one, which is why a gyro's position along the structure is a control-design decision, not only a packaging one.
:::
