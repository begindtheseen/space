---
id: l08-interpolation-linear-and-cubic-spline
title: Interpolation, linear and cubic spline
minutes: 28
covers:
  - 'interpolation: linear and cubic spline'
---

A flight computer never has the number it needs. It has a table. Atmospheric density is stored at 1 km intervals and the vehicle is at 3,472 m. The aerodynamic database gives drag coefficient at Mach 0.9 and Mach 1.2 and the vehicle is at Mach 1.05. The ephemeris of the Moon is tabulated every six hours and the guidance update is at 14:37:22. The adaptive integrator from the fourth lesson landed its steps at 1,213 s and 1,389 s and telemetry wants a sample at 1,300 s. In every case the answer comes from an interpolant: a function built from the table that agrees with it at the tabulated points and gives something defensible in between.

The choice of interpolant is a real engineering decision with three axes. *Accuracy*, which depends on the spacing of the table and the smoothness of what is being interpolated. *Smoothness of the result*, which matters when the interpolated quantity is differentiated — a guidance reference trajectory whose second derivative jumps commands a discontinuous acceleration, and the control loop feels it. And *cost and determinism*, because the lookup runs inside a real-time frame.

This lesson builds two interpolants and the theory to choose between them. Linear interpolation is one line of code, $O(h^2)$ accurate, and the right answer more often than people expect. The cubic spline is $C^2$ — value, slope and curvature all continuous at every knot — and $O(h^4)$ accurate if its end conditions are set properly, which is the part everyone gets wrong. Along the way the lesson shows why fitting a single high-degree polynomial through a whole table is a mistake, and ends with the cubic Hermite interpolant that gives an integrator dense output across a step.

## Linear interpolation and its error

Between two tabulated points $(x_i, y_i)$ and $(x_{i+1}, y_{i+1})$, with $h = x_{i+1} - x_i$ and $t = (x - x_i)/h \in [0, 1]$,

$$
p(x) = (1 - t)\,y_i + t\,y_{i+1} = y_i + t\,(y_{i+1} - y_i) .
$$

The error follows from the interpolation error formula. For a function $f$ interpolated at two points there is a $\xi$ in the interval with

$$
f(x) - p(x) = \frac{f''(\xi)}{2}\,(x - x_i)(x - x_{i+1}) .
$$

The quadratic $(x-x_i)(x-x_{i+1})$ is largest in magnitude at the midpoint, where it equals $-h^2/4$. So

$$
\max_{[x_i,\,x_{i+1}]} |f - p| \le \frac{h^2}{8}\,\max |f''| .
$$

That bound is the whole design rule for a lookup table. It says the error scales as the *square* of the spacing — halve the spacing, quarter the error — and that what matters about the tabulated function is its second derivative, its curvature. A table of something nearly straight can be coarse; a table of something that bends must be fine.

::: example Sizing a density table for a launch vehicle
The 1976 standard atmosphere's troposphere layer, 0 to 11 km, has $T(z) = T_0 + Lz$ with $T_0 = 288.15\,\mathrm{K}$ and $L = -0.0065\,\mathrm{K/m}$, and

$$
\rho(z) = \rho_0\left(1 + \frac{Lz}{T_0}\right)^{-g_0/(LR) - 1},
\qquad \rho_0 = 1.225\,\mathrm{kg/m^3},
$$

with $g_0 = 9.80665\,\mathrm{m/s^2}$ and $R = 287.05287\,\mathrm{J/(kg\,K)}$, giving the exponent $4.25588$. Tabulating every kilometre:

| $z$ (km) | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| $\rho$ ($\mathrm{kg/m^3}$) | 1.225000 | 1.111642 | 1.006490 | 0.909122 | 0.819129 | 0.736116 |

| $z$ (km) | 6 | 7 | 8 | 9 | 10 | 11 |
| --- | --- | --- | --- | --- | --- | --- |
| $\rho$ ($\mathrm{kg/m^3}$) | 0.659697 | 0.589501 | 0.525167 | 0.466348 | 0.412706 | 0.363918 |

The second derivative is largest in *relative* terms at the top of the layer: $\rho''/\rho = 1.2473\times10^{-8}\,\mathrm{m^{-2}}$ at 11 km against $7.05\times10^{-9}$ at sea level. The predicted worst relative error at $h = 1{,}000\,\mathrm{m}$ is

