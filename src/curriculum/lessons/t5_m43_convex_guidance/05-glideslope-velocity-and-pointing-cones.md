---
id: l05-glideslope-velocity-pointing-cones
title: Glideslope, velocity, and pointing as cones
minutes: 21
covers:
  - Glideslope, velocity, and thrust-pointing constraints as cones
---

Think about how you come down a steep sledding hill toward a friend waiting at the bottom. You would not want to skim in sideways along the ground, where you cannot see bumps coming. You would not want to arrive at full speed, either. And you can only lean so far before you tip over. Three limits, none of them about saving energy, all of them about arriving safely.

The fuel-optimal landing this module has built so far knows only about fuel. Nothing yet stops the optimizer from choosing a path that skims in low over terrain it has not seen, arrives faster than the legs can absorb, or tilts the vehicle further than it can safely fly. Real powered-descent guidance adds three more limits — a **glideslope**, a **speed cap** and a **pointing limit** — and this lesson shows that each one is a cone, so the problem stays a second-order cone program.

One of the three also raises a real question. Lesson two proved the thrust relaxation is tight, but that proof treated the thrust bound as the only constraint on the thrust. A pointing limit is a second constraint on the same thrust. So this lesson checks, instead of assuming, that the first proof still holds.

## The glideslope cone

Picture an ice-cream cone standing on its tip, with the tip on the landing site. The vehicle must stay inside it. High up, the cone is wide and the vehicle has lots of sideways room. Near the ground the cone narrows, and the vehicle must come in steeply from above.

That shape does two jobs. It keeps the vehicle above nearby terrain it has not yet flown over. And it keeps the landing site inside the **[[field of view|field-of-view]]** of a downward-looking camera or radar, which is aimed down and cannot see far to the side. The name comes from aircraft landings: a **[[glideslope|glideslope-name]]** is the approach path an airplane follows down to the runway.

To write it down, use three symbols.

- $\hat{\mathbf{e}}_{\text{up}}$ ("e-hat up") is the unit vector pointing straight up. So $\hat{\mathbf{e}}_{\text{up}}^\top(\mathbf{r}-\mathbf{r}_{\text{target}})$ is the height above the target.
- $\mathbf{H}$ is the matrix that keeps only the horizontal part of a vector — the same job $\mathbf{E}$ did for the miss distance in the last lesson. So $\|\mathbf{H}(\mathbf{r}-\mathbf{r}_{\text{target}})\|_2$ is the horizontal distance from the target.
- $\gamma_{gs}$ ("gamma sub g s") is the **glideslope angle**: the smallest angle, measured up from the ground at the target, at which the vehicle may be seen. Standing at the landing site, you would always have to look up at least $\gamma_{gs}$ to see it.

The constraint says the height must be at least $\tan\gamma_{gs}$ times the horizontal distance:

$$
\hat{\mathbf{e}}_{\text{up}}^\top(\mathbf{r}-\mathbf{r}_{\text{target}}) \ge \tan\gamma_{gs}\,\big\|\mathbf{H}(\mathbf{r}-\mathbf{r}_{\text{target}})\big\|_2.
$$

This is already in second-order-cone form: an affine function on the left, a norm times a positive constant on the right. That is the same pattern this module has now met three times — the thrust magnitude, the miss distance, and here. No work is needed to make it convex.

It also does something for free. A norm is never negative, so the right side is never negative, and so the height above the target is never negative wherever the constraint holds. Staying above the landing site's altitude and keeping the site in view both come from one cone.

::: key The two cone constraints of powered descent
**Pointing:** $\hat{\mathbf{n}}^\top\mathbf{u} \ge \sigma\cos\theta_{\max}$, linear in $\mathbf{u}$ and $\sigma$.

**Glideslope:** $\hat{\mathbf{e}}_{\text{up}}^\top(\mathbf{r}-\mathbf{r}_{\text{target}}) \ge \tan\gamma_{gs}\,\|\mathbf{H}(\mathbf{r}-\mathbf{r}_{\text{target}})\|_2$, with $\mathbf{H}$ projecting onto the horizontal — a cone about the landing site that keeps the vehicle above terrain and inside the sensor field of view.
:::

