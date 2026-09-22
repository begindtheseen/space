---
id: l13-so3-so3-algebra-and-the-exp-log-maps
title: Introduction to SO(3), so(3) and the exp and log maps
minutes: 21
covers:
  - 'introduction to SO(3), so(3) and the exp/log maps'
---

Twelve lessons of this module have been instances of one structure, seen from different sides. Rotations form a curved three-dimensional group; small rotations form a flat three-dimensional vector space; and a single map connects them. Once the connection is named, results that looked like separate facts turn out to be the same fact: Rodrigues' formula is a power series in disguise, the attitude kinematic equation of module 14 is a statement about tangent vectors, the rotation-vector error state of lesson 12 is a coordinate chart, and the double cover of lesson 07 is a topological property that also explains why Euler angles must have a singularity.

The language is that of Lie groups, and none of it is needed to write correct attitude software. It is needed to read the modern literature — error-state filters, geometric control, factor-graph estimation, preintegrated inertial measurements are all written in it — and it is what makes the pieces of this module one subject instead of thirteen tricks. This lesson keeps to $SO(3)$ and $so(3)$ and stays concrete, computing everything it claims.

## $SO(3)$ is a Lie group

Lesson 01 established that $SO(3) = \{\mathbf{C}\in\mathbb{R}^{3\times 3} : \mathbf{C}^\top\mathbf{C} = \mathbf{I}_3,\ \det\mathbf{C} = +1\}$ is a group under matrix multiplication. It is also a **smooth manifold**: near any of its points it looks like a piece of $\mathbb{R}^3$, with multiplication and inversion smooth operations. A group that is also a smooth manifold, with smooth group operations, is a **Lie group**.

Four properties, all established earlier in the module, characterise it.

- **Dimension 3.** Nine entries, six independent constraints from $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$ (lesson 01).
- **Compact.** Every entry is a direction cosine, bounded by $1$, and the constraint set is closed. So attitudes never run off to infinity — unlike position, and unlike the Gibbs vector of lesson 09.
- **Connected.** Any rotation is reached from the identity by increasing an angle continuously, which is Euler's theorem (lesson 04) read as a statement about paths.
- **Not simply connected.** A $360^\circ$ rotation is a loop that cannot be shrunk to a point; a $720^\circ$ rotation can. Its fundamental group has two elements, which is precisely the double cover of lesson 07: $SO(3)\cong\mathbb{RP}^3$, covered twice by $S^3$.

The last two together are why no three parameters can cover $SO(3)$ without a singularity. A global three-parameter chart would be a continuous one-to-one map from an open piece of $\mathbb{R}^3$ onto all of $SO(3)$; $\mathbb{R}^3$ is not compact and $SO(3)$ is, and a continuous image of a non-compact set can be compact only by wrapping — which forces either a failure of injectivity or a point where the map degenerates. Gimbal lock is that point for Euler angles, $\Phi = 180^\circ$ for the Gibbs vector, $\Phi = 360^\circ$ for modified Rodrigues parameters. Every three-parameter representation pays the same bill somewhere.

## $so(3)$: the tangent space at the identity

Take a smooth curve $\mathbf{C}(t)$ in $SO(3)$ with $\mathbf{C}(0) = \mathbf{I}_3$, and differentiate the constraint. This is lesson 01's calculation and module 14's, done once more at the identity:

$$
\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3
\ \Longrightarrow\
\dot{\mathbf{C}}^\top\mathbf{C} + \mathbf{C}^\top\dot{\mathbf{C}} = \mathbf{0}
\ \xrightarrow{\ t=0\ }\
\dot{\mathbf{C}}(0)^\top + \dot{\mathbf{C}}(0) = \mathbf{0}.
$$

So every velocity through the identity is a **skew-symmetric** matrix. That set,

$$
so(3) = \{\,\mathbf{S}\in\mathbb{R}^{3\times 3} : \mathbf{S}^\top = -\mathbf{S}\,\},
$$

