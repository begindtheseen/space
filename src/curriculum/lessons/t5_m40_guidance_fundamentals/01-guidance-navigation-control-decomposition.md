---
id: l01-guidance-navigation-control-decomposition
title: The guidance, navigation and control split
minutes: 21
covers:
  - The guidance / navigation / control decomposition and the loop rate of each
---

Think about driving to a friend's house you have never visited. Three different things are going on in your head at once.

- **Where am I?** You glance at the map on your phone. You feel the car speeding up or slowing down. You notice the gas station you passed.
- **Where should I go?** "Turn left in 200 meters." You pick the next move from where you are and where the house is.
- **How do I make the car do it?** Your hands nudge the wheel and your foot eases the pedal, many small corrections every second.

Those three jobs run at very different speeds. Your hands correct the wheel several times a second. You only rethink the route every few seconds, or when you miss a turn. And you check "where am I" often enough to keep both of the others happy.

A spacecraft has exactly the same three jobs. A capsule closing on the Space Station answers all three every fraction of a second on its final approach. A lander dropping toward Mars answers them through a braking burn that lasts about a minute and a half. A rocket answers them from liftoff all the way to orbit. The three jobs have names: **navigation**, **guidance** and **control**. Engineers write them together as **GNC**.

This lesson does two things. First, it states exactly what each of the three does and what it hands to the next. Second, it works out *why* the three run at such different speeds, from the physics each one has to keep up with. That second part matters more than it looks. Some failures look like a bad guidance law — "the command was right, but it arrived too late" — when really the loop was running at the wrong speed. The rest of this module is about guidance laws. Getting the speeds right is what lets any of them fly.

## Three jobs, three questions

### Navigation: where am I, and how am I moving?

**Navigation** is the job of working out the vehicle's position, velocity and pointing from its sensors. Its input is raw sensor data. That means readings from the **[[IMU|imu]]** (an inertial measurement unit — a box of accelerometers that feel pushes and gyroscopes that feel turning), star tracker fixes, radar distances, GPS signals.

Its output is a **state estimate** — the computer's best guess of position, velocity and attitude (which way the vehicle points), usually with a measure of how uncertain that guess is. The navigation tier of this course built all the machinery for this: least squares, the Kalman filter, the extended and unscented filters, inertial navigation, GPS and optical navigation. None of that is repeated here. All guidance needs from navigation is its answer: a state estimate, arriving often enough and accurately enough to steer by.

### Guidance: where should I go, and what acceleration gets me there?

**Guidance** is the job of deciding what the vehicle should do next to reach its goal. Its input is the state estimate plus the mission's **terminal objective** — the condition it must meet at the end, such as "hit the target", "touch down at zero speed" or "reach this orbit".

Its output is a **commanded acceleration**: how hard, and in which direction, the vehicle should be pushed right now. (Equivalently, a direction to point and a thrust level.) Guidance is the subject of this whole module. Proportional navigation, zero-effort-miss guidance and the gravity turn are all answers to one question — "what acceleration do I command right now?" — for three different goals.

### Control: how do I make the hardware produce that acceleration?

**Control** is the job of turning the commanded acceleration into real hardware commands. Its input is the command from guidance plus the vehicle's own state. Its output goes to the **[[actuators|actuators]]** — the parts that physically move things: thruster valves, engine gimbals (the hinges that swivel an engine), throttle settings, reaction wheels.

Control has to make the real vehicle follow the command even though wind gusts push it, the model of the vehicle is not perfect, and the actuators have limits. The control tier of this course built this in full: classical loop shaping, state-space design, LQR, robust and nonlinear control, and MPC.

Here is the important part. Guidance produces a **reference** — a target value for control to follow. Guidance never touches an actuator itself.

### How the three connect

The three are layered in a strict order:

1. Navigation feeds both guidance and control.
2. Guidance feeds control.
3. Control never talks back up the chain. The only way it affects the others is by moving the vehicle, which the sensors then see.

This strict layering is what lets engineers design and test each job against a clean **interface** — an agreed list of what goes in and what comes out — instead of tackling the whole tangled problem at once. The **[[loop picture|gnc-loop]]** in the notes draws it.

::: key The G, N and C split
Navigation: where am I and how am I moving — a state estimate from sensor data. Guidance: where should I go and what acceleration gets me there — a commanded acceleration from the state estimate and the mission objective. Control: produce that acceleration with the actuators, rejecting disturbances and plant error. Typical rates: navigation 100–1000 Hz, control 50–500 Hz, guidance 0.5–10 Hz.
:::

