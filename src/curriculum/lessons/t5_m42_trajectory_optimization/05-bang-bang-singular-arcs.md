---
id: l05-bang-bang-singular-arcs
title: Bang-bang control, the switching function, and singular arcs
minutes: 16
covers:
  - Bang-bang control, the switching function, and singular arcs
---

The optimal control module's Pontryagin lesson introduced the switching function for control-affine dynamics with a running cost that does not depend on $\mathbf{u}$: write $H = (\text{terms without }u) + S(t)\,u$ for a scalar control, and the minimum principle puts $u$ at whichever bound of its box has the lower value of $H$, decided by the sign of $S$. Two worked examples there — a minimum-time slew, a minimum-propellant landing — were both single-switch, because in both the switching function turned out to be an affine function of time, and an affine function crosses zero at most once.

That was a property of those two problems, not a law of nature. This lesson works a trajectory where the switching function is not affine, shows what a genuine switching history looks like on a real burn, and then takes on the case the earlier lesson only named: an interval where the switching function is identically zero, and the minimum principle stops saying anything about the control at all.

## The switching function on a real burn

::: example The coast-to-burn switch on a Mars powered descent
A later lesson in this module solves, by indirect shooting, a Mars-style powered descent — mass as a state, $\dot m = -T/c$, thrust $T\in[0,T_{\max}]$ — landing softly while minimising propellant. The Hamiltonian is linear in $T$: $H = \lambda_h v - \lambda_v g + S(t)\,T$ with switching function $S = \lambda_v/m - \lambda_m/c$, and the minimum principle gives $T^\star=T_{\max}$ where $S<0$, $T^\star=0$ where $S>0$.

Evaluated along the converged trajectory, $S$ starts at $S(0) = 3.267\times10^{-5}$ (positive: coasting, engine off), decreases smoothly and monotonically, crosses zero at $t = 1.8546\,\mathrm{s}$ (to nine figures, the point where $h=1354.61\,\mathrm{m}$, $v=-81.877\,\mathrm{m/s}$), and continues to $S(t_f) = -5.879\times10^{-4}$ at touchdown — strictly negative for the entire $31.91\,\mathrm{s}$ of the burn that follows. One sign change, one switch, exactly matching the "coast, then burn" structure the earlier lesson's constant-mass landing example found by hand — but here $S(t)$ is a genuinely curved function of time (mass and the gravity term both feed into it nonlinearly), computed by full numerical integration of the costate equations, not read off a closed-form affine expression. The qualitative conclusion — one switch — turned out the same even with mass carried honestly as a state; this is a known classical result for the drag-free minimum-fuel soft-landing problem (Meditch, 1964), not a coincidence of the specific numbers chosen here.
:::

::: key The switching function decides the bound, its sign changes decide when
For control-affine dynamics with $L$ independent of $\mathbf{u}$, $H = (\ldots) + S(t)\,u$ (scalar case), and $u^\star = u_{\max}$ where $S<0$, $u^\star=u_{\min}$ where $S>0$. The number and location of switches is the number and location of $S$'s zero crossings — a fact about the specific costate history, not a fixed property of "bang-bang problems" in general.
:::

## Singular arcs: where the switching function goes flat

Everything above assumed $S(t)$ only touches zero at isolated instants. Nothing rules out $S(t)\equiv0$ over a whole subinterval $[t_1,t_2]$ instead — and there the minimum principle is silent: every admissible $u$ gives exactly the same $H$, so minimising $H$ over $u$ determines nothing. This is a **singular arc**, and the control on it has to be recovered some other way.

The way is to keep differentiating. $S(t)\equiv0$ on $[t_1,t_2]$ means every time-derivative of $S$ also vanishes identically there, not merely at one instant. Compute $\dot S$, $\ddot S$, and so on, using the state and costate equations (the dynamics and $\dot{\boldsymbol\lambda}=-\partial H/\partial\mathbf{x}$) at each step; for a well-behaved control-affine system, $u$ does not appear in these derivatives until some even order $2q$ — at which point setting $S^{(2q)}=0$ is one algebraic equation containing $u$, and solving it gives the **singular control**. The integer $q$ is the **order** of the singular arc.

A necessary condition for the singular arc to be a genuine minimum rather than a spurious critical direction — the **generalised Legendre-Clebsch condition** — is

$$
(-1)^q\,\frac{\partial}{\partial u}\left(\frac{d^{2q}}{dt^{2q}}\frac{\partial H}{\partial u}\right) \ge 0.
$$

