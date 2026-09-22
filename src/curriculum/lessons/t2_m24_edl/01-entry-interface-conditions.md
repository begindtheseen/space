---
id: l01-entry-interface-conditions
title: The entry interface and the entry state
minutes: 18
covers:
  - entry interface conditions
---

Every lesson in this module starts from the same handoff. A spacecraft finishes its orbital or interplanetary phase governed by the two-body equation of t2_m19: a smooth, predictable, six-number state evolving under gravity alone. Then, over a few hundred seconds, the atmosphere takes over, and the vehicle's fate is decided by a completely different physics – drag, heating, and eventually a controlled or uncontrolled touchdown. The boundary between these two regimes is the entry interface, and the six numbers that describe the vehicle as it crosses that boundary are the entry state. Everything else in this module – the Allen-Eggers solution, the corridor, the guidance laws, the powered landing – is a function of that state.

Getting the entry state right matters more than it might seem. A peak deceleration or a peak heat rate is not a property of a vehicle in isolation; it is a property of a vehicle at a given entry speed and entry angle. A guidance team that mis-defines the entry interface, or confuses relative speed with inertial speed, will size a heat shield or a structural limit against the wrong number. This lesson fixes the vocabulary and the frame conventions that every later lesson uses without re-deriving them: what "entry interface" means operationally, what the entry state vector contains, why relative velocity and inertial velocity differ, and what realistic entry speeds and angles look like for the missions this module keeps returning to.

The reader is assumed to know the two-body equation, orbital elements, and the vis-viva equation from t2_m19, and the exponential atmosphere from t1_m18. Nothing here is new physics; it is the coordinate system the new physics will be written in.

## Why an interface at all

The atmosphere has no edge. Density falls off smoothly and keeps falling for hundreds of kilometres – by 400 km, where many satellites orbit, it is still nonzero, small enough only that drag takes months or years to matter rather than seconds. There is no altitude at which "no atmosphere" flips to "atmosphere." What there is, is an altitude below which the two-body model's silence about drag becomes a bad approximation on the timescale the mission cares about – and that altitude is a convention, chosen so that everyone building and testing an entry vehicle uses the same starting line.

The convention this module uses, and the one most entry documentation uses for Earth, is $400{,}000$ feet:

$$
h_{\mathrm{EI}} = 400{,}000\ \mathrm{ft} \times 0.3048\ \mathrm{m/ft} = 121{,}920\ \mathrm{m} \approx 121.9\ \mathrm{km}.
$$

This module rounds that to $120\ \mathrm{km}$, matching the exponential-atmosphere convention already in use since t1_m18. The number is not sacred – Mars entry teams commonly use $125\ \mathrm{km}$, and some Earth documents use $122$ or even $100\ \mathrm{km}$ (the Kármán line, chosen for a different reason: it is roughly where a wing would need orbital speed to generate enough lift to fly). What matters is that a single altitude is fixed by agreement, so that "entry velocity" and "entry flight-path angle" mean the same thing to every team working the same mission.

Why $120\ \mathrm{km}$ specifically, and not $200$ or $80$? At $120\ \mathrm{km}$ the exponential atmosphere from t1_m18 gives

$$
\rho(120\ \mathrm{km}) = \rho_0\, e^{-h/H} = 1.225\, e^{-120{,}000/7200} = 7.1 \times 10^{-8}\ \mathrm{kg/m^3},
$$

fifty-eight millionths of sea-level density. At a typical entry speed of $7800\ \mathrm{m/s}$ that is a dynamic pressure of about $2\ \mathrm{Pa}$ – roughly the pressure of a light breeze, spread over a whole vehicle. Nothing aerodynamically interesting has happened yet. But it is low enough, and the trajectory curved enough, that treating everything above it as pure two-body motion and everything below it as atmospheric entry is a clean, defensible split. That is the whole justification: not that $120\ \mathrm{km}$ is physically special, but that it is functionally negligible on one side and about to become significant on the other.

::: key The entry interface
A conventional, agreed-upon altitude – $120\ \mathrm{km}$ for Earth in this module ($400{,}000\ \mathrm{ft} = 121.9\ \mathrm{km}$ is the common exact figure), $125\ \mathrm{km}$ for Mars in mission documents – below which the vehicle's motion is tracked with the atmospheric equations of this module rather than the two-body equation of t2_m19. It marks a handoff in modelling, not a physical boundary; the atmosphere itself has no edge.
:::

## The entry state vector

A spacecraft's orbital state is six numbers: three of position, three of velocity, or equivalently the six classical elements. The entry state is also six numbers, chosen for what an entry-guidance engineer actually needs rather than for orbital elegance:

- **Altitude** $h$ above the reference surface (the EI altitude, by definition, at the start of entry).
- **Relative velocity magnitude** $v$ – speed relative to the atmosphere, which co-rotates with the planet (defined precisely below).
- **Relative flight-path angle** $\gamma$ – the angle between the relative-velocity vector and the local horizontal plane, negative while descending. This module follows the sign convention already used in t1_m18: $\gamma < 0$ means going down.
- **Heading (azimuth)** $\psi$ – the compass direction of the horizontal component of relative velocity, measured from local north.
- **Latitude and longitude** (or, equivalently, a downrange/crossrange pair measured from a target) – where on the planet the vehicle crosses the interface.

Six numbers, exactly as many as an orbital state, because they carry the same information in a more convenient form for what comes next: $h$ and the horizontal position feed straight into where the vehicle is; $v$ and $\gamma$ set the entire deceleration and heating history through the Allen-Eggers relations of the next two lessons; $\psi$ sets where downrange and crossrange point, which lessons 5 through 7 use to define the entry corridor and its bank-angle control. A state vector's job is to make the next equation easy to write, and $(h, v, \gamma, \psi, \mathrm{lat}, \mathrm{lon})$ is the form that does that for entry.

::: key The entry state
$(h, v, \gamma, \psi, \mathrm{lat}, \mathrm{lon})$: altitude, relative speed, relative flight-path angle (negative descending), heading, and horizontal position at the entry interface. Six numbers, the same count as an orbital state, chosen so the physics of this module is easy to write against them.
:::

## Relative velocity versus inertial velocity

The two-body equation of t2_m19 is written in an inertial frame – one that does not rotate with the planet. The atmosphere, by contrast, co-rotates with the planet (ignoring winds, which are a small correction on top of this). Drag depends on velocity relative to the air the vehicle is moving through, so every equation in this module – Allen-Eggers, the corridor sweep, the lifting-entry equations – uses **relative velocity**, not inertial velocity. The two differ by the planet's rotation:

$$
\mathbf{v}_{\mathrm{rel}} = \mathbf{v}_{\mathrm{inertial}} - \boldsymbol{\omega} \times \mathbf{r},
$$

where $\boldsymbol{\omega}$ is the planet's rotation vector and $\mathbf{r}$ is the vehicle's position from the centre. At Earth's entry interface, $r \approx 6498\ \mathrm{km}$ and $\omega_\oplus = 7.2921 \times 10^{-5}\ \mathrm{rad/s}$, so the co-rotation speed at the equator is

$$
\omega_\oplus\, r = 7.2921 \times 10^{-5} \times 6.498 \times 10^{6} = 473.9\ \mathrm{m/s}.
$$

That is not a small correction. On a $7800\ \mathrm{m/s}$ entry it shifts the relative speed by about six percent depending on heading – a prograde equatorial entry (moving east, with the rotation) has a relative speed near $7800 - 474 = 7326\ \mathrm{m/s}$, while a retrograde equatorial entry (moving west, against the rotation) has relative speed near $7800 + 474 = 8274\ \mathrm{m/s}$. Since peak deceleration and peak heating both scale with $v^2$ or worse (the next two lessons derive exactly how), a six-percent speed difference is not cosmetic: it is roughly a twelve-percent difference in peak load between two entries that an orbital-elements summary might call "the same speed." A polar entry sees a different, smaller effect, because the co-rotation velocity there is closer to perpendicular to the inertial velocity rather than parallel to it, so the vector sum changes the magnitude much less.

Guidance also needs the *inertial* frame for one purpose: the landing target is fixed on the rotating planet, and predicting where the vehicle will be relative to that target at touchdown is easiest done by propagating position in an inertial frame and converting only at the end, or by working throughout in a planet-fixed rotating frame and adding the fictitious forces that come with it. Different phases of this module pick whichever is more convenient; what never changes is that the *aerodynamic* equations – drag, lift, heating – always use relative velocity, because that is the velocity the air actually sees.

::: warning Relative speed is not inertial speed
When a mission document quotes an "entry velocity," check which one it means. A deorbit burn is sized in the inertial (or near-inertial, since LEO drag is a slow perturbation) frame; the peak deceleration and heat rate that follow are functions of the *relative* speed. For a fast-rotating planet or a near-equatorial entry the difference is a few percent of speed and roughly twice that fraction of peak g, which is not something a heat-shield margin can absorb silently.
:::

## How fast: entry speeds across this module's missions

Three entry-speed regimes recur throughout this module, and it is worth fixing their numbers now so later lessons can use them directly.

