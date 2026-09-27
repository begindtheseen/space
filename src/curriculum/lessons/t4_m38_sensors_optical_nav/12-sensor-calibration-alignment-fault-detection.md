---
id: l12-sensor-calibration-alignment-fault-detection
title: Sensor calibration, alignment estimation, and fault detection
minutes: 25
covers:
  - 'Sensor calibration, alignment estimation, and fault detection'
---

Step on a bathroom scale with nothing in your hands and it reads $0.4\,\mathrm{kg}$ before you have even put your weight on it. You know what to do: subtract $0.4$ from everything it says, or turn the little wheel until it reads zero. Now picture a camera strapped to a bike helmet, tilted one degree to the side. Every video comes out tilted by that same degree, always the same way. And picture a friend who is usually reliable but one day tells you, perfectly calmly, that he saw a shark in the swimming pool.

Those are the three problems of this lesson. The scale needs **calibration**: finding and removing a sensor's known quirks. The helmet camera has a **misalignment**: it is mounted a little crooked, so everything it reports is off by the same small turn. And the friend's shark is a **fault**: a reading that is plain wrong, delivered with the same confidence as a good one.

Every sensor in this module assumed its own numbers could be trusted: the intrinsics a camera was calibrated with, the hard-iron and soft-iron correction a magnetometer was fitted with, the direction a star tracker was mounted along. None of that trust survives a real vehicle unchecked. A lens's calibration drifts with temperature. A mounting bracket flexes by a few arcseconds between a cold eclipse and a sunlit orbit. And any sensor can fail in flight: a connector works loose, a detector pixel dies, a stray reflection convinces a ranging sensor of a range that is not there. This closing lesson takes up what a mission does about all three.

## Calibration: fit the few numbers that make a sensor honest

A sensor's raw output is not the physical quantity itself. It is related to it by a **sensor model** with a few free numbers — an offset, a scale, a small distortion. **Calibration** means measuring those numbers by comparing the sensor with a truth known some other way, then undoing them.

The simplest model is a straight line: reading $=$ scale $\times$ truth $+$ offset. The **offset** is what the sensor reads when the truth is zero, like the bathroom scale's $0.4\,\mathrm{kg}$; zeroing it is sometimes called the **[[tare|tare]]**. The **scale factor** says whether the sensor reads a little too big or too small for every unit of truth.

::: example A two-point calibration
A spring scale is tested with two known weights. A $1\,\mathrm{kg}$ weight reads $1.07\,\mathrm{kg}$. A $3\,\mathrm{kg}$ weight reads $3.13\,\mathrm{kg}$. Find its scale factor and offset, and correct a reading of $2.10\,\mathrm{kg}$.

**The scale factor** is how much the reading changes per kilogram of truth. The truth rose by $2\,\mathrm{kg}$ and the reading rose by $3.13 - 1.07 = 2.06$, so the scale factor is $2.06/2 = 1.03$. The scale reads 3 percent too big.

**The offset** is what is left once the scale is accounted for. At $1\,\mathrm{kg}$ the scaled truth is $1.03 \times 1 = 1.03$, and the scale read $1.07$, so the offset is $1.07 - 1.03 = 0.04\,\mathrm{kg}$.

**Correct a reading.** Undo the model in reverse order: subtract the offset, then divide by the scale. For a reading of $2.10$: $(2.10 - 0.04)/1.03 = 2.00\,\mathrm{kg}$.

**Sanity check.** Put the second weight back through: $(3.13 - 0.04)/1.03 = 3.00$. The calibration returns both known weights exactly, as a two-number fit to two points must.
:::

Two lessons in this module already did bigger versions of this. The magnetometer's **ellipsoid fit** found a hard-iron offset (three numbers) and a soft-iron distortion matrix from nothing but a tumble and the shape the readings traced. The camera's **radial distortion** model found how a lens bends straight lines, from a handful of coefficients fitted against a known pattern. Both are the same idea in different clothing: a sensor model with a few free parameters, fitted against data whose truth is known another way. Every sensor needs some version of this step before its measurement model can be trusted.

## Alignment: the error ground testing cannot finish

