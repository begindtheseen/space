---
id: l04-aerothermodynamics-and-thermal-protection
title: Aerothermodynamics and thermal protection
minutes: 17
covers:
  - "aerothermodynamics: convective and radiative heating, Sutton-Graves"
  - thermal protection systems, heat rate vs heat load
---

The previous lesson established a proportionality and left the constant out: convective heating rate scales as $\sqrt\rho\,v^3$, but a thermal protection system engineer needs watts per square centimetre, not a shape. This lesson supplies the constant — the Sutton-Graves correlation, the standard first-pass tool for stagnation-point convective heating on any blunt entry vehicle — derives where its functional form comes from, and then asks the question a TPS actually has to answer: not just how hot does it get, but for how long, and which of those two numbers sizes which part of the heat shield.

A thermal protection system faces two separate demands that are easy to conflate. It has to survive the single worst instant of heating without its surface temperature exceeding what the material can take — that is a **rate** problem, watts per square centimetre. And it has to carry away or absorb the *total* thermal energy delivered over the whole entry without burning through — that is a **load** problem, joules per square centimetre, the time integral of the rate. Get the distinction backwards and you either fly an oversized, overweight heat shield or an undersized one that survives the peak and fails on the way down anyway.

## Convective heating: where the scaling comes from

At a vehicle's stagnation point — the point on the surface where the flow decelerates to zero and the bow shock stands closest — heat is carried from the hot, shocked air to the (much cooler) surface by conduction across a thin boundary layer. Boundary-layer theory at a stagnation point gives a convective heat-transfer coefficient that scales as

$$
h_c \propto \sqrt{\frac{\rho\,v}{R_n}},
$$

where $R_n$ is the nose radius: a larger nose spreads the same flow deceleration over a longer distance, producing a gentler velocity gradient at the stagnation point and a thinner, less efficient conducting boundary layer — this is the physical reason blunt shapes were adopted for crewed capsules. Multiplying this coefficient by the enthalpy difference the boundary layer has to conduct across — dominated, at hypersonic speed, by the vehicle's own kinetic energy per unit mass, $v^2/2$ — gives a heating rate scaling as $\sqrt{\rho v/R_n}\cdot v^2 = \sqrt{\rho/R_n}\,v^{2.5}$. Real hypersonic shock layers push this further: the extreme post-shock temperatures drive strong variation in the air's transport properties and, at high enough speed, dissociate and ionise it, effects a simple boundary-layer estimate does not capture. Sutton and Graves fit flight and ground-test stagnation-point heating data across a wide range of entry conditions and found the effective velocity power close to cubic rather than $2.5$ — their result, still the standard engineering correlation for a first-pass convective estimate, is

$$
\dot q_c = k\sqrt{\frac{\rho}{R_n}}\,v^3, \qquad k = 1.7415\times10^{-4}\ \left(\text{SI: }\rho\text{ in kg/m}^3,\ R_n\text{ in m},\ v\text{ in m/s}, \ \dot q_c\text{ in W/m}^2\right).
$$

Divide by $10^4$ to report $\dot q_c$ in the more usual engineering unit of watts per square centimetre. This confirms and completes the shape used without a constant in the previous lesson: $\sqrt\rho\,v^3$, scaled by $k/\sqrt{R_n}$.

::: key The Sutton-Graves convective heating correlation
$$
\dot q_c = k\sqrt{\frac{\rho}{R_n}}\,v^3, \qquad k \approx 1.7415\times10^{-4}\ \text{SI}.
$$
Density to the one-half power, nose radius to the minus one-half power, speed *cubed*. The cubic velocity dependence is why entry speed dominates the thermal problem far more than it dominates the structural one (deceleration only goes as $v^2$), and why nose radius is made as large as the mission's drag and stability budget allow.
:::

