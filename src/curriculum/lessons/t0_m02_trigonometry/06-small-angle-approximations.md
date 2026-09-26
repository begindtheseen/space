---
id: l06-small-angle-approximations
title: Small-angle approximations
minutes: 21
covers:
  - small-angle approximations
---

Watch a playground swing when it only moves a little. Big push or small push, each back-and-forth takes almost exactly the same time. That surprising fact comes from a piece of mathematics you are about to learn: when an angle is small, the sine of the angle is almost exactly the angle itself. The messy curve of the sine function turns into a straight line, and hard problems turn into easy ones.

Most angles in guidance and control are small. An attitude controller holds a spacecraft within half a degree of its target. A rocket's engine swings a few degrees to steer. A star tracker measures angles of a few arcseconds. For angles like these, the trigonometric functions shrink to simple polynomials — $\sin\theta$ becomes $\theta$, $\cos\theta$ becomes $1$ — and difficult equations of motion become **[[linear|linear-word]]** ones. Linear equations can be solved exactly, studied with the tools of control theory, and run on a flight computer in a handful of multiplications. Almost every control law in this course is designed on a small-angle version of the vehicle.

The approximation is also a trap. It is so handy that people use it where it does not hold. And because $\sin\theta \approx \theta$ is *nearly* right even at $30^\circ$, it fails gradually, not all at once. A controller tuned on the small-angle model behaves slightly wrong, then noticeably wrong, then unstable, as the angle grows. So you need more than "it's small". You need the size of the error at each angle. That is the difference between a shortcut you can defend in a design review and one you cannot.

## Sine, angle, tangent: the squeeze

Cut a very thin slice of pizza. Its curved crust is almost a straight line. That is the whole idea of this section, in one picture.

On the unit circle, the angle $\theta$ in radians *is* the length of the curved arc (lesson 1). The sine is the straight up-and-down height of the arc's end. The tangent is the height where the ray hits the upright line touching the circle at $(1, 0)$. For a big angle these three lengths are very different. For a tiny angle they are all nearly the same, because a tiny piece of a circle is nearly straight. And they always come in the same order: for $0 < \theta < \pi/2$,

$$
\sin\theta < \theta < \tan\theta .
$$

::: note Why it has to be true
Draw the unit circle and an angle $\theta$ between $0$ and $\pi/2$. Three [[shapes sit one inside another|squeeze-areas]]:

- The small triangle with corners at the origin, $(1, 0)$ and $(\cos\theta, \sin\theta)$. Its base is $1$ and its height is $\sin\theta$, so its area is $\tfrac{1}{2}\sin\theta$.
- The pie slice (the **sector**) between the $x$ axis and the ray at $\theta$. It is the fraction $\theta/2\pi$ of the whole disc, whose area is $\pi$, so its area is $\tfrac{\theta}{2\pi}\cdot\pi = \tfrac{1}{2}\theta$. It contains the small triangle.
- The big right triangle with corners at the origin, $(1, 0)$ and $(1, \tan\theta)$. Its area is $\tfrac{1}{2}\tan\theta$. It contains the sector.

Each shape fits inside the next, so each area is smaller than the next: $\tfrac{1}{2}\sin\theta < \tfrac{1}{2}\theta < \tfrac{1}{2}\tan\theta$. Double everything and you have the result.
:::

Two things follow.

**The squeeze.** Divide $\sin\theta < \theta < \tan\theta$ by $\sin\theta$ (positive here). Since $\tan\theta/\sin\theta = 1/\cos\theta$, you get

$$
1 < \frac{\theta}{\sin\theta} < \frac{1}{\cos\theta} .
$$

As $\theta$ shrinks toward zero, $\cos\theta$ goes to $1$, so $1/\cos\theta$ goes to $1$ as well. The ratio $\theta/\sin\theta$ is trapped between $1$ and something heading to $1$, so it is squeezed to $1$. That is what $\sin\theta \approx \theta$ means for small $\theta$: the arc and its height become impossible to tell apart.

**The direction of the error.** $\theta$ is always a bit *more* than $\sin\theta$ and a bit *less* than $\tan\theta$. Always.

One warning is built into this. The sector's area is $\tfrac{1}{2}\theta$ only when $\theta$ is in radians. In degrees the rule would read $\sin\theta \approx 0.01745\,\theta$ (that is, $\pi/180$ times the angle in degrees). Every clean formula in this lesson depends on measuring angles by arc length — the deepest reason lesson 1 insisted on radians.

