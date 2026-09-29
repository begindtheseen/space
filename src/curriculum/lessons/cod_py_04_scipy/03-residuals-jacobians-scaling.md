---
id: l03-residuals-jacobians-scaling
title: Residuals, Jacobians and scaling
minutes: 25
covers:
  - Residuals, Jacobians, scaling and why conditioning of decision variables matters
---

Picture a recipe written by someone careless with units. It says "flour: 0.5" in kilograms and "salt: 5000" in milligrams. Both numbers are correct. But if you tell a helper "adjust each ingredient by 1", they add a whole kilogram of flour and one grain of salt. The same size of nudge means wildly different things for different ingredients.

An optimizer has exactly this problem. It treats all your decision variables as numbers on one ruler. It takes steps of similar size in every direction, and it decides it has finished using one set of tolerances for all of them. If one variable is about $10^{-6}$ and another is about $10^{3}$, one of them is being measured with the wrong ruler, and the solver can stop early, crawl, or wander, while still reporting success.

In the last lesson `least_squares` beat `minimize` because it could see each residual and build the Jacobian. This lesson opens that machinery up. You will build a **Jacobian** by hand, see how a solver turns it into a step, measure how **well-conditioned** a problem is, and learn the habit that fixes most fitting trouble: scale everything to about size 1. On a real spacecraft this is daily work — calibrating a gyro, fitting an orbit, tuning a thruster model — where the unknowns mix meters, seconds, radians per second and pure numbers in one fit.

## A well-scaled residual has no units

Recall the residual: the model's prediction minus the measurement, $r_i = \text{model}(t_i) - y_i$. It carries the measurement's units, so a gyro fit has residuals in radians per second, around $10^{-7}$. A cost built from those, the sum of their squares, is around $10^{-10}$, a number so small that a solver's built-in tolerances may treat it as already zero.

The fix is to divide each residual by the **standard deviation** $\sigma$ of that measurement's noise, its typical random error:

$$
\tilde{r}_i = \frac{\text{model}(t_i) - y_i}{\sigma_i}.
$$

Read $\tilde{r}_i$ as "r tilde sub i". Now each residual is a pure number with no units. It says "this miss is 0.3 of a typical noise size" or "this miss is 4 noise sizes, suspicious". A good fit has residuals mostly between $-2$ and $+2$, and the sum of their squares is close to the number of measurements. This is called a **weighted** residual, because a precise sensor (small $\sigma$) gets a big say and a noisy one a small say.

::: key
A well-scaled residual is divided by the measurement noise $\sigma$, so it is dimensionless and of order 1. For a good fit with $m$ measurements, $\sum \tilde{r}_i^2 \approx m$.
:::

Weighting also lets you mix different kinds of data in one fit. A position in meters and a velocity in meters per second cannot be added together as they are. Divided by their own noise levels, both become "number of sigmas", and those can be added.

## The Jacobian: a table of sensitivities

Now the central object. Suppose the model has parameters $x_1, x_2, \dots, x_n$. For each residual $r_i$ and each parameter $x_j$, ask: "if I nudge $x_j$ a tiny bit, how much does $r_i$ change, per unit of nudge?" That rate is a **[[partial derivative|partial-derivative]]**, written

$$
\frac{\partial r_i}{\partial x_j}
$$

and read "partial r i by partial x j". The curly $\partial$ means "a derivative with respect to one variable, holding all the others fixed". Put all of these rates in a table with one row per residual and one column per parameter, and you have the **Jacobian** $\mathbf{J}$:

$$
\mathbf{J} = \begin{bmatrix}
\frac{\partial r_1}{\partial x_1} & \cdots & \frac{\partial r_1}{\partial x_n} \\
\vdots & & \vdots \\
\frac{\partial r_m}{\partial x_1} & \cdots & \frac{\partial r_m}{\partial x_n}
\end{bmatrix}.
$$

With $m$ measurements and $n$ parameters it has shape $m \times n$: tall and thin, because you usually have many more measurements than unknowns. Each **column** tells you how every measurement reacts to one parameter. That is the picture to keep: a column is a parameter's **[[fingerprint|column-fingerprint]]** on the data.

