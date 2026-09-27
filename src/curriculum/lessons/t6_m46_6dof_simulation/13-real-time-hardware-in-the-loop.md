---
id: l13-real-time-hardware-in-the-loop
title: Real-time hardware-in-the-loop
minutes: 20
covers:
  - "Real-time hardware-in-the-loop: flight processors, motion tables, IMU stimulation, GNSS signal simulators, camera and altimeter stimulation"
---

Picture an airline pilot training in a **[[full-motion flight simulator|flight-simulator]]**. The cockpit is real: real seats, real switches, real control yoke. The windows are screens showing a computer-drawn runway. The whole cabin sits on big hydraulic legs that tilt and shake it. When the pilot pulls back, the picture in the windows has to tilt, the seat has to press into her back, and the engine noise has to change — all at once, right now. If the picture lags half a second behind the yoke, the training is worse than useless. And nobody in that box can press pause.

A **hardware-in-the-loop** bench (HIL) is that flight simulator, built for a flight computer instead of a pilot. The previous lesson showed what HIL adds in principle: real hardware, real electrical interfaces, and a real clock that nothing in the simulation controls. This lesson is about the equipment it takes, and about one fact that is easy to miss. Making the *flight computer's* clock real is not enough. Every other box on the bench — the computer working out where the vehicle "really" is, the table swinging the IMU around, the box making fake GPS signals — now lives on the same real clock. Every one of them has to keep up, not only the unit under test.

On a real program, this is the last big test stage before flight: the flight computer, often with its real sensors attached, sitting in a lab and flying the whole mission against a world that the bench builds around it, live.

## The simulation host has to keep up too

In SIL and PIL (software-in-the-loop and processor-in-the-loop, from the previous lesson), the simulated clock only moves forward once each computation is finished, however long that took. The timeline waits for the slowest part, every time. There is nothing to fall behind.

On a HIL bench, that is no longer true. The **truth host** — the computer running the plant, environment, sensor and actuator models this whole module has built — must hand the flight computer a fresh truth state at the real rate, every cycle, with no exceptions. A job that must finish before a fixed moment, every time, is called **[[hard real-time|hard-real-time]]**. The time allowed for one cycle is the **budget**; the moment the cycle must be done by is the **deadline**.

If the truth host is too slow, *it* becomes the thing missing deadlines. Everything downstream then gets a damaged timeline, exactly the way the previous lesson's cycle overruns damaged the flight computer's. So the first question for any HIL bench is: how much of its budget does the physics itself eat?

::: example How much of a real-time budget the physics itself costs
Bundle one fine-step evaluation of this module's own models together — rigid-body dynamics, a coupled structural mode, $J_2$ gravity, an IMU sensor model, an actuator saturation model — the way a real-time truth host would call them every step. Time $100{,}000$ calls and divide.