(A **plant**, in control language, is the thing being controlled — here, the vehicle itself. "Plant error" means the vehicle does not behave exactly like its model.)

## How fast does each loop run?

Each of the three jobs is a **loop**: it reads, computes, sends out an answer, and starts again. The number of times a loop runs per second is its **loop rate**, measured in **[[hertz|hertz]]** (Hz). One hertz is once per second. A $50\,\mathrm{Hz}$ loop runs fifty times a second.

The time between runs is the **update period**, $\Delta t$ (read "delta t"). It is one over the rate:

$$
\Delta t = \frac{1}{f}.
$$

Here $f$ is the rate in hertz. So a $50\,\mathrm{Hz}$ loop has $\Delta t = 1/50 = 0.02\,\mathrm{s}$, which is $20$ milliseconds.

Why don't all three loops run as fast as the computer allows? Think of a waiter carrying a full tray across a busy restaurant. Her wrist makes tiny corrections all the time to keep the glasses from sliding. Her choice of path between the tables changes only every few steps. Each one keeps up with something different: the wrist keeps up with sloshing drinks, the path keeps up with the room. Each loop on a spacecraft is the same. Its speed is set by the piece of physics it has to keep up with.

### Control keeps up with the fastest parts

Control has to keep up with the vehicle's own quick motions and its actuators. How fast does a thruster valve open? How fast does an engine gimbal swing? How fast does a long, flexible rocket body wobble?

The number that describes this is **[[bandwidth|bandwidth]]**: roughly, the fastest wiggle, in hertz, that a part can follow or that the loop needs to shape. Actuators on real vehicles typically have bandwidths from a few hertz to a few tens of hertz.

A loop that checks in only a little faster than the thing it is steering barely steers it at all. It sees each wiggle too late. The classical-control and digital-control modules showed this with frequency response and **sampling** (reading a signal at separate instants). The working rule across real flight software is:

::: key Control-rate rule of thumb
Run the control loop about $10$ to $20$ times faster than the fastest actuator or structural bandwidth it has to handle: $f_{control} \approx 10f_a$ to $20f_a$.
:::

With actuator bandwidths of a few hertz to a few tens of hertz, that rule lands control loops in the tens to low hundreds of hertz.

### Navigation keeps up with its hungriest customer

Navigation has two pressures on it.

First, it has two customers: guidance and control. It has to deliver a fresh state estimate at least as often as the faster one asks. That is almost always control.

Second, its own arithmetic needs short steps. Between fixes from a star tracker or GPS, navigation works out where the vehicle is by adding up the IMU's small readings, step after step — a method called **[[dead reckoning|dead-reckoning]]**. Each step adds a little error. Shorter steps keep that error small while the vehicle spins and accelerates.

Both pressures push navigation toward the fast end. An IMU is typically read and integrated at or above the rate of the control loop it feeds. The slower correcting measurements — a star tracker fix, a GPS solution, a radar echo — may arrive only a few times a second, or less.

### Guidance keeps up with the geometry

Guidance has to keep up with something much slower: how fast the *best direction to push* is changing. That direction depends on the remaining **geometry** — how far there is still to go, how fast you are closing, and how much time is left. Geometry changes over the length of the approach or the landing, not over the few milliseconds a valve takes to open.

So a guidance law recomputed only now and then still commands nearly the right acceleration in between. That stays true as long as the gap between updates is short compared with how fast the geometry is changing.

That gap has to shrink as the time left shrinks. At the very end of a landing, the geometry changes fastest, so guidance sits at the high end of its band. During a slow cruise, it can sit at the low end. The quantity that measures "how much time is left" is called **[[time-to-go|time-to-go]]**, written $t_{go}$ ("t go"). A later lesson in this module is all about it.

### A drift budget for sizing the guidance rate

Here is a simple way to turn "keep up with the geometry" into a number. Suppose the vehicle is closing on its target at speed $V_c$ (read "V sub c", the **closing velocity**). Between two guidance updates, it moves a distance of about $V_c\,\Delta t$ without guidance having looked again. Decide how much drift you can live with — call it the **tolerance**. Then:

1. Require the drift in one period to stay under the tolerance: $V_c\,\Delta t \le \text{tolerance}$.
2. Divide both sides by $V_c$: $\Delta t \le \text{tolerance}/V_c$. That is the longest allowed update period.
3. Flip it, using $f = 1/\Delta t$. A longer period means a lower rate, so the inequality flips too:

$$
f_{\min} = \frac{V_c}{\text{tolerance}}.
$$

Check the units: meters per second divided by meters leaves "per second", which is hertz. Good.

::: example Sizing the guidance rate across a rendezvous
A chaser spacecraft is closing on a target for docking. Use this rule: never let the chaser drift more than $2\%$ of the remaining range $R$ between guidance updates. So the tolerance is $0.02R$, and $f_{\min} = V_c/(0.02R)$.

Three phases of the same approach:

| Phase | Closing velocity $V_c$ | Range $R$ | Tolerance ($2\%$ of $R$) | Longest period | Lowest rate |
| --- | --- | --- | --- | --- | --- |
| R-bar approach begins | $1.00\,\mathrm{m/s}$ | $1000\,\mathrm{m}$ | $20.0\,\mathrm{m}$ | $20.0\,\mathrm{s}$ | $0.050\,\mathrm{Hz}$ |
| Close-range approach | $0.10\,\mathrm{m/s}$ | $30\,\mathrm{m}$ | $0.60\,\mathrm{m}$ | $6.0\,\mathrm{s}$ | $0.167\,\mathrm{Hz}$ |
| Final approach to contact | $0.03\,\mathrm{m/s}$ | $1\,\mathrm{m}$ | $0.020\,\mathrm{m}$ | $0.667\,\mathrm{s}$ | $1.5\,\mathrm{Hz}$ |

Take the first row step by step. The tolerance is $0.02 \times 1000 = 20\,\mathrm{m}$. The longest period is $20 / 1.00 = 20\,\mathrm{s}$. The lowest rate is $1/20 = 0.05\,\mathrm{Hz}$. The other rows work the same way. (The **[[R-bar|r-bar]]** is a standard approach line, explained in the notes.)

The same arithmetic in Python:

```python
phases = [
    ("R-bar approach begins", 1.00, 1000.0),
    ("Close-range approach", 0.10, 30.0),
    ("Final approach to contact", 0.03, 1.0),
]
for name, Vc, R in phases:
    tol = 0.02 * R
    print(name, "rate_min =", round(Vc / tol, 3), "Hz")
# R-bar approach begins rate_min = 0.05 Hz
# Close-range approach rate_min = 0.167 Hz
# Final approach to contact rate_min = 1.5 Hz
```

**What it means.** The first two phases ask for less than the bottom of the usual $0.5$–$10\,\mathrm{Hz}$ guidance band, so any normal guidance loop covers them easily. The final approach asks for $1.5\,\mathrm{Hz}$, inside the band. The trend is the point: from the start of the approach to contact, the required rate climbs by a factor of $1.5/0.05 = 30$. A guidance rate that was generous a few minutes earlier is not automatically enough at contact.
:::

::: example A Mars landing timing budget
A lander's powered-descent burn lasts $t_{burn} = 75\,\mathrm{s}$. Guidance runs at $f_g = 5\,\mathrm{Hz}$, so its update period is $\Delta t = 1/5 = 0.2\,\mathrm{s}$.

**How many guidance cycles in the whole burn?** Divide the burn time by the period:

$$
n = \frac{t_{burn}}{\Delta t} = \frac{75}{0.2} = 375.
$$

That is plenty for a burn whose geometry changes over seconds, not tenths of a second.

**Is it enough at the very end?** Look only at the last $t_{go} = 5\,\mathrm{s}$ before touchdown. This is where the landing law of a later lesson changes its commands fastest. Say we want at least $15$ updates in that window. The rate needed is updates divided by time:

$$
f_{g,terminal} \ge \frac{15}{5} = 3\,\mathrm{Hz}.
$$

The $5\,\mathrm{Hz}$ already budgeted covers it. It is not lavish at the end, but it is enough — so this lander does not need to switch guidance rates near the ground.

**Now size control from the other end.** Say the throttle and engine-gimbal actuators have a bandwidth of $f_a = 5\,\mathrm{Hz}$. The ten-to-twenty-times rule gives

$$
10 f_a = 50\,\mathrm{Hz} \quad\text{to}\quad 20 f_a = 100\,\mathrm{Hz},
$$

