---
id: l02-variable-step-solvers-and-tolerances
title: 'ode45, ode23, ode113 and the tolerances that steer them'
minutes: 27
covers:
  - 'Continuous solvers: ode45 (Dormand-Prince, the default starting point), ode23, ode113'
  - RelTol and AbsTol; max step size and when to constrain it
---

To get to the corner store, you walk. To cross town, you ride a bike. To cross the country, you take a train. The train has the most overhead: you must get to the station, and it runs only on track laid down ahead of time. But once it is moving, nothing covers long distances more cheaply. For a short trip, walking wins.

In lesson 1 you watched a variable-step solver try a step, estimate its error from two answers, and accept or reject. Simulink offers several solvers that run this loop, and they differ the way the walker, the cyclist and the train do. `ode23` is cheap per step and suits low accuracy targets. `ode45` is the all-rounder and the default. `ode113` runs on the "track" of its own past steps, and it wins when you need many digits from a smooth problem, like an orbit propagated for days.

How far you are going is set by the **tolerances**, RelTol and AbsTol, the limits the error estimate is compared against, plus the maximum step size. Together they decide how hard the solver works and whether its answer means anything. This lesson covers the three solvers, then the three settings.

## Order: why some solvers take bigger steps

The **[[order|order]]** of a method, written $p$, says how fast its error shrinks as the step gets smaller. For a method of order $p$, the error made in one step behaves like

$$
e_{\text{step}} \approx C\, h^{p+1}
$$

where $C$ depends on how curvy the solution is. Read it as "the step error is about C times h to the p plus one". Over a whole run the step errors add up, and the total error behaves like $h^p$. Euler is order 1: halve the step, halve the total error. RK4 is order 4: halve the step and the total error drops by $2^4 = 16$.

A variable-step solver turns this around. It is told the error it may make per step, the tolerance, and it takes the biggest step that meets it:

$$
h \approx \left(\frac{\text{tol}}{C}\right)^{1/(p+1)}
$$

So the number of steps grows like $\text{tol}^{-1/(p+1)}$ as the tolerance gets tighter. The higher the order, the more slowly the step count grows. Tighten the tolerance a thousandfold, from $10^{-6}$ to $10^{-9}$, and a method whose step error goes like $h^3$ needs $1000^{1/3} = 10$ times as many steps. One whose step error goes like $h^5$ needs only $1000^{1/5} \approx 4$ times as many.

The catch is cost per step. A higher-order Runge–Kutta method asks for more slopes inside each step. So low order wins when you want few digits, and high order wins when you want many. That is the whole story behind the choice between `ode23` and `ode45`.

::: key
A method of order $p$ has a step error of about $C h^{p+1}$ and a total error of about $h^p$. At a tolerance tol, a variable-step solver's step count grows like $\text{tol}^{-1/(p+1)}$: higher order costs more per step but needs far fewer steps at tight tolerances.
:::

## ode45: Dormand–Prince, the default starting point

`ode45` uses the **Dormand–Prince** pair, a fourth-order and a fifth-order Runge–Kutta method that share their slope evaluations. It is written 4(5): the difference between the two answers is the error estimate, and the solver keeps the fifth-order answer. Each step has seven slope samples, but the last one is taken at the end of the step, at the new state, and becomes the first sample of the next step. This trick is called **[[first same as last|fsal]]**, and it means an accepted step costs six new derivative evaluations.

`ode45` is a **[[one-step|one-step]]** method: it needs only the current state, nothing from earlier steps. So after a zero crossing, a Step block's jump or any other sudden change, it carries on at full strength immediately. It suits most models at the accuracies engineers usually want, which is why MathWorks recommends it as the first solver to try, and why Simulink's automatic selection chooses it for most models with continuous states.

::: key
ode45 is Dormand–Prince 4(5): a one-step Runge–Kutta pair, six derivative evaluations per accepted step, keeping the fifth-order answer. It is the default starting point for a continuous model.
:::

## ode23: Bogacki–Shampine, for rough trips

`ode23` uses the **Bogacki–Shampine** pair, written 2(3): a second-order and a third-order method sharing four slope samples, with the same first-same-as-last trick, so three new evaluations per step. It keeps the third-order answer.

