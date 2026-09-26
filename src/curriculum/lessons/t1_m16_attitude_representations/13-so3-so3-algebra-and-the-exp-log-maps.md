---
id: l13-so3-so3-algebra-and-the-exp-log-maps
title: Introduction to SO(3), so(3) and the exp and log maps
minutes: 24
covers:
  - 'introduction to SO(3), so(3) and the exp/log maps'
---

The Earth is round, but the map of your town is flat. For a walk to the store, the flat map is perfect: "three blocks north, then two east" adds up like arrows on paper. For a flight from New York to Tokyo, the flat map lies: distances stretch, straight lines bend, and the order of your turns matters. The globe is the truth. The flat map is a very good local picture of it.

Rotations work exactly the same way. All possible attitudes form a curved space, called $SO(3)$. Tiny rotations and spin rates live in a flat space, called $so(3)$, that touches $SO(3)$ the way your town map touches the globe. And one map — the **exponential map** — carries the flat picture onto the curved one, the way you would wrap a sheet of paper onto a ball.

Seen this way, separate-looking facts from this module become one. Rodrigues' formula is a power series in disguise. The attitude kinematic equation of module 14 is a statement about the flat space. The rotation-vector error of lesson 12 is a flat map of the curved space. And the double cover of lesson 07 is a property of the space's shape that also explains why Euler angles must have a singularity.

You can write correct attitude software without this language. You need it to read modern work on error-state filters, geometric control and camera-plus-gyro navigation. We stay with $SO(3)$ and $so(3)$, and compute everything we claim.

## $SO(3)$ is a Lie group

Lesson 01 defined the set of all valid rotation matrices:

$$
SO(3) = \{\mathbf{C}\in\mathbb{R}^{3\times 3} : \mathbf{C}^\top\mathbf{C} = \mathbf{I}_3,\ \det\mathbf{C} = +1\}.
$$

Read it as "the $3\times 3$ real matrices whose transpose times themselves is the identity, and whose determinant is plus one." The name stands for "special orthogonal group in 3 dimensions." It is a **group**: multiply two rotations and you get a rotation, every rotation has an inverse (its transpose), and the identity $\mathbf{I}_3$ does nothing.

It is also a **[[smooth manifold|manifold]]** — a space that looks flat up close, like the Earth's surface under your feet. Near any rotation, the nearby rotations look like a small piece of ordinary 3-D space, $\mathbb{R}^3$. And multiplying and inverting are smooth: nudge the inputs a little and the output moves a little. A group that is also a smooth manifold, with smooth multiplication and inversion, is a **[[Lie group|sophus-lie]]** (say "Lee").

Four properties, all met earlier in the module, describe its shape.

- **Dimension 3.** Nine entries, minus six independent rules from $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$, leaves three freedoms (lesson 01).
- **[[Compact|compact]].** Every entry is a direction cosine, so it lies between $-1$ and $1$, and the set includes its own edges. So attitudes never run off to infinity — unlike position, and unlike the Gibbs vector of lesson 09.
- **Connected.** You can reach any rotation from the identity by turning up an angle smoothly. That is Euler's theorem (lesson 04), read as a statement about paths.
- **Not simply connected.** A $360^\circ$ rotation traced out is a loop that cannot be shrunk to a point without leaving $SO(3)$. A $720^\circ$ loop can be — the **[[plate trick|plate-trick]]**. Exactly two kinds of loop exist, and that is the double cover of lesson 07: $SO(3)$ is the **[[real projective space|rp3]]** $\mathbb{RP}^3$, covered twice by the sphere of unit quaternions $S^3$.

Compactness alone is why no set of three numbers can describe every attitude without a singularity. Every three-parameter set pays the bill somewhere: gimbal lock for Euler angles, $\Phi = 180^\circ$ for the Gibbs vector, $\Phi = 360^\circ$ for modified Rodrigues parameters.

::: note Why it has to be true
A perfect three-number description would be a **chart**: a one-to-one, continuous map from an open region of $\mathbb{R}^3$ onto all of $SO(3)$, whose inverse is also continuous. Suppose one existed.

A continuous map sends a compact set to a compact set. The inverse map is continuous, and it would send all of $SO(3)$, which is compact, onto the open region. So the open region would be compact.

But in $\mathbb{R}^3$ a set is compact only if it is closed and bounded. A nonempty open region that is also closed has no edge at all, so it must be all of $\mathbb{R}^3$, which is not bounded. Contradiction. So every three-number description must fail to be one-to-one somewhere, or have a point where its inverse breaks — a singularity. No clever formula can dodge this.
:::

## $so(3)$: the tangent space at the identity

Picture a train on a curved track. Its velocity always points along the straight line that just touches the track — the **tangent**, flat even though the track curves. The collection of all possible velocities at one point is the **tangent space**.

Do the same for rotations. Take a smooth path of attitudes $\mathbf{C}(t)$ that passes through the identity at $t = 0$, so $\mathbf{C}(0) = \mathbf{I}_3$. Every point on it obeys $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$. Differentiate that rule with the product rule (a dot means "rate of change"), then set $t = 0$ where $\mathbf{C} = \mathbf{I}_3$:

$$
\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3
\ \Longrightarrow\
\dot{\mathbf{C}}^\top\mathbf{C} + \mathbf{C}^\top\dot{\mathbf{C}} = \mathbf{0}
\ \xrightarrow{\ t=0\ }\
\dot{\mathbf{C}}(0)^\top + \dot{\mathbf{C}}(0) = \mathbf{0}.
$$

The right side is zero because $\mathbf{I}_3$ never changes. So every velocity through the identity is a **skew-symmetric** matrix: flipping it across its diagonal changes its sign. That set,

$$
so(3) = \{\,\mathbf{S}\in\mathbb{R}^{3\times 3} : \mathbf{S}^\top = -\mathbf{S}\,\},
$$

is the **Lie algebra** of $SO(3)$, written with small letters. It is a flat, three-dimensional space: add two skew matrices or scale one and you get another. Its natural building blocks are the three cross-product matrices $[\hat{\mathbf{x}}\times]$, $[\hat{\mathbf{y}}\times]$, $[\hat{\mathbf{z}}\times]$.

Three-dimensional and flat means it is really just $\mathbb{R}^3$ in costume. The **hat map** swaps between them: an arrow $\boldsymbol{\phi}$ ("phi") becomes the matrix $[\boldsymbol{\phi}\times]$ that does "cross with $\boldsymbol{\phi}$." You have used it since module 14. Going back, the **vee map** reads the arrow out of a skew matrix: $\mathrm{vee}(\mathbf{S}) = (S_{32},\ S_{13},\ S_{21})$.

What makes $so(3)$ an *algebra*, not just a flat space, is a way to combine two elements: the **commutator** $\mathbf{A}\mathbf{B} - \mathbf{B}\mathbf{A}$, which measures how much order matters. Under the hat map it is the cross product:

$$
[\mathbf{a}\times][\mathbf{b}\times] - [\mathbf{b}\times][\mathbf{a}\times] = \bigl[(\mathbf{a}\times\mathbf{b})\times\bigr].
$$

Over $300$ random pairs, the two sides agree exactly. Every cross-product fact in this course is secretly a fact about $so(3)$.

Two more identities do most of the algebra below. For a unit arrow $\hat{\mathbf{u}}$ ("u-hat"), both check out to $5.6\times 10^{-17}$:

$$
[\hat{\mathbf{u}}\times]^2 = \hat{\mathbf{u}}\hat{\mathbf{u}}^\top - \mathbf{I}_3,
\qquad
[\hat{\mathbf{u}}\times]^3 = -[\hat{\mathbf{u}}\times].
$$

The first says: crossing with $\hat{\mathbf{u}}$ twice kills the part of an arrow along $\hat{\mathbf{u}}$ and flips the rest. The second follows from the first, as the first Check yourself question shows.

### Angular velocity lives in the flat space

Away from the identity, the same differentiation shows that $\mathbf{C}^\top\dot{\mathbf{C}}$ is skew. That is module 14's kinematic equation, $\dot{\mathbf{C}}_{N\leftarrow B} = \mathbf{C}_{N\leftarrow B}[\boldsymbol{\omega}^B\times]$, read backwards. So **angular velocity is an element of $so(3)$**: the velocity of the attitude, carried back to the identity by the group multiplication.

This is why angular velocities add as arrows while finite rotations do not. Adding is legal on the flat map and meaningless on the curved globe.

::: key SO(3) and so(3)
$SO(3)$ is a compact, connected, three-dimensional Lie group that is not simply connected — $S^3$ covers it twice. Its Lie algebra $so(3)$ is the space of $3\times 3$ skew-symmetric matrices, isomorphic to $\mathbb{R}^3$ under $\boldsymbol{\phi}\mapsto[\boldsymbol{\phi}\times]$, with the commutator corresponding to the cross product. Angular velocity lives in $so(3)$; attitude lives in $SO(3)$.
:::

## The exponential map

Suppose you spin at a steady rate for one second. The spin is a flat thing, an arrow $\boldsymbol{\phi}$ in $so(3)$. Where you end up is a curved thing, a rotation in $SO(3)$. The rule that takes you from one to the other is the matrix exponential:

$$
\exp: so(3)\to SO(3),
\qquad
\exp(\mathbf{S}) = \sum_{n=0}^{\infty}\frac{\mathbf{S}^n}{n!} = \mathbf{I}_3 + \mathbf{S} + \frac{\mathbf{S}^2}{2!} + \frac{\mathbf{S}^3}{3!} + \cdots
$$

The $\sum$ ("sigma") means "add up all the terms," and $n!$ is **[[n factorial|factorial]]**. It is the same series as $e^x = 1 + x + x^2/2! + \cdots$, with a matrix in place of $x$.

