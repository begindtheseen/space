---
id: l10-wahba-stated-and-solved
title: "Wahba's problem, stated and solved four ways"
minutes: 22
covers:
  - "attitude determination: Wahba’s problem stated formally"
  - "solutions to Wahba: Davenport’s q-method, the SVD method, QUEST, and TRIAD as the degenerate two-vector case"
---

Imagine you are hiking with a paper map and are not sure which way you are facing. You can see a church steeple and a mountain peak. The map tells you where both are. Your eyes tell you where both are *relative to your nose*. Turn the map until its steeple and peak line up with the real ones, and you know which way you face. You matched two directions you *see* to the same two directions you *know*.

A spacecraft does exactly this, all the time. Every attitude sensor it carries reports a direction in **body axes** — the three axes fixed to the spacecraft itself. A sun sensor says where the Sun is. A **magnetometer** — an electronic compass — says which way Earth's magnetic field points. A **[[star tracker|star-tracker]]** says where a known star sits. For each, a model — a Sun table, a field model, a star catalog — says where the same direction points in a frame that does not turn with the vehicle. **Attitude determination** — working out which way the vehicle is pointing — is finding the one rotation that lines up all of those pairs at once.

[[Grace Wahba|grace-wahba]] posed exactly that problem in 1965, and the domain round asks about it in two parts. First: *state it* — a recall question you should answer in one written line. Second: *how would you solve it?* — four named methods, what makes each different, and, the part that separates answers, why the oldest one is not optimal.

## The problem, stated formally

Start with the map picture. Guess your attitude. For each landmark, turn the map's arrow by your guess and compare it with the arrow you see. The gap is that landmark's error. Square each gap, give a trustworthy landmark more say than a fuzzy one, and add them up. The best guess has the smallest total. That total is the **cost**: one number scoring a guess, smaller being better.

Now the precise version. Let $\mathbf{r}_1,\ldots,\mathbf{r}_k$ ("r one through r k") be **unit vectors** — arrows of length one, used only for their direction — known in a **reference frame** that does not rotate with the vehicle. Let $\mathbf{b}_1,\ldots,\mathbf{b}_k$ be the same physical directions as measured in the body frame. The true **attitude matrix** $\mathbf{A}$ is the $3\times3$ rotation turning reference coordinates into body coordinates, so $\mathbf{b}_i = \mathbf{A}\mathbf{r}_i$ plus sensor noise. Give each observation a **weight** $a_i > 0$. Then Wahba's problem is

$$\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)}\ \tfrac12\sum_{i=1}^{k} a_i\left\lVert \mathbf{b}_i - \mathbf{A}\mathbf{r}_i \right\rVert^2.$$

Read it aloud as: "A-hat is the **[[arg min|arg-min]]**, over all rotations A in S-O-three, of one half the sum of a-i times the squared length of b-i minus A r-i." The hat on $\hat{\mathbf{A}}$ marks an estimate. The double bars $\lVert\cdot\rVert$ mean the length of a vector. $SO(3)$, said "S-O-three", is the set of all proper rotations in three dimensions.

Say three things as you write it; each is a place an interviewer will probe.

**The weights.** $a_i$ plays the role $1/\sigma_i^2$ plays in any weighted least-squares problem, where $\sigma_i$ ("sigma i") is that sensor's typical error. So the weight is larger for a more accurate sensor. A star tracker good to arcseconds and a magnetometer good to a degree do not get equal say.

**The constraint is in the search set, not in the cost.** $\mathbf{A}$ ranges only over $SO(3)$. That means $\mathbf{A}^{\mathsf{T}}\mathbf{A} = \mathbf{I}$ (the matrix keeps lengths and angles, so it is **orthogonal**) *and* $\det\mathbf{A} = +1$ (it is a turn, not a **[[mirror image|reflection]]**). Drop the determinant condition and you have the **orthogonal Procrustes problem**, whose answer can come back as a reflection. A reflection is not an attitude. Insisting on proper rotations is what makes this Wahba's problem rather than plain Procrustes.

**The degrees of freedom.** An attitude has three — think of the three angles a plane can turn through: pitch, yaw and roll. A unit-vector observation supplies only **two** independent constraints. A direction on a sphere has two degrees of freedom (like latitude and longitude), and the vector's length carries no information. So one pair cannot pin down an attitude: the **[[rotation about the observed direction|spin-about-arrow]]** itself is completely free and adds nothing to the cost. Two non-parallel pairs give four constraints for three unknowns, which is enough. But as the two approach parallel, the cost stops caring about rotation around their shared axis, and noise takes over.

::: key Wahba's problem
$\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)} \tfrac12\sum_i a_i\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2$, given weighted vector observations $\mathbf{b}_i$ in the body frame and their references $\mathbf{r}_i$ in the inertial frame. It is the least-squares attitude determination problem: orthogonal Procrustes restricted to proper rotations.
:::

