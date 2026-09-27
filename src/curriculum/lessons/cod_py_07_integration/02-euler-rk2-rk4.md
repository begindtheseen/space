---
id: l02-euler-rk2-rk4
title: Euler, RK2 and RK4 by hand, and how to prove their order
minutes: 17
covers:
  - Euler, RK2, classic RK4 implemented by hand; order verification by step halving
---

Say you are guessing how far a car will go in the next hour. The lazy guess: look at the speedometer now, see $60\,\mathrm{km/h}$, and say $60\,\mathrm{km}$. But the road ahead climbs a long hill, and the car will slow down. A smarter guess: imagine the car at the half-hour mark, estimate its speed *there*, and use that speed for the whole hour. The smartest guess: peek at the speed at several points along the way — start, middle, end — and blend them into one careful average.

Those three guesses are the three methods in this lesson. The lazy one is **Euler's method**, which you met last lesson. The half-way one is **RK2**, the midpoint method. The careful blend is the **classic fourth-order [[Runge-Kutta|runge-kutta-history]] method**, RK4 — for decades the workhorse of flight simulation, and still the method inside many real-time simulators and flight computers today.

You will write all three in Python from scratch. Then you will learn the most useful testing trick in numerical work: **step halving**, a way to *prove* with numbers that your code has the order it claims. A wrong coefficient in RK4 does not crash. It quietly produces an answer that looks fine and is far less accurate than it should be. Step halving catches it.

## One interface for every method

Every method in this module does the same job: given $f$, the current time $t$, the current state $\mathbf{y}$ and a step $h$, return the state at $t + h$. So give every method the same Python signature, `step(f, t, y, h)`. Then one loop can drive any of them.

The loop takes exactly $n$ equal steps from $t_0$ to $t_1$. The step is $h = (t_1 - t_0)/n$. It stores every snapshot in an array with one row per time, so the result has $n + 1$ rows (the start plus $n$ steps) and one column per state entry.

```python
import numpy as np

def euler_step(f, t, y, h):
    return y + h * np.asarray(f(t, y))

def integrate(step, f, y0, t0, t1, n):
    """n equal steps of `step` from t0 to t1. Returns ts (n+1,) and ys (n+1, len(y0))."""
    y0 = np.atleast_1d(np.asarray(y0, dtype=float))
    h = (t1 - t0) / n
    ts = t0 + h * np.arange(n + 1)
    ys = np.empty((n + 1, y0.size))
    ys[0] = y0
    for i in range(n):
        ys[i + 1] = step(f, ts[i], ys[i], h)
    return ts, ys

decay = lambda t, y: -2.0 * y
ts, ys = integrate(euler_step, decay, [1.0], 0.0, 2.0, 20)
print(ts.shape, ys.shape, round(ts[-1], 12), round(ys[-1, 0], 6))
# (21,) (21, 1) 2.0 0.011529
```

A few details matter here, and they are worth copying into every integrator you write:

- `np.atleast_1d` turns a plain number or list into a 1-D array, so a one-number state and a six-number state go through the same code.
- The times are built as `t0 + h * np.arange(n + 1)`, not by adding `h` over and over. Adding a rounded `h` a thousand times piles up round-off, and the last time can miss `t1` by a hair.
- `ys[0]` holds the start, so `ys[-1]` (the last row) is the state at `t1`.

## RK2: use the slope at the middle

Euler's weakness is that it uses the slope at the start of the step for the whole step. A better slope to use is the one at the *middle* of the step. The trouble is that we do not know the state at the middle yet. So we estimate it with a half-size Euler step, then ask $f$ for the slope there.

Each slope we compute along the way is called a **stage**, written $k_1, k_2, \dots$ and read "k one, k two". Each stage costs one call to $f$, which is usually the expensive part.

