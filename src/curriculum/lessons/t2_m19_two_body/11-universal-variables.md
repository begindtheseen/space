---
id: l11-universal-variables
title: Universal variables and the Stumpff functions
minutes: 17
covers:
  - universal variables and the Stumpff functions
---

The previous lessons solved the time problem three times: with $E$ for the ellipse, $H$ for the hyperbola, and $\tan(\nu/2)$ for the parabola. A propagator built that way has three code paths, a branch on the eccentricity, and a seam at $e = 1$ where both neighbouring formulas lose precision. A spacecraft on a barely-bound lunar return, or a comet with $e = 0.9999$, or a trajectory optimiser that sweeps smoothly from elliptic to hyperbolic candidates, lands on that seam constantly.

The universal-variable formulation removes the seam. One new variable – the universal anomaly $\chi$ – reduces to $\sqrt{a}\,\Delta E$ on an ellipse, to $\sqrt{-a}\,\Delta H$ on a hyperbola and to $\sqrt{p}\,\Delta\tan(\nu/2)$ on a parabola, and one equation relates it to time for all three. The trigonometric, hyperbolic and polynomial functions of the three cases are unified by two functions of a single argument, the Stumpff functions $C(z)$ and $S(z)$, whose sign of argument does the branching for you. This is how Bate, Mueller and White teach propagation, how Battin builds his theory, and how much production code works.

This lesson introduces the universal anomaly through the Sundman transformation, derives the radial equation and its solution in terms of $C$ and $S$, integrates it into the universal Kepler equation, and solves that equation by Newton's method for an ellipse, a hyperbola and a parabola with the same code. The next lesson uses $\chi$ to write the propagated state directly.

## The universal anomaly

Start from a state $\mathbf{r}_0, \mathbf{v}_0$ at $t_0$. Define the universal anomaly $\chi$ by the Sundman transformation

$$
\frac{d\chi}{dt} = \frac{\sqrt{\mu}}{r}, \qquad \chi(t_0) = 0 .
$$

It is a new independent variable that advances quickly when $r$ is small and slowly when $r$ is large – exactly opposite to time – so that the motion becomes uniform in some sense. Its units are $\sqrt{\mathrm{km}}$. To see what it is, compare with the anomalies you know. On an ellipse, Kepler's equation in differential form was $n\,dt = (1 - e\cos E)\,dE = (r/a)\,dE$, so

$$
\frac{dE}{dt} = \frac{n a}{r} = \sqrt{\frac{\mu}{a^3}}\,\frac{a}{r} = \frac{\sqrt{\mu}}{\sqrt{a}\,r}
\quad\Longrightarrow\quad
\sqrt{a}\,dE = \frac{\sqrt{\mu}}{r}\,dt = d\chi ,
$$

and integrating, $\chi = \sqrt{a}\,(E - E_0)$. On a hyperbola the same steps with $r = a(1 - e\cosh H)$ give $\chi = \sqrt{-a}\,(H - H_0)$. On a parabola, from $h\,dt = r^2\,d\nu$ and $d\tau = \tfrac{1}{2}\sec^2(\nu/2)\,d\nu = (r/p)\,d\nu$ with $\tau = \tan(\nu/2)$, one finds $d\tau/dt = h/(pr) = \sqrt{\mu}/(\sqrt{p}\,r)$, so $\chi = \sqrt{p}\,(\tau - \tau_0)$. One variable, three old friends.

Two more quantities belong with $\chi$. The reciprocal semi-major axis

$$
\alpha = \frac{1}{a} = \frac{2}{r_0} - \frac{v_0^2}{\mu}
$$

follows from vis-viva and is positive for an ellipse, zero for a parabola, negative for a hyperbola – it is well defined in all three cases, unlike $a$. And the combination

$$
z = \alpha\chi^2
$$

is dimensionless: on an ellipse $z = (\Delta E)^2$, on a hyperbola $z = -(\Delta H)^2$, on a parabola $z = 0$. The sign of $z$ is the conic type.

## The Stumpff functions

Define, for any real $z$,

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

The three branches are one function each. Expanding the cosine and sine in their power series,

