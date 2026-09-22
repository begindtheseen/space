---
id: l07-scipy
title: "SciPy: integrating, solving, filtering and fitting"
minutes: 24
covers:
  - "SciPy: integrate.solve_ivp, optimize, linalg, signal, stats"
---

Almost every question a GNC engineer asks a computer is one of five: where will this state be at a later time, for what input does this function equal zero (or reach its minimum), what solves this linear system, what does this noisy signal look like without the noise, and how likely is this outcome. SciPy answers all five. It is a library of numerical routines — Runge–Kutta integrators, Brent's root finder, LAPACK factorisations, digital filters, probability distributions — wrapped so that each is a single call on NumPy arrays.

The routines are old, well tested and fast. What SciPy cannot do is choose your tolerances, your integration method or your problem formulation, and the defaults are set for quick sketches, not for orbits. The propagator that drifts a kilometre per revolution at the default tolerance is a classic first-week mistake, and this lesson is written so that you do not make it. Each section introduces one subpackage, the call you will use most, the arguments that matter, and a check that tells you the result is right.

## `scipy.integrate.solve_ivp`: propagating a state

An *initial-value problem* is a state $\mathbf{y}(t)$ and a rule for its rate of change,

$$
\dot{\mathbf{y}} = \mathbf{f}(t, \mathbf{y}), \qquad \mathbf{y}(t_0) = \mathbf{y}_0 ,
$$

and the task is to find $\mathbf{y}$ at later times. A second-order equation such as $\ddot{\mathbf{r}} = -\mu\,\mathbf{r}/r^3$ is first converted to first order by stacking position and velocity into one state vector, $\mathbf{y} = (\mathbf{r}, \mathbf{v})$, so that $\dot{\mathbf{y}} = (\mathbf{v}, \ddot{\mathbf{r}})$. `solve_ivp` integrates such a system with an adaptive step:

::: key
Minimum call signature: `solve_ivp(fun, t_span, y0, method="RK45", t_eval=None, rtol=1e-3, atol=1e-6)`, where `fun(t, y)` returns $d\mathbf{y}/dt$ as an array the same shape as `y`. For orbits tighten `rtol`/`atol` to about `1e-12`/`1e-12` and use `method="DOP853"`.
:::

`t_span` is the pair `(t0, tf)`; `y0` is the initial state array. The solver chooses its own internal steps so that the estimated local error of each component stays below `atol + rtol * |y|`; `t_eval` only selects which times appear in the output and changes nothing about the integration. The result object carries `sol.t` (shape `(m,)`), `sol.y` (shape `(n, m)`: one *row* per state component, one column per time), `sol.success` and `sol.message`.

```python
import numpy as np
from scipy.integrate import solve_ivp

def decay(t, y):
    return -y                      # dy/dt = -y, exact solution exp(-t)

sol = solve_ivp(decay, (0.0, 1.0), [1.0], rtol=1e-10, atol=1e-12)
print(sol.success, sol.y.shape)    # True (1, m)  -- m steps the solver chose
print(sol.y[0, -1])                # 0.36787944...  agrees with exp(-1) = 0.36787944117144233
```

Always start a new propagator on a problem with a known answer, as here, and read off how many digits the tolerance actually buys you.

### Methods and tolerances

`RK45` is a fifth-order Runge–Kutta pair with a fourth-order error estimate — fine for smooth problems at modest accuracy. `DOP853` is eighth order: for the same tolerance it takes far larger steps, and at tight tolerances it is the standard choice for orbits. `Radau`, `BDF` and `LSODA` are *implicit* methods for *stiff* systems, where some components decay thousands of times faster than others (a fast actuator model inside a slow trajectory, chemical kinetics); an explicit method on a stiff problem crawls or blows up.