One error survives even a careful ground calibration. A star tracker's **boresight** (the direction it looks along), a gyro package's sensing axes and the vehicle's own reference frame are each set by a physical mounting. No mounting is built exactly to the drawing. And even the mounting it is built to shifts as the vehicle moves between sunlight and shadow: heat **[[flexes the bracket|thermal-flex]]** by a small, slowly changing amount that no ground test at one fixed temperature can fully predict.

Left uncorrected, this misalignment does not add *noise* to the attitude. It adds a **[[bias|bias-vs-noise]]**: the same error, in the same direction, every time — like the tilted helmet camera.

In symbols, let $\mathbf{A}_{\text{true}}$ be the vehicle's true attitude matrix, and let the tracker's mounting frame be turned from the vehicle frame by a small fixed rotation $\delta\mathbf{A}$ (read "delta A"). Then every attitude the tracker reports is

$$
\mathbf{A}_{\text{tracker}} = \delta\mathbf{A}\,\mathbf{A}_{\text{true}}.
$$

A filter that treats the tracker's output as the vehicle's attitude inherits $\delta\mathbf{A}$ exactly, every time, whatever the vehicle is doing. Multiply both sides on the right by $\mathbf{A}_{\text{true}}^\mathsf{T}$ and the true attitude drops out:

$$
\mathbf{A}_{\text{tracker}}\,\mathbf{A}_{\text{true}}^\mathsf{T} = \delta\mathbf{A}.
$$

::: note Why it has to be true
Substitute the model into the left side: $\mathbf{A}_{\text{tracker}}\mathbf{A}_{\text{true}}^\mathsf{T}=(\delta\mathbf{A}\,\mathbf{A}_{\text{true}})\mathbf{A}_{\text{true}}^\mathsf{T}$. Matrix products can be regrouped, so this is $\delta\mathbf{A}\,(\mathbf{A}_{\text{true}}\mathbf{A}_{\text{true}}^\mathsf{T})$. An attitude matrix is a rotation, and a rotation's transpose is its inverse, so $\mathbf{A}_{\text{true}}\mathbf{A}_{\text{true}}^\mathsf{T}=\mathbf{I}$, the identity. What is left is $\delta\mathbf{A}\,\mathbf{I}=\delta\mathbf{A}$. The true attitude cancels completely, which is why the comparison gives the same answer at every attitude.
:::

That cancellation is what makes the misalignment **estimable**. In flight nobody knows $\mathbf{A}_{\text{true}}$, but the vehicle has an independent reference: the attitude propagated from the gyros, $\mathbf{A}_{\text{gyro}}$. Compare the two at several times $t_k$:

$$
\mathbf{A}_{\text{tracker}}(t_k)\,\mathbf{A}_{\text{gyro}}(t_k)^\mathsf{T} \approx \delta\mathbf{A}.
$$

It should return the *same* small rotation every time. Here is the subtle part. Engineers sweep the vehicle through several genuinely different attitudes, a **calibration slew**, rather than taking many readings at one attitude. More readings do average down the noise, but that is not the main point. The sweep is the *diagnostic*. A discrepancy that stays constant as the vehicle turns is a fixed mechanical misalignment. One that changes with the vehicle's orientation — say, with where the Sun is — points to a thermal or other attitude-dependent effect instead. At a single attitude the two look identical, and no number of repeats could tell them apart.

There are two ways to use this. The mission can run a calibration slew now and then and upload the correction. Or the filter can carry the misalignment as **[[extra filter states|filter-states]]** — three more small angles it estimates all the time, alongside attitude and gyro bias — so it follows slow thermal drift on its own.

::: example An uncorrected bias, and what a calibration slew recovers
A star tracker is mounted $0.03^\circ$ off, which is $0.03 \times 3600 = 108$ arcseconds. First, see what that does to an uncorrected filter.

```python
import numpy as np

def rotation(axis, ang):
    k = np.asarray(axis, float) / np.linalg.norm(axis)
    K = np.array([[0,-k[2],k[1]],[k[2],0,-k[0]],[-k[1],k[0],0]])
    return np.eye(3) + np.sin(ang)*K + (1-np.cos(ang))*K@K

def small_angle_vec(R):
    return 0.5*np.array([R[2,1]-R[1,2], R[0,2]-R[2,0], R[1,0]-R[0,1]])

arcsec = np.radians(1/3600)
delta_A_true = rotation([0.4,-0.2,0.9], np.radians(0.03))    # a 108-arcsec as-built mounting error

# an uncorrected filter treats the tracker's reading as the vehicle attitude directly:
A_true_new = rotation([0.1,0.3,0.9], 1.4)
naive_estimate = delta_A_true @ A_true_new
bias = naive_estimate @ A_true_new.T
print("uncorrected attitude bias magnitude (arcsec):",
      round(np.degrees(np.arccos(np.clip((np.trace(bias)-1)/2,-1,1)))*3600, 1))
# uncorrected attitude bias magnitude (arcsec): 108.0
```

