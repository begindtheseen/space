---
id: l05-environment-models
title: Environment models
minutes: 21
covers:
  - "Environment models: gravity field, atmosphere, wind and gust, magnetic field, ephemeris, solar radiation pressure"
---

The Environment box, from the five-box decomposition, is everything physical acting on the vehicle that the vehicle does not control: gravity, the atmosphere and its wind, the planetary magnetic field, the positions of the Sun and Moon, and the pressure of sunlight itself. Every one of these is queried at the plant's true state — its position, its velocity, the current time — and every one of them is a place a dispersion campaign will later vary a parameter without touching anything else in the simulation, which is the entire reason it was kept as its own box in the first lesson of this module.

This lesson surveys the six models and gives each one real numbers, because "the environment box computes gravity" hides an engineering decision every time: point mass or with oblateness, a simple exponential atmosphere or a full standard atmosphere, a steady wind or a stochastic gust on top of it. Getting the decision right means knowing how big each effect actually is relative to what you are trying to resolve.

## Gravity beyond the point mass

Two-body gravity, $\mathbf{a} = -\mu\mathbf{r}/r^3$, is the dominant term everywhere near a planet and the only term a point-mass validation case needs. A real planet is not a point mass — Earth's equatorial bulge is the largest correction, captured by the second zonal harmonic $J_2$ of the geopotential. The perturbing potential term is $U_{J_2} = \dfrac{\mu}{r}J_2\left(\dfrac{R_E}{r}\right)^2\dfrac{3\sin^2\phi - 1}{2}$, with $\phi$ the latitude; its gradient in Cartesian inertial coordinates gives the standard correction acceleration

$$
\mathbf{a}_{J_2} = -\frac{3}{2}J_2\,\mu\,\frac{R_E^2}{r^5}
\begin{pmatrix}
x\left(1 - 5\dfrac{z^2}{r^2}\right) \\[4pt]
y\left(1 - 5\dfrac{z^2}{r^2}\right) \\[4pt]
z\left(3 - 5\dfrac{z^2}{r^2}\right)
\end{pmatrix} .
$$

::: example How big is $J_2$ at low Earth orbit?
At $500\,\mathrm{km}$ altitude and $45^\circ$ latitude ($r = 6{,}878.137\,\mathrm{km}$, $\mathbf{r}_I = r\,(\cos 45^\circ,\ 0,\ \sin 45^\circ)$), with $\mu = 398{,}600.4418\,\mathrm{km^3/s^2}$, $R_E = 6{,}378.137\,\mathrm{km}$, $J_2 = 1.08263\times10^{-3}$:

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

The point-mass acceleration is $8.4255\,\mathrm{m/s^2}$; $J_2$ adds a correction of $0.01315\,\mathrm{m/s^2}$, about $0.156\%$ of it. That is small enough to ignore for a single-burn ascent or a rendezvous arc lasting minutes, and large enough that a multi-orbit propagation without it drifts steadily away from reality — the same secular-versus-negligible distinction the Numerical Methods module's symplectic integrators lesson made about truncation error, except here the "error" is a real, deliberately included piece of physics rather than a numerical artefact, and leaving it out is a modelling choice, not a shortcut.
:::

## Atmosphere, wind and gust

The atmosphere's density, pressure and speed of sound as functions of altitude are what the Atmospheric Flight module already gave you the tools to turn into aerodynamic force and moment; the Environment box's job is only to serve those quantities at the plant's true altitude, evaluated consistently with whatever standard atmosphere model the campaign has selected. What that module did not need to model in detail is the *wind* the vehicle flies through, because aerodynamic force depends on velocity relative to the air, not relative to the ground: $\mathbf{v}_{\text{rel}} = \mathbf{v}_{\text{vehicle}} - \mathbf{v}_{\text{wind}}$. Wind is therefore not a separate force; it is a correction to the velocity that every aerodynamic calculation downstream already depends on, which is exactly why it lives in the Environment box rather than being folded into the plant.

