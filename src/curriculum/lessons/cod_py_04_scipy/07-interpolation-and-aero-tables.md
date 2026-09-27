---
id: l07-interpolation-and-aero-tables
title: Interpolation and aero tables
minutes: 22
covers:
  - 'scipy.interpolate: interp1d, CubicSpline, RegularGridInterpolator for aero tables'
---

Think of a growth chart on a kitchen door. There is a pencil mark for every birthday: 120 cm at age eight, 126 cm at age nine. Nobody measured you at eight and a half. But if a friend asks, you would say "about 123 cm" without a second thought. You read *between* the marks.

That everyday move has a name. **Interpolation** means estimating a value between points you actually measured. Rockets depend on it all the time. A **[[wind tunnel|wind-tunnel]]** test measures a rocket's drag at a handful of speeds, not at every speed. The engine team measures thrust at a few moments in a test firing. The atmosphere is published as a table of heights. A flight simulation needs values at whatever speed, time or height the vehicle happens to be at — thousands of times per second — so it reads between the rows of those tables every step.

This lesson covers the three tools SciPy gives you for this, from simplest to most powerful. `interp1d` (and its little cousin `np.interp`) draw straight lines between points. `CubicSpline` draws a smooth curve through them. `RegularGridInterpolator` reads a table that has two, three or more inputs at once — the shape of real aerodynamic data. You will also meet the two ways interpolation goes wrong: a smooth curve that swings where the data does not, and a query that falls off the edge of the table.

## Straight lines between points

Start with one input. Say you have a table of a rocket's **drag coefficient** $C_D$ ("C sub D") — a plain number that says how "draggy" the shape is — at a few values of **[[Mach number|mach-number]]** $M$, the speed divided by the local speed of sound.

The simplest honest guess between two rows is a straight line. If you know the value $y_0$ at $x_0$ and $y_1$ at $x_1$, then at an $x$ in between:

$$
y = y_0 + \frac{x - x_0}{x_1 - x_0}\,(y_1 - y_0).
$$

Read it in two steps. The fraction $\frac{x - x_0}{x_1 - x_0}$ says how far along the gap you are, from $0$ at the left row to $1$ at the right row. Then you move that same fraction of the way from $y_0$ to $y_1$. Halfway along in $x$ means halfway along in $y$. That is **[[linear interpolation|linear-picture]]**: joining the dots with a ruler.

NumPy has this built in as `np.interp(x, xp, fp)`: the query points first, then the table's inputs, then its outputs. SciPy's version is `scipy.interpolate.interp1d`. You build it once from the table, and it hands back an object you call like a function:

```python
import numpy as np
from scipy.interpolate import interp1d

mach = np.array([0.0, 0.6, 0.8, 0.9, 1.0, 1.1, 1.2, 1.5, 2.0, 3.0])
cd   = np.array([0.30, 0.30, 0.32, 0.38, 0.55, 0.62, 0.60, 0.52, 0.45, 0.36])

print(round(float(np.interp(0.95, mach, cd)), 4))   # 0.465
cd_of = interp1d(mach, cd)                          # build once
print(round(float(cd_of(0.95)), 4))                 # 0.465, called like a function
print(np.round(cd_of([0.7, 1.05, 2.5]), 4))         # [0.31  0.585 0.405]
```

Both give the same number, because both draw the same straight line. The drag coefficient climbs steeply between Mach 0.8 and 1.1. That bump is the **[[transonic drag rise|drag-rise]]**, and it is real: a rocket fights its hardest drag near the speed of sound.

`interp1d` takes a `kind` argument. The default is `'linear'`. You can also ask for `'nearest'` (a staircase, no in-between at all), `'previous'`, `'next'` or `'cubic'`. The SciPy documentation now labels `interp1d` as *legacy*: it still works and you will see it in a lot of existing code, but for new code the advice is `np.interp` for straight lines and `CubicSpline` (next section) for smooth curves.

