---
id: l08-semidefinite-programming
title: Semidefinite programming
minutes: 28
covers:
  - semidefinite programming
---

There is one more rung on the ladder of convex problem classes, and it is the top of the ladder as far as practical solvers go. Replace the second-order cone by the cone of positive semidefinite matrices and you get the **semidefinite program** (SDP). Everything from the last two lessons survives the change: the feasible set is convex, the duality theory of lesson 7 applies word for word, and an interior-point method solves it in a bounded number of iterations.

What you buy is expressive power. A semidefinite constraint can say things no norm bound can say – that a matrix built from the decision variables has all its eigenvalues below a threshold, that a quadratic form is nonnegative everywhere, that a Lyapunov function exists proving a controller stable. These are the statements that stability analysis, robust control and reachability verification are made of, and the reason a GNC engineer meets SDP at all is that the standard tools of those fields – the linear matrix inequality, the $\mathcal{H}_\infty$ synthesis problem, the invariant ellipsoid, the sums-of-squares certificate – are SDPs underneath.

What you pay is cost. A second-order cone of dimension $n+1$ costs $O(n)$ work per interior-point iteration; a semidefinite cone of size $n \times n$ costs $O(n^3)$ and needs a matrix factorisation. That gap is the reason no SDP is solved onboard a vehicle today while SOCPs are, and why this lesson ends by pushing the landing problem firmly back down to the cone it belongs in.

## The cone of positive semidefinite matrices

Write $\mathbb{S}^n$ for the set of real symmetric $n \times n$ matrices, a vector space of dimension $n(n+1)/2$. A matrix $\mathbf{X} \in \mathbb{S}^n$ is **positive semidefinite**, written $\mathbf{X} \succeq 0$, if $\mathbf{z}^\top\mathbf{X}\mathbf{z} \ge 0$ for every $\mathbf{z} \in \mathbb{R}^n$; equivalently, if all its eigenvalues are nonnegative. It is **positive definite**, $\mathbf{X} \succ 0$, if the inequality is strict for every $\mathbf{z} \ne \mathbf{0}$, equivalently all eigenvalues positive. The notation $\mathbf{X} \succeq \mathbf{Y}$ means $\mathbf{X} - \mathbf{Y} \succeq 0$.

The set $\mathbb{S}^n_+ = \{\mathbf{X} \in \mathbb{S}^n : \mathbf{X} \succeq 0\}$ is a convex cone, and the proof is one line: if $\mathbf{X} \succeq 0$ and $\mathbf{Y} \succeq 0$ and $\theta \in [0,1]$, then for any $\mathbf{z}$,

$$
\mathbf{z}^\top\big(\theta\mathbf{X} + (1-\theta)\mathbf{Y}\big)\mathbf{z} = \theta\,\mathbf{z}^\top\mathbf{X}\mathbf{z} + (1-\theta)\,\mathbf{z}^\top\mathbf{Y}\mathbf{z} \ge 0 .
$$

Scaling by a positive number clearly preserves the property, so the set is a cone. Read the definition again and notice what makes it work: $\mathbf{X} \succeq 0$ is an infinite family of *linear* inequalities in the entries of $\mathbf{X}$, one for each $\mathbf{z}$. A convex set defined as an intersection of halfspaces – though infinitely many of them, which is why its boundary is curved rather than flat.

The natural inner product on $\mathbb{S}^n$ is $\langle \mathbf{X}, \mathbf{Y}\rangle = \operatorname{tr}(\mathbf{X}\mathbf{Y}) = \sum_{i,j} X_{ij}Y_{ij}$. In it, the PSD cone is **self-dual**, exactly like the nonnegative orthant and the second-order cone of lesson 7. The forward direction: if $\mathbf{X} \succeq 0$ and $\mathbf{Y} \succeq 0$, factor $\mathbf{X} = \mathbf{X}^{1/2}\mathbf{X}^{1/2}$ with $\mathbf{X}^{1/2}$ symmetric, and use the cyclic property of the trace,

