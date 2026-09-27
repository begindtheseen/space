---
id: l03-adaptive-step-size
title: Embedded pairs and step sizes that choose themselves
minutes: 19
covers:
  - Embedded pairs and adaptive step size control
---

Think about how you drive on a twisty mountain road that ends in a long, straight highway. On the hairpin bends you slow right down. On the straight you speed up, because nothing much changes from one second to the next. Nobody sets one speed for the whole trip. You look at the road and adjust.

The fixed-step methods of the last lesson drive at one speed the whole way. That is a real problem in spaceflight. A satellite on a stretched, oval orbit races through its closest point to Earth, called **perigee**, and crawls through its farthest point, called **apogee**. Near perigee everything changes fast and needs tiny steps. Near apogee the same tiny steps are a waste of computer time. A fixed step must be small enough for the worst moment of the whole trip, and so it wastes effort everywhere else.

This lesson teaches the integrator to look at the road. The trick is an **embedded pair**: two methods of different accuracy computed together in one step, sharing their work, so that their difference tells you how big the error is right now. With that estimate, the integrator can throw away steps that were too sloppy and pick the size of the next step on its own. That is **adaptive step size control**, and it is what SciPy's `solve_ivp` does every time you call it.

## How can a step measure its own error?

Here is the puzzle. The error of a step is the gap between the computed answer and the true answer. But if you knew the true answer, you would not need the integrator. So how can a step know how wrong it is?

Think of two friends estimating the height of a tree. One is careless and one is careful. You do not know the true height, but if their answers differ by $3\,\mathrm{m}$, you know the careless one is off by roughly $3\,\mathrm{m}$. The careful one is so much closer to the truth that the gap between them is almost all the careless one's mistake.

The same works for step methods. Take one step two ways: with a method of order $q$ (careless) and with a method of order $q + 1$ or higher (careful). Their local errors are about $C h^{q+1}$ and something much smaller. So

$$
\text{estimated error} = \mathbf{y}_{\text{high}} - \mathbf{y}_{\text{low}} \approx \text{local error of the low-order answer}.
$$

That difference is the **error estimate**. It costs no knowledge of the true solution, only a second answer.

## Embedded pairs: the second answer almost for free

Computing two completely separate methods would double the cost. The clever part is to design the two methods so they use the *same* stages $k_1, k_2, \dots$ and only blend them with different weights. A pair of Runge-Kutta methods that share their stages like this is an **embedded pair**. The second answer then costs only a few multiplications and additions, and no extra calls to $f$.

The smallest example pairs Euler (order 1) with **Heun's method** (order 2). Heun's method takes an Euler step to guess the end of the step, measures the slope there, and averages the start and end slopes:

$$
\begin{aligned}
k_1 &= f(t_n,\ \mathbf{y}_n) \\
k_2 &= f(t_n + h,\ \mathbf{y}_n + h\,k_1) \\
\mathbf{y}_{\text{low}} &= \mathbf{y}_n + h\,k_1 &&\text{(Euler, order 1)} \\
\mathbf{y}_{\text{high}} &= \mathbf{y}_n + \tfrac{h}{2}(k_1 + k_2) &&\text{(Heun, order 2)}
\end{aligned}
$$

Both answers use only $k_1$ and $k_2$: two calls to $f$ per step, the same as Heun alone. The Euler answer rides along for free.

Pairs are named by their two orders. This one is a **2(1) pair**, read "two-one": order 2 for the answer, order 1 for the partner used in the error estimate. SciPy's workhorse `RK45` is the **[[Dormand-Prince|dormand-prince]]** 5(4) pair, and `RK23` is the Bogacki-Shampine 3(2) pair. The high-accuracy `DOP853` is an eighth-order method with its own built-in error estimators. You will meet all of them properly next lesson.

::: example Estimating the error of one step
Take one Heun-Euler step of $h = 0.1$ on $\dot{y} = -2y$ from $y_0 = 1$.

**Stage 1.** $k_1 = -2 \times 1 = -2$.

**Euler answer.** $y_{\text{low}} = 1 + 0.1 \times (-2) = 0.8$.

**Stage 2.** The slope at the Euler guess: $k_2 = -2 \times 0.8 = -1.6$.

**Heun answer.** $y_{\text{high}} = 1 + 0.05 \times (-2 - 1.6) = 1 - 0.18 = 0.82$.

**Error estimate.** $y_{\text{high}} - y_{\text{low}} = 0.82 - 0.8 = 0.02$.