## How far the cosine drops below 1

Tilt your phone a little. Its screen, seen from straight above, looks a tiny bit shorter. How much shorter? The cosine says so: the shadow of a length $L$ tilted by $\theta$ is $L\cos\theta$. For small tilts, "the cosine is about $1$" is true but useless — it says the screen does not shrink at all. We want the small amount it *does* shrink.

Lesson 4 gave the half-angle form $\cos\theta = 1 - 2\sin^2(\theta/2)$. For small $\theta$, $\sin(\theta/2) \approx \theta/2$. Put that in:

$$
\cos\theta \approx 1 - 2\left(\frac{\theta}{2}\right)^2 = 1 - 2 \cdot \frac{\theta^2}{4} = 1 - \frac{\theta^2}{2} .
$$

That is far more useful than "$\cos\theta \approx 1$". The amount $1 - \cos\theta$ (old navigators called it the **[[versine|versine]]**) is exactly what you need whenever a cosine loss is the whole point:

- the push along the rocket's axis lost when the engine swings sideways;
- how far the Earth's surface curves away below a flat plane;
- the fuel wasted when a burn points slightly the wrong way.

In each case $\cos\theta \approx 1$ says the effect is zero, which is useless. $1 - \cos\theta \approx \theta^2/2$ gets it very accurately.

The square has a practical meaning. A cosine loss shrinks four times as fast as the angle: halve a misalignment and you cut its cosine loss by a factor of four. A misalignment of $0.5^\circ$ is $0.00873$ rad, and it costs $\theta^2/2 = 0.00873^2/2 = 3.8 \times 10^{-5}$ — that is, $0.0038\%$ — of whatever is being projected. This is why the pointing requirement for a thrust direction is loose (degrees) while a telescope's is tight (**[[arcseconds|arcsecond]]**). The first is a cosine effect, with a squared, tiny error. The second is a sine effect: the error grows in step with the angle.

## The cubic correction to the sine

$\sin\theta \approx \theta$ is a first guess. The next term tells you how wrong the guess is. Here is the result, then where it comes from:

$$
\sin\theta \approx \theta - \frac{\theta^3}{6} .
$$

Read $\theta^3$ as "theta cubed", $\theta \times \theta \times \theta$. Since $\theta$ is small, $\theta^3$ is *very* small: for $\theta = 0.1$, $\theta^3/6$ is only $0.000167$.

::: note Why it has to be true
Suppose the sine has the form $\sin\theta \approx \theta - a\theta^3$ for some number $a$, ignoring the far smaller terms in $\theta^5$ and beyond. We find $a$ with an identity: the **triple-angle formula**, built from the sum and double-angle formulas of lesson 4.

$$
\sin 3\theta = \sin 2\theta\cos\theta + \cos 2\theta\sin\theta = 2\sin\theta\cos^2\theta + (1 - 2\sin^2\theta)\sin\theta = 3\sin\theta - 4\sin^3\theta .
$$

The first step is the sum formula with angles $2\theta$ and $\theta$. The last step swaps $\cos^2\theta$ for $1 - \sin^2\theta$ and collects terms.

Now put the guessed form into both sides, keeping terms up to $\theta^3$.

Left: $\sin 3\theta \approx 3\theta - a(3\theta)^3 = 3\theta - 27a\theta^3$.

Right: $3(\theta - a\theta^3) - 4\theta^3 = 3\theta - (3a + 4)\theta^3$. (Inside $4\sin^3\theta$, only the leading $\theta^3$ matters; the rest is smaller than we are keeping.)

The $\theta^3$ parts must match: $27a = 3a + 4$, so $24a = 4$ and $a = 1/6$.
:::

The tangent follows by division. Use $\cos\theta \approx 1 - \theta^2/2$ and the algebra fact that $1/(1 - x) \approx 1 + x$ when $x$ is small (try it: $1/0.99 = 1.0101\ldots$):

$$
\tan\theta = \frac{\sin\theta}{\cos\theta} \approx \left(\theta - \frac{\theta^3}{6}\right)\left(1 + \frac{\theta^2}{2}\right) \approx \theta + \frac{\theta^3}{2} - \frac{\theta^3}{6} = \theta + \frac{\theta^3}{3} .
$$

