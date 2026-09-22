---
id: l03-riccati-equations
title: The algebraic and differential Riccati equations
minutes: 18
covers:
  - The algebraic and differential Riccati equations
---

Both derivations in the previous lesson ended at the same place: a quadratic matrix equation for $\mathbf{P}$. That equation is where the computation happens. Everything a GNC engineer does with LQR — sizing wheels, scheduling gains along an ascent, closing a landing loop — reduces to solving it, usually several hundred times in a Monte Carlo campaign, and often on a processor that has to finish before the next control cycle.

This lesson treats the Riccati equation as an object. It has, in general, more than one solution, and only one of them is the controller you want; it has existence conditions worth being able to state; and it has three standard solution methods with very different failure modes. You will write one of them, because a Riccati solver is a hundred lines of arithmetic and knowing what is inside it is the difference between debugging a flight algorithm and re-running it hopefully.

The name is Jacopo Riccati's, from a scalar nonlinear differential equation he studied in the 1720s. The matrix version is the one that flies.

## The two equations

For the finite-horizon problem, $\mathbf{P}$ is a matrix function of time satisfying the **differential Riccati equation** (DRE),

$$
-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}, \qquad \mathbf{P}(t_f) = \mathbf{Q}_f,
$$

integrated backwards from the terminal time. For the infinite-horizon problem, $\mathbf{P}$ is a constant satisfying the **continuous algebraic Riccati equation** (CARE),

$$
\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q} = \mathbf{0}.
$$

::: key Continuous algebraic Riccati equation
$\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q} = \mathbf{0}$. Solve for the unique symmetric positive definite $\mathbf{P}$ that stabilizes the closed loop, then $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$.
:::

::: key Differential Riccati equation
$-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}$, integrated **backward** from $\mathbf{P}(t_f) = \mathbf{Q}_f$. Its steady state as the horizon grows is the CARE solution.
:::

Three of the four terms are linear in $\mathbf{P}$; the equation would be a Lyapunov equation without $-\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$. That one quadratic term is the whole difficulty and the whole content: it is the control authority buying down the cost, and its sign is what makes $\mathbf{P}$ bounded rather than growing without limit.

## Existence, and which solution is the right one

Two conditions make the infinite-horizon problem well posed, and both were named in the first lesson.

- $(\mathbf{A}, \mathbf{B})$ **stabilizable**: every unstable mode can be reached by the actuators. Without it, some mode diverges no matter what you do and every cost is infinite.
- $(\mathbf{A}, \mathbf{Q}^{1/2})$ **detectable**: every unstable mode is visible to the state penalty. Without it, a diverging mode is free and the "optimal" controller ignores it.

Under both, the CARE has a unique symmetric solution $\mathbf{P} \succeq 0$ for which $\mathbf{A} - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ is stable. That solution is the cost-to-go kernel, and $\mathbf{P} \succ 0$ strictly if $(\mathbf{A}, \mathbf{Q}^{1/2})$ is observable rather than merely detectable. Both conditions should be checked before the solver is called — on a real vehicle, a mode that is uncontrollable at one flight condition is a modelling bug about as often as it is physics.

"Unique **stabilizing** solution" is doing work in that sentence, because the CARE has other solutions. The quadratic term makes it a matrix quadratic, and a matrix quadratic has many roots.

::: example The scalar case has two roots, and one of them is a trap
Take $\dot x = ax + bu$ with $a = 0.4\,\mathrm{s^{-1}}$ (unstable), $b = 1$, $q = r = 1$. The CARE is $2ap - b^2p^2/r + q = 0$, an ordinary quadratic with roots

$$
p = \frac{r}{b^2}\Big(a \pm \sqrt{a^2 + b^2q/r}\Big) = 1.47703 \quad\text{or}\quad -0.67703 .
$$

| root | $p$ | $k = bp/r$ | closed loop $a - bk$ |
| --- | --- | --- | --- |
| $+$ | $1.47703$ | $1.47703$ | $-1.07703\,\mathrm{s^{-1}}$ |
| $-$ | $-0.67703$ | $-0.67703$ | $+1.07703\,\mathrm{s^{-1}}$ |

