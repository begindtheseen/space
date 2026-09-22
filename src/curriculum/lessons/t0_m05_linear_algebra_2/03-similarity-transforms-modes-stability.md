---
id: l03-similarity-transforms-modes-stability
title: Similarity transforms, modal coordinates and stability
minutes: 21
covers:
  - similarity transforms
---

Two engineers can write the same vehicle dynamics as two different matrices and both be right. One keeps attitude error in the body frame, the other in the inertial frame; one measures angular rate in radians per second, the other in milliradians per second; one uses the physical states, the other the modal coordinates of the previous two lessons. The matrices they write differ, yet they describe one machine. The relation between them is a similarity transform, $\mathbf{B} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}$, and the things that survive it — eigenvalues above all — are the things that belong to the vehicle rather than to the coordinates.

This is what makes eigenvalues worth computing. A closed-loop matrix $\mathbf{A} - \mathbf{B}\mathbf{K}$ has different entries in every frame and every set of units, but its eigenvalues are the same in all of them, and they decide whether the loop is stable, how fast it settles, and whether it rings. The diagonalisation $\mathbf{A} = \mathbf{V}\boldsymbol{\Lambda}\mathbf{V}^{-1}$ of Lesson 1 is itself a similarity transform, the one that chooses the eigenvectors as the basis, and in that basis the dynamics fall apart into independent scalar equations called modes.

This lesson defines similarity, proves what it preserves, shows the two forms it takes on a real vehicle — a change of frame and a change of units — then uses the eigenbasis to decouple $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ into modes, reads the physical meaning of each eigenvalue's real and imaginary parts, and states the stability test that every controls and estimation module after this one will use without comment.

## What a similarity transform is

Linear Algebra I showed how coordinates change. If the columns of an invertible matrix $\mathbf{P}$ are a new basis, then a vector with standard coordinates $\mathbf{x}$ has new coordinates $\mathbf{z} = \mathbf{P}^{-1}\mathbf{x}$, and $\mathbf{x} = \mathbf{P}\mathbf{z}$ converts back. Now take a linear map with matrix $\mathbf{A}$ in the standard coordinates, and ask what matrix performs the same map on the new coordinates. Convert $\mathbf{z}$ to standard coordinates, apply the map, convert the result back:

$$\mathbf{z} \mapsto \mathbf{P}^{-1}\,\mathbf{A}\,(\mathbf{P}\mathbf{z}) = \left(\mathbf{P}^{-1}\mathbf{A}\mathbf{P}\right)\mathbf{z}.$$

So the same map has matrix $\mathbf{B} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}$ in the new basis. Two matrices related this way, for some invertible $\mathbf{P}$, are called **similar**, and the passage from $\mathbf{A}$ to $\mathbf{B}$ is a **similarity transform**. Read the product from right to left, in the order a vector meets the factors: $\mathbf{P}$ converts the new coordinates to the old, $\mathbf{A}$ acts, $\mathbf{P}^{-1}$ converts the result to the new coordinates.

The definition has an equivalent dynamic form that is the one you will use most. Suppose $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ and define new state coordinates $\mathbf{z} = \mathbf{P}^{-1}\mathbf{x}$. Since $\mathbf{P}$ is constant, $\dot{\mathbf{z}} = \mathbf{P}^{-1}\dot{\mathbf{x}} = \mathbf{P}^{-1}\mathbf{A}\mathbf{x} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}\mathbf{z}$. The transformed state obeys $\dot{\mathbf{z}} = \mathbf{B}\mathbf{z}$ with the similar matrix $\mathbf{B}$. A change of state coordinates is a similarity transform of the dynamics matrix. Nothing physical has changed; only the numbers used to describe it.

::: key Similarity transform
$\mathbf{B} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}$ with $\mathbf{P}$ invertible. $\mathbf{A}$ and $\mathbf{B}$ are the same linear map written in two bases, related by $\mathbf{x} = \mathbf{P}\mathbf{z}$. If $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ then $\mathbf{z} = \mathbf{P}^{-1}\mathbf{x}$ obeys $\dot{\mathbf{z}} = \mathbf{B}\mathbf{z}$. Diagonalisation, $\boldsymbol{\Lambda} = \mathbf{V}^{-1}\mathbf{A}\mathbf{V}$, is the similarity transform whose new basis is the eigenvectors.
:::

## What similarity preserves

If $\mathbf{A}$ and $\mathbf{B}$ describe one map, everything intrinsic to the map must come out the same from either matrix. The proofs are one line each, and each one is a tool.

**Eigenvalues.** Suppose $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$. Set $\mathbf{w} = \mathbf{P}^{-1}\mathbf{v}$, which is nonzero because $\mathbf{P}^{-1}$ is invertible. Then