::: example The Jacobian of the leaking tank
In the last lesson the tank pressure was $p(t) = p_0 e^{-t/\tau}$, and the residual was $r_i = p_0 e^{-t_i/\tau} - y_i$. Take the two partial derivatives.

**Column 1, with respect to $p_0$.** The measurement $y_i$ does not depend on $p_0$, and $p_0$ multiplies the exponential, so

$$
\frac{\partial r_i}{\partial p_0} = e^{-t_i/\tau}.
$$

**Column 2, with respect to $\tau$.** Use the chain rule. The derivative of $e^{u}$ is $e^{u}$ times the derivative of $u$, and here $u = -t_i/\tau$, whose derivative with respect to $\tau$ is $t_i/\tau^2$. So

$$
\frac{\partial r_i}{\partial \tau} = p_0 \frac{t_i}{\tau^2} e^{-t_i/\tau}.
$$

**Numbers.** At $p_0 = 300\,\mathrm{kPa}$, $\tau = 2400\,\mathrm{s}$ and three times $t = 0$, $600$ and $1200\,\mathrm{s}$:

| $t$ (s) | $\partial r/\partial p_0$ | $\partial r/\partial \tau$ (kPa/s) |
|---|---|---|
| 0 | 1.00000 | 0.00000 |
| 600 | 0.77880 | 0.02434 |
| 1200 | 0.60653 | 0.03791 |

**Reading it.** At $t = 0$ the pressure is $p_0$ no matter what $\tau$ is, so the $\tau$ column is zero there: the first reading says nothing about the leak rate. Later readings are what pin down $\tau$. The units differ by column: the first is kPa per kPa (no units), the second kPa per second.

**Checking it in code.** When you pass your own Jacobian function as `jac=`, `least_squares` uses it instead of estimating one. Compare against SciPy's estimate:

```python
import numpy as np
from scipy.optimize import least_squares

rng = np.random.default_rng(7)
t = np.linspace(0.0, 3600.0, 61)
p = 300.0 * np.exp(-t / 2400.0) + rng.normal(0.0, 2.0, t.size)

def residuals(x):
    p0, tau = x
    return p0 * np.exp(-t / tau) - p

def jac(x):
    p0, tau = x
    e = np.exp(-t / tau)
    return np.column_stack([e, p0 * t / tau**2 * e])

sol = least_squares(residuals, x0=[300.0, 2460.0])      # SciPy estimates J
diff = np.max(np.abs(sol.jac - jac(sol.x)))
print(np.round(sol.x, 1), diff < 1e-7)                  # [ 299.1 2400.5] True
```

`np.column_stack` glues the two columns side by side into a $61 \times 2$ table. The two Jacobians agree to about eight decimal places, so the hand derivation is right.
:::

### Where SciPy's estimate comes from

If you do not pass `jac=`, SciPy builds the Jacobian by **finite differences**: it nudges each parameter by a tiny step $h$, reruns your residual function, and divides the change by $h$. The default, `jac='2-point'`, costs one extra call per parameter. `jac='3-point'` nudges both ways and is more accurate, at twice the cost.

The nudge is sized relative to the parameter, about $10^{-8}$ times its value. That is one more reason scaling matters: a parameter sitting at exactly zero, or one far smaller than its neighbors, can get a nudge that is too small to change the residuals above the computer's rounding noise.

::: warning Test a hand-written Jacobian before you trust it
A wrong analytic Jacobian does not crash. The solver takes bad steps, crawls, and may stop at a wrong answer with a cheerful `success`. Always compare your `jac` against a finite-difference estimate once, as in the example. A mismatch in one column points straight at the derivative you got wrong.
:::

## From Jacobian to step: Gauss-Newton

Now the reason the Jacobian is worth having. Near the current guess $\mathbf{x}$, the residuals change almost in a straight line. If you move the parameters by a small step $\Delta\mathbf{x}$ (read "delta x", a change in $\mathbf{x}$), the residual vector becomes about

$$
\mathbf{r}(\mathbf{x} + \Delta\mathbf{x}) \approx \mathbf{r} + \mathbf{J}\,\Delta\mathbf{x}.
$$

That is a tangent-line guess, like Newton's method in lesson 1, but with a whole table of slopes. Choose the step that makes this straight-line prediction as small as possible in the least-squares sense. The best step solves