is the **Lie algebra** of $SO(3)$: a three-dimensional vector space, flat, closed under addition and scalar multiplication, with basis the three cross-product matrices $[\hat{\mathbf{x}}\times]$, $[\hat{\mathbf{y}}\times]$, $[\hat{\mathbf{z}}\times]$.

Three-dimensional and flat means it is isomorphic to $\mathbb{R}^3$, and the isomorphism is the hat map $\boldsymbol{\phi}\mapsto[\boldsymbol{\phi}\times]$ already in use since module 14. What makes it a Lie *algebra* rather than only a vector space is a product, the **commutator**, and under the hat map it is the cross product:

$$
[\mathbf{a}\times][\mathbf{b}\times] - [\mathbf{b}\times][\mathbf{a}\times] = \bigl[(\mathbf{a}\times\mathbf{b})\times\bigr],
$$

verified over $300$ random pairs to exactly zero error. Every statement about cross products in this curriculum is a statement about $so(3)$.

Two more identities do most of the algebraic work below, both verified to $5.6\times 10^{-17}$ for a unit $\hat{\mathbf{u}}$:

$$
[\hat{\mathbf{u}}\times]^2 = \hat{\mathbf{u}}\hat{\mathbf{u}}^\top - \mathbf{I}_3,
\qquad
[\hat{\mathbf{u}}\times]^3 = -[\hat{\mathbf{u}}\times].
$$

Away from the identity, differentiating the constraint gives $\mathbf{C}^{-1}\dot{\mathbf{C}} = \mathbf{C}^\top\dot{\mathbf{C}}$ skew, which is module 14's kinematic equation $\dot{\mathbf{C}}_{N\leftarrow B} = \mathbf{C}_{N\leftarrow B}[\boldsymbol{\omega}^B\times]$ read backwards. **Angular velocity is an element of $so(3)$** — the tangent vector at $\mathbf{C}$, translated back to the identity by the group operation. That is why angular velocities add as vectors while finite rotations do not: addition is legal in the flat algebra and meaningless in the curved group.

::: key SO(3) and so(3)
$SO(3)$ is a compact, connected, three-dimensional Lie group that is not simply connected — $S^3$ covers it twice. Its Lie algebra $so(3)$ is the space of $3\times 3$ skew-symmetric matrices, isomorphic to $\mathbb{R}^3$ under $\boldsymbol{\phi}\mapsto[\boldsymbol{\phi}\times]$, with the commutator corresponding to the cross product. Angular velocity lives in $so(3)$; attitude lives in $SO(3)$.
:::

## The exponential map

The map from the algebra to the group is the matrix exponential,

$$
\exp: so(3)\to SO(3),
\qquad
\exp(\mathbf{S}) = \sum_{n=0}^{\infty}\frac{\mathbf{S}^n}{n!} .
$$

Write $\mathbf{S} = [\boldsymbol{\phi}\times]$ with $\boldsymbol{\phi} = \Phi\hat{\mathbf{u}}$ the **rotation vector**, and use $[\hat{\mathbf{u}}\times]^3 = -[\hat{\mathbf{u}}\times]$ to collapse the series. Powers cycle with period four: $\mathbf{K}, \mathbf{K}^2, -\mathbf{K}, -\mathbf{K}^2, \mathbf{K},\dots$ for $\mathbf{K} = [\hat{\mathbf{u}}\times]$. Collecting the odd terms onto $\mathbf{K}$ and the even ones onto $\mathbf{K}^2$,

$$
\exp(\Phi\mathbf{K}) = \mathbf{I}_3
+ \Bigl(\Phi - \frac{\Phi^3}{3!} + \frac{\Phi^5}{5!} - \cdots\Bigr)\mathbf{K}
+ \Bigl(\frac{\Phi^2}{2!} - \frac{\Phi^4}{4!} + \frac{\Phi^6}{6!} - \cdots\Bigr)\mathbf{K}^2
$$

