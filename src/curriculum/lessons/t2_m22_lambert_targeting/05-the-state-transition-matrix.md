---
id: l05-the-state-transition-matrix
title: The state transition matrix for two-body motion
minutes: 18
covers:
  - the state transition matrix and its use in targeting
---

Throw a dart. If your hand drifts a centimetre to the left as you let go, the dart lands a bit to the left of the bullseye. If your hand is a little fast, it lands high. A good darts player has a feel for this: *this* much wobble at the hand gives *that* much miss at the board. With that feel, a miss tells you how to fix the next throw.

A spacecraft needs the same feel, written down as numbers. A Lambert solve gives a departure velocity computed for an ideal world: a perfect point-mass planet, a perfect instant burn, nothing else pulling. Fly it for real and the spacecraft lands a little off. To fix that, you need to know *how sensitive* the arrival is to a small change at departure, so you can compute a correction instead of guessing one. That table of sensitivities is the **state transition matrix**, or STM.

This lesson builds the STM from scratch for two-body motion. It proves one surprising fact about it — its determinant is always exactly $1$ — and uses that fact as a free check on your own code. It looks inside the matrix to find the one piece targeting needs, and shows why a tempting shortcut for that piece is wrong. The next lesson uses all of it to steer onto a target.

## The state: six numbers

The **state** of a spacecraft is everything you need to predict where it goes next: its position and its velocity. Stack them into one list of six numbers,

$$
\mathbf{x} = (\mathbf{r},\ \mathbf{v}) = (x,\ y,\ z,\ v_x,\ v_y,\ v_z) .
$$

Mathematicians write "six real numbers in a list" as $\mathbb{R}^6$, read "R six".

For two-body motion, the state changes like this:

$$
\dot{\mathbf{x}} = \big(\mathbf{v},\ \mathbf{a}(\mathbf{r})\big), \qquad \mathbf{a}(\mathbf{r}) = -\frac{\mu\,\mathbf{r}}{r^3} .
$$

The dot means "rate of change with time". In words: position changes at the rate $\mathbf{v}$, and velocity changes at the rate $\mathbf{a}$, gravity's pull. Here $\mu$ ("mu") is the planet's gravitational parameter and $r$ is the distance from the planet's center.

## Following a small nudge

Picture two spacecraft flying side by side. One flies the planned path, the **reference trajectory**. The other started with a tiny difference, $\delta\mathbf{x}_0$ (read "delta x nought": the small starting difference). How does that gap change as they fly?

### The variational equation

Write the dynamics in short as $\dot{\mathbf{x}} = \mathbf{F}(\mathbf{x})$. The nudged craft obeys the same rule, so

$$
\frac{d}{dt}\big(\mathbf{x} + \delta\mathbf{x}\big) = \mathbf{F}(\mathbf{x} + \delta\mathbf{x}) \approx \mathbf{F}(\mathbf{x}) + \frac{\partial\mathbf{F}}{\partial\mathbf{x}}\,\delta\mathbf{x} .
$$

The approximation is the first-order Taylor expansion: for a small step, a smooth function changes by its slope times the step. Now subtract the reference's own equation, $\dot{\mathbf{x}} = \mathbf{F}(\mathbf{x})$, from both sides. What remains is the rule for the gap alone, the **variational equation**:

$$
\delta\dot{\mathbf{x}} = \mathbf{A}(t)\,\delta\mathbf{x}, \qquad \mathbf{A}(t) = \left.\frac{\partial \dot{\mathbf{x}}}{\partial\mathbf{x}}\right|_{\mathbf{x}(t)} .
$$

$\mathbf{A}$ is the **[[Jacobian|jacobian-name]]** of the dynamics: a $6\times6$ grid whose entry in row $i$, column $j$ says how much the $i$-th rate changes per unit change in the $j$-th state number. The bar with $\mathbf{x}(t)$ means it is evaluated along the reference trajectory, so it changes with time.

### Building $\mathbf{A}$ in four blocks

Split $\mathbf{A}$ into four $3\times3$ blocks, matching the position and velocity halves of the state.

