---
id: l02-building-a-dispersion-set
title: Building a dispersion set
minutes: 19
covers:
  - 'Building a dispersion set: mass properties, aerodynamic coefficients, propulsion performance, winds, sensor and actuator errors, initial conditions, atmosphere'
---

How long does it take you to get to school? It depends. Some days every traffic light is green. Some days it rains and you walk slower. Some days the bus is late. If you wanted to know the *worst* morning you should plan for, you would list every one of those things that can change, guess how much each one varies, and imagine thousands of mornings with different mixes. Now suppose you forgot the drawbridge that opens twice a week. Your thousands of imagined mornings would all look fine, and your answer would be precise, confident, and wrong.

A **[[Monte Carlo|monte-carlo-name]] campaign** is that same trick done on a computer: fly the vehicle's simulation thousands of times, each time with the uncertain inputs nudged a little differently, and look at the spread of outcomes. The list of things it nudges, each with how much it can vary, is the **dispersion set**. A **dispersion** here means the spread of a quantity around its planned value.

The campaign is only as good as that list. The engine that runs the trajectories, the statistics that size the campaign, the regression that finds the drivers — every later lesson assumes the list is already right, and none can repair it if it is not. A perfect **[[six-degree-of-freedom|six-dof]]** simulation, run ten thousand times against a list that is missing a real source of uncertainty, gives a confident, precise and wrong answer, and nothing downstream reveals the mistake.

This lesson builds that list: what kinds of uncertainty belong in it, where a defensible spread for each one comes from, and how independent pieces combine into a total. On a real program the list is written up as its own document — a **dispersion-set specification** — and reviewed on its own, before a single case is run.

## What belongs in the list

A launch vehicle's dispersion set is built from a handful of physical categories. A real specification names every parameter in each category individually. It never leaves a category as a vague gesture.

**Mass properties.** Dry mass, propellant load, **center of mass** (the balance point) location, and the full **inertia tensor** (how the mass is spread around that balance point, which sets how hard the vehicle is to rotate). All of these vary from vehicle to vehicle because of manufacturing tolerance, and from flight to flight because of how accurately propellant is loaded. And they all [[move together as propellant burns|moving-balance-point]] — a fact the next lesson returns to.

**Aerodynamic coefficients.** The axial force, normal force and moment coefficients: numbers that turn airspeed and air density into forces and twisting moments. Each is usually given as an uncertainty band around a nominal curve from wind-tunnel tests or computer fluid simulation. They vary with Mach number (speed compared with the speed of sound) and angle of attack (how far the nose points away from the airflow). They also carry a correction for the gap between the **[[Reynolds number|reynolds-gap]]** in the tunnel and in flight.

**Propulsion performance.** Thrust and **[[specific impulse|isp-meaning]]** ($I_{sp}$, read "I S P"), both at steady running and through the startup and shutdown **transients** — the brief messy moments while the engine spins up or winds down. Also the timing of ignition and cutoff themselves. A late ignition is a dispersion in its own right, separate from how the thrust behaves once it starts.

**Winds.** Vertical profiles of wind speed and direction, drawn from historical weather records for the launch site and season. They are sampled as whole profiles, not as separate values at each altitude, because real wind at one height is closely tied to wind a little higher up.

**Sensor and actuator errors.** For every navigation sensor: **bias** (a constant offset), **scale factor** (a reading that is a few percent too big or small), noise and misalignment. For every actuator: position or rate error, bandwidth and rate limits. These are the same error models the inertial-navigation and sensor modules built, now feeding a whole-vehicle campaign instead of one filter's analysis.

**Initial conditions.** Position, velocity and attitude at the start of the trajectory being flown. Each is dispersed according to whatever sets it: the accuracy of a GNSS fix, a pad survey's tolerance, or the state handed over from the previous flight phase.

**Atmospheric density.** A profile that departs from the **[[standard atmosphere|standard-atmosphere]]** with altitude, season and weather. It is usually written as a percentage departure from a reference model. That departure is often modeled as *multiplicative* and always positive — a point that matters later, when this module asks whether a "three sigma" bound means what it seems to.

