---
id: l02-similarity-transformations-and-invariants
title: Similarity transformations and what survives them
minutes: 19
covers:
  - Similarity transformations and what is invariant under them
---

Lesson 1 left four different state-space models of one antenna gimbal side by side. Every one of them returned $0.240385\,\mathrm{rad/(N\,m)}$ at $s = 2\,\mathrm{s^{-1}}$. Every one had eigenvalues $0$, $-0.5$ and $-50\,\mathrm{s^{-1}}$. Yet their $\mathbf{A}$ matrices shared almost no entries. How can that be?

Think of a room described by two people. One measures in feet from the door. The other measures in meters from the window. Their numbers disagree completely, but the room is the same room. The couch is the same length whichever tape measure you use. A state-space model is the same: the vehicle is fixed, but the numbers inside $\mathbf{A}$, $\mathbf{B}$ and $\mathbf{C}$ depend on how you chose to describe the state.

The rule that converts one description into another is a **similarity transformation**. A working engineer has to know, instantly, which numbers on a printout belong to the vehicle and which are only an artifact of somebody's choice of state. This lesson gives you both lists.

You met the core of this in Linear Algebra II for a bare matrix. The change $\mathbf{P}^{-1}\mathbf{A}\mathbf{P}$ keeps the eigenvalues, the characteristic polynomial, the trace, the determinant and the rank. Diagonalizing, $\boldsymbol{\Lambda} = \mathbf{V}^{-1}\mathbf{A}\mathbf{V}$, is the special case where the new basis is the eigenvectors. Here the same move acts on a whole set $(\mathbf{A}, \mathbf{B}, \mathbf{C}, \mathbf{D})$, and the list of things that survive grows. Equally important is the list that does not survive. It contains every condition number you might be tempted to quote.

## The transformation rule for a whole model

Pick any invertible $n\times n$ matrix $\mathbf{T}$. Define a new state $\mathbf{z}$ by

$$\mathbf{x} = \mathbf{T}\mathbf{z}, \qquad \text{equivalently} \qquad \mathbf{z} = \mathbf{T}^{-1}\mathbf{x}.$$

This is a **[[change of coordinates|same-arrow-two-grids]]**. Same state, new numbers. Now push it through the equations, one step at a time.

1. $\mathbf{T}$ is constant, so $\dot{\mathbf{x}} = \mathbf{T}\dot{\mathbf{z}}$.
2. Substitute into $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$: $\ \mathbf{T}\dot{\mathbf{z}} = \mathbf{A}\mathbf{T}\mathbf{z} + \mathbf{B}\mathbf{u}$.
3. Multiply both sides on the left by $\mathbf{T}^{-1}$ to get $\dot{\mathbf{z}}$ alone.
4. Substitute $\mathbf{x} = \mathbf{T}\mathbf{z}$ into the output equation too.

The result:

$$\dot{\mathbf{z}} = \underbrace{\mathbf{T}^{-1}\mathbf{A}\mathbf{T}}_{\bar{\mathbf{A}}}\,\mathbf{z} + \underbrace{\mathbf{T}^{-1}\mathbf{B}}_{\bar{\mathbf{B}}}\,\mathbf{u}, \qquad \mathbf{y} = \underbrace{\mathbf{C}\mathbf{T}}_{\bar{\mathbf{C}}}\,\mathbf{z} + \underbrace{\mathbf{D}}_{\bar{\mathbf{D}}}\,\mathbf{u}.$$

The bar, as in $\bar{\mathbf{A}}$ ("A bar"), marks the matrices of the new model. Read the pattern:

- $\mathbf{A}$ gets $\mathbf{T}$ on both sides, because it turns states into state rates — both of its ends touch the state.
- $\mathbf{B}$ gets only $\mathbf{T}^{-1}$, because its input end is untouched.
- $\mathbf{C}$ gets only $\mathbf{T}$, because its output end is untouched.
- $\mathbf{D}$ never changes, because it skips the state entirely.

::: key State-space similarity transformation
With $\mathbf{x} = \mathbf{T}\mathbf{z}$ and $\mathbf{T}$ invertible, the same plant is $(\bar{\mathbf{A}}, \bar{\mathbf{B}}, \bar{\mathbf{C}}, \bar{\mathbf{D}}) = (\mathbf{T}^{-1}\mathbf{A}\mathbf{T},\ \mathbf{T}^{-1}\mathbf{B},\ \mathbf{C}\mathbf{T},\ \mathbf{D})$. Two realizations related this way have the same dimension and the same input-output behavior; they differ only in what the state vector means.
:::

::: warning Which way round is $\mathbf{T}$?
The most common bug in this material is getting the direction wrong. Fix the convention $\mathbf{x} = \mathbf{T}\mathbf{z}$. The columns of $\mathbf{T}$ are the new basis vectors written in old coordinates, so $\mathbf{T}$ converts *new to old*, and $\mathbf{T}^{-1}$ converts *old to new*. Then $\bar{\mathbf{A}} = \mathbf{T}^{-1}\mathbf{A}\mathbf{T}$.

The opposite convention, $\mathbf{z} = \mathbf{T}\mathbf{x}$, gives $\bar{\mathbf{A}} = \mathbf{T}\mathbf{A}\mathbf{T}^{-1}$. Both results are similar to $\mathbf{A}$, so trace, determinant and eigenvalue checks all pass whichever way you multiplied. The only checks that catch the error are $\bar{\mathbf{B}} = \mathbf{T}^{-1}\mathbf{B}$ and $\bar{\mathbf{C}} = \mathbf{C}\mathbf{T}$, or pushing a state you can picture through the conversion by hand.
:::

## What survives: the invariants

A quantity that stays the same under every such $\mathbf{T}$ is an **invariant**. Invariants belong to the vehicle. Here they are, one at a time.

### The transfer matrix

