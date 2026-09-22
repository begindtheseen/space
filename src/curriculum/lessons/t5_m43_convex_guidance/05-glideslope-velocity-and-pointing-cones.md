---
id: l05-glideslope-velocity-pointing-cones
title: Glideslope, velocity, and pointing as cones
minutes: 19
covers:
  - Glideslope, velocity, and thrust-pointing constraints as cones
---

Fuel-optimal is not the same as safe, and the SOCP this module has assembled so far only knows about fuel. Nothing yet stops the optimizer from finding a trajectory that dives at the landing site along a grazing shallow path, arrives faster than the legs can absorb, or points the plume somewhere the vehicle's own attitude cannot support. Real powered-descent guidance adds three more limits — a glideslope, a speed cap, and a pointing limit — and the good news, established once in this lesson, is that none of them cost the SOCP structure anything. The better news is that one of them raises a question this module has not yet closed: the previous lessons proved the thrust bound's relaxation is exactly tight, but that proof was carried out as if thrust were the only constraint on itself. Once pointing is added, thrust is constrained twice over, and this lesson checks, rather than assumes, that the first proof still holds.

## The glideslope cone

A vehicle that flies too flat toward its target risks clipping terrain it has not yet overflown, and a lander guiding off a downward-looking sensor wants the target to stay inside the sensor's field of view rather than swinging past the edge of frame as the range closes. Both concerns are addressed the same way: keep the vehicle inside an inverted cone standing on the landing site, apex down, so that the horizontal distance from the target is bounded by a fixed multiple of the remaining altitude.

Write $\hat{\mathbf{e}}_{\text{up}}$ for the vertical unit vector and $\mathbf{H}$ for the matrix that projects onto the horizontal plane (the same role $\mathbf{E}$ played for the landing-error norm two lessons ago). With glideslope half-angle $\gamma_{gs}$ measured from vertical, the constraint is

$$
\hat{\mathbf{e}}_{\text{up}}^\top(\mathbf{r}-\mathbf{r}_{\text{target}}) \ge \tan\gamma_{gs}\,\big\|\mathbf{H}(\mathbf{r}-\mathbf{r}_{\text{target}})\big\|_2.
$$

This is already in the shape the optimization module's standard form wants — affine on the left, a norm times a positive constant on the right — so it is a second-order cone with no work required, the same recognition this module has now made three times (thrust magnitude, landing error, and here). It also does something useful for free: since a norm is never negative, the inequality forces $\hat{\mathbf{e}}_{\text{up}}^\top(\mathbf{r}-\mathbf{r}_{\text{target}}) \ge 0$, i.e. the vehicle stays at or above the target's altitude everywhere the constraint is imposed — terrain avoidance and field-of-view containment from a single cone.

::: example How much room the glideslope leaves, at three altitudes
Take $\gamma_{gs}=25°$, a moderately tight corridor. The allowed horizontal offset from the target at altitude $h$ above it is $h\tan(25°) = 0.4663h$: at $h=200\,\mathrm{m}$ that is $93.26\,\mathrm{m}$ of horizontal room, at $h=20\,\mathrm{m}$ only $9.33\,\mathrm{m}$, and at $h=5\,\mathrm{m}$ — close to touchdown — just $2.33\,\mathrm{m}$. The cone tightens linearly as the vehicle descends, which is exactly the behaviour wanted: generous room to manage dispersions early, and a narrow, well-defined final approach by the time precision actually matters.
:::

## The velocity cap

A limit on speed — total speed, or only the vertical descent rate, or only the horizontal component, depending on what the vehicle's legs and sensors can tolerate — is the simplest cone in this lesson: $\|\mathbf{v}\|_2 \le v_{\max}$, or $\|\mathbf{H}\mathbf{v}\|_2\le v_{\max}$ for a horizontal-only version, both special cases of the second-order cone with a constant right-hand side (a linear functional of the decision variables equal to the fixed number $v_{\max}$, so $\mathbf{c}=\mathbf{0}$, $d=v_{\max}$ in the standard-form notation). It exists for reasons that have nothing to do with fuel: touchdown sensors, landing-leg stroke, and structural loads all have rate limits the optimizer has no way to know about unless told, and an unconstrained minimum-fuel trajectory has no particular reason to respect any of them — minimising propellant and minimising terminal speed are different objectives that happen to agree only near the very end of a well-designed trajectory.

## Thrust pointing, precisely, and the question it raises