::: example A hand-checkable order-two singular arc
Take $\dot x_1=x_2$, $\dot x_2=u$, $|u|\le1$, minimising $J=\int_0^{t_f}x_1^2\,dt$ — a double integrator penalised for how far it sits from the origin over a fixed window, the structure of a pointing axis charged for accumulated aim error during an imaging pass. $H = x_1^2+\lambda_1x_2+\lambda_2u$, so $S=\lambda_2$, and the costate equations are $\dot\lambda_1=-2x_1$, $\dot\lambda_2=-\lambda_1$ — notably **not** affine in time, since $\dot\lambda_1$ depends on the state rather than being constant, unlike every switching-function example seen so far in this module.

Differentiate $S$ along the flow, using the state and costate equations at each step:

$$
S=\lambda_2,\qquad \dot S=-\lambda_1,\qquad \ddot S = 2x_1,\qquad \dddot S = 2x_2,\qquad S^{(4)} = 2u.
$$

$u$ first appears at the fourth derivative, so $2q=4$, $q=2$ — a second-order singular arc. Setting every one of $S,\dot S,\ddot S,\dddot S$ to zero forces $\lambda_2=\lambda_1=x_1=x_2=0$ simultaneously: the *only* state at which this system can be singular is the origin, at rest, with both costates zero. Physically that is exactly what you would guess without any of the algebra — once the pointing error and its rate are both zero, the cheapest thing to do is nothing, and "nothing" is self-consistently a singular arc because every nearby control choice costs the same to first, second and third order there. The generalised Legendre-Clebsch condition confirms it is a genuine minimum, not a numerical curiosity: $\partial S^{(4)}/\partial u = 2$, so $(-1)^2\times2 = 2 \ge 0$.

This chain of derivatives is not asserted; it is checkable directly. Integrating the state-costate system forward from an arbitrary point with a fixed control and estimating $\dot S,\ddot S,\dddot S,S^{(4)}$ by finite differences of the simulated $\lambda_2(t)$ matches $-\lambda_1$, $2x_1$, $2x_2$, $2u$ at that point to four significant figures — the discrepancy explained entirely by the finite-difference step size, not by an error in the formulas.
:::

## Why Goddard's rocket has one

The example above isolates the mechanism; the Goddard problem — maximise the altitude of a vertically ascending rocket against gravity and air drag, thrust bounded $0\le T\le T_{\max}$ — is where a singular arc first shows up in an actual flight-relevant problem, and it is worth understanding physically before it is worth deriving formally. Drag grows with the square of speed and falls off exponentially with altitude: $D(h,v) = D_0v^2e^{-h/h_s}$ for a scale height $h_s$. Near the ground, drag can exceed weight outright — with a representative $800\,\mathrm{kg}$ vehicle at $250\,\mathrm{m/s}$ and an effective drag area giving $D_0$ appropriate to a small rocket, drag at sea level comes to about $1.46$ times the vehicle's weight; by $10\,\mathrm{km}$ altitude the same speed gives drag only $0.45$ times weight; by $15\,\mathrm{km}$, $0.25$ times.

That collapsing ratio is the whole story. Early in the flight, air is dense and speed is the enemy — burning at maximum thrust to go faster buys you nothing but drag you immediately pay back. High in the flight, air is thin and speed is nearly free — thrust should go to maximum again to gain altitude while it still costs little. In between, there is a **balance point**: a throttle setting, strictly between $0$ and $T_{\max}$, at which the marginal altitude gained from a little more thrust exactly offsets the marginal drag penalty of a little more speed. That balance point is not a single instant, it is sustained over an interval as the vehicle climbs through the transition — a genuine singular arc, with the same differentiate-until-$u$-appears structure as the toy example above, just with three states ($h,v,m$) instead of two and a considerably longer algebraic derivation to reach the explicit throttle law. This module's exercises transcribe and solve the full problem directly; a later lesson revisits it once the scaling that makes it solvable at all has been introduced.

