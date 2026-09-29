---
id: l09-fault-detection-isolation-recovery
title: Fault detection, isolation and recovery
minutes: 28
covers:
  - "Fault detection, isolation and recovery: residual monitors, hypothesis tests, persistence counters and hysteresis"
---

Think about the smoke alarm in a kitchen. Burn one piece of toast and it shrieks, even though nothing is on fire. That is annoying, and people who get annoyed enough pull the battery out. But an alarm that waits too long before sounding is worse: by the time it goes off, the room is full of smoke. A good alarm has to tell "a puff of smoke for one second" from "smoke that keeps coming", and once it has stopped, it should not start and stop again every time a wisp drifts past.

Flight software has the same problem, with sensors instead of smoke. A watchdog catches a task that stops running (lesson 8). A voter catches one channel that disagrees with its partners (lesson 6). Neither catches this one: a single sensor, running exactly on time, with nothing of its kind to compare against, quietly reporting a wrong value. Catching it needs a test with a real statistical footing, and then a rule for deciding, from a stream of noisy test results, whether a fault is truly there.

This lesson builds that machinery: the **residual monitor**, the **persistence counter**, and **hysteresis**. Together they make **FDIR** — fault detection, isolation and recovery — a working piece of software rather than one threshold check.

## The residual as a hypothesis test

Recall the **[[innovation|innovation]]**, also called the **residual**, from the filtering lessons. It is the gap between a new measurement $\mathbf z$ and what the filter predicted that measurement would be:

$$
\boldsymbol\nu = \mathbf z - h(\hat{\mathbf x}).
$$

Read $\boldsymbol\nu$ as "nu". $\hat{\mathbf x}$ ("x hat") is the filter's current estimate of the state, and $h$ turns a state into the measurement you would expect from it.

A well-tuned filter already predicts how big that gap should usually be. That prediction is the **innovation covariance** $\mathbf S$. So you can measure the gap in units of the filter's own expected spread. That is the **normalized innovation squared**, or **NIS**:

$$
\mathrm{NIS} = \boldsymbol\nu^\top \mathbf S^{-1} \boldsymbol\nu .
$$

Read it "nu transpose, S inverse, nu". For a single measurement it is $\nu^2 / S$: the residual squared, divided by its expected variance. A residual of two standard deviations gives $\mathrm{NIS} = 4$.

If the filter's assumptions hold and the sensor is healthy, NIS follows a **[[chi-squared distribution|chi-squared]]** whose **degrees of freedom** equal the number of measurements in $\mathbf z$. The mean of that distribution is exactly the number of degrees of freedom. So for a healthy 3-axis measurement, NIS should average $3$ — a number you can check against with no extra tuning.

::: key
Normalised innovation squared: $\mathrm{NIS} = \boldsymbol\nu^\top \mathbf S^{-1} \boldsymbol\nu$, with $\boldsymbol\nu$ the filter innovation and $\mathbf S$ its covariance. Under the filter assumptions it is chi-squared with the measurement dimension as degrees of freedom, so its mean equals that dimension. The standard sensor and filter health monitor.
:::

::: example NIS on three different residuals
```python
import numpy as np

def nis(residual, S):
    residual = np.atleast_1d(residual)
    S = np.atleast_2d(S)
    return float(residual @ np.linalg.solve(S, residual))

print(round(nis(np.array([1.2, -0.8]), np.eye(2)), 4))                      # 2 measurements
print(round(nis(np.array([0.3]), np.array([[0.09]])), 4))                   # 1 measurement
print(round(nis(np.array([2.5, 1.0, -0.5]), np.diag([1.0, 4.0, 0.25])), 4)) # 3 measurements
# 2.08
# 1.0
# 7.5
```

Work each by hand. First: $\mathbf S$ is the identity, so NIS is the sum of squares, $1.2^2 + 0.8^2 = 1.44 + 0.64 = 2.08$. The expected value for 2 measurements is $2$. Unremarkable.

