---
id: l08-anomalies-kepler-equation
title: True, eccentric and mean anomaly, and Kepler's equation
minutes: 21
covers:
  - true, eccentric and mean anomaly
  - Kepler equation: elliptic, hyperbolic and parabolic (Barker)
---

The orbit equation tells you the shape of the path but not the timetable. Ask the simplest scheduling question – where will the spacecraft be one hour from now? – and the orbit equation has no answer, because the true anomaly does not advance uniformly: it races through periapsis and crawls through apoapsis. Kepler found the answer in 1609 by inventing an auxiliary angle that *does* behave, and the relation between that angle and time is Kepler's equation. It is the one transcendental equation every astrodynamicist solves daily.

On a vehicle, Kepler's equation is the analytic propagator. A navigation filter that must predict the state at the next measurement time, a rendezvous planner computing when the target will pass a given point, a ground station scheduling a contact – all of them convert time into mean anomaly, solve for eccentric anomaly, and convert to true anomaly and then to position. Doing this with a numerical integrator would be slower and less accurate.

This lesson defines the three anomalies, derives the relations between them, derives Kepler's equation and its hyperbolic and parabolic (Barker) counterparts from the constancy of angular momentum, and computes times for a GTO, a departure hyperbola and a parabola. Solving the equations numerically is the subject of the next lesson.

## Three anomalies

The *true anomaly* $\nu$ is the physical angle at the focus from periapsis to the spacecraft. It is what the orbit equation uses and what determines the position directly, but its rate $\dot{\nu} = h/r^2$ varies around the orbit.

The *mean anomaly* $M$ is the angle a fictitious body would have if it moved around a circle at the constant rate $n = \sqrt{\mu/a^3}$, passing periapsis at the same instant $t_p$ as the real spacecraft:

$$
M = n\,(t - t_p).
$$

It is a linear function of time and nothing else. It is not a geometric angle you could measure on the orbit; it is time in disguise, measured in radians, and one full period corresponds to $M$ advancing by $2\pi$.

The *eccentric anomaly* $E$ is the bridge between them: a geometric angle, defined on an auxiliary circle, that relates algebraically to $\nu$ and transcendentally-but-simply to $M$. The whole art is that $\nu \leftrightarrow E$ is closed-form trigonometry and $E \leftrightarrow M$ is Kepler's equation.

## The eccentric anomaly

Draw the ellipse with semi-major axis $a$ and its *auxiliary circle* of radius $a$ about the same centre. From the spacecraft's position, drop a perpendicular to the major axis and extend it to meet the circle. The eccentric anomaly $E$ is the angle at the *centre* of the ellipse from periapsis to that point on the circle.

An ellipse is a circle squashed by the factor $b/a$ perpendicular to the major axis, so a point on the circle at angle $E$ has coordinates $(a\cos E, a\sin E)$ from the centre, and the corresponding point on the ellipse has coordinates $(a\cos E, b\sin E)$. The focus sits at distance $ae$ from the centre toward periapsis. In perifocal coordinates, measured from the focus,

$$
x = a\cos E - ae = a(\cos E - e), \qquad y = b\sin E = a\sqrt{1 - e^2}\,\sin E .
$$

The distance from the focus follows:

$$
r^2 = a^2\left[(\cos E - e)^2 + (1 - e^2)\sin^2 E\right] = a^2\left[\cos^2 E - 2e\cos E + e^2 + \sin^2 E - e^2\sin^2 E\right] = a^2\left[1 - 2e\cos E + e^2\cos^2 E\right],
$$

which is a perfect square, so

$$
r = a\,(1 - e\cos E).
$$

Check the ends: $E = 0$ gives $r = a(1 - e) = r_p$ and $E = \pi$ gives $a(1 + e) = r_a$. Compared with the orbit equation $r = p/(1 + e\cos\nu)$, this is a much friendlier expression – no division – and it is one reason $E$ is the preferred variable inside propagators.

## Relating true and eccentric anomaly

Equate the two descriptions of the same point. In perifocal coordinates $x = r\cos\nu$ and $y = r\sin\nu$, so with $r = a(1 - e\cos E)$,

