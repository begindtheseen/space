---
id: l08-semidefinite-programming
title: Semidefinite programming
minutes: 23
covers:
  - semidefinite programming
---

Think of the convex problem types as rungs on a ladder. Linear programs sit at the bottom. Quadratic programs are one rung up, then second-order cone programs. This lesson climbs to the top rung that practical solvers reach: swap the second-order cone for a cone made of *matrices* and you get the **semidefinite program**, or SDP. Everything from the last two lessons survives the climb. The feasible set is convex, the duality of lesson 7 applies word for word, and an interior-point method solves it in a bounded number of steps.

What you gain is the power to say more. A semidefinite constraint can say that a matrix built from your unknowns has all its eigenvalues below a limit, that a quadratic expression is never negative, or that an energy-like function exists proving a controller is stable. Stability analysis, robust control and reachability checks are built from statements like these. The standard tools of those fields — the linear matrix inequality, $\mathcal{H}_\infty$ design, the invariant ellipsoid, the sums-of-squares certificate — are SDPs underneath.

What you pay is work. A second-order cone of size $n+1$ costs about $n$ operations per interior-point step, written $O(n)$ ("order n"). A matrix cone of size $n \times n$ costs $O(n^3)$ and needs a matrix factorization. That gap is why no SDP is solved onboard a vehicle today while SOCPs are, and why this lesson ends by pushing the landing problem firmly back down to the cone it belongs in.

## The cone of positive semidefinite matrices

Start with a picture. Push a ball sitting at the bottom of a bowl, in any direction, and it rises: the energy goes up whichever way you push. A **positive semidefinite** matrix is the matrix version of that bowl. Push along any direction $\mathbf{z}$, and the "energy" $\mathbf{z}^\top\mathbf{X}\mathbf{z}$ is never negative.

Now the precise version. Write $\mathbb{S}^n$ for the set of real **symmetric** $n \times n$ matrices, those equal to their own transpose ($X_{ij} = X_{ji}$). A symmetric matrix has $n(n+1)/2$ independent entries, since the lower triangle copies the upper one.

> A matrix $\mathbf{X} \in \mathbb{S}^n$ is **positive semidefinite** (PSD), written $\mathbf{X} \succeq 0$ and read "X is PSD", if $\mathbf{z}^\top\mathbf{X}\mathbf{z} \ge 0$ for every $\mathbf{z} \in \mathbb{R}^n$. Equivalently, all its **[[eigenvalues|eigenvalues]]** are nonnegative. It is **positive definite**, $\mathbf{X} \succ 0$, if $\mathbf{z}^\top\mathbf{X}\mathbf{z} > 0$ for every $\mathbf{z} \ne \mathbf{0}$; equivalently, all eigenvalues are positive.

The notation $\mathbf{X} \succeq \mathbf{Y}$ means $\mathbf{X} - \mathbf{Y} \succeq 0$.

The set of all PSD matrices is written $\mathbb{S}^n_+ = \{\mathbf{X} \in \mathbb{S}^n : \mathbf{X} \succeq 0\}$. It is a convex cone, and the proof is one line. If $\mathbf{X} \succeq 0$ and $\mathbf{Y} \succeq 0$ and $\theta \in [0,1]$, then for any $\mathbf{z}$,

$$
\mathbf{z}^\top\big(\theta\mathbf{X} + (1-\theta)\mathbf{Y}\big)\mathbf{z} = \theta\,\mathbf{z}^\top\mathbf{X}\mathbf{z} + (1-\theta)\,\mathbf{z}^\top\mathbf{Y}\mathbf{z} \ge 0 ,
$$

a sum of two nonnegative numbers. Multiplying a PSD matrix by a positive number keeps it PSD, so the set is a cone.

Look at the definition once more. For each fixed $\mathbf{z}$, the rule $\mathbf{z}^\top\mathbf{X}\mathbf{z} \ge 0$ is a *linear* inequality in the entries of $\mathbf{X}$: a flat wall. So $\mathbf{X} \succeq 0$ is a stack of **[[infinitely many flat walls|curved-from-flat]]**, one per direction. An intersection of halfspaces is convex, and infinitely many of them give a boundary that is curved rather than flat.

### Measuring matrices against each other

To talk about duality we need a dot product for matrices. The natural one multiplies matching entries and adds them up:

$$
\langle \mathbf{X}, \mathbf{Y}\rangle = \operatorname{tr}(\mathbf{X}\mathbf{Y}) = \sum_{i,j} X_{ij}Y_{ij} ,
$$

where $\operatorname{tr}$ is the **[[trace|trace]]**, the sum of the diagonal entries. With this dot product the PSD cone is **self-dual**, exactly like the orthant and the second-order cone of lesson 7: the dual cone $\mathcal{K}^*$ is the cone itself.

::: note Why the PSD cone is its own dual
**PSD pairs never go negative.** Let $\mathbf{X} \succeq 0$ and $\mathbf{Y} \succeq 0$. Factor $\mathbf{X} = \mathbf{X}^{1/2}\mathbf{X}^{1/2}$ with $\mathbf{X}^{1/2}$ symmetric (the matrix square root). The trace does not change when you move the first factor of a product to the end, so

$$
\operatorname{tr}(\mathbf{X}\mathbf{Y}) = \operatorname{tr}(\mathbf{X}^{1/2}\mathbf{Y}\mathbf{X}^{1/2}) \ge 0,
$$

because $\mathbf{X}^{1/2}\mathbf{Y}\mathbf{X}^{1/2}$ is PSD, and the trace of a PSD matrix is a sum of nonnegative eigenvalues.

**Nothing else pairs well with all of them.** If $\mathbf{Y}$ has a negative eigenvalue with unit eigenvector $\mathbf{z}$, then $\mathbf{X} = \mathbf{z}\mathbf{z}^\top$ is PSD and $\operatorname{tr}(\mathbf{X}\mathbf{Y}) = \mathbf{z}^\top\mathbf{Y}\mathbf{z} < 0$. So $\mathbf{Y}$ is not in the dual cone.
:::

So the whole conic duality of lesson 7 — dual problem, weak duality, certificates — carries over to SDP unchanged.

## Standard form

> A **semidefinite program** is: minimize $\langle\mathbf{C}, \mathbf{X}\rangle$ over $\mathbf{X} \in \mathbb{S}^n$ subject to $\langle\mathbf{A}_i, \mathbf{X}\rangle = b_i$ for $i = 1,\dots,m$, and $\mathbf{X} \succeq 0$.

