---
id: l02-minimize-and-curve-fitting
title: Minimizing, fitting curves and finding the best valley
minutes: 25
covers:
  - 'scipy.optimize: minimize, least_squares, curve_fit, differential_evolution'
---

Imagine you are hiking in thick fog and want to reach the bottom of the valley. You cannot see the valley. You can only feel the ground under your boots. So you feel which way slopes down, take a step that way, and feel again. When every direction slopes up, you stop: you are at a low point.

That is how a computer finds the *smallest* value of a function. In the last lesson the question was "where is this function zero?" Now it is "where is this function lowest?" Finding the input that makes a function as small as possible is called **minimization**, and the whole family of such problems is called **optimization**. The function you are trying to make small is the **[[objective function|objective-word]]** — the single number that scores how good a choice is, where lower is better.

Engineers minimize all the time. The lightest tank that holds a given volume. The fuel-cheapest burn. And, most often of all, the model that best matches a pile of noisy measurements. This lesson covers the four SciPy tools for these jobs: `minimize` for general problems, `least_squares` and `curve_fit` for fitting models to data, and `differential_evolution` for landscapes with many valleys.

## minimize: walking downhill

`scipy.optimize.minimize(fun, x0)` takes a function and a starting guess. The function must take an array of numbers (the **decision variables** — the knobs you are allowed to turn) and return one number, the objective. `minimize` walks downhill from `x0` until the ground is flat in every direction.

What it hands back is a result object. The fields you will use most are:

- `res.x` — the best decision variables it found;
- `res.fun` — the objective's value there;
- `res.success` and `res.message` — whether it thinks it finished, and why it stopped;
- `res.nfev` — how many times it called your function ("number of function evaluations").

::: example The tank with the least metal
A cylindrical propellant tank must hold $V = 10\,\mathrm{m^3}$. Less surface area means less metal, and so less mass. What radius $r$ and height $h$ make the surface area smallest?

**Step 1: one knob.** The area of a closed cylinder is two circular ends plus the side: $A = 2\pi r^2 + 2\pi r h$. The volume fixes the height, because $V = \pi r^2 h$ gives $h = V/(\pi r^2)$. Put that into the side term: $2\pi r \cdot V/(\pi r^2) = 2V/r$. So

$$
A(r) = 2\pi r^2 + \frac{2V}{r}.
$$

The first term grows with $r$ (bigger ends), and the second shrinks (a shorter side). Somewhere between, the total is smallest.

**Step 2: let SciPy walk downhill.**

```python
import numpy as np
from scipy.optimize import minimize

V = 10.0                                  # m^3

def area(x):
    r = x[0]
    return 2 * np.pi * r**2 + 2 * V / r   # m^2

res = minimize(area, x0=[1.0])
r = res.x[0]
print(res.success, round(r, 4))           # True 1.1675
print(round(res.fun, 3))                  # 25.695
print(round(V / (np.pi * r**2), 3))       # 2.335
```

**Step 3: read it.** The best radius is about $1.17\,\mathrm{m}$, the height about $2.34\,\mathrm{m}$, and the area about $25.7\,\mathrm{m^2}$.

**Sanity check.** The height is exactly twice the radius, so the tank is as tall as it is wide. Calculus gives the same thing: the slope of $A(r)$ is $4\pi r - 2V/r^2$, which is zero when $r^3 = V/(2\pi)$, and then $h = 2r$. Real tanks add rounded domes, but "about as tall as it is wide" is the right instinct for the least material.
:::

### Which way is downhill?

To know which way is down, `minimize` needs the **gradient** — the slope of the objective in every direction at once. If you do not give it one, it estimates it by nudging each variable a little and watching the objective change. By default it uses a method called **[[BFGS|bfgs-name]]**, which also remembers how the slope changed from step to step, to learn how curved the valley is.

You can pick another method with `method=`. `'Nelder-Mead'` never uses slopes and is sturdy but slow. `'L-BFGS-B'` allows **bounds**, such as "the radius must be positive". `'SLSQP'` allows equations the answer must satisfy, called **constraints**.