## The trace form every solver works from

A little algebra turns the cost into something much easier to handle, and lets you explain all four methods as versions of one idea.

Step one: expand a single term. Multiply out the squared length, the way you would expand $(x - y)^2 = x^2 - 2xy + y^2$:

$$\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2 = \mathbf{b}_i^{\mathsf{T}}\mathbf{b}_i - 2\,\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i + \mathbf{r}_i^{\mathsf{T}}\mathbf{A}^{\mathsf{T}}\mathbf{A}\mathbf{r}_i.$$

Step two: use what we know. $\mathbf{b}_i$ is a unit vector, so $\mathbf{b}_i^{\mathsf{T}}\mathbf{b}_i = 1$. $\mathbf{A}$ is orthogonal, so $\mathbf{A}^{\mathsf{T}}\mathbf{A} = \mathbf{I}$, and the last term becomes $\mathbf{r}_i^{\mathsf{T}}\mathbf{r}_i = 1$. That leaves

$$\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2 = 1 - 2\,\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i + 1 = 2 - 2\,\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i.$$

Step three: add them up with weights and the one half. The cost is $\sum_i a_i - \sum_i a_i\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i$. The first sum is the same for every guess. So making the cost smallest is exactly making the second sum largest.

Step four: write each number $\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i$ as a **[[trace|trace]]** and collect the sum into one matrix:

$$\hat{\mathbf{A}} = \arg\max_{\mathbf{A}\in SO(3)}\operatorname{trace}\!\left(\mathbf{A}\mathbf{B}^{\mathsf{T}}\right), \qquad \mathbf{B} = \sum_i a_i\,\mathbf{b}_i\mathbf{r}_i^{\mathsf{T}}.$$

Here $\mathbf{B}$ is the **attitude profile matrix**: one $3\times3$ matrix that packs in every measurement without losing anything the solve needs, so the individual observations can then be thrown away. The minimum cost is then $\sum_i a_i - \max\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$.

::: key The attitude profile matrix
$\mathbf{B} = \sum_i a_i\mathbf{b}_i\mathbf{r}_i^{\mathsf{T}}$. Minimizing the Wahba cost is equivalent to maximizing $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$, and every optimal solver is a different way of doing that one maximization.
:::

::: note Why the sum becomes a trace
A single number equals its own trace, so $\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i = \operatorname{trace}(\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i)$. The trace does not change when you move the first factor to the back — $\operatorname{trace}(\mathbf{X}\mathbf{Y}) = \operatorname{trace}(\mathbf{Y}\mathbf{X})$ — so this is $\operatorname{trace}(\mathbf{A}\mathbf{r}_i\mathbf{b}_i^{\mathsf{T}})$. And $\mathbf{r}_i\mathbf{b}_i^{\mathsf{T}} = (\mathbf{b}_i\mathbf{r}_i^{\mathsf{T}})^{\mathsf{T}}$. Trace is linear, so the weighted sum of traces is the trace of the weighted sum: $\sum_i a_i\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i = \operatorname{trace}\big(\mathbf{A}(\sum_i a_i\mathbf{b}_i\mathbf{r}_i^{\mathsf{T}})^{\mathsf{T}}\big) = \operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$.
:::

## Four solutions

### TRIAD: a construction, not an optimization

TRIAD is the map trick done with a ruler: line up the landmark you trust most *exactly*, then turn about that line until the second landmark is in the right plane. No scoring, no searching.

Given exactly two pairs, with $(\mathbf{b}_1,\mathbf{r}_1)$ the more trustworthy (the **primary**), build a set of three perpendicular unit axes — a **[[right-handed triad|triad-picture]]** — in each frame, from the primary vector and the plane the two vectors span:

$$\mathbf{t}_1 = \mathbf{r}_1, \qquad \mathbf{t}_2 = \frac{\mathbf{r}_1\times\mathbf{r}_2}{\lVert\mathbf{r}_1\times\mathbf{r}_2\rVert}, \qquad \mathbf{t}_3 = \mathbf{t}_1\times\mathbf{t}_2.$$

Do the same with $\mathbf{b}_1,\mathbf{b}_2$ to get $\mathbf{s}_1,\mathbf{s}_2,\mathbf{s}_3$. Stack them as columns: $\mathbf{M}_r = (\mathbf{t}_1\ \mathbf{t}_2\ \mathbf{t}_3)$ and $\mathbf{M}_b = (\mathbf{s}_1\ \mathbf{s}_2\ \mathbf{s}_3)$. Both are orthonormal by construction. Then

$$\hat{\mathbf{A}} = \mathbf{M}_b\mathbf{M}_r^{\mathsf{T}}.$$

No weights, no iteration, no eigenvalues, and no room for a third vector.

