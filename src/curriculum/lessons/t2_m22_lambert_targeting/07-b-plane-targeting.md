---
id: l07-b-plane-targeting
title: B-plane targeting
minutes: 22
covers:
  - B-plane targeting
---

Roll a marble across a table toward a strong magnet, but not straight at it. Far away the marble runs in a straight line. As it gets close, the magnet pulls it, the path curves, and the marble swings past and heads off in a new direction. How close it comes, and which way it leaves, depend almost entirely on one thing you chose at the start: how far to one side of the magnet you aimed.

A spacecraft flying past a planet is that marble. For the last two lessons the goal was a **rendezvous**: be at one exact place at one exact time. A **flyby** is different. A probe racing past Mars, Jupiter or an asteroid is not trying to touch a point. It wants to pass at a chosen distance, on a chosen side, so that the planet bends its path by the right amount — for science pictures, for a gravity assist, or to line up for landing.

Flight teams do not aim these flybys in ordinary position coordinates. They use a special flat target called the **B-plane**, and two numbers on it, $B\cdot T$ and $B\cdot R$. This lesson builds that target from scratch and shows why it is the right one to aim at.

## Coming in from far away

Far from the planet, its gravity is tiny compared with the spacecraft's speed, so the path is almost a straight line. The spacecraft moves along it at the **hyperbolic excess velocity** $\mathbf{v}_\infty$ ("v infinity") — its velocity relative to the planet, measured while it is still far away. You met $\mathbf{v}_\infty$ in the impulsive-transfer module as the speed "left over" after escaping a planet. Here it is the speed the spacecraft arrives with, and it is fixed by the interplanetary trajectory, not by the flyby.

That far-away straight line is the **[[incoming asymptote|asymptote-word]]** — the line the path gets closer and closer to the farther back you look. Close in, gravity bends the path into a **hyperbola**, an open curve with the planet at its inner focus.

Now imagine switching gravity off. The spacecraft would keep going along the asymptote and miss the planet's center by some distance. That miss distance is the **[[impact parameter|impact-parameter-picture]]** $b$: the perpendicular distance from the planet's center to the incoming asymptote. It is how far off-center you aimed, before gravity had its say.

The distance the spacecraft actually reaches at closest approach is the **periapsis radius** $r_p$ ("r sub p"), measured from the planet's center.

## How far off-center gives which closest approach

Gravity pulls the path inward, so the real closest approach $r_p$ is smaller than the aim distance $b$. Two quantities stay constant along the whole flyby, and together they tie $b$ to $r_p$ exactly.

**Angular momentum.** For each kilogram of spacecraft, angular momentum is $h$ = speed × the sideways distance to the planet's center, the **[[lever arm|lever-arm]]**.

- Far away, the speed is $v_\infty$ and the lever arm is $b$, so $h = b\,v_\infty$.
- At periapsis the velocity points exactly sideways, so the lever arm is the whole distance $r_p$ and $h = r_p v_p$, where $v_p$ is the speed at periapsis.

Setting the two equal gives $b\,v_\infty = r_p v_p$.

**Energy.** The energy per kilogram of a hyperbola is $v_\infty^2/2 = -\mu/2a$, where $\mu$ ("mu") is the planet's gravitational parameter and $a$ is the semi-major axis (negative for a hyperbola). So $1/a = -v_\infty^2/\mu$. Putting that into the vis-viva equation at periapsis gives the periapsis speed:

$$
v_p^2 = \mu\left(\frac{2}{r_p}-\frac{1}{a}\right) = \frac{2\mu}{r_p} + v_\infty^2 .
$$

In words: the spacecraft arrives with $v_\infty^2$ and falls down the gravity well, picking up an extra $2\mu/r_p$.

Now square the angular-momentum equation and put in $v_p^2$:

$$
b^2v_\infty^2 = r_p^2 v_p^2 = r_p^2\left(\frac{2\mu}{r_p}+v_\infty^2\right) = 2\mu r_p + r_p^2 v_\infty^2 .
$$

Divide both sides by $v_\infty^2$:

$$
b^2 = r_p^2 + \frac{2\mu r_p}{v_\infty^2} .
$$

::: key Impact parameter and periapsis radius
$$
b = r_p\sqrt{1+\frac{2\mu}{r_p v_\infty^2}} .
$$
A required periapsis radius $r_p$, together with the approach speed $v_\infty$ (set by the interplanetary trajectory, not by the flyby itself), determines the aim distance $b$ that produces it.
:::

The square root is always bigger than $1$, so $b > r_p$: you must aim wider than the distance you want to pass at, because gravity will pull you in. Slow arrivals get pulled in more. That effect is called **[[gravitational focusing|gravitational-focusing]]**.

::: example How far off-center to aim for a 300 km Earth flyby
A spacecraft arrives at Earth with $v_\infty = 5\,\mathrm{km/s}$ and wants to pass $300\,\mathrm{km}$ above the surface. Earth's radius is $6378.137\,\mathrm{km}$ and $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$.

**Step 1: periapsis radius.** Add the altitude to Earth's radius: $r_p = 6378.137 + 300 = 6678.137\,\mathrm{km}$.

**Step 2: the number under the root.**

$$
\frac{2\mu}{r_p v_\infty^2} = \frac{2 \times 398\,600.4418}{6678.137 \times 25} = 4.775 .
$$

**Step 3: the aim distance.**

$$
b = 6678.137\sqrt{1 + 4.775} = 16\,048.37\,\mathrm{km} .
$$

So you aim about $16\,000\,\mathrm{km}$ off-center to pass only $6678\,\mathrm{km}$ from the center. Gravity does the rest.

**Check with angular momentum.** The periapsis speed is $v_p = \sqrt{25 + 2\mu/r_p} = 12.0156\,\mathrm{km/s}$, so $h = r_p v_p = 80\,241.85\,\mathrm{km^2/s}$. Independently, $b\,v_\infty = 16\,048.37 \times 5 = 80\,241.85\,\mathrm{km^2/s}$. The same number both ways, so the formula holds together.

**Is it really a hyperbola?** The semi-major axis is $a = -\mu/v_\infty^2 = -15\,944.02\,\mathrm{km}$ and the eccentricity is $e = 1 - r_p/a = 1.4188$. That is more than $1$, a proper hyperbola — as any flyby with $v_\infty > 0$ must be. The path is bent through a **[[turn angle|turn-angle]]** of about $90°$.
:::

::: example How sensitive is periapsis to a change in aim?
Suppose the team wants periapsis a little higher or lower. How much must the aim move?

Take the small change ("differential") of $b^2 = r_p^2 + 2\mu r_p/v_\infty^2$, holding $v_\infty$ fixed. The left side changes by $2b\,db$. The right side changes by $(2r_p + 2\mu/v_\infty^2)\,dr_p$. Divide by $2b\,dr_p$:

$$
\frac{db}{dr_p} = \frac{r_p+\mu/v_\infty^2}{b} = \frac{6678.137 + 398\,600.4418/25}{16\,048.37} = \frac{6678.137 + 15\,944.02}{16\,048.37} = 1.4096 .
$$

A finite-difference check (move $r_p$ by $\pm 1\,\mathrm{m}$ and recompute $b$) gives the same value to nine significant figures.

So near this geometry, raising periapsis by $1\,\mathrm{km}$ means moving the aim out by about $1.41\,\mathrm{km}$. The relationship is smooth, with no blow-up anywhere nearby — very unlike the near-$180°$ Lambert geometry from earlier in this module.
:::

## The B-plane and its coordinates

The number $b$ says how far off-center you aim, but not in which direction. Passing $300\,\mathrm{km}$ over the north pole and $300\,\mathrm{km}$ over the equator are very different flybys. So the full aim point is an arrow, not a number.

Picture a huge dartboard held up in front of the planet, facing the incoming spacecraft, with the planet's center at the bullseye. The straight gravity-free path would punch through that board at one spot. That board is the **B-plane**: the plane through the target's center, perpendicular to the incoming asymptote. The arrow from the bullseye to the spot where the path punches through is the **B-vector** $\mathbf{B}$. Its length is the impact parameter, $\lVert\mathbf{B}\rVert = b$, and because it lies in the board, it is perpendicular to the direction of approach.