Three evaluations per step instead of six makes each step half the price of an `ode45` step. When the tolerance is loose, that wins. MathWorks also suggests it for models that are **[[mildly stiff|mild-stiffness]]**, meaning they have a motion somewhat faster than the rest, because its steps are cheap even when they must be small. When you need many digits, its low order makes it take far too many steps.

## ode113: Adams–Bashforth–Moulton, riding on past steps

`ode113` works differently. It is a **multistep** method: it remembers the slopes from several past steps and fits a smooth curve through them. That curve predicts where the state is going. Each step is a **[[PECE|pece]]** cycle:

1. **Predict**: extend the curve through the past slopes to guess the new state (the **Adams–Bashforth** formula).
2. **Evaluate**: compute the slope at that guess.
3. **Correct**: refit the curve including the new slope and improve the guess (the **Adams–Moulton** formula).
4. **Evaluate**: compute the slope at the corrected state, ready for the next step.

The gap between prediction and correction is the error estimate. However many past slopes the curve uses, a step costs two derivative evaluations. More past points means a higher order, and `ode113` raises and lowers its order as it goes, up to 13 in MATLAB's implementation. On a smooth problem at a tight tolerance it runs at high order for two evaluations a step, which no Runge–Kutta method can match. So it shines where each evaluation is expensive, such as an orbit with a detailed gravity model.

Its weakness is the track. After a discontinuity, such as a zero crossing, a reset or an engine cutoff, the history describes a different curve. The solver must throw it away and restart at order 1 with small steps. A model full of switching logic keeps knocking `ode113` back to the start.

::: key
ode23 is Bogacki–Shampine 2(3), three evaluations per step: cheapest at crude tolerances and with mild stiffness. ode113 is a variable-order Adams–Bashforth–Moulton PECE method, two evaluations per step: best at tight tolerances on smooth models with expensive derivatives, and poor when frequent discontinuities keep resetting its history.
:::

::: example One orbit, three solvers
A satellite in a circular orbit of radius $7000\,\mathrm{km}$ comes back to its starting point after one period, $T = 2\pi\sqrt{r^3/\mu} = 5829\,\mathrm{s}$ (with $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$). So the distance between the start and the end of a one-orbit simulation is the solver's error. Each solver was run in Python with the maximum step capped at $T/50 = 117\,\mathrm{s}$, tightening the tolerance until the error fell below a target. SciPy's `RK23` and `RK45` use the same pairs as `ode23` and `ode45`. SciPy has no `ode113`, so a close relative stands in: the variable-order Adams method in its VODE integrator.

| Solver family | Evaluations for error below 1 m | Evaluations for error below 1 mm |
|---|---|---|
| Bogacki–Shampine (`ode23`) | 4,271 | 35,795 |
| Dormand–Prince (`ode45`) | 440 | 1,712 |
| Adams, variable order (`ode113`) | 234 | 306 |

**Reading the table.** For 1 m, `ode45` does about a tenth of `ode23`'s work, and the Adams method about half of `ode45`'s. For 1 mm, the gaps grow: `ode23` needs about 21 times `ode45`'s work, and the Adams method needs less than a fifth of it.

**Sanity check.** Asking for 1000 times more accuracy multiplied `ode23`'s work by $35795/4271 = 8.4$, close to the $1000^{1/3} = 10$ that its step error of $h^3$ predicts. `ode45`'s work grew by $1712/440 = 3.9$, close to $1000^{1/5} \approx 4$. The order argument holds.
:::

In MATLAB or Octave you can make the same comparison with the real `ode45` and `ode23`. This script runs in both. The numbers shown are Octave 8.4's; MATLAB's step counts differ a little.