Write $\mathbf{S} = [\boldsymbol{\phi}\times]$, where $\boldsymbol{\phi} = \Phi\hat{\mathbf{u}}$ is the **rotation vector**: its direction $\hat{\mathbf{u}}$ is the axis, its length $\Phi$ is the angle in radians. Let $\mathbf{K} = [\hat{\mathbf{u}}\times]$, so $\mathbf{S} = \Phi\mathbf{K}$.

Now the identity $\mathbf{K}^3 = -\mathbf{K}$ collapses the infinite series. The powers of $\mathbf{K}$ repeat every four steps:

$$
\mathbf{K},\ \ \mathbf{K}^2,\ \ \mathbf{K}^3 = -\mathbf{K},\ \ \mathbf{K}^4 = -\mathbf{K}^2,\ \ \mathbf{K}^5 = \mathbf{K},\ \dots
$$

So every term is a number times $\mathbf{K}$ or a number times $\mathbf{K}^2$. Gather the odd powers onto $\mathbf{K}$ and the even ones onto $\mathbf{K}^2$:

$$
\exp(\Phi\mathbf{K}) = \mathbf{I}_3
+ \Bigl(\Phi - \frac{\Phi^3}{3!} + \frac{\Phi^5}{5!} - \cdots\Bigr)\mathbf{K}
+ \Bigl(\frac{\Phi^2}{2!} - \frac{\Phi^4}{4!} + \frac{\Phi^6}{6!} - \cdots\Bigr)\mathbf{K}^2 .
$$

The first bracket is the **[[Taylor series|taylor-series]]** of $\sin\Phi$. The second is $1 - \cos\Phi$, because $\cos\Phi = 1 - \Phi^2/2! + \Phi^4/4! - \cdots$. So

$$
\exp(\Phi\mathbf{K}) = \mathbf{I}_3 + \sin\Phi\,[\hat{\mathbf{u}}\times] + (1-\cos\Phi)\,[\hat{\mathbf{u}}\times]^2 .
$$

That is Rodrigues' rotation formula from lesson 04 — reached with no geometry at all.

A general matrix exponential has no neat closed form like this. $SO(3)$ gets one because of $\mathbf{K}^3 = -\mathbf{K}$, which holds because in three dimensions every skew matrix is a cross product with a single axis.

::: key The exponential map and Rodrigues' formula
$\mathbf{R} = \exp([\boldsymbol{\phi}\times]) = \mathbf{I}_3 + \sin\Phi\,[\hat{\mathbf{u}}\times] + (1-\cos\Phi)\,[\hat{\mathbf{u}}\times]^2$, with $\boldsymbol{\phi} = \Phi\hat{\mathbf{u}}$ the rotation vector. On quaternions the same map reads $\exp([0,\boldsymbol{\phi}/2]) = [\cos(\Phi/2),\ \hat{\mathbf{u}}\sin(\Phi/2)]$.
:::

### Two properties that matter in practice

**It reaches everything.** Every rotation is the exponential of some rotation vector. That is Euler's theorem again: take $\boldsymbol{\phi} = \Phi\hat{\mathbf{e}}$, the principal axis times the principal angle. Not every Lie group has this property; $SO(3)$ does because it is compact and connected.

**It is not one-to-one.** Turn $360^\circ$ and you are back where you started, so $\exp(\boldsymbol{\phi}) = \exp(\boldsymbol{\phi} + 2\pi k\hat{\mathbf{u}})$ for any whole number $k$. Numerically, $\exp(2\pi\hat{\mathbf{u}}) - \mathbf{I}_3$ comes out at $2.0\times 10^{-16}$: zero, up to rounding. The whole sphere $\lVert\boldsymbol{\phi}\rVert = 2\pi$ lands on the identity. Restricted to the open ball $\lVert\boldsymbol{\phi}\rVert < \pi$, the map is one-to-one and smooth both ways. It then covers every rotation *except* the $180^\circ$ ones — an excellent three-number description that, as the note above proved it must, still misses something.

### The same map on quaternions

On quaternions the exponential reads $\exp([0,\boldsymbol{\phi}/2]) = [\cos(\Phi/2),\ \hat{\mathbf{u}}\sin(\Phi/2)]$ — the definition from lesson 05. For $\Phi = 1.3\,\mathrm{rad}$, the matrix of that quaternion and $\exp([\boldsymbol{\phi}\times])$ agree to $2.2\times 10^{-16}$.

The unit quaternions $S^3$ and $SO(3)$ share one Lie algebra. Up close they are identical; they differ only in their overall shape, the way a rubber band wrapped twice around a can looks, up close, just like one wrapped once. The half-angle is exactly the factor $\tfrac12$ between the two exponentials.

::: example Rodrigues is the series, checked term by term
Take the axis $\hat{\mathbf{u}} = (0.3,\ -0.5,\ 0.81)$ divided by its length. Compute $\exp([\boldsymbol{\phi}\times])$ two ways: by adding up the matrix power series term by term, and by Rodrigues' closed form. Compare the largest difference in any entry.

