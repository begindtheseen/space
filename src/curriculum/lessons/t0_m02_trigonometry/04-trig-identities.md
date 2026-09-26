---
id: l04-trig-identities
title: Trigonometric identities
minutes: 23
covers:
  - "identities: Pythagorean, sum/difference, double-angle"
---

Put a phone flat on a table and turn it $35^\circ$. Then turn it another $20^\circ$. Now it points $55^\circ$ from where it started. Nothing could be more obvious. But here is a real question: if you already know the sine and cosine of $35^\circ$ and of $20^\circ$, can you work out the sine and cosine of $55^\circ$ without a calculator? You can, and the rule that does it is one of the most used facts in all of guidance engineering. A turn followed by a turn is a turn, and the **sum formulas** are what that sentence looks like in numbers.

A spacecraft meets this all the time. It yaws (turns left or right) through $35^\circ$, and its camera is bolted on $20^\circ$ off the body's nose. The camera points $55^\circ$ from the reference direction, and the flight software has to get $\cos 55^\circ$ and $\sin 55^\circ$ out of the pieces it already has. Every rotation matrix, every chain of attitude angles and every quaternion product later in the course is the sum formulas, used over and over in three dimensions.

This lesson is about **[[identities|identity-word]]**. An identity is an equation that is true for *every* angle, not only for one special answer. You will build three families of them from the unit circle: the Pythagorean identities, the sum and difference formulas, and the double-angle and half-angle formulas. Nothing here is a string of symbols to memorise blindly. Each one is a fact about the circle that you can rebuild in a minute if you forget it.

## The Pythagorean identity

Picture a ladder exactly $1$ meter long leaning against a wall. Wherever you set its foot, the height it reaches up the wall and the distance of its foot from the wall are tied together: height squared plus distance squared equals $1^2$. That is the Pythagorean theorem, and the ladder never changes length.

The unit circle is that ladder, swung all the way round. The point at angle $\theta$ ("theta") on the unit circle has coordinates $(\cos\theta, \sin\theta)$, and every point on a circle of radius $1$ obeys $x^2 + y^2 = 1$. So, for every angle,

$$
\sin^2\theta + \cos^2\theta = 1 .
$$

Read $\sin^2\theta$ aloud as "sine squared theta". It means $(\sin\theta)^2$, the sine multiplied by itself. That is the whole proof. The identity says that the point on the [[unit circle is one unit from the center|unit-circle-pythag]]. Every angle lands on some point of the circle, so the identity holds for any $\theta$ at all — negative, bigger than $90^\circ$, more than a full turn.

Now divide both sides by $\cos^2\theta$. You may do this wherever $\cos\theta \ne 0$. Use $\tan\theta = \sin\theta/\cos\theta$ and the **secant**, $\sec\theta = 1/\cos\theta$ (one over the cosine), from lesson 2:

$$
\frac{\sin^2\theta}{\cos^2\theta} + \frac{\cos^2\theta}{\cos^2\theta} = \frac{1}{\cos^2\theta}
\quad\Longrightarrow\quad
\tan^2\theta + 1 = \sec^2\theta .
$$

Divide instead by $\sin^2\theta$ and you get $1 + \cot^2\theta = \csc^2\theta$, using the cotangent $\cot = \cos/\sin$ and the cosecant $\csc = 1/\sin$. These three forms are one fact, the [[same right triangle drawn at different sizes|sec-tan-picture]].

::: key Pythagorean identity and its tangent form
$\sin^2\theta + \cos^2\theta = 1$ and $1 + \tan^2\theta = \sec^2\theta$. The first says the unit-circle point has length one; the second is the first divided by $\cos^2\theta$.
:::

### Getting one function from another

The everyday use is recovering one function when you know another. There is one catch, and it is the most important sentence in this section: a square root has two answers, a plus one and a minus one. The identity tells you the size. The **quadrant** — which quarter of the circle the angle is in — tells you the sign.

::: example Finding the cosine when you know the sine
**An angle in quadrant II.** You know $\sin\theta = 0.6$ and that $\theta$ is in quadrant II (between $90^\circ$ and $180^\circ$). Find $\cos\theta$ and $\tan\theta$.

Start from the identity and move the sine across:

$$
\cos^2\theta = 1 - \sin^2\theta = 1 - 0.36 = 0.64, \qquad \cos\theta = \pm 0.8 .
$$

The identity cannot choose between $+0.8$ and $-0.8$. The quadrant can: in quadrant II the point is left of center, so $x$ is negative and $\cos\theta = -0.8$. Then $\tan\theta = 0.6/(-0.8) = -0.75$. Sanity check: $(0.6)^2 + (-0.8)^2 = 0.36 + 0.64 = 1$.

**A climb angle from a slope.** A vehicle climbs with flight-path angle $\gamma$ ("gamma"), the angle of its path above the horizontal, and $\tan\gamma = 0.4$: it rises $0.4$ m for every meter forward. The tangent form gives $\sec^2\gamma = 1 + 0.16 = 1.16$. So $\cos\gamma = 1/\sqrt{1.16} = 0.9285$, and $\sin\gamma = \tan\gamma \cdot \cos\gamma = 0.4 \times 0.9285 = 0.3714$. Here $\gamma$ is a climb angle between $0^\circ$ and $90^\circ$, so both are positive. These are the same numbers the right triangle with legs $1$ and $0.4$ would give, but you never had to draw it.
:::

