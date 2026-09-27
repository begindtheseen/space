---
id: l10-propulsive-descent-phases
title: Propulsive descent — entry burn, aerodynamic guidance, landing burn
minutes: 18
covers:
  - "propulsive descent: entry burn, aerodynamic guidance, landing burn"
---

Think about coming down a steep hill on a bike. You can let the wind slow you, you can squeeze the brakes, or you can do both at different moments. The brakes cost you something (worn pads), the wind is free, and at the very bottom you must stop exactly at the line. That is the whole story of this lesson, told for a rocket.

Up to lesson 8, every vehicle in this module came home the capsule way. It carried a heat shield and maybe a parachute, and the air did all the slowing. A reusable booster — the first stage of a rocket, flying itself back to land — has a tool the capsule never had: its own engines. A Falcon-9-class first stage uses those engines, plus the air, in three separate phases on the way down.

This lesson introduces all three phases and puts numbers on what each one buys. Lesson 11 then looks at the sensors the last phase depends on, and lesson 12 works out the hardest part in full: the timing of the final burn.

## Why a booster cannot come home like a capsule

A capsule is built for exactly one hard ride through the air. Its heat shield is thick, and much of it is designed to char and wear away as it soaks up heat. It is thrown away (or refurbished) afterward.

A booster is the opposite. It is a tall, thin-walled tube built to be flown again and again. It has no **[[ablative|ablative-word]]** heat shield — no layer designed to burn away. Its engines, pipes and wiring sit at the back, and on the way down the back end leads, facing straight into the flow.

After the booster separates from the upper stage, it is on a **ballistic arc** — a free fall under gravity, like a thrown ball. On a return-to-launch-site flight, a **boostback burn** first turns it around to head home; on a droneship flight it keeps going downrange. Either way, if nothing else happened, it would meet the thick lower air at a speed and angle no heat-shield-less vehicle could survive. The three phases exist to manage that mismatch.

## Three phases, three jobs

Here is the sequence at a glance. The **[[three phases|three-phases-picture]]** are flown in order, each using a different mix of engines and air.

**1. Entry burn.** Shortly before the dense atmosphere, the stage fires its engines **[[retrograde|retrograde-word]]** — pointing them forward along its path, so the thrust pushes backward against its motion. It sheds a big share of its speed *before* the drag and heating would reach their worst. Lessons 2 through 4 showed why that is such a good deal: peak deceleration grows like $v^2$ and peak heat rate grows like $v^3$. Spending some propellant to lower $v$ early buys a much larger cut in the structural and heat loads that follow.

**2. Aerodynamic guidance.** Engines off. The stage falls the rest of the way through the thick air steered only by **[[grid fins|grid-fins-word]]**, the lattice-like paddles near its top (the subject of t1_m18). A slightly tilted cylinder makes a little lift, and the fins use that small sideways force to aim at the landing site. The stage passes through the hypersonic, supersonic and transonic regimes of lesson 9 — including the **[[transonic band|transonic-bridge]]**, where the fins' control authority shrinks and changes.

**3. Landing burn.** One last, precisely timed engine burn brings the stage to zero speed at zero height. By now the tanks are nearly empty, so the stage is light. Even the lowest throttle a real engine can hold usually still pushes harder than the stage weighs. So the stage cannot hover. The burn must start at exactly the right moment, with no chance to pause and try again. Lesson 12 works out what that forces on the guidance.

::: key The three-phase booster return
Entry burn: sheds speed before the dense atmosphere, trading propellant for a large reduction in peak heating and dynamic pressure. Aerodynamic guidance: unpowered, grid-fin-steered descent through hypersonic to transonic flow. Landing burn: a final, propulsively controlled — and, as lesson 12 shows, throttle-constrained — approach to touchdown.
:::

On a real Falcon 9 flight the list has one more item at the front, and only on some flights. Lesson 13 covers it in detail.

