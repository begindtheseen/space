---
id: l10-wahba-stated-and-solved
title: "Wahba's problem, stated and solved four ways"
minutes: 18
covers:
  - "attitude determination: Wahba’s problem stated formally"
  - "solutions to Wahba: Davenport’s q-method, the SVD method, QUEST, and TRIAD as the degenerate two-vector case"
---

Every attitude sensor a spacecraft carries reports the same kind of fact: a direction, in body axes. A sun sensor says where the Sun is. A magnetometer says which way the local field points. A star tracker says where a catalogued star sits. In every case a model already says where that same physical direction points in a frame that does not rotate with the vehicle — an ephemeris, a field model, a star catalogue. Attitude determination is the problem of finding the single rotation that reconciles all of those pairs at once.

Grace Wahba posed exactly that problem in 1965, and the domain round asks about it in two parts. First: *state it.* That is a recall question with a precise answer and it is worth being able to write in one line. Second: *how would you solve it?* That is a question about four named methods, what distinguishes them, and — the part that separates answers — why the oldest one is not optimal.

## The problem, stated formally

Let $\mathbf{r}_1,\ldots,\mathbf{r}_k$ be unit vectors known in a reference frame and $\mathbf{b}_1,\ldots,\mathbf{b}_k$ the same physical directions as measured in the body frame, related by the true attitude matrix $\mathbf{A} \in SO(3)$ through $\mathbf{b}_i = \mathbf{A}\mathbf{r}_i$ plus noise. Give each observation a weight $a_i > 0$. Then

$$\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)}\ \tfrac12\sum_{i=1}^{k} a_i\left\lVert \mathbf{b}_i - \mathbf{A}\mathbf{r}_i \right\rVert^2.$$

Three things to say as you write it, because each is a place an interviewer will probe.

**The weights.** $a_i$ plays the role $1/\sigma_i^2$ plays in any weighted least-squares problem: larger for a more accurate sensor. A star tracker good to arcseconds and a magnetometer good to a degree do not get equal say.

**The constraint is in the search set, not in the cost.** $\mathbf{A}$ ranges over $SO(3)$, which means $\mathbf{A}^{\mathsf{T}}\mathbf{A} = \mathbf{I}$ *and* $\det\mathbf{A} = +1$. Relax the determinant condition and this is the orthogonal Procrustes problem, whose solution can be a reflection. Wahba's contribution was to insist on proper rotations.

**The degrees of freedom.** $SO(3)$ has three. A unit-vector observation supplies only **two** independent constraints, because a direction on a sphere has two degrees of freedom and the vector's own length carries no information. So one pair can never determine an attitude: the rotation about the observed direction itself is completely free, contributing nothing to the cost. Two non-parallel pairs give four constraints for three unknowns and are enough — provided they are genuinely non-parallel, since as they approach parallel the cost's sensitivity to rotation about the shared axis goes to zero and noise takes over.

::: key Wahba's problem
$\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)} \tfrac12\sum_i a_i\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2$, given weighted vector observations $\mathbf{b}_i$ in the body frame and their references $\mathbf{r}_i$ in the inertial frame. It is the least-squares attitude determination problem: orthogonal Procrustes restricted to proper rotations.
:::

## The trace form every solver works from

Two lines of algebra turn the cost into something tractable, and knowing them is what lets you explain all four methods as variations on one idea rather than as four recipes.

Because $\mathbf{b}_i$ and $\mathbf{r}_i$ are unit vectors and $\mathbf{A}$ is orthogonal, $\lVert\mathbf{A}\mathbf{r}_i\rVert = 1$, so each term expands to

$$\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2 = 1 - 2\,\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i + 1 = 2 - 2\,\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i.$$

Summing with weights, the cost is $\sum_i a_i - \sum_i a_i\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i$. The first term does not depend on $\mathbf{A}$ at all, so minimising the cost is exactly maximising the second. Writing each scalar as a trace and collecting the sum into one matrix gives

