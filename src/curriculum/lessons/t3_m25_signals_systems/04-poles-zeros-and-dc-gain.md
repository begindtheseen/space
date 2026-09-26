---
id: l04-poles-zeros-and-dc-gain
title: Poles, zeros and DC gain
minutes: 24
covers:
  - "Poles, zeros, and DC gain"
---

Tap a wine glass with a spoon and it rings at one clear note. Tap it harder, softer, near the rim or near the stem — the note is the same. The note belongs to the glass. What changes is *how much* of the note you hear, and that depends on where you tap and where your ear is.

A transfer function works the same way. Written in factored form, it becomes a map. The **poles** — the notes the system wants to ring at — are drawn as crosses. The **zeros** — the signals the system refuses to pass — are drawn as small circles. An experienced engineer reads speed, damping, overshoot and the likely trouble straight off that picture, before computing anything. This lesson teaches you to read it.

Here is the single most useful idea in the lesson, stated up front. **Poles belong to the vehicle.** They are the natural motions of its dynamics, and they do not care where you put the sensor or the actuator. **Zeros belong to the instrumentation.** Move the rate gyro from one spot on the body to another, and the poles stay exactly where they are while the zeros march across the map — sometimes into the right half. That difference explains much of what goes wrong on flexible vehicles, and it is why choosing where a sensor goes is a control decision, not only a structures decision.

The third item in the title, the **DC gain**, is the number that turns all of this back into engineering units: how many degrees per second of pitch rate you get per degree of nozzle, or how many radians per second of wheel speed per volt. It is also the number most often quoted when it does not exist.

## The pole-zero map

Write the transfer function $G(s)$ in **pole-zero form**:

$$
G(s) = k\,\frac{(s - z_1)(s - z_2)\cdots(s - z_m)}{(s - p_1)(s - p_2)\cdots(s - p_n)}.
$$

Read $p_1$ as "p sub one" and $z_1$ as "z sub one". Each piece has a job:

- The **[[poles|pole-name]]** $p_i$ are the roots of the bottom polynomial (the denominator). At a pole, $|G| \to \infty$. They are the same numbers as the characteristic roots of the underlying differential equation, and the **[[eigenvalues|eigenvalue-word]]** of the state matrix $\mathbf{A}$. Each pole contributes a **mode** — a term $e^{p_it}$ — to every response.
- The **zeros** $z_i$ are the roots of the top polynomial (the numerator). At a zero, $G$ equals zero.
- The constant $k$ is the ratio of the leading coefficients of top and bottom.

Now the geometry. Every rule below comes from module 8, and you will use all of them constantly on the **[[pole-zero map|reading-the-map]]**:

- **Distance left of the imaginary axis is decay rate.** A pole at $\operatorname{Re}s = -\sigma$ (read "the real part of $s$ is minus sigma") gives a mode with time constant $1/\sigma$. It is down to 2% of its starting size after $4/\sigma$.
- **Angle is damping.** For a complex pair at angle $\vartheta$ ("vartheta") measured from the negative real axis, the damping ratio is $\zeta = \cos\vartheta$, and the distance from the origin is $|p| = \omega_n$.
- **Height above the real axis is the frequency you actually see**, the damped frequency $\omega_d$.
- **The right half plane is where trouble lives.** A pole there is instability. A zero there is not instability, but it costs you, and lesson 7 says how much.

## Poles set the modes, residues set how much of each

Every pole contributes a mode, but you do not always see every mode. Think of a band where every instrument is always on stage, but each has its own volume knob. The pole decides which note the instrument plays. Something else decides how loud.

That something is the **residue**. Split a **strictly proper** $G$ (the top has lower degree than the bottom) with distinct poles into partial fractions:

$$
G(s) = \sum_{i=1}^{n}\frac{r_i}{s - p_i}, \qquad h(t) = \sum_{i=1}^{n} r_i e^{p_it}.
$$

Here $h(t)$ is the impulse response, and $r_i$ is the **[[residue|residue-word]]** at pole $p_i$ — the volume knob for that mode. You find it with the **[[cover-up rule|cover-up]]**:

$$
r_i = \lim_{s\to p_i}(s - p_i)G(s) = \frac{k\prod_j(p_i - z_j)}{\prod_{j\ne i}(p_i - p_j)}.
$$

In words: multiply $G$ by the factor $(s - p_i)$ that makes the pole, which cancels it, then set $s = p_i$ in what is left. The symbol $\prod$ ("product") means multiply all the terms together.

Now read that formula as geometry on the map. Each factor $(p_i - z_j)$ is the distance-and-direction from a zero to the pole. Each factor $(p_i - p_j)$ is the same from another pole. So:

- The residue is **large** when the pole is *far from every zero* and *close to the other poles*.
- The residue is **small** when a zero sits near the pole.

A zero does not remove a mode. But it can turn that mode's volume down to nothing that matters.

Two free checks on your arithmetic come from the same formula. Call the **relative degree** the degree of the bottom minus the degree of the top.

- For relative degree one, $\sum_i r_i = h(0^+) = \lim_{s\to\infty}sG(s)$. The residues add up to where the impulse response starts.
- For relative degree two or more, $\sum_i r_i = 0$. The residues must cancel.

For $G = 100(s + 9)/\left[(s+1)(s+10)(s+100)\right]$ the residues are $0.8979$, $0.1235$ and $-1.0213$. Add them: $0.8979 + 0.1235 - 1.0213 = 0.0001$, which is zero to the digits shown. Relative degree two, so that is exactly what should happen.

::: example Why a motor's electrical pole never shows up
Lesson 3 gave the reaction-wheel motor $G(s) = 3054/\left[(s + 0.0529)(s + 2083.3)\right]$, from volts in to wheel rate out. Apply a unit voltage step. The output transform is $\Omega(s) = G(s)/s$, which has three poles: at $0$, at $-0.0529$ and at $-2083.3$.

Cover up each pole in turn:

$$
r_0 = \frac{3054}{(0.0529)(2083.3)} = 27.71, \quad r_1 = \frac{3054}{(-0.0529)(2083.25)} = -27.71, \quad r_2 = \frac{3054}{(-2083.3)(-2083.25)} = 7.04\times10^{-4}.
$$

For $r_0$ we set $s = 0$ in everything except the $1/s$. For $r_1$ we set $s = -0.0529$, so $(s + 2083.3)$ becomes $2083.25$. For $r_2$, $s = -2083.3$ turns the other two factors into $-2083.3$ and $-2083.25$. ($r_0$ is the DC gain, $27.72$ in lesson 3; the last digit differs only because the pole locations were rounded.)

So

$$
\omega(t) = 27.71 - 27.71\,e^{-0.0529t} + 7.04\times10^{-4}e^{-2083.3t}\ \mathrm{rad/s}.
$$

The electrical mode's residue is $2.5\times10^{-5}$ of the mechanical one — about one part in forty thousand.

Is it ever visible? At $t = 1\,\mathrm{ms}$, when the fast exponential has barely begun to decay, it contributes $8.8\times10^{-5}\,\mathrm{rad/s}$ out of a total of $8.5\times10^{-4}\,\mathrm{rad/s}$. By $10\,\mathrm{ms}$ it is $6\times10^{-13}$ and gone. The residues, not the pole locations alone, tell you the electrical dynamics may be dropped. Lesson 6 turns that into a procedure.

Sanity check: the three exact residues sum to about $-1.4\times10^{-15}$, zero to rounding. Relative degree two again, so the rule holds.
:::

## Zeros: what they block and where they come from

A zero at $s = z$ means $G(z) = 0$. That has a direct physical meaning, thanks to the eigenfunction property of lesson 1: an exponential input $u = e^{zt}$ produces the forced output $G(z)e^{zt}$. If $G(z) = 0$, that output is zero. The system **blocks** that exponential entirely. Choose the initial conditions to kill the transient as well, and the output is exactly zero even though the input is not.

For a pair of zeros on the imaginary axis at $\pm j\omega_z$ ("plus or minus j omega sub z"), the blocked input is the sine wave $\cos\omega_z t$. The system passes nothing at that one frequency. That is what a notch filter does. On a vehicle it has another name: an **antiresonance**. Something inside the structure is moving in exactly the way that cancels the output.

Here is the key structural fact, shown on a real shape. Picture a spacecraft hub with inertia $J_1$ carrying a solar array of inertia $J_2$, joined by a torsional spring of stiffness $k$ with damping $c$. A torque $u$ is applied to the hub. The two angles obey

$$
J_1\ddot{\theta}_1 = u - k(\theta_1 - \theta_2) - c(\dot{\theta}_1 - \dot{\theta}_2), \qquad J_2\ddot{\theta}_2 = k(\theta_1 - \theta_2) + c(\dot{\theta}_1 - \dot{\theta}_2).
$$

Transform both, and eliminate the angle you are not measuring. You get

$$
\frac{\Theta_1(s)}{U(s)} = \frac{J_2s^2 + cs + k}{s^2\left[J_1J_2s^2 + (J_1 + J_2)cs + (J_1 + J_2)k\right]}, \qquad \frac{\Theta_2(s)}{U(s)} = \frac{cs + k}{s^2\left[J_1J_2s^2 + (J_1 + J_2)cs + (J_1 + J_2)k\right]}.
$$

