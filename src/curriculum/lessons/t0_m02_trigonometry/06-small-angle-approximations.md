---
id: l06-small-angle-approximations
title: Small-angle approximations
minutes: 17
covers:
  - small-angle approximations
---

An attitude controller holding a spacecraft within half a degree of its target, a gimbal swinging a few degrees to steer a rocket, a star tracker resolving arcseconds: most of the angles in guidance and control are small. For small angles the trigonometric functions collapse into polynomials — $\sin\theta$ becomes $\theta$, $\cos\theta$ becomes $1$ — and the nonlinear equations of motion become linear ones that can be solved in closed form, analysed with the tools of linear control theory, and run on a flight computer in a handful of multiplications. Almost every control law you will meet in this curriculum is designed on a small-angle linearisation of the plant.

The approximation is also a trap. It is so convenient that it gets applied beyond where it holds, and because $\sin\theta \approx \theta$ is *nearly* right at $30^\circ$, the failure is gradual rather than catastrophic: a controller tuned on the linear model behaves slightly wrong, then noticeably wrong, then unstable, as the angle grows. Knowing the size of the error as a function of angle — not merely that it is "small" — is the difference between a linearisation you can defend in a design review and one you cannot.

This lesson derives the approximations from the geometry and the identities of lesson 4, quantifies their errors, and shows where they are used and where they break.

## The squeeze: sine, angle, tangent

Draw the unit circle and an acute angle $\theta$ from the $+x$ axis. Three regions sit inside one another. The triangle with vertices at the origin, $(1, 0)$ and $(\cos\theta, \sin\theta)$ has area $\tfrac{1}{2}\sin\theta$ (base 1, height $\sin\theta$). The circular sector between the $x$ axis and the ray at $\theta$ has area $\tfrac{1}{2}\theta$ — the fraction $\theta/2\pi$ of the disc's area $\pi$ — and contains the triangle. The right triangle with vertices at the origin, $(1, 0)$ and $(1, \tan\theta)$ contains the sector, and has area $\tfrac{1}{2}\tan\theta$. Therefore, for $0 < \theta < \pi/2$,

$$
\sin\theta < \theta < \tan\theta .
$$

Two things follow. Since $\tan\theta = \sin\theta/\cos\theta$, dividing through by $\sin\theta$ gives $1 < \theta/\sin\theta < 1/\cos\theta$, and as $\theta$ shrinks to zero $\cos\theta$ goes to 1, squeezing $\theta/\sin\theta$ to 1. That is the statement $\sin\theta \approx \theta$ for small $\theta$: the arc and its vertical projection become indistinguishable. And the inequality says which way the error goes — $\theta$ overestimates $\sin\theta$ and underestimates $\tan\theta$, always.

Note that the sector's area is $\tfrac{1}{2}\theta$ only when $\theta$ is in radians. In degrees the inequality would read $\sin\theta < \pi\theta/180$, and the approximation would be $\sin\theta \approx 0.01745\,\theta$. The clean form of every result in this lesson is a consequence of measuring angles by arc length, which is the deepest reason lesson 1 insisted on radians.

## Cosine from the half-angle identity

How far is $\cos\theta$ below 1? Lesson 4 gave $\cos\theta = 1 - 2\sin^2(\theta/2)$. For small $\theta$, $\sin(\theta/2) \approx \theta/2$, so

$$
\cos\theta \approx 1 - 2\left(\frac{\theta}{2}\right)^2 = 1 - \frac{\theta^2}{2} .
$$

This is a much better statement than "$\cos\theta \approx 1$". The quantity $1 - \cos\theta$, sometimes called the versine, is what you actually need whenever a cosine loss is the point: the axial thrust lost to a gimbal deflection, the height by which the Earth's surface curves away from a tangent plane, the propellant wasted when a burn is misaligned. In all of those, setting $\cos\theta = 1$ says the effect is zero, which is useless, while $1 - \cos\theta \approx \theta^2/2$ gives it to high accuracy.

