---
id: l07-b-plane-targeting
title: B-plane targeting
minutes: 19
covers:
  - B-plane targeting
---

A rendezvous burn from the last two lessons has a natural aim point: a position and a time, both fixed and both meaningful to hit precisely. A planetary flyby is different. A spacecraft arriving at Mars, Jupiter, or an asteroid on a hyperbolic approach is not trying to arrive at an exact place at an exact instant the way a rendezvous does — it is trying to control how *close* it passes, and in what geometric sense, to a body it will never actually touch, sweeping past in hours while carrying the enormous heliocentric velocity of an interplanetary trajectory. Aiming that kind of approach in ordinary position coordinates turns out to be a poorly chosen coordinate system for the job; the B-plane is the one flight projects actually use, and this lesson derives why.

## The incoming asymptote and the impact parameter

Far from the target body — where its gravity is negligible compared to the spacecraft's residual speed — the approach trajectory looks like a straight line traversed at the hyperbolic excess velocity $\mathbf{v}_\infty$, the same quantity from the impulsive-transfer module that measures how much speed is "left over" after escaping the departure body. As the spacecraft gets close enough for the target's gravity to matter, that straight line curves into a hyperbola, with the target at the near focus. The impact parameter $b$ is the perpendicular distance from the target's centre to the straight-line asymptote the incoming trajectory would have followed with no gravity at all — equivalently, how far off-centre the "aim" is before gravity bends the path in.

$b$ and the periapsis radius $r_p$ the flyby actually achieves are tied together by energy and angular momentum, both conserved along the hyperbola. At the target's centre of mass, angular momentum is $h = r_p v_p$ (velocity purely tangential at periapsis); far away, $h = b\,v_\infty$ (at large distance, the velocity is $\mathbf{v}_\infty$ along the asymptote, and $b$ is exactly the perpendicular lever arm to it). Setting these equal, $b\,v_\infty = r_p v_p$. Vis-viva at periapsis, using $1/a = -v_\infty^2/\mu$ from the specific energy $v_\infty^2/2 = -\mu/2a$,

$$
v_p^2 = \mu\left(\frac{2}{r_p}-\frac{1}{a}\right) = \frac{2\mu}{r_p} + v_\infty^2 .
$$

Substituting into $h^2 = (bv_\infty)^2 = (r_pv_p)^2 = r_p^2\big(2\mu/r_p+v_\infty^2\big)$:

$$
b^2v_\infty^2 = 2\mu r_p + r_p^2 v_\infty^2 \quad\Longrightarrow\quad b^2 = r_p^2 + \frac{2\mu r_p}{v_\infty^2} .
$$

::: key Impact parameter and periapsis radius
$$
b = r_p\sqrt{1+\frac{2\mu}{r_p v_\infty^2}} .
$$
A required periapsis radius $r_p$, together with the approach speed $v_\infty$ (set by the interplanetary trajectory, not by the flyby itself), determines the aim distance $b$ that produces it.
:::

::: example How far off-centre to aim for a $300\,\mathrm{km}$ Earth flyby
For an Earth flyby with $v_\infty = 5\,\mathrm{km/s}$ and a desired periapsis altitude of $300\,\mathrm{km}$ ($r_p = 6378.137+300 = 6678.137\,\mathrm{km}$),
$$
b = 6678.137\sqrt{1+\frac{2\times398\,600.4418}{6678.137\times5^2}} = 16\,048.37\,\mathrm{km} .
$$
Check: $v_p = \sqrt{v_\infty^2+2\mu/r_p} = 12.0156\,\mathrm{km/s}$, so $h=r_pv_p = 80\,241.85\,\mathrm{km^2/s}$, and independently $b\,v_\infty = 16\,048.37\times5 = 80\,241.85\,\mathrm{km^2/s}$ — the same number, confirming the derivation. This orbit has $a=-\mu/v_\infty^2=-15\,944.02\,\mathrm{km}$ and eccentricity $e=1-r_p/a=1.4188$, a properly hyperbolic flyby, as any nonzero-$v_\infty$ encounter must be.
:::

