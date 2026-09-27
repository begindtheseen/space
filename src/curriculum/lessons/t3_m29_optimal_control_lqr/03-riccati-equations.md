---
id: l03-riccati-equations
title: The algebraic and differential Riccati equations
minutes: 21
covers:
  - The algebraic and differential Riccati equations
---

Both derivations in the previous lesson ended in the same place: a quadratic equation for the matrix $\mathbf{P}$. That equation is where the computing happens. Everything a GNC engineer does with LQR — sizing reaction wheels, scheduling gains along an ascent, closing a landing loop — comes down to solving it. Often it is solved hundreds of times in a **[[Monte Carlo|monte-carlo]]** campaign, and sometimes on a flight computer that must finish before the next control cycle.

Think of the quadratic equations from school, like $p^2 - 3p + 2 = 0$. They usually have two roots, and in a word problem only one of them makes physical sense — a length cannot be negative. The Riccati equation is the matrix version of that situation. It has, in general, several solutions, and only one of them is the controller you want. It has conditions under which the right solution exists. And it has three standard solution methods with very different ways of failing. You will write one of them here, because a Riccati solver is a hundred lines of arithmetic, and knowing what is inside it is the difference between debugging a flight algorithm and re-running it hopefully.

The name is **[[Jacopo Riccati's|riccati]]**, from a single-variable nonlinear differential equation he studied in the 1720s. The matrix version is the one that flies.

## The two equations

For the finite-horizon problem, $\mathbf{P}$ changes with time and obeys the **differential Riccati equation** (DRE),

$$
-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}, \qquad \mathbf{P}(t_f) = \mathbf{Q}_f,
$$

integrated backwards from the final time. For the infinite-horizon problem, $\mathbf{P}$ is a constant matrix, so $\dot{\mathbf{P}} = \mathbf{0}$ and it obeys the **continuous algebraic Riccati equation** (CARE, said "care"):

$$
\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q} = \mathbf{0}.
$$

::: key Continuous algebraic Riccati equation
$\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q} = \mathbf{0}$. Solve for the unique symmetric positive definite $\mathbf{P}$ that stabilizes the closed loop, then $\mathbf{K} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$.
:::

::: key Differential Riccati equation
$-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}$, integrated **backward** from $\mathbf{P}(t_f) = \mathbf{Q}_f$. Its steady state as the horizon grows is the CARE solution.
:::

Look at the four terms. Three are linear in $\mathbf{P}$; without the fourth, this would be the Lyapunov equation from the first lesson. That one quadratic term, $-\mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$, is the whole difficulty and the whole point. It is the control authority buying down the cost, and its minus sign is what keeps $\mathbf{P}$ bounded instead of growing forever.

## Existence, and which solution is the right one

Two conditions make the infinite-horizon problem well posed. Both appeared in the first lesson.

- $(\mathbf{A}, \mathbf{B})$ **stabilizable**: every unstable mode can be pushed on by the actuators. Without it, some mode runs away no matter what you do, and every cost is infinite.
- $(\mathbf{A}, \mathbf{Q}^{1/2})$ **detectable**: every unstable mode is visible to the state penalty. Without it, a runaway mode is free, and the "optimal" controller ignores it.

When both hold, the CARE has exactly one symmetric solution $\mathbf{P} \succeq 0$ for which the closed loop $\mathbf{A} - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}$ is stable. That solution is the cost-to-go matrix. It is strictly positive definite, $\mathbf{P} \succ 0$, when $(\mathbf{A}, \mathbf{Q}^{1/2})$ is observable rather than only detectable. Check both conditions before calling the solver. On a real vehicle, a mode that looks uncontrollable at one flight condition is a modeling bug about as often as it is physics.

The phrase "unique **stabilizing** solution" matters, because the CARE has other solutions. The quadratic term makes it a matrix quadratic, and a matrix quadratic has many roots.

::: example The scalar case has two roots, and one of them is a trap
Take $\dot x = ax + bu$ with $a = 0.4\,\mathrm{s^{-1}}$ (positive, so unstable on its own), $b = 1$, $q = r = 1$. With one state, the CARE is the ordinary quadratic $2ap - b^2p^2/r + q = 0$. The quadratic formula gives

$$
p = \frac{r}{b^2}\Big(a \pm \sqrt{a^2 + b^2q/r}\Big) = 0.4 \pm \sqrt{0.16 + 1} = 0.4 \pm 1.07703,
$$

so $p = 1.47703$ or $p = -0.67703$.

| root | $p$ | $k = bp/r$ | closed loop $a - bk$ |
| --- | --- | --- | --- |
| $+$ | $1.47703$ | $1.47703$ | $-1.07703\,\mathrm{s^{-1}}$ |
| $-$ | $-0.67703$ | $-0.67703$ | $+1.07703\,\mathrm{s^{-1}}$ |

