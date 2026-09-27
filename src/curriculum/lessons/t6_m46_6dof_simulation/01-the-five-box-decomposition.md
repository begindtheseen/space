---
id: l01-five-box-decomposition
title: The five-box decomposition
minutes: 21
covers:
  - The five-box decomposition: plant, sensors, GNC, actuators, environment — and why the interfaces between them are the whole design
---

Think about a driving simulator at a driving school. The student sits in a seat with a steering wheel and pedals. In front of her is a screen. Behind the screen, a computer works out where the pretend car really is, how fast it is going, and whether it has hit the curb.

The student never sees those numbers. She sees only the screen, which is a little blurry and a split second late. When she turns the wheel, the car does not jump sideways. It turns as fast as its steering and tires allow. The test only means something if both of those stay true. If the student could peek at the computer's exact numbers, or if the car obeyed her hands instantly, she could pass the simulator and still crash the real car.

A **[[six-degree-of-freedom|six-dof]] simulation** — a **6-DOF**, a computer program that moves a vehicle in all three directions and turns it about all three axes — is that driving simulator, built for a rocket or a spacecraft. The "student" is the flight software. This module is about building one you can trust.

Every earlier module gave you one piece of it. Rigid Body Dynamics gave you the equations of motion. Reference Frames and Attitude Kinematics gave you the frames and the quaternion that carry the vehicle's attitude. Numerical Methods gave you integrators, truncation error and step-size control. Atmospheric Flight gave you the aerodynamic forces. The control and navigation tiers built the flight software itself: the estimator, the controller, the guidance law. A 6-DOF simulation is the one place all of that runs at once, on the same clock, closed into a loop, with nobody there to step in.

It is also the yardstick for the rest of the course. Every controller, filter and guidance law gets tested here before anyone believes it belongs on a vehicle. So the simulation has to be trustworthy in a strong sense. Running without crashing is not enough. Producing a plot that looks like a trajectory is not enough. The rest of this module earns that trust: checking the physics, modeling sensors and actuators honestly, handling sudden events, making results repeatable. This lesson is about the shape of the program that holds it all — five boxes, and the rule that they talk to each other only through the doors each one is supposed to have.

## The five boxes

Go back to the driving school. There is the car's physics. There is the world around it: the road, the wind, the hill. There is the screen, which is how the student learns anything. There is the student. And there is the steering and braking hardware between her hands and the car. Five pieces. A closed-loop vehicle simulation splits the same way.

| Box | Reads | Writes | What it is |
| --- | --- | --- | --- |
| Plant | total force and torque; current mass properties | position, velocity, attitude quaternion, body rates, mass, inertia tensor — all **true** | the rigid-body equations of motion, integrated forward in time |
| Environment | plant truth (position, time, attitude) | gravity vector, atmospheric density and wind, magnetic field, solar flux — all **true** | physics the vehicle does not control, evaluated at the plant's true state |
| Sensors | plant and environment truth | noisy, biased, quantized, delayed measurements | the boundary between truth and what the flight software is allowed to know |
| GNC | sensor outputs only | actuator commands | the actual flight code: navigation filter, controller, guidance law, unmodified |
| Actuators | GNC commands | the actual force and torque delivered to the plant | gimbal dynamics, rate and deflection limits, thrust transients — the boundary between command and reality |

Here is each box in one line.

- The **[[plant|plant-word]]** is the vehicle's own motion: the equations that turn force and torque into position, velocity, attitude and spin.
- The **environment** is everything physical the vehicle does not control: gravity, air, wind, the magnetic field, sunlight pushing on it.
- The **sensors** are the vehicle's eyes and ears. They turn the true state into imperfect measurements.
- **GNC** — guidance, navigation and control — is the flight software, the "student". It reads measurements and decides what to do.
- The **actuators** are its hands: engines that swivel, spinning wheels, small thrusters. They turn a command into a real force or torque.

Plant and environment together are called **truth** — the physics that would happen whether or not anyone was watching. Sensors and actuators are the two **boundaries** where truth meets the flight computer. Each boundary loses something on purpose. A sensor throws away precision and adds delay. An actuator cannot produce any torque it is asked for, instantly.

