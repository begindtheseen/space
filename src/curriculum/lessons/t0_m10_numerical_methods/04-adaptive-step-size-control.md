---
id: l04-adaptive-step-size-control
title: Adaptive step-size control
minutes: 22
covers:
  - adaptive step-size control
---

Drive a winding mountain road, then a straight highway. You slow right down on the hairpins and speed up on the straight. Nobody drives the whole trip at hairpin speed.

A fixed-step integrator drives the whole trip at one speed. Its step must suit the hardest part of the path, so it crawls through the easy parts too. On a circular orbit every part is equally hard. On a **[[Molniya orbit|molniya]]** — a long, thin ellipse with eccentricity $e = 0.7$ — the difference is huge. At perigee (the closest point) the satellite moves at $9.21\,\mathrm{km/s}$; at apogee (the farthest) at $1.63\,\mathrm{km/s}$. Gravity falls off as $1/r^2$, so the pull at perigee is $(45{,}220/7{,}980)^2 \approx 32$ times the pull at apogee. A step small enough for the perigee pass is about thirty times smaller than apogee needs, and the satellite spends most of its twelve-hour lap near apogee. Fixed-step RK4 wastes most of its work there.

The fix is to let the integrator measure its own error every step and choose the next step from it: long where the path is smooth, short where it bends. This takes three parts — a nearly free error estimate, a way to turn a vector of errors into one number, and a rule turning that number into the next step: $h_{\text{new}} = h \cdot \text{safety} \cdot (\text{tol}/\text{err})^{1/(p+1)}$. You will see where every piece comes from.

The lesson ends where adaptive stepping is the *wrong* answer: inside a flight computer's control loop.

## Measuring your own error: the embedded pair

To control a step's error you need to know it, but the exact answer is not available.

Here is the trick, in everyday form. Two people estimate the length of a room: one with a tape measure, one by pacing it out. You do not know the true length. But the gap between their answers tells you roughly how wrong the pacer is, because the tape is much better.

An integrator can do the same with two methods of different order — almost for free, if both share the same derivative evaluations. That is a Runge–Kutta **embedded pair**: one set of stages $\mathbf{k}_1, \ldots, \mathbf{k}_s$ (the slope samples, as in RK4) and two sets of weights for combining them. Weights $b_i$ give a result of order $p$; weights $\hat{b}_i$ ("b-hat sub i") give a result of order $p + 1$:

$$
\mathbf{y}_{n+1}^{(p+1)} = \mathbf{y}_n + h\sum_i \hat{b}_i\,\mathbf{k}_i, \qquad
\mathbf{y}_{n+1}^{(p)} = \mathbf{y}_n + h\sum_i b_i\,\mathbf{k}_i, \qquad
\mathbf{e}_{n+1} = \mathbf{y}_{n+1}^{(p+1)} - \mathbf{y}_{n+1}^{(p)} .
$$

Why does the difference measure an error? The better result has local error $O(h^{p+2})$, the worse one $O(h^{p+1})$. For small $h$ the better one's error is tiny next to the worse one's, so the gap is, to leading order, the *lower-order* result's local error.

Then comes a twist. The integrator carries on from the *higher*-order result, even though the error it measured belongs to the lower-order one. This is **[[local extrapolation|local-extrapolation]]**. You control the error of an answer you throw away — but the answer you keep is at least as good, so the control errs on the safe side.

### Dormand–Prince 5(4)

The pair behind SciPy's `solve_ivp` default, MATLAB's `ode45` and most simulators you will inherit is **[[Dormand–Prince 5(4)|dormand-prince]]**, usually called RK45. It has seven stages, sampled at the fractions of the step $c = (0, \tfrac15, \tfrac{3}{10}, \tfrac45, \tfrac89, 1, 1)$. The fifth-order weights are

$$
\hat{b} = \left(\tfrac{35}{384},\ 0,\ \tfrac{500}{1113},\ \tfrac{125}{192},\ -\tfrac{2187}{6784},\ \tfrac{11}{84},\ 0\right),
$$

and the fourth-order weights are

$$
b = \left(\tfrac{5179}{57600},\ 0,\ \tfrac{7571}{16695},\ \tfrac{393}{640},\ -\tfrac{92097}{339200},\ \tfrac{187}{2100},\ \tfrac{1}{40}\right).
$$

Seven stages sounds expensive next to RK4's four. But the seventh is evaluated at the end of the step with the fifth-order answer — exactly the first stage $\mathbf{k}_1$ of the *next* step — so it is reused. This **first same as last** (FSAL) property makes an accepted step cost six evaluations of $\mathbf{f}$, not seven.

