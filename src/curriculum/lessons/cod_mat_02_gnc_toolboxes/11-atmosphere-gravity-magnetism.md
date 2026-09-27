---
id: l11-atmosphere-gravity-magnetism
title: The air, gravity and magnetic field around the vehicle
minutes: 24
covers:
  - 'Atmosphere models: atmosisa, atmoscoesa (valid to 86 km), atmosnrlmsise00'
  - 'Gravity and magnetic models: gravitywgs84, gravitysphericalharmonic, wrldmagm'
---

Climb a tall mountain and three things change. The air gets thin, so you breathe harder and water boils at a lower temperature. Your bathroom scale, if you carried it up, would read a tiny bit less. And your compass still points roughly north, but not quite in the same direction as at home. Air, gravity and the magnetic field all depend on where you are.

A rocket or satellite feels the same three things, over a much bigger range. So every GNC simulation needs an **environment model**: a set of functions that say, for a given place and time, how dense the air is, how hard gravity pulls and which way the magnetic field points.

The last lesson built rotations between frames. This one fills those frames with the world outside the vehicle. Aerospace Toolbox gives you the standard models as ordinary MATLAB functions: `atmosisa`, `atmoscoesa` and `atmosnrlmsise00` for the air, `gravitywgs84` and `gravitysphericalharmonic` for gravity, and `wrldmagm` for the magnetic field. The skill this lesson teaches is not only calling them. It is knowing where each one stops telling the truth.

## A standard atmosphere: an agreed average day

Real air changes every day. Engineers still need one shared answer to "what is the air like at 10 km?" so that a wind-tunnel test in France and a simulation in Texas can be compared. The answer is a **standard atmosphere**: an agreed, made-up average day, written as formulas.

It starts at sea level with a temperature of $288.15\,\mathrm{K}$ ($15\,^\circ\mathrm{C}$) and a pressure of $101\,325\,\mathrm{Pa}$. Then it follows three rules.

1. **Temperature falls in straight lines.** Up to 11 km it drops by $6.5\,\mathrm{K}$ for every kilometer you climb. That rate is the **[[lapse rate|lapse-rate]]**. From 11 km to 20 km the temperature stays fixed at $216.65\,\mathrm{K}$ ($-56.5\,^\circ\mathrm{C}$).
2. **Pressure follows from weight.** The pressure at any height is the weight of all the air above it, pressing down on each square meter. As you climb, less air sits above you, so pressure drops.
3. **Density and the speed of sound follow from the first two.** Air is treated as an **ideal gas**, one where pressure, density and temperature are tied by a single simple law, so density is $\rho = P/(RT)$, read "rho equals P over R T", where $R = 287.05\,\mathrm{J/(kg\,K)}$ is the gas constant for air. The speed of sound is $a = \sqrt{\gamma R T}$ with $\gamma = 1.4$, read "gamma".

The **International Standard Atmosphere**, or **ISA**, is the version agreed through the International Organization for Standardization and used across aviation.

::: note Why pressure falls the way it does
Take a thin slab of air, $dh$ thick, with area $1\,\mathrm{m^2}$. Its weight is $\rho g\,dh$. That weight is carried by the pressure difference between its bottom and its top, so $dP = -\rho g\,dh$. Replace $\rho$ with $P/(RT)$ and you get $\dfrac{dP}{P} = -\dfrac{g}{RT}\,dh$. Where $T$ is constant (11 to 20 km), this integrates to an exponential: $P = P_{11}\,e^{-g(h - 11000)/(R T_{11})}$. Where $T$ falls in a straight line, $T = T_0 + L h$ with $L = -0.0065\,\mathrm{K/m}$, it integrates to a power law: $P = P_0\,(T/T_0)^{-g/(LR)}$. Every standard atmosphere is these two pieces joined end to end.
:::

### Geopotential altitude

