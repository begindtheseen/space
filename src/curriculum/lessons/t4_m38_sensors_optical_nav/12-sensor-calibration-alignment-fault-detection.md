---
id: l12-sensor-calibration-alignment-fault-detection
title: Sensor calibration, alignment estimation, and fault detection
minutes: 14
covers:
  - 'Sensor calibration, alignment estimation, and fault detection'
---

Every sensor this module has built assumed its own numbers were trustworthy: the intrinsics a camera was calibrated with, the hard- and soft-iron correction a magnetometer was fit with, the boresight direction a star tracker was mounted along. None of that trust survives contact with a real vehicle unexamined. A lens's calibration can drift with temperature, a mounting bracket flexes by a few arcseconds between a cold eclipse and a sunlit orbit, and any sensor, however well characterized on the ground, can fail outright in flight — a connector works loose, a detector pixel dies, a stray reflection convinces a ranging sensor of a range that is not real. This closing lesson takes up what a mission does about all three: calibrating what ground testing already covered, estimating what only shows up once the vehicle is actually flying, and catching the moment a sensor stops telling the truth.

## Calibration, recapped as one idea

Two lessons in this module already built full calibration procedures from scratch: the magnetometer's ellipsoid fit recovered a hard-iron offset and a soft-iron distortion matrix from nothing but a tumble and the geometry it traced; the camera's radial distortion model recovered a lens's departure from an ideal pinhole from a handful of coefficients fit against known geometry. Both are the same idea in different clothing — a sensor's raw output is related to the physical quantity of interest by a model with a small number of free parameters, and calibration is fitting those parameters against data whose truth is known some other way, whether from the tumble's own consistency or from a ground-truth target. Every sensor this module covered needs some version of that step before its measurement model can be trusted at all, and the two worked in earlier lessons are the template the rest follow.

## Alignment estimation: the error that ground calibration cannot finish

One error survives even a careful ground calibration. A star tracker's boresight, an IMU's sensing axes, and the vehicle's own reference frame are each defined by a physical mounting, and no mounting is built to the last arcsecond design intent claims — and even the arcseconds it is built to shift with thermal load as the vehicle moves between sunlight and shadow, flexing a bracket by a small, slowly changing amount no ground test at one fixed temperature can fully anticipate. Left uncorrected, this **misalignment** does not add noise to an attitude solution; it adds a bias. If the star tracker's own mounting frame is offset from the vehicle frame by a fixed small rotation $\delta\mathbf{A}$, every attitude it reports is $\mathbf{A}_{\text{tracker}}=\delta\mathbf{A}\,\mathbf{A}_{\text{true}}$, and a filter that treats the tracker's output as the vehicle's own attitude inherits $\delta\mathbf{A}$ exactly, every single time, regardless of what the vehicle is actually doing.

Because that offset is fixed (or slowly varying) rather than random, it is estimable — by comparing the tracker's reported attitude against an independent reference, typically the gyro-propagated attitude the tracker itself calibrates, across several genuinely different vehicle attitudes rather than by repeating measurements at only one. The comparison $\mathbf{A}_{\text{tracker}}(t_k)\,\mathbf{A}_{\text{gyro}}(t_k)^\mathsf{T}=\delta\mathbf{A}$ should return the *same* small rotation at every attitude sampled; sweeping through several distinct attitudes is not merely about collecting more data to average — it is the actual diagnostic. A discrepancy that stays constant across attitude is consistent with a fixed mechanical misalignment; one that instead tracks the vehicle's own orientation relative to the Sun would point to a thermal or other attitude-dependent effect, not a simple alignment bias, and no amount of measurement at a single attitude could ever tell the two apart.

::: example An uncorrected bias, and what a calibration slew recovers
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

