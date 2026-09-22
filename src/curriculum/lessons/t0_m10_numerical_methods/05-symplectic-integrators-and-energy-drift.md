---
id: l05-symplectic-integrators-and-energy-drift
title: Symplectic integrators and energy drift
minutes: 32
covers:
  - symplectic integrators for long orbit propagation
  - energy drift as a correctness check
---

A two-body orbit is a closed curve. The vehicle returns to the same point with the same velocity every period, forever, and two numbers stay exactly constant along the way: the specific mechanical energy $\varepsilon = v^2/2 - \mu/r$ and the specific angular momentum $\mathbf{h} = \mathbf{r} \times \mathbf{v}$. A numerical propagator produces a curve that is *not* closed. Each step commits a small error, and the question this lesson asks is what those errors do over a thousand revolutions: whether they accumulate in one direction, so that the orbit spirals and the energy walks away from its true value, or whether they stay bounded, so that the computed orbit wobbles about the true one indefinitely.

Every method in the previous two lessons — Euler, RK4, Dormand–Prince — is of the first kind. Their energy error is *secular*: it grows in proportion to the number of steps, with a sign fixed by the method. There is a different class of integrator, the *symplectic* methods, whose energy error is of the second kind: it oscillates within a band set by the step size and does not grow, for as long as you care to run. The simplest member of the class, leapfrog, is second order, needs one force evaluation per step, and fits in four lines. For propagating an orbit over months, a debris population over decades, or the solar system over millennia, it and its higher-order relatives are the tool.

The two behaviours — drift and oscillation — are also the most useful diagnostic you have. Logging $\varepsilon$ and $\mathbf{h}$ costs nothing, and the *shape* of their error against time tells you whether you are seeing truncation error behaving as theory predicts or a bug: a sign wrong in the force, a frame mixed up, a step taken at the wrong time. This lesson teaches the theory and the diagnostic together, on a real orbit, with the tables computed.

## Two invariants, and their values on a reference orbit

For the point-mass two-body problem $\ddot{\mathbf{r}} = -\mu\,\mathbf{r}/r^3$, the specific energy and specific angular momentum are

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r} = -\frac{\mu}{2a}, \qquad \mathbf{h} = \mathbf{r} \times \mathbf{v}, \quad h = \sqrt{\mu a (1 - e^2)} .
$$

Both are exact constants of the motion: $\dot{\varepsilon} = \mathbf{v}\cdot\dot{\mathbf{v}} + \mu\,\mathbf{r}\cdot\mathbf{v}/r^3 = -\mu\,\mathbf{v}\cdot\mathbf{r}/r^3 + \mu\,\mathbf{r}\cdot\mathbf{v}/r^3 = 0$, and $\dot{\mathbf{h}} = \mathbf{v}\times\mathbf{v} + \mathbf{r}\times\ddot{\mathbf{r}} = 0$ because the acceleration is parallel to $\mathbf{r}$. Their units are $\mathrm{km^2/s^2}$ and $\mathrm{km^2/s}$.

The lesson uses two orbits with $\mu = 398{,}600.4418\,\mathrm{km^3/s^2}$. The **circular 500 km orbit** from the RK4 lesson: $r_0 = 6{,}878.137\,\mathrm{km}$, $v_0 = 7.6126\,\mathrm{km/s}$, $T = 5{,}677\,\mathrm{s}$, mean motion $n = v_0/r_0 = 1.1068 \times 10^{-3}\,\mathrm{rad/s}$, $\varepsilon_0 = -28.9759\,\mathrm{km^2/s^2}$, $h_0 = 52{,}360.6\,\mathrm{km^2/s}$. And a **mildly eccentric orbit** with the same perigee, $e = 0.2$: $a = 8{,}597.7\,\mathrm{km}$, apogee $10{,}317\,\mathrm{km}$, perigee speed $8.3392\,\mathrm{km/s}$, $T = 7{,}934\,\mathrm{s}$, $\varepsilon_0 = -23.1807\,\mathrm{km^2/s^2}$. The eccentric one matters because on a circle the acceleration never changes magnitude, so the energy error of a good integrator has nothing to oscillate about; the eccentric orbit shows the oscillation in one revolution.

Throughout, the relative energy error is $\delta\varepsilon = (\varepsilon - \varepsilon_0)/|\varepsilon_0|$, so that a positive value means the numerical orbit has gained energy and grown.

::: key
The cheapest correctness check on a two-body propagator: specific mechanical energy $\varepsilon = v^2/2 - \mu/r$ and specific angular momentum $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ must both be constant. Log them every step. A secular trend in either one means an integrator or force-model bug — or, for a Runge–Kutta method, truncation error whose size must shrink by the predicted factor when the step is halved.
:::

## Why explicit Euler spirals outward

The RK4 lesson observed that every Euler step on a circular orbit moves the vehicle outward along the tangent. Here is the same fact in the language of amplification factors, which is what generalises.

