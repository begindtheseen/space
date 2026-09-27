---
id: l01-entry-interface-conditions
title: The entry interface and the entry state
minutes: 20
covers:
  - entry interface conditions
---

Think of a relay race. One runner hands the baton to the next at a line painted on the track. Before the line, one runner is in charge. After it, a different runner is. Coming home from space works the same way. Up high, a spacecraft coasts under gravity alone, following the smooth, predictable orbit you studied in the two-body module (t2_m19). Then, over a few hundred seconds, the air takes over. Drag, heating and finally a landing decide what happens next. The painted line between those two stretches is called the **entry interface**, and the handful of numbers that describe the vehicle as it crosses that line is called the **entry state**.

Everything else in this module starts from that handoff. The Allen-Eggers solution, the entry corridor, the guidance laws, the powered landing: each one takes the entry state as its input.

Getting the entry state right matters more than it looks. A peak deceleration or a peak heating rate is not a property of the vehicle alone. It belongs to the vehicle *at a given entry speed and entry angle*. A team that defines the entry interface loosely, or mixes up two kinds of speed, will size a heat shield against the wrong number. So this lesson fixes the vocabulary every later lesson uses: what "entry interface" means in practice, which six numbers make up the entry state, why the speed that matters is speed *relative to the air*, and what real entry speeds and angles look like.

You should already know the two-body equation, orbital elements and the vis-viva equation (t2_m19), and the exponential atmosphere (t1_m18). Nothing here is new physics. It is the coordinate system the new physics will be written in.

## Why an interface at all

Walk away from a campfire and the warmth fades. There is no spot where it switches off; it keeps getting weaker. The atmosphere is like that. Its **[[density falls smoothly|no-edge]]** with height and keeps falling for hundreds of kilometers. At $400\,\mathrm{km}$, where many satellites fly, there is still a little air. It is so thin that drag takes months or years to matter instead of seconds, but it is not zero.

So there is no height where "no atmosphere" flips to "atmosphere". What there *is* is a height below which ignoring drag becomes a bad approximation on the timescale the mission cares about. Engineers pick one such height by agreement, so everybody building and testing an entry vehicle uses the same starting line.

The usual choice for Earth is **[[400,000 feet|why-400000-feet]]**:

$$
h_{\mathrm{EI}} = 400{,}000\ \mathrm{ft} \times 0.3048\ \mathrm{m/ft} = 121{,}920\ \mathrm{m} \approx 121.9\ \mathrm{km}.
$$

Here $h_{\mathrm{EI}}$ (read "h sub E-I") is the entry interface altitude. This module rounds it to $120\,\mathrm{km}$, which matches the exponential-atmosphere setup used since t1_m18. The number is not sacred. Mars entry teams commonly use $125\,\mathrm{km}$. Some Earth documents use $122\,\mathrm{km}$, or even $100\,\mathrm{km}$ — the **[[Kármán line|karman-line]]**, which was chosen for a different reason. What matters is that one altitude is fixed by agreement, so "entry velocity" and "entry flight-path angle" mean the same thing to every team on the mission.

Why $120\,\mathrm{km}$, and not $200$ or $80$? Use the exponential atmosphere from t1_m18 with sea-level density $\rho_0 = 1.225\,\mathrm{kg/m^3}$ ($\rho$ is the Greek letter "rho", used for density) and scale height $H = 7200\,\mathrm{m}$:

$$
\rho(120\ \mathrm{km}) = \rho_0\, e^{-h/H} = 1.225\, e^{-120{,}000/7200} = 7.1 \times 10^{-8}\ \mathrm{kg/m^3}.
$$

The exponent is $-120{,}000/7200 = -16.7$, and $e^{-16.7} \approx 5.8 \times 10^{-8}$. So the air there is about fifty-eight *billionths* of its sea-level density.

How hard does air that thin push? The push of oncoming air is measured by the **[[dynamic pressure|dynamic-pressure]]** $\tfrac{1}{2}\rho v^2$. At a typical entry speed of $7800\,\mathrm{m/s}$:

$$
\tfrac{1}{2} \times 7.1\times10^{-8} \times 7800^2 \approx 2\ \mathrm{Pa}.
$$