The quadratic dependence has a practical consequence: a cosine loss shrinks four times as fast as the angle. Halving a misalignment cuts its cosine loss by a factor of four; a misalignment of $0.5^\circ = 0.00873$ rad costs $\theta^2/2 = 3.8 \times 10^{-5}$, or 0.0038%, of whatever is being projected. That is why pointing requirements for thrust direction are loose (degrees) while those for a telescope boresight are tight (arcseconds): the first is a cosine effect, the second a sine effect.

## The cubic correction to the sine

$\sin\theta \approx \theta$ is a first approximation; the next term tells you its error. To find it, assume the sine has the form $\sin\theta \approx \theta - a\theta^3$ for some constant $a$, with terms of order $\theta^5$ and higher neglected, and use an identity to pin $a$ down. The identity is the triple-angle formula, which comes from the sum and double-angle formulas of lesson 4:

$$
\sin 3\theta = \sin 2\theta\cos\theta + \cos 2\theta\sin\theta = 2\sin\theta\cos^2\theta + (1 - 2\sin^2\theta)\sin\theta = 3\sin\theta - 4\sin^3\theta ,
$$

using $\cos^2\theta = 1 - \sin^2\theta$ in the middle. Now substitute the assumed form on both sides, keeping terms up to $\theta^3$. Left: $\sin 3\theta \approx 3\theta - a(3\theta)^3 = 3\theta - 27a\theta^3$. Right: $3(\theta - a\theta^3) - 4\theta^3 = 3\theta - (3a + 4)\theta^3$. Matching the cubic terms, $27a = 3a + 4$, so $a = 1/6$:

$$
\sin\theta \approx \theta - \frac{\theta^3}{6} .
$$

The tangent follows by division. With $\cos\theta \approx 1 - \theta^2/2$ and the algebra fact $1/(1 - x) \approx 1 + x$ for small $x$,

$$
\tan\theta = \frac{\sin\theta}{\cos\theta} \approx \left(\theta - \frac{\theta^3}{6}\right)\left(1 + \frac{\theta^2}{2}\right) \approx \theta + \frac{\theta^3}{2} - \frac{\theta^3}{6} = \theta + \frac{\theta^3}{3} .
$$

These are the first terms of the Maclaurin series, which the calculus module derives in general and continues: the next terms are $+\theta^5/120$ for the sine, $+\theta^4/24$ for the cosine and $+2\theta^5/15$ for the tangent. For angles below $30^\circ$ the cubic (or, for cosine, quadratic) versions are accurate to better than a tenth of a percent, and you will seldom need more.

::: key Small-angle approximations
For $\theta$ in radians: $\sin\theta \approx \theta - \theta^3/6$, $\cos\theta \approx 1 - \theta^2/2$, $\tan\theta \approx \theta + \theta^3/3$. To first order, $\sin\theta \approx \tan\theta \approx \theta$ and $\cos\theta \approx 1$.
:::

The inverse functions inherit the same leading behaviour: $\arcsin x \approx x + x^3/6$ and $\arctan x \approx x - x^3/3$ for small $x$. So a small ratio *is* the angle in radians, to first order. When a gimbal's lateral-to-axial force ratio is 0.05, the gimbal angle is 0.05 rad, or $2.86^\circ$, within a tenth of a percent.

## How big is the error

The cubic term is the error of the first-order approximation. For the sine, $\theta - \sin\theta \approx \theta^3/6$, so the **relative** error of $\sin\theta \approx \theta$ is

$$
\frac{\theta - \sin\theta}{\sin\theta} \approx \frac{\theta^2}{6} .
$$

Set this to 1%: $\theta^2 = 0.06$, $\theta = 0.245$ rad $= 14.0^\circ$. Set it to 0.1%: $\theta = 0.0775$ rad $= 4.4^\circ$. For the tangent the relative error is $\theta^2/3$, twice as large, and for $\cos\theta \approx 1$ it is $\theta^2/2$, three times as large — 1% at only $8.1^\circ$. The table gives exact figures:

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

