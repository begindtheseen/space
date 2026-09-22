---
id: l06-nyquist
title: The Nyquist plot and the Nyquist stability criterion
minutes: 19
covers:
  - The Nyquist plot and the Nyquist stability criterion
---

The root locus needed a model you could factor. Nyquist's test needs only the open-loop frequency response — a table of complex numbers $L(j\omega)$, which you can compute from a transfer function, measure on a shaker table, or extract from flight telemetry. It decides closed-loop stability without finding a single root, it works when the plant is open-loop unstable, and it is the only classical test that tells you how *close* to unstable you are in a way that survives contact with a real vehicle.

That last point is why launch-vehicle stability analysis is done on Nyquist plots. A booster is unstable before the loop closes, so the question "are all the closed-loop poles in the left half plane" cannot be answered by looking at gain and phase at one frequency. It must be answered by a global statement about the whole curve, and Nyquist's criterion is that statement.

This lesson builds the plot, derives the criterion from the argument principle, and applies it to two loops you have already met: the stable rate channel and the unstable booster from the atmospheric flight module.

## The plot

The **Nyquist plot** of $L$ is the curve traced in the complex plane by $L(j\omega)$ as $\omega$ runs over all real frequencies. It carries exactly the information of a Bode plot — magnitude is distance from the origin, phase is angle from the positive real axis — arranged so that one particular point, $-1 + j0$, becomes the thing you look at.

Why that point? Because the closed-loop poles are the roots of $1 + L(s) = 0$, that is, the values of $s$ where $L(s) = -1$. If the curve passes through $-1$ at some frequency $\omega_0$, then $L(j\omega_0) = -1$ and the closed loop has a pole exactly on the imaginary axis at $j\omega_0$: sustained oscillation. Everything about stability is a question of how the curve is arranged relative to that point.

Two conventions before the numbers. Since $L$ has real coefficients, $L(-j\omega) = \overline{L(j\omega)}$, so the $\omega < 0$ half of the plot is the mirror image of the $\omega > 0$ half in the real axis; you draw one and reflect. And the plot is a *closed* curve, because the contour it comes from is closed — which matters whenever $L$ has poles on the imaginary axis, as every loop with an integrator does.

## The contour and the argument principle

Take the **Nyquist contour**: up the imaginary axis from $-j\infty$ to $+j\infty$, then clockwise around a semicircle of infinite radius through the right half plane and back. Traversed that way it encircles the entire right half plane once, clockwise. Where $L$ has a pole on the imaginary axis — at the origin for an integrator — the contour makes a small semicircular detour of radius $\varepsilon$ into the right half plane, so the pole stays outside.

Now apply Cauchy's argument principle to $F(s) = 1 + L(s)$:

> If a closed contour $C$ encircles $Z$ zeros and $P$ poles of $F$, counted with multiplicity, and is traversed clockwise, then the image $F(C)$ encircles the origin $Z - P$ times clockwise.

Identify the two counts. The zeros of $1 + L$ inside the contour are the closed-loop poles in the right half plane — the thing you want to be zero. The poles of $1 + L$ are the poles of $L$, so $P$ is the number of open-loop unstable poles, which you know. And encirclements of the origin by $1 + L$ are encirclements of $-1$ by $L$, since the two curves differ by a translation. Writing $N$ for the clockwise encirclements of $-1$ by the Nyquist plot of $L$:

$$
Z = N + P .
$$

::: key
Nyquist stability criterion. $Z = N + P$: closed-loop unstable poles $Z$ equal clockwise encirclements $N$ of $-1$ by $L(j\omega)$ plus open-loop unstable poles $P$. Stability requires $Z = 0$, so an open-loop-unstable plant **requires** counter-clockwise encirclements (a negative $N$).
:::

Three practical notes on the construction.