You do not need to memorize these fractions. You need to know what the two weight sets are for: one answer to keep, one to compare against.

::: note The whole Dormand–Prince step, for coding it
Each stage samples the slope at a trial state built from the stages before it:

$$
\begin{aligned}
\mathbf{k}_1 &= \mathbf{f}(t_n, \mathbf{y}_n), \\
\mathbf{k}_2 &= \mathbf{f}\left(t_n + \tfrac{h}{5},\ \mathbf{y}_n + h\,\tfrac{1}{5}\mathbf{k}_1\right), \\
\mathbf{k}_3 &= \mathbf{f}\left(t_n + \tfrac{3h}{10},\ \mathbf{y}_n + h\left(\tfrac{3}{40}\mathbf{k}_1 + \tfrac{9}{40}\mathbf{k}_2\right)\right), \\
\mathbf{k}_4 &= \mathbf{f}\left(t_n + \tfrac{4h}{5},\ \mathbf{y}_n + h\left(\tfrac{44}{45}\mathbf{k}_1 - \tfrac{56}{15}\mathbf{k}_2 + \tfrac{32}{9}\mathbf{k}_3\right)\right), \\
\mathbf{k}_5 &= \mathbf{f}\left(t_n + \tfrac{8h}{9},\ \mathbf{y}_n + h\left(\tfrac{19372}{6561}\mathbf{k}_1 - \tfrac{25360}{2187}\mathbf{k}_2 + \tfrac{64448}{6561}\mathbf{k}_3 - \tfrac{212}{729}\mathbf{k}_4\right)\right), \\
\mathbf{k}_6 &= \mathbf{f}\left(t_n + h,\ \mathbf{y}_n + h\left(\tfrac{9017}{3168}\mathbf{k}_1 - \tfrac{355}{33}\mathbf{k}_2 + \tfrac{46732}{5247}\mathbf{k}_3 + \tfrac{49}{176}\mathbf{k}_4 - \tfrac{5103}{18656}\mathbf{k}_5\right)\right), \\
\mathbf{y}^{(5)}_{n+1} &= \mathbf{y}_n + h\left(\tfrac{35}{384}\mathbf{k}_1 + \tfrac{500}{1113}\mathbf{k}_3 + \tfrac{125}{192}\mathbf{k}_4 - \tfrac{2187}{6784}\mathbf{k}_5 + \tfrac{11}{84}\mathbf{k}_6\right), \\
\mathbf{k}_7 &= \mathbf{f}\left(t_n + h,\ \mathbf{y}^{(5)}_{n+1}\right).
\end{aligned}
$$

The error vector is $h\sum_i (\hat{b}_i - b_i)\mathbf{k}_i$ with the two weight rows above. Another common 5(4) pair, Cash–Karp, has six stages and no FSAL; either serves.
:::

::: example Reading the error estimate on a test problem
Take $\dot y = -y$ with $y_0 = 1$, whose exact solution is $e^{-t}$. Take one Dormand–Prince step of $h = 0.1$.

- The fifth-order answer is $y^{(5)} = 0.904837418333$.
- The gap between the two weight sets is $e = 8.41 \times 10^{-9}$.
- The exact answer is $e^{-0.1} = 0.904837418036$.

So the fifth-order answer is off by $0.904837418333 - 0.904837418036 = 3.0 \times 10^{-10}$. The fourth-order answer, $y^{(5)} - e$, is off by $-8.1 \times 10^{-9}$.

The estimate, $8.4 \times 10^{-9}$, matches the fourth-order error within 4% and overstates the kept answer's error by about 28 times. The controller sees the cautious number, as intended.

