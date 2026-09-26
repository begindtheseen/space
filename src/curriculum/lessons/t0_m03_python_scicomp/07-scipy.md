---
id: l07-scipy
title: "SciPy: integrating, solving, filtering and fitting"
minutes: 24
covers:
  - SciPy: integrate.solve_ivp, optimize, linalg, signal, stats
---

Almost every question a GNC engineer asks a computer is one of five:

- Where will this vehicle be later? (**integrate**)
- For what input does this function hit zero, or its smallest value? (**optimize**)
- What solves this set of linear equations? (**linalg**)
- What does this noisy signal look like with the noise taken out? (**signal**)
- How likely is this outcome? (**stats**)

**SciPy** — a library of ready-made numerical tools for NumPy arrays — answers all five, each with one function call. Behind the calls sit decades-old, well-tested routines: Runge–Kutta integrators, Brent's root finder, the [[LAPACK|lapack]] linear-algebra library, digital filters and probability distributions.

There is a catch. SciPy cannot choose your accuracy settings or your method, and its defaults are made for quick sketches, not for orbits. An orbit propagated with the defaults can land hundreds of kilometers off after a single lap, and nothing warns you. So for each subpackage you get the main call, the arguments that matter, and a check on the answer.

## `scipy.integrate.solve_ivp`: stepping a state forward

Picture walking in fog. You know where you are and how fast you are moving. You take one small step, note where you now are, and repeat. Many small steps from a known start: that is what an integrator does.

In math, that starting situation is an **[[initial-value problem|initial-value-problem]]**: a **state** $\mathbf{y}(t)$ — the list of numbers that describes the system at time $t$ — plus a rule for how fast the state changes,

$$
\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y}), \qquad \mathbf{y}(t_0) = \mathbf{y}_0 .
$$

Read $\dot{\mathbf{y}}$ aloud as "y dot": the rate of change of $\mathbf{y}$ with time. $\mathbf{y}_0$ ("y nought") is the starting state at time $t_0$. We want $\mathbf{y}$ later.

Gravity gives a *second* derivative, the acceleration $\ddot{\mathbf{r}} = -\mu\,\mathbf{r}/r^3$ ("r double-dot"). To fit the form above, stack position and velocity into one state vector, $\mathbf{y} = (\mathbf{r}, \mathbf{v})$. Then its rate of change is $\dot{\mathbf{y}} = (\mathbf{v}, \ddot{\mathbf{r}})$: the rate of position is velocity, and the rate of velocity is acceleration. `solve_ivp` integrates any system in this form with an **[[adaptive step|adaptive-step]]** — one that shrinks where the state changes fast and grows where it is calm.

::: key
Minimum call signature: `solve_ivp(fun, t_span, y0, method="RK45", t_eval=None, rtol=1e-3, atol=1e-6)`, where `fun(t, y)` returns $d\mathbf{y}/dt$ as an array the same shape as `y`. For orbits tighten `rtol`/`atol` to about `1e-12`/`1e-12` and use `method="DOP853"`.
:::

The arguments:

- `t_span` is the pair `(t0, tf)`; `y0` is the starting state array.
- `rtol` and `atol` are the **relative** and **absolute tolerances** — how much error you allow per step. The solver picks its own internal steps so that each component's estimated error stays below `atol + rtol * |y|`.
- `t_eval` only chooses which times appear in the output. It changes nothing about how the solution is computed.

The result object holds `sol.t`, shape `(m,)`, one entry per output time, and `sol.y`, shape `(n, m)`: one *row* per state component, one column per time. `sol.success` and `sol.message` say whether it worked.

```python
import numpy as np
from scipy.integrate import solve_ivp

def decay(t, y):
    return -y                      # dy/dt = -y, exact solution exp(-t)

sol = solve_ivp(decay, (0.0, 1.0), [1.0], rtol=1e-10, atol=1e-12)
print(sol.success, sol.y.shape)    # True (1, m)  -- m steps the solver chose
print(sol.y[0, -1])                # 0.36787944...  agrees with exp(-1) = 0.36787944117144233
```

Always try a new integrator first on a problem whose answer you know, and read off how many digits your tolerance actually buys.

### Methods and tolerances

Each method is a different recipe for one step:

- `RK45` is a **[[Runge–Kutta|runge-kutta]]** method of fifth order with a fourth-order error estimate. "Order" measures how fast the error shrinks as the step shrinks; higher order means bigger steps for the same accuracy. Fine for smooth problems at modest accuracy.
- `DOP853` is eighth order. It takes far larger steps at the same tolerance and is the standard choice for orbits at tight tolerances.
- `Radau`, `BDF` and `LSODA` are *implicit* methods for **[[stiff|stiff]]** systems, where some parts change thousands of times faster than others (a fast actuator inside a slow trajectory). An ordinary explicit method on a stiff problem crawls or blows up.

Now the tolerances. The defaults `rtol=1e-3`, `atol=1e-6` mean about *three significant digits*. On an orbit radius of $7 \times 10^6\,\mathrm{m}$ that lets each step be off by about $7\,\mathrm{km}$, and the errors pile up. A circular orbit at $400\,\mathrm{km}$ altitude, run for one lap at the defaults, comes back about $1800\,\mathrm{km}$ from where it started.

