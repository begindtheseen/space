---
id: l09-solar-radiation-pressure
title: Solar radiation pressure and eclipse modelling
minutes: 20
covers:
  - solar radiation pressure and eclipse modelling
---

Stand in front of a garden hose and the spray pushes you. Each drop carries a little momentum, and when it hits you, that momentum becomes yours. Sunlight does the same thing, only far more gently. Light carries momentum, and a spacecraft that soaks up or bounces back sunlight feels a steady push directly away from the Sun. That push is **solar radiation pressure**, or **SRP**.

It is tiny — in low orbit, about five orders of magnitude smaller than $J_2$. But it has two properties none of this module's other nudges share.

First, it barely depends on altitude. It depends on the distance from the *Sun*, and that hardly changes as a spacecraft circles Earth. So it does not fade with height the way the gravity-based nudges do.

Second, it switches off, and back on, every time the spacecraft passes through Earth's shadow. That makes **eclipse modelling** — working out when the spacecraft is in shadow — part of SRP itself. Get the shadow boundary wrong and a small but systematic error builds up orbit after orbit, exactly the "small push, long time" danger this module warned about in its first lesson.

## Light carries momentum

A particle of light, a **photon**, has no mass, yet it carries **[[momentum|photon-momentum]]**: $p = E/c$, its energy divided by the speed of light. So a stream of light carrying a certain power per square meter also carries momentum per second per square meter. Momentum per second is force, and force per square meter is pressure.

Sunlight arriving at Earth's distance from the Sun, **1 AU** (one astronomical unit, about $1.496\times10^{8}\,\mathrm{km}$), carries about $1361\,\mathrm{W/m^2}$. That number is the **[[solar constant|solar-constant]]**. Divide it by $c$:

$$
\frac{1361\,\mathrm{W/m^2}}{299\,792\,458\,\mathrm{m/s}} = 4.54\times10^{-6}\,\mathrm{N/m^2} .
$$

Astrodynamics has long used the slightly larger value

$$
P_{\text{SR}} \approx 4.56\times10^{-6}\,\mathrm{N/m^2} \quad\text{at } 1\,\mathrm{AU} ,
$$

which comes from an older solar-constant estimate of $1367\,\mathrm{W/m^2}$. The two differ by $0.4\%$, much less than the uncertainty in the spacecraft's surface properties, so either is fine. This lesson uses $4.56\times10^{-6}$. ($P_{\text{SR}}$ is read "P sub S R", the solar radiation pressure.)

How much is that? On one square meter it is a force of $4.56\times10^{-6}\,\mathrm{N}$, about the weight of half a milligram. On a whole spacecraft, for months, it adds up.

Because sunlight spreads out as it travels, $P_{\text{SR}}$ falls as one over the distance from the Sun squared. Earth's orbit is slightly oval, so over a year the pressure at Earth varies by about $\pm3.4\%$. A careful force model scales it by $(1\,\mathrm{AU}/d_{\text{Sun}})^2$.

### Soak it up or bounce it back

Throw a ball of clay at a wall and it sticks. The wall receives the ball's momentum once. Throw a rubber ball and it bounces back. The wall has to stop it *and* send it back, so it receives the momentum **[[twice|absorb-reflect]]**.

Light is the same. A black surface that absorbs the light receives $p$ per photon. A perfect mirror facing the Sun receives $2p$. Real spacecraft are a mix of black paint, white paint, shiny foil and solar cells, some reflecting like a mirror and some scattering light in all directions. All of that is summed up in one number, the **reflectivity coefficient**

$$
C_r = 1 + \text{reflectivity} ,
$$

where the reflectivity runs from $0$ (absorbs everything) to $1$ (reflects everything). So $C_r$ runs from $1$ to $2$.

### The acceleration

Put it together. The force is pressure times sunlit area times $C_r$; divide by mass for the acceleration. Its size is

$$
a_{\text{SRP}} = P_{\text{SR}}\,\frac{A}{m}\,(1 + \text{reflectivity}) = P_{\text{SR}}\,C_r\,\frac{A}{m} .
$$

