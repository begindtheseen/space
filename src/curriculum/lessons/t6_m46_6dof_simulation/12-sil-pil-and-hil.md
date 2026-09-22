---
id: l12-sil-pil-and-hil
title: SIL, PIL and HIL
minutes: 19
covers:
  - The SIL, PIL and HIL progression and what each step actually adds
---

The previous lesson established that the GNC box should run the genuine flight binary, not a re-implementation. It did not say *where* that binary runs, and the answer turns out to have three increasingly demanding versions, each one exposing a class of defect the version before it structurally cannot. This lesson names them precisely — software-in-the-loop, processor-in-the-loop, hardware-in-the-loop — and, for each step up, asks what specifically becomes possible to find that was not possible before, with a number behind the answer rather than just the name.

## SIL: the algorithm, on a workstation

Software-in-the-loop runs the compiled flight binary on an ordinary development workstation, inside the Python-orchestrated simulation this whole module has been building. Every architectural lesson so far — the two-rate loop, frame discipline, sensor and actuator models, event detection — is exercised in a SIL run, and SIL is where the overwhelming majority of GNC bugs are actually found, because it is fast, cheap to run thousands of times, and easy to instrument. What SIL cannot tell you anything about is how the *same binary*, or one built for a different target, behaves on hardware that is not a development workstation: a workstation's processor architecture, compiler, and floating-point behaviour are not the flight processor's, and the previous lesson's float-width example already showed how much even a difference this narrow can matter given enough run time.

## PIL: the real processor, still simulated I/O

Processor-in-the-loop moves the flight binary onto the actual flight processor — or a cycle-accurate emulation of it — while sensor and actuator data still come from the simulation rather than real hardware. What PIL adds is everything about *this specific processor executing this specific code*: its real instruction timing, its real memory footprint, its real behaviour under whatever fixed-point or floating-point arithmetic it actually implements, and, most consequentially for a real-time control system, whether the algorithm actually finishes within its allotted cycle time on hardware that is very often dramatically slower than the workstation it was developed on.

::: example A margin that exists on a workstation and does not exist on the target
Measure how long a representative piece of flight-software-style work — the matrix operations of a Kalman-style measurement update, state dimension 9, measurement dimension 6 — actually takes on an ordinary workstation, then ask what a full GNC cycle's worth of comparable work (sensor processing, navigation filter, guidance, control law, actuator allocation, perhaps eighteen operations of similar cost) would take on a processor two orders of magnitude slower, a representative gap between a development workstation and a radiation-hardened flight part:

```python
import time
import numpy as np

n, m = 9, 6
rng = np.random.default_rng(0)
P = np.eye(n) * 0.1
H = rng.standard_normal((m, n))
R = np.eye(m) * 0.01
x = np.zeros(n)
z = rng.standard_normal(m)

def kf_update(x, P, H, R, z):
    S = H @ P @ H.T + R
    K = P @ H.T @ np.linalg.inv(S)
    x_new = x + K @ (z - H @ x)
    P_new = (np.eye(len(x)) - K @ H) @ P
    return x_new, P_new

for _ in range(200):
    kf_update(x, P, H, R, z)          # warm-up

n_trials = 50000
t0 = time.perf_counter()
for _ in range(n_trials):
    kf_update(x, P, H, R, z)
t1 = time.perf_counter()
per_op_us = (t1 - t0)/n_trials*1e6

n_ops = 18                             # a full cycle's worth of comparable operations
cycle_workstation_us = per_op_us*n_ops
ratio = 35.0                           # illustrative workstation-to-flight-processor speed gap
cycle_flight_us = cycle_workstation_us*ratio
budget_ms = 10.0

print(f"per operation: {per_op_us:.3f} us")
print(f"full cycle, workstation: {cycle_workstation_us:.1f} us "
      f"({cycle_workstation_us/1000/budget_ms:.1%} of a {budget_ms} ms budget)")
print(f"full cycle, flight-representative processor: {cycle_flight_us/1000:.2f} ms "
      f"({cycle_flight_us/1000/budget_ms:.1%} of budget)")
# per operation: 17.838 us
# full cycle, workstation: 321.1 us (3.2% of a 10.0 ms budget)
# full cycle, flight-representative processor: 11.24 ms (112.4% of budget)
```

On the workstation, this cycle's worth of work costs $321\,\mathrm{\mu s}$, a comfortable $3.2\%$ of a $10\,\mathrm{ms}$ control period — nothing here would ever raise a concern in a SIL run, however many times it were repeated. Scaled to a processor two orders of magnitude slower, the same work is estimated at $11.24\,\mathrm{ms}$ — over the budget before the tick even finishes. The scaling here is a crude clock-ratio estimate, not a substitute for real timing analysis on the actual target — cache behaviour, pipelining and instruction mix all matter too, which is exactly why PIL exists rather than a spreadsheet doing this multiplication being considered sufficient. But the direction of the result is the point: a margin that is invisible from a workstation can already be gone on the real processor, and only running the real binary on the real (or cycle-accurate) processor tells you which side of the line you are actually on.
:::

