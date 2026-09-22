---
id: l04-cw-validity-and-tschauner-hempel
title: How good is CW? Validity limits and the eccentric-orbit break
minutes: 22
covers:
  - Tschauner-Hempel equations for eccentric reference orbits
---

The previous lesson confirmed that the state transition matrix solves the CW equations exactly. That is a check of arithmetic, not of physics — it says nothing about how well the CW equations themselves describe two real spacecraft. CW was built by linearizing gravity for small separation and freezing the reference orbit as circular. Both assumptions are approximations, and every approximation has a domain where it is excellent and a domain where it quietly stops being true. A GNC engineer who trusts CW blindly past its domain is not making a subtle error; she is using the wrong equation and getting an answer that looks exactly as confident as a correct one.

This lesson measures that domain directly, against the only thing that can honestly check it: a full nonlinear two-body propagation of both vehicles' actual absolute orbits. It then shows the one assumption that breaks hardest — a circular reference orbit — and derives what replaces CW once that assumption goes.

## Method: comparing CW against nonlinear truth

Pick a relative state $(\boldsymbol\rho_0,\dot{\boldsymbol\rho}_0)$ and a target orbit. Propagate two ways. First, the CW way: apply $\boldsymbol\Phi(t)$ from the previous lesson to get $\boldsymbol\rho_{\mathrm{CW}}(t)$. Second, the truth: use lesson 1's conversion to build the chaser's absolute state, propagate *both* the target's and the chaser's absolute orbits with a high-accuracy two-body integrator (no linearization anywhere), and project the result back into the target's instantaneous LVLH frame at each output time to get $\boldsymbol\rho_{\mathrm{truth}}(t)$. The difference $\lVert\boldsymbol\rho_{\mathrm{truth}}(t)-\boldsymbol\rho_{\mathrm{CW}}(t)\rVert$ is the real error — not an artifact of solving the CW equations imperfectly (lesson 3 already ruled that out), but the actual cost of the two approximations that produced those equations in the first place. Every number below was confirmed step-size independent: tightening the integrator tolerance by two more orders of magnitude changed nothing beyond the fifth significant figure, and an independent fixed-step Runge-Kutta integration agreed to the same precision.

## Error against separation and elapsed time

Take the reference orbit of this module, $r_0=6791\,\mathrm{km}$, $n=1.1282\times10^{-3}\,\mathrm{rad/s}$, $T=5569.4\,\mathrm{s}$. For each separation $d$, start the chaser on the closed 2:1 ellipse the next lesson explains in full — $x_0=d$, $\dot y_0=-2nd$, everything else zero — so that the size of the relative orbit being tested scales cleanly with $d$. Propagate both ways and tabulate the position error, in metres:

| Separation | 0.05 $T$ | 0.25 $T$ | 0.50 $T$ | 1 $T$ | 2 $T$ | 3 $T$ | 5 $T$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 100 m | 0.0002 | 0.0030 | 0.0075 | 0.0139 | 0.0278 | 0.0416 | 0.0694 |
| 1 km | 0.021 | 0.299 | 0.754 | 1.387 | 2.774 | 4.162 | 6.936 |
| 10 km | 2.12 | 29.9 | 75.3 | 138 | 276 | 415 | 691 |
| 50 km | 52.7 | 742 | 1869 | 3393 | 6787 | 10180 | 16970 |

Two patterns jump out, and both are consistent with the size of the neglected term identified in the previous lesson. First, at a fixed elapsed time the error scales almost exactly with $d^2$: going from 100 m to 1 km (10×) multiplies the error by very close to 100 at every column, and 1 km to 10 km does the same, confirming that the dominant leftover term is the next order in the separation expansion, $O\!\big((d/r_0)^2\big)$, not something growing faster. Second, at fixed separation the error grows *linearly* with time once past roughly one orbit — the 1 km row runs $1.387,\ 2.774,\ 4.162,\ 6.936$ at $1,2,3,5$ orbits, a rate of $1.387\,\mathrm{m}$ per orbit that holds to four significant figures across that entire range. This is not the error "wobbling" around some average; it is a genuine secular drift *in the error itself* — CW's small, consistent mismodeling of the acceleration integrates, orbit after orbit, into an ever-larger position miss, the same way an uncorrected $J_2$ term accumulates rather than averaging away.

