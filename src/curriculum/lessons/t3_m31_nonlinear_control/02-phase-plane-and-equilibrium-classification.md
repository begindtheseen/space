---
id: l02-phase-plane-and-equilibrium-classification
title: Phase-plane analysis and equilibrium classification
minutes: 23
covers:
  - 'Phase-plane analysis and equilibrium classification'
---

Imagine a map of a hilly park with an arrow painted at every spot, showing which way a ball placed there would start to roll. You would not need to roll a single ball to know where each one ends up. You would follow the arrows.

The **[[phase plane|phase-word]]** is that map for a system with two states. You met it in the ODE module: plot the state $(x_1, x_2)$ — usually an angle and its rate — instead of plotting each one against time. The family of curves through every starting point, called the **phase portrait**, is a complete map of everything the system can do. There you used it on linear systems, and the trace–determinant chart told you which of six pictures you were looking at.

Nothing about that map needed linearity. For any second-order system $\dot{x}_1 = f_1(x_1, x_2)$, $\dot{x}_2 = f_2(x_1, x_2)$, the pair $(f_1, f_2)$ is an arrow at every point, and trajectories follow the arrows. What changes is that there are now several equilibria, each with its own local picture. Curves called **separatrices** divide the plane into regions with different fates. And the big picture — the thing you actually want — has to be assembled from local pieces plus a few theorems about what is possible in two dimensions.

By the end of this lesson you can take a nonlinear second-order model, find its equilibria, classify each from a matrix of slopes, find the separatrices that fence in the useful region, and say whether the system can have a limit cycle at all. A departure analysis or an attitude-acquisition study takes exactly these steps.

## The portrait of a nonlinear system

Write the system as $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$ with $\mathbf{x} \in \mathbb{R}^2$ (read "x in R two": a point in the plane). Three facts organize everything.

**Trajectories never cross.** Where $\mathbf{f}$ is smooth (continuously differentiable), exactly one trajectory passes through each point, because the arrow there points one way only. In two dimensions this is powerful: a closed loop in the plane separates inside from outside, so a trajectory trapped inside one can never get out.

**Equilibria are where the arrow shrinks to nothing.** Solve $\mathbf{f}(\mathbf{x}_e) = \mathbf{0}$. Everything else in the portrait is organized around these points.

**Nullclines find them cheaply.** The $x_1$-**nullcline** is the curve where $f_1 = 0$; there, trajectories move straight up or down. The $x_2$-nullcline is where $f_2 = 0$; there, they move sideways. Equilibria sit where the two curves cross. For a mechanical system written $\dot{x}_1 = x_2$, $\dot{x}_2 = g(x_1, x_2)$, the first nullcline is the horizontal axis ($x_2 = 0$), so every equilibrium sits on that axis. That is why attitude and incidence portraits are read along it.

For such a mechanical system the same direction rules as in the linear case hold. In the upper half plane $x_2 = \dot{x}_1 > 0$, so motion is to the right. In the lower half it is to the left. Trajectories cross the horizontal axis vertically, and they circle equilibria clockwise.

## Classifying one equilibrium

Stand close enough to any smooth curve and it looks straight. In the same way, zoom in far enough on an equilibrium and the system looks linear.

Let $\mathbf{z} = \mathbf{x} - \mathbf{x}_e$ be the small offset from the equilibrium. Expand $\mathbf{f}$ in a **Taylor series** — its value at the point, plus slope times offset, plus smaller leftovers:

$$
\dot{\mathbf{z}} = \mathbf{f}(\mathbf{x}_e + \mathbf{z}) = \underbrace{\mathbf{f}(\mathbf{x}_e)}_{=\,\mathbf{0}} + \mathbf{A}\mathbf{z} + O(\lVert\mathbf{z}\rVert^2),
\qquad
\mathbf{A} = \left.\frac{\partial\mathbf{f}}{\partial\mathbf{x}}\right|_{\mathbf{x}_e} .
$$

The first term is zero because we are at an equilibrium. The $O(\lVert\mathbf{z}\rVert^2)$ ("order z squared") collects the leftovers, which shrink like the square of the distance. The matrix $\mathbf{A}$ is the **[[Jacobian|jacobian-word]]** at that equilibrium: the table of slopes of each $f_i$ with respect to each $x_j$, evaluated there. For a mechanical system $\dot{x}_1 = x_2$, $\dot{x}_2 = g(x_1,x_2)$ it is

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 \\ \partial g/\partial x_1 & \partial g/\partial x_2\end{bmatrix} .
$$

So $\operatorname{tr}\mathbf{A} = \partial g/\partial x_2$ is the damping (how acceleration responds to rate), and $\det\mathbf{A} = -\partial g/\partial x_1$ is the stiffness (how acceleration pushes back against displacement). Then the ODE module's chart reads off the local picture.

::: key
Classification of an equilibrium from its Jacobian $\mathbf{A}$, via $\det\mathbf{A}$ and $\operatorname{tr}\mathbf{A}$: $\det < 0$ is a **saddle** (unstable, one incoming and one outgoing eigendirection). With $\det > 0$: $\operatorname{tr} < 0$ is stable and $\operatorname{tr} > 0$ unstable, and the motion is a **focus** (spiral) when $\operatorname{tr}^2 < 4\det$ and a **node** when $\operatorname{tr}^2 \ge 4\det$. $\operatorname{tr} = 0$ with $\det > 0$ is a **center**. An equilibrium is **hyperbolic** when no eigenvalue of $\mathbf{A}$ has zero real part.
:::

Here is how to read it (the [[chart|trdet-chart]] in the note draws it). A negative determinant means the stiffness pushes *away* — a saddle, whatever the damping. A positive determinant means there is a true spring, and then the trace (the damping) decides: negative trace, stable; positive trace, unstable. Whether it spirals or slides straight in depends on whether the damping is small ($\operatorname{tr}^2 < 4\det$, spiral) or large (node).

The last line of the key is the one the ODE module did not need. For a **hyperbolic** equilibrium, the nonlinear portrait nearby really does look like the linear one: same type, same stability, curves only gently bent. For a non-hyperbolic one — a center, or anything with an eigenvalue on the imaginary axis — the neighborhood is decided by the leftover terms the linearization threw away, and the picture can be anything. That is the subject of the next lesson.

::: example The gravity-gradient satellite with a damper
Take the $400\,\mathrm{km}$ bus from the previous lesson, with $k = 3n^2(I_x - I_z)/I_y = 2.048\times10^{-6}\,\mathrm{s^{-2}}$, and add a passive damper of coefficient $c$:

$$
\ddot{\theta} = -k\sin\theta\cos\theta - c\,\dot{\theta} .
$$

**Choose the damper.** Take $c = 2\zeta\sqrt{k}$ with damping ratio $\zeta = 0.3$, giving $c = 8.587\times10^{-4}\,\mathrm{s^{-1}}$.

**Find the equilibria.** They need $\dot\theta = 0$ and $\sin\theta\cos\theta = 0$, so $\theta = 0, \pi/2, \pi, 3\pi/2$ as before. Damping never moves an equilibrium; it only changes its type.

**At $\theta = 0$.** The slope of $-k\sin\theta\cos\theta$ there is $-k$, so the Jacobian is $\begin{bmatrix} 0 & 1 \\ -k & -c\end{bmatrix}$. Then $\det = k = 2.048\times10^{-6} > 0$ and $\operatorname{tr} = -c < 0$, and $\operatorname{tr}^2 - 4\det = -7.4\times10^{-6} < 0$. That is a **stable focus**, with eigenvalues $-4.293\times10^{-4} \pm 1.3652\times10^{-3}j$. The same holds at $\theta = \pi$.

**At $\theta = \pi/2$.** The stiffness flips sign: $\begin{bmatrix} 0 & 1 \\ +k & -c\end{bmatrix}$, with $\det = -k < 0$. That is a **saddle**, with eigenvalues $+1.0648\times10^{-3}$ and $-1.9235\times10^{-3}\,\mathrm{s^{-1}}$. Each eigenvector is $[1,\ \lambda]^\mathsf{T}$, which means a straight-line trajectory on which $\dot{\theta} = \lambda\,\Delta\theta$ ($\Delta\theta$ is the offset from $90^\circ$). The incoming one, with slope $-1.9235\times10^{-3}$, is the **[[separatrix|separatrix-word]]**: the only way into the saddle, and the edge of the region that spirals into nadir.

**The operational number.** Release the satellite at $\theta = 0$ with some leftover rate. How much rate can it survive? Bisect on the initial rate (fourth-order Runge–Kutta, step $1\,\mathrm{s}$, run $60000\,\mathrm{s}$) and the limit comes out as $2.3793\times10^{-3}\,\mathrm{rad/s} = 0.1363\,^\circ\mathrm{/s}$.

Slightly below it, at $0.98$ of the limit, the satellite swings out to $82.6^\circ$, comes back, and spirals into nadir. Slightly above it, at $1.02$, it tumbles over the saddle and spirals into the *other* stable equilibrium at $180^\circ$ — boom reversed, **[[upside down|upside-down]]**, and gravity gradient perfectly content.

**Sanity check against no damping.** Without the damper, energy is conserved, and the separatrix is the set of states with exactly the saddle's energy: $\tfrac{1}{2}\dot{\theta}^2 + \tfrac{k}{2}\sin^2\theta = \tfrac{k}{2}$. At $\theta = 0$ this gives a crossing rate of $\sqrt{k} = 1.4311\times10^{-3}\,\mathrm{rad/s}$. The damper raises the limit by a factor of $1.66$, because it drains energy during the swing — higher, as it should be. A boom deployment is sized against this: get the rate below $0.136\,^\circ\mathrm{/s}$ before releasing the boom, or accept a coin flip between two attitudes $180^\circ$ apart.
:::

## Separatrices, basins, and the shape of the safe region

Picture rain falling on a ridge. A drop landing on one side ends up in one valley; a drop on the other side ends up in a different valley. The ridge line decides.

The **region of attraction** (or **basin**) of an asymptotically stable equilibrium is the set of starting states from which trajectories end up there. In the plane its edge is built from the **stable manifolds** of nearby saddles — the curves that run *into* a saddle — together with any unstable periodic orbits. That is why saddles matter so much more than the time a system spends near them. You never sit at a saddle, but its incoming curve is the fence.

For a hyperbolic saddle, the stable manifold leaves the equilibrium along the eigenvector of the negative eigenvalue. To draw it, start a hair away from the saddle along that eigenvector and integrate *backward* in time. (Forward in time you would run off along the other eigenvector.) Often it is easier to find the fence by bisection, as the example above did: pick a line of starting states and find where the outcome changes.

::: example Where the departure boundary really is
Return to the vehicle from the previous lesson, with the elevator fixed at $\delta = 4.80^\circ$ and the pitch model

$$
\ddot{\alpha} = a_m\left(-0.9\,\alpha + 6\,\alpha^3 + 1.5\,\delta\right) - 2.0\,\dot{\alpha},
\qquad a_m = 19.6\,\mathrm{s^{-2}} .
$$

**Equilibria.** The cubic has three roots, so there are three equilibria, all on the $\dot{\alpha} = 0$ axis.

**Classify them.** The Jacobian is $\begin{bmatrix}0 & 1 \\ a_m(-0.9 + 18\alpha^2) & -2\end{bmatrix}$. The trace is $-2$ at every equilibrium, so only the determinant varies:

| $\alpha_e$ | $\det\mathbf{A}$ | Eigenvalues ($\mathrm{s^{-1}}$) | Type |
| --- | --- | --- | --- |
| $-25.441^\circ$ | $-51.92$ | $+6.275$, $-8.275$ | saddle |
| $+10.080^\circ$ | $+6.721$ | $-1.000 \pm 2.3919j$ | stable focus |
| $+15.362^\circ$ | $-7.720$ | $+1.953$, $-3.953$ | saddle |

The focus has natural frequency $\omega_n = \sqrt{6.721} = 2.592\,\mathrm{rad/s}$ and damping ratio $\zeta = 2/(2\times2.592) = 0.386$. That is a perfectly respectable short-period mode, and exactly what a linear analysis about the trim point would report. The saddles are what that linear analysis *cannot* report.

**Measure the basin** by bisection, with a step of $1\,\mathrm{ms}$ over $40\,\mathrm{s}$:

- **Released from rest**, the vehicle recovers to trim only for $1.54^\circ < \alpha < 15.36^\circ$. The upper end is the saddle itself. The lower end is *not* an equilibrium. Released at rest below $1.54^\circ$, the nose-up moment accelerates the vehicle so hard that it overshoots the saddle at $15.36^\circ$ and departs. So starting at $\alpha = 0$ with the elevator already at $4.80^\circ$ is a departure.
- **At trim**, a pitch-rate gust is survivable from $-43.24\,^\circ\mathrm{/s}$ to $+15.92\,^\circ\mathrm{/s}$. The lopsidedness is geometry: the far saddle at $-25.44^\circ$ is a long way downhill, while the near one at $+15.36^\circ$ is only $5.3^\circ$ uphill.

