---
id: l12-real-time-targets-and-hil
title: 'Real-time targets and HIL: the bench that plays the vehicle'
minutes: 24
covers:
  - 'Real-time targets and HIL: Speedgoat, dSPACE, OPAL-RT; RCP versus HIL; fault injection'
---

A flight simulator for pilots is a strange machine. The cockpit is real: seats, switches, screens. Everything outside the window is a computer's invention. The simulator must answer every move of the stick at once, because a pilot notices a picture that lags even a tenth of a second. And the instructor has a panel of buttons that no real airplane has: engine fire, frozen airspeed, a hydraulic leak. Pilots train on the failures they hope never to meet.

A **hardware-in-the-loop** rig is that simulator, built for a flight computer instead of a pilot. The flight computer is real, running its real software. The vehicle around it, its motion, its sensors and its actuators, is a computer's invention, computed fast enough to keep pace with the clock. And the test engineer has a panel of failures to inject.

Lesson 1 placed HIL at the top of the MIL, SIL, PIL, HIL chain, and the last two lessons joined generated code and hand-written C in both directions. This last lesson of the module looks at the machines that run a model in real time, the two ways of using them, the faults a rig can inject, and what a rig finds that no desktop simulation can.

## Real-time targets: computers that keep pace

On your PC, a simulation runs as fast as it can. Ten seconds of flight might take one second or one minute. A **real-time target** is a computer built to run a compiled Simulink model in lockstep with the wall clock: each 1 ms step of simulated time takes exactly 1 ms of real time, without ever falling behind. It carries **[[I/O boards|io-boards]]** that turn model signals into real voltages, currents and bus messages, and real ones back into model signals.

Three families of these machines dominate aerospace and automotive labs.

- **Speedgoat** is a Swiss company whose target computers run **[[Simulink Real-Time|slrt]]**, a MathWorks product. You build the model in Simulink, compile it into a real-time application, load it onto the Speedgoat machine, and start it from MATLAB.
- **dSPACE**, a German company based in Paderborn, builds its own real-time hardware and tools. **SCALEXIO** is its HIL system, **MicroAutoBox** is a rugged box for running a controller in a test vehicle, and tools such as **ControlDesk** let you watch and change signals while the model runs.
- **OPAL-RT**, a company from Montreal, builds real-time simulators run by its **RT-LAB** software. It is known for very fast models of electrical systems, including models run on FPGA chips (reprogrammable logic hardware) with steps of a microsecond or less, which power electronics and electric-grid work need.

All three take a Simulink model, generate C from it (the same code generation this module has studied, with a target file for their hardware), compile it, and run it on a real-time operating system. While it runs, you can watch signals and change tunable parameters from the host PC. In Simulink this is called **[[external mode|external-mode]]**: the model on your screen becomes a remote control for the one on the target.

### Keeping pace: the task execution time

Each step, the target has one sample period to read its inputs, compute the model and write its outputs. The time that actually takes is the **[[task execution time|tet]]** (TET). If the TET ever exceeds the period, the step overruns, and the rig is no longer real time. A real-time target counts overruns and usually stops the run on one, because a plant that runs late is a plant that lies.

::: key
A real-time target (Speedgoat with Simulink Real-Time, dSPACE, OPAL-RT) runs compiled model code in lockstep with the wall clock and connects it to real I/O. Its task execution time must stay below the sample period every step; an overrun means the simulation is no longer trustworthy.
:::

::: example Sizing a HIL plant model
A HIL rig runs a rocket's plant model at 1 kHz on a real-time target. The flight computer under test runs its control law at 100 Hz. The measured worst-case TET of the plant model is 0.42 ms.

**Step 1: the period.** At 1 kHz, $T = 1/1000\,\mathrm{s} = 1\,\mathrm{ms}$.

**Step 2: the load.** $0.42 / 1.0 = 0.42$, so the target is 42 percent busy in its worst step.