Both satisfy the equation exactly. Only the positive root gives a stable closed loop. And only the positive root can be a cost: the negative one would claim that flying from $x_0$ costs $-0.677\,x_0^2$, which a never-negative integrand cannot add up to. The two closed-loop values are $\mp\sqrt{a^2 + b^2q/r} = \mp 1.077$ — a [[mirror pair about zero|scalar-roots]], the one-state shadow of the Hamiltonian's mirror symmetry. A solver that picks the wrong root returns a controller exactly as unstable as the right one is stable. The failure is loud rather than subtle — but only if you check.
:::

In $n$ dimensions there can be many more solutions. Each one comes from choosing $n$ of the $2n$ eigenvalues of the Hamiltonian matrix, so there are at most $\binom{2n}{n}$ of them ("2n choose n"). The **symmetric** ones — the only kind that can be a cost matrix — come from picking one eigenvalue out of each of the $n$ mirror pairs, so there are at most $2^n$. Picking the stable member of every pair gives the stabilizing solution. That observation is not commentary; it is an algorithm.

## Method 1: the Hamiltonian eigen-decomposition

Recall the Hamiltonian matrix from the previous lesson:

$$
\mathbf{M} = \begin{bmatrix}\mathbf{A} & -\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\\ -\mathbf{Q} & -\mathbf{A}^\top\end{bmatrix}.
$$

Its eigenvalues are mirrored across the imaginary axis, and under stabilizability and detectability none lies on it. So exactly $n$ are stable. Collect $n$ eigenvectors for those stable eigenvalues as the columns of a tall $2n \times n$ matrix, and split it into a top half $\mathbf{X}$ and a bottom half $\mathbf{Y}$. The columns span the **[[invariant subspace|invariant-subspace]]** of the stable eigenvalues, which means

$$
\mathbf{M}\begin{bmatrix}\mathbf{X}\\ \mathbf{Y}\end{bmatrix} = \begin{bmatrix}\mathbf{X}\\ \mathbf{Y}\end{bmatrix}\boldsymbol{\Lambda}_s,
$$

where $\boldsymbol{\Lambda}_s$ ("capital lambda sub s") is the diagonal matrix of the stable eigenvalues. Then the answer is

$$
\mathbf{P} = \mathbf{Y}\mathbf{X}^{-1}.
$$

As a bonus, the closed-loop poles are exactly the stable eigenvalues of $\mathbf{M}$ — known before $\mathbf{P}$ is even formed.

::: note Why it has to be true
Write out the two block rows of the eigenvector equation:

$$
\mathbf{A}\mathbf{X} - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{Y} = \mathbf{X}\boldsymbol{\Lambda}_s,
\qquad
-\mathbf{Q}\mathbf{X} - \mathbf{A}^\top\mathbf{Y} = \mathbf{Y}\boldsymbol{\Lambda}_s .
$$

For this subspace $\mathbf{X}$ is invertible, so set $\mathbf{P} = \mathbf{Y}\mathbf{X}^{-1}$, that is $\mathbf{Y} = \mathbf{P}\mathbf{X}$. Multiply the first row by $\mathbf{P}$ on the left and subtract the second row:

$$
\mathbf{P}\mathbf{A}\mathbf{X} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}\mathbf{X} + \mathbf{Q}\mathbf{X} + \mathbf{A}^\top\mathbf{P}\mathbf{X} = \mathbf{P}\mathbf{X}\boldsymbol{\Lambda}_s - \mathbf{P}\mathbf{X}\boldsymbol{\Lambda}_s = \mathbf{0}.
$$

Multiply on the right by $\mathbf{X}^{-1}$ and the CARE appears. The first row, with $\mathbf{Y} = \mathbf{P}\mathbf{X}$, now reads $(\mathbf{A} - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P})\mathbf{X} = \mathbf{X}\boldsymbol{\Lambda}_s$. So the closed-loop matrix is similar to $\boldsymbol{\Lambda}_s$ and has exactly the stable eigenvalues.
:::

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

Production solvers replace the eigen-decomposition with an ordered real **[[Schur decomposition|schur]]**, for one reason. When $\mathbf{M}$ has repeated or nearly repeated eigenvalues, its eigenvectors are nearly parallel, and $\mathbf{X}^{-1}$ magnifies the resulting errors into the answer. The Schur form spans the same subspace with perpendicular basis vectors and never needs eigenvectors. The mathematics is identical; only the numerical linear algebra changes.

## Method 2: integrate the differential equation backwards

Set $\mathbf{P}(t_f) = \mathbf{Q}_f$ and march the DRE backwards. It is easier to use **time-to-go** $s = t_f - t$, the time left until the end, because that turns the backward problem into a forward one:

$$
\frac{d\mathbf{P}}{ds} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}, \qquad \mathbf{P}(0) = \mathbf{Q}_f,
$$

and hand it to a Runge–Kutta integrator. The solution stays symmetric and positive semidefinite, and it converges to the CARE solution as $s$ grows. Started from $\mathbf{Q}_f = \mathbf{0}$ it climbs steadily upward toward that solution; started from a very large $\mathbf{Q}_f$ it comes down to it instead.

How fast? The error shrinks like $e^{-2|\mathrm{Re}\,\mu_{\min}|\,s}$, where $\mu_{\min}$ is the *slowest* closed-loop pole — the one closest to the imaginary axis. That is **twice** the closed-loop decay rate, because $\mathbf{P}$ is a quadratic form, so the error gets squeezed by the closed-loop motion from both sides (the check questions work this out).

This method is slow next to an eigen-decomposition and is never how an infinite-horizon gain is computed in practice. Its value is elsewhere. It is the only one of the three that produces the *finite-horizon* schedule $\mathbf{P}(t)$, which trajectory-following controllers need. And it is the method that carries over to a time-varying plant, where there is no algebraic equation to solve.

## Method 3: Newton's method (Kleinman iteration)

Start from any gain $\mathbf{K}_0$ that **stabilizes** the loop — pole placement will do — and repeat two steps:

1. Solve the Lyapunov equation $(\mathbf{A} - \mathbf{B}\mathbf{K}_i)^\top\mathbf{P}_i + \mathbf{P}_i(\mathbf{A} - \mathbf{B}\mathbf{K}_i) + \mathbf{Q} + \mathbf{K}_i^\top\mathbf{R}\mathbf{K}_i = \mathbf{0}$.
2. Set $\mathbf{K}_{i+1} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}_i$.

Step 1 prices the current gain: it is the cost identity from the first lesson. Step 2 is one step of improvement: given that price list, pick the control that looks best against it. Think of a student who takes a practice test, reads the score sheet, fixes the worst habits, and takes the test again.

This is Newton's method applied to the CARE, and it behaves like Newton's method. Every iterate is stabilizing. The matrices $\mathbf{P}_i$ come down steadily toward $\mathbf{P}$. And once you are close, convergence is **quadratic**: the number of correct digits roughly doubles each step. It is also, recognizably, **[[policy iteration|policy-iteration]]**, which is why the reinforcement learning literature keeps rediscovering it.

::: example Three methods on one plant, and the convergence you should see
Add a wheel-torque lag to the attitude axis: the wheel does not deliver torque instantly but approaches the command with time constant $\tau = 0.05\,\mathrm{s}$. The states are $\mathbf{x} = (\theta, \omega, T)$, with $T$ the delivered torque, and $J = 120\,\mathrm{kg\,m^2}$:

$$
\mathbf{A} = \begin{bmatrix}0 & 1 & 0\\ 0 & 0 & 1/120\\ 0 & 0 & -20\end{bmatrix},\qquad
\mathbf{B} = \begin{bmatrix}0\\0\\20\end{bmatrix},\qquad
\mathbf{Q} = \mathrm{diag}\big(1.3131\times10^4,\ 820.70,\ 1.5625\times10^{-2}\big),\quad R = 1.5625\times10^{-2}.
$$

The $-20$ and $20$ are $\mp 1/\tau$.

**Hamiltonian route.** The six eigenvalues are $\pm 28.2526$ and $\pm 1.7753 \pm 1.5021j\,\mathrm{s^{-1}}$ — three mirror pairs, none on the imaginary axis. Taking the three with negative real part gives

$$
\mathbf{K} = (916.73,\ 634.34,\ 0.5902), \qquad \text{CARE residual } 4\times10^{-11},
$$

and closed-loop poles equal to those three stable eigenvalues, as promised. Notice $k_1 = 916.73$, the same as the two-state design of the first lesson. That is not luck. Nothing in this plant depends on $\theta$ (the first column of $\mathbf{A}$ is zero) and there is one input. Then the $(1,1)$ entry of the CARE reduces to $q_1 - (\mathbf{B}^\top\mathbf{P})_1^2/R = 0$, so $k_1 = \sqrt{q_1/R} = \sqrt{13131.2/0.015625} = 916.73$, whatever the rest of the plant does.

**Newton route.** Start from a deliberately poor stabilizing gain, $\mathbf{K}_0 = (50,\ 30,\ 1)$, with poles at $-0.060 \pm 0.453j$ and $-39.9$:

| iteration | $\|\mathbf{P}_i - \mathbf{P}\|_{\max}$ | CARE residual |
| --- | --- | --- |
| $0$ | $2.65\times10^{5}$ | $7.91\times10^{7}$ |
| $4$ | $3.66\times10^{4}$ | $3.07\times10^{5}$ |
| $7$ | $2.22\times10^{3}$ | $3.29\times10^{3}$ |
| $8$ | $2.27\times10^{2}$ | $3.02\times10^{2}$ |
| $9$ | $2.91$ | $3.83$ |
| $10$ | $4.92\times10^{-4}$ | $6.46\times10^{-4}$ |
| $11$ | about $10^{-11}$ | about $10^{-11}$ |

Read the last four residuals: $10^{2}$, $10^{0}$, $10^{-4}$, $10^{-11}$. The exponent roughly doubles each step — the error squares — which is what quadratic convergence looks like. Iteration 11 has hit round-off, the floor of double-precision arithmetic. The first eight iterations are the slow phase of getting close. Starting from a better guess, $\mathbf{K}_0 = (400, 400, 2)$, the same code reaches round-off in five.

**Backward integration route.** Start from $\mathbf{P}(t_f) = \mathbf{0}$ and measure the distance to the steady-state solution against time-to-go $s$:

| $s$ (s) | $0.25$ | $0.5$ | $1.0$ | $2.0$ | $3.0$ | $4.0$ | $5.0$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $\|\mathbf{P}(s) - \mathbf{P}_\infty\|_{\max}$ | $5.81\times10^{3}$ | $2.86\times10^{3}$ | $5.30\times10^{2}$ | $4.26\times10^{1}$ | $4.18\times10^{-1}$ | $3.58\times10^{-2}$ | $3.40\times10^{-4}$ |

Fit an exponential between $s = 2\,\mathrm{s}$ and $s = 4\,\mathrm{s}$: $\ln(42.6/0.0358)/2 = 3.540\,\mathrm{s^{-1}}$. The slowest closed-loop pole has real part $-1.7753\,\mathrm{s^{-1}}$, so the prediction is $2 \times 1.7753 = 3.551\,\mathrm{s^{-1}}$. They agree to $0.3\,\%$. The gains settle on the same timescale. At $s = 1\,\mathrm{s}$, $\mathbf{K} = (875.1,\ 585.6,\ 0.576)$; by $s = 4\,\mathrm{s}$ it is $(916.73,\ 634.34,\ 0.5902)$ to five significant figures. **A horizon of about four slow time constants is as good as an infinite one.**
:::

## Checking a solution you were handed

In every flight toolchain a Riccati solve is a black box, and the checks are cheap. Given a returned $\mathbf{P}$:

- **Residual.** Form $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}$ and compare its largest entry with the largest entry of $\mathbf{Q}$. A relative residual near machine precision is healthy; $10^{-6}$ relative says the problem is badly scaled.
- **Symmetry.** $\|\mathbf{P} - \mathbf{P}^\top\|$ should be at round-off. Averaging with $\tfrac12(\mathbf{P}+\mathbf{P}^\top)$ hides a problem rather than fixing it, so check before you average.
- **Positive definiteness.** All eigenvalues of $\mathbf{P}$ strictly positive when the problem is observable. In the worked example they are $3.25\times10^{-4}$, $893.5$ and $9998$ — a **[[condition number|condition-number]]** of $3\times10^{7}$, the price of weighting three states whose budgets span six orders of magnitude.
- **Closed-loop stability.** Eigenvalues of $\mathbf{A} - \mathbf{B}\mathbf{K}$ strictly in the left half plane. This is the check that catches a wrong-root solver.

::: warning Bad scaling shows up in the Riccati solve first
The Hamiltonian matrix puts $\mathbf{A}$, $\mathbf{Q}$ and $\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top$ in one array. In the example those blocks hold entries of order $10^{-2}$, $10^{4}$ and $10^{4}$ at once. If the states were meters beside microradians, the spread would be far worse, and an eigen-decomposition of a matrix whose entries span twelve powers of ten loses most of its digits. The cure is to remove the units, not to buy a better solver. Rescale states by their budgets and inputs by their limits, so $\mathbf{Q}$ and $\mathbf{R}$ come out near the identity and $\mathbf{A}$ near order one; solve; then transform the gain back. If $\mathbf{T}$ is the scaling, with $\mathbf{x} = \mathbf{T}\tilde{\mathbf{x}}$ ("x tilde", the scaled state), the scaled plant is $\mathbf{T}^{-1}\mathbf{A}\mathbf{T}$ and the recovered gain is $\tilde{\mathbf{K}}\mathbf{T}^{-1}$.
:::