$$
= \mathbf{I}_3 + \sin\Phi\,[\hat{\mathbf{u}}\times] + (1-\cos\Phi)\,[\hat{\mathbf{u}}\times]^2 .
$$

That is Rodrigues' rotation formula from lesson 04, arrived at with no geometry at all. The two series are exactly $\sin\Phi$ and $1-\cos\Phi$, so a closed form exists for $SO(3)$ that does not exist for a general matrix exponential — a consequence of $\mathbf{K}^3 = -\mathbf{K}$, which is special to three dimensions.

::: key The exponential map and Rodrigues' formula
$\mathbf{R} = \exp([\boldsymbol{\phi}\times]) = \mathbf{I}_3 + \sin\Phi\,[\hat{\mathbf{u}}\times] + (1-\cos\Phi)\,[\hat{\mathbf{u}}\times]^2$, with $\boldsymbol{\phi} = \Phi\hat{\mathbf{u}}$ the rotation vector. On quaternions the same map reads $\exp([0,\boldsymbol{\phi}/2]) = [\cos(\Phi/2),\ \hat{\mathbf{u}}\sin(\Phi/2)]$.
:::

Two properties of $\exp$ matter operationally.

- **It is surjective.** Every rotation is the exponential of some rotation vector — which is Euler's theorem restated, since $\boldsymbol{\phi} = \Phi\hat{\mathbf{e}}$ is the principal axis and angle. Not every Lie group has this property; $SO(3)$ does because it is compact and connected.
- **It is not injective.** $\exp$ has period $2\pi$ in $\Phi$, so $\exp(\boldsymbol{\phi}) = \exp(\boldsymbol{\phi} + 2\pi k\hat{\mathbf{u}})$; numerically, $\exp(2\pi\hat{\mathbf{u}}) - \mathbf{I}_3$ is $2.0\times 10^{-16}$. The whole sphere $\lVert\boldsymbol{\phi}\rVert = 2\pi$ collapses to the identity. Restricted to the open ball $\lVert\boldsymbol{\phi}\rVert < \pi$ it is one-to-one and a diffeomorphism onto $SO(3)$ minus the $180^\circ$ set — the best three-parameter chart there is, and it still does not cover everything.

On quaternions the same map is $\exp([0,\boldsymbol{\phi}/2]) = [\cos(\Phi/2),\ \hat{\mathbf{u}}\sin(\Phi/2)]$, which is the definition from lesson 05. Checked against $\exp([\boldsymbol{\phi}\times])$ for $\Phi = 1.3\,\mathrm{rad}$, the matrices agree to $2.2\times 10^{-16}$. The two groups $S^3$ and $SO(3)$ share one Lie algebra — their difference is global, not local — and the half-angle is exactly the factor $\tfrac12$ relating the two exponentials.

::: example Rodrigues is the series, checked term by term
Evaluate $\exp([\boldsymbol{\phi}\times])$ two ways for $\hat{\mathbf{u}} = (0.3,-0.5,0.81)/\lVert\cdot\rVert$: by summing the matrix power series, and by Rodrigues' closed form.

| $\Phi$ (rad) | $0.1$ | $1.0$ | $\pi/2$ | $\pi$ | $6.0$ |
| --- | --- | --- | --- | --- | --- |
| $\max\lvert\text{series} - \text{Rodrigues}\rvert$ | $1.1\times 10^{-16}$ | $1.1\times 10^{-16}$ | $2.2\times 10^{-16}$ | $3.3\times 10^{-16}$ | $6.3\times 10^{-15}$ |
| terms to reach $10^{-15}$ | $9$ | $17$ | $20$ | $27$ | $80$ |

They agree to the last bit. The second row is why the closed form is used: the series needs $27$ terms at a half turn and $80$ at $\Phi = 6$ radians, each costing a $3\times 3$ matrix multiply, while Rodrigues costs one sine, one cosine and two matrix products at any angle. The closed form is not an approximation of the series; it is the series summed exactly.
:::

