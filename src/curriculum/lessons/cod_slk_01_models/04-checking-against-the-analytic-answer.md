---
id: l04-checking-against-the-analytic-answer
title: Checking a model against the answer you already know
minutes: 21
covers:
  - Comparing a model result to an analytic solution as the first habit
---

Before you trust a new kitchen scale, you put something on it whose weight you already know. A 1 kg bag of sugar should read 1.00 kg. If it reads 1.00, you start trusting the scale with things you do not know. If it reads 1.40, you do not start baking. You fix the scale first.

A Simulink model deserves the same treatment. In lesson 2 you wired Constant, Gain, Sum and Integrator blocks into a first-order lag and a mass-spring-damper, and in lesson 3 you logged their outputs with To Workspace. Both models produce a smooth, believable curve. That is exactly the problem. **Every Simulink model produces a plot, and almost every plot looks reasonable.** A missing minus sign, a gain on the wrong wire, or a step that starts one second late all give curves that look like physics.

This lesson builds the habit that catches those mistakes: **checking against an [[analytic solution|analytic]]**, meaning an exact formula worked out on paper, and measuring the difference number by number. You will derive the exact answers for both models, compare them with the model output to a tolerance of $10^{-6}$, and learn how to tell a solver that is too loose from a diagram that is wrong. GNC teams do this with every new vehicle model before anyone asks it a real question.

## Why a plot is not a check

Look at two curves on a Scope. One is right, the other has its damping gain wired to the wrong signal. Both wiggle and settle. Your eye says "looks like a spring". Your eye cannot tell a 0.25 peak from a 0.43 peak without a number to hold it against.

A **[[reference|independent-reference]]** is an answer you get some other way, which does not share the model's mistakes. For simple systems the best reference is an exact formula. Other good references are a different tool (the Control System Toolbox `step` function you used in the last module), a hand calculation of one point, or a physical law such as "energy stays the same when there is no friction".

::: key
Comparing a model to an analytic solution is the first habit to build because a Simulink model always produces a plot, and a plot always looks plausible. An independent reference, even for a simplified case, is the only cheap way to know the diagram means what you think it means.
:::

The check itself has five steps, and they are the same for every model.

1. Build the model and choose inputs whose exact answer you can compute.
2. Run it and log the output with To Workspace, so you have numbers, not a picture.
3. Compute the reference at **the same time points** the model logged.
4. Take the largest absolute difference: $e_{\max} = \max_i |y_i - y_{\text{ref}}(t_i)|$, read "e max equals the largest, over all samples i, of the size of y i minus y ref at t i".
5. Compare $e_{\max}$ with a threshold you chose in advance, such as $10^{-6}$.

The threshold matters. "Close enough" chosen after you see the plot is not a check. Write the number down first.

## Reference one: the first-order lag

A **first-order lag** is any system that moves toward its target at a speed proportional to how far away it still is. A cup of hot cocoa cooling toward room temperature does this. So does a [[fin actuator|lag-in-flight]] that is told to move to a new angle. The equation is

$$
\tau \dot{y} + y = K u,
$$

where $u$ is the input, $y$ the output, $K$ the **gain** (where $y$ settles for $u = 1$), and $\tau$, read "tau", the **time constant** in seconds (how long the response takes to cover 63.2% of the way). Read $\dot{y}$ as "y dot", the rate of change of $y$.

Solve it for $\dot{y}$ and it tells you how to wire it: $\dot{y} = (Ku - y)/\tau$. The model from lesson 2 does exactly that.

| Block | Parameter | Job |
|---|---|---|
| Step | Step time `0`, Final value `1` | The input $u$ |
| Gain | `K` | Makes $Ku$ |
| Sum | Signs `+-` | Makes $Ku - y$ |
| Gain | `1/tau` | Makes $\dot{y}$ |
| Integrator | Initial condition `0` | Turns $\dot{y}$ into $y$, fed back to the Sum |

For a unit step starting at $t = 0$ with $y(0) = 0$, the exact answer is

$$
y(t) = K\left(1 - e^{-t/\tau}\right).
$$