Both satisfy the equation exactly. Only the positive root gives a stable closed loop, and only the positive root is a cost — the negative one would say that flying from $x_0$ costs $-0.677\,x_0^2$, which is not a thing a nonnegative integrand can do. The two closed-loop values are $\mp\sqrt{a^2 + b^2q/r}$: a mirror pair about the origin, which is the scalar shadow of the Hamiltonian spectrum's mirror symmetry. A solver that picks the wrong root returns a controller that is exactly as unstable as the right one is stable, so the failure is loud rather than subtle — but only if you check.
:::

In $n$ dimensions there are up to $\binom{2n}{n}$ symmetric solutions, one for each way of choosing $n$ eigenvalues of the Hamiltonian matrix from its $n$ mirror pairs. Choosing all $n$ stable ones gives the stabilizing solution. That observation is not commentary; it is an algorithm.

## Method 1: the Hamiltonian eigen-decomposition

Recall the Hamiltonian matrix

$$
\mathbf{M} = \begin{bmatrix}\mathbf{A} & -\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\\ -\mathbf{Q} & -\mathbf{A}^\top\end{bmatrix},
$$

whose spectrum is symmetric about the imaginary axis and, under stabilizability and detectability, has no eigenvalue on it. Let the columns of $\begin{bmatrix}\mathbf{X}\\ \mathbf{Y}\end{bmatrix} \in \mathbb{C}^{2n\times n}$ span the invariant subspace of the $n$ stable eigenvalues, so that

$$
\mathbf{M}\begin{bmatrix}\mathbf{X}\\ \mathbf{Y}\end{bmatrix} = \begin{bmatrix}\mathbf{X}\\ \mathbf{Y}\end{bmatrix}\boldsymbol{\Lambda}_s,
$$

with $\boldsymbol{\Lambda}_s$ carrying the stable eigenvalues. Write out the two block rows:

$$
\mathbf{A}\mathbf{X} - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{Y} = \mathbf{X}\boldsymbol{\Lambda}_s,
\qquad
-\mathbf{Q}\mathbf{X} - \mathbf{A}^\top\mathbf{Y} = \mathbf{Y}\boldsymbol{\Lambda}_s .
$$

$\mathbf{X}$ is invertible for this subspace, so set $\mathbf{P} = \mathbf{Y}\mathbf{X}^{-1}$. Multiply the first equation by $\mathbf{P}$ on the left, subtract the second, and use $\mathbf{Y} = \mathbf{P}\mathbf{X}$:

$$
\mathbf{P}\mathbf{A}\mathbf{X} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{X} + \mathbf{Q}\mathbf{X} + \mathbf{A}^\top\mathbf{P}\mathbf{X} = \mathbf{P}\mathbf{X}\boldsymbol{\Lambda}_s - \mathbf{P}\mathbf{X}\boldsymbol{\Lambda}_s = \mathbf{0}.
$$

Right-multiply by $\mathbf{X}^{-1}$ and the CARE appears. Better still, the first block row now reads $(\mathbf{A} - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P})\mathbf{X} = \mathbf{X}\boldsymbol{\Lambda}_s$, so the closed-loop matrix is similar to $\boldsymbol{\Lambda}_s$: **the closed-loop poles are exactly the stable eigenvalues of $\mathbf{M}$**, known before $\mathbf{P}$ is ever formed.

Here is the whole solver.

