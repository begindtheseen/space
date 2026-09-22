---
id: l09-pseudoinverse-and-rank-deficiency
title: The pseudoinverse and rank deficiency
minutes: 23
covers:
  - pseudoinverse and rank deficiency
---

Lesson 8 wrote every matrix as $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$ — rotate, stretch, rotate. Undoing that should be easy, and for two of the three steps it is: a rotation is undone by its transpose. All the difficulty is in the stretch. If every $\sigma_i$ is positive you reverse each one and you have the inverse. If some $\sigma_i$ is zero, that direction was flattened to nothing and no matrix can bring it back. The pseudoinverse is what you get by reversing the stretches that can be reversed and declining to invent the ones that cannot.

This is not a repair job for pathological matrices. It is the normal situation in GNC. A least-squares fit has more measurements than states, so $\mathbf{A}$ is tall and has no inverse at all. A control allocator has more thrusters or wheels than body axes, so $\mathbf{B}$ is wide and has infinitely many exact solutions. A static alignment cannot separate an accelerometer bias from a platform tilt, because the two produce the identical output, so the measurement matrix is genuinely rank deficient and stays that way however long you average. In each case $\mathbf{A}^{-1}$ does not exist and the question "what should the estimate be?" still has to be answered by code that runs at 100 Hz.

This lesson defines the pseudoinverse $\mathbf{A}^+$ from the SVD, shows the shortcut formulas for the full-rank tall and wide cases, proves exactly what $\mathbf{x} = \mathbf{A}^+\mathbf{b}$ optimises, and then spends its second half on rank deficiency in practice: where it comes from on a vehicle, what "numerical rank" means when no singular value is ever exactly zero, and why deliberately throwing away the smallest singular values is often the right engineering decision.

## Inverting what can be inverted

Let $\mathbf{A}$ be $m\times n$ with rank $r$, and take its SVD $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$ with $\sigma_1 \ge \dots \ge \sigma_r > 0$ and $\sigma_{r+1} = \dots = 0$. Define $\boldsymbol{\Sigma}^+$, an $n\times m$ diagonal matrix, by reciprocating the nonzero singular values and leaving the zeros alone:

$$\left(\boldsymbol{\Sigma}^+\right)_{ii} = \begin{cases} 1/\sigma_i & i \le r \\ 0 & i > r. \end{cases}$$

::: key The Moore–Penrose pseudoinverse
$\mathbf{A}^+ = \mathbf{V}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T}$, where $\boldsymbol{\Sigma}^+$ inverts the non-zero singular values and leaves the rest at zero. It is $n\times m$ when $\mathbf{A}$ is $m\times n$, it exists for every matrix, and $\mathbf{x} = \mathbf{A}^+\mathbf{b}$ is the least-squares solution of minimum norm.
:::

Two products are worth having in your head. Because $\mathbf{U}^\mathsf{T}\mathbf{U} = \mathbf{I}$,

$$\mathbf{A}\mathbf{A}^+ = \mathbf{U}\boldsymbol{\Sigma}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T} = \sum_{i=1}^{r}\mathbf{u}_i\mathbf{u}_i^\mathsf{T}, \qquad \mathbf{A}^+\mathbf{A} = \mathbf{V}\boldsymbol{\Sigma}^+\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T} = \sum_{i=1}^{r}\mathbf{v}_i\mathbf{v}_i^\mathsf{T},$$

since $\boldsymbol{\Sigma}\boldsymbol{\Sigma}^+$ is diagonal with $r$ ones followed by zeros. Neither product is the identity in general. $\mathbf{A}\mathbf{A}^+$ is the orthogonal projector onto the column space of $\mathbf{A}$ — the measurements the model can actually produce — and $\mathbf{A}^+\mathbf{A}$ is the orthogonal projector onto the row space, the part of the state the matrix can see. What each projector discards is the left null space and the null space respectively, and those two subspaces are exactly where the trouble is.

When $\mathbf{A}$ is square and invertible, $r = n = m$, nothing is discarded, both projectors are $\mathbf{I}$, and $\mathbf{A}^+ = \mathbf{V}\boldsymbol{\Sigma}^{-1}\mathbf{U}^\mathsf{T} = \mathbf{A}^{-1}$. The pseudoinverse is a strict generalisation of the inverse, never a competitor to it.

### The two shortcut formulas

You rarely form an SVD by hand, and for full-rank matrices you do not have to.

**Tall and full column rank** ($m \ge n$, $r = n$). Every $\sigma_i > 0$, so $\mathbf{A}^\mathsf{T}\mathbf{A} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T} = \mathbf{V}\operatorname{diag}(\sigma_i^2)\mathbf{V}^\mathsf{T}$ is invertible with inverse $\mathbf{V}\operatorname{diag}(\sigma_i^{-2})\mathbf{V}^\mathsf{T}$. Multiply by $\mathbf{A}^\mathsf{T} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\mathbf{U}^\mathsf{T}$:

