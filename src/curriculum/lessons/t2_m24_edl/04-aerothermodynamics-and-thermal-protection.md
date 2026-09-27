---
id: l04-aerothermodynamics-and-thermal-protection
title: Aerothermodynamics and thermal protection
minutes: 22
covers:
  - "aerothermodynamics: convective and radiative heating, Sutton-Graves"
  - thermal protection systems, heat rate vs heat load
---

Touch a hot frying pan for a split second and you pull your hand away unhurt. Hold a warm mug for ten minutes and your palm ends up soaking in far more heat, even though it never felt dangerous. Those are two different ways heat can hurt: *how fast* it arrives, and *how much* arrives in total. A heat shield has to survive both.

The previous lesson found the shape of entry heating, $\dot q \propto \sqrt\rho\,v^3$, but left the constant out. An engineer picking a heat shield material needs a number in watts per square centimeter. This lesson supplies it. It gives the **Sutton-Graves correlation**, the standard first-pass formula for heating at the nose of any blunt entry vehicle, and explains where its form comes from. Then it asks the question a heat shield really has to answer: how hot, for how long, and which of those two numbers decides which part of the design.

On a real vehicle, this is the heat shield on the flat bottom of a Dragon or Orion capsule, or the black tiles under the Space Shuttle. The name for all of it is the **thermal protection system**, or **TPS** — every layer whose job is to keep entry heat out of the vehicle.

## Two different questions for a heat shield

The first question is about the worst single moment. At the peak of heating, energy pours onto the surface faster than at any other time. If the surface gets hotter than the material can stand, it fails, even if that moment is short. This is a **rate** problem. The **heat rate** $\dot q$ (read "q-dot") is energy arriving per second on each square centimeter, in $\mathrm{W/cm^2}$.

The second question is about the whole trip. Add up every second of heating from the top of the atmosphere to the ground. That total is energy the shield must soak up or carry away without burning all the way through. This is a **load** problem. The **heat load** $Q$ is the rate added up over time, in $\mathrm{J/cm^2}$.

Mix these two up and you either fly a heat shield far heavier than it needs to be, or one that survives the peak and then burns through on the way down.

## Convective heating: where the formula comes from

Blow across a spoonful of hot soup and it cools faster. Moving air carries heat much better than still air. Entry heating is the same effect run backwards. The air around the vehicle is far hotter than the vehicle, and the faster and denser that air is, the more heat it hands over. Heat carried by moving gas like this is called **convective heating**.

The hottest spot is usually the **[[stagnation point|stagnation-point]]** — the point on the nose where the oncoming air is brought to a complete stop. In front of it stands the **bow shock**, a thin wall where the air is slammed from hypersonic speed to subsonic and heated to thousands of degrees. Between that hot gas and the much cooler surface sits a thin **[[boundary layer|boundary-layer]]**, a skin of slow-moving air right next to the wall. Heat has to cross that layer to reach the surface.

### Step 1: how well the air carries heat

The theory of the boundary layer at a stagnation point says the **heat-transfer coefficient** $h_c$ — how readily heat crosses the layer — scales as

$$
h_c \propto \sqrt{\frac{\rho\,v}{R_n}}.
$$

Here $\rho$ ("rho") is the air density ahead of the vehicle, $v$ is the speed, and $R_n$ (read "R sub n") is the **nose radius**, the radius of the rounded front of the vehicle.

The nose radius sits on the bottom, so a bigger, blunter nose means less heating. Here is why. A big rounded nose slows the air down over a longer distance. The air's speed changes more gently near the stagnation point. That gentler change leaves a *thicker* boundary layer, and a thick layer is a poorer conductor of heat, like a thicker blanket. This is the physical reason crewed capsules have wide, gently curved heat shields instead of pointed noses.

### Step 2: how much heat there is to carry

Multiply the coefficient by how much energy the hot gas has to hand over. At hypersonic speed that energy per kilogram of air is almost entirely the vehicle's own kinetic energy per kilogram, $v^2/2$. (Engineers call energy per kilogram of flowing gas its **[[enthalpy|enthalpy]]**.) So

