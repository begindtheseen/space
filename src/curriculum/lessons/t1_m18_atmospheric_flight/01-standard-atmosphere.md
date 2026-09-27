---
id: l01-standard-atmosphere
title: The standard atmosphere
minutes: 22
covers:
  - "standard atmosphere models: US Standard 1976, exponential, NRLMSISE-00"
  - density, pressure and temperature vs altitude
---

Take a bag of chips on an airplane. At cruising height it puffs up like a pillow. Nothing got into the bag: the air *outside* got thinner, so the air sealed inside pushes the bag out.

The air around Earth is a pile. Like a stack of pillows, the bottom layers are squashed by everything above them. Higher up there is less on top, so the air is looser. At 50 km it is about a thousand times thinner than at the ground.

A rocket flies up through that pile, and every force the air puts on it — **drag**, the air pushing back against the motion, and the sideways push that tries to bend it — depends on how thick the air is right there. The speed of sound matters too, and it changes with height in a bumpy way. So before you can work out a single force on a climbing rocket, you need a model of the air at every **altitude** (height above sea level).

Engineers meet that model in three forms:

- the **US Standard Atmosphere 1976** — an agreed, layer-by-layer table up to 86 km that every ascent simulation starts from;
- the **exponential atmosphere** — a one-line shortcut, $\rho = \rho_0 e^{-h/H}$, good for reasoning;
- **NRLMSISE-00** — a model of the thin upper air above about 100 km, which swells and shrinks with the Sun.

This lesson builds the first two from two laws of physics, then explains what the third adds.

## Air is a pile: the weight of the air above

Picture a thin slab of air, like one pillow in the stack, at height $h$. It has a bottom face and a top face, each with area $A$, and it is $dh$ thick. Read $dh$ as "d h": a tiny step in height.

Three forces act on the slab:

1. The air below pushes up on the bottom face with pressure $p$. The force is $pA$.
2. The air above pushes down on the top face with a slightly different pressure, $p + dp$. The force is $(p + dp)A$.
3. Gravity pulls the slab's own mass down. Its volume is $A\,dh$, so its mass is $\rho A\,dh$, where $\rho$ (the Greek letter "rho") is the **density** — mass per cubic metre. Its weight is $\rho g A\,dh$, with $g$ the pull of gravity.

The air is not flying off, so up balances down:

$$
pA = (p + dp)A + \rho g A\,dh.
$$

Cancel $pA$ from both sides, then divide everything by $A\,dh$:

$$
\frac{dp}{dh} = -\rho\, g.
$$

Read $\frac{dp}{dh}$ as "d p d h": how fast pressure changes as you go up. The minus sign says it *falls*. This balance is **[[hydrostatic equilibrium|slab-picture]]** ("hydrostatic" means "fluid standing still"): the pressure at any height is the weight of all the air above it, per square metre.

## The second law: the ideal gas law

We cannot solve that yet, because squashed air gets denser: $\rho$ changes with $p$. The link between them is the **ideal gas law**, written the way engineers use it for air:

$$
p = \rho R T.
$$

Here $T$ is the temperature in **[[kelvin|why-kelvin]]** ($0\,^\circ\mathrm{C}$ is $273.15\,\mathrm{K}$), and $R$ is the **specific gas constant** for air: the universal gas constant divided by the average mass of a "mole" of air,

$$
R = \frac{8314.32}{28.9644} = 287.053\ \mathrm{J/(kg\cdot K)}.
$$

In words: denser air pushes harder, and hotter air pushes harder.

Now combine the two laws. Rearrange the gas law to $\rho = p/(RT)$ and put that into the hydrostatic equation:

$$
\frac{dp}{dh} = -\frac{p\,g}{R\,T}.
$$

Divide both sides by $p$ and multiply by $dh$:

$$
\frac{dp}{p} = -\frac{g}{R\,T(h)}\,dh.
$$

Everything now hangs on how temperature changes with height, $T(h)$. Know that, and you can solve for $p(h)$, then get $\rho = p/(RT)$. Two cases cover the lower atmosphere: layers where the temperature stays the same, and layers where it changes steadily.

## Case one: a layer at constant temperature