$$\mathbf{B}\mathbf{w} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}\mathbf{P}^{-1}\mathbf{v} = \mathbf{P}^{-1}\mathbf{A}\mathbf{v} = \lambda\,\mathbf{P}^{-1}\mathbf{v} = \lambda\mathbf{w}.$$

So $\lambda$ is an eigenvalue of $\mathbf{B}$ too, with eigenvector $\mathbf{P}^{-1}\mathbf{v}$: the same eigenvalue, and the same eigenvector written in the new coordinates. Similar matrices have identical eigenvalues with identical multiplicities.

**Characteristic polynomial.** More is true — the whole polynomial agrees, not only its roots. Using $\mathbf{P}^{-1}\mathbf{I}\mathbf{P} = \mathbf{I}$ and the product rule for determinants,

$$\det(\mathbf{B} - \lambda\mathbf{I}) = \det\!\left(\mathbf{P}^{-1}(\mathbf{A} - \lambda\mathbf{I})\mathbf{P}\right) = \det(\mathbf{P}^{-1})\det(\mathbf{A} - \lambda\mathbf{I})\det(\mathbf{P}) = \det(\mathbf{A} - \lambda\mathbf{I}),$$

because $\det(\mathbf{P}^{-1})\det(\mathbf{P}) = \det(\mathbf{I}) = 1$.

**Trace and determinant.** Both are coefficients of the characteristic polynomial, so both are preserved. Directly: $\det\mathbf{B} = \det(\mathbf{P}^{-1})\det\mathbf{A}\det\mathbf{P} = \det\mathbf{A}$, and for the trace use the cyclic property $\operatorname{tr}(\mathbf{X}\mathbf{Y}) = \operatorname{tr}(\mathbf{Y}\mathbf{X})$ with $\mathbf{X} = \mathbf{P}^{-1}$ and $\mathbf{Y} = \mathbf{A}\mathbf{P}$: $\operatorname{tr}(\mathbf{P}^{-1}\mathbf{A}\mathbf{P}) = \operatorname{tr}(\mathbf{A}\mathbf{P}\mathbf{P}^{-1}) = \operatorname{tr}\mathbf{A}$.

**Rank, and powers.** $\mathbf{P}$ and $\mathbf{P}^{-1}$ are invertible, so they cannot change the dimension of a column space: $\operatorname{rank}\mathbf{B} = \operatorname{rank}\mathbf{A}$. And $\mathbf{B}^k = \mathbf{P}^{-1}\mathbf{A}^k\mathbf{P}$ because the inner $\mathbf{P}\mathbf{P}^{-1}$ pairs cancel, which extends to any function built from powers: $e^{\mathbf{B}t} = \mathbf{P}^{-1}e^{\mathbf{A}t}\mathbf{P}$, as Lesson 2 already used.

Equally important is what similarity does **not** preserve. The entries change, obviously. Symmetry is not preserved in general: $\mathbf{P}^{-1}\mathbf{A}\mathbf{P}$ can be unsymmetric when $\mathbf{A}$ is symmetric. Norms of vectors and angles between eigenvectors change, because a general $\mathbf{P}$ stretches and shears. The exception is when $\mathbf{P}$ is orthogonal, $\mathbf{P}^{-1} = \mathbf{P}^\mathsf{T}$: an **orthogonal similarity** $\mathbf{Q}^\mathsf{T}\mathbf{A}\mathbf{Q}$ preserves lengths and angles, and it preserves symmetry and skew-symmetry too, since $(\mathbf{Q}^\mathsf{T}\mathbf{A}\mathbf{Q})^\mathsf{T} = \mathbf{Q}^\mathsf{T}\mathbf{A}^\mathsf{T}\mathbf{Q}$. A change of reference frame is an orthogonal similarity, which is why a symmetric inertia tensor stays symmetric in every frame.

::: example Two matrices, one machine
Take the damped oscillator of Lesson 2, $\mathbf{A} = \begin{pmatrix} 0 & 1 \\ -2 & -3 \end{pmatrix}$, and change coordinates with $\mathbf{P} = \begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$, whose inverse is $\mathbf{P}^{-1} = \begin{pmatrix} 1 & -1 \\ 0 & 1 \end{pmatrix}$. The new state is $\mathbf{z} = \mathbf{P}^{-1}\mathbf{x} = (x_1 - x_2,\ x_2)^\mathsf{T}$: position minus velocity, and velocity. Then

