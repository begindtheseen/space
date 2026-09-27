---
id: l11-fixed-step-real-time
title: Fixed-step integration for real-time flight code
minutes: 20
covers:
  - Fixed-step integration for real-time and code generation
---

Think of a drummer in a band. Every beat has to land on time. On an easy bar she has time to spare; on a hard fill she has to fit every hit into the same fraction of a second. What she cannot do is say "this bar is tricky, give me an extra half-second". The song does not wait.

A flight computer lives the same way. Many times a second — often 50 or 100 — it reads its sensors, works out where the vehicle is, decides where it should go, and commands the engines and fins. Each of these rounds is a **frame**, and each frame has a **deadline**: the moment the next frame must start. A computer that must always meet its deadlines is called **[[real-time|real-time-meaning]]**. For it, a right answer that arrives late is a wrong answer.

Everything so far in this module has been about solvers that choose their own steps: small where the motion is hard, large where it is easy. That is exactly the freedom a real-time computer cannot allow. This last lesson is about **fixed-step integration** — the same step size, and the same amount of work, every single time — and how to trust it when it has no error estimate at all. It is how flight software, hardware-in-the-loop simulators and code generated from Simulink models integrate their dynamics.

## The loop that must never be late

A flight computer runs its guidance, navigation and control in a fixed pattern. A typical frame at $100\,\mathrm{Hz}$ (read "hertz", times per second) lasts $10\,\mathrm{ms}$ and might look like this:

1. Read the sensors: accelerometers, gyros, GPS.
2. Update the navigation state (integrate the [[measured motion|strapdown-increments]] forward one frame).
3. Run guidance (perhaps propagate the trajectory ahead to predict engine cutoff).
4. Run the control laws and send commands to the actuators.
5. Sit idle until the next frame starts.

Slower jobs run every tenth or hundredth frame, in their own **[[rate groups|rate-groups]]**. The idle time at the end is the margin. To know the margin you need the **[[worst-case execution time|wcet]]** of each job: the longest it can ever take, on any input. Not the average. The longest.

Here is the problem with an adaptive solver in that loop. Its cost depends on the data. The same code, asked to propagate the same $600\,\mathrm{s}$ with the same tolerances, does different amounts of work for different orbits:

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 3.986004418e14

def two_body(t, y):
    r = y[:3]
    return np.concatenate([y[3:], -MU * r / np.linalg.norm(r)**3])

rng = np.random.default_rng(1)
counts = []
for _ in range(200):                       # 200 orbits, perigee 300 km, random e and position
    rp, e, nu = 6.678e6, rng.uniform(0.0, 0.7), rng.uniform(0.0, 2 * np.pi)
    p = rp * (1 + e)                       # semi-latus rectum
    r = p / (1 + e * np.cos(nu))
    vr, vt = np.sqrt(MU / p) * e * np.sin(nu), np.sqrt(MU / p) * (1 + e * np.cos(nu))
    y0 = [r * np.cos(nu), r * np.sin(nu), 0.0,
          vr * np.cos(nu) - vt * np.sin(nu), vr * np.sin(nu) + vt * np.cos(nu), 0.0]
    sol = solve_ivp(two_body, (0.0, 600.0), y0, rtol=1e-9, atol=1e-6)
    counts.append(sol.nfev)
