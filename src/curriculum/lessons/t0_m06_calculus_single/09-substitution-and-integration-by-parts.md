---
id: l09-substitution-and-integration-by-parts
title: Substitution and integration by parts
minutes: 23
covers:
  - integration by parts and substitution
---

The fundamental theorem turned every definite integral into a search for an antiderivative, and the table at the end of the last lesson covers the atoms. The integrals a GNC engineer actually meets are rarely atoms. The mass of atmosphere above a given altitude is $\int \rho_0 e^{-z/H}\,dz$. The distance a vehicle covers under a thrust that decays exponentially is $\int t\,e^{-t/\tau}\,dt$. The response of a damped oscillator, and the Laplace transform that the controls module is built on, are integrals of $e^{-at}\cos\omega t$. The mean of a probability distribution is $\int x\,p(x)\,dx$ for whatever density $p$ describes the sensor. None of these is in the table, and all of them yield to two techniques.

The techniques are the two differentiation rules you know best, run backwards. **Substitution** is the chain rule in reverse: it recognises an inner function and its derivative sitting together in the integrand. **Integration by parts** is the product rule in reverse: it trades one integral for another that is easier. Between them they cover the great majority of integrals that have closed forms, and — as important — they train the eye to see when an integral has no closed form and must go to a numerical routine.

## Substitution: the chain rule reversed

If $F' = f$ and $u$ is a differentiable function of $x$, the chain rule says

$$
\frac{d}{dx}F\big(u(x)\big) = f\big(u(x)\big)\,u'(x).
$$

Read from right to left, this is a statement about antiderivatives: whenever an integrand has the form "some function of $u(x)$, multiplied by $u'(x)$", its antiderivative is $F(u(x))$:

$$
\int f\big(u(x)\big)\,u'(x)\,dx = F\big(u(x)\big) + C = \int f(u)\,du.
$$

The last form is how the method is used. Name the inner function $u = u(x)$, write its differential $du = u'(x)\,dx$, and replace both in the integrand; what is left is an integral in $u$ alone, which you look up. The differential notation of the linearisation lesson is what makes this a mechanical substitution rather than an act of recognition: $du$ really does equal $u'(x)\,dx$ to first order, and the change of variable in the integral is exact.

For a definite integral the limits must move with the variable. If $x$ runs from $a$ to $b$, then $u$ runs from $u(a)$ to $u(b)$:

$$
\int_a^b f\big(u(x)\big)\,u'(x)\,dx = \int_{u(a)}^{u(b)} f(u)\,du.
$$

Changing the limits saves you from substituting back, and forgetting to change them is the commonest error in the subject.

Three patterns account for most substitutions:

- **A linear inner function**, $u = kx + c$, $du = k\,dx$. So $\int e^{kx}\,dx = \tfrac1k e^{kx} + C$ and $\int \cos(\omega t + \phi)\,dt = \tfrac1\omega\sin(\omega t + \phi) + C$. The factor $1/k$ is the whole content: differentiate to check.
- **A function next to its derivative**: $\int x e^{-x^2}\,dx$ with $u = -x^2$, $du = -2x\,dx$, giving $-\tfrac12 e^{-x^2} + C$; or $\int \tan x\,dx = \int \dfrac{\sin x}{\cos x}\,dx$ with $u = \cos x$, $du = -\sin x\,dx$, giving $-\ln|\cos x| + C$. The derivative need not appear exactly — a missing constant factor is supplied and compensated.
- **A scaling substitution** that reduces to a table entry: $\int \dfrac{dx}{a^2 + x^2}$ with $x = au$, $dx = a\,du$, becomes $\dfrac1a\int\dfrac{du}{1 + u^2} = \dfrac1a\arctan\dfrac{x}{a} + C$.