::: example How sensitive is periapsis to a change in aim?
Differentiating $b^2=r_p^2+2\mu r_p/v_\infty^2$ with respect to $r_p$ (holding $v_\infty$ fixed) gives $2b\,db = \big(2r_p+2\mu/v_\infty^2\big)\,dr_p$, so
$$
\frac{db}{dr_p} = \frac{r_p+\mu/v_\infty^2}{b} = \frac{6678.137+398\,600.4418/25}{16\,048.37} = 1.4096 .
$$
A finite-difference check ($r_p\pm1\,\mathrm{m}$) confirms the same value to nine significant figures. So, near this geometry, moving the desired periapsis by $1\,\mathrm{km}$ requires moving the aim point $b$ by about $1.41\,\mathrm{km}$ — a smooth, close-to-linear, one-to-one-ish relationship with no hidden blow-up anywhere nearby, unlike the near-$180°$ Lambert geometry examined earlier in this module. That good behaviour is one reason $b$, not $r_p$ directly, is the number flight teams actually solve targeting problems in.
:::

## The B-plane and its coordinates

$b$ alone fixes only the *distance* off-centre, not the direction. The full aim point is a vector, and the natural place to describe it is the plane through the target's centre, perpendicular to the incoming asymptote direction $\hat{\mathbf{v}}_\infty$ — the plane the (gravity-free) straight-line approach would pierce. This is the B-plane, and the **B**-vector is the vector from the target's centre to that piercing point; by construction $\mathbf{B}\perp\hat{\mathbf{v}}_\infty$ and $\lVert\mathbf{B}\rVert=b$.