$$
\frac{h^2}{8}\,\frac{\rho''}{\rho} = \frac{10^6}{8} \times 1.2473\times10^{-8} = 1.56\times10^{-3},
$$

and the measured worst relative error over the layer is $1.51\times10^{-3}$ — the bound is tight to 3%. To hold the density to 0.1% you need $h = \sqrt{10^{-3}/1.559\times10^{-9}} = 801\,\mathrm{m}$, so a 500 m table. In dynamic-pressure terms at 11 km and $400\,\mathrm{m/s}$, where $q = \tfrac12\rho v^2 = 29.1\,\mathrm{kPa}$, the 1 km table's 0.15% is $44\,\mathrm{Pa}$ of $q$ — usually acceptable, and now a number you can defend rather than a hope.
:::

::: key
Linear interpolation: $p(x) = (1-t)y_i + t\,y_{i+1}$ with $t = (x - x_i)/h$. Its error is bounded by $\frac{h^2}{8}\max|f''|$ on the interval — second order in the table spacing, governed by the curvature of what is tabulated. Halving the spacing quarters the error.
:::

## Interpolate the logarithm, not the value

Atmospheric density falls roughly exponentially with altitude, $\rho \approx \rho_0 e^{-z/H}$ with a scale height $H$ of about $9\,\mathrm{km}$ in the troposphere and $7$ to $8\,\mathrm{km}$ higher up. An exponential has large curvature, so linear interpolation of $\rho$ itself is fighting the physics. But $\ln\rho$ is very nearly a straight line, and a straight line is interpolated *exactly*.

So do the interpolation in the log: store $\ln\rho_i$, interpolate linearly, exponentiate. One extra `exp` at run time, none of the error. On the table above this cuts the worst relative error from $1.51\times10^{-3}$ to $4.65\times10^{-4}$, a factor of 3.3 for free — and it never returns a negative density, which linear interpolation of a steeply falling $\rho$ near the top of a table can.

The general principle is worth more than the example: **interpolate the quantity that is closest to straight**. Log density with altitude. Semi-major axis and eccentricity, rather than position, for an ephemeris over a long span. The *residual* against an analytic model, rather than the quantity itself, whenever an analytic model exists. Every one of those choices reduces $\max|f''|$, which is the only thing in the error bound you control besides the spacing.

## Why not a single polynomial through the whole table

Given $n+1$ points there is exactly one polynomial of degree $n$ through them. It is tempting to use it: one formula, no interval logic, exact at every knot. It is almost always a mistake, and the failure is not subtle.

::: example A degree-10 polynomial through a drag table
Take a model transonic drag rise for a slender body — a shape, not wind-tunnel data:

$$
C_D(M) = 0.20 + \frac{0.55}{1 + \left(\dfrac{M - 1.05}{0.18}\right)^2},
$$

peaking at $C_D = 0.75$ at $M = 1.05$ and settling to 0.20 supersonically. Tabulate it at 11 points, $M = 0, 0.3, 0.6, \ldots, 3.0$, and compare the interpolants against the model on a fine grid.

| Interpolant | max error over $[0, 3]$ | max error over $[1.8, 3.0]$, where the curve is flat |
| --- | --- | --- |
| Linear | 0.225 | 0.0017 |
| Cubic spline | 0.178 | 0.0041 |
| Degree-10 polynomial | 0.422 | 0.422 |

All three miss the peak badly, because the table does not sample it — no interpolant recovers a feature that is not in the data, and the fix for that is a finer table near Mach 1, which is exactly why real aerodynamic databases are dense in the transonic region. But look at the second column. Where the curve is flat and well sampled, linear and spline interpolation are good to a fraction of a percent, while the polynomial is *worse there than anywhere*: at $M = 2.91$ it returns $C_D = -0.217$, a negative drag coefficient. At $M = 0.15$ it returns 0.0065 against the true 0.221.

This is the **Runge phenomenon**: a high-degree interpolant through equally spaced points oscillates with growing amplitude towards the ends of the interval, and refining the table makes it worse. Refine this table to 0.1 Mach spacing, 31 points, and the spline's worst error falls to 0.0085 and linear's to 0.039, while the degree-30 polynomial's worst error is $7.4\times10^{3}$.
:::