The signs confirm the squeeze: $\theta$ is always above the sine and below the tangent. Read the columns as budgets. If a design tolerates 1% model error, $\sin\theta \approx \theta$ is good to about $14^\circ$, $\tan\theta \approx \theta$ to about $10^\circ$, and $\cos\theta \approx 1$ to about $8^\circ$. Adding the next term buys roughly another factor of three in angle for the same error.

::: key Where the first-order sine approximation exceeds 1%
At about $14^\circ$ ($0.245$ rad), since the relative error grows as $\theta^2/6$. At $15^\circ$ the error is already about 1.15%; at $30^\circ$ it is 4.7%.
:::

::: warning Small compared to what
The error depends on the angle in radians squared, so "small" has a precise meaning: $\theta^2/6$ must be smaller than the accuracy you need. A slew of $30^\circ$ is not a small angle for a controller that is supposed to be accurate to 1%. And the approximation can fail on quantities that look unrelated to angle size — $\sin 2\theta \approx 2\theta$ has four times the relative error of $\sin\theta \approx \theta$ at the same $\theta$, because the argument has doubled and the error is quadratic in the argument.
:::

## Where it is used

**Linearised dynamics.** A body whose restoring torque is proportional to the sine of its angular displacement — a pendulum, a spacecraft under gravity-gradient torque, a rocket whose aerodynamic moment grows with angle of attack — obeys an equation of the form $I\ddot\theta = -k\sin\theta$. With $\sin\theta \approx \theta$ this becomes $I\ddot\theta = -k\theta$, the equation of a simple harmonic oscillator with angular frequency $\sqrt{k/I}$ and a solution you can write down. The exact equation has no elementary solution; its period depends on amplitude, and the linear model misses that. For a pendulum swinging to $20^\circ$ the true period is about 0.8% longer than the linear prediction — small, but measurable, and growing with amplitude.

**Actuator geometry.** A gimballed engine of thrust $F$ deflected by $\delta$ produces lateral force $F\sin\delta \approx F\delta$ and axial force $F\cos\delta \approx F(1 - \delta^2/2)$. The control authority is linear in the gimbal angle, which is why thrust-vector control loops can be designed as linear systems with a gain of $F$ newtons per radian.

**Angular size and parallax.** A length $s$ perpendicular to the line of sight at distance $r$ subtends an angle $2\arctan(s/2r) \approx s/r$. This is the $s = r\theta$ relation of lesson 1, and it is accurate to a part in a thousand for anything smaller than about $5^\circ$: the Moon, 3474 km across at 384 400 km, subtends $3474/384400 = 0.00904$ rad $= 0.518^\circ$, and the exact arctangent formula gives the same to four figures.

**Curvature of the Earth.** Standing on a sphere of radius $R$, the surface drops below your tangent plane by $R(1 - \cos(d/R)) \approx d^2/2R$ at ground distance $d$. Solving the same relation for $d$ gives the distance to the horizon from height $h$: $d \approx \sqrt{2Rh}$.

::: example Gimbal forces with and without the approximation
A first-stage engine produces $F = 845$ kN and is gimballed $\delta = 5^\circ = 0.08727$ rad.

Lateral force: exact $F\sin\delta = 845 \times 0.08716 = 73.65$ kN; approximate $F\delta = 845 \times 0.08727 = 73.74$ kN, high by 0.13%, matching the table.

Axial thrust: exact $F\cos\delta = 841.78$ kN. The crude approximation $F\cos\delta \approx F = 845$ kN misses the loss entirely. The quadratic one, $F(1 - \delta^2/2) = 845 \times (1 - 0.003808) = 841.78$ kN, gets it to five figures. The thrust lost is $F(1 - \cos\delta) = 3.22$ kN exactly and $F\delta^2/2 = 3.22$ kN approximately.

