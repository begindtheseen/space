---
id: l05-discretization-methods
title: Discretization methods
minutes: 22
covers:
  - 'Discretization methods: forward and backward Euler, Tustin, Tustin with prewarping, ZOH equivalence, matched pole-zero'
---

You have a controller written for continuous time: a PID with a filtered derivative, a lead network, a notch aimed at a bending mode. It was designed in the $s$ plane and its margins were read off a Bode plot. Now it has to become a **difference equation** — a line of code that computes this sample's output from recent inputs and outputs. Something has to stand in for $s$.

The honest map is $z = e^{sT}$, from the previous lesson. You cannot use it directly. Substituting $s = \ln(z)/T$ into a ratio of polynomials in $s$ gives something that is not a ratio of polynomials in $z$, so it is not a difference equation. Every practical method is a stand-in for that exponential, or an exact match of a different kind, and each one bends the design in its own way.

It is like translating a poem: every translator protects something and loses something else. Here the losses are real. One method will move a notch meant for a $60\,\mathrm{Hz}$ bending mode down to $48\,\mathrm{Hz}$ and miss the mode. Another will make a perfectly stable filter blow up. A third will flatten a $20\,\mathrm{dB}$ notch to $1.75\,\mathrm{dB}$. All three are in production code somewhere. This lesson derives the five methods that matter, measures the damage each does, and tells you which to reach for.

## Each method is a substitution

Four of the five methods replace $s$ with an expression in $z$. Since an integrator $1/s$ is the only element that needs approximating, they come from **[[rules for stepping an integral forward|euler-steps]]**. Think of estimating how far a car went in one second from its speedometer. Use the speed at the start of the second, the speed at the end, or the average of the two.

**Forward (explicit) Euler** uses the slope at the start of the step, $x[n+1] = x[n] + T\dot{x}[n]$. Shifting forward one sample is multiplying by $z$, so $\dot{x} \leftrightarrow (z-1)/T$ and

$$
s \;\leftarrow\; \frac{z - 1}{T},
\qquad\text{equivalently}\qquad
z = 1 + sT,
$$

which is also the first two terms of $e^{sT} = 1 + sT + (sT)^2/2 + \cdots$.

**Backward (implicit) Euler** uses the slope at the end of the step, $x[n] = x[n-1] + T\dot{x}[n]$, so

$$
s \;\leftarrow\; \frac{z - 1}{Tz} = \frac{1 - z^{-1}}{T},
\qquad
z = \frac{1}{1 - sT}.
$$

**Tustin**, also called the bilinear or trapezoidal transform, averages the two slopes — the **trapezoidal rule**, $x[n] = x[n-1] + \tfrac{T}{2}(\dot{x}[n] + \dot{x}[n-1])$:

$$
s \;\leftarrow\; \frac{2}{T}\,\frac{z - 1}{z + 1},
\qquad
z = \frac{1 + sT/2}{1 - sT/2}.
$$

That last form is the first-order **[[Padé approximation|pade]]** of the exponential. Split $e^{sT} = e^{sT/2}/e^{-sT/2}$ and cut both halves off after the linear term. Cutting both sides the same way is why Tustin behaves so much better than either Euler.

The three differ in how they bend the stability boundary, and that is the whole story. The **[[pictures of where each method sends the left half plane|stability-regions]]** sum it up.

## Forward Euler maps the left half plane outside the circle

Under $z = 1 + sT$, the imaginary axis $s = j\omega$ maps to the vertical line $\mathrm{Re}(z) = 1$. The whole left half plane goes to the half plane $\mathrm{Re}(z) < 1$. That region contains the unit disk, but it is far larger. A continuous pole lands inside the unit circle only if $|1 + sT| < 1$, which confines $sT$ to a disk of radius 1 centered at $-1$. Every stable continuous pole outside that little disk — fast enough, or lightly damped enough — comes out unstable.

Now put a number on it for the case that matters. Take a continuous pole pair with natural frequency $\omega_n$ and damping $\zeta$, so $s = \omega_n(-\zeta \pm j\sqrt{1-\zeta^2})$. Then

$$
|z|^2 = (1 - \zeta\omega_n T)^2 + \omega_n^2T^2(1-\zeta^2)
= 1 - 2\zeta\,\omega_n T + (\omega_n T)^2 .
$$

The discrete pair is unstable when $|z|^2 > 1$, that is, when $(\omega_n T)^2 > 2\zeta\omega_n T$. Divide both sides by $\omega_n T$:

$$
\omega_n T > 2\zeta .
$$