For the direction, let $\hat{\mathbf{s}}$ be the unit vector pointing from the spacecraft toward the Sun. The Sun is so far away that this is, to a tiny fraction of a degree, the same as the direction from Earth to the Sun. Light pushes, it does not pull, so

$$
\mathbf{a}_{\text{SRP}} = -P_{\text{SR}}\,C_r\,\frac{A}{m}\,\hat{\mathbf{s}} ,
$$

pointing away from the Sun. This is the simplest model, called the **[[cannonball model|cannonball]]**: it treats the spacecraft as if the same area $A$ always faced the Sun.

$A/m$, the sunlit area per kilogram, is the lever that matters most. It is the same kind of area-to-mass ratio that set the ballistic coefficient in the drag lesson. A **[[solar sail|solar-sail]]**, or a spacecraft with huge, light solar panels, has an $A/m$ many times that of a dense small satellite, and feels a push many times larger.

::: example Sizing SRP for a typical spacecraft
Take $A/m = 0.02\,\mathrm{m^2/kg}$ (a compact satellite with modest solar panels) and $C_r = 1.3$ (partly absorbing, partly reflecting).

**Multiply the three factors:**
$$
a_{\text{SRP}} = (4.56\times10^{-6})(1.3)(0.02) = 1.186\times10^{-7}\,\mathrm{m/s^2} .
$$

**Altitude.** It is essentially the same number in low orbit and at geostationary height. Both are a few tens of thousands of kilometers from Earth at most, which is nothing next to $1.5\times10^{8}\,\mathrm{km}$ from the Sun.

**Compare with the other nudges in LEO.** It is about $100\,000$ times smaller than $J_2$ (about $1.2\times10^{-2}\,\mathrm{m/s^2}$). It is also smaller than the Moon's pull (about a tenth of $1.2\times10^{-6}$) and the Sun's pull (about a fifth of $5.4\times10^{-7}$) from the last lesson. At GEO, where $J_2$ has faded, it is only about one to two orders of magnitude below the lunisolar terms.

**Sanity check.** "SRP about $10^{-7}\,\mathrm{m/s^2}$" is what lesson 1's table said. And since both drag and SRP scale with $A/m$, shrinking a satellite's cross-section to cut drag cuts SRP by the same fraction.
:::

## Earth's shadow: the cylinder model

Now the on–off switch. The simplest eclipse model treats Earth's shadow as an endless **cylinder** of radius $R_E$, stretching straight away from the Sun, like the shadow a ball casts in parallel light.

Let $\mathbf{r}$ be the spacecraft's position from Earth's center, and $\hat{\mathbf{s}}$ the unit vector toward the Sun as before. The spacecraft is in shadow exactly when both of these hold:

$$
\mathbf{r}\cdot\hat{\mathbf{s}} < 0 \qquad\text{and}\qquad \lVert\mathbf{r}\times\hat{\mathbf{s}}\rVert < R_E .
$$

Read them one at a time.

- **$\mathbf{r}\cdot\hat{\mathbf{s}} < 0$**: the spacecraft's position has a negative component toward the Sun. It is on the night side, behind Earth.
- **$\lVert\mathbf{r}\times\hat{\mathbf{s}}\rVert < R_E$**: the size of a cross product of $\mathbf{r}$ with a unit vector is $r\sin\theta$, where $\theta$ is the angle between them. And $r\sin\theta$ is the perpendicular distance from the spacecraft to the Earth–Sun line. If that is less than Earth's radius, the spacecraft is inside the cylinder.

You need both. A spacecraft on the day side can be close to the Earth–Sun line too, but it is in full sunlight.

The test is cheap and gets every case right except the fuzzy edge itself. Here it is in code, checked on four cases: straight behind Earth, on the sunlit side, a little off-axis behind Earth, and far enough off-axis to clear the shadow.

