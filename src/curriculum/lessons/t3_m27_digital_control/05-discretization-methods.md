---
id: l05-discretization-methods
title: Discretization methods
minutes: 22
covers:
  - 'Discretization methods: forward and backward Euler, Tustin, Tustin with prewarping, ZOH equivalence, matched pole-zero'
---

You have a controller in continuous form: a PID with a filtered derivative, a lead network, a notch at a bending mode. It was designed in the $s$ plane, its margins were read off a Bode plot, and now it has to become a difference equation. Something has to substitute for $s$.

The honest map is $z = e^{sT}$, from the previous lesson. It cannot be used directly, because substituting $s = \ln(z)/T$ into a rational function of $s$ produces something that is not a ratio of polynomials in $z$ and therefore not a difference equation. Every practical method is an approximation to that exponential, or an exact equivalence of a different kind, and each one distorts the design in its own way.

The distortions are not academic. One of these methods will take a notch you designed for a $60\,\mathrm{Hz}$ bending mode and put it at $48\,\mathrm{Hz}$, leaving the mode untouched. Another will take a perfectly stable filter and make it diverge. A third will flatten a $20\,\mathrm{dB}$ notch to $1.75\,\mathrm{dB}$. All three are in production code somewhere. This lesson derives the five methods that matter, shows the damage each does with numbers, and tells you which to reach for.

## Each method is a substitution

Four of the five methods amount to substituting an expression in $z$ for $s$ in the continuous transfer function. They come from different places — numerical integration rules, or rational approximations to the exponential — and they land in different places.

Start from integration, since an integrator $1/s$ is the only element that needs approximating. **Forward (explicit) Euler** takes the derivative at the left of the step, $x[n+1] = x[n] + T\dot{x}[n]$, so $\dot{x} \leftrightarrow (z-1)/T$ and

$$
s \;\leftarrow\; \frac{z - 1}{T},
\qquad\text{equivalently}\qquad
z = 1 + sT,
$$

which you can also read as the first two terms of $e^{sT} = 1 + sT + (sT)^2/2 + \cdots$.

**Backward (implicit) Euler** takes the derivative at the right of the step, $x[n] = x[n-1] + T\dot{x}[n]$, so

$$
s \;\leftarrow\; \frac{z - 1}{Tz} = \frac{1 - z^{-1}}{T},
\qquad
z = \frac{1}{1 - sT}.
$$

**Tustin**, also called the bilinear or trapezoidal transform, integrates with the trapezoidal rule, $x[n] = x[n-1] + \tfrac{T}{2}(\dot{x}[n] + \dot{x}[n-1])$:

$$
s \;\leftarrow\; \frac{2}{T}\,\frac{z - 1}{z + 1},
\qquad
z = \frac{1 + sT/2}{1 - sT/2}.
$$

That last form is the first-order Padé approximation of the exponential: split it as $e^{sT} = e^{sT/2}/e^{-sT/2}$ and truncate both halves after the linear term. Symmetric truncation is why Tustin behaves so much better than either Euler.

The three differ in how they distort the stability boundary, and that is the whole story.

## Forward Euler maps the left half plane outside the circle

Under $z = 1 + sT$, the imaginary axis $s = j\omega$ maps to the vertical line $\mathrm{Re}(z) = 1$, and the entire left half plane maps to the half plane $\mathrm{Re}(z) < 1$. That half plane contains the unit disk, but it is far larger: a continuous pole lands inside the unit circle only if $|1 + sT| < 1$, which confines $sT$ to a disk of radius 1 centred at $-1$. Everything else — every stable continuous pole fast enough or lightly damped enough to fall outside that little disk — comes out unstable.

Make it quantitative for the case that matters. Take a continuous pole pair with natural frequency $\omega_n$ and damping $\zeta$, so $s = \omega_n(-\zeta \pm j\sqrt{1-\zeta^2})$. Then

