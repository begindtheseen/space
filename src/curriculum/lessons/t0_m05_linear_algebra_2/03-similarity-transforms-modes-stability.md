---
id: l03-similarity-transforms-modes-stability
title: Similarity transforms, modal coordinates and stability
minutes: 24
covers:
  - similarity transforms
---

Measure a table in meters and a friend measures it in feet. You write down different numbers, but it is the same table. Its length is a fact about the table; the number you write is a fact about your ruler.

Dynamics matrices work the same way. Two engineers can describe one vehicle with two different matrices and both be right. One keeps attitude error in the body frame, the other in an inertial frame. One measures angular rate in radians per second, the other in **[[milliradians|milliradian]]** per second. One uses physical states, the other the eigenvector coordinates of the last two lessons. The relation between their matrices is a **similarity transform**, $\mathbf{B} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}$. The things that survive it — eigenvalues above all — belong to the vehicle. Everything else belongs to the bookkeeping.

That is what makes eigenvalues worth computing. A closed control loop $\mathbf{A} - \mathbf{B}\mathbf{K}$ has different entries in every frame and every set of units, but the same eigenvalues in all of them. Those eigenvalues decide whether the loop is stable, how fast it settles and whether it rings. Diagonalisation from Lesson 1 is itself a similarity transform — the one that picks the eigenvectors as the basis — and in that basis the dynamics fall apart into independent pieces called modes.

This lesson defines similarity, proves what it keeps, shows its two everyday forms on a vehicle (a change of frame and a change of units), uses it to split $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ into modes, reads what each eigenvalue means physically, and states the stability test every later controls and estimation module uses without comment.

## What a similarity transform is

Linear Algebra I showed how coordinates change. If the columns of an invertible matrix $\mathbf{P}$ are a new set of basis vectors, then a vector with ordinary coordinates $\mathbf{x}$ has new coordinates $\mathbf{z} = \mathbf{P}^{-1}\mathbf{x}$, and $\mathbf{x} = \mathbf{P}\mathbf{z}$ converts back.

Now take a map with matrix $\mathbf{A}$ in ordinary coordinates. What matrix does the same job on the new coordinates? Do it in three moves: convert $\mathbf{z}$ to ordinary coordinates, apply $\mathbf{A}$, convert the answer back:

$$\mathbf{z} \mapsto \mathbf{P}^{-1}\,\mathbf{A}\,(\mathbf{P}\mathbf{z}) = \left(\mathbf{P}^{-1}\mathbf{A}\mathbf{P}\right)\mathbf{z}.$$

So the same map has matrix $\mathbf{B} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}$ in the new basis. Two matrices related this way, for some invertible $\mathbf{P}$, are called **[[similar|similar-word]]**. Read the product right to left, in the order a vector meets the factors: $\mathbf{P}$ converts new coordinates to old, $\mathbf{A}$ acts, $\mathbf{P}^{-1}$ converts the result back to new.

The form you will use most is the moving one. Suppose $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ and you switch to new state coordinates $\mathbf{z} = \mathbf{P}^{-1}\mathbf{x}$. Since $\mathbf{P}$ is constant,

$$\dot{\mathbf{z}} = \mathbf{P}^{-1}\dot{\mathbf{x}} = \mathbf{P}^{-1}\mathbf{A}\mathbf{x} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}\mathbf{z}.$$

The new state obeys $\dot{\mathbf{z}} = \mathbf{B}\mathbf{z}$ with the similar matrix $\mathbf{B}$. A change of state coordinates *is* a similarity transform of the dynamics matrix. Nothing physical changed — only the numbers that describe it.

::: key Similarity transform
$\mathbf{B} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}$ with $\mathbf{P}$ invertible. $\mathbf{A}$ and $\mathbf{B}$ are the same linear map written in two bases, related by $\mathbf{x} = \mathbf{P}\mathbf{z}$. If $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ then $\mathbf{z} = \mathbf{P}^{-1}\mathbf{x}$ obeys $\dot{\mathbf{z}} = \mathbf{B}\mathbf{z}$. Diagonalisation, $\boldsymbol{\Lambda} = \mathbf{V}^{-1}\mathbf{A}\mathbf{V}$, is the similarity transform whose new basis is the eigenvectors.
:::

## What similarity keeps

If $\mathbf{A}$ and $\mathbf{B}$ describe one map, everything that belongs to the map must come out the same from either matrix. Each proof is one line, and each one is a tool.

**Eigenvalues.** Suppose $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$. Let $\mathbf{w} = \mathbf{P}^{-1}\mathbf{v}$ — the same eigenvector in new coordinates, and not zero because $\mathbf{P}^{-1}$ is invertible. Then

$$\mathbf{B}\mathbf{w} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}\mathbf{P}^{-1}\mathbf{v} = \mathbf{P}^{-1}\mathbf{A}\mathbf{v} = \lambda\,\mathbf{P}^{-1}\mathbf{v} = \lambda\mathbf{w}.$$

The middle $\mathbf{P}\mathbf{P}^{-1}$ cancelled. So $\lambda$ is an eigenvalue of $\mathbf{B}$ too, with eigenvector $\mathbf{P}^{-1}\mathbf{v}$. Similar matrices have the same eigenvalues, repeated the same number of times.

**Characteristic polynomial.** The whole polynomial matches, not only its roots. Write $\mathbf{I} = \mathbf{P}^{-1}\mathbf{I}\mathbf{P}$ and use the rule that the determinant of a product is the product of determinants:

$$\det(\mathbf{B} - \lambda\mathbf{I}) = \det\!\left(\mathbf{P}^{-1}(\mathbf{A} - \lambda\mathbf{I})\mathbf{P}\right) = \det(\mathbf{P}^{-1})\det(\mathbf{A} - \lambda\mathbf{I})\det(\mathbf{P}) = \det(\mathbf{A} - \lambda\mathbf{I}),$$

because $\det(\mathbf{P}^{-1})\det(\mathbf{P}) = \det(\mathbf{I}) = 1$.