::: key
A dispersion set names, individually: mass properties and center of mass, inertia, aerodynamic coefficients, thrust and Isp and their transients, engine timing, winds as correlated profiles, atmospheric density, sensor and actuator errors, and initial conditions — each with its own distribution and a stated source.
:::

## Where a distribution comes from

Every entry needs a **distribution**: a shape, a center, and a spread. And each of those three needs a reason a reviewer can check. Three sources are legitimate, and the specification should say plainly which one backs each parameter.

**Test data** is the strongest. It is a sample of real measurements — acceptance-test results across a production run, a series of hot-fire $I_{sp}$ measurements, a batch of IMU calibrations — fitted to a distribution with the estimation tools from the probability and statistics module. A parameter backed by test data carries a sample size, and the specification should state it. A distribution fitted to five measurements is a very different claim from one fitted to five hundred.

**Heritage** borrows from a similar system that has already flown. A new engine closely related to an older one may inherit the older engine's measured thrust spread, adjusted by engineering judgment for whatever is really different. Heritage is weaker than direct test data on the actual hardware. The specification should name the **[[heritage system|heritage-trap]]** and describe the adjustment, not just assert a number.

**Engineering judgment** covers everything else. A parameter with no tests and no close heritage still needs a distribution. The honest answer is a stated, documented and usually cautious bound — often a **uniform** distribution (every value in a range equally likely) or a **Gaussian** (bell curve) with a deliberately wide spread — with the reasoning written down so a reviewer can challenge it.

What is never acceptable is leaving a parameter out because there is no data for it yet. A parameter left out is not a parameter with zero uncertainty. It is a parameter whose uncertainty the analysis is silently claiming does not exist.

::: warning The absent parameter is not a small dispersion — it is an unrepresented failure mode
A campaign's confidence claim is only as good as its coverage of the real ways the vehicle can fail. Leave a parameter out because it is inconvenient, poorly understood or forgotten, and the campaign does not treat it cautiously. It treats it as perfectly known. The reliability number then says nothing at all about any failure that parameter could cause. When in doubt, disperse it wide and say why. Never leave it out and say nothing.
:::

## Combining independent contributors

Here is a question that sounds simple. You carry a backpack whose weight is a little uncertain, and a water bottle whose weight is a little uncertain. How uncertain is the total?

Your first guess is probably "add the two uncertainties". That guess is too big. The two errors are **independent** — one being heavy tells you nothing about the other — so sometimes one is high while the other is low, and they partly cancel. The total spread is less than the sum.

The precise rule works on the **variance**, which is the standard deviation squared. The **standard deviation**, written $\sigma$ and read "sigma", is the typical size of the spread. For independent random quantities $X_1, \ldots, X_n$ with standard deviations $\sigma_1, \ldots, \sigma_n$, and their sum $Y = X_1 + \cdots + X_n$:

$$
\operatorname{Var}(Y) = \operatorname{Var}(X_1) + \cdots + \operatorname{Var}(X_n) = \sigma_1^2 + \cdots + \sigma_n^2.
$$

Variances add. Standard deviations do not. Take the square root of both sides and you get the combined standard deviation, called the **[[root-sum-square|rss-triangle]]** (RSS for short — square each one, sum them, take the root):

$$
\sigma_Y = \sqrt{\sigma_1^2 + \sigma_2^2 + \cdots + \sigma_n^2}.
$$

::: note Why it has to be true
Write each $X_i$ as its mean plus a wiggle $e_i$, where each wiggle averages zero. Then $Y$ minus its mean is $e_1 + e_2 + \cdots + e_n$, and $\operatorname{Var}(Y)$ is the average of the square of that sum.

Square the sum and you get two kinds of term. The squares $e_i^2$ average to $\sigma_i^2$. The cross terms $2e_ie_j$, with $i \neq j$, average to twice the **covariance** of $X_i$ and $X_j$ — a measure of how they move together. Independence means knowing one wiggle tells you nothing about the other, so a positive $e_i$ is as likely to meet a negative $e_j$ as a positive one, and every cross term averages to zero. Only the squares survive, which is the rule above.
:::