- **Top row: how $\dot{\mathbf{r}} = \mathbf{v}$ depends on the state.** It does not depend on $\mathbf{r}$ at all, so that block is $\mathbf{0}$. It equals $\mathbf{v}$, so its dependence on $\mathbf{v}$ is the **identity matrix** $\mathbf{I}$ — the matrix version of "times one".
- **Bottom row: how $\dot{\mathbf{v}} = \mathbf{a}$ depends on the state.** For pure two-body motion, gravity depends only on position. So the velocity block is $\mathbf{0}$, and the position block is a new matrix $\mathbf{G} = \partial\mathbf{a}/\partial\mathbf{r}$.

$$
\mathbf{A} = \begin{pmatrix} \mathbf{0} & \mathbf{I} \\ \mathbf{G} & \mathbf{0} \end{pmatrix} .
$$

Differentiating $\mathbf{a} = -\mu\mathbf{r}/r^3$ gives the **gravity-gradient matrix**:

$$
\mathbf{G} = -\frac{\mu}{r^3}\big(\mathbf{I}-3\hat{\mathbf{r}}\hat{\mathbf{r}}^{\!\top}\big) .
$$

Here $\hat{\mathbf{r}}$ ("r hat") is the unit vector pointing away from the planet, and $\hat{\mathbf{r}}\hat{\mathbf{r}}^{\!\top}$ is the $3\times3$ matrix that picks out the part of any vector along $\hat{\mathbf{r}}$. $\mathbf{G}$ has units of $1/\mathrm{s^2}$. At the space station's height, $\mu/r^3 \approx 1.27\times10^{-6}\,\mathrm{s^{-2}}$.

::: note Why it has to be true: the gravity gradient
Write gravity one component at a time: $a_i = -\mu\, r_i\, r^{-3}$, for $i = 1, 2, 3$. Differentiate with respect to $r_j$ using the product rule.

- The $r_i$ factor gives $\partial r_i/\partial r_j = \delta_{ij}$, the **Kronecker delta**: $1$ when $i = j$ and $0$ otherwise. (A different $\delta$ from "small change".)
- The $r^{-3}$ factor gives $-3r^{-4}\,\partial r/\partial r_j$, and $\partial r/\partial r_j = r_j/r$, because $r = \sqrt{r_1^2 + r_2^2 + r_3^2}$.

Put together:

$$
G_{ij} = \frac{\partial a_i}{\partial r_j} = -\mu\left[\frac{\delta_{ij}}{r^3} - \frac{3r_ir_j}{r^5}\right] = -\frac{\mu}{r^3}\big(\delta_{ij} - 3\hat r_i\hat r_j\big) .
$$

The grid with entries $\delta_{ij}$ is $\mathbf{I}$, and the grid with entries $\hat r_i \hat r_j$ is $\hat{\mathbf{r}}\hat{\mathbf{r}}^{\!\top}$. That is the matrix formula above.
:::

### What $\mathbf{G}$ does: stretch and squeeze

$\mathbf{G}$ is symmetric (row $i$, column $j$ equals row $j$, column $i$), and its **eigenvalues** — the stretch factors along its special directions — can be read straight off the formula.

- **Along $\hat{\mathbf{r}}$:** $\mathbf{G}\hat{\mathbf{r}} = -\frac{\mu}{r^3}(\hat{\mathbf{r}}-3\hat{\mathbf{r}}) = +\frac{2\mu}{r^3}\hat{\mathbf{r}}$. Eigenvalue $+2\mu/r^3$.
- **Across $\hat{\mathbf{r}}$:** for any vector $\mathbf{u}$ at right angles to $\hat{\mathbf{r}}$, the $\hat{\mathbf{r}}\hat{\mathbf{r}}^{\!\top}$ part gives zero, so $\mathbf{G}\mathbf{u} = -\frac{\mu}{r^3}\mathbf{u}$. Eigenvalue $-\mu/r^3$, twice (two independent sideways directions).

So a position nudge straight up or down gets *pushed further* (positive: an up-and-down stretch), while a sideways nudge gets *pulled back* (negative: a squeeze). This is the **[[tidal|tidal-picture]]** pattern $2 : -1 : -1$. It returns in the next module: combined with the spin of a rotating frame, it becomes the $3n^2$ term of the Clohessy–Wiltshire equations for rendezvous.

## The state transition matrix

The variational equation is **linear**: double the starting nudge and the nudge at every later time doubles. A linear rule from six numbers to six numbers is a $6\times6$ matrix. That matrix is the state transition matrix $\boldsymbol{\Phi}(t,t_0)$ ("capital phi of t, t nought"):