Forgetting the sign choice is the algebra twin of the arctangent quadrant bug from lesson 3.

::: warning A square root has two signs
$\cos\theta = \sqrt{1 - \sin^2\theta}$ is only true in quadrants I and IV. Whenever you use a Pythagorean identity to recover a function, write down which quadrant you are in and choose the sign from it. Code that takes `math.sqrt(1 - s*s)` for the cosine quietly assumes $|\theta| \le 90^\circ$.
:::

## Adding two angles: the sum and difference formulas

Back to the phone. Turn it by $\beta$ ("beta"), then by $\alpha$ ("alpha"). It ends up at $\alpha + \beta$. What you want is a rule for $\cos(\alpha + \beta)$ in terms of the sines and cosines of $\alpha$ and $\beta$.

The first guess everyone makes is $\cos(\alpha + \beta) = \cos\alpha + \cos\beta$. Test it with $\alpha = \beta = 90^\circ$: the left side is $\cos 180^\circ = -1$, the right side is $0 + 0 = 0$. Wrong. Sine and cosine do not split over a plus sign. The true rule mixes them.

It is easiest to start with the difference, $\alpha - \beta$, the angle *between* two directions. Here is the rule:

$$
\cos(\alpha - \beta) = \cos\alpha\cos\beta + \sin\alpha\sin\beta .
$$

::: note Why it has to be true
Put two points on the unit circle: $P = (\cos\alpha, \sin\alpha)$ and $Q = (\cos\beta, \sin\beta)$. Work out the squared distance between them with the distance formula:

$$
PQ^2 = (\cos\alpha - \cos\beta)^2 + (\sin\alpha - \sin\beta)^2 = 2 - 2(\cos\alpha\cos\beta + \sin\alpha\sin\beta).
$$

(Multiply out both brackets. The squares pair up as $\cos^2\alpha + \sin^2\alpha = 1$ and $\cos^2\beta + \sin^2\beta = 1$, which makes the $2$. The middle terms, $-2\cos\alpha\cos\beta$ and $-2\sin\alpha\sin\beta$, make the rest.)

Now turn the whole picture clockwise by $\beta$. Turning does not stretch anything, so $PQ$ keeps its length. But now $Q$ sits at $(1, 0)$ and $P$ sits at angle $\alpha - \beta$, at $(\cos(\alpha - \beta), \sin(\alpha - \beta))$. The same distance formula gives

$$
PQ^2 = (\cos(\alpha - \beta) - 1)^2 + \sin^2(\alpha - \beta) = 2 - 2\cos(\alpha - \beta).
$$

The two answers are the same length, so $\cos(\alpha - \beta) = \cos\alpha\cos\beta + \sin\alpha\sin\beta$. When you meet vectors, you will see this again as the **dot product**: the dot product of two unit vectors is the cosine of the angle between them.
:::

Everything else in this section comes out of that one formula and the circle's mirror symmetries from lesson 1.

**The sum.** Replace $\beta$ by $-\beta$. Cosine is [[even and sine is odd|even-odd]]: $\cos(-\beta) = \cos\beta$ and $\sin(-\beta) = -\sin\beta$. So

$$
\cos(\alpha + \beta) = \cos\alpha\cos\beta - \sin\alpha\sin\beta .
$$

**The sine.** Use the cofunction identity $\sin\phi = \cos(\pi/2 - \phi)$ ("phi"), with $\phi = \alpha + \beta$, and group the angle as $(\pi/2 - \alpha) - \beta$ so the difference formula applies:

$$
\sin(\alpha + \beta) = \cos\!\left(\left(\tfrac{\pi}{2} - \alpha\right) - \beta\right) = \cos\!\left(\tfrac{\pi}{2} - \alpha\right)\cos\beta + \sin\!\left(\tfrac{\pi}{2} - \alpha\right)\sin\beta = \sin\alpha\cos\beta + \cos\alpha\sin\beta .
$$

The last step used the cofunction identities once more: $\cos(\pi/2 - \alpha) = \sin\alpha$ and $\sin(\pi/2 - \alpha) = \cos\alpha$. Replacing $\beta$ by $-\beta$ gives the difference form of the sine. All four together:

$$
\begin{aligned}
\sin(\alpha \pm \beta) &= \sin\alpha\cos\beta \pm \cos\alpha\sin\beta, \\
\cos(\alpha \pm \beta) &= \cos\alpha\cos\beta \mp \sin\alpha\sin\beta .
\end{aligned}
$$

Read $\pm$ as "plus or minus" and $\mp$ as "minus or plus": take the top signs together or the bottom signs together. Watch them. The sine formula *keeps* the sign of the angle. The cosine formula *flips* it.

Two quick tests catch most slips. Set $\beta = 0$: the formulas must give back $\sin\alpha$ and $\cos\alpha$, and they do, because $\cos 0 = 1$ and $\sin 0 = 0$. Set $\alpha = \beta = \pi/4$ ($45^\circ$): they must give $\sin(\pi/2) = 1$ and $\cos(\pi/2) = 0$. Indeed $2 \times \tfrac{\sqrt 2}{2}\cdot\tfrac{\sqrt 2}{2} = 1$ and $\tfrac{1}{2} - \tfrac{1}{2} = 0$.

