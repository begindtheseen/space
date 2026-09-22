---
id: l02-phase-plane-and-equilibrium-classification
title: Phase-plane analysis and equilibrium classification
minutes: 20
covers:
  - 'Phase-plane analysis and equilibrium classification'
---

The phase plane is the oldest tool in nonlinear control and still the one that teaches the most per minute spent. You met it in the ODE module: plot the state $(x_1, x_2)$ instead of plotting each against time, and the family of curves through every starting point — the phase portrait — is a complete map of everything the system can do. There you used it on linear systems, and the trace–determinant chart told you which of six pictures you were looking at.

Nothing about that construction needed linearity. For any second-order system $\dot{x}_1 = f_1(x_1, x_2)$, $\dot{x}_2 = f_2(x_1, x_2)$ the vector $(f_1, f_2)$ is an arrow at every point, and trajectories follow the arrows. What changes is that there are now several equilibria instead of one, each with its own local picture; that curves called separatrices divide the plane into regions with different fates; and that the global structure — which is what you actually want — has to be assembled from local pieces plus a few theorems about what is possible in two dimensions.

This lesson does that assembly. By the end you can take a nonlinear second-order model, find its equilibria, classify each one from a Jacobian, identify the separatrices that bound the useful region, and say with confidence whether the system can have a limit cycle at all. Those are the same steps a departure analysis or an attitude-acquisition study takes, and the numbers in the examples are the answers such a study produces.

## The portrait of a nonlinear system

Write the system as $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$ with $\mathbf{x} \in \mathbb{R}^2$. Three facts organise everything.

**Trajectories never cross.** Where $\mathbf{f}$ is continuously differentiable, exactly one trajectory passes through each point, because the solution through a given state is unique. This is stronger in two dimensions than anywhere else: a closed curve in the plane separates inside from outside, so a trajectory trapped inside one can never escape.

**Equilibria are where the arrow vanishes.** Solve $\mathbf{f}(\mathbf{x}_e) = \mathbf{0}$. Everything else in the portrait is organised around these points.

**Nullclines locate them cheaply.** The $x_1$-nullcline is the curve $f_1 = 0$, on which trajectories move vertically; the $x_2$-nullcline is $f_2 = 0$, on which they move horizontally. Equilibria are the intersections. For a mechanical system written as $\dot{x}_1 = x_2$, $\dot{x}_2 = g(x_1, x_2)$ the first nullcline is the horizontal axis and the equilibria all sit on it, which is why attitude and incidence portraits are read along that axis.

The same orientation rules as in the linear case still hold for a mechanical system: in the upper half plane $x_2 = \dot{x}_1 > 0$ so motion is to the right, in the lower half to the left, and trajectories cross the horizontal axis vertically. Trajectories circulate clockwise.

## Classifying one equilibrium

Zoom in far enough on an equilibrium and the system looks linear. Expand $\mathbf{f}$ about $\mathbf{x}_e$ with $\mathbf{z} = \mathbf{x} - \mathbf{x}_e$:

$$
\dot{\mathbf{z}} = \mathbf{f}(\mathbf{x}_e + \mathbf{z}) = \underbrace{\mathbf{f}(\mathbf{x}_e)}_{=\,\mathbf{0}} + \mathbf{A}\mathbf{z} + O(\lVert\mathbf{z}\rVert^2),
\qquad
\mathbf{A} = \left.\frac{\partial\mathbf{f}}{\partial\mathbf{x}}\right|_{\mathbf{x}_e} .
$$

$\mathbf{A}$ is the **Jacobian** at that equilibrium, and for a mechanical system $\dot{x}_1 = x_2$, $\dot{x}_2 = g(x_1,x_2)$ it is

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 \\ \partial g/\partial x_1 & \partial g/\partial x_2\end{bmatrix} ,
$$

so $\operatorname{tr}\mathbf{A} = \partial g/\partial\dot{x}_1$ is the damping and $\det\mathbf{A} = -\partial g/\partial x_1$ is the stiffness. The ODE module's chart then reads the local picture straight off.

::: key
Classification of an equilibrium from its Jacobian $\mathbf{A}$, via $\det\mathbf{A}$ and $\operatorname{tr}\mathbf{A}$: $\det < 0$ is a **saddle** (unstable, one incoming and one outgoing eigendirection). With $\det > 0$: $\operatorname{tr} < 0$ is stable and $\operatorname{tr} > 0$ unstable, and the motion is a **focus** (spiral) when $\operatorname{tr}^2 < 4\det$ and a **node** when $\operatorname{tr}^2 \ge 4\det$. $\operatorname{tr} = 0$ with $\det > 0$ is a **centre**. An equilibrium is **hyperbolic** when no eigenvalue of $\mathbf{A}$ has zero real part.
:::

