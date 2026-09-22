---
id: l01-guidance-navigation-control-decomposition
title: The guidance, navigation and control decomposition
minutes: 20
covers:
  - The guidance / navigation / control decomposition and the loop rate of each
---

Every autonomous vehicle answers three questions, over and over, for as long as it flies: where am I and how am I moving, where should I go, and how do I make the actuators produce that motion. A chaser spacecraft closing on the ISS answers all three every fraction of a second on final approach. A lander descending toward the Martian surface answers them through a burn that lasts a minute and a half. A launch vehicle climbing out of the atmosphere answers them from liftoff to orbital insertion. Splitting the problem into these three questions — navigation, guidance, control — is not a historical accident of how aerospace organizations draw org charts. It is the decomposition that lets three genuinely different kinds of mathematics, running at three genuinely different rates, be designed, verified and trusted separately, and it is the frame this entire module sits inside.

This lesson gives the split precisely, and then does something the org chart never tells you: it derives *why* the three loops run at such different speeds, from the physics each one has to keep up with. That derivation matters more than it looks. Guidance failures that show up as "the commanded acceleration is right but arrives too late" or "the state was fine an update ago" are loop-rate problems wearing a guidance-law costume, and the rest of this module — proportional navigation, zero-effort-miss guidance, the gravity turn — is guidance law, not loop rate. Getting the rates right is what makes any of it fly.

## What each of the three does

**Navigation** answers *where am I and how am I moving*. Its input is raw sensor data — accelerometer and gyro samples, star tracker quaternions, radar range and range-rate, GNSS pseudoranges — and its output is a state estimate: position, velocity, attitude, and usually their uncertainty. Navigation is an estimation problem, and the navigation tier of this curriculum built the machinery for it in full: the least-squares module's static estimators, the Kalman filter module's recursive form, the nonlinear-filters module's EKF and UKF for a state that does not evolve linearly, the inertial navigation module's strapdown mechanization of an IMU, the GNSS module's satellite-ranging solution, and the sensors and optical navigation module's treatment of what a star tracker, radar altimeter or camera actually measures. None of that is repeated here. What guidance needs from navigation is simply its output: a state estimate, arriving often enough and accurately enough to steer by.

**Guidance** answers *where should I go, and what acceleration gets me there*. Its input is the navigation state estimate together with the mission's terminal objective — intercept a target, touch down at zero velocity, reach a target orbit — and its output is a commanded acceleration (or, equivalently, a commanded attitude and thrust magnitude). Guidance is the subject of this module: proportional navigation, zero-effort-miss and zero-effort-velocity guidance, and the gravity turn are all answers to the same question, "what acceleration do I command right now," for three different terminal objectives.

**Control** answers *how do I make the actuators produce that acceleration*. Its input is the commanded acceleration from guidance together with the vehicle's own state, and its output is the actual actuator commands — thruster on-times, gimbal angles, throttle setting, reaction wheel torques — that make the real vehicle track the command in the presence of disturbances, plant uncertainty and actuator limits. Control is the subject the control tier built in full: the classical control module's loop shaping, the state-space module's pole placement and observers, the optimal control module's LQR, the robust and nonlinear control modules' treatment of what happens when the linear, certain model is wrong, and the MPC module's explicit handling of constraints. Guidance produces a *reference* for control to track; it does not touch an actuator directly.

The three are strictly layered — navigation feeds both guidance and control, guidance feeds control, control never talks back up the chain except through the vehicle's own dynamics — and that layering is precisely what lets each be designed against a clean interface instead of the whole coupled problem at once. It is also why the three run at such different rates, which is the rest of this lesson.

## Why the loop rates differ

Each loop has to keep up with a different piece of physics, and the piece sets the rate.