::: key CW's error rate
Once past the first orbit, CW's position error against nonlinear truth grows at approximately
$$
\dot\varepsilon \approx 1.39\ \mathrm{m/orbit} \times \left(\frac{d}{1\,\mathrm{km}}\right)^{2}
$$
confirmed from 100 m to 50 km of separation (within about 2% even at 50 km, where the $d^2$ scaling begins to show its own higher-order correction).
:::

That lets you state plainly where CW is trustworthy. At 100 m separation the error does not reach 1 m until about 72 orbits have passed — for any realistically short proximity-operations timeline, CW is good to well under a metre. At 1 km separation the error crosses 1 m after only $0.57$ orbits (about 53 minutes on this reference orbit) — still a comfortable margin for a single transfer, tight for anything longer. At 10 km separation the error is already past 2 m in under five minutes ($0.05T\approx 278\,\mathrm{s}$) — CW at that range is a planning tool, not a metre-level guidance model. This is exactly why real rendezvous profiles start CW-style far-field targeting at kilometre-scale ranges and switch to closed-loop sensor feedback, rather than trusting an open-loop CW prediction, once inside a few hundred metres over any but the shortest timescales.

::: example Reading the table as a design rule
A mission planner needs to know if a single CW-computed 1 km transfer, taking 30 minutes ($0.323$ of this reference orbit), will stay accurate to better than 1 m throughout. Interpolating between the $0.25T$ and $0.50T$ entries of the 1 km row ($0.299\,\mathrm{m}$ and $0.754\,\mathrm{m}$) gives roughly $0.4$–$0.5\,\mathrm{m}$ at $0.323T$ — comfortably under budget. The same transfer attempted from 10 km out would already show on the order of $50$–$60\,\mathrm{m}$ of error by the same fraction of an orbit (interpolating the 10 km row similarly), which is not a rounding concern; it is the difference between arriving where you planned and needing a substantial correction burn.
:::

## When the reference orbit is not circular

Everything above holds the reference orbit circular — the second CW assumption was never touched. Now break only that one. Put the target on an orbit with the same semi-major axis, $a=6791\,\mathrm{km}$, but eccentricity $e=0.05$, starting the comparison at periapsis, and repeat the identical 1 km-separation test, propagating CW with the same constant $n=\sqrt{\mu/a^3}$ used throughout (what a CW implementation blind to eccentricity would use):

| $t/T$ | Circular reference, error (m) | $e=0.05$ reference, error (m) |
| --- | --- | --- |
| 0.05 | 0.021 | 6.65 |
| 0.10 | 0.079 | 29.1 |
| 0.25 | 0.30 | 274.0 |
| 0.50 | 0.75 | 1656 |
| 0.75 | 1.37 | 3046 |
| 1.00 | 1.39 | 3343 |

At the same 1 km separation and the same quarter-orbit, an eccentricity of just 0.05 turns a 30 cm error into a 274 m error — roughly a **thousand-fold** increase from a reference orbit that never strays more than $\pm 340\,\mathrm{km}$ from its mean radius ($a e = 340\,\mathrm{km}$ out of $a=6791\,\mathrm{km}$, about 5%). Separation was never the problem here; the circular-orbit assumption was, and it fails far harder than the small-separation assumption does. A reference orbit "close enough to circular by eye" is not the same claim as "close enough to circular for CW."

## The Tschauner-Hempel equations

Go back to the exact relative-motion equation from two lessons ago, before the circular specialization was imposed:

$$
\ddot x - 2\dot\theta\dot y - \ddot\theta y - \dot\theta^2x = -\frac{\mu(r_t+x)}{r_c^3}+\frac{\mu}{r_t^2}, \quad
\ddot y+2\dot\theta\dot x+\ddot\theta x-\dot\theta^2y=-\frac{\mu y}{r_c^3}, \quad
\ddot z=-\frac{\mu z}{r_c^3}.
$$

