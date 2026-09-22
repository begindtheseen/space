---
id: l08-definite-integral-fundamental-theorem
title: The definite integral and the fundamental theorem of calculus
minutes: 24
covers:
  - the definite integral and the fundamental theorem of calculus
---

An inertial navigation system has no way to observe where it is. It has accelerometers, which report acceleration a few hundred times a second, and gyroscopes, which report angular rate. Everything else — velocity, position, attitude — is obtained by adding up those rates over time. The adding-up is integration, and an INS is the purest example of it in engineering: a Riemann sum executed in flight software, tick by tick, with every error in the integrand accumulating into the result.

Integration is also how the totals that guidance cares about are defined. The $\Delta v$ a burn delivers is the integral of thrust acceleration over the burn. Gravity loss is the integral of $g\sin\gamma$ over the ascent. Total impulse is the integral of thrust; propellant consumed is the integral of mass flow; the work done against gravity is the integral of force over distance. Each of these is an area under a curve, and each can be evaluated, when the integrand has a formula, without ever summing anything — because of the theorem that gives this lesson its name. The fundamental theorem of calculus says that integration and differentiation undo each other, and that turns a limit of sums into an evaluation of an antiderivative at two points.

## Accumulating a rate: the Riemann sum

Suppose a vehicle's speed along its path is $v(t)$ and you want the distance covered between $t = a$ and $t = b$. If $v$ were constant the answer would be $v\,(b - a)$. It is not, so chop the interval into $n$ pieces of width $\Delta t = (b - a)/n$, with endpoints $t_0 = a, t_1, \dots, t_n = b$. On the $i$-th piece the speed hardly changes, so the distance covered is close to $v(t_i^*)\,\Delta t$ for any sample time $t_i^*$ in that piece. The total is close to

$$
S_n = \sum_{i=1}^{n} v(t_i^*)\,\Delta t,
$$

a **Riemann sum**. As $n \to \infty$ the approximation "hardly changes" becomes exact, and the limit — when it exists and is the same for every choice of sample points — is the **definite integral**:

$$
\int_a^b v(t)\,dt = \lim_{n \to \infty} \sum_{i=1}^{n} v(t_i^*)\,\Delta t.
$$

Read the notation as a fossilised sum: the $\int$ is an elongated S, $v(t)\,dt$ is "height times infinitesimal width", and $a$ and $b$ are the **limits of integration**. The variable $t$ is a dummy: $\int_a^b v(t)\,dt$ and $\int_a^b v(\tau)\,d\tau$ are the same number. Geometrically the integral is the signed area between the graph and the axis: positive where $v > 0$, negative where $v < 0$. For a velocity that means the integral is the *displacement*, not the distance travelled; a vehicle that goes out and comes back has zero displacement and a positive path length $\int_a^b |v|\,dt$.

Every continuous function on $[a, b]$ is integrable, and so is every bounded function with finitely many jumps — which covers every thrust profile with an ignition and a cutoff. The choice of sample point gives the three common numerical schemes: $t_i^* = t_{i-1}$ is the **left sum**, $t_i^* = t_i$ the **right sum**, and the midpoint of the piece the **midpoint sum**. An INS that multiplies each accelerometer reading by the sample period and adds it to the velocity is computing a left Riemann sum.

::: example Displacement from a velocity profile
The second lesson's ascent had altitude $h(t) = 3t^2 + 0.02t^3$ and hence vertical velocity $v(t) = 6t + 0.06t^2$ in $\mathrm{m/s}$. Estimate $\int_0^{10} v\,dt$ by Riemann sums and compare with the truth.

The truth is $h(10) - h(0) = 300 + 20 = 320\,\mathrm{m}$, since altitude is what velocity accumulates into. With $n = 10$ and $\Delta t = 1\,\mathrm{s}$, the left sum is $\sum_{i=0}^{9} v(i) \cdot 1 = 287.1\,\mathrm{m}$, the right sum $\sum_{i=1}^{10} v(i) = 353.1\,\mathrm{m}$, and the midpoint sum $\sum v(i + 0.5) = 319.95\,\mathrm{m}$.

| $n$ | Left | Right | Midpoint |
| --- | --- | --- | --- |
| $10$ | $287.10$ | $353.10$ | $319.950$ |
| $100$ | $316.70$ | $323.30$ | $319.9995$ |
| $1000$ | $319.67$ | $320.33$ | $320.0000$ |