$$
C(z) = \frac{1}{2!} - \frac{z}{4!} + \frac{z^2}{6!} - \cdots = \sum_{k=0}^{\infty}\frac{(-z)^k}{(2k + 2)!}, \qquad
S(z) = \frac{1}{3!} - \frac{z}{5!} + \frac{z^2}{7!} - \cdots = \sum_{k=0}^{\infty}\frac{(-z)^k}{(2k + 3)!},
$$

and these series converge for every $z$, positive or negative, reproducing the hyperbolic branch automatically (since $\cosh x = \cos ix$). The functions are smooth through $z = 0$, which is the whole point: the parabola is not a special case but the value at the origin.

Two identities restate the definitions in the form the derivations below need:

$$
\cos\sqrt{z} = 1 - z\,C(z), \qquad \sin\sqrt{z} = \sqrt{z}\,\big(1 - z\,S(z)\big),
$$

with $\cosh$ and $\sinh$ of $\sqrt{-z}$ in the hyperbolic case. And two derivative identities, provable term by term from the series:

$$
\frac{dS}{dz} = \frac{C - 3S}{2z}, \qquad \frac{dC}{dz} = \frac{1 - zS - 2C}{2z}.
$$

For the first: $2z\,S'(z) = 2\sum_{k\ge 1} k(-z)^k/(2k + 3)!$, while $C - 3S = \sum_k (-z)^k\big[1/(2k + 2)! - 3/(2k + 3)!\big] = \sum_k (-z)^k\,(2k + 3 - 3)/(2k + 3)! = \sum_k 2k(-z)^k/(2k + 3)!$; the two agree. The second follows the same way. Their use is in two consequences that you can verify by the chain rule with $z = \alpha\chi^2$:

$$
\frac{d}{d\chi}\big[\chi^3 S(z)\big] = \chi^2 C(z), \qquad
\frac{d}{d\chi}\big[\chi^2 C(z)\big] = \chi\,\big(1 - z\,S(z)\big), \qquad
\frac{d}{d\chi}\big[\chi\,(1 - zS(z))\big] = 1 - z\,C(z).
$$

::: warning Catastrophic cancellation near z = 0
For small positive $z$, $1 - \cos\sqrt{z}$ subtracts two nearly equal numbers. At $z = 10^{-8}$ the direct formula gives $C = 0.499\,999\,996\,96$ against the true $0.499\,999\,999\,58$ – a relative error of $5 \times 10^{-9}$, a million times worse than double precision. At $z = 10^{-10}$ the error is $8 \times 10^{-8}$. Use the series ($\tfrac{1}{2} - z/24 + z^2/720$ and $\tfrac{1}{6} - z/120 + z^2/5040$) whenever $\lvert z \rvert$ is below about $10^{-6}$; three terms are then accurate to better than $10^{-18}$. Near-parabolic orbits live exactly here.
:::

## The radial equation in the universal anomaly

Denote derivatives with respect to $\chi$ by a prime and use $d/dt = (\sqrt{\mu}/r)\,d/d\chi$. Define the auxiliary quantity

$$
\sigma = \frac{\mathbf{r} \cdot \mathbf{v}}{\sqrt{\mu}},
$$

with units $\sqrt{\mathrm{km}}$ like $\chi$. Then $r' = (r/\sqrt{\mu})\,\dot{r} = (r/\sqrt{\mu})(\mathbf{r} \cdot \mathbf{v}/r) = \sigma$. Differentiate once more:

$$
\sigma' = \frac{r}{\sqrt{\mu}}\,\frac{d}{dt}\frac{\mathbf{r} \cdot \mathbf{v}}{\sqrt{\mu}} = \frac{r}{\mu}\left(\mathbf{v} \cdot \mathbf{v} + \mathbf{r} \cdot \ddot{\mathbf{r}}\right) = \frac{r}{\mu}\left(v^2 - \frac{\mu}{r}\right) = \frac{r v^2}{\mu} - 1 .
$$

Vis-viva gives $v^2 = \mu(2/r - \alpha)$, so $rv^2/\mu = 2 - \alpha r$ and $\sigma' = 1 - \alpha r$. Combining,

$$
r'' + \alpha\,r = 1 .
$$