**Trace and determinant.** Both are coefficients of the characteristic polynomial, so both are kept. Directly: $\det\mathbf{B} = \det(\mathbf{P}^{-1})\det\mathbf{A}\det\mathbf{P} = \det\mathbf{A}$. For the trace, use the **[[cyclic rule|cyclic-trace]]** $\operatorname{tr}(\mathbf{X}\mathbf{Y}) = \operatorname{tr}(\mathbf{Y}\mathbf{X})$ with $\mathbf{X} = \mathbf{P}^{-1}$ and $\mathbf{Y} = \mathbf{A}\mathbf{P}$: $\operatorname{tr}(\mathbf{P}^{-1}\mathbf{A}\mathbf{P}) = \operatorname{tr}(\mathbf{A}\mathbf{P}\mathbf{P}^{-1}) = \operatorname{tr}\mathbf{A}$.

**Rank, and powers.** Invertible matrices cannot change the dimension of a column space, so $\operatorname{rank}\mathbf{B} = \operatorname{rank}\mathbf{A}$. And $\mathbf{B}^k = \mathbf{P}^{-1}\mathbf{A}^k\mathbf{P}$, because every inner $\mathbf{P}\mathbf{P}^{-1}$ cancels. That carries over to anything built from powers: $e^{\mathbf{B}t} = \mathbf{P}^{-1}e^{\mathbf{A}t}\mathbf{P}$, as Lesson 2 already used.

### What similarity does not keep

The entries change, of course. **Symmetry** is not kept in general: $\mathbf{P}^{-1}\mathbf{A}\mathbf{P}$ can be unsymmetric even when $\mathbf{A}$ is symmetric. Lengths of vectors and angles between eigenvectors change too, because a general $\mathbf{P}$ stretches and shears.

The exception is an orthogonal $\mathbf{P}$ — one with $\mathbf{P}^{-1} = \mathbf{P}^\mathsf{T}$, like a rotation. An **orthogonal similarity** $\mathbf{Q}^\mathsf{T}\mathbf{A}\mathbf{Q}$ keeps lengths and angles, and it keeps symmetry and skew-symmetry as well, since $(\mathbf{Q}^\mathsf{T}\mathbf{A}\mathbf{Q})^\mathsf{T} = \mathbf{Q}^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{Q}$. A change of reference frame is an orthogonal similarity. That is why a symmetric **[[inertia tensor|inertia-tensor]]** stays symmetric in every frame.

::: example Two matrices, one machine
Take the damped oscillator from Lesson 2, $\mathbf{A} = \begin{pmatrix} 0 & 1 \\ -2 & -3 \end{pmatrix}$, and change coordinates with $\mathbf{P} = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$, whose inverse is $\mathbf{P}^{-1} = \begin{pmatrix} 1 & -1 \\ 0 & 1 \end{pmatrix}$. The new state is $\mathbf{z} = \mathbf{P}^{-1}\mathbf{x} = (x_1 - x_2,\ x_2)^\mathsf{T}$: position minus velocity, and velocity.

**Transform.** Multiply in two stages:

$$\mathbf{A}\mathbf{P} = \begin{pmatrix} 0 & 1 \\ -2 & -5 \end{pmatrix}, \qquad \mathbf{B} = \mathbf{P}^{-1}(\mathbf{A}\mathbf{P}) = \begin{pmatrix} 1 & -1 \\ 0 & 1 \end{pmatrix}\begin{pmatrix} 0 & 1 \\ -2 & -5 \end{pmatrix} = \begin{pmatrix} 2 & 6 \\ -2 & -5 \end{pmatrix}.$$

**Invariants.** The entries look nothing alike. But $\operatorname{tr}\mathbf{B} = 2 - 5 = -3 = \operatorname{tr}\mathbf{A}$ and $\det\mathbf{B} = -10 + 12 = 2 = \det\mathbf{A}$. So both have characteristic polynomial $\lambda^2 + 3\lambda + 2$ and eigenvalues $-1$ and $-2$.

**Eigenvectors.** Those of $\mathbf{A}$ were $\mathbf{v}_1 = (1, -1)^\mathsf{T}$ and $\mathbf{v}_2 = (1, -2)^\mathsf{T}$. Those of $\mathbf{B}$ should be $\mathbf{P}^{-1}\mathbf{v}_i$: $(1 + 1,\ -1)^\mathsf{T} = (2, -1)^\mathsf{T}$ and $(1 + 2,\ -2)^\mathsf{T} = (3, -2)^\mathsf{T}$. Check both:

- $\mathbf{B}(2, -1)^\mathsf{T} = (4 - 6,\ -4 + 5)^\mathsf{T} = (-2, 1)^\mathsf{T} = -1\times(2, -1)^\mathsf{T}$;
- $\mathbf{B}(3, -2)^\mathsf{T} = (6 - 12,\ -6 + 10)^\mathsf{T} = (-6, 4)^\mathsf{T} = -2\times(3, -2)^\mathsf{T}$.

Same eigenvalues, same eigenvectors seen through the new coordinates.

**A caution.** The product the other way round, $\mathbf{P}\mathbf{A}\mathbf{P}^{-1} = \begin{pmatrix} -2 & 0 \\ -2 & -1 \end{pmatrix}$, is *also* similar to $\mathbf{A}$ — it is the transform whose basis matrix is $\mathbf{P}^{-1}$. It too has trace $-3$, determinant $2$ and eigenvalues $-1, -2$. So trace and determinant checks pass whichever way round you multiply. Only the eigenvector test, or pushing a known vector through the conversion, tells you which basis you are really in. When you change state coordinates in a filter, write down which way $\mathbf{P}$ converts, and test it on a vector you can picture.
:::

## Similarity on a vehicle: frames and units

Two similarity transforms turn up in every GNC codebase, usually without being named.

**A change of frame.** A vector written in frame $B$ becomes $\mathbf{r}^A = \mathbf{R}_A^B\mathbf{r}^B$ in frame $A$, where $\mathbf{R}_A^B$ is a rotation matrix (orthogonal). Suppose a matrix $\mathbf{M}^B$ acts on $B$-frame vectors, $\mathbf{y}^B = \mathbf{M}^B\mathbf{x}^B$. The same physical operation on $A$-frame vectors is

$$\mathbf{y}^A = \mathbf{R}_A^B\mathbf{y}^B = \mathbf{R}_A^B\mathbf{M}^B\mathbf{x}^B = \mathbf{R}_A^B\mathbf{M}^B(\mathbf{R}_A^B)^\mathsf{T}\mathbf{x}^A, \qquad \mathbf{M}^A = \mathbf{R}_A^B\,\mathbf{M}^B\,(\mathbf{R}_A^B)^\mathsf{T}.$$