**Why it is not optimal:** it matches $\mathbf{r}_1$ to $\mathbf{b}_1$ *exactly*, trusting the primary vector completely. It uses the second vector only to fix the leftover rotation about that axis, and throws away the part of the second observation along the first. The Wahba cost would instead share the error between the two according to their weights.

### The SVD method

Every matrix can be broken into three simple moves: a rotation, a stretch along three perpendicular axes, and another rotation. This is the **[[singular value decomposition|svd-picture]]** (SVD, said "S-V-D"): $\mathbf{B} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^{\mathsf{T}}$. Here $\mathbf{U}$ and $\mathbf{V}$ are orthogonal, and $\boldsymbol{\Sigma}$ ("capital sigma") is diagonal with the **singular values** $\sigma_1 \ge \sigma_2 \ge \sigma_3 \ge 0$ — the stretch amounts. (Not sensor errors; the letter is reused.) The best rotation is

$$\hat{\mathbf{A}} = \mathbf{U}\operatorname{diag}\!\left(1,\ 1,\ \det\mathbf{U}\det\mathbf{V}\right)\mathbf{V}^{\mathsf{T}}.$$

In brief: substituting $\mathbf{M} = \mathbf{U}^{\mathsf{T}}\mathbf{A}\mathbf{V}$ turns the objective into $\sum_i M_{ii}\sigma_i$. Every diagonal entry of an orthogonal matrix is at most $1$ in size, so without the determinant rule the best choice is $\mathbf{M} = \mathbf{I}$. The $\det$ factor repairs the case where that choice would be a reflection. It flips the last axis, giving up the smallest singular value rather than a larger one. It is the most numerically robust method and needs no attitude-specific machinery.

::: warning Do not drop the determinant factor
Writing $\hat{\mathbf{A}} = \mathbf{U}\mathbf{V}^{\mathsf{T}}$ and stopping solves Procrustes, not Wahba. With many well-spread vectors it usually gives a rotation, so tests can pass. But with exactly two vectors $\sigma_3 = 0$, the sign of the last axis is arbitrary, and $\mathbf{U}\mathbf{V}^{\mathsf{T}}$ comes back with determinant $-1$ about half the time, even on perfect data: a mirror image, which no spacecraft can be in. Always include $\operatorname{diag}(1,1,\det\mathbf{U}\det\mathbf{V})$, and check $\det\hat{\mathbf{A}} = +1$ in tests.
:::

### Davenport's q-method

A **quaternion** is four numbers, $\mathbf{q} = (q_0, q_1, q_2, q_3)$, with length one, that encode a rotation. Written with the "scalar" part $q_0$ first, it is the attitude language most flight software speaks. Davenport described $\mathbf{A}$ by a unit quaternion instead of nine matrix entries. Multiplying out $\operatorname{trace}(\mathbf{A}(\mathbf{q})\mathbf{B}^{\mathsf{T}})$ then turns it into a **quadratic form** $\mathbf{q}^{\mathsf{T}}\mathbf{K}\mathbf{q}$ — a number built from $\mathbf{q}$ and a fixed symmetric $4\times4$ matrix:

$$\mathbf{K} = \begin{pmatrix}\operatorname{trace}(\mathbf{B}) & \mathbf{z}^{\mathsf{T}} \\ \mathbf{z} & \mathbf{B} + \mathbf{B}^{\mathsf{T}} - \operatorname{trace}(\mathbf{B})\mathbf{I}\end{pmatrix}, \qquad \mathbf{z} = \begin{pmatrix}B_{32} - B_{23}\\ B_{13} - B_{31}\\ B_{21} - B_{12}\end{pmatrix}$$

for scalar-first quaternions. $B_{32}$ means the entry in row 3, column 2 of $\mathbf{B}$.

Because $\lVert\mathbf{q}\rVert = 1$, maximizing $\mathbf{q}^{\mathsf{T}}\mathbf{K}\mathbf{q}$ is a **[[Rayleigh-quotient problem|eigenvector]]**. **The answer is the eigenvector of $\mathbf{K}$ belonging to its largest eigenvalue**, and that eigenvalue, $\lambda_{\max}$ ("lambda max"), is the maximum of $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$ itself. It takes any number of vectors and weights, with no special cases.

### QUEST

**[[QUEST|quest-history]]** (QUaternion ESTimator) solves the same eigenvalue problem without a full eigendecomposition. That is what made it flyable on the slow flight computers of the late 1970s and 1980s.

The trick: on noiseless data $\lambda_{\max} = \sum_i a_i$ exactly, and with real noise it stays close. So $\lambda_0 = \sum_i a_i$ is an excellent starting guess for **Newton's method** — the "follow the tangent line to the zero" root-finder — applied to the characteristic polynomial $\det(\mathbf{K} - \lambda\mathbf{I}) = 0$. It usually takes two or three steps. Once $\lambda_{\max}$ is known, the attitude comes from a $3\times3$ linear solve for the **classical Rodrigues parameters** (the vector part of the quaternion divided by its scalar part, $\mathbf{q}_v/q_0$):

