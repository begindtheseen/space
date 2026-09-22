---
id: l04-kepler-laws-vis-viva
title: Kepler's three laws and the vis-viva equation
minutes: 19
covers:
  - Kepler three laws, derived
  - vis-viva
---

Kepler found his three laws in Tycho Brahe's observations of Mars, decades before Newton explained them. In this module they arrive the other way round: the first law is the orbit equation of the last lesson, the second is the constancy of angular momentum, and the third is what you get by asking how long it takes to sweep out the whole ellipse. Along the way comes the single most used formula in mission design, the vis-viva equation, which relates speed to radius and semi-major axis and nothing else.

You will use these results daily. The period of a geostationary satellite is the sidereal day and fixes its radius to within a few metres. The speed you need at the top of a transfer ellipse, and hence the propellant to circularise there, is a vis-viva evaluation. The mean motion that a Kepler-equation solver steps forward is the third law rearranged. And the areal-velocity form of the second law is the reason a spacecraft in an eccentric orbit spends nearly all of its time near apoapsis.

This lesson derives each law from the constants of motion, derives vis-viva by energy conservation evaluated at the apsides, and works the geostationary, ISS and GTO cases with real numbers.

## Kepler's first law

The orbit equation $r = p/(1 + e\cos\nu)$ describes a conic section with the central body at a focus. For a bound orbit ($e < 1$) that conic is an ellipse. This is Kepler's first law: *each planet moves on an ellipse with the Sun at one focus*. In the last lesson it followed from the constancy of the eccentricity vector, and nothing further needs to be said except to notice what the derivation adds to Kepler's statement – the parabola and hyperbola as the unbound cases, which Kepler never saw and Newton did.

## Kepler's second law

Consider the position vector sweeping from true anomaly $\nu$ to $\nu + d\nu$ in time $dt$. The area of the thin triangle it sweeps has base $r$ and height $r\,d\nu$, so

$$
dA = \tfrac{1}{2}\,r \cdot r\,d\nu = \tfrac{1}{2}\,r^2\,d\nu .
$$

Divide by $dt$ and recall from the constants-of-motion lesson that $r^2\dot{\nu} = h$:

$$
\frac{dA}{dt} = \tfrac{1}{2}\,r^2\dot{\nu} = \frac{h}{2}.
$$

The areal velocity is constant: *the line from the central body to the spacecraft sweeps out equal areas in equal times*. This is Kepler's second law, and it is nothing but conservation of angular momentum in geometric dress. It applies to every central force, not only gravity, and to every conic, not only the ellipse.

Its practical consequence is the pace of an eccentric orbit. Near periapsis $r$ is small, so to sweep the same area per second the angle $\nu$ must change quickly; near apoapsis $r$ is large and $\nu$ crawls. A GTO spacecraft passes through the $60^\circ$ of true anomaly around perigee in a few minutes and spends hours near apogee. The time-of-flight lesson makes this quantitative.

## Kepler's third law

If the areal velocity is constant, the whole area of the ellipse is swept in exactly one period $T$:

$$
\pi a b = \frac{h}{2}\,T \quad\Longrightarrow\quad T = \frac{2\pi a b}{h}.
$$

Now express $b$ and $h$ through $a$ and $e$. From the last lesson $b = a\sqrt{1 - e^2}$ and $p = a(1 - e^2)$, and from the definition of $p$, $h = \sqrt{\mu p} = \sqrt{\mu a (1 - e^2)}$. Substituting,

$$
T = \frac{2\pi\,a \cdot a\sqrt{1 - e^2}}{\sqrt{\mu a}\,\sqrt{1 - e^2}} = \frac{2\pi a^2}{\sqrt{\mu a}} = 2\pi\sqrt{\frac{a^3}{\mu}}.
$$

The eccentricity has cancelled. *The square of the period is proportional to the cube of the semi-major axis*, with the proportionality constant $4\pi^2/\mu$ the same for every body orbiting the same primary. Two orbits with the same $a$ have the same period whatever their shapes: a circular orbit of radius $a$ and a needle-thin ellipse of semi-major axis $a$ take the same time to go round. The average angular rate,

$$
n = \frac{2\pi}{T} = \sqrt{\frac{\mu}{a^3}},
$$

is called the mean motion; it is the angular speed the spacecraft *would* have if it moved uniformly, and it is the quantity that Kepler's equation multiplies by time.

