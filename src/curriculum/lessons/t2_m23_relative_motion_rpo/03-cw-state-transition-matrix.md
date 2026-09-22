---
id: l03-cw-state-transition-matrix
title: Solving CW — closed-form motion and the state transition matrix
minutes: 21
covers:
  - the CW state transition matrix
---

The previous lesson produced three linear, constant-coefficient ordinary differential equations. That is good news: linear constant-coefficient ODEs always solve in closed form, and once solved they package into a state transition matrix (STM) — the same object the linear-algebra and ODE modules built for you in general, now specialized to relative orbital motion. Every later lesson in this module — the validity study, the football orbit, the two-impulse rendezvous targeting, the passive-safety analysis — propagates relative motion by multiplying a six-vector by this one matrix. Getting it right once, here, is what makes everything downstream a matter of linear algebra rather of than re-deriving physics each time.

## The cross-track motion

$\ddot z + n^2 z = 0$ is the undriven, undamped harmonic oscillator from the ODE module, with natural frequency $n$. Its solution, fixed by $z(0)=z_0$ and $\dot z(0) = \dot z_0$, is

$$
z(t) = z_0\cos nt + \frac{\dot z_0}{n}\sin nt.
$$

It is bounded and periodic with period $2\pi/n$ — the orbital period — for any initial condition. Cross-track motion never drifts; it only oscillates. That single fact turns out to matter a great deal once you compare plane errors with in-plane errors later in the module.

## The in-plane motion

The radial and in-track equations, $\ddot x - 3n^2x - 2n\dot y=0$ and $\ddot y+2n\dot x=0$, are coupled, but the coupling can be removed in one step. The second equation integrates directly:

$$
\dot y(t) - \dot y_0 = -2n\big(x(t)-x_0\big) \ \Longrightarrow\ \dot y(t) = \dot y_0 + 2nx_0 - 2nx(t).
$$

This says something physical before it says anything mathematical: the in-track *velocity* at any instant is fixed once the radial *position* is known, up to a constant set by the initial conditions. Substitute this expression for $\dot y$ into the radial equation:

$$
\ddot x - 3n^2 x - 2n\big(\dot y_0+2nx_0-2nx\big) = 0 \ \Longrightarrow\ \ddot x + n^2 x = 2n\dot y_0 + 4n^2 x_0.
$$

The coupling has vanished, replaced by a *constant* forcing term on the right — $x$ alone now obeys a driven harmonic oscillator at the same frequency $n$ as the cross-track motion. A constant forcing on a harmonic oscillator shifts the equilibrium without changing the frequency, so the general solution is a particular (constant) solution plus the free oscillation:

$$
x(t) = \underbrace{\left(4x_0+\frac{2\dot y_0}{n}\right)}_{\text{particular}} + A\cos nt + B\sin nt.
$$

Fixing $A$, $B$ from $x(0)=x_0$ and $\dot x(0)=\dot x_0$ gives $A = -3x_0 - 2\dot y_0/n$ and $B = \dot x_0/n$, so

$$
x(t) = (4-3\cos nt)\,x_0 + \frac{\sin nt}{n}\,\dot x_0 + \frac{2}{n}(1-\cos nt)\,\dot y_0.
$$

Feed this back into $\dot y(t) = \dot y_0+2nx_0-2nx(t)$ and integrate once more with respect to time, using $y(0)=y_0$ to fix the constant of integration. The algebra is mechanical — substitute, integrate term by term, collect — and it produces

$$
y(t) = 6(\sin nt - nt)\,x_0 + y_0 - \frac{2}{n}(1-\cos nt)\,\dot x_0 + \frac{1}{n}(4\sin nt-3nt)\,\dot y_0.
$$

Differentiate $x(t)$, $y(t)$, $z(t)$ once more for the velocity components, and all six relative-state coordinates are now known as explicit functions of time and the six initial conditions.

::: key The CW closed-form solution
$$
\begin{aligned}
x(t) &= (4-3\cos nt)x_0 + \frac{\sin nt}{n}\dot x_0 + \frac{2}{n}(1-\cos nt)\dot y_0, \\
y(t) &= 6(\sin nt-nt)x_0 + y_0 - \frac{2}{n}(1-\cos nt)\dot x_0 + \frac{1}{n}(4\sin nt-3nt)\dot y_0, \\
z(t) &= z_0\cos nt + \frac{\dot z_0}{n}\sin nt.
\end{aligned}
$$
Differentiating gives $\dot x(t)$, $\dot y(t)$, $\dot z(t)$.
:::

## Packaging it as a state transition matrix

Because every one of $x(t)$, $y(t)$, $z(t)$, $\dot x(t)$, $\dot y(t)$, $\dot z(t)$ is a *linear combination* of the six initial conditions $x_0,y_0,z_0,\dot x_0,\dot y_0,\dot z_0$, the whole solution is a matrix-vector product. Write the state as $\mathbf{s} = (x,y,z,\dot x,\dot y,\dot z)^\mathsf{T}$; then