**The denominators are identical.** The poles belong to the structure. The numerators are not identical. Measuring the hub gives a pair of complex zeros. Measuring the tip gives one real zero, far away. Where you point the sensor decides the zeros, and nothing else.

::: key
Poles are the roots of the denominator — the modes of the system, independent of sensor and actuator placement. Zeros are the roots of the numerator — the exponentials the system blocks, $G(z) = 0$, and they move when you move the sensor or the actuator. Residue at a pole: $r_i = \lim_{s\to p_i}(s - p_i)G(s)$; a zero near a pole makes that pole's residue small, which is how a mode becomes invisible without disappearing.
:::

::: example Two sensor locations on the same spacecraft
Take a bus of $J_1 = 1200\,\mathrm{kg\,m^2}$, a solar array of $J_2 = 150\,\mathrm{kg\,m^2}$, stiffness $k = 600\,\mathrm{N\,m/rad}$ and damping $c = 3\,\mathrm{N\,m\,s/rad}$.

**Poles (shared).** Both transfer functions have a double pole at the origin. That is the rigid body turning as a whole, which no amount of internal flexing changes. Both also have a lightly damped pair. Match the bracket to $J_1J_2(s^2 + 2\zeta_f\omega_f s + \omega_f^2)$:

$$
\omega_f = \sqrt{\frac{k(J_1 + J_2)}{J_1J_2}} = \sqrt{\frac{600 \times 1350}{180000}} = 2.121\,\mathrm{rad/s}\ (0.338\,\mathrm{Hz}), \qquad \zeta_f = \frac{(J_1+J_2)c}{2\omega_fJ_1J_2} = 0.0053.
$$

**Hub zeros.** The numerator $150s^2 + 3s + 600$ gives zeros at $\omega_z = \sqrt{k/J_2} = 2.000\,\mathrm{rad/s}$ with $\zeta_z = c/(2\omega_zJ_2) = 0.0050$. That is the frequency at which the array alone would swing if the hub were held still.

**Tip zero.** The numerator $3s + 600$ gives one real zero at $-k/c = -200\,\mathrm{rad/s}$. That is a hundred times beyond the mode, and of no consequence where the controller works.

Now evaluate both responses on the imaginary axis, $s = j\omega$. Magnitudes are in radians of angle per $\mathrm{N\,m}$ of torque:

| $\omega$ (rad/s) | $\lvert\Theta_1/U\rvert$ (hub) | $\lvert\Theta_2/U\rvert$ (tip) |
| --- | --- | --- |
| 0.1 | $7.41\times10^{-2}$ | $7.42\times10^{-2}$ |
| 1.0 | $7.14\times10^{-4}$ | $9.52\times10^{-4}$ |
| 2.000 (zero) | $1.66\times10^{-5}$ | $1.66\times10^{-3}$ |
| 2.121 (pole) | $1.95\times10^{-3}$ | $1.55\times10^{-2}$ |
| 10.0 | $8.38\times10^{-6}$ | $3.49\times10^{-7}$ |

At $2.000\,\mathrm{rad/s}$ the hub response collapses. It is 43 times smaller than at $1\,\mathrm{rad/s}$, and 117 times smaller than at the resonance only $0.12\,\mathrm{rad/s}$ away. The array is acting as a **[[tuned absorber|tuned-absorber]]**: it swings with exactly the size and timing whose spring push cancels the applied torque, so the hub barely moves. The tip sensor sees no such cancellation. At that frequency the array is where all the motion is.

Sanity check at low frequency: at $0.1\,\mathrm{rad/s}$ both columns agree, about $1/\left[(J_1 + J_2)\omega^2\right] = 1/(1350 \times 0.01) = 0.0741$. Slowly, the whole spacecraft turns as one rigid body, whichever end you watch.

The practical consequence is the **[[interlacing|interlacing]]** at the hub: zero at 2.000, pole at 2.121. Going up in frequency, the hub's phase first *rises* at the zero (a zero adds phase lead) and then comes back down at the pole, all within $0.12\,\mathrm{rad/s}$. It never drops below the rigid body's $-180^\circ$. A **collocated** sensor and actuator — measuring at the same spot you push — always interlace this way, which is why collocated rate feedback on a flexible vehicle is so forgiving. Move the sensor away from the actuator and the interlacing breaks.
:::

## DC gain

Turn a faucet handle a quarter turn and wait. After the pipes settle, a steady amount of water comes out every second. "How much flow per quarter turn, once everything has settled" is the faucet's DC gain. (DC comes from "direct current": a signal that never changes.)