::: warning Which way is the angle measured?
Divide both sides by $\tan\gamma_{gs}$: the horizontal distance may be at most $h/\tan\gamma_{gs}$, where $h$ is the height. So a *larger* $\gamma_{gs}$ means a *narrower*, steeper cone. Some papers instead describe the cone by its half-angle from the vertical, which is $90° - \gamma_{gs}$; then the room is $h\tan(\text{half-angle})$ and a larger angle means a *wider* cone. The two describe the same cone. Mixing them up flips "tighter" and "looser", so always check which angle a formula uses before plugging in a number.
:::

::: example How much room the glideslope leaves
Take $\gamma_{gs}=65°$ — the same cone as a half-angle of $25°$ from vertical. Then $\tan65° = 2.1445$, and the allowed horizontal distance at height $h$ is

$$
\frac{h}{\tan 65°} = 0.4663\,h.
$$

**Step 1: high up.** At $h = 200\,\mathrm{m}$: $0.4663\times200 = 93.26\,\mathrm{m}$ of sideways room.

**Step 2: closer in.** At $h = 20\,\mathrm{m}$: $0.4663\times20 = 9.33\,\mathrm{m}$.

**Step 3: nearly down.** At $h = 5\,\mathrm{m}$: $0.4663\times5 = 2.33\,\mathrm{m}$.

**Sanity check.** Ten times lower, ten times less room: the cone narrows in proportion to height, as a cone should. That is exactly the behavior wanted — generous room to absorb errors early, and a narrow, well-defined final approach when precision matters.
:::

## The speed cap

A speed limit is the simplest cone in the lesson. Touchdown sensors, landing-leg travel and structural loads all have limits the optimizer cannot know about unless told. And a minimum-fuel trajectory has no reason to respect them on its own: saving propellant and arriving gently are different goals that only happen to agree near the very end of a good trajectory.

Write the cap as

$$
\|\mathbf{v}\|_2 \le v_{\max},
$$

or $\|\mathbf{H}\mathbf{v}\|_2 \le v_{\max}$ to limit only the sideways speed. Compare with the second-order-cone standard form from lesson three, $\|\mathbf{A}\mathbf{x}+\mathbf{b}\|_2\le\mathbf{c}^\top\mathbf{x}+d$. Here $\mathbf{A}$ picks $\mathbf{v}$ out of the decision vector, $\mathbf{b}=\mathbf{0}$, and the right side is the fixed number $v_{\max}$: $\mathbf{c}=\mathbf{0}$, $d = v_{\max}$. A cone whose right side is a constant is a ball — a speed limit in every direction at once.

## Thrust pointing, and the question it raises

A vehicle cannot tilt its thrust arbitrarily far from vertical. The body would tip, the engine would point at terrain, or the sensors would lose the ground. So guidance limits the angle between the thrust and a reference direction $\hat{\mathbf{n}}$ ("n-hat", usually straight up) to at most $\theta_{\max}$ ("theta max").

Lesson one met this and showed it is convex once written without dividing by $\|\mathbf{T}\|$: $\hat{\mathbf{n}}^\top\mathbf{T} \ge \|\mathbf{T}\|_2\cos\theta_{\max}$ — "the part of the thrust along $\hat{\mathbf{n}}$ is at least $\cos\theta_{\max}$ of the whole thrust". In this module's relaxed problem, the slack $\Gamma$ stands in for $\|\mathbf{T}\|$, and after lesson three's change of variables the limit becomes

$$
\hat{\mathbf{n}}^\top\mathbf{u} \ge \sigma\cos\theta_{\max}.
$$

This is **linear** in $(\mathbf{u},\sigma)$. Not even a real cone — the simplest convex constraint there is.

Now the question. Lesson two's tightness proof looked at one instant and asked which thrust makes the Hamiltonian smallest. The thrust term there is linear, $\boldsymbol{\lambda}_v\!\cdot\!\mathbf{T}$, and it was minimized over the ball $\|\mathbf{T}\|_2\le\Gamma$. A linear function on a ball is smallest on the ball's surface, so $\|\mathbf{T}^\star\|=\Gamma$. Tight.

