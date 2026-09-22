---
id: l02-imu-error-models
title: IMU error models
minutes: 24
covers:
  - "IMU error models: turn-on and in-run bias, scale factor, non-orthogonality and misalignment, g-sensitivity, quantization"
---

The previous lesson said what a perfect accelerometer and a perfect gyro would report. No sensor is perfect, and the way an inertial navigator copes with that is not to hope the errors are small but to write them down as an explicit **measurement model**: an equation relating the number the sensor outputs to the physical quantity it is trying to sense, with a named parameter for every mechanism that separates the two. The model is a contract. Calibration fixes some of its parameters on a rate table before the unit ships; the navigation filter estimates others in flight; the rest are described statistically and carried as noise. A parameter that appears nowhere in the model is an error that nobody is correcting.

For a gyro triad the model has five deterministic parts and two random ones: a **bias** that is partly fixed at power-on and partly wandering, a **scale factor** error proportional to the rate, a **misalignment and non-orthogonality** matrix that leaks each axis into the others, a **g-sensitivity** that turns specific force into apparent rate, and **quantisation** from the digital output, plus white noise and the slow bias wander that the probability module modelled as a Gauss–Markov process. The accelerometer model is the same with one term fewer. This lesson defines each term, gives its units and typical size for two grades of instrument, and computes what each does to attitude and velocity over a manoeuvre, so that when a later lesson says "the filter estimates the bias", you know which twelve numbers it means and why not the others.

## The measurement model

Write the true angular rate as $\boldsymbol{\omega}_{ib}^{b}$ and the true specific force as $\mathbf{f}^{b}$, both in body axes. The gyro triad outputs

$$
\tilde{\boldsymbol{\omega}}_{ib}^{b} = \left(\mathbf{I}_3 + \mathbf{S}_g + \mathbf{N}_g\right)\boldsymbol{\omega}_{ib}^{b} + \mathbf{b}_g + \mathbf{G}_g\,\mathbf{f}^{b} + \mathbf{w}_g + \mathbf{q}_g ,
$$

and the accelerometer triad outputs

$$
\tilde{\mathbf{f}}^{b} = \left(\mathbf{I}_3 + \mathbf{S}_a + \mathbf{N}_a\right)\mathbf{f}^{b} + \mathbf{b}_a + \mathbf{w}_a + \mathbf{q}_a .
$$

The symbols, in the order the sections below treat them: $\mathbf{b}$ is the bias vector, in $\mathrm{rad/s}$ for the gyro (quoted in $^\circ/\mathrm{h}$) and $\mathrm{m/s^2}$ for the accelerometer (quoted in $\mathrm{\mu g}$ or $\mathrm{mg}$); $\mathbf{S} = \mathrm{diag}(s_1, s_2, s_3)$ holds the dimensionless scale-factor errors, quoted in parts per million; $\mathbf{N}$ is a matrix with zero diagonal whose six off-diagonal entries, in radians, describe how much of each axis' input appears on the other two; $\mathbf{G}_g$ is the gyro's acceleration sensitivity in $(\mathrm{rad/s})/(\mathrm{m/s^2})$, quoted in $^\circ/\mathrm{h}/g$; $\mathbf{w}$ is white noise; $\mathbf{q}$ is quantisation error. A tilde marks a measured quantity throughout the module.

| Term | Tactical MEMS gyro | Navigation-grade gyro | Tactical accelerometer | Navigation accelerometer |
| --- | --- | --- | --- | --- |
| Turn-on bias | $10$ to $50^\circ/\mathrm{h}$ | $0.01$ to $0.03^\circ/\mathrm{h}$ | $1$ to $3\,\mathrm{mg}$ | $50$ to $100\,\mathrm{\mu g}$ |
| In-run bias instability | $0.5$ to $5^\circ/\mathrm{h}$ | $0.001$ to $0.01^\circ/\mathrm{h}$ | $50$ to $200\,\mathrm{\mu g}$ | $5$ to $20\,\mathrm{\mu g}$ |
| Scale factor | $100$ to $1000\,\mathrm{ppm}$ | $1$ to $10\,\mathrm{ppm}$ | $300$ to $1000\,\mathrm{ppm}$ | $10$ to $50\,\mathrm{ppm}$ |
| Misalignment, non-orthogonality | $0.1$ to $1\,\mathrm{mrad}$ | $10$ to $50\,\mathrm{\mu rad}$ | $0.1$ to $1\,\mathrm{mrad}$ | $10$ to $50\,\mathrm{\mu rad}$ |
| $g$-sensitivity | $0.1$ to $1^\circ/\mathrm{h}/g$ | below $0.01^\circ/\mathrm{h}/g$ | — | — |

