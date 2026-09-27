---
id: l03-receiver-clock-bias-the-fourth-unknown
title: The receiver clock as the fourth unknown
minutes: 21
covers:
  - Receiver clock bias as the fourth unknown
---

You are meeting four friends in a big park, and each one texts you "I left the gate at exactly 3:00". You know how fast each of them walks. If your phone's clock were perfect, the time each one arrives would tell you how far they walked, and you could work out where you are. But suppose your phone is a few minutes off and you do not know by how much. Then every "how long they walked" is wrong by the *same* amount. The trick is not to fix the phone. It is to treat "how wrong is my phone" as one more thing to work out — and with enough friends, you can.

That is exactly the situation of a GNSS receiver. The corrected pseudorange at the end of the last lesson still carried about $936{,}904\,\mathrm{m}$ that had nothing to do with geometry: the receiver's clock was $3.125\,\mathrm{ms}$ ahead of GPS time. Every other term was fixed with a model, a broadcast number or a second frequency. This one cannot be. The reason is not lazy receiver design but physics: a clock trustworthy to a few nanoseconds for hours is an atomic clock, and the satellites carry those precisely so the receiver does not have to.

So we stop treating the clock error as a nuisance to remove and start treating it as a quantity to *measure*, just like position. The list of unknowns — the **state** — of a GNSS fix is not $(x, y, z)$ but $(x, y, z, b)$, where $b = c\,\delta t_{rx}$ is the **clock bias** in metres. Four unknowns need four satellites. This lesson shows what goes wrong if you pretend otherwise (the failure is quiet and huge) and what you gain by doing it right: nanosecond time for free, a velocity solution with the same shape, and fallback modes for when four satellites are not available.

## What a receiver clock can and cannot do

A receiver keeps time with an **[[oscillator|oscillator]]**, a part that vibrates at a steady rate and is counted like the swings of a pendulum. Its quality is described by its **fractional frequency error** $y = \Delta f/f$: how far its rate is off, as a fraction of the rate. A clock whose rate is off by $y$ gains or loses $y$ seconds every second. In range units, that is $c\,y$ metres per second of **pseudorange drift**, the same for every satellite. The table shows what that means for the clocks a receiver might carry:

| Oscillator | Fractional error $y$ | Pseudorange drift $c\,y$ | Apparent L1 Doppler $f_{L1}\,y$ |
| --- | --- | --- | --- |
| Crystal (TCXO), uncalibrated frequency offset | $10^{-6}$ | $300\,\mathrm{m/s}$ | $1{,}575\,\mathrm{Hz}$ |
| TCXO, short-term stability | $10^{-9}$ | $0.30\,\mathrm{m/s}$ | $1.6\,\mathrm{Hz}$ |
| Oven-controlled crystal (OCXO) | $10^{-10}$ | $3\,\mathrm{cm/s}$ | $0.16\,\mathrm{Hz}$ |
| Chip-scale atomic clock | $10^{-11}$ | $3\,\mathrm{mm/s}$ | $0.016\,\mathrm{Hz}$ |
| Rubidium | $10^{-12}$ | $0.3\,\mathrm{mm/s}$ | $1.6\,\mathrm{mHz}$ |
| Caesium (satellite class) | $10^{-13}$ | $0.03\,\mathrm{mm/s}$ | $0.16\,\mathrm{mHz}$ |

Almost every receiver carries a **TCXO**, a temperature-compensated crystal oscillator. Out of the box it is off by about **[[a part per million|parts-per-million]]**, and it wanders by tenths of a part per million as the temperature changes. That is $300\,\mathrm{m}$ of pseudorange every second — the width of a landing pad every ten milliseconds. Even after you estimate and remove the frequency offset, the leftover wobble of $10^{-9}$ moves the range $30\,\mathrm{cm}$ each second.

