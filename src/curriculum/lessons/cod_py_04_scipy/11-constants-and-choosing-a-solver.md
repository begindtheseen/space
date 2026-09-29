---
id: l11-constants-and-choosing-a-solver
title: Units you can trust, and picking the right solver
minutes: 24
covers:
  - scipy.constants and dimensional sanity
  - Choosing a solver from the structure of the problem
---

Imagine baking from a cookbook written in another country. It says "2 cups of flour", and your kitchen scale reads grams. If you guess wrong about what a cup means, the cookies come out as bricks or soup. Nothing in the recipe was wrong. The numbers were fine. The *units* were the problem.

Engineering code has exactly this trap, and it has cost real spacecraft. In 1999 NASA lost the [[Mars Climate Orbiter|mars-climate-orbiter]] because one team's software reported thruster pushes in pound-force seconds while another team's software read them as newton-seconds. Every number looked reasonable. None of them meant what the reader thought.

This lesson has two halves, and both are about the same habit: look at the *structure* of a problem before you trust a number. The first half is `scipy.constants`, SciPy's collection of physical constants and unit conversion factors, and the checks that keep units honest. The second half pulls together everything in this module into one skill: given a new problem, reading its shape and picking the SciPy tool that fits.

## `scipy.constants`: one trusted source for numbers

Every program needs a few fixed numbers: standard gravity, the speed of light, how many meters are in a foot. You could type them in by hand each time. Then one file says 9.81, another says 9.8066, a third says 32.2 (feet per second squared), and a mismatch sneaks in.

The fix is to take them from one trusted place. `scipy.constants` holds two kinds of thing:

- **Physical constants**, such as standard gravity `g`, the gravitational constant `G` and the speed of light `c`.
- **Unit conversion factors**, such as `foot`, `pound_force`, `psi`, `nautical_mile` and `degree`. Each one is the size of that unit expressed in **[[SI units|si-units]]** — the metric system of meters, kilograms and seconds.

```python
from scipy import constants

print(constants.g)                    # standard gravity, m/s^2
print(constants.G)                    # gravitational constant, m^3/(kg s^2)
print(constants.c)                    # speed of light, m/s
print(round(constants.pound_force, 4))  # newtons in one pound-force
print(round(constants.foot, 4))       # meters in one foot
print(constants.nautical_mile)        # meters in one nautical mile
print(round(constants.psi, 1))        # pascals in one psi
print(constants.atm)                  # pascals in one standard atmosphere
print(round(constants.degree, 6))     # radians in one degree
# 9.80665
# 6.6743e-11
# 299792458.0
# 4.4482
# 0.3048
# 1852.0
# 6894.8
# 101325.0
# 0.017453
```

Because every factor is "how many SI units in one of these", the conversion rule is short enough to memorize.

::: key
Every unit in `scipy.constants` is stored as its size in SI units. **Multiply** by the factor to go into SI (`thrust_N = thrust_lbf * constants.pound_force`). **Divide** by it to come back out (`alt_ft = alt_m / constants.foot`).
:::

::: example Converting a spec sheet into SI
A supplier's spec sheet lists an engine at 190,000 lbf (pounds-force) of thrust and a chamber pressure of 1,410 psi (pounds per square inch). Your simulation works in newtons and pascals. Separately, a flight plan in meters needs an altitude of 12,192 m reported in feet.

Step 1. Thrust into SI: multiply. $190{,}000 \times 4.4482 \approx 845{,}200$ N, or about 845.2 kN. (That is the same engine as in the Monte Carlo lesson.)

Step 2. Pressure into SI: multiply. $1{,}410 \times 6{,}894.8 \approx 9{,}720{,}000$ Pa, or about 9.72 MPa (megapascals, millions of pascals). That is roughly 96 atmospheres, a normal range for a rocket combustion chamber.

Step 3. Altitude out of SI: divide. $12{,}192 / 0.3048 = 40{,}000$ ft, a typical airliner cruising height.

