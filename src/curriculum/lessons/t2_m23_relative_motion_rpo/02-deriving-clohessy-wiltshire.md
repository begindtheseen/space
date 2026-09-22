---
id: l02-deriving-clohessy-wiltshire
title: Deriving the Clohessy-Wiltshire equations
minutes: 19
covers:
  - derivation of the Clohessy-Wiltshire equations
---

The LVLH frame of the previous lesson turns once per orbit, so it is not inertial, and Newton's second law does not apply to $\boldsymbol\rho$ directly. Whatever equation governs the chaser's motion in that frame must carry extra terms that account for the frame's own spin — and it must also carry the fact that the target and chaser sit at slightly different distances from Earth, so gravity pulls on them by slightly different amounts. Untangle both effects and the result is one of the most useful equations in orbital mechanics: the Clohessy-Wiltshire equations, published in 1960 by W. H. Clohessy and R. S. Wiltshire to design the rendezvous that Gemini and Apollo would later fly.

This lesson derives them from nothing but Newton's law of gravitation and the kinematics of a rotating frame — the same tools you already have. The derivation has two stages: first an *exact* nonlinear equation for relative motion in a rotating frame around any reference orbit, then a *linearization* that assumes the reference orbit is circular and the separation is small. Keeping the two stages distinct matters, because the next lessons spend real time on exactly where the second stage stops being a good approximation.

## Differentiating a vector in a rotating frame

Let $\boldsymbol\rho$ be any vector, expressed by its components $(x,y,z)$ along the LVLH axes, which themselves rotate with angular velocity $\boldsymbol\omega$. An observer riding in the rotating frame sees only the components change; write that rate as $\delta\boldsymbol\rho/\delta t = (\dot x,\dot y,\dot z)$. An inertial observer also sees the axes themselves turning, contributing an extra $\boldsymbol\omega\times\boldsymbol\rho$:

$$
\left(\frac{d\boldsymbol\rho}{dt}\right)_{\!I} = \frac{\delta\boldsymbol\rho}{\delta t} + \boldsymbol\omega\times\boldsymbol\rho.
$$

Apply this rule a second time to get the inertial acceleration. Differentiate the right-hand side above, itself using the same rule for each term:

$$
\left(\frac{d^2\boldsymbol\rho}{dt^2}\right)_{\!I} = \frac{\delta^2\boldsymbol\rho}{\delta t^2} + 2\boldsymbol\omega\times\frac{\delta\boldsymbol\rho}{\delta t} + \dot{\boldsymbol\omega}\times\boldsymbol\rho + \boldsymbol\omega\times(\boldsymbol\omega\times\boldsymbol\rho).
$$