Any oscillatory motion, close to a reference, looks locally like a harmonic oscillator $\ddot x = -\omega^2 x$. Write it as a first-order system in the state $(x, v)$ and apply one Euler step of size $h$:

$$
\begin{pmatrix} x_{k+1} \\ v_{k+1} \end{pmatrix}
=
\begin{pmatrix} 1 & h \\ -h\omega^2 & 1 \end{pmatrix}
\begin{pmatrix} x_k \\ v_k \end{pmatrix} .
$$

The eigenvalues of this matrix are $1 \pm ih\omega$. For the exact flow the corresponding factors are $e^{\pm i\omega h}$, of magnitude exactly 1: an oscillation neither grows nor decays. Euler's factors have magnitude

$$
|1 + ih\omega| = \sqrt{1 + h^2\omega^2} > 1 .
$$

Every step multiplies the amplitude by that number, whatever the phase. The energy of the oscillator is proportional to the amplitude squared, so every step multiplies the energy by $1 + h^2\omega^2$. This is the general statement of the flashcard: for the purely imaginary eigenvalues $\lambda = \pm i\omega$ of an oscillatory system, Euler's amplification factor $|1 + h\lambda|$ exceeds 1, so each step injects energy, and the error is one-way — *secular*, not random.

Implicit (backward) Euler has the mirror-image defect. Its factor is $1/(1 - h\lambda)$, of magnitude $1/\sqrt{1 + h^2\omega^2} < 1$, so it removes energy every step and spirals inward. Neither method ever gets the magnitude right, because no polynomial or simple rational function of $ih\omega$ has unit modulus for all $\omega$ — only the exponential does.

::: example Euler on the 500 km orbit, predicted and measured
Take $h = 60\,\mathrm{s}$. The angle per step is $\theta = hn = 60 \times 1.1068 \times 10^{-3} = 0.06641\,\mathrm{rad}$. The predicted energy factor per step is $1 + \theta^2 = 1.004410$, and one revolution is $T/h = 94.6$ steps, so the linear model predicts the oscillator's energy — amplitude squared — multiplied by $1.004410^{94.6} = 1.516$ per revolution, a 52% gain.

The two-body problem is nonlinear and its energy is not an oscillator's, so the model is a guide to sign and size, not a formula, but the run agrees in kind. After 95 Euler steps the vehicle is at $r = 12{,}078\,\mathrm{km}$, not $6{,}878$; the specific energy has risen from $-28.976$ to $-18.548\,\mathrm{km^2/s^2}$, a relative change $\delta\varepsilon = +0.360$, and the semi-major axis implied by that energy is $\mu/(2 \times 18.548) = 10{,}745\,\mathrm{km}$. The angular momentum has grown by 8.4%. Every one of the 95 steps pushed outward; none pulled back.

At $h = 15\,\mathrm{s}$, $\theta = 0.0166$, the per-step factor is $1.000276$ and the per-revolution prediction is $1.110$; the run gives $\delta\varepsilon = +0.149$ after one revolution and $r = 8{,}244\,\mathrm{km}$. Reducing the step by 4 reduced the damage by only about 2.4, because the per-revolution energy gain scales as $\theta^2 \times (T/h) \propto h$: first order, as Euler always is.
:::

::: key
Fixed-step explicit Euler makes a circular orbit spiral outward because its amplification factor $|1 + h\lambda| = \sqrt{1 + h^2\omega^2}$ exceeds 1 for the purely imaginary eigenvalues $\lambda = \pm i\omega$ of oscillatory motion. Every step injects energy; the error is secular, not random. Implicit Euler has factor $1/|1 - h\lambda| < 1$ and spirals inward.
:::

## What RK4 does instead: a slow spiral inward

RK4's amplification factor on $\dot y = \lambda y$ is the quartic $R(z) = 1 + z + z^2/2 + z^3/6 + z^4/24$ derived in the RK4 lesson. Put $z = i\theta$ and take the squared modulus. The real part is $1 - \theta^2/2 + \theta^4/24$ and the imaginary part is $\theta - \theta^3/6$, so

$$
|R(i\theta)|^2 = \left(1 - \tfrac{\theta^2}{2} + \tfrac{\theta^4}{24}\right)^2 + \left(\theta - \tfrac{\theta^3}{6}\right)^2
= 1 - \frac{\theta^6}{72} + \frac{\theta^8}{576} .
$$

The $\theta^2$ and $\theta^4$ terms cancel exactly — that is what fourth order means — and what is left is $1 - \theta^6/72$: less than 1, so RK4 *removes* energy, and very slowly. At $h = 60\,\mathrm{s}$ on the 500 km orbit, $\theta^6/72 = 1.2 \times 10^{-9}$ per step and about $1.1 \times 10^{-7}$ per revolution. The two-body run gives $\delta\varepsilon = -2.27 \times 10^{-7}$ per revolution, the same sign and order.

