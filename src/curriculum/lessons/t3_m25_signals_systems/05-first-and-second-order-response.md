---
id: l05-first-and-second-order-response
title: First- and second-order response metrics
minutes: 17
covers:
  - "First- and second-order response: rise time, peak time, overshoot and settling time as functions of zeta and omega-n"
---

Step onto an old dial bathroom scale. The needle swings up, shoots a little past your weight, wobbles back and forth, and settles. Four questions describe that motion completely enough for most engineering: How fast did it get there? How far past did it go? When was it furthest past? How long until it stopped wobbling? Those four answers are called the **rise time**, the **overshoot**, the **peak time** and the **settling time**.

Requirements for a vehicle are written in exactly those words. "Attitude settles within $2^\circ$ in four seconds." "Nozzle overshoot under 10%." "Rate loop rise time below $80\,\mathrm{ms}$." But poles live on the complex plane, not on a stopwatch. This lesson is the dictionary between the two. It is the most heavily used piece of arithmetic in classical control: given the damping ratio $\zeta$ ("zeta") and the natural frequency $\omega_n$ ("omega n"), produce the four numbers; given a requirement, produce the region of the plane where the closed-loop poles must land.

Two facts make the dictionary worth memorizing rather than looking up. First, overshoot depends on $\zeta$ **alone** — not on $\omega_n$, not on the DC gain, not on the units. Damping ratio sets the *shape*; natural frequency sets the *time scale*; and the two separate cleanly. Second, the formulas run both ways. A measured step response from a test stand gives you $\zeta$ and $\omega_n$, and so a transfer function, from two numbers read off a plot.

Module 8 derived the second-order step response. This lesson takes the derivatives that turn it into these metrics, gives the first-order case the same treatment, shows how badly the standard shortcuts fail and where, and adds the bandwidth relation that links all of this to the frequency plots of lesson 9.

## First order

Drop a thermometer into a mug of hot cocoa. The reading climbs fast at first, then slower and slower as it closes in on the true temperature. It never overshoots. That is a first-order response:

$$
G(s) = \frac{K}{\tau s + 1}, \qquad y_{\text{step}}(t) = K\left(1 - e^{-t/\tau}\right).
$$

Here $K$ is the DC gain and $\tau$ ("tau") is the **[[time constant|time-constant-tangent]]** in seconds. The pole is at $s = -1/\tau$, so $\tau$ is one over the pole's distance from the origin. The response has no overshoot, no oscillation and only one shape. There is nothing to tune but speed.

The landmarks come from evaluating the exponential:

| Time | Fraction of final value |
| --- | --- |
| $\tau$ | $1 - e^{-1} = 0.632$ |
| $2\tau$ | $0.865$ |
| $3\tau$ | $0.950$ |
| $4\tau$ | $0.982$ |

So:

- The 5% settling time is $3\tau$, and the 2% settling time is $4\tau$.
- The 10–90% rise time is $t_r = \tau\ln 9 = 2.197\,\tau$. (The response hits 10% at $\tau\ln(10/9)$ and 90% at $\tau\ln 10$; subtract, and the difference is $\tau\ln 9$.)
- The starting slope is $K/\tau$. A straight line drawn along that starting slope reaches the final value at exactly $t = \tau$. That is the fastest way to read a time constant off a plot.

On a vehicle the first-order lag is everywhere: a rate gyro's output filter, a valve, the **[[roll subsidence|roll-subsidence]]** mode of an aircraft, the pitch-rate response of a well-damped airframe.

## Second order

Now the bathroom scale. It has a spring (which stores energy and wants to swing) and some friction (which bleeds energy away). That pairing gives the standard second-order system.

::: key
Standard second-order form: $G(s) = \dfrac{\omega_n^2}{s^2 + 2\zeta\omega_n s + \omega_n^2}$, with poles at $s = -\zeta\omega_n \pm j\omega_n\sqrt{1 - \zeta^2}$. Unit DC gain, natural frequency $\omega_n$ in $\mathrm{rad/s}$, **[[damping ratio|damping-ratio-name]]** $\zeta$ dimensionless.
:::

For $0 < \zeta < 1$ (the **underdamped** case, which wobbles) the poles are the complex pair $-\sigma \pm j\omega_d$. Two new names:

- the **decay rate** $\sigma = \zeta\omega_n$ ("sigma"): how fast the wobble dies;
- the **damped natural frequency** $\omega_d = \omega_n\sqrt{1 - \zeta^2}$ ("omega d"): how fast it wobbles.

The unit step response is

