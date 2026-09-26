---
id: l12-terminal-midcourse-and-actuator-limits
title: Terminal versus midcourse guidance, and actuator limits
minutes: 17
covers:
  - Terminal vs midcourse guidance; guidance under actuator limits
---

Think about parking a car in a narrow garage. Out on the street you drive loosely: stay in your lane, head for the right house, no need to be exact. At the driveway everything changes. You slow down, watch the mirrors, and fix every few centimeters until the bumper stops just short of the wall. Two phases, two styles of driving.

And one more thing. The brakes can only stop the car so fast. If you come in too quickly, pressing the pedal harder does nothing more once it is on the floor. You hit the wall anyway.

Every guidance law in this module quietly assumed two things: that the vehicle knows its state precisely, and that it can command any acceleration the law asks for. Neither holds for a whole flight. Far from the target there may be nothing precise to measure yet. And every real engine or thruster has a maximum push. This last lesson of the module takes on both: how a flight is split into a coarse phase and a precise one, and what really happens when a law asks for more than the hardware can give.

## Midcourse guidance: get close, not exact

**Midcourse guidance** is the "driving down the street" phase. Its job is to get the vehicle into the right neighborhood, on a safe and efficient path, ready for a precise phase to finish. Its job is *not* to drive any error to zero.

Why not? Because it usually flies before precise sensing exists. A missile flies midcourse before its **[[seeker|seeker]]** locks on to the target. A chaser spacecraft far from a space station flies on ground tracking and its own rough navigation. A lunar lander high above the surface has not yet got a good radar fix on the ground. With coarse measurements, a coarse, gentle law is the honest choice.

The corridor-following law from lesson 3 fits this job well:

$$
\ddot y = -k_1 y - k_2\dot y ,
$$

where $y$ is the sideways offset from the approach line, $\dot y$ ("y dot") its rate, and $k_1, k_2$ fixed gains. It is cheap, it is smooth, and it does not demand more precision than the sensors can give.

## Terminal guidance: finish the job

**Terminal guidance** is the "creeping into the garage" phase. It takes over once precise sensing is available and the time left is short enough that precision both matters and can be reached. Proportional navigation and ZEM/ZEV guidance are built for this phase. Their gains grow like $1/t_{go}$ and $1/t_{go}^2$ as time runs out, so they push harder and harder on whatever error is left. Run them much earlier, with noisy measurements and lots of time left, and they would be needlessly aggressive and chase noise.

The moment of switching is the **[[handoff|handoff-relay]]**. The key idea: midcourse does not have to be perfect at the handoff. It only has to leave an error small enough that terminal guidance can remove it in the time left.

::: example A handoff that does not need to be perfect
A chaser flies midcourse with the corridor law, using $k_1 = 4 \times 10^{-4}\,\mathrm{s^{-2}}$ and $k_2 = 0.04\,\mathrm{s^{-1}}$ — a **[[critically damped|critical-damping]]** pair with natural frequency $\omega_n = 0.02\,\mathrm{rad/s}$. It starts $y_0 = 8\,\mathrm{m}$ off the line, drifting away at $\dot y_0 = 0.02\,\mathrm{m/s}$. It hands off after $200\,\mathrm{s}$, well before midcourse has fully converged.

Step 1, the midcourse state at handoff. A critically damped system has the exact solution $y(t) = \big(y_0 + (\dot y_0 + \omega_n y_0)\,t\big)e^{-\omega_n t}$. Here $\dot y_0 + \omega_n y_0 = 0.02 + 0.16 = 0.18\,\mathrm{m/s}$, and $\omega_n t = 4$. So $y = (8 + 0.18 \times 200)\,e^{-4} = 44 \times 0.018316 = 0.806\,\mathrm{m}$. Its rate works out to $\dot y = -0.0128\,\mathrm{m/s}$, still closing.

