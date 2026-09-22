---
id: l05-first-and-second-order-response
title: First- and second-order response metrics
minutes: 14
covers:
  - "First- and second-order response: rise time, peak time, overshoot and settling time as functions of zeta and omega-n"
---

Specifications are written in the time domain. "Attitude settles within $2^\circ$ in four seconds." "Nozzle overshoot under 10%." "Rate loop rise time below $80\,\mathrm{ms}$." Poles are written in the complex plane. This lesson is the dictionary between the two, and it is the most heavily used piece of arithmetic in classical control: given $\zeta$ and $\omega_n$, produce overshoot, peak time, rise time and settling time; given a specification, produce the region of the plane where the closed-loop poles must land.

Two things make the dictionary worth memorising rather than looking up. The first is that overshoot depends on $\zeta$ **alone** — not on $\omega_n$, not on the DC gain, not on the units. Damping ratio is a shape parameter and natural frequency is a time-scale parameter, and the separation is clean. The second is that the formulas run both ways: a measured step response from a test stand gives you $\zeta$ and $\omega_n$, and hence a transfer function, from two numbers read off a plot.

Module 8 derived the second-order step response. This lesson takes the derivatives that turn it into metrics, gives the first-order case the same treatment, quantifies how badly the standard approximations fail and where, and adds the bandwidth relation that connects all of this to the frequency domain of lesson 9.

## First order

$$
G(s) = \frac{K}{\tau s + 1}, \qquad y_{\text{step}}(t) = K\left(1 - e^{-t/\tau}\right),
$$

with $K$ the DC gain and $\tau$ the **time constant** in seconds, the reciprocal of the pole's distance from the origin. The response has no overshoot, no oscillation and one parameter of shape — there is nothing to tune but speed.

The landmarks come from evaluating the exponential:

| Time | Fraction of final value |
| --- | --- |
| $\tau$ | $1 - e^{-1} = 0.632$ |
| $2\tau$ | $0.865$ |
| $3\tau$ | $0.950$ |
| $4\tau$ | $0.982$ |

So the 5% settling time is $3\tau$, the 2% settling time is $4\tau$, and the 10–90% rise time is $t_r = \tau\ln 9 = 2.197\,\tau$. The initial slope is $K/\tau$, and the tangent drawn at the origin reaches the final value at exactly $t = \tau$ — the fastest way to read a time constant off a plot.

On a vehicle the first-order lag is everywhere: a rate gyro's output filter, a valve, the roll subsidence mode of an aircraft, the pitch-rate response of a damped airframe.

## Second order

::: key
Standard second-order form: $G(s) = \dfrac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}$, with poles at $s = -\zeta\omega_n \pm j\omega_n\sqrt{1 - \zeta^2}$. Unit DC gain, natural frequency $\omega_n$ in $\mathrm{rad/s}$, damping ratio $\zeta$ dimensionless.
:::

For $0 < \zeta < 1$ the poles are the complex pair $-\sigma \pm j\omega_d$ with the **decay rate** $\sigma = \zeta\omega_n$ and the **damped natural frequency** $\omega_d = \omega_n\sqrt{1 - \zeta^2}$. The unit step response is

$$
y(t) = 1 - e^{-\sigma t}\left(\cos\omega_dt + \frac{\zeta}{\sqrt{1 - \zeta^2}}\sin\omega_dt\right) = 1 - \frac{e^{-\sigma t}}{\sqrt{1 - \zeta^2}}\sin\left(\omega_dt + \varphi\right),
$$

where $\varphi = \arccos\zeta$. The second form is the useful one: a sinusoid at $\omega_d$, riding inside the envelope $\pm e^{-\sigma t}/\sqrt{1 - \zeta^2}$, subtracted from one.

### Peak time

Differentiate: $\dot{y} = h(t) = \dfrac{\omega_n}{\sqrt{1 - \zeta^2}}e^{-\sigma t}\sin\omega_dt$, which vanishes when $\omega_dt = \pi, 2\pi, \ldots$ The first maximum is therefore at

$$
t_p = \frac{\pi}{\omega_d} = \frac{\pi}{\omega_n\sqrt{1 - \zeta^2}}.
$$

::: key
Damped natural frequency $\omega_d = \omega_n\sqrt{1 - \zeta^2}$ and peak time $t_p = \pi/\omega_d$ — half a period of the damped oscillation. The ringing you see and measure is at $\omega_d$, not at $\omega_n$.
:::

