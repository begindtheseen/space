---
id: l04-poles-zeros-and-dc-gain
title: Poles, zeros and DC gain
minutes: 18
covers:
  - "Poles, zeros, and DC gain"
---

A transfer function in factored form is a map. The poles are printed as crosses, the zeros as circles, and an experienced engineer reads speed, damping, overshoot, bandwidth and the likely trouble off that picture before evaluating anything. This lesson teaches that reading.

The division of labour is worth stating at the outset, because it is the single most useful idea in the lesson. **Poles are a property of the vehicle**: they are the eigenvalues of its dynamics, the frequencies at which it wants to move, and they do not care where you put the sensor or the actuator. **Zeros are a property of the instrumentation**: move the rate gyro from one body station to another and the poles stay exactly where they are while the zeros march across the plane, sometimes into the right half. That asymmetry explains a great deal of what goes wrong on flexible vehicles, and it explains why sensor placement is a control decision, not a structures decision.

The third quantity in the title, the DC gain, is the one number that converts the whole abstraction back into engineering units: how many degrees per second of pitch rate you get per degree of nozzle, how many radians per second of wheel speed per volt. It is also the one most often quoted when it does not exist.

## The pole-zero map

Write $G$ in pole-zero form,

$$
G(s) = k\,\frac{(s - z_1)(s - z_2)\cdots(s - z_m)}{(s - p_1)(s - p_2)\cdots(s - p_n)}.
$$

The **poles** $p_i$ are the roots of the denominator, the values where $|G| \to \infty$, the characteristic roots of the underlying ODE and the eigenvalues of $\mathbf{A}$. Each pole contributes a mode $e^{p_it}$ to every response. The **zeros** $z_i$ are the roots of the numerator, the values where $G$ vanishes. The constant $k$ is the ratio of leading coefficients.

Geometry on the map, all of it from module 8 and all of it used constantly:

- Distance left of the imaginary axis is decay rate. A pole at $\operatorname{Re}s = -\sigma$ contributes a mode with time constant $1/\sigma$, 2% gone in $4/\sigma$.
- Angle from the negative real axis is damping: for a complex pair at angle $\vartheta$ from that axis, $\zeta = \cos\vartheta$, and $|p| = \omega_n$.
- Height above the axis is the frequency you actually see, $\omega_d$.
- Poles in the right half plane are instability. Zeros in the right half plane are not instability, but they cost you, and lesson 7 says how much.

## Poles set the modes, residues set how much of each

Every pole contributes a mode, but not every mode is visible. Expand a strictly proper $G$ with distinct poles in partial fractions:

$$
G(s) = \sum_{i=1}^{n}\frac{r_i}{s - p_i}, \qquad h(t) = \sum_{i=1}^{n} r_i e^{p_it},
$$

where the **residue** at $p_i$ is obtained by the cover-up rule,

$$
r_i = \lim_{s\to p_i}(s - p_i)G(s) = \frac{k\prod_j(p_i - z_j)}{\prod_{j\ne i}(p_i - p_j)}.
$$

Read the formula as geometry on the map. The residue at a pole is large when the pole is *far from every zero* and *close to the other poles*; it is small when a zero sits near the pole. A zero does not remove a mode, but it can shrink that mode's share of the response to nothing that matters.

Two bookkeeping checks are worth having: for relative degree one, $\sum_i r_i = h(0^+) = \lim_{s\to\infty}sG(s)$; for relative degree two or more, $\sum_i r_i = 0$, so the residues must cancel. For $G = 100(s + 9)/\left[(s+1)(s+10)(s+100)\right]$ the residues are $0.8979$, $0.1235$ and $-1.0213$, which sum to zero to the digits shown — a free check on your arithmetic.

::: example Why a motor's electrical pole never shows up
Lesson 3 gave the reaction-wheel motor $G(s) = 3054/\left[(s + 0.0529)(s + 2083.3)\right]$ from volts to wheel rate. Apply a unit voltage step: $\Omega(s) = G(s)/s$ has three poles, at $0$, $-0.0529$ and $-2083.3$, with residues

$$
r_0 = \frac{3054}{(0.0529)(2083.3)} = 27.723, \quad r_1 = \frac{3054}{(-0.0529)(2083.25)} = -27.723, \quad r_2 = \frac{3054}{(-2083.3)(-2083.25)} = 7.04\times10^{-4}.
$$