The nonlinear two-body equation has become a *linear* oscillator equation with constant coefficients – that is what the Sundman transformation buys. For $\alpha > 0$ the solution is $r = 1/\alpha + A\cos(\sqrt{\alpha}\,\chi) + B\sin(\sqrt{\alpha}\,\chi)$; the initial conditions $r(0) = r_0$ and $r'(0) = \sigma_0$ give $A = r_0 - 1/\alpha$ and $B = \sigma_0/\sqrt{\alpha}$. Now write $\sqrt{\alpha}\chi = \sqrt{z}$ and use the Stumpff identities $\cos\sqrt{z} = 1 - zC$, $\sin\sqrt{z} = \sqrt{z}(1 - zS)$:

$$
r = \frac{1}{\alpha} + \left(r_0 - \frac{1}{\alpha}\right)(1 - zC) + \frac{\sigma_0}{\sqrt{\alpha}}\sqrt{z}\,(1 - zS) .
$$

Since $z/\alpha = \chi^2$ and $\sqrt{z}/\sqrt{\alpha} = \chi$, the $1/\alpha$ terms cancel and

$$
r(\chi) = \chi^2\,C(z) + \sigma_0\,\chi\,\big(1 - z\,S(z)\big) + r_0\,\big(1 - z\,C(z)\big).
$$

Every $\alpha$ has disappeared into $z$, so this expression is valid for $\alpha < 0$ (where the derivation would have used $\cosh$ and $\sinh$ and reached the same Stumpff form) and for $\alpha = 0$ (where $r'' = 1$ integrates to $r = r_0 + \sigma_0\chi + \chi^2/2$, which is the formula with $C = \tfrac{1}{2}$, $S = \tfrac{1}{6}$, $z = 0$).

## The universal Kepler equation

Time follows from $\sqrt{\mu}\,dt = r\,d\chi$: integrate $r(\chi)$ from $0$ to $\chi$ using the three derivative identities above, which were arranged for exactly this purpose:

$$
\sqrt{\mu}\,\Delta t = \int_0^{\chi} r\,d\chi = \chi^3 S(z) + \sigma_0\,\chi^2 C(z) + r_0\,\big[\chi - \alpha\chi^3 S(z)\big],
$$

where the last bracket uses $\int (1 - zC)\,d\chi = \chi - \alpha\int\chi^2 C\,d\chi = \chi - \alpha\chi^3 S$. Collecting terms,

$$
F(\chi) \equiv \sigma_0\,\chi^2 C(z) + (1 - \alpha r_0)\,\chi^3 S(z) + r_0\,\chi - \sqrt{\mu}\,\Delta t = 0, \qquad z = \alpha\chi^2 .
$$

This is the universal Kepler equation. Given the initial state (through $r_0$, $\sigma_0$ and $\alpha$) and a time step, it determines $\chi$ for any conic. Its derivative is, by construction, $F'(\chi) = r(\chi)$ – the radius at the new time – so Newton's iteration is

$$
\chi_{k+1} = \chi_k - \frac{F(\chi_k)}{r(\chi_k)}, \qquad r(\chi_k) = \sigma_0\,\chi_k\,(1 - z_k S_k) + (1 - \alpha r_0)\,\chi_k^2 C_k + r_0 .
$$

Because $F' = r > 0$ always, $F$ is strictly increasing and the root is unique. A serviceable starting guess is $\chi_0 = \sqrt{\mu}\,\lvert\alpha\rvert\,\Delta t$: on a circular orbit $\chi = \sqrt{a}\,n\,\Delta t = \sqrt{\mu}\,\alpha\,\Delta t$ exactly, so the guess is exact for circles and close for low eccentricity. For a parabola it gives $\chi_0 = 0$, which is harmless: $F'(0) = r_0 \ne 0$ and the first step lands at $\sqrt{\mu}\Delta t/r_0$.

