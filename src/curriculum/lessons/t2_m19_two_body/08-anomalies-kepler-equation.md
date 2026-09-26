---
id: l08-anomalies-kepler-equation
title: True, eccentric and mean anomaly, and Kepler's equation
minutes: 20
covers:
  - true, eccentric and mean anomaly
  - Kepler equation: elliptic, hyperbolic and parabolic (Barker)
---

The orbit equation tells you the shape of the path. It does not give you the timetable.

Picture a swing. It whips through the bottom and hangs for a moment at each end. If you took a photo every second, most photos would show the swing near the ends, and very few would catch it at the bottom. A spacecraft on an elliptical orbit is the same: it races through periapsis, the low point, and crawls through apoapsis, the high point. So the angle that says where it is – the **true anomaly** – does not tick forward at a steady rate.

That makes the simplest scheduling question hard: *where will the spacecraft be one hour from now?* The orbit equation cannot answer it. [[Kepler found the way in 1609|kepler-1609]]. He invented a helper angle that *does* behave, and the link between that angle and time is **Kepler's equation**. It is the one equation every astrodynamicist solves every day.

On a vehicle, Kepler's equation is the analytic propagator – the formula that carries an orbit forward in time. A navigation filter predicting the state at its next measurement, a rendezvous planner working out when the target passes a given point, a ground station scheduling a contact: all of them turn time into mean anomaly, solve for eccentric anomaly, and convert to true anomaly and then to position. Doing the same with a step-by-step numerical integrator would be slower and less accurate.

This lesson defines the three anomalies, derives how they relate, derives Kepler's equation and its hyperbolic and parabolic (Barker) cousins from the constant angular momentum, and computes times for a GTO, a departure hyperbola and a parabola. Solving the equations for the angle, when the time is given, is the next lesson.

## Three anomalies

In orbit mechanics an **[[anomaly|anomaly-word]]** is an angle that says where the spacecraft is along its orbit, counted from periapsis. There are three, and each has a job.

The **true anomaly** $\nu$ (read "nu") is the real, physical angle at the focus – Earth's centre – from periapsis to the spacecraft. It is what the orbit equation uses, and it gives the position directly. But its rate, $\dot{\nu} = h/r^2$ (read "nu-dot"), changes around the orbit: large when $r$ is small, small when $r$ is large.

The **mean anomaly** $M$ is the angle of an imaginary companion. Picture a [[fictitious body|mean-sun]] going around a circle at a perfectly steady rate $n = \sqrt{\mu/a^3}$, called the **mean motion**, and passing periapsis at the same instant $t_p$ as the real spacecraft. Its angle is

$$
M = n\,(t - t_p).
$$

That is a straight-line function of time and nothing else. $M$ is not an angle you could point at on the orbit. It is time in disguise, measured in radians: one full period moves $M$ forward by exactly $2\pi$.

The **eccentric anomaly** $E$ is the bridge between the two. It is a real geometric angle, drawn on a helper circle, and it has two friendly links. $\nu \leftrightarrow E$ is closed-form trigonometry. $E \leftrightarrow M$ is Kepler's equation. The whole art is to go through $E$.

## The eccentric anomaly

Draw the ellipse, with semi-major axis $a$. Around it, draw a circle of radius $a$ with the same centre – the **[[auxiliary circle|auxiliary-circle]]**. It touches the ellipse at both ends of the long axis.

Now take the spacecraft's position on the ellipse. Draw a line from it straight across, perpendicular to the major axis, until it meets the circle. The **eccentric anomaly** $E$ is the angle at the *centre* of the ellipse, from periapsis to that point on the circle.

Why does this help? Because an ellipse is a [[circle squashed flat|squashed-circle]] by the factor $b/a$, perpendicular to the major axis ($b$ is the semi-minor axis). A point on the circle at angle $E$ sits at $(a\cos E,\; a\sin E)$ from the centre. The matching point on the ellipse has the same $x$ and a squashed $y$: $(a\cos E,\; b\sin E)$.

The focus is a distance $ae$ from the centre, toward periapsis. Move the origin there. In perifocal coordinates, measured from the focus, the spacecraft is at

$$
x = a\cos E - ae = a(\cos E - e), \qquad y = b\sin E = a\sqrt{1 - e^2}\,\sin E .
$$

(The second step uses $b = a\sqrt{1 - e^2}$ from the conics lesson.)

The distance from the focus follows from Pythagoras:

$$
r^2 = a^2\left[(\cos E - e)^2 + (1 - e^2)\sin^2 E\right] = a^2\left[\cos^2 E - 2e\cos E + e^2 + \sin^2 E - e^2\sin^2 E\right] = a^2\left[1 - 2e\cos E + e^2\cos^2 E\right].
$$

The middle step expands the square. The last uses $\cos^2 E + \sin^2 E = 1$ and $e^2 - e^2\sin^2 E = e^2\cos^2 E$. What is left is a perfect square, $(1 - e\cos E)^2$, so

$$
r = a\,(1 - e\cos E).
$$

