---
id: l08-glideslope-algorithms
title: Glideslope algorithms
minutes: 18
covers:
  - glideslope algorithms
---

The two-impulse targeting of the previous lesson computes exactly the right burn for exactly one planned transfer time — powerful, but brittle. If a burn executes a little late, or slightly off in magnitude, the whole plan has to be re-targeted from scratch, and the previous lesson's own reality check showed that even a perfectly executed CW-targeted transfer still misses by a measurable amount once nonlinear truth is accounted for. A real final approach needs something more forgiving: a rule that says, continuously, "given how far away you are right now, here is how fast you should be closing" — self-correcting by construction, because it reacts to actual range rather than committing to a single pre-computed trajectory. That rule is a glideslope, named by direct analogy with the radio beam that guides an aircraft down to a runway at a steady, predictable angle.

## The glideslope law

The standard glideslope commands closing rate as a linear function of remaining range:

$$
\dot r = -(a+br), \qquad a,b \ge 0,
$$

with $r$ the range to the target (always positive, approaching zero) and $\dot r$ the commanded rate of change — negative, since $r$ is decreasing. This is a first-order linear ODE, solved exactly the way the earlier ODE-module lessons taught: separate variables or use an integrating factor, giving

$$
r(t) = \left(r_0+\frac{a}{b}\right)e^{-bt} - \frac{a}{b}.
$$

Two regimes are worth telling apart. With $a=0$, the law is pure proportional feedback, $\dot r=-br$, and the solution is a clean exponential, $r(t)=r_0e^{-bt}$: closing rate is always exactly $b$ times the remaining range, so the approach slows down automatically as it gets close, and in principle never quite reaches $r=0$ in finite time — it only gets arbitrarily near. With $a>0$, a constant floor rate is added on top of the proportional term, and the trajectory does reach $r=0$ in finite time, arriving there at exactly rate $a$ (not zero) — solving $r(t)=0$ for $t$:

$$
t_{\text{close}} = \frac{1}{b}\ln\!\left(1+\frac{br_0}{a}\right).
$$

::: key The glideslope law
$$
\dot r = -(a+br), \qquad r(t) = \left(r_0+\frac{a}{b}\right)e^{-bt}-\frac{a}{b}.
$$
$a=0$: pure exponential decay, asymptotically approaching zero range with vanishing closing rate. $a>0$: reaches $r=0$ in finite time $t_{\text{close}}=(1/b)\ln(1+br_0/a)$, arriving at closing rate exactly $a$ — a deliberate, nonzero terminal rate rather than an indefinite crawl.
:::

Either form gives a *time constant* $1/b$: the time for the proportional part of the range to decay by a factor of $e\approx2.718$. A larger $b$ means a more aggressive glideslope — faster closure at any given range, at the cost of a higher instantaneous closing rate (and therefore more propellant to arrest it if the approach is aborted) for the same starting range.

Notice what the glideslope law does *not* need: unlike the two-impulse targeting of the previous lesson, it never references a fixed transfer time $T$ or a state transition matrix at all. It is a feedback law stated purely in terms of the instantaneous range, so it keeps producing a sensible command even if the chaser is a little ahead of or behind where an open-loop plan predicted — exactly the robustness a final approach needs after the previous lesson's own reality check showed a CW-targeted transfer arriving close to, but not exactly at, its planned point.

::: example A pure proportional glideslope between hold points
Take $b=0.001\,\mathrm{s^{-1}}$ ($a=0$), a reasonable choice giving $1\,\mathrm{m/s}$ of closing rate at $1000\,\mathrm{m}$ range. Time to close between three representative hold points:

| Segment | Time | Rate at start | Rate at end |
| --- | --- | --- | --- |
| 250 m $\to$ 30 m | 2120.3 s (35.3 min) | 0.250 m/s | 0.030 m/s |
| 30 m $\to$ 10 m | 1098.6 s (18.3 min) | 0.030 m/s | 0.010 m/s |
| 250 m $\to$ 10 m | 3218.9 s (53.6 min) | 0.250 m/s | 0.010 m/s |

Each segment's time follows directly from $t=(1/b)\ln(r_a/r_b)$ (the $a=0$ special case of $t_{\text{close}}$ above, applied between two nonzero ranges rather than down to contact): $(1/0.001)\ln(250/30) = 1000\times2.120=2120.3\,\mathrm{s}$, and likewise for the other segments. Closing rate drops by exactly the same factor as range at every point — a spacecraft flying this law ten times closer than another is, by construction, also closing ten times more slowly, which is exactly the self-moderating behaviour a final approach wants.
:::

::: example A floored glideslope arriving at a deliberate contact rate
Approaching the last 30 m to contact with a small nonzero floor $a=0.005\,\mathrm{m/s}$ and the same $b=0.001\,\mathrm{s^{-1}}$: $t_{\text{close}} = (1/0.001)\ln(1+0.001\times30/0.005) = 1000\ln(7) = 1945.9\,\mathrm{s}$ (32.4 min), reaching $r=0$ at a controlled $5\,\mathrm{mm/s}$ rather than asymptoting forever. Partway through, at $t=1000\,\mathrm{s}$, $r=(30+5)e^{-1}-5=7.876\,\mathrm{m}$ and the commanded rate is $a+br=5+0.001(7876)=12.88\,\mathrm{mm/s}$ — differentiating $r(t)$ directly confirms this matches $\dot r$ to within numerical roundoff at every sampled point. A pure $a=0$ law could get this vehicle very close but never actually command it to touch — some nonzero floor rate is what turns "approach indefinitely" into "arrive."
:::

## Executing a continuous law with real thrusters