$$\hat{\mathbf{A}} = \arg\max_{\mathbf{A}\in SO(3)}\operatorname{trace}\!\left(\mathbf{A}\mathbf{B}^{\mathsf{T}}\right), \qquad \mathbf{B} = \sum_i a_i\,\mathbf{b}_i\mathbf{r}_i^{\mathsf{T}},$$

where $\mathbf{B}$ is the **attitude profile matrix**: a single $3\times3$ object that compresses every measurement losslessly, so the individual observations can be discarded once it is formed. The minimum cost is then $\sum_i a_i - \max\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$.

::: key The attitude profile matrix
$\mathbf{B} = \sum_i a_i\mathbf{b}_i\mathbf{r}_i^{\mathsf{T}}$. Minimising the Wahba cost is equivalent to maximising $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$, and every optimal solver is a different way of doing that one maximisation.
:::

## Four solutions

### TRIAD: a construction, not an optimisation

Given exactly two pairs, with $(\mathbf{b}_1,\mathbf{r}_1)$ the more trustworthy, build an orthonormal right-handed triad in each frame from the primary vector and the plane the two span:

$$\mathbf{t}_1 = \mathbf{r}_1, \qquad \mathbf{t}_2 = \frac{\mathbf{r}_1\times\mathbf{r}_2}{\lVert\mathbf{r}_1\times\mathbf{r}_2\rVert}, \qquad \mathbf{t}_3 = \mathbf{t}_1\times\mathbf{t}_2,$$

and identically on $\mathbf{b}_1,\mathbf{b}_2$ to get $\mathbf{s}_1,\mathbf{s}_2,\mathbf{s}_3$. With $\mathbf{M}_r = (\mathbf{t}_1\ \mathbf{t}_2\ \mathbf{t}_3)$ and $\mathbf{M}_b = (\mathbf{s}_1\ \mathbf{s}_2\ \mathbf{s}_3)$, both orthonormal by construction,

$$\hat{\mathbf{A}} = \mathbf{M}_b\mathbf{M}_r^{\mathsf{T}}.$$

No weights, no iteration, no eigenvalues, and a third vector cannot be used at all. **Why it is not optimal:** the construction matches $\mathbf{r}_1$ to $\mathbf{b}_1$ *exactly* — it trusts the primary vector completely — and uses the second vector only to fix the remaining rotation about that axis, discarding the component of the second observation along the first. The Wahba cost would distribute the error between the two according to their weights instead.

### The SVD method

Take the ordinary singular value decomposition $\mathbf{B} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^{\mathsf{T}}$ with $\sigma_1 \ge \sigma_2 \ge \sigma_3 \ge 0$. The maximiser is

$$\hat{\mathbf{A}} = \mathbf{U}\operatorname{diag}\!\left(1,\ 1,\ \det\mathbf{U}\det\mathbf{V}\right)\mathbf{V}^{\mathsf{T}}.$$

The reasoning in one sentence: substituting $\mathbf{M} = \mathbf{U}^{\mathsf{T}}\mathbf{A}\mathbf{V}$ turns the objective into $\sum_i M_{ii}\sigma_i$, every diagonal entry of an orthogonal matrix is at most $1$ in magnitude, so the unconstrained maximiser is $\mathbf{M} = \mathbf{I}$ — and the $\det$ factor is what repairs the case where that would be a reflection, sacrificing the smallest singular value rather than a larger one. It is the most numerically robust of the methods and needs no attitude-specific machinery.

### Davenport's q-method

Parameterise $\mathbf{A}$ by a unit quaternion instead. Expanding $\operatorname{trace}(\mathbf{A}(\mathbf{q})\mathbf{B}^{\mathsf{T}})$ turns it into a quadratic form $\mathbf{q}^{\mathsf{T}}\mathbf{K}\mathbf{q}$ with the symmetric $4\times4$