For orbit work, set both to about $10^{-12}$. Then the allowed error per step on that radius is $7 \times 10^6 \times 10^{-12} = 7 \times 10^{-6}\,\mathrm{m}$ — micrometers. The tight `atol` keeps small components (a nearly-zero out-of-plane term) from being ignored. Below about $10^{-13}$ you hit float64 round-off: the error stops improving and the step count explodes. SciPy warns and raises any `rtol` below about $2.2 \times 10^{-14}$.

To know the tolerance is right, check a **conserved quantity** — something the physics says never changes. For the two-body problem, the specific energy $\mathcal{E} = v^2/2 - \mu/r$ (read "script E") and the angular momentum $\mathbf{h} = \mathbf{r}\times\mathbf{v}$ are both constant. Compute them along `sol.y` and plot their drift. At the defaults the energy drifts by about $5\,\%$ in one lap. At $10^{-12}$ it stays around $10^{-12}$ or smaller for hundreds of laps.

### Events, `args` and dense output

Often you want to stop *when something happens* — the ball hits the ground, the rocket tops its arc. That is an **event**: a function `g(t, y)` that equals zero at the moment you care about.

- Pass events as `events=[g]`.
- Set `g.terminal = True` to stop the integration at the event.
- Set `g.direction = -1` to count only crossings where `g` goes from positive to negative.

The solver pins down the crossing as accurately as the integration, reporting the time in `sol.t_events[0]` and the state in `sol.y_events[0]`.

Extra fixed inputs, like $\mu$, go through `args=(mu,)`; they are added to every call of `fun` and of each event. And `dense_output=True` gives `sol.sol`, a smooth curve through the solution: `sol.sol(t)` returns the state at any time in the span without integrating again.

::: example A ballistic arc to ground impact
Integrate a drag-free projectile launched at $100\,\mathrm{m/s}$ and $45^\circ$ until it hits the ground, $z = 0$. Compare with the flat-ground textbook answers: time of flight $t_f = 2 v_0 \sin\theta / g = 14.421\,\mathrm{s}$ and range $R = v_0^2 \sin 2\theta / g = 1019.72\,\mathrm{m}$.

```python
G0 = 9.80665

def rhs(t, y):
    x, z, vx, vz = y
    return [vx, vz, 0.0, -G0]

def impact(t, y):
    return y[1]                     # altitude
impact.terminal = True
impact.direction = -1               # only a descending crossing

th = np.radians(45.0)
y0 = [0.0, 0.0, 100.0 * np.cos(th), 100.0 * np.sin(th)]
sol = solve_ivp(rhs, (0.0, 60.0), y0, method="DOP853", rtol=1e-12, atol=1e-12,
                events=impact, dense_output=True)
t_hit = sol.t_events[0][0]
x_hit = sol.y_events[0][0][0]
print(round(t_hit, 4), round(x_hit, 2))    # 14.421 1019.72
```

`rhs` says: position changes at the velocity, horizontal velocity stays put, vertical velocity drops by $g$ each second. The event is the altitude itself, zero at the ground.

The launch starts *at* $z = 0$, climbing. `direction = -1` makes the solver ignore that upward crossing and stop at the downward one. Both textbook numbers match.

Check with `sol.sol`: the top of the arc comes at half the flight time, $t_f/2 = 7.21\,\mathrm{s}$, at height $v_0^2\sin^2\theta/(2g) = 254.93\,\mathrm{m}$, and `sol.sol(7.21)[1]` gives that height.

Adding drag is one more line in `rhs` and nothing else changes — the point of writing the physics as a function of the state.
:::

::: warning `sol.y` is transposed relative to intuition
`sol.y` has shape `(n_states, n_times)`. `sol.y[1]` is the whole altitude history; `sol.y[:, -1]` is the final state. `plt.plot(sol.t, sol.y)` fails or plots the wrong thing — use `sol.y.T`, or pick the row you want.
:::

## `scipy.optimize`: roots and minima

A **root** is an input $x$ that makes $f(x) = 0$: "how long should I burn so the miss is zero?" A **minimum** is the input where a cost is smallest: "which steering angle uses the least propellant?" Guidance software asks both at every step.

### Roots

A hiking trail that starts below sea level and ends above it *must* cross sea level somewhere. That is a **[[bracket|bracket]]**: two inputs $a$ and $b$ where $f(a)$ and $f(b)$ have opposite signs, so a root lies between them.

For one unknown with a bracket, use `brentq(f, a, b)`. It needs $f(a)$ and $f(b)$ of opposite sign, then closes in reliably, to within `xtol=2e-12` by default, in a few dozen evaluations at most. Prefer it to `fsolve` or `root` whenever you can bracket, because a bracket proves a root exists.

```python
from scipy.optimize import brentq, minimize_scalar, minimize, curve_fit

MU, R_E = 3.986004418e14, 6_378_137.0
def excess(alt):                     # circular speed minus 7500 m/s
    return np.sqrt(MU / (R_E + alt)) - 7500.0
alt = brentq(excess, 100e3, 2000e3)
print(round(alt / 1e3, 3))          # 708.093   km; exact is mu/v^2 - R_E
```

This asks at what altitude circular-orbit speed is exactly $7500\,\mathrm{m/s}$. Low orbits are faster than that and high ones slower, so $100$ to $2000\,\mathrm{km}$ is a bracket. The exact $\mu/v^2 - R_E = 708.093\,\mathrm{km}$ agrees.

