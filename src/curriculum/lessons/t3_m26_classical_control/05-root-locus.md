---
id: l05-root-locus
title: The root locus, and designing with it
minutes: 23
covers:
  - Root locus construction rules and root-locus design
---

Imagine a volume knob on the controller. Turn it up from zero and every closed-loop pole moves. If you put a dot on the complex plane for each pole at every knob position, the dots trace out paths. That map of paths is the **[[root locus|evans]]** — "locus" is Latin for "place", so it is the set of places the roots can be.

Pole placement, in the last lesson, told you where the poles are for one set of gains. The root locus shows where they go for *every* gain, as a picture you can read in a second. Which path leaves the stable left half of the plane first? How much gain do you have before the damping collapses? Does a compensator zero pull the dominant poles where you want them?

On a launch vehicle it answers a question that comes up in every design review: the vehicle's inertia is uncertain by 30%, so what does that do to my closed-loop poles? An inertia error is a gain error, and a gain error is a walk along the locus.

## One equation, two conditions

Everything in this lesson comes from one equation. A unity-feedback loop with an adjustable gain $K$ has closed-loop poles where

$$
1 + K\,L(s) = 0, \qquad L(s) = \frac{N(s)}{D(s)} = \frac{\prod_{j}(s - z_j)}{\prod_{i}(s - p_i)} .
$$

Here $L(s)$ is the open loop with the gain pulled out. $N(s)$ is its numerator and $D(s)$ its denominator. The $z_j$ are its $m$ open-loop **zeros** (where the top is zero), the $p_i$ are its $n$ open-loop **poles** (where the bottom is zero), and $K \ge 0$. The symbol $\prod$ ("product") means multiply all the factors together. The **root locus** is every $s$ that solves this equation as $K$ runs from 0 to $\infty$.

Rearranged, the equation says $K\,L(s) = -1$. A complex number equals $-1$ only if its size is 1 and its angle points straight left, at $180^\circ$. That splits the equation into two conditions:

$$
|K\,L(s)| = 1
\qquad\text{and}\qquad
\angle L(s) = 180^\circ + k\cdot360^\circ .
$$

Here $k$ is any whole number, because turning a full $360^\circ$ more lands you in the same direction.

The **angle condition** alone decides *where* the locus is, because $K$ is a positive real number and adds no angle. The **magnitude condition** then tells you *which gain* puts a pole at a given point. That split is what makes a hand sketch possible.

How do you find the angle of $L(s)$ at a test point? Each factor $(s - p_i)$ is an **[[arrow from the pole to the test point|angle-condition]]**. Its angle is the direction of that arrow. Angles of zeros add, and angles of poles subtract:

$$
\angle L(s) = \sum_j \angle(s - z_j) - \sum_i \angle(s - p_i) .
$$

## The construction rules

Each rule below follows from the two conditions. Try to see why each is true rather than memorizing it.

**1. Number, start and end.** Multiply $1 + KL = 0$ through by $D$ to get $D(s) + KN(s) = 0$. That is a polynomial of degree $n$ (when $n \ge m$), so there are $n$ roots and $n$ paths, called **branches**. At $K = 0$ the equation is $D(s) = 0$, so the branches start at the open-loop poles. As $K \to \infty$ it becomes $N(s) = 0$ for finite $s$, so $m$ branches end at the open-loop zeros. The other $n - m$ run off to infinity.

**2. Real-axis segments.** Stand at a point on the real axis. A real pole or zero to your left points its arrow at you from the left: angle $0^\circ$. One to your right points from the right: angle $180^\circ$. A complex pair gives equal and opposite angles that cancel. So the angle condition holds exactly where the number of real poles and zeros **[[strictly to the right is odd|odd-count]]**.

**3. Asymptotes.** Far from everything, all the arrows point in nearly the same direction, so $L(s) \approx s^{m-n}$. The angle condition then gives $n - m$ **[[asymptote|asymptote-star]]** directions — straight lines the far-off branches approach:

$$
\theta_k = \frac{(2k+1)\,180^\circ}{n - m}, \qquad k = 0, 1, \ldots, n - m - 1 .
$$

Going one step further in the approximation shows where they all meet on the real axis, at the **centroid** $\sigma_a$ ("sigma sub a"):

$$
\sigma_a = \frac{\sum_i p_i - \sum_j z_j}{n - m} .
$$

**4. Breakaway and break-in points.** Two branches can meet on the real axis and leave it (a **breakaway**), or arrive at it from above and below (a **break-in**). On the real axis, $K = -D(s)/N(s)$, and at the meeting point this gain is at a local peak or dip. So $dK/ds = 0$. Worked through, that is the same as

$$
\sum_i \frac{1}{s - p_i} = \sum_j \frac{1}{s - z_j} .
$$

Solve it, then keep only the roots that lie on a real-axis segment of the locus.

**5. Departure and arrival angles.** Take a complex pole $p_\ell$ ("p sub ell"). Apply the angle condition at a point a tiny step away from it, and you get the direction the branch leaves in:

$$
\theta_{d} = 180^\circ + \sum_j \angle(p_\ell - z_j) - \sum_{i \ne \ell} \angle(p_\ell - p_i) .
$$

Arrival at a complex zero has the same form with the signs reversed. For a lightly damped pair, this one number tells you whether feedback damps the mode or drives it unstable.

**6. Imaginary-axis crossings.** Put $s = j\omega$ into $D + KN = 0$. The real part and the imaginary part must both be zero. Those two equations give the crossing frequency and the gain that puts a pole there. The **[[Routh array|routh]]** gives the same answer.

**7. Sum of the closed-loop poles.** If $n - m \ge 2$, the $s^{n-1}$ coefficient of $D + KN$ has no $K$ in it. That coefficient is minus the sum of the roots. So the sum of the closed-loop poles equals the sum of the open-loop poles, for every gain. If one branch moves left, another must move right by the same amount. It is a handy check on a sketch, and a first look at the **[[conservation ideas|pole-sum]]** later in this module.

::: example The rate channel under proportional control
The plant is $G(s) = 1/\bigl(Js(\tau s + 1)\bigr)$ with $J = 1200$ and $\tau = 0.02$. Pull out the constants: $J\tau = 24$ and $1/\tau = 50$, so $G = 1/\bigl(24\,s(s+50)\bigr)$. With $C = k_p$, the loop is $L = 1/\bigl(s(s+50)\bigr)$ and the gain is $K = k_p/24$.

**Rule 1.** Two poles, no zeros: $n = 2$, $m = 0$, two branches. They start at $0$ and $-50$.

**Rule 2.** Between $0$ and $-50$ there is one pole to the right — odd, so on the locus. Left of $-50$ there are two — even, so off.

**Rule 3.** $n - m = 2$ asymptotes at $\pm 90^\circ$, meeting at $\sigma_a = (0 - 50)/2 = -25$.

**Rule 4.** $1/s + 1/(s+50) = 0$ gives $s = -25$. The gain there is $K = |s(s+50)| = 25 \times 25 = 625$, so $k_p = 24 \times 625 = 15\,000$.

The whole picture: for $k_p < 15\,000$, two real poles slide toward each other. At $k_p = 15\,000$ they collide at $-25$ (critically damped). Above that they split and climb straight up and down along the line $\operatorname{Re}s = -25$.

Some points along the way. At the design gain $k_p = 12\,000$ the poles sit at $-13.82$ and $-36.18$. At $k_p = 24\,000$ they are at $-25 \pm 19.36j$, with damping $\zeta = 25/\sqrt{25^2+19.36^2} = 0.79$. At $k_p = 48\,000$ they are at $-25 \pm 37.08j$, with $\zeta = 0.56$. Sanity check: more gain, same real part, more height, so less damping. That matches.

The locus never touches the imaginary axis, so this loop is stable for every positive gain. That is the infinite gain margin from the first lesson, seen from the other side. Raising the gain does not destabilize it. It only makes it ring.
:::