Nothing outside the box ever sees the state. It sees commands go in and measurements come out. So the input-output map cannot depend on how you labeled the inside:

$$\bar{\mathbf{G}}(s) = \bar{\mathbf{C}}(s\mathbf{I} - \bar{\mathbf{A}})^{-1}\bar{\mathbf{B}} + \bar{\mathbf{D}} = \mathbf{G}(s).$$

::: note Why it has to be true
Substitute the new matrices. First, $s\mathbf{I} - \mathbf{T}^{-1}\mathbf{A}\mathbf{T} = \mathbf{T}^{-1}(s\mathbf{I} - \mathbf{A})\mathbf{T}$, because $\mathbf{T}^{-1}(s\mathbf{I})\mathbf{T} = s\mathbf{T}^{-1}\mathbf{T} = s\mathbf{I}$. Inverting a product reverses its order, so $(\mathbf{T}^{-1}(s\mathbf{I}-\mathbf{A})\mathbf{T})^{-1} = \mathbf{T}^{-1}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{T}$. Now put everything together:

$$\bar{\mathbf{G}}(s) = \mathbf{C}\mathbf{T}\,\mathbf{T}^{-1}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{T}\,\mathbf{T}^{-1}\mathbf{B} + \mathbf{D} = \mathbf{C}(s\mathbf{I}-\mathbf{A})^{-1}\mathbf{B} + \mathbf{D} = \mathbf{G}(s).$$

Every $\mathbf{T}$ pairs off with a $\mathbf{T}^{-1}$ and they cancel to $\mathbf{I}$.
:::

Because $\mathbf{G}(s)$ survives, so does its denominator — the characteristic polynomial — and so do the eigenvalues and the verdict on stability.

### The Markov parameters

Look at $\mathbf{G}(s)$ at very large $s$. Write $(s\mathbf{I}-\mathbf{A})^{-1} = s^{-1}(\mathbf{I} - \mathbf{A}/s)^{-1}$ and expand the second factor like the familiar series $1/(1-r) = 1 + r + r^2 + \cdots$, which works for matrices too when $s$ is large:

$$\mathbf{G}(s) = \mathbf{D} + \frac{\mathbf{C}\mathbf{B}}{s} + \frac{\mathbf{C}\mathbf{A}\mathbf{B}}{s^2} + \frac{\mathbf{C}\mathbf{A}^2\mathbf{B}}{s^3} + \cdots$$

The coefficients $\mathbf{M}_k = \mathbf{C}\mathbf{A}^k\mathbf{B}$ are the **[[Markov parameters|era-identification]]**. They have a physical meaning: they are the value and the derivatives of the impulse response at $t = 0^+$ — the instant after a sharp kick.

They survive any change of coordinates, because the $\mathbf{T}$'s cancel again:

$$\bar{\mathbf{C}}\bar{\mathbf{A}}^k\bar{\mathbf{B}} = \mathbf{C}\mathbf{T}(\mathbf{T}^{-1}\mathbf{A}\mathbf{T})^k\mathbf{T}^{-1}\mathbf{B} = \mathbf{C}\mathbf{A}^k\mathbf{B}.$$

(Inside $(\mathbf{T}^{-1}\mathbf{A}\mathbf{T})^k$, each $\mathbf{T}\mathbf{T}^{-1}$ between neighboring copies cancels, leaving $\mathbf{T}^{-1}\mathbf{A}^k\mathbf{T}$.)

That makes them a handy fingerprint. Two realizations of the same plant must have identical Markov parameters. So comparing $\mathbf{C}\mathbf{B}$, $\mathbf{C}\mathbf{A}\mathbf{B}$ and $\mathbf{C}\mathbf{A}^2\mathbf{B}$ is a fast check that a coordinate change was coded correctly.

The first nonzero one also tells you the **[[relative degree|markov-flat-start]]** — how many integrations sit between command and measurement. For the gimbal, $\mathbf{C}\mathbf{B} = 0$, $\mathbf{C}\mathbf{A}\mathbf{B} = 0$ and $\mathbf{C}\mathbf{A}^2\mathbf{B} = 62.5$. Three integrations separate the torque command from the measured angle: command to torque, torque to rate, rate to angle.

### Controllability and observability

Lessons 4 and 5 define two test matrices. The **controllability matrix** is $\mathbf{C}_m = [\mathbf{B},\ \mathbf{A}\mathbf{B},\ \mathbf{A}^2\mathbf{B},\ \dots,\ \mathbf{A}^{n-1}\mathbf{B}]$ — the blocks set side by side. The **observability matrix** $\mathbf{O}_m$ stacks $\mathbf{C}, \mathbf{C}\mathbf{A}, \ldots$ on top of each other. Transform them:

$$\bar{\mathbf{C}}_m = \left[\bar{\mathbf{B}},\ \bar{\mathbf{A}}\bar{\mathbf{B}},\ \dots\right] = \left[\mathbf{T}^{-1}\mathbf{B},\ \mathbf{T}^{-1}\mathbf{A}\mathbf{B},\ \dots\right] = \mathbf{T}^{-1}\mathbf{C}_m,$$

and in the same way $\bar{\mathbf{O}}_m = \mathbf{O}_m\mathbf{T}$. Multiplying by an invertible matrix [[cannot change rank|rank-unchanged]]. So *whether* a system is controllable or observable belongs to the plant, not to the coordinates. Lessons 4 and 5 lean on this all the time: you may test in whichever realization is numerically cleanest.

### What does not survive