For several unknowns, `optimize.root(fun, x0)` solves $\mathbf{f}(\mathbf{x}) = \mathbf{0}$ from a starting guess $\mathbf{x}_0$ with a Newton-style method (Powell's hybrid method by default) — the workhorse of trajectory targeting. Its `.x` is the answer; its `.success` you must check.

### Minima

Pick the tool by the problem:

- `minimize_scalar(f, bounds=(a, b), method="bounded")` for one variable in a known range.
- `minimize(f, x0, method="Nelder-Mead")` for a few variables when $f$ is noisy or has corners.
- `minimize(f, x0, method="BFGS")` when $f$ is smooth. Unless you supply a gradient, it estimates one by finite differences, with the step-size trade-off from the floating-point lesson.
- `least_squares(residuals, x0)` when the cost is a sum of squared misfits, as in every trajectory-fitting or orbit-determination problem. It exploits that structure and converges far faster than a general minimizer.
- `curve_fit(model, xdata, ydata, p0)` to fit a model with parameters `p` to data. It uses the same least-squares machinery (Levenberg–Marquardt by default) and returns the parameters and their covariance.

```python
r = minimize_scalar(lambda th: -100.0**2 * np.sin(2 * th) / G0,
                    bounds=(0.0, np.pi / 2), method="bounded")
print(round(np.degrees(r.x), 2))     # 45.0   range is maximised at 45 degrees

def line(t, a, b):
    return a * t + b
t = np.array([0.0, 1.0, 2.0, 3.0])
popt, pcov = curve_fit(line, t, 2.0 * t + 1.0)
print(np.round(popt, 6))             # [2. 1.]
```

The first call finds the launch angle with the longest range. There is no "maximize", so we minimize the *negative* range — the bottom of the flipped curve is the top of the real one — and get $45^\circ$, as we should. The second fits a line to four points lying exactly on $2t + 1$ and gets back slope $2$ and intercept $1$.

Every optimizer returns a result object. Read `.x`, and *always* check `.success` and `.message`: a minimizer that ran out of iterations still returns a number that looks like an answer.

## `scipy.linalg`: linear algebra

`scipy.linalg` covers `numpy.linalg` and adds more. Both call the same library underneath, so use whichever you imported, and reach for SciPy for the extras:

- `expm`, the **matrix exponential**, which turns a continuous-time model into a step-by-step one;
- `solve_continuous_are` and `solve_discrete_are`, the **[[Riccati equations|riccati]]** behind optimal control and the steady-state Kalman filter;
- the factorizations `cholesky`, `qr`, `svd`, `lu`, and `lstsq` for least squares.

```python
from scipy import linalg
A = np.array([[2.0, 1.0], [1.0, 3.0]])
b = np.array([5.0, 10.0])
print(linalg.solve(A, b))            # [1. 3.]
print(linalg.det(A))                 # 5.0
print(np.allclose(A @ linalg.inv(A), np.eye(2)))   # True
```

Check by hand: $2(1) + 1(3) = 5$ and $1(1) + 3(3) = 10$.

Three habits:

1. **Solve, do not invert.** `linalg.solve(A, b)` is faster and more accurate than `linalg.inv(A) @ b`; use `inv` only when you need the matrix itself.
2. **Tell the solver what it has.** A covariance matrix is symmetric and positive definite, so `linalg.solve(P, b, assume_a="pos")` can use the Cholesky method — about twice as fast, and stable.
3. **Check the conditioning.** `np.linalg.cond(A)`, the **condition number**, estimates how many digits a solve loses. At $10^{10}$ you lose ten of float64's sixteen digits, leaving six. Near $10^{16}$ the matrix is singular to working precision; the linear-algebra modules explain why.

## `scipy.signal`: filtering and spectra

Telemetry is **sampled** — measured at regular ticks, like frames of a movie — and noisy. `scipy.signal` designs and applies digital filters and shows what frequencies a signal holds.

A **low-pass filter** passes slow changes and blocks fast wiggles, the way a car's suspension smooths out gravel but still follows a hill. The **Butterworth** design is as flat as possible below its **cutoff frequency** $f_c$, then falls away, more steeply the higher its **order** $N$. For data sampled at $f_s$:

```python
from scipy import signal
fs = 100.0                                    # Hz
t_s = np.arange(0.0, 10.0, 1.0 / fs)
y_noisy = np.sin(2 * np.pi * 0.5 * t_s) + 0.2 * np.random.default_rng(0).normal(size=t_s.size)
b, a = signal.butter(4, 5.0, btype="low", fs=fs)   # 4th order, 5 Hz cutoff
y_filt = signal.filtfilt(b, a, y_noisy)       # zero-phase: forward and backward
y_causal = signal.lfilter(b, a, y_noisy)      # causal: what a flight computer could do
```

The test signal is a slow $0.5\,\mathrm{Hz}$ wave plus noise. Then:

- `butter` returns the filter's coefficients, `b` (top) and `a` (bottom) of its transfer function.
- `filtfilt` runs the filter forward and then backward, so the delays cancel. Ideal after a flight; impossible in real time, because it uses samples from the future.
- `lfilter` is **causal** — it uses only the present and past, so a flight computer can run it, and its delay is the lag you would see on the vehicle.

Passing `fs=` lets you give the cutoff in hertz. Without it, the cutoff `Wn` is a fraction of the **[[Nyquist frequency|nyquist]]** $f_s/2$, so $5\,\mathrm{Hz}$ at $f_s = 100\,\mathrm{Hz}$ is `Wn = 0.1`.

`f, Pxx = signal.welch(y, fs=fs, nperseg=1024)` estimates the **power spectral density** — how a signal's energy is spread over frequency. That plot shows you a $27\,\mathrm{Hz}$ wobble of the vehicle's structure hiding under your control loop. More tools:

- `signal.detrend` removes a straight-line drift before a spectrum;
- `signal.savgol_filter` smooths and differentiates — a good way to get rates from positions;
- `signal.find_peaks` finds maxima;
- `signal.cont2discrete((A, B, C, D), dt)` converts a state-space model to a fixed time step, the same job as `expm`;
- `signal.StateSpace`, `signal.TransferFunction`, `signal.lsim`, `signal.step` and `signal.bode` simulate linear systems; the controls modules use them constantly.

::: warning Filter delay is not zero
A causal low-pass filter delays the signal. For a Butterworth of order $N$ the low-frequency delay is $\sum_k \cos\theta_k / (2\pi f_c)$, summed over the angles $\theta_k$ of its poles. For $N = 4$ that is about $0.42 / f_c$, so a fourth-order $5\,\mathrm{Hz}$ filter lags by about $0.08\,\mathrm{s}$ at low frequency, and more near the cutoff. Put it in a feedback loop without accounting for that and the loop's safety margin can vanish. Use `filtfilt` for analysis, and budget the delay of every real-time filter.
:::

## `scipy.stats`: distributions

Run a simulation ten thousand times with slightly different inputs — a **Monte Carlo** — and you get ten thousand answers, whose spread you describe with a probability distribution. `scipy.stats` has hundreds, all with the same methods. The most important is the **[[normal distribution|normal-curve]]**, the bell curve, called `norm`:

```python
from scipy import stats
print(round(stats.norm.cdf(3.0), 5))                          # 0.99865
print(round(stats.norm.ppf(0.9987), 4))                       # 3.0115
print(round(stats.norm.cdf(1.0) - stats.norm.cdf(-1.0), 4))   # 0.6827
x = stats.norm(loc=30.0, scale=2.0).rvs(size=10_000, random_state=0)
```

The methods:

- `.pdf(x)`, the **probability density** — the height of the bell curve at $x$;
- `.cdf(x)`, the **cumulative distribution** — the probability of a value below $x$. It is often written $\Phi(x)$, "phi of x";
- `.ppf(p)`, its inverse — the value with probability $p$ below it, called the **quantile** or percentile;
- `.sf(x)`, the **survival function** $1 - \mathrm{cdf}$ — the probability of a value *above* $x$;
- `.rvs(size)`, random samples.

Plain `stats.norm` is the *standard* normal: mean $0$ and **standard deviation** $\sigma$ ("sigma", the typical distance from the mean) equal to $1$, so its $x$ counts sigmas. `loc` and `scale` shift and stretch it: `norm(loc=30, scale=2)` has mean $30$ and $\sigma = 2$.

Know the printed numbers by heart. $99.865\,\%$ of a normal lies below $+3\sigma$, so the 99.87th percentile that the Monte Carlo exercise asks for is the $+3\sigma$ point. And $\pm 1\sigma$, $\pm 2\sigma$ and $\pm 3\sigma$ around the mean enclose $68.27\,\%$, $95.45\,\%$ and $99.73\,\%$ of the samples.

Others share these methods: `chi2` (testing whether a Kalman filter's errors are the size it claims), `t` (means of small samples), `uniform`, and `multivariate_normal` (a bell curve in several dimensions, with a covariance matrix). `stats.describe(x)` summarizes a sample; `stats.kstest` and `stats.normaltest` ask whether it plausibly came from a normal.

::: example Sizing a landing footprint
A Monte Carlo of 20 000 landings gives a downrange miss with sample mean $12\,\mathrm{m}$ and sample standard deviation $410\,\mathrm{m}$. The histogram looks like a bell curve. What half-width around the mean holds $99.73\,\%$ of landings? What is the probability that a landing lies beyond $+1500\,\mathrm{m}$?

**Half-width.** For a normal, $99.73\,\%$ lies within $\pm 3\sigma$ of the mean. So the half-width is $3 \times 410 = 1230\,\mathrm{m}$, centered at $12\,\mathrm{m}$.

**Tail.** First measure how many sigmas $1500\,\mathrm{m}$ is from the mean. That count is the **z-score**: $z = (1500 - 12)/410 = 3.629$. The probability above it is $1 - \Phi(z)$:

```python
z = (1500.0 - 12.0) / 410.0
print(round(z, 3), stats.norm.sf(z))    # 3.629 then about 1.4e-4
```

`sf` computes $1 - \mathrm{cdf}$ directly. `1 - stats.norm.cdf(z)` would subtract two nearly equal numbers — the last lesson's cancellation. Here that costs only a few digits, but at $z = 9$ it returns exactly $0$ while `sf` gives $1.1 \times 10^{-19}$.

The answer is about $1.4 \times 10^{-4}$, or $1.4 \times 10^{-4} \times 20\,000 \approx 3$ landings. That is also a warning: a $3.6\sigma$ tail from 20 000 samples rests on about three landings, and the bell-curve assumption is doing most of the work. Count the real ones with `(miss > 1500).sum()` before quoting the number.
:::

::: example Discretizing a double integrator
A vehicle moving along a track with commanded acceleration $u$ obeys $\ddot{x} = u$ — a **double integrator**, because integrating $u$ twice gives position. With the state $\mathbf{y} = (x, \dot{x})$, position and velocity, it is

$$
\dot{\mathbf{y}} = \mathbf{A}\mathbf{y} + \mathbf{B}u, \qquad
\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}, \quad
\mathbf{B} = \begin{pmatrix} 0 \\ 1 \end{pmatrix}.
$$

Read the top row as "the rate of $x$ is $\dot{x}$", and the bottom row as "the rate of $\dot{x}$ is $u$".

A flight computer updates every $\Delta t = 0.1\,\mathrm{s}$, so it needs a step-to-step rule, $\mathbf{y}_{k+1} = \mathbf{A}_d\mathbf{y}_k + \mathbf{B}_d u_k$. Here $k$ counts steps and the subscript $d$ means "discrete". The theory gives $\mathbf{A}_d = e^{\mathbf{A}\Delta t}$ and, for $u$ held constant over the step, $\mathbf{B}_d = \int_0^{\Delta t} e^{\mathbf{A}\tau}\,d\tau\,\mathbf{B}$. For a double integrator the exact answer is

$$
\mathbf{A}_d = \begin{pmatrix} 1 & \Delta t \\ 0 & 1 \end{pmatrix}, \qquad
\mathbf{B}_d = \begin{pmatrix} \Delta t^2/2 \\ \Delta t \end{pmatrix} = \begin{pmatrix} 0.005 \\ 0.1 \end{pmatrix}.
$$

That is school physics: in one step, position grows by $v\,\Delta t + \tfrac12 u\,\Delta t^2$ and velocity by $u\,\Delta t$, and $\tfrac12 (0.1)^2 = 0.005$. Now numerically:

```python
A = np.array([[0.0, 1.0], [0.0, 0.0]])
B = np.array([[0.0], [1.0]])
Ad = linalg.expm(A * 0.1)
print(Ad)                          # [[1.  0.1]
                                   #  [0.  1. ]]
Ad2, Bd, *_ = signal.cont2discrete((A, B, np.eye(2), np.zeros((2, 1))), dt=0.1)
print(np.round(Bd.ravel(), 6))     # [0.005 0.1  ]
```

Here $\mathbf{A}^2 = \mathbf{0}$, so the exponential series $I + \mathbf{A}\Delta t + \tfrac12(\mathbf{A}\Delta t)^2 + \cdots$ stops after two terms and `expm` is exact to round-off. This is the pattern for every linear model in the controls modules: write $\mathbf{A}$ and $\mathbf{B}$, discretize numerically, check against a hand case.
:::

## Check yourself

::: check
A teammate propagates a circular orbit of radius $6.778 \times 10^6\,\mathrm{m}$. How large an error per step does `rtol=1e-3` allow on the radius, and how large does `rtol=1e-12` allow? The teammate then proposes `rtol=1e-16` "to be safe". What happens?
:::

::: answer
The allowed error is about `rtol` times the size of the value. With `1e-3`: $6.778 \times 10^6 \times 10^{-3} \approx 6.8 \times 10^3\,\mathrm{m}$, nearly $7\,\mathrm{km}$ per step — and those errors pile up over the orbit. With `1e-12`: $6.778 \times 10^6 \times 10^{-12} \approx 6.8 \times 10^{-6}\,\mathrm{m}$, a few micrometers.

`1e-16` asks for less than float64's own spacing (machine epsilon is $2.2 \times 10^{-16}$), and every step adds round-off, so the error cannot shrink that far. SciPy warns and raises `rtol` to about $2.2 \times 10^{-14}$; even near $10^{-13}$ the step count balloons for almost no gain. About $10^{-12}$, checked with the drift of $v^2/2 - \mu/r$, is the sweet spot.
:::

::: check
`brentq(f, 0, 10)` raises `ValueError: f(a) and f(b) must have different signs`. What does that tell you, and what are two sensible next steps?
:::

::: answer
The function has the same sign at both ends. So either there is no root in $[0, 10]$, or there is an even number of them (it crosses zero and crosses back).

Next steps: first, evaluate `f` on a grid — `np.sign(f(np.linspace(0, 10, 201)))` — and look for sign changes, to find a bracket that holds exactly one root. Second, rethink the problem: a function with no root may be telling you the target cannot be reached (the burn cannot zero the miss with the $\Delta v$ available).

Do not switch to `fsolve` to make the error go away: without a bracket it can return a point that is not a root, with `success=False` if you look.
:::

::: check
Why does `filtfilt` produce a filtered signal with no lag while `lfilter` does not? Which would you use to find a vehicle's touchdown time from accelerometer data after the flight?
:::

::: answer
`lfilter` is causal: each output depends only on present and past inputs, and every causal low-pass filter delays the signal. `filtfilt` runs the filter forward, then runs it again backward over the result. The backward pass delays by the same amount in the opposite direction, so the two cancel — at the cost of using future samples.

After the flight you have the whole record, so `filtfilt` is right: the touchdown spike appears at its true time, not tens of milliseconds late. On the vehicle only `lfilter` is possible, delay and all.
:::

::: check
Write the `solve_ivp` right-hand side for the two-body problem $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3$ with the state ordered $(x, y, z, v_x, v_y, v_z)$. Give the starting state for a circular orbit at $r = 6\,778\,137\,\mathrm{m}$ in the $xy$-plane, and its period.
:::

::: answer
```python
def two_body(t, y, mu):
    r = y[:3]
    rn = np.linalg.norm(r)
    return np.concatenate([y[3:], -mu * r / rn**3])
```

Call it with `args=(3.986004418e14,)`. The first three outputs are the velocity (the rate of the top half of the state is the bottom half); the last three are the acceleration.

For a circular orbit $v = \sqrt{\mu/r} = 7668.56\,\mathrm{m/s}$, so `y0 = [6778137.0, 0.0, 0.0, 0.0, 7668.558175407055, 0.0]`: on the $x$-axis, moving along $y$. The period is $T = 2\pi\sqrt{r^3/\mu} = 5553.62\,\mathrm{s}$, about $92.6$ minutes. Integrating over `(0, T)` with `DOP853` at `1e-12` returns to `y0` within a tiny fraction of a meter (about $2 \times 10^{-5}\,\mathrm{m}$ in our run).
:::

::: check
A Monte Carlo of 5 000 runs reports a 99.87th-percentile downrange miss of $1210\,\mathrm{m}$. If the misses are normal with mean $0$, what standard deviation does that imply? How many of the 5 000 samples actually lie above that percentile?
:::

::: answer
The 99.87th percentile of a normal is the mean plus $3.0115\sigma$ (`stats.norm.ppf(0.9987)` $= 3.0115$). So $\sigma \approx 1210 / 3.0115 \approx 402\,\mathrm{m}$.

By definition $0.13\,\%$ of samples lie above the percentile: $0.0013 \times 5000 = 6.5$, so six or seven. That is the warning behind every $3\sigma$ number from a Monte Carlo: a handful of extreme runs set it, so it is itself uncertain unless the sample is much bigger or you trust the distribution's shape.
:::

## Summary

| Subpackage | Call | Notes |
| --- | --- | --- |
| `integrate` | `solve_ivp(fun, t_span, y0, method="RK45", t_eval=None, rtol=1e-3, atol=1e-6)` | `fun(t, y)` returns $d\mathbf{y}/dt$; `sol.t`, `sol.y` is `(n_states, n_times)` |
| orbits | `method="DOP853"`, `rtol=1e-12`, `atol=1e-12` | check with $v^2/2 - \mu/r$ and $\mathbf{r}\times\mathbf{v}$ |
| events | `g.terminal = True`, `g.direction = -1`, `events=[g]` | `sol.t_events`, `sol.y_events`; `dense_output=True` gives `sol.sol(t)` |
| `optimize` | `brentq(f, a, b)`, `root(fun, x0)`, `minimize_scalar`, `minimize(f, x0, method=...)`, `least_squares`, `curve_fit` | check `.success`; bracket roots when you can |
| `linalg` | `solve(A, b)`, `solve(P, b, assume_a="pos")`, `expm`, `cholesky`, `qr`, `svd`, `lstsq`, `solve_continuous_are` | solve, do not invert; `np.linalg.cond` |
| `signal` | `butter(N, fc, fs=fs)`, `filtfilt`, `lfilter`, `welch`, `savgol_filter`, `cont2discrete`, `StateSpace` | `filtfilt` has no lag but needs the future; `Wn` is a fraction of $f_s/2$ without `fs=` |
| `stats` | `norm.pdf/cdf/ppf/sf/rvs`, `norm(loc, scale)`, `chi2`, `multivariate_normal`, `describe` | $\Phi(3) = 0.99865$; `ppf(0.9987)` $= 3.0115$; $\pm 1, 2, 3\sigma$: $68.27$, $95.45$, $99.73\,\%$ |

The next lesson turns these arrays — a `solve_ivp` trajectory, a filtered telemetry channel, a Monte Carlo histogram — into figures that a design review will accept.

::: context lapack The library under everyone's math
LAPACK (Linear Algebra PACKage) is a collection of Fortran routines for solving equations, factoring matrices and finding eigenvalues, first released in 1992 as the successor to the older LINPACK and EISPACK libraries. It is free, and it is everywhere: NumPy, SciPy, MATLAB, Julia and R all hand their matrix work to LAPACK or a tuned copy of it. When you call `linalg.solve`, decades of careful numerical work run underneath one line of Python.
:::

::: context initial-value-problem Why "initial value"
The name says what you are given: the value of the state at the *start*, and nothing else. From there the rule $\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y})$ decides everything that follows, the way a ball's position and velocity at release decide its whole flight.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="22" font-size="12" fill="#1f2a44">state y</text>
  <rect x="20" y="30" width="60" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="50" y="48" font-size="13" text-anchor="middle" fill="#1f2a44">r</text>
  <rect x="20" y="56" width="60" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="50" y="74" font-size="13" text-anchor="middle" fill="#1f2a44">v</text>
  <text x="250" y="22" font-size="12" fill="#1f2a44">rate dy/dt</text>
  <rect x="250" y="30" width="60" height="26" fill="#f2b880" stroke="#1f2a44"/>
  <text x="280" y="48" font-size="13" text-anchor="middle" fill="#1f2a44">v</text>
  <rect x="250" y="56" width="60" height="26" fill="#fff" stroke="#1f2a44"/>
  <text x="280" y="74" font-size="13" text-anchor="middle" fill="#1f2a44">−μr/r³</text>
  <line x1="80" y1="69" x2="242" y2="43" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="248,42 238,40 240,48" fill="#1d6fd1"/>
  <text x="165" y="110" font-size="12" text-anchor="middle" fill="#1f2a44">the velocity half of y is the rate of the position half</text>
