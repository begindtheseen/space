---
id: l01-two-body-equation
title: Newton's gravitation and the two-body equation
minutes: 16
covers:
  - Newton law of gravitation and the restricted two-body equation
---

Every orbit propagator you will ever write, tune or debug starts from one line of mathematics: the acceleration of a spacecraft is the gravitational pull of one central body, and nothing else. That line is the restricted two-body equation. Everything else in astrodynamics – Kepler's laws, orbital elements, Lambert targeting, rendezvous – is either a consequence of it or a correction to it.

A GNC engineer meets the equation in three places. In mission design it is the model behind every first estimate of period, speed and transfer time. In flight software it is the reference motion that a navigation filter propagates between measurements, with perturbations layered on top. In analysis it is the yardstick: when a high-fidelity simulation disagrees with a two-body estimate by more than the known perturbations explain, something is wrong with the simulation, not with Newton.

This lesson derives the equation from Newton's law of gravitation, states the assumptions it rests on, gives the numbers you need to use it, and sizes the errors it makes so that you know when to trust it. The reader is assumed to be comfortable with vector mechanics, ordinary differential equations and rotating frames.

## Newton's law of gravitation

Two point masses attract each other along the line joining them, with a force proportional to the product of the masses and inversely proportional to the square of their separation. If $m_1$ sits at inertial position $\mathbf{R}_1$ and $m_2$ at $\mathbf{R}_2$, write the separation vector from the first body to the second as $\mathbf{r} = \mathbf{R}_2 - \mathbf{R}_1$, with magnitude $r = \lVert \mathbf{r} \rVert$. The force on $m_2$ is

$$
\mathbf{F}_{2} = -\,\frac{G m_1 m_2}{r^2}\,\frac{\mathbf{r}}{r} = -\,\frac{G m_1 m_2}{r^3}\,\mathbf{r},
$$

and the force on $m_1$ is $\mathbf{F}_1 = -\mathbf{F}_2$. The minus sign says the force on $m_2$ points back along $-\mathbf{r}$, toward $m_1$. The constant $G = 6.674\,30 \times 10^{-11}\,\mathrm{m^3\,kg^{-1}\,s^{-2}}$ is the gravitational constant. Note the two ways of writing the same thing: $\mathbf{r}/r$ is the unit vector $\hat{\mathbf{r}}$, so dividing by $r^2$ and multiplying by $\hat{\mathbf{r}}$ is the same as dividing by $r^3$ and multiplying by $\mathbf{r}$. The second form is what you code, because it needs no separate normalisation.

Two facts from mechanics make this law usable for planets rather than points. First, gravitational forces superpose: the force on a body from several others is the vector sum of the pairwise forces. Second, the shell theorem: a body whose mass is distributed with spherical symmetry attracts an external point exactly as if all its mass sat at its centre. Earth is not exactly spherical – its equatorial bulge is the largest departure – but it is close enough that treating it as a point mass is the right first model, and the bulge becomes the first correction.

## From two bodies to one equation

Take the two bodies alone in the universe, acted on by nothing but each other's gravity. Newton's second law for each, in an inertial frame, reads

$$
m_1 \ddot{\mathbf{R}}_1 = \frac{G m_1 m_2}{r^3}\,\mathbf{r}, \qquad
m_2 \ddot{\mathbf{R}}_2 = -\,\frac{G m_1 m_2}{r^3}\,\mathbf{r}.
$$

Divide each equation by its own mass, so that the accelerations stand alone:

$$
\ddot{\mathbf{R}}_1 = \frac{G m_2}{r^3}\,\mathbf{r}, \qquad
\ddot{\mathbf{R}}_2 = -\,\frac{G m_1}{r^3}\,\mathbf{r}.
$$

Now subtract the first from the second. The left side becomes $\ddot{\mathbf{R}}_2 - \ddot{\mathbf{R}}_1 = \ddot{\mathbf{r}}$, the acceleration of the separation vector, and the right side collects to

$$
\ddot{\mathbf{r}} = -\,\frac{G\,(m_1 + m_2)}{r^3}\,\mathbf{r}.
$$