The left sum undershoots because $v$ is increasing — each rectangle uses the smallest speed in its interval — and the right sum overshoots for the opposite reason. Both errors fall as $1/n$, one order in $\Delta t$; the midpoint error falls as $1/n^2$, because the over- and under-shoots within each interval cancel to first order, exactly as the central difference gained an order in the previous lesson. An INS running at $100\,\mathrm{Hz}$ with a left sum on a smoothly varying acceleration therefore carries a velocity error proportional to $\tfrac12 \dot a\,\Delta t$ per step, and real systems correct for it with higher-order "coning and sculling" algorithms.
:::

## Properties you use without thinking

Each follows from the same property of finite sums, then taking the limit.

- **Linearity.** $\displaystyle\int_a^b \big(\alpha f + \beta g\big)\,dx = \alpha\int_a^b f\,dx + \beta\int_a^b g\,dx$.
- **Additivity over intervals.** $\displaystyle\int_a^c f\,dx = \int_a^b f\,dx + \int_b^c f\,dx$. A burn integrated in two segments gives the same $\Delta v$ as in one.
- **Orientation.** $\displaystyle\int_b^a f\,dx = -\int_a^b f\,dx$, and $\displaystyle\int_a^a f\,dx = 0$. Integrating backwards in time flips the sign, which is what a smoother does when it runs the filter in reverse.
- **Comparison.** If $m \le f(x) \le M$ on $[a, b]$ then $m(b - a) \le \displaystyle\int_a^b f\,dx \le M(b - a)$; and $\left|\displaystyle\int_a^b f\,dx\right| \le \displaystyle\int_a^b |f|\,dx$.

From the comparison property and the intermediate value theorem comes the **mean value theorem for integrals**: if $f$ is continuous on $[a, b]$, there is a $c$ in $[a, b]$ with

$$
\int_a^b f(x)\,dx = f(c)\,(b - a).
$$

The quantity $\dfrac{1}{b - a}\displaystyle\int_a^b f\,dx$ is the **average value** of $f$ on the interval, and the theorem says a continuous function attains its average somewhere. The average thrust acceleration over a burn is $\Delta v$ divided by burn time, and the vehicle experiences exactly that acceleration at some instant.

## The fundamental theorem, part one

Fix the lower limit and let the upper limit move. For a continuous $f$ define the **accumulation function**

$$
F(x) = \int_a^x f(t)\,dt,
$$

the area swept out from $a$ to $x$. How fast does the area grow as $x$ advances? Form the difference quotient. By additivity,

$$
F(x + h) - F(x) = \int_a^{x+h} f(t)\,dt - \int_a^x f(t)\,dt = \int_x^{x+h} f(t)\,dt,
$$

the thin strip between $x$ and $x + h$. By the mean value theorem for integrals this strip equals $f(c_h)\,h$ for some $c_h$ between $x$ and $x + h$. Divide by $h$:

$$
\frac{F(x + h) - F(x)}{h} = f(c_h).
$$

As $h \to 0$, $c_h$ is squeezed to $x$, and continuity of $f$ gives $f(c_h) \to f(x)$. Therefore

$$
\frac{d}{dx}\int_a^x f(t)\,dt = f(x).
$$

Differentiating the accumulated area returns the integrand. The rate at which accumulated velocity changes *is* the velocity — which is obvious for an INS and is here proved for any continuous function. When the upper limit is itself a function, the chain rule attaches its derivative: $\dfrac{d}{dx}\displaystyle\int_a^{u(x)} f(t)\,dt = f\big(u(x)\big)\,u'(x)$, and with both limits moving, $\dfrac{d}{dx}\displaystyle\int_{\ell(x)}^{u(x)} f(t)\,dt = f(u)\,u' - f(\ell)\,\ell'$, by writing the integral as the difference of two accumulation functions.

## The fundamental theorem, part two

Part one says the accumulation function is *an* antiderivative of $f$ — a function whose derivative is $f$. Suppose you already have another one, $G$, with $G' = f$. By part one, $(F - G)' = f - f = 0$ on the interval, and the previous lessons showed that a function with zero derivative is constant: $F(x) = G(x) + C$. At $x = a$, $F(a) = 0$, so $C = -G(a)$, and at $x = b$:

$$
\int_a^b f(x)\,dx = G(b) - G(a).
$$

