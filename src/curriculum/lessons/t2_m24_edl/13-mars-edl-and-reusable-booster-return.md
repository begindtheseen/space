---
id: l13-mars-edl-and-reusable-booster-return
title: Mars EDL and reusable booster return modes
minutes: 22
covers:
  - "Mars EDL: thin atmosphere, supersonic parachutes, sky crane"
  - "reusable booster return modes: RTLS vs droneship, boostback burns"
---

This module ends with two real systems that push everything so far to its limits, in opposite directions.

The first is a Mars lander. It flies through air so thin that drag — the tool this whole module has leaned on — cannot finish the job. It needs a parachute that opens faster than sound, and then a rocket-powered descent like lesson 12's. Its landing gear, for the biggest rovers, is a crane in the sky.

The second is a reusable booster back on Earth. The air here is thick enough to do all the work lessons 2 through 10 describe. Its problem is a pure accounting choice: fly all the way home, or land on a ship downrange.

One warning before we start. Every constant in the Mars half of this lesson — gravity, air density, scale height — belongs to Mars. None of it can be swapped with the Earth numbers used everywhere else in the module.

## Mars's atmosphere, in numbers

**Gravity first.** From the two-body module (t2_m19), Mars's gravitational parameter is $\mu_{\mathrm{Mars}} = 42{,}828\ \mathrm{km^3/s^2}$ and its radius is $R_{\mathrm{Mars}} = 3396.2\ \mathrm{km}$. Surface gravity is $\mu/R^2$:

$$
g_{\mathrm{Mars}} = \frac{\mu_{\mathrm{Mars}}}{R_{\mathrm{Mars}}^2} = \frac{4.2828\times10^{13}}{(3.3962\times10^{6})^2} = 3.713\ \mathrm{m/s^2}.
$$

That is $38$ percent of Earth's $9.807\ \mathrm{m/s^2}$. A backpack that weighs $10\ \mathrm{kg}$'s worth on Earth feels like under $4$ on Mars.

**Air density next.** Mars's air is almost all carbon dioxide. Take a representative surface pressure $p_0 = 610\ \mathrm{Pa}$ and temperature $T_0 = 210\ \mathrm{K}$. (Both swing a lot with season, height and time of day. These are round, typical values, not one mission's measurements.)

The ideal gas law turns pressure and temperature into density. It needs carbon dioxide's **[[specific gas constant|gas-constant]]**, the universal gas constant divided by the gas's molar mass:

$$
R_{\mathrm{CO_2}} = \frac{8314}{44.01} = 188.9\ \mathrm{J/(kg\cdot K)}.
$$

Then density $\rho$ (read "rho") is

$$
\rho_{0,\mathrm{Mars}} = \frac{p_0}{R_{\mathrm{CO_2}}T_0} = \frac{610}{188.9\times210} = \frac{610}{39{,}670} = 0.01538\ \mathrm{kg/m^3}.
$$

**Scale height last.** The **[[scale height|scale-height]]** $H$ is how far you climb for the density to fall by a factor of $e \approx 2.718$. The atmospheric-flight module (t1_m18) derived $H = RT/g$ for Earth. The same relation works on Mars with Mars's own gas constant and gravity:

$$
H_{\mathrm{Mars}} = \frac{R_{\mathrm{CO_2}}T_0}{g_{\mathrm{Mars}}} = \frac{188.9\times210}{3.713} = 10{,}684\ \mathrm{m} \approx 10.7\ \mathrm{km}.
$$

::: warning Mars constants stay on Mars
$\rho_{0,\mathrm{Mars}} = 0.01538\ \mathrm{kg/m^3}$ and $H_{\mathrm{Mars}} = 10.68\ \mathrm{km}$ *replace* Earth's $\rho_0 = 1.225\ \mathrm{kg/m^3}$ and $H = 7.2\ \mathrm{km}$. They never mix. The Allen-Eggers, Sutton-Graves and corridor formulas from earlier lessons still hold on Mars — they are the same mathematics on any planet — but every constant inside them must belong to the planet you are flying to.
:::

## Why the thin air is the whole problem

Compare the two surfaces. Mars's air density is $0.01538/1.225 = 0.0126$ of Earth's, about $1.3$ percent. The air is about $80$ times thinner.