For a transfer function, "never changes" means frequency zero, so $s = 0$.

::: key
**DC gain**: $G(0)$. It is the steady-state output for a unit step input, provided the system is stable. Equivalently it is $\int_0^\infty h(t)\,dt$, the area under the impulse response, and it is the leading constant $K$ of the time-constant form.
:::

::: note Why it has to be true
A unit step is $1/s$ in the Laplace domain, so the output is $Y(s) = G(s)/s$. The **final value theorem** says $y(\infty) = \lim_{s\to 0} sY(s)$, as long as every pole of $sY(s) = G(s)$ is in the open left half plane. So $y(\infty) = \lim_{s\to 0} s \cdot G(s)/s = G(0)$.

The area version comes straight from the definition of the transform: $G(s) = \int_0^\infty h(t)e^{-st}\,dt$. Set $s = 0$, and $e^{0} = 1$, leaving $\int_0^\infty h(t)\,dt$.

The time-constant form $G = K\prod(1 + s/z_i)/\prod(1 + s/p_i)$ has every factor equal to $1$ at $s = 0$, so $G(0) = K$.
:::

The DC gain carries the units of the whole transfer function. The wheel motor's $G(0) = 27.72$ means $27.72\,(\mathrm{rad/s})$ per volt. A pitch-rate plant with $G(0) = 20$ gives $20\,(\mathrm{rad/s})$ per radian of elevator. A closed attitude loop with $G(0) = 0.909$ tracks $90.9\%$ of a commanded angle in steady state and leaves a 9.1% error.

Three cases need care:

- **A pole at the origin.** $G(s) = 10/\left[s(1 + s/10)\right]$ has $|G(0)| = \infty$. A step gives no finite steady output, because the output ramps forever. An **integrator** in the loop is exactly this, and it is what makes steady-state error vanish. The right thing to quote for such a system is not a DC gain but its low-frequency behavior, $|G(j\omega)| \approx 10/\omega$.
- **A zero at the origin.** $G(s) = s/(s + a)$ has $G(0) = 0$: constant signals are blocked entirely. This is a **[[washout|washout]]**, or high-pass filter. It is standard on rate feedback so that the damper does not fight a commanded steady turn rate. It passes the quick changes and ignores the steady part.
- **An unstable pole.** $G(0)$ is a number, but it is not a steady state. The vehicle of lesson 3 has $G(0) = -65.7$ and diverges. The final value theorem does not apply.

::: warning
DC gain is the gain at *one* frequency, and a **[[lightly damped|resonance-peak]]** system's gain elsewhere can be many times larger. For $G(s) = 4/(s^2 + 0.4s + 4)$, with $\omega_n = 2\,\mathrm{rad/s}$ and $\zeta = 0.1$, the DC gain is $G(0) = 1$. But at resonance, $|G(j2)| = 4/(0.4 \times 2) = 5$, which is $1/(2\zeta)$. Sizing an actuator or a structural load from the DC gain alone underestimates it fivefold here — and fiftyfold for the $\zeta = 0.01$ bending mode of a real booster.
:::

## Pole-zero cancellation, and why you should be nervous

If a factor on top equals a factor on the bottom, they cancel and $G$ drops in order. The algebra is correct. The physics may not be.

The mode has not gone anywhere. It is still in the state-space model. It is still excited by initial conditions and by any other input. It is still limited by the same actuator. What the cancellation really says is narrower: *this particular* input cannot excite the mode — it is **[[uncontrollable|hidden-modes]]** — or *this particular* output cannot see it — it is **unobservable**.

Two rules follow.

**Never cancel an unstable pole with a controller zero.** Put a zero at $+0.163$ in your controller to cancel the launch vehicle's unstable pole there. The closed-loop transfer function from command to attitude now looks stable. Meanwhile the internal signal at that mode grows as $e^{0.163t}$ until something saturates. The cancellation is also exact only on paper: the pole moves with dynamic pressure, the zero does not, and the residue comes back.

**Near-cancellation leaves a small residue, and small is not zero.** Take a pole at $-1.0$ and a zero at $-1.05$. At the pole, the zero's factor $(1 + s/1.05)$ is only $0.05/1.05 \approx 0.048$, so the mode's residue is about 20 times smaller than it would be with no zero. The mode then adds only a faint tail to the step response. That is fine for a stable, well-damped mode. It is a disaster for a lightly damped structural one, where "barely visible in the step response" can still mean a tall peak in the frequency response and a large load in the structure.

::: example Reading a pole-zero map cold
A reviewer puts up $G(s) = \dfrac{8(s + 12.5)}{(s + 0.5)(s^2 + 1.6s + 100)}$ and asks what the step response does. Work it from the map.