## What a compensator does to the locus

Root-locus design is the craft of adding poles and zeros so the locus passes through the region you want.

**A zero pulls the locus toward itself**, and usually to the left. Every branch must end at a zero or at infinity, and each added zero removes one asymptote. With fewer asymptotes, the remaining ones swing away from the right half plane: $\pm 60^\circ$ becomes $\pm 90^\circ$, and $\pm 90^\circ$ becomes a single $180^\circ$. A PD controller adds a zero at $-k_p/k_d$. That is the whole mechanism by which derivative action adds damping.

**A pole pushes the locus away from itself**, and usually to the right. Each added pole adds an asymptote, and more asymptotes means they point closer to the right half plane: $\pm 90^\circ$ becomes $\pm 60^\circ$ and $180^\circ$. An actuator lag, a derivative filter, a sensor filter — each is a pole you did not want, and each costs stability.

**A pole and a zero close together act only locally.** Seen from far away, their arrows point in almost the same direction, so their angles nearly cancel and the locus barely notices them. Near them, the locus rearranges completely. This is the idea behind the PI controller's integrator-plus-zero, and behind the lag compensator later in this module: a pole at the origin with a zero close by raises the low-frequency gain enormously while leaving the dominant poles almost where they were.

::: example The rate channel under PI control
Add the integrator and its zero. The loop is $L = (k_ps + k_i)/\bigl(24s^2(s+50)\bigr)$. With $T_i = 0.5\ \mathrm{s}$, the zero is at $-k_i/k_p = -1/T_i = -2$, so $L = K(s+2)/\bigl(s^2(s+50)\bigr)$ with $K = k_p/24$.

**Rules 1 and 3.** Now $n = 3$ and $m = 1$. Branches start at $0$, $0$ and $-50$. One ends at the zero, $-2$. The other two leave along $\pm 90^\circ$ asymptotes with centroid

$$
\sigma_a = \frac{(0 + 0 - 50) - (-2)}{2} = -24 .
$$

**Rule 2.** On the real axis, only the segment from $-50$ to $-2$ passes the odd-count test.

**Rule 4.** The breakaway condition is $2/s + 1/(s+50) = 1/(s+2)$. Clearing the fractions leaves $2s\bigl(s^2 + 28s + 100\bigr) = 0$. The useful roots are $s = -4.202$ and $s = -23.798$.

- The first is a **break-in**, at $K = 367$ ($k_p = 8814$).
- The second is a **breakaway**, at $K = 681$ ($k_p = 16\,338$).

So the locus reads like this. The double pole at the origin splits into a complex pair that arcs out and to the left. Near $k_p = 8800$ the pair lands on the real axis at $-4.20$. Between $k_p = 8800$ and $k_p = 16\,300$ all three poles are real. Then two of them collide at $-23.80$ and rise along the asymptotes, while the third settles toward the zero at $-2$.

At the design gain, $k_p = 12\,000$ and $k_i = 24\,000$, the poles are $-37.32$, $-10$ and $-2.68$. All real — in the middle of that window. Check rule 7: $-37.32 - 10 - 2.68 = -50$, the sum of the open-loop poles, as it must be for every gain.

Now notice what the locus does **not** show. The pole at $-2.68$ looks dominant and slow. Its time constant is $1/2.68 = 0.37\ \mathrm{s}$, which promises a sluggish response taking about 1.5 s to settle. But the closed loop also has a zero at $-2$, right beside it, and that zero nearly cancels its effect. The actual response rises in about 0.13 s. A root locus plots denominators. The numerator is your responsibility.
:::

::: warning Know which knob is turning
A locus is drawn for one parameter. Sweeping $k_p$ with $k_i$ fixed gives a different curve from sweeping $k_p$ with $T_i$ fixed — and the second is what happens when you scale a whole PID up or down. Before reading a locus, be sure which quantity is moving. And remember that a plant parameter you never thought of as a gain, such as **[[inertia|inertia-gain]]** or dynamic pressure, moves you along the same curve.
:::