print(min(counts), int(np.median(counts)), max(counts))
# 38 86 134
```

From $38$ to $134$ evaluations: a factor of $3.5$ between the easiest and hardest case in this sample. And that is only a sample. Nothing stops the next state from costing more. A near-singularity, a discontinuity like the ones in the last lesson, or a stiff moment can make the step collapse — the deadband there cost over half a million evaluations for $10\,\mathrm{s}$. Rejected steps are thrown away, so they cost time and give nothing. An implicit method adds a Newton iteration that might need three passes or thirty. There is no worst case you can write down.

::: key
Deployed flight code uses fixed-step integration because a control task must finish in a bounded, known time every cycle. Variable-step solvers have data-dependent cost and no worst-case bound, which is incompatible with real-time scheduling and with code generation for an embedded target.
:::

::: warning Capping the step does not make a solver real-time
Passing `max_step` to an adaptive solver limits how long a step can be, not how many steps it takes or how many it rejects. The cost can still grow without limit as the controller shrinks the step. A real-time integrator needs the number of right-hand-side calls per frame fixed before the code ever runs.
:::

## Fixed step: the same work every frame

A fixed-step method is the loop you wrote by hand in the RK4 lesson: choose $h$, take exactly $n$ steps, done. Classic RK4 calls the right-hand side exactly four times per step, whatever the state. So the cost of one frame is

$$
\text{cost} = n_{\text{steps}} \times 4 \times t_f ,
$$

where $t_f$ (read "t sub f") is the time one call to the right-hand side takes on the flight processor. Measure $t_f$ once, and the cost is known for every frame of every flight.

Notice what you give up. For the $200$ orbits above, a fixed RK4 with $h = 10\,\mathrm{s}$ spends $60 \times 4 = 240$ evaluations on every one of them — more than the adaptive solver's hardest case. Fixed-step integration is not chosen for efficiency. It is chosen for predictability. You size the step for the hardest case you will ever meet, and you pay that price on the easy cases too.

You also give up the error estimate. A fixed-step method has no second answer to compare against, so nothing inside the loop knows how wrong it is. The accuracy has to be established *before* flight, on the ground, by testing.

::: warning No error control means you must prove the accuracy yourself
A fixed-step integrator reports no error and never refuses a step. If the step is too large for some part of the flight envelope, it silently gives a worse answer there. Establish the error offline: run the fixed-step integrator against a trusted reference (an exact solution, or DOP853 at tight tolerance) with step halving, over the hardest cases the vehicle will see, and keep a margin.
:::

## Choosing the step for accuracy

Take an onboard job: predict where a spacecraft in a $400\,\mathrm{km}$ circular orbit will be $90$ minutes ($5400\,\mathrm{s}$) from now. A circular orbit has an exact answer — the spacecraft moves around the circle at a steady angular rate $n = \sqrt{\mu / a^3}$ (read "n equals the square root of mu over a cubed"), where $\mu$ is Earth's gravitational parameter and $a$ the orbit radius — so we can measure the error exactly.

```python
import numpy as np

MU = 3.986004418e14
a = 6.778e6                                   # 400 km circular orbit radius, m
n = np.sqrt(MU / a**3)                        # angular rate, rad/s

def f(t, y):
    r = y[:3]
    return np.concatenate([y[3:], -MU * r / np.linalg.norm(r)**3])

def rk4_fixed(f, y, t0, h, steps):
    t = t0
    for _ in range(steps):
        k1 = f(t, y)
        k2 = f(t + h / 2, y + h / 2 * k1)
        k3 = f(t + h / 2, y + h / 2 * k2)
        k4 = f(t + h, y + h * k3)
        y = y + h / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        t += h
    return y

y0 = np.array([a, 0.0, 0.0, 0.0, a * n, 0.0])
exact = a * np.array([np.cos(n * 5400.0), np.sin(n * 5400.0), 0.0])
for h in [120.0, 60.0, 30.0, 15.0]:
    steps = int(round(5400.0 / h))
    err = np.linalg.norm(rk4_fixed(f, y0, 0.0, h, steps)[:3] - exact)
    print(f"h={h:5.1f} s  steps={steps:3d}  calls={4 * steps:4d}  error={err:8.3f} m")
