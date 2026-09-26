---
id: l04-kepler-laws-vis-viva
title: Kepler's three laws and the vis-viva equation
minutes: 21
covers:
  - Kepler three laws, derived
  - vis-viva
---

Around 1600, Johannes Kepler sat with years of careful measurements of where Mars appeared in the sky, made by the Danish astronomer [[Tycho Brahe|tycho-kepler]]. After a long struggle he pulled three rules out of the numbers. Planets move on ellipses. They speed up when close to the Sun and slow down when far away. And the bigger the orbit, the longer the year, in a very exact way. He had no idea *why*. Newton explained it decades later.

In this module the story runs the other way. You already have the physics: the two-body equation, the constants of motion, the orbit equation. From those, Kepler's laws drop out in a few lines each. The first law is the orbit equation from the last lesson. The second is angular momentum staying constant. The third comes from asking one question: how long does it take to sweep out the whole ellipse?

Along the way you meet the single most used formula in mission design, the **vis-viva equation**. It connects your speed to two things only: how far you are from the planet, and how big your orbit is.

You will use these results constantly. The period of a geostationary satellite is fixed at one turn of the Earth, and that pins its radius to within a few meters. The speed at the top of a transfer orbit — and so the propellant needed to make that orbit circular — is a vis-viva calculation. The "mean motion" that a Kepler's-equation solver steps forward in time is the third law rearranged. And the second law is why a spacecraft on a stretched orbit spends nearly all its time far from the planet.

## Kepler's first law

The orbit equation says

$$
r = \frac{p}{1 + e\cos\nu}.
$$

Here $r$ is the distance from the planet's center, $p$ is the semi-latus rectum (the orbit's "width" at the planet, a fixed length), $e$ is the eccentricity, and $\nu$ (the Greek letter "nu") is the true anomaly — the angle from the closest point of the orbit to the spacecraft. The last lesson showed this is a **conic section** with the central body at one **focus**.

For a bound orbit, $e < 1$, and that conic is an ellipse. So: *each planet moves on an ellipse with the Sun at one focus*. That is Kepler's first law.

Nothing more needs to be proved. But notice what the physics adds to Kepler's statement. It also allows the parabola ($e = 1$) and the hyperbola ($e > 1$) — the paths of things that come in once and leave forever. Kepler never saw those. Newton did.

## Kepler's second law

Picture a sprinkler arm, or a windshield wiper, sweeping out a patch of area as it turns. Now imagine the wiper's length keeps changing. When the arm is long, a small turn sweeps a lot of area. When it is short, it must turn through a big angle to sweep the same amount.

The line from Earth to a spacecraft is that arm. Let it swing from true anomaly $\nu$ to $\nu + d\nu$ in a tiny time $dt$. (Read $d\nu$ as "a tiny change in nu".) The sliver it sweeps is a thin triangle. Its base is $r$ and its height is $r\,d\nu$ (arc length is radius times angle). So its area is

$$
dA = \tfrac{1}{2}\,r \cdot r\,d\nu = \tfrac{1}{2}\,r^2\,d\nu .
$$

Divide both sides by $dt$. The constants-of-motion lesson showed that $r^2\dot{\nu} = h$, the specific angular momentum. (The dot, $\dot{\nu}$, read "nu dot", means the rate of change of $\nu$ per second.) So

$$
\frac{dA}{dt} = \tfrac{1}{2}\,r^2\dot{\nu} = \frac{h}{2}.
$$

The rate at which area is swept, called the **areal velocity**, is constant. In words: *the line from the central body to the spacecraft sweeps out [[equal areas in equal times|equal-areas]]*. That is Kepler's second law.

It is nothing but conservation of angular momentum, dressed up as geometry. So it holds for *every* central force — any force that pulls straight toward a center — not only gravity. And it holds on every conic, not only the ellipse.

### What it means for a real orbit

Near the closest point, **periapsis**, $r$ is small. To sweep the same area each second, the angle must change fast. Near the farthest point, **apoapsis**, $r$ is large and the angle crawls.

On a geostationary transfer orbit (GTO), a spacecraft covers the $60^\circ$ of true anomaly centered on perigee in about $12$ minutes. The $60^\circ$ centered on apogee takes about $6$ hours. The time-of-flight lesson makes this exact.

## Kepler's third law