::: key Kepler's third law
$$
T = 2\pi\sqrt{\frac{a^3}{\mu}}, \qquad n = \sqrt{\frac{\mu}{a^3}}.
$$
The period depends on the semi-major axis alone – not on eccentricity.
:::

Kepler's own statement had the constant the same for all planets. That is true only to the extent that $\mu = G(M_\odot + m)$ is the same for all of them, which it is to about one part in a thousand (Jupiter's mass). Newton's form, with $G(M + m)$, explains the tiny discrepancies; the restricted form with $\mu = GM$ is what you use for artificial satellites.

::: note Newton's form, and the third law as a measuring instrument
With $\mu = G(M + m)$ the third law reads $T^2 = 4\pi^2 a^3/\big(G(M + m)\big)$, and Kepler's "constant" differs slightly from planet to planet. Earth's orbital period computed from $a = 1\,\mathrm{AU} = 1.495\,978\,707 \times 10^{8}\,\mathrm{km}$ with the Sun's $\mu$ alone is $365.2569\,\mathrm{days}$; including Earth's own $\mu$ in the sum shortens it by $47\,\mathrm{s}$, to $365.2563\,\mathrm{days}$. The law also runs backwards, and that is how gravitational parameters are measured. From the Moon's mean distance $384\,400\,\mathrm{km}$ and sidereal period $27.3217\,\mathrm{days}$,
$$
\mu = \frac{4\pi^2 a^3}{T^2} = \frac{4\pi^2 (384\,400)^3}{(2.3606 \times 10^{6})^2} = 4.024 \times 10^{5}\,\mathrm{km^3/s^2},
$$
within 0.3 % of the true $\mu_{\text{Earth}} + \mu_{\text{Moon}} = 403\,503\,\mathrm{km^3/s^2}$ – the residual is the Sun's perturbation of the lunar orbit. A tracked artificial satellite, unperturbed by anything so large, gives Earth's $\mu$ to ten figures the same way.
:::

::: example The geostationary radius
A geostationary satellite must complete one orbit while Earth turns once relative to the stars: one sidereal day, $T = 86\,164.09\,\mathrm{s}$ (not the $86\,400\,\mathrm{s}$ solar day, which includes Earth's daily progress around the Sun). Invert the third law:
$$
a = \left(\frac{\mu T^2}{4\pi^2}\right)^{1/3} = \left(\frac{398\,600.4418 \times 86\,164.09^2}{4\pi^2}\right)^{1/3} = \left(7.4960 \times 10^{13}\right)^{1/3} = 42\,164.2\,\mathrm{km}.
$$
The altitude is $42\,164.2 - 6378.1 = 35\,786\,\mathrm{km}$ and the circular speed is $v = 2\pi a/T = \sqrt{\mu/a} = 3.0747\,\mathrm{km/s}$. The mean motion $n = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$ is exactly Earth's rotation rate, as designed. Every GEO number you will ever quote comes from this one calculation.
:::

::: example ISS period and speed
For $a = 6791\,\mathrm{km}$,
$$
T = 2\pi\sqrt{\frac{6791^3}{398\,600.4418}} = 2\pi\sqrt{7.857 \times 10^{5}} = 5569\,\mathrm{s} = 92.8\,\mathrm{min},
$$
so the station completes $86\,400/5569 = 15.5$ orbits per day. Its mean motion is $n = 1.128 \times 10^{-3}\,\mathrm{rad/s}$ and its speed, essentially circular, is $\sqrt{\mu/a} = 7.661\,\mathrm{km/s}$. Check the second law directly: the areal velocity $h/2 = \sqrt{\mu a}/2 = 26\,014\,\mathrm{km^2/s}$, and the ellipse area $\pi a^2$ (with $b \approx a$) divided by $T$ gives $\pi \times 6791^2/5569 = 26\,014\,\mathrm{km^2/s}$.
:::

## The vis-viva equation

The energy $\varepsilon = v^2/2 - \mu/r$ is constant along the orbit, but so far it has only been a number. The vis-viva equation identifies that number with the geometry. The derivation is short and the chain of reasoning is worth remembering exactly: *energy is conserved; evaluate it at periapsis and at apoapsis, where the velocity is horizontal; eliminate the speeds with angular momentum; out comes $\varepsilon = -\mu/(2a)$.*

At periapsis and apoapsis the velocity is perpendicular to the radius, so $h = r_p v_p = r_a v_a$ with no cosine. Energy conservation between the two points reads

$$
\frac{v_p^2}{2} - \frac{\mu}{r_p} = \frac{v_a^2}{2} - \frac{\mu}{r_a}.
$$

Replace $v_a$ by $v_p r_p / r_a$:

$$
\frac{v_p^2}{2}\left(1 - \frac{r_p^2}{r_a^2}\right) = \mu\left(\frac{1}{r_p} - \frac{1}{r_a}\right) = \mu\,\frac{r_a - r_p}{r_p r_a}.
$$

The left-hand bracket factors as $(r_a - r_p)(r_a + r_p)/r_a^2$. Cancel the common $(r_a - r_p)$:

$$
\frac{v_p^2}{2}\,\frac{r_a + r_p}{r_a^2} = \frac{\mu}{r_p r_a}
\quad\Longrightarrow\quad
v_p^2 = \frac{2\mu\, r_a}{r_p\,(r_a + r_p)} = \frac{\mu\, r_a}{a\, r_p},
$$

using $r_a + r_p = 2a$. Now substitute back into the energy at periapsis:

$$
\varepsilon = \frac{v_p^2}{2} - \frac{\mu}{r_p} = \frac{\mu r_a}{2 a r_p} - \frac{\mu}{r_p} = \frac{\mu}{r_p}\left(\frac{r_a - 2a}{2a}\right) = \frac{\mu}{r_p}\left(\frac{-r_p}{2a}\right) = -\frac{\mu}{2a},
$$

since $r_a - 2a = r_a - (r_a + r_p) = -r_p$. The specific energy of an orbit is fixed by its semi-major axis alone. Finally, set this equal to the general expression $v^2/2 - \mu/r$ at any point of the orbit and solve for $v$:

$$
v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right).
$$

