---
id: l09-pseudoinverse-and-rank-deficiency
title: The pseudoinverse and rank deficiency
minutes: 24
covers:
  - pseudoinverse and rank deficiency
---

Photograph a tall building from straight above. The photo shows the roof perfectly and nothing at all about the height. No editing can bring the height back, because the camera never recorded it. The honest move is to report what the photo *does* show and admit the height is unknown. That is the pseudoinverse in one picture.

Lesson 8 wrote every matrix as $\mathbf{A} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T}$ — turn, stretch, turn. Undoing that should be easy, and for two of the three steps it is: a rotation is undone by its transpose. All the difficulty is in the stretch. If every $\sigma_i$ is positive, you reverse each stretch and you have the inverse. If some $\sigma_i$ is zero, that direction was flattened to nothing, like the building's height, and no matrix can bring it back. The **pseudoinverse** reverses the stretches that can be reversed and refuses to invent the ones that cannot.

This is everyday GNC, not a repair kit for strange matrices. A least-squares fit has more measurements than states, so $\mathbf{A}$ is tall and has no inverse. A control allocator has more thrusters or wheels than body axes, so $\mathbf{B}$ is wide and has infinitely many exact solutions. A static alignment cannot tell an accelerometer bias from a tilt, so its measurement matrix is **rank deficient** — its rank is smaller than the number of unknowns — however long you average. In each case $\mathbf{A}^{-1}$ does not exist, and code running at 100 Hz still has to answer "what should the estimate be?"

## Inverting what can be inverted

Let $\mathbf{A}$ be $m\times n$ with rank $r$. Take its SVD with $\sigma_1 \ge \dots \ge \sigma_r > 0$ and $\sigma_{r+1} = \dots = 0$. Build $\boldsymbol{\Sigma}^+$ ("sigma plus"), an $n\times m$ diagonal matrix, by flipping each nonzero singular value to its reciprocal and leaving the zeros as zeros:

$$\left(\boldsymbol{\Sigma}^+\right)_{ii} = \begin{cases} 1/\sigma_i & i \le r \\ 0 & i > r. \end{cases}$$

Then turn back the other way. The result is named after the **[[mathematicians|moore-penrose]]** who found it.

::: key The Moore–Penrose pseudoinverse
$\mathbf{A}^+ = \mathbf{V}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T}$, where $\boldsymbol{\Sigma}^+$ inverts the non-zero singular values and leaves the rest at zero. It is $n\times m$ when $\mathbf{A}$ is $m\times n$, it exists for every matrix, and $\mathbf{x} = \mathbf{A}^+\mathbf{b}$ is the least-squares solution of minimum norm.
:::

Read $\mathbf{A}^+$ as "A plus", or "A dagger" in some books.

### What the two products do

Because $\mathbf{U}^\mathsf{T}\mathbf{U} = \mathbf{I}$ and $\mathbf{V}^\mathsf{T}\mathbf{V} = \mathbf{I}$, the middle factors cancel:

$$\mathbf{A}\mathbf{A}^+ = \mathbf{U}\boldsymbol{\Sigma}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T} = \sum_{i=1}^{r}\mathbf{u}_i\mathbf{u}_i^\mathsf{T}, \qquad \mathbf{A}^+\mathbf{A} = \mathbf{V}\boldsymbol{\Sigma}^+\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T} = \sum_{i=1}^{r}\mathbf{v}_i\mathbf{v}_i^\mathsf{T}.$$

Here $\boldsymbol{\Sigma}\boldsymbol{\Sigma}^+$ is diagonal with $r$ ones ($\sigma_i$ times $1/\sigma_i$) followed by zeros.

Neither product is the identity in general. Each is a **projector**: a matrix that drops a vector's shadow onto a subspace. $\mathbf{A}\mathbf{A}^+$ is the [[orthogonal projector onto the column space|projector-picture]] of $\mathbf{A}$ — the measurements the model can actually produce. $\mathbf{A}^+\mathbf{A}$ projects onto the row space — the part of the state the matrix can see. What they throw away — the left null space and the null space — is exactly where the trouble lives.

When $\mathbf{A}$ is square and invertible, $r = n = m$. Nothing is thrown away, both projectors are $\mathbf{I}$, and $\mathbf{A}^+ = \mathbf{V}\boldsymbol{\Sigma}^{-1}\mathbf{U}^\mathsf{T} = \mathbf{A}^{-1}$. The pseudoinverse extends the inverse; it never disagrees with it.

### The two shortcut formulas

You rarely compute an SVD by hand, and for full-rank matrices you do not need to.

**Tall, full column rank** ($m \ge n$, $r = n$). Every $\sigma_i > 0$. So $\mathbf{A}^\mathsf{T}\mathbf{A} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\boldsymbol{\Sigma}\mathbf{V}^\mathsf{T} = \mathbf{V}\operatorname{diag}(\sigma_i^2)\mathbf{V}^\mathsf{T}$ is invertible, with inverse $\mathbf{V}\operatorname{diag}(\sigma_i^{-2})\mathbf{V}^\mathsf{T}$. Multiply by $\mathbf{A}^\mathsf{T} = \mathbf{V}\boldsymbol{\Sigma}^\mathsf{T}\mathbf{U}^\mathsf{T}$:

$$(\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}\mathbf{A}^\mathsf{T} = \mathbf{V}\operatorname{diag}(\sigma_i^{-2})\boldsymbol{\Sigma}^\mathsf{T}\mathbf{U}^\mathsf{T} = \mathbf{V}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T} = \mathbf{A}^+.$$