$$
\mathbf{J}^\mathsf{T}\mathbf{J}\,\Delta\mathbf{x} = -\mathbf{J}^\mathsf{T}\mathbf{r}.
$$

These are called the **normal equations**. $\mathbf{J}^\mathsf{T}\mathbf{J}$ is a small $n \times n$ square table — here $2 \times 2$ — even though $\mathbf{J}$ has 61 rows. Solve, step, rebuild $\mathbf{J}$ at the new point, and repeat. That loop is the **Gauss-Newton method**.

```python
x = np.array([280.0, 3000.0])       # a deliberately poor start
for step in range(4):
    r = residuals(x)
    J = jac(x)
    dx = np.linalg.solve(J.T @ J, -J.T @ r)
    x = x + dx
    print(step + 1, np.round(x, 1), round(0.5 * np.sum(residuals(x)**2), 1))
# 1 [ 297.8 2294.6] 769.8
# 2 [ 299.1 2398.7] 91.3
# 3 [ 299.1 2400.5] 91.1
# 4 [ 299.1 2400.5] 91.1
```

(Run it after the tank code above, so `residuals` and `jac` exist.) The cost falls from about 5,404 at the start to 91.1 in three steps, the same answer `least_squares` found in the last lesson.

::: note Why it has to be true
The straight-line residual is $\mathbf{r} + \mathbf{J}\Delta\mathbf{x}$, and its sum of squares is

$$
S(\Delta\mathbf{x}) = (\mathbf{r} + \mathbf{J}\Delta\mathbf{x})^\mathsf{T}(\mathbf{r} + \mathbf{J}\Delta\mathbf{x}) = \mathbf{r}^\mathsf{T}\mathbf{r} + 2\,\Delta\mathbf{x}^\mathsf{T}\mathbf{J}^\mathsf{T}\mathbf{r} + \Delta\mathbf{x}^\mathsf{T}\mathbf{J}^\mathsf{T}\mathbf{J}\,\Delta\mathbf{x}.
$$

At the lowest point, the slope with respect to every component of $\Delta\mathbf{x}$ is zero. The slope of the middle term is $2\mathbf{J}^\mathsf{T}\mathbf{r}$ and the slope of the last is $2\mathbf{J}^\mathsf{T}\mathbf{J}\,\Delta\mathbf{x}$. Setting their sum to zero and dividing by 2 gives $\mathbf{J}^\mathsf{T}\mathbf{J}\,\Delta\mathbf{x} = -\mathbf{J}^\mathsf{T}\mathbf{r}$. The same table $\mathbf{J}^\mathsf{T}\mathbf{J}$ is the stand-in for the Hessian that the last lesson mentioned, and its inverse, times the noise variance, is the covariance used for error bars.
:::

Pure Gauss-Newton can overshoot when the start is poor. **Levenberg-Marquardt** adds a brake: it solves $(\mathbf{J}^\mathsf{T}\mathbf{J} + \lambda\mathbf{I})\Delta\mathbf{x} = -\mathbf{J}^\mathsf{T}\mathbf{r}$, where $\lambda$ ("lambda") is a positive number it raises when a step fails and lowers when steps succeed, and $\mathbf{I}$ is the identity table (ones on the diagonal). SciPy's default method, `'trf'`, does something similar with a **[[trust region|trust-region]]**: a limit on how far any one step may go.

Look at that brake closely. $\lambda\mathbf{I}$ adds the *same* amount to every parameter's diagonal entry, and a trust region limits steps with *one* radius in every direction. Both assume a step of 1 means the same thing for every parameter. That assumption is exactly the recipe problem from the start.

## Conditioning: how much the answer can be trusted

Some problems are touchy: a tiny change in the data makes a big change in the answer. That touchiness is called **[[conditioning|condition-picture]]**. A **well-conditioned** problem is calm; an **ill-conditioned** one amplifies every small error.

For a fit, the Jacobian tells you which kind you have. Its **condition number**, written $\kappa(\mathbf{J})$ (read "kappa of J"), is roughly the ratio of its strongest direction to its weakest: how much more the data reacts to the most-felt combination of parameters than to the least-felt one. NumPy computes it with `np.linalg.cond(J)`.