$$\mathbf{K} = \begin{pmatrix}\operatorname{trace}(\mathbf{B}) & \mathbf{z}^{\mathsf{T}} \\ \mathbf{z} & \mathbf{B} + \mathbf{B}^{\mathsf{T}} - \operatorname{trace}(\mathbf{B})\mathbf{I}\end{pmatrix}, \qquad \mathbf{z} = \begin{pmatrix}B_{32} - B_{23}\\ B_{13} - B_{31}\\ B_{21} - B_{12}\end{pmatrix}$$

for scalar-first quaternions. Since $\lVert\mathbf{q}\rVert = 1$, maximising $\mathbf{q}^{\mathsf{T}}\mathbf{K}\mathbf{q}$ is a Rayleigh-quotient problem: **the answer is the eigenvector of $\mathbf{K}$ belonging to its largest eigenvalue**, and that eigenvalue is the maximum of $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$ itself. It handles any number of vectors with any weights, with no special cases.

### QUEST

QUEST solves the same eigenvalue problem without an eigendecomposition, which is what made it flyable on 1970s and 1980s hardware. The trick is that on noiseless data $\lambda_{\max} = \sum_i a_i$ exactly, and with real noise it stays close, so $\lambda_0 = \sum_i a_i$ is an excellent starting point for **Newton's method on the characteristic polynomial** $\det(\mathbf{K} - \lambda\mathbf{I}) = 0$ — usually two or three iterations. Once $\lambda_{\max}$ is known, the attitude follows from a $3\times3$ linear solve for the classical Rodrigues parameters,

$$\mathbf{q}_{\mathrm{CRP}} = \left[(\lambda_{\max} + \sigma)\mathbf{I} - \mathbf{S}\right]^{-1}\mathbf{z}, \qquad \mathbf{S} = \mathbf{B} + \mathbf{B}^{\mathsf{T}}, \quad \sigma = \operatorname{trace}(\mathbf{B}),$$

rather than a $4\times4$ eigenvector. It is approximate only in the Newton iteration, which converges to machine precision, so in practice it agrees with the q-method.

::: key The four solutions
Davenport's q-method finds the maximum eigenvector of a $4\times4$ $\mathbf{K}$ matrix built from $\mathbf{B}$. The SVD method decomposes the attitude profile matrix $\mathbf{B}$ directly. QUEST solves the q-method eigenvalue approximately and quickly, by Newton iteration from $\lambda_0 = \sum_i a_i$. TRIAD is the deterministic two-vector construction and is not optimal, because it uses the primary vector exactly and discards information from the second.
:::

::: example How much does TRIAD actually cost you?
Two reference directions $60^\circ$ apart, a true attitude of $32^\circ$ about an arbitrary axis, per-axis Gaussian noise applied to each body observation, weights $a_i = 1/\sigma_i^2$, and $40\,000$ trials at each setting. The figure reported is the RMS angle between the estimated and true attitude.

**Equal-accuracy sensors, $\sigma_1 = \sigma_2 = 0.5^\circ$:**

| Method | RMS attitude error |
| --- | --- |
| TRIAD, first vector primary | $0.9592^\circ$ |
| TRIAD, second vector primary | $0.9608^\circ$ |
| Optimal (SVD or q-method) | $0.8923^\circ$ |

TRIAD is worse by $0.9592/0.8923 = 1.075$, about seven and a half percent in RMS, and it does not matter which vector you call primary because they are equally good. That is the honest size of TRIAD's sub-optimality: real, measurable, and not a catastrophe.

**Unequal sensors, $\sigma_1 = 0.2^\circ$ and $\sigma_2 = 1.0^\circ$:**

| Method | RMS attitude error |
| --- | --- |
| TRIAD, accurate vector primary | $1.1971^\circ$ |
| TRIAD, coarse vector primary | $1.5497^\circ$ |
| Optimal, correct weights $1/\sigma_i^2$ | $1.1964^\circ$ |
| Optimal, equal weights | $1.2865^\circ$ |