(Multiplying out also gives a $\theta^5$ term, which is too small to keep.)

These are the first terms of the **[[Maclaurin series|maclaurin]]**, which the calculus module derives in general and carries on. The next terms are $+\theta^5/120$ for the sine, $+\theta^4/24$ for the cosine and $+2\theta^5/15$ for the tangent. You will seldom need them. The cubic sine stays within $0.1\%$ of the truth all the way to $30^\circ$. The quadratic cosine stays that close to about $20^\circ$, and the cubic tangent to about $15^\circ$.

::: key Small-angle approximations
For $\theta$ in radians: $\sin\theta \approx \theta - \theta^3/6$, $\cos\theta \approx 1 - \theta^2/2$, $\tan\theta \approx \theta + \theta^3/3$. To first order, $\sin\theta \approx \tan\theta \approx \theta$ and $\cos\theta \approx 1$.
:::

The inverse functions behave the same way near zero: $\arcsin x \approx x + x^3/6$ and $\arctan x \approx x - x^3/3$ for small $x$. So a small ratio *is* the angle in radians, to first order. When a gimbal's sideways-to-forward force ratio is $0.05$, the gimbal angle is $0.05$ rad, or $2.86^\circ$, good to a tenth of a percent.

## How big is the error

The cubic term *is* the error of the first-order guess. For the sine, $\theta - \sin\theta \approx \theta^3/6$. The **[[relative error|relative-error]]** — the error as a fraction of the true value — is then

$$
\frac{\theta - \sin\theta}{\sin\theta} \approx \frac{\theta^3/6}{\theta} = \frac{\theta^2}{6} .
$$

(On the bottom we used $\sin\theta \approx \theta$, which is fine for estimating a small error.)

Now ask: when does that reach $1\%$? Set $\theta^2/6 = 0.01$. Then $\theta^2 = 0.06$ and $\theta = 0.245$ rad, which is $14.0^\circ$. For $0.1\%$: $\theta^2 = 0.006$, $\theta = 0.0775$ rad $= 4.4^\circ$.

The tangent's relative error is $\theta^2/3$, twice as big. For $\cos\theta \approx 1$ it is $\theta^2/2$, three times as big: $1\%$ at only $8.1^\circ$. The table gives exact figures (positive means the shortcut is too big):

| $\theta$ | $\theta$ (rad) | $\sin\theta \approx \theta$ | $\sin\theta \approx \theta - \theta^3/6$ | $\cos\theta \approx 1$ | $\cos\theta \approx 1 - \theta^2/2$ | $\tan\theta \approx \theta$ |
| --- | --- | --- | --- | --- | --- | --- |
| $1^\circ$ | 0.0175 | +0.005% | 0.000% | +0.015% | 0.000% | −0.010% |
| $5^\circ$ | 0.0873 | +0.13% | 0.000% | +0.38% | 0.000% | −0.25% |
| $10^\circ$ | 0.1745 | +0.51% | −0.001% | +1.54% | −0.004% | −1.02% |
| $14^\circ$ | 0.2443 | +1.00% | −0.003% | +3.06% | −0.015% | −2.00% |
| $15^\circ$ | 0.2618 | +1.15% | −0.004% | +3.53% | −0.020% | −2.30% |
| $20^\circ$ | 0.3491 | +2.06% | −0.013% | +6.42% | −0.066% | −4.10% |
| $30^\circ$ | 0.5236 | +4.72% | −0.065% | +15.5% | −0.36% | −9.31% |
| $45^\circ$ | 0.7854 | +11.1% | −0.35% | +41.4% | −2.20% | −21.5% |

The signs confirm the squeeze: $\theta$ is always above the sine and below the tangent. Read the columns as budgets. If a design can live with $1\%$ model error, $\sin\theta \approx \theta$ is good to about $14^\circ$, $\tan\theta \approx \theta$ to about $10^\circ$, and $\cos\theta \approx 1$ to about $8^\circ$. Adding the next term stretches the safe range to roughly three or four times the angle for the same error. You can see the gap open up on a graph of [[the sine curve against the line y = θ|sine-hugs-line]].

::: key Where the first-order sine approximation exceeds 1%
At about $14^\circ$ ($0.245$ rad), since the relative error grows as $\theta^2/6$. At $15^\circ$ the error is already about 1.15%; at $30^\circ$ it is 4.7%.
:::