::: key Universal variables
$\chi$ is defined by $d\chi/dt = \sqrt{\mu}/r$; it equals $\sqrt{a}\,\Delta E$, $\sqrt{-a}\,\Delta H$ or $\sqrt{p}\,\Delta\tan(\nu/2)$. With $\alpha = 1/a = 2/r_0 - v_0^2/\mu$ and $z = \alpha\chi^2$, the universal Kepler equation is
$$
\frac{\mathbf{r}_0 \cdot \mathbf{v}_0}{\sqrt{\mu}}\,\chi^2 C(z) + (1 - \alpha r_0)\,\chi^3 S(z) + r_0\,\chi = \sqrt{\mu}\,\Delta t ,
$$
solved by Newton from $\chi_0 = \sqrt{\mu}\,\lvert\alpha\rvert\,\Delta t$ with $F'(\chi) = r$. $C(0) = \tfrac{1}{2}$, $S(0) = \tfrac{1}{6}$; use the series near $z = 0$.
:::

### Reduction to Kepler's equation

It is worth checking that nothing was lost. On an ellipse put $\chi = \sqrt{a}\,\Delta E$, so $z = (\Delta E)^2$, $C = (1 - \cos\Delta E)/(\Delta E)^2$, $S = (\Delta E - \sin\Delta E)/(\Delta E)^3$, and $\sigma_0 = \mathbf{r}_0 \cdot \mathbf{v}_0/\sqrt{\mu} = \sqrt{a}\,e\sin E_0$ (from $r\dot{r} = \sqrt{\mu a}\,e\sin E$, which follows by differentiating $r = a(1 - e\cos E)$ with $\dot{E} = na/r$). Dividing the universal equation by $\sqrt{a}$ and using $1 - \alpha r_0 = e\cos E_0$:

$$
a e\sin E_0\,(1 - \cos\Delta E) + a e\cos E_0\,(\Delta E - \sin\Delta E) + r_0\,\Delta E = \sqrt{\mu/a}\;\Delta t = a\,n\,\Delta t .
$$

The first two terms combine as $a e\big[\sin E_0 - \sin(E_0 + \Delta E)\big] + a e\,\Delta E\cos E_0$, and with $r_0 = a(1 - e\cos E_0)$ the cosine terms cancel, leaving $n\,\Delta t = \Delta E - e(\sin E - \sin E_0)$: Kepler's equation between two epochs. The universal equation *is* Kepler's equation, written so that it does not care which conic it is on.

## Three conics, one code path

::: example The ISS-like state, one hour ahead
From $\mathbf{r}_0 = (-2267.240, -3989.573, 5001.268)\,\mathrm{km}$, $\mathbf{v}_0 = (5.0098, -5.4258, -2.0540)\,\mathrm{km/s}$: $r_0 = 6787.470\,\mathrm{km}$, $v_0 = 7.66527\,\mathrm{km/s}$, $\sqrt{\mu} = 631.348\,\mathrm{km^{3/2}/s}$,
$$
\alpha = \frac{2}{6787.470} - \frac{7.66527^2}{398\,600.4418} = 1.47254 \times 10^{-4}\,\mathrm{km^{-1}} \ (a = 6790.985\,\mathrm{km}), \qquad
\sigma_0 = \frac{15.602}{631.348} = 0.024712\,\sqrt{\mathrm{km}} .
$$
For $\Delta t = 3600\,\mathrm{s}$ the starting guess is $\chi_0 = 631.348 \times 1.47254 \times 10^{-4} \times 3600 = 334.687$. Newton: $z_0 = 16.4947$, $F(\chi_0) = +499.93$, $F' = r = 6791.50$, step $-0.0736$; $\chi_1 = 334.6132$, $F = -1.3 \times 10^{-4}$; $\chi_2 = 334.6132$, $F = 0$. Converged in three evaluations to
$$
\chi = 334.6132\,\sqrt{\mathrm{km}}, \qquad z = 16.4874, \qquad C(z) = 0.097451, \qquad S(z) = 0.072526 .
$$
Check against the eccentric anomaly: the analytic propagation of the previous lesson gave $\Delta E = 232.648^\circ = 4.06047\,\mathrm{rad}$, and $\sqrt{a}\,\Delta E = \sqrt{6790.985} \times 4.06047 = 334.613$. Same number, no eccentric anomaly needed.
:::