The middle step holds because $\operatorname{diag}(\sigma_i^{-2})\boldsymbol{\Sigma}^\mathsf{T}$ has entries $\sigma_i^{-2}\sigma_i = 1/\sigma_i$. So $\mathbf{A}^+ = (\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}\mathbf{A}^\mathsf{T}$ — the normal-equation solution of Lesson 7, written as a matrix. Here $\mathbf{A}^+\mathbf{A} = \mathbf{I}_n$: the pseudoinverse is a genuine **left inverse** (it undoes $\mathbf{A}$ when multiplied on the left), and the least-squares problem has exactly one answer.

**Wide, full row rank** ($m \le n$, $r = m$). The mirror-image argument on $\mathbf{A}\mathbf{A}^\mathsf{T} = \mathbf{U}\operatorname{diag}(\sigma_i^2)\mathbf{U}^\mathsf{T}$ gives

$$\mathbf{A}^+ = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{A}^\mathsf{T})^{-1},$$

and now $\mathbf{A}\mathbf{A}^+ = \mathbf{I}_m$: a **right inverse**. Every target $\mathbf{b}$ can be hit exactly, and the pseudoinverse picks one solution out of an infinite family.

**Rank deficient.** Neither Gram matrix is invertible, both shortcuts break, and only $\mathbf{V}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T}$ survives. That is the case `np.linalg.inv` refuses and `np.linalg.pinv` handles.

::: note The four defining conditions
$\mathbf{A}^+$ is the unique matrix $\mathbf{X}$ satisfying $\mathbf{A}\mathbf{X}\mathbf{A} = \mathbf{A}$, $\mathbf{X}\mathbf{A}\mathbf{X} = \mathbf{X}$, $(\mathbf{A}\mathbf{X})^\mathsf{T} = \mathbf{A}\mathbf{X}$ and $(\mathbf{X}\mathbf{A})^\mathsf{T} = \mathbf{X}\mathbf{A}$ — the Moore–Penrose conditions. The first two say $\mathbf{X}$ inverts $\mathbf{A}$ as far as it can. The last two say the two products are orthogonal projectors — straight-down shadows — rather than slanted ones. They are why $\mathbf{A}^+$ is *the* pseudoinverse and not merely *a* generalized inverse: many matrices satisfy the first condition alone.
:::

## What a pseudoinverse solution optimizes

Work in the singular directions, where everything splits into separate one-number problems.

**Set up.** Write the data along the left singular vectors, $\mathbf{b} = \sum_{i=1}^{m}\beta_i\mathbf{u}_i$ with $\beta_i = \mathbf{u}_i^\mathsf{T}\mathbf{b}$ ("beta i"). Write the unknown along the right singular vectors, $\mathbf{x} = \sum_{j=1}^{n}\xi_j\mathbf{v}_j$ ("xi j"). Since $\mathbf{A}\mathbf{v}_j = \sigma_j\mathbf{u}_j$, and $\sigma_j = 0$ beyond $r$,

$$\mathbf{A}\mathbf{x} - \mathbf{b} = \sum_{i=1}^{r}(\sigma_i\xi_i - \beta_i)\mathbf{u}_i - \sum_{i=r+1}^{m}\beta_i\mathbf{u}_i.$$

**The miss.** The $\mathbf{u}_i$ are perpendicular unit vectors, so the squared length of the residual is a plain sum of squares, with no cross terms — Pythagoras in many dimensions:

$$\|\mathbf{A}\mathbf{x} - \mathbf{b}\|^2 = \sum_{i=1}^{r}(\sigma_i\xi_i - \beta_i)^2 + \sum_{i=r+1}^{m}\beta_i^2.$$

Read the whole story off that line.

- The second sum does not contain $\mathbf{x}$ at all. It is the part of $\mathbf{b}$ in the left null space, which no state can explain; its square root is the smallest possible miss.
- The first sum is driven to zero by $\xi_i = \beta_i/\sigma_i$ for each $i \le r$. That choice is forced; there is no freedom there.
- The coefficients $\xi_{r+1}, \dots, \xi_n$, along the null space of $\mathbf{A}$, appear nowhere. They are free, and every value gives exactly the same miss.

That third point is exactly what rank deficiency means, and more data with the same geometry never changes it.

**The size.** To pick one answer from that flat family, look at its length. The $\mathbf{v}_j$ are perpendicular unit vectors, so

$$\|\mathbf{x}\|^2 = \sum_{i=1}^{r}\left(\frac{\beta_i}{\sigma_i}\right)^2 + \sum_{j=r+1}^{n}\xi_j^2.$$

The free coefficients add their squares, so the [[shortest solution|min-norm-picture]] sets every one of them to zero. What is left is

$$\mathbf{x} = \sum_{i\le r}\frac{\beta_i}{\sigma_i}\mathbf{v}_i = \mathbf{V}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T}\mathbf{b}.$$

::: key What the pseudoinverse solves
$\mathbf{x} = \mathbf{A}^+\mathbf{b}$ minimises $\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert$, and among all minimisers it is the one with the smallest $\lVert\mathbf{x}\rVert$. Componentwise, $\mathbf{x} = \sum_{i \le r}(\mathbf{u}_i^\mathsf{T}\mathbf{b}/\sigma_i)\,\mathbf{v}_i$, and the minimum residual is the norm of the part of $\mathbf{b}$ outside the column space. The solution has no component in the null space of $\mathbf{A}$.
:::

That last sentence is the one to keep. The pseudoinverse answers only about the directions the data pins down and reports zero for the rest — like writing the building's unknown height as zero. Whether zero is the right default is an engineering question, and the rest of this lesson is about when it is.

## Where rank deficiency comes from

Four sources cover almost everything you will meet.

- **Two states the sensors cannot separate.** A GPS receiver seeing one satellite cannot tell its own **[[clock error|gps-clock]]** from its range along that line of sight. A static alignment cannot separate accelerometer bias from tilt (worked below).
- **More actuators than axes.** Four reaction wheels for three axes, eight cold-gas thrusters for six force-and-torque components: the allocation matrix is wide on purpose.
- **A geometry that has worn down.** Beacons drifting into a bunch, star-tracker stars in a narrow cone, a ranging pass that points straight up: full rank on paper, nearly singular today.
- **A model with too many knobs.** A scale factor and a bias fitted at one operating point, or a high-degree polynomial on a short arc, give columns that are nearly combinations of one another.