The third step used $\mathbf{x}^B = (\mathbf{R}_A^B)^\mathsf{T}\mathbf{x}^A$, going back from $A$ to $B$. This is an orthogonal similarity with $\mathbf{P} = (\mathbf{R}_A^B)^\mathsf{T} = \mathbf{R}_B^A$. Every $3\times 3$ operator you carry between frames — an inertia tensor, a covariance, a cross-product matrix — changes this way, and every one keeps its eigenvalues. The Linear Algebra I identity $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^\mathsf{T} = [(\mathbf{R}\mathbf{a})\times]$ is exactly this statement for the cross-product matrix: rotating the operator is the same as rotating the vector it is built from.

**A change of units.** Let $\mathbf{P} = \operatorname{diag}(p_1, \dots, p_n)$, a diagonal matrix. Then each entry becomes $(\mathbf{P}^{-1}\mathbf{A}\mathbf{P})_{ij} = a_{ij}\,p_j/p_i$. Rescaling the states rescales each entry by its column's unit over its row's unit, and leaves the eigenvalues alone. This is a handy check when a matrix arrives with mixed units. The eigenvalues of a dynamics matrix always carry units of $\mathrm{s^{-1}}$, whatever the states are measured in: $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ forces each $a_{ij}$ to have units of $[x_i]/([x_j]\,\mathrm{s})$, and a unit change can only ever be a similarity by a diagonal $\mathbf{P}$.

::: example Angular velocity operator in two frames
A body spins at $\boldsymbol{\omega}^B = (0.1, 0.2, 0.3)^\mathsf{T}\,\mathrm{rad/s}$ in body axes. The body frame is yawed $30^\circ$ from an inertial frame, so $\mathbf{R}_I^B = \mathbf{R}_3(30^\circ)$, the rotation by $30^\circ$ about the third axis.

**In body axes.** The cross-product matrix is

$$[\boldsymbol{\omega}^B\times] = \begin{pmatrix} 0 & -0.3 & 0.2 \\ 0.3 & 0 & -0.1 \\ -0.2 & 0.1 & 0 \end{pmatrix}\,\mathrm{rad/s}.$$

**In inertial axes.** The orthogonal similarity $\mathbf{R}_I^B[\boldsymbol{\omega}^B\times](\mathbf{R}_I^B)^\mathsf{T}$ gives

$$[\boldsymbol{\omega}^I\times] = \begin{pmatrix} 0 & -0.3 & 0.2232 \\ 0.3 & 0 & 0.0134 \\ -0.2232 & -0.0134 & 0 \end{pmatrix}\,\mathrm{rad/s}.$$

**Check against the vector.** Read the components off the skew-symmetric layout (entry $(3,2)$ is $\omega_1$, entry $(1,3)$ is $\omega_2$, entry $(2,1)$ is $\omega_3$): $\boldsymbol{\omega}^I = (-0.0134, 0.2232, 0.3)^\mathsf{T}$. Rotating the vector directly gives the same thing: $\mathbf{R}_3(30^\circ)\boldsymbol{\omega}^B = (0.866\times 0.1 - 0.5\times 0.2,\ 0.5\times 0.1 + 0.866\times 0.2,\ 0.3) = (-0.0134, 0.2232, 0.3)$. The similarity rotated the operator exactly as it rotated the vector.

**Invariants.** Both matrices have trace $0$ and determinant $0$, as every $3\times 3$ skew-symmetric matrix must. Both have characteristic polynomial $\lambda^3 + \|\boldsymbol{\omega}\|^2\lambda$, with roots $0$ and $\pm i\|\boldsymbol{\omega}\| = \pm 0.374\,i\,\mathrm{rad/s}$, since $\|\boldsymbol{\omega}\| = \sqrt{0.01 + 0.04 + 0.09} = 0.374$. The zero eigenvalue belongs to the spin axis, which the motion leaves alone. The imaginary pair is the turning at $0.374\,\mathrm{rad/s}$ in the plane at right angles to it. Those numbers are facts about the motion. Which frame you write the matrix in is a fact about your bookkeeping.
:::

## Modal coordinates

Now pick the eigenvectors as the basis. If $\mathbf{A}$ is diagonalisable, $\mathbf{P} = \mathbf{V}$ gives $\mathbf{B} = \mathbf{V}^{-1}\mathbf{A}\mathbf{V} = \boldsymbol{\Lambda}$, and the new state $\mathbf{z} = \mathbf{V}^{-1}\mathbf{x}$ obeys

$$\dot{\mathbf{z}} = \boldsymbol{\Lambda}\mathbf{z} \quad\Longleftrightarrow\quad \dot{z}_i = \lambda_i z_i, \qquad z_i(t) = e^{\lambda_i t}z_i(0).$$

A tangle of $n$ linked equations has become $n$ single equations that ignore each other. Think of a band where every musician is listening to every other one, replaced by $n$ soloists each playing alone. The $z_i$ are the **modal coordinates**, and each $z_i(t)$ is a **mode** of the system. Converting back with $\mathbf{x} = \mathbf{V}\mathbf{z}$,

$$\mathbf{x}(t) = \sum_{i=1}^{n} z_i(0)\,e^{\lambda_i t}\,\mathbf{v}_i, \qquad \mathbf{z}(0) = \mathbf{V}^{-1}\mathbf{x}(0).$$

This is the whole solution of $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ — the same $e^{\mathbf{A}t} = \mathbf{V}e^{\boldsymbol{\Lambda}t}\mathbf{V}^{-1}$ as Lesson 2, read term by term. Every motion is a sum of fixed shapes $\mathbf{v}_i$, each growing or shrinking at its own rate $e^{\lambda_i t}$, with amounts set once by the starting state. Nothing passes between modes. Start exactly on an eigenvector and you stay on it forever. Engineers use this every day on **[[flexible structures|structural-modes]]**.

::: example The damped oscillator, mode by mode
For $\mathbf{A} = \begin{pmatrix} 0 & 1 \\ -2 & -3 \end{pmatrix}$ with $\mathbf{x} = (y, \dot{y})^\mathsf{T}$, Lesson 2 found $\mathbf{V} = \begin{pmatrix} 1 & 1 \\ -1 & -2 \end{pmatrix}$, $\mathbf{V}^{-1} = \begin{pmatrix} 2 & 1 \\ -1 & -1 \end{pmatrix}$ and $\boldsymbol{\Lambda} = \operatorname{diag}(-1, -2)$.

