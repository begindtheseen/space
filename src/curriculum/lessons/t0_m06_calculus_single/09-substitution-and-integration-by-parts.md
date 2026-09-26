---
id: l09-substitution-and-integration-by-parts
title: Substitution and integration by parts
minutes: 20
covers:
  - integration by parts and substitution
---

Think of a set of keys. The table of antiderivatives from the last lesson is a key ring with a few simple keys on it: powers, exponentials, sines, logarithms. Most doors a working engineer meets do not match any of those keys directly. But many of them open if you first turn the lock a little — rewrite the integral into a shape that one of the simple keys fits. This lesson teaches the two main ways to turn the lock.

The integrals a GNC engineer actually meets are rarely on the table:

- The mass of air above a given height is $\int \rho_0 e^{-z/H}\,dz$.
- The distance a vehicle covers under a thrust that fades away is $\int t\,e^{-t/\tau}\,dt$.
- The motion of a **damped oscillator** — anything that wobbles and settles, like a spacecraft's solar panel after a thruster firing — and the Laplace transform that the controls module is built on, both lead to integrals of $e^{-at}\cos\omega t$.
- The average reading of a noisy sensor is $\int x\,p(x)\,dx$, where $p$ describes how its readings are spread.

None of these is in the table. All of them give way to two techniques. Both are differentiation rules you already know, run backward. **Substitution** is the chain rule in reverse: it spots an inner function and its derivative sitting together in the integral. **Integration by parts** is the product rule in reverse: it trades one integral for another that is easier. Between them they handle most integrals that have a formula at all. Equally important, they train your eye to see when an integral has *no* formula and must go to a computer.

## Substitution: the chain rule backward

Start from the chain rule of lesson 3. If $F' = f$ ("F prime equals f": $F$ is an antiderivative of $f$) and $u$ is a function of $x$, then

$$
\frac{d}{dx}F\big(u(x)\big) = f\big(u(x)\big)\,u'(x).
$$

Read it from right to left. It says: whenever an integral has the shape "some function of $u(x)$, times $u'(x)$", its antiderivative is $F(u(x))$:

$$
\int f\big(u(x)\big)\,u'(x)\,dx = F\big(u(x)\big) + C = \int f(u)\,du.
$$

The last form is how you actually use it, in three steps:

1. Give the inner function a name, $u = u(x)$.
2. Write its **differential**, $du = u'(x)\,dx$ — how much $u$ changes when $x$ changes by a tiny $dx$.
3. Replace both in the integral. What is left is an integral in $u$ alone, which you look up.

The differential notation from the linearization lesson is what makes this mechanical instead of a guessing game. $du$ really does equal $u'(x)\,dx$ for tiny changes, and swapping one for the other in an integral is exact.

### Move the limits too

For a definite integral, the limits must change along with the variable. If $x$ runs from $a$ to $b$, then $u$ runs from $u(a)$ to $u(b)$:

$$
\int_a^b f\big(u(x)\big)\,u'(x)\,dx = \int_{u(a)}^{u(b)} f(u)\,du.
$$

Changing the limits saves you from switching back to $x$ at the end. Forgetting to change them is the most common mistake in the whole subject.

### Three patterns

Most substitutions fall into one of three patterns.

**A straight-line inside.** $u = kx + c$, so $du = k\,dx$ and $dx = du/k$. This gives

$$
\int e^{kx}\,dx = \tfrac1k e^{kx} + C, \qquad \int \cos(\omega t + \phi)\,dt = \tfrac1\omega\sin(\omega t + \phi) + C.
$$

($\omega$ is "omega", a rate of turning; $\phi$ is "phi", a starting angle.) The factor $1/k$ is the whole story. Differentiate to check: the chain rule brings out a $k$, which cancels it.

**A function sitting next to its derivative.** In $\int x e^{-x^2}\,dx$, the inside of the exponential is $-x^2$, whose derivative $-2x$ is almost there. Let $u = -x^2$, so $du = -2x\,dx$, and $x\,dx = -\tfrac12 du$:

$$
\int x e^{-x^2}\,dx = -\tfrac12\int e^u\,du = -\tfrac12 e^{-x^2} + C.
$$

Another: $\int \tan x\,dx = \int \dfrac{\sin x}{\cos x}\,dx$. Let $u = \cos x$, so $du = -\sin x\,dx$:

$$
\int \tan x\,dx = -\int\frac{du}{u} = -\ln|\cos x| + C.
$$

The derivative does not have to appear exactly. A missing constant factor, like the $-\tfrac12$ above, can be supplied and made up for.

**A stretch that reaches a table entry.** In $\int \dfrac{dx}{a^2 + x^2}$, let $x = au$, so $dx = a\,du$ and $a^2 + x^2 = a^2(1 + u^2)$:

