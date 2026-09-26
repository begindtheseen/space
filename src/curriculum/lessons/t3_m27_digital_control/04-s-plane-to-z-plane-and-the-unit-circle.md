---
id: l04-s-plane-to-z-plane
title: Mapping the s-plane to the z-plane
minutes: 20
covers:
  - 'Mapping the s-plane to the z-plane; the unit circle as the stability boundary'
---

You already know how to read a pole in the $s$ plane at a glance. Left half plane means stable. The distance from the imaginary axis is how fast the mode dies away. The distance from the origin is its natural frequency. The angle away from the negative real axis tells you the damping. Every design review speaks this language.

None of those readings work for a discrete pole. A number like $z = 0.9335 + 0.1020j$ carries the same information — how fast, how damped, stable or not — but written in a different code. This lesson teaches you to read that code as easily as the old one. It builds the map between the two planes, shows why the **unit circle** (the circle of radius 1 around the origin) takes over the job the imaginary axis used to do, and gives you the formulas that turn a $z$-plane pole back into damping, natural frequency, settling time and overshoot.

The map is also where aliasing comes back, this time as a picture. The $s$ plane goes on forever upward and downward. The $z$ plane does not. Something has to give, and knowing exactly what is what keeps you from misreading a discrete pole near the edge of the circle.

## Where the map comes from

Start with a bouncing ball. Each bounce reaches $80\%$ of the height of the one before. You do not need to watch the ball in the air to describe it — the list of bounce heights is $1, 0.8, 0.64, 0.512, \ldots$, each one the last one times the same number. A list like that is a **[[geometric sequence|geometric-sequence]]**: every term is the previous term times a fixed ratio.

Sampling does the same thing to a continuous mode. A pole at $s = \sigma + j\omega_d$ puts a term $e^{st}$ into the response. Here $\sigma$ ("sigma") is the decay rate and $\omega_d$ ("omega sub d") is the damped oscillation frequency in radians per second. At the sampling instants $t = nT$ — sample number $n$, with $T$ seconds between samples — that term is

$$
e^{s\,nT} = \left(e^{sT}\right)^{n}.
$$

That is a geometric sequence with ratio $e^{sT}$. The previous lesson found that the sequence $a^n$ has a pole at $z = a$. So the sampled mode has a discrete pole at

$$
\boxed{\,z = e^{sT}\,}
$$

and the map from one plane to the other is the exponential. It is not an approximation, a curve fit or one convention among several. Sampling a continuous exponential gives you exactly a geometric sequence with ratio $e^{sT}$.

Now split it into size and angle, using $s = \sigma + j\omega_d$:

$$
|z| = e^{\sigma T}, \qquad \angle z = \omega_d T .
$$

Read $|z|$ as "the magnitude of z" and $\angle z$ as "the angle of z". The real part of $s$ sets how far the pole sits from the origin. The imaginary part sets its angle. So a $z$-plane pole is an instruction for an arrow: **every sample, shrink by $|z|$ and turn by $\angle z$**. Everything else in this lesson follows from that.

## The unit circle is the stability boundary

A continuous mode dies away when $\sigma < 0$. Under the map, $\sigma < 0$ gives $|z| = e^{\sigma T} < 1$ — the arrow shrinks every sample. So:

- the **left half plane** maps to the **inside** of the unit circle;
- the **imaginary axis** ($\sigma = 0$) maps onto the **unit circle** itself, $|z| = 1$ — the arrow keeps its length forever;
- the **right half plane** maps outside — the arrow grows every sample.

The **[[drawing of the two planes|z-plane-map]]** shows a stable pole pair landing inside the circle. A discrete system is stable if and only if every pole satisfies $|z| < 1$. The imaginary axis has become a circle, and "how far into the left half plane" has become "how far in from the circle".

The origin deserves a moment. $z = 0$ corresponds to $\sigma \to -\infty$: a decay so fast it is instant. A pole at exactly $z = 0$ means its mode is gone after one sample. A difference equation with every pole at the origin is a **finite impulse response** — its reaction to a single kick stops completely after a fixed number of samples. A controller that puts all the closed-loop poles there is a **[[deadbeat|deadbeat]]** design: it settles exactly in as many samples as the system has states. Deadbeat control is rarely flown, because it demands enormous control effort and gives no robustness at all. But it explains why a pole very close to $z = 0$ in flight code is a fast mode, not a suspicious number.

::: key
**Discrete-time stability region.** The unit circle. Since $z = e^{sT}$, the imaginary axis maps to $|z| = 1$ and the left half plane to $|z| < 1$. A discrete pole is stable if and only if $|z| < 1$.
:::

## The map is many-to-one, which is aliasing again