$$\mathbf{q}_{\mathrm{CRP}} = \left[(\lambda_{\max} + \sigma)\mathbf{I} - \mathbf{S}\right]^{-1}\mathbf{z}, \qquad \mathbf{S} = \mathbf{B} + \mathbf{B}^{\mathsf{T}}, \quad \sigma = \operatorname{trace}(\mathbf{B}),$$

instead of a $4\times4$ eigenvector. Only the Newton step is approximate, and it converges to machine precision, so QUEST agrees with the q-method in practice.

::: warning QUEST's blind spot at half a turn
The Rodrigues parameters are $\mathbf{q}_v/q_0$, and $q_0 = \cos(\theta/2)$ for a rotation by angle $\theta$. At $\theta = 180^\circ$, $q_0 = 0$ and the parameters blow up; near it, the $3\times3$ solve becomes badly conditioned. Flight implementations work around this, for example by solving the problem in a temporarily rotated reference frame and undoing the rotation afterward. Knowing about this singularity marks someone who has used QUEST.
:::

::: key The four solutions
Davenport's q-method finds the maximum eigenvector of a $4\times4$ $\mathbf{K}$ matrix built from $\mathbf{B}$. The SVD method decomposes the attitude profile matrix $\mathbf{B}$ directly. QUEST solves the q-method eigenvalue approximately and quickly, by Newton iteration from $\lambda_0 = \sum_i a_i$. TRIAD is the deterministic two-vector construction and is not optimal, because it uses the primary vector exactly and discards information from the second.
:::

::: example How much does TRIAD actually cost you?
Set up a simulated test. Two reference directions $60^\circ$ apart. A true attitude of $32^\circ$ about a random axis. Gaussian noise added to each axis of each body observation, which is then rescaled to unit length. Weights $a_i = 1/\sigma_i^2$. Run $40\,000$ trials at each setting. The score is the **[[RMS|rms]]** angle between the estimated and true attitude — a typical error size.

**Equal-accuracy sensors, $\sigma_1 = \sigma_2 = 0.5^\circ$:**

| Method | RMS attitude error |
| --- | --- |
| TRIAD, first vector primary | $0.9592^\circ$ |
| TRIAD, second vector primary | $0.9608^\circ$ |
| Optimal (SVD or q-method) | $0.8923^\circ$ |

Divide: $0.9592/0.8923 = 1.075$. TRIAD is worse by about seven and a half percent in RMS, whichever vector is primary, since they are equally good. That is the honest size of TRIAD's shortfall: real, but not a catastrophe.

**Unequal sensors, $\sigma_1 = 0.2^\circ$ and $\sigma_2 = 1.0^\circ$:**

| Method | RMS attitude error |
| --- | --- |
| TRIAD, accurate vector primary | $1.1971^\circ$ |
| TRIAD, coarse vector primary | $1.5497^\circ$ |
| Optimal, correct weights $1/\sigma_i^2$ | $1.1964^\circ$ |
| Optimal, equal weights | $1.2865^\circ$ |

Three readings, one division each.

- $1.1971/1.1964 = 1.0006$. TRIAD with the accurate sensor as primary is within $0.1\%$ of optimal. Trusting the good vector exactly is very nearly the right thing to do when one sensor dominates — the situation TRIAD was designed for.
- $1.5497/1.1964 = 1.295$. TRIAD with the *wrong* primary is about $30\%$ worse. The choice of primary matters far more than the choice of method.
- $1.2865/1.1964 = 1.075$. An optimal solver run with equal weights instead of $1/\sigma_i^2$ is $7.5\%$ worse — the same penalty as using TRIAD in the equal-accuracy case. **Getting the [[weights right|weights-bars]] matters as much as choosing the optimal algorithm.**

Sanity check: every error sits between the good sensor's $0.2^\circ$ and a couple of times the coarse sensor's $1.0^\circ$. Sensible: only the coarse sensor can see rotation about the good sensor's direction, so it sets most of the total.

One identity worth checking. On noiseless data the largest eigenvalue of $\mathbf{K}$, the sum of the singular values of $\mathbf{B}$, and the achieved $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$ all equal $\sum_i a_i$ to machine precision. With real noise the three still agree — they are the same quantity — and sit slightly below $\sum_i a_i$. The gap is the leftover cost the noise forces.
:::

::: example "State Wahba's problem, then tell me why TRIAD is not a solution to it"
**A weak answer:** "Wahba's problem is finding the attitude that best fits a set of vector measurements. TRIAD is a way of solving it with two vectors, using cross products. It is not optimal because it only uses two vectors."

Vague where it should be exact, and the reason is wrong: TRIAD is not optimal even with exactly two vectors, the only case it handles.

**A strong answer:**

"The problem first. Given unit vectors $\mathbf{r}_i$ known in a reference frame and the same directions $\mathbf{b}_i$ measured in the body frame, with weights $a_i$ that go like one over the sensor variance, find