The earlier lesson introducing the four non-convexities flagged thrust pointing as a legitimate worry — a constraint on a normalised direction, the same shape as other things that turn out non-convex — and then showed the specific case of "stay within angle $\theta_{\max}$ of a reference direction $\hat{\mathbf{n}}$" resolves cleanly: $\hat{\mathbf{n}}^\top\mathbf{T} \ge \|\mathbf{T}\|_2\cos\theta_{\max}$ is convex outright, an affine function bounded below by a positive multiple of a norm. In the transformed variables this module now works in,

$$
\hat{\mathbf{n}}^\top\mathbf{u} \ge \sigma\cos\theta_{\max},
$$

which is **linear** in $(\mathbf{u},\sigma)$ jointly — not even a genuine cone, the simplest possible convex constraint, needing no relaxation and no approximation. So far this looks like nothing more than one more item to add to the growing list of cones.

But the earlier tightness proof for the thrust bound minimised the Hamiltonian's $\mathbf{T}$-dependence over the ball $\|\mathbf{T}\|_2\le\Gamma$ *alone*, and concluded the minimiser sits on the ball's surface because a linear function on a ball always does. Add the pointing constraint and $\mathbf{T}$ is no longer free to range over the whole ball — it is confined to $\{\mathbf{T} : \|\mathbf{T}\|_2\le\Gamma,\ \hat{\mathbf{n}}^\top\mathbf{T}\ge\Gamma\cos\theta_{\max}\}$, a ball with a flat cap sliced off. Minimising the same linear function over this *smaller* set: does the minimiser still land on $\|\mathbf{T}\|_2=\Gamma$, or can the flat cap now host the true minimum strictly inside the original ball?

Check the geometry directly, because it settles the question without needing a new theorem. A linear function minimised over any compact convex set attains its minimum at an extreme point of that set — this is the fact the optimization module used for linear programming's vertex solutions, and it applies here unchanged. The set $\{\|\mathbf{T}\|\le\Gamma\}\cap\{\hat{\mathbf{n}}^\top\mathbf{T}\ge\Gamma\cos\theta_{\max}\}$ is a spherical cap: solid, bounded by a curved piece of the sphere $\|\mathbf{T}\|=\Gamma$ where the pointing constraint has slack, and by a flat disk where the pointing constraint is exactly met. Every point on the curved piece trivially has $\|\mathbf{T}\|=\Gamma$. The flat disk is two-dimensional, and its own extreme points — by the identical fact applied one dimension down — are exactly its boundary circle, which is where the flat disk meets the sphere, so those points *also* satisfy $\|\mathbf{T}\|=\Gamma$. No point in the interior of the flat disk, where $\|\mathbf{T}\|<\Gamma$ strictly, is ever an extreme point of the sliced ball. So every extreme point of the constrained set — pointing added or not — sits exactly on the sphere, and the earlier argument's conclusion, $\|\mathbf{T}^\star\|_2=\Gamma^\star$, survives entirely unchanged.

::: key Pointing does not disturb thrust-bound tightness
Slicing the ball $\|\mathbf{T}\|\le\Gamma$ with the pointing halfspace $\hat{\mathbf{n}}^\top\mathbf{T}\ge\Gamma\cos\theta_{\max}$ produces a spherical cap whose extreme points — curved boundary or flat cut alike — all satisfy $\|\mathbf{T}\|=\Gamma$. A linear Hamiltonian minimised over this set therefore still lands on the thrust-bound boundary, exactly as it did without pointing. Açıkmeşe, Carson and Blackmore (2013) prove the full version of this fact — including the costate non-degeneracy half of the argument the previous lessons' affine-costate result depended on — for the general problem with both control bound and pointing constraints present together, which is why this module's resources single that paper out as the cleanest statement of the tightness conditions.
:::

::: warning Glideslope is a different kind of addition than pointing
Glideslope constrains $\mathbf{r}$, not $\mathbf{T}$, so it never enters the Hamiltonian's $\mathbf{T}$-minimisation step at all — the extreme-point argument above has nothing to say about it, because there is nothing to say. What glideslope *does* change, as a check-yourself question in the lossless-convexification lesson already flagged, is the costate equation $\dot{\boldsymbol{\lambda}}_v=-\boldsymbol{\lambda}_r$: once $\mathbf{r}$ appears in an active constraint, $\boldsymbol{\lambda}_r$ is no longer forced constant, so $\boldsymbol{\lambda}_v(t)$ is no longer exactly affine on that arc, and the clean "at most one zero" bookkeeping needs re-deriving arc by arc rather than being read off directly. The two additions are not interchangeable, and mixing up which one threatens which half of the tightness argument is an easy way to either over-worry about glideslope or under-worry about pointing.
:::