Two things happened here that are worth pausing on. The equation is about the relative motion – how body 2 moves as seen from body 1 – and it contains the sum of the masses, not either one alone. Adding the two original equations instead of subtracting gives $m_1 \ddot{\mathbf{R}}_1 + m_2 \ddot{\mathbf{R}}_2 = \mathbf{0}$: the centre of mass moves in a straight line at constant velocity, so a frame attached to it is itself inertial. The two-body problem therefore splits cleanly into trivial centre-of-mass motion and the relative motion above.

Define the gravitational parameter of the pair as

$$
\mu = G\,(m_1 + m_2),
$$

with units $\mathrm{m^3/s^2}$, and the relative equation of motion is

$$
\ddot{\mathbf{r}} = -\,\frac{\mu}{r^3}\,\mathbf{r}.
$$

This is a second-order, nonlinear, vector ODE – three coupled scalar equations. It is nonlinear because $r^3$ in the denominator depends on the unknowns. There is no small-angle trick that makes it linear, and yet it can be solved in closed form. The next several lessons do exactly that.

## The restricted problem

When one body is a spacecraft and the other is Earth, $m \ll M$ and the sum $M + m$ is indistinguishable from $M$. Writing $M$ for the central body and $m$ for the satellite,

$$
\mu = G\,(M + m) \approx GM .
$$

This is the *restricted* two-body problem: the satellite's mass is dropped from the gravitational parameter, and with it the distinction between the position of the satellite relative to Earth's centre and relative to the centre of mass of the pair. From here on $\mathbf{r}$ is the position of the spacecraft from the centre of the central body, $\mathbf{v} = \dot{\mathbf{r}}$ its velocity, and $\mu$ the central body's gravitational parameter.

Say the assumptions out loud, because every one of them is violated by a real vehicle to some degree:

- Both bodies are point masses (or spherically symmetric). Earth's oblateness, described by the $J_2$ coefficient, breaks this at the part-per-thousand level.
- No other bodies act. The Moon and Sun pull on the spacecraft; at low altitude their effect is tiny, at geostationary altitude it rivals oblateness.
- No non-gravitational forces. Atmospheric drag below about 1000 km, solar radiation pressure everywhere, and thruster firings all add accelerations that the equation does not know about.
- The satellite's mass is negligible, so $\mu = GM$ of the central body.

Within these assumptions the equation is exact, and the motion it describes – a conic section traversed according to Kepler's laws – is the reference against which everything else is measured.

::: key The restricted two-body equation
$$
\ddot{\mathbf{r}} = -\,\frac{\mu}{r^3}\,\mathbf{r}, \qquad \mu = G\,(M + m) \approx GM .
$$
It assumes point masses (or spherically symmetric bodies), no other bodies and no non-gravitational forces. $\mathbf{r}$ is the position of the satellite from the centre of the central body and $r$ is its magnitude.
:::

## Gravitational parameters and radii

You will use $\mu$ far more often than $G$ or $M$ separately, and for good reason: $\mu$ is what orbits measure. Tracking a satellite's period and size gives $\mu$ directly to about ten significant figures, whereas $G$ is known only to about five and $M$ inherits that uncertainty. Never compute $\mu$ as $G$ times a tabulated mass when a tabulated $\mu$ exists.

| Body | $\mu$ ($\mathrm{km^3/s^2}$) | Mean or equatorial radius (km) |
| --- | --- | --- |
| Earth | $398\,600.4418$ | $6378.137$ (equatorial) |
| Sun | $1.327\,124 \times 10^{11}$ | $695\,700$ |
| Moon | $4902.8$ | $1737.4$ |
| Mars | $42\,828$ | $3396.2$ |

Earth's value in SI units is $\mu = 3.986\,004\,418 \times 10^{14}\,\mathrm{m^3/s^2}$; the kilometre form $398\,600.4418\,\mathrm{km^3/s^2}$ is the one most astrodynamics code carries, because positions in km and speeds in km/s give numbers of comfortable size. Keep one unit system per program. Mixing $\mu$ in $\mathrm{m^3/s^2}$ with positions in km produces accelerations wrong by a factor of $10^9$, and this is one of the most common bugs in student propagators.

