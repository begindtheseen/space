---
id: l05-tolerances-and-output
title: Choosing rtol and atol, and asking for output
minutes: 22
covers:
  - 'rtol and atol: what each controls and how to choose them from the state magnitudes'
  - 't_eval versus dense_output'
---

Imagine two ways of telling a friend how careful to be with a measurement. "Be within one percent" works well for a sack of flour: one percent of $10\,\mathrm{kg}$ is $100\,\mathrm{g}$. It fails for a pinch of salt weighing half a gram, because one percent of that is five milligrams, finer than any kitchen scale can read. So you add a second rule: "and never worry about anything under one gram". Now the flour is held to a percentage and the salt to a fixed floor. Two rules, each in charge where the other one is silly.

Every adaptive solver in `solve_ivp` is told how careful to be in exactly this way. **`rtol`**, the **relative tolerance**, is the percentage rule. **`atol`**, the **absolute tolerance**, is the floor, in the state's own units. Back in the adaptive-step lesson you saw them appear in the step controller's accept-or-reject test. This lesson is about setting them: what each one controls, why the defaults are dangerous for spacecraft, and how to read good values off the sizes of your own states.

The second half answers a question that trips up nearly everyone: if you want the trajectory at particular times — once a second for a plot, or at the exact times a star tracker took its pictures — how do you get it, and does asking for more output make the answer more accurate? It does not, and seeing why tells you a lot about how the solver works.

## One test, two knobs

In lesson 3 you met the allowance each component of the state gets on a step. Here it is again, in the form SciPy uses:

$$
\text{scale}_i = \text{atol}_i + \text{rtol} \cdot \max\left(|y_i|,\ |y_i^{\text{new}}|\right).
$$

Read it as "the scale for component $i$ is its atol plus rtol times the bigger of its old and new size". The solver estimates the error $e_i$ it has made in each component, divides by the scale, and combines the ratios into one number with a **[[root-mean-square|rms-norm]]**. If that number is at most $1$, the step is accepted. If not, the step is thrown away and retried shorter.

So the two knobs split the work by size.

- For a **large** component, $\text{rtol} \cdot |y_i|$ is much bigger than $\text{atol}_i$, and rtol decides. It sets how many **[[significant digits|significant-digits]]** each step keeps: $\text{rtol} = 10^{-9}$ means each step may disturb a component by about one part in a billion.
- For a component **near zero**, $\text{rtol} \cdot |y_i|$ shrinks toward nothing, and atol takes over as the floor. Without it, a component passing through zero would demand an impossible relative accuracy on a number that is almost zero.

The changeover happens where the two terms are equal: $|y_i| = \text{atol}_i / \text{rtol}$. Above that size, rtol is in charge. Below it, atol is. Drawn on log-log axes, the **[[allowance is a hockey stick|allowance-picture]]**: flat at the floor, then rising.

::: key
The step controller keeps the estimated local error of each component below atol + rtol·|y|. rtol governs significant digits for large components, atol sets the floor that matters near zero, and atol must be set per the physical scale of each state.
:::

Remember the other lesson-3 warning too: these are limits on the error added in **each step**. The final error of a long run adds up many of them, stretched by the dynamics. You will measure that below.

::: example What the defaults do to an orbit
The defaults are `rtol=1e-3` and `atol=1e-6`. Try them on a circular orbit of radius $a = 7000\,\mathrm{km}$, flown for one revolution of $5829\,\mathrm{s}$ (about 97 minutes).

**The allowance per step.** The position components are up to $7 \times 10^6\,\mathrm{m}$ in size, so the relative part is $10^{-3} \times 7 \times 10^6 = 7000\,\mathrm{m}$. The atol of $10^{-6}\,\mathrm{m}$ adds nothing. Each step may put the spacecraft up to about $7\,\mathrm{km}$ off.

**Run it.**

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 3.986004418e14
def two_body(t, y, mu):
    r, v = y[:3], y[3:]
    return np.concatenate([v, -mu * r / np.linalg.norm(r)**3])