The RSS total is always smaller than the plain sum $\sigma_1 + \sigma_2 + \cdots + \sigma_n$ whenever more than one term is nonzero. Learn this early. Adding standard deviations directly is the single most common arithmetic mistake in a hand-built dispersion budget. It overstates the spread, and it can make a design look like it fails a requirement it actually meets.

::: example Total mass one-sigma from three independent contributors
A vehicle's total mass uncertainty at liftoff comes from three independent sources, each separately justified:

- dry mass, from as-built weighing and manufacturing tolerance: $\sigma_{\mathrm{dry}} = 145\,\mathrm{kg}$;
- propellant loading accuracy: $\sigma_{\mathrm{prop}} = 62\,\mathrm{kg}$;
- payload mass, stated by the customer with its own uncertainty: $\sigma_{\mathrm{pay}} = 20\,\mathrm{kg}$.

**Square each one:** $145^2 = 21\,025$, $62^2 = 3844$, $20^2 = 400$.

**Add the squares:** $21\,025 + 3844 + 400 = 25\,269\,\mathrm{kg^2}$.

**Take the square root:**

$$
\sigma_{\mathrm{mass}} = \sqrt{145^2 + 62^2 + 20^2} = \sqrt{25\,269} = 158.96\,\mathrm{kg}.
$$

**Compare with the naive sum:** $145 + 62 + 20 = 227\,\mathrm{kg}$, which is $43\%$ larger than the correct figure.

**Put it in context:** on a vehicle with a nominal liftoff mass of $24\,800\,\mathrm{kg}$, the correct one-sigma is $158.96 / 24\,800 = 0.641\%$ of the vehicle. The naive sum would have said $227 / 24\,800 = 0.915\%$ — a big enough gap to change whether a downstream margin appears to pass.

Sanity check: the total ($159\,\mathrm{kg}$) is a bit more than the biggest single piece ($145\,\mathrm{kg}$), because the biggest piece dominates when you square. That is typical of RSS. RSS is not a refinement you apply only when the numbers are awkward. It is the only correct way to add independent uncertainties, at any size.
:::

::: example Propagating uncertainty through a physical formula: thrust from mass flow and Isp
Thrust, mass flow rate and specific impulse are linked by $F = \dot{m}\,I_{sp}\,g_0$. Read $\dot{m}$ as "m dot", the mass of propellant flowing out per second. And $g_0 = 9.80665\,\mathrm{m/s^2}$ is **[[standard gravity|standard-gravity]]**.

Acceptance testing gives independent relative one-sigma uncertainties of $0.012$ ($1.2\%$) on mass flow and $0.008$ ($0.8\%$) on $I_{sp}$. The engine's nominal thrust is $F = 934\,000\,\mathrm{N}$ and its nominal $I_{sp} = 282\,\mathrm{s}$.

**Turn the product into a sum.** Take the natural logarithm of both sides: $\ln F = \ln\dot{m} + \ln I_{sp} + \ln g_0$. A small change in $\ln x$ equals the *relative* change in $x$ (a $1\%$ rise in $x$ raises $\ln x$ by about $0.01$). So relative uncertainties in a product behave like absolute uncertainties in a sum. The constant $g_0$ has no uncertainty and drops out.

**Apply the RSS rule to the relative uncertainties:**

$$
\frac{\sigma_F}{F} = \sqrt{\left(\frac{\sigma_{\dot m}}{\dot m}\right)^{\!2} + \left(\frac{\sigma_{I_{sp}}}{I_{sp}}\right)^{\!2}} = \sqrt{0.012^2 + 0.008^2} = \sqrt{0.000144 + 0.000064} = 0.01442.
$$

**Turn it back into newtons:** $\sigma_F = 0.01442 \times 934\,000 = 13\,470\,\mathrm{N}$, about $13.5\,\mathrm{kN}$.

Notice what did *not* happen: the two relative uncertainties were not added to get $2.0\%$. The answer, $1.44\%$, sits between the larger input ($1.2\%$) and the plain sum ($2.0\%$), as RSS always does. It is the same root-sum-square rule, applied one algebra step away from where you might expect it.
:::