$$(\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}\mathbf{A}^\mathsf{T} = \mathbf{V}\operatorname{diag}(\sigma_i^{-2})\boldsymbol{\Sigma}^\mathsf{T}\mathbf{U}^\mathsf{T} = \mathbf{V}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T} = \mathbf{A}^+,$$

because $\operatorname{diag}(\sigma_i^{-2})\boldsymbol{\Sigma}^\mathsf{T}$ has entries $\sigma_i^{-2}\sigma_i = 1/\sigma_i$. So $\mathbf{A}^+ = (\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}\mathbf{A}^\mathsf{T}$, which is the normal-equation solution of Lesson 7 written as a matrix. Here $\mathbf{A}^+\mathbf{A} = \mathbf{I}_n$: the pseudoinverse is a genuine **left inverse**, and the least-squares problem has one unique answer.

**Wide and full row rank** ($m \le n$, $r = m$). The mirror argument on $\mathbf{A}\mathbf{A}^\mathsf{T} = \mathbf{U}\operatorname{diag}(\sigma_i^2)\mathbf{U}^\mathsf{T}$ gives $\mathbf{A}^+ = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{A}^\mathsf{T})^{-1}$, and now $\mathbf{A}\mathbf{A}^+ = \mathbf{I}_m$: a **right inverse**. Every $\mathbf{b}$ is reachable exactly, and the pseudoinverse picks out one solution from an infinite family.

**Rank deficient.** Neither Gram matrix is invertible, both shortcut formulas are meaningless, and only $\mathbf{V}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T}$ survives. This is the case `np.linalg.inv` refuses and `np.linalg.pinv` handles, and it is the reason the SVD is worth the extra arithmetic.

::: note The four defining conditions
$\mathbf{A}^+$ is the unique matrix $\mathbf{X}$ satisfying $\mathbf{A}\mathbf{X}\mathbf{A} = \mathbf{A}$, $\mathbf{X}\mathbf{A}\mathbf{X} = \mathbf{X}$, $(\mathbf{A}\mathbf{X})^\mathsf{T} = \mathbf{A}\mathbf{X}$ and $(\mathbf{X}\mathbf{A})^\mathsf{T} = \mathbf{X}\mathbf{A}$ — the Moore–Penrose conditions. The first two say $\mathbf{X}$ inverts $\mathbf{A}$ as far as it can; the last two say the two products are orthogonal projectors rather than oblique ones. You will not often check them, but they are why $\mathbf{A}^+$ is *the* pseudoinverse and not *a* generalised inverse: many matrices satisfy the first condition alone.
:::

## What a pseudoinverse solution optimises

Work in the singular bases, where everything decouples. Expand the data in the left singular vectors, $\mathbf{b} = \sum_{i=1}^{m}\beta_i\mathbf{u}_i$ with $\beta_i = \mathbf{u}_i^\mathsf{T}\mathbf{b}$, and the unknown in the right singular vectors, $\mathbf{x} = \sum_{j=1}^{n}\xi_j\mathbf{v}_j$. Since $\mathbf{A}\mathbf{v}_j = \sigma_j\mathbf{u}_j$ and $\sigma_j = 0$ beyond $r$,

$$\mathbf{A}\mathbf{x} - \mathbf{b} = \sum_{i=1}^{r}(\sigma_i\xi_i - \beta_i)\mathbf{u}_i - \sum_{i=r+1}^{m}\beta_i\mathbf{u}_i.$$

The $\mathbf{u}_i$ are orthonormal, so the squared residual is a sum of squares with no cross terms:

$$\|\mathbf{A}\mathbf{x} - \mathbf{b}\|^2 = \sum_{i=1}^{r}(\sigma_i\xi_i - \beta_i)^2 + \sum_{i=r+1}^{m}\beta_i^2.$$

Read off the whole story. The second sum does not contain $\mathbf{x}$ at all: it is the part of $\mathbf{b}$ lying in the left null space, which no choice of state can explain, and its square root is the minimum achievable residual. The first sum is driven to zero by $\xi_i = \beta_i/\sigma_i$ for each $i \le r$, and that choice is forced — there is no freedom there. The coefficients $\xi_{r+1}, \dots, \xi_n$, along the null space of $\mathbf{A}$, appear nowhere: they are free, and every value of them gives exactly the same residual. That is precisely what rank deficiency means, and no amount of extra data changes it as long as the geometry stays the same.

To choose among that flat family, look at the size of the answer. Because the $\mathbf{v}_j$ are orthonormal,

