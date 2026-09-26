---
id: l11-universal-variables
title: Universal variables and the Stumpff functions
minutes: 20
covers:
  - universal variables and the Stumpff functions
---

Imagine owning three different rulers: one for things shorter than a metre, one for things longer, and a special one for things exactly a metre long. Every time you measure, you first have to guess which ruler to grab. And for anything *close* to a metre, both of the ordinary rulers get wobbly right at their ends. You would much rather have one ruler that works for everything.

That is where the last few lessons left you. You solved the time problem three times: with the eccentric anomaly $E$ for the ellipse, the hyperbolic anomaly $H$ for the hyperbola, and $\tan(\nu/2)$ for the parabola. A propagator built that way has three code paths, a branch on the eccentricity, and a **seam** at $e = 1$ where the formulas on both sides lose precision. A spacecraft on a barely-bound **[[lunar free-return|free-return]]** trajectory, a comet with $e = 0.9999$, or a trajectory optimizer that sweeps smoothly from elliptic to hyperbolic candidates lands on that seam constantly.

The **universal-variable** formulation removes the seam. It uses one new variable, the **universal anomaly** $\chi$ (the Greek letter "chi", said "kye"). On an ellipse it turns out to be $\sqrt{a}\,\Delta E$; on a hyperbola, $\sqrt{-a}\,\Delta H$; on a parabola, $\sqrt{p}\,\Delta\tan(\nu/2)$. One equation ties it to time for all three. The cosines, hyperbolic cosines and polynomials of the three cases get folded into two functions of a single number, the **Stumpff functions** $C(z)$ and $S(z)$. The *sign* of that number does the branching for you. This is how Bate, Mueller and White teach propagation, how Battin builds his theory, and how much production code works.

The plan: define $\chi$, meet $C$ and $S$, find a surprisingly simple equation for the radius, integrate it into the **universal Kepler equation**, and solve that equation with the same code for an ellipse, a hyperbola and a parabola. The next lesson uses $\chi$ to write down the new position and velocity directly.

## The universal anomaly

### A clock that runs fast near the planet

Start from a state — position $\mathbf{r}_0$ and velocity $\mathbf{v}_0$ — at time $t_0$. Define $\chi$ by how fast it grows:

$$
\frac{d\chi}{dt} = \frac{\sqrt{\mu}}{r}, \qquad \chi(t_0) = 0 .
$$

Read it as: $\chi$ ticks fast when the spacecraft is close (small $r$) and slowly when it is far (large $r$). That is the exact opposite of how the spacecraft's *angle* behaves in time, and it evens the motion out. Changing the clock like this is called the **Sundman transformation**. Because $\sqrt{\mu}$ has units $\mathrm{km^{3/2}/s}$ and $r$ is in km, $\chi$ comes out in **[[square-root kilometres|sqrt-km]]**, $\sqrt{\mathrm{km}}$.

### It is the anomalies you already know

To see what $\chi$ really is, compare it with the old anomalies.

**Ellipse.** From the anomalies lesson, Kepler's equation in small steps reads $n\,dt = (1 - e\cos E)\,dE = (r/a)\,dE$. Solve for $dE/dt$ and put in $n = \sqrt{\mu/a^3}$:

$$
\frac{dE}{dt} = \frac{n a}{r} = \sqrt{\frac{\mu}{a^3}}\,\frac{a}{r} = \frac{\sqrt{\mu}}{\sqrt{a}\,r}
\quad\Longrightarrow\quad
\sqrt{a}\,dE = \frac{\sqrt{\mu}}{r}\,dt = d\chi .
$$

Add up both sides from the start: $\chi = \sqrt{a}\,(E - E_0)$.

**Hyperbola.** The same steps with $r = a(1 - e\cosh H)$ give $\chi = \sqrt{-a}\,(H - H_0)$. (Here $a < 0$, so $-a$ is positive and the square root is real.)

**Parabola.** Use $\tau = \tan(\nu/2)$ ("tau"). Angular momentum gives $h\,dt = r^2\,d\nu$. And $d\tau = \tfrac{1}{2}\sec^2(\nu/2)\,d\nu = (r/p)\,d\nu$, because on a parabola $r = p/(1 + \cos\nu)$ and $\tfrac{1}{2}\sec^2(\nu/2) = 1/(1 + \cos\nu)$. Put those together: $d\tau/dt = h/(pr) = \sqrt{\mu}/(\sqrt{p}\,r)$, using $h = \sqrt{\mu p}$. So $\chi = \sqrt{p}\,(\tau - \tau_0)$.

One variable, three old friends.

### Two helpers: α and z

Two more quantities travel with $\chi$. The first is the **reciprocal semi-major axis**, $\alpha$ ("alpha"), which comes straight from vis-viva:

$$
\alpha = \frac{1}{a} = \frac{2}{r_0} - \frac{v_0^2}{\mu} .
$$

It is positive for an ellipse, zero for a parabola and negative for a hyperbola. Unlike $a$, which shoots off to infinity at the parabola, $\alpha$ passes smoothly through zero. That is exactly the property we want.

The second is

$$
z = \alpha\chi^2 ,
$$

a pure number with no units. On an ellipse $z = (\Delta E)^2$; on a hyperbola $z = -(\Delta H)^2$; on a parabola $z = 0$. **The sign of $z$ is the conic type.**

## The Stumpff functions

### Definition

For any real number $z$, define

$$
C(z) =
\begin{cases}
\dfrac{1 - \cos\sqrt{z}}{z} & z > 0 \\[6pt]
\dfrac{\cosh\sqrt{-z} - 1}{-z} & z < 0 \\[6pt]
\dfrac{1}{2} & z = 0
\end{cases}
\qquad
S(z) =
\begin{cases}
\dfrac{\sqrt{z} - \sin\sqrt{z}}{(\sqrt{z})^3} & z > 0 \\[6pt]
\dfrac{\sinh\sqrt{-z} - \sqrt{-z}}{(\sqrt{-z})^3} & z < 0 \\[6pt]
\dfrac{1}{6} & z = 0 .
\end{cases}
$$

