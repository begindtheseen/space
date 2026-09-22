---
id: l06-sensor-models
title: Sensor models
minutes: 25
covers:
  - "Sensor models: noise, bias and bias instability, scale factor, misalignment, quantisation, latency, dropout, saturation, update rate"
---

Every number the GNC box ever sees passes through the Sensors box first, which means every error this lesson describes is an error the flight software has to work despite — not an error the simulation adds by accident, but an error a real vehicle actually has, that a simulation without it would be hiding. Getting these models right is not about pessimism; it is about giving the navigation filter and the controller the same imperfect world they will fly in, so that the margins you compute in simulation are margins that mean something in flight.

This lesson works through the error terms an inertial measurement unit exhibits — scale factor, misalignment, bias and its instability, noise, quantisation, latency, dropout, saturation, and finite update rate — and asks, for each one, how big it typically is and what specifically it costs the loop that depends on it. Two of these terms get full worked treatment because they are the ones most often modelled carelessly: the order in which scale factor and bias combine, and the sharp qualitative difference between what latency does to a loop and what noise does.

## The sensitivity matrix, and why order is not a stylistic choice

The standard IMU measurement model composes several error sources in a specific sequence:

$$
\mathbf{a}_{\text{meas}} = \bigl(\mathbf{I} + \mathrm{diag}(\mathbf{sf}) + \mathbf{M}\bigr)\,\mathbf{a}_{\text{true}} + \mathbf{b} + \mathbf{n},
$$

rounded to the sensor's quantisation step afterward. Scale factor ($\mathbf{sf}$, a fractional gain error per axis) and misalignment ($\mathbf{M}$, small off-diagonal cross-axis coupling) act on the true signal *first*; bias ($\mathbf{b}$) and noise ($\mathbf{n}$) add *afterward*. This is not an arbitrary convention. Scale factor and misalignment are properties of the sensing element's transduction — a proof mass, a vibrating structure, a mechanical-to-electrical gain — so they are physically multiplicative on whatever signal is actually present. Bias is dominated by electronic offset and does not scale with the input signal at all: a sensor sitting still with zero true input still reports a nonzero output, and that output does not grow if the true signal later grows. Keeping the two structurally separate is what makes them separable during calibration.

::: example Why the order matters for calibration, not only for modelling
A calibration rig presents an accelerometer with five known reference inputs — $\pm g_0$, $\pm g_0/2$ and $0$, using gravity at different tilt angles, $g_0 = 9.80665\,\mathrm{m/s^2}$ — and fits the standard linear model $y = mx + c$ to the (known input, measured output) pairs by least squares. Suppose the axis actually has a $0.8\%$ scale factor error and a $0.04\,\mathrm{m/s^2}$ bias.

```python
import numpy as np

sf, b_true, g0 = 0.008, 0.04, 9.80665
x = np.array([-g0, -0.5*g0, 0.0, 0.5*g0, g0])   # known reference inputs, a calibration rig
y_A = (1 + sf)*x + b_true                        # sensitivity first, bias after (standard model)
y_B = (x + b_true)*(1 + sf)                       # the other order

Amat = np.vstack([x, np.ones_like(x)]).T
slope_A, c_A = np.linalg.lstsq(Amat, y_A, rcond=None)[0]
slope_B, c_B = np.linalg.lstsq(Amat, y_B, rcond=None)[0]

print("data from the standard order: sf_hat =", slope_A - 1, " bias_hat =", c_A)
print("data from the other order:    sf_hat =", slope_B - 1, " bias_hat =", c_B)
print("relative error in recovered bias:", (c_B - b_true)/b_true, " (equals sf =", sf, ")")
# data from the standard order: sf_hat = 0.007999999999999785  bias_hat = 0.03999999999999976
# data from the other order:    sf_hat = 0.00800000000000023  bias_hat = 0.04031999999999936
# relative error in recovered bias: 0.007999999999984062  (equals sf = 0.008 )
```

When the physical sensor really does follow the standard order, the fit recovers $\widehat{sf} = 0.00800$ and $\hat b = 0.04000\,\mathrm{m/s^2}$ exactly. If instead the true error process combined bias before the gain — physically implausible for this kind of sensor, but a real risk if a simulation's error model gets the order backwards — the *identical* calibration fit recovers the same scale factor (the coefficient on $x$ is $1+sf$ either way) but a bias off by exactly $sf$ in relative terms: $0.0403$ instead of $0.0400$, a small but completely systematic error that no amount of additional calibration data removes, because the fitting procedure's assumed structure does not match the data's actual structure. Getting the order right in the simulation is not bookkeeping for its own sake; it is what makes a simulated calibration campaign representative of what a real one would find.
:::