GNC is the box under test. It is not code you wrote to *stand in for* the flight software. Wherever possible it *is* the flight software — the same source code, or even the same compiled program, that will fly. A later lesson in this module, on the flight-software-in-the-loop boundary, is all about that.

### One trip around the loop

One tick of the loop visits the boxes in a fixed order. You can read it like a recipe.

1. **Environment** is asked for the forces at the plant's current true state: how strong is gravity here, how thick is the air.
2. **Sensors** sample plant and environment truth, on their own schedule, and produce measurements.
3. **GNC**, on its own schedule, reads the latest measurements and computes a command.
4. **Actuators** turn that command into whatever force and torque their own dynamics allow.
5. **Plant** integrates one step forward under the force and torque it actually received.

Then the [[cycle repeats|loop-picture]]. Every arrow in that cycle is a real interface. The next several lessons each open one of them: how the loop's clocks relate, what goes inside the environment, sensor and actuator models, how mass and flexing enter the plant, how the loop handles a sudden change like dropping a stage, and how you know any of it is right.

::: key The five boxes
Plant, environment, sensors, GNC, actuators. Keep them separable with explicit interfaces so each can be swapped, dispersed or replaced by hardware independently. GNC only ever sees what a sensor produced; the plant only ever feels what an actuator produced. Every shortcut across either boundary deletes something the simulation exists to test.
:::

## Why the interfaces are the whole design

Keeping the boxes apart is not about tidy code. The two boundary boxes exist to *hold back* information and ability that the flight software does not have in real flight. Any shortcut around a boundary deletes the very thing the simulation was built to test.

Two rules follow. Breaking either one is the most common way a simulation quietly stops meaning anything.

**Rule 1: GNC never reads plant or environment truth.** Whatever GNC knows about the vehicle, it knows because a sensor produced a measurement — with that sensor's noise, bias, **[[quantization|quantization]]** (rounding to fixed steps) and delay built in. Suppose a controller or navigation filter reads a plant variable directly, even once, even behind a flag meant to be temporary. Then every result afterward — every stability margin, every statistic — describes a vehicle that cannot exist. No sensor is perfect.

**Rule 2: the plant never receives a command.** Whatever force and torque the plant integrates, an actuator produced it, under its own dynamics. A gimbal takes time to swing. A reaction wheel has a maximum torque. A thruster has a smallest pulse it can fire. If the plant integrates GNC's *commanded* torque directly, you have quietly given the vehicle an actuator that is infinitely fast and infinitely strong. Every timing margin and every **[[saturation|saturation]]** event — an actuator hitting its limit — that would show up in flight becomes invisible.

There is a second payoff. Environment, sensors and actuators are separate boxes you can swap. So each one is a natural place to change things a test campaign needs to vary: a denser atmosphere, a bigger gyro bias, a slower gimbal, a lost GPS signal. A **[[dispersion campaign|dispersion-campaign]]** of ten thousand cases — the subject of the next module — then becomes a matter of drawing different settings for each box. You do not rewrite the simulation for each case.

::: example One tick through the five boxes
Take a small spacecraft, a "bus", with inertia tensor $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$. Read $\mathrm{diag}(\ldots)$ as "a diagonal matrix with these numbers down the middle": the bus resists spinning about its $x$, $y$ and $z$ axes with $1200$, $1500$ and $2000\,\mathrm{kg\,m^2}$. It is the same vehicle the Rigid Body Dynamics module used. After a maneuver it is left turning slowly, at

$$
\boldsymbol{\omega}_{\text{true}} = (0.00200,\ -0.000400,\ 0.000600)\,\mathrm{rad/s},
$$

where $\boldsymbol{\omega}$ ("omega", bold because it is a vector) is the spin rate about each body axis. A **[[reaction wheel|reaction-wheel]]** controller is trying to stop the spin. Follow one controller tick through all five boxes.