::: example A hyperbola from periapsis, two hours ahead
Take the $e = 1.5$ hyperbola with $r_p = 6678.137\,\mathrm{km}$ at periapsis, in the equatorial plane: $\mathbf{r}_0 = (6678.137, 0, 0)$, $\mathbf{v}_0 = (0, 12.2155, 0)\,\mathrm{km/s}$, where $v_p = \sqrt{\mu(2/r_p - \alpha)}$ with $a = -13\,356.27\,\mathrm{km}$. Then $\alpha = -7.48712 \times 10^{-5}\,\mathrm{km^{-1}}$ and $\sigma_0 = 0$ (periapsis). For $\Delta t = 7200\,\mathrm{s}$, $\chi_0 = 631.348 \times 7.48712 \times 10^{-5} \times 7200 = 340.34$ – a poor guess, because the hyperbola is far from circular. Newton iterates: $340.34 \to 267.96 \to 228.54 \to 218.51 \to 217.964 \to 217.9629 \to 217.9629$, seven evaluations, with $F$ falling from $1.3 \times 10^{7}$ to $10^{-9}$. At the solution $z = -3.55697$ (negative, as a hyperbola must give), $C = 0.66694$, $S = 0.19895$, and the radius is $r = F'(\chi) = 54\,205.5\,\mathrm{km}$. Check against the hyperbolic anomaly: $M_h = n_h\Delta t = 4.0902 \times 10^{-4} \times 7200 = 2.94492$, whose solution is $H = 1.88599$, and $\sqrt{-a}\,H = 115.569 \times 1.88599 = 217.963$. Same number.
:::

::: example The parabola with the same periapsis
Replace the periapsis speed by the escape speed $\sqrt{2\mu/r_p} = 10.9259\,\mathrm{km/s}$, so $\alpha = 0$ exactly and $z = 0$ throughout: $C = \tfrac{1}{2}$, $S = \tfrac{1}{6}$ on every iteration and the equation is the cubic $\tfrac{1}{6}\chi^3 + r_0\chi = \sqrt{\mu}\Delta t$. Newton from $\chi_0 = 0$ for $\Delta t = 3600\,\mathrm{s}$ converges in eight evaluations to $\chi = 184.247$, and $r = 23\,651.5\,\mathrm{km}$. Check: Barker's equation gave $\tan(\nu/2) = 1.59425$ one hour after periapsis, and $\sqrt{p}\,\tau = \sqrt{13\,356.27} \times 1.59425 = 184.25$. The same function, with the same starting rule, handled $\alpha > 0$, $\alpha < 0$ and $\alpha = 0$ without a single branch on the conic type – only the Stumpff functions branched, on the sign of $z$.
:::

## Where the universal formulation pays off

The three worked cases show that one function handles all conics, but the formulation earns its place for reasons beyond tidiness.

The first is the near-parabolic regime. Consider an orbit with $e = 0.9999$ – a lunar free-return, or a comet – near periapsis, where $E = 0.01\,\mathrm{rad}$. Kepler's equation computes $M = E - e\sin E = 0.010\,000\,000 - 0.009\,998\,833 = 1.1666 \times 10^{-6}$: the two terms agree to four digits, so four of the sixteen digits of double precision are gone before the propagation begins, and the elliptic formulas for $f$ and $g$ in the next lesson suffer the same loss in $1 - \cos\Delta E$. In the universal formulation the same orbit has $\alpha \approx 10^{-8}\,\mathrm{km^{-1}}$, $z$ is tiny, and $C$ and $S$ are evaluated from their series with no cancellation at all; the quantity $\chi^3 S(z)$ is computed directly rather than as a difference. The parabola itself, $\alpha = 0$, is not an exceptional branch but the centre of the series' domain of validity.

The second is the trajectory optimiser. A search for the best Earth-departure trajectory may sweep candidate orbits from bound ellipses through escape to hyperbolas as it varies the burn. A cost function that switches between three formula sets has discontinuous derivatives at the switch, which defeats gradient-based optimisation; the universal formulation is one smooth function of the state, and its derivatives with respect to the initial conditions are smooth too. This is why Lambert solvers – which must consider elliptic and hyperbolic transfers on equal terms – are almost always written in universal variables, as the targeting module will show.

