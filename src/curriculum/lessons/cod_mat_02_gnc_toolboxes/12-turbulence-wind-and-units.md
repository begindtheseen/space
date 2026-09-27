---
id: l12-turbulence-wind-and-units
title: Wind, turbulence and unit conversions
minutes: 21
covers:
  - Dryden and von Karman turbulence; wind shear
  - 'Unit conversion helpers: convang, convvel, convforce, convmass, convlength'
---

Ride a bike on a windy day. There is the steady wind you lean into the whole way home. It is stronger on the open bridge than down in the sheltered street. And on top of that come the shoves: sudden puffs that push you sideways for a second and are gone. Three different things, all called "wind".

The standard atmosphere from the last lesson is perfectly still air. Real vehicles fly through all three kinds of wind. A launch vehicle's steering has to hold its nose into the airflow while the wind changes speed and direction with height. An airplane's autopilot on approach has to ride out the bumps. So a flight simulation adds a **wind model** on top of the atmosphere: a steady part, a part that changes with height, and a random part.

This lesson builds that model the way GNC teams do: **wind shear** for the change with height, and the **Dryden** and **von Kármán** models for the random bumps. The standards behind those models were written in feet and knots, so the lesson ends with the Aerospace Toolbox unit converters that keep US units from leaking into an SI simulation.

## Steady wind and wind shear

**Wind shear** is a change in wind speed or direction over a short distance, most often with height. Near the ground it comes from friction: the ground slows the air touching it, and the slowing fades as you go up. That is why the wind on a rooftop feels stronger than in the yard.

For flight simulation near the ground, the U.S. military flying-qualities specification MIL-F-8785C gives a simple profile. Measure the wind at a reference height of 20 ft, which is 6.096 m, and call it $W_{20}$ (read "W twenty"). Then the mean wind at height $h$ is

$$
u(h) = W_{20}\,\frac{\ln(h/z_0)}{\ln(20\,\mathrm{ft}/z_0)},
$$

where $\ln$ is the natural logarithm and $z_0$ is a **[[roughness length|roughness-length]]**: a small height that stands for how bumpy the ground is. The specification uses $z_0 = 0.15\,\mathrm{ft}$ (4.57 cm) for takeoff, approach and landing, and $2.0\,\mathrm{ft}$ for other phases of flight. It applies from about 3 ft up to 1,000 ft. Because the formula is a ratio, $h$ and $z_0$ may be in meters or feet, as long as both are in the same unit.

::: example Wind at the top of a landing approach
**Problem.** The wind measured at 6.096 m (20 ft) is 15 knots, which is $7.717\,\mathrm{m/s}$. Using $z_0 = 0.0457\,\mathrm{m}$, what is the wind at 30 m and at 100 m?

**Step 1: the bottom of the ratio.** $\ln(6.096/0.0457) = \ln(133.4) = 4.893$.

**Step 2: at 30 m.** $\ln(30/0.0457) = \ln(656.2) = 6.486$. So $u = 7.717 \times 6.486/4.893 = 10.23\,\mathrm{m/s}$.

**Step 3: at 100 m.** $\ln(100/0.0457) = \ln(2188) = 7.691$. So $u = 7.717 \times 7.691/4.893 = 12.13\,\mathrm{m/s}$.

**Sanity check.** The wind grows with height, fast at first and then more slowly: from 6 m to 30 m it gains 2.5 m/s, and from 30 m to 100 m, more than twice the climb, it gains only 1.9 m/s. That is the logarithm at work, and it matches the feel of a rooftop versus a much taller tower. An airplane descending from 100 m to 6 m through this profile loses about 4.4 m/s of headwind, which the autopilot must make up with thrust.
:::