$$
\delta\mathbf{x}(t) = \boldsymbol{\Phi}(t,t_0)\,\delta\mathbf{x}_0, \qquad \dot{\boldsymbol{\Phi}} = \mathbf{A}(t)\,\boldsymbol{\Phi}, \qquad \boldsymbol{\Phi}(t_0,t_0)=\mathbf{I} .
$$

Read it column by column. Column $j$ of $\boldsymbol{\Phi}$ is what becomes, at time $t$, of a unit nudge in the $j$-th state number at $t_0$. At the start nothing has had time to change, so $\boldsymbol{\Phi}$ starts as the identity. Each column obeys the variational equation, which is why the whole matrix obeys $\dot{\boldsymbol{\Phi}} = \mathbf{A}\boldsymbol{\Phi}$.

::: key The state transition matrix
$$
\delta\mathbf{x}_f = \boldsymbol{\Phi}(t_f,t_0)\,\delta\mathbf{x}_0, \qquad \dot{\boldsymbol{\Phi}}=\mathbf{A}(t)\boldsymbol{\Phi},\ \boldsymbol{\Phi}(t_0,t_0)=\mathbf{I},
$$
with $\mathbf{A}=\begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{G}&\mathbf{0}\end{pmatrix}$, $\mathbf{G}=-\dfrac{\mu}{r^3}(\mathbf{I}-3\hat{\mathbf{r}}\hat{\mathbf{r}}^{\!\top})$.

To propagate it: integrate $\dot{\boldsymbol{\Phi}}=\mathbf{A}(t)\boldsymbol{\Phi}$ with $\boldsymbol{\Phi}(t_0)=\mathbf{I}$ alongside the state, where $\mathbf{A}$ is the Jacobian of the dynamics. For $6$ states that is $36$ extra ODEs — expensive but exact, and far better conditioned than finite-differencing the whole trajectory.
:::

### Why not wiggle and re-fly?

There is a cruder way to get $\boldsymbol{\Phi}$: **[[finite differencing|finite-difference-trap]]**. Nudge one starting number by a small step, fly the whole trajectory again, and see how the end moved. Six nudges give six columns.

The work is about the same either way. The $42$ equations of state-plus-STM cost roughly what seven separate trajectories cost, and one-sided finite differencing needs seven trajectories too (the reference plus six nudged ones). The difference is accuracy. Finite differencing has to pick a step size, and no choice is safe. Too large, and the curvature of the problem spoils the slope. Too small, and the two nearly equal end points cancel away most of their digits. The integrated STM has no step size to choose: it is exact up to the integrator's own tolerance.

## A free correctness check: $\det\boldsymbol{\Phi}\equiv1$

Before using $\boldsymbol{\Phi}$ for anything, it helps to know one fact that costs nothing to check and catches a broken integration at once.

Start with the **trace** of $\mathbf{A}$: the sum of the numbers on its main diagonal, top-left to bottom-right. Every diagonal entry of $\mathbf{A}$ sits inside one of the two zero blocks. Rows $1$–$3$ have their nonzero entries in columns $4$–$6$ (the identity block). Rows $4$–$6$ have theirs in columns $1$–$3$ (the $\mathbf{G}$ block). So no diagonal entry is ever nonzero, and

$$
\operatorname{tr}\mathbf{A}\equiv0 .
$$

The three-line symbol $\equiv$ means "equal at every moment, not only at one". This holds for *any* force that depends on position only — not only an inverse-square one.

It follows that the **[[determinant|determinant-area]]** of $\boldsymbol{\Phi}$ never changes. It starts at $\det\mathbf{I} = 1$, so

$$
\det\boldsymbol{\Phi}(t,t_0) \equiv 1 \quad\text{for all } t .
$$

::: note Why it has to be true: Jacobi's formula
**Jacobi's formula** gives the rate of change of a determinant: $\frac{d}{dt}\det\mathbf{M} = \det\mathbf{M}\cdot\operatorname{tr}(\mathbf{M}^{-1}\dot{\mathbf{M}})$. Apply it to $\mathbf{M}=\boldsymbol{\Phi}$, with $\dot{\boldsymbol{\Phi}}=\mathbf{A}\boldsymbol{\Phi}$:

$$
\frac{d}{dt}\det\boldsymbol{\Phi} = \det\boldsymbol{\Phi}\cdot\operatorname{tr}\!\big(\boldsymbol{\Phi}^{-1}\mathbf{A}\boldsymbol{\Phi}\big) = \det\boldsymbol{\Phi}\cdot\operatorname{tr}(\mathbf{A}) = 0 .
$$

The middle step uses the **cyclic property** of the trace — you may move the last factor to the front without changing the trace — so $\operatorname{tr}(\boldsymbol{\Phi}^{-1}\mathbf{A}\boldsymbol{\Phi})=\operatorname{tr}(\mathbf{A}\boldsymbol{\Phi}\boldsymbol{\Phi}^{-1})=\operatorname{tr}(\mathbf{A})$. The last step uses $\operatorname{tr}\mathbf{A}=0$. A quantity with zero rate of change is constant, and it started at $\det\boldsymbol{\Phi}(t_0,t_0) = \det\mathbf{I} = 1$.
:::

::: example Checking $\det\boldsymbol{\Phi}=1$ by direct integration
**Set-up.** Take the space-station-like state from the two-body module's universal-variables lesson:

$$
\mathbf{r}_0=(-2267.240,\ -3989.573,\ 5001.268)\,\mathrm{km}, \qquad \mathbf{v}_0=(5.0098,\ -5.4258,\ -2.0540)\,\mathrm{km/s} .
$$

**Step 1.** Stack the $6$ state numbers and the $36$ entries of $\boldsymbol{\Phi}$ (starting from $\mathbf{I}$) into one list of $42$. Integrate all of them together for one hour with a high-accuracy Runge–Kutta method.

**Step 2: check the trajectory.** The position after $3600\,\mathrm{s}$ comes out as $(-2148.598,\ 6242.669,\ -1592.817)\,\mathrm{km}$. That matches the Lagrange-coefficient answer from the two-body module exactly, so the state part of the integration is right.

**Step 3: check the STM.** The determinant of the final $\boldsymbol{\Phi}$ is

$$
\det\boldsymbol{\Phi}(3600\,\mathrm{s}) = 0.99999999999994 .
$$

That is $1$ to thirteen decimal places. The leftover is the integrator's own error tolerance.

**Why this is useful.** This check needs no second method and no known answer. It is a property $\boldsymbol{\Phi}$ must have for *any* two-body orbit. If your own code gives a value far from $1$, the STM integration has a bug — before you have used $\boldsymbol{\Phi}$ for anything.
:::

## The four blocks, and what they mean

Split $\boldsymbol{\Phi}$ into $3\times3$ blocks, the same way as $\mathbf{A}$:

$$
\boldsymbol{\Phi}(t_f,t_0) = \begin{pmatrix} \boldsymbol{\Phi}_{rr} & \boldsymbol{\Phi}_{rv} \\ \boldsymbol{\Phi}_{vr} & \boldsymbol{\Phi}_{vv} \end{pmatrix}, \qquad
\begin{pmatrix}\delta\mathbf{r}_f\\\delta\mathbf{v}_f\end{pmatrix} = \begin{pmatrix} \boldsymbol{\Phi}_{rr} & \boldsymbol{\Phi}_{rv} \\ \boldsymbol{\Phi}_{vr} & \boldsymbol{\Phi}_{vv} \end{pmatrix}\begin{pmatrix}\delta\mathbf{r}_0\\\delta\mathbf{v}_0\end{pmatrix} .
$$

The first letter of each label says what comes *out*; the second says what goes *in*.

- $\boldsymbol{\Phi}_{rr}$ ("phi r r"): how a starting position error becomes an arrival position error.
- $\boldsymbol{\Phi}_{vv}$: how a starting velocity error becomes an arrival velocity error.
- $\boldsymbol{\Phi}_{vr}$ and $\boldsymbol{\Phi}_{rv}$: the mixed ones.

The next lesson needs $\boldsymbol{\Phi}_{rv}$ most: how the **arrival position** responds to a small change in the **departure velocity**. A burn is a velocity change, and a miss is a position error, so this is exactly the block a targeting correction must invert. Its units are kilometres per (km/s), which is **[[seconds|phi-rv-seconds]]**.

### A tempting shortcut, and why it fails

