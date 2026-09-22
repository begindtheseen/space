---
id: l03-differentiation-rules
title: The product, quotient and chain rules
minutes: 25
covers:
  - the derivative: definition, chain, product and quotient rules
---

The functions that matter on a vehicle are never a bare $\sin x$ or $e^x$. Aerodynamic drag is $\tfrac12 \rho v^2 C_D A$, a product of a density that depends on altitude, which depends on time, and a speed that depends on time too. Thrust acceleration is thrust divided by a mass that shrinks as propellant burns. A star tracker's measurement is a function of the attitude quaternion, which is a function of the body rates integrated over time. Differentiating such things from the limit definition is possible but absurd. What you need is a small set of rules that decompose any expression into the atoms of the previous lesson and reassemble the derivatives.

There are three: the product rule, the quotient rule and the chain rule. The chain rule is the one that runs the deepest. When a Kalman filter linearises a measurement model, it is differentiating a composition — a sensor model applied to a frame transformation applied to the state — and the Jacobian it builds is the chain rule written with matrices. Learn the scalar version so thoroughly here that the matrix version later feels like notation rather than a new idea.

Each rule below is proved, not asserted, because each proof is short and shows exactly which assumption does the work. After the three rules, the lesson extends the table of derivatives to tangent and secant, to exponentials of any base, to powers with any real exponent, and to inverse functions.

## The product rule

Let $u(x)$ and $v(x)$ be differentiable. The claim is

$$
(uv)' = u'v + uv' .
$$

Intuition first. A rectangle with sides $u$ and $v$ has area $uv$. Increase $x$ by a small $h$; the sides grow by $\Delta u$ and $\Delta v$. The area grows by two thin strips, $\Delta u \cdot v$ and $u \cdot \Delta v$, plus a tiny corner square $\Delta u\,\Delta v$. Dividing by $h$ and letting $h \to 0$, the strips give $u'v$ and $uv'$ and the corner vanishes because it is a product of two small quantities divided by only one $h$.

The proof makes the strips explicit by adding and subtracting $u(x + h)v(x)$ inside the difference quotient:

$$
\frac{u(x + h)v(x + h) - u(x)v(x)}{h}
= u(x + h)\,\frac{v(x + h) - v(x)}{h} + v(x)\,\frac{u(x + h) - u(x)}{h}.
$$

As $h \to 0$ the two difference quotients go to $v'(x)$ and $u'(x)$. The factor $u(x + h)$ goes to $u(x)$ because a differentiable function is continuous — this is where the previous lesson's "differentiable implies continuous" is used. The limit is $u v' + v u'$.

The rule extends to three factors by applying it twice: $(uvw)' = u'vw + uv'w + uvw'$. Each term differentiates one factor and leaves the rest alone.

::: example How fast drag is changing
A vehicle at $600\,\mathrm{m/s}$ is accelerating at $20\,\mathrm{m/s^2}$ through air of density $0.40\,\mathrm{kg/m^3}$, and because it is climbing the density it sees is falling at $0.020\,\mathrm{kg/m^3}$ per second. Its reference area is $A = \pi(1.83\,\mathrm{m})^2 = 10.52\,\mathrm{m^2}$ (a $3.66\,\mathrm{m}$ diameter body) and $C_D = 0.30$. What is the drag, and how fast is it changing?

Drag is $D = \tfrac12 C_D A\,\rho v^2$. The constant $\tfrac12 C_D A = 1.578\,\mathrm{m^2}$. So $D = 1.578 \times 0.40 \times 600^2 = 2.27 \times 10^5\,\mathrm{N}$, about $227\,\mathrm{kN}$.

Differentiate the product $\rho \cdot v^2$ with respect to time. The power rule and (anticipating the chain rule) $\dfrac{d}{dt}v^2 = 2v\dot v$ give