- A condition number near 1 is ideal. Every direction is felt about equally.
- A condition number of $10^{k}$ means you can lose about $k$ digits of accuracy in the answer.
- Forming $\mathbf{J}^\mathsf{T}\mathbf{J}$ **squares** it: $\kappa(\mathbf{J}^\mathsf{T}\mathbf{J}) = \kappa(\mathbf{J})^2$. That is why good solvers avoid building $\mathbf{J}^\mathsf{T}\mathbf{J}$ directly when they can.

Two quite different things make $\kappa$ large, and they need different fixes:

1. **Bad scaling.** One column is tiny next to another only because of the units chosen. The problem is fine; the ruler is wrong. Rescaling fixes it.
2. **Near-degeneracy.** Two columns have almost the same fingerprint, so the data cannot tell those parameters apart. No rescaling helps. You need better data or a different set of parameters.

::: warning A large condition number with a "successful" fit
`least_squares` and `minimize` do not warn you about conditioning. A fit can end with `success` true, small residuals and a beautiful plot, and still have parameters that mean almost nothing. Look at `np.linalg.cond(sol.jac)` and at the correlations in the covariance matrix before you believe individual parameter values.
:::

## Scaling the decision variables

Here is the fix for the first cause. A gyroscope's **[[bias|gyro-bias]]** is the small reading it gives when it is not rotating. After switch-on, the bias of many gyros drifts as it warms up:

$$
b(t) = a\,e^{-t/\tau} + c.
$$

Typical sizes: $a \approx 2 \times 10^{-5}\,\mathrm{rad/s}$, $\tau \approx 1800\,\mathrm{s}$, $c \approx 3 \times 10^{-6}\,\mathrm{rad/s}$. Three unknowns spread across nine powers of ten. The columns of the Jacobian show it: their lengths are about $9.5$ for $a$, $7.4 \times 10^{-8}$ for $\tau$ and $27$ for $c$, and the condition number is about $9.5 \times 10^{8}$.

The cure is to solve for **scaled variables** $u_j$ of order 1, and convert inside the residual function:

$$
x_j = s_j\,u_j,
$$

where $s_j$ is a typical size for parameter $j$. With $s = (10^{-5}, 10^{3}, 10^{-6})$ and residuals divided by the noise $\sigma$, the column lengths become about 190, 148 and 54, and the condition number drops to about 11.

::: key
Why scale decision variables before optimizing? Solvers use one set of tolerances across all variables. If one parameter is 1e-6 and another is 1e6, the trust region and convergence tests are meaningless for one of them. Normalize to order 1, or supply x_scale.
:::

::: example Fitting gyro warm-up with and without scaling
Two hours of gyro data, one reading every $10\,\mathrm{s}$, with noise $\sigma = 5 \times 10^{-7}\,\mathrm{rad/s}$. The starting guess comes from the data: $c$ from the average of the last twelve minutes, $a$ from the first reading minus that, and $\tau$ as a third of the record.

**Step 1: unscaled.**

```python
import numpy as np
from scipy.optimize import minimize

rng = np.random.default_rng(1)
t = np.linspace(0.0, 7200.0, 721)                           # s
y = 2e-5 * np.exp(-t / 1800.0) + 3e-6 + rng.normal(0.0, 5e-7, t.size)

def r(x):
    a, tau, c = x
    return a * np.exp(-t / tau) + c - y                     # rad/s

c0 = y[-72:].mean()                                     # last 12 minutes
x0 = np.array([y[0] - c0, t[-1] / 3, c0])

res = minimize(lambda x: np.sum(r(x)**2), x0)
print(res.success, res.nit)                                 # True 2
print(f"{res.x[0]:.3e} {res.x[1]:.0f} {res.x[2]:.3e}")      # 1.972e-05 2400 1.628e-06
```

It reports success after 2 iterations. But $\tau$ never moved from its starting $2400\,\mathrm{s}$, and $c$ came out at about half its true value. The objective is around $10^{-10}$ and its slopes are around $10^{-7}$. `minimize` stops when the slope is below $10^{-5}$, so to it the ground already looked flat.

**Step 2: scaled.** Divide the residuals by $\sigma$ and solve for $u = x / s$:

```python
s = np.array([1e-5, 1e3, 1e-6])          # typical sizes of a, tau, c
sigma = 5e-7                             # rad/s

def r_scaled(u):
    return r(u * s) / sigma              # dimensionless, order 1

res = minimize(lambda u: np.sum(r_scaled(u)**2), x0 / s)
x = res.x * s
print(res.success, res.nit)                             # True 10
print(f"{x[0]:.3e} {x[1]:.0f} {x[2]:.3e}")              # 1.998e-05 1796 2.986e-06
print(round(res.fun))                                   # 695
```

(Run it after step 1.) Now $a \approx 2.00 \times 10^{-5}\,\mathrm{rad/s}$, $\tau \approx 1796\,\mathrm{s}$ and $c \approx 2.99 \times 10^{-6}\,\mathrm{rad/s}$, all close to the truth of $2 \times 10^{-5}$, $1800$ and $3 \times 10^{-6}$.

**Sanity check.** The sum of squared scaled residuals is 695, against 721 measurements. That is about what a good fit should give: the misses are the size of the noise, no bigger.
:::

`least_squares` has scaling built in through the `x_scale` argument. You can pass an array of typical sizes, `x_scale=[1e-5, 1e3, 1e-6]`, or `x_scale='jac'`, which lets SciPy pick scales from the Jacobian's column lengths as it goes. It is more forgiving than `minimize` because its trust region already works in terms of the Jacobian, but scaling by hand is still the habit to build. It costs two lines, and it also makes the finite-difference nudges, the printed values and the error bars easier to read.

The easiest scaling of all is choosing sensible units. Fit an orbit in kilometers and hours rather than meters and seconds. Fit a thrust curve in kilonewtons. Many scaling problems disappear before you write any code.

## When the data cannot tell parameters apart

Now the second cause, which no scaling can fix. Take the same gyro, but record only the first five minutes: 31 readings over $300\,\mathrm{s}$, when the warm-up time constant is $1800\,\mathrm{s}$.

::: example Five minutes of gyro data
Fit the scaled problem with `least_squares` on four different noise draws — the same gyro, the same truth, only the random noise differs:

```python
import numpy as np
from scipy.optimize import least_squares

s = np.array([1e-5, 1e3, 1e-6])
sigma = 5e-7
t = np.linspace(0.0, 300.0, 31)                 # only five minutes

for seed in (1, 2, 3, 4):
    rng = np.random.default_rng(seed)
    y = 2e-5 * np.exp(-t / 1800.0) + 3e-6 + rng.normal(0.0, sigma, t.size)

    def resid(u):
        a, tau, c = u * s
        return (a * np.exp(-t / tau) + c - y) / sigma

    sol = least_squares(resid, [2.0, 1.8, 3.0],
                        bounds=([-np.inf, 1e-3, -np.inf], np.inf))
    a, tau, c = sol.x * s
    print(seed, f"{a:.2e} {tau:7.0f} {c:.2e}  a+c={a + c:.2e}")
# 1 5.81e-06     365 1.75e-05  a+c=2.33e-05
# 2 8.78e-03  829509 -8.76e-03  a+c=2.30e-05
# 3 3.74e-05    3941 -1.46e-05  a+c=2.28e-05
# 4 5.13e-03  461741 -5.10e-03  a+c=2.30e-05
```

**Reading it.** The fitted $a$, $\tau$ and $c$ jump all over the place, even to a $\tau$ of nearly a million seconds and a negative $c$. Yet every fit matches its data well. Only one thing is stable: $a + c \approx 2.3 \times 10^{-5}\,\mathrm{rad/s}$, the bias at switch-on, which is all five minutes of data can really measure.

**Why.** Over a [[window much shorter|short-window]] than $\tau$, the exponential barely bends; it looks like a straight line. A straight line has only two numbers in it, a start and a slope, but the model has three knobs. Many combinations draw almost the same line, so the fingerprints of the columns nearly coincide. The **[[correlation|correlation-word]]** between the fitted parameters, computed from the covariance, comes out above $0.98$ in size for every pair.

**Sanity check.** The truth is $a + c = 2 \times 10^{-5} + 3 \times 10^{-6} = 2.3 \times 10^{-5}$. The stable combination matches it.
:::