Check the ends. $E = 0$ gives $r = a(1 - e) = r_p$, the periapsis radius. $E = \pi$ gives $a(1 + e) = r_a$, the apoapsis radius. Both right.

Compare this with the orbit equation $r = p/(1 + e\cos\nu)$. The new form has no division at all. That is one reason $E$ is the favourite variable inside propagators.

## Relating true and eccentric anomaly

The same point has two descriptions, so set them equal. In perifocal coordinates, $x = r\cos\nu$ and $y = r\sin\nu$. Divide the $x$ and $y$ above by $r = a(1 - e\cos E)$:

$$
\cos\nu = \frac{\cos E - e}{1 - e\cos E}, \qquad \sin\nu = \frac{\sqrt{1 - e^2}\,\sin E}{1 - e\cos E}.
$$

These are correct, but clumsy to turn around. The half-angle form is cleaner. Using the identity $\tan(\nu/2) = \sin\nu/(1 + \cos\nu)$:

$$
\tan\frac{\nu}{2} = \frac{\sqrt{1 - e^2}\,\sin E}{(1 - e\cos E) + (\cos E - e)} = \frac{\sqrt{1 - e^2}\,\sin E}{(1 - e)(1 + \cos E)} = \sqrt{\frac{(1 - e)(1 + e)}{(1 - e)^2}}\;\frac{\sin E}{1 + \cos E}.
$$

The first step puts both fractions over the common $1 - e\cos E$, which then cancels. The second factors the bottom: $1 - e + \cos E - e\cos E = (1 - e)(1 + \cos E)$. The third writes $\sqrt{1 - e^2}/(1 - e)$ as one square root. Since $\sin E/(1 + \cos E) = \tan(E/2)$ by the same identity,

$$
\tan\frac{\nu}{2} = \sqrt{\frac{1 + e}{1 - e}}\;\tan\frac{E}{2}.
$$

The half-angles $\nu/2$ and $E/2$ are always in the same quadrant, because $\nu$ and $E$ are always on the same half of the orbit. So this one equation converts either way with no ambiguity.

In code, a two-argument arctangent is safer still. From the component forms:

$$
\nu = \operatorname{atan2}\!\left(\sqrt{1 - e^2}\,\sin E,\; \cos E - e\right), \qquad
E = \operatorname{atan2}\!\left(\sqrt{1 - e^2}\,\sin\nu,\; e + \cos\nu\right).
$$

The second comes from solving the component forms for $\cos E$ and $\sin E$: $\cos E = (e + \cos\nu)/(1 + e\cos\nu)$ and $\sin E = \sqrt{1 - e^2}\sin\nu/(1 + e\cos\nu)$.

::: key True and eccentric anomaly
$$
\tan\frac{\nu}{2} = \sqrt{\frac{1 + e}{1 - e}}\;\tan\frac{E}{2}, \qquad r = a\,(1 - e\cos E).
$$
Also $\cos\nu = \dfrac{\cos E - e}{1 - e\cos E}$ and $\cos E = \dfrac{e + \cos\nu}{1 + e\cos\nu}$.
:::

## Kepler's equation

Now bring in time. The tool is the angular momentum, which stays constant: $h = r^2\dot{\nu}$. Turned around, a small step in angle $d\nu$ takes a small time

$$
dt = \frac{r^2\,d\nu}{h}.
$$

In terms of $\nu$ this is hard to add up, because $r$ has a fraction in it. The plan is to switch the variable from $\nu$ to $E$, where $r$ is simple. The result is short; the steps below show every piece.

::: note Why it has to be true: from angular momentum to Kepler's equation
**Step 1 – how fast $\nu$ changes with $E$.** Differentiate the half-angle relation. The derivative of $\tan(x/2)$ is $\tfrac{1}{2}\sec^2(x/2)$, so

$$
\tfrac{1}{2}\sec^2\!\tfrac{\nu}{2}\,d\nu = \sqrt{\frac{1 + e}{1 - e}}\;\tfrac{1}{2}\sec^2\!\tfrac{E}{2}\,dE
\quad\Longrightarrow\quad
\frac{d\nu}{dE} = \sqrt{\frac{1 + e}{1 - e}}\;\frac{\cos^2(\nu/2)}{\cos^2(E/2)} .
$$

**Step 2 – remove $\nu$.** Use $\cos^2(\nu/2) = (1 + \cos\nu)/2$ and the component form of $\cos\nu$:

$$
1 + \cos\nu = \frac{(1 - e\cos E) + (\cos E - e)}{1 - e\cos E} = \frac{(1 - e)(1 + \cos E)}{1 - e\cos E},
$$

so $\cos^2(\nu/2) = \dfrac{(1 - e)\cos^2(E/2)}{1 - e\cos E}$. The $\cos^2(E/2)$ cancels, and

$$
\frac{d\nu}{dE} = \sqrt{\frac{1 + e}{1 - e}}\;\frac{1 - e}{1 - e\cos E} = \frac{\sqrt{1 - e^2}}{1 - e\cos E}.
$$

**Step 3 – substitute into $dt$.** With $r = a(1 - e\cos E)$:

$$
dt = \frac{a^2(1 - e\cos E)^2}{h}\;\frac{\sqrt{1 - e^2}}{1 - e\cos E}\,dE = \frac{a^2\sqrt{1 - e^2}}{h}\,(1 - e\cos E)\,dE .
$$

**Step 4 – the constant in front.** With $h = \sqrt{\mu p} = \sqrt{\mu a(1 - e^2)}$:

$$
\frac{a^2\sqrt{1 - e^2}}{\sqrt{\mu a (1 - e^2)}} = \frac{a^2}{\sqrt{\mu a}} = \sqrt{\frac{a^3}{\mu}} = \frac{1}{n}.
$$

**Step 5 – add it up.** So $n\,dt = (1 - e\cos E)\,dE$. Integrating from periapsis, where $E = 0$ at $t = t_p$:

$$
n\,(t - t_p) = E - e\sin E .
$$
:::

The left side is the mean anomaly. So:

$$
M = E - e\sin E .
$$

This is **Kepler's equation**. Given $E$, it hands you the time in one line. Given the time, you must solve it for $E$. There is no neat formula for that, because $E$ appears both on its own and inside a sine – the equation is **[[transcendental|transcendental]]**. Solving it is the next lesson.

The equation also confirms the swing picture. $M$ and $E$ agree at periapsis and apoapsis. On the outbound half, $E - M = e\sin E > 0$, so the eccentric anomaly runs *ahead* of the mean anomaly after periapsis, and behind it after apoapsis. The true anomaly runs further ahead still.

::: note Kepler's own route: area
Kepler got there with his second law – equal areas in equal times. The area swept from periapsis by the line from the focus is $(b/a)$ times the matching area on the auxiliary circle. That circle area is the pie slice $\tfrac{1}{2}a^2 E$ minus the triangle between the centre, the focus and the circle point, $\tfrac{1}{2}(ae)(a\sin E)$. So the swept area is $\tfrac{1}{2}ab\,(E - e\sin E)$. Area builds up at the steady rate $\pi ab/T$, so dividing gives $2\pi(t - t_p)/T = E - e\sin E$ – the same equation.
:::

### How far apart the three anomalies get

At periapsis and apoapsis all three anomalies are equal. In between they spread out, by an amount set by $e$.

For small $e$, expand in powers of $e$. To first order, $E \approx M + e\sin M$ and $\nu \approx E + e\sin E$. Stacking these and keeping the next term too gives

$$
\nu - M \approx 2e\sin M + \tfrac{5}{4}e^2\sin 2M + \cdots ,
$$

the classical **[[equation of the centre|equation-of-centre]]**.

For the ISS, with $e$ about $0.0006$, $2e = 0.0012\,\mathrm{rad} = 0.069^\circ$. The true position leads or lags the steady companion by at most about a fifteenth of a degree – about $8\,\mathrm{km}$ along the orbit. That is why circular approximations serve the ISS so well.

For the GTO the series is useless: $\nu - M$ reaches $90.7^\circ$ at $\nu = 126.5^\circ$. Only the exact relations will do.

A way to keep the order straight. On the outbound half ($0 < \nu < 180^\circ$) the true position is *ahead*: $\nu > E > M$. The spacecraft sprinted through periapsis and is now coasting. On the inbound half the inequalities reverse, and the steady companion catches up exactly at periapsis.

$E$ is also the natural choice for *drawing* an orbit. Step $E$ evenly and plot $(a(\cos E - e),\ a\sqrt{1 - e^2}\sin E)$, and the points are evenly spread around the auxiliary circle, so the ellipse is drawn with no crowding and no gaps. Step $\nu$ evenly and the far side crowds. [[Step $M$ evenly|equal-time-dots]] – which is what a fixed time step does – and the far side crowds even more, because that is where the spacecraft spends its time.

### Which anomaly to store

An element set needs one number to fix the position at its **epoch**, the instant it describes. Any of the three anomalies will do, and so will the time of periapsis passage $t_p$.

Published element sets almost always store $M$. It moves forward in a straight line, so updating an element set to a new epoch is one multiplication. And the average rate $n$ stored alongside it is the quantity a perturbation theory corrects most directly.

A handy summary: $\nu$ is what you want at the *end* of a computation, when you need a position. $E$ is what you want in the *middle*, when you need time and radius together. $M$ is what you want to *write down*.

::: example Time from perigee around a GTO
The GTO has $a = 24\,396.14\,\mathrm{km}$ and $e = 0.72831$. How long after perigee does it reach $\nu = 90^\circ$?

**Mean motion and period.** $a^3 = 1.4520 \times 10^{13}\,\mathrm{km^3}$, so $n = \sqrt{398\,600.4418/1.4520 \times 10^{13}} = 1.6569 \times 10^{-4}\,\mathrm{rad/s}$ and $T = 2\pi/n = 37\,922\,\mathrm{s}$, about $632$ minutes.

**True to eccentric.** Turn the half-angle formula around:

$$
\tan\frac{E}{2} = \sqrt{\frac{1 - e}{1 + e}}\,\tan 45^\circ = \sqrt{\frac{0.27169}{1.72831}} = 0.39648, \qquad E = 2\arctan 0.39648 = 43.255^\circ = 0.75494\,\mathrm{rad}.
$$

