---
id: l11-wahba-solutions-triad-davenport-quest-svd
title: "Wahba solutions: TRIAD, Davenport, QUEST, ESOQ, and SVD"
minutes: 22
covers:
  - "Wahba solutions: TRIAD, Davenport q-method, QUEST, ESOQ, and the SVD method"
---

There are many paths up the same hill. One is short and steep, one long and gentle, one needs a map. They all reach the same summit, but they differ in effort and in how easily you get lost on a foggy day.

The Wahba problem from the last lesson has exactly this flavor. The summit is always the same:

$$
\hat{\mathbf{A}}=\arg\max_{\mathbf{A}\in SO(3)}\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T}),
$$

the rotation that best lines up the body readings $\mathbf{b}_i$ with their reference directions $\mathbf{r}_i$, with all the data packed into the attitude profile matrix $\mathbf{B}=\sum_i a_i\mathbf{b}_i\mathbf{r}_i^\mathsf{T}$. This lesson walks five paths to it, roughly in the order engineers found them:

- **TRIAD** — builds the answer from two arrows with a ruler-and-set-square construction. No optimizing at all.
- **The SVD method** — uses a general-purpose matrix tool, and has a neat proof that it is the best possible answer.
- **Davenport's q-method** — turns the problem into finding the biggest eigenvalue of a $4\times4$ matrix.
- **QUEST** — finds that same eigenvalue fast enough for 1970s flight computers.
- **ESOQ** — a toughened version of QUEST for one awkward case.

Each is written in Python below and run on the same numbers.

A word on notation first. Some methods return a **[[quaternion|quaternion]]** instead of a matrix: four numbers $\mathbf{q}=(w,x,y,z)$ that describe a rotation. $w$ is the scalar part, written first, and $(x,y,z)$ is the vector part. The convention here is the one from the attitude module: a vector is turned by $\mathbf{v}' = \mathbf{q}\otimes\mathbf{v}\otimes\mathbf{q}^{*}$, where $\otimes$ is quaternion multiplication and $\mathbf{q}^{*}$ is $\mathbf{q}$ with its vector part negated. The code checks that its quaternions and matrices agree rather than trusting the convention.

## TRIAD: building a corner from two sticks

Take two sticks that are not parallel. Lay the first one down; that is your first axis. Swing a third stick so it stands perpendicular to both of the first two; that is your second axis. Now one direction is left that is perpendicular to both axes you already have; that is your third. You have built a perfect corner — three axes at right angles — from two sticks.

**TRIAD** (short for **[[tri-axial attitude determination|triad-history]]**) builds such a corner twice: once from the two reference arrows and once from the two body arrows. The rotation that carries one corner onto the other is the attitude.

Choose one pair, $(\mathbf{b}_1,\mathbf{r}_1)$, as the **primary** — the one you trust more. In the reference frame, build

$$
\mathbf{t}_1 = \mathbf{r}_1, \qquad \mathbf{t}_2 = \frac{\mathbf{r}_1\times\mathbf{r}_2}{\lVert\mathbf{r}_1\times\mathbf{r}_2\rVert}, \qquad \mathbf{t}_3 = \mathbf{t}_1\times\mathbf{t}_2 .
$$

In words: the first axis is the primary arrow itself. The second is the **[[cross product|cross-product]]** of the two arrows, which sticks out perpendicular to both, divided by its own length so it has length $1$. The third is the cross product of the first two, perpendicular to both.

Do the same with $\mathbf{b}_1,\mathbf{b}_2$ to get $\mathbf{s}_1,\mathbf{s}_2,\mathbf{s}_3$. Stand the axes side by side as the columns of two matrices, $\mathbf{M}_r=(\mathbf{t}_1\,\mathbf{t}_2\,\mathbf{t}_3)$ and $\mathbf{M}_b=(\mathbf{s}_1\,\mathbf{s}_2\,\mathbf{s}_3)$. Both are **orthonormal**: their columns have length $1$ and are at right angles. The attitude is

$$
\mathbf{A}=\mathbf{M}_b\mathbf{M}_r^\mathsf{T}.
$$

Why does this work? Because $\mathbf{M}_r^\mathsf{T}\mathbf{M}_r=\mathbf{I}$ for an orthonormal matrix, $\mathbf{A}\mathbf{M}_r = \mathbf{M}_b\mathbf{M}_r^\mathsf{T}\mathbf{M}_r = \mathbf{M}_b$. Reading that column by column, $\mathbf{A}\mathbf{t}_j=\mathbf{s}_j$ for each axis $j$. In particular $\mathbf{A}\mathbf{r}_1=\mathbf{b}_1$ exactly: the primary arrow is matched perfectly.

```python
import numpy as np

def triad(b1, b2, r1, r2):
    t1r, t2r = r1, np.cross(r1, r2) / np.linalg.norm(np.cross(r1, r2))
    Mr = np.column_stack([t1r, t2r, np.cross(t1r, t2r)])
    t1b, t2b = b1, np.cross(b1, b2) / np.linalg.norm(np.cross(b1, b2))
    Mb = np.column_stack([t1b, t2b, np.cross(t1b, t2b)])
    return Mb @ Mr.T
```

Notice what TRIAD does *not* do. It uses no weights. It never iterates. It uses exactly two arrows — a third one is thrown away. And it trusts the primary arrow completely: only the *plane* of the secondary arrow is used, never its exact direction within that plane.

### Where TRIAD's error comes from