**Check against the truth.** The exact value is $e^{-0.2} \approx 0.818731$. Euler's true error is $0.818731 - 0.8 \approx 0.0187$. The estimate $0.02$ is within about $7\%$ of it, and we got it without ever knowing the exact answer.
:::

::: key Embedded pair
An embedded pair computes two answers of different orders from the **same** stages. Their difference estimates the local error of the lower-order answer, at almost no extra cost. A $p(q)$ pair has order $p$ for the main answer and order $q$ for the partner.
:::

## Which answer do you keep?

The estimate measures the error of the *lower*-order answer. But you also have the higher-order answer in your hand, and it is better. Almost every modern solver keeps the better one and moves on from there. This is called **local extrapolation** — advancing with the higher-order solution while using the lower-order one only for the error estimate.

So `RK45` actually advances with a fifth-order answer and uses the fourth-order partner only to judge the step. The consequence is pleasant: the error you *actually* commit is usually much smaller than the estimate. The estimate is a cautious upper guess.

The Dormand-Prince pair adds one more trick. Its last stage is evaluated at the new point, $f(t_{n+1}, \mathbf{y}_{n+1})$, which is exactly the first stage the *next* step needs. So it is reused, not recomputed. This is called **[[FSAL|fsal]]**, "first same as last". The pair has seven stages but costs only six new calls to $f$ per accepted step.

## Accept or reject a step

Now the integrator has an error estimate for each step. It needs a rule for "good enough". You give it a **tolerance**: the largest local error you are willing to accept in one step.

A single number is not enough for a real state vector. A position of $7 \times 10^6\,\mathrm{m}$ and a velocity of $7.5 \times 10^3\,\mathrm{m/s}$ need different allowances, and a quantity passing through zero needs a floor. So the solver builds an allowance for each component $i$ of the state:

$$
\text{scale}_i = \text{atol}_i + \text{rtol} \cdot |y_i|.
$$

Here **rtol** is the **relative tolerance** — the allowed error as a fraction of the component's size — and **atol** is the **absolute tolerance** — a fixed floor in the component's own units. Lesson 5 is all about choosing these two. For now, notice the shape: big components get a big allowance, small ones get at least atol.

Then each component's estimated error is divided by its allowance. That gives a pure number, which is below $1$ when the component is within budget. The solver combines these into one **error norm** — a single number summarizing all components. SciPy uses the **[[root-mean-square|rms-norm]]**:

$$
\lVert \text{err} \rVert = \sqrt{\frac{1}{N}\sum_{i=1}^{N} \left(\frac{\text{err}_i}{\text{scale}_i}\right)^2}.
$$

Read the double bars as "the norm of". $N$ is the number of state components. The rule is then one line:

- if $\lVert \text{err} \rVert \le 1$, **accept** the step: move forward in time;
- if $\lVert \text{err} \rVert > 1$, **reject** it: throw it away, stay at the same time, and try again with a smaller $h$.

A rejected step is wasted work, but it is never used. Only accepted steps become part of the trajectory.

::: key Accept or reject
The controller keeps the estimated local error of each component below $\text{atol} + \text{rtol} \cdot |y|$. Scale each component's error by that allowance, combine into one norm, and accept the step when the norm is at most $1$; otherwise reject it and retry smaller.
:::

## Choosing the next step size

Whether the step was accepted or not, the controller now picks the next $h$. The idea is to use what it has learned. If the error was far below the limit, the step can grow. If it was above, the step must shrink — and it can work out by how much.

For a lower-order partner of order $q$, the local error scales like $h^{q+1}$. If a step of size $h$ produced error norm $\lVert\text{err}\rVert$, the step that would produce exactly $1$ is

$$
h_{\text{new}} = h \left(\frac{1}{\lVert \text{err} \rVert}\right)^{1/(q+1)}.
$$

Real controllers wrap this in two safety measures:

1. A **safety factor**, typically $0.9$, multiplies the result. Aiming a little under the limit means fewer rejected steps, since the error estimate is itself only an estimate.
2. **Limits** on the change: the step may not shrink below about $0.2$ times or grow above about $5$ or $10$ times the old one in a single go. One strange step should not throw the size around wildly.

So the full rule is

$$
h_{\text{new}} = h \cdot \min\!\left(f_{\max},\ \max\!\left(f_{\min},\ 0.9\left(\frac{1}{\lVert \text{err} \rVert}\right)^{1/(q+1)}\right)\right).
$$