::: example Drag on a rocket at Mach 0.95
A rocket 3.66 m across climbs through 10 km altitude at Mach 0.95. There the air density is $\rho = 0.4135\,\mathrm{kg/m^3}$ ($\rho$ is the Greek letter "rho") and the speed of sound is about $299.5\,\mathrm{m/s}$. How much drag does it feel?

**Step 1 — read the table.** Mach 0.95 sits between the rows $M = 0.9$ ($C_D = 0.38$) and $M = 1.0$ ($C_D = 0.55$). The fraction along the gap is

$$
\frac{0.95 - 0.9}{1.0 - 0.9} = 0.5,
$$

so we go halfway from $0.38$ to $0.55$:

$$
C_D = 0.38 + 0.5 \times (0.55 - 0.38) = 0.38 + 0.085 = 0.465.
$$

That matches the code.

**Step 2 — speed.** $v = 0.95 \times 299.5 = 284.5\,\mathrm{m/s}$.

**Step 3 — dynamic pressure**, the "push" of the oncoming air: $q = \tfrac12 \rho v^2 = 0.5 \times 0.4135 \times 284.5^2 \approx 16{,}700\,\mathrm{Pa}$.

**Step 4 — area.** The circle's area is $A = \pi (3.66/2)^2 \approx 10.5\,\mathrm{m^2}$.

**Step 5 — drag.** $D = q\, C_D\, A \approx 16{,}700 \times 0.465 \times 10.5 \approx 81{,}900\,\mathrm{N}$, about $82\,\mathrm{kN}$.

Sanity check: 82 kN is the weight of about 8 tonnes. For a large rocket punching through the sound barrier, that is the right size — big, but far less than its engines' thrust.
:::

### What happens off the end of the table

Ask `interp1d` for Mach 3.5 and it refuses:

```python
import numpy as np
from scipy.interpolate import interp1d

mach = np.array([0.0, 0.6, 0.8, 0.9, 1.0, 1.1, 1.2, 1.5, 2.0, 3.0])
cd   = np.array([0.30, 0.30, 0.32, 0.38, 0.55, 0.62, 0.60, 0.52, 0.45, 0.36])

try:
    interp1d(mach, cd)(3.5)
except ValueError as err:
    print("ValueError")                             # ValueError

hold = interp1d(mach, cd, bounds_error=False, fill_value=(cd[0], cd[-1]))
print(round(float(hold(3.5)), 4))                   # 0.36  (holds the last row)

wild = interp1d(mach, cd, fill_value="extrapolate")
print(round(float(wild(4.0)), 4), round(float(wild(6.0)), 4))   # 0.27 0.09
print(round(float(np.interp(3.5, mach, cd)), 4))    # 0.36  (np.interp always holds)
```

Refusing is the safe default. Going past the last row is called **extrapolation** — guessing *outside* the measured range instead of between points — and it is far less trustworthy. With `fill_value="extrapolate"`, the last straight line keeps going, and by Mach 6 the drag coefficient has dropped to $0.09$, a number no one measured and no shape would give. With `bounds_error=False` and a pair of fill values, it holds the first or last row instead.

::: warning np.interp never complains
`np.interp` quietly holds the end values for any query outside the table, and it does not check that `xp` is sorted. Hand it an unsorted table and it returns nonsense without an error. `interp1d` sorts for you and raises on out-of-range queries. When a table's edge matters, decide on purpose what should happen there, and write that choice into the code.
:::

## Smooth curves: CubicSpline

Straight lines have corners at every table row. At Mach 0.9 the slope of the $C_D$ line suddenly jumps. For many uses that is fine. But some code needs the *slope* too — an optimizer, a guidance law, or a simulator that takes derivatives — and a slope that jumps at every row makes those tools stumble.

A **[[cubic spline|spline-origin]]** fixes the corners. Between each pair of rows it draws a cubic curve (a polynomial with an $x^3$ term), and it picks the curves so that where two pieces meet, the value, the slope and the bend all match. The result has no corners and no sudden changes in curvature. The table rows where pieces meet are called **knots**.