## The logarithm

Inverting $\exp$ on $\lVert\boldsymbol{\phi}\rVert < \pi$ is the extraction of lesson 04, now named. From $\mathbf{R} - \mathbf{R}^\top = 2\sin\Phi[\hat{\mathbf{u}}\times]$ and $\operatorname{tr}\mathbf{R} = 1 + 2\cos\Phi$,

$$
\Phi = \arccos\frac{\operatorname{tr}\mathbf{R} - 1}{2},
\qquad
\boldsymbol{\phi} = \log\mathbf{R} = \frac{\Phi}{2\sin\Phi}
\begin{bmatrix} R_{32}-R_{23}\\ R_{13}-R_{31}\\ R_{21}-R_{12}\end{bmatrix}.
$$

This is the **principal branch**: it returns the rotation vector of smallest magnitude, $\lVert\boldsymbol{\phi}\rVert \le \pi$. It is the same choice as the shortest-path sign convention of lesson 07 and the shadow-set rule of lesson 09, wearing a third set of clothes.

As $\Phi\to 0$ the factor $\Phi/(2\sin\Phi)\to 1/2$ and the formula is well behaved, provided the limit is taken rather than the ratio evaluated. As $\Phi\to\pi$ it is not: $\sin\Phi\to 0$ while the numerator stays finite, and $\arccos$ has infinite slope at $-1$.

::: example Where the logarithm stops being trustworthy
Round-trip $\log(\exp(\boldsymbol{\phi}))$ for random rotation vectors with $\lVert\boldsymbol{\phi}\rVert$ uniform in $(0,\pi)$: over $2000$ draws the worst component error is $4.1\times 10^{-11}$, which already hints that something degrades near the top of the range. Sweeping the magnitude directly:

| $\lVert\boldsymbol{\phi}\rVert$ | $10^{-8}$ | $10^{-4}$ | $3.14$ | $3.1415$ | $3.14159$ |
| --- | --- | --- | --- | --- | --- |
| relative round-trip error | $0$ | $6.8\times 10^{-17}$ | $2.7\times 10^{-11}$ | $1.7\times 10^{-8}$ | $3.6\times 10^{-5}$ |

Perfect at small angles, and losing about half the available digits by the time the rotation is within $10^{-5}$ radians of a half turn. The cause is the same one lesson 10 diagnosed for the naive DCM-to-quaternion formula: a quantity that vanishes at $\Phi = \pi$ appearing in a denominator, and a trace whose absolute round-off is fixed while its distance from the singular value shrinks.

The remedy is also the same. Convert the matrix to a quaternion with the Shepperd branch selection of lesson 10, which is accurate to $6\times 10^{-16}$ at every angle including exactly $180^\circ$, and read the rotation vector off it as $\boldsymbol{\phi} = 2\operatorname{atan2}(\lVert\mathbf{v}\rVert, w)\,\mathbf{v}/\lVert\mathbf{v}\rVert$. Production code does not implement the matrix logarithm directly.
:::

## Rotation vectors do not add

The one place the flat picture misleads is composition. In a commutative group, $\exp(\mathbf{A})\exp(\mathbf{B}) = \exp(\mathbf{A}+\mathbf{B})$. $SO(3)$ is not commutative, and the correction is the **Baker–Campbell–Hausdorff** series, whose first terms are

$$
\log\bigl(\exp(\mathbf{a})\exp(\mathbf{b})\bigr)
= \mathbf{a} + \mathbf{b} + \tfrac12\,\mathbf{a}\times\mathbf{b}
+ \tfrac{1}{12}\bigl(\mathbf{a}\times(\mathbf{a}\times\mathbf{b}) + \mathbf{b}\times(\mathbf{b}\times\mathbf{a})\bigr) + \cdots,
$$