```python
import numpy as np

R_E = 6378.137  # km

def in_shadow(r, s_hat):
    """Cylindrical shadow test. r: geocentric position (km);
    s_hat: unit vector from Earth toward the Sun."""
    behind = np.dot(r, s_hat) < 0.0
    off_axis = np.linalg.norm(np.cross(r, s_hat))
    return bool(behind and off_axis < R_E)

s_hat = np.array([1.0, 0.0, 0.0])                          # Sun along +x
print(in_shadow(np.array([-7000.0, 0.0, 0.0]), s_hat))     # True: straight behind Earth
print(in_shadow(np.array([7000.0, 0.0, 0.0]), s_hat))      # False: sunlit side
print(in_shadow(np.array([-7000.0, 6000.0, 0.0]), s_hat))  # True: 6000 km off axis
print(in_shadow(np.array([-7000.0, 7000.0, 0.0]), s_hat))  # False: clears the shadow
```

In a propagator, the SRP term is multiplied by a **shadow factor** $\nu$ ("nu"): $1$ in sunlight, $0$ in shadow. The cylinder model only ever gives $0$ or $1$.

### How much of an orbit is dark?

How long an orbit spends in shadow depends on how its plane sits relative to the Sun. That is measured by the **[[beta angle|beta-angle]]** $\beta$, the angle between the orbit plane and the direction to the Sun. When $\beta = 0$, the Sun lies in the orbit plane and the spacecraft passes straight through the middle of the shadow. That is the longest eclipse, the worst case.

::: example How much of a low orbit is eclipsed
Take a circular orbit of radius $r$ with $\beta = 0$.

**Where does the shadow start?** Measure the spacecraft's angle $\theta$ around the orbit from the point directly behind Earth. Its perpendicular distance from the Earth–Sun line is $r\sin\theta$. The cylinder test says it is in shadow while $r\sin\theta < R_E$, that is, while $\theta < \arcsin(R_E/r)$, on either side.

**Fraction of the orbit.** The dark arc is $2\arcsin(R_E/r)$ out of a full $2\pi$, so the fraction is
$$
\frac{\arcsin(R_E/r)}{\pi} .
$$

**At $400\,\mathrm{km}$** ($r = 6778.137\,\mathrm{km}$): $R_E/r = 0.9410$, so $\arcsin(0.9410) = 1.2248\,\mathrm{rad} = 70.2^\circ$. The fraction is $1.2248/\pi = 0.390$. The period at this height is $92.6$ minutes, so the **[[eclipse lasts|eclipse-picture]]** about $0.390 \times 92.6 \approx 36$ minutes.

**At GEO** ($r = 42\,164.137\,\mathrm{km}$): $R_E/r = 0.1513$, $\arcsin = 0.1518\,\mathrm{rad} = 8.70^\circ$, fraction $0.0483$. Out of a $1436$-minute sidereal day, that is about $69$ minutes.

**Sanity check.** Low orbit spends a bit more than a third of each lap in darkness, which matches the usual rule of thumb. GEO is so far out that Earth's shadow covers only a small slice of its orbit.

**But not every day at GEO.** A geostationary orbit lies in Earth's equatorial plane, and the Sun is only close to that plane near the two **equinoxes** (around March 20 and September 22). The rest of the year the Sun sits so far above or below the plane that a geostationary satellite passes above or below the shadow entirely. So **[[GEO eclipses come in seasons|geo-seasons]]** — about six weeks around each equinox — not once a day all year.
:::

## The real shadow is a cone

The Sun is not a point. Seen from Earth it is a disk about $0.53^\circ$ across. So Earth's true shadow is not a cylinder but a **cone** that narrows behind Earth, and it has two parts.

- The **umbra**: the dark core, where all of the Sun is hidden.
- The **penumbra**: a ring around it where only part of the Sun is hidden. Stand there and you would see a Sun with a bite taken out.