$$\mathbf{B} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P} = \begin{pmatrix} 1 & -1 \\ 0 & 1 \end{pmatrix}\begin{pmatrix} 0 & 1 \\ -2 & -3 \end{pmatrix}\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix} = \begin{pmatrix} -2 & 0 \\ -2 & -1 \end{pmatrix}.$$

The entries look nothing alike, but $\operatorname{tr}\mathbf{B} = -3 = \operatorname{tr}\mathbf{A}$ and $\det\mathbf{B} = 2 = \det\mathbf{A}$, so both have characteristic polynomial $\lambda^2 + 3\lambda + 2$ and eigenvalues $-1$ and $-2$. $\mathbf{B}$ is triangular, so you can read them off its diagonal. The eigenvectors of $\mathbf{A}$ were $\mathbf{v}_1 = (1, -1)^\mathsf{T}$ and $\mathbf{v}_2 = (1, -2)^\mathsf{T}$; those of $\mathbf{B}$ should be $\mathbf{P}^{-1}\mathbf{v}_i$, namely $(2, -1)^\mathsf{T}$ and $(3, -2)^\mathsf{T}$. Check the first: $\mathbf{B}(2, -1)^\mathsf{T} = (-4, -4 + 1)^\mathsf{T} = (-4, -3)^\mathsf{T}$ — which is not $-1\times(2,-1)^\mathsf{T}$. Something is wrong, and it is the direction of the conversion: $\mathbf{z} = \mathbf{P}^{-1}\mathbf{x}$, so an eigenvector of $\mathbf{B}$ is $\mathbf{P}^{-1}\mathbf{v}$ with $\mathbf{P}^{-1} = \begin{pmatrix} 1 & -1 \\ 0 & 1 \end{pmatrix}$, giving $(1 + 1, -1)^\mathsf{T} = (2, -1)^\mathsf{T}$. Recompute: $\mathbf{B}(2, -1)^\mathsf{T} = (-2\cdot 2 + 0,\ -2\cdot 2 + (-1)(-1))^\mathsf{T} = (-4, -3)^\mathsf{T}$. Still not an eigenvector. The error is upstream: $\mathbf{P}^{-1}\mathbf{v}_1 = (1\cdot 1 + (-1)(-1),\ -1)^\mathsf{T} = (2, -1)^\mathsf{T}$ is right, so test $\mathbf{B}$ itself, entry by entry. $\mathbf{A}\mathbf{P} = \begin{pmatrix} 0 & 1 \\ -2 & -5 \end{pmatrix}$ and $\mathbf{P}^{-1}(\mathbf{A}\mathbf{P}) = \begin{pmatrix} 2 & 6 \\ -2 & -5 \end{pmatrix}$. The matrix written above was $\mathbf{P}\mathbf{A}\mathbf{P}^{-1}$, the transform in the opposite direction. With the correct $\mathbf{B} = \begin{pmatrix} 2 & 6 \\ -2 & -5 \end{pmatrix}$: trace $-3$, determinant $-10 + 12 = 2$, and $\mathbf{B}(2, -1)^\mathsf{T} = (4 - 6,\ -4 + 5)^\mathsf{T} = (-2, 1)^\mathsf{T} = -1\times(2, -1)^\mathsf{T}$. Now it works.

The detour is left in deliberately. $\mathbf{P}\mathbf{A}\mathbf{P}^{-1}$ and $\mathbf{P}^{-1}\mathbf{A}\mathbf{P}$ are both similar to $\mathbf{A}$ — the first uses $\mathbf{P}^{-1}$ as the basis matrix — so both pass the trace and determinant checks, and only the eigenvector test tells you which basis you are actually in. When you change coordinates in a filter, write down which way $\mathbf{P}$ converts and test it on a vector whose eigenvector you know.
:::

## Similarity on a vehicle: frames and units

Two similarity transforms appear in every GNC codebase, usually without being named.

**A change of frame.** A vector resolved in frame $B$ becomes $\mathbf{r}^A = \mathbf{R}_A^B\mathbf{r}^B$ in frame $A$, with $\mathbf{R}_A^B$ orthogonal. Suppose a matrix $\mathbf{M}^B$ acts on $B$-frame components, $\mathbf{y}^B = \mathbf{M}^B\mathbf{x}^B$. The same physical operation on $A$-frame components is

$$\mathbf{y}^A = \mathbf{R}_A^B\mathbf{y}^B = \mathbf{R}_A^B\mathbf{M}^B\mathbf{x}^B = \mathbf{R}_A^B\mathbf{M}^B(\mathbf{R}_A^B)^\mathsf{T}\mathbf{x}^A, \qquad \mathbf{M}^A = \mathbf{R}_A^B\,\mathbf{M}^B\,(\mathbf{R}_A^B)^\mathsf{T}.$$