Standard atmospheres measure height in a slightly unusual way. Gravity weakens as you climb, so lifting one kilogram through the 80th kilometer takes a little less work than lifting it through the first. **Geopotential altitude** is height counted in units of lifting work, as if gravity stayed at its sea-level value $g_0 = 9.80665\,\mathrm{m/s^2}$ all the way up. Ordinary height from sea level is called **geometric altitude**. The two are linked by

$$
H = \frac{r_0\, z}{r_0 + z},
$$

where $H$ is geopotential altitude, $z$ is geometric altitude and $r_0 = 6\,356\,766\,\mathrm{m}$ is the Earth radius the standard uses. Near the ground they are almost the same. At 20 km of geopotential altitude the geometric altitude is 20.063 km, only 63 m more. The gap grows with height, and it will matter at the top of the next model.

### atmosisa

```matlab
[T, a, P, rho] = atmosisa(10000)     % geopotential altitude in meters
% T   = 223.15 K        a   = 299.46 m/s
% P   = 26436 Pa        rho = 0.4127 kg/m^3
```

One input, height in meters, and four outputs, all SI: temperature in kelvin, speed of sound in m/s, pressure in pascals and density in kg/m³. MathWorks documents `atmosisa` for geopotential altitudes from 0 to 20 km. By default it models only that band, so an answer from it at 30 km is not a real atmosphere.

On a real team you would check these numbers against an independent implementation. The whole ISA below 20 km fits in a dozen lines, and you can run it anywhere, including GNU Octave:

```matlab
function [T, a, P, rho] = myIsa(H)
% ISA from 0 to 20 km geopotential altitude H (m)
    g0 = 9.80665;  R = 287.05287;  gam = 1.4;
    T0 = 288.15;   P0 = 101325;    L = -0.0065;       % K/m
    T11 = T0 + L*11000;
    P11 = P0*(T11/T0)^(-g0/(L*R));
    if H <= 11000
        T = T0 + L*H;
        P = P0*(T/T0)^(-g0/(L*R));
    else
        T = T11;
        P = P11*exp(-g0*(H - 11000)/(R*T11));
    end
    rho = P/(R*T);
    a   = sqrt(gam*R*T);
end
```

::: example Dynamic pressure at 10 km
**Problem.** A launch vehicle passes 10 km geopotential altitude at $300\,\mathrm{m/s}$. What are its Mach number and **dynamic pressure** $q = \tfrac{1}{2}\rho V^2$, the pressure the oncoming air puts on the nose?

**Step 1: the air.** `myIsa(10000)` gives $T = 223.15\,\mathrm{K}$, $a = 299.46\,\mathrm{m/s}$ and $\rho = 0.4127\,\mathrm{kg/m^3}$, the same as `atmosisa`.

**Step 2: Mach number.** $M = V/a = 300/299.46 = 1.002$. The vehicle is right at the speed of sound.

**Step 3: dynamic pressure.** $q = 0.5 \times 0.4127 \times 300^2 = 0.5 \times 0.4127 \times 90\,000 = 18\,572\,\mathrm{Pa}$, about $18.6\,\mathrm{kPa}$.

```matlab
[T, a, P, rho] = myIsa(10000);
M = 300/a                   % 1.0018
q = 0.5*rho*300^2           % 1.8572e+04 Pa
```

**Sanity check.** At sea level the same speed would give $0.5 \times 1.225 \times 90\,000 = 55\,125\,\mathrm{Pa}$. The air at 10 km is about a third as dense ($0.4127/1.225 = 0.337$), so $q$ should be about a third as big. It is. This is also why a rocket's peak dynamic pressure, **max-q**, comes a minute or so into flight: speed is climbing fast while density is falling fast, and their product peaks in between.
:::

## COESA: the standard atmosphere up to 86 km

Rockets do not stop at 20 km. The **[[U.S. Standard Atmosphere, 1976|coesa-name]]**, written by the Committee on Extension to the Standard Atmosphere (COESA), carries the same recipe higher. It stacks seven layers, each with its own straight-line temperature: cooling, then a constant layer, then warming through the **stratosphere** (the layer from 11 to about 50 km) as ozone absorbs sunlight, then cooling again through the **mesosphere** (about 50 to 86 km). Below 20 km it gives the same numbers as the ISA.