written in $\mathbb{R}^3$ with the cross product standing for the commutator.

::: example How much the BCH correction is worth
Compose $\mathbf{a} = 0.300\,\mathrm{rad}$ about $\hat{\mathbf{x}}$ with $\mathbf{b} = 0.200\,\mathrm{rad}$ about $\hat{\mathbf{y}}$. The exact composite rotation vector is

$$
\log\bigl(\exp(\mathbf{a})\exp(\mathbf{b})\bigr) = (0.29899633,\ 0.19849575,\ 0.02999970)\,\mathrm{rad}.
$$

Note the third component: $0.030\,\mathrm{rad}$ about $\hat{\mathbf{z}}$ appears out of two rotations that had no $z$ content at all. That is $\tfrac12\mathbf{a}\times\mathbf{b} = \tfrac12(0.3)(0.2)\hat{\mathbf{z}} = 0.030\hat{\mathbf{z}}$, the commutator made visible.

| approximation | value | attitude error |
| --- | --- | --- |
| $\mathbf{a}+\mathbf{b}$ | $(0.300,\ 0.200,\ 0)$ | $1.712692^\circ$ |
| $\mathbf{a}+\mathbf{b}+\tfrac12\mathbf{a}\times\mathbf{b}$ | $(0.300,\ 0.200,\ 0.030)$ | $0.103524^\circ$ |
| through the $\tfrac{1}{12}$ terms | $(0.2990,\ 0.1985,\ 0.030)$ | $0.000322^\circ$ |

Adding the vectors is wrong by $1.71^\circ$ for two modest rotations of $17^\circ$ and $11^\circ$. One commutator term reduces that by a factor of $16.5$, and the next order by another factor of $321$. Separately, $\exp(\mathbf{a})\exp(\mathbf{b})$ and $\exp(\mathbf{b})\exp(\mathbf{a})$ differ by $3.419^\circ$, close to $\lVert\mathbf{a}\times\mathbf{b}\rVert = 0.060\,\mathrm{rad} = 3.438^\circ$ — the whole commutator, since the two orders differ by $\mathbf{a}\times\mathbf{b}$ to leading order.

This is the exact sense in which "rotations almost commute when they are small": the error is second order in the rotation sizes. Halve both angles and the composition error falls by four, which is why an inertial navigator integrating gyro increments at $1\,\mathrm{kHz}$ can treat successive increments as nearly additive, and why the residual — the coning correction — is a commutator term.
:::

::: warning The Lie algebra is flat; the group is not
Every convenience of the error-state formulation in lesson 12 comes from working in $so(3)$, where vectors add, covariances are ordinary $3\times 3$ matrices and linearisation is exact to first order. Every one of those conveniences is an approximation whose error is second order in the rotation. Covariances transported across a large rotation need the adjoint; increments composed over a large angle need the BCH correction or the group product; and a filter that has been given a $30^\circ$ innovation is outside the regime the linearisation was designed for. Keep the errors small and the flat picture is close to free — which is precisely why filters reset the error state to zero after every update.
:::

::: note Where this language takes you
The same construction generalises. $SE(3)$, the group of rigid-body motions, adds translation and has a six-dimensional algebra; its exponential and logarithm underpin visual-inertial odometry and manipulator kinematics. Preintegration of inertial measurements between keyframes is an $SO(3)$ and $SE(3)$ exponential with a Jacobian. Geometric attitude control designs feedback directly on the group, which avoids the chart singularities entirely at the cost of a harder stability analysis. All of these begin with what is on this page: skew matrices, the exponential, and the commutator.
:::

## Check yourself

::: check
Show that $[\hat{\mathbf{u}}\times]^3 = -[\hat{\mathbf{u}}\times]$ for a unit vector, and say which step in the exponential series it enables.
:::