Misalignment behaves like scale factor for this purpose — it is a small, deterministic geometric error, calibrated the same way, and belongs in the same multiplicative term, coupling a fraction of one axis's true signal into another axis's reported output.

## Latency versus noise: why they are not the same kind of problem

Every other error in this lesson's list degrades a measurement's *accuracy*. Latency is different: it degrades the loop's *stability*, because a delayed measurement is not a noisy version of the true state, it is the true state from the wrong time, fed into a controller that assumes it is current. The previous lessons already derived the mechanism — a pure delay of $\tau$ contributes phase $-\omega\tau$ at any frequency $\omega$, with no effect on magnitude — and a sensor's group delay (filtering, processing, bus transfer time before a measurement reaches the flight software) costs exactly this kind of phase, stacking with the zero-order hold's own delay at the loop's crossover.

::: example The exact delay that breaks a loop, and the noise that never does
Take the simplest possible case that still shows the real mechanism: an integrator plant, $\dot y = u$, with a proportional controller acting on a *delayed* measurement, $u = -K_p\,y(t-\tau)$. This is the textbook integrator-plus-delay system, and its stability boundary has a closed form: the characteristic equation $s = -K_p e^{-s\tau}$ has a pure-imaginary root exactly when $K_p = \omega$ and $\omega\tau = \pi/2$, giving

$$
\tau_{\text{crit}} = \frac{\pi}{2K_p} .
$$

With $K_p = 2\,\mathrm{s^{-1}}$, $\tau_{\text{crit}} = \pi/4 = 0.7854\,\mathrm{s}$ exactly.

```python
import numpy as np

Kp = 2.0
tau_crit = np.pi/(2*Kp)
dt = 0.0005

def run(tau, noise_std=0.0, rng=None, y0=1.0, t_end=120.0):
    n_delay = max(1, round(tau/dt))
    buf = [y0]*n_delay
    y = y0
    ys = [y]
    for _ in range(int(t_end/dt)):
        y_meas = buf.pop(0)
        if noise_std > 0:
            y_meas += rng.normal(0, noise_std)
        y = y + dt*(-Kp*y_meas)
        buf.append(y)
        ys.append(y)
    return np.array(ys)

print("tau_crit = pi/(2 Kp) =", tau_crit)
for tau in [0.70, 0.7854, 0.85]:
    ys = run(tau)
    print(f"  tau={tau:.4f}  max|y| over 120 s = {np.max(np.abs(ys)):.4g}")

rng = np.random.default_rng(0)
for noise_std in [0.01, 1.0, 10.0]:
    ys = run(0.60, noise_std=noise_std, rng=rng, t_end=200.0)
    tail = ys[len(ys)//2:]
    print(f"  noise_std={noise_std:6.2f}  steady-state RMS = {np.sqrt(np.mean(tail**2)):.5f}  max|y| = {np.max(np.abs(ys)):.5f}")

# tau_crit = pi/(2 Kp) = 0.7853981633974483
#   tau=0.7000  max|y| over 120 s = 1
#   tau=0.7854  max|y| over 120 s = 1.073
#   tau=0.8500  max|y| over 120 s = 2930
#
#   noise_std=  0.01  steady-state RMS = 0.00053  max|y| = 1.00000
#   noise_std=  1.00  steady-state RMS = 0.05206  max|y| = 1.00000
#   noise_std= 10.00  steady-state RMS = 0.52717  max|y| = 2.22670
```

Below $\tau_{\text{crit}}$, the loop decays to zero; exactly at it, the response sustains a bounded oscillation instead of decaying; a delay of $0.85\,\mathrm{s}$ — only $8\%$ past the threshold — grows the response to $2{,}930$ times its starting value within 120 s, and it would keep growing without bound in a linear model. Contrast that with the same loop, delay held at a safely stable $\tau = 0.60\,\mathrm{s}$, subjected to sensor noise a thousand times larger than a realistic value ($\sigma = 10$ against $\sigma = 0.01$): the steady-state response gets noisier — RMS grows from $0.00053$ to $0.527$ — but $\max|y|$ over the entire 200 s run never exceeds $2.23$. Noise costs performance, proportionally; delay past a threshold costs stability, categorically. That threshold is a property of the deterministic loop dynamics, and a zero-mean noise input, however large, cannot move it — it is not part of the characteristic equation, only the delay is.
:::

This is the reason latency deserves more modelling care than noise magnitude, not because noise is unimportant, but because an error in your noise number degrades an error budget continuously and predictably, while an error in your latency number can be the difference between a design that looks fine in every plot and one that is, in reality, unstable.