```matlab
[T, a, P, rho] = atmoscoesa(50000)   % same four SI outputs
% T = 270.65 K   a = 329.80 m/s   P = 75.94 Pa   rho = 9.775e-4 kg/m^3
```

The layers end at a geopotential altitude of 84 852 m. Put that into the formula above, turned around, and you get a geometric altitude of 86 000 m. That is why COESA is quoted as valid "to 86 km" (geometric), and why MathWorks documents the limit as 84.852 km (geopotential): it is the same place, measured two ways. Above it, the function continues the last layer's formulas upward with no data behind them. An optional second input chooses what happens when you ask for a height out of range: `'Warning'` (the default), `'Error'` or `'None'`.

::: key
COESA atmosphere validity limit: up to 86 km (geometric; 84.852 km geopotential). Above that use NRLMSISE-00 or a Jacchia-class model, since COESA has no data there and will extrapolate nonsense. MathWorks documents `atmosisa` from 0 to 20 km geopotential altitude.
:::

::: warning Geometric in, geopotential expected
A GPS receiver and most trajectory codes give geometric altitude. `atmosisa` and `atmoscoesa` expect geopotential. At 10 km the mix-up costs about 16 m of height, a density error under 0.2 percent, which is harmless. At 80 km it is about a kilometer, and density there changes by roughly 15 percent per kilometer. Convert with the formula above when you are high up, and write the kind of altitude into the variable name, `h_geom` or `h_gp`.
:::

## NRLMSISE-00: where the Sun sets the weather

Above about 90 km you are in the **[[thermosphere|thermosphere]]**. The air there is so thin that a satellite at 400 km is in what most people would call space. Yet there is still enough gas to drag on it, slowly lowering its orbit. And that thin air behaves very differently from the air below. It heats up to 700–1,400 K, and how hot depends on the Sun. When the Sun is active, its extra ultraviolet light heats the upper atmosphere, the gas expands outward, and the density at a given height can rise tenfold.

So the model up there needs more than altitude. **NRLMSISE-00**, from the U.S. Naval Research Laboratory, is a model of the whole atmosphere from the ground to about 1,000 km, fitted to satellite drag, rocket and radar measurements. It takes place, time and two measures of space weather:

- **[[F10.7|f107]]**: the Sun's radio brightness at a wavelength of 10.7 cm, a daily stand-in for its ultraviolet output. About 70 is a quiet Sun and 250 a very active one.
- **Ap**: a daily index of how disturbed Earth's magnetic field is. Magnetic storms dump energy into the upper atmosphere too.

```matlab
% 400 km above Cape Canaveral, 1 June 2026 (day 152) at 12:00 UTC
[T, rho] = atmosnrlmsise00(400e3, 28.57, -80.65, 2026, 152, 43200);
rho(6)       % total mass density, kg/m^3
T(2)         % temperature at that altitude, K
```

