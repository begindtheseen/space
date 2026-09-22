---
id: l04-euler-rotation-theorem-and-the-principal-axis
title: Euler rotation theorem, principal rotation axis and angle
minutes: 19
covers:
  - Euler rotation theorem, principal rotation axis and angle
---

Three turns about three axes is one way to reach an attitude. Leonhard Euler showed in 1775 that one turn about one axis is always enough. Whatever the orientation of a rigid body relative to a reference frame — however it got there, through however many manoeuvres — there exists a single axis, fixed during the motion, and a single angle about it, that produce the same result. The axis is called the **principal rotation axis** and the angle the **principal rotation angle**, and together they are the most economical honest description of an attitude: two numbers for the axis, since it is a unit vector, and one for the angle.

This is not a curiosity. The principal angle between two attitudes is *the* measure of pointing error — it is the number that appears in a requirement reading "attitude knowledge better than $0.02^\circ$", and it is what a slew planner minimises, because the shortest path in $SO(3)$ between two attitudes is a rotation about the principal axis of their difference. The principal axis and angle are also the direct parents of the quaternion, which is built from the half-angle, and of both Rodrigues parameter sets, which are built from the half- and quarter-angle tangents. Get comfortable here and the next five lessons are bookkeeping.

## Euler's rotation theorem

> Any orientation of a rigid body relative to a reference frame can be reached by a single rotation through a principal angle $\Phi$ about a fixed principal axis $\hat{\mathbf{e}}$.

The proof is three lines of determinant algebra. A rotation leaves its own axis unmoved, so the claim is that every $\mathbf{C}\in SO(3)$ has an eigenvector with eigenvalue $1$. Consider

$$
\det(\mathbf{C} - \mathbf{I}_3)
= \det(\mathbf{C} - \mathbf{C}\mathbf{C}^{\top})
= \det\mathbf{C}\,\det(\mathbf{I}_3 - \mathbf{C}^{\top})
= \det\bigl((\mathbf{I}_3 - \mathbf{C})^{\top}\bigr)
= \det(\mathbf{I}_3 - \mathbf{C}),
$$

using $\mathbf{C}\mathbf{C}^\top = \mathbf{I}_3$, then $\det\mathbf{C} = +1$, then that a transpose leaves a determinant alone. But $\mathbf{I}_3 - \mathbf{C} = -(\mathbf{C} - \mathbf{I}_3)$ and scaling a $3\times 3$ matrix by $-1$ multiplies its determinant by $(-1)^3 = -1$. So $\det(\mathbf{C}-\mathbf{I}_3) = -\det(\mathbf{C}-\mathbf{I}_3)$, hence

$$
\det(\mathbf{C} - \mathbf{I}_3) = 0 ,
$$

and $\mathbf{C}$ has eigenvalue $1$. Its unit eigenvector is $\hat{\mathbf{e}}$.

Both of the group's defining properties were used, and each was necessary. A reflection has $\det = -1$ and the argument fails, correctly: a reflection has no fixed axis, only a fixed plane. Note also where the dimension entered — $(-1)^3$ — which is why this theorem is about three dimensions and has no counterpart in four.

Because $\mathbf{C}\hat{\mathbf{e}} = \hat{\mathbf{e}}$, the principal axis has the **same components in both frames**. It is the one direction whose coordinates do not change when you switch between them, which is a handy diagnostic: if a vector you believe is the rotation axis comes out different in the two frames, something else is wrong.

The other two eigenvalues follow. All three have modulus $1$ because a rotation preserves lengths; they multiply to $\det\mathbf{C} = +1$; and complex ones come in conjugate pairs for a real matrix. So the spectrum is

$$
\{\,1,\ e^{i\Phi},\ e^{-i\Phi}\,\},
$$

and the trace, which is the sum of the eigenvalues, gives

$$
\operatorname{tr}\mathbf{C} = 1 + 2\cos\Phi
\qquad\Longrightarrow\qquad
\Phi = \arccos\frac{\operatorname{tr}\mathbf{C} - 1}{2} \in [0, \pi].
$$