**The bias.** The attitude error is exactly $108.0''$ — the misalignment, to the digit, as the algebra above predicts. At a target $1\,\mathrm{km}$ away, $108''$ of pointing error misses by about half a meter.

Now estimate $\delta\mathbf{A}$. Each comparison has $5''$ of random noise, from the tracker's own accuracy. Here the reference is the true attitude, standing in for a perfect gyro. Compare one attitude with an average over eight different ones, two thousand times over.

```python
rng = np.random.default_rng(31)
true_vec = small_angle_vec(delta_A_true)
sigma_meas = 5*arcsec       # per-comparison noise, from the tracker's own cross-boresight accuracy
n_attitudes, trials = 8, 2000
single_err, avg_err = [], []
for _ in range(trials):
    attitudes = [rotation(rng.standard_normal(3), rng.uniform(0.2, 2.5)) for _ in range(n_attitudes)]
    offsets = []
    for A_true in attitudes:
        A_tracker_noisy = rotation(rng.standard_normal(3), rng.normal(0, sigma_meas)) @ (delta_A_true @ A_true)
        offsets.append(small_angle_vec(A_tracker_noisy @ A_true.T))
    offsets = np.array(offsets)
    single_err.append(np.linalg.norm(offsets[0] - true_vec))
    avg_err.append(np.linalg.norm(offsets.mean(axis=0) - true_vec))

single_err, avg_err = np.array(single_err), np.array(avg_err)
print("RMS error, one attitude:          ", round(np.sqrt(np.mean(single_err**2))/arcsec, 2), "arcsec")
print(f"RMS error, {n_attitudes}-attitude average:", round(np.sqrt(np.mean(avg_err**2))/arcsec, 2), "arcsec")
print("expected sqrt(8) improvement:", round(np.sqrt(n_attitudes), 3), " actual:",
      round(np.sqrt(np.mean(single_err**2))/np.sqrt(np.mean(avg_err**2)), 3))
# RMS error, one attitude:           4.96 arcsec
# RMS error, 8-attitude average: 1.77 arcsec
# expected sqrt(8) improvement: 2.828  actual: 2.807
```

**One attitude** pins the misalignment to about $4.96''$ — about the $5''$ comparison noise, as it should be. **Eight attitudes** pin it to $1.77''$.

**Sanity check.** Averaging $N$ independent readings shrinks random error by $\sqrt{N}$, and $\sqrt{8} = 2.828$. The simulation found $4.96/1.77 \approx 2.80$, and $2.807$ from the unrounded values. It is the same square-root rule every averaging argument in this course has produced, applied to a mounting bracket instead of a photon count.
:::

::: key Sensor alignment estimation
The mounting alignment between a star tracker, the IMU and the vehicle frame is never exactly as built and shifts with thermal load. An uncorrected alignment error is a pure attitude bias, not noise: $\mathbf{A}_{\text{tracker}}=\delta\mathbf{A}\,\mathbf{A}_{\text{true}}$. Estimate the misalignment as filter states or calibrate it in flight, by comparing the sensor with an independent reference, $\mathbf{A}_{\text{tracker}}\mathbf{A}_{\text{gyro}}^\mathsf{T}\approx\delta\mathbf{A}$, across several genuinely different attitudes. A discrepancy that stays constant across that sweep is the misalignment itself.
:::

::: warning
Averaging many readings at one attitude shrinks the noise, but it cannot tell a true mounting misalignment from an effect that depends on attitude, such as sunlight heating one side. Only a sweep through different attitudes can. A calibration taken at one attitude can look beautifully precise and still be wrong.
:::

## Fault detection: when a sensor lies convincingly

A misaligned sensor still tells something close to the truth. A faulty one does not, and the filter has to notice.

