---
id: l08-cheap-control-and-the-symmetric-root-locus
title: Cheap control and the asymptotic (Kalman) root locus
minutes: 19
covers:
  - Cheap control and the asymptotic (Kalman) root locus
---

Sweeping $\mathbf{R}$ traced a frontier of designs. This lesson asks what is at each end of it. At the expensive end, where control is nearly forbidden, the closed-loop poles go somewhere specific and predictable. At the cheap end, where control is nearly free, they go somewhere else — and whether that somewhere is "arbitrarily fast" or "stuck at a wall" is decided by a property of the plant that no amount of authority can change.

That wall is the practical payoff. A right-half-plane zero puts a hard ceiling on achievable bandwidth, and LQR is the cleanest place to see it, because the optimiser is by construction doing the best that can be done: if the optimal closed loop refuses to go faster as control gets cheaper, nothing else will either. When a programme asks why the drift loop cannot be sped up, or why a flexible vehicle with a badly placed sensor cannot be tightened, the answer is usually a zero, and the argument below is how you demonstrate it rather than assert it.

The tool is a root locus in which the varying parameter is the control weight. It is called the **symmetric root locus**, or the Kalman root locus after the return-difference identity it comes from.

## The symmetric root locus

Take a single-input plant, $\mathbf{Q} = \mathbf{C}_z^\top\mathbf{C}_z$ and $R = \rho$, and write the fictitious output transfer function

$$
G(s) = \mathbf{C}_z(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} = \frac{b(s)}{a(s)}, \qquad a(s) = \det(s\mathbf{I}-\mathbf{A}).
$$

Start from the return-difference identity of the margins lesson, valid for any complex $s$:

$$
\big[\mathbf{I}+\mathbf{L}(-s)\big]^\top R\big[\mathbf{I}+\mathbf{L}(s)\big] = R + G(-s)G(s).
$$

Now use the determinant identity $\det\big(\mathbf{I} + \mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}\big) = \det(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K})/\det(s\mathbf{I}-\mathbf{A})$, which for one input reads $1 + L(s) = \chi_{cl}(s)/a(s)$ with $\chi_{cl}$ the closed-loop characteristic polynomial. Substituting,

$$
\rho\,\frac{\chi_{cl}(-s)}{a(-s)}\cdot\frac{\chi_{cl}(s)}{a(s)} = \rho + \frac{b(-s)b(s)}{a(-s)a(s)},
$$

and clearing denominators gives the **symmetric root locus equation**:

$$
\rho\,\chi_{cl}(s)\,\chi_{cl}(-s) = \rho\,a(s)a(-s) + b(s)b(-s).
$$

The right-hand side is a polynomial of degree $2n$ whose roots come in pairs $\pm s$ (and, being real-coefficient, in conjugate pairs too — hence *symmetric*, about both axes). The left-hand side says those $2n$ roots are the closed-loop poles together with their mirror images. So:

> **The LQR closed-loop poles are the $n$ left-half-plane roots of $\rho\,a(s)a(-s) + b(s)b(-s) = 0$.**

Dividing by $\rho\,a(s)a(-s)$ puts it in classical root-locus form, $1 + \frac{1}{\rho}G(s)G(-s) = 0$, a locus in the gain $1/\rho$ whose "open-loop poles" are the plant poles and their mirrors and whose "open-loop zeros" are the plant zeros and their mirrors. Everything you know about sketching a root locus now applies, and the two asymptotic limits read straight off.

## The expensive-control limit

Let $\rho \to \infty$. The term $\rho\,a(s)a(-s)$ dominates, so the roots approach the roots of $a(s)a(-s)$ — the open-loop poles and their reflections. Keeping the left-half-plane ones:

> Stable open-loop poles stay where they are; unstable open-loop poles are **reflected** across the imaginary axis.

This is exactly right physically. If control is nearly free of value, do nothing — except that "nothing" is not an option for an unstable mode, so the cheapest legal thing is to move that mode the smallest distance that makes it stable, which is to its own mirror image.

::: example Expensive control on an unstable launch vehicle
The pitch plane at maximum dynamic pressure has open-loop poles $-0.699622$ and $+0.693366\,\mathrm{s^{-1}}$. Penalising angle of attack ($\mathbf{C}_z = [1\ \ 0]$) and sweeping $\rho$:

| $\rho$ | $\mathbf{K}$ | closed-loop poles $(\mathrm{s^{-1}})$ |
| --- | --- | --- |
| $10^{-2}$ | $(-10.062,\ -1.730)$ | $-5.819 \pm 5.777j$ |
| $1$ | $(-1.0712,\ -0.5645)$ | $-1.901 \pm 1.769j$ |
| $10^{2}$ | $(-0.1940,\ -0.2402)$ | $-0.811 \pm 0.415j$ |
| $10^{4}$ | $(-0.1437,\ -0.2068)$ | $-0.698 \pm 0.048j$ |
| $10^{8}$ | $(-0.1430,\ -0.2063)$ | $-0.6934,\ -0.6996$ |

At $\rho = 10^{8}$ the poles are $-0.6934$ and $-0.6996$: the reflection of the unstable pole $+0.693366$, and the stable pole $-0.699622$ left alone, each to four digits. The gain does not go to zero as $\rho \to \infty$ — it converges to $(-0.1430,\ -0.2063)$, the smallest feedback that stabilizes this plant in the mirror-image sense. An unstable vehicle always costs something.
:::

## The cheap-control limit

Now let $\rho \to 0$. Write $\deg a = n$ and $\deg b = m$, so the relative degree is $n - m$. Two groups of roots behave differently.

**The finite ones.** With $\rho = 0$ the equation is $b(s)b(-s) = 0$, whose roots are the zeros of $G$ and their reflections. Taking the left-half-plane ones:

> $m$ closed-loop poles approach the **minimum-phase zeros** of $G$ and the **reflections of its right-half-plane zeros**.

**The ones that run away.** The remaining $n-m$ roots must go to infinity, where the leading terms dominate: $\rho\,(-1)^n s^{2n} + (-1)^m b_m^2 s^{2m} \approx 0$, giving

$$
s^{2(n-m)} = -\frac{(-1)^{n-m}\,b_m^2}{\rho\,a_n^2},
\qquad |s| = \left(\frac{b_m}{a_n\sqrt{\rho}}\right)^{1/(n-m)} .
$$

The $2(n-m)$ solutions are equally spaced on a circle of that radius; the $n-m$ in the left half plane form a **Butterworth pattern** of order $n-m$. For relative degree two that is a pair at $\pm135^\circ$, damping $\zeta = 1/\sqrt2 = 0.7071$; for relative degree three, one real pole and a pair at $\zeta = 0.5$; and so on. This is where the $0.707$ that kept appearing in the tuning lesson comes from — it is not a choice anyone made.

::: key Cheap control limit
As $\mathbf{R} \to \mathbf{0}$, the minimum-phase closed-loop poles run to infinity along a Butterworth pattern while poles mirror any right-half-plane zeros. A non-minimum-phase plant therefore has a hard performance ceiling no matter how cheap control is.
:::

::: example The double integrator: Butterworth, and a cost that goes to zero
$\mathbf{A} = \begin{bmatrix}0&1\\0&0\end{bmatrix}$, $\mathbf{B} = (0,\ 1/J)^\top$ with $J = 120$, $\mathbf{C}_z = [1\ \ 0]$, so $G(s) = (1/J)/s^2$: $a(s) = s^2$, $b(s) = 1/J$, $n = 2$, $m = 0$. The locus equation is

$$
\rho\,s^4 + \frac{1}{J^2} = 0 \qquad\Longrightarrow\qquad |s| = \left(\frac{1}{\rho J^2}\right)^{1/4},
$$

with the four roots at $45^\circ$, $135^\circ$, $225^\circ$, $315^\circ$ and the two left-half-plane ones at $\zeta = \cos45^\circ = 0.7071$. Solving the Riccati equation numerically:

| $\rho$ | closed-loop poles $(\mathrm{s^{-1}})$ | $\lvert s\rvert$ | predicted $\lvert s\rvert$ | $\zeta$ | $J$ from $5^\circ$ |
| --- | --- | --- | --- | --- | --- |
| $10^{2}$ | $-0.0204 \pm 0.0204j$ | $0.02887$ | $0.02887$ | $0.70711$ | $3.73\times10^{-1}$ |
| $1$ | $-0.0645 \pm 0.0645j$ | $0.09129$ | $0.09129$ | $0.70711$ | $1.18\times10^{-1}$ |
| $10^{-4}$ | $-0.6455 \pm 0.6455j$ | $0.9129$ | $0.9129$ | $0.70711$ | $1.18\times10^{-2}$ |
| $10^{-8}$ | $-6.455 \pm 6.455j$ | $9.1287$ | $9.1287$ | $0.70711$ | $1.18\times10^{-3}$ |