::: note Why the formula is right
Check it in the equation. Differentiate: $\dot{y} = K \cdot \frac{1}{\tau} e^{-t/\tau}$. Multiply by $\tau$: $\tau\dot{y} = K e^{-t/\tau}$. Add $y$: $K e^{-t/\tau} + K - K e^{-t/\tau} = K$, which is $Ku$ with $u = 1$. The starting value is $y(0) = K(1 - 1) = 0$, as required. A formula that satisfies both the equation and the starting value is the solution, because a first-order equation like this one has exactly one solution from each starting point.
:::

::: example Where the lag should be at four moments
Take $K = 2$ and $\tau = 0.5\,\mathrm{s}$, driven by a unit step at $t = 0$.

**Step 1: the final value.** As $t$ grows, $e^{-t/\tau}$ shrinks to 0, so $y \to K = 2$.

**Step 2: one time constant.** At $t = 0.5\,\mathrm{s}$, $t/\tau = 1$ and $e^{-1} = 0.3679$. So $y = 2(1 - 0.3679) = 1.2642$.

**Step 3: two time constants.** At $t = 1\,\mathrm{s}$, $e^{-2} = 0.1353$, so $y = 2(1 - 0.1353) = 1.7293$.

**Step 4: five time constants.** At $t = 2.5\,\mathrm{s}$, $e^{-5} = 0.0067$, so $y = 2(1 - 0.0067) = 1.9865$.

**Sanity check.** At one time constant the lag has covered 63.2% of the way to 2, which is 1.264. After five time constants it is within 1% of the final value. If your logged output at $t = 0.5$ s reads 1.264 to four figures, the wiring is almost certainly right. If it reads 0.632, the first Gain is 1, not 2.
:::

## Reference two: the mass-spring-damper

Picture a **[[mass-spring-damper|msd-picture]]**: a block of mass $m$ on a spring of stiffness $k$, with a shock absorber of damping $c$, pushed by a force $F$. Newton's second law, force equals mass times acceleration, gives

$$
m\ddot{x} + c\dot{x} + kx = F.
$$

Read $\ddot{x}$ as "x double dot", the acceleration. The spring pulls back with $kx$, the damper resists with $c\dot{x}$, and whatever force is left over accelerates the mass.

The wiring from lesson 2 solves for the acceleration, $\ddot{x} = (F - c\dot{x} - kx)/m$, and integrates twice.

| Block | Parameter | Job |
|---|---|---|
| Step | Step time `0` | The force $F$ |
| Sum | Signs `+--` | Makes $F - c\dot{x} - kx$ |
| Gain | `1/m` | Makes $\ddot{x}$ |
| Integrator 1 | Initial condition `0` | Makes the velocity $\dot{x}$ |
| Integrator 2 | Initial condition `0` | Makes the position $x$ |
| Gain | `c`, fed from Integrator 1 | The damping force |
| Gain | `k`, fed from Integrator 2 | The spring force |

To write the exact answer, use the numbers you met in the last module. The **natural frequency** is $\omega_n = \sqrt{k/m}$ (read "omega n"), the **damping ratio** is $\zeta = c / (2\sqrt{km})$ (read "zeta"), and the **[[damped natural frequency|damped-frequency]]** is $\omega_d = \omega_n\sqrt{1 - \zeta^2}$ (read "omega d"), the rate at which the mass actually wiggles. For $0 < \zeta < 1$ and a unit step force from rest,

$$
x(t) = \frac{1}{k}\left[1 - e^{-\zeta\omega_n t}\left(\cos\omega_d t + \frac{\zeta}{\sqrt{1-\zeta^2}}\sin\omega_d t\right)\right].
$$

The same system as a transfer function is $G(s) = \dfrac{1}{ms^2 + cs + k}$, so `step(tf(1, [m c k]))` is a second, independent reference.

::: example The spring the exercise uses
Take $m = 1\,\mathrm{kg}$, $c = 0.4\,\mathrm{N\,s/m}$, $k = 4\,\mathrm{N/m}$, and a unit step force of 1 N.

**Step 1: natural frequency.** $\omega_n = \sqrt{4/1} = 2\,\mathrm{rad/s}$.