The unknown is a whole matrix. The objective and the equality constraints are linear in its entries, and the one nonlinear-looking rule is "stay in the cone". This is the *standard*, or *primal*, form.

The form you meet in control is the equivalent **inequality form**. The unknown is a vector, and the constraint is a **linear matrix inequality**, or **LMI**:

$$
\text{minimize } \mathbf{c}^\top\mathbf{x} \quad \text{subject to} \quad \mathbf{F}(\mathbf{x}) = \mathbf{F}_0 + x_1\mathbf{F}_1 + \dots + x_n\mathbf{F}_n \succeq 0 ,
$$

with all the matrices $\mathbf{F}_i \in \mathbb{S}^k$ given. The map $\mathbf{x} \mapsto \mathbf{F}(\mathbf{x})$ is affine (a constant plus multiples of the unknowns). So the feasible set is the set of $\mathbf{x}$ that an affine map sends into a convex cone, which is convex — the same argument that made the second-order cone constraint convex in lesson 6.

Several LMIs combine into one by stacking them as blocks down the diagonal of a bigger matrix, because a block-diagonal matrix is PSD exactly when every block is.

::: key The conic hierarchy
$\text{LP} \subset \text{QP} \subset \text{SOCP} \subset \text{SDP}$. Each class is a special case of the next: a linear inequality is a $1 \times 1$ LMI, a convex quadratic objective becomes a second-order cone constraint, and a second-order cone constraint $\|\mathbf{u}\|_2 \le t$ is the LMI $\begin{bmatrix} t\mathbf{I} & \mathbf{u} \\ \mathbf{u}^\top & t\end{bmatrix} \succeq 0$. Expressive power grows along the chain, and so does the work per iteration: $O(1)$ for a scalar inequality, $O(n)$ for a second-order cone of size $n$, $O(n^3)$ for an $n \times n$ PSD block.
:::

## The Schur complement

One fact does most of the work of turning engineering statements into LMIs.

> **Schur complement**: let $\mathbf{M} = \begin{bmatrix} \mathbf{A} & \mathbf{B} \\ \mathbf{B}^\top & \mathbf{C}\end{bmatrix}$ be symmetric with $\mathbf{A} \succ 0$. Then $\mathbf{M} \succeq 0$ if and only if $\mathbf{C} - \mathbf{B}^\top\mathbf{A}^{-1}\mathbf{B} \succeq 0$.

The expression $\mathbf{C} - \mathbf{B}^\top\mathbf{A}^{-1}\mathbf{B}$ is the **[[Schur complement|schur]]** of $\mathbf{A}$ in $\mathbf{M}$. Its value to you is this: the nonlinear expression — an inverse sandwiched between unknowns — becomes a *linear* matrix inequality once you lift it into the bigger matrix $\mathbf{M}$. Every quadratic-over-linear expression in control is made convex this way.

::: note Why it has to be true
It is completing the square, the same trick as solving a quadratic equation. For any stacked vector $(\mathbf{z}_1, \mathbf{z}_2)$,

$$
\begin{bmatrix}\mathbf{z}_1 \\ \mathbf{z}_2\end{bmatrix}^\top \mathbf{M} \begin{bmatrix}\mathbf{z}_1 \\ \mathbf{z}_2\end{bmatrix}
= \mathbf{z}_1^\top\mathbf{A}\mathbf{z}_1 + 2\mathbf{z}_1^\top\mathbf{B}\mathbf{z}_2 + \mathbf{z}_2^\top\mathbf{C}\mathbf{z}_2
= \|\mathbf{A}^{1/2}(\mathbf{z}_1 + \mathbf{A}^{-1}\mathbf{B}\mathbf{z}_2)\|_2^2 + \mathbf{z}_2^\top(\mathbf{C} - \mathbf{B}^\top\mathbf{A}^{-1}\mathbf{B})\mathbf{z}_2 .
$$

The first term is a squared length, so it is never negative, and choosing $\mathbf{z}_1 = -\mathbf{A}^{-1}\mathbf{B}\mathbf{z}_2$ makes it zero. So the whole expression is nonnegative for every $(\mathbf{z}_1, \mathbf{z}_2)$ exactly when the second term is nonnegative for every $\mathbf{z}_2$.
:::

::: example The second-order cone is a $3 \times 3$ LMI
Take a thrust-like vector $\mathbf{u} = (3, 4)$, so $\|\mathbf{u}\|_2 = \sqrt{9 + 16} = 5$, and form the "arrow" matrix

$$
\mathbf{M}(t) = \begin{bmatrix} t & 0 & 3 \\ 0 & t & 4 \\ 3 & 4 & t \end{bmatrix} .
$$

**Determinant.** Expanding along the first row, $\det \mathbf{M}(t) = t(t^2 - 16) - 0 + 3(0 - 3t) = t^3 - 25t = t(t^2 - 25)$. It is zero at $t = 5$, which is $\|\mathbf{u}\|_2$.

**Eigenvalues.** They come in closed form. The direction $(4, -3, 0)$ lies in the top block, at right angles to $\mathbf{u}$, and $\mathbf{M}$ scales it by $t$. The other two eigenvectors live in the plane of $(\mathbf{u}/\|\mathbf{u}\|, 0)$ and $(0, 0, 1)$, with eigenvalues $t \pm \|\mathbf{u}\|_2 = t \pm 5$. So:

- at $t = 6$: eigenvalues $1, 6, 11$ — all positive, positive definite;
- at $t = 5$: eigenvalues $0, 5, 10$ — PSD, right on the boundary;
- at $t = 4.5$: eigenvalues $-0.5, 4.5, 9.5$ — one negative, so $\mathbf{M} \not\succeq 0$.

The LMI holds exactly when $t \ge \|\mathbf{u}\|_2 = 5$.

**Schur complement.** The same answer, without eigenvalues. Take $\mathbf{A} = t\mathbf{I}_2$ (positive definite when $t > 0$), $\mathbf{B} = \mathbf{u}$, $\mathbf{C} = t$. Then $\mathbf{C} - \mathbf{B}^\top\mathbf{A}^{-1}\mathbf{B} = t - \|\mathbf{u}\|_2^2/t$. That is nonnegative exactly when $t^2 \ge \|\mathbf{u}\|_2^2$, that is, $t \ge 5$. The two methods agree, as they must.

So every thrust, pointing and glide-slope constraint of lesson 6 *could* be handed to an SDP solver as a $3 \times 3$ or $4 \times 4$ LMI. None of them *should* be, for the cost reason below. But the embedding is what makes the ladder a ladder.
:::

