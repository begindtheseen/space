---
id: l10-quadrature-simpson-gauss-legendre
title: Quadrature, Simpson and Gauss-Legendre
minutes: 28
covers:
  - 'quadrature: Simpson, Gauss-Legendre'
---

Integrals turn up in GNC wherever a rate has to become a total. The $\Delta v$ delivered by a burn is $\int T/m\,dt$. The total heat load on a re-entry vehicle, which sizes its thermal protection system, is $\int \dot q\,dt$ along the trajectory. The process-noise matrix a Kalman filter adds each step is $\int_0^{\Delta t}\boldsymbol{\Phi}\mathbf{G}\mathbf{Q}\mathbf{G}^{\mathsf T}\boldsymbol{\Phi}^{\mathsf T}d\tau$. The time of flight along an orbital arc is $\int r^2\,d\theta/h$. And the collocation methods that dominate modern trajectory optimisation are, underneath, a quadrature rule applied to the dynamics.

*Quadrature* means computing $\int_a^b f(x)\,dx$ from a finite number of evaluations of $f$. Every rule has the same shape — a weighted sum $\sum_i w_i f(x_i)$ — and every rule is a choice of where to put the nodes $x_i$ and what weights to give them. The classical Newton–Cotes rules, of which the trapezoidal rule and Simpson's rule are the first two, put the nodes on an equally spaced grid and choose the weights. **Gauss–Legendre** quadrature chooses the nodes *as well*, and that extra freedom doubles the accuracy for the same number of evaluations.

The engineering decision between them is almost always about whether you control the nodes. If $f$ is a function you can call — an analytic thrust law, a density model, an interpolated trajectory — you can evaluate it wherever you like, and Gauss–Legendre is the right answer by a wide margin. If $f$ is sampled data arriving on a fixed telemetry grid, Gauss is unavailable and Simpson is the tool. This lesson builds both, quantifies the difference on real integrals, and then deals with the two things that break every rule: discontinuities and peaks.

## From interpolation to quadrature

The construction is the one from the interpolation lesson, used again. To integrate $f$, interpolate it by a polynomial through some nodes and integrate the polynomial, which you can do exactly.

Two nodes at the ends of the interval give the straight line of linear interpolation, and integrating it gives the **trapezoidal rule**

$$
\int_{x_0}^{x_1} f\,dx \approx \frac{h}{2}\left(f_0 + f_1\right), \qquad h = x_1 - x_0 .
$$

Three equally spaced nodes give a quadratic. Put them at $-h, 0, h$ and write the Lagrange basis: $L_{-1} = x(x-h)/(2h^2)$, $L_0 = (h^2 - x^2)/h^2$, $L_{1} = x(x+h)/(2h^2)$. Integrating each over $[-h, h]$:

$$
\int_{-h}^{h}L_{-1}\,dx = \frac{h}{3}, \qquad
\int_{-h}^{h}L_{0}\,dx = \frac{4h}{3}, \qquad
\int_{-h}^{h}L_{1}\,dx = \frac{h}{3},
$$

and the weights sum to $2h$, the interval length, as they must. That is **Simpson's rule**:

$$
\int_{x_0}^{x_2} f\,dx \approx \frac{h}{3}\left(f_0 + 4f_1 + f_2\right),
\qquad \text{error} = -\frac{h^5}{90}f^{(4)}(\xi) .
$$

Apply it to consecutive pairs of intervals across $[a, b]$ with $n$ intervals, $n$ even, $h = (b-a)/n$. Adjacent panels share an endpoint, so the interior weights alternate 4 and 2:

$$
\int_a^b f\,dx \approx \frac{h}{3}\Big[f_0 + 4f_1 + 2f_2 + 4f_3 + \cdots + 2f_{n-2} + 4f_{n-1} + f_n\Big],
\qquad \text{error} = -\frac{(b-a)h^4}{180}f^{(4)}(\xi) .
$$