### Overshoot

Substitute $t_p$ into $y$. With $\omega_dt_p = \pi$, $\sin(\pi + \varphi) = -\sin\varphi = -\sqrt{1 - \zeta^2}$, so

$$
y(t_p) = 1 + \frac{e^{-\sigma\pi/\omega_d}}{\sqrt{1 - \zeta^2}}\sqrt{1 - \zeta^2} = 1 + e^{-\pi\zeta/\sqrt{1 - \zeta^2}}.
$$

::: key
Peak overshoot: $M_p = \exp\left(\dfrac{-\pi\zeta}{\sqrt{1 - \zeta^2}}\right)$, as a fraction of the final value. It depends on $\zeta$ **only**, never on $\omega_n$. $\zeta = 0.5 \to 16.3\%$; $\zeta = 0.707 \to 4.3\%$.
:::

Inverting it, which is what a specification forces you to do:

$$
\zeta = \frac{-\ln M_p}{\sqrt{\pi^2 + \left(\ln M_p\right)^2}}.
$$

The numbers worth carrying in your head:

| $\zeta$ | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.707 | 0.8 | 0.9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $M_p$ | 72.9% | 52.7% | 37.2% | 25.4% | 16.3% | 9.5% | 4.3% | 1.5% | 0.15% |

### Settling time

The response is inside the band $|y - 1| \le \epsilon$ once the envelope is, that is once $e^{-\zeta\omega_nt}/\sqrt{1 - \zeta^2} \le \epsilon$. Dropping the $\sqrt{1 - \zeta^2}$ (it is between 0.7 and 1 for the damping ratios a designer uses) gives $\zeta\omega_nt \ge \ln(1/\epsilon)$, and since $\ln 50 = 3.91$ and $\ln 20 = 3.00$:

::: key
Settling time: $t_s \approx \dfrac{4}{\zeta\omega_n}$ to 2% — four time constants of the envelope — and $t_s \approx \dfrac{3}{\zeta\omega_n}$ to 5%. Note that $\zeta\omega_n$ is the distance of the poles from the imaginary axis, so settling time is set by that distance alone.
:::

### Rise time

For $0$ to $100\%$, $y$ first reaches one when $\sin(\omega_dt + \varphi) = 0$, that is $\omega_dt_r = \pi - \varphi$:

$$
t_r^{0-100} = \frac{\pi - \arccos\zeta}{\omega_d}.
$$

The 10–90% rise time has no closed form. Numerically it runs from $1.10/\omega_n$ at $\zeta = 0.1$ to $2.88/\omega_n$ at $\zeta = 0.9$, passing through $1.64/\omega_n$ at $\zeta = 0.5$ and $2.15/\omega_n$ at $\zeta = 0.707$. The usual quick rule, $t_r \approx 1.8/\omega_n$, is the value near $\zeta \approx 0.58$ and is good to about 15% over $0.4 \le \zeta \le 0.7$.

### Bandwidth

The **bandwidth** $\omega_{bw}$ of a closed loop is the frequency at which $|G(j\omega)|$ has fallen to $1/\sqrt{2}$ (that is $-3\,\mathrm{dB}$) of its DC value — the machinery for computing it is lesson 9, but the number is needed here. For the standard second-order form,

$$
\omega_{bw} = \omega_n\sqrt{1 - 2\zeta^2 + \sqrt{4\zeta^4 - 4\zeta^2 + 2}},
$$

which equals $1.27\,\omega_n$ at $\zeta = 0.5$, exactly $\omega_n$ at $\zeta = 0.707$, and $0.75\,\omega_n$ at $\zeta = 0.9$. Combining with the rise-time numbers above gives the relation that lets you convert a time-domain requirement straight into a frequency-domain one.

::: key
Rise time and bandwidth trade off directly: $t_r\,\omega_{bw} \approx 1.8$ for a well-damped second-order loop. Doubling the rise time you are willing to accept halves the bandwidth you must buy — and bandwidth is what costs you actuator authority, sensor noise and structural-mode trouble.
:::

::: warning
That product is a rule of thumb and the constant depends on your conventions. With $t_r$ the 10–90% rise time and $\omega_{bw}$ the $-3\,\mathrm{dB}$ frequency, the exact product runs from 1.92 at $\zeta = 0.3$ to 2.15 at $\zeta = 0.9$; the value 1.8 comes from pairing the approximation $t_r \approx 1.8/\omega_n$ with $\omega_{bw} \approx \omega_n$. Use it for sizing and sanity-checking, never as a specification, and say which rise time you mean.
:::