That is about the pressure of a light breeze. Nothing aerodynamically interesting has happened yet. But the vehicle is now low enough, and its path curved downward enough, that everything below will matter a great deal. So treating the flight above $120\,\mathrm{km}$ as pure two-body motion, and everything below as atmospheric entry, is a clean split you can defend. That is the whole argument. Nothing is physically special at $120\,\mathrm{km}$. The air is negligible right above it and about to become important right below it.

::: key The entry interface
A conventional, agreed-upon altitude – $120\ \mathrm{km}$ for Earth in this module ($400{,}000\ \mathrm{ft} = 121.9\ \mathrm{km}$ is the common exact figure), $125\ \mathrm{km}$ for Mars in mission documents – below which the vehicle's motion is tracked with the atmospheric equations of this module rather than the two-body equation of t2_m19. It marks a handoff in modeling, not a physical boundary; the atmosphere itself has no edge.
:::

## The entry state vector

An orbit is described by six numbers: three for position and three for velocity, or the six classical orbital elements. The entry state is also six numbers. They carry the same information, rearranged into the form an entry-guidance engineer actually uses — the way a recipe can be written by weight or by cups and still make the same cake.

- **Altitude** $h$ — height above the reference surface. At the start of entry it equals the entry interface altitude, by definition.
- **Relative speed** $v$ — speed measured against the air, which turns with the planet. The next section makes this precise.
- **Relative flight-path angle** $\gamma$ ("gamma") — the angle between the velocity (relative to the air) and the **local horizontal**, the flat plane that touches the ground directly below you. It is **[[negative while descending|flight-path-angle]]**, the sign convention from t1_m18: $\gamma < 0$ means going down.
- **Heading** $\psi$ ("psi"), also called **azimuth** — the **[[compass direction|heading-compass]]** of the horizontal part of the velocity, measured from north.
- **Latitude and longitude** — where on the planet the vehicle crosses the interface. Guidance often uses an equivalent pair instead: **downrange** (distance along the path toward a target) and **crossrange** (distance off to the side).

Why these six? Each one feeds straight into the next equation you will need. $h$ and the horizontal position say where the vehicle is. $v$ and $\gamma$ together set the entire deceleration and heating history, through the Allen-Eggers relations of the next two lessons. $\psi$ says which way downrange and crossrange point, which lessons 6 through 8 need for the entry corridor and for steering with bank angle. A state vector's job is to make the next equation easy to write, and $(h, v, \gamma, \psi, \mathrm{lat}, \mathrm{lon})$ is the form that does that for entry.

::: key The entry state
$(h, v, \gamma, \psi, \mathrm{lat}, \mathrm{lon})$: altitude, relative speed, relative flight-path angle (negative descending), heading, and horizontal position at the entry interface. Six numbers, the same count as an orbital state, chosen so the physics of this module is easy to write against them.
:::

## Relative velocity versus inertial velocity

Stand on a merry-go-round and hold out your hand. Even with no wind, you feel air rushing past, because the air is still and you are moving. Now picture the opposite: the air is spinning *with* the merry-go-round, and a ball is thrown across it. What pushes on the ball is the air's motion relative to the ball, not the ball's motion relative to the playground.

That is the situation for an entering spacecraft. The two-body equation of t2_m19 is written in an **inertial frame** — a set of axes that does not turn with the planet. The atmosphere, though, **[[co-rotates|co-rotation]]**: it turns along with the planet, like the air inside a spinning room. (Winds add a small correction on top, which we ignore here.) Drag depends on how fast the vehicle moves *through the air*. So every equation in this module — Allen-Eggers, the corridor sweep, the lifting-entry equations — uses the **relative velocity**, the velocity measured against the turning air, not the inertial velocity.

The two differ by the speed of the air itself:

$$
\mathbf{v}_{\mathrm{rel}} = \mathbf{v}_{\mathrm{inertial}} - \boldsymbol{\omega} \times \mathbf{r}.
$$

Read it as "v-rel equals v-inertial minus omega cross r". Here $\boldsymbol{\omega}$ ("omega") is the planet's rotation vector, pointing along its spin axis, and $\mathbf{r}$ is the vehicle's position measured from the planet's center. The **[[cross product|cross-product]]** $\boldsymbol{\omega} \times \mathbf{r}$ is the velocity of the air at that spot as it is carried around by the spinning planet.