Higher up, the wind is not a smooth formula. It is weather. Around 10 to 12 km, the **jet stream**, a narrow river of fast wind high up, often blows at 50 m/s or more. A launch vehicle climbing through it at a few hundred meters per second sees the airflow come at it from the side. If the vehicle flies at $300\,\mathrm{m/s}$ through a $20\,\mathrm{m/s}$ crosswind, the air meets it at an angle of $\arctan(20/300) = 3.8^\circ$. That angle, times the dynamic pressure from lesson 11, sets the bending load on the rocket, a quantity called **q-alpha**. This is why launch teams measure the winds aloft with **[[weather balloons|balloon-winds]]** before launch, and why launches are sometimes scrubbed for upper-level winds even when the pad itself is calm.

In Aerospace Blockset, the Simulink companion to Aerospace Toolbox, the **Wind Shear Model** block implements the MIL-F-8785C profile above. You will meet Simulink blocks in the next module. Here, the formula is what matters.

## Turbulence as shaped noise

Now the shoves. **Turbulence** is the random, swirling part of the wind. You cannot predict the next gust. But you can describe its character: how strong the gusts are on average, and how long a typical gust lasts.

Here is the everyday picture. Tune a radio between stations and you hear hiss, sound with every pitch mixed in equally. That is **[[white noise|white-noise]]**. Now turn the treble all the way down. The hiss becomes a low rumble. You did not make it any less random; you changed the mix of pitches. A turbulence model does exactly that: it takes white noise and passes it through a filter chosen so that the output has the same mix of slow and fast wiggles as real measured turbulence.

That mix is called the **[[power spectral density|psd]]**, or **PSD**: for each frequency, how much of the signal's wiggle-energy sits there. Big, slow gusts carry most of the energy. Small, quick ones carry less.

Two numbers set the character of turbulence:

- the **intensity** $\sigma$ (read "sigma"), the standard deviation of the gust speed in m/s: how hard it shoves on average;
- the **scale length** $L$, in meters: roughly the size of a typical gust.

A vehicle flying at airspeed $V$ crosses a gust of size $L$ in about $L/V$ seconds. The faster you fly, the shorter the bumps feel. This idea, that the vehicle sweeps through a turbulence pattern that barely changes while it passes, is called **[[frozen turbulence|frozen-turbulence]]**. It is why every turbulence model needs airspeed as an input. It needs altitude too, because the ground squeezes gusts smaller near it, and their strength also changes with height.

## The Dryden model

The **[[Dryden model|dryden-name]]** chooses its filters so that they are ordinary transfer functions, the kind you built with `tf` in lesson 1. For the gust along the flight direction, $u_g$, the filter is first order:

$$
H_u(s) = \sigma_u\sqrt{\frac{2L_u}{\pi V}}\;\frac{1}{1 + \dfrac{L_u}{V}s}.
$$

For the vertical gust $w_g$ (and, with its own $\sigma_v$ and $L_v$, the sideways gust $v_g$) it is second order:

$$
H_w(s) = \sigma_w\sqrt{\frac{L_w}{\pi V}}\;\frac{1 + \sqrt{3}\,\dfrac{L_w}{V}s}{\left(1 + \dfrac{L_w}{V}s\right)^2}.
$$

Read $L_u/V$ as the time, in seconds, to fly through one gust. It sets the filter's time constant. The square-root factor in front is chosen so that when white noise of unit strength goes in, gusts with standard deviation exactly $\sigma$ come out.

The intensities and scale lengths come from the military specifications. Below 1,000 ft, MIL-F-8785C gives them from the altitude $h$ in feet and the 20 ft wind speed:

$$
L_w = h, \qquad L_u = L_v = \frac{h}{(0.177 + 0.000823\,h)^{1.2}}, \qquad \sigma_w = 0.1\,W_{20}, \qquad \sigma_u = \sigma_v = \frac{\sigma_w}{(0.177 + 0.000823\,h)^{0.4}}.
$$

The same specification sorts turbulence into light, moderate and severe with $W_{20}$ of 15, 30 and 45 knots. Above 2,000 ft the scale lengths become a fixed 1,750 ft, and the intensities come from a table indexed by altitude and by how rare the turbulence is meant to be. Between 1,000 and 2,000 ft the models blend the two.

