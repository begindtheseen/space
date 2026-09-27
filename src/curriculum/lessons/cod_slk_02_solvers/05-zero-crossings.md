---
id: l05-zero-crossings
title: 'Zero crossings: catching the exact moment something happens'
minutes: 24
covers:
  - 'Zero-crossing detection: how it works, chattering, adaptive versus non-adaptive, the consecutive-crossing limit'
  - Solver reset method Fast versus Robust
  - 'Fixed-step zero-crossing for real-time: bounded, deterministic event cost'
---

Imagine you are filming a ball dropped onto a floor, but your camera only takes one photo every tenth of a second. In one photo the ball is a hand's width above the floor. In the next it is already on its way back up. When exactly did it touch? The photos do not say. If you want the true moment, you have to go back and look more closely between those two photos.

A solver has the same problem. It only sees the model at its steps. Anything sudden that happens between steps — a ball hitting the floor, a gimbal reaching its stop, a valve slamming shut, a staging event — can be missed, or noticed late. Lesson 1 named the tool Simulink uses to catch these moments: **zero-crossing detection**. This lesson opens it up: how it finds the moment, how it can fail, the settings that control it, and what a real-time model can do when it must run at a fixed step.

On a real vehicle, events are everywhere. An engine gimbal hits its limit. A landing leg touches the pad. A tank's level falls past a sensor. A separation spring stops pushing. A plant model that gets these moments wrong can be off by far more than any tolerance setting would suggest.

## Events as sign changes

Here is the trick that makes events findable. Almost any "something happens" can be written as "some number passes through zero".

- The ball hits the floor when its height $y$ passes through zero.
- A Saturation block with an upper limit of 6 engages when $u - 6$ passes through zero.
- A Switch flips when its control input minus the threshold passes through zero.

Such a number is a **zero-crossing function**, a signal chosen so that the event is exactly the moment it changes sign. Many Simulink blocks create them for you. The Saturation block, Dead Zone, Relay, Switch, MinMax, Abs, Sign, the Integrator with limits, and others each register one or more. You never draw them on the diagram; they live inside the block.

**Zero-crossing detection** then works in three moves:

1. **Watch.** After each step, the solver compares every zero-crossing function with its value at the step before. The same sign on both sides means nothing happened. A sign change means an event happened somewhere inside the step.
2. **Locate.** The solver now knows the crossing is between the two step times. It **brackets** it: it keeps an interval with a positive value at one end and a negative value at the other, and shrinks that interval with a **[[root-finding|root-finding]]** method until it is shorter than a small time tolerance.
3. **Land and restart.** The solver takes a step to just before the crossing and another to just after it. There the block changes its **[[mode|mode]]** (the Saturation switches from "passing through" to "clipped"), and the solver resets and carries on from the event.

::: key
Zero-crossing detection: the solver watches sign changes of designated functions and shortens the step to land on the crossing. For a Saturation block the crossing is the moment the input reaches the limit; without it the solver steps over the corner and smears a discontinuity into the solution.
:::

Why does "smearing" matter so much? Every solver from lesson 2 is built on the assumption that the model is smooth inside a step. A Runge–Kutta formula samples the slope at a few points and fits a smooth curve through them. If a corner sits inside the step, the curve is wrong on one side of it, and the method's high order is lost.

::: example What a corner inside a step costs
Feed $u = 2\sin t$ through a Saturation with limits $\pm 1$ and integrate the output — add up the area under it — from $t = 0$ to $\pi$ seconds. The input reaches the limit when $2\sin t = 1$, so $\sin t = 0.5$, at $t = \pi/6 \approx 0.5236$ s, and leaves it at $5\pi/6 \approx 2.618$ s.

**The exact answer.** On the two ramps the output is $2\sin t$; in the middle it is 1. The integral is

$$
2\int_0^{\pi/6} 2\sin t\, dt + 1 \times \frac{2\pi}{3} = 4\left(1 - \cos\frac{\pi}{6}\right) + \frac{2\pi}{3} \approx 0.5359 + 2.0944 = 2.6303.
$$