The third is bookkeeping. The elliptic recipe needs $a$, $e$, $E_0$ and the perifocal orientation; the universal recipe needs three scalars from the initial state, $r_0$, $\sigma_0$ and $\alpha$, and never computes an eccentricity or an angle. That makes it both faster and less error-prone, and it means the propagated state comes out in the same inertial frame the initial state was given in, with no rotation matrix in between.

One practical limit: for a hyperbola with a very long time step, $\sqrt{-z} = \sqrt{-\alpha}\,\chi$ can exceed about $710$, at which point $\cosh$ overflows in double precision. Such steps correspond to positions many thousands of Earth radii away, well outside any planet's sphere of influence, and are better handled by switching to heliocentric elements than by rescuing the arithmetic; a check on $\lvert z \rvert$ with a clear error message is enough.

::: note Names and history
The regularising substitution $dt = r\,ds$ is due to Sundman (1912), who used it to tame the collision singularity of the three-body problem; the functions $C$ and $S$ are two of Karl Stumpff's $c_k(z)$ family (1947), $c_2$ and $c_3$ in his numbering, with $c_0 = \cos\sqrt{z}$ and $c_1 = \sin\sqrt{z}/\sqrt{z}$; and the universal Kepler equation in the form used here is Bate, Mueller and White's (1971), building on Herrick and Battin. Battin's book develops the whole two-body problem in this language, including the Lagrange coefficients of the next lesson and the Lambert problem.
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
$\chi$ and $\sigma_0$ carry units of $\sqrt{\mathrm{km}}$ (or $\sqrt{\mathrm{m}}$), and $\sqrt{\mu}$ has units $\mathrm{km^{3/2}/s}$. Every term of $F$ is then in $\mathrm{km^{3/2}}$. If you mix metres and kilometres anywhere, the mismatch is a factor of $10^{1.5} \approx 31.6$, which is unfamiliar enough that it is not recognised as a unit error.
:::

::: warning z tells you the conic; do not tell it
The temptation when porting from a three-branch propagator is to compute $e$ first and select the Stumpff branch from it. Do not. The sign of $z = \alpha\chi^2$ is the sign of $\alpha$, which is the classification; a near-parabolic orbit with $\alpha = 10^{-12}$ is handled by the series branch automatically, whereas $e = 0.9999999$ would send you down an elliptic path that cancels catastrophically.
:::

## Check yourself

::: check
Show from the definition $d\chi/dt = \sqrt{\mu}/r$ that on a circular orbit $\chi = \sqrt{\mu}\,\alpha\,\Delta t$ exactly.
:::

::: answer
On a circle $r = a$ is constant, so $\chi = \sqrt{\mu}\,\Delta t/a = \sqrt{\mu}\,\alpha\,\Delta t$ directly. Equivalently $\chi = \sqrt{a}\,\Delta E$ with $\Delta E = \Delta M = n\Delta t = \sqrt{\mu/a^3}\,\Delta t$, giving $\sqrt{a}\sqrt{\mu/a^3}\,\Delta t = \sqrt{\mu}\,\Delta t/a$. This is why $\chi_0 = \sqrt{\mu}\,\lvert\alpha\rvert\,\Delta t$ is a good starting guess for near-circular orbits.
:::

::: check
Evaluate $C(z)$ and $S(z)$ at $z = 4$ and at $z = -4$, and identify what $\Delta E$ or $\Delta H$ each corresponds to.
:::

::: answer
$z = 4$: $\sqrt{z} = 2$, $C = (1 - \cos 2)/4 = (1 + 0.41615)/4 = 0.35404$, $S = (2 - \sin 2)/8 = (2 - 0.90930)/8 = 0.13634$. This is an ellipse with $\Delta E = 2\,\mathrm{rad}$. $z = -4$: $\sqrt{-z} = 2$, $C = (\cosh 2 - 1)/4 = (3.76220 - 1)/4 = 0.69055$, $S = (\sinh 2 - 2)/8 = (3.62686 - 2)/8 = 0.20336$. This is a hyperbola with $\Delta H = 2$. Both pairs are near the $z = 0$ values $0.5$ and $0.1667$ only in order of magnitude; the functions vary slowly but not negligibly.
:::