::: key
Dryden turbulence: a shaped-noise model of atmospheric turbulence with power spectra matched to measured data, driven by altitude and airspeed. It is how an ascent or flight simulation gets realistic wind disturbance rather than a step gust.
:::

::: example Dryden gusts on approach at 500 ft
**Problem.** An airplane flies at $V = 60\,\mathrm{m/s}$ at 500 ft (152.4 m) in light turbulence, $W_{20} = 15\,\mathrm{kt} = 7.717\,\mathrm{m/s}$. Find the Dryden parameters, build the filters and check the simulated gusts.

**Step 1: the altitude term.** With $h$ in feet, $0.177 + 0.000823 \times 500 = 0.5885$.

**Step 2: scale lengths.** $L_w = h = 152.4\,\mathrm{m}$. $L_u = 500/0.5885^{1.2} = 944.7\,\mathrm{ft} = 287.9\,\mathrm{m}$.

**Step 3: intensities.** $\sigma_w = 0.1 \times 7.717 = 0.772\,\mathrm{m/s}$. $\sigma_u = 0.772/0.5885^{0.4} = 0.954\,\mathrm{m/s}$.

**Step 4: time constants.** $L_u/V = 287.9/60 = 4.80\,\mathrm{s}$ and $L_w/V = 152.4/60 = 2.54\,\mathrm{s}$. A typical along-track gust lasts a few seconds.

**Step 5: simulate.** Feed white noise through the filters with `lsim` and check the standard deviation:

```matlab
h   = convlength(500, 'ft', 'm');      % 152.4 m
V   = 60;                              % true airspeed, m/s
W20 = convvel(15, 'kts', 'm/s');       % 7.7167 m/s
h_ft = 500;                            % the formulas are written in feet
Lu  = convlength(h_ft/(0.177 + 0.000823*h_ft)^1.2, 'ft', 'm');   % 287.93 m
Lw  = h;
sw  = 0.1*W20;                         % 0.7717 m/s
su  = sw/(0.177 + 0.000823*h_ft)^0.4;  % 0.9540 m/s

s  = tf('s');
Hu = su*sqrt(2*Lu/(pi*V)) / (1 + (Lu/V)*s);
Hw = sw*sqrt(Lw/(pi*V)) * (1 + sqrt(3)*(Lw/V)*s) / (1 + (Lw/V)*s)^2;

dt = 0.01;  t = (0:dt:3600)';          % one hour of flight
rng(1);
n1 = sqrt(pi/dt)*randn(size(t));       % white noise of unit strength
n2 = sqrt(pi/dt)*randn(size(t));
ug = lsim(Hu, n1, t);
wg = lsim(Hw, n2, t);
[std(ug) std(wg)]                      % close to [0.954 0.772]; digits vary with the random draw
```

**Sanity check.** The measured standard deviations land within a few percent of $\sigma_u$ and $\sigma_w$, which confirms the filter gains and the noise scaling. They are not exact because one hour holds only about 750 independent along-track gusts. And the gusts are a meter per second or so on a 60 m/s airplane, a bumpy ride but not a dangerous one, which is what "light" should mean.
:::

::: warning Scaling the noise to the time step
`randn` gives numbers with standard deviation 1 at every sample. That is not "white noise of unit strength": its strength depends on the time step. Halve `dt` and, without the `sqrt(pi/dt)` factor, the gusts come out about 30 percent weaker. Always check the simulated standard deviation against $\sigma$, as in the example. This single check catches most turbulence-model bugs.
:::

::: note Why the gain gives exactly sigma
The Dryden longitudinal spectrum, over temporal frequency $\omega$ in rad/s, is $\Phi_u(\omega) = \sigma_u^2\,\dfrac{2L_u}{\pi V}\,\dfrac{1}{1 + (L_u\omega/V)^2}$. The variance of a signal is the area under its spectrum. Using $\int_0^\infty \dfrac{d\omega}{1 + (c\,\omega)^2} = \dfrac{\pi}{2c}$ with $c = L_u/V$, the area is $\sigma_u^2 \cdot \dfrac{2L_u}{\pi V} \cdot \dfrac{\pi V}{2 L_u} = \sigma_u^2$. A filter $H$ driven by white noise of unit strength has output spectrum $|H(j\omega)|^2$, and $|H_u(j\omega)|^2$ is exactly $\Phi_u(\omega)$.
:::

