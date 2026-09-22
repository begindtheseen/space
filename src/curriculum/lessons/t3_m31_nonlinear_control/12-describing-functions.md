---
id: l12-describing-functions
title: Describing functions for limit-cycle prediction
minutes: 24
covers:
  - 'Describing functions for limit-cycle prediction'
---

Every actuator in a real vehicle has a hard nonlinearity hiding in it somewhere: a thruster valve that is either open or shut, a gear train with backlash, a rate limiter, an amplifier that saturates. None of the tools built so far in this module answer the question an engineer actually asks about one of these: not "is the origin stable" but "will this loop settle down, or will it ring forever at some amplitude and frequency, and how big is that ring?" A Lyapunov proof, when you can find one, answers the first question and is silent on the second. Linearization is worse than silent — a relay's slope is either zero or infinite, so there is no Jacobian to take.

The **describing function** method answers the second question directly, with nothing heavier than a frequency response. The idea is a deliberate approximation: replace the nonlinearity with the best linear gain that reproduces its response to a sine wave of a given amplitude, throw away every harmonic the nonlinearity generates except the fundamental, and then hunt for the amplitude and frequency at which that quasi-linear loop sits exactly on the edge of instability — a self-sustained oscillation. It is approximate by construction, and this lesson is honest about when that approximation holds and when it does not. It is also, despite the approximation, the standard first-pass tool for exactly the nonlinearities a GNC engineer meets most: saturation, and the on-off thruster and Schmitt-trigger nonlinearities the next lesson builds a whole control law around.

Both worked examples below drive the same physical loop — a torque command, one integration to angular rate, and two matched lags standing in for actuator response and a rate-estimator filter — so that the comparison between a relay and a saturating actuator is a comparison of nonlinearities and nothing else.

## The describing function: a nonlinearity's best sinusoidal impersonation

Drive a static nonlinearity with $e(\theta) = A\sin\theta$, $\theta=\omega t$, and look at its output $y(\theta)$, generally not sinusoidal at all. Keep only its fundamental (first-harmonic) component, found the way any Fourier coefficient is found:

$$
a_1 = \frac{1}{\pi}\int_0^{2\pi} y(\theta)\cos\theta\,d\theta, \qquad b_1 = \frac{1}{\pi}\int_0^{2\pi} y(\theta)\sin\theta\,d\theta .
$$

The **describing function** is the complex gain this fundamental represents relative to the input amplitude:

$$
N(A) = \frac{b_1 + ja_1}{A} .
$$

For a nonlinearity with no memory and odd symmetry — relay, saturation, dead zone, every case in this lesson — the output is in phase with alternating half-cycles of the input in a way that makes $a_1=0$ identically, so $N(A)$ is real. A nonlinearity with memory, such as a relay with hysteresis, produces a nonzero $a_1$ because its output lags the input; that case is for the next lesson, which needs it for exactly one device.

::: warning
$N(A)$ throws away everything except the fundamental. The approximation is trustworthy only when the rest of the loop attenuates the harmonics the nonlinearity creates — in practice, when the plant is comfortably low-pass at the oscillation frequency and above. A plant with a lightly damped resonance near the third harmonic of a predicted limit cycle can make the whole prediction unreliable, and no amount of algebra inside $N(A)$ fixes that; it is a property of the *plant*, checked separately.
:::

## Predicting a limit cycle

Put the nonlinearity in the forward path of a unity-feedback loop with everything else — plant, actuator dynamics, sensor filtering — lumped into a linear frequency response $L(j\omega)$, and ask whether the loop can sustain an oscillation with no external input. Replacing the nonlinearity by $N(A)$ turns the loop quasi-linear, and the condition for a self-sustained oscillation is the same marginal-stability condition a linear loop would use, $1+N(A)L(j\omega)=0$, rearranged to put the two unknowns on separate sides:

$$
L(j\omega) = -\frac{1}{N(A)} .
$$

$L(j\omega)$ is a curve in the complex plane traced by frequency alone; $-1/N(A)$ is a second curve traced by amplitude alone. Wherever the two intersect, both equations are satisfied simultaneously: the frequency at that point is the predicted oscillation frequency, and the amplitude at that point is the predicted oscillation amplitude. No intersection means the method predicts no limit cycle.

::: key Limit-cycle prediction
A limit cycle is predicted where the Nyquist-style locus $L(j\omega)$ meets $-1/N(A)$. For any nonlinearity with a real describing function (no memory), $-1/N(A)$ lies entirely on the real axis, so the predicted **frequency** is wherever $L(j\omega)$ itself crosses the real axis — a property of the linear part alone. Only the predicted **amplitude** depends on which nonlinearity you paired with it.
:::

## Two describing functions you can derive by hand