The qualification at the end is the one the ODE module did not need. For a hyperbolic equilibrium the nonlinear portrait near it really does look like the linear one — same type, same stability, curves merely bent. For a non-hyperbolic equilibrium, a centre or anything with an eigenvalue on the imaginary axis, the neighbourhood is decided by the terms the linearisation threw away, and the picture can be anything. That is the whole subject of the next lesson.

::: example The gravity-gradient satellite with a damper
Take the $400\,\mathrm{km}$ bus from the previous lesson, $k = 3n^2(I_x - I_z)/I_y = 2.048\times10^{-6}\,\mathrm{s^{-2}}$, and add a passive damper of coefficient $c$, so

$$
\ddot{\theta} = -k\sin\theta\cos\theta - c\,\dot{\theta} .
$$

Choose $c = 2\zeta\sqrt{k}$ with $\zeta = 0.3$, giving $c = 8.587\times10^{-4}\,\mathrm{s^{-1}}$. Equilibria: $\dot\theta = 0$ and $\sin\theta\cos\theta = 0$, so $\theta = 0, \pi/2, \pi, 3\pi/2$ as before — damping never moves an equilibrium, it only changes its type.

At $\theta = 0$ the Jacobian is $\begin{bmatrix} 0 & 1 \\ -k & -c\end{bmatrix}$: $\det = k = 2.048\times10^{-6} > 0$, $\operatorname{tr} = -c < 0$, and $\operatorname{tr}^2 - 4\det = -7.4\times10^{-6} < 0$. A **stable focus**, eigenvalues $-4.293\times10^{-4} \pm 1.3652\times10^{-3}j$. The same at $\theta = \pi$.

At $\theta = \pi/2$ the stiffness flips sign: $\begin{bmatrix} 0 & 1 \\ +k & -c\end{bmatrix}$, $\det = -k < 0$. A **saddle**, eigenvalues $+1.0648\times10^{-3}$ and $-1.9235\times10^{-3}\,\mathrm{s^{-1}}$, with eigenvectors $[1,\ \lambda]^\mathsf{T}$ — that is, straight-line trajectories on which $\dot{\theta} = \lambda\,\Delta\theta$. The incoming one, slope $-1.9235\times10^{-3}$, is the **separatrix**: the only route into the saddle, and the boundary of the region that spirals into nadir.

That boundary is an operational number. Release the satellite at $\theta = 0$ with a residual rate and ask how much rate it survives. Bisecting on the initial rate with a fourth-order Runge–Kutta step of $1\,\mathrm{s}$ over $60000\,\mathrm{s}$ gives a limit of $2.3793\times10^{-3}\,\mathrm{rad/s} = 0.1363\,^\circ\mathrm{/s}$. Just below it, at $0.98$ of the limit, the satellite swings out to $82.6^\circ$, comes back, and spirals into nadir. Just above it, at $1.02$, it tumbles over the saddle and spirals into the *other* stable equilibrium at $180^\circ$ — boom reversed, attitude upside down, gravity gradient perfectly content.

Compare with the undamped case, where the separatrix is a level set of energy: $\tfrac{1}{2}\dot{\theta}^2 + \tfrac{k}{2}\sin^2\theta = \tfrac{k}{2}$ gives a crossing rate at $\theta = 0$ of exactly $\sqrt{k} = 1.4311\times10^{-3}\,\mathrm{rad/s}$. The damper raises the capture limit by a factor of $1.66$, because it takes energy out during the swing. This is what a deployment sequence is sized against: get the rate below $0.136\,^\circ\mathrm{/s}$ before releasing the boom, or accept a coin flip between two attitudes $180^\circ$ apart.
:::

## Separatrices, basins, and the shape of the safe region

The **region of attraction** (or basin) of an asymptotically stable equilibrium is the set of initial states from which trajectories converge to it. In the plane its boundary is built from the stable manifolds of nearby saddles — the curves that run *into* a saddle — together with any unstable periodic orbits. That is why saddles matter out of all proportion to the time a system spends near them: you never sit at a saddle, but its incoming curve is the fence.

For a hyperbolic saddle the stable manifold leaves the equilibrium tangent to the eigenvector of the negative eigenvalue. To draw it, start a hair away from the saddle along that eigenvector and integrate *backwards* in time; forward integration runs away along the other eigenvector instead. Numerically it is easier to find the fence by bisection, as the example above did: pick a ray of initial conditions and find where the outcome changes.

