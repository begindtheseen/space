---
id: l01-standard-atmosphere
title: The standard atmosphere
minutes: 18
covers:
  - "standard atmosphere models: US Standard 1976, exponential, NRLMSISE-00"
  - density, pressure and temperature vs altitude
---

Every aerodynamic quantity that matters to a launch vehicle — drag, the normal force that bends the airframe, the dynamic pressure that sets the structural limit, the Mach number that decides which drag coefficient applies — is proportional to some property of the air the vehicle is flying through. Air density falls by roughly a factor of a thousand between the pad and 50 km, and the temperature profile that fixes the speed of sound is anything but monotonic. Before you can compute a single force on an ascending rocket you need a model of the atmosphere as a function of altitude.

The GNC engineer meets that model in three forms. The **US Standard Atmosphere 1976** is a table-defined, piecewise-analytic profile of temperature, pressure and density up to 86 km that every ascent simulation uses as its baseline. The **exponential atmosphere** is a one-line approximation, $\rho = \rho_0 e^{-h/H}$, good enough to derive where max-Q happens and how a gravity turn's drag loss scales. **NRLMSISE-00** is an empirical model of the upper atmosphere, driven by solar and geomagnetic activity, that you reach for above 100 km — for satellite drag, for orbit decay, and for the entry interface.

This lesson builds the first two from two physical laws and shows exactly how far the exponential shortcut can be trusted, then explains what the third one adds and when you need it. Everything here feeds the next lesson, where the density profile and the vehicle's speed together produce the dynamic-pressure peak that dominates ascent design.

## Two laws and a profile

A column of still air is in **hydrostatic equilibrium**: the pressure at any height is exactly the weight of the air above it, per unit area. Consider a thin slab of air of thickness $dh$ at height $h$, with density $\rho$. The pressure difference across it must support its weight, so

$$
\frac{dp}{dh} = -\rho\, g,
$$

where $p$ is pressure in pascals, $g$ the gravitational acceleration and the minus sign says pressure falls as you go up. This alone cannot be integrated, because $\rho$ depends on $p$. The link is the **ideal gas law** in its specific form,

$$
p = \rho R T,
$$

with $T$ the absolute temperature in kelvin and $R$ the **specific gas constant** for air, the universal constant divided by the mean molar mass of the mixture: $R = 8314.32/28.9644 = 287.053\ \mathrm{J/(kg\cdot K)}$. Substituting $\rho = p/(RT)$ into the hydrostatic equation and dividing by $p$,

$$
\frac{dp}{p} = -\frac{g}{R\,T(h)}\,dh.
$$

Everything now hangs on the temperature profile $T(h)$. Give me $T(h)$ and I can integrate this for $p(h)$, then recover $\rho(h) = p/(RT)$. The two standard cases are a layer of constant temperature and a layer where temperature changes linearly with height. The US Standard Atmosphere is nothing more than a stack of such layers.

## The isothermal layer and the scale height

If $T$ is a constant $T_b$ throughout a layer that starts at height $h_b$ with pressure $p_b$, the right-hand side integrates immediately:

$$
\ln\frac{p}{p_b} = -\frac{g\,(h-h_b)}{R\,T_b}
\quad\Longrightarrow\quad
p = p_b \exp\!\left[-\frac{g\,(h-h_b)}{R\,T_b}\right].
$$

Because $T$ is constant, $\rho = p/(RT_b)$ has exactly the same shape. Both fall by a factor of $e$ every

$$
H = \frac{R\,T}{g}
$$

metres, the **scale height** of the layer. In the lower stratosphere, where $T = 216.65\ \mathrm{K}$, that is $H = 287.053 \times 216.65 / 9.80665 = 6342\ \mathrm{m}$. At the sea-level temperature of 288.15 K it would be 8435 m. Warm air is "taller": the same pressure drop takes more altitude.

## The gradient layer

In a layer where the temperature varies linearly, $T = T_b + \lambda\,(h - h_b)$ with $\lambda = dT/dh$ the **lapse rate** (negative when the air cools with height), write $dh = dT/\lambda$ and the pressure equation becomes

$$
\frac{dp}{p} = -\frac{g}{R\,\lambda}\,\frac{dT}{T}
\quad\Longrightarrow\quad
\ln\frac{p}{p_b} = -\frac{g}{R\lambda}\,\ln\frac{T}{T_b}
\quad\Longrightarrow\quad
p = p_b\left(\frac{T}{T_b}\right)^{-g/(R\lambda)}.
$$

For the troposphere $\lambda = -6.5\ \mathrm{K/km} = -0.0065\ \mathrm{K/m}$, and the exponent is