When parameters are this entangled, the valley in the cost is a long, nearly flat trench. Where a solver stops along the trench depends on small things: the noise, the starting guess, the tolerances. Scaling cannot help, because the trouble is in the information, not the units. The real fixes are:

- **Get more informative data.** Record long enough to see the curve bend — several time constants here.
- **Reparameterize.** Fit the combinations the data can see (here, the switch-on bias $a + c$ and the initial slope), not the ones it cannot.
- **Fix or constrain a parameter.** If the lab has already measured $\tau$, hold it fixed and fit only $a$ and $c$.
- **Try several starts, or a global search,** when the cost has several separate valleys, as in the frequency fit of the last lesson.

## Check yourself

::: check
A residual function returns misses in meters for a GPS position, with noise $\sigma = 3\,\mathrm{m}$. A fit to 400 readings gives a raw sum of squares of $3{,}600\,\mathrm{m^2}$. Is this a good fit?
:::

::: answer
Scale first. Dividing each residual by $3\,\mathrm{m}$ divides each square by $9\,\mathrm{m^2}$, so the scaled sum of squares is $3600/9 = 400$. With 400 readings, a good fit should give a scaled sum close to 400, so yes: the misses are about the size of the noise.
:::

::: check
For the model $y = k\,t^2$ with one parameter $k$, write the Jacobian column for measurements at $t = 1$, $2$ and $3\,\mathrm{s}$.
:::

::: answer
The residual is $r_i = k t_i^2 - y_i$, so $\partial r_i/\partial k = t_i^2$. The column is $(1, 4, 9)$, in units of $\mathrm{s^2}$. It does not depend on $k$ at all, because the model is a straight line in $k$; for such a model one Gauss-Newton step lands exactly on the best fit.
:::

::: check
A Jacobian has condition number $10^{6}$. What is the condition number of $\mathbf{J}^\mathsf{T}\mathbf{J}$, and about how many digits of a double-precision number (about 16) might survive solving with it?
:::

::: answer
Forming $\mathbf{J}^\mathsf{T}\mathbf{J}$ squares the condition number: $(10^{6})^2 = 10^{12}$. You can lose about 12 of the roughly 16 digits, leaving about 4. That is why a solver that works with $\mathbf{J}$ directly (through a QR factorization, say) keeps more accuracy than one that forms $\mathbf{J}^\mathsf{T}\mathbf{J}$.
:::

::: check
You fit a thruster model with unknowns: thrust $F \approx 400\,\mathrm{N}$, a start-up delay $d \approx 0.02\,\mathrm{s}$ and a rise time $\tau \approx 0.005\,\mathrm{s}$. Suggest how to scale the problem.
:::

::: answer
Solve for $u = (F/400, d/0.02, \tau/0.005)$, all about 1, and convert back inside the residual function. Or pick friendlier units: thrust in hectonewtons and times in milliseconds give about $4$, $20$ and $5$, all within a factor of 20 of each other. Also divide the residuals by the measurement noise so the cost is of order the number of measurements. With `least_squares` you could instead pass `x_scale=[400, 0.02, 0.005]`.
:::

::: check
After a fit, the covariance says the correlation between two parameters is $-0.997$. Their individual error bars are huge, but the fit to the data looks excellent. What does this tell you, and what could you do?
:::

::: answer
The two parameters leave nearly the same fingerprint on the data, so the data only measures one combination of them. The good fit is real, but the individual values are not trustworthy. Options: collect data that separates them (a longer or more varied test), fit the well-determined combination instead of the two parameters, or fix one from an independent measurement.
:::

## Summary