This is an orthogonal similarity with $\mathbf{P} = (\mathbf{R}_A^B)^\mathsf{T} = \mathbf{R}_B^A$. Every $3\times 3$ operator you carry between frames — an inertia tensor, a covariance, a cross-product matrix — transforms this way, and every one of them keeps its eigenvalues. The Linear Algebra I identity $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^\mathsf{T} = [(\mathbf{R}\mathbf{a})\times]$ is exactly this statement for the cross-product matrix: rotating the operator is the same as rotating the vector it is built from.

**A change of units or scaling.** If $\mathbf{P} = \operatorname{diag}(p_1, \dots, p_n)$, then $(\mathbf{P}^{-1}\mathbf{A}\mathbf{P})_{ij} = a_{ij}\,p_j/p_i$. Rescaling the states rescales each entry by the ratio of the column's unit to the row's unit, and leaves the eigenvalues alone. This is a useful sanity check when a matrix arrives with mixed units: the eigenvalues of a dynamics matrix always carry units of $\mathrm{s^{-1}}$ whatever the states are measured in, because $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ forces each entry $a_{ij}$ to have units of $[x_i]/([x_j]\,\mathrm{s})$, and a similarity by a diagonal $\mathbf{P}$ is the only thing a unit change can do.

::: example Angular velocity operator in two frames
A body rotates at $\boldsymbol{\omega}^B = (0.1, 0.2, 0.3)^\mathsf{T}\,\mathrm{rad/s}$ in body axes, and the body frame is yawed $30^\circ$ from an inertial frame, $\mathbf{R}_I^B = \mathbf{R}_3(30^\circ)$. The cross-product matrix in body axes is

$$[\boldsymbol{\omega}^B\times] = \begin{pmatrix} 0 & -0.3 & 0.2 \\ 0.3 & 0 & -0.1 \\ -0.2 & 0.1 & 0 \end{pmatrix}\,\mathrm{rad/s}.$$

Transforming it to inertial axes by the orthogonal similarity $\mathbf{R}_I^B[\boldsymbol{\omega}^B\times](\mathbf{R}_I^B)^\mathsf{T}$ gives

$$[\boldsymbol{\omega}^I\times] = \begin{pmatrix} 0 & -0.3 & 0.2232 \\ 0.3 & 0 & 0.0134 \\ -0.2232 & -0.0134 & 0 \end{pmatrix}\,\mathrm{rad/s},$$

and reading the entries off the skew-symmetric layout gives $\boldsymbol{\omega}^I = (-0.0134, 0.2232, 0.3)^\mathsf{T}$, which is $\mathbf{R}_3(30^\circ)\boldsymbol{\omega}^B$ computed directly: $(0.866\times 0.1 - 0.5\times 0.2,\ 0.5\times 0.1 + 0.866\times 0.2,\ 0.3) = (-0.0134, 0.2232, 0.3)$. The similarity rotated the operator exactly as it rotated the vector.

Both matrices have trace $0$ and determinant $0$, as every $3\times 3$ skew-symmetric matrix must, and both have the same characteristic polynomial $\lambda^3 + \|\boldsymbol{\omega}\|^2\lambda$, with roots $0$ and $\pm i\|\boldsymbol{\omega}\| = \pm 0.374\,i\,\mathrm{rad/s}$. The zero eigenvalue is the spin axis, which the rotation leaves alone; the imaginary pair is the turning at $0.374\,\mathrm{rad/s}$ in the plane perpendicular to it. Those numbers are properties of the motion. Which frame you write the matrix in is a property of your bookkeeping.
:::

## Modal coordinates

Now choose the eigenvectors as the basis. If $\mathbf{A}$ is diagonalisable, $\mathbf{P} = \mathbf{V}$ gives $\mathbf{B} = \mathbf{V}^{-1}\mathbf{A}\mathbf{V} = \boldsymbol{\Lambda}$, and the transformed state $\mathbf{z} = \mathbf{V}^{-1}\mathbf{x}$ obeys

$$\dot{\mathbf{z}} = \boldsymbol{\Lambda}\mathbf{z} \quad\Longleftrightarrow\quad \dot{z}_i = \lambda_i z_i, \qquad z_i(t) = e^{\lambda_i t}z_i(0).$$

The coupled system of $n$ equations has become $n$ scalar equations that do not talk to each other. The coordinates $z_i$ are the **modal coordinates**, and each $z_i(t)$ is a **mode** of the system. Converting back with $\mathbf{x} = \mathbf{V}\mathbf{z}$,

$$\mathbf{x}(t) = \sum_{i=1}^{n} z_i(0)\,e^{\lambda_i t}\,\mathbf{v}_i, \qquad \mathbf{z}(0) = \mathbf{V}^{-1}\mathbf{x}(0).$$