$$
\operatorname{tr}(\mathbf{X}\mathbf{Y}) = \operatorname{tr}(\mathbf{X}^{1/2}\mathbf{Y}\mathbf{X}^{1/2}) \ge 0,
$$

because $\mathbf{X}^{1/2}\mathbf{Y}\mathbf{X}^{1/2}$ is positive semidefinite and the trace of a PSD matrix is a sum of nonnegative eigenvalues. The converse: if $\mathbf{Y}$ has a negative eigenvalue with unit eigenvector $\mathbf{z}$, then $\mathbf{X} = \mathbf{z}\mathbf{z}^\top \succeq 0$ gives $\operatorname{tr}(\mathbf{X}\mathbf{Y}) = \mathbf{z}^\top\mathbf{Y}\mathbf{z} < 0$. So the whole conic duality of lesson 7 – dual problem, weak duality, certificates – transfers to SDP unchanged.

## Standard form

> A **semidefinite program** is: minimise $\langle\mathbf{C}, \mathbf{X}\rangle$ over $\mathbf{X} \in \mathbb{S}^n$ subject to $\langle\mathbf{A}_i, \mathbf{X}\rangle = b_i$ for $i = 1,\dots,m$, and $\mathbf{X} \succeq 0$.

The decision variable is a matrix; the objective and the equality constraints are linear in its entries. This is the *standard* or *primal* form. The form you meet in control is the equivalent **inequality form**, in which the variable is a vector and the constraint is a **linear matrix inequality** (LMI):

$$
\text{minimise } \mathbf{c}^\top\mathbf{x} \quad \text{subject to} \quad \mathbf{F}(\mathbf{x}) = \mathbf{F}_0 + x_1\mathbf{F}_1 + \dots + x_n\mathbf{F}_n \succeq 0 ,
$$

with all $\mathbf{F}_i \in \mathbb{S}^k$ given. The map $\mathbf{x} \mapsto \mathbf{F}(\mathbf{x})$ is affine, so the feasible set is the preimage of a convex cone under an affine map, hence convex – the same argument that made the second-order cone constraint convex in lesson 6. Several LMIs are combined into one by stacking them as diagonal blocks, since a block-diagonal matrix is PSD exactly when every block is.

::: key The conic hierarchy
$\text{LP} \subset \text{QP} \subset \text{SOCP} \subset \text{SDP}$. Each class is a special case of the next: a linear inequality is a $1 \times 1$ LMI, a convex quadratic objective becomes a second-order cone constraint, and a second-order cone constraint $\|\mathbf{u}\|_2 \le t$ is the LMI $\begin{bmatrix} t\mathbf{I} & \mathbf{u} \\ \mathbf{u}^\top & t\end{bmatrix} \succeq 0$. Expressive power increases along the chain and so does the cost per iteration: $O(1)$, $O(n)$ and $O(n^3)$ respectively for a cone of size $n$.
:::

## The Schur complement

One lemma does most of the work of turning engineering statements into LMIs.

> **Schur complement**: let $\mathbf{M} = \begin{bmatrix} \mathbf{A} & \mathbf{B} \\ \mathbf{B}^\top & \mathbf{C}\end{bmatrix}$ be symmetric with $\mathbf{A} \succ 0$. Then $\mathbf{M} \succeq 0$ if and only if $\mathbf{C} - \mathbf{B}^\top\mathbf{A}^{-1}\mathbf{B} \succeq 0$.

The proof is completing the square. For any $(\mathbf{z}_1, \mathbf{z}_2)$,

$$
\begin{bmatrix}\mathbf{z}_1 \\ \mathbf{z}_2\end{bmatrix}^\top \mathbf{M} \begin{bmatrix}\mathbf{z}_1 \\ \mathbf{z}_2\end{bmatrix}
= \mathbf{z}_1^\top\mathbf{A}\mathbf{z}_1 + 2\mathbf{z}_1^\top\mathbf{B}\mathbf{z}_2 + \mathbf{z}_2^\top\mathbf{C}\mathbf{z}_2
= \|\mathbf{A}^{1/2}(\mathbf{z}_1 + \mathbf{A}^{-1}\mathbf{B}\mathbf{z}_2)\|_2^2 + \mathbf{z}_2^\top(\mathbf{C} - \mathbf{B}^\top\mathbf{A}^{-1}\mathbf{B})\mathbf{z}_2 .
$$

