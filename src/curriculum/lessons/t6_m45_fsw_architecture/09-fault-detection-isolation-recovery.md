---
id: l09-fault-detection-isolation-recovery
title: Fault detection, isolation and recovery
minutes: 24
covers:
  - "Fault detection, isolation and recovery: residual monitors, hypothesis tests, persistence counters and hysteresis"
---

A watchdog catches a task that stops running. A voter catches one channel that disagrees with its peers. Neither catches the failure mode that matters most once those two are covered: a single sensor, running exactly on schedule, agreeing with nothing because it is the only source of its kind, quietly reporting a value that is wrong. Detecting that requires checking a measurement against something more principled than "does it look plausible" — against the filter's own model of what a healthy measurement should look like, expressed as a formal hypothesis test — and then deciding, from a stream of individually noisy test results, whether a real fault is present without either crying wolf on ordinary noise or taking too long to notice a real one. This lesson builds that pipeline: the residual monitor, the persistence counter, and the hysteresis that together make fault detection, isolation, and recovery (FDIR) a working piece of software rather than a single threshold check.

## The residual as a hypothesis test

Recall the innovation, or residual, from this curriculum's filtering lessons: the gap $\boldsymbol\nu = \mathbf z - h(\hat{\mathbf x})$ between a new measurement and what the filter's current state estimate predicted it should be. A correctly tuned filter's own model already predicts how large that gap should typically be — its innovation covariance $\mathbf S$ — and the **normalized innovation squared** (NIS), $\boldsymbol\nu^\top \mathbf S^{-1} \boldsymbol\nu$, measures the gap in units the filter's own uncertainty sets. Under the filter's assumptions, and with a healthy measurement, NIS follows a chi-squared distribution with degrees of freedom equal to the measurement's dimension — so its expected value under a healthy hypothesis is exactly that dimension, a number you can check against without any additional tuning.

::: example NIS on three different residuals
```python
import numpy as np

def nis(residual, S):
    residual = np.atleast_1d(residual)
    S = np.atleast_2d(S)
    return float(residual @ np.linalg.solve(S, residual))

print(nis(np.array([1.2, -0.8]), np.eye(2)))                       # 2.08, dof=2, E[NIS|H0]=2
print(nis(np.array([0.3]), np.array([[0.09]])))                     # 1.0
print(nis(np.array([2.5, 1.0, -0.5]), np.diag([1.0, 4.0, 0.25])))   # 7.5, dof=3, E[NIS|H0]=3
# 2.08
# 1.0
# 7.5
```
The two-dimensional residual lands close to its expected value of 2 under a healthy hypothesis — unremarkable. The three-dimensional residual's NIS of 7.5 sits well above its expected value of 3 — worth a second look, though on its own, from a single sample, not yet worth declaring a fault. That "not yet" is the entire subject of the rest of this lesson.
:::

This is a hypothesis test in the same sense any other statistical test is: $H_0$ is "the measurement is consistent with the filter's own model of a healthy sensor," $H_1$ is "it is not," and a threshold on the test statistic (NIS, or its square root for a scalar signal) separates accept from reject. Every hypothesis test carries two ways to be wrong, and both have names worth using precisely. A **false alarm** (Type I error) rejects $H_0$ — declares a fault — when the sensor was actually healthy and the large residual was ordinary noise. A **missed detection** (Type II error) fails to reject $H_0$ — declares nothing wrong — when the sensor is genuinely faulted but the residual on this particular sample happened to look unremarkable. Setting the threshold trades one against the other directly: raise it, and false alarms fall while missed detections (at any given fault size) rise; lower it, and the reverse.

::: key
A residual test has two error modes: a false alarm (Type I, declaring a healthy sensor faulted) and a missed detection (Type II, failing to declare a genuinely faulted sensor). Threshold, persistence count $N$, and hysteresis gap are the three knobs that trade between them; none can be chosen without deciding how much of each error the mission can tolerate.
:::

## The single-sample false-alarm rate, and why it is not the end of the story

For a scalar, whitened residual under a healthy hypothesis, the residual behaves like a standard normal random variable, and a threshold at $z = 3.5$ gives a small, computable false-alarm probability per sample.

```python
from scipy import stats
p_fa_1 = 2 * stats.norm.sf(3.5)
print(f"{p_fa_1:.3e}")
# 4.653e-04
```
Four and a half in ten thousand looks comfortably small, until you remember how many samples a real control loop produces: at 20 Hz over a ten-minute powered phase, that is 12,000 independent opportunities for a false alarm, and $12000 \times 4.653\times10^{-4} \approx 5.6$ — a single-sample threshold this tight would be expected to declare several false faults over one flight, on a sensor that never actually failed.

