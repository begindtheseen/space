---
id: l13-real-time-hardware-in-the-loop
title: Real-time hardware-in-the-loop
minutes: 20
covers:
  - "Real-time hardware-in-the-loop: flight processors, motion tables, IMU stimulation, GNSS signal simulators, camera and altimeter stimulation"
---

The previous lesson established what HIL adds in principle: real hardware, real electrical interfaces, and a real clock nothing in the simulation controls. This lesson is about what that actually requires in equipment, and about a fact the previous lesson's framing left implicit: making the *flight computer's* clock real is not enough. Every piece of hardware on a HIL bench — the simulation host computing truth, the table moving the IMU, the box generating GNSS signals — now shares that same real clock, and every one of them has to keep up with it, not just the unit under test.

## The simulation host has to be real-time too

In SIL and PIL, the simulated clock advances once each computation finishes, however long that took — there is nothing to fall behind. On a HIL bench, the truth model itself — the plant, environment, sensor and actuator models this whole module has built — has to produce a fresh truth state at the real rate the flight computer expects to receive stimuli, every cycle, without exception. If the host computing truth is too slow, *it* becomes the thing missing deadlines, and everything downstream of it inherits a corrupted timeline exactly the way the previous lesson's overrun example corrupted the flight computer's.

::: example How much of a real-time budget the physics itself actually costs
Measure the cost of one fine-step evaluation of this module's own models bundled together — rigid-body dynamics, a coupled structural mode, $J_2$ gravity, an IMU sensor model, an actuator saturation model — the way a real-time truth host would call them every step:

```python
import time
import numpy as np

# (rigid-body, flex-mode, J2 gravity, sensor and actuator models exactly as in
#  the earlier lessons of this module, omitted here for length)

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
# bundled per-step model evaluation: 18.400980890000938 us
# budget 1000 us -> fraction used: 1.8%
# budget 200 us -> fraction used: 9.2%
# budget 100 us -> fraction used: 18.4%
# budget 50 us -> fraction used: 36.8%
```

Even bundled, this module's physics costs only $18.4\,\mathrm{\mu s}$ per evaluation — comfortable against a $1\,\mathrm{ms}$ budget, still workable against a demanding $50\,\mathrm{\mu s}$ budget needed to resolve content up into the low kilohertz. That comfort is specific to how cheap these particular closed-form models are; it is not a general licence to run the truth host in an interpreted language. A real HIL host still has to command a motion table, generate a synchronised RF signal, update a projected scene, and log every channel — all inside the same cycle — which is exactly why production real-time truth hosts run compiled, carefully budgeted code rather than Python: not because the physics in this lesson is expensive, but because everything *else* the cycle has to do is competing for the same real microseconds, and nothing on this bench gets to ask the clock to wait.
:::

## Motion tables: real inertial stimulation, with a rate and bandwidth of their own

A motion table physically rotates a real IMU — or the whole flight computer and IMU package together — so the sensor's actual proof mass, bearings and electronics experience genuine inertial motion, catching cross-axis coupling, thermal effects and mounting defects that no electronically injected signal can produce, because nothing electronic moves the physical sensing element at all. A table is itself a large, geared, inertial actuator, with its own rate limit and bandwidth — often tens to a few hundred degrees per second of rate, and only a handful of hertz of usable bandwidth once the table carries a realistic payload, because the same rotational inertia that makes the table capable of large, accurate slews makes it sluggish at high frequency.

This is a real physical constraint on what a table can honestly test, not a detail to work around by wishing it away. A structural mode near the $6\,\mathrm{Hz}$ figure this module's slosh-and-flex lesson used is already at or beyond many tables' comfortable bandwidth, and an IMU sampling at hundreds of hertz is capable of resolving vibration content far above anything a table carrying real hardware can physically reproduce. The honest conclusion is not that motion tables are inadequate — it is that they are the right tool for a different job than electronic IMU stimulation, described next, and a HIL campaign needs both rather than expecting one to substitute for the other.

## IMU stimulation, and the two things it cannot do that a table can

Electronic IMU stimulation injects a signal directly into the sensor's interface electronics, bypassing the physical proof mass entirely, and can therefore reproduce arbitrarily high-frequency, high-rate content — everything above a motion table's bandwidth, including the structural and slosh dynamics this module modelled in detail. What it cannot do is exercise the physical sensing element itself: a mounting misalignment, a genuine cross-axis coupling in the mechanical structure, or a thermal drift under real rotation are all invisible to a signal injected past the point where any of them would show up. Electronic stimulation and a motion table are complementary for exactly this reason, covering different frequency ranges and different failure classes, neither one a complete substitute for the other.