| $\Phi$ (rad) | $0.1$ | $1.0$ | $\pi/2$ | $\pi$ | $6.0$ |
| --- | --- | --- | --- | --- | --- |
| $\max\lvert\text{series} - \text{Rodrigues}\rvert$ | $1.1\times 10^{-16}$ | $1.1\times 10^{-16}$ | $2.2\times 10^{-16}$ | $3.3\times 10^{-16}$ | $6.3\times 10^{-15}$ |
| terms until the next is below $10^{-15}$ | $10$ | $18$ | $21$ | $28$ | $38$ |

**Reading the first row.** The two agree to the last bit the computer keeps — about $10^{-16}$. The closed form is not an approximation of the series; it is the series summed exactly.

**Reading the second row.** At a half turn the series needs $28$ terms, each a $3\times 3$ matrix multiply. Rodrigues costs one sine, one cosine and two matrix products at any angle.

**The one odd number.** At $\Phi = 6$ the difference grows to $6.3\times 10^{-15}$. Along the way the series passes through terms as big as $6^5/5! = 6^6/6! = 64.8$, which then almost cancel. Rounding error scales with the biggest number you touch, so the sum keeps a little of it. At large angles the series is slower *and* less accurate.
:::

## The logarithm

Going back — from a rotation matrix to its rotation vector — is the **logarithm**, the undo button for $\exp$. It is the axis-and-angle extraction of lesson 04, now with a name. Rodrigues' formula gives two facts: $\mathbf{R} - \mathbf{R}^\top = 2\sin\Phi[\hat{\mathbf{u}}\times]$ (the skew part) and $\operatorname{tr}\mathbf{R} = 1 + 2\cos\Phi$ (the trace, the sum of the diagonal). Solve each:

$$
\Phi = \arccos\frac{\operatorname{tr}\mathbf{R} - 1}{2},
\qquad
\boldsymbol{\phi} = \log\mathbf{R} = \frac{\Phi}{2\sin\Phi}
\begin{bmatrix} R_{32}-R_{23}\\ R_{13}-R_{31}\\ R_{21}-R_{12}\end{bmatrix}.
$$

Here $R_{32}$ is the entry in row 3, column 2. The column on the right is $\mathrm{vee}(\mathbf{R}-\mathbf{R}^\top)$.

Because $\exp$ is not one-to-one, $\log$ must choose. This formula returns the rotation vector of smallest length, $\lVert\boldsymbol{\phi}\rVert \le \pi$, called the **principal branch**. It is the same choice as the shortest-path sign rule of lesson 07 and the shadow-set switch of lesson 09, in a third set of clothes.

Trouble spots: as $\Phi\to 0$ the factor $\Phi/(2\sin\Phi)$ reads $0/0$, but its limit is a harmless $\tfrac12$. So code must use the limit, not compute the ratio. As $\Phi\to\pi$ it is truly bad: $\sin\Phi\to 0$ while the top stays finite, and $\arccos$ is infinitely steep at $-1$.

::: example Where the logarithm stops being trustworthy
Run the round trip $\log(\exp(\boldsymbol{\phi}))$ and see how far the answer lands from $\boldsymbol{\phi}$. Use the formula above, with a small-angle guard: below $\Phi = 10^{-6}$, return $\tfrac12\,\mathrm{vee}(\mathbf{R}-\mathbf{R}^\top)$.

Over $2000$ random rotation vectors with lengths spread evenly between $0$ and $\pi$, the worst error in any component is a few times $10^{-10}$ — already far worse than the $10^{-16}$ of the last example. Something degrades near the top of the range. Sweep the length directly, along the axis of the last example:

| $\lVert\boldsymbol{\phi}\rVert$ | $10^{-8}$ | $10^{-4}$ | $3.14$ | $3.1415$ | $3.14159$ |
| --- | --- | --- | --- | --- | --- |
| relative round-trip error | $0$ | $6.8\times 10^{-17}$ | $1.1\times 10^{-10}$ | $1.7\times 10^{-8}$ | $4.3\times 10^{-6}$ |

Perfect at small angles. About $10^{-4}\,\mathrm{rad}$ from a half turn it has lost half its sixteen digits, and about $3\times 10^{-6}$ from it, most of them. The cause is the one lesson 10 found in the naive matrix-to-quaternion formula: a quantity that vanishes at $\Phi = \pi$ sits in a denominator, and the trace carries a fixed rounding error while its distance from the bad value shrinks.

The remedy is also the same. Convert the matrix to a quaternion with the Shepperd branch selection of lesson 10. Then read off the rotation vector as $\boldsymbol{\phi} = 2\operatorname{atan2}(\lVert\mathbf{v}\rVert, w)\,\mathbf{v}/\lVert\mathbf{v}\rVert$, where $w$ and $\mathbf{v}$ are the quaternion's scalar and vector parts. Tried on the same sweep, this route stays within $1.5\times 10^{-16}$ at every angle, including within $10^{-10}$ of a half turn. Production code does not use the matrix logarithm formula directly.
:::