a = 7.0e6
y0 = np.array([a, 0.0, 0.0, 0.0, np.sqrt(MU / a), 0.0])
T = 2 * np.pi * np.sqrt(a**3 / MU)

sol = solve_ivp(two_body, (0.0, T), y0, args=(MU,))      # all defaults
print(sol.nfev, sol.success)
print(f"{np.linalg.norm(sol.y[:3, -1] - y0[:3]) / 1e3:.0f} km")
# 110 True
# 1854 km
```

**Read the result.** The solver reports success after only $110$ evaluations — and the spacecraft ends up $1854\,\mathrm{km}$ from where a full orbit should bring it back. That is more than a quarter of the orbit's radius.

**Sanity check.** $1854 / 7000 \approx 0.26$. Default settings are fine for a quick look at a textbook equation whose answer is about $1$. For a state measured in millions of meters, "success" with the defaults means nothing. Always set both tolerances yourself.
:::

## Choosing atol from the state magnitudes

A spacecraft state mixes units. Three components are positions in meters, around $7 \times 10^6$. Three are velocities in meters per second, around $7.5 \times 10^3$. A single number for atol cannot suit both, because "one" of something means very different things in each: one meter of position is a small error in orbit, and one meter per second of velocity is a large one. That is why `atol` accepts an **array**, one entry per state.

Here is a recipe that works for most GNC problems.

1. **Pick rtol from the accuracy you need**, with margin, because the final error is usually larger than the per-step allowance. You will check it at the end.
2. **Write down a typical size $S_i$ for each state**, in its own units: the orbit radius for positions, the orbital speed for velocities, the wet mass for a mass state, $1\,\mathrm{rad/s}$ or so for a tumbling rate.
3. **Set $\text{atol}_i \approx \text{rtol} \times S_i$**, or up to ten times smaller if you want the floor to stay out of the way.

Step 3 has a plain meaning. The changeover size $\text{atol}_i / \text{rtol}$ becomes $S_i$. So a component that passes near zero is still held to the same absolute accuracy it would get at its typical size — the accuracy that actually means something for that physical quantity. A position crossing zero on its way around the Earth is not somehow more delicate than a position of $7000\,\mathrm{km}$.

::: example Three ways to set atol on the same orbit
One revolution with DOP853 and `rtol=1e-10`. Compare a per-state atol from the recipe, a single atol of $1$, and a single atol of $10^{-15}$.

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 3.986004418e14
def two_body(t, y, mu):
    r, v = y[:3], y[3:]
    return np.concatenate([v, -mu * r / np.linalg.norm(r)**3])

a = 7.0e6
y0 = np.array([a, 0.0, 0.0, 0.0, np.sqrt(MU / a), 0.0])
T = 2 * np.pi * np.sqrt(a**3 / MU)
S = np.r_[np.full(3, 7e6), np.full(3, 7.5e3)]     # typical size: m, m/s

cases = [("per-state, rtol 1e-10",   1e-10, 1e-10 * S),
         ("single atol = 1",         1e-10, 1.0),
         ("single atol = 1e-15",     1e-10, 1e-15),
         ("per-state, rtol 3e-11",   3e-11, 3e-11 * S)]
for name, rtol, atol in cases:
    sol = solve_ivp(two_body, (0.0, T), y0, args=(MU,), method="DOP853",
                    rtol=rtol, atol=atol)
    miss = np.linalg.norm(sol.y[:3, -1] - y0[:3])
    print(f"{name:22s} nfev {sol.nfev:3d}  miss {miss * 1e3:7.1f} mm")
# per-state, rtol 1e-10  nfev 338  miss     4.0 mm
# single atol = 1        nfev 182  miss  2241.3 mm
# single atol = 1e-15    nfev 494  miss     1.7 mm
# per-state, rtol 3e-11  nfev 386  miss     1.2 mm
```