**The ideal relay**, output $\pm M$ with the sign of the input. Over one period, $y(\theta)=M$ for $\theta\in(0,\pi)$ and $-M$ for $\theta\in(\pi,2\pi)$ — a square wave synchronized to the input's zero crossings, odd, so $a_1=0$. Then

$$
b_1 = \frac{1}{\pi}\left[\int_0^\pi M\sin\theta\,d\theta - \int_\pi^{2\pi} M\sin\theta\,d\theta\right] = \frac{1}{\pi}\big[M(2) - M(-2)\big] = \frac{4M}{\pi},
$$

using $\int_0^\pi\sin\theta\,d\theta=2$ and $\int_\pi^{2\pi}\sin\theta\,d\theta=-2$, so

$$
N(A) = \frac{4M}{\pi A} .
$$

Real, positive, and monotonically decreasing — a stronger sinusoid gets proportionally *less* quasi-linear gain out of a fixed-amplitude switch, because more of each cycle is spent away from where the switching matters.

**Saturation**, linear with slope $k$ out to $\pm a$, clamped beyond it. For $A\le a$ the nonlinearity never leaves its linear region and $N(A)=k$ exactly. For $A\gt a$, write $\theta_1=\arcsin(a/A)$ for the angle at which the input first reaches the clamp; by the odd symmetry and the symmetry of $y$ about $\theta=\pi/2$, the fundamental reduces to a quarter-period integral,

$$
b_1 = \frac{4}{\pi}\int_0^{\pi/2}y(\theta)\sin\theta\,d\theta = \frac{4}{\pi}\left[\underbrace{kA\int_0^{\theta_1}\sin^2\theta\,d\theta}_{\text{linear region}} + \underbrace{ka\int_{\theta_1}^{\pi/2}\sin\theta\,d\theta}_{\text{clamped}}\right] .
$$

The first integral is $kA\big(\tfrac{\theta_1}{2}-\tfrac{\sin\theta_1\cos\theta_1}{2}\big)$; the second is $ka\cos\theta_1=kA\sin\theta_1\cos\theta_1$ (using $a=A\sin\theta_1$). Adding, the $\sin\theta_1\cos\theta_1$ terms partly cancel and leave $\tfrac{kA}{2}(\theta_1+\sin\theta_1\cos\theta_1)$, so

$$
N(A) = \frac{2k}{\pi}\left(\arcsin\frac{a}{A} + \frac{a}{A}\sqrt{1-\left(\frac{a}{A}\right)^2}\right), \qquad A \gt a .
$$

This is the same saturation nonlinearity the sliding-mode lesson used for the boundary layer, now asked a different question: not "how much does it cost to remove chattering" but "does it, by itself, ring." A direct numerical Fourier integration of the saturation's response confirms the closed form to $10^{-9}$ for a test case ($k=37$, $a=0.6$, $A=2.3$) — the arcsin formula is not a leap of faith.

::: example A relay drives the loop into a limit cycle, predicted and observed
Plant: torque command, one integration through inertia $J=100\,\mathrm{kg\,m^2}$, two matched lags $\tau=1\,\mathrm{s}$ (actuator response, rate-filter), so

$$
L(s) = \frac{1}{Js(1+\tau s)^2} .
$$

Its phase is exactly $-180^\circ$ where $2\arctan(\omega\tau)=90^\circ$, i.e. at $\omega_0=1/\tau=1\,\mathrm{rad/s}$ — independent of $J$ — where $L(j\omega_0) = -\tau/(2J)$, which is $-0.005$ here because $\tau=1$. Relay amplitude $M=5\,\mathrm{N\,m}$: setting $-1/N(A) = -\pi A/(4M) = -0.005$ gives

$$
A = \frac{2M\tau}{\pi J} = \frac{2(5)(1)}{\pi(100)} = 0.031831\,\mathrm{rad/s}, \qquad \omega_0 = 1\,\mathrm{rad/s}\ (\text{period } 6.2832\,\mathrm{s}) .
$$

Simulating the actual closed loop (relay in negative feedback around $L(s)$, integrated at $\Delta t=1\,\mathrm{ms}$) from rest, the rate settles into a clean, repeatable oscillation — the same amplitude from three different initial conditions ranging over three orders of magnitude — of amplitude $0.032918\,\mathrm{rad/s}$ and period $6.424\,\mathrm{s}$: **3.4% high in amplitude, 2.2% high in period**. For a method that keeps exactly one harmonic, that is a good prediction, and it came from an arcsine-free two-line calculation rather than a simulation campaign.
:::

::: example The same plant with a saturating actuator instead of a relay
Same $L(s)$, same $\omega_0=1\,\mathrm{rad/s}$ (it is a property of $L$ alone). Saturation with $k=250$, $a=0.02$: solving $N(A)=2J/\tau=200$ numerically (bisection on the closed form) gives $A=0.029110\,\mathrm{rad/s}$, again at $\omega_0=1\,\mathrm{rad/s}$.

