---
id: l02-imu-error-models
title: IMU error models
minutes: 21
covers:
  - "IMU error models: turn-on and in-run bias, scale factor, non-orthogonality and misalignment, g-sensitivity, quantization"
---

Think of a cheap bathroom scale. It reads $0.4\,\mathrm{kg}$ with nobody on it. It reads $2\%$ high on everything. It gives a different empty reading every morning. And it only shows whole tenths of a kilogram. Each flaw has a name and a size, and once you know them you can correct the reading.

The last lesson said what a *perfect* accelerometer and gyro would report. No sensor is perfect. An inertial navigator does not hope the errors are small. It writes them down as a **measurement model**: an equation linking the number the sensor outputs to the true quantity, with a named parameter for every way the two differ.

The model is a contract. **[[Calibration|calibration]]** fixes some parameters on a test machine before the unit ships. The navigation filter estimates others in flight. The rest are described statistically and carried as noise. A parameter that appears nowhere in the model is an error nobody is correcting.

For a gyro triad the model has five fixed parts and two random ones:

- a **bias**, partly fixed at power-on and partly wandering;
- a **scale-factor** error, proportional to the rate;
- a **misalignment and non-orthogonality** matrix that leaks each axis into the others;
- a **g-sensitivity** that turns specific force into fake rate;
- **quantization** from the digital output;
- plus white noise, and the slow bias wander the probability module modeled as a Gauss–Markov process.

The accelerometer model is the same with one term fewer. This lesson defines each term, gives its units and typical size, and works out what each does to attitude and velocity. Then when a later lesson says "the filter estimates the bias", you will know which numbers it means, and why not the others.

## The measurement model

Write the true angular rate as $\boldsymbol{\omega}_{ib}^{b}$ and the true specific force as $\mathbf{f}^{b}$, both in body axes. A **tilde** (the wavy mark, read "omega tilde") marks a measured value throughout this module. The gyro triad outputs

$$
\tilde{\boldsymbol{\omega}}_{ib}^{b} = \left(\mathbf{I}_3 + \mathbf{S}_g + \mathbf{N}_g\right)\boldsymbol{\omega}_{ib}^{b} + \mathbf{b}_g + \mathbf{G}_g\,\mathbf{f}^{b} + \mathbf{w}_g + \mathbf{q}_g ,
$$

and the accelerometer triad outputs

$$
\tilde{\mathbf{f}}^{b} = \left(\mathbf{I}_3 + \mathbf{S}_a + \mathbf{N}_a\right)\mathbf{f}^{b} + \mathbf{b}_a + \mathbf{w}_a + \mathbf{q}_a .
$$

Read it like a recipe: take the truth, stretch and skew it with the matrix in brackets, then add bias, fake rate from specific force, noise, and rounding. The pieces, in the order this lesson treats them:

- $\mathbf{b}$ is the **bias** vector: in $\mathrm{rad/s}$ for the gyro (quoted in $^\circ/\mathrm{h}$) and $\mathrm{m/s^2}$ for the accelerometer (quoted in $\mathrm{\mu g}$ or $\mathrm{mg}$).
- $\mathbf{S} = \mathrm{diag}(s_1, s_2, s_3)$ holds the **scale-factor errors**, pure numbers quoted in **[[parts per million|ppm]]** (ppm).
- $\mathbf{N}$ is a matrix with zeros on the diagonal. Its six other entries, in radians, say how much of each axis's input shows up on the other two.
- $\mathbf{G}_g$ is the gyro's **acceleration sensitivity**, in $(\mathrm{rad/s})/(\mathrm{m/s^2})$, quoted in $^\circ/\mathrm{h}/g$.
- $\mathbf{w}$ is white noise and $\mathbf{q}$ is quantization error.