Read that as a sample-rate requirement: forward Euler needs $f_s > \omega_n/(2\zeta) = \omega_n Q$, with $\omega_n$ in $\mathrm{rad/s}$ and $Q = 1/(2\zeta)$ the **[[quality factor|quality-factor]]**, a measure of how sharp a resonance is. Lightly damped poles are exactly where it fails, and lightly damped poles are exactly what a **[[notch filter|notch]]** is built from. A notch at $60\,\mathrm{Hz}$ with $\zeta_d = 0.2$ has $\omega_n = 377\,\mathrm{rad/s}$ and $Q = 2.5$, so forward Euler would need $f_s > 942\,\mathrm{Hz}$ — nearly five times the $200\,\mathrm{Hz}$ the loop actually runs at.

::: key
**Why forward Euler is dangerous.** $z = 1 + sT$ maps stable continuous poles outside the unit circle once $|sT|$ is large. For a pole pair $(\zeta, \omega_n)$ the discrete pair is unstable when $\omega_n T > 2\zeta$: high-$Q$ notch poles and fast actuator poles break first. Backward Euler is always stable but distorts badly.
:::

## Backward Euler is always stable and rarely right

Under $z = 1/(1 - sT)$, the imaginary axis maps to the small circle $|z - \tfrac12| = \tfrac12$. Check the ends: $\omega = 0$ gives $z = 1$, and $\omega \to \infty$ gives $z \to 0$, both on that circle. The whole left half plane is squeezed into that small disk, entirely inside the unit circle. So a stable continuous system always becomes a stable discrete one. That is the method's one virtue, and the reason it survives.

The cost shows in the same picture. Squash an infinite half plane into a disk of radius $\tfrac12$ and not much survives: frequencies are pulled toward DC, damping is inflated, and resonances are flattened. Worse, part of the *right* half plane also lands inside the unit circle. With $T = 20\,\mathrm{ms}$, a continuous pole at $s = +200\,\mathrm{s^{-1}}$ — violently unstable — maps to $z = 1/(1 - 4) = -0.333$, comfortably stable. Backward Euler applied to an unstable plant model can hand you a discrete model that says the plant is fine.

Use it for a first-order anti-windup filter where accuracy does not matter, or when a guarantee of stability is worth more than fidelity. Do not use it for anything with a resonance.

## Tustin maps the left half plane exactly onto the unit disk

Put $s = j\omega_a$ into $z = (1 + sT/2)/(1 - sT/2)$. The top and bottom are complex conjugates — mirror images with the same size — so $|z| = 1$ for every $\omega_a$. The imaginary axis maps onto the unit circle, all of it, exactly once. When $\mathrm{Re}(s) < 0$, the top is strictly smaller than the bottom, so $|z| < 1$. The map is a **[[conformal|conformal]]** one-to-one match between the open left half plane and the open unit disk.

So stability is preserved in both directions, always, at any sample rate. That is why Tustin is the default for controllers and filters.

::: key
**Tustin (bilinear) transform.** $s \to \dfrac{2}{T}\dfrac{z-1}{z+1}$. Maps the whole open left half plane into the open unit disk, so stability is always preserved. Cost: frequency warping.
:::

## Frequency warping, and how to undo it at one frequency

Something has to give when an infinite axis is wrapped onto a finite circle. What gives is the frequency scale. Put the discrete frequency $z = e^{j\omega T}$ into the substitution, and call $\omega_a$ the continuous frequency whose response shows up there:

$$
j\omega_a = \frac{2}{T}\,\frac{e^{j\omega T} - 1}{e^{j\omega T} + 1}
= \frac{2}{T}\,\frac{e^{j\omega T/2} - e^{-j\omega T/2}}{e^{j\omega T/2} + e^{-j\omega T/2}}
= \frac{2}{T}\,j\tan\!\left(\frac{\omega T}{2}\right).
$$

The middle step divides top and bottom by $e^{j\omega T/2}$, the same half-angle trick as in the zero-order-hold lesson. The last step uses $e^{jx} - e^{-jx} = 2j\sin x$ and $e^{jx} + e^{-jx} = 2\cos x$. So

$$
\omega_a = \frac{2}{T}\tan\!\left(\frac{\omega T}{2}\right),
\qquad
\omega = \frac{2}{T}\arctan\!\left(\frac{\omega_a T}{2}\right).
$$