Here is the catch. Add a whole number of sample rates to the frequency. Let $\omega_s = 2\pi/T$ be the sampling frequency in radians per second, and replace $\omega_d$ by $\omega_d + k\omega_s$ for any integer $k$:

$$
e^{(\sigma + j\omega_d + jk\omega_s)T} = e^{\sigma T} e^{j\omega_d T} e^{\,jk\,2\pi} = e^{sT}.
$$

The last step works because $\omega_s T = 2\pi$, and $e^{jk\,2\pi} = 1$ — turning a whole number of full circles leaves the arrow where it started. So you get the same $z$.

That means every horizontal band of the $s$ plane, $\omega_s$ tall, maps onto the whole $z$ plane, and all of those bands land on it in exactly the same way. The band $-\omega_s/2 < \omega_d \le \omega_s/2$ is called the **[[primary strip|primary-strip]]**. It is the only one the samples can tell apart.

This is the aliasing of the first lesson, now as geometry. Sample at $50\,\mathrm{Hz}$, and a continuous mode at $47\,\mathrm{Hz}$ and one at $3\,\mathrm{Hz}$ land on the same point of the $z$ plane (the $47\,\mathrm{Hz}$ one is $47 - 50 = -3\,\mathrm{Hz}$, the mirror image of $+3\,\mathrm{Hz}$, so it lands on the matching conjugate pole). No discrete analysis can tell them apart. It is the [[wagon-wheel effect|wagon-wheel]] from old films.

Here is the practical reading. A pole's angle $\theta = \omega_d T$ ("theta") runs from $0$ at DC (zero frequency) to $\pi$ at the Nyquist frequency, half the sample rate. The number of samples in one cycle of the oscillation is $2\pi/\theta$. So $\theta = \pi$ is two samples per cycle: the pole sits on the negative real axis, and its mode flips sign every sample. A negative real pole in flight code is not a bug by itself. It always deserves a look, though, because it is a mode running at the fastest rate the sample rate can show.

## Reading a discrete pole

Now run the map backwards. Write a discrete pole as $z = r e^{j\theta}$, with $r = |z|$ its distance from the origin and $\theta = \angle z$ its angle in radians. Since $z = e^{sT}$, taking the **[[natural logarithm|natural-log]]** of both sides gives $sT = \ln z = \ln r + j\theta$. Match the real parts and the imaginary parts:

$$
\sigma = \frac{\ln r}{T}, \qquad \omega_d = \frac{\theta}{T} .
$$

In continuous time you already know $\sigma = -\zeta\omega_n$ and $\omega_d = \omega_n\sqrt{1-\zeta^2}$, where $\zeta$ ("zeta") is the damping ratio and $\omega_n$ ("omega sub n") the natural frequency. Solve those for $\omega_n$ and $\zeta$:

$$
\omega_n = \frac{\sqrt{(\ln r)^2 + \theta^2}}{T},
\qquad
\zeta = \frac{-\ln r}{\sqrt{(\ln r)^2 + \theta^2}} .
$$

::: note Why these two formulas have to be true
Square both continuous relations and add them: $\sigma^2 + \omega_d^2 = \zeta^2\omega_n^2 + \omega_n^2(1 - \zeta^2) = \omega_n^2$. So $\omega_n = \sqrt{\sigma^2 + \omega_d^2}$ — the distance of the $s$-plane pole from the origin. Put in $\sigma = \ln r/T$ and $\omega_d = \theta/T$, pull the common $1/T$ out of the square root, and you have the first formula.

For the second, $\zeta = -\sigma/\omega_n$. The $1/T$ appears on top and bottom and cancels, leaving $-\ln r$ over the same square root. Notice that $T$ has vanished: damping is a shape, and it does not care how often you sample.
:::

Once you have $\zeta$ and $\omega_n$, every result from the signals and systems module applies unchanged:

- $2\%$ **settling time** $\approx 4/(\zeta\omega_n)$;
- **overshoot** $= e^{-\pi\zeta/\sqrt{1-\zeta^2}}$;
- **peak time** $= \pi/\omega_d$.

Two shortcuts are worth carrying. First, the size of the mode shrinks as $r^n$, so the number of samples in one time constant is

$$
n_\tau = \frac{-1}{\ln r}.
$$

That is about $9.5$ samples for $r = 0.9$, $19.5$ for $r = 0.95$ and $99.5$ for $r = 0.99$. A radius that looks "nearly 1" can mean a hundred samples of ringing.

Second, the curves of constant damping in the $z$ plane are **[[logarithmic spirals|damping-spirals]]**,

$$
r = e^{-\theta\zeta/\sqrt{1-\zeta^2}},
$$