With pointing added, $\mathbf{T}$ may no longer range over the whole ball. It is confined to

$$
\{\mathbf{T} : \|\mathbf{T}\|_2\le\Gamma,\ \hat{\mathbf{n}}^\top\mathbf{T}\ge\Gamma\cos\theta_{\max}\}
$$

— a ball with the bottom sliced off by a flat cut. Could the minimum now sit somewhere on the flat cut, strictly *inside* the original ball, where $\|\mathbf{T}\|<\Gamma$? That would break tightness.

Look at the shape. It is a **[[spherical cap|spherical-cap]]**: the top of a ball, bounded by a curved piece of the sphere and a flat circular disk. A useful fact from the optimization module: a linear function on a bounded convex set always reaches its minimum at an **[[extreme point|extreme-point]]** — a corner-like point that is not the midpoint of two other points of the set. That is why linear programs have solutions at vertices. So which points of the cap are extreme?

- Every point on the curved part of the sphere is extreme, and every one has $\|\mathbf{T}\|=\Gamma$.
- A point in the middle of the flat disk is not extreme: it is the midpoint of two other points of the disk. Only the disk's rim is extreme, and the rim is where the disk meets the sphere, so $\|\mathbf{T}\|=\Gamma$ there too.

Every extreme point lies on the sphere. So a minimizer on the sphere always exists, and the tightness conclusion survives.

::: key Pointing does not disturb thrust-bound tightness
Slicing the ball $\|\mathbf{T}\|\le\Gamma$ with the pointing halfspace $\hat{\mathbf{n}}^\top\mathbf{T}\ge\Gamma\cos\theta_{\max}$ leaves a spherical cap whose extreme points — curved surface and rim alike — all satisfy $\|\mathbf{T}\|=\Gamma$. A linear Hamiltonian minimized over the cap still lands on the thrust-bound boundary. [[Açıkmeşe, Carson and Blackmore (2013)|acikmese-2013]] prove the full version for the soft-landing problem with both the thrust bound and pointing present, including the costate conditions the argument also needs.
:::

::: warning One tie to watch for
"A minimum is reached at an extreme point" does not say *only* at extreme points. If $\boldsymbol{\lambda}_v$ points exactly along $+\hat{\mathbf{n}}$, minimizing $\boldsymbol{\lambda}_v\!\cdot\!\mathbf{T}$ means making $\hat{\mathbf{n}}^\top\mathbf{T}$ as small as the cut allows — and then every point of the flat disk ties, including points strictly inside the ball. That is the one way pointing could let a loose slack in. It happens when the costate asks for thrust pointing straight *down*, against $\hat{\mathbf{n}}$. At an isolated instant it does no harm, as in lesson two; the 2013 paper's conditions are what rule it out over a whole stretch of time.
:::

::: warning Glideslope is a different kind of addition from pointing
Glideslope limits $\mathbf{r}$, not $\mathbf{T}$, so it never enters the instant-by-instant thrust minimization at all; the extreme-point argument has nothing to say about it. What glideslope *does* change is the costate. Lesson two used $\dot{\boldsymbol{\lambda}}_r = \mathbf{0}$ and $\dot{\boldsymbol{\lambda}}_v=-\boldsymbol{\lambda}_r$ to show $\boldsymbol{\lambda}_v(t)$ is a straight line in time with at most one zero. Once a constraint on $\mathbf{r}$ is active, $\boldsymbol{\lambda}_r$ is no longer forced to be constant, $\boldsymbol{\lambda}_v$ is no longer exactly a straight line on that stretch, and the "at most one zero" bookkeeping has to be redone stretch by stretch. Pointing threatens the geometry half of the tightness argument; glideslope threatens the costate half. Mixing them up leads to over-worrying about one and under-worrying about the other.
:::

::: example The instant-by-instant claim, checked directly
Take $\hat{\mathbf{n}}=(0,0,1)$ and $\theta_{\max}=20°$, and minimize $\boldsymbol{\lambda}_v\!\cdot\!\mathbf{T}$ over the cap for two costate directions chosen so the pointing limit really decides the answer.