**Stepping over the corners.** Integrate with a fourth-order rule and a fixed step of 0.3 s, whose grid points ($0, 0.3, 0.6, \dots$) do not include $0.5236$ or $2.618$. Python gives 2.62746, an error of about $2.8 \times 10^{-3}$.

**Landing on the corners.** Add the two crossing times to the grid, so no step straddles a corner. The same rule now gives 2.6302944, an error of about $9 \times 10^{-7}$ — about 3,000 times smaller, for two extra steps.

**Shrink the step.** At a step of 0.1 s, stepping over gives an error of $4.4 \times 10^{-4}$, about 6 times smaller than before. A true fourth-order method would have improved $3^4 = 81$ times. The corner, not the step, is setting the error.

**Sanity check.** Landing on the corners, the error falls from $9 \times 10^{-7}$ to $1.6 \times 10^{-8}$, about 55 times, close to the 81 that fourth order promises. Once the corners are handled, the method behaves as advertised.
:::

The crossing does two jobs at once. It puts the event at the right time, and it keeps the solver from integrating across a corner. Both are why the Saturation block's **Enable zero-crossing detection** box is on by default.

## A bouncing ball, step by step

The classic test of event handling is a ball dropped from 10 m onto a hard floor. It falls under gravity, $g = 9.81\,\mathrm{m/s^2}$. At each bounce its velocity reverses and shrinks by the **[[coefficient of restitution|restitution]]** $e = 0.8$. The zero-crossing function is the height.

Python's `solve_ivp` does the same thing Simulink does, with an `events` function. The integration stops at each crossing, the bounce is applied, and it restarts:

```python
from scipy.integrate import solve_ivp

g, e = 9.81, 0.8                    # gravity (m/s^2), coefficient of restitution

def fall(t, s):                     # s = [height, velocity]
    return [s[1], -g]

def floor(t, s):                    # the zero-crossing function
    return s[0]
floor.terminal = True               # stop the integration at the crossing
floor.direction = -1                # only count downward crossings

t0, s, hits = 0.0, [10.0, 0.0], []
while len(hits) < 200:
    sol = solve_ivp(fall, (t0, 20.0), s, events=floor, rtol=1e-9, atol=1e-12)
    if sol.status != 1:             # 1 means "stopped by an event"
        break
    t0, v = sol.t_events[0][0], sol.y_events[0][0][1]
    hits.append(t0)
    s = [0.0, -e * v]               # the bounce: reverse and shrink velocity
    if abs(s[1]) < 1e-9:
        break

print([float(round(t, 4)) for t in hits[:4]])
print(len(hits), round(hits[-1], 6), f"{hits[-1] - hits[-2]:.1e}")
# [1.4278, 3.7124, 5.54, 7.0021]
# 105 12.850588 2.4e-10
```

::: example Checking the first bounces by hand
**First impact.** A drop from height $h_0 = 10\,\mathrm{m}$ takes $t_1 = \sqrt{2h_0/g}$:

$$
t_1 = \sqrt{\frac{2 \times 10}{9.81}} \approx 1.4278\,\mathrm{s}.
$$

The impact speed is $g t_1 = \sqrt{2 g h_0} \approx 14.007\,\mathrm{m/s}$. The code's first event is at 1.4278 s. It matches.

**Second impact.** The ball leaves at $0.8 \times 14.007 \approx 11.206\,\mathrm{m/s}$. A ball thrown up at speed $v$ lands again after $2v/g$:

$$
\frac{2 \times 11.206}{9.81} \approx 2.2846\,\mathrm{s},
$$

so the second impact is at $1.4278 + 2.2846 = 3.7124$ s. The code says 3.7124 s.

**The whole story.** Each flight is 0.8 times as long as the one before, so the flight times form a shrinking geometric series. Adding it up, the ball makes infinitely many bounces and still comes to rest at a finite time:

$$
T = t_1\left(1 + \frac{2e}{1 - e}\right) = t_1 \times 9 \approx 12.8506\,\mathrm{s}.
$$

The code stopped after 105 bounces at 12.850588 s, with the last gap only $2.4 \times 10^{-10}$ s long.

**Sanity check.** The rebound height after the first bounce should be $e^2 h_0 = 0.64 \times 10 = 6.4\,\mathrm{m}$, less than 10 m, and every flight shorter than the last. Energy is lost at every bounce, as it must be.
:::

Look at the end of that run. The gaps between bounces shrink toward zero while time creeps toward 12.85 s and never quite gets there. Every bounce is a legitimate event. There is simply an endless supply of them.

## Chattering and the consecutive-crossing limit

That is **chattering**: many zero crossings packed into a tiny stretch of time. Each one forces the solver to locate it, land on it and restart, and the step size is driven toward zero. The simulation clock stops moving forward while the computer works harder and harder.

The bouncing ball chatters because of physics: the model has infinitely many events before rest, a behavior called **[[Zeno|zeno]]**. Much more often, a model chatters because of a modeling shortcut:

- a Relay or Sign block used as a controller with no **[[hysteresis|hysteresis]]**, so the output flips every time the error wobbles across zero;
- dry friction modeled with a hard switch at zero velocity, so the sign of the friction force flips back and forth on a part that should be stuck;
- a switching condition that holds a signal right at its threshold, so it crosses and re-crosses on round-off alone.

Simulink guards against a model stalling this way. It counts **consecutive zero crossings** — crossings that come one after another closer together than a small time tolerance. The limit is set by **Number of consecutive zero crossings** (1000 by default) together with **Time tolerance** (10*128*eps by default, a relative amount of about $2.8 \times 10^{-13}$). Exceed it and Simulink reports a consecutive zero-crossings violation, naming the blocks whose zero-crossing signals caused it and the tiny time interval they piled up in. The diagnostic **Consecutive zero-crossings violation** decides whether that is an error, a warning or ignored.

::: key
Chattering is repeated crossings in a tiny interval, which drives the step towards zero and stalls the simulation. Simulink caps consecutive crossings and offers an adaptive algorithm; the real fix is usually hysteresis or a small deadband in the model.
:::

::: warning Raising the limit is not a fix
When the consecutive-crossing error appears, the tempting move is to raise the count to a million or switch zero-crossing detection off. Both hide the symptom. Raising the limit makes a stalled simulation stall for longer. Turning detection off lets the solver step over events and smear the result, as the Saturation example showed. Look at the blocks the message names and ask why their signal sits on the threshold. Then fix the model: add hysteresis to the Relay, put a small deadband on the switch, or give the ball a rule that says "below 1 cm/s rebound speed, it stays on the floor".
:::

## Adaptive and nonadaptive detection