::: warning minimize finds *a* valley, not *the* valley
Every one of these methods is **local**: it walks down from `x0` and stops in whichever valley it lands in. If the landscape has several **[[valleys|local-minima]]**, a different starting guess can give a different answer, and `res.success` will be `True` for each of them. "Success" means "I reached a bottom", never "I reached the lowest bottom".
:::

## Fitting a model is minimizing

Now the most common job of all. You have measurements $y_1, y_2, \dots, y_m$ taken at times $t_1, \dots, t_m$. You have a physical model with a few unknown **parameters** — numbers like a starting pressure or a time constant. You want the parameters that make the model match the data best.

For each measurement, the **[[residual|residual-picture]]** is how far the model misses it:

$$
r_i = \text{model}(t_i) - y_i.
$$

Read $r_i$ as "r sub i", the residual of the $i$-th measurement. Some are positive (model too high), some negative (too low). To score the whole fit with one number, square each residual and add them up. Squaring makes every miss count as positive and punishes big misses much more than small ones. The best fit makes that sum as small as possible, which is why this is called **[[least squares|least-squares-history]]**. SciPy calls half of the sum the **cost**:

$$
\text{cost} = \frac{1}{2}\sum_{i=1}^{m} r_i^2.
$$

(The $\sum$, read "sum", means add up the terms for $i = 1$ through $m$. The half is there to make the calculus tidier and does not move the minimum.)

## least_squares: a tool that knows it is fitting

`scipy.optimize.least_squares(fun, x0)` looks like `minimize`, with one big difference. Your function does not return the cost. It returns the whole **vector of residuals**, one number per measurement. `least_squares` squares and sums them itself.

The result object has `.x` (the fitted parameters), `.cost`, `.fun` (the final residuals), `.jac` (a table of slopes, explained below), `.nfev` and `.success`. You can also pass `bounds=(lower, upper)` to keep each parameter in a sensible range.

::: example A slowly leaking tank
A pressurized tank is being checked for a leak. Its pressure is read once a minute for an hour. A small leak through a tiny hole makes the pressure decay as

$$
p(t) = p_0 \, e^{-t/\tau},
$$

where $p_0$ ("p nought") is the starting pressure in kilopascals and $\tau$ ("tau") is the **time constant** in seconds: the time for the pressure to fall to $1/e$, about 37 percent, of where it started. A longer $\tau$ means a smaller leak. The sensor has about $2\,\mathrm{kPa}$ of random noise.

**Step 1: the data.** Here we make fake data so we know the truth: $p_0 = 300\,\mathrm{kPa}$, $\tau = 2400\,\mathrm{s}$.

**Step 2: a starting guess from the data, not from the truth.** The first reading is a fine guess for $p_0$. For $\tau$, find the first time the reading drops below $p_0/e$ — that is what $\tau$ means.

**Step 3: residuals and the fit.**

```python
import numpy as np
from scipy.optimize import least_squares

rng = np.random.default_rng(7)
t = np.linspace(0.0, 3600.0, 61)                        # s, once a minute
p = 300.0 * np.exp(-t / 2400.0) + rng.normal(0.0, 2.0, t.size)   # kPa

p0_guess = p[0]
tau_guess = t[np.argmax(p < p0_guess / np.e)]           # first time below 37 %
print(round(p0_guess, 1), tau_guess)                    # 300.0 2460.0

def residuals(x):
    p0, tau = x
    return p0 * np.exp(-t / tau) - p

sol = least_squares(residuals, x0=[p0_guess, tau_guess],
                    bounds=([0.0, 1.0], [np.inf, np.inf]))
print(sol.success, np.round(sol.x, 1), sol.nfev)        # True [ 299.1 2400.5] 5
```

`np.argmax(p < limit)` finds the index of the first `True`, so it picks the first reading below the limit. The bounds keep $\tau$ at least $1\,\mathrm{s}$, so the solver can never try a zero or negative time constant, which would divide by zero or make the model explode.