This is the vis-viva equation ("living force", an old name for kinetic energy). Given where you are and the size of your orbit, it gives your speed; given where you are and how fast you are going, it gives the size of your orbit. It contains no angle and no eccentricity.

A cross-check by a different route: the identity $e^2 = 1 + 2\varepsilon h^2/\mu^2$ from the constants-of-motion lesson, with $h^2 = \mu p = \mu a(1 - e^2)$, gives $e^2 - 1 = 2\varepsilon a(1 - e^2)/\mu$, and dividing by $-(1 - e^2)$ yields $\varepsilon = -\mu/(2a)$ again – and this second route never assumed the orbit was closed, so the result holds with $a < 0$ for hyperbolas and, in the limit $a \to \infty$, gives $\varepsilon = 0$ for the parabola.

::: key Specific energy and semi-major axis
$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r} = -\frac{\mu}{2a}.
$$
Negative for an ellipse ($a > 0$), zero for a parabola ($a \to \infty$), positive for a hyperbola ($a < 0$).
:::

::: key The vis-viva equation
$$
v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right).
$$
:::

::: example Speeds around a GTO and the circularisation burn
The GTO of earlier lessons has $r_p = 6628.137\,\mathrm{km}$, $r_a = 42\,164.137\,\mathrm{km}$ and $a = 24\,396.14\,\mathrm{km}$. Its energy is $\varepsilon = -\mu/(2a) = -398\,600.4418/48\,792.27 = -8.169\,\mathrm{km^2/s^2}$. Vis-viva at the apsides:
$$
v_p = \sqrt{398\,600.4418\left(\frac{2}{6628.137} - \frac{1}{24\,396.14}\right)} = \sqrt{398\,600.4418 \times 2.6076 \times 10^{-4}} = 10.195\,\mathrm{km/s},
$$
$$
v_a = \sqrt{398\,600.4418\left(\frac{2}{42\,164.137} - \frac{1}{24\,396.14}\right)} = \sqrt{398\,600.4418 \times 6.4433 \times 10^{-6}} = 1.603\,\mathrm{km/s}.
$$
Check $h$: $r_p v_p = 67\,573$ and $r_a v_a = 67\,573\,\mathrm{km^2/s}$, equal as they must be. A circular orbit at $r_a$ needs $\sqrt{\mu/r_a} = 3.075\,\mathrm{km/s}$, so circularising at apogee costs $3.075 - 1.603 = 1.472\,\mathrm{km/s}$ – the apogee burn of every GEO mission flown from a GTO with this perigee. The period, from the third law, is $T = 2\pi\sqrt{a^3/\mu} = 37\,922\,\mathrm{s} = 10.53\,\mathrm{h}$.
:::