**Step 1: where would the thrust go with no pointing limit?** On the plain ball, the best thrust is $-\Gamma\,\boldsymbol{\lambda}_v/\|\boldsymbol{\lambda}_v\|$, straight against the costate. Its tilt from vertical is $\arccos\!\big(-\lambda_z/\|\boldsymbol{\lambda}_v\|\big)$. For $\boldsymbol{\lambda}_v=(0.30,-0.10,-0.05)$, $\|\boldsymbol{\lambda}_v\| = 0.3202$ and the tilt is $\arccos(0.05/0.3202) = 81.02°$. For $(0.60,0.40,-0.20)$, $\|\boldsymbol{\lambda}_v\|=0.7483$ and the tilt is $\arccos(0.2/0.7483)=74.50°$. Both are far outside a $20°$ cone.

**Step 2: the answer on the cap.** Tilt as far as allowed, $20°$, leaning the horizontal part straight against the costate's horizontal part: $\mathbf{T}^\star = \Gamma\big(\sin20°\,\hat{\mathbf{h}},\ \cos20°\big)$, where $\hat{\mathbf{h}}$ is that horizontal unit direction. Its length is $\Gamma\sqrt{\sin^2 20° + \cos^2 20°} = \Gamma$. It sits on the rim: on the sphere and on the cut at once.

**Step 3: check by brute force.** Scatter $200{,}000$ random points through the ball, keep those inside the cap, and see whether any beats $\mathbf{T}^\star$:

```python
import numpy as np

def best_on_cap(lam, Gamma, theta):
    """Minimise lam . T over ||T|| <= Gamma, T_z >= Gamma cos(theta)."""
    h = -lam[:2] / np.linalg.norm(lam[:2])          # horizontal direction to lean
    T = Gamma * np.array([*(np.sin(theta) * h), np.cos(theta)])
    T_free = -Gamma * lam / np.linalg.norm(lam)     # the answer with no pointing limit
    if T_free[2] >= Gamma * np.cos(theta):          # already inside the cone
        T = T_free
    return T

rng = np.random.default_rng(1)
theta = np.radians(20)
for lam, Gamma in [((0.30, -0.10, -0.05), 6000.0), ((0.60, 0.40, -0.20), 8500.0)]:
    lam = np.array(lam)
    T = best_on_cap(lam, Gamma, theta)
    # brute force: 200,000 random points inside the cap
    P = rng.normal(size=(200_000, 3))
    P *= Gamma * rng.random((200_000, 1)) ** (1 / 3) / np.linalg.norm(P, axis=1, keepdims=True)
    P = P[P[:, 2] >= Gamma * np.cos(theta)]
    free = np.degrees(np.arccos(-lam[2] / np.linalg.norm(lam)))
    print(f"free tilt {free:.2f} deg | |T*| = {np.linalg.norm(T):.1f} N, "
          f"tilt {np.degrees(np.arccos(T[2] / np.linalg.norm(T))):.2f} deg | "
          f"any sample better? {bool((P @ lam < lam @ T).any())}")
# free tilt 81.02 deg | |T*| = 6000.0 N, tilt 20.00 deg | any sample better? False
# free tilt 74.50 deg | |T*| = 8500.0 N, tilt 20.00 deg | any sample better? False
```

**Sanity check.** In both cases the pointing limit is the one deciding the answer — without it the thrust would lean $75$–$81°$ — and still the best thrust has full length $\Gamma$. No random point inside the cap does better. The geometry of where a linear function is smallest on a sliced ball does not care what did the slicing.
:::

::: example A whole landing with both limits active
The check above was one instant. Now solve a full trajectory: lesson two's lander, from $\mathbf{r}_0=(1200,400,1500)\,\mathrm{m}$, $\mathbf{v}_0=(-40,10,-70)\,\mathrm{m/s}$, $N=30$ steps of $2\,\mathrm{s}$. The start is seen from the target at an elevation of $\arctan\!\big(1500/\sqrt{1200^2+400^2}\big) = 49.86°$.