For the Heun-Euler pair $q = 1$, so the exponent is $\frac{1}{2}$. For RK45, whose partner has order 4, it is $\frac{1}{5}$.

::: note Why it has to be true
Near the current point, the local error of the order-$q$ partner behaves like $\lVert \text{err} \rVert \approx C h^{q+1}$ for some constant $C$ that depends on the solution's shape there. We want a new step with $C h_{\text{new}}^{q+1} = 1$. Divide the two equations:

$$
\frac{C h_{\text{new}}^{q+1}}{C h^{q+1}} = \frac{1}{\lVert \text{err} \rVert}
\quad\Rightarrow\quad
\left(\frac{h_{\text{new}}}{h}\right)^{q+1} = \frac{1}{\lVert \text{err} \rVert}.
$$

Take the $(q+1)$-th root of both sides and multiply by $h$. The unknown $C$ cancels, exactly as in the step-halving test. The assumption hidden inside is that $C$ is about the same over the old and new steps — in other words, that the solution is **smooth** there.
:::

::: example A rejected step, then an accepted one
Use the Heun-Euler pair on $\dot{y} = -2y$ from $y_0 = 1$, with a plain tolerance of $0.001$ (so the error norm is $|\text{err}| / 0.001$) and a first guess of $h = 0.1$.

**Try $h = 0.1$.** From the last example the estimate is $0.02$. The norm is $0.02 / 0.001 = 20$, more than $1$. **Rejected.**

**New step.** With exponent $\frac{1}{2}$ and safety $0.9$: $h_{\text{new}} = 0.1 \times 0.9 \times \sqrt{1/20} \approx 0.0201$. (The shrink factor $0.201$ is a hair above the $0.2$ limit, so the limit does not come into play.)

**Try $h = 0.0201$.** $k_1 = -2$, so $y_{\text{low}} = 1 - 0.0402 = 0.9598$. Then $k_2 = -2 \times 0.9598 = -1.9196$, and $y_{\text{high}} = 1 + 0.01005 \times (-3.9196) \approx 0.960608$.

**Estimate.** $0.960608 - 0.9598 = 0.000808$. The norm is $0.808$, at most $1$. **Accepted.** Time moves to $t = 0.0201$ and the state becomes the Heun answer, $0.960608$.

**Sanity check.** The exact value is $e^{-0.0402} \approx 0.960597$. The Heun answer we kept is off by only about $1.1 \times 10^{-5}$ — about 75 times smaller than the estimate of $0.000808$. That is local extrapolation at work: the estimate judged the Euler answer, and we kept the better one.
:::

## An adaptive integrator in thirty lines

Here is the whole idea in code: a Heun-Euler adaptive integrator, run for one lap of an eccentric orbit. The orbit has perigee radius $7000\,\mathrm{km}$ and **[[eccentricity|eccentricity]]** $0.7$, so apogee is out at about $39\,700\,\mathrm{km}$.

```python
import numpy as np

MU = 3.986004418e14
def two_body_2d(t, y):                          # y = [x, y, vx, vy]
    r = y[:2]
    return np.concatenate([y[2:], -MU * r / np.linalg.norm(r)**3])

def heun_euler_adaptive(f, t0, y0, t1, h, rtol, atol):
    t, y = t0, np.asarray(y0, float)
    ts, hs, rejected = [t], [], 0
    while t < t1:
        h = min(h, t1 - t)                      # do not overshoot the end
        k1 = f(t, y)
        k2 = f(t + h, y + h * k1)
        y_low = y + h * k1                      # Euler, order 1
        y_high = y + 0.5 * h * (k1 + k2)        # Heun, order 2
        scale = atol + rtol * np.maximum(np.abs(y), np.abs(y_high))
        err = np.sqrt(np.mean(((y_high - y_low) / scale) ** 2))
        if err <= 1.0:                          # accept: keep the better answer
            t, y = t + h, y_high
            ts.append(t); hs.append(h)
        else:
            rejected += 1
        factor = 0.9 * (1.0 / max(err, 1e-10)) ** 0.5
        h *= min(5.0, max(0.2, factor))         # grow or shrink, within limits
    return np.array(ts), y, np.array(hs), rejected

rp, ecc = 7.0e6, 0.7
a = rp / (1 - ecc)                              # semi-major axis
vp = np.sqrt(MU * (2 / rp - 1 / a))             # speed at perigee
T = 2 * np.pi * np.sqrt(a**3 / MU)              # period
atol = np.array([1.0, 1.0, 1e-3, 1e-3])         # 1 m, 1 mm/s
ts, yT, hs, rej = heun_euler_adaptive(two_body_2d, 0.0, [rp, 0, 0, vp], T, 10.0, 1e-6, atol)

print(round(T / 3600, 2), "hours per orbit")    # 9.85 hours per orbit
print(len(hs), "steps,", rej, "rejected")       # 6264 steps, 2 rejected
print(round(hs[0], 2), round(hs[len(hs) // 2], 1))  # 1.49 20.8
print(round(np.linalg.norm(yT[:2] - [rp, 0]) / 1000, 2), "km")  # 2.56 km
```