## Designing on the locus: the unstable booster

The case that makes the locus indispensable is a plant that is unstable on its own. A branch starts in the right half plane, and feedback has to drag it across into the left.

::: example The booster's PD loop, read off the locus
The booster from the atmospheric flight module is **[[aerodynamically unstable|aero-unstable]]**. Its pitch dynamics at maximum dynamic pressure are $\theta/\delta = \mu_\delta/(s^2 - \mu_\alpha)$, with $\mu_\alpha = 0.228\ \mathrm{s^{-2}}$ ("mu sub alpha", the aerodynamic instability) and $\mu_\delta = 1.317\ \mathrm{s^{-2}}$ ("mu sub delta", the control effectiveness). The open-loop poles are at $\pm\sqrt{0.228} = \pm 0.4775\ \mathrm{rad/s}$.

Close the PD loop $\delta = -(K_p\theta + K_d\dot\theta)$. The loop transfer function is

$$
L(s) = \frac{\mu_\delta K_d\,(s + z)}{s^2 - \mu_\alpha}, \qquad z = \frac{K_p}{K_d} .
$$

So the sweeping gain is $K = \mu_\delta K_d$, and the compensator zero sits at $-z$. With the module 18 gains $K_p = 1.88$ and $K_d = 1.59$: $z = 1.88/1.59 = 1.1824$ and $K = 1.317 \times 1.59 = 2.094$.

**Rules 1 and 3.** Two poles, one zero, $n - m = 1$. One branch ends at $-1.1824$ and one runs off to $-\infty$ along the single $180^\circ$ asymptote.

**Rule 2.** Between $-0.4775$ and $+0.4775$: one pole to the right, odd, on the locus. From $-1.1824$ to $-0.4775$: two, even, off. Left of $-1.1824$: three, odd, on.

**Rule 4.** Solve $1/(s - 0.4775) + 1/(s + 0.4775) = 1/(s + z)$. It reduces to $s^2 + 2zs + \mu_\alpha = 0$, so

$$
s = -z \pm \sqrt{z^2 - \mu_\alpha} = -0.1007 \ \text{and}\ -2.2641 .
$$

The gains there, from $K = -(s^2-\mu_\alpha)/(s+z)$, are $0.2014$ and $4.528$.

Now read the story as $K$ rises from zero. The unstable pole marches left from $+0.4775$, and the stable one marches right from $-0.4775$. The unstable branch crosses the imaginary axis at $s = 0$, where $K = \mu_\alpha/z = 0.1928$. Written in the original gains, $Kz = \mu_\delta K_p$, so this is exactly the minimum-gain condition $K_p > \mu_\alpha/\mu_\delta = 0.173$ from the atmospheric flight module. Below it the vehicle diverges, however much rate feedback you add.

At $K = 0.2014$ the two real poles collide at $-0.1007$ and break away into a complex pair. At $K = 4.528$ the pair returns to the real axis at $-2.2641$. In between, the pair travels on a **[[circle around the zero|booster-circle]]**.

The design gain $K = 2.094$ lies between those two, so the closed-loop poles are complex. The characteristic equation is $s^2 + Ks + (Kz - \mu_\alpha) = 0$:

$$
s^2 + 2.094s + (2.094 \times 1.1824 - 0.228) = s^2 + 2.094s + 2.248 = 0 .
$$

Its roots are $-1.047 \pm 1.073j$, with $\omega_n = \sqrt{2.248} = 1.50\ \mathrm{rad/s}$ and $\zeta = 1.047/1.50 = 0.70$. That is the design point the atmospheric flight module chose, recovered from the picture.
:::

That example holds the general lesson about designing on the locus. You do not pick gains and see what happens. You decide which region of the $s$-plane you need first:

- a **[[damping ray|damping-ray]]**, the line from the origin where $\zeta = \cos\theta$;
- a settling line, $\operatorname{Re}s < -4/t_s$, for a settling time $t_s$;
- a natural-frequency circle, $|s| = \omega_n$.