```python
from scipy import constants

thrust_lbf = 190_000.0
thrust_N = thrust_lbf * constants.pound_force      # into SI: multiply
print(round(thrust_N / 1000, 1))                   # kN

pc_psi = 1410.0
pc_Pa = pc_psi * constants.psi
print(round(pc_Pa / 1e6, 2))                       # MPa

alt_m = 12_192.0
print(round(alt_m / constants.foot))               # out of SI: divide
# 845.2
# 9.72
# 40000
```

Sanity check: a newton is smaller than a pound-force, so the number of newtons must be bigger than the number of pounds-force. It is, by a factor of about 4.45.
:::

For measured constants, SciPy also keeps a dictionary called `physical_constants`. Each entry holds three things: the value, its unit written out as text, and its uncertainty — how far the true value might plausibly be from the stored one. The values come from the international **[[CODATA|codata]]** tables.

```python
from scipy import constants

value, unit, uncertainty = constants.physical_constants["Newtonian constant of gravitation"]
print(value, unit, uncertainty)
print(round(uncertainty / value, 7))               # relative uncertainty
# 6.6743e-11 m^3 kg^-1 s^-2 1.5e-15
# 2.25e-05
```

Notice what is *not* in `scipy.constants`: Earth's gravitational parameter $\mu$, Earth's radius, or anything else about a particular planet. Those are defined by geodesy and mission standards, not by physics tables. Define them yourself, once, with a clear name and unit, in one module that every script imports. And do not build $\mu$ by multiplying `constants.G` by Earth's mass: that [[throws away accuracy|gm-not-g-times-m]].

## Dimensional sanity

**Dimensional analysis** means checking that the units on both sides of an equation agree. It is the cheapest test in engineering, and it catches a large share of real bugs.

Three rules do most of the work.

1. **You can only add or compare things with the same units.** Meters plus seconds is nonsense. So is meters plus kilometers, unless you convert first.
2. **Both sides of an equation must end up with the same units.** If the left side is a speed, the right side must reduce to meters per second.
3. **What goes inside `sin`, `cos`, `exp` and `log` must have [[no units at all|dimensionless-arguments]].** An angle in radians counts as unitless. A ratio of two masses is unitless. An angle in degrees is not what `np.sin` expects.

Python will not enforce any of this. A float carries no unit. So two habits do the enforcing for you.

The first is to **put the unit in the name**: `thrust_N`, `alt_km`, `mu_m3_s2`. Then a line like `alt_km + radius_m` looks wrong on the page, before anyone runs it.

The second is to **check the answer against a number you know**. You know that a low Earth orbit speed is about 7.7 km/s and standard gravity is about 9.8 m/s². An `assert` that the result lands in a sensible range turns that knowledge into an automatic test.

::: example A kilometer that should have been a meter
The speed of a circular orbit at distance $r$ from Earth's center is

$$
v = \sqrt{\frac{\mu}{r}},
$$

where $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ (read "mu") is Earth's gravitational parameter. Find $v$ at 400 km altitude.

```python
import numpy as np

MU_EARTH_M3_S2 = 3.986004418e14    # Earth's GM, m^3/s^2
R_EARTH_M = 6_378_137.0            # Earth's equatorial radius, m

alt_km = 400.0
r_wrong = 6378.137 + alt_km                    # km, mixed with mu in m^3/s^2
v_wrong = np.sqrt(MU_EARTH_M3_S2 / r_wrong)
print(round(v_wrong / 1000, 1))                # km/s ?!

r_m = R_EARTH_M + alt_km * 1000.0              # everything in meters
v_m_s = np.sqrt(MU_EARTH_M3_S2 / r_m)
print(round(v_m_s / 1000, 2))                  # km/s
assert 7000.0 < v_m_s < 8000.0, "LEO circular speed should be about 7.7 km/s"
# 242.5
# 7.67
```

Step 1. The first attempt used $r$ in kilometers but $\mu$ in meters cubed per second squared. The units inside the square root are $\mathrm{m^3/(s^2\,km)}$, which is not a speed squared. The answer, 242.5 km/s, is faster than anything in the solar system near Earth.