Think of a smoke alarm. It does not know what a fire is. It knows what normal air looks like, and it sounds when the air is far outside normal. Set it too sensitive and it goes off every time you make toast. Set it too dull and it misses the fire. Fault detection in a filter works the same way.

The filter already predicts what each measurement should be, and how far off it may reasonably be. The previous lesson called the difference the innovation, $\boldsymbol{\nu}_k$ (the subscript $k$ counts time steps). The filter also computes the innovation's expected spread, its **innovation covariance** $\mathbf{S}_k$ — the prediction's own uncertainty plus the sensor noise. Divide one by the other, squared, and you get the **normalized innovation squared**, or **NIS**:

$$
\epsilon_k = \boldsymbol{\nu}_k^\mathsf{T}\,\mathbf{S}_k^{-1}\,\boldsymbol{\nu}_k.
$$

For a single number it is $\nu^2/S$: the surprise, measured in standard deviations, then squared. A surprise of $1$ standard deviation gives $1$; a surprise of $3$ gives $9$.

When the filter's picture of its own uncertainty is honest, $\epsilon_k$ follows a **[[chi-square distribution|chi-square]]** whose **degrees of freedom** equal the number of values in the measurement — one for a range, two for a pixel. Its average is that number. So a threshold can be read off a table: for one degree of freedom, a value above $10.83$ happens by chance only $0.1$ percent of the time. The Kalman filter module's consistency lesson built this test to check a filter's health. The same test catches a sensor breaking it. A false star match, a magnetometer glitch from a current spike, a **[[multipath|multipath]]** echo off a structure the docking sensor was not aimed at — each drives the NIS far above anything the filter's covariance predicts.

::: example A multipath echo, caught by the consistency test
A docking sensor measures range to a target closing at $3\,\mathrm{m/s}$ from $80\,\mathrm{m}$, with $0.2\,\mathrm{m}$ of noise, every $0.5\,\mathrm{s}$. The filter tracks range and closing rate. At step $25$ the sensor reports an echo that bounced off a nearby structure first: $6\,\mathrm{m}$ too long.

```python
import numpy as np
from scipy.stats import chi2

rng = np.random.default_rng(42)
dt, q = 0.5, 0.02
F = np.array([[1.0, dt],[0.0, 1.0]])
Q = q*np.array([[dt**3/3, dt**2/2],[dt**2/2, dt]])
H = np.array([[1.0, 0.0]])
R = np.array([[0.04]])                     # 0.2 m range sigma, a docking sensor's own noise

x_true = x_plus = np.array([80.0, -3.0])   # range (m), closing rate (m/s)
P_plus = np.diag([1.0, 0.5])
n_steps, fault_step = 40, 25
nis_values = []

for k in range(n_steps):
    x_true = F @ x_true + rng.multivariate_normal(np.zeros(2), Q)
    z = (H @ x_true)[0] + rng.normal(0, np.sqrt(R[0,0]))
    if k == fault_step:
        z += 6.0                            # a multipath return, six metres off -- a fault, not noise
    x_minus, P_minus = F @ x_plus, F @ P_plus @ F.T + Q
    nu = z - H @ x_minus
    S = H @ P_minus @ H.T + R
    K = P_minus @ H.T @ np.linalg.inv(S)
    x_plus = x_minus + K @ nu
    P_plus = (np.eye(2) - K @ H) @ P_minus
    nis_values.append(float(nu @ np.linalg.inv(S) @ nu))

nis_values = np.array(nis_values)
threshold = chi2.ppf(0.999, df=1)
print("chi-square(1 dof) 99.9% threshold:", round(threshold, 3))
print("mean NIS, steps before the fault:", round(nis_values[:fault_step].mean(), 3))
print("NIS at the fault step and the next three:", np.round(nis_values[fault_step:fault_step+4], 2))
print("steps flagged above threshold:", np.where(nis_values > threshold)[0].tolist())
# chi-square(1 dof) 99.9% threshold: 10.828
# mean NIS, steps before the fault: 0.396
# NIS at the fault step and the next three: [464.22 193.3   75.13  15.34]
# steps flagged above threshold: [25, 26, 27, 28]
```

**Before the fault**, every NIS value sits well below the $10.828$ threshold.

**At the fault** it reaches $464$, more than forty times the threshold. Take the square root to see it in standard deviations: $\sqrt{464.22} = 21.5$. The echo was $21.5$ standard deviations from the prediction — not noise by any stretch.