- **The individual entries.** Not preserved, and not interesting.
- **The Gramians.** Lesson 4 defines the controllability Gramian $\mathbf{W}_c = \int e^{\mathbf{A}t}\mathbf{B}\mathbf{B}^\mathsf{T}e^{\mathbf{A}^\mathsf{T}t}\,dt$ and its observability twin $\mathbf{W}_o$. Under $\mathbf{x} = \mathbf{T}\mathbf{z}$ they change by **[[congruence|congruence-ellipse]]**, not similarity: $\bar{\mathbf{W}}_c = \mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}}$ and $\bar{\mathbf{W}}_o = \mathbf{T}^{\mathsf{T}}\mathbf{W}_o\mathbf{T}$. ($\mathbf{T}^{-\mathsf{T}}$ is short for the transpose of $\mathbf{T}^{-1}$.) Their eigenvalues, and so their condition numbers, change freely.
- **Condition numbers of anything.** Scaling moves them. A model in radians and a model in arcseconds have the same dynamics and can differ in conditioning by orders of magnitude.
- **Units and physical meaning.** Lesson 1's canonical-form state $x_1$ is in $\mathrm{N\,m\,s^3}$, which is not something any sensor reads.

There is one combination of the Gramians that does survive: their **product**. Watch the middle cancel:

$$\bar{\mathbf{W}}_c\bar{\mathbf{W}}_o = \mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}}\mathbf{T}^{\mathsf{T}}\mathbf{W}_o\mathbf{T} = \mathbf{T}^{-1}(\mathbf{W}_c\mathbf{W}_o)\mathbf{T}.$$

That is a true similarity, so $\operatorname{eig}(\mathbf{W}_c\mathbf{W}_o)$ is invariant. Its square roots are the **[[Hankel singular values|hankel-name]]**, which Lesson 11 uses to decide which states to throw away. This one invariant is the whole reason model reduction by balanced truncation is a well-posed question.

## Two transforms you will actually build

### Physical to controllable canonical

You know $\bar{\mathbf{C}}_m = \mathbf{T}^{-1}\mathbf{C}_m$. You want the transform that carries a controllable model $(\mathbf{A}, \mathbf{B})$ into controllable canonical form $(\mathbf{A}_c, \mathbf{B}_c)$. Write $\mathbf{C}_m^{(c)}$ for the controllability matrix built from the companion pair. The rule says $\mathbf{C}_m^{(c)} = \mathbf{T}^{-1}\mathbf{C}_m$. Solve for $\mathbf{T}$:

$$\mathbf{T} = \mathbf{C}_m\left(\mathbf{C}_m^{(c)}\right)^{-1}.$$

Both controllability matrices are invertible exactly when the system is controllable. That is why the canonical form exists only for a controllable system, and why Ackermann's formula in Lesson 6 needs $\mathbf{C}_m^{-1}$.

::: example The gimbal's coordinate change, two ways
The gimbal has $\mathbf{A} = \begin{pmatrix} 0 & 1 & 0 \\ 0 & -0.5 & 1.25 \\ 0 & 0 & -50\end{pmatrix}$ and $\mathbf{B} = (0,0,50)^\mathsf{T}$.

**Build the two controllability matrices.** Compute $\mathbf{A}\mathbf{B} = (0,\ 62.5,\ -2500)^\mathsf{T}$ and $\mathbf{A}^2\mathbf{B} = (62.5,\ -3156.25,\ 125000)^\mathsf{T}$, and set them side by side after $\mathbf{B}$. Do the same with the companion pair from Lesson 1:

$$\mathbf{C}_m = \begin{pmatrix} 0 & 0 & 62.5 \\ 0 & 62.5 & -3156.25 \\ 50 & -2500 & 125000\end{pmatrix}, \qquad \mathbf{C}_m^{(c)} = \begin{pmatrix} 0 & 0 & 1 \\ 0 & 1 & -50.5 \\ 1 & -50.5 & 2525.25\end{pmatrix}.$$

**Multiply out** $\mathbf{T} = \mathbf{C}_m(\mathbf{C}_m^{(c)})^{-1}$:

$$\mathbf{T} = \begin{pmatrix} 62.5 & 0 & 0 \\ 0 & 62.5 & 0 \\ 0 & 25 & 50\end{pmatrix}, \qquad \mathbf{T}^{-1} = \begin{pmatrix} 0.016 & 0 & 0 \\ 0 & 0.016 & 0 \\ 0 & -0.008 & 0.02\end{pmatrix}.$$

**Read it with physics.** Every entry can be checked by hand, and that is the point. Read $\mathbf{x} = \mathbf{T}\mathbf{z}$ row by row:

- $\theta = 62.5\,z_1$. That is the output equation $\mathbf{C}_c = (62.5\ \ 0\ \ 0)$ read backward.
- $\omega = 62.5\,z_2$. Because $\omega = \dot{\theta} = 62.5\,\dot{z}_1$, and in the companion form $\dot{z}_1 = z_2$.
- $\tau = 25\,z_2 + 50\,z_3$. From the dynamics, $\tau = J\dot{\omega} + b\omega = 0.8(62.5\,z_3) + 0.4(62.5\,z_2) = 50\,z_3 + 25\,z_2$.

The canonical state is the physical state differentiated and rescaled, exactly as the construction of the form promised.

**Verify.** $\mathbf{T}^{-1}\mathbf{A}\mathbf{T}$ reproduces $\mathbf{A}_c$ to about $10^{-17}$. $\mathbf{T}^{-1}\mathbf{B} = (0,0,1)^\mathsf{T}$ and $\mathbf{C}\mathbf{T} = (62.5\ \ 0\ \ 0)$, both exactly.
:::

### Physical to modal

If $\mathbf{A}$ has a full set of eigenvectors, stack them as the columns of $\mathbf{V}$ and take $\mathbf{T} = \mathbf{V}$. Then $\bar{\mathbf{A}} = \mathbf{V}^{-1}\mathbf{A}\mathbf{V} = \boldsymbol{\Lambda}$ ("capital lambda") is diagonal. The state equation splits into $n$ separate one-line equations,

$$\dot{z}_i = \lambda_i z_i + \bar{\mathbf{b}}_i^\mathsf{T}\mathbf{u},$$