| Term | Tactical MEMS gyro | Navigation-grade gyro | Tactical accelerometer | Navigation accelerometer |
| --- | --- | --- | --- | --- |
| Turn-on bias | $10$ to $50^\circ/\mathrm{h}$ | $0.01$ to $0.03^\circ/\mathrm{h}$ | $1$ to $3\,\mathrm{mg}$ | $50$ to $100\,\mathrm{\mu g}$ |
| In-run bias instability | $0.5$ to $5^\circ/\mathrm{h}$ | $0.001$ to $0.01^\circ/\mathrm{h}$ | $50$ to $200\,\mathrm{\mu g}$ | $5$ to $20\,\mathrm{\mu g}$ |
| Scale factor | $100$ to $1000\,\mathrm{ppm}$ | $1$ to $10\,\mathrm{ppm}$ | $300$ to $1000\,\mathrm{ppm}$ | $10$ to $50\,\mathrm{ppm}$ |
| Misalignment, non-orthogonality | $0.1$ to $1\,\mathrm{mrad}$ | $10$ to $50\,\mathrm{\mu rad}$ | $0.1$ to $1\,\mathrm{mrad}$ | $10$ to $50\,\mathrm{\mu rad}$ |
| $g$-sensitivity | $0.1$ to $1^\circ/\mathrm{h}/g$ | below $0.01^\circ/\mathrm{h}/g$ | — | — |

These are typical values *left over after* factory calibration. Before the factory table is applied, a MEMS gyro's scale factor can be off by whole percent.

## Bias: turn-on and in-run

**Bias** is what the sensor outputs when the true input is zero — the bathroom scale's empty reading. It has two parts, on different time scales, with different cures.

The **turn-on bias** (also called *bias repeatability* or run-to-run bias) is the value the bias takes at power-up. It stays constant for that run and is different next time, because the electronics and mechanics settle into a slightly different state each time. The factory cannot calibrate it away, because it does not repeat. It must be measured at the start of every run — one job of initial alignment — or estimated all along by the aiding filter.

Left alone, a turn-on bias $b$ integrates into an attitude error $b\,t$. Two examples over a $60\,\mathrm{s}$ coast:

- tactical, $20^\circ/\mathrm{h}$: $20 \times 60/3600 = 0.33^\circ$;
- navigation grade, $0.03^\circ/\mathrm{h}$: $0.03 \times 60/3600 = 0.0005^\circ$, under two arcseconds.

The **in-run bias** is the wander around that value during the run. It is the **[[Gauss–Markov process|gauss-markov]]** from the probability module. Its standard deviation is what datasheets call **bias instability**, and it has a correlation time of minutes to hours. This is the part the filter can never quite pin down, because it moves while being estimated, and it is the number that sets the instrument's grade. Over times short compared with the correlation time it acts like a constant, and attitude error grows as $\sigma_b\,t$. Over longer times it wanders, and the error grows more slowly.

The accelerometer has the same two parts, in $\mathrm{\mu g}$, and both read as tilts. A $1\,\mathrm{mg}$ turn-on bias is a $1\,\mathrm{mrad}$ level error until something corrects it. A $50\,\mathrm{\mu g}$ instability is a $50\,\mathrm{\mu rad}$ wander in the apparent vertical.

::: key Bias, in two parts
Turn-on bias is constant within a run and different between runs; it must be estimated afresh each run, by alignment or by the aiding filter. In-run bias is the wander during the run, modeled as first-order Gauss–Markov with standard deviation equal to the bias instability. An uncorrected gyro bias $b$ gives attitude error $b\,t$; an accelerometer bias $a$ is indistinguishable from a tilt of $a/g$.
:::

## Scale factor

A ruler printed $2\%$ too small makes every length read $2\%$ too long — tiny for a pencil, big for a room. A **scale-factor error** $s$ works the same way: the output is $(1 + s)$ times the input.

So its effect grows with the rate being measured. It is invisible when the vehicle sits still and dominant in a fast maneuver. Over a turn through angle $\Delta\theta$, the attitude error is $s\,\Delta\theta$, however fast or slow the turn. For $500\,\mathrm{ppm}$ on a $90^\circ$ roll:

$$
500 \times 10^{-6} \times 90^\circ = 0.045^\circ = 162\ \text{arcseconds},
$$

more than a navigation-grade gyro's bias piles up in an hour.

For the accelerometer, $s$ multiplies the specific force. Take $300\,\mathrm{ppm}$ under a steady $3\,g$ boost for $150\,\mathrm{s}$. The velocity error is

$$
300 \times 10^{-6} \times 3 \times 9.80665 \times 150 = 1.32\,\mathrm{m/s}.
$$

The accelerometer's scale factor works even at rest, on the $1\,g$ holding the sensor up: $300\,\mathrm{ppm}$ there is $300\,\mathrm{\mu g}$ on the vertical axis.

Two refinements matter for better instruments. **Nonlinearity** makes $s$ depend on the input; it is calibrated as a polynomial. **Asymmetry** gives different scale factors for positive and negative inputs, $s_+ \ne s_-$, and that has a sneaky result.

Shake the sensor back and forth evenly. The positive half-swings are stretched more than the negative ones, so the average output is no longer zero. A zero-average vibration makes a **[[rectified|rectification]]** bias of $\tfrac{1}{2}(s_+ - s_-)\,\overline{|\omega|}$. Here $\overline{|\omega|}$ ("mean absolute omega") is the average size of the rate, ignoring sign, which is $2\omega_0/\pi$ for a sine wave of amplitude $\omega_0$.

With $200\,\mathrm{ppm}$ of asymmetry and a $\pm 10^\circ/\mathrm{s}$ oscillation: the mean size is $2 \times 10/\pi = 6.37^\circ/\mathrm{s}$, so the rectified bias is $100 \times 10^{-6} \times 6.37 = 6.4 \times 10^{-4}\,{}^\circ/\mathrm{s} = 2.3^\circ/\mathrm{h}$. It appears only while the vibration lasts, and vanishes in a static test.

::: note Why it has to be true
Split the average output into the moments when $\omega > 0$ and when $\omega < 0$. For an even oscillation each takes half the time, with average size $\tfrac12\overline{|\omega|}$ each. The positive part contributes $(1 + s_+)\cdot\tfrac12\overline{|\omega|}$ and the negative part $-(1 + s_-)\cdot\tfrac12\overline{|\omega|}$. Add them: the $1$'s cancel, leaving $\tfrac12(s_+ - s_-)\overline{|\omega|}$.
:::

## Non-orthogonality and misalignment

The matrix $\mathbf{N}$ describes an imperfect triad. Its entry $N_{ij}$ is the fraction of axis $j$'s input that appears in sensor $i$'s output. For small angles, it is the angle in radians by which sensor $i$ leans toward axis $j$. That makes six numbers, and they split into two kinds.

Any matrix can be written as a **skew-symmetric** part (flipping it across the diagonal flips its sign) plus a **symmetric** part (flipping changes nothing). Each part here has three numbers, and they mean different things.

- The skew-symmetric part has the form $-[\boldsymbol{\epsilon}\times]$, built from a small angle vector $\boldsymbol{\epsilon}$ ("epsilon"). The matrix $\mathbf{I} - [\boldsymbol{\epsilon}\times]$ is a small rotation. So this part turns the whole triad rigidly. This is **misalignment**: the three axes are still square to each other, but not parallel to the marks on the case — or the case is not parallel to the vehicle. To the navigator, mounting error and triad misalignment are the same thing. Both are removed together by measuring the IMU's orientation against the vehicle's reference axes, called **[[boresighting|boresighting]]**.
- The symmetric part is **non-orthogonality**: the axes are not at right angles to each other. No rotation can fix that. It is measured on a multi-axis rate table and removed by multiplying the output by the inverse of the calibrated matrix.