Suppose the temperature is a fixed $T_b$ all through a layer that starts at height $h_b$, where the pressure is $p_b$. (The little "b" means "at the base of the layer".) The right side of our equation is now a constant times $dh$. Add up ("integrate") both sides from the base to height $h$. The left side gives the natural logarithm $\ln$, and the right side gives a straight line:

$$
\ln\frac{p}{p_b} = -\frac{g\,(h-h_b)}{R\,T_b}
\quad\Longrightarrow\quad
p = p_b \exp\!\left[-\frac{g\,(h-h_b)}{R\,T_b}\right].
$$

(The arrow undoes the logarithm: $\exp[x]$ means $e^x$, with $e \approx 2.718$.) With $T$ constant, the density $\rho = p/(RT_b)$ has the same shape.

This is **exponential decay**, the same shape as a cup of cocoa cooling toward room temperature. Every fixed climb multiplies the pressure by the same fraction. The climb that cuts it by a factor of $e$ is the **[[scale height|e-folding]]**:

$$
H = \frac{R\,T}{g}.
$$

In the layer from 11 to 20 km, where $T = 216.65\ \mathrm{K}$, that is

$$
H = \frac{287.053 \times 216.65}{9.80665} = 6342\ \mathrm{m}.
$$

At the sea-level temperature of 288.15 K it would be 8435 m. Warm air is "taller": you have to climb farther to lose the same share of the pressure.

## Case two: a layer where the temperature changes steadily

Near the ground, the air gets colder as you go up. Hikers know this: mountain tops have snow in summer. In the lowest layer the temperature drops by the same amount for each metre of climb. Write that as

$$
T = T_b + \lambda\,(h - h_b),
$$

where $\lambda$ ("lambda") is the **[[lapse rate|lapse-rate]]** — the change in temperature per metre of height. It is negative when the air cools as you climb.

Now solve for the pressure, one step at a time. First, a small step up $dh$ changes the temperature by $dT = \lambda\,dh$, so $dh = dT/\lambda$. Put that into $\frac{dp}{p} = -\frac{g}{RT}\,dh$:

$$
\frac{dp}{p} = -\frac{g}{R\,\lambda}\,\frac{dT}{T}.
$$

Both sides now have the form "a small change divided by the thing itself", and integrating each gives a logarithm:

$$
\ln\frac{p}{p_b} = -\frac{g}{R\lambda}\,\ln\frac{T}{T_b}.
$$

A number times a logarithm is the logarithm of a power ($k\ln x = \ln x^k$), so undoing the logarithms gives

$$
p = p_b\left(\frac{T}{T_b}\right)^{-g/(R\lambda)}.
$$

In the lowest layer, the **troposphere**, $\lambda = -6.5\ \mathrm{K/km} = -0.0065\ \mathrm{K/m}$. The power is

$$
-\frac{g}{R\lambda} = \frac{9.80665}{287.053 \times 0.0065} = 5.2559.
$$

The density is $p/(RT)$. Dividing by one more $T$ knocks one off the power:

$$
\rho = \rho_b\left(\frac{T}{T_b}\right)^{-g/(R\lambda) - 1}, \qquad -\frac{g}{R\lambda} - 1 = 4.2559 .
$$

These two powers, 5.2559 for pressure and 4.2559 for density, are exactly what the `us1976` coding exercise asks you to build.

## The US Standard Atmosphere 1976

Real air changes every day, but engineers need one agreed profile so that two teams simulating the same rocket get the same answer. The **US Standard Atmosphere 1976** gives the temperature as seven straight-line pieces from sea level to 86 km. The pressure at each layer's base comes from working up through the layers below with the two cases you just derived.

Sea level is fixed at $T_0 = 288.15\ \mathrm{K}$ ($15\,^\circ\mathrm{C}$) and $p_0 = 101\,325\ \mathrm{Pa}$, one atmosphere. So the density there is $\rho_0 = p_0/(RT_0) = 1.225\ \mathrm{kg/m^3}$. Working upward:

| Layer | Base $h_b$ (km) | $T_b$ (K) | $\lambda$ (K/km) | $p_b$ (Pa) | $\rho_b$ (kg/m³) |
| --- | --- | --- | --- | --- | --- |
| Troposphere | 0 | 288.15 | −6.5 | 101 325 | 1.225 |
| Lower stratosphere | 11 | 216.65 | 0 | 22 632 | 0.3639 |
| Stratosphere | 20 | 216.65 | +1.0 | 5 474.9 | 0.08803 |
| Stratosphere | 32 | 228.65 | +2.8 | 868.02 | 0.01322 |
| Stratopause | 47 | 270.65 | 0 | 110.91 | 0.001428 |
| Mesosphere | 51 | 270.65 | −2.8 | 66.939 | 0.000862 |
| Mesosphere | 71 | 214.65 | −2.0 | 3.9564 | 0.0000642 |

Look at the [[shape of the temperature|temperature-profile]]. It falls to 216.65 K at the **tropopause**, the top of the troposphere, at 11 km. It holds steady to 20 km. Then it *rises* through the stratosphere, because **[[ozone|ozone-heating]]** there soaks up the Sun's ultraviolet light. It peaks at 270.65 K near 47 km, then falls again through the mesosphere.

Pressure and density are simpler: they fall the whole way up, because the weight of air above you always shrinks as you climb.