No one-time calibration fixes this, because the error keeps changing. What a receiver *can* do is estimate the offset at every moment from the measurements themselves. That is exactly what solving for $b$ does. Between fixes the estimate goes stale by $c\,y\,\Delta t$. A tenth of a second later, a TCXO's bias has moved $30\,\mathrm{m}$ if its frequency offset is unknown, or $3\,\mathrm{cm}$ if that has been estimated too. The clock is, in effect, measured afresh every time.

::: key
The receiver clock bias $b = c\,\delta t_{rx}$ (metres) is the fourth unknown, alongside the three coordinates of $\mathbf{x}$. It cannot be calibrated away because a crystal oscillator's frequency error, $10^{-6}$ or so and temperature-dependent, produces a pseudorange drift of about $300\,\mathrm{m/s}$; only an atomic clock holds time to nanoseconds for more than seconds. Four unknowns need four satellites.
:::

## Three spheres and a wrong answer

Suppose you ignored the clock. Each pseudorange would then be a radius, and each satellite the center of a sphere of that radius. Three spheres meet at a point, and that point would be the receiver. This is how the problem is often drawn, and the drawing hides the failure completely. Three spheres in general *do* meet at a point — the wrong one. Adding the same amount to every radius does not make the spheres miss each other. It moves where they meet.

::: example A flat-world receiver with a clock error
Work in a plane first, where spheres become circles. Put a receiver at $(1.0, 2.0)\,\mathrm{km}$ with clock bias $b = 0.5\,\mathrm{km}$. Put three transmitters at $(0, 20)$, $(15, 12)$ and $(-10, 15)\,\mathrm{km}$.

**The measurements.** The true distances are $18.028$, $17.205$ and $17.029\,\mathrm{km}$. Each pseudorange is $0.5\,\mathrm{km}$ longer.

**Ignore the clock.** Treat each pseudorange as a radius and intersect the circles two at a time:

- circles 1 and 2 meet at $(0.754, 1.488)$;
- circles 1 and 3 meet at $(1.195, 1.511)$;
- circles 2 and 3 meet at $(0.910, 1.280)\,\mathrm{km}$.

(Each pair also crosses at a second point $24$ to $34\,\mathrm{km}$ away, easily thrown out.) Three different answers, none of them right, each about half a kilometre from the truth. That spread is the clock bias made visible. Any *two* circles agree with each other perfectly; only all three together show that something is wrong — and only if you look.

**Solve for the clock too.** Now take three unknowns $(x, y, b)$ and the three equations $\rho_i = \|\mathbf{s}_i - \mathbf{x}\| + b$. Straighten them out around a guess, solve, and repeat — the method the next lesson builds in three dimensions. Start at the origin with $b = 0$:

- after one step, $(1.093, 2.188, 0.716)$;
- after two, $(1.0007, 2.0015, 0.5018)$;
- after three, every error is below a millimetre;
- the fourth step changes the answer by only $1.5 \times 10^{-7}\,\mathrm{km}$.

The bias comes out as $0.500\,\mathrm{km}$ and the position is exact.

**Only two transmitters.** Now there are more unknowns than measurements, and the failure has a definite shape. For every bias you might assume, some position fits both pseudoranges exactly. Assume $b = 0$: $(0.754, 1.488)$. Assume $b = 1.0$: $(1.248, 2.517)$. Assume $b = 2.0$: $(1.753, 3.565)\,\mathrm{km}$. All fit with zero error. The answers lie along a **[[curve|solution-curve]]**, and nothing in two measurements picks a point on it.
:::

In three dimensions the same thing happens, with one more direction for the error to hide in. It hides in the vertical.

::: example Ignoring the clock at Cape Canaveral
Put the receiver at Cape Canaveral, as in the last lesson. Take four satellites at (azimuth, elevation) of $(135^\circ, 60^\circ)$, $(45^\circ, 30^\circ)$, $(225^\circ, 25^\circ)$ and $(315^\circ, 45^\circ)$, all at the GPS radius of $26{,}560\,\mathrm{km}$. Make exact pseudoranges with a clock bias of $30\,\mathrm{km}$ — a receiver clock $100\,\mathrm{\mu s}$ fast, nothing unusual for a crystal.