$$
\mathbf{s}(t) = \boldsymbol\Phi(t)\,\mathbf{s}(0), \qquad
\boldsymbol\Phi(t) =
\begin{bmatrix}
4-3c & 0 & 0 & s/n & (2/n)(1-c) & 0 \\
6(s-nt) & 1 & 0 & -(2/n)(1-c) & (4s-3nt)/n & 0 \\
0 & 0 & c & 0 & 0 & s/n \\
3ns & 0 & 0 & c & 2s & 0 \\
6n(c-1) & 0 & 0 & -2s & 4c-3 & 0 \\
0 & 0 & -ns & 0 & 0 & c
\end{bmatrix}
$$

with $s=\sin nt$, $c=\cos nt$ shorthand and the bottom three rows obtained by differentiating the top three with respect to $t$. This is the Clohessy-Wiltshire state transition matrix. Reading off any entry answers a specific question: $\Phi_{02}$, the $(x,z)$ entry, is zero everywhere because a cross-track offset alone never produces a radial one — in-plane and out-of-plane motion never mix, a direct consequence of $z$ decoupling from $x,y$ back in the original equations.

Two structural facts about $\boldsymbol\Phi(t)$ are worth carrying forward, and both are checkable in code as soon as you implement it. First, $\boldsymbol\Phi(0) = \mathbf{I}$ — set $t=0$ ($s=0,c=1$) in the matrix above and every entry reduces to the identity, as it must: propagating for zero time changes nothing. Second, $\det\boldsymbol\Phi(t) = 1$ for every $t$, not approximately but exactly. The CW equations, like the underlying two-body problem they were linearized from, describe a Hamiltonian flow, and Hamiltonian flows are **symplectic**: they preserve six-dimensional phase-space volume rather than expanding or contracting it. A unit determinant is a strong, easy correctness check on any implementation of $\boldsymbol\Phi(t)$ — an error in a single sign or coefficient almost always breaks it.

::: example Building and checking the STM
For this module's reference orbit, $n = 1.1282\times10^{-3}\,\mathrm{rad/s}$, evaluate $\boldsymbol\Phi(t)$ at $t=1000\,\mathrm{s}$ ($nt = 1.1282\,\mathrm{rad}$, $s=0.90280$, $c=0.43012$... rounding aside, $s=0.9026$, $c=0.4283$ to four figures):

$$
\boldsymbol\Phi(1000\,\mathrm{s}) =
\begin{bmatrix}
2.7150 & 0 & 0 & 800.97 & 1013.46 & 0 \\
-1.3472 & 1 & 0 & -1013.46 & 203.90 & 0 \\
0 & 0 & 0.4283 & 0 & 0 & 800.97 \\
0.003058 & 0 & 0 & 0.4283 & 1.8072 & 0 \\
-0.00387 & 0 & 0 & -1.8072 & -1.2867 & 0 \\
0 & 0 & -0.001019 & 0 & 0 & 0.4283
\end{bmatrix}
$$