Then you place the compensator's zero so the locus passes through that region, and read the gain off the magnitude condition.

Here is the booster check in a few lines of Python. It prints the closed-loop poles at each interesting gain:

```python
import numpy as np

mu_a, mu_d, Kd = 0.228, 1.317, 1.59
z, K = 1.88 / Kd, mu_d * Kd
for g in (0.10, 0.1928, 0.2014, K, 4.5282, 12.0):
    print(round(g, 4), np.round(np.roots([1.0, g, g * z - mu_a]), 4))
# 2.094 [-1.047+1.0732j -1.047-1.0732j]   <- the design point
```

::: warning A locus shows poles, never margins
Two loops whose closed-loop poles sit in the same place can have wildly different gain and phase margins. Margins depend on the shape of $L(j\omega)$ at every frequency, including frequencies where the poles tell you nothing. And a locus drawn from a model that leaves out the actuator, the delay or the bending mode is a locus for a vehicle that does not exist. Use the locus to choose a structure and a region. Use the frequency-domain tools of the next lessons to certify the result.
:::

## Check yourself

::: check
Sketch the locus of $L(s) = 1/\bigl(s(s+2)(s+10)\bigr)$: branches, real-axis segments, asymptotes, breakaway point, and the gain at which it crosses the imaginary axis.
:::

::: answer
**Branches.** Three poles at $0$, $-2$, $-10$ and no zeros, so three branches, all going to infinity.

**Asymptotes.** Three of them, at $60^\circ$, $180^\circ$ and $300^\circ$, meeting at $\sigma_a = (0 - 2 - 10)/3 = -4$.

**Real axis.** $[-2, 0]$ has one pole to the right (odd, on). $[-10, -2]$ has two (off). $(-\infty, -10]$ has three (on).

**Breakaway.** $1/s + 1/(s+2) + 1/(s+10) = 0$ clears to $3s^2 + 24s + 20 = 0$, with roots $-0.945$ and $-7.055$. Only $-0.945$ lies on a locus segment. The gain there is $K = |s(s+2)(s+10)| = 0.945\times1.055\times9.055 = 9.03$.

**Axis crossing.** The closed loop is $s^3 + 12s^2 + 20s + K = 0$. Put $s = j\omega$: $-j\omega^3 - 12\omega^2 + 20j\omega + K = 0$. The imaginary part gives $\omega^2 = 20$. The real part gives $K = 12\omega^2 = 240$. So the crossing is at $\omega = \sqrt{20} = 4.47\ \mathrm{rad/s}$, with $K = 240$.
:::

::: check
A loop has poles at $0$ and $-10$. Why does adding a zero at $-20$ bend the locus into a circle around the zero, and what does that buy a designer? What would happen instead if the zero were at $-5$, between the poles?
:::

::: answer
With $n = 2$ and $m = 1$ there is one asymptote, at $180^\circ$. The real-axis segments are $[-10, 0]$ (one pole to the right) and $(-\infty, -20]$ (two poles and a zero, three in all). $[-20, -10]$ has two and is off.

So the two branches must leave the first segment and rejoin the second. They break away between $0$ and $-10$, swing through the complex plane, and break in to the left of $-20$. Applying the angle condition to a general point shows the complex part is exactly a circle centred on the zero, with radius $\sqrt{(z-p_1)(z-p_2)} = \sqrt{20\times10} = 14.14$. So the breakaway is at $-20 + 14.14 = -5.86$ and the break-in at $-20 - 14.14 = -34.14$.

What it buys is damping. Without the zero the two branches would run straight up the line $\operatorname{Re}s = -5$, and the damping ratio would fall as gain rose. With it, the branches curve back to the real axis, so high gain gives *more* damping, not less. That is the root-locus picture of what derivative action does.

With the zero at $-5$, between the poles, the segments become $[-5, 0]$ and $(-\infty, -10]$. The pole at $0$ runs straight to the zero, the pole at $-10$ runs off to $-\infty$, and the locus never leaves the real axis. No circle at all.
:::