```python
import time
import numpy as np

I3 = np.array([1200.0, 1500.0, 2000.0])
def euler_deriv(w, M):
    return np.array([((I3[1]-I3[2])*w[1]*w[2]+M[0])/I3[0], ((I3[2]-I3[0])*w[2]*w[0]+M[1])/I3[1],
                      ((I3[0]-I3[1])*w[0]*w[1]+M[2])/I3[2]])
w = np.array([0.02, 0.0, 0.10])

I_hub, sigma, wn, zeta = 105450.1, 0.04, 2*np.pi*6.0, 0.005
delta = np.sqrt(sigma*I_hub)
Ainv = np.linalg.inv(np.array([[I_hub, delta], [delta, 1.0]]))
def flex_deriv(state, M):
    theta, thetadot, eta, etadot = state
    Q = 2*zeta*wn*etadot + wn**2*eta
    return Ainv @ np.array([M, -Q])
state = np.array([0.01, 0.0, 0.001, 0.0])

mu, RE, J2 = 398600.4418, 6378.137, 1.08262668e-3
r_I = np.array([6878.137*np.cos(0.7), 0.0, 6878.137*np.sin(0.7)])
def gravity_j2(r):
    r_mag = np.linalg.norm(r)
    a_pm = -mu*r/r_mag**3
    factor = -1.5*J2*mu*RE**2/r_mag**5
    zr2 = (r[2]/r_mag)**2
    return a_pm + factor*np.array([r[0]*(1-5*zr2), r[1]*(1-5*zr2), r[2]*(3-5*zr2)])

sf, bias, quantum = np.array([0.005]*3), np.array([3e-5,-2e-5,1e-5]), 1e-5
def sense(a_true):
    return np.round(((1+sf)*a_true + bias)/quantum)*quantum
a_true = np.array([0.1, -0.2, 9.81])

tau_max = 0.2
def actuator(u_cmd):
    return np.clip(u_cmd, -tau_max, tau_max)
u_cmd = np.array([0.3, -0.1, 0.05])

def full_step():
    _ = euler_deriv(w, np.zeros(3))
    _ = flex_deriv(state, 0.0)
    _ = gravity_j2(r_I)
    _ = sense(a_true)
    _ = actuator(u_cmd)

n_trials = 100000
t0 = time.perf_counter()
for _ in range(n_trials):
    full_step()
t1 = time.perf_counter()
per_call_us = (t1 - t0)/n_trials*1e6
print("bundled per-step model evaluation:", per_call_us, "us")
for budget_us in [1000, 200, 100, 50]:
    print(f"  budget {budget_us} us -> fraction used: {per_call_us/budget_us:.1%}")
# bundled per-step model evaluation: 14.607339690010122 us
# budget 1000 us -> fraction used: 1.5%
# budget 200 us -> fraction used: 7.3%
# budget 100 us -> fraction used: 14.6%
# budget 50 us -> fraction used: 29.2%
```

Read the output line by line. One bundled step took about $14.6\,\mathrm{\mu s}$ (read "$\mu$s" as "microseconds", millionths of a second). A $1\,\mathrm{ms}$ budget, for a $1\,\mathrm{kHz}$ step, is $1000\,\mathrm{\mu s}$, so the physics uses $14.6 / 1000 = 1.5\%$ of it. A demanding $50\,\mathrm{\mu s}$ budget — a $20\,\mathrm{kHz}$ step, fine enough to follow vibrations up into the low kilohertz — is still only $14.6 / 50 = 29\%$ used.

Timing measurements like this change from run to run and machine to machine. Run it yourself and expect a different number — a rerun while checking this lesson gave about $17.6\,\mathrm{\mu s}$ — but the same overall picture.

**Sanity check.** $14.6\,\mathrm{\mu s}$ for five small models, each a few dozen arithmetic operations wrapped in Python calls, is in line with Python's overhead of roughly a microsecond per call. Nothing surprising.

That comfort belongs to these particular models, which are cheap closed-form formulas. It is not permission to run a truth host in Python. A real HIL host must also command a motion table, drive a radio signal generator, update a projected star field and log every channel — all inside the same cycle. That is why production truth hosts run **[[compiled|compiled-code]]**, carefully budgeted code. Not because this lesson's physics is expensive, but because everything *else* the cycle must do is competing for the same real microseconds, and nothing on the bench can ask the clock to wait.
:::

## Motion tables: real motion, with limits of their own

A **motion table** (also called a rate table) is a motorized turntable, often with two or three nested rings, that physically rotates a real IMU — or the whole flight computer and IMU package together. The sensor's real **[[proof mass|proof-mass]]**, its bearings and its electronics all feel genuine rotation.

That catches things no injected electrical signal can: cross-axis coupling in the real mechanical structure, heating effects under real spinning, and mounting defects. An electrical signal cannot find those, because nothing electrical moves the physical sensing element.

But a table is itself a big, heavy actuator, with its own rate limit and its own **[[bandwidth|bandwidth]]** — the highest frequency of back-and-forth motion it can follow faithfully. Typical tables manage rates of tens to a few hundred degrees per second. Their usable bandwidth, once they carry a realistic payload, is often only a handful of hertz, and a few tens of hertz for the smallest, lightest setups. The same rotational inertia that lets a table carry real hardware through big, accurate swings makes it sluggish when asked to shake fast. Think of a playground merry-go-round loaded with kids: you can spin it steadily, but you cannot make it jitter back and forth ten times a second.