$$
\cos\nu = \frac{\cos E - e}{1 - e\cos E}, \qquad \sin\nu = \frac{\sqrt{1 - e^2}\,\sin E}{1 - e\cos E}.
$$

These are correct but clumsy to invert. The half-angle form is cleaner. Using $\tan(\nu/2) = \sin\nu/(1 + \cos\nu)$,

$$
\tan\frac{\nu}{2} = \frac{\sqrt{1 - e^2}\,\sin E}{(1 - e\cos E) + (\cos E - e)} = \frac{\sqrt{1 - e^2}\,\sin E}{(1 - e)(1 + \cos E)} = \sqrt{\frac{(1 - e)(1 + e)}{(1 - e)^2}}\;\frac{\sin E}{1 + \cos E},
$$

and since $\sin E/(1 + \cos E) = \tan(E/2)$,

$$
\tan\frac{\nu}{2} = \sqrt{\frac{1 + e}{1 - e}}\;\tan\frac{E}{2}.
$$

Because $\nu/2$ and $E/2$ are always in the same quadrant (both angles are in the same half of the orbit), this single equation converts either way with no ambiguity. In code a two-argument arctangent is safer still: from the component forms,

$$
\nu = \operatorname{atan2}\!\left(\sqrt{1 - e^2}\,\sin E,\; \cos E - e\right), \qquad
E = \operatorname{atan2}\!\left(\sqrt{1 - e^2}\,\sin\nu,\; e + \cos\nu\right),
$$

the second following by solving the component forms for $\cos E$ and $\sin E$: $\cos E = (e + \cos\nu)/(1 + e\cos\nu)$ and $\sin E = \sqrt{1 - e^2}\sin\nu/(1 + e\cos\nu)$.

::: key True and eccentric anomaly
$$
\tan\frac{\nu}{2} = \sqrt{\frac{1 + e}{1 - e}}\;\tan\frac{E}{2}, \qquad r = a\,(1 - e\cos E).
$$
Also $\cos\nu = \dfrac{\cos E - e}{1 - e\cos E}$ and $\cos E = \dfrac{e + \cos\nu}{1 + e\cos\nu}$.
:::

## Kepler's equation

Now bring in time through the angular momentum: $h = r^2\dot{\nu}$, so $dt = r^2\,d\nu/h$. The plan is to change the integration variable from $\nu$ to $E$, where $r$ is simple. Differentiate the half-angle relation:

$$
\tfrac{1}{2}\sec^2\!\tfrac{\nu}{2}\,d\nu = \sqrt{\frac{1 + e}{1 - e}}\;\tfrac{1}{2}\sec^2\!\tfrac{E}{2}\,dE
\quad\Longrightarrow\quad
\frac{d\nu}{dE} = \sqrt{\frac{1 + e}{1 - e}}\;\frac{\cos^2(\nu/2)}{\cos^2(E/2)} .
$$

Express $\cos^2(\nu/2) = (1 + \cos\nu)/2$ through $E$: $1 + \cos\nu = \dfrac{(1 - e\cos E) + (\cos E - e)}{1 - e\cos E} = \dfrac{(1 - e)(1 + \cos E)}{1 - e\cos E}$, so $\cos^2(\nu/2) = \dfrac{(1 - e)\cos^2(E/2)}{1 - e\cos E}$ and

$$
\frac{d\nu}{dE} = \sqrt{\frac{1 + e}{1 - e}}\;\frac{1 - e}{1 - e\cos E} = \frac{\sqrt{1 - e^2}}{1 - e\cos E}.
$$

Substitute into $dt = r^2\,d\nu/h$ with $r = a(1 - e\cos E)$:

$$
dt = \frac{a^2(1 - e\cos E)^2}{h}\;\frac{\sqrt{1 - e^2}}{1 - e\cos E}\,dE = \frac{a^2\sqrt{1 - e^2}}{h}\,(1 - e\cos E)\,dE .
$$

The prefactor is a constant. With $h = \sqrt{\mu p} = \sqrt{\mu a(1 - e^2)}$,