Control has to keep up with the vehicle's own dynamics and its actuators: how fast a thruster valve opens, how fast a gimbal slews, how fast a flexible structural mode rings. A sampled control loop that runs only a little faster than the fastest pole it needs to command or reject barely controls it at all — the classical control module's frequency-response view and the digital control module's treatment of sampling and aliasing both make the same point, that a discrete loop needs to sample well above the bandwidth it is trying to shape, and a working rule of thumb across real flight software is a factor of ten to twenty above the fastest actuator or structural bandwidth in the loop. Actuator bandwidths for thrusters, gimbals and reaction wheels typically run from a few hertz to a few tens of hertz, which is why control loops end up in the tens to low hundreds of hertz.

Navigation has to keep up with whichever of guidance or control consumes its output fastest — which is almost always control, since control is the faster of the two — and, separately, its own raw propagation has to keep up with the vehicle's rotation and acceleration well enough that integrating accelerometer and gyro samples into position, velocity and attitude does not itself accumulate large error between fixes. Both pressures push navigation toward the fast end of any reasonable budget, and a strapdown IMU is typically sampled and integrated at a rate at or above the control loop it feeds, even though slower aiding measurements (a star tracker fix, a GNSS solution, a radar return) that correct that propagation can arrive far less often.

Guidance has to keep up with something slower still: how fast the *optimal command direction* changes. That direction depends on the remaining geometry — how much range, closing velocity or altitude is left, and how much time remains to use it — and geometry evolves on the timescale of the engagement or the descent, not on the timescale of a thruster valve. A guidance law recomputed only occasionally is still commanding close to the right acceleration between recomputations, provided the interval is short compared with how fast the remaining geometry is turning over. That interval shrinks as the remaining time itself shrinks, which is why guidance updates for a fast final approach or the last seconds of a landing burn sit at the high end of the guidance band while a slow midcourse phase sits at the low end — a point the lesson on time-to-go estimation returns to directly, because time-to-go is exactly the quantity that measures "how fast is the remaining geometry turning over."

::: key The G, N and C split
Navigation: where am I and how am I moving — a state estimate from sensor data. Guidance: where should I go and what acceleration gets me there — a commanded acceleration from the state estimate and the mission objective. Control: produce that acceleration with the actuators, rejecting disturbances and plant error. Typical rates: navigation 100–1000 Hz, control 50–500 Hz, guidance 0.5–10 Hz.
:::

::: example Sizing the guidance rate across a rendezvous
A chaser is closing on a target for docking. Take a simple rule for how tight the loop needs to be: don't let the vehicle drift more than 2% of the remaining range between guidance updates. Three phases of the same approach:

| Phase | Closing velocity $V_c$ | Range $R$ | Tolerance ($2\%R$) | Max update period | Min rate |
| --- | --- | --- | --- | --- | --- |
| R-bar approach initiation | $1.00\,\mathrm{m/s}$ | $1000\,\mathrm{m}$ | $20.0\,\mathrm{m}$ | $20.0\,\mathrm{s}$ | $0.050\,\mathrm{Hz}$ |
| Close-range approach | $0.10\,\mathrm{m/s}$ | $30\,\mathrm{m}$ | $0.60\,\mathrm{m}$ | $6.0\,\mathrm{s}$ | $0.167\,\mathrm{Hz}$ |
| Final approach to contact | $0.03\,\mathrm{m/s}$ | $1\,\mathrm{m}$ | $0.020\,\mathrm{m}$ | $0.667\,\mathrm{s}$ | $1.5\,\mathrm{Hz}$ |

Each row is the same computation, $\text{rate}_{\min} = V_c / (0.02\,R)$:

```python
phases = [
    ("R-bar approach initiation", 1.00, 1000.0),
    ("Close-range approach", 0.10, 30.0),
    ("Final approach to contact", 0.03, 1.0),
]
for name, Vc, R in phases:
    tol = 0.02 * R
    print(name, "rate_min =", round(Vc / tol, 3), "Hz")
# R-bar approach initiation rate_min = 0.05 Hz
# Close-range approach rate_min = 0.167 Hz
# Final approach to contact rate_min = 1.5 Hz
```