The first two are **structural**: the deficiency is exact, and more data never removes it. The last two are **numerical**: the singular values are small but not zero, and you must decide what counts as zero.

::: example Static alignment cannot separate bias from tilt
**The setup.** A strapdown inertial unit (bolted straight to the vehicle) sits still on a launch pad while the software estimates its accelerometer bias and starting tilt. Along the body $x$-axis, the accelerometer reading (after subtracting known gravity) responds to a bias $b_x$ and to a small tilt $\theta_y$ about the body $y$-axis as

$$\delta f_x = b_x + g\,\theta_y, \qquad g = 9.80665\,\mathrm{m/s^2}.$$

Tipping the instrument by $\theta_y$ radians spills a slice $g\theta_y$ of gravity onto the $x$ accelerometer. Take three one-second averages, each reading $\delta f_x = 0.0300\,\mathrm{m/s^2}$. The state is $\mathbf{x} = (b_x, \theta_y)^\mathsf{T}$, and

$$\mathbf{H} = \begin{pmatrix} 1 & 9.80665 \\ 1 & 9.80665 \\ 1 & 9.80665 \end{pmatrix}, \qquad \mathbf{b} = \begin{pmatrix} 0.0300 \\ 0.0300 \\ 0.0300 \end{pmatrix}\,\mathrm{m/s^2}.$$

**The SVD.** Every row is the same, so the rank is $1$ however many seconds you average. The SVD is a single rank-one piece:

- $\mathbf{v}_1 = (1, g)^\mathsf{T}/\sqrt{1 + g^2} = (0.1014, 0.9948)^\mathsf{T}$, the direction of the repeated row;
- $\mathbf{u}_1 = (1, 1, 1)^\mathsf{T}/\sqrt{3}$, since all three measurements respond alike;
- $\sigma_1 = \sqrt{3(1 + g^2)} = 17.07$, and $\sigma_2 = 0$ exactly.

The null space is spanned by $\mathbf{v}_2 = (-0.9948, 0.1014)^\mathsf{T}$: the direction in which bias and tilt trade off against each other with no effect on any measurement.

**The pseudoinverse answer.** There is one usable coefficient:

$$\beta_1 = \mathbf{u}_1^\mathsf{T}\mathbf{b} = \frac{3\times 0.0300}{\sqrt{3}} = 0.05196, \qquad \frac{\beta_1}{\sigma_1} = \frac{0.05196}{17.07} = 3.043\times 10^{-3}.$$

So

$$\mathbf{x}^+ = \frac{\beta_1}{\sigma_1}\mathbf{v}_1 = \begin{pmatrix} 3.087\times 10^{-4}\,\mathrm{m/s^2} \\ 3.028\times 10^{-3}\,\mathrm{rad} \end{pmatrix} = \begin{pmatrix} 31.5\,\mu g \\ 10.4\ \mathrm{arcmin} \end{pmatrix}.$$

(The units in the last column — **[[micro-g and arcminutes|mug-arcmin]]** — are the ones inertial engineers talk in.)

**Checks.** Test it against the one thing that is known: $b_x + g\theta_y = 3.087\times 10^{-4} + 9.80665\times 3.028\times 10^{-3} = 0.0300\,\mathrm{m/s^2}$. That is exactly the measurement, so the residual is zero.

But "all bias, no tilt", $(0.0300, 0)$, also has zero residual. So does "all tilt, no bias", $(0, 3.059\times 10^{-3})$. All three fit the data perfectly. The pseudoinverse picked the shortest — $\lVert\mathbf{x}^+\rVert = 3.043\times 10^{-3}$, against $0.0300$ and $3.059\times 10^{-3}$ — and no measurement on this pad can say which is true. Breaking the tie takes new information: rotate the unit and measure again. Then the two states respond differently, and the rank rises to two.
:::

::: warning "Minimum norm" depends on your units
Look again at that comparison. The pure-bias answer had norm $0.0300$ and the pure-tilt answer $3.059\times 10^{-3}$, so the minimum-norm answer came out almost all tilt. But that is only because bias was in $\mathrm{m/s^2}$ and tilt in radians, and those numbers cannot be compared. Measure tilt in arcminutes instead and the pure-tilt answer becomes $10.5$, far longer than the pure-bias $0.0300$ — and the pseudoinverse would now pick almost pure bias. $\lVert\mathbf{x}\rVert$ is a statement about your coordinates, not about the vehicle. When the parts of a state have different units — in GNC they always do — scale the columns of $\mathbf{A}$ so that one unit of each state means something physically comparable before you trust a minimum-norm answer. Or use a weighted norm and say what the weights mean.
:::

## The wide side: control allocation

When $\mathbf{A}$ is wide, the picture flips. Every target can be reached, and the question is which of infinitely many commands to send. Minimum norm is a sensible default, because the size of an actuator command is close to a physical cost — torque, momentum, propellant.

::: example Four reaction wheels, three axes
**The geometry.** A spacecraft carries four **reaction wheels** — flywheels that twist the spacecraft the other way when they speed up. They sit in the standard **pyramid**: spin axes at azimuths $45^\circ$, $135^\circ$, $225^\circ$ and $315^\circ$ around the $+z$ body axis, each tilted from $+z$ by a cone half-angle $\beta$ with $\cos\beta = 1/\sqrt{3}$, so $\beta = 54.74^\circ$. Then each axis is $(\pm 1, \pm 1, 1)/\sqrt{3}$. The body torque from wheel torques $\mathbf{u} = (u_1, u_2, u_3, u_4)^\mathsf{T}$ is $\boldsymbol{\tau} = \mathbf{B}\mathbf{u}$ ($\boldsymbol{\tau}$ is "tau"), with the wheel axes as the columns of