## HIL: real hardware, real time, real interfaces

Hardware-in-the-loop adds the actual flight computer box, real sensor electrical interfaces (or stimulators that drive them electrically the way the real sensor would), real actuator interfaces, and — critically — a real clock that nothing in the simulation controls. This is the qualitative jump SIL and PIL cannot make regardless of how faithfully either one models the software and the processor: a purely simulated clock, however carefully time-scaled, never actually races against wall-clock time, because the simulation is always free to let the tick advance exactly when the computation finishes, whatever that took. HIL cannot do that. If the flight computer's cycle overruns its budget, the next real tick arrives on schedule anyway, and the consequence — a stale command held an extra cycle, a dropped sample, a queued interrupt — is a genuine defect that nothing upstream of HIL could have produced, because nothing upstream of HIL has a real clock to overrun.

::: example A defect that exists only when the clock is real
Model, illustratively, ten thousand cycles of a flight computer's actual execution time — a steady baseline with a small, realistic probability of a longer cycle from bus contention or an interrupt, the kind of tail behaviour only real interrupt controllers and real bus arbitration produce, not a number measured from any specific hardware here, but built to have the right *shape* for the point being made:

```python
import numpy as np

rng = np.random.default_rng(7)
n_cycles = 10000
budget_ms = 10.0

base = rng.normal(9.0, 0.15, n_cycles)
spike_mask = rng.random(n_cycles) < 0.015          # 1.5% of cycles hit real contention
spikes = rng.normal(13.0, 1.0, n_cycles)
cycle_time = np.clip(np.where(spike_mask, spikes, base), 6.0, None)

overruns = cycle_time > budget_ms
print("cycles over budget:", int(np.sum(overruns)), f"({100*np.mean(overruns):.2f}%)")
print("max cycle time (ms):", np.max(cycle_time))
print("HIL: stale-command ticks =", int(np.sum(overruns)))
print("SIL/PIL: stale-command ticks = 0 (every overrun above is invisible by construction)")
# cycles over budget: 121 (1.21%)
# max cycle time (ms): 15.362318949011456
# HIL: stale-command ticks = 121
# SIL/PIL: stale-command ticks = 0 (every overrun above is invisible by construction)
```

Out of ten thousand cycles, $121$ — about $1.2\%$ — exceed the $10\,\mathrm{ms}$ budget, one reaching $15.4\,\mathrm{ms}$. Running under HIL, with a real clock enforcing real deadlines, each of those $121$ cycles is a tick where the actuator held a stale command one cycle longer than intended — exactly the kind of intermittent, statistically rare timing defect a flight anomaly investigation looks for. Running the identical flight binary against the identical simulated dynamics under SIL or PIL, with the simulated tick simply advancing once each computation finishes, produces *zero* stale-command ticks, not because the underlying computation is any different, but because nothing about SIL or PIL's clock can be late.
:::

::: key What each step actually adds
SIL: the algorithm's correctness, on a workstation — fast, cheap, where most bugs are found. PIL: the real processor's real timing, memory and arithmetic — whether the algorithm that is correct also finishes in time and fits, on real silicon. HIL: real hardware, real electrical interfaces and a real clock — bus timing, driver behaviour, interrupt interaction, sensor failure modes and power transients, none of which any software model, however detailed, is even attempting to represent. Each step catches defects the step before it cannot produce, not merely defects it happened not to find.
:::

::: warning Treating PIL's timing estimate as a certified margin
The clock-ratio scaling in the first example is a reason to go run PIL, not a substitute for running it: it says nothing about cache misses, pipeline stalls, interrupt preemption or any of the dozen other things that make real execution time on real silicon differ from a clock-speed multiplication. Treating a spreadsheet estimate as if it were a certified timing margin is precisely the mistake PIL exists to prevent.
:::

::: warning Assuming HIL only matters for exotic failure modes
It is tempting to treat HIL as a check reserved for unusual scenarios — a wiring fault, a rare sensor failure — while trusting SIL and PIL for "normal" operation. The example above shows an entirely ordinary-sounding defect, a $1.2\%$ tail of cycle overruns under nominal load, that is invisible to both SIL and PIL by construction and appears only once a real clock is running the show. HIL is not a check for exotic scenarios; it is the only stage that tests the passage of real time at all.
:::

## Check yourself

::: check
Why is SIL, despite being the least representative of the three stages, where the overwhelming majority of GNC bugs are actually found?
:::