where $\bar{\mathbf{b}}_i^\mathsf{T}$ is row $i$ of $\bar{\mathbf{B}}$. These are the modal coordinates of Linear Algebra II, now with inputs attached.

Now the new matrices tell a story:

- row $i$ of $\bar{\mathbf{B}} = \mathbf{V}^{-1}\mathbf{B}$ says how strongly each input drives mode $i$;
- column $i$ of $\bar{\mathbf{C}} = \mathbf{C}\mathbf{V}$ says how strongly mode $i$ shows up in each output.

A mode with a zero row in $\bar{\mathbf{B}}$ cannot be reached. A mode with a zero column in $\bar{\mathbf{C}}$ cannot be seen. For a diagonalizable plant, that is the whole content of Lessons 4 and 5, visible at a glance.

An eigenvector fixes a direction, not a length, so there is [[freedom in its scale|eigenvector-scale]]. Using that freedom is itself a transform, $\mathbf{T} = \mathbf{V}\mathbf{S}$ with $\mathbf{S}$ diagonal. Lesson 1's residue convention picks $\mathbf{S}$ so that $\bar{\mathbf{B}} = (1,\dots,1)^\mathsf{T}$, which moves all the information into $\bar{\mathbf{C}}$.

::: example Modal coordinates of the gimbal, with the scaling fixed
**Find the eigenvectors.** Solving $(\mathbf{A} - \lambda\mathbf{I})\mathbf{v} = \mathbf{0}$ for $\lambda = 0,\ -0.5,\ -50$ gives, with a convenient length for each,

$$\mathbf{v}_1 = \begin{pmatrix}1\\0\\0\end{pmatrix},\quad \mathbf{v}_2 = \begin{pmatrix}1\\-0.5\\0\end{pmatrix},\quad \mathbf{v}_3 = \begin{pmatrix}0.000505\\-0.025253\\1\end{pmatrix}.$$

**Check $\mathbf{v}_3$ by hand.** Set its last entry to $1$ and work up the rows of $(\mathbf{A}+50\mathbf{I})\mathbf{v} = \mathbf{0}$:

- the bottom row is $0 = 0$, satisfied automatically;
- the middle row is $49.5\,v_2 + 1.25\,v_3 = 0$, so $v_2 = -1.25/49.5 = -0.025253$;
- the top row is $50\,v_1 + v_2 = 0$, so $v_1 = 0.025253/50 = 0.000505$.

**Fix the scaling.** With $\mathbf{T} = \mathbf{V}$, computing $\mathbf{V}^{-1}\mathbf{B}$ gives $(2.5,\ -2.525,\ 50)^\mathsf{T}$. Rescale each column by that entry, $\mathbf{S} = \operatorname{diag}(2.5,\ -2.525,\ 50)$:

$$\mathbf{T} = \mathbf{V}\mathbf{S} = \begin{pmatrix} 2.5 & -2.525 & 0.02525 \\ 0 & 1.263 & -1.263 \\ 0 & 0 & 50\end{pmatrix}.$$

**Result.** Now $\mathbf{T}^{-1}\mathbf{A}\mathbf{T} = \operatorname{diag}(0,\ -0.5,\ -50)$, $\mathbf{T}^{-1}\mathbf{B} = (1,1,1)^\mathsf{T}$ and $\mathbf{C}\mathbf{T} = (2.5,\ -2.525,\ 0.02525)$. That is exactly the modal realization Lesson 1 got from partial fractions, reached this time from eigenvectors. Two routes, one answer — as it must be, because for a minimal plant the transform between any two realizations is unique.

**Read it.** The first row of $\mathbf{T}$ says what the encoder sees: $\theta = 2.5\,z_1 - 2.525\,z_2 + 0.02525\,z_3$. One unit of the fast modal state adds a hundred times less angle than one unit of either slow one.
:::

## Scaling is a similarity transform, and it decides your conditioning

The most important similarity transform in practice is the least exciting one: a diagonal $\mathbf{T} = \operatorname{diag}(t_1, \dots, t_n)$. It changes the units of each state — degrees instead of radians, say. From the rule, entry by entry:

$$\bar{a}_{ij} = a_{ij}\,\frac{t_j}{t_i}, \qquad \bar{b}_{ij} = \frac{b_{ij}}{t_i}, \qquad \bar{c}_{ij} = c_{ij}\,t_j.$$

The eigenvalues do not move. Everything about how the numbers behave inside a computer does.

A **condition number** measures how much a matrix can magnify small errors when you solve with it or invert it. A condition number of $10^k$ means you can lose about $k$ decimal digits. Double precision carries about sixteen.

::: example What arcseconds do to a gimbal model
Re-express the gimbal's angle and rate in **[[arcseconds|arcsecond]]**, with $1\,\mathrm{rad} = 206{,}265''$, and leave the torque in $\mathrm{N\,m}$. One new unit is $1/206265$ of an old one, so $\mathbf{T} = \operatorname{diag}(1/206265,\ 1/206265,\ 1)$. Apply the entry rules:

$$\bar{\mathbf{A}} = \begin{pmatrix} 0 & 1 & 0 \\ 0 & -0.5 & 257{,}831 \\ 0 & 0 & -50\end{pmatrix},\quad \bar{\mathbf{B}} = \begin{pmatrix}0\\0\\50\end{pmatrix},\quad \bar{\mathbf{C}} = \begin{pmatrix}4.848\times10^{-6} & 0 & 0\end{pmatrix}.$$

The one entry that changed is $\bar{a}_{23} = 1.25 \times 206265 = 257{,}831$: a torque of $1\,\mathrm{N\,m}$ now changes the rate by a large number of arcseconds per second, every second.

**What stayed the same.** Eigenvalues: $0$, $-0.5$, $-50\,\mathrm{s^{-1}}$. Markov parameters: $0$, $0$, $62.5$, $-3156.25$. Transfer function at $s = 2$: $0.240385$. The plant is the same plant.