::: warning Small compared to what?
The error depends on the angle in radians, squared. So "small" has a precise meaning: $\theta^2/6$ must be smaller than the accuracy you need. A turn of $30^\circ$ is not a small angle for a controller that must be accurate to $1\%$. And watch for multiples of the angle. $\sin 2\theta \approx 2\theta$ has four times the relative error of $\sin\theta \approx \theta$ at the same $\theta$, because the thing inside the sine has doubled, and the error grows as its square.
:::

## Where it is used

**Swinging and wobbling things.** Many objects are pulled back toward the middle with a force that grows with the sine of how far they have swung: a pendulum, a spacecraft feeling the gravity-gradient torque of lesson 4, a rocket whose air loads grow with its angle to the airflow. Each obeys an equation like $I\ddot\theta = -k\sin\theta$. (Here $\ddot\theta$, read "theta double-dot", is the angular acceleration; $I$ measures how hard the body is to spin, and $k$ how strong the pull back is.) With $\sin\theta \approx \theta$ this becomes $I\ddot\theta = -k\theta$. That is the simple back-and-forth motion whose solution you can write down, a steady wave with angular frequency $\sqrt{k/I}$. The exact equation has no such simple solution. In it, the time per swing depends on how big the swing is, and the small-angle model misses that. For a pendulum swinging out to $20^\circ$, the true swing time is about $0.8\%$ longer than the small-angle prediction — small, but measurable, and it grows with the swing. That is the [[playground swing|pendulum-clock]] from the start of the lesson.

**Steering engines.** An engine of thrust $F$ swung sideways by an angle $\delta$ ("delta") pushes sideways with $F\sin\delta \approx F\delta$ and forward with $F\cos\delta \approx F(1 - \delta^2/2)$. The sideways push — the steering power — grows in straight proportion to the swing angle. That is why thrust-vector control loops can be designed as linear systems, with a gain of $F$ newtons per radian.

**How big things look.** Hold your thumb out at arm's length: it covers about $2^\circ$ of sky. An object of size $s$ at distance $r$, square-on to your line of sight, covers an angle $2\arctan(s/2r) \approx s/r$. That is lesson 1's $s = r\theta$, and it is good to a part in a thousand for anything smaller than about $5^\circ$. The Moon, $3474$ km across at $384\,400$ km, covers $3474/384\,400 = 0.00904$ rad $= 0.518^\circ$, and the exact arctangent formula gives the same to four figures. Your thumb could hide four Moons.

**The curve of the Earth.** Stand on a ball of radius $R$ and look along a flat plane touching it at your feet. At ground distance $d$, the surface has dropped below that plane by $R(1 - \cos(d/R)) \approx R \cdot \tfrac{1}{2}(d/R)^2 = d^2/2R$. Turn the same rule round and you get how far you can see from height $h$ — [[the distance to the horizon|horizon-picture]]: $d \approx \sqrt{2Rh}$.

::: example Gimbal forces with and without the approximation
A first-stage engine produces $F = 845$ kN and is swung (gimballed) $\delta = 5^\circ = 0.08727$ rad.

**Sideways force.** Exact: $F\sin\delta = 845 \times 0.08716 = 73.65$ kN. Shortcut: $F\delta = 845 \times 0.08727 = 73.74$ kN. That is $0.13\%$ high, exactly as the table said for $5^\circ$.

**Forward thrust.** Exact: $F\cos\delta = 841.78$ kN. The crude shortcut $F\cos\delta \approx F = 845$ kN misses the loss completely. The quadratic one gives $F(1 - \delta^2/2) = 845 \times (1 - 0.003808) = 841.78$ kN, right to five figures. The thrust lost is $F(1 - \cos\delta) = 3.22$ kN exactly, and $F\delta^2/2 = 3.22$ kN by the shortcut.

**At the gimbal's limit,** $\delta = 8^\circ = 0.1396$ rad. The linear sideways force is $117.98$ kN against an exact $117.60$ kN, an error of $0.33\%$ — still well inside what a control design can live with.

So the steering "gain" of this engine is $F = 845$ kN per radian, or $845 \times \pi/180 = 14.7$ kN per degree.
:::

::: example Earth curvature under a long-range trajectory
A sounding rocket's path is computed on a flat-Earth grid that touches the ground at the launch site. At $100$ km downrange, how far has the real Earth's surface dropped below that flat grid? Use $R = 6371$ km.