One fine point. Gravity weakens a little with height. Instead of letting $g$ change, the standard keeps $g$ fixed at $g_0 = 9.80665\ \mathrm{m/s^2}$ and stretches the height scale to make up for it. That stretched height is the **geopotential altitude**, $h_{\text{geopot}} = r_0 h / (r_0 + h)$, with $r_0 = 6\,356\,766\ \mathrm{m}$. At 20 km it differs from true height by only 63 m, so below 30 km you can ignore it in this module. (The tables in this lesson use geopotential heights; far up the gap matters — at a true 80 km the density is about 18 % higher than the table's 80 km value.)

::: key
US Standard Atmosphere 1976 anchor values. Sea level: $T = 288.15\ \mathrm{K}$, $p = 101\,325\ \mathrm{Pa}$, $\rho = 1.225\ \mathrm{kg/m^3}$, lapse rate 6.5 K/km. Tropopause (11 km): $T = 216.65\ \mathrm{K}$, $p = 22\,632\ \mathrm{Pa}$, $\rho = 0.3639\ \mathrm{kg/m^3}$. Between 11 and 20 km the atmosphere is isothermal (same temperature throughout) at 216.65 K, so pressure and density decay exponentially with a scale height $H = RT/g_0 = 6.34\ \mathrm{km}$.
:::

::: example Conditions at the tropopause
Start at sea level and climb 11 km through the troposphere.

**Temperature.** It drops 0.0065 K for every metre:

$$
T = 288.15 - 0.0065 \times 11\,000 = 288.15 - 71.5 = 216.65\ \mathrm{K}.
$$

**Pressure.** The temperature ratio is $216.65/288.15 = 0.75187$. Raise it to the power 5.2559 and multiply by the sea-level pressure:

$$
p = 101\,325 \times 0.75187^{5.2559} = 101\,325 \times 0.22336 = 22\,632\ \mathrm{Pa}.
$$

**Density.** Use the gas law, $\rho = p/(RT)$:

$$
\rho = \frac{22\,632}{287.053 \times 216.65} = 0.3639\ \mathrm{kg/m^3}.
$$

Sanity check: the density ratio is $0.3639/1.225 = 0.297$, and the pressure ratio is $0.223$. Density fell less than pressure because the air also got colder, and cold air is denser at the same pressure. So near the height where the air pushes hardest on a rocket, it is about 30 % as dense as at the pad.
:::

::: example Into the constant-temperature layer
Keep climbing to 15 km. That is in the 216.65 K layer starting at 11 km, so use case one with a climb of $15\,000 - 11\,000 = 4000$ m.

**The power of e.** $\dfrac{g\,(h - h_b)}{R\,T_b} = \dfrac{9.80665 \times 4000}{287.053 \times 216.65} = 0.6308$.

**Pressure and density.**

$$
p(15\ \mathrm{km}) = 22\,632\, e^{-0.6308} = 12\,045\ \mathrm{Pa}, \qquad
\rho = \frac{12\,045}{287.053 \times 216.65} = 0.1937\ \mathrm{kg/m^3}.
$$

Sanity check: from 11 to 15 km the density falls by $0.3639/0.1937 = 1.88$. The scale height predicts $e^{4000/6342} = 1.88$. They agree.
:::

## The exponential atmosphere

The layered standard is clumsy for pencil work. The **exponential atmosphere** takes the constant-temperature shape and stretches it over the whole lower atmosphere:

$$
\rho(h) = \rho_0\, e^{-h/H}, \qquad \rho_0 = 1.225\ \mathrm{kg/m^3},
$$

with one chosen ("fitted") scale height $H$ between 7.2 and 8.5 km, depending on which heights you care about most.

Why can one number not fit everywhere? Because the real scale height for density changes with height. In a layer where temperature changes, the density scale height works out to

$$
H_\rho = \frac{RT}{g + R\lambda}.
$$

In the troposphere $R\lambda = -1.866\ \mathrm{m/s^2}$, so the bottom is $9.807 - 1.866 = 7.94$. That makes $H_\rho = 10.4\ \mathrm{km}$ near the ground and 9.0 km at 250 K, but 6.34 km in the stratosphere. Density thins slowly at first, then faster above the tropopause, and no single exponential follows both.

::: note Why it has to be true
Take logarithms of the gas law written as $\rho = p/(RT)$: $\ln\rho = \ln p - \ln T - \ln R$. Now ask how each piece changes per metre of height. From the hydrostatic and gas laws, $\frac{d\ln p}{dh} = \frac{1}{p}\frac{dp}{dh} = -\frac{g}{RT}$. From $T = T_b + \lambda(h - h_b)$, $\frac{d\ln T}{dh} = \frac{\lambda}{T}$. And $R$ is constant. So

$$
\frac{d\ln\rho}{dh} = -\frac{g}{RT} - \frac{\lambda}{T} = -\frac{g + R\lambda}{RT}
\quad\Longrightarrow\quad
H_\rho = \frac{RT}{g + R\lambda}.
$$

When $\lambda = 0$ this goes back to $H = RT/g$, as it should.
:::

How two common fits compare with the standard (a ratio above 1 means the shortcut's air is too thick):

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

The 8.5 km fit stays within 10 % up to 13 km, where the air pushes hardest on a rocket, which is why the ascent exercises use it. By 30 km it is twice too thick, and by 80 km six times. A 7.2 km fit is better from 20 to 80 km but makes the troposphere a quarter too thin. (A best fit of $\ln\rho$ with $\rho_0$ fixed gives $H \approx 7.1\ \mathrm{km}$ over 0–80 km and about 7.5 km over 0–30 km.) Use the shortcut for reasoning and rough sizing; for anything you would sign your name to, use the layered standard.

::: key
Exponential atmosphere: $\rho = \rho_0 e^{-h/H}$ with $\rho_0 = 1.225\ \mathrm{kg/m^3}$ and $H \approx 7.2$–$8.5\ \mathrm{km}$ for the lower atmosphere. Convenient for analysis; wrong by a factor of two or more above about 30 km, because the true scale height is 6.3 km in the stratosphere and over 9 km in the troposphere.
:::

::: warning Density only
The exponential model is a *density* model. Do not get a temperature out of it, and do not feed it to the speed of sound. It pretends the temperature is constant, but below the tropopause the temperature drops 71.5 K over 11 km. The speed of sound depends on temperature alone, so it drops too.
:::

## The speed of sound

Push the first person in a line, and they bump the next, who bumps the next: the push travels down the line. **Sound** is the same thing in air, a tiny squeeze handed from molecule to molecule. Its speed depends on how springy the air is:

$$
a = \sqrt{\gamma R T}.
$$

Here $a$ is the **speed of sound**, and $\gamma$ ("gamma") is the **ratio of specific heats**, a number that measures how springy the gas is. For air, $\gamma = 1.4$.

Notice what is missing: pressure and density. The speed of sound depends on temperature alone. At sea level, $a = \sqrt{1.4 \times 287.053 \times 288.15} = 340.3\ \mathrm{m/s}$. At 5 km ($T = 255.65\ \mathrm{K}$) it is 320.5 m/s. From 11 to 20 km ($T = 216.65\ \mathrm{K}$) it is $\sqrt{1.4 \times 287.053 \times 216.65} = 295.1\ \mathrm{m/s}$, 13 % lower. In the warm air near 47 km it climbs back to 329.8 m/s, though the density there is about a thousandth of sea level.

::: note Why it has to be true
The speed of sound is set by how much the pressure rises when you squeeze the density a little: $a^2 = \partial p/\partial\rho$, taken with no heat flowing in or out, because the squeezes in a sound wave are too quick to trade heat. Such a squeeze is called **isentropic**, and for an ideal gas it obeys $p \propto \rho^\gamma$, where $\gamma = c_p/c_v$ compares the heat needed to warm the gas at constant pressure and at constant volume. Differentiate $p = k\rho^\gamma$:

$$
\left(\frac{\partial p}{\partial \rho}\right)_s = \gamma k \rho^{\gamma - 1} = \gamma\,\frac{p}{\rho} = \gamma R T,
\qquad\text{so}\qquad
a = \sqrt{\gamma R T}.
$$

The last step used the gas law, $p/\rho = RT$. That is where pressure and density cancel.
:::

::: key
Speed of sound: $a = \sqrt{\gamma R T}$ with $\gamma = 1.4$ and $R = 287.053\ \mathrm{J/(kg\cdot K)}$; at 288.15 K that is 340.3 m/s. It depends on temperature only, not on pressure or density.
:::

## Above the standard atmosphere: NRLMSISE-00

Above 100 km the 1976 standard is the wrong tool, because the air there is not "standard" at all. It is heated by the Sun's **extreme ultraviolet** light and by charged particles steered in along Earth's magnetic field. At a fixed height its density can change tenfold with the Sun's 11-year cycle, the time of day, the season and magnetic storms. One fixed table cannot hold that.

**NRLMSISE-00** (Naval Research Laboratory, Mass Spectrometer and Incoherent Scatter radar, 2000 edition) is the model most teams use there. It is **empirical** — fitted to measurements, not derived from two laws. You give it:

- the date and universal time;
- latitude, longitude and altitude, and the local solar time;
- the **[[10.7 cm solar radio flux|solar-flux]]** $F_{10.7}$, both the day's value and an 81-day average, as a stand-in for how hard the Sun is heating the air;
- the **geomagnetic index** $A_p$, a measure of magnetic-storm activity.

It returns the temperature, the total density, and the amount of each gas: nitrogen and oxygen molecules low down, single oxygen atoms from roughly 200 to 600 km, helium and hydrogen above. It works from the ground to beyond 1000 km.

At 400 km, a typical low-orbit height, the density is about $3 \times 10^{-12}\ \mathrm{kg/m^3}$ with a moderately active Sun, closer to $5 \times 10^{-13}$ at solar minimum, and past $10^{-11}$ in a strong storm at solar maximum. The temperature at the top of the atmosphere swings from roughly 700 K to 1500 K. Drag grows with density, so a prediction of when a satellite falls, made with the wrong Sun, can be off by a factor of several.

For a rocket going *up*, the air's push at 100 km is negligible. But a vehicle coming *back* starts its **entry** — the plunge back into the air — at an agreed "entry interface" of 120 km, right in this region, and its guidance must absorb the uncertain density it meets there.

::: note Other models you will hear about
The Jacchia family and JB2008 are used for precise orbit work, and DTM is a European model. NASA's **[[Earth-GRAM|day-of-launch]]** bundles a lower atmosphere, upper-atmosphere models and random variations into one tool for simulating thousands of ascents and entries. In practice an ascent team flies with the 1976 standard plus winds and temperatures measured on launch day; orbit and entry teams use NRLMSISE-00 or a successor.
:::

::: warning Units of R and T
The universal gas constant is $8314.32\ \mathrm{J/(kmol\cdot K)}$; the specific constant for air is $287.053\ \mathrm{J/(kg\cdot K)}$. Mix them up and your densities are off by a factor of 29. And $T$ must be in kelvin: a lapse of 6.5 K/km equals 6.5 °C/km, but $\sqrt{\gamma R T}$ and $p/(RT)$ need temperature measured from absolute zero.
:::

## Check yourself

::: check
The pressure at 20 km in the standard atmosphere is 5 475 Pa. Without looking at the table, use the constant-temperature law and the tropopause values to check that number.
:::

::: answer
From 11 to 20 km the layer stays at 216.65 K, so $p = 22\,632 \exp[-g\,(9000)/(R \times 216.65)]$.

The power is $\dfrac{9.80665 \times 9000}{287.053 \times 216.65} = 1.4192$, and $e^{-1.4192} = 0.2419$.

So $p = 22\,632 \times 0.2419 = 5\,475\ \mathrm{Pa}$. The density follows as $5475/(287.053 \times 216.65) = 0.0880\ \mathrm{kg/m^3}$ — the base values of the next layer in the table, as they must be. From 11 to 20 km the density fell by $0.3639/0.08803 = 4.13$, which is $e^{9000/6342}$, as the scale height predicts.
:::

::: check
Work out the temperature, pressure and density at 5 km from the troposphere formulas.
:::

::: answer
**Temperature:** $T = 288.15 - 0.0065 \times 5000 = 288.15 - 32.5 = 255.65\ \mathrm{K}$.

**Pressure:** the ratio is $T/T_0 = 255.65/288.15 = 0.88721$, and $p = 101\,325 \times 0.88721^{5.2559} = 101\,325 \times 0.5331 = 54\,020\ \mathrm{Pa}$.

**Density:** $\rho = 54\,020/(287.053 \times 255.65) = 0.7361\ \mathrm{kg/m^3}$. The density power gives the same: $1.225 \times 0.88721^{4.2559} = 0.7361$.

That is about 60 % of sea-level density — reached by an airliner about ten minutes after takeoff, and by a launcher in about forty-five seconds.
:::

::: check
An ascent simulation uses an exponential atmosphere with $H = 8.5\ \mathrm{km}$. Estimate the ratio of its density to the standard value at 13 km and at 30 km, and say what that does to a drag calculation at each height.
:::

::: answer
**At 13 km:** the fit gives $1.225\,e^{-13/8.5} = 0.2654$, against the standard 0.2655. That is essentially exact, so drag there comes out right.

**At 30 km:** the fit gives $1.225\,e^{-30/8.5} = 0.0359$, against 0.0180. That is $0.0359/0.0180 = 1.99$, twice too thick, so drag there is twice too big.

Luckily the air's push at 30 km is only a few percent of its peak, so the total speed lost to drag is only a little off. But anything worked out *at* 30 km — a heating check before dropping the nose fairing, say — would be badly wrong.
:::

::: check
The speed of sound falls from 340 m/s at sea level to 295 m/s at 11 km, a drop of only 13 %. Over the same climb the density falls by a factor of 3.4. Why so different? And what would you need to know to find the speed of sound at 47 km?
:::

::: answer
The speed of sound $\sqrt{\gamma R T}$ depends only on temperature, which drops from 288.15 to 216.65 K. It scales as the square root of that ratio: $\sqrt{216.65/288.15} = 0.867$, and $0.867 \times 340.3 = 295.1\ \mathrm{m/s}$. Density is set by the weight of air above, and it falls much faster.

At 47 km you need only the temperature, 270.65 K: $\sqrt{1.4 \times 287.053 \times 270.65} = 329.8\ \mathrm{m/s}$. That is *higher* than at 11 km, even though the density at 47 km is about 250 times lower.
:::

::: check
A satellite operator asks for the density at 400 km to predict when the satellite will fall. Why is the US Standard Atmosphere 1976 the wrong model, and what does the right one need as inputs?
:::

::: answer
The 1976 standard is one fixed profile: detailed layers to 86 km, and an extension to 1000 km that assumes average conditions. The real density at 400 km changes tenfold with the Sun and magnetic storms.

NRLMSISE-00 is built for this. It takes the date and time; the position (latitude, longitude, altitude); the local solar time; the day's and the 81-day average $F_{10.7}$ solar flux; and the geomagnetic $A_p$ index. It returns the temperature, the total density and the density of each gas. With a moderately active Sun the answer is about $3 \times 10^{-12}\ \mathrm{kg/m^3}$, but it can be several times lower at solar minimum or several times higher in a storm.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $dp/dh = -\rho g$ | hydrostatic equilibrium: pressure is the weight of the air above |
| $p = \rho R T$, $R = 287.053\ \mathrm{J/(kg\cdot K)}$ | ideal gas law for air; $T$ in kelvin |
| Constant-temperature layer | $p = p_b \exp[-g(h-h_b)/(RT_b)]$, scale height $H = RT/g$ (6.34 km at 216.65 K) |
| Steady-lapse layer, $\lambda$ | $p = p_b (T/T_b)^{-g/(R\lambda)}$; troposphere power 5.2559 for pressure, 4.2559 for density |
| Sea level | 288.15 K, 101 325 Pa, 1.225 kg/m³, lapse 6.5 K/km |
| Tropopause, 11 km | 216.65 K, 22 632 Pa, 0.3639 kg/m³; constant temperature to 20 km |
| Exponential model | $\rho = \rho_0 e^{-h/H}$, $H \approx 7.2$–8.5 km; off by a factor of two above ~30 km |
| Speed of sound | $a = \sqrt{\gamma R T}$, $\gamma = 1.4$; 340.3 m/s at 288.15 K, 295.1 m/s at 216.65 K |
| NRLMSISE-00 | measured-data model of the upper air, driven by $F_{10.7}$ and $A_p$; density at 400 km varies tenfold |

The next lesson multiplies this density by the square of the rocket's speed. That product, the dynamic pressure, rises and then falls on the way up, and its peak — max-Q — is the single number that most limits how a launcher is built and flown.

::: context slab-picture One slab of air, three forces
Zoom in on one thin slab of air. The air underneath pushes it up. The air on top pushes it down, a little less hard. Its own weight pulls it down too. For the slab to stay put, the push from below must be bigger than the push from above by exactly the slab's weight.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="110" y="70" width="140" height="40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="95" font-size="12" text-anchor="middle" fill="#1f2a44">air, density ρ</text>
  <line x1="180" y1="20" x2="180" y2="62" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="180,70 174,58 186,58" fill="#1d6fd1"/>
  <text x="192" y="36" font-size="12" fill="#1d6fd1">(p + dp) A, from above</text>
  <line x1="180" y1="160" x2="180" y2="118" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="180,110 174,122 186,122" fill="#1d6fd1"/>
  <text x="192" y="152" font-size="12" fill="#1d6fd1">p A, from below</text>
  <line x1="280" y1="80" x2="280" y2="122" stroke="#b4232c" stroke-width="3"/>
  <polygon points="280,130 274,118 286,118" fill="#b4232c"/>
  <text x="290" y="100" font-size="12" fill="#b4232c">weight</text>
  <text x="290" y="114" font-size="12" fill="#b4232c">ρ g A dh</text>
  <line x1="92" y1="70" x2="92" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="84" y="94" font-size="12" text-anchor="end" fill="#6c7a93">dh</text>
</svg>
```

Stack these slabs all the way up, and the pressure at the bottom is the weight of the whole column above.
:::

::: context why-kelvin Why temperatures here start at absolute zero
The gas law says pressure is proportional to temperature. That only works if "zero temperature" means "no heat motion at all", so that twice the temperature really is twice the jiggling of the molecules. The Celsius zero is just where water freezes; the kelvin zero, $-273.15\,^\circ\mathrm{C}$, is absolute zero. A step of one kelvin is the same size as a step of one degree Celsius, so differences and lapse rates are the same in both. Only formulas that use $T$ itself, like $p/(RT)$ and $\sqrt{\gamma R T}$, need kelvin.
:::

::: context e-folding The "e-folding" height
Engineers call a drop by a factor of $e \approx 2.718$ an **e-folding**. So the scale height is the "e-folding height". After one scale height the density is $1/e \approx 37\,\%$ of where it started; after two, $1/e^2 \approx 14\,\%$; after three, 5 %.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="180" x2="330" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="180" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,30.0 49.0,44.3 58.0,57.2 67.0,68.9 76.0,79.5 85.0,89.0 94.0,97.7 103.0,105.5 112.0,112.6 121.0,119.0 130.0,124.8 139.0,130.1 148.0,134.8 157.0,139.1 166.0,143.0 175.0,146.5 184.0,149.7 193.0,152.6 202.0,155.2 211.0,157.6 220.0,159.7 229.0,161.6 238.0,163.4 247.0,165.0 256.0,166.4 265.0,167.7 274.0,168.9 283.0,169.9 292.0,170.9 301.0,171.7 310.0,172.5"/>
  <line x1="130" y1="180" x2="130" y2="124.8" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="40" y1="124.8" x2="130" y2="124.8" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="220" y1="180" x2="220" y2="159.7" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="40" y1="159.7" x2="220" y2="159.7" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <circle cx="130" cy="124.8" r="3.5" fill="#b4232c"/>
  <circle cx="220" cy="159.7" r="3.5" fill="#b4232c"/>
  <g font-size="12" fill="#1f2a44">
    <text x="34" y="34" text-anchor="end">1</text>
    <text x="34" y="128" text-anchor="end">0.37</text>
    <text x="34" y="163" text-anchor="end">0.14</text>
    <text x="40" y="196" text-anchor="middle">0</text>
    <text x="130" y="196" text-anchor="middle">H</text>
    <text x="220" y="196" text-anchor="middle">2H</text>
    <text x="310" y="196" text-anchor="middle">3H</text>
    <text x="150" y="60" fill="#1d6fd1">ρ / ρ₀ = e^(−h/H)</text>
    <text x="330" y="172" text-anchor="end">height →</text>
  </g>
</svg>
```
:::

::: context lapse-rate Why air cools as you climb
Air near the ground is warmed by the ground, which is warmed by sunlight. When a blob of that air rises, it moves into lower pressure, so it expands. Expanding takes energy, and the blob pays for it with its own heat, so it cools. It is the reverse of a bike pump, which gets warm when you squash the air inside it. Real air, with water vapor and weather, averages out to about 6.5 °C colder per kilometre — which is the number the standard adopts. Climb a 3 km mountain and it is about 20 °C colder at the top.
:::

::: context temperature-profile The zig-zag of temperature
Temperature in the 1976 standard is seven straight pieces. It falls, holds steady, rises to a warm layer near 50 km, then falls again. Pressure and density, by contrast, fall smoothly the whole way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="200" x2="330" y2="200" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="60" y1="200" x2="60" y2="14" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="297.9,200.0 140.6,176.9 140.6,158.0 167.0,132.8 259.4,101.3 259.4,92.9 136.2,50.9 75.3,21.8"/>
  <g stroke="#6c7a93" stroke-dasharray="3 3">
    <line x1="60" y1="176.9" x2="330" y2="176.9"/>
    <line x1="60" y1="101.3" x2="330" y2="101.3"/>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="54" y="204" text-anchor="end">0</text>
    <text x="54" y="180" text-anchor="end">11</text>
    <text x="54" y="161" text-anchor="end">20</text>
    <text x="54" y="105" text-anchor="end">47</text>
    <text x="54" y="23" text-anchor="end">86 km</text>
    <text x="104" y="214" text-anchor="middle">200 K</text>
    <text x="214" y="214" text-anchor="middle">250 K</text>
    <text x="324" y="214" text-anchor="middle">300 K</text>
    <text x="236" y="190">troposphere</text>
    <text x="178" y="150">stratosphere</text>
    <text x="178" y="70">mesosphere</text>
  </g>
</svg>
```

The warm bump near 47 km is why the speed of sound there climbs back almost to its sea-level value.
:::

::: context ozone-heating Ozone, the atmosphere's sunscreen
Ozone is a molecule made of three oxygen atoms. Most of it sits between about 15 and 35 km. It absorbs the Sun's ultraviolet light — the kind that gives you sunburn — and turns that energy into heat. So the stratosphere is warmed from inside, and it gets *warmer* with height instead of colder. That warm lid also stops weather from rising much above the tropopause, which is why thunderstorm tops flatten out into an anvil shape near 10–15 km.
:::

::: context solar-flux Measuring the Sun with a radio
The Sun's extreme ultraviolet light, which heats the upper air, cannot get through the atmosphere to be measured from the ground. But radio waves 10.7 cm long can, and they rise and fall with the same solar activity. Canadian observatories have measured this "F10.7" flux every day since 1947, which gives a long, steady record. That is why atmosphere models use it as a stand-in for how hard the Sun is heating the upper air.
:::

::: context day-of-launch What the launch team actually uses
The standard atmosphere is an average, and no real day is average. Before a launch, weather teams send up weather balloons and use other sensors to measure the actual winds, temperatures and densities along the flight path. Those measurements go into the final trajectory checks, sometimes only hours before lift-off. Tools like Earth-GRAM fill in the other side: they generate thousands of plausible atmospheres, so engineers can check the rocket survives the bad ones too. You will meet winds and gusts properly in a later lesson of this module.
:::