This is a real physical limit on what a table can honestly test. A structural bending mode near the $6\,\mathrm{Hz}$ used in this module's slosh-and-flex lesson is already at or past many loaded tables' comfortable range. An IMU sampling hundreds of times a second can see vibration far above anything a loaded table can make. The honest conclusion is not that tables are inadequate. It is that a table does a different job from electronic IMU stimulation, described next, and a HIL campaign needs both.

## IMU stimulation, and what it cannot do

**Electronic IMU stimulation** skips the proof mass. It injects a signal straight into the sensor's interface electronics, pretending "the gyro just measured this". Because nothing heavy has to move, it can reproduce any rate and any frequency the electronics accept — everything above a table's bandwidth, including the structural and slosh wiggles this module modeled in detail.

What it cannot do is exercise the physical sensing element. A mounting misalignment, a real mechanical cross-coupling, a drift that only appears while genuinely spinning: all of these happen *before* the point where the fake signal enters, so the fake signal never shows them.

So the two are partners, not rivals. The table covers low frequencies and the real sensing element. Electronic stimulation covers high frequencies and the electronics downstream. Different frequency ranges, different kinds of defect, and neither is a complete substitute for the other.

## GNSS signal simulators: timing up to a million times tighter

A **GNSS signal simulator** is a radio box that makes fake satellite-navigation signals (GNSS covers GPS, Galileo and the rest). It generates realistic **[[radio-frequency|rf-signal]]** signals, with the right frequency shift from motion, the right timing pattern, the right strength, and sometimes realistic reflections. These go into the real receiver's antenna port. So the receiver's real acquisition and tracking hardware and firmware get exercised, not only its data output.

What makes this stimulation so demanding is that **GNSS ranging is a timing measurement.** The receiver works out its distance to each satellite from how long the signal took to arrive. So any timing error between the truth trajectory and the signal the simulator produces turns into a distance error at the **[[speed of light|light-nanosecond]]**, $c = 299{,}792{,}458\,\mathrm{m/s}$:

$$
\Delta t = \frac{\Delta r}{c}.
$$

Read it as "the timing error allowed, delta t, equals the distance error allowed, delta r, divided by c".

::: example What GNSS stimulation timing requires
Turn four ranging-accuracy targets into timing targets with $\Delta t = \Delta r / c$:

```python
c = 299792458.0
for acc_m in [10.0, 3.0, 1.0, 0.3]:
    dt = acc_m / c
    print(f"ranging accuracy {acc_m:5.1f} m  ->  required timing sync < {dt*1e9:.3f} ns")
# ranging accuracy  10.0 m  ->  required timing sync < 33.356 ns
# ranging accuracy   3.0 m  ->  required timing sync < 10.007 ns
# ranging accuracy   1.0 m  ->  required timing sync < 3.336 ns
# ranging accuracy   0.3 m  ->  required timing sync < 1.001 ns
```

Take the first line by hand: $10 / 299{,}792{,}458 = 3.34\times10^{-8}\,\mathrm{s}$, which is $33.4\,\mathrm{ns}$ (nanoseconds, billionths of a second). A modest $10\,\mathrm{m}$ target needs the simulator's signal timing locked to the truth trajectory within $33.4\,\mathrm{ns}$. A demanding $1\,\mathrm{m}$ target needs $3.3\,\mathrm{ns}$.

**Sanity check.** Light covers about $30\,\mathrm{cm}$ in one nanosecond, so $1\,\mathrm{m}$ should take a bit over $3\,\mathrm{ns}$. It does.