So the honest description of this operating point is "stable with $\zeta = 0.39$, and $5.3^\circ$ or $16\,^\circ\mathrm{/s}$ from the fence". Nothing in the eigenvalues contains the second half of that sentence.
:::

## What is possible in two dimensions

A flat plane is a cramped place for a trajectory, and that is useful. It cannot cross itself, and it cannot hop over another trajectory. Three results turn that into tools.

**[[Poincaré–Bendixson|poincare-bendixson]].** If a trajectory of a planar system stays forever in a closed, bounded region that contains no equilibrium, it must settle onto a periodic orbit. In two dimensions there is nowhere else to go: it cannot cross itself and cannot escape. This is why limit cycles are so prominent in planar analysis. It fails completely in three dimensions, where the extra room allows chaos.

**Bendixson's criterion.** The **divergence** of $\mathbf{f}$, written $\nabla\cdot\mathbf{f} = \partial f_1/\partial x_1 + \partial f_2/\partial x_2$ (read "del dot f"), measures whether a small patch of starting states spreads out or squeezes together as it flows. If it is not identically zero and keeps one sign throughout a region $D$ with no holes in it, then no closed orbit lies entirely inside $D$.

::: note Why it has to be true: Bendixson's criterion
Suppose a closed orbit $C$ did lie in $D$, enclosing an area $S$. Along $C$ the velocity $(f_1, f_2)$ points along the curve, so no flow crosses it:

$$
\oint_C (f_1\,dx_2 - f_2\,dx_1) = 0 .
$$