right inside the $50$–$500\,\mathrm{Hz}$ control band.

Three numbers, three pieces of physics: the burn length, the final closing window, and the actuator bandwidth. All three land inside the bands in the key block. That is no accident. The bands are what this kind of arithmetic gives for real vehicles.
:::

::: warning Faster is not free, and it is not always better
Running control faster than the actuator can respond buys nothing. A valve that takes $50\,\mathrm{ms}$ to open does not open any faster because the loop commanding it runs at $10\,\mathrm{kHz}$ instead of $1\,\mathrm{kHz}$. The extra runs only eat flight-computer time that guidance or navigation could have used. They can also pass along more sensor noise, which a slower, better-filtered loop would have smoothed out.

And guidance is not "control, but slower". Running guidance at a control-loop rate does not make it more accurate. The thing guidance tracks — the remaining geometry — has barely changed from one run to the next, so the extra runs recompute the same command from nearly the same state. Budget each loop for the physics it actually keeps up with.
:::

::: note The layering is how the software is really built
Guidance's commanded acceleration is control's reference. Control also needs its own fast, fresh state estimate to fight disturbances, so navigation usually feeds both loops directly. Guidance does not pass a stale copy down.

On real flight software this is literal. There are three **[[tasks at three rates|rate-groups]]** on the same computer. Guidance writes its latest command into a memory slot. Control reads that slot at the start of each of its own, faster cycles. So control always acts on the newest guidance command available and never waits for guidance to finish. Understanding the rate split is understanding that design, not only a diagram of it.
:::

## Check yourself

::: check
Say what navigation, guidance and control each do, in one sentence each, and give the typical rate band for each.
:::

::: answer
Navigation works out where the vehicle is and how it is moving, from sensor data — typically $100$–$1000\,\mathrm{Hz}$. Guidance decides where to go and what acceleration gets there, from the state estimate and the mission objective — typically $0.5$–$10\,\mathrm{Hz}$. Control makes the actuators produce that acceleration while fighting disturbances and model error — typically $50$–$500\,\mathrm{Hz}$.
:::

::: check
Guidance is the loop that decides where the vehicle goes. So why does control have to run so much faster than guidance?
:::

::: answer
Because the two loops keep up with different things. Control has to handle motions set by the actuators and the vehicle's structure — a thruster's response time, a gimbal's swing speed, a flexible body's wobble. Those live at a few hertz to a few tens of hertz, and a sampled loop needs to run roughly ten to twenty times faster than the fastest of them to control it well.

Guidance only has to keep up with how fast the remaining geometry (range, closing velocity, time-to-go) changes. For all but the last moments of an approach, that is far slower. "Decides where to go" does not mean "must react fastest". Reacting fastest is control's job, because the actuators are the fastest-moving parts in the chain.
:::

::: check
A chaser's final approach closes at $V_c = 0.08\,\mathrm{m/s}$, and it must not drift more than $4\,\mathrm{cm}$ between guidance updates. What is the lowest guidance rate that works? Is it inside the guidance band from this lesson?
:::

::: answer
First change $4\,\mathrm{cm}$ to $0.04\,\mathrm{m}$. The longest allowed period is tolerance over closing speed: $\Delta t_{\max} = 0.04 / 0.08 = 0.5\,\mathrm{s}$. The lowest rate is one over that: $1/0.5 = 2\,\mathrm{Hz}$.

That sits comfortably inside the $0.5$–$10\,\mathrm{Hz}$ guidance band. It is a fast final approach, but not an unusually demanding one.
:::

::: check
Navigation's IMU processing usually runs at or above the control rate, not at the slower guidance rate. Why?
:::

::: answer
Two reasons.

First, navigation has two customers and must keep the faster one fed. Control uses the state estimate at the control rate, so navigation must deliver a fresh one at least that often.

Second, the dead-reckoning arithmetic itself — adding up accelerometer and gyro readings into velocity, position and attitude — picks up a little error every step. Short steps keep that error small in the gaps between the slower correcting fixes from a star tracker or GPS. (The inertial navigation module works this out in detail.)

Guidance's slower appetite never gets to set the rate. The simplest design runs the IMU processing once, at the fastest rate anything needs, and lets slower users like guidance read the latest result whenever they run.
:::