The three branches look like three different functions. They are not. Each of $C$ and $S$ is **[[one smooth curve|stumpff-shape]]** that has been written three ways.

### Why the branches are one function

Write the cosine and sine as **[[power series|power-series]]** — endless sums of powers — and divide:

$$
C(z) = \frac{1}{2!} - \frac{z}{4!} + \frac{z^2}{6!} - \cdots = \sum_{k=0}^{\infty}\frac{(-z)^k}{(2k + 2)!}, \qquad
S(z) = \frac{1}{3!} - \frac{z}{5!} + \frac{z^2}{7!} - \cdots = \sum_{k=0}^{\infty}\frac{(-z)^k}{(2k + 3)!}.
$$

(The "!" is factorial: $4! = 4 \times 3 \times 2 \times 1 = 24$.) These sums work for *every* $z$, positive or negative. For negative $z$ they reproduce the hyperbolic branch automatically, because $\cosh x = \cos(ix)$. And at $z = 0$ only the first terms survive: $C(0) = \tfrac{1}{2}$ and $S(0) = \tfrac{1}{6}$. So the functions are smooth straight through $z = 0$. That is the whole point: the parabola is not a special case, only the value in the middle.

### Identities you will use

Two identities restate the definitions in the form the derivations need:

$$
\cos\sqrt{z} = 1 - z\,C(z), \qquad \sin\sqrt{z} = \sqrt{z}\,\big(1 - z\,S(z)\big),
$$

with $\cosh$ and $\sinh$ of $\sqrt{-z}$ in the hyperbolic case. And two derivative identities, which you can prove term by term from the series:

$$
\frac{dS}{dz} = \frac{C - 3S}{2z}, \qquad \frac{dC}{dz} = \frac{1 - zS - 2C}{2z}.
$$

::: note Why the first derivative identity has to be true
Differentiate the series for $S$ and multiply by $2z$: $2z\,S'(z) = 2\sum_{k\ge 1} k(-z)^k/(2k + 3)!$.

Now build $C - 3S$ from the two series. Since $1/(2k + 2)! = (2k + 3)/(2k + 3)!$,

$$
C - 3S = \sum_k (-z)^k\left[\frac{2k + 3}{(2k + 3)!} - \frac{3}{(2k + 3)!}\right] = \sum_k \frac{2k\,(-z)^k}{(2k + 3)!}.
$$

The two sums are the same (the $k = 0$ term is zero in both), so $2z\,S' = C - 3S$. The second identity follows the same way.
:::

Their real use is in three consequences, which you can check with the chain rule and $z = \alpha\chi^2$ (so $dz/d\chi = 2\alpha\chi$):

$$
\frac{d}{d\chi}\big[\chi^3 S(z)\big] = \chi^2 C(z), \qquad
\frac{d}{d\chi}\big[\chi^2 C(z)\big] = \chi\,\big(1 - z\,S(z)\big), \qquad
\frac{d}{d\chi}\big[\chi\,(1 - zS(z))\big] = 1 - z\,C(z).
$$

Each one says "the derivative of this block is the next block down". Soon you will integrate a sum of these blocks, and these three lines will do all the work.

### A trap near zero

The formula $(1 - \cos\sqrt{z})/z$ is exact on paper, but on a computer it falls into **[[catastrophic cancellation|cancellation]]** when $z$ is small: it subtracts two numbers that agree in almost every digit, and the digits that agreed are lost.

::: warning Catastrophic cancellation near z = 0
For small positive $z$, $1 - \cos\sqrt{z}$ subtracts two nearly equal numbers. At $z = 10^{-8}$ the direct formula gives $C = 0.499\,999\,996\,96$ against the true $0.499\,999\,999\,58$ — a relative error of $5 \times 10^{-9}$, millions of times worse than double precision. At $z = 10^{-10}$ the error is $8 \times 10^{-8}$. Use the series ($\tfrac{1}{2} - z/24 + z^2/720$ and $\tfrac{1}{6} - z/120 + z^2/5040$) whenever $\lvert z \rvert$ is below about $10^{-6}$; three terms are then accurate to better than $10^{-18}$. Near-parabolic orbits live exactly here.
:::

## The radial equation in the universal anomaly

Now the payoff. We will find how the radius $r$ changes as $\chi$ grows, and it will turn out to be one of the simplest equations in physics.

Write a prime for "derivative with respect to $\chi$", so $r' = dr/d\chi$. Because $d\chi/dt = \sqrt{\mu}/r$, any time derivative converts as

$$
\frac{d}{dt} = \frac{\sqrt{\mu}}{r}\,\frac{d}{d\chi} .
$$

Define a helper quantity,

$$
\sigma = \frac{\mathbf{r} \cdot \mathbf{v}}{\sqrt{\mu}},
$$

("sigma"), which has units of $\sqrt{\mathrm{km}}$ like $\chi$. It measures how fast the spacecraft is moving outward.

**First derivative.** The rate of change of the radius is $\dot{r} = \mathbf{r} \cdot \mathbf{v}/r$. So

$$
r' = \frac{r}{\sqrt{\mu}}\,\dot{r} = \frac{r}{\sqrt{\mu}}\,\frac{\mathbf{r} \cdot \mathbf{v}}{r} = \sigma .
$$

**Second derivative.** Differentiate $\sigma$ the same way. The derivative of $\mathbf{r} \cdot \mathbf{v}$ is $\mathbf{v} \cdot \mathbf{v} + \mathbf{r} \cdot \ddot{\mathbf{r}}$, and gravity gives $\mathbf{r} \cdot \ddot{\mathbf{r}} = -\mu/r$:

$$
\sigma' = \frac{r}{\sqrt{\mu}}\,\frac{d}{dt}\frac{\mathbf{r} \cdot \mathbf{v}}{\sqrt{\mu}} = \frac{r}{\mu}\left(\mathbf{v} \cdot \mathbf{v} + \mathbf{r} \cdot \ddot{\mathbf{r}}\right) = \frac{r}{\mu}\left(v^2 - \frac{\mu}{r}\right) = \frac{r v^2}{\mu} - 1 .
$$