Step 2, switch to terminal guidance. Aim for $y = 0$ and $\dot y = 0$ at $t_{go} = 15\,\mathrm{s}$ with the ZEM/ZEV law. In one dimension, $ZEM = -(y + \dot y\,t_{go})$ and $ZEV = -\dot y$.

Step 3, the first command. $ZEM = -(0.806 - 0.192) = -0.614\,\mathrm{m}$ and $ZEV = 0.0128\,\mathrm{m/s}$. The command is $(6/225)(-0.614) - (2/15)(0.0128) = -0.0164 - 0.0017 = -0.0181\,\mathrm{m/s^2}$. A gentle push back toward the line.

Step 4, fly it in closed loop to $t_{go} = 0$. The code below does it. The chaser arrives with $y$ and $\dot y$ both zero to within rounding noise — from a handoff that was still off by most of a meter.

```python
import numpy as np

# Midcourse: critically damped corridor law, y'' = -k1*y - k2*y', wn = 0.02 rad/s
wn, y0, ydot0, t_h = 0.02, 8.0, 0.02, 200.0
c = ydot0 + wn * y0
y_h = (y0 + c * t_h) * np.exp(-wn * t_h)
ydot_h = (c - wn * (y0 + c * t_h)) * np.exp(-wn * t_h)
print(f"handoff: y = {y_h:.4f} m, ydot = {ydot_h:.5f} m/s")

def zem_zev_accel_1d(y, ydot, tgo):
    zem = -(y + ydot * tgo)          # target: y = 0 ...
    zev = -ydot                      # ... and ydot = 0
    return (6 / tgo**2) * zem - (2 / tgo) * zev

def terminal(T, a_max=None, dt=1e-4):
    y, ydot = y_h, ydot_h
    for i in range(int(round(T / dt))):
        a = zem_zev_accel_1d(y, ydot, T - i * dt)
        if a_max is not None:
            a = np.clip(a, -a_max, a_max)   # saturate to what the actuator can deliver
        y, ydot = y + ydot * dt + 0.5 * a * dt**2, ydot + a * dt
    return y, ydot

print("15 s, no limit:", terminal(15.0))
for a_max in [None, 0.05, 0.03, 0.02]:
    y, ydot = terminal(8.0, a_max)
    print(f"8 s, limit {a_max}: y = {y:+.4f} m, ydot = {ydot:+.4f} m/s")
# handoff: y = 0.8059 m, ydot = -0.01282 m/s
# 15 s, no limit: (tiny numbers, about 1e-25 and 1e-18)
# 8 s, limit None: y = +0.0000 m, ydot = +0.0000 m/s
# 8 s, limit 0.05: y = -0.0084 m, ydot = -0.0183 m/s
# 8 s, limit 0.03: y = -0.0668 m, ydot = -0.1031 m/s
# 8 s, limit 0.02: y = +0.0633 m, ydot = -0.1728 m/s
```

Sanity check: the first command, $0.0181\,\mathrm{m/s^2}$, is tiny — a hundredth of a $g$ would be about $0.098\,\mathrm{m/s^2}$ — which fits a correction of under a meter spread over $15\,\mathrm{s}$.
:::

::: key Two phases, two jobs
Midcourse: coarse accuracy, whatever sensing is available, a safe and efficient path toward the engagement — not convergence. Terminal: fine sensing, steep time-to-go gains, drives the real objective (the miss, or position and velocity together) to zero in the time left. The handoff happens when fine sensing becomes available and enough time remains for the terminal gains to do the work — not at some range fixed in advance.
:::

## Guidance under actuator limits

Now the brakes. Every law in this module commands whatever $a_c = N V_c\dot\lambda$ or $(6/t_{go}^2)ZEM - (2/t_{go})ZEV$ works out to. It never asks whether a thruster, a gimballed engine or a fin can actually produce it. Real **actuators** — the parts that push — have a maximum. When a command asks for more, the actuator **[[saturates|saturation-clip]]**: it gives its maximum and no more.

