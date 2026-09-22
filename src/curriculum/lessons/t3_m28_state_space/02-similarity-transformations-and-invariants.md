---
id: l02-similarity-transformations-and-invariants
title: Similarity transformations and what survives them
minutes: 15
covers:
  - Similarity transformations and what is invariant under them
---

Lesson 1 left four different state-space models of one antenna gimbal sitting side by side. Every one of them returned $0.240385\,\mathrm{rad/(N\,m)}$ at $s = 2\,\mathrm{s^{-1}}$, and every one had eigenvalues $0$, $-0.5$ and $-50\,\mathrm{s^{-1}}$, but their $\mathbf{A}$ matrices shared no entries at all. The relationship between them is a similarity transformation, and the reason this lesson exists is that a working engineer has to know, instantly, which quantities on a printout belong to the vehicle and which are artefacts of somebody's choice of state vector.

The Linear Algebra II module established the core of this for a bare matrix: $\mathbf{B} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}$ preserves eigenvalues, the characteristic polynomial, trace, determinant and rank, and the diagonalisation $\boldsymbol{\Lambda} = \mathbf{V}^{-1}\mathbf{A}\mathbf{V}$ is the particular transform whose new basis is the eigenvectors. Here the same operation acts on a whole quadruple $(\mathbf{A}, \mathbf{B}, \mathbf{C}, \mathbf{D})$, and the invariant list grows: the transfer matrix, the Markov parameters, controllability and observability, the Hankel singular values. Equally important is the list that does not survive, because it contains the Gramians and every condition number you might be tempted to quote.

This lesson derives the transformation rules for the quadruple, proves the invariance of the transfer matrix and the Markov parameters, builds the two transforms you will actually construct on the job — physical to canonical and physical to modal — and then shows a scaling transform ruining the conditioning of a model whose dynamics did not change at all.

## The transformation rule for a quadruple

Let $\mathbf{T}$ be any invertible $n\times n$ matrix and define a new state $\mathbf{z}$ by $\mathbf{x} = \mathbf{T}\mathbf{z}$, equivalently $\mathbf{z} = \mathbf{T}^{-1}\mathbf{x}$. Since $\mathbf{T}$ is constant, $\dot{\mathbf{x}} = \mathbf{T}\dot{\mathbf{z}}$, and substituting into the state equation gives $\mathbf{T}\dot{\mathbf{z}} = \mathbf{A}\mathbf{T}\mathbf{z} + \mathbf{B}\mathbf{u}$. Multiply on the left by $\mathbf{T}^{-1}$, and substitute into the output equation as well:

$$\dot{\mathbf{z}} = \underbrace{\mathbf{T}^{-1}\mathbf{A}\mathbf{T}}_{\bar{\mathbf{A}}}\,\mathbf{z} + \underbrace{\mathbf{T}^{-1}\mathbf{B}}_{\bar{\mathbf{B}}}\,\mathbf{u}, \qquad \mathbf{y} = \underbrace{\mathbf{C}\mathbf{T}}_{\bar{\mathbf{C}}}\,\mathbf{z} + \underbrace{\mathbf{D}}_{\bar{\mathbf{D}}}\,\mathbf{u}.$$

Read the pattern: $\mathbf{A}$ sees $\mathbf{T}$ on both sides because it maps states to state rates; $\mathbf{B}$ sees only $\mathbf{T}^{-1}$ because its input end is untouched; $\mathbf{C}$ sees only $\mathbf{T}$ because its output end is untouched; $\mathbf{D}$ never changes, because it bypasses the state entirely.

::: key State-space similarity transformation
With $\mathbf{x} = \mathbf{T}\mathbf{z}$ and $\mathbf{T}$ invertible, the same plant is $(\bar{\mathbf{A}}, \bar{\mathbf{B}}, \bar{\mathbf{C}}, \bar{\mathbf{D}}) = (\mathbf{T}^{-1}\mathbf{A}\mathbf{T},\ \mathbf{T}^{-1}\mathbf{B},\ \mathbf{C}\mathbf{T},\ \mathbf{D})$. Two realizations related this way have the same dimension and the same input-output behaviour; they differ only in what the state vector means.
:::