**What changed.** The condition number of the controllability matrix went from $1.29\times10^5$ to $1.30\times10^7$ — a hundred times worse. The entries of $\bar{\mathbf{A}}$ now run from $0.5$ to $257{,}831$, more than five orders of magnitude. Any method that inverts $\mathbf{C}_m$ — Ackermann's formula, most textbook canonical-form constructions — throws away two more decimal digits for nothing.

**The Gramians say it louder.** Use the stable part of the model, where the Gramians exist: drop the angle and keep the rate subsystem, $\mathbf{A} = \begin{pmatrix}-0.5 & 1.25\\0 & -50\end{pmatrix}$, $\mathbf{B} = (0, 50)^\mathsf{T}$, $\mathbf{C} = (1\ \ 0)$. With the rate in $\mathrm{rad/s}$,

$$\mathbf{W}_c = \begin{pmatrix} 1.547 & 0.619 \\ 0.619 & 25\end{pmatrix}, \qquad \operatorname{cond}(\mathbf{W}_c) = 16.3.$$

Now express the rate in $\mathrm{mrad/s}$: $\mathbf{T} = \operatorname{diag}(10^{-3}, 1)$. The congruence $\bar{\mathbf{W}}_c = \mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}}$ multiplies the top-left entry by $10^6$, giving $\bar{W}_{c,11} = 1.547\times10^6$ and $\operatorname{cond}(\bar{\mathbf{W}}_c) = 6.25\times10^4$. Same gimbal, a condition number four thousand times bigger. A condition number quoted without the units of the state is not a statement about the vehicle.

**What survived.** $\operatorname{eig}(\mathbf{W}_c\mathbf{W}_o) = (1.593,\ 1.47\times10^{-4})$ in both unit systems, so the Hankel singular values $\sigma = (1.262,\ 0.01214)$ are identical. They say the second state contributes about a hundredth as much to the input-output behavior as the first. That statement is about the gimbal.
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

def ctrb(A, B):
    return np.hstack([np.linalg.matrix_power(A, j) @ B for j in range(A.shape[0])])