$$\mathbf{B} = 0.5774\begin{pmatrix} 1 & -1 & -1 & 1 \\ 1 & 1 & -1 & -1 \\ 1 & 1 & 1 & 1 \end{pmatrix}.$$

**The allocation law.** The rows are perpendicular to each other, and each has squared length $4\times(1/3) = 4/3$. So $\mathbf{B}\mathbf{B}^\mathsf{T} = \tfrac{4}{3}\mathbf{I}$, and the wide-case shortcut gives

$$\mathbf{B}^+ = \mathbf{B}^\mathsf{T}\left(\tfrac{4}{3}\mathbf{I}\right)^{-1} = \tfrac{3}{4}\mathbf{B}^\mathsf{T}.$$

All three singular values are $\sqrt{4/3} = 1.155$: the array is as evenly balanced as four wheels can be, which is why this layout is flown.

**A roll command.** Ask for $\boldsymbol{\tau} = (0.0500, 0, 0)^\mathsf{T}\,\mathrm{N\,m}$ about the roll axis:

$$\mathbf{u} = \mathbf{B}^+\boldsymbol{\tau} = (0.02165,\ -0.02165,\ -0.02165,\ 0.02165)^\mathsf{T}\,\mathrm{N\,m},$$

with $\lVert\mathbf{u}\rVert = 0.04330\,\mathrm{N\,m}$. Every wheel helps, each at $43\%$ of the commanded torque.

**Null motion.** The null space is one-dimensional, spanned by $\mathbf{n} = (1, -1, 1, -1)^\mathsf{T}/2$. Check $\mathbf{B}\mathbf{n} = \mathbf{0}$ row by row: $1 + 1 - 1 - 1 = 0$, $1 - 1 - 1 + 1 = 0$ and $1 - 1 + 1 - 1 = 0$. Spinning the wheels in that [[pattern|wheel-pyramid]] makes no body torque at all. Flight software uses this **null motion** to keep wheel speeds away from **[[zero|zero-speed]]**, where bearing friction and jitter are worst, without disturbing the attitude. The cost shows in the norm: adding $0.02\,\mathbf{n}$ to the allocation leaves the torque unchanged but raises $\lVert\mathbf{u}\rVert$ from $0.04330$ to $0.04770\,\mathrm{N\,m}$ — $10\%$ more wheel effort for the same maneuver.

**Failures.** Now wheel 4 fails. Deleting its column leaves a $3\times 3$ matrix with determinant $4/(3\sqrt{3}) = 0.7698$, still invertible, so three-axis control survives. But the singular values become $1.155$, $1.155$ and $0.5774$, and the same roll command now needs $\mathbf{u} = (0.04330, -0.04330, 0)^\mathsf{T}$, with norm $0.06124\,\mathrm{N\,m}$ — $41\%$ more effort. Lose wheel 3 as well and the matrix is $3\times 2$. Torque along $(0, -1, 1)^\mathsf{T}/\sqrt{2}$ is now in the left null space and cannot be produced at all. The pseudoinverse still returns its best least-squares effort; noticing that the delivered torque is not the commanded one is the attitude controller's job.
:::

## Numerical rank

In exact arithmetic, rank is a count of nonzero singular values. In floating point nothing is ever exactly zero — round-off, sensor quantization and nearly-degenerate geometry see to that — so the practical definition needs a cutoff.

::: key Numerical rank and the truncated pseudoinverse
The numerical rank of $\mathbf{A}$ at tolerance $\varepsilon_{\text{tol}}$ is the number of singular values with $\sigma_i > \varepsilon_{\text{tol}}$, usually set relative to the largest: $\varepsilon_{\text{tol}} = \texttt{rcond}\cdot\sigma_1$. The truncated pseudoinverse keeps only those terms, $\mathbf{A}^+_k = \sum_{i \le k}\sigma_i^{-1}\mathbf{v}_i\mathbf{u}_i^\mathsf{T}$, trading a bias in the discarded directions for an enormous reduction in noise amplification.
:::

Here `rcond` ("reciprocal condition") is the fraction of $\sigma_1$ below which you call a singular value zero.

Why cutting helps shows up in the component formula $\mathbf{x} = \sum_i(\beta_i/\sigma_i)\mathbf{v}_i$. Measurement noise adds to every $\beta_i$ at roughly the same level, because [[white noise looks the same in any perpendicular basis|white-noise]]. Dividing by a small $\sigma_i$ therefore multiplies the noise by $1/\sigma_i$ in that direction. A term with $\sigma_i = 0.02$ multiplies the noise by fifty while adding almost nothing to the fit. Dropping it costs you the true state's component along $\mathbf{v}_i$ — a **bias**, a steady error. It saves you $1/\sigma_i$ times the noise — a **variance**, a random error. When $\sigma_i$ is small enough, that trade is overwhelmingly worth it.

::: example Truncating a clustered beacon geometry
**The geometry.** Push Lesson 8's clustered beacons further: three beacons at bearings $0^\circ$, $1^\circ$ and $2^\circ$ from a receiver in the plane. The range Jacobian's rows are unit line-of-sight vectors:

$$\mathbf{H} = \begin{pmatrix} 1 & 0 \\ 0.99985 & 0.017452 \\ 0.99939 & 0.034899 \end{pmatrix}.$$

Its singular values are $\sigma_1 = 1.7319$ and $\sigma_2 = 0.024681$. The first direction, $\mathbf{v}_1 = (0.99985, 0.017452)^\mathsf{T}$, points along the beacons at $1^\circ$; the second, $\mathbf{v}_2 = (-0.017452, 0.99985)^\mathsf{T}$, points across them at $91^\circ$. The second left singular vector is $\mathbf{u}_2 = (-1, 0, 1)^\mathsf{T}/\sqrt{2}$: only the *difference* between the first and third ranges carries any cross-track information, and very little of it.