**The recipe.** $\text{atol} = 10^{-10} \times 7 \times 10^6 = 7 \times 10^{-4}\,\mathrm{m}$ for positions and $10^{-10} \times 7500 = 7.5 \times 10^{-7}\,\mathrm{m/s}$ for velocities. Cost $338$ evaluations, miss $4.0\,\mathrm{mm}$.

**A single atol of 1.** For positions a $1\,\mathrm{m}$ floor is loose but tolerable. For velocities it is a disaster: the floor of $1\,\mathrm{m/s}$ is over a million times larger than the $7.5 \times 10^{-7}\,\mathrm{m/s}$ that rtol asked for, so the velocities are barely controlled. The run is cheap ($182$) and misses by $2.24\,\mathrm{m}$ — over 500 times worse.

**A single atol of $10^{-15}$.** Now rtol rules everywhere, even when a component crosses zero. It costs $494$ evaluations for a $1.7\,\mathrm{mm}$ miss.

**The fair comparison.** If you want that extra accuracy, tighten rtol instead: the recipe at `rtol=3e-11` costs $386$ evaluations, $22\%$ fewer than $494$, and misses by only $1.2\,\mathrm{mm}$. Spending effort through rtol buys accuracy where it matters; spending it through a tiny atol buys accuracy on numbers passing through zero.
:::

The waste from a tiny atol can be far worse than in the orbit, where each component only brushes past zero. Picture a spacecraft whose spin is being bled off by a damper, so its rate decays toward zero and stays there.

```python
import numpy as np
from scipy.integrate import solve_ivp

def rates(t, y):
    # spin rate (rad/s) bleeding off through a damper, time constant 20 s
    return -y / 20.0

for atol in [1e-8, 1e-12, 1e-30, 1e-100]:
    sol = solve_ivp(rates, (0.0, 3600.0), [0.05], rtol=1e-6, atol=atol)
    print(f"atol={atol:.0e}  nfev={sol.nfev:5d}  final rate={sol.y[0, -1]:.1e} rad/s")
# atol=1e-08  nfev=  536  final rate=1.2e-09 rad/s
# atol=1e-12  nfev=  734  final rate=1.5e-13 rad/s
# atol=1e-30  nfev= 1724  final rate=3.0e-31 rad/s
# atol=1e-100  nfev= 4682  final rate=3.4e-80 rad/s
```

With `atol=1e-100` the solver works about nine times harder ($4682$ against $536$ evaluations), and all that effort goes into tracking a spin rate of $3 \times 10^{-80}\,\mathrm{rad/s}$ to six digits. No gyro could ever measure it. The physics stopped mattering hours earlier.

::: key
Your integrator takes a million tiny steps over a 100-second span? Suspect stiffness (Radau or BDF), a discontinuity or near-singularity being stepped over (a saturation, a table edge, a radius approaching zero), or an atol set far below the physical scale of a state.
:::

::: warning Never set atol to zero
With `atol=0`, a component that is exactly zero — the $z$ position and velocity of an orbit in the $xy$ plane, say — gets a scale of zero, and the error test divides by it. On the orbit above, SciPy prints divide-by-zero warnings and then crawls for minutes. Give every state a positive floor.
:::

::: warning rtol has a floor too
A double-precision number carries about 16 significant digits, so there is a **[[limit on relative accuracy|machine-epsilon]]**. SciPy raises any rtol below $100 \times 2.2 \times 10^{-16} \approx 2.2 \times 10^{-14}$ to that value and warns you. In practice, rtol between $10^{-12}$ and $10^{-13}$ is about as tight as a long run can usefully go; below that, round-off grows faster than truncation error shrinks.
:::

## From a requirement to a tolerance

A requirement is written about the final answer: "the predicted position after ten revolutions must be good to $1\,\mathrm{m}$". The tolerance is about each step. The only honest bridge is a measurement. The standard one needs no exact solution: run the case twice, the second time with rtol ten times tighter, and take the difference. Because the tighter run is roughly ten times more accurate, the difference is almost all error of the looser run. This works because errors in a well-behaved solver shrink steadily as the tolerance does, a property called **[[tolerance proportionality|tolerance-proportionality]]**.