Step 2. How far off is it? $r$ was 1,000 times too small, so $v$ is $\sqrt{1000} \approx 31.6$ times too big. Check: $7.67 \times 31.62 \approx 242.5$. The bug has a fingerprint.

Step 3. The second attempt puts everything in meters: $r = 6{,}378{,}137 + 400{,}000 = 6{,}778{,}137$ m. Then $v = \sqrt{3.986 \times 10^{14} / 6.778 \times 10^6} \approx 7{,}670$ m/s, or 7.67 km/s. That matches the 7.7 km/s we expected, and the `assert` passes.
:::

::: warning Two slips that pass every syntax check
**Forgetting $g_0$ in the rocket equation.** The ideal speed change is $\Delta v = I_{sp}\, g_0 \ln(m_0/m_f)$, where $I_{sp}$ is the specific impulse in [[seconds|isp-in-seconds]], $g_0$ is standard gravity, and $m_0$ and $m_f$ are the start and end masses. Leave out $g_0$ and the answer has units of seconds, not meters per second, and it is about 9.8 times too small:

```python
import numpy as np
from scipy import constants

isp_s = 311.0                          # specific impulse, s
m0_kg, mf_kg = 549_000.0, 150_000.0    # start and end mass, kg (illustrative)

dv_wrong = isp_s * np.log(m0_kg / mf_kg)                  # units: s  (not a speed!)
dv_m_s = isp_s * constants.g * np.log(m0_kg / mf_kg)      # units: s * m/s^2 = m/s
print(round(dv_wrong, 1), round(dv_m_s, 1))
# 403.5 3957.1
```

**Degrees into `np.sin`.** NumPy's trig functions expect radians. `np.sin(30.0)` is the sine of 30 *radians*, not 30 degrees. Convert with `np.deg2rad`, or multiply by `constants.degree`:

```python
import numpy as np
from scipy import constants

print(round(np.sin(30.0), 3), round(np.sin(np.deg2rad(30.0)), 3))
print(round(np.sin(30.0 * constants.degree), 3))
# -0.988 0.5
# 0.5
```

The sine of 30° is one half. $-0.988$ is a perfectly valid number, which is exactly why nothing warns you.
:::

## Choosing a solver: read the problem's shape first

Now step back and look at the whole module. You have met a lot of tools: root finders, optimizers, curve fitters, matrix factorizations, filters, interpolators, rotations and distributions. On a real job nobody tells you which one to use. You are handed a problem, and the choice is yours.

Think of a toolbox. A screwdriver, a wrench and a hammer can all move a screw in some sense, but only one does it well. You pick by looking at the head of the screw. With solvers, you pick by looking at the **[[structure|solver-map]]** of the problem: the facts about its shape that you can see before solving it.

Ask these questions, roughly in this order.

**1. Is it linear in the unknowns?** If the problem is $\mathbf{A}\mathbf{x} = \mathbf{b}$, no iteration is needed. Use `scipy.linalg`. If $\mathbf{A}$ is symmetric and **[[positive definite|positive-definite]]**, factor it with Cholesky (`cho_factor` and `cho_solve`, or `solve(A, b, assume_a="pos")`), which is about twice as fast as a general solve and more stable. If there are more equations than unknowns, it is a linear least-squares problem, solved through QR (`scipy.linalg.lstsq`). If the problem is an optimal feedback gain, it is a Riccati equation: `solve_continuous_are` or `solve_discrete_are`, then form the gain from $\mathbf{P}$. In every case, never form `inv(A)` to solve a system.

**2. Do you need to make something zero, or make something small?** This one question splits the rest of `scipy.optimize` in two.

- *Make it zero* is **root finding**. With one unknown and a bracket where the function changes sign, use `brentq`: it cannot fail to converge. With one unknown, a derivative and a good starting guess, `newton` takes fewer steps. With several unknowns, use `root` (or the older `fsolve`), because a bracket no longer exists in more than one dimension.
- *Make it small* is **optimization**. Go on to question 3.