## Rotation vectors do not add

The one place the flat picture misleads is **composition** — doing one rotation after another. Walk $100\,\mathrm{km}$ north then $100\,\mathrm{km}$ east on the globe, and you land somewhere slightly different from going east then north. On a flat map the two would agree.

For ordinary numbers, $e^a e^b = e^{a+b}$. That works because $ab = ba$. Rotations do not commute, and the correction is the **[[Baker–Campbell–Hausdorff|bch-names]]** (BCH) series. Its first terms, written with arrows and cross products standing in for commutators, are

$$
\log\bigl(\exp(\mathbf{a})\exp(\mathbf{b})\bigr)
= \mathbf{a} + \mathbf{b} + \tfrac12\,\mathbf{a}\times\mathbf{b}
+ \tfrac{1}{12}\bigl(\mathbf{a}\times(\mathbf{a}\times\mathbf{b}) + \mathbf{b}\times(\mathbf{b}\times\mathbf{a})\bigr) + \cdots
$$

In words: $\mathbf{a}$ then $\mathbf{b}$ is almost $\mathbf{a}+\mathbf{b}$, plus corrections built from how much they fail to commute.

::: example How much the BCH correction is worth
Compose $\mathbf{a} = 0.300\,\mathrm{rad}$ about $\hat{\mathbf{x}}$ with $\mathbf{b} = 0.200\,\mathrm{rad}$ about $\hat{\mathbf{y}}$. That is about $17^\circ$ and $11^\circ$. Multiply the two rotation matrices and take the logarithm. The exact composite rotation vector is

$$
\log\bigl(\exp(\mathbf{a})\exp(\mathbf{b})\bigr) = (0.29899633,\ 0.19849575,\ 0.02999970)\,\mathrm{rad}.
$$

Look at the third number: $0.030\,\mathrm{rad}$ about $\hat{\mathbf{z}}$. Neither rotation had any $z$ in it. It came from the first correction term, $\tfrac12\mathbf{a}\times\mathbf{b} = \tfrac12(0.3)(0.2)\hat{\mathbf{z}} = 0.030\hat{\mathbf{z}}$ — the commutator made visible.

How far off is each approximation? Measure the principal angle between the rotation it gives and the true one:

| approximation | value | attitude error |
| --- | --- | --- |
| $\mathbf{a}+\mathbf{b}$ | $(0.300,\ 0.200,\ 0)$ | $1.712692^\circ$ |
| $\mathbf{a}+\mathbf{b}+\tfrac12\mathbf{a}\times\mathbf{b}$ | $(0.300,\ 0.200,\ 0.030)$ | $0.103524^\circ$ |
| through the $\tfrac{1}{12}$ terms | $(0.2990,\ 0.1985,\ 0.030)$ | $0.000322^\circ$ |

Adding the arrows is wrong by $1.71^\circ$ for two modest rotations. One correction term shrinks that by a factor of $1.712692/0.103524 = 16.5$. The next level shrinks it by another $321$.

**Order matters.** $\exp(\mathbf{a})\exp(\mathbf{b})$ and $\exp(\mathbf{b})\exp(\mathbf{a})$ differ by $3.419^\circ$. Compare the whole commutator: $\lVert\mathbf{a}\times\mathbf{b}\rVert = 0.060\,\mathrm{rad} = 3.438^\circ$. Close, as expected — swapping the order flips the sign of the $\tfrac12\mathbf{a}\times\mathbf{b}$ term, a total change of $\mathbf{a}\times\mathbf{b}$.

This is the exact meaning of "small rotations almost commute": the error is second order in the rotation sizes. Halve both angles and the error of plain adding falls by four. That is why an inertial navigator summing gyro increments at $1\,\mathrm{kHz}$ can treat them as nearly additive — and why what is left over, the **[[coning correction|coning]]**, is a commutator term.
:::

::: warning The Lie algebra is flat; the group is not
Every convenience of the error-state method in lesson 12 comes from working in $so(3)$: vectors add, covariances are ordinary $3\times 3$ matrices, and linearization is exact to first order. Every one of those conveniences is an approximation whose error is second order in the rotation. A covariance carried across a large rotation needs the **adjoint** (for $SO(3)$, the rotation matrix itself, re-expressing an algebra element in another frame). Increments composed over a large angle need BCH or the true group product. A filter handed a $30^\circ$ surprise is outside its linearization's range. Keep errors small and the flat picture is close to free — which is exactly why filters reset the error to zero after every update.
:::

::: note Where this language takes you
The same construction grows. $SE(3)$, the group of rigid-body motions, adds position to attitude and has a six-dimensional algebra; its exponential and logarithm underpin robot-arm kinematics and camera-plus-gyro navigation. Geometric attitude control designs feedback directly on the group, avoiding chart singularities at the cost of a harder stability proof. All of it starts from skew matrices, the exponential, and the commutator.
:::

## Check yourself

::: check
Show that $[\hat{\mathbf{u}}\times]^3 = -[\hat{\mathbf{u}}\times]$ for a unit vector, and say which step in the exponential series it makes possible.
:::