(Along the orbit, $dx_1 = f_1\,dt$ and $dx_2 = f_2\,dt$, so each piece is $f_1 f_2\,dt - f_2 f_1\,dt = 0$.) But **[[Green's theorem|divergence-picture]]** turns that same loop integral into an area integral:

$$
\oint_C (f_1\,dx_2 - f_2\,dx_1) = \iint_S \nabla\cdot\mathbf{f}\,dA .
$$

If $\nabla\cdot\mathbf{f}$ keeps one sign and is not zero everywhere, the right side cannot be zero. That contradiction means no closed orbit exists in $D$.
:::

This is cheap and decisive. For the pitch model above,

$$
\nabla\cdot\mathbf{f} = \frac{\partial(\dot\alpha)}{\partial\alpha} + \frac{\partial(\ddot\alpha)}{\partial\dot\alpha} = 0 + (-2) = -2
$$

everywhere. So no periodic orbit exists anywhere in that plane, at any elevator setting, and every bounded trajectory ends at one of the three equilibria. That is what allowed the basin measurement above to use "did it reach the trim point?" as its test.

For van der Pol, $\nabla\cdot\mathbf{f} = \mu(1 - x^2)$ changes sign at $x = \pm 1$, so the criterion says nothing — and indeed there is a cycle of amplitude $2$.

**Index.** Any closed orbit in the plane must enclose at least one equilibrium, and the **indices** of the enclosed equilibria must add up to $+1$. A node, focus or center has index $+1$; a saddle has index $-1$. So a limit cycle around empty space is impossible, and so is one enclosing a single saddle alone.

::: key
In the plane: **Poincaré–Bendixson** — a bounded trajectory that stays away from equilibria converges to a periodic orbit. **Bendixson** — if $\nabla\cdot\mathbf{f}$ has one sign throughout a hole-free region, no closed orbit lies in it. **Index** — a closed orbit encloses equilibria whose indices sum to $+1$, so it must enclose at least one, and never a single saddle alone.
:::

## The switching curve

One nonlinear portrait is worth drawing from memory, because every thruster-controlled vehicle lives in it. Picture a hockey puck you can push only with a fixed-strength shove, left or right. How do you bring it to rest on a mark as fast as possible? Shove toward the mark, then at exactly the right moment shove the other way so it stops dead on the mark.

In symbols, take the **double integrator** $\ddot{\theta} = u$ with $|u| \le u_{\max}$: a rigid body with an on-off torque. For a constant $u$, multiply both sides by $\dot{\theta}$ and integrate, which gives $\tfrac{1}{2}\dot{\theta}^2 = u\theta + \text{const}$. So the trajectories are parabolas, opening to the right for $u > 0$ and to the left for $u < 0$.

Only two of those parabolas pass through the origin at rest: $\dot{\theta}^2 = -2u_{\max}\theta$ with $\dot\theta > 0$, and $\dot{\theta}^2 = 2u_{\max}\theta$ with $\dot\theta < 0$. Together they form the **[[switching curve|switching-picture]]**

$$
\theta + \frac{\dot{\theta}\,\lvert\dot{\theta}\rvert}{2u_{\max}} = 0 .
$$

The fastest possible control — full torque one way until the state hits this curve, then full torque the other way, riding the curve into the origin — is read straight off the picture as the **[[bang-bang|bang-bang-word]]** law $u = -u_{\max}\operatorname{sign}\!\left(\theta + \dot{\theta}\lvert\dot{\theta}\rvert/(2u_{\max})\right)$. The $\operatorname{sign}$ function returns $+1$ for a positive argument and $-1$ for a negative one.

::: example A minimum-time slew on thrusters
A spacecraft with inertia $J = 120\,\mathrm{kg\,m^2}$ has a thruster pair giving $\pm 0.5\,\mathrm{N\,m}$. So $u_{\max} = 0.5/120 = 4.1667\times10^{-3}\,\mathrm{rad/s^2}$. Slew it from $\theta_0 = 0.1\,\mathrm{rad}$ ($5.73^\circ$) to rest at zero.

**Where to switch.** Speeding up and slowing down use the same torque, so by symmetry the switch is halfway, at $\theta = 0.05\,\mathrm{rad}$. The rate there is $\dot{\theta} = -\sqrt{2u_{\max}(0.05)} = -\sqrt{4.1667\times10^{-4}} = -0.020412\,\mathrm{rad/s}$.

**How long.** Each half covers $0.05\,\mathrm{rad}$ from rest, so $0.05 = \tfrac{1}{2}u_{\max}t^2$ and $t = \sqrt{\theta_0/u_{\max}} = \sqrt{24} = 4.899\,\mathrm{s}$. The whole maneuver takes $9.798\,\mathrm{s}$.

**Check.** Integrating the two-phase profile with a step of $0.1\,\mathrm{ms}$ lands at $\theta = -8.4\times10^{-7}\,\mathrm{rad}$ with a rate of $1.5\times10^{-19}\,\mathrm{rad/s}$. The switching curve is exact; the tiny leftover is the step size.

What makes this a nonlinear control problem is what happens when the switch is late, when $\dot{\theta}$ is noisy, or when the thruster has a minimum pulse. The state then crosses the curve, crosses back, and settles into a limit cycle around the origin instead of stopping at it. Sizing that cycle is the job of the on-off thruster lesson later in this module.
:::

::: warning
A phase portrait is a picture of an *autonomous* second-order system — one whose rules do not change with time. If the dynamics depend on time directly — a gain schedule, a commanded profile, a parameter being ramped — the arrows move, and trajectories drawn on one snapshot can cross. The elevator ramp of the previous lesson is exactly this case. The right reading there is a sequence of portraits, one per parameter value, which is what a bifurcation diagram summarizes.
:::

::: warning
Do not classify an equilibrium by eye from a simulation. A stable focus with $\zeta = 0.05$ and a center look identical over a few periods, and a slow saddle looks like a straight drift. Compute the Jacobian, take its trace and determinant, and let the chart decide.
:::

## Check yourself

::: check
A system has $\dot{x}_1 = x_2$, $\dot{x}_2 = -x_1 + x_1^3 - 0.5x_2$. Find the equilibria and classify each.
:::

::: answer
**Equilibria.** Set both rates to zero: $x_2 = 0$ and $-x_1 + x_1^3 = x_1(x_1^2 - 1) = 0$. So the equilibria are $(0,0)$, $(1,0)$ and $(-1,0)$.

**Jacobian.** $\begin{bmatrix}0 & 1\\ -1 + 3x_1^2 & -0.5\end{bmatrix}$.

**At the origin.** $\det = 1 > 0$ and $\operatorname{tr} = -0.5 < 0$, with $\operatorname{tr}^2 - 4\det = 0.25 - 4 = -3.75 < 0$. A stable focus, eigenvalues $-0.25 \pm 0.968j$.

**At $(\pm1, 0)$.** The lower-left entry is $-1 + 3 = +2$, so $\det = -2 < 0$: saddles. The eigenvalues solve $\lambda^2 + 0.5\lambda - 2 = 0$, giving $+1.186$ and $-1.686$. The two saddles' stable manifolds fence in the basin of the origin.
:::

::: check
Can the system in the previous question have a limit cycle? Answer without simulating.
:::

::: answer
No. Its divergence is

$$
\frac{\partial(x_2)}{\partial x_1} + \frac{\partial(-x_1 + x_1^3 - 0.5x_2)}{\partial x_2} = 0 + (-0.5) = -0.5,
$$

one negative value everywhere. So Bendixson's criterion rules out a closed orbit anywhere in the plane. With Poincaré–Bendixson, every bounded trajectory must end at one of the three equilibria. Since the saddles attract only the trajectories on their own stable manifolds, almost every bounded trajectory ends at the origin.
:::

::: check
In the damped gravity-gradient example, why does the damper raise the capture rate limit above the undamped value $\sqrt{k}$, and what would the limit be if the damper were twice as strong?
:::

::: answer
Without damping, energy is conserved. A satellite released at nadir with exactly $\sqrt{k}$ arrives at the saddle with zero rate and stays on the separatrix; any more and it goes over the top.

With damping, energy drains away during the swing. So the satellite can start with more than the separatrix energy and still fall short of the saddle. The limit rises: the measured value is $2.3793\times10^{-3}\,\mathrm{rad/s}$, against $1.4311\times10^{-3}$ without the damper.

Doubling $c$ (to $\zeta = 0.6$) drains energy faster and raises the limit further. The argument tells you the direction for free; the value needs the same bisection. Running it gives $3.468\times10^{-3}\,\mathrm{rad/s}$ ($0.199\,^\circ\mathrm{/s}$), $2.42$ times $\sqrt{k}$.
:::

::: check
Sketch, in words, the portrait of $\ddot{\theta} = u$ with the bang-bang law $u = -u_{\max}\operatorname{sign}(\theta)$ — position feedback only, no rate term. What does a trajectory do?
:::

::: answer
For $\theta > 0$ the torque is $-u_{\max}$ and the trajectories are left-opening parabolas. For $\theta < 0$ it is $+u_{\max}$ and they open to the right.

Start at $\theta_0 > 0$ at rest. The state follows a parabola down to the axis $\theta = 0$, arriving with rate $-\sqrt{2u_{\max}\theta_0}$. The torque switches, and it follows the mirror-image parabola out to $\theta = -\theta_0$ at rest, then back again.

The result is a closed orbit: an oscillation at the full starting amplitude that never decays. The switching line $\theta = 0$ is not the switching *curve*. Feedback on position alone gives no damping at all; the $\dot{\theta}\lvert\dot{\theta}\rvert$ term in the switching curve is what provides it.
:::

::: check
A departure study reports "the aircraft is stable at the test point: eigenvalues $-1.0 \pm 2.39j$". What single additional number would you ask for, and how would you obtain it?
:::

::: answer
Ask for the distance to the nearest basin edge, in the states a pilot or a gust can move. For this model: how many degrees of incidence, and how many degrees per second of pitch rate, separate the trim point from departure.

To get it, find the other equilibria of the nonlinear model (here the saddles at $+15.362^\circ$ and $-25.441^\circ$). Then bisect on the starting state along the directions you care about. That gives $5.28^\circ$ of incidence and $15.92\,^\circ\mathrm{/s}$ of rate in the dangerous direction. The eigenvalues describe the recovery once you are inside; the fence decides whether you are inside.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{A} = \partial\mathbf{f}/\partial\mathbf{x}$ at $\mathbf{x}_e$ | Jacobian; local linear model of the equilibrium |
| $\det\mathbf{A} < 0$ | Saddle; $\det > 0$ with $\operatorname{tr} < 0$ stable, $\operatorname{tr} > 0$ unstable |
| $\operatorname{tr}^2 < 4\det$ | Focus (spiral); otherwise node |
| Hyperbolic | No eigenvalue on the imaginary axis; local portrait matches the linear one |
| Separatrix | Stable manifold of a saddle; bounds a region of attraction |
| Poincaré–Bendixson | Bounded planar trajectory avoiding equilibria converges to a periodic orbit |
| Bendixson: $\nabla\cdot\mathbf{f}$ one sign | No closed orbit in that hole-free region |
| Index | A closed orbit encloses indices summing to $+1$; never a lone saddle |
| Damped gravity gradient, $\zeta = 0.3$ | Focus at $0, \pi$ ($-4.29\times10^{-4} \pm 1.365\times10^{-3}j$); saddles at $\pm\pi/2$ ($+1.065\times10^{-3}$, $-1.923\times10^{-3}$) |
| Capture limit $0.1363\,^\circ\mathrm{/s}$ | Release rate at nadir beyond which the bus settles $180^\circ$ over |
| Pitch model at $\delta = 4.8^\circ$ | Saddle $-25.44^\circ$, focus $+10.08^\circ$ ($\zeta = 0.386$), saddle $+15.36^\circ$; basin $1.54^\circ$ to $15.36^\circ$ from rest |
| $\theta + \dot{\theta}\lvert\dot{\theta}\rvert/(2u_{\max}) = 0$ | Switching curve for minimum-time control of $\ddot{\theta} = u$ |
| $J = 120$, $\pm0.5\,\mathrm{N\,m}$, $0.1\,\mathrm{rad}$ | Switch at $0.05\,\mathrm{rad}$ and $-0.0204\,\mathrm{rad/s}$; total $9.798\,\mathrm{s}$ |

The portrait tells you the type of each equilibrium but not how far its influence reaches, and it stops working above two states. The next lesson makes the local step precise — what the Jacobian does and does not prove about the nonlinear system — and shows the cases where it proves nothing at all.

::: context phase-word Why "phase"?
For a swinging pendulum, the pair (angle, rate) tells you exactly where in its swing it is: rising, at the top, or rushing through the bottom. That "where in the cycle" is what physicists call the **phase** of an oscillation, and the plane of all such pairs came to be called the phase plane. With more states it is **phase space**.

The key idea is that the pair is enough. Knowing only the angle is not: a pendulum at the bottom could be moving left or right. Knowing angle *and* rate fixes the whole future, which is why one point in this plane stands for one complete situation.
:::

::: context jacobian-word The Jacobian
The matrix of first derivatives is named after Carl Gustav Jacob Jacobi, a nineteenth-century German mathematician. For two states it holds four slopes:

$$
\mathbf{A} = \begin{bmatrix} \partial f_1/\partial x_1 & \partial f_1/\partial x_2 \\ \partial f_2/\partial x_1 & \partial f_2/\partial x_2 \end{bmatrix}.
$$

Each entry answers one question: "if I nudge this state a little, how much does that rate change?" It is the multi-variable version of the tangent-line slope from calculus. You will compute it constantly — for linearizing, for Newton's method, for the Kalman filter's covariance update.
:::

::: context trdet-chart The trace–determinant chart
Every $2\times2$ linear system lands somewhere on this chart, with trace across and determinant up. Below the axis ($\det < 0$) is all saddle. Above it, the left half is stable and the right half unstable. The blue parabola $\operatorname{tr}^2 = 4\det$ splits spirals (above it) from nodes (below it). The positive $\det$ axis, where the trace is zero, is the knife edge of centers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<rect x="28" y="160" width="304" height="32" fill="#fbe9e9"/>
<line x1="28" y1="160" x2="332" y2="160" stroke="#1f2a44"/><line x1="180" y1="10" x2="180" y2="192" stroke="#1f2a44"/>
<polyline points="28.0,32.0 31.8,38.3 35.6,44.5 39.4,50.5 43.2,56.3 47.0,62.0 50.8,67.5 54.6,72.9 58.4,78.1 62.2,83.1 66.0,88.0 69.8,92.7 73.6,97.3 77.4,101.7 81.2,105.9 85.0,110.0 88.8,113.9 92.6,117.7 96.4,121.3 100.2,124.7 104.0,128.0 107.8,131.1 111.6,134.1 115.4,136.9 119.2,139.5 123.0,142.0 126.8,144.3 130.6,146.5 134.4,148.5 138.2,150.3 142.0,152.0 145.8,153.5 149.6,154.9 153.4,156.1 157.2,157.1 161.0,158.0 164.8,158.7 168.6,159.3 172.4,159.7 176.2,159.9 180.0,160.0 183.8,159.9 187.6,159.7 191.4,159.3 195.2,158.7 199.0,158.0 202.8,157.1 206.6,156.1 210.4,154.9 214.2,153.5 218.0,152.0 221.8,150.3 225.6,148.5 229.4,146.5 233.2,144.3 237.0,142.0 240.8,139.5 244.6,136.9 248.4,134.1 252.2,131.1 256.0,128.0 259.8,124.7 263.6,121.3 267.4,117.7 271.2,113.9 275.0,110.0 278.8,105.9 282.6,101.7 286.4,97.3 290.2,92.7 294.0,88.0 297.8,83.1 301.6,78.1 305.4,72.9 309.2,67.5 313.0,62.0 316.8,56.3 320.6,50.5 324.4,44.5 328.2,38.3 332.0,32.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
<line x1="180" y1="12.800000000000011" x2="180" y2="160" stroke="#f2b880" stroke-width="3"/>
<text x="336" y="164" font-size="11" fill="#1f2a44" text-anchor="end" dy="14">tr</text>
<text x="186" y="18" font-size="11" fill="#1f2a44">det</text>
<text x="100" y="40" font-size="11" fill="#1f2a44" text-anchor="middle">stable focus</text>
<text x="260" y="40" font-size="11" fill="#1f2a44" text-anchor="middle">unstable focus</text>
<text x="56" y="120" font-size="11" fill="#1f2a44" text-anchor="middle">stable</text>
<text x="56" y="133" font-size="11" fill="#1f2a44" text-anchor="middle">node</text>
<text x="304" y="120" font-size="11" fill="#1f2a44" text-anchor="middle">unstable</text>
<text x="304" y="133" font-size="11" fill="#1f2a44" text-anchor="middle">node</text>
<text x="180" y="184" font-size="11" fill="#1f2a44" text-anchor="middle">saddle (det &lt; 0)</text>
<text x="186" y="80" font-size="11" fill="#9a5a1a">center</text>
<text x="298" y="101" font-size="11" fill="#1d6fd1" text-anchor="middle">tr² = 4 det</text>
</svg>
```

The eigenvalues are $\lambda = \tfrac{1}{2}\left(\operatorname{tr} \pm \sqrt{\operatorname{tr}^2 - 4\det}\right)$, which is where every line on the chart comes from. For a nonlinear equilibrium, the chart is trustworthy everywhere except on the center line — a point on it could be anything once the nonlinear terms have their say.
:::

::: context separatrix-word Close to a saddle
Near a saddle, trajectories behave like traffic at a roundabout that nobody is allowed to stay in. They come in along one direction and leave along the other. Only trajectories that start exactly on the incoming line (blue, the stable manifold) reach the saddle. Everything else, however close, bends away along the outgoing line (red, the unstable manifold).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<polyline points="185.0,10.0 187.6,40.5 190.1,55.5 192.7,64.5 195.2,70.5 197.8,74.7 200.4,77.9 202.9,80.4 205.5,82.3 208.0,83.9 210.6,85.3 213.2,86.4 215.7,87.4 218.3,88.2 220.8,89.0 223.4,89.6 225.9,90.2 228.5,90.7 231.1,91.2 233.6,91.6 236.2,92.0 238.7,92.3 241.3,92.7 243.9,93.0 246.4,93.2 249.0,93.5 251.5,93.7 254.1,93.9 256.7,94.1 259.2,94.3 261.8,94.5 264.3,94.7 266.9,94.8 269.5,95.0 272.0,95.1 274.6,95.2 277.1,95.4 279.7,95.5 282.3,95.6 284.8,95.7 287.4,95.8 289.9,95.9 292.5,96.0 295.1,96.1 297.6,96.2 300.2,96.3 302.7,96.3 305.3,96.4 307.8,96.5 310.4,96.5 313.0,96.6 315.5,96.7 318.1,96.7 320.6,96.8 323.2,96.9 325.8,96.9 328.3,97.0 330.9,97.0 333.4,97.1 336.0,97.1" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
<polygon points="233.9,91.8 223.3,93.8 224.8,85.9" fill="#6c7a93"/>
<polyline points="185.0,190.0 187.6,159.5 190.1,144.5 192.7,135.5 195.2,129.5 197.8,125.3 200.4,122.1 202.9,119.6 205.5,117.7 208.0,116.1 210.6,114.7 213.2,113.6 215.7,112.6 218.3,111.8 220.8,111.0 223.4,110.4 225.9,109.8 228.5,109.3 231.1,108.8 233.6,108.4 236.2,108.0 238.7,107.7 241.3,107.3 243.9,107.0 246.4,106.8 249.0,106.5 251.5,106.3 254.1,106.1 256.7,105.9 259.2,105.7 261.8,105.5 264.3,105.3 266.9,105.2 269.5,105.0 272.0,104.9 274.6,104.8 277.1,104.6 279.7,104.5 282.3,104.4 284.8,104.3 287.4,104.2 289.9,104.1 292.5,104.0 295.1,103.9 297.6,103.8 300.2,103.7 302.7,103.7 305.3,103.6 307.8,103.5 310.4,103.5 313.0,103.4 315.5,103.3 318.1,103.3 320.6,103.2 323.2,103.1 325.8,103.1 328.3,103.0 330.9,103.0 333.4,102.9 336.0,102.9" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
<polygon points="233.9,108.2 224.8,114.1 223.3,106.2" fill="#6c7a93"/>
<polyline points="175.0,10.0 172.4,40.5 169.9,55.5 167.3,64.5 164.8,70.5 162.2,74.7 159.6,77.9 157.1,80.4 154.5,82.3 152.0,83.9 149.4,85.3 146.8,86.4 144.3,87.4 141.7,88.2 139.2,89.0 136.6,89.6 134.1,90.2 131.5,90.7 128.9,91.2 126.4,91.6 123.8,92.0 121.3,92.3 118.7,92.7 116.1,93.0 113.6,93.2 111.0,93.5 108.5,93.7 105.9,93.9 103.3,94.1 100.8,94.3 98.2,94.5 95.7,94.7 93.1,94.8 90.5,95.0 88.0,95.1 85.4,95.2 82.9,95.4 80.3,95.5 77.7,95.6 75.2,95.7 72.6,95.8 70.1,95.9 67.5,96.0 64.9,96.1 62.4,96.2 59.8,96.3 57.3,96.3 54.7,96.4 52.2,96.5 49.6,96.5 47.0,96.6 44.5,96.7 41.9,96.7 39.4,96.8 36.8,96.9 34.2,96.9 31.7,97.0 29.1,97.0 26.6,97.1 24.0,97.1" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
<polygon points="126.1,91.8 135.2,85.9 136.7,93.8" fill="#6c7a93"/>
<polyline points="175.0,190.0 172.4,159.5 169.9,144.5 167.3,135.5 164.8,129.5 162.2,125.3 159.6,122.1 157.1,119.6 154.5,117.7 152.0,116.1 149.4,114.7 146.8,113.6 144.3,112.6 141.7,111.8 139.2,111.0 136.6,110.4 134.1,109.8 131.5,109.3 128.9,108.8 126.4,108.4 123.8,108.0 121.3,107.7 118.7,107.3 116.1,107.0 113.6,106.8 111.0,106.5 108.5,106.3 105.9,106.1 103.3,105.9 100.8,105.7 98.2,105.5 95.7,105.3 93.1,105.2 90.5,105.0 88.0,104.9 85.4,104.8 82.9,104.6 80.3,104.5 77.7,104.4 75.2,104.3 72.6,104.2 70.1,104.1 67.5,104.0 64.9,103.9 62.4,103.8 59.8,103.7 57.3,103.7 54.7,103.6 52.2,103.5 49.6,103.5 47.0,103.4 44.5,103.3 41.9,103.3 39.4,103.2 36.8,103.1 34.2,103.1 31.7,103.0 29.1,103.0 26.6,102.9 24.0,102.9" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
<polygon points="126.1,108.2 136.7,106.2 135.2,114.1" fill="#6c7a93"/>
<polyline points="195.0,10.0 197.4,22.4 199.8,31.7 202.2,39.1 204.6,45.0 206.9,49.9 209.3,54.0 211.7,57.5 214.1,60.4 216.5,63.0 218.9,65.3 221.3,67.3 223.7,69.1 226.1,70.7 228.5,72.1 230.8,73.5 233.2,74.6 235.6,75.7 238.0,76.7 240.4,77.7 242.8,78.5 245.2,79.3 247.6,80.0 250.0,80.7 252.4,81.3 254.7,81.9 257.1,82.5 259.5,83.0 261.9,83.5 264.3,84.0 266.7,84.4 269.1,84.8 271.5,85.2 273.9,85.6 276.3,86.0 278.6,86.3 281.0,86.6 283.4,86.9 285.8,87.2 288.2,87.5 290.6,87.8 293.0,88.1 295.4,88.3 297.8,88.5 300.2,88.8 302.5,89.0 304.9,89.2 307.3,89.4 309.7,89.6 312.1,89.8 314.5,90.0 316.9,90.1 319.3,90.3 321.7,90.5 324.1,90.6 326.4,90.8 328.8,90.9 331.2,91.1 333.6,91.2 336.0,91.3" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
<polygon points="233.2,74.9 222.5,73.3 226.6,66.4" fill="#6c7a93"/>
<polyline points="195.0,190.0 197.4,177.6 199.8,168.3 202.2,160.9 204.6,155.0 206.9,150.1 209.3,146.0 211.7,142.5 214.1,139.6 216.5,137.0 218.9,134.7 221.3,132.7 223.7,130.9 226.1,129.3 228.5,127.9 230.8,126.5 233.2,125.4 235.6,124.3 238.0,123.3 240.4,122.3 242.8,121.5 245.2,120.7 247.6,120.0 250.0,119.3 252.4,118.7 254.7,118.1 257.1,117.5 259.5,117.0 261.9,116.5 264.3,116.0 266.7,115.6 269.1,115.2 271.5,114.8 273.9,114.4 276.3,114.0 278.6,113.7 281.0,113.4 283.4,113.1 285.8,112.8 288.2,112.5 290.6,112.2 293.0,111.9 295.4,111.7 297.8,111.5 300.2,111.2 302.5,111.0 304.9,110.8 307.3,110.6 309.7,110.4 312.1,110.2 314.5,110.0 316.9,109.9 319.3,109.7 321.7,109.5 324.1,109.4 326.4,109.2 328.8,109.1 331.2,108.9 333.6,108.8 336.0,108.7" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
<polygon points="233.2,125.1 226.6,133.6 222.5,126.7" fill="#6c7a93"/>
<polyline points="165.0,10.0 162.6,22.4 160.2,31.7 157.8,39.1 155.4,45.0 153.1,49.9 150.7,54.0 148.3,57.5 145.9,60.4 143.5,63.0 141.1,65.3 138.7,67.3 136.3,69.1 133.9,70.7 131.5,72.1 129.2,73.5 126.8,74.6 124.4,75.7 122.0,76.7 119.6,77.7 117.2,78.5 114.8,79.3 112.4,80.0 110.0,80.7 107.6,81.3 105.3,81.9 102.9,82.5 100.5,83.0 98.1,83.5 95.7,84.0 93.3,84.4 90.9,84.8 88.5,85.2 86.1,85.6 83.7,86.0 81.4,86.3 79.0,86.6 76.6,86.9 74.2,87.2 71.8,87.5 69.4,87.8 67.0,88.1 64.6,88.3 62.2,88.5 59.8,88.8 57.5,89.0 55.1,89.2 52.7,89.4 50.3,89.6 47.9,89.8 45.5,90.0 43.1,90.1 40.7,90.3 38.3,90.5 35.9,90.6 33.6,90.8 31.2,90.9 28.8,91.1 26.4,91.2 24.0,91.3" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
<polygon points="126.8,74.9 133.4,66.4 137.5,73.3" fill="#6c7a93"/>
<polyline points="165.0,190.0 162.6,177.6 160.2,168.3 157.8,160.9 155.4,155.0 153.1,150.1 150.7,146.0 148.3,142.5 145.9,139.6 143.5,137.0 141.1,134.7 138.7,132.7 136.3,130.9 133.9,129.3 131.5,127.9 129.2,126.5 126.8,125.4 124.4,124.3 122.0,123.3 119.6,122.3 117.2,121.5 114.8,120.7 112.4,120.0 110.0,119.3 107.6,118.7 105.3,118.1 102.9,117.5 100.5,117.0 98.1,116.5 95.7,116.0 93.3,115.6 90.9,115.2 88.5,114.8 86.1,114.4 83.7,114.0 81.4,113.7 79.0,113.4 76.6,113.1 74.2,112.8 71.8,112.5 69.4,112.2 67.0,111.9 64.6,111.7 62.2,111.5 59.8,111.2 57.5,111.0 55.1,110.8 52.7,110.6 50.3,110.4 47.9,110.2 45.5,110.0 43.1,109.9 40.7,109.7 38.3,109.5 35.9,109.4 33.6,109.2 31.2,109.1 28.8,108.9 26.4,108.8 24.0,108.7" fill="none" stroke="#6c7a93" stroke-width="1.2"/>
<polygon points="126.8,125.1 137.5,126.7 133.4,133.6" fill="#6c7a93"/>
<line x1="20" y1="100" x2="340" y2="100" stroke="#b4232c" stroke-width="2.5"/>
<line x1="180" y1="8" x2="180" y2="192" stroke="#1d6fd1" stroke-width="2.5"/>
<polygon points="53,100 65,95 65,105" fill="#b4232c"/>
<polygon points="307,100 295,95 295,105" fill="#b4232c"/>
<polygon points="180,47 175,35 185,35" fill="#1d6fd1"/>
<polygon points="180,153 175,165 185,165" fill="#1d6fd1"/>
<circle cx="180" cy="100" r="4.5" fill="white" stroke="#1f2a44" stroke-width="2"/>
<rect x="190" y="9" width="166" height="15" fill="white"/><text x="192" y="20" font-size="11" fill="#1d6fd1">stable manifold: the separatrix</text>
<rect x="240" y="104" width="98" height="15" fill="white"/><text x="336" y="115" font-size="11" fill="#b4232c" text-anchor="end">unstable manifold</text>
</svg>
```

So the incoming line is a knife edge. Start a hair on one side and you leave one way; a hair on the other side and you leave the other way. That is why it is called a **separatrix**, from the Latin for "one who separates".
:::

::: context upside-down A satellite that settles the wrong way up
Gravity gradient cannot tell up from down. The torque depends on $\sin 2\theta$, which is the same at $\theta$ and $\theta + 180^\circ$, so pointing the boom at the Earth and pointing it at the sky are equally stable.

For a satellite whose antenna or camera must face the Earth, the upside-down capture is a mission failure even though the attitude is perfectly steady. That is why capture analysis, like the example here, sets a maximum release rate, and why designers plan a way to detect the wrong capture and flip the vehicle — for instance with a magnetic torquer or a brief thruster firing.
:::

::: context poincare-bendixson Why the plane is special
The theorem carries the names of Henri Poincaré, the French mathematician who founded the geometric study of differential equations in the late 1800s, and Ivar Bendixson, a Swedish mathematician who completed the proof around 1901.

Its power comes from the fact that a closed loop in a plane has an inside and an outside, and a trajectory cannot cross another trajectory. In three dimensions a path can loop over and under itself forever without repeating. Edward Lorenz's 1963 weather model, with only three states, did exactly that — one of the first clear examples of chaos. In the plane that can never happen.
:::

::: context divergence-picture What divergence measures
Drop a small blob of ink into a flowing stream and watch its area. If the flow spreads the blob out, the divergence is positive; if it squeezes it together, the divergence is negative.

For a mechanical system with damping $c$, the divergence is $-c$: damping steadily shrinks every patch of starting states. A closed orbit would have to bring a patch back to where it started, with the same area it began with. A flow that shrinks area everywhere cannot do that — which is Bendixson's criterion in one sentence. Green's theorem is the calculus that turns "area inside a loop" into "flow across the loop" and makes the argument exact.
:::

::: context switching-picture The switching curve drawn
Here the angle $\theta$ runs across and the rate up, in units where $u_{\max} = 1$. The blue switching curve is made of two half-parabolas meeting at the origin. Above and right of it the law applies $-u_{\max}$; below and left, $+u_{\max}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<line x1="20" y1="100" x2="340" y2="100" stroke="#6c7a93"/><line x1="180" y1="8" x2="180" y2="192" stroke="#6c7a93"/>
<polyline points="336.9,185.5 330.0,183.6 323.3,181.7 316.7,179.8 310.3,177.9 304.0,176.0 297.9,174.1 291.9,172.2 286.1,170.3 280.4,168.4 274.9,166.5 269.6,164.6 264.4,162.7 259.4,160.8 254.5,158.9 249.8,157.0 245.2,155.1 240.8,153.2 236.5,151.3 232.4,149.4 228.4,147.5 224.6,145.6 221.0,143.7 217.5,141.8 214.2,139.9 211.0,138.0 208.0,136.1 205.1,134.2 202.4,132.3 199.8,130.4 197.4,128.5 195.2,126.6 193.1,124.7 191.2,122.8 189.4,120.9 187.8,119.0 186.3,117.1 185.0,115.2 183.8,113.3 182.8,111.4 181.9,109.5 181.2,107.6 180.7,105.7 180.3,103.8 180.1,101.9 180.0,100.0 179.9,98.1 179.7,96.2 179.3,94.3 178.8,92.4 178.1,90.5 177.2,88.6 176.2,86.7 175.0,84.8 173.7,82.9 172.2,81.0 170.6,79.1 168.8,77.2 166.9,75.3 164.8,73.4 162.6,71.5 160.2,69.6 157.6,67.7 154.9,65.8 152.0,63.9 149.0,62.0 145.8,60.1 142.5,58.2 139.0,56.3 135.4,54.4 131.6,52.5 127.6,50.6 123.5,48.7 119.2,46.8 114.8,44.9 110.2,43.0 105.5,41.1 100.6,39.2 95.6,37.3 90.4,35.4 85.1,33.5 79.6,31.6 73.9,29.7 68.1,27.8 62.1,25.9 56.0,24.0 49.7,22.1 43.3,20.2 36.7,18.3 30.0,16.4 23.1,14.5" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
<polyline points="273.0,100.0 273.0,101.2 272.9,102.4 272.7,103.6 272.5,104.8 272.2,106.0 271.9,107.2 271.5,108.4 271.0,109.5 270.5,110.7 269.9,111.9 269.3,113.1 268.6,114.3 267.8,115.5 267.0,116.7 266.1,117.9 265.2,119.1 264.2,120.3 263.1,121.5 262.0,122.7 260.8,123.9 259.5,125.1 258.2,126.3 256.8,127.4 255.4,128.6 253.9,129.8 252.3,131.0 250.7,132.2 249.0,133.4 247.3,134.6 245.5,135.8 243.6,137.0 241.7,138.2 239.7,139.4 237.7,140.6 235.5,141.8 233.4,143.0 231.1,144.2 228.9,145.3 226.5,146.5" fill="none" stroke="#b4232c" stroke-width="2"/>
<polyline points="226.5,146.5 224.1,145.3 221.9,144.2 219.6,143.0 217.5,141.8 215.3,140.6 213.3,139.4 211.3,138.2 209.4,137.0 207.5,135.8 205.7,134.6 204.0,133.4 202.3,132.2 200.7,131.0 199.1,129.8 197.6,128.6 196.2,127.4 194.8,126.3 193.5,125.1 192.2,123.9 191.0,122.7 189.9,121.5 188.8,120.3 187.8,119.1 186.9,117.9 186.0,116.7 185.2,115.5 184.4,114.3 183.7,113.1 183.1,111.9 182.5,110.7 182.0,109.5 181.5,108.4 181.1,107.2 180.8,106.0 180.5,104.8 180.3,103.6 180.1,102.4 180.0,101.2 180.0,100.0" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 3"/>
<circle cx="273.0" cy="100" r="4" fill="#b4232c"/><circle cx="226.5" cy="146.5" r="4" fill="white" stroke="#b4232c" stroke-width="2"/>
<text x="273" y="92" font-size="11" fill="#b4232c" text-anchor="middle">start</text>
<text x="236" y="163" font-size="11" fill="#b4232c">switch</text>
<text x="336" y="116" font-size="11" fill="#1f2a44" text-anchor="end">angle θ</text><text x="186" y="18" font-size="11" fill="#1f2a44">rate dθ/dt</text>
<text x="270" y="40" font-size="11" fill="#1f2a44" text-anchor="middle">u = −u_max</text>
<text x="90" y="170" font-size="11" fill="#1f2a44" text-anchor="middle">u = +u_max</text>
<text x="30" y="40" font-size="11" fill="#1d6fd1">switching curve</text>
</svg>
```

The red path starts at rest at $\theta = 1.5$. Full negative torque drives it down a left-opening parabola until it meets the curve at $\theta = 0.75$. There the torque flips, and the state rides the curve (dashed) into the origin. Two thruster firings, one switch, and nothing wasted.
:::

::: context bang-bang-word Why "bang-bang"?
The name describes what it sounds like. A control that only ever sits at its two extreme values slams from one stop to the other — bang, then bang again, the way a relay clicks hard between its two positions.

It is not a crude shortcut. For a system with a limited actuator, the fastest possible maneuver really does use full effort all the time, switching only where needed; later courses on optimal control prove this with Pontryagin's principle. Spacecraft thrusters, which are either firing or not, are bang-bang actuators by nature.
:::