### The transfer matrix is invariant

Substitute the transformed matrices into $\bar{\mathbf{G}}(s) = \bar{\mathbf{C}}(s\mathbf{I} - \bar{\mathbf{A}})^{-1}\bar{\mathbf{B}} + \bar{\mathbf{D}}$. Write $s\mathbf{I} - \mathbf{T}^{-1}\mathbf{A}\mathbf{T} = \mathbf{T}^{-1}(s\mathbf{I} - \mathbf{A})\mathbf{T}$, using $\mathbf{T}^{-1}(s\mathbf{I})\mathbf{T} = s\mathbf{I}$. Inverting a product reverses it:

$$\bar{\mathbf{G}}(s) = \mathbf{C}\mathbf{T}\,\mathbf{T}^{-1}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{T}\,\mathbf{T}^{-1}\mathbf{B} + \mathbf{D} = \mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} + \mathbf{D} = \mathbf{G}(s).$$

Every $\mathbf{T}$ pairs off with a $\mathbf{T}^{-1}$. The input-output behaviour cannot depend on the coordinates because nothing outside the box ever sees them.

### The Markov parameters are invariant

Expand $(s\mathbf{I}-\mathbf{A})^{-1}$ for large $s$: $(s\mathbf{I}-\mathbf{A})^{-1} = s^{-1}(\mathbf{I} - \mathbf{A}/s)^{-1} = s^{-1}\sum_{k\ge0}(\mathbf{A}/s)^k$, so

$$\mathbf{G}(s) = \mathbf{D} + \frac{\mathbf{C}\mathbf{B}}{s} + \frac{\mathbf{C}\mathbf{A}\mathbf{B}}{s^2} + \frac{\mathbf{C}\mathbf{A}^2\mathbf{B}}{s^3} + \cdots$$

The coefficients $\mathbf{M}_k = \mathbf{C}\mathbf{A}^k\mathbf{B}$ are the **Markov parameters**. They are the derivatives of the impulse response at $t = 0^+$, and because $\bar{\mathbf{C}}\bar{\mathbf{A}}^k\bar{\mathbf{B}} = \mathbf{C}\mathbf{T}(\mathbf{T}^{-1}\mathbf{A}\mathbf{T})^k\mathbf{T}^{-1}\mathbf{B} = \mathbf{C}\mathbf{A}^k\mathbf{B}$, they survive any similarity. They are a useful fingerprint: two realizations of the same plant must have identical Markov parameters, so comparing $\mathbf{C}\mathbf{B}$, $\mathbf{C}\mathbf{A}\mathbf{B}$ and $\mathbf{C}\mathbf{A}^2\mathbf{B}$ is a fast check that a coordinate change was implemented correctly. The first non-zero $\mathbf{M}_k$ also fixes the relative degree: for the gimbal, $\mathbf{C}\mathbf{B} = 0$, $\mathbf{C}\mathbf{A}\mathbf{B} = 0$, $\mathbf{C}\mathbf{A}^2\mathbf{B} = 62.5$, so three integrations separate the torque command from the measured angle.

### Controllability and observability are invariant

The controllability matrix of the transformed system is

$$\bar{\mathbf{C}}_m = \left[\bar{\mathbf{B}},\ \bar{\mathbf{A}}\bar{\mathbf{B}},\ \dots\right] = \left[\mathbf{T}^{-1}\mathbf{B},\ \mathbf{T}^{-1}\mathbf{A}\mathbf{B},\ \dots\right] = \mathbf{T}^{-1}\mathbf{C}_m,$$

and the observability matrix is $\bar{\mathbf{O}}_m = \mathbf{O}_m\mathbf{T}$. Multiplying by an invertible matrix on either side cannot change rank, so *whether* a system is controllable or observable is a property of the plant, not of the coordinates. Lessons 4 and 5 lean on this constantly: it is why you may test controllability in whichever realization is numerically cleanest.

### What does not survive