::: example The double integrator, in closed form
Learn this one by heart. It answers half the whiteboard questions in the subject. Take $\mathbf{A} = \begin{bmatrix}0&1\\0&0\end{bmatrix}$, $\mathbf{B} = (0,\ 1/J)^\top$, $\mathbf{Q} = \mathrm{diag}(q_1, q_2)$ and $R = r$. Write $\mathbf{P} = \begin{bmatrix}p_{11} & p_{12}\\ p_{12} & p_{22}\end{bmatrix}$ and work through the three different entries of the CARE one at a time.

**The $(1,1)$ entry.** $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A}$ contributes nothing there, so $-p_{12}^2/(rJ^2) + q_1 = 0$ and

$$
p_{12} = J\sqrt{q_1 r}.
$$

**The $(2,2)$ entry.** $2p_{12} - p_{22}^2/(rJ^2) + q_2 = 0$, so

$$
p_{22} = J\sqrt{r\big(q_2 + 2J\sqrt{q_1 r}\big)} .
$$

**The $(1,2)$ entry.** $p_{11} - p_{12}p_{22}/(rJ^2) = 0$ gives $p_{11}$.

The gain is $\mathbf{K} = R^{-1}\mathbf{B}^\top\mathbf{P} = (p_{12},\ p_{22})/(rJ)$, that is

$$
k_1 = \sqrt{\frac{q_1}{r}}, \qquad k_2 = \sqrt{\frac{q_2 + 2J\sqrt{q_1 r}}{r}} .
$$

Notice that $k_1$ does not depend on the inertia at all: the $1/J$ in $\mathbf{B}$ cancels the $J$ in $p_{12}$. With the attitude-axis numbers $q_1 = 1.3131\times10^4$, $q_2 = 820.70$, $r = 1.5625\times10^{-2}$, $J = 120$:

$$
p_{12} = 1718.87,\quad p_{22} = 978.85,\quad p_{11} = 7477.88,\qquad \mathbf{K} = (916.732,\ 522.054),
$$

matching the numerical solver to every digit, with poles $-2.1752 \pm 1.7052j$.

Two special cases are worth carrying. With $q_2 = 0$ — penalize position and control only — $k_2 = \sqrt{2J}\,(q_1/r)^{1/4}$. For $J = q_1 = r = 1$ that is $\mathbf{K} = (1,\ \sqrt2)$, with poles at $-\tfrac{1}{\sqrt2}(1 \pm j)$: damping ratio exactly $0.707$, the **[[Butterworth|butterworth]]** pair. With $\mathbf{Q} = \mathbf{I}$ and $J = r = 1$ instead, $k_2 = \sqrt{1 + 2} = \sqrt3$. People mix these two up. The whole difference is whether the rate state carries weight.
:::

## Check yourself

::: check
A colleague's CARE solver returns a $\mathbf{P}$ with residual $10^{-14}$, but the closed loop has a pole at $+3.2\,\mathrm{s^{-1}}$. What happened, and how would you fix it without changing solvers?
:::

::: answer
The solver found a solution of the equation that is not the stabilizing one: it chose a subspace containing at least one unstable Hamiltonian eigenvalue. The residual is tiny because that matrix genuinely solves the equation. The residual test cannot tell the roots apart, which is why the closed-loop eigenvalue check is a separate item on the list. The fix is in the selection step. Sort the Hamiltonian eigenvalues by real part and take the $n$ most negative. If any eigenvalue has real part within round-off of zero, stop and check stabilizability and detectability, because the clean split the method relies on does not exist. Another symptom of the same mistake: $\mathbf{P}$ fails the positive-semidefinite check, because under stabilizability and detectability the stabilizing solution is the only positive semidefinite one.
:::

::: check
Why does the backward Riccati sweep converge at twice the slowest closed-loop decay rate, rather than at that rate?
:::

::: answer
Write $\mathbf{P}(s) = \mathbf{P}_\infty + \boldsymbol{\Delta}(s)$, where $\boldsymbol{\Delta}$ ("capital delta") is the error, and substitute into the time-to-go form. The terms with $\mathbf{P}_\infty$ alone cancel, because $\mathbf{P}_\infty$ solves the CARE. Dropping the small term quadratic in $\boldsymbol{\Delta}$ leaves $\dot{\boldsymbol{\Delta}} = \mathbf{A}_{cl}^\top\boldsymbol{\Delta} + \boldsymbol{\Delta}\mathbf{A}_{cl}$, with $\mathbf{A}_{cl} = \mathbf{A} - \mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}_\infty$. Its solution is $\boldsymbol{\Delta}(s) = e^{\mathbf{A}_{cl}^\top s}\boldsymbol{\Delta}(0)e^{\mathbf{A}_{cl}s}$. The closed-loop transition matrix acts on both sides, and each side contributes one factor of the decay, so the error falls like $e^{2\mathrm{Re}(\mu_{\min})s}$, dominated by the slowest mode. The measured $3.540\,\mathrm{s^{-1}}$ against the predicted $2 \times 1.7753 = 3.551\,\mathrm{s^{-1}}$ confirms it. The practical consequence: a slow closed-loop mode means you need a long horizon before finite-horizon and infinite-horizon gains agree.
:::