$$
h = R\left(1 - \cos\frac{d}{R}\right) \approx \frac{d^2}{2R} = \frac{(100\,000)^2}{2 \times 6.371 \times 10^6} = 785\ \mathrm{m} .
$$

The exact value is $784.79$ m and the shortcut gives $784.81$ m. The angle $d/R = 0.0157$ rad is tiny, so the quadratic form is essentially exact.

**At 1000 km downrange** the angle is $0.157$ rad ($9^\circ$). The exact drop is $78.32$ km and the shortcut gives $78.48$ km, $0.2\%$ high. That is still fine for a first estimate. But a flat-Earth model has long since stopped being acceptable for other reasons: gravity points in visibly different directions at the two ends.

**The horizon.** From an eye height of $2$ m, $d \approx \sqrt{2 \times 6.371 \times 10^6 \times 2} = 5.05$ km, matching the exact geometry to five figures. From the ISS at $420$ km, $\sqrt{2Rh} = 2313$ km. The exact answers (worked as in lesson 5, but with $R = 6371$ km instead of $6378$ km) are a ground distance of $2252$ km and a slant range of $2351$ km. The shortcut has landed *between* the two. At a central angle of $20^\circ$, the arc, the straight line and the tangent have visibly separated — which is the approximation breaking, as the table's $20^\circ$ row warned.
:::

## Where it breaks

The approximation fails in three situations you can learn to spot.

**Big turns.** A spacecraft turning $90^\circ$ to face a new target, a rocket pitching over from straight up to sideways, a capsule coming back into the atmosphere tilted $25^\circ$ to the airflow: none of these are small. A controller designed on the small-angle model must be checked — and usually redesigned — against the full equations. Or it must work in a series of small steps. Or it must be replaced by a method, such as **[[quaternions|quaternion-bridge]]**, that never needed small angles at all.

**Near the tangent's blow-up.** $\tan\theta \approx \theta$ is not merely inaccurate near $90^\circ$; it is wrong in kind. The tangent shoots off to infinity there, and the straight line $\theta$ does not. Any formula with the tangent of an angle that can get close to a right angle needs the exact function.

**When the answer *is* the correction.** If what you want is $1 - \cos\theta$, then $\cos\theta \approx 1$ gives zero, while $\cos\theta \approx 1 - \theta^2/2$ gives the answer. Likewise, if you want the difference $\theta - \sin\theta$ — how far a pendulum strays from the simple model, or the timing error of an oscillator — you need the cubic term, because the first terms cancel exactly. The rule: keep one more term than the order where your answer first shows up.

::: note Derivatives, for later
When you reach calculus, $\sin\theta \approx \theta$ will come back as the statement that the slope of the sine curve at zero is exactly $1$. And $\cos\theta \approx 1 - \theta^2/2$ will come back as the statement that the cosine's second derivative at zero is $-1$. Both are only true in radians — the calculus reason for the radian.
:::

## Check yourself

::: check
Without a calculator, estimate $\sin 0.1$ and $\cos 0.1$ (the angle is in radians). Then compare with a calculator.
:::

::: answer
$\sin 0.1 \approx 0.1 - 0.1^3/6 = 0.1 - 0.001/6 = 0.1 - 0.000167 = 0.099833$. A calculator gives $0.0998334$.

$\cos 0.1 \approx 1 - 0.1^2/2 = 1 - 0.005 = 0.995$. A calculator gives $0.9950042$.

Both shortcuts are right to about five decimal places, because $0.1$ rad (about $5.7^\circ$) is small.
:::

::: check
A control law uses $\sin\theta \approx \theta$. The vehicle pitches $25^\circ$ off target. What relative error does the approximation carry there, and what would adding the cubic term reduce it to?
:::

::: answer
$25^\circ = 0.4363$ rad and $\sin 25^\circ = 0.4226$. The first-order error is $(0.4363 - 0.4226)/0.4226 = 3.2\%$. The quick estimate $\theta^2/6 = 0.0317$ agrees.

With the cubic term, $\theta - \theta^3/6 = 0.4363 - 0.01384 = 0.4225$, an error of $-0.03\%$: a hundred times smaller.