Second: $0.3^2 / 0.09 = 0.09 / 0.09 = 1.0$. A residual of exactly one standard deviation. Expected value $1$.

Third: $\mathbf S$ is diagonal, so divide each square by its own variance: $\frac{2.5^2}{1} + \frac{1.0^2}{4} + \frac{0.5^2}{0.25} = 6.25 + 0.25 + 1.0 = 7.5$. That is well above the expected $3$. A chi-squared with 3 degrees of freedom exceeds $7.5$ about $5.8\%$ of the time, so it deserves a second look. But one sample, alone, is not yet a fault. That "not yet" is the rest of this lesson.
:::

This is a **hypothesis test**, the same as any statistical test. $H_0$ (read "H nought", the **null hypothesis**) says "the measurement fits the filter's model of a healthy sensor". $H_1$ says "it does not". A threshold on the test statistic decides between them. For a single scalar, engineers often use the **[[whitened|whitened]]** residual $z = \nu / \sqrt{S}$ instead: a plain number of standard deviations.

Every such test can be wrong in **[[two ways|two-errors]]**:

- A **false alarm** (Type I error): declaring a fault when the sensor was healthy and the big residual was ordinary noise.
- A **missed detection** (Type II error): declaring nothing wrong when the sensor really is faulty, because this sample happened to look normal.

The threshold trades one against the other. Raise it and false alarms fall, but missed detections rise. Lower it and the reverse happens.

::: key
A residual test has two error modes: a false alarm (Type I, declaring a healthy sensor faulted) and a missed detection (Type II, failing to declare a faulted sensor). Threshold, persistence count $N$, and hysteresis gap are the three knobs that trade between them; none can be chosen without deciding how much of each error the mission can tolerate.
:::

## One sample at a time: why it is not enough

For a healthy sensor, the whitened residual $z$ behaves like a **standard normal** number: average $0$, standard deviation $1$. Set the threshold at $|z| > 3.5$. The chance that healthy noise alone crosses it on one sample is small.

::: example Counting false alarms over one flight
```python
import math
p_fa_1 = math.erfc(3.5 / math.sqrt(2))     # P(|z| > 3.5) for a standard normal z
samples = int(20 * 600)                     # 20 Hz for ten minutes
print(f"single-sample false alarm: {p_fa_1:.3e}")
print(f"samples: {samples}, expected false alarms: {samples * p_fa_1:.1f}")
# single-sample false alarm: 4.653e-04
# samples: 12000, expected false alarms: 5.6
```

Four or five in ten thousand sounds tiny. Now count the chances. At $20$ samples per second over a ten-minute powered flight, that is $20 \times 600 = 12{,}000$ samples. Multiply: $12{,}000 \times 4.653 \times 10^{-4} \approx 5.6$. A single-sample test this tight would be expected to declare about five or six false faults in one flight, on a sensor that never failed. That is the burnt-toast alarm.
:::

## The persistence counter: a run, not a sample

A **persistence counter** raises the bar from "one sample crossed the threshold" to "$N$ samples in a row crossed it". Any sample below the threshold resets the count to zero.

Why does this help so much? Healthy noise samples are, to a good approximation, **[[independent|independent-samples]]** of each other. The chance of two independent unlikely things both happening is the product of their chances. So $N$ exceedances in a row happen with chance about $p_{fa,1}^{\,N}$, read "p f a one to the N" — the single-sample false-alarm chance, multiplied by itself $N$ times. With $p_{fa,1} \approx 5 \times 10^{-4}$, each extra sample in the run makes false alarms about two thousand times rarer.

::: example Persistence turns a near-certain false alarm into a vanishing one
Simulate $4000$ healthy ten-minute flights and count how many ever trip.