**Check that it scales like $h^5$.** At $h = 0.5$ the estimate is $3.07 \times 10^{-5}$ (the kept answer's true error is $5.8 \times 10^{-6}$). Halving the step from $0.2$ to $0.1$ divides the estimate by $33.3$; halving from $0.1$ to $0.05$ divides it by $32.6$. Both are close to $2^5 = 32$, and closer as $h$ shrinks. The estimate measures an $O(h^{p+1})$ quantity with $p = 4$.
:::

An embedded pair is not the only way. **Step doubling** takes one step of $2h$ and two steps of $h$ with any method; by an argument due to **[[Richardson|richardson]]**, the two-step answer's error is about their difference divided by $2^p - 1$. It costs about three plain steps, the cost embedded pairs were invented to remove.

## From a vector of errors to one number

The error estimate is a vector, one entry per state component, in different units and of very different sizes: kilometers in one slot, kilometers per second in another. You need one "good enough" test for all of them.

Think of report cards. A score of 9 is great out of 10 and terrible out of 100, so before averaging across subjects you divide each score by what it is out of. Here each component's error is divided by its own allowance.

One absolute allowance fails: a kilometer and a kilometer per second are not comparable. One relative allowance ("a billionth of the value") fails whenever a component passes through zero, as every orbital velocity component does twice a lap. So each component gets a two-part allowance, as in the floating-point lesson's comparisons:

$$
\mathrm{sc}_i = \text{atol}_i + \text{rtol} \cdot \max\left(|y_{n,i}|,\ |y_{n+1,i}|\right).
$$

Here $\mathrm{sc}_i$ is the scale for component $i$, **rtol** is the **relative tolerance** (a fraction of the value) and **atol** is the **absolute tolerance** (a floor in the component's own units). Then the errors are combined with a **[[root-mean-square|rms-norm]]** into one number:

$$
E = \sqrt{\frac{1}{n}\sum_{i=1}^{n}\left(\frac{e_{n+1,i}}{\mathrm{sc}_i}\right)^2} .
$$

Read it as: divide each error by its allowance, square, average, square-root. The step is **accepted** when $E \le 1$ — on average every component is within its own allowance. Otherwise it is **rejected** and retried from the same $\mathbf{y}_n$ with a smaller $h$. A rejected step still costs its six evaluations, so a well-tuned integrator rejects a few percent of its steps, not a third.

Choosing tolerances is engineering: rtol says how many significant digits you want ($10^{-8}$ asks for about eight). atol is the size below which you stop caring. For an orbit in kilometers, atol of $10^{-3}\,\mathrm{km}$ on position and $10^{-6}\,\mathrm{km/s}$ on velocity says "a meter and a millimeter per second are noise".

::: warning Never set atol to zero
With atol $= 0$, a component that is near zero gets an allowance near zero. Its error is divided by almost nothing, $E$ becomes enormous, and the integrator shrinks the step again and again chasing an absolute accuracy nobody asked for. Worse, a component that is *exactly* zero — the out-of-plane position and velocity of a planar orbit stored in a 3-D state — has allowance zero and error zero, and $0/0$ is "not a number". The acceptance test then fails forever and the integrator never advances.
:::

## The control law

Suppose the step you tried, of size $h$, gave a scaled error $E$. The estimate measures an $O(h^{p+1})$ quantity. So if you had used a step $h_{\text{new}}$ instead, the error would have been, to leading order,

$$
E_{\text{new}} = E\left(\frac{h_{\text{new}}}{h}\right)^{p+1} .
$$

You want $E_{\text{new}} = 1$, right at the allowance. Set it to 1 and solve for $h_{\text{new}}$: divide by $E$, then take the $(p+1)$-th root of both sides:

$$
h_{\text{new}} = h\left(\frac{1}{E}\right)^{1/(p+1)} .
$$

Two refinements make it work in practice.

1. **A safety factor.** The $h^{p+1}$ model is only the leading term, so aiming exactly at $E = 1$ lands above it about half the time, and those steps get rejected. Multiplying by a **safety factor** of about $0.9$ aims a little inside the line.
2. **A clamp.** The model is only trustworthy for modest changes in $h$. So the ratio $h_{\text{new}}/h$ is **clamped** — held between limits, typically $0.2$ and $5$.

For a single component, $E$ is $\text{err}/\text{tol}$, and the law reads the way the flashcard writes it.

::: key Step-size controller
$h_{\text{new}} = h \cdot \text{safety} \cdot (\text{tol}/\text{err})^{1/(p+1)}$, with safety $\approx 0.9$ and the ratio $h_{\text{new}}/h$ clamped to about $[0.2, 5]$. The exponent is $1/(p+1)$ because the estimate is a local error, $O(h^{p+1})$, with $p$ the order of the lower member of the pair. For Dormand–Prince 5(4), $p = 4$ and the exponent is $1/5$. Accept the step when the scaled error $E \le 1$; otherwise reject it, shrink $h$ and retry from the same state.
:::

The small exponent is the point: a step whose error was a hundred times too big shrinks by only $100^{1/5} = 2.5$. Because the error depends so **[[steeply on the step|fifth-root]]**, a small change in $h$ makes a big change in error. So the controller responds gently rather than lurching between huge and tiny steps.

::: example One controller decision
$\dot y = -y$ from $y_0 = 1$, an absolute tolerance of $10^{-8}$ only, and a first guess of $h = 0.5$.

**Try $h = 0.5$.** From the last example, $\text{err} = 3.07 \times 10^{-5}$. So

$$
E = \frac{3.07 \times 10^{-5}}{10^{-8}} = 3{,}070 .
$$

That is far above 1, so the step is rejected.

**Propose a new step.** The unclamped law gives

$$
\frac{h_{\text{new}}}{h} = 0.9 \times \left(\frac{1}{3{,}070}\right)^{1/5} = 0.9 \times 0.2007 = 0.181 .
$$

That is below the clamp's floor of $0.2$, so the clamp takes over: $h_{\text{new}} = 0.2 \times 0.5 = 0.1$.

**Try $h = 0.1$.** Now $\text{err} = 8.41 \times 10^{-9}$ and $E = 0.84$. That is below 1, so the step is accepted. The next proposal is $0.1 \times 0.9 \times (1/0.84)^{1/5} = 0.093$.

**Sanity check.** The controller has found a step that keeps the error a little inside the allowance. Carried on to $t = 10$, it takes 50 accepted steps and that one rejection, about 300 evaluations. The steps grow from $0.093$ to $0.52$ as the solution shrinks: with an absolute tolerance, a smaller $y$ has smaller absolute errors, so longer steps are allowed. The final error is $1.4 \times 10^{-9}$.
:::

In code the loop is short, and its shape is worth knowing by heart. Here `dormand_prince_step` is one seven-stage step with the weights above, returning the fifth-order answer and the error vector:

```python
import numpy as np

def rk45_adaptive(f, t, y, t_end, rtol, atol, h):
    while t < t_end:
        h = min(h, t_end - t)
        y_new, err = dormand_prince_step(f, t, y, h)  # y_new is 5th order
        sc = atol + rtol * np.maximum(np.abs(y), np.abs(y_new))
        E = np.sqrt(np.mean((err / sc) ** 2))
        if E <= 1.0:
            t, y = t + h, y_new                        # accept
        factor = 0.9 * E ** (-0.2) if E > 0 else 5.0
        h *= min(5.0, max(0.2, factor))                # grow or shrink
    return y
```

Production controllers add a **[[PI term|pi-controller]]** that also looks at the previous step's $E$, which damps see-sawing when the problem's smoothness changes suddenly, and they refuse to grow $h$ right after a rejection. The skeleton is the whole idea.

## The Molniya orbit, adaptively

Back to the orbit from the start: semi-major axis $a = 26{,}600\,\mathrm{km}$, $e = 0.7$, perigee radius $7{,}980\,\mathrm{km}$, apogee radius $45{,}220\,\mathrm{km}$, period $T = 43{,}175\,\mathrm{s}$. Start at perigee and propagate one period with Dormand–Prince, using atol $= 10^{-3} \times \text{rtol} \times r_p$ on every component and a first step of $1\,\mathrm{s}$. After one period the satellite should be back exactly where it started, so the distance from the start point is the position error:

| rtol | accepted | rejected | evaluations | position error after one period |
| --- | --- | --- | --- | --- |
| $10^{-6}$ | 41 | 13 | 324 | $9.4\,\mathrm{km}$ |
| $10^{-8}$ | 93 | 10 | 618 | $61\,\mathrm{m}$ |
| $10^{-10}$ | 229 | 5 | 1,404 | $0.34\,\mathrm{m}$ |
| $10^{-12}$ | 575 | 3 | 3,468 | $2.1\,\mathrm{mm}$ |

The table shows two patterns.

- **Cost.** Tightening the tolerance by 100 multiplies the step count by $100^{1/5} = 2.5$: the counts $41 \to 93 \to 229 \to 575$ go up by 2.3, 2.5 and 2.5. That is because the step scales as $\text{tol}^{1/5}$.
- **Accuracy.** The final error falls by 150 to 180 for each factor of 100 in tolerance — faster than the tolerance. The controller watches the fourth-order error, but the answer it keeps is fifth order.

The accepted steps at $\text{rtol} = 10^{-8}$ tell the story of the orbit, as the **[[step-size trace|step-trace]]** shows. From the $1\,\mathrm{s}$ first guess the controller grows by its clamp factor of 5 twice, to $25\,\mathrm{s}$, then settles at $53, 65, 73, 80, 87\,\mathrm{s}$ past perigee. Near apogee the steps are around $1{,}300$ to $1{,}600\,\mathrm{s}$ — more than twenty minutes. On the way back down they shrink again: $111, 101, 91, 75, 66\,\mathrm{s}$ as perigee comes round. A perigee step of about $65\,\mathrm{s}$ against an apogee step of about $1{,}500\,\mathrm{s}$ is a ratio of 23. The pull ratio of 32 predicted the right size, softened by the fifth root in the control law.

Fixed-step RK4 needs $1{,}000$ steps of $43\,\mathrm{s}$ to reach the same $60\,\mathrm{m}$: $4{,}000$ evaluations against 618, six and a half times the work. Give fixed RK4 a $144\,\mathrm{s}$ step, close to the adaptive run's average, and its error is $9.8\,\mathrm{km}$, because that step is far too long at perigee. The adaptive integrator used no better formula; it put its evaluations where the pull changed fastest.

::: warning Do not bend the steps to hit output times
An adaptive integrator lands where its controller sends it, not at the times you want output. Do not shorten steps to hit output times: that changes the error behavior and can double the step count for a fine output grid. Take the natural steps and fill in the output times with **[[dense output|dense-output]]** — a polynomial through the stage values that is accurate to the method's order across the whole step. Every production solver has it built in, including `solve_ivp` with `dense_output=True`.
:::

::: warning Tolerance is not accuracy
The controller keeps each step's *local* error near the tolerance. The *global* error after a long run is all those local errors added up and carried along by the dynamics. On the Molniya orbit, $\text{rtol} = 10^{-8}$ gave $61\,\mathrm{m}$ of error on a $45{,}000\,\mathrm{km}$ orbit — a relative error of $1.4 \times 10^{-6}$, a hundred times the tolerance — and after a hundred laps it would be larger still. To learn the global error, run twice with tolerances a factor of 100 apart and compare. Never read it off the tolerance.
:::

## Adaptive stepping in flight software

Everything so far is for simulation, where the computer can take as long as it needs. A flight computer cannot.

Its guidance and control loop runs at a fixed rate — 50, 100, 400 times a second. Each cycle is a **frame**, and every task in the frame must finish before the next one starts, like a train that leaves on time whether or not you are on board. The schedule is checked against each task's **[[worst-case execution time|wcet]]**: the longest it could ever take. A task whose longest time cannot be pinned down cannot be scheduled.

An adaptive integrator's run time depends on the data: one step through a smooth stretch, perhaps twenty through a thruster firing, each with six evaluations of the dynamics. The worst case is not "twenty" — it is "however many the controller decides", and a rejection loop with a badly set atol can decide on thousands.

So flight code propagates with a fixed-step method at the loop rate — most often RK4, sometimes RK2 or the trapezoidal rule when the model is cheap and the rate high. The step is chosen and checked *offline*, in simulation, against a high-accuracy adaptive reference. That is where the adaptive integrator belongs: the offline reference, mission analysis, and the ground system that builds ephemerides.

::: key Adaptive stepping and flight code
Adaptive step-size control makes execution time data-dependent, so worst-case execution time cannot be bounded and the loop can overrun its deadline. Flight software uses a fixed-step integrator at the control-loop rate, with the step chosen offline by analysis against an adaptive high-accuracy reference. Adaptive RK45 belongs in simulation, analysis and ground systems.
:::

## Check yourself

::: check
A Runge–Kutta pair of orders 8 and 7, such as the Dormand–Prince 8(7) pair used for high-precision ephemerides, keeps the eighth-order answer. What exponent does its step controller use, and by what factor does it shrink the step after a step with scaled error $E = 500$?
:::

::: answer
The estimate is the local error of the lower-order member. That member has order $p = 7$, so its local error is $O(h^{8})$ and the exponent is $1/(p+1) = 1/8$.

With safety $0.9$: $0.9 \times (1/500)^{1/8} = 0.9 \times 0.4599 = 0.41$. The step shrinks to about $0.41$ of its old size (inside the clamp). High-order pairs respond even more gently than fifth-order ones, because their error depends even more steeply on $h$.
:::

::: check
A propagator with $\text{atol} = 0$ and $\text{rtol} = 10^{-10}$ is given an equatorial orbit as a 3-D state $(x, y, z, v_x, v_y, v_z)$, so $z$ and $v_z$ are exactly zero. It never completes a step. Explain what happened and give the fix.
:::

::: answer
For the $z$ and $v_z$ components the allowance is $\mathrm{sc}_i = 0 + \text{rtol} \times \max(0, 0) = 0$, and their error estimate is also exactly zero. So $e_i/\mathrm{sc}_i = 0/0$, which is "not a number" (NaN). A NaN makes $E$ a NaN, and "$E \le 1$" is false for a NaN, so every step is rejected. (In the skeleton code, the NaN also fails the test $E > 0$, so the step even *grows* by 5 each time, and the loop spins forever at the same $t$.)

The same flaw bites more quietly when a component merely passes near zero: its allowance nearly vanishes and the step is forced down.

The fix is a non-zero atol for every component, set at the level below which you do not care — for instance $10^{-3}\,\mathrm{km}$ on position and $10^{-6}\,\mathrm{km/s}$ on velocity.
:::

::: check
On the Molniya orbit the run at $\text{rtol} = 10^{-12}$ took 575 accepted steps. Predict the count at $\text{rtol} = 10^{-14}$, then say why that prediction would not come true in `float64`.
:::

::: answer
The step scales as $\text{tol}^{1/5}$, so a hundred times tighter tolerance multiplies the step count by $100^{1/5} = 2.51$: about $575 \times 2.51 \approx 1{,}440$ steps.

It would not happen. At $\text{rtol} = 10^{-14}$ the allowed local error on a $45{,}000\,\mathrm{km}$ position is $4.5 \times 10^{-10}\,\mathrm{km}$. Neighboring `float64` numbers at that size are $2^{15-52}\,\mathrm{km} = 7.3 \times 10^{-12}\,\mathrm{km}$ apart, so the allowance is only about 60 of those gaps — the size of the rounding error in the stage sums. The estimate turns into rounding noise, steps are rejected at random, and the integrator stalls or gives an answer no better than at $10^{-12}$. Tolerances tighter than about $10^{3}\varepsilon$ ask the arithmetic for digits it does not have.
:::

::: check
Two controllers are proposed for a Dormand–Prince integrator: (a) $h_{\text{new}} = h\,(1/E)^{1/5}$ with no safety factor and no clamp; (b) the standard law with safety $0.9$ and clamp $[0.2, 5]$. On a smooth problem, which rejects more steps? And what goes wrong with (a) when the dynamics change suddenly — a thruster switching on?
:::

::: answer
(a) rejects more. It aims exactly at $E = 1$, and since the $h^5$ model is only the leading term, about half its steps land above the line and are rejected. The safety factor in (b) aims at $E \approx 0.9^5 = 0.59$, well inside, and rejections drop to a few percent.

At a thruster ignition the first step across the jump has an enormous error estimate, because the smooth Taylor expansion behind the estimate does not exist there. Controller (a) can shrink $h$ by a factor of $1{,}000$ in one decision and need dozens of steps to grow back. The clamp in (b) limits any change to a factor of 5, so recovery takes a few steps.
:::

::: check
A colleague argues that since adaptive RK45 needed six times fewer evaluations than fixed RK4 for the same accuracy on the Molniya orbit, it should replace RK4 in the vehicle's on-board propagator. Give the two-sentence rebuttal, and say what the adaptive integrator *should* be used for on that project.
:::

::: answer
The on-board propagator runs in a fixed-rate loop whose scheduler needs a bounded worst-case execution time, and an adaptive integrator's work per frame depends on the data — one step near apogee, many through a burn — so it cannot be bounded or scheduled. Fixed-step RK4 at the loop rate is deterministic and, with a step checked offline, accurate enough.

The adaptive integrator's job is to *be* that offline check — the high-accuracy reference, at something like $\text{rtol} = 10^{-12}$, that the flight propagator is compared against — and to produce the ground ephemerides.
:::

## Summary

| Item | Statement |
| --- | --- |
| Embedded pair | Same stages $\mathbf{k}_i$, two weight sets; $\mathbf{e} = \mathbf{y}^{(p+1)} - \mathbf{y}^{(p)}$ estimates the local error of the order-$p$ answer |
| Dormand–Prince 5(4) | 7 stages, FSAL so 6 evaluations per accepted step; keeps the 5th-order answer; $p = 4$ |
| Scaled error | $\mathrm{sc}_i = \text{atol}_i + \text{rtol}\max(\lvert y_{n,i}\rvert, \lvert y_{n+1,i}\rvert)$, $E = \sqrt{\tfrac{1}{n}\sum (e_i/\mathrm{sc}_i)^2}$; accept if $E \le 1$ |
| Control law | $h_{\text{new}} = h \cdot \text{safety} \cdot (\text{tol}/\text{err})^{1/(p+1)}$, safety $\approx 0.9$, ratio clamped to $[0.2, 5]$ |
| Scaling | Step count $\propto \text{tol}^{-1/(p+1)}$: 100 times tighter tolerance costs 2.5 times more steps for a 5(4) pair |
| Molniya, rtol $10^{-8}$ | 93 steps, 618 evaluations, $61\,\mathrm{m}$ after one period; steps about $65\,\mathrm{s}$ at perigee, $1{,}500\,\mathrm{s}$ at apogee; fixed RK4 needs 4,000 evaluations |
| Output | Use dense output; never shorten steps to hit output times |
| Tolerance | Controls local error; global error must be measured by rerunning at a tighter tolerance |
| Flight software | Fixed step at the loop rate; adaptive stepping breaks the worst-case execution time bound |

The next lesson asks what happens to these integrators — fixed or adaptive — over a thousand laps instead of one. The answer depends on a property none of them has: keeping the orbit's geometry intact. That is what a symplectic integrator offers, and what an energy check detects.

::: context molniya A satellite that hangs over the north
The Soviet Union launched the first Molniya ("lightning") communications satellites in the 1960s. Most of its territory is too far north to see a geostationary satellite well, so engineers chose a long ellipse with its apogee high over the northern hemisphere. The satellite races through perigee in the south and then hangs slowly near apogee for hours, visible from Russia.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <ellipse cx="200" cy="105" rx="133" ry="95" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="107" cy="105" r="32" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="107" y="109" font-size="11" text-anchor="middle" fill="#1f2a44">Earth</text>
  <circle cx="67" cy="105" r="4" fill="#b4232c"/>
  <text x="62" y="92" font-size="11" text-anchor="end" fill="#b4232c">perigee</text>
  <text x="62" y="128" font-size="11" text-anchor="end" fill="#b4232c">9.21 km/s</text>
  <circle cx="333" cy="105" r="4" fill="#1f2a44"/>
  <text x="326" y="92" font-size="11" text-anchor="end" fill="#1f2a44">apogee</text>
  <text x="326" y="128" font-size="11" text-anchor="end" fill="#1f2a44">1.63 km/s</text>
  <text x="200" y="215" font-size="11" text-anchor="middle" fill="#6c7a93">drawn to scale: e = 0.7, a = 26,600 km</text>
</svg>
```

The period is about 12 hours, and the orbit is tilted $63.4^\circ$ to the equator so that Earth's bulge does not slowly swing the apogee away from the north.
:::

::: context local-extrapolation Measuring the rough answer, keeping the good one
Picture the room again. You measure it with the tape and by pacing. The gap tells you the pacer is off by about 30 cm. Then you write down the *tape* measurement. You never learned the tape's error — but it is surely smaller than 30 cm, so saying "within 30 cm" is honest, if pessimistic. That is local extrapolation. Early embedded pairs kept the lower-order answer; Dormand and Prince designed their pair so the kept, higher-order answer is the especially accurate one.
:::

::: context dormand-prince Where RK45 came from
John Dormand and Peter Prince, two British mathematicians, published their pair in 1980. They chose its coefficients to make the error of the fifth-order answer — the one you keep — as small as they could, and built in the "first same as last" trick. It became the default `ode45` in MATLAB and the default method in SciPy's `solve_ivp`. When an engineer says "we ran it through RK45", this is almost always the pair they mean. Dormand and Prince also built the higher-order 8(7) pair used for precise orbit work.
:::

::: context richardson Richardson's trick
Lewis Fry Richardson was an English scientist who, in the 1920s, tried to forecast the weather by solving the equations of the atmosphere with pencil and paper. His trick for errors works like this: if a method's error is about $Ch^p$, then one step of $2h$ has error about $2^p$ times that of two steps of $h$. Two unknowns — the true answer and $C$ — and two runs: you can solve for both. The difference between the two answers, divided by $2^p - 1$, is the error of the finer one.
:::

::: context rms-norm Why square, average and square root
Squaring makes every error positive, so a $+2$ and a $-2$ cannot cancel. Averaging stops a big state vector from looking worse than a small one only because it has more entries. The square root brings the result back to the size of a typical error. The result — the **root-mean-square** — is like an average error with extra weight on the big ones. Some codes use the largest ratio instead (the "max norm"), which is stricter: one bad component alone fails the step.
:::

::: context fifth-root Why a factor of 100 moves the step by only 2.5
The error grows as $h^5$. On a log–log plot that is a straight line with slope 5: move one unit right in $\log h$ and you move five units up in $\log E$. So to fix a hundredfold error, you slide left by only a fifth as far.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="190" x2="335" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="190" x2="60" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="190" x2="330" y2="20" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="60" y1="105" x2="330" y2="105" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="330" y="100" font-size="11" text-anchor="end" fill="#6c7a93">E = 1 (allowance)</text>
  <circle cx="285" cy="48.3" r="4.5" fill="#b4232c"/>
  <text x="278" y="40" font-size="11" text-anchor="end" fill="#b4232c">tried: E = 100</text>
  <circle cx="195" cy="105" r="4.5" fill="#1d6fd1"/>
  <line x1="280" y1="120" x2="202" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="198,120 208,115 208,125" fill="#1f2a44"/>
  <text x="240" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">h ÷ 2.5</text>
  <text x="54" y="52" font-size="11" text-anchor="end" fill="#1f2a44">100</text>
  <text x="54" y="109" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="54" y="166" font-size="11" text-anchor="end" fill="#1f2a44">0.01</text>
  <text x="197" y="206" font-size="11" text-anchor="middle" fill="#1f2a44">step h (log scale)</text>
  <text x="20" y="20" font-size="11" fill="#1f2a44">E</text>
</svg>
```

A gentle controller is a stable one: it will not overshoot into a tiny step and then leap to a huge one.
:::

::: context pi-controller A controller inside the integrator
The step-size rule is a small feedback controller: it measures an error and adjusts a knob. The plain rule reacts only to the latest error — a *proportional* controller. A PI controller also remembers the last error, the way a good thermostat uses how the temperature has been trending and not only where it is now. You will meet P, PI and PID controllers properly in the control track; it is a pleasant surprise to find one hidden inside an ODE solver.
:::

::: context step-trace The controller's steps around one Molniya lap
Each point is one accepted step at $\text{rtol} = 10^{-8}$, plotted at the middle of its time interval. Near perigee (both ends) the steps are about a minute long; near apogee they stretch past twenty minutes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="46" y1="20" x2="50" y2="20" stroke="#1f2a44"/><text x="43" y="24" font-size="11" text-anchor="end" fill="#1f2a44">1600</text>
  <line x1="46" y1="95" x2="50" y2="95" stroke="#1f2a44"/><text x="43" y="99" font-size="11" text-anchor="end" fill="#1f2a44">800</text>
  <text x="43" y="174" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="50.0,169.9 50.0,169.5 50.1,167.7 50.4,165.0 50.8,163.9 51.2,163.1 51.8,162.5 52.3,161.8 52.9,161.1 53.6,160.4 54.3,159.7 55.1,158.9 55.9,158.0 56.8,157.0 57.8,155.8 58.8,154.6 60.0,154.0 61.1,154.0 62.2,154.3 63.3,156.4 64.3,156.5 65.3,155.0 66.5,151.8 67.9,149.0 69.5,146.4 71.3,144.1 73.2,141.9 75.3,139.8 77.5,137.6 79.9,135.2 82.5,132.6 85.3,129.8 88.3,126.7 91.5,123.4 95.0,119.9 98.7,116.0 102.7,111.8 107.1,107.3 111.7,102.5 116.7,97.4 122.1,91.9 127.9,86.0 134.2,79.7 140.9,73.0 148.1,65.6 155.9,57.5 164.3,48.3 173.4,37.9 183.2,28.2 192.5,50.8 201.1,49.9 210.1,38.3 220.2,20.7 230.1,41.2 239.4,40.8 248.2,53.1 256.2,63.8 263.5,72.9 270.1,81.0 276.3,88.3 281.9,95.1 287.0,101.3 291.7,107.0 296.1,112.3 300.0,117.2 303.6,121.7 307.0,125.7 310.0,129.3 312.8,132.7 315.4,135.7 317.7,138.6 319.9,141.3 321.7,147.0 323.3,149.9 324.6,152.8 325.7,155.9 326.7,157.2 327.6,157.5 328.5,156.2 329.5,155.7 330.6,155.5 331.6,155.5 332.6,155.6 333.7,155.9 334.7,156.5 335.6,157.5 336.5,158.5 337.2,159.6 337.9,160.6 338.6,161.4 339.2,163.0 339.6,163.9"/>
  <text x="52" y="186" font-size="11" fill="#b4232c">perigee</text>
  <text x="195" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">apogee (6 h)</text>
  <text x="345" y="186" font-size="11" text-anchor="end" fill="#b4232c">perigee</text>
  <text x="195" y="201" font-size="11" text-anchor="middle" fill="#6c7a93">time through one 12-hour lap</text>
  <text x="56" y="14" font-size="11" fill="#1f2a44">step size (s)</text>
</svg>
```

The small zigzags near apogee are the controller hunting around its target — the see-sawing a PI term smooths out.
:::

::: context dense-output Filling in between the steps
Inside each step the pair already sampled the slope at several points. Those samples are enough to build a polynomial that follows the solution across the whole step, so you can ask for the state at any time inside it almost for free. The interpolation lesson later in this module builds this kind of machinery from scratch.
:::

::: context wcet Why "worst case" and not "average"
A flight computer's scheduler is like a school timetable: each class gets a fixed slot, and the bell rings whether or not the lesson is over. Planning slots by the *average* lesson length would mean some lessons get cut off. Planning by the *longest possible* length never does. Flight-software reviews ask for evidence that every task fits its slot in the worst case — and "it depends on the data" is not an answer a timetable can use.
:::