To give $\mathbf{B}$ two numbers, draw two axes on the board. The standard recipe, introduced by **[[William Kizner|kizner]]** at JPL and used in mission design ever since, uses three unit vectors ("hat" means a unit vector, length $1$; read $\hat{\mathbf{S}}$ as "S hat"):

- $\hat{\mathbf{S}} = \hat{\mathbf{v}}_\infty$ points along the incoming asymptote — straight into the board.
- $\hat{\mathbf{K}}$ is a fixed **reference pole** you choose — commonly the target planet's north pole, or the direction perpendicular to Earth's orbital plane (the ecliptic).
- From those two, build the board's axes:

$$
\hat{\mathbf{S}} = \hat{\mathbf{v}}_\infty, \qquad \hat{\mathbf{T}} = \frac{\hat{\mathbf{S}}\times\hat{\mathbf{K}}}{\lVert\hat{\mathbf{S}}\times\hat{\mathbf{K}}\rVert}, \qquad \hat{\mathbf{R}} = \hat{\mathbf{S}}\times\hat{\mathbf{T}} .
$$

A cross product is perpendicular to both of its inputs. So $\hat{\mathbf{T}}$ is perpendicular to $\hat{\mathbf{S}}$ (it lies in the board) and to the pole (so it runs "sideways", parallel to the planet's equator when $\hat{\mathbf{K}}$ is the pole). Dividing by the length makes it a unit vector. Then $\hat{\mathbf{R}}$ is perpendicular to both $\hat{\mathbf{S}}$ and $\hat{\mathbf{T}}$, so it also lies in the board, at right angles to $\hat{\mathbf{T}}$. With a north pole as $\hat{\mathbf{K}}$, $\hat{\mathbf{R}}$ points roughly "south" across the board.

The three vectors are an **[[orthonormal|orthonormal-word]]**, right-handed set. Since $\mathbf{B}$ has nothing along $\hat{\mathbf{S}}$, its two components on the board say everything about it:

$$
B\cdot T \equiv \mathbf{B}\cdot\hat{\mathbf{T}}, \qquad B\cdot R \equiv \mathbf{B}\cdot\hat{\mathbf{R}} .
$$

Read them "B dot T" and "B dot R". They are the numbers a targeting solution reports and controls. Because the two axes are at right angles, Pythagoras gives back the aim distance: $\sqrt{(B\cdot T)^2 + (B\cdot R)^2} = b$.

::: key The B-plane
The B-plane is the plane through the target body center perpendicular to the incoming asymptote $\mathbf{v}_\infty$. The aim point is described by $B\cdot R$ and $B\cdot T$, which behave almost linearly with respect to a correction manoeuvre — which is why interplanetary targeting is done there rather than in position space.
:::

::: example Building the B-plane axes and reading off coordinates
A spacecraft approaches with $\hat{\mathbf{v}}_\infty = (0.8,\,0.6,\,0)$. That is already a unit vector, because $0.8^2 + 0.6^2 = 1$. Use the equatorial pole $\hat{\mathbf{K}} = (0,0,1)$.

**Step 1: $\hat{\mathbf{T}}$.** The cross product is $\hat{\mathbf{S}}\times\hat{\mathbf{K}} = (0.6\cdot1 - 0\cdot0,\; 0\cdot0 - 0.8\cdot1,\; 0) = (0.6,\,-0.8,\,0)$. Its length is $1$, so $\hat{\mathbf{T}} = (0.6,\,-0.8,\,0)$.

**Step 2: $\hat{\mathbf{R}}$.** $\hat{\mathbf{S}}\times\hat{\mathbf{T}} = (0.6\cdot0 - 0\cdot(-0.8),\; 0\cdot0.6 - 0.8\cdot0,\; 0.8\cdot(-0.8) - 0.6\cdot0.6) = (0,\,0,\,-1)$.

**Check.** $\hat{\mathbf{S}}\cdot\hat{\mathbf{T}} = 0.48 - 0.48 = 0$, $\hat{\mathbf{S}}\cdot\hat{\mathbf{R}} = 0$, $\hat{\mathbf{T}}\cdot\hat{\mathbf{R}} = 0$. All at right angles, as they must be.

**Step 3: place the aim.** Use the $300\,\mathrm{km}$ flyby from before, $b = 16\,048.37\,\mathrm{km}$, and put the aim point $35°$ around the board from $\hat{\mathbf{R}}$ toward $\hat{\mathbf{T}}$:

$$
\mathbf{B} = b\big(\cos35°\,\hat{\mathbf{R}}+\sin35°\,\hat{\mathbf{T}}\big) = (5522.98,\,-7363.97,\,-13\,146.06)\,\mathrm{km} .
$$

**Step 4: the coordinates.** Dotting with each axis gives $B\cdot T = 9204.967\,\mathrm{km}$ and $B\cdot R = 13\,146.055\,\mathrm{km}$.

**Check.** $\sqrt{9204.967^2 + 13\,146.055^2} = 16\,048.370\,\mathrm{km}$, which is $b$ exactly. It has to be, because $\hat{\mathbf{T}}$ and $\hat{\mathbf{R}}$ span the board that $\mathbf{B}$ lives in.
:::

## Why flight teams aim in the B-plane

Between launch and arrival, a probe fixes its path with small **trajectory correction manoeuvres**, the burns of the last lesson in this module. Each one is a Newton step, exactly like differential correction: predict the miss, use the sensitivity matrix to find the $\Delta v$ that removes it, burn, repeat. A Newton step works beautifully when the thing you are aiming at responds to the burn almost in a straight line, and badly when it bends.

**The B-plane coordinates respond almost in a straight line.** The B-plane is built from the far-away, straight part of the approach. A small burn weeks out slides that straight line sideways by an amount proportional to the burn. So $B\cdot T$ and $B\cdot R$ move in proportion to $\Delta v$, and one Newton step lands almost exactly on target.

**Periapsis quantities bend.** Closest approach sits deep in the curved part of the path, where gravity is strongest. The periapsis distance depends on the aim through the curve $b^2 = r_p^2 + 2\mu r_p/v_\infty^2$, which is [[not a straight line|curve-vs-line]]. And the location of periapsis swings around the planet as the aim changes, because a closer pass is bent through a bigger angle. A targeter working directly in periapsis position is chasing a moving, curving target.

::: example How straight is the line?
Stay with the $300\,\mathrm{km}$ Earth flyby, $b_0 = 16\,048.37\,\mathrm{km}$, $r_{p0} = 6678.137\,\mathrm{km}$. Solving the key formula for $r_p$ gives $r_p = -\mu/v_\infty^2 + \sqrt{(\mu/v_\infty^2)^2 + b^2}$. Its slope at the nominal aim is $dr_p/db = 1/1.4096 = 0.7094$.

Move the aim inward by $1000\,\mathrm{km}$, to $b = 15\,048.37\,\mathrm{km}$:

- the straight-line prediction is $r_p = 6678.137 - 0.7094 \times 1000 = 5968.7\,\mathrm{km}$;
- the exact curve gives $5980.1\,\mathrm{km}$, a difference of $11\,\mathrm{km}$.

Move it inward by $5000\,\mathrm{km}$ and the straight-line guess is off by $323\,\mathrm{km}$. The curve bends, so a Newton step on $r_p$ overshoots or undershoots and has to be repeated.

Notice one more thing. Both of those new periapses are below Earth's radius of $6378\,\mathrm{km}$: the spacecraft would hit the ground. Aiming at $b = 15\,622.6\,\mathrm{km}$ grazes the surface. The whole difference between a safe $300\,\mathrm{km}$ pass and a crash is only $426\,\mathrm{km}$ of aim in the B-plane — which is why flight teams watch that number so closely.

A $1000\,\mathrm{km}$ shift of aim in the B-plane, meanwhile, moves $B\cdot T$ and $B\cdot R$ by exactly $1000\,\mathrm{km}$ between them. No curve at all.
:::

**Time gets its own separate number.** The B-plane also splits *where* you pass from *when* you pass. Arrival time is the least certain part of a long cruise, because a tiny error in speed along the path adds up over months into a large error along the path. The last lesson of this module measures this with real numbers and finds the uncertainty stretched into a long cigar pointing along the direction of travel. Along-the-path error is along $\hat{\mathbf{S}}$, which is exactly the direction the B-plane leaves out. Teams usually control arrival time as a third, separate target with looser tolerance, since most flyby goals — the bend angle, the gravity-assist result, the viewing geometry — depend on where the spacecraft passes, not on the exact second it passes.

So targeting in $B\cdot T$ and $B\cdot R$ means each correction burn moves two well-behaved numbers that respond in a straight line, and the badly behaved timing is kept out of the way.

::: warning The B-plane belongs to the target, not the launch
$\hat{\mathbf{S}} = \hat{\mathbf{v}}_\infty$ is the approach direction *at the target*, measured relative to the target. It is not the departure direction at Earth. A Lambert solve around the Sun gives the arrival velocity relative to the Sun; you must subtract the target planet's own velocity to get $\mathbf{v}_\infty$, exactly as the porkchop-plot lesson does. The reference pole $\hat{\mathbf{K}}$ belongs to the target body's frame (or a chosen inertial frame), not to the launch. Reusing a basis built for one target at another body, or forgetting to subtract the planet's velocity, silently rotates the whole board and makes every $B\cdot T$ and $B\cdot R$ computed on it wrong.
:::

## Check yourself

::: check
Starting from $h = bv_\infty$ and $h = r_pv_p$, show that $b > r_p$ always, for any hyperbolic flyby with $v_\infty > 0$.
:::

::: answer
Set the two expressions for $h$ equal: $bv_\infty = r_pv_p$, so $b/r_p = v_p/v_\infty$.

From energy, $v_p^2 = v_\infty^2 + 2\mu/r_p$. The extra term $2\mu/r_p$ is positive, so $v_p^2 > v_\infty^2$ and $v_p > v_\infty$: gravity has sped the spacecraft up on the way in.

So $b/r_p > 1$, which means $b > r_p$. The aim distance is always larger than the periapsis it produces, because gravity bends the path inward from where it would have passed with no attraction.
:::

::: check
A mission flies past a body with almost no mass ($\mu$ close to zero). What does $b = r_p\sqrt{1+2\mu/(r_pv_\infty^2)}$ become, and does that make physical sense?
:::

::: answer
As $\mu \to 0$, the term $2\mu/(r_pv_\infty^2) \to 0$, the square root becomes $\sqrt{1} = 1$, and $b \to r_p$.

That is what you would expect. With no gravity, the path does not bend, so the closest approach is the same as the straight-line offset it started with. The impact parameter *is* the periapsis distance when nothing pulls the path in.
:::

::: check
Explain why $\mathbf{B}$ lies entirely in the plane of $\hat{\mathbf{T}}$ and $\hat{\mathbf{R}}$, with no component along $\hat{\mathbf{S}}$.
:::

::: answer
The B-plane is defined as the plane through the target's center perpendicular to $\hat{\mathbf{S}} = \hat{\mathbf{v}}_\infty$. $\mathbf{B}$ runs from the center to the point where the straight incoming asymptote pierces that plane, so it lies in the plane. Any arrow lying in a plane perpendicular to $\hat{\mathbf{S}}$ has zero component along $\hat{\mathbf{S}}$.

Since $\{\hat{\mathbf{S}},\hat{\mathbf{T}},\hat{\mathbf{R}}\}$ are three mutually perpendicular unit vectors, any arrow with no $\hat{\mathbf{S}}$ part is fully described by its $\hat{\mathbf{T}}$ and $\hat{\mathbf{R}}$ parts alone.
:::

::: check
For the same size of correction burn, why is it much harder to pin down a flyby's arrival *time* precisely than its B-plane coordinates?
:::

::: answer
Arrival time depends on the error along the direction of travel, and that error builds up over the whole cruise. A tiny speed error early in a months-long flight grows roughly in proportion to the time it has to act, so it shifts the arrival time by a large amount. The last lesson of this module shows this with the state transition matrix: the uncertainty stretches into a long cigar along the path.

The B-plane coordinates are set by where the straight approach line sits sideways, not by how far along it the spacecraft has got, and they respond almost in a straight line to a burn. So the same burn moves $B\cdot T$ and $B\cdot R$ by a small, predictable amount, while the along-path timing stays the loosest part of the miss. That is why teams target the B-plane tightly and handle arrival time as a separate, looser target.
:::

::: check
For the $35°$ example, check that $B\cdot T$ and $B\cdot R$ rebuild $b$, without recomputing $\hat{\mathbf{T}}$ and $\hat{\mathbf{R}}$. Why does this check work whatever reference pole $\hat{\mathbf{K}}$ was chosen?
:::

::: answer
$\sqrt{9204.967^2 + 13\,146.055^2} = 16\,048.370\,\mathrm{km} = b$. It matches.

It works for any allowed $\hat{\mathbf{K}}$ (any pole not parallel to $\hat{\mathbf{S}}$, which would make the cross product zero and $\hat{\mathbf{T}}$ undefined). Whatever pole you pick, $\hat{\mathbf{T}}$ and $\hat{\mathbf{R}}$ are two perpendicular unit vectors lying in the same B-plane. A different pole only turns the pair of axes around within the plane. That changes the individual values of $B\cdot T$ and $B\cdot R$, but never the length $\lVert\mathbf{B}\rVert = b$ — turning a ruler does not change the length of what it measures.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{v}_\infty$, $\hat{\mathbf{S}}=\hat{\mathbf{v}}_\infty$ | Hyperbolic excess velocity and incoming asymptote direction |
| $b$ | Impact parameter: perpendicular distance from target center to the incoming asymptote |
| $h = bv_\infty = r_pv_p$ | Angular momentum, far away and at periapsis |
| $b = r_p\sqrt{1+2\mu/(r_pv_\infty^2)}$ | Aim distance for a desired periapsis; always $b > r_p$ |
| $db/dr_p = (r_p+\mu/v_\infty^2)/b$ | Smooth sensitivity, about $1.41$ for the $300\,\mathrm{km}$, $5\,\mathrm{km/s}$ Earth flyby |
| B-plane | Plane through the target center, perpendicular to $\hat{\mathbf{S}}$ |
| $\hat{\mathbf{T}}=\hat{\mathbf{S}}\times\hat{\mathbf{K}}/\lVert\cdot\rVert$, $\hat{\mathbf{R}}=\hat{\mathbf{S}}\times\hat{\mathbf{T}}$ | Standard right-handed B-plane axes from a reference pole $\hat{\mathbf{K}}$ |
| $B\cdot T$, $B\cdot R$ | The two numbers a flyby is targeted in; $\sqrt{(B\cdot T)^2+(B\cdot R)^2}=b$ |
| Why the B-plane | Its coordinates respond almost linearly to a correction burn, and it separates the geometry from the poorly known arrival time |

The next lesson steps back to choosing the trip itself. Solving Lambert once for every pair of departure and arrival dates gives the porkchop plot — the map a mission picks its launch window from — and the arrival $v_\infty$ read off that map is the one that sets this lesson's $\hat{\mathbf{S}}$.

::: context asymptote-word A line you approach but never reach
An **asymptote** is a straight line that a curve gets closer and closer to without ever quite touching. The word comes from Greek for "not falling together". A hyperbola has two: one for the incoming leg and one for the outgoing leg. Far from the planet, the spacecraft's path is so close to its asymptote that navigators treat it as a straight line — which is exactly what makes the B-plane possible.
:::

::: context impact-parameter-picture Aim distance versus closest approach
The name comes from physics experiments that fire particles at atoms, where it measures how far off a head-on hit a particle was aimed. Below it is drawn to scale for the $300\,\mathrm{km}$ Earth flyby at $v_\infty = 5\,\mathrm{km/s}$: the aim line (dashed) passes $16\,048\,\mathrm{km}$ from Earth's center, but gravity pulls the real path (blue) in to $6678\,\mathrm{km}$ and bends it through about $90°$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="4" y1="43" x2="356" y2="43" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="6 4"/>
  <line x1="60" y1="150" x2="225" y2="150" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <circle cx="225" cy="150" r="42.5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="225" cy="150" r="2.5" fill="#1f2a44"/>
  <path d="M4.8,60.4 L57.3,63.8 L93.6,66.9 L120.5,70.0 L140.9,72.8 L157.3,75.6 L170.5,78.3 L181.7,81.0 L191.1,83.5 L199.3,86.0 L206.4,88.4 L212.8,90.9 L218.5,93.3 L223.7,95.7 L228.3,98.0 L232.6,100.4 L236.7,102.9 L240.4,105.3 L243.9,107.8 L247.2,110.3 L250.4,112.9 L253.4,115.5 L256.2,118.3 L259.0,121.1 L261.7,124.1 L264.3,127.2 L266.9,130.5 L269.4,134.0 L271.8,137.6 L274.3,141.6 L276.7,145.9 L279.1,150.5 L281.5,155.6 L284.0,161.3 L286.4,167.5 L288.9,174.6 L291.5,182.6 L294.1,191.9 L296.7,202.8 L299.5,215.9" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="225" y1="150" x2="256.4" y2="118.4" stroke="#b4232c" stroke-width="2"/>
  <line x1="40" y1="46" x2="40" y2="147" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="40,43 36,51 44,51" fill="#1f2a44"/>
  <polygon points="40,150 36,142 44,142" fill="#1f2a44"/>
  <text x="46" y="105" font-size="12" fill="#1f2a44">b = 16 048 km</text>
  <text x="262" y="113" font-size="12" fill="#b4232c">r_p = 6678 km</text>
  <text x="200" y="34" font-size="11" fill="#6c7a93">no-gravity aim line</text>
  <text x="304" y="200" font-size="11" fill="#1d6fd1">real path</text>
  <text x="225" y="175" font-size="11" fill="#1f2a44" text-anchor="middle">Earth</text>
</svg>
```
:::

::: context lever-arm Why far away h equals b times v-infinity
Push a door near its hinge and it barely turns. Push at the handle, far from the hinge, and it swings easily. What matters is not the distance to the hinge, but the sideways distance from the hinge to the line you push along — the **lever arm**. Angular momentum works the same way. Far out, the spacecraft moves along a straight line, and the sideways distance from the planet's center to that line is $b$ everywhere along it. So $h = b\,v_\infty$, even when the spacecraft is millions of kilometers away.
:::

::: context gravitational-focusing Gravity makes a planet a bigger target
In the example, aiming anywhere closer than $b = 15\,623\,\mathrm{km}$ from Earth's center means hitting Earth, even though Earth's radius is only $6378\,\mathrm{km}$. To an incoming spacecraft at $5\,\mathrm{km/s}$, Earth behaves like a target about $2.4$ times wider than it looks. Slower arrivals are bent more, so the effect grows as $v_\infty$ shrinks: at $1\,\mathrm{km/s}$ the aim for the same $300\,\mathrm{km}$ pass is about $73\,000\,\mathrm{km}$ out. Astronomers use the same idea when they estimate how often asteroids strike planets.
:::

::: context turn-angle How much the flyby bends the path
The angle between the incoming and outgoing asymptotes is the **turn angle**, $\delta = 2\arcsin(1/e)$. For $e = 1.4188$ it is $89.6°$, so this flyby turns the spacecraft almost a right angle. Aim a little closer ($b$ smaller, $e$ smaller) and it turns more; aim wider and it turns less. Turning the $v_\infty$ arrow without changing its length is exactly how a **gravity assist** changes a spacecraft's speed around the Sun — the trick Voyager used to tour the outer planets.
:::

::: context kizner Where the B-plane came from
William Kizner, at NASA's Jet Propulsion Laboratory, described miss distances for lunar and planetary trajectories this way in a 1961 paper, in the first years of deep-space flight. The idea was to replace a messy three-dimensional closest-approach point with a flat target whose coordinates respond almost in a straight line. It stuck. Today JPL navigation teams still report each flyby and landing approach as a point and an uncertainty ellipse drawn on the B-plane.
:::

::: context orthonormal-word Three arrows at right angles, each of length one
**Ortho** means "at right angles" and **normal** here means "length one". An orthonormal set is like the corner of a room: three edges, each perpendicular to the other two, each measured as one unit. **Right-handed** means that if you curl the fingers of your right hand from the first arrow to the second, your thumb points along the third. With such a set, any arrow's parts along the three directions can be found by dot products alone.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="60" r="10" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="150" cy="60" r="2.5" fill="#1f2a44"/>
  <line x1="150" y1="60" x2="300" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="306,60 296,55 296,65" fill="#1f2a44"/>
  <line x1="150" y1="60" x2="150" y2="190" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="150,196 145,186 155,186" fill="#1f2a44"/>
  <line x1="150" y1="60" x2="242" y2="191.5" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="242" cy="191.5" r="3.5" fill="#1d6fd1"/>
  <line x1="242" y1="191.5" x2="242" y2="60" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="242" y1="191.5" x2="150" y2="191.5" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="312" y="64" font-size="13" fill="#1f2a44">T</text>
  <text x="130" y="194" font-size="13" fill="#1f2a44">R</text>
  <text x="110" y="45" font-size="11" fill="#1f2a44">S into page</text>
  <text x="206" y="116" font-size="12" fill="#1d6fd1">B</text>
  <text x="244" y="50" font-size="11" fill="#6c7a93">B·T = 9205 km</text>
  <text x="156" y="183" font-size="11" fill="#6c7a93">B·R = 13 146 km</text>
  <text x="170" y="92" font-size="11" fill="#1f2a44">35°</text>
</svg>
```

Drawn for the worked example: the B-plane seen from the approaching spacecraft, with $\hat{\mathbf{S}}$ pointing into the page and $\mathbf{B}$ at $35°$ from $\hat{\mathbf{R}}$ toward $\hat{\mathbf{T}}$.
:::

::: context curve-vs-line A straight line on the board, a curve at periapsis
Periapsis radius as a function of aim distance, for the $5\,\mathrm{km/s}$ Earth flyby. The curve is $r_p = -\mu/v_\infty^2 + \sqrt{(\mu/v_\infty^2)^2 + b^2}$; the dashed line is its tangent at the $300\,\mathrm{km}$ aim. A Newton step follows the dashed line, so the farther the correction, the more it misses. Below the red line the spacecraft hits Earth.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="190" x2="345" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="190" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="99.6" x2="345" y2="99.6" stroke="#b4232c" stroke-width="1.2"/>
  <text x="56" y="94" font-size="11" fill="#b4232c">Earth surface</text>
  <path d="M50.0,190.0 L62.1,189.6 L74.2,188.2 L86.2,186.0 L98.3,183.0 L110.4,179.2 L122.5,174.5 L134.6,169.2 L146.7,163.2 L158.8,156.5 L170.8,149.2 L182.9,141.5 L195.0,133.2 L207.1,124.4 L219.2,115.3 L231.2,105.8 L243.3,95.9 L255.4,85.7 L267.5,75.2 L279.6,64.5 L291.7,53.5 L303.8,42.3 L315.8,31.0 L327.9,19.4" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="158.8" y1="166.2" x2="340" y2="15.5" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="5 4"/>
  <circle cx="243.9" cy="95.4" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="204">0</text><text x="122.5" y="204">6000</text><text x="195" y="204">12 000</text><text x="267.5" y="204">18 000</text><text x="340" y="204">24 000</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="46" y="137">4000</text><text x="46" y="80">8000</text><text x="46" y="24">12 000</text>
  </g>
  <text x="200" y="175" font-size="11" fill="#1f2a44">aim b (km)</text>
  <text x="58" y="30" font-size="11" fill="#1f2a44">r_p (km)</text>
</svg>
```
:::
