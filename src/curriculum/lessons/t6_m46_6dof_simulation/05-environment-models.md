---
id: l05-environment-models
title: Environment models
minutes: 21
covers:
  - "Environment models: gravity field, atmosphere, wind and gust, magnetic field, ephemeris, solar radiation pressure"
---

Ride a bike across town. You steer, you pedal, you brake — those are yours. But the hill pulls you back, the air pushes on your chest, a side gust shoves you toward the curb, and the sun warms your back. You control none of those. They are the world you ride through.

A vehicle simulation keeps that world in one place: the **Environment box**, one of the five boxes from the first lesson of this module. It holds everything physical that acts on the vehicle and that the vehicle does not control. That means six models: gravity, the atmosphere, wind and gusts, the planet's magnetic field, the **ephemeris** (where the Sun and Moon are), and the push of sunlight itself.

Every one of these is asked a question at the plant's true state — its position, its velocity, the current time — and answers with a number. And every one is a place where a **[[dispersion campaign|dispersion-campaign]]** will later change a setting without touching anything else. That is the whole reason the Environment box stands on its own.

Each model hides an engineering choice. Is gravity a point, or does it include Earth's bulge? Is the wind steady, or does it gust? You make those choices well only if you know how big each effect is compared with what you are trying to see. So this lesson gives each model real numbers.

## Gravity beyond the point mass

Start with the simplest picture: all of Earth's mass squeezed into one point at its center. That gives **two-body gravity**,

$$
\mathbf{a} = -\frac{\mu\,\mathbf{r}}{r^3},
$$

where $\mathbf{r}$ is the position from Earth's center, $r$ is its length, and $\mu$ ("mu") is Earth's gravitational parameter. The minus sign means "toward the center". This term is by far the biggest one anywhere near a planet, and it is the only one a point-mass validation case needs.

But Earth is not a point, and it is not a perfect ball. It spins, and the spin makes it **[[bulge at the equator|oblate-earth]]**, a little like a ball of dough twirled on a finger. The equator is about $21\,\mathrm{km}$ farther from the center than the poles. That extra ring of mass pulls a little extra, and the largest correction for it is called $J_2$ ("J two"), the second **zonal harmonic** — a term that depends on latitude but not on longitude.

In formulas, gravity comes from a **potential** $U$, a kind of "height of the gravity hill", and the acceleration is its **gradient**: $\mathbf{a} = \nabla U$, the direction and steepness of the fastest uphill climb in $U$. The point-mass part is $U = \mu/r$. The $J_2$ part is

$$
U_{J_2} = -\frac{\mu}{r}\,J_2\left(\frac{R_E}{r}\right)^2\frac{3\sin^2\phi - 1}{2},
$$

with $R_E$ Earth's equatorial radius and $\phi$ ("phi") the latitude. Taking its gradient in inertial $x, y, z$ coordinates gives the standard correction:

$$
\mathbf{a}_{J_2} = -\frac{3}{2}J_2\,\mu\,\frac{R_E^2}{r^5}
\begin{pmatrix}
x\left(1 - 5\dfrac{z^2}{r^2}\right) \\[4pt]
y\left(1 - 5\dfrac{z^2}{r^2}\right) \\[4pt]
z\left(3 - 5\dfrac{z^2}{r^2}\right)
\end{pmatrix} .
$$

Sanity check on the sign. Over the equator, $z = 0$, so the $x$ and $y$ parts are $-\tfrac32 J_2\mu R_E^2 x/r^5$: pointing inward, toward the center. The bulge pulls a vehicle over the equator a little harder, as the picture says it should.

::: example How big is $J_2$ in low Earth orbit?
Take a vehicle $500\,\mathrm{km}$ up at $45^\circ$ latitude. Then $r = 6{,}378.137 + 500 = 6{,}878.137\,\mathrm{km}$ and $\mathbf{r}_I = r\,(\cos 45^\circ,\ 0,\ \sin 45^\circ)$. Use $\mu = 398{,}600.4418\,\mathrm{km^3/s^2}$, $R_E = 6{,}378.137\,\mathrm{km}$ and $J_2 = 1.08263\times10^{-3}$.