```python
import math
import numpy as np

Z, FS, T = 3.5, 20.0, 600.0
n_samples, trials = int(FS * T), 4000
p_fa_1 = math.erfc(Z / math.sqrt(2))
rng = np.random.default_rng(2026)

def trips_within(exceed, N):
    # does any window of N consecutive samples all exceed? (row by row)
    run = np.zeros(exceed.shape[0], dtype=int)
    hit = np.zeros(exceed.shape[0], dtype=bool)
    for col in exceed.T:
        run = np.where(col, run + 1, 0)
        hit |= run >= N
    return hit

for N in [1, 2, 3, 4]:
    exceed = np.abs(rng.standard_normal((trials, n_samples))) > Z
    p_sim = trips_within(exceed, N).mean()
    p_est = min(1.0, p_fa_1**N * n_samples)
    print(f"N={N}: simulated P(false trip in 10 min) = {p_sim:.4f}   estimate p^N x samples = {p_est:.3e}")
# N=1: simulated P(false trip in 10 min) = 0.9942   estimate p^N x samples = 1.000e+00
# N=2: simulated P(false trip in 10 min) = 0.0025   estimate p^N x samples = 2.598e-03
# N=3: simulated P(false trip in 10 min) = 0.0000   estimate p^N x samples = 1.209e-06
# N=4: simulated P(false trip in 10 min) = 0.0000   estimate p^N x samples = 5.623e-10
```

With $N = 1$, $99.4\%$ of healthy flights see at least one false fault — almost all of them. Requiring just two in a row drops that to $0.25\%$, a quarter of one percent. The rough estimate agrees: $(4.653 \times 10^{-4})^2 \times 12{,}000 \approx 2.6 \times 10^{-3}$. With three or four in a row, none of the $4000$ healthy flights tripped at all, as the estimates (about one in a million and less) predict. A tiny increase in $N$ buys an enormous cut in nuisance faults.
:::

That cut is not free. The price is **detection latency**: the delay between a fault starting and the monitor declaring it. A fault has to last at least $N$ samples before it can be declared. And how long it really takes depends heavily on how far the fault pushes the residual.

::: example Detection latency, by fault size and by N
A fault adds a fixed offset of $\delta$ (read "delta") standard deviations to the residual. Measure the average number of samples until the monitor declares, giving up at $400$.

```python
import numpy as np

Z, trials, max_wait = 3.5, 5000, 400
rng = np.random.default_rng(7)

def samples_to_declare(exceed, N):
    # for each row: 1-based index where N-in-a-row is first reached (max_wait if never)
    run = np.zeros(exceed.shape[0], dtype=int)
    when = np.full(exceed.shape[0], exceed.shape[1])
    for i, col in enumerate(exceed.T):
        run = np.where(col, run + 1, 0)
        newly = (run == N) & (when == exceed.shape[1])
        when[newly] = i + 1
    return when

for delta in [2.0, 4.0, 6.0]:          # fault size, in sigmas
    row = []
    for N in [1, 2, 3, 4]:
        exceed = np.abs(rng.standard_normal((trials, max_wait)) + delta) > Z
        row.append(f"N={N}: {samples_to_declare(exceed, N).mean():5.1f}")
    print(f"fault {delta:.0f} sigma -> mean samples to declare  " + "  ".join(row))
# fault 2 sigma -> mean samples to declare  N=1:  15.0  N=2: 194.4  N=3: 378.8  N=4: 398.6
# fault 4 sigma -> mean samples to declare  N=1:   1.5  N=2:   3.6  N=3:   6.6  N=4:  10.9
# fault 6 sigma -> mean samples to declare  N=1:   1.0  N=2:   2.0  N=3:   3.0  N=4:   4.1
```

For a big, obvious fault ($6$ sigma), almost every sample crosses the threshold, so $N = 4$ costs about four samples — a fifth of a second at $20\,\mathrm{Hz}$. Negligible.

For a marginal fault ($2$ sigma), the residual only crosses $3.5$ when noise adds another $1.5$ sigma, about $6.7\%$ of samples. Runs of several such samples are rare. The $N = 3$ and $N = 4$ numbers sit near $400$ only because the simulation gave up there; most runs never declared at all. The exact average wait for $N$ in a row is $\frac{1 - p^N}{(1-p)\,p^N}$ samples, with $p = 0.0668$. For $N = 3$ that is about $3{,}600$ samples, three minutes. For $N = 4$ it is about $54{,}000$ samples — around $45$ minutes. The closer a fault sits to the noise, the more the same $N$ costs.
:::