This is the whole solution of $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$, and it is the same matrix $e^{\mathbf{A}t} = \mathbf{V}e^{\boldsymbol{\Lambda}t}\mathbf{V}^{-1}$ as Lesson 2, read term by term. Every trajectory is a sum of fixed shapes $\mathbf{v}_i$, each growing or decaying at its own rate $e^{\lambda_i t}$, with weights set once by the initial condition. Nothing transfers between modes. If you start exactly on an eigenvector, you stay on it forever.

::: example The damped oscillator, mode by mode
For $\mathbf{A} = \begin{pmatrix} 0 & 1 \\ -2 & -3 \end{pmatrix}$ with $\mathbf{x} = (y, \dot{y})^\mathsf{T}$, Lesson 2 found $\mathbf{V} = \begin{pmatrix} 1 & 1 \\ -1 & -2 \end{pmatrix}$, $\mathbf{V}^{-1} = \begin{pmatrix} 2 & 1 \\ -1 & -1 \end{pmatrix}$ and $\boldsymbol{\Lambda} = \operatorname{diag}(-1, -2)$. Release the system from $\mathbf{x}(0) = (1, 0)^\mathsf{T}$: unit displacement, at rest. The modal initial condition is $\mathbf{z}(0) = \mathbf{V}^{-1}\mathbf{x}(0) = (2, -1)^\mathsf{T}$, so

$$\mathbf{x}(t) = 2e^{-t}\begin{pmatrix} 1 \\ -1 \end{pmatrix} - e^{-2t}\begin{pmatrix} 1 \\ -2 \end{pmatrix}, \qquad y(t) = 2e^{-t} - e^{-2t}.$$

At $t = 0.5\,\mathrm{s}$: $z_1 = 2e^{-0.5} = 1.213$, $z_2 = -e^{-1} = -0.368$, and $\mathbf{x} = 1.213\,(1, -1)^\mathsf{T} - 0.368\,(1, -2)^\mathsf{T} = (0.845, -0.477)^\mathsf{T}$, matching the first column of $e^{0.5\mathbf{A}}$ from Lesson 2 exactly. Physically: the initial state is a mixture of two shapes. The $\mathbf{v}_2$ shape, with velocity twice the displacement and opposite in sign, is the fast mode and is gone within about two seconds; the $\mathbf{v}_1$ shape decays with time constant $1\,\mathrm{s}$ and is all that is left after that. Every damped second-order system with real eigenvalues behaves this way — a brief fast transient, then a slow exponential approach — and the slow eigenvalue is the one that sets the settling time.

Kick it instead with $\mathbf{x}(0) = (0, 1)^\mathsf{T}$, unit velocity at zero displacement. Then $\mathbf{z}(0) = (1, -1)^\mathsf{T}$ and $y(t) = e^{-t} - e^{-2t}$, which rises to a peak of $0.25$ at $t = \ln 2 = 0.693\,\mathrm{s}$ and then decays. Same modes, same rates, different weights.
:::

## Reading an eigenvalue

Each eigenvalue is a number with units of $\mathrm{s^{-1}}$, and its position in the complex plane is a complete description of what its mode does.

**Real $\lambda = \sigma$.** The mode is $e^{\sigma t}$. For $\sigma < 0$ it decays with **time constant** $\tau = -1/\sigma$: after one $\tau$ the mode is at $e^{-1} = 36.8\,\%$ of its start, after $3\tau$ at $5\,\%$, after $4.6\tau$ at $1\,\%$. For $\sigma > 0$ it grows, doubling every $\ln 2/\sigma$. For $\sigma = 0$ it sits still, which is what a pure integrator does.

**Complex pair $\lambda = \sigma \pm i\omega$.** For a real $\mathbf{A}$ the eigenvectors are conjugates too, and the two complex modes $e^{(\sigma \pm i\omega)t}$ combine into a real motion

$$e^{\sigma t}\left(\mathbf{a}\cos\omega t + \mathbf{b}\sin\omega t\right),$$

with real vectors $\mathbf{a}$ and $\mathbf{b}$ fixed by the initial condition. It is an oscillation at angular frequency $\omega$ — the **damped frequency**, with period $2\pi/\omega$ — inside an exponential envelope $e^{\sigma t}$ whose time constant is again $-1/\sigma$. The real part says how fast the envelope shrinks; the imaginary part says how fast the state goes round. Control engineers repackage the same pair as a **natural frequency** $\omega_n = |\lambda| = \sqrt{\sigma^2 + \omega^2}$ and a **damping ratio** $\zeta = -\sigma/|\lambda|$, so that $\lambda = -\zeta\omega_n \pm i\omega_n\sqrt{1 - \zeta^2}$. A purely imaginary pair ($\sigma = 0$, $\zeta = 0$) oscillates forever at constant amplitude — the undamped pendulum and the rotation of Lesson 1.