Where does the umbra end? Its tip, the **apex**, follows from similar triangles. The cone's edge touches the top of the Sun (radius $R_{\text{Sun}}$) and the top of Earth (radius $R_E$), which are a distance $D_{\text{Sun}}$ apart. From Earth to the apex the radius shrinks from $R_E$ to $0$; from the Sun to Earth it shrinks from $R_{\text{Sun}}$ to $R_E$. The shrink per kilometer is the same along the whole edge, so

$$
\frac{R_E}{D_{\text{umbra}}} = \frac{R_{\text{Sun}} - R_E}{D_{\text{Sun}}} \quad\Longrightarrow\quad D_{\text{umbra}} = \frac{R_E\,D_{\text{Sun}}}{R_{\text{Sun}} - R_E} .
$$

::: example How big is Earth's umbra and penumbra?
Use $R_E = 6378.137\,\mathrm{km}$, $R_{\text{Sun}} = 696\,000\,\mathrm{km}$, $D_{\text{Sun}} = 1.495\,978\,707\times10^{8}\,\mathrm{km}$.

**Umbra length.**
$$
D_{\text{umbra}} = \frac{(6378.137)(1.495\,978\,707\times10^{8})}{696\,000 - 6378.137} = 1.3836\times10^{6}\,\mathrm{km} .
$$
That is $3.6$ times the Moon's distance. The umbra reaches well past the Moon, which is why total lunar eclipses happen.

**Umbra radius at GEO.** At a distance $x$ behind Earth the radius has shrunk in proportion: $R_E(1 - x/D_{\text{umbra}})$. At $x = 42\,164\,\mathrm{km}$:
$$
6378.137 \times \left(1 - \frac{42\,164}{1\,383\,593}\right) = 6378.137 \times 0.9695 \approx 6184\,\mathrm{km} .
$$
Only $3\%$ narrower than Earth. So the cylinder is a good approximation even out at GEO.

**Penumbra radius at GEO.** The penumbra's outer edge is the line from the *bottom* of the Sun past the *top* of Earth, which widens behind Earth. The same similar-triangle argument, with $R_{\text{Sun}} + R_E$ in place of $R_{\text{Sun}} - R_E$, puts its outer radius at $R_E(1 + x/D_p)$ with $D_p = R_E D_{\text{Sun}}/(R_{\text{Sun}} + R_E) = 1.358\times10^{6}\,\mathrm{km}$. At GEO that is about $6576\,\mathrm{km}$.

**Crossing time.** The penumbra ring at GEO is $6576 - 6184 \approx 392\,\mathrm{km}$ wide. A geostationary satellite moves at about $3.07\,\mathrm{km/s}$, so it takes about $392/3.07 \approx 128\,\mathrm{s}$ — roughly two minutes — to fade from full sunlight to full shadow.

**Sanity check.** Both cone edges tilt by only about a quarter of a degree, so at GEO distance they have moved only a few hundred kilometers from the cylinder. The cylinder is a good first model; the penumbra is a two-minute correction at each edge.
:::

Inside the penumbra the shadow factor $\nu$ slides smoothly from $1$ to $0$, following how much of the Sun's disk is covered. The cylinder model has no penumbra at all: it flips the force from full to zero in one instant. That is **[[physically wrong at the edges|cone-picture]]**, and it is numerically awkward too, because a sudden jump in the force is [[hard for an integrator|integrator-jumps]] or an estimator to handle exactly when timing matters most.

Mission design and rough propagation almost always use the cylinder. **Precision orbit determination** — fitting an orbit to tracking data well enough to see meter-level errors — uses the cone, with its smooth penumbra.

::: key Solar radiation pressure and eclipse
$$
P_{\text{SR}} \approx 4.56\times10^{-6}\,\mathrm{N/m^2}\ \text{at } 1\,\mathrm{AU}, \qquad a = P\,\frac{A}{m}\,(1 + \text{reflectivity}) = P_{\text{SR}}\,C_r\,\frac{A}{m}, \quad C_r \in [1, 2] .
$$
It points away from the Sun: $\mathbf{a}_{\text{SRP}} = -P_{\text{SR}}\,C_r\,(A/m)\,\hat{\mathbf{s}}$, with $\hat{\mathbf{s}}$ toward the Sun. It switches on and off at eclipse entry and exit, so a shadow model is needed — cylindrical (in shadow when $\mathbf{r}\cdot\hat{\mathbf{s}} < 0$ and $\lVert\mathbf{r}\times\hat{\mathbf{s}}\rVert < R_E$), or conical with a penumbra in which the force ramps — or the along-track error accumulates.
:::