So $\omega(t) = 27.723 - 27.723\,e^{-0.0529t} + 7.04\times10^{-4}e^{-2083.3t}\ \mathrm{rad/s}$. The electrical mode's residue is $2.5\times10^{-5}$ of the mechanical one. Even at $t = 1\,\mathrm{ms}$, when the fast exponential has barely begun to decay, it contributes $8.8\times10^{-5}\,\mathrm{rad/s}$ against a total of $8.5\times10^{-4}\,\mathrm{rad/s}$; by $10\,\mathrm{ms}$ it is $6\times10^{-13}$ and gone. The residues, not the pole locations alone, are what tells you the electrical dynamics may be dropped — and lesson 6 makes that a procedure.

The three residues sum to $-1.4\times10^{-15}$, confirming the relative-degree-two rule and the arithmetic.
:::

## Zeros: what they block and where they come from

A zero at $s = z$ means $G(z) = 0$, and by the eigenfunction property of lesson 1 that has a direct physical reading: drive the system with $u = e^{zt}$ and the forced output is $G(z)e^{zt} = 0$. The system **blocks** that exponential entirely. With the initial conditions chosen to kill the transient too, the output is identically zero even though the input is not.

For a conjugate pair of zeros on the imaginary axis at $\pm j\omega_z$, the blocked input is $\cos\omega_z t$: the system transmits nothing at that frequency. That is what a notch filter is, and — more importantly for a vehicle — it is what an **antiresonance** is. Something inside the structure is moving in exactly the way that cancels the output.

Here is the key structural fact. Consider a hub of inertia $J_1$ carrying a flexible appendage of inertia $J_2$ on a torsional spring $k$ with damping $c$, torque $u$ applied to the hub. The equations are $J_1\ddot{\theta}_1 = u - k(\theta_1 - \theta_2) - c(\dot{\theta}_1 - \dot{\theta}_2)$ and $J_2\ddot{\theta}_2 = k(\theta_1 - \theta_2) + c(\dot{\theta}_1 - \dot{\theta}_2)$. Transforming and eliminating gives

$$
\frac{\Theta_1(s)}{U(s)} = \frac{J_2s^2 + cs + k}{s^2\left[J_1J_2s^2 + (J_1 + J_2)cs + (J_1 + J_2)k\right]}, \qquad \frac{\Theta_2(s)}{U(s)} = \frac{cs + k}{s^2\left[J_1J_2s^2 + (J_1 + J_2)cs + (J_1 + J_2)k\right]}.
$$

**The denominators are identical.** The poles belong to the structure. The numerators are not: measuring the hub gives a pair of complex zeros, measuring the tip gives a single real zero far away. Where you point the sensor decides the zeros and nothing else.

::: key
Poles are the roots of the denominator — the modes of the system, independent of sensor and actuator placement. Zeros are the roots of the numerator — the exponentials the system blocks, $G(z) = 0$, and they move when you move the sensor or the actuator. Residue at a pole: $r_i = \lim_{s\to p_i}(s - p_i)G(s)$; a zero near a pole makes that pole's residue small, which is how a mode becomes invisible without disappearing.
:::

::: example Two sensor locations on the same spacecraft
Take $J_1 = 1200\,\mathrm{kg\,m^2}$ (bus), $J_2 = 150\,\mathrm{kg\,m^2}$ (solar array), $k = 600\,\mathrm{N\,m/rad}$, $c = 3\,\mathrm{N\,m\,s/rad}$.

Both transfer functions share a double pole at the origin — the rigid body, which no amount of internal flexing moves — and a lightly damped pair at

$$
\omega_f = \sqrt{\frac{k(J_1 + J_2)}{J_1J_2}} = \sqrt{\frac{600 \times 1350}{180000}} = 2.121\,\mathrm{rad/s}\ (0.338\,\mathrm{Hz}), \qquad \zeta_f = \frac{(J_1+J_2)c}{2\omega_fJ_1J_2} = 0.0053.
$$

Hub measurement: the numerator $150s^2 + 3s + 600$ gives zeros at $\omega_z = \sqrt{k/J_2} = 2.000\,\mathrm{rad/s}$ with $\zeta_z = c/(2\omega_zJ_2) = 0.0050$ — the frequency at which the array alone oscillates with the hub held still. Tip measurement: the numerator $3s + 600$ gives one real zero at $-k/c = -200\,\mathrm{rad/s}$, a hundred times beyond the mode and of no consequence in the control band.