$$
y(t) = 1 - e^{-\sigma t}\left(\cos\omega_dt + \frac{\zeta}{\sqrt{1 - \zeta^2}}\sin\omega_dt\right) = 1 - \frac{e^{-\sigma t}}{\sqrt{1 - \zeta^2}}\sin\left(\omega_dt + \varphi\right),
$$

where $\varphi = \arccos\zeta$ ("phi"). The second form is the useful one. Read it as: a sine wave at $\omega_d$, squeezed inside the shrinking **[[envelope|envelope-picture]]** $\pm e^{-\sigma t}/\sqrt{1 - \zeta^2}$, subtracted from one.

### Peak time

The peak is where the response stops rising, so where its slope is zero. Differentiate:

$$
\dot{y} = h(t) = \frac{\omega_n}{\sqrt{1 - \zeta^2}}e^{-\sigma t}\sin\omega_dt.
$$

(The slope of the step response is the impulse response $h$, as lesson 2 showed.) The exponential is never zero, so the slope is zero only when $\sin\omega_dt = 0$, that is when $\omega_dt = \pi, 2\pi, \ldots$ The first maximum is at

$$
t_p = \frac{\pi}{\omega_d} = \frac{\pi}{\omega_n\sqrt{1 - \zeta^2}}.
$$

::: key
Damped natural frequency $\omega_d = \omega_n\sqrt{1 - \zeta^2}$ and peak time $t_p = \pi/\omega_d$ — half a period of the damped oscillation. The ringing you see and measure is at $\omega_d$, not at $\omega_n$.
:::

### Overshoot

Put $t_p$ back into $y$. At the peak, $\omega_dt_p = \pi$, and $\sin(\pi + \varphi) = -\sin\varphi = -\sqrt{1 - \zeta^2}$ (because $\cos\varphi = \zeta$). Also $\sigma t_p = \zeta\omega_n\pi/\omega_d = \pi\zeta/\sqrt{1 - \zeta^2}$. So

$$
y(t_p) = 1 + \frac{e^{-\sigma\pi/\omega_d}}{\sqrt{1 - \zeta^2}}\sqrt{1 - \zeta^2} = 1 + e^{-\pi\zeta/\sqrt{1 - \zeta^2}}.
$$

The two square roots cancel, and what is left over the final value of 1 is the overshoot.

::: key
Peak overshoot: $M_p = \exp\left(\dfrac{-\pi\zeta}{\sqrt{1 - \zeta^2}}\right)$, as a fraction of the final value. It depends on $\zeta$ **only**, never on $\omega_n$. $\zeta = 0.5 \to 16.3\%$; $\zeta = 0.707 \to 4.3\%$.
:::

A requirement usually gives you the overshoot and asks for $\zeta$. Take the natural log of both sides, $\ln M_p = -\pi\zeta/\sqrt{1 - \zeta^2}$, square, and solve for $\zeta$:

$$
\zeta = \frac{-\ln M_p}{\sqrt{\pi^2 + \left(\ln M_p\right)^2}}.
$$

The numbers worth carrying in your head:

| $\zeta$ | 0.1 | 0.2 | 0.3 | 0.4 | 0.5 | 0.6 | 0.707 | 0.8 | 0.9 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| $M_p$ | 72.9% | 52.7% | 37.2% | 25.4% | 16.3% | 9.5% | 4.3% | 1.5% | 0.15% |

The value $\zeta = 0.707$, which is $1/\sqrt{2}$, turns up so often it has earned a **[[nickname|flat-response]]**.

### Settling time

The response is inside the band $|y - 1| \le \epsilon$ ("epsilon", the allowed error, like $0.02$) for good once the envelope is inside it. That happens when

$$
\frac{e^{-\zeta\omega_nt}}{\sqrt{1 - \zeta^2}} \le \epsilon.
$$

Drop the $\sqrt{1 - \zeta^2}$ — it sits between 0.7 and 1 for $\zeta$ up to 0.707, the range a designer mostly uses. Taking logs gives $\zeta\omega_nt \ge \ln(1/\epsilon)$. For 2%, $\ln 50 = 3.91$; for 5%, $\ln 20 = 3.00$. Round the first up to 4:

::: key
Settling time: $t_s \approx \dfrac{4}{\zeta\omega_n}$ to 2% — four time constants of the envelope — and $t_s \approx \dfrac{3}{\zeta\omega_n}$ to 5%. Note that $\zeta\omega_n$ is the distance of the poles from the imaginary axis, so settling time is set by that distance alone.
:::

### Rise time

The 0 to 100% rise time is when $y$ first reaches one. That needs $\sin(\omega_dt + \varphi) = 0$, so $\omega_dt_r = \pi - \varphi$:

$$
t_r^{0-100} = \frac{\pi - \arccos\zeta}{\omega_d}.
$$

The 10–90% rise time has no closed form. Computed numerically, it runs from $1.10/\omega_n$ at $\zeta = 0.1$ to $2.88/\omega_n$ at $\zeta = 0.9$, passing through $1.64/\omega_n$ at $\zeta = 0.5$ and $2.15/\omega_n$ at $\zeta = 0.707$. The usual quick rule, $t_r \approx 1.8/\omega_n$, is the exact value near $\zeta \approx 0.58$. Over $0.4 \le \zeta \le 0.7$ it is off by up to about 25% — too long at the low end, too short at the high end.

### Bandwidth

The **bandwidth** $\omega_{bw}$ of a closed loop is the frequency at which $|G(j\omega)|$ has fallen to $1/\sqrt{2}$ of its DC value — that is, $-3\,\mathrm{dB}$ (**[[minus three decibels|half-power]]**). Loosely, it is the fastest wiggle the loop can still follow. Lesson 9 builds the machinery; the number is needed now. For the standard second-order form,

$$
\omega_{bw} = \omega_n\sqrt{1 - 2\zeta^2 + \sqrt{4\zeta^4 - 4\zeta^2 + 2}}.
$$

That equals $1.27\,\omega_n$ at $\zeta = 0.5$, exactly $\omega_n$ at $\zeta = 0.707$, and $0.75\,\omega_n$ at $\zeta = 0.9$. Combine it with the rise-time numbers above, and you get a rule that turns a time requirement straight into a frequency one.

::: key
Rise time and bandwidth trade off directly: $t_r\,\omega_{bw} \approx 1.8$ for a well-damped second-order loop. Doubling the rise time you are willing to accept halves the bandwidth you must buy — and bandwidth is what costs you actuator authority, sensor noise and structural-mode trouble.
:::

::: warning
That product is a rule of thumb, and the constant depends on your conventions. With $t_r$ the 10–90% rise time and $\omega_{bw}$ the $-3\,\mathrm{dB}$ frequency, the exact product runs from 1.92 at $\zeta = 0.3$ to 2.15 at $\zeta = 0.9$. The value 1.8 comes from pairing the shortcut $t_r \approx 1.8/\omega_n$ with $\omega_{bw} \approx \omega_n$. Use it for sizing and sanity checks, never as a specification, and always say which rise time you mean.
:::

### Critically damped and overdamped

At $\zeta = 1$ (**critically damped**) the two poles meet at $-\omega_n$, and

$$
y(t) = 1 - (1 + \omega_nt)e^{-\omega_nt}.
$$

No overshoot, and the fastest response that has none.

For $\zeta > 1$ (**overdamped**) the poles are real, at $-\omega_n\left(\zeta \mp \sqrt{\zeta^2 - 1}\right)$. The slower one dominates and the response is a sluggish lag, like a door closer. None of $t_p$, $M_p$ or $\omega_d$ exists for $\zeta \ge 1$, and $t_s \approx 4/(\zeta\omega_n)$ becomes meaningless. For $\zeta \gg 1$ the slow pole sits near $-\omega_n/(2\zeta)$, so the settling time is about $t_s \approx 4\cdot 2\zeta/\omega_n$. It *grows* with $\zeta$ rather than shrinking — too much damping is slow.

::: note Why overshoot cannot care about $\omega_n$
Replace $s$ by $\omega_n\hat{s}$ in the standard form (read $\hat{s}$ as "s hat"). The $\omega_n^2$ cancels everywhere and you are left with $1/(\hat{s}^2 + 2\zeta\hat{s} + 1)$, which contains only $\zeta$. Scaling $s$ by $\omega_n$ is the same as scaling time by $1/\omega_n$ — playing the same movie faster or slower. So every system with the same $\zeta$ has the same step response as a function of $\omega_nt$. Anything without units (overshoot, how many wobbles you see) is identical; anything measured in seconds scales as $1/\omega_n$. The last check question asks you to say this in your own words.
:::

## The design region on the s-plane

Each metric is a fence on where the poles may sit:

- **Settling time $\le t_s$** needs $\zeta\omega_n \ge 4/t_s$: the poles must be to the left of a vertical line.
- **Overshoot $\le M_p$** needs $\zeta \ge \zeta_{\min}$: the poles must sit inside a wedge, since $\zeta = \cos\vartheta$ with $\vartheta$ measured from the negative real axis.
- **Rise time $\le t_r$** needs $\omega_n \ge$ roughly $1.8/t_r$: the poles must be outside a circle of that radius.

