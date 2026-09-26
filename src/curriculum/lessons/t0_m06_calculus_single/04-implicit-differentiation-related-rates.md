---
id: l04-implicit-differentiation-related-rates
title: Implicit differentiation and related rates
minutes: 25
covers:
  - implicit differentiation and related rates
---

So far every function has come to you in the form $y = f(x)$: put in $x$, get out $y$. Plenty of real relationships do not come that way. They come as an equation that ties two quantities together without saying which one is "the answer".

Here are three you will meet on the job.

- An orbit is the set of points that satisfy $x^2/a^2 + y^2/b^2 = 1$. That equation links $x$ and $y$, but it never hands you $y$ as a formula in $x$.
- **Kepler's equation**, $M = E - e\sin E$, links two ways of saying where a satellite is on its orbit. No amount of algebra can solve it for $E$. Yet every orbit propagator needs to know how fast $E$ changes as $M$ changes.
- A radar tracking a climbing rocket measures its distance and its elevation angle. The tracking software wants to know how fast those are changing, given how the rocket is moving.

Each of these asks for the derivative of something you cannot write down as $y = f(x)$. **[[Implicit differentiation|implicit-word]]** is the way through: you differentiate the whole *equation*, treat every quantity that depends on the variable as a function of it, and use the chain rule. **Related rates** are the same move with time as the variable. Two or more quantities are tied together by geometry, so knowing how fast one changes tells you how fast the other changes. Both are the chain rule from the previous lesson, used carefully.

## Differentiating an equation

Picture yourself walking around a circular running track. At every moment your position $(x, y)$ satisfies

$$
x^2 + y^2 = r^2,
$$

where $r$ is the track's radius and stays fixed. You want the slope of the track where you are standing — the steepness $\dfrac{dy}{dx}$.

There is no single formula $y = f(x)$ for the whole circle, because every $x$ in the middle has two points, one on top and one on the bottom. But if you only look at a small piece of the track near where you are, that piece *is* the graph of a function $y(x)$ — part of the upper half or part of the lower half. The only places this fails are the two points $(\pm r, 0)$ at the far left and far right, where the track runs straight up and down.

So put that function into the equation. For every $x$ near you,

$$
x^2 + y(x)^2 = r^2.
$$

Both sides are equal for every $x$ in a little stretch, so they have equal derivatives. Differentiate both sides with respect to $x$:

- The derivative of $x^2$ is $2x$.
- The term $y(x)^2$ is a function inside a function: the outside is "square it", the inside is $y(x)$. The chain rule says its derivative is $2y \cdot \dfrac{dy}{dx}$.
- The right side, $r^2$, is a constant, so its derivative is $0$.

That gives

$$
2x + 2y\,\frac{dy}{dx} = 0 \quad\Longrightarrow\quad \frac{dy}{dx} = -\frac{x}{y}.
$$

(The arrow $\Longrightarrow$ is read "which gives". To get the second form, subtract $2x$ from both sides and divide by $2y$.)

So the slope of the circle at $(x, y)$ is $-x/y$. You can check this with a picture: the radius from the center to $(x, y)$ has slope $y/x$, and a **[[tangent to a circle is perpendicular to the radius|circle-tangent]]**. Perpendicular slopes multiply to $-1$, and $\dfrac{y}{x} \cdot \left(-\dfrac{x}{y}\right) = -1$. It checks.

Notice what happens at $y = 0$: the formula divides by zero. That is exactly where the track is vertical and no function $y(x)$ exists. Implicit differentiation is honest about where it breaks.

Here is the recipe for any equation linking $x$ and $y$.

1. Differentiate every term of the equation with respect to $x$. Any term containing $y$ needs the chain rule, and it produces a factor $\dfrac{dy}{dx}$.
2. Move every term containing $\dfrac{dy}{dx}$ to one side, and everything else to the other.
3. Solve for $\dfrac{dy}{dx}$. The answer usually contains both $x$ and $y$. That is fine: you evaluate it at a point that is on the curve.

::: example Flight direction on an elliptical orbit
An orbit is an ellipse. Its **[[semi-major axis|semi-axes]]** — half its longest width — is $a = 10\,000\,\mathrm{km}$, and its semi-minor axis — half its shortest width — is $b = 8000\,\mathrm{km}$. In the plane of the orbit, every point satisfies

$$
\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1.
$$

A spacecraft's velocity always points along the orbit, tangent to it. Which way is it flying at the point with $x = 6000\,\mathrm{km}$ and $y > 0$?

**Find the point.** Solve the orbit equation for $y$ on the top half:

$$
y = b\sqrt{1 - \frac{x^2}{a^2}} = 8000\sqrt{1 - 0.36} = 8000 \times 0.8 = 6400\,\mathrm{km}.
$$

**Differentiate the equation.** $a$ and $b$ are constants. The first term gives $2x/a^2$. The second is $y^2$ divided by a constant, so the chain rule gives $\dfrac{2y}{b^2}\dfrac{dy}{dx}$:

$$
\frac{2x}{a^2} + \frac{2y}{b^2}\,\frac{dy}{dx} = 0 \quad\Longrightarrow\quad \frac{dy}{dx} = -\frac{b^2 x}{a^2 y}.
$$

**Put in the numbers.**

$$
\frac{dy}{dx} = -\frac{(8000)^2 (6000)}{(10\,000)^2 (6400)} = -\frac{3.84 \times 10^{11}}{6.4 \times 10^{11}} = -0.600.
$$

A slope of $-0.600$ is a line tilted $\arctan(-0.6) = -31.0^\circ$ from the $x$-axis. The spacecraft is moving so that $y$ drops as $x$ grows (or the other way round, depending on which way it goes around).

**Sanity check.** For a circle, $a = b$ and the formula becomes $-x/y$, which here would be $-6000/6400 = -0.9375$. The ellipse is flatter than a circle, so its slope at this point is gentler. That matches the numbers: $0.600$ is less steep than $0.9375$.
:::

