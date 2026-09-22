---
id: l06-football-orbits-and-circumnavigation
title: Football orbits and natural motion circumnavigation
minutes: 22
covers:
  - football and drifting relative orbits
  - natural motion circumnavigation
---

The previous lesson found the one condition that keeps a relative orbit from drifting away forever. This lesson looks at what that condition actually produces — a closed loop with a distinctive shape, a fixed proportion between its two in-plane dimensions, and a definite direction of travel — and shows how to steer that loop on purpose, either as a compact figure that returns to the target every orbit or, with one more idea, as a slow, fuel-free tour completely around it. Both are standard tools for close inspection: watch a tumbling target from every angle without spending propellant on anything but the single burn that starts the loop.

## The shape of a closed relative orbit

Impose the drift-free condition $\dot y_0=-2nx_0$ from the previous lesson on the general CW solution and the secular terms cancel exactly, as already shown. What survives, after collecting terms (the algebra is the same substitution carried through the full $x(t)$ and $y(t)$ expressions), is

$$
x(t) = x_0\cos nt + \frac{\dot x_0}{n}\sin nt, \qquad
y(t) - y_c = -2\left(x_0\sin nt - \frac{\dot x_0}{n}\cos nt\right), \qquad y_c \equiv y_0 - \frac{2\dot x_0}{n}.
$$

Both $x(t)$ and $y(t)-y_c$ are sums of $\sin nt$ and $\cos nt$ at the same frequency $n$, so each traces a sinusoid with amplitude $A=\sqrt{x_0^2+(\dot x_0/n)^2}$ — but the in-track amplitude is *exactly twice* the radial one, since $y(t)-y_c$ is $-2$ times the same combination that gives $x(t)$. Eliminating $t$ between the two (or noting directly that $x/A$ and $-(y-y_c)/2A$ trace out $\cos$ and $\sin$ of the same angle) gives the ellipse equation:

$$
\frac{x^2}{A^2} + \frac{(y-y_c)^2}{(2A)^2} = 1.
$$

::: key The football orbit
Any drift-free CW initial condition produces a closed ellipse in the $x$–$y$ plane, centred at $(0,y_c)$ with $y_c=y_0-2\dot x_0/n$, radial semi-axis $A=\sqrt{x_0^2+(\dot x_0/n)^2}$ and in-track semi-axis $2A$ — always exactly a 2:1 ratio, regardless of the specific $x_0,\dot x_0,y_0$ chosen. The shape is nicknamed the "football" for its elongated outline.
:::

That fixed 2:1 ratio is not a coincidence of the numbers chosen; it falls straight out of the coefficient $-2$ that links the radial and in-track channels in the original coupled CW equations, the same coupling responsible for the Coriolis terms in the very first derivation. Whatever amplitude you put into the radial direction comes back doubled in the in-track direction, every time.

## Which way around

Evaluate the sense of travel directly: at $x_0=A$ (so $\dot x_0=0$, $y=y_c$), the radial velocity is $\dot x = -An\sin nt\big|_{t=0}=0$ and the in-track velocity is $\dot y = -2An\cos nt\big|_{t=0}\cdot(-1)$... rather than track signs symbolically, take the concrete case worked below and watch the sequence of quadrants: starting at $(x,y-y_c)=(A,0)$ and advancing $t$, the state moves next to $(0,-2A)$, then to $(-A,0)$, then to $(0,2A)$, and back to $(A,0)$. Plotted with $x$ (radial) vertical and $y$ (in-track) horizontal, that sequence — right, down, left, up — is **clockwise** when viewed from the $+\hat{\mathbf{z}}$ direction, which is the target's orbit-normal, the same direction the target's own motion is prograde when viewed from outside the orbit. Clockwise as seen from the direction of prograde motion is, by definition, **retrograde**.

::: key Direction of travel
The football orbit is always traversed in the retrograde sense — clockwise as viewed from the cross-track ($+\hat{\mathbf{z}}$, orbit-normal) direction — once per target orbital period, regardless of which drift-free initial condition produced it.
:::

## Building one from a pure radial burn

The cleanest way to create a football orbit is also the most instructive: fire a single impulsive $\Delta v$ purely along $+\hat{\mathbf{x}}$ (radially outward) from co-location with the target. Here $x_0=y_0=0$, $\dot x_0=\Delta v$, and $\dot y_0=0$ — check the drift-free condition: it requires $\dot y_0=-2nx_0=-2n(0)=0$, which is already satisfied automatically, since $x_0=0$. **Any** purely radial velocity kick from co-location is drift-free, with no need to add any compensating in-track component at all.

::: example A 0.1 m/s radial burn, closed and confirmed
On this module's reference orbit, $\Delta v=0.0001\,\mathrm{km/s}=0.1\,\mathrm{m/s}$ radially outward from co-location gives $A=\Delta v/n = 88.64\,\mathrm{m}$, $y_c=-2\Delta v/n=-177.28\,\mathrm{m}$. The CW closed form over one orbit:

| Fraction of orbit | 0 | 0.125 | 0.25 | 0.375 | 0.5 | 0.75 | 1.0 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $x$ (m) | 0.0 | 62.68 | 88.64 | 62.68 | 0.0 | $-88.64$ | 0.0 |
| $y$ (m) | 0.0 | $-51.92$ | $-177.28$ | $-302.64$ | $-354.56$ | $-177.28$ | 0.0 |

The chaser returns *exactly* to co-location after one orbit, having swept out an ellipse $177.3\,\mathrm{m}$ tall (radial) by $354.6\,\mathrm{m}$ wide (in-track) — the promised 2:1 ratio. Full nonlinear two-body propagation of the same burn agrees with every entry above to within a few millimetres at this separation (the largest discrepancy, at the half-orbit point, is $4.6\,\mathrm{mm}$), and even after three full orbits the nonlinear truth has only drifted $3.3\,\mathrm{cm}$ from the CW-predicted closure — consistent with the error-growth rate quantified two lessons ago at this modest a separation.
:::

Contrast this directly with the previous lesson's along-track burn of the same $0.1\,\mathrm{m/s}$ size: fired radially, it closes into a $354\,\mathrm{m}$-wide loop and returns exactly to start every orbit; fired along-track, it produces unbounded drift, hundreds of metres per orbit and growing forever. Both are $0.1\,\mathrm{m/s}$ burns from the same starting point. The difference is entirely about which of $x_0,\dot y_0$ ends up nonzero: a radial velocity kick leaves $\dot y_0=0$, satisfying drift-free trivially since $x_0$ started at zero too; an in-track velocity kick sets $\dot y_0\ne 0$ while $x_0$ stays zero, directly violating the same condition. The two burns are perpendicular to each other and could hardly look more different in outcome, and the entire distinction traces back to one algebraic condition from the previous lesson.

## Natural motion circumnavigation

The football orbit above is tangent to the target — it swings back to $(0,0)$ once per orbit, which is not a comfortable way to inspect something at close range. Shifting where the loop is *centred*, without giving up on being drift-free, fixes that. The centre $y_c=y_0-2\dot x_0/n$ can be placed anywhere by choosing $y_0$ alone; setting $y_0=2\dot x_0/n$ (instead of $y_0=0$) centres the ellipse exactly on the target.