**Use vis-viva.** $v^2 = \mu(2/r - \alpha)$, so $rv^2/\mu = 2 - \alpha r$, and $\sigma' = 1 - \alpha r$. Since $r'' = \sigma'$:

$$
r'' + \alpha\,r = 1 .
$$

Stop and look at that. The two-body equation, with its awkward $1/r^2$, has turned into a **[[linear oscillator|oscillator-picture]]** — the same equation as a weight bouncing on a spring, with constant coefficients. That is what the Sundman transformation buys.

### Solving it

For $\alpha > 0$ the solution is a steady middle value plus a wave:

$$
r = \frac{1}{\alpha} + A\cos(\sqrt{\alpha}\,\chi) + B\sin(\sqrt{\alpha}\,\chi).
$$

The starting values $r(0) = r_0$ and $r'(0) = \sigma_0$ fix the two constants: $A = r_0 - 1/\alpha$ and $B = \sigma_0/\sqrt{\alpha}$.

Now write $\sqrt{\alpha}\,\chi = \sqrt{z}$ and swap in the Stumpff identities $\cos\sqrt{z} = 1 - zC$ and $\sin\sqrt{z} = \sqrt{z}(1 - zS)$:

$$
r = \frac{1}{\alpha} + \left(r_0 - \frac{1}{\alpha}\right)(1 - zC) + \frac{\sigma_0}{\sqrt{\alpha}}\sqrt{z}\,(1 - zS) .
$$

Multiply out. Since $z/\alpha = \chi^2$ and $\sqrt{z}/\sqrt{\alpha} = \chi$, the two lone $1/\alpha$ terms cancel, and what is left is

$$
r(\chi) = \chi^2\,C(z) + \sigma_0\,\chi\,\big(1 - z\,S(z)\big) + r_0\,\big(1 - z\,C(z)\big).
$$

Every $\alpha$ has vanished into $z$. So this one formula is valid for $\alpha < 0$ too (the derivation would use $\cosh$ and $\sinh$ and reach the same Stumpff form), and for $\alpha = 0$, where $r'' = 1$ integrates to $r = r_0 + \sigma_0\chi + \chi^2/2$ — which is the formula with $C = \tfrac{1}{2}$, $S = \tfrac{1}{6}$, $z = 0$.

## The universal Kepler equation

Time comes from the definition of $\chi$ turned around: $\sqrt{\mu}\,dt = r\,d\chi$. So add up $r$ over $\chi$:

$$
\sqrt{\mu}\,\Delta t = \int_0^{\chi} r\,d\chi .
$$

Integrate $r(\chi)$ one block at a time, using the three "next block down" identities in reverse:

- $\int \chi^2 C\,d\chi = \chi^3 S$;
- $\int \chi(1 - zS)\,d\chi = \chi^2 C$;
- $\int (1 - zC)\,d\chi = \chi - \alpha\int\chi^2 C\,d\chi = \chi - \alpha\chi^3 S$.

So

$$
\sqrt{\mu}\,\Delta t = \chi^3 S(z) + \sigma_0\,\chi^2 C(z) + r_0\,\big[\chi - \alpha\chi^3 S(z)\big].
$$

Collect the $\chi^3 S$ terms and move everything to one side:

$$
F(\chi) \equiv \sigma_0\,\chi^2 C(z) + (1 - \alpha r_0)\,\chi^3 S(z) + r_0\,\chi - \sqrt{\mu}\,\Delta t = 0, \qquad z = \alpha\chi^2 .
$$

This is the **universal Kepler equation**. Feed it the starting state (through $r_0$, $\sigma_0$ and $\alpha$) and a time step, and it pins down $\chi$ for any conic.

### Solving it with Newton's method

The derivative of $F$ is, by construction, the thing we integrated: $F'(\chi) = r(\chi)$, the radius at the new time. So **[[Newton's method|newton-safe]]** is

$$
\chi_{k+1} = \chi_k - \frac{F(\chi_k)}{r(\chi_k)}, \qquad r(\chi_k) = \sigma_0\,\chi_k\,(1 - z_k S_k) + (1 - \alpha r_0)\,\chi_k^2 C_k + r_0 .
$$

(That $r$ is the same as $r(\chi)$ above, with the terms rearranged.)

Because $F' = r > 0$ always, $F$ only ever goes up, so the root is unique.

A serviceable starting guess is

$$
\chi_0 = \sqrt{\mu}\,\lvert\alpha\rvert\,\Delta t .
$$

On a circular orbit $\chi = \sqrt{a}\,n\,\Delta t = \sqrt{\mu}\,\alpha\,\Delta t$ exactly, so the guess is exact for circles and close for low eccentricity. For a parabola it gives $\chi_0 = 0$, which is harmless: $F'(0) = r_0 \ne 0$, and the first step lands at $\sqrt{\mu}\,\Delta t/r_0$.

::: key Universal variables
$\chi$ is defined by $d\chi/dt = \sqrt{\mu}/r$; it equals $\sqrt{a}\,\Delta E$, $\sqrt{-a}\,\Delta H$ or $\sqrt{p}\,\Delta\tan(\nu/2)$. With $\alpha = 1/a = 2/r_0 - v_0^2/\mu$ and $z = \alpha\chi^2$, the universal Kepler equation is
$$
\frac{\mathbf{r}_0 \cdot \mathbf{v}_0}{\sqrt{\mu}}\,\chi^2 C(z) + (1 - \alpha r_0)\,\chi^3 S(z) + r_0\,\chi = \sqrt{\mu}\,\Delta t ,
$$
solved by Newton from $\chi_0 = \sqrt{\mu}\,\lvert\alpha\rvert\,\Delta t$ with $F'(\chi) = r$. $C(0) = \tfrac{1}{2}$, $S(0) = \tfrac{1}{6}$; use the series near $z = 0$.
:::

### It really is Kepler's equation

It is worth checking that nothing was lost along the way. On an ellipse, put in $\chi = \sqrt{a}\,\Delta E$. Then:

- $z = (\Delta E)^2$, $C = (1 - \cos\Delta E)/(\Delta E)^2$ and $S = (\Delta E - \sin\Delta E)/(\Delta E)^3$;
- $\sigma_0 = \mathbf{r}_0 \cdot \mathbf{v}_0/\sqrt{\mu} = \sqrt{a}\,e\sin E_0$ (differentiate $r = a(1 - e\cos E)$ with $\dot{E} = na/r$ to get $r\dot{r} = \sqrt{\mu a}\,e\sin E$);
- $1 - \alpha r_0 = 1 - r_0/a = e\cos E_0$.

Put these in and divide the whole equation by $\sqrt{a}$:

$$
a e\sin E_0\,(1 - \cos\Delta E) + a e\cos E_0\,(\Delta E - \sin\Delta E) + r_0\,\Delta E = \sqrt{\mu/a}\;\Delta t = a\,n\,\Delta t .
$$

The first two terms combine into $a e\big[\sin E_0 - \sin(E_0 + \Delta E)\big] + a e\,\Delta E\cos E_0$. With $r_0 = a(1 - e\cos E_0)$ the $\Delta E\cos E_0$ terms cancel, and dividing by $a$ leaves

$$
n\,\Delta t = \Delta E - e(\sin E - \sin E_0),
$$

which is Kepler's equation between two times. The universal equation *is* Kepler's equation, written so that it does not care which conic it is on.

## Three conics, one code path

::: example The ISS-like state, one hour ahead
**Start.** $\mathbf{r}_0 = (-2267.240, -3989.573, 5001.268)\,\mathrm{km}$ and $\mathbf{v}_0 = (5.0098, -5.4258, -2.0540)\,\mathrm{km/s}$. Their lengths are $r_0 = 6787.470\,\mathrm{km}$ and $v_0 = 7.66527\,\mathrm{km/s}$, and $\sqrt{\mu} = 631.348\,\mathrm{km^{3/2}/s}$.

**The three scalars.**

$$
\alpha = \frac{2}{6787.470} - \frac{7.66527^2}{398\,600.4418} = 1.47254 \times 10^{-4}\,\mathrm{km^{-1}} \ (a = 6790.985\,\mathrm{km}), \qquad
\sigma_0 = \frac{15.602}{631.348} = 0.024712\,\sqrt{\mathrm{km}} .
$$

($15.602\,\mathrm{km^2/s}$ is $\mathbf{r}_0 \cdot \mathbf{v}_0$.) $\alpha > 0$: an ellipse, as expected.

**Starting guess** for $\Delta t = 3600\,\mathrm{s}$: $\chi_0 = 631.348 \times 1.47254 \times 10^{-4} \times 3600 = 334.687$.

**Newton.**
- Iteration 1: $z_0 = 16.4947$, $F(\chi_0) = +499.93$, $F' = r = 6791.50$. The step is $F/F' = 0.0736$, so $\chi_1 = 334.687 - 0.0736 = 334.6132$.
- Iteration 2: $F = -1.3 \times 10^{-4}$, a step of $2 \times 10^{-8}$.
- Iteration 3: $F = 0$. Done, in three evaluations.

$$
\chi = 334.6132\,\sqrt{\mathrm{km}}, \qquad z = 16.4874, \qquad C(z) = 0.097451, \qquad S(z) = 0.072526 .
$$

**Check against the eccentric anomaly.** The analytic propagation in the last lesson moved $E$ by $\Delta E = 232.648^\circ = 4.06047\,\mathrm{rad}$. And $\sqrt{a}\,\Delta E = \sqrt{6790.985} \times 4.06047 = 334.613$. Same number — with no eccentric anomaly needed.
:::

::: example A hyperbola from periapsis, two hours ahead
**Start.** The $e = 1.5$ hyperbola with $r_p = 6678.137\,\mathrm{km}$, at periapsis, in the equatorial plane: $\mathbf{r}_0 = (6678.137, 0, 0)\,\mathrm{km}$ and $\mathbf{v}_0 = (0, 12.2155, 0)\,\mathrm{km/s}$. (That speed is $v_p = \sqrt{\mu(2/r_p - \alpha)}$ with $a = -13\,356.27\,\mathrm{km}$.)

**The three scalars.** $\alpha = -7.48712 \times 10^{-5}\,\mathrm{km^{-1}}$ (negative: a hyperbola), and $\sigma_0 = 0$ because at periapsis the velocity is square to the position.

**Starting guess** for $\Delta t = 7200\,\mathrm{s}$: $\chi_0 = 631.348 \times 7.48712 \times 10^{-5} \times 7200 = 340.34$. This is a poor guess, because a hyperbola is nothing like a circle.

**Newton.** $340.34 \to 267.96 \to 228.54 \to 218.51 \to 217.964 \to 217.9629 \to 217.9629$. Seven evaluations, with $F$ falling from $1.3 \times 10^{7}$ to zero.

**Result.** $\chi = 217.9629$, $z = -3.55697$ (negative, as a hyperbola must give), $C = 0.66694$, $S = 0.19895$, and the radius is $r = F'(\chi) = 54\,205.5\,\mathrm{km}$.

**Check against the hyperbolic anomaly.** $M_h = n_h\Delta t = 4.0902 \times 10^{-4} \times 7200 = 2.94492$. Solving $M_h = e\sinh H - H$ gives $H = 1.88599$. And $\sqrt{-a}\,H = 115.569 \times 1.88599 = 217.963$. Same number.
:::

::: example The parabola with the same periapsis
**Start.** Keep $r_p = 6678.137\,\mathrm{km}$ but make the periapsis speed exactly the escape speed, $\sqrt{2\mu/r_p} = 10.9259\,\mathrm{km/s}$. Then $\alpha = 0$ exactly, $\sigma_0 = 0$, and $z = 0$ throughout.

**The equation.** With $C = \tfrac{1}{2}$ and $S = \tfrac{1}{6}$ on every iteration, the universal Kepler equation is the cubic

$$
\tfrac{1}{6}\chi^3 + r_0\chi = \sqrt{\mu}\,\Delta t .
$$

**Newton** from $\chi_0 = 0$ for $\Delta t = 3600\,\mathrm{s}$ converges in eight evaluations to $\chi = 184.247$, with $r = 23\,651.5\,\mathrm{km}$.

