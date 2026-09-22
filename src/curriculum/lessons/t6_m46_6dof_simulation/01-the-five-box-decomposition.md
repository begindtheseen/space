---
id: l01-five-box-decomposition
title: The five-box decomposition
minutes: 20
covers:
  - The five-box decomposition: plant, sensors, GNC, actuators, environment — and why the interfaces between them are the whole design
---

Every module before this one produced one piece of what you are about to assemble. The Rigid Body Dynamics module gave you the equations of motion; the Reference Frames & Rotating Coordinate Systems module and the Attitude Kinematics & Rotational Dynamics module gave you the frames and the quaternion that carry a vehicle's attitude through those equations; the Numerical Methods module gave you the integrators and the vocabulary of truncation error and step-size control; the Atmospheric Flight module gave you the aerodynamic forces a vehicle feels moving through air; and the control and navigation tiers built the actual flight software — the estimator, the controller, the guidance law — that a real vehicle will fly. A six-degree-of-freedom simulation is the one place all of that runs at once, on the same clock, closed into a loop, without you there to intervene.

It is also the artifact this whole curriculum is judged against. Every controller from the control tier, every filter from the navigation tier, and every guidance law you meet later gets exercised here before anyone believes it belongs on a vehicle. That puts a demand on the simulation itself that is easy to state and hard to satisfy: it has to be trustworthy in a way that goes beyond running without crashing or producing a plot that looks like a trajectory. The rest of this module is about earning that trust — validating the physics, modelling the sensors and actuators honestly, handling the discontinuities, making the results reproducible. This lesson is about the shape of the program that holds all of it: five boxes, and the discipline of never letting them talk to each other except through the interface each one is supposed to have.

## The five boxes

A closed-loop vehicle simulation decomposes into five pieces, and the decomposition is not a stylistic preference — it is what makes the simulation an honest test of the flight software rather than a demonstration that the flight software agrees with itself.

| Box | Reads | Writes | What it is |
| --- | --- | --- | --- |
| Plant | total force and torque; current mass properties | position, velocity, attitude quaternion, body rates, mass, inertia tensor — all **true** | the rigid-body equations of motion, integrated forward in time |
| Environment | plant truth (position, time, attitude) | gravity vector, atmospheric density and wind, magnetic field, solar flux — all **true** | physics the vehicle does not control, evaluated at the plant's true state |
| Sensors | plant and environment truth | noisy, biased, quantised, delayed measurements | the boundary between truth and what the flight software is allowed to know |
| GNC | sensor outputs only | actuator commands | the actual flight code: navigation filter, controller, guidance law, unmodified |
| Actuators | GNC commands | the actual force and torque delivered to the plant | gimbal dynamics, rate and deflection limits, thrust transients — the boundary between command and reality |

Plant and Environment together are **truth** — the physics that would happen whether or not anyone were watching it or flying a computer through it. Sensors and Actuators are the two boundaries where truth and the flight computer's world meet, and each boundary is lossy on purpose: a sensor throws away precision and adds delay, an actuator cannot instantaneously produce whatever torque was asked of it. GNC is the box under test. It is not simulation code you wrote to represent the flight software — wherever practically possible it is the flight software, the same binary or the same source that will fly, which is the subject of a later lesson in this module on the flight-software-in-the-loop boundary.

One tick of the loop visits the boxes in a fixed order. Environment is queried at the plant's current true state to get the forces the plant will feel this step. Sensors sample plant and environment truth on their own schedule to produce measurements. GNC, on its own schedule, reads the latest measurements and computes a command. Actuators turn that command into the force and torque their own dynamics allow. Plant integrates one step forward under the actual applied force and torque. Then the cycle repeats. Every arrow in that cycle is a real interface, and every one of the next several lessons is about a different piece of it: how the loop's several clocks relate, what each environment and sensor and actuator model contains, how mass properties and flexible structure enter the plant, how the loop handles a discontinuity like staging, and how you know any of it is right.

## Why the interfaces are the whole design

The reason to keep the boxes strictly separate is not code hygiene. It is that the two boundary boxes exist specifically to withhold information and capability that GNC does not have in real flight, and any shortcut that routes around a boundary deletes the very thing the simulation was built to test.