(units: the position-vs-position block is dimensionless, position-vs-velocity entries carry seconds, velocity-vs-position entries carry $\mathrm{s^{-1}}$). Its determinant, computed to twelve decimal places, is $1.000000000000$ — confirming the implementation before it is trusted for anything else. Applying it at $t=0$, $t=T/4=1392.36\,\mathrm{s}$ and $t=T/2=2784.72\,\mathrm{s}$ (the standing reference orbit's quarter- and half-periods) gives $\det\boldsymbol\Phi = 1$ at every one, as it must for every $t$, not just these three.
:::

::: example STM propagation against direct numerical integration
Take the relative state $\mathbf{s}_0 = (100,\ -300,\ 50)\,\mathrm{m}$, $(0.20,\ -0.10,\ 0.05)\,\mathrm{m/s}$ and propagate it two ways: multiply by $\boldsymbol\Phi(1000\,\mathrm{s})$ from above, and separately integrate the raw CW equations $\ddot x = 3n^2x+2n\dot y$, $\ddot y=-2n\dot x$, $\ddot z=-n^2z$ numerically from the same initial condition with a high-accuracy Runge-Kutta method. Both give

$$
\mathbf{s}(1000\,\mathrm{s}) = (330.350,\ -657.801,\ 61.465)\,\mathrm{m},\ (0.21077,\ -0.61974,\ -0.02955)\,\mathrm{m/s},
$$

agreeing to $2\times10^{-15}\,\mathrm{km}$ in position — floating-point roundoff, nothing more. This is the expected outcome, not a coincidence: $\boldsymbol\Phi(t)$ is not a numerical approximation to the CW dynamics, it *is* the exact closed-form solution to those same linear equations. The place to look for disagreement with reality is not here — it is in the next lesson, which compares CW (by either method, they agree) against the full nonlinear two-body truth that CW was linearized away from.
:::

::: warning STM versus truth are different comparisons
Confirming $\boldsymbol\Phi(t)$ against a numerical integration of the *CW equations* (as in the second example) only checks that you solved the linear ODEs correctly — it says nothing about how well CW itself matches real relative motion. Both quantities being compared there already contain the same linearization. A separate, much more consequential comparison — CW against a full nonlinear two-body propagation of the actual absolute orbits — is the subject of the next lesson, and the two checks are not substitutes for each other.
:::

## Check yourself

::: check
Explain in one sentence why the cross-track column of $\boldsymbol\Phi(t)$ has zero entries in every row except the $z$ and $\dot z$ rows.
:::

::: answer
The cross-track equation $\ddot z+n^2z=0$ is completely decoupled from $x$, $y$ and their derivatives — the CW derivation showed the rotation terms never touch $z$ — so $z(t)$ and $\dot z(t)$ depend only on $z_0$ and $\dot z_0$, and $x(t)$, $y(t)$ depend not at all on $z_0,\dot z_0$. Both directions of independence together zero out the cross-track column everywhere outside its own $2\times2$ block.
:::

::: check
Without recomputing the full matrix, state $\boldsymbol\Phi(0)$ from the structural fact given in the lesson, and explain why that fact must hold for any correctly-derived state transition matrix, not just this one.
:::

::: answer
$\boldsymbol\Phi(0) = \mathbf{I}_6$, the $6\times6$ identity. This must hold for any STM because $\mathbf{s}(t) = \boldsymbol\Phi(t)\mathbf{s}(0)$ evaluated at $t=0$ must return $\mathbf{s}(0)$ unchanged — propagating for zero elapsed time cannot alter the state, so the matrix that "propagates for zero time" has to act as the identity on every possible initial state, which is exactly what $\boldsymbol\Phi(0)=\mathbf{I}$ says.
:::

::: check
A newly-coded CW STM gives $\det\boldsymbol\Phi(500\,\mathrm{s}) = 1.000$ but $\det\boldsymbol\Phi(3000\,\mathrm{s}) = 0.87$. What does this pattern most likely indicate about the bug?
:::

::: answer
A unit determinant holding at one time but failing at another rules out a simple sign flip in a constant coefficient (that would typically break the determinant at every nonzero $t$, including small ones). It instead points to an error in the $t$-dependence itself — a wrong argument to a trig function, a missing factor of $n$ inside a $\sin nt$ or $\cos nt$, or a term that should involve $nt$ written with a stray extra or missing factor — something that happens to still look right for $nt$ near a special value (small angle, or a coincidental cancellation) but drifts wrong as $nt$ grows.
:::

::: check
Starting from $\ddot x + n^2 x = 2n\dot y_0+4n^2x_0$, confirm that $x_p = 4x_0+2\dot y_0/n$ is indeed a particular solution.
:::

::: answer
$x_p$ is constant in time, so $\ddot x_p = 0$. Substituting into the left side: $\ddot x_p+n^2x_p = 0+n^2(4x_0+2\dot y_0/n) = 4n^2x_0+2n\dot y_0$, which matches the right-hand side exactly. Since the forcing term is itself constant, a constant trial solution is the natural (and here successful) first guess for the particular solution.
:::

::: check
The lesson states that $\boldsymbol\Phi(t)$ is exactly symplectic ($\det=1$) at every $t$, while the linearization it comes from is only approximate. Are these two facts in tension?
:::

::: answer
No. Symplecticity is a property of the *linear system itself*, not of how well that linear system matches the true nonlinear dynamics. The CW equations, whatever their accuracy as a model of real relative motion, are exactly a linear Hamiltonian system, and any exact solution to an exact linear Hamiltonian system is exactly symplectic. The approximation error lives entirely in the gap between the CW equations and the true nonlinear equations of the previous lesson — it does not leak into how faithfully $\boldsymbol\Phi(t)$ solves the CW equations themselves.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $z(t) = z_0\cos nt+(\dot z_0/n)\sin nt$ | Cross-track: simple harmonic, always bounded |
| $x(t) = (4-3\cos nt)x_0+(\sin nt/n)\dot x_0+(2/n)(1-\cos nt)\dot y_0$ | Radial closed-form solution |
| $y(t) = 6(\sin nt-nt)x_0+y_0-(2/n)(1-\cos nt)\dot x_0+(1/n)(4\sin nt-3nt)\dot y_0$ | In-track closed-form solution |
| $\ddot x+n^2x = 2n\dot y_0+4n^2x_0$ | The decoupled, constantly-forced radial oscillator used to derive $x(t)$ |
| $\boldsymbol\Phi(t)$ | $6\times6$ CW state transition matrix; $\mathbf{s}(t)=\boldsymbol\Phi(t)\mathbf{s}(0)$ |
| $\boldsymbol\Phi(0)=\mathbf{I}$ | Zero elapsed time changes nothing — a correctness check on any implementation |
| $\det\boldsymbol\Phi(t)=1$ for all $t$ | Symplectic flow; a second, stronger correctness check |
| In-plane / cross-track independence | The cross-track column and the in-plane $2\times2$ sub-blocks never mix |

The closed-form solution and its matrix are exact for the CW equations. The next lesson asks the question those equations cannot answer themselves: over what separations and elapsed times does that exactness still describe the real, nonlinear relative motion of two spacecraft — and where, precisely, does it stop?