Overlay the three fences and you get the **[[design region|design-region]]** that a pole-placement or root-locus design must reach. That picture is why a control engineer draws the s-plane before writing any gains down.

::: example From a specification to closed-loop poles
A spacecraft attitude loop must settle to within 2% in $4\,\mathrm{s}$, with no more than 10% overshoot. Invert the overshoot formula first, because it fixes the shape:

$$
\zeta = \frac{-\ln 0.10}{\sqrt{\pi^2 + (\ln 0.10)^2}} = \frac{2.3026}{\sqrt{9.8696 + 5.3019}} = 0.5912.
$$

Then the settling requirement fixes the scale: $\zeta\omega_n \ge 4/4 = 1.0\,\mathrm{s^{-1}}$, so $\omega_n \ge 1/0.5912 = 1.692\,\mathrm{rad/s}$. Take both at equality. Then $\omega_d = 1.692\sqrt{1 - 0.5912^2} = 1.364\,\mathrm{rad/s}$, and the target poles are

$$
s = -1.000 \pm 1.364j.
$$

Predictions:

- peak time $t_p = \pi/1.364 = 2.303\,\mathrm{s}$;
- 0–100% rise time $t_r^{0-100} = (\pi - \arccos 0.5912)/1.364 = 1.615\,\mathrm{s}$;
- bandwidth $\omega_{bw} = 1.962\,\mathrm{rad/s}$.

Check by integrating the step response numerically. The peak is $1.10000$ at $t = 2.3026\,\mathrm{s}$, exactly as the formula says. The 2% settling time comes out at $3.503\,\mathrm{s}$ against the predicted $4.0\,\mathrm{s}$ — the shortcut was conservative here, which is the direction you want a margin to go. The 10–90% rise time is $1.084\,\mathrm{s}$, and $t_r\omega_{bw} = 1.084 \times 1.962 = 2.13$. That fits the caveat in the warning above, not the round 1.8.

Design consequence: a $1.96\,\mathrm{rad/s}$ bandwidth is fine for a rigid bus. But the flexible spacecraft of lesson 4 has its first mode at $2.12\,\mathrm{rad/s}$ — right on top of it. Either the specification relaxes or the mode gets notched.
:::

::: example Identifying an actuator from one measured step
A thrust-vector actuator on a test stand is commanded to $1.00^\circ$. The trace overshoots to $1.233^\circ$, and the peak comes $128\,\mathrm{ms}$ after the command. That is all you need.

**Damping from overshoot.** $M_p = 0.233$, so

$$
\zeta = \frac{-\ln 0.233}{\sqrt{\pi^2 + (\ln 0.233)^2}} = \frac{1.4570}{\sqrt{9.8696 + 2.1229}} = 0.4207.
$$

**Frequency from peak time.** The peak time gives the damped frequency directly, $\omega_d = \pi/t_p = \pi/0.128 = 24.54\,\mathrm{rad/s}$. Then undo the damping factor:

$$
\omega_n = \frac{\omega_d}{\sqrt{1 - \zeta^2}} = \frac{24.54}{0.9072} = 27.05\,\mathrm{rad/s} = 4.31\,\mathrm{Hz}.
$$

**The model.** $\omega_n^2 = 731.9$ and $2\zeta\omega_n = 22.76$, so $G(s) = 731.9/(s^2 + 22.76s + 731.9)$, with poles at $-11.38 \pm 24.54j$. The predicted 2% settling time is $4/(0.4207 \times 27.05) = 351\,\mathrm{ms}$; the exact value from the model is $310\,\mathrm{ms}$.

Sanity check: $\omega_n$ must be a bit larger than $\omega_d$, and $27.05 > 24.54$. Good.

Two engineering readings follow at once. First, this actuator is under-damped for flight: $\zeta = 0.42$, against a typical requirement of 0.6 to 0.7. It rings for about a third of a second and will put a resonant peak into the loop at $4.3\,\mathrm{Hz}$. Second, an attitude loop crossing over at $1\,\mathrm{rad/s}$ sits a factor of 27 below $\omega_n$ and will barely notice it. A rate loop crossing over at $10\,\mathrm{rad/s}$ sits within a factor of 3 and certainly will. Whether the actuator is good enough is a question about the loop's bandwidth, not about the actuator alone.
:::

::: warning
The $4/(\zeta\omega_n)$ settling formula is an envelope estimate. The true settling time is decided by which individual wobble **[[last leaves the band|settling-jumps]]**, so the exact value jumps around as $\zeta$ changes. In units of $1/\omega_n$, the exact 2% settling time is:

- $11.23$ at $\zeta = 0.3$, against $13.33$ from the formula — a 19% overestimate;
- $8.08$ at $\zeta = 0.5$, against $8.00$ — spot on;
- $5.96$ at $\zeta = 0.707$, against $5.66$ — a 5% underestimate;
- $5.26$ at $\zeta = 0.95$, against $4.21$ — a 20% underestimate.

The formula is a design tool. Check the number against a simulation before it goes into a requirements document.
:::

## Check yourself

::: check
A rate loop's closed-loop poles are at $-8 \pm 6j\,\mathrm{s^{-1}}$. Give $\omega_n$, $\zeta$, $\omega_d$, the overshoot, the peak time and the 2% settling time.
:::

::: answer
Distance from the origin: $\omega_n = \sqrt{64 + 36} = 10\,\mathrm{rad/s}$. Damping: $\zeta = 8/10 = 0.8$. Damped frequency: $\omega_d = 6\,\mathrm{rad/s}$, read straight off the imaginary part.

Overshoot: $M_p = \exp(-\pi(0.8)/0.6) = e^{-4.189} = 0.0152$, so 1.5%. Peak time: $t_p = \pi/6 = 0.524\,\mathrm{s}$. Settling: $t_s \approx 4/8 = 0.5\,\mathrm{s}$ to 2%, and $3/8 = 0.375\,\mathrm{s}$ to 5%.

A loop this well damped barely overshoots, and the peak arrives *after* the settling estimate. That is a hint that at high $\zeta$ the metrics stop being independent and the response is nearly a plain lag.
:::

::: check
Two designs are proposed for the same axis: poles at $-2 \pm 2j$, and poles at $-4 \pm 4j$. What is the same about their step responses, and what is different?
:::

::: answer
Both pairs sit at $45^\circ$ from the negative real axis, so both have $\zeta = \cos(45^\circ) = 1/\sqrt{2} = 0.707$. Both overshoot by exactly 4.3%: identical shape.

What differs is the time scale. $\omega_n = 2\sqrt{2} = 2.83\,\mathrm{rad/s}$ against $4\sqrt{2} = 5.66\,\mathrm{rad/s}$, so every time in the second design is half of the first. Peak times: $\pi/2 = 1.57\,\mathrm{s}$ and $\pi/4 = 0.785\,\mathrm{s}$. 2% settling: $4/2 = 2\,\mathrm{s}$ and $4/4 = 1\,\mathrm{s}$. Bandwidths: $2.83$ and $5.66\,\mathrm{rad/s}$.

The second design is the first played at double speed, and it costs double the bandwidth — twice the actuator rate demand for the same command, and twice the sensor-noise bandwidth let in.
:::

::: check
A requirement says "rise time under $100\,\mathrm{ms}$, overshoot under 5%". Where must the closed-loop poles be?
:::

::: answer
Overshoot fixes the wedge. $M_p \le 0.05$ needs $\zeta \ge -\ln0.05/\sqrt{\pi^2 + (\ln 0.05)^2} = 2.996/\sqrt{9.870 + 8.974} = 0.690$. So the poles must lie within $\arccos 0.690 = 46.4^\circ$ of the negative real axis.

Rise time fixes the radius. $t_r \approx 1.8/\omega_n \le 0.1\,\mathrm{s}$ needs $\omega_n \ge 18\,\mathrm{rad/s}$, so the poles lie outside a circle of radius 18.

Together: a wedge-shaped region beyond $|s| = 18\,\mathrm{rad/s}$ and within $46^\circ$ of the negative real axis. Taking the corner, $\zeta = 0.690$ and $\omega_n = 18$ put the poles at $-12.4 \pm 13.0j$. Their 2% settling time is $4/12.4 = 0.32\,\mathrm{s}$ — which the requirement did not ask about, but an actuator sizing will.
:::

::: check
The TVC actuator identified above ($\zeta = 0.42$, $\omega_n = 27.05\,\mathrm{rad/s}$) is to be improved by adding damping until $\zeta = 0.7$, with $\omega_n$ unchanged. What happens to the overshoot, the peak time and the settling time?
:::

::: answer
Overshoot falls from 23.3% to $\exp(-\pi(0.7)/\sqrt{1 - 0.49}) = e^{-3.078} = 4.6\%$.

Peak time *rises*. $\omega_d$ falls from $24.54$ to $27.05\sqrt{0.51} = 19.32\,\mathrm{rad/s}$, so $t_p$ goes from $128\,\mathrm{ms}$ to $\pi/19.32 = 163\,\mathrm{ms}$.