This split is useful for more than the total. Knowing that $\sigma_F/F$ breaks into a mass-flow piece ($1.2\%$) and an $I_{sp}$ piece ($0.8\%$) tells a program which input is worth the engineering effort to tighten — here, mass flow. That is a first taste of the sensitivity analysis a later lesson develops. And RSS assumes independence. The next lesson is about what changes when that assumption fails.

## Check yourself

::: check
List the seven categories a launch-vehicle dispersion set should name individually, and for each, give one specific parameter that belongs in it.
:::

::: answer
- Mass properties: dry mass, propellant load, center of mass, or inertia.
- Aerodynamic coefficients: the axial force coefficient or the normal force coefficient.
- Propulsion performance: thrust, $I_{sp}$, or ignition timing.
- Winds: a vertical profile of wind speed and direction.
- Sensor and actuator errors: an IMU bias, or a TVC rate limit.
- Initial conditions: the uncertainty in initial position or attitude.
- Atmospheric density: the percentage departure from the standard atmosphere at a given altitude.
:::

::: check
A parameter has no test data and no closely comparable heritage system. What is the correct treatment in the dispersion set, and what is not acceptable?
:::

::: answer
The correct treatment is engineering judgment. Assign a distribution — often a wide uniform range, or a Gaussian with a cautiously large standard deviation — and write down the reasoning so a reviewer can check and challenge it.

What is not acceptable is leaving the parameter out. The campaign does not treat a missing parameter as low-uncertainty. It treats it as having no uncertainty at all, which silently removes a whole possible failure mode from the reliability claim the campaign later supports.
:::

::: check
Three independent contributors have one-sigma uncertainties of $8$, $6$ and $3$ units on a quantity that is their sum. Compute the correct combined one-sigma uncertainty and compare it with the naive sum.
:::

::: answer
Square each: $64$, $36$, $9$. Add: $109$. Take the root: $\sqrt{109} = 10.44$ units.

The naive sum is $8 + 6 + 3 = 17$ units, which overstates the true one-sigma spread by about $63\%$. The RSS total is always at or below the naive sum. They are equal only when a single contributor is nonzero.
:::

::: check
Explain, using the relation $F = \dot{m}I_{sp}g_0$, why relative uncertainties on a product combine by root-sum-square rather than by simple addition.
:::

::: answer
Take the logarithm of both sides: $\ln F = \ln\dot m + \ln I_{sp} + \ln g_0$. The product has become a sum. To first order, a small relative uncertainty in a quantity equals the standard deviation of its logarithm.

So $\ln F$ is a sum of (to first order) independent terms, and the rule for a sum of independent contributors applies directly: the variances of the log terms add. The relative uncertainties — which are those log-term standard deviations — therefore combine by root-sum-square, exactly as absolute uncertainties do for a real sum.
:::

::: check
A dispersion-set specification lists atmospheric density as "varies by up to five percent, sign unspecified." Why is this an inadequate entry, and what should replace it?
:::

::: answer
"Varies by up to five percent" names neither a distribution shape nor a spread a Monte Carlo sampler can draw from. A campaign needs an actual probability distribution, not a bound in words.

The entry should state the distribution family — commonly **lognormal** for a strictly positive, multiplicative quantity like a density ratio (the next lesson explains why) — its parameters (for instance, a one-sigma relative departure of some stated percentage), and the source behind that choice. Ideally that source is climate statistics of density profiles for the launch site and season. If that data is not available, a stated engineering judgment will do, exactly as the three-source rule requires for every entry.
:::

## Summary