**3. Is the cost a sum of squared residuals?** Fitting a model to data almost always is. Then use `least_squares`, or `curve_fit` when the model has the form $y = f(x, \text{parameters})$. These tools know the cost's structure and use the Jacobian of the residuals to converge much faster than a general optimizer.

**4. Is the cost smooth with one valley, or bumpy with many?** For a smooth cost, `minimize` is the tool. By default it picks BFGS with no limits, L-BFGS-B if you give bounds, and SLSQP if you give constraints. If the cost has many local valleys, or is noisy because it comes from a simulation, a local method will get stuck in whichever valley it starts in. Then use `differential_evolution`, a global search inside bounds, which by default finishes with a local polish.

**5. Is it a table, a signal, a rotation or a spread?** These are not solves at all, but the same "read the shape" habit picks the tool. A 1-D table: `interp1d` or `CubicSpline`. A table on a grid in several variables: `RegularGridInterpolator`. A signal to clean up after the flight: `filtfilt`. A filter inside a running control loop: `lfilter`, because it only uses the past. A spectrum: `welch`. An attitude: `Rotation`, minding the scalar-last order. A spread of outcomes: `scipy.stats` and percentiles.

And across all of them: **scale your unknowns to order 1** (or pass `x_scale`), because every solver judges "small enough" with one set of tolerances.

::: key
Pick the solver from the problem's structure. Linear → `scipy.linalg` (Cholesky if symmetric positive definite, never `inv`). Make it zero → `brentq` with a bracket, `newton` with a derivative and good guess, `root`/`fsolve` in several dimensions. Make it small → `least_squares`/`curve_fit` for sums of squares, `minimize` for a smooth single valley, `differential_evolution` for many valleys.
:::

Here is the first question in action. A symmetric, positive-definite system solved two equivalent ways, both of which use its structure:

```python
import numpy as np
from scipy.linalg import cho_factor, cho_solve, solve

A = np.array([[4.0, 1.0, 0.5],
              [1.0, 3.0, 0.2],
              [0.5, 0.2, 2.0]])            # symmetric, positive definite
b = np.array([1.0, 2.0, 3.0])

x1 = cho_solve(cho_factor(A), b)           # uses the structure
x2 = solve(A, b, assume_a="pos")           # same idea, one call
print(np.round(x1, 4))
print(np.allclose(x1, x2), np.allclose(A @ x1, b))
# [-0.0817  0.5965  1.4608]
# True True
```

The last line checks the answer by putting it back into the equation. `np.allclose(A @ x1, b)` is `True`: the residual is tiny. Always check an answer this way when you can.

::: example Kepler's equation, two ways
Back in the root-finding lesson you solved Kepler's equation $E - e \sin E = M$ for the eccentric anomaly $E$. Take $M = 1.0$ rad and $e = 0.5$. Which tool, and what does each cost?

Step 1. Read the structure. One unknown, $E$. We want to *make something zero*: $f(E) = E - e\sin E - M$. At $E = 0$, $f = -1$; at $E = 2\pi$, $f = 2\pi - 1 > 0$. So there is a sign change: a bracket. And the derivative $f'(E) = 1 - e\cos E$ is easy to write. Both `brentq` and `newton` fit.

```python
import numpy as np
from scipy.optimize import brentq, newton

M, e = 1.0, 0.5
f = lambda E: E - e * np.sin(E) - M
fp = lambda E: 1.0 - e * np.cos(E)

E_b, rb = brentq(f, 0.0, 2 * np.pi, xtol=1e-15, full_output=True)
E_n, rn = newton(f, x0=M, fprime=fp, tol=1e-15, full_output=True)

print(round(E_b, 12), rb.iterations)
print(round(E_n, 12), rn.iterations)
print(abs(f(E_b)) < 1e-14, abs(f(E_n)) < 1e-14)
# 1.498701133518 9
# 1.498701133518 5
# True True
```