**Step 4: sanity check.** The fit says $p_0 \approx 299.1\,\mathrm{kPa}$ and $\tau \approx 2400.5\,\mathrm{s}$, very close to the truth of $300$ and $2400$. It took only 5 calls to the residual function. After an hour, the model predicts $300\,e^{-1.5} \approx 67\,\mathrm{kPa}$, and the last reading was about $67.3$. The fit and the data agree at the far end too.
:::

::: warning Never start from the answer you already know
In a test you often know the true parameters because you made the fake data. It is tempting to hand them in as `x0`. Then the fit looks perfect, and it tells you nothing about how the code will behave on real data, where nobody knows the truth. Build the guess from the data itself: the first reading, the last reading, the time it takes to fall part of the way. That is what makes a fitting function trustworthy.
:::

### Why least_squares beats minimize here

You could hand the same problem to `minimize`, with an objective that returns `np.sum(residuals(x)**2)`. Try it on the leaking tank from the same starting guess, and `minimize` takes 174 function calls and ends with `success` equal to `False` and the message "Desired error not necessarily achieved due to precision loss". It reached nearly the right numbers, but it worked about thirty times harder and could not tell that it had finished.

The reason is what each tool knows. `minimize` sees one number per call, the total, and must learn the shape of the valley slowly by poking at it. `least_squares` sees every residual separately. From how each residual changes when a parameter is nudged, it builds the **Jacobian** — the table of those slopes, one row per measurement and one column per parameter. From the Jacobian alone it gets a good picture of how curved the valley is, without the second derivatives that `minimize` has to guess at. That picture is called the **[[Gauss-Newton|gauss-newton-idea]]** approximation, and the version with a safety brake is called **Levenberg-Marquardt**.

::: key
least_squares vs minimize for a curve fit: least_squares knows the objective is a sum of squared residuals, so it builds a Gauss-Newton/Levenberg-Marquardt approximation of the Hessian from the Jacobian. Handing the same problem to minimize as a scalar throws that structure away and converges far more slowly.
:::

The **Hessian** in that card is the table of second derivatives of the cost: how sharply the valley curves in every direction. The next lesson opens up the Jacobian and shows exactly where that approximation comes from.

## How sure are the fitted numbers?

A fit gives you numbers. An engineer also has to say how much to trust them. If the noise had come out a bit differently, the fitted $\tau$ would shift. By how much?

The answer is a **covariance matrix** — a small table that holds, on its diagonal, the **variance** of each parameter (the square of its typical wobble), and off the diagonal, how two parameters wobble together. The square root of a variance is a **standard deviation**, written $\sigma$ ("sigma"). A "one-sigma" uncertainty means that, for Gaussian noise, the truth lies within one $\sigma$ of the estimate about **[[68 percent of the time|one-sigma]]**.

`scipy.optimize.curve_fit` does a least-squares fit and hands this table back for you. You write the model as a plain Python function whose first argument is the time and whose remaining arguments are the parameters:

```python
import numpy as np
from scipy.optimize import curve_fit

rng = np.random.default_rng(7)
t = np.linspace(0.0, 3600.0, 61)
p = 300.0 * np.exp(-t / 2400.0) + rng.normal(0.0, 2.0, t.size)

def model(t, p0, tau):
    return p0 * np.exp(-t / tau)

popt, pcov = curve_fit(model, t, p, p0=[300.0, 2460.0])
perr = np.sqrt(np.diag(pcov))
print(np.round(popt, 1))       # [ 299.1 2400.5]
print(np.round(perr, 2))       # [0.61 8.9 ]
```

`popt` holds the optimal parameters. `pcov` is the covariance matrix. `np.diag(pcov)` pulls out its diagonal, and the square root turns each variance into a one-sigma uncertainty. Here the argument named `p0` is `curve_fit`'s name for the starting guess — it has nothing to do with our pressure $p_0$, which is an unlucky coincidence of names.