::: example An attitude loop
A single-axis attitude controller applies torque proportional to angle error and rate, giving $\ddot{\theta} = -4\theta - \dot{\theta}$ in suitable units, so with $\mathbf{x} = (\theta, \dot{\theta})^\mathsf{T}$,

$$\mathbf{A} = \begin{pmatrix} 0 & 1 \\ -4 & -1 \end{pmatrix}, \qquad \lambda^2 + \lambda + 4 = 0, \qquad \lambda = -0.5 \pm 1.936\,i\ \mathrm{s^{-1}}.$$

The envelope has time constant $\tau = 1/0.5 = 2\,\mathrm{s}$; the oscillation has damped period $2\pi/1.936 = 3.24\,\mathrm{s}$; $\omega_n = |\lambda| = \sqrt{0.25 + 3.75} = 2\,\mathrm{rad/s}$ and $\zeta = 0.5/2 = 0.25$. So a pointing error will ring at about $0.3\,\mathrm{Hz}$ and its amplitude will fall by a factor of $e^{-5} = 0.0067$ in ten seconds — three or four visible overshoots before it is within one percent. The eigenvector for $\lambda$ is $(1, \lambda)^\mathsf{T}$, as always for a matrix of this form, and it is complex: there is no real direction the state can sit on without turning, which is what oscillation means in the phase plane.

Change units to milliradians per second for the rate, $\mathbf{P} = \operatorname{diag}(1, 1000)$, and the matrix becomes $\mathbf{P}^{-1}\mathbf{A}\mathbf{P} = \begin{pmatrix} 0 & 0.001 \\ -4000 & -1 \end{pmatrix}$. It looks badly scaled and it is — a topic for Lesson 10 — but its trace is still $-1$, its determinant still $4$, and its eigenvalues still $-0.5 \pm 1.936\,i\ \mathrm{s^{-1}}$.
:::

## Stability

Put the pieces together. Every solution of $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ is a sum of modes $e^{\lambda_i t}$ times fixed vectors (with $t^k e^{\lambda t}$ terms if $\mathbf{A}$ is defective, which does not change the conclusion). Each mode has magnitude $|e^{\lambda_i t}| = e^{\operatorname{Re}(\lambda_i)\,t}$. So every solution decays to zero, from every initial condition, exactly when every real part is negative. The system is then **asymptotically stable**. If any eigenvalue has a positive real part, the corresponding mode grows without bound and the system is **unstable** — it does not matter how many of the other eigenvalues are comfortably negative, because a nonzero weight on the growing mode is enough, and round-off alone will supply one. Eigenvalues exactly on the imaginary axis, with the rest in the left half-plane, give a **marginally stable** system that neither decays nor grows: an undamped oscillation, or an integrator holding a constant.

::: key Stability of a continuous-time LTI system
$\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ is asymptotically stable if and only if every eigenvalue of $\mathbf{A}$ has strictly negative real part, $\operatorname{Re}\lambda_i < 0$ for all $i$. Any eigenvalue on or to the right of the imaginary axis destroys stability. Because eigenvalues survive similarity, this verdict does not depend on the frame or the units the states are written in.
:::

Two refinements matter in practice. First, the long-run behaviour of a stable system is set by its **slowest mode**, the eigenvalue with real part closest to zero; every other mode has already vanished by the time it matters, so settling time is roughly $4.6/|\operatorname{Re}\lambda_{\text{slow}}|$ to one percent. Second, for an unstable system the dangerous eigenvalue is often the *smallest* positive one. Suppose $\mathbf{A}$ has eigenvalues $-2$ and $+0.005\,\mathrm{s^{-1}}$. In a two-second simulation the $-2$ mode collapses to $e^{-4} = 1.8\,\%$ and the unstable mode has grown by a factor of $e^{0.01} = 1.01$: the plot looks like a healthy, well-damped system. But the unstable mode doubles every $\ln 2/0.005 = 139\,\mathrm{s}$; after ten minutes it is $e^{3} = 20$ times its initial size, and after twenty minutes $e^{6} = 403$ times. Slow instabilities are the kind that pass a short test and fail on orbit. Always look at the eigenvalues, not only at the time histories.