For fixed $\mathbf{z}_2$ the first term can be made zero by choosing $\mathbf{z}_1 = -\mathbf{A}^{-1}\mathbf{B}\mathbf{z}_2$ and is never negative, so the quadratic form is nonnegative for all $(\mathbf{z}_1,\mathbf{z}_2)$ exactly when the second term is nonnegative for all $\mathbf{z}_2$. The point of the lemma is that the *nonlinear* expression $\mathbf{C} - \mathbf{B}^\top\mathbf{A}^{-1}\mathbf{B}$ – a matrix inverse sandwiched between decision variables – becomes a *linear* matrix inequality once you lift it into the bigger matrix $\mathbf{M}$. Every quadratic-over-linear expression you meet in control is convexified this way.

::: example The second-order cone is a $3 \times 3$ LMI
Take $\mathbf{u} = (3, 4)$, so $\|\mathbf{u}\|_2 = 5$, and form the arrow matrix

$$
\mathbf{M}(t) = \begin{bmatrix} t & 0 & 3 \\ 0 & t & 4 \\ 3 & 4 & t \end{bmatrix} .
$$

Expanding along the first row, $\det \mathbf{M}(t) = t(t^2 - 16) - 0 + 3(0 - 3t) = t^3 - 25t = t(t^2 - 25)$, which vanishes at $t = 5$. The eigenvalues are available in closed form: one eigenvector lies in the $\mathbf{u}$-block orthogonal to $\mathbf{u}$ and gives eigenvalue $t$; the other two live in the plane spanned by $(\mathbf{u}/\|\mathbf{u}\|, 0)$ and $(0,0,1)$ and give $t \pm \|\mathbf{u}\|_2$. So at $t = 6$ the eigenvalues are $1, 6, 11$ – positive definite; at $t = 5$ they are $0, 5, 10$ – positive semidefinite, on the boundary; at $t = 4.5$ they are $-0.5, 4.5, 9.5$ – indefinite, so $\mathbf{M} \not\succeq 0$. The LMI is satisfied precisely when $t \ge \|\mathbf{u}\|_2 = 5$.

The Schur complement gives the same answer without eigenvalues. Take $\mathbf{A} = t\mathbf{I}_2 \succ 0$ (assuming $t > 0$), $\mathbf{B} = \mathbf{u}$, $\mathbf{C} = t$. Then $\mathbf{C} - \mathbf{B}^\top\mathbf{A}^{-1}\mathbf{B} = t - \|\mathbf{u}\|_2^2/t$, which is nonnegative exactly when $t^2 \ge \|\mathbf{u}\|_2^2$, that is $t \ge \|\mathbf{u}\|_2$. So every thrust-magnitude, pointing and glide-slope constraint of lesson 6 could be handed to an SDP solver as a $4 \times 4$ or $3 \times 3$ LMI. Every one of them *should not* be, for the cost reason below – but the embedding is what makes the hierarchy a hierarchy.
:::

## What semidefinite programming is for

The reason a GNC engineer needs SDP is not landing guidance. It is everything that happens before flight: proving a controller stable, bounding the effect of an uncertainty, sizing a reachable set.

**Lyapunov stability as an LMI.** A linear system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ is asymptotically stable if and only if there exists $\mathbf{P} \succ 0$ with $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} \prec 0$. Both conditions are linear in the unknown entries of $\mathbf{P}$: an LMI feasibility problem, i.e. an SDP with a zero objective. Given $\mathbf{P}$, the function $V(\mathbf{x}) = \mathbf{x}^\top\mathbf{P}\mathbf{x}$ is a certificate of stability that a reviewer can check by multiplying matrices – the same idea as the duality certificates of lesson 7, one level up.

