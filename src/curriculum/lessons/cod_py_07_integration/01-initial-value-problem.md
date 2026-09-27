---
id: l01-initial-value-problem
title: The initial value problem and how integration errors pile up
minutes: 22
covers:
  - The initial value problem and local versus global truncation error
---

Picture a sailor three hundred years ago, far out at sea with no land in sight. She knows where the ship started this morning. Every hour she checks the compass heading and measures the speed through the water. From those two facts she moves a pencil mark across the chart: "an hour at 6 knots heading east puts us about here". Hour by hour, mark by mark, the line of pencil dots grows into the ship's path. That method is called **[[dead reckoning|dead-reckoning]]**.

A flight simulator does exactly the same thing, only with far smaller steps and far more care. It knows where the vehicle is now. It has a rule that says how fast every quantity is changing: position changes at the rate of the velocity, velocity changes at the rate of the acceleration. It takes a small step forward in time, moves every quantity by "rate times step", and repeats. Every trajectory you will ever plot — a booster's ascent, a capsule's reentry, a satellite going around Earth a thousand times — is made this way.

This module is about doing that well. In this first lesson you will set up the problem precisely, write it as a Python function, and then meet the one thing that makes the whole subject interesting: every step makes a small error, and the errors pile up. You will learn to tell the error of one step (the **local** error) from the error at the end of the run (the **global** error), and why the two grow with the step size at different rates.

## A rule for how things change

Start with a cup of hot cocoa on the table. It cools fast when it is very hot and slowly when it is almost at room temperature. Nobody hands you a formula for the temperature at 3:07 p.m. What you do know is a rule for the *rate*: the hotter it is above the room, the faster it cools.

An equation that gives the rate of change of a quantity, instead of the quantity itself, is a **differential equation**. The rate of change of $y$ with time is written $\dot{y}$, read "y dot". It means "how fast $y$ is changing right now", in units of $y$ per second. A position in meters has a $\dot{y}$ in meters per second, which is a velocity.

Here is a tiny example we will use all through this module:

$$
\dot{y} = -2y.
$$

It says: $y$ shrinks at a rate equal to twice its current size. When $y = 1$ it is falling at $2$ per second. When $y = 0.1$ it is falling at only $0.2$ per second. That is the cocoa rule, with the room at zero. Its exact solution is $y(t) = y_0 e^{-2t}$, where $y_0$ is the starting value and $e \approx 2.718$ is the base of natural logarithms. Having the exact answer is what makes this equation so useful: we can measure precisely how wrong a numerical method is.

## The initial value problem

A rule for the rate is not enough on its own. The cocoa rule describes cocoa that starts at $90\,^\circ\mathrm{C}$ and cocoa that starts at $40\,^\circ\mathrm{C}$ equally well. To get one definite answer you also need the starting value.

The rate rule plus a starting value is called an **initial value problem**, or IVP — a differential equation together with the state at one known moment. In the general form every solver in this module uses:

$$
\dot{\mathbf{y}} = f(t, \mathbf{y}), \qquad \mathbf{y}(t_0) = \mathbf{y}_0.
$$

Read it as "y dot equals f of t and y, and y at t-nought equals y-nought". The pieces are:

- $\mathbf{y}$ (bold, because it can hold several numbers) is the **state** — the list of quantities that fully describes the system at one instant;
- $f(t, \mathbf{y})$ is the **right-hand side** — the function that takes the time and the current state and returns the rate of change of every entry;
- $t_0$ ("t nought") and $\mathbf{y}_0$ are the starting time and the starting state.

Solving the IVP means finding $\mathbf{y}(t)$ for later times. For almost every real vehicle there is no formula for that, so we compute it numerically, one step at a time, like the sailor.

::: key
An initial value problem is $\dot{\mathbf{y}} = f(t, \mathbf{y})$ with $\mathbf{y}(t_0) = \mathbf{y}_0$. A numerical integrator only ever asks one question of your physics: "given $t$ and $\mathbf{y}$, what is $f(t, \mathbf{y})$?"
:::

## Turning physics into a state vector

Newton's law gives acceleration, which is the rate of change of velocity, which is itself the rate of change of position. That is a *second* derivative of position, written $\ddot{x}$ and read "x double dot". The standard form above only has first derivatives. The trick is to put both position and velocity into the state. Then each one's rate of change is something you already know:

- the rate of change of position is the velocity, which is in the state;
- the rate of change of velocity is the acceleration, which the physics gives you.