The Lagrange coefficients from the two-body module say $\mathbf{r}=f\mathbf{r}_0+g\mathbf{v}_0$. At a glance, $g$ looks like "the number multiplying $\mathbf{v}_0$". So it is tempting to guess $\boldsymbol{\Phi}_{rv} \approx g\,\mathbf{I}$.

Check that guess before trusting it. $f$ and $g$ are themselves functions of the starting state — through $\chi$, $\alpha$ and everything they depend on. Change $\mathbf{v}_0$ and $f$ and $g$ shift too. So the true $\partial\mathbf{r}/\partial\mathbf{v}_0$ at a fixed arrival time picks up extra terms, and it is not $g$ times the identity except in one special limit.

::: example How good is the $g\mathbf{I}$ guess?
**The guess.** For the same space-station-like state and a one-hour flight, the two-body module's Lagrange-coefficients lesson found $g=-703.83\,\mathrm{s}$. The guess is therefore $-703.83\,\mathrm{s}$ on the diagonal and zero everywhere else.

**The real thing.** The integrated $\boldsymbol{\Phi}_{rv}$ for this case is

$$
\boldsymbol{\Phi}_{rv}(3600\,\mathrm{s}) = \begin{pmatrix} 4277.8 & -7174.2 & -918.7 \\ 2039.7 & -2006.5 & -1408.9 \\ -6739.6 & 8673.1 & 1191.5 \end{pmatrix}\mathrm{s} .
$$

**Compare.** The diagonal runs from $-2006.5$ to $4277.8\,\mathrm{s}$, and several off-diagonal entries are bigger still. Nothing here looks like $-703.83\,\mathrm{s}$ times the identity. For an hour on this orbit the guess is wrong, and a correction built on it would steer in badly the wrong direction.

**Short flights.** Repeat the integration for shorter times:

| Flight time | Diagonal of $\boldsymbol{\Phi}_{rv}$ (s) | Largest off-diagonal (s) |
| --- | --- | --- |
| $1\,\mathrm{s}$ | $1.00000,\ 1.00000,\ 1.00000$ | below $3\times10^{-7}$ |
| $10\,\mathrm{s}$ | $9.99986,\ 10.00001,\ 10.00013$ | about $3\times10^{-4}$ |
| $60\,\mathrm{s}$ | $59.968,\ 60.006,\ 60.027$ | $0.061$ |
| $600\,\mathrm{s}$ | $558.0,\ 641.5,\ 606.3$ | $65.7$ |

For a very short flight, $\boldsymbol{\Phi}_{rv}$ is the flight time times the identity. That matches the short-time Taylor expansion from the Lagrange-coefficients lesson, where $g\approx\Delta t$. As the flight gets longer, gravity has time to bend the path, and the simple picture falls apart: by ten minutes the diagonal entries already differ from each other by more than $10\%$.
:::

::: warning Do not swap in a short-flight approximation
The lesson of that example is not a rule of thumb like "use $g\mathbf{I}$ for short arcs". It is that $\boldsymbol{\Phi}_{rv}$ has to be computed for the actual flight time, by integrating the variational equation — and, as the next lesson needs, integrating it under whatever real forces the spacecraft feels. A shortcut is only as good as the assumptions behind it, and a one-hour transfer is far outside the short-flight regime.
:::

## Chaining and reversing

Two more properties make $\boldsymbol{\Phi}$ practical to work with, not only correct.

**It chains.** For any in-between time $t_1$,

$$
\boldsymbol{\Phi}(t_2,t_0) = \boldsymbol{\Phi}(t_2,t_1)\,\boldsymbol{\Phi}(t_1,t_0) .
$$

Both sides carry a nudge at $t_0$ forward to $t_2$ through the same linear dynamics, and multiplying matrices is exactly how one linear map followed by another combines. For the space-station case, the product of two half-hour STMs matches the one-hour STM to about $10^{-10}$ — at the level of the integrator's tolerance.

**It reverses.** Because $\det\boldsymbol{\Phi}\equiv1$, which is never zero, $\boldsymbol{\Phi}$ always has an inverse, and

$$
\boldsymbol{\Phi}(t_0,t_f) = \boldsymbol{\Phi}(t_f,t_0)^{-1} .
$$

Running the sensitivity backward in time is a matrix inverse, not a new integration.

The next lesson uses both facts without comment. A burn partway along a trajectory needs the STM for the stretch from the burn to the target. You can get it by integrating that stretch directly, or by **[[chaining and inverting|chain-picture]]** STMs you already have.