**Check against Barker.** Barker's equation gives $\tan(\nu/2) = 1.59425$ one hour after periapsis, and $\sqrt{p}\,\tau = \sqrt{13\,356.27} \times 1.59425 = 184.25$. Same number.

The same function, with the same starting rule, handled $\alpha > 0$, $\alpha < 0$ and $\alpha = 0$ without a single branch on the conic type. Only the Stumpff functions branched, on the sign of $z$.
:::

## Where the universal formulation pays off

The three worked cases show that one function handles every conic. But the formulation earns its place for bigger reasons than tidiness.

**The near-parabolic regime.** Take an orbit with $e = 0.9999$ — a lunar free-return, or a comet — near periapsis, where $E = 0.01\,\mathrm{rad}$. Kepler's equation computes

$$
M = E - e\sin E = 0.010\,000\,000 - 0.009\,998\,833 = 1.1666 \times 10^{-6}.
$$

The two terms agree in their first four digits, so four of the sixteen digits of double precision are gone before the propagation even starts. The elliptic formulas for $f$ and $g$ in the next lesson suffer the same loss in $1 - \cos\Delta E$. In the universal formulation the same orbit has $\alpha \approx 10^{-8}\,\mathrm{km^{-1}}$, $z$ is tiny, and $C$ and $S$ come from their series with no cancellation at all. The quantity $\chi^3 S(z)$ is computed directly, not as a difference. The parabola itself, $\alpha = 0$, is not an exceptional branch but the center of the series' home ground.

**The trajectory optimizer.** A search for the best Earth-departure trajectory may sweep through candidate orbits — bound ellipses, then escape, then hyperbolas — as it varies a burn. A cost function that switches between three formula sets has a jump in its slope at each switch, which defeats **[[gradient-based optimization|gradient-optimizer]]**. The universal formulation is one smooth function of the state, and so are its derivatives. This is why **[[Lambert solvers|lambert]]**, which must treat elliptic and hyperbolic transfers on equal terms, are almost always written in universal variables, as the targeting module will show.

**Bookkeeping.** The elliptic recipe needs $a$, $e$, $E_0$ and the orbit's orientation. The universal recipe needs three numbers from the starting state — $r_0$, $\sigma_0$ and $\alpha$ — and never computes an eccentricity or an angle. That makes it faster and harder to get wrong. It also means the new state comes out in the same inertial frame the old one was given in, with no rotation matrix in between.

**One practical limit.** On a hyperbola with a very long time step, $\sqrt{-z} = \sqrt{-\alpha}\,\chi$ can exceed about $710$, and then $\cosh$ overflows double precision. Steps that long reach positions many thousands of Earth radii away, far outside any planet's **[[sphere of influence|sphere-of-influence]]**. Those are better handled by switching to Sun-centered elements than by rescuing the arithmetic. A check on $\lvert z \rvert$ with a clear error message is enough.

::: note Names and history
The substitution $dt = r\,ds$ is due to Karl Sundman (1912), who used it to tame the collision singularity of the three-body problem. The functions $C$ and $S$ are two of Karl Stumpff's $c_k(z)$ family (1947) — $c_2$ and $c_3$ in his numbering, with $c_0 = \cos\sqrt{z}$ and $c_1 = \sin\sqrt{z}/\sqrt{z}$. The universal Kepler equation in the form used here is Bate, Mueller and White's (1971), building on Herrick and Battin. Battin's book develops the whole two-body problem in this language, including the Lagrange coefficients of the next lesson and the Lambert problem.
:::

## Implementation

```python
import numpy as np

MU = 398600.4418

def stumpff_C(z):
    if abs(z) < 1e-6:
        return 0.5 - z / 24 + z**2 / 720
    if z > 0:
        return (1 - np.cos(np.sqrt(z))) / z
    return (np.cosh(np.sqrt(-z)) - 1) / (-z)

def stumpff_S(z):
    if abs(z) < 1e-6:
        return 1 / 6 - z / 120 + z**2 / 5040
    s = np.sqrt(abs(z))
    return (s - np.sin(s)) / s**3 if z > 0 else (np.sinh(s) - s) / s**3

def universal_anomaly(r0, v0, dt, mu=MU, tol=1e-10):
    rn, vn = np.linalg.norm(r0), np.linalg.norm(v0)
    alpha = 2 / rn - vn**2 / mu
    sigma0 = np.dot(r0, v0) / np.sqrt(mu)
    chi = np.sqrt(mu) * abs(alpha) * dt
    for _ in range(50):
        z = alpha * chi**2
        C, S = stumpff_C(z), stumpff_S(z)
        F = sigma0 * chi**2 * C + (1 - alpha * rn) * chi**3 * S + rn * chi - np.sqrt(mu) * dt
        r = sigma0 * chi * (1 - z * S) + (1 - alpha * rn) * chi**2 * C + rn
        step = F / r
        chi -= step
        if abs(step) < tol:
            return chi, alpha
    raise RuntimeError("universal Kepler equation did not converge")

r0 = np.array([-2267.240, -3989.573, 5001.268])
v0 = np.array([5.0098, -5.4258, -2.0540])
print(universal_anomaly(r0, v0, 3600.0))   # (334.6132..., 0.000147254...)
```

::: warning Units of χ and σ
$\chi$ and $\sigma_0$ carry units of $\sqrt{\mathrm{km}}$ (or $\sqrt{\mathrm{m}}$), and $\sqrt{\mu}$ has units $\mathrm{km^{3/2}/s}$. Every term of $F$ is then in $\mathrm{km^{3/2}}$. If you mix metres and kilometres anywhere, the mismatch is a factor of $10^{1.5} \approx 31.6$ — an unfamiliar enough number that nobody recognizes it as a unit error.
:::

::: warning z tells you the conic; do not tell it
When porting from a three-branch propagator, it is tempting to compute $e$ first and pick the Stumpff branch from it. Do not. The sign of $z = \alpha\chi^2$ is the sign of $\alpha$, which *is* the classification. A near-parabolic orbit with $\alpha = 10^{-12}$ is handled by the series branch automatically, whereas $e = 0.9999999$ would send you down an elliptic path that cancels catastrophically.
:::