Either kind leaks one axis into another, in proportion to the input. A $1\,\mathrm{mrad}$ misalignment leaks $1\,\mathrm{mrad}$ of the roll rate into pitch and yaw. Through a $90^\circ$ roll that is $0.09^\circ$ of attitude error on the side axes — twice the scale-factor error above.

For accelerometers, the input that leaks is thrust. A $0.5\,\mathrm{mrad}$ misalignment under a $3\,g$ push along the rocket puts $1.5\,\mathrm{mg}$ onto a sideways axis. Over $150\,\mathrm{s}$ that builds up $2.2\,\mathrm{m/s}$ of sideways velocity and $165\,\mathrm{m}$ of sideways position.

On the bench, the only gyro input is Earth rate. A $1\,\mathrm{mrad}$ misalignment leaks $10^{-3} \times 15^\circ/\mathrm{h} = 0.015^\circ/\mathrm{h}$. That is nothing next to a MEMS bias, but more than a navigation-grade gyro's whole bias budget. So those units are aligned to tens of microradians.

::: example A ninety-degree roll through the gyro model
A vehicle rolls at a steady $30^\circ/\mathrm{s}$ for $3\,\mathrm{s}$. Its gyro triad has:

- $500\,\mathrm{ppm}$ of scale-factor error on every axis;
- a $1\,\mathrm{mrad}$ misalignment about both side axes ($y$ and $z$);
- a $1^\circ/\mathrm{h}$ bias on every axis;
- a $g$-sensitivity of $1^\circ/\mathrm{h}/g$.

