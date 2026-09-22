---
id: l11-gain-phase-and-the-waterbed
title: The gain-phase relationship and the waterbed effect
minutes: 19
covers:
  - 'The Bode gain-phase relationship, the Bode sensitivity integral, and the waterbed effect'
---

Everything so far has been a technique: place a zero here, notch a mode there, trade phase for gain. This lesson is about the rules that no technique escapes. Two of them, both due to Bode, and both consequences of the fact that a transfer function is an analytic function rather than an arbitrary curve.

The first says that for a well-behaved plant you do not get to choose magnitude and phase independently. Pick the magnitude curve and the phase is determined. That is why "roll off faster to get more attenuation" and "keep phase margin at crossover" are the same constraint seen twice, and it is the reason the slope of $|L|$ at crossover is the single most repeated rule of thumb in loop shaping.

The second says that sensitivity is conserved. Push $|S|$ down in one band and it must come up in another, by an amount you can compute before you start designing. An unstable plant makes it worse by a fixed amount that depends only on where its unstable poles are. These are not conservative engineering rules; they are theorems, and a specification that violates one is not difficult, it is impossible.

## The Bode gain-phase relationship

For a **stable, minimum-phase** transfer function — no poles and no zeros in the right half plane — the phase at any frequency is fixed by the magnitude at every frequency. Writing $m = \ln|G|$ and $\nu = \ln(\omega/\omega_0)$,

$$
\angle G(j\omega_0) = \frac{1}{\pi}\int_{-\infty}^{\infty} \frac{dm}{d\nu}\;\ln\coth\frac{|\nu|}{2}\;d\nu .
$$

The integral weights the local magnitude slope $dm/d\nu$ by $\ln\coth(|\nu|/2)$, which has a mild logarithmic singularity at $\nu = 0$ and decays quickly. Its total area is $\pi^2/2$, and integrating numerically, **91.9% of that area lies within one decade of $\omega_0$** and 58% within one octave. The phase is therefore mostly set by the slope nearby and only slightly by what happens far away.

If the slope were constant at $n$ times $20\ \mathrm{dB/decade}$ — so $dm/d\nu = n$ — the integral is $n\pi/2$ radians, giving the rule every control engineer uses:

$$
\angle G \approx 90^\circ \times \frac{\text{slope of }|G|\text{ in dB/decade}}{20}.
$$

A $-20\ \mathrm{dB/decade}$ slope means about $-90^\circ$; $-40\ \mathrm{dB/decade}$ means about $-180^\circ$. The design consequence is immediate: a loop crossing over on a $-40\ \mathrm{dB/decade}$ slope has essentially no phase margin, and a loop crossing over on $-20\ \mathrm{dB/decade}$ has something near $90^\circ$. **Cross over at about $-20\ \mathrm{dB/decade}$, and hold that slope for a decade or so either side**, is the whole of loop shaping compressed into one sentence.

::: example The rule and the integral, on the rate loop
Take $L(s) = 500(s+2)/\bigl(s^2(s+50)\bigr)$, minimum phase with a double pole at the origin. Computing the local slope and the exact phase:

| $\omega$ (rad/s) | 0.1 | 1 | 3 | 10 | 30 | 100 | 1000 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| slope (dB/dec) | −39.9 | −36.0 | −26.2 | −21.5 | −25.4 | −36.0 | −39.9 |
| rule: $4.5\times$slope | −179.8° | −162.0° | −118.0° | −96.9° | −114.2° | −162.0° | −179.8° |
| true phase | −177.3° | −154.6° | −127.1° | −112.6° | −124.8° | −154.6° | −177.3° |

The rule is good to about $15^\circ$ and it is right about everything structural: the slope is shallowest near crossover, the phase is highest near crossover, and the two peak at the same place. At crossover the slope is $-21.5\ \mathrm{dB/decade}$ locally and $-22.9$ averaged over the surrounding decade, and the phase is $-112.6^\circ$ — the slope the phase implies, $-112.6/4.5 = -25.0\ \mathrm{dB/decade}$, sits between them.

Evaluating the full integral numerically at $\omega_0 = 10$ gives $-112.616^\circ$ against a true phase of $-112.620^\circ$; at $\omega_0 = 1$, $-154.575^\circ$ against $-154.581^\circ$. The relationship is exact, not approximate — what is approximate is replacing the weighted integral by the local slope.
:::

