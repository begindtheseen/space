---
id: l02-pid-and-the-filtered-derivative
title: PID, term by term, and the derivative you can actually build
minutes: 18
covers:
  - 'PID control: the physical meaning of each term, ideal vs practical form, derivative filtering'
---

Think about steering a bike toward a line painted on the road. If you are far to the left, you steer right — hard if you are far off, gently if you are close. If you have been drifting left for a while, maybe the road slopes, so you lean on the handlebars a bit more to make up for it. And if you see yourself swinging toward the line fast, you ease off early so you do not shoot past it. Those are the three things anyone can do with an error: react to it **now**, **remember** it, and **anticipate** it. A controller that does exactly those three is a **PID** controller — Proportional, Integral, Derivative.

Something close to PID runs in almost every flight control loop ever built: the rate loops of a launch vehicle, the speed loop of a reaction wheel, the heater loop that holds a propellant tank's temperature, the throttle loop on a landing burn. It survives because each of its three terms has a physical meaning an engineer can argue about with the propulsion team.

That familiarity hides a trap. The textbook controller $k_p + k_i/s + k_d s$ cannot be built, cannot be flown, and does not describe any PID that has ever run in flight software. Its derivative term has a gain that rises without limit, so it amplifies sensor noise forever and reacts infinitely hard to a sudden step. Every real PID replaces $k_d s$ with a **filtered derivative**, and the filter changes the loop's phase right where it matters most. This lesson gives the three terms their meaning, sets out the three ways PID is written in different documents, and then works out exactly what the filter costs.

Two plants are used throughout. The first is the rate channel from the last lesson, $G_\omega(s) = 1/\bigl(J s(\tau s + 1)\bigr)$ with $J = 1200\ \mathrm{kg\,m^2}$ and $\tau = 0.02\ \mathrm{s}$. The second is the **attitude channel** of the same vehicle, $G_\theta(s) = 1/(J s^2)$ — a rigid body with a torque in and an angle $\theta$ ("theta") out.

## What each term does

### P: a spring

**Proportional** feedback, $u = k_p e$, pushes back in proportion to how far off you are. That is what a [[spring|spring-damper]] does. Apply it to the attitude plant, where the error is $-\theta$, and Newton's law for turning becomes $J\ddot\theta = -k_p\theta$. (The two dots mean "second derivative with respect to time" — angular acceleration.) That is the equation of a weight bouncing on a spring, with natural frequency $\omega_n = \sqrt{k_p/J}$.