**The indentation matters.** A loop with $q$ poles at the origin has $L \approx k/s^q$ near the detour, so on $s = \varepsilon e^{j\phi}$ with $\phi$ running from $-90^\circ$ to $+90^\circ$ the image has magnitude $|k|/\varepsilon^q$ and argument $\angle k - q\phi$. It sweeps $q \times 180^\circ$ **clockwise** at infinite radius. For an integrating plant under PI control, $q = 2$ and the detour contributes a complete clockwise circle of infinite radius, which is part of the closed curve and must be counted.

**The infinite semicircle usually collapses.** For a strictly proper $L$, the large arc maps to a neighbourhood of the origin and contributes nothing.

**Counting.** The reliable way to count encirclements by hand is to draw a ray from $-1$ to infinity in any direction that avoids awkward tangencies, then count crossings, positive for clockwise and negative for counter-clockwise. The reliable way to count numerically is to accumulate the unwrapped argument of $1 + L$ all the way around the contour and divide by $2\pi$, which is what the code below does and what analysis tools do internally.

::: example The rate channel's PI loop, counted properly
$L(s) = 500(s+2)/\bigl(s^2(s+50)\bigr)$, the loop from the first lesson. Its phase is

$$
\angle L(j\omega) = \arctan\frac{\omega}{2} - 180^\circ - \arctan\frac{\omega}{50},
$$

which equals $-180^\circ$ at $\omega = 0$ and at $\omega = \infty$, and in between is always greater. Differentiating, the maximum lead is at $\omega = \sqrt{2\times50} = 10\ \mathrm{rad/s}$, where it is $78.69^\circ - 11.31^\circ = 67.38^\circ$. So for every finite positive frequency the plot lies strictly inside the third quadrant, with phase between $-180^\circ$ and $-112.62^\circ$, sweeping out from infinite magnitude at $\omega \to 0^+$ to the origin at $\omega \to \infty$. It never crosses the negative real axis at any finite frequency, which is the geometric statement of the infinite gain margin found earlier. It is also no accident that the design's crossover, $10\ \mathrm{rad/s}$, is exactly where the phase is furthest from $-180^\circ$: that is the best place to put it.