## What semidefinite programming is for

A GNC engineer does not need SDP for landing guidance. You need it for everything that happens before flight: proving a controller stable, bounding the effect of an uncertainty, sizing a reachable set.

**Lyapunov stability as an LMI.** Picture a marble rolling inside a bowl with friction. Its height can only go down, so it must settle at the bottom. A **[[Lyapunov function|lyapunov]]** is a mathematical bowl like that for a system. For the linear system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ ("x dot", the rate of change of $\mathbf{x}$), the bowl is $V(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}\mathbf{x}$, and the system is asymptotically stable (every motion dies away) if and only if there is a $\mathbf{P} \succ 0$ with $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} \prec 0$. Both conditions are linear in the unknown entries of $\mathbf{P}$. That is an LMI feasibility problem: an SDP with a zero objective. Given $\mathbf{P}$, a reviewer can check the certificate by multiplying matrices — the same idea as lesson 7's duality certificates, one level up.

**Robust stability.** Suppose the plant matrix is uncertain but known to lie in the convex hull of a few corner cases $\mathbf{A}_1, \dots, \mathbf{A}_q$ — a gain that drifts, an inertia that changes as propellant drains. Ask for one $\mathbf{P}$ with $\mathbf{A}_k^\top\mathbf{P} + \mathbf{P}\mathbf{A}_k \prec 0$ for every $k$. Because the inequality is affine in $\mathbf{A}$, that one $\mathbf{P}$ proves stability for every plant in the hull at once. One SDP with $q$ LMI blocks replaces an infinite family of checks. This is the standard way to certify an attitude controller against inertia uncertainty.

**Performance design.** The **[[$\mathcal{H}_\infty$ problem|h-infinity]]** — design a controller that minimizes the worst-case gain from disturbance to error — is an SDP after a change of variables. It rests on the bounded real lemma, a Lyapunov inequality plus a Schur complement. So is the $\mathcal{H}_2$ problem, and the mixed one. This is where most LMIs in the control literature come from.

**Reachable sets and funnels.** An invariant ellipsoid $\{\mathbf{x} : \mathbf{x}^\top\mathbf{P}\mathbf{x} \le 1\}$ that contains everything a disturbed system can reach is found by an SDP. So is a "funnel" around a planned trajectory that a nonlinear system provably cannot leave. For polynomial dynamics, the sums-of-squares method turns the check "this polynomial is never negative" into "this coefficient matrix is PSD" — again an SDP. Checking a landing controller against the full nonlinear dynamics uses exactly this.

**Covariance steering.** Some guidance methods treat the state as a Gaussian cloud and steer its covariance, not only one trajectory. The covariance matrix is then an unknown that must stay PSD. Chance constraints such as "the probability of leaving the glide slope is below $10^{-3}$" become semidefinite or second-order cone constraints on that matrix.

::: example A Lyapunov certificate for a lightly damped mode
A flexible mode or a lightly damped attitude loop obeys $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ with

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -\omega^2 & -2\zeta\omega \end{bmatrix}, \qquad \omega = 2\,\mathrm{rad/s},\ \zeta = 0.1,
$$

where $\omega$ ("omega") is the **[[natural frequency and $\zeta$ ("zeta") the damping ratio|damping]]**. So $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -4 & -0.4\end{bmatrix}$, and its eigenvalues are $-0.2 \pm 1.99i$. The swing dies away inside an envelope $e^{-0.2t}$, a time constant of $1/0.2 = 5\,\mathrm{s}$.

**Fix $\mathbf{Q}$ and solve.** Set $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} = -\mathbf{Q}$ with $\mathbf{Q} = \mathbf{I}$. That is three linear equations in the three unknowns $P_{11}, P_{12}, P_{22}$, and the solution is

$$
\mathbf{P} = \begin{bmatrix} 6.3 & 0.125 \\ 0.125 & 1.5625\end{bmatrix} .
$$

**Check it.** The top-left entry is $6.3 > 0$ and $\det\mathbf{P} = 6.3 \times 1.5625 - 0.125^2 = 9.828 > 0$, so $\mathbf{P} \succ 0$ and the system is stable. That certificate needed no eigenvalue of $\mathbf{A}$. The eigenvalues of $\mathbf{P}$ are $1.559$ and $6.303$.

**Get a decay rate.** Along any motion, $\dot V = \mathbf{x}^\top(\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A})\mathbf{x} = -\|\mathbf{x}\|_2^2$. Since $V \le \lambda_{\max}(\mathbf{P})\|\mathbf{x}\|_2^2$, this gives $\dot V \le -V/\lambda_{\max}(\mathbf{P})$. So $V$ shrinks at least as fast as $e^{-t/6.303}$. The size $\|\mathbf{x}\|$ goes like $\sqrt{V}$, so it shrinks at least as fast as $e^{-\alpha t}$ with

$$
\alpha = \frac{\lambda_{\min}(\mathbf{Q})}{2\,\lambda_{\max}(\mathbf{P})} = \frac{1}{2 \times 6.303} = 0.0793\ \mathrm{s^{-1}} .
$$

True, but weak. The guaranteed time constant is $1/0.0793 = 12.6\,\mathrm{s}$ against an actual $5\,\mathrm{s}$, about $2.5$ times too cautious. Try $\mathbf{Q} = \operatorname{diag}(4, 1)$ instead: $\mathbf{P} = \begin{bmatrix} 10.2 & 0.5 \\ 0.5 & 2.5\end{bmatrix}$, $\lambda_{\max}(\mathbf{P}) = 10.23$, and $\alpha = 1/(2 \times 10.23) = 0.0489\,\mathrm{s^{-1}}$ — worse. Guessing $\mathbf{Q}$ is a poor way to get a tight bound.

**Optimize over $\mathbf{P}$ instead.** Ask directly for the largest $\alpha$ such that some $\mathbf{P} \succ 0$ satisfies

$$
\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} + 2\alpha\mathbf{P} \preceq 0 .
$$

For a fixed $\alpha$ this is an LMI in $\mathbf{P}$: feasible or not. So the largest $\alpha$ is found by **[[bisection|bisection]]**, one SDP feasibility solve per step. An equivalent test: solve the Lyapunov equation for the shifted matrix $\mathbf{A} + \alpha\mathbf{I}$ and ask whether the answer is positive definite.