Why it matters: a $3\%$ error in how stiff a control loop thinks the vehicle is shifts the loop's natural frequency by about $1.6\%$ (the frequency goes as a square root, and $\sqrt{1.032} \approx 1.016$), and its damping by a similar amount. That is fine for some loops and not for others, and the design must say which.
:::

::: check
A 10 m spacecraft is seen from 20 km away. What angle does it cover, in radians and in arcminutes? How much does the exact formula differ from the small-angle one?
:::

::: answer
$\theta \approx s/r = 10/20\,000 = 5.0 \times 10^{-4}$ rad. In degrees that is $0.02865^\circ$; times $60$ gives $1.719$ arcminutes.

The exact value is $2\arctan(5/20\,000) = 2\arctan(2.5 \times 10^{-4})$. It differs from $5.0 \times 10^{-4}$ by about $\theta^3/12 \approx 10^{-11}$ rad — a relative difference of $2 \times 10^{-8}$, far below anything an instrument could measure.
:::

::: check
An engineer argues that since $\cos\theta \approx 1$, a $30^\circ$ misalignment between a thruster and the desired burn direction costs "essentially nothing" in delivered $\Delta v$. Is that right?
:::

::: answer
No. The part of the burn along the desired direction is $\Delta v\cos 30^\circ = 0.866\,\Delta v$, so $13.4\%$ of the burn is wasted along the desired axis — and half of it, $\Delta v\sin 30^\circ$, goes sideways.

The claim mixes up "the cosine is near $1$ for small angles" with "the cosine loss is negligible". At $30^\circ$ the loss is $1 - \cos 30^\circ = 0.134$. Even the better shortcut, $\theta^2/2 = 0.137$, is $2.3\%$ off, because $30^\circ$ is not small. The claim would be fair for a misalignment of a degree or two: at $1^\circ$ the loss is $1.5 \times 10^{-4}$.
:::

::: check
The gravity-gradient torque of lesson 4 goes as $\sin 2\theta$. If a pitch angle of $10^\circ$ is called "small" and the torque is simplified to use $2\theta$, what relative error results? How does it compare with the error of $\sin\theta \approx \theta$ at the same $\theta$?
:::

::: answer
The angle inside the sine is $2\theta = 20^\circ = 0.3491$ rad, and $\sin 20^\circ = 0.3420$. The relative error is $(0.3491 - 0.3420)/0.3420 = 2.1\%$.

The error of $\sin 10^\circ \approx 0.1745$ is $0.51\%$. The ratio is four, because the relative error grows as the square of what is inside the sine, and that has doubled. When a formula has a multiple of the angle, test the multiple for smallness, not the angle.
:::

::: check
A navigation filter computes a small heading correction as $\arctan(\Delta y/\Delta x)$. A colleague proposes replacing it with $\Delta y/\Delta x$ to save a function call. For $\Delta y/\Delta x = 0.2$, how large is the error, and is the swap safe?
:::

::: answer
$\arctan 0.2 = 0.1974$ rad, so $0.2$ is $1.3\%$ high. The estimate $x^2/3 = 0.04/3 = 1.33\%$ agrees.

Whether $1.3\%$ is acceptable depends on the filter's accuracy needs. But the swap is unsafe for a different reason: $\Delta y/\Delta x$ is the $\arctan(y/x)$ mistake of lesson 3 in disguise. It divides by zero when $\Delta x = 0$, and it returns a small "correction" for an arrow pointing backwards. If the correction is guaranteed small and $\Delta x$ guaranteed positive, the ratio is fine to about $1\%$ at $0.2$. Otherwise, use `atan2`.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\sin\theta < \theta < \tan\theta$ | For $0 < \theta < \pi/2$; the squeeze from three nested areas |
| $\sin\theta \approx \theta - \theta^3/6$ | Cubic coefficient from the triple-angle identity |
| $\cos\theta \approx 1 - \theta^2/2$ | From $\cos\theta = 1 - 2\sin^2(\theta/2)$ |
| $\tan\theta \approx \theta + \theta^3/3$ | Sine over cosine, expanded |
| $\arcsin x \approx x + x^3/6$, $\arctan x \approx x - x^3/3$ | Inverses; a small ratio is the angle in radians |
| Relative error of $\sin\theta \approx \theta$ | $\approx \theta^2/6$; 1% at $\theta \approx 0.245$ rad $= 14^\circ$ |
| Relative error of $\cos\theta \approx 1$ | $\approx \theta^2/2$; 1% at about $8^\circ$ |
| Relative error of $\tan\theta \approx \theta$ | $\approx \theta^2/3$; 1% at about $10^\circ$ |
| $1 - \cos\theta \approx \theta^2/2$ | Cosine loss; never call it zero when it is the answer |
| $h \approx d^2/2R$, $d \approx \sqrt{2Rh}$ | Curvature drop and horizon distance on a sphere |
| $F\sin\delta \approx F\delta$ | Linear actuator gain, $F$ per radian |
| Radians only | Every formula here assumes $\theta$ in radians |