::: key Sensor errors, in the order they act
$\mathbf{a}_{\text{meas}} = (\mathbf{I} + \mathrm{diag}(\mathbf{sf}) + \mathbf{M})\,\mathbf{a}_{\text{true}} + \mathbf{b} + \mathbf{n}$, then quantised: the sensitivity matrix acts on truth first, bias and noise add afterward, and calibration only separates the two correctly if the model matches this order. Bias (and its slow wander, bias instability) and latency degrade a navigation filter and a control loop far more than white noise does — bias corrupts every downstream estimate systematically, and latency can destabilise a loop that has ample margin against every other error.
:::

## The rest of the list, with real numbers

**Bias instability** is the fact that a sensor's bias is not truly constant — it wanders slowly, dominated by low-frequency (flicker) noise rather than the white noise that averages out. It is characterised by the flat minimum of an Allan deviation curve and quoted directly in those units: a low-cost MEMS gyro might carry a bias instability of order $1$ to $10\,^\circ/\mathrm{hr}$, a tactical-grade unit $0.1$ to $1\,^\circ/\mathrm{hr}$, and a navigation-grade fibre-optic or ring-laser gyro $0.001$ to $0.01\,^\circ/\mathrm{hr}$ — three orders of magnitude separating a consumer part from a submarine-grade one, and the reason an inertial navigation solution's position error grows the way it does between GNSS updates.

**Dropout** is a measurement that does not arrive at all — a communications glitch, a GNSS signal briefly occluded by vehicle structure during a manoeuvre, a bus error. The simulation's job is not to fill in a plausible value; it is to *not* deliver a measurement that update, and let the flight software's own dropout handling — holding the last estimate, inflating its uncertainty, or falling back to a different sensor — run exactly as it will in flight. A simulation that quietly interpolates through a dropout has tested a flight software path that will never run.

**Saturation** is a true signal outside the sensor's measurable range: an accelerometer rated to $\pm16g$ during a $20g$ event reports a *flat, constant* $16g$, not a warning. That flat, wrong, entirely plausible-looking value is the dangerous part — a saturated channel does not look broken, it looks like the vehicle stopped accelerating harder, unless the sensor model also emits the saturation flag a real part's interface provides, and the flight software actually checks it.

**Update rate** is the sensor's own sample period, independent of the flight software's — a $100\,\mathrm{Hz}$ IMU feeding a $20\,\mathrm{Hz}$ control loop delivers five fresh samples per tick and the loop can average or select among them; a $10\,\mathrm{Hz}$ GNSS receiver feeding the same loop delivers a fresh fix only once every two ticks, and the loop must explicitly hold the last position between fixes rather than assume a new one arrived. Each sensor's update rate belongs in its own model, evaluated on its own schedule, exactly the way the Sensors box was kept separate from GNC in the first lesson of this module — a sensor's rate is one more thing a dispersion campaign needs to vary independently.

::: warning A saturation flag nobody wrote
Modelling saturation as a clipped value without also modelling the flag that a real sensor's interface sets when it rails is a common half-measure: the simulated flight software never sees the flag, so its saturation-handling code — which may be the only thing standing between a railed accelerometer and a navigation filter trusting a wrong constant — never actually runs in simulation. If the flag is part of the real interface, it must be part of the model, tested on its own, not assumed to be exercised because the clipped value is present.
:::

::: warning Sizing noise carefully and delay carelessly
It is common to see a sensor noise number sourced from a datasheet to three significant figures while its latency is a round number nobody measured — "call it 10 ms" — because noise shows up immediately in every plot as visible jitter, while latency's effect is invisible until a margin is crossed. The example above shows why that emphasis is backwards for stability purposes: get the noise number wrong by a factor of two and the error budget is off by a factor of two; get the latency number wrong by a factor of two and a stable design can become an unstable one with no warning in between.
:::

## Check yourself

::: check
In the IMU measurement model, why do scale factor and misalignment act on the true signal before bias and noise are added, rather than the other way around?
:::

::: answer
Scale factor and misalignment are physically multiplicative errors in the sensor's transduction mechanism — they scale whatever true signal is actually present, including zero. Bias is dominated by electronic offset that does not depend on the input signal's size at all; noise is likewise additive and independent of the true signal. Keeping the multiplicative and additive error sources in this order matches how the physical errors actually arise, and it is also what makes them separable in a calibration fit, as the worked example showed.
:::

::: check
The calibration example recovered a bias of $0.0403\,\mathrm{m/s^2}$ instead of the true $0.0400\,\mathrm{m/s^2}$ when the assumed model order did not match the data's actual generating order. Would collecting more calibration points at the same five reference levels fix this discrepancy?
:::

::: answer
No. The discrepancy is not sampling noise that averages out with more data — it is a structural mismatch between the fitting model's assumed order and the physical process's actual order, and it reproduces exactly, to every additional data point, because the underlying relationship between $x$ and $y$ is deterministic in this example. More data at the same reference levels would only make the (wrong) fit more precise, not more accurate; fixing it requires using the correct model structure, not more data.
:::

