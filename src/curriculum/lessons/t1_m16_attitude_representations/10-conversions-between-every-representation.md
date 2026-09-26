---
id: l10-conversions-between-every-representation
title: Conversions between every representation
minutes: 21
covers:
  - conversions between every representation
---

Imagine a meeting with six people who each speak a different language. You could hire a translator for every pair of languages — thirty of them, if each one only works in one direction. Or you could agree that everyone translates into one shared language and back out of it. Then you need only ten translators, and if one of them makes a mistake, you know exactly where to look.

Attitude software has the same problem. You now know six ways to write down an attitude: the **direction cosine matrix** (DCM, the $3\times 3$ rotation matrix), the **3-2-1 Euler angles** (yaw, pitch, roll), the **principal axis and angle** (one turn about one line), the **unit quaternion** (four numbers with the half-angle inside), and the two **Rodrigues parameter** sets — classical (Gibbs) and modified (MRP). Real flight software holds several of these at once. A typical vehicle keeps a quaternion in its estimator, a matrix in its measurement model, Euler angles on the operator's display, and modified Rodrigues parameters in its filter's error state. It converts between them thousands of times a second.

This lesson is the full conversion table. More importantly, it shows the two places where a careless conversion loses accuracy or fails outright: turning a matrix back into a quaternion near a half turn, and turning anything into Euler angles near gimbal lock.

## One hub, many spokes

Here is the design rule first. With six representations, writing a direct routine for every ordered pair means $6\times 5 = 30$ routines. Each has its own edge cases, and each is one more place to get a sign wrong.

Instead, make the quaternion the **[[hub|hub-and-spoke]]**: the one representation every other converts to and from. Each of the other five is a **spoke**, with one routine in and one routine out. That is $5\times 2 = 10$ routines, each short, and the sign conventions live in one place. Any other pair — Euler angles to MRP, say — is two hops: Euler to quaternion, then quaternion to MRP.

The only reason to write a direct spoke-to-spoke routine is speed that you have actually measured. DCM-to-Euler is usually the only one that earns it.

The conventions are the ones lesson 05 fixed for this whole module: unit, scalar-first, Hamilton. Written out, $q = [w,\mathbf{v}] = [w,x,y,z]$ — $w$ is the scalar part and $\mathbf{v} = (x, y, z)$ the vector part. Composition obeys $\mathbf{C}(q_1\otimes q_2) = \mathbf{C}(q_1)\mathbf{C}(q_2)$, and the attitude matrix is $\mathbf{C}_{N\leftarrow B} = \mathbf{C}(q_{N\leftarrow B})$, read "C, N from B": it turns body components into reference components.

## Axis-angle and the quaternion

This pair is the easiest, because the quaternion is *defined* from the axis and angle. Going in:

$$
q = \bigl[\cos(\Phi/2),\ \hat{\mathbf{e}}\sin(\Phi/2)\bigr].
$$

Coming out, you undo it:

$$
\Phi = 2\operatorname{atan2}\bigl(\lVert\mathbf{v}\rVert,\ w\bigr),
\qquad
\hat{\mathbf{e}} = \frac{\mathbf{v}}{\lVert\mathbf{v}\rVert} .
$$

Here $\lVert\mathbf{v}\rVert$ ("the norm of v") is the length of the vector part, which equals $\sin(\Phi/2)$. And $w$ equals $\cos(\Phi/2)$. So the pair $(\lVert\mathbf{v}\rVert, w)$ is a sine and a cosine of the same half-angle, and `atan2` hands back that half-angle.

You might ask why not use $\Phi = 2\arccos w$, which looks simpler. There are two reasons.

- **Small angles.** For a tiny turn, $w$ is a number like $0.99999999\ldots$, and [[arccos throws away digits|arccos-small]] near $1$ (lesson 04 showed why). The `atan2` form reads the angle off $\lVert\mathbf{v}\rVert$, which is small but carries all its digits.
- **Big angles.** `atan2` of a positive length and any $w$ gives a half-angle between $0^\circ$ and $180^\circ$. So $\Phi$ comes out between $0^\circ$ and $360^\circ$, whatever the sign of $w$, and the sign trap of lesson 07 never springs.

One more guard. When $\lVert\mathbf{v}\rVert$ falls below about $10^{-10}$, the rotation is essentially zero and the axis is not determined — every axis works for no turn at all. Do not divide by a length that small. Return a fixed default, such as $\hat{\mathbf{x}}$ with $\Phi = 0$.

## Quaternion to DCM

This direction is a single formula:

$$
\mathbf{C}(q) = (w^2 - \mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top + 2w\,[\mathbf{v}\times]
=
\begin{bmatrix}
w^2{+}x^2{-}y^2{-}z^2 & 2(xy - wz) & 2(xz + wy)\\
2(xy + wz) & w^2{-}x^2{+}y^2{-}z^2 & 2(yz - wx)\\
2(xz - wy) & 2(yz + wx) & w^2{-}x^2{-}y^2{+}z^2
\end{bmatrix}.
$$

Read the pieces this way. $\mathbf{I}_3$ is the $3\times 3$ identity. $\mathbf{v}\mathbf{v}^\top$ is the $3\times 3$ table of products $x^2, xy, xz, \ldots$. And $[\mathbf{v}\times]$ is the cross-product matrix of lesson 04, the matrix that does "$\mathbf{v}$ cross" when it multiplies a vector.

This direction is always safe. Every entry is a sum of products of the four components — there is no division, no square root, no "if". For any unit input, the output is a proper rotation matrix to within round-off.

It also comes with two free checks. Add up the diagonal: $\operatorname{tr}\mathbf{C} = 4w^2 - 1$ (the **trace**, read "trace of C", is the sum of the diagonal entries). And every term is a product of two components, so flipping all four signs changes nothing: $\mathbf{C}(-q) = \mathbf{C}(q)$.

::: key DCM from a unit quaternion
For $q = [w, x, y, z]$, scalar-first: $\mathbf{C} = (w^2 - \mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top \pm 2w[\mathbf{v}\times]$. The sign of the last term flips with the active/passive convention: this module's Hamilton $\mathbf{C}(q)$ uses $+2w[\mathbf{v}\times]$, and texts whose matrix is the transpose (the passive attitude matrix of JPL-style books, $\mathbf{C} = (w^2 - \mathbf{v}^\top\mathbf{v})\mathbf{I}_3 + 2\mathbf{v}\mathbf{v}^\top - 2w[\mathbf{v}\times]$) use the minus. Check: $\operatorname{tr}(\mathbf{C}) = 4w^2 - 1$ either way.
:::

## DCM to quaternion: Shepperd's branch choice

This is the dangerous direction. The reason, in one line: it needs a square root of something that can shrink to zero, and then it divides by that square root.

Think of measuring the thickness of a single hair with a school ruler. The ruler's marks are a millimetre apart, so a reading of "zero point something" is mostly guesswork. If you then *divide* by that guess, the answer is garbage. The fix is to measure something big instead — a whole stack of paper — and work out the small thing from it.

### Four ways to get one component

Look at the matrix above and add or subtract its diagonal entries. Using $w^2 + x^2 + y^2 + z^2 = 1$ to tidy up, you get four facts, one for each component:

$$
1 + \operatorname{tr}\mathbf{C} = 4w^2, \quad
1 + 2C_{11} - \operatorname{tr}\mathbf{C} = 4x^2, \quad
1 + 2C_{22} - \operatorname{tr}\mathbf{C} = 4y^2, \quad
1 + 2C_{33} - \operatorname{tr}\mathbf{C} = 4z^2 .
$$

($C_{11}$, read "C one one", is the entry in row 1, column 1.) Each line gives the *size* of one component. The other three come from pairs of off-diagonal entries:

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

So pick any one component, find it from its square root, and then divide the right three pair-sums by four times it. The four diagonal identities were checked numerically over 500 random rotations; the largest mismatch was $6.7\times 10^{-16}$, which is pure round-off.

::: note Why it has to be true
Take the first one. The diagonal of $\mathbf{C}$ is $w^2{+}x^2{-}y^2{-}z^2$, $w^2{-}x^2{+}y^2{-}z^2$ and $w^2{-}x^2{-}y^2{+}z^2$. Add them: each of $x^2, y^2, z^2$ appears once with a plus and twice with a minus, so $\operatorname{tr}\mathbf{C} = 3w^2 - x^2 - y^2 - z^2$. Replace $x^2 + y^2 + z^2$ by $1 - w^2$: $\operatorname{tr}\mathbf{C} = 4w^2 - 1$. Add $1$ and you have $4w^2$.

For the second, $2C_{11} - \operatorname{tr}\mathbf{C} = 2(w^2{+}x^2{-}y^2{-}z^2) - (3w^2{-}x^2{-}y^2{-}z^2) = -w^2 + 3x^2 - y^2 - z^2$. Replace $w^2 + y^2 + z^2$ by $1 - x^2$ to get $4x^2 - 1$, then add $1$. The other two are the same with the letters moved round.

For the pairs, read two mirror-image entries: $C_{32} = 2(yz + wx)$ and $C_{23} = 2(yz - wx)$. Subtracting cancels $yz$ and doubles $wx$: $4wx$. Adding cancels $wx$ and doubles $yz$: $4yz$.
:::

### The naive formula and where it breaks

The **naive trace formula** always takes the first route: $w = \tfrac12\sqrt{1+\operatorname{tr}\mathbf{C}}$, then divide the three differences $C_{32} - C_{23}$ and so on by $4w$. It is correct algebra. But $w = \cos(\Phi/2)$, so as the turn approaches $180^\circ$, $w$ heads to zero — and $180^\circ$ turns are the commonest large slews there are (point the other way). You are dividing by the hair.

### Shepperd's fix

The **Shepperd method** — published by [[Stanley Shepperd|shepperd-history]] in 1978 and made standard in attitude work by Landis Markley — computes all four candidates $1 + \operatorname{tr}\mathbf{C}$ and $1 + 2C_{ii} - \operatorname{tr}\mathbf{C}$, and picks the largest. It takes *that* component from its square root and divides the other three pair-sums by four times it.

Why is that always safe? The four candidates are $4w^2, 4x^2, 4y^2, 4z^2$, and they add up to $4(w^2+x^2+y^2+z^2) = 4$. [[Four numbers that add to 4|largest-of-four]] cannot all be smaller than $1$, so the largest is at least $1$. Its component $s$ is then at least $\tfrac12$, and the divisor $4s$ is at least $2$. You never divide by anything small, for any rotation at all.

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

print(quat_from_dcm(np.diag([1.0, -1.0, -1.0])))   # [0. 1. 0. 0.]
```

The last line of the function forces $w \ge 0$. The matrix cannot tell $q$ from $-q$ (they give the same $\mathbf{C}$), so the routine must pick one, and it always picks the same one.

::: example How badly the naive formula fails near 180°
Build rotation matrices at angles creeping toward $180^\circ$, convert each back to a quaternion both ways, rebuild the matrix, and compare with the original. The error is the largest difference in any entry. To smooth out luck, each row uses $2000$ random axes and reports the middle (median) naive error and the worst Shepperd error. The column $1 + \operatorname{tr}\mathbf{C}$ is the naive formula's $4w^2$.

| $\Phi$ | $1+\operatorname{tr}\mathbf{C}$ | naive, median error | Shepperd, worst error |
| --- | --- | --- | --- |
| $45^\circ$ | $3.41$ | $1.1\times 10^{-16}$ | $3.3\times 10^{-16}$ |
| $90^\circ$ | $2.00$ | $1.6\times 10^{-16}$ | $4.0\times 10^{-16}$ |
| $170^\circ$ | $3.04\times 10^{-2}$ | $7.0\times 10^{-15}$ | $1.0\times 10^{-15}$ |
| $179^\circ$ | $3.05\times 10^{-4}$ | $5.4\times 10^{-13}$ | $8.9\times 10^{-16}$ |
| $179.9^\circ$ | $3.05\times 10^{-6}$ | $6.4\times 10^{-11}$ | $8.9\times 10^{-16}$ |
| $179.99^\circ$ | $3.05\times 10^{-8}$ | $6.4\times 10^{-9}$ | $8.9\times 10^{-16}$ |

Read down the naive column from $179^\circ$. Each time the rotation gets ten times closer to $180^\circ$, $1+\operatorname{tr}\mathbf{C}$ drops by a factor of $100$ and the error grows by a factor of about $100$: two digits lost per step. The Shepperd column never leaves the last digit or two of [[double precision|round-off]].

At exactly $180^\circ$ it gets worse. Take the axis $\hat{\mathbf{e}} = (1, 2, 2)/3$. The true $1 + \operatorname{tr}\mathbf{C}$ is $0$, so what the computer gets is round-off: exactly $0$, or $\pm 2\times 10^{-16}$, depending on how the matrix was built. If it is $0$, the naive formula divides by zero. If it is slightly negative, it takes the square root of a negative number and returns [[NaN|nan]]. If it is $+1.1\times 10^{-16}$, it finds $w = 5.3\times 10^{-9}$, divides by $4w = 2.1\times 10^{-8}$, and returns a nearly-zero quaternion; the matrix rebuilt from it is wrong by $0.889$ in one entry — almost the full size of the entries themselves.

Shepperd, on the same matrix, sees candidates $0,\ 0.444,\ 1.778,\ 1.778$. It picks $4y^2 = 4\times(2/3)^2 = 1.778$, so $y = 0.667$ and the divisor is $4y = 2.67$. It returns $[0,\ 0.333,\ 0.667,\ 0.667]$, which rebuilds the matrix to $1.1\times 10^{-16}$.

The exact half-turn $\mathbf{C} = \operatorname{diag}(1,-1,-1)$ ($180^\circ$ about $x$) makes the point cleanly. Here $1 + \operatorname{tr}\mathbf{C} = 1 + (1 - 1 - 1) = 0$ exactly, so the naive formula divides by zero. Shepperd's candidates are $0, 4, 0, 0$; it picks the $x$ branch and returns $[0, 1, 0, 0]$, which has length $1$ and rebuilds $\operatorname{diag}(1,-1,-1)$ exactly.

Sanity check: a $180^\circ$ turn about $x$ should be $[\cos 90^\circ,\ \sin 90^\circ,\ 0,\ 0] = [0, 1, 0, 0]$. It is.
:::

## Euler angles and the quaternion

Going in, a 3-2-1 sequence is three turns, so the quaternion is three **elementary quaternions** multiplied together — one per turn, each about a single axis:

$$
q_{N\leftarrow B} = q_z(\psi)\otimes q_y(\theta)\otimes q_x(\phi),
\qquad q_z(\psi) = [\cos\tfrac{\psi}{2},\,0,\,0,\,\sin\tfrac{\psi}{2}],
$$

and likewise $q_y(\theta) = [\cos\tfrac{\theta}{2}, 0, \sin\tfrac{\theta}{2}, 0]$ and $q_x(\phi) = [\cos\tfrac{\phi}{2}, \sin\tfrac{\phi}{2}, 0, 0]$. Here $\psi$ ("psi") is yaw, $\theta$ ("theta") pitch and $\phi$ ("phi") roll. Multiply out, writing $c_\psi = \cos(\psi/2)$, $s_\psi = \sin(\psi/2)$ and so on for short:

$$
q =
\begin{bmatrix}
c_\psi c_\theta c_\phi + s_\psi s_\theta s_\phi\\
c_\psi c_\theta s_\phi - s_\psi s_\theta c_\phi\\
c_\psi s_\theta c_\phi + s_\psi c_\theta s_\phi\\
s_\psi c_\theta c_\phi - c_\psi s_\theta s_\phi
\end{bmatrix}.
$$

Coming out, read the same three matrix entries lesson 02 used, now written in quaternion components:

$$
\psi = \operatorname{atan2}\bigl(2(xy + wz),\ 1 - 2(y^2+z^2)\bigr),
\quad
\theta = \arcsin\bigl(2(wy - xz)\bigr),
\quad
\phi = \operatorname{atan2}\bigl(2(yz + wx),\ 1 - 2(x^2+y^2)\bigr).
$$

Both directions were checked against the elementary-matrix route of lesson 02 over $500$ random attitudes; they agree to $5\times 10^{-15}$.

Two cautions. **Clamp** the $\arcsin$ input to $[-1, 1]$ first: round-off can make it $1.0000000000000002$, and $\arcsin$ of that is an error. And this conversion inherits the [[gimbal-lock singularity|gimbal-bridge]] of lesson 03. That is a property of Euler angles themselves, not of the route you took to reach them.

## Rodrigues parameters and the quaternion

The classical (Gibbs) vector $\mathbf{g}$ and the modified vector $\boldsymbol{\sigma}$ ("sigma") of lesson 09 are one division away from the quaternion:

$$
\mathbf{g} = \frac{\mathbf{v}}{w},
\qquad
q = \frac{[\,1,\ \mathbf{g}\,]}{\sqrt{1+\mathbf{g}^\top\mathbf{g}}};
\qquad\qquad
\boldsymbol{\sigma} = \frac{\mathbf{v}}{1+w},
\qquad
q = \frac{\bigl[\,1-\boldsymbol{\sigma}^\top\boldsymbol{\sigma},\ 2\boldsymbol{\sigma}\,\bigr]}{1+\boldsymbol{\sigma}^\top\boldsymbol{\sigma}} .
$$

Before forming either one, **canonicalise** the quaternion — flip its sign if needed so $w \ge 0$. After forming the MRP, apply the **shadow-set switch** of lesson 09 (replace $\boldsymbol{\sigma}$ by $-\boldsymbol{\sigma}/(\boldsymbol{\sigma}^\top\boldsymbol{\sigma})$ whenever its length exceeds $1$), so that $\lVert\boldsymbol{\sigma}\rVert \le 1$.

The Gibbs conversion has no safe version near $\Phi = 180^\circ$. There $w \to 0$, and $\mathbf{g}$ itself [[runs off to infinity|gibbs-blowup]]. That singularity belongs to the parameters, and no clever branch can remove it.

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

::: example One attitude in all six forms
Take a turn of $\Phi = 137.000^\circ$ about the unit axis $\hat{\mathbf{e}} = (0.300587,\ -0.500978,\ 0.811584)$.

**Quaternion.** Half the angle is $68.5^\circ$. So $w = \cos 68.5^\circ = 0.366501$, and the vector part is $\hat{\mathbf{e}}\sin 68.5^\circ = 0.930418\,\hat{\mathbf{e}}$:

$$
q = [\,0.366501,\ 0.279671,\ -0.466119,\ 0.755112\,],
\qquad \lVert q\rVert = 1.000000 .
$$

**DCM.** Build $\mathbf{C}(q)$ from the formula. Check its trace two ways: $4w^2 - 1 = 4(0.366501)^2 - 1 = -0.462707$, and lesson 04's $1 + 2\cos 137^\circ = 1 + 2(-0.731354) = -0.462707$. They match.

**Back to the quaternion.** Shepperd's four candidates for this matrix are $0.537,\ 0.313,\ 0.869,\ 2.281$. The largest is $4z^2 = 2.281$, so it takes the $z$ branch — sensible, since $z = 0.755$ is the biggest component. It returns $q$ again, matching every component to the last digit.

**Euler 3-2-1.** From the three formulas: $\psi = 153.013^\circ$, $\theta = -49.821^\circ$, $\phi = -50.655^\circ$. Rebuilding $\mathbf{R}_1(\phi)\mathbf{R}_2(\theta)\mathbf{R}_3(\psi)$ and transposing gives the same matrix to $1.1\times 10^{-16}$, and the half-angle product formula gives back the same $q$.

**Classical Rodrigues.** Divide the vector part by $w$:

$$
\mathbf{g} = \frac{\mathbf{v}}{0.366501} = (0.763085,\ -1.271807,\ 2.060326),
\qquad \lVert\mathbf{g}\rVert = 2.538648 = \tan 68.5^\circ .
$$

**Modified Rodrigues.** Divide by $1 + w = 1.366501$:

$$
\boldsymbol{\sigma} = (0.204662,\ -0.341104,\ 0.552588),
\qquad \lVert\boldsymbol{\sigma}\rVert = 0.680876 = \tan 34.25^\circ .
$$

That is inside the unit ball, so no shadow switch. Both rebuild the matrix to $2.2\times 10^{-16}$.

Now compare sizes at this one ordinary attitude. The quaternion components are all below $0.76$. The MRP components are below $0.56$. The Gibbs vector already has a component above $2$ and a length of $2.54$. Push toward $180^\circ$ and it heads for infinity — lesson 09's argument, visible in one line of numbers.
:::

## Testing conversions

Conversions are where **[[property tests|property-tests]]** pay for themselves: tests that throw many random inputs at a routine and check a rule that must always hold. The rules here are exact, and the failures sit at edges that hand-picked cases miss. Four properties cover most of it.

1. **Round trip, up to sign.** For random unit $q$ with $w\ge 0$, `quat_from_dcm(dcm_from_quat(q))` must return $q$. Forcing $w \ge 0$ is what makes this testable at all; without it, half the results differ by an overall sign that is not an error.
2. **Every generated matrix is a real rotation.** $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$ to $10^{-12}$ and $\lvert\det\mathbf{C}-1\rvert < 10^{-12}$, for random inputs.
3. **Composition agrees.** $\mathbf{C}(q_1\otimes q_2) = \mathbf{C}(q_1)\mathbf{C}(q_2)$ to $10^{-10}$. This is the test that catches a convention mix-up, because it checks the algebra, not any single conversion.
4. **Deliberate edge cases.** The identity; $180^\circ$ about each coordinate axis and about a slanted axis; $\Phi = 10^{-8}$; pitch at $\pm 90^\circ$ for the Euler routines; $\lVert\boldsymbol{\sigma}\rVert$ a hair above and a hair below $1$.

Random testing alone will not find the $180^\circ$ problem. The angle of a uniformly random rotation lands within $0.01^\circ$ of a half turn only about once in $9000$ draws, and exactly on it essentially never. So over $20{,}000$ random rotations, the naive formula's worst error came out somewhere between $2\times 10^{-10}$ and $1\times 10^{-7}$, depending on the draw — bad, but not alarming. Shepperd's worst stayed below $7\times 10^{-16}$ every time. The deliberate $180^\circ$ case, by contrast, is a division by zero or an error of $0.889$. That is why item 4 is on the list.

::: warning Round-tripping through Euler angles destroys information near gimbal lock
Quaternion to Euler angles and back is lossless only away from $\theta = \pm 90^\circ$. At the singularity, many different angle sets describe the same attitude, so the angles cannot pin it down. Near it, the recovered $\psi$ and $\phi$ are ratios whose top and bottom both approach zero, so round-off dominates them. Never use Euler angles to pass an attitude between two systems that both hold a quaternion, however convenient the message format. Convert to Euler angles for display, and throw them away.
:::

::: warning Normalise the input, canonicalise the output
Two habits close most of the remaining gaps. On the way in, normalise any quaternion that has been integrated, sent over a link or interpolated: the matrix formula assumes $\lVert q\rVert = 1$, and if it is not, you silently get a scaled matrix that is not a rotation. On the way out of a DCM-to-quaternion conversion, force $w\ge 0$, so the same input always gives the same answer and a round-trip test means something. Neither costs anything measurable.
:::

## Check yourself

::: check
A DCM has trace $-0.9$ and diagonal $(0.1,\ -0.6,\ -0.4)$. Which Shepperd branch is chosen, and what is the size of that component?
:::

::: answer
Work out the four candidates.

- $1 + \operatorname{tr} = 1 - 0.9 = 0.1$.
- $1 + 2(0.1) - (-0.9) = 1 + 0.2 + 0.9 = 2.1$.
- $1 + 2(-0.6) + 0.9 = 1 - 1.2 + 0.9 = 0.7$.
- $1 + 2(-0.4) + 0.9 = 1 - 0.8 + 0.9 = 1.1$.

Check: $0.1 + 2.1 + 0.7 + 1.1 = 4.0$, as it must be. The largest is the second, $4x^2 = 2.1$, so the $x$ branch is used and $\lvert x\rvert = \tfrac12\sqrt{2.1} = 0.7246$. The divisor is $4\lvert x\rvert = 2.898$.

The naive route would have used $w = \tfrac12\sqrt{0.1} = 0.1581$ and divided by $4w = 0.6325$ — a divisor $4.6$ times smaller, so errors $4.6$ times larger. The principal angle here is $\arccos\bigl((-0.9-1)/2\bigr) = \arccos(-0.95) = 161.8^\circ$: close to a half turn, which is why $w$ is small.
:::

::: check
The naive trace formula divides by $4w$ once, which might suggest its error grows like $1/w$, that is like $1/\sqrt{1+\operatorname{tr}\mathbf{C}}$. Explain why it actually grows like $1/(1+\operatorname{tr}\mathbf{C})$, and check it against the table.
:::

::: answer
The trace is a sum of three entries of size about $1$, so its round-off error is a fixed tiny amount $\varepsilon$, about $10^{-16}$, however close the rotation is to $180^\circ$.

That error passes into $w = \tfrac12\sqrt{1+\operatorname{tr}}$ amplified: since $4w^2 = 1 + \operatorname{tr}$, a change $\varepsilon$ in the right side moves $w$ by $\delta w \approx \varepsilon/(8w)$. So the *relative* error in $w$ is $\delta w / w \approx \varepsilon/(8w^2)$.

The other three components are formed by dividing numbers of size about $4w \times(\text{component})$ by $4w$. Any relative error in $w$ carries straight into each of them. So their error is about $\varepsilon/(8w^2)$ times their size — and $4w^2 = 1 + \operatorname{tr}$, so this is about $\varepsilon/\bigl(2(1+\operatorname{tr})\bigr)$. The error goes like $1/(1+\operatorname{tr}\mathbf{C})$, one power worse than the single division suggests.

The table agrees. From $179^\circ$ to $179.99^\circ$, $1+\operatorname{tr}$ falls by a factor of $10{,}000$ (from $3.05\times 10^{-4}$ to $3.05\times 10^{-8}$) and the median error rises from $5.4\times 10^{-13}$ to $6.4\times 10^{-9}$, a factor of about $12{,}000$. And at $179.99^\circ$ the estimate $10^{-16}/(3\times 10^{-8}) \approx 3\times 10^{-9}$ is the right size.
:::

::: check
Given $q = [0.5,\ 0.5,\ 0.5,\ 0.5]$, find the DCM, the principal axis and angle, the MRP and the Gibbs vector.
:::

::: answer
**Length:** $\sqrt{4\times 0.25} = 1$. Good.

**DCM:** $C_{11} = w^2+x^2-y^2-z^2 = 0.25+0.25-0.25-0.25 = 0$, and by symmetry all three diagonal entries are $0$. So $\operatorname{tr}\mathbf{C} = 0$, which agrees with $4w^2 - 1 = 1 - 1 = 0$. Off the diagonal, $C_{12} = 2(xy-wz) = 2(0.25-0.25) = 0$ and $C_{21} = 2(xy+wz) = 2(0.5) = 1$, and the same pattern repeats round the cycle. So $\mathbf{C}$ is the matrix that sends $\hat{\mathbf{x}}\to\hat{\mathbf{y}}\to\hat{\mathbf{z}}\to\hat{\mathbf{x}}$.

**Axis and angle:** $\lVert\mathbf{v}\rVert = \sqrt{0.75} = 0.866025$, so $\Phi = 2\operatorname{atan2}(0.866025,\ 0.5) = 2\times 60^\circ = 120^\circ$, about $\hat{\mathbf{e}} = (0.5,0.5,0.5)/0.866025 = (1,1,1)/\sqrt3$. That makes sense: turning a third of the way round the diagonal of a cube swaps the three axes in a cycle.

**Gibbs:** $\mathbf{v}/w = (1,1,1)$, length $\sqrt3 = \tan 60^\circ$.

**MRP:** $\mathbf{v}/(1+w) = (1/3,1/3,1/3)$, length $0.57735 = \tan 30^\circ$, inside the unit ball.
:::

::: check
A test asserts `quat_from_dcm(dcm_from_quat(q)) == q` for random $q$ and fails about half the time, with every component negated. What is wrong, and is it a bug?
:::

::: answer
It is a bug in the test, not in the conversion. $\mathbf{C}(q) = \mathbf{C}(-q)$, so the matrix carries no sign, and the conversion has to choose one. About half of random quaternions have $w < 0$, and the routine returns their $w \ge 0$ twin.

Fix it in either of two ways. Force $w\ge 0$ on the input before building the matrix, as the routine does on its output. Or compare up to sign, by testing $\lvert q_{\text{out}}\cdot q_{\text{in}}\rvert > 1-\epsilon$. The second is sturdier, because it also passes at $w = 0$, where "force $w \ge 0$" cannot decide.

A *real* bug would be a conversion that gives different signs for the same input on different calls. That is why the sign choice belongs inside the routine.
:::

::: check
You need the 3-2-1 angles from a DCM, $100$ times a second ($100\,\mathrm{Hz}$), for a display. Would you route through the quaternion or convert directly, and why?
:::

::: answer
Directly. DCM-to-Euler reads three or so matrix entries and makes three inverse-trig calls: no square roots, no branch choice. Going through the quaternion adds a Shepperd conversion and a second round of trig for no gain, because the Euler singularity is there either way. This is the one spoke-to-spoke conversion that is routinely worth writing; the hub rule is a default, not a law.

Note too that a display is a display. Nothing downstream should use those angles, so their accuracy loss near $\theta = \pm 90^\circ$ is acceptable here in a way it would not be in a control loop.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Hub and spoke | Every representation converts through the quaternion: ten routines, not thirty |
| $q\to\mathbf{C}$ | Products only, no branches, always safe; check $\operatorname{tr}\mathbf{C} = 4w^2-1$ |
| $\pm 2w[\mathbf{v}\times]$ | Sign of the last term flips with the active/passive convention; $+$ in this module |
| $1+\operatorname{tr}\mathbf{C} = 4w^2$, $1+2C_{ii}-\operatorname{tr}\mathbf{C} = 4x^2, 4y^2, 4z^2$ | The four Shepperd candidates; they add to $4$ |
| Shepperd rule | Take the largest candidate, so the divisor is never below $2$ |
| Naive trace formula | Error grows like $1/(1+\operatorname{tr}\mathbf{C})$; fails outright at $\Phi = 180^\circ$ |
| $\Phi = 2\operatorname{atan2}(\lVert\mathbf{v}\rVert, w)$ | Angle from a quaternion; not $2\arccos w$ |
| $q = q_z(\psi)\otimes q_y(\theta)\otimes q_x(\phi)$ | 3-2-1 into a quaternion |
| $\theta = \arcsin(2(wy-xz))$, two `atan2` | 3-2-1 out of a quaternion; clamp the `asin` input |
| $\mathbf{g} = \mathbf{v}/w$, $\boldsymbol{\sigma} = \mathbf{v}/(1+w)$ | Rodrigues parameters from the quaternion ($w\ge 0$ first; shadow switch after) |
| Property tests | Round trip up to sign; $\mathbf{C}^\top\mathbf{C} = \mathbf{I}_3$, $\det = +1$; composition; deliberate edge cases |
| Worked figures | At $180^\circ$: naive fails (divide by zero, NaN or an error of $0.889$), Shepperd exact; near it, naive loses two digits per tenfold approach |

Every conversion in this module is now written down and tested. The next lesson settles a question that has been put off three times — whether a rotation matrix moves a vector or re-labels it — and deciding it the other way would transpose half of these formulas.

::: context hub-and-spoke Why airlines and attitude libraries both use hubs
Airlines learned this long ago. Flying every city directly to every other city takes a huge number of routes. Flying everything through a hub takes one route per city. Conversions work the same way, and the fewer routines you have, the fewer places a sign can hide.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <g stroke="#8fb8f0" stroke-width="1.5">
    <line x1="90" y1="45" x2="141.96" y2="75"/><line x1="90" y1="45" x2="141.96" y2="135"/><line x1="90" y1="45" x2="90" y2="165"/>
    <line x1="90" y1="45" x2="38.04" y2="135"/><line x1="90" y1="45" x2="38.04" y2="75"/>
    <line x1="141.96" y1="75" x2="141.96" y2="135"/><line x1="141.96" y1="75" x2="90" y2="165"/><line x1="141.96" y1="75" x2="38.04" y2="135"/>
    <line x1="141.96" y1="75" x2="38.04" y2="75"/><line x1="141.96" y1="135" x2="90" y2="165"/><line x1="141.96" y1="135" x2="38.04" y2="135"/>
    <line x1="141.96" y1="135" x2="38.04" y2="75"/><line x1="90" y1="165" x2="38.04" y2="135"/><line x1="90" y1="165" x2="38.04" y2="75"/>
    <line x1="38.04" y1="135" x2="38.04" y2="75"/>
  </g>
  <g fill="#1f2a44">
    <circle cx="90" cy="45" r="5"/><circle cx="141.96" cy="75" r="5"/><circle cx="141.96" cy="135" r="5"/>
    <circle cx="90" cy="165" r="5"/><circle cx="38.04" cy="135" r="5"/><circle cx="38.04" cy="75" r="5"/>
  </g>
  <text x="90" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">every pair: 15 links</text>
  <text x="90" y="196" font-size="12" text-anchor="middle" fill="#1f2a44">30 one-way routines</text>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="270" y1="105" x2="270" y2="40"/><line x1="270" y1="105" x2="331.8" y2="84.9"/><line x1="270" y1="105" x2="308.2" y2="157.6"/>
    <line x1="270" y1="105" x2="231.8" y2="157.6"/><line x1="270" y1="105" x2="208.2" y2="84.9"/>
  </g>
  <circle cx="270" cy="105" r="14" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="109" font-size="12" text-anchor="middle" fill="#1f2a44">q</text>
  <g fill="#1f2a44">
    <circle cx="270" cy="40" r="5"/><circle cx="331.8" cy="84.9" r="5"/><circle cx="308.2" cy="157.6" r="5"/>
    <circle cx="231.8" cy="157.6" r="5"/><circle cx="208.2" cy="84.9" r="5"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="270" y="28">DCM</text><text x="340" y="74">Euler</text><text x="318" y="175">MRP</text>
    <text x="222" y="175">CRP</text><text x="200" y="74">axis</text>
  </g>
  <text x="270" y="196" font-size="12" text-anchor="middle" fill="#1f2a44">hub: 10 routines</text>
</svg>
```
:::

::: context arccos-small Why arccos goes blind for small turns
A computer stores about $16$ significant digits. For a turn of $\Phi = 10^{-8}$ radians, $w = \cos(\Phi/2) = 1 - 1.25\times 10^{-17}$, and that tiny dent is below the sixteenth digit — so $w$ is stored as exactly $1$. Then $2\arccos(1) = 0$: the turn has vanished. The vector part, $\sin(\Phi/2) = 5\times 10^{-9}$, is stored with all its digits, so $2\operatorname{atan2}(5\times 10^{-9}, 1)$ returns $10^{-8}$ exactly. At $\Phi = 10^{-6}$ radians (about $0.2$ arcseconds, a star tracker's league) the arccos answer is already $0.004\%$ wrong.
:::

::: context shepperd-history A one-page fix
Stanley Shepperd's method appeared in 1978 as a short engineering note, about a page long, in the *Journal of Guidance and Control*. The idea fits on an index card: of four equivalent formulas, use the one whose divisor is biggest. Landis Markley of NASA Goddard later revisited it and made it the standard way attitude engineers turn a matrix into a quaternion. It is required in this module's coding exercise.
:::

::: context largest-of-four Four numbers that add to 4
If four numbers add up to $4$, their average is $1$. The biggest of a group can never be below its average, so the biggest is at least $1$. Here are the four candidates from the first Check yourself question: $0.1$, $2.1$, $0.7$ and $1.1$. The naive formula always takes the first bar, however short it is.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="60" y="165" width="40" height="5" fill="#b4232c"/>
  <rect x="140" y="65" width="40" height="105" fill="#1d6fd1"/>
  <rect x="220" y="135" width="40" height="35" fill="#8fb8f0"/>
  <rect x="300" y="115" width="40" height="55" fill="#8fb8f0"/>
  <line x1="30" y1="120" x2="345" y2="120" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <text x="34" y="113" font-size="11" fill="#6c7a93">average = 1</text>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="158">0.1</text><text x="160" y="58">2.1</text><text x="240" y="128">0.7</text><text x="320" y="108">1.1</text>
    <text x="80" y="188">4w²</text><text x="160" y="188">4x²</text><text x="240" y="188">4y²</text><text x="320" y="188">4z²</text>
  </g>
  <text x="80" y="204" font-size="11" text-anchor="middle" fill="#b4232c">naive</text>
  <text x="160" y="204" font-size="11" text-anchor="middle" fill="#1d6fd1">Shepperd</text>
  <text x="200" y="24" font-size="12" text-anchor="middle" fill="#1f2a44">the four bars always add to 4</text>
</svg>
```
:::

::: context round-off What "the last digit" means
A standard computer number (a "double") keeps about $16$ significant digits. The gap between $1$ and the next number it can store is $2.2\times 10^{-16}$, called machine epsilon. So an error of a few times $10^{-16}$ in a number of size $1$ means "wrong only in the last digit or two" — as good as the arithmetic can ever be. An error of $10^{-9}$ means seven of the sixteen digits are gone.
:::

::: context nan Not a Number
When a calculation has no sensible answer — the square root of a negative number, zero divided by zero — the computer returns a special value called NaN, short for "Not a Number". Any arithmetic with a NaN gives NaN, so one bad conversion quietly poisons every quantity computed from it afterwards: the matrix, the pointing command, the thruster firing. Flight software checks for NaN at interfaces for exactly this reason.
:::

::: context gimbal-bridge What the Euler angles lose at 90° pitch
At $\theta = +90^\circ$ the first and last turns of a 3-2-1 sequence happen about the same line in space. Only a combination of yaw and roll is then fixed by the attitude, not each one separately, so the conversion has infinitely many right answers and the two `atan2` calls are asked to divide nothing by nothing. Lesson 03 traced this to the $1/\cos\theta$ factor in the Euler kinematics.
:::

::: context gibbs-blowup How fast each Rodrigues set grows
The classical set has length $\tan(\Phi/2)$ and the modified set $\tan(\Phi/4)$. The curves below are plotted to scale. The dots mark the $137^\circ$ example: $2.54$ and $0.68$. The Gibbs length passes $4$ at about $152^\circ$ and is infinite at $180^\circ$; the MRP length only reaches $1$ there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="330" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="35" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3">
    <line x1="40" y1="145" x2="320" y2="145"/><line x1="40" y1="110" x2="320" y2="110"/>
    <line x1="40" y1="75" x2="320" y2="75"/><line x1="40" y1="40" x2="320" y2="40"/>
    <line x1="320" y1="40" x2="320" y2="180"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="34" y="184">0</text><text x="34" y="149">1</text><text x="34" y="114">2</text><text x="34" y="79">3</text><text x="34" y="44">4</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="196">0°</text><text x="180" y="196">90°</text><text x="320" y="196">180°</text>
  </g>
  <text x="250" y="206" font-size="11" fill="#1f2a44" text-anchor="middle">Φ</text>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,180.0 55.6,176.9 71.1,173.8 86.7,170.6 102.2,167.3 117.8,163.7 133.3,159.8 148.9,155.5 164.4,150.6 180.0,145.0 195.6,138.3 211.1,130.0 226.7,119.4 242.2,104.9 245.3,101.4 248.4,97.5 251.6,93.4 254.7,88.8 257.8,83.8 260.9,78.4 264.0,72.3 267.1,65.5 270.2,57.9 273.3,49.4 276.3,40.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,180.0 55.6,178.5 71.1,176.9 86.7,175.4 102.2,173.8 117.8,172.2 133.3,170.6 148.9,169.0 164.4,167.3 180.0,165.5 195.6,163.7 211.1,161.8 226.7,159.8 242.2,157.7 257.8,155.5 273.3,153.1 288.9,150.6 304.4,147.9 320.0,145.0"/>
  <circle cx="253.1" cy="91.1" r="4" fill="#b4232c"/>
  <circle cx="253.1" cy="156.2" r="4" fill="#1d6fd1"/>
  <text x="200" y="60" font-size="12" fill="#b4232c" text-anchor="end">CRP: tan(Φ/2)</text>
  <text x="232" y="141" font-size="12" fill="#1d6fd1">MRP: tan(Φ/4)</text>
</svg>
```
:::

::: context property-tests Tests that try thousands of cases
An ordinary unit test checks one input you chose: "the identity quaternion gives the identity matrix". A property test states a rule — "for *every* unit quaternion, the round trip gives it back" — and then feeds the routine hundreds or thousands of random inputs looking for one that breaks the rule. Python's Hypothesis library does this and even shrinks a failing case to the simplest one it can find. The module's coding exercise is graded with exactly these properties.
:::