$$
\int \frac{dx}{a^2 + x^2} = \frac1a\int\frac{du}{1 + u^2} = \frac1a\arctan\frac{x}{a} + C.
$$

::: example Mass of the atmosphere above the ground
Model the air's density as falling off exponentially with height $z$:

$$
\rho(z) = \rho_0 e^{-z/H}, \qquad \rho_0 = 1.225\,\mathrm{kg/m^3}, \qquad H = 7.5\,\mathrm{km}.
$$

($\rho$ is "rho", density; $H$ is the **[[scale height|scale-height]]**.) Find the mass of air above each square meter of ground, between the ground and height $h$, and the total.

**Set up.** A thin layer of thickness $dz$ over one square meter holds mass $\rho(z)\,dz$. Add up the layers:

$$
M(h) = \int_0^h \rho_0 e^{-z/H}\,dz.
$$

**Substitute.** Let $u = -z/H$. Then $du = -dz/H$, so $dz = -H\,du$. Move the limits: $z = 0$ gives $u = 0$, and $z = h$ gives $u = -h/H$.

$$
M(h) = \rho_0\int_0^{-h/H} e^{u}\,(-H)\,du = -\rho_0 H\big[e^u\big]_0^{-h/H} = \rho_0 H\left(1 - e^{-h/H}\right).
$$

**Check by differentiating.** $M'(h) = \rho_0 H \cdot e^{-h/H}/H = \rho_0 e^{-h/H} = \rho(h)$. The rate at which the column gains mass is the density at the top, as the fundamental theorem says it must be.

**Numbers.** The total column is $\rho_0 H = 1.225 \times 7500 = 9188\,\mathrm{kg/m^2}$ — about nine tonnes of air over every square meter. Below $10\,\mathrm{km}$: $M = 9188\,(1 - e^{-1.333}) = 6766\,\mathrm{kg/m^2}$. So about three-quarters of the air lies below $10\,\mathrm{km}$, and $99.9\%$ below $50\,\mathrm{km}$. [[The shaded curve|atmosphere-picture]] shows the first ten kilometers.

**Sanity check against pressure.** The weight of the column is what presses on the ground: $9188 \times 9.80665 = 90.1\,\mathrm{kPa}$. The real sea-level pressure is $101.3\,\mathrm{kPa}$, so the model is about $11\%$ light. A scale height of $8.43\,\mathrm{km}$ would reproduce sea-level pressure exactly. But $7.5\,\mathrm{km}$ fits the density better higher up, where the ascent loads and reentry heating happen. No single exponential fits the whole atmosphere. Which one you choose depends on which integral you care about.
:::

::: example A quarter circle by trigonometric substitution
Show that $\displaystyle\int_0^R\sqrt{R^2 - x^2}\,dx = \dfrac{\pi R^2}{4}$, the area of a quarter of a disc of radius $R$.

**Choose the substitution.** A square root of "a square minus a square" is a hint to use a triangle. Let $x = R\sin\theta$. Then $dx = R\cos\theta\,d\theta$, and

$$
\sqrt{R^2 - x^2} = \sqrt{R^2 - R^2\sin^2\theta} = R\sqrt{\cos^2\theta} = R\cos\theta,
$$

which is safe because $\cos\theta \ge 0$ for $0 \le \theta \le \pi/2$. Move the limits: $x = 0$ gives $\theta = 0$, and $x = R$ gives $\theta = \pi/2$.

**Rewrite.**

$$
\int_0^R\sqrt{R^2 - x^2}\,dx = \int_0^{\pi/2} R\cos\theta \cdot R\cos\theta\,d\theta = R^2\int_0^{\pi/2}\cos^2\theta\,d\theta.
$$

**Finish.** Use the identity $\cos^2\theta = \tfrac12(1 + \cos 2\theta)$ from the trigonometry module, then the straight-line pattern for $\cos 2\theta$:

$$
R^2\Big[\tfrac{\theta}{2} + \tfrac{\sin 2\theta}{4}\Big]_0^{\pi/2} = R^2\left(\frac{\pi}{4} + 0 - 0 - 0\right) = \frac{\pi R^2}{4}.
$$

**Sanity check.** The whole disc is $\pi R^2$, and a quarter of it is $\pi R^2/4$.

This substitution runs the other way from the last one. Instead of naming $u$ as a function of $x$, you wrote $x$ as a function of a new variable $\theta$. It is the standard move for three shapes:

- $\sqrt{a^2 - x^2}$: use $x = a\sin\theta$;
- $\sqrt{a^2 + x^2}$: use $x = a\tan\theta$;
- $\sqrt{x^2 - a^2}$: use $x = a\sec\theta$.