found by removing $T$ between the two formulas above. They start at $z = 1$ when $\theta = 0$ and wind inward. That is why a pole that looks comfortably inside the circle can still be poorly damped if its angle is small. For $\theta = 0.1$ and $\zeta = 0.2$, the spiral sits at $r = e^{-0.0204} = 0.980$, pressed right up against the boundary.

::: warning Distance from the circle is not damping
Reading a $z$-plane plot as if the gap to the circle were the damping is the most common error in discrete design reviews. A pole at $z = 0.98 + 0.02j$ and a pole at $z = 0.70 + 0.70j$ have similar-looking gaps to the circle. But at $T = 10\,\mathrm{ms}$ the first has $\zeta = 0.700$ at $\omega_n = 0.455\,\mathrm{Hz}$, and the second has $\zeta = 0.013$ at $\omega_n = 12.5\,\mathrm{Hz}$ — nearly undamped. Compute $\zeta$ from $-\ln r/\sqrt{(\ln r)^2 + \theta^2}$ instead of eyeballing the gap. Your eye is reliable for one question only: is the pole inside the circle at all?
:::

::: example One continuous pole pair, three sample rates
A spacecraft attitude loop is designed with a closed-loop pole pair at $\omega_n = 2\pi \cdot 1.0 = 6.2832\,\mathrm{rad/s}$ and $\zeta = 0.7$. In the $s$ plane,

$$
s = -\zeta\omega_n \pm j\omega_n\sqrt{1-\zeta^2} = -4.3982 \pm 4.4871\,j\ \ \mathrm{s^{-1}} .
$$

Map it at three candidate sample rates $f_s$ with $z = e^{sT}$, where $T = 1/f_s$:

| $f_s$ | $T$ | $z$ | $r$ | $\theta$ | samples/cycle |
| --- | --- | --- | --- | --- | --- |
| $200\,\mathrm{Hz}$ | $5\,\mathrm{ms}$ | $0.97800 + 0.02195j$ | $0.97825$ | $0.02244$ rad | $280$ |
| $50\,\mathrm{Hz}$ | $20\,\mathrm{ms}$ | $0.91211 + 0.08208j$ | $0.91579$ | $0.08974$ rad | $70$ |
| $5\,\mathrm{Hz}$ | $200\,\mathrm{ms}$ | $0.25876 + 0.32436j$ | $0.41493$ | $0.89742$ rad | $7$ |

Check the map backwards on the middle row.

1. $\ln r = \ln 0.91579 = -0.087964$, so $\sigma = -0.087964/0.02 = -4.3982\,\mathrm{s^{-1}}$. That matches the design.
2. $\sqrt{(\ln r)^2 + \theta^2} = \sqrt{0.0077377 + 0.0080536} = 0.125664$.
3. So $\omega_n = 0.125664/0.02 = 6.2832\,\mathrm{rad/s}$ and $\zeta = 0.087964/0.125664 = 0.700$.

The map is exact in both directions.

Now read the three rows as an engineer. At $200\,\mathrm{Hz}$ the pole sits at radius $0.978$ and an angle of $1.3^\circ$ — tucked tight against $z = 1$, where a small error in a coefficient moves it a long way in $\zeta$. At $5\,\mathrm{Hz}$ the pole is spread well out across the disk, which is comfortable for the arithmetic. But there are only seven samples per cycle of the oscillation, and good behavior at the sample instants no longer guarantees good behavior between them. The middle row is the sensible one.

Notice the tension: a pole location that is *numerically* comfortable and a sample rate that is *dynamically* sensible pull in opposite directions. The sample-rate lesson of this module resolves exactly that.
:::

::: example Reading a second-order section out of flight code
You find this in a $100\,\mathrm{Hz}$ attitude controller and want to know what it does:

$$
H(z) = \frac{0.01483\,(z + 1)}{z^2 - 1.86709\,z + 0.88191}.
$$

**Find the poles.** Write the denominator as $z^2 + a_1 z + a_2$, so $a_1 = -1.86709$ and $a_2 = 0.88191$. For a complex pair, the two roots have equal size and their product is $a_2$, and their sum is $-a_1$. So

$$
r = \sqrt{a_2} = \sqrt{0.88191} = 0.93910,
\qquad
\cos\theta = \frac{-a_1}{2r} = \frac{1.86709}{2 \times 0.93910} = 0.99408,
$$

giving $\theta = 0.108828\,\mathrm{rad}$. The poles are $z = 0.93355 \pm 0.10200j$.

**Convert, with $T = 0.01\,\mathrm{s}$.** $\ln r = -0.062842$, so $\sigma = -6.2842\,\mathrm{s^{-1}}$ and $\omega_d = 0.108828/0.01 = 10.883\,\mathrm{rad/s} = 1.732\,\mathrm{Hz}$. Then