$$\|\mathbf{x}\|^2 = \sum_{i=1}^{r}\left(\frac{\beta_i}{\sigma_i}\right)^2 + \sum_{j=r+1}^{n}\xi_j^2,$$

and the free coefficients enter as a sum of squares, so the smallest solution sets every one of them to zero. What remains is $\mathbf{x} = \sum_{i\le r}(\beta_i/\sigma_i)\mathbf{v}_i = \mathbf{V}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T}\mathbf{b}$.

::: key What the pseudoinverse solves
$\mathbf{x} = \mathbf{A}^+\mathbf{b}$ minimises $\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert$, and among all minimisers it is the one with the smallest $\lVert\mathbf{x}\rVert$. Componentwise, $\mathbf{x} = \sum_{i \le r}(\mathbf{u}_i^\mathsf{T}\mathbf{b}/\sigma_i)\,\mathbf{v}_i$, and the minimum residual is the norm of the part of $\mathbf{b}$ outside the column space. The solution has no component in the null space of $\mathbf{A}$.
:::

That last sentence is the one to keep. The pseudoinverse answers only about the directions the data constrains, and reports zero for the directions it does not. Whether zero is the right default is an engineering question, not a mathematical one, and the rest of this lesson is about when it is.

## Where rank deficiency comes from

Four sources cover almost everything you will meet.

- **Two states the sensors cannot separate.** A GPS receiver seeing one satellite cannot distinguish its own clock bias from range along that line of sight. A static alignment cannot separate accelerometer bias from platform tilt. Worked below.
- **More actuators than axes.** Four reaction wheels driving three body axes, eight cold-gas thrusters producing six force-and-torque components, a control-moment-gyro cluster: the allocation matrix is wide by design, and the redundancy is the point.
- **A geometry that has degenerated.** Beacons that drift into a cluster, star-tracker stars that fall into a narrow cone, a ranging pass that happens to be radial: the matrix was full rank on paper and is nearly singular today.
- **An over-parameterised model.** Fitting a scale factor and a bias to data taken at one operating point, or a high-degree polynomial to a short arc, produces columns that are nearly linear combinations of one another.

The first two are *structural*: the rank deficiency is exact, it is there in the mathematics, and averaging more data never removes it. The last two are *numerical*: the singular values are small but nonzero, and you have to decide what counts as zero.

::: example Static alignment cannot separate bias from tilt
A strapdown inertial unit sits still on a pad while the navigation software estimates its accelerometer bias and its initial tilt. Along the body $x$-axis the specific-force measurement, after subtracting the known gravity vector, responds to a bias $b_x$ and to a small tilt $\theta_y$ about the body $y$-axis as

$$\delta f_x = b_x + g\,\theta_y, \qquad g = 9.80665\,\mathrm{m/s^2},$$

because tipping the instrument by $\theta_y$ spills a component $g\theta_y$ of gravity onto the $x$ accelerometer. Take three one-second averages, each reading $\delta f_x = 0.0300\,\mathrm{m/s^2}$. The state is $\mathbf{x} = (b_x, \theta_y)^\mathsf{T}$ and

$$\mathbf{H} = \begin{pmatrix} 1 & 9.80665 \\ 1 & 9.80665 \\ 1 & 9.80665 \end{pmatrix}, \qquad \mathbf{b} = \begin{pmatrix} 0.0300 \\ 0.0300 \\ 0.0300 \end{pmatrix}\,\mathrm{m/s^2}.$$

Every row is identical, so the rank is $1$ no matter how many seconds you average. The SVD is a single rank-one term: $\mathbf{v}_1 = (1, g)^\mathsf{T}/\sqrt{1 + g^2} = (0.1014, 0.9948)^\mathsf{T}$, $\mathbf{u}_1 = (1, 1, 1)^\mathsf{T}/\sqrt{3}$, and $\sigma_1 = \sqrt{3(1 + g^2)} = 17.07$, with $\sigma_2 = 0$ exactly. The null space is spanned by $\mathbf{v}_2 = (-0.9948, 0.1014)^\mathsf{T}$, the direction in which bias and tilt trade off against one another with no effect on any measurement.

The pseudoinverse solution uses the one usable coefficient, $\beta_1 = \mathbf{u}_1^\mathsf{T}\mathbf{b} = 3(0.0300)/\sqrt{3} = 0.05196$, giving $\beta_1/\sigma_1 = 3.043\times 10^{-3}$ and

$$\mathbf{x}^+ = \frac{\beta_1}{\sigma_1}\mathbf{v}_1 = \begin{pmatrix} 3.087\times 10^{-4}\,\mathrm{m/s^2} \\ 3.028\times 10^{-3}\,\mathrm{rad} \end{pmatrix} = \begin{pmatrix} 31.5\,\mu g \\ 10.4\ \mathrm{arcmin} \end{pmatrix}.$$