**Split the start into modes.** Release it from $\mathbf{x}(0) = (1, 0)^\mathsf{T}$: pulled out one unit, at rest. Then $\mathbf{z}(0) = \mathbf{V}^{-1}\mathbf{x}(0) = (2\cdot 1 + 1\cdot 0,\ -1\cdot 1 - 1\cdot 0)^\mathsf{T} = (2, -1)^\mathsf{T}$, so

$$\mathbf{x}(t) = 2e^{-t}\begin{pmatrix} 1 \\ -1 \end{pmatrix} - e^{-2t}\begin{pmatrix} 1 \\ -2 \end{pmatrix}, \qquad y(t) = 2e^{-t} - e^{-2t}.$$

**Check at $t = 0.5\,\mathrm{s}$.** $z_1 = 2e^{-0.5} = 1.213$ and $z_2 = -e^{-1} = -0.368$, so $\mathbf{x} = 1.213\,(1, -1)^\mathsf{T} - 0.368\,(1, -2)^\mathsf{T} = (0.845, -0.477)^\mathsf{T}$. That is exactly the first column of $e^{0.5\mathbf{A}}$ from Lesson 2.

**Read it.** The start is a mix of two shapes. The $\mathbf{v}_2$ shape, with velocity twice the position and opposite in sign, is the fast mode: it is gone within about two seconds. The $\mathbf{v}_1$ shape shrinks with a time constant of $1\,\mathrm{s}$, and it is all that is left after that. Every damped second-order system with real eigenvalues behaves this way — a quick fast transient, then a slow exponential creep home — and the slow eigenvalue sets the settling time.

**A different start.** Kick it instead with $\mathbf{x}(0) = (0, 1)^\mathsf{T}$: zero position, unit velocity. Then $\mathbf{z}(0) = (1, -1)^\mathsf{T}$ and $y(t) = e^{-t} - e^{-2t}$. This rises to a peak of $0.25$ at $t = \ln 2 = 0.693\,\mathrm{s}$ (where $e^{-t} = 0.5$, so $y = 0.5 - 0.25$), then decays. Same modes, same rates, different amounts.
:::

## Reading an eigenvalue

Each eigenvalue is a number with units of $\mathrm{s^{-1}}$. Where it sits in the complex plane tells you everything its mode does, as the **[[map of the complex plane|eigen-map]]** shows.

**A real eigenvalue $\lambda = \sigma$.** The mode is $e^{\sigma t}$.

- If $\sigma < 0$, it decays with **time constant** $\tau = -1/\sigma$ ("tau"). After one $\tau$ the mode is at $e^{-1} = 36.8\,\%$ of its start; after $3\tau$ at $5\,\%$; after $4.6\tau$ at $1\,\%$.
- If $\sigma > 0$, it grows, doubling every $\ln 2/\sigma$.
- If $\sigma = 0$, it sits still, which is what a pure integrator does.

**A complex pair $\lambda = \sigma \pm i\omega$.** For a real $\mathbf{A}$, the eigenvectors come in conjugate pairs too, and the two complex modes $e^{(\sigma \pm i\omega)t}$ combine into one real motion:

$$e^{\sigma t}\left(\mathbf{a}\cos\omega t + \mathbf{b}\sin\omega t\right),$$

with real vectors $\mathbf{a}$ and $\mathbf{b}$ set by the starting state. It is an oscillation at angular frequency $\omega$ — the **damped frequency**, with period $2\pi/\omega$ — inside a shrinking or growing **envelope** $e^{\sigma t}$, whose time constant is again $-1/\sigma$. The real part says how fast the envelope shrinks. The imaginary part says how fast the state goes round.

Control engineers repackage the same pair as two other numbers:

- the **[[natural frequency|natural-frequency]]** $\omega_n = |\lambda| = \sqrt{\sigma^2 + \omega^2}$;
- the **damping ratio** $\zeta = -\sigma/|\lambda|$ ("zeta"), which for a complex pair lies between $0$ (no damping) and $1$ (the least damping that stops the ringing).

With those, $\lambda = -\zeta\omega_n \pm i\omega_n\sqrt{1 - \zeta^2}$. A purely imaginary pair ($\sigma = 0$, so $\zeta = 0$) oscillates forever at constant size — the hanging pendulum and the rotation of Lesson 1.

::: example An attitude loop
A single-axis attitude controller pushes back with torque proportional to the angle error and to the rate. In suitable units that gives $\ddot{\theta} = -4\theta - \dot{\theta}$, so with $\mathbf{x} = (\theta, \dot{\theta})^\mathsf{T}$:

$$\mathbf{A} = \begin{pmatrix} 0 & 1 \\ -4 & -1 \end{pmatrix}, \qquad \lambda^2 + \lambda + 4 = 0, \qquad \lambda = -0.5 \pm 1.936\,i\ \mathrm{s^{-1}}.$$

The polynomial uses trace $-1$ and determinant $4$. The quadratic formula gives $\lambda = \tfrac{1}{2}\left(-1 \pm \sqrt{1 - 16}\right) = -0.5 \pm \tfrac{1}{2}\sqrt{15}\,i$, and $\tfrac{1}{2}\sqrt{15} = 1.936$.

**Read the numbers.**

- Envelope time constant: $\tau = 1/0.5 = 2\,\mathrm{s}$.
- Damped period: $2\pi/1.936 = 3.24\,\mathrm{s}$, which is about $0.3\,\mathrm{Hz}$.
- Natural frequency: $\omega_n = \sqrt{0.25 + 3.75} = 2\,\mathrm{rad/s}$. Damping ratio: $\zeta = 0.5/2 = 0.25$.

So a pointing error will **[[ring|ringing-picture]]**. In ten seconds its envelope falls by $e^{-0.5\times 10} = e^{-5} = 0.0067$; it reaches one percent after $\ln 100/0.5 = 9.2\,\mathrm{s}$, almost three full swings.

**The eigenvector.** For any matrix of this shape, the first row of $\mathbf{A} - \lambda\mathbf{I}$ says $-\lambda v_1 + v_2 = 0$, so the eigenvector is $(1, \lambda)^\mathsf{T}$. Here it is complex: there is no real direction the state can sit on without turning. That is what oscillation looks like in the phase plane, the plane of angle against rate.