**Sensors.** The rate gyro has a $0.5\%$ scale-factor error on every axis ($sf_i = 0.005$), a bias of $\mathbf{b} = (3.0,\ -1.8,\ 0.7)\times10^{-5}\,\mathrm{rad/s}$, and a quantization step of $1\times10^{-5}\,\mathrm{rad/s}$. On each axis $i$, the gyro reports

$$
\omega_{\text{meas},i} = (1+sf_i)\,\omega_{\text{true},i} + b_i,
$$

rounded to the nearest step. On $x$: $1.005 \times 0.00200 = 0.00201$, then add the bias $0.00003$ to get $0.00204$. On $y$: $1.005 \times (-0.000400) = -0.000402$, plus $-0.000018$ is $-0.000420$. On $z$: $0.000603 + 0.000007 = 0.000610$. All three already sit on the $10^{-5}$ grid, so rounding changes nothing:

$$
\boldsymbol{\omega}_{\text{meas}} = (0.00204,\ -0.000420,\ 0.000610)\,\mathrm{rad/s} .
$$

**GNC.** A simple rate damper commands a wheel torque that pushes against the measured spin, $\mathbf{u}_{\text{cmd}} = -K_d\,\boldsymbol{\omega}_{\text{meas}}$, with gain $K_d = 400\,\mathrm{N\,m\,s/rad}$. Multiply each axis by $-400$: $-400 \times 0.00204 = -0.816$, and so on:

$$
\mathbf{u}_{\text{cmd}} = (-0.816,\ 0.168,\ -0.244)\,\mathrm{N\,m} .
$$

**Actuators.** The wheels can deliver at most $0.20\,\mathrm{N\,m}$ per axis. The $x$ and $z$ commands are bigger than that, so they are cut to the limit. The $y$ command fits, so it passes through:

$$
\mathbf{u}_{\text{act}} = (-0.200,\ 0.168,\ -0.200)\,\mathrm{N\,m} .
$$

**Plant.** Integrate Euler's rotational equations one fine step of $0.01\,\mathrm{s}$ (with RK4) under $\mathbf{u}_{\text{act}}$. The new rate is

$$
\boldsymbol{\omega} = (0.00199833,\ -0.00039887,\ 0.00059900)\,\mathrm{rad/s}.
$$

**Sanity check.** On $x$, a torque of $-0.2\,\mathrm{N\,m}$ on $1200\,\mathrm{kg\,m^2}$ changes the rate by $-0.2/1200 \times 0.01 = -1.67\times10^{-6}\,\mathrm{rad/s}$ in the step. And $0.00200 - 0.00000167 = 0.00199833$. It matches.

Now integrate under the *unclipped* command instead, as if the actuator box were missing: $(0.00199320,\ -0.00039887,\ 0.00059878)\,\mathrm{rad/s}$. On $x$ that is $5.13\times10^{-6}\,\mathrm{rad/s}$ different in a single step, from saturation alone.

Look at $y$. Its command was never clipped — $0.168\,\mathrm{N\,m}$ in both runs — and yet the two runs' $y$ rates still differ, by about $9\times10^{-12}\,\mathrm{rad/s}$. Euler's equations [[couple the axes|axis-coupling]] through products of the rates. What happens on $x$ and $z$ inside the integrator's stages leaks a little into $y$, even though $y$'s own torque did not change. No axis of a spinning rigid body is ever fully independent of the others. Remember that before you decide a bug lives only on the axis where you see it.
:::

That single step moved the rate by a few parts per thousand. The next example shows what saturation costs over time — and what the simulation would have told you if the actuator box had been skipped.

::: example What the actuator box was hiding
Same bus, same controller, same gyro model, but a bigger starting tumble, the kind you might see right after separating from a rocket:

$$
\boldsymbol{\omega}_0 = (0.0200,\ -0.00400,\ 0.00600)\,\mathrm{rad/s}.
$$

The first command is $\mathbf{u}_{\text{cmd}} \approx (-8.05,\ 1.62,\ -2.42)\,\mathrm{N\,m}$. On the $x$ axis alone that is about $40$ times the $0.20\,\mathrm{N\,m}$ the wheel can give.