**Step 1: no extra limits.** $240.382\,\mathrm{kg}$ of propellant, as in lesson two. The thrust never tilts more than $12.89°$ from vertical.

**Step 2: add a $48°$ glideslope.** The propellant rises to $244.209\,\mathrm{kg}$. The cone is active at two nodes, and to stay inside it the vehicle now tilts its thrust up to $28.30°$.

**Step 3: add a $25°$ pointing limit as well.** The propellant rises a little more, to $244.303\,\mathrm{kg}$. Now both limits are active at two nodes each: the thrust sits exactly at $25.00°$ there.

**Step 4: the check this lesson is about.** Across all $30$ nodes, $\sigma_k - \|\mathbf{u}_k\|$ is below $3\times10^{-11}$ — tight to solver precision, with glideslope and pointing both pressing on the trajectory.

**Sanity check.** Each added limit can only shrink the set of allowed trajectories, so the propellant can only go up: $240.382 \to 244.209 \to 244.303$. It does. And tightening further eventually leaves no trajectory at all: a $49°$ glideslope, or a $20°$ pointing limit on top of the $48°$ glideslope, makes the problem infeasible.
:::

## Check yourself

::: check
Why does a limit on total speed, $\|\mathbf{v}\|_2\le v_{\max}$, count as a second-order cone with $\mathbf{c}=\mathbf{0}$ and $d=v_{\max}$, instead of needing a right side that depends on the state?
:::

::: answer
The standard form is $\|\mathbf{A}\mathbf{x}+\mathbf{b}\|_2\le\mathbf{c}^\top\mathbf{x}+d$. Here $\mathbf{A}$ picks $\mathbf{v}$ out of the decision vector and $\mathbf{b}=\mathbf{0}$, so the left side is the speed. The right side is the constant $v_{\max}$: a linear function of the decision variables that happens to use none of them, which is exactly what $\mathbf{c}=\mathbf{0}$, $d=v_{\max}$ says. Nothing requires a cone's right side to depend on the state. The glideslope's right side does depend on height, because that corridor is meant to widen as the vehicle climbs. A speed cap is naturally a fixed ceiling that does not care where the vehicle is.
:::

::: check
Redo the extreme-point argument for a limit that instead requires the thrust to point *at least* $\theta_{\min}$ away from some direction — a **[[keep-out cone|keep-out]]** instead of a keep-in one. Does the same argument show tightness survives?
:::

::: answer
No, and it fails at the first step. A keep-in limit cuts the ball with a *halfspace*, which is convex, so the cap is convex and the extreme-point fact applies. A keep-out limit removes a cone-shaped region from the ball instead. What is left is not convex, for the same reason the annulus in lesson one was not: two allowed thrusts on opposite sides of the forbidden cone can have a midpoint inside it. The extreme-point argument assumes a convex set of allowed thrusts at each instant, and without convexity the problem is not even a convex program. This keep-out case — keeping the plume off something, for example — is exactly the one this module's opening lesson flagged as a genuine non-convexity.
:::

::: check
A vehicle's glideslope angle is raised from $\gamma_{gs}=65°$ to $75°$. Is the corridor more or less restrictive at a given height, and what does tightening it cost?
:::

::: answer
More restrictive. The allowed sideways room at height $h$ is $h/\tan\gamma_{gs}$: $0.466\,h$ at $65°$ and $0.268\,h$ at $75°$, so the room shrinks by about $43\,\%$. Glideslope lives entirely in position, so it does not touch the thrust or mass cones directly. But it does limit which trajectories are possible: a narrower corridor rules out some of the sweeping, diagonal paths a minimum-fuel solve would prefer. That can only raise the propellant, as the worked landing showed ($240.382$ to $244.209\,\mathrm{kg}$ for a $48°$ glideslope). In the extreme, it can make G-FOLD's stage 1 return a nonzero $d^\star$ where a wider corridor gave zero. Adding a constraint only ever shrinks the feasible set, so the trade is one-way: more margin against terrain, paid for in propellant or in reachable landing sites.
:::