The same integral gives the area of liquid in a **[[partly filled round tank|tank-level]]** lying on its side, as a function of the liquid's level.
:::

## Integration by parts: the product rule backward

The product rule says $(uv)' = u'v + uv'$. Integrate both sides, and the left side undoes itself:

$$
uv = \int u'v\,dx + \int uv'\,dx.
$$

Move one integral to the other side, and write $du = u'\,dx$ and $dv = v'\,dx$:

$$
\int u\,dv = uv - \int v\,du.
$$

That is **integration by parts**. For a definite integral, the $uv$ part — the **boundary term** — is evaluated at the two limits:

$$
\int_a^b u\,\frac{dv}{dx}\,dx = \Big[uv\Big]_a^b - \int_a^b v\,\frac{du}{dx}\,dx.
$$

There is a neat [[picture of the formula as areas|parts-picture]] if you want to see why it has to be true.

### How to split the integral

You split the thing being integrated into two factors. One, $u$, you will differentiate. The other, $dv$, you will integrate to get $v$. The move pays off when the new integral $\int v\,du$ is easier than the old one. That happens when:

- differentiating $u$ makes it simpler — a power of $x$ drops a degree, and $\ln x$ or $\arctan x$ turns into a plain fraction; and
- integrating $dv$ does not make it worse — exponentials and sines stay exponentials and sines.

A handy order for choosing $u$ is **[[LIATE|liate]]**: **L**ogarithm, **I**nverse trig, **A**lgebraic (powers of $x$), **T**rig, **E**xponential. Take $u$ to be whichever factor comes first in that list. It is a rule of thumb, not a theorem, but it rarely lets you down.

::: key Integration by parts
$\displaystyle\int u\,dv = uv - \int v\,du$. Choose $u$ to be the factor that simplifies when differentiated and $dv$ the factor that stays tame when integrated.
:::

### Three standard cases

**A power times an exponential.** Take $\int x e^{-x/\tau}\,dx$, where $\tau$ ("tau") is a time constant. LIATE says $u = x$ (algebraic) and $dv = e^{-x/\tau}\,dx$. Then $du = dx$, and by the straight-line pattern $v = -\tau e^{-x/\tau}$:

$$
\int x e^{-x/\tau}\,dx = -\tau x e^{-x/\tau} + \tau\int e^{-x/\tau}\,dx = -\tau x e^{-x/\tau} - \tau^2 e^{-x/\tau} + C = -\tau(x + \tau)e^{-x/\tau} + C.
$$

Differentiate to confirm, with the product rule: $-\tau e^{-x/\tau} + (x + \tau)e^{-x/\tau} = x e^{-x/\tau}$. It checks.

A higher power needs the same step again. Each round drops the power by one:

$$
\int x^2 e^x\,dx = e^x(x^2 - 2x + 2) + C, \qquad \int_0^1 x^2 e^x\,dx = e - 2 = 0.718.
$$

**A lone logarithm or inverse function.** $\int \ln x\,dx$ seems to have only one factor. Make a second one: take $u = \ln x$ and $dv = dx$, so $du = dx/x$ and $v = x$:

$$
\int \ln x\,dx = x\ln x - \int x\cdot\frac{dx}{x} = x\ln x - x + C.
$$

The same trick works for the arctangent. With $u = \arctan x$ and $dv = dx$:

$$
\int\arctan x\,dx = x\arctan x - \int\frac{x\,dx}{1 + x^2} = x\arctan x - \tfrac12\ln(1 + x^2) + C,
$$

where the last step is a substitution, $w = 1 + x^2$.

**An exponential times a sine or cosine.** Neither factor gets simpler. But two rounds of parts bring the original integral back, and you solve for it with algebra. That is the next example.

::: example The damped cosine integral
Find $I = \displaystyle\int e^{-at}\cos\omega t\,dt$. Then evaluate $\displaystyle\int_0^5 e^{-0.5t}\cos 2t\,dt$.

**First round.** Take $u = \cos\omega t$ and $dv = e^{-at}\,dt$. Then $du = -\omega\sin\omega t\,dt$ and $v = -\tfrac1a e^{-at}$:

$$
I = -\frac{1}{a}e^{-at}\cos\omega t - \frac{\omega}{a}\int e^{-at}\sin\omega t\,dt.
$$

**Second round.** Apply parts to the new integral, with $u = \sin\omega t$ and $dv = e^{-at}\,dt$, so $du = \omega\cos\omega t\,dt$:

$$
\int e^{-at}\sin\omega t\,dt = -\frac{1}{a}e^{-at}\sin\omega t + \frac{\omega}{a}\int e^{-at}\cos\omega t\,dt = -\frac{1}{a}e^{-at}\sin\omega t + \frac{\omega}{a}I.
$$