::: key
Why every fault monitor needs a persistence counter: noise crosses any threshold occasionally. Requiring $N$ consecutive exceedances trades detection latency against false-alarm rate; hysteresis on the clear side stops a unit oscillating in and out of the solution.
:::

## Why a slow drift embarrasses a fixed-threshold monitor

Everything so far assumed a fault that jumps to full size at once — a **step**. Real sensors more often degrade by a slow **[[drift|bias-drift]]**. A drift is not simply a small step. Its size at the moment you most need to catch it is small, even if its final size is large.

::: example A ramp takes far longer to declare than a step to the same size
The fault grows steadily to $6$ sigma over a given time, then stays there. The monitor uses $N = 3$.

```python
import numpy as np

Z, FS, N, final_delta, trials = 3.5, 20.0, 3, 6.0, 3000
rng = np.random.default_rng(11)

def samples_to_declare(exceed, N):
    run = np.zeros(exceed.shape[0], dtype=int)
    when = np.full(exceed.shape[0], exceed.shape[1])
    for i, col in enumerate(exceed.T):
        run = np.where(col, run + 1, 0)
        newly = (run == N) & (when == exceed.shape[1])
        when[newly] = i + 1
    return when

for ramp_s in [0.0, 5.0, 20.0, 60.0]:
    ramp_n = max(1, int(ramp_s * FS))
    n = ramp_n + 200
    size = np.minimum(np.arange(1, n + 1) / ramp_n, 1.0) * final_delta   # grows to 6 sigma, then stays
    exceed = np.abs(rng.standard_normal((trials, n)) + size) > Z
    t = samples_to_declare(exceed, N).mean() / FS
    label = "step" if ramp_s == 0 else f"ramp over {ramp_s:.0f} s"
    print(f"{label:>16}: mean time to declare = {t:6.2f} s")
#             step: mean time to declare =   0.15 s
#    ramp over 5 s: mean time to declare =   3.04 s
#   ramp over 20 s: mean time to declare =  10.48 s
#   ramp over 60 s: mean time to declare =  28.34 s
```

A step to $6$ sigma is declared in $0.15\,\mathrm{s}$: three samples at $20\,\mathrm{Hz}$. The same final size, reached by a 60-second ramp, takes about $28\,\mathrm{s}$. Nearly half the ramp passes with the fault present, growing, and undeclared.

Sanity check: at $28\,\mathrm{s}$ into a 60-second ramp, the fault is $6 \times 28/60 \approx 2.8$ sigma. That is roughly where a fault starts crossing $3.5$ often enough to string three in a row. So the result makes sense.

If the flight phase you are protecting is shorter than that — a burn, a final approach — a slow drift can outlast the whole phase without ever being declared. A step of the same final size would have been caught almost at once.
:::

::: warning
Monitors are usually characterized against step faults, because steps are easy to inject and easy to reason about. Test against a slow ramp too, at the size and rate a real degradation would plausibly have. The two are not remotely equivalent, and a monitor tuned only on steps can look excellent on paper while missing the fault that actually happens.
:::

## Hysteresis: a second threshold to stop chattering

A persistence counter controls how a fault is *declared*. It says nothing about how a fault is *cleared*. Suppose a residual hovers right around the threshold. If the same threshold is used to declare and to clear, noise pushes it back and forth across the line, and the fault flag flips on and off many times a second. Engineers call this **chattering**.

**Hysteresis** fixes it with two thresholds, the way a **[[thermostat|thermostat]]** does: a higher one to declare, and a clearly lower one to clear. Once a fault is declared, the residual must fall well below the declare line before the system calls it resolved.

::: example Hysteresis gap versus how often the fault is re-declared
The residual hovers exactly at the declare threshold, $3.5$ sigma — the worst case.