The vehicle is level, so the specific force is $(0, 0, -9.807)\,\mathrm{m/s^2}$ in body axes.

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
# [ 0.04583333 -0.08916667  0.09      ]
```

**Roll axis.** $500\,\mathrm{ppm}$ of $30^\circ/\mathrm{s}$ is $0.015^\circ/\mathrm{s} = 54^\circ/\mathrm{h}$. Add $1^\circ/\mathrm{h}$ of bias to get $55^\circ/\mathrm{h}$, which over $3\,\mathrm{s}$ is $0.046^\circ$.

**Side axes.** The misalignment leaks $10^{-3} \times 30^\circ/\mathrm{s} = 108^\circ/\mathrm{h}$ — over a hundred times the bias. The cross product makes the $y$ leak negative and the $z$ leak positive. Then $y$ gets $+1^\circ/\mathrm{h}$ of bias, giving $-107$. The $z$ axis sits under $1\,g$ pointing along $-z$, so it also gets $-1^\circ/\mathrm{h}$ from $g$-sensitivity, which cancels its bias and leaves $108$.

After the $3\,\mathrm{s}$ roll, attitude is off by about $0.09^\circ$ on each side axis and $0.046^\circ$ in roll. The bias — the datasheet's headline number — caused less than one percent of it.
:::

## Acceleration sensitivity

A gyro should respond only to turning. But every real mechanism bends a little under load. In a spinning-wheel gyro, a slightly off-center mass makes a twist proportional to acceleration. In a MEMS gyro, specific force pushes the proof mass and shifts the pick-off. In any instrument, the mounting flexes and moves the sensing axis a little.

The result is the term $\mathbf{G}_g\mathbf{f}^{b}$: a fake rate proportional to specific force, quoted in degrees per hour per $g$. MEMS values of $0.1$ to $1^\circ/\mathrm{h}/g$ are common. Optical gyros have none in principle; what they show comes from mounting flex.

Two consequences follow.

**It is there on the bench.** One axis always sees $1\,g$, so part of what a static test calls "bias" is really $g$-sensitivity, and it changes when you flip the unit over. A $1^\circ/\mathrm{h}/g$ gyro's bias swings by $2^\circ/\mathrm{h}$ between axis-up and axis-down. That is how the multi-position test of a later lesson separates the two.

**It is what a boost does to a gyro.** Under a steady $3\,g$ push, a $1^\circ/\mathrm{h}/g$ sensitivity adds $3^\circ/\mathrm{h}$ of bias for as long as it lasts. Over a $150\,\mathrm{s}$ first-stage burn that is $3 \times 150/3600 = 0.125^\circ$ of attitude — three times what the $1^\circ/\mathrm{h}$ bias itself does in that time.

There is also a second-order term, proportional to $f^2$, called anisoelastic or $g^2$ sensitivity. It rectifies vibration the way an asymmetric scale factor does. The last lesson of this module treats it with vibration rectification.

## Quantization

A digital IMU outputs whole numbers. A rate sensor feeds an **analog-to-digital converter**, which rounds the rate to the nearest step, the **[[least significant bit|lsb]]** (LSB). An integrating sensor such as a ring laser outputs a count of angle pulses, each a fixed step.

Either way, the output differs from the truth by a **quantization error** $q$, within half a step of zero. When the signal crosses many steps between samples, $q$ is spread evenly over that range, with variance $\Delta^2/12$ for step size $\Delta$ ("delta").

::: example What sixteen bits cost
A MEMS gyro turns $\pm 250^\circ/\mathrm{s}$ into sixteen bits, or $2^{16} = 65\,536$ steps. One LSB is $500/65\,536 = 0.00763^\circ/\mathrm{s}$. At $100$ samples a second, each sample's angle step is $0.00763/100 = 7.6 \times 10^{-5}\,{}^\circ$, about $0.27$ arcseconds.

If rounding errors in successive samples are independent, they are white noise with standard deviation $0.00763/\sqrt{12} = 0.0022^\circ/\mathrm{s}$. Dividing by $\sqrt{100}$ gives a rate noise density of $2.2 \times 10^{-4}\,{}^\circ/\mathrm{s}/\sqrt{\mathrm{Hz}}$. Multiply by $60$ to convert, and the angle random walk is $60 \times 2.2 \times 10^{-4} = 0.013^\circ/\sqrt{\mathrm{h}}$.

Compare: that is well under a tactical gyro's $0.1^\circ/\sqrt{\mathrm{h}}$ but well over a navigation-grade gyro's $0.002^\circ/\sqrt{\mathrm{h}}$. Sixteen bits over that range suit the first and would ruin the second.

The same steps for an accelerometer turning $\pm 16\,g$ into sixteen bits: an LSB of $32/65\,536\,g = 0.49\,\mathrm{mg}$, a per-sample standard deviation of $1.4 \times 10^{-3}\,\mathrm{m/s^2}$, a density of $14\,\mathrm{\mu g}/\sqrt{\mathrm{Hz}}$, and a velocity random walk of $0.0083\,\mathrm{m/s}/\sqrt{\mathrm{h}}$.
:::

The "white noise" idea breaks in a useful way. If the rate is nearly constant and moves less than one LSB per sample, the same rounding error repeats sample after sample. Then quantization is a fixed function of the input, not noise.

An integrating sensor is different again. There the total *angle* is what gets rounded, so the angle error never exceeds one pulse, however long the count runs. The apparent rate noise shrinks as $1/\tau$ as you average over a time $\tau$ ("tau"), not as $1/\sqrt{\tau}$. On the **[[Allan deviation|allan-bridge]]** plot of a later lesson, that shows as a slope of $-1$, different from white noise's $-\tfrac{1}{2}$. So two sensors with the same LSB can behave completely differently in the long run, depending on whether rate or angle is being rounded.

::: warning
Applying the corrections in the wrong order is a classic mistake. The model says the truth is first stretched and skewed by $(\mathbf{I} + \mathbf{S} + \mathbf{N})$, then the bias is added. So the correction must go backwards: subtract the bias first, then multiply by the inverse of $(\mathbf{I} + \mathbf{S} + \mathbf{N})$. Doing it the other way leaves an error of about $\mathbf{S}\mathbf{b}$: with $500\,\mathrm{ppm}$ of scale factor and $20^\circ/\mathrm{h}$ of bias that is $0.01^\circ/\mathrm{h}$ — exactly the level a navigation-grade unit lives at.
:::

## Which terms go where

The model sorts its own parameters into three bins.

1. **Calibrate once.** Scale factor, non-orthogonality, misalignment and $g$-sensitivity are steady properties of the hardware. They are measured on a rate table and in a temperature chamber, stored as tables, and applied to every sample before anything is integrated.
2. **Estimate in flight.** Turn-on and in-run bias are not steady, so they become filter states: the six bias states of the **[[fifteen-state|fifteen-state]]** error model a later lesson builds. When the vehicle maneuvers hard enough for leftover scale-factor error to matter, scale factors are added too, turning fifteen states into twenty-one.
3. **Describe statistically.** White noise and quantization enter the filter as process noise, sized from the Allan deviation of the next two lessons.

Nothing in the model is left to hope.

## Check yourself

::: check
A gyro datasheet lists bias repeatability $30^\circ/\mathrm{h}$, in-run bias instability $1^\circ/\mathrm{h}$ and scale factor $300\,\mathrm{ppm}$. Compare the attitude error each gives over $60\,\mathrm{s}$ (a) with the vehicle still and (b) during a $360^\circ$ turn at $6^\circ/\mathrm{s}$, with nothing estimated.
:::

::: answer
**Still.** The scale factor acts only on Earth rate: $300 \times 10^{-6} \times 15^\circ/\mathrm{h} = 0.0045^\circ/\mathrm{h}$, negligible. The turn-on bias gives $30 \times 60/3600 = 0.5^\circ$. The in-run instability gives about $1 \times 60/3600 = 0.017^\circ$.

**Turning.** The biases give the same numbers. But now the scale factor acts on $360^\circ$ of rotation: $300 \times 10^{-6} \times 360 = 0.108^\circ$, six times the in-run bias share.

The turn-on bias dominates both cases, which is why alignment must remove it before a coast. Once it is gone, scale factor is the biggest remaining term during the turn, and in-run bias the biggest at rest.
:::

::: check
Explain why the skew-symmetric part of $\mathbf{N}$ can be folded into the IMU-to-body mounting rotation while the symmetric part cannot, and what each needs for calibration.
:::

::: answer
For small angles, $\mathbf{I} - [\boldsymbol{\epsilon}\times]$ is the rotation matrix for a turn by $\boldsymbol{\epsilon}$. So a skew-symmetric $\mathbf{N}$ turns the whole triad rigidly: the three axes stay square to each other and are only pointed slightly differently. That is identical to bolting a perfect IMU on at a slight angle. Both are fixed by one rotation, measured by boresighting the unit to the vehicle's reference axes.

A symmetric $\mathbf{N}$ changes the angles *between* the axes. That bends the triad's shape instead of turning it, and no rotation can do that. So it must be measured by spinning each axis in turn on a rate table, reading the response of the other two, and inverting the result numerically.
:::

::: check
A level, still accelerometer triad reads $(0.0098,\ 0,\ -9.8067)\,\mathrm{m/s^2}$. Give two explanations for the $x$ reading, and say how one extra measurement tells them apart.
:::

::: answer
The $x$ reading is $1\,\mathrm{mg}$. It could be a $1\,\mathrm{mg}$ bias on the $x$ accelerometer. Or the unit could be pitched nose-up by $1\,\mathrm{mrad}$, so a slice of the upward $1\,g$ reaction shows up along $x$. From one reading they look the same — the bias–tilt equivalence.

Turn the unit $180^\circ$ about the vertical and read again. A bias stays at $+0.0098$. A tilt flips to $-0.0098$, because the $x$ axis now points the other way relative to the slope. Half the sum of the two readings is the bias; half the difference is $g$ times the tilt. This is the idea behind the multi-position calibration test.
:::

::: check
A gyro's bench bias is $2.4^\circ/\mathrm{h}$ with its axis pointing up and $0.4^\circ/\mathrm{h}$ with it pointing down. Separate the true bias from the $g$-sensitivity, and predict the bias during a $3\,g$ boost with the axis along the thrust.
:::

::: answer
Axis up, the sensor feels $+1\,g$ along its axis; axis down, $-1\,g$. So $2.4 = b + G$ and $0.4 = b - G$. Adding the two equations gives $2b = 2.8$, so $b = 1.4^\circ/\mathrm{h}$. Subtracting gives $2G = 2.0$, so $G = 1.0^\circ/\mathrm{h}/g$.

In the boost the specific force along the axis is $3\,g$, so the bias becomes $1.4 + 3 \times 1.0 = 4.4^\circ/\mathrm{h}$, more than three times its bench value. A filter that estimated the bias on the pad and froze it through the burn would be off by $3^\circ/\mathrm{h}$ the whole time.
:::

::: check
Why does rounding an integrating gyro's pulse count not cause an angle random walk, while rounding a sampled rate does?
:::

::: answer
A pulse-output gyro rounds the running total angle. At any moment the count matches the true angle within one pulse, so the angle error stays bounded forever. The apparent rate noise, found by differencing counts, shrinks as $1/\tau$: slope $-1$ on an Allan plot.

A sampled-rate output rounds each rate sample on its own. When the signal crosses many LSBs between samples, those rounding errors are unrelated to each other. They get integrated into angle like any white rate noise, and the angle error grows as $\sqrt{t}$ — a true random walk, slope $-\tfrac{1}{2}$. Same LSB, different quantity rounded, different long-run behavior.
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
| $\operatorname{Var}(q) = \Delta^2/12$ | Quantization: random walk if rate samples are rounded, bounded if angle is rounded |
| $1\,\mathrm{mg} \leftrightarrow 1\,\mathrm{mrad}$ | Accelerometer bias and tilt are indistinguishable from one reading |

The next lesson takes the random terms of this model — the white noise and the wandering bias — adds a third, rate random walk, and gives each its datasheet name and its law of growth.

::: context calibration The rate table
Calibration happens on a **rate table**: a turntable, often with two or three nested axes, that can spin the IMU at precisely known rates and hold it at precisely known angles, usually inside a temperature chamber. Engineers turn the unit through a planned list of positions and rates, record what it says, and solve for the parameters of the measurement model. The results are stored in the IMU's memory and applied to every sample it ever outputs.
:::

::: context ppm Parts per million
One part per million is one millionth: $10^{-6}$. It is to a number what one second is to about eleven and a half days. An error of $500\,\mathrm{ppm}$ is $0.05\%$ — small for a kitchen scale, but a gyro that turns $10\,000$ degrees during a flight would pile up $5^\circ$ of error from it.
:::

::: context gauss-markov A bias on a rubber band
A first-order Gauss–Markov process is a random wander tied to its average by a rubber band. Random kicks push it away; the band pulls it back, harder the farther it strays. Its rule is $\dot b = -b/T + w$: $T$, the **correlation time**, says how quickly the band pulls back, and $w$ is the kicks. The result wanders inside a band of fixed width forever, instead of drifting off.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="65" x2="345" y2="65" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="20" y1="35" x2="345" y2="35" stroke="#8fb8f0" stroke-width="1"/>
  <line x1="20" y1="95" x2="345" y2="95" stroke="#8fb8f0" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="20,65 40,55 60,48 80,58 100,72 120,86 140,80 160,66 180,52 200,42 220,50 240,68 260,82 280,74 300,60 320,54 340,66"/>
  <text x="20" y="20" font-size="12" fill="#1f2a44">bias</text>
  <text x="345" y="120" font-size="12" text-anchor="end" fill="#1f2a44">time</text>
  <text x="30" y="113" font-size="11" fill="#6c7a93">wanders, but stays in a band</text>
</svg>
```
:::