Stacking quantities into one list like this makes a **state vector**.

Take a sounding rocket that has burned out and is coasting straight up. Let $x$ be its altitude and $v$ its vertical velocity, with up positive. Ignore air (it is high up) and treat gravity as the constant $g_0 = 9.80665\,\mathrm{m/s^2}$. Then

$$
\mathbf{y} = \begin{bmatrix} x \\ v \end{bmatrix}, \qquad
f(t, \mathbf{y}) = \begin{bmatrix} v \\ -g_0 \end{bmatrix}.
$$

In Python, the right-hand side is a function that takes `t` and `y` and returns an array of the same length as `y`:

```python
import numpy as np

G0 = 9.80665  # m/s^2

def coast(t, y):
    x, v = y                  # unpack altitude and velocity
    return np.array([v, -G0]) # d(altitude)/dt, d(velocity)/dt

print(coast(0.0, np.array([10_000.0, 300.0])))
# [300.        -9.80665]
```

It does not matter that `coast` ignores `t`. The signature `f(t, y)` is the contract every integrator expects, so you keep `t` even when the physics does not use it.

A satellite works the same way with six numbers: three for position $\mathbf{r}$ and three for velocity $\mathbf{v}$. The only force is Earth's gravity, pointing back toward Earth's center, with acceleration $-\mu \mathbf{r}/|\mathbf{r}|^3$. Here $|\mathbf{r}|$ is the distance from the center and $\mu$ ("mu") is Earth's **[[gravitational parameter|earth-mu]]**, about $3.986 \times 10^{14}\,\mathrm{m^3/s^2}$.

```python
import numpy as np

MU = 3.986004418e14  # m^3/s^2

def two_body(t, y):
    r, v = y[:3], y[3:]                  # position (m), velocity (m/s)
    a = -MU * r / np.linalg.norm(r)**3   # gravity, pointing at Earth's center
    return np.concatenate([v, a])

v_circ = np.sqrt(MU / 7.0e6)             # circular speed at 7000 km radius
y0 = np.array([7.0e6, 0.0, 0.0, 0.0, v_circ, 0.0])
dy = two_body(0.0, y0)
print(round(v_circ, 2))                  # 7546.05
print(dy[:3].round(2).tolist())          # [0.0, 7546.05, 0.0]
print(round(dy[3], 3))                   # -8.135
```