$$
|z|^2 = (1 - \zeta\omega_n T)^2 + \omega_n^2T^2(1-\zeta^2)
= 1 - 2\zeta\,\omega_n T + (\omega_n T)^2 ,
$$

so the discretised pair is unstable whenever

$$
\omega_n T > 2\zeta .
$$

Read that as a sample-rate requirement: forward Euler needs $f_s > \omega_n/(2\zeta) = \omega_n Q$, with $\omega_n$ in $\mathrm{rad/s}$ and $Q = 1/(2\zeta)$ the quality factor. Lightly damped poles are exactly where it fails, and lightly damped poles are exactly what a notch filter is built from. A notch at $60\,\mathrm{Hz}$ with $\zeta_d = 0.2$ has $\omega_n = 377\,\mathrm{rad/s}$ and $Q = 2.5$, so forward Euler would need $f_s > 942\,\mathrm{Hz}$ — five times the rate the loop actually runs.

::: key
**Why forward Euler is dangerous.** $z = 1 + sT$ maps stable continuous poles outside the unit circle once $|sT|$ is large. For a pole pair $(\zeta, \omega_n)$ the discrete pair is unstable when $\omega_n T > 2\zeta$: high-$Q$ notch poles and fast actuator poles break first. Backward Euler is always stable but distorts badly.
:::

## Backward Euler is always stable and rarely right

Under $z = 1/(1 - sT)$, the imaginary axis maps to the circle $|z - \tfrac12| = \tfrac12$ — check the endpoints: $\omega = 0$ gives $z = 1$ and $\omega \to \infty$ gives $z \to 0$, both on that circle. The whole left half plane squeezes into that small disk, entirely inside the unit circle. A stable continuous system therefore always produces a stable discrete one, which is the method's one virtue and the reason it survives.

The cost is visible in the same picture. An infinite half plane compressed into a disk of radius $\tfrac12$ cannot preserve much: frequencies are pulled towards DC, damping is inflated, and resonant features are flattened. Worse, the map is not one-to-one from the left half plane alone — part of the *right* half plane also lands inside the unit circle. With $T = 20\,\mathrm{ms}$, a continuous pole at $s = +200\,\mathrm{s^{-1}}$, violently unstable, maps to $z = 1/(1 - 4) = -0.333$, comfortably stable. Backward Euler applied to an unstable plant model can produce a discrete model that says the plant is fine.

Use it for a first-order anti-windup filter where nothing depends on accuracy, or when an unconditional stability guarantee is worth more than fidelity. Do not use it for anything with a resonance.

## Tustin maps the left half plane exactly onto the unit disk

Substitute $s = j\omega_a$ into $z = (1 + sT/2)/(1 - sT/2)$. Numerator and denominator are complex conjugates, so $|z| = 1$ for every $\omega_a$: the imaginary axis maps onto the unit circle, all of it, exactly once. For $\mathrm{Re}(s) < 0$ the numerator is strictly smaller in magnitude than the denominator, so $|z| < 1$. The map is a conformal bijection from the open left half plane onto the open unit disk.

Stability is therefore preserved in both directions, always, at any sample rate. That is why Tustin is the default for controllers and filters.

::: key
**Tustin (bilinear) transform.** $s \to \dfrac{2}{T}\dfrac{z-1}{z+1}$. Maps the whole open left half plane into the open unit disk, so stability is always preserved. Cost: frequency warping.
:::

## Frequency warping, and how to undo it at one frequency

Something has to give when an infinite axis is wrapped onto a finite circle, and what gives is the frequency scale. Put $z = e^{j\omega T}$ — the discrete frequency — and $s = j\omega_a$ — the continuous frequency whose response appears there — into the substitution:

$$
j\omega_a = \frac{2}{T}\,\frac{e^{j\omega T} - 1}{e^{j\omega T} + 1}
= \frac{2}{T}\,\frac{e^{j\omega T/2} - e^{-j\omega T/2}}{e^{j\omega T/2} + e^{-j\omega T/2}}
= \frac{2}{T}\,j\tan\!\left(\frac{\omega T}{2}\right),
$$

