---
id: l05-symplectic-integrators-and-energy-drift
title: Symplectic integrators and energy drift
minutes: 24
covers:
  - symplectic integrators for long orbit propagation
  - energy drift as a correctness check
---

Picture two imperfect clocks. One runs a little fast: after a year it is hours wrong. The other has a wobbly pendulum: sometimes a little ahead, sometimes behind, but a year later still within a few seconds. Only the first gets worse forever.

A computed orbit goes wrong in one of those two ways. A real two-body orbit is a closed loop; a propagator makes a small error each step, so its loop never quite closes. Over a thousand laps, either the errors pile up in one direction — the orbit spirals, like the fast clock — or they stay bounded and the orbit wobbles around the true one, like the pendulum clock.

Every method so far — Euler, RK4, Dormand–Prince — is the fast clock. The **symplectic** integrators are the pendulum clock. The simplest, leapfrog, is second order, costs one force evaluation per step, and fits in four lines. For orbits over months or the solar system over millennia, it and its relatives are the tool.

The two behaviors are also your best bug detector: the *shape* of the energy error over time tells truncation error apart from a coding mistake.

## Two numbers that must not change

For the point-mass two-body problem, $\ddot{\mathbf{r}} = -\mu\,\mathbf{r}/r^3$, two quantities stay exactly constant: the **specific mechanical energy** (energy per kilogram, kinetic plus potential) and the **specific angular momentum** (how much the vehicle swings around Earth):

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r} = -\frac{\mu}{2a}, \qquad \mathbf{h} = \mathbf{r} \times \mathbf{v}, \quad h = \sqrt{\mu a (1 - e^2)} .
$$

($\varepsilon$ is "epsilon", $a$ the semi-major axis, $e$ the eccentricity; units $\mathrm{km^2/s^2}$ and $\mathrm{km^2/s}$.)

::: note Why they have to stay constant
Differentiate the energy, using $\dot{\mathbf{v}} = -\mu\mathbf{r}/r^3$ and $\dot r = \mathbf{r}\cdot\mathbf{v}/r$:

$$
\dot{\varepsilon} = \mathbf{v}\cdot\dot{\mathbf{v}} + \frac{\mu}{r^2}\dot r = -\frac{\mu\,\mathbf{v}\cdot\mathbf{r}}{r^3} + \frac{\mu\,\mathbf{r}\cdot\mathbf{v}}{r^3} = 0 .
$$

And $\dot{\mathbf{h}} = \mathbf{v}\times\mathbf{v} + \mathbf{r}\times\ddot{\mathbf{r}} = 0$: a vector crossed with itself is zero, and the acceleration points along $\mathbf{r}$.
:::

Two orbits, with $\mu = 398{,}600.4418\,\mathrm{km^3/s^2}$:

- **Circular, 500 km up**: $r_0 = 6{,}878.137\,\mathrm{km}$, $v_0 = 7.6126\,\mathrm{km/s}$, period $T = 5{,}677\,\mathrm{s}$, **mean motion** (the average turning rate) $n = v_0/r_0 = 1.1068 \times 10^{-3}\,\mathrm{rad/s}$, $\varepsilon_0 = -28.9759\,\mathrm{km^2/s^2}$, $h_0 = 52{,}360.6\,\mathrm{km^2/s}$.
- **Mildly eccentric**, same perigee, $e = 0.2$: $a = 8{,}597.7\,\mathrm{km}$, apogee radius $10{,}317\,\mathrm{km}$, perigee speed $8.3392\,\mathrm{km/s}$, $T = 7{,}934\,\mathrm{s}$, $\varepsilon_0 = -23.1807\,\mathrm{km^2/s^2}$.

On a circle nothing changes around the lap; the ellipse shows how a good integrator's energy error wobbles. Throughout, the **relative energy error** is $\delta\varepsilon = (\varepsilon - \varepsilon_0)/|\varepsilon_0|$; positive means the computed orbit has gained energy and grown.

::: key Energy check
The cheapest correctness check on a two-body propagator: specific mechanical energy $\varepsilon = v^2/2 - \mu/r$ and specific angular momentum $\mathbf{h} = \mathbf{r} \times \mathbf{v}$ must both be constant. Log them every step. A secular trend in either one means an integrator or force-model bug — or, for a Runge–Kutta method, truncation error whose size must shrink by the predicted factor when the step is halved.
:::

## Why explicit Euler spirals outward

Walk around a round pond in the dark, each step straight ahead. Every step takes you a little off the edge — always outward. That is Euler on an orbit: each step moves along the **[[tangent|euler-tangent]]**, which leaves the circle on the outside.

Now as a number. Near a reference, any oscillating motion looks like a spring, $\ddot x = -\omega^2 x$, where $\omega$ ("omega") is the angular frequency. Write it in the state $(x, v)$ and take one Euler step of size $h$:

$$
\begin{pmatrix} x_{k+1} \\ v_{k+1} \end{pmatrix}
=
\begin{pmatrix} 1 & h \\ -h\omega^2 & 1 \end{pmatrix}
\begin{pmatrix} x_k \\ v_k \end{pmatrix} .
$$