::: key Euler rotation theorem and the principal angle
Any orientation of a rigid body relative to a reference frame is reachable by one rotation through a principal angle $\Phi$ about a fixed principal axis $\hat{\mathbf{e}}$. Equivalently, every $\mathbf{C}\in SO(3)$ has eigenvalue $1$ with eigenvector $\hat{\mathbf{e}}$, and eigenvalues $e^{\pm i\Phi}$. Hence $\cos\Phi = (\operatorname{tr}\mathbf{C}-1)/2$, so $\Phi = \arccos\bigl((\operatorname{tr}\mathbf{C}-1)/2\bigr) \in [0,\pi]$. The axis has the same components in both frames. Three parameters always suffice — and always come with a singularity somewhere.
:::

## Rodrigues' rotation formula

Now build the matrix from $(\hat{\mathbf{e}}, \Phi)$. Take a vector $\mathbf{v}$ and split it along and across the axis:

$$
\mathbf{v}_\parallel = (\hat{\mathbf{e}}\cdot\mathbf{v})\,\hat{\mathbf{e}},
\qquad
\mathbf{v}_\perp = \mathbf{v} - \mathbf{v}_\parallel .
$$

Rotating about $\hat{\mathbf{e}}$ leaves $\mathbf{v}_\parallel$ untouched and turns $\mathbf{v}_\perp$ through $\Phi$ inside the plane perpendicular to the axis. In that plane, $\mathbf{v}_\perp$ and $\hat{\mathbf{e}}\times\mathbf{v}_\perp = \hat{\mathbf{e}}\times\mathbf{v}$ are perpendicular and of equal length, so they form an orthogonal basis and the turned vector is

$$
\mathbf{v}' = \mathbf{v}_\parallel + \cos\Phi\,\mathbf{v}_\perp + \sin\Phi\,(\hat{\mathbf{e}}\times\mathbf{v}) .
$$

Convert to matrices with the cross-product matrix $[\hat{\mathbf{e}}\times]$ of module 14. Two identities do the work: $[\hat{\mathbf{e}}\times]\mathbf{v} = \hat{\mathbf{e}}\times\mathbf{v}$, and $[\hat{\mathbf{e}}\times]^2 = \hat{\mathbf{e}}\hat{\mathbf{e}}^\top - \mathbf{I}_3$, so $[\hat{\mathbf{e}}\times]^2\mathbf{v} = \mathbf{v}_\parallel - \mathbf{v} = -\mathbf{v}_\perp$. Writing $\mathbf{v}_\parallel + \cos\Phi\,\mathbf{v}_\perp = \mathbf{v} - (1-\cos\Phi)\mathbf{v}_\perp$,

$$
\mathbf{R}(\hat{\mathbf{e}}, \Phi) = \mathbf{I}_3 + \sin\Phi\,[\hat{\mathbf{e}}\times] + (1-\cos\Phi)\,[\hat{\mathbf{e}}\times]^2 .
$$

This is **Rodrigues' rotation formula**. Its trace confirms the earlier result: $[\hat{\mathbf{e}}\times]$ is traceless and $\operatorname{tr}[\hat{\mathbf{e}}\times]^2 = \operatorname{tr}(\hat{\mathbf{e}}\hat{\mathbf{e}}^\top) - 3 = 1 - 3 = -2$, so $\operatorname{tr}\mathbf{R} = 3 - 2(1-\cos\Phi) = 1 + 2\cos\Phi$.

$\mathbf{R}(\hat{\mathbf{e}},\Phi)$ is an *operator*: it moves a vector within one frame. Applied to attitude, it is the matrix that carries the reference triad onto the body triad, which by lesson 01 is the attitude matrix $\mathbf{C}_{N\leftarrow B}$. The transpose $\mathbf{C}_{B\leftarrow N}$ has the same principal angle and the opposite axis, since $\mathbf{R}(\hat{\mathbf{e}},\Phi)^\top = \mathbf{R}(-\hat{\mathbf{e}},\Phi) = \mathbf{R}(\hat{\mathbf{e}},-\Phi)$. Lesson 11 makes that distinction the whole subject; for now, name the matrix before you name its axis.

### Getting the axis back out

Because $[\hat{\mathbf{e}}\times]^2$ is symmetric and $[\hat{\mathbf{e}}\times]$ is skew, the two halves of Rodrigues' formula separate cleanly:

$$
\mathbf{R} - \mathbf{R}^{\top} = 2\sin\Phi\,[\hat{\mathbf{e}}\times],
\qquad
\mathbf{R} + \mathbf{R}^{\top} = 2\cos\Phi\,\mathbf{I}_3 + 2(1-\cos\Phi)\,\hat{\mathbf{e}}\hat{\mathbf{e}}^{\top} .
$$

The first gives the axis directly from the off-diagonal entries:

$$
\hat{\mathbf{e}} = \frac{1}{2\sin\Phi}
\begin{bmatrix} R_{32} - R_{23}\\ R_{13} - R_{31}\\ R_{21} - R_{12}\end{bmatrix},
$$

and it is the formula to use whenever $\sin\Phi$ is not small. Two cases break it.

- **$\Phi = 0$.** The matrix is $\mathbf{I}_3$, the skew part is zero, and the axis is genuinely undefined: no rotation has no axis. Any unit vector will do, and code should return a fixed default rather than dividing by zero.
- **$\Phi = 180^\circ$.** Here $\sin\Phi = 0$ but the rotation is real, and the skew part vanishes identically — the matrix is symmetric. The axis survives only in the symmetric part. With $\cos\Phi = -1$, the second identity reads $\mathbf{R} + \mathbf{R}^\top = -2\mathbf{I}_3 + 4\hat{\mathbf{e}}\hat{\mathbf{e}}^\top$, so $\hat{\mathbf{e}}\hat{\mathbf{e}}^\top = (\mathbf{R} + \mathbf{I}_3)/2$. Take the diagonal for the magnitudes $\lvert e_i\rvert = \sqrt{(R_{ii}+1)/2}$, pick the largest to avoid dividing by a small number, and take the remaining signs from that row of $\hat{\mathbf{e}}\hat{\mathbf{e}}^\top$. The overall sign is free, because a $180^\circ$ rotation about $\hat{\mathbf{e}}$ and about $-\hat{\mathbf{e}}$ are the same rotation.

Near $180^\circ$ rather than at it, both formulas are poorly conditioned: $\sin\Phi$ is small so the first divides by a small number, and $\arccos$ has infinite slope at its endpoints so $\Phi$ itself is noisy. Lesson 10 gives the branch-selection method that handles the whole range at once, which is why production code extracts a quaternion rather than an axis and angle.

::: example Principal axis and angle of a vehicle attitude
Take the ascent attitude of lesson 02 — heading $15^\circ$, pitch $50^\circ$, bank $5^\circ$ — and ask what single rotation produces it. The attitude matrix is $\mathbf{C}_{N\leftarrow B} = \mathbf{C}_{B\leftarrow N}^{\top}$, and the transpose does not change the trace:

$$
\operatorname{tr}\mathbf{C} = 0.620885 + 0.979530 + 0.640342 = 2.240757,
\qquad
\cos\Phi = \frac{2.240757 - 1}{2} = 0.620379,
$$

so $\Phi = 51.656^\circ$. From the skew part of $\mathbf{C}_{N\leftarrow B}$, with $2\sin\Phi = 1.568605$,

$$
\hat{\mathbf{e}} = (-0.036532,\ 0.972666,\ 0.229318),
\qquad \lVert\hat{\mathbf{e}}\rVert = 1.000000 .
$$

The vehicle's attitude is one turn of $51.66^\circ$ about an axis lying almost along the reference east direction, tipped a little downward — which makes sense, because pitching up by $50^\circ$ is most of what happened and pitch is a rotation about east.

Two checks. First, $\mathbf{C}_{N\leftarrow B}\hat{\mathbf{e}} - \hat{\mathbf{e}} = (0,0,0)$ to machine precision, confirming the eigenvector. Second, rebuilding the matrix from Rodrigues' formula reproduces $\mathbf{C}_{N\leftarrow B}$ to $1.1\times 10^{-16}$. An independent eigendecomposition returns eigenvalues $1$ and $0.620379 \pm 0.784303i$, whose argument is $51.656^\circ$ — the principal angle again, read off the complex pair.
:::