How big is it? At the equator the air moves at $\omega r$. At Earth's entry interface, $r \approx 6498\,\mathrm{km}$ (Earth's equatorial radius $6378\,\mathrm{km}$ plus $120\,\mathrm{km}$), and Earth turns at $\omega_\oplus = 7.2921 \times 10^{-5}\,\mathrm{rad/s}$ (the symbol $\oplus$ means "Earth"). So

$$
\omega_\oplus\, r = 7.2921 \times 10^{-5} \times 6.498 \times 10^{6} = 473.9\ \mathrm{m/s}.
$$

That is not a small correction. On a $7800\,\mathrm{m/s}$ entry, it changes the relative speed by about six percent, depending on which way the vehicle is heading:

- A **prograde** equatorial entry moves east, *with* the rotation. The air is moving the same way, so the vehicle overtakes it more slowly: about $7800 - 474 = 7326\,\mathrm{m/s}$.
- A **retrograde** equatorial entry moves west, *against* the rotation. The air comes at it head-on: about $7800 + 474 = 8274\,\mathrm{m/s}$.

Peak deceleration and peak heating both grow with $v^2$ or faster (the next two lessons show exactly how). So a six-percent change in speed becomes roughly a twelve-percent change in peak load, between two entries an orbital-elements summary might call "the same speed".

A **polar** entry — one crossing the equator while heading north or south — sees a much smaller effect on speed. There the air's motion (east) is nearly at right angles to the vehicle's motion. Adding a sideways $474\,\mathrm{m/s}$ to a $7800\,\mathrm{m/s}$ velocity mostly tilts it; the size only grows from $7800$ to $\sqrt{7800^2 + 474^2} \approx 7814\,\mathrm{m/s}$.

Guidance still needs the inertial frame for one job. The landing target sits on the rotating planet. Predicting where the vehicle will be relative to that target is easiest done in one of two ways: propagate the position in the inertial frame and convert only at the end, or work in a planet-fixed rotating frame the whole way and add the **fictitious forces** (the apparent pushes that show up in any turning frame) that come with it. Different phases of this module pick whichever is handier. What never changes is that the *aerodynamic* equations — drag, lift, heating — always use relative velocity, because that is the velocity the air actually feels.

::: warning Relative speed is not inertial speed
When a mission document quotes an "entry velocity", check which one it means. A deorbit burn is sized in the inertial frame (or nearly inertial — drag in low orbit is a slow effect). The peak deceleration and heating rate that follow depend on the *relative* speed. For a fast-spinning planet or a near-equatorial entry, the two differ by a few percent of speed and roughly twice that fraction of peak g. A heat-shield margin cannot quietly absorb that.
:::

## How fast: entry speeds across this module's missions

Three kinds of entry speed come back again and again in this module. It helps to pin down their numbers now.

**A low Earth orbit deorbit** enters close to the local circular speed. At $400\,\mathrm{km}$ altitude, with Earth's gravitational parameter $\mu = 398{,}600.4418\,\mathrm{km^3/s^2}$ and $r = 6378.137 + 400 = 6778.137\,\mathrm{km}$:

$$
v_c = \sqrt{\frac{\mu}{r}} = \sqrt{\frac{398{,}600.4418}{6778.137}} = 7.669\ \mathrm{km/s}.
$$

The deorbit burn lowers the low point of the orbit into the atmosphere. The vehicle then falls a little on its way down to $120\,\mathrm{km}$ and picks up a bit of speed, so it arrives at about $7.8\,\mathrm{km/s}$. This module uses $7800\,\mathrm{m/s}$ as the standard LEO-return entry speed.

**A lunar or high-energy return** enters much faster, because the vehicle has been falling from much farther away. The first example below works this out with the vis-viva equation.

**A Mars arrival** enters at a speed set by its interplanetary approach relative to Mars, typically several kilometers per second. Lesson 13 works that out with Mars's own constants. Nothing from that calculation is used here.