Walk through what happened:

- The first guess of $10\,\mathrm{s}$ at perigee was far too big. It was **rejected twice**, shrinking each time, and the controller settled at about $1.5\,\mathrm{s}$.
- Half an orbit later, near apogee, the same controller was taking steps of about $21\,\mathrm{s}$ — **fourteen times** longer. Nothing told it to. It saw small error estimates and grew the step.
- It went around the orbit in $6264$ steps and came back within about $2.6\,\mathrm{km}$ of the start.

For comparison, a *fixed*-step Heun run with the same $6264$ steps misses by about $29.7\,\mathrm{km}$ — more than ten times worse for the same work. The adaptive run spent its steps where the orbit was hard.

::: example SciPy does the same thing, better
The same orbit through `solve_ivp` with its default `RK45`:

```python
from scipy.integrate import solve_ivp

sol = solve_ivp(two_body_2d, (0.0, T), [rp, 0, 0, vp], method="RK45",
                rtol=1e-6, atol=atol)
dt = np.diff(sol.t)                   # the accepted step sizes
print(len(dt), sol.nfev)              # 44 350
print(round(dt.max(), 1))             # 2527.9
```

**Steps.** $44$ accepted steps for the whole $9.85$-hour orbit, instead of $6264$. The longest step is about $2528\,\mathrm{s}$, some 42 minutes, out near apogee.

**Cost.** `sol.nfev` counts calls to $f$: $350$, against about $12\,500$ for the Heun-Euler run ($2$ per step, including the rejected ones). A fifth-order method can take much longer steps for the same error allowance.

**But look at the accuracy.** The same `rtol` of $10^{-6}$ gives a closure error of about $5.2\,\mathrm{km}$ here. Tolerances control each step's local error, not the final answer. Lesson 5 shows how to pick them for the accuracy you actually need.
:::

::: warning The tolerance is local, not global
`rtol=1e-6` does **not** promise six correct digits at the end of the run. It bounds the estimated error added in each *step*. Over thousands of steps, those errors add up and get stretched by the dynamics, as lesson 1 showed. The global error can be many times the tolerance. The only way to know the final accuracy is to check it: tighten the tolerance by 10 or 100 and see how much the answer moves, or use an invariant such as orbital energy (lesson 8).
:::

::: warning The estimate assumes a smooth solution
The step-size rule relies on the local error behaving like $C h^{q+1}$ with a slowly changing $C$. That is true for smooth motion. It is false across a sudden jump — an engine cutting off, a stage separating, a table lookup with a corner. There, the controller rejects step after step, shrinking $h$ down to almost nothing to creep over the jump, or it steps across and silently smears it. Lesson 10 shows the fix: stop the solver at the jump and restart it.
:::

## What the controller is really doing

It helps to see the adaptive integrator as a small **[[feedback loop|feedback-loop]]**. The "sensor" is the error estimate. The "setpoint" is an error norm of $1$. The "actuator" is the step size. Every step, it measures, compares and adjusts, like a thermostat.

That picture also explains the behavior you will learn to read in later lessons:

- **Many rejected steps** mean the controller keeps being surprised. The solution is changing character faster than a smooth model predicts — often a discontinuity.
- **Huge numbers of tiny accepted steps on a smooth-looking solution** mean something else is limiting the step, not accuracy. That is the signature of **[[stiffness|stiffness-preview]]**, lesson 7's subject.
- **A step size that tracks the physics** — small at perigee, large at apogee — is the controller doing its job.

On a real program, the orbit determination software that tracks a satellite, the trajectory tools that plan a mission, and the high-fidelity simulators that check a booster's landing all run adaptive embedded-pair solvers. The step-size history is one of the first things an engineer looks at when a simulation behaves strangely.