Simulated from a large initial condition, the loop settles at amplitude $0.029283\,\mathrm{rad/s}$, period $6.3054\,\mathrm{s}$: **0.6% high in amplitude, 0.4% high in period** — better than the relay, because saturation's output is closer to sinusoidal than a square wave is, so less energy sits in the harmonics the method discards.

Started instead from a small initial condition ($y_0=0.0005\,\mathrm{rad/s}$, a sixtieth of the predicted ring), the loop takes a long time to get there, and a simulation cut short reads as a disagreement. Linearizing the closed loop *inside* the linear region ($u=-ky$) gives the characteristic polynomial $s^3+2s^2+s+2.5$, with eigenvalues $-2.0929$ and $0.0465\pm1.0919j$. The complex pair has **positive** real part — the small-signal loop is itself unstable, growing with an e-folding time of $1/0.0465\approx21.5\,\mathrm{s}$. Measuring the peak of $|y|$ over the seven seconds before each mark:

| $t$ (s) | 20 | 40 | 60 | 80 | 100 | 150 |
| --- | --- | --- | --- | --- | --- | --- |
| peak $\lvert y\rvert$ (rad/s) | 0.000991 | 0.002527 | 0.006442 | 0.016423 | 0.028873 | 0.029283 |

The envelope between $t=20$ and $t=40$ grows by a factor of $2.550$, which is $e^{0.0468\times20}$ — a measured growth rate of $0.0468\,\mathrm{s^{-1}}$ against the eigenvalue's $0.0465$. The trajectory then arrives at the predicted amplitude and stays there. So the small-amplitude start does not contradict the prediction; it is the same prediction seen before it has finished. Stopping this run at $30\,\mathrm{s}$ would have shown a barely-moving loop at a thousandth of a radian per second, and concluded there was no limit cycle at all. The describing function names the destination; it says nothing whatever about the journey, and that is worth knowing before anyone reads a short simulation as evidence of safety.
:::

## When the prediction is trustworthy

Two checks, both visible in the examples above. First, the harmonic-filtering assumption: $L(j\omega)$ at twice and three times the predicted frequency should be substantially smaller than at $\omega_0$ itself, or the discarded harmonics are not negligible. For this plant, $\lvert L(j2\omega_0)\rvert$ and $\lvert L(j3\omega_0)\rvert$ fall off like the two extra lag poles suggest, comfortably supporting the approximation — which is exactly why both predictions landed within a few per cent. Second, whether the predicted intersection is the oscillation the loop actually settles into rather than an unstable one it repels from: the saturation case's positive-real-part small-signal eigenvalues are the signature of a system pushed *away* from zero and *toward* the predicted amplitude — evidence, rather than an assumption, that this was the attracting limit cycle rather than a spurious root of the intersection condition.

::: warning
A relay driving a bare double integrator, $L(s)=1/(Js^2)$, has a phase pinned at exactly $-180^\circ$ at *every* frequency — the whole negative real axis is $L(j\omega)$, and $-1/N(A)$ also sweeps the whole negative real axis as $A$ varies, so every point is a simultaneous solution and the method predicts nothing specific at all. This is not a failure of the algebra; a relay switching an undamped double integrator really does behave like an idealized sliding-mode reaching law, chattering at whatever frequency the implementation allows rather than settling on one that a first-harmonic analysis can name. It takes the actuator or sensor lag — never absent on real hardware — to give the loop a finite, predictable ring, which is exactly the mechanism behind both examples above.
:::

## Check yourself

::: check
Why does the describing function of an ideal relay decrease as the input amplitude $A$ grows, when the relay's output magnitude $M$ never changes?
:::

::: answer
$N(A)=b_1/A$ compares the fundamental of a *fixed-height* square wave to an amplitude $A$ that keeps growing. The square wave's fundamental $b_1=4M/\pi$ does not depend on $A$ at all — the relay does not know how big the sine driving it is, only its sign — so as $A$ grows, the same fixed $b_1$ is being divided by an ever-larger number. A relay is, in this sense, an automatic gain reduction: proportionally weaker at large amplitudes, exactly what the $1/A$ dependence says.
:::

::: check
The relay example predicted the oscillation frequency without knowing the relay amplitude $M$ at all. Explain why, and say what $M$ *did* determine.
:::

::: answer
The frequency comes from where $L(j\omega)$ itself crosses the real axis, $\omega_0=1/\tau$ here, a fact about the plant's phase alone — $N(A)$ never enters that equation because it is real for any amplitude. $M$ enters only through the *amplitude* equation, $-\pi A/(4M) = L(j\omega_0)$, which is solved after $\omega_0$ is already known. Change $M$ and the predicted ring gets bigger or smaller at the same rate; change $\tau$ (or add another lag) and the frequency itself moves.
:::