::: example Mass of atmosphere above the ground
With an exponential atmosphere $\rho(z) = \rho_0 e^{-z/H}$, $\rho_0 = 1.225\,\mathrm{kg/m^3}$, $H = 7.5\,\mathrm{km}$, find the mass per unit area of air between the ground and altitude $h$, and the total column mass.

$M(h) = \displaystyle\int_0^h \rho_0 e^{-z/H}\,dz$. Substitute $u = -z/H$, so $du = -dz/H$ and $dz = -H\,du$; the limits become $u = 0$ to $u = -h/H$:

$$
M(h) = \rho_0\int_0^{-h/H} e^{u}\,(-H)\,du = -\rho_0 H\big[e^u\big]_0^{-h/H} = \rho_0 H\left(1 - e^{-h/H}\right).
$$

Check by differentiating: $M'(h) = \rho_0 H \cdot e^{-h/H}/H = \rho(h)$. Numbers: $\rho_0 H = 1.225 \times 7500 = 9188\,\mathrm{kg/m^2}$ is the total column, and $M(10\,\mathrm{km}) = 9188(1 - e^{-1.333}) = 6766\,\mathrm{kg/m^2}$: three-quarters of the atmosphere lies below $10\,\mathrm{km}$, and $99.9\%$ below $50\,\mathrm{km}$. Multiplying the column mass by $g_0$ gives the surface pressure it exerts, $9188 \times 9.80665 = 90.1\,\mathrm{kPa}$, against the real $101.3\,\mathrm{kPa}$. A scale height of $8.43\,\mathrm{km}$ would reproduce sea-level pressure exactly; $7.5\,\mathrm{km}$ fits the density profile better higher up, where ascent loads and re-entry heating happen. No single exponential fits the whole atmosphere, and the model choice depends on which integral you care about.
:::

::: example A quarter circle by trigonometric substitution
Verify that $\displaystyle\int_0^R\sqrt{R^2 - x^2}\,dx = \dfrac{\pi R^2}{4}$, the area of a quarter disc.

The square root of a difference of squares suggests $x = R\sin\theta$, so $dx = R\cos\theta\,d\theta$ and $\sqrt{R^2 - x^2} = R\cos\theta$ for $0 \le \theta \le \pi/2$. The limits $x = 0, R$ become $\theta = 0, \pi/2$:

$$
\int_0^R\sqrt{R^2 - x^2}\,dx = \int_0^{\pi/2} R\cos\theta \cdot R\cos\theta\,d\theta = R^2\int_0^{\pi/2}\cos^2\theta\,d\theta.
$$

Use $\cos^2\theta = \tfrac12(1 + \cos 2\theta)$, then the linear substitution for $\cos 2\theta$: $R^2\Big[\tfrac{\theta}{2} + \tfrac{\sin 2\theta}{4}\Big]_0^{\pi/2} = R^2\cdot\dfrac{\pi}{4}$. This substitution runs the other way from the previous one — $x$ is expressed as a function of the new variable rather than $u$ as a function of $x$ — and it is the standard move for $\sqrt{a^2 - x^2}$, $\sqrt{a^2 + x^2}$ (use $x = a\tan\theta$) and $\sqrt{x^2 - a^2}$ (use $x = a\sec\theta$). The same integral computes the cross-sectional area of a partially filled cylindrical tank as a function of liquid level.
:::

## Integration by parts: the product rule reversed

The product rule, $(uv)' = u'v + uv'$, integrated over an interval, gives $uv = \int u'v\,dx + \int uv'\,dx$. Rearranged, and written with differentials $du = u'\,dx$, $dv = v'\,dx$:

$$
\int u\,dv = uv - \int v\,du.
$$

For a definite integral the boundary term is evaluated at the limits:

$$
\int_a^b u\,\frac{dv}{dx}\,dx = \Big[uv\Big]_a^b - \int_a^b v\,\frac{du}{dx}\,dx.
$$