The defaults `rtol=1e-3`, `atol=1e-6` mean *three significant digits*. A position of $7 \times 10^6\,\mathrm{m}$ is then allowed an error per step of about $7\,\mathrm{km}$, and those errors accumulate over thousands of steps. For orbit work set both to $10^{-12}$ or so: with `rtol=1e-12` the per-step position error is of order micrometres, and with `atol=1e-12` the small components — velocities in $\mathrm{m/s}$ are fine, but a near-zero out-of-plane term is not — are not neglected. Go below $10^{-13}$ and you hit float64 round-off; the error stops improving and the step count explodes.

The check that catches a wrong tolerance is a conserved quantity. For the two-body problem the specific energy $\mathcal{E} = v^2/2 - \mu/r$ and the angular momentum $\mathbf{h} = \mathbf{r}\times\mathbf{v}$ are constant, so compute them along `sol.y` and plot their relative drift: at default tolerances it is visible at the third digit within a revolution; at $10^{-12}$ it sits at the $10^{-12}$ to $10^{-11}$ level for hundreds of revolutions.

### Events, `args` and dense output

An *event* is a function `g(t, y)` whose zero crossing you want located — ground impact, apogee, a threshold crossing. Pass a list of them as `events=[g]`; set `g.terminal = True` to stop the integration there and `g.direction = -1` to accept only downward crossings. The solver root-finds the crossing time to the integration tolerance and reports it in `sol.t_events[0]` with the state in `sol.y_events[0]`. Extra parameters go through `args=(mu,)`, which are appended to every call of `fun` and of each event. `dense_output=True` returns `sol.sol`, a callable interpolant, so `sol.sol(t)` evaluates the state at any `t` inside the span without re-integrating.

::: example A ballistic arc to ground impact
Integrate a drag-free projectile launched at $100\,\mathrm{m/s}$ and $45^\circ$ until it hits $z = 0$, and compare with the closed-form time of flight $t_f = 2 v_0 \sin\theta / g = 14.421\,\mathrm{s}$ and range $R = v_0^2 \sin 2\theta / g = 1019.72\,\mathrm{m}$.

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

The launch state has $z = 0$ with $\dot z > 0$; `direction = -1` makes the solver ignore that upward crossing at $t = 0$ and stop at the descending one. `sol.sol(7.0)` then gives the state at any intermediate time — the apex, for instance, at $t_f/2 = 7.21\,\mathrm{s}$, where the interpolated altitude should match $v_0^2\sin^2\theta/(2g) = 254.93\,\mathrm{m}$. Adding drag is one line in `rhs`; nothing else changes, which is the point of writing the dynamics as a function of the state.
:::

::: warning `sol.y` is transposed relative to intuition
`sol.y` has shape `(n_states, n_times)`. `sol.y[1]` is the whole altitude history; `sol.y[:, -1]` is the final state. Plotting `plt.plot(sol.t, sol.y)` fails or plots the wrong thing — use `sol.y.T`, or index the row you want.
:::

## `scipy.optimize`: roots and minima

Two problems live here. A *root* is an $x$ with $f(x) = 0$; a *minimum* is an $x$ where a cost is smallest. Both are what a guidance law computes at every step — the burn time that zeros a miss distance, the steering angle that minimises propellant.

For a scalar root with a known bracket, `brentq(f, a, b)` is the routine: it needs $f(a)$ and $f(b)$ of opposite sign, and converges to the root to `xtol=2e-12` reliably, in a few dozen evaluations at most. Prefer it over `fsolve`/`root` whenever you can bracket, because a bracket is a proof that a root exists.

```python
from scipy.optimize import brentq, minimize_scalar, minimize, curve_fit

MU, R_E = 3.986004418e14, 6_378_137.0
def excess(alt):                     # circular speed minus 7500 m/s
    return np.sqrt(MU / (R_E + alt)) - 7500.0
alt = brentq(excess, 100e3, 2000e3)
print(round(alt / 1e3, 3))          # 708.093   km; exact is mu/v^2 - R_E
```

For several unknowns, `optimize.root(fun, x0)` solves $\mathbf{f}(\mathbf{x}) = \mathbf{0}$ from a starting guess with a quasi-Newton method — the workhorse of Lambert solvers and trim calculations — and returns an object whose `.x` is the answer and `.success` you must check.