And the phone: $\cos 55^\circ = \cos 35^\circ\cos 20^\circ - \sin 35^\circ\sin 20^\circ = 0.8192 \times 0.9397 - 0.5736 \times 0.3420 = 0.7698 - 0.1962 = 0.5736$, which is what a calculator says for $\cos 55^\circ$.

### The tangent version

Divide the sine formula by the cosine formula, then divide top and bottom by $\cos\alpha\cos\beta$. Each $\sin/\cos$ becomes a tangent:

$$
\tan(\alpha \pm \beta) = \frac{\tan\alpha \pm \tan\beta}{1 \mp \tan\alpha\tan\beta} .
$$

With $\alpha = 30^\circ$ and $\beta = 45^\circ$: $\tan 75^\circ = (0.5774 + 1)/(1 - 0.5774) = 3.732$, which matches a calculator.

### The sum formulas are the rotation matrix

Here is the same fact in the form you will use most. Take a vector (an arrow with a length and a direction) of length $r$ at angle $\beta$. By lesson 1 its components are $(x, y) = (r\cos\beta, r\sin\beta)$. Turn it counterclockwise by $\alpha$. It keeps its length and now points at $\alpha + \beta$. Its new components, from the sum formulas, are

$$
\begin{aligned}
x' &= r\cos(\alpha + \beta) = r\cos\beta\cos\alpha - r\sin\beta\sin\alpha = x\cos\alpha - y\sin\alpha, \\
y' &= r\sin(\alpha + \beta) = r\cos\beta\sin\alpha + r\sin\beta\cos\alpha = x\sin\alpha + y\cos\alpha .
\end{aligned}
$$