**Robust stability.** If the plant matrix is uncertain but known to lie in the convex hull of a few vertices $\mathbf{A}_1, \dots, \mathbf{A}_q$ – a gain that drifts, an inertia that changes as propellant drains – then asking for a single $\mathbf{P}$ satisfying $\mathbf{A}_k^\top\mathbf{P} + \mathbf{P}\mathbf{A}_k \prec 0$ for every $k$ proves stability for every plant in the hull at once, because the inequality is affine in $\mathbf{A}$. One SDP with $q$ LMI blocks replaces an infinite family of stability checks. This is the standard way to certify an attitude controller against inertia uncertainty.

**Performance synthesis.** The $\mathcal{H}_\infty$ problem – design a controller minimising the worst-case gain from disturbance to error – is an SDP after a change of variables (the bounded real lemma, itself a Schur complement of the Lyapunov inequality). So is the $\mathcal{H}_2$ problem, and so is the mixed version. This is where most of the control literature's LMIs come from.

**Reachable sets and funnels.** An invariant ellipsoid $\{\mathbf{x} : \mathbf{x}^\top\mathbf{P}\mathbf{x} \le 1\}$ that contains the reachable set of a disturbed system, or a "funnel" around a nominal trajectory that a nonlinear system provably cannot leave, is found by an SDP; for polynomial dynamics the sums-of-squares machinery reduces the check "this polynomial is nonnegative" to "this coefficient matrix is PSD", again an SDP. Verification of a landing controller against the full nonlinear dynamics uses exactly this.

**Covariance steering.** Guidance that treats the state as a Gaussian and steers its covariance, rather than a single trajectory, has a covariance matrix as a decision variable and the constraint that it stay PSD. Chance constraints of the form "the probability of violating the glide slope is below $10^{-3}$" become semidefinite or second-order cone constraints on that matrix.

::: example A Lyapunov certificate for a lightly damped mode
A flexible mode or a lightly damped attitude loop has $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ with

$$
\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -\omega^2 & -2\zeta\omega \end{bmatrix}, \qquad \omega = 2\,\mathrm{rad/s},\ \zeta = 0.1,
$$

so $\mathbf{A} = \begin{bmatrix} 0 & 1 \\ -4 & -0.4\end{bmatrix}$ and the eigenvalues are $-0.2 \pm 1.99i$: the envelope decays as $e^{-0.2t}$, a time constant of $5\,\mathrm{s}$.

**Fix $\mathbf{Q}$ and solve.** Setting $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} = -\mathbf{I}$ is three linear equations in the three unknowns $P_{11}, P_{12}, P_{22}$, and the solution is

$$
\mathbf{P} = \begin{bmatrix} 6.3 & 0.125 \\ 0.125 & 1.5625\end{bmatrix} .
$$

Check it: the leading minors are $6.3 > 0$ and $\det\mathbf{P} = 6.3 \times 1.5625 - 0.125^2 = 9.828 > 0$, so $\mathbf{P} \succ 0$ and the system is stable – a certificate obtained without computing a single eigenvalue of $\mathbf{A}$. The eigenvalues of $\mathbf{P}$ are $1.559$ and $6.303$. Now extract a decay rate. Along a trajectory, $\dot V = \mathbf{x}^\top(\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A})\mathbf{x} = -\|\mathbf{x}\|_2^2 \le -V/\lambda_{\max}(\mathbf{P})$, so $V$ decays at least as fast as $e^{-t/6.303}$ and $\|\mathbf{x}\|$, which goes as $\sqrt{V}$, decays at least as fast as $e^{-\alpha t}$ with

$$
\alpha = \frac{\lambda_{\min}(\mathbf{Q})}{2\,\lambda_{\max}(\mathbf{P})} = \frac{1}{2 \times 6.303} = 0.0793\ \mathrm{s^{-1}} .
$$

True but weak: the guaranteed time constant is $12.6\,\mathrm{s}$ against an actual $5\,\mathrm{s}$, a factor of $2.5$ of conservatism. Choosing $\mathbf{Q} = \operatorname{diag}(4, 1)$ instead gives $\mathbf{P} = \begin{bmatrix} 10.2 & 0.5 \\ 0.5 & 2.5\end{bmatrix}$ and $\alpha = 0.0489\,\mathrm{s^{-1}}$ – worse. Guessing $\mathbf{Q}$ is a bad way to get a tight bound.