Two rules follow directly from the five-box picture, and violating either one is the most common way a simulation quietly stops meaning anything.

**GNC never reads plant or environment truth.** Whatever GNC knows about the vehicle's state, it knows because a sensor produced a measurement with that sensor's noise, bias, quantisation and latency in it. If a controller or a navigation filter ever reads a plant state variable directly — even once, even behind a flag meant to be temporary — every result computed afterward, every stability margin and every dispersion statistic, describes a vehicle that cannot exist, because no sensor is perfect.

**Plant never receives a command.** Whatever force and torque the plant integrates, it is because an actuator produced that force and torque under its own dynamics — a gimbal that takes time to slew, a wheel with a maximum torque, a thruster with a minimum impulse bit. If the plant integrates GNC's commanded torque directly, the simulation has quietly given the vehicle an actuator with infinite bandwidth and infinite authority, and every timing margin and every saturation event that would have shown up in flight is invisible.

Because Environment, Sensors and Actuators are separate, swappable boxes, each is also independently the point where you inject the things a real campaign needs to vary: a denser atmosphere, a bigger gyro bias, a slower gimbal, a dropped GNSS fix. That is what makes a ten-thousand-case dispersion campaign, which is the subject of the module that follows this one, a matter of drawing different parameters for each box rather than rewriting the simulation for each case.

::: example One tick through the five boxes
A small bus with inertia tensor $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ — the same vehicle used throughout the Rigid Body Dynamics module — is coasting with a small residual body rate after a manoeuvre, $\boldsymbol{\omega}_{\text{true}} = (0.00200, -0.000400, 0.000600)\,\mathrm{rad/s}$, and a reaction-wheel controller is trying to null it. Follow one controller tick through all five boxes.

**Sensors.** The rate gyro has a 0.5% scale factor error on every axis, a small bias, and a quantisation step of $1\times10^{-5}\,\mathrm{rad/s}$. On each axis, $\omega_{\text{meas},i} = (1+sf_i)\,\omega_{\text{true},i} + b_i$, rounded to the nearest quantisation step:

$$
\boldsymbol{\omega}_{\text{meas}} = (0.00204,\ -0.000420,\ 0.000610)\,\mathrm{rad/s} .
$$

**GNC.** A simple rate damper commands a wheel torque proportional to the measured rate, $\mathbf{u}_{\text{cmd}} = -K_d\,\boldsymbol{\omega}_{\text{meas}}$ with $K_d = 400\,\mathrm{N\,m\,s/rad}$:

$$
\mathbf{u}_{\text{cmd}} = (-0.816,\ 0.168,\ -0.244)\,\mathrm{N\,m} .
$$

**Actuators.** The wheel can deliver at most $0.20\,\mathrm{N\,m}$ per axis. The $x$ and $z$ commands exceed that; the $y$ command does not:

$$
\mathbf{u}_{\text{act}} = (-0.200,\ 0.168,\ -0.200)\,\mathrm{N\,m} .
$$

**Plant.** Integrating Euler's equation one fine step of $0.01\,\mathrm{s}$ under $\mathbf{u}_{\text{act}}$ gives $\boldsymbol{\omega}$ at the next fine step, $(0.00199833,\ -0.00039887,\ 0.00059900)\,\mathrm{rad/s}$ — compare this against integrating under the unclipped command instead, $(0.00199320,\ -0.00039887,\ 0.00059878)\,\mathrm{rad/s}$: a difference of $5.13\times10^{-6}\,\mathrm{rad/s}$ on the $x$ axis in a single step, from saturation alone.

Notice that the $y$-axis command was never clipped — $0.168\,\mathrm{N\,m}$ in both cases — and yet the two runs' $y$ rates differ, by nine parts in $10^{12}$. Euler's equations couple the axes through products of the rates themselves, so what happens on $x$ and $z$ during the integrator's internal stages leaks a little into $y$ even when $y$'s own torque is untouched. No axis of a rotating rigid body is ever perfectly independent of the others, which is worth remembering before you assume a bug is confined to the axis where you see it.
:::

That single step moved the rate by a few parts per thousand. The next example shows what the saturation the actuator box modelled actually costs over time — and what the simulation would have told you if that box had been skipped.