The original integral $I$ has come back.

**Solve for $I$.** Put the second result into the first:

$$
I = -\frac1a e^{-at}\cos\omega t + \frac{\omega}{a^2}e^{-at}\sin\omega t - \frac{\omega^2}{a^2}I.
$$

Move the $I$ terms to the left: $\left(1 + \dfrac{\omega^2}{a^2}\right)I = \dfrac{e^{-at}}{a^2}\left(-a\cos\omega t + \omega\sin\omega t\right)$. Multiply both sides by $a^2$ and divide by $a^2 + \omega^2$:

$$
\int e^{-at}\cos\omega t\,dt = \frac{e^{-at}\left(\omega\sin\omega t - a\cos\omega t\right)}{a^2 + \omega^2} + C.
$$

**Numbers.** With $a = 0.5$ and $\omega = 2$, $a^2 + \omega^2 = 4.25$. At $t = 5$ the antiderivative is

$$
\frac{e^{-2.5}(2\sin 10 - 0.5\cos 10)}{4.25} = \frac{0.08208 \times (-1.0880 + 0.4195)}{4.25} = -0.01291.
$$

At $t = 0$ it is $\dfrac{1 \times (0 - 0.5)}{4.25} = -0.11765$. The definite integral is $-0.01291 - (-0.11765) = 0.1047$. A midpoint sum with $200\,000$ pieces gives $0.10474$. They agree.

**Where it leads.** Let the upper limit go to infinity. Then $e^{-at} \to 0$ wipes out the boundary term at the top, leaving $\dfrac{a}{a^2 + \omega^2}$. Rename $a$ as $s$, and that is the **[[Laplace transform|laplace]]** of $\cos\omega t$:

$$
\frac{s}{s^2 + \omega^2}.
$$

The differential-equations module uses it to read a damped oscillator's frequency straight off a transfer function. Every entry in the Laplace table comes from an integration by parts like this one.
:::

::: example Distance under a fading thrust
A **[[cold-gas thruster|cold-gas]]** pushes less and less as its tank empties. Model its acceleration as $a(t) = a_0 e^{-t/\tau}$, with $a_0 = 2\,\mathrm{m/s^2}$ and $\tau = 2\,\mathrm{s}$. Starting from rest, find the speed gained and the distance covered in $T = 10\,\mathrm{s}$ — the distance in two different ways.

**Speed.** Speed is the integral of acceleration. By the straight-line pattern,

$$
v(t) = \int_0^t a_0 e^{-s/\tau}\,ds = a_0\tau\left(1 - e^{-t/\tau}\right).
$$

At $T = 10$: $v = 2 \times 2 \times (1 - e^{-5}) = 4 \times 0.99326 = 3.973\,\mathrm{m/s}$. That is within $0.7\%$ of $a_0\tau = 4\,\mathrm{m/s}$, the most an endless burn could give.

**Distance, first way: integrate $v$ directly.**

$$
x(T) = a_0\tau\int_0^T\left(1 - e^{-t/\tau}\right)dt = a_0\tau\Big[T - \tau\left(1 - e^{-T/\tau}\right)\Big] = 4\,(10 - 2 \times 0.99326) = 32.05\,\mathrm{m}.
$$

**Distance, second way: by parts.** Take $u = v(t)$ and $dv = dt$. Then $du = a(t)\,dt$ (acceleration is the derivative of speed) and the "$v$" of the formula is $t$:

$$
x(T) = \int_0^T v\,dt = \Big[t\,v(t)\Big]_0^T - \int_0^T t\,a(t)\,dt = T\,v(T) - a_0\int_0^T t\,e^{-t/\tau}\,dt.
$$

The leftover integral is the power-times-exponential case from above:

$$
\int_0^T t e^{-t/\tau}\,dt = \Big[-\tau(t + \tau)e^{-t/\tau}\Big]_0^T = \tau^2\Big[1 - e^{-T/\tau}\left(1 + \tfrac{T}{\tau}\right)\Big] = 4\,(1 - 6 e^{-5}) = 3.838\,\mathrm{s^2}.
$$

So $x(T) = 10 \times 3.973 - 2 \times 3.838 = 39.73 - 7.68 = 32.05\,\mathrm{m}$. The two ways agree.

**What the second way means.** $T\,v(T)$ is the distance you would cover if you had your final speed the whole time. That is too much, because the speed was gained over time. The integral $\int_0^T t\,a(t)\,dt$ takes it back, weighting each bit of speed gained by *how late* it arrived. Rearranged, the answer is $x(T) = \int_0^T (T - t)\,a(t)\,dt$: each push, multiplied by the time left after it. That form is called a **[[convolution|convolution]]**, and the differential-equations module uses it to write how any linear system responds to any input.
:::