Every prediction is exact. Three things to take away. The bandwidth grows as $\rho^{-1/4}$, which is the fourth-root law from the tuning lesson, now derived rather than observed. The damping is pinned at $0.7071$ for every $\rho$, because the relative degree is two and nothing else. And the cost falls as $\rho^{1/4}$ towards **zero**: with unbounded authority this plant can be regulated perfectly. That is what a minimum-phase plant offers.
:::

## Non-minimum phase: the wall

A right-half-plane zero changes the ending. The finite poles now converge to the *reflections* of the right-half-plane zeros, which are fixed points of the plant, not of the weights. However small $\rho$ becomes, a closed-loop pole sits at $-|z|$, and the closed-loop response is no faster than that pole allows. The cost stops falling too, at a positive floor.

::: example Lateral drift of a launch vehicle
To move sideways, a rocket must first tilt, and to tilt it must gimbal — which pushes it sideways the *wrong way* first. That is a right-half-plane zero, and it is structural.

Take states $\mathbf{x} = (z, \dot z, \theta, \dot\theta)$ with $z$ the lateral displacement, $\theta$ the pitch angle and $\delta$ the gimbal deflection. With thrust $T = 7.6\times10^{6}\,\mathrm{N}$, mass $m = 3.2\times10^{5}\,\mathrm{kg}$, gimbal arm $\ell = 23\,\mathrm{m}$ and pitch inertia $J = 2.6\times10^{7}\,\mathrm{kg\,m^2}$,

$$
\ddot z = \frac{T}{m}(\theta - \delta) = 23.75(\theta-\delta), \qquad \ddot\theta = \frac{T\ell}{J}\delta = 6.7231\,\delta .
$$

Eliminating $\theta$ gives

$$
\frac{z(s)}{\delta(s)} = \frac{T}{m}\cdot\frac{T\ell/J - s^2}{s^4},
$$

with zeros at $s = \pm\sqrt{T\ell/J} = \pm 2.59289\,\mathrm{s^{-1}}$. The positive one is the wall.

Penalise drift alone ($\mathbf{C}_z = [1\ 0\ 0\ 0]$) and sweep $\rho$, with a $50\,\mathrm{m}$ lateral dispersion as the initial condition:

| $\rho$ | closed-loop poles $(\mathrm{s^{-1}})$ | $J$ |
| --- | --- | --- |
| $10^{2}$ | $-1.722\pm0.513j$, $-1.059\pm1.956j$ | $3737$ |
| $1$ | $-3.153\pm3.993j$, $-2.467\pm0.290j$ | $2608$ |
| $10^{-2}$ | $-10.75\pm11.06j$, $-2.591\pm0.037j$ | $2155$ |
| $10^{-4}$ | $-34.41\pm34.51j$, $-2.5929\pm0.004j$ | $2001$ |
| $10^{-6}$ | $-108.96\pm108.99j$, $-2.5929$ (double) | $1951$ |
| $10^{-8}$ | $-344.60\pm344.61j$, $-2.5929$ (double) | $1936$ |

Two poles run off to infinity — relative degree $4 - 2 = 2$, so a Butterworth pair at $\zeta = 0.707$ with $|s| = \big((T/m)^2/\rho\big)^{1/4}$, which predicts $487.3$ at $\rho = 10^{-8}$ against the computed $\sqrt{344.60^2+344.61^2} = 487.3$. The other two stop dead at $-2.5929$, the mirror of the right-half-plane zero, and refuse to move however much authority is offered.

The cost stops too. Extrapolating the sequence in $\rho^{1/4}$ gives a floor of

$$
J_{\min} = \frac{2 z_0^2}{z} = \frac{2 \times 50^2}{2.59289} = 1928\ \text{units},
$$

and the extrapolated $P_{11}$ is $0.771326$ against $2/z = 0.771340$ — five-digit agreement. Unlike the double integrator, this plant cannot be regulated perfectly at any price, and the price of the residual is set entirely by the location of the zero.

For design: a closed-loop bandwidth beyond roughly half the zero frequency is unachievable, so the drift loop is capped near $1.3\,\mathrm{rad/s}$. Real launch vehicles run their drift loops an order of magnitude slower than that, near $0.1$–$0.3\,\mathrm{rad/s}$, so on this vehicle the zero is not the binding constraint — the bending modes are. The discipline is to know which wall you are against, because raising gains helps with neither.
:::