$$
\dot D = \tfrac12 C_D A\,\big(\dot\rho\,v^2 + \rho\cdot 2v\dot v\big)
= 1.578\,\big[(-0.020)(600^2) + (0.40)(2)(600)(20)\big] .
$$

The two terms are $1.578 \times (-7200) = -1.14 \times 10^4$ and $1.578 \times 9600 = +1.51 \times 10^4$, so $\dot D \approx +3.8 \times 10^3\,\mathrm{N/s}$. The thinning air is pulling drag down at $11.4\,\mathrm{kN/s}$ and the rising speed is pushing it up at $15.1\,\mathrm{kN/s}$; the speed wins for now, and drag is still growing at $3.8\,\mathrm{kN/s}$. Later in the ascent the density term dominates and drag falls off — the peak is "max Q" in launch commentary.
:::

## The chain rule

Suppose $y$ depends on $u$ and $u$ depends on $x$: $y = f(u)$, $u = g(x)$, so $y = f(g(x))$. The chain rule says the rates multiply:

$$
\frac{d}{dx} f(g(x)) = f'(g(x))\,g'(x), \qquad\text{or in Leibniz form}\qquad \frac{dy}{dx} = \frac{dy}{du}\cdot\frac{du}{dx}.
$$

The intuition is dimensional. If altitude changes at $300\,\mathrm{m}$ per second and density changes at $-4.4 \times 10^{-5}\,\mathrm{kg/m^3}$ per metre of altitude, then density changes at $300 \times (-4.4 \times 10^{-5}) = -0.013\,\mathrm{kg/m^3}$ per second. Metres cancel. The Leibniz form makes this look like a cancellation of fractions, which is a good mnemonic though not a proof, since $du$ is not a number.

Here is the argument. Write $\Delta u = g(x + h) - g(x)$, the change in the inner function. Then the change in $y$ is $f(u + \Delta u) - f(u)$, and for $\Delta u \neq 0$,

$$
\frac{f(g(x + h)) - f(g(x))}{h} = \frac{f(u + \Delta u) - f(u)}{\Delta u}\cdot\frac{\Delta u}{h}.
$$

As $h \to 0$, $\Delta u \to 0$ because $g$ is continuous, so the first factor tends to $f'(u) = f'(g(x))$ and the second to $g'(x)$. The one gap is that $\Delta u$ might be exactly zero for some small $h$, making the first fraction undefined; the standard repair is to define the first factor to be $f'(u)$ whenever $\Delta u = 0$, which keeps the identity true and the limit unchanged. The conclusion stands for every differentiable $f$ and $g$.

In practice you apply the chain rule by naming the "inside" and the "outside". Differentiate the outside, evaluated at the inside, then multiply by the derivative of the inside:

- $\dfrac{d}{dt} e^{kt}$: outside $e^u$, inside $u = kt$. Result $e^{kt}\cdot k = k e^{kt}$.
- $\dfrac{d}{dt}\sin(\omega t + \phi)$: result $\cos(\omega t + \phi)\cdot\omega$. The frequency comes out as a factor, which is why a fast oscillation has a large rate even at small amplitude.
- $\dfrac{d}{dx}(1 + x^2)^{-1/2}$: outside $u^{-1/2}$, inside $1 + x^2$. Result $-\tfrac12(1 + x^2)^{-3/2}\cdot 2x = -x(1 + x^2)^{-3/2}$.
- $\dfrac{d}{dx}\ln(\cos x)$: result $\dfrac{1}{\cos x}\cdot(-\sin x) = -\tan x$.

Chains can be longer. For $y = \sin\!\big(e^{3x}\big)$: outermost $\sin$, then $e^u$, then $3x$. The derivative is $\cos(e^{3x})\cdot e^{3x}\cdot 3$. Work from the outside in, and multiply every layer's derivative.