::: example Where the departure boundary really is
Return to the vehicle of the previous lesson at a fixed elevator of $\delta = 4.80^\circ$, with the pitch model

$$
\ddot{\alpha} = a_m\left(-0.9\,\alpha + 6\,\alpha^3 + 1.5\,\delta\right) - 2.0\,\dot{\alpha},
\qquad a_m = 19.6\,\mathrm{s^{-2}} .
$$

The cubic has three roots, so there are three equilibria, all on the $\dot{\alpha} = 0$ axis. The Jacobian is $\begin{bmatrix}0 & 1 \\ a_m(-0.9 + 18\alpha^2) & -2\end{bmatrix}$, so $\operatorname{tr} = -2$ at every one of them and only $\det$ varies:

| $\alpha_e$ | $\det\mathbf{A}$ | Eigenvalues ($\mathrm{s^{-1}}$) | Type |
| --- | --- | --- | --- |
| $-25.441^\circ$ | $-51.92$ | $+6.275$, $-8.275$ | saddle |
| $+10.080^\circ$ | $+6.721$ | $-1.000 \pm 2.3919j$ | stable focus |
| $+15.362^\circ$ | $-7.720$ | $+1.953$, $-3.953$ | saddle |

The focus has $\omega_n = \sqrt{6.721} = 2.592\,\mathrm{rad/s}$ and $\zeta = 2/(2\times2.592) = 0.386$ — a perfectly respectable short period, and exactly what a linear analysis about the trim point would have reported. The saddles are what a linear analysis about the trim point cannot report.

Measuring the basin with the same bisection, at $\Delta t = 1\,\mathrm{ms}$ over $40\,\mathrm{s}$:

- Released **from rest**, the vehicle recovers to trim only for $1.54^\circ < \alpha < 15.36^\circ$. The upper end is the saddle itself. The lower end is *not* an equilibrium: released at rest below $1.54^\circ$, the nose-up moment accelerates the vehicle so hard that it overshoots the saddle at $15.36^\circ$ on the way up and departs. Starting at $\alpha = 0$ with the elevator already at $4.80^\circ$ is a departure.
- **At trim**, a rate gust is survivable from $-43.24\,^\circ\mathrm{/s}$ to $+15.92\,^\circ\mathrm{/s}$. The asymmetry is geometric: the far saddle at $-25.44^\circ$ is a long way downhill, the near one at $+15.36^\circ$ is $5.3^\circ$ uphill.

So the honest description of this operating point is "stable with $\zeta = 0.39$, and $5.3^\circ$ or $16\,^\circ\mathrm{/s}$ from the fence". Nothing in the eigenvalues contains the second half of that sentence.
:::

## What is possible in two dimensions

The plane is restrictive, and the restrictions are useful. Three results cover most of what you need.

**Poincaré–Bendixson.** If a trajectory of a planar system stays in a closed bounded region containing no equilibrium, it must converge to a periodic orbit. Two dimensions leave nowhere else to go: the trajectory cannot cross itself and cannot escape. This is the reason limit cycles are so prominent in planar analysis, and it fails completely in three dimensions, where the leftover possibility is chaos.

**Bendixson's criterion.** If $\nabla\cdot\mathbf{f} = \partial f_1/\partial x_1 + \partial f_2/\partial x_2$ is not identically zero and does not change sign in a region $D$ with no holes in it, then no closed orbit lies entirely in $D$. The proof is Green's theorem: around a closed orbit $\oint (f_1\,dx_2 - f_2\,dx_1) = 0$ because the velocity is tangent, while the same integral equals $\iint_D \nabla\cdot\mathbf{f}\,dA$, which cannot vanish if the divergence keeps one sign.

This is cheap and decisive. For the pitch model above, $\nabla\cdot\mathbf{f} = \partial(\dot\alpha)/\partial\alpha + \partial(\ddot\alpha)/\partial\dot\alpha = 0 + (-2) = -2$ everywhere. No periodic orbit exists anywhere in that plane, at any elevator setting, so every bounded trajectory ends at one of the three equilibria — which is what licensed the basin measurement above to use "did it reach the trim point" as its test. For van der Pol, $\nabla\cdot\mathbf{f} = \mu(1 - x^2)$ changes sign at $x = \pm 1$, so the criterion says nothing, and indeed there is a cycle of amplitude $2$.

**Index.** Any closed orbit in the plane must enclose at least one equilibrium, and the enclosed equilibria's indices must sum to $+1$ (a node, focus or centre has index $+1$; a saddle has index $-1$). A limit cycle around empty space is impossible, and a limit cycle enclosing exactly one saddle is impossible.

