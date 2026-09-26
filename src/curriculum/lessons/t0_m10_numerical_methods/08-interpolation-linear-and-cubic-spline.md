---
id: l08-interpolation-linear-and-cubic-spline
title: Interpolation, linear and cubic spline
minutes: 26
covers:
  - 'interpolation: linear and cubic spline'
---

A road has a mile marker every mile. You are parked 40% of the way from marker 12 to marker 13, so you say you are at mile 12.4. You have **interpolated**: you guessed a value *between* two known ones.

A flight computer does this constantly, because it never has the number it needs — it has a table. Air density is stored every kilometer and the vehicle is at 3,472 m. The drag database lists Mach 0.9 and Mach 1.2 and the vehicle is at Mach 1.05. The Moon's position, its **[[ephemeris|ephemeris]]**, is listed every six hours and guidance wants 14:37:22. An adaptive integrator landed its steps at 1,213 s and 1,389 s and telemetry wants 1,300 s. Each time the answer comes from an **[[interpolant|interpolant]]**: a function built from the table that matches it at the listed points and gives something defensible in between.

Choosing one is a real engineering decision with three sides. *Accuracy*, which depends on the table spacing and on how smooth the tabulated thing is. *Smoothness*, which matters when the result gets differentiated: a guidance reference trajectory whose second derivative jumps commands a jumping acceleration, and the control loop feels it. And *cost and predictability*, because the lookup runs inside a real-time frame. This lesson builds linear interpolation and the cubic spline, shows why one big polynomial through a table is a mistake, and ends with the interpolant that gives an integrator output between its steps.

## Linear interpolation and its error

Linear interpolation joins neighboring points with straight lines. Between $(x_i, y_i)$ and $(x_{i+1}, y_{i+1})$, let $h = x_{i+1} - x_i$ be the spacing and $t = (x - x_i)/h$ the fraction of the way across, from 0 to 1. Then

$$
p(x) = (1 - t)\,y_i + t\,y_{i+1} = y_i + t\,(y_{i+1} - y_i) .
$$

At $t = 0.4$ that is 60% of $y_i$ plus 40% of $y_{i+1}$ — the mile-marker guess.

How wrong can it be? A straight line matches a curve exactly only when the curve does not bend. The error comes from the bending, measured by the second derivative $f''$ ("f double prime"), the **curvature**. The interpolation error formula says that for some point $\xi$ ("xi") in the interval,

$$
f(x) - p(x) = \frac{f''(\xi)}{2}\,(x - x_i)(x - x_{i+1}) .
$$

The product $(x-x_i)(x-x_{i+1})$ is zero at both ends and biggest in size at the **[[midpoint|chord-gap]]**, where each factor is $h/2$ in size, giving $h^2/4$. Multiply by $\tfrac12$:

$$
\max_{[x_i,\,x_{i+1}]} |f - p| \le \frac{h^2}{8}\,\max |f''| .
$$

That bound is the whole design rule for a lookup table. The error grows as the *square* of the spacing: halve the spacing, quarter the error. And what matters about the tabulated function is its curvature. Something nearly straight can have a coarse table; something that bends needs a fine one.

::: example Sizing a density table for a launch vehicle
In the lowest layer of the **[[1976 standard atmosphere|standard-atmosphere]]**, 0 to 11 km, temperature falls in a straight line, $T(z) = T_0 + Lz$ with $T_0 = 288.15\,\mathrm{K}$ and $L = -0.0065\,\mathrm{K/m}$. The density is

$$
\rho(z) = \rho_0\left(1 + \frac{Lz}{T_0}\right)^{-g_0/(LR) - 1},
\qquad \rho_0 = 1.225\,\mathrm{kg/m^3},
$$

with $g_0 = 9.80665\,\mathrm{m/s^2}$ and $R = 287.05287\,\mathrm{J/(kg\,K)}$, so the exponent is $4.25588$. Tabulated every kilometer:

| $z$ (km) | 0 | 1 | 2 | 3 | 4 | 5 |
| --- | --- | --- | --- | --- | --- | --- |
| $\rho$ ($\mathrm{kg/m^3}$) | $1.225000$ | $1.111642$ | $1.006490$ | $0.909122$ | $0.819129$ | $0.736116$ |

| $z$ (km) | 6 | 7 | 8 | 9 | 10 | 11 |
| --- | --- | --- | --- | --- | --- | --- |
| $\rho$ ($\mathrm{kg/m^3}$) | $0.659697$ | $0.589501$ | $0.525167$ | $0.466348$ | $0.412706$ | $0.363918$ |

Relative to the density itself, the curvature is largest at the top: $\rho''/\rho = 1.2473\times10^{-8}\,\mathrm{m^{-2}}$ at 11 km, against $7.05\times10^{-9}$ at sea level. So the predicted worst relative error at $h = 1{,}000\,\mathrm{m}$ is