## Choosing between the two

Look at the integral and ask two questions, in order.

1. Is there an inner function whose derivative is also there, up to a constant? Then **substitute**.
2. Is it a product of two different kinds of function — a power with an exponential, a logarithm with anything? Then **integrate by parts**.

Some integrals need both, one after the other. $\int \arctan x\,dx$ needed parts, then a substitution. $\int x^3 e^{-x^2}\,dx$ needs the substitution $u = x^2$ first, which turns it into $\tfrac12\int u\,e^{-u}\,du$, and then parts.

Some integrals need neither, because they have no antiderivative built from ordinary functions at all:

- $\int e^{-x^2}\,dx$, the bell curve;
- $\int \dfrac{\sin x}{x}\,dx$;
- $\int \sqrt{1 - k^2\sin^2\theta}\,d\theta$, which gives the length around an ellipse and the swing time of a [[pendulum swinging wide|elliptic]].

Spotting these quickly is a skill. The answer is a numerical method or a named special function. No amount of cleverness will produce a formula.

::: warning Change the limits, or change back — never mix
In a definite integral, either move the limits to the new variable or switch back to the old variable before plugging in. Writing $\int_0^1 x e^{-x^2}\,dx = -\tfrac12\int_0^1 e^u\,du$ with the *old* limits gives $-\tfrac12(e - 1) = -0.859$. That is negative, and it cannot be: $x e^{-x^2}$ is positive on the whole interval. With the new limits, $u$ runs from $0$ to $-1$, and you get $-\tfrac12(e^{-1} - 1) = 0.316$, which is right.
:::

::: warning Two slips in integration by parts
First: $v$ is the antiderivative of $dv$, not $dv$ itself, and the second term has a minus sign. Second: choosing $u$ badly — differentiating the exponential and integrating the power — turns $\int x e^x\,dx$ into $\int x^2 e^x\,dx$, a step backward. If the new integral is harder than the old one, swap the roles.
:::

::: note Doing parts as a table
Repeated integration by parts on $\int x^n e^{x}\,dx$ or $\int x^n\sin x\,dx$ can be laid out as a table. In one column, differentiate $x^n$ until it hits zero. In the other, integrate $e^x$ again and again. Then multiply along the diagonals, with signs alternating $+, -, +, \ldots$.

For $\int x^2 e^x\,dx$ the columns are $x^2, 2x, 2, 0$ and $e^x, e^x, e^x, e^x$. The diagonals give $+x^2e^x - 2xe^x + 2e^x = e^x(x^2 - 2x + 2)$. You will use this layout when a **moment** of a probability density — an integral $\int x^n p(x)\,dx$ — needs a formula.
:::

## Check yourself

::: check
Evaluate $\displaystyle\int_0^2 t\,e^{-t^2}\,dt$.
:::

::: answer
Let $u = -t^2$, so $du = -2t\,dt$ and $t\,dt = -\tfrac12 du$. Move the limits: $t = 0$ gives $u = 0$, and $t = 2$ gives $u = -4$.

$$
-\frac12\int_0^{-4} e^u\,du = -\frac12\big[e^u\big]_0^{-4} = -\frac12\left(e^{-4} - 1\right) = \frac12\left(1 - e^{-4}\right) = 0.4908.
$$

A midpoint sum confirms $0.49084$. Sanity check: the answer is positive, as it must be for a positive integrand, and less than the $\tfrac12$ you would get by running to infinity.
:::

::: check
Evaluate $\displaystyle\int_0^{\pi/4}\tan x\,dx$.
:::

::: answer
Write $\tan x = \dfrac{\sin x}{\cos x}$ and let $u = \cos x$, so $du = -\sin x\,dx$. Move the limits: $x = 0$ gives $u = 1$, and $x = \pi/4$ gives $u = 1/\sqrt2$.

$$
\int_1^{1/\sqrt2}\frac{-du}{u} = -\big[\ln u\big]_1^{1/\sqrt2} = -\ln\frac{1}{\sqrt2} = \tfrac12\ln 2 = 0.3466.
$$

The same thing in $x$: $[-\ln\cos x]_0^{\pi/4} = -\ln(1/\sqrt2)$.
:::

::: check
Evaluate $\displaystyle\int_0^\pi x\cos x\,dx$.
:::

::: answer
Parts, with $u = x$ and $dv = \cos x\,dx$, so $du = dx$ and $v = \sin x$:

$$
\big[x\sin x\big]_0^\pi - \int_0^\pi\sin x\,dx = (\pi\sin\pi - 0) - \big[-\cos x\big]_0^\pi = 0 - (1 + 1) = -2.
$$