- $\alpha = 0.15$: $\mathbf{P} = \begin{bmatrix} 25.3 & 1.07 \\ 1.07 & 6.29\end{bmatrix}$, eigenvalues $6.23$ and $25.3$ — positive definite.
- $\alpha = 0.199$: still positive definite, eigenvalues $311$ and $1267$. The matrix is blowing up as the bound tightens.
- $\alpha = 0.2001$: eigenvalues $-12670$ and $-3115$ — not positive definite.

The bisection closes in on $\alpha^\star = 0.2\,\mathrm{s^{-1}}$. That is exactly $\zeta\omega = 0.1 \times 2$, the true decay rate. Optimizing over the certificate recovers the truth; fixing $\mathbf{Q}$ by hand threw away a factor of $2.5$.
:::

## The price of the matrix cone

An interior-point method (lesson 9) swaps each cone constraint for a smooth **barrier** function that shoots up to infinity at the cone's edge, then takes Newton steps. The barriers are

$$
-\sum_i \log s_i \ \ (\text{orthant}), \qquad -\log(t^2 - \|\mathbf{u}\|_2^2) \ \ (\text{second-order cone}), \qquad -\log\det\mathbf{X} \ \ (\text{PSD cone}).
$$

Two numbers decide everything.

The first is the **barrier parameter** $\nu$ ("nu"). It sets the iteration bound $O(\sqrt{\nu}\log(1/\epsilon))$, where $\epsilon$ ("epsilon") is the accuracy you ask for. It is $m$ for an orthant of dimension $m$, $n$ for an $n \times n$ PSD cone, and — remarkably — $2$ for a second-order cone of *any* dimension.

The second is the cost of one Newton step. For the second-order cone, the barrier's Hessian works out to $\frac{2}{s}\mathbf{J} + \frac{4}{s^2}\mathbf{w}\mathbf{w}^\top$, with $s = t^2 - \|\mathbf{u}\|^2$, $\mathbf{J} = \operatorname{diag}(\mathbf{I}, -1)$ and $\mathbf{w} = (\mathbf{u}, -t)$. That is a scaled sign-flip matrix plus a rank-one piece, and the **[[Sherman–Morrison formula|sherman-morrison]]** inverts it in $O(n)$ arithmetic with no factorization at all. For the PSD cone, the Hessian of $-\log\det$ involves $\mathbf{X}^{-1}$. Every iteration then needs a Cholesky factorization of an $n \times n$ matrix and several matrix multiplications.

::: example Counting the work in an SDP iteration
Take an SDP with one $n \times n$ block and $m$ equality constraints. Each interior-point iteration builds and solves an $m \times m$ linear system. Building it costs about $mn^3 + m^2n^2$ operations; solving it about $m^3$. For a middling problem, $n = 50$ and $m = 500$:

$$
mn^3 = 500 \times 125\,000 = 6.25\times10^7, \qquad m^2n^2 = 250\,000 \times 2500 = 6.25\times10^8, \qquad m^3 = 1.25\times10^8 .
$$

Add them: about $8.1\times10^8$ **[[floating-point operations|flops]]** per iteration. At an effective $1\,\mathrm{GFLOP/s}$ (a billion per second — optimistic for a flight processor, pessimistic for a workstation), that is $0.81\,\mathrm{s}$ per iteration, and roughly $25 \times 0.81 \approx 20\,\mathrm{s}$ for a $25$-iteration solve. Double both $n$ and $m$ and the biggest term, $m^2n^2$, grows $2^4 = 16$ times: about $1.2\times10^{10}$ operations per iteration in all.

Compare the landing SOCP of lesson 6: $401$ cones, none larger than dimension $4$, with barrier Hessians inverted in closed form. There is no $n^3$ anywhere, the problem is sparse, and lesson 12 counts about $1.7\times10^6$ operations per iteration. That is roughly $500$ times cheaper — and it is why the flight formulation is written with norms, not matrices.
:::

::: warning $\mathbf{X} \succeq 0$ is not "every entry of $\mathbf{X}$ is nonnegative"
The matrix $\begin{bmatrix} 1 & 2 \\ 2 & 1\end{bmatrix}$ has every entry positive, but its eigenvalues are $3$ and $-1$, so it is **[[not PSD|entries-vs-eigenvalues]]**. The matrix $\begin{bmatrix} 1 & -1 \\ -1 & 2\end{bmatrix}$ has a negative entry, but its eigenvalues are $0.382$ and $2.618$, so it is PSD.

The relation $\succeq$ is also only a *partial* order: two symmetric matrices can be incomparable, with neither $\mathbf{X} - \mathbf{Y}$ nor $\mathbf{Y} - \mathbf{X}$ PSD. That is why you cannot "sort" LMI constraints or take the biggest one the way you can with numbers, and why stacking them down a diagonal is the general way to combine several.
:::

::: note Tight relaxations of nonconvex problems
Lesson 6 warned that dropping a nonconvex constraint rarely leaves the optimum where you want it. SDP supplies the main family of exceptions. Take the nonconvex problem "maximize $\mathbf{x}^\top\mathbf{C}\mathbf{x}$ subject to $\|\mathbf{x}\|_2 = 1$". Substitute $\mathbf{X} = \mathbf{x}\mathbf{x}^\top$ and drop the nonconvex requirement that $\mathbf{X}$ have rank one. What is left is the SDP "maximize $\langle\mathbf{C}, \mathbf{X}\rangle$ subject to $\operatorname{tr}\mathbf{X} = 1$, $\mathbf{X} \succeq 0$".