::: check
The rate channel's PI loop has closed-loop poles at $-37.3$, $-10$ and $-2.68$ at $k_p = 12\,000$. The vehicle flies with 30% more inertia than modelled. Where do the poles move, and how could you see this on the locus without recomputing?
:::

::: answer
The plant gain is $1/J$. With 30% more inertia, $L$ is scaled by $1/1.3$, exactly as if $k_p$ and $k_i$ had both been cut by that factor. So $K = 500 \to 500/1.3 = 385$. That is a walk backwards along the same locus.

$K = 385$ is only slightly above the break-in gain of 367. So the two lower poles are still real but close to colliding near the break-in point at $-4.20$: they sit at $-3.40$ and $-5.50$, and the fast pole is at $-41.10$.

The pole that was at $-10$ has moved right to $-5.50$. Since the slow pole is mostly cancelled by the zero at $-2$, this pole sets the speed, so the response is slower. Meanwhile the slow pole has moved from $-2.68$ to $-3.40$, further from the zero, so the cancellation is less complete and a slow tail shows up in the response. Both are what a 23% loss of loop gain must do. No new locus is needed, because an inertia error *is* a gain change.
:::

::: check
An engineer adds a derivative filter pole at $N = 50\ \mathrm{rad/s}$ to a loop whose dominant closed-loop poles sit near $-3 \pm 3j$. Estimate the effect on those poles, and say when this reasoning fails.
:::

::: answer
The new pole at $-50$ is far to the left of the dominant pair — about twelve times further out. Seen from $-3 \pm 3j$, its arrow points almost straight along the real axis, so its angle is nearly $0^\circ$ and its magnitude barely changes nearby. The dominant poles hardly move.

The main effect is at high gain. There is one more branch, which runs off to the left from $-50$, and one more asymptote, so the asymptote angles swing closer to the right half plane (for example $\pm 90^\circ$ becomes $\pm 60^\circ$ and $180^\circ$).

The reasoning fails when the loop gain is high enough that the dominant branches have already travelled far out along the asymptotes — then they are no longer far from the new pole, and the new asymptotes bend them toward instability. It fails completely if the "far" pole is really a lightly damped pair. A resonance swings its angle through nearly $180^\circ$ over a narrow range of frequency, however far away it looks.
:::

::: check
For the booster loop, what happens to the closed-loop poles if the rate gain $K_d$ is doubled to 3.18 while $K_p$ stays at 1.88?
:::

::: answer
Doubling $K_d$ with $K_p$ fixed changes two things at once. $K = \mu_\delta K_d$ doubles to $4.188$, and the zero $z = K_p/K_d$ halves to $0.5915$. So this is not a walk along the old locus. It is a different locus.

Compute directly. The characteristic equation is $s^2 + 4.188s + (4.188 \times 0.5915 - 0.228) = s^2 + 4.188s + 2.2494$, with roots $-3.556$ and $-0.632$.

The complex pair has become two real poles, one of them slow. $\omega_n = \sqrt{2.2494} = 1.50\ \mathrm{rad/s}$, unchanged, but $\zeta = 4.188/(2 \times 1.50) = 1.40$: overdamped. The vehicle is stable, but it recovers from an attitude error with a time constant of $1/0.632 = 1.58\ \mathrm{s}$, slower than the original design. More rate feedback is not automatically better.
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

The locus answers "where are the poles?", and a design certified only by pole locations is not certified. The next lesson gives the other half: a test on the open loop's frequency response that needs no roots at all, and that works even when the plant is known only from measured data.

::: context evans The man with the Spirule
Walter R. Evans, an engineer in the American aircraft industry, published the root locus method in 1948 and 1950. Before computers, you checked the angle condition by hand, adding up the angles of many arrows at each test point. Evans also sold a small plastic protractor-and-arm called the **Spirule** that made adding those angles quick. Today software draws a locus in milliseconds, but the rules are still how you check it makes sense.
:::