```matlab
mu = 3.986004418e14;                 % Earth's GM, m^3/s^2
r0 = 7000e3;  v0 = sqrt(mu/r0);      % circular orbit, radius 7000 km
T  = 2*pi*sqrt(r0^3/mu);             % one period, about 5829 s
f  = @(t, s) [s(4:6); -mu*s(1:3)/norm(s(1:3))^3];
x0 = [r0; 0; 0; 0; v0; 0];
for rt = [1e-3 1e-6 1e-9]
  opts = odeset('RelTol', rt, 'AbsTol', 1e-6, 'MaxStep', T/50);
  a = ode45(f, [0 T], x0, opts);
  b = ode23(f, [0 T], x0, opts);
  fprintf('%g: ode45 %4d steps, %.2g m | ode23 %4d steps, %.2g m\n', rt, ...
          numel(a.x)-1, norm(a.y(1:3,end) - x0(1:3)), ...
          numel(b.x)-1, norm(b.y(1:3,end) - x0(1:3)));
end
% 0.001: ode45   67 steps, 2.9 m | ode23   70 steps, 7.3e+03 m
% 1e-06: ode45   69 steps, 2.9 m | ode23  386 steps, 35 m
% 1e-09: ode45  162 steps, 0.012 m | ode23 3804 steps, 0.036 m
```

Look at the `ode45` column: 67 and 69 steps, the same 2.9 m error at two very different tolerances. The step cap is doing the work there, not the tolerance. The next two sections explain both.

## RelTol and AbsTol: what "small enough" means

The error estimate from lesson 1 has to be compared with something. Simulink compares the estimated error $e_i$ in each state $x_i$ with a limit built from two numbers:

$$
e_i \le \max\left(\text{RelTol} \cdot |x_i|,\ \text{AbsTol}_i\right)
$$

Read it as "the error in state i must be no bigger than the larger of RelTol times the size of that state, and that state's AbsTol".

- **RelTol**, the **relative tolerance**, is a fraction of the state's own size. The default is $10^{-3}$: each step may be off by 0.1% of the state.
- **AbsTol**, the **absolute tolerance**, is a floor in the state's own units. When a state is large, RelTol sets the limit. When a state is near zero, $\text{RelTol} \cdot |x_i|$ shrinks toward nothing, and AbsTol takes over so that the solver does not chase impossibly tiny errors. The default is `auto`.

Simulink's documentation describes `auto` like this: with the default RelTol, each state's AbsTol starts at $10^{-6}$, and as the run goes on it is adjusted to RelTol times the largest magnitude that state has reached so far. An Integrator block also has its own **Absolute tolerance** box, so one state can be given its own value while the rest stay on `auto`.

Two warnings are hidden in those definitions. RelTol is a fraction, so it is only as small as the state is large. And AbsTol is in the state's units, so no single number suits a model whose states are measured in very different sizes.

::: example What RelTol = 0.001 means for an orbit
In the orbit above, the position is about $7 \times 10^6\,\mathrm{m}$ from Earth's center. How big an error does the default RelTol allow per step?

**Step 1: the limit.** $\text{RelTol} \cdot |x| = 10^{-3} \times 7 \times 10^{6} = 7000\,\mathrm{m}$. Each step may put the satellite up to 7 km off.

**Step 2: what happens.** Octave's `ode45` at RelTol $10^{-3}$ with no step cap took only 32 steps, some as long as 583 s, and ended the orbit 112 km from where it started. SciPy's version of the same pair, with its own step-size rules, ended 1850 km away.

**Step 3: the fix.** Asking for errors of about 1 cm needs RelTol near $10^{-9}$: the table in the `ode45` script shows 0.012 m.

**Sanity check.** 0.1% is a fine target for a temperature or an actuator angle. For a quantity as large as an orbit radius, 0.1% is a whole city. Before trusting the default, multiply RelTol by the size of your biggest state and ask whether that error is acceptable per step.
:::

AbsTol matters most in the opposite case: a state that is small in its own units, all the time, and still important.

::: example A vibration the solver cannot see
A spacecraft's solar array has a lightly damped bending mode at 1 Hz (damping ratio 0.005). Pointing engineers care about wobbles of $10^{-5}\,\mathrm{rad}$, about [[2 arcseconds|arcseconds]]. The mode is simulated for 20 s from an initial twist, at RelTol $10^{-3}$ with the default step cap of 0.4 s, first with a twist of 1 rad and then with $10^{-5}$ rad. The physics is the same; only the size differs. The table shows the largest error as a fraction of the starting twist.

| AbsTol | Error, 1 rad twist | Error, $10^{-5}$ rad twist |
|---|---|---|
| $10^{-3}$ | 3.1% | 40,900% |
| $10^{-6}$ | 2.0% | 76% |
| $10^{-9}$ | 2.0% | 2.2% |