::: answer
**Start from the square.** For any arrow $\mathbf{v}$, the triple-product rule gives $\hat{\mathbf{u}}\times(\hat{\mathbf{u}}\times\mathbf{v}) = \hat{\mathbf{u}}(\hat{\mathbf{u}}\cdot\mathbf{v}) - \mathbf{v}(\hat{\mathbf{u}}\cdot\hat{\mathbf{u}})$. Since $\hat{\mathbf{u}}\cdot\hat{\mathbf{u}} = 1$, that is $(\hat{\mathbf{u}}\hat{\mathbf{u}}^\top - \mathbf{I}_3)\mathbf{v}$. So $[\hat{\mathbf{u}}\times]^2 = \hat{\mathbf{u}}\hat{\mathbf{u}}^\top - \mathbf{I}_3$.

**Multiply once more.** $[\hat{\mathbf{u}}\times]^3 = [\hat{\mathbf{u}}\times](\hat{\mathbf{u}}\hat{\mathbf{u}}^\top - \mathbf{I}_3) = (\hat{\mathbf{u}}\times\hat{\mathbf{u}})\hat{\mathbf{u}}^\top - [\hat{\mathbf{u}}\times] = -[\hat{\mathbf{u}}\times]$, because an arrow crossed with itself is $\mathbf{0}$.

**What it enables.** Every power of $\mathbf{K}$ is then $\pm\mathbf{K}$ or $\pm\mathbf{K}^2$. So the infinite sum collapses onto just two matrices with number coefficients — and those coefficients are the series for $\sin\Phi$ and $1-\cos\Phi$.
:::

::: check
In the language of this lesson, why do angular velocities add while finite rotations do not?
:::

::: answer
Angular velocities are elements of the Lie algebra $so(3)$, a flat vector space. Adding is defined there: it is ordinary addition of skew matrices, or of their arrows.

Finite rotations live in the Lie group $SO(3)$, whose only operation is matrix multiplication — and it does not commute.

The exponential links the two, and BCH says $\exp(\mathbf{a})\exp(\mathbf{b}) = \exp(\mathbf{a}+\mathbf{b}+\tfrac12\mathbf{a}\times\mathbf{b}+\cdots)$. Composing rotations matches adding their arrows only to first order, with the commutator as the first correction. Module 14's rule for adding angular velocities is exact because it lives in the algebra, about instantaneous rates. Over a time step $dt$ the commutator term is of size $dt^2$, so it vanishes in the limit.
:::

::: check
Two gyro increments over back-to-back $1\,\mathrm{ms}$ samples are $\boldsymbol{\phi}_1 = (1,0,0)\times 10^{-3}$ and $\boldsymbol{\phi}_2 = (0,1,0)\times 10^{-3}$ radians. How large is the error from simply adding them, in arcseconds?
:::

::: answer
**The leading correction.** $\tfrac12\boldsymbol{\phi}_1\times\boldsymbol{\phi}_2 = \tfrac12(10^{-3})(10^{-3})\hat{\mathbf{z}} = 5\times 10^{-7}\,\mathrm{rad}$ about $\hat{\mathbf{z}}$.

**In arcseconds.** There are $206\,265$ arcseconds in a radian, so $5\times 10^{-7}\times 206\,265 = 0.103''$.

**Why it matters.** Tiny per sample. But at $1\,\mathrm{kHz}$ there are $1.8\times 10^{6}$ samples in half an hour. In a coning motion, where the spin axis itself sweeps around, these corrections all point the same way and pile up instead of canceling. That is why strapdown navigation software carries an explicit coning correction: it is the BCH commutator term, added up over time.
:::

::: check
The exponential map on the open ball $\lVert\boldsymbol{\phi}\rVert < \pi$ covers every rotation except the $180^\circ$ ones, each exactly once. Why can you not enlarge the ball to fix this?
:::

::: answer
Enlarging it breaks "exactly once" immediately. A turn of $\pi + \epsilon$ about $\hat{\mathbf{u}}$ is the same rotation as $\pi - \epsilon$ about $-\hat{\mathbf{u}}$. So the closed ball of radius $\pi$ already covers every rotation at least once, and covers each $180^\circ$ rotation twice: the opposite points $+\pi\hat{\mathbf{u}}$ and $-\pi\hat{\mathbf{u}}$ on the boundary land on the same rotation.

Gluing those opposite points together is exactly how $\mathbb{RP}^3$ is built, and that is what $SO(3)$ is. There is no way to pick one of each pair continuously, for the same reason there is no continuous choice of quaternion sign in lesson 07. The obstacle is the shape of the space, not a missing formula.
:::

::: check
Code computes $\log\mathbf{R}$ with the formula in this lesson and returns NaN ("not a number") for some inputs. Which inputs, and what should it do instead?
:::