k = 206265.0                                   # arcseconds per radian
Ab, Bb, Cb = transform(A, B, C, np.diag([1 / k, 1 / k, 1.0]))
print("eigs   ", np.sort(np.linalg.eigvals(A).real), np.sort(np.linalg.eigvals(Ab).real))
print("markov ", markov(A, B, C, 4), markov(Ab, Bb, Cb, 4))
print("cond   ", f"{np.linalg.cond(ctrb(A, B)):.3e}", f"{np.linalg.cond(ctrb(Ab, Bb)):.3e}")
# eigs    [-50.   -0.5   0. ] [-50.   -0.5   0. ]
# markov  [0.0, 0.0, 62.5, -3156.25] [0.0, 0.0, 62.5, -3156.25]
# cond    1.294e+05 1.303e+07
```

::: note Scale the model before you design with it
A common first step is to choose $\mathbf{T}$ so that one unit of each state means one unit of "how much of this do I care about": one arcsecond of pointing error, one millidegree per second of rate, one percent of full wheel torque. The dynamics are untouched, the numerics improve, and the weighting matrices of Lesson 9 and the LQR module become unitless and comparable. [[Scaling|fixed-point-scaling]] is free and almost always worth doing.
:::

## Check yourself

::: check
A colleague changes a spacecraft model's state from $(\boldsymbol{\theta}, \boldsymbol{\omega})$ in $\mathrm{rad},\ \mathrm{rad/s}$ to $(\boldsymbol{\theta}, \mathbf{h})$, where $\mathbf{h} = \mathbf{J}\boldsymbol{\omega}$ is the body angular momentum. Write $\mathbf{T}$ and give $\bar{\mathbf{A}}$ and $\bar{\mathbf{B}}$ for the six-state model of Lesson 1.
:::

::: answer
The new state is $\mathbf{z} = (\boldsymbol{\theta}, \mathbf{h})$. The rule $\mathbf{x} = \mathbf{T}\mathbf{z}$ must give back the old state, so it needs $\boldsymbol{\omega} = \mathbf{J}^{-1}\mathbf{h}$. Therefore $\mathbf{T} = \operatorname{diag}(\mathbf{I}_3,\ \mathbf{J}^{-1})$ (a block-diagonal matrix), and $\mathbf{T}^{-1} = \operatorname{diag}(\mathbf{I}_3,\ \mathbf{J})$. Then

$$\bar{\mathbf{A}} = \mathbf{T}^{-1}\mathbf{A}\mathbf{T} = \begin{pmatrix} \mathbf{0} & \mathbf{J}^{-1} \\ \mathbf{0} & \mathbf{0}\end{pmatrix}, \qquad \bar{\mathbf{B}} = \mathbf{T}^{-1}\mathbf{B} = \begin{pmatrix}\mathbf{0}\\ \mathbf{A}_w\end{pmatrix}.$$

The inertia has moved out of $\mathbf{B}$ and into $\mathbf{A}$. This is a useful choice: $\bar{\mathbf{B}}$ is now the wheel geometry alone, so if the inertia changes during the mission, only $\bar{\mathbf{A}}$ needs updating. All six eigenvalues are still zero, as an invariant should be.
:::

::: check
Two engineers report the same plant. One gives $\operatorname{cond}(\mathbf{W}_o) = 4\times10^3$; the other gives $\operatorname{cond}(\mathbf{W}_o) = 2\times10^8$. Can they both be right, and what should you ask for?
:::

::: answer
Yes, both can be right. The observability Gramian changes by congruence, $\bar{\mathbf{W}}_o = \mathbf{T}^\mathsf{T}\mathbf{W}_o\mathbf{T}$. A diagonal change of state units multiplies row $i$ and column $i$ by $t_i$, which moves the spread of eigenvalues wherever you like.

Ask for the definition of the state vector and its units, and for the numbers after a sensible scaling — one unit of each state meaning one unit that matters to the engineer. If you want a statement that does not depend on coordinates at all, ask for the Hankel singular values, because $\operatorname{eig}(\mathbf{W}_c\mathbf{W}_o)$ is invariant.
:::

::: check
Show that if $\bar{\mathbf{A}} = \mathbf{T}^{-1}\mathbf{A}\mathbf{T}$, then $e^{\bar{\mathbf{A}}t} = \mathbf{T}^{-1}e^{\mathbf{A}t}\mathbf{T}$. What does that mean for the state transition matrix in two different coordinate systems?
:::

::: answer
Powers first: $\bar{\mathbf{A}}^k = (\mathbf{T}^{-1}\mathbf{A}\mathbf{T})^k = \mathbf{T}^{-1}\mathbf{A}^k\mathbf{T}$, because each $\mathbf{T}\mathbf{T}^{-1}$ between neighboring copies cancels. The exponential is the series $\sum_k \bar{\mathbf{A}}^kt^k/k!$. Replace each term and pull $\mathbf{T}^{-1}$ out on the left and $\mathbf{T}$ on the right: the sum becomes $\mathbf{T}^{-1}e^{\mathbf{A}t}\mathbf{T}$.

So the state transition matrix is itself similarity-transformed. Propagating in new coordinates is the same as converting to old coordinates, propagating, and converting back: $\mathbf{z}(t) = \mathbf{T}^{-1}e^{\mathbf{A}t}\mathbf{T}\mathbf{z}(0)$. Its eigenvalues, $e^{\lambda_it}$, are the same in both, so a stability verdict from it does not depend on coordinates either.
:::

::: check
Someone claims that $\mathbf{A}_1 = \begin{pmatrix}-2 & 0\\0 & -3\end{pmatrix}$, $\mathbf{B}_1 = \begin{pmatrix}1\\1\end{pmatrix}$, $\mathbf{C}_1 = (1\ \ 1)$ and $\mathbf{A}_2 = \begin{pmatrix}-2 & 0\\0 & -3\end{pmatrix}$, $\mathbf{B}_2 = \begin{pmatrix}2\\1\end{pmatrix}$, $\mathbf{C}_2 = (0.5\ \ 1)$ are the same plant. Check it with the Markov parameters.
:::

::: answer
Compute the first three for each.

- $\mathbf{C}_1\mathbf{B}_1 = 1 + 1 = 2$, and $\mathbf{C}_2\mathbf{B}_2 = 0.5(2) + 1 = 2$.
- $\mathbf{C}_1\mathbf{A}_1\mathbf{B}_1 = -2 - 3 = -5$, and $\mathbf{C}_2\mathbf{A}_2\mathbf{B}_2 = 0.5(-2)(2) + 1(-3)(1) = -5$.
- $\mathbf{C}_1\mathbf{A}_1^2\mathbf{B}_1 = 4 + 9 = 13$, and $\mathbf{C}_2\mathbf{A}_2^2\mathbf{B}_2 = 0.5(4)(2) + 9 = 13$.

They agree. And indeed $\mathbf{T} = \operatorname{diag}(0.5,\ 1)$ maps the first to the second: $\mathbf{T}^{-1}\mathbf{B}_1 = (2,1)^\mathsf{T}$ and $\mathbf{C}_1\mathbf{T} = (0.5\ \ 1)$. $\bar{\mathbf{A}}$ is unchanged because diagonal matrices commute. Both are the plant $G(s) = 1/(s+2) + 1/(s+3)$.
:::

::: check
Why does the controllable canonical form fail to exist for an uncontrollable system? What goes wrong numerically for one that is nearly uncontrollable?
:::

::: answer
The transform is $\mathbf{T} = \mathbf{C}_m(\mathbf{C}_m^{(c)})^{-1}$, and $\mathbf{T}$ must be invertible, which needs $\mathbf{C}_m$ invertible — the system must be controllable. There is a second way to see it. Similarity keeps the rank of $\mathbf{C}_m$, and the companion pair is controllable by construction. So no similarity can carry an uncontrollable system into companion form.

For a nearly uncontrollable system, $\mathbf{C}_m$ is invertible but badly conditioned. Then $\mathbf{T}$ is computed with large relative error, and any gain designed through that route inherits the error. This is the practical reason Lesson 6 prefers an eigenstructure routine over Ackermann's formula for anything but small hand problems.
:::

## Summary

| Item | Statement |
| --- | --- |
| Transformation | $\mathbf{x} = \mathbf{T}\mathbf{z}$ gives $(\mathbf{T}^{-1}\mathbf{A}\mathbf{T},\ \mathbf{T}^{-1}\mathbf{B},\ \mathbf{C}\mathbf{T},\ \mathbf{D})$ |
| Invariant | $\mathbf{G}(s)$; eigenvalues and characteristic polynomial; Markov parameters $\mathbf{C}\mathbf{A}^k\mathbf{B}$; $\operatorname{rank}\mathbf{C}_m$ and $\operatorname{rank}\mathbf{O}_m$; stability; $\operatorname{eig}(\mathbf{W}_c\mathbf{W}_o)$ |
| Not invariant | matrix entries; $\mathbf{W}_c$ and $\mathbf{W}_o$ separately; every condition number; state units |
| Structure matrices | $\bar{\mathbf{C}}_m = \mathbf{T}^{-1}\mathbf{C}_m$, $\bar{\mathbf{O}}_m = \mathbf{O}_m\mathbf{T}$ |
| Gramians | congruence: $\bar{\mathbf{W}}_c = \mathbf{T}^{-1}\mathbf{W}_c\mathbf{T}^{-\mathsf{T}}$, $\bar{\mathbf{W}}_o = \mathbf{T}^{\mathsf{T}}\mathbf{W}_o\mathbf{T}$ |
| To canonical form | $\mathbf{T} = \mathbf{C}_m(\mathbf{C}_m^{(c)})^{-1}$; exists if and only if controllable |
| To modal form | $\mathbf{T} = \mathbf{V}$ (eigenvectors), then a diagonal rescale; row $i$ of $\bar{\mathbf{B}}$ = drive on mode $i$, column $i$ of $\bar{\mathbf{C}}$ = visibility of mode $i$ |
| Scaling | $\mathbf{T} = \operatorname{diag}(t_i)$: $\bar{a}_{ij} = a_{ij}t_j/t_i$; same dynamics, different conditioning |
| Gimbal numbers | $\mathbf{T}_{\text{canon}} = \begin{pmatrix}62.5&0&0\\0&62.5&0\\0&25&50\end{pmatrix}$; Markov $0,\ 0,\ 62.5,\ -3156.25$ |

The next lesson stops rewriting the model and starts solving it. The matrix exponential turns $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}\mathbf{u}$ into an explicit trajectory, and the zero-order-hold version of that solution is the model your flight computer actually runs.

::: context same-arrow-two-grids One arrow, two sets of grid lines
A change of coordinates does not move anything. It redraws the grid. Here the same arrow is described twice: on square grid lines it is $(2, 1)$; on a slanted grid whose second direction is $(1, 1)$, it is $(1, 1)$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#8fb8f0" stroke-width="1">
    <line x1="40" y1="160" x2="160" y2="160"/><line x1="40" y1="120" x2="160" y2="120"/><line x1="40" y1="80" x2="160" y2="80"/>
    <line x1="40" y1="160" x2="40" y2="80"/><line x1="80" y1="160" x2="80" y2="80"/><line x1="120" y1="160" x2="120" y2="80"/><line x1="160" y1="160" x2="160" y2="80"/>
  </g>
  <g stroke="#8fb8f0" stroke-width="1">
    <line x1="200" y1="160" x2="320" y2="160"/><line x1="240" y1="120" x2="360" y2="120"/><line x1="280" y1="80" x2="356" y2="80"/>
    <line x1="200" y1="160" x2="280" y2="80"/><line x1="240" y1="160" x2="320" y2="80"/><line x1="280" y1="160" x2="356" y2="84"/>
  </g>
  <line x1="40" y1="160" x2="114" y2="123" stroke="#b4232c" stroke-width="3"/>
  <polygon points="120,120 110.7,119.8 114.7,127.8" fill="#b4232c"/>
  <line x1="200" y1="160" x2="274" y2="123" stroke="#b4232c" stroke-width="3"/>
  <polygon points="280,120 270.7,119.8 274.7,127.8" fill="#b4232c"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="100" y="185">square grid: x = (2, 1)</text>
    <text x="270" y="185">slanted grid: z = (1, 1)</text>
    <text x="100" y="60">old coordinates</text>
    <text x="280" y="60">new coordinates</text>
  </g>
</svg>
```