::: example What the actuator box was hiding
Same bus, same controller, a larger initial tumble of $\boldsymbol{\omega}_0 = (0.0200,\ -0.00400,\ 0.00600)\,\mathrm{rad/s}$ — plausible right after a separation event. The very first command the controller computes is $\mathbf{u}_{\text{cmd}} \approx (-8.05,\ 1.62,\ -2.42)\,\mathrm{N\,m}$: on the $x$ axis alone, about 40 times more torque than the $0.20\,\mathrm{N\,m}$ wheel can produce.

Run the closed loop for 3 s two ways, with everything else identical — same sensor model, same controller gains, same 20 Hz tick, same plant — and only the actuator box's presence or absence different.

**With the actuator box (what the real hardware does):** the wheel saturates at $\pm0.20\,\mathrm{N\,m}$ and stays there. After 3 s, $\omega_x = 0.019527\,\mathrm{rad/s}$ — a reduction of only 2.36% from where it started. The command stays pinned at the torque limit until $t \approx 117.7\,\mathrm{s}$, essentially two minutes of continuous full-authority firing, and only reaches 10% of the initial rate at $t \approx 108.6\,\mathrm{s}$.

**Without it (GNC's command wired straight into the plant):** after 3 s, $\omega_x = 0.0072486\,\mathrm{rad/s}$ — a reduction of 63.8%, and nearly three times smaller than the correctly modelled result.

Both runs use the identical controller and the identical sensor readings; the only difference is whether a box stood between the commanded torque and the plant. The "no actuator box" run makes a $400\,\mathrm{N\,m\,s/rad}$ gain against a $0.20\,\mathrm{N\,m}$ wheel look like it nulls a tumble in a couple of seconds. The properly modelled vehicle needs closer to two minutes, because that is what a real wheel sized this way actually delivers. An engineer who sized the wheel, or set a time-to-null requirement, from the collapsed simulation would have been wrong by more than an order of magnitude — and the trajectory in both cases looks perfectly smooth. Nothing about the plot says which one is real.
:::

::: key The five boxes
Plant, environment, sensors, GNC, actuators. Keep them separable with explicit interfaces so each can be swapped, dispersed or replaced by hardware independently. GNC only ever sees what a sensor produced; the plant only ever feels what an actuator produced. Every shortcut across either boundary deletes something the simulation exists to test.
:::

::: warning Peeking at truth "just for now"
Wiring a controller or a navigation filter straight to plant truth during a debugging session is tempting — it isolates whether the algorithm itself is correct, without sensor noise in the way. The danger is not doing it once; it is forgetting to remove it. A controller tuned or accepted against truth has never been tested against the sensors it will actually fly with, and a gain margin computed that way describes a vehicle that does not exist. If you need to isolate the algorithm, do it with a unit test that calls the algorithm directly, not by rewiring the simulation.
:::

::: warning Collapsing the actuator into GNC's own clipping
It looks equivalent to have GNC clip its own command to the actuator's known limit, and skip a separate Actuator box entirely — the plant still never sees an unrealistic torque. It is not equivalent. Flight software's internal model of its own actuator is a simplification, often a deliberately conservative one, and it is frequently wrong in ways nobody has found yet: a wheel with more friction than its datasheet, a gimbal whose rate limit depends on hydraulic temperature, a valve with a delay flight software's model does not include. The Actuator box's job is to be an independent model of the hardware — one the flight software does not get to see or agree with — precisely so the simulation can catch the case where flight software's assumption about its own actuator is the thing that is wrong.
:::

## Check yourself

::: check
Name the five boxes and, for each, say in one phrase what truth or information goes in and what comes out.
:::

::: answer
Plant: total force and torque in, true state out. Environment: plant truth in, true environmental fields out. Sensors: plant and environment truth in, corrupted measurements out. GNC: measurements in, commands out. Actuators: commands in, actually-delivered force and torque out.
:::

::: check
Why must Sensors sit strictly between Plant and GNC — what specifically goes wrong if, during a debugging session, GNC is temporarily wired to read a plant state variable directly, and that wiring is never removed?
:::

::: answer
Every measurement GNC would see in flight carries that sensor's noise, bias, scale factor, quantisation and latency. If GNC reads plant truth instead, the controller or filter is validated against information no real sensor could ever hand it — a rate with no gyro noise, a position with no navigation error. Any stability margin, any filter tuning, or any Monte Carlo statistic produced afterward describes a fictitious vehicle with perfect knowledge of its own state, which is not the vehicle that will fly.
:::

::: check
In the reaction-wheel example, the run without an actuator box reached $\omega_x = 0.0072\,\mathrm{rad/s}$ after 3 s, while the correctly modelled run was still at $0.0195\,\mathrm{rad/s}$. Which one describes the real hardware, and what does the size of that gap tell an engineer sizing the wheel?
:::

::: answer
The run with the actuator box — the one that respects the wheel's $0.20\,\mathrm{N\,m}$ torque limit — describes the real hardware; the other silently assumed unlimited torque authority. The gap (a factor of roughly 2.7 in remaining rate after 3 s, and about two minutes versus about three seconds to make real progress) tells the engineer that this wheel is undersized for a tumble of this magnitude by more than an order of magnitude in time, information the collapsed simulation could never have produced because it never modelled the limit at all.
:::

::: check
A teammate argues that clipping GNC's own command to the actuator's documented torque limit, inside the GNC code, is equivalent to a separate Actuator box, so the extra module is unnecessary. Give a case where the two are not equivalent.
:::

::: answer
They agree only when the flight software's internal model of the actuator is exactly correct. They diverge whenever it is not — for example, if the real wheel's torque authority degrades with age or temperature to $0.15\,\mathrm{N\,m}$ while flight software still clips to the datasheet value of $0.20\,\mathrm{N\,m}$, or if the actuator has dynamics flight software does not model at all, such as a first-order lag or backlash. A separate Actuator box with its own, independently maintained model is what lets the simulation catch flight software's actuator assumption being wrong; a clip inside GNC can only ever agree with itself.
:::

::: check
Why is Environment its own box rather than a piece of code inside Plant that computes gravity and calls it done?
:::

::: answer
Environment collects everything physical that is not the vehicle itself — gravity, atmosphere, wind, magnetic field, solar radiation pressure — and none of it is under the vehicle's control. Keeping it separate from Plant means every one of those fields can be swapped or dispersed independently: a denser atmosphere model, a different wind profile, a solar-minimum versus solar-maximum magnetic field, without touching the rigid-body equations of motion at all. That independence is exactly what a dispersion campaign needs, and it is also what lets the same Plant code fly a spacecraft in orbit and a vehicle in the atmosphere, with only the Environment box swapped.
:::

::: check
In the one-tick example, the $y$-axis actuator command was never clipped — the wheel delivered exactly the $0.168\,\mathrm{N\,m}$ that GNC asked for — yet the plant's $y$-axis rate still came out very slightly different between the saturated and unsaturated runs. Why, given that the $y$ torque was identical in both cases?
:::

::: answer
Euler's rotational equations are coupled: the derivative of each axis's rate depends on the *product* of the other two axes' rates, not only on that axis's own torque. Because $x$ and $z$ received different torques in the two runs, their rates evolved slightly differently across the integrator's internal stages, and that difference fed into $y$'s derivative through the $\omega_x\omega_z$-type coupling term even though $M_y$ itself never changed. The effect is tiny here because the rates and the step are both small, but it is a direct consequence of the gyroscopic coupling the Rigid Body Dynamics module derived, not a bug.
:::

## Summary

| Box | Turns | Into |
| --- | --- | --- |
| Plant | applied force and torque | true state (position, velocity, quaternion, rates, mass, inertia) |
| Environment | plant truth | true gravity, atmosphere, wind, field, radiation pressure |
| Sensors | plant and environment truth | noisy, biased, quantised, delayed measurements |
| GNC | measurements | commands — the actual flight code, unmodified |
| Actuators | commands | the force and torque the plant actually feels |
| Two rules | GNC never reads truth; plant never receives a command directly | each boundary box must do its own, independent job |

A controller that looks like it solves a problem in two seconds can take two minutes in reality, and the only way to know which is true is to model the boundary honestly rather than skip it. The next lesson takes the clock inside these boxes apart: the plant needs a fine, accurate integration step, while GNC must run at the one rate its design assumes, and getting that relationship wrong is as damaging as skipping a box outright.