**Step 2: damping ratio.** $\zeta = 0.4 / (2\sqrt{4 \times 1}) = 0.4/4 = 0.1$. Lightly damped, so expect a big overshoot and a lot of ringing.

**Step 3: damped frequency.** $\omega_d = 2\sqrt{1 - 0.01} = 2 \times 0.99499 = 1.9900\,\mathrm{rad/s}$, about 1.99 rad/s.

**Step 4: where it settles.** In the end the spring holds the whole force: $kx = 1$, so $x \to 1/k = 0.25\,\mathrm{m}$.

**Step 5: the first peak.** The peak time is $t_p = \pi/\omega_d = 3.1416/1.9900 = 1.579\,\mathrm{s}$. The overshoot fraction is $M_p = e^{-\pi\zeta/\sqrt{1-\zeta^2}} = e^{-0.3157} = 0.7292$. So the peak is $0.25 \times 1.7292 = 0.4323\,\mathrm{m}$: the first peak is about 1.73 times the final value.

**Sanity check.** A damping ratio of 0.1 should overshoot by a lot, and 73% is a lot. The peak at 1.58 s is half a wiggle period ($2\pi/1.99 = 3.16$ s), which is where the first peak of a ringing response belongs.
:::

::: note Checking the spring formula at the start
At $t = 0$ the bracket is $1 - 1 \cdot (1 + 0) = 0$, so $x(0) = 0$. Differentiating the bracket and setting $t = 0$ gives $\zeta\omega_n - \frac{\zeta}{\sqrt{1-\zeta^2}}\omega_d = \zeta\omega_n - \zeta\omega_n = 0$, so $\dot{x}(0) = 0$: the mass starts at rest. Substituting the formula into $m\ddot{x} + c\dot{x} + kx$ takes a page of algebra and gives 1. A good exercise is to let a computer do that page: evaluate the formula at many times and check the equation numerically.
:::

## Doing the comparison in MATLAB

Put a To Workspace block on the position signal, name the variable `x`, and set its save format to Timeseries, as in lesson 3. Then a short script runs the model and measures the difference.

```matlab
m = 1; c = 0.4; k = 4;
mdl = 'msd';
load_system(mdl);
set_param(mdl, 'StopTime', '20');
out = sim(mdl);
t = out.x.Time;
x = out.x.Data;

wn = sqrt(k/m);  zeta = c/(2*sqrt(k*m));  wd = wn*sqrt(1 - zeta^2);
x_exact = (1/k)*(1 - exp(-zeta*wn*t).*(cos(wd*t) + zeta/sqrt(1-zeta^2)*sin(wd*t)));
e_max = max(abs(x(:) - x_exact(:)));
fprintf('max |model - exact| = %.3e\n', e_max)
```

Notice the reference is computed at `t`, the times the model logged. A variable-step solver chooses its own, unevenly spaced steps, so there is no other set of times the two could share. The formula works at any time you give it. The `step` function is happiest with an evenly spaced time vector, so use it as a cross-check on its own grid: on `t = 0:0.01:20` the formula and `step(tf(1, [m c k]), t)` agree to about $5 \times 10^{-15}$, which is all the digits a double holds. Two references agreeing that closely tells you the formula has no typo.

The `(:)` turns both into column vectors, so the subtraction lines up element by element whatever shape the logged data has.

::: warning The Step block does not start at zero
A new Step block steps at $t = 1\,\mathrm{s}$, not at $t = 0$. The analytic formula assumes the force starts at 0. Leave the default and the model is the right curve shifted one second late, and the "error" is as big as 0.363 m, larger than the final value itself. Set the Step time to 0, or shift the formula by writing $t - 1$ and holding it at zero before $t = 1$. The same care goes for each Integrator's initial condition: the formula assumes both start at 0.
:::

## When they disagree: the solver or the diagram?

Suppose the numbers do not match to $10^{-6}$. There are two suspects, and there is a clean way to tell them apart.

The first suspect is the **solver** from lesson 1, the part of Simulink that steps the states forward in time. A variable-step solver like `ode45` estimates its own error at each step and shrinks the step until that estimate is small enough. "Small enough" is set by two settings in the Configuration Parameters, on the Solver pane.