Three readings. TRIAD with the accurate sensor primary is within $0.1\%$ of optimal — because trusting the good vector exactly is very nearly the right thing to do when one sensor dominates, which is the regime TRIAD was designed for. TRIAD with the *wrong* primary is $30\%$ worse, so the choice of primary matters far more than the choice of method. And an optimal solver run with equal weights instead of $1/\sigma_i^2$ is $7.5\%$ worse — exactly the same penalty as using TRIAD in the equal-accuracy case. **Getting the weights right matters as much as choosing the optimal algorithm.**

One identity worth checking on clean data: with noiseless observations the largest eigenvalue of $\mathbf{K}$ equals $\sum_i a_i$ to machine precision, and it also equals the sum of the singular values of $\mathbf{B}$ and the achieved $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$. With real noise the three still agree with each other — they are the same quantity — and sit slightly below $\sum_i a_i$, the gap being the residual cost the noise forces.
:::

::: example "State Wahba's problem, then tell me why TRIAD is not a solution to it"
**A weak answer:** "Wahba's problem is finding the attitude that best fits a set of vector measurements. TRIAD is a way of solving it with two vectors, using cross products. It is not optimal because it only uses two vectors."

The statement is vague where it should be exact, and the reason given for sub-optimality is wrong: TRIAD would still not be optimal with exactly two vectors, which is the only case it handles.

**A strong answer:**

"The problem first. Given unit vectors $\mathbf{r}_i$ known in a reference frame and the same directions $\mathbf{b}_i$ measured in the body frame, with weights $a_i$ that go like one over the sensor variance, find

$$\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)} \tfrac12\sum_i a_i\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2.$$

The constraint lives in the search set — $\mathbf{A}$ orthogonal with determinant plus one — not in the cost. Without the determinant condition it is the orthogonal Procrustes problem and the answer can come back a reflection.

It is worth converting immediately, because every solver works from the converted form. The vectors are unit and $\mathbf{A}$ is orthogonal, so each squared term is $2 - 2\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i$, and the cost becomes $\sum a_i - \operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$ with $\mathbf{B} = \sum a_i\mathbf{b}_i\mathbf{r}_i^{\mathsf{T}}$. So minimising the cost is maximising a trace over $SO(3)$, and all the data has been compressed into one three-by-three matrix.

Now TRIAD. It is a construction, not an optimisation: build an orthonormal triad in each frame from the primary vector and the normalised cross product of the two, and the attitude is $\mathbf{M}_b\mathbf{M}_r^{\mathsf{T}}$. Notice what that does — it sends $\mathbf{r}_1$ to $\mathbf{b}_1$ *exactly*. The primary observation is treated as error-free, and the second vector is used only to fix the rotation about it, so the component of the second observation along the first is thrown away entirely. Nothing in the construction references the weights, and nothing in it can absorb a third vector.

The optimal methods distribute the residual between the observations according to the weights instead, which is why they win. The size of the win is modest and worth knowing: with two equally accurate sensors sixty degrees apart, TRIAD's RMS attitude error is about seven and a half percent above the optimum. And in the limit where one sensor is far better than the other, TRIAD with the good vector primary is essentially optimal — which makes sense, because trusting the good vector exactly is then almost the right thing to do.

If I had to pick in flight software: the SVD method if I want robustness and have the cycles, Davenport's q-method if I want a quaternion out directly and any number of vectors in, QUEST if the cycles are tight, and TRIAD only for a coarse two-vector solution or as an initial guess."

**What the interviewer learns:** the candidate states the problem exactly including the constraint, converts it to the form every method shares, gives the actual mechanism of TRIAD's sub-optimality rather than a wrong one, quantifies the penalty, names the regime where the penalty vanishes, and closes with a selection criterion. That is the whole subject in about two minutes.
:::

## Check yourself