Now compare. Every other real-time number in this module was in milliseconds or microseconds: a control tick, a sensor sample, an actuator response. A millisecond is a million nanoseconds; even a $10\,\mathrm{\mu s}$ budget is about $300$ times looser than $33\,\mathrm{ns}$. So GNSS stimulation needs timing hundreds to a million times tighter than anything else on the bench. The quantity being faked is a light-travel time, not a mechanical motion. That is why GNSS simulators are specialized radio hardware with their own precision time references, not a channel handled by the same general-purpose truth host.
:::

## Camera and altimeter stimulation

Optical sensors — a **[[star tracker|star-tracker]]**, or a camera used for navigating by the ground below — are stimulated by showing them a synthetic scene. A screen or projector in front of the real optics displays what they would see, drawn from the truth attitude and position at the rate the sensor actually samples.

A radar or laser **altimeter** measures height by timing an echo. It is stimulated by generating a return signal with the right delay for the truth altitude. That is the same kind of timing problem as GNSS, with one twist: the signal goes down *and* back, so the **[[round trip|round-trip]]** doubles the time,

$$
\Delta t = \frac{2\,\Delta r}{c}.
$$

A $1\,\mathrm{m}$ height error is therefore $2 \times 1 / c = 6.67\,\mathrm{ns}$ of echo timing, and a $10\,\mathrm{m}$ error is $66.7\,\mathrm{ns}$. How tight the stimulator must be depends on the accuracy the altimeter is meant to deliver. Altimeter accuracy is usually specified in meters, or as a percentage of height, rather than the sub-meter figures a precision GNSS receiver is built for. So the altimeter's timing tolerance is usually looser than GNSS — tens of nanoseconds rather than a few — but it is still nanoseconds, it tightens near touchdown, and it must be checked rather than assumed.

Both kinds of stimulator also meet the two-rate lesson's old constraint in a new costume. The display or signal generator has its own update rate and its own **latency** (delay between being told something and showing it). That is one more clock in the loop, and the truth host must stay in step with it. Otherwise the sensor is shown a scene, or given an echo, that describes where the vehicle *was*, not where it is.

::: key What each piece of HIL equipment tests, and what limits it
- **Real-time truth host:** everything downstream depends on its cycle never being late.
- **Motion table:** genuine physical inertial motion, limited by its own rate and bandwidth to the low end of a vehicle's dynamic content.
- **Electronic IMU stimulation:** high-frequency content beyond a table's bandwidth, at the cost of never exercising the physical sensing element.
- **GNSS signal simulator:** synchronized to the truth trajectory at the nanosecond scale, $\Delta t = \Delta r / c$, far tighter than any other timing requirement in this module.
- **Camera and altimeter stimulation:** each with its own update rate and latency, budgeted like every other clock in this module; an altimeter echo carries $\Delta t = 2\Delta r / c$.
:::

::: warning Assuming a motion table alone validates an IMU
A table shows the sensor responds correctly to real, physical, low-frequency motion. That result is valuable and cannot be had any other way. But it says nothing about the sensor at the vibration frequencies a real vehicle's bending modes and engines produce, which are routinely above what any loaded table can reproduce. A campaign that runs only table tests and calls the IMU "validated" has validated it over a frequency range the vehicle will not stay inside.
:::

::: warning Budgeting GNSS timing like every other channel
Every other timing budget in this module was comfortable in milliseconds, or tens of microseconds at the tightest. Carry that instinct over to a GNSS signal simulator and you are off by a factor of hundreds to a million. "Synchronized to the truth model" is not a specification. Write down the nanosecond figure and check the bench meets it; otherwise you have not checked whether the stimulation is realistic at all.
:::

## Check yourself

::: check
Why does a HIL truth host have to be real-time in a way that a SIL or PIL simulation host does not?
:::

::: answer
In SIL and PIL, the simulated clock advances only once the current computation has finished. The timeline waits for the host every time, so there is nothing to fall behind. On a HIL bench, every piece of equipment shares one real clock that cannot be paused. If the truth host cannot produce a fresh state every cycle at the real rate, *it* misses deadlines. That damages the timeline for the flight computer and every stimulator downstream, in exactly the way a cycle overrun damages the flight computer's own timeline.
:::

