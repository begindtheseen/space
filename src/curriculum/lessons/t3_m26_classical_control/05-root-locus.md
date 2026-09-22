---
id: l05-root-locus
title: The root locus, and designing with it
minutes: 20
covers:
  - Root locus construction rules and root-locus design
---

Pole placement told you where the closed-loop poles are for one set of gains. The root locus tells you where they go for *every* gain, drawn as a picture you can read in a second: which branch leaves the left half plane first, how much gain you have before the damping collapses, whether a compensator zero pulls the dominant poles where you want them. On a launch vehicle it answers a question that comes up in every design review — the vehicle's inertia is uncertain by 30%, so what does that do to my closed-loop poles? — because an inertia error is a gain error, and a gain error is a walk along the locus.

The construction is a consequence of one equation. A unity-feedback loop with adjustable gain $K$ has closed-loop poles where

$$
1 + K\,L(s) = 0, \qquad L(s) = \frac{N(s)}{D(s)} = \frac{\prod_{j}(s - z_j)}{\prod_{i}(s - p_i)},
$$

with $z_j$ the $m$ open-loop zeros, $p_i$ the $n$ open-loop poles, and $K \ge 0$. The **root locus** is the set of all $s$ satisfying that equation as $K$ runs from 0 to $\infty$. Splitting it into magnitude and angle gives the two conditions every point on the locus obeys:

$$
|K\,L(s)| = 1
\qquad\text{and}\qquad
\angle L(s) = 180^\circ + k\cdot360^\circ .
$$

The angle condition alone decides *where* the locus is; the magnitude condition then tells you *which gain* puts a pole at a given point. That separation is what makes the sketch possible by hand.

## The construction rules

Each rule below follows from the two conditions, and each is worth being able to derive rather than recall.

**1. Number, start and end.** $1 + KL = 0$ is $D(s) + KN(s) = 0$, a polynomial of degree $n$ (for $n \ge m$), so there are $n$ branches. At $K = 0$ the equation is $D(s) = 0$: branches start at the open-loop poles. As $K \to \infty$ it becomes $N(s) = 0$ for finite $s$: $m$ branches end at the open-loop zeros, and the other $n - m$ run off to infinity.

**2. Real-axis segments.** A point on the real axis contributes $0^\circ$ of angle from every real pole or zero to its left and $180^\circ$ from every one to its right; complex pairs contribute equal and opposite angles that cancel. So the angle condition holds exactly where the number of real poles and zeros strictly to the right is **odd**.

**3. Asymptotes.** For large $|s|$, $L(s) \approx s^{m-n}$, so the angle condition gives $(n - m)$ asymptote directions

$$
\theta_k = \frac{(2k+1)\,180^\circ}{n - m}, \qquad k = 0, 1, \ldots, n - m - 1,
$$

and expanding $L$ one order further locates their common intersection on the real axis at the **centroid**

$$
\sigma_a = \frac{\sum_i p_i - \sum_j z_j}{n - m} .
$$

**4. Breakaway and break-in points.** Where two branches meet on the real axis and leave it (or arrive at it), the gain $K = -D(s)/N(s)$ has a local extremum, so $dK/ds = 0$. Equivalently

$$
\sum_i \frac{1}{s - p_i} = \sum_j \frac{1}{s - z_j} .
$$

Solve, then keep only the roots that lie on a real-axis segment of the locus.

**5. Departure and arrival angles.** At a complex pole $p_\ell$, the angle condition evaluated immediately off the pole gives the departure angle

$$
\theta_{d} = 180^\circ + \sum_j \angle(p_\ell - z_j) - \sum_{i \ne \ell} \angle(p_\ell - p_i),
$$

with the analogous expression, sign reversed, for arrival at a complex zero. For a lightly damped pair this is the number that tells you whether feedback damps the mode or drives it unstable.

**6. Imaginary-axis crossings.** Substitute $s = j\omega$ into $D + KN = 0$ and require the real and imaginary parts to vanish together; two equations give the crossing frequency and the gain that puts a pole there. The Routh array gives the same answer.