::: warning
The relationship holds only for minimum-phase systems. A right-half-plane zero or a transport delay adds phase lag that the magnitude curve does not predict — an all-pass factor has unit magnitude and arbitrary phase. That extra lag is a pure cost: the loop pays it at crossover with nothing in return, which is why a delay $T$ or a right-half-plane zero at $z$ sets a hard ceiling on achievable bandwidth (roughly $\omega_c < 1/T$ and $\omega_c < z/2$). Before quoting the slope rule, check that everything in your loop is minimum phase; on a vehicle, at least the computational delay usually is not.
:::

## The Bode sensitivity integral

The second theorem is about $S = 1/(1+L)$. Consider $\ln S(s)$ on a contour enclosing the right half plane. $S$ is analytic there when the closed loop is stable, its zeros in the right half plane are the open-loop unstable poles of $L$, and $S \to 1$ at infinity if $L$ rolls off. Applying Cauchy's theorem, evaluating the large arc and taking real parts gives an equality between the area under $\ln|S|$ and the unstable pole locations.

For $L$ **strictly proper by two or more** — at least two more poles than zeros — the large arc contributes nothing and

$$
\int_0^\infty \ln\bigl|S(j\omega)\bigr|\,d\omega \;=\; \pi \sum_i \operatorname{Re} p_i,
$$

the sum running over the open-loop unstable poles of $L$. For a stable open loop the right side is zero.

::: key
Bode sensitivity integral (the waterbed). For a stable loop with relative degree $\ge 2$, $\int_0^\infty\ln|S(j\omega)|\,d\omega = 0$. With unstable open-loop poles $p_i$ it becomes $\pi\sum\operatorname{Re}p_i$. Sensitivity reduction is conserved, never created.
:::

Relative degree 1 is a genuine exception and worth knowing, because a PD or lead controller can produce one. If $L$ rolls off at only $-20\ \mathrm{dB/decade}$ at infinity, with $k = \lim_{s\to\infty} sL(s)$, the large arc contributes and the result becomes

$$
\int_0^\infty \ln|S|\,d\omega = \pi\sum_i\operatorname{Re}p_i \;-\; \frac{\pi k}{2},
$$

which can be negative: free sensitivity reduction with no penalty anywhere. The catch is that no physical loop has relative degree 1 at infinity. Put the actuator dynamics back and the relative degree rises, and with it the integral.

::: example Checking the integral on two loops
Compute $\int_0^\infty \ln|S|\,d\omega$ numerically, integrating on a grid from $10^{-8}$ to $10^{9}\ \mathrm{rad/s}$.

**The rate loop**, $L = 500(s+2)/\bigl(s^2(s+50)\bigr)$: one zero, three poles, relative degree 2, and no poles in the open right half plane. The theorem says zero, and the numerical integral returns $-2.2\times10^{-8}$.

**The booster's rigid TVC loop** from the Nyquist lesson, $L = (2.094s + 2.476)/(s^2 - 0.228)$: relative degree 1, with $k = 2.094$, and one unstable pole at $\sqrt{0.228} = 0.4775$. The prediction is $\pi(0.4775) - \tfrac{\pi}{2}(2.094) = 1.5001 - 3.2893 = -1.7892$, and the numerical integral returns $-1.78920$. Negative, because of the relative degree.

Now restore the gimbal actuator the atmospheric flight module used, a second-order lag at $4\ \mathrm{Hz}$ with $\zeta = 0.7$. Relative degree becomes 3, the exception closes, and the integral must equal $\pi\sum\operatorname{Re}p_i = \pi(0.4775) = 1.5001$. The numerical integral returns $1.50009$.

That loop's margins are worth writing down too, because they are the ones a real design report would carry: crossover $2.262\ \mathrm{rad/s}$, phase margin $55.2^\circ$, gain margin $23.9\ \mathrm{dB}$ upward and $20.7\ \mathrm{dB}$ downward, $\lVert S\rVert_\infty = 1.146$ at $4.42\ \mathrm{rad/s}$.
:::