Gravity is weaker too, by a factor of $9.807/3.713 = 2.64$. On its own, weaker gravity would make slowing down *easier*: the planet pulls you down less hard. The two effects push in opposite directions. Density wins, by a lot.

The cleanest way to see it is **terminal velocity** — the steady speed where drag exactly balances weight, like a skydiver who stops speeding up. From the atmospheric-flight module (t1_m18),

$$
v_t = \sqrt{\frac{2\beta g}{\rho}},
$$

where $\beta$ (read "beta") is the ballistic coefficient, $m/(C_D A)$, from lesson 5.

::: example Terminal velocity, same vehicle, two planets
Take a representative Mars entry capsule with $\beta = 150\ \mathrm{kg/m^2}$, and drop it near the surface of each planet.

**On Earth.** Top: $2 \times 150 \times 9.807 = 2942$. Divide by $\rho = 1.225$: $2942/1.225 = 2402$. Square root:

$$
v_{t,\mathrm{Earth}} = \sqrt{\frac{2\times150\times9.807}{1.225}} = \sqrt{2402} = 49.0\ \mathrm{m/s}.
$$

**On Mars.** Top: $2 \times 150 \times 3.713 = 1114$. Divide by $\rho = 0.01538$: $1114/0.01538 = 72{,}440$. Square root:

$$
v_{t,\mathrm{Mars}} = \sqrt{\frac{2\times150\times3.713}{0.01538}} = \sqrt{72{,}440} = 269\ \mathrm{m/s}.
$$

**Reading it.** Mars has $62$ percent less gravity pulling the capsule down, yet its terminal velocity is $269/49.0 = 5.5$ times *higher*.

**How fast is that?** The speed of sound in Mars's cold carbon dioxide is $a = \sqrt{\gamma R_{\mathrm{CO_2}} T_0} = \sqrt{1.29\times188.9\times210} \approx 226\ \mathrm{m/s}$, where $\gamma \approx 1.29$ is carbon dioxide's heat-capacity ratio. So the capsule's slowest possible fall near the ground is $269/226 = 1.19$, about **[[Mach|mach-number]]** $1.2$ — still faster than sound.

**And it is worse than that.** Terminal velocity is where a falling object ends up after a long fall. A real entry arrives still decelerating, so it reaches low altitude *faster* than $269\ \mathrm{m/s}$, not at it. Drag alone cannot deliver this vehicle to the ground at a safe speed. Something else has to finish the job.
:::

Yet the thin air is not thin enough to ignore. A lander arrives at several kilometers per second, and even $1$ percent of Earth's density turns that speed into enough heat to destroy an unprotected vehicle. So a Mars lander pays twice: it needs a **[[heat shield|mars-heat-shield]]** like an Earth capsule, *and* it cannot count on the air to stop it.

## Supersonic parachutes

On Earth, a capsule usually waits until it is slower than sound before opening its main parachutes. A canopy opening into **supersonic** flow — faster than sound — takes violent, hard-to-predict loads, and shock waves can make it flutter and collapse. Most parachutes are never designed for it.

Mars removes that choice. The example above shows the vehicle still supersonic at heights and speeds where an Earth capsule would long since be slow. Waiting for subsonic flow could mean waiting until the ground arrives.

So every large Mars lander so far has opened its parachute **supersonically**, typically somewhere around Mach $1.7$ to $2.1$. The chute is a special **[[disk-gap-band|disk-gap-band]]** design, built and tested to survive opening in that flow.

Even then, the parachute cannot finish the job for a heavy lander. After it opens and the heat shield drops away, the lander is still falling at several tens of meters per second. The parachute cannot grow big enough to fix that: it has to survive a supersonic opening, which limits its size, and in air this thin a canopy of any practical size cannot slow a heavy lander all the way. A final **powered descent** closes the gap — the same throttled-rocket problem as lesson 12, now at $g_{\mathrm{Mars}} = 3.713\ \mathrm{m/s^2}$.

One more thing sets Mars apart: distance. A radio signal takes between about $3$ and $22$ minutes to cross between Earth and Mars, depending on where the planets are in their orbits. The entire entry, descent and landing takes only a few minutes. By the time Earth hears that the parachute opened, the lander has already landed, or crashed. Nobody on Earth can steer it. The whole sequence must run **autonomously**, with the lander's own computer making every decision — the **[[light-time delay|light-time]]** at work.