**After the fault** the NIS does not drop straight back. This filter *accepted* the bad measurement, and it dragged the range estimate about $3\,\mathrm{m}$ off. The next few measurements are good, but they are compared with a prediction that is still recovering, so they trip the same test at steps $26$, $27$ and $28$ before the filter settles.

**Sanity check.** The six-meter error against a spread of about $0.28\,\mathrm{m}$ gives $6/0.28 \approx 21$ standard deviations, matching the $21.5$ above.
:::

That recovery tail is a real problem: one fault can look like a string of four. The fix is to use the test as a **gate** — compute the NIS *before* the update, and if it fails, throw the measurement away instead of using it.

::: example Gate before you update
Run the same filter twice on the same random numbers: once as before, and once with a gate that skips the update whenever the NIS is over the threshold, keeping the prediction instead.

```python
import numpy as np
from scipy.stats import chi2

def run(gate):
    rng = np.random.default_rng(42)          # same random numbers as before
    dt, q = 0.5, 0.02
    F = np.array([[1.0, dt],[0.0, 1.0]])
    Q = q*np.array([[dt**3/3, dt**2/2],[dt**2/2, dt]])
    H = np.array([[1.0, 0.0]])
    R = np.array([[0.04]])
    threshold = chi2.ppf(0.999, df=1)
    x_true = x_plus = np.array([80.0, -3.0])
    P_plus = np.diag([1.0, 0.5])
    nis_values, range_err = [], []
    for k in range(40):
        x_true = F @ x_true + rng.multivariate_normal(np.zeros(2), Q)
        z = (H @ x_true)[0] + rng.normal(0, np.sqrt(R[0,0]))
        if k == 25:
            z += 6.0
        x_minus, P_minus = F @ x_plus, F @ P_plus @ F.T + Q
        nu = z - H @ x_minus
        S = H @ P_minus @ H.T + R
        nis = float(nu @ np.linalg.inv(S) @ nu)
        nis_values.append(nis)
        if gate and nis > threshold:
            x_plus, P_plus = x_minus, P_minus    # reject the measurement, keep the prediction
        else:
            K = P_minus @ H.T @ np.linalg.inv(S)
            x_plus = x_minus + K @ nu
            P_plus = (np.eye(2) - K @ H) @ P_minus
        range_err.append(x_plus[0] - x_true[0])
    flagged = np.where(np.array(nis_values) > threshold)[0].tolist()
    return flagged, np.array(nis_values), np.array(range_err)

for gate in (False, True):
    flagged, nis, err = run(gate)
    print("gated  " if gate else "ungated", "flagged:", flagged,
          " NIS 26-28:", np.round(nis[26:29], 2), " range error after fault: %.2f m" % err[25])
# ungated flagged: [25, 26, 27, 28]  NIS 26-28: [193.3   75.13  15.34]  range error after fault: 3.01 m
# gated   flagged: [25]  NIS 26-28: [0.44 0.12 0.01]  range error after fault: -0.11 m
```

**Ungated**, the fault at step $25$ and its three-step tail are flagged, and the range estimate is left $3.01\,\mathrm{m}$ off.

**Gated**, only step $25$ is flagged. The NIS values at steps $26$ to $28$ fall to $0.44$, $0.12$ and $0.01$, all ordinary, and the range error just after the fault is about $0.1\,\mathrm{m}$ — the normal size of this filter's error.

**Sanity check.** Rejecting one measurement out of forty costs almost nothing: the filter coasts one half-second step on its prediction, and its uncertainty grows only slightly before the next good measurement shrinks it again.
:::

Two cautions keep a gate honest. First, the threshold trades missed faults against **[[false alarms|false-alarms]]**. Second, a gate only catches *sudden* faults. A sensor that degrades slowly — a bias creeping up over hours — may never produce one alarming NIS value. Flight software watches the *average* NIS over a sliding window too: in a healthy filter it hovers near the degrees of freedom, and a steady rise is the slow fault's fingerprint.

::: key Fault detection with the NIS
The normalized innovation squared $\boldsymbol{\nu}_k^\mathsf{T}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$ follows a chi-square distribution with the measurement's dimension as degrees of freedom when the filter is consistent. A faulty measurement drives it far above a chi-square threshold (for example $10.83$ at $99.9\%$ with one degree of freedom). Gate before updating, so a rejected measurement cannot corrupt the state; watch the windowed average for slow faults.
:::