These are typical post-calibration residuals, not raw values; the raw scale factor of a MEMS gyro can be off by per cent before the factory table is applied.

## Bias: turn-on and in-run

Bias is the output with zero input. It has two parts with different time scales and different remedies.

The **turn-on bias** (also *bias repeatability*, or run-to-run bias) is the value the bias takes when the unit is powered, constant for the run and different at the next power-up. It comes from the electronics and mechanics settling into a slightly different state each time. It cannot be calibrated away in the factory, because it does not repeat; it must be measured at the start of every run, which is one of the jobs of initial alignment, or estimated continuously by the aiding filter. Uncorrected, a turn-on bias $b$ integrates into an attitude error $b\,t$: a $20^\circ/\mathrm{h}$ tactical turn-on bias left in place for a $60\,\mathrm{s}$ coast produces $20 \times 60/3600 = 0.33^\circ$, while a navigation-grade $0.03^\circ/\mathrm{h}$ produces $0.0005^\circ$, under two arcseconds.

The **in-run bias** is the wander around that value during the run: the Gauss–Markov process of the probability module, with a standard deviation the datasheets call **bias instability** and a correlation time of minutes to hours. It is the part of the bias that the filter can never quite pin down, because it moves while being estimated, and it is the number that sets the grade of the instrument. Over intervals short compared with the correlation time it behaves like a constant bias, and the attitude error grows as $\sigma_b\,t$; over longer intervals it wanders and the error grows more slowly, as the probability module computed.

For the accelerometer the same two parts exist, in $\mathrm{\mu g}$, and both are read as tilts: a $1\,\mathrm{mg}$ turn-on bias is a $1\,\mathrm{mrad}$ level error until something corrects it, and a $50\,\mathrm{\mu g}$ instability is a $50\,\mathrm{\mu rad}$ wander in the apparent vertical.

::: key Bias, in two parts
Turn-on bias is constant within a run and different between runs; it must be estimated afresh each run, by alignment or by the aiding filter. In-run bias is the wander during the run, modelled as first-order Gauss–Markov with standard deviation equal to the bias instability. An uncorrected gyro bias $b$ gives attitude error $b\,t$; an accelerometer bias $a$ is indistinguishable from a tilt of $a/g$.
:::

## Scale factor

The scale factor error $s$ makes the output $(1 + s)$ times the input. Its effect is proportional to the rate being measured, so it is invisible on a stationary vehicle and dominant during a fast manoeuvre. Over a rotation through angle $\Delta\theta$ the attitude error is $s\,\Delta\theta$, whatever the rate profile: $500\,\mathrm{ppm}$ on a $90^\circ$ roll is $500 \times 10^{-6} \times 90^\circ = 0.045^\circ$, or $162$ arcseconds, which is more than a navigation-grade gyro's bias accumulates in an hour. For the accelerometer, $s$ multiplies the sensed specific force: $300\,\mathrm{ppm}$ under a sustained $3\,g$ boost for $150\,\mathrm{s}$ gives a velocity error of $300 \times 10^{-6} \times 3 \times 9.80665 \times 150 = 1.32\,\mathrm{m/s}$. Note that the accelerometer's scale factor acts even at rest, on the $1\,g$ of gravity reaction; a $300\,\mathrm{ppm}$ error there is $300\,\mathrm{\mu g}$ on the vertical axis.

Two refinements matter for the better instruments. **Nonlinearity** makes $s$ depend on the input; it is calibrated as a polynomial. **Asymmetry** gives different scale factors for positive and negative inputs, $s_+ \ne s_-$, and this has a consequence that looks like something else. Under a symmetric oscillation the positive half-cycles are stretched and the negative ones are not, so the average output is no longer zero: a zero-mean vibration produces a **rectified** bias of $\tfrac{1}{2}(s_+ - s_-)\,\overline{|\omega|}$, where $\overline{|\omega|}$ is the mean absolute rate, equal to $2\omega_0/\pi$ for a sinusoid of amplitude $\omega_0$. With a $200\,\mathrm{ppm}$ asymmetry and a $\pm 10^\circ/\mathrm{s}$ oscillation the rectified bias is $100 \times 10^{-6} \times 6.37^\circ/\mathrm{s} = 6.4 \times 10^{-4}\,{}^\circ/\mathrm{s} = 2.3^\circ/\mathrm{h}$, appearing only while the vibration lasts and vanishing in a static test.