::: answer
**Near the identity.** At $\Phi = 0$ the factor $\Phi/(2\sin\Phi)$ reads $0/0$, though its limit is $\tfrac12$. Guard it: when $\Phi$ is below about $10^{-6}$, return $\tfrac12\,\mathrm{vee}(\mathbf{R}-\mathbf{R}^\top)$.

**Near a half turn.** $\sin\Phi$ vanishes while the top does not. Worse, rounding can push $(\operatorname{tr}\mathbf{R}-1)/2$ slightly below $-1$, and $\arccos$ of that is NaN outright. Clamp the $\arccos$ input to $[-1, 1]$, and handle the half turn through the symmetric part as lesson 04 did.

**Better still,** avoid both problems: convert to a quaternion with Shepperd branch selection and take the rotation vector from there. That route is accurate to about $10^{-16}$ at every angle.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $SO(3)$ | Compact, connected, three-dimensional Lie group; it is $\mathbb{RP}^3$, doubly covered by $S^3$ |
| Not simply connected | $360^\circ$ loop cannot shrink to a point, $720^\circ$ can; the plate trick; the source of the double cover |
| Compact | Why every three-number description has a singularity somewhere |
| $so(3)$ | Skew-symmetric $3\times 3$ matrices; tangent space at $\mathbf{I}_3$; same as $\mathbb{R}^3$ via $\boldsymbol{\phi}\mapsto[\boldsymbol{\phi}\times]$ |
| $[\mathbf{a}\times][\mathbf{b}\times]-[\mathbf{b}\times][\mathbf{a}\times] = [(\mathbf{a}\times\mathbf{b})\times]$ | The commutator is the cross product |
| $[\hat{\mathbf{u}}\times]^2 = \hat{\mathbf{u}}\hat{\mathbf{u}}^\top-\mathbf{I}_3$, $[\hat{\mathbf{u}}\times]^3 = -[\hat{\mathbf{u}}\times]$ | What collapses the exponential series |
| $\exp([\boldsymbol{\phi}\times]) = \mathbf{I}_3+\sin\Phi[\hat{\mathbf{u}}\times]+(1-\cos\Phi)[\hat{\mathbf{u}}\times]^2$ | Rodrigues' formula as a summed series |
| $\exp([0,\boldsymbol{\phi}/2]) = [\cos(\Phi/2),\hat{\mathbf{u}}\sin(\Phi/2)]$ | The same map on quaternions; the half-angle is the covering factor |
| $\boldsymbol{\phi} = \log\mathbf{R} = \frac{\Phi}{2\sin\Phi}\,\mathrm{vee}(\mathbf{R}-\mathbf{R}^\top)$ | Principal branch, $\lVert\boldsymbol{\phi}\rVert\le\pi$; needs a guard near $0$, poorly conditioned near $\pi$ |
| $\dot{\mathbf{C}} = \mathbf{C}[\boldsymbol{\omega}^B\times]$ | Angular velocity is the algebra element of the attitude's rate of change |
| BCH: $\mathbf{a}+\mathbf{b}+\tfrac12\mathbf{a}\times\mathbf{b}+\cdots$ | Rotation vectors add only to first order |
| Worked figures | Series needs $28$ terms at $\Phi = \pi$; $\log$ loses half its digits $10^{-4}$ from $\pi$; adding $0.3$ and $0.2\,\mathrm{rad}$ misses by $1.713^\circ$, by $0.104^\circ$ with one commutator term |

This closes the module. You now have five representations, every conversion between them, the conventions that make each one unambiguous, and the structure that explains why the list is what it is. Everything that follows — attitude kinematics and rotational dynamics, attitude determination, estimation and pointing control — is built on these objects, and every one of them will expect you to state your convention and defend it.

::: context manifold Curved space, flat tangent
Here the circle stands in for the curved group and the straight line touching it for the flat algebra. Lay off an arrow of length $55$ along the tangent (grey). The exponential wraps it onto the curve as an arc of the same length (blue): on a circle of radius $70$ that is $55/70 = 0.786$ radians, or $45^\circ$. Short arrows barely bend; long ones bend a lot. That is the whole story of this lesson in one picture.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="120" r="70" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="90" y1="50" x2="290" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="50" x2="235" y2="50" stroke="#6c7a93" stroke-width="4"/>
  <path d="M180,50 A70,70 0 0,1 229.5,70.5" fill="none" stroke="#1d6fd1" stroke-width="4"/>
  <circle cx="180" cy="50" r="4" fill="#1f2a44"/>
  <circle cx="229.5" cy="70.5" r="4" fill="#1d6fd1"/>
  <text x="96" y="42" font-size="12" fill="#1f2a44">flat tangent: so(3)</text>
  <text x="150" y="128" font-size="12" fill="#6c7a93">curved: SO(3)</text>
  <text x="166" y="66" font-size="11" fill="#1f2a44">I</text>
  <text x="238" y="84" font-size="12" fill="#1d6fd1">exp(arrow)</text>