::: check
An engine-gimbal actuator has a bandwidth of $8\,\mathrm{Hz}$. Using the ten-to-twenty-times rule, what control rate would you budget? Is it inside the $50$–$500\,\mathrm{Hz}$ band?
:::

::: answer
Multiply the bandwidth by $10$ and by $20$: $10 \times 8 = 80\,\mathrm{Hz}$ and $20 \times 8 = 160\,\mathrm{Hz}$. So budget a control loop somewhere from $80$ to $160\,\mathrm{Hz}$.

That is well inside the $50$–$500\,\mathrm{Hz}$ band. This is an ordinary actuator — neither unusually stiff nor unusually sluggish — and the rule puts it in the middle of the range real flight software uses.
:::

## Summary

| Idea | Meaning | Fact or formula |
| --- | --- | --- |
| Navigation | Where am I and how am I moving | A state estimate from sensor data; $100$–$1000\,\mathrm{Hz}$ |
| Guidance | Where should I go and what acceleration gets me there | A commanded acceleration; $0.5$–$10\,\mathrm{Hz}$ |
| Control | Make the actuators produce that acceleration | Rejects disturbances and plant error; $50$–$500\,\mathrm{Hz}$ |
| Update period | Time between runs of a loop | $\Delta t = 1/f$ |
| Navigation rate | Set by its faster customer and by dead-reckoning accuracy | At or above the control rate |
| Control rate | Set by a margin over actuator and structural bandwidth | $10$–$20$ times the fastest bandwidth |
| Guidance rate | Set by how fast the remaining geometry ($R$, $V_c$, $t_{go}$) changes | Drift budget: $f_{\min} = V_c/\text{tolerance}$ |

These three loops, and the reasons their speeds differ, are the frame the rest of the module sits inside. The next lesson asks a different question about guidance: does it recompute its command from the current state every cycle, or does it follow a path it planned in advance?

::: context imu The box that feels motion
An **inertial measurement unit** holds three accelerometers and three gyroscopes, one of each along three perpendicular directions. The accelerometers sense pushes (from the engine, from drag). The gyroscopes sense how fast the vehicle is turning.

Nothing outside the vehicle is needed: no radio signal, no view of the stars. That is why every rocket and spacecraft carries one. The catch is that it only measures *changes*, so the computer has to add those changes up over time to get position and attitude — and small errors add up too.
:::

::: context actuators The muscles of a spacecraft
An actuator is anything the computer can command that physically moves the vehicle. On a rocket, the main one is the **engine gimbal**: hydraulic or electric pistons tilt the whole engine a few degrees, so its thrust pushes a little sideways and turns the rocket. Spacecraft use small **thrusters** that fire in short pulses, and **reaction wheels** — heavy spinning wheels that turn the spacecraft the other way when they speed up or slow down.

Every actuator has a limit on how hard and how fast it can act. Those limits are exactly what set the control loop's speed.
:::

::: context gnc-loop One loop, three layers
The arrows show who hands what to whom. Navigation turns sensor readings into a state estimate. Guidance combines that with the mission goal to pick an acceleration. Control turns the acceleration into actuator commands. The vehicle moves, the sensors feel it, and the loop closes. Notice that navigation feeds control directly too.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <text x="185" y="12" font-size="11" fill="#6c7a93" text-anchor="middle">mission goal</text>
  <line x1="185" y1="16" x2="185" y2="34" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
  <rect x="12" y="36" width="104" height="40" rx="6" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="64" y="53" font-size="12" fill="#1f2a44" text-anchor="middle">Navigation</text>
  <text x="64" y="68" font-size="11" fill="#1f2a44" text-anchor="middle">100–1000 Hz</text>
  <rect x="136" y="36" width="98" height="40" rx="6" fill="#f2b880" stroke="#1f2a44"/>
  <text x="185" y="53" font-size="12" fill="#1f2a44" text-anchor="middle">Guidance</text>
  <text x="185" y="68" font-size="11" fill="#1f2a44" text-anchor="middle">0.5–10 Hz</text>
  <rect x="254" y="36" width="94" height="40" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="301" y="53" font-size="12" fill="#1f2a44" text-anchor="middle">Control</text>
  <text x="301" y="68" font-size="11" fill="#1f2a44" text-anchor="middle">50–500 Hz</text>
  <line x1="116" y1="56" x2="134" y2="56" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
  <line x1="234" y1="56" x2="252" y2="56" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
  <polyline points="90,76 90,90 280,90 280,78" fill="none" stroke="#1d6fd1" stroke-width="1.5" marker-end="url(#ah)"/>
  <text x="185" y="86" font-size="11" fill="#1d6fd1" text-anchor="middle">state estimate</text>
  <line x1="325" y1="76" x2="325" y2="116" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
  <rect x="206" y="118" width="142" height="36" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="277" y="140" font-size="12" fill="#1f2a44" text-anchor="middle">Actuators, vehicle</text>
  <line x1="206" y1="136" x2="152" y2="136" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
  <text x="179" y="130" font-size="11" fill="#6c7a93" text-anchor="middle">motion</text>
  <rect x="12" y="118" width="138" height="36" rx="6" fill="#ffffff" stroke="#1f2a44"/>
  <text x="81" y="140" font-size="12" fill="#1f2a44" text-anchor="middle">Sensors</text>
  <line x1="40" y1="118" x2="40" y2="78" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#ah)"/>