The **Zero-crossing control** setting in the Solver pane decides which blocks take part: **Use local settings** (each block's own checkbox, the default), **Enable all** or **Disable all**. Below it, the **Algorithm** setting chooses how crossings are handled:

- **Nonadaptive** (the default) locates every crossing, every time, to the time tolerance. It is the most accurate, and it is the one that stalls on a chattering signal.
- **Adaptive** watches for chattering. When a signal keeps flip-flopping within a small band around zero, it turns bracketing off for that signal and steps through, and turns it back on when the signal moves clear. The band is set by the **Signal threshold** (`auto` by default): values within it are treated as zero.

Think of the adaptive algorithm as a referee who stops calling every tiny touch in a scramble and waits for a clear play. It rescues a simulation that is chattering for a harmless reason. It does not make a badly posed model right.

## Solver resets: Fast versus Robust

Landing on an event ends with a **solver reset**. The solver has to throw away some of what it knew. For a one-step method like ode45 that costs little. For a multistep method like ode113 or ode15s it costs more: they build up a **[[history of past steps|history]]** to reach high order, and a reset sends them back to the first order with small steps. Resets also happen at other moments, such as when an Integrator's state is reset or a parameter changes.

The implicit variable-step solvers from lesson 3 — ode15s, ode23t and ode23tb — carry one more expensive item: the **Jacobian**, the matrix of how each state derivative depends on each state, which their Newton iterations need. The **Solver reset method** setting decides what happens to it at a reset:

- **Fast** (the default) reuses the Jacobian it already has. After a mild event it is still close enough, and the reset is quick.
- **Robust** recomputes the Jacobian and related quantities at every reset. That costs more per event, but after an event that changes the dynamics sharply — a clutch locking, a leg touching down, a valve closing — a stale Jacobian can make Newton's method fail to converge and force the step down over and over.

::: key
Solver reset method Fast versus Robust: on a solver reset (for example after a zero crossing), Robust recomputes the Jacobian and related quantities, which is slower but more reliable; Fast reuses them. Start with Robust when a model with events behaves strangely.
:::

## Events at a fixed step, in real time

Now return to lesson 4's marching drummer. A fixed-step solver does not locate events by default. It notices the sign change only at the next beat, and handles the event there, late.

::: example The ball at a fixed step
Run the same ball with a fixed step and no detection, bouncing whenever a step ends below the floor.

**At $h = 0.01$ s.** The first bounce is recorded at 1.43 s instead of 1.4278 s, with the ball already 3.0 cm below the floor. Over the first three bounces it reaches 5.3 cm into the floor.

**At $h = 0.05$ s.** The first bounce comes at 1.45 s, 22 ms late, with the ball 31 cm into the floor, and a later bounce reaches 32 cm.

**Why those sizes.** The ball can travel at most $v h$ past the floor before a step catches it: $14.007 \times 0.01 \approx 0.14\,\mathrm{m}$ and $14.007 \times 0.05 \approx 0.70\,\mathrm{m}$. The actual depths depend on where the grid happens to fall, and stay within that bound.

**Sanity check.** A real ball never goes into a concrete floor. Every centimeter below zero is solver error, and it grows with the step, as it should.
:::

In a desktop simulation you would switch to a variable-step solver and be done. A real-time plant model on a hardware-in-the-loop rig cannot do that. It must finish every step within its time slot, say 1 ms, every time. A variable-step event search has no fixed cost: a chattering signal could demand a thousand extra steps in one slot. The real-time computer would **[[overrun|overrun]]** its slot, and the test would be invalid.

So Simulink offers **zero-crossing detection for fixed-step simulation**, an option you enable in the Solver pane. It keeps the fixed beat: the major steps stay on the same time grid. When a zero-crossing function changes sign inside a step, the solver brackets the crossing with a limited number of iterations and handles the event inside the step, then finishes the step on time. You set a maximum number of bracketing iterations and a maximum number of crossings per step. Those two caps are the point: they bound the extra work, so the worst-case time for a step is known in advance.

The result is less exact than a variable-step search, because the crossing time is only refined a few times. But it is far better than handling every event one step late, and its cost is **bounded and deterministic** — the same promise every fixed-step solver makes.

::: key
Fixed-step zero-crossing detection keeps the fixed step grid and locates events inside a step with a capped number of bracketing iterations and a capped number of crossings per step, so the extra cost of an event has a known worst case. That is what a real-time target needs; a variable-step event search has no such bound.
:::

## Check yourself

::: check
Write a zero-crossing function for each event: (a) a descending lander's legs touch the ground when altitude reaches 1.5 m; (b) a tank sensor trips when propellant mass falls below 200 kg; (c) a Switch with threshold 0.3 flips.
:::

::: answer
Any function that changes sign exactly at the event works. (a) $h - 1.5$, which goes from positive to negative at touchdown. (b) $m - 200$, which goes negative when the mass drops below 200 kg. (c) $u_2 - 0.3$, the control input minus the threshold. In each case the solver sees a sign change between two steps, brackets it, and lands on the exact time.
:::

::: check
The ball in the lesson is dropped from 5 m instead of 10 m, with the same $e = 0.8$. When does it come to rest?
:::

::: answer
The first impact is at $t_1 = \sqrt{2 \times 5 / 9.81} \approx 1.0096$ s. The total time is $9\,t_1$ because $1 + 2e/(1-e) = 1 + 1.6/0.2 = 9$ for any drop height, so it rests at about $9.087$ s. The height only changes $t_1$; the geometric series of shrinking flights is the same.
:::

::: check
A simulation of an attitude controller built around a Sign block stops at $t = 42.7$ s with a consecutive zero-crossings error that names the Sign block. What is going on, and what is the right fix?
:::

::: answer
The attitude error has reached zero, and the Sign block's output flips every time the error wobbles across zero, so crossings pile up in a tiny interval until the count exceeds the limit. That is chattering from a modeling shortcut. The right fix is in the model: replace the Sign with a Relay that has hysteresis, or add a small deadband so tiny errors give zero output — which is also what a real thruster controller does to save propellant. The Adaptive algorithm could let the simulation continue, but it would still be modeling a controller that switches infinitely fast.
:::

::: check
A model with ode15s and a landing-gear contact model runs well until touchdown, then slows to a crawl with many rejected steps. What single setting would you try first, and why?
:::

::: answer
Set Solver reset method to Robust. Touchdown sharply changes the dynamics, so the Jacobian ode15s had before the event no longer describes the system. With Fast it keeps using the stale Jacobian, Newton's method struggles to converge, and the solver keeps cutting the step. Robust recomputes the Jacobian at the reset, so the iterations start from an accurate picture of the new dynamics.
:::

::: check
Why can't a HIL plant model use variable-step event location, even if the host computer is very fast?
:::

::: answer
Because speed is not the problem; the lack of a bound is. A variable-step search takes as many steps as the events demand, and a chattering signal can demand hundreds in one time slot. No matter how fast the computer, there is no worst case to design the slot around. Fixed-step zero-crossing detection caps the bracketing iterations and crossings per step, so the worst case is known and can be fit inside the slot.
:::

## Summary

| Idea | Meaning | Setting or fact |
|---|---|---|
| Zero-crossing function | A signal whose sign change marks an event | Registered by blocks such as Saturation, Switch, Relay |
| Detection | Watch sign changes, bracket, land on the crossing, reset | Keeps a corner out of any step |
| Chattering | Many crossings in a tiny interval | Step driven to zero; fix with hysteresis or deadband |
| Consecutive-crossing limit | Cap on crossings packed within a time tolerance | Default 1000 crossings, time tolerance 10*128*eps |
| Nonadaptive / Adaptive | Locate every crossing / stop bracketing a chattering signal | Nonadaptive is the default; Adaptive uses Signal threshold |
| Solver reset method | What happens to the Jacobian at a reset | Fast reuses it (default); Robust recomputes it |
| Fixed-step zero crossing | Events located inside a fixed step | Capped iterations and crossings: bounded, deterministic cost |
| Bouncing ball rest time | Zeno sum of shrinking flights | $T = t_1(1 + 2e/(1-e))$ |

Events decide when things happen; sample times decide how often each block runs at all. The next lesson looks at the beat each block marches to — continuous, discrete, inherited and constant — and at the colors Simulink paints on the diagram to show them.

::: context root-finding Closing in on the crossing
The solver already has a smooth estimate of the solution between the two step times, so it can evaluate the zero-crossing function anywhere inside the step without taking a real step. It keeps an interval with opposite signs at its ends and shrinks it. The simplest way is **bisection**: test the middle, keep the half where the sign changes. Faster methods draw a straight line between the two end values and test where it crosses zero, with safeguards that stop one end from getting stuck. Either way, the interval can never lose the crossing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="75" x2="340" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40,30 C130,32 200,55 225,95 C255,118 300,126 330,128" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="40" cy="30" r="4" fill="#1f2a44"/>
  <circle cx="330" cy="128" r="4" fill="#1f2a44"/>
  <text x="30" y="20" font-size="11" fill="#1f2a44">step start: +</text>
  <text x="262" y="146" font-size="11" fill="#1f2a44">step end: −</text>
  <line x1="185" y1="58" x2="185" y2="90" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="140" y="50" font-size="11" fill="#6c7a93">middle: still +</text>
  <rect x="185" y="68" width="145" height="14" fill="#f2b880" opacity="0.5"/>
  <circle cx="207" cy="75" r="4" fill="#b4232c"/>
  <text x="212" y="66" font-size="11" fill="#b4232c">crossing</text>
</svg>
```

After testing the middle, the crossing must lie in the shaded half.
:::

::: context mode Why blocks hold a mode inside a step
Between steps, a Saturation block does not decide afresh at every trial point whether it is clipping. It keeps its current **mode** — "linear" or "at the upper limit" — for the whole step, so the solver sees a smooth function. Meanwhile its zero-crossing function keeps measuring how far the input is from the limit. When that changes sign, the mode is switched exactly at the crossing. Holding the mode is what keeps the corner out of the middle of a step.
:::

::: context restitution How bouncy a bounce is
The **coefficient of restitution** $e$ is the ratio of the speed after an impact to the speed before it. A value of 1 is a perfectly elastic bounce; 0 means the object sticks. A basketball on a wood floor is roughly 0.8, which is why the example uses it. Because kinetic energy goes with speed squared, each bounce keeps $e^2 = 0.64$ of the energy, and each rebound reaches 64% of the previous height. Landing-gear and docking-mechanism models use the same idea, usually as a spring and damper instead of a single number.
:::

::: context zeno Infinitely many bounces, finite time
The name comes from Zeno of Elea, the Greek philosopher who argued that a runner can never finish a race because they must first cover half of it, then half the rest, forever. The sum of those halves is finite, and so is the sum of the ball's flight times. A model with infinitely many events before a finite time is called a **Zeno model**. No solver can step through all the events, so the model itself needs a rule for "it has stopped".

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M30,20 Q46.6,20 63.3,120 Q90,-8 116.7,120 Q138,38.1 159.3,120 Q176.4,67.6 193.5,120 Q207.1,86.4 220.8,120 Q231.7,98.5 242.6,120 Q251.4,106.3 260.1,120 Q267.1,111.2 274.1,120 Q279.7,114.4 285.3,120 Q289.7,116.4 294.2,120 Q297.8,117.7 301.4,120 L330,120" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="330" y1="30" x2="330" y2="126" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="250" y="24" font-size="11" fill="#b4232c">rest at 12.85 s</text>
  <text x="40" y="136" font-size="11" fill="#1f2a44">each flight 0.8 times the last</text>
</svg>
```
:::

::: context hysteresis The thermostat fix
Hysteresis means a switch turns on at one level and off at a different one, like a thermostat that heats below 19 °C and stops above 21 °C. The Relay block in the previous module has exactly this, through its separate switch-on and switch-off points. A deadband is the cousin: small inputs near zero produce no output at all. Either one gives the signal room to wobble without flipping the switch, which removes the chattering at its source.
:::

::: context history Why multistep solvers dislike resets
A multistep solver such as ode113 or ode15s predicts the next step from several previous ones, the way you might guess where a car is going from its last few positions. After an event, those old positions describe a system that no longer exists — the ball was falling and is now rising — so they must be discarded. The solver restarts from one known point at low order and small steps, and builds up again. A model with an event every few milliseconds can keep a multistep solver permanently in that slow restart.
:::

::: context overrun When a real-time step runs long
A real-time computer starts each step on a hardware timer tick. If the work for one step is not finished when the next tick arrives, that is an **overrun**. Depending on how the target is set up, it either skips a step, logs the overrun, or halts the test. Any of these breaks the promise that the simulated vehicle keeps pace with real time, so a flight computer under test would be reacting to a plant that has fallen behind. Real-time engineers budget the worst-case step time with margin, and an unbounded event search makes that impossible.
:::