**7. Sum of the closed-loop poles.** If $n - m \ge 2$, the $s^{n-1}$ coefficient of $D + KN$ does not contain $K$, so the sum of the closed-loop poles equals the sum of the open-loop poles for every gain. A branch moving left forces another to move right by the same amount — a useful sanity check on a sketch, and a first glimpse of the conservation ideas later in this module.

::: example The rate channel under proportional control
$G(s) = 1/\bigl(Js(\tau s + 1)\bigr)$ with $J = 1200$, $\tau = 0.02$ is $1/\bigl(24\,s(s+50)\bigr)$, so with $C = k_p$ the loop is $L = 1/\bigl(s(s+50)\bigr)$ and $K = k_p/24$.

Two poles, no zeros: $n = 2$, $m = 0$, two branches. They start at $0$ and $-50$. The real-axis segment between them is on the locus (one pole to the right of any interior point, an odd count), and nothing to the left of $-50$ is. Both branches go to infinity along $\theta = \pm 90^\circ$ with centroid $\sigma_a = (0 - 50)/2 = -25$. The breakaway point solves $1/s + 1/(s+50) = 0$, i.e. $s = -25$, and the gain there is $K = |s(s+50)| = 625$, so $k_p = 24 \times 625 = 15\,000$.

The whole picture: for $k_p < 15\,000$ two real poles approach each other; at $k_p = 15\,000$ they collide at $-25$ (critically damped); above that they split vertically along the line $\operatorname{Re}s = -25$. At the design gain $k_p = 12\,000$ they sit at $-13.82$ and $-36.18$; at $k_p = 24\,000$ at $-25 \pm 19.36j$, damping $\zeta = 25/\sqrt{25^2+19.36^2} = 0.79$; at $k_p = 48\,000$ at $-25 \pm 37.08j$, $\zeta = 0.56$.

The locus never touches the imaginary axis, so this loop is stable for every positive gain — which is exactly the infinite gain margin the first lesson found, seen from the other side. Raising the gain does not destabilise it; it only makes it ring.
:::

## What a compensator does to the locus

Root-locus design is the art of adding poles and zeros so the locus passes through the region you want.

**A zero pulls the locus toward itself**, and generally to the left. Every branch must eventually reach a zero or infinity, and each added zero removes one asymptote, reducing $n - m$ and rotating the remaining asymptotes toward the real axis. A PD controller contributes a zero at $-k_p/k_d$; that is the entire mechanism by which derivative action adds damping.

**A pole pushes the locus toward itself**, and generally to the right. Each added pole adds an asymptote and moves the centroid right by $p/(n-m)$. An actuator lag, a derivative filter, a sensor filter — each is a pole you did not want and each costs stability.

**A pole-zero pair close together acts locally.** Far away, their angle contributions nearly cancel and the locus barely notices them; near them, the locus rearranges completely. This is the design principle behind the PI controller's integrator-plus-zero and behind the lag compensator later in this module: a pole at the origin with a zero close by raises low-frequency gain enormously while leaving the dominant poles almost where they were.

::: example The rate channel under PI control
Add the integrator and its zero: $L = (k_ps + k_i)/\bigl(24s^2(s+50)\bigr)$, which with $T_i = 0.5\ \mathrm{s}$ (zero at $-2$) is $K(s+2)/\bigl(s^2(s+50)\bigr)$ with $K = k_p/24$.

Now $n = 3$, $m = 1$. Branches start at $0$, $0$ and $-50$ and one ends at $-2$; the other two leave along $\pm 90^\circ$ asymptotes with centroid $\sigma_a = \bigl[(0+0-50) - (-2)\bigr]/2 = -24$. On the real axis, the segment from $-50$ to $-2$ satisfies the odd-count test and nothing else does.

The breakaway condition $2/s + 1/(s+50) = 1/(s+2)$ reduces to $2s\bigl(s^2 + 28s + 100\bigr) = 0$, whose useful roots are $s = -4.202$ and $s = -23.798$. The first is a **break-in** at $K = 367$ ($k_p = 8814$) and the second a **breakaway** at $K = 681$ ($k_p = 16\,338$). So the locus reads: the double pole at the origin splits into a complex pair that arcs out and to the left; near $k_p = 8800$ the pair lands on the real axis at $-4.20$; between $k_p = 8800$ and $k_p = 16\,300$ all three poles are real; then two of them collide at $-23.80$ and rise along the asymptotes, while the third settles toward the zero at $-2$.