The worst place for this is the end of the flight. That is where these laws' gains are steepest, so that is where the demands are biggest.

A saturated command is not a smaller copy of the right answer. The optimal control module showed, using Pontryagin's minimum principle, that when the push has a hard limit, the best control is usually **[[bang-bang|bang-bang]]**: full push one way for a while, then possibly full push the other way, switching at carefully chosen moments. That plan looks at the whole rest of the flight.

**Clipping** — computing the normal law and then cutting its output down to the limit — is what most real systems do, and it is a reasonable approximation. A heavily clipped law ends up pushing at full strength in the needed direction, much like a bang-bang plan. But it is not the same thing. Clipping only reacts to the limit one instant at a time. It never re-plans the best use of limited push over the rest of the flight.

::: example What a thrust limit costs at contact
Take the same handoff state, $y = 0.806\,\mathrm{m}$ and $\dot y = -0.0128\,\mathrm{m/s}$, but suppose terminal guidance gets only $t_{go} = 8\,\mathrm{s}$ instead of $15$.

Step 1, what the unlimited law wants. For a double integrator flown this way, the command changes in a straight line from start to finish. It starts at $-6y/T^2 - 4\dot y/T = -0.0691\,\mathrm{m/s^2}$ (push toward the line) and ends at $+6y/T^2 + 2\dot y/T = +0.0723\,\mathrm{m/s^2}$ (brake). So the peak demand is $0.0723\,\mathrm{m/s^2}$.

Step 2, fly it with three smaller limits (the code above does this):

| Available $\lvert a_{max}\rvert$ | Final $y$ | Final $\dot y$ |
| --- | --- | --- |
| unlimited (peak demand $0.0723\,\mathrm{m/s^2}$) | $0$ | $0$ |
| $0.05\,\mathrm{m/s^2}$ | $-0.0084\,\mathrm{m}$ | $-0.0183\,\mathrm{m/s}$ |
| $0.03\,\mathrm{m/s^2}$ | $-0.0668\,\mathrm{m}$ | $-0.1031\,\mathrm{m/s}$ |
| $0.02\,\mathrm{m/s^2}$ | $+0.0633\,\mathrm{m}$ | $-0.1728\,\mathrm{m/s}$ |

Step 3, read it. Cutting the limit from $0.05$ to $0.02\,\mathrm{m/s^2}$ — to $40\%$ — does not cut the result gently. The leftover offset grows about $7.5$ times ($0.0084 \to 0.0633\,\mathrm{m}$) and the contact speed about $9.4$ times ($0.0183 \to 0.173\,\mathrm{m/s}$).

Step 4, notice the sign. With $0.05$ and $0.03\,\mathrm{m/s^2}$, the chaser reaches the line but cannot brake hard enough, so it crosses it and ends up on the other side (negative $y$). With $0.02\,\mathrm{m/s^2}$ the law asks for full push toward the line the *entire* $8\,\mathrm{s}$ and never gets to brake at all — and still it falls $6.3\,\mathrm{cm}$ short. A linear, unlimited analysis would predict neither. Deep saturation does not shrink the outcome; it changes its shape.

Sanity check: pushing flat out at $0.02\,\mathrm{m/s^2}$ for $8\,\mathrm{s}$ from $\dot y = -0.0128\,\mathrm{m/s}$ gives a final rate of $-0.0128 - 0.02 \times 8 = -0.1728\,\mathrm{m/s}$, exactly the table's value. It really did push the same way the whole time.
:::

A contact speed of $0.17\,\mathrm{m/s}$, nearly ten times the $0.018\,\mathrm{m/s}$ of the $0.05$ case, is what "the actuator could not keep up" means in practice for a **[[docking mechanism|docking-speed]]** built for gentle contact.