::: answer
SIL is fast and cheap to run — thousands of cases in the time a single HIL run takes — and gives complete visibility into every internal signal, which makes it the right tool for finding algorithmic defects: a wrong sign, a mishandled edge case, a logic error in the guidance or control law. It simply cannot find defects that only exist because of real processor timing or real hardware behaviour, which is exactly why PIL and HIL exist as separate, later stages rather than SIL being expected to catch everything.
:::

::: check
The PIL example measured $321\,\mathrm{\mu s}$ on a workstation and estimated $11.24\,\mathrm{ms}$ on a flight-representative processor, against a $10\,\mathrm{ms}$ budget. Why is this estimate not sufficient by itself to conclude the design will actually violate its timing budget on the real target?
:::

::: answer
The estimate only scales by clock speed, which ignores everything else that differs between a development workstation and an embedded flight processor: cache size and hit rate, pipeline depth, whether the target has a hardware floating-point unit at all, instruction mix, and compiler code generation for that specific target. The true execution time could come in above or below this estimate for reasons the clock-ratio calculation cannot see, which is exactly why PIL — running the real binary on the real or cycle-accurate processor — is the stage that actually answers the question, not the estimate that motivates running it.
:::

::: check
In the HIL example, $121$ out of $10{,}000$ cycles exceeded the timing budget under the illustrative model. Explain precisely why the identical flight binary, executing the identical computations against identical simulated sensor data, produces zero such events under SIL or PIL.
:::

::: answer
SIL and PIL both run against a simulated clock that advances the tick only once the computation for that tick has actually finished — there is no independent, ongoing wall-clock time for the computation to fall behind. HIL replaces that simulated clock with a real one that advances regardless of what the flight computer is doing, so a cycle that takes longer than its budget genuinely collides with the next real tick's arrival. The computation is identical in all three cases; only HIL has a clock capable of exposing a computation that runs too long.
:::

::: check
A programme runs extensive PIL testing, confirming the flight binary always finishes well within its timing budget on the real processor, and concludes HIL testing can be shortened significantly as a result. What specific class of defect would this decision leave unchecked?
:::

::: answer
PIL confirms timing and computation on the real processor, but sensor and actuator data are still simulated, so PIL says nothing about real bus timing, real driver behaviour under real interrupt load, real sensor electrical interfaces and their genuine failure modes, or real power transients during actuator commutation — all of which require real hardware, not just a real processor, to be present at all. Confirming the algorithm finishes in time on the real chip is a necessary condition for a working system, not a substitute for testing the hardware interfaces the chip actually has to talk to.
:::

::: check
Why does the text describe HIL as "the only stage that tests the passage of real time at all," rather than saying PIL also does, given that PIL uses the real flight processor?
:::

::: answer
PIL uses the real processor for computation, but its sensor and actuator data typically still come from the simulation on a schedule the simulation controls, which means the overall loop can still be run faster or slower than real time, or with the simulated clock waiting for the processor rather than racing against it. Only in HIL is every part of the loop — computation, interfaces, and the clock governing when the next input arrives — tied to actual, un-pausable, wall-clock time, which is what makes a genuine deadline miss possible in the first place.
:::

::: check
Why is a $1.2\%$ rate of cycle-time overruns, as in the HIL example, a more operationally serious finding than a bug that causes every single cycle to fail?
:::

::: answer
A defect that fails every cycle is loud and immediate — it shows up on the very first test run and is straightforward to reproduce and isolate. A $1.2\%$ intermittent overrun can pass a short test campaign entirely by chance, appears only statistically over a long enough run, and is far closer to the signature of a real flight anomaly, which is typically rare, hard to reproduce on demand, and only found because someone ran the system long enough, under real timing conditions, for the tail of the distribution to show up at all.
:::

## Summary

| Stage | Runs on | What it adds |
| --- | --- | --- |
| SIL | Flight binary, development workstation, simulated everything | Algorithmic correctness; fast and cheap, where most bugs are found |
| PIL | Flight binary, real (or cycle-accurate) flight processor, simulated I/O | Real timing, memory footprint and arithmetic on the actual target |
| HIL | Flight binary, real processor, real interfaces, real clock | Bus timing, driver behaviour, interrupt interaction, sensor/actuator electrical failure modes, power transients — and genuine deadline misses |
| PIL measured | $321\,\mathrm{\mu s}$ workstation $\to$ $11.24\,\mathrm{ms}$ estimated on a 35$\times$-slower processor, against a $10\,\mathrm{ms}$ budget | A margin invisible on the workstation, gone on the target |
| HIL measured | $121/10{,}000$ ($1.2\%$) cycles over budget in an illustrative model | Stale-command ticks that SIL and PIL cannot produce, by construction |

The next lesson goes further into what HIL specifically requires to run at all — real-time flight processors, motion tables, and the stimulators that make a real sensor believe it is flying, rather than sitting on a bench.