This relaxation is exact: its optimum is reached at a rank-one $\mathbf{X}$, and the value is $\lambda_{\max}(\mathbf{C})$. For $\mathbf{C} = \begin{bmatrix} 2 & 1 \\ 1 & 3\end{bmatrix}$ the eigenvalues are $1.382$ and $3.618$, so the answer is $3.618$, reached at the matching eigenvector. Attitude determination from vector measurements (**[[Wahba's problem|wahba]]**) and several pointing-constraint problems have the same shape, and their SDP relaxations are tight in practice. This is a design-time tool, not a flight one.
:::

## Check yourself

::: check
Write the constraint "the largest eigenvalue of the symmetric matrix $\mathbf{S}(\mathbf{x}) = \mathbf{S}_0 + x_1\mathbf{S}_1 + x_2\mathbf{S}_2$ is at most $\gamma$" as an LMI. Why is $\lambda_{\max}$ a convex function of $\mathbf{x}$?
:::

::: answer
The constraint is $\gamma\mathbf{I} - \mathbf{S}(\mathbf{x}) \succeq 0$. The eigenvalues of $\gamma\mathbf{I} - \mathbf{S}$ are $\gamma$ minus those of $\mathbf{S}$, so none is negative exactly when every eigenvalue of $\mathbf{S}$ is at most $\gamma$. The expression is affine in $(\mathbf{x}, \gamma)$, so it is an LMI. Minimizing $\gamma$ subject to it is an SDP whose optimal value is $\lambda_{\max}(\mathbf{S}(\mathbf{x}))$.

Convexity: $\lambda_{\max}(\mathbf{S}) = \max_{\|\mathbf{z}\|=1}\mathbf{z}^\top\mathbf{S}\mathbf{z}$. For each fixed $\mathbf{z}$, the map $\mathbf{x} \mapsto \mathbf{z}^\top\mathbf{S}(\mathbf{x})\mathbf{z}$ is affine, and the highest of a family of affine functions is convex (lesson 3). By the same argument with "lowest", $\lambda_{\min}$ is concave. An eigenvalue in the middle of the list is neither.
:::

::: check
Use the Schur complement to write $\|\mathbf{M}\mathbf{x} - \mathbf{y}\|_2^2 \le t$ as an LMI, and say why you would still prefer the second-order cone form of lesson 6.
:::

::: answer
Let $\mathbf{r} = \mathbf{M}\mathbf{x} - \mathbf{y}$. The constraint is $t - \mathbf{r}^\top\mathbf{I}^{-1}\mathbf{r} \ge 0$, which by the Schur complement with $\mathbf{A} = \mathbf{I}$ is

$$
\begin{bmatrix} \mathbf{I} & \mathbf{r} \\ \mathbf{r}^\top & t\end{bmatrix} \succeq 0,
$$

an LMI of size $\dim\mathbf{r} + 1$, affine in $(\mathbf{x}, t)$.

It is correct and useless in practice. A solver handed it must factor a matrix of that size every iteration. The same statement written as $\|(2\mathbf{r}, 1-t)\|_2 \le 1+t$ is one second-order cone whose barrier Hessian inverts in linear time. (Check: squaring gives $4\|\mathbf{r}\|^2 + (1-t)^2 \le (1+t)^2$, which is $4\|\mathbf{r}\|^2 \le 4t$.) Always push a constraint down to the smallest cone that can express it. The ladder describes what can be said, not what you should use.
:::

::: check
An attitude controller must be stable for every inertia in the convex hull of three extreme cases $\mathbf{A}_1, \mathbf{A}_2, \mathbf{A}_3$. Write the SDP, and explain why solving three separate Lyapunov equations is not the same thing.
:::

::: answer
Find $\mathbf{P}$ such that $\mathbf{P} \succeq \mathbf{I}$ and $\mathbf{A}_k^\top\mathbf{P} + \mathbf{P}\mathbf{A}_k \preceq -\mathbf{I}$ for $k = 1, 2, 3$. (The $\mathbf{I}$ on the right-hand sides is a normalization that turns strict inequalities into non-strict ones a solver can handle.) That is four LMI blocks, affine in the entries of $\mathbf{P}$, with zero objective.

If such a $\mathbf{P}$ exists, take any $\mathbf{A} = \sum_k\theta_k\mathbf{A}_k$ with $\theta_k \ge 0$ summing to one. Then $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} = \sum_k\theta_k(\mathbf{A}_k^\top\mathbf{P} + \mathbf{P}\mathbf{A}_k) \preceq -\mathbf{I}$, so the same $\mathbf{P}$ certifies the whole hull.

Three separate Lyapunov equations give three different $\mathbf{P}_k$, each certifying only its own corner. A system that drifts or switches among the corners can be unstable even when each frozen corner is stable, and nothing combines the three certificates. The shared $\mathbf{P}$ is the whole point. It is also why the SDP can be infeasible when each corner alone is fine: a shared quadratic bowl is sufficient for stability, not necessary.
:::

::: check
The PSD cone has barrier parameter $\nu = n$ and the second-order cone has $\nu = 2$ whatever its dimension. Using the $O(\sqrt{\nu}\log(1/\epsilon))$ bound and counting only the cones, compare the predicted iteration counts for the landing problem of lesson 6 written as an SOCP with $401$ cones versus as an SDP with $401$ blocks of size $4$.
:::

::: answer
Barrier parameters add up over a product of cones. As an SOCP, $\nu = 2 \times 401 = 802$, so $\sqrt{\nu} = 28.32$. As an SDP with $4 \times 4$ blocks, $\nu = 4 \times 401 = 1604$, so $\sqrt{\nu} = 40.05$. For $\epsilon = 10^{-6}$, $\log(1/\epsilon) = \ln 10^6 = 13.82$, so the bounds are about $28.32 \times 13.82 \approx 391$ and $40.05 \times 13.82 \approx 553$ iterations.

They are only $1.4$ times apart, and both far above the few tens seen in practice. The iteration count is *not* where SDP loses. It loses on the cost of each iteration: $O(n^3)$ factorizations and dense system building instead of closed-form rank-one updates. When comparing formulations, count the work per iteration first and the iteration bound second.
:::

::: check
Why does the self-duality of the PSD cone matter for a solver, and what is the dual of the standard-form SDP?
:::

::: answer
Follow lesson 7's conic recipe with $\mathcal{K} = \mathcal{K}^* = \mathbb{S}^n_+$. The dual of "minimize $\langle\mathbf{C},\mathbf{X}\rangle$ s.t. $\langle\mathbf{A}_i,\mathbf{X}\rangle = b_i$, $\mathbf{X} \succeq 0$" is "maximize $\mathbf{b}^\top\mathbf{y}$ s.t. $\mathbf{C} - \sum_i y_i\mathbf{A}_i \succeq 0$". That is a vector problem with one LMI — exactly the inequality form. Standard form and inequality form are duals of each other.

Self-duality matters because a primal-dual interior-point method must keep both iterates inside their cones and take steps that respect both. When the two cones are the same, one set of barrier and scaling formulas serves both sides, and the symmetric scaling that makes the method work exists. Cones without this property, such as the exponential cone, need lopsided algorithms and are harder to solve reliably.
:::

## Summary

| Object | Statement |
| --- | --- |
| PSD cone | $\mathbb{S}^n_+ = \{\mathbf{X} = \mathbf{X}^\top : \mathbf{z}^\top\mathbf{X}\mathbf{z} \ge 0\ \forall\mathbf{z}\}$; convex, self-dual under $\langle\mathbf{X},\mathbf{Y}\rangle = \operatorname{tr}(\mathbf{X}\mathbf{Y})$ |
| SDP standard form | minimize $\langle\mathbf{C},\mathbf{X}\rangle$ s.t. $\langle\mathbf{A}_i,\mathbf{X}\rangle = b_i$, $\mathbf{X} \succeq 0$ |
| LMI form | minimize $\mathbf{c}^\top\mathbf{x}$ s.t. $\mathbf{F}_0 + \sum_i x_i\mathbf{F}_i \succeq 0$; the two forms are duals |
| Hierarchy | LP $\subset$ QP $\subset$ SOCP $\subset$ SDP; $\|\mathbf{u}\|_2 \le t \Leftrightarrow \begin{bmatrix} t\mathbf{I} & \mathbf{u} \\ \mathbf{u}^\top & t\end{bmatrix} \succeq 0$ |
| Schur complement | $\begin{bmatrix}\mathbf{A} & \mathbf{B}\\ \mathbf{B}^\top & \mathbf{C}\end{bmatrix} \succeq 0 \Leftrightarrow \mathbf{C} - \mathbf{B}^\top\mathbf{A}^{-1}\mathbf{B} \succeq 0$ when $\mathbf{A} \succ 0$ |
| Lyapunov LMI | $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ stable iff $\exists\,\mathbf{P} \succ 0$ with $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} \prec 0$; decay rate from $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} + 2\alpha\mathbf{P} \preceq 0$ |
| Worked certificate | $\omega = 2$, $\zeta = 0.1$: $\mathbf{Q} = \mathbf{I}$ gives $\alpha = 0.0793\,\mathrm{s^{-1}}$; optimizing over $\mathbf{P}$ gives $\alpha^\star = 0.2\,\mathrm{s^{-1}} = \zeta\omega$ |
| Barrier parameters | $\nu = m$ (orthant), $\nu = 2$ (second-order cone, any dimension), $\nu = n$ ($n \times n$ PSD) |
| Cost per iteration | $O(n)$ for a second-order cone (rank-one Hessian, Sherman–Morrison); $O(n^3)$ plus $O(m^2n^2 + m^3)$ for SDP |
| Example cost | $n = 50$, $m = 500$: about $8.1\times10^8$ flops per iteration, $\approx 20\,\mathrm{s}$ for $25$ iterations at $1\,\mathrm{GFLOP/s}$ |
| Where it is used | Stability and robustness certificates, $\mathcal{H}_\infty$ design, invariant ellipsoids and funnels, covariance steering, tight relaxations — all before flight, none onboard |