The length of a cross product of two unit arrows is the sine of the angle between them: $\lVert\mathbf{r}_1\times\mathbf{r}_2\rVert=\sin(\text{separation})$. When the arrows are nearly parallel, that is a small number, and $\mathbf{t}_2$ is found by *dividing* by it. A tiny bit of sensor noise that nudges $\mathbf{b}_2$ sideways swings $\mathbf{s}_2$ by roughly that nudge divided by $\sin(\text{separation})$. At $90^\circ$ the division is by $1$; at $2^\circ$ it is by $0.035$, which multiplies the noise nearly thirty times.

::: key TRIAD and its weakness
A deterministic two-vector method: build an orthonormal triad from the primary observation and the normalized cross product, then $\mathbf{A}=\mathbf{M}_b\mathbf{M}_r^\mathsf{T}$. Its error blows up like $1/\sin(\text{angle between the two vectors})$, and it cannot use a third measurement.
:::

## The SVD method: a general tool with a clean proof

The **singular value decomposition** (SVD), from the linear algebra modules, says any matrix can be written as a rotation-like step, then a stretch along the axes, then another rotation-like step. For our $3\times3$ profile matrix,

$$
\mathbf{B}=\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T},
$$

where $\mathbf{U}$ and $\mathbf{V}$ are orthogonal and $\boldsymbol{\Sigma}$ (capital "sigma") is diagonal with the **singular values** $\sigma_1\ge\sigma_2\ge\sigma_3\ge0$ on its diagonal. (These $\sigma$s are stretch factors, not noise levels.)

Here is the argument, step by step.

**Step 1: substitute.** Put the SVD into the trace. Since $\mathbf{B}^\mathsf{T}=\mathbf{V}\boldsymbol{\Sigma}\mathbf{U}^\mathsf{T}$,

$$
\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T}) = \operatorname{trace}(\mathbf{A}\mathbf{V}\boldsymbol{\Sigma}\mathbf{U}^\mathsf{T}).
$$

**Step 2: rotate the order.** A trace does not change if you move the last factor to the front: $\operatorname{trace}(\mathbf{X}\mathbf{Y})=\operatorname{trace}(\mathbf{Y}\mathbf{X})$. Move $\mathbf{U}^\mathsf{T}$ to the front and give the product a name, $\mathbf{M}=\mathbf{U}^\mathsf{T}\mathbf{A}\mathbf{V}$:

$$
\operatorname{trace}(\mathbf{U}^\mathsf{T}\mathbf{A}\mathbf{V}\boldsymbol{\Sigma}) = \operatorname{trace}(\mathbf{M}\boldsymbol{\Sigma}) = \sum_i M_{ii}\sigma_i .
$$

The last equality holds because $\boldsymbol{\Sigma}$ is diagonal, so only the diagonal entries $M_{ii}$ of $\mathbf{M}$ get multiplied by anything. $\mathbf{M}$ is orthogonal, since it is a product of three orthogonal matrices.

**Step 3: find the ceiling.** Every row of an orthogonal matrix is a unit vector, so no single entry can be bigger than $1$: $\lvert M_{ii}\rvert\le1$. Since every $\sigma_i\ge0$,

$$
\sum_i M_{ii}\sigma_i \le \sum_i\sigma_i .
$$

The ceiling is reached only when every $M_{ii}=1$. An orthogonal matrix with all $1$s on its diagonal must be $\mathbf{I}$: each row already has length $1$ from its diagonal entry alone, so there is no room for anything else. So the best $\mathbf{M}$ is $\mathbf{I}$, which means $\mathbf{U}^\mathsf{T}\mathbf{A}\mathbf{V}=\mathbf{I}$, or $\mathbf{A}=\mathbf{U}\mathbf{V}^\mathsf{T}$.

**Step 4: rule out mirrors.** That answer is fine when $\det(\mathbf{U})\det(\mathbf{V})=+1$. When it is $-1$, $\mathbf{U}\mathbf{V}^\mathsf{T}$ is a **[[reflection|reflection]]** — a mirror image, not allowed in $SO(3)$ — and the best *rotation* has to give something up. The cheapest sacrifice is to flip the sign of the diagonal entry paired with the smallest singular value, $\sigma_3$. That costs $2\sigma_3$ instead of $2\sigma_1$ or $2\sigma_2$. Putting both cases into one formula:

$$
\hat{\mathbf{A}} = \mathbf{U}\operatorname{diag}(1,\,1,\,\det\mathbf{U}\det\mathbf{V})\,\mathbf{V}^\mathsf{T} .
$$

Here $\operatorname{diag}(1,1,d)$ is the diagonal matrix with $1$, $1$, $d$ down its diagonal. When $d=+1$ it is $\mathbf{I}$ and nothing changes; when $d=-1$ it flips the last axis and turns the mirror back into a rotation.

::: note Why flipping the smallest one is best
Step 4 compared only three simple choices. A full proof must rule out *every* orthogonal $\mathbf{M}$ with determinant $-1$, not just those three. It uses the fact that such an $\mathbf{M}$ always leaves some direction reversed, and shows that $\sum_i M_{ii}\sigma_i \le \sigma_1+\sigma_2-\sigma_3$ for all of them. Markley and Crassidis, *Fundamentals of Spacecraft Attitude Determination and Control*, chapter 5, gives the argument in full. The conclusion is the formula above.
:::