**Optimise over $\mathbf{P}$ instead.** Ask directly for the largest $\alpha$ such that some $\mathbf{P} \succ 0$ satisfies

$$
\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} + 2\alpha\mathbf{P} \preceq 0 .
$$

For fixed $\alpha$ this is an LMI in $\mathbf{P}$ – feasible or not – so the largest $\alpha$ is found by bisection, one SDP feasibility solve per bisection step. Equivalently, solve the shifted Lyapunov equation for $\mathbf{A} + \alpha\mathbf{I}$ and ask whether the answer is positive definite. Doing that: at $\alpha = 0.15$ the solution is $\mathbf{P} = \begin{bmatrix} 25.3 & 1.07 \\ 1.07 & 6.29\end{bmatrix}$ with eigenvalues $6.23$ and $25.3$, positive definite; at $\alpha = 0.199$ it is positive definite with eigenvalues $311$ and $1267$ – the matrix is blowing up as the bound tightens; at $\alpha = 0.2001$ the solution has eigenvalues $-12670$ and $-3115$, not positive definite. The bisection converges to $\alpha^\star = 0.2\,\mathrm{s^{-1}}$, which is exactly $\zeta\omega$, the true decay rate. Optimising over the certificate recovers the truth; fixing $\mathbf{Q}$ by hand throws away a factor of $2.5$.
:::

## The price of the matrix cone

An interior-point method (lesson 9) works by replacing the cone constraint with a smooth barrier function that blows up at the boundary, and taking Newton steps. The barriers are

$$
-\sum_i \log s_i \ \ (\text{orthant}), \qquad -\log(t^2 - \|\mathbf{u}\|_2^2) \ \ (\text{second-order cone}), \qquad -\log\det\mathbf{X} \ \ (\text{PSD cone}),
$$

and two numbers decide everything. The first is the **barrier parameter** $\nu$, which enters the iteration bound $O(\sqrt{\nu}\log(1/\epsilon))$: it is $m$ for an orthant of dimension $m$, $n$ for an $n \times n$ PSD cone, and – remarkably – $2$ for a second-order cone of *any* dimension. The second is the cost of one Newton step. For the second-order cone, the Hessian of the barrier works out to $\frac{2}{s}\mathbf{J} + \frac{4}{s^2}\mathbf{w}\mathbf{w}^\top$ with $s = t^2 - \|\mathbf{u}\|^2$, $\mathbf{J} = \operatorname{diag}(\mathbf{I}, -1)$ and $\mathbf{w} = (\mathbf{u}, -t)$: a scaled signature matrix plus a rank-one term, which the Sherman–Morrison formula inverts in $O(n)$ arithmetic with no factorisation at all. For the PSD cone, the Hessian of $-\log\det$ involves $\mathbf{X}^{-1}$, so every iteration needs a Cholesky factorisation of an $n \times n$ matrix and several matrix multiplications.

::: example Counting the work in an SDP iteration
For an SDP with one $n \times n$ block and $m$ equality constraints, an interior-point iteration forms and solves the $m \times m$ Schur complement system. Forming it costs about $mn^3 + m^2n^2$ operations and solving it about $m^3$. For a middling problem, $n = 50$ and $m = 500$:

$$
mn^3 = 6.25\times10^7, \qquad m^2n^2 = 6.25\times10^8, \qquad m^3 = 1.25\times10^8,
$$

about $8.1\times10^8$ floating-point operations per iteration. At an effective $1\,\mathrm{GFLOP/s}$ – optimistic for a flight processor, pessimistic for a workstation – that is $0.81\,\mathrm{s}$ per iteration and roughly $20\,\mathrm{s}$ for a $25$-iteration solve. Double $n$ and $m$ and the dominant $m^2n^2$ term grows by $16$: about $1.2\times10^{10}$ operations per iteration.