::: warning An unmodelled eclipse is a small force acting for a long time
Getting the shadow edge wrong by a few seconds does not sound serious. But $\mathbf{a}_{\text{SRP}}$ switching on or off at the wrong moment is the "small steady push, applied for a long time" case from the first lesson. An error of about $10^{-7}\,\mathrm{m/s^2}$, landing the same way orbit after orbit, feeds the along-track position error, and it keeps growing instead of averaging out. That is why precision orbit determination pays for the conical model and does not settle for the cylinder's sharp, mistimed edge.
:::

## Check yourself

::: check
Why does solar radiation pressure not weaken noticeably between a $400\,\mathrm{km}$ orbit and a geostationary orbit, unlike $J_2$ and drag?
:::

::: answer
$\mathbf{a}_{\text{SRP}}$ depends on the spacecraft's distance from the *Sun*, through $P_{\text{SR}}$, not on its distance from Earth.

The gap between $400\,\mathrm{km}$ altitude and geostationary altitude is a few tens of thousands of kilometers. Next to $1\,\mathrm{AU} \approx 1.5\times10^{8}\,\mathrm{km}$ that is negligible — a change of about $0.03\%$ in distance at most. So $P_{\text{SR}}$, and with it $\mathbf{a}_{\text{SRP}}$, is essentially the same at every altitude near Earth.
:::

::: check
Two otherwise identical spacecraft differ only in their surfaces. One is matte black ($C_r \approx 1$); the other is mirror-like ($C_r \approx 2$). Which feels more solar radiation pressure, and by about what factor?
:::

::: answer
The mirrored spacecraft feels about twice the push.

A perfect absorber receives each photon's momentum once: it stops the photon. A perfect reflector has to stop the photon *and* send it back, so it receives the momentum twice, $2p$ instead of $p$. Since $a_{\text{SRP}}$ is proportional to $C_r$, going from $C_r = 1$ to $C_r = 2$ doubles the acceleration.
:::

::: check
A designer shrinks a low-orbit satellite's cross-section to cut drag. Does that also reduce its sensitivity to solar radiation pressure, and how does the benefit compare with the drag benefit?
:::

::: answer
Yes, by the same fraction. Both accelerations scale with $A/m$: halving $A$ at the same mass halves both $a_D$ and $a_{\text{SRP}}$.

The difference is where each matters. In low orbit, drag was already the main secular nudge after $J_2$, so the drag cut noticeably lengthens the satellite's life. The SRP cut shrinks an already small effect further. That helps precision orbit determination, but it is not the main reason to shrink a low-orbit satellite.
:::

::: check
Explain why geostationary satellites are eclipsed only near the equinoxes, not once per day, even though they circle Earth once per sidereal day.
:::

::: answer
Whether an orbit is eclipsed at all depends on its beta angle — the angle between the orbit plane and the direction to the Sun.

A geostationary orbit lies in the equatorial plane. The Sun is close to that plane only around the two equinoxes, when $\beta$ is near zero. At GEO the shadow only covers orbit points within about $8.7^\circ$ of the Earth–Sun line, so for most of the year the Sun is far enough above or below the equatorial plane that the satellite passes above or below the shadow on every daily pass.
:::

::: check
Why does precision orbit determination use the conical (umbra and penumbra) shadow model instead of the simpler cylinder, even though the cylinder is easier to compute?
:::