::: warning
Do not update with a measurement and only then check it. If the bad measurement is used, it drags the state off course and the next several *good* measurements fail the test too, so one fault looks like many. Test first, then update.
:::

## Check yourself

::: check
Starting from $\mathbf{A}_{\text{tracker}}=\delta\mathbf{A}\,\mathbf{A}_{\text{true}}$, show that $\mathbf{A}_{\text{tracker}}\mathbf{A}_{\text{true}}^\mathsf{T}$ equals $\delta\mathbf{A}$ exactly, for any true attitude.
:::

::: answer
Substitute: $\mathbf{A}_{\text{tracker}}\mathbf{A}_{\text{true}}^\mathsf{T}=(\delta\mathbf{A}\,\mathbf{A}_{\text{true}})\mathbf{A}_{\text{true}}^\mathsf{T}=\delta\mathbf{A}\,(\mathbf{A}_{\text{true}}\mathbf{A}_{\text{true}}^\mathsf{T})=\delta\mathbf{A}\,\mathbf{I}=\delta\mathbf{A}$. The step that makes it work is $\mathbf{A}_{\text{true}}\mathbf{A}_{\text{true}}^\mathsf{T}=\mathbf{I}$, true for any rotation matrix because its transpose is its inverse. The true attitude cancels out completely, which is exactly why the comparison returns the same $\delta\mathbf{A}$ whatever attitude the vehicle was in.
:::

::: check
Why does a calibration sweep through several different attitudes instead of taking many readings while the vehicle holds one attitude?
:::

::: answer
Many readings at one attitude would still average away random noise. But they could never tell a true fixed misalignment from an effect that happens to depend on the vehicle's attitude — relative to the Sun, say — because at one attitude both look like the same constant offset. Sweeping through genuinely different attitudes and checking that the discrepancy stays the same is the real test: a constant result confirms a mounting misalignment, while a result that changes with attitude points to something else that a one-attitude test could never reveal.
:::

::: check
The single-attitude RMS error in the slew example was $4.96''$. Estimate the RMS alignment error a slew through $20$ attitudes would give, assuming the same square-root behavior found for eight.
:::

::: answer
Averaging $N$ independent comparisons divides the random error by $\sqrt{N}$. With $N=20$: $\sqrt{20}=4.472$, so the error is about $4.96/\sqrt{20} = 4.96/4.472 = 1.11$ arcseconds. That extends the square-root rule the 2000-trial simulation confirmed for eight attitudes (where it gave $1.77''$).
:::

::: check
Why does the NIS, $\boldsymbol{\nu}_k^\mathsf{T}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k$, jump so dramatically at a fault instead of rising a little above its usual range?
:::

::: answer
$\mathbf{S}_k$ is the filter's own prediction of how big the innovation *should* be. A fault such as a six-meter multipath echo gives an innovation many standard deviations outside that prediction — $21.5$ in the example. The NIS divides by $\mathbf{S}_k$ and is *squared* in the innovation, so it grows with the square of how many standard deviations off the measurement is: $21.5^2$ is about $464$. A measurement a little off gives a slightly raised value; a measurement wildly off gives an enormous one. The test is built to be that sensitive to exactly this kind of violation.
:::

::: check
The first fault-detection example flagged four steps in a row, not just the one where the fault happened. Is that a failure of the test, and what should a real system do about it?
:::

::: answer
It is not a failure of the test. It correctly reports that the filter's state was disturbed: the filter used the bad measurement, its range estimate moved about $3\,\mathrm{m}$ off, and the next few good measurements really were inconsistent with its still-wrong prediction. A real system should treat the first flagged step as the fault and the next few as its aftermath, not as new faults. Better still, it should gate: test the NIS before updating and reject the failing measurement, so the state is never disturbed. In the example, gating left only step 25 flagged and the range error at $0.1\,\mathrm{m}$ instead of $3.0\,\mathrm{m}$. Some systems also briefly raise the filter's process noise after a detected fault to help it re-converge.
:::

::: check
Compare the NIS fault test with the residual gate the star tracker lesson used against a false star match. What is the same, and what is different?
:::