$$\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)} \tfrac12\sum_i a_i\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2.$$

The constraint lives in the search set — $\mathbf{A}$ orthogonal with determinant plus one — not in the cost. Without the determinant condition it is the orthogonal Procrustes problem, and the answer can come back a reflection.

Convert it at once, because every solver works from that form. The vectors are unit and $\mathbf{A}$ is orthogonal, so each squared term is $2 - 2\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i$. The cost becomes $\sum a_i - \operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$ with $\mathbf{B} = \sum a_i\mathbf{b}_i\mathbf{r}_i^{\mathsf{T}}$. So minimizing the cost is maximizing a trace over $SO(3)$, and all the data has been packed into one three-by-three matrix.

Now TRIAD. It is a construction, not an optimization: build an orthonormal triad in each frame from the primary vector and the normalized cross product of the two, and the attitude is $\mathbf{M}_b\mathbf{M}_r^{\mathsf{T}}$. That sends $\mathbf{r}_1$ to $\mathbf{b}_1$ *exactly*, treating the primary as error-free. The second vector only fixes the rotation about it, so the part of it along the first is thrown away. Nothing in the construction uses the weights, and nothing in it can take a third vector.

The optimal methods share the leftover error according to the weights, which is why they win. The win is modest: with two equally accurate sensors sixty degrees apart, TRIAD's RMS error is about seven and a half percent above the optimum. And when one sensor is far better, TRIAD with the good vector primary is essentially optimal, because trusting that vector exactly is then almost right.

If I had to pick in flight software: the SVD method if I want robustness and have the processor time, Davenport's q-method if I want a quaternion out directly and any number of vectors in, QUEST if processor time is tight, and TRIAD only for a coarse two-vector solution or a starting guess."

**What the interviewer learns:** the candidate states the problem exactly, constraint included, converts it to the shared form, gives the real mechanism of TRIAD's shortfall, puts a number on it, names the case where it vanishes, and closes with a way to choose. The whole subject in about two minutes.
:::

## Check yourself

::: check
Write Wahba's problem and say precisely what the weights represent and where the rotation constraint enters.
:::

::: answer
$\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)}\tfrac12\sum_i a_i\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2$. Here $\mathbf{b}_i$ are unit vectors observed in the body frame, $\mathbf{r}_i$ are the same directions known in a reference frame, and $a_i > 0$ are the weights.

The weights play the role of $1/\sigma_i^2$: larger for a more accurate sensor.

The constraint enters through the search set, $\mathbf{A}\in SO(3)$, meaning $\mathbf{A}^{\mathsf{T}}\mathbf{A} = \mathbf{I}$ and $\det\mathbf{A} = +1$ — not as a penalty term in the cost. Dropping the determinant condition gives the orthogonal Procrustes problem, whose minimizer may be a reflection and therefore not an attitude.
:::

::: check
Show that minimizing the Wahba cost is the same as maximizing $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$, and say what $\mathbf{B}$ buys you computationally.
:::

::: answer
Expand one term: $\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2 = \mathbf{b}_i^{\mathsf{T}}\mathbf{b}_i - 2\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i + \mathbf{r}_i^{\mathsf{T}}\mathbf{A}^{\mathsf{T}}\mathbf{A}\mathbf{r}_i$.

The first term is $1$ (unit vector). The third is $\mathbf{r}_i^{\mathsf{T}}\mathbf{r}_i = 1$ ($\mathbf{A}$ orthogonal, unit vector). So the term is $2 - 2\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i$, and the weighted cost (with the one half) is $\sum_i a_i - \sum_i a_i\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i$.

The first sum is a constant, so minimizing the cost maximizes the second, which collects into $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$ with $\mathbf{B} = \sum_i a_i\mathbf{b}_i\mathbf{r}_i^{\mathsf{T}}$.

Computationally, $\mathbf{B}$ is a lossless compression: every observation and weight enters only through this one $3\times3$ matrix, so a hundred star directions and two of them give objects of the same size.
:::

::: check
Why can a single vector observation never determine an attitude, and how many independent constraints does one actually supply?
:::

::: answer
Two, not three. A unit vector's direction has two degrees of freedom — its length carries no information — so one observation constrains only two of the three degrees of freedom of $SO(3)$.

The free one is rotation about the observed direction itself. Applying any rotation about $\mathbf{b}_i$ after the true attitude leaves $\mathbf{b}_i$ exactly where it was, so a whole one-parameter family of attitudes achieves the same zero cost.

Two non-parallel vectors supply four constraints for three unknowns and settle it — but only as firmly as their separation allows, since sensitivity to rotation about the shared axis shrinks toward zero as they approach parallel.
:::

::: check
Name the four methods and, for each, the single sentence that distinguishes it.
:::