**Step 1: the large twist.** At 1 rad the state is big, so $\text{RelTol} \cdot |x|$ is the larger limit almost all the time, and AbsTol matters little.

**Step 2: the small twist.** At $10^{-5}$ rad, $\text{RelTol} \cdot |x|$ is at most $10^{-8}$ rad. With AbsTol $10^{-3}$ rad, the limit is a hundred times bigger than the whole signal. The solver accepts anything and strides at the full 0.4 s cap. At that step, with a 1 Hz oscillation, each Dormand–Prince step multiplies the swing by a little more than 1 instead of damping it, and the "vibration" ends 272 times larger than it started. A real damped mode can only shrink.

**Step 3: the fix.** AbsTol $10^{-9}$ rad sits below the smallest error worth caring about. Now the small twist is solved as well as the big one: 2.2% against 2.0%.

**Sanity check.** AbsTol $10^{-6}$ is the value `auto` starts from, and here it still allows errors about a tenth of the signal per step. A rule of thumb that fixes this: set a state's AbsTol to about RelTol times the smallest size of that state you care about. Here $10^{-3} \times 10^{-5} = 10^{-8}$, which gave a 3.1% error in the same test.
:::

::: warning A state that is always small needs its own AbsTol
Pointing errors in radians, gyro biases in rad/s, a flow rate in cubic meters per second, a current in a sensor circuit: states like these live far below 1 in SI units. With a loose AbsTol the solver treats them as noise and stops controlling their error, and nothing in the output warns you. Give each such Integrator its own Absolute tolerance, or rescale the state (radians to microradians) so its typical size is near 1.
:::

::: warning Tight RelTol is not free, and not exact
RelTol limits the error made in each step, not the error at the end: step errors add up, and in an oscillating system they pile up every cycle. Far below about $10^{-12}$ you ask for more digits than a double carries, and the solver slows or warns. For verification runs, RelTol $10^{-10}$ with a suitable AbsTol is a comfortable choice.
:::

## Max step size: the leash

The **Max step size** setting caps how long any single step may be. Its default, `auto`, is the simulation length divided by 50: for a 100 s run, 2 s. The **[[cap of one-fiftieth|maxstep-default]]** stops a quiet stretch of simulation from being crossed in a few enormous strides.

Why would a solver that controls its error need a leash? Because it can only judge what it has seen, and it sees the model only at its steps and minor steps. Anything that starts and ends between two samples is invisible: the error estimate says "all smooth", and the step is accepted.

::: example A thruster misfire the solver steps over
A spacecraft holds its attitude with a controller (moment of inertia $100\,\mathrm{kg\,m^2}$, natural frequency $0.5\,\mathrm{rad/s}$, damping ratio 0.7). At $t = 37.3\,\mathrm{s}$ a thruster sticks open for 0.2 s, giving a torque of $10\,\mathrm{N\,m}$. The torque is written as a function of time inside the model, the way a **[[MATLAB Function block|matlab-function]]** would compute it. The run lasts 100 s. How far does the spacecraft turn?

**Step 1: a careful reference.** At very tight tolerance with steps of at most 1 ms, the attitude peaks at $1.05°$ at $t = 39.6\,\mathrm{s}$. Check the size: the impulse is $10 \times 0.2 = 2\,\mathrm{N\,m\,s}$, which spins the $100\,\mathrm{kg\,m^2}$ body up to $2/100 = 0.02\,\mathrm{rad/s}$. A controller with natural frequency $0.5\,\mathrm{rad/s}$ stops a spin in roughly $1/0.5 = 2\,\mathrm{s}$, so the craft turns by at most about $0.02 \times 2 = 0.04\,\mathrm{rad}$, or $2.3°$, and damping makes it less. About a degree fits.

**Step 2: the default leash.** RelTol $10^{-3}$, AbsTol $10^{-6}$, Max step size auto $= 100/50 = 2\,\mathrm{s}$. Before the misfire nothing moves, so the solver strides at the full 2 s. Its steps land at 35.11, 37.11 and 39.11 s. The pulse, from 37.3 to 37.5 s, falls between two of them, and no slope sample lands inside it. The result: the spacecraft never moves. The peak is $0°$, in 57 steps.