::: answer
Use $[\hat{\mathbf{u}}\times]^2 = \hat{\mathbf{u}}\hat{\mathbf{u}}^\top - \mathbf{I}_3$, which follows from the triple-product expansion $\hat{\mathbf{u}}\times(\hat{\mathbf{u}}\times\mathbf{v}) = \hat{\mathbf{u}}(\hat{\mathbf{u}}\cdot\mathbf{v}) - \mathbf{v}$. Then $[\hat{\mathbf{u}}\times]^3 = [\hat{\mathbf{u}}\times](\hat{\mathbf{u}}\hat{\mathbf{u}}^\top - \mathbf{I}_3) = (\hat{\mathbf{u}}\times\hat{\mathbf{u}})\hat{\mathbf{u}}^\top - [\hat{\mathbf{u}}\times] = -[\hat{\mathbf{u}}\times]$, since $\hat{\mathbf{u}}\times\hat{\mathbf{u}} = \mathbf{0}$. In the series, it means every power of $\mathbf{K}$ is $\pm\mathbf{K}$ or $\pm\mathbf{K}^2$, so the infinite sum collapses onto two matrices with scalar coefficients — and those coefficients are the Taylor series of $\sin\Phi$ and $1-\cos\Phi$.
:::

::: check
Why do angular velocities add while finite rotations do not, in the language of this lesson?
:::

::: answer
Angular velocities are elements of the Lie algebra $so(3)$, which is a vector space: addition is defined there and is the ordinary addition of skew matrices, equivalently of their axial vectors. Finite rotations are elements of the Lie group $SO(3)$, where the operation is matrix multiplication, which is non-commutative and has no addition. The exponential connects them, and the BCH formula says $\exp(\mathbf{a})\exp(\mathbf{b}) = \exp(\mathbf{a}+\mathbf{b}+\tfrac12\mathbf{a}\times\mathbf{b}+\cdots)$: composing rotations corresponds to adding their generators only to first order, with the commutator as the leading correction. Module 14's addition rule for angular velocities is exact because it is a statement in the algebra, about instantaneous rates, where the commutator term is second order in $dt$ and vanishes.
:::

::: check
Two gyro increments over successive $1\,\mathrm{ms}$ samples are $\boldsymbol{\phi}_1 = (1,0,0)\times 10^{-3}$ and $\boldsymbol{\phi}_2 = (0,1,0)\times 10^{-3}$ radians. How large is the error in adding them, in arcseconds?
:::

::: answer
The leading correction is $\tfrac12\boldsymbol{\phi}_1\times\boldsymbol{\phi}_2 = \tfrac12(10^{-3})(10^{-3})\hat{\mathbf{z}} = 5\times 10^{-7}\,\mathrm{rad}$ about $\hat{\mathbf{z}}$. In arcseconds that is $5\times 10^{-7}\times 206265 = 0.103''$. Per pair of samples that is tiny, but at $1\,\mathrm{kHz}$ there are $1.8\times 10^{6}$ such pairs per half hour, and if the motion is such that the corrections accumulate coherently — a coning motion, where the rotation axis itself rotates — they sum rather than cancel. That is why strapdown algorithms carry an explicit coning correction: it is the BCH commutator term, integrated.
:::

::: check
The exponential map restricted to $\lVert\boldsymbol{\phi}\rVert < \pi$ is a bijection onto $SO(3)$ minus the $180^\circ$ rotations. Why can the domain not be enlarged to fix this?
:::

::: answer
Enlarging it breaks injectivity immediately. A rotation of $\pi + \epsilon$ about $\hat{\mathbf{u}}$ is the same rotation as $\pi - \epsilon$ about $-\hat{\mathbf{u}}$, so the closed ball of radius $\pi$ already covers every rotation at least once and covers the $180^\circ$ set twice — every antipodal pair $\pm\pi\hat{\mathbf{u}}$ on the boundary sphere maps to the same rotation. Identifying those antipodes is exactly the construction of $\mathbb{RP}^3$, which is what $SO(3)$ is. There is no way to choose one of each pair continuously, for the same reason there is no continuous choice of quaternion sign in lesson 07. The obstruction is topological, not a matter of finding a better formula.
:::

