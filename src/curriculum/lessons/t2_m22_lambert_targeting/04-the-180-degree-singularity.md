---
id: l04-the-180-degree-singularity
title: The 180-degree singularity
minutes: 20
covers:
  - convergence and singular geometries near a 180 degree transfer
---

Every solver in this module so far has quietly assumed the transfer plane is obvious: compute $\mathbf{r}_1\times\mathbf{r}_2$, normalise it, and that is the orbit normal. That assumption fails outright when $\mathbf{r}_1$ and $\mathbf{r}_2$ point in exactly opposite directions — a transfer angle of exactly $180°$ — and it fails *softly*, in a way that is more dangerous than an outright crash, for transfer angles close to but not exactly $180°$. This lesson treats the two failures separately, because they call for different responses: the exact case is a genuine mathematical degeneracy with no single right answer, and the near case is a well-posed problem whose answer exists and is unique but is extremely sensitive to the input — the textbook definition of ill-conditioning, demonstrated here with real numbers rather than asserted.

## Why $180°$ is genuinely singular

The orbital plane of any two-body transfer is the plane containing the focus and both position vectors, and its normal direction is $\hat{\mathbf{h}} = (\mathbf{r}_1\times\mathbf{r}_2)/\lVert\mathbf{r}_1\times\mathbf{r}_2\rVert$ — this is how every solver in this module has picked prograde over retrograde, and how $\Delta\nu$ itself is disambiguated. When $\mathbf{r}_1$ and $\mathbf{r}_2$ are antiparallel, $\mathbf{r}_1\times\mathbf{r}_2 = \mathbf{0}$: the cross product vanishes identically, not approximately, because two antiparallel vectors have no component perpendicular to each other to build a cross product from.

Geometrically, that zero has an unambiguous meaning: *any* plane through the origin that contains the line joining $\mathbf{r}_1$ and $\mathbf{r}_2$ also contains both vectors individually, since they lie on that same line (in opposite directions). There is no longer one distinguished plane containing "the origin, $\mathbf{r}_1$, and $\mathbf{r}_2$" — there are infinitely many, related by rotation about the common line through $\mathbf{r}_1$ and $\mathbf{r}_2$. The magnitude of the required transfer — the semi-major axis, the speed at each end — is still perfectly well defined at $\Delta\nu=180°$, because it depends on $A^2=2s(s-c)$ from the first lesson, which involves only lengths. What is undefined is the *orientation*: which of the infinitely many planes through the line the spacecraft is actually meant to travel in, and therefore which direction, out of an entire circle of equally valid choices, $\mathbf{v}_1$ points transverse to the line $\mathbf{r}_1$–$\mathbf{r}_2$.

::: key The $180°$ degeneracy
At $\Delta\nu=180°$ exactly, $\mathbf{r}_1\times\mathbf{r}_2=\mathbf{0}$ and the transfer plane is undefined: infinitely many planes contain both the focus and the (collinear) endpoints. The transfer's size and speed are still determined, but its orientation — and hence the direction of $\mathbf{v}_1$ transverse to the $\mathbf{r}_1$–$\mathbf{r}_2$ line — is not, without extra information from outside the two position vectors themselves (a specified inclination, a specified out-of-plane velocity component, or some other constraint).
:::

Algebraically, the same fact shows up directly in the solver from two lessons ago: $A = \sin\Delta\nu\sqrt{r_1r_2/(1-\cos\Delta\nu)}$, and $\sin(180°)=0$, so $A\to0$. Since $g = A\sqrt{y/\mu}$ and $\mathbf{v}_1 = (\mathbf{r}_2-f\mathbf{r}_1)/g$, the solver divides by a quantity that is going to zero — not a bug to be patched, but the algebra faithfully reporting the geometric degeneracy back to you.

## Near $180°$: ill-conditioned, not merely awkward