- **The entries.** Not preserved, and not interesting.
- **The Gramians.** Lesson 4 defines $\mathbf{W}_c = \int e^{\mathbf{A}t}\mathbf{B}\mathbf{B}^\mathsf{T}e^{\mathbf{A}^\mathsf{T}t}\,dt$ and its observability twin $\mathbf{W}_o$. Under $\mathbf{x} = \mathbf{T}\mathbf{z}$ they transform by **congruence**, not similarity: $\bar{\mathbf{W}}_c = \mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}}$ and $\bar{\mathbf{W}}_o = \mathbf{T}^{\mathsf{T}}\mathbf{W}_o\mathbf{T}$. Their eigenvalues, and therefore their condition numbers, change freely.
- **Condition numbers of anything.** Because congruence and scaling move them. A model in radians and a model in arcseconds have the same dynamics and can differ by orders of magnitude in conditioning.
- **The units and the physical meaning of the state.** The canonical-form state of Lesson 1 has units of $\mathrm{rad\,N\,m\,s^3}$.

The one combination that does survive is the **product**: $\bar{\mathbf{W}}_c\bar{\mathbf{W}}_o = \mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}}\mathbf{T}^{\mathsf{T}}\mathbf{W}_o\mathbf{T} = \mathbf{T}^{-1}(\mathbf{W}_c\mathbf{W}_o)\mathbf{T}$, a genuine similarity. So $\operatorname{eig}(\mathbf{W}_c\mathbf{W}_o)$ is invariant, and its square roots are the **Hankel singular values** that Lesson 11 uses to decide which states to throw away. That one invariant is the whole reason balanced truncation is a well-posed question.

::: warning Which way round is $\mathbf{T}$?
The single most common bug in this material is getting the direction wrong. Fix the convention $\mathbf{x} = \mathbf{T}\mathbf{z}$: the columns of $\mathbf{T}$ are the new basis vectors written in old coordinates, so $\mathbf{T}$ converts *new to old* and $\mathbf{T}^{-1}$ converts *old to new*. Then $\bar{\mathbf{A}} = \mathbf{T}^{-1}\mathbf{A}\mathbf{T}$. The opposite convention, $\mathbf{z} = \mathbf{T}\mathbf{x}$, gives $\bar{\mathbf{A}} = \mathbf{T}\mathbf{A}\mathbf{T}^{-1}$, and both are similar to $\mathbf{A}$, so trace, determinant and eigenvalue checks all pass whichever way you multiply. The only checks that catch the error are $\bar{\mathbf{B}} = \mathbf{T}^{-1}\mathbf{B}$ and $\bar{\mathbf{C}} = \mathbf{C}\mathbf{T}$, or pushing a state vector you can picture through the conversion by hand.
:::

## Two transforms you will actually build

### Physical to controllable canonical

Since $\bar{\mathbf{C}}_m = \mathbf{T}^{-1}\mathbf{C}_m$, the transform taking a controllable realization $(\mathbf{A}, \mathbf{B})$ to controllable canonical form $(\mathbf{A}_c, \mathbf{B}_c)$ satisfies $\mathbf{C}_m^{(c)} = \mathbf{T}^{-1}\mathbf{C}_m$, hence

$$\mathbf{T} = \mathbf{C}_m\left(\mathbf{C}_m^{(c)}\right)^{-1},$$

where $\mathbf{C}_m = [\mathbf{B}, \mathbf{A}\mathbf{B}, \dots, \mathbf{A}^{n-1}\mathbf{B}]$ is the physical controllability matrix and $\mathbf{C}_m^{(c)}$ is the same thing built from the companion pair. Both are invertible exactly when the system is controllable — which is why the canonical form only exists for a controllable system, and why Ackermann's formula in Lesson 6 needs $\mathbf{C}_m^{-1}$.

::: example The gimbal's coordinate change, two ways
For the gimbal, $\mathbf{A} = \begin{pmatrix} 0 & 1 & 0 \\ 0 & -0.5 & 1.25 \\ 0 & 0 & -50\end{pmatrix}$, $\mathbf{B} = (0,0,50)^\mathsf{T}$. Then