using the same half-angle factoring as the zero-order hold. So

$$
\omega_a = \frac{2}{T}\tan\!\left(\frac{\omega T}{2}\right),
\qquad
\omega = \frac{2}{T}\arctan\!\left(\frac{\omega_a T}{2}\right).
$$

The discrete filter's response at $\omega$ equals the continuous filter's response at $\omega_a$. For small $\omega T$ the tangent is nearly its argument and $\omega_a \approx \omega$ — no harm done. As $\omega$ approaches Nyquist, $\omega T/2$ approaches $\pi/2$ and $\omega_a \to \infty$: the entire infinite continuous axis is crammed into the last part of the band. A feature designed at $\omega_a$ therefore *appears* at the lower frequency $\omega = (2/T)\arctan(\omega_a T/2)$, and the higher the design frequency relative to the sample rate, the worse the compression.

The repair is a change of the constant in front. Replace $2/T$ by whatever value makes the map exact at one chosen frequency $\omega_0$:

$$
s \;\leftarrow\; \frac{\omega_0}{\tan(\omega_0 T/2)}\,\frac{z - 1}{z + 1} .
$$

This is **Tustin with prewarping**. At $\omega = \omega_0$ the substitution returns exactly $j\omega_0$, so the discrete response at $\omega_0$ equals the continuous response at $\omega_0$. Everywhere else it is still warped, slightly differently. You get one frequency for free, so spend it where it matters: the notch centre for a notch, the crossover frequency for a compensator.

::: key
**Tustin with prewarping.** $s \to \dfrac{\omega_0}{\tan(\omega_0 T/2)}\dfrac{z-1}{z+1}$. Makes the discrete response exact at the single frequency $\omega_0$ — use the notch centre or the crossover frequency.
:::

::: example Five discretizations of one notch
Take the notch from the classical control module in its standard form,

$$
N(s) = \frac{s^2 + 2\zeta_n\omega_m s + \omega_m^2}{s^2 + 2\zeta_d\omega_m s + \omega_m^2},
$$

aimed at a $60\,\mathrm{Hz}$ bending mode: $\omega_m = 2\pi \cdot 60 = 376.99\,\mathrm{rad/s}$, $\zeta_n = 0.02$, $\zeta_d = 0.2$, so the depth is $\zeta_n/\zeta_d = 0.1$, that is $-20\,\mathrm{dB}$. Discretize it at $f_s = 200\,\mathrm{Hz}$, five ways, and measure what actually came out by sweeping the unit circle.

| Method | Notch centre | Depth | Largest pole radius |
| --- | --- | --- | --- |
| Forward Euler | none | none | $1.949$ — unstable |
| Backward Euler | $49.49\,\mathrm{Hz}$ | $-1.75\,\mathrm{dB}$ | $0.434$ |
| Tustin | $48.12\,\mathrm{Hz}$ | $-20.00\,\mathrm{dB}$ | $0.817$ |
| Tustin, prewarped at $\omega_m$ | $60.00\,\mathrm{Hz}$ | $-20.00\,\mathrm{dB}$ | $0.825$ |
| Matched pole-zero | $60.00\,\mathrm{Hz}$ | $-20.08\,\mathrm{dB}$ | $0.686$ |

Every row is predictable from the theory above.

Forward Euler fails the criterion by a wide margin: $\omega_m T = 376.99 \times 0.005 = 1.885$ against $2\zeta_d = 0.4$. The poles come out at radius $1.949$ and the filter diverges, roughly doubling in amplitude every sample. This is a filter whose continuous version is unconditionally stable, made unstable by the act of writing it down as a difference equation.

Backward Euler is stable, as advertised, and useless: the notch is now $1.75\,\mathrm{dB}$ deep instead of $20$, so a bending mode passing through it is attenuated by $18\%$ rather than $90\%$. No stability check catches this.