::: warning "Cheap control" is a limit, not a design
Nothing in this lesson says to set $\rho = 10^{-8}$. At $\rho = 10^{-8}$ the double integrator's closed-loop poles are at $9.13\,\mathrm{rad/s}$ and its gain is $\sqrt{q_1/\rho} = 10^{4}$, so a one-milliradian attitude error commands $10\,\mathrm{N\,m}$. Three things break before the mathematics does: the actuator saturates, the unmodelled flexible modes are inside the new bandwidth and are now being excited rather than ignored, and the sensor noise is amplified by the same factor as the signal. The asymptotic locus is a diagnostic — it tells you where the limits are and what kind of limit you are against — and the design lives in the middle of the sweep, not at its ends.
:::

::: note Where right-half-plane zeros come from on real vehicles
They are usually geometry, not modelling error. A rocket steering by gimbal has one at $\sqrt{T\ell/J}$ because the lateral force and the moment it produces oppose each other initially. An aircraft commanding altitude with an elevator has one because the tail must push down before the wing lifts. A flexible vehicle whose rate gyro sits on the wrong side of a mode shape node has one, and moving the sensor a metre can move the zero from the right half plane to the left. A boiler, a bicycle steered by countersteering, and a hard-disk arm all have them. The common signature is an initial response in the wrong direction, and the size of that undershoot is directly related to how hard the bandwidth limit bites.
:::

## Check yourself

::: check
Derive the symmetric root locus equation for a plant $G(s) = b(s)/a(s)$ and explain why the locus is symmetric about both axes.
:::

::: answer
Start from the return-difference identity $[1+L(-s)]\,\rho\,[1+L(s)] = \rho + G(-s)G(s)$ and substitute $1+L(s) = \chi_{cl}(s)/a(s)$, which follows from $\det(\mathbf{I}+\mathbf{K}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B}) = \det(s\mathbf{I}-\mathbf{A}+\mathbf{B}\mathbf{K})/\det(s\mathbf{I}-\mathbf{A})$. Clearing $a(s)a(-s)$ gives $\rho\chi_{cl}(s)\chi_{cl}(-s) = \rho a(s)a(-s) + b(s)b(-s)$. Symmetry about the imaginary axis is built in: the right-hand side is a function of $s$ that is unchanged under $s \to -s$, since each factor appears with both arguments, so roots come in $\pm$ pairs. Symmetry about the real axis is the usual consequence of real coefficients, giving conjugate pairs. Together the $2n$ roots form a pattern symmetric about both axes, of which the optimal closed loop takes the left-hand half.
:::

::: check
A plant has relative degree three. Sketch where the cheap-control poles go and give the damping ratios.
:::

::: answer
Three poles run to infinity on a circle of radius $\big(b_m/(a_n\sqrt\rho)\big)^{1/3}$, arranged as the left half of a regular hexagon of six equally spaced points — that is, the third-order Butterworth pattern: one pole on the negative real axis at angle $180^\circ$, and a complex pair at $\pm120^\circ$ from the positive real axis. The real pole has $\zeta = 1$ by definition; the complex pair has $\zeta = -\cos(120^\circ) = 0.5$. The remaining $n-3$ poles go to the minimum-phase zeros and the reflections of any right-half-plane zeros. The practical note is that $\zeta = 0.5$ is lightly damped, about $16\,\%$ overshoot, so a high relative degree plus cheap control gives a ringy response — another reason the cheap end of the sweep is not where designs live.
:::

::: check
The drift example's cost floor was $2z_0^2/z$. What does that formula say about where to put the gimbal, and is it good advice?
:::

::: answer
The zero is at $z = \sqrt{T\ell/J}$, so the floor $2z_0^2/z = 2z_0^2\sqrt{J/(T\ell)}$ falls as the gimbal arm $\ell$ grows: a longer arm pushes the zero further into the right half plane, further away from the origin, and relaxes the limit. Numerically, doubling $\ell$ from $23$ to $46\,\mathrm{m}$ moves the zero from $2.593$ to $3.667\,\mathrm{s^{-1}}$ and lowers the floor from $1928$ to $1363$. As advice it is nearly useless, because $\ell$ is the distance from the gimbal to the centre of mass and is set by the vehicle's layout and by where the propellant is as it drains, not by the control engineer. What the formula is genuinely good for is telling you what the limit *is* — so that when the drift loop cannot be tightened, you know whether you are against the zero, against the actuator, or against a bending mode, and you stop trying to fix the wrong one.
:::