At the design gain $k_p = 12\,000$, $k_i = 24\,000$ the poles are $-37.32$, $-10$ and $-2.68$, all real — in the middle of that window. Check rule 7: their sum is $-50$, the sum of the open-loop poles, as it must be for every gain.

And notice what the locus does **not** show. The pole at $-2.68$ looks dominant and slow, promising a sluggish 1.5 s response, but the closed loop also has a zero at $-2$ sitting almost on top of it, which nearly cancels its contribution. The actual response has a 0.117 s rise. A root locus plots denominators; the numerator is your responsibility.
:::

::: warning
The locus is drawn for one parameter. Sweeping $k_p$ with $k_i$ fixed is a different curve from sweeping $k_p$ with $T_i$ fixed, which is what actually happens when you scale a PID. Before reading a locus, be certain which quantity is moving — and remember that a plant parameter you did not think of as a gain, such as inertia or dynamic pressure, moves you along the same curve.
:::

## Designing on the locus: the unstable booster

The case that makes the locus indispensable is an open-loop-unstable plant, where a branch starts in the right half plane and feedback has to drag it across.

::: example The booster's PD loop, read off the locus
The atmospheric flight module's booster has pitch dynamics $\theta/\delta = \mu_\delta/(s^2 - \mu_\alpha)$ with $\mu_\alpha = 0.228\ \mathrm{s^{-2}}$ and $\mu_\delta = 1.317\ \mathrm{s^{-2}}$ at maximum dynamic pressure, so open-loop poles at $\pm 0.4775\ \mathrm{rad/s}$. Close the PD loop $\delta = -(K_p\theta + K_d\dot\theta)$. The loop transfer function is

$$
L(s) = \frac{\mu_\delta K_d\,(s + z)}{s^2 - \mu_\alpha}, \qquad z = \frac{K_p}{K_d},
$$

so the sweeping gain is $K = \mu_\delta K_d$ and the compensator zero sits at $-z$. With the module 18 gains $K_p = 1.88$ and $K_d = 1.59$: $z = 1.1824$ and $K = 2.094$.

Read the locus. Two poles, one zero, $n - m = 1$, so one branch ends at $-1.1824$ and one runs to $-\infty$ along the single $180^\circ$ asymptote. Real-axis segments: the interval between $-0.4775$ and $+0.4775$ has one pole to its right (odd, on the locus), the interval from $-1.1824$ to $-0.4775$ has two (even, off), and everything left of $-1.1824$ has three (odd, on).

Breakaway and break-in solve $1/(s - 0.4775) + 1/(s + 0.4775) = 1/(s + z)$, which reduces to $s^2 + 2zs + \mu_\alpha = 0$ and gives $s = -z \pm \sqrt{z^2 - \mu_\alpha} = -0.1007$ and $-2.2641$. The gains there, from $K = -(s^2-\mu_\alpha)/(s+z)$, are $0.2014$ and $4.528$.

So as $K$ rises from zero: the unstable pole marches left from $+0.4775$ and the stable one marches right from $-0.4775$. The unstable branch crosses the imaginary axis at $s = 0$, where $K = \mu_\alpha/z = 0.1928$ — which, written in the original gains, is exactly the minimum-gain condition $K_p > \mu_\alpha/\mu_\delta = 0.173$ from the atmospheric flight module. Below it the vehicle diverges no matter how much rate feedback you add. At $K = 0.2014$ the two real poles collide at $-0.1007$ and break away into a complex pair; at $K = 4.528$ the pair returns to the real axis at $-2.2641$.

The design gain $K = 2.094$ lies between those two, so the closed-loop poles are complex: $s^2 + 2.094s + (2.094 \times 1.1824 - 0.228) = s^2 + 2.094s + 2.248$, giving $-1.047 \pm 1.073j$, $\omega_n = 1.50\ \mathrm{rad/s}$ and $\zeta = 0.70$ — the design point the atmospheric flight module chose, recovered from the picture.
:::