**Poles.** A real one at $-0.5$: time constant $1/0.5 = 2\,\mathrm{s}$. A complex pair from $s^2 + 1.6s + 100$: matching to $s^2 + 2\zeta\omega_n s + \omega_n^2$ gives $\omega_n = \sqrt{100} = 10\,\mathrm{rad/s}$ and $2\zeta\omega_n = 1.6$, so $\zeta = 0.08$. That is very lightly damped. It rings at $\omega_d = 10\sqrt{1 - 0.0064} = 9.97\,\mathrm{rad/s}$ and takes $4/(\zeta\omega_n) = 4/0.8 = 5\,\mathrm{s}$ to settle.

**Zero.** One, at $-12.5$, comfortably beyond both.

**DC gain.** $G(0) = 8(12.5)/\left[(0.5)(100)\right] = 100/50 = 2.0$. A unit step ends at 2.0, in whatever units the signal carries.

**Residue at the real pole.** Cover up $(s + 0.5)$ and set $s = -0.5$: the top is $8(-0.5 + 12.5) = 96$, the bottom is $(-0.5)^2 + 1.6(-0.5) + 100 = 99.45$, so $r = 96/99.45 = 0.965$.

**Residue size at the complex pair.** The pole is at $-0.8 + 9.968j$. Measure distances on the map: to the zero, $\lvert{-0.8} + 9.968j + 12.5\rvert = 15.37$; to the real pole, $\lvert{-0.8} + 9.968j + 0.5\rvert = 9.97$; to its own conjugate, $2 \times 9.968 = 19.94$. So $\lvert r\rvert = 8(15.37)/(9.97 \times 19.94) = 0.618$.

**Prediction.** The oscillation is not a small ripple on top of the slow mode — its residue is comparable. The step rises with the $2\,\mathrm{s}$ exponential while ringing hard at $9.97/2\pi = 1.59\,\mathrm{Hz}$. The ringing dies over about $5\,\mathrm{s}$, the slow mode over about $8\,\mathrm{s}$ (four time constants), and the output ends at 2.0. If that pair is a structural mode, the loop will need a notch, and lesson 9 shows where on the Bode plot it will appear.
:::

## Check yourself

::: check
$G(s) = \dfrac{20(s + 5)}{(s + 4)(s + 25)}$. Give the poles, zeros, $k$, the DC gain, and the residue at each pole. What is $h(0^+)$?
:::

::: answer
Poles at $-4$ and $-25$. One zero at $-5$. $k = 20$, the ratio of leading coefficients.

DC gain: $G(0) = 20(5)/\left[(4)(25)\right] = 100/100 = 1.0$.

Residues, by cover-up. At $-4$: $20(-4 + 5)/(-4 + 25) = 20/21 = 0.952$. At $-25$: $20(-25 + 5)/(-25 + 4) = -400/(-21) = 19.05$.

The relative degree is one, so the residues should sum to $h(0^+) = \lim sG(s) = 20$. Check: $0.952 + 19.05 = 20.0$. The impulse response starts at $20\,\mathrm{s^{-1}}$ and is dominated at first by the fast mode. Its residue is twenty times larger because the zero at $-5$ sits right next to the slow pole at $-4$ and guts that pole's residue.
:::

::: check
A rate gyro is moved from one body station to another on a launch vehicle. Which of the poles, zeros, DC gain and stability of the open-loop plant can change, and which cannot?
:::

::: answer
The **poles** cannot change. They are the eigenvalues of the vehicle's dynamics, and the sensor only watches them. Open-loop **stability** depends on the poles alone, so it cannot change either.

The **zeros** can and do change, because they depend on which combination of states you measure. The **DC gain** can change too, since it is $k\prod(-z_i)/\prod(-p_i)$ and the zeros moved. A gyro forward of a bending node sees the bending mode with one sign; aft of it, with the other.

All the trouble on a flexible booster comes from this. The plant is the same, the measurement is not, and the loop's phase at the bending frequency flips with sensor station.
:::

::: check
Explain why $G(s) = s/(s + 0.2)$ is used in series with a rate gyro signal on a vehicle that must hold a steady turn rate. What does it do to a $0.5\,^\circ/\mathrm{s}$ constant rate, and to a $2\,\mathrm{rad/s}$ oscillation?
:::

::: answer
It is a washout. $G(0) = 0$ blocks constants, and the pole at $-0.2$ sets the corner below which the blocking takes effect.

A steady $0.5\,^\circ/\mathrm{s}$ is a constant. In steady state the filter passes nothing, so the damping loop does not fight the commanded turn. The vehicle is allowed to rotate at the commanded rate without the rate feedback treating it as an error.