**Step 3: a tighter leash.** Max step size 0.1 s, half the pulse length, so at least one sample must land inside it. Now the peak is $1.06°$, within about 1% of the reference, but the run takes 1009 steps, 18 times as many, most of them during 99.8 s when nothing is happening.

**Sanity check.** The default run reported no error, because by its own measure it made none. The tighter leash found the pulse but paid for it everywhere: a blunt fix for a blind spot.
:::

The better cure for a known event is to let the solver know it is coming. A Step block, for instance, has zero-crossing detection, which lets the solver find its switching time even inside a long step. A pulse built from two Step blocks, one switching on and one switching off, would be caught at the default settings. Lesson 5 explains how.

So when should you shorten the leash?

- **When an input can change faster than the solver would notice**: short pulses or spikes computed from time, or lookup-table inputs with sharp features, that no block announces to the solver.
- **When the tolerance cannot see the error you care about**, as in the orbit script, where the 117 s cap held `ode45` to 2.9 m at tolerances that would otherwise have allowed kilometers.
- **When you need a logged signal smooth enough to plot or post-process** at a known minimum density, as long as you accept the extra steps.

Do not use Max step size in place of a proper tolerance. A leash forces small steps everywhere and hides the real problem, which is usually a tolerance that does not match the size of your states.

```matlab
set_param(mdl, 'RelTol', '1e-6', 'AbsTol', '1e-9', 'MaxStep', '0.1');
```

::: key
The error test is $e_i \le \max(\text{RelTol} \cdot |x_i|, \text{AbsTol}_i)$. Simulink's defaults are RelTol $10^{-3}$, AbsTol `auto` and Max step size `auto` = (stop time − start time)/50. RelTol scales with the state; AbsTol sets the floor near zero and must suit each state's units. Constrain the max step when something can happen between steps that the solver cannot see.
:::

## Check yourself

::: check
You tighten RelTol from $10^{-4}$ to $10^{-7}$ on a smooth model. Roughly how many times more steps should `ode23` need? And `ode45`?
:::

::: answer
The tolerance is 1000 times tighter. `ode23`'s step error goes like $h^3$, so its step count grows by about $1000^{1/3} = 10$. `ode45`'s goes like $h^5$, so about $1000^{1/5} \approx 4$. An `ode45` step costs six evaluations against three, so `ode23` can win at loose tolerances, but the tighter you go, the further `ode45` pulls ahead.
:::

::: check
A model has a Switch block that changes position about every 0.05 s, driven by a relay-like thruster logic. A colleague suggests `ode113` because "it is the most efficient solver". What do you tell them?
:::

::: answer
`ode113` is efficient only while its history of past slopes describes a smooth curve. Each switch is a discontinuity that makes the history useless, so it restarts at low order with small steps every 0.05 s and never gets up to speed. A one-step method such as `ode45` (or `ode23` at loose tolerance) carries on at full strength after each switch, and is the better choice.
:::

::: check
A rocket's altitude reaches $80{,}000\,\mathrm{m}$ and a propellant valve's position is measured in meters, about $0.002\,\mathrm{m}$ of travel. RelTol is $10^{-3}$ and AbsTol is $10^{-6}$ for both. What error per step is allowed in each state near those values? Is either a problem?
:::

::: answer
Altitude: $\max(10^{-3} \times 80000, 10^{-6}) = 80\,\mathrm{m}$ per step, which may be too loose for a landing or staging study. Valve: $\max(10^{-3} \times 0.002, 10^{-6}) = 2 \times 10^{-6}\,\mathrm{m}$, 0.1% of its travel. But when the valve is nearly closed, say at $10^{-5}\,\mathrm{m}$, the limit becomes the AbsTol of $10^{-6}\,\mathrm{m}$: 10% of its position. If the nearly-closed behavior matters, its AbsTol should be around $10^{-9}\,\mathrm{m}$.
:::

::: check
A 500 s simulation contains a 0.3 s disturbance that starts at an unknown time and is computed from the clock inside a MATLAB Function block. With default settings, what is the largest step the solver may take, and could it miss the disturbance? What Max step size would guarantee at least one sample inside it?
:::