At the gimbal stop, $\delta = 8^\circ = 0.1396$ rad, the linear lateral force is $117.98$ kN against an exact $117.60$ kN, an error of 0.33%, still comfortably inside what a control design tolerates. The linear gain of this actuator is $F = 845$ kN per radian, or $14.7$ kN per degree.
:::

::: example Earth curvature under a long-range trajectory
A sounding rocket's trajectory is computed in a flat-Earth frame tangent to the launch site. How far has the real Earth's surface dropped below that plane at 100 km downrange? With $R = 6371$ km:

$$
h = R\left(1 - \cos\frac{d}{R}\right) \approx \frac{d^2}{2R} = \frac{(100\,000)^2}{2 \times 6.371 \times 10^6} = 785\ \mathrm{m} .
$$

The exact value is $784.79$ m and the approximation gives $784.81$ m: the angle $d/R = 0.0157$ rad is tiny, and the quadratic form is essentially exact. At 1000 km downrange the angle is $0.157$ rad ($9^\circ$), the exact drop is 78.32 km and the approximation gives 78.48 km, 0.2% high — still usable for a first estimate, but a flat-Earth trajectory model has long since stopped being acceptable for other reasons (gravity now points in a visibly different direction at the two ends).

The same relation gives the horizon. From an eye height of 2 m, $d \approx \sqrt{2 \times 6.371 \times 10^6 \times 2} = 5.05$ km, matching the exact geometry to five figures. From the ISS at 420 km, $\sqrt{2Rh} = 2313$ km, whereas the exact ground distance to the horizon (lesson 5) is 2252 km and the exact slant range 2351 km. The approximation has landed between the two because, at a central angle of $20^\circ$, the arc, the chord and the tangent have visibly separated. That is the approximation breaking, and the table above predicted it.
:::

## Where it breaks

The approximation fails in three recognisable situations.

**Large-angle manoeuvres.** A spacecraft slewing $90^\circ$ to a new target, a launch vehicle pitching over from vertical to horizontal, a re-entry capsule at $25^\circ$ angle of attack: none of these are small. A controller designed on the linear model must be verified — and usually redesigned — against the full nonlinear equations, or made to operate in a sequence of small steps, or replaced by a formulation such as quaternions that does not need small angles at all.

**Near the singularity of the tangent.** $\tan\theta \approx \theta$ is not merely inaccurate near $90^\circ$; it is qualitatively wrong, because the tangent grows without bound and the line does not. Any formula containing a tangent of an angle that can approach a right angle needs the exact function.

**When the quantity of interest is the correction itself.** If what you want is $1 - \cos\theta$, then $\cos\theta \approx 1$ gives zero and $\cos\theta \approx 1 - \theta^2/2$ gives the answer. Similarly, if what you want is the difference $\theta - \sin\theta$ — the nonlinearity of a pendulum, the phase error of an oscillator — you need the cubic term, because the linear term cancels exactly. The rule is to keep one more term than the order at which your answer first appears.

::: note Derivatives, for later
When you reach calculus, $\sin\theta \approx \theta$ will reappear as the statement that the derivative of $\sin\theta$ at zero is 1, and $\cos\theta \approx 1 - \theta^2/2$ as the statement that the second derivative of $\cos\theta$ at zero is $-1$. Both are only true in radians, which is the calculus reason for the radian.
:::

## Check yourself

::: check
A control law uses $\sin\theta \approx \theta$. The vehicle experiences a $25^\circ$ pitch excursion. What relative error does the approximation carry there, and what would including the cubic term reduce it to?
:::

::: answer
$25^\circ = 0.4363$ rad and $\sin 25^\circ = 0.4226$. The first-order error is $(0.4363 - 0.4226)/0.4226 = 3.2\%$; the estimate $\theta^2/6 = 0.0317$ agrees. With the cubic term, $\theta - \theta^3/6 = 0.4363 - 0.01384 = 0.4225$, an error of $-0.03\%$: a hundred times smaller. A 3% error in the effective stiffness of a control loop shifts its natural frequency by about 1.6% and its damping ratio by a similar amount — tolerable for some loops, not for others, and the design must say which.
:::

