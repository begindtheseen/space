---
id: l07-stiffness
title: Stiffness and when to switch to an implicit method
minutes: 21
covers:
  - 'Stiffness: how to recognise it and when to switch to an implicit method'
---

Think about a car on a long road trip. Between each wheel and the car body sits a very stiff spring. When the wheel hits a pebble, the spring flexes and settles again in a few hundredths of a second. The trip itself takes five hours. Nobody planning the trip cares about the spring. It does its job so fast that it has always finished before anything interesting happens.

Now put that car in a simulator. The spring is in the equations, so the integrator has to handle it. You would like to take steps of a second or so, because the road trip changes slowly. Try it with the methods you have used so far and the numbers explode: the spring swings further and further each step until the car is flying off to infinity. To keep things calm you are forced down to steps smaller than the spring's own settling time, for the whole five hours. A one-second job becomes a hundred-thousand-step job.

That is **stiffness**: a system that mixes very fast, quickly settling motion with the slow motion you actually care about, so that an explicit integrator's step is set by the fast part instead of by what you want to see. The word comes from exactly this kind of **[[stiff spring|stiff-word]]**. In a GNC simulation it shows up whenever a fast actuator, a thermal skin, a combustion chemistry model or a ground-contact spring sits inside a slow trajectory. In the `solve_ivp` lesson you watched a fin actuator make RK45 crawl. This lesson explains why, shows you how to spot it from the solver's behavior, and tells you when to switch.

## Two clocks in one problem

Every quickly settling process has a **[[time constant|time-constant]]**: the time it takes to close most of the gap to where it is heading. A hot cup of cocoa has a time constant of many minutes. A small fin actuator has one of a few milliseconds. The chemistry in a rocket engine's combustion chamber settles in microseconds.

Here is the smallest stiff problem there is. It is the cocoa rule from the first lesson, but chasing a moving target:

$$
\dot{y} = -\lambda\,\bigl(y - \cos t\bigr) - \sin t, \qquad y(0) = 1.
$$

Read $\lambda$ as "lambda". It is a rate in $\mathrm{s^{-1}}$, and $1/\lambda$ is the time constant. The equation says: whatever $y$ is, it gets pulled toward $\cos t$ at rate $\lambda$. The extra $-\sin t$ term is there so the exact answer is tidy. Because $y$ starts exactly on the target, the exact solution is

$$
y(t) = \cos t
$$

for every value of $\lambda$. That is a slow, smooth wave with a period of about $6.3\,\mathrm{s}$. The value of $\lambda$ changes nothing about the answer. It only changes how hard the equation *would* pull $y$ back if something knocked it off.

So an integrator should find this equally easy for every $\lambda$. Watch RK45:

```python
import numpy as np
from scipy.integrate import solve_ivp

def make_rhs(lam):
    def rhs(t, y):
        return [-lam * (y[0] - np.cos(t)) - np.sin(t)]
    return rhs

for lam in [1.0, 100.0, 1000.0, 10000.0]:
    sol = solve_ivp(make_rhs(lam), (0.0, 10.0), [1.0], method="RK45",
                    rtol=1e-3, atol=1e-9)
    print(f"lambda={lam:>7.0f}  steps={len(sol.t) - 1:>6}  nfev={sol.nfev}")
# lambda=      1  steps=    15  nfev=104
# lambda=    100  steps=   312  nfev=1916
# lambda=   1000  steps=  3021  nfev=21134
# lambda=  10000  steps= 30203  nfev=211376
```

The answer is the same smooth cosine in all four runs. Yet the cost grows in proportion to $\lambda$: ten times the pull, ten times the steps. With $\lambda = 10\,000$ the solver takes $30\,203$ steps to draw about one and a half wiggles of a cosine. Something other than accuracy is choosing the step.

## Why the explicit step blows up