$$
-\frac{g}{R\lambda} = \frac{9.80665}{287.053 \times 0.0065} = 5.2559.
$$

Dividing by $RT$ gives the density, which carries one power of $T$ fewer:

$$
\rho = \rho_b\left(\frac{T}{T_b}\right)^{-g/(R\lambda) - 1}, \qquad -\frac{g}{R\lambda} - 1 = 4.2559 .
$$

So in the troposphere the pressure falls as the 5.26th power of the temperature ratio and the density as the 4.26th power. These exponents are exactly what the `us1976` exercise asks you to implement.

## The US Standard Atmosphere 1976

The 1976 standard defines the temperature profile as seven linear segments from sea level to 86 km, each layer starting where the previous one ends, with the pressure at each base obtained by integrating through the layers below. Sea level is fixed at $T_0 = 288.15\ \mathrm{K}$, $p_0 = 101\,325\ \mathrm{Pa}$, hence $\rho_0 = p_0/(RT_0) = 1.225\ \mathrm{kg/m^3}$. Working upward:

| Layer | Base $h_b$ (km) | $T_b$ (K) | $\lambda$ (K/km) | $p_b$ (Pa) | $\rho_b$ (kg/m³) |
| --- | --- | --- | --- | --- | --- |
| Troposphere | 0 | 288.15 | −6.5 | 101 325 | 1.225 |
| Lower stratosphere | 11 | 216.65 | 0 | 22 632 | 0.3639 |
| Stratosphere | 20 | 216.65 | +1.0 | 5 474.9 | 0.08803 |
| Stratosphere | 32 | 228.65 | +2.8 | 868.02 | 0.01322 |
| Stratopause | 47 | 270.65 | 0 | 110.91 | 0.001428 |
| Mesosphere | 51 | 270.65 | −2.8 | 66.939 | 0.000862 |
| Mesosphere | 71 | 214.65 | −2.0 | 3.9564 | 0.0000642 |

Notice the shape. Temperature falls to 216.65 K at the **tropopause** (11 km), holds constant to 20 km, then *rises* through the stratosphere as ozone absorbs ultraviolet light, peaking at 270.65 K near 47 km, and falls again through the mesosphere. Pressure and density, by contrast, fall monotonically — the hydrostatic law does not care which way temperature is going, only how warm the air is.

One technicality: the standard is written in **geopotential altitude**, which keeps $g$ fixed at $g_0 = 9.80665\ \mathrm{m/s^2}$ by absorbing its decrease with height into the altitude coordinate, $h_{\text{geopot}} = r_0 h / (r_0 + h)$ with $r_0 = 6\,356\,766\ \mathrm{m}$. At 20 km the two altitudes differ by 63 m, about 0.3 %; below 30 km you can ignore the distinction in this module.

::: key
US Standard Atmosphere 1976 anchor values. Sea level: $T = 288.15\ \mathrm{K}$, $p = 101\,325\ \mathrm{Pa}$, $\rho = 1.225\ \mathrm{kg/m^3}$, lapse rate 6.5 K/km. Tropopause (11 km): $T = 216.65\ \mathrm{K}$, $p = 22\,632\ \mathrm{Pa}$, $\rho = 0.3639\ \mathrm{kg/m^3}$. Between 11 and 20 km the atmosphere is isothermal at 216.65 K, so pressure and density decay exponentially with a scale height $H = RT/g_0 = 6.34\ \mathrm{km}$.
:::

::: example Conditions at the tropopause
Start from sea level and climb 11 km through the troposphere. The temperature is

$$
T = 288.15 - 0.0065 \times 11\,000 = 216.65\ \mathrm{K},
$$

so the temperature ratio is $216.65/288.15 = 0.75187$. The pressure follows from the gradient-layer law with exponent 5.2559:

$$
p = 101\,325 \times 0.75187^{5.2559} = 101\,325 \times 0.22336 = 22\,632\ \mathrm{Pa},
$$

and the density from the ideal gas law:

$$
\rho = \frac{22\,632}{287.053 \times 216.65} = 0.3639\ \mathrm{kg/m^3}.
$$

At the altitude where a launcher typically meets its peak dynamic pressure, the air is 22 % as dense as at the pad and the pressure is a little under a quarter of an atmosphere.
:::

::: example Into the isothermal layer
Continue to 15 km, then 20 km. Both lie in the isothermal layer that starts at 11 km, so

$$
p(15\ \mathrm{km}) = 22\,632 \exp\!\left[-\frac{9.80665 \times 4000}{287.053 \times 216.65}\right] = 22\,632\, e^{-0.6308} = 12\,045\ \mathrm{Pa},
$$