Two things about this number matter more than its size. First, it is *secular*: after ten revolutions the error is $-2.27 \times 10^{-6}$, after a hundred $-2.27 \times 10^{-5}$, after a thousand $-2.27 \times 10^{-4}$, and the orbit has sunk by $1.56\,\mathrm{km}$. The error at revolution $N$ is $N$ times the error at revolution 1, to three digits. Second, the per-revolution drift scales as $h^5$, one power higher than RK4's global position error, because the leading $h^4$ term of $|R|^2$ vanished: halving $h$ from 60 to 30 s changed the drift from $-2.27 \times 10^{-7}$ to $-7.04 \times 10^{-9}$ per revolution, a factor of 32.2. That scaling is the check you will use in the last section.

## Leapfrog: the simplest symplectic integrator

Leapfrog, also called velocity Verlet or Störmer–Verlet, applies only to second-order systems $\ddot{\mathbf{r}} = \mathbf{a}(\mathbf{r})$ where the acceleration depends on position alone — which gravity does. It advances the velocity half a step, the position a full step with that half-step velocity, then the velocity the other half step with the new acceleration:

$$
\begin{aligned}
\mathbf{v}_{k+1/2} &= \mathbf{v}_k + \tfrac{h}{2}\,\mathbf{a}(\mathbf{r}_k), \\
\mathbf{r}_{k+1} &= \mathbf{r}_k + h\,\mathbf{v}_{k+1/2}, \\
\mathbf{v}_{k+1} &= \mathbf{v}_{k+1/2} + \tfrac{h}{2}\,\mathbf{a}(\mathbf{r}_{k+1}) .
\end{aligned}
$$

This is the *kick–drift–kick* form. The acceleration $\mathbf{a}(\mathbf{r}_{k+1})$ computed in the last line is exactly the one the next step's first line needs, so the cost is one force evaluation per step — a quarter of RK4's. Substituting the half-step velocity into the position update gives $\mathbf{r}_{k+1} = \mathbf{r}_k + h\mathbf{v}_k + \tfrac{h^2}{2}\mathbf{a}_k$, the Taylor expansion through second order, and the velocity update is the trapezoidal rule on $\mathbf{a}$; the method is second order, with global error $O(h^2)$. Run backwards — negate $h$ and swap the roles of $k$ and $k+1$ — it retraces its steps exactly; it is *time-reversible*, which the Runge–Kutta methods are not.

```python
def leapfrog(r, v, h, n_steps, acc):
    a = acc(r)
    for _ in range(n_steps):
        v = v + 0.5 * h * a
        r = r + h * v
        a = acc(r)            # the one force evaluation per step
        v = v + 0.5 * h * a
    return r, v
```

Now do to leapfrog what was done to Euler: apply it to $\ddot x = -\omega^2 x$ and write out the matrix. With $s = h\omega$, the half-kick gives $v_{k+1/2} = v_k - \tfrac{s\omega}{2}x_k$; the drift gives $x_{k+1} = x_k + hv_{k+1/2} = (1 - \tfrac{s^2}{2})x_k + hv_k$; the second half-kick gives $v_{k+1} = v_{k+1/2} - \tfrac{s\omega}{2}x_{k+1}$. Collecting,

$$
\begin{pmatrix} x_{k+1} \\ v_{k+1} \end{pmatrix}
=
\begin{pmatrix} 1 - \tfrac{s^2}{2} & h \\[4pt] -h\omega^2\left(1 - \tfrac{s^2}{4}\right) & 1 - \tfrac{s^2}{2} \end{pmatrix}
\begin{pmatrix} x_k \\ v_k \end{pmatrix} .
$$

Its determinant is $(1 - \tfrac{s^2}{2})^2 + s^2(1 - \tfrac{s^2}{4}) = 1 - s^2 + \tfrac{s^4}{4} + s^2 - \tfrac{s^4}{4} = 1$, exactly, for every $h$. A linear map of the phase plane with determinant 1 preserves area; that area preservation, extended to the $2n$-dimensional phase space of positions and momenta, is what *symplectic* means, and the exact flow of any Hamiltonian system has it. Euler's matrix had determinant $1 + s^2$; it inflates phase-space area every step, which is the spiral seen from a different angle.

Because the determinant is 1, the two eigenvalues multiply to 1. They lie on the unit circle — no growth, no decay — exactly when the trace $2 - s^2$ has magnitude below 2, that is, when $h\omega < 2$. Above that the method is unstable; below it, the amplitude is preserved for every $h$, not just small $h$. For the 500 km orbit the limit is $h < 2/n = 1{,}807\,\mathrm{s}$, nearly a third of the period.

## The shadow energy

Area preservation is not the same as energy conservation, and leapfrog does *not* conserve $\varepsilon$. What it conserves instead is a slightly different quantity. For the harmonic oscillator you can find it by hand: look for a quadratic form $Q = v^2 + c\,x^2$ that the matrix above leaves unchanged. Substituting $x_{k+1}$ and $v_{k+1}$ and requiring the cross terms in $x_k v_k$ to cancel and the coefficients to reproduce themselves gives, after a few lines of algebra, $c = \omega^2(1 - s^2/4)$. So