```python
import numpy as np
from scipy.interpolate import CubicSpline

mach = np.array([0.0, 0.6, 0.8, 0.9, 1.0, 1.1, 1.2, 1.5, 2.0, 3.0])
cd   = np.array([0.30, 0.30, 0.32, 0.38, 0.55, 0.62, 0.60, 0.52, 0.45, 0.36])

cs = CubicSpline(mach, cd)
print(round(float(cs(0.95)), 4))        # 0.4633  (value)
print(round(float(cs(0.95, 1)), 4))     # 1.8604  (slope dC_D/dM)
print(round(float(cs(0.95, 2)), 3))     # 1.383   (second derivative)
```

The value at Mach 0.95 is $0.4633$, very close to the straight-line $0.465$. The bonus is the second argument: `cs(x, 1)` gives the slope and `cs(x, 2)` the second derivative, exactly, from the same curve. The spline object also has `.derivative()` and `.integrate(a, b)`.

At the two ends of the table there is no neighbor to match, so the spline needs an extra rule, set by `bc_type` ("boundary condition type"). The default, `'not-a-knot'`, makes the first two pieces one single cubic, and likewise the last two. `'natural'` makes the bend zero at the ends. `'clamped'` makes the slope zero there. For tables with plenty of rows the choice mostly matters near the edges.

::: key
`interp1d` and `np.interp` join table rows with straight lines: continuous values, corners in the slope. `CubicSpline` joins them with cubics whose value, slope and second derivative all match at every knot, and it gives derivatives directly with `cs(x, 1)` and `cs(x, 2)`.
:::

### When smooth goes wrong

A spline wants to be smooth so badly that it will invent bumps to stay smooth. Where the data has a sudden step, the curve overshoots on one side and dips on the other.

Here is a real trap. A small solid rocket motor pushes hard, holds steady, then burns out and drops to zero:

```python
import numpy as np
from scipy.interpolate import CubicSpline, PchipInterpolator

t = np.array([0.0, 0.5, 1.0, 2.0, 3.0, 3.5, 4.0, 5.0])            # s
F = np.array([0.0, 900.0, 800.0, 780.0, 760.0, 300.0, 0.0, 0.0])   # N

cs = CubicSpline(t, F)
pc = PchipInterpolator(t, F)
tt = np.linspace(0.0, 5.0, 5001)
print(round(float(cs(tt).min()), 1), round(float(tt[cs(tt).argmin()]), 2))  # -72.1 4.45
print(round(float(cs(4.5)), 1), round(float(pc(4.5)), 1))                    # -71.4 0.0
print(round(float(pc(tt).min()), 1), round(float(pc(tt).max()), 1))          # 0.0 900.0
```

After burnout, the spline says the motor *pulls backwards* with about 72 N at $t = 4.45\,\mathrm{s}$. That is **[[overshoot|overshoot-picture]]**, and a simulation fed with it would slow the rocket down with thrust that does not exist.

The fix here is `PchipInterpolator`. PCHIP stands for "piecewise cubic Hermite interpolating polynomial". It is also a smooth cubic curve, but it never goes above or below the data between two rows: where the data is flat, it stays flat. It gives up the matched second derivative to get that. SciPy also has `Akima1DInterpolator`, which sits between the two.

::: warning Look at the curve, not only the rows
A spline always passes exactly through every row, so checking the rows tells you nothing. Plot it on a fine grid, or check its minimum and maximum against the data's, before you trust it. Thrust that goes negative, density that goes negative, or a coefficient that bumps past every measured value are the classic signs.
:::

::: example Interpolate the logarithm of density
Air density falls off roughly **[[exponentially|exponential-air]]** with height: every few kilometers up, it drops by the same fraction. A table in 10 km steps gives $1.225$ at 0 km and $0.4135\,\mathrm{kg/m^3}$ at 10 km. What is the density at 5 km? The standard atmosphere says $0.7364\,\mathrm{kg/m^3}$.