Step 2. Both land on $E = 1.498701133518$ rad. The option `full_output=True` makes each also return a report, and its `iterations` field counts the steps: 9 for `brentq`, 5 for `newton`.

Step 3. So `newton` is faster here, because it had a derivative and a good starting guess ($E \approx M$). But `brentq` is *guaranteed* to converge for every $M$ and every $e < 1$, while Newton's method can wander for high eccentricity and a bad guess. For code that must never fail, the guarantee is worth four extra steps.

Step 4. Sanity check: with $e = 0.5$, $E$ should be a bit bigger than $M$ (since $E = M + e\sin E$ and $\sin E > 0$ here). $1.4987 > 1.0$. Yes.
:::

::: warning Do not turn a root into a minimum
A tempting shortcut for "find where $f(x) = 0$" is "minimize $f(x)^2$". It works, sort of — and it [[throws away half your digits|squaring-loses-digits]]. Here is the cube root of 2 found both ways:

```python
import numpy as np
from scipy.optimize import brentq, minimize

f = lambda x: x**3 - 2.0                  # root is the cube root of 2
true = 2.0 ** (1.0 / 3.0)

x_root = brentq(f, 1.0, 2.0, xtol=1e-15)
x_min = minimize(lambda x: f(x[0])**2, x0=[1.0]).x[0]

print(f"{abs(x_root - true):.1e}")
print(f"{abs(x_min - true):.1e}")
# 0.0e+00
# 7.6e-09
```

`brentq` hits the answer to the last bit. `minimize` stops about $10^{-8}$ away, because near the bottom the squared function is so flat that it cannot tell nearby points apart. If the problem is "make it zero", use a root finder.
:::

::: example Four problems, four tools
Here are four jobs from one week on a GNC team. Read each structure and name the tool.

Step 1. *Fit a gyro bias model $b(t) = a\,e^{-t/\tau} + c$ to 600 samples.* Three unknowns $(a, \tau, c)$, 600 residuals, cost = sum of squared residuals. That is `least_squares` (or `curve_fit`). Put $\tau$ on a sensible scale, since it is measured in seconds while $a$ and $c$ are tiny rates.

Step 2. *Solve a 6-by-6 system $\mathbf{P}\mathbf{x} = \mathbf{b}$ where $\mathbf{P}$ is a covariance matrix.* Linear, and a covariance matrix is symmetric and positive definite. That is Cholesky: `cho_factor` and `cho_solve`.

Step 3. *Tune 4 controller gains to minimize the P99 landing miss from a 500-run Monte Carlo.* The cost comes from random simulations, so it is noisy and bumpy, with many valleys. That is `differential_evolution` inside bounds on each gain, with a fixed seed so the cost is repeatable.

Step 4. *Find the time a simulated trajectory crosses 10 km altitude.* One unknown (time), make-it-zero (altitude minus 10,000 m), and the altitude is below 10 km at one sample and above at the next, so there is a bracket. Put a `CubicSpline` through the samples, then call `brentq` on the spline between those two times.

Sanity check: none of the four needed `minimize` with default settings. That is common. The general-purpose tool is the right choice less often than people think.
:::

## Check yourself

::: check
A test report gives a tank pressure of 350 psi. Write the one line that converts it to pascals with `scipy.constants`, and estimate the answer in megapascals.
:::

::: answer
Going into SI means multiply: `p_Pa = 350.0 * constants.psi`. One psi is about 6,895 Pa, so the result is about $350 \times 6{,}895 \approx 2{,}413{,}000$ Pa, or about 2.41 MPa. Sanity check: that is about 24 atmospheres, a plausible pressure for a rocket propellant tank.
:::

::: check
A colleague computes `v = np.sqrt(mu / r)` with `mu = 3.986e14` and gets 7.67 on one run and 242.5 on another. Without reading the code, what is the most likely bug in the second run, and how do you know?
:::