## The von Kármán model

Dryden's filters are chosen for convenience. Measured turbulence fits a slightly different curve, the **von Kármán spectrum**:

$$
\Phi_u(\Omega) = \sigma_u^2\,\frac{2L_u}{\pi}\,\frac{1}{\left[1 + (1.339\,L_u\Omega)^2\right]^{5/6}},
$$

where $\Omega$ (read "capital omega") is a spatial frequency, in radians per meter. At the fast end the two differ. The Dryden spectrum falls as $\Omega^{-2}$, while von Kármán falls as $\Omega^{-5/3}$, the slope measured in real turbulence. So von Kármán puts more energy into the small, quick gusts: at $L\Omega = 10$ it is 1.33 times Dryden, and at $L\Omega = 100$ it is 2.85 times.

The price is that a fractional power like $5/6$ cannot come out of any finite transfer function. A von Kármán simulation has to use a filter that approximates the spectrum. MIL-F-8785C also gives it its own scale length above 2,000 ft, 2,500 ft instead of Dryden's 1,750 ft.

Which to use? Dryden is simpler, exact as a transfer function and easy to discretize, so it is common in control design and real-time simulation. Von Kármán matches measurements better and is often preferred for loads and for final verification. Aerospace Blockset has blocks for both, **Dryden Wind Turbulence Model** (continuous and discrete versions) and **Von Karman Wind Turbulence Model**, which take altitude, airspeed and the vehicle's attitude as inputs and give gust velocities and rotation rates in body axes.

::: key
Dryden: rational transfer functions, high-frequency slope $-2$, scale length 1,750 ft above 2,000 ft; easy to simulate exactly. Von Kármán: spectrum with a $5/6$ power, slope $-5/3$ like measured turbulence, scale length 2,500 ft; needs an approximating filter. Both are driven by altitude and airspeed.
:::

## Unit conversion helpers

A recipe from another country might list flour in cups while your scale reads grams. Nothing stops you mixing them up, and the cake fails. Aerospace data has the same problem. The turbulence standards above are in feet and knots. Engine datasheets from US suppliers often list thrust in **pound-force** (lbf) and mass in **pound-mass** (lbm). Your simulation should be in SI, everywhere, all the time.

Aerospace Toolbox gives a converter for each kind of quantity. They all have the same shape: the values, the unit they are in, and the unit you want.

```matlab
convlength(1000, 'ft', 'm')      % 304.8
convvel(15, 'kts', 'm/s')        % 7.7167
convforce(1, 'lbf', 'N')         % 4.4482
convmass(1, 'slug', 'kg')        % 14.5939
convang(90, 'deg', 'rad')        % 1.5708
```

Each takes a scalar or an array and converts every element. The unit names are fixed strings from the documentation, such as `'ft'`, `'m'` and `'km'` for length, `'kts'` for **[[knots|knots]]**, `'m/s'` and `'ft/s'` for speed, `'lbf'` and `'N'` for force, `'lbm'`, `'slug'` and `'kg'` for mass, and `'deg'` and `'rad'` for angles.

::: key
`convlength`, `convvel`, `convforce`, `convmass` and `convang` all take `(values, fromUnits, toUnits)`: for example `convvel(15, 'kts', 'm/s')` gives 7.7167 and `convforce(1, 'lbf', 'N')` gives 4.4482. Convert at the edge of the simulation, once, and keep everything inside in SI.
:::

::: example A US-unit datasheet into SI
**Problem.** A datasheet lists an engine's thrust as 190,000 lbf and the stage's dry mass as 5,000 lbm. Convert to SI and find the thrust-to-weight ratio of the engine against the dry stage on the ground.