## Check yourself

::: check
Explain why $\operatorname{tr}\mathbf{A}=0$ holds for the two-body Jacobian regardless of the specific force law, as long as the force depends only on position and not on velocity.
:::

::: answer
The Jacobian's block structure puts all of its nonzero entries off the main diagonal. The top-right block (the identity, from $\dot{\mathbf{r}}=\mathbf{v}$) sits in rows $1$–$3$, columns $4$–$6$. The bottom-left block (the force's position gradient) sits in rows $4$–$6$, columns $1$–$3$. Neither touches the diagonal of the full $6\times6$ matrix.

The two diagonal blocks are both exactly zero: $\dot{\mathbf{r}}$ does not depend on $\mathbf{r}$, and $\dot{\mathbf{v}}$ does not depend on $\mathbf{v}$ when the force depends on position only. So the diagonal is all zeros. Nothing in this argument used the inverse-square law, so it holds for any central or non-central force that depends on position alone.
:::

::: check
You integrate the STM for a two-body arc and find $\det\boldsymbol{\Phi} = 1.4$ at the final time. What does this tell you, and what does it not tell you?
:::

::: answer
It tells you something is wrong. A correctly integrated two-body STM has $\det\boldsymbol{\Phi}=1$ exactly, for any arc, so $1.4$ signals a bug: an integrator tolerance that is far too loose, a mistake in building $\mathbf{A}$, mixed-up units, or similar.

It does not tell you *what* the bug is, or whether the rest of $\boldsymbol{\Phi}$ is nearly right or wildly wrong. It is a necessary check, not a full validation. Likewise, a value very close to $1$ does not prove $\boldsymbol{\Phi}$ is right — only that this one property holds.
:::

::: check
Using the composition property, express $\boldsymbol{\Phi}(t_0,t_f)$ (backward in time) in terms of $\boldsymbol{\Phi}(t_f,t_0)$, and explain why this does not require a second numerical integration.
:::

::: answer
$\boldsymbol{\Phi}(t_0,t_f) = \boldsymbol{\Phi}(t_f,t_0)^{-1}$. (Chaining forward then back gives $\boldsymbol{\Phi}(t_0,t_f)\boldsymbol{\Phi}(t_f,t_0) = \boldsymbol{\Phi}(t_0,t_0) = \mathbf{I}$.) Because the two-body STM has determinant exactly $1$ for any arc, it is always invertible. Its inverse comes from inverting the forward STM you already computed — no separate backward-in-time integration of the variational equation is needed.
:::

::: check
For a very short propagation time, argue from the Taylor-expansion results of the Lagrange-coefficients lesson ($f\approx1-\tfrac12(\mu/r_0^3)\Delta t^2$, $g\approx\Delta t$) why $\boldsymbol{\Phi}_{rv}\to\Delta t\,\mathbf{I}$ makes sense as a limit, even though it is not exact for longer steps.
:::

::: answer
For very small $\Delta t$, the terms that make $f$ and $g$ depend on the starting velocity are second order or higher in $\Delta t$. The leading correction to $f$ is already of size $\Delta t^2$, and $g$'s own dependence on $\mathbf{v}_0$, beyond the leading $\Delta t$, is of higher order still. So to leading order, $\mathbf{r}\approx\mathbf{r}_0+\mathbf{v}_0\Delta t$: straight-line coasting, with $g$ acting as a plain number multiplying $\mathbf{v}_0$. That gives $\partial\mathbf{r}/\partial\mathbf{v}_0 \approx \Delta t\,\mathbf{I}$.

As $\Delta t$ grows, the higher-order terms stop being negligible, and the true $\boldsymbol{\Phi}_{rv}$ moves away from this limit — exactly as the table in the example shows.
:::

::: check
The gravity-gradient matrix $\mathbf{G}$ has eigenvalue $+2\mu/r^3$ along the radial direction and $-\mu/r^3$ (twice) transverse to it. Which direction of position perturbation grows fastest under the linearised dynamics, and is this consistent with tidal stretching?
:::

::: answer
The radial direction, with eigenvalue $+2\mu/r^3$. It is positive, so a linearized radial nudge tends to be pushed further rather than pulled back — and twice as strongly (in size) as the sideways directions are squeezed.