::: answer
The ratio is $242.5 / 7.67 \approx 31.6 = \sqrt{1000}$. A factor of $\sqrt{1000}$ in $v$ means $r$ was 1,000 times too small inside the square root: $r$ was in kilometers while $\mu$ was in $\mathrm{m^3/s^2}$. The fix is to convert $r$ to meters, and the prevention is naming it `r_m` and asserting the speed is near 7.7 km/s.
:::

::: check
Why does `np.sin(90)` not return 1, and what are two correct ways to get the sine of 90 degrees?
:::

::: answer
`np.sin` treats its argument as radians, and 90 radians is about 14.3 full turns plus a bit, whose sine is about 0.894. Two correct ways: `np.sin(np.deg2rad(90))` or `np.sin(90 * constants.degree)`. Both give 1.0 (up to rounding in the last digit).
:::

::: check
You need the angle of attack at which a lift model $C_L(\alpha)$ equals the value required for level flight. The model is smooth, you know $C_L$ is below the target at $\alpha = 0$ and above it at $\alpha = 10°$, and you have no formula for its derivative. Which SciPy tool, and why?
:::

::: answer
The job is to *make zero* the function $C_L(\alpha) - C_{L,\text{required}}$, in one unknown. There is a sign change between $0°$ and $10°$ (converted to radians, if the model expects them), so there is a bracket, and there is no derivative. That is `brentq`: guaranteed to converge inside the bracket and needs no derivative. `newton` would need a derivative or would fall back on a less reliable secant method, and `minimize` solves the wrong problem.
:::

::: check
An optimizer is asked to find a thrust level (around $8 \times 10^5$ N) and a burn start time (around 30 s) together. It stops early, reporting success, with the time barely moved from its starting guess. What is the likely cause, and what is the fix?
:::

::: answer
The two unknowns differ in size by a factor of more than $10^4$. The solver uses one set of tolerances and step sizes for both, so a change that is large for the time looks negligible next to the thrust, and it declares convergence. The fix is to scale both to order 1, for example solve for thrust in units of $10^5$ N and time in units of 10 s, or pass `x_scale` to `least_squares`.
:::

## Summary

| Idea | Rule or tool | Example |
|---|---|---|
| Constants | `scipy.constants.g`, `.G`, `.c`; `physical_constants[name]` gives value, unit, uncertainty | `constants.g` is 9.80665 m/s² |
| Unit factors | Size of the unit in SI: multiply to go in, divide to come out | `thrust_N = thrust_lbf * constants.pound_force` |
| Not included | Planet data such as Earth's $\mu$ | Define `MU_EARTH_M3_S2 = 3.986004418e14` once |
| Dimensional sanity | Same units to add; `sin`/`exp`/`log` take unitless inputs | Radians into `np.sin`; $g_0$ in the rocket equation |
| Range check | `assert` against a known size | LEO speed about 7.7 km/s |
| Linear | `scipy.linalg`: `cho_solve`, `lstsq`, `solve_*_are`; never `inv` | Covariance system → Cholesky |
| Make it zero | `brentq` (bracket), `newton` (derivative, good guess), `root`/`fsolve` (several unknowns) | Kepler's equation |
| Make it small | `least_squares`/`curve_fit` (sum of squares), `minimize` (smooth), `differential_evolution` (many valleys) | Gyro bias fit |
| Scaling | Unknowns of order 1, or `x_scale` | Thrust in $10^5$ N |

That completes the SciPy module. The next module, Matplotlib and Flight-Data Handling, is where these results get [[turned into plots|next-module-plots]] and where real flight logs are loaded, cleaned and checked before any of these solvers see them.

::: context mars-climate-orbiter A unit mix-up that cost a spacecraft
Mars Climate Orbiter reached Mars in September 1999. Ground software supplied the size of small thruster firings in pound-force seconds, while the navigation software that used them expected newton-seconds. Every firing was undercounted by a factor of about 4.45, and the error built up over the nine-month cruise. The spacecraft arrived at roughly 57 km altitude instead of safely above 80 km, and was lost in the atmosphere.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="90" y="18" width="40" height="22" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="90" y="52" width="178" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="82" y="33" font-size="12" text-anchor="end" fill="#1f2a44">1 N·s</text>
  <text x="82" y="67" font-size="12" text-anchor="end" fill="#1f2a44">1 lbf·s</text>
  <text x="276" y="67" font-size="12" fill="#b4232c">× 4.45</text>
  <text x="180" y="98" font-size="11" text-anchor="middle" fill="#6c7a93">Read as N·s, every lbf·s counted 4.45 times too small</text>
