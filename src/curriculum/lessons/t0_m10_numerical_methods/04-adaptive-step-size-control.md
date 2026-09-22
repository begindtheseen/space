---
id: l04-adaptive-step-size-control
title: Adaptive step-size control
minutes: 26
covers:
  - adaptive step-size control
---

A fixed-step integrator takes the same step at every point of the solution, so its step must be sized for the hardest point. On a circular orbit every point is equally hard and nothing is lost. On a Molniya orbit with $e = 0.7$ the speed at perigee is $9.21\,\mathrm{km/s}$ and at apogee $1.63\,\mathrm{km/s}$, and the gravitational acceleration, which scales as $1/r^2$, is 32 times larger at perigee than at apogee. A step small enough for the perigee pass is thirty times smaller than the apogee needs, and the vehicle spends most of its twelve-hour period near apogee. Fixed-step RK4 wastes most of its evaluations there.

The remedy is to let the integrator measure its own local error every step and choose the next step from the measurement: large where the solution is smooth, small where it bends. This lesson builds that machinery in three parts — an error estimate that costs almost nothing extra, a norm that turns a vector of errors into one number against a tolerance, and a control law that turns that number into the next step size. The control law is the one formula on the module's flashcards, $h_{\text{new}} = h \cdot \text{safety} \cdot (\text{tol}/\text{err})^{1/(p+1)}$, and by the end of the lesson you will know where every symbol in it comes from and why the exponent is what it is.

The lesson ends with the case where adaptive stepping is the wrong answer: inside a fixed-rate flight control loop, where the property that makes it efficient — the amount of work depends on the data — is the property a real-time scheduler cannot tolerate.

## Estimating the local error with an embedded pair

To control the step you need the local error of the step, and the exact solution is not available. The trick is to compute two approximations of different order from the *same* stage evaluations and take their difference. A Runge–Kutta *embedded pair* has one set of stages $\mathbf{k}_1, \ldots, \mathbf{k}_s$ and two sets of weights, $b_i$ giving an order-$p$ result and $\hat{b}_i$ giving an order-$(p+1)$ result:

$$
\mathbf{y}_{n+1}^{(p+1)} = \mathbf{y}_n + h\sum_i \hat{b}_i\,\mathbf{k}_i, \qquad
\mathbf{y}_{n+1}^{(p)} = \mathbf{y}_n + h\sum_i b_i\,\mathbf{k}_i, \qquad
\mathbf{e}_{n+1} = \mathbf{y}_{n+1}^{(p+1)} - \mathbf{y}_{n+1}^{(p)} .
$$

The higher-order result has local error $O(h^{p+2})$, the lower has $O(h^{p+1})$, so their difference is, to leading order, the local error of the *lower-order* result. That is what $\mathbf{e}_{n+1}$ estimates. The step is then continued from the higher-order result, which is more accurate than the thing whose error you measured — a practice called *local extrapolation*. It is slightly dishonest, since you control the error of a solution you do not use, but the higher-order solution is always at least as good, so the control is conservative.

The pair in `solve_ivp`'s default method, in MATLAB's `ode45`, and in most of the simulators you will inherit is the **Dormand–Prince 5(4)** pair, usually written RK45. It has seven stages at nodes $c = (0, \tfrac15, \tfrac{3}{10}, \tfrac45, \tfrac89, 1, 1)$. The fifth-order weights are

$$
\hat{b} = \left(\tfrac{35}{384},\ 0,\ \tfrac{500}{1113},\ \tfrac{125}{192},\ -\tfrac{2187}{6784},\ \tfrac{11}{84},\ 0\right),
$$

and the fourth-order weights are

$$
b = \left(\tfrac{5179}{57600},\ 0,\ \tfrac{7571}{16695},\ \tfrac{393}{640},\ -\tfrac{92097}{339200},\ \tfrac{187}{2100},\ \tfrac{1}{40}\right).
$$

Seven stages sounds expensive next to RK4's four, but the seventh stage is evaluated at $t_n + h$ with the fifth-order solution as its state, which is exactly $\mathbf{k}_1$ of the *next* step. This "first same as last" property, FSAL, means an accepted step costs six evaluations of $\mathbf{f}$, not seven. You do not need to memorise the coefficients; you need to know what the two weight sets are for and that the difference between them is the error estimate.

::: example Reading the error estimate on the test problem
Take $\dot y = -y$, $y_0 = 1$, one Dormand–Prince step of $h = 0.1$. The fifth-order result is $y^{(5)} = 0.904837418333$ and the difference of the two weight sets gives $e = 8.41 \times 10^{-9}$. Against the exact $e^{-0.1} = 0.904837418036$:

- the fifth-order result is in error by $3.0 \times 10^{-10}$;
- the fourth-order result, $y^{(5)} - e$, is in error by $-8.1 \times 10^{-9}$.

The estimate $8.4 \times 10^{-9}$ is the fourth-order solution's error to within 4%, as it should be, and it overstates the fifth-order solution's error by a factor of 28. The controller sees the conservative number.

Now the same from $h = 0.5$: $e = 3.07 \times 10^{-5}$, while the true fifth-order error is $5.8 \times 10^{-6}$. Halving the step from 0.4 to 0.2 on the Molniya orbit later in this lesson divides the estimate by exactly 32.0, confirming that $e$ scales as $h^5$: it is measuring an $O(h^{p+1})$ quantity with $p = 4$.
:::

A pair is not the only way to get an estimate. *Step doubling* takes one step of $2h$ and two steps of $h$ with any method and differences the results; Richardson's argument gives the error of the two-step result as the difference divided by $2^p - 1$. It costs about three times the work of a plain step and needs no special coefficients. Embedded pairs exist because that cost was worth removing.

## From a vector of errors to one number

The state has components with different units and magnitudes: kilometres in one slot, kilometres per second in another, radians and radians per second in an attitude problem. A single tolerance in absolute terms is meaningless across them, and a purely relative tolerance fails whenever a component passes through zero, which every velocity component of an orbit does twice a revolution. The standard cure is a two-part tolerance per component, the same construction the floating-point lesson used for comparisons:

$$
\mathrm{sc}_i = \text{atol}_i + \text{rtol} \cdot \max\left(|y_{n,i}|,\ |y_{n+1,i}|\right),
$$

and the scaled error norm

$$
E = \sqrt{\frac{1}{n}\sum_{i=1}^{n}\left(\frac{e_{n+1,i}}{\mathrm{sc}_i}\right)^2} .
$$

The step is *accepted* when $E \le 1$ — every component's error is, on average, within its own tolerance — and *rejected* otherwise, in which case it is retried with a smaller $h$ from the same $\mathbf{y}_n$. A rejected step still costs its six evaluations; a well-tuned controller rejects a few percent of steps, not a third.

Setting the tolerances is engineering, not mathematics. rtol says how many significant digits you want: $10^{-8}$ is eight digits. atol says the level below which you stop caring about a component in absolute terms; for an orbit in kilometres, an atol of $10^{-3}\,\mathrm{km}$ on position and $10^{-6}\,\mathrm{km/s}$ on velocity says "a metre and a millimetre per second are noise". Setting atol to zero is a common mistake: when a component crosses zero its scale vanishes, the error ratio blows up, and the integrator grinds to a halt with a step that shrinks without limit.

## The control law

Suppose the step just taken, of size $h$, produced a scaled error $E$. The estimate measures an $O(h^{p+1})$ quantity, so a step of size $h_{\text{new}}$ would have produced, to leading order,

$$
E_{\text{new}} = E\left(\frac{h_{\text{new}}}{h}\right)^{p+1} .
$$

You want $E_{\text{new}} = 1$, right at the tolerance. Solving,

$$
h_{\text{new}} = h\left(\frac{1}{E}\right)^{1/(p+1)} .
$$

Two refinements make this usable. First, aiming exactly at the tolerance means about half of all steps will land slightly above it and be rejected, because the leading-order model is not exact. A *safety factor* of about 0.9 aims a little inside the boundary. Second, the leading-order model is only trustworthy for modest changes in $h$, so the growth and shrink factors are clamped, typically to between 0.2 and 5. With $E$ written as $\text{err}/\text{tol}$ for a scalar problem, the law is

$$
h_{\text{new}} = h \cdot \text{safety} \cdot \left(\frac{\text{tol}}{\text{err}}\right)^{1/(p+1)},
\qquad \text{safety} \approx 0.9, \quad 0.2 \le \frac{h_{\text{new}}}{h} \le 5 .
$$

For Dormand–Prince the error estimate is that of the fourth-order member, so $p = 4$ and the exponent is $1/5$. The exponent is small: a step whose error was a hundred times too large is shrunk by only a factor of $100^{1/5} = 2.5$. That is the right response — the error scales steeply with $h$, so a small change in $h$ makes a large change in error — and it is also why adaptive integrators respond gently rather than oscillating between huge and tiny steps.