The discrete filter's response at $\omega$ equals the continuous filter's response at $\omega_a$. For small $\omega T$, the tangent is nearly its argument and $\omega_a \approx \omega$ — no harm done. As $\omega$ approaches Nyquist, $\omega T/2$ approaches $\pi/2$ and $\omega_a \to \infty$: the whole infinite continuous axis is crammed into the top of the band. A feature designed at $\omega_a$ therefore *appears* at the lower frequency $\omega$. The higher the design frequency compared with the sample rate, the worse the squeeze. The **[[warping curve|warping-curve]]** shows it.

The repair is to change the constant in front. Replace $2/T$ with whatever value makes the map exact at one chosen frequency $\omega_0$:

$$
s \;\leftarrow\; \frac{\omega_0}{\tan(\omega_0 T/2)}\,\frac{z - 1}{z + 1} .
$$

This is **Tustin with prewarping**. At $\omega = \omega_0$ the substitution returns exactly $j\omega_0$, so the discrete response at $\omega_0$ equals the continuous response there. Everywhere else it is still warped, a little differently. You get one frequency for free, so spend it where it matters: the notch center for a notch, the crossover frequency for a compensator.

::: key
**Tustin with prewarping.** $s \to \dfrac{\omega_0}{\tan(\omega_0 T/2)}\dfrac{z-1}{z+1}$. Makes the discrete response exact at the single frequency $\omega_0$ — use the notch centre or the crossover frequency.
:::

::: example Five discretizations of one notch
Take the notch from the classical control module in its standard form,

$$
N(s) = \frac{s^2 + 2\zeta_n\omega_m s + \omega_m^2}{s^2 + 2\zeta_d\omega_m s + \omega_m^2},
$$

aimed at a $60\,\mathrm{Hz}$ bending mode: $\omega_m = 2\pi \cdot 60 = 376.99\,\mathrm{rad/s}$, $\zeta_n = 0.02$, $\zeta_d = 0.2$. The depth is $\zeta_n/\zeta_d = 0.1$, which is $-20\,\mathrm{dB}$. Discretize it at $f_s = 200\,\mathrm{Hz}$ five ways, then measure what actually came out by sweeping around the unit circle.

| Method | Notch center | Depth | Largest pole radius |
| --- | --- | --- | --- |
| Forward Euler | none | none | $1.949$ — unstable |
| Backward Euler | $49.49\,\mathrm{Hz}$ | $-1.75\,\mathrm{dB}$ | $0.434$ |
| Tustin | $48.12\,\mathrm{Hz}$ | $-20.00\,\mathrm{dB}$ | $0.817$ |
| Tustin, prewarped at $\omega_m$ | $60.00\,\mathrm{Hz}$ | $-20.00\,\mathrm{dB}$ | $0.825$ |
| Matched pole-zero | $60.00\,\mathrm{Hz}$ | $-20.08\,\mathrm{dB}$ | $0.686$ |

Every row is predicted by the theory above.

**Forward Euler** fails the test by a mile: $\omega_m T = 376.99 \times 0.005 = 1.885$, against $2\zeta_d = 0.4$. The poles come out at radius $1.949$, so the filter output roughly doubles every sample. A filter whose continuous version is stable no matter what has been made unstable by the act of writing it as a difference equation.

**Backward Euler** is stable, as promised, and useless. The notch is $1.75\,\mathrm{dB}$ deep instead of $20$, so a bending mode passing through is cut by $18\%$ instead of $90\%$. No stability check catches this.

**Plain Tustin** keeps the shape exactly, including the $-20\,\mathrm{dB}$ depth, and puts it at the wrong frequency. The warping formula predicts where: $(2/T)\arctan(\omega_m T/2) = 400 \times \arctan(0.94248) = 302.32\,\mathrm{rad/s} = 48.12\,\mathrm{Hz}$. At $60\,\mathrm{Hz}$ the response has climbed back to $0.89$ ($-1.0\,\mathrm{dB}$), so the mode is cut by about $11\%$ instead of $90\%$. Meanwhile the loop still pays the notch's full phase cost, in the wrong place.

**Prewarping** fixes it with one number. The constant becomes $\omega_m/\tan(\omega_m T/2) = 376.99/1.3764 = 273.90$ instead of $2/T = 400$, and the notch lands on $60.000\,\mathrm{Hz}$. The resulting **biquad** (a second-order section), scaled so $a_0 = 1$, is

$$
b = [\,0.856168,\ 0.519264,\ 0.824206\,],
\qquad
a = [\,1,\ 0.519264,\ 0.680374\,].
$$

Sanity check: its DC gain is $\sum b/\sum a = 2.199638/2.199638 = 1.000000$, as a notch's must be.

**Matched pole-zero** also gets the center right, and comes out $0.08\,\mathrm{dB}$ deeper than asked — within anyone's tolerance.

