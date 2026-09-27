---
id: l11-gain-phase-and-the-waterbed
title: The gain-phase relationship and the waterbed effect
minutes: 21
covers:
  - 'The Bode gain-phase relationship, the Bode sensitivity integral, and the waterbed effect'
---

Everything so far has been a technique: place a zero here, notch a mode there, trade phase for gain. This lesson is about the rules that no technique escapes. There are two of them. Both are due to **[[Hendrik Bode|bode-history]]**, and both come from one fact: a transfer function is not an arbitrary curve you can draw however you like. It is an **[[analytic function|analytic]]** — a function of a complex number so smooth that its values in one place pin down its values everywhere else.

The first rule says that, for a well-behaved plant, you do not get to choose magnitude and phase separately. Pick the magnitude curve and the phase is decided for you. That is why "roll off faster to get more attenuation" and "keep phase margin at crossover" are the same constraint seen twice. It is also why the slope of $|L|$ at crossover is the most repeated rule of thumb in loop shaping.

The second rule says that sensitivity is conserved. Push $|S|$ down in one band and it must come up in another, by an amount you can compute before you start designing. An unstable plant makes it worse by a fixed amount that depends only on where its unstable poles are. These are not cautious engineering habits. They are theorems. A specification that breaks one is not difficult — it is impossible.

## The Bode gain-phase relationship

Picture a hill path. If you know the height of the path at every point, you know how steep it is at every point — you do not get to choose the steepness separately. Magnitude and phase are tied together in a similar way, although the tie is less obvious.

Here is the precise statement. Take a transfer function that is **stable** (no poles in the right half plane) and **[[minimum-phase|minimum-phase]]** (no zeros in the right half plane either). Then its phase at any frequency is fixed by its magnitude at every frequency.

To write it down, measure things on log scales. Let $m = \ln|G|$ (read "the natural log of the size of $G$") and $\nu = \ln(\omega/\omega_0)$ (read "nu"), which says how many "log-steps" frequency $\omega$ is away from the frequency $\omega_0$ we care about. Then

$$
\angle G(j\omega_0) = \frac{1}{\pi}\int_{-\infty}^{\infty} \frac{dm}{d\nu}\;\ln\coth\frac{|\nu|}{2}\;d\nu .
$$

In words: take the **slope** of the log-magnitude curve, $dm/d\nu$, at every frequency. Weight it by the function $\ln\coth(|\nu|/2)$. Add it all up. The result, divided by $\pi$, is the phase at $\omega_0$ in radians.

The weight is the key. It has a sharp but finite-area spike at $\nu = 0$ — right at $\omega_0$ — and dies away fast on both sides. Its total area is $\pi^2/2$. Computing its area numerically, **[[91.9% of it lies within one decade|weight-picture]] of $\omega_0$** and 58% within one octave. So the phase at a frequency is mostly set by the slope nearby, and only a little by what happens far away.

### The slope rule

Suppose the slope were the same everywhere: $n$ times $20\ \mathrm{dB/decade}$. On the natural-log scales that means $dm/d\nu = n$ exactly. Pull $n$ out of the integral and use the area $\pi^2/2$:

$$
\angle G = \frac{1}{\pi}\cdot n \cdot \frac{\pi^2}{2} = n\,\frac{\pi}{2}\ \text{radians} = n \times 90^\circ .
$$

That gives the rule every control engineer uses:

$$
\angle G \approx 90^\circ \times \frac{\text{slope of }|G|\text{ in dB/decade}}{20}.
$$

A $-20\ \mathrm{dB/decade}$ slope means about $-90^\circ$. A $-40\ \mathrm{dB/decade}$ slope means about $-180^\circ$.

The design lesson follows at once. A loop that crosses over on a $-40\ \mathrm{dB/decade}$ slope has almost no phase margin. A loop that crosses over on $-20\ \mathrm{dB/decade}$ has something near $90^\circ$. **Cross over at about $-20\ \mathrm{dB/decade}$, and hold that slope for a decade or so either side.** That sentence is most of loop shaping.

::: example The rule and the integral, on the rate loop
Take $L(s) = 500(s+2)/\bigl(s^2(s+50)\bigr)$. It is minimum phase, with a double pole at the origin. Compute the local slope and the exact phase at several frequencies. The rule's prediction is $90^\circ \times \text{slope}/20 = 4.5 \times \text{slope}$:

| $\omega$ (rad/s) | 0.1 | 1 | 3 | 10 | 30 | 100 | 1000 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| slope (dB/dec) | −40.0 | −36.0 | −26.2 | −21.5 | −25.4 | −36.0 | −40.0 |
| rule: $4.5\times$slope | −179.8° | −162.0° | −118.0° | −96.9° | −114.2° | −162.0° | −179.8° |
| true phase | −177.3° | −154.6° | −127.1° | −112.6° | −124.8° | −154.6° | −177.3° |

(The slopes at $0.1$ and $1000$ are $-39.96$, which rounds to $-40.0$ and gives $-179.8^\circ$.)