Evaluate the two responses on the imaginary axis (magnitudes in $\mathrm{rad}$ per $\mathrm{N\,m}$):

| $\omega$ (rad/s) | $\lvert\Theta_1/U\rvert$ (hub) | $\lvert\Theta_2/U\rvert$ (tip) |
| --- | --- | --- |
| 0.1 | $7.41\times10^{-2}$ | $7.42\times10^{-2}$ |
| 1.0 | $7.14\times10^{-4}$ | $9.52\times10^{-4}$ |
| 2.000 (zero) | $1.66\times10^{-5}$ | $1.66\times10^{-3}$ |
| 2.121 (pole) | $1.95\times10^{-3}$ | $1.55\times10^{-2}$ |
| 10.0 | $8.38\times10^{-6}$ | $3.49\times10^{-7}$ |

At $2.000\,\mathrm{rad/s}$ the hub response collapses by a factor of 43 relative to $1\,\mathrm{rad/s}$ and by a factor of 117 relative to the resonance $0.12\,\mathrm{rad/s}$ away. The array is acting as a tuned absorber: it oscillates with exactly the amplitude and phase whose spring reaction cancels the applied torque, and the hub barely moves. The tip sensor sees no such cancellation — at that frequency the array is where all the motion is.

The practical consequence is the pole-zero interlacing at the hub: zero at 2.000, pole at 2.121, so the phase dips and recovers within $0.12\,\mathrm{rad/s}$ and never falls past $-180^\circ$ from the rigid-body level. A collocated sensor and actuator always interlace this way, which is why collocated rate feedback on a flexible vehicle is so forgiving. Move the sensor away from the actuator and the interlacing breaks.
:::

## DC gain

::: key
**DC gain**: $G(0)$. It is the steady-state output for a unit step input, provided the system is stable. Equivalently it is $\int_0^\infty h(t)\,dt$, the area under the impulse response, and it is the leading constant $K$ of the time-constant form.
:::

The DC gain carries the units of the whole transfer function. The wheel motor's $G(0) = 27.72$ is $27.72\,(\mathrm{rad/s})$ per volt; a pitch-rate plant's $G(0) = 20$ is $20\,(\mathrm{rad/s})$ per radian of elevator; a closed attitude loop with $G(0) = 0.909$ tracks $90.9\%$ of a commanded angle in steady state and leaves a 9.1% error.

Three cases where the phrase needs care:

- **A pole at the origin.** $G(s) = 10/\left[s(1 + s/10)\right]$ has $|G(0)| = \infty$: there is no finite steady-state output for a step, because the output ramps forever. An integrator in the loop is exactly this, and it is what makes steady-state error vanish. The right statement for such a system is not "DC gain" but the low-frequency asymptote, $|G(j\omega)| \approx 10/\omega$.
- **A zero at the origin.** $G(s) = s/(s + a)$ has $G(0) = 0$: constants are blocked entirely. This is a **washout** or high-pass filter, and it is standard on rate feedback so that the damper does not fight a commanded steady turn rate — it passes the transient and ignores the trim.
- **An unstable pole.** $G(0)$ is a number but it is not a steady state. The vehicle of lesson 3 has $G(0) = -65.7$ and diverges; the final value theorem does not apply.

::: warning
DC gain is the gain at *one* frequency, and a lightly damped system's gain elsewhere can be many times larger. For $G(s) = 4/(s^2 + 0.4s + 4)$, $\omega_n = 2\,\mathrm{rad/s}$ and $\zeta = 0.1$, the DC gain is $G(0) = 1$, but at resonance $|G(j2)| = 4/(0.4 \times 2) = 5$, which is $1/(2\zeta)$. Sizing an actuator or a structural load from the DC gain alone underestimates it fivefold here — and by fifty for the $\zeta = 0.01$ bending mode of a real booster.
:::

## Pole-zero cancellation, and why you should be nervous

If a numerator factor equals a denominator factor, they cancel and $G$ has a lower order. The algebra is correct and the physics may not be. The mode has not gone anywhere: it is still in the state-space model, still excited by initial conditions and by any other input, and still limited by the same actuator. What cancellation means is that this particular input cannot excite it (uncontrollable) or this particular output cannot see it (unobservable).