## Check yourself

::: check
Show from the definition $d\chi/dt = \sqrt{\mu}/r$ that on a circular orbit $\chi = \sqrt{\mu}\,\alpha\,\Delta t$ exactly.
:::

::: answer
**Directly.** On a circle $r = a$ never changes, so $d\chi/dt$ is a constant, $\sqrt{\mu}/a$. Multiply by the elapsed time: $\chi = \sqrt{\mu}\,\Delta t/a = \sqrt{\mu}\,\alpha\,\Delta t$.

**Through the eccentric anomaly.** $\chi = \sqrt{a}\,\Delta E$, and on a circle $\Delta E = \Delta M = n\,\Delta t = \sqrt{\mu/a^3}\,\Delta t$. So $\chi = \sqrt{a}\sqrt{\mu/a^3}\,\Delta t = \sqrt{\mu}\,\Delta t/a$. The same.

This is why $\chi_0 = \sqrt{\mu}\,\lvert\alpha\rvert\,\Delta t$ is a good starting guess for near-circular orbits.
:::

::: check
Evaluate $C(z)$ and $S(z)$ at $z = 4$ and at $z = -4$, and say what $\Delta E$ or $\Delta H$ each corresponds to.
:::

::: answer
**$z = 4$.** $\sqrt{z} = 2$. $C = (1 - \cos 2)/4 = (1 + 0.41615)/4 = 0.35404$. $S = (2 - \sin 2)/8 = (2 - 0.90930)/8 = 0.13634$. This is an ellipse with $\Delta E = 2\,\mathrm{rad}$.

**$z = -4$.** $\sqrt{-z} = 2$. $C = (\cosh 2 - 1)/4 = (3.76220 - 1)/4 = 0.69055$. $S = (\sinh 2 - 2)/8 = (3.62686 - 2)/8 = 0.20336$. This is a hyperbola with $\Delta H = 2$.

Both pairs sit on either side of the $z = 0$ values, $0.5$ and $0.1667$: smaller for the ellipse, larger for the hyperbola. The functions change slowly, but not negligibly.
:::

::: check
Why does the universal Kepler equation have exactly one solution for any $\Delta t > 0$?
:::

::: answer
**At most one.** Its derivative is $F'(\chi) = r(\chi)$, the radius at the matching time, and a radius is always positive. So $F$ is strictly increasing, and a strictly increasing continuous function crosses zero at most once.

**At least one.** At the start, $F(0) = -\sqrt{\mu}\,\Delta t < 0$. And the radius is never smaller than the periapsis radius $r_p$, so $F$ climbs at least as fast as $r_p\,\chi$ and must pass zero eventually.
:::

::: check
A propagator computes $C(z)$ from $(1 - \cos\sqrt{z})/z$ for all $z > 0$. For which orbits will it be inaccurate, and by how much at $z = 10^{-10}$?
:::

::: answer
**Which orbits.** Any case where $z = \alpha\chi^2$ is tiny: near-parabolic orbits (small $\alpha$), or very short time steps on any orbit (small $\chi$).

**How much.** At $z = 10^{-10}$, $\sqrt{z} = 10^{-5}$ and $\cos(10^{-5}) = 0.999\,999\,999\,95$. The subtraction $1 - 0.999\,999\,999\,95$ throws away the ten leading digits that agreed, so only about six or seven correct digits survive. The relative error in $C$ is about $8 \times 10^{-8}$, against roughly $10^{-16}$ for the series.

**Fix.** Use the three-term series whenever $\lvert z \rvert < 10^{-6}$.
:::

::: check
Derive the parabolic radius $r = r_0 + \sigma_0\chi + \tfrac{1}{2}\chi^2$ directly, and confirm it matches the general formula.
:::

::: answer
**Directly.** With $\alpha = 0$ the radial equation is $r'' = 1$. Integrate once: $r' = \sigma_0 + \chi$, using $r'(0) = \sigma_0$. Integrate again: $r = r_0 + \sigma_0\chi + \tfrac{1}{2}\chi^2$, using $r(0) = r_0$.

**From the general formula.** $r = \chi^2 C + \sigma_0\chi(1 - zS) + r_0(1 - zC)$. Set $z = 0$ and $C = \tfrac{1}{2}$: $r = \tfrac{1}{2}\chi^2 + \sigma_0\chi + r_0$.

They agree. This is the sense in which the parabola is not a special case of the universal formulation.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $d\chi/dt = \sqrt{\mu}/r$, $\chi(t_0) = 0$ | Universal anomaly; $\chi = \sqrt{a}\,\Delta E = \sqrt{-a}\,\Delta H = \sqrt{p}\,\Delta\tan(\nu/2)$ |
| $\alpha = 1/a = 2/r_0 - v_0^2/\mu$ | Reciprocal semi-major axis; its sign is the conic type |
| $z = \alpha\chi^2$ | $(\Delta E)^2$, $-(\Delta H)^2$, or $0$ |
| $C(z) = \sum (-z)^k/(2k + 2)!$, $S(z) = \sum (-z)^k/(2k + 3)!$ | Stumpff functions; $C(0) = 1/2$, $S(0) = 1/6$ |
| $\cos\sqrt{z} = 1 - zC$, $\sin\sqrt{z} = \sqrt{z}(1 - zS)$ | Identities used in the derivations |
| $\sigma = \mathbf{r} \cdot \mathbf{v}/\sqrt{\mu}$ | Helper variable; $r' = \sigma$, $\sigma' = 1 - \alpha r$ |
| $r'' + \alpha r = 1$ | Linear radial equation in $\chi$ |
| $r(\chi) = \chi^2 C + \sigma_0\chi(1 - zS) + r_0(1 - zC)$ | Radius as a function of $\chi$ |
| $F(\chi) = \sigma_0\chi^2 C + (1 - \alpha r_0)\chi^3 S + r_0\chi - \sqrt{\mu}\Delta t$ | Universal Kepler equation, $F' = r$ |
| $\chi_0 = \sqrt{\mu}\lvert\alpha\rvert\Delta t$ | Starting guess, exact for circles |