**Change units.** Measure the rate in milliradians per second: $\mathbf{P} = \operatorname{diag}(1, 1000)$. The matrix becomes $\mathbf{P}^{-1}\mathbf{A}\mathbf{P} = \begin{pmatrix} 0 & 0.001 \\ -4000 & -1 \end{pmatrix}$. It looks badly scaled, and it is — a topic for Lesson 10. But its trace is still $-1$, its determinant still $0.001\times 4000 = 4$, and its eigenvalues still $-0.5 \pm 1.936\,i\ \mathrm{s^{-1}}$.
:::

## Stability

Now put the pieces together. Every solution of $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ is a sum of modes $e^{\lambda_i t}$ times fixed vectors. (If $\mathbf{A}$ is defective there are extra $t^k e^{\lambda t}$ terms, as Lesson 2 showed, but an exponential always beats a power of $t$, so the conclusion is the same.) Each mode has size $|e^{\lambda_i t}| = e^{\operatorname{Re}(\lambda_i)\,t}$, where $\operatorname{Re}$ means "real part". So:

- Every solution dies away to zero, from every starting state, exactly when every real part is negative. The system is **asymptotically stable**.
- If any eigenvalue has a positive real part, its mode grows without limit, and the system is **unstable**. It does not matter how many other eigenvalues are comfortably negative. A tiny amount of the growing mode is enough, and rounding errors alone will supply it.
- Eigenvalues exactly on the imaginary axis, with the rest to the left, give a **marginally stable** system that neither dies away nor grows: an undamped oscillation, or an integrator holding a constant.

::: key Stability of a continuous-time LTI system
$\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ is asymptotically stable if and only if every eigenvalue of $\mathbf{A}$ has strictly negative real part, $\operatorname{Re}\lambda_i < 0$ for all $i$. Any eigenvalue on or to the right of the imaginary axis destroys stability. Because eigenvalues survive similarity, this verdict does not depend on the frame or the units the states are written in.
:::

Two refinements matter in practice.

**The slowest mode sets the pace.** The long-run behavior of a stable system is set by the eigenvalue with real part closest to zero. Every other mode has already faded by the time it matters. So the time to settle to one percent is roughly $4.6/|\operatorname{Re}\lambda_{\text{slow}}|$.

**The quiet instability is the dangerous one.** Suppose $\mathbf{A}$ has eigenvalues $-2$ and $+0.005\,\mathrm{s^{-1}}$. Run a two-second simulation. The $-2$ mode collapses to $e^{-4} = 1.8\,\%$, and the unstable mode has grown by a factor of only $e^{0.01} = 1.01$. The plot looks like a healthy, well-damped system. But the unstable mode doubles every $\ln 2/0.005 = 139\,\mathrm{s}$. After ten minutes it is $e^{0.005\times 600} = e^{3} = 20$ times its starting size; after twenty minutes, $e^{6} = 403$ times. **[[Slow instabilities|explorer-one]]** pass a short test and fail on orbit. Always look at the eigenvalues, not only at the time histories.

::: warning A two-by-two shortcut, and its limits
For a $2\times 2$ matrix the characteristic polynomial is $\lambda^2 - \operatorname{tr}(\mathbf{A})\lambda + \det(\mathbf{A})$. Both roots have negative real part exactly when $\operatorname{tr}\mathbf{A} < 0$ and $\det\mathbf{A} > 0$: the roots add to a negative number and multiply to a positive one. That is a fast check for a second-order loop.

It does not carry over. For a stable $3\times 3$ matrix the eigenvalues add to a negative trace and — three negatives multiplied — give a negative determinant. But a matrix with eigenvalues $1$, $2$ and $-10$ also has negative trace ($-7$) and negative determinant ($-20$), and it is unstable. For $n \ge 3$, compute the eigenvalues or use a **[[Routh–Hurwitz|routh-hurwitz]]** table.
:::

::: warning Discrete time is a different picture
A filter or digital controller moves forward with $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k$. After $k$ steps the modes are $\mu_i^k$, where $\mu_i$ ("mu") are the eigenvalues of $\boldsymbol{\Phi}$. They die away when $|\mu_i| < 1$. So stability in discrete time means eigenvalues **inside the [[unit circle|unit-circle]]**, not in the left half-plane.

The two pictures agree. $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$ has eigenvalues $\mu_i = e^{\lambda_i\Delta t}$, with size $|\mu_i| = e^{\operatorname{Re}(\lambda_i)\Delta t}$, which is less than one exactly when $\operatorname{Re}\lambda_i < 0$. For the attitude loop with $\Delta t = 0.1\,\mathrm{s}$, $|\mu| = e^{-0.05} = 0.951$: each step shrinks the envelope by about five percent. Applying the left-half-plane test to a $\boldsymbol{\Phi}$ matrix is a common and silent error.
:::

```python
import numpy as np

A = np.array([[0.0, 1.0], [-4.0, -1.0]])
w, V = np.linalg.eig(A)
print(w)                          # [-0.5+1.93649167j -0.5-1.93649167j]
print(np.all(w.real < 0))         # True: asymptotically stable
tau = -1.0 / w.real.max()         # time constant of the slowest mode
print(tau, 2 * np.pi / abs(w[0].imag))   # 2.0 s envelope, 3.24 s period

P = np.diag([1.0, 1000.0])        # rate in mrad/s: a similarity transform
B = np.linalg.inv(P) @ A @ P
print(np.allclose(np.sort_complex(np.linalg.eigvals(B)), np.sort_complex(w)))  # True
```

## Check yourself

::: check
$\mathbf{A} = \begin{pmatrix} 1 & 2 \\ 0 & 3 \end{pmatrix}$ and $\mathbf{B} = \begin{pmatrix} 3 & 0 \\ 5 & 1 \end{pmatrix}$ are claimed to be similar. Do the invariants agree, and are they in fact similar?
:::

::: answer
**Invariants.** Both are triangular, so their eigenvalues are their diagonal entries: $\{1, 3\}$ in each case. Both have trace $4$, determinant $3$ and characteristic polynomial $\lambda^2 - 4\lambda + 3$. The invariants agree.