That is exactly tidal stretching. Two nearby bodies at slightly different distances from a central mass are pulled apart along the radius (the inner one falls faster) and pushed together sideways. The same $2 : -1 : -1$ pattern drives tidal break-up of moons and comets and, combined with the rotating frame's centrifugal term, gives the Clohessy–Wiltshire equations their radial coefficient.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{x} = (\mathbf{r}, \mathbf{v})$ | The state: six numbers |
| $\delta\dot{\mathbf{x}} = \mathbf{A}\,\delta\mathbf{x}$ | Variational equation: how a small nudge evolves |
| $\mathbf{A}=\begin{pmatrix}\mathbf{0}&\mathbf{I}\\\mathbf{G}&\mathbf{0}\end{pmatrix}$ | Two-body Jacobian; $\mathbf{G}=-\mu/r^3(\mathbf{I}-3\hat{\mathbf{r}}\hat{\mathbf{r}}^{\!\top})$ |
| Eigenvalues of $\mathbf{G}$ | $+2\mu/r^3$ radial, $-\mu/r^3$ transverse (twice): tidal stretch and squeeze |
| $\dot{\boldsymbol{\Phi}}=\mathbf{A}\boldsymbol{\Phi}$, $\boldsymbol{\Phi}(t_0,t_0)=\mathbf{I}$ | Defines the STM; $\delta\mathbf{x}_f=\boldsymbol{\Phi}\,\delta\mathbf{x}_0$; 36 extra ODEs beside the state |
| $\operatorname{tr}\mathbf{A}\equiv0$ | Holds for any position-only force |
| $\det\boldsymbol{\Phi}\equiv1$ | From Jacobi's formula and $\operatorname{tr}\mathbf{A}=0$; a free, powerful correctness check |
| $\boldsymbol{\Phi}_{rv}$ | Sensitivity of arrival position to departure velocity, in seconds; the block the next lesson inverts |
| $\boldsymbol{\Phi}_{rv}\to\Delta t\,\mathbf{I}$ | Only in the short-flight limit; not a substitute for integrating the real arc |
| $\boldsymbol{\Phi}(t_2,t_0)=\boldsymbol{\Phi}(t_2,t_1)\boldsymbol{\Phi}(t_1,t_0)$, $\boldsymbol{\Phi}(t_0,t_f)=\boldsymbol{\Phi}(t_f,t_0)^{-1}$ | Chaining and reversing, with no extra integration |

The next lesson puts $\boldsymbol{\Phi}_{rv}$ to work. A Lambert trajectory misses its target once real forces are added, and **differential correction** — Newton's method built on this lesson's matrix — removes the miss.

::: context jacobian-name A grid of slopes, and whose name it is
For a function of one variable, the derivative is one number: the slope. For a function that takes six numbers in and gives six numbers out, there are thirty-six slopes — each output against each input. Arranged in a grid, they make the **Jacobian matrix**.

It is named after Carl Gustav Jacob Jacobi, a German mathematician of the early 1800s who studied these grids and their determinants. The determinant formula used later in this lesson carries his name too. Jacobi also worked on the motion of bodies under gravity, so he would have felt at home here.
:::

::: context tidal-picture Stretch along the radius, squeeze across it
Put three pebbles near a spacecraft: one a little closer to the planet, one a little farther, one off to the side. Gravity pulls the closer pebble harder and the farther one more weakly, so they drift apart along the radius. The side pebble is pulled toward the planet's center along a slightly different line, which slants it back toward the middle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <circle cx="45" cy="85" r="32" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="89" font-size="12" text-anchor="middle" fill="#1f2a44">planet</text>
  <line x1="77" y1="85" x2="340" y2="85" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="220" cy="85" r="6" fill="#1f2a44"/>
  <line x1="236" y1="85" x2="290" y2="85" stroke="#b4232c" stroke-width="3"/>
  <polygon points="300,85 288,79 288,91" fill="#b4232c"/>
  <line x1="204" y1="85" x2="150" y2="85" stroke="#b4232c" stroke-width="3"/>
  <polygon points="140,85 152,79 152,91" fill="#b4232c"/>
  <line x1="220" y1="20" x2="220" y2="50" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="220,60 214,48 226,48" fill="#1d6fd1"/>
  <line x1="220" y1="150" x2="220" y2="120" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="220,110 214,122 226,122" fill="#1d6fd1"/>
  <text x="300" y="72" font-size="12" text-anchor="middle" fill="#b4232c">stretch +2</text>
  <text x="150" y="72" font-size="12" text-anchor="middle" fill="#b4232c">stretch +2</text>
  <text x="232" y="34" font-size="12" fill="#1d6fd1">squeeze −1</text>
  <text x="232" y="146" font-size="12" fill="#1d6fd1">squeeze −1</text>