$$
\frac{h^2}{8}\,\frac{\rho''}{\rho} = \frac{10^6}{8} \times 1.2473\times10^{-8} = 1.56\times10^{-3}.
$$

Checking on a fine grid, the actual worst relative error is $1.51\times10^{-3}$. The bound is tight to 3%.

To hold density to 0.1%, solve $\frac{h^2}{8} \times 1.247\times10^{-8} = 10^{-3}$: $h = \sqrt{8\times10^{-3}/1.247\times10^{-8}} = 801\,\mathrm{m}$, so use a 500 m table. Is 0.15% acceptable? At 11 km and $400\,\mathrm{m/s}$ the dynamic pressure is $q = \tfrac12\rho v^2 = 29.1\,\mathrm{kPa}$, and 0.15% of that is $44\,\mathrm{Pa}$ — usually fine, and now a number you can defend rather than a hope.
:::

::: key Linear interpolation
$p(x) = (1-t)y_i + t\,y_{i+1}$ with $t = (x - x_i)/h$. Its error is bounded by $\frac{h^2}{8}\max|f''|$ on the interval — second order in the table spacing, governed by the curvature of what is tabulated. Halving the spacing quarters the error.
:::

## Interpolate the logarithm, not the value

Density falls roughly exponentially with height, $\rho \approx \rho_0 e^{-z/H}$, where the **[[scale height|scale-height]]** $H$ is about $9\,\mathrm{km}$ in the lower atmosphere and 7 to 8 km higher up. An exponential bends a lot, so a straight line fights it. But $\ln\rho$ — the natural logarithm of density — is nearly a straight line in $z$, and a straight line is interpolated *exactly*.

So store $\ln\rho_i$, interpolate that linearly, and take `exp` of the result. One extra `exp` at run time. On the table above, the worst relative error falls from $1.51\times10^{-3}$ to $4.65\times10^{-4}$, 3.3 times better for free. It also can never return a negative density, which straight-line interpolation of a steeply falling $\rho$ can do near the end of a table.

The principle is worth more than the example: **interpolate the quantity that is closest to straight**. Log density against altitude. Orbital elements, not position, for an ephemeris over a long span. The *leftover* after subtracting an analytic model, whenever one exists. Each choice shrinks $\max|f''|$, the only thing in the bound you control besides the spacing.

## Why not one polynomial through the whole table

Through $n+1$ points there is exactly one polynomial of degree $n$. It is tempting: one formula, no interval bookkeeping, exact at every point. It is almost always a mistake, and not a subtle one.

::: example A degree-10 polynomial through a drag table
Take a made-up transonic drag rise for a slender body (a shape, not wind-tunnel data):

$$
C_D(M) = 0.20 + \frac{0.55}{1 + \left(\dfrac{M - 1.05}{0.18}\right)^2},
$$

with a peak of $C_D = 0.75$ at $M = 1.05$, settling to 0.20 at high Mach. Tabulate it at 11 points, $M = 0, 0.3, 0.6, \ldots, 3.0$, and compare interpolants with the true curve on a fine grid:

| Interpolant | worst error on $[0, 3]$ | worst error on $[1.8, 3.0]$, where the curve is flat |
| --- | --- | --- |
| Linear | $0.225$ | $0.0017$ |
| Cubic spline | $0.178$ | $0.0041$ |
| Degree-10 polynomial | $0.422$ | $0.422$ |

All three miss the peak badly, because the table never samples it. No interpolant recovers a feature that is not in the data. The fix is more points near Mach 1, which is why real aerodynamic databases are dense in the transonic region.

Now look at the second column. Where the curve is flat and well sampled, linear and spline are good to a fraction of a percent. The polynomial is *worse there than anywhere*: at $M = 2.91$ it gives $C_D = -0.217$, a negative drag coefficient. At $M = 0.15$ it gives 0.0065 against the true 0.221.

This is the **[[Runge phenomenon|runge]]**: a high-degree polynomial through equally spaced points swings wildly near the ends, and adding points makes it worse. At 0.1 Mach spacing (31 points), the spline's worst error drops to 0.0085 and linear's to 0.039, while the degree-30 polynomial's worst error is $7.4\times10^{3}$.
:::

The practical rule is absolute: **never fit one high-degree polynomial to a table**. Use low-degree pieces — straight lines, or cubics joined smoothly — so each piece depends only on nearby data and one bad point cannot spoil the far end. That is what a spline is.

## The cubic spline

Draftsmen once drew smooth curves with a thin, bendy strip of wood called a **[[spline|spline-word]]**, pinned at the points it had to pass through. The strip bends as little as it can, so the curve is smooth everywhere. The mathematical version copies it.