So proportional gain is **stiffness**, in newton-meters per radian, and it sets how fast the loop is. It responds to the error that exists now and to nothing else. That is why, on its own, it leaves a steady error against a constant disturbance (the last lesson's $d_i/k_p$), and gives no damping at all on a rigid body.

### I: memory

**Integral** feedback, $u = k_i\int e\,dt$, adds up the error over time. Its output keeps changing as long as any error is left. So whatever constant disturbance the plant faces, the integrator hunts down the constant command that cancels it, and holds it there. That is the entire meaning of "integral action removes steady-state error".

The cost shows up in the frequency domain. $k_i/s$ contributes $-90^\circ$ of phase at every frequency and adds a **pole at the origin** (a factor $1/s$). An integrator therefore always makes a loop less stable, and slower to recover from a jolt, than the same loop without one.

### D: anticipation

**Derivative** feedback, $u = k_d\dot e$, reacts to how fast the error is changing. Write the proportional-plus-derivative command as

$$
k_p\bigl(e + T_d\dot e\bigr), \qquad T_d = \frac{k_d}{k_p}.
$$

The bracket is a straight-line forecast of the error $T_d$ seconds ahead: today's value plus today's slope times the time. So the controller acts on where the error is *going*, not where it is. $T_d$ is called the **derivative time**.

On the attitude plant this is physically a **damper**, like a shock absorber. The term is proportional to $\dot\theta$, the turn rate — exactly what a rate gyro measures. It supplies the $2\zeta\omega_n s$ term of a damped oscillator that proportional feedback cannot. ($\zeta$, "zeta", is the damping ratio.) In frequency terms $k_d s$ contributes $+90^\circ$ of phase, and phase lead near crossover is the currency of stability.

::: key
What each PID term physically does. **P**: stiffness, responds to present error; sets loop bandwidth, leaves steady-state error. **I**: removes steady-state error to constant disturbances, adds a pole at the origin and $90^\circ$ of lag. **D**: damping, predicts error $T_d = k_d/k_p$ seconds ahead, adds phase lead but amplifies noise.
:::

::: example PD on the attitude channel: stiffness and damping, sized
Close the attitude loop with $u = -(k_p\theta + k_d\dot\theta)$. Put it into $J\ddot\theta = u$ and take Laplace transforms: the closed-loop characteristic equation is

$$
J s^2 + k_d s + k_p = 0 .
$$

Divide by $J$ and match it with the standard damped oscillator $s^2 + 2\zeta\omega_n s + \omega_n^2$. Matching term by term gives $k_p = J\omega_n^2$ and $k_d = 2\zeta\omega_n J$.

**Pick the numbers.** Take $\omega_n = 2\ \mathrm{rad/s}$ and $\zeta = 0.7$:

$$
k_p = 1200 \times 2^2 = 4800\ \mathrm{N\,m/rad}, \qquad
k_d = 2\times0.7\times2\times1200 = 3360\ \mathrm{N\,m\,s/rad}.
$$

The [[overshoot|overshoot-formula]] to a step is $\exp\bigl(-\pi\zeta/\sqrt{1-\zeta^2}\bigr) = \exp(-3.08) = 4.6\%$, and the forecast horizon is $T_d = 3360/4800 = 0.70\ \mathrm{s}$.

**Now drop the derivative term.** The characteristic equation becomes $Js^2 + k_p = 0$, with roots $s = \pm j\sqrt{k_p/J} = \pm 2j$. The vehicle swings back and forth at $2\ \mathrm{rad/s}$ — a period of $2\pi/2 = 3.14\ \mathrm{s}$ — and never settles. Every gust adds energy and nothing takes it away. On a rigid body the derivative term is not a refinement: without it there is no damping in the loop at all.
:::

## Three forms, and why the difference matters

The same controller gets written three ways. A gain copied from one document into code that expects another form is a real and recurring failure, so learn to recognize all three.

**Parallel (ideal) form** keeps the three gains separate:

$$
C(s) = k_p + \frac{k_i}{s} + k_d s .
$$

**Standard ([[ISA|isa-form]]) form** pulls $k_p$ out front and turns the other two gains into times:

$$
C(s) = k_p\left(1 + \frac{1}{T_i s} + T_d s\right),
\qquad T_i = \frac{k_p}{k_i}, \quad T_d = \frac{k_d}{k_p} .
$$

$T_i$ is the **integral time**. Hold the error constant: after $T_i$ seconds, the integral term has built up as much output as the proportional term gives. $T_d$ is the derivative time from above. Both are in seconds, which makes them easier to compare with a vehicle's own time constants than raw gains are.

**Series (interacting) form** is what older hardware built and what some tuning rules assume:

$$
C(s) = k_c\left(1 + \frac{1}{T_i' s}\right)\bigl(1 + T_d' s\bigr).
$$

(The primes, read "T i prime", mark the series-form versions.) Multiplying it out and matching it with the standard form gives

$$
T_i = T_i' + T_d', \qquad T_d = \frac{T_i'T_d'}{T_i' + T_d'}, \qquad k_p = k_c\,\frac{T_i' + T_d'}{T_i'} .
$$

Going the other way — from standard to series — you have to solve a quadratic, and its roots are real only when $T_i \ge 4T_d$. A parallel PID with $T_i < 4T_d$ has complex zeros and no series form at all. The classic [[Ziegler–Nichols|ziegler-nichols]] PID settings sit exactly on that boundary, $T_i = 4T_d$, so their series form has a double zero.

::: note Why the conversion works
Multiply out the series form:

$$
k_c\left(1 + \frac{1}{T_i' s}\right)\bigl(1 + T_d' s\bigr)
= k_c\left(1 + \frac{T_d'}{T_i'} + \frac{1}{T_i' s} + T_d' s\right).
$$

Pull the constant part, $k_c\,(T_i' + T_d')/T_i'$, out front. That is $k_p$. What is left inside the bracket is

$$
1 + \frac{1}{(T_i' + T_d')\,s} + \frac{T_i' T_d'}{T_i' + T_d'}\,s,
$$

which is the standard form with $T_i = T_i' + T_d'$ and $T_d = T_i'T_d'/(T_i' + T_d')$. Going back, $T_i'$ and $T_d'$ have sum $T_i$ and product $T_iT_d$, so they are the roots of $x^2 - T_i x + T_iT_d = 0$. Those roots are real only when $T_i^2 \ge 4T_iT_d$, that is, $T_i \ge 4T_d$.
:::

::: warning Check the form before you type a gain
"$k_d$" in one tool and "$T_d$" in another differ by a factor of $k_p$. A series-form $k_c$ differs from a parallel $k_p$ by $(T_i' + T_d')/T_i'$, a factor between 1 and 2 when the series form exists — exactly 2 at the Ziegler–Nichols settings. Before you type a gain into flight software, confirm which of the three forms the source used, and whether its derivative acts on the error or on the measurement.
:::

## The derivative you cannot build

$k_d s$ is **[[improper|improper]]**: the power of $s$ on top is bigger than the power on the bottom. So its gain, $|k_d\,j\omega| = k_d\omega$, grows without limit as frequency rises — [[20 dB per decade|twenty-db-decade]], forever. Three consequences follow, and all three are fatal in hardware.

**It cannot be realized.** No physical device, and no finite set of state equations, has a gain that grows forever. A pure differentiator is improper, and an improper system is not one you can build — in sampled code it would need the next sample before it arrives. Any digital version quietly replaces it with a difference of samples, which is a filter whether you chose one or not.

**It amplifies sensor noise without limit.** Gyro and encoder noise is broadband — spread over all frequencies. Multiply it by a gain that rises 20 dB per decade and the loudest thing the actuator ever sees is the top of the noise band. For the attitude loop above, $k_d s$ has a gain of $3360 \times 100 = 3.36\times10^5\ \mathrm{N\,m/rad}$ at $100\ \mathrm{rad/s}$, and more above that.

**It hooks the loop onto dynamics the model does not contain.** Structural bending modes, actuator resonances and sampling effects all live at high frequency. An unlimited high-frequency gain guarantees the loop is closed around them.

The fix is one first-order pole on the derivative term:

$$
C(s) = k_p + \frac{k_i}{s} + \frac{k_d N s}{s + N} .
$$

Look at the new term at low and high frequency. When $\omega \ll N$, the $s$ in $s + N$ is small next to $N$, so the term is about $k_d N s/N = k_d s$ — a derivative. When $\omega \gg N$, the $N$ is small next to $s$, so the term is about $k_d N s/s = k_d N$ — a [[constant gain|filter-picture]]. So the whole controller's high-frequency gain is bounded by $k_p + k_d N$. The price is phase: the term's phase is $90^\circ - \arctan(\omega/N)$, so the lead it was bought for is given back, bit by bit, as $\omega$ approaches $N$.

::: key
Practical (filtered-derivative) PID: $C(s) = k_p + k_i/s + k_d N s/(s + N)$, with $N \sim 10\text{--}20$. The filter makes the controller proper and bounds high-frequency gain at $k_p + k_d N$.
:::

::: warning Two different things called N
In the parallel form above, $N$ is a frequency in rad/s and the filter pole sits at $N$. In the ISA form the same filter is written $T_d s/\bigl(1 + (T_d/N)s\bigr)$ with $N$ a pure number, and the pole sits at $N/T_d$ rad/s. The algebra is the same — both are $k_d N' s/(s + N')$ for some pole $N'$ — but the number means something different. Check which one a specification means before you choose $N = 15$.
:::

::: example What the filter costs the attitude loop
Take the PD loop above, $k_p = 4800$, $k_d = 3360$, $J = 1200$, and replace $k_d s$ with $k_d N s/(s+N)$. For each $N$, compute the loop's crossover and phase margin numerically. For the noise column, feed in $0.01^\circ = 1.75\times10^{-4}\ \mathrm{rad}$ rms of angle noise and multiply by the high-frequency gain: for $N = 5$, $21\,600 \times 1.75\times10^{-4} = 3.8\ \mathrm{N\,m}$.

| $N$ (rad/s) | $\omega_{gc}$ (rad/s) | phase margin | HF gain $k_p + k_dN$ | torque from $0.01^\circ$ rms noise |
| --- | --- | --- | --- | --- |
| 5 | 3.21 | 38.2° | 21 600 | 3.8 N·m |
| 10 | 3.26 | 51.0° | 38 400 | 6.7 N·m |
| 20 | 3.21 | 58.3° | 72 000 | 12.6 N·m |
| 100 | 3.12 | 63.9° | 340 800 | 59.5 N·m |
| ideal $k_ds$ | 3.09 | 65.2° | unbounded | unbounded |

**Read the columns.** Crossover barely moves. The phase margin moves a great deal. At $N = 10\ \mathrm{rad/s}$, about three times the $3.26\ \mathrm{rad/s}$ crossover, the filter has given back $65.2 - 51.0 = 14.2^\circ$ of the derivative's lead. At $N = 5$ it has given back $27^\circ$, and the loop is no longer one you would fly. Meanwhile each doubling of $N$ roughly doubles the torque the actuator is asked for in response to pure sensor noise.

**There is no correct answer, only a trade.** Put the filter pole three to ten times above crossover, then check that the noise-driven torque is a small fraction of the authority you have. Here $N = 20$ costs $6.8^\circ$ and asks for $12.6\ \mathrm{N\,m}$ of noise chatter. On a vehicle with a 500 N·m gimbal that is comfortable. On one with a 0.2 N·m reaction wheel it is not.
:::

## The practical PID on the rate channel

The rate loop of the last lesson used PI alone: $k_p = 12\,000\ \mathrm{N\,m\,s/rad}$ and $k_i = 24\,000\ \mathrm{N\,m/rad}$, so $T_i = 12\,000/24\,000 = 0.5\ \mathrm{s}$. It crossed over at $10.0\ \mathrm{rad/s}$ with $67.4^\circ$ of phase margin.

Now add a filtered derivative: $k_d = 600\ \mathrm{N\,m\,s^2/rad}$ (so $T_d = 600/12\,000 = 0.05\ \mathrm{s}$) with $N = 15\ \mathrm{rad/s}$. Crossover moves up to $12.95\ \mathrm{rad/s}$ and the phase margin to $84.8^\circ$. The controller's high-frequency gain is bounded at $12\,000 + 600\times15 = 21\,000$.

An $85^\circ$ phase margin is not a better loop than a $67^\circ$ one. It is a loop being held back: all that lead could buy more speed instead, and the next lessons spend it on purpose. The reason to notice it now is what it tells you — the derivative term is doing real work, even on a plant this gentle.

```python
import numpy as np

kp, ki, kd, N, J, tau = 12000.0, 24000.0, 600.0, 15.0, 1200.0, 0.02
num = np.array([kp + kd * N, kp * N + ki, ki * N])
den = np.convolve([1.0, N, 0.0], [J * tau, J, 0.0])
w = np.logspace(-2, 4, 600001)
L = np.polyval(num, 1j * w) / np.polyval(den, 1j * w)
i = np.argmin(abs(abs(L) - 1.0))
print(round(w[i], 3), round(180 + np.degrees(np.angle(L[i])), 2))
# 12.952 84.79
```

::: note Take the derivative of the measurement, not the error
Almost every flight PID differentiates the *measurement*, not the error:

$$
u = k_p e + k_i\!\int\! e\,dt - k_d\,\dot y_f ,
$$

where $y_f$ is the filtered measurement. A step in the command then causes no spike from the derivative — no [[derivative kick|derivative-kick]] — while the damping is unchanged, because when the setpoint is constant, $\dot e = -\dot y$. This is the simplest case of setpoint weighting. The next lesson treats the general version, along with the other things that go wrong between a clean controller and flight code.
:::

## Check yourself

::: check
A reaction wheel holds one axis of a spacecraft with $J = 900\ \mathrm{kg\,m^2}$. You want a PD attitude loop with $\omega_n = 0.5\ \mathrm{rad/s}$ and $\zeta = 0.8$. Find $k_p$, $k_d$, $T_d$ and the overshoot.
:::

::: answer
Stiffness: $k_p = J\omega_n^2 = 900 \times 0.25 = 225\ \mathrm{N\,m/rad}$. Damping: $k_d = 2\zeta\omega_n J = 2\times0.8\times0.5\times900 = 720\ \mathrm{N\,m\,s/rad}$. The derivative time is $T_d = k_d/k_p = 720/225 = 3.2\ \mathrm{s}$: the controller acts on the error it forecasts 3.2 s ahead. That sounds long, but it suits a loop whose own period is $2\pi/0.5 = 12.6\ \mathrm{s}$. Overshoot is $\exp\bigl(-\pi\times0.8/\sqrt{1-0.64}\bigr) = \exp(-4.189) = 1.5\%$ — small, as it should be with damping this high.
:::

::: check
Why does adding integral action always cut the phase margin of a loop whose other gains stay the same, and what does that mean for the crossover frequency you can reach?
:::

::: answer
The term $k_i/s$ has phase $-90^\circ$ at every frequency, so the pair $k_p + k_i/s$ has phase $-\arctan\bigl(k_i/(k_p\omega)\bigr)$. That is negative everywhere and tends to $-90^\circ$ as $\omega \to 0$. Adding it takes phase away at crossover, so the phase margin falls unless something else changes. How much depends on how far the integral corner $1/T_i$ sits below crossover: at $\omega T_i = 10$ the lag is $\arctan(0.1) = 5.7^\circ$; at $\omega T_i = 2$ it is $\arctan(0.5) = 26.6^\circ$. To keep a target phase margin you either put $1/T_i$ well below crossover, accepting slower disturbance rejection, or buy the phase back with derivative action.
:::

::: check
A PID is given in standard form with $k_p = 50$, $T_i = 2\ \mathrm{s}$, $T_d = 0.4\ \mathrm{s}$. Give the parallel gains, and find the series-form parameters if they exist.
:::

::: answer
Parallel: $k_i = k_p/T_i = 50/2 = 25$ and $k_d = k_pT_d = 50 \times 0.4 = 20$.

Series: we need $T_i' + T_d' = T_i = 2$ and $T_i'T_d'/(T_i'+T_d') = T_d = 0.4$, so $T_i'T_d' = 0.4 \times 2 = 0.8$. Two numbers with sum 2 and product 0.8 are the roots of $x^2 - 2x + 0.8 = 0$: $x = 1 \pm \sqrt{0.2} = 1.447$ and $0.553$. The condition $T_i \ge 4T_d$ holds ($2 \ge 1.6$), so the roots are real: $T_i' = 1.447\ \mathrm{s}$, $T_d' = 0.553\ \mathrm{s}$, and $k_c = k_pT_i'/(T_i'+T_d') = 50\times1.447/2 = 36.2$. Had $T_d$ been $0.6\ \mathrm{s}$, then $T_i = 2 < 4T_d = 2.4$: the quadratic would have complex roots and no series form would exist.
:::

::: check
An engineer raises $N$ from 10 rad/s to 100 rad/s to "get a cleaner derivative", leaving every gain alone. What gets better, what gets worse, and what stays about the same?
:::

::: answer
The phase margin gets better, because the filter's lag at crossover falls from $\arctan(\omega_{gc}/10)$ to $\arctan(\omega_{gc}/100)$ — for the attitude example, from $51.0^\circ$ to $63.9^\circ$ of phase margin. What gets worse is everything above the old corner. The controller's high-frequency gain rises from $k_p + 10k_d$ to $k_p + 100k_d$ — from $38\,400$ to $340\,800$, nearly 9 times. Noise-driven actuator torque rises by the same factor, and any unmodeled resonance up there now sits inside a loop with nine times the gain. Crossover barely moves, from 3.26 to 3.12 rad/s, because the filter hardly changes the magnitude near crossover. It is a straight trade of high-frequency gain for phase, and whether it is a good one depends on what lives up there.
:::

::: check
The attitude loop's derivative is coded as a backward difference of the measured angle, $\bigl(\theta_k - \theta_{k-1}\bigr)/h$, at $h = 0.01\ \mathrm{s}$, with no explicit filter. Is the derivative unfiltered?
:::

::: answer
No. A backward difference has frequency response $\bigl(1 - e^{-j\omega h}\bigr)/h$, whose size is $\bigl|2\sin(\omega h/2)\bigr|/h$. For small $\omega h$, $\sin(\omega h/2) \approx \omega h/2$, so this matches $\omega$ at low frequency. But its gain tops out at $2/h = 200\ \mathrm{s^{-1}}$, reached at the [[Nyquist frequency|nyquist-frequency]] $\pi/h = 314\ \mathrm{rad/s}$, instead of growing forever. So the difference is a filter chosen by the sample rate, not by the designer, with its corner near the Nyquist frequency. That is far too high to protect the actuator from noise, and it moves whenever somebody changes the sample rate. That is the usual case for an explicit filter: not that the hidden one does not exist, but that it is in the wrong place.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| P term | stiffness; $k_p = J\omega_n^2$ for the attitude plant; leaves steady-state error |
| I term | memory; removes steady-state error; adds a pole at the origin and $90^\circ$ lag |
| D term | damping and forecast $T_d$ seconds ahead; $+90^\circ$ phase; amplifies noise |
| Parallel form | $C = k_p + k_i/s + k_d s$ |
| Standard (ISA) form | $C = k_p\bigl(1 + 1/(T_is) + T_ds\bigr)$, $T_i = k_p/k_i$, $T_d = k_d/k_p$ |
| Series form | $k_c(1 + 1/(T_i's))(1 + T_d's)$; $T_i = T_i'+T_d'$, $T_d = T_i'T_d'/(T_i'+T_d')$; real only if $T_i \ge 4T_d$ |
| Practical PID | $C = k_p + k_i/s + k_dNs/(s+N)$, $N \sim 10\text{--}20$ |
| High-frequency gain | bounded at $k_p + k_dN$ |
| Filter phase penalty | derivative term's phase is $90^\circ - \arctan(\omega/N)$ |
| Attitude example | $k_p = 4800$, $k_d = 3360$; $\omega_n = 2\ \mathrm{rad/s}$, $\zeta = 0.7$, 4.6% overshoot |
| Rate example | $k_p = 12\,000$, $k_i = 24\,000$, $k_d = 600$, $N = 15$: $\omega_{gc} = 12.95\ \mathrm{rad/s}$, PM $84.8^\circ$ |

The next lesson takes this controller to the actuator's limits, where the integrator stops helping and starts causing the very overshoot it was meant to prevent.

::: context spring-damper P is a spring, D is a damper
Picture the vehicle as a heavy block tied to a wall. The proportional term is a spring: the farther the block is from where it should be, the harder the spring pulls it back. The derivative term is a damper, like the shock absorber on a car: it pushes against motion, harder the faster the block moves.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="12" height="110" fill="#6c7a93"/>
  <polyline points="32,50 70,50 80,38 96,62 112,38 128,62 144,38 160,62 176,38 186,50 230,50" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="32" y1="100" x2="110" y2="100" stroke="#b4232c" stroke-width="2.5"/>
  <polyline points="110,86 110,114" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <polyline points="96,82 150,82 150,118 96,118" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="150" y1="100" x2="230" y2="100" stroke="#b4232c" stroke-width="2.5"/>
  <rect x="230" y="30" width="80" height="90" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="270" y="72" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">J</text>
  <text x="270" y="90" font-size="11" text-anchor="middle" fill="#1f2a44">inertia</text>
  <text x="128" y="28" font-size="12" text-anchor="middle" fill="#1d6fd1">P: spring, stiffness k_p</text>
  <text x="128" y="140" font-size="12" text-anchor="middle" fill="#b4232c">D: damper, k_d</text>
  <line x1="318" y1="75" x2="348" y2="75" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="348,75 340,71 340,79" fill="#1f2a44"/>
  <text x="333" y="66" font-size="11" text-anchor="middle" fill="#1f2a44">θ</text>
</svg>
```

A spring alone makes the block bounce forever. The damper is what lets it settle. That is exactly what the example shows when the derivative term is dropped.
:::

::: context overshoot-formula Where the overshoot formula comes from
A damped second-order system, stepped, rings with a decaying wave. Its first peak comes half a ringing period after the start, and by then the decay has shrunk the swing by the factor $e^{-\pi\zeta/\sqrt{1-\zeta^2}}$. That factor is the overshoot. It depends only on $\zeta$: $0.7$ gives about 4.6%, $0.5$ about 16%, $0.8$ about 1.5%. You met it in the signals and systems module; here it turns a damping choice into a gain choice.
:::

::: context isa-form Why it is called ISA form
ISA is the International Society of Automation, which began in 1945 as the Instrument Society of America. It writes standards for process control — chemical plants, refineries, power stations — where PID controllers first became everyday hardware. In that world the integral and derivative settings have long been dialed in as times (or as "repeats per minute"), not as raw gains. The standard form writes PID the same way, which is how it came to carry the society's name.
:::

::: context ziegler-nichols A tuning rule from 1942
John Ziegler and Nathaniel Nichols, engineers at the Taylor Instrument Companies, published a famous set of PID tuning rules in 1942. One version asks you to turn up the proportional gain until the loop oscillates steadily, then set all three terms from that gain and the oscillation's period. It needs no model at all. Lesson 4 of this module uses it, compares it with model-based methods, and shows why its settings are rarely flown as-is.
:::

::: context improper Proper and improper
Write a transfer function as a fraction of two polynomials in $s$. If the top's highest power is no bigger than the bottom's, it is **proper**: at very high frequency its gain levels off or falls. If the top wins, it is **improper**, and its gain climbs forever. Every real device — a motor, a circuit, a structure — eventually stops responding when you shake it fast enough, so every real device is proper. $k_d s$ has $s^1$ on top and $s^0$ below: improper.
:::

::: context twenty-db-decade Twenty decibels per decade
A **decade** is a factor of ten in frequency: 1 to 10 rad/s, or 10 to 100. A gain proportional to $\omega$ gets ten times bigger across each decade, and ten times is $20\ \mathrm{dB}$. So on a Bode plot, a pure derivative is a straight line climbing $20\ \mathrm{dB}$ per decade with no end. A pure integrator is the mirror image, falling $20\ \mathrm{dB}$ per decade.
:::

::: context filter-picture Filtered and unfiltered, side by side
Here are the two derivative terms from the attitude example, with $k_d = 3360$ and the filter pole at $N = 20\ \mathrm{rad/s}$. Below the pole they are the same line. Above it, the ideal one keeps climbing, while the filtered one levels off at $k_d N = 67\,200$, about $96.5\ \mathrm{dB}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="50" y="16" width="290" height="134" fill="#fff" stroke="#6c7a93"/>
  <text x="46" y="144.4" font-size="11" text-anchor="end" fill="#1f2a44">70</text>
  <text x="46" y="106.1" font-size="11" text-anchor="end" fill="#1f2a44">90</text>
  <text x="46" y="67.9" font-size="11" text-anchor="end" fill="#1f2a44">110</text>
  <text x="46" y="29.6" font-size="11" text-anchor="end" fill="#1f2a44">130</text>
  <text x="50.0" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="146.7" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">10</text>
  <text x="243.3" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">100</text>
  <text x="340.0" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">1000</text>
  <text x="195.0" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">frequency ω (rad/s)</text>
  <text x="8" y="12" font-size="11" fill="#1f2a44">gain, dB</text>
  <polyline points="50.0,139.4 53.7,138.0 57.3,136.5 61.0,135.1 64.7,133.6 68.4,132.2 72.0,130.7 75.7,129.2 79.4,127.8 83.0,126.3 86.7,124.9 90.4,123.4 94.1,122.0 97.7,120.5 101.4,119.1 105.1,117.6 108.7,116.2 112.4,114.7 116.1,113.3 119.7,111.8 123.4,110.3 127.1,108.9 130.8,107.4 134.4,106.0 138.1,104.5 141.8,103.1 145.4,101.6 149.1,100.2 152.8,98.7 156.5,97.3 160.1,95.8 163.8,94.3 167.5,92.9 171.1,91.4 174.8,90.0 178.5,88.5 182.2,87.1 185.8,85.6 189.5,84.2 193.2,82.7 196.8,81.3 200.5,79.8 204.2,78.4 207.8,76.9 211.5,75.4 215.2,74.0 218.9,72.5 222.5,71.1 226.2,69.6 229.9,68.2 233.5,66.7 237.2,65.3 240.9,63.8 244.6,62.4 248.2,60.9 251.9,59.5 255.6,58.0 259.2,56.5 262.9,55.1 266.6,53.6 270.3,52.2 273.9,50.7 277.6,49.3 281.3,47.8 284.9,46.4 288.6,44.9 292.3,43.5 295.9,42.0 299.6,40.6 303.3,39.1 307.0,37.6 310.6,36.2 314.3,34.7 318.0,33.3 321.6,31.8 325.3,30.4 329.0,28.9 332.7,27.5 336.3,26.0 340.0,24.6" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 4"/>
  <polyline points="50.0,139.4 53.7,138.0 57.3,136.5 61.0,135.1 64.7,133.6 68.4,132.2 72.0,130.8 75.7,129.3 79.4,127.9 83.0,126.4 86.7,125.0 90.4,123.6 94.1,122.1 97.7,120.7 101.4,119.3 105.1,117.9 108.7,116.5 112.4,115.1 116.1,113.7 119.7,112.4 123.4,111.0 127.1,109.7 130.8,108.4 134.4,107.1 138.1,105.8 141.8,104.6 145.4,103.4 149.1,102.2 152.8,101.1 156.5,100.0 160.1,99.0 163.8,98.1 167.5,97.2 171.1,96.3 174.8,95.6 178.5,94.9 182.2,94.2 185.8,93.6 189.5,93.1 193.2,92.6 196.8,92.2 200.5,91.8 204.2,91.5 207.8,91.2 211.5,91.0 215.2,90.8 218.9,90.6 222.5,90.5 226.2,90.3 229.9,90.2 233.5,90.1 237.2,90.0 240.9,90.0 244.6,89.9 248.2,89.9 251.9,89.8 255.6,89.8 259.2,89.8 262.9,89.7 266.6,89.7 270.3,89.7 273.9,89.7 277.6,89.7 281.3,89.7 284.9,89.7 288.6,89.6 292.3,89.6 295.9,89.6 299.6,89.6 303.3,89.6 307.0,89.6 310.6,89.6 314.3,89.6 318.0,89.6 321.6,89.6 325.3,89.6 329.0,89.6 332.7,89.6 336.3,89.6 340.0,89.6" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="175.8" y1="16" x2="175.8" y2="150" stroke="#6c7a93" stroke-dasharray="2 3"/>
  <text x="179.8" y="144" font-size="11" fill="#6c7a93">N = 20</text>
  <text x="260.4" y="29.4" font-size="11" text-anchor="end" fill="#b4232c">ideal kd·s, rising forever</text>
  <text x="335.6" y="105.6" font-size="11" text-anchor="end" fill="#1d6fd1">filtered: flat at kd·N</text>
</svg>
```

By $1000\ \mathrm{rad/s}$ the ideal derivative has $34\ \mathrm{dB}$ more gain — about 50 times more noise sent to the actuator.
:::

::: context derivative-kick What a derivative kick looks like
Step the rate loop's command from $0$ to $0.2\ \mathrm{rad/s}$. If the derivative acts on the error, the error jumps, and the filtered derivative leaps by $k_d N \times 0.2 = 600 \times 15 \times 0.2 = 1800\ \mathrm{N\,m}$ on top of the proportional $2400\ \mathrm{N\,m}$. If it acts on the measurement, nothing jumps but the proportional term.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="340" y2="150" stroke="#1f2a44"/>
  <line x1="50" y1="150" x2="50" y2="16" stroke="#1f2a44"/>
  <text x="46" y="154.0" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="46" y="100.4" font-size="11" text-anchor="end" fill="#1f2a44">2000</text>
  <text x="46" y="46.8" font-size="11" text-anchor="end" fill="#1f2a44">4000</text>
  <text x="50.0" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="146.7" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">0.2</text>
  <text x="243.3" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">0.4</text>
  <text x="340.0" y="165" font-size="11" text-anchor="middle" fill="#1f2a44">0.6</text>
  <text x="195.0" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">time after the rate step (s)</text>
  <text x="8" y="12" font-size="11" fill="#1f2a44">torque command, N·m</text>
  <polyline points="50,150.0 50.0,37.4 50.2,37.7 50.4,37.9 50.6,38.2 50.8,38.5 51.0,38.8 51.2,39.1 51.4,39.4 51.5,39.8 51.7,40.1 51.9,40.5 52.1,40.8 52.3,41.2 52.5,41.6 52.7,42.0 52.9,42.4 53.1,42.8 53.3,43.2 53.5,43.7 53.7,44.1 53.9,44.6 54.1,45.0 54.3,45.5 54.4,45.9 54.6,46.4 54.8,46.9 55.0,47.4 55.2,47.9 55.4,48.4 55.6,48.9 55.8,49.4 56.0,49.9 56.2,50.5 56.4,51.0 56.6,51.5 56.8,52.1 57.0,52.6 57.2,53.1 57.3,53.7 57.5,54.2 57.7,54.8 57.9,55.4 58.1,55.9 58.3,56.5 58.5,57.1 58.7,57.6 58.9,58.2 59.1,58.8 59.3,59.4 59.5,59.9 59.7,60.5 62.6,69.4 65.5,78.1 68.4,86.6 71.3,94.4 74.2,101.6 77.1,108.1 80.0,113.8 82.9,118.8 85.8,123.1 88.7,126.8 91.6,129.9 94.5,132.5 97.4,134.7 100.3,136.4 103.2,137.9 106.1,139.1 109.0,140.0 111.9,140.8 114.8,141.4 117.7,141.9 120.6,142.3 123.5,142.6 126.4,142.9 129.3,143.1 132.2,143.3 135.1,143.5 138.0,143.7 140.9,143.9 143.8,144.0 146.7,144.2 149.6,144.3 152.5,144.5 155.4,144.7 158.3,144.8 161.2,145.0 164.1,145.1 167.0,145.3 169.9,145.5 172.8,145.6 175.7,145.8 178.6,145.9 181.5,146.1 184.4,146.3 187.3,146.4 190.2,146.6 193.1,146.7 196.0,146.8 198.9,147.0 201.8,147.1 204.7,147.3 207.6,147.4 210.5,147.5 213.4,147.6 216.3,147.8 219.2,147.9 222.1,148.0 225.0,148.1 227.9,148.2 230.8,148.3 233.7,148.4 236.6,148.5 239.5,148.6 242.4,148.7 245.3,148.8 248.2,148.9 251.1,148.9 254.0,149.0 256.9,149.1 259.8,149.2 262.7,149.2 265.6,149.3 268.5,149.4 271.4,149.5 274.3,149.5 277.2,149.6 280.1,149.6 283.0,149.7 285.9,149.7 288.8,149.8 291.7,149.9 294.6,149.9 297.5,149.9 300.4,150.0 303.3,150.0 306.2,150.1 309.1,150.1 312.0,150.2 314.9,150.2 317.8,150.2 320.7,150.3 323.6,150.3 326.5,150.3 329.4,150.4 332.3,150.4 335.2,150.4 338.1,150.5 340.0,150.5" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polyline points="50,150.0 50.0,85.7 50.2,85.6 50.4,85.6 50.6,85.6 50.8,85.5 51.0,85.5 51.2,85.5 51.4,85.5 51.5,85.5 51.7,85.6 51.9,85.6 52.1,85.6 52.3,85.7 52.5,85.7 52.7,85.8 52.9,85.8 53.1,85.9 53.3,86.0 53.5,86.0 53.7,86.1 53.9,86.2 54.1,86.3 54.3,86.4 54.4,86.5 54.6,86.6 54.8,86.8 55.0,86.9 55.2,87.0 55.4,87.1 55.6,87.3 55.8,87.4 56.0,87.6 56.2,87.7 56.4,87.9 56.6,88.0 56.8,88.2 57.0,88.4 57.2,88.5 57.3,88.7 57.5,88.9 57.7,89.0 57.9,89.2 58.1,89.4 58.3,89.6 58.5,89.8 58.7,90.0 58.9,90.2 59.1,90.4 59.3,90.6 59.5,90.8 59.7,91.0 62.6,94.4 65.5,98.0 68.4,101.6 71.3,105.3 74.2,108.7 77.1,112.0 80.0,114.9 82.9,117.7 85.8,120.1 88.7,122.3 91.6,124.2 94.5,125.9 97.4,127.4 100.3,128.8 103.2,129.9 106.1,131.0 109.0,131.9 111.9,132.7 114.8,133.4 117.7,134.0 120.6,134.6 123.5,135.2 126.4,135.7 129.3,136.2 132.2,136.6 135.1,137.0 138.0,137.4 140.9,137.8 143.8,138.2 146.7,138.6 149.6,138.9 152.5,139.3 155.4,139.6 158.3,140.0 161.2,140.3 164.1,140.6 167.0,141.0 169.9,141.3 172.8,141.6 175.7,141.9 178.6,142.2 181.5,142.5 184.4,142.7 187.3,143.0 190.2,143.3 193.1,143.5 196.0,143.8 198.9,144.0 201.8,144.3 204.7,144.5 207.6,144.8 210.5,145.0 213.4,145.2 216.3,145.4 219.2,145.6 222.1,145.8 225.0,146.0 227.9,146.2 230.8,146.4 233.7,146.6 236.6,146.7 239.5,146.9 242.4,147.1 245.3,147.2 248.2,147.4 251.1,147.5 254.0,147.7 256.9,147.8 259.8,148.0 262.7,148.1 265.6,148.2 268.5,148.3 271.4,148.5 274.3,148.6 277.2,148.7 280.1,148.8 283.0,148.9 285.9,149.0 288.8,149.1 291.7,149.2 294.6,149.3 297.5,149.4 300.4,149.5 303.3,149.6 306.2,149.6 309.1,149.7 312.0,149.8 314.9,149.9 317.8,149.9 320.7,150.0 323.6,150.1 326.5,150.1 329.4,150.2 332.3,150.2 335.2,150.3 338.1,150.3 340.0,150.4" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <text x="64.5" y="34.8" font-size="11" fill="#b4232c">D on the error: 4200 kick</text>
  <text x="108.0" y="77.6" font-size="11" fill="#1d6fd1">D on the measurement: 2400</text>
</svg>
```

The kick lasts only a fraction of a second, but it is a torque spike on real hardware at every command change. (This picture ignores the actuator's limit; the next lesson adds it.)
:::

::: context nyquist-frequency The fastest wiggle a computer can see
A computer that samples every $h$ seconds cannot see anything that wiggles faster than one full cycle per two samples. That limit, $\pi/h$ rad/s, is the **Nyquist frequency** — $314\ \mathrm{rad/s}$ for $h = 0.01\ \mathrm{s}$. Faster signals do not vanish; they masquerade as slower ones. The digital control module that follows this one is largely about living with that limit.
:::