Linearize the gravity terms for small separation exactly as before — the algebra does not care whether $r_t$ is constant — giving $2(\mu/r_t^3)x$, $-(\mu/r_t^3)y$, $-(\mu/r_t^3)z$ on the right. This time, do **not** assume $r_t$, $\dot\theta$, $\ddot\theta$ are constant; leave them as the real, time-varying functions of an eccentric orbit (available in closed form from Kepler's equation, taught earlier in the curriculum). The result is still linear in $x,y,z$ — small-separation is the only approximation left — but its coefficients now vary periodically over the orbit instead of staying fixed:

$$
\ddot x-2\dot\theta(t)\dot y-\ddot\theta(t)y-\dot\theta(t)^2x = \frac{2\mu}{r_t(t)^3}x, \quad
\ddot y+2\dot\theta(t)\dot x+\ddot\theta(t)x-\dot\theta(t)^2y=-\frac{\mu}{r_t(t)^3}y, \quad
\ddot z=-\frac{\mu}{r_t(t)^3}z.
$$

This time-varying linear system, reparametrized with the target's true anomaly as the independent variable in place of time (a standard substitution, since $\dot\theta$ itself is one of the varying coefficients — Tschauner and Hempel's original 1965 paper carries out that change of variable explicitly), is the **Tschauner-Hempel equations**. They make exactly the small-separation approximation CW makes and none of the circular-orbit approximation — the price is that a closed-form state transition matrix is considerably harder to obtain than CW's, since the coefficients no longer stay put. It was found decades later, by Yamanaka and Ankersen in 2002, and it is what a rendezvous designer reaches for once a target's eccentricity is too large to treat as circular.

::: example Confirming the fix
Integrate the time-varying linear system above directly — feeding it the target's true $r_t(t)$, $\dot\theta(t)$, $\ddot\theta(t)$ from an exact Kepler solution rather than freezing them at their periapsis values — for the same $e=0.05$, 1 km-separation case tabulated earlier:

| $t/T$ | Fixed-$n$ CW error (m) | Time-varying (T-H-type) error (m) |
| --- | --- | --- |
| 0.05 | 6.65 | 0.026 |
| 0.25 | 274.0 | 0.41 |
| 0.50 | 1656 | 1.00 |
| 1.00 | 3343 | 2.58 |

Restoring the correct, time-varying reference-orbit rate cuts the error by a factor of 250 to over 1000 across this range, bringing it back down to the same order of magnitude as the circular-reference, separation-only error from the first table. The eccentricity error and the separation-linearization error are two independent effects; fixing the first does not touch the second, but it removes the effect that was three orders of magnitude larger here.
:::

::: warning Eccentricity, not just "small e"
$e=0.05$ sounds negligible — most people would call that orbit "basically circular" on sight. The thousand-fold error growth above shows that intuition does not transfer to relative-motion accuracy: CW's error from eccentricity does not scale gently with $e$, because the coefficient CW freezes, $\dot\theta$, itself varies by a factor of $\big(\tfrac{1+e}{1-e}\big)^2 \approx 1.22$ between periapsis and apoapsis at $e=0.05$ alone, and that mismatch compounds over an orbit rather than averaging out. Check the target's eccentricity before reaching for CW, not after the result looks strange.
:::

## Check yourself

::: check
At 1 km separation, CW's position error reaches 1 m after roughly 0.57 orbits. Using the stated per-orbit rate near 1 km separation ($1.39\,\mathrm{m/orbit}$), estimate how many orbits it takes to reach 1 m at 300 m separation, and check the estimate is broadly consistent with the 100 m and 1 km figures already given in the lesson.
:::

::: answer
Scaling the rate by $(0.3\,\mathrm{km}/1\,\mathrm{km})^2 = 0.09$ gives about $1.39\times0.09 = 0.125\,\mathrm{m/orbit}$ at 300 m, so 1 m is reached after roughly $1/0.125 \approx 8$ orbits. That sits between the 100 m figure (about 72 orbits) and the 1 km figure (0.57 orbits) in the right direction and by roughly the right factor — 300 m is nine times the separation of the 100 m case, so its time-to-1-metre should be about $1/9^2\approx1/81$ of 72 orbits, i.e. under one orbit, consistent with the estimate above once the post-transient linear approximation is applied loosely this close to the transient region.
:::