</svg>
```
:::

::: context sophus-lie The man behind the name
Sophus Lie (1842–1899) was a Norwegian mathematician. He set out to do for differential equations what Galois had done for polynomial equations: understand them through their symmetries. The symmetries he studied could change smoothly — like turning by any angle, not just by quarter turns — and the groups they form now carry his name. His name is said "Lee," so $so(3)$ is "the Lie algebra," pronounced like "lee algebra."
:::

::: context compact What "compact" means
In everyday terms, a space is **compact** if it is bounded (it does not run off to infinity) and closed (it includes its own edges, so a sequence of points in it cannot sneak up on a point outside). A closed disk is compact. The whole flat plane is not: you can walk forever. $SO(3)$ is compact because every entry of a rotation matrix lies between $-1$ and $1$, and the rules defining it include their limits.
:::

::: context plate-trick Two turns undo themselves
Hold a plate flat on your palm and rotate it a full turn under your arm, keeping it level. Your arm ends up twisted. Keep going for a second full turn, over your head, and your arm comes back untwisted. The arm is a record of the path of rotations. One full turn is a loop that cannot be smoothed away; two full turns can. Physicists call the same demonstration Dirac's belt trick, and it is the reason quaternions need a $720^\circ$ turn to return to the same sign.
:::

::: context rp3 Gluing opposite points
Picture every rotation vector with length up to $\pi$ as a point in a solid ball of radius $\pi$ (the circle is a slice through it). Points inside are all different rotations. But two opposite points on the surface, $+\pi\hat{\mathbf{u}}$ and $-\pi\hat{\mathbf{u}}$, are the same half turn. Glue every such pair together and the ball becomes $\mathbb{RP}^3$, which is exactly the shape of $SO(3)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="100" r="80" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="123.4" y1="43.4" x2="236.6" y2="156.6" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="180" cy="100" r="3.5" fill="#1f2a44"/>
  <circle cx="123.4" cy="43.4" r="6" fill="#b4232c"/>
  <circle cx="236.6" cy="156.6" r="6" fill="#b4232c"/>
  <text x="188" y="98" font-size="12" fill="#1f2a44">identity</text>
  <text x="84" y="34" font-size="12" fill="#b4232c">−π û</text>
  <text x="250" y="170" font-size="12" fill="#b4232c">+π û</text>
  <text x="268" y="50" font-size="12" fill="#1f2a44">same</text>
  <text x="268" y="66" font-size="12" fill="#1f2a44">half turn</text>
</svg>
```
:::

::: context factorial What n! means
$n!$, read "n factorial," is the product of the whole numbers from $1$ to $n$: $3! = 1\cdot 2\cdot 3 = 6$ and $5! = 120$. By agreement $0! = 1$. Factorials grow faster than any power, which is why the terms $\Phi^n/n!$ of the exponential series always shrink eventually, however large $\Phi$ is. The series always converges; it only takes longer for big angles.
:::

::: context taylor-series Functions written as endless polynomials
A **Taylor series** writes a smooth function as a polynomial that never stops. Near zero,

$$
\sin x = x - \frac{x^3}{3!} + \frac{x^5}{5!} - \cdots,
\qquad
\cos x = 1 - \frac{x^2}{2!} + \frac{x^4}{4!} - \cdots
$$

Cutting either series after one or two terms gives the small-angle approximations $\sin x\approx x$ and $\cos x\approx 1 - x^2/2$ from the trigonometry module. The same two series appear, term for term, inside the exponential of a rotation — which is why Rodrigues' formula has a sine and a one-minus-cosine in it.
:::

::: context bch-names Three names, one formula
The series is named for Henry Baker, John Campbell and Felix Hausdorff, who each worked on it around 1900. Campbell's paper came in 1897, Baker's in 1905, Hausdorff's in 1906. Eugene Dynkin wrote down an explicit rule for every term in 1947. Every term after $\mathbf{a}+\mathbf{b}$ is built from commutators — so if two rotations share an axis, all the corrections vanish and their rotation vectors add exactly.
:::

::: context coning When the spin axis goes round in a circle
**Coning** is a motion where the body's spin axis sweeps around a cone, like a wobbling top. Sample its gyro every millisecond and each increment is small, but consecutive increments point in slightly different directions. Their commutators do not cancel: they all add up along the cone's axis. A navigator that sums the increments as if they commuted slowly drifts about that axis, even though the body's average attitude is not changing at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="55" rx="80" ry="20" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="190" x2="100" y2="55" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="180" y1="190" x2="260" y2="55" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="180" y1="190" x2="180" y2="20" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="180" y1="190" x2="241.3" y2="67.9" stroke="#b4232c" stroke-width="3"/>
  <polygon points="141.2,72.6 128.5,75.5 130.2,65.7" fill="#1d6fd1"/>
  <text x="248" y="84" font-size="12" fill="#b4232c">spin axis now</text>
  <text x="188" y="16" font-size="12" fill="#1f2a44">cone axis: drift shows here</text>
  <text x="20" y="40" font-size="12" fill="#1d6fd1">axis sweeps round</text>
</svg>
```
:::