Minimisation: `minimize_scalar(f, bounds=(a, b), method="bounded")` for one variable; `minimize(f, x0, method="Nelder-Mead")` for a few variables when $f$ is noisy or not differentiable, `method="BFGS"` when it is smooth (it estimates the gradient by finite differences, with the step-size trade-off of the last lesson), and `least_squares(residuals, x0)` when the cost is a sum of squares, as in every trajectory-fitting or orbit-determination problem — it exploits the structure and converges far faster than a general minimiser. `curve_fit(model, xdata, ydata, p0)` wraps `least_squares` for the common case of fitting a model with parameters `p` to data, and returns the parameters and their covariance:

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

Every optimiser returns a result object: read `.x`, and *always* check `.success` and `.message` — a minimiser that hit its iteration limit returns a number that looks like an answer.

## `scipy.linalg`: dense linear algebra

`scipy.linalg` overlaps `numpy.linalg` and extends it. Both call LAPACK; use whichever you have imported, but reach for SciPy for the extras: `expm` (the matrix exponential, which turns a continuous state-space model into a discrete one), `solve_continuous_are` and `solve_discrete_are` (the Riccati equations behind LQR and the steady-state Kalman gain), `cholesky`, `qr`, `svd`, `lu` and `lstsq`.

```python
from scipy import linalg
A = np.array([[2.0, 1.0], [1.0, 3.0]])
b = np.array([5.0, 10.0])
print(linalg.solve(A, b))            # [1. 3.]
print(linalg.det(A))                 # 5.0
print(np.allclose(A @ linalg.inv(A), np.eye(2)))   # True
```

Three habits. Solve, do not invert: `linalg.solve(A, b)` is faster and more accurate than `linalg.inv(A) @ b`, and `inv` is for when you actually need the matrix. Tell the solver what it has: `linalg.solve(P, b, assume_a="pos")` on a covariance uses Cholesky, twice as fast and stable. And check conditioning: `np.linalg.cond(A)` estimates how many digits a solve loses; a condition number of $10^{10}$ means six digits of the sixteen survive, and a value near $10^{16}$ means the system is singular to working precision — the linear-algebra modules explain why.

## `scipy.signal`: filtering and spectra

Telemetry is sampled and noisy. `scipy.signal` provides the tools to design a digital filter, apply it, and look at a signal's frequency content.

A Butterworth low-pass filter of order $N$ with cutoff $f_c$ for data sampled at $f_s$:

```python
from scipy import signal
fs = 100.0                                    # Hz
b, a = signal.butter(4, 5.0, btype="low", fs=fs)   # 4th order, 5 Hz cutoff
y_filt = signal.filtfilt(b, a, y_noisy)       # zero-phase: forward and backward
y_causal = signal.lfilter(b, a, y_noisy)      # causal: what a flight computer could do
```

`butter` returns the numerator and denominator coefficients of the discrete transfer function. `filtfilt` runs the filter forwards and then backwards, cancelling the phase lag — ideal for post-flight analysis, impossible in real time because it uses future samples. `lfilter` is the causal, real-time version, and its group delay is the lag you would see on the vehicle. Passing `fs=` lets you state the cutoff in hertz; without it, `Wn` is a fraction of the Nyquist frequency $f_s/2$, so $5\,\mathrm{Hz}$ at $f_s = 100\,\mathrm{Hz}$ is `Wn = 0.1`.

For frequency content, `f, Pxx = signal.welch(y, fs=fs, nperseg=1024)` estimates the power spectral density — the plot that shows you a $27\,\mathrm{Hz}$ structural mode sitting under your control bandwidth. `signal.detrend` removes a linear drift before a spectrum, `signal.savgol_filter` smooths and differentiates (a good way to get rates from positions), `signal.find_peaks` locates maxima, and `signal.cont2discrete((A, B, C, D), dt)` discretises a state-space model at a sample period — the same job as `expm` on the augmented matrix. The `signal.StateSpace` and `signal.TransferFunction` classes with `signal.lsim`, `signal.step` and `signal.bode` simulate linear systems directly; the controls modules use them constantly.