::: check
Kleinman's iteration needs a stabilizing $\mathbf{K}_0$. What breaks if you start from a non-stabilizing one, and where could such a $\mathbf{K}_0$ come from on a real vehicle?
:::

::: answer
Step 1 solves a Lyapunov equation for the cost of the current gain, and that cost is finite only when the loop is stable. With an unstable $\mathbf{A} - \mathbf{B}\mathbf{K}_0$ the Lyapunov equation still returns a matrix — it is a linear system, solvable whenever no two eigenvalues of $\mathbf{A} - \mathbf{B}\mathbf{K}_0$ add to zero — but that matrix is not a cost-to-go and is not positive semidefinite. The iteration then has no steady descent to rely on, and it typically wanders or diverges. On a vehicle, the natural starting gain is the previous flight condition's gain in a scheduled design, and that is exactly where it can fail: a gain that stabilized the plant at Mach 0.8 may not stabilize it at Mach 2.5. The defense is to check the eigenvalues of $\mathbf{A} - \mathbf{B}\mathbf{K}_0$ before iterating, and fall back on the Hamiltonian method, which needs no starting guess, when the check fails.
:::

::: check
For the double integrator, which weight would you change to double the closed-loop natural frequency, and by how much?
:::

::: answer
The closed-loop characteristic polynomial is $s^2 + (k_2/J)s + k_1/J$, so the natural frequency is $\omega_n = \sqrt{k_1/J}$. Substituting $k_1 = \sqrt{q_1/r}$ gives $\omega_n = (q_1/r)^{1/4}/\sqrt{J}$. To double $\omega_n$, $q_1/r$ must grow by $2^4 = 16$. So multiply $q_1$ by $16$, or divide $r$ by $16$ — the same move. This fourth-root rule is the most useful number in LQR tuning: a factor of ten in weight buys only $10^{1/4} = 1.78$ in bandwidth, so tuning happens in factors of ten, not percentages. Check with the worked numbers: $(13131.2/0.015625)^{1/4}/\sqrt{120} = 30.28/10.954 = 2.764\,\mathrm{s^{-1}}$, which matches the pole distance $|{-2.1752 \pm 1.7052j}| = 2.764\,\mathrm{s^{-1}}$.
:::

::: check
Explain why the CARE solution for the three-state plant had eigenvalues ranging from $3\times10^{-4}$ to $10^{4}$, and whether that is a problem.
:::

::: answer
$\mathbf{P}$ inherits the scaling of $\mathbf{Q}$. The three budgets — $0.5^\circ$, $2^\circ/\mathrm{s}$ and $8\,\mathrm{N\,m}$ — produce diagonal weights of $1.3\times10^4$, $8.2\times10^2$ and $1.6\times10^{-2}$, a spread of six powers of ten before the dynamics add anything. The resulting condition number of about $3\times10^7$ costs roughly seven of the sixteen digits of double precision in the Riccati solve. That is survivable here, and would not be on a larger model. It is a scaling problem, not a modeling error: the same controller written in unitless states has a well-conditioned $\mathbf{P}$. The habit worth forming is to always solve in scaled coordinates and transform the gain back, so the difficulty of the numerical problem never depends on which units the requirements document happened to use.
:::

## Summary

| Object | Statement |
| --- | --- |
| CARE | $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q} = \mathbf{0}$ |
| DRE | $-\dot{\mathbf{P}} = \mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} - \mathbf{P}\mathbf{B}\mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P} + \mathbf{Q}$, $\mathbf{P}(t_f) = \mathbf{Q}_f$, backward |
| Existence | $(\mathbf{A},\mathbf{B})$ stabilizable and $(\mathbf{A},\mathbf{Q}^{1/2})$ detectable give a unique stabilizing $\mathbf{P} \succeq 0$ |
| Many roots | At most $\binom{2n}{n}$ solutions, at most $2^n$ symmetric; only the all-stable eigenvalue choice is a cost |
| Hamiltonian method | $\mathbf{P} = \mathbf{Y}\mathbf{X}^{-1}$ from the stable invariant subspace; closed-loop poles are the stable eigenvalues of $\mathbf{M}$ |
| Backward sweep | Integrate in time-to-go from $\mathbf{Q}_f$; error decays as $e^{-2|\mathrm{Re}\,\mu_{\min}|s}$ |
| Kleinman iteration | Lyapunov solve, then $\mathbf{K}_{i+1} = \mathbf{R}^{-1}\mathbf{B}^\top\mathbf{P}_i$; Newton, quadratic, needs a stabilizing start |
| Acceptance checks | Residual, symmetry, $\mathbf{P} \succ 0$, eigenvalues of $\mathbf{A}-\mathbf{B}\mathbf{K}$ |
| Double integrator | $p_{12} = J\sqrt{q_1r}$, $p_{22} = J\sqrt{r(q_2 + 2J\sqrt{q_1r})}$, $k_1 = \sqrt{q_1/r}$, $k_2 = \sqrt{(q_2 + 2J\sqrt{q_1r})/r}$ |
| Bandwidth scaling | $\omega_n = (q_1/r)^{1/4}/\sqrt{J}$: a factor $16$ in weight for a factor $2$ in bandwidth |
| Worked three-state | $\mathbf{K} = (916.73,\ 634.34,\ 0.590)$, poles $-28.25$, $-1.775 \pm 1.502j$, residual $4\times10^{-11}$ |