A **low Earth orbit deorbit** enters close to local circular speed. At $400\ \mathrm{km}$ altitude, $v_c = \sqrt{\mu/r} = \sqrt{398{,}600.4418 / 6778.137} = 7.669\ \mathrm{km/s}$; after the deorbit burn lowers perigee into the atmosphere, the vehicle reaches the $120\ \mathrm{km}$ interface still near this speed, typically quoted as about $7.8\ \mathrm{km/s}$ once the small speed gain from the remaining fall is included. This module uses $7800\ \mathrm{m/s}$ as the representative LEO-return entry speed.

A **lunar or high-energy return** enters much faster, because the vehicle is falling from far higher up. The next example derives this from the vis-viva equation you already know.

A **Mars arrival** enters at a speed set by the interplanetary approach trajectory relative to Mars, typically several kilometres per second; lesson 13 works this out with Mars's own constants; nothing from that calculation is used here.

::: example Lunar-return entry speed, from vis-viva
A capsule returning from the Moon is, immediately before entry, on a highly elliptical Earth orbit whose apogee is near the Moon's distance and whose perigee has been targeted to the entry interface. Take apogee radius $r_a = 384{,}400\ \mathrm{km}$ (the Moon's mean distance) and perigee radius $r_p = R_\oplus + h_{\mathrm{EI}} = 6378.137 + 120 = 6498.137\ \mathrm{km}$. The semi-major axis is

$$
a = \frac{r_a + r_p}{2} = \frac{384{,}400 + 6498.137}{2} = 195{,}449.07\ \mathrm{km},
$$

and vis-viva gives the speed at perigee:

$$
v_p = \sqrt{\mu\left(\frac{2}{r_p} - \frac{1}{a}\right)}
= \sqrt{398{,}600.4418\left(\frac{2}{6498.137} - \frac{1}{195{,}449.07}\right)}
= 10.984\ \mathrm{km/s}.
$$

This module rounds that to $11.0\ \mathrm{km/s}$ for later worked examples. Compare it to the LEO entry speed of $7.8\ \mathrm{km/s}$: the ratio of speeds is $1.41$, but because peak deceleration in a ballistic entry scales as $v^2$ (lesson 3 derives this), the ratio of peak loads for the same entry angle is closer to $2$. This is also why the entry interface radius, not the Earth's surface radius, belongs in $r_p$: at $r_p = R_\oplus$ the capsule would already have hit the ground, and vis-viva would be describing an orbit that does not exist.
:::

::: example Relative-velocity correction at two headings
A vehicle crosses the $120\ \mathrm{km}$ interface at the equator with inertial speed $7800\ \mathrm{m/s}$, once heading due east (prograde) and once due west (retrograde). The co-rotation speed at $r = 6498.137\ \mathrm{km}$ is $\omega_\oplus r = 7.2921 \times 10^{-5} \times 6{,}498{,}137 = 473.9\ \mathrm{m/s}$. Because the co-rotation velocity is horizontal and eastward, and the entry velocity here is also horizontal and along the direction of travel, the two subtract directly:

$$
v_{\mathrm{rel,\,prograde}} = 7800 - 473.9 = 7326.1\ \mathrm{m/s}, \qquad
v_{\mathrm{rel,\,retrograde}} = 7800 + 473.9 = 8273.9\ \mathrm{m/s}.
$$

The retrograde entry is $8273.9/7326.1 = 1.129$ times faster in the frame that actually sets the aerodynamics – a $12.9\ \mathrm{percent}$ speed difference from a heading choice alone, before anything about the trajectory itself has changed. A polar entry at the same inertial speed sees almost none of this shift, because the co-rotation vector there is nearly perpendicular to the velocity rather than aligned with it, so it barely changes the vector's magnitude. This is one reason launch and return azimuths are not arbitrary.
:::

## Check yourself

::: check
Why is $120\ \mathrm{km}$ described in this lesson as a modelling convention rather than a physical boundary of the atmosphere?
:::

::: answer
The atmosphere's density falls off smoothly and continuously with altitude; there is no altitude at which it becomes exactly zero, only altitudes at which it becomes small enough to ignore for a given purpose. At $120\ \mathrm{km}$, density is about $7.1 \times 10^{-8}\ \mathrm{kg/m^3}$ (fifty-eight millionths of sea level), giving a dynamic pressure of order $2\ \mathrm{Pa}$ at a typical entry speed – functionally negligible, which is why this altitude is a reasonable place to switch from two-body to atmospheric modelling. Other missions and purposes choose other altitudes (Mars entry documents commonly use $125\ \mathrm{km}$; the Kármán line at $100\ \mathrm{km}$ is chosen for a different reason entirely), which only makes sense if the altitude is a convention rather than a physical edge.
:::