### Critically damped and overdamped

At $\zeta = 1$ the poles coincide at $-\omega_n$ and $y(t) = 1 - (1 + \omega_nt)e^{-\omega_nt}$: no overshoot, and the fastest response with none. For $\zeta > 1$ the poles are real at $-\omega_n\left(\zeta \mp \sqrt{\zeta^2 - 1}\right)$; the slower one dominates and the response is a lag. None of $t_p$, $M_p$ or $\omega_d$ exists for $\zeta \ge 1$, and $t_s \approx 4/(\zeta\omega_n)$ becomes meaningless — for $\zeta \gg 1$ the settling time is governed by the slow real pole, $t_s \approx 4\cdot 2\zeta/\omega_n$ , which grows with $\zeta$ rather than shrinking.

## The design region on the s-plane

Each metric is a constraint on where the poles may sit:

- **Settling time $\le t_s$** requires $\zeta\omega_n \ge 4/t_s$: poles to the left of a vertical line.
- **Overshoot $\le M_p$** requires $\zeta \ge \zeta_{\min}$: poles inside a wedge, since $\zeta = \cos\vartheta$ with $\vartheta$ measured from the negative real axis.
- **Rise time $\le t_r$** requires $\omega_n \ge$ roughly $1.8/t_r$: poles outside a circle of that radius.

Overlay the three and you get the region a pole-placement or root-locus design must reach. That picture is the reason a control engineer draws the s-plane before writing any gains down.

::: example From a specification to closed-loop poles
A spacecraft attitude loop must settle to within 2% in $4\,\mathrm{s}$ with no more than 10% overshoot. Invert the overshoot formula first, because it fixes the shape:

$$
\zeta = \frac{-\ln 0.10}{\sqrt{\pi^2 + (\ln 0.10)^2}} = \frac{2.3026}{\sqrt{9.8696 + 5.3019}} = 0.5912.
$$

Then the settling requirement fixes the scale: $\zeta\omega_n \ge 4/4 = 1.0\,\mathrm{s^{-1}}$, so $\omega_n \ge 1/0.5912 = 1.692\,\mathrm{rad/s}$. Taking both at equality, $\omega_d = 1.692\sqrt{1 - 0.5912^2} = 1.364\,\mathrm{rad/s}$ and the target poles are

$$
s = -1.000 \pm 1.364j.
$$

Predictions: $t_p = \pi/1.364 = 2.303\,\mathrm{s}$; $t_r^{0-100} = (\pi - \arccos 0.5912)/1.364 = 1.615\,\mathrm{s}$; bandwidth $\omega_{bw} = 1.962\,\mathrm{rad/s}$.

Integrating the step response confirms the peak: $1.10000$ at $t = 2.3026\,\mathrm{s}$, exactly as the formula says. The 2% settling time comes out at $3.503\,\mathrm{s}$ against the predicted $4.0\,\mathrm{s}$ — the approximation was conservative here, which is the direction you want a margin to go. The 10–90% rise time is $1.084\,\mathrm{s}$, and $t_r\omega_{bw} = 1.084 \times 1.962 = 2.13$, consistent with the caveat above rather than with the round 1.8.

Design consequence: a $1.96\,\mathrm{rad/s}$ bandwidth is fine for a rigid bus, but the flexible spacecraft of lesson 4 has its first mode at $2.12\,\mathrm{rad/s}$ — right on top of it. Either the specification relaxes or the mode gets notched.
:::

::: example Identifying an actuator from one measured step
A thrust-vector actuator is commanded to $1.00^\circ$ on a test stand. The trace overshoots to $1.233^\circ$ and the peak occurs $128\,\mathrm{ms}$ after the command. That is all you need.

Overshoot $M_p = 0.233$, so

$$
\zeta = \frac{-\ln 0.233}{\sqrt{\pi^2 + (\ln 0.233)^2}} = \frac{1.4570}{\sqrt{9.8696 + 2.1229}} = 0.4207.
$$

Peak time gives the damped frequency directly: $\omega_d = \pi/t_p = \pi/0.128 = 24.54\,\mathrm{rad/s}$, so

$$
\omega_n = \frac{\omega_d}{\sqrt{1 - \zeta^2}} = \frac{24.54}{0.9072} = 27.05\,\mathrm{rad/s} = 4.31\,\mathrm{Hz}.
$$