::: example Lunar-return entry speed, from vis-viva
A capsule coming home from the Moon is, right before entry, on a very stretched Earth orbit. Its far point (apogee) is near the Moon's distance. Its near point (perigee) has been aimed at the entry interface.

**Set up the radii.** Take the apogee radius as the Moon's mean distance, $r_a = 384{,}400\,\mathrm{km}$. The perigee radius is Earth's radius plus the interface altitude:

$$
r_p = R_\oplus + h_{\mathrm{EI}} = 6378.137 + 120 = 6498.137\ \mathrm{km}.
$$

**Find the semi-major axis**, half the long axis of the ellipse, which is the average of the two radii:

$$
a = \frac{r_a + r_p}{2} = \frac{384{,}400 + 6498.137}{2} = 195{,}449.07\ \mathrm{km}.
$$

**Apply [[vis-viva|vis-viva-reminder]]** at perigee:

$$
v_p = \sqrt{\mu\left(\frac{2}{r_p} - \frac{1}{a}\right)}
= \sqrt{398{,}600.4418\left(\frac{2}{6498.137} - \frac{1}{195{,}449.07}\right)}
= 10.984\ \mathrm{km/s}.
$$

This module rounds that to $11.0\,\mathrm{km/s}$ for later examples.

**Sanity check.** It should be a bit below the escape speed at the same radius, because the capsule is bound to Earth but only barely. Escape speed there is $\sqrt{2\mu/r_p} = 11.08\,\mathrm{km/s}$. Our $10.98\,\mathrm{km/s}$ sits slightly under it, as it should.

**Compare with LEO.** The speed ratio is $10.984/7.8 = 1.41$. Peak deceleration in a ballistic entry grows as $v^2$ (lesson 2 derives this), so for the same entry angle the peak loads differ by about $1.41^2 \approx 2$.

One more point. The entry interface radius, not Earth's surface radius, belongs in $r_p$. With $r_p = R_\oplus$ the capsule would already have hit the ground, and vis-viva would be describing an orbit that does not exist.
:::

::: example Relative-velocity correction at two headings
A vehicle crosses the $120\,\mathrm{km}$ interface over the equator with inertial speed $7800\,\mathrm{m/s}$. Compare heading due east (prograde) with heading due west (retrograde).

**Speed of the air.** At $r = 6498.137\,\mathrm{km}$,

$$
\omega_\oplus r = 7.2921 \times 10^{-5} \times 6{,}498{,}137 = 473.9\ \mathrm{m/s}, \text{ pointing east.}
$$

**Subtract.** The air's velocity is horizontal and eastward. In this example the vehicle's velocity also lies along the east–west line, so the two subtract directly as signed numbers (east positive):

$$
v_{\mathrm{rel,\,prograde}} = 7800 - 473.9 = 7326.1\ \mathrm{m/s}, \qquad
v_{\mathrm{rel,\,retrograde}} = 7800 + 473.9 = 8273.9\ \mathrm{m/s}.
$$

**Compare.** $8273.9/7326.1 = 1.129$. The retrograde entry is $12.9$ percent faster in the frame that actually sets the aerodynamics — from a heading choice alone, before anything else about the trajectory has changed.

**Sanity check.** Both answers differ from $7800$ by the same $474\,\mathrm{m/s}$, one up and one down, as they must. A polar entry at the same inertial speed would see almost none of this shift, because there the air's motion is nearly at right angles to the vehicle's. This is one reason **[[launch and return directions|launch-azimuth]]** are not arbitrary.
:::

## Check yourself

::: check
Why does this lesson call $120\ \mathrm{km}$ a modeling convention rather than a physical boundary of the atmosphere?
:::

::: answer
The atmosphere's density falls smoothly and continuously with height. There is no altitude where it becomes exactly zero, only altitudes where it becomes small enough to ignore for a given purpose.

At $120\ \mathrm{km}$, density is about $7.1 \times 10^{-8}\ \mathrm{kg/m^3}$ (about fifty-eight billionths of sea level). At a typical entry speed that gives a dynamic pressure of about $2\ \mathrm{Pa}$ — negligible in practice. That is why this height is a reasonable place to switch from two-body to atmospheric modeling.