## GNSS signal simulators: a timing requirement six orders of magnitude tighter

A GNSS signal simulator generates realistic RF signals — correct Doppler shift, correct code phase, correct power level, sometimes correct multipath — fed into the real receiver's antenna port, so the receiver's actual acquisition and tracking hardware and firmware are exercised, not just its output data interface. What makes this specific stimulation unusually demanding is that GNSS ranging is fundamentally a timing measurement: the receiver infers distance from signal travel time, so any timing error the simulator introduces between the truth trajectory and the RF signal it generates becomes a ranging error at the speed of light.

::: example What GNSS stimulation timing actually requires
Ranging accuracy and required timing synchronisation are related by $\Delta t = \Delta r / c$:

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

A modest $10\,\mathrm{m}$ ranging accuracy target needs the simulator's signal timing synchronised to the truth trajectory to within $33.4\,\mathrm{ns}$; a demanding $1\,\mathrm{m}$ target needs $3.3\,\mathrm{ns}$. Every other real-time requirement in this module has been stated in milliseconds or microseconds — a control tick, a sensor sample, an actuator response. GNSS signal simulation needs synchronisation six to nine orders of magnitude tighter than that, because the physical quantity being reproduced is a light-travel time, not a mechanical motion, and this is precisely why GNSS simulators are specialised RF hardware with dedicated timing references, not a channel handled by the same general-purpose host computing the vehicle's truth trajectory.
:::

## Camera and altimeter stimulation

Optical sensors — star trackers, cameras for terrain-relative or optical navigation — are stimulated by projecting or displaying a synthetic scene in front of the real optics, generated from the truth attitude and position at the rate the sensor actually samples; a radar or laser altimeter is stimulated by generating a return signal with the correct time-of-flight for the truth altitude, the same timing-precision concern as GNSS but usually at a far less demanding tolerance, since altimeter ranging accuracy requirements are typically metres, not the sub-metre regime a precision GNSS receiver is built for. Both share the two-rate lesson's core constraint in a new guise: the display or signal generator has its own update rate and latency, which becomes one more clock in the loop that the truth host's own cycle must stay synchronised with, or the sensor is being stimulated with a scene or a return that describes where the vehicle *was*, not where it is.

::: key What each piece of HIL equipment tests, and what limits it
A real-time truth host, because everything downstream depends on its cycle never being late. A motion table, for genuine physical inertial motion, limited by its own rate and bandwidth to roughly the low end of a vehicle's dynamic content. Electronic IMU stimulation, for high-frequency content beyond a table's bandwidth, at the cost of never exercising the physical sensing element. A GNSS signal simulator, synchronised to the truth trajectory at a nanosecond-scale precision driven by the speed of light, far tighter than any other timing requirement in this module. Camera and altimeter stimulation, each with its own update-rate and latency constraint that must be budgeted the same way every other clock in this module has been.
:::

::: warning Assuming a motion table alone validates an IMU
A table demonstrates the sensor responds correctly to real, physical, low-frequency motion — a genuinely valuable and otherwise unobtainable result. It says nothing about the sensor's behaviour at the vibration frequencies a real vehicle's structural modes and engine-induced environment actually produce, which routinely exceed what any table carrying realistic hardware can reproduce. A HIL campaign that runs only table tests and calls the IMU "validated" has validated it against a frequency range the vehicle will not stay inside.
:::

::: warning Budgeting GNSS timing like every other real-time channel in this module
Every other timing budget in this module — the control tick, the sensor sample, the actuator response — has been comfortably specified in milliseconds or, at the tightest, tens of microseconds. Applying that same intuition to a GNSS signal simulator's synchronisation requirement is off by six to nine orders of magnitude, and a design that treats "synchronised to the truth model" as good enough without checking the actual nanosecond figure has not actually checked whether the stimulation is realistic at all.
:::

## Check yourself

::: check
Why does a HIL truth host have to be real-time in a way that a SIL or PIL simulation host does not?
:::

::: answer
In SIL and PIL, the simulated clock advances only once the current computation has finished, so there is nothing for the host to fall behind — the timeline simply waits. On a HIL bench, every piece of equipment shares one real, un-pausable clock; if the host computing truth cannot produce a fresh state every cycle at the real rate the rest of the bench expects, it is the one missing deadlines, corrupting the timeline for the flight computer and every stimulator downstream of it exactly the way an overrun corrupts the flight computer's own cycle.
:::

::: check
A motion table has roughly $5\,\mathrm{Hz}$ of usable bandwidth carrying a realistic payload. Explain why this is not a defect in the table, and what it implies about testing a vehicle with a $6\,\mathrm{Hz}$ structural mode.
:::

