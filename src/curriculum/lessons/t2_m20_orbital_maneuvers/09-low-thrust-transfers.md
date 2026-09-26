---
id: l09-low-thrust-transfers
title: 'Low-thrust transfers: Edelbaum, spirals, electric propulsion'
minutes: 18
covers:
  - 'low-thrust transfers: Edelbaum, spirals, electric propulsion'
---

Think of a sailboat on a nearly windless lake. The breeze is so faint you can barely feel it, but it never stops. Leave the sail up for a day and the boat ends up far across the water. A rocket engine is the opposite: a huge shove that is over in minutes.

The last lesson ended with a burn so weak that "Δv" stopped meaning what it meant everywhere else in this module. At $T/W_0 = 0.05$ the vehicle's speed went *down* even though its orbit plainly grew. That was not a broken example. It is the everyday condition of an **[[electric thruster|electric-thruster]]**, which pushes with a fraction of a newton and takes weeks or months, not minutes, to move a satellite between orbits. Starlink satellites raise themselves to their working altitude this way, and so does a growing number of **[[geostationary satellites|all-electric-geo]]**. This lesson builds the tool for that kind of flight.

The key move is to stop asking "what is the velocity before and after this burn?". There is no single before and after when the burn lasts hundreds of laps. Instead, follow the *orbit itself* as it slowly changes — an ever-so-slightly growing circle, lap after lap — and ask how much thrusting the whole spiral needs.

## The quasi-circular spiral

Electric thrusters produce accelerations of about $10^{-5}$ to $10^{-3}\,\mathrm{m/s^2}$ — thousands of times weaker than a chemical engine. Each lap raises the orbit by only a tiny amount, so at every moment the orbit is almost a perfect circle at its current radius $r$. Engineers call this **quasi-circular** ("almost circular"). For a circle,

$$
\varepsilon(r) = -\frac{\mu}{2r}, \qquad v(r) = \sqrt{\frac{\mu}{r}}.
$$

Lesson 8 derived a general fact for thrust held along the velocity: $\dot\varepsilon = a_T v$, exactly, wherever the vehicle is. That is all we need.

**Step 1: how fast the radius grows.** The circle's energy changes with radius at the rate $d\varepsilon/dr = \mu/(2r^2)$. Divide the energy rate by that, using the **[[chain rule|chain-rule]]**:

$$
\frac{dr}{dt} = \frac{\dot\varepsilon}{d\varepsilon/dr} = \frac{a_T v}{\mu/(2r^2)} = \frac{2a_T r^2 v}{\mu}.
$$

**Step 2: how fast the circular speed changes.** The circular speed depends on $r$, with $dv/dr = -\tfrac{1}{2}\sqrt{\mu/r^3}$. Chain rule again:

$$
\frac{dv}{dt} = \frac{dv}{dr}\frac{dr}{dt} = \left(-\frac{1}{2}\sqrt{\frac{\mu}{r^3}}\right)\left(\frac{2a_T r^2 v}{\mu}\right) = -a_T ,
$$

using $v = \sqrt{\mu/r}$ to simplify.

Read that result slowly. The spacecraft thrusts *forward*, and its speed goes *down*, at exactly the rate $a_T$, whatever the radius. Thrusting raises the orbit, and a higher circular orbit is a slower one. **[[Push forward, go slower|push-forward-go-slower]]** is not a paradox. It is how circular orbits work.

**Step 3: add it up.** The Δv the rocket equation charges for is the total thrusting, $\int a_T\,dt$. Since $v$ falls by exactly $a_T$ each second, that total is exactly how far $v$ fell from start to finish:

$$
\Delta v = \int a_T\,dt = \big|v(r_1) - v(r_0)\big| = |v_1 - v_0|.
$$