Check it against the one thing that is determined: $b_x + g\theta_y = 3.087\times 10^{-4} + 9.80665\times 3.028\times 10^{-3} = 0.0300\,\mathrm{m/s^2}$, exactly the measurement, and the residual is zero. So is the residual of "all bias, no tilt", $(0.0300, 0)$, and of "all tilt, no bias", $(0, 3.059\times 10^{-3})$. All three fit the data perfectly. The pseudoinverse picked the shortest of them — $\lVert\mathbf{x}^+\rVert = 3.043\times 10^{-3}$ against $0.0300$ and $3.059\times 10^{-3}$ — and there is no measurement on this pad that can say which is true. Breaking the tie takes new information: rotate the unit and repeat, which makes the two states respond differently and lifts the rank to two.
:::

::: warning "Minimum norm" depends on your units
Look again at the last comparison. The pure-bias solution had norm $0.0300$ and the pure-tilt solution $3.059\times 10^{-3}$, so the minimum-norm answer came out almost entirely tilt — but only because a bias was measured in $\mathrm{m/s^2}$ and a tilt in radians, and those numbers are not comparable. Rescale the tilt to arcminutes and the same physical solution has norm $10.4$, and the pseudoinverse would have chosen almost pure bias instead. $\lVert\mathbf{x}\rVert$ is a statement about the coordinates, not about the vehicle. When the components of a state have different units — and in GNC they always do — scale the columns of $\mathbf{A}$ so that a unit change in each state is physically comparable before you trust a minimum-norm answer, or use a weighted norm and say what the weights mean.
:::

## The wide side: control allocation

When $\mathbf{A}$ is wide the picture inverts: every target is reachable and the question is which of the infinitely many commands to send. Minimum norm is a defensible default here, because the norm of an actuator command is close to a physical cost — torque, momentum, propellant.

::: example Four reaction wheels, three axes
A spacecraft carries four reaction wheels in the standard pyramid: spin axes at azimuths $45^\circ$, $135^\circ$, $225^\circ$, $315^\circ$ and a cone half-angle $\beta$ from the $+z$ body axis with $\cos\beta = 1/\sqrt{3}$, so $\beta = 54.74^\circ$. Each axis is then $(\pm 1, \pm 1, 1)/\sqrt{3}$ and the body torque produced by wheel torques $\mathbf{u} = (u_1, u_2, u_3, u_4)^\mathsf{T}$ is $\boldsymbol{\tau} = \mathbf{B}\mathbf{u}$ with

$$\mathbf{B} = 0.5774\begin{pmatrix} 1 & -1 & -1 & 1 \\ 1 & 1 & -1 & -1 \\ 1 & 1 & 1 & 1 \end{pmatrix}.$$

The rows are mutually orthogonal and each has squared norm $4/3$, so $\mathbf{B}\mathbf{B}^\mathsf{T} = \tfrac{4}{3}\mathbf{I}$ and the wide-case shortcut gives the allocation law directly:

$$\mathbf{B}^+ = \mathbf{B}^\mathsf{T}\left(\tfrac{4}{3}\mathbf{I}\right)^{-1} = \tfrac{3}{4}\mathbf{B}^\mathsf{T}.$$

All three singular values are $\sqrt{4/3} = 1.155$: the cluster is as evenly conditioned as a four-wheel array can be, which is why this geometry is flown. Command $\boldsymbol{\tau} = (0.0500, 0, 0)^\mathsf{T}\,\mathrm{N\,m}$ about the roll axis and

$$\mathbf{u} = \mathbf{B}^+\boldsymbol{\tau} = (0.02165,\ -0.02165,\ -0.02165,\ 0.02165)^\mathsf{T}\,\mathrm{N\,m},$$

with $\lVert\mathbf{u}\rVert = 0.04330\,\mathrm{N\,m}$. Every wheel contributes, each at $43\%$ of the commanded torque, and no wheel is asked for more than it must be.

The null space is one-dimensional, spanned by $\mathbf{n} = (1, -1, 1, -1)^\mathsf{T}/2$: check $\mathbf{B}\mathbf{n} = \mathbf{0}$ row by row, since $1 + 1 - 1 - 1 = 0$, $1 - 1 - 1 + 1 = 0$ and $1 - 1 + 1 - 1 = 0$. Spinning the wheels in that pattern produces no body torque at all. Flight software uses exactly this **null motion** to bias wheel speeds away from zero, where bearing friction and jitter are worst, without disturbing attitude. The price is visible in the norm: adding $0.02\,\mathbf{n}$ to the allocation above leaves the torque unchanged but raises $\lVert\mathbf{u}\rVert$ from $0.04330$ to $0.04770\,\mathrm{N\,m}$, a $10\%$ increase in wheel effort for the same manoeuvre.