$$
\dot q \propto \sqrt{\frac{\rho\,v}{R_n}}\cdot v^2 = \sqrt{\frac{\rho}{R_n}}\,v^{2.5}.
$$

### Step 3: the real gas adds a little more

The simple picture treats the air's properties as fixed, but in a real shock layer they change. The shocked air becomes **[[more viscous as it heats up|extra-half-power]]**, and at high enough speed its molecules break apart (**dissociate**) and lose electrons (**ionize**). A simple boundary-layer estimate misses these effects. When Sutton and Graves fitted the results of detailed stagnation-point heating calculations across a wide range of gases and conditions, they found the speed power comes out close to three, not $2.5$. Their result is still the standard engineering correlation for a first estimate:

$$
\dot q_c = k\sqrt{\frac{\rho}{R_n}}\,v^3, \qquad k = 1.7415\times10^{-4}.
$$

The subscript $c$ means "convective". The constant $k$ has this value in SI units: $\rho$ in $\mathrm{kg/m^3}$, $R_n$ in meters, $v$ in meters per second, and then $\dot q_c$ comes out in $\mathrm{W/m^2}$. Divide by $10^4$ (there are $10^4$ square centimeters in a square meter) to get the more usual engineering unit, **[[watts per square centimeter|w-per-cm2]]**.

This completes the shape from the previous lesson: $\sqrt\rho\,v^3$, now multiplied by $k/\sqrt{R_n}$.

::: key The Sutton-Graves convective heating correlation
$$
\dot q_c = k\sqrt{\frac{\rho}{R_n}}\,v^3, \qquad k \approx 1.7415\times10^{-4}\ \text{SI}.
$$
Density to the one-half power, nose radius to the minus one-half power, speed *cubed*. The cubic dependence on speed is why entry speed dominates the thermal problem far more than it dominates the structural one (deceleration goes only as $v^2$). It is also why the nose radius $R_n$ is made as large as the mission's drag and stability budget allow.
:::

### The peak of the heating, in closed form

Lesson 3 found where heating peaks along a ballistic entry, using the Allen-Eggers solution $v = v_E\,e^{-\rho H/(2\beta s)}$. Here $v_E$ is the entry speed, $H$ the scale height, $\beta$ the ballistic coefficient, and $s = |\sin\gamma_E|$ the sine of the entry angle. The peak sits where the density is

$$
\rho^*_q = \frac{\beta s}{3H}.
$$

Put that density into the exponent of the Allen-Eggers solution. The exponent becomes $\rho^*_q H/(2\beta s) = 1/6$, so the speed at the heating peak is always $v^*_q = v_E\,e^{-1/6} = 0.8465\,v_E$. Now put both into Sutton-Graves. The cube of the speed brings $e^{-3/6} = e^{-1/2}$:

$$
\dot q_{c,\max} = k\sqrt{\frac{\beta s}{3H R_n}}\;v_E^3\,e^{-1/2}.
$$

There is $\sqrt\beta$ sitting in plain view. Unlike peak deceleration, peak heating rate grows as the ballistic coefficient grows.

::: example Peak heat rate for a steep ballistic entry
Take a steep, zero-lift entry — the kind flown by an instrumented test vehicle, or by a reentry body flown deliberately steep to keep its path predictable. Entry speed $v_E = 7000\,\mathrm{m/s}$, entry angle $\gamma_E = -40^\circ$, nose radius $R_n = 0.5\,\mathrm{m}$, ballistic coefficient $\beta = 200\,\mathrm{kg/m^2}$. Use $H = 7200\,\mathrm{m}$ and $\rho_0 = 1.225\,\mathrm{kg/m^3}$.

**Step 1: the sine of the angle.** $s = \sin 40^\circ = 0.6428$.

**Step 2: the density at peak heating.**

$$
\rho^*_q = \frac{\beta s}{3H} = \frac{200 \times 0.6428}{3 \times 7200} = \frac{128.6}{21{,}600} = 5.952\times10^{-3}\ \mathrm{kg/m^3}.
$$

**Step 3: the altitude where that density occurs.** Undo the exponential atmosphere $\rho = \rho_0 e^{-h/H}$:

$$
h^*_q = H\ln\frac{\rho_0}{\rho^*_q} = 7200 \times \ln\frac{1.225}{5.952\times10^{-3}} = 7200 \times \ln 205.8 = 7200 \times 5.327 = 38.35\ \mathrm{km}.
$$

**Step 4: the speed there.** $v^*_q = 0.8465 \times 7000 = 5925\,\mathrm{m/s}$. It has lost only about $15\%$ of its speed, since heating peaks early.

**Step 5: Sutton-Graves.** First the square root: $\rho^*_q/R_n = 5.952\times10^{-3}/0.5 = 0.01190$, and $\sqrt{0.01190} = 0.1091$. Next the cube: $5925^3 = 2.080\times10^{11}$. Multiply:

$$
\dot q_{c,\max} = 1.7415\times10^{-4} \times 0.1091 \times 2.080\times10^{11} = 3.953\times10^{6}\ \mathrm{W/m^2} = 395.3\ \mathrm{W/cm^2}.
$$

**Check.** The closed-form peak formula above gives the same $395.3\,\mathrm{W/cm^2}$, and so does searching $\dot q_c(h)$ point by point along the same trajectory, to five significant figures. For scale, that is nearly three thousand times the power of full sunlight on the same patch.

**What if it came back from the Moon?** A lunar-return entry at $11\,\mathrm{km/s}$, same angle, same vehicle, multiplies this by $(11{,}000/7000)^3 = 3.88$, giving about $1534\,\mathrm{W/cm^2}$. A speed only $57\%$ higher nearly quadruples the heat rate. That is the cube at work.
:::

## Radiative heating: convection's steeper cousin

Heat iron in a forge and it glows, sending out heat as light with no moving air needed. At very high entry speeds the gas in the shock layer gets hot enough to glow like that, and the light it sends onto the vehicle is extra heating on top of the convective part. This is **radiative heating**.

Radiative heating rises far more steeply with speed than convective heating. Commonly cited correlations put it somewhere around the **seventh to ninth power** of speed, depending on the speed range and nose radius. So:

- For a return from low Earth orbit at $7$–$8\,\mathrm{km/s}$, it is negligible.
- For a lunar return near $11\,\mathrm{km/s}$, it is a meaningful share of the total.
- For much faster entries, it can take over. The **[[Galileo probe|galileo-probe]]** that entered Jupiter's atmosphere was heated mostly by radiation.

There is a twist in how the two kinds of heating respond to shape. Convective heating favors a *large* nose, because of the $1/\sqrt{R_n}$. Radiative heating generally favors a *smaller* one. A smaller nose pulls the bow shock in closer, so there is a thinner layer of glowing gas in front of the vehicle to shine on it. The two effects pull the vehicle's shape in opposite directions. A designer of a very fast entry vehicle has to balance both instead of minimizing one at the other's expense.

::: warning Sutton-Graves is convective heating only
The correlation above includes none of the radiative part. For entries below about $9$–$10\,\mathrm{km/s}$ that is usually an acceptable simplification, because radiation is a small fraction of the total there. For anything faster, quoting a Sutton-Graves number alone as "the" peak heat rate understates the real heating, sometimes badly.
:::

## Heat rate versus heat load

Back to the frying pan and the mug. Each number sizes a different part of the heat shield.

The **peak heat rate** picks the *material*. Each material has a highest temperature it can survive, and that sets a limit on the heat rate. Go over it, even briefly, and the surface fails, no matter how short the exposure.

The **total heat load** picks the *thickness*, and so the *mass*. The load is the time integral of the rate — the rate added up second by second over the whole entry:

$$
Q = \int \dot q_c\,dt.
$$

That total is, to a good approximation, proportional to how much **[[ablative|ablator]]** material must char and wear away, or how much heat must soak into the layers underneath and be stored there. A heat shield material's data sheet carries both: a peak flux rating in $\mathrm{W/cm^2}$ and a total load rating in $\mathrm{J/cm^2}$.

### How the two numbers depend on the ballistic coefficient