::: example The instant-by-instant claim, checked directly
The extreme-point argument above makes a claim about one instant: minimising a linear functional $\boldsymbol{\lambda}_v\!\cdot\!\mathbf{T}$ over $\{\|\mathbf{T}\|\le\Gamma\}\cap\{\hat{\mathbf{n}}^\top\mathbf{T}\ge\Gamma\cos\theta_{\max}\}$ lands on $\|\mathbf{T}\|=\Gamma$ even when the pointing constraint is the one holding it there. Check it directly rather than trusting the geometry alone: fix $\hat{\mathbf{n}}=(0,0,1)$, $\theta_{\max}=20°$, and minimise $\boldsymbol{\lambda}_v\!\cdot\!\mathbf{T}$ over that exact set for a costate direction whose unconstrained optimum (ignoring pointing) would sit nowhere near the cone.

| $\Gamma\,(\mathrm{N})$ | $\boldsymbol{\lambda}_v$ direction | angle without pointing | constrained $\|\mathbf{T}^\star\|$ | constrained angle |
| --- | --- | --- | --- | --- |
| $6000$ | $(0.30,-0.10,-0.05)$ | $81.02°$ | $6000.000000$ | $20.000000°$ |
| $8500$ | $(0.60,0.40,-0.20)$ | $74.50°$ | $8500.000000$ | $20.000000°$ |

In both cases, minimising $\boldsymbol{\lambda}_v\!\cdot\!\mathbf{T}$ with no pointing limit would point the thrust $75$–$81°$ from vertical — nowhere close to satisfying a $20°$ cone — so the pointing constraint is genuinely the one deciding the answer, not a spectator. With pointing enforced, the constrained minimiser lands at $\|\mathbf{T}^\star\|=\Gamma$ **exactly**, to every displayed digit, and at exactly $\theta_{\max}=20.000000°$ — on both the sphere and the pointing boundary simultaneously, precisely where the extreme-point argument said the optimum of a ball sliced by a halfspace has to sit. This isolates the claim this lesson is making from everything else a full trajectory solve would also be doing at the same time — dynamics, mass bounds, boundary conditions — and confirms it on its own terms: tightness is not disturbed by an active pointing constraint because the geometry of *where a linear function is minimised on a sliced ball* does not care what sliced it.
:::

## Check yourself

::: check
Why does a limit on total speed, $\|\mathbf{v}\|\le v_{\max}$, count as a second-order cone with $\mathbf{c}=\mathbf{0}$ and $d=v_{\max}$ in the standard-form notation, rather than needing $\mathbf{c}$ to depend on the state?
:::

::: answer
The standard form is $\|\mathbf{A}\mathbf{x}+\mathbf{b}\|_2\le\mathbf{c}^\top\mathbf{x}+d$; here $\mathbf{A}=\mathbf{I}_3$, $\mathbf{b}=\mathbf{0}$ pick out $\mathbf{v}$ as the vector being bounded, and the right-hand side is simply the constant $v_{\max}$ — a linear functional of the decision variables that happens not to use any of them, which is exactly what $\mathbf{c}=\mathbf{0}$, $d=v_{\max}$ means. Nothing requires the right-hand side of a cone constraint to depend on the state; the glideslope cone's right side does depend on altitude precisely because the corridor is meant to widen with height, while a velocity cap's natural shape is a fixed ceiling that does not change with where the vehicle is.
:::

::: check
Redo the extreme-point argument for a pointing constraint that instead required the thrust to point *at least* $\theta_{\min}$ away from a reference direction — a keep-out cone rather than a keep-in one. Does the same argument show tightness survives?
:::

::: answer
No, and the difference shows up at the first step. A keep-in pointing limit intersects the ball with a *halfspace* — a convex set — so the ball-with-a-flat-cut remains convex and the extreme-point fact applies directly. A keep-out limit excludes a cone-shaped region from the ball instead, which is the *complement* of a halfspace intersected with the ball: not convex, for the same reason the annulus was not convex two lessons ago (two points on opposite sides of the excluded cone can have a midpoint back inside it). The extreme-point argument assumes a convex feasible set for $\mathbf{T}$ at each instant; without convexity there is no guarantee the minimiser of a linear function even attains its minimum at a single well-behaved point, let alone one satisfying $\|\mathbf{T}\|=\Gamma$. This is exactly the keep-out case flagged in the module's opening lesson as a genuine, unresolved non-convexity, not a pointing-shaped illusion of one.
:::

::: check
A vehicle's glideslope corridor is set to $\gamma_{gs}=15°$ instead of $25°$. Is this corridor more or less restrictive at a given altitude, and what trade-off does tightening it make against the thrust and mass constraints already built?
:::