::: context rectification Where the word comes from
To **rectify** means to straighten, or put right. In electronics a rectifier turns alternating current — which swings plus and minus and averages zero — into current that flows one way, with a nonzero average. An asymmetric sensor does the same thing to vibration by accident: a back-and-forth shake that should average to nothing comes out with a one-way average. Rocket IMUs sit in fierce vibration, so these rectified errors matter most exactly there.
:::

::: context boresighting Lining the box up with the vehicle
The word comes from gunnery: looking straight down the bore of a gun barrel to line it up with the sight. For an IMU it means measuring precisely how the sensor box sits relative to the vehicle's own reference axes, often with optical tools or with the vehicle leveled on jacks. The navigator then applies that fixed rotation to every reading.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <g transform="translate(90,120)">
    <line x1="0" y1="0" x2="90" y2="0" stroke="#1f2a44" stroke-width="2"/>
    <line x1="0" y1="0" x2="0" y2="-90" stroke="#1f2a44" stroke-width="2"/>
    <line x1="0" y1="0" x2="89.2" y2="-12.5" stroke="#1d6fd1" stroke-width="2.5"/>
    <line x1="0" y1="0" x2="-12.5" y2="-89.2" stroke="#1d6fd1" stroke-width="2.5"/>
    <text x="45" y="-98" font-size="11" text-anchor="middle" fill="#1d6fd1">misalignment</text>
    <text x="45" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">both turned together</text>
  </g>
  <g transform="translate(240,120)">
    <line x1="0" y1="0" x2="90" y2="0" stroke="#1f2a44" stroke-width="2"/>
    <line x1="0" y1="0" x2="0" y2="-90" stroke="#1f2a44" stroke-width="2"/>
    <line x1="0" y1="0" x2="90" y2="0" stroke="#b4232c" stroke-width="2.5"/>
    <line x1="0" y1="0" x2="15.6" y2="-88.6" stroke="#b4232c" stroke-width="2.5"/>
    <text x="45" y="-98" font-size="11" text-anchor="middle" fill="#b4232c">non-orthogonality</text>
    <text x="45" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">angle between them wrong</text>
  </g>