::: key Falcon 9 booster return phases
Boostback (full on RTLS, partial or none on droneship landings) reverses or trims the downrange velocity. Entry burn slows the stage before the dense atmosphere, cutting peak heating and dynamic pressure. Aerodynamic descent steers with grid fins. Landing burn is a single-engine hoverslam with throttling to null the residual error.
:::

(RTLS stands for "return to launch site". A **hoverslam** is the name for a landing burn that cannot hover and must bring speed and height to zero at the same instant.)

## What the entry burn buys, in numbers

The easiest way to see why a booster spends propellant on an entry burn is to run the same stage through the atmosphere twice: once without the burn, once with it.

The tools come straight from earlier lessons. Lesson 2 gave the peak deceleration of a ballistic entry:

$$
a_{\max} = \frac{v_E^2\,|\sin\gamma_E|}{2eH}.
$$

Here $v_E$ ("v sub E") is the speed at the top of the atmosphere, $\gamma_E$ ("gamma sub E") is the flight-path angle there (negative going down), $H = 7200\,\mathrm{m}$ is this module's scale height, and $e \approx 2.718$. Lesson 3 found that peak heating happens higher up, where the density is

$$
\rho^*_q = \frac{\beta\,|\sin\gamma_E|}{3H},
$$

and lesson 4 showed the speed there is $v^*_q = v_E\,e^{-1/6}$. The heat rate itself comes from the **Sutton-Graves** formula,

$$
\dot q = k\sqrt{\frac{\rho}{R_n}}\,v^3, \qquad k \approx 1.7415\times10^{-4}\ \text{SI},
$$

where $R_n$ is the nose radius and $\dot q$ ("q dot") is heat per square meter per second.