The forward-Euler row announces itself at once. The backward-Euler and plain-Tustin rows run happily forever and do not do the job. Only sweeping the *discrete* filter around the unit circle — plotting what you actually built — catches them.
:::

## ZOH equivalence: exact, and for the plant

The methods so far approximate one transfer function with another. **ZOH equivalence** asks a sharper question. The plant really is driven by a zero-order hold and really is sampled at its output. So what is the *exact* transfer function from the sequence of commands to the sequence of measurements?

Because the input is a staircase, the answer is exact, not approximate. Feed the plant a unit step, sample the response, and subtract a copy delayed by one sample. A step minus a delayed step is exactly the one-frame rectangle the hold produces:

$$
G(z) = \left(1 - z^{-1}\right)\,\mathcal{Z}\!\left\{\frac{G(s)}{s}\right\},
$$

where $\mathcal{Z}\{\cdot\}$ means "take the continuous signal, sample it, transform the sequence". In code it is easier in state-space form, $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u$. Hold $u$ constant over a frame and integrate exactly:

$$
\mathbf{A}_d = e^{\mathbf{A}T},
\qquad
\mathbf{B}_d = \left(\int_0^T e^{\mathbf{A}\tau}d\tau\right)\mathbf{B},
$$

both from a single **[[matrix exponential|matrix-exponential]]**.

Two properties matter. The poles map exactly by $z = e^{sT}$, as they must. The zeros do not: ZOH equivalence adds **sampling zeros** with no continuous counterpart, because the hold is now part of the model.

::: example The ZOH equivalent of a rigid body, and the zero that comes with it
A single-axis rigid body with moment of inertia $J$ is $P(s) = 1/(J s^2)$. Discretized exactly at $T$:

$$
P(z) = \frac{T^2}{2J}\,\frac{z + 1}{(z-1)^2}.
$$

Check the pieces. Both poles are at $z = 1 = e^{0 \cdot T}$ — the two continuous integrators, mapped exactly. The gain $T^2/2J$ is how far a constant torque $u$ turns the body in one frame, $\tfrac12 (u/J) T^2$, per unit of torque. At $J = 500\,\mathrm{kg\,m^2}$ and $T = 20\,\mathrm{ms}$ that gain is $0.02^2/(2 \times 500) = 4.0 \times 10^{-7}\,\mathrm{rad}$ per $\mathrm{N\,m}$.

The zero at $z = -1$ has no continuous counterpart: $1/(Js^2)$ has no finite zeros at all. It sits on the unit circle, exactly at Nyquist, because the held input pushes on the plant over the whole frame rather than at one instant. It gives the discrete plant a null at Nyquist. A controller cannot cancel it and should not try: the usual attempt, a controller pole at $z = -1$, leaves a hidden mode that flips sign every frame and never dies.

It gets worse with **relative degree** — how many more poles than zeros. For a triple integrator, $1/s^3$, the same computation gives

$$
P(z) = \frac{T^3}{6}\,\frac{z^2 + 4z + 1}{(z-1)^3},
$$

with zeros at $z = -0.2679$ and $z = -3.7321$. The second is *outside* the unit circle: a discrete **[[non-minimum-phase zero|sampling-zeros]]**, manufactured purely by sampling a continuous plant that had none. This is general — a plant with relative degree three or more gets unstable sampling zeros as $T$ shrinks. It is why you cannot invert a discretized plant, and why model-inversion controllers are built on the continuous model and discretized afterward.

For contrast, a first-order lag $1/(\tau s + 1)$ discretizes to

$$
P(z) = \frac{1 - a}{z - a}, \qquad a = e^{-T/\tau},
$$

with no sampling zero and a full $z^{-1}$ of delay: relative degree one plus the hold puts exactly one frame between input and response. At $\tau = 50\,\mathrm{ms}$ and $T = 20\,\mathrm{ms}$: $a = e^{-0.4} = 0.67032$ and $1-a = 0.32968$. Compare the recursive smoother of the z-transform lesson, which had the same pole and no delay. The difference between them is exactly the hold.
:::

## Matched pole-zero

The last method is the most direct reading of the previous lesson: poles map by $z = e^{sT}$, so map them that way.

The recipe:

1. Map every finite pole $p_i$ to $e^{p_i T}$ and every finite zero $q_i$ to $e^{q_i T}$.
2. If there are more poles than zeros, add that many zeros at $z = -1$ (or all but one, if you want a frame of delay for computation).
3. Scale by a constant so the DC gains match, $H(1) = G(0)$.