::: context angle-condition Adding up the arrows
For the rate channel under P control, test the point $-25 + 19.36j$. The arrow from the pole at $-50$ has angle $37.8^\circ$. The arrow from the pole at $0$ has angle $142.2^\circ$. Poles subtract, so $\angle L = -(37.8^\circ + 142.2^\circ) = -180^\circ$ — the angle condition holds, and the point is on the locus.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 175" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="150" x2="350" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="80" y1="150" x2="330" y2="150" stroke="#1d6fd1" stroke-width="4"/>
  <line x1="205" y1="15" x2="205" y2="150" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5,4"/>
  <line x1="80" y1="150" x2="205" y2="53.2" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="330" y1="150" x2="205" y2="53.2" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M110,150 A30,30 0 0,0 103.72,131.63" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M352,150 A22,22 0 0,0 312.60,136.53" fill="none" stroke="#b4232c" stroke-width="2"/>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="75" y1="145" x2="85" y2="155"/><line x1="75" y1="155" x2="85" y2="145"/>
    <line x1="325" y1="145" x2="335" y2="155"/><line x1="325" y1="155" x2="335" y2="145"/>
  </g>
  <circle cx="205" cy="53.2" r="4" fill="#1f2a44"/>
  <text x="213" y="50" font-size="11" fill="#1f2a44">−25 + 19.36j</text>
  <text x="120" y="140" font-size="11" fill="#b4232c">37.8°</text>
  <text x="352" y="128" font-size="11" text-anchor="end" fill="#b4232c">142.2°</text>
  <text x="80" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">−50</text>
  <text x="330" y="168" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
</svg>
```
:::

::: context odd-count The odd-count rule in a picture
For the PI loop $K(s+2)/\bigl(s^2(s+50)\bigr)$, count what lies to the right of each stretch of real axis. Between $-2$ and $0$: the double pole, two, even — off. Between $-50$ and $-2$: two poles and a zero, three, odd — on. Left of $-50$: four, even — off.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="50" x2="350" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="50" x2="318" y2="50" stroke="#1d6fd1" stroke-width="5"/>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="25" y1="45" x2="35" y2="55"/><line x1="25" y1="55" x2="35" y2="45"/>
    <line x1="325" y1="45" x2="335" y2="55"/><line x1="325" y1="55" x2="335" y2="45"/>
  </g>
  <circle cx="318" cy="50" r="5" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="30" y="75" font-size="11" text-anchor="middle" fill="#1f2a44">−50</text>
  <text x="312" y="75" font-size="11" text-anchor="middle" fill="#1f2a44">−2</text>
  <text x="338" y="35" font-size="11" text-anchor="middle" fill="#1f2a44">0 (×2)</text>
  <text x="174" y="38" font-size="12" text-anchor="middle" fill="#1d6fd1">three to the right: on the locus</text>
  <text x="180" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">× pole   ○ zero   (drawn to scale)</text>
</svg>
```
:::

::: context asymptote-star The asymptote stars
The far-off branches fan out evenly, like spokes. With $n - m$ of them, the angles are spaced $360^\circ/(n - m)$ apart, and one always points straight left when $n - m$ is odd.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="45" y1="60" x2="10" y2="60"/>
    <line x1="135" y1="60" x2="135" y2="25"/><line x1="135" y1="60" x2="135" y2="95"/>
    <line x1="225" y1="60" x2="242.5" y2="29.69"/><line x1="225" y1="60" x2="190" y2="60"/><line x1="225" y1="60" x2="242.5" y2="90.31"/>
    <line x1="315" y1="60" x2="339.75" y2="35.25"/><line x1="315" y1="60" x2="290.25" y2="35.25"/><line x1="315" y1="60" x2="290.25" y2="84.75"/><line x1="315" y1="60" x2="339.75" y2="84.75"/>
  </g>
  <g fill="#1f2a44"><circle cx="45" cy="60" r="3"/><circle cx="135" cy="60" r="3"/><circle cx="225" cy="60" r="3"/><circle cx="315" cy="60" r="3"/></g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="30" y="118">n − m = 1</text><text x="135" y="118">2: ±90°</text><text x="225" y="118">3: ±60°, 180°</text><text x="315" y="118">4: ±45°, ±135°</text>
  </g>