So the honest report is $p_0 = 299.1 \pm 0.6\,\mathrm{kPa}$ and $\tau = 2400 \pm 9\,\mathrm{s}$. The true $\tau$ of $2400\,\mathrm{s}$ sits well inside one sigma. The true $p_0$ is $1.5$ sigma away, which happens often enough with random noise: only about two times in three is the truth inside one sigma.

::: key
curve_fit returns pcov: the estimated covariance of the fitted parameters; the square roots of the diagonal are one-sigma uncertainties, assuming the residuals are independent Gaussian with the scale implied by the fit. Report those, not just the point estimate.
:::

### Doing the same with least_squares

`least_squares` does not hand you `pcov`, but its result has everything needed to build it. With $m$ measurements and $n$ parameters:

1. Estimate the noise variance from what is left over: $s^2 = 2\,\text{cost}/(m - n)$. (The cost is half the sum of squares, so $2\,\text{cost}$ is the sum. Dividing by $m - n$ instead of $m$ allows for the $n$ numbers the fit already used up.)
2. Build the covariance: $\text{cov} = s^2 (\mathbf{J}^\mathsf{T}\mathbf{J})^{-1}$, where $\mathbf{J}$ is `sol.jac` and $\mathbf{J}^\mathsf{T}$ ("J transpose") is $\mathbf{J}$ flipped so rows become columns.

```python
J = sol.jac                       # from the leaking-tank fit above
m, n = J.shape
s2 = 2 * sol.cost / (m - n)
cov = s2 * np.linalg.inv(J.T @ J)
print(round(np.sqrt(s2), 2))              # 1.76
print(np.round(np.sqrt(np.diag(cov)), 2)) # [0.61 8.9 ]
```

(Run it after the leaking-tank code, so `sol` exists.) The noise estimate $s \approx 1.76\,\mathrm{kPa}$ is close to the $2\,\mathrm{kPa}$ that went in, and the uncertainties match `curve_fit` exactly. That is no accident: `curve_fit` does this same arithmetic on the Jacobian at the minimum. Its solver differs a little. With no bounds, as here, it uses MINPACK's Levenberg-Marquardt code (`method='lm'`), not `least_squares`; give it `bounds=` and it calls `least_squares` itself with `method='trf'`. Both land on the same minimum for this fit.

::: warning What pcov assumes
By default `curve_fit` has no idea how noisy your sensor is. It estimates the noise from the leftover residuals, as in step 1 above. If you know each reading's standard deviation, pass it as `sigma=`, and add `absolute_sigma=True` so SciPy uses your numbers as they are instead of rescaling them. And `pcov` only means what it says if the misses are independent and bell-shaped. If the model is wrong — say the real leak is not exponential — the residuals have a pattern in them, and the one-sigma numbers will be too optimistic. Always plot the residuals and look for a pattern before you quote an uncertainty.
:::

## differential_evolution: when there are many valleys

Some problems have lots of valleys, and local methods get stuck in the wrong one. A classic case is fitting the frequency of a vibration. A sine wave with the wrong frequency lines up with the data now and then, by luck, and each of those near-matches is a small valley in the cost.

`scipy.optimize.differential_evolution` takes a different approach. Instead of one hiker, it sends out a whole **population** of guesses scattered across a box you define. At each round, it builds new trial guesses by mixing the differences between existing ones, and keeps a trial wherever it beats the guess it would replace. Over many rounds the population drifts toward the lowest valley. It is a **[[global method|evolution-history]]**: it searches the whole box, not only the valley around one start.

Because it must know the box to scatter guesses in, you give it `bounds` — a low and high value for every parameter — instead of a starting guess. It uses random numbers, so pass `seed=` to get the same answer every run.