You split the integrand into a factor $u$ that you will differentiate and a factor $dv$ that you will integrate. The move pays when $v\,du$ is simpler than $u\,dv$, which happens when differentiating $u$ makes it simpler (a power of $x$ loses a degree; $\ln x$ and $\arctan x$ become algebraic) while integrating $dv$ does not make it worse (exponentials and sinusoids stay exponentials and sinusoids). A useful order of preference for $u$ is logarithm, inverse trigonometric, algebraic, trigonometric, exponential — take $u$ to be whichever factor comes earliest in that list. It is a heuristic, not a theorem, but it rarely fails.

::: key
Integration by parts: $\displaystyle\int u\,dv = uv - \int v\,du$. Choose $u$ to be the factor that simplifies when differentiated and $dv$ the factor that stays tame when integrated.
:::

Three standard cases:

- **Power times exponential.** $\int x e^{-x/\tau}\,dx$: take $u = x$, $dv = e^{-x/\tau}\,dx$, so $du = dx$ and $v = -\tau e^{-x/\tau}$. Then $\int x e^{-x/\tau}\,dx = -\tau x e^{-x/\tau} + \tau\int e^{-x/\tau}\,dx = -\tau x e^{-x/\tau} - \tau^2 e^{-x/\tau} + C = -\tau(x + \tau)e^{-x/\tau} + C$. Differentiate to confirm: $-\tau e^{-x/\tau} + (x + \tau)e^{-x/\tau} = x e^{-x/\tau}$. A higher power needs the same step repeated: $\int x^2 e^x\,dx = e^x(x^2 - 2x + 2) + C$, and $\int_0^1 x^2 e^x\,dx = e - 2 = 0.718$.
- **A lone logarithm or inverse function.** $\int \ln x\,dx$: there seems to be only one factor, so take $dv = dx$, $u = \ln x$: $x\ln x - \int x\cdot\dfrac{dx}{x} = x\ln x - x + C$. Likewise $\int\arctan x\,dx = x\arctan x - \int\dfrac{x\,dx}{1 + x^2} = x\arctan x - \tfrac12\ln(1 + x^2) + C$, the last step by substitution.
- **Exponential times sinusoid.** Neither factor simplifies, but two rounds bring the original integral back with a coefficient, and you solve for it algebraically — the next example.

::: example The damped cosine integral
Evaluate $I = \displaystyle\int e^{-at}\cos\omega t\,dt$, and then $\displaystyle\int_0^5 e^{-0.5t}\cos 2t\,dt$.

Take $u = \cos\omega t$, $dv = e^{-at}\,dt$, so $du = -\omega\sin\omega t\,dt$ and $v = -\tfrac1a e^{-at}$:

$$
I = -\frac{1}{a}e^{-at}\cos\omega t - \frac{\omega}{a}\int e^{-at}\sin\omega t\,dt.
$$

Apply parts again to the new integral with $u = \sin\omega t$, $dv = e^{-at}\,dt$:

$$
\int e^{-at}\sin\omega t\,dt = -\frac{1}{a}e^{-at}\sin\omega t + \frac{\omega}{a}\int e^{-at}\cos\omega t\,dt = -\frac{1}{a}e^{-at}\sin\omega t + \frac{\omega}{a}I.
$$

Substitute back: $I = -\dfrac1a e^{-at}\cos\omega t + \dfrac{\omega}{a^2}e^{-at}\sin\omega t - \dfrac{\omega^2}{a^2}I$. Collect the two copies of $I$: $\left(1 + \dfrac{\omega^2}{a^2}\right)I = \dfrac{e^{-at}}{a^2}\left(-a\cos\omega t + \omega\sin\omega t\right)$, so

$$
\int e^{-at}\cos\omega t\,dt = \frac{e^{-at}\left(\omega\sin\omega t - a\cos\omega t\right)}{a^2 + \omega^2} + C.
$$