The rule is good to about $15^\circ$. More important, it gets the shape right: the slope is shallowest near crossover, the phase is highest near crossover, and both peak at the same place.

At crossover, $10\ \mathrm{rad/s}$, the local slope is $-21.5\ \mathrm{dB/decade}$ and the average over the surrounding decade is $-22.9$. The true phase is $-112.6^\circ$, which "implies" a slope of $-112.6/4.5 = -25.0\ \mathrm{dB/decade}$. That is steeper than both, because the steeper slopes further out still pull a little on the phase.

Sanity check that the full integral is exact: evaluated numerically at $\omega_0 = 10$ it gives $-112.620^\circ$, matching the true phase to three decimals; at $\omega_0 = 1$ it gives $-154.581^\circ$, again a match. The relationship is exact. What is approximate is replacing the weighted integral by the local slope.
:::

::: warning
The relationship holds only for minimum-phase systems. A right-half-plane zero or a transport delay adds phase lag that the magnitude curve does not predict — an **[[all-pass|all-pass]]** factor has magnitude exactly 1 and phase that keeps falling. That extra lag is pure cost: the loop pays it at crossover and gets nothing back. So a delay $T$ or a right-half-plane zero at $z$ puts a hard ceiling on bandwidth, roughly $\omega_c < 1/T$ and $\omega_c < z/2$. Before quoting the slope rule, check that everything in your loop is minimum phase. On a vehicle, the computer's processing delay usually is not.
:::

## The Bode sensitivity integral

The second theorem is about the sensitivity $S = 1/(1+L)$ — the factor by which feedback shrinks disturbances. Where $|S| < 1$, feedback helps. Where $|S| > 1$, feedback makes things worse.