::: example Finding the frequency of a vibration
An accelerometer records $2\,\mathrm{s}$ of a vibration, $201$ samples, with noise. The true signal is $0.8\sin(2\pi \cdot 3.7\,t + 0.4)$: amplitude $0.8$, frequency $3.7\,\mathrm{Hz}$, phase $0.4\,\mathrm{rad}$. We fit amplitude $A$, frequency $f$ and phase $\phi$ ("phi").

**Step 1: try a local fit from several starting frequencies.**

```python
import numpy as np
from scipy.optimize import least_squares, differential_evolution

rng = np.random.default_rng(3)
t = np.linspace(0.0, 2.0, 201)
y = 0.8 * np.sin(2 * np.pi * 3.7 * t + 0.4) + rng.normal(0.0, 0.1, t.size)

def resid(x):
    A, f, phase = x
    return A * np.sin(2 * np.pi * f * t + phase) - y

for f0 in (1.0, 3.5, 5.0):
    sol = least_squares(resid, [1.0, f0, 0.0])
    print(f0, np.round(sol.x[1], 3), round(sol.cost, 2))
# 1.0 0.996 32.01
# 3.5 2.979 30.5
# 5.0 4.913 31.87
```

Every start ends in a wrong valley, even $3.5\,\mathrm{Hz}$, which is close. Each of them reports a cost of about 30. As you will see in step 2, the right answer has a cost of about 1, so these fits are poor, yet each solver stopped happily because it was at the bottom of *its* valley.

**Step 2: search the whole box.**

```python
bounds = [(0.0, 2.0), (0.5, 10.0), (-np.pi, np.pi)]    # A, f in Hz, phase
cost = lambda x: np.sum(resid(x) ** 2)
res = differential_evolution(cost, bounds, seed=1)
print(np.round(res.x, 3), res.nfev)     # [0.785 3.694 0.458] 1320
```

(Run it after step 1, so `resid` exists.)

**Step 3: sanity check.** The global search finds $A \approx 0.785$, $f \approx 3.694\,\mathrm{Hz}$ and $\phi \approx 0.458\,\mathrm{rad}$, close to the true $0.8$, $3.7$ and $0.4$. It needed 1,320 function calls against a few dozen for a local fit. That is the usual price: global methods are slow, so use them to find the right valley and let a local method finish. `differential_evolution` does that last part itself — by default it "polishes" its best guess with a quick local minimizer at the end.
:::

In practice engineers often combine the two ideas by hand as well: a coarse global search, or a sensible guess from physics (here, the frequency of the biggest peak in the spectrum), followed by `least_squares` for the precise answer and its uncertainty.

## Choosing among the four

| Tool | Your function returns | Needs | Good for |
|---|---|---|---|
| `minimize(fun, x0)` | one number | a starting guess | general objectives: mass, fuel, cost |
| `least_squares(fun, x0)` | a vector of residuals | a starting guess | fitting models; bounds; you get `jac` |
| `curve_fit(model, t, y, p0)` | model values at `t` | a starting guess | quick fits with `pcov` handed back |
| `differential_evolution(fun, bounds)` | one number | a box of bounds | many valleys; slow but global |

The rule of thumb: if your objective is a sum of squared misses, use a tool that knows it (`least_squares` or `curve_fit`). If it is some other score, use `minimize`. If you have reason to fear many valleys, start global.

## Check yourself

::: check
A fit has $m = 200$ measurements and $n = 3$ parameters, and `least_squares` reports `cost = 0.985`. Estimate the standard deviation of the measurement noise.
:::

::: answer
The sum of squared residuals is $2 \times 0.985 = 1.97$. Divide by the leftover count, $m - n = 197$: $s^2 = 1.97/197 = 0.01$. The standard deviation is $s = \sqrt{0.01} = 0.1$, in the units of the measurements.
:::

::: check
`curve_fit` returns `pcov = [[4.0, 0.3], [0.3, 0.25]]` for parameters $(a, b)$. What are the one-sigma uncertainties?
:::

::: answer
Take the diagonal, $4.0$ and $0.25$, and square-root each: $\sigma_a = 2.0$ and $\sigma_b = 0.5$. The off-diagonal $0.3$ is not an uncertainty; it says how $a$ and $b$ tend to wobble together.
:::