::: warning Filter delay is not zero
A causal low-pass filter delays the signal by roughly $N / (4 f_c)$ seconds for a Butterworth of order $N$. A fourth-order $5\,\mathrm{Hz}$ filter lags by about $0.2\,\mathrm{s}$; put it in a feedback loop without accounting for that and the phase margin evaporates. Use `filtfilt` in analysis, and design real-time filters with their delay budgeted.
:::

## `scipy.stats`: distributions

Monte Carlo results are interpreted through probability distributions, and `scipy.stats` implements hundreds of them with one interface. For the normal distribution `norm`:

```python
from scipy import stats
print(round(stats.norm.cdf(3.0), 5))                          # 0.99865
print(round(stats.norm.ppf(0.9987), 4))                       # 3.0115
print(round(stats.norm.cdf(1.0) - stats.norm.cdf(-1.0), 4))   # 0.6827
x = stats.norm(loc=30.0, scale=2.0).rvs(size=10_000, random_state=0)
```

`.pdf(x)` is the density, `.cdf(x)` the probability of a value below $x$, `.ppf(p)` its inverse (the *quantile*), and `.rvs(size)` draws samples. `loc` and `scale` shift and stretch: `norm(loc=30, scale=2)` is a normal with mean 30 and standard deviation 2. The three numbers above are ones to know: $99.865\,\%$ of a normal lies below $+3\sigma$, so the 99.87th percentile that the Monte Carlo exercise reports is the $+3\sigma$ point; and one, two and three sigma enclose $68.27\,\%$, $95.45\,\%$ and $99.73\,\%$. The other distributions you will meet — `chi2` for the sum of squared normalised residuals that tests whether a filter is consistent, `t` for small-sample means, `uniform`, `multivariate_normal` for a Gaussian with a covariance matrix — share the same methods. `stats.describe(x)` summarises a sample; `stats.kstest` and `stats.normaltest` ask whether a sample is plausibly normal.

::: example Sizing a landing footprint
A Monte Carlo of 20 000 landings gives a downrange miss with sample mean $12\,\mathrm{m}$ and sample standard deviation $410\,\mathrm{m}$, and the histogram looks Gaussian. What downrange half-width encloses $99.73\,\%$ of landings, and what is the probability that a landing lies beyond $+1500\,\mathrm{m}$?

For a normal, $99.73\,\%$ lies within $\pm 3\sigma$ of the mean, so the half-width is $3 \times 410 = 1230\,\mathrm{m}$, centred at $12\,\mathrm{m}$. The tail probability is $1 - \Phi(z)$ with $z = (1500 - 12)/410 = 3.629$:

```python
z = (1500.0 - 12.0) / 410.0
print(round(z, 3), stats.norm.sf(z))    # 3.629 then about 1.4e-4
```

`sf` is the *survival function* $1 - \mathrm{cdf}$, computed directly so that it does not cancel for large $z$ (the previous lesson explains why `1 - stats.norm.cdf(z)` would lose digits out in the tail). About $1.4 \times 10^{-4}$, or roughly three of the 20 000 samples — which is also a warning: a $3.6\sigma$ tail estimated from 20 000 samples rests on three landings, and the Gaussian assumption is doing most of the work. Check the empirical count with `(miss > 1500).sum()` before quoting the number.
:::

::: example Discretising a double integrator
A vehicle's along-track motion is $\ddot{x} = u$, or in state-space form with $\mathbf{y} = (x, \dot{x})$,

$$
\dot{\mathbf{y}} = \mathbf{A}\mathbf{y} + \mathbf{B}u, \qquad
\mathbf{A} = \begin{pmatrix} 0 & 1 \\ 0 & 0 \end{pmatrix}, \quad
\mathbf{B} = \begin{pmatrix} 0 \\ 1 \end{pmatrix}.
$$