## Check yourself

::: check
Why does an embedded pair cost almost nothing extra compared with running its higher-order method alone?
:::

::: answer
Because the two methods use the *same* stages $k_1, k_2, \dots$ — the same calls to $f$, which are the expensive part. The lower-order answer is only a different weighted sum of stages already computed: a handful of multiplications and additions. Running two independent methods would have needed a second set of calls to $f$.
:::

::: check
A step with the RK45 pair (partner of order 4, so exponent $\frac{1}{5}$) produced an error norm of $0.01$. Ignoring any growth limit, by what factor would the controller grow the step? What if the limit is $5$?
:::

::: answer
The factor is $0.9 \times (1/0.01)^{1/5} = 0.9 \times 100^{0.2} \approx 0.9 \times 2.512 \approx 2.26$. So the next step is about $2.26$ times longer. That is below $5$, so a growth limit of $5$ does not change anything. Notice how gently a high-order method grows its step: an error $100$ times smaller than allowed only buys a step about $2.3$ times longer, because the error rises like $h^5$.
:::

::: check
A state has a position component of $6.5 \times 10^6\,\mathrm{m}$. With $\text{rtol} = 10^{-8}$ and $\text{atol} = 10^{-3}\,\mathrm{m}$, what error allowance does that component get in one step? Which of the two tolerances is doing the work?
:::

::: answer
$\text{scale} = 10^{-3} + 10^{-8} \times 6.5 \times 10^6 = 0.001 + 0.065 = 0.066\,\mathrm{m}$, about $6.6\,\mathrm{cm}$ per step. The relative part ($0.065\,\mathrm{m}$) is 65 times the absolute part ($0.001\,\mathrm{m}$), so rtol is doing the work. atol would only matter if this component came close to zero.
:::

::: check
In the Heun-Euler orbit run, the first step of $10\,\mathrm{s}$ was rejected. Explain in words what the integrator did next, and why none of the rejected work appears in the trajectory.
:::

::: answer
It computed the error norm, found it above $1$, and did **not** advance time or change the state. It shrank the step using $0.9 \times (1/\lVert\text{err}\rVert)^{1/2}$, limited to at least $0.2$ times the old step, and tried again from the same point. Only when a step passed the test ($\lVert\text{err}\rVert \le 1$) did it move forward and record the new state. Rejected attempts only cost time; their answers are discarded.
:::

::: check
A friend sets `rtol=1e-9` and says "now my final position is good to nine digits". What is wrong with that claim, and how could they check the real accuracy?
:::

::: answer
The tolerance bounds the *estimated local* error of each step, not the error at the end. Local errors add up over the run and can be magnified by the dynamics, so the final error can be much larger than $10^{-9}$ relative. (It can also be smaller, thanks to local extrapolation.) To check, rerun with a tighter tolerance, say `rtol=1e-11`, and see how much the final state changes, or compare against a conserved quantity such as orbital energy.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Error estimate | difference of two answers of different order | $\mathbf{y}_{\text{high}} - \mathbf{y}_{\text{low}}$ |
| Embedded pair | two methods sharing the same stages | $p(q)$: RK23 is 3(2), RK45 is 5(4) |
| Heun-Euler 2(1) | the smallest pair | $\mathbf{y}_{\text{low}} = \mathbf{y}_n + hk_1$, $\mathbf{y}_{\text{high}} = \mathbf{y}_n + \frac{h}{2}(k_1 + k_2)$ |
| Local extrapolation | advance with the better answer | estimate is cautious; kept answer is more accurate |
| FSAL | last stage reused as next first stage | Dormand-Prince: 7 stages, 6 new calls per step |
| Allowance per component | tolerance with a floor | $\text{atol}_i + \text{rtol} \cdot \lvert y_i \rvert$ |
| Accept test | error norm within budget | accept when $\lVert\text{err}\rVert \le 1$ |
| Step update | aim for norm 1, with safety and limits | $h_{\text{new}} = h \cdot 0.9 \,(1/\lVert\text{err}\rVert)^{1/(q+1)}$, clamped |
| Tolerance meaning | local per step, not global | check final accuracy separately |

Next lesson opens up `solve_ivp` itself: the six methods it offers — RK45, RK23, DOP853, Radau, BDF and LSODA — what each one is built for, and how to pick one for a job.