The zeros at $z = -1$ copy the roll-off. A continuous system with extra poles falls to zero at infinite frequency, and the discrete band ends at Nyquist, where $z = -1$. It is the same reason the ZOH equivalent of $1/s^2$ has a zero there.

Matched pole-zero puts the poles exactly where sampling would, by construction. That suits filters whose pole placement *is* the specification — notches, lead networks, simple lags. It is awkward for improper or delay-bearing systems, and it makes no promise about the response between the mapped points. In the notch table it did as well as prewarped Tustin.

::: key
**Matched pole-zero discretization.** Map every continuous pole and zero by $z = e^{sT}$ and rescale for DC gain. Preserves pole locations exactly; good for simple filters, awkward for improper or delay-bearing systems.
:::

## Which one to use

| Situation | Method | Reason |
| --- | --- | --- |
| Plant model for loop analysis | ZOH equivalence | Exact for a held input; puts the hold in the model once, correctly |
| PID, lead-lag, general compensator | Tustin, prewarped at crossover | Stability preserved, response exact where the margin is read |
| Notch or any high-$Q$ filter | Tustin prewarped at the center, or matched pole-zero | Center frequency must be exact; forward Euler will not even be stable |
| Simple lag, first-order filter | Matched pole-zero or Tustin | Both fine; the pole is the whole specification |
| Anything, at very high sample rate | Any of them, with care over coefficient precision | The methods agree as $T \to 0$; the arithmetic is what breaks |
| Nothing | Forward Euler | Only defensible when $\omega_n T \ll 2\zeta$ for every pole, and then only to save a division |

::: warning Prewarping has limits
Prewarping is not permission to put features near Nyquist. It makes the response exact at $\omega_0$ and leaves the warping everywhere else. A notch prewarped at $80\%$ of Nyquist is right at its center and badly bent on its sides: the upper side is squashed against the edge of the band and the notch turns lopsided. If a feature must sit above about a quarter of the sample rate, raise the sample rate instead.

The other trap is prewarping at the wrong frequency. It is exact at one point only. Choose DC, or keep the default $2/T$, then read margins at crossover, and your design is right where nothing is happening. Pick $\omega_0$ on purpose, and write it in the comment above the coefficient table.
:::

## Check yourself

::: check
An actuator model $1/(\tau s + 1)$ with $\tau = 4\,\mathrm{ms}$ is discretized with forward Euler in a $100\,\mathrm{Hz}$ simulation. What happens, and what is the largest $T$ that works?
:::

::: answer
The continuous pole is at $s = -1/\tau = -250\,\mathrm{s^{-1}}$. Forward Euler puts it at $z = 1 + sT = 1 - 250 \times 0.01 = -1.5$, outside the unit circle. The model blows up, flipping sign every frame and growing by $50\%$ each time.

For a real pole, the condition $|1 + sT| < 1$ gives $0 < T < 2\tau$, so $T < 8\,\mathrm{ms}$, that is $f_s > 125\,\mathrm{Hz}$. But mere stability is not good enough for a model. At $T = 8\,\mathrm{ms}$ the discrete pole is at $z = -1$, oscillating at Nyquist and not decaying at all — nothing like a first-order lag. A usable forward-Euler model needs $T$ well under $\tau$, perhaps $T \le \tau/5 = 0.8\,\mathrm{ms}$, that is $1.25\,\mathrm{kHz}$.

Backward Euler or matched pole-zero handles the same model at $100\,\mathrm{Hz}$ easily. Matched pole-zero puts the pole at $e^{-250 \times 0.01} = 0.0821$, exactly where sampling the continuous response would.
:::

::: check
A lead compensator is designed to give its maximum phase at $\omega = 30\,\mathrm{rad/s}$ and is discretized with plain Tustin at $f_s = 100\,\mathrm{Hz}$. Where does the maximum phase actually appear, and does prewarping at $30\,\mathrm{rad/s}$ move it back?
:::

::: answer
With $T = 0.01\,\mathrm{s}$, the feature designed at $\omega_a = 30\,\mathrm{rad/s}$ appears at

$$
\omega = \frac{2}{T}\arctan\!\left(\frac{\omega_a T}{2}\right) = 200\arctan(0.15) = 200 \times 0.148890 = 29.778\,\mathrm{rad/s}.
$$

That is a shift of $0.222\,\mathrm{rad/s}$, or $0.74\%$ — negligible for a lead network, whose phase peak is broad. Prewarping at $30\,\mathrm{rad/s}$ moves it back exactly, by replacing $2/T = 200$ with $30/\tan(0.15) = 30/0.151135 = 198.50$. Here the correction is not worth arguing about.