The inputs are altitude in meters, geodetic latitude and longitude in degrees, the year, the day of the year, and seconds into that day in UTC. Further optional inputs set the solar flux (an 81-day average F10.7 and the previous day's F10.7) and the magnetic index. If you leave them out, the function uses moderate default values, which is fine for a first look and wrong for a real drag prediction. The outputs are not the four familiar numbers. `rho` holds nine numbers: most are counts of one gas per cubic meter (helium, oxygen atoms, nitrogen and others), and the **total mass density** in kg/m³ sits in column 6. `T` holds two temperatures, and column 2 is the one at your altitude.

::: example How much the Sun changes drag
**Problem.** A 500 kg satellite in a circular 400 km orbit has a drag coefficient $C_D = 2.2$ and a frontal area $A = 10\,\mathrm{m^2}$. NRLMSISE-00 at the time and place above gives $\rho = 4.98 \times 10^{-13}\,\mathrm{kg/m^3}$ for a quiet Sun (F10.7 = 70) and $7.95 \times 10^{-12}\,\mathrm{kg/m^3}$ for an active Sun (F10.7 = 250). How fast does the orbit shrink in each case?

**Step 1: orbital speed.** $v = \sqrt{\mu/r} = \sqrt{3.986 \times 10^{14} / 6\,778\,137} = 7\,669\,\mathrm{m/s}$.

**Step 2: drag acceleration.** $a_D = \tfrac{1}{2}\rho v^2 C_D A/m$. For the quiet Sun, $0.5 \times 4.98 \times 10^{-13} \times 7669^2 \times 2.2 \times 10 / 500 = 6.4 \times 10^{-7}\,\mathrm{m/s^2}$. For the active Sun, $1.0 \times 10^{-5}\,\mathrm{m/s^2}$.

**Step 3: orbit decay.** For a circular orbit the radius shrinks at $\dfrac{dr}{dt} = -\rho\sqrt{\mu r}\,\dfrac{C_D A}{m}$. Quiet Sun: $4.98 \times 10^{-13} \times \sqrt{3.986 \times 10^{14} \times 6\,778\,137} \times 0.044 = 1.13 \times 10^{-3}\,\mathrm{m/s}$, which is about $98\,\mathrm{m}$ per day. Active Sun: about $1\,570\,\mathrm{m}$ per day.

**Sanity check.** The density ratio is $7.95 \times 10^{-12} / 4.98 \times 10^{-13} = 16$, and so is the decay ratio, $1570/98 = 16$, because decay is proportional to density. Accelerations of millionths of a m/s² still add up: 1.6 km a day matters to anyone predicting where the satellite will be next week.
:::

::: warning The nine-column output
The second output of `atmosnrlmsise00` is a row of nine numbers, and column 1 is the number of helium atoms per cubic meter, not a mass density at all. Taking `rho(1)` gives an answer wrong by more than twenty powers of ten. And a call with a single output, `x = atmosnrlmsise00(...)`, gets the temperatures, not the densities. Always ask for `[T, rho]` and index column 6 for the total mass density, and check the result is in the right ballpark: about $10^{-12}\,\mathrm{kg/m^3}$ near 400 km.
:::

## Gravity near the ground: gravitywgs84

On the pad, gravity is not exactly $9.80665\,\mathrm{m/s^2}$. Earth is slightly squashed, fatter at the equator, so the equator is farther from the center. Earth also spins, and the spin flings you outward a little, most at the equator. Both effects make gravity weaker at the equator than at the poles.

The **WGS84** ellipsoid, the same Earth shape that `lla2ecef` used in lesson 9, comes with a formula for **normal gravity**: the pull a plumb line or a bathroom scale feels on that ideal spinning ellipsoid, gravitation and the spin's outward push together. `gravitywgs84` evaluates it:

```matlab
g = gravitywgs84(0, 0)          % height m, geodetic latitude deg -> about 9.7803 m/s^2
g = gravitywgs84(0, 90)         % pole                             -> about 9.8322 m/s^2
g = gravitywgs84(10000, 28.5)   % 10 km over Cape Canaveral        -> about 9.7613 m/s^2
```

In this simplest form it takes height in meters and latitude in degrees and returns the magnitude, using a series that is accurate near the surface.

::: example Where does the equator's missing gravity go?
**Problem.** Normal gravity at the equator is $9.7803\,\mathrm{m/s^2}$. Show that it is the gravitational pull minus the spin's outward push.

**Step 1: the pull.** Treat Earth as a point mass plus its equatorial bulge (the $J_2$ term explained in the next section). At the equator, $r = 6\,378\,137\,\mathrm{m}$, the pull is $9.8142\,\mathrm{m/s^2}$.

**Step 2: the push.** A point on the equator moves in a circle of radius $r$ at the spin rate $\omega_E = 7.292115 \times 10^{-5}\,\mathrm{rad/s}$. Its outward (centrifugal) acceleration is $\omega_E^2 r = (7.292115 \times 10^{-5})^2 \times 6\,378\,137 = 0.0339\,\mathrm{m/s^2}$.

**Step 3: subtract.** $9.8142 - 0.0339 = 9.7803\,\mathrm{m/s^2}$, the normal gravity at the equator to four decimal places.

**Sanity check.** The spin effect is about a third of a percent. That is small, but it is 34 mm/s² — in a 500-second ascent, ignoring it would put about 4 km of error into altitude. It also warns you not to double count: if your simulation already includes the rotating-frame terms from lesson 9, it wants the gravitational pull, not normal gravity.
:::

## Gravity for orbits: spherical harmonics

For a vehicle in orbit, the "average pull" is not enough. The equatorial bulge, only 21 km of extra radius, tugs on a passing satellite and slowly swings its orbit plane around. Mountains and dense rock add smaller bumps. The way to describe all this is a **spherical harmonic** expansion: the pull of a perfect ball, plus a long series of correction terms, each a smooth pattern of highs and lows over the globe, like the overtones that give a guitar string its sound.

The biggest correction by far is **$J_2$** (read "J two"), the **[[bulge term|oblateness]]**, about $1.0826 \times 10^{-3}$. Its size relative to the plain pull is $\tfrac{3}{2}J_2 (R_E/r)^2$, which at 400 km altitude is $0.0014$: a 0.14 percent change. That sounds small, but it is about 400 times larger than the next term, and it is what makes the orbit plane of the International Space Station swing around by about 5 degrees a day.

`gravitysphericalharmonic` computes the pull from a chosen model up to a chosen **degree**, the number of terms kept:

```matlab
r_ecef = [6778137 0 0];     % 400 km above the equator at longitude 0, m (1-by-3 row)
[gx, gy, gz] = gravitysphericalharmonic(r_ecef, 'EGM2008', 2)
% gx is about -8.69 m/s^2 (pointing back toward Earth's center); gy and gz near 0
```

The position is in ECEF, in meters, one row per point; the three outputs are the ECEF components of gravity in m/s². `'EGM2008'` is the Earth Gravitational Model 2008, which runs to degree 2,159. Degree 2 keeps the ball and the bulge; a high-fidelity orbit simulation might keep 20 to 70.

::: key
`gravitywgs84(h, lat)` gives WGS84 normal gravity (gravitation plus spin) near the ground: about $9.780\,\mathrm{m/s^2}$ at the equator and $9.832\,\mathrm{m/s^2}$ at the pole. `gravitysphericalharmonic(r_ecef, model, degree)` gives the gravitational field of a full model such as EGM2008 at ECEF positions, for orbit work; $J_2$ is the dominant term after the point mass.
:::

::: note The J2 formula
With $\mathbf{r} = (x, y, z)$ in ECEF and $r = |\mathbf{r}|$, the point mass plus $J_2$ pull is

$$
\ddot{\mathbf{r}} = -\frac{\mu}{r^3}\begin{bmatrix} x\left(1 + k\left(1 - 5z^2/r^2\right)\right) \\ y\left(1 + k\left(1 - 5z^2/r^2\right)\right) \\ z\left(1 + k\left(3 - 5z^2/r^2\right)\right) \end{bmatrix}, \qquad k = \frac{3}{2}J_2\left(\frac{R_E}{r}\right)^2.
$$

Over the equator, $z = 0$, and the pull grows by the factor $1 + k$: at 400 km, $3.986 \times 10^{14}/6\,778\,137^2 \times 1.0014 = 8.676 \times 1.0014 = 8.688\,\mathrm{m/s^2}$. Coded in a few lines, this formula is the standard independent check on a degree-2 call to `gravitysphericalharmonic`.
:::

## The magnetic field: wrldmagm

A compass needle lines up with Earth's magnetic field. The field is roughly that of a giant bar magnet inside the planet, tilted about 10 degrees from the spin axis. Spacecraft use it twice. A **magnetometer** measures it, and comparing that measurement with a model tells the attitude filter which way the spacecraft is turned. And a **[[magnetorquer|magnetorquer]]**, a coil of wire, pushes against the field to turn the spacecraft or unload its reaction wheels.

The **World Magnetic Model**, WMM, is the standard model. A new version is issued every five years, and each one is built for those five years only. `wrldmagm` evaluates it:

```matlab
[XYZ, H, DEC, DIP, F] = wrldmagm(0, 28.57, -80.65, decyear(2026, 1, 1));
% XYZ about [24400 -3160 37300] nT  (north, east, down)
% H about 24600 nT, DEC about -7.4 deg, DIP about 56.6 deg, F about 44700 nT
```

The inputs are height in meters, geodetic latitude and longitude in degrees, and the date as a decimal year (`decyear` makes one). An optional fifth input picks the model epoch. The outputs are in **nanotesla** (nT), a billionth of a tesla:

- `XYZ`: the field's north, east and down components, in NED;
- `H`: the horizontal strength;
- `DEC`: the **declination**, how far the field points east of true north (negative is west);
- `DIP`: the **inclination**, how steeply it dips below horizontal;
- `F`: the total strength.

At Cape Canaveral the field is about 44,700 nT, points about 7 degrees west of true north, and dips about 57 degrees into the ground. At 400 km it is about 36,800 nT. The field of a bar magnet weakens as the cube of distance, so going from $6\,371$ to $6\,771\,\mathrm{km}$ from the center should cut it by $(6371/6771)^3 = 0.83$. The model gives $36\,800/44\,700 = 0.82$, close to the bar-magnet guess.

::: warning Units and dates
Magnetometers often report in gauss or microtesla; `wrldmagm` answers in nanotesla. $1\,\mathrm{gauss} = 100\,000\,\mathrm{nT}$ and $1\,\mu\mathrm{T} = 1000\,\mathrm{nT}$. And the date matters: the field drifts by tens of nanotesla a year, and a model used outside its five-year span quietly loses accuracy.
:::

## Choosing a model

| Need | Function | Good for |
|---|---|---|
| Air on an average day, low | `atmosisa` | 0 to 20 km geopotential |
| Air on an average day, higher | `atmoscoesa` | 0 to 86 km geometric (84.852 km geopotential) |
| Air in the thermosphere, with space weather | `atmosnrlmsise00` | ground to about 1,000 km; the choice above 86 km |
| Gravity near the surface | `gravitywgs84` | launch, aircraft, near-ground work |
| Gravity for orbits | `gravitysphericalharmonic` | any altitude; choose model and degree |
| Magnetic field | `wrldmagm` | surface to low orbit, inside the model's five years |

A good simulation writes these limits down beside the model and checks them at run time. Hand `atmoscoesa` 120 km and you get a warning nobody reads and a wrong drag force. The honest fix is to switch models at a stated altitude, and to test that switch.

## Check yourself

::: check
A student club flies a sounding rocket to 60 km and models the air with `atmosisa`. What is wrong, and what should they use?
:::

::: answer
`atmosisa` is documented only from 0 to 20 km of geopotential altitude, so above 20 km its numbers are not a real atmosphere. The flight tops out at 60 km, which is inside COESA's range (to 86 km geometric), so `atmoscoesa` is the right model for the whole flight. Below 20 km it gives the same answers as `atmosisa`, so nothing is lost low down.
:::

::: check
Compute the ISA speed of sound at 11 km, and explain why it stays the same all the way to 20 km.
:::

::: answer
At 11 km, $T = 288.15 - 6.5 \times 11 = 216.65\,\mathrm{K}$. Then $a = \sqrt{1.4 \times 287.05 \times 216.65} = \sqrt{87\,065} = 295.07\,\mathrm{m/s}$. The speed of sound depends only on temperature, and between 11 and 20 km the ISA temperature is held constant at 216.65 K, so the speed of sound is constant too, even though pressure and density keep falling.
:::

::: check
Convert a geometric altitude of 86 km to geopotential altitude, and say why the two differ.
:::

::: answer
$H = r_0 z/(r_0 + z) = 6\,356\,766 \times 86\,000 / (6\,356\,766 + 86\,000) = 84\,852\,\mathrm{m}$. Geopotential altitude counts height in units of lifting work at sea-level gravity. Gravity is weaker up high, so each real meter up there is worth a bit less than a meter of geopotential height, and the geopotential number comes out 1.15 km lower.
:::

::: check
A teammate compares `gravitywgs84(0, 0)` with their own point-mass-plus-$J_2$ function at the equator and finds $9.7803$ against $9.8142\,\mathrm{m/s^2}$. Which one is wrong?
:::

::: answer
Neither. `gravitywgs84` returns normal gravity, which includes the outward push of Earth's spin, $\omega_E^2 r = 0.0339\,\mathrm{m/s^2}$ at the equator. The teammate's function gives the gravitational pull alone. $9.8142 - 0.0339 = 9.7803$. The fix is to decide which one the simulation needs: an ECI simulation wants the pull alone; the spin term appears on its own if the equations are written in ECEF.
:::

::: check
Estimate the magnetic field strength at 800 km above Cape Canaveral from the surface value of 44,700 nT, using the bar-magnet rule.
:::

::: answer
The bar-magnet field falls as the cube of the distance from Earth's center. The surface is about 6,371 km from the center and the satellite 7,171 km. The ratio is $(6371/7171)^3 = 0.701$, so the field is about $0.701 \times 44\,700 \approx 31\,000\,\mathrm{nT}$. A real `wrldmagm` call would give a somewhat different number, because the real field is not a perfect centered magnet, but this is the right size.
:::

## Summary

| Idea | Function | Fact to remember |
|---|---|---|
| Standard atmosphere | `atmosisa` | $[T, a, P, \rho]$ in SI; 0 to 20 km geopotential |
| COESA 1976 | `atmoscoesa` | to 86 km geometric = 84.852 km geopotential; extrapolates above |
| Thermosphere | `atmosnrlmsise00` | needs date, place, F10.7, Ap; total density in column 6 |
| Geopotential altitude | — | $H = r_0 z/(r_0 + z)$; lower than geometric |
| Normal gravity | `gravitywgs84` | 9.780 m/s² at equator, 9.832 m/s² at pole; includes spin |
| Spherical harmonics | `gravitysphericalharmonic` | ECEF in, ECEF out; EGM2008; $J_2 \approx 1.08 \times 10^{-3}$ |
| Magnetic field | `wrldmagm` | nanotesla, NED components; five-year model epochs |

The next lesson adds what the standard atmosphere leaves out: wind, wind shear and turbulence, and the unit conversion helpers that keep feet, knots and pounds from sneaking into an SI simulation.

::: context lapse-rate Why the air cools as you climb
The Sun heats the ground, and the ground heats the air above it. Air that rises expands in the lower pressure, and expanding gas cools. Averaged over the planet, that gives about 6.5 K of cooling per kilometer in the lowest layer. The picture shows the whole COESA profile to 86 km: cooling, a constant layer, warming where ozone absorbs ultraviolet light, then cooling again.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="330" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="35" y="184">0</text><text x="35" y="148">20</text><text x="35" y="113">40</text><text x="35" y="77">60</text><text x="35" y="42">80</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="91" y="195">200</text><text x="193" y="195">240</text><text x="294" y="195">280</text>
  </g>
  <text x="185" y="207" font-size="11" fill="#1f2a44" text-anchor="middle">temperature (K)</text>
  <text x="12" y="100" font-size="11" fill="#1f2a44" transform="rotate(-90 12 100)" text-anchor="middle">km</text>
  <line x1="40" y1="144.4" x2="330" y2="144.4" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="326" y="140" font-size="11" fill="#6c7a93" text-anchor="end">atmosisa ends, 20 km</text>
  <line x1="40" y1="29.2" x2="330" y2="29.2" stroke="#b4232c" stroke-dasharray="4 3"/>
  <text x="326" y="25" font-size="11" fill="#b4232c" text-anchor="end">atmoscoesa ends, 86 km</text>
  <polyline points="315.3,180 133.3,160.4 133.3,144.4 163.8,123.1 270.7,96.4 270.7,89.3 128.2,53.8 57.7,29.2" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
</svg>
```
:::

::: context coesa-name Who wrote the 1976 standard
The U.S. Standard Atmosphere, 1976 was published jointly by NOAA, NASA and the U.S. Air Force. The committee behind it, COESA, had earlier produced the 1962 and 1966 editions. Below 32 km it matches the ICAO and ISO standard atmospheres, which is why MathWorks can offer both functions and have them agree low down.
:::

::: context thermosphere Hot, but you would freeze
The thermosphere's temperature of 1,000 K sounds like an oven. But temperature measures how fast the molecules move, and up there they are so few that they carry almost no heat to anything they touch. For a satellite, what matters is not the temperature itself but what it does to density: hotter gas swells upward, putting more of it at orbit height.
:::

::: context f107 A radio brightness that predicts drag
The Sun's ultraviolet output cannot be measured from the ground, because the atmosphere absorbs it. Its radio emission at 10.7 cm wavelength can, and it rises and falls with the ultraviolet. Canada has measured it daily since 1947, now at Penticton, British Columbia, in solar flux units. It swings over the 11-year solar cycle. In February 2022, a geomagnetic storm raised the density at low altitude soon after a SpaceX launch, and about 38 of 49 new Starlink satellites reentered before they could climb to their working orbits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="70" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="70" y1="170" x2="70" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="65" y="174">1e-13</text><text x="65" y="109">1e-12</text><text x="65" y="44">1e-11</text>
  </g>
  <line x1="70" y1="105" x2="330" y2="105" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <line x1="70" y1="40" x2="330" y2="40" stroke="#6c7a93" stroke-dasharray="3 3"/>
  <rect x="100" y="124.7" width="50" height="45.3" fill="#8fb8f0"/>
  <rect x="175" y="77" width="50" height="93" fill="#1d6fd1"/>
  <rect x="250" y="46.5" width="50" height="123.5" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="125" y="186">F10.7 = 70</text><text x="200" y="186">150</text><text x="275" y="186">250</text>
  </g>
  <text x="200" y="18" font-size="12" fill="#1f2a44" text-anchor="middle">density at 400 km, kg/m³ (log scale)</text>
</svg>
```
:::

::: context oblateness A planet with a waistline
Earth spins once a day, and the spin makes it bulge at the equator: the equatorial radius is 6,378 km and the polar radius 6,357 km. The extra ring of mass pulls on a satellite a little toward the equator plane. Because the orbit is tilted, that sideways tug makes the orbit plane slowly turn, the way a spinning top wobbles. Sun-synchronous orbits use this on purpose: tilted just right, their plane turns once a year, keeping the same lighting below.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <ellipse cx="150" cy="85" rx="95" ry="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="150" cy="85" r="70" fill="none" stroke="#1f2a44" stroke-dasharray="4 3"/>
  <line x1="40" y1="85" x2="260" y2="85" stroke="#6c7a93"/>
  <line x1="150" y1="8" x2="150" y2="162" stroke="#6c7a93"/>
  <text x="152" y="18" font-size="11" fill="#1f2a44">spin axis</text>
  <text x="262" y="89" font-size="11" fill="#1f2a44">equator</text>
  <text x="200" y="140" font-size="11" fill="#1f2a44">bulge</text>
  <text x="250" y="150" font-size="11" fill="#6c7a93">(bulge drawn far larger than real)</text>
</svg>
```
:::

::: context magnetorquer Steering with a coil of wire
A magnetorquer is a coil, or a rod wound with wire. Run a current through it and it becomes a magnet, and Earth's field twists it toward alignment, like a compass needle. The twist is small, but it needs no fuel. Many satellites use magnetorquers to slowly remove the spin that builds up in their reaction wheels, and tiny CubeSats often use them as their only actuators. The attitude software has to know the local field, which is exactly what `wrldmagm` gives it.
:::