```python
import numpy as np

declare_z, level, duration, trials = 3.5, 3.5, 2000, 800   # residual hovers right at the threshold
rng = np.random.default_rng(3)

for gap in [0.0, 1.0, 2.0]:
    clear_z = declare_z - gap
    v = rng.standard_normal((trials, duration)) + level
    state = np.zeros(trials, dtype=bool)
    flips = np.zeros(trials, dtype=int)
    for col in v.T:
        declare = ~state & (col > declare_z)
        clear = state & (col < clear_z)
        flips += declare
        state = (state | declare) & ~clear
    print(f"gap {gap:.1f} (declare {declare_z}, clear {clear_z:.1f}): mean declarations in {duration} samples = {flips.mean():.1f}")
# gap 0.0 (declare 3.5, clear 3.5): mean declarations in 2000 samples = 500.0
# gap 1.0 (declare 3.5, clear 2.5): mean declarations in 2000 samples = 242.0
# gap 2.0 (declare 3.5, clear 1.5): mean declarations in 2000 samples = 43.7
```

With no gap, the monitor declares a fresh fault $500$ times in $2000$ samples — once every four samples, clearing in between. The flag is chattering almost continuously.

With a gap of $2$ sigma (clear at $1.5$), that drops to about $44$, more than ten times fewer. The residual now has to travel much further before the state can change again. The right gap, like the right $N$, is chosen against how much chattering the downstream logic can stand — a mode transition, a decision to drop a sensor. It is not fixed by habit.
:::

## Check against something independent

Some faults defeat every check a sensor can run on itself. A **[[star tracker|star-tracker]]** can report an attitude that is self-consistent, flagged healthy by its own electronics, and wrong by several degrees. Its health flag is its opinion of itself. A unit's self-reported health is never enough.

Detection has to come from outside the unit: a **physically independent** measurement of the same quantity. For attitude, the natural partner is the gyro — integrate the gyro rates forward from the last good attitude and compare. The two sensors fail for different reasons, so a large, persistent residual between them means something. Then the full chain applies: a residual monitor with a persistence counter to ignore noise, and hysteresis so the unit does not flicker in and out of the solution.

Once the bad unit is isolated, the filter stops using it and continues on the remaining sources. Its covariance grows honestly to reflect the lost information. And the event goes to telemetry, so the ground can decide what happened.

::: warning
When a residual monitor keeps complaining, it is tempting to increase the measurement noise the filter assumes for that sensor until the complaints stop. Do not. A bigger $\mathbf S$ makes NIS smaller, so the monitor goes quiet — while the bad data keeps flowing into the state estimate. You have not fixed the fault; you have switched off the alarm.
:::

## FDIR as a pipeline, not a single check

The three letters of FDIR name three separate jobs.

- **Detection** — a monitor says something is wrong. This lesson's residual test and persistence counter.
- **Isolation** — decide *which* unit is to blame. Easy with a single sensor, since there is only one suspect. With several redundant sources it is lesson 6's voting problem, and lesson 7 showed where that breaks.
- **Recovery** — reconfigure and continue: stop using the bad source, switch to a remaining one, or escalate to the mode manager's safe transition (lesson 2). Assigning that response, failure mode by failure mode, is the job of an FMEA, which comes next in lesson 10.

A monitor that detects but cannot say which unit is at fault leaves the vehicle knowing only that *something* is wrong — it cannot reconfigure around it.

::: key
FDIR: Fault Detection, Isolation and Recovery. Detection: a monitor says something is wrong. Isolation: identify which unit. Recovery: reconfigure and continue. Detection without isolation is an alarm, not a fault management system.
:::

## Check yourself

::: check
A whitened residual is $z = 2.6$, and the filter's noise model is correct. The threshold is $3.5$. Does this sample declare a fault with $N = 1$? What would have to be true for a sample to declare with $N = 3$?
:::