::: warning A two-by-two shortcut, and its limits
For a $2\times 2$ matrix the characteristic polynomial is $\lambda^2 - \operatorname{tr}(\mathbf{A})\lambda + \det(\mathbf{A})$, and both roots have negative real part exactly when $\operatorname{tr}\mathbf{A} < 0$ and $\det\mathbf{A} > 0$ — the sum of the roots is negative and their product positive. This is a fast check for a second-order loop. It does not generalise: a $3\times 3$ matrix with negative trace and negative determinant (three real roots, sum negative, product negative) can still have two positive eigenvalues and one large negative one. For $n \ge 3$ compute the eigenvalues or use a Routh–Hurwitz table.
:::

::: warning Discrete time is a different picture
A filter or a digital controller propagates with $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k$, and after $k$ steps the modes are $\mu_i^k$ where $\mu_i$ are the eigenvalues of $\boldsymbol{\Phi}$. They decay when $|\mu_i| < 1$: stability in discrete time means eigenvalues **inside the unit circle**, not in the left half-plane. The two pictures agree, because $\boldsymbol{\Phi} = e^{\mathbf{A}\Delta t}$ has eigenvalues $\mu_i = e^{\lambda_i\Delta t}$ with $|\mu_i| = e^{\operatorname{Re}(\lambda_i)\Delta t}$, which is less than one exactly when $\operatorname{Re}\lambda_i < 0$. For the attitude loop above with $\Delta t = 0.1\,\mathrm{s}$, $|\mu| = e^{-0.05} = 0.951$: each step shrinks the envelope by about five percent. Applying the left-half-plane test to a $\boldsymbol{\Phi}$ matrix is a common and silent error.
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
Matrices $\mathbf{A} = \begin{pmatrix} 1 & 2 \\ 0 & 3 \end{pmatrix}$ and $\mathbf{B} = \begin{pmatrix} 3 & 0 \\ 5 & 1 \end{pmatrix}$ are claimed to be similar. Is the claim consistent with the invariants, and are they in fact similar?
:::

::: answer
Both are triangular, so their eigenvalues are their diagonals: $\{1, 3\}$ in each case. Trace $4$, determinant $3$, characteristic polynomial $\lambda^2 - 4\lambda + 3$ for both, so the invariants are consistent. They are indeed similar: each has two distinct eigenvalues, so each is diagonalisable, $\mathbf{A} = \mathbf{V}_A\operatorname{diag}(1,3)\mathbf{V}_A^{-1}$ and $\mathbf{B} = \mathbf{V}_B\operatorname{diag}(1,3)\mathbf{V}_B^{-1}$, and then $\mathbf{B} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}$ with $\mathbf{P} = \mathbf{V}_A\mathbf{V}_B^{-1}$. Matching invariants alone would not have proved it — $\begin{pmatrix} 1 & 1 \\ 0 & 1 \end{pmatrix}$ and $\mathbf{I}$ share every invariant and are not similar, because a matrix similar to $\mathbf{I}$ is $\mathbf{P}^{-1}\mathbf{I}\mathbf{P} = \mathbf{I}$ — but for distinct eigenvalues it is enough.
:::

::: check
A covariance matrix $\mathbf{P}^B$ is known in body axes, and you need it in inertial axes. Write the transformation, name the kind of similarity it is, and say what happens to its eigenvalues.
:::

::: answer
$\mathbf{P}^I = \mathbf{R}_I^B\,\mathbf{P}^B\,(\mathbf{R}_I^B)^\mathsf{T}$. Because $\mathbf{R}_I^B$ is orthogonal, $(\mathbf{R}_I^B)^\mathsf{T} = (\mathbf{R}_I^B)^{-1}$ and this is an orthogonal similarity. The eigenvalues are unchanged — the uncertainty ellipsoid has the same semi-axis lengths in every frame — and the matrix stays symmetric because orthogonal similarity preserves symmetry. Only the eigenvectors rotate, by $\mathbf{R}_I^B$, so the ellipsoid's axes are described in the new frame.
:::

::: check
A system has eigenvalues $-0.2 \pm 3i\ \mathrm{s^{-1}}$. Describe its free response: time constant, period, natural frequency, damping ratio, and how long until the amplitude is under one percent.
:::

::: answer
The envelope decays as $e^{-0.2t}$ with time constant $\tau = 5\,\mathrm{s}$. The oscillation has $\omega = 3\,\mathrm{rad/s}$ and period $2\pi/3 = 2.09\,\mathrm{s}$. The natural frequency is $\omega_n = \sqrt{0.04 + 9} = 3.01\,\mathrm{rad/s}$ and the damping ratio is $\zeta = 0.2/3.01 = 0.066$: lightly damped. One percent needs $e^{-0.2t} = 0.01$, so $t = \ln 100/0.2 = 23\,\mathrm{s}$, which is about eleven full oscillations. Stable, but it rings for a long time.
:::