## Circular and escape speed

Two special cases of vis-viva deserve names. On a circular orbit $r = a$ everywhere, and

$$
v_c = \sqrt{\frac{\mu}{r}}.
$$

For the parabola $a \to \infty$, and the speed at radius $r$ is the *escape speed*

$$
v_{\text{esc}} = \sqrt{\frac{2\mu}{r}} = \sqrt{2}\,v_c .
$$

A spacecraft moving at exactly $v_{\text{esc}}$ in any direction (other than straight down) has $\varepsilon = 0$ and coasts to infinity, arriving with zero speed. Any faster and it is hyperbolic; any slower and it is bound, whatever the direction of the velocity. At $200\,\mathrm{km}$ altitude, $r = 6578.137\,\mathrm{km}$, $v_c = \sqrt{398\,600.4418/6578.137} = 7.784\,\mathrm{km/s}$ and $v_{\text{esc}} = 11.009\,\mathrm{km/s}$. At geostationary radius $v_c = 3.075\,\mathrm{km/s}$ and $v_{\text{esc}} = 4.348\,\mathrm{km/s}$. The extra $\Delta v$ to escape from a circular orbit is $(\sqrt{2} - 1)v_c = 0.414\,v_c$: $3.22\,\mathrm{km/s}$ from low orbit, only $1.27\,\mathrm{km/s}$ from GEO, which is one reason high orbits are good places to depart from and bad places to have to get to.

::: key Circular and escape speed
$$
v_c = \sqrt{\frac{\mu}{r}}, \qquad v_{\text{esc}} = \sqrt{\frac{2\mu}{r}} = \sqrt{2}\,v_c .
$$
At $200\,\mathrm{km}$ altitude $v_c \approx 7.78\,\mathrm{km/s}$; at GEO $v_c \approx 3.07\,\mathrm{km/s}$.
:::

::: key GEO radius, altitude and period
$r = 42\,164\,\mathrm{km}$, altitude $35\,786\,\mathrm{km}$, period one sidereal day $= 86\,164\,\mathrm{s}$. It follows directly from $T = 2\pi\sqrt{a^3/\mu}$.
:::

::: warning Period depends on a, not on the radius you happen to be at
A spacecraft at $r = 6628\,\mathrm{km}$ in a GTO has the same $r$ as one in a $250\,\mathrm{km}$ circular orbit, but a period of $10.5\,\mathrm{h}$ instead of $89\,\mathrm{min}$. The third law wants $a$; vis-viva wants both $r$ and $a$. Feeding $r$ where $a$ belongs is the classic error, and it is silent – the numbers look plausible.
:::

::: warning Sidereal, not solar
The geostationary period is the sidereal day, $86\,164.09\,\mathrm{s}$, the time for Earth to rotate $360^\circ$ relative to inertial space. Using the $86\,400\,\mathrm{s}$ solar day puts the satellite $77\,\mathrm{km}$ too high and drifting westward about $1^\circ$ per day.
:::

## Check yourself

::: check
Two satellites orbit Earth with the same semi-major axis $a = 10\,000\,\mathrm{km}$, one circular and one with $e = 0.3$. Compare their periods and their speeds at $r = 10\,000\,\mathrm{km}$.
:::

::: answer
Same $a$ means the same period: $T = 2\pi\sqrt{10\,000^3/398\,600.4418} = 9952\,\mathrm{s} = 165.9\,\mathrm{min}$ for both. Vis-viva at $r = a$ gives $v^2 = \mu(2/a - 1/a) = \mu/a$ for both, so both move at $\sqrt{398\,600.4418/10\,000} = 6.314\,\mathrm{km/s}$ when they pass $r = 10\,000\,\mathrm{km}$ – the eccentric one at its two points where $r = a$ (the ends of the minor axis), the circular one everywhere. Speed at a given radius depends only on $a$.
:::

::: check
State the chain of reasoning that derives vis-viva, in order, and say where the geometry of the ellipse enters.
:::