| Item | Statement |
| --- | --- |
| Dispersion-set categories | Mass properties and center of mass, inertia, aerodynamic coefficients, thrust/Isp and transients, engine timing, winds as correlated profiles, atmospheric density, sensor and actuator errors, initial conditions |
| Three sources for a distribution | Test data (fit to measurements), heritage (a flown system, adjusted), engineering judgment (a stated, documented bound) |
| The absent-parameter rule | A parameter left out is not treated as certain but as if no uncertainty existed; disperse wide rather than omit |
| Sum of independent contributors | $\operatorname{Var}(Y) = \sum_i \sigma_i^2$, so $\sigma_Y = \sqrt{\sum_i \sigma_i^2}$ — root-sum-square, always $\leq$ the naive sum |
| Product uncertainty | Relative uncertainties on a product combine by root-sum-square, by taking logarithms and applying the sum rule |

The list is only right once its independence assumptions have been checked honestly, and real dispersion sets are full of parameters that move together: mass and propellant load, $I_{sp}$ and mixture ratio, wind at one altitude and the next. The next lesson takes that up — what a correlation does to a downstream variance, and why dropping one is not the safe choice it looks like.

::: context monte-carlo-name Named after a casino
In the 1940s, scientists at Los Alamos, including Stanislaw Ulam and John von Neumann, needed to predict how neutrons travel through material — a problem too tangled to solve with equations. Ulam's idea was to play it out many times with random numbers and count the results, the way you could estimate the odds of winning a card game by dealing thousands of hands. The method needed a code name, and Nicholas Metropolis suggested "Monte Carlo", after the famous casino in Monaco. The name stuck for any method that answers a question by repeated random sampling.
:::

::: context six-dof Six ways to move
A rigid vehicle can move in six independent ways: three straight-line motions (forward and back, side to side, up and down) and three rotations (roll, pitch and yaw). A **six-degree-of-freedom** simulation tracks all six, so it captures both where the vehicle goes and which way it points.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke-width="2.5">
    <line x1="120" y1="95" x2="230" y2="95" stroke="#1d6fd1"/>
    <line x1="120" y1="95" x2="120" y2="20" stroke="#1d6fd1"/>
    <line x1="120" y1="95" x2="70" y2="145" stroke="#1d6fd1"/>
  </g>
  <polygon points="238,95 226,89 226,101" fill="#1d6fd1"/>
  <polygon points="120,12 114,24 126,24" fill="#1d6fd1"/>
  <polygon points="64,151 69,138 77,146" fill="#1d6fd1"/>
  <text x="244" y="99" font-size="12" fill="#1f2a44">x</text>
  <text x="128" y="20" font-size="12" fill="#1f2a44">z</text>
  <text x="52" y="150" font-size="12" fill="#1f2a44">y</text>
  <g fill="none" stroke="#b4232c" stroke-width="2">
    <ellipse cx="200" cy="95" rx="7" ry="16"/>
    <ellipse cx="120" cy="45" rx="16" ry="6"/>
    <ellipse cx="90" cy="125" rx="13" ry="9"/>
  </g>
  <text x="258" y="60" font-size="12" fill="#1d6fd1">blue: 3 slides</text>
  <text x="258" y="78" font-size="12" fill="#b4232c">red: 3 turns</text>