A **cubic spline** $S(x)$ through **knots** (the table's points) $x_0 < x_1 < \cdots < x_n$ is a separate cubic polynomial on each interval, joined so that $S$, its slope $S'$ and its curvature $S''$ are all continuous at every interior knot. That smoothness has a name: $S$ is $C^2$ ("C two"), meaning it and its first two derivatives are continuous.

Count the conditions. $n$ cubics have $4n$ coefficients (each cubic has four). Passing through both ends of each interval is $2n$ conditions. Matching $S'$ and $S''$ at the $n-1$ interior knots is $2(n-1)$ more. Total $4n - 2$, so two conditions are left over. Those are the **end conditions**, and they matter enormously.

The clean construction works with the curvatures at the knots, $M_i = S''(x_i)$, called the **moments**. On $[x_i, x_{i+1}]$, with $h_i = x_{i+1} - x_i$, a cubic's second derivative is a straight line, so

$$
S''(x) = M_i\,\frac{x_{i+1} - x}{h_i} + M_{i+1}\,\frac{x - x_i}{h_i} .
$$

Integrate twice and pick the two constants so that $S(x_i) = y_i$ and $S(x_{i+1}) = y_{i+1}$:

$$
S(x) = \frac{M_i (x_{i+1}-x)^3 + M_{i+1}(x - x_i)^3}{6 h_i}
+ \left(\frac{y_i}{h_i} - \frac{M_i h_i}{6}\right)(x_{i+1}-x)
+ \left(\frac{y_{i+1}}{h_i} - \frac{M_{i+1} h_i}{6}\right)(x - x_i).
$$

Now everything holds except a matching slope. Differentiate this formula on the interval to the left of $x_i$ and on the one to the right, evaluate both at $x_i$, and set them equal. Collecting terms gives, for $i = 1, \ldots, n-1$,

$$
h_{i-1}M_{i-1} + 2(h_{i-1} + h_i)M_i + h_i M_{i+1}
= 6\left(\frac{y_{i+1} - y_i}{h_i} - \frac{y_i - y_{i-1}}{h_{i-1}}\right).
$$

That is $n-1$ equations in $n+1$ unknowns; the two end conditions close it. Each row touches only $M_{i-1}$, $M_i$ and $M_{i+1}$, so the matrix is **tridiagonal** — nonzero only on the main diagonal and the two beside it. It is also **strictly diagonally dominant**: each diagonal entry, $2(h_{i-1}+h_i)$, beats the sum of the others in its row, $h_{i-1} + h_i$. Such a matrix is never singular and can be solved without swapping rows (**pivoting**). On an evenly spaced grid it becomes

$$
M_{i-1} + 4M_i + M_{i+1} = \frac{6}{h^2}\left(y_{i+1} - 2y_i + y_{i-1}\right).
$$

The right side is the second difference of the data, a discrete second derivative. So the spline picks curvatures that reproduce the data's curvature, smoothed across neighbors.

The **natural cubic spline** uses the simplest end condition: $S'' = 0$ at both ends, $M_0 = M_n = 0$.

::: key Cubic spline
A cubic spline is $C^2$: value, first derivative and second derivative are continuous at every knot. The natural cubic spline additionally sets $S''= 0$ at both ends. Its moments $M_i = S''(x_i)$ satisfy a tridiagonal, diagonally dominant system, $h_{i-1}M_{i-1} + 2(h_{i-1}+h_i)M_i + h_i M_{i+1} = 6[(y_{i+1}-y_i)/h_i - (y_i-y_{i-1})/h_{i-1}]$, solved in $O(n)$ by the Thomas algorithm. That $C^2$ smoothness is why splines are used for guidance reference trajectories: the commanded acceleration is continuous.
:::

## Solving the system in linear time

A tridiagonal system is solved by Gaussian elimination that never leaves the three diagonals: the **[[Thomas algorithm|thomas]]**. One forward sweep clears the lower diagonal, one backward sweep solves. Work and storage are both $O(n)$ — proportional to the number of knots. For 1,000 knots that is about 8,000 operations, against roughly $3\times10^{8}$ for a general dense solve. It is the first case of a point this module's last lesson makes at length: never hand a structured matrix to a general solver.

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


def rho(z):
    """1976 standard atmosphere density below 11 km, kg/m^3."""
    return 1.225 * (1 - 0.0065 * z / 288.15) ** 4.255879812716677


zs = [1000.0 * k for k in range(12)]              # 0, 1, ..., 11 km
rs = [rho(z) for z in zs]
M = cubic_spline(zs, rs)
print(f"{spline_value(zs, rs, M, 3500.0):.8f}")   # 0.86322096
print(f"{rho(3500.0):.8f}")                       # 0.86322861
```

At $z = 3{,}500\,\mathrm{m}$ the spline is off by a relative $8.9\times10^{-6}$. Linear interpolation gives $0.86412549$, off by $1.0\times10^{-3}$ — over a hundred times worse.

## End conditions decide the order

The two leftover conditions are not a detail. Three are in common use:

- **Natural**: $M_0 = M_n = 0$. Simple, and wrong unless the function truly has zero curvature at the ends. The error it makes at each end is $O(h^2)$, and it leaks inward, shrinking by about $2 - \sqrt{3} = 0.268$ per knot. The whole spline is then $O(h^2)$ — the same order as linear interpolation.
- **Clamped** (or complete): $S'(x_0) = f'(x_0)$ and $S'(x_n) = f'(x_n)$, using slopes you know or measured. This gives the full $O(h^4)$, with the bound $\max|f - S| \le \frac{5}{384}h^4\max|f^{(4)}|$, where $f^{(4)}$ is the fourth derivative.
- **Not-a-knot**: require $S'''$ to be continuous at $x_1$ and $x_{n-1}$, so the first two pieces are one cubic and so are the last two. It needs no extra information and recovers $O(h^4)$. It is the default in `scipy.interpolate.CubicSpline` and MATLAB's `spline`, and what you should use when you do not know the end slopes.

::: example What the end condition costs
Interpolate the troposphere density again and record the worst absolute error over 0 to 11 km as the knot spacing halves:

| spacing | linear | natural spline | not-a-knot spline | clamped spline |
| --- | --- | --- | --- | --- |
| $2{,}200\,\mathrm{m}$ | $4.94\times10^{-3}$ | $2.06\times10^{-3}$ | $8.33\times10^{-6}$ | $7.58\times10^{-7}$ |
| $1{,}100\,\mathrm{m}$ | $1.27\times10^{-3}$ | $5.13\times10^{-4}$ | $5.12\times10^{-7}$ | $4.74\times10^{-8}$ |
| $550\,\mathrm{m}$ | $3.22\times10^{-4}$ | $1.28\times10^{-4}$ | $3.21\times10^{-8}$ | $2.97\times10^{-9}$ |
| $275\,\mathrm{m}$ | $8.11\times10^{-5}$ | $3.21\times10^{-5}$ | $2.01\times10^{-9}$ | $1.85\times10^{-10}$ |

Read the ratios down each column. Linear divides by 4 each time: second order. The natural spline *also* divides by 4 — second order, only about 2.5 times better than linear, all because of two bad end conditions. Not-a-knot and clamped divide by 16: fourth order.

At a realistic 1 km onboard spacing, the not-a-knot spline's worst relative density error is $8.7\times10^{-7}$ against linear's $1.5\times10^{-3}$ — about 1,750 times better, for one tridiagonal solve done once on the ground.
:::

::: warning "Natural" is not a default
Do not pick the natural spline because the word sounds like the normal choice. It is the one common end condition that throws away the method's order. Use not-a-knot when you know nothing about the ends, clamped when you know the slopes. Natural is right only when the quantity truly has zero curvature at the table's ends — which is rare, and you should be able to say why.
:::

## Dense output: interpolating inside an integrator step

The adaptive-stepping lesson promised this. An adaptive integrator lands its steps where its controller sends it, not where you want output. Shortening steps to hit output times wastes steps and disturbs the error control. The fix is to interpolate inside the step. And you have more than the two endpoint values: the integrator also gives you the slopes $\mathbf{f}_n$ and $\mathbf{f}_{n+1}$ for free.

Four facts pin down a cubic: two values and two slopes. The **cubic Hermite interpolant** on $[t_n, t_{n+1}]$, with $\theta = (t - t_n)/h$ ("theta", the fraction of the step), is

$$
\mathbf{u}(\theta) = (1-\theta)\mathbf{y}_n + \theta\,\mathbf{y}_{n+1}
+ \theta(\theta - 1)\Big[(1 - 2\theta)(\mathbf{y}_{n+1} - \mathbf{y}_n)
+ (\theta - 1)h\,\mathbf{f}_n + \theta h\,\mathbf{f}_{n+1}\Big].
$$

Check it. At $\theta = 0$ and at $\theta = 1$ the factor $\theta(\theta-1)$ is zero, so $\mathbf{u}(0) = \mathbf{y}_n$ and $\mathbf{u}(1) = \mathbf{y}_{n+1}$. Differentiating gives $\mathbf{u}'(0) = h\mathbf{f}_n$ and $\mathbf{u}'(1) = h\mathbf{f}_{n+1}$ — the right slopes, since $t$ moves $h$ for each unit of $\theta$. It reproduces cubics exactly and has error $O(h^4)$ across the step.

::: example Dense output across one RK4 orbit step
Take one RK4 step of $h = 60\,\mathrm{s}$ on the circular 500 km orbit, starting from the exact state. The endpoint error is $7.5\times10^{-5}\,\mathrm{km} = 7.5\,\mathrm{cm}$. Now interpolate inside the step and compare with the exact circular motion:

| $\theta$ | $t$ (s) | cubic Hermite error | straight-line error |
| --- | --- | --- | --- |
| 0.1 | 6 | $0.045\,\mathrm{m}$ | $1{,}365\,\mathrm{m}$ |
| 0.3 | 18 | $0.247\,\mathrm{m}$ | $3{,}185\,\mathrm{m}$ |
| 0.5 | 30 | $0.353\,\mathrm{m}$ | $3{,}791\,\mathrm{m}$ |
| 0.7 | 42 | $0.257\,\mathrm{m}$ | $3{,}185\,\mathrm{m}$ |
| 0.9 | 54 | $0.089\,\mathrm{m}$ | $1{,}365\,\mathrm{m}$ |

The worst Hermite error over the step is $0.35\,\mathrm{m}$. A straight line between the same two states is worst at $3{,}791\,\mathrm{m}$ — ten thousand times larger.

Does that make sense? The straight line is a chord across a 60 s arc of a $6{,}878\,\mathrm{km}$ circle, and a chord cuts inside the arc. The gap at the middle is $r(1 - \cos(n h/2))$ with mean motion $n = v/r$, which works out to $3.79\,\mathrm{km}$. Using the slopes you already have costs nothing and buys four orders of magnitude.
:::

Production integrators do better still. Dormand–Prince 5(4) carries an extra stage that makes its dense output fourth-order, matching the step; `solve_ivp(..., dense_output=True)` returns it, and `sol(t)` evaluates it. The cubic Hermite is the version you can write from memory, and it is good enough for most telemetry and event detection.

## Practicalities

**Splines overshoot.** Being $C^2$ forces a spline to swing past a sharp step in the data. Through the values $0, 0, 0, 1, 1, 1$ at $x = 0, \ldots, 5$, the natural spline dips to $-0.109$ and peaks at $1.109$ — 11% outside the data. If the table is a throttle setting, a mass fraction or a density, the interpolant has produced an impossible number. When staying inside the data matters more than smoothness, use a **[[shape-preserving|overshoot]]** scheme: PCHIP (`scipy.interpolate.PchipInterpolator`) is $C^1$ rather than $C^2$ and never overshoots. You trade smoothness for shape.

**Never extrapolate.** Every bound in this lesson holds only inside the table. Outside, a cubic piece grows like $x^3$ and the error has no limit. Clamp the query to the table's range and flag it, or make the table cover the flight envelope with margin. An out-of-range density lookup during an abort trajectory is a classic way to get nonsense drag at the worst moment.

**The lookup is not free.** Finding the right interval costs $O(\log n)$ by binary search, or $O(1)$ if the table is evenly spaced and you compute the index directly — a strong reason for even tables in flight software. When queries move slowly, as altitude does, start the search at the last interval and step outward. Evaluating a cubic is then about ten operations. The spline's coefficients are computed once on the ground and stored, never recomputed in flight.

## Check yourself

::: check
A drag table is to be built for a re-entry vehicle by tabulating $C_D$ against Mach. Between Mach 3 and Mach 6 the curve is nearly flat, with $|C_D''| \le 0.004$ per $\mathrm{Mach}^2$; between Mach 0.8 and 1.4 it has $|C_D''| \le 9$ per $\mathrm{Mach}^2$. What spacing does each region need for a linear-interpolation error of 0.002 in $C_D$?
:::

::: answer
Set $\frac{h^2}{8}\max|f''| \le 0.002$, so $h \le \sqrt{0.016/\max|f''|}$.

Supersonic: $h \le \sqrt{0.016/0.004} = \sqrt{4} = 2.0$ Mach. Points at Mach 3 and 5 (and one at 6 to close the range) are enough.

Transonic: $h \le \sqrt{0.016/9} = 0.042$ Mach, so about 15 points from 0.8 to 1.4.

The spacings differ by $\sqrt{9/0.004} = 47$ times. That is why aerodynamic databases are uneven in Mach: the spacing should follow $1/\sqrt{|f''|}$, and an even table sized for the transonic region wastes most of its entries.
:::

::: check
You replace linear interpolation of a 1 km density table with a natural cubic spline and measure only a factor of 2.6 improvement, not the factor of a thousand you expected from "fourth order". Explain, and give the fix.
:::

::: answer
The natural end condition forces $S'' = 0$ at both ends of the table, but the true $\rho''$ is not zero there: about $8.6\times10^{-9}\,\mathrm{kg/m^5}$ at sea level and $4.5\times10^{-9}$ at 11 km. That wrong curvature is an $O(h^2)$ error at each end, and it leaks inward, shrinking by about 0.268 per knot but never vanishing. So the spline is second order overall, only a constant factor better than linear.

The fix is the end condition, not the spline. Not-a-knot needs nothing extra and restores $O(h^4)$ (worst relative error $8.7\times10^{-7}$ on the same table). Clamping with the true $\rho'$ at both ends does slightly better still.
:::

::: check
An adaptive propagator takes steps of 180 s through apogee and telemetry wants states every 10 s. Give two ways to produce them and say which is right and why.
:::

::: answer
You could force the integrator to land on every 10 s mark, or let it take its natural steps and interpolate.

Forcing is wrong. It cuts 180 s steps to 10 s, eighteen times as many steps exactly where the controller had correctly decided long steps were safe, and the controller no longer chooses the step.

Interpolating is right. The cubic Hermite interpolant built from the endpoint states and slopes is $O(h^4)$ across the step and costs about ten operations per sample. On a smooth apogee arc it is far more accurate than the integration error itself, so the output keeps the integrator's accuracy.
:::

::: check
A guidance reference trajectory is stored as a table of commanded position against time, and the autopilot differentiates it twice to get a feedforward acceleration. What goes wrong with linear interpolation, and what does a cubic spline give you?
:::

::: answer
Linear interpolation is only $C^0$: the value is continuous but the slope jumps at every knot. The velocity is a staircase, and the acceleration is zero inside each interval and a spike at each knot. The feedforward is useless, and the attitude loop sees a train of small step commands at the table rate.

A cubic spline is $C^2$: position, velocity and acceleration are all continuous, so the feedforward is smooth and bounded. That is why splines are the standard form for reference trajectories. It is a smoothness requirement, not an accuracy one: a finer linear table does not help, because the slope still jumps at every knot.
:::

::: check
Why is the spline's tridiagonal system solvable without pivoting, and what does that buy you in flight software?
:::

::: answer
Row $i$ has diagonal entry $2(h_{i-1} + h_i)$ and off-diagonal entries $h_{i-1}$ and $h_i$, all positive. So $2(h_{i-1}+h_i) > h_{i-1} + h_i$: strictly diagonally dominant. Such a matrix is nonsingular, and elimination on it is stable without swapping rows. So the Thomas algorithm — one forward sweep, one back substitution — is correct and $O(n)$ in time and memory.

For flight software that means a fixed, predictable run time with no data-dependent pivot choices, and no full matrix to store. In practice the coefficients are computed on the ground anyway; what flies is the lookup plus about ten operations.
:::

## Summary

| Item | Statement |
| --- | --- |
| Linear interpolation | $p(x) = (1-t)y_i + t\,y_{i+1}$, $t = (x-x_i)/h$; error $\le \frac{h^2}{8}\max\lvert f''\rvert$ |
| Table sizing | Spacing for a target error scales as $1/\sqrt{\max\lvert f''\rvert}$; halving $h$ quarters the error |
| Transform first | Interpolate $\ln\rho$, not $\rho$: exact for an exponential atmosphere, 3.3 times better on the 1976 troposphere table |
| Runge phenomenon | One high-degree polynomial through evenly spaced points swings near the ends, worse as points are added (degree 30: error $7\times10^{3}$) |
| Cubic spline | Piecewise cubic, $C^2$: value, first and second derivative continuous at every knot |
| Moment equations | $h_{i-1}M_{i-1} + 2(h_{i-1}+h_i)M_i + h_iM_{i+1} = 6\left[\frac{y_{i+1}-y_i}{h_i} - \frac{y_i-y_{i-1}}{h_{i-1}}\right]$, tridiagonal, diagonally dominant |
| Thomas algorithm | $O(n)$ solve, no pivoting needed |
| End conditions | Natural ($S''=0$): $O(h^2)$. Clamped ($S'$ given) and not-a-knot ($S'''$ continuous at $x_1$, $x_{n-1}$): $O(h^4)$, bound $\frac{5}{384}h^4\max\lvert f^{(4)}\rvert$ |
| Cubic Hermite | $\mathbf{u}(\theta) = (1-\theta)\mathbf{y}_n + \theta\mathbf{y}_{n+1} + \theta(\theta-1)[(1-2\theta)(\mathbf{y}_{n+1}-\mathbf{y}_n) + (\theta-1)h\mathbf{f}_n + \theta h\mathbf{f}_{n+1}]$: dense output |
| Dense output value | $0.35\,\mathrm{m}$ worst error across a 60 s RK4 orbit step, against $3{,}791\,\mathrm{m}$ for a straight line |
| Overshoot | Splines leave the data range at steps (11% on a unit step); use PCHIP when shape matters |
| Never extrapolate | All bounds hold inside the table only |

The next lesson asks for the slope instead of the value: how to differentiate a function you can only evaluate, why finite differences lose a third of your digits however carefully you pick the step, and the complex-step trick that avoids the loss entirely.

::: context ephemeris A timetable for the sky
An **ephemeris** (plural *ephemerides*) is a table of where a body will be at listed times. The word comes from the Greek for "daily", because early ones gave a planet's position day by day. NASA's Jet Propulsion Laboratory publishes the DE series of planetary ephemerides, and mission software reads them by interpolating between listed times — exactly the job of this lesson.
:::

::: context interpolant Between the known points
*Interpolate* comes from a Latin word meaning to touch up or alter — originally, slipping new words into an old text. In mathematics it means slipping new values in between known ones. The function that does it is the **interpolant**. Its opposite is *extrapolate*: guessing beyond the ends of the table, which is far riskier.
:::

::: context chord-gap Where the straight line misses most
A straight line (a chord) joins two points on a curve. The gap between chord and curve is zero at both ends and largest in the middle. For the curve $f(x) = x^2$ on $[0, 1]$, the chord is $y = x$, and at $x = 0.5$ the gap is $0.5 - 0.25 = 0.25$. The formula agrees: $\frac{h^2}{8}f'' = \frac{1}{8}\times 2 = 0.25$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="330" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="60.0,150.0 70.0,149.8 80.0,149.2 90.0,148.1 100.0,146.7 110.0,144.8 120.0,142.5 130.0,139.8 140.0,136.7 150.0,133.1 160.0,129.2 170.0,124.8 180.0,120.0 190.0,114.8 200.0,109.2 210.0,103.1 220.0,96.7 230.0,89.8 240.0,82.5 250.0,74.8 260.0,66.7 270.0,58.1 280.0,49.2 290.0,39.8 300.0,30.0"/>
  <line x1="60" y1="150" x2="300" y2="30" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="90" x2="180" y2="120" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="60" cy="150" r="4" fill="#1f2a44"/>
  <circle cx="300" cy="30" r="4" fill="#1f2a44"/>
  <text x="188" y="140" font-size="12" fill="#b4232c">biggest gap, at the middle</text>
  <text x="120" y="96" font-size="12" fill="#1f2a44" text-anchor="end">straight line</text>
  <text x="252" y="104" font-size="12" fill="#1d6fd1">curve</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="60" y="166">x_i</text><text x="180" y="166">midpoint</text><text x="300" y="166">x_i+1</text></g>
</svg>
```
:::

::: context standard-atmosphere The standard atmosphere
The U.S. Standard Atmosphere, 1976, was published jointly by NOAA, NASA and the U.S. Air Force. It gives one agreed-upon, year-round average of temperature, pressure and density against altitude. Real air on launch day differs from it by several percent or more, which is why launch teams also fly weather balloons. But for design, comparison and testing, everyone uses the same standard table so their numbers line up.
:::

::: context scale-height What a scale height is
The **scale height** $H$ is the climb over which density drops by a factor of $e \approx 2.718$. With $H \approx 8\,\mathrm{km}$, going up 8 km leaves about 37% of the air; 16 km leaves about 14%. So "an exponential atmosphere with scale height $H$" is a compact way to say how fast the air thins out.
:::

::: context runge Runge's wiggles
Carl Runge — the same Runge as in Runge–Kutta — showed in 1901 that fitting one polynomial through evenly spaced points of a smooth, harmless curve can go badly wrong near the ends. In the picture, the grey curve is the drag model, the dots are the 11 tabulated points, and the red curve is the degree-10 polynomial through them. It passes through every dot and still dips below zero near $M = 2.9$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="125" x2="345" y2="125" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="40" y1="160" x2="345" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="34" y="129" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle"><text x="40" y="174">M = 0</text><text x="140" y="174">1</text><text x="240" y="174">2</text><text x="340" y="174">3</text></g>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="40.0,99.8 45.0,99.7 50.0,99.4 55.0,99.2 60.0,98.9 65.0,98.6 70.0,98.2 75.0,97.7 80.0,97.1 85.0,96.4 90.0,95.5 95.0,94.3 100.0,92.8 105.0,90.9 110.0,88.2 115.0,84.7 120.0,79.8 125.0,73.0 127.5,68.7 130.0,63.8 132.5,58.4 135.0,52.6 137.5,47.0 140.0,42.1 142.5,38.7 145.0,37.5 147.5,38.7 150.0,42.1 152.5,47.0 155.0,52.6 157.5,58.4 160.0,63.8 162.5,68.7 165.0,73.0 170.0,79.8 175.0,84.7 180.0,88.2 185.0,90.9 190.0,92.8 200.0,95.5 210.0,97.1 220.0,98.2 230.0,98.9 240.0,99.4 250.0,99.8 260.0,100.1 280.0,100.5 300.0,100.8 320.0,101.0 340.0,101.1"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,99.8 42.5,118.8 45.0,128.9 47.5,132.7 50.0,132.2 52.5,129.0 55.0,124.2 57.5,118.9 60.0,113.5 62.5,108.6 65.0,104.3 67.5,100.8 70.0,98.2 72.5,96.3 75.0,95.1 77.5,94.5 80.0,94.3 82.5,94.4 85.0,94.6 87.5,94.8 90.0,94.9 92.5,94.8 95.0,94.5 97.5,93.8 100.0,92.8 102.5,91.4 105.0,89.7 107.5,87.7 110.0,85.3 112.5,82.8 115.0,80.0 117.5,77.2 120.0,74.3 122.5,71.5 125.0,68.7 127.5,66.2 130.0,63.8 132.5,61.7 135.0,60.0 137.5,58.6 140.0,57.6 142.5,57.0 145.0,56.8 147.5,57.0 150.0,57.7 152.5,58.7 155.0,60.1 157.5,61.8 160.0,63.8 162.5,66.0 165.0,68.5 167.5,71.0 170.0,73.7 172.5,76.4 175.0,79.1 177.5,81.7 180.0,84.3 182.5,86.7 185.0,88.9 187.5,91.0 190.0,92.8 192.5,94.4 195.0,95.7 197.5,96.8 200.0,97.7 202.5,98.3 205.0,98.7 207.5,99.0 210.0,99.0 212.5,98.9 215.0,98.7 217.5,98.5 220.0,98.2 222.5,97.9 225.0,97.6 227.5,97.3 230.0,97.2 232.5,97.1 235.0,97.2 237.5,97.3 240.0,97.6 242.5,98.0 245.0,98.6 247.5,99.2 250.0,99.8 252.5,100.5 255.0,101.2 257.5,101.9 260.0,102.5 262.5,103.0 265.0,103.3 267.5,103.4 270.0,103.3 272.5,103.0 275.0,102.4 277.5,101.6 280.0,100.5 282.5,99.3 285.0,98.0 287.5,96.6 290.0,95.2 292.5,94.0 295.0,93.0 297.5,92.5 300.0,92.5 302.5,93.2 305.0,94.8 307.5,97.3 310.0,100.9 312.5,105.6 315.0,111.4 317.5,118.1 320.0,125.5 322.5,133.1 325.0,140.4 327.5,146.4 330.0,149.9 332.5,149.4 335.0,142.9 337.5,127.9 340.0,101.1"/>
  <g fill="#1f2a44"><circle cx="40" cy="99.8" r="3"/><circle cx="70" cy="98.2" r="3"/><circle cx="100" cy="92.8" r="3"/><circle cx="130" cy="63.8" r="3"/><circle cx="160" cy="63.8" r="3"/><circle cx="190" cy="92.8" r="3"/><circle cx="220" cy="98.2" r="3"/><circle cx="250" cy="99.8" r="3"/><circle cx="280" cy="100.5" r="3"/><circle cx="310" cy="100.9" r="3"/><circle cx="340" cy="101.1" r="3"/></g>
  <text x="152" y="30" font-size="11" fill="#6c7a93">true peak 0.75</text>
  <text x="316" y="150" font-size="11" fill="#b4232c" text-anchor="end">C_D = −0.217 here</text>
</svg>
```
:::

::: context spline-word Where the word spline comes from
Before computers, ship and aircraft designers drew long smooth curves with a **spline**: a thin, flexible strip of wood or plastic held in place by heavy lead weights called "ducks". The strip settles into the shape that bends least overall, which is very nearly a cubic between each pair of weights. Mathematician Isaac Schoenberg borrowed the word in 1946 for the piecewise polynomials in this lesson.
:::

::: context thomas Llewellyn Thomas and the three-diagonal shortcut
The Thomas algorithm is named after the physicist Llewellyn Thomas, who described it in 1949. It is plain Gaussian elimination that knows every entry off the three diagonals is zero, so it skips them all. The same trick solves heat-flow and structural-beam problems, where each point only "talks to" its two neighbors.
:::

::: context overshoot A spline swinging past a step
Here the natural cubic spline passes through six data points: three at 0 and three at 1. To keep its curvature continuous, it has to dip below 0 (to $-0.109$ at $x = 1.6$) before the climb and swing above 1 (to $1.109$ at $x = 3.4$) after it. PCHIP gives up continuous curvature and stays between 0 and 1.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="330" y2="140" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <line x1="30" y1="40" x2="330" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="24" y="144" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="24" y="44" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,140.0 45.6,139.1 51.2,138.3 56.8,137.5 62.4,136.9 68.0,136.6 73.6,136.5 79.2,136.8 84.8,137.4 90.4,138.4 96.0,140.0 101.6,142.0 107.2,144.4 112.8,146.7 118.4,148.7 124.0,150.2 129.6,150.9 135.2,150.5 140.8,148.7 146.4,145.3 152.0,140.0 157.6,132.6 163.2,123.5 168.8,113.1 174.4,101.7 180.0,90.0 185.6,78.3 191.2,66.9 196.8,56.5 202.4,47.4 208.0,40.0 213.6,34.7 219.2,31.3 224.8,29.5 230.4,29.1 236.0,29.8 241.6,31.3 247.2,33.3 252.8,35.6 258.4,38.0 264.0,40.0 269.6,41.6 275.2,42.6 280.8,43.2 286.4,43.5 292.0,43.4 297.6,43.1 303.2,42.5 308.8,41.7 314.4,40.9 320.0,40.0"/>
  <g fill="#1f2a44"><circle cx="40" cy="140" r="3.5"/><circle cx="96" cy="140" r="3.5"/><circle cx="152" cy="140" r="3.5"/><circle cx="208" cy="40" r="3.5"/><circle cx="264" cy="40" r="3.5"/><circle cx="320" cy="40" r="3.5"/></g>
  <text x="129.6" y="166" font-size="11" text-anchor="middle" fill="#b4232c">−0.109</text>
  <text x="230.4" y="20" font-size="11" text-anchor="middle" fill="#b4232c">1.109</text>
</svg>
```
:::