To give $\mathbf{B}$ numerical coordinates, fix an orthonormal basis of the B-plane. The standard convention (after Kizner, and used throughout JPL mission design) builds it from $\hat{\mathbf{v}}_\infty$ and a fixed reference pole $\hat{\mathbf{K}}$ (commonly the target body's north pole, or the ecliptic normal):

$$
\hat{\mathbf{S}} = \hat{\mathbf{v}}_\infty, \qquad \hat{\mathbf{T}} = \frac{\hat{\mathbf{S}}\times\hat{\mathbf{K}}}{\lVert\hat{\mathbf{S}}\times\hat{\mathbf{K}}\rVert}, \qquad \hat{\mathbf{R}} = \hat{\mathbf{S}}\times\hat{\mathbf{T}} ,
$$

an orthonormal right-handed triad. Since $\mathbf{B}\perp\hat{\mathbf{S}}$ by definition, $\mathbf{B}$ lies entirely in the $\hat{\mathbf{T}}$–$\hat{\mathbf{R}}$ plane, and its two coordinates there, $B\cdot T \equiv \mathbf{B}\cdot\hat{\mathbf{T}}$ and $B\cdot R\equiv\mathbf{B}\cdot\hat{\mathbf{R}}$, are the numbers a targeting solution actually reports and controls.

::: example Building the B-plane basis and reading off coordinates
Take an approach with $\hat{\mathbf{v}}_\infty = (0.8,0.6,0)$ (already a unit vector) and reference pole $\hat{\mathbf{K}}=(0,0,1)$ (the equatorial pole). Then $\hat{\mathbf{T}} = \hat{\mathbf{S}}\times\hat{\mathbf{K}}/\lVert\cdot\rVert = (0.6,-0.8,0)$ and $\hat{\mathbf{R}}=\hat{\mathbf{S}}\times\hat{\mathbf{T}} = (0,0,-1)$ — orthonormal to $\hat{\mathbf{S}}$ and to each other, by direct check of the dot products.

For a desired aim with $b=16\,048.37\,\mathrm{km}$ (the $300\,\mathrm{km}$-periapsis case above) placed at angle $35°$ around the B-plane from $\hat{\mathbf{R}}$ toward $\hat{\mathbf{T}}$,
$$
\mathbf{B} = b\big(\cos35°\,\hat{\mathbf{R}}+\sin35°\,\hat{\mathbf{T}}\big) = (5522.98,\,-7363.97,\,-13\,146.06)\,\mathrm{km} ,
$$
with $B\cdot T = 9204.967\,\mathrm{km}$ and $B\cdot R = 13\,146.055\,\mathrm{km}$ — and $\sqrt{(B\cdot T)^2+(B\cdot R)^2} = 16\,048.370\,\mathrm{km}$, recovering $b$ exactly, as it must since $\hat{\mathbf{T}},\hat{\mathbf{R}}$ span the B-plane $\mathbf{B}$ lives in.
:::

## Why target in $B\cdot T$, $B\cdot R$ rather than position and time

The reason this coordinate choice is not merely a convention is conditioning, in the same sense the near-$180°$ lesson used the word. The full state at closest approach depends on both *where* the spacecraft is and *when* it gets there, and those two things are not equally controllable: a trajectory correction manoeuvre changes the departure velocity by a small amount, and — as this module's closing lesson on trajectory correction will make quantitative — that change maps into a large, hard-to-predict shift in *arrival time* over an interplanetary flight of many months, because time-of-arrival depends on the along-track component of the trajectory accumulating over the entire cruise. It maps into a comparatively small, well-behaved shift in the *geometry* of closest approach, because $\hat{\mathbf{S}}$, $b$, and the B-plane coordinates depend on the asymptotic direction and impact parameter, quantities set predominantly by the *local* geometry of the final approach rather than by exactly when the spacecraft happens to cross it.

B-plane coordinates isolate exactly the part of the miss that a flyby mission actually cares about — the geometry of the encounter, which fixes the bend angle, the science observation geometry, or the gravity-assist outcome — from the part that is comparatively expensive and imprecise to control finely and, for most flyby objectives, barely matters: the precise arrival time. Targeting in $B\cdot T$, $B\cdot R$ means a trajectory-correction burn only has to move two well-conditioned numbers, not fight the same sensitivity problem that a raw position-and-time target would inherit from the long, nearly-uncontrolled drift of the timing component.

::: warning The B-plane is centred on the target, not on the spacecraft's launch geometry
$\hat{\mathbf{S}}=\hat{\mathbf{v}}_\infty$ is the *asymptotic* approach direction at the target, not the departure direction at Earth, and the reference pole $\hat{\mathbf{K}}$ is a property of the target body's frame (or a chosen inertial reference), not of the launch. Reusing a B-plane basis built for one flyby target at a different body, or forgetting to update $\hat{\mathbf{v}}_\infty$ between a Lambert solve's arrival velocity and the actual planet-relative approach velocity (which requires subtracting the target's own velocity, exactly as the porkchop-plot lesson's $v_\infty$ calculation does), silently rotates the whole coordinate system and invalidates any $B\cdot T$, $B\cdot R$ computed in it.
:::

## Check yourself

::: check
Derive, from $h=bv_\infty$ and $h=r_pv_p$, why $b>r_p$ always for a hyperbolic flyby with $v_\infty>0$.
:::

::: answer
From $bv_\infty=r_pv_p$, $b/r_p = v_p/v_\infty$. Since $v_p^2 = v_\infty^2+2\mu/r_p > v_\infty^2$ (the periapsis speed always exceeds the excess speed, because gravity has accelerated the spacecraft on the way in), $v_p>v_\infty$, so $b/r_p>1$, i.e. $b>r_p$. The impact parameter is always larger than the periapsis distance it produces, because gravity bends the trajectory in from where it would have passed with no attraction at all.
:::

::: check
A mission wants to fly by a body with essentially zero mass (negligible $\mu$). What does $b=r_p\sqrt{1+2\mu/(r_pv_\infty^2)}$ reduce to in that limit, and does this make physical sense?
:::

::: answer
As $\mu\to0$, $b\to r_p$: with no gravitational attraction, the trajectory does not bend at all, so the closest approach distance is exactly the same as the straight-line offset it started with. This matches the physical picture directly — the impact parameter *is* the periapsis distance when there is no gravity to pull the path in closer.
:::

::: check
Explain why $\mathbf{B}$ lies entirely in the plane spanned by $\hat{\mathbf{T}}$ and $\hat{\mathbf{R}}$, with no component along $\hat{\mathbf{S}}$.
:::

::: answer
The B-plane is defined as the plane through the target's centre perpendicular to $\hat{\mathbf{S}}=\hat{\mathbf{v}}_\infty$, and $\mathbf{B}$ is defined as the vector from the centre to the point where the (straight-line) incoming asymptote pierces that plane — by construction, a vector lying in a plane perpendicular to $\hat{\mathbf{S}}$ has zero component along $\hat{\mathbf{S}}$. Since $\{\hat{\mathbf{S}},\hat{\mathbf{T}},\hat{\mathbf{R}}\}$ is an orthonormal basis, any vector with zero $\hat{\mathbf{S}}$-component is fully described by its $\hat{\mathbf{T}}$ and $\hat{\mathbf{R}}$ components alone.
:::

::: check
Why is targeting a flyby's arrival *time* precisely typically much harder than targeting its B-plane coordinates precisely, for the same size of trajectory-correction burn?
:::

::: answer
Arrival time depends on the along-track position error accumulated over the entire interplanetary cruise, which grows roughly in proportion to how long the error has had to act (the same leverage effect this module's trajectory-correction-manoeuvre lesson quantifies with the state transition matrix) — a tiny velocity error early in a months-long cruise can shift the arrival time by a comparatively large amount. The B-plane coordinates, by contrast, are set mainly by the local approach geometry near the target and are far less sensitive to exactly when the spacecraft arrives, so the same size of correction burn moves $B\cdot T$ and $B\cdot R$ by a much smaller, more predictable amount than it moves arrival time.
:::

::: check
For the $35°$ worked example above, verify (without recomputing $\hat{\mathbf{T}},\hat{\mathbf{R}}$ from scratch) that $B\cdot T$ and $B\cdot R$ correctly reconstruct $b$, and explain why this check works regardless of which direction $\hat{\mathbf{K}}$ was chosen.
:::

::: answer
$\sqrt{(B\cdot T)^2+(B\cdot R)^2} = \sqrt{9204.967^2+13\,146.055^2} = 16\,048.370\,\mathrm{km} = b$, matching exactly. This check works for any valid choice of reference pole $\hat{\mathbf{K}}$ (as long as it is not parallel to $\hat{\mathbf{S}}$, which would make $\hat{\mathbf{T}}$ undefined) because $\hat{\mathbf{T}}$ and $\hat{\mathbf{R}}$ are always orthonormal and span the same B-plane regardless of which reference pole generated them — different choices of $\hat{\mathbf{K}}$ rotate $\hat{\mathbf{T}}$ and $\hat{\mathbf{R}}$ within the B-plane and change the individual $B\cdot T$, $B\cdot R$ values, but never change $\lVert\mathbf{B}\rVert=b$ itself.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{v}_\infty$, $\hat{\mathbf{S}}=\hat{\mathbf{v}}_\infty$ | Hyperbolic excess velocity and incoming asymptote direction |
| $b = r_p\sqrt{1+2\mu/(r_pv_\infty^2)}$ | Impact parameter from desired periapsis and fixed $v_\infty$ |
| $db/dr_p = (r_p+\mu/v_\infty^2)/b$ | Well-conditioned, smooth sensitivity — no blow-up nearby |
| B-plane | Plane through target centre, $\perp\hat{\mathbf{S}}$ |
| $\hat{\mathbf{T}}=\hat{\mathbf{S}}\times\hat{\mathbf{K}}/\lVert\cdot\rVert$, $\hat{\mathbf{R}}=\hat{\mathbf{S}}\times\hat{\mathbf{T}}$ | Standard right-handed B-plane basis from a reference pole $\hat{\mathbf{K}}$ |
| $B\cdot T$, $B\cdot R$ | The two numbers a flyby is actually targeted in; $\sqrt{(B\cdot T)^2+(B\cdot R)^2}=b$ |
| Why B-plane, not position+time | Decouples the well-conditioned encounter geometry from the poorly conditioned arrival-time component |

The next lesson builds the tool that turns many individual Lambert solves — one per candidate departure and arrival date — into the map a mission actually chooses a launch window from: the porkchop plot, with $v_\infty$ (and hence the B-plane's own $\hat{\mathbf{S}}$) read directly off its grid.