That example contains the general lesson about designing on the locus. You do not pick gains and see what happens; you decide which region of the $s$-plane you need — a damping ray $\zeta = \cos\theta$, a settling line $\operatorname{Re}s < -4/t_s$, a natural-frequency circle — then place the compensator's zero so the locus passes through it, then read the gain off the magnitude condition.

```python
import numpy as np

mu_a, mu_d, Kd = 0.228, 1.317, 1.59
z, K = 1.88 / Kd, mu_d * Kd
for g in (0.10, 0.1928, 0.2014, K, 4.5282, 12.0):
    print(round(g, 4), np.round(np.roots([1.0, g, g * z - mu_a]), 4))
# 2.094 [-1.047+1.0732j -1.047-1.0732j]   <- the design point
```

::: warning
A root locus shows pole locations, never margins. Two loops whose closed-loop poles sit in the same place can have wildly different gain and phase margins, because margins depend on the shape of $L(j\omega)$ all the way around, including at frequencies where the poles tell you nothing. And a locus drawn from a model that omits the actuator, the delay or the bending mode is a locus for a vehicle that does not exist. Use it to choose a structure and a region; use the frequency-domain tools of the next lessons to certify the result.
:::

## Check yourself

::: check
Sketch the locus of $L(s) = 1/\bigl(s(s+2)(s+10)\bigr)$: branches, real-axis segments, asymptotes, breakaway point, and the gain at which it crosses the imaginary axis.
:::

::: answer
Three poles at $0, -2, -10$, no zeros, so three branches and three asymptotes at $60^\circ$, $180^\circ$ and $300^\circ$, meeting at $\sigma_a = (0 - 2 - 10)/3 = -4$. Real-axis locus: $[-2, 0]$ (one pole to the right) and $(-\infty, -10]$ (three). Breakaway: $1/s + 1/(s+2) + 1/(s+10) = 0$ gives $3s^2 + 24s + 20 = 0$, roots $-0.945$ and $-7.055$; only the first lies on a locus segment, so breakaway is at $-0.945$ with $K = |s(s+2)(s+10)| = 0.945\times1.055\times9.055 = 9.03$. Imaginary-axis crossing: $s^3 + 12s^2 + 20s + K = 0$ with $s = j\omega$ gives $-j\omega^3 - 12\omega^2 + 20j\omega + K = 0$, so $\omega^2 = 20$ and $K = 12\times20 = 240$; the crossing is at $\omega = 4.47\ \mathrm{rad/s}$.
:::

::: check
Why does adding a zero at $-5$ to a loop with poles at $0$ and $-10$ bend the locus into a circle around the zero, and what does that buy a designer?
:::

::: answer
With $n = 2$ and $m = 1$ there is one finite zero and one asymptote at $180^\circ$. The real-axis segments are $[-10, 0]$ and $(-\infty, -5]$, so the two branches must leave the first segment and rejoin the second: they break away between $0$ and $-10$ and break in to the left of $-5$. Applying the angle condition to a general point shows the complex portion is exactly a circle centred on the zero with radius $\sqrt{(z-p_1)(z-p_2)} = \sqrt{5\times5} = 5$. What it buys is damping: without the zero the two branches would run straight up the vertical asymptote line and the damping ratio would fall as gain rose. With it, the branches curve back toward the real axis, so high gain gives *more* damping rather than less. That is the root-locus statement of what derivative action does.
:::

::: check
The rate channel's PI loop has closed-loop poles at $-37.3$, $-10$ and $-2.68$ at $k_p = 12\,000$. The vehicle flies with 30% more inertia than modelled. Where do the poles move, and how would you see this on the locus without recomputing?
:::

::: answer
The plant gain is $1/J$, so 30% more inertia scales $L$ by $1/1.3$, exactly as if $k_p$ and $k_i$ had both been reduced by that factor: $K = 500 \to 385$. That is a walk backwards along the same locus. Since $K = 385$ is above the break-in gain of 367 but only slightly, the two lower poles are near the break-in point at $-4.20$ and close to collision — at $K = 385$ they are at $-3.40$ and $-5.52$, with the fast pole at $-41.09$. The response is slower and the dominant pole has moved right, which is what a 23% loss of loop gain must do. No new locus is needed because an inertia error *is* a gain change.
:::