::: check
You fit $y = a\,e^{-t/\tau} + c$ to a sensor that settles to a steady value. Suggest a starting guess for each of $a$, $\tau$ and $c$ built only from the data.
:::

::: answer
The curve flattens out at $c$, so average the last few readings (say the last tenth of them) for $c$. At $t = 0$ the model is $a + c$, so $a \approx y_0 - c$, the first reading minus that settled value. For $\tau$, look for the time at which the distance to $c$ has shrunk to about 37 percent of $a$; if that is awkward, a fraction of the record length (such as a third of it) is a reasonable rough start. None of these needs the true answer.
:::

::: check
Your colleague fits a model with `minimize` on `np.sum(r**2)` and it works, but takes 40 seconds. What would you try first, and why should it help?
:::

::: answer
Return the residual vector `r` itself and call `least_squares`. It can see every residual and build the Jacobian, and from that a good approximation of the valley's curvature (the Gauss-Newton approximation of the Hessian). `minimize` only sees the total and has to learn the curvature slowly, so it usually needs many more function calls for the same fit.
:::

::: check
`differential_evolution` found a good answer, but a teammate running your script gets slightly different numbers. What is going on and what should you change?
:::

::: answer
The method uses random numbers to scatter and mix its population, so two runs follow different paths and stop at slightly different points. Pass a fixed `seed=` (for example `seed=1`) so every run is the same, and let its final polish step (on by default) or a follow-up `least_squares` refine the answer to full precision.
:::

## Summary

| Idea | Meaning | In SciPy |
|---|---|---|
| objective | one number to make as small as possible | `minimize(fun, x0)`, read `res.x`, `res.fun`, `res.success` |
| residual | $r_i = \text{model}(t_i) - y_i$ | the vector your `least_squares` function returns |
| cost | $\frac{1}{2}\sum r_i^2$ | `sol.cost` |
| Jacobian | slopes of each residual with each parameter | `sol.jac` |
| noise estimate | $s^2 = 2\,\text{cost}/(m - n)$ | from `sol.cost` and the sizes |
| covariance | $s^2(\mathbf{J}^\mathsf{T}\mathbf{J})^{-1}$; one-sigma = square root of the diagonal | `pcov` from `curve_fit` |
| global search | many guesses, many rounds, within bounds | `differential_evolution(fun, bounds, seed=...)` |

Twice in this lesson the Jacobian did the quiet work: it made `least_squares` fast and it produced the uncertainties. The next lesson looks inside it, and shows why a fit can fail when its decision variables are wildly different sizes.

::: context objective-word Why "objective"
The objective is what you are aiming at, like the objective of a mission. In optimization it is always boiled down to one number, because a computer can only compare "better or worse" along a single scale. When a design has two goals — light *and* strong — engineers either add them with weights into one score, or keep one as the objective and make the other a constraint, such as "as light as possible, with a safety factor of at least 1.4".
:::

::: context bfgs-name Four names in one acronym
BFGS stands for Broyden, Fletcher, Goldfarb and Shanno, four mathematicians who each published the same updating rule in 1970, working separately. The method keeps a running estimate of the valley's curvature and improves it after every step, using only how the slope changed. It is the default in `minimize` for problems without bounds or constraints because it is fast and sturdy on smooth objectives.
:::