With $a = 0.5$, $\omega = 2$: the antiderivative at $t = 5$ is $e^{-2.5}(2\sin 10 - 0.5\cos 10)/4.25 = 0.08208 \times (-1.0880 + 0.4195)/4.25 = -0.01291$, and at $t = 0$ it is $-0.5/4.25 = -0.11765$. The definite integral is $-0.01291 + 0.11765 = 0.1047$, and a midpoint sum with $200\,000$ pieces gives $0.10474$. Let the upper limit go to infinity and $e^{-at} \to 0$ kills the boundary term, leaving $\dfrac{a}{a^2 + \omega^2}$; replace $a$ by $s$ and that is the Laplace transform of $\cos\omega t$, $\dfrac{s}{s^2 + \omega^2}$, which the ODE module will use to read a damped oscillator's frequency off a transfer function. Every entry in the Laplace table is an integration by parts of this kind.
:::

::: example Distance under a decaying thrust
A cold-gas thruster's acceleration tails off as its tank empties: $a(t) = a_0 e^{-t/\tau}$ with $a_0 = 2\,\mathrm{m/s^2}$ and $\tau = 2\,\mathrm{s}$. Over $T = 10\,\mathrm{s}$ from rest, find the velocity gained and the distance covered, the latter by two different routes.

Velocity is the integral of acceleration; by the linear substitution, $v(t) = \displaystyle\int_0^t a_0 e^{-s/\tau}\,ds = a_0\tau\left(1 - e^{-t/\tau}\right)$. At $T$: $v = 2 \times 2 \times (1 - e^{-5}) = 4 \times 0.99326 = 3.973\,\mathrm{m/s}$, within $0.7\%$ of the asymptote $a_0\tau = 4\,\mathrm{m/s}$ that an infinitely long burn would reach.

Route one for distance: integrate $v$ directly. $x(T) = a_0\tau\displaystyle\int_0^T\left(1 - e^{-t/\tau}\right)dt = a_0\tau\Big[T - \tau\left(1 - e^{-T/\tau}\right)\Big] = 4\,(10 - 2 \times 0.99326) = 32.05\,\mathrm{m}$.

Route two: integrate by parts with $u = v(t)$, $dv = dt$, so that $du = a(t)\,dt$:

$$
x(T) = \int_0^T v\,dt = \Big[t\,v(t)\Big]_0^T - \int_0^T t\,a(t)\,dt = T\,v(T) - a_0\int_0^T t\,e^{-t/\tau}\,dt.
$$

The remaining integral is the power-times-exponential case: $\displaystyle\int_0^T t e^{-t/\tau}\,dt = \Big[-\tau(t + \tau)e^{-t/\tau}\Big]_0^T = \tau^2\Big[1 - e^{-T/\tau}\left(1 + \tfrac{T}{\tau}\right)\Big] = 4\,(1 - 6 e^{-5}) = 3.838\,\mathrm{s^2}$. So $x(T) = 10 \times 3.973 - 2 \times 3.838 = 39.73 - 7.68 = 32.05\,\mathrm{m}$. The two routes agree. The second has a physical reading: $\int_0^T t\,a(t)\,dt$ weights each increment of velocity by *when* it was delivered, and the formula says distance is "final velocity times elapsed time, less a correction for velocity gained late". Reversing the order — $x(T) = \int_0^T (T - t)\,a(t)\,dt$ — is the convolution of the acceleration with a ramp, the form in which the ODE module writes the response of any linear system to any input.
:::

## Choosing between the two

Look at the integrand and ask two questions in order. Is there an inner function whose derivative is also present, up to a constant? Then substitute. Is the integrand a product of two dissimilar kinds of function — a polynomial with an exponential, a logarithm with anything? Then integrate by parts. Some integrals need both, in sequence: $\int \arctan x\,dx$ needed parts and then a substitution; $\int x^3 e^{-x^2}\,dx$ needs the substitution $u = x^2$ first, turning it into $\tfrac12\int u\,e^{-u}\,du$, and then parts.