::: key Gravitational parameters and radii to know cold
Earth $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$, $R = 6378.137\,\mathrm{km}$. Sun $\mu = 1.327\,124 \times 10^{11}\,\mathrm{km^3/s^2}$. Moon $\mu = 4902.8\,\mathrm{km^3/s^2}$. Mars $\mu = 42\,828\,\mathrm{km^3/s^2}$.
:::

::: example How much does the satellite's mass matter?
Earth's mass is $M = 5.9722 \times 10^{24}\,\mathrm{kg}$. Multiplying by $G$ gives $GM = 3.98603 \times 10^{14}\,\mathrm{m^3/s^2}$, which differs from the tabulated $\mu = 3.986\,004\,418 \times 10^{14}$ by 5 parts per million – that is the uncertainty in $G$ and $M$ showing up, and it is why you use the tabulated $\mu$.

The ISS has a mass of about $4.2 \times 10^{5}\,\mathrm{kg}$, so $m/M = 4.2 \times 10^{5} / 5.9722 \times 10^{24} = 7.0 \times 10^{-20}$. Including it in $G(M + m)$ changes $\mu$ in the twentieth significant figure. The restricted approximation is exact for any practical purpose.

Now do the same for the Moon as the second body: $m_{\text{Moon}}/M = 7.342 \times 10^{22} / 5.9722 \times 10^{24} = 0.0123$. The gravitational parameter for the Moon's motion about Earth is $G(M + m) = 398\,600.4 + 4902.8 = 403\,503.2\,\mathrm{km^3/s^2}$, 1.2 % larger than Earth's alone. If you computed the Moon's period with Earth's $\mu$ you would be 0.6 % long – about four hours in a month. The Moon is not a restricted two-body satellite of Earth.
:::

## Reading the equation

Before solving it, look at what the equation says. The acceleration is always directed toward the centre and has magnitude $\mu/r^2$. At Earth's surface, $\mu/R^2 = 3.986 \times 10^{14} / (6.378137 \times 10^{6})^2 = 9.798\,\mathrm{m/s^2}$ – within 0.1 % of the standard $g_0 = 9.80665\,\mathrm{m/s^2}$, the difference being the oblateness and rotation folded into the standard value. Because the pull falls off as $1/r^2$ rather than vanishing, a spacecraft in low orbit is not "weightless" in any gravitational sense; it is falling continuously, and it fails to hit the ground only because it is moving sideways fast enough.

::: example Gravitational acceleration in orbit
The ISS orbits at about 413 km altitude, $r = 6378.137 + 413 = 6791\,\mathrm{km} = 6.791 \times 10^{6}\,\mathrm{m}$:
$$
a = \frac{\mu}{r^2} = \frac{3.986 \times 10^{14}}{(6.791 \times 10^{6})^2} = 8.64\,\mathrm{m/s^2},
$$
88 % of $g_0$. Astronauts float because the station falls with them, not because gravity is weak.

At geostationary radius, $r = 42\,164\,\mathrm{km}$:
$$
a = \frac{3.986 \times 10^{14}}{(4.2164 \times 10^{7})^2} = 0.224\,\mathrm{m/s^2},
$$
2.3 % of $g_0$. A GEO satellite feels forty times less pull than the ISS, which is why it can orbit forty times more slowly, as later lessons quantify.
:::

For numerical work the equation is rewritten as a first-order system in the six-component state $\mathbf{x} = (\mathbf{r}, \mathbf{v})$:

$$
\dot{\mathbf{x}} =
\begin{pmatrix} \dot{\mathbf{r}} \\ \dot{\mathbf{v}} \end{pmatrix} =
\begin{pmatrix} \mathbf{v} \\ -\,\mu\,\mathbf{r}/r^3 \end{pmatrix}.
$$

Six initial conditions – three of position, three of velocity – fix the motion forever. That count is why an orbit is described by six numbers, whether you choose the Cartesian state or the six orbital elements of later lessons. In Python the right-hand side is short:

```python
import numpy as np

MU = 398600.4418  # km^3/s^2

def two_body(t, x):
    r = x[:3]
    rn = np.linalg.norm(r)
    return np.concatenate([x[3:], -MU * r / rn**3])

x0 = np.array([6791.0, 0.0, 0.0, 0.0, 7.661, 0.0])
print(two_body(0.0, x0))  # [ 0.  7.661  0.  -0.008643  0.  0. ]  km/s, km/s^2
```