::: check
A motion table has about $5\,\mathrm{Hz}$ of usable bandwidth carrying a realistic payload. Explain why this is not a defect in the table, and what it means for testing a vehicle with a $6\,\mathrm{Hz}$ structural mode.
:::

::: answer
The bandwidth is limited by the same rotational inertia that lets the table carry real hardware through large, accurate swings. That is a genuine mechanical trade-off between carrying capacity and fast response, not an engineering oversight. A $6\,\mathrm{Hz}$ mode sits above a $5\,\mathrm{Hz}$ table's usable range, so the table alone cannot be trusted to reproduce that mode realistically. Electronic IMU stimulation, which has no such mechanical limit, is needed to cover that frequency content.
:::

::: check
Why does GNSS signal simulation need nanosecond-scale timing when every other real-time requirement in this module was in the millisecond-to-microsecond range? Give the timing needed for $3\,\mathrm{m}$ ranging accuracy.
:::

::: answer
GNSS ranging measures the travel time of a radio signal, so a timing error between the truth trajectory and the generated signal becomes a ranging error through $\Delta r = c\,\Delta t$. Because $c$ is so large, a tiny timing error is a large distance error. For $3\,\mathrm{m}$: $\Delta t = 3 / 299{,}792{,}458 = 1.00\times10^{-8}\,\mathrm{s}$, about $10\,\mathrm{ns}$. Every other timing budget in the module is a mechanical or computational rate, not a light-travel time, which is why none of them needed anything close to this precision.
:::

::: check
Electronic IMU stimulation can reproduce frequencies a motion table cannot. Does that make it the more complete test of the two? Explain.
:::

::: answer
No. Electronic stimulation injects its signal past the physical sensing element. It can never exercise a mounting misalignment, real mechanical cross-axis coupling, or heating behavior under genuine rotation — exactly the defects a table's real motion is uniquely placed to catch. The two techniques cover different kinds of defect at different frequency ranges. Neither is more complete; a thorough campaign needs both.
:::

::: check
A HIL bench's altimeter stimulator has a $20\,\mathrm{ms}$ update latency. Using the two-rate reasoning from earlier in this module, explain what this does to a control loop that reads the altimeter, even if every other part of the bench is perfectly synchronized.
:::

::: answer
A $20\,\mathrm{ms}$ stimulator latency is a transport delay in the sensor path, just like the sensor latency this module priced earlier. It subtracts phase $\omega\tau$ at the loop's crossover frequency, on top of any delay the loop already has. At a crossover of $3\,\mathrm{rad/s}$, for instance, that is $3 \times 0.02 = 0.06\,\mathrm{rad}$, about $3.4^\circ$ of phase margin gone. The real altimeter's own latency should already be in the design. This extra delay belongs to the bench, not to the vehicle, so the HIL test is adding delay the flying system may not have. The results must be read with that in mind, not taken as a direct measurement of the real system's margin.
:::

::: check
Why is it misleading to describe HIL as "testing the flight computer with real hardware", as if the flight computer were the only thing under test?
:::