Some integrals need neither, because they have no elementary antiderivative at all: $\int e^{-x^2}\,dx$, $\int \dfrac{\sin x}{x}\,dx$, $\int \sqrt{1 - k^2\sin^2\theta}\,d\theta$ (the arc length of an ellipse, hence the period of a large-amplitude pendulum). Recognising these quickly is a skill; the answer is a numerical quadrature or a named special function, and no amount of technique will produce a formula.

::: warning
When substituting in a definite integral, change the limits or substitute back — never mix. Writing $\int_0^1 x e^{-x^2}\,dx = -\tfrac12\int_0^1 e^u\,du$ with the *old* limits gives $-\tfrac12(e - 1)$, negative and wrong; with the new limits $u = 0 \to -1$ it gives $-\tfrac12(e^{-1} - 1) = 0.316$, which is right. If you keep the limits in $x$, you must return to $x$ before evaluating.
:::

::: warning
In integration by parts, $v$ is the antiderivative of $dv$, not $dv$ itself, and the sign of the second term is minus. Choosing $u$ badly — differentiating the exponential and integrating the power — produces $\int x^2 e^x\,dx$ from $\int x e^x\,dx$, a step backwards. If the new integral is harder than the old, swap the roles.
:::

::: note
Repeated integration by parts on $\int x^n e^{x}\,dx$ or $\int x^n\sin x\,dx$ can be organised as a table: differentiate $x^n$ down to zero in one column, integrate $e^x$ repeatedly in the other, and combine diagonally with alternating signs. For $\int x^2 e^x\,dx$ the columns are $x^2, 2x, 2, 0$ and $e^x, e^x, e^x, e^x$, giving $e^x(x^2 - 2x + 2)$. This tabular form is what you will actually use when a moment integral $\int x^n p(x)\,dx$ of a probability density needs a closed form.
:::

## Check yourself

::: check
Evaluate $\displaystyle\int_0^2 t\,e^{-t^2}\,dt$.
:::

::: answer
Let $u = -t^2$, $du = -2t\,dt$, so $t\,dt = -\tfrac12 du$; limits $t = 0 \to u = 0$, $t = 2 \to u = -4$. The integral is $-\tfrac12\displaystyle\int_0^{-4} e^u\,du = -\tfrac12\big[e^u\big]_0^{-4} = -\tfrac12\left(e^{-4} - 1\right) = \tfrac12\left(1 - e^{-4}\right) = 0.4908$. A midpoint sum confirms $0.49084$.
:::

::: check
Evaluate $\displaystyle\int_0^{\pi/4}\tan x\,dx$.
:::

::: answer
Write $\tan x = \dfrac{\sin x}{\cos x}$ and let $u = \cos x$, $du = -\sin x\,dx$. Limits: $x = 0 \to u = 1$, $x = \pi/4 \to u = 1/\sqrt2$. Then $\displaystyle\int_1^{1/\sqrt2}\frac{-du}{u} = -\big[\ln u\big]_1^{1/\sqrt2} = -\ln\frac{1}{\sqrt2} = \tfrac12\ln 2 = 0.3466$. Equivalently $[-\ln\cos x]_0^{\pi/4} = -\ln(1/\sqrt2)$.
:::

::: check
Evaluate $\displaystyle\int_0^\pi x\cos x\,dx$.
:::

::: answer
Parts with $u = x$, $dv = \cos x\,dx$, so $du = dx$, $v = \sin x$: $\big[x\sin x\big]_0^\pi - \displaystyle\int_0^\pi\sin x\,dx = (\pi\sin\pi - 0) - \big[-\cos x\big]_0^\pi = 0 - (1 + 1) = -2$. The boundary term vanishes because $\sin$ is zero at both limits; the sign is negative because $x\cos x$ is negative over most of $[\pi/2, \pi]$, where $x$ is largest.
:::

::: check
Evaluate $\displaystyle\int_0^1\arctan x\,dx$.
:::