::: answer
The cylinder switches $\mathbf{a}_{\text{SRP}}$ on or off in a single instant at the shadow edge. That is physically wrong near the edge, where the Sun is only partly hidden. It is also numerically awkward: a force that jumps is hard for an integrator or estimator to handle at exactly the moments it is changing.

The conical model ramps the force smoothly through the penumbra — about two minutes at each edge for a geostationary satellite — which matches the real physics and removes the artificial jump right where timing matters most.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $P_{\text{SR}} \approx 4.56\times10^{-6}\,\mathrm{N/m^2}$ at $1\,\mathrm{AU}$ | Radiation pressure: solar flux divided by $c$ (the modern $1361\,\mathrm{W/m^2}$ gives $4.54\times10^{-6}$) |
| $a = P(A/m)(1 + \text{reflectivity})$ | SRP acceleration; $C_r = 1 + \text{reflectivity}$, from $1$ (black) to $2$ (mirror) |
| $\mathbf{a}_{\text{SRP}} = -P_{\text{SR}}C_r(A/m)\hat{\mathbf{s}}$ | Points away from the Sun; $\hat{\mathbf{s}}$ is the unit vector toward the Sun |
| About the same at every altitude near Earth | Depends on distance from the Sun, not from Earth |
| Cylindrical shadow test | In shadow when $\mathbf{r}\cdot\hat{\mathbf{s}} < 0$ and $\lVert\mathbf{r}\times\hat{\mathbf{s}}\rVert < R_E$ |
| Eclipse at $\beta = 0$ | Fraction $\arcsin(R_E/r)/\pi$: $39\%$ ($36$ min) at $400\,\mathrm{km}$; $69$ min at GEO, near equinoxes only |
| Umbra apex | $R_E D_{\text{Sun}}/(R_{\text{Sun}} - R_E) \approx 1.38\times10^{6}\,\mathrm{km}$, $3.6$ lunar distances |
| Penumbra | Force ramps instead of switching; about $2$ minutes per edge at GEO |

That completes the list of forces. The next lesson turns to *how* to add them all up in a propagator: Cowell's method, which integrates the total acceleration directly, and Encke's, which integrates only the small difference from a reference orbit.

::: context photon-momentum Momentum without mass
In everyday life momentum is mass times velocity, so something with no mass should have none. Light breaks that rule. Physics says anything carrying energy $E$ at the speed of light carries momentum $E/c$.

Because $c$ is so huge, that momentum is tiny: the sunlight falling on a football field pushes with a force of only about three hundredths of a newton. You may have seen a "light mill" — a little vane wheel in a glass bulb that spins in sunlight. It is often said to show light pressure, but it spins the wrong way for that. It is driven by warmed gas molecules, not by photons.
:::

::: context solar-constant A constant that got revised
The **solar constant** is the power of sunlight per square meter, at Earth's distance, above the atmosphere. For years the standard figure was about $1367\,\mathrm{W/m^2}$.

Better instruments on satellites in the 2000s, especially one launched on NASA's SORCE mission in 2003, showed the real value is lower, about $1361\,\mathrm{W/m^2}$. The Sun's output also varies by roughly $0.1\%$ over its eleven-year cycle. That is why you will see both $4.54$ and $4.56\times10^{-6}\,\mathrm{N/m^2}$ in books and code. For an orbit, the difference is lost in the uncertainty of $C_r$.
:::