**Step 3: a model upgrade.** The aerodynamics team adds a better model that costs 0.35 ms more. The new worst case is $0.42 + 0.35 = 0.77$ ms, or 77 percent. That still fits, but with 0.23 ms to spare for I/O and anything the next upgrade adds. Many labs set a limit such as 80 percent and would start planning a faster target now.

**Step 4: why 1 kHz for a 100 Hz controller?** The plant runs 10 steps for every control step, so the sensor signals the flight computer reads change smoothly between its samples, the way the real world does. The rig's own delay, up to one plant step, costs $\omega\tau$ of phase: at the loop's 20 rad/s crossover, $20 \times 0.001 = 0.02$ rad, about $1.1^\circ$.

**Sanity check.** A plant running at the same 100 Hz as the controller would add up to 10 ms of rig delay, $20 \times 0.010 = 0.2$ rad or about $11^\circ$ of phase, and the test would be judging the rig as much as the flight computer. Running the plant several times faster than the controller keeps the rig's own errors small.
:::

## RCP and HIL: which side is real?

A control loop has two halves: the controller and the plant. A real-time target can play either one. That gives two very different uses.

In **rapid control prototyping (RCP)**, the real-time target runs your *controller*, straight from the model, and the plant is real hardware, or sometimes a simulated one. Imagine a new thrust-vector control law for an engine gimbal. The flight computer for it does not exist yet. So you compile the controller model onto a Speedgoat or a MicroAutoBox, wire it to the real gimbal actuator on a test stand, and try the law on the real actuator. Change a gain, rebuild, try again the same afternoon.

In **hardware-in-the-loop (HIL)**, it is the other way around. The *controller* is the real flight computer with its real flight software. The target runs the *plant*: the vehicle's motion, the sensors, the actuators. The flight computer cannot tell it is not flying.

::: key
RCP versus HIL in one line each. Rapid control prototyping: a real-time computer runs your controller against real or simulated hardware, so you can iterate on the control law early. Hardware-in-the-loop: the real controller hardware runs against a simulated plant, so you can verify the shipped unit without the full vehicle.
:::

RCP comes early, while the control law is changing and the flight hardware is not built: "does this design work on the real actuator?" HIL comes late, when the flight computer exists: "does the unit we will fly work?"

::: warning An RCP success is not flight evidence
In RCP, the controller ran on a powerful lab computer, not the flight processor, and never met the flight scheduler and drivers. RCP proves the control law against real hardware. It says nothing about the flight computer, which is what HIL tests.
:::

Rigs can also mix the two. A HIL rig can keep a real component in the loop: a real fin actuator on a load stand, a real inertial unit on a rate table, with the rest simulated. And every such real part checks the rig's own models. If the simulated actuator responds differently from the real one on the same command, the model is wrong, and every test that leaned on it must be reviewed.

## What HIL catches that simulation cannot

Every earlier stage ran the controller in a world where time is polite. In MIL and SIL, a step takes zero time and data arrives exactly when the model says. In PIL, the board and the PC take turns. On a HIL rig, time is real.

::: key
What HIL catches that simulation cannot: real I/O timing (bus framing, driver buffering, conversion time), electrical interfaces (voltage levels, polarity, wiring and connector pinouts, grounding), driver and middleware bugs, the real clock and its jitter, and CPU load with every flight task running at once, plus boot, reset and watchdog behavior.
:::

- **Real I/O timing.** A gyro message crosses a bus in frames, waits in a driver's buffer, and is copied by a DMA engine (hardware that moves data without the processor) before the control task sees it. Lesson 1 added these up to a few milliseconds that no host simulation contained.
- **Electrical interfaces.** A sensor wired with its sign reversed, a pin swapped in a connector, an analog input that expects 0 to 5 V fed 0 to 10 V, a ground loop that adds noise. In simulation, a signal is a number; on the rig it is a voltage on a wire.
- **Driver bugs.** The drivers that move data between hardware and the generated code are hand-written and are not in any model. A driver that reads a register in the wrong order, or loses a message when two arrive together, shows up only when the real hardware talks.
- **The real clock and jitter.** The flight computer's timer is a crystal, not a perfect number. Its tasks start a little early or late each cycle. That variation is **[[jitter|jitter]]**.
- **CPU load.** On a rig, the control task shares the processor with navigation, telemetry, the file system and interrupts. A step that took 0.3 ms alone might take 0.9 ms at the worst moment of a busy frame.