::: warning A saturating law degrades silently, then all at once
Nothing in a clipped command says it was clipped. It is still a number, it is still applied, and the vehicle still seems to be "flying the guidance law" — right up until the miss or the contact speed turns out too large. This is the same silent failure that a bad time-to-go had in lesson 10, for the same reason: a law built assuming unlimited push cannot tell, from its own output, that the assumption has stopped holding. Watch the **[[ratio of commanded to available|command-margin]]** acceleration during the flight, not only the final result. That catches the trouble before contact.
:::

::: note Real terminal guidance is designed around the limit, not surprised by it
A mature design does not discover the actuator limit at contact. It sizes the terminal gains, the handoff conditions and the thrusters or engine together, so that the worst expected case still asks for less than the hardware can deliver. The root-finding example in lesson 10 — choosing the shortest $t_{go}$ whose first command still respects a thrust limit — is exactly this kind of decision made on purpose.
:::

## Check yourself

::: check
Why is it right for midcourse guidance to hand a nonzero error over to terminal guidance, instead of being expected to remove it all by itself?
:::

::: answer
Midcourse guidance has a different job: get into the right neighborhood with whatever coarse sensing exists, not drive the final error to zero. Terminal guidance's gains grow like $1/t_{go}$ and $1/t_{go}^2$, far steeper than midcourse's fixed gains as time runs out, so it is much better placed to finish a small leftover correction in the time that remains. Asking midcourse to converge fully would mean running needlessly aggressive gains for a long time, against sensing that may not yet support that precision.
:::

::: check
At the handoff in the example, the terminal law's first command was $-0.0181\,\mathrm{m/s^2}$ at $t_{go} = 15\,\mathrm{s}$. If the thruster can deliver at most $0.01\,\mathrm{m/s^2}$, what happens at that instant?
:::

::: answer
The command's size, $0.0181\,\mathrm{m/s^2}$, is bigger than the $0.01\,\mathrm{m/s^2}$ available, so the actuator saturates at once. The vehicle applies $-0.01\,\mathrm{m/s^2}$, its most in the needed direction, instead of the full $-0.0181\,\mathrm{m/s^2}$. The guidance law still computed the right number; the vehicle simply cannot carry it out, and from here on the trajectory departs from what the unlimited analysis predicted.
:::

::: check
Why is clipping a linear guidance law's output to the actuator limit only an *approximation* to the true best solution under that limit?
:::

::: answer
The true best solution under a hard limit, from the optimal control module's Pontryagin treatment, plans the whole rest of the control history knowing the limit will bind. It is usually bang-bang: full push one way, then perhaps the other, with the switch times chosen for the best overall result. Clipping only reacts instant by instant, taking whatever the unlimited law says now and cutting it down. It never re-plans the best use of limited push over the remaining flight. So a heavily clipped law can look close to bang-bang without actually being the best bang-bang plan.
:::

::: check
In the docking example, tightening the limit from $0.03$ to $0.02\,\mathrm{m/s^2}$ flipped the sign of the final offset. Does that mean the guidance law is broken?
:::

::: answer
No. It is a real, if surprising, effect of deep saturation. An unlimited linear law responds smoothly and in proportion to its inputs. A saturated one does not, because the actuator sits at its maximum for long stretches instead of following the smoothly varying command. At $0.03\,\mathrm{m/s^2}$ the chaser reached the line too fast and could not brake in time, so it crossed over. At $0.02\,\mathrm{m/s^2}$ it pushed toward the line the whole time and still fell short. A linear, unlimited analysis cannot predict either shape — which is why you watch how close the command runs to the limit long before the limit is reached.
:::

::: check
A design review proposes handing off from midcourse to terminal guidance as early as possible, because "more time for terminal guidance can only help". What does this lesson suggest is missing from that reasoning?
:::