::: key
Step-size controller: $h_{\text{new}} = h \cdot \text{safety} \cdot (\text{tol}/\text{err})^{1/(p+1)}$, with safety $\approx 0.9$ and the ratio $h_{\text{new}}/h$ clamped to about $[0.2, 5]$. The exponent is $1/(p+1)$ because the estimated error is a local error, $O(h^{p+1})$, with $p$ the order of the lower member of the pair; for Dormand–Prince 5(4), $p = 4$ and the exponent is $1/5$. Accept the step when the scaled error $E \le 1$; otherwise reject, shrink and retry from the same state.
:::

::: example One controller decision
$\dot y = -y$ from $y_0 = 1$, tolerance $10^{-8}$ (atol only, for a scalar), a trial step of $h = 0.5$. The estimate from the worked example above is $\text{err} = 3.07 \times 10^{-5}$, so $E = 3.07 \times 10^{-5}/10^{-8} = 3{,}070$. The step is rejected. The controller proposes

$$
h_{\text{new}} = 0.5 \times 0.9 \times \left(\frac{1}{3{,}070}\right)^{1/5} = 0.5 \times 0.9 \times 0.2007 = 0.0903 .
$$

The ratio $0.18$ is inside the clamp of $0.2$ only just — a controller with the clamp active would propose $0.1$ instead. Retrying at $h = 0.1$ gives $\text{err} = 8.41 \times 10^{-9}$, $E = 0.84$, and the step is accepted. The next proposal is $0.1 \times 0.9 \times (1/0.84)^{1/5} = 0.093$: the controller has found the step that keeps the error at the tolerance and will hold near it, drifting slowly larger as the solution decays and its derivatives shrink. Integrating to $t = 10$ at $\text{rtol} = 10^{-8}$ takes 97 accepted steps, no rejections, and 582 evaluations, with the step ranging from $0.093$ to $0.16$.
:::

In code the loop is short, and the shape is worth knowing by heart:

```python
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

Production controllers add a *PI* term that also looks at the previous step's $E$, which damps the oscillation a proportional-only controller shows on problems whose smoothness changes abruptly, and they refuse to grow $h$ immediately after a rejection. The skeleton above is the whole idea.

## The Molniya orbit, adaptively

Return to the orbit that opened the lesson: $a = 26{,}600\,\mathrm{km}$, $e = 0.7$, perigee $7{,}980\,\mathrm{km}$, apogee $45{,}220\,\mathrm{km}$, period $T = 43{,}175\,\mathrm{s}$. Start at perigee and propagate one period with Dormand–Prince, atol $= 10^{-3}\,\text{rtol} \times r_p$ on every component, initial step 1 s, and measure the position error at the end against the exact starting point:

| rtol | accepted | rejected | evaluations | position error after one period |
| --- | --- | --- | --- | --- |
| $10^{-6}$ | 41 | 13 | 324 | $9.4\,\mathrm{km}$ |
| $10^{-8}$ | 93 | 10 | 618 | $61\,\mathrm{m}$ |
| $10^{-10}$ | 229 | 5 | 1,404 | $0.34\,\mathrm{m}$ |
| $10^{-12}$ | 575 | 3 | 3,468 | $2.1\,\mathrm{mm}$ |

Two regularities are in the table. Tightening the tolerance by 100 increases the step count by $100^{1/5} = 2.5$ each time — $41 \to 93 \to 229 \to 575$ are ratios of 2.3, 2.5, 2.5 — because the step scales as $\text{tol}^{1/5}$. And the global error falls by 150 to 180 for each factor of 100 in tolerance, faster than the tolerance itself, because the controlled quantity is the fourth-order local error while the propagated solution is fifth order.

At $\text{rtol} = 10^{-8}$ the accepted steps tell the story of the orbit. From the 1 s initial guess the controller grows by its clamp factor of 5 twice, to 25 s, then settles: $53, 65, 73, 80, 87\,\mathrm{s}$ through the perigee region. By apogee the steps are $1{,}400$ to $1{,}500\,\mathrm{s}$ — twenty-five minutes — and on the way back down they shrink again to $111, 101, 91, 75, 66\,\mathrm{s}$ as perigee approaches. The natural perigee step is about $65\,\mathrm{s}$ and the apogee step about $1{,}500\,\mathrm{s}$, a ratio of 23; the acceleration ratio of 32 predicts the right order of magnitude, softened by the fifth root in the control law.

Fixed-step RK4 on the same orbit needs $1{,}000$ steps of $43\,\mathrm{s}$ to reach the same $60\,\mathrm{m}$ error: $4{,}000$ evaluations against 618, a factor of 6.5. At $h = 144\,\mathrm{s}$, near the average adaptive step, fixed RK4's error is $9.8\,\mathrm{km}$, because that step is far too long at perigee. The adaptive integrator did not use a better formula; it put its evaluations where the acceleration was changing.

::: warning
An adaptive integrator lands where its controller sends it, not at the times you want output. Do not shorten steps to hit output times — that changes the error behaviour and can double the step count for a dense output grid. Integrate with the natural steps and interpolate to the output times using the *dense output* the pair provides, a polynomial through the stage values that is accurate to the method's order across the step. The interpolation lesson later in this module explains the machinery; every production adaptive solver, including `solve_ivp` with `dense_output=True`, has it built in.
:::

::: warning
Tolerance is not accuracy. The controller keeps the *local* error near the tolerance each step; the *global* error after a long integration is the accumulation of those local errors, propagated by the dynamics. On the Molniya orbit $\text{rtol} = 10^{-8}$ gave a position error of $61\,\mathrm{m}$ on a $45{,}000\,\mathrm{km}$ orbit — a relative error of $1.4 \times 10^{-6}$, a hundred times the tolerance. After a hundred revolutions it will be larger still. To know the global error, run twice at tolerances a factor of 100 apart and difference the results; never read it off the tolerance.
:::

## Adaptive stepping in flight software

Everything above is for simulation and analysis, where the computer can take as long as it needs. A flight computer cannot. The guidance and control loop runs at a fixed rate — 50, 100, 400 Hz — and every task in the frame must finish before the next frame starts. The scheduler is verified against each task's *worst-case execution time*, and a task whose execution time cannot be bounded cannot be scheduled.

An adaptive integrator's execution time depends on the data. Through a smooth stretch it takes one step; through a thruster firing or a rapid slew it may take twenty, each with six evaluations of the dynamics. The worst case is not "twenty" — it is "however many the controller decides", and a rejected-step loop with a badly set atol can decide on thousands. That is why flight code propagates with a fixed-step method at the loop rate, most often RK4, sometimes RK2 or the trapezoidal rule when the model is cheap and the rate is high, with the step validated offline by running it against a high-accuracy adaptive reference in simulation. The adaptive integrator's place is in that offline reference, in mission analysis, and in the ground system's ephemeris generation — everywhere the answer matters more than the deadline.

::: key
Adaptive step-size control makes execution time data-dependent, so it destroys the worst-case timing bound a real-time scheduler needs. Flight software uses a fixed-step integrator at the control-loop rate, with the step chosen and validated offline against an adaptive high-accuracy reference. Adaptive RK45 belongs in simulation, analysis and ground systems.
:::

## Check yourself

::: check
A Runge–Kutta pair of orders 8 and 7, such as the Dormand–Prince 8(7) pair used for high-precision ephemerides, propagates the eighth-order solution. What exponent does its step controller use, and by what factor does it shrink the step after a step whose scaled error was $E = 500$?
:::

::: answer
The error estimate is the local error of the lower-order member, order $p = 7$, which is $O(h^{8})$, so the exponent is $1/(p+1) = 1/8$. With safety 0.9, the proposed ratio is $0.9 \times (1/500)^{1/8} = 0.9 \times 0.4599 = 0.41$. High-order pairs respond even more gently than fifth-order ones, because their error depends even more steeply on $h$.
:::

::: check
A propagator with $\text{atol} = 0$ and $\text{rtol} = 10^{-10}$ runs normally for a quarter of an orbit and then stalls with the step size shrinking towards zero. Explain what happened and the fix.
:::

::: answer
A quarter of an orbit after starting at $\mathbf{r} = (r_0, 0)$ with $\mathbf{v} = (0, v_0)$, the $y$-velocity component passes through zero. With $\text{atol} = 0$ its scale $\mathrm{sc}_i = \text{rtol}\,|y_i|$ vanishes as $y_i \to 0$, so the ratio $e_i/\mathrm{sc}_i$ becomes huge whatever the actual error, $E \gg 1$, and every step is rejected and shrunk. The fix is a non-zero atol per component at the level below which you do not care: for instance $10^{-6}\,\mathrm{km/s}$ on velocity and $10^{-3}\,\mathrm{km}$ on position.
:::

::: check
On the Molniya orbit the run at $\text{rtol} = 10^{-12}$ took 575 accepted steps. Predict the count at $\text{rtol} = 10^{-14}$, then say why the prediction would not be achieved in `float64`.
:::

::: answer
The step scales as $\text{tol}^{1/5}$, so a hundredfold tighter tolerance multiplies the step count by $100^{1/5} = 2.51$: about $1{,}440$ steps. It would not happen. At $\text{rtol} = 10^{-14}$ the requested local error on a $45{,}000\,\mathrm{km}$ position is $4.5 \times 10^{-10}\,\mathrm{km}$, below the spacing of `float64` numbers at that magnitude ($2^{15-52}\,\mathrm{km} = 7.3 \times 10^{-12}\,\mathrm{km}$, so about 60 ulps) and comparable with the round-off in the stage sums. The error estimate becomes round-off noise, steps are rejected at random, and the integrator either stalls or delivers a solution no more accurate than at $10^{-12}$. Tolerances tighter than about $10^{3}\varepsilon$ are asking the arithmetic for something it does not have.
:::

::: check
Two controllers are proposed for a Dormand–Prince integrator: (a) $h_{\text{new}} = h\,(1/E)^{1/5}$ with no safety factor and no clamp; (b) the standard law with safety 0.9 and clamp $[0.2, 5]$. On a smooth problem, which rejects more steps, and what goes wrong with (a) when the dynamics change abruptly — a thruster switching on?
:::

::: answer
(a) rejects more. It aims exactly at $E = 1$, and since the $h^5$ scaling is only the leading term, about half of the steps land slightly above the tolerance and are rejected, each wasting six evaluations. The safety factor in (b) aims at $E \approx 0.9^5 = 0.59$, well inside the boundary, and rejections drop to a few percent. At a thruster ignition the error of the first step across the discontinuity is enormous — the Taylor expansion the estimate relies on does not exist there — so (a) can shrink $h$ by a factor of $1{,}000$ in one decision, then take dozens of steps to recover. The clamp in (b) limits any single change to a factor of 5 in either direction, so recovery takes a few steps rather than dozens, and the integrator does not overreact to one bad estimate.
:::

::: check
Your colleague argues that since adaptive RK45 needed six times fewer evaluations than fixed RK4 for the same accuracy on the Molniya orbit, it should replace RK4 in the vehicle's on-board propagator. Give the two-sentence rebuttal, and say what the adaptive integrator *should* be used for in that project.
:::

::: answer
The on-board propagator runs inside a fixed-rate loop whose scheduler needs a bounded worst-case execution time, and an adaptive integrator's work per frame depends on the data — one step through apogee, many through a burn — so it cannot be bounded and cannot be scheduled. Fixed-step RK4 at the loop rate is deterministic and, with a step validated offline, accurate enough. The adaptive integrator's job is to *be* that offline validation: generate the high-accuracy reference trajectory at $\text{rtol} = 10^{-12}$ that the flight propagator is compared against, and produce the ground ephemerides.
:::

## Summary

| Item | Statement |
| --- | --- |
| Embedded pair | Same stages $\mathbf{k}_i$, two weight sets; $\mathbf{e} = \mathbf{y}^{(p+1)} - \mathbf{y}^{(p)}$ estimates the local error of the order-$p$ result |
| Dormand–Prince 5(4) | 7 stages, FSAL so 6 evaluations per accepted step; propagates the 5th-order result; $p = 4$ |
| Scaled error | $\mathrm{sc}_i = \text{atol}_i + \text{rtol}\max(\lvert y_{n,i}\rvert, \lvert y_{n+1,i}\rvert)$, $E = \sqrt{\tfrac{1}{n}\sum (e_i/\mathrm{sc}_i)^2}$; accept if $E \le 1$ |
| Control law | $h_{\text{new}} = h \cdot \text{safety} \cdot (\text{tol}/\text{err})^{1/(p+1)}$, safety $\approx 0.9$, ratio clamped to $[0.2, 5]$ |
| Scaling | Step count $\propto \text{tol}^{-1/(p+1)}$: 100× tighter tolerance costs 2.5× more steps for a 5(4) pair |
| Molniya, rtol $10^{-8}$ | 93 steps, 618 evaluations, $61\,\mathrm{m}$ after one period; steps $65\,\mathrm{s}$ at perigee, $1{,}500\,\mathrm{s}$ at apogee; fixed RK4 needs 4,000 evaluations |
| Output | Use dense output; never shorten steps to hit output times |
| Flight software | Fixed-step at the loop rate; adaptive stepping breaks worst-case execution time |

The next lesson asks what happens to these integrators — fixed or adaptive — over a thousand revolutions rather than one, and finds that the answer depends on a property none of them has: the preservation of the orbit's geometry, which is what a symplectic integrator offers and what an energy check detects.