::: answer
More restrictive: $\tan(15°)=0.268$ against $\tan(25°)=0.466$, so at any given altitude the allowed horizontal offset shrinks by nearly half. This does not interact with the thrust or mass-bound cones directly — glideslope lives entirely in $\mathbf{r}$-space — but it does interact with what trajectories are reachable at all: a narrower corridor rules out some of the diagonal, sweeping paths a minimum-fuel solve might otherwise prefer, which can only raise the optimal propellant cost or, in the extreme, make the landing-error minimisation from the G-FOLD lesson return a nonzero $d^\star$ where a wider corridor would have returned zero. Every constraint added to this problem can only shrink the feasible set, never enlarge it, so tightening glideslope is a one-directional trade: more safety margin against terrain, paid for in propellant or in reachability, never in neither.
:::

::: check
Explain, without redoing the full argument, why the extreme-point fact used for pointing does not by itself prove tightness — what extra ingredient from the lossless-convexification lesson is still required?
:::

::: answer
The extreme-point argument is purely about geometry at a single instant: it shows that *if* the Hamiltonian's minimiser over the constrained set is attained at all, it is attained on the sphere. It says nothing about *why* the minimiser is not simply $\mathbf{T}=\mathbf{0}$ or some other point where the linear coefficient $\boldsymbol{\lambda}_v$ happens not to matter — that half of the argument still needs $\boldsymbol{\lambda}_v(t)$ to be nonzero on all but an isolated set of instants, which came from the costate's differential equation, not from the shape of the constraint set. Geometry supplies "if the coefficient is nonzero, the minimiser is on the boundary"; the costate analysis supplies "the coefficient is in fact nonzero almost everywhere." Both pieces are needed, and pointing only ever threatened the first one.
:::

::: check
In the worked example, both costate directions were chosen so the *unconstrained* pointing-free optimum sits $75$–$81°$ from vertical, well outside the $20°$ cone. Why was that choice necessary to make the check a genuine test of the claim, rather than choosing $\boldsymbol{\lambda}_v$ so the unconstrained optimum already happened to satisfy pointing?
:::

::: answer
If the unconstrained optimum already sat inside the $20°$ cone, adding the pointing constraint would change nothing — the minimiser over the ball alone already satisfies it, so the pointing halfspace would never bind and the check would only be re-confirming the ordinary, no-pointing tightness result from the lossless-convexification lesson. Choosing $\boldsymbol{\lambda}_v$ so the unconstrained answer is far outside the cone forces the constrained minimiser onto the pointing boundary itself, which is the only way to test whether tightness survives *while pointing is actively deciding the answer* rather than sitting unused in the background. A check that cannot fail to look successful is not a check.
:::

## Summary

| Object | Statement |
| --- | --- |
| Glideslope cone | $\hat{\mathbf{e}}_{\text{up}}^\top(\mathbf{r}-\mathbf{r}_{\text{target}}) \ge \tan\gamma_{gs}\,\|\mathbf{H}(\mathbf{r}-\mathbf{r}_{\text{target}})\|_2$; convex outright, widens linearly with altitude |
| Velocity cap | $\|\mathbf{v}\|_2\le v_{\max}$ (or a horizontal-only version); a cone with constant right-hand side |
| Pointing (keep-in) | $\hat{\mathbf{n}}^\top\mathbf{u}\ge\sigma\cos\theta_{\max}$; linear in $(\mathbf{u},\sigma)$, no relaxation needed on its own |
| The question pointing raises | Does the thrust-bound tightness proof, which minimised over the ball alone, survive an added constraint on the same variable? |
| The geometric answer | Ball $\cap$ halfspace is a spherical cap; every extreme point — curved or flat boundary — lies on $\|\mathbf{T}\|=\Gamma$; tightness survives |
| What pointing does not touch | The costate non-degeneracy half of the argument (affine $\boldsymbol{\lambda}_v$, at most one zero), unaffected since pointing does not enter $\dot{\boldsymbol{\lambda}}_v$ |
| What glideslope does touch | $\dot{\boldsymbol{\lambda}}_r$, once active, which breaks the exact affine form of $\boldsymbol{\lambda}_v(t)$ on that arc — a different threat than pointing's |
| Keep-out pointing | Genuinely non-convex (complement of a halfspace in the ball); not resolved by this lesson's argument |

Two loose ends remain before the 3-DoF convex formulation is complete: flight time, the one parameter this whole construction has quietly held fixed, and what discretising a continuous-time guarantee onto a finite set of nodes actually preserves. The next lesson closes both.
