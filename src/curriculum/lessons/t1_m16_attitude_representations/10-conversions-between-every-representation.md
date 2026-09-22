---
id: l10-conversions-between-every-representation
title: Conversions between every representation
minutes: 20
covers:
  - conversions between every representation
---

Five representations are now on the table: the direction cosine matrix, Euler angles, the principal axis and angle, the unit quaternion, and the two Rodrigues parameter sets. Real software holds several of them at once — a quaternion in the estimator, a matrix in the measurement model, Euler angles on the operator display, modified Rodrigues parameters in the filter's error state — and converts between them thousands of times a second. This lesson is the conversion table, and more importantly it is the two places where a naive conversion loses accuracy or fails outright.

The design principle first. With five representations, writing every pair directly means twenty routines, each with its own edge cases, and twenty places to get a sign wrong. Instead make the **quaternion the hub**: every representation converts to and from the quaternion, and any other pair is a composition of two hops. That is ten routines, each short, and the sign conventions live in one place. The only reason ever to write a direct spoke-to-spoke conversion is measured performance, and DCM-to-Euler is usually the only one that earns it.

Conventions remain those of lesson 05: unit, scalar-first, Hamilton, $q = [w,\mathbf{v}] = [w,x,y,z]$, $\mathbf{C}(q_1\otimes q_2) = \mathbf{C}(q_1)\mathbf{C}(q_2)$, and the attitude matrix is $\mathbf{C}_{N\leftarrow B} = \mathbf{C}(q_{N\leftarrow B})$.

## Axis-angle and the quaternion

The definition is the conversion:

$$
q = \bigl[\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)\bigr],
\qquad
\Phi = 2\arctan\!\bigl(\lVert\mathbf{v}\rVert,\ w\bigr),
\qquad
\hat{\mathbf{e}} = \frac{\mathbf{v}}{\lVert\mathbf{v}\rVert} .
$$

Use the two-argument arctangent, not $2\arccos w$, for two reasons: it is well conditioned for small angles, where $\arccos$ of a number near $1$ throws away half the digits (lesson 04), and it handles the full range $[0^\circ,360^\circ)$ without the sign trap of lesson 07. When $\lVert\mathbf{v}\rVert$ falls below about $10^{-10}$ the axis is not determined; return a fixed default such as $\hat{\mathbf{x}}$ with $\Phi = 0$ rather than dividing.

## Quaternion to DCM