- **RelTol**, the **[[relative tolerance|tolerances]]**: the allowed error as a fraction of the size of the state. A new model uses $10^{-3}$, one part in a thousand.
- **AbsTol**, the **absolute tolerance**: an error floor in the state's own units, which matters when the state is near zero. A new model uses `auto`, which lets Simulink choose it.

A third setting, **Max step size**, caps how big any step can be. Its default, `auto`, is the simulation length divided by 50: for a 20 s run, 0.4 s.

One part in a thousand is fine for looking at a plot and far too loose for a $10^{-6}$ check. To see how much the tolerance matters, the mass-spring-damper above was solved in Python with a [[Dormand-Prince|dormand-prince]] solver, the same method family as `ode45`, with the 0.4 s step cap, and compared with the exact formula at every solver step.

| RelTol | AbsTol | Solver steps | Largest error (m) | Passes $10^{-6}$? |
|---|---|---|---|---|
| $10^{-3}$ | $10^{-6}$ | 55 | $1.0 \times 10^{-4}$ | No |
| $10^{-6}$ | $10^{-8}$ | 158 | $3.0 \times 10^{-7}$ | Yes |
| $10^{-8}$ | $10^{-10}$ | 389 | $2.7 \times 10^{-9}$ | Yes |
| $10^{-10}$ | $10^{-12}$ | 972 | $2.7 \times 10^{-11}$ | Yes |

Simulink's `ode45` picks slightly different steps, so its exact numbers differ, but the pattern is the same: tighter tolerance, more steps, smaller error. Here, every hundredfold tightening of the tolerance buys a hundredfold or more drop in the error, for two or three times as many steps.

::: key
If the model and the analytic answer differ by more than your threshold, check the solver and its tolerances first. Tighten RelTol and AbsTol (for example `set_param(mdl, 'RelTol', '1e-10', 'AbsTol', '1e-12')`) and run again. If the difference shrinks with the tolerance, it was numerical. If it stays the same size, the diagram is wrong.
:::

The second suspect is the **diagram**. A wiring mistake gives an error that does not care about the tolerance at all.

::: example A gain on the wrong wire
Suppose the damping Gain `c` is fed from the position (Integrator 2) instead of the velocity (Integrator 1). The model now solves $m\ddot{x} + (k + c)x = F$: no damping at all, and a slightly stiffer spring.

**Step 1: what the broken model does.** With $k + c = 4.4$ and no damping, the mass oscillates forever about $1/4.4 = 0.227\,\mathrm{m}$: $x(t) = \frac{1}{4.4}\left(1 - \cos(\sqrt{4.4}\,t)\right)$, with $\sqrt{4.4} = 2.098\,\mathrm{rad/s}$.

**Step 2: the size of the disagreement.** Comparing this with the correct formula over 20 s gives a largest difference of 0.253 m.

**Step 3: tighten the tolerance.** Rerun at RelTol $10^{-10}$. The solver now tracks the broken equation to about $10^{-11}$, so the difference from the correct answer is still 0.253 m.

**Sanity check.** A difference as big as the answer itself, which does not move when the solver gets more careful, is the signature of a diagram error. On a Scope this model looks like a perfectly reasonable spring that rings a lot.
:::

::: warning Tight is not the same as exact
RelTol limits the error the solver makes in each step, not the total error at the end. Small step errors can add up over a long run, so the final difference can be bigger than RelTol. Going the other way, pushing RelTol down toward $10^{-15}$ asks for more digits than a double can hold, and the solver slows to a crawl or warns you. For verification, $10^{-10}$ with AbsTol $10^{-12}$ is a comfortable setting. For everyday runs, a looser tolerance is fine once the model has passed its check.
:::

The tolerance does not hurt every model equally. The first-order lag above, run for 5 s with the default tolerance and its default 0.1 s step cap, already matched its formula to about $10^{-7}$ in the same Python test. A smooth curve that never turns around is easy to follow. The lightly damped spring swings back and forth ten times in 20 s, and the error piles up with each swing. Oscillating systems, like a spacecraft's flexible solar array or a rocket's slosh modes, are exactly where loose tolerances bite.

## Where this habit lives on a real team