Settling time falls sharply, from $4/(0.42 \times 27.05) = 351\,\mathrm{ms}$ to $4/(0.7 \times 27.05) = 211\,\mathrm{ms}$, because the poles moved left from $-11.38$ to $-18.9$.

The pattern is general. More damping at fixed $\omega_n$ means less overshoot and faster settling, but a later peak and a slower rise.
:::

::: check
Explain why overshoot cannot depend on $\omega_n$, using the standard form rather than the overshoot formula.
:::

::: answer
Substitute $s = \omega_n\hat{s}$ into $G(s) = \omega_n^2/(s^2 + 2\zeta\omega_ns + \omega_n^2)$. It becomes $1/(\hat{s}^2 + 2\zeta\hat{s} + 1)$, which contains $\zeta$ and nothing else.

Scaling $s$ by $\omega_n$ is scaling time by $1/\omega_n$. So two systems with the same $\zeta$ and different $\omega_n$ have step responses that are the same function of $\omega_nt$. Any feature without units — overshoot, the number of visible wobbles, the ratio of one peak to the next — is the same for both. Every quantity measured in seconds scales as $1/\omega_n$.

That is the whole content of describing a system by $\zeta$ and $\omega_n$, and it is why specifications quote overshoot and settling time separately.
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

::: context time-constant-tangent Reading $\tau$ off a plot
The first-order step response $1 - e^{-t/\tau}$, drawn to scale. The dashed line starts along the curve's opening slope and reaches the final value at exactly one time constant — where the curve itself has only made it to 63.2%. By $3\tau$ the curve is at 95%.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="30" x2="340" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="50" y1="170" x2="106" y2="30" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.2" points="50.0,170.0 61.2,144.6 72.4,123.8 83.6,106.8 94.8,92.9 106.0,81.5 117.2,72.2 128.4,64.5 139.6,58.3 150.8,53.1 162.0,48.9 173.2,45.5 184.4,42.7 195.6,40.4 206.8,38.5 218.0,37.0 229.2,35.7 240.4,34.7 251.6,33.8 262.8,33.1 274.0,32.6 285.2,32.1 296.4,31.7 307.6,31.4 318.8,31.2 330.0,30.9"/>
  <line x1="106" y1="170" x2="106" y2="81.5" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="218" y1="170" x2="218" y2="37" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <circle cx="106" cy="81.5" r="3.5" fill="#1d6fd1"/>
  <circle cx="218" cy="37" r="3.5" fill="#1d6fd1"/>
  <text x="106" y="186" font-size="12" text-anchor="middle" fill="#1f2a44">τ</text>
  <text x="218" y="186" font-size="12" text-anchor="middle" fill="#1f2a44">3τ</text>
  <text x="44" y="34" font-size="11" text-anchor="end" fill="#1f2a44">K</text>
  <text x="114" y="96" font-size="11" fill="#1f2a44">63.2%</text>
  <text x="226" y="54" font-size="11" fill="#1f2a44">95%</text>
  <text x="70" y="24" font-size="11" fill="#b4232c">starting slope K/τ</text>