Here is the one question: if area is swept at a steady rate, how long does the whole ellipse take?

The area of an ellipse is $\pi a b$, where $a$ is the semi-major axis (half the long width) and $b$ is the semi-minor axis (half the short width). Sweeping it at $h/2$ per second for one full period $T$ gives

$$
\pi a b = \frac{h}{2}\,T \quad\Longrightarrow\quad T = \frac{2\pi a b}{h}.
$$

Now write $b$ and $h$ in terms of $a$ and $e$. From the last lesson, $b = a\sqrt{1 - e^2}$ and $p = a(1 - e^2)$. From the definition of $p$, $h = \sqrt{\mu p} = \sqrt{\mu a (1 - e^2)}$. Here $\mu$ (Greek "mu") is the gravitational parameter of the central body. Substitute both:

$$
T = \frac{2\pi\,a \cdot a\sqrt{1 - e^2}}{\sqrt{\mu a}\,\sqrt{1 - e^2}} = \frac{2\pi a^2}{\sqrt{\mu a}} = 2\pi\sqrt{\frac{a^3}{\mu}}.
$$

Look what happened: the $\sqrt{1 - e^2}$ on top and bottom cancelled. The eccentricity is gone.

So *the square of the period is proportional to the cube of the semi-major axis*. The constant of proportionality, $4\pi^2/\mu$, is the same for everything orbiting the same body.

That has a surprising consequence. Two orbits with the same $a$ have the same period, whatever their shapes. A circle of radius $a$ and a needle-thin ellipse with semi-major axis $a$ take exactly the same time to go around.

The average rate of turning is called the **mean motion**, $n$:

$$
n = \frac{2\pi}{T} = \sqrt{\frac{\mu}{a^3}}.
$$

