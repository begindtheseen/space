---
id: l05-maxima-minima-optimisation
title: Maxima, minima and optimising a scalar function
minutes: 26
covers:
  - maxima, minima and optimisation of a scalar function
---

A lot of guidance, navigation and control is a hunt for the best value of something.

- The launch direction that puts the most payload into the target orbit.
- The airspeed at which an airplane's drag is lowest.
- The scale factor that makes an accelerometer's readings best match the accelerations it was given.
- The burn time that uses the least propellant for a landing.

Each is a number chosen to make some function as large, or as small, as it can be. The navigation filter you will build later hunts too: every time a measurement arrives, it picks the estimate that makes a weighted sum of squared errors smallest.

Derivatives turn this hunt from blind searching into algebra. Think of hiking to the top of a hill. At the very top you are not going up any more, and you are not yet going down. The ground is level under your feet. So at a smooth peak the slope must be zero. Made precise, that one observation turns "find the maximum" into "solve $f'(x) = 0$ and check the candidates". This lesson shows when that works, how to tell a peak from a valley, and why the ends of an interval need their own check. It also proves the **mean value theorem**, which the next two lessons use to measure the error of a linearisation.

## Highest and lowest points

Some words first. Let $f$ be defined on an **interval** $I$ — a stretch of the number line, like all $x$ from $0$ to $3$.

- A point $c$ in $I$ is a **global maximum** if $f(c) \ge f(x)$ for every $x$ in $I$. It is the highest point anywhere on the interval.
- It is a **global minimum** if $f(c) \le f(x)$ for every $x$ in $I$: the lowest point anywhere.
- It is a **local maximum** if $f(c) \ge f(x)$ for every $x$ in some small open interval around $c$. It is the top of *a* hill. The function may climb higher somewhere else, but not nearby.
- A **local minimum** is the bottom of a valley in the same sense, with the inequality reversed.

The word **[[extremum|extremum-word]]** (plural *extrema*) covers all of these.

A function does not have to have any of them. On the **open interval** $(0, 1)$ — all numbers strictly between $0$ and $1$, not including the ends — the function $f(x) = x$ has no maximum. Whatever candidate $c$ you pick, the point halfway between $c$ and $1$, at $(c + 1)/2$, is higher. On the whole number line, $f(x) = x^3$ has neither a maximum nor a minimum: it goes down forever to the left and up forever to the right.

So when is a maximum guaranteed? The **extreme value theorem** says: *a function that is continuous on a closed interval $[a, b]$ reaches a global maximum and a global minimum somewhere on it.* The square brackets mean the ends $a$ and $b$ are included. This is the partner of the intermediate value theorem from the first lesson. Continuity on a closed, bounded interval is enough to promise that the highest and lowest values are actually reached.

Take away either condition and the promise breaks. $1/x$ on $(0, 1]$ is continuous but shoots up without limit near $0$. A function with a jump on $[0, 1]$ can creep toward a value it never takes.

## Where a peak can hide

Suppose $f$ has a local maximum at a point $c$ in the *inside* of the interval (not at an end), and $f$ has a derivative there. Then $f'(c) = 0$. This is **Fermat's theorem**.

The picture is the hilltop: a slope that is still positive means you are still climbing, and a slope that is negative means you have already passed the top. At the top itself, the **[[slope has to be zero|fermat-picture]]**.

$$
f \text{ has a local extremum at an interior point } c \text{ and } f'(c) \text{ exists} \quad\Longrightarrow\quad f'(c) = 0.
$$

::: note Why it has to be true
Look at the difference quotient $\dfrac{f(c + h) - f(c)}{h}$ for small $h$. Since $f(c)$ is the largest value nearby, the top, $f(c + h) - f(c)$, is zero or negative.

- When $h > 0$, a non-positive number divided by a positive one is $\le 0$. So the limit from the right is $\le 0$.
- When $h < 0$, a non-positive number divided by a negative one is $\ge 0$. So the limit from the left is $\ge 0$.

The derivative exists, so both one-sided limits equal the same number, $f'(c)$. The only number that is both $\le 0$ and $\ge 0$ is zero. A local minimum works the same way with the signs flipped.
:::

A point where $f'(c) = 0$ is called a **stationary point** — the function is momentarily standing still. Fermat's theorem says every interior peak or valley of a differentiable function is a stationary point.

It does *not* say the reverse. $f(x) = x^3$ has $f'(0) = 0$, yet $x^3$ is negative to the left of zero and positive to the right. The origin is neither a peak nor a valley. The curve pauses, level for an instant, and then keeps climbing. A stationary point that is not an extremum is called a **saddle**. In one variable it is an inflection point with a flat tangent.

Extrema can also hide in two places Fermat's theorem does not cover.