::: context absorb-reflect Why a mirror gets twice the push
When light is absorbed, the surface only has to stop it. When light bounces straight back, the surface has to stop it and then throw it back as fast, so the change in the light's momentum is twice as big.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="140" y="25" width="12" height="80" fill="#6c7a93"/>
  <line x1="30" y1="65" x2="128" y2="65" stroke="#f2b880" stroke-width="3"/>
  <polygon points="138,65 128,59 128,71" fill="#f2b880"/>
  <text x="30" y="55" font-size="11" fill="#1f2a44">light in: p</text>
  <text x="90" y="128" font-size="12" fill="#1f2a44" text-anchor="middle">absorbed: surface gets p</text>
  <rect x="320" y="25" width="12" height="80" fill="#6c7a93"/>
  <line x1="210" y1="50" x2="308" y2="50" stroke="#f2b880" stroke-width="3"/>
  <polygon points="318,50 308,44 308,56" fill="#f2b880"/>
  <line x1="318" y1="80" x2="220" y2="80" stroke="#f2b880" stroke-width="3"/>
  <polygon points="210,80 220,74 220,86" fill="#f2b880"/>
  <text x="210" y="40" font-size="11" fill="#1f2a44">light in: p</text>
  <text x="222" y="100" font-size="11" fill="#1f2a44">light out: −p</text>
  <text x="270" y="128" font-size="12" fill="#1f2a44" text-anchor="middle">reflected: surface gets 2p</text>
</svg>
```

Light that hits a mirror at a slant bounces off at a slant, so it only reverses the part of its momentum that is square to the surface. That is one reason real SRP models care about which way each panel faces.
:::

::: context cannonball Cannonballs and box-wings
The **cannonball model** pretends the spacecraft is a sphere: same area from every direction, push always straight away from the Sun. It needs only one number, $C_r A/m$, and it is what most mission design uses.

Precision work uses a **box-wing model** instead: the body is a box with six faces, the solar arrays are flat wings, and each surface gets its own area, facing direction and optical properties. The push is added up face by face. For navigation satellites, where SRP is the biggest force that is hard to model, teams fit extra correction terms on top, estimated from tracking data.
:::

::: context solar-sail Sailing on sunlight
A **solar sail** turns SRP from a nuisance into an engine. It is a huge, very thin reflective sheet on a light spacecraft, so its $A/m$ is enormous and the push, though gentle, never runs out of fuel.

Japan's IKAROS, launched in 2010, was the first spacecraft to use a solar sail in interplanetary space, on its way past Venus. The Planetary Society's LightSail 2, launched in 2019, used sunlight to raise its orbit around Earth. By tilting the sail, a mission steers: the push is always roughly square to the sail, so it can be angled to speed up or slow down along the orbit.
:::

::: context beta-angle The beta angle
Picture the orbit as a hoop around Earth. The **beta angle** $\beta$ is how steeply the sunlight strikes that hoop: $0^\circ$ when the Sun lies in the hoop's plane, $90^\circ$ when the Sun shines straight through the hoop.

$\beta$ drifts over weeks as the orbit's node turns (the $J_2$ regression) and as Earth goes around the Sun. For a circular orbit there is no eclipse at all once $|\beta|$ exceeds $\arcsin(R_E/r)$, which is $70.2^\circ$ at $400\,\mathrm{km}$. The International Space Station, at $51.6^\circ$ inclination, can reach $\beta$ near $75^\circ$ and then spends days in continuous sunlight — which matters for its heating and its power.
:::

::: context eclipse-picture The shadow, drawn to scale
Here is the $\beta = 0$ case at $400\,\mathrm{km}$, drawn to scale, with sunlight coming from the left. The grey band is the cylinder of shadow behind Earth. The red arc is the part of the orbit inside it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
<rect x="200" y="45" width="150" height="120" fill="#6c7a93" fill-opacity="0.25"/>
<line x1="200" y1="45" x2="350" y2="45" stroke="#6c7a93" stroke-dasharray="4 3"/><line x1="200" y1="165" x2="350" y2="165" stroke="#6c7a93" stroke-dasharray="4 3"/>
<circle cx="200" cy="105" r="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
<circle cx="200" cy="105" r="63.8" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
<path d="M221.6,165.0 A63.8,63.8 0 0 0 221.6,45.0" fill="none" stroke="#b4232c" stroke-width="4"/>
<line x1="200" y1="105" x2="221.6" y2="45.0" stroke="#1f2a44" stroke-width="1"/><line x1="200" y1="105" x2="283.8" y2="105" stroke="#1f2a44" stroke-width="1" stroke-dasharray="2 2"/>
<text x="230" y="91" font-size="11" fill="#1f2a44">70.2°</text>
<text x="200" y="109" font-size="12" fill="#1f2a44" text-anchor="middle">Earth</text>
<line x1="20" y1="105" x2="100" y2="105" stroke="#f2b880" stroke-width="3"/><polygon points="110,105 100,99 100,111" fill="#f2b880"/>
<text x="20" y="95" font-size="12" fill="#1f2a44">sunlight</text>
<text x="345" y="180" font-size="11" fill="#1f2a44" text-anchor="end">shadow cylinder</text>
<text x="227.6" y="39.0" font-size="11" fill="#b4232c">in shadow</text>
<text x="180" y="202" font-size="11" fill="#6c7a93" text-anchor="middle">400 km orbit drawn to scale; red arc = 2 × 70.2° = 39% of the orbit</text>
</svg>
```