At $2\,\mathrm{rad/s}$, ten times above the corner: $|G(2j)| = 2/|2j + 0.2| = 2/2.010 = 0.995$, and $\angle G = 90^\circ - \arctan(2/0.2) = 90^\circ - 84.3^\circ = 5.7^\circ$. The oscillation passes essentially untouched, with a few degrees of phase lead. Transients damped, trim ignored.
:::

::: check
On the flexible spacecraft of the worked example, what happens to the antiresonance frequency if the solar array is stiffened so that $k$ doubles to $1200\,\mathrm{N\,m/rad}$? What happens to the resonance?
:::

::: answer
Both move up by $\sqrt{2}$. The hub zero is at $\sqrt{k/J_2} = \sqrt{1200/150} = 2.828\,\mathrm{rad/s}$. The pole is at $\sqrt{k(J_1 + J_2)/(J_1J_2)} = \sqrt{1200 \times 1350/180000} = 3.000\,\mathrm{rad/s}$.

Their ratio is unchanged: $\omega_f/\omega_z = \sqrt{1 + J_2/J_1} = \sqrt{1.125} = 1.0607$. That ratio depends only on how the inertia is split, not on the stiffness.

So stiffening moves the whole pole-zero pair away from the control band without widening the gap between them. That helps if your crossover is well below $2\,\mathrm{rad/s}$. It does not help if the real problem was that the notch is too narrow to catch the mode with its uncertainty.
:::

::: check
A colleague proposes a controller with a zero at $s = +0.163$ to cancel the launch vehicle's unstable pole there, and shows you a closed-loop transfer function whose poles are all in the left half plane. What is wrong?
:::

::: answer
The cancellation removes the unstable mode from the transfer function from command to attitude — not from the system.

The mode is still excited by disturbances: wind, thrust misalignment, an initial attitude error. Those enter at a different point in the loop and are not cancelled. So the internal signals grow as $e^{0.163t}$, doubling every $\ln 2/0.163 = 4.25\,\mathrm{s}$, until the actuator saturates.

Even for the command channel, the cancellation is exact only if the pole is exactly at $0.163$, and it is not. $\mu_\alpha$ changes by tens of percent over half a minute of flight, so the residue reappears and grows.

The rule has no exceptions: never cancel a right-half-plane pole. Stabilize it with feedback, so that the closed-loop pole genuinely moves left.
:::

## Summary

| Item | Statement |
| --- | --- |
| Pole-zero form | $G = k\prod(s - z_i)/\prod(s - p_i)$; poles $\to$ modes $e^{p_it}$, zeros $\to$ blocked exponentials |
| Map geometry | $-\sigma$ sets decay ($4/\sigma$ to 2%); angle from the negative real axis gives $\zeta = \cos\vartheta$; $|p| = \omega_n$; height is $\omega_d$ |
| Residue | $r_i = \lim_{s\to p_i}(s - p_i)G(s)$; small when a zero is near the pole |
| Residue checks | $\sum r_i = h(0^+)$ for relative degree 1; $\sum r_i = 0$ for relative degree $\ge 2$ |
| Zero blocking | $G(z) = 0 \Rightarrow$ input $e^{zt}$ produces no forced output; $\pm j\omega_z$ is an antiresonance |
| Placement | poles are the vehicle; zeros are the sensor and actuator placement |
| DC gain | $G(0) = \int_0^\infty h\,dt = K$; steady-state step output **if stable**; infinite with a pole at the origin, zero with a zero there |
| Resonance | a lightly damped pair peaks near $1/(2\zeta)$ times the DC gain |
| Cancellation | exact cancellation hides an uncontrollable or unobservable mode; never cancel a right-half-plane pole |

The next lesson turns the map into numbers a specification can be written against: rise time, peak time, overshoot and settling time, as explicit functions of $\zeta$ and $\omega_n$.

::: context pole-name Why they are called poles
Picture $|G(s)|$ as a height above every point of the complex plane — a rubber sheet. Where the denominator is zero, the height shoots up to infinity, like a tent pole pushing the sheet up into a spike. Where the numerator is zero, the sheet is pinned flat to the floor. That picture is the usual explanation for the word. The crosses on the map are where the tent poles stand; the circles are where the sheet is tacked down.
:::

::: context eigenvalue-word Eigenvalue, the German half-word
"Eigen" is German for "own" or "characteristic". An eigenvalue of a matrix $\mathbf{A}$ is a number $\lambda$ for which some direction $\mathbf{v}$ is only stretched, not turned: $\mathbf{A}\mathbf{v} = \lambda\mathbf{v}$. For a system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}$, starting along that direction gives the motion $e^{\lambda t}\mathbf{v}$ — the system's *own* way of moving. That is why the eigenvalues of $\mathbf{A}$ and the poles of $G(s)$ are the same numbers: both are the system's natural modes.
:::