$$\mathbf{C}_m = \begin{pmatrix} 0 & 0 & 62.5 \\ 0 & 62.5 & -3156.25 \\ 50 & -2500 & 125000\end{pmatrix}, \qquad \mathbf{C}_m^{(c)} = \begin{pmatrix} 0 & 0 & 1 \\ 0 & 1 & -50.5 \\ 1 & -50.5 & 2525.25\end{pmatrix},$$

and multiplying out $\mathbf{T} = \mathbf{C}_m(\mathbf{C}_m^{(c)})^{-1}$ gives

$$\mathbf{T} = \begin{pmatrix} 62.5 & 0 & 0 \\ 0 & 62.5 & 0 \\ 0 & 25 & 50\end{pmatrix}, \qquad \mathbf{T}^{-1} = \begin{pmatrix} 0.016 & 0 & 0 \\ 0 & 0.016 & 0 \\ 0 & -0.008 & 0.02\end{pmatrix}.$$

Every entry is checkable by hand, which is the point of the exercise. Read $\mathbf{x} = \mathbf{T}\mathbf{z}$ row by row: $\theta = 62.5\,z_1$, $\omega = 62.5\,z_2$, $\tau = 25\,z_2 + 50\,z_3$. The first is the output equation $\mathbf{C}_c = (62.5\ \ 0\ \ 0)$ read backwards. The second follows because $\omega = \dot{\theta} = 62.5\,\dot{z}_1 = 62.5\,z_2$, using $\dot{z}_1 = z_2$ from the companion structure. The third follows from the dynamics: $\tau = J\dot{\omega} + b\omega = 0.8(62.5\,z_3) + 0.4(62.5\,z_2) = 50\,z_3 + 25\,z_2$. The canonical state is the physical state differentiated and rescaled, exactly as the derivation of the form promised.

Verifying: $\mathbf{T}^{-1}\mathbf{A}\mathbf{T}$ reproduces $\mathbf{A}_c$ to $10^{-17}$, $\mathbf{T}^{-1}\mathbf{B} = (0,0,1)^\mathsf{T}$ exactly, and $\mathbf{C}\mathbf{T} = (62.5\ \ 0\ \ 0)$ exactly.
:::

### Physical to modal

If $\mathbf{A}$ has a full set of eigenvectors, stack them as the columns of $\mathbf{V}$ and take $\mathbf{T} = \mathbf{V}$. Then $\bar{\mathbf{A}} = \mathbf{V}^{-1}\mathbf{A}\mathbf{V} = \boldsymbol{\Lambda}$ is diagonal, and the state equation splits into $n$ scalar equations $\dot{z}_i = \lambda_i z_i + \bar{b}_i^\mathsf{T}\mathbf{u}$ — the modal coordinates of Linear Algebra II, now with inputs attached. The $i$-th row of $\bar{\mathbf{B}} = \mathbf{V}^{-1}\mathbf{B}$ says how strongly each input drives mode $i$; the $i$-th column of $\bar{\mathbf{C}} = \mathbf{C}\mathbf{V}$ says how strongly mode $i$ shows up in each output. A mode with a zero row in $\bar{\mathbf{B}}$ is unreachable; a mode with a zero column in $\bar{\mathbf{C}}$ is invisible. That is the entire content of Lessons 4 and 5 for a diagonalisable plant, visible by inspection.

Eigenvectors are only determined up to a scale factor, and that freedom is a free diagonal transform $\mathbf{T} = \mathbf{V}\mathbf{S}$ with $\mathbf{S}$ diagonal. The residue convention of Lesson 1 picks $\mathbf{S}$ so that $\bar{\mathbf{B}} = (1,\dots,1)^\mathsf{T}$ and all the information moves into $\bar{\mathbf{C}}$.

::: example Modal coordinates of the gimbal, with the scaling fixed
Solving $(\mathbf{A} - \lambda\mathbf{I})\mathbf{v} = \mathbf{0}$ for $\lambda = 0,\ -0.5,\ -50$ gives, with a convenient normalisation,