$$
\begin{aligned}
k_1 &= f(t_n,\ \mathbf{y}_n) \\
k_2 &= f\!\left(t_n + \tfrac{h}{2},\ \mathbf{y}_n + \tfrac{h}{2} k_1\right) \\
\mathbf{y}_{n+1} &= \mathbf{y}_n + h\, k_2
\end{aligned}
$$

In words: take the slope now ($k_1$). Use it to walk half a step and guess the midpoint. Take the slope at that midpoint ($k_2$). Then go back to the start and take the *whole* step with the midpoint slope.

This is the **midpoint method**, the simplest member of the RK2 family — Runge-Kutta methods of order 2. It uses two stages per step, so it costs twice as much per step as Euler. In return its local error is $O(h^3)$ and its global error is $O(h^2)$.

```python
def rk2_step(f, t, y, h):
    k1 = np.asarray(f(t, y))
    k2 = np.asarray(f(t + 0.5 * h, y + 0.5 * h * k1))
    return y + h * k2
```

::: note Why it has to be true
Take a scalar $y$ to keep the writing short. Expand the true solution one step ahead with Taylor's series: $y(t+h) = y + h\dot{y} + \frac{h^2}{2}\ddot{y} + O(h^3)$. By the chain rule, $\ddot{y} = f_t + f_y f$, where $f_t$ and $f_y$ are how fast $f$ changes with $t$ and with $y$.

Now expand the midpoint stage for small $h$:

$$
k_2 = f\!\left(t + \tfrac{h}{2},\ y + \tfrac{h}{2} f\right) = f + \tfrac{h}{2} f_t + \tfrac{h}{2} f_y f + O(h^2).
$$

So $y + h k_2 = y + h f + \frac{h^2}{2}(f_t + f_y f) + O(h^3)$. That matches the true expansion through the $h^2$ term. The first mismatch is at $h^3$, so the local error is $O(h^3)$ and, by last lesson's counting argument, the global error is $O(h^2)$. Notice the $f_t$ term: it only comes out right because the stage is evaluated at $t + \frac{h}{2}$, not at $t$.
:::

## Classic RK4: four slopes, blended

RK4 pushes the same idea further. It samples the slope four times: once at the start, twice at the middle, once at the end. Then it takes a weighted average, counting the two middle slopes double.

$$
\begin{aligned}
k_1 &= f(t_n,\ \mathbf{y}_n) \\
k_2 &= f\!\left(t_n + \tfrac{h}{2},\ \mathbf{y}_n + \tfrac{h}{2} k_1\right) \\
k_3 &= f\!\left(t_n + \tfrac{h}{2},\ \mathbf{y}_n + \tfrac{h}{2} k_2\right) \\
k_4 &= f\!\left(t_n + h,\ \mathbf{y}_n + h\, k_3\right) \\
\mathbf{y}_{n+1} &= \mathbf{y}_n + \frac{h}{6}\left(k_1 + 2k_2 + 2k_3 + k_4\right)
\end{aligned}
$$

Read the pattern slowly, because every detail is load-bearing. Engineers often pack these numbers into [[a small table of coefficients|butcher-tableau]]:

1. $k_1$ is the slope at the start.
2. $k_2$ is the slope at the midpoint, reached by half a step along $k_1$.
3. $k_3$ is the slope at the midpoint *again*, but reached by half a step along $k_2$ — a better guess of the midpoint.
4. $k_4$ is the slope at the end, reached by a *full* step along $k_3$.
5. The weights $1, 2, 2, 1$ add to $6$, so dividing by $6$ makes a proper average.

