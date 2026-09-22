---
id: l04-implicit-differentiation-related-rates
title: Implicit differentiation and related rates
minutes: 22
covers:
  - implicit differentiation and related rates
---

Not every relationship comes as $y = f(x)$. An orbit is the set of points satisfying $x^2/a^2 + y^2/b^2 = 1$, an equation that ties $x$ and $y$ together without handing you $y$ as a function. Kepler's equation $M = E - e\sin E$ defines the eccentric anomaly $E$ in terms of the mean anomaly $M$, and no amount of algebra will solve it for $E$ — yet every orbit propagator needs $dE/dM$. A radar tracking an ascending vehicle measures range and elevation angle, and what the tracker wants is how those are changing, given the vehicle's velocity. Each of these is a derivative of something you cannot write down explicitly.

Implicit differentiation is the technique: differentiate the *equation* rather than the function, treating every quantity that depends on the variable as a function of it and applying the chain rule. Related-rates problems are the same technique with time as the variable — two or more quantities are tied by geometry, and knowing the rate of one gives the rate of the other. Both are the chain rule of the previous lesson, applied with discipline.

## Differentiating an equation

Consider the circle $x^2 + y^2 = r^2$ with $r$ fixed. Near any point other than $(\pm r, 0)$, the circle is the graph of a function $y(x)$ — locally the upper or lower semicircle — even though a single formula for the whole curve does not exist. Substitute that function into the equation: $x^2 + y(x)^2 = r^2$ holds for every $x$ in a neighbourhood. Two functions that are equal on an interval have equal derivatives, so differentiate both sides with respect to $x$. The term $y(x)^2$ is a composition, outside $u^2$ and inside $y(x)$, so the chain rule gives $2y\,y'$:

$$
2x + 2y\,\frac{dy}{dx} = 0 \quad\Longrightarrow\quad \frac{dy}{dx} = -\frac{x}{y}.
$$

The slope of the circle at $(x, y)$ is $-x/y$, which you can confirm geometrically: the radius to $(x, y)$ has slope $y/x$ and the tangent is perpendicular to it. The formula fails at $y = 0$, where the tangent is vertical and no function $y(x)$ exists — implicit differentiation is honest about where it breaks.

The procedure in general:

1. Differentiate every term of the equation with respect to $x$. A term containing $y$ needs the chain rule and produces a factor $\dfrac{dy}{dx}$.
2. Collect the terms containing $\dfrac{dy}{dx}$ on one side.
3. Solve for $\dfrac{dy}{dx}$. The answer is usually in terms of both $x$ and $y$, which is fine — you evaluate it at a point on the curve.

::: example Flight direction on an elliptical orbit
An orbit has semi-major axis $a = 10\,000\,\mathrm{km}$ and semi-minor axis $b = 8000\,\mathrm{km}$, so in the orbital plane it satisfies $\dfrac{x^2}{a^2} + \dfrac{y^2}{b^2} = 1$. The velocity is tangent to the orbit. What is the direction of flight at the point with $x = 6000\,\mathrm{km}$, $y > 0$?

First locate the point: $y = b\sqrt{1 - x^2/a^2} = 8000\sqrt{1 - 0.36} = 8000 \times 0.8 = 6400\,\mathrm{km}$.

Differentiate the orbit equation with respect to $x$:

$$
\frac{2x}{a^2} + \frac{2y}{b^2}\,\frac{dy}{dx} = 0 \quad\Longrightarrow\quad \frac{dy}{dx} = -\frac{b^2 x}{a^2 y}.
$$

At the point: $\dfrac{dy}{dx} = -\dfrac{(8000)^2 (6000)}{(10\,000)^2 (6400)} = -\dfrac{3.84 \times 10^{11}}{6.4 \times 10^{11}} = -0.600$. The tangent, and hence the velocity, makes an angle $\arctan(-0.6) = -31.0^\circ$ with the $x$-axis: the vehicle is moving with $y$ decreasing as $x$ increases (or the reverse, depending on the direction of travel). For a circle ($a = b$) the formula reduces to $-x/y = -0.9375$ at this point, so the ellipse's flattening has visibly changed the flight direction.
:::