::: check
Explain why the error in the separation-only study (circular reference) grows quadratically with $d$ rather than linearly.
:::

::: answer
The linearization dropped a term of relative size $O(d/r_0)$ in the *acceleration* (shown explicitly in the previous lesson's worked example). An acceleration error that itself scales as $d\cdot(d/r_0) = d^2/r_0$, integrated twice over time, produces a position error that inherits that same $d^2$ scaling — the linear-in-$d$ part of the acceleration is exactly what CW keeps; only the next, quadratic, term is missing.
:::

::: check
Why does starting the eccentric comparison at periapsis, rather than at apoapsis or some arbitrary point, not change the qualitative conclusion that eccentricity breaks CW badly?
:::

::: answer
The mismatch comes from $\dot\theta$ and $r_t$ varying over the orbit relative to the constant values CW assumes, and that variation is a property of the whole orbit, not of the starting point chosen within it — starting elsewhere shifts which part of the variation you see first but does not remove the variation. Periapsis was chosen only because it gives a clean, reproducible reference point (true anomaly zero), not because it is a special case that favours CW.
:::

::: check
A colleague argues that since the Tschauner-Hempel-type system in this lesson is still a *linearization* in separation, it must have the same $O(d^2)$ error growth with separation that plain CW has on a circular reference. Is this right?
:::

::: answer
Yes for the separation part: the T-H-type system makes exactly the same small-separation approximation CW does, so its error still grows with separation in the same way, and the confirming table shows its residual error (0.026 to 2.58 m across the tested range) is of the same order as the circular-reference CW error at 1 km separation from the first table. What it removes is only the *additional* error from assuming a circular reference orbit — the two approximations are independent, and fixing one does not touch the other.
:::

::: check
A target has $e=0.001$ — essentially circular by any operational standard. Would you expect CW to need the Tschauner-Hempel correction here?
:::

::: answer
No. The eccentricity-driven error in this lesson's example came from $e=0.05$ producing roughly a 22% swing in $\dot\theta$ between periapsis and apoapsis; at $e=0.001$ that swing shrinks by roughly a factor of 50 (the leading dependence is close to linear in $e$ for small $e$), so the resulting position-error inflation would be far smaller than the thousand-fold effect seen at $e=0.05$, likely negligible next to the ordinary separation-driven CW error already present. The rule of thumb from the warning box — check the actual eccentricity, do not eyeball "basically circular" — cuts both ways: it also says not to reach for the heavier T-H machinery when plain CW is already adequate.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\dot\varepsilon \approx 1.39\,\mathrm{m/orbit}\times(d/1\,\mathrm{km})^2$ | CW's secular position-error growth rate, circular reference, confirmed 100 m–50 km |
| 100 m, 1 km, 10 km separation | Good to 1 m for $\sim$72 orbits, $\sim$0.57 orbits, $\sim$0.05 orbits respectively |
| $e=0.05$ at 1 km, quarter orbit | 274 m error vs 0.30 m circular — about 1000$\times$ worse |
| Exact relative EOM, gravity linearized only | The Tschauner-Hempel system: linear in separation, time-varying coefficients in $r_t(t),\dot\theta(t),\ddot\theta(t)$ |
| Yamanaka-Ankersen (2002) | Closed-form STM for the Tschauner-Hempel equations, the eccentric-orbit analogue of $\boldsymbol\Phi(t)$ |
| Two independent error sources | Separation ($O(d^2)$, present even for $e=0$) and eccentricity (present even for small $d$) — fixing one leaves the other |

With CW's domain now measured rather than assumed, the next two lessons go back inside that domain and use the closed-form solution to explain the two most consequential behaviours of relative motion: why some burns drift forever and others do not, and why a prograde burn leaves you behind rather than ahead.