::: example Peak heat rate for a steep ballistic entry
Take a steep, ballistic (zero-lift) entry — representative of an instrumented test vehicle or a reentry body flown deliberately steep to minimise trajectory dispersion — at $v_E = 7000\ \mathrm{m/s}$, $\gamma_E = -40^\circ$, nose radius $R_n = 0.5\ \mathrm{m}$, $\beta = 200\ \mathrm{kg/m^2}$. Lesson 3 located the peak-heating density at $\rho^*_q = \beta s/(3H)$ with $s = \sin 40^\circ = 0.6428$: $\rho^*_q = (200\times0.6428)/(3\times7200) = 5.952\times10^{-3}\ \mathrm{kg/m^3}$, reached at $h^*_q = H\ln(\rho_0/\rho^*_q) = 7200\ln(1.225/5.952\times10^{-3}) = 38.35\ \mathrm{km}$. The speed there, from the Allen-Eggers solution at the peak-heating point, works out to $v^*_q = v_E\,e^{-1/6} = 0.8465\,v_E = 5925\ \mathrm{m/s}$ (a smaller fraction shed than at peak deceleration, since the heating peak comes earlier). Substituting into Sutton-Graves,

$$
\dot q_{c,\max} = 1.7415\times10^{-4}\sqrt{\frac{5.952\times10^{-3}}{0.5}}\times5925^3 = 3.953\times10^{6}\ \mathrm{W/m^2} = 395.3\ \mathrm{W/cm^2}.
$$

This checks against a direct numerical maximisation of $\dot q_c(h)$ along the same trajectory to five significant figures. For comparison, a lunar-return entry at $11\ \mathrm{km/s}$ and the same angle and vehicle would scale this by $(11{,}000/7000)^3 = 3.88$, to roughly $1534\ \mathrm{W/cm^2}$ — a useful reminder of just how much the cubic velocity dependence amplifies a modest speed increase.
:::

## Radiative heating: convection's steeper cousin

At very high entry speeds the hot shock layer itself glows, and this radiated energy reaches the vehicle in addition to the convective flux above. Radiative heating rises far more steeply with speed than convective heating does — commonly cited correlations put the exponent in the range of the seventh to ninth power of velocity, depending on speed range and nose radius — which means it is negligible for a LEO-return entry at $7$–$8\ \mathrm{km/s}$ but can rival or exceed convective heating for the fastest entries this module discusses: lunar return near $11\ \mathrm{km/s}$ sees a meaningful radiative contribution, and entries far faster still — an outer-planet atmospheric probe, or an Earth-return sample-return capsule arriving above interplanetary escape speed — can be radiative-heating-dominated. Where convective heating favours a *large* nose radius (it appears as $1/\sqrt{R_n}$ above), radiative heating from the shock layer generally favours a *smaller* one, because a smaller shock standoff distance means a thinner, less strongly radiating gas cap — the two mechanisms pull vehicle shape in opposite directions, and a high-speed-entry TPS designer has to balance both rather than simply minimising one.

::: warning Sutton-Graves is convective heating only
The correlation above accounts for none of the radiative contribution. For entries below about $9$–$10\ \mathrm{km/s}$ this is usually an acceptable simplification, since radiative heating is a small fraction of the total there; for anything faster, quoting a Sutton-Graves number alone as "the" peak heat rate understates the real thermal environment, sometimes badly.
:::

## Heat rate versus heat load

A material's maximum operating temperature sets a **peak heat rate** limit: exceed it, even briefly, and the surface fails regardless of how short the exposure was. A TPS's *mass* — how thick the ablative or insulating layer needs to be — is set instead by the **total heat load**, the time-integral of heat rate over the whole entry, since that integral is (to a good approximation) proportional to how much material must ablate away or how much heat must be conducted into and stored by the structure beneath. These are genuinely different numbers, and a specification sheet for a heat shield material carries both: a peak flux rating in $\mathrm{W/cm^2}$, and a total load rating in $\mathrm{J/cm^2}$.

It is worth working out how these two numbers depend on $\beta$, because the answer is less obvious than it looks. Using the Allen-Eggers velocity solution to convert the time integral into an altitude integral ($dt = dh/(v\,s)$, following lesson 2), the total convective heat load at the stagnation point works out, for the steep ballistic entry above, to

$$
Q = \int_0^\infty \dot q_c(h)\,\frac{dh}{v(h)\,s} \approx \frac{k\,v_E^2}{\sqrt{R_n}}\sqrt{\frac{\pi\beta H}{s}},
$$

carrying the same $\rho(h)$-to-altitude substitution used throughout this module. Both $\dot q_{c,\max}$ (lesson 3) and this total load $Q$ scale as $\sqrt\beta$ — the *same* direction, not opposite ones. For the vehicle above, sweeping $\beta$ from $50$ to $800\ \mathrm{kg/m^2}$ (a $16$-fold range) gives:

| $\beta$ ($\mathrm{kg/m^2}$) | $\dot q_{c,\max}$ ($\mathrm{W/cm^2}$) | $Q$ ($\mathrm{J/cm^2}$) |
| --- | --- | --- |
| $50$ | $197.6$ | $1594$ |
| $100$ | $279.5$ | $2257$ |
| $200$ | $395.3$ | $3194$ |
| $400$ | $559.0$ | $4520$ |
| $800$ | $790.6$ | $6396$ |

Every ratio in both columns is $\sqrt2 = 1.414$ between adjacent rows, confirming the $\sqrt\beta$ scaling directly: a low-$\beta$ vehicle here is a win on *both* counts simultaneously, not a trade-off. This is, in fact, the original Allen-Eggers insight that launched blunt-body entry design in the 1950s: a low ballistic coefficient — achieved by making the vehicle light for its drag area, typically by making it blunt — decelerates high in thin air, and thinner air along the whole deceleration pulse means both a lower peak flux *and* a smaller total energy delivered to the stagnation point, because the vehicle spends its energy-shedding phase where there is simply less air to transfer heat through.

::: example Halving beta, both numbers fall together
Compare $\beta = 400\ \mathrm{kg/m^2}$ against $\beta = 100\ \mathrm{kg/m^2}$ — a four-fold reduction, achievable by roughly doubling frontal area at fixed mass, or halving mass at fixed area. From the table, peak rate falls from $559.0$ to $279.5\ \mathrm{W/cm^2}$ (exactly a factor of $2 = \sqrt4$) and total load falls from $4520$ to $2257\ \mathrm{J/cm^2}$ (the same factor). A material rated to survive $560\ \mathrm{W/cm^2}$ peak and $4600\ \mathrm{J/cm^2}$ total load at $\beta=400$ has roughly double the margin on both counts, simultaneously, at $\beta=100$ — with no penalty traded away. The reason blunt capsules do not simply make $\beta$ as low as engineering allows is not a thermal one; it is that a very low $\beta$ means a very large drag area for the mass carried, which costs packaging volume, structural mass, and — as lesson 6 shows — narrows the usable range of entry angles before the vehicle skips back out of the atmosphere.
:::

Where, then, does the familiar "low peak rate but high total load" tension in real vehicle comparisons come from, if not from $\beta$ alone? It comes from **trajectory shape**, not ballistic coefficient. A steep, ballistic entry — the case worked throughout this lesson — is over in a couple of minutes: high peak rate, but a short exposure limits the integral. A vehicle flying an *equilibrium glide* at substantial lift-to-drag ratio (lesson 7 derives this trajectory) trades a much lower, gentler deceleration for a dramatically longer time in the hypersonic regime — plausibly tens of minutes rather than a couple, an order of magnitude longer exposure. A low, gentle heat rate sustained ten times longer can integrate to a total load comparable to, or exceeding, a short, sharp pulse's — which is exactly why a lifting entry vehicle's thermal protection system is sized as much by duration as by any single peak number, even though its peak flux sits far below a ballistic capsule's. The rate-versus-load distinction is real and matters for every TPS design; the lever that decouples them is how long the vehicle stays in the heating environment, which is a trajectory-shape question, not simply a ballistic-coefficient one.

::: warning Do not extrapolate the $\sqrt\beta$ result across different trajectory shapes
The result that peak rate and total load move together with $\beta$ holds for a fixed flight-path angle and a fixed (ballistic, no-lift) trajectory shape — exactly the comparison worked in this lesson. It says nothing about comparing a steep ballistic entry to a shallow lifting glide, where duration changes by an order of magnitude and the rate-versus-load trade re-emerges through that mechanism instead.
:::

## Check yourself

::: check
Write the Sutton-Graves convective heating correlation and identify which two vehicle or entry properties it depends on most steeply.
:::

::: answer
$\dot q_c = k\sqrt{\rho/R_n}\,v^3$, with $k \approx 1.7415\times10^{-4}$ in SI units. The steepest dependence by far is on speed, entering cubed; nose radius enters only as an inverse square root, and density likewise as a square root. A given percentage change in entry speed changes heat rate roughly three times faster (in percentage terms) than the same percentage change in nose radius or density.
:::