You can now compute the gain. The next lesson deals with the part no solver does for you: choosing the $\mathbf{Q}$ and $\mathbf{R}$ that go into it.

::: context monte-carlo Flying the mission thousands of times
A Monte Carlo campaign runs the same simulation thousands of times, each with slightly different random values — engine thrust, winds, mass, sensor errors — drawn from their expected spreads. The spread of the results shows how often the vehicle meets its requirements. The name comes from the casino in Monaco, because the method is built on random draws. If each run redesigns a controller, the Riccati equation gets solved thousands of times, so a fast, reliable solver matters.
:::

::: context riccati Who Riccati was
Jacopo Riccati (1676–1754) was a Venetian mathematician. The equation that carries his name is, in its original form, a single-variable differential equation whose right-hand side is a quadratic in the unknown: $y' = a(x) + b(x)y + c(x)y^2$. Two hundred years later, control engineers found that the matrix version of exactly that shape — a constant, a linear part, a quadratic part — governs the optimal regulator.
:::

::: context scalar-roots The two roots, drawn
For the scalar example the CARE is the parabola $f(p) = 0.8p - p^2 + 1$. It crosses zero twice.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="330" y2="70" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="142.5" y1="15" x2="142.5" y2="205" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="30.0,168.0 37.5,153.2 45.0,139.2 52.5,126.0 60.0,113.6 67.5,102.0 75.0,91.2 82.5,81.2 90.0,72.0 97.5,63.6 105.0,56.0 112.5,49.2 120.0,43.2 127.5,38.0 135.0,33.6 142.5,30.0 150.0,27.2 157.5,25.2 165.0,24.0 172.5,23.6 180.0,24.0 187.5,25.2 195.0,27.2 202.5,30.0 210.0,33.6 217.5,38.0 225.0,43.2 232.5,49.2 240.0,56.0 247.5,63.6 255.0,72.0 262.5,81.2 270.0,91.2 277.5,102.0 285.0,113.6 292.5,126.0 300.0,139.2 307.5,153.2 315.0,168.0 322.5,183.6 330.0,200.0"/>
  <circle cx="91.7" cy="70" r="5" fill="#b4232c"/>
  <circle cx="253.3" cy="70" r="5" fill="#1d6fd1"/>
  <text x="85" y="95" font-size="11" text-anchor="end" fill="#b4232c">p = −0.677</text>
  <text x="85" y="109" font-size="11" text-anchor="end" fill="#b4232c">unstable loop</text>
  <text x="262" y="60" font-size="11" fill="#1d6fd1">p = 1.477</text>
  <text x="262" y="46" font-size="11" fill="#1d6fd1">stabilizing</text>
  <text x="148" y="200" font-size="11" fill="#1f2a44">p = 0</text>