</svg>
```

The numbers are the eigenvalues of $\mathbf{G}$ in units of $\mu/r^3$. The same stretch is what raises two ocean bulges on Earth, one facing the Moon and one facing away.
:::

::: context finite-difference-trap The step-size trap
Finite differencing estimates a slope as (change in output) ÷ (small step in input). The step size is a trap with two jaws.

Take the step too big, and the curve bends within the step, so you measure an average slope rather than the slope at your point. Take it too small, and you subtract two end positions that agree in almost every digit. A computer keeps about sixteen significant digits, so if the two answers agree in the first twelve, only four digits of the difference are real.

The integrated STM never subtracts two nearby trajectories, so it avoids both jaws. That is what "better conditioned" means on the flashcard.
:::

::: context determinant-area A determinant measures area
For a $2\times2$ matrix, the determinant is the factor by which the matrix scales area. Picture a small square of nudges: position nudges from $0$ to $1$ across, velocity nudges from $0$ to $1$ up. Let a craft coast for time $\Delta t$ with no gravity: position changes by $\Delta t$ times velocity, velocity stays put. The square leans over into a parallelogram — same base, same height, same area. The determinant of that coasting matrix is $1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="130" x2="30" y2="15" stroke="#6c7a93" stroke-width="1"/>
  <rect x="30" y="40" width="80" height="80" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="190,120 270,120 330,40 250,40" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="85" font-size="12" text-anchor="middle" fill="#1f2a44">before</text>
  <text x="260" y="85" font-size="12" text-anchor="middle" fill="#1f2a44">after coasting</text>
  <text x="335" y="140" font-size="11" text-anchor="end" fill="#1f2a44">position nudge</text>
  <text x="36" y="24" font-size="11" fill="#1f2a44">velocity nudge</text>
</svg>
```

With gravity the shape also bends, but the area — in six dimensions, the volume — stays exactly the same. Physicists know this as Liouville's theorem.
:::

::: context phi-rv-seconds Why the units are seconds
$\boldsymbol{\Phi}_{rv}$ turns a velocity change (km/s) into a position change (km). Kilometres divided by kilometres-per-second leaves seconds. A good way to read an entry: "a $1\,\mathrm{m/s}$ change at departure moves the arrival this many metres, as if you had coasted with it for this many seconds." For very short flights the answer is the flight time itself. For longer ones, gravity reshapes it — an entry of $8673\,\mathrm{s}$ after a one-hour flight means a $1\,\mathrm{m/s}$ change moves the arrival by about $8.7\,\mathrm{km}$ in that direction.
:::

::: context chain-picture Chaining STMs like legs of a trip
Think of a trip with a stop in the middle. The first leg maps nudges at $t_0$ to nudges at $t_1$; the second leg maps those to $t_2$. The whole trip is one leg after the other, so the matrices multiply — right-hand matrix first, because it acts first.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="80" x2="320" y2="80" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="40" cy="80" r="5" fill="#1f2a44"/>
  <circle cx="180" cy="80" r="5" fill="#1f2a44"/>
  <circle cx="320" cy="80" r="5" fill="#1f2a44"/>
  <text x="40" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">t₀</text>
  <text x="180" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">t₁</text>
  <text x="320" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">t₂</text>
  <text x="110" y="70" font-size="12" text-anchor="middle" fill="#1d6fd1">Φ(t₁, t₀)</text>
  <text x="250" y="70" font-size="12" text-anchor="middle" fill="#1d6fd1">Φ(t₂, t₁)</text>
  <path d="M 40 60 Q 180 -5 320 60" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="40" font-size="12" text-anchor="middle" fill="#b4232c">Φ(t₂, t₀) = Φ(t₂, t₁) Φ(t₁, t₀)</text>
</svg>
```

Going backward over a leg undoes it, which is why the backward STM is the inverse of the forward one.
:::