A controller running at $\Delta t = 0.1\,\mathrm{s}$ needs the discrete map $\mathbf{y}_{k+1} = \mathbf{A}_d\mathbf{y}_k + \mathbf{B}_d u_k$. With $\mathbf{A}_d = e^{\mathbf{A}\Delta t}$ and, for constant $u$ over the step, $\mathbf{B}_d = \int_0^{\Delta t} e^{\mathbf{A}\tau}\,d\tau\,\mathbf{B}$, the exact answer for a double integrator is

$$
\mathbf{A}_d = \begin{pmatrix} 1 & \Delta t \\ 0 & 1 \end{pmatrix}, \qquad
\mathbf{B}_d = \begin{pmatrix} \Delta t^2/2 \\ \Delta t \end{pmatrix} = \begin{pmatrix} 0.005 \\ 0.1 \end{pmatrix}.
$$

```python
A = np.array([[0.0, 1.0], [0.0, 0.0]])
B = np.array([[0.0], [1.0]])
Ad = linalg.expm(A * 0.1)
print(Ad)                          # [[1.  0.1]
                                   #  [0.  1. ]]
Ad2, Bd, *_ = signal.cont2discrete((A, B, np.eye(2), np.zeros((2, 1))), dt=0.1)
print(np.round(Bd.ravel(), 6))     # [0.005 0.1  ]
```

$\mathbf{A}^2 = \mathbf{0}$ here, so the exponential series stops after the linear term and `expm` returns the closed form to round-off. This is the pattern for every linear model in the controls modules: write $\mathbf{A}$, $\mathbf{B}$ once, discretise numerically, and check against a case you can do by hand.
:::

## Check yourself

::: check
Your two-body propagator with `solve_ivp` defaults returns to a position $3\,\mathrm{km}$ from where it started after one revolution. List, in order, the changes you would make, and one you would not.
:::

::: answer
First tighten `rtol` and `atol` from their defaults of `1e-3` and `1e-6` to about `1e-12` each — three significant digits is the whole story of a kilometre-level error on a $7 \times 10^6\,\mathrm{m}$ radius. Second, switch `method` to `"DOP853"`, whose eighth order takes far fewer steps at that tolerance. Third, verify with a conserved quantity: the relative drift of $v^2/2 - \mu/r$ should now be at the $10^{-12}$ level. What you would not do is add points to `t_eval` — it controls only where the solution is *reported*, not how it is computed — or shorten `t_span` and stitch segments, which changes nothing about the per-step error.
:::

::: check
`brentq(f, 0, 10)` raises `ValueError: f(a) and f(b) must have different signs`. What does that tell you, and what are two reasonable next steps?
:::

::: answer
The function has the same sign at both ends, so either there is no root in $[0, 10]$, or there is an even number of them (the function crosses and crosses back). Next steps: evaluate `f` on a grid — `np.sign(f(np.linspace(0, 10, 201)))` — and look for sign changes to find a bracket that contains exactly one root; or reconsider the problem, because a function with no root may be telling you the target is unreachable (the burn cannot zero the miss with the available $\Delta v$). Do not switch to `fsolve` to make the error go away; without a bracket it will happily return a local minimum that is not a root, with `success=False` if you bother to look.
:::

::: check
Why does `filtfilt` produce a filtered signal with no phase lag while `lfilter` does not, and which would you use to estimate a vehicle's touchdown time from post-flight accelerometer data?
:::

::: answer
`lfilter` is causal: each output sample depends on present and past inputs only, and every causal low-pass filter delays the signal. `filtfilt` runs the filter forward and then runs it again backwards over the result; the second pass imposes the same delay in the opposite direction, and the two cancel, at the cost of using future samples. For post-flight analysis you have the whole record, so `filtfilt` is right — the touchdown spike will appear at the true time rather than $N/(4f_c)$ seconds late. On the vehicle itself only `lfilter` is possible, and the delay must be accounted for.
:::