It is the angular speed the spacecraft *would* have if it went around at a steady rate. It is the quantity that [[Kepler's equation multiplies by time|mean-motion]]. Its units are radians per second.

::: key Kepler's third law
$$
T = 2\pi\sqrt{\frac{a^3}{\mu}}, \qquad n = \sqrt{\frac{\mu}{a^3}}.
$$
The period depends on the semi-major axis alone – not on eccentricity.
:::

Kepler said the constant was the same for all planets. That is true only as far as $\mu = G(M_\odot + m)$ is the same for all of them — the Sun's mass $M_\odot$ plus the planet's mass $m$. Even Jupiter adds only about one part in a thousand. Newton's form, with $G(M + m)$, explains the tiny differences. For artificial satellites, whose mass is nothing next to Earth's, you use $\mu = GM$.

The law also runs backwards, and that is how the $\mu$ values themselves are measured. Time an orbit, measure its size, and you have $\mu$. That is why [[the gravitational parameters are known far better than the constant G itself|mu-precision]].

::: note Newton's form, and the third law as a measuring instrument
With $\mu = G(M + m)$ the third law reads $T^2 = 4\pi^2 a^3/\big(G(M + m)\big)$, and Kepler's "constant" differs slightly from planet to planet. Earth's orbital period computed from $a = 1\,\mathrm{AU} = 1.495\,978\,707 \times 10^{8}\,\mathrm{km}$ with the Sun's $\mu$ alone is $365.2569\,\mathrm{days}$. Including Earth's own $\mu$ in the sum shortens it by $47\,\mathrm{s}$, to $365.2563\,\mathrm{days}$.

Running the law backwards: from the Moon's mean distance $384\,400\,\mathrm{km}$ and its sidereal period $27.3217\,\mathrm{days} = 2.3606 \times 10^{6}\,\mathrm{s}$,
$$
\mu = \frac{4\pi^2 a^3}{T^2} = \frac{4\pi^2 (384\,400)^3}{(2.3606 \times 10^{6})^2} = 4.024 \times 10^{5}\,\mathrm{km^3/s^2}.
$$
That is within 0.3 % of the true $\mu_{\text{Earth}} + \mu_{\text{Moon}} = 403\,503\,\mathrm{km^3/s^2}$. The leftover is the Sun tugging on the Moon's orbit. A tracked artificial satellite, with nothing so large disturbing it, gives Earth's $\mu$ to ten figures the same way.
:::

::: example The geostationary radius
A geostationary satellite must go around once while Earth turns once *relative to the stars*. That is one [[sidereal day|sidereal-day]]: $T = 86\,164.09\,\mathrm{s}$. It is not the $86\,400\,\mathrm{s}$ solar day, which includes a little extra turning to keep up with Earth's trip around the Sun.

**Step 1 — turn the third law around.** Square $T = 2\pi\sqrt{a^3/\mu}$ to get $T^2 = 4\pi^2 a^3/\mu$, then solve for $a$:
$$
a = \left(\frac{\mu T^2}{4\pi^2}\right)^{1/3}.
$$

**Step 2 — put in the numbers.** With $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$:
$$
a = \left(\frac{398\,600.4418 \times 86\,164.09^2}{4\pi^2}\right)^{1/3} = \left(7.4960 \times 10^{13}\right)^{1/3} = 42\,164.2\,\mathrm{km}.
$$

**Step 3 — altitude.** Subtract Earth's equatorial radius: $42\,164.2 - 6378.1 = 35\,786\,\mathrm{km}$.

**Step 4 — speed.** On a circle, speed is distance around divided by time: $v = 2\pi a/T = \sqrt{\mu/a} = 3.0747\,\mathrm{km/s}$.

**Sanity check.** The mean motion is $n = 2\pi/T = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$. That is exactly Earth's rotation rate, which is the whole point. Every GEO number you will ever quote comes from this one calculation.
:::

::: example ISS period and speed
The International Space Station has $a = 6791\,\mathrm{km}$.

**Period.** First $a^3/\mu = 6791^3/398\,600.4418 = 7.857 \times 10^{5}\,\mathrm{s^2}$. Then
$$
T = 2\pi\sqrt{7.857 \times 10^{5}} = 5569\,\mathrm{s} = 92.8\,\mathrm{min}.
$$

**Orbits per day.** $86\,400/5569 = 15.5$ orbits each day.

**Mean motion and speed.** $n = 2\pi/5569 = 1.128 \times 10^{-3}\,\mathrm{rad/s}$. The orbit is almost circular, so its speed is $\sqrt{\mu/a} = 7.661\,\mathrm{km/s}$.

**Check the second law directly.** The areal velocity is $h/2 = \sqrt{\mu a}/2 = 26\,014\,\mathrm{km^2/s}$. The ellipse is nearly a circle ($b \approx a$), so its area over the period is $\pi \times 6791^2/5569 = 26\,014\,\mathrm{km^2/s}$. The two routes agree.
:::

## The vis-viva equation

Think of a skateboarder in a half-pipe. At the bottom she is fast. At the top of the wall she slows to a stop, then comes back down. Her speed and her height trade against each other, and the total — her energy — stays the same.

A spacecraft does the same thing, with "height" meaning distance from the planet. The specific energy (energy per kilogram)

$$
\varepsilon = \frac{v^2}{2} - \frac{\mu}{r}
$$

is constant along the orbit. ($\varepsilon$ is the Greek letter "epsilon".) The first term is the speed part; the second is the height part, which is negative and grows toward zero as you move away.

So far $\varepsilon$ has only been *some* constant. The vis-viva equation says which one, in terms of the orbit's size. The chain of reasoning is short and worth remembering exactly:

- energy is conserved;
- evaluate it at periapsis and at apoapsis, where the velocity is sideways (perpendicular to the radius);
- use angular momentum to get rid of the speeds;
- out comes $\varepsilon = -\mu/(2a)$.

### The derivation, step by step

At periapsis and apoapsis the velocity is at right angles to the radius. So angular momentum has no cosine in it there: $h = r_p v_p = r_a v_a$. Here $r_p, v_p$ are the radius and speed at periapsis, and $r_a, v_a$ at apoapsis.

Energy is the same at both points:

$$
\frac{v_p^2}{2} - \frac{\mu}{r_p} = \frac{v_a^2}{2} - \frac{\mu}{r_a}.
$$

Replace $v_a$ with $v_p r_p / r_a$ (from the angular momentum), and gather the speed terms on the left:

$$
\frac{v_p^2}{2}\left(1 - \frac{r_p^2}{r_a^2}\right) = \mu\left(\frac{1}{r_p} - \frac{1}{r_a}\right) = \mu\,\frac{r_a - r_p}{r_p r_a}.
$$

The bracket on the left is a difference of squares: $1 - r_p^2/r_a^2 = (r_a - r_p)(r_a + r_p)/r_a^2$. Both sides now contain $(r_a - r_p)$, so cancel it:

$$
\frac{v_p^2}{2}\,\frac{r_a + r_p}{r_a^2} = \frac{\mu}{r_p r_a}
\quad\Longrightarrow\quad
v_p^2 = \frac{2\mu\, r_a}{r_p\,(r_a + r_p)} = \frac{\mu\, r_a}{a\, r_p}.
$$

The last step used $r_a + r_p = 2a$: the long axis of the ellipse is the closest distance plus the farthest.

Now put $v_p^2$ back into the energy at periapsis:

$$
\varepsilon = \frac{v_p^2}{2} - \frac{\mu}{r_p} = \frac{\mu r_a}{2 a r_p} - \frac{\mu}{r_p} = \frac{\mu}{r_p}\left(\frac{r_a - 2a}{2a}\right) = \frac{\mu}{r_p}\left(\frac{-r_p}{2a}\right) = -\frac{\mu}{2a}.
$$

The step in the middle used $r_a - 2a = r_a - (r_a + r_p) = -r_p$.

So the energy of an orbit depends on its semi-major axis and nothing else. Finally, set this equal to $v^2/2 - \mu/r$ at *any* point on the orbit and solve for $v^2$:

$$
v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right).
$$

That is the vis-viva equation. The name is Latin for [["living force"|vis-viva-name]], an old name for kinetic energy. It works in both directions:

- know where you are ($r$) and the size of your orbit ($a$), and it gives your speed;
- know where you are and how fast you are going, and it gives the size of your orbit.

It contains no angle and no eccentricity. The direction you are moving does not matter to it at all.

::: note Why it has to be true for hyperbolas too
The derivation above used an apoapsis, so it only works for closed orbits. Here is a second route that does not. The constants-of-motion lesson gave the identity $e^2 = 1 + 2\varepsilon h^2/\mu^2$. Put in $h^2 = \mu p = \mu a(1 - e^2)$:
$$
e^2 - 1 = \frac{2\varepsilon a(1 - e^2)}{\mu}.
$$
Divide both sides by $-(1 - e^2)$ and you get $1 = -2\varepsilon a/\mu$, which is $\varepsilon = -\mu/(2a)$ again. This route never assumed the orbit closes. So the result holds for hyperbolas, where $a < 0$, and in the limit $a \to \infty$ it gives $\varepsilon = 0$ for the parabola.
:::

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

::: example Speeds around a GTO and the circularization burn
The GTO of earlier lessons has perigee radius $r_p = 6628.137\,\mathrm{km}$ (a [[perigee 250 km up|gto-perigee]]) and apogee radius $r_a = 42\,164.137\,\mathrm{km}$ (geostationary radius).

**Step 1 — size and energy.** $a = (r_p + r_a)/2 = 24\,396.14\,\mathrm{km}$. Then
$$
\varepsilon = -\frac{\mu}{2a} = -\frac{398\,600.4418}{48\,792.27} = -8.169\,\mathrm{km^2/s^2}.
$$
Negative, as it must be for a closed orbit.

**Step 2 — speed at perigee.** Put $r = r_p$ into vis-viva. The bracket is $2/6628.137 - 1/24\,396.14 = 2.6076 \times 10^{-4}\,\mathrm{km^{-1}}$:
$$
v_p = \sqrt{398\,600.4418 \times 2.6076 \times 10^{-4}} = 10.195\,\mathrm{km/s}.
$$

**Step 3 — speed at apogee.** Now the bracket is $2/42\,164.137 - 1/24\,396.14 = 6.4436 \times 10^{-6}\,\mathrm{km^{-1}}$:
$$
v_a = \sqrt{398\,600.4418 \times 6.4436 \times 10^{-6}} = 1.603\,\mathrm{km/s}.
$$

**Sanity check.** Angular momentum must match at both ends: $r_p v_p = 67\,573$ and $r_a v_a = 67\,573\,\mathrm{km^2/s}$. They agree.

**Step 4 — the circularization burn.** A circular orbit at $r_a$ needs $\sqrt{\mu/r_a} = 3.075\,\mathrm{km/s}$. The spacecraft arrives at apogee with $1.603\,\mathrm{km/s}$. So the burn to make the orbit circular costs $3.075 - 1.603 = 1.472\,\mathrm{km/s}$. That is the apogee burn of every GEO mission flown from a GTO with this perigee.

**Step 5 — the period.** From the third law, $T = 2\pi\sqrt{a^3/\mu} = 37\,922\,\mathrm{s} = 10.53\,\mathrm{h}$.
:::

## Circular and escape speed

Two special cases of vis-viva get their own names.

On a **circular orbit**, $r = a$ everywhere. Put $r = a$ into vis-viva: $v^2 = \mu(2/r - 1/r) = \mu/r$. So the **circular speed** is

$$
v_c = \sqrt{\frac{\mu}{r}}.
$$

On a **parabola**, $a \to \infty$, so $1/a \to 0$. The speed at radius $r$ is then the **escape speed** — the least speed that never falls back:

$$
v_{\text{esc}} = \sqrt{\frac{2\mu}{r}} = \sqrt{2}\,v_c .
$$

A spacecraft at exactly $v_{\text{esc}}$, moving in any direction except straight down, has $\varepsilon = 0$. It coasts out forever, its speed dwindling toward zero. Any faster and the path is a hyperbola. Any slower and it is bound, whichever way it is pointed.

Some real numbers:

- At $200\,\mathrm{km}$ altitude, $r = 6578.137\,\mathrm{km}$. Then $v_c = \sqrt{398\,600.4418/6578.137} = 7.784\,\mathrm{km/s}$ and $v_{\text{esc}} = 11.009\,\mathrm{km/s}$.
- At geostationary radius, $v_c = 3.075\,\mathrm{km/s}$ and $v_{\text{esc}} = 4.348\,\mathrm{km/s}$.

Both speeds [[shrink as you go higher|speed-curves]]. The extra speed needed to escape from a circular orbit is $v_{\text{esc}} - v_c = (\sqrt{2} - 1)v_c = 0.414\,v_c$. That is $3.22\,\mathrm{km/s}$ from low orbit, but only $1.27\,\mathrm{km/s}$ from GEO. This is one reason [[high orbits are good places to leave from|high-departure]] and bad places to have to reach.

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
A spacecraft at $r = 6628\,\mathrm{km}$ on a GTO is at the same radius as one in a $250\,\mathrm{km}$ circular orbit. But its period is $10.5\,\mathrm{h}$, not $89\,\mathrm{min}$. The third law wants $a$. Vis-viva wants both $r$ and $a$. Putting $r$ where $a$ belongs is the classic error, and it is silent — the wrong numbers look perfectly reasonable.
:::

::: warning Sidereal, not solar
The geostationary period is the sidereal day, $86\,164.09\,\mathrm{s}$: the time for Earth to turn $360^\circ$ relative to the stars. Using the $86\,400\,\mathrm{s}$ solar day puts the satellite $77\,\mathrm{km}$ too high, and it drifts westward by about $1^\circ$ every day.
:::

## Check yourself

::: check
Two satellites orbit Earth with the same semi-major axis, $a = 10\,000\,\mathrm{km}$. One is circular; the other has $e = 0.3$. Compare their periods, and their speeds when each is at $r = 10\,000\,\mathrm{km}$.
:::

::: answer
**Periods.** Same $a$ means the same period. $T = 2\pi\sqrt{10\,000^3/398\,600.4418} = 9952\,\mathrm{s} = 165.9\,\mathrm{min}$ for both.

**Speeds.** Put $r = a$ into vis-viva: $v^2 = \mu(2/a - 1/a) = \mu/a$ for both. So both move at $\sqrt{398\,600.4418/10\,000} = 6.314\,\mathrm{km/s}$ when they pass $r = 10\,000\,\mathrm{km}$. The circular one is at that radius all the time. The eccentric one is there at two points — the ends of the minor axis. Speed at a given radius depends only on $a$.
:::

::: check
Compare the GTO's speed at perigee and at apogee with the circular speed at each of those radii. What do the two comparisons tell you?
:::

::: answer
**At perigee**, $r_p = 6628.137\,\mathrm{km}$. The orbit speed is $v_p = 10.195\,\mathrm{km/s}$. Circular speed there is $v_c = \sqrt{\mu/r_p} = 7.755\,\mathrm{km/s}$. The spacecraft is $2.44\,\mathrm{km/s}$ too fast to stay at that radius, so it climbs.

**At apogee**, $r_a = 42\,164.137\,\mathrm{km}$. The orbit speed is $v_a = 1.603\,\mathrm{km/s}$ against $v_c = 3.075\,\mathrm{km/s}$. It is $1.47\,\mathrm{km/s}$ too slow to stay there, so it falls back.

**The pattern.** From vis-viva, $v^2 - v_c^2 = \mu(2/r - 1/a) - \mu/r = \mu(1/r - 1/a)$. That is positive wherever $r < a$ and negative wherever $r > a$. Closer in than $a$, an orbit is always faster than circular; farther out, always slower. The two differences are exactly the two burns that would make the orbit circular at either end.
:::

::: check
A spacecraft in a $400\,\mathrm{km}$ circular orbit fires its engine forward, raising its speed by $2.5\,\mathrm{km/s}$. What are the new semi-major axis and apogee altitude?
:::

::: answer
**Before the burn.** $r = 6378.137 + 400 = 6778.137\,\mathrm{km}$, and $v_c = \sqrt{398\,600.4418/6778.137} = 7.6686\,\mathrm{km/s}$.

**After the burn.** $v = 7.6686 + 2.5 = 10.1686\,\mathrm{km/s}$, so $v^2 = 103.40\,\mathrm{km^2/s^2}$.

**Size of the new orbit.** Rearrange vis-viva to $1/a = 2/r - v^2/\mu$:
$$
\frac{1}{a} = 2.9507 \times 10^{-4} - \frac{103.40}{398\,600.4418} = 2.9507 \times 10^{-4} - 2.5941 \times 10^{-4} = 3.566 \times 10^{-5}\,\mathrm{km^{-1}},
$$
so $a = 28\,043\,\mathrm{km}$.

**Apogee.** The velocity stayed sideways, so the burn point is the new perigee. Then $r_a = 2a - r_p = 56\,086 - 6778 = 49\,308\,\mathrm{km}$. Subtract Earth's radius: an apogee altitude of about $42\,930\,\mathrm{km}$, beyond GEO.
:::

::: check
Why does Kepler's second law hold for any central force, while the third law belongs to inverse-square gravity alone?
:::

::: answer
The second law is $dA/dt = h/2$. The angular momentum $\mathbf{h}$ stays constant whenever the force points along $\mathbf{r}$ — any central force will do.

The third law needs more. It needs the orbit to be an ellipse, so that its area is $\pi a b$. And it needs $h = \sqrt{\mu a(1 - e^2)}$. Both came from the orbit equation, which came from the eccentricity vector — a constant that exists only for an inverse-square force. A different force law gives closed orbits that are not ellipses, or no closed orbits at all, and no simple rule linking period and size.
:::

::: check
How much must a spacecraft in a circular orbit at GEO radius speed up to escape Earth? Compare with escaping from a $200\,\mathrm{km}$ orbit.
:::

::: answer
The extra speed to escape from a circular orbit is $(\sqrt{2} - 1)v_c$.

At GEO, $v_c = 3.075\,\mathrm{km/s}$, so $\Delta v = 0.4142 \times 3.075 = 1.274\,\mathrm{km/s}$. ($\Delta v$, "delta-v", means a change in velocity.)

At $200\,\mathrm{km}$, $v_c = 7.784\,\mathrm{km/s}$, so $\Delta v = 3.224\,\mathrm{km/s}$.

Escaping from GEO costs about 40 % of what escaping from low orbit costs. But getting to GEO in the first place costs about $3.9\,\mathrm{km/s}$, so the total is larger. Where you start matters as much as where you are going.
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
| GTO | $v_p = 10.19$, $v_a = 1.60\,\mathrm{km/s}$, $T = 10.53\,\mathrm{h}$, circularization $1.47\,\mathrm{km/s}$ |

The next lesson walks through the four orbit families one at a time — circular, elliptical, parabolic, hyperbolic — with the speeds, energies and far-away behavior that tell them apart.

::: context tycho-kepler Kepler worked from someone else's data
Tycho Brahe measured planet positions by eye, with large instruments, more accurately than anyone before the telescope — to about a sixtieth of a degree. After Tycho died in 1601, Kepler got his records. Mars was the hard case: its orbit is eccentric enough that circles could not fit Tycho's numbers. Kepler published the first two laws in 1609 and the third in 1619. Newton's *Principia*, which explained all three with one law of gravity, came in 1687.
:::

::: context equal-areas Equal areas, very unequal angles
The two shaded wedges below have the same area, so the spacecraft takes the same time to cross each one. Near Earth the wedge is short and wide: the spacecraft swings through a big angle quickly. Far away it is long and thin: the angle barely changes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 216" font-family="Inter, Arial, sans-serif">
  <ellipse cx="165" cy="98" rx="130" ry="92.8" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <path d="M256.0,98 L246.1,170.6 A130,92.8 0 0,0 246.1,25.4 Z" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <path d="M256.0,98 L37.8,79.0 A130,92.8 0 0,0 37.8,117.0 Z" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="256.0" cy="98" r="6" fill="#1d6fd1"/>
  <text x="256" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">Earth</text>
  <text x="301" y="60" font-size="12" fill="#1d6fd1">fast</text>
  <text x="4" y="70" font-size="12" fill="#1f2a44">slow</text>
  <text x="180" y="210" font-size="12" text-anchor="middle" fill="#1f2a44">Both wedges: same area, same time (e = 0.7)</text>
</svg>
```

A comet does the same around the Sun: it whips past in weeks and spends decades far out.
:::

::: context mean-motion Why "mean" motion
"Mean" here means average. A spacecraft on an ellipse turns fast near periapsis and slowly near apoapsis, but over one full orbit it turns $2\pi$ radians in time $T$. The mean motion $n = 2\pi/T$ is that average rate.

It returns in the lesson on anomalies. There you will define a made-up angle, the mean anomaly $M = n(t - t_p)$, that grows at exactly this steady rate. Kepler's equation then converts that easy angle into the real position.
:::

::: context mu-precision Why engineers use μ and not G times M
The gravitational constant $G$ is hard to measure in a lab: it is known to only about five significant figures. But the product $GM$ for Earth comes straight from timing satellite orbits, and it is known to about ten. So orbit software never multiplies $G$ by Earth's mass. It uses $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$ directly — the number the third law measured.
:::

::: context sidereal-day Why a star day is shorter than a Sun day
In one day Earth also moves about $1^\circ$ along its orbit around the Sun ($360^\circ$ in $365.24$ days). So after Earth turns once relative to the stars, the Sun is not quite overhead yet. Earth must turn about $1^\circ$ more, which takes about $236\,\mathrm{s}$ — the gap between $86\,400$ and $86\,164\,\mathrm{s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polyline points="255.4,163.7 258.0,149.2 259.5,134.6 260.0,120.0 259.5,105.4 258.0,90.8 255.4,76.3 251.9,62.1 247.3,48.2 241.8,34.6 235.4,21.4" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 4"/>
  <circle cx="50" cy="120" r="16" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="50" y="152" font-size="12" text-anchor="middle" fill="#1f2a44">Sun</text>
  <circle cx="260" cy="120" r="9" fill="#1d6fd1"/>
  <line x1="248" y1="120" x2="160" y2="120" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="152,120 162,115 162,125" fill="#1f2a44"/>
  <text x="275" y="124" font-size="12" fill="#1f2a44">day 0</text>
  <text x="205" y="138" font-size="11" text-anchor="middle" fill="#1f2a44">Sun and star in line</text>
  <circle cx="247.3" cy="48.2" r="9" fill="#1d6fd1"/>
  <line x1="236" y1="48.2" x2="160" y2="48.2" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="152,48.2 162,43.2 162,53.2" fill="#6c7a93"/>
  <text x="148" y="44" font-size="11" text-anchor="end" fill="#6c7a93">to star</text>
  <line x1="236.7" y1="52.1" x2="186" y2="70.5" stroke="#b4232c" stroke-width="2"/>
  <polygon points="178.5,73.3 186.4,65.2 189.8,74.6" fill="#b4232c"/>
  <text x="172" y="86" font-size="11" text-anchor="end" fill="#b4232c">to Sun: turn a bit more</text>
  <text x="275" y="52" font-size="12" fill="#1f2a44">next day</text>
  <text x="180" y="192" font-size="11" text-anchor="middle" fill="#6c7a93">Angle exaggerated: really about 1° per day</text>
</svg>
```

A geostationary satellite has to keep pace with the stars' day, not the Sun's.
:::

::: context vis-viva-name "Living force"
In the late 1600s Gottfried Leibniz argued that a moving body carries a "living force", *vis viva* in Latin, equal to its mass times its speed squared, $mv^2$. That is twice what we now call kinetic energy. The idea that this quantity is conserved grew into the modern law of conservation of energy. The name stuck to this equation because it is, at heart, an energy balance.
:::

::: context gto-perigee Why the GTO perigee sits so low
The perigee of a GTO is where the upper stage did its last burn, a few hundred kilometers up. Going higher first would cost extra propellant, and every kilogram spent on the rocket's own climb is a kilogram less satellite. The $250\,\mathrm{km}$ figure used in this module is a typical value; real GTOs have perigees from about $180$ to a few hundred kilometers.
:::

::: context speed-curves Circular and escape speed with height
Both speeds fall off as $1/\sqrt{r}$. The red escape curve always sits $\sqrt{2} \approx 1.414$ times above the blue circular one.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="174">0</text><text x="45" y="124">4</text><text x="45" y="74">8</text><text x="45" y="24">12</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="86.3" y="185">10</text><text x="158.8" y="185">20</text><text x="231.3" y="185">30</text><text x="303.8" y="185">40</text>
    <text x="200" y="198">radius, thousands of km</text>
  </g>
  <text x="14" y="100" font-size="11" fill="#1f2a44" transform="rotate(-90 14 100)" text-anchor="middle">speed, km/s</text>
  <polyline points="60.0,71.2 68.7,79.3 77.4,85.8 86.1,91.0 94.8,95.4 103.5,99.1 112.2,102.3 120.9,105.1 129.6,107.6 138.3,109.8 147.0,111.8 155.7,113.6 164.4,115.3 173.1,116.8 181.8,118.2 190.5,119.5 199.2,120.7 207.9,121.8 216.6,122.8 225.3,123.8 234.0,124.7 242.7,125.6 251.4,126.4 260.1,127.2 268.8,127.9 277.5,128.6 286.2,129.3 294.9,129.9 303.6,130.5 312.3,131.1 321.0,131.7 329.7,132.2 338.4,132.7" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="60.0,30.3 68.7,41.8 77.4,50.9 86.1,58.3 94.8,64.4 103.5,69.7 112.2,74.2 120.9,78.2 129.6,81.7 138.3,84.8 147.0,87.7 155.7,90.2 164.4,92.6 173.1,94.7 181.8,96.7 190.5,98.5 199.2,100.2 207.9,101.8 216.6,103.3 225.3,104.7 234.0,106.0 242.7,107.2 251.4,108.4 260.1,109.5 268.8,110.5 277.5,111.5 286.2,112.4 294.9,113.3 303.6,114.2 312.3,115.0 321.0,115.8 329.7,116.5 338.4,117.3" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="61.4" cy="72.7" r="3.5" fill="#1d6fd1"/>
  <circle cx="61.4" cy="32.4" r="3.5" fill="#b4232c"/>
  <circle cx="319.4" cy="131.6" r="3.5" fill="#1d6fd1"/>
  <circle cx="319.4" cy="115.6" r="3.5" fill="#b4232c"/>
  <text x="68" y="30" font-size="11" fill="#b4232c">11.01</text>
  <text x="68" y="76" font-size="11" fill="#1d6fd1">7.78</text>
  <text x="56" y="162" font-size="11" fill="#1f2a44">200 km</text>
  <text x="319" y="106" font-size="11" fill="#b4232c" text-anchor="middle">4.35</text>
  <text x="319" y="147" font-size="11" fill="#1d6fd1" text-anchor="middle">3.07</text>
  <text x="319" y="162" font-size="11" fill="#1f2a44" text-anchor="middle">GEO</text>
  <text x="190" y="40" font-size="12" fill="#b4232c">escape speed</text>
  <text x="190" y="58" font-size="12" fill="#1d6fd1">circular speed</text>
</svg>
```
:::

::: context high-departure Leaving from high up is cheap, getting there is not
From GEO, escape takes only $1.27\,\mathrm{km/s}$ more — but you already paid about $3.9\,\mathrm{km/s}$ to climb there from low orbit. Which is better depends on whether you are going there anyway. The maneuvers module turns this into a real budget. It also shows the opposite effect: a burn made *deep* in the gravity well, where you are moving fast, adds the most energy per kilogram of propellant.
:::
