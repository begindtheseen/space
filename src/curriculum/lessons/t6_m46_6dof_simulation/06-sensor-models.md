---
id: l06-sensor-models
title: Sensor models
minutes: 22
covers:
  - "Sensor models: noise, bias and bias instability, scale factor, misalignment, quantization, latency, dropout, saturation, update rate"
---

Step onto an old bathroom scale. With nobody on it, the needle already sits at $1\,\mathrm{kg}$. When you step on, it reads $2\%$ heavy. It only shows whole tenths of a kilogram. It wobbles a little before settling, and it takes a second to settle at all. Put a piano on it and the needle stops at $150\,\mathrm{kg}$ and stays there. Every one of those quirks has a name, and every real sensor on a rocket has all of them.

Every number the GNC box ever sees passes through the **Sensors box** first. So every error in this lesson is one the flight software has to work *despite*. These are not errors the simulation adds by accident. They are errors a real vehicle really has, and a simulation without them would be hiding them. Modeling them is not pessimism. It gives the navigation filter and the controller the same imperfect world they will fly in, so that the margins you compute mean something in flight.

This lesson works through the errors of an **[[inertial measurement unit|imu]]** (IMU) — the box of accelerometers and gyroscopes at the heart of every vehicle's navigation. For each error it asks how big it usually is and what it costs. Two get full worked treatment because they are the ones most often modeled carelessly: the *order* in which scale factor and bias combine, and the sharp difference between what latency does to a loop and what noise does.

## The error terms, one line each

Here is the whole cast, matched to the bathroom scale:

- **Bias** — an offset that is there even with zero input (the $1\,\mathrm{kg}$ with nobody on the scale).
- **Bias instability** — the slow wander of that offset over minutes and hours.
- **Scale factor** error — a gain that is slightly off, so the output is a few percent too big or too small (the $2\%$ heavy).
- **Misalignment** and **non-orthogonality** — the sensor's axes are not pointed quite where they should be, or not quite at $90^\circ$ to each other, so a little of one axis leaks into another.
- **Noise** — fast random jitter on every sample. For a gyro, white noise on the rate adds up into a slowly growing angle error called **random walk**.
- **Quantization** — the output only comes in fixed steps (the whole tenths).
- **Latency** — the reading describes a moment slightly in the past (the second it takes to settle).
- **Dropout** — a reading that never arrives.
- **Saturation** — the true value is beyond the sensor's range, so it reports the limit (the piano).
- **Update rate** — how often a fresh reading comes out.

::: key The IMU error model terms
Bias (and its instability), scale factor, misalignment and non-orthogonality, random walk noise, quantization, latency, saturation, and finite update rate. Bias and latency hurt a navigation filter far more than white noise does.
:::

## The sensitivity matrix, and why the order matters

The standard IMU measurement model puts these errors together in a fixed order:

$$
\mathbf{a}_{\text{meas}} = \bigl(\mathbf{I} + \mathrm{diag}(\mathbf{sf}) + \mathbf{M}\bigr)\,\mathbf{a}_{\text{true}} + \mathbf{b} + \mathbf{n},
$$

and the result is then rounded to the sensor's quantization step. Here is each symbol.

- $\mathbf{a}_{\text{true}}$ is the true **[[specific force|specific-force]]** on the three axes, and $\mathbf{a}_{\text{meas}}$ is what the sensor reports.
- $\mathbf{I}$ is the identity matrix: a perfect sensor passes truth straight through.
- $\mathrm{diag}(\mathbf{sf})$, read "diag of s f", is a matrix with the three fractional scale-factor errors down its diagonal and zeros elsewhere. An error of $0.01$ on the $x$ axis makes that axis read $1\%$ high.
- $\mathbf{M}$ holds the small off-diagonal misalignment terms. An entry in row $y$, column $x$ leaks a fraction of the true $x$ signal into the $y$ output.
- $\mathbf{b}$ is the bias and $\mathbf{n}$ the noise.

The bracket $\mathbf{I} + \mathrm{diag}(\mathbf{sf}) + \mathbf{M}$ is called the **sensitivity matrix**.

Look at the order. Scale factor and misalignment act on the true signal *first*. Bias and noise are added *afterward*. This is not a matter of taste.