::: check
Write the `solve_ivp` right-hand side for the two-body problem $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3$ with the state ordered $(x, y, z, v_x, v_y, v_z)$, and state the initial condition for a circular orbit at $r = 6\,778\,137\,\mathrm{m}$ in the $xy$-plane.
:::

::: answer
```python
def two_body(t, y, mu):
    r = y[:3]
    rn = np.linalg.norm(r)
    return np.concatenate([y[3:], -mu * r / rn**3])
```

Call with `args=(3.986004418e14,)`. For a circular orbit $v = \sqrt{\mu/r} = 7668.56\,\mathrm{m/s}$, so `y0 = [6778137.0, 0.0, 0.0, 0.0, 7668.558175407055, 0.0]`, and the period is $T = 2\pi\sqrt{r^3/\mu} = 5553.62\,\mathrm{s}$; integrating over `(0, T)` with `DOP853` at `1e-12` should return to `y0` to within a small fraction of a metre. The first three components of the derivative are the velocity — the top half of the state's rate is the bottom half of the state — and the last three are the acceleration.
:::

::: check
A Monte Carlo of 5 000 runs reports a 99.87th-percentile downrange miss of $1210\,\mathrm{m}$. If the misses are normal with mean 0, what is the implied standard deviation, and how many of the 5 000 samples actually lie above the reported percentile?
:::

::: answer
The 99.87th percentile of a normal is $\mu + 3.0115\sigma$ (`stats.norm.ppf(0.9987)` $= 3.0115$), so $\sigma \approx 1210 / 3.0115 \approx 402\,\mathrm{m}$. The percentile is defined so that $0.13\,\%$ of samples exceed it: $0.0013 \times 5000 = 6.5$, so six or seven samples. That is the practical warning behind every $3\sigma$ figure quoted from a Monte Carlo — it is set by a handful of extreme runs, and its own uncertainty is large unless the sample is much bigger or the distribution's shape is trusted.
:::

## Summary

| Subpackage | Call | Notes |
| --- | --- | --- |
| `integrate` | `solve_ivp(fun, t_span, y0, method="RK45", t_eval=None, rtol=1e-3, atol=1e-6)` | `fun(t, y)` returns $d\mathbf{y}/dt$; `sol.t`, `sol.y` is `(n_states, n_times)` |
| orbits | `method="DOP853"`, `rtol=1e-12`, `atol=1e-12` | check with $v^2/2 - \mu/r$ and $\mathbf{r}\times\mathbf{v}$ |
| events | `g.terminal = True`, `g.direction = -1`, `events=[g]` | `sol.t_events`, `sol.y_events`; `dense_output=True` gives `sol.sol(t)` |
| `optimize` | `brentq(f, a, b)`, `root(fun, x0)`, `minimize_scalar`, `minimize(f, x0, method=...)`, `least_squares`, `curve_fit` | check `.success`; bracket roots when you can |
| `linalg` | `solve(A, b)`, `solve(P, b, assume_a="pos")`, `expm`, `cholesky`, `qr`, `svd`, `lstsq`, `solve_continuous_are` | solve, do not invert; `np.linalg.cond` |
| `signal` | `butter(N, fc, fs=fs)`, `filtfilt`, `lfilter`, `welch`, `savgol_filter`, `cont2discrete`, `StateSpace` | `filtfilt` is zero-phase but non-causal; `Wn` is a fraction of $f_s/2$ without `fs=` |
| `stats` | `norm.pdf/cdf/ppf/sf/rvs`, `norm(loc, scale)`, `chi2`, `multivariate_normal`, `describe` | $\Phi(3) = 0.99865$; `ppf(0.9987)` $= 3.0115$; $\pm 1, 2, 3\sigma$: $68.27$, $95.45$, $99.73\,\%$ |

The next lesson turns these arrays — a `solve_ivp` trajectory, a filtered telemetry channel, a Monte Carlo histogram — into figures that a design review will accept.