Two rules follow.

**Never cancel an unstable pole with a controller zero.** Put a zero at $+0.163$ in your controller to cancel the launch vehicle's unstable pole and the closed-loop transfer function from command to attitude looks stable, while the internal signal at that mode grows as $e^{0.163t}$ until something saturates. The cancellation is also exact only on paper: the pole moves with dynamic pressure, the zero does not, and the residue reappears.

**Near-cancellation leaves a small residue, and small is not zero.** A pole at $-1.0$ and a zero at $-1.05$ give that mode a residue 20 times smaller than an isolated pole would, so it contributes a barely visible tail to the step response. That is acceptable for a stable, well-damped mode and a disaster for a lightly damped structural one, where "barely visible in the step response" can still mean a large peak in the frequency response and a large load in the structure.

::: example Reading a pole-zero map cold
A reviewer puts up $G(s) = \dfrac{8(s + 12.5)}{(s + 0.5)(s^2 + 1.6s + 100)}$ and asks what the step response does.

Poles: a real one at $-0.5$, time constant $2\,\mathrm{s}$; a complex pair with $\omega_n = \sqrt{100} = 10\,\mathrm{rad/s}$ and $2\zeta\omega_n = 1.6$, so $\zeta = 0.08$ — very lightly damped, ringing at $\omega_d = 10\sqrt{1 - 0.0064} = 9.97\,\mathrm{rad/s}$ and taking $4/(\zeta\omega_n) = 5\,\mathrm{s}$ to settle. One zero at $-12.5$, comfortably beyond both.

DC gain: $G(0) = 8(12.5)/\left[(0.5)(100)\right] = 2.0$, so a unit step ends at 2.0 in whatever units the signal carries.

Residue at the real pole: $8(12)/\left[(-0.5)^2 + 1.6(-0.5) + 100\right] = 96/99.45 = 0.965$. Residue magnitude at the complex pair: $8\lvert{-0.8} + 9.968j + 12.5\rvert\,/\,\bigl(\lvert{-0.8} + 9.968j + 0.5\rvert \times 19.94\bigr) = 8(15.37)/(9.97 \times 19.94) = 0.618$, so the oscillation is not a small ripple on top of the slow mode — it is comparable to it. Prediction: the step rises with the $2\,\mathrm{s}$ exponential while ringing hard at $1.59\,\mathrm{Hz}$, with the ringing dying over about $5\,\mathrm{s}$ and the slow mode over about $8\,\mathrm{s}$, ending at 2.0. If that pair is a structural mode, the loop will need a notch, and lesson 9 shows where on the Bode plot it will appear.
:::

## Check yourself

::: check
$G(s) = \dfrac{20(s + 5)}{(s + 4)(s + 25)}$. Give the poles, zeros, $k$, the DC gain, and the residue at each pole. What is $h(0^+)$?
:::

::: answer
Poles at $-4$ and $-25$; one zero at $-5$; $k = 20$ (ratio of leading coefficients). DC gain $G(0) = 20(5)/\left[(4)(25)\right] = 1.0$. Residues: at $-4$, $20(-4 + 5)/(-4 + 25) = 20/21 = 0.952$; at $-25$, $20(-25 + 5)/(-25 + 4) = -400/(-21) = 19.05$. Relative degree is one, so the residues should sum to $h(0^+) = \lim sG(s) = 20$: $0.952 + 19.05 = 20.0$. The impulse response starts at $20\,\mathrm{s^{-1}}$ and is dominated at first by the fast mode, whose residue is twenty times larger because the zero at $-5$ sits right next to the slow pole and guts its residue.
:::

::: check
A rate gyro is moved from one body station to another on a launch vehicle. Which of the poles, zeros, DC gain and stability of the open-loop plant can change, and which cannot?
:::

::: answer
The **poles** cannot change: they are the eigenvalues of the vehicle's dynamics and the sensor is a passive observer of them. Open-loop **stability**, being a statement about poles alone, therefore cannot change either. The **zeros** can and do change, because they depend on which linear combination of states you are measuring. The **DC gain** can change, since it is $k\prod(-z_i)/\prod(-p_i)$ and the zeros moved — a gyro forward of a node sees the bending mode with one sign, aft of it with the other. All the trouble on a flexible booster comes from this: the plant is the same, the measurement is not, and the loop's phase at the bending frequency flips with sensor station.
:::