::: key
Your HIL rig shows a 4 ms delay that SIL did not. Where does it come from? The real interfaces: bus arbitration and framing on CAN or 1553, driver and DMA buffering, task scheduling and rate-transition latency, and analog conversion time. None of those exist in a host simulation, which is why HIL is not optional.
:::

::: example What 0.3 ms of jitter does
On the HIL rig, the flight computer's 100 Hz control task is timed over an hour. Its average period is 10.000 ms, but individual periods range from 9.7 ms to 10.3 ms: a jitter of $\pm 0.3$ ms.

**Step 1: phase cost of the extra delay.** In the worst case the command goes out 0.3 ms later than the design assumed. At the 20 rad/s crossover, $\omega\tau = 20 \times 0.0003 = 0.006$ rad, which is $0.006 \times 180 / \pi \approx 0.34^\circ$. Small.

**Step 2: a rate computed by differencing.** Suppose the software estimates the vehicle's turn rate from two attitude samples, dividing by the design period of 10 ms. If the vehicle turns at a true $2.0$ deg/s and the real gap between samples was 10.3 ms, the attitude changed by $2.0 \times 0.0103 = 0.0206$ degrees. Dividing by 0.010 s gives $2.06$ deg/s: a 3 percent error, every time the period stretches.

**Step 3: the fix.** Timestamp each sample with the real clock and divide by the measured gap, or let the hardware sample on a fixed clock so the gap cannot vary.

**Sanity check.** The error ratio, $10.3/10 = 1.03$, is the period's stretch. Jitter barely touches the phase margin but quietly biases anything that assumes an exact period, and neither effect exists in a simulation where every step is exactly 10 ms.
:::

::: warning Passing HIL once is not passing HIL
Timing faults are rare events: two interrupts that collide once an hour, a buffer that overflows only when telemetry is at its busiest. A 30-second HIL run can pass software that fails at minute 50. Long runs, the busiest flight phases, and deliberate worst-case loading are part of HIL testing, not extras.
:::

## Fault injection: failing on purpose

A pilot simulator's instructor panel has a HIL equivalent, and it may be the most valuable thing on the rig. **Fault injection** means making something go wrong on purpose, at a chosen moment, to check that the flight software notices and responds as its requirements say. On a real vehicle most of these tests are impossible or dangerous. On a rig they are a button.

Faults come in families:

- **Sensor faults.** A **bias**, a constant offset added to a gyro's reading. A **dropout**, the sensor goes silent for some milliseconds. A **frozen** or **stuck** output that repeats its last value. Extra noise, or a reading pinned at the end of its range.
- **Actuator faults.** A fin **stuck** at one angle, an actuator that moves slower than commanded, an engine valve that does not open.
- **Bus and data faults.** Dropped messages, corrupted checksums, messages that arrive late or out of order, a bus that goes silent.
- **Electrical faults.** An open wire, a short to ground, a sagging supply voltage. These are made with a **[[fault insertion unit|fiu]]**, a box of relays between the flight computer and the rig that can break or short real wires on command.

Sensor, actuator and bus faults can often be made inside the plant model at a scheduled time. Electrical faults need hardware. Either way, each fault-management requirement gets at least one test that causes exactly its fault and checks the response and its timing.

::: example A gyro bias, and how fast it is caught
A vehicle carries three gyros. The control law uses gyro A; the other two are there for checking. Every 10 ms step, fault management compares each gyro with the median of the three. If one differs from the median by more than 0.3 deg/s on 5 steps in a row, it is declared failed, and the control law switches to a healthy gyro on the next step. On the rig, a bias of 0.5 deg/s is injected into gyro A right before a step.

**Step 1: the first miscompare.** The median is now one of the healthy gyros, so gyro A differs from it by $0.5$ deg/s, above the 0.3 deg/s threshold, from the very first step at $t = 0$.