::: key Why Mars EDL is harder than Earth EDL
The atmosphere is about $1\%$ of Earth density — enough to demand a heat shield but not enough to slow a heavy lander to a safe speed. Parachutes must deploy supersonically (around Mach $1.7$–$2.1$), there is not enough atmosphere for a subsonic chute-only landing, and the light-time delay makes the whole sequence necessarily autonomous.
:::

## Sky crane: why a rover does not land on legs

Now picture the last few seconds for a large rover like Curiosity or Perseverance. A powered descent stage is holding it up on rocket engines. How do you put it down?

The obvious answer — land the whole thing, engines and all, on legs — has two problems. Rocket exhaust close to the ground blasts dust and gravel into the rover's cameras and instruments. And the rover would need a heavy shock-absorbing landing structure it never uses again.

The **[[sky crane|sky-crane]]** splits the job in two. The descent stage slows to a gentle, steady descent some meters above the ground, with thrust almost exactly equal to its weight. It lowers the rover beneath it on tethers. The rover touches down on its own wheels, which double as landing gear. The moment touchdown is sensed, the tethers are cut, and the descent stage flies itself away to crash at a safe distance. Its exhaust and its wreckage stay away from the rover.

This needs something lesson 12's stage did not have: the ability to hover, or nearly. Hovering means thrust equal to weight. The engines must be able to throttle down to

$$
T_{\min} \le m\,g, \qquad \text{or, dividing by } m, \qquad a_{T,\min} \le g.
$$

It is tempting to think Mars's low gravity makes this easy. It does the opposite.

::: example Lesson 12's stage, moved to Mars
Lesson 12's stage has $m = 25{,}000\ \mathrm{kg}$ and $T_{\min} = 360\ \mathrm{kN}$.

**On Earth.** Weight is $25{,}000 \times 9.807 = 245.2\ \mathrm{kN}$. Minimum thrust-to-weight is $360/245.2 = 1.47$. It cannot hover.

**On Mars.** Weight is $25{,}000 \times 3.713 = 92.8\ \mathrm{kN}$. Minimum thrust-to-weight is $360/92.8 = 3.88$.

**Reading it.** Moving to Mars made hovering *harder*, not easier. The stage now weighs less than a third of what it did, so the same lowest thrust overshoots its weight by an even wider margin. To hover on Mars, this stage would need engines that throttle down below $92.8\ \mathrm{kN}$.
:::

So a hovering descent stage is not a gift of low gravity. It is a **design choice**. Curiosity's and Perseverance's descent stages carry eight throttleable engines, sized so that their throttle range reaches down to the stage's weight on Mars. A Falcon 9 booster lands on engines sized to lift a fully fueled rocket off Earth, and even one of them at its lowest setting pushes harder than the nearly empty stage weighs.

::: warning Hovering is designed in, not handed out by the planet
A vehicle can hover only if its minimum thrust is at or below its current weight, $a_{T,\min} \le g$. Lower gravity *lowers* the weight, so it makes that condition harder to meet for the same engines. The sky crane works because its descent stage was built with enough throttle depth for its own weight on Mars — not because Mars is Mars.
:::

## Reusable booster return: RTLS versus droneship

Back to Earth, and to a question this module has not asked yet. A booster has separated from the upper stage and is coasting downrange at high speed. Where does it land?

There are two answers.

- **Return to launch site (RTLS).** Fly back to a landing pad near where it lifted off. To do that, it must first cancel its downrange speed and head back, with a **boostback burn** soon after separation. Then it flies the entry burn and landing burn of lessons 10 and 12.
- **Droneship.** Land on an uncrewed ship waiting downrange, along the path the stage is already following. No boostback needed — only the entry burn and landing burn.

Think of throwing a ball and then wanting it back. Either you run out and catch it where it lands, or you make the ball turn around mid-flight and come back to you. Turning it around costs extra effort. The **[[two paths|return-paths]]** differ in exactly that way.

The sizes of these burns vary a lot from mission to mission. A heavy payload to a high orbit leaves the booster faster and farther out, so everything grows. Lesson 10's example used a large $1000\ \mathrm{m/s}$ entry burn, halving a $2000\ \mathrm{m/s}$ arrival speed, to make the $v^2$ and $v^3$ scaling easy to see. Real entry burns range from a few hundred meters per second to around a kilometer per second. The example below uses a smaller entry burn and then checks that the answer does not depend on the choice.