```python
import numpy as np

mu, RE, J2 = 398600.4418, 6378.137, 1.08262668e-3
r_mag = RE + 500.0
lat = np.radians(45.0)
r_I = np.array([r_mag*np.cos(lat), 0.0, r_mag*np.sin(lat)])
r = np.linalg.norm(r_I)
x, y, z = r_I

a_pm = -mu * r_I / r**3
factor = -1.5 * J2 * mu * RE**2 / r**5
zr2 = (z/r)**2
a_j2 = factor * np.array([x*(1-5*zr2), y*(1-5*zr2), z*(3-5*zr2)])

print("|a_pm| (m/s^2):", np.linalg.norm(a_pm)*1000)
print("|a_j2| (m/s^2):", np.linalg.norm(a_j2)*1000)
print("ratio:", np.linalg.norm(a_j2)/np.linalg.norm(a_pm))
# |a_pm| (m/s^2): 8.425508709558251
# |a_j2| (m/s^2): 0.013154282548513837
# ratio: 0.0015612449054371123
```

Step by step:

1. Point-mass gravity: $\mu/r^2 = 398{,}600.4418 / 6{,}878.137^2 = 0.0084255\,\mathrm{km/s^2}$, which is $8.4255\,\mathrm{m/s^2}$. (The code multiplies by 1000 to turn km into m.)
2. The $J_2$ correction comes out at $0.01315\,\mathrm{m/s^2}$.
3. Divide: $0.01315 / 8.4255 = 0.00156$, about $0.156\%$.

Does that make sense? At $500\,\mathrm{km}$ gravity is a bit weaker than the $9.81\,\mathrm{m/s^2}$ at the ground, so $8.43$ is right. And $J_2$ itself is about one part in a thousand, so a correction of about a tenth of a percent is the right size.

Is $0.156\%$ big? For a single ascent, or a rendezvous that lasts minutes, you can leave it out. For a propagation over many orbits you cannot: the small push adds up, orbit after orbit, into a steady drift away from reality. This is the same **secular** versus negligible question the Numerical Methods module asked about truncation error. The difference is that here the small term is real physics you choose to include, not a numerical artifact. Leaving it out is a modeling choice, not a shortcut.
:::

## Atmosphere and wind

The atmosphere model hands back three things at the plant's true altitude: **density** (how much air is packed into a cubic meter), **pressure**, and the **speed of sound**. At sea level in the standard atmosphere these are $1.225\,\mathrm{kg/m^3}$, $101{,}325\,\mathrm{Pa}$ and $340.3\,\mathrm{m/s}$, and all three fall with height. The Atmospheric Flight module already showed you how to turn them into aerodynamic force and moment. The Environment box's job is only to serve them, consistently, from whichever standard atmosphere the campaign has chosen.

What that module did not need in detail is the **wind**. Here is the key idea. Stand still in a breeze and you feel wind in your face. Ride a bike on a calm day and you *also* feel wind in your face. The air only cares how fast you move *through it*. So aerodynamic force depends on the velocity **relative to the air**, not relative to the ground:

$$
\mathbf{v}_{\text{rel}} = \mathbf{v}_{\text{vehicle}} - \mathbf{v}_{\text{wind}} .
$$

Wind is therefore not a separate force. It is a correction to a velocity that every aerodynamic calculation downstream already uses. That is exactly why it lives in the Environment box instead of being folded into the plant.

A wind model has at least two layers.

The first is a **mean profile**: the steady wind speed at each height. Near the ground, friction with the surface slows the air, so wind picks up as you go higher. Close to the ground a **[[power law|power-law-wind]]** describes this well:

$$
V(h) = V_{\text{ref}}\left(\frac{h}{h_{\text{ref}}}\right)^\alpha ,
$$

