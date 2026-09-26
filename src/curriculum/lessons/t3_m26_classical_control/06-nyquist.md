---
id: l06-nyquist
title: The Nyquist plot and the Nyquist stability criterion
minutes: 22
covers:
  - The Nyquist plot and the Nyquist stability criterion
---

Picture a dog on a long leash, running laps in a park while you stand still holding the other end. When the dog comes back, you can tell how many times it went around a tree by counting how many times the leash wrapped around the trunk. You do not need to know anything else about the route.

**[[Nyquist's test|nyquist-history]]** for stability works the same way. The "route" is the loop's frequency response, and the "tree" is one special point. Count the wraps and you know how many closed-loop poles are unstable — without finding a single root.

The root locus needed a model you could factor. Nyquist's test needs only the open-loop frequency response: a table of complex numbers $L(j\omega)$, read "L of j omega", one for each frequency. You can compute that table from a transfer function, **[[measure it on a shaker table|measured-response]]**, or pull it from flight telemetry. The test works even when the plant is unstable before the loop closes. And it is the only classical test that shows how *close* to unstable you are in a way that survives contact with a real vehicle.

That is why launch-vehicle stability analysis is done on Nyquist plots. A booster is unstable before the loop closes. So the question "are all the closed-loop poles in the left half plane?" cannot be answered from gain and phase at one frequency. It needs a statement about the whole curve, and Nyquist's criterion is that statement.

This lesson builds the plot, explains the criterion, and applies it to two loops you already know: the stable rate channel, and the unstable booster from the atmospheric flight module.

## The plot

The **Nyquist plot** of $L$ is the curve drawn in the complex plane by $L(j\omega)$ as $\omega$ runs over all real frequencies. It holds exactly the same information as a Bode plot, arranged differently. The **[[distance from the origin is the magnitude, and the angle is the phase|reading-the-plane]]**.

Why arrange it this way? Because it makes one point, $-1 + j0$, the thing you look at. That point is called the **critical point**.

Here is why $-1$ matters. The closed-loop poles are the roots of $1 + L(s) = 0$ — the values of $s$ where $L(s) = -1$. Suppose the curve passes right through $-1$ at some frequency $\omega_0$. Then $L(j\omega_0) = -1$, and the closed loop has a pole exactly on the imaginary axis at $j\omega_0$. That means an oscillation that neither grows nor dies. Everything about stability is a question of how the curve sits relative to that one point.

Two facts about the shape before the numbers.

**The negative frequencies are a mirror image.** $L$ has real coefficients, so $L(-j\omega) = \overline{L(j\omega)}$ — the bar means the **complex conjugate**, the same number with the sign of its imaginary part flipped. So the $\omega < 0$ half of the plot is the **[[mirror image|mirror]]** of the $\omega > 0$ half, reflected in the real axis. You draw one half and reflect it.

**The plot is a closed curve.** It comes from a closed path in the $s$-plane, as you will see next. That matters whenever $L$ has poles on the imaginary axis — as every loop with an integrator does.

## The contour and the argument principle

Start in the $s$-plane. Draw the **[[Nyquist contour|contour-picture]]**: go up the imaginary axis from $-j\infty$ to $+j\infty$, then swing clockwise around a half-circle of enormous radius through the right half plane, back to where you started. Walked that way, the path goes once around the entire right half plane, clockwise.

If $L$ has a pole on the imaginary axis — at the origin, for an integrator — the path cannot run through it. So it makes a tiny half-circle detour of radius $\varepsilon$ ("epsilon", a very small number) into the right half plane, stepping around the pole and leaving it outside.

Now feed every point of that path through $F(s) = 1 + L(s)$, and watch the image curve. A result from complex analysis, the **[[argument principle|dog-and-tree]]**, says what the image does:

> If a closed contour $C$ encircles $Z$ zeros and $P$ poles of $F$, counted with multiplicity, and is traversed clockwise, then the image $F(C)$ encircles the origin $Z - P$ times clockwise.

"Counted with multiplicity" means a double zero counts twice.

Now name the three counts.

- **$Z$.** The zeros of $1 + L$ inside the contour are the closed-loop poles in the right half plane. That is what you want to be zero.
- **$P$.** The poles of $1 + L$ are the poles of $L$. So $P$ is the number of unstable open-loop poles — something you know from the model.
- **$N$.** The curve $1 + L$ is the curve $L$ slid one unit to the right. So wraps around the origin by $1 + L$ are the same as wraps around $-1$ by $L$. Write $N$ for the number of clockwise encirclements of $-1$ by the Nyquist plot of $L$.

Put them together and the argument principle becomes

$$
Z = N + P .
$$

::: key
Nyquist stability criterion. $Z = N + P$: closed-loop unstable poles $Z$ equal clockwise encirclements $N$ of $-1$ by $L(j\omega)$ plus open-loop unstable poles $P$. Stability requires $Z = 0$, so an open-loop-unstable plant **requires** counter-clockwise encirclements (a negative $N$).
:::

Read it in words. For a stable plant, $P = 0$, so you need $N = 0$: the curve must not wrap around $-1$ at all. For an unstable plant, the curve *must* wrap around $-1$ counter-clockwise, once for each unstable open-loop pole.

### Three practical notes

**The detour matters.** Suppose the loop has $q$ poles at the origin. Near the detour, $L \approx k/s^q$. On the tiny half-circle $s = \varepsilon e^{j\phi}$, with $\phi$ running from $-90^\circ$ to $+90^\circ$, the image has size $|k|/\varepsilon^q$ — enormous — and angle $\angle k - q\phi$. As $\phi$ increases, the angle decreases, so the image sweeps $q \times 180^\circ$ **clockwise** at huge radius. For an integrating plant under PI control, $q = 2$, and the detour adds a complete clockwise circle at huge radius. It is part of the closed curve and must be counted.

**The big half-circle usually shrinks to a point.** For a strictly proper $L$ (more poles than zeros), $L(s) \to 0$ as $|s| \to \infty$. So the enormous arc maps to a tiny neighbourhood of the origin and adds nothing.

**Counting.** By hand, draw a ray from $-1$ out to infinity, in any direction that avoids grazing the curve. Count each time the curve crosses the ray: $+1$ for a clockwise crossing, $-1$ for counter-clockwise. By computer, add up the unwrapped angle of $1 + L$ all the way around the contour and divide by $2\pi$. The code below does that, and it is what analysis tools do inside.

::: example The rate channel's PI loop, counted properly
Take the loop-shaped PI design from lesson 4, without the delay: $L(s) = 500(s+2)/\bigl(s^2(s+50)\bigr)$. Its phase at frequency $\omega$ has three pieces — the zero adds, the double integrator gives $-180^\circ$, and the actuator pole subtracts:

$$
\angle L(j\omega) = \arctan\frac{\omega}{2} - 180^\circ - \arctan\frac{\omega}{50} .
$$

At $\omega = 0$ both arctangents are zero, so the phase is $-180^\circ$. As $\omega \to \infty$ both reach $90^\circ$ and cancel, so again $-180^\circ$. In between, the first arctangent is always the bigger one, so the phase is always above $-180^\circ$.

Where is it highest? Setting the derivative to zero gives $\omega = \sqrt{2\times50} = 10\ \mathrm{rad/s}$. There the phase is $78.69^\circ - 180^\circ - 11.31^\circ = -112.62^\circ$, a lift of $67.38^\circ$ above $-180^\circ$.

So for every finite positive frequency, the plot stays strictly inside the third quadrant (lower left), with phase between $-180^\circ$ and $-112.62^\circ$. It starts at huge magnitude as $\omega \to 0^+$ and shrinks into the origin as $\omega \to \infty$. It never crosses the negative real axis at any finite frequency — the picture of the infinite gain margin found earlier. And the design's crossover, $10\ \mathrm{rad/s}$, sits exactly where the phase is furthest from $-180^\circ$. That is no accident: it is the best place to put it.

Now close the curve. The $\omega < 0$ branch is the mirror image, in the second quadrant. The double pole at the origin adds a clockwise circle at huge radius joining the two.

Add up the angle of $1 + L$ piece by piece: $+180^\circ$ along the $\omega < 0$ branch, $-360^\circ$ around the detour, $+180^\circ$ along the $\omega > 0$ branch, and $0^\circ$ on the big arc. The total is zero. So $N = 0$.

The plant's poles are at $0$, $0$ and $-50$, none in the open right half plane, so $P = 0$. The criterion gives $Z = 0 + 0 = 0$: stable. The closed-loop roots, $-37.3$, $-10$ and $-2.68$, agree.
:::

::: example The same loop with the PI zero removed
Delete the zero: $L(s) = 500/\bigl(s^2(s+50)\bigr)$. That is a gain, a double integrator and the actuator.

Now the phase is $-180^\circ - \arctan(\omega/50)$. That is *below* $-180^\circ$ at every positive frequency, so the plot lies in the second quadrant (upper left). It touches the negative real axis only in the limits $\omega \to 0$ and $\omega \to \infty$. The detour still adds its clockwise circle, but this time the branches do not unwind it. The winding count comes out $N = 2$.

With $P = 0$, $Z = 2 + 0 = 2$: two closed-loop poles in the right half plane.

Check with the characteristic polynomial, $s^3 + 50s^2 + 500 = 0$. Its roots are $-50.20$ and $+0.0992 \pm 3.155j$ — a slowly growing oscillation at $3.16\ \mathrm{rad/s}$, as predicted. The missing $s$ term is the giveaway: a polynomial with a missing coefficient always has a root outside the left half plane. That is the Routh–Hurwitz version of the same fact.

The lesson is about what the PI zero does. It adds $+\arctan(\omega/2)$ of phase, which lifts the curve out of the second quadrant into the third. Gain at low frequency is worth nothing without phase to go with it.
:::

Here is the counting in code. It walks the four pieces of the contour — down the negative imaginary axis, around the detour, up the positive axis, around the big arc — and counts turns of $1 + L$:

```python
import numpy as np


def winding(L, eps=1e-6, R=1e8, n=200000):
    seg = [1j * -np.logspace(np.log10(R), np.log10(eps), n),
           eps * np.exp(1j * np.linspace(-np.pi / 2, np.pi / 2, n)),
           1j * np.logspace(np.log10(eps), np.log10(R), n),
           R * np.exp(1j * np.linspace(np.pi / 2, -np.pi / 2, n))]
    a = np.unwrap(np.angle(L(np.concatenate(seg)) + 1.0))
    return -(a[-1] - a[0]) / (2 * np.pi)      # clockwise turns = N


print(round(winding(lambda s: 500 * (s + 2) / (s**2 * (s + 50)))))
print(round(winding(lambda s: 500 / (s**2 * (s + 50)))))
# 0 and 2
```

## An unstable plant must be encircled

When $P > 0$, stability is impossible without encirclements, and they must run counter-clockwise. That one fact changes how you read every plot of a launch-vehicle loop.

::: example The booster's TVC loop
The rigid pitch plant at maximum dynamic pressure is $\theta/\delta = \mu_\delta/(s^2 - \mu_\alpha)$, with $\mu_\alpha = 0.228\ \mathrm{s^{-2}}$ and $\mu_\delta = 1.317\ \mathrm{s^{-2}}$. Its poles are at $\pm 0.4775\ \mathrm{rad/s}$, so one is unstable: $P = 1$. With the PD law $\delta = -(K_p\theta + K_d\dot\theta)$ and gains $K_p = 1.88$, $K_d = 1.59$,

$$
L(s) = \frac{\mu_\delta(K_p + K_ds)}{s^2 - \mu_\alpha} = \frac{2.094\,s + 2.476}{s^2 - 0.228} .
$$

**Where it starts.** At $\omega = 0$ the bottom is the negative number $-\mu_\alpha$, so $L(0) = -2.476/0.228 = -10.86$. The plot **starts on the negative real axis, to the left of $-1$**.

**Where it goes.** At $s = j\omega$ the bottom is $-\omega^2 - 0.228$, still a negative real number. So the bottom always contributes $-180^\circ$, while the top gains phase as $\omega$ rises. That gives $\angle L = \arctan(0.8457\,\omega) - 180^\circ$, rising from $-180^\circ$ toward $-90^\circ$, while $|L|$ shrinks to zero. (The $0.8457$ is $K_d/K_p$.)

So the $\omega > 0$ branch sweeps from $-10.86$ through the third quadrant into the origin. The mirror branch comes back through the second quadrant. The closed curve is a **[[leaf shape around the segment from −10.86 to 0|booster-leaf]]**, traversed counter-clockwise, and $-1$ lies inside it.

**Count.** One counter-clockwise encirclement: $N = -1$. Then $Z = N + P = -1 + 1 = 0$. Stable.

The margins read off the same curve are a crossover at $\omega_{gc} = 2.262\ \mathrm{rad/s}$ with a phase margin of $62.4^\circ$ — the figure the atmospheric flight module quotes for the rigid loop, before the gimbal actuator's own dynamics are added.

**Now lower the gain.** Take $K_p = 0.10$. Then $L(0) = -1.317\times0.10/0.228 = -0.578$, and the curve *starts to the right of $-1$*. The leaf no longer contains the critical point, so $N = 0$ and $Z = 0 + 1 = 1$. The closed-loop roots are $-2.139$ and $+0.045$: unstable, slowly.

The condition for the leaf to contain $-1$ is $|L(0)| > 1$. Written out, $\mu_\delta K_p/\mu_\alpha > 1$, so $K_p > \mu_\alpha/\mu_\delta = 0.173$. That is the minimum-gain condition from the atmospheric flight module, found here from the shape of the plot instead of from the characteristic equation.
:::

::: warning Gain margin from below
An unstable plant has a gain margin **from below** as well as from above. The usual "gain margin" is how much you may *raise* the gain. For the booster, the plot crosses the negative real axis at $\omega = 0$ with $|L| = 10.86$, and that crossing limits how far you may *lower* the gain: $20\log_{10}(10.86) = 20.7\ \mathrm{dB}$ of low-gain margin. Report both. And never judge an unstable-plant loop from its phase margin alone. Its Bode plot sits at $-180^\circ$ at low frequency by design, and reading it with stable-plant habits gives the wrong answer every time.
:::

::: note When the criterion does not apply
The criterion assumes the curve does not pass exactly through $-1$, that $L$ is proper (no more zeros than poles), and that no unstable pole has been cancelled by a zero. That last one catches people. If a controller cancels an unstable plant pole with a zero, $L$ looks innocent, $P$ seems to be zero, and the criterion says "stable" for a loop with a hidden growing mode. **[[Never cancel a right-half-plane pole|rhp-cancel]].** The cancellation is exact only in the model.
:::

## Reading distance instead of counting turns

Once you trust the count, the plot's real value is that it shows *how far* the curve passes from $-1$. Two loops can both have $N = 0$ and be nothing alike: one skims past the critical point at a distance of 0.15, the other stays 0.9 away.

That distance, $\min_\omega|1 + L(j\omega)|$ — the smallest distance over all frequencies — is a margin in its own right. Since $|1+L| = 1/|S|$, where $S = 1/(1+L)$ is the sensitivity function, it equals one over the **[[peak sensitivity|sensitivity-peak]]**.

For the rate channel's PI loop the minimum distance is 0.869, and for the booster's rigid PD loop it is 0.992. Both are comfortable. The next lesson makes that number precise, along with the more familiar gain and phase margins.

## Check yourself

::: check
A loop has $P = 0$, and its Nyquist plot for $\omega > 0$ starts on the positive real axis, heads into the lower half plane, and crosses the negative real axis once at $-2.5$ and once at $-0.4$. Is the closed loop stable? What if the same plot came from a plant with one right-half-plane pole?
:::

::: answer
With $P = 0$ you need $N = 0$.

Draw a ray from $-1$ straight to the left. Only the crossing at $-2.5$ lies on it; the one at $-0.4$ is to the right of $-1$. The curve starts in the lower half plane, so at $-2.5$ it crosses upward, into the upper half. (The other order — up at $-0.4$, down at $-2.5$ — would give $N = -2$ and $Z = -2$, which is impossible, so it cannot happen when $P = 0$.) On the left side of $-1$, moving upward is clockwise: $+1$. The mirror branch crosses the ray at the same point, turning the same way: another $+1$. So $N = 2$, and $Z = 2 + 0 = 2$: unstable.

With $P = 1$ you would need $N = -1$. You have $N = +2$, so $Z = 3$ — worse.

Either way the loop must be redesigned. The useful diagnosis is that the curve loops around the critical point instead of passing by it.
:::

::: check
Why does a loop with two poles at the origin and no compensator zero produce a Nyquist plot that encircles $-1$, whatever the gain?
:::

::: answer
Write $L = k/\bigl(s^2 D(s)\bigr)$, where $D$ adds only lag. At every positive frequency the phase is $-180^\circ$ minus whatever $D$ adds, so it is below $-180^\circ$. The plot lies in the second quadrant, above the negative real axis, and never gets into the third quadrant.

The detour around the double pole adds a full clockwise circle at huge radius, and nothing in the branches unwinds it. So $N = 2$ for every $k$. Changing the gain stretches the curve in or out from the origin, but cannot change its angles.

The cure is phase, not gain: a zero, such as the PI controller's $k_ps + k_i$ numerator, or a lead compensator.
:::

::: check
The booster loop is flown with $K_p = 1.88$ at a moment when dynamic pressure has risen so that $\mu_\alpha = 0.60\ \mathrm{s^{-2}}$ instead of 0.228. Is the loop still stable, and what is the low-gain margin now?
:::

::: answer
$L(0) = -\mu_\delta K_p/\mu_\alpha = -1.317\times1.88/0.60 = -4.13$. That is still to the left of $-1$, so the leaf still contains the critical point. $N = -1$ and $Z = -1 + 1 = 0$: stable.

The low-gain margin has fallen from $20\log_{10}(10.86) = 20.7\ \mathrm{dB}$ to $20\log_{10}(4.13) = 12.3\ \mathrm{dB}$.

The minimum gain has risen to $\mu_\alpha/\mu_\delta = 0.60/1.317 = 0.456$. So the proportional gain is now only $1.88/0.456 = 4.1$ times the minimum, instead of $10.9$ times. This is why launch-vehicle gains are **[[scheduled against dynamic pressure|q-schedule]]**: the floor moves under them.
:::

::: check
An engineer analysing a loop with an integrator plots $L(j\omega)$ for $\omega$ from 0.01 to 1000 rad/s, sees no encirclement of $-1$, and declares the loop stable. What has been left out, and when does it matter?
:::

::: answer
The closing of the curve. The plot from $0.01$ to $1000\ \mathrm{rad/s}$ is an open arc. The Nyquist criterion applies to the closed image of the full contour, which also contains the mirror branch and the huge arc produced by the detour around the pole at the origin. With one integrator that arc is a clockwise half-circle at huge radius. With two it is a full circle.

It matters whenever the plot approaches the negative real axis as $\omega \to 0$, which is exactly what happens in every loop with two integrators. The no-zero example in this lesson is such a case: the open arc looks harmless, and the closed curve encircles the critical point twice.
:::

::: check
Explain why the Nyquist criterion can be applied to a plant known only from measured frequency-response data, and what you must supply that the data does not contain.
:::

::: answer
The criterion needs only two things: the curve $L(j\omega)$ and the whole number $P$.

The curve is exactly what a swept-sine or broadband test measures — the open loop's magnitude and phase at each frequency. No model, no factoring and no state-space form is needed.

What the data cannot give you is $P$, the number of unstable open-loop poles. An unstable plant cannot be run open loop long enough to measure anything. $P$ has to come from physics or from a model: a booster's aerodynamic instability, a magnetic bearing's negative stiffness, an inverted pendulum's geometry. Supply the wrong $P$ and the criterion gives a confident wrong answer.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Nyquist plot | $L(j\omega)$ in the complex plane for all real $\omega$; closed by the contour's arcs |
| Critical point | $-1 + j0$; $L(j\omega_0) = -1$ means a closed-loop pole at $j\omega_0$ |
| Nyquist contour | up the imaginary axis, clockwise round infinity, detouring right around axis poles |
| Argument principle | clockwise image encirclements of the origin by $F$ equal $Z - P$ for $F$ |
| Criterion | $Z = N + P$; stability is $Z = 0$; $N$ counts **clockwise** encirclements of $-1$ |
| Unstable plant | $P > 0$ demands $N = -P$, i.e. counter-clockwise encirclements |
| Type-$q$ detour | contributes $q\times180^\circ$ clockwise at infinite radius |
| Rate channel PI loop | phase in $(-180^\circ, -112.62^\circ)$, max lead at $\omega = 10$; $N = 0$, $Z = 0$ |
| Same loop, no zero | $N = 2$, $Z = 2$; roots $+0.0992 \pm 3.155j$ |
| Booster PD loop | $L(0) = -10.86$, $N = -1$, $P = 1$, $Z = 0$; $\omega_{gc} = 2.26\ \mathrm{rad/s}$, PM $62.4^\circ$ |
| Low-gain margin | $20\log_{10}\lvert L(0)\rvert = 20.7\ \mathrm{dB}$ for that loop; needs $K_p > \mu_\alpha/\mu_\delta$ |
| Distance to $-1$ | $\min_\omega\lvert1 + L\rvert = 1/\lVert S\rVert_\infty$; 0.869 and 0.992 for the two loops above |

The criterion answers yes or no. The next lesson turns the same picture into the four numbers a design review actually asks for.

::: context nyquist-history Where the test came from
Harry Nyquist worked at Bell Telephone Laboratories. In the 1920s, telephone engineers had learned to use negative feedback to make long-distance amplifiers steady — but some feedback amplifiers would suddenly start to "sing", oscillating on their own. Nyquist's 1932 paper, "Regeneration Theory", gave a test that said in advance which ones would sing, using only their measured frequency response. Control engineers later took the same test and applied it to machines and vehicles.
:::

::: context measured-response Measuring a frequency response
To measure $L(j\omega)$, you shake the system gently with a sine wave at one frequency and record how big the response is and how late it arrives. Then you step to the next frequency. On the ground, aircraft and rockets go through **ground vibration tests** on shaker rigs. In flight, test pilots and autopilots inject small frequency sweeps into the controls. Either way, the result is a table of complex numbers — exactly what the Nyquist test needs.
:::

::: context reading-the-plane One point on the curve
Each frequency gives one complex number $L(j\omega)$. Its distance from the origin is the loop's magnitude at that frequency, and its angle from the positive real axis is the phase. The dashed line from the point to $-1$ has length $|1 + L|$ — the closer to zero, the closer to instability.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="90" x2="345" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="230" y1="10" x2="230" y2="165" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="230" y1="90" x2="188.9" y2="139" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="188.9" cy="139" r="4.5" fill="#1d6fd1"/>
  <path d="M250,90 A20,20 0 0,1 217.14,105.32" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <line x1="188.9" y1="139" x2="150" y2="90" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4,3"/>
  <circle cx="150" cy="90" r="5" fill="#b4232c"/>
  <text x="150" y="78" font-size="12" text-anchor="middle" fill="#b4232c">−1</text>
  <text x="196" y="156" font-size="12" fill="#1d6fd1">L(jω)</text>
  <text x="200" y="108" font-size="11" text-anchor="end" fill="#1f2a44">|L|</text>
  <text x="258" y="112" font-size="11" fill="#1f2a44">phase −130°</text>
  <text x="112" y="128" font-size="11" fill="#b4232c">|1 + L|</text>
  <text x="340" y="82" font-size="11" text-anchor="end" fill="#1f2a44">Re</text>
  <text x="236" y="20" font-size="11" fill="#1f2a44">Im</text>
</svg>
```
:::

::: context mirror Why the bottom half mirrors the top
Every coefficient in $L(s)$ is a real number. Swapping $j$ for $-j$ everywhere in a formula built from real numbers flips the sign of every imaginary part and changes nothing else. So $L(-j\omega)$ is $L(j\omega)$ with its imaginary part flipped: the same point reflected in the real axis. Negative frequencies have no separate physical meaning here. They are needed only to close the curve.
:::

::: context contour-picture The path in the s-plane
The contour runs up the imaginary axis, steps around the poles at the origin on a tiny half-circle to the right, and returns along a huge half-circle through the right half plane. Everything it encloses is the right half plane — the region where a closed-loop pole means trouble.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="320" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <path d="M150,185 L150,110 A10,10 0 0,0 150,90 L150,15 A85,85 0 0,1 150,185 Z" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="150,55 144,67 156,67" fill="#1d6fd1"/>
  <polygon points="150,150 144,162 156,162" fill="#1d6fd1"/>
  <polygon points="235,94 229,106 241,106" fill="#1d6fd1" transform="rotate(180 235 100)"/>
  <g stroke="#b4232c" stroke-width="2"><line x1="145" y1="95" x2="155" y2="105"/><line x1="145" y1="105" x2="155" y2="95"/></g>
  <text x="138" y="90" font-size="11" text-anchor="end" fill="#1f2a44">poles at 0</text>
  <text x="165" y="86" font-size="11" fill="#1f2a44">detour ε</text>
  <text x="250" y="40" font-size="11" fill="#1f2a44">radius → ∞</text>
  <text x="142" y="25" font-size="11" text-anchor="end" fill="#1f2a44">+j∞</text>
  <text x="142" y="182" font-size="11" text-anchor="end" fill="#1f2a44">−j∞</text>
  <text x="165" y="126" font-size="11" fill="#1f2a44">right half</text>
  <text x="165" y="140" font-size="11" fill="#1f2a44">plane</text>
</svg>
```
:::

::: context dog-and-tree The dog and the tree
Walk a dog on a leash around a closed route while the dog stays close. Every time your route goes around a tree, the leash wraps around it once. The argument principle is the mathematical version: each zero of $F$ inside the route wraps the image once one way, and each pole wraps it once the other way. Counting wraps of the image tells you how many zeros minus poles are inside — without ever finding them.
:::

::: context booster-leaf The booster's leaf, to scale
Here is the booster's full Nyquist plot, drawn to scale. The dashed circle is the unit circle. The plot runs counter-clockwise, and $-1$ is inside the leaf. A ray drawn straight up from $-1$ crosses the curve once, moving right-to-left along the top: one counter-clockwise crossing, so $N = -1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="100" x2="350" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="330" y1="15" x2="330" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="330" cy="100" r="28" fill="none" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="25.9,100.0 27.5,108.8 32.1,117.4 39.6,125.4 49.4,132.7 61.0,139.2 74.0,144.8 87.8,149.4 102.0,153.2 116.2,156.1 130.2,158.3 143.6,159.8 156.3,160.8 168.4,161.3 179.6,161.4 190.1,161.2 199.8,160.8 208.7,160.1 217.0,159.3 224.5,158.4 231.5,157.5 237.9,156.4 243.7,155.4 249.1,154.3 254.1,153.2 258.6,152.0 262.8,150.9 266.7,149.9 270.2,148.8 273.5,147.7 283.6,144.2 292.2,140.5 299.3,137.0 305.2,133.6 310.1,130.4 314.1,127.4 317.3,124.6 319.9,122.0 321.9,119.7 323.6,117.6 324.9,115.7 326.0,114.0 327.5,111.1 328.4,108.8 329.0,107.0 329.4,105.5 329.7,103.9 329.9,102.4 330.0,100.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="25.9,100.0 27.5,91.2 32.1,82.6 39.6,74.6 49.4,67.3 61.0,60.8 74.0,55.2 87.8,50.6 102.0,46.8 116.2,43.9 130.2,41.7 143.6,40.2 156.3,39.2 168.4,38.7 179.6,38.6 190.1,38.8 199.8,39.2 208.7,39.9 217.0,40.7 224.5,41.6 231.5,42.5 237.9,43.6 243.7,44.6 249.1,45.7 254.1,46.8 258.6,48.0 262.8,49.1 266.7,50.1 270.2,51.2 273.5,52.3 283.6,55.8 292.2,59.5 299.3,63.0 305.2,66.4 310.1,69.6 314.1,72.6 317.3,75.4 319.9,78.0 321.9,80.3 323.6,82.4 324.9,84.3 326.0,86.0 327.5,88.9 328.4,91.2 329.0,93.0 329.4,94.5 329.7,96.1 329.9,97.6 330.0,100.0"/>
  <polygon points="186,161.4 176,156.4 176,166.4" fill="#1d6fd1"/>
  <polygon points="174,38.6 184,33.6 184,43.6" fill="#1d6fd1"/>
  <line x1="302" y1="100" x2="302" y2="12" stroke="#b4232c" stroke-width="1.5"/>
  <circle cx="302" cy="100" r="4.5" fill="#b4232c"/>
  <text x="296" y="116" font-size="11" text-anchor="end" fill="#b4232c">−1</text>
  <text x="42" y="96" font-size="11" fill="#1f2a44">−10.86 (ω = 0)</text>
  <text x="180" y="185" font-size="11" text-anchor="middle" fill="#1f2a44">ω &gt; 0</text>
  <text x="180" y="28" font-size="11" text-anchor="middle" fill="#1f2a44">ω &lt; 0 (mirror)</text>
</svg>
```
:::

::: context rhp-cancel Why cancellation fails in flight
Suppose the plant has an unstable pole at $+0.4775$ and you put a controller zero at exactly $+0.4775$ to cancel it. On paper the product has no unstable pole. But the real pole is never exactly where the model says, and even a perfect cancellation only hides the mode from the loop — it does not remove it from the vehicle. The smallest disturbance or noise excites that hidden mode, and it grows as $e^{0.4775t}$, doubling about every 1.5 seconds, with the controller unable to see it.
:::

::: context sensitivity-peak Distance and sensitivity
The sensitivity $S = 1/(1+L)$ says how much of an outside disturbance gets through the loop. Where the Nyquist curve passes close to $-1$, $|1 + L|$ is small, so $|S|$ is large: disturbances at that frequency are amplified, not reduced. The largest value of $|S|$ over all frequencies, written $\lVert S\rVert_\infty$, is the peak sensitivity. A curve that skims past $-1$ at distance 0.15 has a peak of $1/0.15 \approx 6.7$.
:::

::: context q-schedule Gain scheduling on a booster
Dynamic pressure, $q = \tfrac{1}{2}\rho v^2$, climbs after lift-off, peaks at "max q" about a minute into flight, then falls as the air thins. Both $\mu_\alpha$ and $\mu_\delta$ change with it, by large factors. So flight software stores gains as a table against time or Mach number and switches smoothly between them. Lesson 13 treats this **gain scheduling** in full.
:::