</svg>
```

Black: the vehicle's axes. Left, both sensor axes turned by the same $8^\circ$ (drawn huge). Right, one axis leans $10^\circ$ in, so they meet at $80^\circ$.
:::

::: context lsb Steps on a staircase
A converter with $n$ bits can only output $2^n$ different values, like a staircase with $2^n$ steps. Sixteen bits give $65\,536$ steps. The **least significant bit** is the last binary digit of the output — flipping it moves you one step. Any true value between two steps gets rounded to the nearer one, so the error is never more than half a step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="340" y2="20" stroke="#8fb8f0" stroke-width="2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="30,120 70,120 70,100 130,100 130,80 190,80 190,60 250,60 250,40 310,40 310,20 340,20"/>
  <text x="200" y="120" font-size="12" fill="#1f2a44">true value (straight line)</text>
  <text x="40" y="40" font-size="12" fill="#1d6fd1">output (steps)</text>
  <text x="258" y="54" font-size="11" fill="#1f2a44">1 LSB</text>
</svg>
```
:::

::: context allan-bridge A plot you will meet soon
Lesson 4 of this module builds the **Allan deviation**: a curve that shows how much a sensor's average output jitters when you average over longer and longer times. Each kind of error leaves its own slope on that curve, like a fingerprint. Quantization of angle, white rate noise, bias instability and rate random walk each have a different slope, so one plot of a long still recording tells you which errors a sensor has and how big they are.
:::

::: context fifteen-state Where the biases go
Lesson 12 builds the Kalman filter at the heart of an INS/GNSS navigator. Its **state** — the list of things it estimates — has fifteen entries: three position errors, three velocity errors, three attitude errors, three accelerometer biases and three gyro biases. Everything else from this lesson either was calibrated before flight or is treated as noise. Adding three gyro and three accelerometer scale factors gives the twenty-one-state version.
:::
