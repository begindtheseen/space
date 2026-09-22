---
id: l09-solar-radiation-pressure
title: Solar radiation pressure and eclipse modelling
minutes: 15
covers:
  - solar radiation pressure and eclipse modelling
---

Sunlight carries momentum, and a spacecraft that absorbs or reflects it feels a push. The force is tiny — smaller than $J_2$ by five orders of magnitude in low orbit — but it has two properties none of this module's other perturbations share. It is (almost) constant with distance from Earth, since the spacecraft's distance from the *Sun* barely changes over one orbit, so it does not fall off the way gravity-based perturbations do; and it switches on and off discontinuously, in full or in part, every time the spacecraft crosses into or out of Earth's shadow. That second property makes eclipse modelling inseparable from solar radiation pressure in practice: get the shadow boundary wrong, and a real, systematic along-track error accumulates every orbit, in exactly the way the very first lesson of this module warned a "small" constant acceleration always does.

## The radiation pressure force

A photon carries momentum $p=E/c$. Sunlight arriving at Earth carries energy flux (the solar constant) of about $1361\,\mathrm{W/m^2}$; dividing by $c$ gives the momentum flux, or radiation pressure,

$$
P_{\text{SR}} = \frac{1361\,\mathrm{W/m^2}}{299\,792\,458\,\mathrm{m/s}} = 4.56\times10^{-6}\,\mathrm{N/m^2}\quad\text{at }1\,\mathrm{AU} .
$$

A surface that fully absorbs incident light receives this pressure directly; a surface that reflects it specularly receives up to twice as much, because the photon's momentum reverses rather than only stopping. Real spacecraft surfaces are a mix of absorptive, diffusely reflective, and specular materials, summarised by a single reflectivity coefficient $C_r$ ranging from $1$ (fully absorbing) to $2$ (perfectly reflecting), so the acceleration is

$$
\mathbf{a}_{\text{SRP}} = P_{\text{SR}}\,C_r\,\frac{A}{m}\,\hat{\mathbf{s}} ,
$$

directed along $\hat{\mathbf{s}}$, the unit vector from the Sun *to* the spacecraft — pointing away from the Sun, the opposite sense from every gravitational perturbation in this module, since radiation pushes rather than pulls. $A/m$ is the same kind of area-to-mass ratio that set the ballistic coefficient in the drag lesson, and it is the single design lever that matters most: a solar sail or a spacecraft with large, lightweight deployed arrays has an $A/m$ orders of magnitude larger than a dense small satellite, and feels a correspondingly larger push.

::: example Sizing SRP for a typical spacecraft
With $A/m = 0.02\,\mathrm{m^2/kg}$ (a representative value for a compact satellite with modest solar arrays) and $C_r=1.3$ (a partially absorbing, partially diffuse surface):
$$
\lVert\mathbf{a}_{\text{SRP}}\rVert = (4.56\times10^{-6})(1.3)(0.02) = 1.186\times10^{-7}\,\mathrm{m/s^2} ,
$$
essentially the same value whether the spacecraft is in low orbit or at geostationary altitude, because both are a negligible distance from Earth compared to $1\,\mathrm{AU}$ from the Sun. This is smaller than $J_2$'s low-orbit acceleration by five orders of magnitude, but comparable to or larger than lunar and solar third-body attraction in low orbit, and it is the reason a spacecraft designer deliberately minimising drag by shrinking cross-sectional area is, at the same time, doing almost nothing to reduce solar radiation pressure's effect on precision orbit determination — the two perturbations share the same $A/m$ lever but act at completely different altitudes.
:::

## The cylindrical shadow model

The simplest eclipse model treats Earth's shadow as an infinite cylinder of radius $R_E$ extending directly away from the Sun. Let $\hat{\mathbf{s}}$ be the unit vector from Earth to the Sun (pointing the opposite way from the $\hat{\mathbf{s}}$ used in the acceleration formula above, which points *toward* the spacecraft from the Sun — take care with the sign convention in code). A spacecraft at geocentric position $\mathbf{r}$ is in shadow exactly when it is on the night side and within the cylinder's radius:

$$
\mathbf{r}\cdot\hat{\mathbf{s}} < 0 \qquad\text{and}\qquad \lVert\mathbf{r}\times\hat{\mathbf{s}}\rVert < R_E ,
$$

the first condition checking that the spacecraft is behind Earth relative to the Sun, the second that its perpendicular distance from the Earth–Sun line (the standard vector identity for that distance) is less than Earth's radius. This test is cheap to evaluate and correct in the sense that it correctly predicts full sunlight or full shadow for every geometry except the boundary itself; checking it against a few extreme cases — a spacecraft directly behind Earth from the Sun, one on the fully sunlit side, one displaced sideways far enough to clear Earth's shadow, one near the terminator — confirms it returns exactly the expected in-shadow / in-sunlight answer in each case.