The last component checks against the example: $8.643 \times 10^{-3}\,\mathrm{km/s^2}$ is $8.64\,\mathrm{m/s^2}$.

::: note Canonical units
Some texts and much legacy code work in canonical units: one distance unit $\mathrm{DU}$ equal to the central body's radius and one time unit $\mathrm{TU}$ chosen so that $\mu = 1\,\mathrm{DU^3/TU^2}$. For Earth, $\mathrm{TU} = \sqrt{R^3/\mu} = \sqrt{(6378.137)^3/398\,600.4418} = 806.8\,\mathrm{s}$, and the unit of speed $\mathrm{DU/TU} = 7.905\,\mathrm{km/s}$ is the circular speed at the surface. The equation becomes $\ddot{\mathbf{r}} = -\mathbf{r}/r^3$. Nothing changes physically; the point is to keep all quantities near unity in floating point. You will meet these units in Bate, Mueller and White.
:::

## How good is the model?

The equation is exact for two point masses and approximate for everything else. To decide when to trust it, compare the accelerations it omits with the one it keeps. The largest omissions for an Earth satellite are the oblateness term (of order $\tfrac{3}{2} J_2 \mu R^2 / r^4$ with $J_2 = 1.0826 \times 10^{-3}$), the differential pull of the Moon and Sun (of order $2\mu_{\text{body}}\, r / d^3$ for a body at distance $d$), and drag. Divide each by $\mu/r^2$:

| Perturbation | Ratio to $\mu/r^2$ at ISS altitude | Ratio at GEO |
| --- | --- | --- |
| Earth oblateness $J_2$ | $1.4 \times 10^{-3}$ | $3.7 \times 10^{-5}$ |
| Moon (tidal) | $1.4 \times 10^{-7}$ | $3.2 \times 10^{-5}$ |
| Sun (tidal) | $6 \times 10^{-8}$ | $1.5 \times 10^{-5}$ |
| Drag | $10^{-7}$ to $10^{-6}$, strongly variable | negligible |

Read the table as follows. In low orbit the two-body model captures the motion to about one part in a thousand instantaneously, but the $J_2$ term acts in the same direction orbit after orbit, so its effects on the orientation of the orbit accumulate – degrees per day, as the ground-track lesson shows. At GEO all three gravitational perturbations are comparable and a hundred times smaller, but a GEO satellite has to hold its position for fifteen years, so even $10^{-5}$ matters. The two-body solution is therefore the *reference orbit*; the perturbation modules of the curriculum teach the corrections, always as small departures from what you learn here.

::: warning Relative position, not inertial position
The two-body equation governs $\mathbf{r} = \mathbf{R}_2 - \mathbf{R}_1$, the position of one body relative to the other. For a satellite about Earth this coincides with the position from Earth's centre because $m \ll M$. For two comparable bodies – Earth and Moon, a binary asteroid, a spacecraft and a tiny asteroid it is about to land on – the relative equation still holds exactly with $\mu = G(m_1 + m_2)$, but each body's own inertial motion is only a mass-weighted share of the relative motion. Do not write $GM$ when the second mass is not negligible.
:::

::: warning Units
Positions in km demand $\mu$ in $\mathrm{km^3/s^2}$; positions in m demand $\mathrm{m^3/s^2}$. The conversion factor is $10^9$, and an acceleration wrong by $10^9$ makes an integrator either fly off to infinity or grind to a halt. When a propagator misbehaves on the first step, check units before anything else.
:::

## Check yourself

::: check
Starting from Newton's second law for each of two isolated point masses, show why the equation for their relative motion contains $m_1 + m_2$ rather than either mass alone.
:::

::: answer
Newton's law gives $\ddot{\mathbf{R}}_1 = G m_2 \mathbf{r}/r^3$ and $\ddot{\mathbf{R}}_2 = -G m_1 \mathbf{r}/r^3$ with $\mathbf{r} = \mathbf{R}_2 - \mathbf{R}_1$. Each body's acceleration is proportional to the *other* body's mass, because its own mass cancels between the force and the inertia. Subtracting, $\ddot{\mathbf{r}} = \ddot{\mathbf{R}}_2 - \ddot{\mathbf{R}}_1 = -G(m_1 + m_2)\mathbf{r}/r^3$: the relative acceleration is the sum of the two individual accelerations, each directed to close the gap, so the masses add.
:::