Compare the landing SOCP of lesson 6: $401$ cones, none larger than dimension $4$, whose barrier Hessians are inverted in closed form. There is no $n^3$ anywhere, the whole problem is sparse and banded, and lesson 12 counts the result at around $10^6$ operations per iteration. That is close to three orders of magnitude cheaper, and it is why the flight formulation is written with norms rather than matrices.
:::

::: warning $\mathbf{X} \succeq 0$ is not "every entry of $\mathbf{X}$ is nonnegative"
The matrix $\begin{bmatrix} 1 & 2 \\ 2 & 1\end{bmatrix}$ has all entries positive and eigenvalues $3$ and $-1$: it is not PSD. The matrix $\begin{bmatrix} 1 & -1 \\ -1 & 2\end{bmatrix}$ has a negative entry and eigenvalues $0.382$ and $2.618$: it is PSD. The relation $\succeq$ is a partial order, not a componentwise one, and it is *partial*: two symmetric matrices can be incomparable, with neither $\mathbf{X} - \mathbf{Y}$ nor $\mathbf{Y} - \mathbf{X}$ semidefinite. That is why you cannot "sort" LMI constraints or take a maximum of them the way you can with scalars, and why a diagonal stacking is the only general way to combine several.
:::

::: note Tight relaxations of nonconvex problems
Lesson 6 warned that dropping a nonconvex constraint rarely leaves the optimum where you want it. SDP supplies the main family of exceptions. The nonconvex problem "maximise $\mathbf{x}^\top\mathbf{C}\mathbf{x}$ subject to $\|\mathbf{x}\|_2 = 1$" is, after substituting $\mathbf{X} = \mathbf{x}\mathbf{x}^\top$, the SDP "maximise $\langle\mathbf{C}, \mathbf{X}\rangle$ subject to $\operatorname{tr}\mathbf{X} = 1$, $\mathbf{X} \succeq 0$" with the nonconvex rank-one requirement dropped. The relaxation is exact – its optimum is attained at a rank-one $\mathbf{X}$ – and the value is $\lambda_{\max}(\mathbf{C})$. For $\mathbf{C} = \begin{bmatrix} 2 & 1 \\ 1 & 3\end{bmatrix}$ the eigenvalues are $1.382$ and $3.618$, so the answer is $3.618$, achieved by the corresponding eigenvector. Attitude determination from vector observations (Wahba's problem) and several pointing-constraint problems have the same shape, and their SDP relaxations are tight in practice. This is a design-time tool, not a flight one.
:::

## Check yourself

::: check
Write the constraint "the largest eigenvalue of the symmetric matrix $\mathbf{S}(\mathbf{x}) = \mathbf{S}_0 + x_1\mathbf{S}_1 + x_2\mathbf{S}_2$ is at most $\gamma$" as an LMI. Why is $\lambda_{\max}$ a convex function of $\mathbf{x}$?
:::

::: answer
The constraint is $\gamma\mathbf{I} - \mathbf{S}(\mathbf{x}) \succeq 0$, which is affine in $(\mathbf{x}, \gamma)$ and therefore an LMI: all eigenvalues of $\mathbf{S}$ are at most $\gamma$ exactly when $\gamma\mathbf{I} - \mathbf{S}$ has no negative eigenvalue. Minimising $\gamma$ subject to it is an SDP whose optimal value is $\lambda_{\max}(\mathbf{S}(\mathbf{x}))$. Convexity follows from the variational characterisation $\lambda_{\max}(\mathbf{S}) = \sup_{\|\mathbf{z}\|=1}\mathbf{z}^\top\mathbf{S}\mathbf{z}$: for each fixed $\mathbf{z}$ the map $\mathbf{x} \mapsto \mathbf{z}^\top\mathbf{S}(\mathbf{x})\mathbf{z}$ is affine, and a pointwise supremum of affine functions is convex, by the closure rule of lesson 3. Note that $\lambda_{\min}$ is concave by the same argument with an infimum, and that an individual eigenvalue in the middle of the spectrum is neither.
:::

::: check
Use the Schur complement to write $\|\mathbf{M}\mathbf{x} - \mathbf{y}\|_2^2 \le t$ as an LMI, and say why you would still prefer the second-order cone form of lesson 6.
:::

::: answer
Put $\mathbf{r} = \mathbf{M}\mathbf{x} - \mathbf{y}$. Then $\|\mathbf{r}\|_2^2 \le t$ is $t - \mathbf{r}^\top\mathbf{I}^{-1}\mathbf{r} \ge 0$, which by the Schur complement with $\mathbf{A} = \mathbf{I}$ is
$$
\begin{bmatrix} \mathbf{I} & \mathbf{r} \\ \mathbf{r}^\top & t\end{bmatrix} \succeq 0,
$$
an LMI of size $(\dim\mathbf{r} + 1)$, affine in $(\mathbf{x}, t)$. It is correct and it is useless in practice: a solver handed this must factor a matrix of that size every iteration, whereas the identical statement $\|(2\mathbf{r}, 1-t)\|_2 \le 1+t$ is a single second-order cone whose barrier Hessian inverts in linear time. Always push a constraint down to the smallest cone that can express it; the hierarchy is a statement about expressiveness, not about what you should use.
:::

::: check
An attitude controller must be stable for every inertia in the convex hull of three extreme cases $\mathbf{A}_1, \mathbf{A}_2, \mathbf{A}_3$. Write the SDP, and explain why solving three separate Lyapunov equations is not the same thing.
:::

::: answer
Find $\mathbf{P}$ subject to $\mathbf{P} \succeq \mathbf{I}$ (a normalisation that makes "positive definite" a closed condition) and $\mathbf{A}_k^\top\mathbf{P} + \mathbf{P}\mathbf{A}_k \preceq -\mathbf{I}$ for $k = 1, 2, 3$: four LMI blocks, affine in the entries of $\mathbf{P}$, zero objective. If such a $\mathbf{P}$ exists then for any $\mathbf{A} = \sum_k\theta_k\mathbf{A}_k$ with $\theta_k \ge 0$ summing to one, $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} = \sum_k\theta_k(\mathbf{A}_k^\top\mathbf{P} + \mathbf{P}\mathbf{A}_k) \preceq -\mathbf{I}$, so the same $\mathbf{P}$ certifies the whole hull. Solving three separate Lyapunov equations gives three different $\mathbf{P}_k$, each certifying only its own vertex; a system that switches or drifts among the vertices can be unstable even when every frozen vertex is stable, and no argument combines the three certificates. The shared $\mathbf{P}$ is the whole point, and it is also why the SDP can be infeasible when each vertex alone is fine – quadratic stability is sufficient, not necessary.
:::