The rule that follows is absolute in practice: **never fit one polynomial of high degree to a table**. Use a low-degree piecewise interpolant — linear, or cubic pieces joined smoothly — so that each piece depends only on nearby data and a bad point cannot corrupt the far end of the table. That is what a spline is.

## The cubic spline

A **cubic spline** $S(x)$ through knots $x_0 < x_1 < \cdots < x_n$ is a cubic polynomial on each interval, joined so that $S$, $S'$ and $S''$ are all continuous at every interior knot. Count the conditions: $n$ cubics have $4n$ coefficients; interpolation at both ends of each interval is $2n$ conditions; continuity of $S'$ and $S''$ at the $n-1$ interior knots is $2(n-1)$ more. That is $4n - 2$, so two conditions are left over — the *end conditions*, and the next section shows they matter enormously.

The clean way to construct it is through the second derivatives. Write $M_i = S''(x_i)$, the *moments*. On $[x_i, x_{i+1}]$ with $h_i = x_{i+1} - x_i$, $S''$ is linear, so

$$
S''(x) = M_i\,\frac{x_{i+1} - x}{h_i} + M_{i+1}\,\frac{x - x_i}{h_i} .
$$

Integrate twice and choose the two constants so that $S(x_i) = y_i$ and $S(x_{i+1}) = y_{i+1}$:

$$
S(x) = \frac{M_i (x_{i+1}-x)^3 + M_{i+1}(x - x_i)^3}{6 h_i}
+ \left(\frac{y_i}{h_i} - \frac{M_i h_i}{6}\right)(x_{i+1}-x)
+ \left(\frac{y_{i+1}}{h_i} - \frac{M_{i+1} h_i}{6}\right)(x - x_i).
$$

Every condition is now satisfied except continuity of $S'$. Differentiate the expression on $[x_{i-1}, x_i]$ and on $[x_i, x_{i+1}]$, evaluate both at $x_i$, and set them equal. After collecting terms:

$$
h_{i-1}M_{i-1} + 2(h_{i-1} + h_i)M_i + h_i M_{i+1}
= 6\left(\frac{y_{i+1} - y_i}{h_i} - \frac{y_i - y_{i-1}}{h_{i-1}}\right),
\qquad i = 1, \ldots, n-1 .
$$

That is $n-1$ linear equations in the $n+1$ unknowns $M_0, \ldots, M_n$; the two end conditions close it. The matrix is **tridiagonal** — each row touches only $M_{i-1}, M_i, M_{i+1}$ — and it is strictly diagonally dominant, since $2(h_{i-1}+h_i) > h_{i-1} + h_i$, so it is nonsingular and can be solved without pivoting. On a uniform grid it reduces to

$$
M_{i-1} + 4M_i + M_{i+1} = \frac{6}{h^2}\left(y_{i+1} - 2y_i + y_{i-1}\right),
$$

with the second difference of the data on the right, which is a discrete second derivative: the spline is choosing curvatures that reproduce the data's curvature, smoothed across neighbours.

::: key
A cubic spline is $C^2$: value, first derivative and second derivative are continuous at every knot. The natural cubic spline additionally sets $S''= 0$ at both ends. Its moments $M_i = S''(x_i)$ satisfy a tridiagonal, diagonally dominant system, $h_{i-1}M_{i-1} + 2(h_{i-1}+h_i)M_i + h_i M_{i+1} = 6[(y_{i+1}-y_i)/h_i - (y_i-y_{i-1})/h_{i-1}]$, solved in $O(n)$ by the Thomas algorithm. That $C^2$ smoothness is why splines are used for guidance reference trajectories: the commanded acceleration is continuous.
:::

## Solving the system in linear time

A tridiagonal system is solved by Gaussian elimination that never has to look outside the three diagonals: the **Thomas algorithm**, one forward sweep and one back substitution, $O(n)$ work and $O(n)$ storage. For a 1,000-knot table that is about $8{,}000$ operations instead of the $3\times10^{8}$ a dense solve would cost. This is the first and simplest instance of the point the last lesson of this module makes at length: a matrix with structure should never be handed to a general solver.