```python
import numpy as np

w = np.logspace(-8, 9, 4000001)
s = 1j * w
wa, za = 2 * np.pi * 4.0, 0.7
mu_a, mu_d, Kp, Kd = 0.228, 1.317, 1.88, 1.59
act = wa**2 / (s**2 + 2 * za * wa * s + wa**2)
loops = {
    "rate loop, P = 0": 500 * (s + 2) / (s**2 * (s + 50)),
    "booster + actuator, P = 1": mu_d * (Kp + Kd * s) / (s**2 - mu_a) * act,
}
for name, L in loops.items():
    print(name, round(np.trapezoid(np.log(abs(1 / (1 + L))), w), 4))
print("pi * sqrt(mu_a) =", round(np.pi * np.sqrt(mu_a), 4))
# rate loop, P = 0 -0.0
# booster + actuator, P = 1 1.5001
# pi * sqrt(mu_a) = 1.5001
```

## The waterbed, quantified

Read the integral as an area on a **linear** frequency axis. Every decibel of suppression you take below $0\ \mathrm{dB}$, multiplied by the bandwidth over which you take it, must reappear as amplification somewhere else. Push the water down here and it rises there.

Two features make the accounting less alarming than it sounds. The axis is linear in $\omega$, so a decade of suppression at low frequency is a tiny area compared with the same decade near crossover. And the amplification can be spread very thin: a loop is allowed $|S|$ slightly above 1 over an enormous high-frequency band.

For the booster-plus-actuator loop, the $1.5001$ of mandated positive area distributes as

| Band (rad/s) | area of $\ln\lvert S\rvert$ |
| --- | --- |
| 0 to 1.88 | $-1.760$ |
| 1.88 to 10 | $+1.024$ |
| 10 to 100 | $+2.221$ |
| 100 to 1000 | $+0.015$ |
| total | $+1.500$ |

The peak of $|S|$ is only $1.146$, because the positive area is spread over nearly two decades. That is the whole trick, and it is also where the bound bites: if something forces $|S| \approx 1$ above some frequency $\omega_2$ — a sample rate, a sensor bandwidth, a structural mode you must gain-stabilise — the area has nowhere to go but up.

Make that quantitative. Suppose $|S| \le \alpha < 1$ on $[0, \omega_1]$, $|S| \le M_s$ on $[\omega_1, \omega_2]$, and $|S| \approx 1$ above $\omega_2$. The integral gives

$$
-\omega_1\ln\frac{1}{\alpha} + (\omega_2 - \omega_1)\ln M_s \;\ge\; \pi\sum\operatorname{Re}p_i
\quad\Longrightarrow\quad
M_s \;\ge\; \exp\!\left[\frac{\pi\sum\operatorname{Re}p_i + \omega_1\ln(1/\alpha)}{\omega_2 - \omega_1}\right].
$$

::: example What a bandwidth limit costs you
Take a stable plant, no unstable poles, and a hard ceiling at $\omega_2 = 20\ \mathrm{rad/s}$ above which $|S|$ must be about 1. Ask for $40\ \mathrm{dB}$ of disturbance rejection, $\alpha = 0.01$, out to $\omega_1$:

| $\omega_1$ | minimum $M_s$ |
| --- | --- |
| 1 rad/s | 1.274 (2.1 dB) |
| 2 rad/s | 1.668 (4.4 dB) |
| 5 rad/s | 4.642 (13.3 dB) |

Demanding $40\ \mathrm{dB}$ of rejection out to a quarter of the ceiling frequency forces a sensitivity peak of 4.6, a modulus margin of $0.22$, and a loop nobody would fly. No controller of any order can do better, so the conversation with whoever wrote the requirement is about the requirement.

Now add instability. For the booster, $\pi\sum\operatorname{Re}p_i = 1.500$, so with $\alpha = 0.1$ out to $\omega_1 = 0.5\ \mathrm{rad/s}$ and $|S| \approx 1$ above $\omega_2 = 10\ \mathrm{rad/s}$, the bound gives $M_s \ge 1.322$ ($2.4\ \mathrm{dB}$). Tighten the ceiling to $\omega_2 = 5\ \mathrm{rad/s}$ — a slower actuator, or a bending mode at $5\ \mathrm{rad/s}$ that must be gain-stabilised — and the bound rises to $M_s \ge 1.803$ ($5.1\ \mathrm{dB}$). An unstable vehicle whose bending modes sit close to its unstable pole is fighting arithmetic, not a bad designer.
:::