</svg>
```
:::

::: context si-units The system everyone agreed on
SI stands for the French *Système international d'unités*. It is built on seven base units: the meter, kilogram, second, ampere, kelvin, mole and candela. Every other unit is made from those: a newton is a kilogram-meter per second squared, a pascal is a newton per square meter. Doing all internal calculation in SI and converting only at the edges — reading a spec sheet, printing a report — is the standard way to keep flight software consistent.
:::

::: context codata Who decides the value of G
CODATA, the Committee on Data of the International Science Council, publishes a recommended set of physical constants every few years, and SciPy ships those tables. Since 2019, several constants, including the speed of light, the Planck constant and the elementary charge, are exact by definition, because the SI units themselves are defined from them. Standard gravity, 9.80665 m/s², is also exact, by an agreement from 1901. The gravitational constant $G$ is still measured, and is one of the least precisely known constants, with a relative uncertainty of about $2 \times 10^{-5}$.
:::

::: context gm-not-g-times-m Why μ is known better than G
We can track satellites so precisely that Earth's product $GM$ is known to about 2 parts in a billion: $\mu = 3.986004418 \times 10^{14}\,\mathrm{m^3/s^2}$. But $G$ on its own is only known to about 2 parts in 100,000, and Earth's mass is only ever worked out by dividing $\mu$ by $G$. Multiplying `constants.G` by a textbook Earth mass therefore gives back a $\mu$ with $G$'s large uncertainty, about ten thousand times worse than the value you could have used directly. Orbit work always uses $\mu$ itself.
:::

::: context dimensionless-arguments Why sin and exp refuse units
Functions like $e^x$ can be written as an endless sum: $e^x = 1 + x + x^2/2 + x^3/6 + \dots$ If $x$ were 3 meters, that sum would add a plain number to meters, to square meters, to cubic meters. That cannot mean anything. So the input must be a pure number. That is also why the rocket equation takes the *ratio* $m_0/m_f$ inside the logarithm: kilograms divided by kilograms leaves no unit.
:::

::: context isp-in-seconds Why efficiency is measured in seconds
Specific impulse is thrust divided by the weight of propellant burned per second, where weight means mass times standard gravity $g_0$. Newtons divided by newtons per second leaves seconds. The neat result is that the number is the same in any unit system: an engine with 311 s of specific impulse has 311 s in metric or US units. Multiplying by $g_0$ turns it back into the exhaust speed in m/s, which is what the rocket equation needs.
:::

::: context solver-map The first three questions as a map
Most solver choices are settled by three yes-or-no questions, asked top to bottom. The leaves are the tools this module taught.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="130" y1="20" x2="95" y2="20"/>
    <line x1="180" y1="32" x2="180" y2="62"/>
    <line x1="150" y1="86" x2="90" y2="122"/>
    <line x1="210" y1="86" x2="270" y2="122"/>
    <line x1="70" y1="146" x2="48" y2="184"/>
    <line x1="110" y1="146" x2="135" y2="184"/>
    <line x1="250" y1="146" x2="225" y2="184"/>
    <line x1="290" y1="146" x2="315" y2="184"/>
  </g>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="130" y="8" width="100" height="24" rx="4"/>
    <rect x="125" y="62" width="110" height="24" rx="4"/>
    <rect x="40" y="122" width="100" height="24" rx="4"/>
    <rect x="215" y="122" width="110" height="24" rx="4"/>
  </g>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5">
    <rect x="5" y="8" width="90" height="24" rx="4"/>
    <rect x="3" y="184" width="90" height="24" rx="4"/>
    <rect x="98" y="184" width="74" height="24" rx="4"/>
    <rect x="183" y="184" width="84" height="24" rx="4"/>
    <rect x="275" y="184" width="80" height="24" rx="4"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="180" y="24">Linear in x?</text>
    <text x="50" y="24">scipy.linalg</text>
    <text x="180" y="78">Zero or small?</text>
    <text x="90" y="138">One unknown?</text>
    <text x="270" y="138">Sum of squares?</text>
    <text x="48" y="200">brentq, newton</text>
    <text x="135" y="200">root, fsolve</text>
    <text x="225" y="200">least_squares</text>
    <text x="315" y="200">minimize, DE</text>
  </g>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="112" y="15">yes</text>
    <text x="194" y="52">no</text>
    <text x="105" y="100">zero</text>
    <text x="258" y="100">small</text>
    <text x="44" y="168">yes</text>
    <text x="134" y="168">no</text>
    <text x="226" y="168">yes</text>
    <text x="314" y="168">no</text>
  </g>
</svg>
```