::: answer
A table's bandwidth is limited by the same rotational inertia that lets it carry real hardware through large, accurate physical slews — there is a genuine mechanical trade-off between capacity and high-frequency responsiveness, not an engineering oversight. A $6\,\mathrm{Hz}$ mode is already at or beyond a $5\,\mathrm{Hz}$-bandwidth table's comfortable range, so a table alone cannot be relied on to stimulate that mode realistically; electronic IMU stimulation, which has no such mechanical bandwidth limit, is needed to cover that frequency content instead.
:::

::: check
Why does GNSS signal simulation require nanosecond-scale timing synchronisation when every other real-time requirement in this module has been in the millisecond-to-microsecond range?
:::

::: answer
GNSS ranging works by measuring the travel time of a radio signal, so any timing error between the truth trajectory and the generated RF signal converts directly to a ranging error via $\Delta r = c\,\Delta t$ — and because $c$ is so large, even a very small timing error produces a significant ranging error: $10\,\mathrm{ns}$ of timing error already corresponds to $3\,\mathrm{m}$. Every other quantity in this module's timing budgets is a mechanical or computational rate, not a light-travel-time measurement, which is why none of those other budgets needed anywhere near this precision.
:::

::: check
Electronic IMU stimulation can reproduce frequency content a motion table cannot. Does this make electronic stimulation the more complete test of the two? Explain.
:::

::: answer
No. Electronic stimulation injects a signal past the sensor's physical sensing element, so it can never exercise a mounting misalignment, real mechanical cross-axis coupling, or thermal behaviour under genuine rotation — exactly the defects a motion table's real physical motion is uniquely positioned to catch. The two techniques cover different, non-overlapping classes of defect at different, non-overlapping frequency ranges, so neither is more complete than the other; a thorough campaign needs both.
:::

::: check
A HIL rig's altimeter stimulator has a $20\,\mathrm{ms}$ update latency. Using the two-rate architecture's reasoning from earlier in this module, explain what this latency does to a control loop that reads the altimeter, even if every other part of the HIL bench is perfectly synchronised.
:::

::: answer
A $20\,\mathrm{ms}$ stimulator latency is a transport delay in the sensor path, exactly like the sensor latency this module priced earlier: it subtracts phase $-\omega\tau$ at the loop's crossover frequency, on top of whatever other delay the loop already carries. If the flight software's altitude-dependent control loop was designed and margined without accounting for this stimulator-specific latency — as opposed to the real altimeter's own latency, which the design should already include — the HIL test is effectively adding delay the real flight system might not actually have, and the result needs to be interpreted with that in mind rather than taken as a direct measurement of the real system's margin.
:::

::: check
Why is it misleading to describe HIL as "testing the flight computer with real hardware," as if the flight computer were the only thing under test?
:::

::: answer
Every piece of equipment on the bench — the truth host, the motion table, the IMU stimulator, the GNSS simulator, the camera or altimeter stimulator — has to meet its own real-time and fidelity requirements simultaneously, and a failure in any one of them (the host missing its cycle budget, the table's bandwidth being exceeded, the GNSS timing drifting by more than a few nanoseconds) corrupts the test just as thoroughly as a defect in the flight computer itself would. HIL validates the flight computer only to the extent that everything else on the bench is also behaving correctly, which is why this lesson spent as much time on the stimulation equipment's own limits as on the flight computer being tested.
:::

## Summary

| Component | Purpose | Its own limiting factor |
| --- | --- | --- |
| Real-time truth host | Produces fresh truth every cycle at the real rate | Must complete physics, I/O and logging inside the real budget — $18.4\,\mathrm{\mu s}$ for this module's bundled physics alone, before any I/O |
| Motion table | Genuine physical inertial stimulation | Rate and bandwidth limited by its own inertia — roughly low tens of hertz at best with real payload |
| Electronic IMU stimulation | High-frequency content beyond table bandwidth | Never exercises the physical sensing element |
| GNSS signal simulator | Realistic RF stimulation of the real receiver | Timing synchronisation to the truth trajectory: $33.4\,\mathrm{ns}$ for $10\,\mathrm{m}$ ranging, $3.3\,\mathrm{ns}$ for $1\,\mathrm{m}$ |
| Camera/altimeter stimulation | Realistic optical/ranging input | Its own update rate and latency, budgeted like any other sensor delay |

Real-time hardware answers whether the flight system works against realistic hardware and timing. The next lesson turns to a different question this whole module has been building toward: how you know, independent of any hardware, that the physics the plant computes is actually correct.