## The persistence counter: requiring a run, not a sample

A **persistence counter** raises the bar from "one sample exceeded threshold" to "$N$ consecutive samples exceeded threshold," resetting to zero on any sample that does not. Because false alarms on independent, healthy samples are (to a good approximation) independent events, requiring $N$ in a row suppresses them roughly as $p_{fa,1}^{\,N}$ — a steep, multiplicative improvement for a small increase in $N$.

::: example Persistence turns a near-certain false alarm into a vanishing one
```python
import numpy as np
rng = np.random.default_rng(20260101)
FS, T_MISSION = 20.0, 600.0
N_SAMPLES, TRIALS = int(FS * T_MISSION), 4000
Z = 3.5

for N in [1, 2, 3, 4]:
    trips = 0
    for _ in range(TRIALS):
        exceed = np.abs(rng.standard_normal(N_SAMPLES)) > Z
        run = 0
        for e in exceed:
            run = run + 1 if e else 0
            if run == N:
                trips += 1
                break
    print(f"N={N}: empirical P(>=1 false trip over the mission) = {trips/TRIALS:.4f}  "
          f"(analytic ~ p_fa_1^N * samples = {min(1.0, p_fa_1**N * N_SAMPLES):.3e})")
# N=1: empirical=0.9970  (analytic ~ 1.000e+00)
# N=2: empirical=0.0030  (analytic ~ 2.598e-03)
# N=3: empirical=0.0000  (analytic ~ 1.209e-06)
# N=4: empirical=0.0000  (analytic ~ 5.623e-10)
```
Requiring even two consecutive exceedances — one additional sample — collapses the false-alarm probability over the whole ten-minute phase from "virtually certain" (99.7% of trials saw at least one) to three in a thousand; requiring three or four drives it low enough that four thousand simulated missions produced not a single false trip. This is the entire appeal of a persistence counter: a tiny increase in the number of consecutive samples required buys an enormous reduction in nuisance faults.
:::

That reduction is not free, and the cost is latency: a fault has to persist for at least $N$ samples before it can be declared at all, and how long it actually takes depends sharply on how far the fault has pushed the residual.

::: example Detection latency, by fault size and by N
```python
TRIALS_B, MAXWAIT = 5000, 400
for delta in [2.0, 4.0, 6.0]:
    row = []
    for N in [1, 2, 3, 4]:
        latencies = []
        for _ in range(TRIALS_B):
            exceed = np.abs(rng.standard_normal(MAXWAIT) + delta) > Z
            run, hit = 0, None
            for i, e in enumerate(exceed):
                run = run + 1 if e else 0
                if run == N:
                    hit = i
                    break
            latencies.append((hit + 1) if hit is not None else MAXWAIT)
        row.append((N, round(float(np.mean(latencies)), 1)))
    print(f"delta={delta:.1f} sigma: mean samples to declare, by N -> {row}")
# delta=2.0 sigma: mean samples to declare, by N -> [(1, 14.9), (2, 196.5), (3, 378.3), (4, 398.6)]
# delta=4.0 sigma: mean samples to declare, by N -> [(1, 1.5), (2, 3.5), (3, 6.6), (4, 10.9)]
# delta=6.0 sigma: mean samples to declare, by N -> [(1, 1.0), (2, 2.0), (3, 3.0), (4, 4.1)]
```
For a large, unambiguous fault (6 sigma), $N=4$ costs about four samples of latency — negligible. For a marginal fault (2 sigma, barely above the noise floor), the same $N=4$ costs nearly 400 samples — twenty seconds at this lesson's 20 Hz — because a fault this small only exceeds the threshold on a small fraction of samples even when it is genuinely present, and waiting for four of those in a row takes a long time. The false-alarm suppression persistence buys is real, but it is not uniformly cheap: the closer a fault sits to the noise floor, the more that same $N$ costs in the time before anyone finds out.
:::

## Why a slow drift is the case that embarrasses a fixed-threshold monitor

Every result above assumed a fault that steps to its full size instantly. A slowly growing bias is a harder case, and it is worth seeing exactly how much harder, because "slow drift" is not merely "a small step" — its effective size at the moment detection would need to happen is still small, even though its eventual size is large.