::: context local-minima A landscape with three valleys
Start the hiker on the left and she stops in the first dip. Start her on the right and she stops in the third. Only the middle one is the lowest point. Every local method behaves like the hiker.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polyline fill="none" stroke="#1f2a44" stroke-width="2.5" points="30.0,31.2 37.5,41.5 45.0,55.8 52.5,72.4 60.0,89.5 67.5,104.6 75.0,116.0 82.5,122.5 90.0,123.9 97.5,121.2 105.0,116.1 112.5,110.9 120.0,107.7 127.5,108.1 135.0,113.0 142.5,121.9 150.0,133.8 157.5,146.5 165.0,157.8 172.5,165.7 180.0,168.8 187.5,166.9 195.0,160.5 202.5,151.4 210.0,141.5 217.5,133.2 225.0,128.2 232.5,127.6 240.0,131.3 247.5,138.1 255.0,146.4 262.5,153.7 270.0,158.1 277.5,157.9 285.0,152.6 292.5,142.7 300.0,129.5 307.5,115.2 315.0,101.9 322.5,91.6 330.0,85.4"/>
  <circle cx="88.5" cy="124" r="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="88" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">local</text>
  <circle cx="180.9" cy="168.9" r="5" fill="#1d6fd1"/>
  <text x="181" y="192" font-size="11" text-anchor="middle" fill="#1d6fd1">global (lowest)</text>
  <circle cx="273.6" cy="158.6" r="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="300" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">local</text>
  <text x="40" y="22" font-size="11" fill="#6c7a93">objective</text>
</svg>
```
:::

::: context residual-picture Residuals are vertical gaps
Each dot is a measurement and the curve is the model. A residual is the vertical gap between them at one time: above the curve counts one way, below it the other. Least squares squares every gap and adds them up, then moves the curve to make that total smallest.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="25" y1="175" x2="340" y2="175" stroke="#6c7a93" stroke-width="1"/>
  <line x1="25" y1="175" x2="25" y2="25" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="30.0,40.0 40.0,51.3 50.0,61.6 60.0,71.0 70.0,79.6 80.0,87.5 90.0,94.7 100.0,101.2 110.0,107.2 120.0,112.6 130.0,117.6 140.0,122.2 150.0,126.3 160.0,130.1 170.0,133.6 180.0,136.8 190.0,139.6 200.0,142.3 210.0,144.7 220.0,146.9 230.0,148.9 240.0,150.7 250.0,152.4 260.0,153.9 270.0,155.3 280.0,156.6 290.0,157.8 300.0,158.8 310.0,159.8 320.0,160.7 330.0,161.5"/>
  <line x1="55" y1="66.4" x2="55" y2="78.4" stroke="#b4232c" stroke-width="2"/>
  <line x1="92.9" y1="96.6" x2="92.9" y2="86.6" stroke="#b4232c" stroke-width="2"/>
  <line x1="130.7" y1="118" x2="130.7" y2="126" stroke="#b4232c" stroke-width="2"/>
  <line x1="168.6" y1="133.1" x2="168.6" y2="119.1" stroke="#b4232c" stroke-width="2"/>
  <line x1="206.4" y1="143.9" x2="206.4" y2="149.9" stroke="#b4232c" stroke-width="2"/>
  <line x1="244.3" y1="151.5" x2="244.3" y2="162.5" stroke="#b4232c" stroke-width="2"/>
  <line x1="282.1" y1="156.9" x2="282.1" y2="147.9" stroke="#b4232c" stroke-width="2"/>
  <line x1="320" y1="160.7" x2="320" y2="165.7" stroke="#b4232c" stroke-width="2"/>
  <circle cx="55" cy="78.4" r="4" fill="#1f2a44"/>
  <circle cx="92.9" cy="86.6" r="4" fill="#1f2a44"/>
  <circle cx="130.7" cy="126" r="4" fill="#1f2a44"/>
  <circle cx="168.6" cy="119.1" r="4" fill="#1f2a44"/>
  <circle cx="206.4" cy="149.9" r="4" fill="#1f2a44"/>
  <circle cx="244.3" cy="162.5" r="4" fill="#1f2a44"/>
  <circle cx="282.1" cy="147.9" r="4" fill="#1f2a44"/>
  <circle cx="320" cy="165.7" r="4" fill="#1f2a44"/>
  <text x="200" y="60" font-size="12" fill="#1d6fd1">model curve</text>
  <text x="200" y="80" font-size="12" fill="#b4232c">residuals (red gaps)</text>
  <text x="200" y="100" font-size="12" fill="#1f2a44">measurements (dots)</text>
</svg>
```
:::