# h=120.0 s  steps= 45  calls= 180  error= 576.652 m
# h= 60.0 s  steps= 90  calls= 360  error=  28.508 m
# h= 30.0 s  steps=180  calls= 720  error=   1.545 m
# h= 15.0 s  steps=360  calls=1440  error=   0.089 m
```

Each halving of $h$ cuts the error by a factor between $17$ and $20$, close to the $16$ that fourth order promises. The step-halving check from the RK4 lesson is working, so this table can be trusted and extended.

::: example Fitting a propagator into a frame budget
**The requirement.** The prediction must be good to $10\,\mathrm{m}$ after $90$ minutes. It runs once a second, and the schedule gives it $20\,\mathrm{ms}$ of each second. On the flight processor one call to the right-hand side takes $t_f = 20\,\mu\mathrm{s}$ (read "microseconds", millionths of a second).

**The cost ceiling.** $20\,\mathrm{ms} / 20\,\mu\mathrm{s} = 0.020 / 0.000020 = 1000$ calls. RK4 uses $4$ per step, so at most $250$ steps. Over $5400\,\mathrm{s}$ that means $h \geq 5400 / 250 = 21.6\,\mathrm{s}$.

**The accuracy floor.** From the table, $h = 60\,\mathrm{s}$ misses by $28.5\,\mathrm{m}$, too much. $h = 30\,\mathrm{s}$ misses by $1.5\,\mathrm{m}$.

**The choice.** $h = 30\,\mathrm{s}$: $180$ steps, $720$ calls, $720 \times 20\,\mu\mathrm{s} = 14.4\,\mathrm{ms}$. That leaves $5.6\,\mathrm{ms}$ of the $20\,\mathrm{ms}$ unused, and the error is about $6.5$ times smaller than required.

**Sanity check.** Both margins are real, but the accuracy margin was measured on one easy case, a circular orbit. Before flight you would repeat the test on the most eccentric orbit the mission allows, with the full force model, and confirm the $1.5\,\mathrm{m}$ does not grow past $10\,\mathrm{m}$.
:::

## Choosing the step for stability

Accuracy is one limit on $h$. The other is **stability**, which you met with stiff problems: an explicit method blows up if its step is too long compared with the fastest part of the model.

The cleanest test is a fast, well-damped part on its own, such as a fin actuator that settles toward its command with a time constant $\tau$ (read "tau") of $5\,\mathrm{ms}$. Without a command it obeys $\dot{y} = -y / \tau$, and the exact solution shrinks by a factor $e^{-h/\tau}$ every step of length $h$. A method multiplies the state by its own **[[growth factor|rk4-stability-region]]** instead. For Euler that factor is $1 - h/\tau$. For RK4 it is the first five terms of the exact exponential's series,

$$
R = 1 - x + \frac{x^2}{2} - \frac{x^3}{6} + \frac{x^4}{24}, \qquad x = \frac{h}{\tau}.
$$

If the growth factor's size is bigger than $1$, every step makes the state bigger, and the simulation explodes.

```python
import numpy as np

def growth_euler(x):
    return 1 - x

def growth_rk4(x):
    return 1 - x + x**2 / 2 - x**3 / 6 + x**4 / 24

tau = 0.005                                  # actuator time constant, 5 ms
for rate in [200, 100, 50]:                  # frame rate, Hz
    x = (1.0 / rate) / tau
    print(f"{rate:3d} Hz  h/tau={x:3.1f}  Euler {growth_euler(x):+.3f}  "
          f"RK4 {growth_rk4(x):+.3f}  exact {np.exp(-x):.3f}")