The spring's own eigenvalues are $\lambda = \pm i\omega$ ("lambda"); this matrix's are $1 + h\lambda = 1 \pm ih\omega$. Each says how much one step multiplies its part of the motion — the method's **amplification factor**. For the exact motion the factors are $e^{\pm i\omega h}$, of size exactly 1. Euler's have size

$$
|1 + ih\omega| = \sqrt{1 + h^2\omega^2} > 1 .
$$

Every step multiplies the swing by that number, so the energy (swing squared) by $1 + h^2\omega^2$. The error only ever goes one way: it is **[[secular|secular]]**, growing steadily instead of averaging out.

**Backward (implicit) Euler** has the mirror-image flaw: factor $1/(1 - h\lambda)$, of size $1/\sqrt{1 + h^2\omega^2} < 1$, so it spirals *inward*. No polynomial or simple fraction in $ih\omega$ has size 1 for every $\omega$ — only the exponential does.

::: key Why Euler spirals
Fixed-step explicit Euler makes a circular orbit spiral outward because its amplification factor $|1 + h\lambda| = \sqrt{1 + h^2\omega^2}$ exceeds 1 for the purely imaginary eigenvalues $\lambda = \pm i\omega$ of oscillatory motion. Every step injects energy; the error is secular, not random. Implicit Euler has factor $1/|1 - h\lambda| < 1$ and spirals inward.
:::

::: example Euler on the 500 km orbit, predicted and measured
On an orbit the spring frequency is the mean motion $n$. Take $h = 60\,\mathrm{s}$.

**Predict.** The angle turned per step is $\theta = hn = 60 \times 1.1068 \times 10^{-3} = 0.06641\,\mathrm{rad}$. The energy factor per step is $1 + \theta^2 = 1.004410$. One lap is $T/h = 5{,}677/60 = 94.6$ steps, so the spring model predicts the energy multiplied by $1.004410^{94.6} = 1.516$ per lap — a 52% gain.

**Measure.** The orbit is not a spring, so the model gives only sign and rough size. After 95 steps the vehicle is at $r = 12{,}078\,\mathrm{km}$, not $6{,}878$. The energy rose from $-28.976$ to $-18.548\,\mathrm{km^2/s^2}$, so $\delta\varepsilon = +0.360$, implying a semi-major axis of $\mu/(2 \times 18.548) = 10{,}745\,\mathrm{km}$. Angular momentum grew 23.6%.

**Halve twice.** At $h = 15\,\mathrm{s}$: $\theta = 0.0166$, factor $1.000276$ per step, $1.110$ predicted per lap. The run gives $\delta\varepsilon = +0.149$ and $r = 8{,}244\,\mathrm{km}$. Cutting the step by 4 cut the damage by only $0.360/0.149 = 2.4$: the gain per lap scales as $\theta^2 \times (T/h) \propto h$ — first order.
:::

## RK4: a slow spiral inward

Apply one RK4 step to $\dot y = \lambda y$ and write $z = h\lambda$. Each stage multiplies by one more power of $z$, and the result is $y_{n+1} = R(z)\,y_n$ with

$$
R(z) = 1 + z + \frac{z^2}{2} + \frac{z^3}{6} + \frac{z^4}{24},
$$

the first five terms of the series for $e^{z}$. For oscillation put $z = i\theta$. The real part is $1 - \theta^2/2 + \theta^4/24$ and the imaginary part is $\theta - \theta^3/6$. Square both, add, and collect powers of $\theta$:

$$
|R(i\theta)|^2 = \left(1 - \tfrac{\theta^2}{2} + \tfrac{\theta^4}{24}\right)^2 + \left(\theta - \tfrac{\theta^3}{6}\right)^2
= 1 - \frac{\theta^6}{72} + \frac{\theta^8}{576} .
$$

The $\theta^2$ and $\theta^4$ terms cancel — that is what fourth order buys — and $1 - \theta^6/72$ is below 1, so RK4 *removes* energy, very slowly. At $h = 60\,\mathrm{s}$ on the 500 km orbit, $\theta^6/72 = 1.2 \times 10^{-9}$ per step, about $1.1 \times 10^{-7}$ per lap. The real two-body run gives $\delta\varepsilon = -2.27 \times 10^{-7}$ per lap: same sign, same size. Two more things matter:

- **It is secular.** After 10 laps it is $-2.26 \times 10^{-6}$, after 100 laps $-2.26 \times 10^{-5}$, after 1,000 laps $-2.26 \times 10^{-4}$, and the orbit has sunk by $1.55\,\mathrm{km}$. Lap $N$'s error is $N$ times lap 1's.
- **It scales as $h^5$ per lap**, one power higher than RK4's global position error, because the $\theta^4$ term vanished. Halving $h$ from 60 to 30 s changed the drift from $-2.27 \times 10^{-7}$ to $-7.04 \times 10^{-9}$ per lap, a factor of 32.2. That scaling is your bug test.

## Leapfrog: the simplest symplectic integrator

**Leapfrog** (also velocity Verlet or **[[Störmer–Verlet|verlet]]**) works for $\ddot{\mathbf{r}} = \mathbf{a}(\mathbf{r})$, acceleration depending on position only — as gravity does. It nudges the velocity half a step, moves the position a full step with that velocity, then nudges the velocity the other half with the new acceleration:

$$
\begin{aligned}
\mathbf{v}_{k+1/2} &= \mathbf{v}_k + \tfrac{h}{2}\,\mathbf{a}(\mathbf{r}_k), \\
\mathbf{r}_{k+1} &= \mathbf{r}_k + h\,\mathbf{v}_{k+1/2}, \\
\mathbf{v}_{k+1} &= \mathbf{v}_{k+1/2} + \tfrac{h}{2}\,\mathbf{a}(\mathbf{r}_{k+1}) .
\end{aligned}
$$

This is the **kick–drift–kick** form (a velocity change is a *kick*, a coast a *drift*). The last line's acceleration is reused by the next step's first line, so a step costs one force evaluation — a quarter of RK4's.

Substituting the half-step velocity gives $\mathbf{r}_{k+1} = \mathbf{r}_k + h\mathbf{v}_k + \tfrac{h^2}{2}\mathbf{a}_k$, the Taylor series through second order, and the velocity update is the trapezoidal rule on $\mathbf{a}$: second order, global error $O(h^2)$. Negate $h$ and it retraces its steps exactly — it is **[[time-reversible|reversible]]**, which Runge–Kutta methods are not.

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

Now treat leapfrog like Euler. On the spring, with $s = h\omega$, the three lines collect into one matrix (the note below shows the algebra):

$$
\begin{pmatrix} x_{k+1} \\ v_{k+1} \end{pmatrix}
=
\begin{pmatrix} 1 - \tfrac{s^2}{2} & h \\[4pt] -h\omega^2\left(1 - \tfrac{s^2}{4}\right) & 1 - \tfrac{s^2}{2} \end{pmatrix}
\begin{pmatrix} x_k \\ v_k \end{pmatrix} .
$$

Its determinant is exactly 1, for every $h$. A matrix with determinant 1 keeps areas: a patch of starting states $(x, v)$ is sheared and turned but never inflated. That **[[area preservation|phase-area]]**, extended to all positions and momenta, is what *symplectic* means, and the exact motion of every frictionless mechanical system has it. Euler's matrix has determinant $1 + s^2$: it inflates area every step — the spiral seen from another angle.

::: note Why the determinant is 1
The first kick gives $v_{k+1/2} = v_k - \tfrac{s\omega}{2}x_k$. The drift gives $x_{k+1} = x_k + hv_{k+1/2} = (1 - \tfrac{s^2}{2})x_k + hv_k$. The second kick gives $v_{k+1} = v_{k+1/2} - \tfrac{s\omega}{2}x_{k+1}$; substituting and collecting gives the bottom row. Then

$$
\det = \left(1 - \tfrac{s^2}{2}\right)^2 + s^2\left(1 - \tfrac{s^2}{4}\right) = 1 - s^2 + \tfrac{s^4}{4} + s^2 - \tfrac{s^4}{4} = 1 .
$$
:::

With determinant 1 the eigenvalues multiply to 1, and they sit on the unit circle — no growth, no decay — exactly when the trace $2 - s^2$ lies between $-2$ and $2$, that is, when $h\omega < 2$. Above that leapfrog is unstable; below it the swing is kept for *every* $h$. For the 500 km orbit the limit is $h < 2/n = 1{,}807\,\mathrm{s}$, nearly a third of a lap.

## The shadow energy

Keeping area is not keeping energy: leapfrog does *not* conserve $\varepsilon$, but something slightly different. For the spring, look for a quantity $Q = v^2 + c\,x^2$ that the leapfrog matrix leaves unchanged. Substitute the update, require the $x_k v_k$ cross terms to cancel and the other coefficients to return, and a few lines of algebra give $c = \omega^2(1 - s^2/4)$. So

$$
\tilde{H} = \frac{v^2}{2} + \frac{\omega^2}{2}\left(1 - \frac{h^2\omega^2}{4}\right)x^2 = H - \frac{h^2\omega^4}{8}\,x^2
$$

is conserved *exactly* at every step for any $h\omega < 2$ ($\tilde{H}$ is read "H tilde"). It differs from the true energy $H = v^2/2 + \omega^2 x^2/2$ by an $h^2$ term that depends on where in the swing you are. So the true energy wobbles around the pinned $\tilde{H}$ by at most $h^2\omega^2 H/4$ and can never wander further. That is the whole mechanism in miniature. $\tilde{H}$ is the method's **shadow Hamiltonian** — a **[[Hamiltonian|hamiltonian]]** being energy written in terms of positions and momenta.

::: example The shadow energy, step by step
Take $\ddot x = -x$ ($\omega = 1$), $x_0 = 1$, $v_0 = 0$, and a coarse $h = 0.5$ — a twelfth of a swing per step. The true energy is $H = 0.5$; the shadow energy is $\tilde{H} = v^2/2 + (1 - 0.0625)x^2/2$, which at the start is $0.9375/2 = 0.46875$.