</svg>
```

Three arrows for sliding, three circles for turning: six numbers of motion.
:::

::: context moving-balance-point The balance point drifts during flight
Propellant is most of a rocket's mass, and it drains out of the tanks as the engines burn. So the total mass falls, the center of mass slides along the vehicle, and the inertia shrinks, all at once and all driven by the same thing. That is why these parameters cannot be treated as unrelated: if the propellant load is a little high, the mass, balance point and inertia are all off together, in a linked way.
:::

::: context reynolds-gap Why a small model does not fly like the real thing
The **Reynolds number** compares how strongly air keeps moving under its own momentum with how strongly its stickiness (viscosity) slows it. It grows with speed and with size. A small model in a wind tunnel usually runs at a much lower Reynolds number than the full-size rocket in flight, so the thin layer of air hugging the surface behaves differently. Engineers correct the tunnel data for this gap — and the correction is itself uncertain, so it earns its own place in the dispersion set.
:::

::: context isp-meaning Fuel economy for rockets
**Specific impulse** is the rocket version of miles per gallon: how much push you get from each kilogram of propellant. It is measured in seconds, the thrust per unit weight-flow of propellant. A higher $I_{sp}$ means the same tank of propellant produces more total change in velocity. Kerosene engines near sea level give around $280$–$310\,\mathrm{s}$; hydrogen engines in vacuum reach about $450\,\mathrm{s}$. A spread of even $1\%$ matters, because it changes how much speed the stage delivers before its tanks run dry.
:::

::: context standard-atmosphere The reference sky
A **standard atmosphere** is an agreed table of air pressure, temperature and density at each altitude, averaged over the year. The US Standard Atmosphere of 1976 is the common one. Density drops roughly by a factor of three every $8$ to $10\,\mathrm{km}$:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50,27.5 90,76.4 130,108.6 170,130.5 210,141.1 290,148.2 330,149.2"/>
  <g fill="#1d6fd1">
    <circle cx="50" cy="27.5" r="3"/><circle cx="90" cy="76.4" r="3"/><circle cx="130" cy="108.6" r="3"/>
    <circle cx="170" cy="130.5" r="3"/><circle cx="210" cy="141.1" r="3"/><circle cx="290" cy="148.2" r="3"/><circle cx="330" cy="149.2" r="3"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="166">0</text><text x="130" y="166">10</text><text x="210" y="166">20</text><text x="290" y="166">30</text>
    <text x="195" y="178">altitude, km</text>
  </g>
  <text x="44" y="31" font-size="11" text-anchor="end" fill="#1f2a44">1.225</text>
  <text x="44" y="154" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="60" y="14" font-size="11" fill="#1f2a44">density, kg/m³</text>
</svg>
```

Real days depart from this curve by a few percent, and that departure is what the dispersion set spreads.
:::

::: context heritage-trap When heritage goes wrong
On its first flight in 1996, Ariane 5 broke up about $40$ seconds after liftoff. Its inertial reference software was reused from Ariane 4, where it had worked perfectly. But Ariane 5 climbed on a different path, and one horizontal-velocity-related value grew larger than it ever had on Ariane 4. Converting it into a 16-bit integer overflowed, both inertial units shut down, and the vehicle lost its attitude reference. Nobody had checked that the heritage assumption still held on the new trajectory. That is why a specification must say what is different, not just name the heritage.
:::

::: context rss-triangle Uncertainties add like the sides of a right triangle
Root-sum-square is the Pythagorean theorem. Two independent spreads behave like two sides at right angles, and the total is the slanted side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="40,130 160,130 160,40" fill="#8fb8f0" fill-opacity="0.35" stroke="none"/>
  <line x1="40" y1="130" x2="160" y2="130" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="160" y1="130" x2="160" y2="40" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="40" y1="130" x2="160" y2="40" stroke="#b4232c" stroke-width="3"/>
  <rect x="150" y="120" width="10" height="10" fill="none" stroke="#1f2a44" stroke-width="1"/>
  <text x="100" y="146" font-size="12" text-anchor="middle" fill="#1f2a44">σ₁ = 4</text>
  <text x="168" y="90" font-size="12" fill="#1f2a44">σ₂ = 3</text>
  <text x="82" y="78" font-size="12" text-anchor="middle" fill="#b4232c">total = 5</text>
  <line x1="40" y1="168" x2="250" y2="168" stroke="#6c7a93" stroke-width="3"/>
  <text x="258" y="172" font-size="12" fill="#1f2a44">naive sum = 7</text>
</svg>
```

The two short sides are $4$ and $3$; the slanted side is $\sqrt{16 + 9} = 5$, not $7$. The grey bar is $7$ units long at the same scale. Walking along the slant is always shorter than walking both legs.
:::

::: context standard-gravity Why g₀ appears in the thrust formula
$g_0 = 9.80665\,\mathrm{m/s^2}$ is standard gravity, a fixed agreed value for gravity at Earth's surface. It shows up only because $I_{sp}$ is measured in seconds, a historical choice that makes the number the same in metric and US units. Multiplying $I_{sp}$ by $g_0$ turns it back into an exhaust speed in $\mathrm{m/s}$. Because $g_0$ is an exact defined constant, it carries no uncertainty — which is why it drops out of the error budget.
:::