::: check
The extreme-point fact alone does not prove tightness. What extra ingredient from lesson two is still needed, and does pointing threaten it?
:::

::: answer
The extreme-point argument is geometry at one instant. It says that *if* the coefficient $\boldsymbol{\lambda}_v$ is not zero, a best thrust lies on the sphere. It says nothing when $\boldsymbol{\lambda}_v = \mathbf{0}$: then every thrust gives the same value, including $\mathbf{T} = \mathbf{0}$, and nothing forces the slack to be tight. The other half of lesson two's argument showed $\boldsymbol{\lambda}_v(t)$ is nonzero except at isolated instants, using the costate equations $\dot{\boldsymbol{\lambda}}_r = \mathbf{0}$, $\dot{\boldsymbol{\lambda}}_v = -\boldsymbol{\lambda}_r$. Pointing constrains only the thrust, so it does not enter those equations and leaves that half alone. Geometry supplies "nonzero coefficient means the boundary"; the costate analysis supplies "the coefficient is nonzero almost always". Both are needed, and pointing only ever threatened the first.
:::

::: check
In the instant-by-instant example, both costate directions were chosen so the best thrust with no pointing limit leans $75$–$81°$, far outside the $20°$ cone. Why was that choice needed for the check to mean anything?
:::

::: answer
If the unconstrained best thrust already sat inside the cone, adding the pointing limit would change nothing. The limit would never press on the answer, and the check would only repeat lesson two's no-pointing result. Choosing costates whose free answer is far outside the cone forces the best thrust onto the pointing cut itself. That is the only way to test whether tightness survives *while pointing is deciding the answer*. A check that cannot fail is not a check.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Glideslope cone | $\hat{\mathbf{e}}_{\text{up}}^\top(\mathbf{r}-\mathbf{r}_{\text{target}}) \ge \tan\gamma_{gs}\,\|\mathbf{H}(\mathbf{r}-\mathbf{r}_{\text{target}})\|_2$; convex as written; room $h/\tan\gamma_{gs}$ grows with height |
| Angle convention | $\gamma_{gs}$ measured up from the ground; the half-angle from vertical is $90°-\gamma_{gs}$ |
| Speed cap | $\|\mathbf{v}\|_2\le v_{\max}$ (or $\|\mathbf{H}\mathbf{v}\|_2 \le v_{\max}$); a cone with $\mathbf{c}=\mathbf{0}$, $d=v_{\max}$ |
| Pointing (keep-in) | $\hat{\mathbf{n}}^\top\mathbf{u}\ge\sigma\cos\theta_{\max}$; linear in $(\mathbf{u},\sigma)$ |
| The question | Does tightness survive a second constraint on the thrust? |
| The answer | Ball cut by a halfspace is a spherical cap; every extreme point has $\|\mathbf{T}\|=\Gamma$; tightness survives |
| The tie | If $\boldsymbol{\lambda}_v$ points along $+\hat{\mathbf{n}}$, the flat disk ties; harmless at isolated instants |
| Glideslope's threat | Makes $\boldsymbol{\lambda}_r$ non-constant on active stretches, so $\boldsymbol{\lambda}_v$ is no longer a straight line there |
| Keep-out pointing | Not convex; not covered by this argument |
| Worked landing | $240.382 \to 244.209$ ($48°$ glideslope) $\to 244.303\,\mathrm{kg}$ (plus $25°$ pointing); gap below $3\times10^{-11}$ |

Two loose ends remain before the 3-DoF convex formulation is complete: the flight time, the one number this whole construction has held fixed, and what chopping a continuous-time guarantee into a finite set of nodes really keeps. The next lesson closes both.

::: context field-of-view What a sensor can see
A camera or radar sees only a cone of directions around where it points, called its **field of view**. A landing radar or a terrain camera looks down past the lander's feet. If the vehicle drifted far sideways at low height, the landing site would slide out of that cone and the sensor would lose it — at the very moment it matters most. The glideslope keeps the site near the middle of the picture all the way down.
:::