| Idea | Meaning | Formula or tool |
|---|---|---|
| weighted residual | miss divided by noise, no units | $\tilde{r}_i = (\text{model}(t_i) - y_i)/\sigma_i$, and $\sum \tilde{r}_i^2 \approx m$ |
| Jacobian | sensitivities, one row per residual, one column per parameter | $J_{ij} = \partial r_i/\partial x_j$; `jac=`, `sol.jac` |
| finite differences | nudge and re-evaluate | `jac='2-point'` (default) or `'3-point'` |
| Gauss-Newton | straight-line step on the residuals | $\mathbf{J}^\mathsf{T}\mathbf{J}\,\Delta\mathbf{x} = -\mathbf{J}^\mathsf{T}\mathbf{r}$ |
| Levenberg-Marquardt | Gauss-Newton with a brake | $(\mathbf{J}^\mathsf{T}\mathbf{J} + \lambda\mathbf{I})\Delta\mathbf{x} = -\mathbf{J}^\mathsf{T}\mathbf{r}$ |
| condition number | touchiness of the problem | `np.linalg.cond(J)`; $\kappa(\mathbf{J}^\mathsf{T}\mathbf{J}) = \kappa(\mathbf{J})^2$ |
| scaling | solve for order-1 variables | $x_j = s_j u_j$, or `x_scale=` |
| degeneracy | columns with the same fingerprint | high correlation; fix with data or reparameterizing |

The table $\mathbf{J}^\mathsf{T}\mathbf{J}$ and the way it is factored are linear algebra. The next lesson, on `scipy.linalg`, meets the factorizations that solvers use for it — Cholesky and QR — and goes on to the matrix exponential and the Riccati equations behind optimal control.

::: context partial-derivative One knob at a time
An ordinary derivative asks how a function changes when its one input changes. With several inputs you turn one knob and hold the rest still; the rate you get is a partial derivative. The curly symbol $\partial$ was chosen to remind you of that difference. For $r = p_0 e^{-t/\tau} - y$, treating $\tau$ as a fixed number makes $\partial r/\partial p_0$ equal to the factor multiplying $p_0$, namely $e^{-t/\tau}$.
:::

::: context column-fingerprint Columns as fingerprints
Each column of the Jacobian is a curve over time: how the whole data record would shift if you nudged one parameter. For the leaking tank, the $p_0$ column starts at 1 and fades, while the $\tau$ column starts at zero, rises, and fades later. Because the two shapes are different, the data can tell the parameters apart. When two columns have nearly the same shape, any change in one parameter can be canceled by a change in the other, and the fit cannot separate them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="200" height="130" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="120" y1="20" x2="120" y2="150" stroke="#1f2a44" stroke-width="1"/>
  <line x1="20" y1="46" x2="220" y2="46" stroke="#8fb8f0" stroke-width="1"/>
  <line x1="20" y1="72" x2="220" y2="72" stroke="#8fb8f0" stroke-width="1"/>
  <line x1="20" y1="98" x2="220" y2="98" stroke="#8fb8f0" stroke-width="1"/>
  <line x1="20" y1="124" x2="220" y2="124" stroke="#8fb8f0" stroke-width="1"/>
  <text x="70" y="14" font-size="12" text-anchor="middle" fill="#1d6fd1">column for p₀</text>
  <text x="170" y="14" font-size="12" text-anchor="middle" fill="#b4232c">column for τ</text>
  <text x="230" y="37" font-size="11" fill="#1f2a44">measurement 1</text>
  <text x="230" y="63" font-size="11" fill="#1f2a44">measurement 2</text>
  <text x="230" y="89" font-size="11" fill="#1f2a44">measurement 3</text>
  <text x="230" y="115" font-size="11" fill="#1f2a44">…</text>
  <text x="230" y="141" font-size="11" fill="#1f2a44">measurement m</text>
  <text x="70" y="88" font-size="13" text-anchor="middle" fill="#1f2a44">∂r/∂p₀</text>
  <text x="170" y="88" font-size="13" text-anchor="middle" fill="#1f2a44">∂r/∂τ</text>