::: check
Write Wahba's problem and say precisely what the weights represent and where the rotation constraint enters.
:::

::: answer
$\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)}\tfrac12\sum_i a_i\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2$, with $\mathbf{b}_i$ unit vectors observed in the body frame, $\mathbf{r}_i$ the same directions known in a reference frame, and $a_i > 0$ the weights. The weights play the role of $1/\sigma_i^2$: they are larger for a more accurate sensor, and they are what makes this a *weighted* least-squares problem rather than an unweighted one. The constraint enters through the search set, $\mathbf{A}\in SO(3)$, meaning $\mathbf{A}^{\mathsf{T}}\mathbf{A} = \mathbf{I}$ and $\det\mathbf{A} = +1$ — not as a penalty term in the cost. Dropping the determinant condition gives the orthogonal Procrustes problem, whose minimiser may be a reflection and therefore not an attitude.
:::

::: check
Show that minimising the Wahba cost is the same as maximising $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$, and say what $\mathbf{B}$ buys you computationally.
:::

::: answer
Expand one term: $\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2 = \mathbf{b}_i^{\mathsf{T}}\mathbf{b}_i - 2\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i + \mathbf{r}_i^{\mathsf{T}}\mathbf{A}^{\mathsf{T}}\mathbf{A}\mathbf{r}_i$. The first term is $1$ because $\mathbf{b}_i$ is a unit vector; the third is $\mathbf{r}_i^{\mathsf{T}}\mathbf{r}_i = 1$ because $\mathbf{A}$ is orthogonal and $\mathbf{r}_i$ is a unit vector. So the term is $2 - 2\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i$, and the weighted cost is $\sum_i a_i - \sum_i a_i\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i$. The first sum is a constant, so minimising the cost maximises the second, which collects into $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$ with $\mathbf{B} = \sum_i a_i\mathbf{b}_i\mathbf{r}_i^{\mathsf{T}}$. Computationally $\mathbf{B}$ is a lossless compression: every observation and weight enters only through this one $3\times3$ matrix, so a hundred star directions and two of them produce objects of identical size, and the individual measurements can be discarded before the solve.
:::

::: check
Why can a single vector observation never determine an attitude, and how many independent constraints does one actually supply?
:::

::: answer
Two, not three. A unit vector's direction has two degrees of freedom — its length carries no information — so matching one observation to its reference constrains only two of the three degrees of freedom of $SO(3)$. The unconstrained one is rotation about the observed direction itself: applying any rotation about $\mathbf{b}_i$ after the true attitude leaves $\mathbf{b}_i$ exactly where it was, so the whole one-parameter family of such attitudes achieves identical zero cost. Two non-parallel vectors supply four constraints for three unknowns and resolve it — but the resolution is only as strong as the separation, since the cost's sensitivity to rotation about the shared axis shrinks toward zero as the two references approach parallel.
:::

::: check
Name the four methods and, for each, the single sentence that distinguishes it.
:::

::: answer
**TRIAD**: a deterministic construction from exactly two vectors, matching the primary vector exactly and using the second only to fix the rotation about it — no weights, no iteration, not optimal. **The SVD method**: decompose $\mathbf{B} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^{\mathsf{T}}$ and take $\hat{\mathbf{A}} = \mathbf{U}\operatorname{diag}(1,1,\det\mathbf{U}\det\mathbf{V})\mathbf{V}^{\mathsf{T}}$ — optimal, most robust numerically, no attitude-specific machinery. **Davenport's q-method**: build the symmetric $4\times4$ $\mathbf{K}$ from $\mathbf{B}$ and take the eigenvector of its largest eigenvalue — optimal, any number of vectors, returns a quaternion directly. **QUEST**: the same eigenvalue found by Newton iteration from $\lambda_0 = \sum_i a_i$ followed by a $3\times3$ solve instead of a $4\times4$ eigendecomposition — the same answer, far cheaper, which is why it flew.
:::