**Step 2: persistence.** The fifth miscompare in a row comes at $t = 40$ ms (steps at 0, 10, 20, 30, 40 ms). The switch happens on the next step, at $t = 50$ ms.

**Step 3: the damage.** For those 50 ms the control law trusted a gyro reading 0.5 deg/s too high, so its attitude estimate drifted by $0.5 \times 0.050 = 0.025$ degrees. The requirement allows 0.1 degrees. Pass.

**Step 4: a design trade.** Someone proposes 20 steps of persistence, to avoid false alarms from gyro noise. The switch would come at $t = 200$ ms, and the drift would be $0.5 \times 0.200 = 0.100$ degrees: exactly at the limit. The rig shows the trade in numbers.

**Sanity check.** The drift is the bias times the time it went unnoticed, the same as a car's speedometer reading 5 km/h high for 2 hours putting you 10 km off in your head. Double the persistence time, double the error.
:::

::: warning Inject faults into the running software, not only the model
A fault injected only in MIL tests the fault-management *logic*. A fault injected on the HIL rig also tests the drivers' error flags, the timeouts, the health counters and the timing of the response on the real processor. A requirement like "switch within 60 ms" can only be verified where real time exists.
:::

## Where the rig fits

A HIL rig is expensive, and a program has only a few. A spacecraft team may build a **[[flatsat|flatsat]]**, its avionics laid out on a table and wired as they will be in flight, and connect it to a real-time plant model. The rule for all of them is to **[[test like you fly|tlyf]]**: run the real software, through the real interfaces, through whole mission timelines, from power-on to the end of the mission.

HIL does not end testing. The plant is still a model. Flight data, compared with the rig's predictions after each flight, closes that last gap, and a mismatch sends the team back to fix the model and re-run the rig.

## Check yourself

::: check
A team wants to try three candidate control laws on a real engine gimbal actuator next week. The flight computer will not be built for six months. Which approach fits, and what will it not tell them?
:::

::: answer
Rapid control prototyping. They compile each control law from its model onto a real-time target such as a Speedgoat or a MicroAutoBox, wire it to the real actuator, and iterate. It will not tell them anything about the flight computer: its processor, its scheduler, its drivers and its timing under load. Those need HIL once the flight computer exists.
:::

::: check
A HIL plant model at 2 kHz has a worst-case TET of 0.38 ms. What is the load, and is there room to double the model's cost?
:::

::: answer
At 2 kHz the period is $1/2000$ s $= 0.5$ ms. The load is $0.38/0.5 = 0.76$, or 76 percent. Doubling the cost would need 0.76 ms per step, more than the 0.5 ms period, so every step would overrun. The team must optimize the model, move part of it to another core or a faster target, or run the plant at a lower rate if the controller allows.
:::

::: check
Name three defects a HIL rig can reveal that a SIL run with a perfect plant model cannot, and say why SIL misses each.
:::

::: answer
A gyro wired with reversed polarity: in SIL the signal is a number passed in software with the right sign, so wiring never appears. A driver that drops a message when two arrive together: drivers are hand-written and not part of the SIL build. A missed deadline when telemetry and navigation run at their busiest: SIL runs one step at a time with no other tasks and no real clock.
:::

::: check
In the gyro-bias example, the threshold is lowered from 0.3 to 0.1 deg/s, keeping 5 steps of persistence. What changes for a 0.5 deg/s bias, and what is the risk?
:::

::: answer
For a 0.5 deg/s bias, nothing: it was already above 0.3, so the switch still comes at 50 ms with 0.025 degrees of drift. The lower threshold would catch smaller biases, such as 0.2 deg/s. The risk is false alarms: ordinary gyro noise or the small real difference between two healthy gyros might exceed 0.1 deg/s for 5 steps, switching away from a good gyro. The rig can measure how often that happens with healthy sensors.
:::

## Summary