::: answer
**TRIAD**: a deterministic construction from exactly two vectors, matching the primary vector exactly and using the second only to fix the rotation about it — no weights, no iteration, not optimal.

**The SVD method**: decompose $\mathbf{B} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^{\mathsf{T}}$ and take $\hat{\mathbf{A}} = \mathbf{U}\operatorname{diag}(1,1,\det\mathbf{U}\det\mathbf{V})\mathbf{V}^{\mathsf{T}}$ — optimal, most robust numerically, no attitude-specific machinery.

**Davenport's q-method**: build the symmetric $4\times4$ $\mathbf{K}$ from $\mathbf{B}$ and take the eigenvector of its largest eigenvalue — optimal, any number of vectors, returns a quaternion directly.

**QUEST**: the same eigenvalue found by Newton iteration from $\lambda_0 = \sum_i a_i$, followed by a $3\times3$ solve instead of a $4\times4$ eigendecomposition — the same answer, far cheaper, which is why it flew.
:::

::: check
A colleague uses the SVD method but sets all the weights to one because "the optimal method handles it". Two sensors have $0.2^\circ$ and $1.0^\circ$ accuracy. What does that cost, relative to using TRIAD correctly?
:::

::: answer
It costs more than TRIAD does. With those accuracies and a $60^\circ$ separation, the optimal solver with correct weights $1/\sigma_i^2$ gives an RMS attitude error of about $1.196^\circ$. With equal weights it gives about $1.287^\circ$, roughly seven and a half percent worse. TRIAD with the accurate sensor as primary gives about $1.197^\circ$ — within a tenth of a percent of the correctly weighted optimum.

So the colleague's mis-weighted "optimal" method is beaten by the method they rejected. Optimality belongs to the cost you actually minimize, and a cost with the wrong weights is the wrong cost. No algorithm can recover sensor-quality information you declined to give it.
:::

::: check
On noiseless data, what is the largest eigenvalue of the Davenport $\mathbf{K}$ matrix, and why does that fact matter for QUEST?
:::

::: answer
It is exactly $\sum_i a_i$, the sum of the weights. The maximum of $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$ equals $\lambda_{\max}(\mathbf{K})$, and the Wahba cost is $\sum_i a_i - \operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$. A zero-cost fit therefore forces $\lambda_{\max} = \sum_i a_i$.

It matters for QUEST because with real noise the cost is small rather than zero, so $\lambda_{\max}$ stays very close to $\sum_i a_i$. That makes $\lambda_0 = \sum_i a_i$ an excellent starting guess for Newton's method on the characteristic polynomial, converging in two or three steps. A $4\times4$ eigendecomposition becomes a one-number root-find plus a $3\times3$ solve — which is why QUEST was affordable on flight hardware that could not run the q-method every cycle.
:::

## Summary

| Item | Content |
| --- | --- |
| Wahba's problem | $\hat{\mathbf{A}} = \arg\min_{\mathbf{A}\in SO(3)}\tfrac12\sum_i a_i\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2$; weights $a_i \propto 1/\sigma_i^2$ |
| Constraint | $\mathbf{A}^{\mathsf{T}}\mathbf{A} = \mathbf{I}$, $\det\mathbf{A} = +1$; in the search set, not the cost |
| Degrees of freedom | One unit vector gives two constraints; two non-parallel vectors give four for three unknowns |
| Trace form | $\lVert\mathbf{b}_i - \mathbf{A}\mathbf{r}_i\rVert^2 = 2 - 2\mathbf{b}_i^{\mathsf{T}}\mathbf{A}\mathbf{r}_i$; maximize $\operatorname{trace}(\mathbf{A}\mathbf{B}^{\mathsf{T}})$ |
| Attitude profile matrix | $\mathbf{B} = \sum_i a_i\mathbf{b}_i\mathbf{r}_i^{\mathsf{T}}$; lossless compression of all the data |
| TRIAD | $\hat{\mathbf{A}} = \mathbf{M}_b\mathbf{M}_r^{\mathsf{T}}$; two vectors only, primary matched exactly, not optimal |
| SVD method | $\hat{\mathbf{A}} = \mathbf{U}\operatorname{diag}(1,1,\det\mathbf{U}\det\mathbf{V})\mathbf{V}^{\mathsf{T}}$ |
| Davenport q-method | Largest eigenvector of $\mathbf{K}$, built from $\operatorname{trace}(\mathbf{B})$, $\mathbf{z}$ and $\mathbf{B}+\mathbf{B}^{\mathsf{T}}$ |
| QUEST | Newton from $\lambda_0 = \sum_i a_i$, then $\mathbf{q}_{\mathrm{CRP}} = [(\lambda_{\max}+\sigma)\mathbf{I} - \mathbf{S}]^{-1}\mathbf{z}$; singular at $180^\circ$ |
| Measured penalty | TRIAD: $7.5\%$ worse at equal accuracy, within $0.1\%$ when one sensor dominates, $30\%$ worse with wrong primary; equal weights: $7.5\%$ worse |