::: example What the boostback burn costs, in propellant
Use lesson 12's engine: $I_{sp} = 283\ \mathrm{s}$, $v_e = 2775.3\ \mathrm{m/s}$. Take illustrative, planning-level burn sizes (not a measured flight):

- boostback: about $1000\ \mathrm{m/s}$, to reverse the downrange speed;
- entry burn: about $300\ \mathrm{m/s}$;
- landing burn: about $400\ \mathrm{m/s}$, close to the $401.5\ \mathrm{m/s}$ lesson 12's burn cost.

**Step 1: total $\Delta v$.** RTLS flies all three: $\Delta v_{\mathrm{RTLS}} = 1000 + 300 + 400 = 1700\ \mathrm{m/s}$. Droneship skips the boostback: $\Delta v_{\mathrm{droneship}} = 300 + 400 = 700\ \mathrm{m/s}$.

**Step 2: propellant fraction.** The rocket equation says the share of the stage's mass (at the start of these burns) that must be propellant is $1 - e^{-\Delta v/v_e}$:

$$
\text{RTLS: } 1 - e^{-1700/2775.3} = 1 - 0.542 = 45.8\%, \qquad
\text{droneship: } 1 - e^{-700/2775.3} = 1 - 0.777 = 22.3\%.
$$

**Step 3: the difference.** RTLS needs about $23.5$ percentage points more of the stage's mass held back as propellant. On a flight that did not recover the booster, that propellant could have gone into pushing a heavier payload.

**Does the entry-burn choice matter?** Redo it with lesson 10's $1000\ \mathrm{m/s}$ entry burn. RTLS becomes $2400\ \mathrm{m/s}$, or $1 - e^{-2400/2775.3} = 57.9\%$; droneship becomes $1400\ \mathrm{m/s}$, or $39.6\%$. The gap is about $18$ points instead of $23.5$, but the conclusion is the same: the boostback is the big extra bill.
:::

Why pick RTLS at all, then? Because a landing pad on land is simple. It does not move, it does not need a crew at sea, and it does not care about waves. A droneship keeps more payload capacity, but someone has to tow or sail it hundreds of kilometers out for every landing, and the booster must hit a deck that rolls and heaves in the swell. Rough seas can call off a landing. Light payloads, with performance to spare, often **[[fly home|first-landings]]**. Heavy ones land at sea.

::: key RTLS vs droneship
RTLS needs a boostback burn to reverse the downrange velocity, which costs significant propellant and therefore payload. A droneship sits downrange so no boostback is needed, buying performance at the price of ship operations, weather sensitivity and a moving landing target.
:::

::: key The trade is upstream of the landing
After separation, both modes fly the same entry-burn and landing-burn physics this module has derived. The whole difference is the boostback: RTLS cancels downrange speed that a droneship, waiting where the stage is already headed, never has to cancel. That one burn is the largest single line in the propellant — and therefore payload — cost of flying home.
:::

## Check yourself

::: check
Compute the ratio of Mars's surface air density to Earth's, using this lesson's numbers. Which of Mars's two differences from Earth — lower gravity or thinner air — wins in the terminal-velocity comparison?
:::

::: answer
$\rho_{0,\mathrm{Mars}}/\rho_{0,\mathrm{Earth}} = 0.01538/1.225 = 0.0126$, about $1.3$ percent — air roughly $80$ times thinner.

Lower gravity on its own would *reduce* terminal velocity, since $v_t = \sqrt{2\beta g/\rho}$ has $g$ on top. But $g$ falls only by a factor of $2.64$, while $\rho$ on the bottom falls by about $80$. Thin air wins by a wide margin, which is why the same capsule's terminal velocity came out $5.5$ times *higher* on Mars.
:::

::: check
Why must a Mars lander open its parachute supersonically, when an Earth capsule usually waits for subsonic speed?
:::

::: answer
Mars's air is so thin that even a light, blunt (low-$\beta$) vehicle stays supersonic at heights and speeds where an Earth vehicle would be comfortably subsonic. The terminal-velocity example showed a representative capsule still near Mach $1.2$ even if it fully settled at ground level — and a real entry arrives faster than that.