**Three satellites, clock ignored.** Solve for position only with the first three, taking the pseudoranges as true distances. The three spheres meet exactly: the leftover error is zero to computer precision. But the meeting point is $83.1\,\mathrm{km}$ from the receiver — $38.9\,\mathrm{km}$ east, $34.9\,\mathrm{km}$ south, and $64.6\,\mathrm{km}$ *below* the ground. Three consistent measurements, an exactly consistent answer, and a position **[[in Earth's mantle|underground]]**.

**A bigger bias.** Repeat with the $3.125\,\mathrm{ms}$ bias from the last lesson, $936.9\,\mathrm{km}$. The spheres still meet exactly, with zero leftover — at a point $2{,}342\,\mathrm{km}$ away and $1{,}811\,\mathrm{km}$ below the surface.

**Four satellites, four unknowns.** Now solve all four pseudoranges for position *and* bias, starting from Earth's center with $b = 0$. Within six steps the position error is a few billionths of a metre, and so is the bias error. The unknown that was poisoning the answer comes back almost perfectly once it has its own slot.
:::

The direction of the error is no accident. Every satellite is above the receiver. So if you move the receiver *down*, every satellite gets farther away at once — a satellite at elevation $\theta$ by $\sin\theta$ times the move. A shared increase in every range, which is what a clock bias is, can be traded almost perfectly for a [[downward shift|clock-height]]. The clock bias and the height point in nearly the same direction in measurement space. That is why the "clock ignored" answers are mostly height error, why the vertical is always the weakest part of a GNSS fix, and why the time and vertical dilutions of precision are large together — an idea the dilution-of-precision lesson makes exact.

::: warning
When there are exactly as many measurements as unknowns, the fit has zero leftover error, whatever the measurements hold. Three satellites solved for three coordinates fit perfectly and put you $80\,\mathrm{km}$ underground. Four satellites solved for four unknowns also fit perfectly, and are right only because the model is now complete. The leftovers of an exactly determined fit say nothing about whether it is right. That is the case for a fifth satellite, and for the integrity-monitoring lesson later in the module.
:::

## Two ways to handle the bias: estimate it, or difference it away

Once $b$ is admitted as an unknown, there are two ways to deal with it, and they give the same answer.

**Estimate it.** Write the four (or more) equations $\rho_i = \|\mathbf{s}_i - \mathbf{x}\| + b$, straighten them around a guess, and solve. How much does $\rho_i$ change when $b$ changes by one metre? By exactly one metre, for every satellite: the **partial derivative** $\partial\rho_i/\partial b$ ("the partial of rho i with respect to b") is $1$. So the table of derivatives the solver uses — the **Jacobian** — gets a column of ones. It is the fourth column of the **[[geometry matrix|jacobian-bridge]]** the next lesson builds. It also explains why satellites at different elevations are worth such different amounts: the clock column is the same for all of them, so a satellite helps only as much as its direction differs from everyone else's.

**Difference it away.** Subtract satellite 1's pseudorange from each of the others:

$$
\rho_i - \rho_1 = \|\mathbf{s}_i - \mathbf{x}\| - \|\mathbf{s}_1 - \mathbf{x}\| .
$$

The bias cancels, because it appears in both. Each equation now says that the *difference* of your distances to two satellites is known. The set of points with a fixed difference of distances to two points is a **[[hyperboloid|hyperboloid]]**, a curved surface with the two satellites as its focal points. Four satellites give three hyperboloids, and they meet at the receiver. This is the **time-difference-of-arrival** picture, and it is the right way to think about what the measurements pin down: not distances, but differences of distances.

The two are equivalent because differencing is a reversible, linear reshuffle of the same data. Estimation wins in practice for one reason. Every difference contains satellite 1's noise, so the differences are **correlated** — their errors move together — and a correct weighted solution would have to track that. Estimating $b$ directly keeps each measurement's error independent and the weights simple. The least-squares module explains why that matters. Here the point is that "four satellites" is not a rule to memorize. It is a count of unknowns.

## What you get for free

Solving for $b$ turns the receiver into a clock. After the fix, $b/c$ is the offset between the receiver's clock and **[[GPS time|gps-time]]**, which is kept within tens of nanoseconds of world time (UTC), with the exact offset broadcast in the message.

How precise is that time? It is the time dilution of precision (TDOP) times the UERE, divided by $c$:

- with a UERE of $4\,\mathrm{m}$ and a TDOP of $1.5$: $4 \times 1.5 = 6\,\mathrm{m}$, or about $20\,\mathrm{ns}$;
- with a UERE of $1\,\mathrm{m}$ and a TDOP of $1.2$: $1.2\,\mathrm{m}$, or $4\,\mathrm{ns}$.

That is why GNSS became the world's time-delivery system. Phone networks, power grids and stock exchanges take their time from it. So does a launch range, whose timing system must stamp telemetry from dozens of sites to within microseconds: it is a set of **[[GNSS-disciplined oscillators|disciplined]]**.

The velocity solution has the same shape and the same fourth unknown. Take the rate of change of the pseudorange equation. Let $\mathbf{e}_i = (\mathbf{s}_i - \mathbf{x})/\|\mathbf{s}_i - \mathbf{x}\|$ be the **unit line of sight**, an arrow of length one pointing from the receiver to satellite $i$. Then

$$
\dot\rho_i = \mathbf{e}_i^{\mathsf T}(\dot{\mathbf{s}}_i - \dot{\mathbf{x}}) + \dot b .
$$

A dot on top means "rate of change", and $\mathbf{e}_i^{\mathsf T}(\ldots)$ picks out the part of a velocity along the line of sight. In words: the range rate is the relative velocity along the line of sight, plus the clock drift. The receiver measures $\dot\rho_i$ from the carrier's Doppler shift, $\dot\rho_i = -\lambda f_{d,i}$. The satellite's velocity $\dot{\mathbf{s}}_i$ comes from the ephemeris. The unknowns are the receiver's velocity $\dot{\mathbf{x}}$ and the **clock drift** $\dot b = c\,y$, in metres per second. Four Doppler measurements determine them, with the same Jacobian as the position problem.

The drift is not small. An uncalibrated TCXO's $10^{-6}$ shows up as $1{,}575\,\mathrm{Hz}$ of Doppler on every satellite. That looks like the receiver moving at $300\,\mathrm{m/s}$ along every line of sight at once — which no real motion can do. Solve for $\dot b$ and the velocity comes out good to centimetres per second. Forget it and the velocity is nonsense.

## When four satellites are not available

You can lower the number of unknowns instead of raising the number of satellites. Each method swaps a measurement for an assumption, and each is honest only while the assumption holds.

**Clock coasting, or clock-hold.** If the oscillator is good enough, carry the clock bias forward from the last full fix instead of measuring it again:

$$
\hat b(t) = \hat b_0 + \hat{\dot b}\,(t - t_0).
$$

In words: the bias now is the last bias plus the last drift times the time since. Three satellites then give a position. The error in the carried-forward bias grows as $c\,\sigma_y\,\Delta t$, where $\sigma_y$ is the oscillator's **[[stability|allan]]** over the gap:

| Stability $\sigma_y$ | $10\,\mathrm{s}$ | $100\,\mathrm{s}$ | $1{,}000\,\mathrm{s}$ |
| --- | --- | --- | --- |
| $10^{-9}$ (TCXO) | $3.0\,\mathrm{m}$ | $30\,\mathrm{m}$ | $300\,\mathrm{m}$ |
| $10^{-10}$ (OCXO) | $0.30\,\mathrm{m}$ | $3.0\,\mathrm{m}$ | $30\,\mathrm{m}$ |
| $10^{-11}$ (chip-scale atomic) | $3\,\mathrm{cm}$ | $0.30\,\mathrm{m}$ | $3.0\,\mathrm{m}$ |
| $10^{-12}$ (rubidium) | $3\,\mathrm{mm}$ | $3\,\mathrm{cm}$ | $0.30\,\mathrm{m}$ |

The coasting error lands mostly in the height, for the reason above. A TCXO buys seconds of clock-hold at metre accuracy; an OCXO, a minute or two; an atomic clock, tens of minutes. A launch-site reference receiver, or a vehicle whose antenna switching briefly costs it a satellite, is a case for an OCXO. The trade is weight and power against seconds of graceful fallback.

**Height aiding.** If you know the altitude — from a barometer, a terrain map, or because the vehicle sits on a surveyed pad — then the condition $\|\mathbf{x}\| \approx R_E + h$ is a fourth equation. It says "the receiver's distance from Earth's center is Earth's radius plus the height $h$". It acts like a measurement from a satellite at Earth's center with a perfect clock, and it pins down the direction the real satellites pin down worst. With height aiding, three satellites give horizontal position and clock. A barometer good to $10\,\mathrm{m}$ supplies a $10\,\mathrm{m}$ vertical measurement, far better than a poor constellation's own vertical geometry.

**A disciplined clock plus height** brings the need down to two satellites for a horizontal fix; some aviation and marine receivers ride out short outages this way. Beyond that, whatever else the vehicle carries must navigate — for a launch vehicle, its inertial navigation system — until GNSS returns.

::: note The satellites solve it the expensive way
The satellites face the same problem from the other side. Each carries rubidium or caesium clocks stable to about $10^{-13}$ to $10^{-14}$ over a day. The control segment measures their offsets from monitor stations at known positions, with atomic clocks of their own, and the broadcast clock polynomial from the last lesson is the result. The whole system is one enormous time-sharing network: a few dozen atomic clocks in orbit and on the ground, and billions of crystal oscillators borrowing their time, four satellites at a time.
:::

## Check yourself

::: check
A receiver with a crystal oscillator reports that all eight of its pseudoranges are growing $310\,\mathrm{m/s}$ faster than the satellites' motion explains. What is happening? Is the receiver moving?
:::

::: answer
A shared rate on every pseudorange is the signature of clock drift, not motion: no velocity carries a receiver away from eight satellites in eight different directions at once.

Growing pseudoranges mean the receiver's clock is gaining on GPS time — it is running *fast* — by $310/c = 1.03 \times 10^{-6}$, a typical uncalibrated TCXO offset. The velocity solution, which carries $\dot b$ as its fourth unknown, assigns the $310\,\mathrm{m/s}$ to $\dot b$ and reports whatever real velocity is left.
:::

::: check
Why does ignoring the receiver clock in a three-satellite fix produce an error mostly in height rather than across the ground?
:::

::: answer
Every visible satellite is above the receiver, so every line of sight points partly upward. A shared increase in all ranges — a positive clock bias — can be copied by moving the receiver down, which lengthens every range at once.

In measurement space, the clock direction (all ones) and the vertical direction (the upward parts of the lines of sight) are nearly parallel, so a solver without a clock unknown pours the bias into height. In the Cape example, $30\,\mathrm{km}$ of bias became $64.6\,\mathrm{km}$ of height error against $52\,\mathrm{km}$ across the ground ($\sqrt{38.9^2 + 34.9^2} = 52.3$). With a wider spread of elevations the split would be more lopsided still.
:::

::: check
A receiver loses its fourth satellite for $45\,\mathrm{s}$. Its OCXO has stability $2 \times 10^{-10}$ over that time. In clock-hold mode, how much clock error builds up, and where in the position does it show?
:::

::: answer
Multiply the speed of light by the stability and the time:

$$
c\,\sigma_y\,\Delta t = 299{,}792{,}458 \times 2 \times 10^{-10} \times 45 = 2.7\,\mathrm{m}.
$$

That is $2.7\,\mathrm{m}$ of range-equivalent clock error. It shows up mostly as a height error of about that size, with a smaller sideways part, because the clock and vertical directions are nearly lined up. A TCXO at $10^{-9}$ would have built up $13.5\,\mathrm{m}$ in the same time.
:::

::: check
Explain why differencing pseudoranges against a reference satellite and estimating the clock bias directly give the same position, and why the second is preferred.
:::

::: answer
Differencing is a linear, reversible reshuffle of the measurements. The $n$ pseudoranges, and the $n - 1$ differences plus any one original pseudorange, hold exactly the same information. A least-squares solution weighted correctly for either form gives the same answer.

But every difference shares the reference satellite's noise, so the differences are correlated, and a correct solution must carry a full table of how their errors move together. Estimating $b$ directly keeps the measurements independent, the weights simple, and the fourth Jacobian column all ones. It is cleaner, and it delivers the time as a bonus.
:::

::: check
A GNSS timing receiver sits at a fixed, surveyed spot and tracks ten satellites. How many unknowns does it have, and how precisely can it give the time with a UERE of $0.5\,\mathrm{m}$?
:::

::: answer
One. Its position is known, so only the clock bias $b$ is unknown, and every pseudorange measures it directly: $b_i = \tilde\rho_i - \|\mathbf{s}_i - \mathbf{x}\|$.

Averaging ten independent measurements, each with $\sigma = 0.5\,\mathrm{m}$, divides the error by $\sqrt{10}$: $0.5/\sqrt{10} = 0.16\,\mathrm{m}$, which is $0.53\,\mathrm{ns}$, at each moment. Over longer times, atmospheric and multipath errors — which do not average away like fresh noise — hold it to a few nanoseconds. This is how timing laboratories and launch ranges distribute time.
:::

## Summary

| Item | Statement |
| --- | --- |
| The fourth unknown | $b = c\,\delta t_{rx}$ in metres; state vector $(x, y, z, b)$; four satellites minimum |
| Why it cannot be calibrated | Fractional frequency error $y$ gives pseudorange drift $c\,y$: $300\,\mathrm{m/s}$ for a $10^{-6}$ crystal, $3\,\mathrm{cm/s}$ for an OCXO at $10^{-10}$ |
| Ignoring it | Three spheres still meet at a point, with zero residual, tens to thousands of km away, mostly in height |
| Estimation | $\partial\rho_i/\partial b = 1$: the Jacobian gains a column of ones |
| Differencing | $\rho_i - \rho_1 = \|\mathbf{s}_i - \mathbf{x}\| - \|\mathbf{s}_1 - \mathbf{x}\|$: hyperboloids; same information, correlated noise |
| Time transfer | $\sigma_t = \mathrm{TDOP} \times \sigma_{\text{UERE}}/c$: about $20\,\mathrm{ns}$ for $4\,\mathrm{m}$ and $1.5$; a few ns for a good site |
| Velocity | $\dot\rho_i = \mathbf{e}_i^{\mathsf T}(\dot{\mathbf{s}}_i - \dot{\mathbf{x}}) + \dot b$, with $\dot\rho_i = -\lambda f_{d,i}$; clock drift is the fourth unknown |
| Clock-hold | Bias carried forward; error $c\,\sigma_y\,\Delta t$: $30\,\mathrm{m}$ per $100\,\mathrm{s}$ for $10^{-9}$, $3\,\mathrm{m}$ for $10^{-10}$, $0.3\,\mathrm{m}$ for $10^{-11}$ |
| Height aiding | Known altitude acts as a measurement from a "satellite at Earth's center" with a perfect clock; three satellites then suffice |

The next lesson writes the four equations out, straightens them around a guess, derives the Jacobian row $[-\mathbf{e}_i^{\mathsf T},\ 1]$, and iterates a real four-satellite fix from the center of the Earth to the millimetre.

::: context oscillator A tuning fork made of stone
Most clocks in electronics count the vibrations of a tiny slice of **quartz** crystal. Squeeze quartz and it makes a voltage; put a voltage on it and it bends. Wired into a circuit, it rings at a very steady rate — often millions of times a second — like a tuning fork that never stops. The rate shifts a little with temperature, which is why a TCXO has a circuit that compensates, and an OCXO keeps its crystal in a tiny heated oven so its temperature never changes.
:::

::: context parts-per-million What "a part per million" means
A fractional error of $10^{-6}$ — one part per million — means the clock gains or loses one second in a million seconds, about $11.6$ days. That sounds excellent for a wristwatch. But in one second it is off by one microsecond, and light covers $300\,\mathrm{m}$ in a microsecond. For navigation, "one second in eleven days" is a $300\,\mathrm{m}$ error every second.
:::

::: context solution-curve A whole line of perfect answers
With two transmitters and an unknown bias, every point on this curve fits both measurements exactly. Each point matches a different assumed bias $b$. The true receiver is just one of them; two measurements cannot tell which. The curve is part of a hyperbola, because along it the *difference* of the two distances stays fixed. Axes are in kilometres, drawn to the same scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="129.5,196.4 134.9,185.0 140.4,173.6 146.0,162.1 151.5,150.5 157.1,138.9 162.7,127.2 168.3,115.5 174.0,103.8 179.6,91.9 185.4,80.1 191.1,68.1 196.9,56.1 202.8,43.9 208.7,31.7"/>
  <circle cx="140.4" cy="173.5" r="4" fill="#1f2a44"/>
  <circle cx="162.7" cy="127.2" r="4" fill="#1f2a44"/>
  <circle cx="185.4" cy="80.1" r="4" fill="#1f2a44"/>
  <circle cx="151.5" cy="150.5" r="6" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="120" y="177" font-size="12" fill="#1f2a44" text-anchor="end">b = 0</text>
  <text x="142" y="131" font-size="12" fill="#1f2a44" text-anchor="end">b = 1 km</text>
  <text x="165" y="84" font-size="12" fill="#1f2a44" text-anchor="end">b = 2 km</text>
  <text x="162" y="156" font-size="12" fill="#b4232c">true: (1, 2), b = 0.5 km</text>
  <line x1="260" y1="190" x2="305" y2="190" stroke="#1f2a44" stroke-width="2"/>
  <text x="282" y="206" font-size="11" fill="#1f2a44" text-anchor="middle">1 km</text>
  <text x="230" y="40" font-size="11" fill="#6c7a93">every point: zero error</text>
</svg>
```
:::

::: context underground How deep is 65 kilometres?
Under Florida, Earth's rocky crust is roughly $30$ to $40\,\mathrm{km}$ thick. Below that lies the mantle. So a fix $64.6\,\mathrm{km}$ down, with a receiver clock only $100\,\mathrm{\mu s}$ off, sits in the upper mantle — and the solver reports it with a perfect fit. The drawing shows the true position and that wrong answer to scale, seen from the side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="10" y="40" width="340" height="150" fill="#f2b880" fill-opacity="0.35"/>
  <line x1="10" y1="40" x2="350" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="60" cy="40" r="6" fill="#1d6fd1"/>
  <text x="60" y="28" font-size="12" fill="#1d6fd1" text-anchor="middle">true receiver</text>
  <line x1="60" y1="40" x2="164.6" y2="169.2" stroke="#b4232c" stroke-width="2"/>
  <line x1="60" y1="40" x2="164.6" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="164.6" y1="40" x2="164.6" y2="169.2" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <circle cx="164.6" cy="169.2" r="6" fill="#b4232c"/>
  <text x="176" y="173" font-size="12" fill="#b4232c">"fix", clock ignored</text>
  <text x="112" y="56" font-size="11" fill="#1f2a44" text-anchor="middle">52 km across</text>
  <text x="172" y="108" font-size="11" fill="#1f2a44">64.6 km down</text>
  <text x="94" y="120" font-size="12" fill="#b4232c" text-anchor="end">83 km</text>
  <text x="340" y="60" font-size="11" fill="#6c7a93" text-anchor="end">ground level</text>
</svg>
```
:::

::: context clock-height Why a clock error looks like sinking
Every satellite you can see is above you. Move straight down by some distance, and each line of sight gets longer by that distance times the sine of its elevation: fully for a satellite overhead, a little less for one halfway up, barely at all for one on the horizon. A clock bias adds exactly the same length to every line. The two are not quite identical — the low satellites give them away — but they are close, which is why a clock error left out of the model reappears mostly as height.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="170" x2="350" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="180" y1="150" x2="180" y2="20"/>
    <line x1="180" y1="150" x2="292.6" y2="85"/>
    <line x1="180" y1="150" x2="50" y2="112"/>
  </g>
  <g stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3">
    <line x1="180" y1="180" x2="180" y2="20"/>
    <line x1="180" y1="180" x2="292.6" y2="85"/>
    <line x1="180" y1="180" x2="50" y2="112"/>
  </g>
  <circle cx="180" cy="20" r="5" fill="#1f2a44"/><circle cx="292.6" cy="85" r="5" fill="#1f2a44"/><circle cx="50" cy="112" r="5" fill="#1f2a44"/>
  <circle cx="180" cy="150" r="5" fill="#1d6fd1"/>
  <circle cx="180" cy="180" r="5" fill="#b4232c"/>
  <text x="190" y="154" font-size="12" fill="#1d6fd1">receiver</text>
  <text x="190" y="190" font-size="12" fill="#b4232c">moved down: every line longer</text>
  <text x="190" y="24" font-size="12" fill="#1f2a44">satellites</text>
</svg>
```
:::

::: context jacobian-bridge Where the column of ones goes next
The next lesson stacks one row per satellite into the **geometry matrix** $\mathbf{G}$. Each row is the minus-unit-line-of-sight followed by a $1$: $[-\mathbf{e}_i^{\mathsf T},\ 1]$. The lesson after that turns $\mathbf{G}$ into the dilution of precision, and the column of ones is why the clock and the height get tangled there too. Keep an eye on it: the whole geometry story of GNSS is how well the line-of-sight directions spread out while staying different from "all ones".
:::

::: context hyperboloid Hyperbolic navigation, before satellites
Navigating by *differences* of arrival time is older than GPS. During the Second World War, the LORAN system had pairs of ground stations send pulses at the same moment. A ship measured how much later one pulse arrived than the other, which put it on a known hyperbola on the chart. A second pair of stations gave a second hyperbola, and the ship was where they crossed. Differencing GNSS pseudoranges gives the same kind of fix in three dimensions, with satellites as the stations.
:::

::: context gps-time GPS time is not quite clock time
GPS time started at midnight on 6 January 1980, lined up with UTC, the world's civil time. But UTC adds a **leap second** now and then to stay in step with Earth's slightly irregular spin, and GPS time never does. Since the start of 2017 GPS time has been $18$ seconds ahead of UTC. The navigation message broadcasts the current count of leap seconds, so a receiver can show UTC while computing in GPS time.
:::

::: context disciplined A cheap clock kept honest
A **GNSS-disciplined oscillator** pairs a good local oscillator, often an OCXO or rubidium, with a GNSS timing receiver. The receiver measures how far the oscillator has drifted from GPS time, and a slow control loop nudges the oscillator back. Over seconds, you get the oscillator's smoothness; over hours, you get the satellites' atomic accuracy. If GNSS drops out, the oscillator carries on alone, with exactly the clock-hold error growth of this lesson's table.
:::

::: context allan Measuring how steady a clock is
A clock's stability is not one number: it depends on how long you wait. The standard measure is the **Allan deviation**, named after David Allan, who introduced it in 1966. It compares the clock's average rate over one interval with its rate over the next, for intervals of many lengths. A crystal can be superb over a second and poor over an hour; an atomic clock shines over long spans. That is why the table gives the error for each coasting time rather than one figure per clock.
:::