::: example A ramp takes far longer to declare than a step of the same eventual size
```python
N, final_delta = 3, 6.0
for ramp_T in [5.0, 20.0, 60.0]:
    ramp_samples = int(ramp_T * FS)
    lat = []
    for _ in range(3000):
        n_show = ramp_samples + 200
        ramp = np.minimum(np.arange(n_show) / ramp_samples, 1.0) * final_delta
        exceed = np.abs(rng.standard_normal(n_show) + ramp) > Z
        run, hit = 0, None
        for i, e in enumerate(exceed):
            run = run + 1 if e else 0
            if run == N:
                hit = i
                break
        lat.append((hit + 1) if hit is not None else n_show)
    print(f"ramp to {final_delta} sigma over {ramp_T:.0f} s: mean declare time = {np.mean(lat)/FS:.2f} s")
# ramp to 6.0 sigma over  5 s: mean declare time = 3.08 s
# ramp to 6.0 sigma over 20 s: mean declare time = 10.54 s
# ramp to 6.0 sigma over 60 s: mean declare time = 28.41 s
# (a step straight to 6.0 sigma, for comparison, declares in about 0.15 s)
```
A fault that steps immediately to six sigma is declared in about 0.15 seconds. The identical eventual magnitude, reached by a 60-second ramp instead, takes about 28.4 seconds to declare — nearly half the ramp's entire duration passes with the fault present, growing, and undeclared. If the phase of flight this monitor is protecting is shorter than that — a burn, an approach, a critical maneuver measured in tens of seconds — a slow drift can outlast the entire phase without ever crossing into a declared fault, even though a step of the same final size would have been caught almost immediately. This is precisely why a persistence-and-threshold monitor tuned and validated against step faults can pass every test on the bench and still miss the failure that matters in flight: real sensor degradation is far more often a drift than a step.
:::

::: warning
A monitor's false-alarm rate and detection latency are usually characterized against step faults, because they are simple to inject and simple to reason about. Validate against a slow ramp too, at the size and rate a real degradation mode would plausibly produce — the worked example above shows the two cases are not remotely equivalent, and a monitor tuned only against steps can look excellent on paper while missing the fault that actually occurs.
:::

## Hysteresis: a second threshold to stop chattering

A persistence counter controls how a fault is *declared*; it says nothing about how a fault is *cleared*. A residual hovering near the declare threshold — neither comfortably healthy nor comfortably faulted — can cross back and forth repeatedly if clearing uses the same threshold as declaring, flapping a downstream mode transition or a telemetry flag on and off many times a second. **Hysteresis** fixes this with two thresholds: a higher one to declare, a distinctly lower one to clear, so that once a fault is declared, the residual has to fall meaningfully further before the system considers it resolved.

::: example Hysteresis gap versus how often the fault flag flips
```python
DUR, TRIALS_C = 2000, 800
declare_z, mean_level = 3.5, 3.5   # worst case: residual hovers right at the declare threshold
for gap in [0.0, 1.0, 2.0]:
    clear_z = declare_z - gap
    flips_all = []
    for _ in range(TRIALS_C):
        state, flips = 0, 0
        for v in rng.standard_normal(DUR) + mean_level:
            if state == 0 and v > declare_z:
                state, flips = 1, flips + 1
            elif state == 1 and v < clear_z:
                state = 0
        flips_all.append(flips)
    print(f"gap={gap:.1f} (declare={declare_z}, clear={clear_z:.1f}): mean flips over {DUR} samples = {np.mean(flips_all):.1f}")
# gap=0.0 (declare=3.5, clear=3.5): mean flips over 2000 samples = 500.2
# gap=1.0 (declare=3.5, clear=2.5): mean flips over 2000 samples = 241.4
# gap=2.0 (declare=3.5, clear=1.5): mean flips over 2000 samples = 44.6
```
With no gap at all, a residual sitting right at the boundary flips state about once every four samples — a fault flag chattering essentially continuously. Separating the clear threshold from the declare threshold by two sigma cuts that more than tenfold, because the residual now has to travel meaningfully further from where it just was before the state changes again. The right gap size, like the right $N$, is chosen against how much chattering the downstream logic (a mode transition, an isolation decision) can tolerate — not fixed by convention.
:::

## FDIR as a pipeline, not a single check

The three letters in FDIR name three distinct jobs this lesson has now built pieces of. **Detection** is the residual test and its persistence counter, deciding whether a fault is present. **Isolation** is deciding *which* source is responsible — trivial when only one sensor feeds a given quantity, and the actual subject of lesson 6's voter when several redundant sources are available to compare against each other. **Recovery** is what the software does once a fault is isolated — stop incorporating that source, fall back to a remaining one, or escalate toward the mode manager's safing transition from lesson 2 — and assigning that response systematically, failure mode by failure mode, is exactly what an FMEA is built to do, which is where lesson 10 goes next.

## Check yourself

::: check
A scalar, whitened residual has value $z = 2.6$ under a filter whose innovation variance model is correct. Is this, by itself, enough to declare a fault at a threshold of $z_{\text{thresh}} = 3.5$ with a persistence requirement of $N = 1$? What if $N = 3$ and this is the third consecutive sample above threshold?
:::