Any antiderivative will do, because the constant cancels in the difference. Writing $f = G'$ makes the statement symmetric with part one:

$$
\int_a^b G'(x)\,dx = G(b) - G(a).
$$

Integrating a derivative recovers the net change of the function. Integrating velocity gives the change in position; integrating acceleration gives the change in velocity; integrating mass flow gives the propellant consumed. The right-hand side is often abbreviated $\big[G(x)\big]_a^b$.

A second proof shows *why* the sums collapse, and is worth seeing once. Partition $[a, b]$ and write the net change as a telescoping sum: $G(b) - G(a) = \sum_{i=1}^n \big[G(x_i) - G(x_{i-1})\big]$. Apply the mean value theorem to each bracket: $G(x_i) - G(x_{i-1}) = G'(\xi_i)\,\Delta x$ for some $\xi_i$ in the $i$-th piece. So $G(b) - G(a) = \sum_i G'(\xi_i)\,\Delta x$, which is a Riemann sum of $G'$ with a particular choice of sample points — and it equals $G(b) - G(a)$ *exactly*, for every $n$. Letting $n \to \infty$ the Riemann sum becomes the integral, and the equality persists.

::: key
Fundamental theorem of calculus: $\displaystyle\int_a^b f'(x)\,dx = f(b) - f(a)$, and $\dfrac{d}{dx}\displaystyle\int_a^x f(t)\,dt = f(x)$. Integration and differentiation undo each other: the integral of a rate is the net change, and the rate of change of an accumulated total is the integrand.
:::

## Antiderivatives

The theorem converts every definite integral into a search for an antiderivative, so the differentiation table of the earlier lessons, read backwards, becomes the integration table. The **indefinite integral** $\int f(x)\,dx$ denotes the whole family of antiderivatives, which differ by a constant $C$:

| $f(x)$ | $\int f(x)\,dx$ | Because |
| --- | --- | --- |
| $x^n$, $n \ne -1$ | $\dfrac{x^{n+1}}{n+1} + C$ | $\frac{d}{dx}x^{n+1} = (n+1)x^n$ |
| $\dfrac{1}{x}$ | $\ln\lvert x\rvert + C$ | $\frac{d}{dx}\ln x = 1/x$ |
| $e^{kx}$ | $\dfrac{1}{k}e^{kx} + C$ | chain rule |
| $\sin x$, $\cos x$ | $-\cos x + C$, $\sin x + C$ | $\frac{d}{dx}\cos x = -\sin x$ |
| $\sec^2 x$ | $\tan x + C$ | $\frac{d}{dx}\tan x = \sec^2 x$ |
| $\dfrac{1}{1 + x^2}$ | $\arctan x + C$ | fourth lesson |
| $\dfrac{1}{\sqrt{1 - x^2}}$ | $\arcsin x + C$ | fourth lesson |

The case $n = -1$ is the one that produces a logarithm, and it is the case that runs the rocket equation: $\int dm/m = \ln m$. The absolute value in $\ln|x|$ lets the formula serve on the negative axis too. Check any antiderivative by differentiating it; that is the only test that matters.

::: example Delta-v of a constant-thrust burn
A first stage produces constant thrust $T = 7600\,\mathrm{kN}$ at a constant mass flow $\dot m_p = 2600\,\mathrm{kg/s}$, starting at $m_0 = 550\,000\,\mathrm{kg}$ and burning for $t_b = 162\,\mathrm{s}$. Ignoring gravity and drag, what $\Delta v$ does it deliver?

The thrust acceleration is $a(t) = \dfrac{T}{m(t)} = \dfrac{T}{m_0 - \dot m_p t}$, and $\Delta v = \displaystyle\int_0^{t_b} a(t)\,dt$. An antiderivative: try $G(t) = -\dfrac{T}{\dot m_p}\ln(m_0 - \dot m_p t)$. By the chain rule $G'(t) = -\dfrac{T}{\dot m_p}\cdot\dfrac{-\dot m_p}{m_0 - \dot m_p t} = \dfrac{T}{m_0 - \dot m_p t}$, as required. Then

$$
\Delta v = G(t_b) - G(0) = \frac{T}{\dot m_p}\Big[\ln m_0 - \ln(m_0 - \dot m_p t_b)\Big] = \frac{T}{\dot m_p}\ln\frac{m_0}{m_f}, \qquad m_f = m_0 - \dot m_p t_b.
$$