**Step 1: thrust.** `convforce(190000, 'lbf', 'N')` gives $190\,000 \times 4.4482 = 845\,162\,\mathrm{N}$, about $845\,\mathrm{kN}$.

**Step 2: mass.** `convmass(5000, 'lbm', 'kg')` gives $5\,000 \times 0.45359 = 2\,268\,\mathrm{kg}$.

**Step 3: weight and ratio.** The weight is $2\,268 \times 9.80665 = 22\,241\,\mathrm{N}$. The ratio is $845\,162/22\,241 = 38.0$.

**Sanity check.** In US units the same ratio is $190\,000\,\mathrm{lbf}/5\,000\,\mathrm{lbf} = 38$, because one lbm weighs one lbf at standard gravity. The two ratios agree, so both conversions are right.
:::

::: warning Pound-mass is not pound-force, and knots are not miles per hour
A pound-force is the weight of a pound-mass at standard gravity, so the two share a number only under standard gravity. Divide a force in lbf by a mass in lbm and you do not get ft/s². And a knot is one nautical mile per hour, $0.5144\,\mathrm{m/s}$, while a mile per hour is $0.4470\,\mathrm{m/s}$: mixing them is a 15 percent error. The most famous unit bug in spaceflight, the **[[Mars Climate Orbiter|mars-climate-orbiter]]**, was a pound-force mix-up.
:::

A good habit, on every GNC team, is to convert at the boundary. Data comes in from a file, a datasheet or a standard; it is converted to SI in one plainly marked place; and nothing inside the simulation ever sees another unit. The Dryden example does this: the formulas that the standard writes in feet get feet, and everything that leaves them is in meters.

## Check yourself

::: check
Using the MIL-F-8785C profile with $z_0 = 0.0457\,\mathrm{m}$ and a 20 ft wind of $10\,\mathrm{m/s}$, what is the mean wind at 50 m?
:::

::: answer
The bottom of the ratio is $\ln(6.096/0.0457) = 4.893$. The top is $\ln(50/0.0457) = \ln(1094) = 6.998$. So $u = 10 \times 6.998/4.893 = 14.3\,\mathrm{m/s}$. It is stronger than at 20 ft, as the wind should be higher up, but by less than half again, because the logarithm grows slowly.
:::

::: check
The same turbulence field is flown through by a glider at 30 m/s and a jet at 240 m/s. How do the gusts they feel differ, according to the Dryden model?
:::

::: answer
The time constant is $L/V$. For a scale length of, say, 300 m, the glider meets gusts lasting about $300/30 = 10\,\mathrm{s}$ and the jet about $300/240 = 1.25\,\mathrm{s}$. The jet feels the same pattern as quicker, sharper bumps, eight times faster, because it sweeps through the frozen pattern eight times faster. The intensity $\sigma$ is the same for both, since it depends on altitude and the weather, not on speed.
:::

::: check
Why can the Dryden model be simulated with an exact transfer function while the von Kármán model cannot?
:::

::: answer
A transfer function's squared magnitude is always a ratio of polynomials in $\omega$. The Dryden spectra are chosen to be ratios like that: $1/(1 + (L\omega/V)^2)$ is exactly $|H|^2$ for a first-order filter. The von Kármán spectrum has the power $5/6$, which no ratio of polynomials can produce exactly, so it has to be approximated by a filter whose spectrum is close over the frequencies that matter.
:::

::: check
A teammate simulates turbulence with `ug = su*randn(size(t))`, one independent random number every 10 ms. The standard deviation is right. What is wrong?
:::

::: answer
The gusts have the right size but no shape in time. Every sample is independent, so the gust changes completely every 10 ms, whatever the airspeed or altitude. Real gusts last seconds, with a scale length set by the altitude, and most of their energy is slow. The spectrum of this signal is flat, not the Dryden or von Kármán shape. It shakes the vehicle at high frequencies it would never really see and misses the slow pushes that matter for the flight path. The fix is to pass the noise through the Dryden filters.
:::