How do both depend on $\beta$? The answer surprises many people. For the steep ballistic entry above, the total convective heat load at the stagnation point comes out as

$$
Q \approx \frac{k\,v_E^2}{\sqrt{R_n}}\sqrt{\frac{\pi\beta H}{s}}.
$$

(The note below derives it.) $Q$ grows as $\sqrt\beta$, and so does $\dot q_{c,\max}$. Both move in the *same* direction when $\beta$ changes.

::: note Why it has to be true: the heat-load formula
Start from $Q = \int \dot q_c\,dt$. On a straight-line ballistic path, altitude falls at the rate $v s$, so a small step in time is $dt = -dh/(v s)$ (lesson 2). Flip the limits to get rid of the minus sign:

$$
Q = \int_0^{\infty} k\sqrt{\frac{\rho}{R_n}}\,v^3\,\frac{dh}{v\,s} = \frac{k}{s\sqrt{R_n}}\int_0^{\infty}\sqrt{\rho}\,v^2\,dh.
$$

Now switch from altitude to density. From $\rho = \rho_0 e^{-h/H}$, a small step is $dh = -H\,d\rho/\rho$. The Allen-Eggers solution gives $v^2 = v_E^2\,e^{-\rho H/(\beta s)}$. Substituting, and letting density run from nearly zero (the top) up to $\rho_0$ (the ground):

$$
Q = \frac{k\,v_E^2 H}{s\sqrt{R_n}}\int_0^{\rho_0}\rho^{-1/2}\,e^{-\rho H/(\beta s)}\,d\rho.
$$

The exponential is utterly tiny by the time $\rho$ reaches $\rho_0$ (for this vehicle the exponent is about $-69$), so the upper limit can be pushed to infinity with no visible change. Substitute $u = \rho H/(\beta s)$, so that $\rho^{-1/2}d\rho = \sqrt{\beta s/H}\;u^{-1/2}du$:

$$
\int_0^{\infty}\rho^{-1/2}e^{-\rho H/(\beta s)}d\rho = \sqrt{\frac{\beta s}{H}}\int_0^{\infty}u^{-1/2}e^{-u}\,du = \sqrt{\frac{\beta s}{H}}\,\sqrt{\pi}.
$$

(The last integral equals $\sqrt\pi$; with $u = x^2$ it becomes the famous bell-curve integral $2\int_0^\infty e^{-x^2}dx$.) Put it back:

$$
Q = \frac{k\,v_E^2 H}{s\sqrt{R_n}}\sqrt{\frac{\pi\beta s}{H}} = \frac{k\,v_E^2}{\sqrt{R_n}}\sqrt{\frac{\pi\beta H}{s}}.
$$
:::

Here are both numbers for the same vehicle ($v_E = 7000\,\mathrm{m/s}$, $\gamma_E = -40^\circ$, $R_n = 0.5\,\mathrm{m}$), sweeping $\beta$ from $50$ to $800\,\mathrm{kg/m^2}$, a $16$-fold range:

| $\beta$ ($\mathrm{kg/m^2}$) | $\dot q_{c,\max}$ ($\mathrm{W/cm^2}$) | $Q$ ($\mathrm{J/cm^2}$) |
| --- | --- | --- |
| $50$ | $197.6$ | $1601$ |
| $100$ | $279.5$ | $2264$ |
| $200$ | $395.3$ | $3202$ |
| $400$ | $559.0$ | $4528$ |
| $800$ | $790.6$ | $6403$ |

Each row doubles $\beta$. Each step down a column multiplies by $\sqrt2 = 1.414$. For example, $279.5/197.6 = 1.414$ and $2264/1601 = 1.414$. The $\sqrt\beta$ scaling shows up directly in the numbers.

So for this kind of entry, a low $\beta$ wins on *both* counts at once. This fits the heart of the **[[blunt-body idea|blunt-body]]** that H. Julian Allen and A. J. Eggers put forward in the 1950s. A vehicle that is light for its drag area — usually because it is blunt — does its slowing down high up in thin air. Thinner air along the whole slowdown means a lower peak rate *and* less total heat delivered to the nose, because there is less air to carry heat in while the vehicle sheds its energy.