# 200 Hz  h/tau=1.0  Euler +0.000  RK4 +0.375  exact 0.368
# 100 Hz  h/tau=2.0  Euler -1.000  RK4 +0.333  exact 0.135
#  50 Hz  h/tau=4.0  Euler -3.000  RK4 +5.000  exact 0.018
```

At $200\,\mathrm{Hz}$ RK4 is excellent: $0.375$ against the exact $0.368$. At $100\,\mathrm{Hz}$ it is stable but crude. At $50\,\mathrm{Hz}$ it multiplies the state by $5$ each step and explodes. Euler flips sign and never decays at $100\,\mathrm{Hz}$, and explodes at $50\,\mathrm{Hz}$.

::: key
For a decaying mode with time constant $\tau$, Euler is stable only for $h/\tau \le 2$ and classic RK4 only for $h/\tau \le 2.785$. Stability, not accuracy, often sets the largest fixed step you can use.
:::

When the frame rate is set by other things and a fast part does not fit, there are three standard cures.

- **Substeps.** Integrate the fast part $m$ times per frame with $h = \text{frame}/m$. At $50\,\mathrm{Hz}$ with four substeps, $h/\tau = 1$ again. The cost is four times higher, but it is still fixed.
- **Exact discretization.** For a linear part like this actuator, skip the integrator. Over one frame with the command $u$ held fixed, the exact update is $y_{k+1} = e^{-h/\tau} y_k + (1 - e^{-h/\tau})\,u$: one multiply and one add, correct at any $h$.
- **A fixed-cost implicit step.** Backward Euler is stable at any step. In real time you run its Newton solve for a fixed number of iterations — often just one, on a linearized model — so its cost stays bounded.

::: example Stabilizing the actuator at 50 Hz
**Substeps.** The frame is $20\,\mathrm{ms}$ and $\tau = 5\,\mathrm{ms}$. RK4 needs $h/\tau \le 2.785$, so $h \le 2.785 \times 5 = 13.9\,\mathrm{ms}$. Two substeps give $h = 10\,\mathrm{ms}$, $h/\tau = 2$: stable, but the growth factor is $0.333$ against the exact $0.135$, so the actuator's settling is badly off. Four substeps give $h = 5\,\mathrm{ms}$, $h/\tau = 1$: $0.375$ against $0.368$, good. Cost: $4 \times 4 = 16$ calls per frame.

**Exact discretization.** Compute $e^{-h/\tau} = e^{-4} = 0.0183$ once, before flight. Every frame, $y_{k+1} = 0.0183\,y_k + 0.9817\,u$. Starting from $y = 0$ with a command of $u = 2°$, one frame gives $0.9817 \times 2 = 1.963°$ — the exact value, at the cost of two multiplies.

**Sanity check.** After four time constants any first-order lag has covered $1 - e^{-4} \approx 98\%$ of the way to its command. The $1.963°$ out of $2°$ is exactly that.
:::

## Frames, held commands and events

A flight computer sends a new command once per frame and holds it constant until the next one. That is a **[[zero-order hold|zero-order-hold]]**: the command is a staircase. Every stair edge is a small jump in the right-hand side — the kind of discontinuity the last lesson warned about.

In a fixed-step simulation this works out for free, as long as each frame is a whole number of steps. The jumps then land on step boundaries, and no step straddles one. It breaks if you pick a step that does not divide the frame: a $15\,\mathrm{ms}$ step against a $20\,\mathrm{ms}$ frame straddles a command change at every other step, and the order of the method quietly drops.

Events work differently in real time. There is no root solver hunting down the exact moment; the flight code notices the condition in the first frame after it happens. So the timing is only as good as one frame. Take the two-stage ascent from the last lesson. At cutoff its acceleration is about $14.1\,\mathrm{m/s^2}$. If the engine is commanded off one full $10\,\mathrm{ms}$ frame late, it gains an extra $14.1 \times 0.010 = 0.14\,\mathrm{m/s}$. Real guidance does not accept that: it predicts, a frame ahead, when the target will be reached and times the cutoff command within the frame, allowing for the engine's thrust tail-off.

## Writing it so it can become flight code

An integrator destined for a flight computer is written under extra rules, because it will be translated to C or C++, or generated automatically from a model. The rules all serve one goal: the code must do the same thing, in the same time, every frame.

- **Sizes fixed at design time.** The state has six entries, always. No arrays that grow.
- **All memory set aside once, before the loop.** No new arrays inside a step. Creating memory takes a variable amount of time and can fail.
- **Loops with fixed counts.** No `while` loops that run until something converges.
- **No exceptions, no dynamic types.** Every path through the code is known in advance.

Here is the orbit propagator rewritten in that style. It gives the same answer as the NumPy version above.

```python
import numpy as np

MU = 3.986004418e14
N = 6                                           # state size, fixed at design time

def deriv(y, out):
    """Two-body rates, written into out. No new arrays are created."""
    r2 = y[0] * y[0] + y[1] * y[1] + y[2] * y[2]
    k = -MU / (r2 * np.sqrt(r2))
    out[0] = y[3]
    out[1] = y[4]
    out[2] = y[5]
    out[3] = k * y[0]
    out[4] = k * y[1]
    out[5] = k * y[2]