::: answer
No. $2.6$ is below $3.5$, so the sample does not cross the threshold at all, with any $N$. It is a slightly large but ordinary healthy residual — healthy noise lands beyond $2.6$ about $1\%$ of the time. And because it is below the threshold, it would also reset any persistence count to zero. For a declaration with $N = 3$, a sample must exceed $3.5$ *and* be the third in an unbroken run of samples that all exceed $3.5$.
:::

::: check
Without re-running the simulation, explain why requiring two consecutive exceedances instead of one cuts the false-alarm chance by roughly a factor of $p_{fa,1}$, not merely by half.
:::

::: answer
Healthy samples are close to independent, so the chance of two exceedances in a row is the product of the two single chances, $p_{fa,1} \times p_{fa,1} = p_{fa,1}^2$. That is the old chance multiplied by $p_{fa,1}$ itself, about $5 \times 10^{-4}$ here — a cut of roughly two thousand times, not two. Each extra required sample multiplies by $p_{fa,1}$ again, so false alarms fall geometrically with $N$, not linearly.
:::

::: check
A monitor tested only against instant step faults shows excellent detection latency in every test. A colleague says this proves it is well tuned for flight. What does the ramp-versus-step result say?
:::

::: answer
It proves nothing about drifts. A fault that reaches the same final size by a slow ramp can take many times longer to declare — in this lesson's 60-second case, about $28\,\mathrm{s}$ against $0.15\,\mathrm{s}$ — because for most of the ramp the fault is small. Real sensors usually degrade by drifting, so a monitor validated only on steps has no evidence about the failure most likely to happen, and can pass every bench test while missing it in flight.
:::

::: check
A monitor uses the same number for its declare and clear thresholds. When does its fault flag change state many times per second, and what is wrong with that even if each individual change was, by the rule, correct?
:::

::: answer
It happens when the residual hovers near that single threshold, so ordinary noise pushes it back and forth across the line and each crossing correctly flips the flag. The trouble is not correctness at each instant but usefulness: a flag flipping many times a second cannot drive a mode change, a sensor switch, or a display anyone can act on. A separate, lower clear threshold — hysteresis — makes the flag change only when the underlying condition has really changed.
:::

::: check
Match detection, isolation and recovery to the mechanism in this module that mainly implements each. In one sentence, why is isolation easy for a single sensor but not for a triad?
:::

::: answer
Detection: the residual test and persistence counter from this lesson. Isolation: voting across redundant sources, from lessons 6 and 7. Recovery: the response assigned to each failure mode by an FMEA, lesson 10. Isolation is easy for one sensor because there is only one suspect the moment a fault is detected, whereas a triad must work out *which* of several disagreeing sources is wrong — solvable for an ordinary fault, and defeated by a common-mode or Byzantine one.
:::

## Summary

| Term | Meaning |
| --- | --- |
| Residual / innovation | $\boldsymbol\nu = \mathbf z - h(\hat{\mathbf x})$: measurement minus the filter's prediction of it |
| NIS | $\boldsymbol\nu^\top\mathbf S^{-1}\boldsymbol\nu$; chi-squared under $H_0$, mean equal to the measurement dimension |
| False alarm (Type I) | Declaring a fault when the sensor is healthy |
| Missed detection (Type II) | Failing to declare when the sensor really is faulty |
| Single-sample test | $4.65 \times 10^{-4}$ per sample at $3.5$ sigma; about $5.6$ false alarms in $12{,}000$ samples |
| Persistence counter | $N$ in a row; false alarms fall roughly as $p_{fa,1}^N$, at the cost of latency |
| Latency | Small for big faults; grows enormously as the fault nears the noise |
| Ramp versus step | A slow drift takes far longer to declare than a step to the same size |
| Hysteresis | A separate, lower clear threshold; stops chattering |
| Independent cross-check | Self-reported health is never enough; compare with a physically independent source |
| FDIR | Detection → isolation → recovery; detection alone is only an alarm |

The next lesson turns detection into a systematic account: an FMEA that gives every failure mode a detection means and a software response, a fault tree that combines small probabilities into the risk of the worst outcome, and the abort decision that some of those responses finally feed.