The boundary term vanishes because $\sin$ is zero at both limits. Why negative? $\cos x$ is positive on $[0, \pi/2]$ and negative on $[\pi/2, \pi]$, in matching amounts. But the factor $x$ is bigger on the second half, so the negative part wins.
:::

::: check
Evaluate $\displaystyle\int_0^1\arctan x\,dx$.
:::

::: answer
Parts, with $u = \arctan x$ and $dv = dx$, so $du = \dfrac{dx}{1 + x^2}$ and $v = x$:

$$
\big[x\arctan x\big]_0^1 - \int_0^1\frac{x\,dx}{1 + x^2}.
$$

The boundary term is $1 \cdot \arctan 1 - 0 = \pi/4$. For the leftover integral substitute $w = 1 + x^2$, $dw = 2x\,dx$, with limits $1$ to $2$: $\tfrac12\displaystyle\int_1^2\frac{dw}{w} = \tfrac12\ln 2$. So the result is

$$
\frac{\pi}{4} - \frac{\ln 2}{2} = 0.7854 - 0.3466 = 0.4388.
$$

Sanity check: $\arctan x$ runs from $0$ to $0.785$ on this interval, so its average should be somewhere in between — and $0.4388$ is.
:::

::: check
Show by integration by parts that $\displaystyle\int_0^{\pi/2}\sin^2 x\,dx = \dfrac{\pi}{4}$. Confirm it with the identity $\sin^2 x = \tfrac12(1 - \cos 2x)$.
:::

::: answer
**By parts.** Let $J = \displaystyle\int\sin^2 x\,dx$. Take $u = \sin x$ and $dv = \sin x\,dx$, so $du = \cos x\,dx$ and $v = -\cos x$:

$$
J = -\sin x\cos x + \int\cos^2 x\,dx = -\sin x\cos x + \int(1 - \sin^2 x)\,dx = -\sin x\cos x + x - J.
$$

$J$ came back, as in the damped cosine. Solve: $2J = x - \sin x\cos x$, so $J = \tfrac12(x - \sin x\cos x)$. On $[0, \pi/2]$ the $\sin x\cos x$ part is zero at both ends, leaving $\tfrac12\cdot\tfrac{\pi}{2} = \tfrac{\pi}{4} = 0.785$.

**By the identity.**

$$
\frac12\int_0^{\pi/2}(1 - \cos 2x)\,dx = \frac12\Big[x - \tfrac12\sin 2x\Big]_0^{\pi/2} = \frac{\pi}{4}.
$$

So the average of $\sin^2$ over a quarter turn is $\tfrac12$. That is why the **[[RMS|rms]]** value of a sine wave is its peak divided by $\sqrt2$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Substitution | $\displaystyle\int f(u(x))\,u'(x)\,dx = \int f(u)\,du$, with $du = u'(x)\,dx$; move the limits |
| Straight-line inside | $\int e^{kx}dx = \tfrac1k e^{kx}$; $\int\cos(\omega t + \phi)\,dt = \tfrac1\omega\sin(\omega t + \phi)$ |
| Function next to its derivative | $\int x e^{-x^2}dx = -\tfrac12 e^{-x^2}$; $\int\tan x\,dx = -\ln\lvert\cos x\rvert$ |
| Trig substitution | $\sqrt{a^2 - x^2}$: $x = a\sin\theta$; $\sqrt{a^2 + x^2}$: $x = a\tan\theta$; $\sqrt{x^2 - a^2}$: $x = a\sec\theta$ |
| Integration by parts | $\displaystyle\int u\,dv = uv - \int v\,du$ |
| Choosing $u$ | LIATE: logarithm, inverse trig, algebraic, trig, exponential — first in the list is $u$ |
| Power times exponential | $\int x e^{-x/\tau}dx = -\tau(x + \tau)e^{-x/\tau}$; $\int x^2 e^x dx = e^x(x^2 - 2x + 2)$ |
| Damped cosine | $\displaystyle\int e^{-at}\cos\omega t\,dt = \frac{e^{-at}(\omega\sin\omega t - a\cos\omega t)}{a^2 + \omega^2}$ |
| Column mass | $\displaystyle\int_0^h\rho_0 e^{-z/H}dz = \rho_0 H(1 - e^{-h/H})$ |
| No formula | $e^{-x^2}$, $\sin x/x$, $\sqrt{1 - k^2\sin^2\theta}$ |

Several results here begged to have their upper limit sent to infinity: the total column of air, the top speed of the fading thruster, the Laplace transform. The next lesson makes those limits precise as **improper integrals**, and shows when they give a finite number.