Other missions choose other heights: Mars entry documents commonly use $125\ \mathrm{km}$, and the Kármán line at $100\ \mathrm{km}$ is chosen for a completely different reason. That only makes sense if the altitude is an agreement, not a physical edge.
:::

::: check
List the six parts of the entry state vector and say, in one phrase each, what each one feeds into later in this module.
:::

::: answer
- Altitude $h$: the starting point for the trajectory and the atmosphere model.
- Relative speed $v$ and relative flight-path angle $\gamma$: together they set the entire deceleration and heating history through Allen-Eggers.
- Heading $\psi$: the reference direction for downrange and crossrange, needed for bank-angle steering.
- Latitude and longitude: where on the planet entry begins, needed to aim at a landing site.
:::

::: check
A LEO deorbit at $7800\ \mathrm{m/s}$ and a lunar-return entry at $11{,}000\ \mathrm{m/s}$ arrive at the same flight-path angle. Roughly how many times higher is the lunar-return entry's peak deceleration, given that peak deceleration in a ballistic entry scales as $v^2$?
:::

::: answer
Divide the speeds and square: $(11{,}000/7800)^2 = 1.41^2 = 1.99$. That is essentially double.

Lesson 2 works this out exactly with the Allen-Eggers formula. But the scaling alone — peak load goes as the square of entry speed — already tells you a lunar-return capsule needs structural and thermal margins roughly twice a LEO capsule's, purely because it falls from so much higher.
:::

::: check
Why do the aerodynamic equations in this module always use relative velocity rather than inertial velocity, even though guidance sometimes needs the inertial frame too?
:::

::: answer
Drag and lift are forces the air exerts on the vehicle, and the air turns with the planet (ignoring winds). What matters for those forces is the vehicle's velocity *relative to that moving air*.

A quick test: a vehicle sitting still on the ground still has an inertial velocity — the planet's rotation speed at that spot — yet it feels no drag at all. So inertial velocity cannot be what drag responds to.

Guidance separately needs the inertial frame (or a rotating frame with its fictitious forces) to predict where the vehicle will end up relative to a landing target that is fixed on the spinning planet. That is a targeting calculation, not an aerodynamic one.
:::

::: check
A mission planner says two entries "have the same entry velocity, $7800\ \mathrm{m/s}$", because their inertial speeds at the interface match. One is prograde and one is retrograde, both at the equator. Explain why their peak decelerations can still be quite different.
:::

::: answer
The aerodynamics respond to the relative velocity, which differs from the inertial velocity by the air's own motion, $\boldsymbol{\omega} \times \mathbf{r}$ — about $474\ \mathrm{m/s}$ at Earth's entry interface.

The prograde entry has relative speed $7800 - 474 = 7326\ \mathrm{m/s}$. The retrograde one has $7800 + 474 = 8274\ \mathrm{m/s}$. That is a $12.9$ percent difference in the speed that actually drives drag and heating, even though the inertial speeds match exactly.

Peak deceleration scales as $v^2$, so square the ratio: $1.129^2 = 1.275$. That alone is roughly a $27$ percent difference in peak load.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $h_{\mathrm{EI}}$ | Entry interface altitude; $120\ \mathrm{km}$ in this module ($400{,}000\ \mathrm{ft} = 121.9\ \mathrm{km}$ is the common exact figure), a modeling convention, not a physical edge |
| $\rho(120\ \mathrm{km})$ | $7.1 \times 10^{-8}\ \mathrm{kg/m^3}$, about fifty-eight billionths of sea level — negligible in practice |
| Entry state | $(h, v, \gamma, \psi, \mathrm{lat}, \mathrm{lon})$: altitude, relative speed, relative flight-path angle (negative descending), heading, horizontal position |
| $\mathbf{v}_{\mathrm{rel}} = \mathbf{v}_{\mathrm{inertial}} - \boldsymbol{\omega} \times \mathbf{r}$ | Relative velocity is what drag and lift respond to; it differs from inertial velocity by the air's co-rotation |
| $\omega_\oplus r$ at EI | $473.9\ \mathrm{m/s}$ at Earth's equator — a several-percent correction to a typical entry speed |
| LEO-return entry speed | $\approx 7800\ \mathrm{m/s}$, near local circular speed |
| Lunar-return entry speed | $10.98\ \mathrm{km/s}$ from vis-viva with $r_a = 384{,}400\ \mathrm{km}$, $r_p = 6498.137\ \mathrm{km}$; rounded to $11.0\ \mathrm{km/s}$ |