The next lesson moves attitude from a one-time solve into a filter that runs every cycle, and answers the module's most common follow-up question: why a quaternion filter's error state has three components, not four.

::: context star-tracker A camera that knows the sky
A **star tracker** is a small camera pointed at the sky. It photographs a patch of stars, finds the bright dots, and matches their pattern against an onboard catalog of known stars. Each matched star gives a pair: the direction in the photo (body frame) and the direction in the catalog (a fixed frame). With many stars in view, it can report attitude to within arcseconds — an arcsecond is $1/3600$ of a degree. That makes it the most accurate attitude sensor most spacecraft carry, and the one that gets the biggest weight in Wahba's cost.
:::

::: context grace-wahba Who Grace Wahba is
Grace Wahba is an American statistician. In 1965 she published the attitude question as a short problem in the journal *SIAM Review*, under the title "A Least Squares Estimate of Satellite Attitude", inviting readers to solve it. The problem has carried her name ever since. She went on to a long career in statistics at the University of Wisconsin–Madison, best known for work on smoothing splines. It is a nice reminder that a one-page, sharply stated problem can shape a whole engineering field for sixty years.
:::

::: context arg-min "Min" versus "arg min"
"Min" gives you the lowest *value* of the cost. "Arg min" gives you the *input* that produces it — the "argument", in math language. For Wahba, the min is how badly the best rotation still fits; the arg min is the best rotation itself, which is what the spacecraft needs.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="180" x2="40" y2="20" stroke="#1f2a44" stroke-width="2"/>
  <path d="M60,40 Q200,260 340,40" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="200" y1="150" x2="200" y2="180" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <line x1="40" y1="150" x2="200" y2="150" stroke="#6c7a93" stroke-width="2" stroke-dasharray="4 3"/>
  <circle cx="200" cy="150" r="5" fill="#b4232c"/>
  <text x="200" y="198" font-size="12" fill="#b4232c" text-anchor="middle">arg min: the best rotation</text>
  <text x="46" y="143" font-size="12" fill="#6c7a93">min: its cost</text>
  <text x="46" y="16" font-size="12" fill="#1f2a44">cost J</text>
  <text x="340" y="172" font-size="12" fill="#1f2a44" text-anchor="end">guess A</text>
</svg>
```
:::

::: context reflection Why a mirror image is not an attitude
Hold up your right hand and look at it in a mirror: the reflection looks like a left hand. No amount of turning your real right hand will make it a left hand. A matrix with $\mathbf{A}^{\mathsf{T}}\mathbf{A} = \mathbf{I}$ and $\det\mathbf{A} = -1$ is that mirror: it keeps lengths and angles but swaps handedness. A spacecraft can turn to any orientation, but it can never become its own mirror image, so a determinant of $-1$ is a wrong answer, not an unusual attitude.
:::

::: context spin-about-arrow The one turn a single arrow cannot see
Point a pencil at the Sun and twist it about its own length. The pencil still points at the Sun. A sun sensor on a spacecraft is in the same position: the whole vehicle can roll about the Sun line and the measured Sun direction does not change. That hidden roll is the degree of freedom a second, different direction is needed to pin down.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="75" x2="300" y2="75" stroke="#1d6fd1" stroke-width="4"/>
  <polygon points="318,75 300,66 300,84" fill="#1d6fd1"/>
  <text x="318" y="102" font-size="12" fill="#1d6fd1" text-anchor="end">observed direction b</text>
  <ellipse cx="170" cy="75" rx="14" ry="40" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="170,115 180,109 180,121" fill="#b4232c"/>
  <text x="170" y="138" font-size="12" fill="#b4232c" text-anchor="middle">roll about b: cost does not change</text>
  <text x="170" y="24" font-size="12" fill="#1f2a44" text-anchor="middle">one arrow fixes 2 of the 3 angles</text>
</svg>
```
:::

::: context trace The trace of a matrix
The **trace** of a square matrix is the sum of the numbers on its main diagonal, top-left to bottom-right. For a $3\times3$ matrix that is $M_{11} + M_{22} + M_{33}$. It looks like a small bookkeeping idea, but it has two handy habits: the trace of a single number is that number, and $\operatorname{trace}(\mathbf{X}\mathbf{Y}) = \operatorname{trace}(\mathbf{Y}\mathbf{X})$. Those two habits are all the trace-form derivation needs. For a rotation by angle $\theta$, the trace is $1 + 2\cos\theta$. That gives a quick way to measure how far an estimate is from the truth: the trace of $\hat{\mathbf{A}}\mathbf{A}^{\mathsf{T}}$ tells you the angle of the leftover rotation between them.
:::