**Similar?** Yes. Each has two different eigenvalues, so each is diagonalisable: $\mathbf{A} = \mathbf{V}_A\operatorname{diag}(1,3)\mathbf{V}_A^{-1}$ and $\mathbf{B} = \mathbf{V}_B\operatorname{diag}(1,3)\mathbf{V}_B^{-1}$. Solve the second for $\operatorname{diag}(1, 3)$ and substitute into the first: $\mathbf{B} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}$ with $\mathbf{P} = \mathbf{V}_A\mathbf{V}_B^{-1}$.

**Why invariants alone were not proof.** $\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ and $\mathbf{I}$ share every invariant, yet they are not similar: anything similar to $\mathbf{I}$ is $\mathbf{P}^{-1}\mathbf{I}\mathbf{P} = \mathbf{I}$ itself. With distinct eigenvalues, though, matching eigenvalues is enough.
:::

::: check
A covariance matrix $\mathbf{P}^B$ is known in body axes, and you need it in inertial axes. Write the transformation, name the kind of similarity it is, and say what happens to its eigenvalues.
:::

::: answer
$\mathbf{P}^I = \mathbf{R}_I^B\,\mathbf{P}^B\,(\mathbf{R}_I^B)^\mathsf{T}$. Because $\mathbf{R}_I^B$ is orthogonal, $(\mathbf{R}_I^B)^\mathsf{T} = (\mathbf{R}_I^B)^{-1}$, so this is an orthogonal similarity.

The eigenvalues do not change: the uncertainty ellipsoid has the same axis lengths in every frame. The matrix stays symmetric, because an orthogonal similarity keeps symmetry. Only the eigenvectors turn, by $\mathbf{R}_I^B$ — the ellipsoid's axes are now described in the new frame.
:::

::: check
A system has eigenvalues $-0.2 \pm 3i\ \mathrm{s^{-1}}$. Describe its free response: time constant, period, natural frequency, damping ratio, and how long until the amplitude is under one percent.
:::

::: answer
- Time constant: the envelope is $e^{-0.2t}$, so $\tau = 1/0.2 = 5\,\mathrm{s}$.
- Period: $\omega = 3\,\mathrm{rad/s}$, so the period is $2\pi/3 = 2.09\,\mathrm{s}$.
- Natural frequency: $\omega_n = \sqrt{0.04 + 9} = 3.01\,\mathrm{rad/s}$.
- Damping ratio: $\zeta = 0.2/3.01 = 0.066$ — lightly damped.
- One percent: $e^{-0.2t} = 0.01$ gives $t = \ln 100/0.2 = 23\,\mathrm{s}$, about eleven full swings.

Stable, but it rings for a long time.
:::

::: check
Why can a two-second simulation of a system with eigenvalues $\{-5, -0.3, +0.002\}\ \mathrm{s^{-1}}$ look perfectly stable? What is the real verdict?
:::

::: answer
**Why it looks fine.** In two seconds the $-5$ mode falls to $e^{-10} \approx 4.5\times 10^{-5}$, the $-0.3$ mode to $e^{-0.6} = 0.55$, and the $+0.002$ mode grows only to $e^{0.004} = 1.004$. On a plot full of decaying transients, that last one looks constant.

**The verdict.** Unstable, because one eigenvalue has a positive real part. The unstable mode doubles every $\ln 2/0.002 = 347\,\mathrm{s}$ and will dominate after a few thousand seconds — about one low Earth orbit. The eigenvalue test gives the answer in one line where the simulation misleads.
:::

::: check
The state transition matrix of a filter has eigenvalues $0.98$ and $1.02$. Is the propagation stable? What are the matching continuous-time eigenvalues for $\Delta t = 1\,\mathrm{s}$?
:::

::: answer
**Stability.** Discrete-time stability needs every eigenvalue of $\boldsymbol{\Phi}$ inside the unit circle. $|1.02| > 1$, so the propagation is unstable: that mode grows by two percent per step, doubling in $\ln 2/\ln 1.02 = 35$ steps.

**Continuous-time eigenvalues.** Since $\mu = e^{\lambda\Delta t}$, $\lambda = \ln\mu/\Delta t$. So $\ln 0.98 = -0.0202\,\mathrm{s^{-1}}$ and $\ln 1.02 = +0.0198\,\mathrm{s^{-1}}$.

**The trap.** The left-half-plane test applied to $\boldsymbol{\Phi}$'s eigenvalues would say "both positive, both unstable". That is wrong for the first and right for the second only by accident. Use the unit-circle test on $\boldsymbol{\Phi}$ and the half-plane test on $\mathbf{A}$.
:::

## Summary

| Item | Statement |
| --- | --- |
| Similarity | $\mathbf{B} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}$: same map, new basis $\mathbf{x} = \mathbf{P}\mathbf{z}$; $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} \Rightarrow \dot{\mathbf{z}} = \mathbf{B}\mathbf{z}$ |
| Kept | eigenvalues (with repeats), characteristic polynomial, trace, determinant, rank; eigenvectors become $\mathbf{P}^{-1}\mathbf{v}$ |
| Not kept | entries, symmetry, lengths and angles — unless $\mathbf{P}$ is orthogonal |
| Frame change | $\mathbf{M}^A = \mathbf{R}_A^B\mathbf{M}^B(\mathbf{R}_A^B)^\mathsf{T}$, an orthogonal similarity; $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^\mathsf{T} = [(\mathbf{R}\mathbf{a})\times]$ |
| Unit change | diagonal $\mathbf{P}$: $b_{ij} = a_{ij}p_j/p_i$; eigenvalues of a dynamics matrix are always in $\mathrm{s^{-1}}$ |
| Modal coordinates | $\mathbf{z} = \mathbf{V}^{-1}\mathbf{x}$, $\dot{z}_i = \lambda_i z_i$, $\mathbf{x}(t) = \sum_i z_i(0)e^{\lambda_i t}\mathbf{v}_i$ |
| Real $\lambda = \sigma$ | time constant $\tau = -1/\sigma$; doubling time $\ln 2/\sigma$ if $\sigma > 0$ |
| Complex $\sigma \pm i\omega$ | envelope $e^{\sigma t}$, period $2\pi/\omega$, $\omega_n = \lvert\lambda\rvert$, $\zeta = -\sigma/\lvert\lambda\rvert$ |
| Stability | asymptotically stable $\Leftrightarrow$ $\operatorname{Re}\lambda_i < 0$ for all $i$; slowest mode sets settling; small positive $\lambda$ is the silent failure |
| Discrete time | $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k$ stable $\Leftrightarrow$ $\lvert\mu_i\rvert < 1$; $\mu_i = e^{\lambda_i\Delta t}$ |