$$\mathbf{v}_1 = \begin{pmatrix}1\\0\\0\end{pmatrix},\quad \mathbf{v}_2 = \begin{pmatrix}1\\-0.5\\0\end{pmatrix},\quad \mathbf{v}_3 = \begin{pmatrix}0.000505\\-0.025253\\1\end{pmatrix}.$$

Check $\mathbf{v}_3$ by hand: the last row of $(\mathbf{A}+50\mathbf{I})\mathbf{v} = \mathbf{0}$ is automatically satisfied, the middle row gives $49.5\,v_2 + 1.25\,v_3 = 0$ so $v_2 = -1.25/49.5 = -0.025253$, and the top row gives $50\,v_1 + v_2 = 0$ so $v_1 = 0.000505$. Taking $\mathbf{T} = \mathbf{V}$ and computing $\mathbf{V}^{-1}\mathbf{B}$ returns $(2.5,\ -2.525,\ 50)^\mathsf{T}$, so rescale with $\mathbf{S} = \operatorname{diag}(2.5,\ -2.525,\ 50)$:

$$\mathbf{T} = \mathbf{V}\mathbf{S} = \begin{pmatrix} 2.5 & -2.525 & 0.02525 \\ 0 & 1.263 & -1.263 \\ 0 & 0 & 50\end{pmatrix}.$$

Now $\mathbf{T}^{-1}\mathbf{A}\mathbf{T} = \operatorname{diag}(0,\ -0.5,\ -50)$, $\mathbf{T}^{-1}\mathbf{B} = (1,1,1)^\mathsf{T}$ and $\mathbf{C}\mathbf{T} = (2.5,\ -2.525,\ 0.02525)$ — the modal realization Lesson 1 obtained from partial fractions, reached here from eigenvectors instead. Two routes, one realization, because the transform between any two realizations of the same minimal plant is unique.

The first row of $\mathbf{T}$ is the physical reading of the modal states: the measured angle is $\theta = 2.5\,z_1 - 2.525\,z_2 + 0.02525\,z_3$. A unit of the fast modal state contributes a hundred times less angle than a unit of either slow one.
:::

## Scaling is a similarity transform, and it decides your conditioning

The most consequential similarity transform in practice is the least interesting mathematically: $\mathbf{T} = \operatorname{diag}(t_1, \dots, t_n)$, a change of units for each state. From the rule, $\bar{a}_{ij} = a_{ij}t_j/t_i$, $\bar{b}_{ij} = b_{ij}/t_i$ and $\bar{c}_{ij} = c_{ij}t_j$. The eigenvalues do not move. Everything about the numerical behaviour does.

::: example What arcseconds do to a gimbal model
Re-express the gimbal's angle and rate in arcseconds, $1\,\mathrm{rad} = 206{,}265''$, leaving the torque state in $\mathrm{N\,m}$: $\mathbf{T} = \operatorname{diag}(1/206265,\ 1/206265,\ 1)$. The model becomes

$$\bar{\mathbf{A}} = \begin{pmatrix} 0 & 1 & 0 \\ 0 & -0.5 & 257{,}831 \\ 0 & 0 & -50\end{pmatrix},\quad \bar{\mathbf{B}} = \begin{pmatrix}0\\0\\50\end{pmatrix},\quad \bar{\mathbf{C}} = \begin{pmatrix}4.848\times10^{-6} & 0 & 0\end{pmatrix}.$$

Eigenvalues: $0$, $-0.5$, $-50\,\mathrm{s^{-1}}$, unchanged. Markov parameters: $0$, $0$, $62.5$, $-3156.25$, unchanged. Transfer function at $s = 2$: $0.240385$, unchanged. The plant is the same plant.

But the condition number of the controllability matrix has gone from $1.29\times10^5$ to $1.30\times10^7$, a factor of 100 worse, because one entry of $\bar{\mathbf{A}}$ now sits eleven orders of magnitude above the smallest. Any algorithm that inverts $\mathbf{C}_m$ — Ackermann's formula, most textbook canonical-form constructions — loses two further decimal digits for nothing.