```python
import numpy as np


def care(A, B, Q, R):
    """Stabilizing solution of A'P + PA - P B inv(R) B' P + Q = 0."""
    n = A.shape[0]
    H = np.block([[A, -B @ np.linalg.solve(R, B.T)],
                  [-Q, -A.T]])
    w, V = np.linalg.eig(H)
    stable = V[:, np.argsort(w.real)[:n]]
    X, Y = stable[:n], stable[n:]
    P = np.real(Y @ np.linalg.inv(X))
    return 0.5 * (P + P.T)


A = np.array([[0.0, 1.0, 0.0], [0.0, 0.0, 1 / 120], [0.0, 0.0, -20.0]])
B = np.array([[0.0], [0.0], [20.0]])
Q = np.diag([13131.2254, 820.701588, 0.015625])
R = np.array([[0.015625]])

P = care(A, B, Q, R)
K = np.linalg.solve(R, B.T @ P)
res = A.T @ P + P @ A - P @ B @ np.linalg.solve(R, B.T @ P) + Q
print("K       =", " ".join("%.4f" % v for v in K.ravel()))
print("residual=", "%.1e" % np.abs(res).max())
print("poles   =", np.round(np.linalg.eigvals(A - B @ K), 4))

# K       = 916.7325 634.3388 0.5902
# residual= 4.0e-11
# poles   = [-28.2526+0.j      -1.7753+1.5021j  -1.7753-1.5021j]
```

Production solvers replace the eigen-decomposition with an ordered real Schur decomposition, for one reason: when $\mathbf{M}$ has repeated or nearly repeated eigenvalues its eigenvector matrix is ill-conditioned, and $\mathbf{X}^{-1}$ amplifies that conditioning into the answer. The Schur form spans the same invariant subspace with an orthogonal basis and never needs eigenvectors. The mathematics above is identical; only the numerical linear algebra changes.

## Method 2: integrate the differential equation backwards

Set $\mathbf{P}(t_f) = \mathbf{Q}_f$ and march the DRE backwards. It is convenient to reparametrise by **time-to-go** $s = t_f - t$, which turns the backward problem into a forward one:

$$
\frac{d\mathbf{P}}{ds} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}, \qquad \mathbf{P}(0) = \mathbf{Q}_f,
$$

and hand it to a Runge–Kutta integrator. With $\mathbf{Q}_f \succeq 0$ the solution stays symmetric positive semidefinite and increases monotonically in the matrix sense, and it converges to the CARE solution as $s$ grows. How fast? The error decays like $e^{-2|\mathrm{Re}\,\mu_{\min}|\,s}$, where $\mu_{\min}$ is the *slowest* closed-loop pole — twice the closed-loop decay rate, because $\mathbf{P}$ is a quadratic form and the error is transported by the closed-loop transition matrix on both sides.

This method is slow compared with an eigen-decomposition and is never how an infinite-horizon gain is computed in practice. Its value is elsewhere: it is the only one of the three that produces the *finite-horizon* schedule $\mathbf{P}(t)$, which is what trajectory-stabilizing controllers need, and it is the method that generalises to a time-varying plant where there is no algebraic equation to solve.

## Method 3: Newton's method (Kleinman iteration)

Start from any **stabilizing** gain $\mathbf{K}_0$ — pole placement will do — and repeat:

1. Solve the Lyapunov equation $(\mathbf{A} - \mathbf{B}\mathbf{K}_i)^\top\mathbf{P}_i + \mathbf{P}_i(\mathbf{A} - \mathbf{B}\mathbf{K}_i) + \mathbf{Q} + \mathbf{K}_i^\top\mathbf{R}\mathbf{K}_i = \mathbf{0}$.
2. Set $\mathbf{K}_{i+1} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}_i$.

Step 1 evaluates the cost of the current gain — the identity from the first lesson. Step 2 is one step of policy improvement: given that cost-to-go, pick the control that is greedy with respect to it. This is Newton's method applied to the CARE, and it inherits Newton's behaviour: every iterate is stabilizing, the sequence $\mathbf{P}_i$ decreases monotonically towards $\mathbf{P}$, and convergence is quadratic once you are close. It is also, recognisably, policy iteration, which is why reinforcement learning literature keeps rediscovering it.

::: example Three methods on one plant, and the convergence you should see
Add a first-order wheel-torque lag to the attitude axis: states $\mathbf{x} = (\theta, \omega, T)$ with $T$ the delivered torque, time constant $\tau = 0.05\,\mathrm{s}$, $J = 120\,\mathrm{kg\,m^2}$:

$$
\mathbf{A} = \begin{bmatrix}0 & 1 & 0\\ 0 & 0 & 1/120\\ 0 & 0 & -20\end{bmatrix},\qquad
\mathbf{B} = \begin{bmatrix}0\\0\\20\end{bmatrix},\qquad
\mathbf{Q} = \mathrm{diag}\big(1.3131\times10^4,\ 820.70,\ 1.5625\times10^{-2}\big),\quad R = 1.5625\times10^{-2}.
$$

**Hamiltonian route.** Its six eigenvalues are $\pm 28.2526$ and $\pm 1.7753 \pm 1.5021j\,\mathrm{s^{-1}}$ — three mirror pairs, none on the imaginary axis. Taking the three with negative real part gives

$$
\mathbf{K} = (916.73,\ 634.34,\ 0.5902), \qquad \text{CARE residual } 4\times10^{-11},
$$

and closed-loop poles equal to those three stable eigenvalues, as the derivation promised. Note $k_1 = 916.73$, identical to the two-state design of the first lesson. That is not luck: whenever the first state is a pure integrator of the second, the $(1,1)$ entry of the CARE reduces to $q_1 - (\mathbf{B}^\top\mathbf{P})_1^2/R = 0$, so $k_1 = \sqrt{q_1/R} = \sqrt{13131.2/0.015625} = 916.73$ whatever the rest of the plant does.

**Newton route.** From a deliberately poor stabilizing start, $\mathbf{K}_0 = (50,\ 30,\ 1)$ with poles at $-0.060 \pm 0.453j$ and $-39.9$:

| iteration | $\|\mathbf{P}_i - \mathbf{P}\|_{\max}$ | CARE residual |
| --- | --- | --- |
| $0$ | $2.65\times10^{5}$ | $7.91\times10^{7}$ |
| $4$ | $3.66\times10^{4}$ | $3.07\times10^{5}$ |
| $7$ | $2.22\times10^{3}$ | $3.29\times10^{3}$ |
| $8$ | $2.27\times10^{2}$ | $3.02\times10^{2}$ |
| $9$ | $2.91$ | $3.83$ |
| $10$ | $4.92\times10^{-4}$ | $6.46\times10^{-4}$ |
| $11$ | $3.5\times10^{-11}$ | $1.9\times10^{-11}$ |

The last four residuals go $10^{2}$, $10^{0}$, $10^{-4}$, $10^{-11}$: the error squares each step, which is what quadratic convergence looks like. The first eight iterations are the slow global phase; starting from a better guess, $\mathbf{K}_0 = (400, 400, 2)$, the same code reaches machine precision in five.

**Backward integration route.** From $\mathbf{P}(t_f) = \mathbf{0}$, the distance to the steady-state solution against time-to-go:

| $s$ (s) | $0.25$ | $0.5$ | $1.0$ | $2.0$ | $3.0$ | $4.0$ | $5.0$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $\|\mathbf{P}(s) - \mathbf{P}_\infty\|_{\max}$ | $5.81\times10^{3}$ | $2.86\times10^{3}$ | $5.30\times10^{2}$ | $4.26\times10^{1}$ | $4.18\times10^{-1}$ | $3.58\times10^{-2}$ | $3.40\times10^{-4}$ |

Fitting an exponential between $s = 2\,\mathrm{s}$ and $s = 4\,\mathrm{s}$ gives a decay rate of $3.540\,\mathrm{s^{-1}}$. The slowest closed-loop pole has $\mathrm{Re} = -1.7753\,\mathrm{s^{-1}}$, so $2|\mathrm{Re}| = 3.551\,\mathrm{s^{-1}}$ — agreement to $0.3\,\%$. The gain schedule settles on the same timescale: at $s = 1\,\mathrm{s}$, $\mathbf{K} = (875.1,\ 585.6,\ 0.576)$, and by $s = 4\,\mathrm{s}$ it is $(916.73,\ 634.34,\ 0.5902)$ to six digits. **A horizon of about four slow time constants is indistinguishable from an infinite one.**
:::

## Checking a solution you were handed

A Riccati solve is a black box in every flight toolchain, and the checks are cheap. Given a returned $\mathbf{P}$:

- **Residual.** Form $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}$ and compare its largest entry with the largest entry of $\mathbf{Q}$. A relative residual near machine precision is healthy; $10^{-6}$ relative says the problem is badly scaled.
- **Symmetry.** $\|\mathbf{P} - \mathbf{P}^\top\|$ should be at round-off. Symmetrising with $\tfrac12(\mathbf{P}+\mathbf{P}^\top)$ hides a problem rather than fixing it, so check before you symmetrise.
- **Positive definiteness.** All eigenvalues of $\mathbf{P}$ strictly positive under observability. In the worked example they are $3.25\times10^{-4}$, $893.5$ and $9998$ — a condition number of $3\times10^{7}$, which is the price of weighting three states whose budgets span six orders of magnitude.
- **Closed-loop stability.** Eigenvalues of $\mathbf{A} - \mathbf{B}\mathbf{K}$ strictly in the left half plane. This is the one that catches a wrong-root solver.

::: warning Bad scaling shows up in the Riccati solve first
The Hamiltonian matrix mixes $\mathbf{A}$, $\mathbf{Q}$ and $\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top$ in one array. In the example above those blocks contain entries of order $10^{-2}$, $10^{4}$ and $10^{4}$ at once, and if the state units were metres beside microradians the spread would be far worse. An eigen-decomposition of a matrix whose entries span twelve decades loses most of its digits. The cure is non-dimensionalisation, not a better solver: rescale states by their budgets and inputs by their limits, so $\mathbf{Q}$ and $\mathbf{R}$ come out near the identity and $\mathbf{A}$ near order one, solve, then transform the gain back. If $\mathbf{T}$ is the scaling with $\mathbf{x} = \mathbf{T}\tilde{\mathbf{x}}$, the scaled plant is $\mathbf{T}^{-1}\mathbf{A}\mathbf{T}$ and the recovered gain is $\tilde{\mathbf{K}}\mathbf{T}^{-1}$.
:::

::: example The double integrator, in closed form
It is worth being able to write this one from memory, because it is the answer to half the whiteboard questions in the subject. With $\mathbf{A} = \begin{bmatrix}0&1\\0&0\end{bmatrix}$, $\mathbf{B} = (0,\ 1/J)^\top$, $\mathbf{Q} = \mathrm{diag}(q_1, q_2)$ and $R = r$, write $\mathbf{P} = \begin{bmatrix}p_{11} & p_{12}\\ p_{12} & p_{22}\end{bmatrix}$ and take the three distinct entries of the CARE in turn.

The $(1,1)$ entry: $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A}$ contributes nothing there, so $-p_{12}^2/(rJ^2) + q_1 = 0$ and

$$
p_{12} = J\sqrt{q_1 r}.
$$

The $(2,2)$ entry: $2p_{12} - p_{22}^2/(rJ^2) + q_2 = 0$, so

$$
p_{22} = J\sqrt{r\big(q_2 + 2J\sqrt{q_1 r}\big)} .
$$

The $(1,2)$ entry: $p_{11} - p_{12}p_{22}/(rJ^2) = 0$ gives $p_{11}$. The gain is $\mathbf{K} = R^{-1}\mathbf{B}^\top\mathbf{P} = (p_{12},\ p_{22})/(rJ)$, that is

$$
k_1 = \sqrt{\frac{q_1}{r}}, \qquad k_2 = \sqrt{\frac{q_2 + 2J\sqrt{q_1 r}}{r}} .
$$

$k_1$ does not depend on the inertia at all: the $1/J$ in $\mathbf{B}$ cancels the $J$ in $p_{12}$. With the attitude-axis numbers $q_1 = 1.3131\times10^4$, $q_2 = 820.70$, $r = 1.5625\times10^{-2}$, $J = 120$:

$$
p_{12} = 1718.87,\quad p_{22} = 978.85,\quad p_{11} = 7477.88,\qquad \mathbf{K} = (916.732,\ 522.054),
$$

matching the numerical solver to every digit, with poles $-2.1752 \pm 1.7052j$.