Next lesson: from angles to coordinates. The pair $(r, \theta)$ describes a point in the plane, and the triple of radius, latitude and longitude describes a point in space — along with the slightly squashed Earth shape that every GPS receiver and launch-site survey uses.

::: context linear-word What "linear" means
A relationship is **linear** when doubling the input doubles the output — its graph is a straight line through zero. $y = 3x$ is linear; $y = \sin x$ is not, because doubling $x$ does not double $\sin x$ (try $x = 90^\circ$). Engineers love linear systems because the effects of two causes add: the response to two pushes is the sum of the responses to each. Small angles make $\sin\theta$ behave like the straight line $\theta$, and a whole toolbox opens up.
:::

::: context squeeze-areas Three shapes, one inside the next
The blue triangle fits inside the orange pie slice, which fits inside the big outlined triangle. So their areas come in order, and so do $\sin\theta$, $\theta$ and $\tan\theta$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="40,180 180,180 180,81.97" fill="#fff" stroke="#b4232c" stroke-width="2"/>
  <path d="M40,180 L180,180 A140,140 0 0,0 154.68,99.70 Z" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="40,180 180,180 154.68,99.70" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="154.68" y1="99.70" x2="154.68" y2="180" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="4 3"/>
  <path d="M70,180 A30,30 0 0,0 64.57,162.79" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="74" y="172" font-size="12" fill="#1f2a44">θ</text>
  <text x="186" y="130" font-size="12" fill="#b4232c">tan θ</text>
  <text x="118" y="162" font-size="11" fill="#1f2a44">sin θ</text>
  <text x="104" y="196" font-size="12" fill="#1f2a44">1</text>
  <text x="222" y="60" font-size="12" fill="#1d6fd1">small: ½ sin θ</text>
  <text x="222" y="84" font-size="12" fill="#1f2a44">&lt; slice: ½ θ</text>
  <text x="222" y="108" font-size="12" fill="#b4232c">&lt; big: ½ tan θ</text>