::: answer
The default max step is $500/50 = 10\,\mathrm{s}$, and a 0.3 s disturbance fits easily inside one such step, so it could be missed. Any max step below 0.3 s puts a step boundary inside it; 0.15 s, half its length, gives margin. That costs at least $500 / 0.15 \approx 3300$ steps. Building the disturbance from blocks with zero-crossing detection would be cheaper.
:::

::: check
In the orbit script, `ode45` gives 2.9 m of error at both RelTol $10^{-3}$ and $10^{-6}$, with almost the same number of steps. Explain why.
:::

::: answer
Both runs are limited by the Max step size of $T/50 = 117\,\mathrm{s}$, not by the tolerance. At that step size `ode45`'s error per step is already below what either tolerance allows, so neither forces a smaller step, and the error is whatever 117 s steps produce: 2.9 m. Only at $10^{-9}$ does the tolerance start choosing smaller steps, and the error falls to about 1 cm.
:::

## Summary

| Idea | Meaning | Fact to keep |
|---|---|---|
| Order $p$ | How fast error shrinks with $h$ | Step error $\approx C h^{p+1}$; steps grow like $\text{tol}^{-1/(p+1)}$ |
| `ode45` | Dormand–Prince 4(5), one-step | Six evaluations per step; the default starting point |
| `ode23` | Bogacki–Shampine 2(3), one-step | Three evaluations per step; crude tolerances, mild stiffness |
| `ode113` | Adams–Bashforth–Moulton PECE, variable order | Two evaluations per step; tight tolerances, smooth models; restarts after discontinuities |
| Error test | Per state, per step | $e_i \le \max(\text{RelTol} \cdot \lvert x_i \rvert, \text{AbsTol}_i)$ |
| RelTol | Fraction of the state's size | Default $10^{-3}$ |
| AbsTol | Floor in the state's units | Default `auto`; set by hand for states that are always small |
| Max step size | Longest allowed step | Default (stop − start)/50; shorten for things the solver cannot see coming |

Next lesson: a model that suddenly runs a hundred times slower. You will see why a fast mode that has already died away can still pin an explicit solver to tiny steps, and meet the implicit solvers built for that case: `ode15s`, `ode23s`, `ode23t`, `ode23tb` and `daessc`.

::: context order Why it is called order
The word comes from Taylor series. The true solution can be written as $x(t+h) = x(t) + h\dot{x} + \tfrac{h^2}{2}\ddot{x} + \cdots$, a sum of terms in higher and higher powers of $h$. A method of order $p$ gets every term right up to the one in $h^p$ and first goes wrong at $h^{p+1}$. That first wrong term is the step error. Euler matches only the $h$ term, so it is order 1. RK4 matches through $h^4$. Over a run of $T/h$ steps, the $h^{p+1}$ errors add up to about $h^p$ in total, which is why the total error has one power less than the step error.
:::

::: context fsal Reusing the last slope
In the Dormand–Prince pair, the seventh slope sample is taken at the end of the step, using the new fifth-order state. That is exactly the point where the next step begins, and a step always starts by asking for the slope at its starting point. So the seventh sample of one step is the first sample of the next, and it is computed only once. MathWorks and textbooks call this property "first same as last", or FSAL. It is why seven samples cost six evaluations. If a step is rejected, nothing is saved, because the step's end point was never accepted.
:::

::: context one-step Starting fresh every step
A one-step method, like every Runge–Kutta method, needs only the state at the start of the step: it samples slopes inside the step and forgets them once the step is done. A multistep method, like the Adams family in `ode113`, keeps slopes from earlier steps and reuses them. Memory makes each step cheaper, but it is also a liability, because the memory is only useful while the solution stays smooth. The same split appears among the stiff solvers in lesson 3: `ode15s` is multistep, while `ode23s`, `ode23t` and `ode23tb` are one-step.
:::

::: context mild-stiffness A word for the next lesson
A model is **stiff** when it contains a motion that dies out much faster than everything else, like a fast actuator inside a slow vehicle. Explicit solvers such as `ode45` and `ode23` then have to keep their steps tiny for stability, not accuracy. When the gap is small, a solver with cheap steps suffers least, which is why `ode23` is suggested for mild stiffness. When the gap is large, no explicit solver copes well, and lesson 3 brings in the implicit solvers built for it.
:::

