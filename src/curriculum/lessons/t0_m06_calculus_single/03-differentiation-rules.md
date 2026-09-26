---
id: l03-differentiation-rules
title: The product, quotient and chain rules
minutes: 22
covers:
  - the derivative: definition, chain, product and quotient rules
---

A recipe can call for flour, sugar and eggs on their own. But most dishes are *combinations*: dough made from flour and eggs, cake made from dough and sugar. Knowing how each ingredient behaves alone is not enough; you also need to know how they behave together.

Derivatives are the same. The last lesson found the derivatives of the basic ingredients — powers, $\sin$, $\cos$, $e^x$, $\ln x$. But the functions that matter on a vehicle are never a bare $\sin x$ or $e^x$. **[[Aerodynamic drag|drag-terms]]** is $\tfrac12 \rho v^2 C_D A$: a product of air density, which depends on altitude, which depends on time, and speed, which depends on time too. Thrust acceleration is thrust divided by a mass that shrinks as propellant burns. A star tracker's measurement depends on the vehicle's attitude, which depends on its turning rates added up over time. Differentiating these from the limit definition is possible but absurd. What you need is a small set of rules that break any expression into the basic ingredients and put their derivatives back together.

There are three: the **product rule**, the **quotient rule** and the **chain rule**. The chain rule runs deepest. When a navigation filter builds its **[[Jacobian|jacobian]]**, it is differentiating a function inside a function inside a function — a sensor model applied to a change of viewpoint applied to the vehicle's state — and that is the chain rule written with matrices. Learn the one-variable version so well here that the matrix version later feels like new notation, not a new idea.

Each rule below is proved, not merely stated, because each proof is short and shows exactly which fact does the work. After the three rules, the lesson extends the table of derivatives to tangent and secant, to exponentials of any base, to any power at all, and to inverse functions.

## The product rule

Let $u(x)$ and $v(x)$ be two functions with derivatives. The claim is

$$
(uv)' = u'v + uv' .
$$

In words: differentiate the first and keep the second, plus keep the first and differentiate the second.

Here is the picture. A **[[rectangle|product-rectangle]]** with sides $u$ and $v$ has area $uv$. Nudge $x$ up by a small step $h$. The sides grow by small amounts $\Delta u$ and $\Delta v$. The area grows by two thin strips, $\Delta u \cdot v$ along one side and $u \cdot \Delta v$ along the other, plus a tiny corner square $\Delta u\,\Delta v$. Divide by $h$ and let $h \to 0$. The strips give $u'v$ and $uv'$. The corner vanishes: it is two small things multiplied together, divided by only one small $h$.

::: note Why it has to be true
The proof makes the strips visible. Inside the difference quotient, add and subtract the same quantity, $u(x + h)v(x)$. That changes nothing, but it lets the fraction split in two:

$$
\frac{u(x + h)v(x + h) - u(x)v(x)}{h}
= u(x + h)\,\frac{v(x + h) - v(x)}{h} + v(x)\,\frac{u(x + h) - u(x)}{h}.
$$

As $h \to 0$ the two difference quotients go to $v'(x)$ and $u'(x)$. The factor $u(x + h)$ goes to $u(x)$, because a function with a derivative is continuous — the fact from the last lesson, used right here. The limit is $u v' + v u'$.
:::

The rule stretches to three factors by using it twice:

$$
(uvw)' = u'vw + uv'w + uvw' .
$$

Each term differentiates one factor and leaves the rest alone.

::: example How fast drag is changing
A rocket at $600\,\mathrm{m/s}$ is speeding up at $20\,\mathrm{m/s^2}$ through air of density $0.40\,\mathrm{kg/m^3}$. Because it is climbing, the density around it is falling at $0.020\,\mathrm{kg/m^3}$ per second. Its body is $3.66\,\mathrm{m}$ across, so its reference area is $A = \pi(1.83\,\mathrm{m})^2 = 10.52\,\mathrm{m^2}$, and its drag coefficient is $C_D = 0.30$. What is the drag, and how fast is it changing?

Drag is $D = \tfrac12 C_D A\,\rho v^2$. The constant part is $\tfrac12 C_D A = \tfrac12 \times 0.30 \times 10.52 = 1.578\,\mathrm{m^2}$. So

$$
D = 1.578 \times 0.40 \times 600^2 = 2.27 \times 10^5\,\mathrm{N},
$$

about $227\,\mathrm{kN}$.

Now differentiate the product $\rho \cdot v^2$ with respect to time, using the product rule. For $v^2$ we need $\dfrac{d}{dt}v^2 = 2v\dot v$ — the power rule plus the chain rule, which comes next:

$$
\dot D = \tfrac12 C_D A\,\big(\dot\rho\,v^2 + \rho\cdot 2v\dot v\big)
= 1.578\,\big[(-0.020)(600^2) + (0.40)(2)(600)(20)\big] .
$$

Work the two terms separately. The first is $1.578 \times (-7200) = -1.14 \times 10^4\,\mathrm{N/s}$. The second is $1.578 \times 9600 = +1.51 \times 10^4\,\mathrm{N/s}$. Add them: $\dot D \approx +3.8 \times 10^3\,\mathrm{N/s}$.