| step | $x$ | $v$ | $H = \tfrac12 v^2 + \tfrac12 x^2$ | $\tilde{H}$ |
| --- | --- | --- | --- | --- |
| 0 | 1.000000 | 0.000000 | 0.500000 | 0.468750000 |
| 1 | 0.875000 | $-0.468750$ | 0.492676 | 0.468750000 |
| 2 | 0.531250 | $-0.820312$ | 0.477570 | 0.468750000 |
| 3 | 0.054688 | $-0.966797$ | 0.468843 | 0.468750000 |
| 4 | $-0.435547$ | $-0.871582$ | 0.474678 | 0.468750000 |
| 5 | $-0.816895$ | $-0.558472$ | 0.489604 | 0.468750000 |

Step 1 by hand: kick $v = 0 - 0.25 \times 1 = -0.25$; drift $x = 1 + 0.5 \times (-0.25) = 0.875$; kick $v = -0.25 - 0.25 \times 0.875 = -0.46875$.

$H$ swings between $0.4688$ and $0.5000$ — 6% off at this absurd step — and comes back. $\tilde{H}$ holds to nine decimals, even a million steps later. The points do not spiral: they lie *exactly* on an **[[ellipse of a slightly different energy|shadow-ellipse]]**.
:::

For two-body gravity the shadow Hamiltonian is a series, $\tilde{H} = H + h^2 H_2 + h^4 H_4 + \cdots$, that does not converge. *Backward error analysis* proves a cut-off version is conserved to within errors exponentially small in $1/h$, for times exponentially long in $1/h$ — for any orbit you will run, forever.

::: key Why symplectic integrators matter
Symplectic integrators matter for long orbit propagation because they exactly conserve a nearby (shadow) Hamiltonian $\tilde{H} = H + O(h^2)$, so the energy error oscillates within a bound instead of drifting secularly — over thousands of revolutions that is the difference between a bounded wobble and a spiral. Leapfrog (velocity Verlet, kick–drift–kick) is the simplest: second order, one force evaluation per step, time-reversible, stable for $h\omega < 2$. It also conserves angular momentum exactly for a central force, because kicks are along $\mathbf{r}$ and drifts along $\mathbf{v}$.
:::

## The two-body test: one lap, a hundred, a thousand

Now the real, nonlinear problem: the three integrators on the eccentric orbit, all at $h = 60\,\mathrm{s}$, sampled eight times through the first lap ($r$ is the radius at the sample):

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

Read each column as a shape.

- **Euler** climbs from the first step and never comes down.
- **RK4** grows toward apogee and shrinks toward perigee but does not return to zero: it ends the lap at $-1.27 \times 10^{-7}$ and the next at $-2.53 \times 10^{-7}$.
- **Leapfrog** is by far the largest at apogee — $5.9 \times 10^{-4}$, thousands of times RK4's, as a second-order method deserves — and then comes *back*, to $3.5 \times 10^{-5}$ near perigee. Its error depends on *where the vehicle is*, not *how long it has run*: the shadow Hamiltonian at work.

Now the range of $\delta\varepsilon$ within each lap, for laps 1 to 100:

| lap | Euler | RK4 | leapfrog |
| --- | --- | --- | --- |
| 1 | $+0.012$ to $+0.296$ | $-1.89 \times 10^{-7}$ to $-0.05 \times 10^{-7}$ | $+2.3 \times 10^{-7}$ to $+5.90 \times 10^{-4}$ |
| 2 | $+0.297$ to $+0.484$ | $-3.16 \times 10^{-7}$ to $-1.31 \times 10^{-7}$ | $+8.4 \times 10^{-7}$ to $+5.90 \times 10^{-4}$ |
| 10 | $+0.671$ to $+0.698$ | $-1.34 \times 10^{-6}$ to $-1.15 \times 10^{-6}$ | $+0.2 \times 10^{-7}$ to $+5.90 \times 10^{-4}$ |
| 50 | $+0.851$ to $+0.852$ | $-6.44 \times 10^{-6}$ to $-6.25 \times 10^{-6}$ | $+0.2 \times 10^{-7}$ to $+5.90 \times 10^{-4}$ |
| 100 | $+0.893$ to $+0.893$ | $-1.28 \times 10^{-5}$ to $-1.26 \times 10^{-5}$ | $+0.4 \times 10^{-7}$ to $+5.90 \times 10^{-4}$ |