::: context pece Fitting a curve through past slopes
An Adams method does not sample the slope inside the step. It looks back: it fits a polynomial through the slopes at the last few accepted steps and integrates that polynomial forward to predict the new state. Then it evaluates the true slope at the prediction, refits including it, and corrects. The name joins three people. John Couch Adams, the astronomer who predicted Neptune, devised both formulas; the predictor was published with Francis Bashforth in 1883, in a study of the shapes of liquid drops. The astronomer Forest Ray Moulton, who worked on artillery ballistics, showed in 1926 how to use the two as a predictor and corrector pair.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40,95 C90,80 150,60 210,55" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M210,55 C240,52 270,54 300,60" fill="none" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 4"/>
  <circle cx="60" cy="89" r="5" fill="#1d6fd1"/>
  <circle cx="110" cy="75" r="5" fill="#1d6fd1"/>
  <circle cx="160" cy="62" r="5" fill="#1d6fd1"/>
  <circle cx="210" cy="55" r="5" fill="#1d6fd1"/>
  <circle cx="300" cy="60" r="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="135" y="138" font-size="11" fill="#1f2a44" text-anchor="middle">past steps: slopes kept in memory</text>
  <text x="300" y="42" font-size="11" fill="#1f2a44" text-anchor="middle">predicted</text>
  <text x="300" y="138" font-size="11" fill="#6c7a93" text-anchor="middle">new step</text>
</svg>
```

The blue dots are remembered slopes; the dashed curve extends their fit to predict the orange point, which is then corrected.
:::

::: context arcseconds How small is 2 arcseconds
A degree is split into 60 arcminutes and each arcminute into 60 arcseconds, so an arcsecond is $1/3600$ of a degree. In radians, $10^{-5}\,\mathrm{rad} \times \frac{180}{\pi} \times 3600 = 2.06$ arcseconds, roughly the width of a coin seen from 2 km away. Space telescopes live at this scale and below: the Hubble Space Telescope is often quoted as holding its pointing to about 0.007 arcseconds. Pointing and jitter models are full of states this small, which is why AbsTol comes up in every pointing-control team.
:::

::: context maxstep-default Why one-fiftieth
Dividing the run into at least 50 steps is a safety net, not a law of physics. It guarantees that even a model that is perfectly still takes enough steps for the solver to notice when something starts to happen, and that plots have at least a few dozen points. The number scales with the run: a 10 s run is capped at 0.2 s, a one-day orbit run at 1728 s. If your model has anything shorter than the cap that matters, the default will not protect you.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="191" y="40" width="12" height="60" fill="#f2b880" stroke="#b4232c"/>
  <text x="197" y="32" font-size="11" fill="#b4232c" text-anchor="middle">pulse 37.3 to 37.5 s</text>
  <line x1="60" y1="92" x2="60" y2="108" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="180" y1="92" x2="180" y2="108" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="300" y1="92" x2="300" y2="108" stroke="#1d6fd1" stroke-width="3"/>
  <text x="60" y="124" font-size="11" fill="#1f2a44" text-anchor="middle">35.11 s</text>
  <text x="180" y="124" font-size="11" fill="#1f2a44" text-anchor="middle">37.11 s</text>
  <text x="300" y="124" font-size="11" fill="#1f2a44" text-anchor="middle">39.11 s</text>
  <text x="240" y="84" font-size="11" fill="#1d6fd1" text-anchor="middle">one 2 s step</text>
</svg>
```

The steps from the thruster example, drawn to scale. The 0.2 s pulse sits wholly inside the 2 s step from 37.11 to 39.11 s, so the solver never samples it.
:::

::: context matlab-function Code inside a block
A MATLAB Function block holds a short MATLAB function that Simulink calls at every step with the block's inputs. It is a convenient place for logic that is awkward to draw, such as "fire this thruster between 37.3 and 37.5 s". But to the solver the block is a black box: it sees only the values that come out at the moments it asks. Unlike a Step or Saturation block, the function does not tell the solver where its output jumps, so the solver cannot plan a step boundary there or detect the jump as a zero crossing.
:::