Scale factor and misalignment belong to the **transduction** — the step where a physical effect becomes an electrical signal. A tiny **proof mass** on a spring gets pushed, a vibrating structure gets twisted, and some mechanical-to-electrical gain turns that into volts. A gain that is $1\%$ off scales whatever signal is actually there. So these errors *multiply* the truth.

Bias is different. It comes mostly from electronic offset, and it does not care how big the input is. A sensor sitting still with zero true input still reports a nonzero number, and that number does not grow when the true signal grows. So bias *adds*.

Keeping the multiplying errors and the adding errors in separate places is what lets calibration pull them apart.

::: key IMU measurement model
$\mathbf{a}_{\text{meas}} = (\mathbf{I} + \mathrm{diag}(\mathbf{sf}) + \mathbf{M})\,\mathbf{a}_{\text{true}} + \mathbf{b} + \mathbf{n}$, then quantized. The sensitivity matrix acts on truth first; bias and noise add afterwards, which is why calibration must estimate them in that order and only separates them correctly if the model matches this order.
:::

::: example Why the order matters for calibration, not only for modeling
A calibration rig tilts an accelerometer so gravity gives it five known inputs: $-g_0$, $-g_0/2$, $0$, $+g_0/2$ and $+g_0$, with $g_0 = 9.80665\,\mathrm{m/s^2}$. It then fits a straight line $y = mx + c$ to the (known input, measured output) pairs by **[[least squares|least-squares]]**. The slope $m$ should come out as $1 + sf$, and the intercept $c$ as the bias.

Suppose the axis really has a $0.8\%$ scale factor error and a $0.04\,\mathrm{m/s^2}$ bias.

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

**Standard order.** The data are $y = 1.008x + 0.04$. The fit recovers slope $1.008$, so $\widehat{sf} = 0.00800$ ("sf hat", the estimate), and intercept $\hat b = 0.04000\,\mathrm{m/s^2}$. Exactly right.

**The other order.** Now suppose the errors combined with the bias *before* the gain: $y = (x + 0.04)(1.008)$. Multiply it out: $y = 1.008x + 0.04 \times 1.008 = 1.008x + 0.04032$. The fit still finds slope $1.008$, so the scale factor looks the same. But the intercept is $0.04032$, not $0.04$ — off by exactly $0.8\%$, the scale factor itself.

That second order is physically unlikely for this kind of sensor. It is a real risk, though, if a *simulation's* error model gets the order backward. The resulting mistake is small and completely systematic. More calibration data cannot remove it, because the fitting model's shape does not match the data's shape. Getting the order right is what makes a simulated calibration campaign find what a real one would.
:::

Misalignment behaves like scale factor here. It is a small, fixed geometric error, calibrated the same way, and it belongs in the same multiplying term.

## Quantization

A digital sensor cannot report any number at all. Its output passes through an **[[analog-to-digital converter|quantization-steps]]**, which rounds it to the nearest multiple of a fixed step, the **quantum** $\Delta$ ("delta"), also called one **LSB** (least significant bit). The rounding error always lies between $-\Delta/2$ and $+\Delta/2$. When the signal moves around a lot compared with $\Delta$, the error behaves like small random noise with a root-mean-square size of

$$
\frac{\Delta}{\sqrt{12}} .
$$

For the rate gyro in the first lesson of this module, $\Delta = 1\times10^{-5}\,\mathrm{rad/s}$. The error is never bigger than $5\times10^{-6}\,\mathrm{rad/s}$, and its typical size is $10^{-5}/\sqrt{12} = 2.9\times10^{-6}\,\mathrm{rad/s}$. It is deterministic and bounded, but a controller that divides by small differences can still feel it.

## Latency versus noise: two different kinds of problem

Every other error on the list hurts a measurement's *accuracy*. Latency is different. It hurts the loop's *stability*.

Picture steering a car while looking at a video of the road that runs one second behind. The picture is perfectly sharp. It is only old. You turn late, overshoot, turn back late again, and weave harder and harder. A delayed measurement is not a noisy version of the true state. It is the true state *from the wrong time*, handed to a controller that thinks it is current.