Composite Simpson is fourth order: halve the spacing and the error falls by sixteen. The composite trapezoidal rule, by the same accounting, has error $-\frac{(b-a)h^2}{12}f''(\xi)$ and is second order.

::: key
Simpson's rule: $\int_a^b f\,dx \approx \frac{h}{3}\left[f_0 + 4f_1 + 2f_2 + \cdots + 4f_{n-1} + f_n\right]$ with $h = (b-a)/n$ and $n$ even; error $O(h^4)$, specifically $-\frac{(b-a)h^4}{180}f^{(4)}(\xi)$. The trapezoidal rule is $\frac{h}{2}[f_0 + 2f_1 + \cdots + 2f_{n-1} + f_n]$ with error $O(h^2)$.
:::

## Degree of exactness, and where Newton–Cotes stops

The useful way to rank a quadrature rule is its **degree of exactness**: the highest degree of polynomial it integrates with no error at all. Simpson's rule was built from a quadratic, so it is exact for degree 2 by construction — but it is also exact for degree 3, because the cubic term's error is an odd function about the midpoint and cancels. That free extra degree is why Simpson's error involves $f^{(4)}$ rather than $f'''$, and it is the reason Simpson is the standard rule rather than a curiosity.

Continuing the construction with more equally spaced nodes gives the Newton–Cotes family:

| Rule | Nodes | Weights $\times h$ | Degree of exactness | Error |
| --- | --- | --- | --- | --- |
| Trapezoid | 2 | $\tfrac12, \tfrac12$ | 1 | $-\frac{h^3}{12}f''$ |
| Simpson | 3 | $\tfrac13, \tfrac43, \tfrac13$ | 3 | $-\frac{h^5}{90}f^{(4)}$ |
| Simpson 3/8 | 4 | $\tfrac38, \tfrac98, \tfrac98, \tfrac38$ | 3 | $-\frac{3h^5}{80}f^{(4)}$ |
| Boole | 5 | $\tfrac{14}{45}, \tfrac{64}{45}, \tfrac{8}{15}, \tfrac{64}{45}, \tfrac{14}{45}$ | 5 | $-\frac{8h^7}{945}f^{(6)}$ |

The family does not continue usefully. At nine nodes the weights first go negative — the eight-interval rule has weights proportional to $3956, 23552, -3712, 41984, -18160, \ldots$ over $14175$ — and negative weights mean the rule can amplify round-off and can return a negative value for a positive integrand. The underlying cause is the Runge phenomenon from the interpolation lesson: the rules are built by integrating a high-degree interpolant through equally spaced points, and that interpolant oscillates. Stop at Boole, and get more accuracy by refining the grid (composite rules) rather than raising the degree.

## Gauss–Legendre: choose the nodes too