So the thinning air is pulling drag down by $11.4\,\mathrm{kN}$ each second, and the rising speed is pushing it up by $15.1\,\mathrm{kN}$ each second. Speed wins for now, and drag is still growing at $3.8\,\mathrm{kN/s}$. Later in the climb the density term wins and drag falls away. The peak in between is what launch commentators call **[[max Q|max-q]]**.
:::

## The chain rule

Suppose $y$ depends on $u$, and $u$ depends on $x$. Write $y = f(u)$ and $u = g(x)$, so $y = f(g(x))$ — a function inside a function, called a **composition**. The chain rule says the rates multiply:

$$
\frac{d}{dx} f(g(x)) = f'(g(x))\,g'(x), \qquad\text{or in Leibniz form}\qquad \frac{dy}{dx} = \frac{dy}{du}\cdot\frac{du}{dx}.
$$

Think of gears. If gear A turns $3$ times for every turn of gear B, and gear B turns $2$ times for every turn of gear C, then A turns $3 \times 2 = 6$ times for every turn of C. Rates of change pass along a **[[chain|rate-chain]]** the same way.

Now with units. Say altitude grows by $300\,\mathrm{m}$ each second, and air density changes by $-4.4 \times 10^{-5}\,\mathrm{kg/m^3}$ for every meter you climb. Then density changes by $300 \times (-4.4 \times 10^{-5}) = -0.013\,\mathrm{kg/m^3}$ each second. The meters cancel. The Leibniz form makes this look like canceling fractions, $du$ over $du$. That is a good memory aid, though not a proof, because $du$ is not a number.

::: note Why it has to be true
Call the change in the inside function $\Delta u = g(x + h) - g(x)$. Then the change in $y$ is $f(u + \Delta u) - f(u)$. As long as $\Delta u \neq 0$, multiply and divide by $\Delta u$:

$$
\frac{f(g(x + h)) - f(g(x))}{h} = \frac{f(u + \Delta u) - f(u)}{\Delta u}\cdot\frac{\Delta u}{h}.
$$

As $h \to 0$, $\Delta u \to 0$ too, because $g$ is continuous. So the first factor tends to $f'(u) = f'(g(x))$, and the second to $g'(x)$.

One gap remains: $\Delta u$ might be exactly zero for some small $h$, and then the first fraction is undefined. The standard repair is to *define* the first factor to be $f'(u)$ whenever $\Delta u = 0$. The equation above stays true (both sides are then zero), and the limit is unchanged. So the rule holds for every pair of functions with derivatives.
:::

In practice, name the **inside** and the **outside**. Differentiate the outside, keeping the inside untouched in it, then multiply by the derivative of the inside:

- $\dfrac{d}{dt} e^{kt}$: outside $e^u$, inside $u = kt$. Result: $e^{kt}\cdot k = k e^{kt}$.
- $\dfrac{d}{dt}\sin(\omega t + \phi)$: outside $\sin$, inside $\omega t + \phi$. Result: $\cos(\omega t + \phi)\cdot\omega$. The frequency $\omega$ comes out in front, which is why a fast oscillation changes quickly even when it is small.
- $\dfrac{d}{dx}(1 + x^2)^{-1/2}$: outside $u^{-1/2}$, inside $1 + x^2$. Result: $-\tfrac12(1 + x^2)^{-3/2}\cdot 2x = -x(1 + x^2)^{-3/2}$.
- $\dfrac{d}{dx}\ln(\cos x)$: outside $\ln$, inside $\cos x$. Result: $\dfrac{1}{\cos x}\cdot(-\sin x) = -\tan x$.

Chains can be longer. Take $y = \sin\!\big(e^{3x}\big)$. Peel it like an onion: $\sin$ on the outside, then $e^u$, then $3x$ in the middle. The derivative is $\cos(e^{3x})\cdot e^{3x}\cdot 3$. Work from the outside in, and multiply every layer's derivative.

::: example Density seen by a climbing vehicle
Near the ground, air density is modeled well by $\rho(h) = \rho_0 e^{-h/H}$, with sea-level density $\rho_0 = 1.225\,\mathrm{kg/m^3}$ and **[[scale height|scale-height]]** $H = 8500\,\mathrm{m}$. A rocket at $h = 10\,\mathrm{km}$ is climbing at $\dot h = 300\,\mathrm{m/s}$. How fast is the density around it falling?

Density depends on altitude, and altitude depends on time, so $\rho(h(t))$ is a composition. The chain rule:

$$
\frac{d\rho}{dt} = \frac{d\rho}{dh}\cdot\frac{dh}{dt} = \left(-\frac{\rho_0}{H} e^{-h/H}\right)\dot h .
$$

The $-1/H$ is the inside derivative of $e^{-h/H}$ — the chain rule used a second time.

Put in numbers, one step at a time. At $h = 10\,000\,\mathrm{m}$, $h/H = 1.176$, so $e^{-h/H} = e^{-1.176} = 0.3084$ and $\rho = 1.225 \times 0.3084 = 0.378\,\mathrm{kg/m^3}$. Then

$$
\frac{d\rho}{dh} = -\frac{1.225}{8500}\times 0.3084 = -4.44 \times 10^{-5}\,\mathrm{kg/m^3}\ \text{per meter}.
$$

Multiply by $300\,\mathrm{m/s}$: $\dot\rho = -0.0133\,\mathrm{kg/m^3}$ per second.