Numbers: $T/\dot m_p = 7.6 \times 10^6/2600 = 2923\,\mathrm{m/s}$ — this ratio is the effective exhaust velocity $v_e$, equivalent to $I_{sp} = v_e/g_0 = 298\,\mathrm{s}$. The final mass is $550\,000 - 2600 \times 162 = 128\,800\,\mathrm{kg}$, so $m_0/m_f = 4.270$ and

$$
\Delta v = 2923 \ln 4.270 = 4243\,\mathrm{m/s}.
$$

A midpoint Riemann sum with a thousand steps gives $4243.3\,\mathrm{m/s}$, confirming the antiderivative. Had you assumed the initial acceleration $T/m_0 = 13.8\,\mathrm{m/s^2}$ held throughout, you would get $13.8 \times 162 = 2239\,\mathrm{m/s}$, barely half the truth; the acceleration climbs to $T/m_f = 59.0\,\mathrm{m/s^2}$ at cutoff, and the average is $\Delta v/t_b = 26.2\,\mathrm{m/s^2}$. You have derived the ideal rocket equation, $\Delta v = v_e\ln(m_0/m_f)$, by integrating the thrust acceleration; the final lesson of this module derives it again from momentum conservation and adds gravity.
:::

::: example Gravity loss over a pitch programme
During ascent the component of gravity along the velocity vector is $g\sin\gamma$, where $\gamma$ is the flight-path angle above the local horizon, and the speed it removes is the **gravity loss** $\displaystyle\int_0^{t_b} g\sin\gamma\,dt$. Take $g = g_0$ and a pitch programme in which $\gamma$ falls linearly from $90^\circ$ at liftoff to $30^\circ$ at $t_b = 160\,\mathrm{s}$.

Write $\gamma(t) = \dfrac{\pi}{2} - kt$ with $k = \dfrac{\pi/3}{160} = 6.545 \times 10^{-3}\,\mathrm{rad/s}$. An antiderivative of $\sin(\pi/2 - kt)$ is $\dfrac{1}{k}\cos(\pi/2 - kt)$ — differentiate to check: $\dfrac{1}{k}\cdot(-\sin(\pi/2 - kt))\cdot(-k) = \sin(\pi/2 - kt)$. So

$$
\int_0^{160}\sin\gamma\,dt = \frac{1}{k}\Big[\cos\gamma(160) - \cos\gamma(0)\Big] = \frac{\cos 30^\circ - \cos 90^\circ}{k} = \frac{0.8660}{6.545 \times 10^{-3}} = 132.3\,\mathrm{s},
$$

and the gravity loss is $g_0 \times 132.3 = 1298\,\mathrm{m/s}$. A purely vertical burn would lose $g_0 t_b = 1569\,\mathrm{m/s}$; pitching over saved $271\,\mathrm{m/s}$, and pitching over sooner would save more, which is why a gravity turn begins as early as aerodynamic loads permit. Against the $4243\,\mathrm{m/s}$ ideal $\Delta v$ of the previous example, a loss of $1.3\,\mathrm{km/s}$ is the right order for a first stage, and it is why the realised $\Delta v$ of an ascent is always well short of the rocket equation's figure.
:::

::: example Work against gravity to orbital altitude
Lifting one kilogram from the surface ($R_E = 6371\,\mathrm{km}$) to $400\,\mathrm{km}$ altitude against inverse-square gravity requires work $W = \displaystyle\int_{R_E}^{R_E + h}\frac{\mu}{r^2}\,dr$ with $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$.

An antiderivative of $\mu r^{-2}$ is $-\mu r^{-1}$. So

$$
W = \Big[-\frac{\mu}{r}\Big]_{R_E}^{R_E + h} = \mu\left(\frac{1}{R_E} - \frac{1}{R_E + h}\right) = 3.986 \times 10^{14}\left(\frac{1}{6.371 \times 10^6} - \frac{1}{6.771 \times 10^6}\right) = 3.70\,\mathrm{MJ/kg}.
$$

Constant surface gravity would give $g_0 h = 3.92\,\mathrm{MJ/kg}$, $6\%$ too much, because $g$ weakens with altitude — the same $2h/R_E$ effect the linearisation lesson quantified. For comparison, the kinetic energy of orbital speed at that altitude is $\tfrac12(7673)^2 = 29.4\,\mathrm{MJ/kg}$: getting *up* to low orbit is an eighth of the energy problem; getting *fast* is the rest. Let $h \to \infty$ in the formula and the work tends to $\mu/R_E$, a finite number; that limit is an improper integral, the subject of a later lesson, and it is where escape velocity comes from.
:::