::: key SVD solution to Wahba
With $\mathbf{B}=\mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$, $\hat{\mathbf{A}}=\mathbf{U}\operatorname{diag}(1,1,\det\mathbf{U}\det\mathbf{V})\mathbf{V}^\mathsf{T}$. The determinant correction is what keeps you on $SO(3)$ instead of picking up a reflection.
:::

```python
def wahba_svd(bs, rs, weights):
    B = sum(a * np.outer(b, r) for b, r, a in zip(bs, rs, weights))
    U, S, Vt = np.linalg.svd(B)
    d = np.array([1, 1, np.linalg.det(U) * np.linalg.det(Vt.T)])
    return U @ np.diag(d) @ Vt
```

(NumPy returns $\mathbf{V}^\mathsf{T}$, called `Vt` here, rather than $\mathbf{V}$. The determinant of a matrix equals that of its transpose, so either works in `d`.)

## Davenport's q-method: the same problem as an eigenvalue

In 1968 Paul Davenport found a different path. Describe $\mathbf{A}$ by a unit quaternion $\mathbf{q}$ instead of nine matrix entries. Write the rotation matrix in terms of $\mathbf{q}$, put it into $\operatorname{trace}(\mathbf{A}\mathbf{B}^\mathsf{T})$, and multiply everything out. It is a long page of algebra, but nothing clever — and it collapses into a tidy form: $\mathbf{q}^\mathsf{T}\mathbf{K}\mathbf{q}$, where $\mathbf{K}$ is this symmetric $4\times4$ matrix:

$$
\mathbf{K} = \begin{pmatrix}\operatorname{trace}(\mathbf{B}) & \mathbf{z}^\mathsf{T} \\ \mathbf{z} & \mathbf{B}+\mathbf{B}^\mathsf{T}-\operatorname{trace}(\mathbf{B})\mathbf{I}\end{pmatrix}, \qquad \mathbf{z} = \begin{pmatrix}B_{32}-B_{23}\\ B_{13}-B_{31}\\ B_{21}-B_{12}\end{pmatrix} .
$$

Read it block by block: top-left is one number, the trace of $\mathbf{B}$; the top row and left column hold the three-vector $\mathbf{z}$, built from differences of mirror-image entries of $\mathbf{B}$ ($B_{32}$ is row 3, column 2); the lower-right is a $3\times3$ block. The sign of $\mathbf{z}$ matters. This sign matches our convention ($\mathbf{b}=\mathbf{A}\mathbf{r}$, with $\mathbf{A}(\mathbf{q})\mathbf{v}=\mathbf{q}\otimes\mathbf{v}\otimes\mathbf{q}^{*}$); flipping it returns the transpose of the right answer, the attitude backwards.

Now the problem is: make $\mathbf{q}^\mathsf{T}\mathbf{K}\mathbf{q}$ as big as possible, among all $\mathbf{q}$ of length $1$. That is a famous problem — a **[[Rayleigh quotient|rayleigh]]** problem — with a famous answer. The biggest possible value is the **largest [[eigenvalue|eigenvalue]] of $\mathbf{K}$**, written $\lambda_{\max}$ ("lambda max"), and the $\mathbf{q}$ that reaches it is the matching eigenvector. An eigenvector of a matrix is a direction the matrix only stretches, never turns; the eigenvalue is how much it stretches.

This path handles any number of arrows and any weights, with no special cases and no mirror problem: every unit quaternion is automatically a proper rotation.

::: key Davenport q-method
Build $\mathbf{K} = \begin{pmatrix}\operatorname{trace}(\mathbf{B}) & \mathbf{z}^\mathsf{T} \\ \mathbf{z} & \mathbf{B}+\mathbf{B}^\mathsf{T}-\operatorname{trace}(\mathbf{B})\mathbf{I}\end{pmatrix}$ with $\mathbf{z}=(B_{32}-B_{23},\ B_{13}-B_{31},\ B_{21}-B_{12})^\mathsf{T}$. The optimal quaternion is the eigenvector of the **largest** eigenvalue of $\mathbf{K}$. That sign of $\mathbf{z}$ matches the convention here ($\mathbf{b}=\mathbf{A}\mathbf{r}$, $\mathbf{A}(\mathbf{q})\mathbf{v}=\mathbf{q}\otimes\mathbf{v}\otimes\mathbf{q}^{*}$); flipping it returns the transpose.
:::

```python
def davenport_q(bs, rs, weights):
    B = sum(a * np.outer(b, r) for b, r, a in zip(bs, rs, weights))
    sigma = np.trace(B)
    z = np.array([B[2,1]-B[1,2], B[0,2]-B[2,0], B[1,0]-B[0,1]])
    K = np.block([[sigma, z], [z[:,None], B + B.T - sigma*np.eye(3)]])
    eigvals, eigvecs = np.linalg.eigh(K)
    q = eigvecs[:, np.argmax(eigvals)]
    return q if q[0] >= 0 else -q
```

The last line picks a sign. $\mathbf{q}$ and $-\mathbf{q}$ describe the same rotation, so we choose the one with a non-negative scalar part, just to make answers easy to compare.

::: example Four methods, one answer
Three body readings — sun sensor, magnetometer and star tracker, weighted $4:1:2$ by how accurate each is — against a known true attitude, with no noise. We need three helpers: one makes a test rotation, one turns a quaternion into a matrix (our convention, written out), and one measures the angle between two attitudes.