::: example One meter after ten revolutions
Ten revolutions of the same orbit, about $16.2\,\mathrm{h}$, with DOP853 and per-state atol from the recipe.

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 3.986004418e14
def two_body(t, y, mu):
    r, v = y[:3], y[3:]
    return np.concatenate([v, -mu * r / np.linalg.norm(r)**3])

a = 7.0e6
y0 = np.array([a, 0.0, 0.0, 0.0, np.sqrt(MU / a), 0.0])
T = 2 * np.pi * np.sqrt(a**3 / MU)
S = np.r_[np.full(3, 7e6), np.full(3, 7.5e3)]     # typical size: m, m/s

final = {}
for rtol in [1e-7, 1e-8, 1e-9, 1e-10]:
    sol = solve_ivp(two_body, (0.0, 10 * T), y0, args=(MU,), method="DOP853",
                    rtol=rtol, atol=rtol * S)
    final[rtol] = sol.y[:3, -1]
    miss = np.linalg.norm(sol.y[:3, -1] - y0[:3])
    print(f"rtol {rtol:.0e}: nfev {sol.nfev:5d}, true miss {miss:8.3f} m")

for loose, tight in [(1e-7, 1e-8), (1e-8, 1e-9), (1e-9, 1e-10)]:
    est = np.linalg.norm(final[loose] - final[tight])
    print(f"estimate for rtol {loose:.0e} from rerun at {tight:.0e}: {est:8.3f} m")
# rtol 1e-07: nfev  1262, true miss   41.319 m
# rtol 1e-08: nfev  1670, true miss    2.003 m
# rtol 1e-09: nfev  2222, true miss    0.044 m
# rtol 1e-10: nfev  2954, true miss    0.007 m
# estimate for rtol 1e-07 from rerun at 1e-08:   39.316 m
# estimate for rtol 1e-08 from rerun at 1e-09:    1.959 m
# estimate for rtol 1e-09 from rerun at 1e-10:    0.051 m
```

**The per-step allowance versus the result.** At `rtol=1e-8`, each step may add about $10^{-8} \times 7 \times 10^6 = 0.07\,\mathrm{m}$ of position error. After ten revolutions the real miss is $2.0\,\mathrm{m}$, about 29 times that. Local limits do not bound global error.

**The rerun estimate.** Without knowing the true answer, the difference between the `1e-8` and `1e-9` runs is $1.96\,\mathrm{m}$ — within $3\%$ of the true $2.00\,\mathrm{m}$. The estimate for `1e-7` is $39.3\,\mathrm{m}$ against the true $41.3\,\mathrm{m}$. It works.

**The choice.** `1e-8` fails the $1\,\mathrm{m}$ requirement. `1e-9` meets it with a margin of more than twenty ($0.044\,\mathrm{m}$), for $2222$ evaluations. Choosing `1e-10` would buy a margin of about 140 for $33\%$ more work. Either is defensible; `1e-9` is the leaner answer, and you can say exactly why.

**Sanity check.** Each factor of ten in rtol cut the error by a large, if uneven, factor: about $21$, then $46$, then $6$. The error keeps falling as the tolerance does, which is what tolerance proportionality promises. If an extra factor of ten had changed nothing, you would suspect round-off; if it had changed the answer wildly, you would suspect a discontinuity.
:::

::: warning Rerun estimates need a real change
If you tighten rtol but leave a tiny, fixed atol, or a `max_step` that already dictates the steps, the two runs may take nearly the same steps and agree closely by coincidence. Scale atol with rtol (as the recipe does), and check that `nfev` actually went up between the runs.
:::

## t_eval: choosing when you see the answer

Now the output. By default `sol.t` holds the times of the steps the solver chose, which are irregular and few — the orbit above took a few dozen steps per revolution. For a plot, a comparison with telemetry, or a table in a report, you want the state at times *you* choose. The argument **`t_eval`** does that: give it a sorted array of times inside `t_span`, and `sol.t` and `sol.y` come back at exactly those times.

How does the solver know the state at a time it never stepped to? Each Runge–Kutta step, once accepted, carries an **[[interpolant|interpolant-inside]]** — a smooth polynomial that runs through the step, built from the stages the step already computed. `t_eval` points are filled in from those polynomials, step by step, as the run goes. The steps themselves are chosen exactly as before, by the tolerances.

Here is the proof. Take the default-tolerance orbit that missed by $1854\,\mathrm{km}$, and ask for output every second.

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 3.986004418e14
def two_body(t, y, mu):
    r, v = y[:3], y[3:]
    return np.concatenate([v, -mu * r / np.linalg.norm(r)**3])

a = 7.0e6
y0 = np.array([a, 0.0, 0.0, 0.0, np.sqrt(MU / a), 0.0])
T = 2 * np.pi * np.sqrt(a**3 / MU)

plain = solve_ivp(two_body, (0.0, T), y0, args=(MU,))
grid = np.arange(0.0, T, 1.0)                     # every second
fine = solve_ivp(two_body, (0.0, T), y0, args=(MU,), t_eval=grid)

print(plain.nfev, fine.nfev)                      # same work
print(plain.t.size, fine.t.size)                  # different output
r_true = a * np.array([np.cos(2*np.pi*grid[-1]/T), np.sin(2*np.pi*grid[-1]/T)])
print(f"{np.linalg.norm(fine.y[:2, -1] - r_true) / 1e3:.0f} km")
# 110 110
# 18 5829
# 1854 km
```