::: check
Why does the expensive-control limit reflect unstable poles rather than leaving them or moving them somewhere else?
:::

::: answer
As $\rho \to \infty$ the locus equation becomes $a(s)a(-s) = 0$, whose roots are the open-loop poles together with their negatives. The optimal closed loop must be stable, so it selects the left-half-plane members of that set: every stable open-loop pole is already there and is kept, and for each unstable pole $p$ the only available left-half-plane root of the pair is $-p$. There is no third option, because the set of limiting roots is fixed by the plant alone. The physical reading is that the cheapest stabilizing action against an unstable mode is the one that moves it the minimum distance — and the minimum distance from $p$ to the stable region, measured in the sense this optimisation cares about, lands exactly on the mirror image. Confirmed numerically: $+0.693366$ became $-0.6934$, and the stable $-0.699622$ became $-0.6996$.
:::

::: check
Your flexible spacecraft has a rate gyro placed so that the first bending mode gives the attitude loop a right-half-plane zero at $8\,\mathrm{rad/s}$. The pointing requirement implies a closed-loop bandwidth of $6\,\mathrm{rad/s}$. What do you report?
:::

::: answer
That the requirement is not achievable with that sensor location, by any controller, and that the problem is structural rather than a matter of tuning. The cheap-control limit puts a closed-loop pole at $-8\,\mathrm{rad/s}$ however small $\rho$ is, and the usual practical ceiling of roughly half the zero frequency gives about $4\,\mathrm{rad/s}$ of usable bandwidth against the $6$ required. Three real options: move the gyro, since a right-half-plane zero from a mode-shape node typically becomes a left-half-plane zero on the other side of the node and is often a question of a fraction of a metre; add a second sensor and blend, which changes the effective $\mathbf{C}_z$ and hence the zeros; or renegotiate the pointing requirement. What is not an option is a better control law, and the value of presenting the argument as an LQR asymptotic result is that LQR is provably doing the best available — so "try a different controller" has already been answered.
:::

## Summary

| Result | Statement |
| --- | --- |
| Symmetric root locus | Closed-loop poles are the left-half-plane roots of $\rho\,a(s)a(-s) + b(s)b(-s) = 0$ |
| Equivalent form | $1 + \tfrac{1}{\rho}G(s)G(-s) = 0$, a root locus in the gain $1/\rho$ |
| Expensive limit $\rho\to\infty$ | Poles $\to$ stable open-loop poles and reflections of unstable ones |
| Cheap limit, finite poles | $m$ poles $\to$ minimum-phase zeros and reflections of right-half-plane zeros |
| Cheap limit, runaway poles | $n-m$ poles on a circle of radius $\big(b_m/(a_n\sqrt\rho)\big)^{1/(n-m)}$, Butterworth of order $n-m$ |
| Relative degree two | Butterworth pair at $\zeta = 1/\sqrt2 = 0.7071$; bandwidth $\propto \rho^{-1/4}$ |
| Double integrator | $\rho s^4 + 1/J^2 = 0$; $\lvert s\rvert = (1/\rho J^2)^{1/4}$; cost $\propto \rho^{1/4} \to 0$ |
| Non-minimum phase | A pole pins at $-\lvert z\rvert$; bandwidth capped near $\lvert z\rvert/2$; cost floors above zero |
| Rocket drift zero | $z = \sqrt{T\ell/J} = 2.5929\,\mathrm{s^{-1}}$ for $T = 7.6\,\mathrm{MN}$, $\ell = 23\,\mathrm{m}$, $J = 2.6\times10^{7}\,\mathrm{kg\,m^2}$ |
| Its cost floor | $J_{\min} = 2z_0^2/z = 1928$ from a $50\,\mathrm{m}$ dispersion; $P_{11} \to 2/z = 0.7713$ |
| Design reading | The locus is a diagnostic of limits; the design lives in the middle of the sweep |

The next lesson leaves the time-invariant world. On a vehicle whose mass, inertia and control effectiveness change through the flight, there is no single set of closed-loop poles to place, and the Riccati equation has to be solved along a trajectory.