and $\rho = 12\,045/(287.053 \times 216.65) = 0.1937\ \mathrm{kg/m^3}$. Repeating with 9000 m instead of 4000 m gives $p(20\ \mathrm{km}) = 22\,632\, e^{-1.4192} = 5\,475\ \mathrm{Pa}$ and $\rho = 0.0880\ \mathrm{kg/m^3}$ — the anchor values for the next layer in the table. Between 11 and 20 km the density falls by a factor of 4.13, which is $e^{9000/6342}$, as the scale height predicts.
:::

## The exponential atmosphere

For analysis you often want density as a single smooth function. The **exponential atmosphere** takes the isothermal form and applies it to the whole lower atmosphere:

$$
\rho(h) = \rho_0\, e^{-h/H}, \qquad \rho_0 = 1.225\ \mathrm{kg/m^3},
$$

with a fitted scale height $H$ somewhere between 7.2 and 8.5 km depending on which altitude band you care about. The fit is a compromise because the true local density scale height is not constant. Differentiate $\ln\rho = \ln p - \ln T - \ln R$ with respect to $h$ in a gradient layer:

$$
\frac{d\ln\rho}{dh} = -\frac{g}{RT} - \frac{\lambda}{T} = -\frac{g + R\lambda}{RT}
\quad\Longrightarrow\quad
H_\rho = \frac{RT}{g + R\lambda}.
$$

In the troposphere $R\lambda = -1.866\ \mathrm{m/s^2}$, which makes the denominator 7.94 rather than 9.81: near the ground $H_\rho = 10.4\ \mathrm{km}$, at 250 K it is 9.0 km. In the isothermal stratosphere it drops to 6.34 km. Density therefore decays slowly at first and faster above the tropopause, and no single exponential can follow both.

Here is how the two common fits compare with the 1976 standard:

| Altitude (km) | US 1976 $\rho$ (kg/m³) | $H = 8.5$ km, ratio to standard | $H = 7.2$ km, ratio to standard |
| --- | --- | --- | --- |
| 0 | 1.225 | 1.00 | 1.00 |
| 5 | 0.7361 | 0.92 | 0.83 |
| 10 | 0.4127 | 0.92 | 0.74 |
| 13 | 0.2655 | 1.00 | 0.76 |
| 20 | 0.08803 | 1.32 | 0.87 |
| 30 | 0.01801 | 1.99 | 1.05 |
| 40 | 0.003851 | 2.88 | 1.23 |
| 50 | 0.0009775 | 3.49 | 1.21 |
| 80 | 0.00001570 | 6.38 | 1.17 |

The 8.5 km fit is within 10 % through the max-Q region, which is why the ascent exercises use it, but by 30 km it is already a factor of two high and by 80 km a factor of six. A 7.2 km scale height is a better global compromise from 20 to 80 km at the price of under-predicting the troposphere by a quarter. A least-squares fit of $\ln\rho$ over 0–80 km with $\rho_0$ fixed lands at $H \approx 7.1\ \mathrm{km}$; over 0–30 km, at about 7.5 km. Whichever you choose, use it for reasoning and rough sizing and switch to the layered standard for anything you would sign your name to.

::: key
Exponential atmosphere: $\rho = \rho_0 e^{-h/H}$ with $\rho_0 = 1.225\ \mathrm{kg/m^3}$ and $H \approx 7.2$–$8.5\ \mathrm{km}$ for the lower atmosphere. Convenient for analysis; wrong by a factor of two or more above about 30 km, because the true scale height is 6.3 km in the stratosphere and over 9 km in the troposphere.
:::

::: warning
The exponential model is a density model. Do not derive a temperature from it and do not feed it to the speed of sound. Below the tropopause the isothermal assumption behind $\rho_0 e^{-h/H}$ is false — temperature drops 71.5 K over 11 km — and the speed of sound, which depends on temperature alone, drops with it.
:::

## The speed of sound

Sound is a small pressure disturbance moving through a compressible medium, and its speed is set by how stiff the gas is against compression: $a^2 = (\partial p/\partial\rho)_s$, the derivative taken at constant entropy because the compressions in a sound wave are too fast to exchange heat. For an ideal gas an isentropic process obeys $p \propto \rho^\gamma$, where $\gamma = c_p/c_v = 1.4$ for air is the **ratio of specific heats**. Differentiating,

$$
\left(\frac{\partial p}{\partial \rho}\right)_s = \gamma\,\frac{p}{\rho} = \gamma R T,
\qquad\text{so}\qquad
a = \sqrt{\gamma R T}.
$$