::: context least-squares-history Least squares found a lost planet
In 1801 the Italian astronomer Giuseppe Piazzi spotted Ceres, then lost it behind the Sun after only a few weeks of sightings. The young Carl Friedrich Gauss fitted an orbit to those few, noisy observations by minimizing squared errors, and predicted where Ceres would reappear. Astronomers found it very close to his prediction at the end of 1801. Adrien-Marie Legendre published the method in 1805, and Gauss his account in 1809. Orbit determination still works this way today.
:::

::: context gauss-newton-idea Where the curvature comes from
The cost is $\frac{1}{2}\sum r_i^2$. Its curvature (the Hessian) has two parts: one made only of first slopes, $\mathbf{J}^\mathsf{T}\mathbf{J}$, and one that involves each residual times its second derivatives. Near a good fit the residuals are small, so the second part is small too, and $\mathbf{J}^\mathsf{T}\mathbf{J}$ alone is a good stand-in. Gauss-Newton uses exactly that. Levenberg (1944) and Marquardt (1963) added a brake: when a step makes things worse, the method takes a shorter step, closer to plain downhill.
:::

::: context one-sigma What one sigma covers
For bell-shaped (Gaussian) noise, about 68 percent of outcomes fall within one standard deviation of the middle, 95 percent within two and 99.7 percent within three. So a one-sigma error bar should miss the truth about one time in three. A report where the truth is never outside one sigma is suspicious: the uncertainties are probably too big.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M125,170 L125.0,91.2 L131.9,81.3 L138.8,71.9 L145.6,63.1 L152.5,55.3 L159.4,48.8 L166.2,44.0 L173.1,41.0 L180.0,40.0 L186.9,41.0 L193.8,44.0 L200.6,48.8 L207.5,55.3 L214.4,63.1 L221.2,71.9 L228.1,81.3 L235.0,91.2 L235,170 Z" fill="#8fb8f0"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="15.0,168.6 21.9,167.9 28.8,167.0 35.6,165.9 42.5,164.3 49.4,162.3 56.2,159.7 63.1,156.4 70.0,152.4 76.9,147.6 83.8,141.9 90.6,135.3 97.5,127.8 104.4,119.5 111.2,110.5 118.1,101.0 125.0,91.2 131.9,81.3 138.8,71.9 145.6,63.1 152.5,55.3 159.4,48.8 166.2,44.0 173.1,41.0 180.0,40.0 186.9,41.0 193.8,44.0 200.6,48.8 207.5,55.3 214.4,63.1 221.2,71.9 228.1,81.3 235.0,91.2 241.9,101.0 248.8,110.5 255.6,119.5 262.5,127.8 269.4,135.3 276.2,141.9 283.1,147.6 290.0,152.4 296.9,156.4 303.8,159.7 310.6,162.3 317.5,164.3 324.4,165.9 331.2,167.0 338.1,167.9 345.0,168.6"/>
  <line x1="10" y1="170" x2="350" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <text x="180" y="130" font-size="13" text-anchor="middle" fill="#1f2a44">68 %</text>
  <text x="125" y="188" font-size="12" text-anchor="middle" fill="#1f2a44">−1σ</text>
  <text x="180" y="188" font-size="12" text-anchor="middle" fill="#1f2a44">estimate</text>
  <text x="235" y="188" font-size="12" text-anchor="middle" fill="#1f2a44">+1σ</text>
</svg>
```
:::

::: context evolution-history Borrowed from biology
Differential evolution was published by Rainer Storn and Kenneth Price in the mid-1990s. The words come from biology: a population of candidates, "mutation" by adding a scaled difference of two members to a third, "crossover" by mixing in some of the old member's values, and "selection" by keeping whichever is fitter. It needs no slopes at all, so it works on objectives that are noisy, jumpy or come out of a whole simulation run — such as scoring a guidance law by flying it in a simulator.
:::