Every number lands inside the $0.5$–$10\,\mathrm{Hz}$ guidance band, and the trend is the point: as range collapses and the corridor tightens in absolute terms even while staying a fixed fraction of range, the required rate climbs by a factor of thirty from first approach to final approach. A guidance cycle that was comfortable a few minutes earlier is not automatically comfortable at contact.
:::

::: example A Mars powered-descent timing budget
A lander's powered-descent burn lasts $t_{\text{burn}} = 75\,\mathrm{s}$. Guidance runs at $f_g = 5\,\mathrm{Hz}$ ($\Delta t = 0.2\,\mathrm{s}$), giving

$$
n = \frac{t_{\text{burn}}}{\Delta t} = \frac{75}{0.2} = 375
$$

guidance cycles across the whole burn — plenty to track a burn whose geometry changes on a timescale of seconds, not tenths of a second. Now look at only the final $t_{go} = 5\,\mathrm{s}$ before touchdown, where the zero-effort-miss law of a later lesson is turning over its gains fastest. Requiring at least $15$ updates in that closing window needs

$$
f_{g,\text{terminal}} \ge \frac{15}{5\,\mathrm{s}} = 3\,\mathrm{Hz},
$$

comfortably inside the $5\,\mathrm{Hz}$ already budgeted — the same guidance rate that was generous across the whole burn is still adequate, if not generous, in the terminal window, which is exactly why real descent guidance does not need to switch rates near the ground the way the corridor tightened in the rendezvous example above.

Now size control from the other end. A throttle or TVC actuator with a closed-loop bandwidth of $f_a = 5\,\mathrm{Hz}$, using the ten-to-twenty-times rule of thumb, needs a control loop somewhere in

$$
[10f_a,\ 20f_a] = [50, 100]\,\mathrm{Hz},
$$

squarely inside the $50$–$500\,\mathrm{Hz}$ control band. Three numbers, three different pieces of physics — burn duration, terminal closing window, actuator bandwidth — and all three land inside the bands the key block states, because those bands were never arbitrary; they are what this kind of arithmetic produces for real vehicles.
:::

::: warning Faster is not free, and it is not always better
Running control faster than the actuator can respond buys nothing — a valve that takes $50\,\mathrm{ms}$ to open does not open any faster because the loop commanding it samples at $10\,\mathrm{kHz}$ instead of $1\,\mathrm{kHz}$; it only spends flight-computer cycles that guidance or navigation could have used, and it can amplify sensor noise that a slower, better-filtered loop would have averaged down. And guidance is not simply "control, but slower" — running guidance at a control-loop rate does not make it more accurate, because the quantity guidance is tracking (the remaining geometry) has not changed between one update and the next; all the extra recomputation does is re-derive the same command from a state estimate that itself has not moved enough to matter. Budget each loop to the physics it is actually keeping up with.
:::

::: note The layering is architectural, not just pedagogical
Guidance's commanded acceleration is control's reference input; control's disturbance rejection needs its own fast state estimate, so navigation typically feeds both loops independently rather than guidance relaying a stale copy downward. On real flight software this shows up literally as three tasks at three rates on the same computer, with guidance's output written to a location control reads at the start of its own, faster cycle — so control always acts on the most recent guidance command available, never blocking on guidance to finish. Understanding the rate split is understanding that architecture, not just a diagram of it.
:::

## Check yourself

::: check
State the guidance/navigation/control split in one sentence each, and give the typical rate band for each.
:::

::: answer
Navigation: where am I and how am I moving, from sensor data — typically $100$–$1000\,\mathrm{Hz}$. Guidance: where should I go and what acceleration gets me there, from the state estimate and the mission objective — typically $0.5$–$10\,\mathrm{Hz}$. Control: produce that acceleration with the actuators against disturbances and plant error — typically $50$–$500\,\mathrm{Hz}$.
:::

::: check
Why does control need to run so much faster than guidance, when guidance is the loop actually deciding where the vehicle should go?
:::