A wind model has at least two layers. A **mean profile**, typically a power law in altitude within the boundary layer, $V(h) = V_{\text{ref}}(h/h_{\text{ref}})^\alpha$ with $\alpha \approx 0.1$–$0.2$ over open terrain, captures the steady increase in wind speed with altitude before the jet stream and above it. A **discrete gust** rides on top of it, usually specified for structural and control design as a "1 − cosine" pulse of a stated peak magnitude and length, because a launch vehicle's worst-case loads case is not the mean wind but a sudden encounter with a gust at the moment of highest dynamic pressure.

::: example A design gust at max-Q
A power-law profile with $V_{\text{ref}} = 20\,\mathrm{m/s}$ at $h_{\text{ref}} = 10\,\mathrm{m}$ and $\alpha = 0.14$:

```python
V_ref, h_ref, alpha = 20.0, 10.0, 0.14
for h in [10, 100, 1000, 11000]:
    print(h, round(V_ref*(h/h_ref)**alpha, 2))
# 10 20.0
# 100 27.61
# 1000 38.11
# 11000 53.31
```

grows from $20\,\mathrm{m/s}$ at the surface to $53.3\,\mathrm{m/s}$ near the tropopause. Superimpose the classic $30\,\mathrm{ft/s}$ ($9.14\,\mathrm{m/s}$) discrete design gust on a vehicle flying at $300\,\mathrm{m/s}$ through max dynamic pressure: the gust adds a lateral velocity component that, for small angles, perturbs the angle of attack by

$$
\Delta\alpha \approx \arctan\!\left(\frac{V_{\text{gust}}}{V_{\text{vehicle}}}\right) = \arctan\!\left(\frac{9.14}{300}\right) = 1.745^\circ .
$$

At the altitude and speed where dynamic pressure $q = \tfrac12\rho v^2$ is largest, a small $\Delta\alpha$ produces the largest possible aerodynamic side load the Atmospheric Flight module's force equations can generate — which is exactly why this gust is specified to be encountered at max-Q in the requirements, not at an arbitrary point in the flight. A gust of the same $9.14\,\mathrm{m/s}$ encountered at low dynamic pressure, soon after liftoff or high in the thinning atmosphere, produces the same $\Delta\alpha$ but a much smaller load, because $q$ is what turns an angle of attack into a force.
:::

A full stochastic turbulence model — the Dryden or von Kármán spectra, which describe wind as a filtered random process with a specified power spectral density rather than a single deterministic pulse — belongs in the same box and is what a Monte Carlo dispersion campaign draws a different realisation of on every case; the deterministic gust above is the worst-case design point, the stochastic model is what a statistical loads or controllability assessment needs instead.

## Magnetic field and ephemeris

A simple dipole model gives the planetary magnetic field's order of magnitude: at the magnetic equator, $B_{\text{eq}}(r) = B_0(R_E/r)^3$ with $B_0 \approx 3.05\times10^{-5}\,\mathrm{T}$ at the surface.

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

At $500\,\mathrm{km}$ altitude the equatorial field is about $24{,}300\,\mathrm{nT}$, and a modest residual spacecraft dipole of $0.1$ to $1\,\mathrm{A\,m^2}$ — stray current loops, magnetised structure — produces a disturbance torque of $2.4\times10^{-6}$ to $2.4\times10^{-5}\,\mathrm{N\,m}$, right in the range the Rigid Body Dynamics module quoted for environmental disturbance torques in low orbit. A dipole is accurate to perhaps 10% and adequate for a disturbance-torque budget or a coarse magnetometer-only attitude estimate; it is not accurate enough for precision magnetic attitude determination, which needs a full spherical-harmonic field model such as IGRF, carrying dozens of coefficients beyond the dipole term.

Ephemeris — where the Sun and Moon actually are at a given time — feeds three other models at once: third-body gravitational perturbation, solar radiation pressure, and eclipse determination. A short simulation can often get away with a simplified circular ephemeris; anything spanning weeks, or anything where eclipse timing matters to a power or thermal budget, needs a precise ephemeris such as a JPL DE table, because the Sun's apparent position error from a circular approximation compounds exactly the way any other unmodelled perturbation does.

## Solar radiation pressure