::: example A $180^\circ$ rotation, where the usual formula fails
Rotate by $180^\circ$ about $\hat{\mathbf{e}} = (1, 2, 2)/3$. Rodrigues' formula with $\sin\Phi = 0$ and $1 - \cos\Phi = 2$ gives $\mathbf{R} = \mathbf{I}_3 + 2[\hat{\mathbf{e}}\times]^2 = 2\hat{\mathbf{e}}\hat{\mathbf{e}}^\top - \mathbf{I}_3$:

$$
\mathbf{R} = \begin{bmatrix}
-0.777778 & 0.444444 & 0.444444\\
0.444444 & -0.111111 & 0.888889\\
0.444444 & 0.888889 & -0.111111
\end{bmatrix},
\qquad \operatorname{tr}\mathbf{R} = -1.000000 .
$$

The trace gives $\cos\Phi = -1$ and $\Phi = 180.0^\circ$. The matrix is symmetric, so $\mathbf{R}-\mathbf{R}^\top$ is exactly zero and the axis formula would read $0/0$. Use the symmetric route: $\hat{\mathbf{e}}\hat{\mathbf{e}}^\top = (\mathbf{R}+\mathbf{I}_3)/2$ has diagonal $(0.111111,\ 0.444444,\ 0.444444)$, whose square roots are $(0.333333,\ 0.666667,\ 0.666667)$ — the magnitudes of the axis components. The largest is the second (tied with the third), so divide that row of $\hat{\mathbf{e}}\hat{\mathbf{e}}^\top$ by $0.666667$: $(0.222222, 0.444444, 0.444444)/0.666667 = (0.333333, 0.666667, 0.666667)$. All signs positive, and the answer is $\hat{\mathbf{e}} = (1,2,2)/3$ as built. Negating it describes the same rotation.

Compare with the degenerate-looking but different case $\mathbf{R} = \operatorname{diag}(1,-1,-1)$: the trace is also $-1$, so $\Phi = 180^\circ$ again, and $(\mathbf{R}+\mathbf{I}_3)/2 = \operatorname{diag}(1,0,0)$ gives $\hat{\mathbf{e}} = (1,0,0)$. Its determinant is $+1$, so it is a proper rotation despite two negative entries — a half turn about $x$, not a reflection.
:::

::: example What a principal angle costs in slew time
The same attitude, $\Phi = 51.656^\circ$, is now the error between where a spacecraft points and where it must point. The shortest rotation is about the principal axis, so the manoeuvre is a single-axis slew through $51.656^\circ$.

Size it with a reaction-wheel set that gives $0.02^\circ/\mathrm{s^2}$ of angular acceleration and is rate-limited to $0.5^\circ/\mathrm{s}$. Spinning up to the rate limit takes $t_1 = 0.5/0.02 = 25.0\,\mathrm{s}$ and covers $\tfrac12(0.02)(25)^2 = 6.25^\circ$; braking costs the same, so the two ramps account for $12.50^\circ$. The remaining $51.656 - 12.50 = 39.156^\circ$ is flown at the rate limit in $39.156/0.5 = 78.31\,\mathrm{s}$. Total slew time

$$
t = 2(25.0) + 78.31 = 128.3\,\mathrm{s}.
$$

Any path other than the principal-axis rotation is longer in angle and therefore, at these limits, longer in time. That is why slew planning starts by extracting the principal angle of the error rotation, and why a $180^\circ$ error is the worst case a momentum-limited system has to size for.
:::

::: warning Principal angles do not add
The principal angle is not a distance you can accumulate along a sequence of manoeuvres. Rotate $90^\circ$ about $x$ and then $90^\circ$ about $z$: the product has trace $0.000000$, so $\cos\Phi = -0.5$ and $\Phi = 120.0^\circ$, about the axis $(1,-1,1)/\sqrt{3}$. Two $90^\circ$ turns make a $120^\circ$ turn, not $180^\circ$. Only rotations about a *common* axis compose by adding angles. This is another face of the non-commutativity of $SO(3)$ from lesson 01.
:::