The next lesson takes this entry state — specifically $v$ and $\gamma$ at the interface — and derives the first and most famous closed-form result in entry mechanics: the Allen-Eggers ballistic entry solution, which turns those two numbers into a full velocity history through the atmosphere.

::: context no-edge A straight line on a log scale
Plot air density against height with a logarithmic vertical axis — each grid line ten times smaller than the one above — and the exponential atmosphere becomes a straight, falling line. It never reaches zero; it only keeps dropping by a factor of ten about every $16.6\,\mathrm{km}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="20" x2="50" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 3">
    <line x1="50" y1="36.7" x2="340" y2="36.7"/><line x1="50" y1="70" x2="340" y2="70"/>
    <line x1="50" y1="103.3" x2="340" y2="103.3"/><line x1="50" y1="136.7" x2="340" y2="136.7"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="40.7">1</text><text x="45" y="74">10⁻²</text><text x="45" y="107.3">10⁻⁴</text>
    <text x="45" y="140.7">10⁻⁶</text><text x="45" y="174">10⁻⁸</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="186">0</text><text x="143.3" y="186">40</text><text x="236.7" y="186">80</text><text x="330" y="186">120 km</text>
  </g>
  <line x1="50" y1="35.2" x2="330" y2="155.8" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="330" cy="155.8" r="5" fill="#b4232c"/>
  <text x="300" y="163" font-size="11" text-anchor="end" fill="#b4232c">at 120 km: 7.1×10⁻⁸</text>
  <text x="60" y="16" font-size="11" fill="#1f2a44">density, kg/m³ (log scale)</text>
</svg>
```
:::

::: context why-400000-feet Why a round number in feet
The $400{,}000$-foot figure comes from American human spaceflight, which was engineered in feet and pounds. Apollo and the Space Shuttle both defined their entry interface at $400{,}000\,\mathrm{ft}$, and the habit stuck in the documents that followed. In meters it is the unround $121.92\,\mathrm{km}$, which is why metric-first teams often write $120$ or $122\,\mathrm{km}$ instead. Any of them works, as long as the whole team uses the same one.
:::

::: context karman-line The other famous line: 100 km
The Kármán line, at $100\,\mathrm{km}$, is often called "the edge of space". It is named after the aerospace engineer Theodore von Kármán, who reasoned about the height where an airplane would have to fly so fast to get enough lift from the thin air that it would be nearly at orbital speed — where flying by wings gives way to flying by orbit. It answers "where does space begin?", which is a different question from "where should entry modeling begin?". Some organizations use other figures; the US Air Force and NASA have awarded astronaut wings for flights above 50 miles (about $80\,\mathrm{km}$).
:::

::: context dynamic-pressure How hard the air pushes
Dynamic pressure, written $q = \tfrac{1}{2}\rho v^2$, is the pressure you would feel if you brought the oncoming air to a stop against your palm. It is the same thing you feel holding your hand out of a car window: double the speed and the push is four times as strong. Multiply it by an area and a drag coefficient and you get the drag force. One pascal is one newton on a square meter — about the weight of a small apple (100 grams) spread over a whole square meter — so $2\,\mathrm{Pa}$ is almost nothing.
:::

::: context flight-path-angle Picturing the flight-path angle
Stand at the vehicle and draw the flat horizon plane beneath it. The flight-path angle is how far the velocity arrow tips below (or above) that plane. Real entries are shallow, a few degrees; the picture exaggerates it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="70" y1="60" x2="340" y2="60" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="340" y="50" font-size="12" text-anchor="end" fill="#6c7a93">local horizontal</text>
  <line x1="70" y1="60" x2="276.6" y2="135.2" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="286.1,138.7 273.1,139.3 276.6,129.9" fill="#1d6fd1"/>
  <text x="250" y="160" font-size="12" text-anchor="middle" fill="#1d6fd1">velocity relative to the air</text>
  <path d="M140,60 A70,70 0 0,1 135.8,83.9" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="150" y="80" font-size="13" fill="#b4232c">γ &lt; 0</text>
  <circle cx="70" cy="60" r="6" fill="#1f2a44"/>
  <text x="70" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">vehicle</text>
</svg>
```