::: check
Convert a crosswind of 25 knots and an altitude of 35,000 ft to SI with the toolbox converters, and give the numbers.
:::

::: answer
`convvel(25, 'kts', 'm/s')` gives $25 \times 0.5144 = 12.86\,\mathrm{m/s}$. `convlength(35000, 'ft', 'm')` gives $35\,000 \times 0.3048 = 10\,668\,\mathrm{m}$. Sanity check: a knot is about half a meter per second, and a foot is about a third of a meter, so about 12 m/s and about 10.7 km are the right sizes.
:::

## Summary

| Idea | Meaning | Formula or function |
|---|---|---|
| Wind shear | wind changing with height | $u = W_{20}\ln(h/z_0)/\ln(20\,\mathrm{ft}/z_0)$; Wind Shear Model block |
| q-alpha | load from crosswind at speed | angle $\arctan(\text{crosswind}/V)$ times $q$ |
| Turbulence | random part of the wind | white noise through a shaping filter |
| Intensity, scale length | gust strength and size | $\sigma$ in m/s, $L$ in m; time scale $L/V$ |
| Dryden | rational filters, slope $-2$ | $H_u = \sigma_u\sqrt{2L_u/(\pi V)}/(1 + (L_u/V)s)$ |
| Von Kármán | measured-like spectrum, slope $-5/3$ | power $5/6$; approximating filter needed |
| Unit converters | US units to SI at the edge | `convlength`, `convvel`, `convforce`, `convmass`, `convang` |

The next lesson, the last in this module, leaves the air behind and goes to orbit: `satelliteScenario` puts satellites and ground stations in one scene, and computes their orbits, ground tracks and the times they can see each other.

::: context roughness-length A height where the wind stops
The roughness length is not the height of the bumps on the ground. It is the height at which the logarithmic wind profile, traced downward, would reach zero. Smooth ground such as a runway or short grass has a small $z_0$, a few centimeters. Towns and forests have larger ones. The picture plots the MIL-F-8785C profile for a 15 knot wind at 20 ft: most of the growth happens in the first few tens of meters.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="45" y="174">0</text><text x="45" y="104">50</text><text x="45" y="34">100</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="185">0</text><text x="190" y="185">7</text><text x="330" y="185">14</text>
  </g>
  <text x="190" y="197" font-size="11" fill="#1f2a44" text-anchor="middle">wind speed (m/s)</text>
  <text x="58" y="20" font-size="11" fill="#1f2a44">height (m)</text>
  <polyline points="147.3,168.6 169.2,167.2 191,164.4 204.3,161.5 219.9,156 241.8,142 254.6,128 270.7,100 283.5,65 292.6,30" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="204.3" cy="161.5" r="3.5" fill="#b4232c"/>
  <text x="198" y="150" font-size="11" fill="#b4232c" text-anchor="end">7.7 m/s at 6.1 m</text>
</svg>
```
:::

::: context balloon-winds Measuring the wind before launch
On launch day, weather teams release balloons that rise through the atmosphere while radar or GPS tracks their drift, giving wind speed and direction at every height. For the Space Shuttle, NASA used special radar-tracked balloons called Jimspheres, covered in small cones so they would not wobble and would follow the wind faithfully. The measured profile is loaded into the flight software or checked against the vehicle's load limits in the hours before launch.
:::

::: context white-noise Why "white"
White light contains every color in equal measure. White noise, by analogy, contains every frequency in equal measure: its spectrum is flat. Its samples are completely unrelated to one another, so it has no memory. A turbulence model gives it memory by filtering: the filter smooths the noise so that each moment resembles the moments right before it, the way a real gust builds and fades.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="35" width="90" height="40" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="59" font-size="12" fill="#1f2a44" text-anchor="middle">white noise</text>
  <line x1="100" y1="55" x2="140" y2="55" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="140,55 132,51 132,59" fill="#1f2a44"/>
  <rect x="140" y="30" width="90" height="50" rx="6" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="185" y="52" font-size="12" fill="#1f2a44" text-anchor="middle">Dryden</text>
  <text x="185" y="68" font-size="12" fill="#1f2a44" text-anchor="middle">filter H(s)</text>
  <line x1="230" y1="55" x2="270" y2="55" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="270,55 262,51 262,59" fill="#1f2a44"/>
  <rect x="270" y="35" width="80" height="40" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="310" y="59" font-size="12" fill="#1f2a44" text-anchor="middle">gust</text>
  <text x="185" y="100" font-size="11" fill="#6c7a93" text-anchor="middle">σ and L set by altitude; time scale L/V set by airspeed</text>
</svg>
```
:::