::: key Ballistic coefficient and the heat shield
A low ballistic coefficient decelerates the vehicle higher up, in thinner air. That lowers the *peak heat rate*. It also stretches the deceleration out over a longer time, and when that longer exposure comes with a shallower or lifting trajectory, it often *raises* the integrated *heat load*. (For a straight ballistic entry at a fixed angle, load actually falls with $\beta$ too, as $\sqrt\beta$.) Peak rate sizes the TPS material; total load sizes its thickness and mass.
:::

::: example Cutting β by four: both numbers fall together
Compare $\beta = 400\,\mathrm{kg/m^2}$ with $\beta = 100\,\mathrm{kg/m^2}$. That is a four-fold cut. Since $\beta = m/(C_D A)$, you could get it by quadrupling the drag area $C_D A$ at the same mass, or by halving the mass *and* doubling the drag area — any mix that divides $\beta$ by four.

**Peak rate.** From the table, $559.0 \to 279.5\,\mathrm{W/cm^2}$. That is a factor of $559.0/279.5 = 2$, and $2 = \sqrt4$, as the $\sqrt\beta$ rule says.

**Total load.** From the table, $4528 \to 2264\,\mathrm{J/cm^2}$. Again a factor of $2$.

**What it means for a material.** Suppose a material is rated to survive $560\,\mathrm{W/cm^2}$ peak and $4600\,\mathrm{J/cm^2}$ total. At $\beta = 400$ it is right at its limits. At $\beta = 100$ it has about twice the margin on both, at the same time, with nothing traded away.

**So why not drive β as low as possible?** The reason is not thermal. A very low $\beta$ means a huge drag area for the mass carried. That costs packaging volume and structural mass. And, as lesson 6 shows, it narrows the range of entry angles you can fly before the vehicle skips back out of the atmosphere.
:::

### Where the real rate-versus-load tension comes from

Then where does the familiar "low peak rate, but high total load" comparison come from? From the **shape of the trajectory** — how long the vehicle spends in the heating.

A steep ballistic entry, like the one worked above, is over in a couple of minutes. Its peak rate is high, but the exposure is short, so the total stays limited.

A vehicle flying an **equilibrium glide** with real lift (lesson 7 derives this trajectory) is different. It trades a much gentler deceleration for a much longer time at hypersonic speed — tens of minutes instead of a couple, an order of magnitude longer. A low, gentle heat rate kept up ten times as long can add up to a total load as big as a short, sharp pulse's, or bigger. That is why a lifting vehicle's TPS is sized as much by *duration* as by any single peak number, even though its peak flux sits far below a ballistic capsule's.

So the lever that pulls rate and load apart is **[[how long the vehicle stays in the heating|rate-vs-load-picture]]** — a question of trajectory shape, not of ballistic coefficient alone.

::: warning Do not stretch the √β result across different trajectory shapes
Peak rate and total load move together with $\beta$ only for a fixed flight-path angle and a fixed ballistic (no-lift) trajectory shape — exactly the comparison worked in this lesson. The result says nothing about comparing a steep ballistic entry with a shallow lifting glide. There, the duration changes by an order of magnitude, and the rate-versus-load trade comes back through that route.
:::

## Check yourself

::: check
Write the Sutton-Graves convective heating correlation. Which quantity does it depend on most steeply?
:::

::: answer
$\dot q_c = k\sqrt{\rho/R_n}\,v^3$, with $k \approx 1.7415\times10^{-4}$ in SI units (giving $\mathrm{W/m^2}$).

By far the steepest dependence is on speed, which enters cubed. Nose radius enters only as an inverse square root, and density as a square root.

In percentage terms: a $1\%$ change in speed changes the heat rate by about $3\%$, while a $1\%$ change in density or nose radius changes it by only about $0.5\%$. So, percent for percent, speed moves the heat rate about six times as hard as either of the other two.
:::

::: check
Using the boundary-layer argument from this lesson, explain why a large nose radius reduces convective heating at the stagnation point.
:::