where $V_{\text{ref}}$ is the speed measured at a reference height $h_{\text{ref}}$ (often $10\,\mathrm{m}$) and $\alpha$ ("alpha") is about $0.1$ to $0.2$ over open ground. Above the lowest kilometer or so, real profiles come from weather-balloon data or a design wind profile, which also captures the **jet stream**, the band of fast wind near the top of the lower atmosphere.

The second layer is a **discrete gust** riding on top. For structural and control design it is usually a **[[1 − cosine pulse|one-minus-cosine]]**: the wind rises smoothly to a stated peak and falls smoothly back. Why a gust and not the mean wind? Because a launch vehicle's worst loads come from a sudden gust met at the moment of **[[maximum dynamic pressure|max-q]]**.

::: example A design gust at max-Q
First the mean profile, with $V_{\text{ref}} = 20\,\mathrm{m/s}$ at $h_{\text{ref}} = 10\,\mathrm{m}$ and $\alpha = 0.14$:

```python
V_ref, h_ref, alpha = 20.0, 10.0, 0.14
for h in [10, 100, 1000, 11000]:
    print(h, round(V_ref*(h/h_ref)**alpha, 2))
# 10 20.0
# 100 27.61
# 1000 38.11
# 11000 53.31
```

At $100\,\mathrm{m}$ the height is ten times the reference, so the speed is $20 \times 10^{0.14} = 20 \times 1.380 = 27.6\,\mathrm{m/s}$. At $1000\,\mathrm{m}$ it is $20 \times 100^{0.14} = 38.1\,\mathrm{m/s}$. Stretched all the way to $11\,\mathrm{km}$, near the top of the lower atmosphere, the formula gives $53.3\,\mathrm{m/s}$ — the right size for winds up there, though the power law is only trustworthy in the lowest part of that range.

Now the gust. The classic design gust is $30\,\mathrm{ft/s}$, which is $9.14\,\mathrm{m/s}$. The vehicle flies at $300\,\mathrm{m/s}$ through max-Q, and the gust hits it from the side. The relative wind is now tilted by a small angle, so the **angle of attack** — the angle between the vehicle's nose and the air flowing past it — changes by

$$
\Delta\alpha \approx \arctan\!\left(\frac{V_{\text{gust}}}{V_{\text{vehicle}}}\right) = \arctan\!\left(\frac{9.14}{300}\right) = 1.745^\circ .
$$

($\Delta\alpha$, read "delta alpha", is the change in angle of attack.) Small, but it happens where the **dynamic pressure** $q = \tfrac12\rho v^2$ is largest. Dynamic pressure is what turns an angle of attack into a sideways force: the side load is roughly proportional to $q$ times $\Delta\alpha$. So a small angle at the largest $q$ is the worst sideways shove the vehicle will feel. That is why the requirement places this gust at max-Q, not at some random point in the flight.
:::

::: warning The same gust is not the same angle everywhere
The gust angle depends on how fast the vehicle is going. Right after liftoff, at $50\,\mathrm{m/s}$, the same $9.14\,\mathrm{m/s}$ gust tilts the flow by $\arctan(9.14/50) = 10.4^\circ$ — six times more than at max-Q. It is tempting to call that the worst case. It is not, because $q$ is tiny at low speed. Always compare the *product*, $q\,\Delta\alpha$, not the angle alone.
:::

A single pulse is a design point, not a weather forecast. Real air is **turbulent**: it jiggles at many sizes and speeds at once. The **[[Dryden and von Kármán|dryden-von-karman]]** turbulence models describe wind as a random signal with a stated spread of energy across frequencies. They belong in the same box. A Monte Carlo campaign draws a different random turbulence history for every case. The deterministic gust is the worst-case design point; the random model is what a statistical loads or controllability study needs instead.