</svg>
```
:::

::: context adaptive-step Small steps where it matters
An adaptive integrator takes each step two ways — say, a fourth-order and a fifth-order recipe — and compares the results. Their difference estimates the error. Too big? It throws the step away and tries a smaller one. Much smaller than allowed? The next step grows. So steps crowd together where the state bends sharply, like near the low point of an elliptical orbit, and stretch out where it coasts.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <polyline points="20,90.0 28,90.0 36,90.0 44,90.0 52,90.0 60,90.0 68,90.0 76,89.9 84,89.8 92,89.4 100,88.7 108,87.3 116,84.6 124,80.1 132,73.4 140,64.2 148,53.1 156,41.2 164,30.3 172,22.7 180,20.0 188,22.7 196,30.3 204,41.2 212,53.1 220,64.2 228,73.4 236,80.1 244,84.6 252,87.3 260,88.7 268,89.4 276,89.8 284,89.9 292,90.0 300,90.0 308,90.0 316,90.0 324,90.0 332,90.0 340,90.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5"><line x1="20" y1="100" x2="20" y2="108"/><line x1="72" y1="100" x2="72" y2="108"/><line x1="100" y1="100" x2="100" y2="108"/><line x1="116" y1="100" x2="116" y2="108"/><line x1="130" y1="100" x2="130" y2="108"/><line x1="156" y1="100" x2="156" y2="108"/><line x1="172" y1="100" x2="172" y2="108"/><line x1="180" y1="100" x2="180" y2="108"/><line x1="188" y1="100" x2="188" y2="108"/><line x1="204" y1="100" x2="204" y2="108"/><line x1="230" y1="100" x2="230" y2="108"/><line x1="244" y1="100" x2="244" y2="108"/><line x1="260" y1="100" x2="260" y2="108"/><line x1="288" y1="100" x2="288" y2="108"/><line x1="340" y1="100" x2="340" y2="108"/></g>
  <line x1="20" y1="104" x2="340" y2="104" stroke="#1f2a44" stroke-width="1"/>
  <text x="180" y="14" font-size="11" text-anchor="middle" fill="#b4232c">sharp bend: short steps</text>
  <text x="60" y="80" font-size="11" text-anchor="middle" fill="#6c7a93">calm: long steps</text>
</svg>
```
:::