$$
\tilde{H} = \frac{v^2}{2} + \frac{\omega^2}{2}\left(1 - \frac{h^2\omega^2}{4}\right)x^2 = H - \frac{h^2\omega^4}{8}\,x^2
$$

is conserved *exactly*, at every step, for any $h\omega < 2$. It differs from the true energy $H = v^2/2 + \omega^2 x^2/2$ by a term of order $h^2$ that depends on where in the oscillation you are. The true energy therefore oscillates about the conserved $\tilde{H}$ with an amplitude of order $h^2\omega^2 H$, and it can never wander further than that, because $\tilde{H}$ pins it. This is the whole mechanism in miniature. $\tilde{H}$ is the *shadow Hamiltonian*, or modified Hamiltonian, of the method.

::: example The shadow energy, step by step
$\ddot x = -x$, so $\omega = 1$, with $x_0 = 1$, $v_0 = 0$, and the deliberately coarse $h = 0.5$ — a twelfth of the period per step. The true energy is $H = 0.5$. The shadow energy is $\tilde{H} = v^2/2 + (1 - 0.0625)x^2/2$, which at the start is $0.46875$.

| step | $x$ | $v$ | $H = \tfrac12 v^2 + \tfrac12 x^2$ | $\tilde{H}$ |
| --- | --- | --- | --- | --- |
| 0 | 1.000000 | 0.000000 | 0.500000 | 0.468750000 |
| 1 | 0.875000 | $-0.468750$ | 0.492676 | 0.468750000 |
| 2 | 0.531250 | $-0.820312$ | 0.477570 | 0.468750000 |
| 3 | 0.054688 | $-0.966797$ | 0.468843 | 0.468750000 |
| 4 | $-0.435547$ | $-0.871582$ | 0.474678 | 0.468750000 |
| 5 | $-0.816895$ | $-0.558472$ | 0.489604 | 0.468750000 |

$H$ swings between $0.4688$ and $0.5000$ — an error of up to 6% at this absurd step — and comes back; $\tilde{H}$ does not change in the ninth decimal place. Run it for a million steps and both statements stay true. The numerical trajectory is not an approximation to a circle in the $(x, v)$ plane that slowly spirals; it is an *exact* ellipse of a slightly different Hamiltonian, traversed forever.
:::

For a nonlinear Hamiltonian like two-body gravity the shadow Hamiltonian is not a single closed formula but a series, $\tilde{H} = H + h^2 H_2 + h^4 H_4 + \cdots$, and the series does not converge; what backward error analysis proves is that a truncation of it is conserved up to errors exponentially small in $1/h$, over times exponentially long in $1/h$. For any orbit propagation you will actually run, that is forever. The consequence is the flashcard statement: a symplectic integrator exactly conserves a nearby shadow Hamiltonian, so the energy error oscillates within a bound of order $h^2$ (for leapfrog) instead of drifting secularly. Over thousands of revolutions that is the difference between a bounded wobble and a spiral.

::: key
Symplectic integrators matter for long orbit propagation because they exactly conserve a nearby shadow Hamiltonian $\tilde{H} = H + O(h^2)$. The true energy error therefore oscillates within a bound set by the step size instead of drifting secularly; over thousands of revolutions that is the difference between a bounded wobble and a spiral. Leapfrog (velocity Verlet, kick–drift–kick) is the simplest: second order, one force evaluation per step, time-reversible, stable for $h\omega < 2$. Leapfrog also conserves angular momentum exactly for a central force, because kicks are along $\mathbf{r}$ and drifts along $\mathbf{v}$.
:::

## The two-body test: one revolution, then a hundred, then a thousand

Everything above was linear. Here are the three integrators on the eccentric orbit ($e = 0.2$, perigee 500 km), all with $h = 60\,\mathrm{s}$, sampled eight times through the first revolution. $r$ is the radius at the sample:

| $t$ | fraction of $T$ | $r$ (km) | Euler $\delta\varepsilon$ | RK4 $\delta\varepsilon$ | leapfrog $\delta\varepsilon$ |
| --- | --- | --- | --- | --- | --- |
| 960 s | 0.12 | 7,559 | $+0.159$ | $-1.22 \times 10^{-7}$ | $+3.07 \times 10^{-4}$ |
| 1,920 s | 0.24 | 8,860 | $+0.228$ | $-1.74 \times 10^{-7}$ | $+5.26 \times 10^{-4}$ |
| 2,880 s | 0.36 | 9,896 | $+0.254$ | $-1.86 \times 10^{-7}$ | $+5.79 \times 10^{-4}$ |
| 3,840 s | 0.48 | 10,329 | $+0.268$ | $-1.88 \times 10^{-7}$ | $+5.90 \times 10^{-4}$ |
| 4,800 s | 0.61 | 10,079 | $+0.276$ | $-1.88 \times 10^{-7}$ | $+5.84 \times 10^{-4}$ |
| 5,760 s | 0.73 | 9,190 | $+0.283$ | $-1.84 \times 10^{-7}$ | $+5.48 \times 10^{-4}$ |
| 6,720 s | 0.85 | 7,899 | $+0.289$ | $-1.65 \times 10^{-7}$ | $+3.95 \times 10^{-4}$ |
| 7,680 s | 0.97 | 6,935 | $+0.295$ | $-1.20 \times 10^{-7}$ | $+3.5 \times 10^{-5}$ |