::: warning $\arccos$ is a poor way to measure a small angle
Near $\Phi = 0$, $\operatorname{tr}\mathbf{C} = 1 + 2\cos\Phi \approx 3 - \Phi^2$, so recovering a small $\Phi$ means taking $\arccos$ of a number within $\Phi^2/2$ of $1$. At $\Phi = 10^{-5}\,\mathrm{rad}$ the trace differs from $3$ by $10^{-10}$, close to the round-off floor of a sum of three numbers of order one, and the recovered angle carries several digits of noise. For attitude *errors*, which are small by design, take the angle from the quaternion instead: $\Phi = 2\arcsin\lVert\mathbf{q}_v\rVert$ is accurate right down to zero, because $\lVert\mathbf{q}_v\rVert$ is itself small and suffers no cancellation.
:::

## Check yourself

::: check
A DCM has trace $2.5$. What is its principal angle, and how much does the angle change if the trace is in error by $0.001$?
:::

::: answer
$\cos\Phi = (2.5-1)/2 = 0.75$, so $\Phi = \arccos 0.75 = 41.41^\circ = 0.7227\,\mathrm{rad}$. For the sensitivity, differentiate $\cos\Phi = (\operatorname{tr}-1)/2$: $-\sin\Phi\,d\Phi = d(\operatorname{tr})/2$, so $d\Phi = -d(\operatorname{tr})/(2\sin\Phi) = -0.001/(2\times 0.6614) = -7.6\times 10^{-4}\,\mathrm{rad} = -0.043^\circ$. A part-per-thousand error in the trace moves the angle by four hundredths of a degree here — acceptable. The same calculation at $\Phi = 1^\circ$ gives $\sin\Phi = 0.01745$ and $d\Phi = 0.029\,\mathrm{rad} = 1.6^\circ$, which is useless. The amplification is $1/(2\sin\Phi)$, and it is why small angles are read from the quaternion.
:::

::: check
Prove that the principal axis has the same components in the reference frame and the body frame.
:::

::: answer
By definition $\hat{\mathbf{e}}$ satisfies $\mathbf{C}_{B\leftarrow N}\hat{\mathbf{e}} = \hat{\mathbf{e}}$ (eigenvalue $1$; the transpose has the same eigenvector for eigenvalue $1$ since $\mathbf{C}^\top\hat{\mathbf{e}} = \mathbf{C}^{-1}\hat{\mathbf{e}} = \hat{\mathbf{e}}$). The left-hand side is by definition the vector's components in $B$ when $\hat{\mathbf{e}}$ holds its components in $N$. So $\hat{\mathbf{e}}^{B} = \hat{\mathbf{e}}^{N}$: the same three numbers. Geometrically, the axis is the one direction the rotation does not move, so both frames see it identically, and it is the reason a rotation's axis is a natural physical object while its angle needs a sign convention.
:::

::: check
Show that $\mathbf{R}(\hat{\mathbf{e}},\Phi)^\top = \mathbf{R}(\hat{\mathbf{e}}, -\Phi) = \mathbf{R}(-\hat{\mathbf{e}}, \Phi)$ from Rodrigues' formula.
:::

::: answer
$\mathbf{R} = \mathbf{I}_3 + \sin\Phi[\hat{\mathbf{e}}\times] + (1-\cos\Phi)[\hat{\mathbf{e}}\times]^2$. Transposing: $\mathbf{I}_3$ is symmetric, $[\hat{\mathbf{e}}\times]^\top = -[\hat{\mathbf{e}}\times]$ because it is skew, and $([\hat{\mathbf{e}}\times]^2)^\top = ([\hat{\mathbf{e}}\times]^\top)^2 = [\hat{\mathbf{e}}\times]^2$. So $\mathbf{R}^\top = \mathbf{I}_3 - \sin\Phi[\hat{\mathbf{e}}\times] + (1-\cos\Phi)[\hat{\mathbf{e}}\times]^2$. Replacing $\Phi$ by $-\Phi$ flips the sine and leaves the cosine, giving the same thing. Replacing $\hat{\mathbf{e}}$ by $-\hat{\mathbf{e}}$ flips $[\hat{\mathbf{e}}\times]$ and leaves $[\hat{\mathbf{e}}\times]^2$, giving the same thing again. So turning backward about an axis and forward about the reversed axis are one rotation, which is why the pair $(\hat{\mathbf{e}},\Phi)$ and $(-\hat{\mathbf{e}},-\Phi)$ are never distinguishable.
:::