Right-half-plane zeros do the same thing in a sharper form. When a plant has an unstable pole at $p$ and a right-half-plane zero at $z$, both real, the Poisson version of the same argument gives an unconditional bound:

$$
\lVert S\rVert_\infty \;\ge\; \left|\frac{z+p}{z-p}\right| .
$$

For the booster's pole at $0.4775$, a right-half-plane zero at $5\ \mathrm{rad/s}$ would force $\lVert S\rVert_\infty \ge 1.21$; at $2\ \mathrm{rad/s}$, $\ge 1.63$; at $1\ \mathrm{rad/s}$, $\ge 2.83$; and at $0.6\ \mathrm{rad/s}$, $\ge 8.80$. A right-half-plane zero close to an unstable pole is not a hard design problem, it is an impossible one, and the only fix is to change the hardware — move a sensor, change an actuator, restructure the vehicle.

::: warning
The integral is an area on a linear frequency axis, not on the log axis a Bode plot draws. A dip of $-60\ \mathrm{dB}$ between $0.01$ and $0.1\ \mathrm{rad/s}$ looks enormous on a Bode plot and contributes an area of only $0.09 \times 6.9 = 0.62$; the same dip between $10$ and $100\ \mathrm{rad/s}$ contributes $620$. Reading a waterbed argument off a log-frequency plot will mislead you about which band is expensive.
:::

## Check yourself

::: check
A loop's magnitude crosses $0\ \mathrm{dB}$ on a slope of $-30\ \mathrm{dB/decade}$, held over about a decade either side. Estimate the phase margin, and say what you would do if the specification asks for $60^\circ$.
:::

::: answer
The rule gives $\angle L \approx 90^\circ \times(-30/20) = -135^\circ$, so the phase margin is about $45^\circ$. To reach $60^\circ$ the slope at crossover has to be shallower, about $-20\times(180-60)/90 = -26.7\ \mathrm{dB/decade}$ — and shallower over a band around crossover, not at one point, because the relationship is an integral. In practice that means adding a lead network or a derivative term whose $+20\ \mathrm{dB/decade}$ region straddles crossover, which is exactly what the lead design procedure does. Lowering the gain alone would move crossover to a frequency where the slope may be steeper still, so it is not a reliable fix.
:::

::: check
Explain why a loop with two integrators cannot cross over on a $-40\ \mathrm{dB/decade}$ slope, and what the PI controller's zero is doing about it.
:::

::: answer
A slope of $-40\ \mathrm{dB/decade}$ implies a phase of about $-180^\circ$ by the gain-phase relationship, so the phase margin would be about zero: the loop is on the edge of instability at crossover. Two integrators give exactly that slope, which is why a pure double-integrator loop under proportional control is always unstable — the Nyquist lesson showed the same fact as two clockwise encirclements. The PI controller's zero at $-k_i/k_p$ contributes $+20\ \mathrm{dB/decade}$ above that frequency, so placing the zero well below crossover makes the slope there about $-20\ \mathrm{dB/decade}$ and recovers phase. In the rate loop the zero is at $2\ \mathrm{rad/s}$ and crossover is at $10$, giving a local slope of $-21.5\ \mathrm{dB/decade}$ and $67^\circ$ of phase margin.
:::

::: check
A stable plant is required to have $|S| \le 0.05$ below $2\ \mathrm{rad/s}$, and a bending mode at $25\ \mathrm{rad/s}$ forces $|S| \approx 1$ above it. What sensitivity peak is unavoidable, and is a $\lVert S\rVert_\infty \le 2$ requirement achievable?
:::