$$
\frac{a^2\sqrt{1 - e^2}}{\sqrt{\mu a (1 - e^2)}} = \frac{a^2}{\sqrt{\mu a}} = \sqrt{\frac{a^3}{\mu}} = \frac{1}{n}.
$$

So $n\,dt = (1 - e\cos E)\,dE$, and integrating from periapsis ($E = 0$ at $t = t_p$),

$$
n\,(t - t_p) = E - e\sin E .
$$

The left side is the mean anomaly. This is Kepler's equation:

$$
M = E - e\sin E .
$$

Given $E$, it hands you the time in one line. Given the time, it must be solved for $E$ – there is no closed form, because $E$ appears both bare and inside a sine – and that inverse problem is the subject of the next lesson. The equation confirms the intuition about pace: since $M$ and $E$ agree at periapsis and apoapsis, and $E - M = e\sin E > 0$ on the outbound half, the eccentric anomaly runs ahead of the mean anomaly after periapsis and behind it after apoapsis; the true anomaly runs further ahead still, and for small $e$ the lead is $\nu - M \approx 2e\sin M$.

::: note The area derivation
Kepler's own route used his second law. The area swept from periapsis by the focal radius is $(b/a)$ times the corresponding area on the auxiliary circle, which is the circular sector $\tfrac{1}{2}a^2 E$ minus the triangle between the centre, the focus and the circle point, $\tfrac{1}{2}(ae)(a\sin E)$. So the swept area is $\tfrac{1}{2}ab\,(E - e\sin E)$. Since area accrues at the constant rate $\pi ab/T$, dividing gives $2\pi(t - t_p)/T = E - e\sin E$ – the same equation.
:::

::: example Time from perigee around a GTO
The GTO has $a = 24\,396.14\,\mathrm{km}$, $e = 0.72831$, so $n = \sqrt{\mu/a^3} = \sqrt{398\,600.4418/1.4520 \times 10^{13}} = 1.6569 \times 10^{-4}\,\mathrm{rad/s}$ and $T = 2\pi/n = 37\,922\,\mathrm{s}$. At $\nu = 90^\circ$:
$$
\tan\frac{E}{2} = \sqrt{\frac{1 - e}{1 + e}}\,\tan 45^\circ = \sqrt{\frac{0.27169}{1.72831}} = 0.39648, \qquad E = 2\arctan 0.39648 = 43.255^\circ = 0.75494\,\mathrm{rad}.
$$
Then $M = E - e\sin E = 0.75494 - 0.72831 \times 0.68507 = 0.25587\,\mathrm{rad} = 14.660^\circ$, and $t - t_p = M/n = 0.25587/1.6569 \times 10^{-4} = 1544\,\mathrm{s} = 25.7\,\mathrm{min}$. Check the radius: $r = a(1 - e\cos E) = 24\,396.14\,(1 - 0.72831 \times 0.72843) = 11\,455.5\,\mathrm{km}$, which is $p$, as it must be at $\nu = 90^\circ$.

The spacecraft covers the first quarter of its true anomaly in $25.7$ minutes out of a $632$-minute period. At $\nu = 120^\circ$ the same steps give $E = 68.957^\circ$, $M = 30.011^\circ$, $t = 52.7\,\mathrm{min}$; at $\nu = 179^\circ$, $E = 177.478^\circ$, $M = 175.642^\circ$, $t = 308.4\,\mathrm{min}$, only $7.6\,\mathrm{min}$ short of the half-period $316.0\,\mathrm{min}$ – the last degree before apogee takes over seven minutes, while the first degree after perigee takes about eleven seconds.
:::

## The hyperbolic anomaly

For $e > 1$ the auxiliary circle becomes an auxiliary hyperbola and the trigonometric functions become hyperbolic ones. Parametrise the branch of the hyperbola with $\lvert a \rvert\cosh H$ and $b\sinh H$ from the centre, where $b = \lvert a \rvert\sqrt{e^2 - 1}$; the occupied focus lies $\lvert a \rvert e$ from the centre on the same side as the branch. Measured from the focus toward periapsis,

$$
x = \lvert a \rvert\,(e - \cosh H), \qquad y = \lvert a \rvert\sqrt{e^2 - 1}\,\sinh H,
$$