Waiting for subsonic flow, the Earth habit, would mean waiting until the ground arrives. So Mars parachutes are designed and tested to open directly into supersonic flow, around Mach $1.7$ to $2.1$.
:::

::: check
A friend says: "The sky crane can hover because Mars's gravity is low. Lesson 12's booster could never do that on Earth." What is right and what is wrong in that sentence? Use numbers from lesson 12.
:::

::: answer
Right: lesson 12's stage cannot hover on Earth, because its minimum thrust acceleration, $14.4\ \mathrm{m/s^2}$, exceeds $g_0 = 9.807\ \mathrm{m/s^2}$.

Wrong: low gravity is not what lets the sky crane hover. Hovering needs $a_{T,\min} \le g$. Mars's smaller $g = 3.713\ \mathrm{m/s^2}$ makes that *harder* to meet: the same stage on Mars would have a minimum thrust-to-weight of $14.4/3.713 = 3.88$, farther from hovering than on Earth.

The sky crane hovers because its descent stage was *designed* with engines that throttle down to its own weight on Mars. Hovering is a design choice about engine size and throttle depth.
:::

::: check
Why can a Mars landing not be flown by a pilot on Earth with a joystick?
:::

::: answer
Radio signals take between about $3$ and $22$ minutes to travel between Earth and Mars, one way. The whole entry, descent and landing lasts only a few minutes. By the time a picture of the parachute opening reached Earth, the lander would already be on the ground, and any command sent back would arrive many minutes later still. So every step — parachute deployment, heat-shield release, powered descent, hazard avoidance, sky crane — must be decided by the lander's own computer.
:::

::: check
A launch company wants to carry as much payload as possible on a mission. Based on this lesson's example, which recovery mode should it choose, and what does it give up?
:::

::: answer
Droneship recovery. With the illustrative burn sizes, it holds back about $23.5$ percentage points less of the stage's mass as propellant ($22.3\%$ versus $45.8\%$), and that mass can go to payload instead.

What it gives up: the convenience of a fixed pad. It must sail and position a ship far downrange for every landing, accept that weather and sea state can call the landing off, and land on a deck that moves.
:::

::: check
This module used $H = 7200\ \mathrm{m}$ for every Earth atmosphere calculation. Explain why using that number for a Mars entry would be a serious error, using how $H$ is built.
:::

::: answer
Scale height is $H = RT/g$, and every piece of it differs between the planets.

- The gas constant depends on what the air is made of: $188.9\ \mathrm{J/(kg\cdot K)}$ for Mars's carbon dioxide versus $287.1\ \mathrm{J/(kg\cdot K)}$ for Earth's nitrogen-oxygen air.
- The temperature is different: Mars is much colder.
- Gravity is different: Mars's is $38$ percent of Earth's.

Mars's scale height comes out $10.68\ \mathrm{km}$, about $48$ percent larger than Earth's $7.2\ \mathrm{km}$, despite the cold — the small $g$ on the bottom outweighs the lower $R$ and $T$ on top. Using Earth's $H$ on Mars would make the density fall off far too quickly with height, putting peak deceleration and heating at the wrong altitudes.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $g_{\mathrm{Mars}} = \mu_{\mathrm{Mars}}/R_{\mathrm{Mars}}^2$ | $3.713\ \mathrm{m/s^2}$, $38\%$ of Earth's ($\mu = 42{,}828\ \mathrm{km^3/s^2}$, $R = 3396.2\ \mathrm{km}$) |
| $\rho_{0,\mathrm{Mars}} = p_0/(R_{\mathrm{CO_2}}T_0)$ | $0.01538\ \mathrm{kg/m^3}$, about $1.3\%$ of Earth's ($p_0 = 610\ \mathrm{Pa}$, $T_0 = 210\ \mathrm{K}$) |
| $H_{\mathrm{Mars}} = R_{\mathrm{CO_2}}T_0/g_{\mathrm{Mars}}$ | $10.68\ \mathrm{km}$, larger than Earth's $7.2\ \mathrm{km}$ because gravity is so much lower |
| Terminal velocity, $\beta = 150\ \mathrm{kg/m^2}$ | $49.0\ \mathrm{m/s}$ (Earth) vs $269\ \mathrm{m/s} \approx$ Mach $1.2$ (Mars): thin air beats low gravity |
| Supersonic parachute | Opens around Mach $1.7$–$2.1$; Mars never gets the vehicle subsonic in time |
| Light-time delay | About $3$ to $22$ minutes one way; EDL must be fully autonomous |
| Hover condition | $a_{T,\min} \le g$, i.e. $T_{\min} \le mg$ — a design choice; low gravity makes it harder |
| Sky crane | Near-hovering descent stage lowers the rover on tethers onto its wheels, then flies away |
| RTLS vs droneship, illustrative | $1700$ vs $700\ \mathrm{m/s}$; $45.8\%$ vs $22.3\%$ propellant fraction; the boostback is the difference |