"DE" is `differential_evolution`, for costs with many valleys; `minimize` is for a smooth single valley.
:::

::: context positive-definite What positive definite means
A symmetric matrix $\mathbf{A}$ is positive definite when $\mathbf{x}^T\mathbf{A}\mathbf{x} > 0$ for every nonzero vector $\mathbf{x}$. Picture a bowl: however you move away from the center, you go up. Covariance matrices, mass and inertia matrices, and the cost weights in LQR are all like this. Cholesky factorization only works for such matrices, which makes it a free test too: if `cho_factor` fails, your "covariance" matrix has gone bad.
:::

::: context squaring-loses-digits Why a squared function is too flat to pin down
Near a root, $f(x)$ crosses zero at an angle, so a small step in $x$ makes a clear change in $f$. The square $f(x)^2$ touches zero with a flat bottom. A step of $10^{-8}$ in $x$ changes $f^2$ by only about $10^{-16}$, which is the limit of double precision. So the minimizer cannot tell points within about $10^{-8}$ apart — half of the 16 digits a float carries.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="112" width="300" height="16" fill="#e6ebf2"/>
  <line x1="30" y1="120" x2="330" y2="120" stroke="#6c7a93" stroke-width="1"/>
  <text x="24" y="124" font-size="11" text-anchor="end" fill="#6c7a93">0</text>
  <line x1="40" y1="190" x2="320" y2="50" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M40,41.6 L50,52.4 L60,62.4 L70,71.6 L80,80.0 L90,87.6 L100,94.4 L110,100.4 L120,105.6 L130,110.0 L140,113.6 L150,116.4 L160,118.4 L170,119.6 L180,120.0 L190,119.6 L200,118.4 L210,116.4 L220,113.6 L230,110.0 L240,105.6 L250,100.4 L260,94.4 L270,87.6 L280,80.0 L290,71.6 L300,62.4 L310,52.4 L320,41.6" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="60" y="172" font-size="12" fill="#1d6fd1">f(x)</text>
  <text x="62" y="46" font-size="12" fill="#b4232c">f(x)²</text>
  <line x1="164" y1="150" x2="196" y2="150" stroke="#1d6fd1" stroke-width="4"/>
  <line x1="135" y1="165" x2="225" y2="165" stroke="#b4232c" stroke-width="4"/>
  <text x="232" y="154" font-size="11" fill="#1d6fd1">f too small to see</text>
  <text x="232" y="169" font-size="11" fill="#b4232c">f² too small to see</text>
</svg>
```

The gray band is the "too small to measure" zone. The red bar, where $f^2$ hides inside it, is much wider than the blue one.
:::

::: context next-module-plots Where these results go next
Every solver in this module produces numbers that someone has to look at: a fitted curve over its data, a Bode plot, a Welch spectrum, a histogram of Monte Carlo misses with the P99 line drawn on it. The plotting module teaches how to make those figures honest and readable, and how to handle the flight data files they come from, with their gaps, glitches and mixed sample rates.
:::