and the same perfect-square computation as before gives

$$
r = \lvert a \rvert\,(e\cosh H - 1) = a\,(1 - e\cosh H),
$$

the second form with $a < 0$ matching the elliptic $r = a(1 - e\cos E)$ under $\cos \to \cosh$. The half-angle relation becomes

$$
\tan\frac{\nu}{2} = \sqrt{\frac{e + 1}{e - 1}}\;\tanh\frac{H}{2},
$$

by the same algebra ($\sin\nu/(1 + \cos\nu)$ with $\cos\nu = (e - \cosh H)/(e\cosh H - 1)$ and $\sin\nu = \sqrt{e^2 - 1}\sinh H/(e\cosh H - 1)$). Differentiating it gives $d\nu/dH = \sqrt{e^2 - 1}/(e\cosh H - 1)$, and $dt = r^2\,d\nu/h$ with $h = \sqrt{\mu\lvert a \rvert(e^2 - 1)}$ reduces exactly as before to

$$
\sqrt{\frac{\mu}{\lvert a \rvert^3}}\,(t - t_p) = e\sinh H - H \equiv M_h .
$$

This is the hyperbolic Kepler equation. $M_h$ is again linear in time, with the hyperbolic mean motion $n_h = \sqrt{\mu/\lvert a \rvert^3}$, but $H$ is not an angle and is not periodic: it runs from $-\infty$ to $+\infty$ as the spacecraft comes in from infinity and leaves again, and $M_h$ grows without bound because $\sinh$ does.

::: key Kepler's equation, elliptic and hyperbolic
Elliptic: $M = E - e\sin E$, with $M = n\,(t - t_p)$ and $n = \sqrt{\mu/a^3}$. Hyperbolic: $M_h = e\sinh H - H$, with $M_h = \sqrt{\mu/\lvert a \rvert^3}\,(t - t_p)$.
:::

::: example Time along a departure hyperbola
The hyperbola with $r_p = 6678\,\mathrm{km}$ and $e = 1.4$ has $a = -16\,695\,\mathrm{km}$ and $n_h = \sqrt{398\,600.4418/16\,695^3} = 2.9268 \times 10^{-4}\,\mathrm{s^{-1}}$. At $\nu = 90^\circ$,
$$
\tanh\frac{H}{2} = \sqrt{\frac{e - 1}{e + 1}}\,\tan 45^\circ = \sqrt{\frac{0.4}{2.4}} = 0.40825, \qquad H = 2\operatorname{artanh}(0.40825) = 0.86702,
$$
so $M_h = 1.4\sinh(0.86702) - 0.86702 = 1.4 \times 0.97979 - 0.86702 = 0.50470$ and $t - t_p = 0.50470/2.9268 \times 10^{-4} = 1724\,\mathrm{s} = 28.7\,\mathrm{min}$. Radius check: $r = \lvert a \rvert(e\cosh H - 1) = 16\,695\,(1.4 \times 1.40004 - 1) = 16\,027\,\mathrm{km} = p$. At $\nu = 120^\circ$, $H = 1.7627$, $M_h = 2.1971$, and $t - t_p = 7507\,\mathrm{s} = 125\,\mathrm{min}$, by which time $r = 53\,424\,\mathrm{km}$. Two hours after perigee the spacecraft is beyond GEO and still accelerating away in the sense that $\dot{r}$ is approaching $v_\infty$.
:::

## Barker's equation for the parabola

For $e = 1$ neither $a$ nor $E$ exists, but the time integral is elementary. With $r = (p/2)\sec^2(\nu/2)$ and $h = \sqrt{\mu p}$,

$$
dt = \frac{r^2}{h}\,d\nu = \frac{p^2}{4\sqrt{\mu p}}\,\sec^4\frac{\nu}{2}\,d\nu .
$$

Substitute $\tau = \tan(\nu/2)$, so $d\tau = \tfrac{1}{2}\sec^2(\nu/2)\,d\nu$ and $\sec^2(\nu/2) = 1 + \tau^2$: then $\sec^4(\nu/2)\,d\nu = 2(1 + \tau^2)\,d\tau$ and