Closing the curve: the $\omega < 0$ branch mirrors it into the second quadrant, and the double pole at the origin adds an infinite-radius clockwise circle joining the two. Counting the unwrapped argument of $1 + L$ segment by segment gives $+180^\circ$ along the $\omega < 0$ branch, $-360^\circ$ around the detour, $+180^\circ$ along the $\omega > 0$ branch and $0^\circ$ on the large arc — a total of zero. So $N = 0$, and with $P = 0$ (the plant's poles are at $0$, $0$ and $-50$, none in the open right half plane) the criterion gives $Z = 0$. Stable, as the roots $-37.3$, $-10$, $-2.68$ confirm.
:::

::: example The same loop with the PI zero removed
Delete the zero: $L(s) = 500/\bigl(s^2(s+50)\bigr)$, a pure gain plus a double integrator plus the actuator. Now the phase is $-180^\circ - \arctan(\omega/50)$, which is *below* $-180^\circ$ at every positive frequency, so the plot lies in the second quadrant and crosses the negative real axis only in the limits. The detour still contributes its clockwise circle, but this time the branches do not unwind it: the winding count comes out $N = 2$.

With $P = 0$, $Z = 2$: two closed-loop poles in the right half plane. The characteristic polynomial confirms it — $s^3 + 50s^2 + 500$ has roots $-50.20$ and $+0.0992 \pm 3.155j$, a growing oscillation at $3.16\ \mathrm{rad/s}$. The missing $s$ coefficient is the giveaway, and it is the Routh–Hurwitz statement of the same fact.

The lesson is about what the PI zero does. It contributes $+\arctan(\omega/2)$ of phase, which is what lifts the curve out of the second quadrant and into the third. A gain at the origin is worth nothing without phase to go with it.
:::

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

When $P > 0$, stability is impossible without encirclements, and they must run counter-clockwise. That single fact reorganises how you read every plot of a launch vehicle loop.

::: example The booster's TVC loop
The atmospheric flight module's rigid pitch plant at maximum dynamic pressure is $\theta/\delta = \mu_\delta/(s^2 - \mu_\alpha)$ with $\mu_\alpha = 0.228\ \mathrm{s^{-2}}$ and $\mu_\delta = 1.317\ \mathrm{s^{-2}}$, so poles at $\pm 0.4775\ \mathrm{rad/s}$ and $P = 1$. With the PD law $\delta = -(K_p\theta + K_d\dot\theta)$ and the gains $K_p = 1.88$, $K_d = 1.59$,

$$
L(s) = \frac{\mu_\delta(K_p + K_ds)}{s^2 - \mu_\alpha} = \frac{2.094\,s + 2.476}{s^2 - 0.228}.
$$

At $\omega = 0$ the denominator is the negative number $-\mu_\alpha$, so $L(0) = -2.476/0.228 = -10.86$: the plot **starts on the negative real axis, to the left of $-1$**. As $\omega$ rises the denominator stays negative real while the numerator gains phase, so $\angle L = \arctan(0.8457\,\omega) - 180^\circ$, rising from $-180^\circ$ toward $-90^\circ$, while $|L|$ falls to zero. The $\omega > 0$ branch therefore sweeps from $(-10.86, 0)$ through the third quadrant into the origin; the mirror branch comes back through the second quadrant. The closed curve is a leaf enclosing the segment from $-10.86$ to $0$, traversed counter-clockwise, and $-1$ lies inside it.

So $N = -1$, and $Z = -1 + 1 = 0$: stable. The margins read off the same curve are a crossover at $\omega_{gc} = 2.262\ \mathrm{rad/s}$ with a phase margin of $62.4^\circ$ — which is exactly the figure the atmospheric flight module quotes for the rigid loop before the gimbal actuator's own dynamics are added.

Now lower the proportional gain to $K_p = 0.10$. Then $L(0) = -1.317\times0.10/0.228 = -0.578$, and the curve *starts to the right of $-1$*: the leaf no longer contains the critical point, $N = 0$, and $Z = 1$. The closed-loop roots are $-2.139$ and $+0.045$ — unstable, slowly. The gain condition $|L(0)| > 1$ works out to $K_p > \mu_\alpha/\mu_\delta = 0.173$, the minimum-gain condition from the atmospheric flight module, here derived from the geometry of the plot rather than from the characteristic equation.
:::

::: warning
An unstable plant has a gain margin **from below** as well as from above. The classical "gain margin" is the factor by which gain may be *increased*; for the booster the plot crosses the negative real axis at $\omega = 0$ with $|L| = 10.86$, and that crossing bounds how far the gain may be *decreased* — $20\log_{10}(10.86) = 20.7\ \mathrm{dB}$ of low-gain margin. Report both, and never report an unstable-plant loop's stability from a phase margin alone: a Bode plot of such a loop sits at $-180^\circ$ of phase at low frequency by design, and reading it with stable-plant habits gives the wrong answer every time.
:::

::: note
The criterion assumes the curve does not pass through $-1$ and that $L$ is proper with no unstable pole-zero cancellations. That last condition is the one that catches people: if a controller cancels an unstable plant pole with a zero, $L$ looks innocent, $P$ appears to be zero, and the criterion returns "stable" for a loop that has an uncontrollable growing mode. Never cancel a right-half-plane pole. The cancellation is exact only in the model.
:::

## Reading distance instead of counting turns

Once you trust the encirclement count, the plot's real value is that it shows *how far* the curve passes from $-1$. Two loops can both have $N = 0$ and be nothing alike: one skirting the critical point at a distance of 0.15, the other staying 0.9 away. The distance $\min_\omega|1 + L(j\omega)|$ is a margin in its own right, and since $|1+L| = 1/|S|$ it equals the reciprocal of the peak sensitivity. For the rate channel's PI loop the minimum distance is 0.869, and for the booster's rigid PD loop 0.992 — both comfortable. The next lesson makes that number, and the more familiar gain and phase margins, precise.

## Check yourself

::: check
A loop has $P = 0$ and its Nyquist plot crosses the negative real axis once at $-0.4$ and once at $-2.5$. Is the closed loop stable? What if the same plot came from a plant with one right-half-plane pole?
:::

::: answer
With $P = 0$ you need $N = 0$. A crossing at $-2.5$ is to the left of $-1$ and a crossing at $-0.4$ is to the right, so the curve passes on both sides of the critical point: the segment of the curve between those two crossings, together with its mirror image, encircles $-1$. Counting crossings of a ray drawn leftward from $-1$, there is one crossing from the $\omega > 0$ branch and one from the mirror, both clockwise, so $N = 2$ and $Z = 2$: unstable. With $P = 1$ you would need $N = -1$; you have $N = +2$, so $Z = 3$ — worse. Either way the loop must be redesigned, and the useful diagnosis is that the curve is looping around the critical point rather than passing by it.
:::

::: check
Why does a loop with two poles at the origin and no compensator zero produce a Nyquist plot that cannot avoid encircling $-1$, whatever the gain?
:::

::: answer
With $L = k/\bigl(s^2 D(s)\bigr)$ and $D$ contributing only lag, the phase at every positive frequency is $-180^\circ$ minus whatever $D$ adds, so the plot lies at or below the negative real axis and never re-enters the third quadrant from above. The detour around the double pole adds a full clockwise circle of infinite radius that nothing unwinds, so $N = 2$ regardless of $k$: changing the gain moves the curve radially but cannot change its angular behaviour. The cure is phase, not gain — a zero, which is what the PI controller's $k_ps + k_i$ numerator or a lead compensator provides.
:::

::: check
The booster loop is flown with $K_p = 1.88$ but at a moment when dynamic pressure has risen so that $\mu_\alpha = 0.60\ \mathrm{s^{-2}}$ instead of 0.228. Is the loop still stable, and what is the low-gain margin now?
:::

::: answer
$L(0) = -\mu_\delta K_p/\mu_\alpha = -1.317\times1.88/0.60 = -4.13$, still to the left of $-1$, so the leaf still encloses the critical point and $N = -1$, $Z = 0$: stable. The low-gain margin has fallen from $20\log_{10}(10.86) = 20.7\ \mathrm{dB}$ to $20\log_{10}(4.13) = 12.3\ \mathrm{dB}$. The minimum gain has risen to $\mu_\alpha/\mu_\delta = 0.456$, so the proportional gain is now only 4.1 times the minimum rather than 10.9 times. This is why launch-vehicle gains are scheduled against dynamic pressure: the floor moves under them.
:::

::: check
An engineer analysing a loop with an integrator plots $L(j\omega)$ for $\omega$ from 0.01 to 1000 rad/s, sees no encirclement of $-1$, and declares the loop stable. What has been left out, and when does it matter?
:::

::: answer
The closing of the contour. The plot from $0.01$ to $1000\ \mathrm{rad/s}$ is an open arc; the Nyquist criterion applies to the closed image of the full contour, which also contains the mirror branch and the infinite-radius arc produced by the detour around the pole at the origin. With one integrator that arc is a clockwise half-circle at infinite radius, and with two it is a full circle. It matters whenever the finite part of the plot approaches the negative real axis near $\omega \to 0$, which is exactly the situation in every type-2 loop — and the type-2 example in this lesson is a case where the open arc looks harmless and the closed curve encircles the critical point twice.
:::

::: check
Explain why the Nyquist criterion can be applied to a plant known only from measured frequency-response data, and what you must supply that the data does not contain.
:::

::: answer
The criterion needs only the curve $L(j\omega)$ and the integer $P$. The curve is precisely what a swept-sine or broadband excitation measures — magnitude and phase of the open loop at each frequency — with no model, no factorisation and no state-space realisation required. What the data cannot give you is $P$, the number of open-loop unstable poles, because an unstable plant cannot be excited open loop long enough to measure anything. $P$ has to come from physics or from a model: a booster's aerodynamic instability, a magnetic bearing's negative stiffness, an inverted pendulum's geometry. Supply the wrong $P$ and the criterion returns a confident wrong answer.
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