</svg>
```
:::

::: context hertz Named after a radio pioneer
The hertz is named for Heinrich Hertz, the German physicist who first made and detected radio waves in the 1880s. One hertz means one event per second. A kilohertz (kHz) is a thousand per second.

The picture shows half a second on each of three clocks, using one typical rate from each band: navigation at $100\,\mathrm{Hz}$ ticks $50$ times, control at $50\,\mathrm{Hz}$ ticks $25$ times, and guidance at $5\,\mathrm{Hz}$ ticks only at $0$, $200$ and $400\,\mathrm{ms}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <text x="8" y="44" font-size="11" fill="#1f2a44">Navigation</text>
  <text x="8" y="57" font-size="11" fill="#6c7a93">100 Hz</text>
  <line x1="90" y1="40" x2="340" y2="40" stroke="#6c7a93" stroke-width="1"/>
  <path d="M90.0 34V46 M95.0 34V46 M100.0 34V46 M105.0 34V46 M110.0 34V46 M115.0 34V46 M120.0 34V46 M125.0 34V46 M130.0 34V46 M135.0 34V46 M140.0 34V46 M145.0 34V46 M150.0 34V46 M155.0 34V46 M160.0 34V46 M165.0 34V46 M170.0 34V46 M175.0 34V46 M180.0 34V46 M185.0 34V46 M190.0 34V46 M195.0 34V46 M200.0 34V46 M205.0 34V46 M210.0 34V46 M215.0 34V46 M220.0 34V46 M225.0 34V46 M230.0 34V46 M235.0 34V46 M240.0 34V46 M245.0 34V46 M250.0 34V46 M255.0 34V46 M260.0 34V46 M265.0 34V46 M270.0 34V46 M275.0 34V46 M280.0 34V46 M285.0 34V46 M290.0 34V46 M295.0 34V46 M300.0 34V46 M305.0 34V46 M310.0 34V46 M315.0 34V46 M320.0 34V46 M325.0 34V46 M330.0 34V46 M335.0 34V46" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="8" y="84" font-size="11" fill="#1f2a44">Control</text>
  <text x="8" y="97" font-size="11" fill="#6c7a93">50 Hz</text>
  <line x1="90" y1="80" x2="340" y2="80" stroke="#6c7a93" stroke-width="1"/>
  <path d="M90.0 72V88 M100.0 72V88 M110.0 72V88 M120.0 72V88 M130.0 72V88 M140.0 72V88 M150.0 72V88 M160.0 72V88 M170.0 72V88 M180.0 72V88 M190.0 72V88 M200.0 72V88 M210.0 72V88 M220.0 72V88 M230.0 72V88 M240.0 72V88 M250.0 72V88 M260.0 72V88 M270.0 72V88 M280.0 72V88 M290.0 72V88 M300.0 72V88 M310.0 72V88 M320.0 72V88 M330.0 72V88" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="8" y="124" font-size="11" fill="#1f2a44">Guidance</text>
  <text x="8" y="137" font-size="11" fill="#6c7a93">5 Hz</text>
  <line x1="90" y1="120" x2="340" y2="120" stroke="#6c7a93" stroke-width="1"/>
  <path d="M90.0 108V132 M190.0 108V132 M290.0 108V132" stroke="#b4232c" stroke-width="2"/>
  <line x1="90" y1="148" x2="340" y2="148" stroke="#1f2a44" stroke-width="1"/>
  <path d="M90 145V151 M140 145V151 M190 145V151 M240 145V151 M290 145V151 M340 145V151" stroke="#1f2a44"/>
  <text x="90" y="164" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="140" y="164" font-size="11" fill="#1f2a44" text-anchor="middle">100</text>
  <text x="190" y="164" font-size="11" fill="#1f2a44" text-anchor="middle">200</text>
  <text x="240" y="164" font-size="11" fill="#1f2a44" text-anchor="middle">300</text>
  <text x="290" y="164" font-size="11" fill="#1f2a44" text-anchor="middle">400</text>
  <text x="330" y="164" font-size="11" fill="#1f2a44" text-anchor="middle">500</text>
  <text x="8" y="164" font-size="11" fill="#1f2a44">time, ms</text>
</svg>
```
:::