</svg>
```

Horizontal scale 75 pixels per unit of $p$, vertical 40 per unit of $f$. Only the right-hand root is the controller.
:::

::: context invariant-subspace A subspace that stays put
Multiply a vector by a matrix and it usually points somewhere new. An eigenvector is special: it only gets stretched, never turned. An **invariant subspace** is the same idea for a whole flat sheet of directions — any vector in the sheet, multiplied by the matrix, lands back in the sheet. The stable eigenvectors of $\mathbf{M}$ span such a sheet. Motions of $(\mathbf{x}, \boldsymbol{\lambda})$ that start in it stay in it and decay, and $\mathbf{P}$ is the rule that says which $\boldsymbol{\lambda}$ goes with each $\mathbf{x}$ on that sheet.
:::

::: context schur The safer way to find the subspace
Issai Schur showed that any square matrix can be written as $\mathbf{U}\mathbf{T}\mathbf{U}^{*}$ with $\mathbf{U}$ having perpendicular unit columns and $\mathbf{T}$ upper triangular. Reordering so the stable eigenvalues come first, the first $n$ columns of $\mathbf{U}$ span the stable subspace — no eigenvectors needed, and perpendicular columns cannot be nearly parallel. Alan Laub's 1979 paper "A Schur method for solving algebraic Riccati equations" made this the standard approach, and it is still what library CARE solvers are built on.
:::

::: context policy-iteration Evaluate, then improve
In reinforcement learning, a **policy** is a rule for choosing actions. Policy iteration alternates two steps: evaluate how good the current policy is (here, the Lyapunov solve that gives its cost), then switch to the policy that is best against that evaluation (here, the new gain). For linear plants and quadratic costs, David Kleinman showed in 1968 that this converges to the LQR solution. The same loop, with the exact solve replaced by learning from data, is at the heart of many modern learning-based controllers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="20" x2="40" y2="182" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="182" x2="340" y2="182" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="50,20.8 74,25.6 98,30.5 122,35.3 146,40.1 170,45.0 194,50.1 218,55.9 242,64.2 266,79.3 290,109.5 314,171.2"/>
  <g fill="#1d6fd1">
    <circle cx="50" cy="20.8" r="3"/><circle cx="74" cy="25.6" r="3"/><circle cx="98" cy="30.5" r="3"/><circle cx="122" cy="35.3" r="3"/>
    <circle cx="146" cy="40.1" r="3"/><circle cx="170" cy="45.0" r="3"/><circle cx="194" cy="50.1" r="3"/><circle cx="218" cy="55.9" r="3"/>
    <circle cx="242" cy="64.2" r="3"/><circle cx="266" cy="79.3" r="3"/><circle cx="290" cy="109.5" r="3"/><circle cx="314" cy="171.2" r="3"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="36" y="24">10⁸</text><text x="36" y="88">10⁰</text><text x="36" y="184">10⁻¹²</text>
  </g>
  <line x1="36" y1="84" x2="40" y2="84" stroke="#1f2a44"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="196">0</text><text x="146" y="196">4</text><text x="242" y="196">8</text><text x="314" y="196">11</text>
  </g>
  <text x="120" y="130" font-size="11" fill="#1f2a44">CARE residual per iteration</text>
  <text x="120" y="145" font-size="11" fill="#b4232c">slow start, then the plunge</text>
</svg>
```

The residuals from the worked example, on a logarithmic scale: a steady slide for eight iterations, then the quadratic plunge.
:::

::: context condition-number How much a matrix magnifies errors
The **condition number** of a symmetric positive definite matrix is its largest eigenvalue divided by its smallest. Roughly, it says how much a tiny relative error in the data can grow in the answer. A condition number of $10^k$ can cost about $k$ digits. Double-precision arithmetic carries about 16, so $3\times10^7$ leaves about nine — plenty here, but a warning sign on a bigger model.
:::

::: context butterworth Where the name comes from
In 1930 the British engineer Stephen Butterworth described a filter whose response is as flat as possible before it rolls off. Its poles sit evenly spaced on a half-circle in the left half plane. For two poles that means $45^\circ$ above and below the negative real axis — damping ratio $1/\sqrt2 \approx 0.707$. LQR lands on these patterns again when control becomes very cheap, a result you will meet in the lesson on the symmetric root locus.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="90" x2="320" y2="90" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="240" y1="15" x2="240" y2="170" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M240,10 A80,80 0 0,0 240,170" fill="none" stroke="#8fb8f0" stroke-width="2" stroke-dasharray="5 4"/>
  <line x1="240" y1="90" x2="183.4" y2="33.4" stroke="#1f2a44" stroke-width="1"/>
  <line x1="240" y1="90" x2="183.4" y2="146.6" stroke="#1f2a44" stroke-width="1"/>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="178.4" y1="28.4" x2="188.4" y2="38.4"/><line x1="188.4" y1="28.4" x2="178.4" y2="38.4"/>
    <line x1="178.4" y1="141.6" x2="188.4" y2="151.6"/><line x1="188.4" y1="141.6" x2="178.4" y2="151.6"/>
  </g>
  <text x="200" y="78" font-size="11" fill="#1f2a44">45°</text>
  <text x="246" y="22" font-size="11" fill="#1f2a44">Im</text>
  <text x="310" y="106" font-size="11" fill="#1f2a44">Re</text>
  <text x="60" y="30" font-size="11" fill="#1d6fd1">−0.707 + 0.707j</text>
  <text x="60" y="158" font-size="11" fill="#1d6fd1">−0.707 − 0.707j</text>
  <text x="250" y="140" font-size="11" fill="#1f2a44">unit circle</text>
</svg>
```

The double-integrator poles with $J = q_1 = r = 1$ and $q_2 = 0$, drawn at 80 pixels per unit.
:::