With the classes named and duality in hand, the next lesson gives the algorithm: the interior-point method that solves LP, QP, SOCP and SDP with the same barrier idea, follows the central path, and finishes in the bounded iteration count that lesson 4 promised.

::: context eigenvalues Eigenvalues in one picture
Most directions get both stretched and turned when a matrix multiplies them. An **eigenvector** is a special direction that only gets stretched (or flipped), never turned, and its **eigenvalue** is the stretch factor. A symmetric $n \times n$ matrix always has $n$ eigenvectors at right angles to each other.

Along an eigenvector $\mathbf{z}$ of unit length, $\mathbf{z}^\top\mathbf{X}\mathbf{z}$ is exactly the eigenvalue. So "never negative in any direction" and "no negative eigenvalue" are the same statement: a negative eigenvalue would be a direction where the bowl curves down.
:::

::: context curved-from-flat Curved walls built from flat ones
Each direction $\mathbf{z}$ gives one flat wall, $\mathbf{z}^\top\mathbf{X}\mathbf{z} \ge 0$. Here is the same idea in a flat plane: twelve straight walls, each keeping the inside on one side, fence in a twelve-sided shape. With a wall for every direction, the fence becomes the circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="150.0,116.1 133.9,143.9 106.1,160.0 73.9,160.0 46.1,143.9 30.0,116.1 30.0,83.9 46.1,56.1 73.9,40.0 106.1,40.0 133.9,56.1 150.0,83.9" fill="#8fb8f0" fill-opacity="0.5" stroke="none"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="150.0" y1="126.0" x2="150.0" y2="74.0"/>
    <line x1="129.0" y1="152.5" x2="155.0" y2="107.5"/>
    <line x1="97.5" y1="165.0" x2="142.5" y2="139.0"/>
    <line x1="64.0" y1="160.0" x2="116.0" y2="160.0"/>
    <line x1="37.5" y1="139.0" x2="82.5" y2="165.0"/>
    <line x1="25.0" y1="107.5" x2="51.0" y2="152.5"/>
    <line x1="30.0" y1="74.0" x2="30.0" y2="126.0"/>
    <line x1="51.0" y1="47.5" x2="25.0" y2="92.5"/>
    <line x1="82.5" y1="35.0" x2="37.5" y2="61.0"/>
    <line x1="116.0" y1="40.0" x2="64.0" y2="40.0"/>
    <line x1="142.5" y1="61.0" x2="97.5" y2="35.0"/>
    <line x1="155.0" y1="92.5" x2="129.0" y2="47.5"/>
  </g>
  <circle cx="270" cy="100" r="60" fill="#8fb8f0" fill-opacity="0.5" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="190" font-size="12" text-anchor="middle" fill="#1f2a44">12 flat walls</text>
  <text x="270" y="190" font-size="12" text-anchor="middle" fill="#1f2a44">a wall in every direction</text>