::: check
A propagator written in SI units is handed a state with $\mathbf{r}$ in kilometres by mistake, while $\mu = 3.986 \times 10^{14}\,\mathrm{m^3/s^2}$ is left unchanged. By what factor is the computed acceleration wrong, and in which direction?
:::

::: answer
The acceleration magnitude is $\mu/r^2$. With $r$ numerically $10^3$ times too small, $r^2$ is $10^6$ too small and the acceleration is $10^6$ too *large*. The satellite appears to be pulled a million times harder than it should and the integrator will produce nonsense within a step. Converting $\mu$ to $398\,600.4418\,\mathrm{km^3/s^2}$ fixes it; the $10^9$ between the two forms of $\mu$ and the $10^6$ in $r^2$ combine to the $10^3$ that converts $\mathrm{km/s^2}$ to $\mathrm{m/s^2}$.
:::

::: check
What is the gravitational acceleration at the Moon's mean distance of $384\,400\,\mathrm{km}$ from Earth's centre, and how does it compare with $g_0$?
:::

::: answer
$a = \mu/r^2 = 3.986 \times 10^{14} / (3.844 \times 10^{8})^2 = 2.70 \times 10^{-3}\,\mathrm{m/s^2}$, about $2.75 \times 10^{-4}\,g_0$ – roughly one part in 3600. Newton's original check of the inverse-square law was this comparison: the Moon is about 60 Earth radii away, and $60^2 = 3600$.
:::

::: check
List the four assumptions behind the restricted two-body equation and name, for each, a real effect on an Earth satellite that violates it.
:::

::: answer
Point masses – violated by Earth's oblateness ($J_2$). No other bodies – violated by the Moon and Sun, whose differential attraction matters most at high altitude. No non-gravitational forces – violated by atmospheric drag at low altitude, solar radiation pressure, and thrusting. Negligible satellite mass so that $\mu = GM$ – violated only for comparable bodies such as the Earth–Moon pair, never for an artificial satellite.
:::

::: check
Why do astrodynamicists tabulate $\mu$ for each body rather than computing it from $G$ and the body's mass?
:::

::: answer
Because $\mu$ is the quantity that orbits actually measure. From the size and period of any satellite's orbit, $\mu$ follows to about ten significant figures. $G$ is known independently only to about five figures, and the mass $M$ can only be inferred as $\mu/G$, so it carries the same uncertainty. Multiplying an uncertain $G$ by an uncertain $M$ discards precision you already had.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{F} = -\dfrac{G m_1 m_2}{r^3}\,\mathbf{r}$ | Newton's law of gravitation, force on $m_2$ from $m_1$, $\mathbf{r} = \mathbf{R}_2 - \mathbf{R}_1$ |
| $\ddot{\mathbf{r}} = -\dfrac{\mu}{r^3}\,\mathbf{r}$ | Two-body equation for the relative motion |
| $\mu = G(M + m) \approx GM$ | Gravitational parameter; the approximation is the restricted problem |
| Earth $\mu$ | $398\,600.4418\,\mathrm{km^3/s^2} = 3.986\,004\,418 \times 10^{14}\,\mathrm{m^3/s^2}$ |
| Earth $R$ | $6378.137\,\mathrm{km}$ |
| Sun, Moon, Mars $\mu$ | $1.327\,124 \times 10^{11}$, $4902.8$, $42\,828\,\mathrm{km^3/s^2}$ |
| $\mu/r^2$ | Gravitational acceleration: $9.80\,\mathrm{m/s^2}$ at the surface, $8.64$ at the ISS, $0.224$ at GEO |
| Assumptions | Point masses, no third bodies, no non-gravitational forces, $m \ll M$ |
| State form | $\dot{\mathbf{x}} = (\mathbf{v},\; -\mu\mathbf{r}/r^3)$ with six initial conditions |

The next lesson extracts from this equation the three quantities that stay constant along any orbit – angular momentum, energy and the eccentricity vector – and those constants are what turn a nonlinear ODE into geometry.