$$
\omega_n = \frac{\sqrt{0.062842^2 + 0.108828^2}}{0.01} = \frac{0.125664}{0.01} = 12.566\,\mathrm{rad/s} = 2.000\,\mathrm{Hz},
\qquad
\zeta = \frac{0.062842}{0.125664} = 0.500 .
$$

**Read it.** The section is a second-order response at $2\,\mathrm{Hz}$ with $\zeta = 0.5$. Its overshoot is $e^{-\pi(0.5)/\sqrt{0.75}} = 0.163$, that is $16.3\%$. Its $2\%$ settling time is $4/(\zeta\omega_n) = 4/6.284 = 0.637\,\mathrm{s}$, which at $100\,\mathrm{Hz}$ is $64$ frames (one **frame** is one pass of the control loop, one sample period).

**Two sanity checks.** The DC gain is $H(1)$:

$$
H(1) = \frac{0.01483 \times 2}{1 - 1.86709 + 0.88191} = \frac{0.02966}{0.01482} = 2.00 .
$$

So the section also multiplies by 2. That is worth noticing: you would usually expect a second-order smoothing section to have a gain of 1, and this one does not. Second, the angle $\theta = 0.1088\,\mathrm{rad}$ is $3.5\%$ of $\pi$, so one cycle takes $2\pi/0.1088 = 58$ samples. The oscillation is well resolved, nowhere near aliasing, and far from the negative real axis.
:::

## A stability test you can do by hand

For a second-order denominator $z^2 + a_1 z + a_2$, both roots lie inside the unit circle if and only if

$$
|a_2| < 1, \qquad |a_1| < 1 + a_2 .
$$

This is the **[[Jury criterion|jury-test]]** for order 2 — the discrete cousin of the Routh-Hurwitz test you used in continuous time. The two conditions have plain meanings.

- The first says the product of the two root sizes is less than 1.
- The second is two checks at once: the denominator must be positive at $z = 1$, where $1 + a_1 + a_2 > 0$, and at $z = -1$, where $1 - a_1 + a_2 > 0$. Those are the two points where the unit circle crosses the real axis.

::: note Why the second condition works
Write the denominator by its roots, $D(z) = (z - z_1)(z - z_2)$. Then $a_2 = z_1 z_2$, and the two edge checks become

$$
D(1) = (1 - z_1)(1 - z_2), \qquad D(-1) = (1 + z_1)(1 + z_2).
$$

**Complex pair.** The roots are mirror images, $z_2 = \bar z_1$, so $D(1) = |1 - z_1|^2 > 0$ and $D(-1) = |1 + z_1|^2 > 0$ automatically. Their product is $a_2 = |z_1|^2 = r^2$, so the first condition, $a_2 < 1$, says exactly $r < 1$.

**Two real roots.** If one root is beyond $+1$ and the other is not, one bracket in $D(1)$ is negative, so $D(1) < 0$. If one is below $-1$ and the other is not, $D(-1) < 0$. If both are beyond the same edge, their product $a_2$ is bigger than 1. Every way of leaving the circle breaks one of the conditions, and with both roots inside, all of them hold.

:::

Apply it to the section above: $a_2 = 0.88191 < 1$, and $|a_1| = 1.86709 < 1 + 0.88191 = 1.88191$. Stable — with only $0.015$ to spare in the second condition. That is another way of seeing how close this pole pair is to the boundary, and why the coefficients are quoted to five decimals rather than three.

::: note What the unit circle does not tell you
A discrete design that looks perfect at the sample instants can still misbehave between them. The $z$-domain analysis sees only the samples $y[n]$. A plant driven by a staircase command can ripple within each frame while passing exactly through the intended values at every sample. Aggressive designs with poles near $z = 0$ are the usual culprits: the controller demands large inputs that flip back and forth, and the plant's continuous response wanders in between. This is called **[[intersample ripple|intersample-ripple]]**. The check is to simulate the continuous plant with the held command at ten or twenty points per frame, and to look at the actuator signal, not only the sampled output. It is the one failure the unit circle does not warn you about.
:::

## Check yourself

::: check
A discrete pole sits at $z = -0.85$ in a $50\,\mathrm{Hz}$ loop. Is it stable? What does its mode look like in time, and what continuous frequency does it correspond to?
:::

::: answer
Stable: $|z| = 0.85 < 1$.

Its angle is $\theta = \pi$, so $\omega_d = \pi/T = \pi/0.02 = 157.08\,\mathrm{rad/s} = 25\,\mathrm{Hz}$ — exactly the Nyquist frequency. The mode is $(-0.85)^n$. It flips sign every sample and shrinks by $15\%$ each step: two samples per cycle, the fastest oscillation this sample rate can show.