::: key
In the plane: **Poincaré–Bendixson** — a bounded trajectory that stays away from equilibria converges to a periodic orbit. **Bendixson** — if $\nabla\cdot\mathbf{f}$ has one sign throughout a hole-free region, no closed orbit lies in it. **Index** — a closed orbit encloses equilibria whose indices sum to $+1$, so it must enclose at least one, and never a single saddle alone.
:::

## The switching curve

One nonlinear portrait is worth drawing from memory, because every thruster-controlled vehicle lives in it. Take the double integrator $\ddot{\theta} = u$ with $|u| \le u_{\max}$ — a rigid body with an on-off torque. For constant $u$, multiply by $\dot{\theta}$ and integrate: $\tfrac{1}{2}\dot{\theta}^2 = u\theta + \text{const}$. Trajectories are parabolas, opening right for $u > 0$ and left for $u < 0$.

Only two of those parabolas reach the origin at rest, namely $\dot{\theta}^2 = -2u_{\max}\theta$ with $\dot\theta > 0$ and $\dot{\theta}^2 = 2u_{\max}\theta$ with $\dot\theta < 0$. Together they form the **switching curve**

$$
\theta + \frac{\dot{\theta}\,\lvert\dot{\theta}\rvert}{2u_{\max}} = 0 ,
$$

and the minimum-time control is to apply full torque of one sign until the state hits this curve, then full torque of the other sign, which rides the curve into the origin. The nonlinear switching law $u = -u_{\max}\operatorname{sign}\!\left(\theta + \dot{\theta}\lvert\dot{\theta}\rvert/(2u_{\max})\right)$ is read directly off the picture.

::: example A minimum-time slew on thrusters
A spacecraft with $J = 120\,\mathrm{kg\,m^2}$ and a thruster pair giving $\pm 0.5\,\mathrm{N\,m}$ has $u_{\max} = 0.5/120 = 4.1667\times10^{-3}\,\mathrm{rad/s^2}$. Slew $\theta_0 = 0.1\,\mathrm{rad}$ ($5.73^\circ$) to rest.

By symmetry the switch is at half the angle, $\theta = 0.05\,\mathrm{rad}$, where the rate is $\dot{\theta} = -\sqrt{2u_{\max}(0.05)} = -0.020412\,\mathrm{rad/s}$. Each phase lasts $\sqrt{\theta_0/u_{\max}} = 4.899\,\mathrm{s}$, so the manoeuvre takes $9.798\,\mathrm{s}$. Integrating the two-phase profile at $\Delta t = 0.1\,\mathrm{ms}$ lands at $\theta = -8.4\times10^{-7}\,\mathrm{rad}$ with a rate of $1.5\times10^{-19}\,\mathrm{rad/s}$ — the switching curve is exact, and the residual is the step size.

What makes this a nonlinear control problem rather than an exercise is what happens when the switch is late, when there is sensor noise on $\dot{\theta}$, or when the thruster has a minimum impulse. The state then crosses the curve, recrosses, and settles into a limit cycle around the origin instead of stopping at it. Sizing that cycle is the business of the on-off thruster control lesson later in this module.
:::

::: warning
A phase portrait is a picture of an *autonomous* second-order system. If the dynamics depend explicitly on time — a gain schedule, a commanded profile, a parameter being ramped — the arrows move and trajectories drawn on one snapshot can cross. The elevator ramp of the previous lesson is exactly this case, and the right reading is a sequence of portraits, one per parameter value, which is precisely what a bifurcation diagram summarises.
:::

::: warning
Do not classify an equilibrium by eye from a simulation. A stable focus with $\zeta = 0.05$ and a centre look identical over a few periods, and a slow saddle looks like a straight drift. Compute the Jacobian, take its trace and determinant, and let the chart decide.
:::

## Check yourself

::: check
A system has $\dot{x}_1 = x_2$, $\dot{x}_2 = -x_1 + x_1^3 - 0.5x_2$. Find the equilibria and classify each.
:::

::: answer
Equilibria need $x_2 = 0$ and $x_1(x_1^2 - 1) = 0$, so $(0,0)$, $(1,0)$ and $(-1,0)$. The Jacobian is $\begin{bmatrix}0 & 1\\ -1 + 3x_1^2 & -0.5\end{bmatrix}$. At the origin $\det = 1 > 0$, $\operatorname{tr} = -0.5$, $\operatorname{tr}^2 - 4\det = -3.75 < 0$: a stable focus, eigenvalues $-0.25 \pm 0.968j$. At $(\pm1, 0)$ the lower-left entry is $-1 + 3 = +2$, so $\det = -2 < 0$: saddles, eigenvalues from $\lambda^2 + 0.5\lambda - 2 = 0$, namely $+1.186$ and $-1.686$. The two saddles' stable manifolds bound the basin of the origin.
:::

