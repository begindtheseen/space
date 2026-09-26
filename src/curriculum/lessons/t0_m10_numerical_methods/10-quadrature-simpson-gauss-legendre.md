---
id: l10-quadrature-simpson-gauss-legendre
title: Quadrature, Simpson and Gauss-Legendre
minutes: 24
covers:
  - 'quadrature: Simpson, Gauss-Legendre'
---

A car's speedometer tells you how fast you are going right now. To know how far you went, you add up speed times time, a little piece at a time. That adding-up is an integral: it turns a **rate** into a **total**.

GNC is full of rates that must become totals. The $\Delta v$ ("delta v", the change in speed) from a burn is the integral of the acceleration $T/m$, thrust over mass. The heat load a heat shield must survive is the integral of the heating rate. A computer cannot do calculus with a pencil. It can only call the function at some points and add up the results.

Computing $\int_a^b f(x)\,dx$ ("the integral of $f$ from $a$ to $b$") from a handful of values of $f$ is called **[[quadrature|quadrature-word]]**. This lesson builds two rules. **Simpson's rule** uses evenly spaced points. **Gauss–Legendre quadrature** picks the points cleverly as well, and gets about twice the accuracy for the same number of calls. Then it looks at the three things that spoil every rule: data you cannot resample, sudden jumps, and sharp peaks.

## A weighted sum of samples

Picture the area under a curve cut into thin vertical strips. Measure the height of each strip, multiply by its width, and add. Every quadrature rule is a smarter version of that:

$$
\int_a^b f(x)\,dx \approx \sum_{i} w_i\,f(x_i) .
$$

The points $x_i$ where you call the function are the **nodes**. The numbers $w_i$ that multiply each sample are the **weights**. A rule is nothing more than a choice of nodes and weights. The whole lesson is about choosing them well.

## Trapezoid and Simpson

The recipe comes from the interpolation lesson: draw an easy curve through the samples and integrate that curve exactly.

Two samples at the ends of a strip give a straight line. The area under it is a trapezoid, so this is the **trapezoidal rule**:

$$
\int_{x_0}^{x_1} f\,dx \approx \frac{h}{2}\left(f_0 + f_1\right), \qquad h = x_1 - x_0 .
$$

Here $f_0$ means $f(x_0)$, and $h$ is the spacing: width times average height.