- **At an endpoint** of $[a, b]$. The argument above needed $h$ to take both signs, and at an end it can only take one.
- **Where $f$ has no derivative.** The corner of $|x|$ at $0$ is a minimum, but there is no slope there at all.

Together these make the full list of **critical points**: interior points with $f'(c) = 0$, interior points where $f'$ does not exist, and the endpoints. A global extremum on a closed interval must be one of them. If it were anywhere else, it would be an interior extremum with a derivative, and Fermat's theorem would force $f' = 0$ there — making it a critical point after all.

::: key
Condition for an interior extremum of $f(x)$: $f'(x) = 0$, a stationary point. It is necessary, not sufficient — $x^3$ is stationary at $0$ without an extremum there. The candidates for a global extremum on $[a, b]$ are the stationary points, the points where $f'$ fails to exist, and the endpoints $a$ and $b$.
:::

## The mean value theorem

Two short results connect the *sign* of $f'$ to whether $f$ rises or falls. They will matter again in the next lesson, when we ask how far a tangent line strays from its curve.

**Rolle's theorem.** Suppose $f$ is continuous on $[a, b]$, has a derivative on $(a, b)$, and $f(a) = f(b)$ — it ends at the same height it started. Then $f'(\xi) = 0$ for some $\xi$ between $a$ and $b$. ($\xi$ is the Greek letter "xi", pronounced "ksee" or "zai". Here it names a point we know exists but cannot pin down.)

Picture a ball thrown up that lands back at the height it left your hand. Somewhere in between it was momentarily moving neither up nor down.

::: note Why it has to be true
By the extreme value theorem, $f$ has a maximum and a minimum on $[a, b]$. If both happen at the endpoints, then — since $f(a) = f(b)$ — the maximum equals the minimum. So $f$ is constant, and $f' = 0$ everywhere. Otherwise at least one of them is inside the interval, and Fermat's theorem gives $f' = 0$ there.
:::

**Mean value theorem.** Now drop the condition $f(a) = f(b)$. The straight line joining the two endpoints — the **secant** — has slope $\dfrac{f(b) - f(a)}{b - a}$. The theorem says that somewhere in between, **[[a tangent is parallel to it|mvt-picture]]**:

$$
f(b) - f(a) = f'(\xi)\,(b - a) \quad \text{for some } \xi \text{ in } (a, b).
$$

In everyday terms: if you drive $120\,\mathrm{km}$ in exactly one hour, your average speed was $120\,\mathrm{km/h}$, and at some instant your speedometer read exactly $120$. For a vehicle, over any stretch of $b - a$ seconds with average velocity $\bar v$ ("v bar"), there was an instant when the velocity was exactly $\bar v$.

::: note Why it has to be true
Tilt the picture until the secant is level. Define

$$
g(x) = f(x) - f(a) - \frac{f(b) - f(a)}{b - a}(x - a),
$$

which is the height of $f$ above its secant. At $x = a$ the last term is zero and $g(a) = f(a) - f(a) = 0$. At $x = b$ the last term is $f(b) - f(a)$, so $g(b) = 0$ too. Rolle's theorem gives a $\xi$ with $g'(\xi) = 0$. Differentiating, $g'(x) = f'(x) - \dfrac{f(b) - f(a)}{b - a}$, so $f'(\xi) = \dfrac{f(b) - f(a)}{b - a}$.
:::

The theorem does not say *where* $\xi$ is, only that it exists. That turns out to be exactly the form that is useful for error bounds.

**What it gives you.** If $f'(x) > 0$ all through an interval, pick any two points $x_1 < x_2$ in it. Then $f(x_2) - f(x_1) = f'(\xi)(x_2 - x_1)$, a positive number times a positive number, so $f(x_2) > f(x_1)$. The function is **increasing**. If $f' < 0$ it is **decreasing**. And if $f' = 0$ everywhere, it is constant. That last fact is why two functions with the same derivative can differ only by a constant — the whole basis of the integration lessons to come.

## Peak or valley?

Two tests decide whether a stationary point $c$ is a maximum, a minimum or neither.

**First-derivative test.** Look at the sign of $f'$ a little to the left and a little to the right of $c$.

- $f'$ goes from positive to negative: the function rises, then falls. A local maximum.
- $f'$ goes from negative to positive: falls, then rises. A local minimum.
- No change of sign: neither, as with $x^3$.

This test always works when $f'$ exists on both sides, and it handles corners too.

**Second-derivative test.** The second derivative $f''$ says whether the slope is growing or shrinking. If $f'' > 0$, the slope is increasing, so the curve bends upward like a bowl. If $f'' < 0$, the slope is decreasing and the curve bends down like a dome. At the bottom of a bowl you have a minimum; at the top of a dome, a maximum.