Pressure and density have cancelled. The speed of sound depends on temperature and on nothing else about the state of the air. At sea level, $a = \sqrt{1.4 \times 287.053 \times 288.15} = 340.3\ \mathrm{m/s}$. At the tropopause and throughout the isothermal layer, $a = \sqrt{1.4 \times 287.053 \times 216.65} = 295.1\ \mathrm{m/s}$, 13 % lower. At 5 km, where $T = 255.65\ \mathrm{K}$, it is 320.5 m/s. In the warm stratopause near 47 km it climbs back to 329.8 m/s even though the density there is a thousandth of sea level.

::: key
Speed of sound: $a = \sqrt{\gamma R T}$ with $\gamma = 1.4$ and $R = 287.053\ \mathrm{J/(kg\cdot K)}$; at 288.15 K that is 340.3 m/s. It depends on temperature only, not on pressure or density.
:::

## Above the standard atmosphere: NRLMSISE-00

The 1976 standard stops being useful above about 86 km, and above 100 km it is the wrong tool for a different reason: the upper atmosphere is not standard. Its density at a given altitude varies by an order of magnitude with the solar cycle, with the time of day, with the season and with geomagnetic storms, because the thermosphere is heated by solar extreme-ultraviolet radiation and by particles funnelled in along the magnetic field. A fixed profile cannot represent that.

**NRLMSISE-00** (Naval Research Laboratory Mass Spectrometer and Incoherent Scatter radar, 2000 edition) is the empirical model most GNC groups use there. You give it the date and universal time, geodetic latitude, longitude and altitude, the local solar time, the 10.7 cm solar radio flux $F_{10.7}$ (both the daily value and an 81-day average) as a proxy for EUV heating, and the geomagnetic index $A_p$. It returns temperature, total mass density and the number densities of the individual species — molecular nitrogen and oxygen low down, atomic oxygen dominating from roughly 200 to 600 km, helium and hydrogen above that. It is valid from the ground to well beyond 1000 km, and below 86 km it reproduces something close to the standard profile.

The numbers explain why you need it. At 400 km, a typical low-Earth-orbit altitude, the density is of order $3 \times 10^{-12}\ \mathrm{kg/m^3}$ under moderate solar activity, but it sits closer to $5 \times 10^{-13}$ at solar minimum and can exceed $10^{-11}$ during a strong storm at solar maximum. The exospheric temperature swings from roughly 700 K to 1500 K over the same range. Drag on a satellite scales with density, so orbit-lifetime and re-entry predictions made with the wrong activity level are wrong by a factor of several. For a launch vehicle this region only matters after the atmosphere has stopped mattering — dynamic pressure at 100 km is negligible — but for entry guidance, the entry interface conventionally placed at 120 km sits squarely in it, and the density the vehicle meets in its first minute of entry is a real dispersion the guidance must absorb.

::: note
There are cousins: the Jacchia family and JB2008 (used for precision orbit work), DTM, and NASA's Earth-GRAM, which wraps a standard-like lower atmosphere, upper-atmosphere models and statistical perturbations into one tool for Monte Carlo ascent and entry simulation. The layered 1976 standard plus a measured day-of-launch wind and temperature profile is what an ascent team actually flies with; NRLMSISE-00 or a successor is what the orbit and entry teams use above it.
:::

::: warning
Keep the units of $R$ straight. The universal gas constant is $8314.32\ \mathrm{J/(kmol\cdot K)}$ and the specific constant for air is $287.053\ \mathrm{J/(kg\cdot K)}$; mixing them gives densities wrong by a factor of 29. And $T$ must be in kelvin — a lapse of 6.5 K/km is the same in degrees Celsius, but $\sqrt{\gamma R T}$ and $p/(RT)$ are not.
:::

## Check yourself

::: check
The pressure at 20 km in the standard atmosphere is 5 475 Pa. Without looking at the table, use the isothermal law and the tropopause anchor values to check that number.
:::

::: answer
From 11 to 20 km the layer is isothermal at 216.65 K, so $p = 22\,632 \exp[-g\,(9000)/(R \times 216.65)]$. The exponent is $9.80665 \times 9000/(287.053 \times 216.65) = 1.4192$, and $e^{-1.4192} = 0.2419$, giving $p = 22\,632 \times 0.2419 = 5\,475\ \mathrm{Pa}$. The density follows as $5475/(287.053 \times 216.65) = 0.0880\ \mathrm{kg/m^3}$.
:::