::: context innovation Why "innovation"
The word means "the new part". A filter predicts each measurement before it arrives. Whatever the measurement contains that the prediction did not is the genuinely new information — the innovation. It is the only part of the measurement the filter learns anything from.

That is also why it makes a good health check. If the filter's model is right, the innovations should look like pure noise of the size $\mathbf S$ predicts. Innovations that are too big, or that keep leaning one way, mean the model and the sensor no longer agree.
:::

::: context chi-squared The shape of healthy NIS
Add up the squares of $k$ independent standard normal numbers and the total follows a chi-squared distribution with $k$ degrees of freedom. Its mean is $k$. NIS is exactly such a sum once the residual is whitened, so for healthy 3-axis data it averages $3$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="30,120.0 36,49.6 42,32.1 49,25.0 55,23.2 61,24.5 68,27.7 74,32.0 80,37.0 86,42.3 92,47.7 99,53.1 105,58.3 111,63.4 118,68.1 124,72.6 130,76.8 136,80.7 142,84.3 149,87.7 155,90.7 161,93.5 168,96.1 174,98.4 180,100.5 186,102.5 192,104.2 199,105.8 205,107.3 211,108.5 218,109.7 224,110.8 230,111.7 236,112.6 242,113.4 249,114.1 255,114.7 261,115.2 268,115.7 274,116.2 280,116.6 286,117.0 292,117.3 299,117.6 305,117.8 311,118.1 318,118.3 324,118.5 330,118.6" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="105" y1="120" x2="105" y2="58" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4,3"/>
  <line x1="218" y1="120" x2="218" y2="90" stroke="#b4232c" stroke-width="2"/>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="30" y="136">0</text><text x="105" y="136">3 (mean)</text><text x="330" y="136">12</text>
  </g>
  <text x="218" y="136" font-size="11" text-anchor="middle" fill="#b4232c">7.5</text>
  <text x="222" y="84" font-size="11" fill="#b4232c">beyond here: 5.8%</text>
</svg>
```

The curve has a long right tail, so single large values happen. The $7.5$ from the worked example sits in that tail: unusual, not impossible.
:::

::: context whitened What "whitened" means
To **whiten** a residual is to divide it by its own expected standard deviation, so that a healthy value is a plain standard normal number: average $0$, spread $1$. Then "$z = 3.5$" means "three and a half standard deviations", the same meaning for a gyro in degrees per second or an altimeter in meters.

The name comes from "white noise", noise with no pattern from one sample to the next and a standard size. For a scalar, $z^2$ is exactly the NIS.
:::

::: context two-errors The two ways to be wrong, drawn
The healthy residual (blue) and the faulty residual (gray) are both spread out by noise. The threshold (red line) cuts between them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <polygon points="177.5,84.1 186.2,92.7 195,99.2 203.8,103.7 212.5,106.5 221.2,108.2 230,109.1 247.5,109.8 247.5,110 177.5,110" fill="#b4232c" opacity="0.5"/>
  <polygon points="107.5,109.8 116.2,109.6 125,109.1 133.8,108.2 142.5,106.5 151.2,103.7 160,99.2 168.8,92.7 177.5,84.1 177.5,110 107.5,110" fill="#f2b880"/>
  <polyline points="20.0,109.1 28.8,108.2 37.5,106.5 46.2,103.7 55.0,99.2 63.8,92.7 72.5,84.1 81.2,73.5 90.0,61.6 98.8,49.8 107.5,39.6 116.2,32.7 125.0,30.2 133.8,32.7 142.5,39.6 151.2,49.8 160.0,61.6 168.8,73.5 177.5,84.1 186.2,92.7 195.0,99.2 203.8,103.7 212.5,106.5 221.2,108.2 230.0,109.1 238.8,109.6 247.5,109.8 256.2,109.9 265.0,110.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline points="90.0,110.0 98.8,109.9 107.5,109.8 116.2,109.6 125.0,109.1 133.8,108.2 142.5,106.5 151.2,103.7 160.0,99.2 168.8,92.7 177.5,84.1 186.2,73.5 195.0,61.6 203.8,49.8 212.5,39.6 221.2,32.7 230.0,30.2 238.8,32.7 247.5,39.6 256.2,49.8 265.0,61.6 273.8,73.5 282.5,84.1 291.2,92.7 300.0,99.2 308.8,103.7 317.5,106.5 326.2,108.2 335.0,109.1" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <line x1="20" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="177.5" y1="18" x2="177.5" y2="116" stroke="#b4232c" stroke-width="2"/>
  <text x="125" y="22" font-size="11" text-anchor="middle" fill="#1d6fd1">healthy</text>
  <text x="230" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">faulty</text>
  <text x="177.5" y="130" font-size="11" text-anchor="middle" fill="#b4232c">threshold</text>
  <text x="250" y="143" font-size="11" text-anchor="middle" fill="#b4232c">false alarm</text>
  <text x="105" y="143" font-size="11" text-anchor="middle" fill="#1f2a44">missed detection (orange)</text>
</svg>
```