::: note Why it has to be true
Suppose $f'(c) = 0$ and $f''(c)$ exists. Apply the definition of the derivative to $f'$:

$$
f''(c) = \lim_{h \to 0} \frac{f'(c + h) - f'(c)}{h} = \lim_{h \to 0} \frac{f'(c + h)}{h}.
$$

If $f''(c) > 0$, then for small $h$ the quotient $f'(c + h)/h$ is positive. So $f'(c + h)$ has the same sign as $h$: negative a little left of $c$, positive a little right. By the first-derivative test, $c$ is a local minimum. If $f''(c) < 0$ the signs flip and $c$ is a local maximum.
:::

If $f''(c) = 0$, the test is **inconclusive** — it cannot decide. Fall back on the first-derivative test or on higher derivatives. The three functions $x^4$ (a minimum), $-x^4$ (a maximum) and $x^3$ (a saddle) all have $f'(0) = f''(0) = 0$, so the second derivative alone cannot tell them apart.

::: key
Classifying a stationary point $f'(c) = 0$: $f''(c) > 0$ means a local minimum, $f''(c) < 0$ a local maximum, and $f''(c) = 0$ is inconclusive — check the sign change of $f'$ instead.
:::

A stretch where $f'' > 0$ is called **convex**: bowl-shaped, with the graph lying above its tangent lines. A stretch where $f'' < 0$ is **concave**: dome-shaped. A point where the bending switches direction is an **inflection point**, and $f''$ is zero there when it exists.

Convexity matters far beyond this module. A **[[convex function|convex-landing]]** has at most one lowest value, every local minimum is the global one, and a downhill search cannot get stuck in the wrong valley.

## The closed-interval recipe

To find the global maximum and minimum of a continuous $f$ on $[a, b]$:

1. Compute $f'$ and solve $f'(x) = 0$ for the stationary points inside $(a, b)$.
2. Add any interior points where $f'$ does not exist.
3. Add the endpoints $a$ and $b$.
4. Work out $f$ at every candidate. The largest value is the global maximum; the smallest is the global minimum.

No second-derivative test is needed: comparing the values does the sorting. On an open or infinite interval, replace step 3 with a look at what $f$ does as $x$ heads toward the ends — and remember the extreme value theorem no longer promises anything exists.

::: example Launch angle for maximum range
A ball fired at speed $v$ and angle $\theta$ above flat ground, with no air drag, lands at a distance

$$
R(\theta) = \frac{v^2 \sin 2\theta}{g_0}.
$$

Which $\theta$ between $0$ and $\pi/2$ gives the longest range? What is that range for $v = 300\,\mathrm{m/s}$?

**Differentiate.** By the chain rule, the inside $2\theta$ contributes a factor $2$:

$$
R'(\theta) = \frac{2v^2\cos 2\theta}{g_0}.
$$

**Solve $R' = 0$.** That needs $\cos 2\theta = 0$, so $2\theta = \pi/2$ and $\theta = \pi/4 = 45^\circ$.

**Classify.** $R''(\theta) = -\dfrac{4v^2\sin 2\theta}{g_0}$. At $45^\circ$, $\sin 90^\circ = 1$, so $R''$ is negative: a local maximum. The endpoints give $R(0) = R(\pi/2) = 0$ — firing flat or straight up goes nowhere. So $45^\circ$ is the global maximum.

**Numbers.** At $45^\circ$, $\sin 2\theta = 1$:

$$
R_{\max} = \frac{300^2}{9.80665} = \frac{90\,000}{9.80665} = 9177\,\mathrm{m} \approx 9.18\,\mathrm{km}.
$$

**Sanity check.** At $30^\circ$ or $60^\circ$ the range is $\sin 60^\circ = 0.866$ times this, $7.95\,\mathrm{km}$ — the same for both, because $\sin 2\theta$ is symmetric about $45^\circ$. So a $15^\circ$ error in the angle costs only $13\%$ of the range. That flat top is typical of a smooth optimum, and it is why the first-order term vanishes there in the next lesson's error analysis.
:::

::: example Where max-Q happens
**Dynamic pressure** is $q = \tfrac12\rho v^2$, where $\rho$ is the air density and $v$ the speed. It measures how hard the air pushes on the vehicle, and it drives the structural loads on a climbing rocket. The moment of peak dynamic pressure, **[[max-Q|max-q]]**, is called out on every launch broadcast.

Model a straight-up climb from rest with constant net acceleration $a$. Then the speed is $v = at$ and the altitude is $h = \tfrac12 a t^2$. The air thins out with height as $\rho = \rho_0 e^{-h/H}$, with sea-level density $\rho_0 = 1.225\,\mathrm{kg/m^3}$ and **[[scale height|scale-height]]** $H = 7.5\,\mathrm{km}$. When does max-Q happen?

**Write $q$ in terms of time alone.** Substitute $v$ and $h$:

$$
q(t) = \tfrac12 \rho_0\, a^2 t^2 \exp\!\left(-\frac{a t^2}{2H}\right).
$$

($\exp(u)$ is another way to write $e^u$, handy when $u$ is long.)

**Differentiate.** This is $t^2$ times an exponential, so use the product rule. The exponential's inside, $-at^2/(2H)$, has derivative $-at/H$, which the chain rule brings out front:

$$
q'(t) = \tfrac12 \rho_0 a^2 \exp\!\left(-\frac{a t^2}{2H}\right)\left[2t - t^2\cdot\frac{a t}{H}\right] = \tfrac12 \rho_0 a^2\, t\, \exp\!\left(-\frac{a t^2}{2H}\right)\left(2 - \frac{a t^2}{H}\right).
$$

**Solve $q' = 0$.** The exponential is never zero. The factor $t$ is zero only at launch, where $q = 0$. So the stationary point we want is where the last bracket is zero: $a t^2 / H = 2$, or

$$
t^* = \sqrt{\frac{2H}{a}}.
$$

**Classify.** The bracket is positive before $t^*$ and negative after it. By the first-derivative test, $q$ rises to a maximum and then falls: after $t^*$ the air thins faster than the speed grows.

**The altitude of max-Q.**

$$
h^* = \tfrac12 a\,(t^*)^2 = \tfrac12 a \cdot \frac{2H}{a} = H.
$$

Max-Q happens at exactly one scale height, whatever the acceleration.

**Numbers.** For $a = 15\,\mathrm{m/s^2}$: $t^* = \sqrt{15\,000/15} = \sqrt{1000} = 31.6\,\mathrm{s}$, and $v = 15 \times 31.6 = 474\,\mathrm{m/s}$. At $h = H$ the density is $\rho_0 e^{-1}$, so

$$
q_{\max} = \tfrac12(1.225)(e^{-1})(474.3)^2 = 50.7\,\mathrm{kPa}.
$$

**Sanity check.** Ten percent either side of $t^*$, $q$ is about $49.7\,\mathrm{kPa}$ — barely lower, so the peak is broad. Real rockets start more slowly (a thrust-to-weight ratio of $1.3$ gives a net $2.9\,\mathrm{m/s^2}$ off the pad) and tip over as they climb. Both push max-Q later and higher than this model, typically to $10$–$15\,\mathrm{km}$. But the shape of the calculation, and the size of $q$ it gives, are where the loads engineers start.
:::

::: example Minimum-drag speed
In steady level flight, an airplane's drag has two parts. **Parasite drag** is air friction on the skin and shape; it grows with speed. **[[Induced drag|induced-drag]]** is the price of making lift; it shrinks with speed. Together:

$$
D(v) = \tfrac12 \rho S C_{D0}\, v^2 + \frac{2 k W^2}{\rho S}\cdot\frac{1}{v^2}, \qquad k = \frac{1}{\pi e\, A\!R}.
$$

Here $W$ is the weight, $S$ the wing area, $C_{D0}$ ("C D zero") the zero-lift drag coefficient, $A\!R$ the aspect ratio (how long and slender the wing is) and $e$ the Oswald efficiency (how close the wing comes to ideal). Find the minimum-drag speed for $W = 60\,000\,\mathrm{kg} \times g_0 = 588\,\mathrm{kN}$, $S = 125\,\mathrm{m^2}$, $C_{D0} = 0.02$, $A\!R = 9$, $e = 0.8$, at sea level.

**Simplify the shape.** Write $D = Av^2 + B/v^2$, with $A = \tfrac12\rho S C_{D0}$ and $B = 2kW^2/(\rho S)$.

**Differentiate and solve.** $D'(v) = 2Av - 2B/v^3$. Setting it to zero and multiplying by $v^3/2$ gives $Av^4 = B$, so $v^4 = B/A$:

$$
v_{\mathrm{md}} = \left(\frac{B}{A}\right)^{1/4} = \left(\frac{4 k W^2}{\rho^2 S^2 C_{D0}}\right)^{1/4} = \sqrt{\frac{2W}{\rho S}}\left(\frac{k}{C_{D0}}\right)^{1/4}.
$$

**Classify.** $D'' = 2A + 6B/v^4$ is positive for every $v > 0$, so this is a minimum. And $D$ grows without limit at both ends of $(0, \infty)$, so it is the global minimum.

**A bonus fact.** The condition $Av^4 = B$ is the same as $Av^2 = B/v^2$. So at the minimum-drag speed, parasite drag equals induced drag — a rule every pilot learns.

**Numbers.**

- $k = 1/(\pi \times 0.8 \times 9) = 0.0442$.
- $\sqrt{2W/(\rho S)} = \sqrt{2 \times 588\,399/(1.225 \times 125)} = 87.7\,\mathrm{m/s}$.
- $(k/C_{D0})^{1/4} = (2.21)^{1/4} = 1.219$.

So $v_{\mathrm{md}} = 87.7 \times 1.219 = 106.9\,\mathrm{m/s}$, about $208$ **[[knots|knots]]**. There each drag term is $17.5\,\mathrm{kN}$, for a total of $35.0\,\mathrm{kN}$. The lift-to-drag ratio is $W/D = 588/35.0 = 16.8$.

**Sanity check.** Flying $20\%$ slow raises drag to $38.5\,\mathrm{kN}$; $20\%$ fast, to $37.3\,\mathrm{kN}$. Both are higher, as they must be. The slow side is worse, because induced drag climbs steeply as $1/v^2$.
:::

::: example Least-squares scale factor
An accelerometer sits on a **[[dividing head|dividing-head]]**, which tilts it so gravity gives it five known accelerations $x_i$ (in $\mathrm{m/s^2}$). It reports readings $y_i$:

| $x_i$ | $-9.80665$ | $-4.90333$ | $0$ | $4.90333$ | $9.80665$ |
| --- | --- | --- | --- | --- | --- |
| $y_i$ | $-9.8324$ | $-4.9210$ | $0.0036$ | $4.9285$ | $9.8412$ |

Model the sensor as $y = a x$, where $a$ is its **scale factor**. Choose the $a$ that makes the sum of squared misses as small as possible:

$$
S(a) = \sum_i (y_i - a x_i)^2.
$$

(The $\Sigma$, capital "sigma", means "add up over every $i$". Each $y_i - a x_i$ is a **residual** — how far the reading misses the model.)

**Differentiate.** $S$ is a function of the single variable $a$. Differentiate term by term with the chain rule; the inside $y_i - a x_i$ has derivative $-x_i$:

$$
S'(a) = \sum_i 2(y_i - a x_i)(-x_i) = -2\sum_i x_i y_i + 2a\sum_i x_i^2.
$$

**Solve.** Setting $S'(a) = 0$ gives the **normal equation** $a\sum x_i^2 = \sum x_i y_i$, so

$$
a^* = \frac{\sum_i x_i y_i}{\sum_i x_i^2}.
$$

**Classify.** $S''(a) = 2\sum_i x_i^2 = 481 > 0$, a minimum. $S$ is a quadratic in $a$ that opens upward, so it is the global minimum.

**Numbers.** $\sum x_i y_i = 241.227$ and $\sum x_i^2 = 240.426$, so $a^* = 241.227/240.426 = 1.00333$. The sensor reads $0.333\%$ high, a scale-factor error of $3333$ **[[ppm|ppm]]** that the navigation software will correct.

**Sanity check.** At the best fit the leftover sum is $S(a^*) = 1.44 \times 10^{-4}\,\mathrm{(m/s^2)^2}$. Leaving the scale factor at $1$ would give $2.82 \times 10^{-3}$, about twenty times worse. This one-number fit is the seed of every least-squares problem in GNC. The matrix version replaces $\sum x_i^2$ by $\mathbf{A}^\mathsf{T}\mathbf{A}$ and $\sum x_i y_i$ by $\mathbf{A}^\mathsf{T}\mathbf{y}$.
:::

::: warning A stationary point is only a candidate
Solving $f'(x) = 0$ finds stationary points, not maxima. A common slip is handing in the stationary point as "the answer" without checking whether it is a maximum, a minimum or a saddle — and without checking the endpoints, where the largest value on a closed interval very often sits. In the launch-angle example the endpoints gave zero range, which was easy to rule out. In a real trajectory problem, the optimum often sits right on a limit, such as a maximum allowed angle.
:::

::: warning Zero second derivative decides nothing
The second-derivative test is silent when $f''(c) = 0$. That does not mean "inflection point", and it does not mean "not an extremum": $x^4$ has a perfectly good minimum at a point where the test says nothing. Go back to the sign of $f'$ on either side.
:::

Everything here is for a function of **[[one variable|hessian-bridge]]**. The same ideas return, with more bookkeeping, when a function depends on many numbers at once.

## Check yourself

::: check
State Fermat's theorem precisely. Give one example of a stationary point that is not an extremum, and one example of a global minimum that is not a stationary point.
:::

::: answer
**Fermat's theorem:** if $f$ has a local extremum at an interior point $c$ of its domain and $f'(c)$ exists, then $f'(c) = 0$.

**Stationary but not an extremum:** $f(x) = x^3$ at $x = 0$. There $f'(0) = 0$, but the function is negative a little to the left and positive a little to the right.

**Global minimum but not stationary:** $f(x) = |x|$ at $x = 0$, where there is no derivative at all. Or $f(x) = x$ on $[0, 1]$, whose minimum sits at the endpoint $x = 0$ even though $f'(0) = 1$.
:::

::: check
Find and classify all stationary points of $f(x) = x^3 - 3x^2 + 1$.
:::

::: answer
$f'(x) = 3x^2 - 6x = 3x(x - 2)$, which is zero at $x = 0$ and $x = 2$. The second derivative is $f''(x) = 6x - 6$.

- At $x = 0$: $f''(0) = -6 < 0$, a local maximum, with $f(0) = 1$.
- At $x = 2$: $f''(2) = 6 > 0$, a local minimum, with $f(2) = 8 - 12 + 1 = -3$.

Neither is global: $f \to -\infty$ as $x \to -\infty$ and $f \to +\infty$ as $x \to +\infty$. The inflection point is where $f'' = 0$, at $x = 1$, halfway between them.
:::

::: check
Find the global maximum and minimum of $g(x) = x e^{-x}$ on $[0, 3]$.
:::

::: answer
By the product rule, $g'(x) = e^{-x} - x e^{-x} = e^{-x}(1 - x)$. The exponential is never zero, so $g' = 0$ only at $x = 1$, and $g'$ exists everywhere.

Candidates: $x = 0$, $1$ and $3$. Values:

- $g(0) = 0$,
- $g(1) = e^{-1} = 0.368$,
- $g(3) = 3e^{-3} = 0.149$.

The global maximum is $0.368$ at $x = 1$. The global minimum is $0$ at the endpoint $x = 0$. The endpoint wins the minimum even though $g' = 1 \ne 0$ there.
:::

::: check
Find the largest and smallest values of $f(x) = \dfrac{x}{1 + x^2}$ over all real $x$, and explain why they are global.
:::

::: answer
By the quotient rule,

$$
f'(x) = \frac{(1 + x^2) - x(2x)}{(1 + x^2)^2} = \frac{1 - x^2}{(1 + x^2)^2},
$$

which is zero at $x = \pm 1$. The bottom is always positive, so the sign of $f'$ is the sign of $1 - x^2$: positive for $|x| < 1$ and negative for $|x| > 1$.

So $f$ falls, then rises through $x = -1$ (a local minimum, $f(-1) = -\tfrac12$), and rises, then falls through $x = 1$ (a local maximum, $f(1) = \tfrac12$).

As $x \to \pm\infty$, $f(x) \to 0$, and there are no other stationary points. So nothing can beat these values: they are the global maximum and minimum. The function always stays between $-\tfrac12$ and $\tfrac12$.
:::

::: check
On an elliptical orbit of eccentricity $e$, the **flight-path angle** $\gamma$ ("gamma", the angle of the velocity above the local horizontal) satisfies $\tan\gamma = \dfrac{e\sin\nu}{1 + e\cos\nu}$, where $\nu$ ("nu") is the **true anomaly**, the angle around the orbit from periapsis. At what $\nu$ is $\gamma$ largest, what is the largest value, and where on the orbit is that? Work it out for $e = 0.3$.
:::

::: answer
The arctangent always increases, so the largest $\gamma$ comes from the largest $u(\nu) = \dfrac{e\sin\nu}{1 + e\cos\nu}$.

By the quotient rule, the top of $u'$ is

$$
e\cos\nu\,(1 + e\cos\nu) - e\sin\nu\,(-e\sin\nu) = e\cos\nu + e^2(\cos^2\nu + \sin^2\nu) = e(\cos\nu + e).
$$

It is zero when $\cos\nu = -e$. Before that point it is positive and after it negative, so this is the maximum.

There $\sin\nu = \sqrt{1 - e^2}$, so

$$
\tan\gamma_{\max} = \frac{e\sqrt{1 - e^2}}{1 - e^2} = \frac{e}{\sqrt{1 - e^2}},
$$

which means $\sin\gamma_{\max} = e$. (Draw a right triangle with opposite side $e$ and adjacent side $\sqrt{1 - e^2}$; its long side is $1$.)

The distance from the planet there is $r = \dfrac{a(1 - e^2)}{1 + e\cos\nu} = \dfrac{a(1 - e^2)}{1 - e^2} = a$. That is the end of the minor axis.

For $e = 0.3$: $\nu = \arccos(-0.3) = 107.5^\circ$ and $\gamma_{\max} = \arcsin 0.3 = 17.5^\circ$. Check nearby: at $\nu = 90^\circ$ the angle is $16.7^\circ$, and at $120^\circ$ it is $17.0^\circ$. Both are smaller, as they should be.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Extreme value theorem | $f$ continuous on closed $[a, b]$ attains a global max and min |
| Fermat's theorem | Interior extremum with $f'(c)$ existing $\Rightarrow f'(c) = 0$ |
| Critical points | Stationary points, points with no derivative, endpoints |
| Rolle / mean value theorem | $f(b) - f(a) = f'(\xi)(b - a)$ for some $\xi$ in $(a, b)$ |
| Increasing / decreasing | $f' > 0 \Rightarrow$ increasing; $f' < 0 \Rightarrow$ decreasing; $f' = 0 \Rightarrow$ constant |
| Second-derivative test | $f'(c) = 0$: $f''(c) > 0$ min, $f''(c) < 0$ max, $f''(c) = 0$ inconclusive |
| Convex / concave | $f'' > 0$ bowl, $f'' < 0$ dome; inflection where the bending changes |
| Closed-interval recipe | Evaluate $f$ at every critical point and endpoint; compare |
| Max-Q (exponential air, constant $a$) | $t^* = \sqrt{2H/a}$, at altitude $h^* = H$ |
| Minimum drag | Parasite drag equals induced drag |
| Least-squares slope | $S(a) = \sum(y_i - ax_i)^2$ minimised at $a^* = \sum x_i y_i / \sum x_i^2$ |

The mean value theorem proved here is the tool the next lesson uses to say exactly how far the tangent line $f(x_0) + f'(x_0)(x - x_0)$ can drift from $f(x)$. That drift is the linearisation error that every filter and controller lives with.

::: context extremum-word Words from Latin
**Maximum** is Latin for "greatest" and **minimum** for "least". **Extremum** comes from *extremus*, "outermost" — the furthest a function goes in either direction. The plurals keep the Latin endings: maxima, minima, extrema. Engineers use "optimum" (Latin for "best") for whichever one the problem wants, and **optimization** for the hunt.
:::

::: context fermat-picture Level at the top
Left of the peak the tangent tilts up (positive slope). Right of it, the tangent tilts down (negative slope). The only slope that fits between "up" and "down" is flat.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M20,150 C100,150 120,40 180,40 C240,40 260,150 340,150" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="130" y1="40" x2="230" y2="40" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="85.3" y1="122.1" x2="129.7" y2="67.9" stroke="#f2b880" stroke-width="2.5"/>
  <line x1="230.3" y1="67.9" x2="274.7" y2="122.1" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="107.5" cy="95" r="3.5" fill="#1f2a44"/>
  <circle cx="252.5" cy="95" r="3.5" fill="#1f2a44"/>
  <circle cx="180" cy="40" r="4" fill="#1f2a44"/>
  <text x="180" y="28" font-size="12" fill="#1d6fd1" text-anchor="middle">slope 0 at the top</text>
  <text x="92" y="84" font-size="12" fill="#1f2a44" text-anchor="end">slope &gt; 0</text>
  <text x="268" y="84" font-size="12" fill="#1f2a44">slope &lt; 0</text>
</svg>
```
:::

::: context mvt-picture The secant and its parallel tangent
Join the two ends of a curve with a straight line. Slide a copy of that line sideways, keeping its tilt, until it only touches the curve. Where it touches, the curve's slope equals the secant's slope. That touching point is $\xi$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <path d="M40,150 Q180,-30 320,90" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="150" x2="320" y2="90" stroke="#b4232c" stroke-width="2"/>
  <line x1="60" y1="70.7" x2="300" y2="19.3" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="40" cy="150" r="4" fill="#1f2a44"/>
  <circle cx="320" cy="90" r="4" fill="#1f2a44"/>
  <circle cx="180" cy="45" r="4" fill="#1d6fd1"/>
  <text x="40" y="170" font-size="12" fill="#1f2a44" text-anchor="middle">a</text>
  <text x="320" y="110" font-size="12" fill="#1f2a44" text-anchor="middle">b</text>
  <text x="200" y="140" font-size="12" fill="#b4232c">secant</text>
  <text x="180" y="66" font-size="12" fill="#1d6fd1" text-anchor="middle">tangent at ξ</text>
</svg>
```
:::

::: context convex-landing Why engineers love a bowl
Picture a marble dropped into a smooth bowl. Wherever it starts, it rolls to the same single lowest point. That is a convex problem. Now picture a bumpy egg carton: the marble can settle in a dip that is not the lowest one. That is what can go wrong with a general problem.

Landing a rocket on its legs means choosing a thrust profile that uses the least fuel. Written directly, that problem is not convex. Researchers found ways to rewrite it as a convex one, which a flight computer can solve reliably in a fraction of a second. SpaceX engineers have said publicly that Falcon 9's landings rely on convex optimization of this kind.
:::

::: context max-q Max-Q on a real launch
"Max-Q" is short for maximum dynamic pressure; engineers write dynamic pressure as $q$. It is the moment the air is squeezing the rocket hardest. Many rockets throttle their engines down as they pass through it, to keep the loads within what the structure was built for, then throttle back up once the air thins. Falcon 9 does this, and launch commentators call out max-Q about a minute after lift-off.
:::

::: context scale-height What a scale height is
Air gets thinner as you go up. In the simplest model, every time you climb one **scale height** $H$, the density drops by a factor of $e \approx 2.718$. With $H = 7.5\,\mathrm{km}$, the air at $7.5\,\mathrm{km}$ is about $37\%$ as dense as at sea level, and at $15\,\mathrm{km}$ about $14\%$.

Here is $q(t)$ from the example, for $a = 15\,\mathrm{m/s^2}$. It rises as speed builds, peaks at $31.6\,\mathrm{s}$, then falls as the air runs out.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="160" x2="345" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="160" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="50.0,160.0 57.2,158.6 64.5,154.5 71.8,147.8 79.0,138.9 86.2,128.3 93.5,116.3 100.8,103.5 108.0,90.5 115.2,77.8 122.5,65.9 129.8,55.4 137.0,46.4 144.2,39.4 151.5,34.4 158.8,31.6 166.0,31.0 173.2,32.4 180.5,35.6 187.8,40.5 195.0,46.7 202.2,54.0 209.5,62.0 216.8,70.5 224.0,79.3 231.2,88.0 238.5,96.5 245.8,104.6 253.0,112.2 260.2,119.2 267.5,125.5 274.8,131.1 282.0,136.1 289.2,140.4 296.5,144.1 303.8,147.2 311.0,149.8 318.2,152.0 325.5,153.7 332.8,155.1 340.0,156.3" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="164.6" y1="31" x2="164.6" y2="160" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="164.6" cy="31" r="4" fill="#b4232c"/>
  <text x="172" y="24" font-size="12" fill="#b4232c">max-Q: 50.7 kPa at 31.6 s</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="175">0</text><text x="122.5" y="175">20</text><text x="195" y="175">40</text><text x="267.5" y="175">60</text><text x="340" y="175">80</text>
  </g>
  <text x="300" y="140" font-size="11" fill="#1f2a44">t (s)</text>
  <text x="44" y="36" font-size="11" fill="#1f2a44" text-anchor="end">50</text>
  <text x="44" y="164" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="56" y="14" font-size="11" fill="#1f2a44">q (kPa)</text>
  <line x1="46" y1="32.7" x2="50" y2="32.7" stroke="#1f2a44" stroke-width="1.5"/>
</svg>
```
:::

::: context induced-drag The price of lift
A wing makes lift by pushing air down. That downward-moving air leaves swirling vortices behind the wingtips, and dragging those swirls along costs energy — that cost is **induced drag**. At low speed the wing must tilt more steeply to make the same lift, so the swirls are stronger and induced drag is larger. Long, slender wings (high aspect ratio, like a glider's) make weaker swirls, which is why $A\!R$ sits on the bottom of $k$.
:::

::: context knots Knots
A **knot** is one nautical mile per hour. A nautical mile is exactly $1852\,\mathrm{m}$, so one knot is $1852/3600 = 0.5144\,\mathrm{m/s}$. Aviation and sailing still use knots because a nautical mile was originally tied to one minute of latitude, which makes chart work easy. $106.9\,\mathrm{m/s} \div 0.5144 \approx 208$ knots.
:::

::: context dividing-head Tilting a sensor to calibrate it
An accelerometer sitting still feels gravity, $g_0 = 9.80665\,\mathrm{m/s^2}$, along whatever direction is "down". Tilt its sensing axis to an angle $\theta$ above the horizontal and it should read $g_0\sin\theta$. A **dividing head** is a precise rotating fixture that sets those angles. Tilts of $-90^\circ$, $-30^\circ$, $0^\circ$, $30^\circ$ and $90^\circ$ give exactly the five inputs in the table: $\pm 9.80665$, $\pm 4.90333$ and $0$. Gravity becomes a free, accurately known test signal.
:::

::: context ppm Parts per million
**Parts per million** (ppm) is a way to write tiny fractions: $1\,\mathrm{ppm}$ is $1/1\,000\,000$, or $0.0001\%$. A scale factor of $1.00333$ is off by $0.00333$, which is $3333$ parts in a million. Navigation-grade accelerometers hold their scale factor to around $100\,\mathrm{ppm}$ or better, so an error this size must be calibrated out before flight.
:::

::: context hessian-bridge Many variables: gradient and Hessian
Most real optimization problems have many knobs, not one. The stationary condition becomes "every partial derivative is zero" — the **gradient** is zero. The second-derivative test becomes a question about a matrix of second derivatives, the **Hessian**: if all its eigenvalues are positive, the point is a minimum. The one-variable case is the template: slope zero and curving upward means a minimum. The multivariable calculus module makes this precise, and the optimization module builds the algorithms.
:::