::: example How much of a low orbit is eclipsed
For an orbit whose plane contains the Earth–Sun line (the worst case, called $\beta=0$ after the orbit's beta angle — the angle between the orbital plane and the Earth–Sun direction), the eclipse spans the arc of the orbit within Earth's angular radius as seen from the spacecraft, $\arcsin(R_E/r)$ on each side of the anti-solar point, so the eclipsed fraction of the orbit is $\arcsin(R_E/r)/\pi$. At $400\,\mathrm{km}$ altitude ($r=6778.137\,\mathrm{km}$), this is $0.390$ — about $39\%$ of the orbit, or roughly $37\,\mathrm{minutes}$ of a $95$-minute period, matching the commonly quoted "about a third of each orbit" rule of thumb for low Earth orbit. At geostationary altitude ($r=42\,164.137\,\mathrm{km}$), the same formula gives $0.0483$, about $69\,\mathrm{minutes}$ out of a $1436$-minute sidereal day — but only near the equinoxes, when the Sun crosses close enough to the equatorial plane for $\beta$ to be small; for most of the year a geostationary orbit's $\beta$ angle is large enough to miss Earth's shadow entirely, which is why geostationary eclipses are a seasonal, predictable, roughly six-week-long phenomenon around each equinox rather than a daily one.
:::

## Beyond the cylinder: the conical (umbra/penumbra) model

The Sun is not a point source — it subtends about $0.53^\circ$ as seen from Earth — so Earth's true shadow is a cone, not a cylinder, narrowing to a point (the umbra's apex) at a finite distance, and surrounded by a penumbra where the Sun is only partially blocked rather than fully hidden. The umbra apex distance follows from similar triangles between the Sun's radius, Earth's radius, and the Sun's distance:

$$
D_{\text{umbra}} = \frac{R_ED_{\text{Sun}}}{R_{\text{Sun}}-R_E} = \frac{(6378.137)(1.495\,978\,707\times10^8)}{696\,000-6378.137} = 1.3836\times10^{6}\,\mathrm{km} \approx 3.6\ \text{lunar distances},
$$

confirming the umbra reaches well past the Moon (which is why lunar eclipses happen at all) but tapers slowly: at geostationary distance the umbra's cross-section has shrunk to about $6184\,\mathrm{km}$, only $3\%$ narrower than Earth itself, so the cylindrical approximation used above is quite good even that far out. Inside the penumbra — a widening band just outside the umbra, absent from the cylindrical model entirely — sunlight is partially blocked, and $\mathbf{a}_{\text{SRP}}$ ramps smoothly between full value and zero rather than switching abruptly; mission design and coarse propagation almost always use the cylindrical on/off model, while precision orbit determination (fitting a model to tracking data well enough to resolve metre-level errors) needs the smoother conical transition, because the sharp discontinuity in the cylindrical model's acceleration is itself a source of numerical and estimation difficulty exactly at the moments the real force is changing continuously.

::: key Solar radiation pressure and eclipse
$$
\mathbf{a}_{\text{SRP}} = P_{\text{SR}}\,C_r\,\frac{A}{m}\,\hat{\mathbf{s}}, \qquad P_{\text{SR}}=4.56\times10^{-6}\,\mathrm{N/m^2\ at\ 1\,AU}, \quad C_r\in[1,2] .
$$
Cylindrical shadow test: in eclipse when $\mathbf{r}\cdot\hat{\mathbf{s}}<0$ and $\lVert\mathbf{r}\times\hat{\mathbf{s}}\rVert<R_E$. The conical model adds a penumbra, from the Sun's finite angular size, in which the acceleration ramps rather than switches.
:::

::: warning An unmodelled eclipse is a small force integrated for a long time
Getting the shadow boundary wrong by even a few seconds of true anomaly does not sound serious, but $\mathbf{a}_{\text{SRP}}$ switching on or off at the wrong moment is exactly the "small constant acceleration, applied for a long time" scenario the first lesson of this module warned about: a $10^{-7}\,\mathrm{m/s^2}$ error applied consistently, orbit after orbit, in the along-track direction, accumulates a position error that grows without bound rather than averaging out — this is precisely why precision orbit determination systems invest in the conical penumbra model rather than accepting the cylindrical model's sharp, and therefore mistimed, on/off edge.
:::

## Check yourself

::: check
Why does solar radiation pressure not fall off noticeably between a $400\,\mathrm{km}$ orbit and a geostationary orbit, unlike every other perturbation in this module except third-body attraction?
:::