::: context runge-kutta Where the names come from
The method family is named after two German mathematicians, Carl Runge, who published the idea in 1895, and Martin Kutta, who extended it in 1901. Instead of stepping with only the slope at the start of a step, a Runge–Kutta method samples the slope at several points inside the step and blends them. `DOP853` is the Dormand–Prince method of order 8, with lower-order formulas (5 and 3) used to estimate the error.
:::

::: context stiff What makes a problem stiff
Imagine filming a snail and a hummingbird in one shot. To see the wings you need a very fast frame rate, even though the snail — the thing you actually care about — barely moves. A stiff system is like that: one part settles in microseconds, another evolves over minutes. An ordinary explicit method must take tiny steps only to stay stable for the fast part. Implicit methods like `Radau` and `BDF` solve a small equation at each step and can take steps sized for the slow part.
:::

::: context bracket A sign change traps a root
If a smooth curve is below zero at $a$ and above zero at $b$, it cannot get from one to the other without crossing zero. That fact is called the intermediate value theorem. Brent's method keeps shrinking the bracket while always keeping the sign change inside, so it can never lose the root.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M60,115 C130,110 170,70 200,55 C240,35 280,30 300,25" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="60" cy="115" r="4" fill="#b4232c"/>
  <circle cx="300" cy="25" r="4" fill="#b4232c"/>
  <line x1="60" y1="70" x2="60" y2="115" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <line x1="300" y1="70" x2="300" y2="25" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <text x="60" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">a</text>
  <text x="300" y="86" font-size="12" text-anchor="middle" fill="#1f2a44">b</text>
  <text x="95" y="130" font-size="11" fill="#b4232c">f(a) &lt; 0</text>
  <text x="250" y="18" font-size="11" fill="#b4232c">f(b) &gt; 0</text>
  <circle cx="178" cy="70" r="4" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="178" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">root</text>