Plain Tustin preserves the shape exactly, including the $-20\,\mathrm{dB}$ depth, and puts it at the wrong frequency. The warping formula predicts it: the notch designed at $376.99\,\mathrm{rad/s}$ appears at $(2/T)\arctan(\omega_m T/2) = 400 \times \arctan(0.94248) = 302.32\,\mathrm{rad/s} = 48.12\,\mathrm{Hz}$. A $60\,\mathrm{Hz}$ mode meets this filter at $60\,\mathrm{Hz}$, where the response has already climbed back to nearly unity, and is not attenuated at all. Meanwhile the loop has paid the notch's full phase cost, and paid it in the wrong place.

Prewarping fixes it with one number. The coefficient becomes $\omega_m/\tan(\omega_m T/2) = 376.99/1.3764 = 273.90$ instead of $2/T = 400$, and the notch lands on $60.000\,\mathrm{Hz}$. The resulting biquad, normalised to $a_0 = 1$, is

$$
b = [\,0.856168,\ 0.519264,\ 0.824206\,],
\qquad
a = [\,1,\ 0.519264,\ 0.680374\,],
$$

whose DC gain $\sum b/\sum a = 1.000000$ confirms the coefficients are consistent.

Matched pole-zero gets the centre right too, and its depth comes out $0.08\,\mathrm{dB}$ deeper than asked, which is within anyone's tolerance.

One caution about the table. The forward-Euler row announces itself immediately, but the backward-Euler and plain-Tustin rows produce filters that run happily forever and do not do the job. The test that catches them is to sweep the *discrete* filter around the unit circle and plot what you actually built, never to assume the discretization delivered the design.
:::

## ZOH equivalence: exact, and for the plant

The methods above approximate a continuous transfer function by a discrete one. **ZOH equivalence** asks a different and more precise question: given that the plant is driven by a zero-order hold and sampled at the output, what is the *exact* transfer function from the command sequence to the measurement sequence?

Because the input is piecewise constant, the answer is exact rather than approximate. Feed the plant a unit step, sample the response, and subtract a version delayed one sample — a step minus a delayed step is exactly the rectangular pulse the hold produces:

$$
G(z) = \left(1 - z^{-1}\right)\,\mathcal{Z}\!\left\{\frac{G(s)}{s}\right\},
$$

where $\mathcal{Z}\{\cdot\}$ means "take the continuous signal, sample it, transform the sequence". Equivalently, and more usefully in code: put the plant in state-space form $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u$, hold $u$ constant over a frame, and integrate exactly to get

$$
\mathbf{A}_d = e^{\mathbf{A}T},
\qquad
\mathbf{B}_d = \left(\int_0^T e^{\mathbf{A}\tau}d\tau\right)\mathbf{B},
$$

both computed from a single matrix exponential.

Two properties matter in practice. The poles map exactly by $z = e^{sT}$, as they must. And the zeros do not: ZOH equivalence introduces **sampling zeros** with no continuous counterpart, because the hold's dynamics are now part of the model.

::: example The ZOH equivalent of a rigid body, and the zero that comes with it
A single-axis rigid body is $P(s) = 1/(J s^2)$. Discretize it exactly at $T$:

$$
P(z) = \frac{T^2}{2J}\,\frac{z + 1}{(z-1)^2}.
$$

Check the pieces. Both poles are at $z = 1$, which is $e^{0 \cdot T}$ — the two continuous integrators, mapped exactly. The gain $T^2/2J$ is the displacement a constant torque produces in one frame, $\tfrac12 (u/J) T^2$, which is what a held input does to a double integrator. At $J = 500\,\mathrm{kg\,m^2}$ and $T = 20\,\mathrm{ms}$, that gain is $4.0 \times 10^{-7}\,\mathrm{rad}$ per $\mathrm{N\,m}$.

The zero at $z = -1$ has no continuous counterpart: $1/(Js^2)$ has no finite zeros at all. It is on the unit circle, at exactly Nyquist, and it is there because the held input excites the plant over the whole frame rather than at an instant. Its practical effect is that the discrete plant has a null at Nyquist, so a controller cannot cancel it and should not try — the usual attempt, a pole at $z = -1$ in the controller to cancel the zero, produces an uncontrollable alternating mode.