**The data.** Let the true position offset be $\boldsymbol{\delta} = (0.5, 0.5)^\mathsf{T}\,\mathrm{m}$. The noise-free range residuals are $\mathbf{H}\boldsymbol{\delta} = (0.5000, 0.50865, 0.51714)^\mathsf{T}\,\mathrm{m}$. Add a modest ranging error $\mathbf{n} = (+0.10, -0.15, +0.05)\,\mathrm{m}$ — ordinary for a radio ranging system — to get $\mathbf{b} = (0.6000, 0.35865, 0.56714)^\mathsf{T}\,\mathrm{m}$.

**The full pseudoinverse.** It returns $\mathbf{x} = \mathbf{H}^+\mathbf{b} = (0.525, -0.932)^\mathsf{T}\,\mathrm{m}$, which is $1.43\,\mathrm{m}$ from the truth. Here is where that came from. The noise along $\mathbf{u}_2$ is $\mathbf{u}_2^\mathsf{T}\mathbf{n} = (-0.10 + 0.05)/\sqrt{2} = -0.035355\,\mathrm{m}$. Dividing by $\sigma_2 = 0.024681$ turns $3.5\,\mathrm{cm}$ of ranging noise into $1.43\,\mathrm{m}$ of position error. The second row of $\mathbf{H}^+$, with entries near $\pm 28.6$, says the same thing bluntly.

**Truncated to rank one.** The one kept coefficient is $\beta_1/\sigma_1 = 0.50864$, giving $\mathbf{x}_1 = 0.50864\,\mathbf{v}_1 = (0.50856, 0.00888)^\mathsf{T}\,\mathrm{m}$. The error is now $0.491\,\mathrm{m}$, and it is pure bias: exactly $\boldsymbol{\delta}^\mathsf{T}\mathbf{v}_2 = 0.4912\,\mathrm{m}$, the true cross-track offset we chose not to estimate. Three times better, from throwing information away.

**The residuals settle it.** The full solution fits the data with $\lVert\mathbf{H}\mathbf{x} - \mathbf{b}\rVert = 0.1837\,\mathrm{m}$, the rank-one solution with $0.1852\,\mathrm{m}$. The full solution fits under $1\%$ better, at the cost of a meter of position error, and is twice as long ($1.070$ against $0.509$). That signature — a large, wild solution that fits a hair better than a small, tame one — is what a small singular value looks like from the outside.
:::

::: warning The pseudoinverse is not a continuous function of the matrix
Let $\mathbf{A}_\epsilon = \operatorname{diag}(1, \epsilon)$. For every $\epsilon \neq 0$, $\mathbf{A}_\epsilon^+ = \operatorname{diag}(1, 1/\epsilon)$, which grows without limit as $\epsilon \to 0$. But at $\epsilon = 0$ exactly, the rank drops and $\mathbf{A}_0^+ = \operatorname{diag}(1, 0)$. A change of $10^{-12}$ in one entry can change $\mathbf{A}^+$ by $10^{12}$, or snap it back to something small. So never test rank with an equals sign, never trust a pseudoinverse whose small singular values sit at your round-off level, and choose `rcond` on purpose: it is where you tell the software what "zero" means.
:::

Choosing the cutoff is an engineering decision. The default in `np.linalg.pinv` and `np.linalg.matrix_rank` is about $\max(m, n)\,\varepsilon\,\sigma_1$, with $\varepsilon \approx 2.2\times 10^{-16}$: it throws away only what round-off has already destroyed. That suits a matrix known exactly, not a measurement geometry. In the example every singular value sat far above machine precision, and the cut had to be made at $0.05\,\sigma_1$ on physical grounds. Set the cutoff from your error budget, log the discarded singular values, and make a rank drop an event the system reports.

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

Truncation is the bluntest **regularizer** — a method that tames small singular values. **[[Tikhonov regularization|tikhonov]]** replaces $1/\sigma_i$ by $\sigma_i/(\sigma_i^2 + \lambda^2)$, which rolls off smoothly instead of switching. A Kalman filter's prior covariance does the same job automatically: the prior supplies information in exactly the directions the measurements miss. Whatever the cure, the diagnosis is the same: a small $\sigma_i$ is a direction the data does not pin down.

## Check yourself

::: check
Compute $\mathbf{A}^+$ for $\mathbf{A} = \begin{pmatrix} 1 & 1 \\ 2 & 2 \\ 3 & 3 \end{pmatrix}$ and use it to solve $\mathbf{A}\mathbf{x} = (2, 4, 6)^\mathsf{T}$. What goes wrong if you try the normal equations instead?
:::

::: answer
**Rank one.** The two columns are the same, so $\mathbf{A} = \mathbf{c}\,\mathbf{d}^\mathsf{T}$ with $\mathbf{c} = (1, 2, 3)^\mathsf{T}$ and $\mathbf{d} = (1, 1)^\mathsf{T}$. Then $\sigma_1 = \lVert\mathbf{c}\rVert\,\lVert\mathbf{d}\rVert = \sqrt{14}\sqrt{2} = \sqrt{28} = 5.292$, with $\mathbf{u}_1 = \mathbf{c}/\sqrt{14}$ and $\mathbf{v}_1 = \mathbf{d}/\sqrt{2}$.

**The pseudoinverse.**

$$\mathbf{A}^+ = \frac{\mathbf{v}_1\mathbf{u}_1^\mathsf{T}}{\sigma_1} = \frac{\mathbf{d}\mathbf{c}^\mathsf{T}}{\sqrt{2}\sqrt{14}\sqrt{28}} = \frac{1}{28}\begin{pmatrix} 1 & 2 & 3 \\ 1 & 2 & 3 \end{pmatrix}.$$