::: answer
Apply the bound with $\alpha = 0.05$, $\omega_1 = 2$, $\omega_2 = 25$ and no unstable poles: $M_s \ge \exp\bigl[2\ln(20)/23\bigr] = \exp(0.2605) = 1.297$, that is $2.3\ \mathrm{dB}$. So a peak of at least 1.30 is unavoidable, and the $\lVert S\rVert_\infty \le 2$ requirement is comfortably achievable — the arithmetic leaves room. Had the rejection requirement been $|S| \le 0.05$ out to $10\ \mathrm{rad/s}$ instead, the bound would be $\exp\bigl[10\ln 20/15\bigr] = \exp(1.997) = 7.4$, and the same $\lVert S\rVert_\infty \le 2$ requirement would be impossible for any controller.
:::

::: check
Why does an open-loop-unstable plant have a guaranteed sensitivity peak, and what does the size of the unstable pole change?
:::

::: answer
The integral is $\pi\sum\operatorname{Re}p_i$, a strictly positive number when the plant has unstable poles, so the area where $|S| > 1$ must exceed the area where $|S| < 1$ by that amount. A loop can spread the excess thinly, but it cannot avoid it, and any constraint that bounds the band over which $|S|$ may exceed 1 immediately forces the peak up. Doubling the unstable pole's real part doubles the mandated area, so the peak grows accordingly for a fixed available band: a vehicle with a $0.5\ \mathrm{s}$ time-to-double is not twice as hard as one with $1\ \mathrm{s}$, it is harder than that, because the band over which the excess can be spread is itself bounded by the actuator and the structure.
:::

::: check
A colleague proposes meeting a disturbance-rejection specification by cascading several notch filters at the disturbance frequencies rather than raising the loop gain. What does the sensitivity integral say about this?
:::

::: answer
A notch in the *controller* reduces $|L|$ at that frequency, which makes $|S|$ larger there, not smaller — it is the wrong sign for disturbance rejection. What the colleague probably means is an inverse notch: extra loop gain at the disturbance frequency, which does reduce $|S|$ there, and is the principle behind resonant and repetitive controllers. The integral then applies in full: the narrow deep dip in $|S|$ has a small area on the linear axis, so the penalty is correspondingly small, which is why such controllers work well for a few known narrow-band disturbances. The trap is that the penalty appears immediately next to the dip, as a pair of sharp peaks in $|S|$ flanking the notch frequency. If the disturbance frequency is uncertain, or drifts, the loop can find itself amplifying at exactly the frequency it was built to reject.
:::

## Summary

| Statement | Content |
| --- | --- |
| Gain-phase relationship | $\angle G(j\omega_0) = \frac{1}{\pi}\int \frac{dm}{d\nu}\ln\coth\frac{\lvert\nu\rvert}{2}\,d\nu$ for minimum-phase $G$ |
| Weight | total area $\pi^2/2$; 91.9% within a decade, 58% within an octave of $\omega_0$ |
| Rule of thumb | $\angle G \approx 90^\circ\times(\text{slope in dB/dec})/20$; cross over near $-20\ \mathrm{dB/dec}$ |
| Non-minimum phase | RHP zeros and delays add phase not implied by the magnitude; $\omega_c \lesssim 1/T$, $\omega_c \lesssim z/2$ |
| Bode sensitivity integral | $\int_0^\infty\ln\lvert S\rvert\,d\omega = \pi\sum\operatorname{Re}p_i$ for relative degree $\ge 2$ |
| Relative degree 1 | subtract $\pi k/2$ with $k = \lim_{s\to\infty}sL(s)$; the exception closes once actuator dynamics are included |
| Waterbed bound | $M_s \ge \exp\bigl[\bigl(\pi\sum\operatorname{Re}p_i + \omega_1\ln(1/\alpha)\bigr)/(\omega_2-\omega_1)\bigr]$ |
| Worked numbers | $\alpha = 0.01$, $\omega_2 = 20$: $M_s \ge 1.27$ at $\omega_1 = 1$, $\ge 4.64$ at $\omega_1 = 5$ |
| RHP pole and zero | $\lVert S\rVert_\infty \ge \lvert(z+p)/(z-p)\rvert$; hopeless when $z$ approaches $p$ |
| Verified examples | rate loop integral $= 0$; booster with actuator $= \pi\sqrt{\mu_\alpha} = 1.500$ |
| Linear axis | areas are on a linear $\omega$ axis, so high-frequency bands dominate |

The rest of the module returns to architecture. The next lesson is about the arrangement that buys back some of what these theorems take away: not one loop, but two, at different speeds.