Next lesson: $\chi$, $C$ and $S$ let you write the new position and velocity as a mix of the starting position and velocity — the **Lagrange coefficients** — which completes the universal propagator.

::: context free-return A trajectory that comes home by itself
A **free-return** trajectory loops around the Moon and falls back to Earth with no further engine burn. After an oxygen tank exploded on Apollo 13 in 1970, the crew fired an engine to put the spacecraft back onto a free-return path, and it brought them home.

Seen from Earth, the outbound leg reaches out about $384\,000\,\mathrm{km}$ from a perigee under $7000\,\mathrm{km}$, so it is an extremely stretched ellipse with $e$ around $0.97$ — close to the seam where the elliptic formulas start losing digits.
:::

::: context sqrt-km Why a variable measured in root-kilometres
A unit like $\sqrt{\mathrm{km}}$ looks strange, but it falls out of the definition. $\sqrt{\mu}$ is in $\mathrm{km^{3/2}/s}$; divide by $r$ in $\mathrm{km}$ and multiply by time in $\mathrm{s}$, and you are left with $\mathrm{km^{1/2}}$.

It also matches the forms you know: $\chi = \sqrt{a}\,\Delta E$ is a square root of a length times an angle, and angles have no units. What matters is that $z = \alpha\chi^2$ has no units — $\mathrm{km^{-1}} \times \mathrm{km}$ — because only a pure number can go inside a cosine.
:::

::: context stumpff-shape One smooth curve each
Here are $C(z)$ (red) and $S(z)$ (blue) from $z = -10$ to $z = 40$. Left of the dashed line is hyperbola country, right of it ellipse country, and the line itself is the parabola. Neither curve has any kink or jump there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="175" x2="340" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="20" x2="50" y2="175" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="108" y1="20" x2="108" y2="175" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="46" y1="34.1" x2="50" y2="34.1" stroke="#1f2a44"/>
  <line x1="46" y1="104.5" x2="50" y2="104.5" stroke="#1f2a44"/>
  <text x="42" y="38" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="42" y="108.5" font-size="11" text-anchor="end" fill="#1f2a44">0.5</text>
  <text x="42" y="179" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <path d="M50.0,22.3 L55.8,33.0 L61.6,43.1 L67.4,52.6 L73.2,61.5 L79.0,69.8 L84.8,77.7 L90.6,85.1 L96.4,92.0 L102.2,98.5 L108.0,104.5 L113.8,110.2 L119.6,115.5 L125.4,120.5 L131.2,125.1 L137.0,129.4 L142.8,133.4 L148.6,137.2 L154.4,140.6 L160.2,143.8 L166.0,146.8 L171.8,149.6 L177.6,152.1 L183.4,154.5 L189.2,156.6 L195.0,158.6 L200.8,160.4 L206.6,162.1 L212.4,163.6 L218.2,165.0 L224.0,166.3 L229.8,167.4 L235.6,168.5 L241.4,169.4 L247.2,170.2 L253.0,171.0 L258.8,171.6 L264.6,172.2 L270.4,172.7 L276.2,173.2 L282.0,173.6 L287.8,173.9 L293.6,174.2 L299.4,174.4 L305.2,174.6 L311.0,174.7 L316.8,174.8 L322.6,174.9 L328.4,175.0 L334.2,175.0 L340.0,175.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M50.0,136.6 L55.8,138.4 L61.6,140.1 L67.4,141.8 L73.2,143.4 L79.0,144.9 L84.8,146.3 L90.6,147.7 L96.4,149.1 L102.2,150.3 L108.0,151.5 L113.8,152.7 L119.6,153.8 L125.4,154.8 L131.2,155.8 L137.0,156.7 L142.8,157.6 L148.6,158.5 L154.4,159.3 L160.2,160.1 L166.0,160.8 L171.8,161.5 L177.6,162.2 L183.4,162.8 L189.2,163.4 L195.0,164.0 L200.8,164.5 L206.6,165.0 L212.4,165.5 L218.2,166.0 L224.0,166.4 L229.8,166.8 L235.6,167.2 L241.4,167.6 L247.2,168.0 L253.0,168.3 L258.8,168.6 L264.6,168.9 L270.4,169.2 L276.2,169.4 L282.0,169.7 L287.8,169.9 L293.6,170.1 L299.4,170.3 L305.2,170.5 L311.0,170.7 L316.8,170.9 L322.6,171.1 L328.4,171.2 L334.2,171.4 L340.0,171.5" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="108" cy="104.5" r="3.5" fill="#b4232c"/>
  <circle cx="108" cy="151.5" r="3.5" fill="#1d6fd1"/>
  <text x="116" y="100" font-size="11" fill="#b4232c">C(0) = 1/2</text>
  <text x="116" y="145" font-size="11" fill="#1d6fd1">S(0) = 1/6</text>
  <text x="78" y="16" font-size="11" text-anchor="middle" fill="#1f2a44">hyperbola</text>
  <text x="224" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">ellipse</text>
  <text x="50" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">−10</text>
  <text x="108" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="224" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">20</text>
  <text x="340" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">40</text>
  <text x="282" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">z</text>
</svg>
```
:::

::: context power-series Functions as endless sums
Many functions can be written as a sum of powers that goes on forever. For example, $\cos x = 1 - x^2/2! + x^4/4! - \cdots$. For small $x$ the first few terms already give almost the exact answer, and adding more terms makes it as accurate as you like.

That is why the series is the cure near $z = 0$. It never subtracts two nearly equal numbers: the first term, $\tfrac{1}{2}$, is already almost the whole answer, and each later term is a tiny correction.
:::

::: context cancellation Where the digits go
A computer keeps about 16 significant digits. Subtracting two numbers that share their first ten digits leaves only the last six — the rest of the answer is lost for good.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <text x="30" y="30" font-size="13" fill="#1f2a44" font-family="monospace">  1.000000000000000</text>
  <text x="30" y="52" font-size="13" fill="#1f2a44" font-family="monospace">− 0.999999999950000</text>
  <line x1="30" y1="60" x2="200" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="30" y="80" font-size="13" fill="#6c7a93" font-family="monospace">  0.0000000000<tspan fill="#b4232c">50000</tspan></text>
  <text x="215" y="30" font-size="11" fill="#1f2a44">one</text>
  <text x="215" y="52" font-size="11" fill="#1f2a44">cos(10⁻⁵)</text>
  <text x="215" y="80" font-size="11" fill="#b4232c">only these digits</text>
  <text x="215" y="94" font-size="11" fill="#b4232c">carry information</text>
</svg>
```