The stage times are $t_n$, $t_n + \frac{h}{2}$, $t_n + \frac{h}{2}$, $t_n + h$. The weights $\frac{1}{6}, \frac{2}{6}, \frac{2}{6}, \frac{1}{6}$ are the same as [[Simpson's rule|simpsons-rule]] for areas, which is no accident. Four stages per step buy a local error of $O(h^5)$ and a global error of $O(h^4)$.

```python
def rk4_step(f, t, y, h):
    k1 = np.asarray(f(t, y))
    k2 = np.asarray(f(t + 0.5 * h, y + 0.5 * h * k1))
    k3 = np.asarray(f(t + 0.5 * h, y + 0.5 * h * k2))
    k4 = np.asarray(f(t + h, y + h * k3))
    return y + (h / 6.0) * (k1 + 2.0 * k2 + 2.0 * k3 + k4)

y0 = np.array([1.0])
for step in [euler_step, rk2_step, rk4_step]:
    print(step.__name__, np.round(step(decay, 0.0, y0, 0.1), 7))
print("exact", round(np.exp(-0.2), 7))
# euler_step [0.8]
# rk2_step [0.82]
# rk4_step [0.8187333]
# exact 0.8187308
```

The `np.asarray` around each call to `f` lets `f` return a plain list and still work in the arithmetic.

::: example One RK4 step by hand
Take one RK4 step of $h = 0.1$ on $\dot{y} = -2y$ from $y_0 = 1$. The rule is "slope $= -2 \times$ the state you feed in".

**Stage 1.** Slope at the start: $k_1 = -2 \times 1 = -2$.

**Stage 2.** Half step along $k_1$: $1 + 0.05 \times (-2) = 0.9$. Slope there: $k_2 = -2 \times 0.9 = -1.8$.

**Stage 3.** Half step along $k_2$: $1 + 0.05 \times (-1.8) = 0.91$. Slope there: $k_3 = -2 \times 0.91 = -1.82$.

**Stage 4.** Full step along $k_3$: $1 + 0.1 \times (-1.82) = 0.818$. Slope there: $k_4 = -2 \times 0.818 = -1.636$.

**Blend.** Weighted sum: $-2 + 2(-1.8) + 2(-1.82) + (-1.636) = -10.876$. Multiply by $\frac{h}{6} = \frac{0.1}{6}$ to get about $-0.181267$. So $y_1 \approx 0.818733$.

**Check.** The exact value is $e^{-0.2} \approx 0.818731$. RK4 is off by about $2.6 \times 10^{-6}$ after one step. Euler (0.8) was off by $0.019$ and RK2 (0.82) by $0.0013$. Each method costs more per step, but the accuracy improves much faster than the cost.
:::

::: key
Classic RK4: $k_1 = f(t, \mathbf{y})$, $k_2 = f(t + \frac{h}{2}, \mathbf{y} + \frac{h}{2}k_1)$, $k_3 = f(t + \frac{h}{2}, \mathbf{y} + \frac{h}{2}k_2)$, $k_4 = f(t + h, \mathbf{y} + h k_3)$, and $\mathbf{y}_{n+1} = \mathbf{y}_n + \frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$. Four function evaluations per step; local error $O(h^5)$, global error $O(h^4)$.
:::

## Order verification by step halving

You have written RK4. How do you know it is RK4? It runs. It gives numbers close to the truth. But a wrong coefficient can give numbers that are close to the truth too — only not close *enough*. The test is to check how the error **scales**.

Last lesson showed that a method of order $p$ has global error about $C h^p$. Run the same problem twice, once with step $h$ and once with step $h/2$. The ratio of the two errors is

$$
\frac{C h^p}{C (h/2)^p} = 2^p.
$$

The unknown constant $C$ cancels. So the ratio tells you the order directly: about $2$ for Euler, $4$ for RK2, $16$ for RK4. To turn a measured ratio into an order, take the [[base-2 logarithm|log-two]]: $p \approx \log_2(\text{ratio})$.

This needs a problem with a known exact answer, so the error can be measured. $\dot{y} = -2y$ with its exact $e^{-2t}$ is the classic choice.

```python
exact = np.exp(-4.0)                 # y(2) for y' = -2y, y(0) = 1
for step in [euler_step, rk2_step, rk4_step]:
    errs = [abs(integrate(step, decay, [1.0], 0.0, 2.0, n)[1][-1, 0] - exact)
            for n in [20, 40, 80, 160]]
    ratios = [round(float(errs[i] / errs[i + 1]), 2) for i in range(3)]
    print(step.__name__, ratios)
# euler_step [1.92, 1.96, 1.98]
# rk2_step [4.36, 4.16, 4.08]
# rk4_step [17.4, 16.68, 16.34]
```

Plotted on [[log-log axes|log-log-plot]], each method is a straight line whose slope is its order. Read the output. Each ratio creeps toward its target as $h$ shrinks: $2$, $4$ and $16$. The ratios are not exact at first because $C h^p$ is only the *leading* term of the error. Smaller terms like $h^{p+1}$ still matter at large $h$ and fade as $h$ shrinks. The measured orders are $\log_2 1.98 \approx 0.99$, $\log_2 4.08 \approx 2.03$ and $\log_2 16.34 \approx 4.03$.

::: key How to verify an integrator order
Integrate a problem with a known solution at step $h$ and $h/2$ and take the ratio of the errors. The ratio should approach $2^p$: 4 for RK2, 16 for RK4. If it does not, a coefficient is wrong or you are already at round-off.
:::

::: example RK4 around a real orbit
A satellite on a circular orbit of radius $7000\,\mathrm{km}$ comes back to its starting point after one period, $T = 2\pi\sqrt{a^3/\mu} \approx 5829\,\mathrm{s}$ (about $97$ minutes). The exact answer after one period is "where you started", so the distance between the start and the computed end — the **closure error** — measures the integrator's error.

```python
MU = 3.986004418e14
def two_body_2d(t, y):                        # y = [x, y, vx, vy]
    r = y[:2]
    return np.concatenate([y[2:], -MU * r / np.linalg.norm(r)**3])

a = 7.0e6
y0 = [a, 0.0, 0.0, np.sqrt(MU / a)]
T = 2 * np.pi * np.sqrt(a**3 / MU)
for n in [100, 200, 400]:
    ys = integrate(rk4_step, two_body_2d, y0, 0.0, T, n)[1]
    print(n, round(T / n, 1), round(np.linalg.norm(ys[-1, :2] - y0[:2]), 3))
# 100 58.3 21.337
# 200 29.1 1.158
# 400 14.6 0.067
```

**Read the result.** With 100 steps of about $58\,\mathrm{s}$ the satellite misses its start by $21.3\,\mathrm{m}$. With 200 steps, $1.16\,\mathrm{m}$. With 400 steps, $6.7\,\mathrm{cm}$.

**Check the order.** The ratios are $21.337 / 1.158 \approx 18.4$ and $1.158 / 0.067 \approx 17.3$, heading down toward $16$. Fourth order, as promised.

**Compare the same work.** 100 RK4 steps cost 400 calls to $f$. Spending the same 400 calls on 400 Euler steps misses by about $5744\,\mathrm{km}$ — nearly the whole orbit radius. Spending them on 200 RK2 steps misses by about $26\,\mathrm{km}$. RK4 misses by $21\,\mathrm{m}$. Higher order is the cheapest accuracy there is.
:::

## When the halving test lies to you

The step-halving test is powerful, but it has two blind spots. Knowing them is what makes it trustworthy.

### Blind spot 1: round-off

Keep halving the step and the error eventually stops falling. At that point you are measuring round-off, not truncation. Here is RK4 on a different test problem, $\dot{y} = y\cos t$ with $y(0) = 1$. Its exact solution is $y = e^{\sin t}$.

| steps $n$ | error at $t = 2$ | ratio to previous |
| --- | --- | --- |
| 200 | 1.03e-10 | — |
| 400 | 6.40e-12 | 16.0 |
| 800 | 4.00e-13 | 16.0 |
| 1600 | 2.13e-14 | 18.8 |
| 3200 | 1.02e-14 | 2.1 |
| 6400 | 6.22e-15 | 1.6 |
| 12800 | 1.15e-14 | 0.5 |

Down to $n = 800$ the ratio is a perfect $16$. Then the error hits a floor of about $10^{-14}$, where the state (about $2.5$) is only a few dozen $2.2 \times 10^{-16}$ roundings wide. From there the ratio wanders and even drops below $1$: more steps make it worse. A ratio near $1$ with a tiny error does not mean your code is broken. It means pick a larger $h$ for the test.

### Blind spot 2: a test problem too simple to see the bug

The decay equation $\dot{y} = -2y$ never looks at $t$. So if your code evaluates a stage at the wrong *time*, the decay test cannot notice. Suppose you wrote `f(t, ...)` where RK4 needs `f(t + 0.5 * h, ...)` in stages 2 and 3. On the decay problem the ratios are still a clean $17.4$ and $16.7$ — it looks perfect. On $\dot{y} = y\cos t$, which does depend on $t$, the ratios fall to $2.01$ and $2.00$: the method has collapsed to first order.

Other bugs are visible on any problem. Feed $k_1$ instead of $k_2$ into stage 3, for example, and the ratios drop to about $4.2$ on both problems. A classic RK4 bug almost never shows up as a crash or a wild answer. It shows up as the *wrong ratio*.

::: warning Test with a problem that uses every input
Always verify order on a test problem whose right-hand side depends on **both** $t$ and $\mathbf{y}$, such as $\dot{y} = y\cos t$ (exact $e^{\sin t}$). And look at the ratio, not at whether the answer "looks close": a broken RK4 [[still converges|consistency]] and still beats Euler, so closeness proves nothing.
:::

::: warning Keep the test in the asymptotic range
Choose step sizes where the error is well above round-off (say $10^{-6}$ to $10^{-12}$ for RK4 in double precision) and well below "the method is not even resolving the problem". Too large an $h$ and higher-order terms blur the ratio. Too small and round-off flattens it. Two or three halvings in the middle give the cleanest reading.
:::

## Which one would you fly?

Euler is almost never used for serious propagation. It is still worth knowing, because it is the building block of everything else and the easiest to reason about.

RK2 shows up where each evaluation of $f$ is very expensive and modest accuracy is fine.

RK4 is the fixed-step standard. It is simple enough to write from memory, it needs no memory of past steps, it can start from any state, and it is accurate enough for most real-time simulation. Many **[[hardware-in-the-loop|hardware-in-the-loop]]** simulators and flight computers run a fixed-step RK4 — a topic the last lesson of this module returns to.

What none of these three can do is *tell you* how big its error is while it runs. You chose $h$ and hoped. The next lesson fixes that by running two methods at once and comparing them.

## Check yourself

::: check
Write out the stage times, in units of $h$ after $t_n$, for Euler, the midpoint RK2 and classic RK4. How many calls to $f$ does each make per step?
:::

::: answer
Euler: one stage at $t_n$ — one call. Midpoint RK2: stages at $t_n$ and $t_n + \frac{h}{2}$ — two calls. RK4: stages at $t_n$, $t_n + \frac{h}{2}$, $t_n + \frac{h}{2}$ and $t_n + h$ — four calls. The middle time appears twice in RK4 because $k_2$ and $k_3$ are both midpoint slopes, reached in two different ways.
:::

::: check
Your new third-order method gives errors of $4.0 \times 10^{-5}$ with $n = 50$ steps and $5.2 \times 10^{-6}$ with $n = 100$. What order do you measure? Is that consistent with third order?
:::

::: answer
The ratio is $4.0 \times 10^{-5} / 5.2 \times 10^{-6} \approx 7.7$. Then $p \approx \log_2 7.7 \approx 2.94$. A third-order method should give $2^3 = 8$, so $7.7$ is consistent: a ratio a little off the target at coarse steps is normal. Halve once more to confirm it keeps approaching $8$.
:::

::: check
In the orbit example, predict the closure error with 800 RK4 steps from the 400-step value of $0.067\,\mathrm{m}$.
:::

::: answer
Fourth order: halving $h$ divides the error by about $2^4 = 16$. So expect about $0.067 / 16 \approx 0.0042\,\mathrm{m}$, roughly $4\,\mathrm{mm}$. The measured ratios were still slightly above $16$ (17.3 at the last halving), so the true value might be a bit smaller.
:::

::: check
A teammate writes the RK4 update as `y + h * (k1 + k2 + k3 + k4) / 4`. Their code runs and on the decay test gives answers within $10^{-4}$ of the truth. Why is that not reassuring, and what would step halving show?
:::

::: answer
Equal weights are not the RK4 weights $1, 2, 2, 1$ over $6$. Many wrong formulas are still consistent (the weights add to $1$), so they converge and look "close" — even Euler is within $10^{-2}$ here. Closeness says nothing about order. Step halving on this formula gives ratios near $3.9$ to $4$, not $16$: it is behaving as a second-order method. The fix is the correct weights $\frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$.
:::

::: check
You need the error at $t = 2$ on the decay problem below $10^{-9}$. From the table in this lesson (RK4 errors $1.154 \times 10^{-6}$, $6.636 \times 10^{-8}$, $3.978 \times 10^{-9}$, $2.435 \times 10^{-10}$ at $n = 20, 40, 80, 160$), what is the smallest of those $n$ that works, and how many calls to $f$ does it cost?
:::

::: answer
$n = 80$ gives $3.978 \times 10^{-9}$, which is above $10^{-9}$. $n = 160$ gives $2.435 \times 10^{-10}$, which is below. So $n = 160$, at $4$ calls per step: $640$ calls. Euler, at order 1, would need its $9.1 \times 10^{-4}$ error (at $n = 160$) cut by a factor of about $10^6$, which means about a million times more steps.
:::

## Summary

| Method | Stages (calls to $f$) | Local error | Global error | Halving ratio |
| --- | --- | --- | --- | --- |
| Euler | 1 | $O(h^2)$ | $O(h)$ | about 2 |
| Midpoint RK2 | 2 | $O(h^3)$ | $O(h^2)$ | about 4 |
| Classic RK4 | 4 | $O(h^5)$ | $O(h^4)$ | about 16 |

| Idea | Fact |
| --- | --- |
| RK4 weights | $\frac{h}{6}(k_1 + 2k_2 + 2k_3 + k_4)$; stage times $0, \frac{h}{2}, \frac{h}{2}, h$ |
| Measured order | $p \approx \log_2(e_h / e_{h/2})$ |
| Round-off floor | ratio collapses toward 1 when the error nears about $10^{-14}$ |
| Good test problem | uses both $t$ and $y$, has an exact solution, e.g. $\dot{y} = y\cos t$ |

Next lesson runs two methods of different order side by side inside one step, uses their difference to estimate the error as it goes, and lets the integrator choose its own step size.

::: context runge-kutta-history Two German mathematicians, six years apart
Carl Runge published the first methods of this kind in 1895, while studying how to solve differential equations more accurately than Euler. Martin Kutta extended the idea in 1901 and gave the four-stage method that is now called classic RK4. The family has kept their joint name ever since: any method that samples the slope at several points inside one step and blends the results is a Runge-Kutta method.
:::

::: context butcher-tableau The Butcher tableau
Every Runge-Kutta method is fixed by three sets of numbers: the stage times $c_i$ (as fractions of $h$), how much of each earlier stage goes into each new stage $a_{ij}$, and the final weights $b_i$. The New Zealand mathematician John Butcher arranged them in a grid now called a Butcher tableau. For classic RK4 the times are $0, \frac{1}{2}, \frac{1}{2}, 1$, the stage recipes are $a_{21} = \frac{1}{2}$, $a_{32} = \frac{1}{2}$, $a_{43} = 1$ (all others zero), and the weights are $\frac{1}{6}, \frac{1}{3}, \frac{1}{3}, \frac{1}{6}$. SciPy's solvers store their methods exactly this way, as arrays named `C`, `A` and `B`.
:::

::: context simpsons-rule The same weights as Simpson's rule
If $f$ depends only on $t$, the ODE is really an area problem: $y(t + h) - y(t)$ is the area under $f$ over the step. RK4 then collapses to Simpson's rule, which estimates that area from the curve's height at the start, middle and end with weights $1, 4, 1$ over $6$. RK4's two middle slopes, each weighted $2$, add up to that middle $4$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="140" x2="320" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <path d="M60,140 L60,90 Q180,20 300,70 L300,140 Z" fill="#8fb8f0" stroke="none"/>
  <path d="M60,90 Q180,20 300,70" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="60" y1="90" x2="60" y2="140" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="50" x2="180" y2="140" stroke="#b4232c" stroke-width="3"/>
  <line x1="300" y1="70" x2="300" y2="140" stroke="#1d6fd1" stroke-width="2"/>
  <text x="60" y="158" font-size="12" text-anchor="middle" fill="#1f2a44">start ×1</text>
  <text x="180" y="158" font-size="12" text-anchor="middle" fill="#b4232c">middle ×4</text>
  <text x="300" y="158" font-size="12" text-anchor="middle" fill="#1f2a44">end ×1</text>
</svg>
```

Simpson's rule is exact for any cubic curve, which is another way to see RK4's accuracy.
:::

::: context log-two Reading an order from a ratio
The base-2 logarithm, $\log_2 x$, answers "2 to what power gives $x$?". So $\log_2 16 = 4$ because $2^4 = 16$, and $\log_2 8 = 3$. A ratio of $16.34$ is a little more than $2^4$, so $\log_2 16.34 \approx 4.03$. In Python it is `np.log2(16.34)`. If you halved by some other factor, say you divided $h$ by $r$, the order would be $\log(\text{ratio}) / \log r$.
:::

::: context log-log-plot Why the error lines are straight
If the error is $C h^p$, then $\log(\text{error}) = \log C + p \log h$. On a plot with logarithmic axes that is a straight line of slope $p$. Steeper lines win faster as $h$ shrinks.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="195" x2="320" y2="195" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="195" x2="50" y2="20" stroke="#6c7a93" stroke-width="1"/>
  <text x="185" y="211" font-size="12" text-anchor="middle" fill="#1f2a44">step size h (log) →</text>
  <text x="40" y="100" font-size="12" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 40 100)">error (log)</text>
  <line x1="60" y1="70" x2="300" y2="40" stroke="#6c7a93" stroke-width="2.5"/>
  <line x1="60" y1="115" x2="300" y2="55" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="60" y1="190" x2="300" y2="70" stroke="#b4232c" stroke-width="2.5"/>
  <text x="306" y="38" font-size="12" fill="#6c7a93">Euler, 1</text>
  <text x="306" y="58" font-size="12" fill="#1d6fd1">RK2, 2</text>
  <text x="306" y="78" font-size="12" fill="#b4232c">RK4, 4</text>
</svg>
```

The numbers after each name are the slopes: over the same stretch of $h$, the RK4 line drops four times as far as Euler's.
:::

::: context consistency Why a wrong formula still converges
A step formula is called consistent when it gets the first-order term right: its weights add up to $1$, so for tiny steps it moves along the true slope. Any consistent, stable method converges to the right answer as $h \to 0$ — only more slowly if its order is low. That is why a mis-coded RK4 is so sneaky. It is usually still consistent, so it gives answers near the truth and passes a quick eyeball check. Only the scaling of the error reveals that it has quietly become a first- or second-order method.
:::

::: context hardware-in-the-loop Testing real flight hardware against a simulator
In a hardware-in-the-loop (HIL) test, the real flight computer runs its real software, but its sensors and actuators are wired to a simulator instead of to a rocket. The simulator computes how the vehicle would move and feeds back fake sensor readings, in real time, many hundreds of times a second. Because the simulator must keep pace with a real clock, it cannot afford steps of unpredictable size, which is why a fixed-step method such as RK4 is common there.
:::