::: answer
Energy $\varepsilon = v^2/2 - \mu/r$ is constant because gravity is conservative. Evaluate it at periapsis and apoapsis, where the velocity is perpendicular to the radius, so angular momentum gives $r_p v_p = r_a v_a$ with no angle. Eliminate $v_a$, cancel the common factor $(r_a - r_p)$, and use $r_p + r_a = 2a$ – this is where the geometry enters – to find $v_p^2 = \mu r_a/(a r_p)$ and then $\varepsilon = -\mu/(2a)$. Setting this equal to $v^2/2 - \mu/r$ at an arbitrary point gives $v^2 = \mu(2/r - 1/a)$.
:::

::: check
A spacecraft in a $400\,\mathrm{km}$ circular orbit fires its engine to raise its speed by $2.5\,\mathrm{km/s}$ along the velocity direction. What is the new semi-major axis and apogee altitude?
:::

::: answer
$r = 6778.137\,\mathrm{km}$, $v_c = \sqrt{398\,600.4418/6778.137} = 7.6686\,\mathrm{km/s}$, new speed $v = 10.1686\,\mathrm{km/s}$. From vis-viva, $1/a = 2/r - v^2/\mu = 2.9507 \times 10^{-4} - 103.40/398\,600.4418 = 2.9507 \times 10^{-4} - 2.5941 \times 10^{-4} = 3.566 \times 10^{-5}\,\mathrm{km^{-1}}$, so $a = 28\,043\,\mathrm{km}$. The burn point is the new perigee (the velocity stayed horizontal), so $r_a = 2a - r_p = 56\,086 - 6778 = 49\,308\,\mathrm{km}$: apogee altitude about $42\,930\,\mathrm{km}$, beyond GEO.
:::

::: check
Why does Kepler's second law hold for any central force while the third law is specific to inverse-square gravity?
:::

::: answer
The second law is $dA/dt = h/2$, and $\mathbf{h}$ is conserved whenever the force is parallel to $\mathbf{r}$ – any central force. The third law needs the orbit to be an ellipse (so that its area is $\pi a b$) and needs $h = \sqrt{\mu a(1 - e^2)}$, both of which came from the orbit equation, which in turn came from the eccentricity vector – the constant that exists only for the inverse-square law. A different force law gives closed orbits that are not ellipses, or no closed orbits at all, and no simple period–size relation.
:::

::: check
By what $\Delta v$ does a spacecraft in a circular orbit at GEO radius need to speed up to escape Earth, and how does that compare with escaping from a $200\,\mathrm{km}$ orbit?
:::

::: answer
The escape increment from a circular orbit is $(\sqrt{2} - 1)v_c$. At GEO, $v_c = 3.075\,\mathrm{km/s}$, so $\Delta v = 0.4142 \times 3.075 = 1.274\,\mathrm{km/s}$. At $200\,\mathrm{km}$, $v_c = 7.784\,\mathrm{km/s}$ and $\Delta v = 3.224\,\mathrm{km/s}$. Escaping from GEO costs 40 % of what escaping from low orbit costs – but getting to GEO first costs about $3.9\,\mathrm{km/s}$, so the total is larger. Where you start matters as much as where you are going.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| First law | The orbit is a conic with the central body at a focus (the orbit equation) |
| $dA/dt = h/2$ | Second law: constant areal velocity, from $r^2\dot{\nu} = h$ |
| $T = 2\pi\sqrt{a^3/\mu}$ | Third law, from $\pi ab = hT/2$; independent of $e$ |
| $n = \sqrt{\mu/a^3}$ | Mean motion, the average angular rate |
| $\varepsilon = -\mu/(2a)$ | Energy fixed by semi-major axis; derived at the apsides |
| $v^2 = \mu(2/r - 1/a)$ | Vis-viva |
| $v_c = \sqrt{\mu/r}$, $v_{\text{esc}} = \sqrt{2\mu/r}$ | Circular and escape speed; $7.78$ and $11.01\,\mathrm{km/s}$ at $200\,\mathrm{km}$; $3.07$ and $4.35$ at GEO |
| GEO | $a = 42\,164\,\mathrm{km}$, altitude $35\,786\,\mathrm{km}$, $T = 86\,164\,\mathrm{s}$ |
| GTO | $v_p = 10.19$, $v_a = 1.60\,\mathrm{km/s}$, $T = 10.53\,\mathrm{h}$, circularisation $1.47\,\mathrm{km/s}$ |

The next lesson walks through the four conic families one at a time – circular, elliptical, parabolic, hyperbolic – with the speeds, energies and asymptotic behaviour that distinguish them.