::: check
An implementation computes $\log\mathbf{R}$ with the formula above and returns NaN for some inputs. Which inputs, and what should it do instead?
:::

::: answer
Two families. First, $\mathbf{R} = \mathbf{I}_3$ or very close: $\Phi = 0$ makes $\Phi/(2\sin\Phi)$ read $0/0$, though the limit is $1/2$; guard by returning $\tfrac12$ times the axial vector of $\mathbf{R}-\mathbf{R}^\top$ when $\Phi$ is below about $10^{-6}$. Second, $\Phi$ at or near $\pi$: $\sin\Phi$ vanishes while the numerator does not, and $\arccos$ of a trace slightly below $-1$ after round-off is NaN outright; clamp the $\arccos$ argument to $[-1,1]$ and handle the half-turn through the symmetric part, as lesson 04 did, or avoid the whole problem by converting to a quaternion with Shepperd branch selection and taking the rotation vector from there — accurate to $6\times 10^{-16}$ at every angle.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $SO(3)$ | Compact, connected, three-dimensional Lie group; $\cong\mathbb{RP}^3$, doubly covered by $S^3$ |
| Not simply connected | $360^\circ$ loop not contractible; the plate trick; the source of the double cover |
| $so(3)$ | Skew-symmetric $3\times 3$ matrices; tangent space at $\mathbf{I}_3$; $\cong\mathbb{R}^3$ by $\boldsymbol{\phi}\mapsto[\boldsymbol{\phi}\times]$ |
| $[\mathbf{a}\times][\mathbf{b}\times]-[\mathbf{b}\times][\mathbf{a}\times] = [(\mathbf{a}\times\mathbf{b})\times]$ | Commutator is the cross product |
| $[\hat{\mathbf{u}}\times]^2 = \hat{\mathbf{u}}\hat{\mathbf{u}}^\top-\mathbf{I}_3$, $[\hat{\mathbf{u}}\times]^3 = -[\hat{\mathbf{u}}\times]$ | What collapses the exponential series |
| $\exp([\boldsymbol{\phi}\times]) = \mathbf{I}_3+\sin\Phi[\hat{\mathbf{u}}\times]+(1-\cos\Phi)[\hat{\mathbf{u}}\times]^2$ | Rodrigues' formula as a summed series |
| $\exp([0,\boldsymbol{\phi}/2]) = [\cos(\Phi/2),\hat{\mathbf{u}}\sin(\Phi/2)]$ | The same map on quaternions; the half-angle is the covering factor |
| $\boldsymbol{\phi} = \log\mathbf{R} = \frac{\Phi}{2\sin\Phi}\,\mathrm{vee}(\mathbf{R}-\mathbf{R}^\top)$ | Principal branch, $\lVert\boldsymbol{\phi}\rVert\le\pi$; ill conditioned near $\pi$ |
| $\dot{\mathbf{C}} = \mathbf{C}[\boldsymbol{\omega}^B\times]$ | Angular velocity is the algebra element of the attitude's tangent |
| BCH: $\mathbf{a}+\mathbf{b}+\tfrac12\mathbf{a}\times\mathbf{b}+\cdots$ | Rotation vectors add only to first order |
| Worked figures | Series needs $27$ terms at $\Phi = \pi$; $\log$ loses half its digits within $10^{-5}$ of $\pi$; adding $0.3$ and $0.2\,\mathrm{rad}$ misses by $1.713^\circ$, $0.104^\circ$ with one commutator term |

This closes the module. You now have five representations, every conversion between them, the conventions that make each unambiguous, and the structure that explains why the list is what it is. Everything that follows in the curriculum — attitude kinematics and rotational dynamics, attitude determination, estimation and pointing control — is built on these objects, and every one of them will assume you can state your convention and defend it.