$$
dt = \frac{p^2}{2\sqrt{\mu p}}\,(1 + \tau^2)\,d\tau = \tfrac{1}{2}\sqrt{\frac{p^3}{\mu}}\,(1 + \tau^2)\,d\tau .
$$

Integrating from periapsis ($\tau = 0$),

$$
\sqrt{\frac{\mu}{p^3}}\,(t - t_p) = \tfrac{1}{2}\tan\frac{\nu}{2} + \tfrac{1}{6}\tan^3\frac{\nu}{2} .
$$

This is Barker's equation. Unlike its elliptic and hyperbolic cousins it is a *cubic* in $\tan(\nu/2)$, and a cubic can be solved in closed form – the next lesson does so. The quantity $\sqrt{\mu/p^3}$ plays the role of the mean motion, and the parabolic "mean anomaly" $B = \sqrt{\mu/p^3}(t - t_p)$ is again linear in time.

::: example Time on a parabola
A parabola with $r_p = 6678.137\,\mathrm{km}$ has $p = 2r_p = 13\,356.27\,\mathrm{km}$ and $\sqrt{\mu/p^3} = \sqrt{398\,600.4418/2.3826 \times 10^{12}} = 4.0902 \times 10^{-4}\,\mathrm{s^{-1}}$. At $\nu = 90^\circ$, $\tau = 1$ and the right-hand side is $\tfrac{1}{2} + \tfrac{1}{6} = 0.66667$, so $t - t_p = 0.66667/4.0902 \times 10^{-4} = 1630\,\mathrm{s} = 27.2\,\mathrm{min}$, at which point $r = p = 13\,356\,\mathrm{km}$. At $\nu = 120^\circ$, $\tau = \sqrt{3}$ and the right-hand side is $0.86603 + 0.86603 = 1.73205$, giving $t - t_p = 4235\,\mathrm{s} = 70.6\,\mathrm{min}$ and $r = 2p = 26\,713\,\mathrm{km}$. Compare the three conics with the same periapsis: to reach $\nu = 90^\circ$ the GTO ($e = 0.73$) takes $25.7\,\mathrm{min}$, the parabola $27.2\,\mathrm{min}$, and the $e = 1.4$ hyperbola $28.7\,\mathrm{min}$ – the more energetic orbit is *slower* to $90^\circ$ because $p$ is larger and it has farther to go.
:::

::: warning Radians, always
$M = E - e\sin E$ is only true when $E$ and $M$ are in radians. In degrees the equation would read $M = E - (180^\circ/\pi)\,e\sin E$, and nobody writes it that way. A mean anomaly read from a two-line element set is in degrees; convert it before doing anything else. The same applies to $n$: radians per second, not revolutions per day.
:::

::: warning M is a clock, not a place
The mean anomaly is proportional to time since periapsis and is not the angle to anything you could point at. Do not compute a radius from it, and do not compare it with $\nu$ except at the apsides, where all three anomalies coincide. Between the apsides $M$, $E$ and $\nu$ can differ by tens of degrees for an eccentric orbit – $M = 14.7^\circ$ against $\nu = 90^\circ$ in the GTO example.
:::

## Check yourself

::: check
A satellite with $e = 0.1$ has eccentric anomaly $E = 60^\circ$. Find $\nu$, $M$, and $r/a$.
:::

::: answer
$\tan(\nu/2) = \sqrt{1.1/0.9}\tan 30^\circ = 1.10554 \times 0.57735 = 0.63828$, so $\nu = 2\arctan 0.63828 = 65.1^\circ$. $M = E - e\sin E = 1.04720 - 0.1 \times 0.86603 = 0.96060\,\mathrm{rad} = 55.0^\circ$. $r/a = 1 - e\cos E = 1 - 0.05 = 0.95$. The ordering $M < E < \nu$ holds on the outbound half.
:::

::: check
Why is $E$ preferred over $\nu$ as the variable inside a propagator, given that $\nu$ is the physically meaningful angle?
:::