(The bottom is $\sqrt{2\times 14\times 28} = \sqrt{784} = 28$.)

**The solution.** $\mathbf{A}^+\mathbf{b} = \tfrac{1}{28}(2 + 8 + 18,\ 2 + 8 + 18)^\mathsf{T} = (1, 1)^\mathsf{T}$, and $\mathbf{A}(1, 1)^\mathsf{T} = (2, 4, 6)^\mathsf{T}$ exactly: zero residual. Every $\mathbf{x}$ with $x_1 + x_2 = 2$ does equally well, and $(1, 1)$ is the shortest, with $\lVert\mathbf{x}\rVert = 1.414$ against $2$ for $(2, 0)$.

**The normal equations.** $\mathbf{A}^\mathsf{T}\mathbf{A} = \begin{pmatrix} 14 & 14 \\ 14 & 14 \end{pmatrix}$ has determinant $14\times 14 - 14\times 14 = 0$. It is singular, so $(\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}$ does not exist and there is nothing to invert.
:::

::: check
$\mathbf{A}$ is $5\times 3$ with singular values $4$, $2$ and $0$. State the sizes and ranks of $\mathbf{A}^+$, $\mathbf{A}\mathbf{A}^+$ and $\mathbf{A}^+\mathbf{A}$, and say what each product does geometrically.
:::

::: answer
- $\mathbf{A}^+$ is $3\times 5$ with rank $2$: it holds the reciprocals $1/4$ and $1/2$ and one zero.
- $\mathbf{A}\mathbf{A}^+$ is $5\times 5$ with rank $2$. It is the orthogonal projector $\mathbf{u}_1\mathbf{u}_1^\mathsf{T} + \mathbf{u}_2\mathbf{u}_2^\mathsf{T}$ onto the two-dimensional column space. It throws away the three-dimensional left null space — the part of any measurement vector the model cannot explain.
- $\mathbf{A}^+\mathbf{A}$ is $3\times 3$ with rank $2$. It is the projector $\mathbf{v}_1\mathbf{v}_1^\mathsf{T} + \mathbf{v}_2\mathbf{v}_2^\mathsf{T}$ onto the row space, which zeroes the one-dimensional null space.

Neither is the identity, so $\mathbf{A}^+$ is neither a left nor a right inverse here.
:::

::: check
An allocator sends $\mathbf{u} = \mathbf{B}^+\boldsymbol{\tau}$ to the four-wheel pyramid. An operator asks why the software does not use only three wheels and keep the fourth as a cold spare. Answer with numbers from the lesson.
:::

::: answer
With all four wheels, the roll command $\boldsymbol{\tau} = (0.05, 0, 0)^\mathsf{T}\,\mathrm{N\,m}$ costs $\lVert\mathbf{u}\rVert = 0.0433\,\mathrm{N\,m}$, spread evenly at $0.02165$ per wheel. Using only wheels 1, 2 and 3 forces $\mathbf{u} = (0.0433, -0.0433, 0)^\mathsf{T}$: two wheels each carry twice the torque, and the effort rises to $0.0612\,\mathrm{N\,m}$, $41\%$ more.

Minimum norm spreads the load, which is cheapest in the sum-of-squares sense, so peak wheel torque, current and bearing wear all drop. The cold spare buys nothing in conditioning either: four wheels give three singular values of $1.155$; three wheels give $1.155$, $1.155$ and $0.577$.
:::

::: check
A measurement matrix has singular values $\sigma = (12.0,\ 3.5,\ 0.004)$ and the range noise is $0.1\,\mathrm{m}$ one sigma. Estimate the noise-driven error from the third term, and decide whether to truncate.
:::

::: answer
Noise of $0.1\,\mathrm{m}$ projected onto $\mathbf{u}_3$ is about $0.1\,\mathrm{m}$ in that coefficient, because a projection onto a unit vector keeps white noise at the same scale. Dividing by $\sigma_3 = 0.004$ gives about $0.1/0.004 = 25\,\mathrm{m}$ of error along $\mathbf{v}_3$. Compare $0.1/12 = 0.008\,\mathrm{m}$ along $\mathbf{v}_1$ and $0.1/3.5 = 0.029\,\mathrm{m}$ along $\mathbf{v}_2$.

The third term dominates the error by three orders of magnitude and adds almost nothing to the fit, so truncate to rank two unless the budget can take $25\,\mathrm{m}$. The cost is the true state's component along $\mathbf{v}_3$. Report it as an unestimated bias rather than hide it, or bring in a prior that pins down $\mathbf{v}_3$ directly.
:::

::: check
Show that $\mathbf{A}^+ = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{A}^\mathsf{T})^{-1}$ really is a right inverse when $\mathbf{A}$ is wide with full row rank, and explain why the same formula is useless for a tall matrix.
:::

::: answer
Substitute: $\mathbf{A}\mathbf{A}^+ = \mathbf{A}\mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{A}^\mathsf{T})^{-1} = \mathbf{I}_m$. That is what "right inverse" means: every target $\mathbf{b}$ in $\mathbb{R}^m$ is hit exactly, with zero residual. The inverse exists because $\mathbf{A}\mathbf{A}^\mathsf{T}$ is $m\times m$ with $m$ positive eigenvalues $\sigma_i^2$.

For a tall $\mathbf{A}$ with $m > n$, $\mathbf{A}\mathbf{A}^\mathsf{T}$ is still $m\times m$ but has rank at most $n < m$, so it is singular and cannot be inverted. Tall matrices use the other shortcut, $(\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}\mathbf{A}^\mathsf{T}$, whose Gram matrix is the small $n\times n$ one. Rule of thumb: build the Gram matrix on the *short* side, and if neither side has full rank, fall back to the SVD.
:::

## Summary