The bias is exactly $108.0''$ — precisely the misalignment magnitude, to the digit, because that is exactly what the algebra above predicts.

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
# RMS error, 8-attitude average:     1.77 arcsec
# expected sqrt(8) improvement: 2.828  actual: 2.807
```

Two thousand simulated calibration slews confirm the estimate improves almost exactly as $1/\sqrt{N}$ predicts — $2.807$ against a predicted $2.828$ for eight attitudes — the same square-root-of-measurement-count behaviour every averaging argument in this course has produced, applied here to a mounting bracket instead of a photon count.
:::

::: key Alignment estimation
Mounting misalignment between a star tracker, an IMU, and the vehicle frame is never exactly zero and drifts with thermal load. Uncorrected, it is a pure attitude bias, not noise. Estimate it — on the ground once, and again in flight as thermal conditions change — by comparing the sensor's reading against an independent reference across several genuinely different attitudes; a discrepancy that stays constant across that sweep is the misalignment itself.
:::

## Fault detection: when a sensor lies convincingly

A misaligned sensor is still telling something close to the truth. A faulty one is not, and a filter has to notice. The Kalman filter module's own consistency-testing lesson built exactly the tool for this: the **normalized innovation squared**, $\nu_k^\mathsf{T}\mathbf{S}_k^{-1}\nu_k$, which follows a chi-squared distribution with the measurement's own dimension as its degrees of freedom whenever the filter's model of its own uncertainty is honest. A single bad measurement — the false star match the pyramid confirmation was built to catch, a magnetometer glitch from a transient current spike, a multipath return off a structure the docking sensor was not aimed at — inflates that statistic far beyond what the filter's own covariance predicts, and the same test built to check a filter's health doubles as the test that catches the sensor breaking it.

::: example A multipath return, caught by the statistic built to check consistency
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

Before the fault, every NIS value sits comfortably below the threshold. At the fault itself the statistic reaches $464$, more than forty times the threshold — unmistakable. It does not drop straight back to normal, either: the single bad measurement pulled the filter's own state estimate off course, so the next several genuinely good measurements are compared against a still-recovering prediction and keep tripping the same test for three more steps before the filter settles. A fault-detection system built on this statistic has to account for that recovery tail — flagging the epoch of the fault is necessary but not sufficient, since the disturbance it leaves behind can itself look like a sequence of faults for a few cycles afterward.
:::

## Check yourself

::: check
Starting from $\mathbf{A}_{\text{tracker}}=\delta\mathbf{A}\,\mathbf{A}_{\text{true}}$, show that $\mathbf{A}_{\text{tracker}}\mathbf{A}_{\text{true}}^\mathsf{T}$ equals $\delta\mathbf{A}$ exactly, for any true attitude at all.
:::

::: answer
Substituting directly, $\mathbf{A}_{\text{tracker}}\mathbf{A}_{\text{true}}^\mathsf{T}=(\delta\mathbf{A}\,\mathbf{A}_{\text{true}})\mathbf{A}_{\text{true}}^\mathsf{T}=\delta\mathbf{A}\,(\mathbf{A}_{\text{true}}\mathbf{A}_{\text{true}}^\mathsf{T})=\delta\mathbf{A}\,\mathbf{I}=\delta\mathbf{A}$, using $\mathbf{A}_{\text{true}}\mathbf{A}_{\text{true}}^\mathsf{T}=\mathbf{I}$ for any orthogonal attitude matrix. The true attitude cancels out of the expression completely, which is exactly why the comparison returns the same $\delta\mathbf{A}$ no matter which attitude the vehicle happened to be in when the comparison was made.
:::

::: check
Explain why a calibration procedure sweeps through several distinct attitudes rather than taking many repeated readings while the vehicle holds one fixed attitude.
:::

::: answer
Repeated readings at a single fixed attitude would still average out random measurement noise, but they could never distinguish a genuine fixed mechanical misalignment from some other effect that happens to depend on the vehicle's attitude relative to, say, the Sun — both would look like a constant offset at that one attitude. Sweeping through several genuinely different attitudes and confirming the discrepancy stays the same is the actual diagnostic: an attitude-independent result confirms a true mounting misalignment, while a result that changes with attitude would point to something else the single-attitude test could never have revealed.
:::

::: check
Using this lesson's measured single-attitude RMS of $4.96''$, estimate the RMS alignment error a calibration slew through $20$ attitudes would achieve, assuming the same $1/\sqrt{N}$ behaviour found for eight.
:::

::: answer
$4.96/\sqrt{20}=4.96/4.472=1.11''$, extending the same square-root-of-count improvement this lesson's own $2000$-trial simulation confirmed for eight attitudes.
:::

::: check
Why does the normalized innovation squared, $\nu_k^\mathsf{T}\mathbf{S}_k^{-1}\nu_k$, spike so dramatically at a fault rather than merely rising somewhat above its usual range?
:::

::: answer
$\mathbf{S}_k$ is the filter's own prediction of how large the innovation *should* be, built from the covariance the filter believes it has; a fault like a six-metre multipath return produces an innovation many standard deviations outside what $\mathbf{S}_k$ predicts, and because the statistic divides by $\mathbf{S}_k$ and is quadratic in the innovation, a modestly-sized covariance combined with a wildly wrong measurement produces a ratio that grows with the square of how wrong the measurement is — a small violation of the filter's assumptions produces a large statistic, precisely because the test is built to be sensitive to exactly that.
:::

::: check
The worked fault-detection example flagged four consecutive steps, not only the one where the fault actually occurred. Is this a failure of the test, and what should a real fault-detection system do about it?
:::

::: answer
It is not a failure of the test — it is an accurate report that the filter's state estimate was genuinely disturbed by the fault and had not yet recovered, so the following several good measurements really were inconsistent with the filter's (still-wrong) prediction. A real fault-detection system needs to treat the epoch of the original fault as the one to actually flag and investigate, while recognising that the following few cycles of elevated NIS are the expected, ordinary consequence of recovering from it rather than evidence of additional, independent faults — often handled by inflating the filter's process noise temporarily after a detected fault so it can re-converge faster rather than continuing to trip the same alarm.
:::

::: check
Compare the fault-detection statistic in this lesson to the residual gate the star tracker lesson used against a false star match. What is the same about the two, and what is different?
:::

::: answer
Both compare an observation against a prediction the current best solution makes and reject or flag whatever disagrees by more than the noise should allow — the underlying idea, checking a measurement against what the rest of the solution says it should be, is identical. They differ in what "the rest of the solution" is built from: the star tracker's residual gate compared a candidate star against a static, freshly solved attitude with no time history at all, while the normalized innovation squared compares a measurement against a covariance a running filter has propagated and updated over many previous cycles, making the test — and its recovery-tail behaviour after a fault — inseparable from the filter's own dynamics in a way a one-shot geometric check never has to consider.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| Calibration | Fit a sensor model's free parameters against known truth; the magnetometer ellipsoid and camera distortion lessons are the template |
| $\mathbf{A}_{\text{tracker}}=\delta\mathbf{A}\,\mathbf{A}_{\text{true}}$ | Uncorrected misalignment is a pure attitude bias, exactly $\delta\mathbf{A}$, at every attitude |
| $\mathbf{A}_{\text{tracker}}(t_k)\mathbf{A}_{\text{gyro}}(t_k)^\mathsf{T}=\delta\mathbf{A}$ | Alignment estimate; constant across attitude confirms it is a true mounting bias |
| RMS error $\propto 1/\sqrt{N}$ | Averaging over $N$ distinct calibration attitudes; $2.81\times$ found for $N=8$ against a predicted $2.83\times$ |
| $\nu_k^\mathsf{T}\mathbf{S}_k^{-1}\nu_k\sim\chi^2$ | Normalized innovation squared; a fault drives it far above the filter's own consistency threshold |
| Post-fault recovery tail | Elevated NIS persists a few cycles after a single fault while the disturbed state estimate re-converges |

This module opened with a photon landing on a focal plane and closes with the discipline of not trusting any sensor's number, including its own calibration, further than the data actually earns. The orbit determination module picks up from here, taking the position and range fixes these instruments deliver and turning a sequence of them into a trajectory — and an honest covariance to go with it.