The Gramians make the same point more sharply on the stable part of the model. Drop the angle state and keep the rate subsystem $\mathbf{A} = \begin{pmatrix}-0.5 & 1.25\\0 & -50\end{pmatrix}$, $\mathbf{B} = (0, 50)^\mathsf{T}$, $\mathbf{C} = (1\ \ 0)$, which is stable so the infinite-horizon Gramians exist. In $\mathrm{rad/s}$,

$$\mathbf{W}_c = \begin{pmatrix} 1.547 & 0.619 \\ 0.619 & 25\end{pmatrix}, \qquad \operatorname{cond}(\mathbf{W}_c) = 16.3.$$

Re-express the rate in $\mathrm{mrad/s}$, $\mathbf{T} = \operatorname{diag}(10^{-3}, 1)$, and the congruence $\bar{\mathbf{W}}_c = \mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}}$ gives $\bar{W}_{c,11} = 1.547\times10^6$ and $\operatorname{cond}(\bar{\mathbf{W}}_c) = 6.25\times10^4$. A condition number quoted without the units of the state vector is not a statement about the vehicle.

What did survive: $\operatorname{eig}(\mathbf{W}_c\mathbf{W}_o) = (1.593,\ 1.47\times10^{-4})$ before and after, so the Hankel singular values $\sigma = (1.262,\ 0.01214)$ are identical in both unit systems. They say the second state contributes about a hundredth as much to the input-output map as the first, and that statement is about the gimbal.
:::

```python
import numpy as np

A = np.array([[0.0, 1, 0], [0, -0.5, 1.25], [0, 0, -50]])
B = np.array([[0.0], [0], [50]])
C = np.array([[1.0, 0, 0]])

def transform(A, B, C, T):
    Ti = np.linalg.inv(T)
    return Ti @ A @ T, Ti @ B, C @ T

def markov(A, B, C, k):
    return [float((C @ np.linalg.matrix_power(A, j) @ B)[0, 0]) for j in range(k)]

k = 206265.0                                   # arcseconds per radian
Ab, Bb, Cb = transform(A, B, C, np.diag([1 / k, 1 / k, 1.0]))
print("eigs   ", np.sort(np.linalg.eigvals(A).real), np.sort(np.linalg.eigvals(Ab).real))
print("markov ", markov(A, B, C, 4), markov(Ab, Bb, Cb, 4))
def ctrb(A, B):
    return np.hstack([np.linalg.matrix_power(A, j) @ B for j in range(A.shape[0])])
print("cond   ", f"{np.linalg.cond(ctrb(A, B)):.3e}", f"{np.linalg.cond(ctrb(Ab, Bb)):.3e}")
# eigs    [-50.   -0.5   0. ] [-50.   -0.5   0. ]
# markov  [0.0, 0.0, 62.5, -3156.25] [0.0, 0.0, 62.5, -3156.25]
# cond    1.294e+05 1.303e+07
```

::: note Scale the model before you design with it
A common preprocessing step is to choose $\mathbf{T}$ so that one unit of each state is one unit of "how much of this do I care about" — one arcsecond of pointing error, one millidegree per second of rate, one percent of full wheel torque. The dynamics are untouched, the numerics improve, and weighting matrices in Lesson 9 and in the LQR module become dimensionless and comparable. Scaling is free and almost always worth doing.
:::

## Check yourself

::: check
A colleague changes a spacecraft model's state from $(\boldsymbol{\theta}, \boldsymbol{\omega})$ in $\mathrm{rad},\ \mathrm{rad/s}$ to $(\boldsymbol{\theta}, \mathbf{h})$ where $\mathbf{h} = \mathbf{J}\boldsymbol{\omega}$ is the body angular momentum. Write $\mathbf{T}$ and give $\bar{\mathbf{A}}$, $\bar{\mathbf{B}}$ for the six-state model of Lesson 1.
:::

::: answer
The new state is $\mathbf{z} = (\boldsymbol{\theta}, \mathbf{h})$ and $\mathbf{x} = \mathbf{T}\mathbf{z}$ requires $\boldsymbol{\omega} = \mathbf{J}^{-1}\mathbf{h}$, so $\mathbf{T} = \operatorname{diag}(\mathbf{I}_3,\ \mathbf{J}^{-1})$ and $\mathbf{T}^{-1} = \operatorname{diag}(\mathbf{I}_3,\ \mathbf{J})$. Then