::: warning Wind folded into the plant instead of the environment
It is tempting to add wind inside the plant's translational equation as one more force, since that is where aerodynamic force finally lands. Wind is not a force. It changes the *relative velocity* that an existing aerodynamic calculation uses, and it needs to be queried, dispersed and swapped like every other environment field. Bury it in the plant and it becomes invisible to the machinery that swaps density models or gravity fields. The next engineer who disperses wind for a Monte Carlo will not find it where every other environment setting lives.
:::

## Magnetic field and ephemeris

A compass needle points north because Earth is a giant, weak magnet. To a first guess, that magnet is a **dipole** — a bar magnet at Earth's center. At the magnetic equator a dipole's field strength falls with the cube of distance:

$$
B_{\text{eq}}(r) = B_0\left(\frac{R_E}{r}\right)^3 ,
$$

with $B_0 \approx 3.05\times10^{-5}\,\mathrm{T}$ at the surface. (T is the **tesla**, the unit of magnetic field; $1\,\mathrm{nT}$, a nanotesla, is a billionth of one.)

Why does a spacecraft care? Stray current loops and slightly magnetized metal make the spacecraft a tiny magnet too, with a **magnetic dipole moment** $m$ measured in $\mathrm{A\,m^2}$. Earth's field twists that tiny magnet with a torque of up to $m B$, like the field turning a compass needle.

```python
RE, r_mag, B0 = 6378.137, 6878.137, 3.05e-5
B_eq = B0*(RE/r_mag)**3
print(B_eq*1e9, "nT")
for m_dipole in [0.1, 1.0]:
    print(m_dipole, "A m^2 ->", m_dipole*B_eq, "N m")
# 24320.29866778343 nT
# 0.1 A m^2 -> 2.432029866778343e-06 N m
# 1.0 A m^2 -> 2.432029866778343e-05 N m
```

At $500\,\mathrm{km}$ the ratio $R_E/r$ is $6378/6878 = 0.927$, and cubing it gives $0.797$. So the field is $0.797 \times 3.05\times10^{-5} = 2.43\times10^{-5}\,\mathrm{T}$, about $24{,}300\,\mathrm{nT}$. A modest spacecraft dipole of $0.1$ to $1\,\mathrm{A\,m^2}$ then feels a torque of $2.4\times10^{-6}$ to $2.4\times10^{-5}\,\mathrm{N\,m}$. That sits right in the range the Rigid Body Dynamics module quoted for disturbance torques in low orbit.

A dipole is good to maybe 10%. That is fine for a disturbance-torque budget or a rough magnetometer-only attitude estimate. It is not good enough for precise magnetic attitude work, which needs a full **[[spherical-harmonic field model such as IGRF|igrf]]**, with dozens of terms beyond the dipole.

The **ephemeris** answers "where are the Sun and Moon right now?" One answer feeds three other models at once: the extra gravity pull of the Sun and Moon (**third-body perturbation**), sunlight pressure, and **eclipse** — whether the vehicle is in Earth's shadow. A short simulation can often use a simple circular path for the Sun. Anything lasting weeks, or anything where eclipse timing matters for power or heat, needs a precise ephemeris such as a **[[JPL DE table|jpl-de]]**. A rough Sun position is one more unmodeled push, and its error adds up like any other.

::: warning Treating a dipole magnetic field as precise
A dipole is right in size and wrong in detail. It leaves out the field's finer structure and the slow drift of the real field over the years. It is fine for a disturbance-torque budget like the one above, where being within a factor of two is enough. It is not fine for simulating how accurate a magnetometer-based attitude filter really is, because the real sensor sees structure the dipole cannot make. Know which job you are asking the model to do before you pick it.
:::

## Solar radiation pressure

Sunlight carries momentum. When light hits a surface and is soaked up or bounced off, the surface feels a tiny push — the same idea as a tennis ball hitting a wall, only with a staggering number of very light "balls".

At Earth's distance from the Sun (1 AU, one **astronomical unit**), the push per square meter is the **[[solar constant|solar-constant]]** $S$ divided by the speed of light $c$:

$$
P_{\text{sr}} = \frac{S}{c} .
$$

On a vehicle of mass $m$ with a sunlit area $A$, the acceleration is

$$
a_{\text{srp}} = P_{\text{sr}}\,C_R\,\frac{A}{m},
$$

where $C_R$ is the **radiation-pressure coefficient**: $1$ for a surface that soaks up all the light, up to $2$ for a perfect mirror, which bounces it back and so gets pushed twice as hard.

```python
S, c = 1361.0, 2.99792458e8
P_sr = S/c
print(P_sr)
CR = 1.3
for AtoM in [0.01, 0.05]:
    print(AtoM, "->", P_sr*CR*AtoM, "m/s^2")
# 4.53980733564685e-06
# 0.01 -> 5.9017495363409044e-08 m/s^2
# 0.05 -> 2.9508747681704526e-07 m/s^2
```

The pressure is $1361 / 2.998\times10^8 = 4.540\times10^{-6}\,\mathrm{N/m^2}$. A compact spacecraft has an area-to-mass ratio near $0.01\,\mathrm{m^2/kg}$; one with big solar panels, near $0.05$. With $C_R = 1.3$ the acceleration is $5.9\times10^{-8}$ to $3.0\times10^{-7}\,\mathrm{m/s^2}$.

That is nothing next to gravity — less than a ten-millionth of it. Yet it pushes in the same general direction for weeks, so it adds up enough to matter for any high-precision orbit work. And the same ephemeris that places the Sun must also say when the vehicle is in shadow, so that $a_{\text{srp}}$ is switched off.

::: key The six environment models
Gravity (point mass, plus $J_2$ and higher harmonics where the mission duration warrants them), atmosphere (density, pressure, speed of sound versus altitude), wind and gust (a mean profile plus a deterministic design gust or a stochastic turbulence spectrum), magnetic field (dipole for coarse work, spherical harmonic for precision), ephemeris (Sun and Moon position, needed for third-body perturbation, solar radiation pressure and eclipse), and solar radiation pressure itself. Every one is evaluated at the plant's true state and belongs in the Environment box so a dispersion campaign can vary any one of them independently.
:::

## Check yourself

::: check
Why does wind enter the simulation through the relative velocity $\mathbf{v}_{\text{rel}} = \mathbf{v}_{\text{vehicle}} - \mathbf{v}_{\text{wind}}$ rather than as a force applied directly to the plant?
:::

::: answer
Aerodynamic force and moment, as the Atmospheric Flight module derived them, depend on the vehicle's velocity through the air, not over the ground. Wind changes what that relative velocity is. It does not add a separate force.

Treating it as a velocity correction, served by the Environment box and used wherever relative velocity is computed, keeps it consistent with every aerodynamic calculation. It also keeps it swappable in the same way as every other environment field.
:::

::: check
The $J_2$ correction at $500\,\mathrm{km}$ was about $0.156\%$ of point-mass gravity. Explain why it can be safely left out of a single ascent-to-orbit trajectory but not out of a two-week station-keeping simulation, even though the ratio is the same in both.
:::

::: answer
$0.156\%$ is an *instantaneous* ratio: the size of the push at one moment. Its effect on the path builds up with time, like any unmodeled push.

Over the few minutes of an ascent, it moves the trajectory by far less than the guidance cares about. Over two weeks of station-keeping it builds into a steady drift of the orbit — most visibly the slow turning of the orbit plane, called **nodal regression** — and that is not small against the station-keeping tolerance.

The ratio tells you the size of the force. Whether that size matters depends on how long it acts, which is a property of the mission, not of $J_2$.
:::

::: check
The same $9.14\,\mathrm{m/s}$ side gust changes the angle of attack by $10.4^\circ$ at $50\,\mathrm{m/s}$ right after liftoff, by $1.75^\circ$ at $300\,\mathrm{m/s}$ at max-Q, and by $0.44^\circ$ at $1200\,\mathrm{m/s}$ high up. Take air density $1.225$, $0.4135$ and $0.0184\,\mathrm{kg/m^3}$ at those three points. Which one gives the largest side load, and why is it not the one with the biggest angle?
:::