::: check
Explain, from the boundary-layer argument in this lesson, why a large nose radius reduces convective heating at the stagnation point.
:::

::: answer
The stagnation-point heat-transfer coefficient scales as $\sqrt{\rho v/R_n}$, which comes from the velocity gradient the flow experiences as it decelerates to zero at the stagnation point: a larger nose radius spreads that deceleration over a longer distance, producing a gentler velocity gradient, a thicker and less efficient conducting boundary layer, and a lower heat-transfer coefficient. This is the physical reason blunt-body shapes — a large $R_n$ relative to the vehicle's size — were adopted for crewed capsule heat shields once Allen and Eggers identified the mechanism.
:::

::: check
Why does radiative heating matter far more for a lunar-return entry than for a LEO-return entry, even though both use the same vehicle?
:::

::: answer
Radiative heating from the shock layer rises with a very steep power of velocity — commonly cited as the seventh to ninth power — far steeper than convective heating's cubic dependence. At LEO-return speeds ($7$–$8\ \mathrm{km/s}$) this steep term is still small in absolute terms and convective heating dominates; at lunar-return speeds ($11\ \mathrm{km/s}$, roughly $40$–$60$ percent faster) the same steep power law produces a much larger relative increase in the radiative term than in the convective one, so radiative heating becomes a meaningful, sometimes dominant, fraction of the total thermal environment.
:::

::: check
A vehicle's $\beta$ is halved at fixed entry speed and angle. What happens to its peak heat rate and its total heat load, and why is this *not* the trade-off that "low ballistic coefficient" is sometimes casually said to cost?
:::

::: answer
Both peak heat rate and total heat load fall by a factor of $\sqrt2 \approx 1.414$ — they move in the *same* direction, because both scale as $\sqrt\beta$ for a fixed flight-path angle and trajectory shape, as this lesson derives and the worked table confirms. There is no rate-versus-load trade-off from changing $\beta$ alone; a lower ballistic coefficient is a win on both thermal metrics simultaneously. The real cost of a very low $\beta$ is a larger drag area for the vehicle's mass (packaging and structural cost) and a narrower entry corridor, not a worse thermal picture.
:::

::: check
If lowering $\beta$ improves both peak heat rate and total heat load together, where does the classic engineering tension between a low peak rate and a high total load actually come from?
:::

::: answer
From trajectory shape and duration, not from ballistic coefficient. A steep ballistic entry is short, so even a high peak rate does not have long to integrate into total load. A shallow, lifting equilibrium glide (lesson 7) trades a much lower peak deceleration and heat rate for an entry that can last an order of magnitude longer, and a low rate sustained that much longer can integrate to a total load comparable to a short, sharp entry's — which is why a lifting vehicle's TPS is sized as much by duration as by any single peak number.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $h_c \propto \sqrt{\rho v/R_n}$ | Stagnation-point convective heat-transfer coefficient, from boundary-layer scaling |
| $\dot q_c = k\sqrt{\rho/R_n}\,v^3$ | Sutton-Graves convective heating correlation, $k \approx 1.7415\times10^{-4}$ SI |
| Radiative heating | Rises as roughly the $7$th–$9$th power of velocity; negligible below about $9$–$10\ \mathrm{km/s}$, significant to dominant above it |
| Peak heat rate | Sizes TPS *material* choice — must survive the single worst instant |
| Total heat load $Q = \int \dot q_c\,dt$ | Sizes TPS *thickness / mass* — the energy the shield must absorb over the whole entry |
| $Q \approx (k v_E^2/\sqrt{R_n})\sqrt{\pi\beta H/s}$ | Both $\dot q_{c,\max}$ and $Q$ scale as $\sqrt\beta$ at fixed $\gamma_E$, $v_E$ — same direction, not a trade-off |
| Real rate-vs-load tension | Comes from trajectory shape (steep-short vs. shallow-lifting-long), not from $\beta$ alone |

The next lesson holds entry speed and angle fixed and sweeps $\beta$ alone, to see what it does to the *shape* of a ballistic trajectory — how far downrange it travels, how long it takes, and how fast it is still moving when it reaches the ground.