Below the horizon means going down, so $\gamma$ is negative. At $\gamma = -90^\circ$ the vehicle falls straight down.
:::

::: context heading-compass Heading, like a compass bearing
Heading is measured the way a hiker reads a compass: start at north and turn clockwise. North is $0^\circ$, east is $90^\circ$, south is $180^\circ$ and west is $270^\circ$. It only describes the flat, sideways part of the motion; the up-and-down part is already in $\gamma$. A capsule returning from the International Space Station, whose orbit is tilted $51.6^\circ$ to the equator, enters heading somewhere between northeast and southeast, depending on where along the orbit it comes down.
:::

::: context co-rotation The air spins with the Earth
Seen from above the North Pole, Earth turns counterclockwise, and it drags its atmosphere along. At the entry interface over the equator the air is moving east at about $474\,\mathrm{m/s}$, even on a calm day.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <circle cx="95" cy="105" r="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="95" y="102" font-size="12" text-anchor="middle" fill="#1f2a44">North Pole</text>
  <text x="95" y="117" font-size="11" text-anchor="middle" fill="#1f2a44">(seen from above)</text>
  <path d="M21.4,62.5 A85,85 0 0,0 21.4,147.5" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="23.4,151.0 13.1,143.1 21.7,138.1" fill="#1f2a44"/>
  <line x1="165" y1="105" x2="165" y2="68" stroke="#b4232c" stroke-width="3"/>
  <polygon points="165,60 160,72 170,72" fill="#b4232c"/>
  <circle cx="165" cy="105" r="4" fill="#1f2a44"/>
  <text x="180" y="72" font-size="12" fill="#b4232c">air: 474 m/s east</text>
  <text x="185" y="125" font-size="12" fill="#1f2a44">heading east (prograde):</text>
  <text x="185" y="141" font-size="12" fill="#1d6fd1">7800 − 474 = 7326 m/s</text>
  <text x="185" y="167" font-size="12" fill="#1f2a44">heading west (retrograde):</text>
  <text x="185" y="183" font-size="12" fill="#b4232c">7800 + 474 = 8274 m/s</text>
</svg>
```

Running with the air lowers the speed you have through it; running against it raises it.
:::

::: context cross-product What the cross product is doing here
The cross product $\boldsymbol{\omega} \times \mathbf{r}$ turns "how fast the planet spins" and "where you are" into "how fast the ground (and air) under you is moving, and which way". Its direction is always east. Its size is $\omega r \cos(\text{latitude})$: largest at the equator, shrinking to zero at the poles, where the ground only turns in place. At the latitude of Cape Canaveral, $28.5^\circ$, Earth's surface moves east at about $409\,\mathrm{m/s}$ instead of the equator's $465\,\mathrm{m/s}$.
:::

::: context vis-viva-reminder Vis-viva in one line
Vis-viva is energy bookkeeping for an orbit. Kinetic energy per kilogram, $\tfrac{1}{2}v^2$, plus gravitational potential energy per kilogram, $-\mu/r$, stays the same all the way around, and that total equals $-\mu/(2a)$. Solve for $v$ and you get $v^2 = \mu(2/r - 1/a)$. The farther down the gravity well the capsule falls (smaller $r$), the faster it goes. A capsule falling from the Moon's distance arrives far faster than one that starts at $400\,\mathrm{km}$, because it has fallen so much farther.
:::

::: context launch-azimuth Why rockets launch east
Earth's spin is free speed. A rocket launched due east from Cape Canaveral starts with about $409\,\mathrm{m/s}$ of eastward velocity before its engines even light, which is why almost every launch site sends rockets east and why the Cape sits on an east-facing coast (spent stages fall into the ocean). Coming home, the same spin works in reverse: a prograde return meets the air at a lower relative speed and has a gentler entry. Where a mission launches and where it plans to land are chosen together.
:::