::: example Sensitivity of eccentric anomaly to mean anomaly
Kepler's equation relates mean anomaly $M$, which grows uniformly with time, to eccentric anomaly $E$, which locates the body on its orbit: $M = E - e\sin E$, with $e$ the eccentricity. Find $\dfrac{dE}{dM}$ and evaluate it for $e = 0.1$ at $E = 1\,\mathrm{rad}$.

Treat $E$ as a function of $M$ and differentiate both sides with respect to $M$:

$$
1 = \frac{dE}{dM} - e\cos E\,\frac{dE}{dM} = (1 - e\cos E)\frac{dE}{dM}
\quad\Longrightarrow\quad
\frac{dE}{dM} = \frac{1}{1 - e\cos E}.
$$

At $E = 1$, $\cos 1 = 0.5403$, so $\dfrac{dE}{dM} = \dfrac{1}{1 - 0.05403} = 1.057$. Near periapsis ($E = 0$) the factor is $1/(1 - e) = 1.11$: the eccentric anomaly advances $11\%$ faster than mean anomaly, because the body is moving fastest there. Near apoapsis ($E = \pi$) it is $1/(1 + e) = 0.91$. Since $M$ advances at the constant mean motion $n = \sqrt{\mu/a^3}$, the chain rule gives $\dot E = n/(1 - e\cos E)$, the rate at which the propagator must advance $E$. Notice that you never needed $E(M)$ in closed form — which is fortunate, since it has none.
:::

## Derivatives of the inverse trigonometric functions

The inverse-function idea of the previous lesson is implicit differentiation in disguise, and it gives the inverse trigonometric derivatives in a few lines each.

**Arcsine.** Let $y = \arcsin x$, so $\sin y = x$ with $-\pi/2 \le y \le \pi/2$. Differentiate: $\cos y\,\dfrac{dy}{dx} = 1$, so $\dfrac{dy}{dx} = \dfrac{1}{\cos y}$. On the chosen range, $\cos y \ge 0$, so $\cos y = \sqrt{1 - \sin^2 y} = \sqrt{1 - x^2}$:

$$
\frac{d}{dx}\arcsin x = \frac{1}{\sqrt{1 - x^2}}, \qquad -1 < x < 1.
$$

**Arccosine.** The same steps with $\cos y = x$ and $0 \le y \le \pi$ give $-\sin y\,y' = 1$ and $\sin y = \sqrt{1 - x^2} \ge 0$, so $\dfrac{d}{dx}\arccos x = -\dfrac{1}{\sqrt{1 - x^2}}$. (This is consistent with $\arcsin x + \arccos x = \pi/2$: the derivatives sum to zero.)

**Arctangent.** Let $y = \arctan x$, so $\tan y = x$. Differentiate: $\sec^2 y\,y' = 1$, and $\sec^2 y = 1 + \tan^2 y = 1 + x^2$, so

$$
\frac{d}{dx}\arctan x = \frac{1}{1 + x^2}.
$$

The arctangent's derivative is defined for every real $x$ and never exceeds $1$, which is one reason angle computations built on $\operatorname{atan2}$ are numerically tame. At $x = 2$, for instance, the slope is $1/5$. Check: at $x = 0.5$, $\arcsin$ has slope $1/\sqrt{0.75} = 1.155$, steeper than $1$, and the slope blows up as $x \to 1$ — the sine curve is flat at its peak, so its inverse is vertical there.

## The power rule for rational exponents, properly

The previous lesson extended the power rule to all real exponents through $x^n = e^{n\ln x}$. Implicit differentiation gives an independent proof for rational exponents that does not use the exponential at all. Let $y = x^{p/q}$ with $p, q$ integers, so $y^q = x^p$. Differentiate both sides: $q\,y^{q-1}\,y' = p\,x^{p-1}$, hence

$$
y' = \frac{p}{q}\cdot\frac{x^{p-1}}{y^{q-1}} = \frac{p}{q}\cdot\frac{x^{p-1}}{x^{p(q-1)/q}} = \frac{p}{q}\,x^{p - 1 - p + p/q} = \frac{p}{q}\,x^{p/q - 1}.
$$