Both runs made exactly $110$ calls to `two_body`. One reported $18$ times, the other $5829$. The last output point is still $1854\,\mathrm{km}$ from the truth. A dense grid of output drew a smooth, detailed picture of the wrong orbit.

::: warning More output is not more accuracy
Asking for output every second, or every millisecond, does not shrink the steps and does not improve a single digit. It only samples the same interpolants more often. Accuracy comes from rtol and atol. If you need the solver to take smaller steps — say, so it cannot jump over a short thruster pulse in the model — the knob for that is **[[max_step|max-step]]**, not `t_eval`.
:::

## dense_output: the whole trajectory, callable later

Sometimes you do not know the times in advance. A navigation filter might need the reference trajectory at the timestamps of measurements that have not been processed yet. You might want to look up the state at a moment you only discover after the run. For that, pass **`dense_output=True`**. The result then has a field **`sol.sol`**: a function you can call with any time, or an array of times, inside the span. It stitches together the per-step interpolants into one continuous trajectory.

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 3.986004418e14
def two_body(t, y, mu):
    r, v = y[:3], y[3:]
    return np.concatenate([v, -mu * r / np.linalg.norm(r)**3])

a = 7.0e6
y0 = np.array([a, 0.0, 0.0, 0.0, np.sqrt(MU / a), 0.0])
T = 2 * np.pi * np.sqrt(a**3 / MU)
n = 2 * np.pi / T                                 # mean motion, rad/s

sol = solve_ivp(two_body, (0.0, T), y0, args=(MU,), method="DOP853",
                rtol=1e-10, atol=np.r_[np.full(3, 1e-3), np.full(3, 1e-6)],
                dense_output=True)
print(sol.t.size - 1, "steps; average step", round(T / (sol.t.size - 1)), "s")