The contrast with the notch example is the point. Warping error grows like the tangent. At $\omega T/2 = 0.15$ it is under $1\%$. At $\omega T/2 = 0.94$ (the $60\,\mathrm{Hz}$ notch at $200\,\mathrm{Hz}$) it is $20\%$. Prewarping matters when the feature is a sizable fraction of Nyquist and sharp — both true of a notch, neither true of a lead network well below crossover.
:::

::: check
Why is ZOH equivalence the right choice for the plant but not for the controller?
:::

::: answer
ZOH equivalence answers "what does the sequence of held commands do to the sampled measurement?" That is exactly the plant's role in a digital loop: its input really is a staircase, and its output really is sampled. The result is exact, and it builds the hold's half-sample lag into the model automatically, so the loop analysis needs no extra delay factor.

The controller is the opposite case. Its input is already a sequence, and so is its output — there is no hold inside the controller to model. Applying ZOH equivalence to a compensator adds a spurious frame of delay (the hold's), bends the design for no reason, and for an improper element such as a pure derivative is not even defined. What you want from a controller discretization is a frequency response that matches the design where the margins were read. Prewarped Tustin delivers that.
:::

::: check
A $50\,\mathrm{Hz}$ loop controls a plant with a fast actuator pole at $s = -400\,\mathrm{s^{-1}}$. You discretize the plant with ZOH equivalence. Where does that pole land, and what does its location tell you?
:::

::: answer
$z = e^{sT} = e^{-400 \times 0.02} = e^{-8} = 3.35 \times 10^{-4}$. The pole is essentially at the origin of the $z$ plane.

In terms of motion, the actuator settles in far less than one frame: by the next sample its transient is $e^{-8} = 0.03\%$ of where it started. At this rate it is indistinguishable from a pure gain plus the hold's delay, and you could drop it from the model — the "quasi-steady" simplification that keeps flight models small.

In terms of numbers, the discrete model barely cares where this pole is. Any value between $10^{-5}$ and $10^{-3}$ gives the same behavior, so measuring the actuator time constant from $50\,\mathrm{Hz}$ data is hopeless. If you need it, measure with faster instruments. This is the mirror image of the high-rate problem, where every pole crowds against $z = 1$ and small coefficient errors move it a long way.
:::

::: check
Show that Tustin preserves DC gain for any continuous transfer function, and explain why that makes a useful implementation check.
:::

::: answer
DC in the discrete world is $z = 1$. Put $z = 1$ into the Tustin substitution:

$$
s \;\leftarrow\; \frac{2}{T}\,\frac{1 - 1}{1 + 1} = 0.
$$

So the discrete transfer function at $z = 1$ equals the continuous one at $s = 0$, whatever it is. Prewarped Tustin keeps this, since only the constant in front changes and it multiplies zero. Both Eulers share it too, because $(z-1)/T$ and $(z-1)/(Tz)$ are also zero at $z = 1$.

It is a useful check because $H(1) = \sum b_k/(1 + \sum a_k)$ (with $a_0 = 1$ left out of the sum) is one line of arithmetic on the coefficient table. It catches copying errors, sign errors and scaling errors at once. In the notch example the prewarped coefficients give $\sum b = 2.199638$ and $1 + \sum a = 2.199638$, so $H(1) = 1$ to every digit carried — as a unity-gain notch must. What it does not catch is warping: plain Tustin put the notch at $48\,\mathrm{Hz}$, and its DC gain was still exactly 1.
:::

## Summary

| Method | Substitution | Stability | Character |
| --- | --- | --- | --- |
| Forward Euler | $s \to (z-1)/T$ | Not preserved: unstable when $\omega_n T > 2\zeta$ | Cheapest, dangerous on high-$Q$ poles |
| Backward Euler | $s \to (z-1)/(Tz)$ | Always stable, even for unstable plants | Squeezes the half plane into $\lvert z - \frac12\rvert = \frac12$; flattens resonances |
| Tustin | $s \to \frac{2}{T}\frac{z-1}{z+1}$ | Left half plane onto the unit disk, exactly | Shape kept, frequency axis warped by $\omega_a = \frac{2}{T}\tan(\omega T/2)$ |
| Tustin prewarped | $s \to \frac{\omega_0}{\tan(\omega_0T/2)}\frac{z-1}{z+1}$ | Same as Tustin | Exact at $\omega_0$; choose the notch center or crossover |
| ZOH equivalence | $G(z) = (1-z^{-1})\mathcal{Z}\{G(s)/s\}$ | Exact for a held input | Poles map by $e^{sT}$; adds sampling zeros, possibly unstable ones |
| Matched pole-zero | $p \to e^{pT}$, $q \to e^{qT}$, extra zeros at $z = -1$, rescale for DC | Preserved | Exact pole locations; awkward for improper or delayed systems |

All of these preserve DC gain, so $H(1)$ is a fast consistency check but not a correctness check. The next lesson adds the effect none of these methods models: the flight computer takes time to produce its answer, and where that time shows up in the loop is a design decision, not an accident.

::: context euler-steps Three ways to step forward
Leonhard Euler described the step-by-step method for solving differential equations in his calculus textbook of the 1760s, which is why both forward and backward rules carry his name.

The difference is which slope you trust. Forward Euler looks at the slope where you are and walks along it — cheap, but it overshoots on a curve. Backward Euler uses the slope where you will land, which means solving for where that is. The trapezoidal rule averages the two, and its error shrinks much faster as the step gets smaller: halve $T$ and the trapezoid's error per unit time falls about four times, while Euler's only halves.
:::

::: context pade Fractions that imitate functions
A Taylor series copies a function with a polynomial: $e^x \approx 1 + x$. A Padé approximation copies it with a *ratio* of polynomials instead, named after the French mathematician Henri Padé, who studied them in the 1890s.

Ratios are much better at copying functions that behave well out to infinity. $(1 + x/2)/(1 - x/2)$ matches $e^x$ as closely as $1 + x + x^2/2$ near zero, but it also has size exactly 1 whenever $x$ is purely imaginary — as $e^{j\theta}$ does. That shared property is the whole reason Tustin preserves stability.
:::

::: context stability-regions Where the left half plane lands
Each panel shows the unit circle and, shaded, where the method sends the whole stable left half of the $s$ plane. Forward Euler's region spills far outside the circle. Backward Euler's is a small disk tucked inside, touching $z = 0$ and $z = 1$. Tustin's fills the unit disk exactly.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="45" width="90" height="100" fill="#f2b880" opacity="0.7"/>
  <line x1="100" y1="40" x2="100" y2="150" stroke="#b4232c" stroke-width="1.5"/>
  <circle cx="60" cy="95" r="40" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="10" y1="95" x2="115" y2="95" stroke="#1f2a44" stroke-width="0.8"/>
  <text x="60" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">Forward Euler</text>
  <text x="104" y="160" font-size="11" fill="#b4232c">Re z = 1</text>
  <circle cx="180" cy="95" r="40" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="200" cy="95" r="20" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="130" y1="95" x2="235" y2="95" stroke="#1f2a44" stroke-width="0.8"/>
  <text x="180" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">Backward Euler</text>
  <circle cx="300" cy="95" r="40" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="250" y1="95" x2="355" y2="95" stroke="#1f2a44" stroke-width="0.8"/>
  <text x="300" y="30" font-size="12" fill="#1f2a44" text-anchor="middle">Tustin</text>
  <text x="255" y="160" font-size="11" fill="#1f2a44" text-anchor="middle">each circle: |z| = 1</text>
</svg>
```
:::

::: context quality-factor How sharp is a resonance?
The quality factor $Q = 1/(2\zeta)$ says how sharply a system rings. A wine glass that sings for seconds when tapped has a very high $Q$; a pillow has almost none. A pole pair with $\zeta = 0.2$ has $Q = 2.5$; with $\zeta = 0.01$, $Q = 50$.

High $Q$ means the poles sit close to the imaginary axis. That is exactly the region forward Euler handles worst, because its safe disk touches the imaginary axis only at the origin.
:::

::: context notch What a notch filter is for
A launch vehicle is long and thin, and it bends like a flexible ruler at particular frequencies, its **bending modes**. The gyros feel that bending and would feed it into the control loop, which could then pump it up.

A notch filter removes a narrow band of frequencies — like cutting a single note out of a song — and leaves the rest nearly untouched. Placed at the bending frequency, it keeps the loop from seeing the flex. Because the band is narrow, a notch that lands even a few hertz off target does almost nothing, which is why warping matters so much here.
:::

::: context conformal What "conformal" promises
A conformal map keeps small angles the same: two tiny lines crossing at $30^\circ$ still cross at $30^\circ$ after the map, even though lengths stretch. Maps drawn by complex functions like $(1 + sT/2)/(1 - sT/2)$ have this property wherever their derivative is not zero.

For Tustin it means the local *shape* of the pole-zero pattern survives. A tight notch stays a tight notch; only its position along the frequency axis shifts.
:::

::: context warping-curve The warping curve at 200 Hz
The blue curve is where a feature designed at the continuous frequency (across) shows up in plain Tustin at $f_s = 200\,\mathrm{Hz}$ (up). The dashed line is "no warping". Low frequencies track well; higher ones bend down, and even a $200\,\mathrm{Hz}$ design only reaches about $80\,\mathrm{Hz}$. The $60\,\mathrm{Hz}$ notch lands at $48.1\,\mathrm{Hz}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="335" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="30" x2="330" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="50" y1="170" x2="190" y2="30" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <path d="M50.0,170.0 L57.0,163.0 L64.0,156.1 L71.0,149.4 L78.0,142.9 L85.0,136.6 L92.0,130.8 L99.0,125.2 L106.0,120.0 L113.0,115.2 L120.0,110.7 L127.0,106.5 L134.0,102.6 L141.0,99.1 L148.0,95.8 L155.0,92.7 L162.0,89.9 L169.0,87.3 L176.0,84.9 L183.0,82.6 L190.0,80.5 L197.0,78.6 L204.0,76.8 L211.0,75.1 L218.0,73.5 L225.0,72.0 L232.0,70.6 L239.0,69.3 L246.0,68.0 L253.0,66.9 L260.0,65.8 L267.0,64.7 L274.0,63.8 L281.0,62.8 L288.0,61.9 L295.0,61.1 L302.0,60.3 L309.0,59.5 L316.0,58.8 L323.0,58.1 L330.0,57.5" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="134" y1="170" x2="134" y2="102.6" stroke="#b4232c" stroke-width="1" stroke-dasharray="2 2"/>
  <line x1="50" y1="102.6" x2="134" y2="102.6" stroke="#b4232c" stroke-width="1" stroke-dasharray="2 2"/>
  <circle cx="134" cy="102.6" r="3.5" fill="#b4232c"/>
  <text x="140" y="118" font-size="11" fill="#b4232c">60 → 48.1 Hz</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="184">0</text><text x="120" y="184">50</text><text x="190" y="184">100</text><text x="260" y="184">150</text><text x="330" y="184">200</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="174">0</text><text x="45" y="104">50</text><text x="45" y="34">100</text>
  </g>
  <text x="330" y="24" font-size="11" fill="#6c7a93" text-anchor="end">Nyquist, 100 Hz</text>
  <text x="192" y="198" font-size="11" fill="#1f2a44" text-anchor="middle">design frequency (Hz)</text>
</svg>
```
:::

::: context matrix-exponential One exponential for a whole system
For a single number, $e^{aT}$ says how much a state grows or shrinks over time $T$. For a system of several states that push on each other, the matrix exponential $e^{\mathbf{A}T}$ does the same job all at once: multiply today's state vector by it and you get the state one frame later, exactly, when no input acts.

Numerical libraries compute it directly — `scipy.linalg.expm` in Python — and `scipy.signal.cont2discrete` with `method='zoh'` builds $\mathbf{A}_d$ and $\mathbf{B}_d$ for you. The state-space module comes back to it as the general solution of $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u$.
:::

::: context sampling-zeros A zero outside the circle
A zero outside the unit circle is called non-minimum-phase. Its signature is a first move in the wrong direction: push the input one way and the output starts off the other way before coming around. An inverse of such a plant would need an unstable pole, which is why exact inversion fails.

The triple integrator's two sampling zeros sit on the negative real axis, one inside the circle and one far outside. Karl Johan Åström, Per Hagander and Jan Sternby showed in 1984 that this happens for any plant with relative degree three or more once the sampling is fast enough.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 132" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="60" x2="345" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M198.4,60 A52.6,52.6 0 0,1 303.7,60" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <path d="M198.4,60 A52.6,52.6 0 0,0 303.7,60" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="54.6" cy="60" r="5" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <circle cx="236.9" cy="60" r="5" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1"><line x1="198.4" y1="55" x2="198.4" y2="65"/><line x1="251.1" y1="55" x2="251.1" y2="65"/><line x1="303.7" y1="55" x2="303.7" y2="65"/></g>
  <text x="54.6" y="86" font-size="11" fill="#b4232c" text-anchor="middle">−3.73</text>
  <text x="236.9" y="86" font-size="11" fill="#1f2a44" text-anchor="middle">−0.27</text>
  <text x="198.4" y="127" font-size="11" fill="#1f2a44" text-anchor="middle">−1</text>
  <text x="251.1" y="127" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="303.7" y="127" font-size="11" fill="#1f2a44" text-anchor="middle">1</text>
  <text x="30" y="40" font-size="11" fill="#b4232c">outside the unit circle</text>
</svg>
```
:::