::: warning
The definite integral of a velocity is displacement, with sign. If the integrand changes sign on the interval, $\int_a^b v\,dt$ is the net of positive and negative areas, not the distance travelled. To get path length, split the interval where $v = 0$ and integrate $|v|$. The same applies to net impulse from a thruster that fires in both directions.
:::

::: warning
$\displaystyle\int_a^b f(x)\,dx$ is a number; $\displaystyle\int f(x)\,dx$ is a family of functions. Students write $\int_0^\pi \sin x\,dx = -\cos x$ and stop, or carry a $+C$ into a definite integral where it cancels. Evaluate the antiderivative at both limits and subtract, and when the integrand has a singularity inside the interval — $1/x$ across zero — the theorem does not apply at all, because no antiderivative exists across the gap.
:::

::: note
Not every function has an antiderivative you can write down. $\int e^{-x^2}\,dx$ has none in terms of elementary functions, which is why the Gaussian cumulative distribution is tabulated as the error function rather than given by a formula. The definite integral still exists, part one of the theorem still defines a perfectly good $F(x)$, and a Riemann sum still evaluates it; only the shortcut of part two is unavailable. The probability module lives with this daily.
:::

## Check yourself

::: check
Evaluate $\displaystyle\int_0^\pi \sin x\,dx$ and find the average value of $\sin x$ on $[0, \pi]$.
:::

::: answer
An antiderivative of $\sin x$ is $-\cos x$, so $\displaystyle\int_0^\pi \sin x\,dx = [-\cos x]_0^\pi = -\cos\pi + \cos 0 = 1 + 1 = 2$. The average value is $\dfrac{1}{\pi}\cdot 2 = \dfrac{2}{\pi} = 0.637$. A half-wave rectified sinusoid of peak $1$ has mean $0.637$; the mean value theorem for integrals says $\sin c = 2/\pi$ somewhere in $[0, \pi]$, at $c = 0.690$ and $c = 2.45$.
:::

::: check
Compute $\dfrac{d}{dx}\displaystyle\int_0^{x^2}\cos t\,dt$ in two ways: with the fundamental theorem and the chain rule, and by evaluating the integral first.
:::

::: answer
First way: with $u = x^2$, $\dfrac{d}{dx}\displaystyle\int_0^{u}\cos t\,dt = \cos(u)\,u' = 2x\cos(x^2)$. Second way: $\displaystyle\int_0^{x^2}\cos t\,dt = [\sin t]_0^{x^2} = \sin(x^2)$, whose derivative by the chain rule is $2x\cos(x^2)$. Both agree, as part one of the theorem guarantees.
:::

::: check
A vehicle moves along a line with velocity $v(t) = t^2 - 4$ in $\mathrm{m/s}$ for $0 \le t \le 3\,\mathrm{s}$. Find its displacement and the distance it travelled.
:::

::: answer
Displacement: $\displaystyle\int_0^3 (t^2 - 4)\,dt = \Big[\tfrac{t^3}{3} - 4t\Big]_0^3 = 9 - 12 = -3\,\mathrm{m}$; it ends three metres behind where it started. The velocity is negative for $t < 2$ and positive after, so distance is $\displaystyle\int_0^2 (4 - t^2)\,dt + \int_2^3 (t^2 - 4)\,dt = \Big(8 - \tfrac83\Big) + \Big(9 - \tfrac{27}{3} + \tfrac83 - 4 + 8\Big)$. Carefully: $\displaystyle\int_2^3 (t^2 - 4)\,dt = \Big[\tfrac{t^3}{3} - 4t\Big]_2^3 = (9 - 12) - (\tfrac83 - 8) = -3 + \tfrac{16}{3} = \tfrac73$. Total distance $\tfrac{16}{3} + \tfrac73 = \tfrac{23}{3} = 7.67\,\mathrm{m}$.
:::

::: check
Estimate $\displaystyle\int_0^1 e^{-x^2}\,dx$ with a midpoint Riemann sum of $n = 4$ pieces, then $n = 8$. The true value is $0.746824$. How does the error scale?
:::