Four terms on the right: the acceleration an observer in the rotating frame actually measures ($\delta^2\boldsymbol\rho/\delta t^2 = (\ddot x,\ddot y,\ddot z)$, what you want to isolate), the **Coriolis** term (twice the frame's spin rate crossed with the relative velocity), the **Euler** term (from the frame's spin rate changing), and the **centrifugal** term (the frame's spin crossed with itself crossed with position). None of these forces are real — push on the chaser and nothing pushes back — they are the bookkeeping cost of insisting on describing motion from inside a turning frame.

## The exact relative equation of motion

Apply this to $\boldsymbol\rho = \mathbf{r}_c - \mathbf{r}_t$, the chaser's position minus the target's, both measured from Earth's centre. The left side is exact regardless of frame, because $(d^2\boldsymbol\rho/dt^2)_I = \ddot{\mathbf{r}}_c - \ddot{\mathbf{r}}_t$, and both accelerations are given by the two-body equation:

$$
\ddot{\mathbf{r}}_c - \ddot{\mathbf{r}}_t = -\frac{\mu\,\mathbf{r}_c}{r_c^3} + \frac{\mu\,\mathbf{r}_t}{r_t^3}.
$$

In LVLH components, with the target always at $\mathbf{r}_t = r_t\,\hat{\mathbf{x}}$ (by definition of $\hat{\mathbf{x}}$) and the chaser at $\mathbf{r}_c = (r_t+x)\hat{\mathbf{x}} + y\,\hat{\mathbf{y}} + z\,\hat{\mathbf{z}}$, write $r_c = \lVert\mathbf{r}_c\rVert = \sqrt{(r_t+x)^2+y^2+z^2}$ for the chaser's distance from Earth. The right side above becomes $\big(-\mu(r_t+x)/r_c^3 + \mu/r_t^2,\ -\mu y/r_c^3,\ -\mu z/r_c^3\big)$.

The frame's angular velocity, from the previous lesson, is $\boldsymbol\omega = \dot\theta\,\hat{\mathbf{z}}$ with $\dot\theta = h_t/r_t^2$ the target's true-anomaly rate, and its rate of change follows from differentiating $h_t = r_t^2\dot\theta$ (constant, since $h_t$ is conserved): $0 = 2r_t\dot r_t\dot\theta + r_t^2\ddot\theta$, so $\ddot\theta = -2(\dot r_t/r_t)\dot\theta$. Both are zero for a circular reference orbit but not in general. Working out the three cross products in the rotating-frame acceleration formula with $\boldsymbol\omega$ purely along $\hat{\mathbf{z}}$ gives Coriolis $= (-2\dot\theta\dot y,\ 2\dot\theta\dot x,\ 0)$, Euler $=(-\ddot\theta y,\ \ddot\theta x,\ 0)$, and centrifugal $=(-\dot\theta^2 x,\ -\dot\theta^2 y,\ 0)$ — none of them touch $z$, because $\boldsymbol\omega$ has no component that rotates the out-of-plane axis into the others. Collecting everything:

$$
\begin{aligned}
\ddot x - 2\dot\theta\,\dot y - \ddot\theta\,y - \dot\theta^2 x &= -\frac{\mu(r_t+x)}{r_c^3} + \frac{\mu}{r_t^2}, \\
\ddot y + 2\dot\theta\,\dot x + \ddot\theta\,x - \dot\theta^2 y &= -\frac{\mu y}{r_c^3}, \\
\ddot z &= -\frac{\mu z}{r_c^3}.
\end{aligned}
$$

This is exact — no approximation has been made yet. It holds for a chaser at any separation from a target on any Keplerian orbit, circular or not, and it is what a numerical relative-motion propagator would integrate directly if you wanted to skip converting to absolute coordinates and back. It is also the equation that breaks CW when the reference orbit is eccentric, which the later lesson on the Tschauner-Hempel equations returns to.

::: example Checking the exact equation against truth
Take a target on an eccentric orbit, $a = 7200\,\mathrm{km}$, $e=0.08$, and a chaser about 1.3 km away with a small relative velocity. Propagating both absolute orbits with a high-accuracy integrator and differencing gives, at $t=3000\,\mathrm{s}$ after periapsis, a relative acceleration of $(-3.4235,\ -19.489,\ 5.988)\times10^{-7}\,\mathrm{km/s^2}$ (components along the instantaneous LVLH axes at that moment).

At that instant the target has $r_t = 7775.58\,\mathrm{km}$, $\dot\theta = 8.8323\times10^{-4}\,\mathrm{rad/s}$, and — since the target is not at periapsis or apoapsis — a nonzero radial rate $\dot r_t = 0.02111\,\mathrm{km/s}$, giving $\ddot\theta = -2\dot r_t\dot\theta/r_t = -4.797\times10^{-9}\,\mathrm{rad/s^2}$. Substituting these along with the relative position and velocity into the right-hand sides above reproduces $(-3.4220,\ -19.489,\ 5.988)\times10^{-7}\,\mathrm{km/s^2}$ — matching the true relative acceleration to five significant figures, with the small residual attributable entirely to the finite-difference step used to extract "truth" from the propagator. The exact equation is exact.
:::

## Specializing to a circular reference orbit

Now impose the first CW assumption: the target's orbit is circular. Then $r_t = r_0$ is constant, $\dot\theta$ reduces to the constant mean motion $n = \sqrt{\mu/r_0^3}$, and $\ddot\theta = 0$ because $\dot r_t = 0$ identically. The exact equations simplify to

$$
\begin{aligned}
\ddot x - 2n\dot y - n^2 x &= -\frac{\mu(r_0+x)}{r_c^3} + \frac{\mu}{r_0^2}, \\
\ddot y + 2n\dot x - n^2 y &= -\frac{\mu y}{r_c^3}, \\
\ddot z &= -\frac{\mu z}{r_c^3}.
\end{aligned}
$$

This is still exact — nothing about the separation has been assumed yet — but it now has constant coefficients on the left, which is what makes a closed-form solution possible once the right side is linearized too.

## Linearizing for small separation

The second CW assumption is that the chaser stays close to the target: $x, y, z \ll r_0$. Expand $r_c^3 = \big[(r_0+x)^2+y^2+z^2\big]^{3/2}$ for small $x/r_0$, $y/r_0$, $z/r_0$. To first order, $(r_0+x)^2+y^2+z^2 \approx r_0^2(1+2x/r_0)$ — the $y^2$ and $z^2$ terms are already second order and drop out — so

$$
r_c^3 \approx r_0^3\left(1+\frac{2x}{r_0}\right)^{3/2} \approx r_0^3\left(1+\frac{3x}{r_0}\right), \qquad \frac{1}{r_c^3}\approx\frac{1}{r_0^3}\left(1-\frac{3x}{r_0}\right).
$$

Substitute into the gravity terms, keeping only first-order terms in $x/r_0$, $y/r_0$, $z/r_0$:

$$
-\frac{\mu(r_0+x)}{r_c^3}+\frac{\mu}{r_0^2} \approx -\frac{\mu}{r_0^3}(r_0+x)\left(1-\frac{3x}{r_0}\right)+\frac{\mu}{r_0^2} \approx -\frac{\mu}{r_0^2}+\frac{2\mu x}{r_0^3}+\frac{\mu}{r_0^2} = 2n^2 x,
$$

using $n^2 = \mu/r_0^3$ and dropping the $x^2$ term as second order. Similarly $-\mu y/r_c^3 \approx -n^2 y$ and $-\mu z/r_c^3 \approx -n^2 z$ (the $-3x/r_0$ correction multiplying $y$ or $z$ is itself second order, since both factors are already small). Substituting these linearized gravity terms back into the circular-reference equations:

$$
\ddot x - 2n\dot y - n^2 x = 2n^2 x \ \Longrightarrow\ \ddot x - 2n\dot y - 3n^2 x = 0,
$$
$$
\ddot y + 2n\dot x - n^2 y = -n^2 y \ \Longrightarrow\ \ddot y + 2n\dot x = 0,
$$
$$
\ddot z = -n^2 z \ \Longrightarrow\ \ddot z + n^2 z = 0.
$$

::: key The Clohessy-Wiltshire equations
$$
\ddot x - 3n^2 x - 2n\dot y = 0, \qquad \ddot y + 2n\dot x = 0, \qquad \ddot z + n^2 z = 0,
$$
with $x$ radial (outward), $y$ in-track, $z$ cross-track, and $n = \sqrt{\mu/r_0^3}$ the reference orbit's mean motion. They assume a **circular** reference orbit, separation **small** compared with $r_0$, **two-body** gravity only, and no differential drag or $J_2$ between the two vehicles.
:::

Look at where each piece of the $3n^2x$ coefficient came from: one factor of $n^2$ is the centrifugal term, already present on the left before gravity was even linearized; the other two come from linearizing gravity itself. That second piece is the *tidal*, or gravity-gradient, effect — gravity is weaker a little farther out and stronger a little closer in, and to first order that difference is *twice* the centrifugal size, not equal to it. A chaser sitting radially outward from the target does not merely feel "a bit less" centripetal restoring force; it feels measurably weaker gravity pulling it toward Earth while needing exactly the target's angular rate to stay radially aligned, and the imbalance is what the $3n^2x$ coefficient captures. Forgetting the factor of 3 — writing $n^2x$ instead, as if only the centrifugal term mattered — is one of the most common transcription errors in a first CW implementation, and it silently produces a system that is not even the right kind of equation (the radial motion changes from unstable, as the true equations are, to a bounded oscillator).

::: example Sizing the linearization error
At $x = 1\,\mathrm{km}$, $y=z=0$, with $r_0 = 6791\,\mathrm{km}$: the exact right-hand side of the radial gravity term is $2.5449\times10^{-6}\,\mathrm{km/s^2}$; the linearized $2n^2x$ gives $2.5455\times10^{-6}\,\mathrm{km/s^2}$ — a residual of $5.62\times10^{-10}\,\mathrm{km/s^2}$, about 0.02% of the term itself. At $x=10\,\mathrm{km}$ the residual grows to $5.61\times10^{-8}\,\mathrm{km/s^2}$, about 0.22% — roughly ten times larger, consistent with the leading error being $O(x/r_0)$ relative to the linearized term (a tenfold increase in $x$ gives roughly a tenfold increase in the relative residual). At 100 m the relative residual is smaller still, about 0.002%. This is the seed of the position error the next-but-one lesson tabulates directly: a small, steady mismatch in acceleration, integrated twice over time, becomes a mismatch in position that grows the longer you wait and the farther out you start.
:::

::: warning Sign convention on the coupling terms
With this module's axis convention the coupling terms are $-2n\dot y$ in the $\ddot x$ equation and $+2n\dot x$ in the $\ddot y$ equation — opposite signs, not the same sign twice. A radial velocity accelerates the in-track motion in one sense; an in-track velocity accelerates the radial motion in the opposite rotational sense, exactly as Coriolis terms always come in an antisymmetric pair. If you find yourself writing $+2n\dot y$ and $+2n\dot x$ (or $-2n\dot y$ and $-2n\dot x$) in the two equations, the STM you build from it will not have unit determinant, which the next lesson uses as a standing correctness check.
:::

## Check yourself

::: check
Which two of the four terms in the rotating-frame acceleration formula vanish identically for a circular reference orbit, and why?
:::

::: answer
The Euler term, $\dot{\boldsymbol\omega}\times\boldsymbol\rho$, vanishes because $\dot\theta$ is constant on a circular orbit ($\dot r_t = 0$ makes $\ddot\theta = -2\dot r_t\dot\theta/r_t = 0$), so $\boldsymbol\omega = n\hat{\mathbf{z}}$ never changes. The other three terms — the rotating-frame acceleration itself, Coriolis, and centrifugal — do not vanish; only the Euler term is special to circular reference orbits.
:::

::: check
Derive, without looking back, why the linearized cross-track equation is $\ddot z + n^2 z = 0$ with no coupling to $x$ or $y$, when the radial equation couples to $\dot y$ and the in-track equation couples to $\dot x$.
:::

::: answer
The Coriolis, Euler and centrifugal terms all come from crossing $\boldsymbol\omega = n\hat{\mathbf{z}}$ with vectors that lie in the LVLH frame; because $\hat{\mathbf{z}}\times\hat{\mathbf{z}} = \mathbf{0}$, none of those cross products ever produce a $z$-component, and none of them involve $z$ on the right either — $\hat{\mathbf{z}}\times(\text{anything})$ has no $\hat{\mathbf{z}}$ component. So the $z$-equation receives no rotating-frame terms at all; its only physics is the linearized gravity term $-n^2z$, leaving a simple, uncoupled harmonic oscillator at the orbit rate.
:::

::: check
A student writes the radial equation as $\ddot x - n^2 x - 2n\dot y = 0$ (missing a factor of 3). Physically, what has been left out?
:::

::: answer
The centrifugal term alone (one factor of $n^2$) has been kept, but the linearized gravity-gradient (tidal) contribution — the fact that gravity itself is weaker at $x>0$ and stronger at $x<0$ than at the target's own radius — has been dropped. That tidal effect contributes the other $2n^2x$, twice the size of the centrifugal piece, so omitting it more than triples the true restoring (or here destabilizing) effect — the coefficient is not shrinking by a small amount, it is missing most of its size.
:::

::: check
At $x=5\,\mathrm{km}$, $y=z=0$, $r_0=6791\,\mathrm{km}$, roughly what fractional error would you expect the linearized radial gravity term $2n^2x$ to have relative to the exact value, using the $O(x/r_0)$ scaling from the worked example?
:::

::: answer
The worked example shows the relative residual is close to $1.5\,(x/r_0)$ (0.02% at $x/r_0 = 1/6791$, 0.22% at $x/r_0=10/6791$, both consistent with a factor near 1.5 times $x/r_0$ expressed as a percentage). At $x=5\,\mathrm{km}$, $x/r_0 = 5/6791 = 7.36\times10^{-4}$, giving an estimated relative error of roughly $1.5\times7.36\times10^{-4}\approx 0.11\%$ — about half of the 10 km case and five times the 1 km case, consistent with linear scaling in $x$.
:::

::: check
Explain why the exact relative-motion equation derived in this lesson is valid for an eccentric reference orbit, even though the Clohessy-Wiltshire equations are not.
:::

::: answer
The exact equation was derived without assuming anything about the target's orbit shape — $r_t$, $\dot\theta$ and $\ddot\theta$ were left as general functions of time, related only through $h_t = r_t^2\dot\theta$ being constant (true for any Keplerian orbit). Only the *specialization* step set $r_t=r_0$ constant and $\dot\theta = n$ constant, which is true for a circular orbit and false for an eccentric one. The exact equation still holds for an eccentric target; it is the constant-coefficient simplification, not the underlying physics, that requires circularity.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\delta\boldsymbol\rho/\delta t$ vs $(d\boldsymbol\rho/dt)_I$ | Rotating-frame rate vs inertial rate; differ by $\boldsymbol\omega\times\boldsymbol\rho$ |
| Coriolis, Euler, centrifugal | $2\boldsymbol\omega\times\dot{\boldsymbol\rho}$, $\dot{\boldsymbol\omega}\times\boldsymbol\rho$, $\boldsymbol\omega\times(\boldsymbol\omega\times\boldsymbol\rho)$ — fictitious, frame-rotation terms |
| $\ddot\theta = -2(\dot r_t/r_t)\dot\theta$ | From $h_t=r_t^2\dot\theta$ constant; zero only for a circular reference orbit |
| Exact relative EOM | Holds for any Keplerian reference orbit; see the boxed three-equation system above |
| Circular-reference specialization | $r_t=r_0$, $\dot\theta=n=\sqrt{\mu/r_0^3}$, $\ddot\theta=0$ — still exact in the gravity term |
| Linearization | $x,y,z\ll r_0$; $1/r_c^3\approx(1/r_0^3)(1-3x/r_0)$ |
| CW equations | $\ddot x-3n^2x-2n\dot y=0$, $\ddot y+2n\dot x=0$, $\ddot z+n^2z=0$ |
| $3n^2x$ decomposition | $n^2x$ centrifugal $+$ $2n^2x$ tidal/gravity-gradient |
| Linearization error | $O(x/r_0)$ relative to the linear term; about 0.02% at 1 km, 0.22% at 10 km separation |

The next lesson solves these three constant-coefficient equations in closed form and assembles the result into the state transition matrix that every later lesson in this module propagates relative motion with.