## Non-orthogonality and misalignment

The matrix $\mathbf{N}$ describes an imperfect triad. Its entry $N_{ij}$ is the fraction of the input on axis $j$ that appears in the output of sensor $i$; for small angles it is the angle, in radians, by which sensor $i$'s sensitive axis is tilted toward axis $j$. Six numbers, and they split into two kinds with different meanings.

Any $\mathbf{N}$ can be written as the sum of a skew-symmetric part and a symmetric part. The skew-symmetric part, three independent numbers $\boldsymbol{\epsilon}$, has the form $-[\boldsymbol{\epsilon}\times]$, and $\mathbf{I} - [\boldsymbol{\epsilon}\times]$ is a small rotation. This part rotates the whole triad rigidly and is the **misalignment**: the sensor axes are orthogonal to one another but not parallel to the axes painted on the case, or the case is not parallel to the vehicle. A mounting error and a triad misalignment are the same thing to the navigator and are removed together, by measuring the IMU's orientation relative to the vehicle's reference axes, a procedure called boresighting. The symmetric part, the other three numbers, is the **non-orthogonality**: the sensitive axes are not at right angles to each other, and no rotation of the triad can fix that. It has to be calibrated on a multi-axis rate table and corrected by multiplying the output by the inverse of the calibrated matrix.

The effect of either is a leak of one axis into another, proportional to the input. A $1\,\mathrm{mrad}$ misalignment leaks $1\,\mathrm{mrad}$ of the roll rate into pitch and yaw: through a $90^\circ$ roll that is $0.09^\circ$ of attitude error on the transverse axes, twice the scale-factor error computed above. For the accelerometers the input that leaks is the thrust: a $0.5\,\mathrm{mrad}$ misalignment under a $3\,g$ axial load puts $1.5\,\mathrm{mg}$ onto a lateral axis, which over $150\,\mathrm{s}$ integrates to $2.2\,\mathrm{m/s}$ of lateral velocity and $165\,\mathrm{m}$ of lateral position. The static case is subtler and sets the requirement for the best instruments: on the bench the only gyro input is Earth rate, so a $1\,\mathrm{mrad}$ misalignment leaks $10^{-3} \times 15^\circ/\mathrm{h} = 0.015^\circ/\mathrm{h}$ — negligible against a MEMS bias, but larger than a navigation-grade gyro's whole bias budget, which is why such units are aligned to tens of microradians.

::: example A ninety-degree roll through the gyro model
A vehicle rolls at a steady $30^\circ/\mathrm{s}$ for $3\,\mathrm{s}$. Its gyro triad has $500\,\mathrm{ppm}$ of scale-factor error on every axis, a $1\,\mathrm{mrad}$ misalignment about both transverse axes, a $1^\circ/\mathrm{h}$ bias on every axis, and a $g$-sensitivity of $1^\circ/\mathrm{h}/g$. The vehicle is level, so the specific force is $(0, 0, -9.807)\,\mathrm{m/s^2}$ in body axes.

```python
import numpy as np

def skew(v):
    return np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])

def gyro_model(omega_true, f_true, s, eps, b, G):
    """Deterministic part of the gyro measurement model, rad/s.

    s   : scale-factor errors (dimensionless), one per axis
    eps : small rotation of the triad relative to the body axes, rad
    b   : bias, rad/s
    G   : acceleration sensitivity, (rad/s) per (m/s^2)
    """
    M = np.eye(3) + np.diag(s) - skew(eps)       # scale factor and misalignment
    return M @ omega_true + b + G @ f_true

deg = np.pi / 180.0
omega = np.array([30.0 * deg, 0.0, 0.0])         # a steady 30 deg/s roll
f = np.array([0.0, 0.0, -9.80665])               # level, at rest apart from the roll
s = np.array([500e-6, 500e-6, 500e-6])           # 500 ppm
eps = np.array([0.0, 1e-3, 1e-3])                # 1 mrad about y and z
b = np.array([1.0, 1.0, 1.0]) * deg / 3600.0     # 1 deg/h
G = np.eye(3) * (1.0 * deg / 3600.0) / 9.80665   # 1 deg/h per g

err_rate = gyro_model(omega, f, s, eps, b, G) - omega
print(err_rate / deg * 3600.0)                   # rate error per axis, deg/h
print(err_rate / deg * 3.0)                      # angle error after a 3 s (90 deg) roll, deg
# [  55. -107.  108.]
# [ 0.04583333 -0.08916667  0.09       ]
```