A transfer angle of $179.9°$ has a perfectly well-defined plane, a perfectly well-defined $\mathbf{v}_1$, and $A\ne0$ — the solver runs and returns an answer with no error and no warning. The trouble is how much that answer moves in response to a small, entirely realistic error in the input. Real position vectors come from orbit determination, propagated ephemerides, or onboard navigation, and they carry uncertainty at the level of metres to kilometres even for well-tracked objects. Near $180°$, that ordinary-sized uncertainty gets amplified into a large error in $\mathbf{v}_1$ — specifically, in the component of $\mathbf{v}_1$ transverse to the near-degenerate plane, exactly the direction the previous section identified as undefined in the limit.

::: example Sweeping the transfer angle toward $180°$
Fix $\mathbf{r}_1=(7000,0,0)\,\mathrm{km}$, $r_2=10\,000\,\mathrm{km}$, $\Delta t=5000\,\mathrm{s}$, and place $\mathbf{r}_2$ at transfer angle $\Delta\nu$ in the $\mathbf{r}_1$–$\mathbf{r}_2$ plane (taken here as the $xy$-plane, so $\mathbf{r}_2 = 10\,000(\cos\Delta\nu,\sin\Delta\nu,0)\,\mathrm{km}$). For each $\Delta\nu$, solve Lambert for $\mathbf{v}_1$, then perturb $\mathbf{r}_2$ by a tiny displacement *perpendicular to the transfer plane*, $\delta\mathbf{r}_2 = (0,0,1)\,\mathrm{km}$ — a $1\,\mathrm{km}$ error on a $10\,000\,\mathrm{km}$ vector, one part in ten thousand, smaller than typical ephemeris uncertainty for a well-tracked body — and re-solve. The table records $\lVert\delta\mathbf{v}_1\rVert$ per kilometre of that perturbation, i.e. the local sensitivity:

| $\Delta\nu$ | Sensitivity, $\lVert\delta\mathbf{v}_1\rVert/\lVert\delta\mathbf{r}_2\rVert$ |
| --- | --- |
| $150°$ | $1.57\times10^{-3}\,\mathrm{(km/s)/km}$ |
| $170°$ | $4.67\times10^{-3}$ |
| $175°$ | $9.35\times10^{-3}$ |
| $178°$ | $2.34\times10^{-2}$ |
| $179°$ | $4.69\times10^{-2}$ |
| $179.5°$ | $9.38\times10^{-2}$ |
| $179.9°$ | $4.68\times10^{-1}$ |
| $179.99°$ | $4.21$ |

The sensitivity climbs by more than three orders of magnitude between $150°$ and $179.99°$, and it is not levelling off — the pattern is consistent with growth like $1/(180°-\Delta\nu)$, which is exactly what you would expect from $g\propto A \propto \sin\Delta\nu$ sitting in a denominator: as $\Delta\nu\to180°$, $\sin\Delta\nu \to 180°-\Delta\nu$ (in radians, for angles near $\pi$), so the sensitivity of anything divided by $g$ blows up at the same rate the transfer angle's shortfall from $180°$ shrinks.
:::

::: example Where the perturbation actually goes
At $\Delta\nu=179.9°$, the unperturbed solution is $\mathbf{v}_1 = (1.2101,\ 8.1842,\ 0)\,\mathrm{km/s}$ — purely in-plane, as it must be, since both $\mathbf{r}_1$ and the unperturbed $\mathbf{r}_2$ lie in the $xy$-plane. Adding the $1\,\mathrm{km}$ out-of-plane perturbation to $\mathbf{r}_2$ and re-solving gives $\mathbf{v}_1' = (1.2101,\ 8.1708,\ 0.4682)\,\mathrm{km/s}$. The change, $(0.0000069,\ -0.0134,\ 0.4682)\,\mathrm{km/s}$, is almost entirely in the newly created $z$-component: a $1\,\mathrm{km}$ wobble that is $0.01\%$ of $\lVert\mathbf{r}_2\rVert$ has produced nearly half a kilometre per second of *out-of-plane* velocity error — comparable to an entire orbit-raising manoeuvre, from a position error that would be unremarkable anywhere else on the sweep. This is the mechanism from the previous section made numeric: the tiny out-of-plane nudge to $\mathbf{r}_2$ resolves the otherwise-near-degenerate orbital plane, and the solver, doing exactly what it is supposed to do, swings the whole transverse velocity to match whatever plane that nudge happened to define.
:::