::: answer
Side load is roughly proportional to $q\,\Delta\alpha$, with $q = \tfrac12\rho v^2$ and $\Delta\alpha$ in radians.

- Liftoff: $q = \tfrac12(1.225)(50^2) = 1{,}531\,\mathrm{Pa}$, and $\Delta\alpha = 0.181\,\mathrm{rad}$. Product: $277\,\mathrm{Pa}$.
- Max-Q: $q = \tfrac12(0.4135)(300^2) = 18{,}608\,\mathrm{Pa}$, and $\Delta\alpha = 0.0305\,\mathrm{rad}$. Product: $567\,\mathrm{Pa}$.
- High up: $q = \tfrac12(0.0184)(1200^2) = 13{,}248\,\mathrm{Pa}$, and $\Delta\alpha = 0.0076\,\mathrm{rad}$. Product: $101\,\mathrm{Pa}$.

Max-Q wins, about twice liftoff. At liftoff the angle is big but $q$ is small, because the vehicle is slow. High up, $q$ is still sizable but the angle is tiny, because the vehicle is fast. Max-Q is where dense-enough air meets high-enough speed, and $q$ is what turns an angle into a force.
:::

::: check
Why does solar radiation pressure need the same ephemeris data that third-body gravity needs, beyond knowing the Sun is "somewhere up there"?
:::

::: answer
The radiation-pressure push depends on the vehicle's actual direction to the Sun (and, over long spans, its distance), the same way the Sun's gravity term does. Both must also be handled correctly when the vehicle passes into Earth's shadow, where the sunlight push switches off — and working out the eclipse needs the Sun's position accurately.

A rough or stale ephemeris puts the same kind of growing error into the radiation-pressure force as it does into the gravity term.
:::

::: check
A dipole model of Earth's magnetic field is good enough for a disturbance-torque budget but not for a precision magnetometer-based attitude filter. What difference between the two jobs explains that?
:::

::: answer
A disturbance-torque budget needs only the field's size, to within a factor of two or so, to bound how much control authority the actuators need over an orbit. A dipole gives that.

A magnetometer-based filter pulls attitude information out of the field's fine structure at the vehicle's exact position. The dipole does not contain that structure at all. Using it would feed the filter a field the real magnetometer will never measure, and would make the filter's error look smaller than it really is.
:::

::: check
A teammate proposes adding the $9.14\,\mathrm{m/s}$ design gust to the plant's equations of motion as a fixed bias force, worked out once from a nominal angle of attack, instead of querying it from the Environment box as a function of time and altitude. What is lost?
:::

::: answer
A fixed force cannot reproduce the gust's real time history: its start, its smooth 1 − cosine rise and fall, or how its effect depends on where in the flight — and so at what dynamic pressure — it is met.

It also cannot be swapped for a different gust size or a random turbulence model, or switched off for a nominal run. Making those changes a matter of configuration, not code, is exactly what the Environment box's interface is for.
:::

## Summary