::: context glideslope-name Borrowed from airplanes
Airliners landing in bad weather follow radio beams to the runway. One beam, the *glide slope*, marks a path descending at about $3°$ — a shallow ramp, because an airliner glides in from far away. A planetary lander's glideslope cone is the same idea turned into a bowl around the landing site, and much steeper, because a lander comes down nearly vertically in its final seconds. The side view shows the lesson's $65°$ cone: the vehicle must stay in the shaded region.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="180,160 110.1,10 249.9,10" fill="#8fb8f0" opacity="0.6"/>
  <line x1="180" y1="160" x2="110.1" y2="10" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="160" x2="249.9" y2="10" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="20" y1="160" x2="340" y2="160" stroke="#1f2a44" stroke-width="2"/>
  <path d="M 222.3 160 A 42.3 42.3 0 0 0 197.9 121.7" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="228" y="140" font-size="12" fill="#b4232c">65°</text>
  <circle cx="180" cy="160" r="4" fill="#1f2a44"/>
  <text x="180" y="175" font-size="11" text-anchor="middle" fill="#1f2a44">landing site</text>
  <text x="180" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">allowed</text>
  <text x="60" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">too low</text>
  <text x="300" y="100" font-size="11" text-anchor="middle" fill="#6c7a93">too low</text>
</svg>
```
:::

::: context spherical-cap A ball with a slice cut off
Cut an orange with one straight knife stroke, and the smaller piece is a **spherical cap**: a curved skin on one side and a flat circle on the other. In the lesson the "orange" is the ball of allowed thrusts, and the knife is the pointing limit. The curved skin is where the thrust has full length $\Gamma$. The flat face is where the thrust is tilted exactly $\theta_{\max}$ — but only its rim touches the skin.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="110" r="80" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M 152.6 34.8 A 80 80 0 0 1 207.4 34.8 Z" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="152.6" y1="34.8" x2="207.4" y2="34.8" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="152.6" cy="34.8" r="3.5" fill="#1f2a44"/>
  <circle cx="207.4" cy="34.8" r="3.5" fill="#1f2a44"/>
  <line x1="180" y1="110" x2="207.4" y2="34.8" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="110" x2="180" y2="20" stroke="#6c7a93" stroke-width="1"/>
  <text x="214" y="30" font-size="11" fill="#1f2a44">rim: tilt 20°, length Γ</text>
  <text x="180" y="52" font-size="11" text-anchor="middle" fill="#b4232c">flat cut</text>
  <text x="188" y="125" font-size="11" fill="#1f2a44">T = 0</text>
  <text x="262" y="160" font-size="11" fill="#6c7a93">ball |T| ≤ Γ</text>
</svg>
```

The picture is a side view with a $20°$ limit, drawn to scale: the rim is $20°$ from the vertical line through the center.
:::

::: context extreme-point Corners of a shape
An **extreme point** of a convex shape is a point that is not the midpoint of any two other points of the shape. For a square, the extreme points are its four corners. For a disk, every point of the rim is extreme and no interior point is. Slide a ruler across a shape from any direction, and the first point it touches includes an extreme point. That is why a linear cost, which is like a tilted ruler, always has a best point among the corners.
:::

::: context acikmese-2013 The paper that closed the pointing question
Behçet Açıkmeşe, John Carson and Lars Blackmore, who had worked together on landing guidance at JPL, published "Lossless Convexification of Nonconvex Control Bound and Pointing Constraints of the Soft Landing Optimal Control Problem" in *IEEE Transactions on Control Systems Technology* in 2013. It extends the 2007 result to the thrust bound and a pointing limit together, and states precisely when the relaxation is still exact. This module's resource list singles it out as the cleanest statement of the tightness conditions.
:::

::: context keep-out Where keep-out cones come from
Some real limits are keep-out, not keep-in. A lander should not fire its plume at a sensor, a solar panel or a nearby lander, and a spacecraft may need to keep a camera from pointing at the Sun. Each says "stay *outside* this cone". Those limits are not convex, and they are handled by other tools: later in this module, successive convexification and state-triggered constraints take on constraints the lossless tricks cannot reach.
:::