```python
def cubic_spline(x, y):
    """Natural cubic spline through (x, y). Returns M[i] = S''(x_i).

    Interior knots give  h[i-1] M[i-1] + 2(h[i-1]+h[i]) M[i] + h[i] M[i+1]
                       = 6 ( (y[i+1]-y[i])/h[i] - (y[i]-y[i-1])/h[i-1] ),
    a tridiagonal system solved here by the Thomas algorithm in O(n).
    """
    n = len(x) - 1
    h = [x[i + 1] - x[i] for i in range(n)]
    lower = [h[i] for i in range(n - 1)]
    diag = [2 * (h[i] + h[i + 1]) for i in range(n - 1)]
    upper = [h[i + 1] for i in range(n - 1)]
    rhs = [6 * ((y[i + 2] - y[i + 1]) / h[i + 1] - (y[i + 1] - y[i]) / h[i])
           for i in range(n - 1)]
    for i in range(1, n - 1):                       # forward elimination
        f = lower[i] / diag[i - 1]
        diag[i] -= f * upper[i - 1]
        rhs[i] -= f * rhs[i - 1]
    m = [0.0] * (n - 1)
    m[-1] = rhs[-1] / diag[-1]
    for i in range(n - 3, -1, -1):                  # back substitution
        m[i] = (rhs[i] - upper[i] * m[i + 1]) / diag[i]
    return [0.0] + m + [0.0]                        # natural ends: S'' = 0


def spline_value(x, y, M, xq):
    """Evaluate the spline at xq."""
    i = max(0, min(len(x) - 2,
                   next((k for k in range(len(x) - 1) if xq < x[k + 1]), len(x) - 2)))
    h = x[i + 1] - x[i]
    a, b = x[i + 1] - xq, xq - x[i]
    return ((M[i] * a ** 3 + M[i + 1] * b ** 3) / (6 * h)
            + (y[i] / h - M[i] * h / 6) * a
            + (y[i + 1] / h - M[i + 1] * h / 6) * b)
```

On the density table above, `spline_value` at $z = 3{,}500\,\mathrm{m}$ returns $0.86322097\,\mathrm{kg/m^3}$ against the exact $0.86322863$ — a relative error of $8.9\times10^{-6}$, where linear interpolation gives $0.86412550$, off by $1.0\times10^{-3}$.

## End conditions decide the order

The two leftover conditions are not a detail. Three choices are in common use:

- **Natural**: $M_0 = M_n = 0$. Simple, and wrong unless the function really has zero curvature at the ends. The error it introduces at the boundary is $O(h^2)$, and it propagates inward, decaying by a factor of about $2 - \sqrt{3} = 0.268$ per knot. The whole spline is then $O(h^2)$ — the same order as linear interpolation.
- **Clamped** (complete): $S'(x_0) = f'(x_0)$, $S'(x_n) = f'(x_n)$, using derivatives you know analytically or measured. Gives the full $O(h^4)$, with the bound $\max|f - S| \le \frac{5}{384}h^4\max|f^{(4)}|$.
- **Not-a-knot**: require $S'''$ to be continuous at $x_1$ and $x_{n-1}$, so the first two pieces are one cubic and the last two are one cubic. Needs no extra information and recovers $O(h^4)$. It is the default in `scipy.interpolate.CubicSpline` and in MATLAB's `spline`, and it is what you should use when you do not know the end slopes.

::: example What the end condition costs
Interpolating the 1976 troposphere density, worst absolute error over 0 to 11 km, as the knot spacing is halved:

| spacing | linear | natural spline | not-a-knot spline | clamped spline |
| --- | --- | --- | --- | --- |
| $2{,}200\,\mathrm{m}$ | $4.94\times10^{-3}$ | $2.06\times10^{-3}$ | $8.33\times10^{-6}$ | $7.58\times10^{-7}$ |
| $1{,}100\,\mathrm{m}$ | $1.27\times10^{-3}$ | $5.13\times10^{-4}$ | $5.12\times10^{-7}$ | $4.74\times10^{-8}$ |
| $550\,\mathrm{m}$ | $3.22\times10^{-4}$ | $1.28\times10^{-4}$ | $3.21\times10^{-8}$ | $2.97\times10^{-9}$ |
| $275\,\mathrm{m}$ | $8.11\times10^{-5}$ | $3.21\times10^{-5}$ | $2.01\times10^{-9}$ | $1.85\times10^{-10}$ |

Read the ratios down each column. Linear divides by 4 (second order). The natural spline also divides by 4 — second order, a mere factor of 2.5 better than linear, all because of two badly chosen end conditions. Not-a-knot and clamped divide by 16 (fourth order), and at the 1 km spacing of a realistic onboard table the not-a-knot spline's worst relative density error is $8.7\times10^{-7}$ against linear's $1.5\times10^{-3}$ — better by a factor of 1,750, for one tridiagonal solve done once on the ground.
:::

::: warning
Do not reach for a natural cubic spline because the word "natural" sounds like a default. It is the only common end condition that destroys the method's order. Use not-a-knot when you know nothing about the ends, clamped when you know the slopes. The natural condition is right only when the physical quantity genuinely has zero curvature at the ends of the table — which is rare, and which you should be able to say why.
:::

## Dense output: interpolating inside an integrator step

The adaptive-stepping lesson promised this. An adaptive integrator lands its steps where its controller sends it, not where you want output, and shortening steps to hit output times wrecks the error behaviour and the step count. The fix is to interpolate inside the step — but with more than the endpoint values, because the integrator also gives you the *derivatives* $\mathbf{f}_n$ and $\mathbf{f}_{n+1}$ for free.

Four pieces of data determine a cubic. The **cubic Hermite interpolant** on $[t_n, t_{n+1}]$, with $\theta = (t - t_n)/h$, is

$$
\mathbf{u}(\theta) = (1-\theta)\mathbf{y}_n + \theta\,\mathbf{y}_{n+1}
+ \theta(\theta - 1)\Big[(1 - 2\theta)(\mathbf{y}_{n+1} - \mathbf{y}_n)
+ (\theta - 1)h\,\mathbf{f}_n + \theta h\,\mathbf{f}_{n+1}\Big].
$$

Check it: at $\theta = 0$ the bracket is multiplied by zero and $\mathbf{u} = \mathbf{y}_n$; at $\theta = 1$, $\mathbf{u} = \mathbf{y}_{n+1}$; and differentiating gives $\mathbf{u}'(0) = h\mathbf{f}_n$, $\mathbf{u}'(1) = h\mathbf{f}_{n+1}$. It reproduces cubics exactly and has error $O(h^4)$ across the step.

::: example Dense output across one RK4 orbit step
One RK4 step of $h = 60\,\mathrm{s}$ on the circular 500 km orbit, from the exact state at $t = 0$. The endpoint error is $7.5\times10^{-5}\,\mathrm{km} = 7.5\,\mathrm{cm}$. Now interpolate inside the step and compare with the analytic circular solution:

| $\theta$ | $t$ (s) | cubic Hermite error | linear-in-time error |
| --- | --- | --- | --- |
| 0.1 | 6 | $0.045\,\mathrm{m}$ | $1{,}365\,\mathrm{m}$ |
| 0.3 | 18 | $0.247\,\mathrm{m}$ | $3{,}185\,\mathrm{m}$ |
| 0.5 | 30 | $0.353\,\mathrm{m}$ | $3{,}791\,\mathrm{m}$ |
| 0.7 | 42 | $0.257\,\mathrm{m}$ | $3{,}185\,\mathrm{m}$ |
| 0.9 | 54 | $0.089\,\mathrm{m}$ | $1{,}365\,\mathrm{m}$ |

The worst Hermite error over the whole step is $0.35\,\mathrm{m}$; straight-line interpolation between the same two states is worst at $3{,}791\,\mathrm{m}$, ten thousand times larger, because a chord across a $60\,\mathrm{s}$ arc of a $6{,}878\,\mathrm{km}$ circle cuts $3.8\,\mathrm{km}$ off it. Using the derivatives you already have costs nothing and buys four orders of magnitude.
:::

Production integrators do better still. Dormand–Prince 5(4) carries an extra stage that makes its dense output fourth-order accurate, matching the step; `solve_ivp(..., dense_output=True)` returns exactly this, and `sol(t)` evaluates it. The cubic Hermite above is the version you can write from memory with nothing but the endpoints and their derivatives, and it is good enough for most telemetry and event detection.

## Practicalities

**Splines overshoot.** A $C^2$ spline through a table with a sharp step will swing outside the data range, because continuity of curvature forces it to. Through the values $0, 0, 0, 1, 1, 1$ at $x = 0, \ldots, 5$, the natural spline reaches $-0.109$ and $1.109$: it goes 11% below and above the data. If that table is a throttle fraction, a mass fraction or a density, the interpolant has just produced a physically impossible number. When monotonicity matters more than smoothness, use a shape-preserving scheme: PCHIP (`scipy.interpolate.PchipInterpolator`) is $C^1$ rather than $C^2$ and never overshoots. The trade is exactly that — smoothness for shape.

**Never extrapolate.** Every error bound in this lesson is for $x$ inside the table. Outside it, a cubic piece grows like $x^3$ and the error is unbounded. Clamp the query to the table's range and flag it, or make the table cover the flight envelope with margin. An out-of-range density query during a lofted abort trajectory is a classic way to get a nonsense drag force at the worst possible moment.

**The lookup is not free.** Finding the right interval costs $O(\log n)$ by binary search, or $O(1)$ if the table is uniformly spaced and you can compute the index directly — a strong reason to use uniform tables in flight software. If successive queries are close together, as they are when the altitude changes slowly, start the search from the previous index and step outward; that is $O(1)$ in practice. Once the interval is found, evaluating a cubic is about ten operations, and the spline coefficients themselves are computed once on the ground and stored, never recomputed in flight.

## Check yourself

::: check
A drag table is to be built for a re-entry vehicle by tabulating $C_D$ against Mach. Between Mach 3 and Mach 6 the curve is nearly flat, with $|C_D''| \le 0.004$ per $\mathrm{Mach}^2$; between Mach 0.8 and 1.4 it has $|C_D''| \le 9$ per $\mathrm{Mach}^2$. What spacing does each region need for a linear-interpolation error of 0.002 in $C_D$?
:::

::: answer
From $\frac{h^2}{8}\max|f''| \le 0.002$, $h \le \sqrt{0.016/\max|f''|}$. Supersonic: $h \le \sqrt{0.016/0.004} = \sqrt{4} = 2.0$ Mach — one point at Mach 3 and one at Mach 5 would do, so the region costs almost nothing. Transonic: $h \le \sqrt{0.016/9} = 0.042$ Mach, so about 15 points across the interval from 0.8 to 1.4. The ratio of required spacings is $\sqrt{9/0.004} = 47$. This is why aerodynamic databases are non-uniform in Mach and why a uniform table sized for the transonic region wastes most of its entries: the spacing should follow $1/\sqrt{|f''|}$.
:::

::: check
You replace linear interpolation of a 1 km density table with a natural cubic spline and measure only a factor of 2.6 improvement, not the factor of a thousand you expected from "fourth order". Explain, and give the fix.
:::

::: answer
The natural end condition sets $S'' = 0$ at both ends of the table, and the true $\rho''$ there is not zero — it is $8.6\times10^{-9}$ at sea level and $4.5\times10^{-9}$ at 11 km. That wrong curvature is an $O(h^2)$ error at the boundary, and it propagates inward, decaying by about 0.268 per knot but never vanishing. The result is a globally $O(h^2)$ interpolant that beats linear only by a constant factor. The fix is to change the end condition: not-a-knot needs no extra information and restores $O(h^4)$ (measured worst relative error $8.7\times10^{-7}$ on the same table), and clamping with the analytic $\rho'$ at both ends does slightly better still. The spline construction was never the problem.
:::

::: check
An adaptive propagator takes steps of 180 s through apogee and telemetry wants states every 10 s. Give two ways to produce them and say which is right and why.
:::

::: answer
Either force the integrator to land on every 10 s boundary, or integrate with the natural steps and interpolate. Forcing the steps is wrong: it cuts the step from 180 s to 10 s, multiplying the step count by eighteen through the region where the controller had correctly decided that long steps were safe, and it changes the error behaviour because the controller is no longer choosing the step. Interpolating is right: the cubic Hermite interpolant using the endpoint states and derivatives is $O(h^4)$ across the step and costs about ten operations per output sample. Across a 180 s step on a smooth apogee arc it is far more accurate than the integration error itself, so the output carries the integrator's accuracy rather than the interpolant's.
:::

::: check
A guidance reference trajectory is stored as a table of commanded position against time, and the autopilot differentiates it twice to get a feedforward acceleration. What goes wrong with linear interpolation, and what does a cubic spline give you?
:::

::: answer
Linear interpolation is $C^0$: the value is continuous but the slope jumps at every knot, so the first derivative is a staircase and the second derivative is zero inside each interval and an impulse at each knot. Differentiating it twice gives nothing usable — the feedforward acceleration is either zero or infinite, and the commanded velocity steps at every table point, which the attitude loop sees as a train of small step commands at the table rate. A cubic spline is $C^2$: the interpolated position has a continuous velocity and a continuous acceleration, so the feedforward is a smooth, bounded signal. This is the reason splines are the standard representation for reference trajectories, and it is a smoothness requirement rather than an accuracy requirement — a finer linear table does not fix it, because the derivative is discontinuous at any spacing.
:::

::: check
Why is the spline's tridiagonal system solvable without pivoting, and what does that buy you in flight software?
:::

::: answer
Row $i$ has diagonal entry $2(h_{i-1} + h_i)$ and off-diagonal entries $h_{i-1}$ and $h_i$, all positive, so $|2(h_{i-1}+h_i)| > |h_{i-1}| + |h_i|$: the matrix is strictly diagonally dominant. Such a matrix is nonsingular and Gaussian elimination on it is stable without row interchanges, so the Thomas algorithm — one forward sweep, one back substitution — is both correct and $O(n)$ in time and storage. In flight software that means fixed, predictable execution time with no data-dependent branching for pivot selection, and no need to store the full matrix. In practice the coefficients are computed once on the ground anyway; what flies is the evaluation, which is an interval lookup plus about ten floating-point operations.
:::

## Summary

| Item | Statement |
| --- | --- |
| Linear interpolation | $p(x) = (1-t)y_i + t\,y_{i+1}$, $t = (x-x_i)/h$; error $\le \frac{h^2}{8}\max\lvert f''\rvert$ |
| Table sizing | Spacing for a target error scales as $1/\sqrt{\max\lvert f''\rvert}$; halving $h$ quarters the error |
| Transform first | Interpolate $\ln\rho$, not $\rho$: exact for an exponential atmosphere, 3.3× better on the 1976 troposphere table |
| Runge phenomenon | A single high-degree polynomial through equally spaced points oscillates near the ends and gets worse as the table is refined; a degree-30 fit to a 31-point drag table errs by $7\times10^{3}$ |
| Cubic spline | Piecewise cubic, $C^2$: value, first and second derivative continuous at every knot |
| Moment equations | $h_{i-1}M_{i-1} + 2(h_{i-1}+h_i)M_i + h_iM_{i+1} = 6\left[\frac{y_{i+1}-y_i}{h_i} - \frac{y_i-y_{i-1}}{h_{i-1}}\right]$, tridiagonal and diagonally dominant |
| Thomas algorithm | $O(n)$ solve, no pivoting needed |
| End conditions | Natural ($S''=0$) is $O(h^2)$; clamped ($S'$ given) and not-a-knot ($S'''$ continuous at $x_1$, $x_{n-1}$) are $O(h^4)$, bound $\frac{5}{384}h^4\max\lvert f^{(4)}\rvert$ |
| Cubic Hermite | $\mathbf{u}(\theta) = (1-\theta)\mathbf{y}_n + \theta\mathbf{y}_{n+1} + \theta(\theta-1)[(1-2\theta)(\mathbf{y}_{n+1}-\mathbf{y}_n) + (\theta-1)h\mathbf{f}_n + \theta h\mathbf{f}_{n+1}]$; the integrator's dense output |
| Dense output value | $0.35\,\mathrm{m}$ worst error across a 60 s RK4 orbit step against $3{,}791\,\mathrm{m}$ for a straight line |
| Overshoot | Splines leave the data range at steps (11% on a unit step); use PCHIP when monotonicity matters |
| Never extrapolate | All bounds hold inside the table only |

The next lesson takes the derivative rather than the value: how to differentiate a function you can only evaluate, why finite differences lose a third of your digits no matter how carefully you choose the step, and the complex-step trick that avoids the loss entirely.