Three equally spaced samples give a parabola, which can bend to follow the curve. Put the nodes at $-h$, $0$ and $h$. Integrating the parabola through them gives **[[Simpson's rule|strips-picture]]**:

$$
\int_{x_0}^{x_2} f\,dx \approx \frac{h}{3}\left(f_0 + 4f_1 + f_2\right),
\qquad \text{error} = -\frac{h^5}{90}f^{(4)}(\xi) .
$$

The middle sample counts four times as much as each end. In the error, $f^{(4)}$ is the fourth derivative of $f$, and $\xi$ ("ksee" or "ksai") is some point inside the interval that we do not need to know.

::: note Why the weights are 1/3, 4/3, 1/3
Write the parabola with the three **Lagrange basis** polynomials from the interpolation lesson. Each equals $1$ at its own node and $0$ at the other two:

$$
L_{-1} = \frac{x(x-h)}{2h^2}, \qquad L_0 = \frac{h^2 - x^2}{h^2}, \qquad L_{1} = \frac{x(x+h)}{2h^2} .
$$

The parabola is $f_{-1}L_{-1} + f_0L_0 + f_1L_1$, so its area is each sample times the area under its basis polynomial. Integrating over $[-h, h]$:

$$
\int_{-h}^{h}L_{-1}\,dx = \frac{h}{3}, \qquad
\int_{-h}^{h}L_{0}\,dx = \frac{4h}{3}, \qquad
\int_{-h}^{h}L_{1}\,dx = \frac{h}{3}.
$$

Sanity check: the weights add to $2h$, the width of the interval. They must, because the rule has to get $f = 1$ exactly right.
:::

For a long interval, lay Simpson panels side by side. Cut $[a, b]$ into $n$ strips of width $h = (b-a)/n$, with $n$ even so the strips pair up. Neighboring panels share an endpoint, so those shared samples get $1/3 + 1/3 = 2/3$. The inside weights take turns, 4 then 2:

$$
\int_a^b f\,dx \approx \frac{h}{3}\Big[f_0 + 4f_1 + 2f_2 + 4f_3 + \cdots + 2f_{n-2} + 4f_{n-1} + f_n\Big],
\qquad \text{error} = -\frac{(b-a)h^4}{180}f^{(4)}(\xi) .
$$

The error goes like $h^4$. So **composite Simpson is fourth order**: halve the spacing and the error falls by $2^4 = 16$. The composite trapezoid rule, by the same bookkeeping, has error $-\frac{(b-a)h^2}{12}f''(\xi)$. That is second order: halving $h$ only divides the error by 4.

::: key
Simpson's rule: $\int_a^b f\,dx \approx \frac{h}{3}\left[f_0 + 4f_1 + 2f_2 + \cdots + 4f_{n-1} + f_n\right]$ with $h = (b-a)/n$ and $n$ even; error $O(h^4)$, specifically $-\frac{(b-a)h^4}{180}f^{(4)}(\xi)$. The trapezoidal rule is $\frac{h}{2}[f_0 + 2f_1 + \cdots + 2f_{n-1} + f_n]$ with error $O(h^2)$.
:::

::: warning Simpson needs an even number of strips
With an odd $n$ the last strip has no partner, and the 4-2-4 pattern breaks. Codes that "fix" this by quietly using a trapezoid on the last strip lose the fourth-order accuracy there. Count the strips, not the samples: $n$ strips means $n + 1$ samples.
:::

## Degree of exactness

A good way to rank a rule is its **degree of exactness**: the highest-degree polynomial it integrates with zero error.

Simpson was built from a parabola, degree 2, so it is exact for degree 2. It is also exact for degree 3, which is a free gift. Over $[-h, h]$ the function $x^3$ is negative on the left and positive on the right, so its area is $0$. Simpson's sum is $\frac{h}{3}(-h^3 + 0 + h^3) = 0$ too. Any cubic error cancels by symmetry. That gift is why Simpson's error involves $f^{(4)}$ and not $f'''$, and why Simpson became the standard rule.

Adding more equally spaced nodes gives the **Newton–Cotes** family:

| Rule | Nodes | Weights $\times h$ | Degree of exactness | Error |
| --- | --- | --- | --- | --- |
| Trapezoid | 2 | $\tfrac12, \tfrac12$ | 1 | $-\frac{h^3}{12}f''$ |
| Simpson | 3 | $\tfrac13, \tfrac43, \tfrac13$ | 3 | $-\frac{h^5}{90}f^{(4)}$ |
| Simpson 3/8 | 4 | $\tfrac38, \tfrac98, \tfrac98, \tfrac38$ | 3 | $-\frac{3h^5}{80}f^{(4)}$ |
| Boole | 5 | $\tfrac{14}{45}, \tfrac{64}{45}, \tfrac{8}{15}, \tfrac{64}{45}, \tfrac{14}{45}$ | 5 | $-\frac{8h^7}{945}f^{(6)}$ |

::: warning More equally spaced nodes is not better
The family goes bad. At nine nodes some **[[weights turn negative|negative-weights]]**: the eight-strip rule's weights times $h$ start $\frac{3956}{14175}, \frac{23552}{14175}, -\frac{3712}{14175}, \frac{41984}{14175}, -\frac{18160}{14175}, \ldots$ A negative weight lets round-off grow instead of average out. It can even return a negative answer for a function that is positive everywhere — a negative heat load. The cause is the Runge phenomenon from the interpolation lesson: a high-degree polynomial through equally spaced points wiggles wildly near the ends. Stop at Boole. For more accuracy, use more panels, not a higher degree.
:::

## Gauss–Legendre: choose the nodes too

Newton–Cotes fixes where the samples go and only chooses the weights. An $n$-point rule has $2n$ knobs to turn: $n$ node positions and $n$ weights. Turn all of them and you should be able to match $2n$ conditions, which is enough to be exact up to degree $2n-1$. You can. The result is **Gauss–Legendre quadrature**.

Try it by hand with $n = 2$ on the standard interval $[-1, 1]$. Demand exact answers for $1$, $x$, $x^2$ and $x^3$. The exact integrals are $2$, $0$, $\tfrac23$ and $0$:

$$
\begin{aligned}
w_1 + w_2 &= 2, & w_1x_1 + w_2x_2 &= 0,\\
w_1x_1^2 + w_2x_2^2 &= \tfrac23, & w_1x_1^3 + w_2x_2^3 &= 0 .
\end{aligned}
$$

Guess a symmetric answer: $x_2 = -x_1$ and $w_1 = w_2$. The two equations with odd powers are then satisfied automatically. The first gives $w_1 = w_2 = 1$. The third gives $2x_1^2 = \tfrac23$, so $x_1 = 1/\sqrt{3} \approx 0.577$.

Two samples, exact for cubics — the same degree as Simpson's three samples. And neither sample sits at an end of the interval.

For larger $n$ there is a theorem instead of algebra. **The $n$ Gauss–Legendre nodes on $[-1,1]$ are the roots of the [[Legendre polynomial|legendre-polynomials]] $P_n$**, and the weights are

$$
w_i = \frac{2}{\left(1 - x_i^2\right)\left[P_n'(x_i)\right]^2} .
$$

The Legendre polynomials come from a recurrence, a rule that builds each one from the two before:

$$
(k+1)P_{k+1}(x) = (2k+1)x P_k(x) - k P_{k-1}(x), \qquad P_0 = 1, \quad P_1 = x .
$$

Their roots are found by Newton's method, starting from the guess $x_i \approx \cos\!\big(\pi(i - \tfrac14)/(n + \tfrac12)\big)$. That is root finding from lesson 2 of this module, used to build an integration rule. The first few:

| $n$ | Nodes $x_i$ | Weights $w_i$ | Degree |
| --- | --- | --- | --- |
| 2 | $\pm 0.577350269189626$ | $1, 1$ | 3 |
| 3 | $0$, $\pm 0.774596669241483$ | $8/9$, $5/9$ | 5 |
| 4 | $\pm 0.339981043584856$, $\pm 0.861136311594053$ | $0.652145154862546$, $0.347854845137454$ | 7 |
| 5 | $0$, $\pm 0.538469310105683$, $\pm 0.906179845938664$ | $0.568888888889$, $0.478628670499$, $0.236926885056$ | 9 |

In exact form, the $n = 2$ nodes are $\pm 1/\sqrt3$. The $n = 3$ nodes are $0$ and $\pm\sqrt{3/5}$, with weights $8/9$ and $5/9$. The $n = 4$ nodes are $\pm\sqrt{(3 \mp 2\sqrt{6/5})/7}$, with weights $(18 \pm \sqrt{30})/36$.

For every $n$, all the nodes are strictly inside the interval and all the weights are positive. Those are exactly the two properties Newton–Cotes loses.

### Any interval, and the error

To use the rule on $[a, b]$, stretch and slide $[-1, 1]$ onto it. The point $\xi$ in $[-1, 1]$ goes to $x = \frac{a+b}{2} + \frac{b-a}{2}\xi$: the midpoint plus a fraction of the half-width. The strip also gets wider by the factor $\frac{b-a}{2}$, so the sum is multiplied by that:

$$
\int_a^b f(x)\,dx \approx \frac{b-a}{2}\sum_{i=1}^{n}w_i\,f\!\left(\frac{a+b}{2} + \frac{b-a}{2}x_i\right).
$$

The error of the $n$-point rule is

$$
E_n = \frac{(b-a)^{2n+1}(n!)^4}{(2n+1)\left[(2n)!\right]^3}\,f^{(2n)}(\xi).
$$

For $n = 2$ on $[-1, 1]$ this is $\frac{2^5 \cdot 16}{5 \cdot 24^3}f^{(4)} = f^{(4)}(\xi)/135$. The part to remember is $f^{(2n)}$: every extra node buys two more orders. For a smooth function the error falls faster than any fixed power of $n$. That is **exponential convergence**, and it is why a ten-node Gauss rule often beats a thousand-point Simpson rule.

::: key
Gauss–Legendre quadrature with $n$ nodes has degree of exactness $2n-1$, twice what an $n$-point equally spaced rule achieves, because it optimizes the node positions as well as the weights. The nodes are the roots of the Legendre polynomial $P_n$ and the weights are $w_i = 2/\{(1-x_i^2)[P_n'(x_i)]^2\}$; all nodes are interior and all weights positive. On $[a,b]$, map with $x = \frac{a+b}{2} + \frac{b-a}{2}\xi$ and multiply by $\frac{b-a}{2}$. The error involves $f^{(2n)}$, so convergence on a smooth integrand is exponential in $n$.
:::

::: example The ideal Δv of a constant-thrust stage
A first stage starts at $m_0 = 500{,}000\,\mathrm{kg}$. It has constant thrust $T = 7.6\,\mathrm{MN}$ and specific impulse $I_{sp} = 282\,\mathrm{s}$, and burns for $140\,\mathrm{s}$.

**Setup.** The exhaust speed is $c = I_{sp}g_0 = 282 \times 9.80665 = 2{,}765.4753\,\mathrm{m/s}$. The mass flow is $\dot m = T/c = 2{,}748.171\,\mathrm{kg/s}$ ($\dot m$, "m dot", is kilograms burned per second). After $140\,\mathrm{s}$ the mass is $500{,}000 - 2{,}748.171 \times 140 = 115{,}256.0\,\mathrm{kg}$.

**The integrand.** The acceleration is $a(t) = T/(m_0 - \dot m t)$. It climbs from $15.20$ to $65.94\,\mathrm{m/s^2}$, a factor of $4.3$, so the curve really bends.

**The exact answer** comes from the **[[rocket equation|rocket-equation]]**:

$$
\Delta v = c\,\ln\frac{m_0}{m_f} = 4{,}058.2029975813\,\mathrm{m/s} .
$$

**The race.** Relative error against the number of times $a(t)$ is called:

| calls | trapezoid | Simpson | Gauss–Legendre |
| --- | --- | --- | --- |
| 3 | $1.26\times10^{-1}$ | $3.47\times10^{-2}$ | $2.57\times10^{-3}$ |
| 5 | $3.53\times10^{-2}$ | $5.06\times10^{-3}$ | $4.05\times10^{-5}$ |
| 9 | $9.20\times10^{-3}$ | $5.10\times10^{-4}$ | $9.63\times10^{-9}$ |
| 17 | $2.33\times10^{-3}$ | $3.91\times10^{-5}$ | $\sim 10^{-16}$ |
| 33 | $5.84\times10^{-4}$ | $2.62\times10^{-6}$ | $\sim 10^{-16}$ |

**Reading it.** Each time the strip width halves, the trapezoid column drops by about 4 and Simpson's by about 16. That is second and fourth order, as promised. The Gauss column has no fixed rate: it drops by 63, then 4,200, then tens of millions, and hits the round-off floor of `float64` by 17 calls. At 9 calls, Gauss is about 53,000 times more accurate than Simpson for the same work.

**Sanity check.** About $4.06\,\mathrm{km/s}$ is a sensible first-stage $\Delta v$.
:::

## Time of flight, checked against Kepler

A satellite on an ellipse sweeps its angle fast near **perigee** (closest point) and slowly far out. Conservation of angular momentum says $r^2\dot\theta = h$, where $r$ is the distance, $\theta$ ("theta", the **true anomaly**) is the angle from perigee, and $h$ is the specific angular momentum. Flip it to get time per unit angle and add up:

$$
t(\theta) = \int_0^{\theta}\frac{r(\theta')^2}{h}\,d\theta',
\qquad r(\theta) = \frac{p}{1 + e\cos\theta},
\qquad p = a(1-e^2), \quad h = \sqrt{\mu p} .
$$

Here $a$ is the semi-major axis, $e$ the eccentricity, $p$ the semi-latus rectum and $\mu$ Earth's gravitational parameter.

There is also an exact answer, from the root-finding lesson: Kepler's equation, $t = \sqrt{a^3/\mu}\,(E - e\sin E)$, with the eccentric anomaly $E$ from $\tan(E/2) = \sqrt{(1-e)/(1+e)}\tan(\theta/2)$. So we can grade the quadrature.

::: example Quadrature against Kepler on a Molniya orbit
Use the orbit from the adaptive-stepping lesson: $a = 26{,}600\,\mathrm{km}$ and $e = 0.7$, with $\mu = 398{,}600.4418\,\mathrm{km^3/s^2}$.

**Orbit numbers.** $p = 26{,}600 \times (1 - 0.49) = 13{,}566.0\,\mathrm{km}$. Then $h = \sqrt{\mu p} = 73{,}535.118\,\mathrm{km^2/s}$, and the period is $43{,}175.108\,\mathrm{s}$, about 12 hours.

**The arc.** Integrate from perigee to $\theta = 120^\circ$. Over that arc $r$ grows from $7{,}980$ to $20{,}871\,\mathrm{km}$, so the integrand $r^2/h$ grows by a factor of $6.84$.

**Kepler's answer.** $E = 1.2580296049\,\mathrm{rad}$ and $t = 4{,}067.87449645\,\mathrm{s}$.

**The quadratures:**

| calls | Simpson | error | Gauss–Legendre | error |
| --- | --- | --- | --- | --- |
| 5 | $4{,}088.78940\,\mathrm{s}$ | $20.9\,\mathrm{s}$ | $4{,}067.91300\,\mathrm{s}$ | $0.0385\,\mathrm{s}$ |
| 9 | $4{,}069.24698\,\mathrm{s}$ | $1.37\,\mathrm{s}$ | $4{,}067.87450\,\mathrm{s}$ | $8.1\times10^{-7}\,\mathrm{s}$ |
| 17 | $4{,}067.95841\,\mathrm{s}$ | $0.0839\,\mathrm{s}$ | $4{,}067.87450\,\mathrm{s}$ | $\sim 10^{-12}\,\mathrm{s}$ |

**Reading it.** Simpson's error falls by $15.3$, then $16.3$: fourth order, confirmed. Gauss with nine nodes is right to under a microsecond. At the perigee speed of $9.2\,\mathrm{km/s}$, that is about seven millimeters along the track.

**Why bother, when Kepler is exact?** Nine calls to a simple fraction can be cheaper than Kepler's equation with its Newton loop, and the integral still works when small forces bend the orbit and Kepler no longer holds.
:::

## When you cannot choose the nodes

Gauss–Legendre needs $f$ at odd spots like $0.861136311594053$ of the way along. Three situations spoil that.

**Sampled data.** An accelerometer log, telemetry or a wind-tunnel sweep comes on a grid you did not choose. You could fit a spline and evaluate it at the Gauss nodes, but the spline's error comes along too. On an evenly spaced grid, Simpson is simpler and usually as good. Use Simpson on data; save Gauss for functions you can call.

**Jumps.** Every error formula in this lesson contains a high derivative of $f$. Where $f$ jumps, that derivative does not exist, and the formulas promise nothing.

::: example A throttle bucket wrecks the order
Take the same stage, but throttle it from $7.6\,\mathrm{MN}$ down to $5.0\,\mathrm{MN}$ between $t = 50\,\mathrm{s}$ and $t = 75\,\mathrm{s}$ to ride through **[[max-Q|throttle-bucket]]**, then back up.

**The exact answer.** The mass never jumps: $362{,}591.4\,\mathrm{kg}$ at $t = 50$, $317{,}391.2\,\mathrm{kg}$ at $t = 75$, $138{,}760.1\,\mathrm{kg}$ at $t = 140$. The acceleration does jump, at both ends of the bucket. Adding up the rocket equation over the three constant-thrust pieces gives $\Delta v = 3{,}544.95632\,\mathrm{m/s}$.

**Simpson across the whole burn:**

| strips | calls | relative error |
| --- | --- | --- |
| 8 | 9 | $1.90\times10^{-2}$ |
| 32 | 33 | $3.25\times10^{-3}$ |
| 128 | 129 | $4.96\times10^{-4}$ |
| 256 | 257 | $4.00\times10^{-4}$ |

The error no longer falls by 16 per halving. It stumbles down at about $h^{1.1}$: first order. Three orders of accuracy are gone, and 257 calls buy only four digits.

**Now split at the jumps.** Integrate $[0, 50]$, $[50, 75]$ and $[75, 140]$ separately, each with its own thrust, including at its own endpoints:

| scheme | calls | relative error |
| --- | --- | --- |
| Simpson, 2 strips per piece | 9 | $2.45\times10^{-3}$ |
| Simpson, 4 strips per piece | 15 | $2.21\times10^{-4}$ |
| Simpson, 8 strips per piece | 27 | $1.59\times10^{-5}$ |
| Gauss, 4 nodes per piece | 12 | $2.82\times10^{-6}$ |
| Gauss, 6 nodes per piece | 18 | $4.96\times10^{-9}$ |

**Reading it.** The Simpson errors now fall by 11, then 14, heading for 16: fourth order is back. Twenty-seven calls beat 257. Gauss with 18 calls beats everything by more than three orders of magnitude.
:::

::: warning Use the one-sided value at a split
At a jump, each piece must use its *own* side's value at the shared endpoint. A thrust model written as `5.0e6 if 50.0 <= t < 75.0 else 7.6e6` returns the throttled value exactly at $t = 50$. Integrating $[0, 50]$ with it puts a wrong value on the last sample and quietly throws away the gain the split was for. Give each piece its own function, or sample at $50 - \delta$ and $50 + \delta$.
:::

**Peaks.** A sharp peak is smooth but costly: its high derivatives are huge, so every error formula is large until the nodes are packed tightly enough to see it. The classic case is the heat load on a ballistic re-entry. Heating rate follows the **[[Sutton–Graves|sutton-graves]]** formula $\dot q = k\sqrt{\rho/R_n}\,v^3$. The speed follows the Allen–Eggers solution for an exponential atmosphere, $v(z) = v_e\exp\!\left[-\frac{\rho_0 H}{2\beta\sin\gamma}e^{-z/H}\right]$. Together they turn the heat load per unit area into one integral over altitude $z$:

$$
Q = \frac{k}{\sin\gamma\sqrt{R_n}}\int_0^{z_{\text{top}}}\sqrt{\rho(z)}\;v(z)^2\,dz .
$$

Here $k$ is a constant for Earth's air, $\rho$ is air density, $R_n$ the nose radius, $\gamma$ ("gamma") the entry angle below horizontal, $\beta$ ("beta") the ballistic coefficient and $H$ the scale height.

Take $v_e = 7{,}500\,\mathrm{m/s}$, $\gamma = 20^\circ$, $\beta = 400\,\mathrm{kg/m^2}$, $\rho_0 = 1.225\,\mathrm{kg/m^3}$, $H = 7{,}200\,\mathrm{m}$ and $z_{\text{top}} = 120\,\mathrm{km}$. Heating peaks at $z = 37.9\,\mathrm{km}$, where $\rho = 6.33\times10^{-3}\,\mathrm{kg/m^3}$ and the vehicle has slowed to $6{,}349\,\mathrm{m/s}$, 85% of entry speed. The integrand is above half its peak only between about 26 and 51 km — a band about 25 km wide out of 120. Errors against a 400-node Gauss reference:

| calls | trapezoid | Simpson | Gauss–Legendre |
| --- | --- | --- | --- |
| 17 | $2.63\times10^{-5}$ | $7.81\times10^{-3}$ | $1.20\times10^{-4}$ |
| 33 | $1.23\times10^{-5}$ | $7.65\times10^{-6}$ | $8.31\times10^{-9}$ |
| 65 | $3.08\times10^{-6}$ | $7.10\times10^{-9}$ | $\sim 10^{-14}$ |
| 129 | $7.71\times10^{-7}$ | $2.18\times10^{-10}$ | $\sim 10^{-14}$ |

Read the first row with suspicion. At 17 calls no rule has resolved the peak, and the trapezoid's "win" is errors canceling by luck. Rankings mean something only once the integrand is resolved. From 33 calls on, the expected orders return and Gauss pulls away to round-off level.

::: warning Over a full period, the trapezoid wins
Integrate the time-of-flight integrand over a whole orbit, $0$ to $2\pi$. With 33 calls, the plain trapezoid rule has a relative error of $1.7\times10^{-11}$, Simpson $5.0\times10^{-6}$ and Gauss $2.0\times10^{-7}$. With 65, the trapezoid is at machine precision. The reason is the [[Euler–Maclaurin formula|periodic-trapezoid]]: the trapezoid's error is a series built from the *differences* of the odd derivatives at the two ends. For a periodic function the two ends match, so every term is zero and convergence becomes exponential. Orbit averages, Fourier coefficients and anything over a full cycle belong here. Use the trapezoid, and do not switch to Simpson weights, which spoil it.
:::

## Gauss nodes elsewhere in GNC

An **implicit Runge–Kutta method** whose stages sit at the Gauss–Legendre points of $[0, 1]$ reaches order $2s$ with $s$ stages, the highest possible. It is both A-stable (the stiffness lesson) and symplectic (the orbit lesson). The one-stage member is the implicit midpoint rule,

$$
\mathbf{y}_{n+1} = \mathbf{y}_n + h\,\mathbf{f}\!\left(t_n + \tfrac{h}{2},\ \tfrac{\mathbf{y}_n + \mathbf{y}_{n+1}}{2}\right),
$$

which is second order. The Radau stiff solvers are the same idea with a different family of nodes, trading symplecticity for L-stability.

**Direct collocation** is the workhorse of trajectory optimization. It chops a trajectory into nodes, demands that the equations of motion hold at each node, and lets an optimizer pick the states and controls there. Put those nodes at Legendre–Gauss or Legendre–Gauss–Lobatto points instead of an even grid and you have a **[[pseudospectral method|pseudospectral]]**. It shows the same exponential convergence as the tables above, now for a whole trajectory. That is why a landing or transfer problem can be solved accurately with a few dozen nodes instead of a few thousand.

## Check yourself

::: check
Simpson's rule is built from a parabola through three points, yet it is exact for cubics. Show this on $[-h, h]$. Then find the first power of $x$ it gets wrong, and say why this matters.
:::

::: answer
Take $f(x) = x^3$. The exact integral is $\left[x^4/4\right]_{-h}^{h} = h^4/4 - h^4/4 = 0$. Simpson gives $\frac{h}{3}\left(f(-h) + 4f(0) + f(h)\right) = \frac{h}{3}\left(-h^3 + 0 + h^3\right) = 0$. Exact. The cubic is odd, so its errors on the two halves cancel.

The first failure is $x^4$. Exactly, $\int_{-h}^{h}x^4\,dx = 2h^5/5$. Simpson gives $\frac{h}{3}(h^4 + 0 + h^4) = 2h^5/3$. Wrong.

It matters because the free degree makes the error $O(h^5)$ per panel and $O(h^4)$ overall, instead of $O(h^4)$ and $O(h^3)$. A whole order for nothing — which is why Simpson, not the 3/8 rule, is the default.
:::

::: check
How many Gauss–Legendre nodes integrate a degree-9 polynomial exactly? How many Simpson strips? Which costs less?
:::

::: answer
Gauss with $n$ nodes is exact up to degree $2n - 1$. We need $2n - 1 \ge 9$, so $n = 5$: five calls, exact.

Simpson is exact only up to degree 3, so no number of strips gets a degree-9 polynomial *exactly*. Composite Simpson approaches the answer like $h^4$ but never lands on it. Twelve digits would need $\frac{(b-a)h^4}{180}\max|f^{(4)}|$ below $10^{-12}$ of the answer, which in a typical case means hundreds of strips.

Five exact calls against hundreds of approximate ones: the case for Gauss on smooth functions.
:::

::: check
An accelerometer logs acceleration at 100 Hz during a 140 s burn, and you want the $\Delta v$. Which rule do you use, and what limits the accuracy?
:::

::: answer
Simpson, on the 14,001 samples as they come. The sensor fixed the nodes, so Gauss would need interpolation first, adding error for no benefit at this density.

With $h = 0.01\,\mathrm{s}$ the truncation error is tiny: $(b-a)h^4/180 = 140 \times 10^{-8}/180 = 7.8\times10^{-9}$ times $\max|f^{(4)}|$. So the rule is not the limit. The data is:

- Sensor noise averages down, roughly as $1/\sqrt{N}$, so it is fairly harmless.
- Sensor bias does not average down. A bias of $100\,\mu g$ is $100\times10^{-6} \times 9.80665 = 9.8\times10^{-4}\,\mathrm{m/s^2}$. Over $140\,\mathrm{s}$ that is $0.14\,\mathrm{m/s}$ of $\Delta v$ error, and no rule can remove it.
- Rounding in the sensor's output, and any dropped or mistimed samples.

With measured data, the data limits you long before the rule does.
:::

::: check
Your heat-load integral uses 8-node Gauss–Legendre over the whole entry, from $120\,\mathrm{km}$ to the ground. It disagrees with a fine Simpson answer by 3%. Is the Gauss code wrong?
:::

::: answer
Probably not. The integrand is probably under-resolved. The heating band is about 25 km wide inside a 120 km interval, so eight nodes spread over the whole range put only about two inside it. Gauss's fast convergence starts only once the nodes can see the peak. Before that it is no better than anything else, as the first row of the heat-load table shows.

Two checks settle it. Rerun with 16 and 32 nodes: if the answer settles down, 8 was too few. And split the range — say 0–20, 20–60 and 60–120 km — with a Gauss rule on each, so the nodes crowd where the integrand lives. An adaptive routine such as `scipy.integrate.quad` does this splitting for you.
:::

::: check
Why do Newton–Cotes rules with nine or more nodes have negative weights, and what goes wrong because of it?
:::

::: answer
A Newton–Cotes rule integrates the polynomial through equally spaced samples. At high degree that polynomial suffers the Runge phenomenon: it swings wildly near the ends. Integrating those swings gives weights that flip sign and grow. Nine nodes is the first rule with a negative weight.

Two things go wrong. Numerically, the sizes of the weights add up to more than $b - a$, so round-off in the samples gets multiplied instead of averaged, and raising the degree makes answers worse. Physically, the rule can return a negative value for a positive function — a negative heat load or propellant mass, which is nonsense, not mere inaccuracy. Gauss–Legendre weights are positive for every $n$, which is why raising its order is safe.
:::

## Summary

| Item | Statement |
| --- | --- |
| Quadrature | $\int_a^b f\,dx \approx \sum_i w_i f(x_i)$; a rule is a choice of nodes and weights |
| Trapezoid | $\frac{h}{2}[f_0 + 2f_1 + \cdots + 2f_{n-1} + f_n]$, error $-\frac{(b-a)h^2}{12}f''$, degree 1 |
| Simpson | $\frac{h}{3}[f_0 + 4f_1 + 2f_2 + \cdots + 4f_{n-1} + f_n]$, $h = (b-a)/n$, $n$ even; error $-\frac{(b-a)h^4}{180}f^{(4)}$, degree 3 |
| Degree of exactness | Highest polynomial degree integrated exactly: trapezoid 1, Simpson 3, Boole 5 |
| Newton–Cotes limit | Negative weights from nine nodes; stop at Boole |
| Gauss–Legendre | $n$ nodes give degree $2n-1$; nodes are roots of $P_n$, $w_i = 2/\{(1-x_i^2)[P_n'(x_i)]^2\}$ |
| Gauss nodes | $n=2$: $\pm1/\sqrt3$, $w = 1,1$. $n=3$: $0, \pm\sqrt{3/5}$, $w = 8/9, 5/9$ |
| Interval map | $x = \frac{a+b}{2} + \frac{b-a}{2}\xi$, multiply the sum by $\frac{b-a}{2}$ |
| Gauss error | $\propto f^{(2n)}$: exponential convergence on a smooth integrand |
| Jumps | Order drops to first; split there, one-sided endpoint values |
| Peaks | Resolve the peak first; split so nodes crowd it |
| Full periods | Trapezoid converges exponentially (Euler–Maclaurin) |
| Sampled data | Nodes are fixed, so Simpson |
| Elsewhere | Gauss-node implicit Runge–Kutta (order $2s$); pseudospectral collocation |

One topic remains, and it sits under several others. Newton's step, the implicit ODE step and the spline all end in solving $\mathbf{A}\mathbf{x} = \mathbf{b}$. The last lesson asks when that answer can be trusted, what "conditioning" measures, and how the pattern of zeros in $\mathbf{A}$ decides whether the solve is affordable at all.

::: context quadrature-word Why "quadrature"
The word comes from the Latin for "making a square". Ancient Greek geometers asked whether a curved shape could be turned into a square of exactly the same area using only a ruler and compass — the famous "squaring the circle" is one such problem. Finding an area came to be called quadrature. The name stuck even after calculus arrived, and today it means computing an integral from a finite number of samples. The same word shows up in "Gauss quadrature" and in the names of library routines such as `scipy.integrate.quad`.
:::

::: context strips-picture A straight edge against a bent one
Here is one Simpson panel on $f(x) = 1/(1.5 - x)$ from $0$ to $1$ (blue). The trapezoid rule joins the three samples with straight lines (orange), which cut above the curve. Simpson's parabola (red dashed) bends through the same three points and hugs the curve.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40.0,130.0 L54.0,128.6 L68.0,127.1 L82.0,125.6 L96.0,123.8 L110.0,122.0 L124.0,120.0 L138.0,117.8 L152.0,115.5 L166.0,112.9 L180.0,110.0 L194.0,106.8 L208.0,103.3 L222.0,99.4 L236.0,95.0 L250.0,90.0 L264.0,84.3 L278.0,77.7 L292.0,70.0 L306.0,60.9 L320.0,50.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M40,130 L180,110 L320,50" fill="none" stroke="#f2b880" stroke-width="2"/>
  <path d="M40.0,130.0 L54.0,129.8 L68.0,129.2 L82.0,128.2 L96.0,126.8 L110.0,125.0 L124.0,122.8 L138.0,120.2 L152.0,117.2 L166.0,113.8 L180.0,110.0 L194.0,105.8 L208.0,101.2 L222.0,96.2 L236.0,90.8 L250.0,85.0 L264.0,78.8 L278.0,72.2 L292.0,65.2 L306.0,57.8 L320.0,50.0" fill="none" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,3"/>
  <g fill="#1f2a44"><circle cx="40" cy="130" r="3.5"/><circle cx="180" cy="110" r="3.5"/><circle cx="320" cy="50" r="3.5"/></g>
  <g stroke="#6c7a93" stroke-dasharray="2,3"><line x1="180" y1="110" x2="180" y2="170"/><line x1="320" y1="50" x2="320" y2="170"/></g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle"><text x="40" y="186">0</text><text x="180" y="186">0.5</text><text x="320" y="186">1</text></g>
  <line x1="56" y1="36" x2="76" y2="36" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="82" y="40" font-size="12" fill="#1f2a44">exact area 1.099</text>
  <line x1="56" y1="52" x2="76" y2="52" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,3"/>
  <text x="82" y="56" font-size="12" fill="#1f2a44">Simpson 1.111</text>
  <line x1="56" y1="68" x2="76" y2="68" stroke="#f2b880" stroke-width="2"/>
  <text x="82" y="72" font-size="12" fill="#1f2a44">trapezoid 1.167</text>
</svg>
```

Same three samples, different weights: Simpson's error is about a fifth of the trapezoid's.
:::

::: context negative-weights What a negative weight does
Think of a weighted average of test scores. If every weight is positive, the average sits between the lowest and highest score, and a small mistake in one score moves it only a little. Now let one weight be negative. A higher score in that test *lowers* the result, and big positive and negative weights fight each other. Small errors in the samples get multiplied instead of smoothed out. For an integral, the sum can even come out negative when every sample is positive — like averaging five positive test scores and getting a negative grade.
:::

::: context legendre-polynomials Where the Gauss nodes live
The Legendre polynomials are a family of wavy curves on $[-1, 1]$. $P_3(x) = \tfrac12(5x^3 - 3x)$ crosses zero three times, at $0$ and $\pm\sqrt{3/5} \approx \pm 0.775$. Those crossings are exactly the three Gauss nodes. The bars below show their weights: $5/9$, $8/9$, $5/9$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="335" y2="70" stroke="#6c7a93" stroke-width="1"/>
  <path d="M40.0,115.0 L47.0,102.3 L54.0,91.3 L61.0,81.7 L68.0,73.6 L75.0,66.8 L82.0,61.3 L89.0,57.0 L96.0,53.8 L103.0,51.6 L110.0,50.3 L117.0,49.9 L124.0,50.2 L131.0,51.2 L138.0,52.8 L145.0,54.9 L152.0,57.4 L159.0,60.3 L166.0,63.4 L173.0,66.6 L180.0,70.0 L187.0,73.4 L194.0,76.6 L201.0,79.7 L208.0,82.6 L215.0,85.1 L222.0,87.2 L229.0,88.8 L236.0,89.8 L243.0,90.1 L250.0,89.7 L257.0,88.4 L264.0,86.2 L271.0,83.0 L278.0,78.7 L285.0,73.2 L292.0,66.4 L299.0,58.3 L306.0,48.7 L313.0,37.7 L320.0,25.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#b4232c"><circle cx="71.6" cy="70" r="4"/><circle cx="180" cy="70" r="4"/><circle cx="288.4" cy="70" r="4"/></g>
  <text x="300" y="22" font-size="12" fill="#1d6fd1">P₃(x)</text>
  <line x1="30" y1="185" x2="335" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="61.6" y="151.7" width="20" height="33.3"/>
    <rect x="170" y="131.7" width="20" height="53.3"/>
    <rect x="278.4" y="151.7" width="20" height="33.3"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="71.6" y="145">5/9</text><text x="180" y="125">8/9</text><text x="288.4" y="145">5/9</text>
    <text x="40" y="198">−1</text><text x="320" y="198">1</text>
  </g>
</svg>
```

Notice the nodes crowd toward the ends. That crowding is what tames the Runge wiggles that ruin equally spaced rules.
:::

::: context rocket-equation The rocket equation in one line
The rocket equation, $\Delta v = c\ln(m_0/m_f)$, is what you get when you integrate $T/m$ exactly for constant thrust and constant exhaust speed. Konstantin Tsiolkovsky published it in 1903, which is why it often carries his name. Here it serves as the answer key: because the exact integral is known, you can measure the error of each quadrature rule to the last digit. Engineers often test a numerical method this way — on a problem with a known answer — before trusting it on one without.
:::

::: context throttle-bucket Why rockets throttle down
**Max-Q** is the moment of maximum dynamic pressure, $\tfrac12\rho v^2$: the air is still fairly thick and the rocket is already fast. The aerodynamic load on the structure peaks there. Many launchers throttle down through it — the Space Shuttle's main engines dropped to roughly two thirds of rated thrust — and then throttle back up. That dip is the "throttle bucket". Here is this lesson's version: the acceleration jumps down at 50 s and up at 75 s.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40.0,139.6 L60.0,137.8 L80.0,135.8 L100.0,133.6 L120.0,131.0 L140.0,128.1" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M140.0,142.4 L160.0,141.0 L180.0,139.4 L190.0,138.5" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <path d="M190.0,122.1 L216.0,116.0 L242.0,108.2 L268.0,97.7 L294.0,82.9 L307.0,73.0 L320.0,60.5" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g stroke="#6c7a93" stroke-dasharray="3,3"><line x1="140" y1="128.1" x2="140" y2="142.4"/><line x1="190" y1="138.5" x2="190" y2="122.1"/></g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle"><text x="40" y="186">0</text><text x="140" y="186">50</text><text x="190" y="186">75</text><text x="320" y="186">140 s</text></g>
  <text x="165" y="160" font-size="11" fill="#b4232c" text-anchor="middle">5.0 MN</text>
  <text x="235" y="60" font-size="12" fill="#1f2a44">a = T/m, m/s²</text>
  <text x="46" y="118" font-size="11" fill="#1f2a44">15.2</text>
  <text x="282" y="54" font-size="11" fill="#1f2a44">54.8</text>
</svg>
```
:::

::: context sutton-graves A formula for heat at the nose
The Sutton–Graves correlation, published by Kenneth Sutton and Randolph Graves at NASA Langley in 1971, estimates the heating at the very tip of a blunt nose. The $v^3$ says heating rises very steeply with speed. The $1/\sqrt{R_n}$ says a *bigger*, blunter nose heats *less* — the reason capsules like Apollo and Orion have broad, rounded heat shields instead of sharp points. The constant $k$ depends on the planet's air; for Earth it is about $1.74\times10^{-4}$ in SI units.
:::

::: context periodic-trapezoid Why going all the way round helps
Every rule's error comes partly from what happens at the two ends of the interval. When you integrate over a complete cycle, the end is the same as the start: same value, same slope, same curvature. The trapezoid rule's error terms are made of *differences* between the ends, so they all vanish together. Only a tiny leftover remains, and it shrinks exponentially as you add samples. Simpson's alternating 4-2-4 weights break the perfect evenness and bring an ordinary $h^4$ error back.
:::

::: context pseudospectral A real flight on Gauss nodes
In November 2006 the International Space Station turned itself 90 degrees without using any propellant. The "zero-propellant maneuver" steered the station's spinning control gyroscopes along a path worked out by pseudospectral optimal control, whose nodes sit at Legendre–Gauss–Lobatto points. The idea from this lesson — put samples where they do the most good — let a few dozen nodes describe a whole maneuver accurately. You will meet collocation again in the trajectory optimization modules.
:::