Sunlight carries momentum; a surface that absorbs or reflects it feels a force. The pressure at 1 AU is the solar constant divided by the speed of light, $P_{\text{sr}} = S/c$, and the resulting acceleration on a vehicle of mass $m$ and sunlit cross-sectional area $A$ with radiation-pressure coefficient $C_R$ (1 for a pure absorber, up to 2 for a perfect reflector) is $a_{\text{srp}} = P_{\text{sr}}C_R(A/m)$.

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

$P_{\text{sr}} = 4.540\times10^{-6}\,\mathrm{N/m^2}$, and for a spacecraft with area-to-mass ratio between $0.01$ and $0.05\,\mathrm{m^2/kg}$ — a compact bus versus something with large deployed panels — the resulting acceleration is $5.9\times10^{-8}$ to $3.0\times10^{-7}\,\mathrm{m/s^2}$: negligible against gravity, and yet, integrated over weeks, large enough to matter for any high-precision orbit determination, which is why the same ephemeris that positions the Sun for this calculation must also flag when the vehicle is in shadow and $a_{\text{srp}}$ should be switched off.

::: key The six environment models
Gravity (point mass, plus $J_2$ and higher harmonics where the mission duration warrants them), atmosphere (density, pressure, speed of sound versus altitude), wind and gust (a mean profile plus a deterministic design gust or a stochastic turbulence spectrum), magnetic field (dipole for coarse work, spherical harmonic for precision), ephemeris (Sun and Moon position, needed for third-body perturbation, solar radiation pressure and eclipse), and solar radiation pressure itself. Every one is evaluated at the plant's true state and belongs in the Environment box specifically so a dispersion campaign can vary any one of them independently.
:::

::: warning Wind folded into the plant instead of the environment
It is tempting to add wind directly inside the plant's translational equation, as one more force, since that is where aerodynamic force is ultimately applied. Wind is not a force; it changes the *relative velocity* an existing aerodynamic force calculation uses, and it needs to be queried, dispersed and swapped exactly like every other environment field. Burying it inside the plant makes it invisible to the same machinery that swaps atmosphere density models or gravity fields, and the next engineer to disperse wind for a Monte Carlo campaign will not find it where every other environment parameter lives.
:::

::: warning Treating a dipole magnetic field as precise
A dipole model is right in order of magnitude and wrong in detail — it omits the field's higher-order structure entirely, along with secular drift of the real field over years. It is entirely adequate for a disturbance-torque budget like the one above, where being within a factor of two is fine, and it is not adequate for simulating a magnetometer-based attitude determination filter's actual accuracy, which will see real-field structure the dipole cannot produce. Know which of the two jobs you are asking the model to do before you pick it.
:::

## Check yourself

::: check
Why does wind enter the simulation through the relative velocity $\mathbf{v}_{\text{rel}} = \mathbf{v}_{\text{vehicle}} - \mathbf{v}_{\text{wind}}$ rather than as a force applied directly to the plant?
:::

::: answer
Aerodynamic force and moment, as the Atmospheric Flight module derived them, are functions of the vehicle's velocity through the air, not through the ground. Wind changes what that relative velocity is; it does not add a separate force term. Treating it as a velocity correction, evaluated in the Environment box and applied wherever relative velocity is computed, keeps it consistent with every aerodynamic calculation and keeps it swappable the same way every other environment field is.
:::

::: check
The $J_2$ correction at 500 km altitude was about 0.156% of the point-mass acceleration. Explain why this can be safely ignored for a single ascent-to-orbit trajectory but not for a two-week station-keeping simulation, given that the ratio itself does not change.
:::

::: answer
0.156% of the acceleration is a fixed *instantaneous* ratio, but its effect on the trajectory accumulates over time the way any unmodelled perturbation does: over the few minutes of an ascent it displaces the trajectory by an amount far below the accuracy the guidance needs, but integrated over two weeks of station-keeping it produces a secular drift in the orbit — most visibly nodal regression — that is not negligible against the station-keeping tolerance. The ratio tells you the size of the force; whether that size matters depends on how long it acts, which is a property of the mission, not of $J_2$.
:::

::: check
A discrete design gust of $9.14\,\mathrm{m/s}$ produces the same $1.745^\circ$ angle-of-attack perturbation whether it is encountered at liftoff, at max-Q, or high in the thinning atmosphere. Why does the vehicle's structural loads requirement specify the gust at max-Q rather than treating all three encounters as equally severe?
:::