::: answer
Parts with $u = \arctan x$, $dv = dx$: $du = \dfrac{dx}{1 + x^2}$, $v = x$. So $\big[x\arctan x\big]_0^1 - \displaystyle\int_0^1\frac{x\,dx}{1 + x^2}$. The boundary term is $\arctan 1 = \pi/4$. For the remaining integral substitute $w = 1 + x^2$, $dw = 2x\,dx$, limits $1 \to 2$: $\tfrac12\displaystyle\int_1^2\frac{dw}{w} = \tfrac12\ln 2$. Result: $\dfrac{\pi}{4} - \dfrac{\ln 2}{2} = 0.7854 - 0.3466 = 0.4388$.
:::

::: check
Show by integration by parts that $\displaystyle\int_0^{\pi/2}\sin^2 x\,dx = \dfrac{\pi}{4}$, and confirm with the identity $\sin^2 x = \tfrac12(1 - \cos 2x)$.
:::

::: answer
Let $J = \displaystyle\int\sin^2 x\,dx$ with $u = \sin x$, $dv = \sin x\,dx$, so $du = \cos x\,dx$, $v = -\cos x$: $J = -\sin x\cos x + \displaystyle\int\cos^2 x\,dx = -\sin x\cos x + \int(1 - \sin^2 x)\,dx = -\sin x\cos x + x - J$. Hence $2J = x - \sin x\cos x$ and $J = \tfrac12(x - \sin x\cos x)$. Over $[0, \pi/2]$ the $\sin x\cos x$ term vanishes at both ends, giving $\tfrac12\cdot\tfrac{\pi}{2} = \tfrac{\pi}{4} = 0.785$. By the identity: $\tfrac12\displaystyle\int_0^{\pi/2}(1 - \cos 2x)\,dx = \tfrac12\Big[x - \tfrac12\sin 2x\Big]_0^{\pi/2} = \tfrac{\pi}{4}$. The mean of $\sin^2$ over a quarter period is $\tfrac12$, which is why RMS is peak over $\sqrt2$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Substitution | $\displaystyle\int f(u(x))\,u'(x)\,dx = \int f(u)\,du$, with $du = u'(x)\,dx$; change the limits |
| Linear inner function | $\int e^{kx}dx = \tfrac1k e^{kx}$; $\int\cos(\omega t + \phi)\,dt = \tfrac1\omega\sin(\omega t + \phi)$ |
| Function next to derivative | $\int x e^{-x^2}dx = -\tfrac12 e^{-x^2}$; $\int\tan x\,dx = -\ln\lvert\cos x\rvert$ |
| Trig substitution | $\sqrt{a^2 - x^2}$: $x = a\sin\theta$; $\sqrt{a^2 + x^2}$: $x = a\tan\theta$ |
| Integration by parts | $\displaystyle\int u\,dv = uv - \int v\,du$ |
| Choosing $u$ | Logarithm, inverse trig, algebraic, trig, exponential — earliest is $u$ |
| Power times exponential | $\int x e^{-x/\tau}dx = -\tau(x + \tau)e^{-x/\tau}$; $\int x^2 e^x dx = e^x(x^2 - 2x + 2)$ |
| Damped cosine | $\displaystyle\int e^{-at}\cos\omega t\,dt = \frac{e^{-at}(\omega\sin\omega t - a\cos\omega t)}{a^2 + \omega^2}$ |
| Column mass | $\displaystyle\int_0^h\rho_0 e^{-z/H}dz = \rho_0 H(1 - e^{-h/H})$ |
| No elementary antiderivative | $e^{-x^2}$, $\sin x/x$, $\sqrt{1 - k^2\sin^2\theta}$ |

Several results here begged to have their upper limit sent to infinity — the total column mass, the asymptotic velocity, the Laplace transform. The next lesson makes those limits precise as improper integrals and shows when they exist.