::: context reading-the-map Reading one pole off the map
One pole of a pair at $-3 + 4j$, drawn to scale. Its distance left of the imaginary axis is the decay rate $\sigma = 3\,\mathrm{s^{-1}}$. Its height is the ringing frequency $\omega_d = 4\,\mathrm{rad/s}$. Its distance from the origin is $\omega_n = \sqrt{3^2 + 4^2} = 5\,\mathrm{rad/s}$. The angle from the negative real axis has $\cos\vartheta = 3/5$, so $\zeta = 0.6$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="340" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="250" y1="8" x2="250" y2="196" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="336" y="126" font-size="11" text-anchor="end" fill="#6c7a93">Re s</text>
  <text x="256" y="20" font-size="11" fill="#6c7a93">Im s</text>
  <line x1="250" y1="110" x2="190" y2="30" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="190" y1="30" x2="250" y2="30" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="4 3"/>
  <line x1="190" y1="30" x2="190" y2="110" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="4 3"/>
  <path d="M225,110 A25,25 0 0,1 235,90" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="213" y="100" font-size="12" fill="#b4232c">ϑ</text>
  <g stroke="#1f2a44" stroke-width="2.2">
    <line x1="184" y1="24" x2="196" y2="36"/><line x1="196" y1="24" x2="184" y2="36"/>
    <line x1="184" y1="184" x2="196" y2="196"/><line x1="196" y1="184" x2="184" y2="196"/>
  </g>
  <text x="220" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">σ = 3</text>
  <text x="184" y="76" font-size="11" text-anchor="end" fill="#1f2a44">ω_d = 4</text>
  <text x="228" y="62" font-size="11" fill="#1d6fd1">ω_n = 5</text>
  <text x="30" y="40" font-size="12" fill="#1f2a44">pole at −3 + 4j</text>
  <text x="30" y="58" font-size="12" fill="#b4232c">ζ = cos ϑ = 3/5 = 0.6</text>
  <text x="30" y="178" font-size="12" fill="#1f2a44">its mirror at −3 − 4j</text>
</svg>
```
:::

::: context residue-word What is left over
"Residue" means what remains — the same Latin root as "residual". Near a pole, $G(s)$ looks like $r_i/(s - p_i)$ plus things that stay finite. Multiply by $(s - p_i)$ and let $s$ reach $p_i$: everything else is squashed to zero, and the number left over is $r_i$. It is the one coefficient that survives, and in the time domain it is the starting size of that mode, $r_ie^{p_it}$.
:::

::: context cover-up Why the cover-up rule works
Write $G = \dfrac{r_1}{s - p_1} + \dfrac{r_2}{s - p_2} + \cdots$. Multiply both sides by $(s - p_1)$. The first term becomes plain $r_1$. Every other term becomes $r_j(s - p_1)/(s - p_j)$, which goes to zero as $s \to p_1$. So $r_1 = \lim_{s\to p_1}(s - p_1)G(s)$. With a pencil, you literally cover the factor $(s - p_1)$ with your thumb and plug $s = p_1$ into what you can still see. The method is often credited to the engineer Oliver Heaviside, who used this kind of operator shortcut long before it was made rigorous.
:::

::: context tuned-absorber The skyscraper trick
Taipei 101, a 508-meter tower, hangs a steel ball of about 660 tonnes near its top. The ball's pendulum is tuned to the building's sway frequency. When wind pushes the building at that frequency, the ball swings against it and the building moves much less. The solar array does the same thing to the hub at $2.000\,\mathrm{rad/s}$: it swings with exactly the right size and timing that its spring force cancels the torque on the hub. Good news for anything mounted on the hub, and bad news for a sensor there, which sees almost nothing.
:::

::: context interlacing Zero, then pole, then zero, then pole
For the hub sensor, walk up the imaginary axis: the rigid-body double pole at $0$, then the zero at $2.000\,\mathrm{rad/s}$, then the pole at $2.121\,\mathrm{rad/s}$. Zeros and poles alternate. Each zero lifts the phase by up to $180^\circ$ before the next pole takes it back, so the phase never slips past the rigid body's $-180^\circ$. The tip sensor loses the zero, so the pole's $180^\circ$ of lag lands with nothing in front of it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="44" font-size="12" fill="#1f2a44">hub</text>
  <text x="10" y="104" font-size="12" fill="#1f2a44">tip</text>
  <line x1="50" y1="40" x2="345" y2="40" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="50" y1="100" x2="345" y2="100" stroke="#6c7a93" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="54" y1="34" x2="66" y2="46"/><line x1="66" y1="34" x2="54" y2="46"/>
    <line x1="54" y1="94" x2="66" y2="106"/><line x1="66" y1="94" x2="54" y2="106"/>
  </g>
  <text x="60" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">×2 at 0</text>
  <circle cx="303.4" cy="40" r="6" fill="#fff" stroke="#1d6fd1" stroke-width="2"/>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="312.2" y1="34" x2="324.2" y2="46"/><line x1="324.2" y1="34" x2="312.2" y2="46"/>
    <line x1="312.2" y1="94" x2="324.2" y2="106"/><line x1="324.2" y1="94" x2="312.2" y2="106"/>
  </g>
  <text x="290" y="24" font-size="11" text-anchor="end" fill="#1d6fd1">zero 2.000</text>
  <text x="330" y="62" font-size="11" text-anchor="end" fill="#b4232c">pole 2.121</text>
  <text x="200" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">tip zero is on the real axis at −200, far off this strip</text>
  <text x="200" y="142" font-size="11" text-anchor="middle" fill="#6c7a93">frequency along the imaginary axis, 0 to 2.3 rad/s, to scale</text>
</svg>
```
:::