::: check
The PSD cone has barrier parameter $\nu = n$ and the second-order cone has $\nu = 2$ regardless of dimension. Using the $O(\sqrt{\nu}\log(1/\epsilon))$ iteration bound, compare the predicted iteration counts for the landing problem of lesson 6 written as an SOCP with $401$ cones versus as an SDP with $401$ blocks of size $4$.
:::

::: answer
Barrier parameters add over a product of cones. As an SOCP, $\nu = 2 \times 401 = 802$, so $\sqrt{\nu} = 28.3$. As an SDP with $4 \times 4$ blocks, $\nu = 4 \times 401 = 1604$, so $\sqrt{\nu} = 40.0$. With $\log(1/\epsilon) = 13.8$ for $\epsilon = 10^{-6}$, the bounds are about $391$ and $553$ iterations respectively – only a factor $1.4$ apart, and both far above the few tens actually observed. The iteration count is *not* where SDP loses. It loses on the cost of each iteration: $O(n^3)$ factorisations and dense Schur complement assembly instead of closed-form rank-one updates. When comparing formulations, count the work per iteration first and the iteration bound second.
:::

::: check
Why does the self-duality of the PSD cone matter for a solver, and what is the dual of the standard-form SDP?
:::

::: answer
Following the conic template of lesson 7 with $\mathcal{K} = \mathbb{S}^n_+$ and $\mathcal{K}^* = \mathbb{S}^n_+$: the dual of "minimise $\langle\mathbf{C},\mathbf{X}\rangle$ s.t. $\langle\mathbf{A}_i,\mathbf{X}\rangle = b_i$, $\mathbf{X} \succeq 0$" is "maximise $\mathbf{b}^\top\mathbf{y}$ s.t. $\mathbf{C} - \sum_i y_i\mathbf{A}_i \succeq 0$" – a vector problem with one LMI, which is exactly the inequality form. Standard form and inequality form are duals of each other. Self-duality matters because a primal-dual interior-point method must keep both iterates inside their cones and take steps that respect both; when the cones are the same, one set of barrier and scaling formulas serves both sides, and the symmetric scaling that makes the method work exists. Cones without this property – the exponential cone, for instance – need asymmetric algorithms and are harder to solve reliably.
:::