```python
def dcm_from_axis_angle(axis, angle):          # same helper as the previous lesson
    axis = axis / np.linalg.norm(axis)
    K = np.array([[0,-axis[2],axis[1]], [axis[2],0,-axis[0]], [-axis[1],axis[0],0]])
    return np.eye(3) + np.sin(angle)*K + (1-np.cos(angle))*(K @ K)

def quat_to_dcm(q):                             # A(q) v = q (x) v (x) q*, scalar first
    w, x, y, z = q
    return np.array([[1-2*(y*y+z*z), 2*(x*y-w*z),   2*(x*z+w*y)],
                     [2*(x*y+w*z),   1-2*(x*x+z*z), 2*(y*z-w*x)],
                     [2*(x*z-w*y),   2*(y*z+w*x),   1-2*(x*x+y*y)]])

def angle_between_deg(A1, A2):                  # rotation angle of A1 A2^T, safe near zero
    E = A1 @ A2.T
    s = 0.5 * np.array([E[2,1]-E[1,2], E[0,2]-E[2,0], E[1,0]-E[0,1]])
    return np.degrees(np.arctan2(np.linalg.norm(s), (np.trace(E) - 1) / 2))

A_true = dcm_from_axis_angle(np.array([0.3, -0.5, 0.8]), np.radians(32.0))
r1 = np.array([0.7660, 0.6428, 0.0]); r1 /= np.linalg.norm(r1)     # sun direction
r2 = np.array([0.2050, 0.1720, 0.9636]); r2 /= np.linalg.norm(r2)  # geomagnetic field
r3 = np.array([-0.4, 0.3, 0.866]); r3 /= np.linalg.norm(r3)        # a tracked star
b1, b2, b3 = A_true @ r1, A_true @ r2, A_true @ r3                 # noiseless body observations
w = [4.0, 1.0, 2.0]                                                # sun : mag : star, by accuracy

print(f"TRIAD     error: {angle_between_deg(triad(b1, b2, r1, r2), A_true):.1e} deg")
print(f"SVD       error: {angle_between_deg(wahba_svd([b1,b2,b3], [r1,r2,r3], w), A_true):.1e} deg")
print(f"Davenport error: {angle_between_deg(quat_to_dcm(davenport_q([b1,b2,b3], [r1,r2,r3], w)), A_true):.1e} deg")
# TRIAD     error: 5.0e-15 deg
# SVD       error: 1.5e-14 deg
# Davenport error: 1.4e-14 deg
```

Every error is between $10^{-15}$ and $10^{-14}$ degrees — that is only the computer's rounding in the sixteenth digit (your machine may print slightly different tiny numbers). On noise-free data all the methods are exact, and TRIAD is exact too, even though it ignored the star.

Sanity check: why is TRIAD exact here when it is the "worse" method? Because with no noise there is nothing to average. The differences only appear once noise does — and that is the next section's table.

A warning about measuring the error. The common shortcut $\arccos\big((\operatorname{trace}(\mathbf{E})-1)/2\big)$ cannot resolve angles smaller than about $10^{-6}$ degrees in double precision, because $\arccos$ is flat near $1$. It would report TRIAD "off by $1.2\times10^{-6}$ degrees" — a fake error. The `arctan2` form above does not have that problem.
:::

## QUEST: the same eigenvalue, without the heavy machinery

In the 1970s a spacecraft computer could not always afford a full $4\times4$ eigenvalue calculation every time it needed an attitude. Malcolm Shuster's **QUEST** (QUaternion ESTimator) finds the same answer as Davenport with far less work. It rests on one observation.

On noise-free data, the largest eigenvalue of $\mathbf{K}$ equals the sum of the weights exactly: $\lambda_{\max}=\sum_i a_i$. (In the example above, $\lambda_{\max}=7.0=4+1+2$. This is the ceiling from the last lesson: the best possible trace is $\sum_i a_i$.) With real noise, $\lambda_{\max}$ stays very close to that sum. So we already have an excellent guess before doing any work.