RK4's band is narrow and *moves*: its center is $-1.27 \times 10^{-7}$ times the lap number. Leapfrog's band is wide and *stays put*: top $5.90 \times 10^{-4}$ in lap 1 and in lap 100, bottom below $10^{-6}$ throughout. (The perigee radius implied by leapfrog's $\varepsilon$ and $h$ swings by up to $8\,\mathrm{km}$ within each lap, over the same range in lap 100 as in lap 1.) Euler has by lap 100 gained 89% of the binding energy; its growth slows only because a bigger orbit turns more slowly, so $hn$ shrinks.

**At equal cost.** Leapfrog at $h = 15\,\mathrm{s}$ uses one force evaluation per 15 s, like RK4 at $60\,\mathrm{s}$. Its band is then $0$ to $+3.68 \times 10^{-5}$ in laps 1, 10 and 100 — sixteen times narrower, as $h^2$ says, and still not moving. RK4's band passes $-3.7 \times 10^{-5}$ at about lap 290, and from then on the symplectic method has the smaller energy error, by a widening margin.

**On the circle**, over 1,000 laps at $h = 60\,\mathrm{s}$, RK4 drifts as computed earlier while leapfrog stays between 0 and $+4.8 \times 10^{-6}$ throughout.

**Angular momentum** is sharper still. A kick changes $\mathbf{v}$ along $\mathbf{r}$, and $\mathbf{r} \times (\mathbf{v} + \alpha\mathbf{r}) = \mathbf{r} \times \mathbf{v}$; a drift changes $\mathbf{r}$ along $\mathbf{v}$, and $(\mathbf{r} + \beta\mathbf{v}) \times \mathbf{v} = \mathbf{r} \times \mathbf{v}$. So leapfrog conserves $\mathbf{h}$ *exactly* for any central force; here the change is about $10^{-14}$, round-off. RK4's drifts at $-1.13 \times 10^{-7}$ per lap, half its energy drift; Euler's grows 24% per lap.

## Reading an energy plot

Put a plot of $\delta\varepsilon$ against time into every propagator you write, and read it like this.

- **A bounded wobble at the orbital period** with an envelope that does not move: a symplectic integrator working correctly. For leapfrog its size scales as $h^2$.
- **A slow, one-way, straight-line drift**: a Runge–Kutta or multistep integrator working correctly. The method sets the direction (RK4 loses energy), and the rate must scale as theory says — $h^5$ per lap for RK4, so halving the step divides it by about 32. *That scaling test is the diagnostic.* If the drift halves or stays put, it is *not* truncation error.
- **A drift that fails the scaling test** is a bug: a force evaluated at the wrong time, so RK4's stages are inconsistent and the method has quietly dropped order; position in one frame and velocity in another; a force with the wrong sign, or one that should not be there; a $\mu$ or unit that differs between force model and energy check.
- **A physical drift** can be real. Drag removes energy at the rate $\dot\varepsilon = \mathbf{a}_{\text{drag}}\cdot\mathbf{v}$. Earth's $J_2$ bulge term keeps $\varepsilon$ (its potential does not change with time) but keeps only the $z$-component $h_z$ of $\mathbf{h}$, so the orbit plane swings. A third body or a rotating frame breaks $\varepsilon$ altogether, and you check the **[[Jacobi constant|jacobi]]** instead. Know which invariant your force model keeps before you blame the integrator.

::: example Diagnosing a drift from two runs
A colleague's RK4 propagator on the circular orbit shows $\delta\varepsilon = -3.0 \times 10^{-6}$ after one lap at $h = 60\,\mathrm{s}$, and $-1.5 \times 10^{-6}$ at $30\,\mathrm{s}$.

**Size.** Correct RK4 at $60\,\mathrm{s}$ gives $-2.27 \times 10^{-7}$ per lap. The observed value is $3.0/0.227 = 13$ times larger.

**Scaling.** Halving the step should divide the drift by $2^5 = 32$. It divided it by $3.0/1.5 = 2$. That is first order.

**Shape and sign.** A smooth drift with the right sign: the force is not grossly wrong.

**Verdict.** A first-order error from a fourth-order method means the stages are fed inconsistently: an acceleration computed from a stale position, or one state component updated out of order. Check the derivative function called inside the stepper, not the coefficients. The halving test on $\dot y = -y$ would pass, because that problem has no position–velocity structure to get out of step.
:::

::: warning Bounded energy is not a correct orbit
Leapfrog at $h = 60\,\mathrm{s}$ holds $\delta\varepsilon$ inside $6 \times 10^{-4}$ forever, but its lap takes about 0.15% too long, so its *phase* error — where the vehicle is along the orbit — grows steadily. On the circle it lags $63\,\mathrm{km}$ after one lap, $634\,\mathrm{km}$ after ten, about $6{,}340\,\mathrm{km}$ of arc after a hundred; at $15\,\mathrm{s}$, 16 times less ($4.0\,\mathrm{km}$ per lap), as $h^2$ requires. RK4 at $60\,\mathrm{s}$ is $27\,\mathrm{m}$ off after one lap, but its drift shortens the period a little more each lap, so its along-track error grows as time *squared*: $0.92\,\mathrm{km}$ at ten laps, $75\,\mathrm{km}$ at a hundred. Bounded energy buys the orbit's *shape and size*, not the vehicle's place along it. Energy is a necessary check, never a sufficient one; anything you fly still needs comparing against an independent high-accuracy reference.
:::

::: warning Compare like with like
Leapfrog's energy error on an ellipse legitimately swings through four orders of magnitude within one lap. Sampled at fixed clock times, while the computed period slips against the clock, it wanders slowly and looks like drift. Plot each lap's minimum and maximum instead: a drifting integrator moves both; a wobbling one moves neither.
:::

## Choosing an integrator for the job

Symplectic methods come with conditions. The system must be **conservative** (Hamiltonian) — no drag, no thrust. The step must be **fixed**: change $h$ and the shadow Hamiltonian changes with it, and the bound is lost. And second-order leapfrog is the demonstration, not the production tool — its phase error is tens of kilometers per lap.

Long-arc work uses higher-order relatives such as **[[Yoshida's compositions|yoshida]]**, built from leapfrog steps, which keep the bounded energy and shrink the phase error. Planetary scientists also handle the Kepler motion exactly and apply only the perturbations as kicks. The satellite catalog instead uses a high-order *multistep* method, which drifts, but slowly — the next lesson.

For one lap, a rendezvous, a burn, or anything with thrust or drag, adaptive Dormand–Prince or fixed RK4 is right, and the energy check still catches bugs. So ask: how many periods long is the run, is the system conservative, is the step fixed? "Many", "yes" and "yes" means symplectic.

## Check yourself

::: check
Backward Euler on the circular orbit at $h = 60\,\mathrm{s}$: inward or outward, and by what factor does the swing change per step?
:::

::: answer
Inward. Backward Euler's factor is $1/(1 - h\lambda)$; for $\lambda = in$ its squared size is $1/(1 + h^2 n^2) < 1$. With $\theta = hn = 0.0664$ the energy factor per step is $1/1.00441 = 0.99561$, and the swing factor is its square root, $0.99780$ — 0.22% lost per step. Over a lap of 94.6 steps the energy falls to $0.99561^{94.6} = 0.66$ of its size.
:::

::: check
Explicit Euler at $h = 10\,\mathrm{s}$ on the circular orbit: predict the energy gain per lap from the spring model, and the laps until it predicts a doubling.
:::

::: answer
$\theta = hn = 10 \times 1.1068 \times 10^{-3} = 0.011068$, so the factor per step is $1 + \theta^2 = 1.0001225$. A lap is $5{,}677/10 = 567.7$ steps, so per lap $1.0001225^{567.7} = 1.072$, a 7.2% gain. Doubling needs $\ln 2/\ln 1.072 = 10$ laps. At $60\,\mathrm{s}$ it was 52% per lap: the gain scales as $\theta^2 \times (T/h) \propto h$ — first order, never zero.
:::

::: check
Leapfrog on the eccentric orbit at $h = 60\,\mathrm{s}$ has an energy band of $0$ to $+5.90 \times 10^{-4}$. Predict the band at $h = 20\,\mathrm{s}$, and the step that would match RK4's first-lap error of about $1.9 \times 10^{-7}$ at $60\,\mathrm{s}$. Why is lap 1 the wrong place to compare for a 1,000-lap run?
:::

::: answer
The band scales as $h^2$. Dividing $h$ by 3 shrinks it by 9, to about $5.90 \times 10^{-4}/9 = 6.6 \times 10^{-5}$ (the measured $15\,\mathrm{s}$ band fits too: $5.90 \times 10^{-4}/16 = 3.69 \times 10^{-5}$). To reach $1.9 \times 10^{-7}$ needs $h = 60\sqrt{1.9 \times 10^{-7}/5.9 \times 10^{-4}} = 1.1\,\mathrm{s}$.

Lap 1 is the wrong place to compare because RK4's error is secular: by lap 1,000 it is about $1.3 \times 10^{-4}$, while leapfrog at $15\,\mathrm{s}$ — the same cost — is still within $3.7 \times 10^{-5}$, about three and a half times smaller. Compare at the end of the run.
:::

::: check
Why does leapfrog conserve angular momentum exactly for a central force? Does the same argument work for RK4?
:::

::: answer
Each leapfrog sub-step changes one of $\mathbf{r}$, $\mathbf{v}$ by a multiple of the other: a kick adds $\alpha\mathbf{r}$ to $\mathbf{v}$ (a central force points along $\mathbf{r}$), a drift adds $\beta\mathbf{v}$ to $\mathbf{r}$. Since $\mathbf{r} \times \mathbf{r} = \mathbf{v} \times \mathbf{v} = 0$, neither changes $\mathbf{r} \times \mathbf{v}$, at any $h$.

RK4 does not split this way. It adds a weighted sum of accelerations taken at four *different* trial positions, none parallel to the final $\mathbf{r}$, so the cross product changes: $-1.1 \times 10^{-7}$ per lap at $60\,\mathrm{s}$, against leapfrog's $10^{-14}$.
:::

::: check
You add drag to a leapfrog propagator and the energy drifts steadily down. A colleague says the symplectic property is broken, so switch to RK4. What is right and wrong in that?
:::

::: answer
Right: drag is not conservative, so the system is not Hamiltonian and leapfrog's bounded-energy guarantee no longer applies.

Wrong: nothing is broken. Drag *removes* energy; $\dot\varepsilon = \mathbf{a}_{\text{drag}} \cdot \mathbf{v} < 0$ is the physics. Compute the expected loss from the drag model and compare; what is left over is integration error.

Switching depends on the arc: long with weak drag, leapfrog for gravity with careful drag handling is still common; short or strong drag, adaptive RK45 fits.
:::

## Summary

| Item | Statement |
| --- | --- |
| Invariants | $\varepsilon = v^2/2 - \mu/r = -\mu/(2a)$ and $\mathbf{h} = \mathbf{r} \times \mathbf{v}$; log both every step |
| Euler on $\lambda = \pm i\omega$ | $\lvert 1 + h\lambda\rvert = \sqrt{1 + h^2\omega^2} > 1$: energy added every step, outward spiral, secular; 500 km orbit at $h = 60\,\mathrm{s}$: $\delta\varepsilon = +0.36$ after one lap |
| Implicit Euler | $1/\lvert 1 - h\lambda\rvert < 1$: inward spiral |
| RK4 | $\lvert R(i\theta)\rvert^2 = 1 - \theta^6/72 + \cdots$: slow inward drift, $-2.27 \times 10^{-7}$ per lap at $h = 60\,\mathrm{s}$, linear in time, scaling as $h^5$ |
| Leapfrog | $\mathbf{v}_{+1/2} = \mathbf{v} + \tfrac{h}{2}\mathbf{a}(\mathbf{r})$; $\mathbf{r}' = \mathbf{r} + h\mathbf{v}_{+1/2}$; $\mathbf{v}' = \mathbf{v}_{+1/2} + \tfrac{h}{2}\mathbf{a}(\mathbf{r}')$; order 2; one force evaluation; $\det = 1$; stable for $h\omega < 2$ |
| Shadow Hamiltonian | Leapfrog exactly conserves $\tilde{H} = H + O(h^2)$ (spring: $\tilde{H} = \tfrac12 v^2 + \tfrac12\omega^2(1 - h^2\omega^2/4)x^2$); energy error bounded and oscillating |
| Signatures | Narrow band drifting linearly: Runge–Kutta. Wide fixed band: symplectic. Fails the $h$-scaling test: a bug |
| Scaling test | RK4 drift per lap $\propto h^5$ (halve $h$: divide by 32); leapfrog band $\propto h^2$ (halve $h$: divide by 4) |
| Angular momentum | Leapfrog conserves $\mathbf{h}$ exactly for central forces; RK4 drifts it at half the energy rate |
| Choice | Long, conservative, fixed step: symplectic. Short, thrust or drag: RK4 or RK45, energy check as monitor |

The next lesson returns to the general problem and asks how to get RK4's accuracy at leapfrog's price. The Adams–Bashforth and Adams–Moulton multistep methods reuse derivatives already computed at earlier steps, so a fourth-order step costs one evaluation instead of four.

::: context euler-tangent Stepping off the circle
Euler moves the vehicle along its current velocity, which points along the tangent. A tangent touches the circle at one point and lies outside it everywhere else, so the new point is always a bit farther out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <path d="M83.6,85.1 A150,150 0 0,1 276.4,85.1" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="200" x2="180" y2="50" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="200" x2="255" y2="50" stroke="#b4232c" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="180" y1="50" x2="251" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="257,50 247,45 247,55" fill="#1f2a44"/>
  <circle cx="180" cy="50" r="4" fill="#1d6fd1"/>
  <circle cx="255" cy="50" r="4" fill="#b4232c"/>
  <text x="172" y="40" font-size="11" text-anchor="end" fill="#1d6fd1">start, radius r</text>
  <text x="262" y="60" font-size="11" fill="#b4232c">after one step</text>
  <text x="218" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">Euler step</text>
  <text x="252" y="130" font-size="11" fill="#b4232c">r × √(1 + θ²)</text>
  <text x="96" y="130" font-size="11" fill="#1d6fd1">true orbit</text>
  <text x="20" y="168" font-size="11" fill="#6c7a93">θ = 0.5 rad, exaggerated</text>
</svg>
```

Each step grows the radius by the factor $\sqrt{1 + \theta^2}$ — the same number as Euler's amplification factor.
:::

::: context secular Why "secular"
The word comes from the Latin *saeculum*, "an age" or "a century". Astronomers used it for changes in a planet's orbit so slow that they show only over centuries, as opposed to *periodic* changes that come and go every orbit. In numerical work it keeps that meaning: a secular error builds up steadily with time, while a periodic one keeps returning to where it started.
:::

::: context verlet Many names, one method
The method has been discovered several times. The Norwegian mathematician Carl Størmer used it in the early 1900s to trace charged particles spiraling into the aurora. The French physicist Loup Verlet made it famous in 1967 for simulating the motion of molecules in a liquid, where many thousands of steps must not slowly heat or cool the fluid. Game physics engines still use versions of it today for the same reason: it stays well-behaved over very long runs.
:::

::: context reversible Playing the movie backwards
Film a frictionless pendulum and play the film backwards: it still looks like a real pendulum. The laws of motion work the same forwards and backwards in time. Leapfrog keeps that property — take a step with $+h$, then one with $-h$, and you land exactly where you began. RK4 does not: forward then backward leaves a tiny error. Methods that respect the symmetry tend to avoid building up one-way drift.
:::

::: context phase-area A patch of starting states
Take a small square of starting states near $x = 1$, $v = 0$ on the spring $\ddot x = -x$ and push every corner through three steps with $h = 0.5$. Euler's patch grows by $1 + s^2 = 1.25$ each step (area $0.16 \to 0.31$). Leapfrog's patch is sheared but keeps area $0.16$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <circle cx="92" cy="100" r="58" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="272" cy="100" r="58" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polygon points="138.4,111.6 161.6,111.6 161.6,88.4 138.4,88.4" fill="#8fb8f0" stroke="#1f2a44"/>
  <polygon points="132.6,134.8 155.8,146.4 167.4,123.2 144.2,111.6" fill="none" stroke="#b4232c"/>
  <polygon points="115.2,155.1 132.6,178.3 155.8,160.9 138.4,137.7" fill="none" stroke="#b4232c"/>
  <polygon points="87.6,166.7 93.4,198.6 125.3,192.8 119.5,160.9" fill="#f2b880" stroke="#b4232c"/>
  <polygon points="318.4,111.6 341.6,111.6 341.6,88.4 318.4,88.4" fill="#8fb8f0" stroke="#1f2a44"/>
  <polygon points="306.8,131.9 327.1,142.8 338.7,122.5 318.4,111.6" fill="none" stroke="#1d6fd1"/>
  <polygon points="286.5,144.2 298.8,163.3 319.1,150.9 306.8,131.9" fill="none" stroke="#1d6fd1"/>
  <polygon points="262.6,145.5 263.8,167.9 287.8,166.7 286.5,144.2" fill="#8fb8f0" stroke="#1d6fd1"/>
  <text x="92" y="20" font-size="12" text-anchor="middle" fill="#b4232c">Euler: area grows</text>
  <text x="272" y="20" font-size="12" text-anchor="middle" fill="#1d6fd1">leapfrog: area kept</text>
  <text x="92" y="36" font-size="11" text-anchor="middle" fill="#1f2a44">0.16 → 0.31</text>
  <text x="272" y="36" font-size="11" text-anchor="middle" fill="#1f2a44">0.16 → 0.16</text>
</svg>
```

The dashed circles are the true path of the state $(x, v)$, which turns without stretching.
:::

::: context hamiltonian What a Hamiltonian is
In the 1830s the Irish mathematician William Rowan Hamilton rewrote mechanics around one function: the total energy, written in terms of positions and momenta. From that single function every equation of motion follows. For a spring it is $H = \tfrac12 v^2 + \tfrac12\omega^2 x^2$ (per unit mass). A system whose motion comes from such a function, with no friction, is called *Hamiltonian*. Orbits under gravity alone are Hamiltonian; orbits with drag or thrust are not.
:::

::: context shadow-ellipse The shadow orbit in the phase plane
The true motion of $\ddot x = -x$ stays on the circle $x^2 + v^2 = 1$ (grey). Leapfrog with $h = 0.5$ puts its points (red) on the ellipse $v^2 + 0.9375\,x^2 = 0.9375$ (blue) — slightly squashed — and keeps them there forever.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="80" y1="105" x2="290" y2="105" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="10" x2="180" y2="200" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="180" cy="105" r="85" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 3"/>
  <ellipse cx="180" cy="105" rx="85" ry="82.3" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g fill="#b4232c">
    <circle cx="265.0" cy="105.0" r="3.5"/><circle cx="254.4" cy="144.8" r="3.5"/><circle cx="225.2" cy="174.7" r="3.5"/>
    <circle cx="184.6" cy="187.2" r="3.5"/><circle cx="143.0" cy="179.1" r="3.5"/><circle cx="110.6" cy="152.5" r="3.5"/>
    <circle cx="95.5" cy="114.0" r="3.5"/><circle cx="101.6" cy="73.3" r="3.5"/><circle cx="127.2" cy="40.5" r="3.5"/>
    <circle cx="166.1" cy="23.8" r="3.5"/><circle cx="208.4" cy="27.4" r="3.5"/><circle cx="243.7" cy="50.5" r="3.5"/>
  </g>
  <text x="294" y="109" font-size="12" fill="#1f2a44">x</text>
  <text x="186" y="16" font-size="12" fill="#1f2a44">v</text>
  <text x="270" y="100" font-size="11" fill="#b4232c">start</text>
  <text x="20" y="200" font-size="11" fill="#1f2a44">12 steps = about one swing</text>
</svg>
```

The squash is the $h^2$ term: at $x = \pm 1$ the ellipse reaches $v = 0$ with the same $x$ as the circle, but at $x = 0$ its $|v|$ is $0.968$ instead of $1$.
:::

::: context jacobi The Jacobi constant
In the "restricted three-body problem" — a spacecraft moving under the pull of the Earth and the Moon, which circle each other — energy measured from a fixed frame is not constant, because the Moon keeps moving. But in a frame that rotates with the Earth–Moon line, one combination of energy and angular momentum is: the Jacobi constant, found by Carl Gustav Jacobi in the 1830s. Mission designers for lunar and Lagrange-point orbits use it exactly as you use $\varepsilon$ here.
:::

::: context yoshida Building a fourth-order step from leapfrogs
In 1990 the Japanese astronomer Haruo Yoshida showed how to chain three leapfrog steps of carefully chosen lengths — $w_1 h$, $w_0 h$, $w_1 h$ with $w_1 = 1/(2 - 2^{1/3}) \approx 1.351$ and $w_0 = 1 - 2w_1 \approx -1.702$ — into one fourth-order step. The middle one runs *backwards* in time. Each piece is symplectic, and a chain of symplectic steps is symplectic, so the result keeps bounded energy while its errors shrink as $h^4$.
:::