def rk4_step(y, h, k1, k2, k3, k4, tmp):
    """One RK4 step, updating y in place. Exactly 4 calls to deriv."""
    deriv(y, k1)
    for i in range(N):
        tmp[i] = y[i] + 0.5 * h * k1[i]
    deriv(tmp, k2)
    for i in range(N):
        tmp[i] = y[i] + 0.5 * h * k2[i]
    deriv(tmp, k3)
    for i in range(N):
        tmp[i] = y[i] + h * k3[i]
    deriv(tmp, k4)
    for i in range(N):
        y[i] += h / 6.0 * (k1[i] + 2.0 * k2[i] + 2.0 * k3[i] + k4[i])

# all memory is set aside once, before the loop starts
k1, k2, k3, k4, tmp = (np.zeros(N) for _ in range(5))
a = 6.778e6
y = np.array([a, 0.0, 0.0, 0.0, np.sqrt(MU / a), 0.0])
for _ in range(180):                            # 180 steps of 30 s: exactly 720 calls
    rk4_step(y, 30.0, k1, k2, k3, k4, tmp)

n = np.sqrt(MU / a**3)
exact = a * np.array([np.cos(n * 5400.0), np.sin(n * 5400.0), 0.0])
print(round(float(np.linalg.norm(y[:3] - exact)), 3))
# 1.545
```

In Python this style is slower than the NumPy version, and that is fine: it is a blueprint. Each line maps to one line of C. Tools can also compile it directly, as the next module shows. Graphical tools follow the same rule. Code generated from a Simulink model for an embedded processor must use one of Simulink's fixed-step solvers, such as `ode4`, which is classic RK4; see the note on [[code generation|simulink-codegen]].

Two tests go with such code. The first is a **back-to-back test**: run the flight-style integrator and the trusted reference on the same inputs and check that they agree to a tight tolerance. The second is **[[determinism|determinism]]**: the same inputs must give bit-for-bit the same outputs, run after run, so that a flight can be replayed on the ground exactly.

::: warning A reference that passes is not a flight that passes
A back-to-back test proves the flight code matches the model it was written from. It does not prove the step is small enough. That comes from the accuracy and stability studies above, done over the whole flight envelope. Keep the two questions separate: "is the code right?" and "is the method right?"
:::

## Check yourself

::: check
A guidance function runs at $50\,\mathrm{Hz}$ and is allowed $25\%$ of each frame to propagate the trajectory ahead with RK4. One call to the right-hand side takes $40\,\mu\mathrm{s}$ on the flight processor. How many RK4 steps can it take per frame, and what step does that allow for a $60\,\mathrm{s}$ look-ahead?
:::

::: answer
A $50\,\mathrm{Hz}$ frame lasts $1/50 = 20\,\mathrm{ms}$. A quarter of that is $5\,\mathrm{ms}$. The number of calls that fit is $5\,\mathrm{ms} / 40\,\mu\mathrm{s} = 0.005 / 0.00004 = 125$. RK4 needs $4$ calls per step, so $125 / 4 = 31.25$, which rounds down to $31$ whole steps. Over $60\,\mathrm{s}$ that means $h = 60 / 31 \approx 1.94\,\mathrm{s}$; in practice you would pick a round $2\,\mathrm{s}$ ($30$ steps, $120$ calls, $4.8\,\mathrm{ms}$) and then check with a step-halving study that $2\,\mathrm{s}$ meets the accuracy requirement.
:::

::: check
A teammate proposes running `solve_ivp` with RK45 in the flight software, because "it is more accurate, and on our test cases it was always faster than the fixed-step RK4." What is wrong with that argument?
:::

::: answer
Being faster on the test cases is about the average, and a real-time schedule depends on the worst case. RK45's cost depends on the data: step rejections, a near-singularity, a discontinuity or a stiff moment can multiply its work without any upper bound, and the frame deadline would be missed exactly when the flight is at its most demanding. Fixed-step RK4 costs the same four calls per step on every input, so its time can be measured once and scheduled with a margin. The teammate's cases also cannot cover every state the vehicle will see. (There are practical problems too: `solve_ivp` creates new arrays as it runs and has open-ended loops, which rules it out for embedded code.)
:::

::: check
A gas-jet valve model has a time constant of $2\,\mathrm{ms}$. The simulator runs at $100\,\mathrm{Hz}$ with RK4. Is it stable? If not, what is the smallest number of substeps that makes it stable, and is that enough?
:::

::: answer
At $100\,\mathrm{Hz}$, $h = 10\,\mathrm{ms}$ and $h/\tau = 10/2 = 5$. RK4 is stable only up to $2.785$, so it explodes. With $m$ substeps, $h/\tau = 5/m$. We need $5/m \le 2.785$, so $m \ge 1.8$, and the smallest whole number is $m = 2$, giving $h/\tau = 2.5$. That is stable, but the growth factor is $1 - 2.5 + 3.125 - 2.604 + 1.628 \approx 0.648$ against the exact $e^{-2.5} \approx 0.082$, so the valve's response would be far too slow. For accuracy you want $h/\tau$ around $1$ or less, which is $5$ substeps. Or, since the valve is linear, use the exact update with $e^{-5}$ per frame.
:::

::: check
A simulation's controller runs at $50\,\mathrm{Hz}$ and holds its command for each $20\,\mathrm{ms}$ frame. The plant model is integrated with RK4 at a fixed $h = 15\,\mathrm{ms}$ "to save time". What goes wrong, and what should $h$ be?
:::

::: answer
The held command jumps every $20\,\mathrm{ms}$. With $15\,\mathrm{ms}$ steps, the step boundaries fall at $0, 15, 30, 45, 60, \dots\,\mathrm{ms}$, while the jumps fall at $20, 40, 60, \dots\,\mathrm{ms}$. So two out of every three jumps land inside a step, and those steps straddle a discontinuity. That drops the whole simulation to first-order accuracy, as the discontinuities lesson showed. The step should divide the frame exactly: $h = 20\,\mathrm{ms}$ if that is accurate and stable enough, or $10$, $5$ or $4\,\mathrm{ms}$ if not.
:::

::: check
A colleague says: "Our onboard RK4 propagator with $h = 30\,\mathrm{s}$ is verified. It misses by only $1.5\,\mathrm{m}$ after $90$ minutes." What would you still want to see before accepting that?
:::

::: answer
Three things. First, the hardest cases, not one easy one: the $1.5\,\mathrm{m}$ came from a circular orbit, and a more eccentric orbit moves much faster near perigee, where a $30\,\mathrm{s}$ step is far coarser. Second, the real force model (Earth's oblateness, drag), which may add faster changes. Third, a step-halving check on those cases, to show the error falls by about $16$ per halving, so the result is trustworthy and not a lucky cancellation. You would also want the worst-case execution time measured on the flight processor, with its margin.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Frame and deadline | flight code runs in fixed frames, e.g. $10\,\mathrm{ms}$ at $100\,\mathrm{Hz}$; late is wrong |
| Why not adaptive | data-dependent cost, rejected steps, no worst-case bound |
| Fixed-step cost | $n_{\text{steps}} \times 4 \times t_f$ for RK4: known before flight |
| The price | sized for the worst case; no error estimate inside the loop |
| Accuracy | proven offline with step halving against a reference, over the envelope |
| Stability | Euler $h/\tau \le 2$; RK4 $h/\tau \le 2.785$ |
| Fast parts | substeps, exact discretization, or a fixed-cost implicit step |
| Held commands | make each frame a whole number of steps, so jumps land on step boundaries |
| Events | caught one frame late unless predicted and timed within the frame |
| Code-generation style | fixed sizes, memory set aside once, fixed loop counts, deterministic |

This closes the module: you can now choose a solver, set its tolerances, stop it at the right moment, check it with invariants, and pin it down to a fixed budget for flight. The next module, on Python performance, starts from the other end: when a simulation or a 500-case Monte Carlo is too slow, how to measure where the time goes and make it fast, including compiling loops like the ones in this lesson.

::: context real-time-meaning Fast is not the same as real-time
A real-time computer is not necessarily a fast one. It is one that is guaranteed to finish each job before its deadline. A desktop computer can be a thousand times faster on average and still be useless for flight control, because now and then it pauses for a few milliseconds to do something else. Engineers speak of "hard" real-time when a missed deadline is a failure, as in a rocket's control loop, and "soft" real-time when it only degrades quality, as in a video call that stutters.
:::

::: context strapdown-increments What the navigation actually integrates
A rocket's inertial measurement unit does not report position. It reports, at a fixed rate of a few hundred times a second, how much the velocity changed and how much the vehicle rotated since the last report. The navigation software adds these increments up, frame by frame, to keep track of attitude, velocity and position. That is fixed-step integration whose step is set by the sensor, not by the software designer.
:::

::: context rate-groups Fast jobs and slow jobs
Not every job needs the fastest rate. Attitude control might run every $10\,\mathrm{ms}$, guidance every $100\,\mathrm{ms}$, and housekeeping once a second. The scheduler runs the fast group every frame and slots the slow groups into chosen frames. The drawing shows ten $10\,\mathrm{ms}$ frames: the $100\,\mathrm{Hz}$ job in every frame, the $10\,\mathrm{Hz}$ job in the first, and idle margin after each.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="90" x2="330" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="30" y1="40" x2="30" y2="96"/><line x1="60" y1="40" x2="60" y2="96"/><line x1="90" y1="40" x2="90" y2="96"/>
    <line x1="120" y1="40" x2="120" y2="96"/><line x1="150" y1="40" x2="150" y2="96"/><line x1="180" y1="40" x2="180" y2="96"/>
    <line x1="210" y1="40" x2="210" y2="96"/><line x1="240" y1="40" x2="240" y2="96"/><line x1="270" y1="40" x2="270" y2="96"/>
    <line x1="300" y1="40" x2="300" y2="96"/><line x1="330" y1="40" x2="330" y2="96"/>
  </g>
  <g fill="#1d6fd1">
    <rect x="31" y="70" width="10" height="20"/><rect x="61" y="70" width="10" height="20"/><rect x="91" y="70" width="10" height="20"/>
    <rect x="121" y="70" width="10" height="20"/><rect x="151" y="70" width="10" height="20"/><rect x="181" y="70" width="10" height="20"/>
    <rect x="211" y="70" width="10" height="20"/><rect x="241" y="70" width="10" height="20"/><rect x="271" y="70" width="10" height="20"/>
    <rect x="301" y="70" width="10" height="20"/>
  </g>
  <rect x="41" y="70" width="12" height="20" fill="#f2b880"/>
  <text x="30" y="30" font-size="11" fill="#1f2a44">frame = 10 ms</text>
  <text x="30" y="114" font-size="11" fill="#1d6fd1">blue: 100 Hz control, every frame</text>
  <text x="30" y="130" font-size="11" fill="#1f2a44">orange: 10 Hz guidance, first frame only</text>
  <text x="30" y="146" font-size="11" fill="#6c7a93">white gap: idle margin before the deadline</text>
</svg>
```
:::