::: answer
Both compare an observation with what the rest of the solution predicts, and flag whatever disagrees by more than the noise allows. The idea — check each measurement against the others' verdict — is the same. What differs is where the prediction comes from. The star tracker's gate compared a star against an attitude solved fresh from that one image, with no memory of earlier ones. The NIS compares a measurement against a prediction and covariance that a running filter has carried forward through many earlier steps. That makes the NIS test tied to the filter's own dynamics — including the recovery tail after an accepted fault — in a way a one-shot geometric check never has to consider.
:::

## Summary

| Symbol or idea | Meaning | Formula or fact |
| --- | --- | --- |
| Calibration | Fit a sensor model's few free numbers against known truth | Reading $=$ scale $\times$ truth $+$ offset; ellipsoid fit and lens distortion are bigger versions |
| $\delta\mathbf{A}$ | Mounting misalignment, a small fixed rotation | $\mathbf{A}_{\text{tracker}}=\delta\mathbf{A}\,\mathbf{A}_{\text{true}}$: a pure attitude bias, not noise |
| Alignment estimate | Compare with an independent reference | $\mathbf{A}_{\text{tracker}}(t_k)\mathbf{A}_{\text{gyro}}(t_k)^\mathsf{T}\approx\delta\mathbf{A}$, constant across attitudes |
| Calibration slew | Several distinct attitudes | Separates true misalignment from attitude-dependent effects; error falls as $1/\sqrt{N}$ |
| Misalignment as filter states | Three extra small angles in the filter | Tracks slow thermal drift continuously |
| NIS | Normalized innovation squared | $\boldsymbol{\nu}_k^\mathsf{T}\mathbf{S}_k^{-1}\boldsymbol{\nu}_k\sim\chi^2$ with the measurement's dimension as degrees of freedom |
| Gate | Test before update | Reject a measurement whose NIS exceeds the threshold (10.83 at 99.9% for one degree of freedom) |
| Recovery tail | What an accepted fault leaves behind | Elevated NIS for several steps while the disturbed state re-converges |

This module opened with a photon landing on a focal plane and closes with the habit of trusting no sensor's number — not even its own calibration — further than the data earn. The orbit determination module picks up from here: it takes the range and position fixes these instruments deliver and turns a sequence of them into a trajectory, with an honest covariance to go with it.

::: context tare An old word for "subtract the container"
Merchants have long weighed goods in a sack or crate and then taken off the weight of the empty container, called the tare. The word is usually traced back through Italian and French to an Arabic word for something set aside or deducted. The "tare" button on a kitchen scale does the same job: it makes the scale read zero with the bowl already on it, so it removes a known offset before you measure.
:::

::: context thermal-flex How heat bends a bracket by arcseconds
Metals grow when warm. Aluminum grows by about $23$ millionths of its length per degree. A $0.2\,\mathrm{m}$ aluminum bracket that swings $100$ degrees between sunlight and eclipse changes length by about $0.46\,\mathrm{mm}$. It does not take much of that to tilt a sensor: if one side of a $10\,\mathrm{cm}$ wide mounting grows just one micrometer more than the other, the sensor tilts by $10^{-5}$ radian, about $2$ arcseconds — already comparable to a good star tracker's accuracy. That is why trackers are often mounted on stiff, low-expansion materials, close to the gyros they are compared with.
:::

::: context bias-vs-noise Scatter or offset
Picture darts on a board. Noise scatters the darts around the bullseye; throwing more and averaging brings you back to the center. A bias moves the whole cluster off to one side; averaging more throws only finds the wrong spot more precisely.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g fill="none" stroke="#6c7a93" stroke-width="1.5">
    <circle cx="90" cy="80" r="55"/>
    <circle cx="90" cy="80" r="30"/>
    <circle cx="270" cy="80" r="55"/>
    <circle cx="270" cy="80" r="30"/>
  </g>
  <circle cx="90" cy="80" r="4" fill="#b4232c"/>
  <circle cx="270" cy="80" r="4" fill="#b4232c"/>
  <g fill="#1d6fd1">
    <circle cx="70" cy="62" r="4"/>
    <circle cx="112" cy="70" r="4"/>
    <circle cx="96" cy="108" r="4"/>
    <circle cx="66" cy="96" r="4"/>
    <circle cx="104" cy="52" r="4"/>
    <circle cx="84" cy="86" r="4"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="295" cy="50" r="4"/>
    <circle cx="303" cy="56" r="4"/>
    <circle cx="298" cy="62" r="4"/>
    <circle cx="289" cy="57" r="4"/>
    <circle cx="306" cy="47" r="4"/>
    <circle cx="293" cy="44" r="4"/>
  </g>
  <text x="90" y="158" font-size="12" text-anchor="middle" fill="#1f2a44">noise: scattered</text>
  <text x="270" y="158" font-size="12" text-anchor="middle" fill="#1f2a44">bias: offset</text>
