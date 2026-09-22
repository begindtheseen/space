---
id: l05-maxima-minima-optimisation
title: Maxima, minima and optimising a scalar function
minutes: 24
covers:
  - maxima, minima and optimisation of a scalar function
---

A great deal of GNC is the search for a best value of something. The launch azimuth that puts the most payload into the target plane, the speed at which an aircraft's drag is least, the scale factor that makes an accelerometer's readings fit the applied accelerations most closely, the burn time that minimises propellant for a landing — each is a number chosen to make some function as large or as small as it can be. The navigation filter you will build later is an optimiser too: it picks the state estimate that minimises a weighted sum of squared residuals, once per measurement, for the life of the mission.

The derivative turns this search from a blind sweep into algebra. A function cannot be at its highest at a point where it is still rising, so at a smooth peak the slope must be zero; that single observation, made precise, reduces "find the maximum" to "solve $f'(x) = 0$ and check the candidates". This lesson establishes when that works, how to tell a maximum from a minimum, and why the endpoints of an interval need separate attention. It also proves the mean value theorem, which the next two lessons lean on to bound the error of a linearisation.

## Local and global extrema

Let $f$ be defined on an interval $I$. A point $c$ in $I$ is a **global maximum** if $f(c) \ge f(x)$ for every $x$ in $I$, and a **global minimum** if $f(c) \le f(x)$ for every $x$. It is a **local maximum** if $f(c) \ge f(x)$ for all $x$ in some open interval around $c$ — the function may climb higher elsewhere, but not nearby — and a **local minimum** is defined the same way with the inequality reversed. The word **extremum** covers both.

A function need not have any of these. On the open interval $(0, 1)$, $f(x) = x$ has no maximum: for every candidate $c$ there is a larger value at $(c + 1)/2$. On the whole real line $f(x) = x^3$ has neither a maximum nor a minimum. What guarantees existence is the **extreme value theorem**: a function continuous on a *closed* interval $[a, b]$ attains a global maximum and a global minimum somewhere on it. This is the counterpart of the intermediate value theorem from the first lesson — continuity on a closed, bounded interval is enough to promise that the extreme values are actually reached. Throw away either condition and the promise fails: $1/x$ on $(0, 1]$ is continuous but unbounded, and a function with a jump on $[0, 1]$ can approach a value it never takes.

## Fermat's theorem: where the extrema can hide

Suppose $f$ has a local maximum at an interior point $c$ and is differentiable there. Consider the difference quotient $\dfrac{f(c + h) - f(c)}{h}$. For small $h$, the numerator is at most zero because $f(c)$ is the largest value nearby. When $h > 0$ the quotient is therefore $\le 0$, and its limit from the right is $\le 0$. When $h < 0$ the quotient is $\ge 0$ (a non-positive number divided by a negative one), and its limit from the left is $\ge 0$. The derivative exists, so both one-sided limits equal $f'(c)$, and the only number that is both $\le 0$ and $\ge 0$ is zero:

$$
f \text{ has a local extremum at an interior point } c \text{ and } f'(c) \text{ exists} \quad\Longrightarrow\quad f'(c) = 0.
$$

A point where $f'(c) = 0$ is a **stationary point**. The theorem says every interior extremum of a differentiable function is stationary. It does *not* say every stationary point is an extremum: $f(x) = x^3$ has $f'(0) = 0$, yet $x^3$ is negative to the left of zero and positive to the right, so the origin is neither a maximum nor a minimum. A stationary point that is not an extremum is a **saddle** (in one variable, an inflection point with a horizontal tangent).

Extrema can also hide in two places the theorem does not cover. At an endpoint of $[a, b]$ the argument fails because $h$ can only have one sign. And where $f$ is not differentiable — a corner like $|x|$ at $0$, which is a minimum with no derivative — the theorem has nothing to say. Together these give the complete list of **critical points**: interior points with $f'(c) = 0$, interior points where $f'$ does not exist, and the endpoints. A global extremum on a closed interval must be one of them, because if it were anywhere else it would be an interior extremum of a differentiable function and Fermat's theorem would force $f' = 0$ there.