</svg>
```
:::

::: context roll-subsidence An airplane's first-order mode
Roll an airplane with the ailerons, then center them. The roll rate does not keep going and does not wobble: it dies away smoothly, like the thermometer settling, because the wings resist rolling: the wing going down meets the air at a steeper angle, gains lift, and pushes back up. Engineers call this the roll subsidence mode ("subside" means to die down). It is a first-order lag with its own time constant, and it is one of the numbers a flight-dynamics model of any airplane lists.
:::

::: context damping-ratio-name A ratio of what to what?
Write a mass-spring-damper as $m\ddot{x} + c\dot{x} + kx = F$. There is one special amount of damping, $c_{cr} = 2\sqrt{km}$, called **critical damping**: any less and the mass overshoots, any more and it creeps. The damping ratio is the actual damping divided by that critical amount, $\zeta = c/c_{cr}$. So $\zeta = 0.5$ means "half the damping it would take to stop overshoot". Divide the equation by $m$ and you get exactly $s^2 + 2\zeta\omega_n s + \omega_n^2$ with $\omega_n = \sqrt{k/m}$.
:::

::: context envelope-picture The wobble inside its envelope
The step response for $\zeta = 0.3$, drawn to scale in units of $1/\omega_n$. The dashed curves are $1 \pm e^{-\zeta\omega_nt}/\sqrt{1 - \zeta^2}$. The response bounces between them, touching each dashed curve once per swing. The first peak is $1.372$ at $t = 3.29/\omega_n$ — a 37.2% overshoot. Settling depends only on how fast the envelope closes, which is why it depends only on $\zeta\omega_n$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="10" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="100" x2="345" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="1.8" stroke-dasharray="5 3" points="57.2,27.8 64.5,37.9 71.8,46.5 79.0,54.0 86.2,60.4 93.5,65.9 100.8,70.7 108.0,74.7 115.2,78.3 122.5,81.3 129.8,83.9 137.0,86.1 144.2,88.1 151.5,89.7 158.8,91.2 166.0,92.4 173.2,93.5 180.5,94.4 187.8,95.1 195.0,95.8 202.2,96.4 209.5,96.9 216.8,97.3 224.0,97.7 231.2,98.0 238.5,98.3 245.8,98.5 253.0,98.7 260.2,98.9 267.5,99.1 274.8,99.2 282.0,99.3 289.2,99.4 296.5,99.5 303.8,99.6 311.0,99.6 318.2,99.7 325.5,99.7 332.8,99.8 340.0,99.8"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="1.8" stroke-dasharray="5 3" points="57.2,172.2 64.5,162.1 71.8,153.5 79.0,146.0 86.2,139.6 93.5,134.1 100.8,129.3 108.0,125.3 115.2,121.7 122.5,118.7 129.8,116.1 137.0,113.9 144.2,111.9 151.5,110.3 158.8,108.8 166.0,107.6 173.2,106.5 180.5,105.6 187.8,104.9 195.0,104.2 202.2,103.6 209.5,103.1 216.8,102.7 224.0,102.3 231.2,102.0 238.5,101.7 245.8,101.5 253.0,101.3 260.2,101.1 267.5,100.9 274.8,100.8 282.0,100.7 289.2,100.6 296.5,100.5 303.8,100.4 311.0,100.4 318.2,100.3 325.5,100.3 332.8,100.2 340.0,100.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.2" points="50.0,180.0 51.8,179.4 53.6,177.6 55.4,174.8 57.2,171.1 59.1,166.6 60.9,161.4 62.7,155.7 64.5,149.5 66.3,143.0 68.1,136.4 69.9,129.7 71.8,123.0 73.6,116.5 75.4,110.2 77.2,104.1 79.0,98.5 80.8,93.3 82.6,88.6 84.4,84.4 86.2,80.7 88.1,77.6 89.9,75.0 91.7,73.0 93.5,71.6 95.3,70.6 97.1,70.2 98.9,70.3 100.8,70.8 102.6,71.7 104.4,73.0 106.2,74.6 108.0,76.4 109.8,78.5 111.6,80.8 113.4,83.1 115.2,85.6 117.1,88.1 118.9,90.6 120.7,93.0 122.5,95.4 124.3,97.7 126.1,99.8 127.9,101.8 129.8,103.7 131.6,105.3 133.4,106.7 135.2,108.0 137.0,109.0 138.8,109.8 140.6,110.4 142.4,110.8 144.2,111.0 146.1,111.1 147.9,110.9 149.7,110.7 151.5,110.2 153.3,109.7 155.1,109.0 156.9,108.3 158.8,107.5 160.6,106.6 162.4,105.7 164.2,104.8 166.0,103.8 167.8,102.9 169.6,102.0 171.4,101.1 173.2,100.3 175.1,99.6 176.9,98.9 178.7,98.2 180.5,97.7 182.3,97.2 184.1,96.8 185.9,96.4 187.8,96.2 189.6,96.0 191.4,95.9 193.2,95.9 195.0,95.9 196.8,96.0 198.6,96.1 200.4,96.3 202.2,96.6 204.1,96.8 205.9,97.1 207.7,97.4 209.5,97.8 211.3,98.1 213.1,98.5 214.9,98.8 216.8,99.1 218.6,99.5 220.4,99.8 222.2,100.1 224.0,100.3 225.8,100.6 227.6,100.8 229.4,101.0 231.2,101.2 233.1,101.3 234.9,101.4 236.7,101.5 238.5,101.5 240.3,101.5 242.1,101.5 243.9,101.5 245.8,101.5 247.6,101.4 249.4,101.3 251.2,101.2 253.0,101.1 254.8,101.0 256.6,100.9 258.4,100.7 260.2,100.6 262.1,100.5 263.9,100.4 265.7,100.2 267.5,100.1 269.3,100.0 271.1,99.9 272.9,99.8 274.8,99.7 276.6,99.7 278.4,99.6 280.2,99.5 282.0,99.5 283.8,99.5 285.6,99.4 287.4,99.4 289.2,99.4 291.1,99.4 292.9,99.4 294.7,99.5 296.5,99.5 298.3,99.5 300.1,99.6 301.9,99.6 303.8,99.7 305.6,99.7 307.4,99.8 309.2,99.8 311.0,99.8 312.8,99.9 314.6,99.9 316.4,100.0 318.2,100.0 320.1,100.1 321.9,100.1 323.7,100.1 325.5,100.1 327.3,100.2 329.1,100.2 330.9,100.2 332.8,100.2 334.6,100.2 336.4,100.2 338.2,100.2 340.0,100.2"/>
  <text x="44" y="104" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="44" y="184" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="104" y="62" font-size="11" fill="#1f2a44">peak 1.372</text>
  <text x="200" y="40" font-size="11" fill="#b4232c">envelope 1 ± e^(−ζω_n t)/√(1−ζ²)</text>
  <text x="195" y="196" font-size="11" text-anchor="middle" fill="#6c7a93">ω_n t from 0 to 20</text>
</svg>
```
:::