::: check
Explain why $G(s) = s/(s + 0.2)$ is used in series with a rate gyro signal on a vehicle that must hold a steady turn rate, and what it does to a $0.5\,^\circ/\mathrm{s}$ constant rate and to a $2\,\mathrm{rad/s}$ oscillation.
:::

::: answer
It is a washout: $G(0) = 0$ blocks constants, and the pole at $-0.2$ sets the corner below which the blocking takes effect. A steady $0.5\,^\circ/\mathrm{s}$ is a constant, so in steady state the filter passes nothing and the damping loop does not fight the commanded turn — the vehicle is allowed to rotate at the commanded rate without the rate feedback treating it as an error. At $2\,\mathrm{rad/s}$, ten times above the corner, $|G(2j)| = 2/|2j + 0.2| = 2/2.010 = 0.995$ and $\angle G = 90^\circ - \arctan(2/0.2) = 5.7^\circ$, so the transient is passed essentially untouched with a few degrees of phase lead. Transients damped, trim ignored.
:::

::: check
On the flexible spacecraft of the worked example, what happens to the antiresonance frequency if the solar array is stiffened so that $k$ doubles to $1200\,\mathrm{N\,m/rad}$? What happens to the resonance?
:::

::: answer
Both move up by $\sqrt{2}$. The hub zero is at $\sqrt{k/J_2} = \sqrt{1200/150} = 2.828\,\mathrm{rad/s}$ and the pole at $\sqrt{k(J_1 + J_2)/(J_1J_2)} = \sqrt{1200 \times 1350/180000} = 3.000\,\mathrm{rad/s}$. Their ratio is unchanged, $\omega_f/\omega_z = \sqrt{1 + J_2/J_1} = \sqrt{1.125} = 1.0607$, because that ratio depends only on the inertia split. So stiffening moves the whole pole-zero pair away from the control band without widening the gap between them — useful if your crossover is well below $2\,\mathrm{rad/s}$, useless if the problem was that the notch is too narrow to catch the mode with its uncertainty.
:::

::: check
A colleague proposes a controller with a zero at $s = +0.163$ to cancel the launch vehicle's unstable pole there, showing you a closed-loop transfer function whose poles are all in the left half plane. What is wrong?
:::

::: answer
The cancellation removes the unstable mode from the transfer function from command to attitude, not from the system. The mode is still excited by disturbances — wind, thrust misalignment, initial attitude error — which enter at a different point in the loop and are not cancelled, so the internal signals grow as $e^{0.163t}$ with a $4.25\,\mathrm{s}$ doubling time until the actuator saturates. Even for the command channel the cancellation is exact only if the pole is exactly at $0.163$, and it is not: $\mu_\alpha$ changes by tens of percent over half a minute of flight, so the residue reappears and grows. The rule is unconditional — never cancel a right-half-plane pole. Stabilise it with feedback so that the closed-loop pole genuinely moves left.
:::

## Summary

| Item | Statement |
| --- | --- |
| Pole-zero form | $G = k\prod(s - z_i)/\prod(s - p_i)$; poles $\to$ modes $e^{p_it}$, zeros $\to$ blocked exponentials |
| Map geometry | $-\sigma$ sets decay ($4/\sigma$ to 2%); angle from the negative real axis gives $\zeta = \cos\vartheta$; $|p| = \omega_n$ |
| Residue | $r_i = \lim_{s\to p_i}(s - p_i)G(s)$; small when a zero is near the pole |
| Residue checks | $\sum r_i = h(0^+)$ for relative degree 1; $\sum r_i = 0$ for relative degree $\ge 2$ |
| Zero blocking | $G(z) = 0 \Rightarrow$ input $e^{zt}$ produces no forced output; $\pm j\omega_z$ is an antiresonance |
| Placement | poles are the vehicle; zeros are the sensor and actuator placement |
| DC gain | $G(0) = \int_0^\infty h\,dt = K$; steady-state step output **if stable**; infinite with a pole at the origin, zero with a zero there |
| Cancellation | exact cancellation hides an uncontrollable or unobservable mode; never cancel a right-half-plane pole |

The next lesson turns the map into numbers a specification can be written against: rise time, peak time, overshoot and settling time, as explicit functions of $\zeta$ and $\omega_n$.