::: check
A 10 m spacecraft is observed from 20 km. What angle does it subtend, in radians and in arcminutes? How much does the exact formula differ from the small-angle one?
:::

::: answer
$\theta \approx s/r = 10/20\,000 = 5.0 \times 10^{-4}$ rad. In degrees that is $0.02865^\circ$, or $1.719$ arcminutes. The exact value is $2\arctan(5/20\,000) = 2\arctan(2.5 \times 10^{-4})$, which differs from $5.0 \times 10^{-4}$ by about $\theta^3/12 \approx 10^{-11}$ rad — a relative difference of $2 \times 10^{-8}$, far below anything an instrument could measure.
:::

::: check
An engineer argues that since $\cos\theta \approx 1$, a $30^\circ$ misalignment between a thruster and the desired burn direction costs "essentially nothing" in delivered $\Delta v$. Evaluate the claim.
:::

::: answer
The delivered component along the desired direction is $\Delta v\cos 30^\circ = 0.866\,\Delta v$, so 13.4% of the burn is wasted along the desired axis (and 50% of it, $\Delta v\sin 30^\circ$, goes sideways). The claim confuses "the cosine is near 1 for small angles" with "the cosine loss is negligible"; at $30^\circ$ the loss is $1 - \cos 30^\circ = 0.134$, and even the improved approximation $\theta^2/2 = 0.137$ is 2.3% off, because $30^\circ$ is not small. The approximation would be reasonable for a misalignment of a degree or two: at $1^\circ$ the loss is $1.5 \times 10^{-4}$.
:::

::: check
The gravity-gradient torque of lesson 4 goes as $\sin 2\theta$. If a pitch angle of $10^\circ$ is called "small" and the torque is linearised to $2\theta$, what relative error results, and how does it compare with the error of $\sin\theta \approx \theta$ at the same $\theta$?
:::

::: answer
The argument of the sine is $2\theta = 20^\circ = 0.3491$ rad, and $\sin 20^\circ = 0.3420$, so the relative error is $(0.3491 - 0.3420)/0.3420 = 2.1\%$. The error of $\sin 10^\circ \approx 0.1745$ is 0.51%. The ratio is four, because the relative error goes as the square of the argument and the argument has doubled. When a formula contains a multiple of the angle, the smallness test must be applied to that multiple.
:::

::: check
A navigation filter computes a small heading correction as $\arctan(\Delta y/\Delta x)$ and a colleague proposes replacing it with $\Delta y/\Delta x$ to save a function call. For $\Delta y/\Delta x = 0.2$, how large is the error, and is the replacement safe?
:::

::: answer
$\arctan 0.2 = 0.1974$ rad, while $0.2$ is $1.3\%$ high; the estimate $x^2/3 = 1.33\%$ agrees. Whether that is acceptable depends on the filter's accuracy requirement, but the replacement is unsafe for a different reason: the ratio $\Delta y/\Delta x$ is the $\arctan(y/x)$ construction of lesson 3 in disguise. It divides by zero when $\Delta x = 0$ and returns a small "correction" for a vector pointing backwards. If the correction is guaranteed to be small and $\Delta x$ guaranteed positive, the ratio is fine to about 1% at $0.2$; otherwise use `atan2`.
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
| $1 - \cos\theta \approx \theta^2/2$ | Cosine loss; never approximate it as zero when it is the answer |
| $h \approx d^2/2R$, $d \approx \sqrt{2Rh}$ | Curvature drop and horizon distance on a sphere |
| $F\sin\delta \approx F\delta$ | Linear actuator gain, $F$ per radian |

The next lesson moves from angles to coordinates: the polar pair $(r, \theta)$ in the plane and the spherical triple of radius, latitude and longitude in space, together with the ellipsoidal refinement that every GPS receiver and launch-site survey uses.