($x'$ is read "x prime": the new $x$.) Engineers pack these four numbers into a square grid called a **[[matrix|matrix-times-vector]]**:

$$
\begin{pmatrix} x' \\ y' \end{pmatrix} = \begin{pmatrix} \cos\alpha & -\sin\alpha \\ \sin\alpha & \cos\alpha \end{pmatrix} \begin{pmatrix} x \\ y \end{pmatrix} .
$$

The sum formulas *are* the statement that this matrix rotates. Multiply two such matrices, one for $\alpha$ and one for $\beta$, and the top-left entry of the product is $\cos\alpha\cos\beta - \sin\alpha\sin\beta$. The claim that two turns make one turn of $\alpha + \beta$ is exactly the claim that this equals $\cos(\alpha + \beta)$. The linear-algebra modules build [[three-dimensional rotations|rotations-later]] out of this two-dimensional block.

::: example Rotating a vector two ways
A displacement in a landing-site frame is $(x, y) = (3.00, 1.00)$ km. A guidance routine rotates that vector $40^\circ$ counterclockwise. Find the components of the rotated vector.

**By the matrix.** $\cos 40^\circ = 0.7660$ and $\sin 40^\circ = 0.6428$. Then

$$
x' = 3.00 \times 0.7660 - 1.00 \times 0.6428 = 1.655\ \mathrm{km}, \qquad y' = 3.00 \times 0.6428 + 1.00 \times 0.7660 = 2.694\ \mathrm{km}.
$$

**By length and angle.** The original vector has length $\sqrt{3^2 + 1^2} = \sqrt{10} = 3.162$ km and points at $\operatorname{atan2}(1, 3) = 18.43^\circ$. After turning it points at $18.43^\circ + 40^\circ = 58.43^\circ$, so its components are $3.162\cos 58.43^\circ = 1.655$ km and $3.162\sin 58.43^\circ = 2.694$ km.

Same numbers, because the sum formula is exactly what links the two methods. Sanity check: the length has not changed, $\sqrt{1.655^2 + 2.694^2} = 3.162$ km, as a rotation demands.
:::

### Exact values for new angles

The sum formulas stretch the special-angle table of lesson 1. Since $75^\circ = 45^\circ + 30^\circ$,

$$
\cos 75^\circ = \cos 45^\circ\cos 30^\circ - \sin 45^\circ\sin 30^\circ = \frac{\sqrt 2}{2}\cdot\frac{\sqrt 3}{2} - \frac{\sqrt 2}{2}\cdot\frac{1}{2} = \frac{\sqrt 6 - \sqrt 2}{4} \approx 0.2588 .
$$

By the cofunction identity, $\sin 15^\circ$ has the same value. That is a handy calculator check, but the real power is with symbols. For example, a quarter-turn shift changes a sine into a cosine:

$$
\sin\!\left(\theta + \tfrac{\pi}{2}\right) = \sin\theta\cos\tfrac{\pi}{2} + \cos\theta\sin\tfrac{\pi}{2} = \sin\theta \cdot 0 + \cos\theta \cdot 1 = \cos\theta .
$$

The half-turn and mirror rules of lesson 1 come back the same way, as special cases.

## Double-angle and half-angle formulas

What happens if you turn the phone by the same angle twice? Set $\alpha = \beta = \theta$ in the sum formulas:

$$
\sin 2\theta = \sin\theta\cos\theta + \cos\theta\sin\theta = 2\sin\theta\cos\theta, \qquad \cos 2\theta = \cos^2\theta - \sin^2\theta .
$$

Notice that doubling the angle does *not* double the sine. $\sin 60^\circ = 0.866$, not twice $\sin 30^\circ = 0.5$.

The cosine formula has two more faces. Swap $\cos^2\theta$ for $1 - \sin^2\theta$ and you get $\cos 2\theta = 1 - 2\sin^2\theta$. Swap $\sin^2\theta$ for $1 - \cos^2\theta$ instead and you get $\cos 2\theta = 2\cos^2\theta - 1$. Which face you pick depends on what you want to get rid of. For $\theta = 0.3$ rad all three give $0.8253$, as they must.

::: key Double-angle identities
$\sin 2\theta = 2\sin\theta\cos\theta$ and $\cos 2\theta = \cos^2\theta - \sin^2\theta = 1 - 2\sin^2\theta = 2\cos^2\theta - 1$. Both come from the sum formulas with $\alpha = \beta = \theta$.
:::

For the tangent, the tangent sum formula with $\alpha = \beta = \theta$ gives $\tan 2\theta = 2\tan\theta/(1 - \tan^2\theta)$.

### Squares into waves

Solve the last two cosine faces for the squares. These are the **power-reduction**, or **half-angle**, formulas:

$$
\sin^2\theta = \frac{1 - \cos 2\theta}{2}, \qquad \cos^2\theta = \frac{1 + \cos 2\theta}{2} .
$$

They turn a squared wave into a constant plus a wave at twice the frequency. Picture a sine wave going up and down between $+1$ and $-1$. Square it. Every negative part flips up to positive, so the result bounces between $0$ and $1$ — and it makes [[two bumps for every one of the original|squared-wave]]. On average it sits at $1/2$. That is exactly what the formula says: $\sin^2\omega t$ (where $t$ is time and $\omega$, "omega", is how fast the wave turns, in radians per second) equals $1/2$ minus half a cosine at $2\omega$.

This matters wherever a power, an energy or a squared error appears. It is why the power delivered by [[alternating current|ac-power]] pulses at twice the line frequency, and why a squared tracking error shows a spike at double the disturbance frequency.

Put $\theta/2$ in place of $\theta$ and take square roots, and you get the half-angle form:

$$
\cos\frac{\theta}{2} = \pm\sqrt{\frac{1 + \cos\theta}{2}} ,
$$

with the sign once again set by the quadrant of $\theta/2$. Check: $\theta = 100^\circ$ gives $\sqrt{(1 + \cos 100^\circ)/2} = 0.6428$, which is $\cos 50^\circ$.

::: example Gravity-gradient torque
A spacecraft circles Earth at $400$ km altitude, so its distance from Earth's center is $r = 6771$ km. Its **[[moments of inertia|moment-of-inertia]]** — how hard it is to spin about each axis — differ by $\Delta I = 800\ \mathrm{kg\,m^2}$ between its long axis and a crosswise axis. When the long axis tilts by an angle $\theta$ from the straight-down direction, Earth's **[[gravity gradient|gravity-gradient]]** pulls it back with a torque (a twisting push)

$$
T = \frac{3\mu}{r^3}\,\Delta I\,\sin\theta\cos\theta = \frac{3\mu}{2r^3}\,\Delta I\,\sin 2\theta .
$$

Here $\mu = 3.986 \times 10^{14}\ \mathrm{m^3/s^2}$ is Earth's gravity constant, and the second form used $\sin\theta\cos\theta = \tfrac{1}{2}\sin 2\theta$.

**The size.** The front factor is

$$
\frac{3 \times 3.986 \times 10^{14}}{2 \times (6.771 \times 10^6)^3} = 1.926 \times 10^{-6}\ \mathrm{s^{-2}},
$$

so the largest possible torque is $1.926 \times 10^{-6} \times 800 = 1.54 \times 10^{-3}\ \mathrm{N\,m}$.

**At $10^\circ$ of tilt.** $\sin 20^\circ = 0.3420$, so $T = 1.54 \times 10^{-3} \times 0.3420 = 5.27 \times 10^{-4}\ \mathrm{N\,m}$. That is about half a millinewton-meter: tiny, but it acts all orbit long.

**What the double-angle form shows.** It tells you two things at a glance that the product form hides. The torque is biggest at $\theta = 45^\circ$, not at $90^\circ$, because $\sin 2\theta$ peaks when $2\theta = 90^\circ$. And it is zero at $\theta = 90^\circ$: a body whose long axis lies horizontal is balanced (though the slightest nudge tips it off).

**Small tilts.** For small angles $\sin 2\theta \approx 2\theta$, so the torque acts like a spring, $T \approx (3\mu/r^3)\,\Delta I\,\theta$. At $5^\circ$ the exact torque is $2.676 \times 10^{-4}\ \mathrm{N\,m}$ and the spring version gives $2.689 \times 10^{-4}\ \mathrm{N\,m}$, only half a percent high. Lesson 6 makes that kind of shortcut precise.
:::

## Combining a sine and a cosine of the same frequency

Signals in flight data rarely arrive as a pure sine. A disturbance torque might be written $T(t) = a\cos\omega t + b\sin\omega t$: some cosine plus some sine, both at the same rate. Here is the surprise: that mix is always *one* wave, shifted in time.

Think of walking $a$ steps east and then $b$ steps north. You could have walked one straight line instead, with a length and a direction. The sum formula, read backwards, does exactly this. Expand a single shifted wave:

$$
R\cos(\omega t - \phi) = R\cos\phi\cos\omega t + R\sin\phi\sin\omega t .
$$

Match it to $a\cos\omega t + b\sin\omega t$, piece by piece: $a = R\cos\phi$ and $b = R\sin\phi$. Those are the length-and-angle equations of lesson 1, so

$$
a\cos\omega t + b\sin\omega t = R\cos(\omega t - \phi), \qquad R = \sqrt{a^2 + b^2}, \quad \phi = \operatorname{atan2}(b, a) .
$$

The **amplitude** $R$ — the height of the wave — is the length of the arrow $(a, b)$. The **[[phase|phase-word]]** $\phi$ — how far the wave is shifted — is that arrow's direction, found (as always) with atan2, because $a$ can be negative.

::: example Amplitude and phase of a disturbance
Telemetry fits a once-per-orbit disturbance torque as $T(t) = 0.12\cos\omega t + 0.05\sin\omega t$ N m.

**Amplitude:** $R = \sqrt{0.12^2 + 0.05^2} = \sqrt{0.0144 + 0.0025} = \sqrt{0.0169} = 0.13$ N m.

**Phase:** $\phi = \operatorname{atan2}(0.05, 0.12) = 22.6^\circ = 0.395$ rad. So $T(t) = 0.13\cos(\omega t - 0.395)$.

The torque peaks $22.6^\circ$ of orbit after the cosine reference point. That is $22.6/360$ of the orbit, about six minutes of a 92-minute orbit. Sanity check: $R$ is bigger than both $0.12$ and $0.05$ but less than their sum, as the long side of a right triangle must be. A reaction-wheel controller sizing how much push it needs wants $R$; a controller cancelling the disturbance wants $\phi$. The raw $a$ and $b$ give neither directly.
:::

## Products into sums

One more family, for when two waves are *multiplied*. Add the two cosine formulas, $\cos(\alpha - \beta)$ and $\cos(\alpha + \beta)$: the $\sin\alpha\sin\beta$ terms cancel and you are left with $2\cos\alpha\cos\beta$. Subtract them instead and the cosine products cancel. Dividing by $2$:

$$
\cos\alpha\cos\beta = \tfrac{1}{2}\left[\cos(\alpha - \beta) + \cos(\alpha + \beta)\right], \qquad \sin\alpha\sin\beta = \tfrac{1}{2}\left[\cos(\alpha - \beta) - \cos(\alpha + \beta)\right].
$$

The sine formulas give, the same way, $\sin\alpha\cos\beta = \tfrac{1}{2}[\sin(\alpha + \beta) + \sin(\alpha - \beta)]$.

In words: multiplying two waves makes two new waves, one at the difference of their frequencies and one at the sum. A radio does this on purpose. It multiplies the signal it receives, at frequency $\omega_1$, by its own steady wave at $\omega_2$, which produces pieces at $\omega_1 - \omega_2$ and $\omega_1 + \omega_2$. A filter keeps the difference. That is how a **[[Doppler shift|doppler]]** of a few kilohertz is pulled out of a carrier wave at billions of cycles per second, and how ground stations measure a spacecraft's speed. The power-reduction formula $\sin^2\theta = (1 - \cos 2\theta)/2$ is the special case $\alpha = \beta$.

::: note How many identities to memorise
Two: $\sin^2 + \cos^2 = 1$ and $\cos(\alpha - \beta) = \cos\alpha\cos\beta + \sin\alpha\sin\beta$. Everything in this lesson follows from those in a few lines, using the even/odd and cofunction symmetries of lesson 1. When you are unsure of a sign, set the angles to $0$ or $\pi/4$ and test.
:::

## Check yourself

::: check
Check $\sin^2\theta + \cos^2\theta = 1$ at $\theta = 30^\circ$ using the exact values, and at $\theta = 2$ rad using a calculator.
:::

::: answer
At $30^\circ$: $\sin 30^\circ = \tfrac{1}{2}$ and $\cos 30^\circ = \tfrac{\sqrt 3}{2}$, so $\tfrac{1}{4} + \tfrac{3}{4} = 1$.

At $2$ rad (about $114.6^\circ$, in quadrant II): $\sin 2 = 0.9093$ and $\cos 2 = -0.4161$. Squaring gets rid of the minus sign: $0.8268 + 0.1732 = 1.0000$. The identity does not care which quadrant you are in.
:::

::: check
$\cos\theta = -0.28$ and $\theta$ lies in quadrant III. Find $\sin\theta$, $\tan\theta$, $\sin 2\theta$ and $\cos 2\theta$, and say which quadrant $2\theta$ is in.
:::

::: answer
$\sin^2\theta = 1 - 0.0784 = 0.9216$, so $\sin\theta = \pm 0.96$. In quadrant III the sine is negative, so $\sin\theta = -0.96$.

$\tan\theta = (-0.96)/(-0.28) = 3.43$, positive, as it should be in quadrant III.

$\sin 2\theta = 2(-0.96)(-0.28) = 0.5376$ and $\cos 2\theta = \cos^2\theta - \sin^2\theta = 0.0784 - 0.9216 = -0.8432$.

A positive sine and a negative cosine put $2\theta$ in quadrant II. That fits: $\theta$ between $180^\circ$ and $270^\circ$ makes $2\theta$ between $360^\circ$ and $540^\circ$, which is $0^\circ$ to $180^\circ$ after one full turn. Exactly, $\theta = 253.7^\circ$ and $2\theta = 507.5^\circ$, the same direction as $147.5^\circ$.
:::

::: check
Use the sum formula to show that $\cos(\theta + \pi) = -\cos\theta$. What does this say about the unit circle?
:::

::: answer
$\cos(\theta + \pi) = \cos\theta\cos\pi - \sin\theta\sin\pi = \cos\theta \times (-1) - \sin\theta \times 0 = -\cos\theta$.

Adding $\pi$ (half a turn) moves the point to the exact opposite side of the circle, which flips the sign of its $x$ coordinate. This is the half-turn symmetry of lesson 1, recovered from the general formula.
:::

::: check
Find the exact value of $\tan 15^\circ$ and check it numerically.
:::

::: answer
$15^\circ = 45^\circ - 30^\circ$, with $\tan 45^\circ = 1$ and $\tan 30^\circ = 1/\sqrt 3$:

$$
\tan 15^\circ = \frac{1 - 1/\sqrt 3}{1 + 1/\sqrt 3} = \frac{\sqrt 3 - 1}{\sqrt 3 + 1}
$$

(multiplying top and bottom by $\sqrt 3$). Now multiply top and bottom by $\sqrt 3 - 1$ to clear the root from the bottom:

$$
\frac{(\sqrt 3 - 1)^2}{3 - 1} = \frac{4 - 2\sqrt 3}{2} = 2 - \sqrt 3 \approx 0.2679 .
$$

A calculator gives $\tan 15^\circ = 0.2679$.
:::

::: check
A signal is $y(t) = 3\sin\omega t - 4\cos\omega t$. Write it as a single cosine $R\cos(\omega t - \phi)$ with $R > 0$.
:::

::: answer
Match it to $a\cos\omega t + b\sin\omega t$: here $a = -4$ and $b = 3$. Then $R = \sqrt{16 + 9} = 5$ and $\phi = \operatorname{atan2}(3, -4) = 143.13^\circ = 2.498$ rad. So $y(t) = 5\cos(\omega t - 2.498)$.

Using $\arctan(b/a) = \arctan(-0.75) = -36.87^\circ$ instead would give a phase off by $180^\circ$, and the rebuilt signal would be upside down — the negative of the original.
:::

::: check
Simplify $\dfrac{1 - \cos 2\theta}{\sin 2\theta}$ and say for which angles the simplification is valid.
:::

::: answer
Top: $1 - \cos 2\theta = 1 - (1 - 2\sin^2\theta) = 2\sin^2\theta$. Bottom: $\sin 2\theta = 2\sin\theta\cos\theta$. Cancel $2\sin\theta$ from both:

$$
\frac{2\sin^2\theta}{2\sin\theta\cos\theta} = \frac{\sin\theta}{\cos\theta} = \tan\theta .
$$

The original needs $\sin 2\theta \ne 0$, so $\theta$ must not be a multiple of $\pi/2$. The simplified form fails only at the odd multiples of $\pi/2$, so the two agree everywhere the original is defined. This identity, $\tan\theta = (1 - \cos 2\theta)/\sin 2\theta$, is a half-angle formula for the tangent that needs no square root and no sign choice.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\sin^2\theta + \cos^2\theta = 1$ | The unit-circle point has unit length |
| $1 + \tan^2\theta = \sec^2\theta$ | Pythagorean identity divided by $\cos^2\theta$ |
| Recovering a function | The identity gives the size; the quadrant gives the sign |
| $\cos(\alpha \pm \beta) = \cos\alpha\cos\beta \mp \sin\alpha\sin\beta$ | Sign flips; the difference form comes from a distance on the circle |
| $\sin(\alpha \pm \beta) = \sin\alpha\cos\beta \pm \cos\alpha\sin\beta$ | From the cosine formula via cofunction; sign kept |
| $\tan(\alpha \pm \beta) = \dfrac{\tan\alpha \pm \tan\beta}{1 \mp \tan\alpha\tan\beta}$ | Ratio of the two above |
| $\begin{pmatrix} \cos\alpha & -\sin\alpha \\ \sin\alpha & \cos\alpha \end{pmatrix}$ | Rotation by $\alpha$; the sum formulas as a matrix |
| $\sin 2\theta = 2\sin\theta\cos\theta$ | Double angle |
| $\cos 2\theta = \cos^2\theta - \sin^2\theta = 1 - 2\sin^2\theta = 2\cos^2\theta - 1$ | Double angle, three forms |
| $\sin^2\theta = \frac{1 - \cos 2\theta}{2}$, $\cos^2\theta = \frac{1 + \cos 2\theta}{2}$ | Power reduction / half angle |
| $a\cos\omega t + b\sin\omega t = R\cos(\omega t - \phi)$ | $R = \sqrt{a^2 + b^2}$, $\phi = \operatorname{atan2}(b, a)$ |
| $\cos\alpha\cos\beta = \frac{1}{2}[\cos(\alpha-\beta) + \cos(\alpha+\beta)]$ | Product to sum; mixing and Doppler |

Next lesson: we leave the unit circle for triangles of any shape. The law of cosines is the Pythagorean theorem with a correction for a corner that is not square, and the law of sines comes from measuring one height two ways. Together they solve every ground-station and velocity-triangle problem in the module.

::: context identity-word Identity versus equation
An ordinary equation like $\sin\theta = 0.5$ is a puzzle: it is true for some angles ($30^\circ$, $150^\circ$, …) and false for the rest, and your job is to find which. An **identity** is different. It is true for every angle you could possibly plug in, so there is nothing to solve. It is a tool: a way to swap one expression for another that is always equal to it, like swapping "a dozen" for "twelve". Some books write identities with a three-line sign, $\equiv$, to mark "always equal".
:::

::: context unit-circle-pythag The ladder inside the circle
Drop a line straight down from the point at angle $\theta$ to the $x$ axis. You get a right triangle. Its slanted side is the radius, length $1$. Its flat side is $\cos\theta$ and its upright side is $\sin\theta$. Pythagoras does the rest.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="210" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="110" y1="20" x2="110" y2="195" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="110" cy="110" r="80" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="110" y1="110" x2="175.53" y2="64.11" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="110" y1="110" x2="175.53" y2="110" stroke="#f2b880" stroke-width="4"/>
  <line x1="175.53" y1="64.11" x2="175.53" y2="110" stroke="#b4232c" stroke-width="3"/>
  <circle cx="175.53" cy="64.11" r="4" fill="#1f2a44"/>
  <path d="M128,110 A18,18 0 0,0 124.74,99.68" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="132" y="104" font-size="12" fill="#1f2a44">θ</text>
  <text x="132" y="80" font-size="13" fill="#1d6fd1">1</text>
  <text x="142" y="126" font-size="12" text-anchor="middle" fill="#1f2a44">cos θ</text>
  <text x="181" y="92" font-size="12" fill="#b4232c">sin θ</text>
  <text x="184" y="58" font-size="11" fill="#1f2a44">(cos θ, sin θ)</text>
  <text x="228" y="120" font-size="13" fill="#1f2a44">cos²θ + sin²θ = 1</text>
</svg>
```

When $\theta$ passes $90^\circ$ the flat side points left and $\cos\theta$ goes negative — but squaring wipes out the sign, so the identity survives.
:::

::: context sec-tan-picture Where secant and tangent live
Draw the line that barely touches the unit circle at $(1, 0)$ — a **tangent** line, from the Latin *tangere*, "to touch". Extend the ray at angle $\theta$ until it hits that line. The height where it hits is $\tan\theta$, and the length of the ray is $\sec\theta$ — from *secare*, "to cut", because the ray cuts through the circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="200" y2="120" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="100" cy="120" r="70" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="170" y1="30" x2="170" y2="195" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="100" y1="120" x2="170" y2="120" stroke="#f2b880" stroke-width="4"/>
  <line x1="170" y1="120" x2="170" y2="61.26" stroke="#b4232c" stroke-width="3"/>
  <line x1="100" y1="120" x2="170" y2="61.26" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="153.62" cy="75.00" r="3.5" fill="#1f2a44"/>
  <text x="135" y="136" font-size="12" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="176" y="95" font-size="12" fill="#b4232c">tan θ</text>
  <text x="104" y="84" font-size="12" fill="#1d6fd1">sec θ</text>
  <text x="210" y="100" font-size="13" fill="#1f2a44">1 + tan²θ = sec²θ</text>
  <text x="210" y="122" font-size="11" fill="#6c7a93">Pythagoras on the</text>
  <text x="210" y="137" font-size="11" fill="#6c7a93">bigger triangle</text>
</svg>
```

This triangle is the small one inside the circle, blown up by $1/\cos\theta$.
:::

::: context even-odd The mirror in the x axis
Turning by $-\beta$ is turning the same amount the other way. The two points are mirror images across the $x$ axis: same $x$, opposite $y$. So $\cos(-\beta) = \cos\beta$ (cosine is **even**) and $\sin(-\beta) = -\sin\beta$ (sine is **odd**).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="100" x2="175" y2="100" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="90" y1="20" x2="90" y2="180" stroke="#6c7a93" stroke-width="1.5"/>
  <circle cx="90" cy="100" r="70" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="90" y1="100" x2="143.62" y2="55.00" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="90" y1="100" x2="143.62" y2="145.00" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="143.62" y1="55.00" x2="143.62" y2="145.00" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="4 3"/>
  <circle cx="143.62" cy="55.00" r="4" fill="#1d6fd1"/>
  <circle cx="143.62" cy="145.00" r="4" fill="#b4232c"/>
  <text x="112" y="88" font-size="12" fill="#1d6fd1">β</text>
  <text x="108" y="120" font-size="12" fill="#b4232c">−β</text>
  <text x="185" y="52" font-size="12" fill="#1d6fd1">(cos β, sin β)</text>
  <text x="185" y="152" font-size="12" fill="#b4232c">(cos β, −sin β)</text>
  <text x="185" y="104" font-size="12" fill="#1f2a44">same x, opposite y</text>
</svg>
```
:::

::: context matrix-times-vector Reading a matrix times a vector
A matrix is a grid of numbers. To multiply it by a column $(x, y)$, go along each row: multiply the first number in the row by $x$, the second by $y$, and add. The top row $(\cos\alpha, -\sin\alpha)$ gives $x' = x\cos\alpha - y\sin\alpha$. The bottom row $(\sin\alpha, \cos\alpha)$ gives $y' = x\sin\alpha + y\cos\alpha$. That is all the matrix means here — a tidy way to write two equations at once. Flight software stores rotations this way because a computer can chain many of them by multiplying grids.
:::

::: context rotations-later Where this 2 by 2 block comes back
A spacecraft turns in three dimensions, not two. Its orientation is stored as a 3 by 3 **direction cosine matrix**, or as a four-number **quaternion**. Turning about one axis leaves that axis alone and turns the other two — so each single-axis rotation is exactly this 2 by 2 block with an extra $1$ in the corner. Chaining the roll, pitch and yaw of an aircraft is the sum formulas applied three times over.
:::

::: context squared-wave Squaring a wave doubles its beat
The grey wave is $\sin t$. The blue one is $\sin^2 t$. Where the grey wave dips below zero, squaring flips it back up, so the blue wave makes two bumps in the time the grey makes one, and it hovers around $\tfrac{1}{2}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="110" x2="335" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="30" x2="30" y2="190" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="75" x2="330" y2="75" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="5 4"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" points="30.0,110.0 36.2,100.9 42.5,91.9 48.8,83.2 55.0,75.0 61.2,67.4 67.5,60.5 73.8,54.5 80.0,49.4 86.2,45.3 92.5,42.4 98.8,40.6 105.0,40.0 111.2,40.6 117.5,42.4 123.8,45.3 130.0,49.4 136.2,54.5 142.5,60.5 148.8,67.4 155.0,75.0 161.2,83.2 167.5,91.9 173.8,100.9 180.0,110.0 186.2,119.1 192.5,128.1 198.8,136.8 205.0,145.0 211.2,152.6 217.5,159.5 223.8,165.5 230.0,170.6 236.2,174.7 242.5,177.6 248.8,179.4 255.0,180.0 261.2,179.4 267.5,177.6 273.8,174.7 280.0,170.6 286.2,165.5 292.5,159.5 298.8,152.6 305.0,145.0 311.2,136.8 317.5,128.1 323.8,119.1 330.0,110.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="30.0,110.0 36.2,108.8 42.5,105.3 48.8,99.7 55.0,92.5 61.2,84.1 67.5,75.0 73.8,65.9 80.0,57.5 86.2,50.3 92.5,44.7 98.8,41.2 105.0,40.0 111.2,41.2 117.5,44.7 123.8,50.3 130.0,57.5 136.2,65.9 142.5,75.0 148.8,84.1 155.0,92.5 161.2,99.7 167.5,105.3 173.8,108.8 180.0,110.0 186.2,108.8 192.5,105.3 198.8,99.7 205.0,92.5 211.2,84.1 217.5,75.0 223.8,65.9 230.0,57.5 236.2,50.3 242.5,44.7 248.8,41.2 255.0,40.0 261.2,41.2 267.5,44.7 273.8,50.3 280.0,57.5 286.2,65.9 292.5,75.0 298.8,84.1 305.0,92.5 311.2,99.7 317.5,105.3 323.8,108.8 330.0,110.0"/>
  <text x="24" y="44" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="24" y="79" font-size="11" text-anchor="end" fill="#b4232c">½</text>
  <text x="24" y="114" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="24" y="184" font-size="11" text-anchor="end" fill="#1f2a44">−1</text>
  <text x="180" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">π</text>
  <text x="330" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">2π</text>
  <text x="250" y="24" font-size="12" fill="#1d6fd1">sin² t</text>
  <text x="222" y="196" font-size="12" fill="#6c7a93">sin t</text>
</svg>
```
:::

::: context ac-power Why the lights pulse at 120 times a second
The electricity in a US wall socket is alternating current: the voltage swings back and forth as a sine wave 60 times a second. The power a lamp draws goes as the voltage *squared*, so by the power-reduction formula it swings between zero and its peak 120 times a second, averaging half the peak. It is also why a 120-volt socket actually peaks at about 170 volts: the rating is the square root of the average of the voltage squared, which works out to the peak divided by $\sqrt 2$.
:::

::: context moment-of-inertia What a moment of inertia measures
A moment of inertia says how hard an object is to start spinning about an axis. A pencil twirls easily about its long axis — the mass is close to that axis — but is much harder to spin end over end, because the mass is far out. Its unit is $\mathrm{kg\,m^2}$: mass times distance squared. A long, thin spacecraft has very different moments about different axes, and that difference $\Delta I$ is what gravity grabs hold of.
:::

::: context gravity-gradient Why gravity twists a long spacecraft
Gravity gets weaker with distance. So the end of a long spacecraft nearer Earth is pulled slightly harder than the far end. When the craft is tilted, those unequal pulls make a twist that swings its long axis toward the vertical. Engineers use this for free: many early satellites carried a long boom so gravity gradient alone kept one face pointed at Earth. The same effect, acting over billions of years, is why the Moon always shows us the same face.
:::

::: context phase-word What phase means
Two waves can have the same height and the same speed but reach their peaks at different moments — like two kids on side-by-side swings, one a little behind the other. The **phase** is how far behind, measured as an angle of the cycle: $90^\circ$ behind is a quarter-cycle late, $180^\circ$ is exactly opposite. In the example, $22.6^\circ$ of phase is $22.6/360$ of an orbit, which is how the six minutes comes out.
:::

::: context doppler The Doppler shift
When an ambulance drives toward you its siren sounds higher; as it drives away it sounds lower. Radio waves do the same: a spacecraft moving away from Earth sends back a slightly lower frequency than it would standing still. The shift is the frequency times speed over the speed of light — at $2\,\mathrm{GHz}$, a spacecraft receding at $1\,\mathrm{km/s}$ shifts by about $6.7\,\mathrm{kHz}$. Measuring that shift is one of the main ways NASA's Deep Space Network tracks spacecraft speed.
:::