::: example Density seen by a climbing vehicle
Atmospheric density near sea level is modelled well by $\rho(h) = \rho_0 e^{-h/H}$ with $\rho_0 = 1.225\,\mathrm{kg/m^3}$ and scale height $H = 8500\,\mathrm{m}$. A vehicle at $h = 10\,\mathrm{km}$ is climbing at $\dot h = 300\,\mathrm{m/s}$. How fast is the density around it falling?

The density is a function of altitude, and altitude is a function of time, so $\rho(h(t))$ is a composition. The chain rule:

$$
\frac{d\rho}{dt} = \frac{d\rho}{dh}\cdot\frac{dh}{dt} = \left(-\frac{\rho_0}{H} e^{-h/H}\right)\dot h .
$$

At $h = 10\,000\,\mathrm{m}$, $e^{-h/H} = e^{-1.176} = 0.3084$, so $\rho = 0.378\,\mathrm{kg/m^3}$ and $\dfrac{d\rho}{dh} = -\dfrac{1.225}{8500}\times 0.3084 = -4.44 \times 10^{-5}\,\mathrm{kg/m^3}$ per metre. Multiply by $300\,\mathrm{m/s}$: $\dot\rho = -0.0133\,\mathrm{kg/m^3}$ per second. In about $28$ seconds at this climb rate the vehicle would see the density halve (if the rate held), which is why drag drops so quickly after max Q.
:::

::: key
Chain rule: $\dfrac{d}{dx} f(g(x)) = f'(g(x))\cdot g'(x)$. Differentiate the outer function at the inner one, then multiply by the derivative of the inner one. Every EKF Jacobian is an application of this rule to a composition of frame transforms and sensor models: the sensitivity of a measurement to the state is the sensitivity of the sensor to its input times the sensitivity of that input to the state.
:::

## The quotient rule

For $v(x) \neq 0$,

$$
\left(\frac{u}{v}\right)' = \frac{u'v - uv'}{v^2}.
$$

It follows from the two rules already proved. Write $u/v = u \cdot v^{-1}$. By the chain rule with outside $w^{-1}$ and inside $v$, $\dfrac{d}{dx}v^{-1} = -v^{-2}\,v'$. Then by the product rule,