## Summary

| Object | Statement |
| --- | --- |
| PSD cone | $\mathbb{S}^n_+ = \{\mathbf{X} = \mathbf{X}^\top : \mathbf{z}^\top\mathbf{X}\mathbf{z} \ge 0\ \forall\mathbf{z}\}$; convex, self-dual under $\langle\mathbf{X},\mathbf{Y}\rangle = \operatorname{tr}(\mathbf{X}\mathbf{Y})$ |
| SDP standard form | minimise $\langle\mathbf{C},\mathbf{X}\rangle$ s.t. $\langle\mathbf{A}_i,\mathbf{X}\rangle = b_i$, $\mathbf{X} \succeq 0$ |
| LMI form | minimise $\mathbf{c}^\top\mathbf{x}$ s.t. $\mathbf{F}_0 + \sum_i x_i\mathbf{F}_i \succeq 0$; the two forms are duals |
| Hierarchy | LP $\subset$ QP $\subset$ SOCP $\subset$ SDP; $\|\mathbf{u}\|_2 \le t \Leftrightarrow \begin{bmatrix} t\mathbf{I} & \mathbf{u} \\ \mathbf{u}^\top & t\end{bmatrix} \succeq 0$ |
| Schur complement | $\begin{bmatrix}\mathbf{A} & \mathbf{B}\\ \mathbf{B}^\top & \mathbf{C}\end{bmatrix} \succeq 0 \Leftrightarrow \mathbf{C} - \mathbf{B}^\top\mathbf{A}^{-1}\mathbf{B} \succeq 0$ when $\mathbf{A} \succ 0$ |
| Lyapunov LMI | $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$ stable iff $\exists\,\mathbf{P} \succ 0$ with $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} \prec 0$; decay rate from $\mathbf{A}^\top\mathbf{P} + \mathbf{P}\mathbf{A} + 2\alpha\mathbf{P} \preceq 0$ |
| Worked certificate | $\omega = 2$, $\zeta = 0.1$: $\mathbf{Q} = \mathbf{I}$ gives $\alpha = 0.0793\,\mathrm{s^{-1}}$; optimising over $\mathbf{P}$ gives $\alpha^\star = 0.2\,\mathrm{s^{-1}} = \zeta\omega$ |
| Barrier parameters | $\nu = m$ (orthant), $\nu = 2$ (second-order cone, any dimension), $\nu = n$ ($n \times n$ PSD) |
| Cost per iteration | $O(n)$ for a second-order cone (rank-one Hessian, Sherman–Morrison); $O(n^3)$ plus $O(m^2n^2 + m^3)$ for SDP |
| Example cost | $n = 50$, $m = 500$: about $8.1\times10^8$ flops per iteration, $\approx 20\,\mathrm{s}$ for $25$ iterations at $1\,\mathrm{GFLOP/s}$ |
| Where it is used | Stability and robustness certificates, $\mathcal{H}_\infty$ synthesis, invariant ellipsoids and funnels, covariance steering, tight relaxations – all before flight, none onboard |

With the classes named and duality in hand, the next lesson gives the algorithm: the interior-point method that solves LP, QP, SOCP and SDP by the same barrier construction, follows the central path, and terminates in the bounded iteration count that lesson 4 promised.