**Straight line on density.** Halfway: $(1.225 + 0.4135)/2 = 0.819\,\mathrm{kg/m^3}$. That is 11% too high, because a straight line cannot follow a curve that sags.

**Straight line on the logarithm.** Take the natural log of each row: $\ln 1.225 = 0.2029$ and $\ln 0.4135 = -0.8831$. Halfway between them is $-0.3401$. Undo the log: $e^{-0.3401} = 0.712\,\mathrm{kg/m^3}$. That is 3.4% low — three times better, with the same table.

Why does it work? An exponential turns into a straight line when you take its logarithm, so the straight-line guess suits the log far better than it suits the density itself.

Farther up the table the gap grows. Using rows every 10 km up to 40 km:

| Height | True $\rho$ | Straight line | Straight line on $\ln\rho$ | Spline on $\rho$ |
|---|---|---|---|---|
| 15 km | 0.1948 | +29% | −1.5% | +5.5% |
| 25 km | 0.0401 | +34% | +0.9% | −13% |
| 35 km | 0.00846 | +32% | +1.4% | +89% |

The spline on raw density is the worst of all at 35 km: almost double the true value, because a smooth cubic cannot bend fast enough to follow a curve that drops by a factor of 3 to 5 in each step.

In code: `np.exp(np.interp(h, h_table, np.log(rho_table)))`. The lesson is not "splines are bad". It is: interpolate the quantity that changes smoothly, then convert back.
:::

## Tables with more than one input