On the roll axis the error is $55^\circ/\mathrm{h}$: $54^\circ/\mathrm{h}$ from $500\,\mathrm{ppm}$ of $30^\circ/\mathrm{s}$ and $1^\circ/\mathrm{h}$ of bias, integrating to $0.046^\circ$. On the two transverse axes the misalignment leaks $10^{-3} \times 30^\circ/\mathrm{s} = 108^\circ/\mathrm{h}$, more than a hundred times the bias, and the $z$ axis also carries $-1^\circ/\mathrm{h}$ of $g$-sensitive bias from the $1\,g$ it sits under, which is why its total is $108$ and $y$'s is $-107$: the sign of the $y$ leak comes from the cross product. After the $3\,\mathrm{s}$ roll the attitude is wrong by about $0.09^\circ$ on each transverse axis and $0.046^\circ$ in roll. During this manoeuvre the bias, which the datasheet headline advertises, contributed less than one per cent of the error.
:::

## Acceleration sensitivity

A gyro should respond to rotation only, but every real mechanism deforms under load. In a mechanical gyro a mass unbalance along the spin axis produces a torque proportional to acceleration; in a MEMS gyro the specific force deflects the proof mass and shifts the sense pick-off; in any instrument, structural compliance moves the sensitive axis a little. The result is the term $\mathbf{G}_g\mathbf{f}^{b}$: an apparent rate proportional to specific force, quoted in degrees per hour per $g$. MEMS values of $0.1$ to $1^\circ/\mathrm{h}/g$ are common; optical gyros have none in principle, and their residual comes from mounting compliance.

Two consequences. First, the sensitivity is present on the bench, where one axis always sees $1\,g$, so part of what a static test calls "bias" is actually $g$-sensitive and changes when the unit is turned over: a $1^\circ/\mathrm{h}/g$ gyro's bias swings by $2^\circ/\mathrm{h}$ between axis-up and axis-down, which is how the multi-position test of a later lesson separates the two. Second, the sensitivity is what a boost does to a gyro. Under a sustained $3\,g$ axial acceleration a $1^\circ/\mathrm{h}/g$ sensitivity adds $3^\circ/\mathrm{h}$ of bias for the duration; over a $150\,\mathrm{s}$ first-stage burn that is $0.125^\circ$ of attitude, three times what the $1^\circ/\mathrm{h}$ bias itself produces in the same time. There is also a second-order term proportional to $f^2$, the anisoelastic or $g^2$ sensitivity, which rectifies vibration in the same way an asymmetric scale factor does; it is treated with vibration rectification in the last lesson of this module.

## Quantisation

A digital IMU outputs integers. A rate sensor sampled through an analogue-to-digital converter delivers the rate rounded to the nearest least significant bit (LSB); an integrating sensor such as a ring laser delivers a count of angle pulses, each a fixed increment. In both cases the output differs from the truth by a **quantisation error** $q$ that lies within half a step of zero and, when the signal moves across many steps between samples, is uniformly distributed with variance $\Delta^2/12$ for step size $\Delta$.

::: example What sixteen bits cost
A MEMS gyro digitises $\pm 250^\circ/\mathrm{s}$ into sixteen bits, so one LSB is $500/65\,536 = 0.00763^\circ/\mathrm{s}$; at a $100\,\mathrm{Hz}$ output rate each sample's angle increment is quantised to $7.6 \times 10^{-5}\,{}^\circ$, about $0.27$ arcseconds. If the rounding errors of successive samples are independent, they form a white sequence of standard deviation $0.00763/\sqrt{12} = 0.0022^\circ/\mathrm{s}$, equivalent to a rate noise density of $0.0022/\sqrt{100} = 2.2 \times 10^{-4}\,{}^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$, or an angle random walk of $60 \times 2.2 \times 10^{-4} = 0.013^\circ/\sqrt{\mathrm{h}}$. That is comfortably below a tactical gyro's $0.1^\circ/\sqrt{\mathrm{h}}$ and well above a navigation-grade gyro's $0.002^\circ/\sqrt{\mathrm{h}}$: sixteen bits over that range are enough for the first and would ruin the second. The same arithmetic for an accelerometer digitising $\pm 16\,g$ into sixteen bits gives an LSB of $0.49\,\mathrm{mg}$, a per-sample sigma of $1.4 \times 10^{-3}\,\mathrm{m/s^2}$, an equivalent density of $14\,\mathrm{\mu g}/\sqrt{\mathrm{Hz}}$ and a velocity random walk of $0.0083\,\mathrm{m/s}/\sqrt{\mathrm{h}}$.
:::