$$
\left(u v^{-1}\right)' = u' v^{-1} + u\,(-v^{-2}v') = \frac{u'}{v} - \frac{uv'}{v^2} = \frac{u'v - uv'}{v^2}.
$$

The order in the numerator matters — it is the derivative of the *top* times the bottom, minus the top times the derivative of the *bottom*. A reliable check: if $u = v$, the quotient is $1$ and the formula gives $(u'u - uu')/u^2 = 0$, as it must.

::: example Thrust acceleration during a burn
A first stage produces a steady thrust $T = 7.6\,\mathrm{MN}$ and burns propellant at $\dot m_p = 2500\,\mathrm{kg/s}$, so its mass is $m(t) = m_0 - \dot m_p t$ with $m_0 = 549\,000\,\mathrm{kg}$. How fast is the thrust acceleration $a = T/m$ increasing at liftoff?

The quotient rule with $u = T$ (constant, $u' = 0$) and $v = m(t)$, $v' = \dot m = -\dot m_p$:

$$
\frac{da}{dt} = \frac{0 \cdot m - T\,\dot m}{m^2} = \frac{T\,\dot m_p}{m^2}.
$$

At $t = 0$: $a = 7.6 \times 10^6 / 5.49 \times 10^5 = 13.84\,\mathrm{m/s^2}$, and $\dfrac{da}{dt} = \dfrac{(7.6 \times 10^6)(2500)}{(5.49 \times 10^5)^2} = 0.0630\,\mathrm{m/s^3}$. Ten seconds into the flight the thrust acceleration has risen by about $0.63\,\mathrm{m/s^2}$. The rate itself grows as $m$ falls — it is proportional to $1/m^2$ — and by the end of a $162\,\mathrm{s}$ burn the mass is $144\,000\,\mathrm{kg}$ and $a$ has reached $52.8\,\mathrm{m/s^2}$, over $5\,g$, which is why engines are throttled down before staging.
:::

::: key
Product rule: $(uv)' = u'v + uv'$. Quotient rule: $\left(\dfrac{u}{v}\right)' = \dfrac{u'v - uv'}{v^2}$. The quotient rule is the product rule applied to $u \cdot v^{-1}$ with the chain rule supplying $\dfrac{d}{dx}v^{-1} = -v^{-2}v'$.
:::

## Extending the table

With the three rules, every remaining elementary derivative is a few lines.

**Tangent and secant.** $\tan x = \sin x / \cos x$, so by the quotient rule

$$
\frac{d}{dx}\tan x = \frac{\cos x \cos x - \sin x(-\sin x)}{\cos^2 x} = \frac{\cos^2 x + \sin^2 x}{\cos^2 x} = \frac{1}{\cos^2 x} = \sec^2 x .
$$

Similarly $\dfrac{d}{dx}\sec x = \dfrac{d}{dx}(\cos x)^{-1} = -(\cos x)^{-2}(-\sin x) = \sec x \tan x$, and $\dfrac{d}{dx}\cot x = -\csc^2 x$, $\dfrac{d}{dx}\csc x = -\csc x \cot x$.

**Exponentials of any base.** Since $b = e^{\ln b}$, $b^x = e^{x \ln b}$, a composition with inside $x \ln b$. The chain rule gives $\dfrac{d}{dx}b^x = e^{x\ln b}\cdot\ln b = b^x \ln b$. This confirms the numerical constants of the previous lesson: $\ln 2 = 0.693$ for base $2$, $\ln 3 = 1.099$ for base $3$. At $x = 3$, $\dfrac{d}{dx}2^x = 8 \ln 2 = 5.55$.

**Powers with any real exponent.** For $x > 0$ and any real $n$, $x^n = e^{n \ln x}$, so $\dfrac{d}{dx}x^n = e^{n\ln x}\cdot\dfrac{n}{x} = x^n \cdot \dfrac{n}{x} = n x^{n-1}$. The power rule, proved in the last lesson only for positive integers, holds for every real exponent. In particular $\dfrac{d}{dx}\sqrt{x} = \dfrac{d}{dx}x^{1/2} = \tfrac12 x^{-1/2} = \dfrac{1}{2\sqrt{x}}$, and $\dfrac{d}{dr}r^{-2} = -2r^{-3}$, which is how the gravitational acceleration $\mu/r^2$ changes with radius.

**Logarithms of any base.** $\log_b x = \dfrac{\ln x}{\ln b}$, so $\dfrac{d}{dx}\log_b x = \dfrac{1}{x \ln b}$.

**The derivative of an inverse function.** If $y = f^{-1}(x)$, then $f(y) = x$. Differentiate both sides with respect to $x$, using the chain rule on the left: $f'(y)\,\dfrac{dy}{dx} = 1$, so

$$
\frac{d}{dx}f^{-1}(x) = \frac{1}{f'(f^{-1}(x))}.
$$

The slope of the inverse is the reciprocal of the slope of the original, evaluated at the matching point — a reflection across the line $y = x$ turns a slope $s$ into $1/s$. Applied to $y = \ln x$, the inverse of $e^y$: $e^y\,y' = 1$, so $y' = 1/e^y = 1/x$, a second route to the logarithm's derivative. The next lesson uses this same move to differentiate $\arcsin$, $\arccos$ and $\arctan$.

## Logarithmic differentiation

When an expression is a product of many factors or has a variable in both base and exponent, take logarithms first. The logarithm turns products into sums and powers into multiples, and the chain rule turns $\dfrac{d}{dx}\ln y$ into $\dfrac{y'}{y}$.

::: example Differentiating $x^x$
Find $\dfrac{d}{dx}x^x$ for $x > 0$ and evaluate it at $x = 2$.

Neither the power rule (exponent must be constant) nor the exponential rule (base must be constant) applies. Set $y = x^x$ and take logarithms: $\ln y = x \ln x$. Differentiate both sides with respect to $x$, using the chain rule on the left and the product rule on the right:

$$
\frac{y'}{y} = 1 \cdot \ln x + x \cdot \frac{1}{x} = \ln x + 1 .
$$

So $y' = x^x(\ln x + 1)$. At $x = 2$: $4(\ln 2 + 1) = 4 \times 1.693 = 6.77$.

The same technique handles $y = \dfrac{(x^2 + 1)^3 \sqrt{x}}{e^{2x}}$: $\ln y = 3\ln(x^2 + 1) + \tfrac12 \ln x - 2x$, so $\dfrac{y'}{y} = \dfrac{6x}{x^2 + 1} + \dfrac{1}{2x} - 2$ and $y'$ is that times $y$. The alternative — quotient rule over product rule over chain rule — gives the same answer with three times the algebra and three times the chances to drop a sign.
:::

## A procedure for differentiating anything

Faced with an expression, identify its outermost structure and apply the matching rule, then recurse into the pieces.

1. Is it a sum? Differentiate each term (linearity).
2. Is it a product or quotient of two pieces? Product or quotient rule, then differentiate each piece.
3. Is it a function of something other than the bare variable? Chain rule: outer derivative at the inner expression, times the inner derivative.
4. Is it an atom — a power, $\sin$, $\cos$, $e^x$, $\ln x$? Read it off the table.

Take $f(t) = t^2 e^{-t/\tau}\cos(\omega t)$, a decaying oscillation with a polynomial envelope — the kind of response a lightly damped structure produces after a thruster pulse. It is a product of three factors. Differentiating one factor at a time,

$$
f'(t) = 2t\,e^{-t/\tau}\cos(\omega t) + t^2\left(-\frac{1}{\tau}\right)e^{-t/\tau}\cos(\omega t) + t^2 e^{-t/\tau}\big(-\omega\sin(\omega t)\big),
$$

and the chain rule supplied the $-1/\tau$ and the $-\omega$. Factor the common $t\,e^{-t/\tau}$ if you like; the mechanical part is done.

::: warning
The most common chain-rule error is forgetting the inner derivative: writing $\dfrac{d}{dt}\sin(\omega t) = \cos(\omega t)$ instead of $\omega\cos(\omega t)$. Check with units. If $t$ is in seconds and $\omega$ in radians per second, the derivative of a dimensionless $\sin(\omega t)$ must have units of $1/\mathrm{s}$, and only the version with $\omega$ does. The second most common error is applying the power rule to $b^x$ or the exponential rule to $x^n$; the variable must be in the base for the power rule and in the exponent for the exponential rule, and if it is in both, take logarithms.
:::

::: warning
$\dfrac{d}{dx}\big(f(x)g(x)\big)$ is not $f'(x)g'(x)$. A quick refutation: $x \cdot x = x^2$ has derivative $2x$, but $1 \cdot 1 = 1$. Likewise $\dfrac{d}{dx}\dfrac{f}{g} \neq \dfrac{f'}{g'}$. If either "rule" feels natural under time pressure, remember the rectangle: the area grows by two strips, not by the product of the two side increments.
:::

## Check yourself

::: check
Differentiate $y = (3x^2 - 5)^4$ with respect to $x$, and $p(t) = m(t)v(t)$ with respect to $t$, leaving the second in terms of $\dot m$ and $\dot v$.
:::

::: answer
Chain rule, outside $u^4$ and inside $3x^2 - 5$: $y' = 4(3x^2 - 5)^3 \cdot 6x = 24x(3x^2 - 5)^3$. Product rule: $\dot p = \dot m v + m\dot v$. This second expression is the time derivative of momentum for a body whose mass changes, and the rocket-equation lesson explains why applying it naively to a rocket gives a wrong equation of motion.
:::

::: check
Find $\dfrac{d}{dx}\dfrac{x}{1 + x^2}$ and simplify. Where is the derivative zero?
:::

::: answer
Quotient rule with $u = x$, $v = 1 + x^2$: $\dfrac{1\cdot(1 + x^2) - x \cdot 2x}{(1 + x^2)^2} = \dfrac{1 - x^2}{(1 + x^2)^2}$. The derivative vanishes at $x = \pm 1$. At $x = 0$ the derivative is $1$, so the tangent line at the origin is $y = x$.
:::

::: check
A spring-mounted sensor oscillates with displacement $x(t) = A e^{-t/\tau}\sin(\omega t)$. Find its velocity $\dot x(t)$, and state the velocity at $t = 0$.
:::

::: answer
Product of $A e^{-t/\tau}$ and $\sin(\omega t)$, each differentiated by the chain rule: $\dot x = A\left(-\dfrac{1}{\tau}\right)e^{-t/\tau}\sin(\omega t) + A e^{-t/\tau}\,\omega\cos(\omega t) = A e^{-t/\tau}\left(\omega\cos\omega t - \dfrac{1}{\tau}\sin\omega t\right)$. At $t = 0$: $\dot x(0) = A\omega$. The sensor starts at rest position with velocity $A\omega$ — the initial kick that set it oscillating.
:::

::: check
Use the inverse-function rule to find the derivative of $y = \sqrt[3]{x}$ at $x = 8$, and check it with the power rule.
:::

::: answer
$y^3 = x$. Differentiating both sides, $3y^2\,y' = 1$, so $y' = \dfrac{1}{3y^2}$. At $x = 8$, $y = 2$ and $y' = \dfrac{1}{12}$. Power rule: $\dfrac{d}{dx}x^{1/3} = \tfrac13 x^{-2/3}$, and at $x = 8$, $x^{-2/3} = 1/4$, giving $\dfrac{1}{12}$. Same answer.
:::

::: check
Explain in one or two sentences why the sensitivity of a range measurement to a spacecraft's position state, when the range is computed from a position that has first been rotated from an inertial frame into a ground-station frame, is a chain-rule quantity.
:::

::: answer
The measurement is a composition: range is a function of the station-frame position, and the station-frame position is a function (a rotation) of the inertial-frame state. The chain rule says the derivative of the composition is the derivative of the outer function (range with respect to station-frame position) multiplied by the derivative of the inner one (station-frame position with respect to inertial state). With vectors these derivatives are matrices and the multiplication is a matrix product, but the rule is the same one used for $\sin(\omega t)$.
:::

## Summary

| Rule | Statement |
| --- | --- |
| Product | $(uv)' = u'v + uv'$ |
| Quotient | $(u/v)' = (u'v - uv')/v^2$ |
| Chain | $\frac{d}{dx}f(g(x)) = f'(g(x))\,g'(x)$; $\frac{dy}{dx} = \frac{dy}{du}\frac{du}{dx}$ |
| Inverse function | $\frac{d}{dx}f^{-1}(x) = 1/f'(f^{-1}(x))$ |
| Tangent, secant | $\frac{d}{dx}\tan x = \sec^2 x$, $\frac{d}{dx}\sec x = \sec x\tan x$ |
| Any base | $\frac{d}{dx}b^x = b^x\ln b$, $\frac{d}{dx}\log_b x = 1/(x\ln b)$ |
| Any exponent | $\frac{d}{dx}x^n = nx^{n-1}$ for all real $n$, $x > 0$ |
| Logarithmic differentiation | $\frac{y'}{y} = \frac{d}{dx}\ln y$; use for $x^x$ and long products |

The inverse-function rule was really a special case of a bigger idea: when $x$ and $y$ are tied together by an equation that cannot be solved for $y$, you can still differentiate the equation. That is implicit differentiation, the subject of the next lesson, and it is also how rates of related quantities — range and range rate, angle and angular rate — are connected in tracking problems.