Read the columns as shapes. Euler climbs monotonically from the first step. RK4's error grows in magnitude towards apogee and shrinks towards perigee, but does not return to zero: it ends the revolution at $-1.20 \times 10^{-7}$ and the next one at $-2.5 \times 10^{-7}$. Leapfrog's error is the largest of the three by far at apogee — $5.9 \times 10^{-4}$, ten thousand times RK4's, as a second-order method at this step deserves — and then comes *back*, to $3.5 \times 10^{-5}$ near perigee, and to $10^{-6}$ or below at perigee itself. Its error is a function of *where the vehicle is*, not of *how long it has been running*. That is the shadow Hamiltonian at work: $\varepsilon - \tilde{\varepsilon}$ depends on $r$ and $v$, both of which are periodic.

Now the range of $\delta\varepsilon$ within each revolution, for revolutions 1 to 100:

| revolution | Euler | RK4 | leapfrog |
| --- | --- | --- | --- |
| 1 | $+0.012$ to $+0.296$ | $-1.89 \times 10^{-7}$ to $-0.05 \times 10^{-7}$ | $+2 \times 10^{-7}$ to $+5.90 \times 10^{-4}$ |
| 2 | $+0.297$ to $+0.484$ | $-3.16 \times 10^{-7}$ to $-1.31 \times 10^{-7}$ | $+8 \times 10^{-7}$ to $+5.90 \times 10^{-4}$ |
| 5 | $+0.519$ to $+0.613$ | $-6.99 \times 10^{-7}$ to $-5.11 \times 10^{-7}$ | $+3 \times 10^{-7}$ to $+5.90 \times 10^{-4}$ |
| 10 | $+0.670$ to $+0.697$ | $-1.34 \times 10^{-6}$ to $-1.14 \times 10^{-6}$ | $+0.2 \times 10^{-7}$ to $+5.90 \times 10^{-4}$ |
| 20 | $+0.753$ to $+0.754$ | $-2.61 \times 10^{-6}$ to $-2.42 \times 10^{-6}$ | $+4 \times 10^{-7}$ to $+5.90 \times 10^{-4}$ |
| 50 | $+0.851$ to $+0.852$ | $-6.44 \times 10^{-6}$ to $-6.24 \times 10^{-6}$ | $+0.2 \times 10^{-7}$ to $+5.90 \times 10^{-4}$ |
| 100 | $+0.893$ to $+0.893$ | $-1.28 \times 10^{-5}$ to $-1.26 \times 10^{-5}$ | $+0.4 \times 10^{-7}$ to $+5.90 \times 10^{-4}$ |

RK4's band is narrow and *moves*: its centre is $-1.27 \times 10^{-7}$ times the revolution number, to two digits, all the way to 100. Leapfrog's band is wide and *does not move*: its upper edge is $5.90 \times 10^{-4}$ in revolution 1 and $5.90 \times 10^{-4}$ in revolution 100, and its lower edge is within a few $10^{-7}$ of zero throughout. The perigee radius after 100 revolutions is $6{,}878.205\,\mathrm{km}$ against the true $6{,}878.137$ — 68 m, bounded. Euler's numerical orbit has by revolution 100 gained 89% of its binding energy and would need only a little more to escape; the growth slows because as the orbit expands $hn$ shrinks, not because anything corrected it.

Compare at equal cost. Leapfrog at $h = 15\,\mathrm{s}$ uses one force evaluation per 15 s, the same as RK4 at $h = 60\,\mathrm{s}$. Its band is then $0$ to $+3.68 \times 10^{-5}$ in revolution 1, revolution 10 and revolution 100 — sixteen times narrower than at 60 s, as $h^2$ says, and still not moving. RK4 at $h = 60\,\mathrm{s}$ crosses $-3.7 \times 10^{-5}$ at about revolution 290, and from then on the second-order symplectic method has the smaller energy error, and the gap widens linearly forever.

On the *circular* orbit the same contrast holds with smaller numbers. At $h = 60\,\mathrm{s}$ over $1{,}000$ revolutions, RK4's $\delta\varepsilon$ goes $-2.27 \times 10^{-7}, -2.27 \times 10^{-6}, -2.27 \times 10^{-5}, -2.27 \times 10^{-4}$ at revolutions 1, 10, 100, 1000 and the radius falls by $1.56\,\mathrm{km}$. Leapfrog's stays between 0 and $+4.8 \times 10^{-6}$ for the whole thousand — wandering within that band over hundreds of revolutions, because the sampling clock and the slightly different numerical period beat against each other, but never leaving it.