| Item | Statement |
| --- | --- |
| Definition | $\mathbf{A}^+ = \mathbf{V}\boldsymbol{\Sigma}^+\mathbf{U}^\mathsf{T}$, $n\times m$; $\boldsymbol{\Sigma}^+$ holds $1/\sigma_i$ for $\sigma_i > 0$ and zero elsewhere |
| Component form | $\mathbf{A}^+\mathbf{b} = \sum_{i\le r}(\mathbf{u}_i^\mathsf{T}\mathbf{b}/\sigma_i)\,\mathbf{v}_i$ |
| What it solves | minimizes $\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert$; among those, minimizes $\lVert\mathbf{x}\rVert$; no null-space component |
| Projectors | $\mathbf{A}\mathbf{A}^+ = \sum_{i \le r}\mathbf{u}_i\mathbf{u}_i^\mathsf{T}$ onto the column space; $\mathbf{A}^+\mathbf{A} = \sum_{i \le r}\mathbf{v}_i\mathbf{v}_i^\mathsf{T}$ onto the row space |
| Square, invertible | $\mathbf{A}^+ = \mathbf{A}^{-1}$ |
| Tall, full column rank | $\mathbf{A}^+ = (\mathbf{A}^\mathsf{T}\mathbf{A})^{-1}\mathbf{A}^\mathsf{T}$, a left inverse; unique least-squares solution |
| Wide, full row rank | $\mathbf{A}^+ = \mathbf{A}^\mathsf{T}(\mathbf{A}\mathbf{A}^\mathsf{T})^{-1}$, a right inverse; minimum-norm exact solution |
| Rank deficient | neither Gram matrix invertible; only the SVD form works |
| Numerical rank | count of $\sigma_i > \texttt{rcond}\cdot\sigma_1$; set `rcond` from the error budget, not from machine epsilon |
| Truncated pseudoinverse | $\mathbf{A}^+_k = \sum_{i\le k}\sigma_i^{-1}\mathbf{v}_i\mathbf{u}_i^\mathsf{T}$; bias along the dropped $\mathbf{v}_i$ in exchange for removing $1/\sigma_i$ noise gain |
| Noise gain | noise along $\mathbf{u}_i$ becomes state error $1/\sigma_i$ times as large along $\mathbf{v}_i$ |
| Null motion | $\mathbf{B}\mathbf{n} = \mathbf{0}$ means actuator commands with no effect; for the four-wheel pyramid $\mathbf{n} = (1, -1, 1, -1)^\mathsf{T}/2$ |
| Warnings | $\mathbf{A}^+$ jumps at a rank change; minimum norm depends on the units of the state |
| NumPy | `np.linalg.pinv(A, rcond=...)`, `np.linalg.matrix_rank(A, tol=...)` |

A small singular value is expensive: it divides the noise by a small number and hands back a large, unreliable answer. The next lesson puts a number on that. The ratio $\sigma_{\max}/\sigma_{\min}$ is the **[[condition number|condition-bridge]]**. It limits how much a solve can magnify any error, and its rule of thumb — you lose roughly $\log_{10}\kappa$ decimal digits — tells you in advance whether a solve is worth trusting.

::: context moore-penrose Found twice, thirty-five years apart
The American mathematician E. H. Moore described this generalized inverse in 1920, in a short abstract that few people read. The British mathematician and physicist Roger Penrose rediscovered it in 1955, as a young researcher, and wrote down the four conditions that pin it down uniquely. The Swedish geodesist Arne Bjerhammar had also found it independently in 1951, while working on survey adjustments — a least-squares problem much like the ones in this course.
:::

::: context projector-picture The shadow on the column space
When the column space is a line, $\mathbf{A}\mathbf{A}^+\mathbf{b}$ is the shadow of $\mathbf{b}$ dropped straight down onto it. The leftover piece, $\mathbf{b} - \mathbf{A}\mathbf{A}^+\mathbf{b}$, is the residual, and it meets the line at a right angle. No point on the line is closer to $\mathbf{b}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="308.4" y2="75.9" stroke="#6c7a93" stroke-width="2"/>
  <line x1="50" y1="170" x2="210" y2="50" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="210" cy="50" r="4" fill="#1d6fd1"/>
  <line x1="50" y1="170" x2="229.9" y2="104.5" stroke="#1f2a44" stroke-width="2.5"/>
  <circle cx="229.9" cy="104.5" r="4" fill="#1f2a44"/>
  <line x1="229.9" y1="104.5" x2="210" y2="50" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <polyline points="222.3,107.3 219.6,99.8 227.1,97.0" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="50" cy="170" r="3" fill="#1f2a44"/>
  <g font-size="12">
    <text x="190" y="42" fill="#1d6fd1">data b</text>
    <text x="236" y="122" fill="#1f2a44">shadow A A⁺ b</text>
    <text x="226" y="70" fill="#b4232c">residual</text>
    <text x="250" y="75" fill="#6c7a93" font-size="11">column space</text>
    <text x="40" y="190" fill="#1f2a44" font-size="11">origin</text>
  </g>
</svg>
```
:::

::: context min-norm-picture The shortest point on a line
Every point on the line $x_1 + x_2 = 2$ solves the check question's system exactly. Their lengths differ. The shortest is where a line from the origin meets the solution line at a right angle: $(1, 1)$, with length $\sqrt{2} = 1.414$. The ends $(2, 0)$ and $(0, 2)$ have length $2$. Stepping along the line is stepping along the null space, and the shortest point has none of it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="170" x2="220" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="170" x2="60" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="45" y1="35" x2="195" y2="185" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="60" y1="170" x2="120" y2="110" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <polyline points="114.3,115.7 120,121.3 125.7,115.7" fill="none" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="120" cy="110" r="5" fill="#b4232c"/>
  <circle cx="180" cy="170" r="4" fill="#6c7a93"/>
  <circle cx="60" cy="50" r="4" fill="#6c7a93"/>
  <g font-size="11" fill="#1f2a44">
    <text x="130" y="104" fill="#b4232c">(1, 1): length 1.414</text>
    <text x="186" y="160">(2, 0): length 2</text>
    <text x="70" y="46">(0, 2): length 2</text>
    <text x="226" y="174">x₁</text>
    <text x="50" y="18">x₂</text>
    <text x="200" y="120" fill="#1d6fd1">all solutions:</text>
    <text x="200" y="135" fill="#1d6fd1">x₁ + x₂ = 2</text>
  </g>
</svg>
```
:::