::: context wcet The longest it can ever take
Worst-case execution time is found two ways. One is measurement: run the code on the real processor over many inputs, record the longest time, and add a margin. The other is static analysis: tools read the compiled machine code and bound the longest path through it. Both are much easier when the code has fixed loop counts and no memory allocation — one more reason flight integrators are written that way. A job whose worst case cannot be bounded cannot be scheduled.
:::

::: context rk4-stability-region The growth factor, drawn
The curves show the size of the growth factor per step against $h/\tau$ for a decaying mode. Below the dashed line at $1$ the method is stable. Euler (grey) touches $1$ at $h/\tau = 2$ and climbs past it. RK4 (blue) hugs the exact decay (orange) for small steps, dips to about $0.27$ near $h/\tau = 1.6$, and climbs back through $1$ at $2.785$. The exact answer never leaves the stable zone.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="30" x2="50" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="100" x2="330" y2="100" stroke="#6c7a93" stroke-width="1" stroke-dasharray="5 4"/>
  <text x="44" y="104" font-size="11" text-anchor="end" fill="#6c7a93">1</text>
  <text x="44" y="174" font-size="11" text-anchor="end" fill="#6c7a93">0</text>
  <text x="44" y="34" font-size="11" text-anchor="end" fill="#6c7a93">2</text>
  <text x="120" y="186" font-size="11" text-anchor="middle" fill="#6c7a93">1</text>
  <text x="190" y="186" font-size="11" text-anchor="middle" fill="#6c7a93">2</text>
  <text x="260" y="186" font-size="11" text-anchor="middle" fill="#6c7a93">3</text>
  <text x="330" y="186" font-size="11" text-anchor="middle" fill="#6c7a93">4</text>
  <text x="300" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">h / tau</text>
  <polyline points="50,100 120,170 190,100 260,30" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <polyline points="50.0,100.0 57.0,106.7 64.0,112.7 71.0,118.1 78.0,123.1 85.0,127.5 92.0,131.5 99.0,135.2 106.0,138.4 113.0,141.2 120.0,143.8 127.0,145.9 134.0,147.7 141.0,149.2 148.0,150.2 155.0,150.9 162.0,151.1 169.0,150.8 176.0,150.0 183.0,148.7 190.0,146.7 197.0,144.0 204.0,140.5 211.0,136.2 218.0,130.9 225.0,124.6 232.0,117.2 239.0,108.5 246.0,98.4 253.0,86.9 260.0,73.8 267.0,58.9 274.0,42.1" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="50.0,100.0 67.5,115.5 85.0,127.5 102.5,136.9 120.0,144.2 137.5,149.9 155.0,154.4 172.5,157.8 190.0,160.5 207.5,162.6 225.0,164.3 242.5,165.5 260.0,166.5 277.5,167.3 295.0,167.9 312.5,168.4 330.0,168.7" fill="none" stroke="#f2b880" stroke-width="2"/>
  <line x1="245" y1="100" x2="245" y2="170" stroke="#b4232c" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="249" y="160" font-size="11" fill="#b4232c">2.785</text>
  <text x="200" y="60" font-size="11" fill="#6c7a93">Euler</text>
  <text x="280" y="50" font-size="11" fill="#1d6fd1">RK4</text>
  <text x="280" y="160" font-size="11" fill="#f2b880">exact</text>