Angular momentum makes the contrast sharper still. Leapfrog's kicks change $\mathbf{v}$ along $\mathbf{r}$, and $\mathbf{r} \times (\mathbf{v} + \alpha\mathbf{r}) = \mathbf{r} \times \mathbf{v}$; its drifts change $\mathbf{r}$ along $\mathbf{v}$, and $(\mathbf{r} + \beta\mathbf{v}) \times \mathbf{v} = \mathbf{r} \times \mathbf{v}$. So leapfrog conserves $\mathbf{h}$ *exactly* for any central force, at any step size; in the runs above $\delta h$ is $10^{-15}$, round-off. RK4's angular momentum drifts at $-1.13 \times 10^{-7}$ per revolution at $h = 60\,\mathrm{s}$, half its energy drift; Euler's grows 8.4% per revolution.

## Drift versus oscillation as a diagnostic

You now have the signatures. Put a plot of $\delta\varepsilon$ against time in every propagator you write and read it like this.

**A bounded oscillation with the orbital period**, largest near apogee and returning to near zero near perigee, with an envelope that does not move over many revolutions: a symplectic integrator behaving correctly. Its amplitude should scale as $h^2$ for leapfrog — halve the step and expect a quarter.

**A slow, one-directional drift, linear in time**, with a small within-orbit ripple on top: a Runge–Kutta or multistep integrator behaving correctly. The direction is fixed by the method — RK4 loses energy — and the rate must scale as the theory says: $h^5$ per revolution for RK4, so halving the step must cut the drift by about 32. This scaling test is the diagnostic. If you halve $h$ and the drift halves, or does not change, what you are looking at is *not* truncation error, and the integrator is not the culprit.

**A drift that fails the scaling test** means a bug in the physics or its coding. The usual ones: a force term evaluated at the wrong time, so the stage structure of RK4 is broken and the method has silently dropped to first or second order; a mixed frame, with position in one and velocity in another, so the "conserved" quantity you are computing is not conserved; a non-conservative force that should not be there, or a conservative one coded with the wrong sign; $\mu$ or a unit inconsistent between the force model and the energy check. The check catches all of these before you have compared a single ephemeris against reality.

**A physical drift** can also be real. Atmospheric drag removes energy monotonically — that is what drag does — at a rate you can compute from the drag acceleration, $\dot\varepsilon = \mathbf{a}_{\text{drag}}\cdot\mathbf{v}$. A $J_2$ oblateness term conserves $\varepsilon$ exactly, because it is a time-independent potential, but it conserves only $h_z$, not the whole vector $\mathbf{h}$; the node regresses and the vector precesses. A third body or a rotating-frame potential does not conserve $\varepsilon$ at all, and you check the Jacobi constant instead. Know which invariant your force model actually preserves before you accuse the integrator.

::: example Diagnosing a drift from two runs
A colleague's RK4 propagator on the circular 500 km orbit shows $\delta\varepsilon = -3.0 \times 10^{-6}$ after one revolution at $h = 60\,\mathrm{s}$, and $-1.5 \times 10^{-6}$ at $h = 30\,\mathrm{s}$.

Correct RK4 at $h = 60\,\mathrm{s}$ gives $-2.27 \times 10^{-7}$ per revolution — the observed value is 13 times larger — and halving the step should divide the drift by $2^5 = 32$; it divided it by 2. Both facts say first order. The sign is right and the shape is a smooth drift, so the force is not grossly wrong. A first-order energy error from a method that should be fourth order means the stages are being fed inconsistently: the acceleration at one stage evaluated with a stale position, or the state unpacked into scalars and one component updated out of sequence. The thing to check is the derivative function called inside the stepper, not the stepper itself — the RK4 lesson's test of halving $h$ on $\dot y = -y$ would pass, because that problem has no position–velocity structure to get out of step.
:::

::: warning
A conserved energy does not mean a correct orbit. Leapfrog at $h = 60\,\mathrm{s}$ holds $\delta\varepsilon$ inside $6 \times 10^{-4}$ forever and its radius within metres, but its numerical period is $0.15\%$ too long, so its *phase* error — where the vehicle is along the orbit — grows linearly: on the circular orbit the vehicle lags $63\,\mathrm{km}$ after one revolution, $633\,\mathrm{km}$ after ten and $6{,}350\,\mathrm{km}$ after a hundred. At $h = 15\,\mathrm{s}$ the lag is 16 times smaller, $4.0\,\mathrm{km}$ per revolution, as $h^2$ requires. RK4 at $h = 60\,\mathrm{s}$ is only $27\,\mathrm{m}$ off after one revolution, but its energy drift shortens the period a little more every orbit, so its along-track error grows *quadratically*: $0.93\,\mathrm{km}$ at ten revolutions, $76\,\mathrm{km}$ at a hundred. Bounded energy buys you the orbit's *shape and size* forever; it does not buy you the vehicle's position along it. Energy is a necessary check, never a sufficient one, and a comparison against an independent high-accuracy reference is still required for anything you intend to fly.
:::