::: context bandwidth How fast a thing can follow
Imagine wiggling one end of a long garden hose. Wiggle slowly and the far end follows. Wiggle faster and faster, and at some point the far end barely moves. Roughly, the fastest wiggle a system still follows well is its **bandwidth**, measured in hertz.

An engine gimbal might follow commands up to a few hertz. A rocket's body also bends like a hose, at its own natural wobble frequencies. The control loop has to see and handle all of these, which is why it runs ten to twenty times faster than the fastest one.
:::

::: context dead-reckoning Steering by adding up
Before satellites, ship navigators found their position by **dead reckoning**: start from a known point, then add up speed times time along each heading. An IMU does the same thing thousands of times faster, adding up tiny changes in velocity and angle.

The weakness is the same too. Every small error is added in and never taken out, so the estimate slowly drifts. Short steps keep each step's error small, and outside fixes — a star sighting for a ship, a GPS fix or star tracker for a spacecraft — reset the drift.
:::

::: context time-to-go The clock that runs down
Time-to-go, $t_{go}$, is the time left until the event guidance is aiming for: the intercept, the touchdown, the engine cutoff. It shrinks toward zero as the vehicle gets there.

It comes back many times in this module. Most guidance laws you will meet have gains that grow like $1/t_{go}$ or $1/t_{go}^2$, so they push harder and harder as the end nears. That is one reason guidance must update more often near the end, and why getting $t_{go}$ right gets a whole lesson later in the module.
:::

::: context r-bar The two standard ways in
When a spacecraft approaches the Space Station, it usually comes in along one of two straight lines through the station. The **V-bar** points along the station's direction of travel. The **R-bar** points along the line toward Earth's center. Coming up the R-bar from below is popular because orbital physics tends to slow the approach, which makes it naturally safer.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="rb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="#1f2a44"/>
    </marker>
  </defs>
  <path d="M20 196 Q180 150 340 196" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="180" y="190" font-size="11" fill="#1f2a44" text-anchor="middle">Earth</text>
  <line x1="40" y1="60" x2="330" y2="60" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="6 4" marker-end="url(#rb)"/>
  <text x="292" y="50" font-size="11" fill="#1f2a44" text-anchor="middle">V-bar</text>
  <text x="292" y="78" font-size="11" fill="#6c7a93" text-anchor="middle">direction of travel</text>
  <line x1="180" y1="60" x2="180" y2="165" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="192" y="128" font-size="11" fill="#b4232c">R-bar</text>
  <text x="192" y="142" font-size="11" fill="#6c7a93">toward Earth's center</text>
  <rect x="168" y="50" width="24" height="20" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="40" font-size="11" fill="#1f2a44" text-anchor="middle">station</text>
  <polygon points="180,104 173,116 187,116" fill="#f2b880" stroke="#1f2a44"/>
  <line x1="172" y1="108" x2="172" y2="84" stroke="#1f2a44" stroke-width="1.2" marker-end="url(#rb)"/>
  <text x="112" y="114" font-size="11" fill="#1f2a44" text-anchor="middle">chaser</text>
</svg>
```
:::

::: context rate-groups How flight software keeps three clocks
Flight software is usually organized into **rate groups**: bundles of tasks that run on a fixed schedule, such as a fast group every few milliseconds and a slow group every half second. A real-time operating system makes sure the fast group always runs on time, even if a slow group's calculation is still in the middle of its work.

That is how one computer can run control at $100\,\mathrm{Hz}$ and guidance at $2\,\mathrm{Hz}$ side by side without either one waiting on the other.
:::