Now fail wheel 4. Deleting its column leaves a $3\times 3$ matrix with determinant $4/(3\sqrt{3}) = 0.7698$, still invertible, so three-axis control survives — but the singular values become $1.155$, $1.155$ and $0.5774$, and the same roll command now needs $\mathbf{u} = (0.04330, -0.04330, 0)^\mathsf{T}$ with norm $0.06124\,\mathrm{N\,m}$, $41\%$ more effort. Fail wheel 3 as well and the matrix is $3\times 2$: torque along $(0, -1, 1)^\mathsf{T}/\sqrt{2}$ is now in the left null space and simply cannot be produced. The pseudoinverse still returns an answer — the best least-squares effort — and it is the attitude controller's job, not the allocator's, to notice that the achieved torque is not the commanded one.
:::

## Numerical rank

In exact arithmetic rank is a count of nonzero singular values. In floating point nothing is ever exactly zero: round-off in forming $\mathbf{H}$, quantisation in the sensor, a beacon geometry that is nearly but not quite degenerate. So the practical definition needs a threshold.

::: key Numerical rank and the truncated pseudoinverse
The numerical rank of $\mathbf{A}$ at tolerance $\varepsilon_{\text{tol}}$ is the number of singular values with $\sigma_i > \varepsilon_{\text{tol}}$, usually set relative to the largest: $\varepsilon_{\text{tol}} = \texttt{rcond}\cdot\sigma_1$. The truncated pseudoinverse keeps only those terms, $\mathbf{A}^+_k = \sum_{i \le k}\sigma_i^{-1}\mathbf{v}_i\mathbf{u}_i^\mathsf{T}$, trading a bias in the discarded directions for an enormous reduction in noise amplification.
:::

Why truncation helps is clear from the component formula $\mathbf{x} = \sum_i(\beta_i/\sigma_i)\mathbf{v}_i$. Measurement noise contributes to every $\beta_i$ at roughly the same level, because the $\mathbf{u}_i$ are orthonormal and white noise looks the same in any orthonormal basis. Dividing by a small $\sigma_i$ therefore amplifies noise by $1/\sigma_i$ in that direction. A term with $\sigma_i = 0.02$ multiplies the noise by fifty while contributing almost nothing to the fit. Dropping it costs you the true state's component along $\mathbf{v}_i$ — a bias — and saves you $1/\sigma_i$ times the noise — a variance. When $\sigma_i$ is small enough, that trade is overwhelmingly worth making.

::: example Truncating a clustered beacon geometry
Take Lesson 8's clustered geometry further: three beacons at bearings $0^\circ$, $1^\circ$ and $2^\circ$ from a receiver in the plane, so the range Jacobian has unit line-of-sight rows

$$\mathbf{H} = \begin{pmatrix} 1 & 0 \\ 0.99985 & 0.017452 \\ 0.99939 & 0.034899 \end{pmatrix}.$$

Its singular values are $\sigma_1 = 1.7319$ and $\sigma_2 = 0.024681$, with $\mathbf{v}_1 = (0.99985, 0.017452)^\mathsf{T}$ pointing along the beacons at $1^\circ$ and $\mathbf{v}_2 = (-0.017452, 0.99985)^\mathsf{T}$ across them at $91^\circ$. The second left singular vector is $\mathbf{u}_2 = (-1, 0, 1)^\mathsf{T}/\sqrt{2}$: only the *difference* between the first and third ranges carries any cross-track information, and it carries very little.

Let the true position offset be $\boldsymbol{\delta} = (0.5, 0.5)^\mathsf{T}\,\mathrm{m}$, so the noise-free range residuals are $\mathbf{H}\boldsymbol{\delta} = (0.5000, 0.50865, 0.51714)^\mathsf{T}\,\mathrm{m}$. Add a modest ranging error of $(+0.10, -0.15, +0.05)\,\mathrm{m}$ — a few decimetres, ordinary for a radio ranging system — giving $\mathbf{b} = (0.6000, 0.35865, 0.56714)^\mathsf{T}\,\mathrm{m}$.

The full pseudoinverse returns $\mathbf{x} = \mathbf{H}^+\mathbf{b} = (0.525, -0.932)^\mathsf{T}\,\mathrm{m}$, which is $1.43\,\mathrm{m}$ from the truth. Trace where that came from: the noise projected onto $\mathbf{u}_2$ is $\mathbf{u}_2^\mathsf{T}\mathbf{n} = (-0.10 + 0.05)/\sqrt{2} = -0.035355\,\mathrm{m}$, and dividing by $\sigma_2 = 0.024681$ turns $3.5\,\mathrm{cm}$ of ranging noise into $1.43\,\mathrm{m}$ of position error. The second row of $\mathbf{H}^+$ has entries near $\pm 28.6$ and says the same thing more bluntly.