::: context psd Where the energy sits
A spectrum is a recipe: how much of the signal's variance comes from each frequency. The picture compares the Dryden and von Kármán spectra for the same intensity and scale length, on log scales. Both are flat for slow gusts, bend near a frequency of $1/L$, and fall off for quick ones. Von Kármán falls more slowly, so it keeps more energy in small, sharp gusts.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="185">0.01</text><text x="120" y="185">0.1</text><text x="190" y="185">1</text><text x="260" y="185">10</text><text x="330" y="185">100</text>
  </g>
  <text x="190" y="197" font-size="11" fill="#1f2a44" text-anchor="middle">L times spatial frequency (log scale)</text>
  <text x="58" y="20" font-size="11" fill="#1f2a44">spectrum, log scale</text>
  <polyline points="50,30 67.5,30 85,30 102.5,30 120,30.2 137.5,30.5 155,31.4 172.5,34.2 190,40.5 207.5,51.7 225,66.4 242.5,83 260,100.2 277.5,117.5 295,135 312.5,152.5 330,170" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline points="50,30 67.5,30 85,30 102.5,30.1 120,30.2 137.5,30.7 155,32.1 172.5,35.7 190,43 207.5,54 225,67.2 242.5,81.4 260,95.8 277.5,110.3 295,124.9 312.5,139.5 330,154.1" fill="none" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6 4"/>
  <text x="190" y="152" font-size="11" fill="#1d6fd1">Dryden, slope −2</text>
  <text x="262" y="75" font-size="11" fill="#b4232c">von Kármán, −5/3</text>
</svg>
```
:::

::: context frozen-turbulence Flying through a still pattern
The physicist G. I. Taylor proposed in 1938 that turbulence, seen by a fast-moving probe, can be treated as a pattern frozen in place, because the pattern changes slowly compared with how quickly the probe crosses it. An aircraft is such a probe. This is what lets a spectrum measured over distance, in radians per meter, be turned into a spectrum over time, in radians per second: multiply the spatial frequency by the airspeed.
:::

::: context dryden-name Two names from aeronautics
Hugh Dryden was an American aerodynamicist who studied turbulence in wind tunnels, became director of research at NACA, and later served as NASA's first deputy administrator. Theodore von Kármán, a Hungarian-American engineer, was a founder of the Jet Propulsion Laboratory at Caltech and published the turbulence spectrum that bears his name in 1948. The two models are named after their work on the statistics of turbulence.
:::

::: context knots A nautical measure of speed
A knot is one nautical mile per hour, and a nautical mile is exactly 1,852 m, originally one minute of arc of latitude. So a knot is $1852/3600 = 0.5144\,\mathrm{m/s}$. Sailors once measured speed by letting out a rope with knots tied at regular intervals and counting how many ran out in a set time. Aviation kept the unit, so wind reports and airspeeds from pilots and air traffic control still come in knots.
:::

::: context mars-climate-orbiter The spacecraft lost to a unit
In September 1999, NASA's Mars Climate Orbiter arrived at Mars far lower than planned and was lost. The investigation found that ground software supplied by a contractor reported thruster impulse in pound-force seconds, while the navigation software that used it expected newton seconds. Each small maneuver's effect was underestimated by a factor of about 4.45, and the error built up over months of flight. The fix for this kind of mistake is not cleverness; it is converting at the interface, in one place, and testing it.
:::