::: check
Derive the exact instability threshold $\tau_{\text{crit}}$ for the integrator-plus-delay system $\dot y = -K_p\,y(t-\tau)$, and compute it for $K_p = 2\,\mathrm{s^{-1}}$.
:::

::: answer
The characteristic equation of the delayed system is $s = -K_p e^{-s\tau}$. At the stability boundary the root is purely imaginary, $s = i\omega$ with $\omega > 0$: $K_p e^{-i\omega\tau} = -i\omega$. Write the right side in polar form, $-i\omega = \omega\,e^{-i\pi/2}$, and the left side already is one, with magnitude $K_p$ and phase $-\omega\tau$. Matching magnitudes gives $\omega = K_p$; matching phase gives $-\omega\tau = -\pi/2$, i.e. $\omega\tau = \pi/2$. Combining the two, $\tau_{\text{crit}} = \pi/(2K_p)$. With $K_p = 2$, $\tau_{\text{crit}} = \pi/4 = 0.7854\,\mathrm{s}$, matching the simulation exactly: stable at $\tau = 0.70\,\mathrm{s}$, growing by a factor of nearly 3,000 at $\tau = 0.85\,\mathrm{s}$.
:::

::: check
Why can a thousand-fold increase in sensor noise standard deviation never, by itself, make the integrator-plus-delay loop from the worked example unstable, no matter how large the noise gets?
:::

::: answer
Stability is determined entirely by the loop's characteristic equation — its poles — which come from the deterministic part of the dynamics: the plant, the controller gain, and any delay in the loop. A zero-mean noise term added to the measurement is an exogenous input; by superposition, it contributes an additional, separately-computable term to the output but does not appear in, and cannot move, the characteristic equation. Increasing its size only scales that additional term proportionally, which is exactly the linear RMS growth the simulation showed, never divergence.
:::

::: check
A radar altimeter drops out for 0.3 s during a manoeuvre. What should the simulation do with the flight software's altitude estimate during that interval, and why is quietly interpolating a plausible altitude the wrong choice?
:::

::: answer
The simulation should withhold the new altimeter measurement entirely during the dropout and let the flight software's own dropout-handling logic run — holding the last estimate, inflating its uncertainty, or switching to another sensor, whatever the real flight code actually does. Interpolating a plausible value on the simulation's side means the flight software never sees the dropout at all, so the exact code path meant to handle this failure mode in flight never executes in the test that was supposed to validate it.
:::

::: check
An accelerometer rated to $\pm16g$ reports a flat $16.0g$ for several consecutive samples during a high-load event, with no saturation flag modelled. Why is this specific failure mode more dangerous than a sensor that fails by reporting a value that is clearly invalid, such as `NaN`?
:::

::: answer
A flat value at the rail is smooth, in-range, and physically plausible on its own — nothing about it looks like a failure, so a navigation filter or monitor with no other information will trust it as the true, if large, acceleration. A clearly invalid value like `NaN` is easy to detect and reject by construction. The saturated reading is dangerous precisely because it looks like data, and the only way to catch it is the explicit saturation flag a real sensor's interface provides — which must be modelled and checked, not inferred from the value alone.
:::

## Summary

| Term | Model | Typical size / consequence |
| --- | --- | --- |
| Scale factor, misalignment | Multiplicative, acts on true signal first | Fractions of a percent to a few percent; couples axes |
| Bias | Additive, after the sensitivity matrix | Calibrated jointly with scale factor; order-sensitive, as shown above |
| Bias instability | Slow random wander of the bias itself | MEMS $1$–$10\,^\circ/\mathrm{hr}$; tactical $0.1$–$1\,^\circ/\mathrm{hr}$; navigation-grade $0.001$–$0.01\,^\circ/\mathrm{hr}$ |
| Noise | Additive, zero-mean | Degrades performance proportionally; cannot by itself destabilise a loop |
| Quantisation | Rounding to the ADC's LSB | A deterministic, bounded error — see the five-box lesson's worked example |
| Latency | Delay in the measurement path | $\tau_{\text{crit}} = \pi/(2K_p)$ for a simple loop; a threshold, not a proportional cost |
| Dropout | A measurement that does not arrive | Must be modelled as absence, not interpolated |
| Saturation | Clipped at the sensor's rated range | Plausible-looking and wrong; needs its own flag, modelled and checked |
| Update rate | The sensor's own sample period | Independent of GNC's rate; held or selected between fresh samples |

Sensors are one boundary of the loop; the next lesson covers the other — actuators, where the same distinction between a plausible-looking number and a correct one shows up again, this time in torque, thrust and gimbal rate rather than in a measurement.