This closes the module. From the entry interface through Allen-Eggers, the corridor, guided and lifting entry, hypersonic aerodynamics and every phase of a propulsive landing, the thread has been the same: a handful of equations carried carefully from planet to planet and vehicle to vehicle, without letting a single constant leak across the boundary.

::: context gas-constant Why each gas gets its own R
The universal gas constant, $8314\ \mathrm{J/(kmol\cdot K)}$, is the same for every gas when you count molecules. Engineers usually count kilograms instead, so they divide by the molar mass — how many kilograms one kilomole of the gas weighs.

Carbon dioxide molecules are heavy, $44.01\ \mathrm{kg/kmol}$, compared with about $28.97$ for Earth's air. Heavier molecules mean fewer of them per kilogram, so a smaller specific constant: $188.9$ for carbon dioxide against $287$ for Earth's air.
:::

::: context scale-height What a scale height means
Climb one scale height and the air gets $e \approx 2.718$ times thinner. Climb two and it is $e^2 \approx 7.4$ times thinner. The density follows $\rho = \rho_0\,e^{-h/H}$.

On Earth that happens about every $7.2\ \mathrm{km}$; on Mars, about every $10.7\ \mathrm{km}$. So Mars's thin air thins out more slowly with height — one reason a Mars entry decelerates over a long stretch of altitude.
:::

::: context mach-number Mach number
The Mach number is speed divided by the local speed of sound. Mach $1$ is the speed of sound; Mach $2$ is twice it. It is named after the Austrian physicist Ernst Mach, who photographed shock waves around bullets in the 1880s.

The speed of sound depends on the gas and its temperature. In Earth's air near the ground it is about $340\ \mathrm{m/s}$. In Mars's cold carbon dioxide it is only about $226\ \mathrm{m/s}$, so the same speed is a higher Mach number on Mars.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="90" y1="20" x2="90" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="90" y="32" width="39.2" height="20" fill="#8fb8f0" stroke="#1d6fd1"/>
  <rect x="90" y="66" width="215.2" height="20" fill="#f2b880" stroke="#b4232c"/>
  <line x1="270.8" y1="22" x2="270.8" y2="100" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4,3"/>
  <text x="82" y="46" font-size="12" fill="#1f2a44" text-anchor="end">Earth</text>
  <text x="82" y="80" font-size="12" fill="#1f2a44" text-anchor="end">Mars</text>
  <text x="135" y="46" font-size="11" fill="#1f2a44">49 m/s</text>
  <text x="310" y="80" font-size="11" fill="#1f2a44">269</text>
  <text x="266" y="16" font-size="11" fill="#b4232c" text-anchor="end">Mars sound speed 226 m/s</text>
  <text x="200" y="120" font-size="11" fill="#1f2a44" text-anchor="middle">terminal velocity, β = 150 kg/m²</text>