::: context dormand-prince The pair behind most ODE solvers
John Dormand and Peter Prince published their 5(4) pair in 1980. They chose its coefficients so that the fifth-order answer — the one that is actually kept — has an especially small error, rather than the fourth-order one. That fitted how people really use pairs, with local extrapolation. It became the default in MATLAB's `ode45`, in SciPy's `RK45` and in many other libraries. The same authors' ideas, extended by Ernst Hairer and Gerhard Wanner, led to the eighth-order `DOP853`.
:::

::: context fsal Reusing the last stage
In the Dormand-Prince pair the seventh stage is the slope at the new point, $f(t_{n+1}, \mathbf{y}_{n+1})$. The next step's first stage is the slope at its starting point — the same point.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="60" x2="330" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="30" cy="60" r="5" fill="#1d6fd1"/>
  <circle cx="180" cy="60" r="7" fill="#b4232c"/>
  <circle cx="330" cy="60" r="5" fill="#1d6fd1"/>
  <text x="105" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">step n</text>
  <text x="255" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">step n+1</text>
  <text x="180" y="88" font-size="12" text-anchor="middle" fill="#b4232c">last stage of step n</text>
  <text x="180" y="104" font-size="12" text-anchor="middle" fill="#b4232c">= first stage of step n+1</text>
</svg>
```

Computing it once and passing it on saves one call to $f$ on every accepted step. A rejected step also keeps its first stage: the retry starts from the same point, so that slope is already known.
:::

::: context rms-norm Why an average of squares
The root-mean-square takes each scaled error, squares it, averages the squares and takes the square root. Squaring makes every term positive, so errors in opposite directions cannot cancel. Averaging over $N$ keeps the result fair when the state has many components: a state of six numbers each exactly at its allowance gives a norm of exactly $1$, not $\sqrt{6}$. Some solvers use the largest scaled error instead, which is stricter.
:::

::: context eccentricity How stretched an orbit is
Eccentricity $e$ measures how far an orbit is from a circle: $0$ is a circle and values near $1$ are long, thin ovals. The perigee and apogee radii are $a(1 - e)$ and $a(1 + e)$, where $a$ is the semi-major axis, half the orbit's longest width. For our orbit, $a = 7000 / 0.3 \approx 23\,333\,\mathrm{km}$, so apogee is about $39\,667\,\mathrm{km}$ from Earth's center. The satellite moves about $9839\,\mathrm{m/s}$ at perigee but only about $1736\,\mathrm{m/s}$ at apogee — more than five times slower, which is why the step sizes differ so much.
:::

::: context stiffness-preview When stability, not accuracy, sets the step
Some systems mix a very fast process that dies out almost at once with a slow one you care about — a rocket's slow climb alongside a valve or chemical reaction that settles in microseconds. An explicit method like RK45 must keep its step tiny to stay stable against the fast part, even after that part has faded and the solution looks smooth. The controller then sees "error too big" whenever it tries a longer step, because the numbers start to blow up. Implicit methods such as Radau and BDF avoid this, as lesson 7 shows.
:::

::: context feedback-loop A thermostat for accuracy
A home thermostat measures the temperature, compares it with what you asked for, and turns the heater up or down. The step controller does the same with error.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="45" width="90" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="65" y="69" font-size="12" text-anchor="middle" fill="#1f2a44">take step h</text>
  <rect x="140" y="45" width="90" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="185" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">estimate</text>
  <text x="185" y="77" font-size="12" text-anchor="middle" fill="#1f2a44">error norm</text>
  <rect x="260" y="45" width="85" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="302" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">norm ≤ 1?</text>
  <text x="302" y="77" font-size="12" text-anchor="middle" fill="#1f2a44">accept/reject</text>
  <line x1="110" y1="65" x2="136" y2="65" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="140,65 132,61 132,69" fill="#1f2a44"/>
  <line x1="230" y1="65" x2="256" y2="65" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="260,65 252,61 252,69" fill="#1f2a44"/>
  <path d="M302,85 L302,120 L65,120 L65,89" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="65,85 61,93 69,93" fill="#b4232c"/>
  <text x="185" y="138" font-size="12" text-anchor="middle" fill="#b4232c">new h = h × 0.9 (1/norm)^(1/(q+1))</text>
</svg>
```

Like any feedback loop, it can misbehave: aimed too aggressively it oscillates between rejected and accepted steps, which is exactly why the safety factor and the change limits are there.
:::