It gets worse with relative degree. For a triple integrator, $1/s^3$, the same computation gives

$$
P(z) = \frac{T^3}{6}\,\frac{z^2 + 4z + 1}{(z-1)^3},
$$

with zeros at $z = -0.2679$ and $z = -3.7321$. The second is *outside* the unit circle: a discrete non-minimum-phase zero, manufactured purely by sampling a perfectly minimum-phase continuous plant. This is a general result — a plant with relative degree three or more acquires unstable sampling zeros as $T$ shrinks — and it is the reason you cannot invert a discretized plant, and the reason model-inversion controllers are built on the continuous model and discretized afterwards rather than the other way round.

For comparison, a first-order lag $1/(\tau s + 1)$ discretizes to

$$
P(z) = \frac{1 - a}{z - a}, \qquad a = e^{-T/\tau},
$$

with no sampling zero at all and a full $z^{-1}$ of delay, because relative degree one plus the hold puts exactly one frame between input and response. At $\tau = 50\,\mathrm{ms}$ and $T = 20\,\mathrm{ms}$: $a = 0.67032$, $1-a = 0.32968$. Compare this with the recursive smoother of the z-transform lesson, which had the same pole and no delay — the difference between them is precisely the hold.
:::

## Matched pole-zero

The last method is the most direct reading of the previous lesson: since poles map by $z = e^{sT}$, map them that way and be done.

The recipe: map every finite pole $p_i$ to $e^{p_i T}$ and every finite zero $q_i$ to $e^{q_i T}$; if there are more poles than zeros, add that many zeros at $z = -1$ (or all but one, if you want a frame of delay for computation); then scale by a constant so the DC gains match, $H(1) = G(0)$.

The zeros at $z = -1$ reproduce the roll-off: a continuous system with surplus poles falls to zero at infinite frequency, and the discrete band ends at Nyquist, where $z = -1$. It is the same reasoning that gave the ZOH equivalent of $1/s^2$ a zero there.

Matched pole-zero is exact in pole locations by construction, which is its appeal for filters whose pole placement *is* the specification — notches, lead networks, simple lags. It is awkward for improper or delay-bearing systems, and it has no claim to exactness between the mapped points. In the notch table it performed as well as prewarped Tustin.

::: key
**Matched pole-zero discretization.** Map every continuous pole and zero by $z = e^{sT}$ and rescale for DC gain. Preserves pole locations exactly; good for simple filters, awkward for improper or delay-bearing systems.
:::

## Which one to use

| Situation | Method | Reason |
| --- | --- | --- |
| Plant model for loop analysis | ZOH equivalence | Exact for a held input; puts the hold in the model once, correctly |
| PID, lead-lag, general compensator | Tustin, prewarped at crossover | Stability preserved, response exact where the margin is read |
| Notch or any high-$Q$ filter | Tustin prewarped at the centre, or matched pole-zero | Centre frequency must be exact; forward Euler will not even be stable |
| Simple lag, first-order filter | Matched pole-zero or Tustin | Both fine; the pole is the whole specification |
| Anything, at very high sample rate | Any of them, with attention to coefficient precision | The methods converge as $T \to 0$; the arithmetic is what breaks |
| Nothing | Forward Euler | Only defensible when $\omega_n T \ll 2\zeta$ for every pole, and then only to save a division |

::: warning
Prewarping is not a licence to place features near Nyquist. Prewarping makes the response exact at $\omega_0$ and leaves the warping everywhere else, so a notch prewarped at $80\%$ of Nyquist is correct at its centre and badly distorted on its skirts — the upper skirt is compressed against the edge of the band and the notch becomes asymmetric. If a feature needs to sit above about a quarter of the sample rate, raise the sample rate instead.