This is **[[Edelbaum's|edelbaum]]** coplanar result, and you have derived it, not quoted it. The total Δv of a slow, forward-thrusting, quasi-circular spiral between two circular orbits is the difference of their circular speeds.

::: key Edelbaum's coplanar spiral
$$
\Delta v_{\text{spiral}} = |v_1 - v_0|, \qquad v = \sqrt{\mu/r}.
$$
Exact for a quasi-circular, continuously tangentially-thrusted transfer between two circular orbits, derived from $\dot\varepsilon=a_Tv$ exactly as in lesson 8.
:::

::: example Spiral versus Hohmann, LEO to GEO
**The speeds.** At $6678\,\mathrm{km}$, $v_0 = \sqrt{398\,600.4/6678} = 7.7258\,\mathrm{km/s}$. At GEO, $42\,164\,\mathrm{km}$, $v_1 = 3.0747\,\mathrm{km/s}$.

**The spiral.** $\Delta v = |3.0747 - 7.7258| = 4.6512\,\mathrm{km/s}$.

**The Hohmann transfer** (lesson 2): $2.4258 + 1.4668 = 3.8926\,\mathrm{km/s}$.

**The comparison.** $4.6512/3.8926 = 1.195$, so the spiral needs $19.5\%$ *more* Δv for the same change of radius.

**How long?** At a steady $10^{-3}\,\mathrm{m/s^2}$, $4651\,\mathrm{m/s}$ of Δv takes $4651/10^{-3} = 4.65 \times 10^6\,\mathrm{s}$, about $54$ days. (A real thruster's acceleration creeps up as propellant is used, so it is a little quicker.)

This does not contradict Hohmann's optimality. Hohmann is the best *two-burn* transfer. The spiral is a different kind of path: it pays for every bit of climb as it goes, including the high, slow part where thrust buys little energy, with no free coast between two well-placed burns. Two burns placed well beat steady pushing, **[[every time|spiral-vs-hohmann]]**.
:::

## Adding a plane change

Edelbaum's full 1961 result also tilts the orbit plane by a total angle $\Delta i$ during the spiral, spread evenly over the whole climb rather than done at one point:

$$
\Delta v_{\text{spiral}} = \sqrt{v_0^2+v_1^2-2v_0v_1\cos\!\left(\frac{\pi}{2}\Delta i\right)}.
$$

::: key The Edelbaum result with plane change
$\Delta v = \sqrt{v_0^2 + v_1^2 - 2v_0v_1\cos\left(\tfrac{1}{2}\pi\Delta i\right)}$. For a coplanar spiral it reduces to $\Delta v = |v_1 - v_0|$, which is *larger* than the Hohmann total for the same radii.
:::

The full derivation needs the calculus of variations, which is beyond this lesson. But two checks are within reach.

**The coplanar check.** Set $\Delta i = 0$. Then $\cos 0 = 1$, and the formula becomes $\sqrt{v_0^2 + v_1^2 - 2v_0v_1} = |v_1 - v_0|$, the result we derived.

**Where the $\pi/2$ comes from.** Compare the impulsive combined burn from lesson 5, which has $\cos\Delta i$ with no $\pi/2$. An instant burn can do the whole plane change at the one best spot: a **node**, where the orbit crosses the plane it is tilting away from. A low-thrust engine cannot wait for the nodes. It has to push all the way round the orbit, and sideways thrust tilts the plane well [[only near the nodes|why-two-over-pi]]. Averaged over a lap, it works at only $2/\pi \approx 64\%$ of its best. So each degree of tilt costs $\pi/2 \approx 1.57$ times what a perfectly placed push would pay.

::: note Why it has to be $\pi/2$
Take a circular orbit at speed $v$ and push sideways, out of the orbit plane, with acceleration $a_n$. The plane tilts at the rate

$$
\frac{di}{dt} = \frac{a_n \cos u}{v},
$$

where $u$ is the angle round the orbit measured from a node. At a node, $\cos u = \pm 1$ and the push is fully effective. A quarter lap later, $\cos u = 0$ and the push does nothing to $i$ (it swings the orbit around instead).

The best a steady thruster can do is flip its sideways push every half lap, so that it always helps. Then the tilt rate is $a_T|\cos u|/v$. The average of $|\cos u|$ over a lap is $2/\pi$, so on average

$$
\frac{di}{dt} = \frac{2}{\pi}\frac{a_T}{v} \quad\Rightarrow\quad \Delta v = \int a_T\,dt = \frac{\pi}{2}\,v\,\Delta i .
$$

An instant plane change of a small angle costs $2v\sin(\Delta i/2) \approx v\,\Delta i$. The ratio is $\pi/2$. Edelbaum's formula gives the same thing: with $v_0 = v_1 = v$, it becomes $2v\sin(\pi\Delta i/4) \approx \tfrac{\pi}{2}v\,\Delta i$. At GEO speed, a $1^\circ$ change costs $53.7\,\mathrm{m/s}$ as an instant burn and $84.3\,\mathrm{m/s}$ by spiral — a ratio of $1.571$.

You could thrust only near the nodes, but then the thruster sits idle most of each lap and the transfer takes far longer. Time is the one thing a low-thrust mission is already short of.
:::

::: example Adding the LEO-to-GEO plane change
Take $\Delta i = 28.5^\circ$, the latitude of Cape Canaveral.

**The angle inside the cosine.** Work in radians: $28.5^\circ = 0.4974\,\mathrm{rad}$. Then $\tfrac{\pi}{2}\Delta i = 1.5708 \times 0.4974 = 0.7813\,\mathrm{rad}$, which is $44.8^\circ$. (This is *not* $\Delta i/2 = 14.25^\circ$ — an easy slip, since lesson 5's formulas are full of half-angles.)

**Plug in.**

$$
\Delta v_{\text{spiral}} = \sqrt{7.7258^2 + 3.0747^2 - 2(7.7258)(3.0747)\cos(44.8^\circ)} = 5.9508\,\mathrm{km/s}.
$$

**Compare.** The best *impulsive* plan from lesson 5 — Hohmann, with the whole plane change folded into the apogee burn — costs $4.2560\,\mathrm{km/s}$. The spiral needs $5.9508/4.2560 = 1.40$, so $40\%$ more. The gap has widened from $19.5\%$ for the coplanar case, because the plane change pays the $\pi/2$ penalty on top.
:::

## Why anyone flies this anyway

Every comparison so far says the spiral needs more Δv. Missions fly it anyway, because the rocket equation does not care about Δv alone. It cares about Δv divided by the exhaust speed:

$$
\frac{m_p}{m_0} = 1 - e^{-\Delta v/(I_{sp}\,g_0)},
$$

where $m_p/m_0$ is the fraction of the starting mass that has to be propellant. Electric thrusters throw their exhaust out four to five times faster than chemical engines. A **Hall-effect thruster** typically runs at $I_{sp} \approx 1500\,\mathrm{s}$. A storable chemical engine runs at about $300\,\mathrm{s}$. Because Δv sits inside an **[[exponential|exponential-penalty]]**, that factor of five swamps a $20\%$ Δv penalty.

::: example Propellant mass, LEO to GEO, chemical Hohmann versus Hall spiral
**Chemical.** $\Delta v = 3.8926\,\mathrm{km/s}$ and $I_{sp}g_0 = 300 \times 9.80665 = 2942\,\mathrm{m/s}$. The exponent is $3892.6/2942 = 1.323$, so the propellant fraction is $1 - e^{-1.323} = 0.734$, or $73.4\%$.

**Hall.** $\Delta v = 4.6512\,\mathrm{km/s}$ and $I_{sp}g_0 = 1500 \times 9.80665 = 14\,710\,\mathrm{m/s}$. The exponent is $4651.2/14\,710 = 0.3162$, so the propellant fraction is $1 - e^{-0.3162} = 0.271$, or $27.1\%$.

**For a $1000\,\mathrm{kg}$ spacecraft.** The chemical option burns $734\,\mathrm{kg}$ of propellant and leaves $266\,\mathrm{kg}$ for everything else. The Hall option burns $271\,\mathrm{kg}$ and leaves $729\,\mathrm{kg}$ — nearly **[[three times as much|propellant-bars]]** for structure and payload, from the same starting mass, despite the harder Δv.

**Sanity check.** $73.4\% / 27.1\% \approx 2.7$. The Hall option needs more Δv but barely a third of the propellant. This single comparison is the whole commercial case for electric orbit-raising.
:::

The Δv penalty itself is not fixed. It depends on how big a change of radius the spiral makes. For a small raise — $350\,\mathrm{km}$ to $550\,\mathrm{km}$, a typical constellation climb — the circular speeds are $v_0 = 7.6970\,\mathrm{km/s}$ and $v_1 = 7.5851\,\mathrm{km/s}$. The spiral costs $111.911\,\mathrm{m/s}$ and the Hohmann transfer $111.905\,\mathrm{m/s}$: the same to within a hundredth of a percent. The $19.5\%$ penalty is a large-ratio effect. For a modest altitude change, the Isp advantage comes almost free. At a thrust acceleration of $10^{-4}\,\mathrm{m/s^2}$, that $112\,\mathrm{m/s}$ climb takes about $13$ days.

Two more reasons, beyond propellant, that a constellation operator chooses a slow spiral:

- **It fails safe.** Satellites are released low and climb under their own thrusters. If one dies early in the climb, it is left in a low orbit where air drag pulls it down within weeks to a few years, instead of becoming long-lived debris at the working altitude. Operators check each satellite at the low **[[insertion altitude|low-insertion]]** before committing it to the climb.
- **It phases for free.** The climb takes weeks, and each satellite raises on its own schedule. While their altitudes differ, their periods differ, so they drift apart around the orbit — exactly the phasing of lesson 7, done on purpose. The slow raise *is* the phasing maneuver, at no extra cost.

::: warning The spiral's Δv is a total, not a rate
$\Delta v_{\text{spiral}} = |v_1-v_0|$ is the *entire* cost of the whole multi-week maneuver, in the same way that an impulsive Δv is the entire cost of an instant one. It is not a per-day or per-orbit figure. It is also not the same thing as lesson 8's "delivered Δv", which measured a *shortfall* against an instant target. Here there is no instant target to fall short of: $|v_1-v_0|$ is the number.
:::

::: warning Quasi-circular is an assumption, not automatic
The derivation assumed the orbit stays almost circular the whole time. That holds when $a_T$ is small enough that many laps pass before the shape changes noticeably. A spiral flown with too much thrust builds up eccentricity, and then $|v_1-v_0|$ is no longer exact — which also defeats the point of using low-thrust hardware.
:::

## Check yourself

::: check
Starting from $\dot\varepsilon = a_T v$ and $\varepsilon(r) = -\mu/(2r)$ for a circular orbit, show that the local circular speed changes at exactly $-a_T$ per unit time, whatever $r$ is.
:::

::: answer
**The radius rate.** $d\varepsilon/dr = \mu/(2r^2)$, so $dr/dt = \dot\varepsilon/(d\varepsilon/dr) = a_Tv \big/ \big(\mu/(2r^2)\big) = 2a_Tr^2v/\mu$.

**The speed slope.** With $v=\sqrt{\mu/r} = \sqrt{\mu}\,r^{-1/2}$, we get $dv/dr = -\tfrac12\sqrt{\mu}\,r^{-3/2}$.

**Multiply.** $dv/dt = (dv/dr)(dr/dt) = \left(-\tfrac12\sqrt{\mu}\,r^{-3/2}\right)\left(2a_Tr^2v/\mu\right)$.

**Substitute $v = \sqrt{\mu}\,r^{-1/2}$.** The expression becomes $-\tfrac12\sqrt{\mu}\,r^{-3/2}\cdot2a_Tr^2\cdot\sqrt{\mu}\,r^{-1/2}/\mu$. The numbers give $-\tfrac12 \cdot 2 = -1$. The $\mu$'s give $\sqrt{\mu}\sqrt{\mu}/\mu = 1$. The powers of $r$ give $r^{-3/2+2-1/2} = r^0 = 1$. So $dv/dt = -a_T$. The $r$-dependence cancels completely.
:::

::: check
A coplanar spiral is planned from a $400\,\mathrm{km}$ circular orbit ($r=6778.137\,\mathrm{km}$) to a $700\,\mathrm{km}$ one ($r=7078.137\,\mathrm{km}$). Compute the Edelbaum Δv, compare it with the Hohmann total for the same radii, and explain why the two are close.
:::

::: answer
**Speeds.** $v_0=\sqrt{398\,600.4418/6778.137}=7.6686\,\mathrm{km/s}$ and $v_1=\sqrt{398\,600.4418/7078.137}=7.5043\,\mathrm{km/s}$.

**Edelbaum.** $\Delta v=|7.5043-7.6686|=0.1643\,\mathrm{km/s}=164.27\,\mathrm{m/s}$.

**Hohmann.** The transfer ellipse has $a_t = (6778.137 + 7078.137)/2 = 6928.137\,\mathrm{km}$. Vis-viva gives the two burns as $82.57$ and $81.68\,\mathrm{m/s}$, a total of $164.25\,\mathrm{m/s}$.

**Why they agree.** The two differ by only $0.02\,\mathrm{m/s}$, about $0.01\%$. The radius ratio is only $7078.137/6778.137 = 1.044$. For small relative changes of radius, spiral and Hohmann costs converge, as the $350$–$550\,\mathrm{km}$ example showed. The big gap for LEO to GEO is a large-ratio effect ($19.5\%$ at a ratio of $6.3$).
:::

::: check
Explain physically why Edelbaum's plane-change formula uses $\cos(\pi\Delta i/2)$ rather than the $\cos(\Delta i)$ of an impulsive combined burn, and confirm the formula still gives the right answer when $\Delta i=0$.
:::

::: answer
**Why $\pi/2$.** An impulsive plane change happens all at once, at a node, where sideways thrust tilts the plane most effectively. So the full angle $\Delta i$ goes straight into the law of cosines. A low-thrust spiral has to spread the same tilt over the whole transfer, pushing sideways all the way round each lap. Sideways thrust tilts the plane in proportion to $|\cos u|$, where $u$ is the angle from the node. Averaged over a lap that is only $2/\pi$ of its best, so each degree of tilt costs $\pi/2$ times as much. The $\pi/2$ in the formula is that penalty.

**The check.** At $\Delta i=0$, $\cos(\pi\cdot0/2)=\cos 0=1$, and $\sqrt{v_0^2+v_1^2-2v_0v_1}=|v_1-v_0|$ — exactly the coplanar result. With no plane change to make, no plane-change penalty is left.
:::

::: check
A satellite operator is choosing between a chemical apogee-kick motor and a Hall-thruster spiral for the same LEO-to-GEO mission. A junior engineer argues the chemical option must be better because it needs less total Δv. What is missing from that argument?
:::

::: answer
**The rocket equation.** Δv alone does not set the propellant mass. The propellant fraction depends on $\Delta v/(I_{sp}g_0)$, inside an exponential, and a Hall thruster runs at roughly five times the specific impulse of a chemical engine. In this lesson's comparison the chemical option needed $16\%$ less Δv ($3.89$ against $4.65\,\mathrm{km/s}$) but burned about $2.7$ times the propellant fraction ($73.4\%$ against $27.1\%$). The Isp advantage far outweighs the Δv penalty.

**Operations.** The argument also ignores the fail-safe low release altitude and the free constellation phasing that a slow raise gives. (Its real cost is time: weeks to months instead of hours.)
:::

::: check
Why does the derivation of $\Delta v_{\text{spiral}}=|v_1-v_0|$ break down if the thrust is not kept tangential — along the velocity — throughout the spiral?
:::

::: answer
The whole derivation rests on $\dot\varepsilon=a_Tv$. Lesson 8 showed that holds only when the thrust points along the velocity. In any other direction, only the part of the thrust along the velocity adds energy: $\dot\varepsilon = a_T v\cos\theta$, where $\theta$ is the angle between thrust and velocity. So $\dot\varepsilon$ is smaller than $a_Tv$.

Then the chain-rule argument no longer gives $dv/dt = -a_T$. The circular speed falls more slowly than the thrust accumulates, and the total $\int a_T\,dt$ comes out bigger than $|v_1-v_0|$. A badly steered spiral costs more than the formula predicts.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Quasi-circular spiral | Thrust so weak the orbit stays almost circular; $dv/dt = -a_T$ exactly |
| $\Delta v_{\text{spiral}} = \lvert v_1-v_0\rvert$ | Edelbaum coplanar spiral, exact for quasi-circular, tangentially thrusted transfers |
| $\Delta v_{\text{spiral}} = \sqrt{v_0^2+v_1^2-2v_0v_1\cos(\pi\Delta i/2)}$ | With a plane change spread over the spiral; $\pi/2$ because sideways thrust works at only $2/\pi$ on average |
| LEO$\to$GEO coplanar | Spiral 4.6512 km/s vs Hohmann 3.8926 km/s — 19.5 % more |
| LEO$\to$GEO with $28.5^\circ$ | Spiral 5.9508 km/s vs best impulsive 4.2560 km/s — 40 % more |
| Propellant, 1000 kg | Chemical (300 s): 734 kg; Hall (1500 s): 271 kg — despite more Δv |
| Small raise (350$\to$550 km) | Spiral and Hohmann Δv nearly identical — the penalty is a large-ratio effect |
| Non-Δv reasons to spiral | Fail-safe low release altitude; the raise doubles as constellation phasing |

Lessons 8 and 9 both asked what happens when a burn cannot be treated as an instant. The next lesson turns to the operational side: keeping a satellite where it belongs once it has arrived, and the maneuvers — station-keeping, drift orbits, disposal — that go on for the rest of a mission's life.

::: context electric-thruster How an electric thruster pushes
A chemical engine gets its energy from burning. An electric thruster gets it from sunlight: solar panels make electricity, and electric fields fling charged atoms of a gas such as xenon or krypton out of the back at around $15$ to $20\,\mathrm{km/s}$ — five times faster than a chemical exhaust.

The catch is power. About one and a half kilowatts buys only about a tenth of a newton, roughly the weight of two sheets of paper. So the thruster runs for weeks or months where a chemical engine would run for minutes.
:::

::: context all-electric-geo Half a year to geostationary orbit
In March 2015, one Falcon 9 carried two Boeing 702SP satellites, ABS-3A and Eutelsat 115 West B. They were the first "all-electric" communications satellites: no chemical engine for orbit-raising at all. Carrying so little propellant made them light enough to launch two at once.

The price was patience. They spiralled from their transfer orbit to geostationary height for about six to seven months before starting work — the time-for-mass trade of this lesson, in commercial form.
:::

::: context chain-rule Rates that pass through a middle quantity
The chain rule says: if $v$ depends on $r$, and $r$ changes with time, then $v$ changes with time at the rate $\frac{dv}{dt} = \frac{dv}{dr}\frac{dr}{dt}$.

Think of gears. If the second gear turns twice for each turn of the first, and the first turns three times a second, the second turns $2 \times 3 = 6$ times a second. Here, time drives the radius, and the radius drives the circular speed. The same trick, run backward, turned an energy rate into a radius rate in Step 1.
:::

::: context push-forward-go-slower Where the thrust's energy goes
For any circular orbit, the kinetic energy per kilogram is $\mu/(2r)$ and the potential energy is $-\mu/r$. So the kinetic energy is exactly $-\varepsilon$, and the potential energy is exactly $2\varepsilon$.

Now let the thruster add one joule per kilogram, so $\varepsilon$ goes up by one. The kinetic energy must go *down* by one, and the potential energy *up* by two. The thruster's joule and one joule of speed both end up as height.

That is why forward thrust on a slow spiral lowers the speed, and why the Δv charged equals the speed lost.
:::

::: context edelbaum A 1961 formula still in daily use
Theodore Edelbaum published his low-thrust results in 1961, years before any spacecraft flew a long electric spiral. He found the best way to steer a weak thruster between two circular orbits of different size and tilt, and boiled the answer down to one formula.

Mission designers still use it for the first rough budget of an electric-propulsion mission, before running a full optimizer. The low-thrust exercise in this module asks you to check it against a simulation.
:::

::: context spiral-vs-hohmann The gap grows with the radius ratio
Divide both costs by the starting circular speed and they depend only on the ratio of the radii.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
<line x1="55" y1="170" x2="335" y2="170" stroke="#1f2a44" stroke-width="1.5"/><line x1="55" y1="170" x2="55" y2="25" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="50" y1="170.0" x2="55" y2="170.0" stroke="#1f2a44"/><text x="47" y="174.0" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
<line x1="50" y1="135.0" x2="55" y2="135.0" stroke="#1f2a44"/><text x="47" y="139.0" font-size="11" text-anchor="end" fill="#1f2a44">0.2</text>
<line x1="50" y1="100.0" x2="55" y2="100.0" stroke="#1f2a44"/><text x="47" y="104.0" font-size="11" text-anchor="end" fill="#1f2a44">0.4</text>
<line x1="50" y1="65.0" x2="55" y2="65.0" stroke="#1f2a44"/><text x="47" y="69.0" font-size="11" text-anchor="end" fill="#1f2a44">0.6</text>
<line x1="50" y1="30.0" x2="55" y2="30.0" stroke="#1f2a44"/><text x="47" y="34.0" font-size="11" text-anchor="end" fill="#1f2a44">0.8</text>
<line x1="55.0" y1="170" x2="55.0" y2="175" stroke="#1f2a44"/><text x="55.0" y="188" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
<line x1="112.9" y1="170" x2="112.9" y2="175" stroke="#1f2a44"/><text x="112.9" y="188" font-size="11" text-anchor="middle" fill="#1f2a44">5</text>
<line x1="185.3" y1="170" x2="185.3" y2="175" stroke="#1f2a44"/><text x="185.3" y="188" font-size="11" text-anchor="middle" fill="#1f2a44">10</text>
<line x1="257.6" y1="170" x2="257.6" y2="175" stroke="#1f2a44"/><text x="257.6" y="188" font-size="11" text-anchor="middle" fill="#1f2a44">15</text>
<line x1="330.0" y1="170" x2="330.0" y2="175" stroke="#1f2a44"/><text x="330.0" y="188" font-size="11" text-anchor="middle" fill="#1f2a44">20</text>
<text x="192" y="204" font-size="11" text-anchor="middle" fill="#1f2a44">radius ratio r₁/r₀</text>
<text x="14" y="98" font-size="11" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 14 98)">Δv ÷ starting speed</text>
<polyline fill="none" stroke="#b4232c" stroke-width="2" points="55.0,170.0 56.4,162.2 57.8,155.4 59.1,149.3 60.5,143.9 61.9,139.0 63.3,134.5 64.7,130.5 66.1,126.8 67.4,123.3 68.8,120.2 70.2,117.2 71.6,114.5 73.0,111.9 74.3,109.5 75.7,107.2 77.1,105.1 78.5,103.1 79.9,101.1 81.3,99.3 82.6,97.6 84.0,96.0 85.4,94.4 86.8,92.9 88.2,91.5 89.5,90.1 90.9,88.8 92.3,87.5 93.7,86.3 95.1,85.1 96.5,84.0 97.8,82.9 99.2,81.9 100.6,80.9 102.0,79.9 103.4,79.0 104.7,78.1 106.1,77.2 107.5,76.3 108.9,75.5 110.3,74.7 111.7,73.9 113.0,73.2 114.4,72.4 115.8,71.7 117.2,71.0 118.6,70.4 119.9,69.7 121.3,69.1 122.7,68.4 124.1,67.8 125.5,67.2 126.9,66.7 128.2,66.1 129.6,65.5 131.0,65.0 132.4,64.5 133.8,63.9 135.2,63.4 136.5,62.9 137.9,62.5 139.3,62.0 140.7,61.5 142.1,61.1 143.4,60.6 144.8,60.2 146.2,59.8 147.6,59.3 149.0,58.9 150.4,58.5 151.7,58.1 153.1,57.7 154.5,57.4 155.9,57.0 157.3,56.6 158.6,56.3 160.0,55.9 161.4,55.6 162.8,55.2 164.2,54.9 165.6,54.5 166.9,54.2 168.3,53.9 169.7,53.6 171.1,53.3 172.5,53.0 173.8,52.7 175.2,52.4 176.6,52.1 178.0,51.8 179.4,51.5 180.8,51.2 182.1,50.9 183.5,50.7 184.9,50.4 186.3,50.1 187.7,49.9 189.0,49.6 190.4,49.4 191.8,49.1 193.2,48.9 194.6,48.6 196.0,48.4 197.3,48.2 198.7,47.9 200.1,47.7 201.5,47.5 202.9,47.3 204.2,47.0 205.6,46.8 207.0,46.6 208.4,46.4 209.8,46.2 211.2,46.0 212.5,45.8 213.9,45.6 215.3,45.4 216.7,45.2 218.1,45.0 219.4,44.8 220.8,44.6 222.2,44.4 223.6,44.2 225.0,44.0 226.4,43.8 227.7,43.7 229.1,43.5 230.5,43.3 231.9,43.1 233.3,43.0 234.6,42.8 236.0,42.6 237.4,42.4 238.8,42.3 240.2,42.1 241.6,42.0 242.9,41.8 244.3,41.6 245.7,41.5 247.1,41.3 248.5,41.2 249.8,41.0 251.2,40.9 252.6,40.7 254.0,40.6 255.4,40.4 256.8,40.3 258.1,40.1 259.5,40.0 260.9,39.8 262.3,39.7 263.7,39.6 265.1,39.4 266.4,39.3 267.8,39.2 269.2,39.0 270.6,38.9 272.0,38.8 273.3,38.6 274.7,38.5 276.1,38.4 277.5,38.3 278.9,38.1 280.3,38.0 281.6,37.9 283.0,37.8 284.4,37.6 285.8,37.5 287.2,37.4 288.5,37.3 289.9,37.2 291.3,37.0 292.7,36.9 294.1,36.8 295.5,36.7 296.8,36.6 298.2,36.5 299.6,36.4 301.0,36.3 302.4,36.1 303.7,36.0 305.1,35.9 306.5,35.8 307.9,35.7 309.3,35.6 310.7,35.5 312.0,35.4 313.4,35.3 314.8,35.2 316.2,35.1 317.6,35.0 318.9,34.9 320.3,34.8 321.7,34.7 323.1,34.6 324.5,34.5 325.9,34.4 327.2,34.3 328.6,34.2 330.0,34.1"/>
<polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="55.0,170.0 56.4,162.2 57.8,155.4 59.1,149.4 60.5,144.0 61.9,139.3 63.3,135.0 64.7,131.1 66.1,127.6 67.4,124.4 68.8,121.5 70.2,118.8 71.6,116.4 73.0,114.1 74.3,112.0 75.7,110.1 77.1,108.3 78.5,106.6 79.9,105.1 81.3,103.6 82.6,102.3 84.0,101.0 85.4,99.8 86.8,98.7 88.2,97.6 89.5,96.7 90.9,95.7 92.3,94.8 93.7,94.0 95.1,93.2 96.5,92.5 97.8,91.8 99.2,91.1 100.6,90.5 102.0,89.9 103.4,89.3 104.7,88.7 106.1,88.2 107.5,87.7 108.9,87.2 110.3,86.8 111.7,86.4 113.0,86.0 114.4,85.6 115.8,85.2 117.2,84.8 118.6,84.5 119.9,84.2 121.3,83.8 122.7,83.5 124.1,83.3 125.5,83.0 126.9,82.7 128.2,82.5 129.6,82.2 131.0,82.0 132.4,81.8 133.8,81.5 135.2,81.3 136.5,81.1 137.9,80.9 139.3,80.7 140.7,80.6 142.1,80.4 143.4,80.2 144.8,80.1 146.2,79.9 147.6,79.8 149.0,79.6 150.4,79.5 151.7,79.4 153.1,79.2 154.5,79.1 155.9,79.0 157.3,78.9 158.6,78.8 160.0,78.7 161.4,78.6 162.8,78.5 164.2,78.4 165.6,78.3 166.9,78.2 168.3,78.1 169.7,78.0 171.1,78.0 172.5,77.9 173.8,77.8 175.2,77.7 176.6,77.7 178.0,77.6 179.4,77.5 180.8,77.5 182.1,77.4 183.5,77.4 184.9,77.3 186.3,77.2 187.7,77.2 189.0,77.1 190.4,77.1 191.8,77.1 193.2,77.0 194.6,77.0 196.0,76.9 197.3,76.9 198.7,76.9 200.1,76.8 201.5,76.8 202.9,76.7 204.2,76.7 205.6,76.7 207.0,76.7 208.4,76.6 209.8,76.6 211.2,76.6 212.5,76.5 213.9,76.5 215.3,76.5 216.7,76.5 218.1,76.5 219.4,76.4 220.8,76.4 222.2,76.4 223.6,76.4 225.0,76.4 226.4,76.3 227.7,76.3 229.1,76.3 230.5,76.3 231.9,76.3 233.3,76.3 234.6,76.3 236.0,76.3 237.4,76.2 238.8,76.2 240.2,76.2 241.6,76.2 242.9,76.2 244.3,76.2 245.7,76.2 247.1,76.2 248.5,76.2 249.8,76.2 251.2,76.2 252.6,76.2 254.0,76.2 255.4,76.2 256.8,76.2 258.1,76.2 259.5,76.2 260.9,76.2 262.3,76.2 263.7,76.2 265.1,76.2 266.4,76.2 267.8,76.2 269.2,76.2 270.6,76.2 272.0,76.2 273.3,76.2 274.7,76.2 276.1,76.2 277.5,76.2 278.9,76.2 280.3,76.2 281.6,76.2 283.0,76.2 284.4,76.2 285.8,76.2 287.2,76.2 288.5,76.2 289.9,76.2 291.3,76.2 292.7,76.2 294.1,76.2 295.5,76.2 296.8,76.2 298.2,76.2 299.6,76.2 301.0,76.2 302.4,76.3 303.7,76.3 305.1,76.3 306.5,76.3 307.9,76.3 309.3,76.3 310.7,76.3 312.0,76.3 313.4,76.3 314.8,76.3 316.2,76.3 317.6,76.3 318.9,76.3 320.3,76.4 321.7,76.4 323.1,76.4 324.5,76.4 325.9,76.4 327.2,76.4 328.6,76.4 330.0,76.4"/>
<line x1="131.9" y1="170" x2="131.9" y2="64.6" stroke="#6c7a93" stroke-dasharray="3,3"/>
<text x="135.9" y="156.0" font-size="11" fill="#6c7a93">LEO→GEO</text>
<text x="250" y="32.0" font-size="11" fill="#b4232c">spiral</text>
<text x="250" y="100.5" font-size="11" fill="#1d6fd1">Hohmann</text>
</svg>```

The two curves start together, which is why small raises cost the same either way. The Hohmann curve peaks near $0.54$ (at a ratio of about $15.6$) and then sinks slowly, but the spiral keeps climbing toward $1$: spiralling all the way out to escape would cost the whole starting speed.
:::

::: context why-two-over-pi How much a sideways push tilts the plane
Sideways thrust tilts the orbit plane most at the nodes and not at all a quarter lap later. Its effectiveness goes as $|\cos u|$:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
<polygon points="50.0,150.0 50.0,40.0 51.6,40.1 53.1,40.3 54.7,40.6 56.2,41.1 57.8,41.7 59.3,42.4 60.9,43.3 62.4,44.3 64.0,45.4 65.6,46.6 67.1,48.0 68.7,49.5 70.2,51.1 71.8,52.9 73.3,54.7 74.9,56.7 76.4,58.8 78.0,61.0 79.6,63.3 81.1,65.7 82.7,68.3 84.2,70.9 85.8,73.6 87.3,76.4 88.9,79.3 90.4,82.3 92.0,85.3 93.6,88.5 95.1,91.7 96.7,95.0 98.2,98.4 99.8,101.8 101.3,105.3 102.9,108.8 104.4,112.4 106.0,116.0 107.6,119.7 109.1,123.4 110.7,127.1 112.2,130.9 113.8,134.7 115.3,138.5 116.9,142.3 118.4,146.2 120.0,150.0 121.6,146.2 123.1,142.3 124.7,138.5 126.2,134.7 127.8,130.9 129.3,127.1 130.9,123.4 132.4,119.7 134.0,116.0 135.6,112.4 137.1,108.8 138.7,105.3 140.2,101.8 141.8,98.4 143.3,95.0 144.9,91.7 146.4,88.5 148.0,85.3 149.6,82.3 151.1,79.3 152.7,76.4 154.2,73.6 155.8,70.9 157.3,68.3 158.9,65.7 160.4,63.3 162.0,61.0 163.6,58.8 165.1,56.7 166.7,54.7 168.2,52.9 169.8,51.1 171.3,49.5 172.9,48.0 174.4,46.6 176.0,45.4 177.6,44.3 179.1,43.3 180.7,42.4 182.2,41.7 183.8,41.1 185.3,40.6 186.9,40.3 188.4,40.1 190.0,40.0 191.6,40.1 193.1,40.3 194.7,40.6 196.2,41.1 197.8,41.7 199.3,42.4 200.9,43.3 202.4,44.3 204.0,45.4 205.6,46.6 207.1,48.0 208.7,49.5 210.2,51.1 211.8,52.9 213.3,54.7 214.9,56.7 216.4,58.8 218.0,61.0 219.6,63.3 221.1,65.7 222.7,68.3 224.2,70.9 225.8,73.6 227.3,76.4 228.9,79.3 230.4,82.3 232.0,85.3 233.6,88.5 235.1,91.7 236.7,95.0 238.2,98.4 239.8,101.8 241.3,105.3 242.9,108.8 244.4,112.4 246.0,116.0 247.6,119.7 249.1,123.4 250.7,127.1 252.2,130.9 253.8,134.7 255.3,138.5 256.9,142.3 258.4,146.2 260.0,150.0 261.6,146.2 263.1,142.3 264.7,138.5 266.2,134.7 267.8,130.9 269.3,127.1 270.9,123.4 272.4,119.7 274.0,116.0 275.6,112.4 277.1,108.8 278.7,105.3 280.2,101.8 281.8,98.4 283.3,95.0 284.9,91.7 286.4,88.5 288.0,85.3 289.6,82.3 291.1,79.3 292.7,76.4 294.2,73.6 295.8,70.9 297.3,68.3 298.9,65.7 300.4,63.3 302.0,61.0 303.6,58.8 305.1,56.7 306.7,54.7 308.2,52.9 309.8,51.1 311.3,49.5 312.9,48.0 314.4,46.6 316.0,45.4 317.6,44.3 319.1,43.3 320.7,42.4 322.2,41.7 323.8,41.1 325.3,40.6 326.9,40.3 328.4,40.1 330.0,40.0 330.0,150.0" fill="#8fb8f0" fill-opacity="0.5"/>
<polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="50.0,40.0 51.6,40.1 53.1,40.3 54.7,40.6 56.2,41.1 57.8,41.7 59.3,42.4 60.9,43.3 62.4,44.3 64.0,45.4 65.6,46.6 67.1,48.0 68.7,49.5 70.2,51.1 71.8,52.9 73.3,54.7 74.9,56.7 76.4,58.8 78.0,61.0 79.6,63.3 81.1,65.7 82.7,68.3 84.2,70.9 85.8,73.6 87.3,76.4 88.9,79.3 90.4,82.3 92.0,85.3 93.6,88.5 95.1,91.7 96.7,95.0 98.2,98.4 99.8,101.8 101.3,105.3 102.9,108.8 104.4,112.4 106.0,116.0 107.6,119.7 109.1,123.4 110.7,127.1 112.2,130.9 113.8,134.7 115.3,138.5 116.9,142.3 118.4,146.2 120.0,150.0 121.6,146.2 123.1,142.3 124.7,138.5 126.2,134.7 127.8,130.9 129.3,127.1 130.9,123.4 132.4,119.7 134.0,116.0 135.6,112.4 137.1,108.8 138.7,105.3 140.2,101.8 141.8,98.4 143.3,95.0 144.9,91.7 146.4,88.5 148.0,85.3 149.6,82.3 151.1,79.3 152.7,76.4 154.2,73.6 155.8,70.9 157.3,68.3 158.9,65.7 160.4,63.3 162.0,61.0 163.6,58.8 165.1,56.7 166.7,54.7 168.2,52.9 169.8,51.1 171.3,49.5 172.9,48.0 174.4,46.6 176.0,45.4 177.6,44.3 179.1,43.3 180.7,42.4 182.2,41.7 183.8,41.1 185.3,40.6 186.9,40.3 188.4,40.1 190.0,40.0 191.6,40.1 193.1,40.3 194.7,40.6 196.2,41.1 197.8,41.7 199.3,42.4 200.9,43.3 202.4,44.3 204.0,45.4 205.6,46.6 207.1,48.0 208.7,49.5 210.2,51.1 211.8,52.9 213.3,54.7 214.9,56.7 216.4,58.8 218.0,61.0 219.6,63.3 221.1,65.7 222.7,68.3 224.2,70.9 225.8,73.6 227.3,76.4 228.9,79.3 230.4,82.3 232.0,85.3 233.6,88.5 235.1,91.7 236.7,95.0 238.2,98.4 239.8,101.8 241.3,105.3 242.9,108.8 244.4,112.4 246.0,116.0 247.6,119.7 249.1,123.4 250.7,127.1 252.2,130.9 253.8,134.7 255.3,138.5 256.9,142.3 258.4,146.2 260.0,150.0 261.6,146.2 263.1,142.3 264.7,138.5 266.2,134.7 267.8,130.9 269.3,127.1 270.9,123.4 272.4,119.7 274.0,116.0 275.6,112.4 277.1,108.8 278.7,105.3 280.2,101.8 281.8,98.4 283.3,95.0 284.9,91.7 286.4,88.5 288.0,85.3 289.6,82.3 291.1,79.3 292.7,76.4 294.2,73.6 295.8,70.9 297.3,68.3 298.9,65.7 300.4,63.3 302.0,61.0 303.6,58.8 305.1,56.7 306.7,54.7 308.2,52.9 309.8,51.1 311.3,49.5 312.9,48.0 314.4,46.6 316.0,45.4 317.6,44.3 319.1,43.3 320.7,42.4 322.2,41.7 323.8,41.1 325.3,40.6 326.9,40.3 328.4,40.1 330.0,40.0"/>
<line x1="50" y1="150.0" x2="335" y2="150.0" stroke="#1f2a44" stroke-width="1.5"/><line x1="50" y1="150.0" x2="50" y2="32.0" stroke="#1f2a44" stroke-width="1.5"/>
<line x1="50" y1="80.0" x2="330" y2="80.0" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5,4"/>
<text x="47" y="44.0" font-size="11" text-anchor="end" fill="#1f2a44">1</text><text x="47" y="154.0" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
<text x="47" y="84.0" font-size="11" text-anchor="end" fill="#b4232c">2/π</text>
<text x="50.0" y="166.0" font-size="11" text-anchor="middle" fill="#1f2a44">node</text>
<text x="120.0" y="166.0" font-size="11" text-anchor="middle" fill="#1f2a44">90°</text>
<text x="190.0" y="166.0" font-size="11" text-anchor="middle" fill="#1f2a44">node</text>
<text x="260.0" y="166.0" font-size="11" text-anchor="middle" fill="#1f2a44">270°</text>
<text x="330.0" y="166.0" font-size="11" text-anchor="middle" fill="#1f2a44">node</text>
<text x="190" y="190" font-size="11" text-anchor="middle" fill="#1f2a44">position round the orbit (from the node)</text>
<text x="190" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">how well sideways thrust tilts the plane, |cos u|</text>
</svg>```

The shaded area, averaged over the lap, equals the height of the dashed line, $2/\pi \approx 0.637$. A thruster that pushes all the way round gets only that average, so its plane change costs $\pi/2$ times the ideal.
:::

::: context exponential-penalty Why the exponent matters so much
The fraction of mass left after a burn is $e^{-\Delta v/(I_{sp}g_0)}$. Each extra exhaust-speed's worth of Δv multiplies the leftover mass by $e^{-1} \approx 0.37$ again.

In the LEO-to-GEO case, the chemical exponent is $1.323$, leaving $e^{-1.323} = 0.266$ of the mass. The Hall exponent is only $0.316$, leaving $0.729$. A $20\%$ larger Δv changes the exponent a little; a five-times-faster exhaust shrinks it by a factor of about four.
:::

::: context propellant-bars The same 1000 kilograms, spent two ways
Both spacecraft start at $1000\,\mathrm{kg}$ in low orbit and end in GEO.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
<text x="20" y="24" font-size="12" fill="#1f2a44">chemical, 300 s</text>
<rect x="20" y="30" width="168.8" height="28" fill="#f2b880" stroke="#1f2a44"/>
<rect x="188.8" y="30" width="61.2" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
<text x="104.4" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">734 kg</text>
<text x="219.4" y="48" font-size="11" text-anchor="middle" fill="#1f2a44">266 kg</text>
<text x="20" y="84" font-size="12" fill="#1f2a44">Hall, 1500 s</text>
<rect x="20" y="90" width="62.3" height="28" fill="#f2b880" stroke="#1f2a44"/>
<rect x="82.3" y="90" width="167.7" height="28" fill="#8fb8f0" stroke="#1f2a44"/>
<text x="51.2" y="108" font-size="11" text-anchor="middle" fill="#1f2a44">271 kg</text>
<text x="166.2" y="108" font-size="11" text-anchor="middle" fill="#1f2a44">729 kg</text>
<text x="256.0" y="48" font-size="11" fill="#1f2a44">1000 kg</text>
<text x="256.0" y="108" font-size="11" fill="#1f2a44">1000 kg</text>
<text x="20" y="140" font-size="11" fill="#6c7a93">orange: propellant burned · blue: left for everything else</text>
</svg>```

The blue part is what pays the bills: structure, power, antennas, the customer's payload. Electric orbit-raising nearly triples it.
:::

::: context low-insertion Low release, on purpose
Releasing satellites low means a dud never reaches a long-lived orbit. It also means the healthy ones are exposed to air drag until they climb.

In February 2022 that risk showed itself. A geomagnetic storm heated and puffed up the upper atmosphere right after a Falcon 9 released 49 Starlink satellites at a low altitude. Drag rose sharply, and about 38 of them re-entered and burned up before they could climb. No debris was left behind in orbit — the fail-safe worked, at a price.
:::