::: answer
The stagnation-point heat-transfer coefficient scales as $\sqrt{\rho v/R_n}$. The $R_n$ comes from how sharply the air slows down as it approaches the stagnation point.

A larger nose spreads that slowing over a longer distance. The speed of the air changes more gently, which leaves a thicker boundary layer. A thicker layer conducts heat less well, so the heat-transfer coefficient, and the heating, drop.

This is the physical reason blunt shapes — a large $R_n$ compared with the vehicle's size — were adopted for crewed capsule heat shields once Allen and Eggers identified the mechanism.
:::

::: check
Why does radiative heating matter far more for a lunar-return entry than for a return from low Earth orbit, even with the same vehicle?
:::

::: answer
Radiative heating from the shock layer rises with a very steep power of speed — commonly cited as the seventh to ninth power — much steeper than convective heating's cube.

A lunar return at $11\,\mathrm{km/s}$ is about $41\%$ faster than a return at $7.8\,\mathrm{km/s}$. That multiplies convective heating by $(11/7.8)^3 \approx 2.8$, but multiplies an eighth-power radiative term by $(11/7.8)^8 \approx 15.6$.

At $7$–$8\,\mathrm{km/s}$ the radiative term starts out small, so it stays negligible. At $11\,\mathrm{km/s}$ the steep power law has grown it much faster than the convective part, and it becomes a meaningful, sometimes dominant, share of the heating.
:::

::: check
A vehicle's $\beta$ is halved, with entry speed and angle unchanged. What happens to its peak heat rate and its total heat load? Why is this *not* the trade-off people sometimes casually say a low ballistic coefficient costs?
:::

::: answer
Both fall by a factor of $\sqrt2 \approx 1.414$. They move in the *same* direction, because for a fixed flight-path angle and trajectory shape both scale as $\sqrt\beta$ — derived in this lesson and confirmed by the table.

So there is no rate-versus-load trade from changing $\beta$ alone. A lower ballistic coefficient is a win on both thermal numbers at once.

The real costs of a very low $\beta$ are elsewhere: a larger drag area for the vehicle's mass (packaging and structural cost) and a narrower entry corridor.
:::

::: check
If lowering $\beta$ improves both peak heat rate and total heat load together, where does the classic engineering tension between "low peak rate" and "high total load" actually come from?
:::

::: answer
From trajectory shape and duration, not from the ballistic coefficient.

A steep ballistic entry is short, so even a high peak rate does not have long to add up into a large load.

A shallow, lifting equilibrium glide (lesson 7) trades a much lower peak deceleration and heat rate for an entry that can last an order of magnitude longer. A low rate kept up that much longer can add up to a total load as large as a short, sharp entry's. That is why a lifting vehicle's TPS is sized as much by duration as by any single peak number.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| TPS | Thermal protection system: every layer that keeps entry heat out of the vehicle |
| $h_c \propto \sqrt{\rho v/R_n}$ | Stagnation-point convective heat-transfer coefficient, from boundary-layer scaling |
| $\dot q_c = k\sqrt{\rho/R_n}\,v^3$ | Sutton-Graves convective heating correlation, $k \approx 1.7415\times10^{-4}$ SI; divide $\mathrm{W/m^2}$ by $10^4$ for $\mathrm{W/cm^2}$ |
| $v^*_q = v_E e^{-1/6} = 0.8465\,v_E$ | Speed at peak heating on a ballistic entry |
| $\dot q_{c,\max} = k\sqrt{\beta s/(3HR_n)}\,v_E^3 e^{-1/2}$ | Peak convective heat rate, ballistic entry — grows as $\sqrt\beta$ |
| Radiative heating | Rises roughly as the $7$th–$9$th power of speed; negligible below about $9$–$10\,\mathrm{km/s}$, significant to dominant above; favors a smaller nose |
| Peak heat rate | Sizes the TPS *material* — it must survive the single worst instant |
| Total heat load $Q = \int \dot q_c\,dt$ | Sizes TPS *thickness and mass* — the energy the shield must absorb over the whole entry |
| $Q \approx (k v_E^2/\sqrt{R_n})\sqrt{\pi\beta H/s}$ | Both $\dot q_{c,\max}$ and $Q$ scale as $\sqrt\beta$ at fixed $\gamma_E$, $v_E$ — same direction, not a trade-off |
| Real rate-versus-load tension | Comes from trajectory shape (steep and short versus shallow, lifting and long), not from $\beta$ alone |