</svg>
```
:::

::: context trust-region A leash on every step
A trust region is a radius around the current guess inside which the solver believes its straight-line model of the residuals. It takes the best step inside that circle. If the step works as predicted, the circle grows; if it does badly, the circle shrinks. The circle has one radius in every direction, which is why a problem with one parameter near $10^{-6}$ and another near $10^{3}$ confuses it: a radius that is sensible for one is absurd for the other. SciPy's `'trf'` stands for "trust region reflective"; the "reflective" part handles bounds by bouncing steps off them.
:::

::: context condition-picture Stretched and round valleys
Draw the cost as contour lines, like a hiking map. A well-scaled problem has round contours: downhill points at the bottom. A badly scaled one has long thin ellipses: downhill points mostly across the canyon, so the solver zig-zags from wall to wall and crawls along the floor.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <ellipse cx="95" cy="100" rx="75" ry="12" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <ellipse cx="95" cy="100" rx="50" ry="8" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <ellipse cx="95" cy="100" rx="25" ry="4" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="95" cy="100" r="3" fill="#1f2a44"/>
  <circle cx="55" cy="93.6" r="3.5" fill="#b4232c"/>
  <line x1="55" y1="93.6" x2="58" y2="112" stroke="#b4232c" stroke-width="2"/>
  <text x="95" y="150" font-size="12" text-anchor="middle" fill="#1f2a44">badly scaled</text>
  <text x="95" y="166" font-size="11" text-anchor="middle" fill="#6c7a93">downhill points across</text>
  <circle cx="270" cy="100" r="45" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="270" cy="100" r="30" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="270" cy="100" r="15" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="270" cy="100" r="3" fill="#1f2a44"/>
  <circle cx="240" cy="84" r="3.5" fill="#b4232c"/>
  <line x1="240" y1="84" x2="257.6" y2="93.4" stroke="#b4232c" stroke-width="2"/>
  <text x="270" y="166" font-size="12" text-anchor="middle" fill="#1f2a44">scaled to order 1</text>
  <text x="270" y="182" font-size="11" text-anchor="middle" fill="#6c7a93">downhill points at the bottom</text>
</svg>
```
:::

::: context gyro-bias Why a gyro's zero drifts
A rate gyro should read zero when nothing is turning, but real ones read a small offset called bias. In many sensors it changes as the electronics and sensing element warm up after switch-on, settling over minutes to hours. An uncorrected bias of $10^{-5}\,\mathrm{rad/s}$, integrated for an hour, is an attitude error of $0.036\,\mathrm{rad}$, about two degrees. That is why navigation filters estimate bias continuously, and why ground tests fit warm-up curves like this one.
:::

::: context short-window Two different curves, one short window
Here are the true gyro bias and one of the wrong fits from the five-minute example, drawn over a full hour. Inside the shaded first five minutes they are nearly on top of each other. After that they split completely. The data only ever saw the shaded part.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="25" width="25" height="145" fill="#f2b880" opacity="0.5"/>
  <line x1="40" y1="170" x2="345" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="170" x2="40" y2="25" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,35.8 52.5,45.2 65.0,53.7 77.5,61.6 90.0,68.9 102.5,75.6 115.0,81.7 127.5,87.4 140.0,92.6 152.5,97.4 165.0,101.8 177.5,105.9 190.0,109.6 202.5,113.0 215.0,116.2 227.5,119.1 240.0,121.7 252.5,124.2 265.0,126.5 277.5,128.5 290.0,130.5 302.5,132.2 315.0,133.8 327.5,135.3 340.0,136.7"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 4" points="40.0,34.0 52.5,45.4 65.0,53.0 77.5,58.0 90.0,61.4 102.5,63.6 115.0,65.0 127.5,66.0 140.0,66.7 152.5,67.1 165.0,67.4 177.5,67.5 190.0,67.7 202.5,67.8 215.0,67.8 227.5,67.8 240.0,67.9 252.5,67.9 265.0,67.9 277.5,67.9 290.0,67.9 302.5,67.9 315.0,67.9 327.5,67.9 340.0,67.9"/>
  <text x="52" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">5 min</text>
  <text x="340" y="186" font-size="11" text-anchor="end" fill="#1f2a44">60 min</text>
  <text x="200" y="58" font-size="12" fill="#b4232c">wrong fit</text>
  <text x="200" y="104" font-size="12" fill="#1d6fd1">truth</text>
</svg>
```
:::

::: context correlation-word Correlation in one number
The correlation between two fitted parameters is their covariance divided by the product of their standard deviations. It always lies between $-1$ and $+1$. Near zero, the parameters are estimated independently. Near $\pm 1$, an error in one is almost always matched by an error in the other, so only a combination of them is well measured. Orbit determination teams watch these numbers closely: for example, a satellite's drag coefficient and its area-to-mass ratio only ever appear multiplied together in the drag force, so a fit can never separate them, and they are estimated as a single combined parameter instead.
:::