</svg>
```

The inside of each wall is convex, and the overlap of convex pieces is convex. That is why the PSD cone is convex even though its edge is curved.
:::

::: context trace The trace
The **trace** of a square matrix is the sum of the numbers on its main diagonal: $\operatorname{tr}\begin{bmatrix} 2 & 7 \\ 1 & 5\end{bmatrix} = 2 + 5 = 7$. It also equals the sum of the eigenvalues.

For two symmetric matrices, $\operatorname{tr}(\mathbf{X}\mathbf{Y})$ works out to "multiply matching entries and add them all up" — the same recipe as the dot product of two vectors, applied to every entry of a grid. That is why it is the natural dot product for matrices.
:::

::: context schur Who Schur was
Issai Schur was a mathematician who worked in Berlin. In 1917 he published the determinant formula that underlies this lemma: $\det\mathbf{M} = \det\mathbf{A}\,\det(\mathbf{C} - \mathbf{B}^\top\mathbf{A}^{-1}\mathbf{B})$. The name "Schur complement" came much later, in 1968, from the mathematician Emilie Haynsworth.

A quick way to remember the formula: it is what is left of the $\mathbf{C}$ block after you use the $\mathbf{A}$ block to cancel out $\mathbf{B}$, like one step of Gaussian elimination done on blocks instead of numbers.
:::

::: context lyapunov A bowl that proves stability
Draw the ellipses where $V = \mathbf{x}^\top\mathbf{P}\mathbf{x}$ is constant, using this lesson's $\mathbf{P}$ for the lightly damped mode. The motion starting at $\mathbf{x} = (1, 0)$ spirals inward, and it crosses every ellipse from outside to inside, never back out: $V$ only falls.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="45" y1="105" x2="160" y2="105" stroke="#6c7a93" stroke-width="1"/>
  <line x1="100" y1="15" x2="100" y2="195" stroke="#6c7a93" stroke-width="1"/>
  <polygon points="102.1,185.4 96.9,184.8 91.7,182.9 86.7,179.7 81.8,175.1 77.3,169.4 73.2,162.6 69.6,154.8 66.4,146.1 63.9,136.7 61.9,126.8 60.6,116.5 60.0,106.1 60.1,95.6 60.8,85.2 62.3,75.2 64.3,65.7 67.0,56.9 70.2,48.9 74.0,41.9 78.2,35.9 82.7,31.1 87.6,27.6 92.7,25.4 97.9,24.6 103.1,25.2 108.3,27.1 113.3,30.3 118.2,34.9 122.7,40.6 126.8,47.4 130.4,55.2 133.6,63.9 136.1,73.3 138.1,83.2 139.4,93.5 140.0,103.9 139.9,114.4 139.2,124.8 137.7,134.8 135.7,144.3 133.0,153.1 129.8,161.1 126.0,168.1 121.8,174.1 117.3,178.9 112.4,182.4 107.3,184.6" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <polygon points="101.2,150.3 98.2,150.0 95.3,148.9 92.5,147.1 89.8,144.5 87.2,141.3 84.9,137.4 82.9,133.0 81.1,128.2 79.6,122.9 78.6,117.3 77.8,111.5 77.5,105.6 77.5,99.7 77.9,93.9 78.7,88.2 79.9,82.9 81.4,77.9 83.2,73.4 85.3,69.4 87.7,66.1 90.3,63.4 93.0,61.4 95.9,60.2 98.8,59.7 101.8,60.0 104.7,61.1 107.5,62.9 110.2,65.5 112.8,68.7 115.1,72.6 117.1,77.0 118.9,81.8 120.4,87.1 121.4,92.7 122.2,98.5 122.5,104.4 122.5,110.3 122.1,116.1 121.3,121.8 120.1,127.1 118.6,132.1 116.8,136.6 114.7,140.6 112.3,143.9 109.7,146.6 107.0,148.6 104.1,149.8" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <polygon points="100.6,127.6 99.1,127.5 97.7,126.9 96.2,126.0 94.9,124.8 93.6,123.1 92.5,121.2 91.4,119.0 90.5,116.6 89.8,113.9 89.3,111.1 88.9,108.2 88.7,105.3 88.8,102.3 89.0,99.4 89.4,96.6 89.9,93.9 90.7,91.5 91.6,89.2 92.7,87.2 93.9,85.5 95.1,84.2 96.5,83.2 97.9,82.6 99.4,82.4 100.9,82.5 102.3,83.1 103.8,84.0 105.1,85.2 106.4,86.9 107.5,88.8 108.6,91.0 109.5,93.4 110.2,96.1 110.7,98.9 111.1,101.8 111.3,104.7 111.2,107.7 111.0,110.6 110.6,113.4 110.1,116.1 109.3,118.5 108.4,120.8 107.3,122.8 106.1,124.5 104.9,125.8 103.5,126.8 102.1,127.4" fill="none" stroke="#8fb8f0" stroke-width="1.5"/>
  <polyline points="140.0,105.0 139.2,120.6 136.9,134.9 133.3,147.6 128.5,158.0 122.8,166.0 116.4,171.3 109.6,173.8 102.7,173.5 96.0,170.5 89.7,165.1 84.0,157.6 79.2,148.3 75.4,137.6 72.7,126.2 71.2,114.3 70.9,102.5 71.7,91.3 73.6,81.1 76.4,72.2 80.1,64.9 84.4,59.5 89.1,56.1 94.1,54.7 99.1,55.3 103.9,57.9 108.5,62.2 112.5,68.0 115.8,75.0 118.4,82.9 120.2,91.4 121.1,100.1 121.2,108.6 120.4,116.6 118.9,123.9 116.7,130.2 113.9,135.2 110.7,138.8 107.2,141.0 103.5,141.7 99.9,140.9 96.4,138.8 93.2,135.4 90.4,131.0 88.0,125.7 86.2,119.8 85.1,113.6 84.5,107.3 84.6,101.1 85.3,95.3 86.5,90.2 88.2,85.8 90.3,82.3 92.7,79.9 95.3,78.5 98.0,78.3 100.6,79.1 103.1,80.8 105.4,83.5 107.4,86.8 109.0,90.8 110.3,95.2 111.0,99.7 111.3,104.3 111.2,108.8 110.6,112.9 109.6,116.5 108.3,119.6 106.7,122.0 104.9,123.6 103.0,124.4 101.1,124.4 99.1,123.7 97.3,122.3 95.7,120.2 94.3,117.7 93.2,114.7 92.4,111.5 91.9,108.1 91.8,104.8 91.9,101.6 92.4,98.6 93.2,96.1 94.2,93.9 95.4,92.3 96.7,91.3 98.1,90.8 99.5,90.9 100.9,91.5 102.2,92.7 103.4,94.3 104.3,96.2 105.1,98.4 105.7,100.8 106.0,103.2 106.0,105.7 105.8,108.0 105.4,110.1 104.8,111.9 104.1,113.3 103.2,114.4 102.2,115.1 101.2,115.4 100.1,115.2 99.1,114.7 98.2,113.8 97.4,112.5 96.7,111.1 96.2,109.4 95.8,107.7 95.6,105.9 95.6,104.1 95.8,102.5 96.1,101.0 96.6,99.7 97.2,98.7 97.8,98.0 98.6,97.6 99.3,97.4 100.1,97.6 100.8,98.1" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="140" cy="105" r="3.5" fill="#b4232c"/>
  <text x="160" y="100" font-size="11" fill="#1f2a44">x₁ (angle)</text>
  <text x="106" y="20" font-size="11" fill="#1f2a44">x₂ (rate)</text>
  <text x="200" y="60" font-size="12" fill="#1f2a44">ellipses: V = 6.3, 2, 0.5</text>
  <text x="200" y="80" font-size="12" fill="#1d6fd1">motion for 12 s</text>
  <text x="200" y="140" font-size="12" fill="#b4232c">start (1, 0), V = 6.3</text>
</svg>
```