Every vehicle model on a GNC team is checked this way before anyone asks it a real question, and the checks never go away. A rigid body with no forces and no torque must keep the same velocity and spin. A spacecraft in a pure two-body orbit must keep the same [[orbital energy|energy-check]]. A linear autopilot must match the transfer function its designer computed by hand. Each is a small case with a known answer, and each is kept as a **[[regression test|regression]]**: a test that is run again after every change, so that a mistake introduced next month is caught next month.

The model will grow nonlinear blocks, lookup tables and switching logic that have no exact formula. The references then become simplified cases (turn the saturation off, set the table to a constant) that still have one. The habit is always the same: know an answer before you look at the plot.

## Check yourself

::: check
A first-order lag has $K = 5$ and $\tau = 2\,\mathrm{s}$. What should the logged output read at $t = 2\,\mathrm{s}$ and at $t = 6\,\mathrm{s}$, for a unit step at $t = 0$?
:::

::: answer
$y(t) = 5(1 - e^{-t/2})$. At $t = 2$ s, $e^{-1} = 0.3679$, so $y = 5 \times 0.6321 = 3.161$. At $t = 6$ s, $e^{-3} = 0.0498$, so $y = 5 \times 0.9502 = 4.751$. Sanity check: one time constant gives 63% of 5, and three time constants give 95%.
:::

::: check
For $m = 2\,\mathrm{kg}$, $c = 1.2\,\mathrm{N\,s/m}$, $k = 18\,\mathrm{N/m}$, find $\omega_n$, $\zeta$, $\omega_d$ and the final position for a 1 N step force.
:::

::: answer
$\omega_n = \sqrt{18/2} = 3\,\mathrm{rad/s}$. $\zeta = 1.2/(2\sqrt{18 \times 2}) = 1.2/12 = 0.1$. $\omega_d = 3\sqrt{1 - 0.01} = 2.985\,\mathrm{rad/s}$. The final position is $1/k = 1/18 = 0.0556\,\mathrm{m}$. Same damping ratio as the lesson's spring, so the same 73% overshoot, on a smaller, faster spring.
:::

::: check
You compare your model with the exact formula and get $e_{\max} = 0.36$, bigger than the final value of 0.25. You tighten RelTol to $10^{-10}$ and get 0.36 again. The curve on the Scope looks like the right shape. What is the likely cause, and how would you confirm it?
:::

::: answer
The error does not change with tolerance, so it is not the solver. The right shape with a big difference suggests a time shift: the Step block is still at its default step time of 1 s, while the formula assumes the force starts at 0. Confirm it by plotting the difference over time (it is large right from the start), or by setting the Step time to 0 and rerunning. The difference should fall to about the tolerance level.
:::

::: check
Why must the reference be computed at the model's logged times, rather than on a neat grid like `0:0.01:20`?
:::

::: answer
A variable-step solver logs at the steps it chose, which are unevenly spaced and different from run to run as tolerances change. To subtract two sets of numbers element by element, they have to be at the same times. The exact formula can be evaluated at any times, so you evaluate it at `out.x.Time`. Interpolating the model onto a neat grid instead would add interpolation error that is not the model's fault.
:::

::: check
A teammate says: "The default tolerance is $10^{-3}$, so my model is accurate to $10^{-3}$." What is wrong with that?
:::

::: answer
RelTol is a target for the error in each step, relative to the size of the state, not a guarantee on the final answer. Step errors can accumulate over a long run, especially in a lightly damped system that oscillates many times, so the total error can be larger than RelTol. The only way to know the accuracy is to measure it against a reference, as this lesson does.
:::

## Summary

| Idea | Meaning | Formula or fact |
|---|---|---|
| Analytic reference | An exact answer that does not share the model's mistakes | Formula, `step` of a transfer function, or a conservation law |
| The check | Largest difference at the logged times | $e_{\max} = \max_i \lvert y_i - y_{\text{ref}}(t_i) \rvert$ against a threshold chosen first |
| First-order lag | $\tau\dot{y} + y = Ku$ | $y(t) = K(1 - e^{-t/\tau})$, 63.2% at $t = \tau$ |
| Mass-spring-damper | $m\ddot{x} + c\dot{x} + kx = F$ | $\omega_n = \sqrt{k/m}$, $\zeta = c/(2\sqrt{km})$, $\omega_d = \omega_n\sqrt{1-\zeta^2}$ |
| Exercise spring | $m = 1$, $c = 0.4$, $k = 4$ | $\omega_d \approx 1.99\,\mathrm{rad/s}$, peak $\approx 1.73 \times$ final value $0.25$ |
| RelTol, AbsTol | Error targets for a variable-step solver | Defaults $10^{-3}$ and `auto`; use about $10^{-10}$ and $10^{-12}$ to verify |
| Solver or diagram? | Tighten the tolerance and rerun | Error shrinks: numerical. Error stays: wiring |