::: context triad-picture Building the TRIAD axes
Axis one is the primary vector. Axis two sticks straight out of the plane the two vectors make — their cross product. Axis three completes a right-handed set. Here $\mathbf{r}_1$ points right and $\mathbf{r}_2$ is $60^\circ$ above it, so $\mathbf{t}_2$ comes out of the page and $\mathbf{t}_3 = \mathbf{t}_1\times\mathbf{t}_2$ points down.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="120" y1="110" x2="232" y2="110" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="248,110 232,103 232,117" fill="#1d6fd1"/>
  <text x="254" y="108" font-size="12" fill="#1d6fd1">t1 = r1</text>
  <text x="254" y="124" font-size="12" fill="#1d6fd1">(primary)</text>
  <line x1="120" y1="110" x2="162" y2="37" stroke="#8fb8f0" stroke-width="3"/>
  <polygon points="170,23.4 155.9,33.8 168.1,40.8" fill="#8fb8f0"/>
  <text x="178" y="30" font-size="12" fill="#1f2a44">r2, 60° from r1</text>
  <line x1="120" y1="110" x2="120" y2="176" stroke="#b4232c" stroke-width="3"/>
  <polygon points="120,192 113,176 127,176" fill="#b4232c"/>
  <text x="128" y="190" font-size="12" fill="#b4232c">t3 = t1 × t2</text>
  <circle cx="120" cy="110" r="9" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="120" cy="110" r="3" fill="#1f2a44"/>
  <text x="8" y="100" font-size="12" fill="#1f2a44">t2 = r1 × r2</text>
  <text x="8" y="116" font-size="12" fill="#1f2a44">(out of page)</text>
  <path d="M160,110 A40,40 0 0 0 140,75.4" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="164" y="92" font-size="11" fill="#6c7a93">60°</text>
</svg>
```
:::

::: context svd-picture Rotate, stretch, rotate
The singular value decomposition says any matrix acts like three moves in a row: turn the space ($\mathbf{V}^{\mathsf{T}}$), stretch it along three perpendicular axes by amounts $\sigma_1, \sigma_2, \sigma_3$ ($\boldsymbol{\Sigma}$), then turn it again ($\mathbf{U}$). A sphere of arrows goes in; a tilted egg comes out. The SVD method keeps the two turns and throws away the stretch — which leaves the rotation that best matches $\mathbf{B}$. Every numerical library has a reliable SVD routine, which is part of why this method is so robust.
:::

::: context eigenvector What an eigenvector is doing here
An **eigenvector** of a matrix is a direction the matrix only stretches, without turning; the **eigenvalue** is the stretch factor. For a symmetric matrix like $\mathbf{K}$, the number $\mathbf{q}^{\mathsf{T}}\mathbf{K}\mathbf{q}$ over all unit-length $\mathbf{q}$ (the **Rayleigh quotient**, after the physicist Lord Rayleigh) is largest exactly along the eigenvector with the biggest eigenvalue, and its largest value is that eigenvalue. So "find the best quaternion" becomes "find the top eigenvector" — a job computers have done well for decades.
:::

::: context quest-history How QUEST got into orbit
QUEST was developed by Malcolm Shuster in the late 1970s and published with S. D. Oh in 1981. It was built for missions whose flight computers were far too slow to run a full eigenvalue routine every cycle. The Newton trick meant only a handful of multiply-and-add steps, and it gave the optimal answer anyway. It became one of the most widely used attitude algorithms in the field, and many spacecraft since have flown it or a close relative.
:::

::: context rms Root mean square
**RMS** stands for "root mean square", and the name is the recipe read backward: *square* each error, take the *mean* (average) of the squares, then take the square *root*. Squaring first means big errors count extra and signs cannot cancel. The result is a single "typical size" for a pile of errors, in the same units as the errors — degrees here.
:::

::: context weights-bars The unequal-sensor results side by side
RMS attitude error with a $0.2^\circ$ and a $1.0^\circ$ sensor, $60^\circ$ apart. The two "right" choices tie; the wrong primary and the wrong weights both lose.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="150" y1="20" x2="150" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="150" y="26" width="125.7" height="24" fill="#8fb8f0"/>
  <rect x="150" y="64" width="162.8" height="24" fill="#b4232c"/>
  <rect x="150" y="102" width="125.6" height="24" fill="#1d6fd1"/>
  <rect x="150" y="140" width="135.1" height="24" fill="#f2b880"/>
  <g font-size="11" fill="#1f2a44">
    <text x="144" y="42" text-anchor="end">TRIAD, good primary</text>
    <text x="144" y="80" text-anchor="end">TRIAD, poor primary</text>
    <text x="144" y="118" text-anchor="end">Optimal, right weights</text>
    <text x="144" y="156" text-anchor="end">Optimal, equal weights</text>
    <text x="280" y="42">1.197°</text>
    <text x="317" y="80">1.550°</text>
    <text x="280" y="118">1.196°</text>
    <text x="289" y="156">1.287°</text>
  </g>
</svg>
```
:::