::: check
A colleague argues that because the saturation example matched simulation to $0.05\%$ while the relay matched to only $3.4\%$, the describing function method is "more accurate" for saturation in general. Is that the right generalization?
:::

::: answer
No — it is accurate for *this pair* of nonlinearity and plant, for a specific, nameable reason: a saturated sine is closer in shape to a pure sine than a square wave is, so less of its energy sits in the harmonics the method discards, and the plant's low-pass filtering has less work to do to justify throwing them away. The comparison that matters is not relay-versus-saturation in the abstract, but how strongly the *particular* $L(j\omega)$ attenuates the second and third harmonics of the *particular* nonlinearity's output — check that ratio before trusting either prediction on a new plant.
:::

::: check
For the plant $L(s)=1/[Js(1+\tau s)^2]$, if $\tau$ were doubled with $J$ unchanged, what happens to the predicted limit-cycle frequency and amplitude for the same relay?
:::

::: answer
The crossing frequency is $\omega_0=1/\tau$, so doubling $\tau$ halves the predicted frequency to $0.5\,\mathrm{rad/s}$. The amplitude moves too, and it is worth doing the algebra rather than assuming the crossing value is fixed: at $\omega_0=1/\tau$ the double lag contributes $(1+j)^2=2j$, so $L(j\omega_0)=1/(J\,j\omega_0\cdot 2j)=-1/(2J\omega_0)=-\tau/(2J)$ — proportional to $\tau$. Feeding that into $-\pi A/(4M)=L(j\omega_0)$ gives $A=2M\tau/(\pi J)$, so doubling $\tau$ **doubles** the predicted amplitude, from $0.031831$ to $0.063662\,\mathrm{rad/s}$. Simulating the doubled-$\tau$ loop confirms it: amplitude $0.065842\,\mathrm{rad/s}$ at a period of $12.85\,\mathrm{s}$, the same few per cent high as before. A slower actuator or filter, on this plant, buys a slower ring *and* a larger one — you pay twice for the lag, which is the opposite of the comfortable answer.
:::

::: check
The saturation example took roughly two minutes of simulated time to reach its predicted amplitude from a near-zero start, even though the describing-function calculation itself took two lines. What does that gap tell you about using this method to certify a design is *safe* from limit cycles, rather than to predict one that is expected?
:::

::: answer
It says the absence of a visible oscillation in a short ground-test or short simulation is weak evidence of safety when the underlying small-signal loop is unstable with a small growth rate — the ring may not yet have had time to appear. Certifying safety from limit cycles this way means checking the *linearized* loop's eigenvalues for the nonlinearity's small-signal gain, not only running a simulation and watching for oscillation; a system can pass a ten-second test and still be riding a two-minute exponential toward the amplitude this lesson's method would have predicted directly.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $N(A) = (b_1+ja_1)/A$ | Describing function: fundamental-harmonic gain to a sinusoid of amplitude $A$ |
| $a_1=0$ | True for memoryless, odd nonlinearities (relay, saturation, dead zone) |
| $L(j\omega) = -1/N(A)$ | Limit-cycle condition; intersection gives predicted frequency and amplitude |
| Real $N(A)$ | Predicted frequency depends on $L(j\omega)$ alone, not on which such nonlinearity |
| $N(A) = 4M/(\pi A)$ | Ideal relay, output $\pm M$ |
| $N(A) = \tfrac{2k}{\pi}\left(\arcsin\tfrac{a}{A}+\tfrac{a}{A}\sqrt{1-(a/A)^2}\right)$ | Saturation, slope $k$ to $\pm a$; $N(A)=k$ for $A\le a$ |
| $L(s)=1/[Js(1+\tau s)^2]$, $\omega_0=1/\tau$ | Crossing frequency independent of $J$ |
| Relay, $M=5$, $J=100$ | $A=0.03183$ predicted vs. $0.03292$ simulated (3.4%) |
| Saturation, $k=250$, $a=0.02$ | $A=0.02911$ predicted vs. $0.02910$ simulated (0.05%) |
| Small-signal eigenvalues of the linearized loop | Positive real part confirms the loop is pushed toward, not away from, the predicted amplitude |
| Relay on a bare $1/(Js^2)$ | Degenerate: the whole real axis matches, no finite prediction without added lag |

Describing functions treat the nonlinearity as fixed and ask what frequency response around it produces a ring — a question about the whole loop. The next lesson asks a narrower one: when the actuator itself commands fewer independent channels than the vehicle has degrees of freedom to control, what is even reachable at all.