</svg>
```
:::

::: context riccati A bridge to optimal control
The Riccati equation is a matrix equation named after the 18th-century Italian mathematician Jacopo Riccati. You will meet it twice later in the course. In the control modules, solving it gives the linear-quadratic regulator (LQR), the feedback gain that balances tracking error against control effort. In the estimation modules, the same kind of equation gives the steady-state Kalman filter gain. SciPy solves it in one call.
:::

::: context nyquist Half the sampling rate
A signal sampled $f_s$ times per second can only show frequencies up to $f_s/2$, the Nyquist frequency. Anything faster gets disguised as something slower — the effect behind wagon wheels that seem to turn backward in films. So a $100\,\mathrm{Hz}$ log can describe motion up to $50\,\mathrm{Hz}$, and SciPy's filter functions measure cutoffs as a fraction of that limit. The telemetry lesson comes back to this when channels are resampled.
:::

::: context normal-curve The bell curve and its sigmas
Many sums of small random effects — wind gusts, engine thrust scatter, sensor noise — pile up into this shape. The standard deviation $\sigma$ sets its width. The shaded bands below are $\pm 1\sigma$, $\pm 2\sigma$ and $\pm 3\sigma$, holding $68.27\,\%$, $95.45\,\%$ and $99.73\,\%$ of the area.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 156" font-family="Inter, Arial, sans-serif">
  <path d="M45.0,120 L45.0,118.9 L49.5,118.6 L54.0,118.1 L58.5,117.5 L63.0,116.8 L67.5,115.8 L72.0,114.7 L76.5,113.3 L81.0,111.6 L85.5,109.5 L90.0,107.1 L94.5,104.4 L99.0,101.2 L103.5,97.6 L108.0,93.6 L112.5,89.2 L117.0,84.3 L121.5,79.2 L126.0,73.8 L130.5,68.1 L135.0,62.4 L139.5,56.6 L144.0,51.0 L148.5,45.6 L153.0,40.6 L157.5,36.2 L162.0,32.3 L166.5,29.2 L171.0,26.9 L175.5,25.5 L180.0,25.0 L184.5,25.5 L189.0,26.9 L193.5,29.2 L198.0,32.3 L202.5,36.2 L207.0,40.6 L211.5,45.6 L216.0,51.0 L220.5,56.6 L225.0,62.4 L229.5,68.1 L234.0,73.8 L238.5,79.2 L243.0,84.3 L247.5,89.2 L252.0,93.6 L256.5,97.6 L261.0,101.2 L265.5,104.4 L270.0,107.1 L274.5,109.5 L279.0,111.6 L283.5,113.3 L288.0,114.7 L292.5,115.8 L297.0,116.8 L301.5,117.5 L306.0,118.1 L310.5,118.6 L315.0,118.9 L315.0,120 Z" fill="#8fb8f0" fill-opacity="0.3"/>
  <path d="M90.0,120 L90.0,107.1 L94.5,104.4 L99.0,101.2 L103.5,97.6 L108.0,93.6 L112.5,89.2 L117.0,84.3 L121.5,79.2 L126.0,73.8 L130.5,68.1 L135.0,62.4 L139.5,56.6 L144.0,51.0 L148.5,45.6 L153.0,40.6 L157.5,36.2 L162.0,32.3 L166.5,29.2 L171.0,26.9 L175.5,25.5 L180.0,25.0 L184.5,25.5 L189.0,26.9 L193.5,29.2 L198.0,32.3 L202.5,36.2 L207.0,40.6 L211.5,45.6 L216.0,51.0 L220.5,56.6 L225.0,62.4 L229.5,68.1 L234.0,73.8 L238.5,79.2 L243.0,84.3 L247.5,89.2 L252.0,93.6 L256.5,97.6 L261.0,101.2 L265.5,104.4 L270.0,107.1 L270.0,120 Z" fill="#8fb8f0" fill-opacity="0.55"/>
  <path d="M135.0,120 L135.0,62.4 L139.5,56.6 L144.0,51.0 L148.5,45.6 L153.0,40.6 L157.5,36.2 L162.0,32.3 L166.5,29.2 L171.0,26.9 L175.5,25.5 L180.0,25.0 L184.5,25.5 L189.0,26.9 L193.5,29.2 L198.0,32.3 L202.5,36.2 L207.0,40.6 L211.5,45.6 L216.0,51.0 L220.5,56.6 L225.0,62.4 L225.0,120 Z" fill="#8fb8f0"/>
  <path d="M18,119.9 L27,119.7 L36,119.4 L45,118.9 L54,118.1 L63,116.8 L72,114.7 L81,111.6 L90,107.1 L99,101.2 L108,93.6 L117,84.3 L126,73.8 L135,62.4 L144,51.0 L153,40.6 L162,32.3 L171,26.9 L180,25.0 L189,26.9 L198,32.3 L207,40.6 L216,51.0 L225,62.4 L234,73.8 L243,84.3 L252,93.6 L261,101.2 L270,107.1 L279,111.6 L288,114.7 L297,116.8 L306,118.1 L315,118.9 L324,119.4 L333,119.7 L342,119.9" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="10" y1="120" x2="350" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="85" x2="180" y2="25" stroke="#1f2a44" stroke-dasharray="3,3"/>
  <text x="135" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">−1σ</text><text x="225" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">+1σ</text><text x="90" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">−2σ</text><text x="270" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">+2σ</text><text x="45" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">−3σ</text><text x="315" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">+3σ</text>
  <text x="180" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">mean</text>
  <text x="180" y="104" font-size="12" text-anchor="middle" fill="#1f2a44">68.27%</text>
</svg>
```
:::