Here $\mathbf{T} = \begin{pmatrix}1 & 1\\ 0 & 1\end{pmatrix}$, its columns are the new grid directions, and $\mathbf{T}\mathbf{z} = (1+1,\ 1) = (2, 1) = \mathbf{x}$.
:::

::: context era-identification Building a model from the fingerprint
Because the Markov parameters are the same in every realization, you can run the idea backward: measure them, then build a model that has them. In discrete time they are literally the samples of the impulse response, which you can record by kicking a structure and logging its sensors. The Eigensystem Realization Algorithm, published by Jer-Nan Juang and Richard Pappa at NASA Langley in 1985, does exactly this. It stacks the measured Markov parameters into a large matrix and extracts $(\mathbf{A}, \mathbf{B}, \mathbf{C})$ from it. It is still a standard way to identify the vibration modes of spacecraft structures from test data.
:::

::: context markov-flat-start Three integrations make a flat start
Kick the gimbal with a sharp torque impulse and watch the angle. Its impulse response starts at zero with zero slope, because $\mathbf{C}\mathbf{B} = 0$ and $\mathbf{C}\mathbf{A}\mathbf{B} = 0$. Its curvature at the start is $\mathbf{C}\mathbf{A}^2\mathbf{B} = 62.5$, so for the first few milliseconds it hugs the parabola $62.5\,t^2/2$ (dashed), then peels away as the current loop settles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="330" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40.0,150.0 54.0,149.7 68.0,148.9 82.0,147.5 96.0,145.6 110.0,143.1 124.0,140.1 138.0,136.5 152.0,132.4 166.0,127.7 180.0,122.5 194.0,116.7 208.0,110.4 222.0,103.5 236.0,96.1 250.0,88.1 264.0,79.6 278.0,70.5 292.0,60.9 306.0,50.7 320.0,40.0" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 4"/>
  <polyline points="40.0,150.0 54.0,149.7 68.0,148.9 82.0,147.6 96.0,145.9 110.0,143.7 124.0,141.0 138.0,138.0 152.0,134.6 166.0,130.8 180.0,126.6 194.0,122.1 208.0,117.3 222.0,112.2 236.0,106.9 250.0,101.2 264.0,95.3 278.0,89.2 292.0,82.8 306.0,76.2 320.0,69.4" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g stroke="#1f2a44" stroke-width="1"><line x1="180" y1="150" x2="180" y2="155"/><line x1="320" y1="150" x2="320" y2="155"/><line x1="35" y1="79.6" x2="40" y2="79.6"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="167">0</text><text x="180" y="167">0.01</text><text x="320" y="167">0.02</text>
    <text x="185" y="181">time after the kick (s)</text>
  </g>
  <text x="33" y="83.6" font-size="11" text-anchor="end" fill="#1f2a44">0.008</text>
  <text x="33" y="154" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="250" y="116" font-size="12" fill="#1d6fd1">gimbal</text>
  <text x="196" y="70" font-size="12" fill="#6c7a93">62.5 t²/2</text>