**Eccentric to mean.** $\sin E = 0.68525$, so $M = E - e\sin E = 0.75494 - 0.72831 \times 0.68525 = 0.75494 - 0.49907 = 0.25587\,\mathrm{rad} = 14.660^\circ$.

**Mean to time.** $t - t_p = M/n = 0.25587/1.6569 \times 10^{-4} = 1544\,\mathrm{s} = 25.7\,\mathrm{min}$.

**Sanity check.** $r = a(1 - e\cos E) = 24\,396.14\,(1 - 0.72831 \times 0.72831) = 11\,455.6\,\mathrm{km}$. That equals $p = a(1 - e^2)$, as it must at $\nu = 90^\circ$, where the orbit equation gives $r = p/(1 + 0)$.

So the spacecraft covers the first quarter-turn of true anomaly in $25.7$ minutes out of a $632$-minute period. The same steps at $\nu = 120^\circ$ give $E = 68.957^\circ$, $M = 30.011^\circ$ and $t = 52.7\,\mathrm{min}$. At $\nu = 179^\circ$ they give $E = 177.478^\circ$, $M = 175.642^\circ$ and $t = 308.4\,\mathrm{min}$ – only $7.6\,\mathrm{min}$ short of the half-period, $316.0\,\mathrm{min}$. The last degree before apogee takes over seven minutes. The first degree after perigee takes about eleven seconds.
:::

## The hyperbolic anomaly

For $e > 1$ the orbit is a hyperbola and never comes back. The helper circle becomes a helper hyperbola, and the ordinary trig functions become **[[hyperbolic functions|hyperbolic-functions]]** – $\sinh$ and $\cosh$, read "shine" and "cosh".

For a hyperbola, $a$ is negative, so we write $\lvert a \rvert$ for its size. Mark points on the branch with $\lvert a \rvert\cosh H$ and $b\sinh H$ from the centre, where $b = \lvert a \rvert\sqrt{e^2 - 1}$. The number $H$ is the **hyperbolic anomaly**. The occupied focus is $\lvert a \rvert e$ from the centre, on the same side as the branch. Measured from the focus toward periapsis,

$$
x = \lvert a \rvert\,(e - \cosh H), \qquad y = \lvert a \rvert\sqrt{e^2 - 1}\,\sinh H,
$$

and the same perfect-square computation as before (now using $\cosh^2 H - \sinh^2 H = 1$) gives

$$
r = \lvert a \rvert\,(e\cosh H - 1) = a\,(1 - e\cosh H).
$$

The second form, with $a < 0$, matches the elliptic $r = a(1 - e\cos E)$ with $\cos$ swapped for $\cosh$.

The half-angle relation becomes

$$
\tan\frac{\nu}{2} = \sqrt{\frac{e + 1}{e - 1}}\;\tanh\frac{H}{2},
$$

by the same algebra, now with $\cos\nu = (e - \cosh H)/(e\cosh H - 1)$ and $\sin\nu = \sqrt{e^2 - 1}\sinh H/(e\cosh H - 1)$.

Differentiating it gives $d\nu/dH = \sqrt{e^2 - 1}/(e\cosh H - 1)$. Then $dt = r^2\,d\nu/h$, with $h = \sqrt{\mu\lvert a \rvert(e^2 - 1)}$, reduces exactly as before to

$$
\sqrt{\frac{\mu}{\lvert a \rvert^3}}\,(t - t_p) = e\sinh H - H \equiv M_h .
$$

This is the **hyperbolic Kepler equation**. (The symbol $\equiv$ means "which we define as".) The hyperbolic mean anomaly $M_h$ is again a straight-line function of time, with the hyperbolic mean motion $n_h = \sqrt{\mu/\lvert a \rvert^3}$.

But $H$ is not an angle, and it never repeats. It runs from $-\infty$ to $+\infty$ as the spacecraft comes in from far away and leaves again, and $M_h$ grows without limit because $\sinh$ does.

::: key Kepler's equation, elliptic and hyperbolic
Elliptic: $M = E - e\sin E$, with $M = n\,(t - t_p)$ and $n = \sqrt{\mu/a^3}$. Hyperbolic: $M_h = e\sinh H - H$, with $M_h = \sqrt{\mu/\lvert a \rvert^3}\,(t - t_p)$.
:::

::: example Time along a departure hyperbola
A departure hyperbola has $r_p = 6678\,\mathrm{km}$ and $e = 1.4$. How long after perigee does it reach $\nu = 90^\circ$?

**Size and rate.** $a = r_p/(1 - e) = 6678/(-0.4) = -16\,695\,\mathrm{km}$. Then $n_h = \sqrt{398\,600.4418/16\,695^3} = 2.9268 \times 10^{-4}\,\mathrm{s^{-1}}$.

**True to hyperbolic.**

$$
\tanh\frac{H}{2} = \sqrt{\frac{e - 1}{e + 1}}\,\tan 45^\circ = \sqrt{\frac{0.4}{2.4}} = 0.40825, \qquad H = 2\operatorname{artanh}(0.40825) = 0.86702.
$$