$$\bar{\mathbf{A}} = \mathbf{T}^{-1}\mathbf{A}\mathbf{T} = \begin{pmatrix} \mathbf{0} & \mathbf{J}^{-1} \\ \mathbf{0} & \mathbf{0}\end{pmatrix}, \qquad \bar{\mathbf{B}} = \mathbf{T}^{-1}\mathbf{B} = \begin{pmatrix}\mathbf{0}\\ \mathbf{A}_w\end{pmatrix}.$$

The inertia has moved out of $\mathbf{B}$ and into $\mathbf{A}$. This is a genuinely useful choice: $\bar{\mathbf{B}}$ is now the wheel geometry alone, so a change of inertia during the mission touches only $\bar{\mathbf{A}}$. All six eigenvalues are still zero.
:::

::: check
Two engineers report the same plant. One gives $\operatorname{cond}(\mathbf{W}_o) = 4\times10^3$, the other $\operatorname{cond}(\mathbf{W}_o) = 2\times10^8$. Can they both be right, and what should you ask for?
:::

::: answer
Yes, both can be right. The observability Gramian transforms by congruence, $\bar{\mathbf{W}}_o = \mathbf{T}^\mathsf{T}\mathbf{W}_o\mathbf{T}$, so a diagonal change of state units multiplies row $i$ and column $i$ by $t_i$ and moves the eigenvalue spread at will. Ask for the state vector definition and its units, and for the numbers after a sensible scaling — one unit of each state meaning one unit of engineering significance. If you want a coordinate-free statement, ask for the Hankel singular values instead, because $\operatorname{eig}(\mathbf{W}_c\mathbf{W}_o)$ is invariant.
:::

::: check
Show that if $\bar{\mathbf{A}} = \mathbf{T}^{-1}\mathbf{A}\mathbf{T}$ then $e^{\bar{\mathbf{A}}t} = \mathbf{T}^{-1}e^{\mathbf{A}t}\mathbf{T}$, and say what that means for the state transition matrix in two different coordinate systems.
:::

::: answer
$\bar{\mathbf{A}}^k = (\mathbf{T}^{-1}\mathbf{A}\mathbf{T})^k = \mathbf{T}^{-1}\mathbf{A}^k\mathbf{T}$ because the interior $\mathbf{T}\mathbf{T}^{-1}$ pairs cancel. Summing the series $\sum_k \bar{\mathbf{A}}^kt^k/k!$ term by term gives $\mathbf{T}^{-1}e^{\mathbf{A}t}\mathbf{T}$. So the state transition matrix is itself a similarity transform of the original one. Propagating in new coordinates is the same as converting to old coordinates, propagating, and converting back: $\mathbf{z}(t) = \mathbf{T}^{-1}e^{\mathbf{A}t}\mathbf{T}\mathbf{z}(0)$. Its eigenvalues $e^{\lambda_it}$ are the same in both, so a stability verdict from $\boldsymbol{\Phi}$ does not depend on coordinates either.
:::

::: check
Someone claims $\mathbf{A}_1 = \begin{pmatrix}-2 & 0\\0 & -3\end{pmatrix}$, $\mathbf{B}_1 = \begin{pmatrix}1\\1\end{pmatrix}$, $\mathbf{C}_1 = (1\ \ 1)$ and $\mathbf{A}_2 = \begin{pmatrix}-2 & 0\\0 & -3\end{pmatrix}$, $\mathbf{B}_2 = \begin{pmatrix}2\\1\end{pmatrix}$, $\mathbf{C}_2 = (0.5\ \ 1)$ are the same plant. Check it with the Markov parameters.
:::