::: example Halving the speed at which the stage meets the dense air
Take a booster-class stage with ballistic coefficient $\beta \approx 2400\ \mathrm{kg/m^2}$ (t1_m18's figure for an engines-first Falcon-9-class stage), falling steeply at $\gamma_E \approx -70^\circ$. Use a nose radius $R_n = 1\ \mathrm{m}$ for the blunt, engines-first end. Compare meeting the dense air at $2000\ \mathrm{m/s}$ (no entry burn) with $1000\ \mathrm{m/s}$ (an entry burn that halves the speed).

**Shared numbers.** $|\sin 70^\circ| = 0.9397$ and $2eH = 2 \times 2.718 \times 7200 = 39\,143\ \mathrm{m}$.

**Peak deceleration, no burn.**

$$
a_{\max} = \frac{2000^2 \times 0.9397}{39\,143} = \frac{3.759\times10^6}{39\,143} = 96.0\ \mathrm{m/s^2} = 9.79\,g_0.
$$

We divided by $g_0 = 9.80665\ \mathrm{m/s^2}$ to express it in "g's".

**Peak deceleration, after the burn.** Only $v_E$ changed, and it appears squared, so

$$
a_{\max} = \frac{1000^2 \times 0.9397}{39\,143} = 24.0\ \mathrm{m/s^2} = 2.45\,g_0.
$$

**Peak heat rate, no burn.** First the density at the heating peak:

$$
\rho^*_q = \frac{2400 \times 0.9397}{3 \times 7200} = 0.1044\ \mathrm{kg/m^3},
$$

reached near $h = 7200\ln(1.225/0.1044) \approx 17.7\ \mathrm{km}$. The speed there is $2000 \times e^{-1/6} = 2000 \times 0.8465 = 1693\ \mathrm{m/s}$. Now Sutton-Graves:

$$
\dot q = 1.7415\times10^{-4} \times \sqrt{0.1044} \times 1693^3 = 1.7415\times10^{-4} \times 0.3231 \times 4.852\times10^9 = 2.730\times10^5\ \mathrm{W/m^2}.
$$

One square centimeter is $10^{-4}\,\mathrm{m^2}$, so that is $27.3\ \mathrm{W/cm^2}$.

**Peak heat rate, after the burn.** The density at the peak does not depend on speed, so it is the same $0.1044\ \mathrm{kg/m^3}$ at the same $17.7\ \mathrm{km}$. The speed there is $1000 \times 0.8465 = 846.5\ \mathrm{m/s}$, and

$$
\dot q = 1.7415\times10^{-4} \times 0.3231 \times 846.5^3 = 3.41\times10^4\ \mathrm{W/m^2} = 3.41\ \mathrm{W/cm^2}.
$$

| entry speed | peak deceleration | peak heat rate |
| --- | --- | --- |
| $2000\ \mathrm{m/s}$ (no entry burn) | $9.79\,g_0$ | $27.30\ \mathrm{W/cm^2}$ |
| $1000\ \mathrm{m/s}$ (after entry burn) | $2.45\,g_0$ | $3.41\ \mathrm{W/cm^2}$ |

**Does it make sense?** Halving the speed cut peak deceleration by exactly $4$ (that is $2^2$, the $v^2$ scaling of lesson 2) and peak heat rate by exactly $8$ (that is $2^3$, the $v^3$ scaling of lesson 4). The altitudes did not move, because in this model where the peaks happen depends on $\beta$ and $\gamma_E$, not on speed.
:::

That factor of $8$ is the reason the entry burn exists, even though every kilogram of propellant it burns is a kilogram that could have carried payload. A thin-walled stage with no ablative shield cannot take a full-speed pass the way a capsule can. Because heat rate goes as the cube of speed, a fairly modest cut in speed buys a **[[much larger safety margin|cubic-leverage]]**.

## The aerodynamic phase and dynamic pressure

After the entry burn the engines shut down, and the grid fins take over. Fins push on the air, and the air pushes back. How hard it pushes back depends on one number.

Picture holding your hand out of a car window. At walking pace you barely feel it. On the highway it is shoved backward hard. In thicker air — say, underwater — the same speed would push harder still. That push per square meter is the **[[dynamic pressure|dynamic-pressure-word]]**,

$$
\bar q = \tfrac12\rho v^2,
$$

read "q bar". It grows with the air's density $\rho$ and with the *square* of speed. Every aerodynamic force on the stage, fin forces included, is roughly $\bar q$ times an area times a coefficient. t1_m18 showed that a grid fin's normal force scales the same way: $\Delta N \propto \bar q$.

::: example Dynamic pressure through the aerodynamic-guidance phase
Use this module's exponential atmosphere, $\rho(h) = 1.225\,e^{-h/7200}\ \mathrm{kg/m^3}$, at three points along a representative descent.

**At $15\ \mathrm{km}$, $600\ \mathrm{m/s}$.** Density: $\rho = 1.225\,e^{-15\,000/7200} = 1.225\,e^{-2.083} = 0.1525\ \mathrm{kg/m^3}$. Then $\bar q = \tfrac12 \times 0.1525 \times 600^2 = 0.5 \times 0.1525 \times 360\,000 = 27\,500\ \mathrm{Pa} = 27.5\ \mathrm{kPa}$.

**At $5\ \mathrm{km}$, $250\ \mathrm{m/s}$.** $\rho = 1.225\,e^{-0.694} = 0.612\ \mathrm{kg/m^3}$, so $\bar q = 0.5 \times 0.612 \times 62\,500 = 19.1\ \mathrm{kPa}$.

**At $1\ \mathrm{km}$, $150\ \mathrm{m/s}$.** $\rho = 1.225\,e^{-0.139} = 1.066\ \mathrm{kg/m^3}$, so $\bar q = 0.5 \times 1.066 \times 22\,500 = 12.0\ \mathrm{kPa}$.

| altitude | speed | dynamic pressure $\bar q = \tfrac12\rho v^2$ |
| --- | --- | --- |
| $15\ \mathrm{km}$ | $600\ \mathrm{m/s}$ | $27.5\ \mathrm{kPa}$ |
| $5\ \mathrm{km}$ | $250\ \mathrm{m/s}$ | $19.1\ \mathrm{kPa}$ |
| $1\ \mathrm{km}$ | $150\ \mathrm{m/s}$ | $12.0\ \mathrm{kPa}$ |

**Reading it.** The air got denser the whole way down, yet $\bar q$ fell. Between the first and last rows, $v^2$ dropped by a factor of $600^2/150^2 = 16$, while $\rho$ rose by only $1.066/0.1525 \approx 7$. Sixteen beats seven, so the product fell by $16/7 \approx 2.3$ — a bit more than a factor of two.
:::

So grid-fin authority weakens as the descent goes on, echoing t1_m18's comparison at higher altitude and speed. That is one reason the aerodynamic phase hands over to a propulsive landing burn instead of trying to steer with fins all the way to zero speed. By the time speed and dynamic pressure have fallen this far, fins alone cannot guarantee a precise touchdown. And at zero speed, $\bar q$ is zero: fins do nothing at all.

## The landing burn: one shot

The last phase gets the shortest introduction here, because lessons 11 and 12 are about it.

By the landing burn, the stage is falling at roughly its **terminal velocity** — the speed where drag balances weight — about $195\ \mathrm{m/s}$ at sea level for the engines-first stage of t1_m18. The engine must remove all of that speed and hit zero at the deck or pad.

The catch is the **[[throttle floor|throttle-floor]]**. An engine can be turned down only so far before it stops running smoothly. For a nearly empty booster, even that minimum thrust is more than its weight. If the stage were to stop in midair, the engine would push it back up. So there is no "slow down, hover, look around, then land". The burn has exactly one right start time, and the guidance has to know the stage's height and speed well enough to hit it. Knowing height and speed that well is the job of the sensors in lesson 11.

## One energy budget, two currencies

Step back and look at the whole descent at once. It is a single job: get rid of the stage's **[[kinetic energy|kinetic-energy-word]]**, its energy of motion, $\tfrac12 v^2$ for every kilogram. Two different "currencies" pay for it.

- The entry burn and the landing burn pay in **propellant**. The rocket equation sets how much propellant each meter per second costs.
- The aerodynamic phase pays in **nothing** — no propellant at all. Drag removes the energy, exactly as it did for every ballistic or lifting entry in lessons 2 through 8. The price is paid instead by the structure and the fins, which must survive the loads and heating.

Halving the speed from $2000$ to $1000\ \mathrm{m/s}$, as in the first example, removes **[[three quarters of the kinetic energy|energy-bar]]**, not half: $\tfrac12(2000^2 - 1000^2) = 1.5\ \mathrm{MJ}$ per kilogram, out of $2.0\ \mathrm{MJ}$.

A mission planner's job is choosing how much of the energy removal to hand to the free phase and how much to the paid phases.

- **More aerodynamic braking** (a higher speed when the entry burn ends) saves propellant. But the uninsulated, non-ablative stage then has to survive a harsher heating and loading environment.
- **More propulsive braking** (a lower speed when the entry burn ends) costs propellant, and so payload. But it eases the load on the airframe.

That trade is why the entry burn's target speed is a designed number. It is not "as slow as possible", and it is not "as fast as the propellant allows".

::: warning A booster's "entry" is not a capsule's entry
Every formula in lessons 2 through 4 still applies to a booster's pass through the air. The physics of drag and heating does not care what the vehicle is for. What differs is the vehicle. A capsule is built to survive one full-speed pass, with a heat shield sized for it. A reusable booster is built to fly many times, with no ablative material to spend. That is why the booster trades propellant for a gentler pass, where the capsule builds the thermal margin into its shield instead.
:::

## Check yourself

::: check
Name the three phases of a propulsive booster return and, for each, say what removes the vehicle's kinetic energy during that phase.
:::

::: answer
**Entry burn:** the vehicle's own engines, firing retrograde, remove kinetic energy directly with thrust. Propellant is spent.

**Aerodynamic guidance:** atmospheric drag removes the energy, exactly as in any unpowered entry. No propellant is spent; the grid fins only steer.

**Landing burn:** the engines again, removing the last of the kinetic energy to reach zero speed at the ground.
:::

::: check
Why does halving the speed at which a stage meets the dense atmosphere cut peak heat rate by a factor of $8$ rather than $2$?
:::

::: answer
Peak convective heat rate (Sutton-Graves, lesson 4) goes as $v^3$, not as $v$. Halving $v$ multiplies the heat rate by $(1/2)^3 = 1/8$, an eightfold cut.

For comparison, peak deceleration goes as $v^2$, so the same halving cuts it by only $(1/2)^2 = 1/4$. The entry burn is worth flying largely because of this cubic leverage.
:::

::: check
In the worked table, why does dynamic pressure fall through the aerodynamic-guidance phase, even though the vehicle is dropping into denser and denser air?
:::

::: answer
Dynamic pressure is $\bar q = \tfrac12\rho v^2$. From the first row to the last, speed falls by a factor of $4$ ($600 \to 150\ \mathrm{m/s}$), which is a factor of $16$ in $v^2$. Over the same drop, density rises by only a factor of about $7$.

The fall in $v^2$ outweighs the rise in $\rho$, so the product falls — by about $16/7 \approx 2.3$ — even though the density alone rises the whole time.
:::

::: check
A heat-shielded capsule flies its full-speed pass through the air with no engines at all. Why does a reusable booster fly an entry burn?
:::

::: answer
A capsule is built around a heat shield sized for one full-speed pass — for the peak heat rate and total heat load that pass brings. A reusable booster carries no comparable ablative protection. It is meant to fly many times, so it cannot lose material or pile up heat damage on every flight the way a throwaway shield can.

Spending propellant on an entry burn lowers the peak heat rate and dynamic pressure before the dense air. That is how the booster makes up for the thermal margin a capsule builds into its shield.
:::

::: check
A mission considers raising the speed at which the entry burn cuts off (burning less) to save propellant for other parts of the flight. Using this lesson's energy-budget view, what does that trade against?
:::

::: answer
A higher cutoff speed means the aerodynamic phase has to remove a bigger share of the kinetic energy by drag instead of by engine. That raises the peak dynamic pressure and peak deceleration, which go as $v^2$, and — most steeply — the peak heat rate, which goes as $v^3$. The airframe and grid fins must survive all of it with no ablative protection.

So the propellant saved is not free. It is paid for directly out of the structural and thermal margin of a reusable airframe.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Entry burn | Propulsive braking before the dense atmosphere; trades propellant for reduced peak heating and dynamic pressure |
| $a_{\max} = v_E^2\lvert\sin\gamma_E\rvert/(2eH)$ | Peak deceleration; goes as $v_E^2$ |
| $\dot q = k\sqrt{\rho/R_n}\,v^3$ | Sutton-Graves heat rate; goes as $v^3$ |
| Halving entry speed | Cuts peak deceleration by $4\times$ and peak heat rate by $8\times$; removes $3/4$ of the kinetic energy |
| Aerodynamic guidance | Unpowered, grid-fin-steered descent through hypersonic to transonic flow; removes energy by drag at no propellant cost |
| $\bar q = \tfrac12\rho v^2$ through this phase | Falls in the worked example ($27.5 \to 12.0\ \mathrm{kPa}$) because speed's fall outweighs density's rise |
| Landing burn | Final propulsive approach to touchdown; one shot, cannot hover (lesson 12) |
| Falcon 9 return | Boostback (full on RTLS, partial or none on droneship), entry burn, grid-fin descent, single-engine landing burn |
| Energy-budget trade | More free (aerodynamic) braking saves propellant but demands more thermal and structural margin; more propulsive braking costs payload but eases the airframe |

The next lesson looks at what the stage actually measures to fly the end of this sequence: the downward-looking sensors a terminal descent depends on, which neither a capsule's entry nor an orbital rendezvous needs in the same way.

::: context ablative-word A shield that is meant to wear away
An **ablative** heat shield protects the vehicle by being destroyed slowly. As it heats up, its outer layer chars, melts or turns to gas, and that process soaks up a great deal of energy and carries it away in the flow. What is left behind stays cool enough. The word comes from the Latin for "carried away". It works well, but each flight uses up part of the shield, which is fine for a capsule and a poor fit for a stage meant to fly again next month.
:::

::: context three-phases-picture The whole descent in one sketch
The booster coasts on an arc after separation, fires its entry burn as it falls back toward the thick air, glides on grid fins, then lights its engine one last time a little above the landing site. The sketch is not to scale: the real arc rises far higher than it looks here, and the landing burn lasts well under a minute.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="2"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 4" points="30.0,80.0 44.2,65.5 58.3,53.5 72.5,43.9 86.7,36.9 100.8,32.3 115.0,30.2 129.2,30.5 143.3,33.4 157.5,38.7 171.7,46.5 185.8,56.8 200.0,69.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="5" points="200.0,69.5 205.5,75.1 211.0,81.1 216.5,87.5 222.0,94.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="222.0,94.2 229.2,103.6 236.3,113.5 243.5,124.1 250.7,135.4 257.8,147.3 265.0,159.8"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="5" points="265.0,159.8 268.6,166.4 272.3,173.1 275.9,180.0"/>
  <circle cx="30" cy="80" r="4" fill="#1f2a44"/>
  <g font-size="11" fill="#1f2a44">
    <text x="36" y="96">separation</text>
    <text x="100" y="20">coast (ballistic arc)</text>
    <text x="228" y="76" fill="#b4232c">1. entry burn</text>
    <text x="258" y="120" fill="#1d6fd1">2. grid fins</text>
    <text x="284" y="165" fill="#b4232c">3. landing</text>
    <text x="284" y="178" fill="#b4232c">burn</text>
    <text x="20" y="198">landing site at the right</text>
    <text x="345" y="198" text-anchor="end" fill="#6c7a93">not to scale</text>
  </g>
</svg>
```
:::

::: context retrograde-word Backward, on purpose
**Retrograde** means "stepping backward" in Latin. In spaceflight a retrograde burn points the thrust against the direction of motion, so it slows the vehicle down — like reversing the propellers on a boat to stop at the dock. A booster falling back engines-first is already pointed the right way: its engines face down its flight path, so lighting them slows it with no need to flip around.
:::

::: context grid-fins-word Waffle-shaped fins
Grid fins look like a waffle or a window screen: a box frame filled with a lattice of thin cross-plates, with air flowing *through* the openings. Falcon 9 carries four of them near the top of the first stage, folded flat on the way up and swung out for the descent. Each one can tilt to push the top of the stage sideways. Because the stage falls engines-first, the fins sit at the trailing end, where they steer the way feathers steer an arrow.
:::

::: context transonic-bridge Where the fins get tricky
Near Mach 1 (roughly Mach $0.8$ to $1.2$, lesson 9), shock waves form, move and vanish over different parts of the stage and fins. The same fin tilt can give quite different forces from one moment to the next, and the fins may lose some of their bite. The guidance has to carry the stage through this band without asking the fins for more than they can give, which is part of why the steering done before and after it matters so much.
:::

::: context cubic-leverage What halving the speed does to each load
Every quantity is shown as a fraction of its value with no entry burn. Speed halves; deceleration, which goes as speed squared, falls to a quarter; heat rate, which goes as speed cubed, falls to an eighth.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="60" width="26" height="120" fill="#6c7a93"/>
  <rect x="74" y="120" width="26" height="60" fill="#1d6fd1"/>
  <rect x="150" y="60" width="26" height="120" fill="#6c7a93"/>
  <rect x="184" y="150" width="26" height="30" fill="#1d6fd1"/>
  <rect x="260" y="60" width="26" height="120" fill="#6c7a93"/>
  <rect x="294" y="165" width="26" height="15" fill="#1d6fd1"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="87" y="114">1/2</text>
    <text x="197" y="144">1/4</text>
    <text x="307" y="159">1/8</text>
    <text x="53" y="54">1</text><text x="163" y="54">1</text><text x="273" y="54">1</text>
    <text x="70" y="198">speed</text>
    <text x="180" y="198">deceleration</text>
    <text x="290" y="198">heat rate</text>
  </g>
  <rect x="40" y="14" width="12" height="12" fill="#6c7a93"/>
  <text x="58" y="25" font-size="11" fill="#1f2a44">no entry burn</text>
  <rect x="180" y="14" width="12" height="12" fill="#1d6fd1"/>
  <text x="198" y="25" font-size="11" fill="#1f2a44">after entry burn</text>
</svg>
```
:::

::: context dynamic-pressure-word Why the letter q, and why "dynamic"
Dynamic pressure is the extra pressure you would feel if you brought the moving air to a stop against your palm. "Dynamic" means it comes from motion, as opposed to the ordinary "static" pressure of still air around you. The letter $q$ with a bar is a long-standing aerospace habit for it. On the way *up*, the same number sets "max Q", the moment of greatest aerodynamic stress on a launching rocket; Falcon 9 throttles down around that point for the same reason a booster brakes before thick air on the way down.
:::

::: context throttle-floor Why an engine cannot idle like a car
A rocket engine's turbopumps, injectors and combustion are tuned to run in a band of flow rates. Turn the propellant flow down too far and the burn can become rough or unstable, the pumps leave their design range, and the injector stops mixing well. So each engine has a lowest usable thrust. Lesson 12's example stage can go down to $40\%$ of full thrust — and even that is $1.47$ times its weight, which is exactly why it cannot hover.
:::

::: context kinetic-energy-word Energy of motion, per kilogram
**Kinetic energy** is the energy something has because it is moving: $\tfrac12 m v^2$. Dividing by the mass $m$ gives $\tfrac12 v^2$ joules per kilogram, which is handy because it does not care how heavy the stage is. At $2000\ \mathrm{m/s}$ that is $2\,000\,000\ \mathrm{J/kg}$, or $2.0\ \mathrm{MJ/kg}$ — about half the energy released by exploding a kilogram of TNT (about $4.2\ \mathrm{MJ}$), carried by every kilogram of the stage. All of it has to go somewhere before touchdown: into the air as heat and turbulence, or into the exhaust.
:::

::: context energy-bar Half the speed, a quarter of the energy
Energy goes as speed squared, so halving the speed leaves only a quarter of the energy. The entry burn in the example removes the other three quarters.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="50" width="75" height="40" fill="#1d6fd1"/>
  <rect x="105" y="50" width="225" height="40" fill="#f2b880"/>
  <line x1="30" y1="100" x2="330" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="100" x2="30" y2="106"/><line x1="180" y1="100" x2="180" y2="106"/><line x1="330" y1="100" x2="330" y2="106"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="120">0</text><text x="180" y="120">1.0</text><text x="330" y="120">2.0 MJ/kg</text>
    <text x="67" y="42">0.5 left</text>
    <text x="217" y="42">1.5 removed by the burn</text>
    <text x="180" y="142">kinetic energy per kg at 2000 m/s</text>
  </g>
  <text x="30" y="20" font-size="11" fill="#1f2a44">at 1000 m/s only the blue part remains</text>
</svg>
```
:::