::: check
A star tracker measures an attitude whose error relative to the commanded attitude has trace $2.9999998$. Express the pointing error in arcseconds, and comment on whether you would trust the number.
:::

::: answer
$\cos\Phi = (2.9999998-1)/2 = 0.9999999$, so $\Phi = \arccos(0.9999999) = 4.472\times 10^{-4}\,\mathrm{rad}$. In arcseconds, multiply by $206265$: $92.2''$, about $0.026^\circ$. Whether to trust it depends on how the trace was formed. The trace is a sum of three numbers near $1$ whose departure from $3$ is $2\times 10^{-7}$; in double precision the sum carries absolute error of order $10^{-16}$, so the relative error in $3 - \operatorname{tr}$ is about $5\times 10^{-10}$ and the angle is good to five digits. In single precision, with a round-off floor near $10^{-7}$, the same calculation would be pure noise. The robust alternative is $\Phi = 2\arcsin\lVert\mathbf{q}_v\rVert$ from the error quaternion.
:::

::: check
A spacecraft must slew $118^\circ$ with the wheels of the worked example ($0.02^\circ/\mathrm{s^2}$, rate limit $0.5^\circ/\mathrm{s}$). How long does it take, and what fraction of the time is spent at the rate limit?
:::

::: answer
The ramps are unchanged: $25.0\,\mathrm{s}$ each, $6.25^\circ$ each, $12.50^\circ$ total. The cruise covers $118 - 12.50 = 105.50^\circ$ at $0.5^\circ/\mathrm{s}$, taking $211.0\,\mathrm{s}$. Total $2(25.0) + 211.0 = 261.0\,\mathrm{s}$, of which $211.0/261.0 = 80.8\%$ is at the rate limit. Doubling the slew angle from $51.66^\circ$ to $118^\circ$ — a factor $2.28$ — raised the time only from $128.3\,\mathrm{s}$ to $261.0\,\mathrm{s}$, a factor $2.03$, because the fixed ramp cost is amortised over a longer cruise.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Euler rotation theorem | One axis $\hat{\mathbf{e}}$ and one angle $\Phi$ reach any orientation |
| $\det(\mathbf{C}-\mathbf{I}_3) = 0$ | Proof: eigenvalue $1$ exists for every $\mathbf{C}\in SO(3)$ |
| Eigenvalues $\{1, e^{i\Phi}, e^{-i\Phi}\}$ | Principal angle is the argument of the complex pair |
| $\cos\Phi = (\operatorname{tr}\mathbf{C}-1)/2$ | $\Phi = \arccos(\cdot)\in[0,\pi]$ |
| $\hat{\mathbf{e}}^{B} = \hat{\mathbf{e}}^{N}$ | The axis has the same components in both frames |
| $\mathbf{R} = \mathbf{I}_3 + \sin\Phi[\hat{\mathbf{e}}\times] + (1-\cos\Phi)[\hat{\mathbf{e}}\times]^2$ | Rodrigues' rotation formula |
| $\mathbf{R}-\mathbf{R}^\top = 2\sin\Phi[\hat{\mathbf{e}}\times]$ | Axis from the skew part, when $\sin\Phi$ is not small |
| $\hat{\mathbf{e}}\hat{\mathbf{e}}^\top = (\mathbf{R}+\mathbf{R}^\top-2\cos\Phi\,\mathbf{I}_3)/(2(1-\cos\Phi))$ | Axis from the symmetric part; the route at $\Phi = 180^\circ$ |
| $\mathbf{R}^\top = \mathbf{R}(\hat{\mathbf{e}},-\Phi) = \mathbf{R}(-\hat{\mathbf{e}},\Phi)$ | Reversing the angle or the axis gives the same matrix |
| Worked figures | $(15^\circ,50^\circ,5^\circ)$ is $\Phi = 51.656^\circ$ about $(-0.0365, 0.9727, 0.2293)$; $128.3\,\mathrm{s}$ to slew it |

One axis and one angle is the minimal honest description, and $\arccos$ of a trace is a poor way to compute it. The next lesson replaces the angle by its half and the axis by a scaled copy, which removes the trigonometric awkwardness entirely — and introduces a family of conventions that cause more flight software bugs than everything else in this module combined.