::: warning
Sample the invariant at the same orbital phase, or plot its envelope, before calling anything a drift. The leapfrog energy error legitimately swings through four orders of magnitude within one eccentric revolution; sampling it at fixed clock times as the numerical period slowly walks relative to the clock produces a slow wander that looks like a drift and is not one. Plot the per-revolution minimum and maximum: an integrator that is drifting moves both; one that is oscillating moves neither.
:::

## Choosing an integrator for the job

Symplectic methods come with conditions. They need a *Hamiltonian* system — conservative forces, no drag, no thrust — and a *fixed* step: change $h$ from step to step and the shadow Hamiltonian changes with it, and the bounded-error property is lost. And second-order leapfrog is the demonstration, not the production tool: the warning above showed that at a step which keeps its energy error bounded, its phase error is tens of kilometres per revolution. What production long-arc propagators use are the higher-order members of the family — Yoshida's fourth- and sixth-order compositions of leapfrog steps, and the Gauss–Jackson multistep family that has propagated satellites and catalogued debris for decades — which keep the bounded-energy property while bringing the phase error down by the extra powers of $h$. For the two-body problem with perturbations the convention is to integrate the *perturbation* symplectically while handling the Kepler part analytically, which is a course of its own.

For a single revolution, a rendezvous arc, a burn, or anything with thrust or drag in it, adaptive Dormand–Prince or fixed RK4 is the right tool, and the energy check still applies — as a monitor of truncation error and bugs, with a drift you expect and can predict. The decision is not "symplectic is better". It is: how long is the propagation in periods, is the system conservative, and is the step fixed. When the answers are "many", "yes" and "yes", the symplectic method wins and the margin grows with every revolution.

## Check yourself

::: check
Implicit (backward) Euler applied to a circular orbit: does it spiral inward or outward, and by what factor does the amplitude change per step at $h = 60\,\mathrm{s}$ on the 500 km orbit?
:::

::: answer
Inward. Backward Euler's amplification factor is $1/(1 - h\lambda)$; for $\lambda = in$ its squared modulus is $1/(1 + h^2 n^2)$, less than 1. With $\theta = hn = 0.0664$, the energy factor per step is $1/1.00441 = 0.99561$ and the amplitude factor is its square root, $0.99780$: a loss of 0.22% of the amplitude per step, so per revolution the energy falls to $0.99561^{94.6} = 0.66$ of its magnitude. Explicit and implicit Euler are mirror images; neither has a factor of unit modulus.
:::

::: check
A propagator uses explicit Euler at $h = 10\,\mathrm{s}$ on the circular 500 km orbit. Predict the energy gain per revolution from the linear model, and say how many revolutions it takes for the linear model to predict a doubling.
:::

::: answer
$\theta = hn = 10 \times 1.1068 \times 10^{-3} = 0.011068$; per-step factor $1 + \theta^2 = 1.0001225$; steps per revolution $5{,}677/10 = 567.7$; per-revolution factor $1.0001225^{567.7} = 1.072$, a 7.2% gain. Doubling needs $\ln 2/\ln 1.072 = 10$ revolutions. Compare $h = 60\,\mathrm{s}$: 52% per revolution. The gain per revolution scales as $\theta^2 \times (T/h) \propto h$, so reducing the step from 60 to 10 s reduced it by about 6 — first order, and never zero.
:::

::: check
Leapfrog on the eccentric orbit at $h = 60\,\mathrm{s}$ has an energy error band of $0$ to $+5.90 \times 10^{-4}$. Predict the band at $h = 20\,\mathrm{s}$, and the step at which it would match RK4's first-revolution error of about $1.9 \times 10^{-7}$ at $h = 60\,\mathrm{s}$. Then say why, for a 1,000-revolution propagation, the comparison at revolution 1 is the wrong one to make.
:::

::: answer
Leapfrog's error is $O(h^2)$, so at $h = 20\,\mathrm{s}$ the band shrinks by $9$ to about $6.6 \times 10^{-5}$ (the measured $h = 15\,\mathrm{s}$ band of $3.68 \times 10^{-5}$ is consistent: $5.90 \times 10^{-4}/16 = 3.69 \times 10^{-5}$). To reach $1.9 \times 10^{-7}$ needs $h = 60\sqrt{1.9 \times 10^{-7}/5.9 \times 10^{-4}} = 1.1\,\mathrm{s}$. The comparison is wrong because RK4's error is secular: at revolution 1,000 it is $1.3 \times 10^{-4}$, while leapfrog's band at $h = 60\,\mathrm{s}$ is still $5.9 \times 10^{-4}$ and at $h = 15\,\mathrm{s}$ — the same cost as RK4 at 60 s — still $3.7 \times 10^{-5}$, four times smaller. The right comparison is at the end of the propagation, and there the bounded method wins at equal cost.
:::