The next lesson holds entry speed and angle fixed and sweeps $\beta$ alone, to see what it does to the *shape* of a ballistic trajectory — how deep the vehicle gets before slowing, how long the entry takes, how far downrange it travels, and how fast it is still moving near the ground.

::: context stagnation-point Where the air stops
Picture a blunt capsule flying to the left through still air — or, the same thing, air rushing to the right onto a capsule standing still. The air splits around the nose, and right in the middle one stream of it runs straight into the surface and stops. That spot is the stagnation point.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1.5">
    <line x1="20" y1="60" x2="120" y2="60"/><line x1="20" y1="100" x2="150" y2="100"/><line x1="20" y1="140" x2="120" y2="140"/>
  </g>
  <g fill="#6c7a93">
    <polygon points="120,60 112,56 112,64"/><polygon points="150,100 142,96 142,104"/><polygon points="120,140 112,136 112,144"/>
  </g>
  <text x="20" y="44" font-size="11" fill="#6c7a93">oncoming air</text>
  <path d="M205,15 Q140,100 205,185" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="212" y="22" font-size="11" fill="#b4232c">bow shock</text>
  <path d="M196.4,55 A70,70 0 0,0 196.4,145 L320,130 L320,70 Z" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <line x1="250" y1="100" x2="196.4" y2="55" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="250" cy="100" r="3" fill="#1f2a44"/>
  <text x="236" y="70" font-size="13" fill="#1f2a44">R<tspan font-size="11" dy="3">n</tspan></text>
  <circle cx="180" cy="100" r="5" fill="#1d6fd1"/>
  <text x="100" y="192" font-size="11" fill="#1d6fd1">stagnation point (blue dot)</text>
  <text x="262" y="104" font-size="11" fill="#1f2a44">capsule</text>