The model is $G(s) = 731.9/(s^2 + 22.76s + 731.9)$, poles at $-11.38 \pm 24.54j$. Predicted 2% settling is $4/(0.4207 \times 27.05) = 351\,\mathrm{ms}$; the exact value from the model is $310\,\mathrm{ms}$.

Two engineering readings follow at once. First, this actuator is under-damped for flight: $\zeta = 0.42$ against a typical requirement of 0.6 to 0.7, so it rings for nearly a third of a second and will put a resonant peak into the loop at $4.3\,\mathrm{Hz}$. Second, an attitude loop crossing over at $1\,\mathrm{rad/s}$ sits a factor of 27 below $\omega_n$ and will barely notice it; a rate loop crossing over at $10\,\mathrm{rad/s}$ sits within a factor of 3 and certainly will. Whether the actuator is good enough is a question about the loop bandwidth, not about the actuator alone.
:::

::: warning
The $4/(\zeta\omega_n)$ settling formula is an envelope estimate, and the true settling time is decided by which individual oscillation peak last leaves the band. That makes the exact value jump around as $\zeta$ changes: in units of $1/\omega_n$, the exact 2% settling time is $11.23$ at $\zeta = 0.3$ (against $13.33$ from the formula, a 19% overestimate), $8.08$ at $\zeta = 0.5$ (against $8.00$, spot on), $5.96$ at $\zeta = 0.707$ (against $5.66$, a 5% underestimate) and $5.26$ at $\zeta = 0.95$ (against $4.21$, a 20% underestimate). The formula is a design tool; verify the number against a simulation before it goes in a requirements document.
:::

## Check yourself

::: check
A rate loop's closed-loop poles are at $-8 \pm 6j\,\mathrm{s^{-1}}$. Give $\omega_n$, $\zeta$, $\omega_d$, the overshoot, the peak time and the 2% settling time.
:::

::: answer
$\omega_n = \sqrt{64 + 36} = 10\,\mathrm{rad/s}$; $\zeta = 8/10 = 0.8$; $\omega_d = 6\,\mathrm{rad/s}$ (read straight off the imaginary part). Overshoot $M_p = \exp(-\pi(0.8)/0.6) = e^{-4.189} = 0.0152$, so 1.5%. Peak time $t_p = \pi/6 = 0.524\,\mathrm{s}$. Settling $t_s \approx 4/8 = 0.5\,\mathrm{s}$ to 2%, $3/8 = 0.375\,\mathrm{s}$ to 5%. A loop this well damped barely overshoots, and the peak arrives after the settling estimate — which is a hint that at high $\zeta$ the metrics stop being independent and the response is nearly a lag.
:::

::: check
Two designs are proposed for the same axis: poles at $-2 \pm 2j$ and poles at $-4 \pm 4j$. What is the same about their step responses and what is different?
:::

::: answer
Both have $\zeta = \cos(45^\circ) = 1/\sqrt{2} = 0.707$, so both overshoot by exactly 4.3% — identical shape. What differs is the time scale: $\omega_n = 2\sqrt{2} = 2.83\,\mathrm{rad/s}$ against $4\sqrt{2} = 5.66\,\mathrm{rad/s}$, so every time in the second design is half of the first. Peak times $\pi/2 = 1.57\,\mathrm{s}$ and $\pi/4 = 0.785\,\mathrm{s}$; 2% settling $4/2 = 2\,\mathrm{s}$ and $4/4 = 1\,\mathrm{s}$; bandwidths $2.83$ and $5.66\,\mathrm{rad/s}$. The second design is the first played at double speed, and it costs double the bandwidth — meaning twice the actuator rate demand for the same command and twice the sensor-noise bandwidth admitted.
:::

::: check
A requirement says "rise time under $100\,\mathrm{ms}$, overshoot under 5%". Where must the closed-loop poles be?
:::