Here is the idea behind the proof, in outline. Look at $\ln S(s)$ around a huge closed path that encloses the whole right half plane. When the closed loop is stable, $S$ has no poles there. Its zeros in the right half plane are exactly the unstable open-loop poles of $L$. And $S \to 1$ far away, if $L$ rolls off. **[[Cauchy's theorem|cauchy]]** says what a loop integral around such a path must equal. Work out the big arc, take real parts, and you get an equation: the area under $\ln|S|$ equals a number fixed by the unstable pole locations.

The exact result depends on the loop's **[[relative degree|relative-degree]]** — how many more poles than zeros it has. For $L$ with relative degree **two or more**, the big arc contributes nothing and

$$
\int_0^\infty \ln\bigl|S(j\omega)\bigr|\,d\omega \;=\; \pi \sum_i \operatorname{Re} p_i .
$$

The sum runs over the open-loop unstable poles $p_i$ of $L$, and $\operatorname{Re} p_i$ ("real part of p sub i") is how far each one sits into the right half plane. For a stable open loop there are none, and the right side is zero.

::: key
Bode sensitivity integral (the waterbed). For a stable loop with relative degree $\ge 2$, $\int_0^\infty\ln|S(j\omega)|\,d\omega = 0$. With unstable open-loop poles $p_i$ it becomes $\pi\sum\operatorname{Re}p_i$. Sensitivity reduction is conserved, never created.
:::

Why a log? Because $\ln|S|$ is negative where $|S| < 1$ and positive where $|S| > 1$. So "the integral is zero" means the negative area (good rejection) and the positive area (amplification) exactly balance.

### The relative-degree-1 exception

Relative degree 1 is a genuine exception, and worth knowing, because a PD or lead controller can produce one. If $L$ rolls off at only $-20\ \mathrm{dB/decade}$ at very high frequency, define $k = \lim_{s\to\infty} sL(s)$ — the number $sL$ settles to as $s$ grows. Then the big arc contributes, and the result becomes

$$
\int_0^\infty \ln|S|\,d\omega = \pi\sum_i\operatorname{Re}p_i \;-\; \frac{\pi k}{2}.
$$

That can be negative: free sensitivity reduction, with no penalty anywhere. The catch is that no physical loop has relative degree 1 all the way to infinity. Put the actuator dynamics back and the relative degree rises, and the free lunch disappears.

::: example Checking the integral on two loops
Compute $\int_0^\infty \ln|S|\,d\omega$ numerically, on a grid from $10^{-8}$ to $10^{9}\ \mathrm{rad/s}$.

**The rate loop**, $L = 500(s+2)/\bigl(s^2(s+50)\bigr)$. One zero and three poles, so relative degree 2. No poles in the open right half plane. The theorem says zero, and the numerical integral returns $-2.2\times10^{-8}$ — zero, up to rounding.

**The booster's rigid TVC loop** from the Nyquist lesson, $L = (2.094s + 2.476)/(s^2 - 0.228)$. Relative degree 1, with $k = 2.094$. One unstable pole at $\sqrt{0.228} = 0.4775$. The prediction is

$$
\pi(0.4775) - \tfrac{\pi}{2}(2.094) = 1.5001 - 3.2893 = -1.7892,
$$

and the numerical integral returns $-1.78920$. It is negative because of the relative degree.

**Now restore the gimbal actuator** that the atmospheric flight module used: a second-order lag at $4\ \mathrm{Hz}$ with $\zeta = 0.7$. Relative degree becomes 3, the exception closes, and the integral must equal $\pi\sum\operatorname{Re}p_i = \pi(0.4775) = 1.5001$. The numerical integral returns $1.50009$.

That loop's margins are worth writing down, because they are what a real design report would carry: crossover $2.262\ \mathrm{rad/s}$, phase margin $55.2^\circ$, gain margin $23.9\ \mathrm{dB}$ upward and $20.7\ \mathrm{dB}$ downward, and $\lVert S\rVert_\infty = 1.146$ at $4.42\ \mathrm{rad/s}$. ($\lVert S\rVert_\infty$, read "the infinity norm of S", is the peak of $|S|$ over all frequencies.)
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

Lie on a waterbed and push down in one spot. The water has to go somewhere, so the bed bulges up somewhere else. That is the picture behind the name **waterbed effect**.

Read the integral as an area on a **linear** frequency axis. Every bit of suppression below $0\ \mathrm{dB}$, multiplied by the width of the band where you take it, must [[reappear as amplification|waterbed-picture]] somewhere else.

Two things make the bill less alarming than it sounds:

- The axis is linear in $\omega$. A decade of suppression at low frequency, say $0.1$ to $1\ \mathrm{rad/s}$, is only $0.9\ \mathrm{rad/s}$ wide — a tiny area next to the same decade near crossover.
- The amplification can be spread very thin. A loop may have $|S|$ only slightly above 1 over an enormous high-frequency band.

For the booster-plus-actuator loop, the required positive area of $1.5001$ is shared out like this:

| Band (rad/s) | area of $\ln\lvert S\rvert$ |
| --- | --- |
| 0 to 1.88 | $-1.760$ |
| 1.88 to 10 | $+1.024$ |
| 10 to 100 | $+2.221$ |
| 100 to 1000 | $+0.015$ |
| total | $+1.500$ |

Add the column: $-1.760 + 1.024 + 2.221 + 0.015 = 1.500$, as the theorem demands. The peak of $|S|$ is only $1.146$, because the positive area is spread over nearly two decades. That is the whole trick.

It is also where the bound bites. Suppose something forces $|S| \approx 1$ above some frequency $\omega_2$ — a [[sample rate|sample-rate]], a sensor's bandwidth, a structural mode you must gain-stabilize. Then the area has nowhere to spread sideways. It can only go up.

### The bound

Make that exact. Suppose

- $|S| \le \alpha < 1$ on $[0, \omega_1]$ — the rejection band, where $\alpha$ ("alpha") is the required rejection;
- $|S| \le M_s$ on $[\omega_1, \omega_2]$ — $M_s$ is the peak we are trying to find;
- $|S| \approx 1$ above $\omega_2$, so that part adds no area.

The rejection band contributes at most $\omega_1\ln\alpha = -\omega_1\ln(1/\alpha)$. The middle band contributes at most $(\omega_2 - \omega_1)\ln M_s$. Their sum must reach the required total:

$$
-\omega_1\ln\frac{1}{\alpha} + (\omega_2 - \omega_1)\ln M_s \;\ge\; \pi\sum\operatorname{Re}p_i
\quad\Longrightarrow\quad
M_s \;\ge\; \exp\!\left[\frac{\pi\sum\operatorname{Re}p_i + \omega_1\ln(1/\alpha)}{\omega_2 - \omega_1}\right].
$$

The second form comes from moving the rejection term to the right, dividing by $(\omega_2 - \omega_1)$, and undoing the log with $\exp$.

::: example What a bandwidth limit costs you
**Stable plant.** No unstable poles, and a hard ceiling at $\omega_2 = 20\ \mathrm{rad/s}$ above which $|S|$ must be about 1. Ask for $40\ \mathrm{dB}$ of disturbance rejection — $\alpha = 0.01$ — out to $\omega_1$. For $\omega_1 = 1$: $M_s \ge \exp[1 \times \ln 100 / 19] = \exp(0.242) = 1.274$. Repeating for other $\omega_1$:

| $\omega_1$ | minimum $M_s$ |
| --- | --- |
| 1 rad/s | 1.274 (2.1 dB) |
| 2 rad/s | 1.668 (4.4 dB) |
| 5 rad/s | 4.642 (13.3 dB) |

Demanding $40\ \mathrm{dB}$ of rejection out to a quarter of the ceiling frequency forces a sensitivity peak of 4.6. That is a modulus margin of $1/4.6 = 0.22$, a loop nobody would fly. No controller of any order can do better. The conversation with whoever wrote the requirement is about the requirement.

**Now add instability.** For the booster, $\pi\sum\operatorname{Re}p_i = 1.500$. With $\alpha = 0.1$ out to $\omega_1 = 0.5\ \mathrm{rad/s}$ and $|S| \approx 1$ above $\omega_2 = 10\ \mathrm{rad/s}$, the bound gives $M_s \ge 1.322$ ($2.4\ \mathrm{dB}$).

Tighten the ceiling to $\omega_2 = 5\ \mathrm{rad/s}$ — a slower actuator, or a bending mode at $5\ \mathrm{rad/s}$ that must be gain-stabilized — and the bound rises to $M_s \ge 1.803$ ($5.1\ \mathrm{dB}$). Sanity check: a narrower band to spread the same area over, so a taller peak, as it should be. An unstable vehicle whose bending modes sit close to its unstable pole is fighting arithmetic, not a bad designer.
:::

### Right-half-plane zeros make it sharper

When a plant has an unstable pole at $p$ and a right-half-plane zero at $z$, both real, a close cousin of the same argument — the **[[Poisson integral|poisson]]** — gives a bound that holds no matter what:

$$
\lVert S\rVert_\infty \;\ge\; \left|\frac{z+p}{z-p}\right| .
$$

When $z$ is far from $p$, the fraction is near 1 and the bound is mild. As $z$ approaches $p$, the bottom goes to zero and the bound blows up. For the booster's pole at $0.4775$:

| RHP zero $z$ (rad/s) | 5 | 2 | 1 | 0.6 |
| --- | --- | --- | --- | --- |
| $\lVert S\rVert_\infty \ge$ | 1.21 | 1.63 | 2.83 | 8.80 |

A right-half-plane zero close to an unstable pole is not a hard design problem. It is an impossible one. The only fix is to change the hardware — move a sensor, change an actuator, restructure the vehicle.

::: warning
The integral is an area on a linear frequency axis, not on the log axis a Bode plot draws. A dip of $-60\ \mathrm{dB}$ ($\ln|S| = -6.9$) between $0.01$ and $0.1\ \mathrm{rad/s}$ looks enormous on a Bode plot, but its area is only $0.09 \times 6.9 = 0.62$. The same dip between $10$ and $100\ \mathrm{rad/s}$ has an area of $90 \times 6.9 = 620$. Reading a waterbed argument off a log-frequency plot will mislead you about which band is expensive.
:::

## Check yourself

::: check
A loop's magnitude crosses $0\ \mathrm{dB}$ on a slope of $-30\ \mathrm{dB/decade}$, held over about a decade either side. Estimate the phase margin, and say what you would do if the specification asks for $60^\circ$.
:::

::: answer
The rule gives $\angle L \approx 90^\circ \times(-30/20) = -135^\circ$, so the phase margin is about $180^\circ - 135^\circ = 45^\circ$.

For $60^\circ$ the phase at crossover must be $-120^\circ$, so the slope must be about $-20\times 120/90 = -26.7\ \mathrm{dB/decade}$. And it must be that shallow over a band around crossover, not at one point, because the relationship is an integral.

In practice that means adding a lead network or a derivative term whose $+20\ \mathrm{dB/decade}$ region straddles crossover — exactly what the lead design procedure does. Lowering the gain alone would move crossover to a frequency where the slope may be steeper still, so it is not a reliable fix.
:::

::: check
Explain why a loop with two integrators cannot cross over on a $-40\ \mathrm{dB/decade}$ slope, and what the PI controller's zero is doing about it.
:::

::: answer
A slope of $-40\ \mathrm{dB/decade}$ implies a phase of about $-180^\circ$ by the gain-phase relationship, so the phase margin would be about zero: the loop sits on the edge of instability at crossover. Two integrators give exactly that slope. That is why a pure double-integrator loop under proportional control is never stable — the Nyquist lesson showed the same fact as two clockwise encirclements.

The PI controller's zero at $-k_i/k_p$ adds $+20\ \mathrm{dB/decade}$ above its frequency. Placing that zero well below crossover makes the slope at crossover about $-20\ \mathrm{dB/decade}$ and brings the phase back. In the rate loop the zero is at $2\ \mathrm{rad/s}$ and crossover is at $10$, giving a local slope of $-21.5\ \mathrm{dB/decade}$ and $67^\circ$ of phase margin.
:::

::: check
A stable plant is required to have $|S| \le 0.05$ below $2\ \mathrm{rad/s}$, and a bending mode at $25\ \mathrm{rad/s}$ forces $|S| \approx 1$ above it. What sensitivity peak is unavoidable, and is a $\lVert S\rVert_\infty \le 2$ requirement achievable?
:::

::: answer
Use the bound with $\alpha = 0.05$ (so $1/\alpha = 20$), $\omega_1 = 2$, $\omega_2 = 25$ and no unstable poles:

$$
M_s \ge \exp\!\left[\frac{2\ln 20}{25 - 2}\right] = \exp(0.2605) = 1.297,
$$

about $2.3\ \mathrm{dB}$. So a peak of at least 1.30 is unavoidable, and $\lVert S\rVert_\infty \le 2$ is comfortably achievable — the arithmetic leaves room.

For contrast: had the rejection been required out to $10\ \mathrm{rad/s}$, the bound would be $\exp\bigl[10\ln 20/15\bigr] = \exp(1.997) = 7.4$, and the same $\lVert S\rVert_\infty \le 2$ requirement would be impossible for any controller.
:::

::: check
Why does an open-loop-unstable plant have a guaranteed sensitivity peak, and what does the size of the unstable pole change?
:::

::: answer
The integral equals $\pi\sum\operatorname{Re}p_i$, which is strictly positive when there are unstable poles. So the area where $|S| > 1$ must beat the area where $|S| < 1$ by that amount. A loop can spread the excess thinly, but it cannot avoid it, and any constraint that limits the band where $|S|$ may exceed 1 immediately forces the peak up.

Doubling the unstable pole's real part doubles the required area, so for a fixed available band the peak grows accordingly. A vehicle whose instability doubles in $0.5\ \mathrm{s}$ is not twice as hard as one that doubles in $1\ \mathrm{s}$ — it is harder than that, because the band over which the excess can be spread is itself capped by the actuator and the structure.
:::

::: check
A colleague proposes meeting a disturbance-rejection specification by cascading several notch filters at the disturbance frequencies rather than raising the loop gain. What does the sensitivity integral say about this?
:::

::: answer
A notch in the *controller* lowers $|L|$ at that frequency, which makes $|S|$ *larger* there, not smaller. It is the wrong direction for disturbance rejection.

What the colleague probably means is an inverse notch: extra loop gain at the disturbance frequency. That does lower $|S|$ there, and it is the principle behind **[[resonant and repetitive controllers|resonant-control]]**. The integral then applies in full. A narrow, deep dip in $|S|$ has a small area on the linear axis, so the penalty is small — which is why such controllers work well for a few known narrow-band disturbances.

The trap is where the penalty lands: right next to the dip, as a pair of sharp peaks in $|S|$ on either side. If the disturbance frequency is uncertain or drifts, the loop can end up amplifying at exactly the frequency it was built to reject.
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

::: context bode-history The engineer behind the plots
Hendrik Bode (1905–1982) worked at Bell Telephone Laboratories, where the problem of the day was the feedback amplifier: long-distance telephone lines needed amplifiers that stayed accurate and stable over thousands of kilometers. Working out what feedback could and could not do there, he found both theorems in this lesson. He collected them in his 1945 book *Network Analysis and Feedback Amplifier Design*. The magnitude-and-phase plot you have used all module carries his name for the same reason.
:::

::: context analytic What "analytic" buys
A function of a complex variable is **analytic** where it has a derivative in the complex sense — the same answer whichever direction you approach from. That is a much stronger demand than for ordinary functions, and it has a striking consequence: the function's values along one line (here, the $j\omega$ axis) are tied to its values everywhere else. Its real and imaginary parts cannot be chosen separately.

$\ln G(j\omega) = \ln|G| + j\angle G$. So "real part fixes imaginary part" becomes "magnitude fixes phase". Every rational transfer function is analytic away from its poles, which is why these theorems apply to every loop you build.
:::

::: context minimum-phase Why "minimum phase"
A zero at $-z$ and a zero at $+z$ are mirror images across the $j\omega$ axis. From any point $s = j\omega$ on that axis, they are exactly the same distance away — so they give exactly the same magnitude. But the arrows point differently, so they give different phase: the right-half-plane zero always adds more lag.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="320" y2="120" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="180" y1="135" x2="180" y2="15" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="120" y1="120" x2="180" y2="75" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="240" y1="120" x2="180" y2="75" stroke="#b4232c" stroke-width="2"/>
  <circle cx="120" cy="120" r="6" fill="#fff" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="240" cy="120" r="6" fill="#fff" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="180" cy="75" r="4" fill="#1f2a44"/>
  <text x="188" y="70" font-size="12" fill="#1f2a44">s = jω</text>
  <text x="120" y="142" font-size="12" text-anchor="middle" fill="#1d6fd1">zero at −z</text>
  <text x="240" y="142" font-size="12" text-anchor="middle" fill="#b4232c">zero at +z</text>
  <text x="186" y="26" font-size="11" fill="#6c7a93">jω axis</text>
  <text x="316" y="112" font-size="11" text-anchor="end" fill="#6c7a93">Re s</text>
</svg>
```

Of all transfer functions with a given magnitude curve, the one with every zero in the left half plane has the *least* phase lag. Hence the name. Any other choice has the same magnitude and more lag.
:::

::: context weight-picture The weighting curve
This is $\ln\coth(|\nu|/2)$ plotted against frequency on a log axis, two decades either side of $\omega_0$. The spike at the center goes up without limit (it is cut off here), but it is so narrow that its area is finite. The shaded part, one decade either side, holds 91.9% of the total area $\pi^2/2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M110,170 L110.0,162.0 L113.0,161.1 L116.0,160.2 L118.9,159.2 L121.9,158.1 L124.7,156.9 L127.5,155.6 L130.3,154.2 L132.9,152.7 L135.6,151.1 L138.2,149.3 L140.6,147.5 L143.1,145.5 L145.3,143.5 L147.6,141.2 L149.7,139.0 L151.8,136.5 L153.8,134.0 L155.5,131.6 L157.2,128.9 L158.8,126.2 L160.4,123.4 L161.8,120.6 L163.2,117.6 L164.4,114.7 L165.7,111.5 L166.7,108.6 L167.8,105.4 L168.6,102.5 L169.5,99.4 L170.4,95.9 L171.1,93.0 L171.8,89.7 L172.5,86.2 L173.2,82.4 L173.7,79.2 L174.2,75.7 L174.8,71.9 L175.3,67.7 L175.6,64.7 L176.0,61.3 L176.3,57.7 L176.7,53.7 L177.0,49.3 L177.4,44.3 L177.7,38.6 L177.9,35.4 L178.1,31.9 L180.5,30.0 L182.1,35.4 L182.3,38.6 L182.6,44.3 L183.0,49.3 L183.3,53.7 L183.7,57.7 L184.0,61.3 L184.4,64.7 L184.7,67.7 L185.2,71.9 L185.8,75.7 L186.3,79.2 L186.8,82.4 L187.5,86.2 L188.2,89.7 L188.9,93.0 L189.6,95.9 L190.5,99.4 L191.4,102.5 L192.2,105.4 L193.3,108.6 L194.3,111.5 L195.6,114.7 L196.8,117.6 L198.2,120.6 L199.6,123.4 L201.2,126.2 L202.7,128.9 L204.5,131.6 L206.2,134.0 L208.2,136.5 L210.3,139.0 L212.4,141.2 L214.6,143.5 L216.9,145.5 L219.4,147.5 L221.8,149.3 L224.4,151.1 L227.1,152.7 L229.7,154.2 L232.5,155.6 L235.3,156.9 L238.1,158.1 L241.1,159.2 L244.1,160.2 L247.0,161.1 L250.0,162.0 L250,170 Z" fill="#8fb8f0" opacity="0.6"/>
  <line x1="40" y1="170" x2="320" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40.0,169.2 L43.1,169.1 L46.3,169.0 L49.5,168.9 L52.6,168.8 L55.8,168.7 L58.9,168.5 L62.0,168.3 L65.2,168.2 L68.3,168.0 L71.5,167.7 L74.7,167.5 L77.8,167.2 L81.0,166.9 L84.1,166.6 L87.2,166.2 L90.2,165.8 L93.2,165.4 L96.2,164.9 L99.1,164.4 L102.1,163.8 L105.1,163.2 L108.1,162.5 L111.0,161.7 L114.0,160.8 L117.0,159.9 L120.0,158.8 L122.8,157.7 L125.6,156.5 L128.4,155.2 L131.2,153.7 L133.8,152.2 L136.4,150.5 L139.1,148.7 L141.5,146.8 L143.9,144.8 L146.2,142.6 L148.5,140.3 L150.6,138.0 L152.5,135.6 L154.4,133.1 L156.2,130.5 L157.9,127.7 L159.5,125.0 L161.1,122.0 L162.5,119.1 L163.7,116.3 L165.0,113.3 L166.2,110.1 L167.2,107.0 L168.3,103.7 L169.1,100.6 L170.0,97.3 L170.9,93.7 L171.6,90.6 L172.3,87.1 L173.0,83.4 L173.5,80.3 L174.1,76.9 L174.6,73.2 L175.1,69.2 L175.6,64.7 L176.0,61.3 L176.3,57.7 L176.7,53.7 L177.0,49.3 L177.4,44.3 L177.7,38.6 L177.9,35.4 L178.1,31.9 L180.5,30.0 L182.1,35.4 L182.3,38.6 L182.6,44.3 L183.0,49.3 L183.3,53.7 L183.7,57.7 L184.0,61.3 L184.4,64.7 L184.7,67.7 L185.2,71.9 L185.8,75.7 L186.3,79.2 L186.8,82.4 L187.5,86.2 L188.2,89.7 L188.9,93.0 L189.6,95.9 L190.5,99.4 L191.4,102.5 L192.2,105.4 L193.3,108.6 L194.3,111.5 L195.6,114.7 L196.8,117.6 L198.2,120.6 L199.6,123.4 L201.2,126.2 L202.7,128.9 L204.5,131.6 L206.2,134.0 L208.2,136.5 L210.3,139.0 L212.4,141.2 L214.6,143.5 L216.9,145.5 L219.4,147.5 L221.8,149.3 L224.4,151.1 L227.1,152.7 L229.7,154.2 L232.5,155.6 L235.3,156.9 L238.1,158.1 L241.1,159.2 L244.1,160.2 L247.0,161.1 L250.0,162.0 L253.0,162.7 L255.9,163.4 L258.9,164.0 L261.9,164.6 L264.9,165.1 L267.9,165.5 L270.8,166.0 L274.0,166.4 L277.1,166.7 L280.3,167.0 L283.4,167.3 L286.6,167.6 L289.7,167.8 L292.9,168.0 L296.0,168.2 L299.2,168.4 L302.3,168.6 L305.5,168.7 L308.6,168.8 L311.8,169.0 L314.9,169.1 L318.1,169.1 L320.0,169.2" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g stroke="#1f2a44" stroke-width="1.5"><line x1="40" y1="170" x2="40" y2="176"/><line x1="110" y1="170" x2="110" y2="176"/><line x1="180" y1="170" x2="180" y2="176"/><line x1="250" y1="170" x2="250" y2="176"/><line x1="320" y1="170" x2="320" y2="176"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="190">ω₀/100</text><text x="110" y="190">ω₀/10</text><text x="180" y="190">ω₀</text><text x="250" y="190">10ω₀</text><text x="320" y="190">100ω₀</text>
  </g>
  <text x="258" y="110" font-size="12" fill="#1d6fd1">92% of the area</text>
  <text x="258" y="126" font-size="12" fill="#1d6fd1">within a decade</text>
</svg>
```

That is the whole reason the slope rule works: the phase "listens" mostly to the slope within a decade.
:::

::: context all-pass Delay: magnitude 1, phase without end
A pure time delay of $T$ seconds has transfer function $e^{-sT}$. At $s = j\omega$ it becomes $e^{-j\omega T}$, a number of size exactly 1 at every frequency — the delay never changes how big a signal is. But its phase is $-\omega T$ radians, which keeps falling forever as frequency rises. A 20 ms delay costs $0.02\omega$ radians: about $11^\circ$ at $10\ \mathrm{rad/s}$ and $115^\circ$ at $100\ \mathrm{rad/s}$. A magnitude plot cannot show it at all.
:::

::: context cauchy Cauchy's theorem, in one picture
Augustin-Louis Cauchy proved in the 1800s that if a function is analytic everywhere inside a closed loop in the complex plane, its integral around that loop is zero. Where the function has poles inside, the integral instead picks up a fixed amount from each.

Bode's proof draws the loop as the whole $j\omega$ axis closed by a huge half-circle on the right. The part along the axis is the integral we want. The half-circle and the unstable poles supply the rest — which is exactly where $\pi\sum\operatorname{Re}p_i$ and the relative-degree term come from.
:::

::: context relative-degree Relative degree
The **relative degree** of a transfer function is the number of poles minus the number of zeros. It sets how fast the gain falls at very high frequency: relative degree $r$ means a final slope of $-20r\ \mathrm{dB/decade}$. The rate loop $500(s+2)/\bigl(s^2(s+50)\bigr)$ has three poles and one zero, so $r = 2$. Every real actuator, sensor and filter adds poles, so a physical loop's relative degree only grows as you model it more completely.
:::

::: context waterbed-picture The waterbed, drawn
Here is $\ln|S|$ for the booster-with-actuator loop on a linear frequency axis. The blue dip below zero is the rejection the loop buys at low frequency: area $-1.760$ up to $1.88\ \mathrm{rad/s}$. The red sliver above zero is the price — only about $0.14$ tall at its peak, but it runs on past $30\ \mathrm{rad/s}$, where the plot stops, and out beyond $100$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M40,90 L40.0,181.5 L41.2,178.9 L42.0,175.1 L42.5,171.8 L43.0,168.2 L43.5,164.3 L44.0,160.2 L44.5,156.1 L45.0,152.0 L45.5,147.8 L46.0,143.8 L46.5,139.9 L47.0,136.1 L47.5,132.4 L48.0,128.9 L48.5,125.5 L49.0,122.3 L49.5,119.3 L50.0,116.5 L50.5,113.8 L51.0,111.3 L51.8,107.8 L52.5,104.7 L53.2,102.0 L54.0,99.5 L55.0,96.8 L56.0,94.5 L57.2,92.2 L58.8,90.1 L58.8,90 Z" fill="#8fb8f0"/>
  <path d="M58.8,90 L59.0,89.8 L62.2,87.1 L66.0,85.7 L70.0,85.0 L74.0,84.7 L78.0,84.6 L82.0,84.6 L86.0,84.6 L90.0,84.6 L94.0,84.6 L98.0,84.6 L102.0,84.6 L106.0,84.7 L110.0,84.7 L114.0,84.7 L118.0,84.7 L122.0,84.8 L126.0,84.8 L130.0,84.8 L134.0,84.8 L138.0,84.9 L142.0,84.9 L146.0,84.9 L150.0,85.0 L154.0,85.0 L158.0,85.0 L162.0,85.1 L166.0,85.1 L170.0,85.2 L174.0,85.2 L178.0,85.3 L182.0,85.3 L186.0,85.4 L190.0,85.4 L194.0,85.5 L198.0,85.6 L202.0,85.6 L206.0,85.7 L210.0,85.8 L214.0,85.8 L218.0,85.9 L222.0,86.0 L226.0,86.1 L230.0,86.2 L234.0,86.3 L238.0,86.4 L242.0,86.4 L246.0,86.5 L250.0,86.6 L254.0,86.7 L258.0,86.8 L262.0,86.9 L266.0,87.0 L270.0,87.1 L274.0,87.2 L278.0,87.3 L282.0,87.3 L286.0,87.4 L290.0,87.5 L294.0,87.6 L298.0,87.7 L302.0,87.8 L306.0,87.8 L310.0,87.9 L314.0,88.0 L318.0,88.1 L322.0,88.1 L326.0,88.2 L330.0,88.3 L334.0,88.3 L338.0,88.4 L340.0,88.4 L340,90 Z" fill="#b4232c" opacity="0.55"/>
  <line x1="40" y1="90" x2="345" y2="90" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="40" y1="20" x2="40" y2="190" stroke="#1f2a44" stroke-width="1.2"/>
  <path d="M40.0,181.5 L41.2,178.9 L42.0,175.1 L42.5,171.8 L43.0,168.2 L43.5,164.3 L44.0,160.2 L44.5,156.1 L45.0,152.0 L45.5,147.8 L46.0,143.8 L46.5,139.9 L47.0,136.1 L47.5,132.4 L48.0,128.9 L48.5,125.5 L49.0,122.3 L49.5,119.3 L50.0,116.5 L50.5,113.8 L51.0,111.3 L51.8,107.8 L52.5,104.7 L53.2,102.0 L54.0,99.5 L55.0,96.8 L56.0,94.5 L57.2,92.2 L58.8,90.1 L58.8,90.0 L59.0,89.8 L62.2,87.1 L66.0,85.7 L70.0,85.0 L74.0,84.7 L78.0,84.6 L82.0,84.6 L86.0,84.6 L90.0,84.6 L94.0,84.6 L98.0,84.6 L102.0,84.6 L106.0,84.7 L110.0,84.7 L114.0,84.7 L118.0,84.7 L122.0,84.8 L126.0,84.8 L130.0,84.8 L134.0,84.8 L138.0,84.9 L142.0,84.9 L146.0,84.9 L150.0,85.0 L154.0,85.0 L158.0,85.0 L162.0,85.1 L166.0,85.1 L170.0,85.2 L174.0,85.2 L178.0,85.3 L182.0,85.3 L186.0,85.4 L190.0,85.4 L194.0,85.5 L198.0,85.6 L202.0,85.6 L206.0,85.7 L210.0,85.8 L214.0,85.8 L218.0,85.9 L222.0,86.0 L226.0,86.1 L230.0,86.2 L234.0,86.3 L238.0,86.4 L242.0,86.4 L246.0,86.5 L250.0,86.6 L254.0,86.7 L258.0,86.8 L262.0,86.9 L266.0,87.0 L270.0,87.1 L274.0,87.2 L278.0,87.3 L282.0,87.3 L286.0,87.4 L290.0,87.5 L294.0,87.6 L298.0,87.7 L302.0,87.8 L306.0,87.8 L310.0,87.9 L314.0,88.0 L318.0,88.1 L322.0,88.1 L326.0,88.2 L330.0,88.3 L334.0,88.3 L338.0,88.4 L340.0,88.4" fill="none" stroke="#1f2a44" stroke-width="1.8"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="140" y="104">10</text><text x="240" y="104">20</text><text x="330" y="104">30 rad/s</text>
  </g>
  <text x="70" y="160" font-size="12" fill="#1d6fd1">|S| &lt; 1: area −1.76</text>
  <text x="200" y="68" font-size="12" text-anchor="middle" fill="#b4232c">|S| &gt; 1: a long, thin sliver</text>
  <text x="46" y="30" font-size="11" fill="#1f2a44">ln|S|</text>
</svg>
```

Blue area plus red area equals $+1.500$, which is $\pi$ times the unstable pole.
:::

::: context sample-rate Why a sample rate caps the band
A flight computer measures and acts at fixed ticks — say 100 times a second. By the sampling theorem, it can only represent signals slower than half that rate, 50 Hz here. Above that, it cannot tell one frequency from another, so it cannot shape $|S|$ there at all, and in practice the useful control band ends well below that limit. That puts a hard $\omega_2$ into the waterbed bound.
:::

::: context poisson The Poisson integral
Siméon Denis Poisson, a French mathematician of the early 1800s, found a formula that rebuilds a smooth "harmonic" function inside a region from its values on the boundary. $\ln|S|$ is such a function in the right half plane. Weighting the integral of $\ln|S|$ by a kernel centered on a right-half-plane zero, where $S$ is forced to equal 1, gives bounds like $\lVert S\rVert_\infty \ge |(z+p)/(z-p)|$. The robust and multivariable control module uses the same tool to bound what any controller can achieve.
:::

::: context resonant-control Controllers tuned to one frequency
A **resonant controller** puts a very high gain at one chosen frequency — a pair of poles right on the $j\omega$ axis — so the loop crushes a disturbance at exactly that frequency, the way an integrator crushes a constant one. A **repetitive controller** does this at a fundamental frequency and all its harmonics at once, using a delay line one period long. They are used where a disturbance repeats at a known rate: power-grid hum at 50 or 60 Hz in electronics, or the spin of a disk in a hard drive.
:::