Two special cases worth carrying. With $q_2 = 0$ — penalise position and control only — $k_2 = \sqrt{2J}\,(q_1/r)^{1/4}$, and for $J = q_1 = r = 1$ that is $\mathbf{K} = (1,\ \sqrt2)$ with poles at $-\tfrac{1}{\sqrt2}(1 \pm j)$: damping ratio $0.707$ exactly, the Butterworth pair. With $\mathbf{Q} = \mathbf{I}$ and $J = r = 1$ instead, $k_2 = \sqrt{1 + 2} = \sqrt3$. The two are often confused; the difference is entirely whether the rate state carries weight.
:::

## Check yourself

::: check
A colleague's CARE solver returns a $\mathbf{P}$ with residual $10^{-14}$ but the closed loop has a pole at $+3.2\,\mathrm{s^{-1}}$. What happened, and how would you fix it without changing solvers?
:::

::: answer
The solver found a solution of the algebraic equation that is not the stabilizing one — it selected an invariant subspace containing at least one unstable Hamiltonian eigenvalue. The residual is tiny because that matrix genuinely solves the equation; the residual test cannot distinguish the roots, which is why the closed-loop eigenvalue check is a separate item on the list. The fix is in the selection step: sort the Hamiltonian eigenvalues by real part and take the $n$ most negative, and if any eigenvalue has real part within round-off of zero, stop and check stabilizability and detectability, because the clean split the method relies on does not exist. A symptom of exactly this is $\mathbf{P}$ failing the positive-semidefinite check, since the non-stabilizing roots are indefinite.
:::

::: check
Why does the backward Riccati sweep converge at twice the slowest closed-loop decay rate rather than at that rate?
:::

::: answer
Write $\mathbf{P}(s) = \mathbf{P}_\infty + \boldsymbol{\Delta}(s)$ and substitute into the time-to-go form. The terms involving $\mathbf{P}_\infty$ alone cancel by the CARE, and dropping the term quadratic in $\boldsymbol{\Delta}$ leaves $\dot{\boldsymbol{\Delta}} = \mathbf{A}_{cl}^\top\boldsymbol{\Delta} + \boldsymbol{\Delta}\mathbf{A}_{cl}$ with $\mathbf{A}_{cl} = \mathbf{A} - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}_\infty$. Its solution is $\boldsymbol{\Delta}(s) = e^{\mathbf{A}_{cl}^\top s}\boldsymbol{\Delta}(0)e^{\mathbf{A}_{cl}s}$, so the closed-loop transition matrix acts on both sides and each contributes one factor of the decay: the error falls like $e^{2\mathrm{Re}(\mu_{\min})s}$, dominated by the slowest mode. The measured $3.540\,\mathrm{s^{-1}}$ against a predicted $2 \times 1.7753 = 3.551\,\mathrm{s^{-1}}$ confirms it. Note the practical consequence: a slow closed-loop mode means you need a long horizon before finite-horizon and infinite-horizon gains agree.
:::

::: check
Kleinman's iteration needs a stabilizing $\mathbf{K}_0$. What breaks if you start from a non-stabilizing one, and where could such a $\mathbf{K}_0$ come from on a real vehicle?
:::

::: answer
Step 1 solves a Lyapunov equation for the cost of the current gain, and that cost is only finite when the loop is stable. With an unstable $\mathbf{A} - \mathbf{B}\mathbf{K}_0$ the Lyapunov equation still returns a matrix, because it is a linear system that is solvable whenever no two eigenvalues of $\mathbf{A} - \mathbf{B}\mathbf{K}_0$ sum to zero, but that matrix is indefinite and is not a cost-to-go. The iteration then has no monotonicity to rely on and typically wanders or diverges. On a vehicle the natural starting gain is the previous flight condition's gain in a scheduled design, and that is exactly the case where it can fail: a gain that stabilized the plant at Mach 0.8 may not stabilize it at Mach 2.5. The defence is to check the eigenvalues of $\mathbf{A} - \mathbf{B}\mathbf{K}_0$ before iterating, and fall back on the Hamiltonian method, which needs no initial guess, when the check fails.
:::

::: check
For the double integrator, which weight would you change to double the closed-loop natural frequency, and by how much?
:::