::: answer
With $z = 2.6$, the residual does not exceed a threshold of 3.5 at all, so neither case declares a fault from this sample — it is a routine, if slightly large, healthy-hypothesis residual. Had the sample instead been, say, $z = 3.9$, then with $N=1$ a single such sample would declare immediately; with $N=3$ it would only declare once two prior consecutive samples had also exceeded 3.5, and this lesson's persistence-counter example is exactly what such a requirement buys and costs.
:::

::: check
Explain, without recomputing the simulation, why requiring two consecutive exceedances rather than one reduces the false-alarm probability over a mission by roughly the single-sample false-alarm probability itself, not merely by half.
:::

::: answer
Treating consecutive healthy-hypothesis samples as approximately independent, the probability of two exceedances in a row is approximately the product of two single-sample probabilities, $p_{fa,1}\times p_{fa,1} = p_{fa,1}^2$ — for a small $p_{fa,1}$, that is a far smaller number than $p_{fa,1}$ itself, not merely half of it. Requiring $N$ in a row multiplies, rather than adds, the improvement with each additional required sample, which is why the false-alarm probability collapses geometrically in $N$ rather than linearly.
:::

::: check
A monitor validated only against instantaneous step faults reports excellent detection latency in every test. A colleague argues this is sufficient evidence the monitor is well-tuned for flight. What does this lesson's ramp-versus-step result say about that argument?
:::

::: answer
It is not sufficient. This lesson's worked example shows a fault of the identical eventual magnitude, introduced as a slow ramp rather than an instantaneous step, can take many times longer to declare — nearly half the ramp's own duration, in the 60-second case shown — because the fault's effective size at any given moment during the ramp is far smaller than its eventual size. A monitor that has only ever been validated against steps has no evidence at all about how it behaves against the gradual degradation that real sensors more often exhibit, and could pass every bench test while missing exactly the failure that matters in flight.
:::

::: check
A residual monitor uses the same value for its declare and clear thresholds. Under what condition does this produce a fault flag that changes state many times per second, and what is wrong with that outcome even if every individual declaration was, technically, correct at the instant it fired?
:::

::: answer
It happens when the residual hovers close to that single threshold, so ordinary sample-to-sample noise repeatedly pushes it back and forth across the boundary, each crossing correctly triggering a state change by the letter of the rule. The problem is not correctness at each instant but usability downstream: a fault flag that flips many times a second is not a signal any mode transition, telemetry display, or operator can act on sensibly, and hysteresis — a lower, separate clear threshold — is what turns a technically-correct-but-useless flapping signal into one that changes state only when the underlying condition has genuinely, meaningfully changed.
:::

::: check
Match each of detection, isolation, and recovery to the mechanism in this module that primarily implements it, and explain in one sentence why isolation is trivial for a single sensor but not for a triad of redundant ones.
:::

::: answer
Detection is the residual test and persistence counter built in this lesson; isolation is voting among redundant sources, from lessons 6 and 7, when more than one source measures the same quantity; recovery is the systematic, failure-mode-by-failure-mode response assignment an FMEA produces, the subject of lesson 10. Isolation is trivial for a single sensor because there is only one candidate to blame the moment a fault is detected — there is no "which one" question to answer — while a triad requires deciding which of several disagreeing sources is the faulty one, which is exactly the comparison problem lessons 6 and 7 showed is solvable for an ordinary fault and specifically defeated by a common-mode or Byzantine one.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Residual / innovation | Gap between a measurement and the filter's prediction of it |
| NIS | $\boldsymbol\nu^\top\mathbf S^{-1}\boldsymbol\nu$; chi-squared under $H_0$, expected value equal to the measurement dimension |
| False alarm (Type I) | Declaring a fault when the sensor is healthy |
| Missed detection (Type II) | Failing to declare when the sensor is genuinely faulted |
| Persistence counter | Requires $N$ consecutive exceedances; suppresses false alarms roughly as $p_{fa,1}^N$, at the cost of latency |
| Ramp versus step | A slow drift takes far longer to declare than a step of the same eventual size — the case a monitor tuned only on steps will miss |
| Hysteresis | Separate, lower clear threshold; prevents chattering when a residual hovers near the declare threshold |
| FDIR | Detection (this lesson) → isolation (voting, lessons 6–7) → recovery (FMEA-driven response, lesson 10) |

The next lesson turns detection into a systematic accounting: an FMEA that assigns every failure mode a detection means and a software response, a fault tree that combines basic-event probabilities into a top-event risk, and the abort decision that some of those responses ultimately feed.