Reading it back in continuous terms needs care, because the map is many-to-one. Within the primary strip the pole means $\sigma = \ln(0.85)/0.02 = -8.126\,\mathrm{s^{-1}}$ and $\omega_d = 25\,\mathrm{Hz}$. But it could equally be $25 + 50 = 75\,\mathrm{Hz}$, or $125\,\mathrm{Hz}$, and so on. Taking the primary-strip reading, the damping is $\zeta = 8.126/\sqrt{8.126^2 + 157.08^2} = 0.0517$.

In practice a negative real pole like this is almost never a sampled physical mode. It is usually the fingerprint of a discretization problem — most often forward Euler used at too low a rate, which the next lesson covers.
:::

::: check
Two closed-loop poles from a $400\,\mathrm{Hz}$ loop are $z = 0.985 \pm 0.060j$. Find $\zeta$, $\omega_n$, the settling time and the number of frames it takes.
:::

::: answer
Size and angle: $r = \sqrt{0.985^2 + 0.060^2} = \sqrt{0.970225 + 0.0036} = \sqrt{0.973825} = 0.98683$, and $\theta = \arctan(0.060/0.985) = 0.060839\,\mathrm{rad}$.

With $T = 0.0025\,\mathrm{s}$: $\ln r = -0.013261$, so $\sigma = -5.3047\,\mathrm{s^{-1}}$ and $\omega_d = 24.335\,\mathrm{rad/s} = 3.873\,\mathrm{Hz}$.

Then $\sqrt{(\ln r)^2 + \theta^2} = \sqrt{0.00017585 + 0.00370139} = \sqrt{0.00387724} = 0.062267$. So $\omega_n = 24.907\,\mathrm{rad/s} = 3.964\,\mathrm{Hz}$ and $\zeta = 0.013261/0.062267 = 0.213$.

Settling: $4/(\zeta\omega_n) = 4/5.3047 = 0.7540\,\mathrm{s}$, which is $0.7540/0.0025 = 302$ frames.

The lesson in the numbers: poles at radius $0.987$, which look almost on top of $z = 1$, describe a lightly damped $4\,\mathrm{Hz}$ wobble that lasts three hundred frames. At high sample rates every interesting pole crowds into a small patch near $z = 1$. That makes them hard to read, and, as the realization-forms lesson shows, hard to compute accurately too.
:::

::: check
Explain why the $s$-to-$z$ map cannot be run backwards uniquely, and what that means when you identify a system from sampled data.
:::

::: answer
$z = e^{sT}$ repeats itself in the imaginary direction with period $\omega_s = 2\pi/T$: $s$ and $s + jk\omega_s$ give the same $z$ for every integer $k$. Running it backwards means choosing one band, and the convention is the primary strip $-\omega_s/2 < \omega \le \omega_s/2$, where $\omega_d = \theta/T$ with $\theta \in (-\pi, \pi]$.

For identification, this means sampled data cannot tell you a mode's true frequency if that frequency is above Nyquist. The estimator will report the folded value — confidently, with a good fit — because the folded model reproduces the data exactly. Any modal frequency you pull out of a sampled record is a statement about the primary strip only.