The next lesson puts each of these systems into a single block, Transfer Fcn or State-Space, which gives you a third way to get the same answer, and then shows why the Derivative block, the one continuous block that looks as innocent as the Integrator, does not belong in a feedback loop.

::: context analytic Exact versus numerical
An **analytic** solution is a formula you can write down: put in any time and it gives the exact value. A **numerical** solution is what a solver produces: a list of values at chosen times, each with a small error. Most real vehicle models have no analytic solution, because of drag, changing mass and actuator limits. That is why Simulink exists. But the small pieces of every model (a lag, a spring, a rigid body spinning freely) do have exact answers, and those are the pieces you check first.
:::

::: context independent-reference Why the reference must be independent
If you compute the "reference" by running the same model again, or by copying its equations into a script with the same typo, both will agree and both will be wrong. A useful reference reaches the answer by a different road: a formula derived on paper, a different tool, a different person. Test engineers call this **independence**, and flight software standards ask for it explicitly. The more different the road, the more mistakes it can catch.
:::

::: context lag-in-flight Lags everywhere on a vehicle
A first-order lag is the simplest honest model of anything that cannot move instantly. On a rocket, a fin or engine gimbal actuator is often modeled first as a lag with a time constant of a few hundredths of a second. A temperature sensor bonded to a tank wall is a lag, with a time constant of seconds. A software low-pass filter that smooths a noisy sensor is a lag you choose on purpose.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="120" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="30" x2="340" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="344" y="34" font-size="11" fill="#6c7a93">K</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,120 60,94 80,76 100,63 120,54 140,47 160,42 180,39 200,36 220,34 240,33 260,32 280,32 300,31 320,31 340,31"/>
  <line x1="100" y1="120" x2="100" y2="63" stroke="#b4232c" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="40" y1="63" x2="100" y2="63" stroke="#b4232c" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="100" y="136" font-size="11" fill="#b4232c" text-anchor="middle">t = tau</text>
  <text x="46" y="58" font-size="11" fill="#b4232c">63.2% of K</text>
  <text x="200" y="100" font-size="11" fill="#1d6fd1">y = K(1 - e^(-t/tau))</text>
</svg>
```

The curve covers 63.2% of the way in one time constant and is within 1% after five.
:::

::: context msd-picture The object behind the equation
A mass on a spring, with a damper alongside, pushed by a force. Each term of $m\ddot{x} + c\dot{x} + kx = F$ is one part of the drawing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="14" height="100" fill="#6c7a93"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="34,45 60,45 68,33 84,57 100,33 116,57 132,33 140,45 180,45"/>
  <text x="100" y="24" font-size="12" fill="#1f2a44" text-anchor="middle">spring k</text>
  <line x1="34" y1="95" x2="90" y2="95" stroke="#1f2a44" stroke-width="2"/>
  <rect x="90" y="82" width="46" height="26" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="120" y1="95" x2="180" y2="95" stroke="#1f2a44" stroke-width="2"/>
  <line x1="120" y1="86" x2="120" y2="104" stroke="#1f2a44" stroke-width="2"/>
  <text x="112" y="126" font-size="12" fill="#1f2a44" text-anchor="middle">damper c</text>
  <rect x="180" y="30" width="80" height="80" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="220" y="75" font-size="13" fill="#1f2a44" text-anchor="middle">mass m</text>
  <line x1="260" y1="70" x2="324" y2="70" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="332,70 322,65 322,75" fill="#b4232c"/>
  <text x="300" y="60" font-size="12" fill="#b4232c" text-anchor="middle">force F</text>
  <line x1="180" y1="126" x2="240" y2="126" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="246,126 238,122 238,130" fill="#1d6fd1"/>
  <text x="256" y="130" font-size="11" fill="#1d6fd1">x</text>
</svg>
```