QUEST polishes that guess with **[[Newton's method|newtons-method]]**. Every eigenvalue of $\mathbf{K}$ is a root of its **characteristic polynomial**, $\det(\mathbf{K}-\lambda\mathbf{I})=0$ — for a $4\times4$ matrix, a polynomial of degree four in $\lambda$. Newton's method starts from a guess $\lambda_0=\sum_i a_i$, draws the tangent line to the polynomial there, and slides down the tangent to where it crosses zero. That is the next guess. Starting this close, two or three steps are usually enough.

Once $\lambda_{\max}$ is known, QUEST avoids the eigenvector calculation too. It solves a small $3\times3$ linear system instead:

$$
\mathbf{p} = \big[(\lambda_{\max}+\sigma)\mathbf{I}-\mathbf{S}\big]^{-1}\mathbf{z}, \qquad \mathbf{S}=\mathbf{B}+\mathbf{B}^\mathsf{T}, \quad \sigma=\operatorname{trace}(\mathbf{B}).
$$

(Here $\sigma$ is the trace of $\mathbf{B}$, not a noise level; it is the standard name in the QUEST literature.) The answer $\mathbf{p}$ is a three-number attitude description called the **[[classical Rodrigues parameters|rodrigues]]**. The unit quaternion is then $(1,\ p_1,\ p_2,\ p_3)$ divided by its length.

```python
def quest(bs, rs, weights, tol=1e-13, max_iter=50):
    B = sum(a * np.outer(b, r) for b, r, a in zip(bs, rs, weights))
    S, sigma = B + B.T, np.trace(B)
    z = np.array([B[2,1]-B[1,2], B[0,2]-B[2,0], B[1,0]-B[0,1]])
    K = np.block([[sigma, z], [z[:,None], S - sigma*np.eye(3)]])
    # coefficients of det(lambda I - K) from traces of powers of K (Newton's identities)
    p = [np.trace(np.linalg.matrix_power(K, k)) for k in range(1, 5)]
    e = [1.0]
    for k in range(1, 5):
        e.append(sum((-1)**(i-1) * e[k-i] * p[i-1] for i in range(1, k+1)) / k)
    c = [((-1)**k) * e[k] for k in range(5)]
    lam = sum(weights)                                   # the excellent first guess
    for _ in range(max_iter):                            # Newton's method
        f = lam**4 + c[1]*lam**3 + c[2]*lam**2 + c[3]*lam + c[4]
        fp = 4*lam**3 + 3*c[1]*lam**2 + 2*c[2]*lam + c[3]
        lam_new = lam - f / fp
        if abs(lam_new - lam) < tol:
            lam = lam_new
            break
        lam = lam_new
    crp = np.linalg.solve((lam + sigma)*np.eye(3) - S, z)   # classical Rodrigues parameters
    q = np.concatenate([[1.0], crp])
    return q / np.linalg.norm(q), lam

q_quest, lam = quest([b1,b2,b3], [r1,r2,r3], w)
print(f"lambda_max = {lam:.6f}   error vs truth: {angle_between_deg(quat_to_dcm(q_quest), A_true):.1e} deg")
# lambda_max = 7.000000   error vs truth: 3.5e-15 deg
```

(The polynomial's coefficients come from the traces of the powers of $\mathbf{K}$, through formulas called Newton's identities.)

On the same three-vector data QUEST lands on $\lambda_{\max}=7.0$, the sum of the weights, and its attitude matches the truth. QUEST is the solver that made optimal attitude determination practical on real flight computers, and it remains the flight-standard Wahba solver. Its papers also gave the attitude **covariance** — how uncertain the answer is — which is what the next lesson derives, and which a navigation filter needs.

QUEST has one weak spot, visible in its formula. If the true rotation is close to $180^\circ$, the matrix $(\lambda_{\max}+\sigma)\mathbf{I}-\mathbf{S}$ becomes nearly singular — close to impossible to invert — so the linear solve goes badly wrong even though $\lambda_{\max}$ itself was found accurately. (Shuster's fix was to re-run the problem in a rotated reference frame, so that the rotation is no longer near $180^\circ$.) **ESOQ**, the Estimator of the Optimal Quaternion, and its successor **ESOQ2**, both by Daniele Mortari in the late 1990s, were built to remove this weak spot. They reorganize the final step so the near-singular matrix is never formed, at the price of a more intricate derivation than this lesson reproduces.

::: key QUEST
QUEST solves the q-method without a full eigendecomposition: the largest eigenvalue of $\mathbf{K}$ is close to the sum of the weights, $\lambda_0=\sum_i a_i$, so Newton's method on $\det(\mathbf{K}-\lambda\mathbf{I})=0$ converges in a couple of steps; the attitude then follows from a $3\times3$ solve. It is the flight-standard Wahba solver. ESOQ and ESOQ2 harden its final step near a $180^\circ$ rotation.
:::

::: key The five Wahba solvers
TRIAD: exactly two vectors, a triad construction, no weights, no optimization. SVD: $\hat{\mathbf{A}}=\mathbf{U}\operatorname{diag}(1,1,\det\mathbf{U}\det\mathbf{V})\mathbf{V}^\mathsf{T}$. Davenport: eigenvector of the largest eigenvalue of $\mathbf{K}$. QUEST: the same $\lambda_{\max}$ by Newton's method, then a $3\times3$ solve. ESOQ/ESOQ2: QUEST's numerics hardened near $180^\circ$. All but TRIAD use every vector and any weights, and solve the identical optimization exactly.
:::

## How the methods actually degrade

Noise-free tests only prove the code is right. To see how the methods behave, we add noise and repeat many times — a **[[Monte Carlo|monte-carlo-trials]]** test.

Here is the setup. Two equally weighted body arrows each get random noise of $0.2^\circ$ per axis. The angle between the two reference arrows is swept from $90^\circ$ down to $2^\circ$. At each angle we run $20{,}000$ noisy trials and record the **RMS** (root-mean-square — the square root of the average squared) attitude error against the truth:

| Separation | TRIAD | Davenport / SVD / QUEST |
| --- | --- | --- |
| $90^\circ$ | $0.347^\circ$ | $0.317^\circ$ |
| $30^\circ$ | $0.602^\circ$ | $0.585^\circ$ |
| $10^\circ$ | $1.646^\circ$ | $1.640^\circ$ |
| $5^\circ$ | $3.247^\circ$ | $3.244^\circ$ |
| $2^\circ$ | $8.178^\circ$ | $8.177^\circ$ |

Two things are true here at once, and both matter.

First, Davenport, SVD and QUEST gave the same numbers in every trial, apart from the last digits of rounding. They are the same optimization, solved three ways.

Second, TRIAD is always worse, but by a shrinking fraction: about $9.5\%$ at $90^\circ$, about $3\%$ at $30^\circ$, and only about $0.01\%$ at $2^\circ$. Why does the gap *close* as things get worse? Because at small separations every method, optimal or not, is dominated by the same $1/\sin(\text{separation})$ blow-up. Two nearly parallel arrows simply do not contain the information about the spin around them — the hidden rotation from the last lesson. No algorithm can recover information that is not in the data. TRIAD's extra inefficiency is a fixed-size effect that gets drowned out.

So with two arrows, both kinds of method degrade the same way. The optimal methods pull ahead when there is more to use. Add a third arrow at $90^\circ$ to the near-parallel pair (all three at $0.2^\circ$): QUEST, which uses it, gets about $0.27^\circ$ RMS. TRIAD, which must throw it away, stays at about $8.1^\circ$ — thirty times worse. That is what "degrades gracefully" really means for the optimal methods: they use every measurement, so one good arrow rescues them.

::: example Where TRIAD really loses
TRIAD's other weakness shows when its primary arrow is the *wrong* choice — the noisier one. Make sensor 1 five times more accurate than sensor 2 ($0.1^\circ$ against $0.5^\circ$) and compare, over $20{,}000$ trials per angle, TRIAD with the right primary, TRIAD with the two swapped, and QUEST with weights $1/\sigma^2$:

| Separation | TRIAD, correct primary | TRIAD, primary swapped | QUEST (weighted) |
| --- | --- | --- | --- |
| $90^\circ$ | $0.517^\circ$ | $0.712^\circ$ | $0.517^\circ$ |
| $10^\circ$ | $2.943^\circ$ | $2.983^\circ$ | $2.943^\circ$ |
| $2^\circ$ | $14.99^\circ$ | $15.00^\circ$ | $14.99^\circ$ |

**Correct primary.** TRIAD matches QUEST to three figures. Trusting the much better sensor completely is almost what optimal weighting would do anyway: its weight is $25$ times bigger.

**Swapped primary.** At $90^\circ$ the error rises from $0.517^\circ$ to $0.712^\circ$. Divide: $0.712/0.517\approx1.38$, so nearly $40\%$ worse.

**QUEST** is the same either way, because it reads the weights from the data instead of needing a person to choose which sensor to trust absolutely.

Sanity check: at $2^\circ$ the swap barely matters, for the same reason as before — the geometry blow-up drowns everything. TRIAD cannot be told "trust this one $80\%$"; it can only be told "trust this one completely". That all-or-nothing choice is where its risk lives.
:::

::: warning Pick TRIAD's primary on purpose
In TRIAD, the primary arrow is matched exactly and the secondary only sets a plane. If you pass the arrows in whatever order they arrive from the sensor software, you may be trusting your worst sensor completely. Always make the more accurate sensor the primary — or use an optimal method and let the weights decide.
:::

## Check yourself

::: check
Explain why $\mathbf{A}=\mathbf{M}_b\mathbf{M}_r^\mathsf{T}$ in TRIAD sends $\mathbf{r}_1$ to $\mathbf{b}_1$ exactly, using only the fact that $\mathbf{M}_r$ is orthonormal.
:::

::: answer
Because the columns of $\mathbf{M}_r$ are orthonormal, $\mathbf{M}_r^\mathsf{T}\mathbf{M}_r=\mathbf{I}$. Now $\mathbf{r}_1=\mathbf{t}_1$ is the first column of $\mathbf{M}_r$, so $\mathbf{M}_r^\mathsf{T}\mathbf{r}_1 = \mathbf{e}_1=(1,0,0)^\mathsf{T}$, the first standard basis vector. (Each row of $\mathbf{M}_r^\mathsf{T}$ is one of the $\mathbf{t}_j$; dotting with $\mathbf{t}_1$ gives $1$ for $j=1$ and $0$ otherwise.)

Then $\mathbf{A}\mathbf{r}_1 = \mathbf{M}_b\mathbf{M}_r^\mathsf{T}\mathbf{r}_1 = \mathbf{M}_b\mathbf{e}_1 = \mathbf{s}_1 = \mathbf{b}_1$, the first column of $\mathbf{M}_b$.
:::

::: check
In the SVD derivation, why does $\lvert M_{ii}\rvert\le1$ hold for any orthogonal matrix $\mathbf{M}$, and why does that inequality alone rule out anything beating $\mathbf{M}=\mathbf{I}$ when $\det\mathbf{U}\det\mathbf{V}=+1$?
:::

::: answer
Each row of an orthogonal matrix is a unit vector, and $M_{ii}$ is one component of that row. The sum of the squares of a unit vector's components is $1$, so $M_{ii}^2\le1$.

Since every $\sigma_i\ge0$, $\sum_i M_{ii}\sigma_i \le \sum_i\lvert M_{ii}\rvert\sigma_i \le \sum_i\sigma_i$. This upper bound is reached only when every $M_{ii}=1$ at once. That forces $\mathbf{M}=\mathbf{I}$, because a unit-length row with one entry already equal to $1$ has no room for any other nonzero entry. And $\mathbf{M}=\mathbf{I}$ gives $\mathbf{A}=\mathbf{U}\mathbf{V}^\mathsf{T}$, which is a proper rotation exactly when $\det\mathbf{U}\det\mathbf{V}=+1$.
:::

::: check
Why does QUEST start its Newton iteration at $\lambda_0=\sum_i a_i$ rather than at zero or some arbitrary guess?
:::

::: answer
On noise-free data, $\lambda_{\max}(\mathbf{K})$ equals $\sum_i a_i$ exactly, and with realistic noise it stays close to it. So $\sum_i a_i$ is already an excellent approximation to the root Newton's method is looking for — this lesson's noise-free example gave $\lambda_{\max}=7.0=4+1+2$. Newton's method converges very fast from a good starting point, which is why two or three iterations are enough. That speed is the whole point of avoiding a full eigendecomposition. A poor start could need many more steps, or even land on a different root.
:::

::: check
At $2^\circ$ separation, TRIAD and the optimal methods are within about $0.01\%$ of each other, while at $90^\circ$ TRIAD is about $9.5\%$ worse. Explain why the gap shrinks rather than grows as the geometry gets worse.
:::

::: answer
As the two reference arrows approach parallel, the biggest source of error for *every* method is the $1/\sin(\text{separation})$ blow-up: two nearly identical directions barely constrain the spin about their shared axis. That is a limit on the information in the data, not on any algorithm.

TRIAD's extra inefficiency — from not combining the two arrows optimally — is a roughly fixed-size effect. Next to an error that is growing enormously, a fixed-size extra becomes a tiny fraction. So the two curves converge even as both errors grow.
:::

::: check
A satellite operator always makes its higher-accuracy star tracker channel the TRIAD primary. Based on this lesson's swapped-primary experiment, is that a reasonable default, and what does QUEST offer that makes the choice unnecessary?
:::

::: answer
Yes, it is a reasonable default given TRIAD's limits. The experiment showed that with the accurate sensor as primary, TRIAD tracks the optimal answer closely, while the wrong choice costs close to $40\%$ more RMS error at good geometry.

QUEST removes the need for the choice altogether. It takes a weight for each arrow directly from each sensor's known accuracy ($a_i=1/\sigma_i^2$) and combines all of them optimally, so there is no "primary" to get wrong. It can also use a third or fourth arrow, which TRIAD cannot.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{A}=\mathbf{M}_b\mathbf{M}_r^\mathsf{T}$ | TRIAD: two orthonormal triads from cross products; no weights, two vectors only |
| $\lVert\mathbf{r}_1\times\mathbf{r}_2\rVert=\sin(\text{separation})$ | Why TRIAD's error grows like $1/\sin(\text{separation})$ |
| $\hat{\mathbf{A}}=\mathbf{U}\operatorname{diag}(1,1,\det\mathbf{U}\det\mathbf{V})\mathbf{V}^\mathsf{T}$ | SVD method; the determinant correction avoids a reflection |
| $\mathbf{K}\mathbf{q}=\lambda_{\max}\mathbf{q}$ | Davenport q-method: eigenvector of the largest eigenvalue of the $4\times4$ $\mathbf{K}$ |
| $\lambda_0=\sum_i a_i$, Newton on $\det(\mathbf{K}-\lambda\mathbf{I})=0$ | QUEST: the same $\lambda_{\max}$ without a full eigendecomposition; then a $3\times3$ solve |
| ESOQ / ESOQ2 | QUEST's final step, rebuilt to avoid trouble near a $180^\circ$ rotation |
| Two vectors, nearly parallel | Every method blows up like $1/\sin(\text{separation})$; information is missing, not just badly used |
| Wrong TRIAD primary | Costs real accuracy at good geometry; weighted methods need no such choice |

Every number in this lesson compared an attitude answer against a truth we invented. A spacecraft in flight has no truth to compare with. The next lesson asks the question flight software really needs answered: from the sensor geometry and noise alone, how uncertain is the attitude — and exactly how does that uncertainty grow as two observed directions close in on each other?

::: context quaternion Four numbers for a rotation
A quaternion is a number with one ordinary part and three "imaginary" parts, invented by William Rowan Hamilton in 1843 — he was so pleased that he scratched the rule $i^2=j^2=k^2=ijk=-1$ into a bridge in Dublin. For a turn by angle $\phi$ about a unit axis $\mathbf{e}$, the unit quaternion is $\big(\cos\tfrac{\phi}{2},\ \mathbf{e}\sin\tfrac{\phi}{2}\big)$. Spacecraft software loves quaternions: four numbers instead of nine, no trouble at any attitude, and easy to keep tidy by rescaling to length $1$.
:::

::: context triad-history An old and trusted construction
TRIAD was published by Harold Black in 1964, a year before Wahba posed her problem, for determining the attitude of a satellite from two measured directions. Its name comes from the three perpendicular axes — a triad — it builds in each frame. It is still used today: as a quick first answer when a spacecraft wakes up, as a check on fancier methods, and on small satellites where simplicity matters more than the last bit of accuracy.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="120" y1="110" x2="240" y2="110" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="250,110 238,104 238,116" fill="#1d6fd1"/>
  <text x="258" y="114" font-size="12" fill="#1d6fd1">t1 = r1</text>
  <line x1="120" y1="110" x2="205" y2="60" stroke="#6c7a93" stroke-width="2"/>
  <text x="210" y="56" font-size="12" fill="#6c7a93">r2</text>
  <line x1="120" y1="110" x2="120" y2="20" stroke="#b4232c" stroke-width="3"/>
  <polygon points="120,12 114,24 126,24" fill="#b4232c"/>
  <text x="128" y="24" font-size="12" fill="#b4232c">t2 = r1 × r2, normalized</text>
  <line x1="120" y1="110" x2="62" y2="150" stroke="#1f2a44" stroke-width="3"/>
  <polygon points="55,155 60,142 69,151" fill="#1f2a44"/>
  <text x="14" y="140" font-size="12" fill="#1f2a44">t3</text>
</svg>
```

The secondary arrow $\mathbf{r}_2$ (gray) is not an axis itself; it only decides where $\mathbf{t}_2$ points. $\mathbf{t}_3=\mathbf{t}_1\times\mathbf{t}_2$ lies back in the plane of $\mathbf{r}_1$ and $\mathbf{r}_2$, here drawn coming toward you.
:::

::: context cross-product Why the cross product shrinks
The cross product $\mathbf{u}\times\mathbf{v}$ points perpendicular to both arrows, following the right-hand rule. Its length is the area of the parallelogram the two arrows make. For unit arrows that area is $\sin$ of the angle between them. As the arrows close up, the parallelogram flattens to a sliver and the cross product's length heads to zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <polygon points="20,95 80,95 80,35 20,35" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="113" font-size="12" text-anchor="middle" fill="#1f2a44">90°: area 1</text>
  <polygon points="130,95 190,95 220,43 160,43" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="175" y="113" font-size="12" text-anchor="middle" fill="#1f2a44">60°: area 0.87</text>
  <polygon points="235,95 295,95 354.7,88.7 294.7,88.7" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="295" y="113" font-size="12" text-anchor="middle" fill="#1f2a44">6°: area 0.10</text>
</svg>
```

Dividing by that shrinking length to make $\mathbf{t}_2$ a unit arrow is exactly where TRIAD magnifies noise.
:::

::: context reflection Mirror images are not rotations
Hold up your right hand to a mirror: the reflection is a left hand. No amount of turning makes a right glove into a left glove. A matrix that does this has determinant $-1$. With noisy or badly spread data, the plain answer $\mathbf{U}\mathbf{V}^\mathsf{T}$ can be such a mirror matrix. Flight software that used it would report an attitude no real spacecraft can have, and every command computed from it would be nonsense. The $\det\mathbf{U}\det\mathbf{V}$ entry is a single number that prevents this.
:::

::: context rayleigh Why the biggest eigenvalue wins
Any unit vector $\mathbf{q}$ can be written as a mix of the eigenvectors of the symmetric matrix $\mathbf{K}$: $\mathbf{q}=\sum_j c_j\mathbf{v}_j$ with $\sum_j c_j^2=1$. Then $\mathbf{q}^\mathsf{T}\mathbf{K}\mathbf{q}=\sum_j \lambda_j c_j^2$ — an average of the eigenvalues, weighted by the $c_j^2$. An average can never beat its largest member, so the best you can do is put all the weight on the biggest eigenvalue: choose $\mathbf{q}$ equal to its eigenvector. The name honors Lord Rayleigh, who used the ratio $\mathbf{q}^\mathsf{T}\mathbf{K}\mathbf{q}/\mathbf{q}^\mathsf{T}\mathbf{q}$ to study vibrations in the 1870s.
:::

::: context eigenvalue The direction a matrix only stretches
Most arrows get both turned and stretched when you multiply them by a matrix. A few special arrows are only stretched (or shrunk, or flipped): $\mathbf{K}\mathbf{v}=\lambda\mathbf{v}$. Those are eigenvectors, and $\lambda$ is the stretch factor. "Eigen" is German for "own": they are the matrix's own directions. Computing them for a $4\times4$ matrix is routine today but was a real cost on a 1970s flight computer, which is the problem QUEST was invented to dodge.
:::

::: context newtons-method Sliding down the tangent
To find where a curve crosses zero, stand at your guess, draw the tangent line, and follow it down to where it hits zero. That point is your next guess: $\lambda_{\text{new}}=\lambda-f(\lambda)/f'(\lambda)$. Near a root, each step roughly doubles the number of correct digits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M60,140 Q180,125 300,20" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="280" cy="37" r="4" fill="#b4232c"/>
  <line x1="280" y1="37" x2="190" y2="110" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="280" y1="37" x2="280" y2="110" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <circle cx="190" cy="110" r="4" fill="#b4232c"/>
  <circle cx="164" cy="110" r="3" fill="#1f2a44"/>
  <text x="150" y="100" font-size="12" text-anchor="middle" fill="#1f2a44">root</text>
  <text x="280" y="127" font-size="12" text-anchor="middle" fill="#1f2a44">guess</text>
  <text x="200" y="142" font-size="12" text-anchor="middle" fill="#b4232c">next guess</text>
  <text x="30" y="30" font-size="12" fill="#1d6fd1">f(λ) = det(K − λI)</text>
</svg>
```

QUEST's first guess, $\sum_i a_i$, is usually so close that the first step already lands almost on the root.
:::

::: context monte-carlo-trials Rolling the dice on purpose
A Monte Carlo test runs the same calculation thousands of times with fresh random noise each time and looks at the spread of results. The name comes from the famous casino in Monaco. Nicholas Metropolis suggested it in the 1940s as a code name for the random-sampling calculations Stanislaw Ulam and John von Neumann were developing. Its answers have their own scatter: with $20{,}000$ trials, an RMS error is typically good to about half a percent, so a rerun with different random numbers can change the third figure.
:::

::: context rodrigues Three numbers that blow up at a half-turn
The classical Rodrigues parameters describe a turn by angle $\phi$ about unit axis $\mathbf{e}$ as $\mathbf{p}=\mathbf{e}\tan(\phi/2)$. They are compact — three numbers — and make QUEST's last step a plain linear solve. But $\tan(\phi/2)$ shoots to infinity as $\phi$ approaches $180^\circ$. That is QUEST's weak spot seen from another angle: near a half-turn, the answer it is solving for is enormous, and the matrix it inverts is nearly singular.
:::