::: check
An engineer adds a derivative filter pole at $N = 50\ \mathrm{rad/s}$ to a loop whose dominant closed-loop poles sit near $-3 \pm 3j$. Estimate the effect on those poles, and state when this reasoning fails.
:::

::: answer
The new pole is far to the left of the dominant pair, about twelve times further out, so its angle contribution at the dominant location is nearly $0^\circ$ and its magnitude contribution is nearly constant. The dominant poles barely move; the main effect is one more branch running off to the left and a small rightward shift of the asymptote centroid, by $50/(n-m+1)$ compared with the old $n-m$ asymptotes. The reasoning fails when the loop gain is high enough that the dominant branches have travelled out toward the asymptotes and are no longer far from the new pole, and it fails completely if the "far" pole is actually a lightly damped pair, because a resonance contributes a rapid $180^\circ$ of angle over a narrow frequency range no matter how far away it looks on a gain plot.
:::

::: check
For the booster loop, what happens to the closed-loop poles if the rate gain $K_d$ is doubled to 3.18 while $K_p$ is held at 1.88?
:::

::: answer
Doubling $K_d$ with $K_p$ fixed changes two things at once: $K = \mu_\delta K_d$ doubles to $4.188$, and the zero $z = K_p/K_d$ halves to $0.5915$. So this is not a walk along the old locus — it is a different locus. Computing directly, the characteristic equation is $s^2 + 4.188s + (4.188 \times 0.5915 - 0.228) = s^2 + 4.188s + 2.2494$, with roots $-3.556$ and $-0.632$. The pair has become two real poles, one of them slow: $\omega_n$ is unchanged at $1.50\ \mathrm{rad/s}$ but $\zeta$ has risen to 1.40, overdamped. The vehicle is stable and stiff against gusts at high frequency but recovers its attitude error over $1/0.632 = 1.58\ \mathrm{s}$, which is slower than the original design. More rate feedback is not automatically better.
:::

## Summary

| Rule or fact | Statement |
| --- | --- |
| Locus equation | $1 + KL(s) = 0$; angle $\angle L = 180^\circ + k360^\circ$, magnitude $\lvert KL\rvert = 1$ |
| Branches | $n$ of them; start at open-loop poles, $m$ end at zeros, $n-m$ go to infinity |
| Real axis | on the locus where an odd number of real poles and zeros lie to the right |
| Asymptotes | angles $(2k+1)180^\circ/(n-m)$, centroid $\sigma_a = \bigl(\sum p_i - \sum z_j\bigr)/(n-m)$ |
| Breakaway / break-in | $\sum 1/(s-p_i) = \sum 1/(s-z_j)$, keeping roots on locus segments |
| Departure angle | $\theta_d = 180^\circ + \sum\angle(p_\ell - z_j) - \sum_{i\ne\ell}\angle(p_\ell - p_i)$ |
| Axis crossing | set $s = j\omega$ in $D + KN = 0$; real and imaginary parts both vanish |
| Pole sum | constant for $n - m \ge 2$: one branch left means another right |
| Zero / pole effect | a zero pulls the locus toward it (left); a pole pushes it away (right) |
| Rate channel, P | breakaway at $-25$, $k_p = 15\,000$; stable for all $k_p > 0$ |
| Rate channel, PI | asymptote centroid $-24$; break-in $-4.20$ at $k_p = 8814$, breakaway $-23.80$ at $k_p = 16\,338$ |
| Booster PD | crosses the axis at $K = \mu_\alpha/z$, i.e. $K_p = \mu_\alpha/\mu_\delta$; design point $-1.047 \pm 1.073j$ |

The locus answers "where are the poles", and a design certified only by pole locations is not certified. The next lesson gives the other half: a test performed on the frequency response of the open loop, which does not require finding any roots at all and which works when the plant is known only from measured data.