::: check
Why can a two-second simulation of a system with eigenvalues $\{-5, -0.3, +0.002\}\ \mathrm{s^{-1}}$ look perfectly stable, and what is the actual verdict?
:::

::: answer
In two seconds the $-5$ mode falls to $e^{-10} \approx 4.5\times 10^{-5}$, the $-0.3$ mode to $e^{-0.6} = 0.55$, and the $+0.002$ mode grows only to $e^{0.004} = 1.004$: indistinguishable from constant on a plot dominated by the decaying transients. The verdict is unstable, because one eigenvalue has positive real part. The unstable mode doubles every $\ln 2/0.002 = 347\,\mathrm{s}$ and will dominate after a few thousand seconds — roughly one orbit. The eigenvalue test gives the answer in one line where the simulation misleads.
:::

::: check
The state transition matrix of a filter has eigenvalues $0.98$ and $1.02$. Is the propagation stable? What would the equivalent continuous-time eigenvalues be for $\Delta t = 1\,\mathrm{s}$?
:::

::: answer
Discrete-time stability needs every eigenvalue of $\boldsymbol{\Phi}$ inside the unit circle. $|1.02| > 1$, so the propagation is unstable: that mode grows by two percent per step, doubling in $\ln 2/\ln 1.02 = 35$ steps. Since $\mu = e^{\lambda\Delta t}$, $\lambda = \ln\mu/\Delta t$: $\ln 0.98 = -0.0202\,\mathrm{s^{-1}}$ and $\ln 1.02 = +0.0198\,\mathrm{s^{-1}}$. The left-half-plane test on $\boldsymbol{\Phi}$'s eigenvalues would have said "both positive, both unstable", which is wrong for the first and right for the second by accident. Use the unit-circle test on $\boldsymbol{\Phi}$ and the half-plane test on $\mathbf{A}$.
:::

## Summary

| Item | Statement |
| --- | --- |
| Similarity | $\mathbf{B} = \mathbf{P}^{-1}\mathbf{A}\mathbf{P}$: same map, new basis $\mathbf{x} = \mathbf{P}\mathbf{z}$; $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} \Rightarrow \dot{\mathbf{z}} = \mathbf{B}\mathbf{z}$ |
| Preserved | eigenvalues (with multiplicity), characteristic polynomial, trace, determinant, rank; eigenvectors become $\mathbf{P}^{-1}\mathbf{v}$ |
| Not preserved | entries, symmetry, norms and angles — unless $\mathbf{P}$ is orthogonal |
| Frame change | $\mathbf{M}^A = \mathbf{R}_A^B\mathbf{M}^B(\mathbf{R}_A^B)^\mathsf{T}$, an orthogonal similarity; $\mathbf{R}[\mathbf{a}\times]\mathbf{R}^\mathsf{T} = [(\mathbf{R}\mathbf{a})\times]$ |
| Unit change | diagonal $\mathbf{P}$: $b_{ij} = a_{ij}p_j/p_i$; eigenvalues of a dynamics matrix are always $\mathrm{s^{-1}}$ |
| Modal coordinates | $\mathbf{z} = \mathbf{V}^{-1}\mathbf{x}$, $\dot{z}_i = \lambda_i z_i$, $\mathbf{x}(t) = \sum_i z_i(0)e^{\lambda_i t}\mathbf{v}_i$ |
| Real $\lambda = \sigma$ | time constant $\tau = -1/\sigma$; doubling time $\ln 2/\sigma$ if $\sigma > 0$ |
| Complex $\sigma \pm i\omega$ | envelope $e^{\sigma t}$, period $2\pi/\omega$, $\omega_n = \lvert\lambda\rvert$, $\zeta = -\sigma/\lvert\lambda\rvert$ |
| Stability | asymptotically stable $\Leftrightarrow$ $\operatorname{Re}\lambda_i < 0$ for all $i$; slowest mode sets settling; small positive $\lambda$ is the silent failure |
| Discrete time | $\mathbf{x}_{k+1} = \boldsymbol{\Phi}\mathbf{x}_k$ stable $\Leftrightarrow$ $\lvert\mu_i\rvert < 1$; $\mu_i = e^{\lambda_i\Delta t}$ |

The next lesson restricts to symmetric matrices, where the similarity that diagonalises is always orthogonal: the eigenvalues are real, the eigenvectors are perpendicular, and $\mathbf{A} = \mathbf{Q}\boldsymbol{\Lambda}\mathbf{Q}^\mathsf{T}$. That is the spectral theorem, and every covariance and inertia matrix obeys it.