| Idea | What it means | Remember |
|---|---|---|
| Real-time target | Runs compiled model code in lockstep with the clock, with real I/O | Speedgoat with Simulink Real-Time; dSPACE SCALEXIO and MicroAutoBox; OPAL-RT with RT-LAB |
| TET | Time one step really takes | Must stay under the period; load = TET / period |
| External mode | Watch signals and tune parameters on the running target | The model on the PC becomes a remote control |
| RCP | Real-time computer runs the controller; plant is real | Early; iterate on the control law |
| HIL | Real flight computer; plant simulated in real time | Late; verify the unit you will fly |
| What HIL catches | I/O timing, electrical interfaces, drivers, jitter, CPU load, boot and watchdogs | None exist in MIL, SIL or PIL |
| Jitter | Variation in when a periodic task runs | Small phase cost; biases anything that assumes an exact period |
| Fault injection | Causing faults on purpose to test the response | Sensors, actuators, buses, wires; drift = bias × detection time |

This lesson ends the Simulink track, and the whole chain now stands: a model tested in MIL, turned into C, proven equivalent in SIL and PIL, integrated into a hand-written program, and exercised on a rig that plays the vehicle. The coding track's interview modules come back to it, because "how would you verify this flight software?" is a standard system-design question, and the answer is this chain, told with numbers.

::: context io-boards How a number becomes a voltage
A real-time target is only as useful as its input and output boards. Analog output boards turn a model's number into a voltage, for example to imitate a pressure transducer. Analog inputs read the flight computer's analog outputs. Digital and PWM boards handle on-off signals and pulse trains, such as a servo command. Bus boards speak CAN, MIL-STD-1553, ARINC 429 or Ethernet, and can pretend to be a whole box on the bus. Each board adds its own conversion time, which belongs in the rig's latency budget.
:::

::: context slrt From xPC Target to Simulink Real-Time
MathWorks' real-time product used to be called xPC Target, because it turned an ordinary PC into a real-time target by booting it into a small real-time kernel. It was renamed Simulink Real-Time, and it now runs on Speedgoat hardware, with QNX Neutrino as the real-time operating system underneath in recent releases. The workflow stays inside MATLAB: build the model into a real-time application, load it onto the target, start it, and log or stream its signals back to the host.
:::

::: context external-mode A remote control for the running model
In external mode, Simulink on your PC connects to the model code running on the target. Scopes and displays on your screen show the target's live signals, and when you change a tunable parameter in a block dialog, the new value is sent to the target and takes effect on the next step. That is why the tunable parameters of lesson 8 matter on a rig: an inlined gain is a literal in the code and cannot be changed without rebuilding.
:::

::: context tet One frame, one budget
Each sample period starts with a timer tick. The target reads its inputs, computes one model step, writes its outputs, and then waits for the next tick. The busy part is the task execution time. The idle part is the margin. If the busy part ever reaches the next tick, that is an overrun.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="70" x2="340" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="30" x2="30" y2="80" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <line x1="180" y1="30" x2="180" y2="80" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <line x1="330" y1="30" x2="330" y2="80" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <rect x="30" y="50" width="63" height="20" fill="#1d6fd1"/>
  <rect x="180" y="50" width="63" height="20" fill="#1d6fd1"/>
  <text x="61" y="44" font-size="11" fill="#1d6fd1" text-anchor="middle">TET 0.42</text>
  <text x="137" y="64" font-size="11" fill="#6c7a93" text-anchor="middle">idle</text>
  <text x="30" y="95" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="180" y="95" font-size="11" fill="#1f2a44" text-anchor="middle">1 ms</text>
  <text x="330" y="95" font-size="11" fill="#1f2a44" text-anchor="middle">2 ms</text>
  <text x="180" y="115" font-size="11" fill="#1f2a44" text-anchor="middle">load = 0.42 / 1.0 = 42 percent</text>