::: check
Why does the universal Kepler equation have exactly one solution for any $\Delta t$?
:::

::: answer
Its derivative with respect to $\chi$ is $F'(\chi) = r(\chi)$, the radius at the corresponding time, which is strictly positive for any real trajectory. So $F$ is strictly increasing, and a strictly increasing continuous function crosses zero at most once. It crosses at least once because $F(0) = -\sqrt{\mu}\Delta t < 0$ and $F \to +\infty$ as $\chi \to \infty$ (for $\alpha \le 0$ the cubic term grows without bound; for $\alpha > 0$ the term $r_0\chi$ does).
:::

::: check
A propagator computes $C(z)$ from $(1 - \cos\sqrt{z})/z$ for all $z > 0$. For which orbits will it be inaccurate, and by how much at $z = 10^{-10}$?
:::

::: answer
For orbits and time steps with $z = \alpha\chi^2$ tiny: near-parabolic orbits (small $\alpha$) or very short steps on any orbit (small $\chi$). At $z = 10^{-10}$, $\sqrt{z} = 10^{-5}$ and $1 - \cos(10^{-5}) \approx 5 \times 10^{-11}$ is computed from $1$ minus a number that differs from $1$ in its eleventh digit, leaving about six significant digits; the relative error in $C$ is about $8 \times 10^{-8}$, against $10^{-16}$ for the series. The fix is the three-term series for $\lvert z \rvert < 10^{-6}$.
:::

::: check
Derive the parabolic radial solution $r = r_0 + \sigma_0\chi + \tfrac{1}{2}\chi^2$ directly, and confirm it matches the general formula.
:::

::: answer
With $\alpha = 0$ the radial equation is $r'' = 1$. Integrating twice with $r(0) = r_0$ and $r'(0) = \sigma_0$ gives $r = r_0 + \sigma_0\chi + \tfrac{1}{2}\chi^2$. In the general formula $r = \chi^2 C + \sigma_0\chi(1 - zS) + r_0(1 - zC)$, set $z = 0$, $C = \tfrac{1}{2}$: $r = \tfrac{1}{2}\chi^2 + \sigma_0\chi + r_0$. They agree, which is the sense in which the parabola is not a special case of the universal formulation.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $d\chi/dt = \sqrt{\mu}/r$, $\chi(t_0) = 0$ | Universal anomaly; $\chi = \sqrt{a}\,\Delta E = \sqrt{-a}\,\Delta H = \sqrt{p}\,\Delta\tan(\nu/2)$ |
| $\alpha = 1/a = 2/r_0 - v_0^2/\mu$ | Reciprocal semi-major axis; sign is the conic type |
| $z = \alpha\chi^2$ | $(\Delta E)^2$, $-(\Delta H)^2$, or $0$ |
| $C(z) = \sum (-z)^k/(2k + 2)!$, $S(z) = \sum (-z)^k/(2k + 3)!$ | Stumpff functions; $C(0) = 1/2$, $S(0) = 1/6$ |
| $\cos\sqrt{z} = 1 - zC$, $\sin\sqrt{z} = \sqrt{z}(1 - zS)$ | Identities used in the derivations |
| $\sigma = \mathbf{r} \cdot \mathbf{v}/\sqrt{\mu}$ | Auxiliary variable; $r' = \sigma$, $\sigma' = 1 - \alpha r$ |
| $r'' + \alpha r = 1$ | Linear radial equation in $\chi$ |
| $r(\chi) = \chi^2 C + \sigma_0\chi(1 - zS) + r_0(1 - zC)$ | Radius as a function of $\chi$ |
| $F(\chi) = \sigma_0\chi^2 C + (1 - \alpha r_0)\chi^3 S + r_0\chi - \sqrt{\mu}\Delta t$ | Universal Kepler equation, $F' = r$ |
| $\chi_0 = \sqrt{\mu}\lvert\alpha\rvert\Delta t$ | Starting guess, exact for circles |

The next lesson uses $\chi$, $C$ and $S$ to write the propagated position and velocity as linear combinations of $\mathbf{r}_0$ and $\mathbf{v}_0$ – the Lagrange coefficients – completing the universal propagator.