This is exactly $n x^{n-1}$ with $n = p/q$.

## Related rates

In a related-rates problem the variable is time and the quantities are tied by geometry or physics. The equation relating them holds at every instant, so it can be differentiated with respect to $t$, and the chain rule turns each quantity's derivative into its rate. The discipline is:

1. Name every quantity that changes with time and write down which rates are known and which is wanted.
2. Write the equation that relates the quantities at *every* instant — not just the instant of interest.
3. Differentiate the equation with respect to $t$.
4. Only now substitute the numbers for the instant in question and solve for the unknown rate.

Substituting numbers before differentiating is the classic error: it turns changing quantities into constants whose derivatives are zero.

::: example Range and range rate
A ground radar sits at the origin. A vehicle is at downrange distance $x = 12\,000\,\mathrm{m}$ and altitude $y = 20\,000\,\mathrm{m}$, moving with $\dot x = 400\,\mathrm{m/s}$ and $\dot y = 1200\,\mathrm{m/s}$. What range $\rho$ does the radar measure, and what range rate $\dot\rho$ would a Doppler measurement show?

At every instant $\rho^2 = x^2 + y^2$. Differentiate with respect to $t$:

$$
2\rho\,\dot\rho = 2x\,\dot x + 2y\,\dot y \quad\Longrightarrow\quad \dot\rho = \frac{x\,\dot x + y\,\dot y}{\rho}.
$$

Now the numbers. $\rho = \sqrt{12\,000^2 + 20\,000^2} = 23\,324\,\mathrm{m}$. Then

$$
\dot\rho = \frac{(12\,000)(400) + (20\,000)(1200)}{23\,324} = \frac{2.88 \times 10^7}{23\,324} = 1235\,\mathrm{m/s}.
$$

The vehicle's speed is $\sqrt{400^2 + 1200^2} = 1265\,\mathrm{m/s}$, and the range rate is less than that because part of the velocity is across the line of sight rather than along it. The formula is the dot product of position and velocity divided by range — the component of velocity along the line of sight — which is exactly the quantity a Doppler radar measures and exactly the row that appears in the measurement Jacobian of a filter processing range-rate.
:::

::: example Elevation angle rate
For the same geometry, how fast is the elevation angle $\varepsilon$ from the radar to the vehicle changing?

At every instant $\tan\varepsilon = y/x$. Differentiate with respect to $t$, using the chain rule on the left and the quotient rule on the right:

$$
\sec^2\varepsilon\;\dot\varepsilon = \frac{\dot y\,x - y\,\dot x}{x^2}.
$$

Since $\sec^2\varepsilon = 1 + \tan^2\varepsilon = 1 + y^2/x^2 = \rho^2/x^2$, this simplifies to

$$
\dot\varepsilon = \frac{x\,\dot y - y\,\dot x}{\rho^2}.
$$

Numbers: $\dot\varepsilon = \dfrac{(12\,000)(1200) - (20\,000)(400)}{23\,324^2} = \dfrac{6.4 \times 10^6}{5.44 \times 10^8} = 0.0118\,\mathrm{rad/s} = 0.674^\circ/\mathrm{s}$. The elevation itself is $\arctan(20/12) = 59.0^\circ$. The numerator is the cross-line-of-sight component of velocity times range, and dividing by $\rho^2$ gives the angular rate: angular rate equals transverse speed over range. A tracking antenna slewing to follow this vehicle must move at two-thirds of a degree per second.
:::

::: example Propellant level in a tank
Liquid oxygen (density $1141\,\mathrm{kg/m^3}$) leaves a cylindrical tank of radius $1.83\,\mathrm{m}$ at $1800\,\mathrm{kg/s}$. How fast is the liquid level falling?

The liquid volume is $V = \pi r^2 h$ with $r$ fixed and $h$ the level. Differentiating, $\dot V = \pi r^2 \dot h$. The volume flow is the mass flow divided by density: $\dot V = -1800/1141 = -1.578\,\mathrm{m^3/s}$. The tank cross-section is $\pi(1.83)^2 = 10.52\,\mathrm{m^2}$. So

$$
\dot h = \frac{\dot V}{\pi r^2} = \frac{-1.578}{10.52} = -0.150\,\mathrm{m/s}.
$$