</svg>
```

Shrink $\theta$ and all three shapes become thin slivers of almost the same size.
:::

::: context versine The versine and the navigators
For centuries, sailors found their way with printed tables of trigonometric functions. One of them was the **versed sine**, or versine: $1 - \cos\theta$. Its half, the **haversine**, turned out so handy for working out distances across the round Earth that navigators kept dedicated haversine tables. The haversine formula is still used in software today to find the great-circle distance between two points given their latitudes and longitudes.
:::

::: context arcsecond Arcminutes and arcseconds
Degrees are split the way hours are. One degree is $60$ **arcminutes** (written $60'$), and one arcminute is $60$ **arcseconds** ($60''$). So one arcsecond is $1/3600$ of a degree, about $4.85 \times 10^{-6}$ rad — roughly the width of a coin seen from four kilometers away. A good star tracker reports where it points to within a few arcseconds.
:::

::: context maclaurin The pattern behind the terms
The Maclaurin series writes a function as an endless sum of powers. For the sine it is $\theta - \frac{\theta^3}{3!} + \frac{\theta^5}{5!} - \cdots$, where $3! = 3 \times 2 \times 1 = 6$ and $5! = 120$. The cosine is $1 - \frac{\theta^2}{2!} + \frac{\theta^4}{4!} - \cdots$. The small-angle approximations are the first one or two terms of these. Each new term is much smaller than the one before when $\theta$ is small, which is why stopping early works so well. The calculus module shows where the pattern comes from.
:::

::: context relative-error Relative versus absolute error
The **absolute error** is how far off you are, in the quantity's own units. The **relative error** is that miss divided by the true value — how big the miss is compared with the thing itself. Being $1$ cm off when measuring a pencil is a big relative error; being $1$ cm off when measuring a football field is tiny. Engineers usually quote relative error as a percentage, because it compares fairly across big and small quantities.
:::

::: context sine-hugs-line The sine curve hugs the line near zero
The blue curve is $\sin\theta$ and the red line is $\theta$ itself, drawn to the same scale on both axes. Near zero you can barely tell them apart. By $14^\circ$ (dashed line) the gap has reached $1\%$, and after that it opens fast.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="225" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="10" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="205" y2="15" stroke="#b4232c" stroke-width="2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="40.0,180.0 45.5,174.5 51.0,169.0 56.5,163.6 62.0,158.1 67.5,152.8 73.0,147.5 78.5,142.3 84.0,137.2 89.5,132.2 95.0,127.3 100.5,122.5 106.0,117.9 111.5,113.4 117.0,109.1 122.5,105.0 128.0,101.1 133.5,97.4 139.0,93.8 144.5,90.5 150.0,87.4 155.5,84.6 161.0,82.0 166.5,79.6 172.0,77.5 177.5,75.6 183.0,74.0 188.5,72.7 194.0,71.6 199.5,70.8 205.0,70.3"/>
  <line x1="66.87" y1="180" x2="66.87" y2="140" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="95" y="194">0.5</text><text x="150" y="194">1.0</text><text x="205" y="194">1.5</text>
  </g>
  <text x="34" y="129" font-size="11" text-anchor="end" fill="#1f2a44">0.5</text>
  <text x="34" y="74" font-size="11" text-anchor="end" fill="#1f2a44">1.0</text>
  <text x="62" y="134" font-size="11" fill="#6c7a93">14°</text>
  <text x="212" y="22" font-size="12" fill="#b4232c">y = θ</text>
  <text x="212" y="74" font-size="12" fill="#1d6fd1">y = sin θ</text>
  <text x="240" y="184" font-size="11" fill="#1f2a44">θ (rad)</text>
</svg>
```
:::

::: context pendulum-clock Why small swings keep time
Galileo noticed that a pendulum's swings take about the same time whether they are wide or narrow, and the idea led to the pendulum clock. That near-constancy is the small-angle approximation at work: with $\sin\theta \approx \theta$, the swing time does not depend on the swing's size at all. But it is only nearly true. Wider swings take slightly longer, so a clock whose pendulum swings wider runs slow. Christiaan Huygens, who built the first pendulum clocks in the 1650s, knew this and looked for ways around it.
:::

::: context horizon-picture How far is the horizon?
Your line of sight to the horizon barely grazes the Earth, so it meets the radius there at a right angle. Pythagoras on that right triangle gives $d^2 = (R + h)^2 - R^2 = 2Rh + h^2$. When $h$ is tiny compared with $R$, the $h^2$ hardly matters, and $d \approx \sqrt{2Rh}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M6.34,150.17 A250,250 0 0,1 353.66,150.17" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="180" y1="40" x2="180" y2="200" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <line x1="306.70" y1="114.48" x2="256.42" y2="200" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <line x1="180" y1="40" x2="306.70" y2="114.48" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="180" y1="40" x2="180" y2="80" stroke="#1f2a44" stroke-width="3"/>
  <circle cx="180" cy="40" r="4" fill="#1f2a44"/>
  <circle cx="306.70" cy="114.48" r="4" fill="#b4232c"/>
  <text x="166" y="64" font-size="12" text-anchor="end" fill="#1f2a44">h</text>
  <text x="246" y="66" font-size="12" fill="#b4232c">d</text>
  <text x="186" y="160" font-size="12" fill="#6c7a93">R</text>
  <text x="286" y="165" font-size="12" fill="#6c7a93">R</text>
  <text x="312" y="108" font-size="11" fill="#1f2a44">horizon</text>
  <text x="20" y="30" font-size="12" fill="#1f2a44">d ≈ √(2Rh)</text>
</svg>
```

The height here is hugely exaggerated so you can see it; for a real person on a beach, $h$ is a few meters and $R$ is $6371$ km.
:::

::: context quaternion-bridge Quaternions, coming later
A **quaternion** is a set of four numbers that describes any orientation of a spacecraft — any amount of turn about any axis — with no small-angle shortcut and no trouble near $90^\circ$. Nearly every modern spacecraft stores its attitude this way. You will build them in the attitude modules, starting from the rotation matrices of lesson 4 and the complex numbers at the end of this module.
:::