Look at what happens when $y$ is slightly off the curve. Call the gap $\delta = y - \cos t$ (read \"delta\"; it is the deviation from the true curve). Put $y = \cos t + \delta$ into the equation and the $\cos$ and $\sin$ terms cancel, leaving

$$
\dot{\delta} = -\lambda \delta.
$$

Any gap shrinks by a factor of $e \approx 2.718$ every $1/\lambda$ seconds. The true system is extremely forgiving. The trouble is how an explicit method treats that forgiving pull.

Take one explicit Euler step of size $h$ on $\dot{\delta} = -\lambda \delta$. It uses the slope at the start of the step for the whole step:

$$
\delta_{n+1} = \delta_n + h\,(-\lambda \delta_n) = (1 - h\lambda)\,\delta_n.
$$

The number $(1 - h\lambda)$ is the **[[amplification factor|amplification-factor]]**: what each step multiplies the gap by. Think of steering a car by looking up once a second and yanking the wheel in proportion to how far off the lane center you are. If you yank gently, you drift back to the center. If you yank too hard, you cross the center line and end up further off on the other side, then yank back harder still. That is what happens when $h\lambda > 2$: the factor $1 - h\lambda$ is below $-1$, so every step flips the sign of the gap *and* makes it bigger.

So explicit Euler is only **stable** — gaps do not grow — when

$$
|1 - h\lambda| \le 1 \quad\Longleftrightarrow\quad h \le \frac{2}{\lambda}.
$$

Every explicit method has a limit of this shape, $h \le c/\lambda$, with its own constant $c$. For a mode that decays without oscillating, like ours:

| Method | Largest stable $h\lambda$ |
| --- | --- |
| Explicit Euler | $2$ |
| RK23 | about $2.51$ |
| Classic RK4 | about $2.79$ |
| RK45 (Dormand–Prince) | about $3.31$ |
| DOP853 | about $6.39$ |

Notice what the limit does *not* depend on: the tolerance, or the size of the gap. Even a gap of $10^{-16}$ from round-off grows without bound if the step is over the limit. The step controller from the adaptive-step lesson sees the error estimate shoot up whenever it tries a longer step, rejects it, and shrinks back to the edge. The step settles at the stability limit and stays there.

::: key
An explicit method on a stiff problem is limited by stability, not accuracy: its step cannot exceed about $c/|\lambda_{\max}|$, where $|\lambda_{\max}|$ is the fastest decay rate in the model and $c$ is a small constant of the method ($2$ for Euler, about $3.3$ for RK45). This holds even after the fast part has died out and the solution looks smooth.
:::

::: example Predicting RK45's step count
For $\lambda = 1000\,\mathrm{s^{-1}}$ (a time constant of $1\,\mathrm{ms}$), how many steps should RK45 need to cover $10\,\mathrm{s}$?

**Stability limit.** RK45 is stable up to $h\lambda \approx 3.31$, so $h \le 3.31 / 1000 = 3.31\,\mathrm{ms}$.

**Step count.** Covering $10\,\mathrm{s}$ in steps of $3.31\,\mathrm{ms}$ takes $10 / 0.00331 \approx 3025$ steps.

**Compare with the run.** The solver reported $3021$. The prediction is off by four steps, because the solver cannot sit exactly on the edge. For $\lambda = 10\,000$ the same arithmetic predicts about $30\,250$ steps, against $30\,203$ measured.

**Sanity check.** Accuracy alone would need about $15$ steps (the $\lambda = 1$ run). The extra three thousand steps bought nothing but stability, which is the signature of stiffness.
:::

::: warning Higher order does not help
It is tempting to reach for DOP853 when RK45 crawls. The stability limit of every explicit method is a small constant over $|\lambda|$, and DOP853's constant, about $6.4$, is less than twice RK45's. On the $\lambda = 1000$ problem, DOP853 still needs $1566$ steps where accuracy needs about fifteen. Order buys accuracy per step. It does not buy stability.
:::

::: note Why the limit is exactly where it is
For any Runge–Kutta method, one step on $\dot{\delta} = \mu \delta$ (with $\mu = -\lambda$) multiplies $\delta$ by a polynomial in $z = h\mu$. For classic RK4 that polynomial is the first five terms of the series for $e^{z}$:

$$
R(z) = 1 + z + \frac{z^2}{2} + \frac{z^3}{6} + \frac{z^4}{24}.
$$

The step is stable when $|R(z)| \le 1$. Setting $R(z) = 1$ and solving numerically for the negative root gives $z \approx -2.785$. A polynomial always grows without bound for large $|z|$, so every explicit method has a limit somewhere. That is the deep reason explicit methods cannot beat stiffness.
:::

## Stiffness in a system: look at the eigenvalues

Real models have many states, and the rates are hidden inside the equations. The tool that finds them is the **Jacobian** from the `solve_ivp` lesson: the matrix $\partial \mathbf{f} / \partial \mathbf{y}$ of how each rate of change responds to a nudge in each state. Near any moment of the run, small gaps evolve like $\dot{\boldsymbol{\delta}} = \mathbf{J}\,\boldsymbol{\delta}$. The **[[eigenvalues|eigenvalue]]** of $\mathbf{J}$ are the rates of that system. A large negative one is a fast, strongly damped mode, like $-\lambda$ above.

The **stiffness ratio** compares the fastest decaying mode to the slowest one you care about:

$$
\text{stiffness ratio} = \frac{|\lambda|_{\max}}{|\lambda|_{\min}}.
$$

Ratios of a few hundred are mildly stiff. Ratios of $10^4$ to $10^{10}$ are common in chemistry, thermal and actuator models. The ratio tells you roughly how many times more steps an explicit method will take than the slow physics needs.

::: example A chemistry model that stalls RK45
The **[[Robertson problem|robertson]]** is a classic three-species reaction. Species $a$ turns slowly into $b$, and $b$ reacts very fast to make $c$. Its rate constants span nine powers of ten: $0.04$, $10^4$ and $3 \times 10^7$.

```python
import numpy as np
from scipy.integrate import solve_ivp

def robertson(t, y):
    a, b, c = y
    return [-0.04 * a + 1e4 * b * c,
             0.04 * a - 1e4 * b * c - 3e7 * b**2,
             3e7 * b**2]

def jac(t, y):
    a, b, c = y
    return [[-0.04,  1e4 * c,              1e4 * b],
            [ 0.04, -1e4 * c - 6e7 * b,   -1e4 * b],
            [ 0.0,   6e7 * b,              0.0   ]]

for method in ["RK45", "Radau", "BDF", "LSODA"]:
    kw = {} if method == "RK45" else {"jac": jac}
    sol = solve_ivp(robertson, (0.0, 40.0), [1.0, 0.0, 0.0], method=method,
                    rtol=1e-6, atol=[1e-8, 1e-14, 1e-8], **kw)
    print(f"{method:6} steps={len(sol.t) - 1:>6} nfev={sol.nfev:>6} a(40)={sol.y[0, -1]:.5f}")
y40 = sol.y[:, -1]
print(np.sort(np.linalg.eigvals(jac(40.0, y40)).real))
# RK45   steps= 34542 nfev=242030 a(40)=0.71583
# Radau  steps=    91 nfev=   756 a(40)=0.71583
# BDF    steps=   170 nfev=   433 a(40)=0.71583
# LSODA  steps=   217 nfev=   335 a(40)=0.71583
# [-3.39278699e+03 -2.14189053e-02  4.60342618e-16]
```

**Everyone agrees.** All four methods report $a(40) = 0.71583$: about $72\%$ of species $a$ is left after $40\,\mathrm{s}$.

**The eigenvalues.** At $t = 40\,\mathrm{s}$ the Jacobian has rates of about $-3393\,\mathrm{s^{-1}}$ and $-0.0214\,\mathrm{s^{-1}}$ (the third is zero up to round-off, because the total amount $a + b + c$ never changes). The stiffness ratio is $3393 / 0.0214 \approx 1.6 \times 10^5$.

**The predicted ceiling.** RK45's limit at that moment is $3.31 / 3393 \approx 0.97\,\mathrm{ms}$. Its average step over the run was $40 / 34\,542 \approx 1.16\,\mathrm{ms}$ — right at the edge, as the theory says.

**The cost.** BDF needed $433$ evaluations against RK45's $242\,030$, about $560$ times fewer. Radau was about $320$ times cheaper.
:::

## Recognising stiffness from the solver's behavior

In practice you rarely compute eigenvalues first. You notice that a run is slow, and the solver's behavior tells you why. Here are the symptoms.

**Many tiny steps on a smooth answer.** Plot the step sizes, `np.diff(sol.t)`, against time. A stiff run shows a long, flat floor of small steps even through stretches where the solution is a gentle curve. The floor sits near $c/|\lambda_{\max}|$.

**The tolerance stops working.** In a healthy run, loosening `rtol` makes the solver cheaper and less accurate, and tightening it does the reverse. In a stiff run, the steps are already far smaller than accuracy needs, so loosening buys nothing:

```python
import numpy as np
from scipy.integrate import solve_ivp

def rhs(t, y):
    return [-1000.0 * (y[0] - np.cos(t)) - np.sin(t)]

for rtol in [1e-2, 1e-4, 1e-6, 1e-8, 1e-10]:
    sol = solve_ivp(rhs, (0.0, 10.0), [1.0], method="RK45", rtol=rtol, atol=1e-12)
    err = abs(sol.y[0, -1] - np.cos(10.0))
    print(f"rtol={rtol:.0e}  steps={len(sol.t) - 1:>5}  error={err:.1e}")
# rtol=1e-02  steps= 3021  error=1.7e-03
# rtol=1e-04  steps= 3021  error=7.4e-06
# rtol=1e-06  steps= 3569  error=3.4e-07
# rtol=1e-08  steps= 7366  error=3.3e-09
# rtol=1e-10  steps=17191  error=2.2e-11
```

Going from $10^{-4}$ to $10^{-2}$ saves not a single step. Going the other way, from $10^{-6}$ to $10^{-10}$, moves the answer only in its seventh digit while the step count grows almost five times. In the Robertson run the same thing happens: RK45 at `rtol=1e-3` already agrees with its `rtol=1e-9` answer to six digits, because stability forced steps far smaller than the tolerance asked for.

**An implicit method is dramatically cheaper.** The decisive test takes one line: rerun with `method="Radau"` or `"BDF"`. If the cost falls by a factor of tens or thousands and the answer agrees, the problem was stiff.

::: key
You recognise stiffness from solver behavior: the solver takes enormous numbers of tiny steps on a smooth-looking solution, and tightening the tolerance barely changes the answer while multiplying the cost. The fix is an implicit method (Radau, BDF) that is stable at large steps.
:::

Stiffness is the most common reason a run crawls, but not the only one. The small steps have other possible causes, and the step-size plot tells them apart.

- If the steps collapse **only near one moment**, look for a [[discontinuity or near-singularity|step-size-plot]]: a thrust cutoff, a saturation limit, the edge of a lookup table, or a radius heading toward zero in $1/r^2$ gravity. An implicit method will not fix those; lesson 10 shows how to restart the solver at them.
- If one state has an `atol` far below its physical size — $10^{-15}\,\mathrm{m}$ on a position of $7 \times 10^6\,\mathrm{m}$ — the solver is chasing noise. The tolerances lesson shows how to set it from the state's scale.

::: key
Your integrator takes a million tiny steps over a 100-second span. Either the system is stiff and needs Radau or BDF, or there is a discontinuity or a near-singularity being stepped over (a saturation, a table edge, a division as a radius approaches zero), or atol is set far below the physical scale of a state.
:::

::: warning Do not loosen the tolerance to make it fast
When a stiff run is slow, the reflex is to raise `rtol` to $10^{-2}$. As the table shows, that does nothing to the step count, because the step is set by stability. You get a less accurate answer from a run that is as slow as before. Change the method, not the tolerance.
:::

## Switching to an implicit method

The cure is to take the slope at the *end* of the step instead of the start. On $\dot{\delta} = -\lambda \delta$, **backward Euler** writes

$$
\delta_{n+1} = \delta_n + h\,(-\lambda \delta_{n+1}) \quad\Longrightarrow\quad \delta_{n+1} = \frac{\delta_n}{1 + h\lambda}.
$$

The first equation has the unknown $\delta_{n+1}$ on both sides. Moving $h\lambda \delta_{n+1}$ to the left and dividing by $1 + h\lambda$ gives the second. For any positive $h$ and $\lambda$ the bottom is bigger than one, so the gap always shrinks. There is no step limit at all. Try it with $\lambda = 1000$ and a step of $10\,\mathrm{ms}$, five times over the explicit limit:

```python
lam, h = -1000.0, 0.01
y_fwd, y_bwd = 1.0, 1.0
for n in range(10):
    y_fwd = (1 + h * lam) * y_fwd      # forward (explicit) Euler
    y_bwd = y_bwd / (1 - h * lam)      # backward (implicit) Euler
print(f"forward:  {y_fwd:.3g}")
print(f"backward: {y_bwd:.3g}")
# forward:  3.49e+09
# backward: 3.86e-11
```

The explicit factor is $1 - 10 = -9$, and ten steps turn $1$ into $(-9)^{10} \approx 3.49 \times 10^9$. The implicit factor is $1/11$, and ten steps give about $3.9 \times 10^{-11}$. The true answer, $e^{-10} \approx 4.5 \times 10^{-5}$, is tiny too. The implicit method is not exact at this step, but it lands in the right place: the fast mode has died.

A method that is stable for every step on every decaying mode is called **[[A-stable|a-stability]]**. That is what Radau and low-order BDF give you. The price is that each step is now an equation to solve. For a real model the solver uses Newton's method with the Jacobian, and factors a matrix at each Newton update. That is what `sol.njev` and `sol.nlu` count.

So when do you switch?

- **Switch** when the symptoms above appear: a flat floor of tiny steps, a tolerance that no longer controls the cost, and a big, damped rate in the Jacobian. Try `Radau` for tight tolerances and small systems, `BDF` for large systems at moderate tolerances.
- **Give the solver a Jacobian** with `jac=` when you can write one down, as in the Robertson code. Otherwise it estimates the matrix by nudging every state, one extra call to your function per state.
- **Use `LSODA`** when stiffness comes and goes during the run — fast valve dynamics at engine start, nothing stiff in the long coast — so it can switch on its own.
- **Stay explicit** when the problem is not stiff. An orbit has no fast damped mode, so DOP853 remains the right tool there.

::: warning BDF on an orbit adds fake damping
The formulas that let BDF kill fast modes also damp slow oscillations a little. On an orbit that shows up as a steady, fake loss of energy, as if there were drag. Over ten revolutions of a $7000\,\mathrm{km}$ circular orbit at `rtol=1e-6`, BDF lost energy at a relative level of $4.3 \times 10^{-4}$ and used about twice DOP853's function evaluations, while DOP853's energy error was about $280$ times smaller. An implicit method is a stiffness cure, not an upgrade. Use it only when the step count is being set by a fast, decaying part of the model.
:::

## Where you meet it on a vehicle

Stiffness enters a GNC simulation whenever a model detail is much faster than the trajectory:

- a fin or gimbal actuator with a time constant of a few milliseconds inside a ten-minute ascent;
- a thermal model where a thin skin heats in a fraction of a second while a propellant tank warms over hours;
- combustion or reentry-plasma chemistry, with reactions settling in microseconds;
- a **[[ground-contact spring|contact-springs]]** on a landing leg, which must be stiff so the leg does not sink into the pad.

One common engineering answer, besides switching method, is to ask whether the fast part needs to be modeled at all. If the actuator settles in $2\,\mathrm{ms}$ and your guidance runs at $50\,\mathrm{Hz}$, replacing the lag with an instant response removes the stiffness entirely. That is a modeling decision, and it should be made on purpose, with a check that the answer does not change.

## Check yourself

::: check
A thermal model has decay rates of $0.002\,\mathrm{s^{-1}}$ and $400\,\mathrm{s^{-1}}$. What is its stiffness ratio? Roughly how many RK45 steps would it need to cover one hour, and how many steps of explicit Euler?
:::

::: answer
The ratio is $400 / 0.002 = 2 \times 10^5$, strongly stiff.

RK45 is stable up to $h \approx 3.31/400 \approx 8.3\,\mathrm{ms}$. One hour is $3600\,\mathrm{s}$, so about $3600 / 0.00828 \approx 435\,000$ steps.

Explicit Euler is stable up to $h = 2/400 = 5\,\mathrm{ms}$, so $3600 / 0.005 = 720\,000$ steps.

The slow mode, with a time constant of $500\,\mathrm{s}$, would be well resolved by a few hundred steps, so an implicit method should need a few hundred.
:::

::: check
A colleague's run takes $200\,000$ steps. Changing `rtol` from $10^{-6}$ to $10^{-3}$ brings it to $199\,000$ steps and the answer moves in the eighth digit. What do you conclude, and what is the next experiment?
:::

::: answer
The tolerance has almost no grip on the cost, and the answer at the loose tolerance is far more accurate than $10^{-3}$ asked for. The steps are being set by something other than accuracy — most likely stability, so the problem is probably stiff.

The next experiment is to rerun with `method="Radau"` or `"BDF"`. If the cost drops by a large factor and the answer agrees, it was stiffness. It is also worth plotting `np.diff(sol.t)`: a flat floor points to stiffness, a local collapse points to a discontinuity.
:::

::: check
Show that for backward Euler on $\dot{y} = -\lambda y$, the factor $1/(1 + h\lambda)$ is between $0$ and $1$ for every positive $h$ and $\lambda$. What does forward Euler's factor become when $h\lambda = 3$?
:::

::: answer
With $h > 0$ and $\lambda > 0$, the product $h\lambda$ is positive, so $1 + h\lambda > 1$. One divided by a number bigger than one is between $0$ and $1$. So each step shrinks $y$ without flipping its sign, for any step.

Forward Euler's factor is $1 - h\lambda = 1 - 3 = -2$. Each step flips the sign and doubles the size, so the numerical solution zigzags and grows, while the true solution decays.
:::

::: check
The step-size plot of a slow run is smooth and around $0.5\,\mathrm{s}$, except for a narrow dip to $10^{-7}\,\mathrm{s}$ at $t = 162\,\mathrm{s}$. Is this stiffness? What would you look for?
:::

::: answer
No. Stiffness gives a long, flat floor of small steps wherever the fast mode is present, not one narrow dip. A collapse at one moment points to a discontinuity or near-singularity there.

Look at what happens in the model at $t = 162\,\mathrm{s}$: an engine cutoff, a stage separation, a saturation limit switching on, or the edge of an aerodynamic lookup table. The fix is to stop the integration at that event and restart it, not to change to an implicit method.
:::

::: check
Why is `Radau` a poor choice for propagating a satellite orbit, even though it is "more stable" than DOP853?
:::

::: answer
An orbit has no fast, decaying mode, so it is not stiff and explicit methods face no stability limit that matters. Radau would solve a system of equations with Newton's method on every step for no benefit, making each step several times more expensive. DOP853's eighth order also reaches tight tolerances in far fewer steps than Radau's fifth order. Implicit methods buy stability; an orbit needs accuracy.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Stiffness | fast, well-damped modes alongside slow ones | step set by stability, not accuracy |
| Time constant | time to close most of a gap | $1/\lambda$ |
| Amplification factor | what one step multiplies a gap by | explicit Euler: $1 - h\lambda$; backward Euler: $1/(1 + h\lambda)$ |
| Explicit stability limit | largest stable step | $h \le c/\lvert\lambda_{\max}\rvert$; $c = 2$ Euler, $2.79$ RK4, $3.31$ RK45, $6.39$ DOP853 |
| Stiffness ratio | fastest over slowest rate | $\lvert\lambda\rvert_{\max} / \lvert\lambda\rvert_{\min}$ from the Jacobian's eigenvalues |
| Symptoms | how you see it | flat floor of tiny steps; tolerance barely changes the answer but multiplies the cost |
| Other causes of tiny steps | not stiffness | discontinuity, near-singularity, atol far below a state's scale |
| The cure | implicit, A-stable methods | Radau, BDF, or LSODA when stiffness comes and goes; pass `jac=` |

The next lesson turns from speed to trust. Once a run finishes, how do you know it is right without a reference answer? Conserved quantities — orbital energy and the Jacobi constant — give you an independent check that costs almost nothing.

::: context stiff-word Where the word comes from
The word "stiff" was introduced by the chemists Charles Curtiss and Joseph Hirschfelder in a 1952 paper on integrating the equations of chemical reactions. The picture behind it is a stiff spring: the stiffer it is, the faster it snaps back, and the faster its natural motion. A soft spring bounces lazily and is easy to simulate. A very stiff one rings so fast that an explicit step must be tiny to keep up. Engineers now use the word for any system with a wide gap between its fastest and slowest rates, springs or not.
:::

::: context time-constant One time constant closes about 63 percent
For a gap that decays as $e^{-\lambda t}$, the time constant is $\tau = 1/\lambda$. After one $\tau$ the gap has shrunk to $e^{-1} \approx 0.37$ of its start, so about $63\%$ of it has closed. After five time constants less than $1\%$ is left, which is why engineers say a first-order process has "settled" after about $5\tau$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="34" y="34" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="34" y="154" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40,30.0 50,48.4 60,64.0 70,77.2 80,88.4 90,97.8 100,105.9 110,112.6 120,118.4 130,123.2 140,127.3 150,130.8 160,133.8 170,136.3 180,138.4 190,140.1 200,141.7 210,142.9 220,144.0 230,144.9 240,145.7 250,146.4 260,146.9 270,147.4 280,147.8 290,148.1 300,148.4 310,148.7 320,148.9 330,149.0 340,149.2"/>
  <line x1="100" y1="150" x2="100" y2="105.9" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="40" y1="105.9" x2="100" y2="105.9" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="100" cy="105.9" r="4" fill="#b4232c"/>
  <text x="108" y="100" font-size="12" fill="#b4232c">0.37 left after one τ</text>
  <text x="100" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">τ</text>
  <text x="160" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">2τ</text>
  <text x="220" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">3τ</text>
  <text x="280" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">4τ</text>
  <text x="340" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">5τ</text>
</svg>
```
:::

::: context amplification-factor The stable stretch of the number line
Write $z = -h\lambda$ for one step on a decaying mode. Explicit Euler multiplies the gap by $1 + z$, and that has size at most $1$ only for $z$ between $-2$ and $0$. Each explicit method has its own stable stretch, and all of them end a short distance to the left of zero. Backward Euler's stretch has no left end at all.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="345" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="320" y="138">0</text><text x="240" y="138">−1</text><text x="160" y="138">−2</text><text x="80" y="138">−3</text>
  </g>
  <g stroke="#1f2a44" stroke-width="1"><line x1="320" y1="116" x2="320" y2="124"/><line x1="240" y1="116" x2="240" y2="124"/><line x1="160" y1="116" x2="160" y2="124"/><line x1="80" y1="116" x2="80" y2="124"/></g>
  <text x="345" y="112" font-size="11" fill="#1f2a44" text-anchor="end">z = −hλ</text>
  <rect x="160" y="22" width="160" height="12" fill="#8fb8f0"/>
  <text x="155" y="32" font-size="11" fill="#1f2a44" text-anchor="end">Euler, −2</text>
  <rect x="97.2" y="44" width="222.8" height="12" fill="#1d6fd1"/>
  <text x="92" y="54" font-size="11" fill="#1f2a44" text-anchor="end">RK4, −2.79</text>
  <rect x="55.5" y="66" width="264.5" height="12" fill="#1f2a44"/>
  <text x="50" y="76" font-size="11" fill="#1f2a44" text-anchor="end">RK45</text>
  <rect x="20" y="88" width="300" height="12" fill="#f2b880"/>
  <text x="26" y="98" font-size="11" fill="#1f2a44">backward Euler: all the way left</text>
</svg>
```
:::

::: context eigenvalue Eigenvalues as rates
An eigenvalue of a matrix $\mathbf{J}$ is a number $\lambda$ for which some direction $\mathbf{v}$ satisfies $\mathbf{J}\mathbf{v} = \lambda \mathbf{v}$: along that direction, the matrix only stretches. For $\dot{\boldsymbol{\delta}} = \mathbf{J}\boldsymbol{\delta}$, a gap pointing along $\mathbf{v}$ evolves as $e^{\lambda t}$, like a one-state problem. So each eigenvalue is the rate of one "mode" of the system. A negative real part means the mode decays; its size says how fast. `np.linalg.eigvals` returns them all. Eigenvalues can be complex, in which case the mode oscillates as it decays, and the stability limits of explicit methods apply to the whole complex number.
:::

::: context robertson A chemistry test from 1966
H. H. Robertson published this three-reaction model in 1966, and it has been the standard stiff test problem ever since. Its three rate constants, $0.04$, $10^4$ and $3 \times 10^7$, make species $b$ settle almost instantly while $a$ changes over hours and days. Standard solver test sets integrate it all the way out to $t = 10^{11}\,\mathrm{s}$. Rocket-engine combustion models are the same kind of system, with dozens of species and hundreds of reactions instead of three.
:::

::: context step-size-plot Reading the step-size plot
Plotting `np.diff(sol.t)` against `sol.t[1:]` on a logarithmic vertical axis is the quickest diagnosis of a slow run. Stiffness shows as a flat floor that lasts as long as the fast mode is present. A discontinuity shows as a sharp, narrow dip at one time, with normal steps on both sides.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="170" y2="70" stroke="#1f2a44" stroke-width="1"/>
  <line x1="30" y1="10" x2="30" y2="70" stroke="#1f2a44" stroke-width="1"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="30,20 40,45 50,58 170,58"/>
  <text x="100" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">stiff: flat floor</text>
  <line x1="200" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="1"/>
  <line x1="200" y1="10" x2="200" y2="70" stroke="#1f2a44" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="200,24 260,22 266,40 270,64 274,40 280,24 340,22"/>
  <text x="270" y="86" font-size="11" text-anchor="middle" fill="#1f2a44">discontinuity: one dip</text>
  <text x="185" y="120" font-size="11" text-anchor="middle" fill="#6c7a93">vertical: step size (log scale)</text>
  <text x="185" y="138" font-size="11" text-anchor="middle" fill="#6c7a93">horizontal: time</text>
</svg>
```
:::

::: context a-stability Dahlquist's barrier
The Swedish mathematician Germund Dahlquist defined A-stability in 1963 and proved a hard limit on it: no linear multistep method of order higher than two can be A-stable. BDF is a multistep method, so only its orders one and two are fully A-stable. Orders three to five are stable on most, but not all, of the decaying half of the plane, missing a thin wedge near lightly damped oscillation. Implicit Runge–Kutta methods such as Radau escape the barrier, which is why Radau keeps fifth order and full A-stability together.
:::

::: context contact-springs Why landing legs make stiff models
A simulator cannot let a lander's foot pass through the ground, so it usually pushes back with a very stiff spring and damper whenever the foot is below the surface. To keep penetration to millimeters under a load of tens of kilonewtons, the spring constant must be enormous, which makes its natural frequency far above anything in the flight. Touchdown simulations therefore either switch to an implicit method near contact, use a dedicated contact solver, or accept many small steps for the short time the foot is on the pad.
:::