The first three entries of `dy` are the velocity (the position's rate of change). The last three are the acceleration, and only the first of those is not zero: $8.135\,\mathrm{m/s^2}$ pointing back toward Earth, a bit less than at the ground because the satellite is about $620\,\mathrm{km}$ up.

::: warning Return rates, not new states
The right-hand side returns *how fast* each entry is changing. It never returns the next state, and it never takes a step itself. If you catch yourself writing `x + v * dt` inside `f`, you are mixing the physics with the integrator. Keep them apart: `f` knows physics, the integrator knows stepping.
:::

## Taking one step

A computer cannot follow a smooth curve. It produces a list of snapshots: times $t_0, t_1, t_2, \dots$ and states $\mathbf{y}_0, \mathbf{y}_1, \mathbf{y}_2, \dots$. Read $\mathbf{y}_n$ as "y sub n": the computed state at time $t_n$. The gap between two times is the **step size** $h$, so $t_{n+1} = t_n + h$.

The simplest possible step is the sailor's: take the rate right now, assume it stays fixed for the whole step, and move.

$$
\mathbf{y}_{n+1} = \mathbf{y}_n + h\, f(t_n, \mathbf{y}_n).
$$

This is **Euler's method**, named after [[Leonhard Euler|euler-history]]. The next lesson builds better steps. Here it is our lab animal, because it is simple enough that you can see its errors with your own eyes.

Geometrically, Euler walks along the **tangent line** — the straight line that touches the curve at the current point and has the same slope there. If the true solution curves, the tangent line drifts off it, and the step lands a little bit wrong.

## Local truncation error: the error of one step

Suppose you start a step exactly on the true solution. You take one step of size $h$. The gap between where the method lands and where the true solution actually is at $t + h$ is the **local truncation error** — the error that a single step creates by itself.

The word "truncation" means "cutting short". Every step method is secretly a [[Taylor series|taylor-series]] that has been cut off after a few terms. The true value one step ahead is

$$
y(t + h) = y(t) + h\,\dot{y}(t) + \frac{h^2}{2}\,\ddot{y}(t) + \frac{h^3}{6}\,\dddot{y}(t) + \cdots
$$

Euler keeps the first two terms and throws the rest away. The biggest thing it throws away is $\frac{h^2}{2}\ddot{y}$. So Euler's local error is about $\frac{h^2}{2}\ddot{y}$: it grows like $h^2$. Halve the step and each step's error gets four times smaller.

We write this as $O(h^2)$, read "order h squared" — [[big-O notation|big-o]] for "grows like $h^2$ when $h$ is small, up to a constant".

::: example The coasting rocket, one step
The rocket starts at $x_0 = 10\,000\,\mathrm{m}$ going up at $v_0 = 300\,\mathrm{m/s}$. Take one Euler step of $h = 1\,\mathrm{s}$.

**Euler's step for altitude.** Rate of change of altitude is $v_0 = 300\,\mathrm{m/s}$, so

$$
x_1 = 10\,000 + 1 \times 300 = 10\,300\,\mathrm{m}.
$$

**The truth.** With constant gravity the exact altitude is $x(t) = x_0 + v_0 t - \frac{1}{2} g_0 t^2$. At $t = 1\,\mathrm{s}$:

$$
x(1) = 10\,000 + 300 - 4.903325 = 10\,295.096675\,\mathrm{m}.
$$

**Local error.** Euler lands $10\,300 - 10\,295.097 = 4.903\,\mathrm{m}$ too high. It assumed the rocket kept its starting speed for the whole second, but gravity was slowing it down.

**Compare with the formula.** Here $\ddot{x} = -g_0$, so the thrown-away term is $\frac{h^2}{2} g_0 = \frac{1}{2} \times 9.80665 = 4.903325\,\mathrm{m}$. Exactly what we measured.

**Halve the step.** With $h = 0.5\,\mathrm{s}$ the one-step error is $\frac{0.25}{2} \times 9.80665 \approx 1.226\,\mathrm{m}$ — a quarter of before, as $h^2$ predicts.
:::

## Global truncation error: what is left at the end

Nobody integrates for one step. You run from $t_0$ to some final time $t_f$ ("t final"), and what you care about is how wrong the final state is. That end-of-run error is the **global truncation error**.

Two things happen along the way. First, every step adds its own local error. Second, each step starts from a state that is already a bit wrong, so earlier errors are carried along. The number of steps is

$$
N = \frac{t_f - t_0}{h}.
$$

Smaller steps mean more of them. If each step adds an error of size about $C h^{p+1}$ for some constant $C$, then $N$ of them add up to about

$$
N \cdot C h^{p+1} = \frac{t_f - t_0}{h}\, C h^{p+1} = (t_f - t_0)\, C\, h^{p}.
$$

One power of $h$ is eaten by the number of steps. This is the central fact of the whole module, and it is how we define the **order** of a method: a method has order $p$ when its global error shrinks like $h^p$. Euler has order 1: its local error is $O(h^2)$ and its global error is $O(h)$.

::: key Local versus global truncation error
Local error is what one step introduces; for a method of order $p$ it scales as $h^{p+1}$. Global error accumulates over roughly $1/h$ steps, so it scales as $h^p$. That is why RK4 error falls by 16 when you halve the step ($2^4 = 16$).
:::

::: example The coasting rocket after ten seconds
Run Euler on the coasting rocket from $t = 0$ to $t = 10\,\mathrm{s}$ and compare the final altitude with the exact $x(10) = 10\,000 + 3000 - 490.3325 = 12\,509.6675\,\mathrm{m}$.

```python
import numpy as np

G0 = 9.80665
def coast(t, y):
    return np.array([y[1], -G0])

for h in [1.0, 0.5]:
    y = np.array([10_000.0, 300.0])
    n = int(round(10.0 / h))
    for i in range(n):
        y = y + h * coast(i * h, y)      # one Euler step
    print(h, n, round(y[0] - 12_509.6675, 3))
# 1.0 10 49.033
# 0.5 20 24.517
```

**Read the result.** With $h = 1\,\mathrm{s}$: ten steps, each adding $4.903\,\mathrm{m}$, and $10 \times 4.903325 = 49.03\,\mathrm{m}$ of total error. With $h = 0.5\,\mathrm{s}$: twenty steps, each adding $1.226\,\mathrm{m}$, and $20 \times 1.2258 = 24.52\,\mathrm{m}$.

**The pattern.** Each step's error went down by 4 when $h$ halved. But there were twice as many steps. So the global error went down by only $4 / 2 = 2$. That is $h^2$ locally and $h^1$ globally, exactly as the counting argument says.

**Sanity check.** Euler always uses the speed at the *start* of each step, and the rocket is always slowing down, so Euler should always overestimate the height. Both errors are positive: it does.
:::

The coasting rocket is special: its errors add up perfectly because gravity is constant. In most problems the dynamics also stretch or shrink the carried-along errors. The decay equation shows the same power law anyway.

::: example Decay with a shrinking step
Solve $\dot{y} = -2y$, $y(0) = 1$ to $t = 2$ with Euler. The exact answer is $e^{-4} \approx 0.0183156$. For this equation each Euler step multiplies $y$ by $(1 - 2h)$, so $N$ steps give $(1 - 2h)^N$.

**One step (local error).** With $h = 0.1$: Euler gives $0.8$, the truth is $e^{-0.2} \approx 0.818731$, so the local error is about $0.01873$. With $h = 0.05$: Euler gives $0.9$ against $e^{-0.1} \approx 0.904837$, an error of about $0.004837$. The ratio is $0.01873 / 0.004837 \approx 3.87$ — close to $4 = 2^2$.

**Whole run (global error).** With $h = 0.1$ (20 steps): $0.8^{20} \approx 0.011529$, error $\approx 0.006786$. With $h = 0.05$ (40 steps): $0.9^{40} \approx 0.014781$, error $\approx 0.003535$. With $h = 0.025$ (80 steps): error $\approx 0.001800$. Each halving cuts the error by about $1.92$, then $1.96$ — close to $2 = 2^1$.

**Sanity check.** The errors are large: at $h = 0.1$ the answer is off by $37\%$. That is Euler being a first-order method. The next lesson will get six more correct digits with the same number of steps.
:::

::: warning Local and global are not the same power
People say "Euler's error is $O(h^2)$" and "Euler is first order" in the same breath and both are true — they are talking about different errors. When someone states a method's order, they mean the **global** error. The local error is always one power higher. If you mix them up you will predict a factor of 4 when you halve $h$ and be puzzled when you see a factor of 2.
:::

::: note Why it has to be true
Let $e_n$ be the global error after $n$ steps, and suppose $f$ does not change too wildly: a change $\delta$ in the state changes $f$ by at most $L\delta$ for some constant $L$. One step carries the old error forward, magnified by at most $(1 + hL)$, and adds a new local error of at most $C h^{p+1}$:

$$
e_{n+1} \le (1 + hL)\, e_n + C h^{p+1}.
$$

Starting from $e_0 = 0$ and unrolling this $N$ times gives a sum of $N$ local errors, each magnified by at most $(1 + hL)^N$. Since $1 + hL \le e^{hL}$, that magnification is at most $e^{NhL} = e^{L(t_f - t_0)}$, which does not depend on $h$ at all. So

$$
e_N \le N C h^{p+1} e^{L(t_f - t_0)} = (t_f - t_0)\, C\, e^{L(t_f - t_0)}\, h^p.
$$

The power of $h$ is $p$, whatever the dynamics do. The dynamics only set the constant in front, which can be huge for long runs of **[[error-amplifying dynamics|error-growth]]**.
:::

## The other error: round-off

If smaller steps always help, why not take a trillion of them? Because a computer stores each number with only about 16 significant digits. Every addition rounds off the last digit. The gap between $1$ and the next number a standard `float64` can hold is about $2.2 \times 10^{-16}$, called **[[machine epsilon|machine-epsilon]]**.

Each step adds a round-off error of roughly that size relative to the state. Round-off does not shrink with $h$. It grows with the number of steps, like $N$, which is like $1/h$. So total error has two parts pulling in opposite directions:

- truncation error, which falls as $h^p$ when you shrink the step;
- round-off error, which rises roughly as $1/h$ when you shrink the step.

For large $h$, truncation wins and halving the step helps. Below some step size, round-off wins and halving the step makes things *worse*. For a good method in double precision, that floor is usually around $10^{-13}$ to $10^{-15}$ relative error. You will see the floor in the next lesson, when a step-halving test suddenly stops working.

::: warning More steps is not the same as more accuracy
A run with ten million steps is not automatically better than a run with ten thousand. Past the round-off floor, extra steps only add noise and cost. The cure for not enough accuracy is usually a *better method* (higher order), not a smaller step.
:::

## Where you meet this on a real vehicle

Every guidance, navigation and control team runs simulations built on the IVP. The booster's six-degree-of-freedom sim has a state vector of position, velocity, attitude, angular rate and remaining propellant mass. An orbit propagator's state is the six numbers of position and velocity. A navigation filter predicts its state forward between sensor readings the same way.

In all of these, the question "how accurate is this trajectory?" is really the question of this lesson. How big is each step's error, how do the errors add up over the run, and where does round-off take over? The rest of the module is about controlling that: better steps, step sizes that choose themselves, and checks that tell you when something has gone wrong.

## Check yourself

::: check
Write a pendulum as a first-order IVP. Its angle $\theta$ obeys $\ddot{\theta} = -\frac{g}{L}\sin\theta$, where $L$ is the string length. What goes in the state vector, and what does $f$ return?
:::

::: answer
The equation has a second derivative, so the state needs both the angle and its rate: $\mathbf{y} = [\theta, \omega]$, where $\omega = \dot{\theta}$ is the angular velocity. The rate of change of $\theta$ is $\omega$, which is in the state. The rate of change of $\omega$ is the physics: $-\frac{g}{L}\sin\theta$. So

$$
f(t, \mathbf{y}) = \begin{bmatrix} \omega \\ -\frac{g}{L}\sin\theta \end{bmatrix},
$$

and you also need the starting angle and starting rate, $\mathbf{y}(t_0) = [\theta_0, \omega_0]$, to make it an initial value problem.
:::

::: check
A method has order 3. You halve the step. By roughly what factor does (a) the error of one step change, and (b) the error at the end of a fixed run change?
:::

::: answer
(a) Local error scales as $h^{p+1} = h^4$. Halving $h$ divides it by $2^4 = 16$.

(b) Global error scales as $h^p = h^3$. Halving $h$ divides it by $2^3 = 8$. The difference is the doubled number of steps: each step's error is 16 times smaller, but there are 2 times as many of them, and $16 / 2 = 8$.
:::

::: check
In the coasting-rocket example, predict the Euler altitude error at $t = 10\,\mathrm{s}$ with $h = 0.25\,\mathrm{s}$, without running any code.
:::

::: answer
Each step's local error is $\frac{h^2}{2} g_0 = \frac{0.0625}{2} \times 9.80665 \approx 0.3065\,\mathrm{m}$. There are $10 / 0.25 = 40$ steps, and for constant gravity the errors add straight up: $40 \times 0.30646 \approx 12.26\,\mathrm{m}$. That is half of the $24.52\,\mathrm{m}$ at $h = 0.5\,\mathrm{s}$, as a first-order method should give.
:::

::: check
A colleague says: "My simulation is not accurate enough, so I cut the step from $10^{-3}\,\mathrm{s}$ to $10^{-9}\,\mathrm{s}$." What two problems might they run into?
:::

::: answer
First, cost: for a $100\,\mathrm{s}$ run that is $10^{11}$ steps instead of $10^5$ — a million times more work. Second, accuracy may not improve at all. With that many steps, round-off error (about $10^{-16}$ per operation, growing with the number of steps) can be larger than the truncation error they were trying to remove. A higher-order method is the usual fix.
:::

::: check
Why does Euler's method overestimate the altitude of a coasting rocket, but it would *underestimate* the altitude of a rocket whose engine is pushing it faster and faster?
:::

::: answer
Euler uses the rate at the *start* of each step for the whole step. A coasting rocket is slowing down, so the starting speed is the fastest speed during the step, and Euler moves it too far. A rocket that is speeding up has its slowest speed at the start of each step, so Euler moves it too little. In Taylor terms, the thrown-away term $\frac{h^2}{2}\ddot{x}$ is negative when $\ddot{x} < 0$ and positive when $\ddot{x} > 0$, and the error has the opposite sign.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Initial value problem | rate rule plus a starting state | $\dot{\mathbf{y}} = f(t, \mathbf{y})$, $\mathbf{y}(t_0) = \mathbf{y}_0$ |
| State vector | every quantity needed to describe the system now | second-order physics: stack position and velocity |
| Right-hand side | Python `f(t, y)` returning rates | returns an array the length of `y` |
| Euler step | follow the tangent for one step | $\mathbf{y}_{n+1} = \mathbf{y}_n + h f(t_n, \mathbf{y}_n)$ |
| Local truncation error | error made by one step from the true state | order $p$: grows like $h^{p+1}$ |
| Global truncation error | error left at the end of the run | order $p$: grows like $h^p$ |
| Number of steps | why one power is lost | $N = (t_f - t_0)/h$ |
| Round-off | about $2.2 \times 10^{-16}$ per operation | grows as $h$ shrinks; sets a floor |

Next lesson builds better steps than Euler — the midpoint method (RK2) and the classic fourth-order Runge-Kutta method (RK4) — implements them by hand, and uses step halving to prove numerically that each one has the order it claims.

::: context dead-reckoning Navigating by adding up small moves
Dead reckoning means working out where you are from where you started plus every move since. Sailors did it with a compass, a log line for speed and a clock. It is still how an inertial navigation system works: accelerometers and gyroscopes measure how the vehicle is moving, and a computer adds up those small changes many times a second. Its weakness is the same as a simulator's: small errors pile up with time, so the estimate slowly drifts away from the truth unless something like GPS corrects it.
:::

::: context earth-mu Why mu instead of G times M
Newton's gravity uses the constant $G$ times Earth's mass $M$. Engineers almost always use their product, $\mu = GM \approx 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$, instead. The reason is accuracy. We can measure $\mu$ very precisely by tracking satellites, to about ten significant figures. But $G$ on its own is known to only about five. Multiplying two separately known numbers would throw away most of that precision, so the product is kept as one number.
:::

::: context euler-history The man with his name on half of mathematics
Leonhard Euler (1707–1783) was a Swiss mathematician who worked in Saint Petersburg and Berlin. He described this "follow the slope for a short step" method in a textbook on integral calculus in the 1760s. So many results carry his name that mathematicians joke they name things after the second person to find them, or else everything would be called Euler's. His name is pronounced "OY-ler".
:::

::: context taylor-series Predicting a curve from one point
A Taylor series predicts a smooth function a short distance ahead using only what is known at one point: the value, the slope, how fast the slope bends, and so on.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="160" x2="340" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="160" x2="30" y2="15" stroke="#6c7a93" stroke-width="1"/>
  <path d="M40,150 Q180,150 320,30" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <circle cx="110" cy="142.5" r="4" fill="#1d6fd1"/>
  <line x1="110" y1="142.5" x2="320" y2="97.5" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="300" y1="101.8" x2="300" y2="46.5" stroke="#b4232c" stroke-width="2"/>
  <text x="306" y="80" font-size="12" fill="#b4232c">error</text>
  <text x="190" y="140" font-size="12" fill="#1d6fd1">tangent (2 terms)</text>
  <text x="200" y="60" font-size="12" fill="#1f2a44">true curve</text>
  <text x="100" y="155" font-size="12" fill="#1f2a44">start</text>
</svg>
```

Keeping only value and slope gives the dashed tangent line. The more terms a method matches, the closer it hugs the curve over one step, and the smaller the error left over.
:::

::: context big-o What "order h squared" promises
Writing an error as $O(h^2)$ promises that, for small enough $h$, the error is at most some fixed number times $h^2$. It says nothing about the size of that number, only about how the error *scales*. That is why the practical test is always a ratio: shrink $h$ by 2 and see whether the error shrinks by 4. The "O" stands for "order", from the German *Ordnung*, and the notation was made popular by the mathematician Edmund Landau around 1909.
:::

::: context error-growth When the dynamics magnify your mistakes
Some systems forget small errors and some magnify them. In the decay equation, two nearby solutions get closer as time goes on, so an old error shrinks. Near an unstable balance point — a pencil standing on its tip, or two spacecraft trajectories that pass close to the Moon — nearby solutions spread apart, and an early error keeps growing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">errors shrink</text>
  <path d="M20,40 Q90,90 160,120" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M20,70 Q90,110 160,124" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="270" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">errors grow</text>
  <path d="M200,80 Q270,78 340,30" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M200,86 Q270,90 340,140" fill="none" stroke="#b4232c" stroke-width="2"/>
  <line x1="180" y1="10" x2="180" y2="150" stroke="#6c7a93" stroke-width="1"/>
</svg>
```

The order of the method stays the same in both cases. What changes is the constant in front of $h^p$, which can make a long run far less accurate than a short one.
:::

::: context machine-epsilon The smallest step a number can take
A `float64` stores a number as 53 binary digits times a power of two. The next number above $1$ it can represent is $1 + 2^{-52}$, and $2^{-52} \approx 2.2 \times 10^{-16}$. NumPy reports it as `np.finfo(float).eps`. Any result is rounded to the nearest representable number, so each arithmetic operation can be off by about half of that, relative to the size of the answer. That is the source of the round-off floor.
:::