::: check
Compute the temperature, pressure and density at 5 km altitude from the troposphere formulas.
:::

::: answer
$T = 288.15 - 0.0065 \times 5000 = 255.65\ \mathrm{K}$. The ratio $T/T_0 = 0.88721$, and $p = 101\,325 \times 0.88721^{5.2559} = 101\,325 \times 0.5331 = 54\,020\ \mathrm{Pa}$. Then $\rho = 54\,020/(287.053 \times 255.65) = 0.7361\ \mathrm{kg/m^3}$. Equivalently $\rho = 1.225 \times 0.88721^{4.2559} = 0.7361$. About 60 % of sea-level density at the altitude a subsonic airliner climbs through in ten minutes and a launcher in forty-five seconds.
:::

::: check
An exponential atmosphere with $H = 8.5\ \mathrm{km}$ is used in an ascent simulation. Estimate the ratio of its density to the standard value at 13 km and at 30 km, and say what that does to a drag computation at each altitude.
:::

::: answer
At 13 km the fit gives $1.225\,e^{-13/8.5} = 0.2654$ against a standard 0.2655 — essentially exact, so drag there is right. At 30 km the fit gives $1.225\,e^{-30/8.5} = 0.0359$ against 0.0180, a factor of 1.99 too high, so drag is overestimated by a factor of two. Fortunately dynamic pressure at 30 km is only a few percent of its peak, so the integrated drag loss is only mildly affected; but any quantity evaluated locally at 30 km — a fairing-jettison heating check, say — would be badly wrong.
:::

::: check
Why does the speed of sound fall from 340 m/s at sea level to 295 m/s at 11 km, yet the density falls by a factor of 3.4 over the same climb? Which quantity would you need to know to compute the sound speed at 47 km?
:::

::: answer
The speed of sound is $\sqrt{\gamma R T}$ and depends only on temperature, which drops from 288.15 to 216.65 K: $\sqrt{216.65/288.15} = 0.867$, and $0.867 \times 340.3 = 295.1\ \mathrm{m/s}$. Density is a separate quantity governed by the hydrostatic integral, and it falls far faster. At 47 km you need only the temperature, 270.65 K, which gives $\sqrt{1.4 \times 287.053 \times 270.65} = 329.8\ \mathrm{m/s}$ — higher than at 11 km despite the density being lower by a factor of 250.
:::

::: check
A satellite operator asks for the density at 400 km for a decay prediction. Why is the US Standard Atmosphere 1976 the wrong model, and what inputs does the right one need?
:::

::: answer
The 1976 standard is a fixed profile defined only to 86 km (with an extension to 1000 km that assumes mean conditions), while the real thermospheric density at 400 km varies by an order of magnitude with solar and geomagnetic activity. NRLMSISE-00 is built for this: it takes the date and time, position (latitude, longitude, altitude), local solar time, the daily and 81-day-average $F_{10.7}$ solar flux and the geomagnetic $A_p$ index, and returns temperature, total density and species densities. Under moderate activity the answer is of order $3 \times 10^{-12}\ \mathrm{kg/m^3}$, but it can be five times lower at solar minimum or several times higher during a storm.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $dp/dh = -\rho g$ | hydrostatic equilibrium |
| $p = \rho R T$, $R = 287.053\ \mathrm{J/(kg\cdot K)}$ | ideal gas law for air |
| Isothermal layer | $p = p_b \exp[-g(h-h_b)/(RT_b)]$, scale height $H = RT/g$ (6.34 km at 216.65 K) |
| Gradient layer, lapse $\lambda$ | $p = p_b (T/T_b)^{-g/(R\lambda)}$; troposphere exponent 5.2559, density exponent 4.2559 |
| Sea level | 288.15 K, 101 325 Pa, 1.225 kg/m³, lapse 6.5 K/km |
| Tropopause, 11 km | 216.65 K, 22 632 Pa, 0.3639 kg/m³; isothermal to 20 km |
| Exponential model | $\rho = \rho_0 e^{-h/H}$, $H \approx 7.2$–8.5 km; factor-of-two errors above ~30 km |
| Speed of sound | $a = \sqrt{\gamma R T}$, $\gamma = 1.4$; 340.3 m/s at 288.15 K, 295.1 m/s at 216.65 K |
| NRLMSISE-00 | empirical thermosphere model driven by $F_{10.7}$ and $A_p$; density at 400 km varies tenfold with activity |

The next lesson multiplies this density profile by the square of the vehicle's speed. The product, dynamic pressure, rises and then falls during ascent, and its peak — max-Q — is the single number that most constrains an ascending launcher.