::: key
Condition for an interior extremum of $f(x)$: $f'(x) = 0$, a stationary point. It is necessary, not sufficient — $x^3$ is stationary at $0$ without an extremum there. The candidates for a global extremum on $[a, b]$ are the stationary points, the points where $f'$ fails to exist, and the endpoints $a$ and $b$.
:::

## The mean value theorem

Two short results connect the sign of $f'$ to whether $f$ rises or falls, and they will matter again when the next lesson asks how far a tangent line strays from its curve.

**Rolle's theorem.** If $f$ is continuous on $[a, b]$, differentiable on $(a, b)$, and $f(a) = f(b)$, then $f'(\xi) = 0$ for some $\xi$ in $(a, b)$. Proof: by the extreme value theorem $f$ has a maximum and a minimum on $[a, b]$. If both occur at the endpoints, then since $f(a) = f(b)$ the maximum equals the minimum, $f$ is constant, and $f' = 0$ everywhere. Otherwise one of them is interior, and Fermat's theorem gives $f' = 0$ there.

**Mean value theorem.** Drop the condition $f(a) = f(b)$. The secant through the endpoints has slope $\dfrac{f(b) - f(a)}{b - a}$, and the theorem says some tangent is parallel to it:

$$
f(b) - f(a) = f'(\xi)\,(b - a) \quad \text{for some } \xi \text{ in } (a, b).
$$

Proof: tilt the picture. Define $g(x) = f(x) - f(a) - \dfrac{f(b) - f(a)}{b - a}(x - a)$, the gap between $f$ and its secant. Then $g(a) = 0$ and $g(b) = 0$, so Rolle gives a $\xi$ with $g'(\xi) = 0$, that is $f'(\xi) = \dfrac{f(b) - f(a)}{b - a}$.

Physically: a vehicle that covers $b - a$ seconds with average velocity $\bar v$ must, at some instant, have had velocity exactly $\bar v$. The theorem does not say where $\xi$ is, only that it exists, and that is exactly the form in which it will be useful for error bounds.

**Consequence.** If $f'(x) > 0$ throughout an interval, then for any $x_1 < x_2$ in it, $f(x_2) - f(x_1) = f'(\xi)(x_2 - x_1) > 0$: the function is **increasing**. If $f' < 0$ it is **decreasing**, and if $f' = 0$ everywhere it is constant. This last fact is why two functions with the same derivative differ by a constant, which is the whole basis of the integration lessons to come.

## Classifying a stationary point

Two tests decide whether a stationary point $c$ is a maximum, a minimum or neither.

**First-derivative test.** Look at the sign of $f'$ on either side. If $f'$ changes from positive to negative through $c$, the function rises then falls: a local maximum. Negative to positive: a local minimum. No change of sign: neither, as with $x^3$. This test always works when $f'$ is available on both sides, and it handles corners too.

**Second-derivative test.** If $f'(c) = 0$ and $f''(c)$ exists, apply the definition of the derivative to $f'$:

$$
f''(c) = \lim_{h \to 0} \frac{f'(c + h) - f'(c)}{h} = \lim_{h \to 0} \frac{f'(c + h)}{h}.
$$

If $f''(c) > 0$, then for small $h$ the quotient $f'(c + h)/h$ is positive, so $f'(c + h)$ has the same sign as $h$: negative just left of $c$, positive just right. By the first-derivative test, $c$ is a local minimum. If $f''(c) < 0$ the signs reverse and $c$ is a local maximum. The picture is that $f'' > 0$ means the slope is increasing, so the curve bends upward and sits in a bowl; $f'' < 0$ means it bends downward under a dome.

If $f''(c) = 0$ the test is **inconclusive**, and you must fall back on the first-derivative test or higher derivatives. All three of $x^4$ (minimum), $-x^4$ (maximum) and $x^3$ (saddle) have $f'(0) = f''(0) = 0$.

::: key
Classifying a stationary point $f'(c) = 0$: $f''(c) > 0$ means a local minimum, $f''(c) < 0$ a local maximum, and $f''(c) = 0$ is inconclusive — check the sign change of $f'$ instead.
:::

An interval where $f'' > 0$ is called **convex** (the graph lies above its tangent lines, bowl-shaped) and where $f'' < 0$ **concave**. A point where the concavity switches is an **inflection point**, and $f''$ is zero there when it exists. Convexity matters far beyond this module: a convex function has at most one minimum, every local minimum is global, and a descent method cannot get stuck. That single property is why so much effort in landing guidance goes into recasting the problem as a convex one.

## The closed-interval procedure

To find the global extrema of a continuous $f$ on $[a, b]$:

1. Compute $f'$ and solve $f'(x) = 0$ for the stationary points inside $(a, b)$.
2. Add any interior points where $f'$ does not exist.
3. Add the endpoints $a$ and $b$.
4. Evaluate $f$ at every candidate. The largest value is the global maximum, the smallest the global minimum.

No second-derivative test is needed in this procedure: comparing the values does the classification. On an open or infinite interval, replace step 3 by examining the limits of $f$ at the ends, and remember that the extreme value theorem no longer guarantees anything exists.

::: example Launch angle for maximum range
A projectile launched at speed $v$ and angle $\theta$ above flat ground, without drag, lands at range $R(\theta) = \dfrac{v^2 \sin 2\theta}{g_0}$. Which $\theta$ in $[0, \pi/2]$ maximises the range, and what is it for $v = 300\,\mathrm{m/s}$?

Differentiate with the chain rule: $R'(\theta) = \dfrac{2v^2\cos 2\theta}{g_0}$, which is zero when $\cos 2\theta = 0$, that is $2\theta = \pi/2$ and $\theta = \pi/4 = 45^\circ$. The second derivative is $R''(\theta) = -\dfrac{4v^2\sin 2\theta}{g_0}$, negative at $45^\circ$, so this is a local maximum. The endpoints give $R(0) = R(\pi/2) = 0$, so it is the global maximum. With $v = 300\,\mathrm{m/s}$:

$$
R_{\max} = \frac{300^2}{9.80665} = 9177\,\mathrm{m} \approx 9.18\,\mathrm{km}.
$$

At $30^\circ$ or $60^\circ$ the range is $\sin 60^\circ = 0.866$ of this, $7.95\,\mathrm{km}$: the same for both, because $\sin 2\theta$ is symmetric about $45^\circ$. The flatness of the maximum — a $15^\circ$ error in launch angle costs only $13\%$ of range — is typical of a smooth optimum, and it is the reason the first-order term vanishes there in the next lesson's error analysis.
:::

::: example Where max-Q occurs
Dynamic pressure $q = \tfrac12\rho v^2$ drives the structural loads on an ascending launcher, and the moment of peak dynamic pressure, **max-Q**, is called out on every launch broadcast. Model a vertical ascent from rest at constant net acceleration $a$, so $v = at$ and altitude $h = \tfrac12 a t^2$, through an exponential atmosphere $\rho = \rho_0 e^{-h/H}$ with sea-level density $\rho_0 = 1.225\,\mathrm{kg/m^3}$ and scale height $H = 7.5\,\mathrm{km}$. When does max-Q occur?

Write $q$ as a function of time alone:

$$
q(t) = \tfrac12 \rho_0\, a^2 t^2 \exp\!\left(-\frac{a t^2}{2H}\right).
$$

Differentiate with the product and chain rules; the exponential's inner derivative is $-at/H$:

$$
q'(t) = \tfrac12 \rho_0 a^2 \exp\!\left(-\frac{a t^2}{2H}\right)\left[2t - t^2\cdot\frac{a t}{H}\right] = \tfrac12 \rho_0 a^2\, t\, \exp\!\left(-\frac{a t^2}{2H}\right)\left(2 - \frac{a t^2}{H}\right).
$$

The exponential is never zero, $t = 0$ is the launch instant where $q = 0$, so the stationary point of interest is $a t^2 / H = 2$, or $t^* = \sqrt{2H/a}$. The bracket is positive before $t^*$ and negative after, so by the first-derivative test $q$ rises to a maximum there and then falls as the air thins faster than the speed grows. The altitude at that moment is

$$
h^* = \tfrac12 a\,(t^*)^2 = \tfrac12 a \cdot \frac{2H}{a} = H.
$$

Max-Q occurs at exactly one scale height, whatever the acceleration. For $a = 15\,\mathrm{m/s^2}$: $t^* = \sqrt{15\,000/15} = 31.6\,\mathrm{s}$, $v = 474\,\mathrm{m/s}$, and $q_{\max} = \tfrac12(1.225)(e^{-1})(474.3)^2 = 50.7\,\mathrm{kPa}$. Ten percent either side of $t^*$, $q$ is $49.7\,\mathrm{kPa}$ — the peak is broad. Real vehicles accelerate slowly at first (a thrust-to-weight ratio of $1.3$ gives a net $2.9\,\mathrm{m/s^2}$ off the pad) and pitch over, which pushes max-Q later and higher than this model, typically to $10$–$15\,\mathrm{km}$; but the structure of the calculation, and the value of $q$ it produces, are what the loads engineers start from.
:::

::: example Minimum-drag speed
In steady level flight an aircraft's drag is the sum of a parasite term that grows with speed and an induced term that shrinks with it:

$$
D(v) = \tfrac12 \rho S C_{D0}\, v^2 + \frac{2 k W^2}{\rho S}\cdot\frac{1}{v^2}, \qquad k = \frac{1}{\pi e\, A\!R},
$$

where $W$ is weight, $S$ wing area, $C_{D0}$ the zero-lift drag coefficient, $A\!R$ the aspect ratio and $e$ the Oswald efficiency. Find the speed of minimum drag for $W = 60\,000\,\mathrm{kg} \times g_0 = 588\,\mathrm{kN}$, $S = 125\,\mathrm{m^2}$, $C_{D0} = 0.02$, $A\!R = 9$, $e = 0.8$ at sea level.

Write $D = Av^2 + B/v^2$ with $A = \tfrac12\rho S C_{D0}$ and $B = 2kW^2/(\rho S)$. Then $D'(v) = 2Av - 2B/v^3$, which is zero when $v^4 = B/A$:

$$
v_{\mathrm{md}} = \left(\frac{B}{A}\right)^{1/4} = \left(\frac{4 k W^2}{\rho^2 S^2 C_{D0}}\right)^{1/4} = \sqrt{\frac{2W}{\rho S}}\left(\frac{k}{C_{D0}}\right)^{1/4}.
$$

The second derivative $D'' = 2A + 6B/v^4$ is positive for every $v > 0$, so this is a minimum, and since $D \to \infty$ at both ends of $(0, \infty)$ it is the global one. Notice that at $v_{\mathrm{md}}$ the condition $Av^4 = B$ says $Av^2 = B/v^2$: parasite drag equals induced drag at the minimum-drag speed, a result every pilot learns.

Numbers: $k = 1/(\pi \times 0.8 \times 9) = 0.0442$; $\sqrt{2W/(\rho S)} = \sqrt{2 \times 588\,399/(1.225 \times 125)} = 87.7\,\mathrm{m/s}$; $(k/C_{D0})^{1/4} = (2.21)^{1/4} = 1.219$. So $v_{\mathrm{md}} = 106.9\,\mathrm{m/s}$, about $208$ knots. There each drag term is $17.5\,\mathrm{kN}$, total $35.0\,\mathrm{kN}$, and the lift-to-drag ratio is $W/D = 16.8$. Flying $20\%$ slow raises drag to $38.5\,\mathrm{kN}$ and $20\%$ fast to $37.3\,\mathrm{kN}$: the low side is worse, because the induced term falls off as $1/v^2$.
:::

::: example Least-squares scale factor
An accelerometer on a dividing head is exposed to five known accelerations $x_i$ (in $\mathrm{m/s^2}$) and reports $y_i$:

| $x_i$ | $-9.80665$ | $-4.90333$ | $0$ | $4.90333$ | $9.80665$ |
| --- | --- | --- | --- | --- | --- |
| $y_i$ | $-9.8324$ | $-4.9210$ | $0.0036$ | $4.9285$ | $9.8412$ |

Model the sensor as $y = a x$ and choose the scale factor $a$ that minimises the sum of squared residuals $S(a) = \sum_i (y_i - a x_i)^2$.

$S$ is a function of the single variable $a$. Differentiate term by term with the chain rule:

$$
S'(a) = \sum_i 2(y_i - a x_i)(-x_i) = -2\sum_i x_i y_i + 2a\sum_i x_i^2.
$$

Setting $S'(a) = 0$ gives the **normal equation** and its solution

$$
a^* = \frac{\sum_i x_i y_i}{\sum_i x_i^2}.
$$

The second derivative is $S''(a) = 2\sum_i x_i^2 = 481 > 0$, so this is a minimum, and since $S$ is a quadratic in $a$ opening upward it is the global one. Numbers: $\sum x_i y_i = 241.227$ and $\sum x_i^2 = 240.426$, so $a^* = 1.00333$ — the sensor reads $0.333\%$ high, a scale-factor error of $3333\,\mathrm{ppm}$ that the navigation software will compensate. The residual sum at the optimum is $S(a^*) = 1.44 \times 10^{-4}\,\mathrm{(m/s^2)^2}$, against $2.82 \times 10^{-3}$ if the scale factor were left at $1$. This one-parameter fit is the germ of every least-squares problem in GNC; the matrix version replaces $\sum x_i^2$ by $\mathbf{A}^\mathsf{T}\mathbf{A}$ and $\sum x_i y_i$ by $\mathbf{A}^\mathsf{T}\mathbf{y}$.
:::

::: warning
Solving $f'(x) = 0$ finds stationary points, not maxima. Students hand in the stationary point as "the answer" without checking whether it is a maximum, a minimum or a saddle — and without checking the endpoints, where the largest value on a closed interval very often sits. In the projectile example the endpoints gave zero range, which was easy to dismiss; in a real trajectory problem a constraint boundary is frequently where the optimum lives.
:::

::: warning
The second-derivative test says nothing when $f''(c) = 0$. It does not mean "inflection point" and it does not mean "not an extremum": $x^4$ has a perfectly good minimum at a point where the test is silent. Go back to the sign of $f'$ on either side.
:::

::: note
Everything here is for a scalar function of one variable. With several variables the stationary condition becomes "all partial derivatives vanish" (the gradient is zero), and the second-derivative test becomes a question about the eigenvalues of the matrix of second partials, the Hessian. The one-variable case is the template: gradient zero, Hessian positive definite, minimum. The multivariable module makes this precise, and the optimisation module builds the algorithms.
:::

## Check yourself

::: check
State Fermat's theorem precisely. Give one example of a stationary point that is not an extremum and one example of a global minimum that is not a stationary point.
:::

::: answer
If $f$ has a local extremum at an interior point $c$ of its domain and $f'(c)$ exists, then $f'(c) = 0$. A stationary point that is not an extremum: $f(x) = x^3$ at $x = 0$, where $f'(0) = 0$ but the function is negative to the left and positive to the right. A global minimum that is not stationary: $f(x) = |x|$ at $x = 0$, where the derivative does not exist, or $f(x) = x$ on $[0, 1]$, whose minimum is at the endpoint $x = 0$ with $f'(0) = 1$.
:::

::: check
Find and classify all stationary points of $f(x) = x^3 - 3x^2 + 1$.
:::

::: answer
$f'(x) = 3x^2 - 6x = 3x(x - 2)$, zero at $x = 0$ and $x = 2$. $f''(x) = 6x - 6$. At $x = 0$: $f''(0) = -6 < 0$, a local maximum with $f(0) = 1$. At $x = 2$: $f''(2) = 6 > 0$, a local minimum with $f(2) = 8 - 12 + 1 = -3$. Neither is global: $f \to -\infty$ as $x \to -\infty$ and $f \to +\infty$ as $x \to +\infty$. The inflection point is at $f'' = 0$, $x = 1$, midway between them.
:::

::: check
Find the global maximum and minimum of $g(x) = x e^{-x}$ on $[0, 3]$.
:::

::: answer
By the product rule $g'(x) = e^{-x} - x e^{-x} = e^{-x}(1 - x)$, zero only at $x = 1$; $g'$ exists everywhere. Candidates: $x = 0$, $1$, $3$. Values: $g(0) = 0$, $g(1) = e^{-1} = 0.368$, $g(3) = 3e^{-3} = 0.149$. Global maximum $0.368$ at $x = 1$; global minimum $0$ at the endpoint $x = 0$. The endpoint wins the minimum even though $g' = 1 \ne 0$ there.
:::

::: check
Find the largest and smallest values of $f(x) = \dfrac{x}{1 + x^2}$ over all real $x$, and justify that they are global.
:::

::: answer
By the quotient rule $f'(x) = \dfrac{(1 + x^2) - x(2x)}{(1 + x^2)^2} = \dfrac{1 - x^2}{(1 + x^2)^2}$, zero at $x = \pm 1$. $f'$ is positive for $|x| < 1$ and negative for $|x| > 1$, so $x = 1$ is a local maximum with $f(1) = \tfrac12$ and $x = -1$ a local minimum with $f(-1) = -\tfrac12$. Since $f(x) \to 0$ as $x \to \pm\infty$ and there are no other stationary points, these are the global maximum and minimum. The function is bounded between $-\tfrac12$ and $\tfrac12$ everywhere.
:::

::: check
On an elliptical orbit of eccentricity $e$, the flight-path angle $\gamma$ (velocity above the local horizontal) satisfies $\tan\gamma = \dfrac{e\sin\nu}{1 + e\cos\nu}$, with $\nu$ the true anomaly. At what $\nu$ is $\gamma$ largest, what is the largest value, and where on the orbit is that? Evaluate for $e = 0.3$.
:::

::: answer
Since $\arctan$ is increasing, maximise $u(\nu) = \dfrac{e\sin\nu}{1 + e\cos\nu}$. By the quotient rule the numerator of $u'$ is $e\cos\nu\,(1 + e\cos\nu) - e\sin\nu\,(-e\sin\nu) = e\cos\nu + e^2(\cos^2\nu + \sin^2\nu) = e(\cos\nu + e)$. It vanishes when $\cos\nu = -e$; it is positive for smaller $\nu$ and negative for larger, so this is the maximum. There $\sin\nu = \sqrt{1 - e^2}$, and $\tan\gamma_{\max} = \dfrac{e\sqrt{1 - e^2}}{1 - e^2} = \dfrac{e}{\sqrt{1 - e^2}}$, which means $\sin\gamma_{\max} = e$. The radius there is $r = \dfrac{a(1 - e^2)}{1 + e\cos\nu} = \dfrac{a(1 - e^2)}{1 - e^2} = a$: the end of the minor axis. For $e = 0.3$: $\nu = \arccos(-0.3) = 107.5^\circ$ and $\gamma_{\max} = \arcsin 0.3 = 17.5^\circ$. At $\nu = 90^\circ$ the angle is $16.7^\circ$ and at $120^\circ$ it is $17.0^\circ$, both smaller, as they should be.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Extreme value theorem | $f$ continuous on closed $[a, b]$ attains a global max and min |
| Fermat's theorem | Interior extremum with $f'(c)$ existing $\Rightarrow f'(c) = 0$ |
| Critical points | Stationary points, points with no derivative, endpoints |
| Rolle / mean value theorem | $f(b) - f(a) = f'(\xi)(b - a)$ for some $\xi$ in $(a, b)$ |
| Monotonicity | $f' > 0 \Rightarrow$ increasing; $f' < 0 \Rightarrow$ decreasing; $f' = 0 \Rightarrow$ constant |
| Second-derivative test | $f'(c) = 0$: $f''(c) > 0$ min, $f''(c) < 0$ max, $f''(c) = 0$ inconclusive |
| Convex / concave | $f'' > 0$ bowl, $f'' < 0$ dome; inflection where concavity changes |
| Closed-interval procedure | Evaluate $f$ at every critical point; compare |
| Least-squares slope | $S(a) = \sum(y_i - ax_i)^2$ minimised at $a^* = \sum x_i y_i / \sum x_i^2$ |

The mean value theorem proved here is the tool the next lesson uses to say exactly how far the tangent line $f(x_0) + f'(x_0)(x - x_0)$ can drift from $f(x)$ — the linearisation error that every filter and controller lives with.