::: check
Can the system in the previous question have a limit cycle? Answer without simulating.
:::

::: answer
No. Its divergence is $\partial(x_2)/\partial x_1 + \partial(-x_1 + x_1^3 - 0.5x_2)/\partial x_2 = -0.5$, a single negative value everywhere, so Bendixson's criterion rules out a closed orbit anywhere in the plane. Combined with Poincaré–Bendixson, every bounded trajectory must converge to one of the three equilibria, and since the saddles attract only their own stable manifolds, almost every bounded trajectory ends at the origin.
:::

::: check
In the damped gravity-gradient example, why does the damper raise the capture rate limit above the undamped value $\sqrt{k}$, and what would the limit be if the damper were twice as strong?
:::

::: answer
Without damping, energy is conserved, so a satellite released with exactly $\sqrt{k}$ at nadir arrives at the saddle with zero rate and stays on the separatrix; any more and it goes over. With damping, energy is removed during the swing, so the satellite can start with more than the separatrix energy and still fail to reach the saddle: the limit rises, and the measured value is $2.3793\times10^{-3}\,\mathrm{rad/s}$ against $1.4311\times10^{-3}$. Doubling $c$ to $\zeta = 0.6$ removes energy faster and raises the limit further; it is found the same way, by bisecting the released rate. The direction of the change is what the argument gives you for free; the value requires the integration.
:::

::: check
Sketch, in words, the portrait of $\ddot{\theta} = u$ with the bang-bang law $u = -u_{\max}\operatorname{sign}(\theta)$ — position feedback only, no rate term. What does a trajectory do?
:::

::: answer
For $\theta > 0$ the torque is $-u_{\max}$ and trajectories are left-opening parabolas; for $\theta < 0$ it is $+u_{\max}$ and they open right. A trajectory starting at $\theta_0 > 0$ at rest follows a parabola to the axis $\theta = 0$, arriving with rate $-\sqrt{2u_{\max}\theta_0}$, switches, and follows the mirror-image parabola to $\theta = -\theta_0$ at rest, then back. The result is a closed orbit — a sustained oscillation of the full initial amplitude that never decays, because the switching line $\theta = 0$ is not the switching *curve*. Feedback on position alone gives you no damping at all; the $\dot{\theta}\lvert\dot{\theta}\rvert$ term in the switching curve is what does.
:::

::: check
A departure study reports "the aircraft is stable at the test point: eigenvalues $-1.0 \pm 2.39j$". What single additional number would you ask for, and how would you obtain it?
:::

::: answer
Ask for the distance to the nearest basin boundary, in the states the pilot or the gust can move — for this model, how many degrees of incidence and how many degrees per second of pitch rate separate the trim point from departure. Obtain it by locating the other equilibria of the nonlinear model (here the saddles at $+15.362^\circ$ and $-25.441^\circ$), then bisecting on initial condition along the directions of interest: $5.28^\circ$ of incidence and $15.92\,^\circ\mathrm{/s}$ of rate in the dangerous direction. The eigenvalues describe the recovery once you are inside; the fence decides whether you are.
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
| Damped gravity gradient, $\zeta = 0.3$ | Focus at $0, \pi$ ($-4.29\times10^{-4} \pm 1.365\times10^{-3}j$); saddles at $\pm\pi/2$ ($+1.065\times10^{-3}$, $-1.924\times10^{-3}$) |
| Capture limit $0.1363\,^\circ\mathrm{/s}$ | Release rate at nadir beyond which the bus settles $180^\circ$ over |
| Pitch model at $\delta = 4.8^\circ$ | Saddle $-25.44^\circ$, focus $+10.08^\circ$ ($\zeta = 0.386$), saddle $+15.36^\circ$; basin $1.54^\circ$ to $15.36^\circ$ from rest |
| $\theta + \dot{\theta}\lvert\dot{\theta}\rvert/(2u_{\max}) = 0$ | Switching curve for minimum-time control of $\ddot{\theta} = u$ |
| $J = 120$, $\pm0.5\,\mathrm{N\,m}$, $0.1\,\mathrm{rad}$ | Switch at $0.05\,\mathrm{rad}$ and $-0.0204\,\mathrm{rad/s}$; total $9.798\,\mathrm{s}$ |

The portrait tells you the type of each equilibrium but not how far its influence reaches, and it stops working above two states. The next lesson makes the local step precise — what the Jacobian does and does not prove about the nonlinear system — and shows the cases where it proves nothing at all.