The level drops $15\,\mathrm{cm}$ every second. Over a $160\,\mathrm{s}$ burn that is $24\,\mathrm{m}$, which is the right order for a first-stage oxidiser tank. A level sensor's reading is one of the inputs to the propellant-utilisation logic that trims the mixture ratio so both tanks empty together.
:::

## Second derivatives implicitly

Curvature and acceleration need second derivatives, and implicit differentiation delivers them by differentiating once more. For the circle, $y' = -x/y$. Differentiate with the quotient rule, remembering that $y$ depends on $x$:

$$
y'' = -\frac{1 \cdot y - x\,y'}{y^2} = -\frac{y - x(-x/y)}{y^2} = -\frac{y^2 + x^2}{y^3} = -\frac{r^2}{y^3}.
$$

On the upper semicircle $y > 0$ so $y'' < 0$: the curve bends downward, as a circle viewed from inside should. Substituting the already-found $y'$ into the expression for $y''$ is the standard move.

::: warning
When you differentiate an equation with respect to $t$, *every* symbol that varies gets a dot. In $\rho^2 = x^2 + y^2$, the students who write $2\rho\dot\rho = 2x\dot x$ have silently frozen the altitude. Conversely, constants get no dot: the tank radius $r$ is fixed, so $\dot V = \pi r^2\dot h$ has no $\dot r$ term. Decide which quantities vary before you differentiate, and write the list down.
:::

::: warning
The relation must hold at all times, not only at the snapshot. $\tan\varepsilon = y/x$ is true throughout the flight, so it can be differentiated. The statement "$\varepsilon = 59.0^\circ$" is true at one instant and its derivative is zero — differentiating it tells you nothing. Numbers go in last.
:::

::: key
Implicit differentiation: differentiate both sides of an equation relating $x$ and $y$ with respect to $x$, treating $y$ as $y(x)$ so that every $y$-term produces a factor $\dfrac{dy}{dx}$ by the chain rule; then solve for $\dfrac{dy}{dx}$. It gives $\dfrac{d}{dx}\arcsin x = \dfrac{1}{\sqrt{1 - x^2}}$, $\dfrac{d}{dx}\arccos x = -\dfrac{1}{\sqrt{1 - x^2}}$ and $\dfrac{d}{dx}\arctan x = \dfrac{1}{1 + x^2}$, and for Kepler's equation $\dfrac{dE}{dM} = \dfrac{1}{1 - e\cos E}$.
:::

::: key
Related rates: write the relation that holds at every instant, differentiate it with respect to $t$ so each varying quantity acquires its rate, then substitute the instant's values. Range rate is $\dot\rho = (x\dot x + y\dot y)/\rho$, the velocity component along the line of sight; angular rate is $\dot\varepsilon = (x\dot y - y\dot x)/\rho^2$, the transverse velocity component divided by range.
:::

## Check yourself

::: check
Find $\dfrac{dy}{dx}$ for the curve $x^3 + y^3 = 6xy$ and evaluate it at the point $(3, 3)$.
:::

::: answer
Differentiate term by term: $3x^2 + 3y^2 y' = 6y + 6x\,y'$ (product rule on the right). Collect: $(3y^2 - 6x)\,y' = 6y - 3x^2$, so $y' = \dfrac{6y - 3x^2}{3y^2 - 6x} = \dfrac{2y - x^2}{y^2 - 2x}$. At $(3, 3)$: $\dfrac{6 - 9}{9 - 6} = -1$. The curve crosses the line $y = x$ there at right angles to it, which the symmetry of the equation under swapping $x$ and $y$ makes plausible.
:::

::: check
Derive $\dfrac{d}{dx}\operatorname{arcsec} x$ for $x > 1$, where $\operatorname{arcsec}$ is the inverse of $\sec$ on $[0, \pi/2)$.
:::

::: answer
Let $y = \operatorname{arcsec} x$, so $\sec y = x$. Differentiate: $\sec y\tan y\,y' = 1$. With $0 \le y < \pi/2$, $\tan y = \sqrt{\sec^2 y - 1} = \sqrt{x^2 - 1}$, and $\sec y = x$. So $y' = \dfrac{1}{x\sqrt{x^2 - 1}}$.
:::

::: check
A vehicle rises vertically from a pad $2000\,\mathrm{m}$ from a camera, at $150\,\mathrm{m/s}$, and is currently at $1500\,\mathrm{m}$ altitude. How fast must the camera's elevation angle increase to keep it in frame?
:::

::: answer
With horizontal distance $d = 2000$ fixed and altitude $y$ varying, $\tan\varepsilon = y/d$. Differentiate: $\sec^2\varepsilon\,\dot\varepsilon = \dot y/d$, so $\dot\varepsilon = \dfrac{\dot y}{d\sec^2\varepsilon} = \dfrac{\dot y\,d}{d^2 + y^2}$. Numbers: $\dot\varepsilon = \dfrac{150 \times 2000}{2000^2 + 1500^2} = \dfrac{3 \times 10^5}{6.25 \times 10^6} = 0.048\,\mathrm{rad/s} = 2.75^\circ/\mathrm{s}$. The rate is largest when the vehicle is at the camera's height and falls as it climbs away.
:::

::: check
For an orbit with $e = 0.3$, what is $\dot E$ in terms of the mean motion $n$ at periapsis and at apoapsis? Which is larger, and why does that make physical sense?
:::

::: answer
$\dot E = \dfrac{dE}{dM}\cdot\dfrac{dM}{dt} = \dfrac{n}{1 - e\cos E}$. At periapsis $E = 0$: $\dot E = n/(1 - 0.3) = 1.43n$. At apoapsis $E = \pi$: $\dot E = n/(1 + 0.3) = 0.77n$. The rate is higher at periapsis because the body is closest to the primary and moving fastest there, sweeping through eccentric anomaly more quickly; the constant mean motion $n$ is the average rate over a full orbit.
:::

::: check
A spherical balloon used as a calibration target is inflated at $0.5\,\mathrm{m^3/s}$. How fast is its radius growing when the radius is $2\,\mathrm{m}$? What about its surface area?
:::

::: answer
$V = \tfrac43\pi r^3$, so $\dot V = 4\pi r^2\dot r$ and $\dot r = \dfrac{\dot V}{4\pi r^2} = \dfrac{0.5}{4\pi \times 4} = 0.00995\,\mathrm{m/s}$, about $1\,\mathrm{cm/s}$. Surface area $S = 4\pi r^2$, so $\dot S = 8\pi r\dot r = 8\pi \times 2 \times 0.00995 = 0.50\,\mathrm{m^2/s}$. That $\dot S = 2\dot V/r$ is no accident: since $\dot V = 4\pi r^2\dot r = S\dot r$, the area grows at $\dot S = 8\pi r\dot r = 2S\dot r/r = 2\dot V/r$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Implicit differentiation | Differentiate the equation; each $y$-term yields a factor $dy/dx$; solve |
| Circle, ellipse | $x^2 + y^2 = r^2 \Rightarrow y' = -x/y$; $\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1 \Rightarrow y' = -\frac{b^2x}{a^2y}$ |
| Kepler's equation | $M = E - e\sin E \Rightarrow \frac{dE}{dM} = \frac{1}{1 - e\cos E}$ |
| Inverse trig | $\frac{d}{dx}\arcsin x = \frac{1}{\sqrt{1 - x^2}}$, $\frac{d}{dx}\arccos x = -\frac{1}{\sqrt{1 - x^2}}$, $\frac{d}{dx}\arctan x = \frac{1}{1 + x^2}$ |
| Rational power rule | $y^q = x^p \Rightarrow y' = \frac{p}{q}x^{p/q - 1}$ |
| Related rates | Relation at every instant $\to$ differentiate in $t$ $\to$ substitute numbers last |
| Range rate | $\dot\rho = (x\dot x + y\dot y)/\rho$ |
| Angle rate | $\dot\varepsilon = (x\dot y - y\dot x)/\rho^2$ |

You now have the full differentiation toolkit. The next lesson turns to what derivatives are *for*: locating the maxima and minima of a function, which is what every optimiser, trim solver and least-squares fit is doing underneath.