That is why modal surveys (vibration tests that measure a structure's natural frequencies) use instruments sampled far faster than the control loop. It is also why a structural mode found at $3\,\mathrm{Hz}$ in $50\,\mathrm{Hz}$ flight data should be confirmed against an analysis or a ground test before anyone designs a notch for it.
:::

::: check
A discrete integrator is $H(z) = T/(z - 1)$. Where is its pole, is the system stable, and what does that pole correspond to in the $s$ plane?
:::

::: answer
The pole is at $z = 1$ — on the unit circle. So the integrator is marginally stable, not stable. Its impulse response is a constant, matching the continuous integrator's step response, and any constant input drives its output up without limit.

In the $s$ plane, $z = 1$ means $r = 1$ and $\theta = 0$, so $\sigma = \ln(1)/T = 0$ and $\omega_d = 0$. That is the origin of the $s$ plane, which is exactly where a continuous integrator $1/s$ has its pole. The match is exact. It is why $z = 1$ is [[the most important point|z-equals-one]] in discrete control: every integral action, every position-from-rate sum, every bias state in an estimator puts a pole there on purpose.

The practical consequence is the same as in continuous time: integrator windup. A pole on the boundary means the state has no way to forget, so anti-windup logic is a requirement, not a nicety, and it carries over unchanged from the classical control module.
:::

::: check
A colleague finds discrete poles at $z = 0.999 \pm 0.001j$ in a $1\,\mathrm{kHz}$ loop and reports the design as "very stable, poles well inside the circle". What is wrong with that reading?
:::

::: answer
The gap to the circle is not the measure. Compute: $r = \sqrt{0.999^2 + 0.001^2} = 0.9990005$, so $\ln r = -0.00099993$, and with $T = 0.001\,\mathrm{s}$, $\sigma = -0.99999\,\mathrm{s^{-1}}$. The angle is $\theta = 0.0010010\,\mathrm{rad}$, so $\omega_d = 1.001\,\mathrm{rad/s}$.

Then $\omega_n = \sqrt{0.00099993^2 + 0.0010010^2}/0.001 = 1.4149\,\mathrm{rad/s} = 0.225\,\mathrm{Hz}$, and $\zeta = 0.00099993/0.0014149 = 0.707$.

The damping is fine. But the loop's speed is a quarter of a hertz, and the settling time is $4/0.99999 = 4.0\,\mathrm{s}$ — four thousand frames. A $1\,\mathrm{kHz}$ loop whose main mode takes four seconds to settle is either far slower than intended or running much faster than its dynamics need.

The deeper point: at $1\,\mathrm{kHz}$, every pole of any reasonably paced loop lands within a thousandth of $z = 1$, so "well inside the circle" is not even possible. Convert to $\zeta$ and $\omega_n$ before saying anything about a discrete pole.
:::

## Summary

| Item | Statement |
| --- | --- |
| The map | $z = e^{sT}$, exact: sampling $e^{st}$ gives the geometric sequence $(e^{sT})^n$ |
| Size and angle | $\lvert z \rvert = e^{\sigma T}$, $\angle z = \omega_d T$: each sample, shrink by $\lvert z \rvert$ and turn by $\angle z$ |
| Stability | Left half plane maps inside the unit circle; a discrete pole is stable iff $\lvert z \rvert < 1$ |
| Many-to-one | $s$ and $s + jk\omega_s$ map to the same $z$; only the primary strip $\lvert\omega\rvert \le \omega_s/2$ can be told apart |
| Backwards | $\sigma = \ln r / T$, $\omega_d = \theta/T$ |
| Second-order readings | $\omega_n = \sqrt{(\ln r)^2 + \theta^2}/T$, $\zeta = -\ln r/\sqrt{(\ln r)^2 + \theta^2}$ |
| Decay | Size shrinks as $r^n$; samples per time constant $n_\tau = -1/\ln r$ ($9.5$ at $r=0.9$, $99.5$ at $r=0.99$) |
| Oscillation | Samples per cycle $= 2\pi/\theta$; $\theta = \pi$ is Nyquist, flipping sign every sample |
| Constant damping | Log spirals $r = e^{-\theta\zeta/\sqrt{1-\zeta^2}}$ starting at $z = 1$ |
| Special points | $z = 1$ is the continuous origin (integrator); $z = 0$ is instant decay (deadbeat) |
| Jury test, order 2 | $z^2 + a_1z + a_2$ stable iff $\lvert a_2 \rvert < 1$ and $\lvert a_1 \rvert < 1 + a_2$ |
| Caution | Distance from the circle is not damping; intersample ripple is invisible to $z$-domain analysis |

The next lesson uses this geometry to judge the discretization methods. Each one is a different stand-in for $z = e^{sT}$, and how badly it bends the map is exactly how badly it bends your design.

::: context geometric-sequence Multiply, don't add
In an ordinary counting list you **add** the same amount each step: $2, 5, 8, 11$. In a geometric sequence you **multiply** by the same amount each step: $1, 0.8, 0.64, 0.512$. The fixed multiplier is the **ratio**.

If the ratio is smaller than 1 in size, the list shrinks toward zero — a decaying mode. If it is exactly 1, the list stays the same size forever. If it is bigger than 1, the list grows without limit. That three-way split is the whole stability story of this lesson, and $z$ is the ratio.
:::

::: context z-plane-map The same pole pair in both planes
On the left, the $s$ plane with its stable left half shaded and the lesson's $1\,\mathrm{Hz}$, $\zeta = 0.7$ pole pair. On the right, the $z$ plane with the unit disk shaded and the same pair mapped by $z = e^{sT}$ at three sample rates. The faster you sample, the closer the pole crowds toward $z = 1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="80" height="160" fill="#8fb8f0" opacity="0.5"/>
  <line x1="20" y1="100" x2="165" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="100" y1="20" x2="100" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="160" y="94" font-size="12" fill="#1f2a44" text-anchor="end">σ</text>
  <text x="106" y="32" font-size="12" fill="#1f2a44">jω</text>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="60.8" y1="60.1" x2="68.8" y2="68.1"/><line x1="68.8" y1="60.1" x2="60.8" y2="68.1"/>
    <line x1="60.8" y1="131.9" x2="68.8" y2="139.9"/><line x1="68.8" y1="131.9" x2="60.8" y2="139.9"/>
  </g>
  <text x="60" y="194" font-size="11" fill="#1f2a44" text-anchor="middle">s plane</text>
  <text x="182" y="172" font-size="12" fill="#1f2a44" text-anchor="middle">e^(sT)</text>
  <line x1="166" y1="152" x2="192" y2="152" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="200,152 191,147 191,157" fill="#1f2a44"/>
  <circle cx="270" cy="100" r="70" fill="#8fb8f0" fill-opacity="0.5" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="196" y1="100" x2="350" y2="100" stroke="#1f2a44" stroke-width="1"/>
  <line x1="270" y1="22" x2="270" y2="178" stroke="#1f2a44" stroke-width="1"/>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="285.1" y1="74.3" x2="291.1" y2="80.3"/><line x1="291.1" y1="74.3" x2="285.1" y2="80.3"/>
    <line x1="285.1" y1="119.7" x2="291.1" y2="125.7"/><line x1="291.1" y1="119.7" x2="285.1" y2="125.7"/>
  </g>
  <circle cx="333.8" cy="94.3" r="2.5" fill="#b4232c"/><circle cx="333.8" cy="105.7" r="2.5" fill="#b4232c"/>
  <circle cx="338.5" cy="98.5" r="2" fill="#1f2a44"/><circle cx="338.5" cy="101.5" r="2" fill="#1f2a44"/>
  <text x="282" y="72" font-size="11" fill="#1f2a44" text-anchor="end">5 Hz</text>
  <text x="354" y="86" font-size="11" fill="#1f2a44" text-anchor="end">50, 200 Hz</text>
  <text x="344" y="116" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="270" y="194" font-size="11" fill="#1f2a44" text-anchor="middle">z plane, unit circle</text>
</svg>
```
:::

::: context deadbeat Where "deadbeat" comes from
The word is older than digital control. Instrument makers used it for a meter needle that swings to the right reading and stops dead, with no wobble past the mark. A deadbeat digital controller does the same thing in the cleanest possible way: after a fixed, small number of samples, the error is exactly zero and stays there.

The price is huge commands in those few samples and extreme sensitivity to any error in the model. That is why it appears in textbooks far more often than on vehicles.
:::

::: context primary-strip Many bands, one z plane
Cut the $s$ plane into horizontal bands, each $\omega_s$ tall. The shaded band around the real axis is the primary strip. A pole at $s$ in it and poles at $s \pm j\omega_s$ in the bands above and below all land on the very same $z$, because adding $j\omega_s$ turns the arrow by a full circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="75" width="240" height="50" fill="#8fb8f0" opacity="0.6"/>
  <g stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3">
    <line x1="30" y1="25" x2="270" y2="25"/><line x1="30" y1="75" x2="270" y2="75"/>
    <line x1="30" y1="125" x2="270" y2="125"/><line x1="30" y1="175" x2="270" y2="175"/>
  </g>
  <line x1="30" y1="100" x2="270" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="190" y1="15" x2="190" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="264" y="94" font-size="12" fill="#1f2a44" text-anchor="end">σ</text>
  <text x="196" y="18" font-size="12" fill="#1f2a44">jω</text>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="106" y1="86" x2="114" y2="94"/><line x1="114" y1="86" x2="106" y2="94"/>
    <line x1="106" y1="36" x2="114" y2="44"/><line x1="114" y1="36" x2="106" y2="44"/>
    <line x1="106" y1="136" x2="114" y2="144"/><line x1="114" y1="136" x2="106" y2="144"/>
  </g>
  <text x="120" y="94" font-size="11" fill="#1f2a44">s</text>
  <text x="120" y="44" font-size="11" fill="#1f2a44">s + jωs</text>
  <text x="120" y="144" font-size="11" fill="#1f2a44">s − jωs</text>
  <text x="278" y="79" font-size="11" fill="#1f2a44">+ωs/2</text>
  <text x="278" y="129" font-size="11" fill="#1f2a44">−ωs/2</text>
  <text x="278" y="29" font-size="11" fill="#1f2a44">+3ωs/2</text>
  <text x="278" y="179" font-size="11" fill="#1f2a44">−3ωs/2</text>
  <text x="150" y="112" font-size="11" fill="#1d6fd1" text-anchor="middle">primary strip</text>
</svg>
```
:::

::: context wagon-wheel Why film wheels spin backward
A movie camera takes about 24 pictures a second. If a spoked wheel turns almost one spoke-gap between pictures, each new frame shows the spokes a little *behind* where they were, so on screen the wheel seems to creep backward. The camera is sampling, and a fast forward spin has folded into a slow backward one.

That is the many-to-one map at work: $+47\,\mathrm{Hz}$ sampled at $50\,\mathrm{Hz}$ looks exactly like $-3\,\mathrm{Hz}$, a slow turn the other way. Nothing in the samples can tell you which one really happened.
:::

::: context natural-log The logarithm undoes the exponential
The natural logarithm, written $\ln$, answers the question "$e$ to what power gives this number?" So $\ln(e^{x}) = x$, and taking $\ln$ of $z = e^{sT}$ hands back $sT$.

For a complex number $z = re^{j\theta}$, the logarithm splits neatly: $\ln z = \ln r + j\theta$. The size goes through the ordinary logarithm, and the angle comes straight out as the imaginary part. Because $\ln r$ is negative whenever $r < 1$, a pole inside the circle always gives a negative $\sigma$ — a decaying mode — as it should.
:::

::: context damping-spirals Lines of equal damping
Each curve joins every point in the upper half of the $z$ plane with the same damping ratio. Both start at $z = 1$ and spiral inward as the angle grows. The red dots are the two poles from the warning: the one near $z = 1$ sits on the $\zeta = 0.7$ curve, while the one at $0.70 + 0.70j$, almost the same distance from the circle, lies far outside even the $\zeta = 0.2$ curve — its damping is only $0.013$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <path d="M30,170 A150,150 0 0,1 330,170" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1"/>
  <line x1="180" y1="170" x2="180" y2="15" stroke="#1f2a44" stroke-width="1"/>
  <path d="M330.0,170.0 L325.9,154.4 L320.4,139.6 L313.4,125.9 L305.2,113.2 L295.9,101.7 L285.7,91.5 L274.7,82.6 L263.0,75.1 L250.9,69.1 L238.5,64.4 L225.9,61.2 L213.4,59.4 L201.0,58.9 L188.8,59.7 L177.1,61.8 L165.9,65.0 L155.4,69.3 L145.6,74.6 L136.6,80.7 L128.5,87.7 L121.3,95.3 L115.1,103.4 L110.0,111.9 L105.8,120.8 L102.7,129.8 L100.6,139.0 L99.5,148.1 L99.4,157.0 L100.3,165.7 L101.0,170.0" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M330.0,170.0 L314.4,155.6 L299.0,144.3 L284.1,135.6 L270.0,129.2 L256.7,124.8 L244.4,122.2 L233.1,121.0 L222.9,121.0 L213.7,122.0 L205.6,123.8 L198.5,126.2 L192.4,129.0 L187.2,132.1 L182.8,135.3 L179.2,138.7 L176.3,142.0 L174.0,145.3 L172.2,148.4 L171.0,151.4 L170.1,154.2 L169.7,156.8 L169.5,159.2 L169.5,161.3 L169.8,163.2 L170.2,164.9 L170.7,166.4 L171.4,167.6 L172.0,168.7 L172.7,169.6 L173.1,170.0" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <circle cx="327.0" cy="167.0" r="3" fill="#b4232c"/>
  <circle cx="285.0" cy="65.0" r="3" fill="#b4232c"/>
  <text x="292" y="58" font-size="11" fill="#b4232c">0.70+0.70j</text>
  <text x="200" y="52" font-size="11" fill="#1d6fd1">ζ = 0.2</text>
  <text x="222" y="116" font-size="11" fill="#1f2a44">ζ = 0.7</text>
  <text x="336" y="184" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="30" y="184" font-size="11" fill="#1f2a44" text-anchor="middle">−1</text>
</svg>
```
:::

::: context jury-test Routh's discrete cousin
The Routh-Hurwitz test decides whether all roots of a polynomial lie in the left half plane without solving for them. The Jury test does the same job for "inside the unit circle". It is named after Eliahu Jury, who worked on sampled-data systems at the University of California, Berkeley.

For second order you can find the roots directly, so the test is mostly a quick check. Its real value is at higher order, and in tuning: the conditions are simple inequalities on the coefficients, so you can see exactly how far a gain can move before a pole leaves the circle.
:::

::: context intersample-ripple Hidden between the dots
Picture a strobe light on a spinning fan. If the flashes happen to catch the blade in the same place every time, the fan looks still — but it is spinning hard. A discrete analysis is that strobe. It sees the output only at the sampling instants.

If the controller is pushing the actuator hard one way and then the other on alternate frames, the vehicle can wobble between samples while every sample looks perfect. The fix is to simulate the continuous plant finely enough to see what happens inside each frame.
:::

::: context z-equals-one Poles that live on the boundary
A pole at $z = 1$ is a memory that never fades: each sample passes its value along unchanged, and every new input is added on top. That is what an integrator, a running position from rate, or a slowly drifting sensor bias all need.

You will meet it again in the Kalman filter modules. A gyro bias is modeled as a state that stays put unless pushed, which in discrete form is a pole at exactly $z = 1$. The estimator then learns the bias from data instead of forgetting it.
:::