The next lesson narrows to symmetric matrices, where the similarity that diagonalizes is always orthogonal: the eigenvalues are real, the eigenvectors are perpendicular, and $\mathbf{A} = \mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^\mathsf{T}$. That is the spectral theorem, and every covariance and inertia matrix obeys it.

::: context milliradian What a milliradian is
A **milliradian** (mrad) is a thousandth of a radian, about $0.0573^\circ$. It is a natural size for pointing: at a distance of $1\,\mathrm{km}$, one milliradian spans about $1\,\mathrm{m}$. Star trackers, gimbals and antenna pointing specs are often quoted in milliradians or microradians, so mixed-unit state vectors are common in real code.
:::

::: context similar-word Same statue, different photo
Take two photos of one statue from different spots. The pictures differ; the statue does not. Similar matrices are like that: two descriptions of one map, taken from two different bases. The formula even reads like directions for the photographer. To see what the statue does from your new spot, walk to the old spot ($\mathbf{P}$), watch it happen there ($\mathbf{A}$), and walk back ($\mathbf{P}^{-1}$).
:::

::: context cyclic-trace Why the trace does not care about order
The diagonal entries of $\mathbf{X}\mathbf{Y}$ are $\sum_k x_{ik}y_{ki}$, so $\operatorname{tr}(\mathbf{X}\mathbf{Y}) = \sum_i\sum_k x_{ik}y_{ki}$. For $\mathbf{Y}\mathbf{X}$ you get $\sum_k\sum_i y_{ki}x_{ik}$ — the very same products, added in a different order. So the traces are equal, even though $\mathbf{X}\mathbf{Y}$ and $\mathbf{Y}\mathbf{X}$ are usually different matrices. With three factors you may rotate them in a cycle, $\operatorname{tr}(\mathbf{X}\mathbf{Y}\mathbf{Z}) = \operatorname{tr}(\mathbf{Z}\mathbf{X}\mathbf{Y})$, but not swap two of them.
:::

::: context inertia-tensor What an inertia tensor is
The **inertia tensor** is a $3\times 3$ symmetric matrix that says how hard a body is to spin up about each axis, including how spinning about one axis drags in the others. Its entries are in $\mathrm{kg\,m^2}$. Its eigenvectors are the body's **principal axes** and its eigenvalues are the principal moments. Lesson 4 works a full example; the key point here is that rotating the frame changes the entries but never the principal moments.
:::

::: context structural-modes Modes you can see
A tall launch vehicle bends in flight like a flexible rod, and its bending motion splits into modes: the first mode bows the whole vehicle into one gentle curve, the second into an S-shape, and so on, each with its own frequency. Engineers compute these modes, then design the flight control system so it does not excite them. Filters that remove a narrow band of frequencies (notch filters) are often tuned to the first bending mode. The math is exactly this section's, on much bigger matrices.
:::

::: context eigen-map What each spot in the plane means
The eigenvalue's position says what its mode does. Left of the vertical axis, modes die out; right of it, they grow. On the horizontal axis they move without turning; off it, they swing, faster the higher up they sit. The blue pair is the attitude loop of this lesson.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="180" height="180" fill="#8fb8f0" fill-opacity="0.3"/>
  <rect x="200" y="10" width="140" height="180" fill="#f2b880" fill-opacity="0.35"/>
  <line x1="20" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="200" y1="10" x2="200" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="318" y="94" font-size="11" fill="#1f2a44">Re λ</text>
  <text x="205" y="22" font-size="11" fill="#1f2a44">Im λ</text>
  <text x="28" y="26" font-size="12" fill="#1d6fd1">stable</text>
  <text x="270" y="26" font-size="12" fill="#b4232c">unstable</text>
  <circle cx="160" cy="100" r="5" fill="#1d6fd1"/>
  <text x="112" y="118" font-size="11" fill="#1f2a44">−1: decays</text>
  <circle cx="220" cy="100" r="5" fill="#b4232c"/>
  <text x="228" y="118" font-size="11" fill="#1f2a44">+0.5: grows</text>
  <circle cx="180" cy="22.6" r="5" fill="#1d6fd1"/><circle cx="180" cy="177.4" r="5" fill="#1d6fd1"/>
  <text x="60" y="56" font-size="11" fill="#1f2a44">−0.5 ± 1.94i:</text>
  <text x="60" y="70" font-size="11" fill="#1f2a44">rings, dies out</text>
  <circle cx="200" cy="60" r="5" fill="#6c7a93"/><circle cx="200" cy="140" r="5" fill="#6c7a93"/>
  <text x="210" y="64" font-size="11" fill="#1f2a44">±i: rings forever</text>