Run the closed loop for $3\,\mathrm{s}$ two ways. Everything is identical — gyro model, controller gain, a $20\,\mathrm{Hz}$ controller tick, RK4 plant steps of $0.01\,\mathrm{s}$ — except whether the actuator box is there.

**With the actuator box** (what the real hardware does): the wheel saturates at $\pm0.20\,\mathrm{N\,m}$ and stays there. After $3\,\mathrm{s}$, $\omega_x = 0.019527\,\mathrm{rad/s}$ — only $2.36\%$ lower than where it started. Running longer, $\omega_x$ first falls to a tenth of its starting value at $t \approx 108.6\,\mathrm{s}$, and the $x$ command stays pinned at the limit until about $t \approx 118\,\mathrm{s}$. That is nearly two minutes of full-power braking.

**Sanity check.** At full torque, $\omega_x$ drops by $0.2/1200 = 1.67\times10^{-4}\,\mathrm{rad/s}$ every second. In $3\,\mathrm{s}$ that is $5.0\times10^{-4}$, taking $0.0200$ down to about $0.0195$. To remove all $0.0200\,\mathrm{rad/s}$ would take $0.0200 / (1.67\times10^{-4}) = 120\,\mathrm{s}$. Both agree with the simulation.

**Without it** (GNC's command wired straight into the plant): after $3\,\mathrm{s}$, $\omega_x = 0.0072486\,\mathrm{rad/s}$ — a drop of $63.8\%$. That is about $2.7$ times smaller than the honest result. This run falls to a tenth of its starting rate in about $7\,\mathrm{s}$.

**Sanity check.** Without a limit, the damper shrinks the rate like $e^{-t/\tau}$ with time constant $\tau = I_x / (1.005\,K_d) = 1200/402 \approx 2.99\,\mathrm{s}$. After $3\,\mathrm{s}$ that leaves $e^{-1.005} \approx 0.366$ of the start, about $0.0073\,\mathrm{rad/s}$. It matches.

Both runs use the same controller and the same sensor. The only difference is whether a box stood between the commanded torque and the plant. The run without it makes a $400\,\mathrm{N\,m\,s/rad}$ gain on a $0.20\,\mathrm{N\,m}$ wheel look like it stops a tumble in seconds. The honest vehicle needs about two minutes, because that is all a wheel this size can deliver. An engineer who sized the wheel, or wrote a time-to-stop requirement, from the broken simulation would be wrong by more than a factor of ten. And both plots look perfectly smooth. Nothing on the plot says which one is real.
:::

::: warning Peeking at truth "temporarily"
Wiring a controller or navigation filter straight to plant truth during debugging is tempting. It tells you whether the algorithm itself works, without sensor noise in the way. The danger is not doing it once. It is forgetting to take it out. A controller tuned or accepted against truth has never been tested against the sensors it will fly with, and a gain margin computed that way describes a vehicle that does not exist. If you need to test the algorithm alone, write a **[[unit test|unit-test]]** that calls it directly. Do not rewire the simulation.
:::

::: warning Folding the actuator into GNC's own clipping
It looks the same to have GNC clip its own command to the actuator's known limit and skip a separate actuator box. The plant still never sees an impossible torque. But it is not the same. The flight software's picture of its own actuator is a simplification, often a deliberately cautious one, and it is often wrong in ways nobody has found yet: a wheel with more friction than its datasheet says, a gimbal whose rate limit depends on the temperature of its hydraulic fluid, a valve with a delay the software does not know about. The actuator box's job is to be an *independent* model of the hardware — one the flight software never sees and cannot agree with by construction. That is how the simulation catches the case where the software's belief about its own actuator is the thing that is wrong.
:::

## Check yourself

::: check
Name the five boxes. For each, say in one phrase what goes in and what comes out.
:::

::: answer
- Plant: total force and torque in, true state out.
- Environment: plant truth in, true environmental fields (gravity, air, wind, magnetic field, sunlight) out.
- Sensors: plant and environment truth in, corrupted measurements out.
- GNC: measurements in, commands out.
- Actuators: commands in, the force and torque actually delivered out.
:::

::: check
Why must the sensors sit strictly between the plant and GNC? What goes wrong if, during debugging, GNC is wired to read a plant variable directly, and that wire is never removed?
:::

::: answer
Every measurement GNC would see in flight carries that sensor's noise, bias, scale factor, quantization and delay. If GNC reads plant truth instead, the controller or filter is being checked against information no real sensor could give it — a rate with no gyro noise, a position with no navigation error. Every stability margin, filter tuning or Monte Carlo statistic produced afterward describes a made-up vehicle that knows its own state perfectly. That is not the vehicle that will fly.
:::

::: check
In the reaction-wheel example, the run without an actuator box reached $\omega_x = 0.0072\,\mathrm{rad/s}$ after $3\,\mathrm{s}$, while the honest run was still at $0.0195\,\mathrm{rad/s}$. Which one describes the real hardware, and what does the size of the gap tell an engineer sizing the wheel?
:::

::: answer
The run with the actuator box describes the real hardware, because it respects the wheel's $0.20\,\mathrm{N\,m}$ limit. The other one quietly assumed unlimited torque.

The gap is large: a factor of about $2.7$ in remaining rate after $3\,\mathrm{s}$, and about $109\,\mathrm{s}$ versus about $7\,\mathrm{s}$ to shrink the rate to a tenth. So for a tumble this big, the wheel is too small by more than a factor of ten in time. The broken simulation could never have told the engineer that, because it never modeled the limit at all.
:::

::: check
A teammate says clipping GNC's command to the actuator's documented torque limit, inside the GNC code, is the same as having a separate actuator box, so the extra box is unnecessary. Give a case where the two are not the same.
:::

::: answer
They agree only when the flight software's model of the actuator is exactly right. They split apart whenever it is not. For example, the real wheel's torque might fade with age or heat to $0.15\,\mathrm{N\,m}$ while the software still clips at the datasheet value of $0.20\,\mathrm{N\,m}$. Or the actuator might have behavior the software does not model at all, such as a lag or backlash (a little free play before it grips). A separate actuator box with its own, independently kept model is what lets the simulation catch the software's assumption being wrong. A clip inside GNC can only ever agree with itself.
:::

::: check
Why is the environment its own box, rather than a bit of code inside the plant that computes gravity and calls it done?
:::

::: answer
The environment holds everything physical that is not the vehicle — gravity, atmosphere, wind, magnetic field, solar radiation pressure — and none of it is under the vehicle's control. Keeping it separate means each field can be swapped or varied on its own: a denser atmosphere, a different wind profile, a solar-minimum versus solar-maximum magnetic field, all without touching the rigid-body equations. A dispersion campaign needs exactly that. It also lets the same plant code fly a spacecraft in orbit and a vehicle in the atmosphere, with only the environment box swapped.
:::

::: check
In the one-tick example, the $y$ command was never clipped — the wheel delivered exactly the $0.168\,\mathrm{N\,m}$ GNC asked for — yet the $y$ rate still came out very slightly different between the clipped and unclipped runs. Why, if the $y$ torque was the same?
:::

::: answer
Euler's rotational equations are coupled. The rate of change on each axis depends on the *product* of the other two axes' rates, not only on that axis's own torque. Because $x$ and $z$ got different torques in the two runs, their rates moved slightly differently through the integrator's internal stages. That difference fed into $y$'s derivative through the $\omega_z\omega_x$ coupling term, even though the $y$ torque $M_y$ never changed. The effect is tiny here because the rates and the step are small, but it is a direct result of the gyroscopic coupling from the Rigid Body Dynamics module, not a bug.
:::

## Summary

| Box | Turns | Into |
| --- | --- | --- |
| Plant | applied force and torque | true state (position, velocity, quaternion, rates, mass, inertia) |
| Environment | plant truth | true gravity, atmosphere, wind, field, radiation pressure |
| Sensors | plant and environment truth | noisy, biased, quantized, delayed measurements |
| GNC | measurements | commands — the actual flight code, unmodified |
| Actuators | commands | the force and torque the plant actually feels |
| Two rules | GNC never reads truth; plant never receives a command directly | each boundary box does its own, independent job |

A controller that seems to solve a problem in seconds can take two minutes in reality, and the only way to know which is true is to model each boundary honestly. The next lesson looks at the clock inside these boxes: the plant needs a fine, accurate step, while GNC must run at the one rate it was designed for — and getting that wrong does as much damage as skipping a box.

::: context six-dof Six ways to move
A "degree of freedom" is one independent way something can move. A rigid object in space has six. It can slide along three directions — forward and back, left and right, up and down. And it can turn about three axes — the turns aircraft people call roll, pitch and yaw. A "3-DOF" simulation tracks only the sliding (a point with mass). A "6-DOF" also tracks the turning, which is what you need the moment a controller has to point the vehicle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ab" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
  </defs>
  <line x1="130" y1="100" x2="250" y2="100" stroke="#1d6fd1" stroke-width="2.5" marker-end="url(#ab)"/>
  <line x1="130" y1="100" x2="130" y2="18" stroke="#1d6fd1" stroke-width="2.5" marker-end="url(#ab)"/>
  <line x1="130" y1="100" x2="70" y2="150" stroke="#1d6fd1" stroke-width="2.5" marker-end="url(#ab)"/>
  <rect x="112" y="84" width="36" height="32" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <ellipse cx="215" cy="100" rx="6" ry="16" fill="none" stroke="#b4232c" stroke-width="2"/>
  <ellipse cx="130" cy="42" rx="16" ry="6" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="91" cy="132" r="11" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="258" y="104" font-size="13" fill="#1f2a44">x</text>
  <text x="138" y="20" font-size="13" fill="#1f2a44">z</text>
  <text x="56" y="162" font-size="13" fill="#1f2a44">y</text>
  <text x="200" y="30" font-size="12" fill="#1d6fd1">3 ways to slide</text>
  <text x="200" y="48" font-size="12" fill="#b4232c">3 ways to turn</text>
  <text x="200" y="145" font-size="12" fill="#1f2a44">3 + 3 = 6</text>
</svg>
```
:::

::: context plant-word Why "plant"?
The word comes from process control, the engineering of factories: chemical plants, power plants, steel mills. Early control engineers called the thing being controlled "the plant", because it usually was one. The name stuck. Today a rocket's rigid-body motion, a car's engine or a drone's rotors are all "the plant" in a control diagram — the physical system the controller is trying to steer, as opposed to the controller itself.
:::

::: context loop-picture The loop, drawn
Truth boxes are blue, the two boundary boxes are orange, and the box under test is outlined in red. The dashed line is the sensors also reading plant truth directly.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ak" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker>
  </defs>
  <rect x="138" y="14" width="84" height="28" rx="4" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="33" font-size="12" text-anchor="middle" fill="#1f2a44">GNC</text>
  <rect x="258" y="76" width="84" height="28" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="95" font-size="12" text-anchor="middle" fill="#1f2a44">Actuators</text>
  <rect x="198" y="154" width="84" height="28" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="240" y="173" font-size="12" text-anchor="middle" fill="#1f2a44">Plant</text>
  <rect x="78" y="154" width="84" height="28" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="173" font-size="12" text-anchor="middle" fill="#1f2a44">Environment</text>
  <rect x="18" y="76" width="84" height="28" rx="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="95" font-size="12" text-anchor="middle" fill="#1f2a44">Sensors</text>
  <line x1="222" y1="34" x2="276" y2="74" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ak)"/>
  <line x1="296" y1="106" x2="262" y2="152" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ak)"/>
  <line x1="198" y1="168" x2="164" y2="168" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ak)"/>
  <line x1="98" y1="152" x2="64" y2="106" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ak)"/>
  <line x1="84" y1="74" x2="136" y2="34" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ak)"/>
  <line x1="214" y1="154" x2="100" y2="106" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4" marker-end="url(#ak)"/>
  <text x="258" y="44" font-size="11" fill="#6c7a93">command</text>
  <text x="290" y="136" font-size="11" fill="#6c7a93">force, torque</text>
  <text x="34" y="44" font-size="11" fill="#6c7a93">measurements</text>
</svg>
```
:::

::: context quantization Rounding to fixed steps
A digital sensor can only report numbers from a fixed ladder of values, the way a bathroom scale might only show whole tenths of a kilogram. The gap between rungs is the quantization step. A true rate of $0.0020037\,\mathrm{rad/s}$ on a gyro with a $10^{-5}\,\mathrm{rad/s}$ step comes out as $0.00200$. The lost part is small but never zero, and a controller designed on perfect numbers can behave differently when it only ever sees rungs of the ladder.
:::

::: context saturation Hitting the stop
Saturation is what happens when you ask for more than the hardware has. Press a car's gas pedal to the floor and the car does not accelerate any harder by pressing harder. A reaction wheel is the same: past its torque limit, a bigger command changes nothing. A controller designed as if the actuator were unlimited can behave very differently once it saturates — slower, and sometimes unstable. You will meet this again in the actuator-models lesson and in the control tier's material on integrator windup.
:::

::: context dispersion-campaign Ten thousand slightly different flights
Nobody knows the real vehicle's numbers exactly. The engine might push $1\%$ harder, the wind might be stronger, a gyro's bias might be larger. A dispersion campaign (also called a Monte Carlo run, after the casino, because it rolls dice) runs the simulation thousands of times, each with its uncertain numbers drawn at random from realistic ranges. The spread of the results tells you how often the mission succeeds. The next module, on verification, validation and Monte Carlo, is built on this — and the five-box split is what makes it a settings change instead of a rewrite.
:::

::: context reaction-wheel Turning by spinning a wheel
A reaction wheel is a heavy disk inside the spacecraft, driven by an electric motor. Speed the wheel up one way and the spacecraft turns the other way — the same reason a person on a spinning office chair turns when they swing a heavy bag. The motor's torque on the wheel comes back as an equal and opposite torque on the body. The motor can only push so hard, which is the $0.20\,\mathrm{N\,m}$ limit in the example.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="25" width="160" height="100" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="75" r="30" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="75" r="4" fill="#1f2a44"/>
  <path d="M 150 60 A 34 34 0 0 1 206 48" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="212,52 200,44 204,56" fill="#1d6fd1"/>
  <path d="M 246 136 A 90 90 0 0 0 276 96" fill="none" stroke="#b4232c" stroke-width="3"/>
  <polygon points="279,86 270,99 283,100" fill="#b4232c"/>
  <text x="180" y="18" font-size="12" text-anchor="middle" fill="#1d6fd1">wheel spun up one way</text>
  <text x="292" y="92" font-size="12" fill="#b4232c">body turns</text>
  <text x="292" y="107" font-size="12" fill="#b4232c">the other way</text>
</svg>
```
:::

::: context axis-coupling Why one axis leaks into another
Euler's equation for the $y$ axis is $I_y\dot\omega_y = (I_z - I_x)\,\omega_z\omega_x + M_y$. Read $\dot\omega_y$ as "omega y dot", the rate of change of $\omega_y$. The first term depends on the spins about $z$ and $x$. So if a different torque changes $\omega_x$ even slightly, $\dot\omega_y$ changes too, with $M_y$ untouched. For the bus, $I_z - I_x = 800\,\mathrm{kg\,m^2}$, so the leak is real whenever both other axes are spinning. The same term is behind the tennis-racket flip you will reproduce when validating the simulation.
:::

::: context unit-test Testing one piece on its own
A unit test is a short program that calls one function with chosen inputs and checks its output against a known answer. To check a rate damper, you might feed it a rate of $0.001\,\mathrm{rad/s}$ and confirm it returns $-0.4\,\mathrm{N\,m}$. Nothing else runs — no plant, no sensors. That isolates the algorithm without changing the simulation's wiring, so there is nothing to forget to undo. Later lessons in this module on regression testing build whole suites of these.
:::