::: answer
$\mathbf{C}_1\mathbf{B}_1 = 1 + 1 = 2$ and $\mathbf{C}_2\mathbf{B}_2 = 0.5(2) + 1 = 2$. $\mathbf{C}_1\mathbf{A}_1\mathbf{B}_1 = -2 - 3 = -5$ and $\mathbf{C}_2\mathbf{A}_2\mathbf{B}_2 = 0.5(-2)(2) + 1(-3)(1) = -5$. $\mathbf{C}_1\mathbf{A}_1^2\mathbf{B}_1 = 4 + 9 = 13$ and $\mathbf{C}_2\mathbf{A}_2^2\mathbf{B}_2 = 0.5(4)(2) + 9 = 13$. They agree, and indeed $\mathbf{T} = \operatorname{diag}(0.5,\ 1)$ maps the first to the second: $\mathbf{T}^{-1}\mathbf{B}_1 = (2,1)^\mathsf{T}$ and $\mathbf{C}_1\mathbf{T} = (0.5\ \ 1)$, with $\bar{\mathbf{A}}$ unchanged because diagonal matrices commute. Both are the same plant $G(s) = 1/(s+2) + 1/(s+3)$.
:::

::: check
Why does the controllable canonical form fail to exist for an uncontrollable system, and what goes wrong numerically for one that is nearly uncontrollable?
:::

::: answer
The transform is $\mathbf{T} = \mathbf{C}_m(\mathbf{C}_m^{(c)})^{-1}$, which needs $\mathbf{C}_m$ to be invertible — that is, the system must be controllable. For an uncontrollable system no similarity can reach the companion form, because similarity preserves the rank of $\mathbf{C}_m$ and the companion pair is controllable by construction. For a nearly uncontrollable system $\mathbf{C}_m$ is invertible but badly conditioned, $\mathbf{T}$ is computed with large relative error, and any gain designed through that route inherits the error. This is the practical reason Lesson 6 prefers an eigenstructure routine to Ackermann's formula for anything but small hand problems.
:::

## Summary

| Item | Statement |
| --- | --- |
| Transformation | $\mathbf{x} = \mathbf{T}\mathbf{z}$ gives $(\mathbf{T}^{-1}\mathbf{A}\mathbf{T},\ \mathbf{T}^{-1}\mathbf{B},\ \mathbf{C}\mathbf{T},\ \mathbf{D})$ |
| Invariant | $\mathbf{G}(s)$; eigenvalues and characteristic polynomial; Markov parameters $\mathbf{C}\mathbf{A}^k\mathbf{B}$; $\operatorname{rank}\mathbf{C}_m$ and $\operatorname{rank}\mathbf{O}_m$; stability; $\operatorname{eig}(\mathbf{W}_c\mathbf{W}_o)$ |
| Not invariant | matrix entries; $\mathbf{W}_c$ and $\mathbf{W}_o$ separately; every condition number; state units |
| Structure matrices | $\bar{\mathbf{C}}_m = \mathbf{T}^{-1}\mathbf{C}_m$, $\bar{\mathbf{O}}_m = \mathbf{O}_m\mathbf{T}$ |
| Gramians | congruence: $\bar{\mathbf{W}}_c = \mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}}$, $\bar{\mathbf{W}}_o = \mathbf{T}^{\mathsf{T}}\mathbf{W}_o\mathbf{T}$ |
| To canonical form | $\mathbf{T} = \mathbf{C}_m(\mathbf{C}_m^{(c)})^{-1}$; exists iff controllable |
| To modal form | $\mathbf{T} = \mathbf{V}$ (eigenvectors), then a diagonal rescale; $\bar{\mathbf{B}}$ row $i$ = drive on mode $i$, $\bar{\mathbf{C}}$ column $i$ = visibility of mode $i$ |
| Scaling | $\mathbf{T} = \operatorname{diag}(t_i)$: $\bar{a}_{ij} = a_{ij}t_j/t_i$; same dynamics, different conditioning |
| Gimbal numbers | $\mathbf{T}_{\text{canon}} = \begin{pmatrix}62.5&0&0\\0&62.5&0\\0&25&50\end{pmatrix}$; Markov $0,\ 0,\ 62.5,\ -3156.25$ |

The next lesson stops rewriting the model and starts solving it: the matrix exponential turns $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ into an explicit trajectory, and the zero-order-hold version of that solution is the model your flight computer actually runs.