::: example How fast eccentric anomaly moves
**[[Kepler's equation|kepler-equation]]** connects two angles that describe where a body is on its orbit. The **mean anomaly** $M$ grows at a perfectly steady rate with time, like the hand of a clock. The **eccentric anomaly** $E$ tells you where the body actually is. They are linked by

$$
M = E - e\sin E,
$$

where $e$ is the **eccentricity** — how stretched the ellipse is, from $0$ for a circle up toward $1$. Find $\dfrac{dE}{dM}$, then evaluate it for $e = 0.1$ at $E = 1\,\mathrm{rad}$.

**Differentiate.** Treat $E$ as a function of $M$ and differentiate both sides with respect to $M$. The left side, $M$, has derivative $1$. On the right, $E$ gives $\dfrac{dE}{dM}$, and $e\sin E$ gives $e\cos E \cdot \dfrac{dE}{dM}$ by the chain rule:

$$
1 = \frac{dE}{dM} - e\cos E\,\frac{dE}{dM} = (1 - e\cos E)\frac{dE}{dM}.
$$

**Solve.** Divide both sides by $(1 - e\cos E)$:

$$
\frac{dE}{dM} = \frac{1}{1 - e\cos E}.
$$

**Numbers.** At $E = 1$, $\cos 1 = 0.5403$, so $\dfrac{dE}{dM} = \dfrac{1}{1 - 0.1 \times 0.5403} = \dfrac{1}{1 - 0.05403} = 1.057$.

**What it means.** At periapsis, the closest point to the planet, $E = 0$ and the factor is $1/(1 - e) = 1/0.9 = 1.11$. The eccentric anomaly moves $11\%$ faster than the mean anomaly there, because the body is moving fastest when it is closest. At apoapsis, the farthest point, $E = \pi$ and the factor is $1/(1 + e) = 1/1.1 = 0.91$: slower, as it should be.

The mean anomaly moves at a constant rate $n = \sqrt{\mu/a^3}$, called the **mean motion** (read $\mu$ as "mew"; it is the planet's gravity constant). So the chain rule gives

$$
\dot E = \frac{dE}{dM}\cdot\frac{dM}{dt} = \frac{n}{1 - e\cos E}.
$$

A dot over a letter, as in $\dot E$ ("E dot"), means its rate of change with time. This is how fast an orbit propagator must advance $E$. And you never needed a formula for $E$ in terms of $M$ — which is lucky, because none exists.
:::

## Derivatives of the inverse trig functions

The previous lesson found the slope of an inverse function by differentiating $f(y) = x$. That was implicit differentiation in disguise. Used on the trig functions, it gives their inverses' derivatives in a few lines each.

**Arcsine.** Let $y = \arcsin x$. That means $\sin y = x$, with $y$ between $-\pi/2$ and $\pi/2$. Differentiate both sides with respect to $x$:

$$
\cos y\,\frac{dy}{dx} = 1 \quad\Longrightarrow\quad \frac{dy}{dx} = \frac{1}{\cos y}.
$$

We want the answer in terms of $x$. On the range $-\pi/2 \le y \le \pi/2$, the cosine is never negative. So from $\sin^2 y + \cos^2 y = 1$ we get $\cos y = \sqrt{1 - \sin^2 y} = \sqrt{1 - x^2}$, and

$$
\frac{d}{dx}\arcsin x = \frac{1}{\sqrt{1 - x^2}}, \qquad -1 < x < 1.
$$

**Arccosine.** The same steps with $\cos y = x$ and $0 \le y \le \pi$ give $-\sin y\,\dfrac{dy}{dx} = 1$. On that range $\sin y = \sqrt{1 - x^2}$ is never negative, so

$$
\frac{d}{dx}\arccos x = -\frac{1}{\sqrt{1 - x^2}}.
$$

This fits with a fact from trigonometry, $\arcsin x + \arccos x = \pi/2$. A constant has zero slope, so the two derivatives must add to zero — and they do.

**Arctangent.** Let $y = \arctan x$, so $\tan y = x$. Differentiate: $\sec^2 y\,\dfrac{dy}{dx} = 1$. The identity $\sec^2 y = 1 + \tan^2 y = 1 + x^2$ turns this into

$$
\frac{d}{dx}\arctan x = \frac{1}{1 + x^2}.
$$

This slope exists for every real $x$ and is never more than $1$. At $x = 2$, for example, it is $1/(1 + 4) = 1/5$. That gentleness is one reason angle calculations built on $\operatorname{atan2}$ behave so well in flight software.

The arcsine is different. At $x = 0.5$ its slope is $1/\sqrt{0.75} = 1.155$, steeper than $1$, and as $x$ approaches $1$ the slope **[[blows up|arcsin-steep]]**. That makes sense: the sine curve is flat at its peak, and flipping a flat piece across the diagonal makes it vertical.

## The power rule for fractional exponents

The previous lesson proved $\dfrac{d}{dx}x^n = n x^{n-1}$ for every real $n$ by writing $x^n = e^{n\ln x}$. Implicit differentiation gives a second proof for fractional exponents that never uses the exponential function.

Let $y = x^{p/q}$, where $p$ and $q$ are integers (whole numbers, possibly negative, with $q \ne 0$). Raise both sides to the power $q$: $y^q = x^p$. Now differentiate both sides with respect to $x$. The left side needs the chain rule:

$$
q\,y^{q-1}\,\frac{dy}{dx} = p\,x^{p-1}.
$$

Divide by $q\,y^{q-1}$, then replace $y$ by $x^{p/q}$, so that $y^{q-1} = x^{p(q-1)/q}$:

$$
\frac{dy}{dx} = \frac{p}{q}\cdot\frac{x^{p-1}}{y^{q-1}} = \frac{p}{q}\cdot\frac{x^{p-1}}{x^{p(q-1)/q}} = \frac{p}{q}\,x^{p - 1 - p + p/q} = \frac{p}{q}\,x^{p/q - 1}.
$$

The last step subtracted exponents: $(p - 1) - (p - p/q) = p/q - 1$. The result is exactly $n x^{n-1}$ with $n = p/q$.

## Related rates

Now let the variable be time.

Think of blowing up a balloon. You control how fast the air goes in. But the radius, the surface area and the volume all change together, because they are tied by geometry: $V = \tfrac43\pi r^3$. If you know how fast the volume grows, you can work out how fast the radius grows. That is a **related-rates** problem: quantities linked by an equation, and the rate of one tells you the rate of another.

The equation holds at *every* instant, so you can differentiate it with respect to time $t$. The chain rule turns each changing quantity into its rate. Here is the discipline that makes these problems come out right.

1. Name every quantity that changes with time. Write down which rates you know and which one you want.
2. Write the equation that links the quantities at *every* instant — not only at the moment you care about.
3. Differentiate the equation with respect to $t$.
4. Only now put in the numbers for that moment, and solve for the unknown rate.

Putting numbers in before differentiating is the classic mistake. It turns changing quantities into constants, and constants have zero derivative.

::: example Range and range rate
A ground radar sits at the origin. A rocket is $x = 12\,000\,\mathrm{m}$ downrange and $y = 20\,000\,\mathrm{m}$ up. It is moving with $\dot x = 400\,\mathrm{m/s}$ sideways and $\dot y = 1200\,\mathrm{m/s}$ upward. What **range** $\rho$ (the straight-line distance; $\rho$ is the Greek letter "rho") does the radar measure? And what **range rate** $\dot\rho$ would a **[[Doppler measurement|doppler]]** show?

**Step 1.** Changing: $x$, $y$ and $\rho$. Known: $\dot x$ and $\dot y$. Wanted: $\dot\rho$.

**Step 2.** By Pythagoras, at every instant

$$
\rho^2 = x^2 + y^2.
$$

**Step 3.** Differentiate with respect to $t$. Each square gives "two times the thing times its rate":

$$
2\rho\,\dot\rho = 2x\,\dot x + 2y\,\dot y \quad\Longrightarrow\quad \dot\rho = \frac{x\,\dot x + y\,\dot y}{\rho}.
$$

**Step 4.** Now the numbers. First the range:

$$
\rho = \sqrt{12\,000^2 + 20\,000^2} = \sqrt{5.44 \times 10^8} = 23\,324\,\mathrm{m}.
$$

Then the range rate:

$$
\dot\rho = \frac{(12\,000)(400) + (20\,000)(1200)}{23\,324} = \frac{4.8 \times 10^6 + 2.4 \times 10^7}{23\,324} = \frac{2.88 \times 10^7}{23\,324} = 1235\,\mathrm{m/s}.
$$

**Sanity check.** The rocket's full speed is $\sqrt{400^2 + 1200^2} = 1265\,\mathrm{m/s}$. The range rate is a bit less. It should be: part of the rocket's motion goes **[[across the line of sight|los-split]]** rather than straight away from the radar, and that part does not change the distance.

In fact the top of the fraction, $x\dot x + y\dot y$, is the dot product of position and velocity. Dividing by $\rho$ gives the piece of velocity along the line of sight. That is exactly what a Doppler radar measures, and it is exactly the **[[row a navigation filter needs|jacobian-row]]** when it processes range-rate measurements.
:::

::: example Elevation angle rate
Same radar, same rocket. How fast is the **elevation angle** $\varepsilon$ — the angle the radar dish looks up above the horizon — changing? ($\varepsilon$ is the Greek letter "epsilon".)

**Step 2.** At every instant, the tangent of the elevation is height over distance:

$$
\tan\varepsilon = \frac{y}{x}.
$$

**Step 3.** Differentiate with respect to $t$. On the left, the chain rule gives $\sec^2\varepsilon\,\dot\varepsilon$. On the right, the quotient rule gives (bottom times rate of top, minus top times rate of bottom) over bottom squared:

$$
\sec^2\varepsilon\;\dot\varepsilon = \frac{\dot y\,x - y\,\dot x}{x^2}.
$$

**Tidy up.** Use $\sec^2\varepsilon = 1 + \tan^2\varepsilon = 1 + \dfrac{y^2}{x^2} = \dfrac{x^2 + y^2}{x^2} = \dfrac{\rho^2}{x^2}$. Put that on the left and multiply both sides by $x^2/\rho^2$:

$$
\dot\varepsilon = \frac{x\,\dot y - y\,\dot x}{\rho^2}.
$$

**Step 4.** Numbers:

$$
\dot\varepsilon = \frac{(12\,000)(1200) - (20\,000)(400)}{23\,324^2} = \frac{1.44 \times 10^7 - 8.0 \times 10^6}{5.44 \times 10^8} = \frac{6.4 \times 10^6}{5.44 \times 10^8} = 0.0118\,\mathrm{rad/s}.
$$

Multiply by $180/\pi$ to get degrees: $0.674^\circ/\mathrm{s}$. The elevation itself is $\arctan(20/12) = 59.0^\circ$.

**What it means.** The top of the fraction is the across-the-line-of-sight part of the velocity, times the range. Dividing by $\rho^2$ leaves that sideways speed divided by the range. So angular rate equals sideways speed over distance — the same reason a far-away plane seems to crawl across the sky. A tracking antenna following this rocket must turn at about two thirds of a degree per second.
:::

::: example Propellant level in a tank
Liquid oxygen, with density $1141\,\mathrm{kg/m^3}$, drains from a cylindrical tank of radius $1.83\,\mathrm{m}$ at $1800\,\mathrm{kg/s}$. How fast is the liquid level falling?

**Step 1.** Changing: the level $h$ and the volume $V$. Fixed: the radius $r$. Known: the mass flow. Wanted: $\dot h$.

**Step 2.** The liquid is a cylinder of height $h$:

$$
V = \pi r^2 h.
$$

**Step 3.** Differentiate with respect to $t$. The radius is constant, so it passes straight through:

$$
\dot V = \pi r^2 \dot h.
$$

**Step 4.** Volume flow is mass flow divided by density. It is negative, because the tank is emptying:

$$
\dot V = -\frac{1800}{1141} = -1.578\,\mathrm{m^3/s}.
$$

The tank's cross-section is $\pi(1.83)^2 = 10.52\,\mathrm{m^2}$. So

$$
\dot h = \frac{\dot V}{\pi r^2} = \frac{-1.578}{10.52} = -0.150\,\mathrm{m/s}.
$$

The level drops $15\,\mathrm{cm}$ every second, like a bathtub draining very fast.

**Sanity check.** Over a $160\,\mathrm{s}$ burn that is $0.150 \times 160 = 24\,\mathrm{m}$ of tank — about the right size for a first-stage oxidizer tank. A level sensor reading like this feeds the **[[propellant-utilization logic|propellant-utilization]]**, which trims the mixture ratio so both tanks run dry together.
:::

## Second derivatives, implicitly

Curvature and acceleration need second derivatives. Implicit differentiation delivers them too: differentiate once more.

For the circle we found $y' = -x/y$. (The prime, $y'$, read "y prime", is short for $\dfrac{dy}{dx}$, and $y''$, "y double prime", is the second derivative.) Differentiate again with the quotient rule, remembering that $y$ depends on $x$, so its derivative is $y'$:

$$
y'' = -\frac{1 \cdot y - x\,y'}{y^2}.
$$

Now substitute the $y' = -x/y$ you already know, and simplify step by step:

$$
y'' = -\frac{y - x(-x/y)}{y^2} = -\frac{y + x^2/y}{y^2} = -\frac{y^2 + x^2}{y^3} = -\frac{r^2}{y^3}.
$$

The third step multiplied top and bottom by $y$. The last step used $x^2 + y^2 = r^2$.

On the top half of the circle $y > 0$, so $y'' < 0$: the curve bends downward, like a dome. That is what the top of a circle looks like. Plugging the $y'$ you already found into the formula for $y''$ is the standard move.

::: warning Every changing quantity gets a dot
When you differentiate an equation with respect to $t$, *every* symbol that changes gets a dot. In $\rho^2 = x^2 + y^2$, writing $2\rho\dot\rho = 2x\dot x$ has quietly frozen the altitude. The opposite slip matters too: constants get no dot. The tank radius $r$ is fixed, so $\dot V = \pi r^2\dot h$ has no $\dot r$ term. Before you differentiate, decide which quantities change, and write the list down.
:::

::: warning The equation must hold at every instant
You may only differentiate a relation that is true throughout the motion. $\tan\varepsilon = y/x$ holds for the whole flight, so differentiating it is fine. The statement "$\varepsilon = 59.0^\circ$" is true at one instant only. Its derivative is zero, and it tells you nothing. Numbers go in last.
:::

::: key
Implicit differentiation: differentiate both sides of an equation relating $x$ and $y$ with respect to $x$, treating $y$ as $y(x)$ so that every $y$-term produces a factor $\dfrac{dy}{dx}$ by the chain rule; then solve for $\dfrac{dy}{dx}$. It gives $\dfrac{d}{dx}\arcsin x = \dfrac{1}{\sqrt{1 - x^2}}$, $\dfrac{d}{dx}\arccos x = -\dfrac{1}{\sqrt{1 - x^2}}$ and $\dfrac{d}{dx}\arctan x = \dfrac{1}{1 + x^2}$, and for Kepler's equation $\dfrac{dE}{dM} = \dfrac{1}{1 - e\cos E}$.
:::

::: key
Related rates: write the relation that holds at every instant, differentiate it with respect to $t$ so each varying quantity acquires its rate, then substitute the instant's values. Range rate is $\dot\rho = (x\dot x + y\dot y)/\rho$, the velocity component along the line of sight; angular rate is $\dot\varepsilon = (x\dot y - y\dot x)/\rho^2$, the transverse velocity component divided by range.
:::

## Check yourself

::: check
Find $\dfrac{dy}{dx}$ for the curve $x^3 + y^3 = 6xy$, and evaluate it at the point $(3, 3)$.
:::

::: answer
First confirm the point is on the curve: $27 + 27 = 54$ and $6 \times 3 \times 3 = 54$. Good.

Differentiate term by term. $x^3$ gives $3x^2$. $y^3$ gives $3y^2 y'$ by the chain rule. $6xy$ is a product, so the product rule gives $6y + 6x\,y'$:

$$
3x^2 + 3y^2 y' = 6y + 6x\,y'.
$$

Collect the $y'$ terms on the left: $(3y^2 - 6x)\,y' = 6y - 3x^2$. Divide, then cancel the common factor $3$:

$$
y' = \frac{6y - 3x^2}{3y^2 - 6x} = \frac{2y - x^2}{y^2 - 2x}.
$$

At $(3, 3)$: $y' = \dfrac{6 - 9}{9 - 6} = \dfrac{-3}{3} = -1$.

The curve crosses the line $y = x$ there at a right angle (slopes $-1$ and $1$ multiply to $-1$). That is believable, because the equation stays the same if you swap $x$ and $y$, so the curve is a mirror image of itself across $y = x$.
:::

::: check
Find $\dfrac{d}{dx}\operatorname{arcsec} x$ for $x > 1$, where $\operatorname{arcsec}$ undoes $\sec$ on $[0, \pi/2)$.
:::

::: answer
Let $y = \operatorname{arcsec} x$, so $\sec y = x$. The derivative of $\sec y$ is $\sec y\tan y$, so differentiating both sides gives

$$
\sec y\tan y\,\frac{dy}{dx} = 1.
$$

On $0 \le y < \pi/2$ the tangent is not negative, so $\tan y = \sqrt{\sec^2 y - 1} = \sqrt{x^2 - 1}$. And $\sec y = x$. Therefore

$$
\frac{dy}{dx} = \frac{1}{x\sqrt{x^2 - 1}}.
$$
:::

::: check
A rocket rises straight up from a pad $2000\,\mathrm{m}$ from a camera, at $150\,\mathrm{m/s}$. It is now at $1500\,\mathrm{m}$ altitude. How fast must the camera tilt up to keep it in the frame?
:::

::: answer
The horizontal distance $d = 2000\,\mathrm{m}$ is fixed; the altitude $y$ changes. At every instant $\tan\varepsilon = y/d$.

Differentiate with respect to $t$: $\sec^2\varepsilon\,\dot\varepsilon = \dot y/d$. Since $\sec^2\varepsilon = 1 + y^2/d^2 = (d^2 + y^2)/d^2$,

$$
\dot\varepsilon = \frac{\dot y}{d\sec^2\varepsilon} = \frac{\dot y\,d}{d^2 + y^2}.
$$

Numbers:

$$
\dot\varepsilon = \frac{150 \times 2000}{2000^2 + 1500^2} = \frac{3 \times 10^5}{6.25 \times 10^6} = 0.048\,\mathrm{rad/s} = 2.75^\circ/\mathrm{s}.
$$

The formula also shows when the camera works hardest. The bottom, $d^2 + y^2$, is smallest at $y = 0$, so the tilt rate is largest at lift-off, when the rocket is level with the camera, and it falls as the rocket climbs away.
:::

::: check
An orbit has $e = 0.3$. In terms of the mean motion $n$, what is $\dot E$ at periapsis and at apoapsis? Which is larger, and why does that make physical sense?
:::

::: answer
By the chain rule, $\dot E = \dfrac{dE}{dM}\cdot\dfrac{dM}{dt} = \dfrac{n}{1 - e\cos E}$.

At periapsis $E = 0$ and $\cos 0 = 1$: $\dot E = \dfrac{n}{1 - 0.3} = 1.43n$.

At apoapsis $E = \pi$ and $\cos\pi = -1$: $\dot E = \dfrac{n}{1 + 0.3} = 0.77n$.

It is larger at periapsis. There the body is closest to the planet and moving fastest, so it sweeps through eccentric anomaly more quickly. The steady mean motion $n$ is the average rate over a whole orbit.
:::

::: check
A spherical balloon used as a radar calibration target is inflated at $0.5\,\mathrm{m^3/s}$. How fast is its radius growing when the radius is $2\,\mathrm{m}$? How fast is its surface area growing?
:::

::: answer
The volume is $V = \tfrac43\pi r^3$. Differentiate with respect to $t$: $\dot V = 4\pi r^2\dot r$. Solve for $\dot r$:

$$
\dot r = \frac{\dot V}{4\pi r^2} = \frac{0.5}{4\pi \times 4} = 0.00995\,\mathrm{m/s},
$$

about $1\,\mathrm{cm/s}$.

The surface area is $S = 4\pi r^2$, so $\dot S = 8\pi r\dot r = 8\pi \times 2 \times 0.00995 = 0.50\,\mathrm{m^2/s}$.

There is a neat pattern here: $\dot S = 2\dot V/r = 2 \times 0.5/2 = 0.5$. It is no accident. Since $\dot V = 4\pi r^2\dot r = S\dot r$, you get $\dot S = 8\pi r\dot r = 2S\dot r/r = 2\dot V/r$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Implicit differentiation | Differentiate the equation; each $y$-term yields a factor $dy/dx$; solve |
| Circle, ellipse | $x^2 + y^2 = r^2 \Rightarrow y' = -x/y$; $\frac{x^2}{a^2} + \frac{y^2}{b^2} = 1 \Rightarrow y' = -\frac{b^2x}{a^2y}$ |
| Kepler's equation | $M = E - e\sin E \Rightarrow \frac{dE}{dM} = \frac{1}{1 - e\cos E}$ |
| Inverse trig | $\frac{d}{dx}\arcsin x = \frac{1}{\sqrt{1 - x^2}}$, $\frac{d}{dx}\arccos x = -\frac{1}{\sqrt{1 - x^2}}$, $\frac{d}{dx}\arctan x = \frac{1}{1 + x^2}$ |
| Fractional power rule | $y^q = x^p \Rightarrow y' = \frac{p}{q}x^{p/q - 1}$ |
| Related rates | Relation at every instant $\to$ differentiate in $t$ $\to$ substitute numbers last |
| Range rate | $\dot\rho = (x\dot x + y\dot y)/\rho$ |
| Angle rate | $\dot\varepsilon = (x\dot y - y\dot x)/\rho^2$ |
| Second derivative | Differentiate $y'$ again, then substitute the known $y'$; circle: $y'' = -r^2/y^3$ |

You now have the full toolkit for taking derivatives. The next lesson turns to what derivatives are *for*: finding the highest and lowest values of a function. That is what every optimizer, trim solver and least-squares fit is doing underneath.

::: context implicit-word Explicit and implicit
An **explicit** formula says it out loud: $y = \sqrt{r^2 - x^2}$ tells you exactly how to compute $y$. An **implicit** relation only hints: $x^2 + y^2 = r^2$ contains $y$, but you would have to dig it out. The word comes from the Latin for "folded in" — the function is folded inside the equation.

Sometimes you can unfold it, as with the circle. Often you cannot, as with Kepler's equation. Implicit differentiation works either way, which is why engineers reach for it first.
:::

::: context circle-tangent The tangent meets the radius square-on
At any point on a circle, the tangent line and the radius cross at a right angle. Here the point is $(0.6r, 0.8r)$. The radius has slope $0.8/0.6 = 4/3$; the tangent has slope $-0.6/0.8 = -3/4$. Multiply them and you get $-1$, the mark of perpendicular lines.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="180" x2="300" y2="180" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="10" x2="180" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="180" cy="180" r="150" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="180" x2="270" y2="60" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="190" y1="0" x2="350" y2="120" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="270" cy="60" r="4" fill="#1f2a44"/>
  <path d="M264,68 L272,74 L278,66" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="205" y="135" font-size="12" fill="#1d6fd1" text-anchor="end">radius, slope 4/3</text>
  <text x="280" y="40" font-size="12" fill="#b4232c">tangent,</text>
  <text x="280" y="54" font-size="12" fill="#b4232c">slope −3/4</text>
  <text x="280" y="100" font-size="12" fill="#1f2a44">(x, y)</text>
</svg>
```
:::

::: context semi-axes The two half-widths of an ellipse
An ellipse is a squashed circle. Its longest width, straight through the middle, is $2a$; half of it, $a$, is the **semi-major axis** ("semi" means half). Its shortest width is $2b$, and $b$ is the **semi-minor axis**. The point in the example sits at $x = 6000\,\mathrm{km}$, $y = 6400\,\mathrm{km}$, where the orbit's slope is $-0.6$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="110" rx="125" ry="100" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="110" x2="305" y2="110" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="110" x2="180" y2="210" stroke="#b4232c" stroke-width="2"/>
  <text x="242" y="126" font-size="12" fill="#1d6fd1" text-anchor="middle">a = 10 000 km</text>
  <text x="186" y="165" font-size="12" fill="#b4232c">b = 8000 km</text>
  <line x1="205" y1="0" x2="305" y2="60" stroke="#f2b880" stroke-width="2.5"/>
  <circle cx="255" cy="30" r="4" fill="#1f2a44"/>
  <text x="246" y="54" font-size="12" fill="#1f2a44" text-anchor="end">(6000, 6400) km</text>
  <text x="356" y="14" font-size="12" fill="#1f2a44" text-anchor="end">slope −0.6</text>
</svg>
```
:::

::: context kepler-equation Two clocks for one orbit
Johannes Kepler found that a planet sweeps out equal areas of its orbit in equal times. The mean anomaly $M$ is a pretend angle that ticks forward at a steady rate — where the body would be if it moved at an even pace. The eccentric anomaly $E$ is a real geometric angle that pins down where the body actually is.

Kepler's equation $M = E - e\sin E$ converts between them. Going from $E$ to $M$ is easy. Going from $M$ to $E$ — which is what you need to find a satellite at a given time — has no neat formula. You solve it by repeated guessing, and the linearisation lesson shows the fast way, Newton's method, which uses the very derivative found here.
:::

::: context arcsin-steep Why arcsine goes vertical
The graph of $\arcsin x$ is the graph of $\sin y$ flipped across the diagonal line $y = x$. Flipping swaps slopes for their reciprocals: a slope of $2$ becomes $1/2$. At the top of the sine wave the slope is $0$, and the reciprocal of $0$ is "infinitely steep". So $\arcsin x$ stands straight up at $x = 1$. The formula $1/\sqrt{1 - x^2}$ agrees: at $x = 1$ the bottom is zero.

In practice this means a small error in a measured sine near $\pm 1$ turns into a large error in the angle. That is one more reason navigation code prefers $\operatorname{atan2}$ to $\arcsin$.
:::

::: context doppler How a radar measures range rate
When a train blows its horn while coming toward you, the pitch sounds higher; as it moves away, lower. That is the **Doppler effect**. A radar sends out a radio wave and listens for the echo. If the target is moving away, the echo comes back at a slightly lower frequency. The shift is $2 f\dot\rho/c$, where $f$ is the radar's frequency and $c$ the speed of light, so measuring the shift measures $\dot\rho$ directly.

It only senses motion along the line of sight. Motion straight across the beam makes no shift at all — which is exactly what the formula $\dot\rho = (x\dot x + y\dot y)/\rho$ says.
:::

::: context los-split Splitting the velocity
Any velocity can be split into two pieces: one along the line from the radar to the rocket, and one straight across it. The first changes the range. The second changes the angle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="210" x2="350" y2="210" stroke="#6c7a93" stroke-width="1"/>
  <line x1="30" y1="210" x2="143.3" y2="21.2" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 4"/>
  <circle cx="30" cy="210" r="5" fill="#1f2a44"/>
  <text x="42" y="205" font-size="12" fill="#1f2a44">radar</text>
  <text x="76" y="160" font-size="12" fill="#1f2a44">line of sight</text>
  <circle cx="102" cy="90" r="5" fill="#1f2a44"/>
  <text x="112" y="100" font-size="12" fill="#1f2a44">rocket</text>
  <line x1="102" y1="90" x2="128" y2="12" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="102" y1="90" x2="143.3" y2="21.2" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="143.3" y1="21.2" x2="128" y2="12" stroke="#f2b880" stroke-width="2.5"/>
  <path d="M140.2,26.3 L135.1,23.2 L138.1,18.1" fill="none" stroke="#1f2a44" stroke-width="1"/>
  <text x="104" y="48" font-size="12" fill="#1d6fd1" text-anchor="end">velocity</text>
  <text x="152" y="44" font-size="12" fill="#b4232c">along the line of sight</text>
  <text x="152" y="58" font-size="12" fill="#b4232c">(changes the range)</text>
  <text x="152" y="16" font-size="12" fill="#1f2a44">across (changes the angle)</text>
</svg>
```

For the rocket in the example, the along-sight piece is $1235\,\mathrm{m/s}$ and the across piece is $\rho\dot\varepsilon = 23\,324 \times 0.0118 \approx 274\,\mathrm{m/s}$. Pythagoras puts them back together: $\sqrt{1235^2 + 274^2} \approx 1265\,\mathrm{m/s}$, the full speed.
:::

::: context jacobian-row Where this formula comes back
A navigation filter keeps a best guess of the rocket's position and velocity. Each time a radar measurement arrives, the filter asks: "if my guess nudged a little, how would the predicted measurement change?" Those sensitivities are derivatives, and for a range-rate measurement they come out of the same algebra as $\dot\rho = (x\dot x + y\dot y)/\rho$. Laid out in a row, one entry per state, they form one row of a matrix called the **measurement Jacobian**. You will build these in the estimation modules.
:::

::: context propellant-utilization Making both tanks run dry together
A rocket engine burns fuel and oxidizer in a set ratio. If the ratio drifts even slightly, one tank empties first, and whatever is left in the other is dead weight carried all the way to engine cutoff. A **propellant utilization** system watches the levels in both tanks and nudges the mixture ratio during the burn so they finish together. The Saturn V's upper stages flew such a system. The level rates you compute with related rates are its raw input.
:::