Real aerodynamic data does not have one input. The force that pushes a rocket sideways depends on its Mach number, its **[[angle of attack|angle-of-attack]]** $\alpha$ ("alpha", the angle between the rocket's nose and the oncoming air), and how far its fins or engine are turned. A wind-tunnel campaign measures a grid: every Mach on its list, at every angle on its list, at every fin setting on its list. The result is a block of numbers with three indices — a 3-D array.

The idea extends from one input to many by doing straight lines one input at a time. With two inputs you stand inside a rectangle of four measured corners. Blend along one side, then blend the two results along the other. That is **[[bilinear interpolation|bilinear-square]]**. With three inputs you stand inside a box of eight corners and blend three times: trilinear. In general it is called **multilinear interpolation**.

Write $s$ for how far along the first input you are (from 0 to 1) and $t$ for the second. With corner values $f_{00}, f_{10}, f_{01}, f_{11}$ (first index for the first input, second for the second):

$$
f \approx (1-s)(1-t)\,f_{00} + s(1-t)\,f_{10} + (1-s)\,t\,f_{01} + s\,t\,f_{11}.
$$

Each corner gets a weight, the four weights add up to 1, and a corner counts more the closer you are to it.

SciPy's tool is `RegularGridInterpolator`. A **regular grid** means each input has its own list of values, and the table holds a number for every combination — the lists do not need even spacing, but the table has no holes.

```python
import numpy as np
from scipy.interpolate import RegularGridInterpolator

mach  = np.array([0.8, 1.2])
alpha = np.array([4.0, 8.0])                 # degrees
cn = np.array([[0.40, 0.82],                 # Mach 0.8, at alpha 4 and 8
               [0.48, 0.98]])                # Mach 1.2, at alpha 4 and 8

cn_of = RegularGridInterpolator((mach, alpha), cn)
print(cn_of([[1.0, 5.0]]))                   # [0.555]
try:
    cn_of([[1.3, 5.0]])
except ValueError:
    print("out of bounds")                   # out of bounds
```

The pattern: give it a tuple of the axis arrays, `(mach, alpha)`, and a values array whose shape is `(len(mach), len(alpha))`. Then call it with points, one row per query point and one column per input. Like `interp1d`, it refuses to leave the table unless you pass `bounds_error=False`, and then it returns `fill_value` (default: `nan`, "not a number").

::: example Bilinear by hand, checked by SciPy
Find the normal-force coefficient $C_N$ at Mach 1.0 and $\alpha = 5^\circ$ from the four-corner table above.

**How far along each input?** For Mach: $s = \frac{1.0 - 0.8}{1.2 - 0.8} = 0.5$. For angle: $t = \frac{5 - 4}{8 - 4} = 0.25$.

**Blend along angle at Mach 0.8:** $0.40 + 0.25 \times (0.82 - 0.40) = 0.40 + 0.105 = 0.505$.

**Blend along angle at Mach 1.2:** $0.48 + 0.25 \times (0.98 - 0.48) = 0.48 + 0.125 = 0.605$.

**Blend those two along Mach:** $0.505 + 0.5 \times (0.605 - 0.505) = 0.555$.

With the four-weight formula instead: the weights are $(0.5)(0.75) = 0.375$, $(0.5)(0.75) = 0.375$, $(0.5)(0.25) = 0.125$ and $(0.5)(0.25) = 0.125$, which add to 1. Then $0.375 \times 0.40 + 0.375 \times 0.48 + 0.125 \times 0.82 + 0.125 \times 0.98 = 0.15 + 0.18 + 0.1025 + 0.1225 = 0.555$. Same answer, and SciPy agrees.

Sanity check: $0.555$ lies between the smallest corner ($0.40$) and the largest ($0.98$), and nearer the low-angle corners, since $5^\circ$ is closer to $4^\circ$ than to $8^\circ$. Multilinear interpolation can never go outside the range of its corners — no overshoot, ever.
:::

### A three-input aero table

Here is the shape of the real thing: a pitching-moment coefficient $C_m$ over Mach, angle of attack and fin deflection $\delta$ ("delta"). The numbers come from a made-up formula so the code runs by itself, but the grid is the kind a real table has.

```python
import numpy as np
from scipy.interpolate import RegularGridInterpolator

mach  = np.array([0.5, 0.8, 1.0, 1.2, 2.0, 3.0])
alpha = np.linspace(-10.0, 10.0, 11)       # deg, every 2 deg
delta = np.linspace(-20.0, 20.0, 9)        # deg, every 5 deg
M, A, D = np.meshgrid(mach, alpha, delta, indexing="ij")
cm = -0.02 * A / np.sqrt(np.abs(M**2 - 1) + 0.2) - 0.015 * D   # invented data
print(cm.shape)                            # (6, 11, 9)

cm_table = RegularGridInterpolator((mach, alpha, delta), cm)
print(np.round(cm_table([[0.9, 3.0, -4.0]]), 4))   # [-0.0472]

rng = np.random.default_rng(1)
pts = np.column_stack([rng.uniform(0.5, 3.0, 10_000),
                       rng.uniform(-10.0, 10.0, 10_000),
                       rng.uniform(-20.0, 20.0, 10_000)])
print(cm_table(pts).shape)                 # (10000,)
```

Two habits in that code matter. First, `indexing="ij"` in `np.meshgrid` makes the array's first index Mach, its second alpha and its third delta, in the same order as the axes tuple. The default, `"xy"`, swaps the first two, and the interpolator would then read the table sideways. Second, the last call asks for ten thousand points in a single call. On a laptop, that batch takes a fraction of a microsecond per point; calling the interpolator once per point in a Python loop took several hundred times longer per point. Build the interpolator once, outside the loop, and feed it arrays.

::: key
Aerodynamic coefficient tables are functions of Mach, angle of attack and control deflection on a regular grid. `RegularGridInterpolator` does multilinear interpolation on N-dimensional grids efficiently, which is what a **[[6-DOF sim|six-dof]]** calls thousands of times per second.
:::

::: warning Axis order and edge behavior
The values array's axes must be in the same order as the tuple of grid arrays, and each axis must be strictly increasing or strictly decreasing with no repeats. A transposed table does not raise an error if the two axes happen to have the same length — it returns wrong numbers. And out-of-range queries raise by default. If you switch that off, pick `fill_value` on purpose: `nan` makes a problem loud, a number makes it quiet.
:::

`RegularGridInterpolator` also takes `method=`: `'linear'` (the default), `'nearest'`, and smoother options such as `'cubic'` and `'pchip'`. The smoother ones are slower and can overshoot, as you saw in one dimension. Most flight simulators stay with linear: it is fast, it never goes outside the corner values, and it is what the aero team who made the table expect.

## Check yourself

::: check
A table gives a thrust of 760 N at $t = 3.0\,\mathrm{s}$ and 300 N at $t = 3.5\,\mathrm{s}$. What does linear interpolation give at $t = 3.2\,\mathrm{s}$?
:::

::: answer
The fraction along the gap is $\frac{3.2 - 3.0}{3.5 - 3.0} = \frac{0.2}{0.5} = 0.4$. Move 40% of the way from 760 to 300: $760 + 0.4 \times (300 - 760) = 760 - 184 = 576\,\mathrm{N}$. It lies between the two rows and nearer the first, as it should.
:::

::: check
Your simulation's drag suddenly looks strange at Mach 4, but the drag table stops at Mach 3. The code uses `np.interp`. What is it returning, and why is that dangerous?
:::

::: answer
`np.interp` holds the end value for any query outside the table, so every Mach above 3 gets the Mach 3 coefficient, 0.36, with no warning. It is dangerous because nothing tells you the simulation has left the measured data. Use `interp1d` (which raises by default) or check the range yourself, and decide on purpose whether to hold, extrapolate or stop.
:::

::: check
Why does a cubic spline dip below zero after a solid motor burns out, while PCHIP does not?
:::

::: answer
A cubic spline forces value, slope and second derivative to match at every knot. To come down from a steep drop and then match a flat zero line smoothly, the curve has to bend past zero and come back. PCHIP only matches value and slope, and it chooses the slopes so the curve never leaves the range of the two rows it sits between, so where the data is flat at zero the curve stays at zero.
:::

::: check
Four corners of a grid have $C_N$ values 0.2, 0.3, 0.4 and 0.5. Without calculating, what range must a bilinear result inside that cell lie in?
:::

::: answer
Between 0.2 and 0.5. Bilinear interpolation is a weighted average of the four corners with weights that are all between 0 and 1 and add to 1, so the result can never be smaller than the smallest corner or larger than the largest.
:::

::: check
A teammate builds `RegularGridInterpolator((mach, alpha), table)` inside the function that the simulator calls every time step, then asks it for one point. What two things would you change?
:::

::: answer
Build the interpolator once, outside the time-step function, since building it every step repeats work that never changes. And where possible ask for many points at once (for example, all the vehicles or all the Monte Carlo cases in one array), because one batched call is hundreds of times cheaper per point than one call per point.
:::

## Summary

| Tool or idea | What it does | Remember |
|---|---|---|
| Linear interpolation | Straight line between two rows | $y = y_0 + \frac{x - x_0}{x_1 - x_0}(y_1 - y_0)$ |
| `np.interp(x, xp, fp)` | Fast 1-D straight lines | Holds end values silently, needs sorted `xp` |
| `interp1d(x, y, kind=...)` | 1-D interpolator object | Legacy; raises outside the table by default |
| `CubicSpline(x, y)` | Smooth cubic pieces | Matches value, slope, bend; `cs(x, 1)` is the slope; can overshoot |
| `PchipInterpolator` | Smooth, no overshoot | Stays within neighboring rows |
| Interpolate $\ln\rho$ | Exponential data | Convert back with `np.exp` |
| `RegularGridInterpolator(axes, values)` | Multilinear on N-D grids | Axes in the same order as the array; build once, query in batches |
| Extrapolation | Guessing outside the table | Off by default; choose on purpose |

The next lesson moves from tables to turning: SciPy's `Rotation` object, which stores an attitude once and lets you read it as a matrix, as angles or as a quaternion — and it too can interpolate, between two attitudes, with a tool called slerp.

::: context wind-tunnel Where the table's numbers come from
A wind tunnel blows air past a scale model mounted on a force balance, a sensor that measures the push and twist on it. Each run holds one speed, one angle and one fin setting, so a test campaign produces a grid of separate points, not a smooth curve. Computer simulations of the airflow (CFD) fill gaps and extend the range. The table a flight simulator reads is the merged result, often thousands of numbers, and the interpolator is how every point in between gets a value.
:::

::: context mach-number Speed measured against sound
Mach number is speed divided by the speed of sound in the air around you, so it has no units. Mach 1 is the speed of sound itself. Sound moves slower in cold air, so Mach 1 is about 340 m/s at sea level but about 295 m/s at 11 to 20 km, where the air is near −57 °C. Aerodynamic tables use Mach rather than m/s because the airflow pattern around a shape depends mostly on Mach.
:::

::: context linear-picture Joining the dots with a ruler
Linear interpolation lays a straight ruler between two measured points and reads off the height. The fraction you are along the gap in $x$ is the fraction you move along in $y$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="140" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="90" y1="110" x2="290" y2="40" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="90" cy="110" r="5" fill="#1f2a44"/>
  <circle cx="290" cy="40" r="5" fill="#1f2a44"/>
  <line x1="190" y1="140" x2="190" y2="75" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="40" y1="75" x2="190" y2="75" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="190" cy="75" r="5" fill="#b4232c"/>
  <text x="90" y="157" font-size="12" text-anchor="middle" fill="#1f2a44">x0</text>
  <text x="190" y="157" font-size="12" text-anchor="middle" fill="#b4232c">x (halfway)</text>
  <text x="290" y="157" font-size="12" text-anchor="middle" fill="#1f2a44">x1</text>
  <text x="80" y="104" font-size="12" text-anchor="end" fill="#1f2a44">y0</text>
  <text x="300" y="36" font-size="12" fill="#1f2a44">y1</text>
  <text x="36" y="79" font-size="12" text-anchor="end" fill="#b4232c">y</text>
</svg>
```
:::

::: context drag-rise Why drag peaks near the speed of sound
As a rocket nears Mach 1, air speeding up over its nose goes supersonic in patches, and shock waves form. Those shocks turn the vehicle's energy into heat and pressure jumps, and the drag coefficient can nearly double over a narrow band of Mach. Past about Mach 1.2 the shocks settle into a steady pattern and the coefficient slowly falls again. The same stretch of flight is also near the moment of highest dynamic pressure, so it is the aerodynamically roughest part of ascent.
:::

::: context spline-origin A word from the drawing office
Before computers, ship and aircraft designers drew smooth curves with a spline: a long, thin, flexible strip of wood or metal, held against chosen points by lead weights. The strip bent as little as it could while passing every point, which made a naturally smooth curve. The mathematical cubic spline copies that behavior, and the "natural" boundary condition mimics a free strip whose ends are not bent at all.
:::

::: context overshoot-picture Smooth, but wrong
The spline (blue) must pass every row and stay smooth, so after the sharp drop to zero it swings below the axis before it comes back. PCHIP (dark) stays flat at zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="345" y2="120" stroke="#6c7a93" stroke-width="1"/>
  <text x="340" y="112" font-size="11" text-anchor="end" fill="#6c7a93">thrust = 0</text>
  <path d="M60,30 L140,40 L200,95 L260,120 L330,120" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <path d="M60,30 C100,32 130,34 140,40 C165,55 185,85 200,95 C220,112 240,140 262,142 C290,144 310,125 330,120" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 3"/>
  <circle cx="60" cy="30" r="4" fill="#1f2a44"/>
  <circle cx="140" cy="40" r="4" fill="#1f2a44"/>
  <circle cx="200" cy="95" r="4" fill="#1f2a44"/>
  <circle cx="260" cy="120" r="4" fill="#1f2a44"/>
  <circle cx="330" cy="120" r="4" fill="#1f2a44"/>
  <text x="262" y="162" font-size="12" text-anchor="middle" fill="#b4232c">dips below zero</text>
  <text x="70" y="18" font-size="12" fill="#1f2a44">table rows (dots)</text>
  <line x1="40" y1="156" x2="70" y2="156" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 3"/>
  <text x="76" y="160" font-size="12" fill="#1d6fd1">cubic spline</text>
  <line x1="40" y1="171" x2="70" y2="171" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="76" y="175" font-size="12" fill="#1f2a44">PCHIP</text>
</svg>
```
:::

::: context exponential-air Why density drops by a fraction per step
Each layer of air carries the weight of all the air above it. So the more air there is overhead, the more it squeezes the layer below. That feedback gives an exponential fall: density drops by a factor of $e \approx 2.72$ roughly every 6 to 9 km, a distance called the scale height (shorter where the air is colder). The exact rate changes with temperature, which is why the published standard atmosphere is a table rather than one formula.
:::

::: context angle-of-attack The angle between nose and wind
Angle of attack is the angle between the direction the rocket's body points and the direction the air is flowing past it. At zero the air meets the nose head-on. Tilt the body a few degrees and the air pushes on its side, creating a normal force and a turning moment. Ascent guidance tries to keep it near zero through the high-pressure part of flight, because side loads there can bend a long, thin rocket.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g transform="translate(180,75) rotate(-15)">
    <rect x="-110" y="-12" width="190" height="24" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <path d="M80,-12 L120,0 L80,12 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <line x1="-140" y1="0" x2="160" y2="0" stroke="#1f2a44" stroke-width="1" stroke-dasharray="5 4"/>
  </g>
  <line x1="20" y1="75" x2="340" y2="75" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="20,75 32,69 32,81" fill="#b4232c"/>
  <text x="340" y="95" font-size="12" text-anchor="end" fill="#b4232c">oncoming air</text>
  <path d="M290,75 A 110 110 0 0 0 286.3,46.5" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="298" y="60" font-size="13" fill="#1f2a44">α</text>
  <text x="60" y="30" font-size="12" fill="#1f2a44">body axis (dashed)</text>
</svg>
```
:::

::: context bilinear-square Four corners, four weights
Inside one grid cell, each corner's weight is the area of the rectangle *opposite* it, as a fraction of the whole cell. Stand near a corner and its opposite rectangle is large, so that corner counts most.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="80" y="20" width="200" height="140" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="180" y="20" width="100" height="105" fill="#8fb8f0" opacity="0.7"/>
  <line x1="180" y1="20" x2="180" y2="160" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="80" y1="125" x2="280" y2="125" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="180" cy="125" r="5" fill="#b4232c"/>
  <circle cx="80" cy="160" r="4" fill="#1f2a44"/>
  <circle cx="280" cy="160" r="4" fill="#1f2a44"/>
  <circle cx="80" cy="20" r="4" fill="#1f2a44"/>
  <circle cx="280" cy="20" r="4" fill="#1f2a44"/>
  <text x="72" y="176" font-size="12" text-anchor="middle" fill="#1f2a44">f00</text>
  <text x="290" y="176" font-size="12" text-anchor="middle" fill="#1f2a44">f10</text>
  <text x="72" y="14" font-size="12" text-anchor="middle" fill="#1f2a44">f01</text>
  <text x="290" y="14" font-size="12" text-anchor="middle" fill="#1f2a44">f11</text>
  <text x="230" y="76" font-size="12" text-anchor="middle" fill="#1f2a44">weight of f00</text>
  <text x="190" y="142" font-size="12" fill="#b4232c">query point</text>
  <text x="130" y="186" font-size="11" text-anchor="middle" fill="#6c7a93">s = 0.5</text>
  <text x="300" y="146" font-size="11" fill="#6c7a93">t = 0.25</text>
</svg>
```
:::

::: context six-dof Three ways to move, three ways to turn
A 6-DOF ("six degrees of freedom") simulation tracks a vehicle's position along three axes and its attitude about three axes, stepping forward in time with the forces and moments on it. Every step it looks up the aero coefficients at the current Mach, angle of attack and fin setting. At a thousand steps per simulated second, over many hundreds of Monte Carlo runs, the table lookup is one of the hottest lines of code in the whole program. The 6-DOF simulation module later in the course builds one.
:::