Does that make sense? At that rate the density would halve in $0.189/0.0133 \approx 14\,\mathrm{s}$. In fact the fall slows as the air thins, and an exponential halves every $H\ln 2 \approx 5900\,\mathrm{m}$ of climb — about $20\,\mathrm{s}$ at $300\,\mathrm{m/s}$. Either way the air is disappearing fast, which is why drag drops so quickly after max Q.
:::

::: key Chain rule
Chain rule: $\dfrac{d}{dx} f(g(x)) = f'(g(x))\cdot g'(x)$. Differentiate the outer function at the inner one, then multiply by the derivative of the inner one. Every EKF Jacobian is an application of this rule to a composition of frame transforms and sensor models: the sensitivity of a measurement to the state is the sensitivity of the sensor to its input times the sensitivity of that input to the state.
:::

## The quotient rule

For a fraction $u/v$ with $v(x) \neq 0$,

$$
\left(\frac{u}{v}\right)' = \frac{u'v - uv'}{v^2}.
$$

It follows from the two rules you already have. Write $u/v$ as a product, $u \cdot v^{-1}$. By the chain rule, with outside $w^{-1}$ and inside $v$, $\dfrac{d}{dx}v^{-1} = -v^{-2}\,v'$. Then by the product rule,

$$
\left(u v^{-1}\right)' = u' v^{-1} + u\,(-v^{-2}v') = \frac{u'}{v} - \frac{uv'}{v^2} = \frac{u'v - uv'}{v^2}.
$$

The last step put both fractions over the common bottom $v^2$.

The order on top matters. It is the derivative of the *top* times the bottom, minus the top times the derivative of the *bottom* — a **[[rhyme|quotient-rhyme]]** helps. A quick check: if $u = v$, the fraction is $1$, whose derivative is $0$, and the formula gives $(u'u - uu')/u^2 = 0$. As it must.

::: example Thrust acceleration during a burn
A first stage gives a steady thrust $T = 7.6\,\mathrm{MN}$ (meganewtons, millions of newtons) and burns propellant at $\dot m_p = 2500\,\mathrm{kg/s}$. Its mass is $m(t) = m_0 - \dot m_p t$, with $m_0 = 549\,000\,\mathrm{kg}$. How fast is the thrust acceleration $a = T/m$ growing at liftoff?

Use the quotient rule with top $u = T$ (constant, so $u' = 0$) and bottom $v = m(t)$, whose derivative is $\dot m = -\dot m_p$:

$$
\frac{da}{dt} = \frac{0 \cdot m - T\,\dot m}{m^2} = \frac{T\,\dot m_p}{m^2}.
$$

The two minus signs — one from the rule, one from the shrinking mass — cancel.

At $t = 0$: $a = 7.6 \times 10^6 / 5.49 \times 10^5 = 13.84\,\mathrm{m/s^2}$, and

$$
\frac{da}{dt} = \frac{(7.6 \times 10^6)(2500)}{(5.49 \times 10^5)^2} = 0.0630\,\mathrm{m/s^3}.
$$

So ten seconds in, the thrust acceleration has risen by roughly $10 \times 0.063 \approx 0.63\,\mathrm{m/s^2}$. (The exact rise is $0.66$, a bit more, because the rate itself grows as $1/m^2$ while the mass falls.)

By the end of a $162\,\mathrm{s}$ burn, the mass is $549\,000 - 2500 \times 162 = 144\,000\,\mathrm{kg}$, and $a = 7.6 \times 10^6 / 144\,000 = 52.8\,\mathrm{m/s^2}$ — over $5\,g$. That is why engines are **[[throttled down|throttle-down]]** before staging.
:::

::: key Product and quotient rules
Product rule: $(uv)' = u'v + uv'$. Quotient rule: $\left(\dfrac{u}{v}\right)' = \dfrac{u'v - uv'}{v^2}$. The quotient rule is the product rule applied to $u \cdot v^{-1}$ with the chain rule supplying $\dfrac{d}{dx}v^{-1} = -v^{-2}v'$.
:::

## Extending the table

With the three rules, every remaining basic derivative takes a few lines.

**Tangent and secant.** $\tan x = \sin x / \cos x$, so by the quotient rule, using $\cos^2 x + \sin^2 x = 1$ at the end:

$$
\frac{d}{dx}\tan x = \frac{\cos x \cos x - \sin x(-\sin x)}{\cos^2 x} = \frac{\cos^2 x + \sin^2 x}{\cos^2 x} = \frac{1}{\cos^2 x} = \sec^2 x .
$$

(Here $\sec x = 1/\cos x$, the **secant** function.) In the same way, $\dfrac{d}{dx}\sec x = \dfrac{d}{dx}(\cos x)^{-1} = -(\cos x)^{-2}(-\sin x) = \sec x \tan x$. And with $\cot x = \cos x/\sin x$ and $\csc x = 1/\sin x$, you get $\dfrac{d}{dx}\cot x = -\csc^2 x$ and $\dfrac{d}{dx}\csc x = -\csc x \cot x$.

**Exponentials of any base.** Since $e^{\ln b} = b$, we can write $b^x = e^{x \ln b}$. That is a composition with inside $x \ln b$, so the chain rule gives

$$
\frac{d}{dx}b^x = e^{x\ln b}\cdot\ln b = b^x \ln b .
$$

This confirms the constants measured in the last lesson: $\ln 2 = 0.693$ for base $2$, and $\ln 3 = 1.099$ for base $3$. For example, at $x = 3$, $\dfrac{d}{dx}2^x = 2^3 \ln 2 = 8 \times 0.693 = 5.55$.

**Any power at all.** For $x > 0$ and any real number $n$, write $x^n = e^{n \ln x}$. The chain rule gives

$$
\frac{d}{dx}x^n = e^{n\ln x}\cdot\frac{n}{x} = x^n \cdot \frac{n}{x} = n x^{n-1}.
$$

So the power rule, proved last lesson only for whole-number powers, holds for every real power. In particular,

$$
\frac{d}{dx}\sqrt{x} = \frac{d}{dx}x^{1/2} = \tfrac12 x^{-1/2} = \frac{1}{2\sqrt{x}}, \qquad \frac{d}{dr}r^{-2} = -2r^{-3}.
$$

The second one tells you how gravity's pull, $\mu/r^2$, weakens as the distance $r$ from Earth's center grows.

**Logarithms of any base.** $\log_b x = \dfrac{\ln x}{\ln b}$, and $\ln b$ is a constant, so $\dfrac{d}{dx}\log_b x = \dfrac{1}{x \ln b}$.

**The derivative of an inverse function.** An **inverse function** undoes another: if $y = f^{-1}(x)$, then $f(y) = x$. Differentiate both sides with respect to $x$, using the chain rule on the left: $f'(y)\,\dfrac{dy}{dx} = 1$. So

$$
\frac{d}{dx}f^{-1}(x) = \frac{1}{f'(f^{-1}(x))}.
$$

The slope of the inverse is one over the slope of the original, taken at the matching point. The graph of an inverse is the original graph flipped across the line $y = x$, and a **[[reflection|inverse-reflection]]** like that turns a slope $s$ into $1/s$.

Try it on $y = \ln x$, the inverse of $e^y$. Then $e^y = x$, so $e^y\,y' = 1$, giving $y' = 1/e^y = 1/x$ — a second route to the logarithm's derivative. The next lesson uses this same move to differentiate $\arcsin$, $\arccos$ and $\arctan$.

## Logarithmic differentiation

When an expression is a product of many pieces, or has the variable in both the base and the power, take logarithms first. The **[[logarithm turns products into sums|slide-rule]]** and powers into multiples. And by the chain rule, $\dfrac{d}{dx}\ln y = \dfrac{y'}{y}$.

::: example Differentiating $x^x$
Find $\dfrac{d}{dx}x^x$ for $x > 0$ and evaluate it at $x = 2$.

Neither rule fits. The power rule needs a constant power, and the exponential rule needs a constant base. So set $y = x^x$ and take logarithms: $\ln y = x \ln x$. Differentiate both sides with respect to $x$. The left side uses the chain rule; the right side uses the product rule:

$$
\frac{y'}{y} = 1 \cdot \ln x + x \cdot \frac{1}{x} = \ln x + 1 .
$$

Multiply by $y$: $y' = x^x(\ln x + 1)$. At $x = 2$: $2^2(\ln 2 + 1) = 4 \times 1.693 = 6.77$.

Sanity check: $x^x$ goes from $4$ at $x = 2$ to $2.1^{2.1} = 4.75$ at $x = 2.1$, a rise of about $0.75$ over $0.1$ — a slope near $7.5$, a bit above $6.77$ because the curve is bending upward.

The same trick handles $y = \dfrac{(x^2 + 1)^3 \sqrt{x}}{e^{2x}}$. Take logs: $\ln y = 3\ln(x^2 + 1) + \tfrac12 \ln x - 2x$. Differentiate: $\dfrac{y'}{y} = \dfrac{6x}{x^2 + 1} + \dfrac{1}{2x} - 2$, and $y'$ is that times $y$. The other route — quotient rule around product rule around chain rule — gets the same answer with three times the algebra and three times the chances to drop a sign.
:::

## A procedure for differentiating anything

Faced with any expression, find its outermost structure, use the matching rule, and then repeat on the pieces.

1. Is it a sum? Differentiate each term (linearity).
2. Is it a product or quotient of two pieces? Use the product or quotient rule, then differentiate each piece.
3. Is it a function of something other than the bare variable? Chain rule: outer derivative at the inner expression, times the inner derivative.
4. Is it a basic ingredient — a power, $\sin$, $\cos$, $e^x$, $\ln x$? Read it off the table.

Take $f(t) = t^2 e^{-t/\tau}\cos(\omega t)$. This is a decaying wobble with a growing front factor — the kind of shaking a lightly damped structure shows after a thruster fires. ($\tau$, "tau", is a time constant.) It is a product of three factors. Differentiate one factor at a time:

$$
f'(t) = 2t\,e^{-t/\tau}\cos(\omega t) + t^2\left(-\frac{1}{\tau}\right)e^{-t/\tau}\cos(\omega t) + t^2 e^{-t/\tau}\big(-\omega\sin(\omega t)\big).
$$

The chain rule supplied the $-1/\tau$ and the $-\omega$. You can pull out the common factor $t\,e^{-t/\tau}$ if you like; the mechanical part is done.

::: warning The forgotten inner derivative
The most common chain-rule slip is dropping the inner derivative: writing $\dfrac{d}{dt}\sin(\omega t) = \cos(\omega t)$ instead of $\omega\cos(\omega t)$. Units catch it. With $t$ in seconds and $\omega$ in radians per second, $\sin(\omega t)$ has no units, so its time derivative must have units of $1/\mathrm{s}$. Only the version with $\omega$ does.

The second most common slip is using the power rule on $b^x$, or the exponential rule on $x^n$. The variable must be in the base for the power rule, and in the power for the exponential rule. If it is in both, take logarithms.
:::

::: warning There is no "multiply the derivatives" rule
$\dfrac{d}{dx}\big(f(x)g(x)\big)$ is not $f'(x)g'(x)$. A quick counterexample: $x \cdot x = x^2$ has derivative $2x$, but multiplying the separate derivatives gives $1 \cdot 1 = 1$. In the same way, $\dfrac{d}{dx}\dfrac{f}{g} \neq \dfrac{f'}{g'}$. If either shortcut feels natural under time pressure, remember the rectangle: the area grows by two strips, not by one small corner.
:::

## Check yourself

::: check
Differentiate $y = (3x^2 - 5)^4$ with respect to $x$. Then differentiate $p(t) = m(t)v(t)$ with respect to $t$, leaving the answer in terms of $\dot m$ and $\dot v$.
:::

::: answer
Chain rule, with outside $u^4$ and inside $3x^2 - 5$: $y' = 4(3x^2 - 5)^3 \cdot 6x = 24x(3x^2 - 5)^3$.

Product rule: $\dot p = \dot m v + m\dot v$. This is the time derivative of momentum for a body whose mass changes. The last lesson of this module explains why using it carelessly on a rocket gives a wrong equation of motion.
:::

::: check
Find $\dfrac{d}{dx}\dfrac{x}{x^2 + 4}$ and simplify. Where is the derivative zero, and what is the slope at $x = 0$?
:::

::: answer
Quotient rule with top $u = x$ ($u' = 1$) and bottom $v = x^2 + 4$ ($v' = 2x$):

$$
\frac{1\cdot(x^2 + 4) - x \cdot 2x}{(x^2 + 4)^2} = \frac{4 - x^2}{(x^2 + 4)^2}.
$$

The top is zero when $x^2 = 4$, so the derivative vanishes at $x = \pm 2$. At $x = 0$ the slope is $4/16 = \tfrac14$, so the tangent line through the origin is $y = x/4$.
:::

::: check
A spring-mounted sensor wobbles with displacement $x(t) = A e^{-t/\tau}\sin(\omega t)$. Find its velocity $\dot x(t)$, and the velocity at $t = 0$.
:::

::: answer
It is a product of $A e^{-t/\tau}$ and $\sin(\omega t)$, and each factor needs the chain rule:

$$
\dot x = A\left(-\frac{1}{\tau}\right)e^{-t/\tau}\sin(\omega t) + A e^{-t/\tau}\,\omega\cos(\omega t) = A e^{-t/\tau}\left(\omega\cos\omega t - \frac{1}{\tau}\sin\omega t\right).
$$

At $t = 0$, $\sin 0 = 0$ and $\cos 0 = 1$, so $\dot x(0) = A\omega$. The sensor starts at its rest position moving at speed $A\omega$ — the initial kick that set it wobbling.
:::

::: check
Use the inverse-function rule to find the derivative of $y = \sqrt[3]{x}$ at $x = 8$, and check it with the power rule.
:::

::: answer
Cube both sides: $y^3 = x$. Differentiate both sides with respect to $x$: $3y^2\,y' = 1$, so $y' = \dfrac{1}{3y^2}$. At $x = 8$, $y = 2$, so $y' = \dfrac{1}{12}$.

Power rule: $\dfrac{d}{dx}x^{1/3} = \tfrac13 x^{-2/3}$. At $x = 8$, $x^{2/3} = 4$, so $x^{-2/3} = \tfrac14$, giving $\tfrac13 \cdot \tfrac14 = \dfrac{1}{12}$. Same answer.
:::

::: check
A ground station measures its range (distance) to a spacecraft. The range is computed from the spacecraft's position after that position has been rotated from a fixed "inertial" frame into the ground station's own frame. In one or two sentences, explain why the sensitivity of the range to the spacecraft's inertial position is a chain-rule quantity.
:::

::: answer
The measurement is a composition: range is a function of the station-frame position, and the station-frame position is a function (a rotation) of the inertial-frame state. The chain rule says the derivative of the whole is the derivative of the outer function (range with respect to station-frame position) times the derivative of the inner one (station-frame position with respect to inertial state). With vectors these derivatives are matrices and the multiplication is a matrix product, but the rule is the same one used for $\sin(\omega t)$.
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

The inverse-function rule was a special case of a bigger idea: when $x$ and $y$ are tied together by an equation you cannot solve for $y$, you can still differentiate the equation. That is **implicit differentiation**, the subject of the next lesson. It is also how the rates of linked quantities — range and range rate, angle and angular rate — are connected in tracking problems.

::: context drag-terms What goes into the drag formula
In $D = \tfrac12 \rho v^2 C_D A$, $\rho$ ("rho") is the air density in $\mathrm{kg/m^3}$ and $v$ is the speed through the air. $A$ is a **reference area**, usually the cross-section you would see looking at the nose. $C_D$ is the **drag coefficient**, a pure number measured in wind tunnels that captures the vehicle's shape; for a rocket it changes with speed and peaks near the speed of sound. The group $\tfrac12\rho v^2$ is the **dynamic pressure**, written $q$. Stick your hand out of a car window at twice the speed and you feel about four times the push — that is the $v^2$.
:::

::: context jacobian A table of chain-rule slopes
When a function takes several inputs and gives several outputs, its derivative is not one number but a table of them: how each output changes when each input is nudged. That table, arranged as a matrix, is the **Jacobian**, named after the mathematician Carl Jacobi. A navigation filter such as the **extended Kalman filter** (EKF) needs the Jacobian of its sensor model to decide how much to trust each new measurement. The multi-variable calculus module builds it; the rule for combining Jacobians is this lesson's chain rule, with matrix multiplication in place of ordinary multiplication.
:::

::: context product-rectangle Two strips and a corner
The blue rectangle has area $uv$. When $u$ grows by $\Delta u$ and $v$ by $\Delta v$, the new area adds the two orange strips and the small red corner. Divide by the step $h$ and shrink it: each strip survives as a derivative, while the corner, a product of two small changes, shrinks away faster than $h$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="68" width="180" height="110" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="240" y="68" width="40" height="110" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="60" y="40" width="180" height="28" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="240" y="40" width="40" height="28" fill="#b4232c" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150.0" y="127.0" font-size="13" text-anchor="middle" fill="#1f2a44">area u·v</text>
  <text x="260.0" y="127.0" font-size="11" text-anchor="middle" fill="#1f2a44">Δu·v</text>
  <text x="150.0" y="58.0" font-size="11" text-anchor="middle" fill="#1f2a44">u·Δv</text>
  <text x="150.0" y="194" font-size="12" text-anchor="middle" fill="#1f2a44">u</text>
  <text x="260.0" y="194" font-size="12" text-anchor="middle" fill="#1f2a44">Δu</text>
  <text x="52" y="127.0" font-size="12" text-anchor="end" fill="#1f2a44">v</text>
  <text x="52" y="58.0" font-size="12" text-anchor="end" fill="#1f2a44">Δv</text>
  <text x="288" y="58.0" font-size="11" fill="#b4232c">Δu·Δv</text>
  <text x="288" y="72.0" font-size="11" fill="#b4232c">tiny corner</text>
</svg>
```
:::

::: context max-q The moment of maximum squeeze
**Max Q** is the point in a launch where dynamic pressure, $q = \tfrac12\rho v^2$, peaks. Before it, speed is climbing faster than the air thins, so $q$ grows; after it, the thinning air wins. For many launch vehicles it comes roughly a minute or so after liftoff, around $10$ to $15\,\mathrm{km}$ up. It is when aerodynamic loads on the structure are near their largest, so many rockets throttle their engines down briefly to get through it — which is why you hear "vehicle is through max Q" on launch broadcasts.
:::

::: context rate-chain Rates passing down a chain
Each arrow is a rate: how much the next box changes per unit of the one before. The chain rule says to multiply along the arrows. The units cancel the same way the numbers multiply — meters per second times kilograms per cubic meter per meter leaves kilograms per cubic meter per second.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="70" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="145" y="40" width="70" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="280" y="40" width="70" height="40" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="45" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">time</text>
  <text x="45" y="73" font-size="12" text-anchor="middle" fill="#1f2a44">t (s)</text>
  <text x="180" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">altitude</text>
  <text x="180" y="73" font-size="12" text-anchor="middle" fill="#1f2a44">h (m)</text>
  <text x="315" y="58" font-size="12" text-anchor="middle" fill="#1f2a44">density</text>
  <text x="315" y="73" font-size="12" text-anchor="middle" fill="#1f2a44">ρ (kg/m³)</text>
  <line x1="80" y1="60" x2="137" y2="60" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="145,60 135,55 135,65" fill="#1d6fd1"/>
  <line x1="215" y1="60" x2="272" y2="60" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="280,60 270,55 270,65" fill="#1d6fd1"/>
  <text x="112" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">dh/dt = 300</text>
  <text x="112" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">m per s</text>
  <text x="247" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">dρ/dh = −4.44e−5</text>
  <text x="247" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">kg/m³ per m</text>
  <text x="180" y="134" font-size="12" text-anchor="middle" fill="#b4232c">dρ/dt = 300 × (−4.44e−5) = −0.0133 kg/m³ per s</text>
</svg>
```
:::

::: context scale-height What the scale height means
In the model $\rho = \rho_0 e^{-h/H}$, each climb of one scale height $H$ divides the density by $e \approx 2.718$. With $H = 8500\,\mathrm{m}$, the air at $8.5\,\mathrm{km}$ is about $37\%$ as dense as at sea level, and at $17\,\mathrm{km}$ about $14\%$. The real atmosphere's temperature changes with height, so the true scale height varies too, but a single value near $8$ to $8.5\,\mathrm{km}$ works well low down. The last lesson of this module derives this exponential from the physics of air.
:::

::: context quotient-rhyme A rhyme for the quotient rule
Many students remember the quotient rule as "low d-high minus high d-low, over the square of what's below". "Low" is the bottom, $v$; "high" is the top, $u$; "d-high" is the derivative of the top. So: $v\,u' - u\,v'$, all over $v^2$. The minus sign is why the order matters — swap the two terms and you get the answer's negative.
:::

::: context throttle-down Keeping the ride bearable
Acceleration climbs through a burn because thrust stays roughly fixed while the mass drops. Left alone it would squeeze crews and payloads too hard, so launch vehicles manage it. The Space Shuttle throttled its main engines back to keep acceleration to about $3\,g$. The Saturn V shut down the center engine of its first stage early for a similar reason.
:::

::: context inverse-reflection Flipping a graph flips its slope
Swap $x$ and $y$ and the curve $y = e^x$ becomes $y = \ln x$, its mirror image across the dashed line $y = x$. The point $(1, e)$ on $e^x$ becomes $(e, 1)$ on $\ln x$. The tangent at $(1, e)$ rises $e$ for every $1$ across; after the flip it rises $1$ for every $e$ across, so its slope is $1/e$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="4" y1="165" x2="356" y2="165" stroke="#6c7a93" stroke-width="1"/>
  <line x1="70" y1="6" x2="70" y2="216" stroke="#6c7a93" stroke-width="1"/>
  <line x1="19.6" y1="215.4" x2="229.6" y2="5.4" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="4.9,156.1 7.0,155.6 9.1,155.1 11.2,154.6 13.3,154.1 15.4,153.6 17.5,153.0 19.6,152.3 21.7,151.7 23.8,151.0 25.9,150.3 28.0,149.5 30.1,148.8 32.2,147.9 34.3,147.0 36.4,146.1 38.5,145.2 40.6,144.1 42.7,143.1 44.8,141.9 46.9,140.8 49.0,139.5 51.1,138.2 53.2,136.8 55.3,135.4 57.4,133.9 59.5,132.3 61.6,130.6 63.7,128.9 65.8,127.0 67.9,125.0 70.0,123.0 72.1,120.8 74.2,118.6 76.3,116.2 78.4,113.7 80.5,111.1 82.6,108.3 84.7,105.4 86.8,102.3 88.9,99.1 91.0,95.8 93.1,92.2 95.2,88.5 97.3,84.5 99.4,80.4 101.5,76.1 103.6,71.5 105.7,66.7 107.8,61.7 109.9,56.4 112.0,50.8 114.1,45.0 116.2,38.8 118.3,32.4 120.4,25.6 122.5,18.4"/>
  <polyline fill="none" stroke="#f2b880" stroke-width="2.5" points="78.5,232.2 79.3,228.2 80.2,224.6 81.0,221.3 81.8,218.2 82.7,215.3 83.5,212.6 84.4,210.1 85.2,207.7 86.0,205.4 86.9,203.3 87.7,201.2 88.6,199.3 89.4,197.4 90.2,195.7 91.1,194.0 91.9,192.3 92.8,190.7 93.6,189.2 94.4,187.7 95.3,186.3 96.1,184.9 97.0,183.6 97.8,182.3 98.6,181.1 99.5,179.9 100.3,178.7 101.2,177.5 102.0,176.4 102.8,175.3 103.7,174.3 104.5,173.2 105.4,172.2 106.2,171.2 107.0,170.3 107.9,169.3 108.7,168.4 109.6,167.5 110.4,166.6 111.2,165.8 112.1,164.9 112.9,164.1 113.8,163.3 114.6,162.5 115.4,161.7 116.3,160.9 117.1,160.2 118.0,159.4 118.8,158.7 119.6,158.0 120.5,157.3 121.3,156.6 122.2,155.9 123.0,155.2 123.8,154.6 124.7,153.9 125.5,153.3 126.4,152.6 127.2,152.0 128.0,151.4 128.9,150.8 129.7,150.2 130.6,149.6 131.4,149.1 132.2,148.5 133.1,147.9 133.9,147.4 134.8,146.8 135.6,146.3 136.4,145.7 137.3,145.2 138.1,144.7 139.0,144.2 139.8,143.7 140.6,143.2 141.5,142.7 142.3,142.2 143.2,141.7 144.0,141.2 144.8,140.7 145.7,140.3 146.5,139.8 147.4,139.3 148.2,138.9 149.0,138.4 149.9,138.0 150.7,137.6 151.6,137.1 152.4,136.7 153.2,136.3 154.1,135.8 154.9,135.4 155.8,135.0 156.6,134.6 157.4,134.2 158.3,133.8 159.1,133.4 160.0,133.0 160.8,132.6 161.6,132.2 162.5,131.8 163.3,131.5 164.2,131.1 165.0,130.7 165.8,130.3 166.7,130.0 167.5,129.6 168.4,129.3 169.2,128.9 170.0,128.5 170.9,128.2 171.7,127.8 172.6,127.5 173.4,127.2 174.2,126.8 175.1,126.5 175.9,126.1 176.8,125.8 177.6,125.5 178.4,125.2 179.3,124.8 180.1,124.5 181.0,124.2 181.8,123.9 182.6,123.6 183.5,123.3 184.3,122.9 185.2,122.6 186.0,122.3 186.8,122.0 187.7,121.7 188.5,121.4 189.4,121.1 190.2,120.8 191.0,120.5 191.9,120.3 192.7,120.0 193.6,119.7 194.4,119.4 195.2,119.1 196.1,118.8 196.9,118.6 197.8,118.3 198.6,118.0 199.4,117.7 200.3,117.5 201.1,117.2 202.0,116.9 202.8,116.7 203.6,116.4 204.5,116.1 205.3,115.9 206.2,115.6 207.0,115.3 207.8,115.1 208.7,114.8 209.5,114.6 210.4,114.3 211.2,114.1 212.0,113.8 212.9,113.6 213.7,113.3 214.6,113.1 215.4,112.8 216.2,112.6 217.1,112.4 217.9,112.1 218.8,111.9 219.6,111.6 220.4,111.4 221.3,111.2 222.1,110.9 223.0,110.7 223.8,110.5 224.6,110.3 225.5,110.0 226.3,109.8 227.2,109.6 228.0,109.4 228.8,109.1 229.7,108.9 230.5,108.7 231.4,108.5 232.2,108.3 233.0,108.0 233.9,107.8 234.7,107.6 235.6,107.4 236.4,107.2 237.2,107.0 238.1,106.8 238.9,106.5 239.8,106.3 240.6,106.1 241.4,105.9 242.3,105.7 243.1,105.5 244.0,105.3 244.8,105.1 245.6,104.9 246.5,104.7 247.3,104.5 248.2,104.3 249.0,104.1 249.8,103.9 250.7,103.7 251.5,103.5 252.4,103.3 253.2,103.1 254.0,102.9 254.9,102.8 255.7,102.6 256.6,102.4 257.4,102.2 258.2,102.0 259.1,101.8 259.9,101.6 260.8,101.4 261.6,101.3 262.4,101.1 263.3,100.9 264.1,100.7 265.0,100.5 265.8,100.3 266.6,100.2 267.5,100.0 268.3,99.8 269.2,99.6 270.0,99.5 270.8,99.3 271.7,99.1 272.5,98.9 273.4,98.8 274.2,98.6 275.0,98.4 275.9,98.2 276.7,98.1 277.6,97.9 278.4,97.7 279.2,97.6 280.1,97.4 280.9,97.2 281.8,97.1 282.6,96.9 283.4,96.7 284.3,96.6 285.1,96.4 286.0,96.2 286.8,96.1 287.6,95.9 288.5,95.7 289.3,95.6 290.2,95.4 291.0,95.3 291.8,95.1 292.7,94.9 293.5,94.8 294.4,94.6 295.2,94.5 296.0,94.3 296.9,94.2 297.7,94.0 298.6,93.8 299.4,93.7 300.2,93.5 301.1,93.4 301.9,93.2 302.8,93.1 303.6,92.9 304.4,92.8 305.3,92.6 306.1,92.5 307.0,92.3 307.8,92.2 308.6,92.0 309.5,91.9 310.3,91.7 311.2,91.6 312.0,91.4 312.8,91.3 313.7,91.2 314.5,91.0 315.4,90.9 316.2,90.7 317.0,90.6 317.9,90.4 318.7,90.3 319.6,90.2 320.4,90.0 321.2,89.9 322.1,89.7 322.9,89.6 323.8,89.5 324.6,89.3 325.4,89.2 326.3,89.0 327.1,88.9 328.0,88.8 328.8,88.6 329.6,88.5 330.5,88.4 331.3,88.2 332.2,88.1 333.0,88.0 333.8,87.8 334.7,87.7 335.5,87.6 336.4,87.4 337.2,87.3 338.0,87.2 338.9,87.0 339.7,86.9 340.6,86.8 341.4,86.6 342.2,86.5 343.1,86.4 343.9,86.2 344.8,86.1 345.6,86.0 346.4,85.9 347.3,85.7 348.1,85.6 349.0,85.5 349.8,85.4 350.6,85.2 351.5,85.1 352.3,85.0 353.2,84.8 354.0,84.7 354.8,84.6"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.8" points="93.1,102.2 122.5,22.3"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="1.8" points="132.8,141.9 212.7,112.5"/>
  <circle cx="112.0" cy="50.8" r="3.5" fill="#b4232c"/>
  <circle cx="184.2" cy="123.0" r="3.5" fill="#b4232c"/>
  <text x="122.0" y="54.8" font-size="11" fill="#b4232c">slope e</text>
  <text x="188.2" y="147.0" font-size="11" fill="#b4232c">slope 1/e</text>
  <text x="78.4" y="26.4" font-size="12" fill="#1d6fd1">y = eˣ</text>
  <text x="271.6" y="112.5" font-size="12" text-anchor="end" fill="#1f2a44">y = ln x</text>
  <text x="204.0" y="53.0" font-size="11" fill="#6c7a93">y = x</text>
</svg>
```
:::

::: context slide-rule Multiplying by adding
Because $\ln(ab) = \ln a + \ln b$, you can multiply two numbers by adding their logarithms. The **slide rule** did exactly this: two rulers marked with logarithmic scales, slid against each other, added lengths and so multiplied numbers. Engineers used slide rules for most of the 20th century, until pocket calculators replaced them in the 1970s. Logarithmic differentiation uses the same idea: turn a hard product into an easy sum.
:::