($\operatorname{artanh}$ is the inverse of $\tanh$.)

**Hyperbolic to mean.** $\sinh(0.86702) = 0.97980$, so $M_h = 1.4 \times 0.97980 - 0.86702 = 1.37171 - 0.86702 = 0.50470$.

**Mean to time.** $t - t_p = 0.50470/2.9268 \times 10^{-4} = 1724\,\mathrm{s} = 28.7\,\mathrm{min}$.

**Sanity check.** $\cosh H = 1.40000$, so $r = \lvert a \rvert(e\cosh H - 1) = 16\,695\,(1.4 \times 1.4 - 1) = 16\,695 \times 0.96 = 16\,027\,\mathrm{km}$. That is $p = \lvert a \rvert(e^2 - 1)$, as it must be at $\nu = 90^\circ$.

Further out: at $\nu = 120^\circ$, $H = 1.7627$, $M_h = 2.1971$ and $t - t_p = 7507\,\mathrm{s} = 125\,\mathrm{min}$, by which time $r = 53\,424\,\mathrm{km}$. Two hours after perigee the spacecraft is already beyond GEO. Its total speed is still dropping toward the hyperbolic excess speed $v_\infty = \sqrt{\mu/\lvert a \rvert} = 4.89\,\mathrm{km/s}$, while its outward (radial) speed is still growing toward that same value as the path straightens.
:::

## Barker's equation for the parabola

For $e = 1$ – a parabola – neither $a$ nor $E$ exists. But here the time integral can be done directly, with no helper angle. The orbit equation with $e = 1$ is $r = p/(1 + \cos\nu)$, which by the half-angle identity is $r = (p/2)\sec^2(\nu/2)$. And $h = \sqrt{\mu p}$. So

$$
dt = \frac{r^2}{h}\,d\nu = \frac{p^2}{4\sqrt{\mu p}}\,\sec^4\frac{\nu}{2}\,d\nu .
$$

Substitute $\tau = \tan(\nu/2)$ (read "tau"). Then $d\tau = \tfrac{1}{2}\sec^2(\nu/2)\,d\nu$ and $\sec^2(\nu/2) = 1 + \tau^2$, so $\sec^4(\nu/2)\,d\nu = 2(1 + \tau^2)\,d\tau$ and

$$
dt = \frac{p^2}{2\sqrt{\mu p}}\,(1 + \tau^2)\,d\tau = \tfrac{1}{2}\sqrt{\frac{p^3}{\mu}}\,(1 + \tau^2)\,d\tau .
$$

Integrating from periapsis ($\tau = 0$):

$$
\sqrt{\frac{\mu}{p^3}}\,(t - t_p) = \tfrac{1}{2}\tan\frac{\nu}{2} + \tfrac{1}{6}\tan^3\frac{\nu}{2} .
$$