The orbit is only $6\%$ bigger than Earth, so it spends a large share of each lap tucked behind the planet: $140.4^\circ$ out of $360^\circ$.
:::

::: context geo-seasons Eclipse seasons at GEO
A geostationary satellite has two eclipse seasons a year, each lasting about six weeks and centered on an equinox. Eclipses start short, grow to about $70$ minutes a day at the equinox, then shrink again.

Those minutes decide the size of the satellite's batteries. For the rest of the year its solar panels see the Sun around the clock, but during the seasons the batteries must carry the whole satellite through the longest eclipse, every day, for years. Operators also plan around the sudden cooling and warming at each shadow crossing.
:::

::: context cone-picture Cylinder versus cone
The cylinder (red dashes) assumes sunlight arrives in parallel lines. Because the Sun is a wide disk, the real shadow has a dark core, the umbra, that narrows to a point, surrounded by a penumbra that widens.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="200,88 350,43.9 350,156.1 200,112" fill="#6c7a93" fill-opacity="0.2"/>
  <polygon points="200,88 283.5,100 200,112" fill="#1f2a44" fill-opacity="0.55"/>
  <line x1="40" y1="65" x2="350" y2="156.1" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="135" x2="350" y2="43.9" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="65" x2="283.5" y2="100" stroke="#1f2a44" stroke-width="1"/>
  <line x1="40" y1="135" x2="283.5" y2="100" stroke="#1f2a44" stroke-width="1"/>
  <line x1="200" y1="88" x2="350" y2="88" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="200" y1="112" x2="350" y2="112" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="40" cy="100" r="35" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="200" cy="100" r="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="40" y="104" font-size="12" fill="#1f2a44" text-anchor="middle">Sun</text>
  <text x="200" y="136" font-size="12" fill="#1f2a44" text-anchor="middle">Earth</text>
  <line x1="245" y1="101" x2="250" y2="140" stroke="#1f2a44" stroke-width="1"/>
  <text x="250" y="153" font-size="11" fill="#1f2a44" text-anchor="middle">umbra</text>
  <text x="320" y="36" font-size="11" fill="#1f2a44" text-anchor="middle">penumbra</text>
  <text x="320" y="172" font-size="11" fill="#1f2a44" text-anchor="middle">penumbra</text>
  <text x="345" y="128" font-size="11" fill="#b4232c" text-anchor="end">cylinder</text>
  <text x="180" y="194" font-size="11" fill="#6c7a93" text-anchor="middle">not to scale: the real cone angles are about 0.27°</text>
</svg>
```

The real cone angles are only about a quarter of a degree, so near Earth the three shapes nearly coincide. They separate only slowly with distance — by a few hundred kilometers at GEO — which is why the simple cylinder works as well as it does.
:::

::: context integrator-jumps Integrators do not like jumps
The integrators of the next lesson assume the force changes smoothly. If the SRP term jumps from full to zero partway through a step, an adaptive integrator either takes a step with the wrong force or shrinks its step again and again to chase the jump.

Good propagators handle this with **event detection**: they find the exact moment of shadow entry or exit, stop there, switch the force, and restart. Using the smooth conical model helps too.
:::