::: answer
Because time is simple in $E$ and complicated in $\nu$. The radius is $r = a(1 - e\cos E)$ with no division, and the time is $t - t_p = (E - e\sin E)/n$ in closed form. In terms of $\nu$ the time integral $\int r^2\,d\nu/h$ has no elementary form. So a propagator steps $M$ linearly in time, solves Kepler's equation once for $E$, and converts to $\nu$ (and then to position) with closed-form trigonometry.
:::

::: check
Derive $r = a(1 - e\cos E)$ from the perifocal coordinates $x = a(\cos E - e)$, $y = a\sqrt{1 - e^2}\sin E$.
:::

::: answer
$r^2 = x^2 + y^2 = a^2[(\cos E - e)^2 + (1 - e^2)\sin^2 E]$. Expand: $\cos^2 E - 2e\cos E + e^2 + \sin^2 E - e^2\sin^2 E = 1 - 2e\cos E + e^2(1 - \sin^2 E) = 1 - 2e\cos E + e^2\cos^2 E = (1 - e\cos E)^2$. Taking the square root (positive, since $e\cos E < 1$) gives $r = a(1 - e\cos E)$.
:::

::: check
A spacecraft on a hyperbola with $e = 2$ and $\lvert a \rvert = 20\,000\,\mathrm{km}$ has $H = 1.0$. How long ago did it pass periapsis, and what is its radius?
:::

::: answer
$M_h = e\sinh H - H = 2 \times 1.17520 - 1 = 1.35041$. $n_h = \sqrt{\mu/\lvert a \rvert^3} = \sqrt{398\,600.4418/8 \times 10^{12}} = 2.2321 \times 10^{-4}\,\mathrm{s^{-1}}$, so $t - t_p = 1.35041/2.2321 \times 10^{-4} = 6050\,\mathrm{s} = 101\,\mathrm{min}$. Radius: $r = \lvert a \rvert(e\cosh H - 1) = 20\,000\,(2 \times 1.54308 - 1) = 41\,723\,\mathrm{km}$.
:::

::: check
Show that Barker's equation gives the correct behaviour as $\nu \to 180^\circ$, and explain what that means physically.
:::

::: answer
As $\nu \to 180^\circ$, $\tan(\nu/2) \to \infty$, so the right-hand side $\tfrac{1}{2}\tau + \tfrac{1}{6}\tau^3 \to \infty$ and therefore $t - t_p \to \infty$. The spacecraft takes infinite time to reach the asymptotic direction $\nu = 180^\circ$, which is where $r \to \infty$ on a parabola. It escapes, but its speed $\sqrt{2\mu/r}$ tends to zero, so it never actually arrives anywhere: the parabola is the marginal escape.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\nu$ | True anomaly, the physical angle from periapsis |
| $E$ | Eccentric anomaly, angle at the centre of the auxiliary circle |
| $M = n(t - t_p)$, $n = \sqrt{\mu/a^3}$ | Mean anomaly, time in radians |
| $x = a(\cos E - e)$, $y = a\sqrt{1 - e^2}\sin E$ | Perifocal coordinates in terms of $E$ |
| $r = a(1 - e\cos E)$ | Radius from eccentric anomaly |
| $\tan\frac{\nu}{2} = \sqrt{\frac{1 + e}{1 - e}}\tan\frac{E}{2}$ | Anomaly conversion; also $E = \operatorname{atan2}(\sqrt{1 - e^2}\sin\nu,\ e + \cos\nu)$ |
| $M = E - e\sin E$ | Kepler's equation, from $n\,dt = (1 - e\cos E)\,dE$ |
| $r = a(1 - e\cosh H)$, $\tan\frac{\nu}{2} = \sqrt{\frac{e + 1}{e - 1}}\tanh\frac{H}{2}$ | Hyperbolic anomaly |
| $M_h = e\sinh H - H = \sqrt{\mu/\lvert a \rvert^3}\,(t - t_p)$ | Hyperbolic Kepler equation |
| $\sqrt{\mu/p^3}(t - t_p) = \frac{1}{2}\tan\frac{\nu}{2} + \frac{1}{6}\tan^3\frac{\nu}{2}$ | Barker's equation for the parabola |

The next lesson solves these equations for the anomaly when the time is given – Newton's method, why it fails at high eccentricity, and the starting points and fallbacks that make it robust.