::: answer
The closed-loop characteristic polynomial is $s^2 + (k_2/J)s + k_1/J$, so $\omega_n = \sqrt{k_1/J}$. Substituting $k_1 = \sqrt{q_1/r}$ gives $\omega_n = (q_1/r)^{1/4}/\sqrt{J}$. Doubling $\omega_n$ needs $q_1/r$ to grow by $2^4 = 16$. So multiply $q_1$ by $16$, or divide $r$ by $16$; the two are the same move. The fourth-root dependence is the single most useful number in LQR tuning: an order of magnitude in weight buys $10^{1/4} = 1.78$ in bandwidth, so tuning happens in decades, not percentages. Check with the worked numbers: $(13131.2/0.015625)^{1/4}/\sqrt{120} = 30.28/10.954 = 2.764\,\mathrm{s^{-1}}$, matching $|{-2.1752 \pm 1.7052j}| = 2.764\,\mathrm{s^{-1}}$.
:::

::: check
Explain why the CARE solution for the three-state plant had eigenvalues spanning $3\times10^{-4}$ to $10^{4}$, and whether that is a problem.
:::

::: answer
$\mathbf{P}$ inherits the scaling of $\mathbf{Q}$, and the three state budgets — $0.5^\circ$, $2^\circ/\mathrm{s}$ and $8\,\mathrm{N\,m}$ — produce diagonal weights of $1.3\times10^4$, $8.2\times10^2$ and $1.6\times10^{-2}$, a spread of six decades before the dynamics contribute anything. The resulting condition number of about $3\times10^7$ costs roughly seven of the sixteen digits of double precision in the Riccati solve, which is survivable here and would not be on a larger model. It is a scaling problem, not a modelling error: the same controller expressed in non-dimensional states has a well-conditioned $\mathbf{P}$. The habit worth forming is to solve in scaled coordinates as a matter of course and transform the gain back, so that the conditioning of the numerical problem never depends on which units the requirements document happened to use.
:::

## Summary

| Object | Statement |
| --- | --- |
| CARE | $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q} = \mathbf{0}$ |
| DRE | $-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}$, $\mathbf{P}(t_f) = \mathbf{Q}_f$, backward |
| Existence | $(\mathbf{A},\mathbf{B})$ stabilizable and $(\mathbf{A},\mathbf{Q}^{1/2})$ detectable give a unique stabilizing $\mathbf{P} \succeq 0$ |
| Non-uniqueness | Up to $\binom{2n}{n}$ symmetric solutions; only the all-stable eigenvalue choice is a cost |
| Hamiltonian method | $\mathbf{P} = \mathbf{Y}\mathbf{X}^{-1}$ from the stable invariant subspace; closed-loop poles are the stable eigenvalues of $\mathbf{M}$ |
| Backward sweep | Integrate in time-to-go from $\mathbf{Q}_f$; error decays as $e^{-2|\mathrm{Re}\,\mu_{\min}|s}$ |
| Kleinman iteration | Lyapunov solve, then $\mathbf{K}_{i+1} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}_i$; Newton, quadratic, needs a stabilizing start |
| Acceptance checks | Residual, symmetry, $\mathbf{P} \succ 0$, eigenvalues of $\mathbf{A}-\mathbf{B}\mathbf{K}$ |
| Double integrator | $p_{12} = J\sqrt{q_1r}$, $p_{22} = J\sqrt{r(q_2 + 2J\sqrt{q_1r})}$, $k_1 = \sqrt{q_1/r}$, $k_2 = \sqrt{(q_2 + 2J\sqrt{q_1r})/r}$ |
| Bandwidth scaling | $\omega_n = (q_1/r)^{1/4}/\sqrt{J}$: a factor $16$ in weight for a factor $2$ in bandwidth |
| Worked three-state | $\mathbf{K} = (916.73,\ 634.34,\ 0.590)$, poles $-28.25$, $-1.775 \pm 1.502j$, residual $4\times10^{-11}$ |

You can now compute the gain. The next lesson deals with the part that no solver does for you: choosing the $\mathbf{Q}$ and $\mathbf{R}$ that go into it.