$$
\mathbf{C}(q) = (w^2 - \mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top + 2w\,[\mathbf{v}\times]
=
\begin{bmatrix}
w^2{+}x^2{-}y^2{-}z^2 & 2(xy - wz) & 2(xz + wy)\\
2(xy + wz) & w^2{-}x^2{+}y^2{-}z^2 & 2(yz - wx)\\
2(xz - wy) & 2(yz + wx) & w^2{-}x^2{-}y^2{+}z^2
\end{bmatrix}.
$$

This direction is unconditionally safe: it is polynomial, there is no division and no branch, and the output is orthonormal to round-off for any unit input. Two free checks: $\operatorname{tr}\mathbf{C} = 4w^2 - 1$, and $\mathbf{C}(-q) = \mathbf{C}(q)$.

## DCM to quaternion: the Shepperd branch selection

This is the dangerous direction, and the reason is a square root of a quantity that can vanish.

Read the four diagonal combinations off the matrix above. Using $w^2+x^2+y^2+z^2 = 1$ to eliminate the redundancy,

$$
1 + \operatorname{tr}\mathbf{C} = 4w^2, \quad
1 + 2C_{11} - \operatorname{tr}\mathbf{C} = 4x^2, \quad
1 + 2C_{22} - \operatorname{tr}\mathbf{C} = 4y^2, \quad
1 + 2C_{33} - \operatorname{tr}\mathbf{C} = 4z^2,
$$

verified over $500$ random rotations to $6.1\times 10^{-16}$. Each gives one component's magnitude; the remaining three come from the off-diagonal entries, which pair up as

$$
C_{32} - C_{23} = 4wx,\quad
C_{13} - C_{31} = 4wy,\quad
C_{21} - C_{12} = 4wz,
$$

$$
C_{12} + C_{21} = 4xy,\quad
C_{13} + C_{31} = 4xz,\quad
C_{23} + C_{32} = 4yz .
$$

The **naive trace formula** takes the first route always: $w = \tfrac12\sqrt{1+\operatorname{tr}\mathbf{C}}$, then divide the three skew differences by $4w$. It is correct, and it collapses as $w\to 0$ — which is $\Phi\to 180^\circ$, the commonest large slew there is.

The **Shepperd** method, popularised in attitude work by Markley, computes all four candidates, picks the largest, takes that component from its square root, and divides the other three by it. Because the four sum to $4(w^2+x^2+y^2+z^2) = 4$, the largest is always at least $1$, so the denominator $4s$ is never smaller than $2$. The branch is never ill-conditioned.

```python
import numpy as np

def quat_from_dcm(C):
    """Unit scalar-first quaternion from a rotation matrix, Shepperd branches."""
    tr = C[0, 0] + C[1, 1] + C[2, 2]
    cand = (1.0 + tr, 1.0 + 2.0 * C[0, 0] - tr,
            1.0 + 2.0 * C[1, 1] - tr, 1.0 + 2.0 * C[2, 2] - tr)
    k = int(np.argmax(cand))
    s = 0.5 * np.sqrt(cand[k])
    if k == 0:
        q = [s, (C[2, 1] - C[1, 2]) / (4 * s),
                (C[0, 2] - C[2, 0]) / (4 * s), (C[1, 0] - C[0, 1]) / (4 * s)]
    elif k == 1:
        q = [(C[2, 1] - C[1, 2]) / (4 * s), s,
             (C[0, 1] + C[1, 0]) / (4 * s), (C[0, 2] + C[2, 0]) / (4 * s)]
    elif k == 2:
        q = [(C[0, 2] - C[2, 0]) / (4 * s), (C[0, 1] + C[1, 0]) / (4 * s),
             s, (C[1, 2] + C[2, 1]) / (4 * s)]
    else:
        q = [(C[1, 0] - C[0, 1]) / (4 * s), (C[0, 2] + C[2, 0]) / (4 * s),
             (C[1, 2] + C[2, 1]) / (4 * s), s]
    q = np.array(q)
    return -q if q[0] < 0.0 else q            # shortest-path representative
```

::: example How badly the naive formula fails near $180^\circ$
Take rotations about $\hat{\mathbf{e}} = (1,2,2)/3$ and convert the matrix back to a quaternion by both methods, then rebuild the matrix and compare with the original.

| $\Phi$ | $1+\operatorname{tr}\mathbf{C}$ | naive, $\max\lvert\Delta\mathbf{C}\rvert$ | Shepperd, $\max\lvert\Delta\mathbf{C}\rvert$ | branch used |
| --- | --- | --- | --- | --- |
| $45^\circ$ | $3.414$ | $0$ | $0$ | $w$ |
| $90^\circ$ | $2.000$ | $5.6\times 10^{-17}$ | $5.6\times 10^{-17}$ | $w$ |
| $170^\circ$ | $3.04\times 10^{-2}$ | $2.7\times 10^{-15}$ | $1.1\times 10^{-16}$ | $y$ |
| $179^\circ$ | $3.05\times 10^{-4}$ | $4.8\times 10^{-13}$ | $0$ | $y$ |
| $179.9^\circ$ | $3.05\times 10^{-6}$ | $3.6\times 10^{-11}$ | $3.3\times 10^{-16}$ | $y$ |
| $179.99^\circ$ | $3.05\times 10^{-8}$ | $3.4\times 10^{-9}$ | $0$ | $y$ |
| $180^\circ$ | $2.2\times 10^{-16}$ | $0.889$ | $0$ | $y$ |

The naive error grows like $1/w$, which is like $1/\sqrt{1+\operatorname{tr}\mathbf{C}}$, losing a digit every time the rotation gets ten times closer to $180^\circ$. At exactly $180^\circ$ the trace is $-1$ and the sum $1+\operatorname{tr}\mathbf{C}$ is a pure round-off residue, here $2.2\times 10^{-16}$; the formula then divides by $4w = 3\times 10^{-8}$ and returns a matrix wrong by almost one. Shepperd's error never leaves the last bit, because at $180^\circ$ the largest candidate is $4y^2 = 4\times(2/3)^2 = 1.778$ and the divisor is $2.67$.

A sterner test: over $20{,}000$ uniformly random rotations, the worst naive reconstruction error is $1.25\times 10^{-9}$, while Shepperd's worst error in both the matrix and the quaternion components is $6.1\times 10^{-16}$ — better by a factor of two million, for the cost of three comparisons.

The exact half-turn $\mathbf{C} = \operatorname{diag}(1,-1,-1)$ makes the point cleanly. Here $1 + \operatorname{tr}\mathbf{C} = 0.0$ exactly, so the naive formula divides by zero. Shepperd selects the $x$ branch and returns $[0, 1, 0, 0]$ — unit norm, and rebuilding the matrix from it reproduces $\operatorname{diag}(1,-1,-1)$ to exactly zero.
:::

## Euler angles and the quaternion

Going in, the 3-2-1 sequence is a product of three elementary quaternions, one per turn:

$$
q_{N\leftarrow B} = q_z(\psi)\otimes q_y(\theta)\otimes q_x(\phi),
\qquad q_z(\psi) = [\cos\tfrac{\psi}{2},\,0,\,0,\,\sin\tfrac{\psi}{2}],
$$

and similarly for the other two axes. Multiplied out, with half-angle abbreviations $c_\psi = \cos(\psi/2)$ and so on,

$$
q =
\begin{bmatrix}
c_\psi c_\theta c_\phi + s_\psi s_\theta s_\phi\\
c_\psi c_\theta s_\phi - s_\psi s_\theta c_\phi\\
c_\psi s_\theta c_\phi + s_\psi c_\theta s_\phi\\
s_\psi c_\theta c_\phi - c_\psi s_\theta s_\phi
\end{bmatrix}.
$$

Coming out, read the same three entries lesson 02 used, now expressed in quaternion components:

$$
\psi = \operatorname{atan2}\bigl(2(xy + wz),\ 1 - 2(y^2+z^2)\bigr),
\quad
\theta = \arcsin\bigl(2(wy - xz)\bigr),
\quad
\phi = \operatorname{atan2}\bigl(2(yz + wx),\ 1 - 2(x^2+y^2)\bigr).
$$

Both directions were checked against the elementary-matrix route over $500$ random attitudes and agree to $2.7\times 10^{-14}$. Clamp the $\arcsin$ argument to $[-1,1]$, and remember that this conversion inherits the gimbal-lock singularity of lesson 03 — it is a property of Euler angles, not of the route taken to them.

## Rodrigues parameters and the quaternion

$$
\mathbf{g} = \frac{\mathbf{v}}{w},
\qquad
q = \frac{[\,1,\ \mathbf{g}\,]}{\sqrt{1+\mathbf{g}^\top\mathbf{g}}};
\qquad\qquad
\boldsymbol{\sigma} = \frac{\mathbf{v}}{1+w},
\qquad
q = \frac{\bigl[\,1-\boldsymbol{\sigma}^\top\boldsymbol{\sigma},\ 2\boldsymbol{\sigma}\,\bigr]}{1+\boldsymbol{\sigma}^\top\boldsymbol{\sigma}} .
$$

Canonicalise the quaternion to $w \ge 0$ before forming either, and apply the shadow-set switch of lesson 09 to the MRP afterwards so $\lVert\boldsymbol{\sigma}\rVert \le 1$. The Gibbs conversion has no safe version near $\Phi = 180^\circ$; that singularity is intrinsic to the parameters.

::: key The conversion map
| From $\to$ To | Route |
| --- | --- |
| axis-angle $\to$ quaternion | $[\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)]$ |
| quaternion $\to$ axis-angle | $\Phi = 2\operatorname{atan2}(\lVert\mathbf{v}\rVert, w)$, $\hat{\mathbf{e}} = \mathbf{v}/\lVert\mathbf{v}\rVert$ |
| quaternion $\to$ DCM | $(w^2-\mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top + 2w[\mathbf{v}\times]$ |
| DCM $\to$ quaternion | Shepperd: largest of $1+\operatorname{tr}$, $1+2C_{ii}-\operatorname{tr}$ |
| Euler 3-2-1 $\to$ quaternion | $q_z(\psi)\otimes q_y(\theta)\otimes q_x(\phi)$ |
| quaternion $\to$ Euler 3-2-1 | Two `atan2`, one clamped `asin` |
| quaternion $\to$ CRP, MRP | $\mathbf{g} = \mathbf{v}/w$; $\boldsymbol{\sigma} = \mathbf{v}/(1+w)$ |
| CRP, MRP $\to$ quaternion | $[1,\mathbf{g}]/\sqrt{1+\mathbf{g}^\top\mathbf{g}}$; $[1-\boldsymbol{\sigma}^\top\boldsymbol{\sigma},\,2\boldsymbol{\sigma}]/(1+\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$ |
:::

::: example One attitude in all five representations
Take a rotation of $\Phi = 137.000^\circ$ about $\hat{\mathbf{e}} = (0.300587,\ -0.500978,\ 0.811584)$.

$$
q = [\,0.366501,\ 0.279671,\ -0.466119,\ 0.755112\,],
\qquad \lVert q\rVert = 1.000000 .
$$

The DCM is $\mathbf{C}(q)$, with trace $4w^2 - 1 = 4(0.366501)^2 - 1 = -0.462707$, consistent with $1 + 2\cos 137^\circ = -0.462707$. Shepperd's method applied to that matrix returns $q$ back to $5.6\times 10^{-17}$ per component, choosing the $z$ branch since $4z^2 = 2.281$ is the largest of the four candidates.

The 3-2-1 angles are $\psi = 153.012509^\circ$, $\theta = -49.820974^\circ$, $\phi = -50.655052^\circ$. Rebuilding the matrix from $\mathbf{R}_1(\phi)\mathbf{R}_2(\theta)\mathbf{R}_3(\psi)$ and transposing reproduces it to $2.4\times 10^{-16}$, and the half-angle product formula above returns the same quaternion to $10^{-8}$ in the printed digits.

The classical Rodrigues parameters are $\mathbf{g} = \mathbf{v}/w = (0.763084,\ -1.271806,\ 2.060326)$, with $\lVert\mathbf{g}\rVert = 2.538648 = \tan(68.5^\circ)$. The modified set is $\boldsymbol{\sigma} = \mathbf{v}/(1+w) = (0.204662,\ -0.341104,\ 0.552588)$, with $\lVert\boldsymbol{\sigma}\rVert = 0.680876 = \tan(34.25^\circ)$ — inside the unit ball, so no shadow switch. Both rebuild the matrix to $2.2\times 10^{-16}$.

Note the spread in magnitude at a single, unremarkable attitude: the quaternion components are all below $0.76$, the MRP below $0.56$, and the Gibbs vector has a component above $2$ and a norm of $2.54$. Extrapolate that toward $180^\circ$ and the argument of lesson 09 is visible in one line of numbers.
:::

## Testing conversions

Conversions are the part of an attitude library where property tests pay for themselves, because the identities are exact and the failures are at edges that hand-picked cases miss. Four properties cover most of it.

1. **Round trip, up to sign.** For random unit $q$ with $w\ge 0$, `quat_from_dcm(dcm_from_quat(q))` must return $q$. The canonicalisation is what makes this testable at all; without it, half the results differ by an overall sign that is not an error.
2. **Structural validity of every generated matrix.** $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$ to $10^{-12}$ and $\lvert\det\mathbf{C}-1\rvert < 10^{-12}$, for random inputs.
3. **Composition consistency.** $\mathbf{C}(q_1\otimes q_2) = \mathbf{C}(q_1)\mathbf{C}(q_2)$ to $10^{-10}$. This is the one that catches a convention mismatch, because it tests the algebra rather than any single conversion.
4. **Deliberate edge cases.** The identity; $180^\circ$ about each coordinate axis and about a general axis; $\Phi$ at $10^{-8}$; pitch at $\pm 90^\circ$ for the Euler routines; $\lVert\boldsymbol{\sigma}\rVert$ just above and just below $1$.

Random testing alone will not find the $180^\circ$ problem: a uniformly distributed rotation lands within $0.01^\circ$ of a half turn about once in $10^{7}$ draws, which is why the naive formula's worst error over $20{,}000$ samples was a tolerable $1.25\times 10^{-9}$ rather than the catastrophic $0.889$ the deliberate case produced.

::: warning Round-tripping through Euler angles destroys information near gimbal lock
Converting quaternion to Euler angles and back is lossless only away from $\theta = \pm 90^\circ$. At the singularity the map is not injective, so the angles cannot determine the attitude, and near it the recovered $\psi$ and $\phi$ are dominated by round-off in a ratio whose numerator and denominator both approach zero. Never use Euler angles as the interchange format between two systems that both hold a quaternion, however convenient the message definition; convert for display and throw the angles away.
:::

::: warning Normalise the input, and canonicalise the output
Two habits close most of the remaining gaps. On the way in, normalise any quaternion that has been integrated, transmitted or interpolated, because the matrix formula assumes $\lVert q\rVert = 1$ and silently produces a scaled non-rotation if it is not. On the way out of a DCM-to-quaternion conversion, force $w\ge 0$, so that two calls with the same input always give the same answer and a round-trip test is meaningful. Neither costs anything measurable and both eliminate a class of intermittent failures.
:::

## Check yourself

::: check
A DCM has trace $-0.9$ and diagonal $(0.1,\ -0.6,\ -0.4)$. Which Shepperd branch is selected, and what is that component's magnitude?
:::

::: answer
The four candidates are $1 + \operatorname{tr} = 0.1$; $1 + 2(0.1) - (-0.9) = 2.1$; $1 + 2(-0.6) + 0.9 = 0.7$; $1 + 2(-0.4) + 0.9 = 1.1$. They sum to $0.1+2.1+0.7+1.1 = 4.0$, as they must. The largest is the second, $4x^2 = 2.1$, so the $x$ branch is used and $\lvert x\rvert = \tfrac12\sqrt{2.1} = 0.7246$. The naive route would have used $w = \tfrac12\sqrt{0.1} = 0.1581$ and divided by $0.6325$ — a factor of $4.6$ worse in conditioning than the $4s = 2.898$ the Shepperd branch divides by. The principal angle here is $\arccos((-0.9-1)/2) = \arccos(-0.95) = 161.8^\circ$.
:::

::: check
Why does the naive trace formula lose accuracy like $1/\sqrt{1+\operatorname{tr}\mathbf{C}}$ rather than like $1/(1+\operatorname{tr}\mathbf{C})$?
:::

::: answer
The trace is a sum of three entries each of order one, so its absolute round-off error is a fixed $\varepsilon$ of order $10^{-16}$, independent of how close the rotation is to $180^\circ$. That error passes into $w = \tfrac12\sqrt{1+\operatorname{tr}}$ as $\delta w \approx \varepsilon/(8w)$ — already amplified. The three remaining components are then formed by dividing quantities of order $w$ by $4w$, which propagates $\delta w/w$ into the result. Combining, the relative error goes like $\varepsilon/w^2$, and since $w = \tfrac12\sqrt{1+\operatorname{tr}}$ the error in the reconstructed matrix behaves like $\varepsilon/(1+\operatorname{tr})$. The table bears this out: from $179^\circ$ to $179.9^\circ$, $1+\operatorname{tr}$ falls by $100$ and the error rises from $4.8\times 10^{-13}$ to $3.6\times 10^{-11}$, a factor of $75$.
:::

::: check
Given $q = [0.5,\ 0.5,\ 0.5,\ 0.5]$, find the DCM, the principal axis and angle, the MRP, and the Gibbs vector.
:::

::: answer
The norm is $\sqrt{4\times 0.25} = 1$, good. From the matrix formula, $C_{11} = w^2+x^2-y^2-z^2 = 0.25+0.25-0.25-0.25 = 0$, and by symmetry all three diagonal entries are $0$, so $\operatorname{tr}\mathbf{C} = 0$ — which also follows from $4w^2-1 = 0$. Off-diagonals: $C_{12} = 2(xy-wz) = 2(0.25-0.25) = 0$, $C_{21} = 2(xy+wz) = 1$, and cyclically, so $\mathbf{C}$ is the permutation matrix sending $\hat{\mathbf{x}}\to\hat{\mathbf{y}}\to\hat{\mathbf{z}}\to\hat{\mathbf{x}}$. The angle is $\Phi = 2\operatorname{atan2}(\sqrt{0.75},\ 0.5) = 2\times 60^\circ = 120^\circ$, about $\hat{\mathbf{e}} = (0.5,0.5,0.5)/0.866025 = (1,1,1)/\sqrt3$. The Gibbs vector is $\mathbf{v}/w = (1,1,1)$, with norm $\sqrt3 = \tan 60^\circ$. The MRP is $\mathbf{v}/(1+w) = (1/3,1/3,1/3)$, with norm $0.57735 = \tan 30^\circ$, inside the unit ball.
:::

::: check
A test asserts `quat_from_dcm(dcm_from_quat(q)) == q` for random $q$ and fails about half the time with every component negated. What is wrong, and is it a bug?
:::

::: answer
It is a bug in the test, not in the conversion. $\mathbf{C}(q) = \mathbf{C}(-q)$, so the matrix cannot carry the sign, and the conversion has to choose one. The fix is to canonicalise both sides: force $w\ge 0$ on the input before building the matrix and on the output of the conversion, or else compare up to sign by testing $\lvert q_{\text{out}}\cdot q_{\text{in}}\rvert > 1-\epsilon$. The second form is the more robust because it also passes at $w = 0$, where canonicalisation itself is ambiguous. What would be a genuine bug is a conversion that returns inconsistent signs for the same input on different calls, which is why the canonicalisation belongs inside the routine.
:::

::: check
You need the 3-2-1 angles from a DCM, at $100\,\mathrm{Hz}$, for a display. Would you route through the quaternion or convert directly, and why?
:::

::: answer
Directly. The DCM-to-Euler conversion is three entries and three inverse trigonometric calls, with no square roots and no branch selection, whereas the quaternion route adds a Shepperd conversion and a second set of trigonometry for no gain — the Euler singularity is present either way. This is the one spoke-to-spoke conversion that is routinely worth writing, and the hub-and-spoke rule is a default, not a law. Note also that a display at $100\,\mathrm{Hz}$ is a display: nothing downstream should consume those angles, so the accuracy loss near $\theta = \pm 90^\circ$ is acceptable where it would not be in a control path.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Hub and spoke | Every representation converts through the quaternion: ten routines, not twenty |
| $q\to\mathbf{C}$ | Polynomial, no branches, always safe; check $\operatorname{tr} = 4w^2-1$ |
| $1+\operatorname{tr}\mathbf{C} = 4w^2$, $1+2C_{ii}-\operatorname{tr}\mathbf{C} = 4q_i^2$ | The four Shepperd candidates; they sum to $4$ |
| Shepperd rule | Take the largest candidate, so the divisor is never below $2$ |
| Naive trace formula | Error grows like $1/(1+\operatorname{tr}\mathbf{C})$; fails outright at $\Phi = 180^\circ$ |
| $q = q_z(\psi)\otimes q_y(\theta)\otimes q_x(\phi)$ | 3-2-1 into a quaternion |
| $\theta = \arcsin(2(wy-xz))$, two `atan2` | 3-2-1 out of a quaternion; clamp the `asin` |
| $\mathbf{g} = \mathbf{v}/w$, $\boldsymbol{\sigma} = \mathbf{v}/(1+w)$ | Rodrigues parameters from the quaternion |
| Property tests | Round trip up to sign; $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$, $\det = +1$; composition consistency; edge cases |
| Worked figures | At $180^\circ$: naive error $0.889$, Shepperd $0$; over $20{,}000$ random rotations, $1.25\times 10^{-9}$ against $6.1\times 10^{-16}$ |

Every conversion in this module is now written down and tested. The next lesson returns to a distinction that has been deferred three times and which transposes half of these formulas if it is decided the other way.