That is how $(1 - \cos\sqrt{z})/z$ at $z = 10^{-10}$ ends up correct to only six or seven digits.
:::

::: context oscillator-picture A spring in disguise
The equation $r'' + \alpha r = 1$ is a weight on a spring: $r$ is pulled back toward $1/\alpha$ (which is $a$) with a strength set by $\alpha$. On an ellipse, $\alpha > 0$ and the radius swings between periapsis and apoapsis like a bouncing weight. On a parabola there is no spring. On a hyperbola the "spring" pushes instead of pulls, and the radius runs away.

Here all three start at $r_0 = 6678\,\mathrm{km}$ at periapsis ($\sigma_0 = 0$): an ellipse with $e = 0.728$, a parabola, and the $e = 1.5$ hyperbola.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="55" y1="185" x2="345" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="55" y1="20" x2="55" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="49" y="189" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="49" y="106.5" font-size="11" text-anchor="end" fill="#1f2a44">25 000</text>
  <text x="49" y="24" font-size="11" text-anchor="end" fill="#1f2a44">50 000</text>
  <line x1="51" y1="102.5" x2="55" y2="102.5" stroke="#1f2a44"/>
  <line x1="51" y1="20" x2="55" y2="20" stroke="#1f2a44"/>
  <path d="M55.0,163.0 L64.7,162.6 L74.3,161.6 L84.0,160.0 L93.7,157.7 L103.3,154.8 L113.0,151.3 L122.7,147.3 L132.3,142.9 L142.0,137.9 L151.7,132.6 L161.3,127.0 L171.0,121.1 L180.7,115.0 L190.3,108.8 L200.0,102.5 L209.7,96.2 L219.3,90.1 L229.0,84.0 L238.7,78.2 L248.3,72.7 L258.0,67.6 L267.7,62.9 L277.3,58.6 L287.0,54.8 L296.7,51.6 L306.3,49.0 L316.0,47.0 L325.7,45.6 L335.3,44.9 L345.0,44.9" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M55.0,163.0 L60.7,162.8 L66.4,162.3 L72.1,161.5 L77.8,160.4 L83.5,159.0 L89.1,157.2 L94.8,155.2 L100.5,152.8 L106.2,150.1 L111.9,147.1 L117.6,143.7 L123.3,140.1 L129.0,136.1 L134.7,131.8 L140.4,127.2 L146.1,122.3 L151.7,117.1 L157.4,111.5 L163.1,105.6 L168.8,99.4 L174.5,92.9 L180.2,86.1 L185.9,78.9 L191.6,71.5 L197.3,63.7 L203.0,55.6 L208.7,47.2 L214.3,38.4 L220.0,29.4 L225.7,20.0" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <path d="M55.0,163.0 L59.1,162.8 L63.1,162.5 L67.2,161.9 L71.3,161.0 L75.3,159.9 L79.4,158.5 L83.4,156.9 L87.5,155.0 L91.6,152.9 L95.6,150.4 L99.7,147.7 L103.8,144.7 L107.8,141.4 L111.9,137.7 L115.9,133.7 L120.0,129.4 L124.1,124.6 L128.1,119.5 L132.2,114.0 L136.3,108.1 L140.3,101.8 L144.4,94.9 L148.5,87.6 L152.5,79.8 L156.6,71.4 L160.6,62.4 L164.7,52.8 L168.8,42.6 L172.8,31.6 L176.9,20.0" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="150" y="30" font-size="11" text-anchor="end" fill="#b4232c">hyperbola</text>
  <text x="232" y="30" font-size="11" fill="#1f2a44">parabola</text>
  <text x="262" y="90" font-size="11" fill="#1d6fd1">ellipse turns</text>
  <text x="262" y="104" font-size="11" fill="#1d6fd1">at apoapsis</text>
  <text x="200" y="202" font-size="11" text-anchor="middle" fill="#1f2a44">χ from 0 to 500 √km; r in km</text>
</svg>
```
:::

::: context newton-safe Why Newton behaves itself here
Newton's method follows the tangent line of $F$ down to zero, then repeats. It gets into trouble when the slope $F'$ is near zero, because then a tiny $F$ produces a gigantic step.

Here the slope is the radius, which can never be smaller than the periapsis radius — thousands of kilometres. So no step can blow up, and since $F$ only rises, there is exactly one root to find. A poor starting guess costs a few extra iterations (seven for the hyperbola example) but never sends the method off to the wrong answer.
:::

::: context gradient-optimizer How an optimizer feels its way downhill
A **gradient-based optimizer** improves a design by measuring the slope of a cost — fuel used, say — with respect to each thing it can change, then stepping downhill. It assumes the slope changes smoothly.

If the cost is computed by one formula for ellipses and another for hyperbolas, the slope jumps where they meet. The optimizer sees a cliff that is not really there and can stall or zigzag. One smooth formula removes the fake cliff.
:::

::: context lambert Lambert's problem
**Lambert's problem** asks: given two positions and the time to fly between them, what orbit connects them? It is the heart of planning a transfer to Mars or a rendezvous with a space station.

Depending on the positions and the time allowed, the answer can be an ellipse or a hyperbola, and the solver must slide between them smoothly while it searches. Universal variables let it do that with one equation. You will build one in the targeting module, using this lesson and the next.
:::

::: context sphere-of-influence Where Earth stops being in charge
A planet's **sphere of influence** is the region where its gravity matters more than the Sun's for working out a spacecraft's path. For Earth it reaches out about $925\,000\,\mathrm{km}$ — roughly $145$ Earth radii, a bit more than twice the distance to the Moon.

Beyond it, a two-body model centered on Earth is the wrong model, so there is no point propagating an Earth-centered hyperbola that far.
:::