::: answer
$\mathbf{a}_{\text{SRP}}$ depends on the spacecraft's distance from the *Sun*, not from Earth, through $P_{\text{SR}}$. The difference between a $400\,\mathrm{km}$ orbit and geostationary altitude — a few tens of thousands of kilometres — is utterly negligible compared to $1\,\mathrm{AU}\approx1.5\times10^8\,\mathrm{km}$, so $P_{\text{SR}}$, and hence $\mathbf{a}_{\text{SRP}}$, is essentially the same number at every altitude near Earth.
:::

::: check
Two otherwise-identical spacecraft differ only in $C_r$: one is painted matte black ($C_r\approx1$), the other has a highly reflective mirrored surface ($C_r\approx2$). Which feels more solar radiation pressure, and by roughly what factor?
:::

::: answer
The mirrored spacecraft feels about twice the acceleration. A perfectly absorbing surface receives the photon momentum once; a perfectly reflecting surface receives it twice, because the photon's momentum reverses direction rather than only stopping, transferring momentum $2p$ instead of $p$. Since $\mathbf{a}_{\text{SRP}}\propto C_r$, doubling $C_r$ from $1$ to $2$ doubles the acceleration.
:::

::: check
A satellite designer reduces cross-sectional area specifically to cut atmospheric drag on a low-orbit mission. Does this design change also reduce the satellite's sensitivity to solar radiation pressure, and if so by how much relative to the drag benefit?
:::

::: answer
Yes, by the same fractional amount, since both accelerations scale with the same $A/m$ ratio — halving $A$ (holding $m$ fixed) halves both $a_D$ and $a_{\text{SRP}}$ proportionally. The practical difference is where each matters: the drag reduction meaningfully extends orbital lifetime in low orbit, where drag was already the dominant secular perturbation, while the SRP reduction shrinks an already-small effect further — helpful for precision orbit determination, but not the primary reason to shrink cross-sectional area on a low-orbit mission.
:::

::: check
Explain why geostationary satellites experience eclipses only near the equinoxes rather than once per day, even though they orbit Earth once per sidereal day.
:::

::: answer
Whether an orbit is eclipsed at all, not just for how long, depends on the beta angle — the angle between the orbital plane and the Earth–Sun line. A geostationary orbit's plane (very close to the equatorial plane) only comes close enough to containing the Earth–Sun line, and hence close enough to $\beta=0$, when the Sun itself is near the equatorial plane, which happens only around the two equinoxes each year; for the rest of the year the Sun's declination carries it far enough out of the orbital plane that Earth's shadow cylinder is missed on every single daily pass.
:::

::: check
Why does precision orbit determination need the conical (umbra/penumbra) shadow model rather than the simpler cylindrical model, even though the cylindrical model is much easier to compute?
:::

::: answer
The cylindrical model switches $\mathbf{a}_{\text{SRP}}$ on or off discontinuously at the shadow boundary, which is both physically inaccurate near the true boundary (where the Sun is only partially blocked, not fully visible or fully hidden) and numerically awkward, since a discontinuous force is harder for an estimator or integrator to fit well exactly at the moments it is changing fastest. The conical model's smooth ramp through the penumbra matches the real, continuous physics and avoids introducing an artificial discontinuity into the force model at precisely the point where getting the timing right matters most.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{a}_{\text{SRP}} = P_{\text{SR}}C_r(A/m)\hat{\mathbf{s}}$ | SRP acceleration; $\hat{\mathbf{s}}$ points away from the Sun |
| $P_{\text{SR}} = 4.56\times10^{-6}\,\mathrm{N/m^2}$ at $1\,\mathrm{AU}$ | Radiation pressure; solar flux divided by $c$ |
| $C_r\in[1,2]$ | $1$ fully absorbing, $2$ fully reflecting |
| Roughly altitude-independent near Earth | Depends on distance from the Sun, not from Earth |
| Cylindrical shadow test | In eclipse when $\mathbf{r}\cdot\hat{\mathbf{s}}<0$ and $\lVert\mathbf{r}\times\hat{\mathbf{s}}\rVert<R_E$ |
| $\approx39\%$ of a LEO orbit, $\approx69\,\mathrm{min}$ near GEO equinox | Eclipse duration, $\beta=0$ worst case |
| Umbra apex $\approx1.38\times10^6\,\mathrm{km}$ ($3.6$ lunar distances) | Where the conical shadow narrows to a point |

Having covered every individual perturbation's own physics, the next lessons turn to *how* to combine them all in a propagator: Cowell's method, which integrates the total acceleration directly, and Encke's, which integrates only the deviation from a reference orbit.