::: answer
Every piece of equipment on the bench — truth host, motion table, IMU stimulator, GNSS simulator, camera or altimeter stimulator — must meet its own real-time and fidelity requirements at the same time. A failure in any of them (the host missing its budget, the table's bandwidth exceeded, GNSS timing drifting by more than a few nanoseconds) spoils the test as thoroughly as a defect in the flight computer would. HIL checks the flight computer only as far as everything else on the bench is also behaving correctly. That is why this lesson spent as long on the equipment's own limits as on the unit under test.
:::

## Summary

| Component | Purpose | Its own limiting factor |
| --- | --- | --- |
| Real-time truth host | Fresh truth every cycle at the real rate | Physics, I/O and logging must all fit the real budget; this module's bundled physics alone is about $15\,\mathrm{\mu s}$ in Python |
| Motion table | Genuine physical inertial stimulation | Rate and bandwidth limited by its own inertia: a handful of hertz loaded, a few tens at best |
| Electronic IMU stimulation | High-frequency content beyond table bandwidth | Never exercises the physical sensing element |
| GNSS signal simulator | Realistic radio stimulation of the real receiver | Timing sync $\Delta t = \Delta r / c$: $33.4\,\mathrm{ns}$ for $10\,\mathrm{m}$, $3.3\,\mathrm{ns}$ for $1\,\mathrm{m}$ |
| Camera and altimeter stimulation | Realistic optical and ranging input | Own update rate and latency; altimeter echo $\Delta t = 2\Delta r / c$ |

Real-time hardware answers whether the flight system works against realistic hardware and timing. The next lesson asks a different question, one this whole module has been building toward: how do you know, without any hardware at all, that the physics the plant computes is correct?

::: context flight-simulator The pilot's version of HIL
Airline pilots do much of their type training in full-flight simulators: a real cockpit on a platform with six hydraulic or electric legs that can tilt, heave and shake it, and screens outside the windows. The legs can only move a meter or so, so the simulator fakes a long acceleration by tilting the cabin slowly and letting gravity press the pilot into the seat. That trick is exactly the kind of limit this lesson is about: the motion platform has a range and a bandwidth, and the whole machine has to keep up with a real person in real time.
:::

::: context hard-real-time Late is the same as wrong
In ordinary software, "fast" means "on average quick". In **hard real-time** software, a result that arrives after its deadline counts as a failure, even if it is correct. A truth host that finishes $999$ cycles in $0.5\,\mathrm{ms}$ and one cycle in $1.2\,\mathrm{ms}$ against a $1\,\mathrm{ms}$ budget has failed once, and that one late cycle is what the flight computer sees. So engineers care about the *worst* cycle time, not the average — which is why real-time operating systems exist and why ordinary desktop systems, with their background tasks, are a poor place to run a HIL bench.
:::

::: context compiled-code Why not Python on the bench
Python is **interpreted**: a program reads your code and carries it out line by line while it runs, which adds overhead on every call and makes timing less predictable. **Compiled** languages such as C and C++ are translated into the processor's own instructions before running, so each step is fast and its cost is steady. A truth host needs both speed and steadiness, because its worst cycle matters more than its average. That is why the real-time part of a HIL bench is almost always C or C++, even when Python sets up the scenario and analyzes the results afterward.
:::

::: context proof-mass What an accelerometer actually senses
Inside an accelerometer is a small **proof mass** held by springs inside a case. When the case is pushed, the mass lags behind a little and the springs stretch. Measuring that stretch tells you the push. Gyroscopes in small sensors use a vibrating proof mass in a similar way. The key point for HIL: this mass, its springs and its mounting are real mechanical parts, and only real motion exercises them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="30" width="240" height="80" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="60,70 72,70 78,60 90,80 102,60 114,80 126,60 132,70 150,70"/>
  <rect x="150" y="50" width="60" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="210,70 228,70 234,60 246,80 258,60 270,80 282,60 288,70 300,70"/>
  <text x="180" y="75" font-size="12" text-anchor="middle" fill="#1f2a44">mass</text>
  <text x="105" y="102" font-size="11" text-anchor="middle" fill="#1f2a44">spring</text>
  <text x="255" y="102" font-size="11" text-anchor="middle" fill="#1f2a44">spring</text>
  <text x="180" y="22" font-size="12" text-anchor="middle" fill="#1f2a44">case (moves with the vehicle)</text>
  <line x1="20" y1="70" x2="52" y2="70" stroke="#b4232c" stroke-width="3"/>
  <polygon points="58,70 48,64 48,76" fill="#b4232c"/>
  <text x="30" y="58" font-size="12" text-anchor="middle" fill="#b4232c">push</text>
  <text x="180" y="130" font-size="11" text-anchor="middle" fill="#1f2a44">mass lags, springs stretch: stretch measures the push</text>
</svg>
```
:::

::: context bandwidth How fast a machine can follow
Ask a machine to wiggle back and forth, faster and faster, and at first it follows well. Past some frequency its swings shrink and fall behind the command. **Bandwidth** is roughly where that falling-off starts; engineers usually put it where the swing has dropped to about $71\%$ of the commanded size (a factor $1/\sqrt{2}$).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="125" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,30 120,30 150,33 170,40 190,56.1 210,66 240,80 280,96 330,108"/>
  <line x1="40" y1="56.1" x2="190" y2="56.1" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="190" y1="56.1" x2="190" y2="120" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="190" y="137" font-size="12" text-anchor="middle" fill="#b4232c">bandwidth</text>
  <text x="46" y="24" font-size="11" fill="#1f2a44">follows fully</text>
  <text x="46" y="51" font-size="11" fill="#6c7a93">71% of command</text>
  <text x="335" y="137" font-size="11" text-anchor="end" fill="#1f2a44">frequency</text>
  <text x="262" y="76" font-size="11" fill="#1d6fd1">falls behind</text>
</svg>
```

A heavy loaded table reaches this point at a few hertz; a small electronic signal source, at many kilohertz.
:::

::: context rf-signal What "RF" means here
**RF**, radio frequency, just means radio waves. GPS satellites broadcast their main civil signal at $1575.42\,\mathrm{MHz}$. Because the satellite and receiver move relative to each other, the frequency that arrives is shifted a little — the **Doppler shift**, the same effect that makes a passing siren drop in pitch. For a receiver on the ground the shift is up to about $5\,\mathrm{kHz}$; for one on a spacecraft in low orbit, tens of kilohertz. A signal simulator must fake that shift correctly, moment by moment, or the receiver will track the wrong speed.
:::

::: context light-nanosecond A foot of light
Light travels $299{,}792{,}458\,\mathrm{m}$ in one second, so in one nanosecond it goes $0.30\,\mathrm{m}$ — about a foot. That one number makes GNSS timing easy to feel: every nanosecond of timing error is about $30\,\mathrm{cm}$ of range error.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="50" x2="330" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="30" y1="42" x2="30" y2="58"/><line x1="120" y1="42" x2="120" y2="58"/>
    <line x1="210" y1="42" x2="210" y2="58"/><line x1="300" y1="42" x2="300" y2="58"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="76">0</text><text x="120" y="76">1 ns</text><text x="210" y="76">2 ns</text><text x="300" y="76">3 ns</text>
  </g>
  <line x1="30" y1="28" x2="120" y2="28" stroke="#1d6fd1" stroke-width="3"/>
  <text x="75" y="20" font-size="12" text-anchor="middle" fill="#1d6fd1">0.30 m</text>
  <text x="210" y="94" font-size="12" text-anchor="middle" fill="#b4232c">3.3 ns ≈ 1 m of range</text>
</svg>
```

GPS signals are built from a code whose single "chip" lasts about a microsecond, which is about $293\,\mathrm{m}$ of light travel; receivers measure their position within that chip to a small fraction of it.
:::

::: context star-tracker A camera that finds its way by the stars
A **star tracker** is a small camera that photographs the sky, picks out the stars, matches their pattern against a catalog, and reports the spacecraft's attitude — often to a few arcseconds (thousandths of a degree). To stimulate one on a bench, engineers place a screen with collimating optics in front of it, so the dots on the screen look infinitely far away, like real stars. The screen's refresh rate and delay then become part of the test.
:::

::: context round-trip Down and back again
A GNSS signal travels one way: satellite to receiver. An altimeter's pulse travels down to the ground and back up, so it covers the height twice. The echo time is $t = 2h/c$. At $h = 1000\,\mathrm{m}$, that is $2 \times 1000 / 299{,}792{,}458 = 6.67\,\mathrm{\mu s}$. A $1\,\mathrm{m}$ error in height changes the echo by $6.67\,\mathrm{ns}$, twice what the same error would mean for a one-way signal. The stimulator must delay its fake echo by exactly the right amount for the truth altitude at that instant.
:::