| Model | Formula or value | Typical size (examples above) |
| --- | --- | --- |
| Point-mass gravity | $\mathbf{a} = -\mu\mathbf{r}/r^3$ | $8.43\,\mathrm{m/s^2}$ at $500\,\mathrm{km}$ |
| $J_2$ correction | $\mathbf{a}_{J_2} = -\tfrac32 J_2\mu R_E^2/r^5\,[\ldots]$ | $0.0132\,\mathrm{m/s^2}$, $0.156\%$ of point mass |
| Relative wind | $\mathbf{v}_{\text{rel}} = \mathbf{v}_{\text{vehicle}} - \mathbf{v}_{\text{wind}}$ | Wind is a velocity correction, not a force |
| Wind profile | $V(h) = V_{\text{ref}}(h/h_{\text{ref}})^\alpha$ | $20$ to $38\,\mathrm{m/s}$ from $10\,\mathrm{m}$ to $1\,\mathrm{km}$ |
| Discrete gust | $\Delta\alpha \approx \arctan(V_{\text{gust}}/V_{\text{vehicle}})$ | $1.75^\circ$ for $9.14\,\mathrm{m/s}$ at $300\,\mathrm{m/s}$; load goes as $q\,\Delta\alpha$ |
| Magnetic dipole | $B_{\text{eq}} = B_0(R_E/r)^3$ | $24{,}300\,\mathrm{nT}$ at $500\,\mathrm{km}$; torque $2$ to $24\,\mu\mathrm{N\,m}$ |
| Solar radiation pressure | $a_{\text{srp}} = (S/c)\,C_R\,(A/m)$ | $6\times10^{-8}$ to $3\times10^{-7}\,\mathrm{m/s^2}$ |
| Ephemeris | Sun and Moon position against time | Feeds third-body gravity, SRP and eclipse together |

Every model here supplies truth to the plant. The next lesson covers what stands between that truth and the flight software's view of it: the sensor models that turn a perfect world into the noisy, delayed, rounded one that GNC actually has to fly in.

::: context dispersion-campaign What a dispersion campaign is
Nobody knows tomorrow's winds exactly, or a vehicle's exact mass, or its engine's exact thrust. So engineers run the simulation thousands of times, each time drawing every uncertain setting at random from its believed spread: a bit more wind here, a slightly heavier tank there. That set of runs is a **dispersion campaign**, often called a Monte Carlo after the casino. It shows not one answer but the whole range of answers the real flight might produce. It only works if each setting can be changed on its own — which is why each environment model sits in its own box with its own settings.
:::

::: context oblate-earth A slightly squashed Earth
Earth's equatorial radius is $6{,}378.137\,\mathrm{km}$ and its polar radius is about $6{,}356.752\,\mathrm{km}$, a difference of about $21\,\mathrm{km}$ — only a third of a percent, drawn here hugely exaggerated.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <ellipse cx="130" cy="75" rx="95" ry="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="130" cy="75" r="60" fill="none" stroke="#1f2a44" stroke-width="1.2" stroke-dasharray="5 3"/>
  <line x1="130" y1="5" x2="130" y2="145" stroke="#6c7a93" stroke-width="1"/>
  <line x1="25" y1="75" x2="235" y2="75" stroke="#6c7a93" stroke-width="1"/>
  <text x="136" y="12" font-size="12" fill="#1f2a44">spin axis</text>
  <text x="240" y="70" font-size="12" fill="#1f2a44">equator</text>
  <text x="240" y="100" font-size="12" fill="#b4232c">extra ring of mass</text>
  <text x="240" y="116" font-size="12" fill="#b4232c">pulls a bit harder</text>
  <text x="240" y="132" font-size="12" fill="#b4232c">near the equator</text>
</svg>
```

The dashed circle is a perfect ball. The blue shape is the spinning, bulging Earth (not to scale). $J_2$ is the number that measures how big that bulge is, as seen by gravity.
:::

::: context power-law-wind Why wind grows with height
Air near the ground rubs against grass, trees and buildings, which slows it down. Higher up there is less to rub against, so the wind blows faster. This slowed layer is the **atmospheric boundary layer**, usually a few hundred meters to a couple of kilometers thick. The power law is a good fit inside it. Above it, the wind is driven by large weather systems, and near $10$ to $12\,\mathrm{km}$ the jet stream can blow at over $50\,\mathrm{m/s}$. Launch teams measure the real profile with weather balloons on launch day.
:::

::: context one-minus-cosine The shape of a design gust
A design gust of peak $V$ spread over a distance $L$ is $v(x) = \tfrac{V}{2}\left(1 - \cos\tfrac{2\pi x}{L}\right)$ for $0 \le x \le L$. It starts at zero, rises smoothly to $V$ halfway through, and falls smoothly back to zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="100" x2="340" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="110" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="40.0,100.0 60.0,96.5 80.0,86.8 100.0,72.8 120.0,57.2 140.0,43.2 160.0,33.5 180.0,30.0 200.0,33.5 220.0,43.2 240.0,57.2 260.0,72.8 280.0,86.8 300.0,96.5 320.0,100.0"/>
  <line x1="40" y1="30" x2="180" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="44" y="24" font-size="12" fill="#1f2a44">peak V</text>
  <text x="180" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">L/2</text>
  <text x="320" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">L</text>
  <text x="330" y="94" font-size="12" text-anchor="end" fill="#1f2a44">distance</text>
</svg>
```