Truncate to rank one. The single kept coefficient is $\beta_1/\sigma_1 = 0.50864$, giving $\mathbf{x}_1 = 0.50864\,\mathbf{v}_1 = (0.50856, 0.00888)^\mathsf{T}\,\mathrm{m}$. The error is now $0.491\,\mathrm{m}$, and it is pure bias: it is exactly $\boldsymbol{\delta}^\mathsf{T}\mathbf{v}_2 = 0.4912\,\mathrm{m}$, the true cross-track offset that we have chosen not to estimate. Three times better than the full solution, from throwing information away.

The residuals settle the argument. The full solution fits the data with $\lVert\mathbf{H}\mathbf{x} - \mathbf{b}\rVert = 0.1837\,\mathrm{m}$, the rank-one solution with $0.1852\,\mathrm{m}$: an improvement of under $1\%$ in fit, bought at the cost of a metre of position error and a solution norm that grew from $0.509$ to $1.070$. That signature — a large, wild solution that fits the data a hair better than a small tame one — is what a small singular value looks like from the outside.
:::

::: warning The pseudoinverse is not a continuous function of the matrix
Let $\mathbf{A}_\epsilon = \operatorname{diag}(1, \epsilon)$. For every $\epsilon \neq 0$, $\mathbf{A}_\epsilon^+ = \operatorname{diag}(1, 1/\epsilon)$, which grows without bound as $\epsilon \to 0$. But at $\epsilon = 0$ exactly, the rank drops and $\mathbf{A}_0^+ = \operatorname{diag}(1, 0)$. A change of $10^{-12}$ in one entry can change $\mathbf{A}^+$ by $10^{12}$, or snap it back to something small. So never test rank with an equality, never trust a pseudoinverse computed from a matrix whose small singular values are at the level of your own round-off, and choose `rcond` deliberately: it is the one place where you tell the software what "zero" means for your problem.
:::

Choosing the tolerance is an engineering decision. The default in `np.linalg.pinv` and `np.linalg.matrix_rank` is a few times $\max(m, n)\,\varepsilon\,\sigma_1$ with $\varepsilon \approx 2.2\times 10^{-16}$, which only discards singular values lost to floating-point round-off. That is the right default for a matrix known exactly and the wrong one for a measurement geometry: in the example above every singular value was far above machine precision, and the cut had to be made at $0.05\,\sigma_1$ on physical grounds — how much noise amplification the navigation error budget can stand. Set the threshold from your error budget, log the discarded singular values, and treat a rank drop as an event the system should report rather than absorb silently.

```python
import numpy as np

# Three beacons clustered at 0, 1 and 2 degrees: nearly rank deficient.
a = np.radians([0.0, 1.0, 2.0])
H = np.column_stack([np.cos(a), np.sin(a)])
b = H @ np.array([0.5, 0.5]) + np.array([0.10, -0.15, 0.05])   # range residuals, m

U, s, Vt = np.linalg.svd(H, full_matrices=False)
print(s)                            # [1.73187495 0.02468143]
print(np.linalg.pinv(H) @ b)        # [ 0.52499238 -0.93224917]

keep = s > 0.05 * s[0]              # engineering rank threshold, not machine epsilon
sp = np.where(keep, 1.0 / s, 0.0)
print(Vt.T @ (sp * (U.T @ b)))      # [0.50856497 0.00887703]
print(np.linalg.matrix_rank(H, tol=0.05 * s[0]))   # 1
```

Truncation is the crudest of the regularisers. Tikhonov regularisation replaces $1/\sigma_i$ by $\sigma_i/(\sigma_i^2 + \lambda^2)$, which rolls off smoothly instead of switching, and a Kalman filter's prior covariance does the same job automatically: the prior supplies information in exactly the directions the measurement does not, so the filter never has to divide by a tiny singular value at all. The estimation module returns to this. What matters here is the diagnosis — a small $\sigma_i$ means a direction the data does not constrain — and the diagnosis is the same whichever cure you pick.

## Check yourself

::: check
Compute $\mathbf{A}^+$ for $\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 2 & 2 \\ 3 & 3 \end{pmatrix}$ and use it to solve $\mathbf{A}\mathbf{x} = (2, 4, 6)^\mathsf{T}$. Why do the normal equations fail here?
:::

::: answer
The columns are identical, so $\mathbf{A} = \mathbf{c}\,\mathbf{d}^\mathsf{T}$ with $\mathbf{c} = (1, 2, 3)^\mathsf{T}$ and $\mathbf{d} = (1, 1)^\mathsf{T}$: rank one. Then $\sigma_1 = \lVert\mathbf{c}\rVert\,\lVert\mathbf{d}\rVert = \sqrt{14}\sqrt{2} = \sqrt{28} = 5.292$, with $\mathbf{u}_1 = \mathbf{c}/\sqrt{14}$ and $\mathbf{v}_1 = \mathbf{d}/\sqrt{2}$, and