The earlier lessons already found the mechanism. A pure delay of $\tau$ ("tau") seconds leaves a signal's size alone but shifts its timing, which is a **phase** lag of $-\omega\tau$ radians at frequency $\omega$. A sensor's delay — filtering, processing, time on the data bus before the reading reaches the flight software — costs exactly this phase. It stacks on top of the zero-order hold's own half-sample delay at the loop's **[[crossover frequency|crossover-and-margin]]**.

That gives a handy conversion. If a loop has **phase margin** $\phi_m$ (in radians) at crossover frequency $\omega_c$, the extra delay it can take before going unstable, its **delay margin**, is

$$
\tau_{\text{max}} = \frac{\phi_m}{\omega_c} .
$$

A loop with $50^\circ$ of margin ($0.873\,\mathrm{rad}$) crossing over at $5\,\mathrm{rad/s}$ can take $0.873 / 5 = 0.175\,\mathrm{s}$ of added delay, and no more.

::: example The exact delay that breaks a loop, and the noise that never does
Take the simplest case that still shows the real mechanism. The plant is an **integrator**, $\dot y = u$: the control $u$ sets the rate of change of $y$. The controller is proportional, and it acts on a *delayed* measurement:

$$
u = -K_p\,y(t-\tau) .
$$

($K_p$, "K sub p", is the controller's gain.) This loop's stability edge has a closed form. Its **[[characteristic equation|characteristic-equation]]** is $s = -K_p e^{-s\tau}$, and it has a root on the imaginary axis exactly when $K_p = \omega$ and $\omega\tau = \pi/2$. So

$$
\tau_{\text{crit}} = \frac{\pi}{2K_p} .
$$

With $K_p = 2\,\mathrm{s^{-1}}$, $\tau_{\text{crit}} = \pi/4 = 0.7854\,\mathrm{s}$. The delay margin formula agrees: the loop crosses over at $\omega_c = K_p = 2\,\mathrm{rad/s}$ with $90^\circ$ ($\pi/2$) of phase margin, and $(\pi/2)/2 = 0.7854\,\mathrm{s}$.

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

Read the delay runs first. Each starts at $y = 1$.

- $\tau = 0.70\,\mathrm{s}$, below the edge: the response dies away and never exceeds its starting value.
- $\tau = 0.7854\,\mathrm{s}$, right at the edge: it neither dies nor grows, but keeps swinging at about the same size.
- $\tau = 0.85\,\mathrm{s}$, only $8\%$ past the edge: within $120\,\mathrm{s}$ it has grown to $2{,}930$ times its starting size, and in a linear model it would keep growing forever.

Now the noise runs. Hold the delay at a safe $\tau = 0.60\,\mathrm{s}$ and add sensor noise. Go from $\sigma = 0.01$ to $\sigma = 10$ ("sigma", the noise's standard deviation) — a thousand times bigger, far beyond any realistic sensor. The steady jiggle grows in proportion: its RMS goes from $0.00053$ to $0.527$, also a thousand times. But over the whole $200\,\mathrm{s}$, $|y|$ never goes past $2.23$. Nothing runs away.

Noise costs performance, in proportion. Delay past a threshold costs stability, all at once. That threshold belongs to the loop's own dynamics. Zero-mean noise, however large, cannot move it, because noise does not appear in the characteristic equation. Only the delay does.
:::

That is why latency deserves more modeling care than noise size. Noise is important too. But a wrong noise number shifts an error budget smoothly and predictably. A wrong latency number can be the difference between a design that looks fine in every plot and one that is, in reality, unstable.

::: warning Sizing noise carefully and delay carelessly
It is common to see a noise figure copied from a datasheet to three significant figures, next to a latency that is a round number nobody measured — "call it 10 ms". Noise shows up at once in every plot as visible jitter. Latency's effect stays invisible until a margin is crossed. For stability, that emphasis is backward. Get the noise wrong by a factor of two and the error budget is off by two. Get the latency wrong by a factor of two and a stable design can become an unstable one, with no warning in between.
:::

## Why bias hurts more than white noise

Navigation adds up sensor readings over time: a gyro's rate is summed into an angle, an accelerometer's reading into a velocity and then a position. What happens to each error when you keep adding?

White noise partly cancels itself, because each sample's jitter is as likely up as down. The sum wanders like a **[[random walk|random-walk]]**, and its typical size grows only with the square root of time. A gyro with **angle random walk** $N = 0.1\,^\circ/\sqrt{\mathrm{hr}}$ builds up an angle error of about $N\sqrt{t}$: $0.1^\circ$ after $1$ hour, and only $0.2^\circ$ after $4$ hours.

A bias never cancels. It pushes the same way every sample, so its sum grows in a straight line. A gyro bias of $1\,^\circ/\mathrm{hr}$ gives $1^\circ$ of error after $1$ hour and $4^\circ$ after $4$ hours. For an accelerometer it is worse still, because position is summed twice: a bias $b$ gives a position error of $\tfrac12 b t^2$. A bias of only $0.001\,\mathrm{m/s^2}$ gives $\tfrac12 \times 0.001 \times 600^2 = 180\,\mathrm{m}$ after ten minutes.

That is the reason the key above singles out bias: it corrupts every downstream estimate in the same direction, and it keeps growing.

## The rest of the list, with real numbers

**Bias instability.** A sensor's bias is not truly constant. It wanders slowly, driven by low-frequency ("flicker") noise that does not average out the way white noise does. It is measured as the flat bottom of an **[[Allan deviation|allan-deviation]]** curve. Typical sizes for gyros span a huge range:

- a low-cost **MEMS** gyro (a tiny etched-silicon chip): about $1$ to $10\,^\circ/\mathrm{hr}$;
- a **tactical-grade** unit: $0.1$ to $1\,^\circ/\mathrm{hr}$;
- a **navigation-grade** **[[fiber-optic or ring-laser gyro|gyro-grades]]**: $0.001$ to $0.01\,^\circ/\mathrm{hr}$.

Three orders of magnitude separate a cheap part from a navigation-grade one. This is why an inertial position solution drifts the way it does between GNSS updates.

**Dropout.** A measurement that never arrives: a communications glitch, a GNSS signal blocked for a moment by the vehicle's own structure during a maneuver, a bus error. The simulation's job is *not* to fill in a plausible value. It is to deliver nothing that update, and let the flight software's own dropout handling run exactly as it will in flight — holding the last estimate, growing its uncertainty, or switching to another sensor. A simulation that quietly fills the gap has tested a code path that will never run.

**Saturation.** The true signal is outside the sensor's range. An accelerometer rated to $\pm16g$ during a $20g$ event reports a flat, steady $16g$ — not a warning. That flat, wrong, believable value is the danger. A saturated channel does not look broken. It looks as if the vehicle stopped accelerating harder. The only protection is the **saturation flag** a real sensor's interface sets, which the model must also produce and the flight software must check.

**Update rate.** Each sensor has its own sample period, independent of the flight software's. A $100\,\mathrm{Hz}$ IMU feeding a $20\,\mathrm{Hz}$ control loop delivers $100/20 = 5$ fresh samples per tick, and the loop can average them or pick one. A $10\,\mathrm{Hz}$ GNSS receiver feeding the same loop delivers a fresh fix only once every $20/10 = 2$ ticks, so the loop must hold the last position between fixes instead of assuming a new one arrived. Each sensor's rate belongs in its own model, run on its own schedule, and it is one more thing a dispersion campaign needs to vary on its own.

::: warning A saturation flag nobody wrote
Modeling saturation as a clipped value, without the flag a real sensor sets when it hits its limit, is a common half-measure. The simulated flight software never sees the flag. So its saturation-handling code — maybe the only thing standing between a railed accelerometer and a navigation filter trusting a wrong constant — never runs in simulation. If the flag is part of the real interface, it must be part of the model, tested on its own, not assumed to be covered because the clipped value is there.
:::

## Check yourself

::: check
In the IMU measurement model, why do scale factor and misalignment act on the true signal before bias and noise are added, and not the other way around?
:::

::: answer
Scale factor and misalignment are multiplying errors in how the sensor turns a physical effect into a signal. They scale whatever true signal is present, including zero.

Bias comes mostly from electronic offset that does not depend on the size of the input. Noise is also added on and independent of the true signal.

Putting the multiplying errors first and the adding errors after matches how the physical errors really arise. It is also what makes them separable in a calibration fit, as the worked example showed.
:::

::: check
The calibration example recovered a bias of $0.0403\,\mathrm{m/s^2}$ instead of the true $0.0400\,\mathrm{m/s^2}$ when the assumed model order did not match the data's real order. Would collecting more calibration points at the same five reference levels fix this?
:::

::: answer
No. The error is not random scatter that averages away. It is a mismatch between the shape the fit assumes and the shape the data really have, and it comes back exactly with every extra data point, because the link between $x$ and $y$ is deterministic here.

More data at the same levels only makes the wrong fit more *precise*, not more *accurate*. The fix is the correct model structure, not more data.
:::

::: check
Derive the exact instability threshold $\tau_{\text{crit}}$ for the integrator-plus-delay loop $\dot y = -K_p\,y(t-\tau)$, and compute it for $K_p = 2\,\mathrm{s^{-1}}$.
:::

::: answer
The characteristic equation is $s = -K_p e^{-s\tau}$. At the edge of stability the root sits on the imaginary axis: $s = i\omega$ with $\omega > 0$. Substituting gives $i\omega = -K_p e^{-i\omega\tau}$, or $K_p e^{-i\omega\tau} = -i\omega$.

Write the right side in polar form: $-i\omega = \omega\,e^{-i\pi/2}$, size $\omega$ and angle $-\pi/2$. The left side is already in polar form, with size $K_p$ and angle $-\omega\tau$.

- Matching sizes: $\omega = K_p$.
- Matching angles: $-\omega\tau = -\pi/2$, so $\omega\tau = \pi/2$.

Put them together: $\tau_{\text{crit}} = \pi/(2K_p)$. With $K_p = 2$, $\tau_{\text{crit}} = \pi/4 = 0.7854\,\mathrm{s}$. That matches the simulation: settled at $\tau = 0.70\,\mathrm{s}$, and grown by a factor of nearly $3{,}000$ at $\tau = 0.85\,\mathrm{s}$.
:::

::: check
Why can a thousand-fold increase in the sensor noise's standard deviation never, by itself, make the integrator-plus-delay loop unstable, however large the noise gets?
:::

::: answer
Stability is set by the loop's characteristic equation — its **poles** — which come from the fixed, deterministic part of the dynamics: the plant, the controller gain, and any delay.

Zero-mean noise added to the measurement is an outside input. In a linear loop, by **superposition**, it adds its own separate term to the output, but it does not appear in the characteristic equation and cannot move it. Making the noise bigger only scales that extra term in proportion. That is the proportional RMS growth the simulation showed, never a runaway.
:::

::: check
A radar altimeter drops out for $0.3\,\mathrm{s}$ during a maneuver. What should the simulation do about the altitude measurement during that time, and why is quietly filling in a plausible altitude the wrong choice?
:::

::: answer
The simulation should withhold the altimeter reading entirely for those $0.3\,\mathrm{s}$ and let the flight software's own dropout logic run — holding the last estimate, growing its uncertainty, or switching to another sensor, whatever the real flight code does.

If the simulation fills in a plausible value on its own side, the flight software never sees a dropout at all. The exact code meant to handle this failure in flight never runs in the test that was supposed to check it.
:::

::: check
An accelerometer rated to $\pm16g$ reports a flat $16.0g$ for several samples in a row during a high-load event, and no saturation flag is modeled. Why is this failure more dangerous than a sensor that fails by reporting something plainly invalid, such as `NaN` ("not a number")?
:::

::: answer
A flat value at the limit is smooth, inside the range and physically believable. Nothing about it looks like a failure, so a navigation filter or monitor with no other clue will trust it as a real, if large, acceleration.

A `NaN` is easy to detect and reject by construction. The saturated reading is dangerous exactly because it looks like data. The only reliable way to catch it is the saturation flag a real sensor's interface provides — which must be modeled and checked, not guessed from the value alone.
:::

## Summary

| Term | Model | Typical size or consequence |
| --- | --- | --- |
| Scale factor, misalignment | Multiplies; acts on the true signal first | Fractions of a percent to a few percent; couples axes |
| Bias | Adds, after the sensitivity matrix | Grows linearly when summed; order-sensitive in calibration |
| Bias instability | Slow wander of the bias itself | MEMS $1$ to $10\,^\circ/\mathrm{hr}$; tactical $0.1$ to $1$; navigation-grade $0.001$ to $0.01$ |
| Noise, random walk | Adds; zero mean | Summed error grows as $\sqrt{t}$; cannot by itself destabilize a linear loop |
| Quantization | Rounding to the quantum $\Delta$ | Error within $\pm\Delta/2$, RMS about $\Delta/\sqrt{12}$ |
| Latency | Delay in the measurement path | Phase $-\omega\tau$; delay margin $\phi_m/\omega_c$; $\tau_{\text{crit}} = \pi/(2K_p)$ for the simple loop |
| Dropout | A reading that does not arrive | Model it as absence, never interpolate |
| Saturation | Clipped at the rated range | Believable and wrong; needs its own flag, modeled and checked |
| Update rate | The sensor's own sample period | Independent of GNC's rate; hold or select between fresh samples |

Sensors are one edge of the loop. The next lesson covers the other edge — actuators — where the same gap between a believable number and a correct one shows up again, this time in torque, thrust and gimbal rate instead of in a measurement.

::: context imu What is inside an IMU
An inertial measurement unit holds three accelerometers and three gyroscopes, one of each along three perpendicular axes. The accelerometers sense how hard the vehicle is being pushed along each axis; the gyros sense how fast it is turning about each axis. Summing those readings over time — "dead reckoning" — gives velocity, position and attitude with no outside help at all. That independence is why every rocket carries one, and also why its errors matter so much: nothing inside the IMU can notice its own drift.
:::

::: context specific-force Why an accelerometer on a table reads 1 g
An accelerometer cannot feel gravity directly, because gravity pulls on its proof mass and its case equally. What it feels is every *other* force — the push of the table, the engine, the air — divided by mass. That is **specific force**. Sitting on a table, it feels the table pushing up, so it reads about $9.81\,\mathrm{m/s^2}$ upward even though it is not moving. In free fall, or coasting in orbit, it reads zero. That is also how the calibration rig can use gravity: tilting the sensor changes how much of that $1g$ lies along the axis under test.
:::

::: context least-squares Drawing the best straight line
Given some points that should lie on a line, **least squares** picks the line that makes the sum of squared vertical misses as small as possible. Squaring treats misses above and below the line alike and punishes big misses hard. For a straight line $y = mx + c$ there is an exact formula for the best $m$ and $c$; `np.linalg.lstsq` computes it. Notice the catch the example exposes: least squares finds the best line *of the shape you told it to fit*. If the true process has a different shape, the "best" answer is confidently wrong.
:::

::: context quantization-steps A staircase instead of a ramp
Here a smoothly rising true value (the dashed line) is reported with a quantum of $0.2$. The output jumps in steps and never sits more than half a step, $0.1$, away from the truth.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="340" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="128" x2="40" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="115" x2="320" y2="24" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,115.0 60,115.0 60,102.0 100,102.0 100,89.0 140,89.0 140,76.0 180,76.0 180,63.0 220,63.0 220,50.0 260,50.0 260,37.0 300,37.0 300,24.0 320,24.0"/>
  <text x="330" y="136" font-size="12" text-anchor="end" fill="#1f2a44">true value</text>
  <text x="48" y="20" font-size="12" fill="#1f2a44">reported</text>
  <text x="190" y="110" font-size="12" fill="#1d6fd1">steps of Δ = 0.2</text>
  <text x="235" y="30" font-size="12" fill="#6c7a93">truth</text>
</svg>
```

Each step is one LSB: the value of the last binary digit the converter produces. A 16-bit converter spanning $\pm16g$ has $2^{16} = 65{,}536$ levels, so one step is $32g/65{,}536 \approx 0.0005g$.
:::

::: context crossover-and-margin Crossover, phase margin, and a late signal
The **crossover frequency** is where the loop's gain falls to exactly $1$: slower wiggles get amplified around the loop, faster ones die out. **Phase margin** is how far the loop's phase lag is from $-180^\circ$ at that frequency — how much more lag it can take before a wiggle comes back around perfectly in step with itself and grows. A delay adds lag without changing gain:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="65" x2="340" y2="65" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="30,65.0 40,54.2 50,44.4 60,36.7 70,31.7 80,30.0 90,31.7 100,36.7 110,44.4 120,54.2 130,65.0 140,75.8 150,85.6 160,93.3 170,98.3 180,100.0 190,98.3 200,93.3 210,85.6 220,75.8 230,65.0 240,54.2 250,44.4 260,36.7 270,31.7 280,30.0 290,31.7 300,36.7 310,44.4 320,54.2 330,65.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 3" points="60,65.0 70,54.2 80,44.4 90,36.7 100,31.7 110,30.0 120,31.7 130,36.7 140,44.4 150,54.2 160,65.0 170,75.8 180,85.6 190,93.3 200,98.3 210,100.0 220,98.3 230,93.3 240,85.6 250,75.8 260,65.0 270,54.2 280,44.4 290,36.7 300,31.7 310,30.0 320,31.7 330,36.7"/>
  <line x1="80" y1="22" x2="110" y2="22" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="95" y="16" font-size="12" text-anchor="middle" fill="#1f2a44">τ</text>
  <text x="200" y="122" font-size="12" fill="#1d6fd1">true signal</text>
  <text x="280" y="122" font-size="12" fill="#b4232c">delayed</text>
</svg>
```

Same height, same shape, shifted late. The faster the wiggle, the bigger that shift is as a fraction of one cycle — which is why the cost, $\omega\tau$, grows with frequency.
:::

::: context characteristic-equation What the characteristic equation tells you
Try a solution of the form $y = e^{st}$ in $\dot y = -K_p\,y(t-\tau)$. The left side gives $s\,e^{st}$; the right gives $-K_p e^{s(t-\tau)}$. Divide both by $e^{st}$ and you get $s = -K_p e^{-s\tau}$: the **characteristic equation**. Each root $s$ is a way the loop can move. If every root has a negative real part, every motion dies away. A root with a positive real part grows without bound. A root sitting exactly on the imaginary axis, $s = i\omega$, is a steady swing at frequency $\omega$ — the edge between the two.
:::

::: context random-walk Why noise grows only as the square root of time
Flip a coin each second and step forward on heads, back on tails. After $100$ steps you are not $100$ steps away; the heads and tails mostly cancel, and a typical distance is about $\sqrt{100} = 10$ steps. After $400$ steps, about $20$. Four times the time, only twice the distance. Summed white noise does the same. A bias is like a coin that always lands heads: after $400$ steps you are $400$ steps away. That difference, $\sqrt{t}$ against $t$, is the whole reason bias dominates long navigation errors.
:::

::: context allan-deviation Reading an Allan deviation plot
To make an Allan deviation curve, record a sensor sitting still for hours, average its output over windows of length $\tau$, and measure how much neighboring averages differ. Plot that against $\tau$ on log–log axes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="125" x2="345" y2="125" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="10" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="50,30 170,90 185,95 205,97 225,95 240,90 330,45"/>
  <text x="112" y="46" font-size="11" fill="#1f2a44">noise: slope −1/2</text>
  <text x="205" y="115" font-size="11" text-anchor="middle" fill="#b4232c">bias instability</text>
  <text x="270" y="50" font-size="11" fill="#1f2a44">slope +1/2</text>
  <text x="340" y="142" font-size="11" text-anchor="end" fill="#1f2a44">averaging time (log)</text>
  <text x="46" y="16" font-size="11" fill="#1f2a44">Allan deviation (log)</text>
</svg>
```

At short times, averaging longer beats down white noise, so the curve falls. At long times the bias's slow wander takes over and the curve climbs. The flat floor between is the best you can ever average down to — and its height is the bias instability.
:::

::: context gyro-grades Gyros that use light
A fiber-optic gyro sends laser light both ways around a long coil of optical fiber; a ring-laser gyro does the same inside a closed triangle or square of mirrors. When the device turns, light going with the turn takes slightly longer to get around than light going against it — the **Sagnac effect**. Measuring that tiny difference gives the turn rate with no moving parts. These gyros cost far more than a MEMS chip, which is why navigation-grade units sit on launch vehicles and airliners while phones carry MEMS parts.
:::