::: context scale-height What a scale height is
The scale height $H$ is the climb over which the air's density drops by a factor of $e \approx 2.718$. With $H = 7.5\,\mathrm{km}$, the air at $7.5\,\mathrm{km}$ is about $37\%$ as dense as at sea level, at $15\,\mathrm{km}$ about $14\%$, and so on — the same fraction lost for every equal step up. The last lesson of this module derives this exponential shape from the physics of air, and shows why $H$ depends on temperature.
:::

::: context atmosphere-picture Most of the air is low down
The curve is the model density $\rho = 1.225\,e^{-z/7.5}$ in $\mathrm{kg/m^3}$, plotted against height $z$ from $0$ to $40\,\mathrm{km}$. The shaded area, from the ground to $10\,\mathrm{km}$, is $M(10\,\mathrm{km})$ — about three-quarters of the whole area under the curve, which is the total column $\rho_0 H$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 195" font-family="Inter, Arial, sans-serif">
  <polygon points="40,170 40.0,35.2 43.5,43.9 47.0,52.1 50.5,59.7 54.0,66.8 57.5,73.4 61.0,79.7 64.5,85.5 68.0,90.9 71.5,96.0 75.0,100.8 78.5,105.3 82.0,109.5 85.5,113.4 89.0,117.0 92.5,120.4 96.0,123.6 99.5,126.6 103.0,129.4 106.5,132.0 110.0,134.5 110,170" fill="#8fb8f0"/>
  <line x1="40" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,35.2 54.0,66.8 68.0,90.9 82.0,109.5 96.0,123.6 110.0,134.5 124.0,142.8 138.0,149.2 152.0,154.0 166.0,157.8 180.0,160.6 194.0,162.8 208.0,164.5 222.0,165.8 236.0,166.8 250.0,167.5 264.0,168.1 278.0,168.6 292.0,168.9 306.0,169.2 320.0,169.3"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="185">0</text><text x="110" y="185">10</text><text x="180" y="185">20</text><text x="250" y="185">30</text><text x="320" y="185">40 km</text>
  </g>
  <text x="34" y="64" font-size="11" fill="#1f2a44" text-anchor="end">1.0</text>
  <text x="34" y="119" font-size="11" fill="#1f2a44" text-anchor="end">0.5</text>
  <line x1="36" y1="60" x2="44" y2="60" stroke="#1f2a44" stroke-width="1"/>
  <line x1="36" y1="115" x2="44" y2="115" stroke="#1f2a44" stroke-width="1"/>
  <text x="120" y="100" font-size="12" fill="#1f2a44">74% of the air</text>
  <text x="190" y="140" font-size="12" fill="#1d6fd1">density ρ(z)</text>
</svg>
```
:::

::: context tank-level Reading a tank's level
A round tank lying on its side holds liquid whose volume is its length times the wetted area of the circular end. That area, as a function of the liquid's depth, is an integral of $\sqrt{R^2 - x^2}$ between two limits — the quarter-circle integral with a moving upper limit. The answer is not a straight line: near half full, a small change in level means a lot of liquid; near the bottom or top, very little. A level sensor's reading has to be converted through this curve before anyone can say how much propellant is on board.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <path d="M111.3,125.0 A75,75 0 0,0 248.7,125.0 Z" fill="#8fb8f0"/>
  <circle cx="180" cy="95" r="75" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="111.3" y1="125.0" x2="248.7" y2="125.0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="275" y1="170" x2="275" y2="125.0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="269" y1="170" x2="281" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="269" y1="125.0" x2="281" y2="125.0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="287" y="152" font-size="12" fill="#1f2a44">level</text>
  <line x1="180" y1="95" x2="118.6" y2="52.0" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <text x="135" y="85" font-size="12" fill="#6c7a93">R</text>
  <text x="180" y="151" font-size="12" fill="#1f2a44" text-anchor="middle">wetted area</text>
  <text x="180" y="185" font-size="11" fill="#1f2a44" text-anchor="middle">tank end, filled to 0.6 R</text>
</svg>
```
:::