Finding one such bowl is the whole proof: no simulation of every starting point is needed.
:::

::: context h-infinity What "worst-case gain" means
Shake a system with a disturbance — a gust, a sloshing tank — and measure how big the error comes out compared with how big the shaking went in. The ratio depends on how fast you shake. The $\mathcal{H}_\infty$ norm ("H infinity") is the biggest that ratio can get over every shaking frequency. A controller designed to keep it small is guaranteed to hold up against the nastiest disturbance of a given size, not only an average one.
:::

::: context damping Frequency and damping
A mode that is disturbed swings back and forth like a weight on a spring. The **natural frequency** $\omega$ is how fast it would swing with no friction, in radians per second; $\omega = 2\,\mathrm{rad/s}$ is a swing about every $3.1\,\mathrm{s}$. The **damping ratio** $\zeta$ says how quickly friction kills the swing: $0$ means it rings forever, $1$ means it settles with no overshoot. With $\zeta = 0.1$ the swing shrinks inside the envelope $e^{-\zeta\omega t} = e^{-0.2t}$, which is why the true decay rate in the example is $\zeta\omega = 0.2\,\mathrm{s^{-1}}$.
:::

::: context bisection Finding a number by halving
Bisection is the "higher or lower" guessing game. You know the best $\alpha$ lies between a value that works ($0$) and one that fails. Test the midpoint. If it works, it becomes the new lower end; if it fails, the new upper end. Each test halves the interval, so twenty tests narrow it by a factor of about a million.
:::

::: context sherman-morrison Inverting a matrix plus a sliver
The Sherman–Morrison formula says how the inverse of a matrix changes when you add a rank-one piece $\mathbf{w}\mathbf{w}^\top$:

$$
(\mathbf{D} + \mathbf{w}\mathbf{w}^\top)^{-1} = \mathbf{D}^{-1} - \frac{\mathbf{D}^{-1}\mathbf{w}\mathbf{w}^\top\mathbf{D}^{-1}}{1 + \mathbf{w}^\top\mathbf{D}^{-1}\mathbf{w}} .
$$

When $\mathbf{D}$ is diagonal, like the scaled sign-flip matrix here, its inverse is free, and the rest is a few dot products. That is why a second-order cone costs work proportional to its length, not its length cubed.
:::

::: context flops Counting in flops
A **flop** is one floating-point operation: one addition or multiplication of two decimal numbers. Engineers count flops to predict run time before writing code. A laptop core manages billions of flops per second. A radiation-hardened flight computer is many times slower, because its chips are built to survive radiation, not to be fast — which is exactly why a formulation that needs $10^9$ flops per step can never fly, and one that needs $10^6$ can.
:::

::: context entries-vs-eigenvalues Bowl or saddle
Draw the curve where $\mathbf{z}^\top\mathbf{X}\mathbf{z} = 1$ for each of the two matrices in the warning. For the PSD one it is a closed ellipse: the bowl rises in every direction. For the all-positive one it is a hyperbola: along the direction $(1, -1)$ the value goes *negative*, so that direction never reaches $1$ and the curve runs off to infinity.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="95" x2="150" y2="95" stroke="#6c7a93" stroke-width="1"/>
  <line x1="90" y1="35" x2="90" y2="155" stroke="#6c7a93" stroke-width="1"/>
  <polyline points="147.1,105.9 137.3,102.4 129.0,99.1 122.0,96.0 116.0,92.9 110.8,89.7 106.3,86.4 102.2,82.8 98.6,78.7 95.3,74.2 92.1,69.0 89.0,63.0 85.9,56.0 82.6,47.7 79.1,37.9" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polyline points="100.9,152.1 97.4,142.3 94.1,134.0 91.0,127.0 87.9,121.0 84.7,115.8 81.4,111.3 77.8,107.2 73.7,103.6 69.2,100.3 64.0,97.1 58.0,94.0 51.0,90.9 42.7,87.6 32.9,84.1" fill="none" stroke="#b4232c" stroke-width="2"/>
  <line x1="210" y1="95" x2="330" y2="95" stroke="#6c7a93" stroke-width="1"/>
  <line x1="270" y1="35" x2="270" y2="155" stroke="#6c7a93" stroke-width="1"/>
  <polygon points="228.7,120.5 227.6,117.0 228.1,112.5 230.3,107.5 233.9,101.9 239.0,96.1 245.2,90.2 252.4,84.5 260.3,79.2 268.5,74.6 276.8,70.7 284.8,67.7 292.3,65.8 298.9,65.0 304.4,65.4 308.6,66.9 311.3,69.5 312.4,73.0 311.9,77.5 309.7,82.5 306.1,88.1 301.0,93.9 294.8,99.8 287.6,105.5 279.7,110.8 271.5,115.4 263.2,119.3 255.2,122.3 247.7,124.2 241.1,125.0 235.6,124.6 231.4,123.1" fill="#8fb8f0" fill-opacity="0.4" stroke="#1d6fd1" stroke-width="2"/>
  <text x="90" y="178" font-size="12" text-anchor="middle" fill="#b4232c">[[1, 2], [2, 1]]: not PSD</text>
  <text x="270" y="178" font-size="12" text-anchor="middle" fill="#1d6fd1">[[1, −1], [−1, 2]]: PSD</text>
</svg>
```

The signs of the entries tell you nothing on their own. The eigenvalues decide.
:::

::: context wahba Wahba's problem
In 1965 the statistician Grace Wahba posed a short problem in *SIAM Review*: given a few directions measured in a spacecraft's own frame (the Sun, a star, Earth's magnetic field) and the same directions known in a reference frame, find the rotation that lines them up best. Every star tracker and Sun sensor attitude estimate solves some version of it. Its answer can be written as the top eigenvector of a $4 \times 4$ matrix — the same "maximize $\mathbf{x}^\top\mathbf{C}\mathbf{x}$ on the unit sphere" shape as the relaxation in this lesson.
:::