An $n$-point rule has $2n$ free parameters — $n$ nodes and $n$ weights. Newton–Cotes fixes the nodes and uses only $n$ of them, buying degree $n-1$ (or $n$, with Simpson's parity bonus). If you spend all $2n$, you should be able to reach degree $2n-1$. You can, and the rule is **Gauss–Legendre quadrature**.

Do it by hand for $n = 2$ on the reference interval $[-1, 1]$. Require exactness for $1, x, x^2, x^3$:

$$
\begin{aligned}
w_1 + w_2 &= \int_{-1}^{1}dx = 2, & w_1x_1 + w_2x_2 &= 0,\\
w_1x_1^2 + w_2x_2^2 &= \tfrac23, & w_1x_1^3 + w_2x_2^3 &= 0 .
\end{aligned}
$$

Symmetry suggests $x_2 = -x_1$ and $w_1 = w_2$; the odd equations are then satisfied identically, the first gives $w_1 = w_2 = 1$, and the third gives $2x_1^2 = 2/3$, so $x_1 = 1/\sqrt{3}$. Two evaluations, degree 3 — the same degree as Simpson's three evaluations, and it uses no endpoint values at all.

The general answer is a theorem rather than an algebra exercise: **the $n$ Gauss–Legendre nodes on $[-1,1]$ are the roots of the Legendre polynomial $P_n$**, and the weights are

$$
w_i = \frac{2}{\left(1 - x_i^2\right)\left[P_n'(x_i)\right]^2} .
$$

The Legendre polynomials come from the recurrence $(k+1)P_{k+1}(x) = (2k+1)x P_k(x) - k P_{k-1}(x)$ with $P_0 = 1$, $P_1 = x$, and their roots are found by Newton's method from the starting guess $x_i \approx \cos\!\big(\pi(i - \tfrac14)/(n + \tfrac12)\big)$ — root finding from the second lesson of this module, used to build a quadrature rule. The first few:

| $n$ | Nodes $x_i$ | Weights $w_i$ | Degree |
| --- | --- | --- | --- |
| 2 | $\pm 0.577350269189626$ | $1, 1$ | 3 |
| 3 | $0$, $\pm 0.774596669241483$ | $8/9$, $5/9$ | 5 |
| 4 | $\pm 0.339981043584856$, $\pm 0.861136311594053$ | $0.652145154862546$, $0.347854845137454$ | 7 |
| 5 | $0$, $\pm 0.538469310105683$, $\pm 0.906179845938664$ | $0.568888888889$, $0.478628670499$, $0.236926885056$ | 9 |

The $n = 2$ nodes are $\pm 1/\sqrt3$ and the $n = 3$ nodes are $0, \pm\sqrt{3/5}$ with weights $8/9$ and $5/9$; the $n = 4$ nodes are $\pm\sqrt{(3 \mp 2\sqrt{6/5})/7}$ with weights $(18 \pm \sqrt{30})/36$. All the nodes are interior and all the weights are positive, for every $n$ — the two properties Newton–Cotes loses.

To integrate over a general interval, map it linearly:

$$
\int_a^b f(x)\,dx = \frac{b-a}{2}\int_{-1}^{1}f\!\left(\frac{a+b}{2} + \frac{b-a}{2}\xi\right)d\xi
\approx \frac{b-a}{2}\sum_{i=1}^{n}w_i\,f\!\left(\frac{a+b}{2} + \frac{b-a}{2}x_i\right).
$$

The error term is

$$
E_n = \frac{(b-a)^{2n+1}(n!)^4}{(2n+1)\left[(2n)!\right]^3}\,f^{(2n)}(\xi),
$$

which for $n = 2$ on $[-1,1]$ is $f^{(4)}(\xi)/135$. The practical content of that formula is the $f^{(2n)}$: each extra node buys *two* orders. For a smooth integrand the error falls faster than any power of $n$ — convergence is exponential, not algebraic — and this is why a ten-node Gauss rule routinely beats a thousand-point Simpson rule.

::: key
Gauss–Legendre quadrature with $n$ nodes has degree of exactness $2n-1$, twice what an $n$-point equally spaced rule achieves, because it optimises the node positions as well as the weights. The nodes are the roots of the Legendre polynomial $P_n$ and the weights are $w_i = 2/\{(1-x_i^2)[P_n'(x_i)]^2\}$; all nodes are interior and all weights positive. On $[a,b]$, map with $x = \frac{a+b}{2} + \frac{b-a}{2}\xi$ and multiply by $\frac{b-a}{2}$. The error involves $f^{(2n)}$, so convergence on a smooth integrand is exponential in $n$.
:::

::: example The ideal $\Delta v$ of a constant-thrust stage
A first stage with $m_0 = 500{,}000\,\mathrm{kg}$, constant thrust $T = 7.6\,\mathrm{MN}$ and $I_{sp} = 282\,\mathrm{s}$, burning for $140\,\mathrm{s}$. The exhaust speed is $c = I_{sp}g_0 = 2{,}765.4753\,\mathrm{m/s}$, the mass flow $\dot m = T/c = 2{,}748.171\,\mathrm{kg/s}$, and the final mass $115{,}256.0\,\mathrm{kg}$. The integrand is the acceleration $a(t) = T/(m_0 - \dot m t)$, which rises from $15.20$ to $65.94\,\mathrm{m/s^2}$ — a factor of 4.3, so there is real curvature to resolve. The exact answer is the rocket equation,

$$
\Delta v = c\,\ln\frac{m_0}{m_f} = 4{,}058.2029975813\,\mathrm{m/s} .
$$

Relative error against the number of evaluations of $a(t)$:

| evaluations | trapezoid | Simpson | Gauss–Legendre |
| --- | --- | --- | --- |
| 3 | $1.26\times10^{-1}$ | $3.47\times10^{-2}$ | $2.57\times10^{-3}$ |
| 5 | $3.53\times10^{-2}$ | $5.06\times10^{-3}$ | $4.05\times10^{-5}$ |
| 9 | $9.20\times10^{-3}$ | $5.10\times10^{-4}$ | $9.63\times10^{-9}$ |
| 17 | $2.33\times10^{-3}$ | $3.91\times10^{-5}$ | $7.84\times10^{-16}$ |
| 33 | $5.85\times10^{-4}$ | $2.62\times10^{-6}$ | $0$ |

The trapezoid column divides by 4 per halving and Simpson's by 16 — second and fourth order, as advertised. The Gauss column has no fixed rate: it divides by 63, then by 4,200, then by $10^{7}$, reaching the last bit of `float64` with seventeen evaluations. At nine evaluations Gauss is already 53,000 times more accurate than Simpson with the same budget.
:::

## Time of flight, checked against Kepler

The time from perigee to true anomaly $\theta$ on an ellipse follows from angular momentum conservation, $r^2\dot\theta = h$:

$$
t(\theta) = \int_0^{\theta}\frac{r(\theta')^2}{h}\,d\theta',
\qquad r(\theta) = \frac{p}{1 + e\cos\theta},
\qquad p = a(1-e^2), \quad h = \sqrt{\mu p} .
$$

There is an exact answer, and the root-finding lesson built it: Kepler's equation, $t = \sqrt{a^3/\mu}\,(E - e\sin E)$, with the eccentric anomaly from $\tan(E/2) = \sqrt{(1-e)/(1+e)}\tan(\theta/2)$. So this integral can be graded.

::: example Quadrature against Kepler on a Molniya orbit
The orbit from the adaptive-stepping lesson: $a = 26{,}600\,\mathrm{km}$, $e = 0.7$, so $p = 13{,}566.0\,\mathrm{km}$, $h = 73{,}535.118\,\mathrm{km^2/s}$ and $T = 43{,}175.108\,\mathrm{s}$. Integrate from perigee to $\theta = 120^\circ$, where $r$ grows from $7{,}980$ to $20{,}871\,\mathrm{km}$ and the integrand $r^2/h$ grows by a factor of 6.84.

Kepler gives $E = 1.2580296049\,\mathrm{rad}$ and $t = 4{,}067.87449645\,\mathrm{s}$. The quadratures:

| evaluations | Simpson | error | Gauss–Legendre | error |
| --- | --- | --- | --- | --- |
| 5 | $4{,}088.78940\,\mathrm{s}$ | $20.9\,\mathrm{s}$ | $4{,}067.91300\,\mathrm{s}$ | $0.0385\,\mathrm{s}$ |
| 9 | $4{,}069.24698\,\mathrm{s}$ | $1.37\,\mathrm{s}$ | $4{,}067.87450\,\mathrm{s}$ | $8.1\times10^{-7}\,\mathrm{s}$ |
| 17 | $4{,}067.95841\,\mathrm{s}$ | $0.0839\,\mathrm{s}$ | $4{,}067.87450\,\mathrm{s}$ | $1.8\times10^{-12}\,\mathrm{s}$ |

Simpson's errors fall by 15.3 then 16.3 — fourth order, confirmed. Gauss with nine nodes already has the answer to a microsecond, which on a $9.2\,\mathrm{km/s}$ perigee speed is seven millimetres of along-track position. Nine evaluations of a rational function, against Kepler's equation and its Newton iteration: for some applications this is the cheaper route to a time of flight, and for a *partial* arc that stops at an arbitrary true anomaly it generalises to perturbed motion where Kepler's equation does not.
:::

## When you cannot choose the nodes

Gauss–Legendre needs $f$ at irrational points like $0.861136311594053$ of the way along the interval. Three situations take that away.

**Sampled data.** Telemetry, an accelerometer log, a wind-tunnel sweep or a tabulated trajectory arrives on a grid you did not choose. You can interpolate to the Gauss nodes with a spline — and that is legitimate, and sometimes right — but the spline's own error then enters, and for an equally spaced grid composite Simpson is simpler and usually just as good. Integrate the data you have with Simpson; reserve Gauss for integrands you can call.

**Discontinuities.** Every error bound in this lesson contains a high derivative of $f$. At a jump there is no such derivative and the bounds say nothing.

::: example A throttle bucket wrecks the order
The same stage, but throttled from $7.6\,\mathrm{MN}$ to $5.0\,\mathrm{MN}$ between $t = 50\,\mathrm{s}$ and $t = 75\,\mathrm{s}$ to ride through max-Q, then back up. The mass history is continuous ($362{,}591.4\,\mathrm{kg}$ at $t=50$, $317{,}391.2$ at $t=75$, $138{,}760.1$ at $t=140$) but the acceleration jumps at both ends of the bucket. The exact $\Delta v$, summing the rocket equation over three constant-thrust arcs, is $3{,}544.95632\,\mathrm{m/s}$.

Composite Simpson over the whole interval at once:

| intervals | evaluations | relative error |
| --- | --- | --- |
| 8 | 9 | $1.90\times10^{-2}$ |
| 32 | 33 | $3.25\times10^{-3}$ |
| 128 | 129 | $4.96\times10^{-4}$ |
| 256 | 257 | $4.00\times10^{-4}$ |

The errors do not fall by 16 per halving; they fall erratically, at an overall rate of $h^{1.1}$ — first order. The method has lost three orders of convergence, and 257 evaluations buy four digits.

Now split the integral at $t = 50$ and $t = 75$ and integrate each smooth piece separately, using each piece's own thrust at the shared endpoints:

| scheme | evaluations | relative error |
| --- | --- | --- |
| Simpson, 2 intervals per piece | 7 | $2.45\times10^{-3}$ |
| Simpson, 4 intervals per piece | 13 | $2.21\times10^{-4}$ |
| Simpson, 8 intervals per piece | 25 | $1.59\times10^{-5}$ |
| Gauss, 4 nodes per piece | 12 | $2.82\times10^{-6}$ |
| Gauss, 6 nodes per piece | 18 | $4.96\times10^{-9}$ |

Fourth order is restored — the Simpson errors fall by 11 then 14, heading for 16 — and 25 evaluations now beat 257. Gauss with 18 evaluations beats them all by five orders of magnitude.
:::

::: warning
When you split at a discontinuity, the quadrature must use the *one-sided* value at the shared endpoint, not whatever the code returns at the switch time. A thrust model written as `5.0e6 if 50.0 <= t < 75.0 else 7.6e6` returns the throttled value exactly at $t = 50$, so integrating $[0, 50]$ with that function uses the wrong endpoint and quietly costs you three orders of convergence — the same failure the split was meant to fix. Pass each arc its own integrand, or evaluate at $50 - \delta$ and $50 + \delta$.
:::

**Peaks.** A sharply peaked integrand is smooth but expensive: the error bounds involve high derivatives, which are enormous at the peak. The stagnation-point heat load on a ballistic re-entry is the standard case. With the Sutton–Graves correlation $\dot q = k\sqrt{\rho/R_n}\,v^3$ and the Allen–Eggers solution for a ballistic entry into an exponential atmosphere, $v(z) = v_e\exp\!\left[-\frac{\rho_0 H}{2\beta\sin\gamma}e^{-z/H}\right]$, the heat load per unit area becomes a single altitude integral,

$$
Q = \frac{k}{\sin\gamma\sqrt{R_n}}\int_0^{z_{\text{top}}}\sqrt{\rho(z)}\;v(z)^2\,dz .
$$

For $v_e = 7{,}500\,\mathrm{m/s}$, $\gamma = 20^\circ$, ballistic coefficient $\beta = 400\,\mathrm{kg/m^2}$, $\rho_0 = 1.225\,\mathrm{kg/m^3}$ and $H = 7{,}200\,\mathrm{m}$, heating peaks at $z = 37.9\,\mathrm{km}$, where $\rho = 6.33\times10^{-3}\,\mathrm{kg/m^3}$ and the vehicle has slowed to $6{,}349\,\mathrm{m/s}$, 85% of entry speed. Almost all of the integral comes from a band about $20\,\mathrm{km}$ wide out of the $120\,\mathrm{km}$ range. Relative errors against a converged 400-node reference:

| evaluations | trapezoid | Simpson | Gauss–Legendre |
| --- | --- | --- | --- |
| 17 | $2.63\times10^{-5}$ | $7.81\times10^{-3}$ | $1.20\times10^{-4}$ |
| 33 | $1.23\times10^{-5}$ | $7.65\times10^{-6}$ | $8.31\times10^{-9}$ |
| 65 | $3.08\times10^{-6}$ | $7.10\times10^{-9}$ | $1.00\times10^{-15}$ |
| 129 | $7.71\times10^{-7}$ | $2.18\times10^{-10}$ | $6.7\times10^{-16}$ |

Read the first row with suspicion, not satisfaction: at 17 evaluations none of the rules resolves the peak, and the trapezoid's apparent win is a cancellation of errors, not accuracy. Rankings between quadrature rules mean something only once the integrand is resolved. From 33 evaluations on, the expected order reappears and Gauss runs away with it.

::: warning
A *periodic* integrand over a whole period reverses the usual ranking. Integrate the same time-of-flight integrand over a full revolution, $0$ to $2\pi$: the composite trapezoidal rule reaches a relative error of $1.7\times10^{-11}$ with 33 evaluations and machine precision with 65, while Simpson is at $5.0\times10^{-6}$ and Gauss at $2.0\times10^{-7}$ with the same 33. The reason is Euler–Maclaurin: the trapezoid's error is a series in the *differences of the odd derivatives at the two endpoints*, and for a periodic function those differences are all zero, so the entire asymptotic error series vanishes and convergence becomes exponential. Orbital averaging integrals, Fourier coefficients and anything integrated over a full cycle are in this class — use the trapezoid, and do not add Simpson weights, which spoil it.
:::

## Gauss nodes elsewhere in GNC

Gauss–Legendre nodes appear in two places you will meet again, and both are the same idea applied to a differential equation rather than an integral.

An **implicit Runge–Kutta method** whose stage nodes are the Gauss–Legendre points of $[0,1]$ attains order $2s$ with $s$ stages — the maximum possible — and is both A-stable and symplectic. The one-stage member is the implicit midpoint rule, $\mathbf{y}_{n+1} = \mathbf{y}_n + h\,\mathbf{f}(t_n + h/2, (\mathbf{y}_n + \mathbf{y}_{n+1})/2)$, second order, and like every member of that family it is both A-stable in the sense of the stiffness lesson and symplectic in the sense of the orbit lesson. The Radau methods mentioned as stiff solvers are the same construction with a different node family, trading symplecticity for L-stability.

**Direct collocation**, the workhorse of trajectory optimisation, discretises a trajectory by enforcing the dynamics at a set of nodes and letting an optimiser choose the states and controls there. Putting those nodes at Legendre–Gauss or Legendre–Gauss–Lobatto points rather than on a uniform grid is what makes a *pseudospectral* method: the same exponential convergence seen in the tables above, now in the accuracy of a whole trajectory for a given number of decision variables. It is the reason a landing or orbit-transfer problem can be solved to high accuracy with a few dozen nodes instead of a few thousand.

## Check yourself

::: check
Simpson's rule is built by integrating a quadratic through three points, yet it is exact for cubics. Show this on $[-h, h]$ and say why it matters.
:::

::: answer
Take $f(x) = x^3$ on $[-h, h]$. The exact integral is $\left[x^4/4\right]_{-h}^{h} = 0$ by symmetry. Simpson gives $\frac{h}{3}\left(f(-h) + 4f(0) + f(h)\right) = \frac{h}{3}\left(-h^3 + 0 + h^3\right) = 0$. Exact. The cubic term of the Taylor expansion about the midpoint is odd, so its error over a symmetric interval cancels, and the first term Simpson cannot integrate is the quartic: $\int_{-h}^{h}x^4dx = 2h^5/5$ while Simpson gives $\frac{h}{3}(h^4 + h^4) = 2h^5/3$. That free degree is why the error is $O(h^5)$ locally and $O(h^4)$ composite, rather than $O(h^4)$ and $O(h^3)$ — a whole order gained for nothing, and the reason Simpson rather than the three-eighths rule is the default.
:::

::: check
How many Gauss–Legendre nodes are needed to integrate a degree-9 polynomial exactly, and how many Simpson intervals? Which costs less?
:::

::: answer
Gauss–Legendre with $n$ nodes is exact to degree $2n-1$, so $2n - 1 \ge 9$ gives $n = 5$: five evaluations, exactly. Simpson's degree of exactness is 3, so no number of Simpson intervals integrates a degree-9 polynomial *exactly* — composite Simpson converges to the answer at $O(h^4)$ but never reaches it. To get, say, twelve digits you would need $h$ small enough that $\frac{(b-a)h^4}{180}\max|f^{(4)}|$ is below that, which for a typical case is hundreds of intervals. Five against hundreds, and exact against approximate: this is the whole case for Gauss quadrature on smooth integrands, and it is why collocation methods place their nodes at Gauss points.
:::

::: check
An accelerometer logs specific force at 100 Hz during a 140 s burn, and you want the $\Delta v$. Which rule, and what limits the accuracy?
:::

::: answer
Simpson, on the 14,001 samples as they arrive: the nodes are fixed by the sensor, so Gauss–Legendre is not available without interpolating first, which would add the interpolant's error for no benefit at this sample density. With $h = 0.01\,\mathrm{s}$ the Simpson truncation error is utterly negligible — $(b-a)h^4/180$ is $7.8\times10^{-9}$ times $\max|f^{(4)}|$ — so truncation is not what limits you. What limits you is the data: sensor noise (which the sum averages down, roughly as $1/\sqrt{N}$, so it is benign), sensor bias (which does *not* average down: a $100\,\mathrm{\mu g}$ bias over 140 s is $0.14\,\mathrm{m/s}$ of $\Delta v$ error, and no quadrature rule can help), quantisation, and any dropped or time-tagged-wrong samples. This is the usual situation with measured integrands: the rule stops mattering long before the data does.
:::

::: check
Your heat-load integral is computed with 8-node Gauss–Legendre over the whole entry, from $120\,\mathrm{km}$ to the ground, and disagrees with a fine Simpson evaluation by 3%. Is the Gauss implementation wrong?
:::

::: answer
Probably not; the integrand is probably under-resolved. The heating peak is about $20\,\mathrm{km}$ wide inside a $120\,\mathrm{km}$ interval, so eight nodes spread over the whole range put perhaps two inside the peak, and Gauss's exponential convergence only begins once the nodes resolve the structure — below that it is no better than anything else, as the first row of the heat-load table shows. Two checks settle it. Run with 16 and 32 nodes: if the answer converges, the 8-node result was simply too coarse. And split the interval into sub-intervals — say $0$–$20$, $20$–$60$, $60$–$120\,\mathrm{km}$ — with a Gauss rule on each, so the nodes concentrate where the integrand lives; a composite Gauss rule is usually the right answer for a peaked integrand, and an adaptive quadrature routine such as `scipy.integrate.quad` does exactly that subdivision automatically.
:::

::: check
Why do Newton–Cotes rules above eight intervals have negative weights, and what is the consequence?
:::

::: answer
A Newton–Cotes rule is obtained by integrating the polynomial that interpolates $f$ at equally spaced nodes. At high degree that interpolant suffers the Runge phenomenon — it oscillates with large amplitude near the ends of the interval — and integrating those oscillations produces weights that alternate in sign and grow. The nine-point rule is the first with negative weights. The consequences are two. Numerically, $\sum|w_i|$ exceeds $b-a$, so round-off in the $f_i$ is amplified instead of averaged, and the rule becomes less accurate as the degree rises. Physically, the rule can return a negative value for a strictly positive integrand, which for a heat load or a propellant mass is a nonsense result rather than an inaccurate one. Gauss–Legendre has positive weights for every $n$, which is exactly why raising its order is safe.
:::

## Summary

| Item | Statement |
| --- | --- |
| Quadrature | $\int_a^b f\,dx \approx \sum_i w_i f(x_i)$; a rule is a choice of nodes and weights |
| Trapezoid | $\frac{h}{2}[f_0 + 2f_1 + \cdots + 2f_{n-1} + f_n]$, error $-\frac{(b-a)h^2}{12}f''$, degree 1 |
| Simpson | $\frac{h}{3}[f_0 + 4f_1 + 2f_2 + \cdots + 4f_{n-1} + f_n]$, $h = (b-a)/n$, $n$ even; error $-\frac{(b-a)h^4}{180}f^{(4)}$, degree 3 |
| Degree of exactness | Highest polynomial degree integrated exactly: trapezoid 1, Simpson 3, Boole 5 |
| Newton–Cotes limit | Weights first go negative at nine nodes; stop at Boole and refine instead |
| Gauss–Legendre | $n$ nodes give degree $2n-1$; nodes are the roots of $P_n$, $w_i = 2/\{(1-x_i^2)[P_n'(x_i)]^2\}$ |
| Gauss nodes | $n=2$: $\pm1/\sqrt3$, $w = 1,1$. $n=3$: $0, \pm\sqrt{3/5}$, $w = 8/9, 5/9$ |
| Interval map | $x = \frac{a+b}{2} + \frac{b-a}{2}\xi$, multiply the sum by $\frac{b-a}{2}$ |
| Gauss error | $\propto f^{(2n)}$: exponential convergence on a smooth integrand, not algebraic |
| Measured | Ideal $\Delta v$ to machine precision with 17 Gauss nodes; Simpson at 17 evaluations is at $4\times10^{-5}$ |
| Discontinuities | Simpson drops to first order across a jump; split at the jump and use one-sided endpoint values |
| Peaks | Coarse rankings are meaningless; subdivide so the nodes resolve the peak |
| Periodic integrands | Composite trapezoid converges exponentially over a full period (Euler–Maclaurin); do not use Simpson there |
| Sampled data | Nodes are fixed, so Simpson; the limit is sensor bias, not truncation |
| Elsewhere | Gauss nodes give order-$2s$ symplectic A-stable implicit Runge–Kutta methods and pseudospectral collocation |

One topic remains, and it sits underneath several of the others: the Newton step of the root-finding lesson, the implicit step of the stiffness lesson and the spline of the interpolation lesson all end in a linear solve. The last lesson asks when the answer to $\mathbf{A}\mathbf{x} = \mathbf{b}$ can be trusted, what conditioning measures, and how the structure of $\mathbf{A}$ — tridiagonal, banded, sparse — decides whether the solve is possible at all.