The other trap is prewarping at the wrong frequency. A prewarped transform is exact at one point only; choosing DC, or the default $2/T$, and then reading margins at crossover gives you a design that is right where nothing is happening. Pick $\omega_0$ deliberately, and write it in the comment above the coefficient table.
:::

## Check yourself

::: check
An actuator model $1/(\tau s + 1)$ with $\tau = 4\,\mathrm{ms}$ is discretized with forward Euler in a $100\,\mathrm{Hz}$ simulation. What happens, and what is the highest $T$ that works?
:::

::: answer
The continuous pole is at $s = -1/\tau = -250\,\mathrm{s^{-1}}$. Forward Euler puts it at $z = 1 + sT = 1 - 250 \times 0.01 = -1.5$, outside the unit circle: the model diverges, alternating sign every frame and growing by $50\%$ each time.

For a real pole the condition $|1 + sT| < 1$ gives $0 < T < 2\tau$, so $T < 8\,\mathrm{ms}$, that is $f_s > 125\,\mathrm{Hz}$. But stability is not the standard you want for a model: at $T = 8\,\mathrm{ms}$ the discrete pole is at $z = -1$, oscillating at Nyquist and not decaying at all, which is nothing like a first-order lag. A usable forward-Euler discretization needs $T$ well under $\tau$, perhaps $T \le \tau/5 = 0.8\,\mathrm{ms}$, that is $1.25\,\mathrm{kHz}$. Backward Euler or matched pole-zero handles the same model at $100\,\mathrm{Hz}$ without difficulty: matched pole-zero puts the pole at $e^{-250 \times 0.01} = 0.0821$, exactly where sampling the continuous response would put it.
:::

::: check
A lead compensator is designed to contribute its maximum phase at $\omega = 30\,\mathrm{rad/s}$ and is discretized with plain Tustin at $f_s = 100\,\mathrm{Hz}$. At what frequency does the maximum phase actually appear, and does prewarping at $30\,\mathrm{rad/s}$ move it back?
:::

::: answer
With $T = 0.01\,\mathrm{s}$, the feature designed at $\omega_a = 30\,\mathrm{rad/s}$ appears at

$$
\omega = \frac{2}{T}\arctan\!\left(\frac{\omega_a T}{2}\right) = 200\arctan(0.15) = 200 \times 0.148890 = 29.778\,\mathrm{rad/s}.
$$

A shift of $0.74\%$, or $0.222\,\mathrm{rad/s}$ — negligible for a lead network, whose phase peak is broad. Prewarping at $30\,\mathrm{rad/s}$ moves it back exactly, by replacing $2/T = 200$ with $30/\tan(0.15) = 30/0.151135 = 198.50$, but the correction is not worth arguing about here.

The contrast with the notch example is the point. Warping error grows as $\tan$: at $\omega T/2 = 0.15$ it is under $1\%$, at $\omega T/2 = 0.94$ (the $60\,\mathrm{Hz}$ notch at $200\,\mathrm{Hz}$) it is $20\%$. Prewarping matters when the feature is a sizeable fraction of Nyquist and when its frequency is sharp — both true of a notch, neither true of a lead network well below crossover.
:::

::: check
Why is ZOH equivalence the right choice for the plant but not for the controller?
:::

::: answer
ZOH equivalence answers the question "what does the sequence of held commands do to the sampled measurement", which is exactly the plant's role in a digital loop: its input genuinely is a staircase and its output genuinely is sampled. The result is exact, and it embeds the hold's half-sample lag in the model automatically, so the loop analysis needs no extra delay factor.

The controller's situation is the opposite. Its input is already a sequence and its output is already a sequence — there is no hold inside the controller to model. Applying ZOH equivalence to a compensator adds a spurious frame of delay (the hold's), distorts the design for no reason, and, for an improper element such as a derivative, is not even defined. What you want from a controller discretization is that the frequency response match the design where the margins were read, which is what prewarped Tustin delivers.
:::