::: context flat-response Why 0.707 is everyone's favorite
At $\zeta = 1/\sqrt{2} = 0.707$, the magnitude $|G(j\omega)|$ stays as close to flat as a second-order system can before it starts to fall — no resonant bump at all, and it passes through $-3\,\mathrm{dB}$ exactly at $\omega_n$. Filter designers call this the **maximally flat** or second-order Butterworth response. For control it is a sweet spot: only 4.3% overshoot, a brisk rise, and no peak in the frequency response to excite anything.
:::

::: context half-power Where "minus three decibels" comes from
A decibel compares two sizes on a log scale: $20\log_{10}$ of an amplitude ratio. An amplitude ratio of $1/\sqrt{2} = 0.707$ gives $20\log_{10}(0.707) = -3.01\,\mathrm{dB}$. Power goes as amplitude squared, so at that point the signal carries half its low-frequency power. That is why the bandwidth is also called the "half-power" frequency.
:::

::: context design-region The allowed region for the first example
The s-plane for "2% settling in $4\,\mathrm{s}$, overshoot at most 10%", drawn to scale. The poles must be left of the line $\operatorname{Re}s = -1$ and inside the wedge $\zeta \ge 0.591$ (within $53.8^\circ$ of the negative real axis). The shaded part meets both. The chosen poles, $-1 \pm 1.364j$, sit on its corners — the slowest design that still passes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="240,18.2 230.4,5 20,5 20,195 230.4,195 240,181.8" fill="#8fb8f0" fill-opacity="0.45"/>
  <line x1="20" y1="100" x2="345" y2="100" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="300" y1="5" x2="300" y2="195" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="240" y1="5" x2="240" y2="195" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 3"/>
  <line x1="300" y1="100" x2="230.4" y2="5" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="300" y1="100" x2="230.4" y2="195" stroke="#b4232c" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="2.2">
    <line x1="234" y1="12.2" x2="246" y2="24.2"/><line x1="246" y1="12.2" x2="234" y2="24.2"/>
    <line x1="234" y1="175.8" x2="246" y2="187.8"/><line x1="246" y1="175.8" x2="234" y2="187.8"/>
  </g>
  <line x1="300" y1="100" x2="300" y2="106" stroke="#1f2a44"/>
  <text x="240" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">−1</text>
  <text x="304" y="116" font-size="11" fill="#1f2a44">0</text>
  <text x="120" y="60" font-size="12" text-anchor="middle" fill="#1f2a44">allowed</text>
  <text x="120" y="76" font-size="11" text-anchor="middle" fill="#1f2a44">settles fast enough,</text>
  <text x="120" y="90" font-size="11" text-anchor="middle" fill="#1f2a44">overshoots little enough</text>
  <text x="252" y="30" font-size="11" fill="#1f2a44">−1 + 1.364j</text>
  <text x="310" y="60" font-size="11" fill="#b4232c">ζ = 0.591</text>
  <text x="310" y="150" font-size="11" fill="#1f2a44">scale: 60 px</text>
  <text x="310" y="164" font-size="11" fill="#1f2a44">per unit</text>
</svg>
```
:::

::: context settling-jumps Why the exact settling time jumps
Settling is the moment the response enters the $\pm 2\%$ band *for the last time*. If you raise $\zeta$ slightly, one wobble that used to poke barely outside the band may now stay barely inside it. When that happens, the settling time suddenly drops by about half a wobble period, $\pi/\omega_d$. So a plot of exact settling time against $\zeta$ looks like a staircase with jumps, while $4/(\zeta\omega_n)$ is a smooth curve through it. That is one of the two places the module's second-order exercise asks you to explain; the other is $\zeta$ near 1, where there are no wobbles left and the envelope idea stops applying.
:::