</svg>
```
:::

::: context natural-frequency Where "natural" comes from
Take away the damping — the $-\dot{\theta}$ term in the attitude loop — and the system rings forever at a frequency set only by its stiffness: $\ddot{\theta} = -4\theta$ swings at $\sqrt{4} = 2\,\mathrm{rad/s}$. That is its **natural** frequency, the one it would pick if left alone, and it is $|\lambda|$. Adding damping slows the swing a little, to the damped frequency $\omega_n\sqrt{1 - \zeta^2}$ — here $2\sqrt{1 - 0.0625} = 1.936\,\mathrm{rad/s}$ — and wraps it in a shrinking envelope.
:::

::: context ringing-picture How the attitude error rings
The angle after starting at $1$ (in the loop's units) and at rest: $\theta(t) = e^{-0.5t}\left(\cos 1.936t + 0.258\sin 1.936t\right)$. The dashed curves are its envelope, $\pm 1.03\,e^{-0.5t}$. Every swing is smaller than the last by the same factor, and by about $9.2\,\mathrm{s}$ the envelope is under one percent.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="345" y2="100" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="20" x2="40" y2="180" stroke="#1f2a44" stroke-width="1.2"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3" points="40.0,27.7 52.0,40.8 64.0,51.5 76.0,60.3 88.0,67.5 100.0,73.4 112.0,78.2 124.0,82.2 136.0,85.4 148.0,88.0 160.0,90.2 172.0,92.0 184.0,93.4 196.0,94.6 208.0,95.6 220.0,96.4 232.0,97.1 244.0,97.6 256.0,98.0 268.0,98.4 280.0,98.7 292.0,98.9 304.0,99.1 316.0,99.3 328.0,99.4 340.0,99.5"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3" points="40.0,172.3 52.0,159.2 64.0,148.5 76.0,139.7 88.0,132.5 100.0,126.6 112.0,121.8 124.0,117.8 136.0,114.6 148.0,112.0 160.0,109.8 172.0,108.0 184.0,106.6 196.0,105.4 208.0,104.4 220.0,103.6 232.0,102.9 244.0,102.4 256.0,102.0 268.0,101.6 280.0,101.3 292.0,101.1 304.0,100.9 316.0,100.7 328.0,100.6 340.0,100.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.2" points="40.0,30.0 43.0,31.3 46.0,35.2 49.0,41.1 52.0,48.7 55.0,57.5 58.0,67.1 61.0,77.0 64.0,86.9 67.0,96.3 70.0,104.9 73.0,112.6 76.0,119.0 79.0,124.1 82.0,127.8 85.0,130.1 88.0,131.1 91.0,130.7 94.0,129.3 97.0,126.8 100.0,123.6 103.0,119.8 106.0,115.6 109.0,111.2 112.0,106.8 115.0,102.6 118.0,98.6 121.0,95.1 124.0,92.1 127.0,89.7 130.0,87.9 133.0,86.8 136.0,86.2 139.0,86.3 142.0,86.8 145.0,87.8 148.0,89.2 151.0,90.8 154.0,92.6 157.0,94.6 160.0,96.5 163.0,98.5 166.0,100.2 169.0,101.8 172.0,103.2 175.0,104.3 178.0,105.2 181.0,105.8 184.0,106.1 187.0,106.1 190.0,105.9 193.0,105.5 196.0,105.0 199.0,104.3 202.0,103.5 205.0,102.6 208.0,101.7 211.0,100.9 214.0,100.1 217.0,99.3 220.0,98.7 223.0,98.2 226.0,97.8 229.0,97.5 232.0,97.3 235.0,97.3 238.0,97.3 241.0,97.5 244.0,97.7 247.0,98.0 250.0,98.4 253.0,98.8 256.0,99.1 259.0,99.5 262.0,99.9 265.0,100.2 268.0,100.5 271.0,100.8 274.0,101.0 277.0,101.1 280.0,101.2 283.0,101.2 286.0,101.2 289.0,101.1 292.0,101.0 295.0,100.9 298.0,100.8 301.0,100.6 304.0,100.4 307.0,100.2 310.0,100.1 313.0,99.9 316.0,99.8 319.0,99.7 322.0,99.6 325.0,99.5 328.0,99.5 331.0,99.5 334.0,99.5 337.0,99.5 340.0,99.5"/>
  <line x1="316.3" y1="92" x2="316.3" y2="108" stroke="#b4232c" stroke-width="1.5"/>
  <text x="316" y="122" font-size="11" fill="#b4232c" text-anchor="middle">1% at 9.2 s</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="100" y="176">2 s</text><text x="160" y="176">4 s</text><text x="220" y="176">6 s</text><text x="280" y="176">8 s</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1"><line x1="100" y1="100" x2="100" y2="104"/><line x1="160" y1="100" x2="160" y2="104"/><line x1="220" y1="100" x2="220" y2="104"/><line x1="280" y1="100" x2="280" y2="104"/><line x1="340" y1="100" x2="340" y2="104"/></g>
  <text x="34" y="34" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="34" y="104" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="46" y="16" font-size="11" fill="#1f2a44">angle θ</text>
</svg>
```
:::

::: context explorer-one A slow instability in orbit
America's first satellite, Explorer 1, launched in 1958, was set spinning about its long, thin axis — the axis about which it was easiest to spin. The rigid-body analysis said that spin was stable. But the satellite's flexible wire antennas flexed and slowly dissipated energy, and a spin about that axis is not stable once energy leaks away. Soon after launch the satellite had fallen into a tumble. The growth was slow compared with the spin itself, which is exactly the kind of instability a short test misses. Designers of spinning spacecraft have respected that lesson ever since.
:::

::: context routh-hurwitz The Routh–Hurwitz test
Edward Routh (in the 1870s) and Adolf Hurwitz (in the 1890s) found, independently, a way to decide whether all roots of a polynomial have negative real parts using only its coefficients — no root-finding. You fill in a small table from the coefficients and count sign changes down its first column. It was a lifesaver before computers, and it is still useful when a coefficient is an unknown gain: the table tells you the range of gains that keeps a loop stable.
:::

::: context unit-circle From half-plane to circle
The map $\mu = e^{\lambda\Delta t}$ sends the whole left half of the $\lambda$ plane into the inside of the unit circle, and the imaginary axis onto the circle itself. The blue pair on the left is the attitude loop, $-0.5 \pm 1.936i$; with $\Delta t = 0.1\,\mathrm{s}$ it lands at $0.933 \pm 0.183i$, a little inside the circle, at radius $0.951$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="l3uc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#1f2a44"/></marker>
  </defs>
  <rect x="20" y="30" width="70" height="140" fill="#8fb8f0" fill-opacity="0.35"/>
  <line x1="20" y1="100" x2="155" y2="100" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="90" y1="30" x2="90" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="75" cy="41.9" r="4.5" fill="#1d6fd1"/><circle cx="75" cy="158.1" r="4.5" fill="#1d6fd1"/>
  <text x="88" y="190" font-size="12" fill="#1f2a44" text-anchor="middle">λ plane</text>
  <line x1="160" y1="100" x2="198" y2="100" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#l3uc)"/>
  <text x="179" y="88" font-size="11" fill="#1f2a44" text-anchor="middle">e^(λΔt)</text>
  <circle cx="270" cy="100" r="60" fill="#8fb8f0" fill-opacity="0.35" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="200" y1="100" x2="345" y2="100" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="270" y1="30" x2="270" y2="170" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="326.0" cy="89.0" r="4.5" fill="#1d6fd1"/><circle cx="326.0" cy="111.0" r="4.5" fill="#1d6fd1"/>
  <text x="338" y="95" font-size="11" fill="#1f2a44">1</text>
  <line x1="330" y1="96" x2="330" y2="104" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="270" y="190" font-size="12" fill="#1f2a44" text-anchor="middle">μ plane: unit circle</text>
</svg>
```
:::