::: context gps-clock Why GPS needs four satellites
A GPS receiver works out distance from how long a signal took to arrive, so an error in its own cheap clock looks exactly like an error in distance. With one satellite, a clock running early and a receiver sitting farther away give the same reading. With several satellites in different directions the two separate, because a clock error changes every range by the same amount while a position error does not. Three position numbers plus one clock number make four unknowns, which is why a receiver needs at least four satellites.
:::

::: context mug-arcmin Micro-g and arcminutes
A **micro-g** ($\mu g$) is one millionth of standard gravity, $9.80665\times 10^{-6}\,\mathrm{m/s^2}$. Navigation-grade accelerometer biases are quoted in tens of micro-g. An **arcminute** is one sixtieth of a degree, about $2.91\times 10^{-4}\,\mathrm{rad}$. The number to remember is that a tilt of $1\,\mathrm{mrad}$ (about $3.4$ arcminutes) spills about $1000\,\mu g$ of gravity sideways — which is why bias and tilt are so hard to tell apart on the pad.
:::

::: context wheel-pyramid The null-motion pattern, seen from above
Looking down the $+z$ axis, the four spin axes point out at $45^\circ$, $135^\circ$, $225^\circ$ and $315^\circ$ (each also tilts up toward the viewer). Spin wheels 1 and 3 one way and wheels 2 and 4 the other, equally. Wheels 1 and 3 point in opposite sideways directions, as do 2 and 4, so the sideways torques cancel in pairs. The upward parts are $+1 - 1 + 1 - 1 = 0$. The body feels nothing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="100" y1="105" x2="260" y2="105" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="25" x2="180" y2="185" stroke="#6c7a93" stroke-width="1"/>
  <g stroke-width="3">
    <line x1="180" y1="105" x2="222.4" y2="62.6" stroke="#1d6fd1"/>
    <line x1="180" y1="105" x2="137.6" y2="62.6" stroke="#b4232c"/>
    <line x1="180" y1="105" x2="137.6" y2="147.4" stroke="#1d6fd1"/>
    <line x1="180" y1="105" x2="222.4" y2="147.4" stroke="#b4232c"/>
  </g>
  <circle cx="180" cy="105" r="5" fill="#1f2a44"/>
  <g font-size="12">
    <text x="228" y="58" fill="#1d6fd1">wheel 1: +</text>
    <text x="132" y="58" fill="#b4232c" text-anchor="end">wheel 2: −</text>
    <text x="132" y="160" fill="#1d6fd1" text-anchor="end">wheel 3: +</text>
    <text x="228" y="160" fill="#b4232c">wheel 4: −</text>
  </g>
  <g font-size="11" fill="#6c7a93">
    <text x="264" y="109">body x</text>
    <text x="186" y="22">body y</text>
  </g>
  <text x="180" y="204" font-size="11" fill="#1f2a44" text-anchor="middle">null motion n = (1, −1, 1, −1)/2, top view</text>
</svg>
```
:::

::: context zero-speed Why wheels avoid zero speed
A wheel's bearing friction flips direction whenever the wheel stops and reverses. Near zero speed that flip hits the spacecraft as a sudden little torque kick, and the lubricant film in the bearing also behaves worst at very low speed. Pointing-sensitive missions such as space telescopes therefore keep all wheels spinning at a comfortable speed, and use null motion to move that speed around without disturbing where the telescope points.
:::

::: context white-noise Why noise is the same in every direction
Suppose each range has its own independent error with the same spread, $\sigma$. The covariance of that noise is $\sigma^2\mathbf{I}$: a perfectly round cloud. Turning a round cloud leaves it round, and in symbols $\mathbf{U}^\mathsf{T}(\sigma^2\mathbf{I})\mathbf{U} = \sigma^2\mathbf{U}^\mathsf{T}\mathbf{U} = \sigma^2\mathbf{I}$. So the noise in each coefficient $\beta_i = \mathbf{u}_i^\mathsf{T}\mathbf{b}$ has the same spread $\sigma$, whichever singular direction you look along. Only the division by $\sigma_i$ makes some directions worse than others.
:::

::: context tikhonov A smooth dimmer instead of a switch
Truncation is a light switch: keep a term fully, or drop it. Tikhonov regularization, published by the Soviet mathematician Andrey Tikhonov in 1963, is a dimmer. It minimizes $\lVert\mathbf{A}\mathbf{x} - \mathbf{b}\rVert^2 + \lambda^2\lVert\mathbf{x}\rVert^2$ ($\lambda$ is "lambda"), which multiplies each term's $1/\sigma_i$ by $\sigma_i^2/(\sigma_i^2 + \lambda^2)$. For $\sigma_i \gg \lambda$ the factor is nearly $1$; for $\sigma_i \ll \lambda$ it is nearly $0$, and the term fades out gently. Statisticians call the same idea ridge regression.
:::

::: context condition-bridge Coming up: counting lost digits
A float64 number holds about $16$ significant digits. Solving with a matrix whose condition number is $\kappa$ ("kappa") can cost roughly $\log_{10}\kappa$ of them. For the $0^\circ$–$1^\circ$–$2^\circ$ beacons, $\kappa = 1.7319/0.024681 \approx 70$: under two digits lost to arithmetic, but a factor of about $70$ between how well the best and worst directions are seen. Lesson 10 makes this precise.
:::