::: answer
Overshoot fixes the wedge: $M_p \le 0.05$ needs $\zeta \ge -\ln0.05/\sqrt{\pi^2 + (\ln 0.05)^2} = 2.996/\sqrt{9.870 + 8.974} = 0.690$, so the poles must lie within $\arccos 0.690 = 46.4^\circ$ of the negative real axis. Rise time fixes the radius: $t_r \approx 1.8/\omega_n \le 0.1\,\mathrm{s}$ needs $\omega_n \ge 18\,\mathrm{rad/s}$, so the poles lie outside a circle of radius 18. Together: a wedge-shaped region beyond $|s| = 18\,\mathrm{rad/s}$ and within $46^\circ$ of the negative real axis. Taking the corner, $\zeta = 0.690$ and $\omega_n = 18$ puts the poles at $-12.4 \pm 13.0j$, with 2% settling of $4/12.4 = 0.32\,\mathrm{s}$ — which the requirement did not ask about but an actuator sizing will.
:::

::: check
The TVC actuator identified above ($\zeta = 0.42$, $\omega_n = 27.05\,\mathrm{rad/s}$) is to be improved by adding damping until $\zeta = 0.7$, with $\omega_n$ unchanged. What happens to the overshoot, peak time and settling time?
:::

::: answer
Overshoot falls from 23.3% to $\exp(-\pi(0.7)/\sqrt{1 - 0.49}) = e^{-3.078} = 4.6\%$. Peak time *rises*, because $\omega_d$ falls from $24.54$ to $27.05\sqrt{0.51} = 19.32\,\mathrm{rad/s}$, so $t_p$ goes from $128\,\mathrm{ms}$ to $\pi/19.32 = 163\,\mathrm{ms}$. Settling time falls sharply, from $4/(0.42 \times 27.05) = 351\,\mathrm{ms}$ to $4/(0.7 \times 27.05) = 211\,\mathrm{ms}$, because the poles moved left from $-11.38$ to $-18.9$. The pattern is general: more damping at fixed $\omega_n$ means less overshoot and faster settling but a slower-arriving peak and a slower rise.
:::

::: check
Explain why overshoot cannot depend on $\omega_n$, using the standard form rather than the formula.
:::

::: answer
Substitute $s = \omega_n\hat{s}$ into $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_ns + \omega_n^2)$: it becomes $1/(\hat{s}^2 + 2\zeta\hat{s} + 1)$, which contains $\zeta$ and nothing else. Scaling $s$ by $\omega_n$ is scaling time by $1/\omega_n$, so two systems with the same $\zeta$ and different $\omega_n$ have step responses that are the same function of $\omega_nt$. Any dimensionless feature — overshoot, the number of visible oscillations, the ratio of successive peaks — is therefore the same for both, while every quantity with units of time scales as $1/\omega_n$. That is the whole content of the $\zeta$-and-$\omega_n$ parameterisation, and it is why specifications quote overshoot and settling time separately.
:::

## Summary

| Quantity | Formula |
| --- | --- |
| First-order step | $K(1 - e^{-t/\tau})$; 63.2% at $\tau$, 95% at $3\tau$, 98.2% at $4\tau$ |
| First-order rise time | $t_r = \tau\ln 9 = 2.20\,\tau$ (10–90%) |
| Standard second order | $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_ns + \omega_n^2)$, poles $-\zeta\omega_n \pm j\omega_n\sqrt{1 - \zeta^2}$ |
| Decay rate, damped frequency | $\sigma = \zeta\omega_n$; $\omega_d = \omega_n\sqrt{1 - \zeta^2}$ |
| Peak time | $t_p = \pi/\omega_d$ |
| Overshoot | $M_p = e^{-\pi\zeta/\sqrt{1 - \zeta^2}}$; $\zeta$ only. $0.5 \to 16.3\%$, $0.707 \to 4.3\%$ |
| Inverse | $\zeta = -\ln M_p/\sqrt{\pi^2 + (\ln M_p)^2}$ |
| Settling time | $t_s \approx 4/(\zeta\omega_n)$ (2%), $3/(\zeta\omega_n)$ (5%) |
| Rise time | $t_r^{0-100} = (\pi - \arccos\zeta)/\omega_d$; 10–90% $\approx 1.8/\omega_n$ |
| Bandwidth | $\omega_{bw} = \omega_n\sqrt{1 - 2\zeta^2 + \sqrt{4\zeta^4 - 4\zeta^2 + 2}}$; $= \omega_n$ at $\zeta = 0.707$ |
| Rise-time trade | $t_r\,\omega_{bw} \approx 1.8$ |
| Design region | settling $\to$ vertical line, overshoot $\to$ wedge $\zeta = \cos\vartheta$, rise time $\to$ circle $\omega_n$ |

Real systems have more than two poles. The next lesson explains when you may throw the extra ones away and keep using everything on this page.