</svg>
```

The shock stands a short way ahead of the nose. The hot gas squeezed between shock and nose is where the heating comes from.
:::

::: context boundary-layer A thin blanket of slow air
Right against any surface, moving air sticks to the wall and is slowed almost to a stop. A little farther out it moves faster, and farther still it moves at full speed. That thin region of slowed air is the boundary layer. At a capsule's nose it can be only millimeters thick. Heat from the hot gas outside has to get through it to reach the wall, the way cold has to get through a blanket to reach you. A thicker layer insulates better — which is exactly what a big, blunt nose buys.
:::

::: context enthalpy Energy carried by flowing gas
Enthalpy is the energy a kilogram of flowing gas carries, counting both its heat and the work it can do by pushing on its surroundings. For entry, the useful fact is this: when hypersonic air is brought to rest at the nose, almost all of its energy per kilogram comes from its speed, about $v^2/2$. At $7\,\mathrm{km/s}$ that is $24.5$ million joules per kilogram — roughly half the energy stored in a kilogram of gasoline, carried in every kilogram of air the nose meets.
:::

::: context extra-half-power Where the extra half power of speed comes from
The simple boundary-layer argument gives $v^{2.5}$. The missing half power hides in the air's **viscosity**, its "stickiness". Hot gas is stickier than cold gas — the opposite of honey. Behind the bow shock the air's temperature rises roughly as $v^2$, and at such high temperatures its viscosity grows roughly as the square root of temperature, so roughly as $v$. The heat-transfer coefficient carries a square root of that viscosity, adding about $v^{0.5}$. Put it together and $v^{2.5}\cdot v^{0.5} = v^3$ — the power Sutton and Graves settled on.
:::

::: context w-per-cm2 How big is a watt per square centimeter?
Full sunlight at Earth delivers about $1361\,\mathrm{W/m^2}$, which is $0.136\,\mathrm{W/cm^2}$. The $395\,\mathrm{W/cm^2}$ from this lesson's example is about $2900$ times that — like gathering the sunlight falling on a patch about the size of a door (roughly $2\,\mathrm{m^2}$) onto a single postage stamp, second after second.
:::

::: context galileo-probe Entering Jupiter
In December 1995 the Galileo probe hit Jupiter's atmosphere at about $47\,\mathrm{km/s}$, still the fastest atmospheric entry ever flown. At that speed the glowing shock layer, not the convective boundary layer, delivered most of the heat. A large share of the probe's heat shield burned away during the few seconds of peak heating. It shows how the radiative term, negligible at low Earth orbit speeds, can take over entirely when the speed is high enough.
:::

::: context ablator Heat shields that burn on purpose
Many heat shields are ablative: they are made to char, melt and wear away slowly. Each gram that chars and blows off carries heat away with it, and the gas it gives off thickens the boundary layer, shielding the surface further. Apollo and Orion use a material called Avcoat; SpaceX's Dragon uses PICA-X, a version of a carbon material NASA developed for the Stardust sample-return capsule. The Space Shuttle instead used reusable tiles that did not wear away but soaked up and slowly released the heat.
:::

::: context blunt-body Why capsules are blunt
Before the 1950s, engineers assumed a fast reentering body should be sharp and streamlined, like a bullet. H. Julian Allen and A. J. Eggers, at the NACA's Ames laboratory, showed the opposite. A blunt face pushes the shock wave out in front, so most of the vehicle's energy goes into heating the *air* around it, which then streams away, instead of flowing into the vehicle. Every crewed capsule since — Mercury, Soyuz, Apollo, Dragon, Orion — has flown with a broad, blunt heat shield leading.
:::

::: context rate-vs-load-picture Same load, different shape
Draw the heat rate against time. The peak height is the heat rate that picks the material. The area under the curve is the heat load that picks the thickness.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="345" y="188" font-size="11" text-anchor="end" fill="#1f2a44">time</text>
  <text x="46" y="28" font-size="11" fill="#1f2a44">heat rate</text>
  <polygon points="90,170 90.0,169.7 95.0,169.5 100.0,169.3 105.0,169.0 110.0,168.6 115.0,168.0 120.0,167.3 125.0,166.4 130.0,165.3 135.0,163.9 140.0,162.2 145.0,160.3 150.0,158.0 155.0,155.4 160.0,152.5 165.0,149.4 170.0,146.1 175.0,142.7 180.0,139.3 185.0,136.0 190.0,133.0 195.0,130.3 200.0,128.1 205.0,126.4 210.0,125.4 215.0,125.0 220.0,125.4 225.0,126.4 230.0,128.1 235.0,130.3 240.0,133.0 245.0,136.0 250.0,139.3 255.0,142.7 260.0,146.1 265.0,149.4 270.0,152.5 275.0,155.4 280.0,158.0 285.0,160.3 290.0,162.2 295.0,163.9 300.0,165.3 305.0,166.4 310.0,167.3 315.0,168.0 320.0,168.6 325.0,169.0 330.0,169.3 335.0,169.5 340.0,169.7 340,170" fill="#8fb8f0" fill-opacity="0.7" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="60,170 60.0,169.5 65.0,168.7 70.0,166.6 75.0,162.1 80.0,153.8 85.0,140.1 90.0,120.7 95.0,97.2 100.0,73.9 105.0,56.5 110.0,50.0 115.0,56.5 120.0,73.9 125.0,97.2 130.0,120.7 135.0,140.1 140.0,153.8 145.0,162.1 150.0,166.6 155.0,168.7 160.0,169.5 160,170" fill="#f2b880" fill-opacity="0.7" stroke="#b4232c" stroke-width="2"/>
  <text x="122" y="48" font-size="11" fill="#b4232c">short, sharp: high peak rate</text>
  <text x="250" y="115" font-size="11" text-anchor="middle" fill="#1d6fd1">long, gentle: low peak rate</text>
  <text x="40" y="188" font-size="11" fill="#1f2a44">equal areas = equal heat load</text>
</svg>
```

The two shaded areas here are drawn equal. The gentle pulse peaks at under half the height of the sharp one, yet delivers the same total heat.
:::