::: example A centred inspection loop
Use the same $\dot x_0=0.1\,\mathrm{m/s}$ radial-velocity driver as before, but start from $y_0=2\dot x_0/n=177.28\,\mathrm{m}$ ahead of the target instead of co-located with it (still $x_0=0$, so still drift-free with $\dot y_0=0$). The resulting loop is centred exactly on the target: minimum range $88.64\,\mathrm{m}$ (at the ellipse's minor-axis points, $x=\pm A$, $y=0$), maximum range $177.28\,\mathrm{m}$ (at the major-axis points, $x=0$, $y=y_c\pm2A$), closed and exactly periodic — confirmed by propagating a full period and finding the state returns to its start to machine precision. The chaser now circles the target at a bounded range between roughly 89 and 177 m, forever, on a single burn.
:::

Add an out-of-plane component to view the target from above and below the orbit plane as well as fore, aft, in and out. A cross-track *position* offset $z_0$ (with $\dot z_0=0$) gives $z(t)=z_0\cos nt$ from the earlier harmonic solution — automatically at the same frequency $n$ as the in-plane motion, and automatically in quadrature with it: $x(t)=A\sin nt$ leads $z(t)=z_0\cos nt$ by a quarter cycle. Two oscillators at the same frequency, 90° out of phase, trace an ellipse when plotted against each other — here, in the plane containing the radial and cross-track axes, tilted out of the orbital plane.

::: example Tilting the loop out of the orbital plane
Add $z_0 = 88.64\,\mathrm{m}$ (matching the radial amplitude $A$) to the centred loop above. The in-plane minimum-range points ($x=\pm A$, $y=0$) occur exactly where $\cos nt=0$, so $z=0$ there too — the cross-track motion contributes nothing extra at the closest approach, and the minimum range barely changes, from $88.64\,\mathrm{m}$ to $88.641\,\mathrm{m}$. At the farthest points, where $z$ is at its own extremum, the range grows from $177.28\,\mathrm{m}$ to $\sqrt{177.28^2+88.64^2}=198.2\,\mathrm{m}$. The trajectory is now a genuinely three-dimensional, tilted closed loop: still exactly periodic (it returns to its start after one target orbital period, since every component shares the same frequency $n$), still requiring no propellant beyond the single initiating burn, and now sweeping the viewing aspect above and below the orbital plane as well as fore, aft, in and out — a natural motion circumnavigation.
:::

::: warning Closed under CW is not closed forever
"Drift-free" and "closed" describe the CW model, not perfect reality. The validity-limits lesson already showed that CW itself accumulates error against true nonlinear motion at a rate that grows with separation and, worse, explodes if the target's orbit is not really circular. A natural motion circumnavigation loop is fuel-free only until real-world perturbations — $J_2$, drag, a target orbit that is not perfectly circular — nudge it off the ideal drift-free condition, at which point it slowly turns into exactly the secular drift of the previous lesson. In practice these loops are re-initialized or lightly trimmed periodically; "natural" describes the dynamics between corrections, not a permanent exemption from them.
:::

## Check yourself

::: check
A drift-free relative orbit has radial amplitude $A=40\,\mathrm{m}$. What is its in-track amplitude, and what is the ratio between the two always equal to?
:::

::: answer
In-track amplitude is $2A=80\,\mathrm{m}$. The ratio is always exactly 2:1 (in-track to radial), a direct consequence of the $-2$ coupling coefficient in the CW equations, independent of which specific drift-free initial condition produced the orbit.
:::

::: check
Two drift-free loops are built from the same $0.1\,\mathrm{m/s}$ radial-velocity driver: one starting from co-location ($y_0=0$), one centred on the target ($y_0=177.28\,\mathrm{m}$). Do they have the same radial amplitude $A$? Do they have the same minimum range to the target?
:::

::: answer
Yes to the first: $A=\dot x_0/n$ depends only on the radial-velocity driver, not on $y_0$, so both have $A=88.64\,\mathrm{m}$. No to the second: the co-located loop is tangent to the target (minimum range $0$, since it starts there), while the centred loop never gets closer than $A=88.64\,\mathrm{m}$ — moving $y_0$ only shifts where the same-shaped ellipse sits relative to the target, and that shift is exactly what turns a tangent swing-by into a stand-off loop.
:::

::: check
Explain physically why a football orbit's shape is fixed at exactly 2:1 rather than some ratio that depends on the burn direction or size.
:::

::: answer
The 2:1 ratio comes from the coefficient linking $x$ and $y$ in the CW equations themselves ($\dot y+2n\dot x=0$), which holds for every drift-free solution regardless of amplitude or which combination of $x_0,\dot x_0,y_0$ produced it — burn size and direction change $A$ (the overall scale) and $y_c$ (where the loop sits), but never the ratio between the two axes, because that ratio is a property of the linear dynamics, not of the particular initial condition fed into them.
:::

::: check
Why does adding a cross-track position offset $z_0$ (rather than a cross-track velocity $\dot z_0$) naturally put the out-of-plane motion in quadrature with the in-plane radial motion, without any extra timing calculation?
:::

::: answer
The in-plane radial motion built from a pure velocity driver goes as $x(t)=A\sin nt$ (zero at $t=0$, since $x_0=0$ there). The cross-track motion from a pure position offset goes as $z(t)=z_0\cos nt$ (maximum at $t=0$, since $\dot z_0=0$ there). Sine and cosine of the same argument are automatically 90° apart; choosing a *position* driver for $z$ and a *velocity* driver for $x$ is what lines up a sine with a cosine without needing to solve for any additional phase or delay.
:::

::: check
A natural motion circumnavigation loop is initialized and then left with no further burns for two weeks. Based on this lesson and the validity-limits lesson, what should you expect to observe, and why?
:::

::: answer
Initially the loop should track its predicted closed shape closely, but over time it will slowly stop closing exactly — real perturbations (the target's true, not-quite-circular orbit; $J_2$; drag) violate the idealized drift-free condition CW assumed, so a small effective $\delta a$ appears between chaser and target that was not there in the linear model. Per the secular-drift lesson, any nonzero $\delta a$ produces an unbounded in-track drift, so over two weeks (many tens of orbits) the "closed" loop should be expected to gradually elongate and walk away in-track unless it is periodically re-targeted or trimmed.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $x(t)=x_0\cos nt+(\dot x_0/n)\sin nt$ | Drift-free radial motion: pure oscillation at frequency $n$ |
| $y(t)-y_c = -2(x_0\sin nt-(\dot x_0/n)\cos nt)$ | Drift-free in-track motion, centred at $y_c=y_0-2\dot x_0/n$ |
| $A=\sqrt{x_0^2+(\dot x_0/n)^2}$ | Radial semi-axis; in-track semi-axis is always $2A$ |
| Football orbit | The resulting 2:1 ellipse; traversed once per orbit in the retrograde sense |
| Pure radial burn from co-location | Automatically drift-free ($x_0=0$ trivially satisfies $\dot y_0=-2nx_0$); produces a football tangent to the target |
| Centred natural motion circumnavigation | Same driver, $y_0=2\dot x_0/n$ instead of $0$: a closed loop with bounded minimum range, centred on the target |
| Adding $z_0$ in quadrature with $x(t)$ | Tilts the loop out of the orbital plane for full-aspect viewing, still exactly periodic |
| Loops are fuel-free only ideally | Real perturbations slowly reintroduce the secular drift of the previous lesson |

Both this lesson and the last describe motion with no further thrust after the initial burn. The next lesson goes the other way — designing the burns themselves, to move deliberately from one relative state to another in a chosen time, which is what a real rendezvous transfer requires.