::: check
Why does leapfrog conserve angular momentum exactly for a central force, and does the same argument work for RK4?
:::

::: answer
Each leapfrog sub-step changes one of $\mathbf{r}$, $\mathbf{v}$ by a multiple of the other: a kick adds $\alpha\mathbf{r}$ to $\mathbf{v}$ (the acceleration is along $\mathbf{r}$ for a central force), a drift adds $\beta\mathbf{v}$ to $\mathbf{r}$. Since $\mathbf{r} \times \mathbf{r} = 0$ and $\mathbf{v} \times \mathbf{v} = 0$, $\mathbf{r} \times \mathbf{v}$ is unchanged by both, so it is unchanged by the step, to round-off, at any $h$. RK4 does not decompose into such sub-steps: its update adds a weighted sum of accelerations evaluated at four *different* intermediate positions, none of which is parallel to the final $\mathbf{r}$, so the cross product changes. Measured: leapfrog $\delta h \sim 10^{-15}$, RK4 $-1.1 \times 10^{-7}$ per revolution at $h = 60\,\mathrm{s}$.
:::

::: check
You add atmospheric drag to a propagator that uses leapfrog and observe the energy error drifting downward linearly. A colleague says the symplectic property has been broken and you should switch to RK4. What is right and wrong in that statement?
:::

::: answer
Right: drag is non-conservative, the system is no longer Hamiltonian, and leapfrog's bounded-energy guarantee no longer applies — there is no shadow Hamiltonian to conserve. Wrong: the downward drift is not evidence of anything broken; drag *removes* energy, and $\dot\varepsilon = \mathbf{a}_{\text{drag}} \cdot \mathbf{v} < 0$ is the physics. The check is to compute the expected energy loss from the drag model and compare; the residual, after subtracting it, is the integration error. Whether to switch integrators depends on the arc: for a long arc with weak drag, leapfrog for the gravity and a careful treatment of the drag term is still common; for a short arc or strong drag, adaptive RK45 is appropriate. Either way the energy check remains useful — you just have to know what the correct answer is before you compare.
:::

## Summary

| Item | Statement |
| --- | --- |
| Invariants | $\varepsilon = v^2/2 - \mu/r = -\mu/(2a)$ and $\mathbf{h} = \mathbf{r} \times \mathbf{v}$, constant on a two-body orbit; log both every step |
| Euler on $\lambda = \pm i\omega$ | $\lvert 1 + h\lambda\rvert = \sqrt{1 + h^2\omega^2} > 1$: energy injected every step, outward spiral, secular; 500 km orbit at $h = 60\,\mathrm{s}$: $+36\%$ of $\lvert\varepsilon_0\rvert$ per revolution |
| Implicit Euler | $1/\lvert 1 - h\lambda\rvert < 1$: inward spiral |
| RK4 | $\lvert R(i\theta)\rvert^2 = 1 - \theta^6/72 + \cdots$: slow inward drift, $-2.27 \times 10^{-7}$ per revolution at $h = 60\,\mathrm{s}$, linear in time, scaling as $h^5$ |
| Leapfrog | $\mathbf{v}_{+1/2} = \mathbf{v} + \tfrac{h}{2}\mathbf{a}(\mathbf{r})$; $\mathbf{r}' = \mathbf{r} + h\mathbf{v}_{+1/2}$; $\mathbf{v}' = \mathbf{v}_{+1/2} + \tfrac{h}{2}\mathbf{a}(\mathbf{r}')$; order 2; one force evaluation; $\det = 1$; stable for $h\omega < 2$ |
| Shadow Hamiltonian | Leapfrog exactly conserves $\tilde{H} = H + O(h^2)$ (oscillator: $\tilde{H} = \tfrac12 v^2 + \tfrac12\omega^2(1 - h^2\omega^2/4)x^2$); energy error bounded and oscillatory |
| Signatures | Drift linear in $N$ with narrow moving band: Runge–Kutta truncation. Wide band with fixed envelope: symplectic. Drift that fails the $h$-scaling test: a bug |
| Scaling test | RK4 drift per revolution $\propto h^5$ (halve $h$: divide by 32); leapfrog band $\propto h^2$ (halve $h$: divide by 4) |
| Angular momentum | Leapfrog conserves $\mathbf{h}$ exactly for central forces; RK4 drifts it at half the energy rate |
| Choice | Long, conservative, fixed-step: symplectic. Short, or with thrust or drag: RK4 or adaptive RK45, with the energy check as a monitor |

The next lesson returns to the general initial value problem and asks how to get RK4's accuracy at leapfrog's price: the Adams–Bashforth and Adams–Moulton multistep methods reuse the derivatives already computed at earlier steps, so a fourth-order step costs one evaluation instead of four.