The same equation describes a flexible solar panel bending, propellant sloshing in a tank, and an attitude loop with a proportional-derivative controller, which is why it is the first model every GNC engineer builds.
:::

::: context damped-frequency Why the wiggle is a little slower
With no damping, the mass would swing at $\omega_n$. Damping drags on it, so each swing takes slightly longer, and the actual wiggle rate is $\omega_d = \omega_n\sqrt{1 - \zeta^2}$. For $\zeta = 0.1$ the difference is half a percent (1.990 against 2 rad/s), too small to see on a plot and big enough to fail a $10^{-6}$ check if you used the wrong one in the formula. At $\zeta = 0.7$, a typical autopilot target, $\omega_d$ is only about 71% of $\omega_n$.
:::

::: context tolerances What the two tolerances mean together
At each step the solver estimates the error it made in each state during the step, and accepts the step only if that error is below roughly $\text{RelTol} \times |\text{state}| + \text{AbsTol}$. When the state is large, the relative part dominates. When the state passes near zero, the relative part vanishes and AbsTol stops the solver from chasing impossibly small errors. If a step fails the test, the solver throws it away and tries again with a smaller step. The whole next Simulink module is about solvers, and one lesson there is devoted to these two numbers.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="140" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="195" y="162" font-size="11" fill="#1f2a44" text-anchor="middle">RelTol: 1e-3, 1e-6, 1e-8, 1e-10</text>
  <text x="14" y="80" font-size="11" fill="#1f2a44" transform="rotate(-90 14 80)" text-anchor="middle">largest error (log)</text>
  <rect x="80" y="20" width="36" height="120" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="150" y="56" width="36" height="84" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="220" y="84" width="36" height="56" fill="#8fb8f0" stroke="#1f2a44"/>
  <rect x="290" y="112" width="36" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
  <line x1="50" y1="48" x2="340" y2="48" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <text x="338" y="42" font-size="11" fill="#b4232c" text-anchor="end">1e-6 threshold</text>
  <text x="98" y="16" font-size="11" fill="#1f2a44" text-anchor="middle">1e-4</text>
  <text x="168" y="70" font-size="11" fill="#1f2a44" text-anchor="middle">3e-7</text>
  <text x="238" y="98" font-size="11" fill="#1f2a44" text-anchor="middle">3e-9</text>
  <text x="308" y="126" font-size="11" fill="#1f2a44" text-anchor="middle">3e-11</text>
</svg>
```

The bars are the mass-spring-damper errors from the lesson's table, on a logarithmic scale: each equal step in height is the same factor, and 28 pixels is a factor of 100.
:::

::: context dormand-prince The method inside ode45
`ode45` uses a Runge-Kutta pair published by John Dormand and Peter Prince in 1980. Each step evaluates the equations six times (seven slots, with the last reused as the first of the next step) and combines them two ways: a fifth-order answer and a fourth-order answer. The difference between the two is the error estimate the tolerances are checked against. SciPy's `RK45` uses the same pair, which is why it makes a fair stand-in here, though its step-size rules differ in detail.
:::

::: context energy-check Conservation laws as free references
When there is no drag and no thrust, a satellite's orbital energy per kilogram, $\frac{v^2}{2} - \frac{\mu}{r}$, stays exactly constant. Nobody needs to solve the orbit to know that. Log $v$ and $r$ from the model, compute the energy at every step, and watch how much it drifts. A drift of one part in a billion over a day of simulated flight is a well-tuned solver. A drift that grows steadily means the tolerance is too loose or the gravity model has a mistake.
:::

::: context regression Tests that run forever
A **regression** is a feature that used to work and now does not. A regression test is a saved check, like this lesson's comparison, that is rerun automatically after every change to the model. Teams keep hundreds of them, and a change that breaks one is not merged until it is fixed. The verification module at the end of the Simulink track builds these with Simulink Test, which can compare a run with a saved baseline within a tolerance you set.
:::