::: check
List the six components of the entry state vector and say, in one phrase each, what each one feeds into later in this module.
:::

::: answer
Altitude $h$ (starting point for the trajectory and the atmosphere model), relative speed $v$ and relative flight-path angle $\gamma$ (together set the entire deceleration and heating history through Allen-Eggers), heading $\psi$ (sets the reference direction for downrange and crossrange, needed for bank-angle steering), and latitude/longitude (fix where on the planet entry begins, needed to target a landing site).
:::

::: check
A LEO deorbit at $7800\ \mathrm{m/s}$ and a lunar-return entry at $11{,}000\ \mathrm{m/s}$ arrive at the same flight-path angle. Roughly how many times higher is the lunar-return entry's peak deceleration, given that peak deceleration in a ballistic entry scales as $v^2$?
:::

::: answer
$(11{,}000/7800)^2 = 1.99$, essentially double. This is worked out precisely with the Allen-Eggers formula in lesson 3, but the scaling alone – peak load goes as the square of entry speed – already tells you that a lunar-return capsule needs a structural and thermal margin roughly twice a LEO capsule's, purely from the extra energy of a return from deep in Earth's gravity well.
:::

::: check
Why do the aerodynamic equations in this module always use relative velocity rather than inertial velocity, even though guidance sometimes needs the inertial frame too?
:::

::: answer
Drag and lift are forces exerted by the air on the vehicle, and the air co-rotates with the planet (ignoring winds). What matters aerodynamically is the vehicle's velocity relative to that moving air, not its velocity relative to a fixed inertial frame – a vehicle sitting still relative to the ground still has an inertial velocity equal to the planet's rotation speed at that point, but it feels no drag. Guidance separately needs the inertial frame (or an equivalent rotating-frame treatment) to predict where the vehicle will be relative to a landing target fixed on the rotating planet, but that is a targeting calculation, not an aerodynamic one.
:::

::: check
A mission planner claims two entries "have the same entry velocity, $7800\ \mathrm{m/s}$" because their inertial speeds at the interface match, one prograde and one retrograde at the equator. Explain why this claim can still leave their peak deceleration meaningfully different.
:::

::: answer
"Entry velocity" in the inertial frame is not the velocity the aerodynamics respond to; the relative velocity is, and it differs from the inertial velocity by the co-rotation vector $\boldsymbol{\omega} \times \mathbf{r}$, which is about $474\ \mathrm{m/s}$ at Earth's entry interface. A prograde equatorial entry has relative speed $7800 - 474 = 7326\ \mathrm{m/s}$; a retrograde one has $7800 + 474 = 8274\ \mathrm{m/s}$ – a $12.9\ \mathrm{percent}$ difference in the speed that actually drives drag and heating, even though the inertial speeds match exactly. Since peak deceleration scales as $v^2$, this alone is roughly a $27\ \mathrm{percent}$ difference in peak load.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $h_{\mathrm{EI}}$ | Entry interface altitude; $120\ \mathrm{km}$ in this module ($400{,}000\ \mathrm{ft} = 121.9\ \mathrm{km}$ is the common exact figure), a modelling convention, not a physical edge |
| $\rho(120\ \mathrm{km})$ | $7.1 \times 10^{-8}\ \mathrm{kg/m^3}$, fifty-eight millionths of sea level — functionally negligible |
| Entry state | $(h, v, \gamma, \psi, \mathrm{lat}, \mathrm{lon})$: altitude, relative speed, relative flight-path angle (negative descending), heading, horizontal position |
| $\mathbf{v}_{\mathrm{rel}} = \mathbf{v}_{\mathrm{inertial}} - \boldsymbol{\omega} \times \mathbf{r}$ | Relative velocity is what drag and lift respond to; differs from inertial velocity by the co-rotation vector |
| $\omega_\oplus r$ at EI | $473.9\ \mathrm{m/s}$ at Earth's equator — a several-percent correction to a typical entry speed |
| LEO-return entry speed | $\approx 7800\ \mathrm{m/s}$, near local circular speed |
| Lunar-return entry speed | $10.98\ \mathrm{km/s}$ from vis-viva with $r_a = 384{,}400\ \mathrm{km}$, $r_p = 6498.137\ \mathrm{km}$; rounded to $11.0\ \mathrm{km/s}$ |

The next lesson takes this entry state — specifically $v$ and $\gamma$ at the interface — and derives the first and most famous closed-form result in entry mechanics: the Allen-Eggers ballistic entry solution, which turns those two numbers into a full velocity history through the atmosphere.