The smooth ramp matters: a sudden step of wind would shake a vehicle in ways real air never does, and would make the load answer depend on how finely the simulation steps.
:::

::: context max-q Why dynamic pressure peaks partway up
Dynamic pressure $q = \tfrac12\rho v^2$ needs both air (density $\rho$) and speed ($v$). On the pad the air is thick but the rocket is slow, so $q$ is small. High up the rocket is fast but the air is thin, so $q$ is small again. In between it peaks: that peak is **max-Q**.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="120" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="3" points="40.0,110.0 58.1,103.8 76.2,87.2 94.4,65.8 112.5,46.0 130.6,33.2 148.8,30.0 166.9,35.7 185.0,47.6 203.1,62.1 221.2,76.2 239.4,87.9 257.5,96.6 275.6,102.5 293.8,106.1 311.9,108.1 330.0,109.1"/>
  <text x="148" y="22" font-size="12" text-anchor="middle" fill="#b4232c">max-Q</text>
  <text x="50" y="22" font-size="12" fill="#1f2a44">q</text>
  <text x="335" y="125" font-size="12" text-anchor="end" fill="#1f2a44">time after liftoff (schematic)</text>
</svg>
```

For many launch vehicles this happens around one minute after liftoff, roughly $10$ to $14\,\mathrm{km}$ up. Some rockets throttle down through it to keep the loads in check.
:::

::: context dryden-von-karman Random wind with a recipe
Turbulence cannot be written as one formula of time, but its *character* can: how much of its energy is in slow, big swirls and how much in fast, small ones. The **Dryden** and **von Kármán** models give that recipe as a **power spectral density**. To use one, you make random white noise and pass it through a filter shaped to that recipe; out comes a wind history with the right character. A new random seed gives a new, equally valid history. Aircraft flight-control standards have used both models for decades.
:::

::: context igrf The real field, term by term
The **International Geomagnetic Reference Field**, IGRF, is published by the International Association of Geomagnetism and Aeronomy and updated every five years. It writes Earth's field as a sum of spherical harmonics — a dipole plus ever finer patterns — up to degree 13, which is 195 coefficients. It also gives how each coefficient drifts year to year, because Earth's field really does wander: the magnetic north pole has moved by hundreds of kilometers in recent decades.
:::

::: context jpl-de Where the planets really are
NASA's Jet Propulsion Laboratory publishes the **Development Ephemeris**, or DE, a series of tables (DE430, DE440 and others) that give the positions of the Sun, Moon and planets over centuries. They are built by fitting a model of the solar system to decades of radar, laser-ranging and spacecraft tracking data. Mission planners worldwide use them. A simulation reads positions from the table and interpolates between the stored points.
:::

::: context solar-constant How strong sunlight is up there
The **solar constant**, about $1361\,\mathrm{W/m^2}$, is how much sunlight power falls on one square meter facing the Sun at Earth's distance, above the air. Light carrying energy $E$ carries momentum $E/c$, so power per area divided by $c$ gives force per area — pressure. The "constant" wobbles slightly: it is about $3\%$ higher in early January, when Earth is closest to the Sun, and it varies a little with the Sun's activity cycle.
:::