</svg>
```
:::

::: context jitter Ticks that wobble
A perfect periodic task would start at exactly 0, 10, 20, 30 ms. A real one starts a little early or late each time, because interrupts, cache misses and other tasks nudge it. The spread of those start times is the jitter. Real-time operating systems exist to keep it small and bounded, but it is never zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <text x="10" y="30" font-size="11" fill="#1f2a44">ideal</text>
  <line x1="60" y1="35" x2="340" y2="35" stroke="#6c7a93"/>
  <line x1="80" y1="20" x2="80" y2="35" stroke="#1f2a44" stroke-width="2"/>
  <line x1="160" y1="20" x2="160" y2="35" stroke="#1f2a44" stroke-width="2"/>
  <line x1="240" y1="20" x2="240" y2="35" stroke="#1f2a44" stroke-width="2"/>
  <line x1="320" y1="20" x2="320" y2="35" stroke="#1f2a44" stroke-width="2"/>
  <text x="10" y="75" font-size="11" fill="#1f2a44">real</text>
  <line x1="60" y1="80" x2="340" y2="80" stroke="#6c7a93"/>
  <line x1="80" y1="65" x2="80" y2="80" stroke="#b4232c" stroke-width="2"/>
  <line x1="163" y1="65" x2="163" y2="80" stroke="#b4232c" stroke-width="2"/>
  <line x1="238" y1="65" x2="238" y2="80" stroke="#b4232c" stroke-width="2"/>
  <line x1="322" y1="65" x2="322" y2="80" stroke="#b4232c" stroke-width="2"/>
  <text x="80" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="160" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">10 ms</text>
  <text x="240" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">20 ms</text>
  <text x="320" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">30 ms</text>
</svg>
```

The red ticks are drawn a few tenths of a millisecond early or late, exaggerated so you can see them.
:::

::: context fiu Breaking a wire with a relay
A fault insertion unit sits in the cable between the flight computer and the rig. Normally each signal passes straight through. On command, a relay on any chosen line can open it, to imitate a broken wire, or connect it to ground or to a supply rail, to imitate a short. Because it switches real wires, it tests what the software sees when the electronics fail, including the driver's error flags and the input's readings when a wire floats.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="35" width="90" height="40" fill="#f2b880" stroke="#1f2a44"/>
  <text x="55" y="59" font-size="11" fill="#1f2a44" text-anchor="middle">flight computer</text>
  <rect x="260" y="35" width="90" height="40" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="305" y="59" font-size="11" fill="#1f2a44" text-anchor="middle">HIL target</text>
  <line x1="100" y1="55" x2="160" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <line x1="160" y1="55" x2="195" y2="38" stroke="#b4232c" stroke-width="2"/>
  <line x1="200" y1="55" x2="260" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="160" cy="55" r="3" fill="#1f2a44"/>
  <circle cx="200" cy="55" r="3" fill="#1f2a44"/>
  <line x1="200" y1="55" x2="200" y2="95" stroke="#6c7a93" stroke-dasharray="3,3"/>
  <line x1="190" y1="95" x2="210" y2="95" stroke="#1f2a44" stroke-width="2"/>
  <line x1="194" y1="100" x2="206" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="25" font-size="11" fill="#b4232c" text-anchor="middle">relay open: broken wire</text>
  <text x="250" y="105" font-size="11" fill="#6c7a93">or: short to ground</text>
</svg>
```
:::

::: context flatsat A spacecraft laid out on a table
A flatsat is a spacecraft's electronics, flight or flight-like, spread out on a bench and connected with the same harness design as the vehicle, so engineers can reach every box and cable. Aircraft makers build the same idea at larger scale and call it an iron bird: the plane's hydraulic and electrical systems mounted on a steel frame in a hangar. Both are connected to real-time plant models, and both keep running long after first flight, because every software update is checked on them before it flies.
:::

::: context tlyf Test like you fly
"Test like you fly, fly like you test" is a saying in space programs: test the real software, on the real hardware, through the real sequence of events, rather than in convenient separate pieces. Boeing's first uncrewed Starliner flight in December 2019 is a much-cited lesson. Its mission clock was set from the launch vehicle at the wrong moment and ended up 11 hours off, so the capsule burned fuel at the wrong time and could not reach the space station. The review found that testing had been split into chunks and never ran the whole launch timeline end to end with the rocket's interface, which would have exposed the error.
:::