The red area is the healthy tail beyond the line: false alarms. The orange area is the faulty curve's tail short of the line: missed detections. Slide the line right and red shrinks while orange grows.
:::

::: context independent-samples Why the chances multiply
Flip a coin twice. The chance of two heads is $\frac{1}{2} \times \frac{1}{2} = \frac{1}{4}$, because the second flip does not care about the first. Events like that are **independent**.

Healthy sensor noise is close to independent from one sample to the next, so the same rule applies to exceedances. Real noise is not perfectly independent: vibration or a slowly wandering bias can make neighboring samples lean the same way. Then runs happen more often than $p^N$ predicts, which is why engineers confirm the false-alarm rate on real recorded data, not only on the formula.
:::

::: context bias-drift How real sensors degrade
A gyro's **bias** is the small rate it reports when it is not rotating at all. Every gyro's bias wanders slowly, and a failing one — an aging light source in a fiber-optic gyro, a damaged mechanism in a vibrating one, a heater that stopped working — often shows up first as a bias creeping steadily away from its calibrated value.

That creep is a ramp. For seconds or minutes it hides inside the noise, then climbs past it. The filter may even partly absorb it by estimating a bias state, which makes the residual smaller still. That is why drift is the case this module's FDIR exercise warns will embarrass you.
:::

::: context thermostat Hysteresis in your house
A home thermostat set to $20^\circ\mathrm{C}$ does not switch the heater on at $19.99$ and off at $20.01$; the heater would click hundreds of times an hour. It turns on at, say, $19.5$ and off at $20.5$. The gap between the two is the hysteresis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="40" x2="340" y2="40" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6,4"/>
  <line x1="20" y1="80" x2="340" y2="80" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="6,4"/>
  <text x="338" y="34" font-size="11" text-anchor="end" fill="#b4232c">declare</text>
  <text x="338" y="94" font-size="11" text-anchor="end" fill="#1d6fd1">clear</text>
  <polyline points="20,100 60,95 90,60 110,35 140,55 170,45 200,65 230,90 260,95 300,70 340,60" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <rect x="106" y="118" width="112" height="12" fill="#f2b880"/>
  <text x="162" y="144" font-size="11" text-anchor="middle" fill="#1f2a44">fault flag on</text>
</svg>
```

The flag turns on where the residual crosses the upper line and stays on while it wanders between the lines. It turns off only when the residual drops below the lower line. The later rise past the lower line alone does nothing.
:::

::: context star-tracker What a star tracker is
A **star tracker** is a small camera that photographs the sky, matches the pattern of stars against a catalog, and reports which way the spacecraft is pointing, often to a few arcseconds. It is the most accurate attitude sensor most spacecraft carry.

It can be fooled. Sunlight or Earth glare in the lens, a bright planet, or a stray reflection can lead it to match the wrong pattern — and a wrong match can look perfectly confident. A gyro cannot be fooled by glare, which is exactly why pairing the two makes a strong cross-check.
:::