::: answer
With $n = 4$, $\Delta x = 0.25$ and midpoints $0.125, 0.375, 0.625, 0.875$: the sum is $0.25\,(0.98450 + 0.86882 + 0.67663 + 0.46504) = 0.74875$, error $1.93 \times 10^{-3}$. With $n = 8$ the midpoint sum is $0.747304$, error $4.8 \times 10^{-4}$. Doubling $n$ divided the error by four: the midpoint rule is second order, $O(\Delta x^2)$, consistent with the previous lesson's Taylor analysis. There is no elementary antiderivative to check against; the true value is $\tfrac{\sqrt\pi}{2}\,\mathrm{erf}(1)$, itself defined by this integral.
:::

::: check
A thruster delivers $20\,\mathrm{kN}$ for $2\,\mathrm{s}$, then ramps linearly to zero over the next $1\,\mathrm{s}$. What is the total impulse $\displaystyle\int T\,dt$, and the $\Delta v$ it gives a $500\,\mathrm{kg}$ spacecraft whose mass change you may neglect?
:::

::: answer
By additivity, split at $t = 2$. The constant part contributes $20 \times 2 = 40\,\mathrm{kN\,s}$. On $[2, 3]$, $T(t) = 20(3 - t)\,\mathrm{kN}$, and $\displaystyle\int_2^3 20(3 - t)\,dt = 20\Big[3t - \tfrac{t^2}{2}\Big]_2^3 = 20\big[(9 - 4.5) - (6 - 2)\big] = 10\,\mathrm{kN\,s}$ — the area of the triangle. Total impulse $50\,\mathrm{kN\,s}$. Since $m\,dv = T\,dt$ with constant $m$, $\Delta v = 50\,000/500 = 100\,\mathrm{m/s}$.
:::

::: check
Explain, without invoking part one of the theorem, why $\displaystyle\int_a^b G'(x)\,dx = G(b) - G(a)$.
:::

::: answer
Partition $[a, b]$ into $n$ pieces. The net change telescopes: $G(b) - G(a) = \sum_{i=1}^{n}\big[G(x_i) - G(x_{i-1})\big]$. By the mean value theorem each bracket is $G'(\xi_i)\,\Delta x$ for some $\xi_i$ in the $i$-th piece, so $G(b) - G(a) = \sum_i G'(\xi_i)\,\Delta x$: a Riemann sum for $G'$, and one that equals $G(b) - G(a)$ exactly for every $n$. As $n \to \infty$ every Riemann sum of the integrable function $G'$ tends to $\displaystyle\int_a^b G'\,dx$, so the integral equals $G(b) - G(a)$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Definite integral | $\displaystyle\int_a^b f\,dx = \lim_{n\to\infty}\sum_{i=1}^n f(x_i^*)\,\Delta x$, signed area |
| Properties | Linear; additive over intervals; $\int_b^a = -\int_a^b$; $m(b-a) \le \int_a^b f \le M(b-a)$ |
| Mean value theorem for integrals | $\displaystyle\int_a^b f\,dx = f(c)(b - a)$; average value $\frac{1}{b-a}\int_a^b f\,dx$ |
| FTC part one | $\dfrac{d}{dx}\displaystyle\int_a^x f(t)\,dt = f(x)$; with a moving limit, $\frac{d}{dx}\int_a^{u(x)} f = f(u)\,u'$ |
| FTC part two | $\displaystyle\int_a^b f'(x)\,dx = f(b) - f(a)$ |
| Riemann-sum errors | Left/right $O(\Delta x)$; midpoint $O(\Delta x^2)$ |
| Burn $\Delta v$ | $\displaystyle\int_0^{t_b}\frac{T}{m_0 - \dot m_p t}\,dt = \frac{T}{\dot m_p}\ln\frac{m_0}{m_f}$ |
| Gravity loss | $\displaystyle\int g\sin\gamma\,dt$; $1298\,\mathrm{m/s}$ for a $90^\circ \to 30^\circ$ linear pitch over $160\,\mathrm{s}$ |
| Work against gravity | $\displaystyle\int_{R_E}^{R_E+h}\frac{\mu}{r^2}\,dr = \mu\Big(\frac{1}{R_E} - \frac{1}{R_E + h}\Big)$ |

The theorem makes every integral a hunt for an antiderivative. The next lesson supplies the two techniques that find them when the table does not — substitution, which is the chain rule in reverse, and integration by parts, which is the product rule in reverse.