::: context parts-picture Integration by parts as two areas
As $u$ and $v$ change together, they trace out a curve. The blue area under the curve is $\int v\,du$; the orange area to its left is $\int u\,dv$. Together they fill the big rectangle $u_2 v_2$, minus the small blank corner $u_1 v_1$. So $\int u\,dv + \int v\,du = \big[uv\big]$, which rearranges to the formula.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="100.0,180 100.0,144.0 106.0,130.0 112.0,122.7 118.0,116.9 124.0,111.8 130.0,107.1 136.0,102.9 142.0,98.9 148.0,95.1 154.0,91.6 160.0,88.1 166.0,84.8 172.0,81.7 178.0,78.6 184.0,75.6 190.0,72.7 196.0,69.9 202.0,67.2 208.0,64.5 214.0,61.9 220.0,59.3 226.0,56.8 232.0,54.3 238.0,51.9 244.0,49.5 250.0,47.2 256.0,44.9 262.0,42.6 268.0,40.4 274.0,38.2 280.0,36.0 280.0,180" fill="#8fb8f0"/>
  <polygon points="40,144.0 100.0,144.0 106.0,130.0 112.0,122.7 118.0,116.9 124.0,111.8 130.0,107.1 136.0,102.9 142.0,98.9 148.0,95.1 154.0,91.6 160.0,88.1 166.0,84.8 172.0,81.7 178.0,78.6 184.0,75.6 190.0,72.7 196.0,69.9 202.0,67.2 208.0,64.5 214.0,61.9 220.0,59.3 226.0,56.8 232.0,54.3 238.0,51.9 244.0,49.5 250.0,47.2 256.0,44.9 262.0,42.6 268.0,40.4 274.0,38.2 280.0,36.0 40,36.0" fill="#f2b880"/>
  <rect x="40" y="144" width="60" height="36" fill="#fff" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="40" y1="180" x2="300" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="100.0,144.0 112.0,122.7 124.0,111.8 136.0,102.9 148.0,95.1 160.0,88.1 172.0,81.7 184.0,75.6 196.0,69.9 208.0,64.5 220.0,59.3 232.0,54.3 244.0,49.5 256.0,44.9 268.0,40.4 280.0,36.0"/>
  <text x="200" y="140" font-size="13" fill="#1f2a44" text-anchor="middle">∫ v du</text>
  <text x="110" y="75" font-size="13" fill="#1f2a44" text-anchor="middle">∫ u dv</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="100" y="194">u₁</text><text x="280" y="194">u₂</text>
  </g>
  <text x="34" y="148" font-size="11" fill="#1f2a44" text-anchor="end">v₁</text>
  <text x="34" y="40" font-size="11" fill="#1f2a44" text-anchor="end">v₂</text>
</svg>
```
:::

::: context liate Where LIATE comes from
LIATE is a classroom memory aid, not a law. It ranks function types by how much differentiating helps them. Logarithms and inverse trig functions turn into simple fractions when differentiated, so they make great $u$'s. Exponentials barely notice being integrated, so they make great $dv$'s. When the two factors are near each other in the list, like trig and exponential, expect to go around twice, as in the damped cosine.
:::

::: context laplace The Laplace transform
Pierre-Simon Laplace was a French mathematician and astronomer around 1800. The transform named after him multiplies a signal $f(t)$ by $e^{-st}$ and integrates from $0$ to infinity, turning a function of time into a function of $s$. Its magic is that differentiation in time becomes multiplication by $s$, so differential equations become algebra. Control engineers use it daily to describe how a system responds, through **transfer functions**.
:::

::: context cold-gas Cold-gas thrusters
A cold-gas thruster lets a compressed gas, often nitrogen, out through a nozzle — no burning at all. It is simple, clean and very reliable, but weak: its specific impulse is only around $70\,\mathrm{s}$. As gas leaves, the tank pressure falls, and with it the thrust, which is why a fading exponential is a reasonable first model. Small satellites and astronaut maneuvering units have used them for fine attitude control.
:::

::: context convolution Convolution, in a sentence
Every push $a(t)\,dt$ adds speed that then carries the vehicle forward for the remaining time $T - t$, so it adds $(T - t)\,a(t)\,dt$ to the distance. Adding up all the pushes gives $\int_0^T (T - t)\,a(t)\,dt$. Replace "time left over" with any system's response to a single short kick, and you have the general convolution: the output of a linear system is the sum of its responses to every little piece of the input.
:::

::: context elliptic Why a wide swing has no formula
For small swings, a pendulum's period is $2\pi\sqrt{L/g}$, whatever the swing size. For wide swings, the exact period involves the integral $\int_0^{\pi/2} \dfrac{d\theta}{\sqrt{1 - k^2\sin^2\theta}}$, where $k$ depends on how wide the swing is. It is called an **elliptic integral**, because a relative of it gives the length around an ellipse. It has no formula in ordinary functions, so it is computed numerically or looked up.
:::

::: context rms Root mean square
RMS stands for root mean square: square the signal, take the mean (average), then take the square root. For a sine wave of peak $A$, the average of $A^2\sin^2$ is $A^2/2$, so the RMS is $A/\sqrt2 \approx 0.707A$. It measures a wobbling signal's "effective size". A wall socket rated $120$ volts is quoting RMS; its peak is about $170$ volts. Engineers quote vibration and sensor noise levels the same way.
:::