$$\mathbf{A}^+ = \frac{\mathbf{v}_1\mathbf{u}_1^\mathsf{T}}{\sigma_1} = \frac{\mathbf{d}\mathbf{c}^\mathsf{T}}{\sqrt{2}\sqrt{14}\sqrt{28}} = \frac{1}{28}\begin{pmatrix} 1 & 2 & 3 \\ 1 & 2 & 3 \end{pmatrix}.$$

Then $\mathbf{A}^+\mathbf{b} = \tfrac{1}{28}(2 + 8 + 18,\ 2 + 8 + 18)^\mathsf{T} = (1, 1)^\mathsf{T}$, and $\mathbf{A}(1, 1)^\mathsf{T} = (2, 4, 6)^\mathsf{T}$ exactly: zero residual. Every $\mathbf{x}$ with $x_1 + x_2 = 2$ does equally well, and $(1, 1)$ is the shortest of them, with $\lVert\mathbf{x}\rVert = 1.414$ against $2$ for $(2, 0)$. The normal equations fail because $\mathbf{A}^\mathsf{T}\mathbf{A} = \begin{pmatrix} 14 & 14 \\ 14 & 14 \end{pmatrix}$ is singular — determinant zero — so $(\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}$ does not exist and there is nothing to invert.
:::

::: check
$\mathbf{A}$ is $5\times 3$ with singular values $4$, $2$ and $0$. State the sizes and ranks of $\mathbf{A}^+$, $\mathbf{A}\mathbf{A}^+$ and $\mathbf{A}^+\mathbf{A}$, and say what each product does geometrically.
:::

::: answer
$\mathbf{A}^+$ is $3\times 5$ with rank $2$, since it has the reciprocals $1/4$ and $1/2$ and one zero. $\mathbf{A}\mathbf{A}^+$ is $5\times 5$ with rank $2$: the orthogonal projector $\mathbf{u}_1\mathbf{u}_1^\mathsf{T} + \mathbf{u}_2\mathbf{u}_2^\mathsf{T}$ onto the two-dimensional column space, which throws away the three-dimensional left null space — the part of any measurement vector the model cannot explain. $\mathbf{A}^+\mathbf{A}$ is $3\times 3$ with rank $2$: the projector $\mathbf{v}_1\mathbf{v}_1^\mathsf{T} + \mathbf{v}_2\mathbf{v}_2^\mathsf{T}$ onto the row space, which zeroes the one-dimensional null space. Neither is the identity, and $\mathbf{A}^+$ is neither a left nor a right inverse.
:::

::: check
An allocator sends $\mathbf{u} = \mathbf{B}^+\boldsymbol{\tau}$ to the four-wheel pyramid and an operator asks why the software does not instead use only three wheels and keep the fourth as a cold spare. Answer with numbers from the lesson.
:::

::: answer
With all four wheels the roll command $\boldsymbol{\tau} = (0.05, 0, 0)^\mathsf{T}\,\mathrm{N\,m}$ costs $\lVert\mathbf{u}\rVert = 0.0433\,\mathrm{N\,m}$ spread evenly, $0.02165$ per wheel. Using only wheels 1, 2 and 3 forces $\mathbf{u} = (0.0433, -0.0433, 0)^\mathsf{T}$: two wheels carry twice as much torque each and the total effort rises to $0.0612\,\mathrm{N\,m}$, $41\%$ more. The minimum-norm property is exactly the statement that spreading the load over the redundant set is cheapest in the sum-of-squares sense, so peak wheel torque, peak current and bearing wear are all lower. The cold spare also buys nothing in conditioning: with four wheels all three singular values are $1.155$, with three they are $1.155$, $1.155$ and $0.577$, so the degraded cluster is twice as stiff about one axis as another. Keep the fourth wheel spinning and it is available the instant another fails.
:::

::: check
A measurement matrix has singular values $\sigma = (12.0,\ 3.5,\ 0.004)$ and the range noise is $0.1\,\mathrm{m}$ one sigma. Estimate the noise-driven error the third term contributes, and decide whether to truncate.
:::