</svg>
```
:::

::: context zero-order-hold A staircase of commands
"Zero-order" because the command between updates is a polynomial of order zero — a constant. The smooth command the controller would like is replaced by a staircase that jumps once per frame. Digital control, later in the course, studies how this holding changes a control loop's behavior; for integration, the point is that each jump sits on a frame boundary.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="140" x2="340" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="20" x2="30" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <text x="336" y="155" font-size="11" text-anchor="end" fill="#6c7a93">time (frames)</text>
  <path d="M30,130 C110,120 180,60 330,30" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <polyline points="30,130 80,130 80,124 130,124 130,108 180,108 180,86 230,86 230,63 280,63 280,45 330,45" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#b4232c"><circle cx="80" cy="127" r="3"/><circle cx="130" cy="116" r="3"/><circle cx="180" cy="97" r="3"/><circle cx="230" cy="74" r="3"/><circle cx="280" cy="54" r="3"/></g>
  <text x="200" y="28" font-size="11" fill="#6c7a93">smooth wish</text>
  <text x="200" y="120" font-size="11" fill="#1d6fd1">held command</text>
  <text x="40" y="96" font-size="11" fill="#b4232c">jumps at frame edges</text>
</svg>
```
:::

::: context simulink-codegen Fixed-step solvers in Simulink
Simulink offers both kinds of solver. The variable-step ones (`ode45`, `ode15s` and friends) are for desktop analysis. The fixed-step ones are named by order: `ode1` is Euler, `ode2` Heun's method, `ode3` Bogacki–Shampine, `ode4` classic RK4, `ode5` Dormand–Prince, `ode8` an eighth-order Dormand–Prince. Generating code for an embedded processor with Embedded Coder requires a fixed-step solver, for exactly the reasons in this lesson. The step you choose becomes the base rate of the generated code.
:::

::: context determinism Same inputs, same bits
Floating-point arithmetic rounds after every operation, so $(a + b) + c$ and $a + (b + c)$ can differ in the last bit. Code that adds things up in a different order from run to run — because of threads, or a compiler choosing a different order — can drift apart over thousands of frames. Flight code avoids this so that a recorded flight can be replayed on the ground and give exactly the same numbers, which is how anomalies are investigated.
:::