::: answer
First, terminal guidance needs fine sensing to mean anything. Handing off before that sensing is available or reliable gains nothing: the steep terminal gains would react to noisy or missing measurements instead of a better state estimate. Second, the choice of $t_{go}$ is really a trade with the actuator limits, not a case of "more is always better". Terminal guidance must be given enough time that its command stays inside the limit — the $8\,\mathrm{s}$ case above shows what too little time costs — but beyond that, the handoff should come when the sensing is ready, with the remaining time set so the worst expected command still fits what the hardware can deliver. "Earlier is always better" ignores both the sensing precondition and that actuator trade.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Midcourse guidance | Coarse accuracy with the sensing available; reach the right neighborhood, not zero error |
| Terminal guidance | Fine sensing, steep $1/t_{go}$ and $1/t_{go}^2$ gains, drives the real objective to zero |
| Handoff | When fine sensing is available and enough time remains for the terminal gains to finish |
| Actuator saturation | The command can exceed what the hardware delivers, most often late, where gains are steepest |
| Clipped vs constrained-optimal | Clipping reacts instant by instant; the Pontryagin-optimal bang-bang plan uses the limit over the whole remaining flight |
| Consequence | Leftover miss and contact speed that grow much faster than the limit shrinks, sometimes with a different shape (overshoot versus falling short) |

This module built the small set of laws that nearly all of guidance is assembled from: the guidance, navigation and control split and its loop rates; open-loop, closed-loop and explicit guidance; proportional navigation in its true, pure and augmented forms; the linear-quadratic problem that contains it; ZEM/ZEV guidance for a soft landing; the adjoint method for pricing disturbances; time-to-go and why every law is fragile to it; and the gravity turn. The next module, on ascent and orbital insertion guidance, builds Powered Explicit Guidance on top of this foundation — the closed-loop law that takes over once the gravity turn has carried the rocket above the thick air.

::: context seeker What a seeker is
A seeker is the sensor in the nose of a guided vehicle that looks at the target directly — a radar, an infrared camera, or a laser receiver. It measures the direction to the target, and from how that direction changes, the line-of-sight rate that proportional navigation needs. "Lock-on" is the moment the seeker has found the target and is tracking it steadily. Before lock-on the vehicle flies on its own navigation and outside updates; after it, precise terminal guidance becomes possible. Spacecraft have their own version: the lidar and cameras that only become useful in the last few hundred meters of an approach.
:::

::: context handoff-relay Like passing a baton
Midcourse and terminal guidance work like two runners in a relay. The first runner does not need to cross the finish line — only to deliver the baton to the right spot, at a good speed. This is the example's handoff: the offset $y$ drifts out a little at first, is squeezed down to $0.81\,\mathrm{m}$ by midcourse over $200\,\mathrm{s}$, and terminal guidance (the short orange stretch) takes it to zero in $15\,\mathrm{s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="336" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="24" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="186">0</text><text x="115.1" y="186">50</text><text x="180.2" y="186">100</text><text x="245.3" y="186">150</text><text x="310.5" y="186">200</text>
    <text x="190" y="204">time (s)</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="174">0</text><text x="44" y="104">4</text><text x="44" y="34">8</text>
  </g>
  <text x="54" y="20" font-size="11" fill="#1f2a44">offset y (m)</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,30.0 56.5,29.1 63.0,29.6 69.5,31.3 76.0,33.9 82.6,37.3 89.1,41.3 95.6,45.7 102.1,50.5 108.6,55.4 115.1,60.6 121.6,65.7 128.1,70.9 134.7,76.0 141.2,81.1 147.7,86.0 154.2,90.9 160.7,95.5 167.2,100.0 173.7,104.3 180.2,108.4 186.7,112.4 193.3,116.1 199.8,119.6 206.3,123.0 212.8,126.2 219.3,129.2 225.8,132.0 232.3,134.7 238.8,137.2 245.3,139.5 251.9,141.7 258.4,143.7 264.9,145.7 271.4,147.5 277.9,149.1 284.4,150.7 290.9,152.1 297.4,153.5 304.0,154.7 310.5,155.9"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="3.5" points="310.5,155.9 314.4,157.8 318.3,161.4 322.2,165.4 326.1,168.6 330.0,170.0"/>
  <line x1="310.5" y1="40" x2="310.5" y2="170" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="306" y="50" font-size="11" fill="#6c7a93" text-anchor="end">handoff</text>
  <text x="140" y="60" font-size="12" fill="#1d6fd1">midcourse</text>
  <text x="300" y="140" font-size="12" fill="#1f2a44" text-anchor="end">0.81 m left</text>