::: warning Chattering in a numerical solution usually means a singular arc, not a bug
A direct solver that reports the control flipping between its bounds every one or two mesh points over an extended stretch is not usually broken — it is very often trying to represent a singular arc with a scheme that has no notion of an interior optimal control, so it approximates the balance point by rapidly alternating between the two bounds it does know how to represent. The fix is not a better initial guess or a tighter tolerance; it is recognising the interval as singular (check whether the switching function, reconstructed from the solution's multipliers, is near zero there rather than crossing through it) and either substituting the singular control directly or refining the mesh sharply at the junctions where the true solution transitions in and out of the arc.
:::

## Check yourself

::: check
The descent example found $\dot\lambda_1$, sorry, $S(t)$ curved rather than affine, yet still crossed zero exactly once. What made the earlier lesson's slew and landing examples affine in the first place, and why does that not carry over here?
:::

::: answer
In both earlier examples the running cost $L$ did not depend on the state that multiplied the switching costate in a way that fed back into that costate's own equation — the minimum-time slew had $L=1$ (no state dependence at all) and the minimum-propellant landing had $L=u$ (again no $x$- or $v$-dependence), so the costate equation for the velocity-like costate reduced to $\dot\lambda_v=-\lambda_h$ with $\lambda_h$ itself constant, making $\lambda_v$, and hence $S$, affine in time. The Mars descent example has the identical cost structure ($L=T/c$, no state dependence), so by the same argument its switching function is *also* built from a chain of costate equations with no direct state feedback into the relevant derivative — the curvature comes from $m(t)$ appearing explicitly in $S=\lambda_v/m-\lambda_m/c$, a nonlinear combination of two quantities that are each simple functions of time, not from any new mechanism. The genuinely different case is the singular-arc example, where $L=x_1^2$ feeds directly into $\dot\lambda_1=-2x_1$, coupling the costate to the state and breaking the affine structure outright.
:::

::: check
In the order-two singular arc example, why does the argument conclude $x_1=x_2=0$ on the arc, rather than merely $\lambda_1=\lambda_2=0$?
:::

::: answer
Because the chain of derivatives ties the costates and the states together: $\ddot S=2x_1$ must vanish identically on the arc (not just at one instant), which forces $x_1\equiv0$ there; $\dddot S=2x_2$ must likewise vanish, forcing $x_2\equiv0$. The costates vanish for the same reason applied one derivative earlier ($S=\lambda_2\equiv0$, $\dot S=-\lambda_1\equiv0$). All four quantities are pinned simultaneously because "identically zero on an interval" is a much stronger statement than "zero at a point" — it propagates through every derivative the argument uses, which is precisely why a singular arc of order $q$ pins down $2q$ scalar quantities along the state-costate trajectory, not just the one that made $S$ itself vanish.
:::

::: check
A colleague simulates the order-two singular-arc problem starting exactly at the origin with zero costates and is surprised the state never moves. Is the simulation wrong?
:::

::: answer
No. The derivation showed that $x_1=x_2=\lambda_1=\lambda_2=0$ is self-consistent with $u=0$: with the state already at the origin and no control applied, $\dot x_1=x_2=0$ and $\dot x_2=u=0$, so the state stays at the origin, and with $x_1\equiv0$ the costate equations give $\dot\lambda_1=-2x_1=0$ and $\dot\lambda_2=-\lambda_1=0$, so the costates stay at zero too — a genuine equilibrium of the full eight-dimensional (well, four-dimensional here) necessary-condition system. This is exactly the "sit at the target and do nothing" interpretation given in the text, and a simulation that reproduces it is behaving correctly, not failing to move for lack of a working integrator.
:::

::: check
Sketch, without doing the full algebra, why the Goddard problem's singular arc should disappear if drag were replaced by a constant force independent of both velocity and altitude.
:::

::: answer
The physical tradeoff that creates the singular arc is a genuine *interior* balance between two altitude-dependent, velocity-dependent effects: burning harder buys speed, and speed costs drag that itself depends on how fast you are already going and how thick the air still is. A drag force that is simply a fixed constant, independent of $v$ and $h$, does not create that feedback — it is just an extra constant deceleration added to gravity, exactly as easy to fly through at any throttle setting, so there is no marginal-cost curve for the optimiser to balance against and no reason for an interior throttle to ever beat full thrust (for maximising altitude) or minimum admissible thrust. The singular arc is a consequence specifically of drag's $v^2e^{-h/h_s}$ shape, not of "drag" as a generic idea.
:::

## Summary

| Object | Statement |
| --- | --- |
| Switching function | $H=(\ldots)+S(t)u$; $u^\star=u_{\max}$ where $S<0$, $u_{\min}$ where $S>0$ |
| Descent example | $S(0)=+3.27\times10^{-5}$, one zero crossing at $t=1.8546\,\mathrm{s}$, $S(t_f)=-5.88\times10^{-4}$: coast then burn |
| Singular arc | $S\equiv0$ on an interval; minimum principle determines nothing pointwise there |
| Finding the control | Differentiate $S$ along the flow until $u$ appears, at derivative $2q$; $q$ is the order |
| Generalised Legendre-Clebsch | $(-1)^q\,\partial/\partial u\,(S^{(2q)}) \ge 0$ at a genuine minimum |
| Toy example | $S=\lambda_2,\dot S=-\lambda_1,\ddot S=2x_1,\dddot S=2x_2,S^{(4)}=2u$; order $q=2$; singular arc is $x_1=x_2=\lambda_1=\lambda_2=0$ |
| Goddard mechanism | Drag/weight ratio falls from $1.46$ (sea level) to $0.25$ ($15\,\mathrm{km}$) at fixed speed; the singular arc balances marginal thrust against marginal drag as that ratio collapses |
| Numerical symptom | Rapid chattering between bounds over an extended stretch usually signals an unresolved singular arc, not a bug |

The direct methods that make up the rest of this module transcribe a problem like this one into a finite nonlinear program without ever writing a switching function by hand — the next lesson is where that transcription starts.