This is **[[Barker's equation|barker-comets]]**. Unlike its elliptic and hyperbolic cousins, it is a *cubic* in $\tan(\nu/2)$ – a polynomial – and a cubic can be solved exactly. The next lesson does so. The quantity $\sqrt{\mu/p^3}$ plays the role of the mean motion, and the parabolic "mean anomaly" $B = \sqrt{\mu/p^3}(t - t_p)$ is again a straight-line function of time.

::: example Time on a parabola
A parabola has $r_p = 6678.137\,\mathrm{km}$. How long after periapsis does it reach $\nu = 90^\circ$ and $\nu = 120^\circ$?

**The rate.** For a parabola $p = 2r_p = 13\,356.27\,\mathrm{km}$. Then $p^3 = 2.3826 \times 10^{12}\,\mathrm{km^3}$ and $\sqrt{\mu/p^3} = \sqrt{398\,600.4418/2.3826 \times 10^{12}} = 4.0902 \times 10^{-4}\,\mathrm{s^{-1}}$.

**At $\nu = 90^\circ$.** $\tau = \tan 45^\circ = 1$, so the right-hand side is $\tfrac{1}{2} + \tfrac{1}{6} = 0.66667$. Then $t - t_p = 0.66667/4.0902 \times 10^{-4} = 1630\,\mathrm{s} = 27.2\,\mathrm{min}$, and $r = p = 13\,356\,\mathrm{km}$.

**At $\nu = 120^\circ$.** $\tau = \tan 60^\circ = \sqrt{3}$, so the right-hand side is $\tfrac{1}{2}\sqrt{3} + \tfrac{1}{6}(3\sqrt{3}) = 0.86603 + 0.86603 = 1.73205$. That gives $t - t_p = 4235\,\mathrm{s} = 70.6\,\mathrm{min}$ and $r = \tfrac{p}{2}(1 + 3) = 2p = 26\,713\,\mathrm{km}$.

**Compare the three conics** with about the same periapsis. To reach $\nu = 90^\circ$ the GTO ($e = 0.73$) takes $25.7\,\mathrm{min}$, the parabola $27.2\,\mathrm{min}$ and the $e = 1.4$ hyperbola $28.7\,\mathrm{min}$. The more energetic orbit is *slower* to $90^\circ$. That sounds backwards, but its $p$ is larger – the point at $\nu = 90^\circ$ is farther out – so it has farther to go.
:::

::: warning Radians, always
$M = E - e\sin E$ is only true when $E$ and $M$ are in radians. In degrees it would read $M = E - (180^\circ/\pi)\,e\sin E$, and nobody writes it that way. A mean anomaly read from a two-line element set is in degrees – convert it before doing anything else. The same goes for $n$: radians per second, not revolutions per day.
:::

::: warning M is a clock, not a place
The mean anomaly is proportional to time since periapsis. It is not the angle to anything you could point at. Do not compute a radius from it, and do not compare it with $\nu$ except at the apsides, where all three anomalies agree. In between, $M$, $E$ and $\nu$ can differ by tens of degrees on an eccentric orbit – $M = 14.7^\circ$ against $\nu = 90^\circ$ in the GTO example.
:::

## Check yourself

::: check
A satellite with $e = 0.1$ has eccentric anomaly $E = 60^\circ$. Find $\nu$, $M$ and $r/a$.
:::

::: answer
**True anomaly.** $\tan(\nu/2) = \sqrt{1.1/0.9}\,\tan 30^\circ = 1.10554 \times 0.57735 = 0.63828$, so $\nu = 2\arctan 0.63828 = 65.1^\circ$.

**Mean anomaly.** In radians, $E = 1.04720$ and $\sin E = 0.86603$. So $M = 1.04720 - 0.1 \times 0.86603 = 0.96060\,\mathrm{rad} = 55.0^\circ$.

**Radius.** $r/a = 1 - e\cos E = 1 - 0.1 \times 0.5 = 0.95$.

The order $M < E < \nu$ ($55.0^\circ < 60^\circ < 65.1^\circ$) is right for the outbound half.
:::

::: check
Why is $E$ preferred over $\nu$ as the variable inside a propagator, even though $\nu$ is the physically meaningful angle?
:::

::: answer
Because time is simple in $E$ and complicated in $\nu$. The radius is $r = a(1 - e\cos E)$ with no division, and the time is $t - t_p = (E - e\sin E)/n$ in closed form. In terms of $\nu$, the time integral $\int r^2\,d\nu/h$ has no simple form. So a propagator steps $M$ forward in time, solves Kepler's equation once for $E$, and converts to $\nu$ – and then to position – with closed-form trigonometry.
:::

::: check
Derive $r = a(1 - e\cos E)$ from the perifocal coordinates $x = a(\cos E - e)$, $y = a\sqrt{1 - e^2}\sin E$.
:::

::: answer
Start from $r^2 = x^2 + y^2 = a^2[(\cos E - e)^2 + (1 - e^2)\sin^2 E]$.

Expand the bracket: $\cos^2 E - 2e\cos E + e^2 + \sin^2 E - e^2\sin^2 E$.

Group: $(\cos^2 E + \sin^2 E) - 2e\cos E + e^2(1 - \sin^2 E) = 1 - 2e\cos E + e^2\cos^2 E$.

That is $(1 - e\cos E)^2$. Take the square root – positive, since $e\cos E < 1$ – to get $r = a(1 - e\cos E)$.
:::

::: check
A spacecraft on a hyperbola with $e = 2$ and $\lvert a \rvert = 20\,000\,\mathrm{km}$ has $H = 1.0$. How long ago did it pass periapsis, and what is its radius?
:::

::: answer
**Mean anomaly.** $\sinh 1 = 1.17520$, so $M_h = e\sinh H - H = 2 \times 1.17520 - 1 = 1.35041$.

**Rate.** $n_h = \sqrt{\mu/\lvert a \rvert^3} = \sqrt{398\,600.4418/8 \times 10^{12}} = 2.2321 \times 10^{-4}\,\mathrm{s^{-1}}$.

**Time.** $t - t_p = 1.35041/2.2321 \times 10^{-4} = 6050\,\mathrm{s}$, about $101\,\mathrm{min}$.

**Radius.** $\cosh 1 = 1.54308$, so $r = \lvert a \rvert(e\cosh H - 1) = 20\,000\,(2 \times 1.54308 - 1) = 41\,723\,\mathrm{km}$.
:::

::: check
Show that Barker's equation behaves correctly as $\nu \to 180^\circ$, and explain what that means physically.
:::

::: answer
As $\nu \to 180^\circ$, $\nu/2 \to 90^\circ$ and $\tan(\nu/2) \to \infty$. So the right-hand side $\tfrac{1}{2}\tau + \tfrac{1}{6}\tau^3 \to \infty$, and therefore $t - t_p \to \infty$.

The spacecraft takes forever to reach the direction $\nu = 180^\circ$, which is where $r \to \infty$ on a parabola. It escapes, but its speed $\sqrt{2\mu/r}$ shrinks toward zero, so it never actually "arrives" anywhere. The parabola is the borderline escape.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\nu$ | True anomaly, the physical angle at the focus from periapsis |
| $E$ | Eccentric anomaly, angle at the centre of the auxiliary circle |
| $M = n(t - t_p)$, $n = \sqrt{\mu/a^3}$ | Mean anomaly: time, in radians |
| $x = a(\cos E - e)$, $y = a\sqrt{1 - e^2}\sin E$ | Perifocal coordinates in terms of $E$ |
| $r = a(1 - e\cos E)$ | Radius from eccentric anomaly |
| $\tan\frac{\nu}{2} = \sqrt{\frac{1 + e}{1 - e}}\tan\frac{E}{2}$ | Anomaly conversion; also $E = \operatorname{atan2}(\sqrt{1 - e^2}\sin\nu,\ e + \cos\nu)$ |
| $M = E - e\sin E$ | Kepler's equation, from $n\,dt = (1 - e\cos E)\,dE$ |
| $r = a(1 - e\cosh H)$, $\tan\frac{\nu}{2} = \sqrt{\frac{e + 1}{e - 1}}\tanh\frac{H}{2}$ | Hyperbolic anomaly |
| $M_h = e\sinh H - H = \sqrt{\mu/\lvert a \rvert^3}\,(t - t_p)$ | Hyperbolic Kepler equation |
| $\sqrt{\mu/p^3}(t - t_p) = \frac{1}{2}\tan\frac{\nu}{2} + \frac{1}{6}\tan^3\frac{\nu}{2}$ | Barker's equation for the parabola |

The next lesson runs these equations the hard way round: given the time, find the anomaly. That means Newton's method, why it fails at high eccentricity, and the starting points and fallbacks that make it robust.

::: context kepler-1609 Eight minutes of arc
Johannes Kepler published his first two laws in *Astronomia Nova* ("New Astronomy") in 1609, working from Tycho Brahe's careful naked-eye observations of Mars. The old circle-based models missed Mars's observed position by about 8 minutes of arc – roughly a quarter of the Moon's width. Kepler refused to blame the data, and the ellipse, the equal-areas law and the equation that now carries his name came out of that refusal.
:::

::: context anomaly-word An old word for irregular motion
"Anomaly" comes from a Greek word meaning "unevenness". Ancient and medieval astronomers used it for the part of a planet's motion that was *not* steady – the speeding up and slowing down. The angle measuring it kept the name. So "true anomaly" literally means "the real, uneven angle", and "mean anomaly" means "the averaged, steady one". Nothing is wrong with the orbit; the word is older than the physics.
:::

::: context mean-sun Clocks already use a pretend body
You have met this trick before, on your wrist. Earth's orbit is slightly elliptical, so the real Sun does not cross the sky at a perfectly steady pace, and a sundial drifts against a clock by up to about $16$ minutes over the year. Clock time is defined by a make-believe "mean Sun" that moves at the average rate. The mean anomaly is the same idea: a steady imaginary companion that is easy to compute, which you then correct to find the real position.
:::

::: context auxiliary-circle Drawing the eccentric anomaly
Here is the construction for $e = 0.6$ and $E = 60^\circ$. The spacecraft $P$ sits on the ellipse. Go straight up to the auxiliary circle to get $Q$. $E$ is measured at the centre $C$; $\nu$ is measured at the focus $F$, where Earth is.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="140" cy="105" r="90" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <ellipse cx="140" cy="105" rx="90" ry="72" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="105" x2="240" y2="105" stroke="#6c7a93" stroke-width="1"/>
  <line x1="185" y1="27.06" x2="185" y2="105" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="3 3"/>
  <line x1="140" y1="105" x2="185" y2="27.06" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="194" y1="105" x2="185" y2="42.65" stroke="#b4232c" stroke-width="2.5"/>
  <path d="M160,105 A20,20 0 0,0 150,87.68" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M210,105 A16,16 0 0,0 191.72,89.16" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="140" cy="105" r="3.5" fill="#1f2a44"/>
  <circle cx="194" cy="105" r="5" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="185" cy="27.06" r="4" fill="#1d6fd1"/>
  <circle cx="185" cy="42.65" r="4" fill="#b4232c"/>
  <text x="128" y="122" font-size="12" fill="#1f2a44">C</text>
  <text x="196" y="122" font-size="12" fill="#1f2a44">F</text>
  <text x="191" y="24" font-size="12" fill="#1d6fd1">Q</text>
  <text x="170" y="52" font-size="12" fill="#b4232c">P</text>
  <text x="161" y="96" font-size="12" fill="#1d6fd1">E</text>
  <text x="212" y="96" font-size="12" fill="#b4232c">ν</text>
  <text x="244" y="60" font-size="12" fill="#1d6fd1">E = 60° at centre</text>
  <text x="244" y="78" font-size="12" fill="#b4232c">ν = 98.2° at focus</text>
  <text x="244" y="150" font-size="11" fill="#6c7a93">dashed: auxiliary</text>
  <text x="244" y="164" font-size="11" fill="#6c7a93">circle, radius a</text>
</svg>
```

Check with the formula: $\tan(\nu/2) = \sqrt{1.6/0.4}\,\tan 30^\circ = 1.1547$, so $\nu = 98.2^\circ$. Near periapsis, $\nu$ runs ahead of $E$.
:::

::: context squashed-circle An ellipse is a squashed circle
Take a circle of radius $a$ and press it flat so that every height shrinks by the same factor $b/a$. The result is exactly an ellipse with semi-axes $a$ and $b$. This also gives the ellipse's area for free: the circle's area $\pi a^2$, squashed by $b/a$, becomes $\pi ab$ – the number that appears when Kepler's second law is turned into a period.
:::

::: context transcendental Equations algebra cannot finish
An equation is **transcendental** when no finite recipe of adding, multiplying and taking roots can solve it. $x^2 = 5$ is not: $x = \sqrt{5}$. But in $M = E - e\sin E$ the unknown sits both outside and inside a sine, and no rearranging frees it. Kepler knew this and solved his equation by trial and correction. Computers still do essentially that – very fast, and with some care about where to start.
:::

::: context equation-of-centre A name from astronomy's past
The "equation of the centre" is how far a body's real position is ahead of or behind its average position. For Earth's own orbit, with $e \approx 0.0167$, the leading term $2e$ is about $0.033\,\mathrm{rad}$, or about $1.9^\circ$. That is why the Sun, seen from Earth, runs up to about two degrees ahead of or behind a steady pace – one of the two reasons sundials and clocks disagree.
:::

::: context equal-time-dots Where a spacecraft spends its time
These twelve dots on the GTO are equally spaced in time – equal steps of mean anomaly, $30^\circ$ each, about $53$ minutes apart. Earth is at the focus on the right.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="107" rx="140" ry="95.93" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="281.96" cy="107" r="7" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <g fill="#b4232c">
    <circle cx="320" cy="107" r="4"/><circle cx="230.3" cy="17.5" r="4"/><circle cx="153.4" cy="12.8" r="4"/>
    <circle cx="100.9" cy="27.9" r="4"/><circle cx="66.3" cy="51.1" r="4"/><circle cx="46.5" cy="78.2" r="4"/>
    <circle cx="40" cy="107" r="4"/><circle cx="46.5" cy="135.8" r="4"/><circle cx="66.3" cy="162.9" r="4"/>
    <circle cx="100.9" cy="186.1" r="4"/><circle cx="153.4" cy="201.2" r="4"/><circle cx="230.3" cy="196.5" r="4"/>
  </g>
  <text x="268" y="130" font-size="11" fill="#1f2a44">Earth</text>
  <text x="326" y="111" font-size="11" fill="#1f2a44">perigee</text>
  <text x="180" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">12 dots, equal time apart</text>
  <text x="180" y="118" font-size="11" fill="#6c7a93" text-anchor="middle">crowded near apogee (left)</text>
</svg>
```

Five of the twelve dots bunch up on the left, near apogee. On the right the gaps are huge: the whole right-hand end of the orbit, from the lower dot near $x = 230$ round through perigee to the upper one, takes only two steps – about $105$ minutes of the $632$.
:::

::: context hyperbolic-functions Cosh and sinh, the hyperbola's cosine and sine
$\cosh H = (e^H + e^{-H})/2$ and $\sinh H = (e^H - e^{-H})/2$. (Here $e$ is Euler's number, $2.718\ldots$, not the eccentricity.) Just as $(\cos t, \sin t)$ walks around the circle $x^2 + y^2 = 1$, $(\cosh H, \sinh H)$ walks along the hyperbola $x^2 - y^2 = 1$, because $\cosh^2 H - \sinh^2 H = 1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="240" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="100" y1="20" x2="100" y2="195" stroke="#6c7a93" stroke-width="1"/>
  <line x1="20" y1="190" x2="190" y2="20" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="20" y1="30" x2="190" y2="200" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="100" cy="110" r="40" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="189.4,190.0 182.4,182.0 175.5,174.0 168.8,166.0 162.5,158.0 156.6,150.0 151.2,142.0 146.6,134.0 143.1,126.0 140.8,118.0 140.0,110.0 140.8,102.0 143.1,94.0 146.6,86.0 151.2,78.0 156.6,70.0 162.5,62.0 168.8,54.0 175.5,46.0 182.4,38.0 189.4,30.0"/>
  <circle cx="121.61" cy="76.34" r="4" fill="#1d6fd1"/>
  <circle cx="161.72" cy="62.99" r="4" fill="#b4232c"/>
  <text x="200" y="60" font-size="12" fill="#b4232c">(cosh 1, sinh 1)</text>
  <text x="200" y="76" font-size="12" fill="#b4232c">on x² − y² = 1</text>
  <text x="200" y="130" font-size="12" fill="#1d6fd1">(cos 1, sin 1)</text>
  <text x="200" y="146" font-size="12" fill="#1d6fd1">on x² + y² = 1</text>
</svg>
```

Unlike the circle, the hyperbola never closes, so $H$ never repeats.
:::

::: context barker-comets Named for a comet watcher
Thomas Barker, an 18th-century English amateur astronomer, published a table for this equation in a 1757 book about comets, to make their paths easy to compute. Many comets fall in from the far outer Solar System on orbits so stretched that, near the Sun, a parabola describes them almost perfectly – which is exactly the case this equation handles.
:::