</svg>
```
:::

::: context mars-heat-shield Thin air, still hot
Landers reach Mars at several kilometers per second — Curiosity hit the top of the atmosphere at about $5.9\ \mathrm{km/s}$. Lesson 4's Sutton-Graves correlation says heating grows with $\sqrt{\rho}$ but with $v^3$. The thin air takes a big bite out of heating, but the cube of that speed puts plenty back.

So a Mars lander still rides in an aeroshell with a heat shield in front, much like an Earth capsule. The air is thick enough to cook the vehicle, and too thin to stop it.
:::

::: context disk-gap-band A parachute with a gap in it
A disk-gap-band parachute has a round canopy (the disk), a ring of open space (the gap), and a band of fabric around the edge. The gap lets some air escape in a controlled way, which keeps the canopy steadier when it slams open in supersonic flow.

The design goes back to NASA's Viking landers of the 1970s, and every U.S. Mars lander since has used a descendant of it. Perseverance's was about $21.5\ \mathrm{m}$ across. Its orange and white panels spelled out "Dare Mighty Things" in a binary code that fans decoded within hours of the landing.
:::

::: context light-time How long a message takes
Radio travels at the speed of light, about $300{,}000\ \mathrm{km/s}$. At the closest approach, Mars is about $55$ million km away, so a signal takes about $3$ minutes. When the planets are on opposite sides of the Sun, about $400$ million km apart, it takes about $22$ minutes.

Entry, descent and landing lasts about seven minutes. NASA's engineers called Curiosity's landing "seven minutes of terror", because by the time they heard the lander had entered the atmosphere, it had already landed or crashed. All they could do was wait for the news.
:::

::: context sky-crane The sky crane, drawn
The descent stage hovers above, its engines angled outward to keep their exhaust off the rover. The rover hangs below on tethers and touches down on its wheels. For Curiosity, the stage lowered the rover while descending at about $0.75\ \mathrm{m/s}$, a slow walking pace.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="30" width="100" height="22" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="135" y1="52" x2="115" y2="80" stroke="#f2b880" stroke-width="5"/>
  <line x1="225" y1="52" x2="245" y2="80" stroke="#f2b880" stroke-width="5"/>
  <line x1="150" y1="52" x2="150" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="52" x2="180" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="210" y1="52" x2="210" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="140" y="130" width="80" height="26" rx="3" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="150" cy="165" r="9" fill="#6c7a93"/>
  <circle cx="180" cy="165" r="9" fill="#6c7a93"/>
  <circle cx="210" cy="165" r="9" fill="#6c7a93"/>
  <line x1="20" y1="174" x2="340" y2="174" stroke="#1f2a44" stroke-width="2"/>
  <text x="240" y="30" font-size="11" fill="#1f2a44">descent stage</text>
  <text x="222" y="100" font-size="11" fill="#1f2a44">tethers</text>
  <text x="228" y="146" font-size="11" fill="#1f2a44">rover</text>
  <text x="20" y="192" font-size="11" fill="#1f2a44">lands on its own wheels</text>
  <text x="20" y="30" font-size="11" fill="#b4232c">exhaust angled away</text>
</svg>
```
:::

::: context return-paths The two ways home, sketched
After separation, the booster is heading away from the launch site. On a droneship flight it keeps going and meets the ship downrange. On an RTLS flight the boostback burn turns it around and it flies back to a pad near the launch site. Not to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="160" x2="350" y2="160" stroke="#1f2a44" stroke-width="2"/>
  <path d="M40,160 Q70,60 150,40" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="150" cy="40" r="4" fill="#1f2a44"/>
  <text x="150" y="28" font-size="11" fill="#1f2a44" text-anchor="middle">separation</text>
  <path d="M150,40 Q280,30 320,156" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M150,40 Q200,40 190,70 Q170,120 62,156" fill="none" stroke="#b4232c" stroke-width="2.5" stroke-dasharray="6,4"/>
  <rect x="304" y="154" width="32" height="6" fill="#1d6fd1"/>
  <rect x="52" y="154" width="22" height="6" fill="#b4232c"/>
  <text x="330" y="148" font-size="11" fill="#1d6fd1" text-anchor="end">droneship</text>
  <text x="80" y="176" font-size="11" fill="#b4232c">RTLS pad</text>
  <text x="200" y="98" font-size="11" fill="#b4232c">boostback, then back</text>
  <text x="12" y="176" font-size="11" fill="#1f2a44">launch</text>
</svg>
```
:::

::: context first-landings When it first worked
The first orbital-class booster to land on its own was a Falcon 9 first stage on 21 December 2015, which flew back to Landing Zone 1 at Cape Canaveral — an RTLS landing. The first successful droneship landing followed on 8 April 2016, on the ship *Of Course I Still Love You* in the Atlantic.

SpaceX named its droneships after starships in Iain M. Banks's science-fiction novels. Since then, booster landings have become routine, and most heavy missions end at sea.
:::