</svg>
```
:::

::: context routh The Routh array
Edward Routh, a Cambridge mathematician, worked out in the 1870s how to tell whether a polynomial has roots in the right half plane without finding the roots. You arrange its coefficients in a small table and count sign changes down the first column. Each sign change is one unstable root. A row of zeros appearing at some gain marks exactly the gain where a pair of roots sits on the imaginary axis — the crossing that rule 6 finds.
:::

::: context pole-sum Conservation shows up again
Rule 7 says the poles cannot all move left together: if feedback pushes one pole left, another is pushed right. Lesson 11 meets a stronger version of the same idea, the **waterbed effect**. There, pushing the loop's sensitivity down at some frequencies forces it up at others. Both are limits built into the mathematics, not failures of a particular design.
:::

::: context inertia-gain Why inertia really is a gain
The rate plant is $1/(Js)$ times the actuator. Change $J$ and every point of $L(s)$ is multiplied by the same number, which is exactly what turning the gain knob does. On a launch vehicle, inertia is not even constant: as the propellant burns, the vehicle gets lighter and its inertia drops a great deal during ascent. The controller's effective gain rises through the flight unless the gains are changed to match, which is part of why gains are scheduled.
:::

::: context aero-unstable Why the booster is unstable
Air pushes on a rocket at a point called the **centre of pressure**. On many boosters it sits ahead of the centre of mass, especially without big fins. Tilt the nose a little, and the air pushes it further round, the way a dart thrown backwards flips over. That tendency is $\mu_\alpha$. Only the swivelling engine, $\mu_\delta$, holds the vehicle straight, and it can only do so with feedback.
:::

::: context booster-circle The booster's locus, to scale
The complex part of the booster locus is a circle centred on the zero at $-1.1824$, with radius $\sqrt{(1.1824 + 0.4775)(1.1824 - 0.4775)} = 1.082$. The breakaway point $-0.1007$ and the break-in point $-2.2641$ are its right and left ends. The design poles $-1.047 \pm 1.073j$ sit on it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="100" x2="350" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="290" y1="15" x2="290" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <line x1="261.35" y1="100" x2="318.65" y2="100" stroke="#1d6fd1" stroke-width="4"/>
  <line x1="10" y1="100" x2="219.06" y2="100" stroke="#1d6fd1" stroke-width="4"/>
  <circle cx="219.06" cy="100" r="64.9" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="256.35" y1="95" x2="266.35" y2="105"/><line x1="256.35" y1="105" x2="266.35" y2="95"/>
    <line x1="313.65" y1="95" x2="323.65" y2="105"/><line x1="313.65" y1="105" x2="323.65" y2="95"/>
  </g>
  <circle cx="219.06" cy="100" r="5" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="227.18" cy="35.61" r="4.5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="227.18" cy="164.39" r="4.5" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="22" font-size="11" text-anchor="end" fill="#1f2a44">design −1.047 ± 1.073j</text>
  <text x="219" y="120" font-size="11" text-anchor="middle" fill="#1f2a44">−1.18</text>
  <text x="325" y="120" font-size="11" fill="#1f2a44">+0.48</text>
  <text x="150" y="118" font-size="11" text-anchor="end" fill="#1f2a44">−2.26</text>
  <text x="296" y="188" font-size="11" fill="#6c7a93">jω</text>
</svg>
```
:::

::: context damping-ray Reading damping as an angle
Draw a line from the origin to a pole. The angle $\theta$ between that line and the negative real axis tells you the damping: $\zeta = \cos\theta$. A pole on the negative real axis has $\theta = 0$ and $\zeta = 1$. A pole on the imaginary axis has $\theta = 90^\circ$ and $\zeta = 0$, no damping at all. So "at least $\zeta = 0.7$" means "inside a wedge of $\pm 45.6^\circ$ around the negative real axis".
:::