</svg>
```
:::

::: context rank-unchanged Why an invertible matrix cannot change rank
Rank counts how many truly independent directions the columns of a matrix reach. Multiplying on the left by an invertible $\mathbf{T}^{-1}$ is like viewing those columns through a lens that can be undone. It may stretch or tilt them, but it cannot squash two independent directions into one. If it did, there would be no way to undo it, and $\mathbf{T}^{-1}$ would not be invertible. The same holds for multiplying on the right. So $\mathbf{T}^{-1}\mathbf{C}_m$ has exactly as many independent directions as $\mathbf{C}_m$.
:::

::: context congruence-ellipse Same Gramian, different ruler
Draw a Gramian as an ellipse: its long axis is an easy direction, its short axis a hard one, and the condition number is the square of the length ratio. Changing units stretches the picture along one axis. Below, the gimbal's rate-subsystem Gramian (left, condition number $16.3$) is redrawn with the rate measured in a unit four times smaller (right). The ellipse becomes nearly round, condition number $1.22$. The gimbal did not change; the ruler did.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3">
    <line x1="20" y1="100" x2="160" y2="100"/><line x1="90" y1="22" x2="90" y2="178"/>
    <line x1="185" y1="100" x2="345" y2="100"/><line x1="265" y1="22" x2="265" y2="178"/>
  </g>
  <polygon points="72.7,99.5 73.1,90.4 73.8,81.4 74.7,72.8 75.9,64.6 77.4,57.0 79.1,50.2 80.9,44.2 82.9,39.2 85.1,35.2 87.3,32.3 89.6,30.5 91.8,30.0 94.1,30.7 96.3,32.5 98.3,35.5 100.3,39.6 102.0,44.7 103.5,50.8 104.9,57.7 105.9,65.4 106.7,73.6 107.2,82.3 107.4,91.3 107.3,100.5 106.9,109.6 106.2,118.6 105.3,127.2 104.1,135.4 102.6,143.0 100.9,149.8 99.1,155.8 97.1,160.8 94.9,164.8 92.7,167.7 90.4,169.5 88.2,170.0 85.9,169.3 83.7,167.5 81.7,164.5 79.7,160.4 78.0,155.3 76.5,149.2 75.1,142.3 74.1,134.6 73.3,126.4 72.8,117.7 72.6,108.7" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="217.0,54.3 224.0,47.8 231.7,42.2 240.0,37.5 248.7,33.9 257.6,31.5 266.7,30.2 275.8,30.1 284.7,31.2 293.3,33.5 301.3,36.9 308.8,41.4 315.5,46.9 321.3,53.4 326.2,60.6 330.0,68.5 332.7,76.9 334.3,85.7 334.6,94.8 333.8,103.9 331.8,113.0 328.7,121.9 324.4,130.4 319.2,138.4 313.0,145.7 306.0,152.2 298.3,157.8 290.0,162.5 281.3,166.1 272.4,168.5 263.3,169.8 254.2,169.9 245.3,168.8 236.7,166.5 228.7,163.1 221.2,158.6 214.5,153.1 208.7,146.6 203.8,139.4 200.0,131.5 197.3,123.1 195.7,114.3 195.4,105.2 196.2,96.1 198.2,87.0 201.3,78.1 205.6,69.6 210.8,61.6" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="150" y="94">rate</text><text x="90" y="17">torque</text>
    <text x="335" y="94">rate</text><text x="265" y="17">torque</text>
    <text x="90" y="196">rate in rad/s: cond 16.3</text>
    <text x="265" y="196">rate unit 4× smaller: cond 1.22</text>
  </g>
</svg>
```
:::

::: context hankel-name Who Hankel was
Hermann Hankel was a German mathematician of the 1800s. A **Hankel matrix** is one whose entries are constant along each anti-diagonal, running from bottom-left to top-right. Stack the Markov parameters of a system that way — $\mathbf{M}_0, \mathbf{M}_1, \mathbf{M}_2$ in the first row, $\mathbf{M}_1, \mathbf{M}_2, \mathbf{M}_3$ in the second, and so on — and you get a Hankel matrix that captures everything the input can do to the output. The Hankel singular values measure how much each state contributes to that map. Because they come from input-output behavior alone, no choice of state can change them.
:::

::: context eigenvector-scale Why an eigenvector has no fixed length
An eigenvector marks a direction that $\mathbf{A}$ only stretches, never turns: $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$. Double $\mathbf{v}$ and both sides double, so $2\mathbf{v}$ is an eigenvector too. Any nonzero multiple works. Software usually returns eigenvectors scaled to length one, but that is a habit, not a law. You are free to pick whatever length makes the model easiest to read — for example, the one that makes every entry of $\bar{\mathbf{B}}$ equal to one.
:::

::: context arcsecond How small an arcsecond is
A degree is split into 60 arcminutes and each arcminute into 60 arcseconds, so an arcsecond is $1/3600$ of a degree. There are $206{,}265$ of them in a radian. One arcsecond is roughly the width of a coin seen from about four kilometers away. Precise spacecraft care about far smaller angles: the Hubble Space Telescope holds its pointing steady to about $0.007$ arcseconds. That is why pointing engineers like to measure in arcseconds — the numbers stay human-sized — and why they must watch what it does to the conditioning of their models.
:::

::: context fixed-point-scaling Scaling by hand on the way to the Moon
The Apollo Guidance Computer had no floating-point hardware. Every number was a fixed-point fraction in a short word of memory, and the programmers had to choose, for each variable, a scale factor that kept it from overflowing while keeping enough precision. Their equations were full of these hand-picked factors. Modern flight computers use floating point, but the same instinct survives: pick units so the numbers you care about are neither huge nor tiny, and the arithmetic stays honest.
:::