::: answer
Noise of $0.1\,\mathrm{m}$ projected onto $\mathbf{u}_3$ is about $0.1\,\mathrm{m}$ in that coefficient, since an orthonormal projection preserves the scale of white noise. Dividing by $\sigma_3 = 0.004$ gives roughly $0.1/0.004 = 25\,\mathrm{m}$ of error along $\mathbf{v}_3$, against $0.1/12 = 0.008\,\mathrm{m}$ along $\mathbf{v}_1$ and $0.029\,\mathrm{m}$ along $\mathbf{v}_2$. The third term dominates the error budget by three orders of magnitude and contributes almost nothing to the fit, so truncate to rank two unless the error budget genuinely tolerates $25\,\mathrm{m}$. The cost is the true state's component along $\mathbf{v}_3$, which you should report as an unestimated bias rather than hide. Better still, wait for geometry that raises $\sigma_3$, or bring in a prior that constrains $\mathbf{v}_3$ directly.
:::

::: check
Show that $\mathbf{A}^+ = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{A}^\mathsf{T})^{-1}$ really is a right inverse when $\mathbf{A}$ is wide with full row rank, and explain why the same expression is useless for a tall matrix.
:::

::: answer
Substituting directly, $\mathbf{A}\mathbf{A}^+ = \mathbf{A}\mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{A}^\mathsf{T})^{-1} = \mathbf{I}_m$, which is what a right inverse means: every target $\mathbf{b}$ in $\mathbb{R}^m$ is hit exactly, with zero residual. The inverse exists because $\mathbf{A}\mathbf{A}^\mathsf{T}$ is $m\times m$ with the $m$ positive eigenvalues $\sigma_i^2$. For a tall $\mathbf{A}$ with $m > n$, the matrix $\mathbf{A}\mathbf{A}^\mathsf{T}$ is still $m\times m$ but has rank at most $n < m$, so it is singular and cannot be inverted at all. Tall matrices use the other shortcut, $(\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}\mathbf{A}^\mathsf{T}$, whose Gram matrix is the $n\times n$ one. The rule of thumb: form the Gram matrix on the *short* side, and if neither side is full rank, fall back to the SVD.
:::

## Summary

| Item | Statement |
| --- | --- |
| Definition | $\mathbf{A}^+ = \mathbf{V}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T}$, $n\times m$; $\boldsymbol{\Sigma}^+$ holds $1/\sigma_i$ for $\sigma_i > 0$ and zero elsewhere |
| Component form | $\mathbf{A}^+\mathbf{b} = \sum_{i\le r}(\mathbf{u}_i^\mathsf{T}\mathbf{b}/\sigma_i)\,\mathbf{v}_i$ |
| What it solves | minimises $\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert$; among those, minimises $\lVert\mathbf{x}\rVert$; no null-space component |
| Projectors | $\mathbf{A}\mathbf{A}^+ = \sum_{i \le r}\mathbf{u}_i\mathbf{u}_i^\mathsf{T}$ onto the column space; $\mathbf{A}^+\mathbf{A} = \sum_{i \le r}\mathbf{v}_i\mathbf{v}_i^\mathsf{T}$ onto the row space |
| Square, invertible | $\mathbf{A}^+ = \mathbf{A}^{-1}$ |
| Tall, full column rank | $\mathbf{A}^+ = (\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}\mathbf{A}^\mathsf{T}$, a left inverse; unique least-squares solution |
| Wide, full row rank | $\mathbf{A}^+ = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{A}^\mathsf{T})^{-1}$, a right inverse; minimum-norm exact solution |
| Rank deficient | neither Gram matrix invertible; only the SVD form works |
| Numerical rank | count of $\sigma_i > \texttt{rcond}\cdot\sigma_1$; set `rcond` from the error budget, not from machine epsilon |
| Truncated pseudoinverse | $\mathbf{A}^+_k = \sum_{i\le k}\sigma_i^{-1}\mathbf{v}_i\mathbf{u}_i^\mathsf{T}$; bias along the dropped $\mathbf{v}_i$ in exchange for removing $1/\sigma_i$ noise gain |
| Noise gain | noise along $\mathbf{u}_i$ becomes state error $1/\sigma_i$ times as large along $\mathbf{v}_i$ |
| Null motion | $\mathbf{B}\mathbf{n} = \mathbf{0}$ means actuator commands with no effect; for the four-wheel pyramid $\mathbf{n} = (1, -1, 1, -1)^\mathsf{T}/2$ |
| Warning | $\mathbf{A}^+$ is discontinuous at a rank change; minimum norm depends on the units of the state |
| NumPy | `np.linalg.pinv(A, rcond=...)`, `np.linalg.matrix_rank(A, tol=...)` |

The theme running through this lesson is that a small singular value is expensive: it divides the noise by a small number and returns a large, unreliable answer. The next lesson makes that statement quantitative. The ratio $\sigma_{\max}/\sigma_{\min}$ is the condition number, it bounds how much a solve can amplify any perturbation, and it comes with a rule of thumb — roughly $\log_{10}\kappa$ decimal digits lost — that lets you decide in advance whether a solve is worth trusting.