::: answer
Because the two loops are keeping up with different things. Control has to resolve and reject dynamics set by the actuators and the vehicle's own structure — a thruster's response time, a gimbal's slew rate, a flexible mode's period — which live at a few hertz to a few tens of hertz, and a sampled loop needs to run roughly ten to twenty times faster than the fastest of those to control it meaningfully. Guidance only has to keep up with how fast the remaining geometry (range, closing velocity, time-to-go) is changing, which is far slower than an actuator's response for all but the last moments of an engagement. "Decides where to go" does not imply "must react fastest" — reacting fastest is control's job because the actuators are the fastest-moving parts in the loop.
:::

::: check
A chaser's final approach closes at $V_c = 0.08\,\mathrm{m/s}$ and must not drift more than $4\,\mathrm{cm}$ between guidance updates. What is the minimum guidance rate, and does it fit inside the guidance band this lesson gave?
:::

::: answer
The maximum update period is $\Delta t_{\max} = \text{tolerance}/V_c = 0.04\,\mathrm{m} / 0.08\,\mathrm{m/s} = 0.5\,\mathrm{s}$, so the minimum rate is $1/\Delta t_{\max} = 2\,\mathrm{Hz}$. That sits comfortably inside the $0.5$–$10\,\mathrm{Hz}$ guidance band — a fast final approach, but not an unusually demanding one.
:::

::: check
Why does raw IMU propagation inside navigation typically run at or above the control loop's rate, rather than at the slower guidance rate that ultimately uses the resulting state?
:::

::: answer
Because navigation has two customers with different needs, and it has to satisfy the faster one: control consumes the state estimate at the control rate, so navigation must supply a fresh one at least that often. Separately, the propagation itself — integrating accelerometer specific force and gyro rate into velocity, position and attitude — accumulates error over each integration step, so a short step is needed just to keep that accumulated error small between the slower aiding fixes (a star tracker or GNSS update) that periodically correct it; the inertial navigation module derives this in detail. Guidance's slower appetite for a state estimate never gets to set navigation's rate, because navigation cannot run two different internal rates for two different customers — it runs at the fastest rate anything downstream needs.
:::

::: check
An engine gimbal actuator has a closed-loop bandwidth of $8\,\mathrm{Hz}$. Using the ten-to-twenty-times rule of thumb, what control rate would you budget, and is it inside the $50$–$500\,\mathrm{Hz}$ band this lesson gave?
:::

::: answer
The budget is $[10, 20] \times 8\,\mathrm{Hz} = [80, 160]\,\mathrm{Hz}$, which sits well inside the $50$–$500\,\mathrm{Hz}$ control band — this is a fairly ordinary actuator, not an unusually stiff or unusually sluggish one, and the rule of thumb places it comfortably in the middle of the range real flight software uses.
:::

## Summary

| Quantity | Statement |
| --- | --- |
| Navigation | Where am I and how am I moving — a state estimate from sensor data |
| Guidance | Where should I go and what acceleration gets me there — a commanded acceleration |
| Control | Produce that acceleration with the actuators, rejecting disturbance and plant error |
| Navigation rate | $100$–$1000\,\mathrm{Hz}$, set by the faster of its two customers and by IMU propagation accuracy |
| Control rate | $50$–$500\,\mathrm{Hz}$, set by a $10$–$20\times$ margin over actuator/structural bandwidth |
| Guidance rate | $0.5$–$10\,\mathrm{Hz}$, set by how fast the remaining geometry (range, $V_c$, $t_{go}$) turns over |
| Guidance rate sizing | $\text{rate}_{\min} \approx V_c / \text{tolerance}$ for a drift-budget argument |

The three loops, and the reasons their rates differ, are the frame the rest of this module works inside. The next lesson asks a different question about guidance specifically — not how often it runs, but whether it recomputes its command from the current state each cycle or simply tracks a trajectory it planned in advance.