</svg>
```
:::

::: context critical-damping The shock absorber setting
"Critically damped" is the setting that returns to zero as fast as possible without overshooting — like a good car shock absorber after a bump. Less damping and the offset would swing back and forth across the line; more and it would creep back slowly. For the law $\ddot y = -k_1 y - k_2\dot y$, critical damping means $k_1 = \omega_n^2$ and $k_2 = 2\omega_n$. With $\omega_n = 0.02\,\mathrm{rad/s}$ that gives $k_1 = 0.0004$ and $k_2 = 0.04$, the example's gains.
:::

::: context saturation-clip What clipping does to a command
A saturating actuator passes small commands through unchanged and flattens big ones at its limit, like a speaker turned past its maximum volume. Here the limit is $0.03\,\mathrm{m/s^2}$: any command beyond it, either way, comes out as exactly $\pm 0.03$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="330" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="185" y1="20" x2="185" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="75" y1="155" x2="295" y2="45" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="45,145 95,145 275,55 325,55"/>
  <g font-size="11" fill="#1f2a44">
    <text x="330" y="116" text-anchor="end">command asked</text>
    <text x="192" y="28">delivered</text>
    <text x="275" y="48" text-anchor="middle">+0.03</text>
    <text x="95" y="162" text-anchor="middle">−0.03</text>
  </g>
  <text x="300" y="80" font-size="11" fill="#6c7a93">unlimited</text>
</svg>
```

The dashed line is what the law wanted; the blue line is what the vehicle gets.
:::

::: context bang-bang Full on, full off
A bang-bang control uses only the extremes: full push one way, or full push the other. The fastest way to slide a box across the floor and stop it exactly on a mark is like this: shove as hard as you can for the first half, then pull back as hard as you can for the second half.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="85" x2="330" y2="85" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="3" points="40,35 185,35 185,135 320,135"/>
  <g font-size="11" fill="#1f2a44">
    <text x="34" y="39" text-anchor="end">+max</text>
    <text x="34" y="139" text-anchor="end">−max</text>
    <text x="320" y="100" text-anchor="end">time</text>
    <text x="190" y="60">switch</text>
  </g>
</svg>
```

The name comes from the sound old relay switches make slamming between their two positions. A home thermostat that turns the furnace fully on or fully off is a bang-bang controller too.
:::

::: context docking-speed How gently spacecraft dock
Docking mechanisms are designed to catch a spacecraft arriving slowly and nearly straight. The capture latches and shock-absorbing springs can only soak up so much energy, and energy grows with the square of speed. Arriving at $0.173\,\mathrm{m/s}$ instead of $0.0183\,\mathrm{m/s}$ means about $(0.173/0.0183)^2 \approx 89$ times the energy to absorb. A sideways miss matters as well: arriving $6\,\mathrm{cm}$ off center can mean the latches do not line up at all.
:::

::: context command-margin Watching the margin
Engineers track a simple ratio in simulation and in flight: commanded acceleration divided by available acceleration. At $0.5$ the actuator has plenty in reserve. Near $1$ it is running out. Pinned at $1$ it is saturated, and the guidance law is no longer really in charge. A plot of this ratio over a flight shows at a glance where the design is tight — usually the last few seconds — long before a miss or a hard contact shows up in the results.
:::