t_any = np.linspace(0.0, T, 10_001)               # 10,001 times, chosen afterward
y_any = sol.sol(t_any)                            # shape (6, 10001)
r_true = a * np.vstack([np.cos(n * t_any), np.sin(n * t_any)])
print(y_any.shape)
print(f"worst error {np.max(np.linalg.norm(y_any[:2] - r_true, axis=0)) * 1e3:.2f} mm")
print(np.round(sol.sol(1234.5)[:2] / 1e3, 3))     # position in km at t = 1234.5 s
# 28 steps; average step 208 s
# (6, 10001)
# worst error 5.73 mm
# [1663.891 6799.373]
```

The solver took $28$ steps of about $208\,\mathrm{s}$ — three and a half minutes each. Yet at $10{,}001$ times spread through the revolution, including the middles of those long steps, the worst position error is $5.73\,\mathrm{mm}$. At the step ends themselves the worst error is about $5.1\,\mathrm{mm}$. So for DOP853, whose interpolant is of order 7, reading between the steps costs almost nothing in accuracy. For RK45 the interpolant is of order 4, still good enough that its error is usually close to the solver's own.

The two options can be used together. `t_eval` fills `sol.t` and `sol.y` at the grid you know now; `dense_output=True` also keeps `sol.sol` for anything you think of later. The cost of dense output is memory: it stores every step's polynomial coefficients. For a million-step run of a large state, that adds up, and `t_eval` alone is the lighter choice.

::: key
t_eval requests output at specified times and does not change the steps taken. dense_output builds a continuous interpolant you can evaluate anywhere afterwards. Neither is a substitute for tolerances: asking for output every second does not improve accuracy.
:::

## Check yourself

::: check
A lunar transfer state has positions up to $3.8 \times 10^8\,\mathrm{m}$ and velocities up to $1.1 \times 10^4\,\mathrm{m/s}$. You pick $\text{rtol} = 10^{-10}$. Use the recipe to choose atol for each block, and say at what size of a component rtol stops being in charge.
:::

::: answer
$\text{atol}_r = 10^{-10} \times 3.8 \times 10^8 = 0.038\,\mathrm{m}$, about $4\,\mathrm{cm}$, for each position component. $\text{atol}_v = 10^{-10} \times 1.1 \times 10^4 = 1.1 \times 10^{-6}\,\mathrm{m/s}$ for each velocity component. (Up to ten times smaller is also fine.)

The changeover is where $\text{atol}_i = \text{rtol} \cdot |y_i|$, so $|y_i| = \text{atol}_i / \text{rtol}$, which is the typical size you started from: $3.8 \times 10^8\,\mathrm{m}$ for positions and $1.1 \times 10^4\,\mathrm{m/s}$ for velocities. Every component smaller than its typical size is held to the typical-size absolute accuracy; bigger ones are held to ten digits.
:::

::: check
A teammate says: "I set `rtol=1e-8`, so my position after a week is good to $10^{-8}$ of $7000\,\mathrm{km}$, which is $7\,\mathrm{cm}$." What is wrong, and how would you find the real accuracy in two runs?
:::

::: answer
rtol limits the estimated error added in each step, not the final error. Over a week there are thousands of steps, and the errors accumulate and are stretched by the orbital dynamics; in the ten-revolution example, `rtol=1e-8` gave a $2\,\mathrm{m}$ miss, about 29 times the per-step allowance, after only $16\,\mathrm{h}$.

To measure it: run again with rtol ten times tighter (and atol scaled the same way), and take the difference between the two final positions. That difference is a good estimate of the error of the first run, as long as `nfev` actually grew between them.
:::

::: check
Why does a single `atol=1.0` wreck the orbit's accuracy even though $1\,\mathrm{m}$ sounds small next to $7000\,\mathrm{km}$?
:::

::: answer
The same atol applies to the velocity components, where its unit is $\mathrm{m/s}$. The allowance for velocity is $\text{atol} + \text{rtol}\cdot|v| = 1 + 10^{-10} \times 7500 \approx 1\,\mathrm{m/s}$, which is over a million times looser than the $7.5 \times 10^{-7}\,\mathrm{m/s}$ that rtol alone asked for. A velocity error of that size turns into a large position error a few minutes later. atol has to be chosen per state, in each state's own units.
:::

::: check
You run a 6-DOF simulation with `t_eval=np.arange(0, 600, 0.001)` because "the autopilot runs at $1\,\mathrm{kHz}$, so the solution must be resolved at $1\,\mathrm{ms}$". What did the setting do, and what did it not do?
:::

::: answer
It made `sol.t` and `sol.y` report $600{,}000$ points, filled in from each accepted step's interpolant. It did not change a single step the solver took, so it did not change the accuracy, and it cost memory and some interpolation time.

If the model really has behavior at the $1\,\mathrm{ms}$ scale that the solver might step over, the tools are tighter tolerances or `max_step`. If the $1\,\mathrm{kHz}$ autopilot updates a command in discrete jumps, that is a different issue — a discontinuity in the model — which later lessons treat by stopping and restarting the solver at each change.
:::

::: check
When would you pick `dense_output=True` over `t_eval`, and what does it cost?
:::

::: answer
Pick `dense_output=True` when you do not know all the times you will need before the run: measurement timestamps arriving later, a search for a moment of interest after the fact, or evaluating the trajectory inside another algorithm. `sol.sol(t)` then gives the state at any time in the span. The cost is memory, since every step's interpolating polynomial is kept. `t_eval` is lighter when you know the times in advance, and you can use both together.
:::

## Summary

| Idea | In one line |
| --- | --- |
| The test | error of component $i$ below $\text{atol}_i + \text{rtol}\cdot\lvert y_i\rvert$, combined in an RMS norm, accept if at most $1$ |
| rtol | significant digits per step for large components |
| atol | floor in each state's own units; decides near zero |
| Changeover | rtol rules above $\lvert y_i\rvert = \text{atol}_i/\text{rtol}$, atol below |
| Recipe | $\text{atol}_i \approx \text{rtol}\times S_i$, with $S_i$ the typical size of state $i$ |
| Defaults | rtol $10^{-3}$, atol $10^{-6}$: an orbit misses by $1854\,\mathrm{km}$ |
| Too-small atol | extra work on values nobody can measure; never atol $= 0$ |
| rtol floor | about $2.2\times10^{-14}$ in SciPy; practical limit $10^{-12}$ to $10^{-13}$ |
| Global error | measure it: rerun with rtol ten times tighter and difference |
| `t_eval` | output at your times; steps and accuracy unchanged |
| `dense_output` | `sol.sol(t)` callable anywhere in the span; costs memory |

The interpolant behind `t_eval` and `dense_output` has one more job. The next lesson uses it to find the exact moment something happens — an apogee, a touchdown, a crossing of a fixed altitude — to the solver's accuracy, even inside a step that lasted minutes.

::: context rms-norm How the components are combined
After a step, each component has a ratio $e_i / \text{scale}_i$. SciPy combines them with a root-mean-square (DOP853 uses a close variant of it):

$$
\lVert e \rVert = \sqrt{\frac{1}{n} \sum_{i=1}^{n} \left(\frac{e_i}{\text{scale}_i}\right)^2}.
$$

Square each ratio, average them, take the square root. Because of the averaging, one component can be a little over its allowance if the others are well under. That is a deliberate, mild looseness. If you need every single component held strictly, set its tolerance a bit tighter than the requirement.
:::

::: context significant-digits Reading rtol as digits
A relative tolerance of $10^{-k}$ means "errors of about one unit in the $k$-th significant digit". The number $7{,}000{,}000.000\,\mathrm{m}$ held to $\text{rtol} = 10^{-9}$ may wobble by about $0.007\,\mathrm{m}$: the first nine digits, $7000000.00$, are protected. So a quick way to set rtol is to count how many digits of the answer you need, then add two or three for the growth from local to global error.
:::

::: context allowance-picture The allowance on log-log axes
The allowance $\text{atol} + \text{rtol}\cdot|y|$ is flat at atol for small $|y|$ and becomes a straight line of slope one for large $|y|$, meeting at $|y| = \text{atol}/\text{rtol}$. Here, rtol $= 10^{-9}$ and atol $= 10^{-3}$, so the knee is at $10^6$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="160" x2="340" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="195" y="192" font-size="12" text-anchor="middle" fill="#1f2a44">size of the component |y| (log)</text>
  <text x="16" y="90" font-size="12" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 16 90)">allowance (log)</text>
  <text x="50" y="175" font-size="11" text-anchor="middle" fill="#6c7a93">1</text>
  <text x="195" y="175" font-size="11" text-anchor="middle" fill="#6c7a93">10⁶</text>
  <text x="336" y="175" font-size="11" text-anchor="middle" fill="#6c7a93">10¹²</text>
  <line x1="50" y1="130" x2="195" y2="130" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="195" y1="130" x2="285" y2="40" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="135" y1="190" x2="195" y2="130" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="195" cy="130" r="4" fill="#b4232c"/>
  <text x="200" y="148" font-size="11" fill="#b4232c">knee: atol / rtol</text>
  <text x="70" y="122" font-size="11" fill="#1d6fd1">atol floor rules</text>
  <text x="150" y="70" font-size="11" fill="#1d6fd1">rtol · |y| rules</text>
</svg>
```