::: warning The problem is well-posed; only the sensitivity is bad
It is worth being precise about what "ill-conditioned" means here, because it is not the same complaint as "singular." For any $\Delta\nu$ strictly less than $180°$, Lambert's problem has a unique, mathematically well-defined answer — the solver in this lesson's examples converged cleanly at $179.99°$ and closed the loop with the same sub-nanometre discipline as every other example in this module. The issue is entirely about *sensitivity*: the map from inputs ($\mathbf{r}_1$, $\mathbf{r}_2$) to output ($\mathbf{v}_1$) has a derivative that grows without bound as $\Delta\nu\to180°$, so an input error that would be harmless anywhere else becomes a large output error here. A well-posed problem with a huge condition number and a genuinely singular problem look similar in a rushed numerical experiment; they are not the same thing, and they call for different fixes.
:::

## What a real targeting system does

Nothing in the algebra above can be patched away — the ill-conditioning is a property of the geometry, not of any particular solver's implementation, so switching methods (universal variables, Izzo's reformulation, anything else in this module) does not remove it; every correctly implemented method inherits the same sensitivity near $180°$, because they are all solving the same underlying problem. What operational practice does instead is avoid depending on precision in the direction that is amplified.

The most direct tool is not to target transfer geometries near the ridge when there is a choice. On the porkchop plots built later in this module, the Type I and Type II lobes — transfer angles below and above $180°$ — are separated by exactly this ridge, and a mission designer reads the whole map before committing to a departure date specifically so that the chosen date sits comfortably inside a lobe rather than straddling the ridge between them. When the mission genuinely has no choice (a fixed launch window, a phasing constraint that happens to land near $180°$), the practical response is to treat the transverse/out-of-plane component of the targeted state as *effectively unconstrained by the position data alone* and supply the missing information from elsewhere — a required inclination, a required approach plane for a flyby, or extra weight on velocity or plane-normal measurements in the orbit-determination solution feeding the targeting problem, rather than trusting position alone to pin down a direction the position data cannot actually resolve. And because the sensitivity is a property of the transfer geometry itself, not of any one burn, it does not go away after the first correction — a targeting loop built around this geometry needs correspondingly larger trajectory-correction-manoeuvre margin (the subject of this module's final lesson) than one that never comes close to the ridge, since even a well-executed first burn leaves an out-of-plane error that ordinary navigation uncertainty will have made large.

## Check yourself

::: check
Explain why $\mathbf{r}_1\times\mathbf{r}_2=\mathbf{0}$ at $\Delta\nu=180°$ is an exact statement, not an approximation that happens to be very small.
:::

::: answer
Two vectors have a cross product of exactly zero if and only if they are parallel or antiparallel — collinear with a common line through the origin. At $\Delta\nu=180°$, $\mathbf{r}_1$ and $\mathbf{r}_2$ point in exactly opposite directions along the same line by definition, so $\mathbf{r}_1\times\mathbf{r}_2$ vanishes identically for any magnitudes $r_1,r_2$, not merely in the limit as $\Delta\nu$ approaches $180°$.
:::

::: check
A colleague says "Lambert's problem has no solution at exactly $180°$." Is this accurate? Correct the statement if not.
:::

::: answer
Not quite. The transfer's size (semi-major axis, speed magnitudes) is still determined at $\Delta\nu=180°$, since $A^2=2s(s-c)$ depends only on lengths, which remain well defined. What is missing is not a solution but a *unique* one: the orbital plane is undetermined, so there is a whole one-parameter family of equally valid transfer planes (and correspondingly a circle of possible directions for the transverse part of $\mathbf{v}_1$), rather than zero solutions or one.
:::

::: check
Why does adding a small perpendicular (out-of-plane) perturbation to $\mathbf{r}_2$, rather than an in-plane one, expose the ill-conditioning most dramatically near $\Delta\nu=180°$?
:::

::: answer
Near $180°$, the transfer plane is only weakly determined by $\mathbf{r}_1$ and $\mathbf{r}_2$ — their cross product is small, so small changes in whichever component of $\mathbf{r}_2$ contributes to that cross product have an outsized effect on the inferred plane. A perturbation already in the original plane does not, to leading order, change which plane the two vectors define; a perpendicular perturbation directly creates a new, non-degenerate cross product out of what was nearly zero, and the solver responds by rotating the whole transverse velocity to match the (now well-defined, but essentially arbitrarily chosen by the perturbation) new plane.
:::

::: check
The sensitivity table shows roughly a ten-fold increase in $\lVert\delta\mathbf{v}_1\rVert/\lVert\delta\mathbf{r}_2\rVert$ for each ten-fold decrease in $180°-\Delta\nu$ (for example, from $179°$ to $179.9°$ to $179.99°$). What functional form does this suggest, and why is it consistent with $A=\sin\Delta\nu\sqrt{r_1r_2/(1-\cos\Delta\nu)}$ appearing in the denominator of $\mathbf{v}_1=(\mathbf{r}_2-f\mathbf{r}_1)/g$ with $g\propto A$?
:::

::: answer
The pattern is consistent with sensitivity growing like $1/(180°-\Delta\nu)$ (equivalently $1/\sin\Delta\nu$ near $\Delta\nu=\pi$, since $\sin\Delta\nu \approx \pi-\Delta\nu$ for $\Delta\nu$ close to $\pi$ radians). Because $g=A\sqrt{y/\mu}$ and $A$ is proportional to $\sin\Delta\nu$, and $\mathbf{v}_1$ is obtained by dividing by $g$, any fixed absolute error propagated through that division is amplified by a factor that scales as $1/\sin\Delta\nu$ — which is exactly a $1/(180°-\Delta\nu)$-type blow-up as the transfer angle approaches $180°$.
:::

::: check
A mission's launch window forces a transfer angle of $179.6°$ with no flexibility. What would you recommend to the targeting team, given this lesson's findings?
:::

::: answer
Do not rely on the two position vectors alone to fix the transfer plane precisely — near this geometry, ordinary-sized position uncertainty maps into a large, effectively unconstrained out-of-plane velocity error. Bring in independent information to pin down the plane (a required inclination or approach-plane constraint from the mission design, or additional velocity/plane-normal information from orbit determination) rather than trusting the Lambert solve's transverse direction at face value, and budget a correspondingly larger trajectory-correction-manoeuvre allowance than for a transfer safely inside a Type I or Type II lobe, since the first burn is likely to leave a larger-than-usual out-of-plane miss that will need to be removed later.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{r}_1\times\mathbf{r}_2=\mathbf{0}$ at $\Delta\nu=180°$ | Exact degeneracy: infinitely many planes contain the collinear endpoints |
| $A\propto\sin\Delta\nu \to 0$ | The algebraic symptom; $g=A\sqrt{y/\mu}\to0$ appears in a denominator for $\mathbf{v}_1$ |
| Well-posed but ill-conditioned near $180°$ | A unique answer exists and the solver converges; small input errors produce large output errors |
| Sensitivity $\sim 1/(180°-\Delta\nu)$ | Grows without bound approaching the singular geometry, demonstrated $1.6\times10^{-3}$ to $4.2\,\mathrm{(km/s)/km}$ over $150°\to179.99°$ |
| Out-of-plane perturbation | The direction the near-degenerate plane cannot resolve; where the amplified error concentrates |
| Operational response | Avoid the ridge when possible (read the whole porkchop map); otherwise supply plane information from outside the position data and budget larger correction margin |

The next two lessons build the machinery — the state transition matrix and differential correction — that any targeting system, ridge or no ridge, uses to remove whatever error a Lambert solve leaves behind once the vehicle is actually flying.