::: answer
Aerodynamic load scales with dynamic pressure $q = \tfrac12\rho v^2$ as well as angle of attack; the same $\Delta\alpha$ produces a force proportional to $q$. Dynamic pressure is largest partway through ascent, at max-Q, where the still-dense lower atmosphere combines with a vehicle that has already built up significant speed. The identical gust at liftoff (low $v$) or high altitude (low $\rho$) produces the same angle but a much smaller $q$ and therefore a much smaller load, so max-Q is the worst case even though the wind input is identical in all three.
:::

::: check
Why does solar radiation pressure modelling require the same ephemeris data that third-body gravitational perturbation needs, beyond knowing the Sun is "somewhere up there"?
:::

::: answer
The radiation-pressure acceleration depends on the vehicle's actual distance from and direction to the Sun, exactly as a third-body gravitational term does, and both need to be switched off when the vehicle passes into the planet's shadow — which requires knowing the Sun's position precisely enough to compute the eclipse geometry. A simplified or stale ephemeris introduces the same kind of compounding position error in the radiation-pressure force as it does in the gravitational one.
:::

::: check
A dipole model of Earth's magnetic field is judged adequate for a disturbance-torque budget but inadequate for a precision magnetometer-based attitude filter. What property of the two use cases explains the difference?
:::

::: answer
A disturbance-torque budget needs the field's order of magnitude, to a factor of two or so, to bound how much control authority the actuators must provide against it over an orbit — the dipole is accurate enough for that. A magnetometer-based filter is trying to extract attitude information from the field's fine structure at the vehicle's specific position, and the dipole does not contain that structure at all; using it would mean feeding the filter a field the real magnetometer will never actually measure, understating the filter's real error.
:::

::: check
A teammate proposes adding the $9.14\,\mathrm{m/s}$ discrete gust directly into the plant's equations of motion as a fixed bias force, computed once from a nominal angle of attack, rather than querying it from the Environment box as a function of time and altitude. What is lost?
:::

::: answer
A fixed bias force cannot reproduce the gust's actual time history — its onset, its "1 − cosine" rise and fall, or its dependence on where in the flight profile (and therefore at what dynamic pressure) it is encountered. It also cannot be swapped for a different gust magnitude, a stochastic turbulence spectrum, or turned off entirely for a nominal-conditions run, all of which the Environment box's interface exists to make a configuration change rather than a code change.
:::

## Summary

| Model | Formula or value | Typical magnitude (LEO example) |
| --- | --- | --- |
| Point-mass gravity | $\mathbf{a} = -\mu\mathbf{r}/r^3$ | $8.43\,\mathrm{m/s^2}$ at 500 km |
| $J_2$ correction | $\mathbf{a}_{J_2} = -\tfrac32 J_2\mu R_E^2/r^5\,[\ldots]$ | $0.0132\,\mathrm{m/s^2}$, $0.156\%$ of point mass |
| Wind profile | $V(h) = V_{\text{ref}}(h/h_{\text{ref}})^\alpha$ | $20$–$53\,\mathrm{m/s}$, 10 m to 11 km |
| Discrete gust | $\Delta\alpha \approx \arctan(V_{\text{gust}}/V_{\text{vehicle}})$ | $1.75^\circ$ for a $9.14\,\mathrm{m/s}$ gust at $300\,\mathrm{m/s}$ |
| Magnetic dipole | $B_{\text{eq}} = B_0(R_E/r)^3$ | $24{,}300\,\mathrm{nT}$ at 500 km; torque $2$–$24\,\mu\mathrm{N\,m}$ |
| Solar radiation pressure | $a_{\text{srp}} = (S/c)C_R(A/m)$ | $6\times10^{-8}$–$3\times10^{-7}\,\mathrm{m/s^2}$ |
| Ephemeris | Sun/Moon position vs. time | Needed for third-body, SRP and eclipse together |

Every model in this lesson supplies truth to the plant; the next lesson covers what stands between that truth and the flight software's view of it — the sensor models that turn a perfect Environment and Plant into the noisy, delayed, quantised world GNC actually has to fly in.