</svg>
```

A misalignment is the right-hand board: tight, repeatable and wrong.
:::

::: context filter-states Letting the filter learn the misalignment
A filter can estimate anything that affects its measurements in a way it can predict. Add three small misalignment angles to the state, and the measurement model becomes "the tracker reads the true attitude turned by these three angles." At first the filter cannot tell the angles from attitude error. But as the vehicle turns, a real misalignment keeps showing up the same way in the tracker's frame while the attitude changes, and the two separate. The filter needs the vehicle to move for the angles to become observable — the same lesson as the calibration slew, done continuously.
:::

::: context chi-square A yardstick for squared surprises
Karl Pearson introduced the chi-square test in 1900. Take a few independent bell-curve numbers, each with a spread of one, square them and add them up: the total follows a chi-square distribution, and the count of numbers is its degrees of freedom. Its average equals that count. For one degree of freedom, values below $1$ are common, values above $4$ happen about $5$ percent of the time, and values above $10.83$ only $0.1$ percent of the time. The NIS is exactly such a sum when the filter is honest.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="160" x2="350" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="160" x2="30" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="87.2" x2="350" y2="87.2" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <g fill="#8fb8f0" stroke="#1f2a44" stroke-width="1">
    <rect x="40" y="137.1" width="13" height="22.9"/>
    <rect x="59" y="121.3" width="13" height="38.7"/>
    <rect x="78" y="128.3" width="13" height="31.7"/>
    <rect x="97" y="152.8" width="13" height="7.2"/>
    <rect x="135" y="105.4" width="13" height="54.6"/>
    <rect x="154" y="127.8" width="13" height="32.2"/>
    <rect x="268" y="124.5" width="13" height="35.5"/>
    <rect x="287" y="120.3" width="13" height="39.7"/>
    <rect x="306" y="91.2" width="13" height="68.8"/>
    <rect x="325" y="91.0" width="13" height="69.0"/>
  </g>
  <g fill="#f2b880" stroke="#1f2a44" stroke-width="1">
    <rect x="173" y="48.0" width="13" height="112.0"/>
    <rect x="192" y="57.1" width="13" height="102.9"/>
    <rect x="211" y="67.0" width="13" height="93.0"/>
    <rect x="230" y="83.5" width="13" height="76.5"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="26" y="164">0.01</text>
    <text x="26" y="116">1</text>
    <text x="26" y="68">100</text>
  </g>
  <text x="346" y="81" font-size="11" text-anchor="end" fill="#b4232c">threshold 10.83</text>
  <text x="179" y="176" font-size="11" text-anchor="middle" fill="#1f2a44">step 25</text>
  <text x="190" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">NIS, steps 18 to 33, log scale</text>
</svg>
```

The picture shows the NIS from the ungated worked example on a log scale: the fault at step 25 and its three-step tail stand far above the dashed threshold.
:::

::: context multipath When an echo takes the long way
Multipath means a signal reaches the receiver by more than one path: straight from the source, and also after bouncing off something nearby. The bounced copy has traveled farther, so a ranging sensor that locks onto it reports a range that is too long. GPS receivers near tall buildings suffer the same way. Around a space station, solar arrays, radiators and shiny modules all make good mirrors for a docking sensor's laser.
:::

::: context false-alarms Why one in a thousand is not rare
A $99.9$ percent threshold means a perfectly healthy sensor still fails the test one time in a thousand. A sensor sampled ten times a second produces $864{,}000$ measurements a day, so it raises about $864$ false alarms a day. That is fine if each alarm only rejects one measurement. It is not fine if each alarm switches the sensor off. So flight software usually rejects single failing measurements quietly and declares a sensor failed only after several failures in a row or in a short window.
:::