::: context washout Why an aircraft yaw damper needs a washout
Many airplanes have a yaw damper: a small loop that feeds the measured yaw rate to the rudder to kill the side-to-side wobble called Dutch roll. But in a steady turn the airplane also has a steady yaw rate. Without a washout, the damper would push the rudder against every turn the pilot asks for. The washout filter $s/(s + a)$ lets the wobble through and blocks the steady turn rate, so the damper fights only the wobble.
:::

::: context resonance-peak The spike the DC gain does not show
The magnitude of $4/(s^2 + 0.4s + 4)$ against frequency, drawn to scale. At zero frequency it is $1$. Near $\omega = 2\,\mathrm{rad/s}$ it climbs to about $5$ — the $1/(2\zeta)$ peak — then falls away. A load sized from the left edge of this picture would be five times too small at the spike.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150.9" x2="345" y2="150.9" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="50" y1="34.5" x2="200" y2="34.5" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.2" points="50.0,150.9 55.8,150.8 61.6,150.6 67.4,150.3 73.2,149.7 79.0,149.0 84.8,148.1 90.6,147.0 96.4,145.5 102.2,143.8 108.0,141.6 113.8,138.8 119.6,135.3 125.4,130.9 131.2,125.0 137.0,117.1 142.8,106.2 145.7,99.1 147.1,95.0 148.6,90.6 150.1,85.8 151.5,80.5 152.9,74.9 154.4,68.8 155.8,62.5 157.3,56.0 158.8,49.7 160.2,43.8 161.6,38.8 163.1,35.4 164.6,33.9 166.0,34.5 167.4,37.4 168.9,42.2 170.4,48.4 171.8,55.5 173.2,63.0 174.7,70.4 176.1,77.6 177.6,84.3 179.1,90.6 180.5,96.4 181.9,101.7 183.4,106.6 184.9,111.0 186.3,115.0 187.8,118.6 189.2,122.0 195.0,132.7 209.5,148.8 224.0,157.4 238.5,162.6 253.0,166.1 267.5,168.6 282.0,170.4 296.5,171.8 311.0,172.9 325.5,173.8 340.0,174.5"/>
  <text x="44" y="155" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="44" y="39" font-size="11" text-anchor="end" fill="#1f2a44">5</text>
  <text x="44" y="184" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <line x1="166" y1="180" x2="166" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="166" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">2</text>
  <line x1="340" y1="180" x2="340" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="340" y="198" font-size="11" text-anchor="middle" fill="#1f2a44">5</text>
  <text x="250" y="198" font-size="11" text-anchor="middle" fill="#6c7a93">ω (rad/s)</text>
  <text x="210" y="40" font-size="11" fill="#b4232c">peak ≈ 1/(2ζ) = 5</text>
  <text x="230" y="143" font-size="11" fill="#1f2a44">DC gain = 1</text>
  <text x="58" y="24" font-size="11" fill="#6c7a93">|G(jω)|</text>
</svg>
```
:::

::: context hidden-modes Controllable and observable, in plain words
A mode is **controllable** from an input if pushing on that input can move it. It is **observable** from an output if watching that output can tell you it is there. A guitar string plucked exactly at its middle does not sound its second harmonic, because that harmonic has a still point (a node) right there: the harmonic is uncontrollable from that spot. It still exists — pluck elsewhere and you hear it. Module 28 on state-space control makes both ideas precise with matrix tests.
:::