::: check
A colleague uses the SVD method but sets all the weights to one because "the optimal method handles it". Two sensors have $0.2^\circ$ and $1.0^\circ$ accuracy. What does that cost, relative to using TRIAD correctly?
:::

::: answer
It costs more than TRIAD does. With those accuracies and a $60^\circ$ separation, the optimal solver with correct weights $1/\sigma_i^2$ gives an RMS attitude error of about $1.196^\circ$; with equal weights it gives about $1.287^\circ$, roughly seven and a half percent worse. TRIAD with the accurate sensor as primary gives about $1.197^\circ$ — within a tenth of a percent of the correctly weighted optimum. So the colleague's "optimal" method, mis-weighted, is beaten by the method they rejected as sub-optimal. The general lesson is that optimality is a property of the cost function you actually minimise, and a cost with the wrong weights is the wrong cost; the algorithm cannot recover information about sensor quality that you declined to give it.
:::

::: check
On noiseless data, what is the largest eigenvalue of the Davenport $\mathbf{K}$ matrix, and why does that fact matter for QUEST?
:::

::: answer
It is exactly $\sum_i a_i$, the sum of the weights. That follows from the trace form: the maximum of $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$ equals $\lambda_{\max}(\mathbf{K})$, and the Wahba cost is $\sum_i a_i - \operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$ — so a zero-cost fit forces $\lambda_{\max} = \sum_i a_i$. It matters for QUEST because with real sensor noise the cost is small rather than zero, so $\lambda_{\max}$ stays very close to $\sum_i a_i$. That makes $\lambda_0 = \sum_i a_i$ an excellent initial guess for Newton's method on the characteristic polynomial, converging in two or three iterations — which replaces a $4\times4$ eigendecomposition with a scalar root-find and a $3\times3$ linear solve, and is precisely why QUEST was affordable on flight hardware that could not have run the q-method every cycle.
:::

## Summary

| Item | Content |
| --- | --- |
| Wahba's problem | $\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)}\tfrac12\sum_i a_i\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2$; weights $a_i \propto 1/\sigma_i^2$ |
| Constraint | $\mathbf{A}^{\mathsf{T}}\mathbf{A} = \mathbf{I}$, $\det\mathbf{A} = +1$; in the search set, not the cost |
| Degrees of freedom | One unit vector gives two constraints; two non-parallel vectors give four for three unknowns |
| Trace form | $\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2 = 2 - 2\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i$; maximise $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$ |
| Attitude profile matrix | $\mathbf{B} = \sum_i a_i\mathbf{b}_i\mathbf{r}_i^{\mathsf{T}}$; lossless compression of all the data |
| TRIAD | $\hat{\mathbf{A}} = \mathbf{M}_b\mathbf{M}_r^{\mathsf{T}}$; two vectors only, primary matched exactly, not optimal |
| SVD method | $\hat{\mathbf{A}} = \mathbf{U}\operatorname{diag}(1,1,\det\mathbf{U}\det\mathbf{V})\mathbf{V}^{\mathsf{T}}$ |
| Davenport q-method | Largest eigenvector of $\mathbf{K}$, built from $\operatorname{trace}(\mathbf{B})$, $\mathbf{z}$ and $\mathbf{B}+\mathbf{B}^{\mathsf{T}}$ |
| QUEST | Newton from $\lambda_0 = \sum_i a_i$, then $\mathbf{q}_{\mathrm{CRP}} = [(\lambda_{\max}+\sigma)\mathbf{I} - \mathbf{S}]^{-1}\mathbf{z}$ |
| Measured penalty | TRIAD $7.5\%$ worse than optimal at equal accuracy; within $0.1\%$ when one sensor dominates; wrong primary $30\%$ worse; equal weights $7.5\%$ worse |

The next lesson takes attitude from a single-epoch solve into a filter, and answers the question this module singles out as the most common follow-up in the whole subject: why the error state of a quaternion filter has three components and not four.