::: check
A $50\,\mathrm{Hz}$ loop controls a plant with a fast actuator pole at $s = -400\,\mathrm{s^{-1}}$. You discretize the plant with ZOH equivalence. Where does that pole land, and what does its location tell you about the model?
:::

::: answer
$z = e^{sT} = e^{-400 \times 0.02} = e^{-8} = 3.35 \times 10^{-4}$. The pole is essentially at the origin of the $z$ plane.

Two readings follow. Dynamically, the actuator settles in far less than one frame: by the time the next sample is taken, its transient is $e^{-8} = 0.03\%$ of its initial value. The discrete model is telling you that at this sample rate the actuator is indistinguishable from a pure gain plus the hold's delay, and you could drop it from the model with no consequence for the loop — the quasi-steady reduction that keeps flight models small.

Numerically, the pole is where the discrete model has almost no sensitivity: any value between $10^{-5}$ and $10^{-3}$ produces the same behaviour, so identifying the actuator time constant from $50\,\mathrm{Hz}$ data is hopeless. If you need that parameter, measure it with faster instrumentation. This is the mirror image of the high-sample-rate problem, where every pole crowds against $z = 1$ and small coefficient errors move it a long way.
:::

::: check
Show that Tustin preserves DC gain for any continuous transfer function, and explain why that makes it a useful implementation check.
:::

::: answer
DC in the discrete domain is $z = 1$. Substituting $z = 1$ into the Tustin replacement gives

$$
s \;\leftarrow\; \frac{2}{T}\,\frac{1 - 1}{1 + 1} = 0,
$$

so the discrete transfer function at $z = 1$ equals the continuous transfer function at $s = 0$, whatever that function is. The same holds for prewarped Tustin, since only the constant in front changes and it multiplies zero. Backward Euler shares the property, for the same reason; forward Euler does too, since $s \leftarrow (z-1)/T$ is also zero at $z = 1$.

It is useful as a check because $H(1) = \sum b_k/(1 + \sum a_k)$ is one line of arithmetic on the coefficient table, and it catches transcription errors, sign errors and scaling errors immediately. In the notch example the prewarped coefficients give $\sum b = 2.199638$ and $1 + \sum a = 2.199638$, so $H(1) = 1$ to every digit carried — as a unity-gain notch must. What it does not catch is a warping error: plain Tustin put the notch at $48\,\mathrm{Hz}$ and its DC gain was still exactly 1.
:::

## Summary

| Method | Substitution | Stability | Character |
| --- | --- | --- | --- |
| Forward Euler | $s \to (z-1)/T$ | Not preserved: unstable when $\omega_n T > 2\zeta$ | Cheapest, dangerous on high-$Q$ poles |
| Backward Euler | $s \to (z-1)/(Tz)$ | Always stable, even for unstable plants | Squeezes the half plane into $\lvert z - \frac12\rvert = \frac12$; flattens resonances |
| Tustin | $s \to \frac{2}{T}\frac{z-1}{z+1}$ | Left half plane onto the unit disk, exactly | Shape preserved, frequency axis warped by $\omega_a = \frac{2}{T}\tan(\omega T/2)$ |
| Tustin prewarped | $s \to \frac{\omega_0}{\tan(\omega_0T/2)}\frac{z-1}{z+1}$ | Same as Tustin | Exact at $\omega_0$; choose the notch centre or crossover |
| ZOH equivalence | $G(z) = (1-z^{-1})\mathcal{Z}\{G(s)/s\}$ | Exact for a held input | Poles map by $e^{sT}$; adds sampling zeros, possibly unstable ones |
| Matched pole-zero | $p \to e^{pT}$, $q \to e^{qT}$, surplus zeros at $z = -1$, rescale for DC | Preserved | Exact pole locations; awkward for improper or delayed systems |

All of these preserve DC gain, so $H(1) = \sum b_k/(1 + \sum a_k)$ is a fast consistency check but not a correctness check. The next lesson adds the effect none of these methods models: the flight computer takes time to produce its answer, and where that time appears in the loop is a design decision rather than an accident.