The dashed line is what rtol alone would allow: it keeps falling toward zero, which is why a floor is needed.
:::

::: context machine-epsilon Sixteen digits and no more
A Python float is a 64-bit number with 53 binary digits of precision, about 16 decimal digits. The gap between $1$ and the next representable number is $2^{-52} \approx 2.2 \times 10^{-16}$, called machine epsilon. Every arithmetic operation can be off by about that much, relative. A step's truncation error can be pushed far below this, but the rounding in each of its dozen stages cannot, and over many steps the rounding piles up. That is why tightening rtol past about $10^{-12}$ stops helping and eventually hurts.
:::

::: context tolerance-proportionality Why rerunning works
A solver has tolerance proportionality when its global error follows a smooth law like $C \cdot \text{rtol}^{\,\alpha}$, with $\alpha$ (read "alpha") around one or a little more. Then tightening rtol by ten cuts the error by roughly ten or more, so the tighter run is much closer to the truth than the looser one, and their difference is mostly the looser run's error. In the ten-revolution example each factor of ten cut the error by a factor between about $6$ and $46$. Lesson 8 adds a second, independent check: the orbit's energy, which the true motion conserves exactly.
:::

::: context interpolant-inside A polynomial through each step
When a Runge–Kutta step is accepted, its stages already sample the slope at several points inside the step. With a few extra weights (and, for DOP853, a few extra evaluations), they define a polynomial that matches the solution across the whole step, not only at its end. Chained together, these give a continuous curve.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <path d="M30,110 C90,40 150,30 210,55 S300,120 335,90" fill="none" stroke="#8fb8f0" stroke-width="3"/>
  <circle cx="30" cy="110" r="5" fill="#1d6fd1"/>
  <circle cx="129" cy="44.8" r="5" fill="#1d6fd1"/>
  <circle cx="256.8" cy="79.3" r="5" fill="#1d6fd1"/>
  <circle cx="335" cy="90" r="5" fill="#1d6fd1"/>
  <line x1="210" y1="20" x2="210" y2="120" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="210" cy="55" r="4" fill="#b4232c"/>
  <text x="216" y="30" font-size="11" fill="#b4232c">t_eval point</text>
  <text x="30" y="132" font-size="11" fill="#1d6fd1">dots: accepted steps</text>
  <text x="210" y="132" font-size="11" fill="#6c7a93">line: interpolant</text>
</svg>
```

A `t_eval` point between two dots is read off the line. No new step is taken to get it.
:::

::: context max-step The knob that does change the steps
`max_step` caps how long any step may be, in seconds. The solver still adapts below the cap. Use it when the model has something brief that the error estimate cannot see coming: a thruster pulse of $50\,\mathrm{ms}$ inside a coast, or a gust applied for a moment. A step that jumps clean over the pulse never samples it, estimates no error, and happily leaves it out. A cap shorter than the pulse forces the solver to land inside it. It costs steps everywhere, though, so the better fix for a scheduled event is to stop and restart the solver at it, as a later lesson shows.
:::