A real chaser cannot thrust continuously to track $\dot r=-(a+br)$ exactly — thrusters are on-off devices, and firing them constantly would burn far more propellant than a series of well-timed pulses achieves for the same net effect. In practice, a glideslope is flown as a sequence of small braking burns: measure range and range-rate, compare the actual rate against the commanded $-(a+br)$ for the current range, and fire a short correction pulse whenever the two have drifted apart by more than some deadband. The continuous curve above is the target trajectory the discrete pulses are chasing, not a literal firing schedule.

This is also why hold points exist at all — the 250 m, 30 m and 10 m gates used in the worked example are not arbitrary waypoints; they are places where the glideslope is deliberately paused (commanded rate set to zero) so that ground controllers or onboard autonomy can verify the chaser's state, check that every system supporting the next segment is healthy, and hold an explicit go/no-go before resuming closure. A continuous, unbroken glideslope from far range straight to contact would give no natural point to stop and check without inventing one; the gates are where that checking happens by design.

::: warning Choosing $b$ is a real trade, not a free parameter
A large $b$ closes fast but arrives at any given range carrying a higher closing rate, demanding more propellant (and a larger safety margin) to null if the approach must be broken off there. A small $b$ is gentle and cheap to abort out of, but takes proportionally longer at every gate, consuming more of a finite approach window and more sensor tracking time. Neither choice is generically "correct" — it is set by the propellant budget, the sensor's usable range, and how much time the mission can spend in proximity operations, and it is worth re-deriving for each hold-point segment rather than reusing one $b$ for the whole approach.
:::

## Check yourself

::: check
For a pure proportional glideslope ($a=0$) with $b=0.002\,\mathrm{s^{-1}}$, how long does it take to close from $400\,\mathrm{m}$ to $50\,\mathrm{m}$?
:::

::: answer
$t=(1/b)\ln(r_0/r_1) = (1/0.002)\ln(400/50) = 500\ln(8) = 500\times2.0794 = 1039.7\,\mathrm{s}$, about 17.3 minutes.
:::

::: check
Explain why the $a=0$ glideslope never reaches $r=0$ in finite time, using the closed-form solution rather than intuition alone.
:::

::: answer
With $a=0$, $r(t)=r_0e^{-bt}$, and $e^{-bt}$ is strictly positive for every finite $t$ — it approaches zero only in the limit $t\to\infty$. Setting $r(t)=0$ and solving for $t$ has no finite solution, confirming algebraically what the physical picture suggests: a closing rate that is always exactly proportional to remaining range keeps shrinking the rate right along with the range, so the last few centimetres take, in principle, forever to close.
:::

::: check
Two glideslopes share the same $b$ but one has a floor $a_1$ twice the other's $a_2$. Which one reaches $r=0$ sooner, starting from the same $r_0$, and does it arrive gently or abruptly compared to the other?
:::

::: answer
$t_{\text{close}}=(1/b)\ln(1+br_0/a)$ is a decreasing function of $a$ (a larger $a$ makes $br_0/a$ smaller, shrinking the logarithm), so the glideslope with the larger floor $a_1$ reaches $r=0$ sooner. It also arrives less gently: the arrival rate is exactly $a$, so the faster-arriving trajectory (larger $a_1$) touches down at twice the closing rate of the slower one.
:::

::: check
Why are hold points placed at specific ranges (like 250 m, 30 m, 10 m) rather than flying one continuous glideslope from far range straight to contact?
:::

::: answer
A continuous glideslope gives no natural, planned point at which to pause, verify vehicle and sensor health, and get an explicit authorization to proceed — hold points are inserted specifically to create those checkpoints, each one a deliberate zero-rate pause rather than a feature of the underlying $\dot r=-(a+br)$ law itself.
:::

::: check
A mission wants the final approach to arrive at contact carrying no more than $3\,\mathrm{cm/s}$, using the floored law with $b=0.0015\,\mathrm{s^{-1}}$ starting from $r_0=10\,\mathrm{m}$. What is the largest floor $a$ that satisfies the contact-rate limit, and roughly how long would that segment take?
:::

::: answer
The arrival rate equals $a$ exactly, so the constraint reads $a\le0.03\,\mathrm{m/s}$ directly; take $a=0.03\,\mathrm{m/s}$ at the limit. Time to close: $t_{\text{close}}=(1/0.0015)\ln(1+0.0015\times10/0.03) = 666.7\ln(1.5)=666.7\times0.4055=270.4\,\mathrm{s}$, about 4.5 minutes for this final segment.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\dot r=-(a+br)$ | Glideslope law: closing rate linear in remaining range |
| $r(t)=(r_0+a/b)e^{-bt}-a/b$ | General closed-form solution |
| $a=0$ | Pure exponential decay; never reaches $r=0$ in finite time |
| $a>0$ | Reaches $r=0$ at $t_{\text{close}}=(1/b)\ln(1+br_0/a)$, arriving at rate exactly $a$ |
| $1/b$ | Time constant of the approach; larger $b$ closes faster but costs more to abort |
| Worked $a=0$, $b=0.001\,\mathrm{s^{-1}}$ example | 250→30 m: 35.3 min; 30→10 m: 18.3 min |
| Hold points | Deliberate zero-rate pauses inserted for verification and go/no-go, not features of the continuous law |
| Discrete execution | Real thrusters fly the curve as a series of small correction pulses against measured range and rate |

Glideslopes describe *how fast* to close along a line. The next lesson asks *which line* — comparing an approach along the velocity vector against one along the local vertical, and showing why that choice is one of the most consequential safety decisions in the whole rendezvous.