The white-sequence assumption fails in an instructive way. When the rate is nearly constant and the signal crosses fewer than one LSB per sample, the same rounding error repeats sample after sample and the quantisation is a deterministic function of the input, not a noise. And for an integrating sensor the situation is different again: the accumulated *angle* is what is quantised, so the angle error never exceeds one pulse no matter how long the count runs, and the apparent rate noise averages away as $1/\tau$ rather than $1/\sqrt{\tau}$. On the Allan deviation plot of a later lesson that behaviour is the slope of $-1$, distinct from the $-\tfrac{1}{2}$ of white noise. Two sensors with the same LSB can therefore have completely different long-term behaviour depending on whether the rate or the angle is the quantity being rounded.

::: warning
Applying the quantisation correction, or any of these corrections, in the wrong order is a classic error. The model says the output is scale factor and misalignment applied to the truth, then bias added; the compensation must therefore subtract the bias first and then multiply by the inverse of $(\mathbf{I} + \mathbf{S} + \mathbf{N})$, not the other way round. With $500\,\mathrm{ppm}$ of scale factor and $20^\circ/\mathrm{h}$ of bias the order matters at the $0.01^\circ/\mathrm{h}$ level, which is exactly the level a navigation-grade unit lives at.
:::

## Which terms go where

The model sorts its own parameters into three bins. Scale factor, non-orthogonality, misalignment and $g$-sensitivity are stable properties of the hardware, so they are measured once, on a rate table and in a thermal chamber, and stored as calibration tables; the navigator applies them to every sample before it integrates anything. Turn-on bias and in-run bias are not stable, so they become states: the six bias states of the fifteen-state error model that a later lesson of this module builds, augmented with scale factors when the vehicle's dynamics are large enough for a residual scale-factor error to matter, which is what turns fifteen states into twenty-one. White noise and quantisation are described statistically and enter the filter as process noise, sized from the Allan deviation of the next two lessons. Nothing in the model is left to hope.

## Check yourself

::: check
A gyro datasheet lists bias repeatability $30^\circ/\mathrm{h}$, in-run bias instability $1^\circ/\mathrm{h}$ and scale factor $300\,\mathrm{ppm}$. Compare the attitude error each term produces over a $60\,\mathrm{s}$ interval (a) with the vehicle stationary and (b) during a $360^\circ$ turn at $6^\circ/\mathrm{s}$, assuming nothing has been estimated.
:::

::: answer
Stationary, the scale factor acts only on Earth rate, $300 \times 10^{-6} \times 15^\circ/\mathrm{h} = 0.0045^\circ/\mathrm{h}$, which is negligible. The turn-on bias gives $30 \times 60/3600 = 0.5^\circ$ and the in-run instability about $1 \times 60/3600 = 0.017^\circ$. In the turn the biases give the same figures, but the scale factor now acts on $360^\circ$ of rotation: $300 \times 10^{-6} \times 360 = 0.108^\circ$, six times the in-run bias contribution. The turn-on bias dominates both cases, which is why alignment must remove it before the coast begins; once it has, the scale factor is the largest remaining term during the turn and the in-run bias the largest at rest.
:::

::: check
Explain why the skew-symmetric part of the matrix $\mathbf{N}$ can be absorbed into the IMU-to-body mounting rotation while the symmetric part cannot, and what each therefore requires for its calibration.
:::

::: answer
To first order in small angles $\mathbf{I} - [\boldsymbol{\epsilon}\times]$ is the direction cosine matrix of a rotation by the vector $\boldsymbol{\epsilon}$, so a skew-symmetric $\mathbf{N}$ turns the whole triad rigidly: the three sensitive axes remain mutually orthogonal and are merely pointed slightly differently. That is indistinguishable from bolting a perfect IMU to the vehicle at a slight angle, and both are corrected by a single rotation measured by boresighting the unit to the vehicle's reference axes. A symmetric $\mathbf{N}$ changes the angles *between* the sensitive axes, which is a deformation of the triad, not a rotation of it; no rotation matrix has that effect, so it must be measured by exciting each axis in turn on a rate table and reading the response of the others, then inverted numerically.
:::

::: check
A level, stationary accelerometer triad reads $(0.0098,\ 0,\ -9.8067)\,\mathrm{m/s^2}$. Offer two explanations for the $x$ reading and say how a single extra measurement distinguishes them.
:::

::: answer
The $x$ reading is $1\,\mathrm{mg}$. It could be a $1\,\mathrm{mg}$ bias on the $x$ accelerometer, or a pitch of $1\,\mathrm{mrad}$ (nose up, so that a component of the upward gravity reaction appears along $x$); from one reading the two are identical, which is the bias–tilt equivalence. Rotate the unit $180^\circ$ about the vertical and read again: a bias stays at $+0.0098$, while a tilt reverses sign to $-0.0098$ because the $x$ axis now points the other way relative to the tilt. Half the sum of the two readings is the bias and half the difference is $g$ times the tilt. This is the principle of the multi-position calibration test.
:::

::: check
A gyro's bias on the bench measures $2.4^\circ/\mathrm{h}$ with its sensitive axis pointing up and $0.4^\circ/\mathrm{h}$ with the axis pointing down. Separate the true bias from the $g$-sensitivity, and predict the bias during a $3\,g$ boost with the axis along the thrust.
:::

::: answer
Axis up, the sensor sees $+1\,g$ of specific force along its axis; axis down, $-1\,g$. So $2.4 = b + G$ and $0.4 = b - G$, giving $b = 1.4^\circ/\mathrm{h}$ and $G = 1.0^\circ/\mathrm{h}/g$. During the boost the specific force along the axis is $3\,g$, so the bias becomes $1.4 + 3.0 = 4.4^\circ/\mathrm{h}$, more than three times its bench value. A filter that estimated the bias while stationary and held it fixed through the burn would be wrong by $3^\circ/\mathrm{h}$ for the duration.
:::

::: check
Why does the quantisation of an integrating gyro's pulse output not produce an angle random walk, while the quantisation of a sampled rate output does?
:::

::: answer
A pulse-output gyro rounds the accumulated angle: the count at any time equals the true integrated angle to within one pulse, so the angle error is bounded by one increment forever and cannot grow. The apparent noise on the rate, obtained by differencing counts, averages down as $1/\tau$ and appears on an Allan plot with slope $-1$. A sampled-rate output rounds each rate sample independently; when the signal is noisy enough to move across many LSBs between samples the rounding errors are uncorrelated, they are integrated into angle like any white rate noise, and the angle error grows as $\sqrt{t}$, a genuine random walk with slope $-\tfrac{1}{2}$ on the Allan plot. Same LSB, different quantity rounded, different long-term behaviour.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\tilde{\boldsymbol{\omega}} = (\mathbf{I} + \mathbf{S}_g + \mathbf{N}_g)\boldsymbol{\omega} + \mathbf{b}_g + \mathbf{G}_g\mathbf{f} + \mathbf{w}_g + \mathbf{q}_g$ | Gyro measurement model |
| $\tilde{\mathbf{f}} = (\mathbf{I} + \mathbf{S}_a + \mathbf{N}_a)\mathbf{f} + \mathbf{b}_a + \mathbf{w}_a + \mathbf{q}_a$ | Accelerometer measurement model |
| Turn-on bias | Constant per run, new each run; removed by alignment or the filter; angle error $b\,t$ |
| In-run bias | Gauss–Markov wander; its standard deviation is the bias instability |
| $\mathbf{S} = \mathrm{diag}(s_i)$, ppm | Scale factor: error $s\,\Delta\theta$ over a rotation; rectified bias $\tfrac{1}{2}(s_+ - s_-)\overline{\lvert\omega\rvert}$ from asymmetry |
| $\mathbf{N}$: skew part $-[\boldsymbol{\epsilon}\times]$ | Misalignment, a rotation; boresight it to the vehicle |
| $\mathbf{N}$: symmetric part | Non-orthogonality; no rotation removes it; rate-table calibration |
| $\mathbf{G}_g$, $^\circ/\mathrm{h}/g$ | $g$-sensitivity: bias changes with specific force, on the bench and in boost |
| $\operatorname{Var}(q) = \Delta^2/12$ | Quantisation: random walk if rate samples are rounded, bounded if angle is rounded |
| $1\,\mathrm{mg} \leftrightarrow 1\,\mathrm{mrad}$ | Accelerometer bias and tilt are indistinguishable from one reading |

The next lesson takes the two random terms of this model, the white noise and the wandering bias, and adds the third, rate random walk, giving each its datasheet name and its law of growth in attitude, velocity and position.
