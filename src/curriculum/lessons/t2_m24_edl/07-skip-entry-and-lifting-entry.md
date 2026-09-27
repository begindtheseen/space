---
id: l07-skip-entry-and-lifting-entry
title: Skip entry and lifting entry
minutes: 22
covers:
  - skip entry
  - lifting entry and bank-angle modulation
---

Throw a flat stone low and fast across a pond and it bounces. Throw it steeply and it plunges in with a splash. Somewhere in between there is an angle where it barely touches the water, loses a little speed, and hops back up to come down again farther on.

A spacecraft coming home meets the atmosphere the same way. Lesson 6 found the band of entry angles that work — the **entry corridor** — and watched it shrink toward nothing as entry speed climbed. In that lesson the vehicle had no way to fight back. It had zero lift and one pass through the air, so the corridor was fixed by the entry angle and two stated limits, and nothing else.

This lesson gives the vehicle two tools. The first is to spend its energy in installments: dip into the air, shed part of the energy, climb back out, and come down again for a gentler final pass. That is **skip entry**. The second is **lift**, a sideways push from the air that the vehicle can point where it wants by rolling. Apollo used both. Every crewed vehicle since — the Shuttle, Orion, Crew Dragon — has used the second.

## Skip entry: paying for the entry in installments

Start with lesson 6's overshoot boundary: the shallowest entry angle that still keeps the vehicle down. A vehicle that enters a little shallower than that does not crash or burn up. It **[[skips|skip-stone]]**. It passes through the upper atmosphere, loses some energy on the way, and climbs back out on an arc that stays below orbit, so it falls back in later.

**Skip entry** turns that near-miss into a plan. You aim close to the overshoot boundary on purpose, so the first pass sheds only a chosen fraction of the energy. You accept the skip. Then you come back down for a second (or final) pass, now slower and easier to survive.

How much energy does one pass remove? It depends sharply on how close to the boundary you fly.

::: example How much energy a single skip pass removes
Take the lunar-return case from lesson 6: entry speed $v_E = 11{,}000\ \mathrm{m/s}$ (read "v sub E", the speed at the entry interface), ballistic coefficient $\beta = 200\ \mathrm{kg/m^2}$, zero lift. For this vehicle the overshoot boundary is at $\gamma_E = -5.16^\circ$ ($\gamma_E$, "gamma sub E", is the entry flight-path angle; negative means descending).

Run the numerical truth model of lesson 3 at several entry angles shallower than the boundary. Each trajectory dips in and climbs back out. Record the speed when it climbs back through the $120\ \mathrm{km}$ interface, and the angle it climbs at:

| $\gamma_E$ | speed lost during the pass | exit flight-path angle |
| --- | --- | --- |
| $-2.0^\circ$ | $4.0\ \mathrm{m/s}$ ($0.04\%$) | $+2.00^\circ$ |
| $-3.0^\circ$ | $18.0\ \mathrm{m/s}$ ($0.16\%$) | $+3.00^\circ$ |
| $-4.0^\circ$ | $129.8\ \mathrm{m/s}$ ($1.18\%$) | $+3.96^\circ$ |
| $-4.5^\circ$ | $430.4\ \mathrm{m/s}$ ($3.91\%$) | $+4.32^\circ$ |
| $-5.0^\circ$ | $1758.1\ \mathrm{m/s}$ ($15.98\%$) | $+3.88^\circ$ |

Read the middle column top to bottom. At $-2^\circ$ the pass removes almost nothing: $4.0$ out of $11{,}000\ \mathrm{m/s}$ is $4.0/11{,}000 = 0.04\%$. At $-5^\circ$, a sixth of a degree from the boundary, it removes $1758.1\ \mathrm{m/s}$, which is $1758.1/11{,}000 = 16.0\%$ — nearly a sixth of the entry speed in one dip. The vehicle leaves at $11{,}000 - 1758 = 9242\ \mathrm{m/s}$.

Now the right column. When the pass removes very little, the exit angle is the mirror image of the entry angle: in at $-2^\circ$, out at $+2^\circ$, like a ball bouncing off a wall with no loss. Once the pass removes real speed, the symmetry breaks: in at $-5^\circ$, out at only $+3.88^\circ$.

Sanity check: every exit speed is above the $7832\ \mathrm{m/s}$ local circular speed from lesson 6, as it must be. A vehicle that left the atmosphere slower than that could not have climbed back out.
:::

That table is the whole logic of skip entry. Choosing how close to the overshoot boundary to fly *is* choosing how much energy to remove on the first pass.

A single steep dive removes everything at once, in one short, intense peak of deceleration and heating (lessons 2 through 4). A shallower first pass removes a chosen fraction at a much gentler peak. Whatever energy remains is shed on a second, slower pass. You trade one hard peak for two gentler ones.

The price is real. The trajectory is longer and more complicated. And the guidance must hit the second pass's entry angle precisely. Too shallow and the vehicle skips again. Too steep and the second pass breaks its own limits.

Skip also buys distance. A controlled skip lets the vehicle "float" much farther downrange than a single dive could. Apollo's entry guidance was built with this in mind, as a way to reach a landing point far downrange (lesson 8 shows how). Orion flew a real skip entry on **[[Artemis I|real-skips]]** in 2022.

::: key Skip entry
Flying deliberately close to the overshoot boundary so a controlled fraction of entry energy is shed on a first atmospheric pass, allowing the vehicle to skip back to a sub-orbital arc and complete deceleration on a second, gentler pass. Trades one high-peak, short entry for two lower-peak passes at the cost of trajectory complexity and a longer total flight — the same rate-versus-duration trade lesson 4 introduced, now controlled deliberately rather than fixed by vehicle design.
:::

## Lift, and what bank angle really changes

A ballistic vehicle has one control: when and where it enters. After that, gravity, drag and centrifugal relief (lesson 3) fly the trajectory. It is a thrown stone.

A vehicle with lift has a real control in flight. **Lift** is the part of the air's push that is square to the velocity — sideways to the direction of motion — while **drag** is the part straight against the motion. The **lift-to-drag ratio** $L/D$ says how big the lift is next to the drag.

A capsule is almost round, so how does it make lift at all? It flies tilted. Its designers put its **[[center of mass slightly off to one side|offset-cg]]**, so the air pushes it to a steady tilt called the **trim angle of attack**. The tilt sets $L/D$ — about $0.3$ for an Apollo-class capsule — and the capsule cannot change it quickly in flight. So think of $L/D$, and the size of the lift, as fixed.

What the vehicle *can* change is which way the lift points. Picture yourself riding a bicycle. Lean left and the bike turns left. The capsule does something similar: it rolls about its own velocity vector, and the lift vector rolls with it. The roll angle is the **bank angle** $\sigma$ (read "sigma"), measured from straight up.

Rolling splits the fixed lift into **[[two pieces|bank-split]]**:

- $L\cos\sigma$ points up, in the vertical plane of the trajectory. It holds the vehicle up and relieves deceleration, the same job the equilibrium-glide relations of t1_m18 describe.
- $L\sin\sigma$ points sideways, out of that plane. It turns the vehicle left or right and steers **crossrange** — distance to the side of the original ground track.

At $\sigma = 0$ ("lift up") all the lift holds the vehicle up. That gives the most vertical relief and the widest corridor. Banking trades some of that vertical relief for sideways steering.

::: key Bank angle splits lift, it does not create it
$L$ is fixed by trim angle of attack; bank angle $\sigma$ only redirects it. $L\cos\sigma$ acts vertically (deceleration relief, corridor width); $L\sin\sigma$ acts horizontally (crossrange). Reversing $\sigma$ periodically bounds the crossrange excursion without giving up the vertical benefit most of the time.
:::

### Bank reversals

Here is the catch. Any sustained bank to one side keeps pushing the vehicle sideways, so its crossrange keeps growing. It never levels off. But the guidance usually needs a bank angle well away from zero, because it needs to *reduce* vertical lift to control how far downrange the vehicle goes.

The fix is to bank the same amount but flip sides now and then. That flip is a **bank reversal**: the sign of $\sigma$ changes, say from $+50^\circ$ to $-50^\circ$. The vertical piece $L\cos\sigma$ is the same either way, because $\cos(-\sigma) = \cos\sigma$. Only the sideways push changes direction. The guidance flips whenever the accumulated crossrange error nears an allowed limit, called a **[[deadband|deadband]]**. The ground track weaves inside a band around the target while the vehicle keeps using the vertical lift it needs.

::: key Bank-angle modulation
The lift magnitude is fixed by the trim angle of attack, so the guidance rolls the vehicle to change the *vertical component* of lift, $L\cos\sigma$, controlling the descent rate and downrange. Periodic bank reversals then null the accumulated crossrange.
:::

This is exactly how Apollo, the Shuttle, and every capsule flown since with a trimmed offset center of mass have flown a fixed-$L/D$ vehicle to a precise landing point.

## How much lift buys: peak deceleration

To see what lift does, add it to the equations of motion this module has used since lesson 3. Lift has size $L = (L/D)\,D$, where $D = \rho v^2/(2\beta)$ is the drag per unit mass. (Throughout this module, $D$ and $L$ are forces per unit mass, so they have units of acceleration.) Lift acts square to the velocity, so it cannot speed the vehicle up or slow it down. It can only bend the path. So it appears in the equation for the flight-path angle, and nowhere else:

$$
\dot\gamma = \frac{L\cos\sigma}{v} + \cos\gamma\left(\frac{v}{r} - \frac{g}{v}\right).
$$

(Read $\dot\gamma$ as "gamma dot", the rate the flight-path angle changes.) The speed equation $\dot v = -D - g\sin\gamma$ and the height equation $\dot r = v\sin\gamma$ are unchanged. With lift up, $\sigma = 0$, the new term is $L/v$: it bends the path upward, fighting gravity's $-g/v$.

::: example Peak deceleration as lift grows
Hold the entry fixed at $v_E = 11{,}000\ \mathrm{m/s}$, $\gamma_E = -8^\circ$, $\beta = 200\ \mathrm{kg/m^2}$, lift up. Integrate the equations above for four values of $L/D$ and record the peaks (the heat rate uses Sutton-Graves from lesson 4, with lesson 6's nose radius $R_n = 0.5\ \mathrm{m}$):

| $L/D$ | peak deceleration | peak heat rate |
| --- | --- | --- |
| $0.0$ | $31.33\,g_0$ | $620.0\ \mathrm{W/cm^2}$ |
| $0.1$ | $24.47\,g_0$ | $595.7\ \mathrm{W/cm^2}$ |
| $0.2$ | $19.69\,g_0$ | $572.9\ \mathrm{W/cm^2}$ |
| $0.3$ | $16.39\,g_0$ | $551.6\ \mathrm{W/cm^2}$ |

Compare the first and last rows. $16.39/31.33 = 0.52$, so a modest $L/D = 0.3$ — an Apollo-class capsule's figure — cuts peak deceleration nearly in half, at the same entry speed and angle. Peak heat rate falls too, but only by $1 - 551.6/620.0 = 11\%$.

Sanity check: every row still pulls far more than $10\,g_0$. At $-8^\circ$ this entry is well outside lesson 6's corridor, and lift alone does not rescue it. It softens it.
:::

Why does lift help, when it [[removes no energy|no-work]]? Drag still does all the work of slowing the vehicle. What lift changes is the *shape* of the path. It holds $\gamma$ shallower for longer, so the vehicle does more of its slowing high up, in thinner air, spread over a longer and gentler pass. A shallower ballistic entry angle would do something similar. Lift buys that effect without changing the entry angle at all.

::: example Sanity check against zero lift
A lifting vehicle with $L/D = 0$ has no lift. So setting $L/D = 0$ in the lifting-entry equations must give back lesson 3's ballistic results exactly.

Run the lifting-entry code at $v_E = 11{,}000\ \mathrm{m/s}$, $\gamma_E = -6.5^\circ$, $\beta = 200\ \mathrm{kg/m^2}$, $L/D = 0$. It gives peak deceleration $18.789\,g_0$ at $h = 47.918\ \mathrm{km}$, matching lesson 3's ballistic truth model to six significant figures.

This is not new physics. It is the test that must pass before any of the nonzero-$L/D$ numbers can be trusted. A code that gets the $L/D = 0$ limit wrong has a bug somewhere, and cannot be trusted at any other $L/D$ either.
:::

## How much lift buys: corridor width

Now repeat lesson 6's corridor construction with lift up. The overshoot wall is found the same way: bisect on "skips" versus "stays down". For the steep wall, use the $10\,g_0$ deceleration limit only. At $v_E = 11{,}000\ \mathrm{m/s}$:

| $L/D$ | overshoot wall | $g$-limit wall | corridor width |
| --- | --- | --- | --- |
| $0.0$ | $-5.16^\circ$ | $-5.71^\circ$ | $0.545^\circ$ |
| $0.1$ | $-5.49^\circ$ | $-6.16^\circ$ | $0.669^\circ$ |

Work out the widths. For zero lift, $5.71 - 5.16 = 0.545^\circ$ (with the unrounded walls). For $L/D = 0.1$, $6.16 - 5.49 = 0.669^\circ$. The ratio is $0.669/0.545 = 1.23$, so a small $L/D$ of $0.1$ widens this $g$-limited corridor by about $23\%$. That is real room for navigation and guidance to work in.

Notice that *both* walls move steeper. You might expect lift to relieve only the steep wall. But the same upward lift that lowers peak deceleration also floats a grazing vehicle back out of the atmosphere more easily. So an angle that used to be captured now skips, and the overshoot wall retreats to a steeper angle too.

The corridor still widens, because the steep wall moves more ($0.45^\circ$) than the shallow wall ($0.33^\circ$). The net gain is the difference between two moving boundaries. That is exactly the kind of result that needs the numerical machinery of this module rather than a rule of thumb.

::: warning Check every limit, not only one
This table used the $10\,g_0$ limit alone. Lesson 6 also had a $300\ \mathrm{W/cm^2}$ heat-rate limit, and at $11{,}000\ \mathrm{m/s}$ that was the one that bound. Apply it here and the picture changes. With zero lift, the heat-rate wall at $-5.25^\circ$ leaves lesson 6's thin $0.086^\circ$ corridor. With lift held full up at $L/D = 0.1$, the overshoot wall moves to $-5.49^\circ$, and a trajectory captured there already peaks at about $320\ \mathrm{W/cm^2}$. For this vehicle, constant lift-up closes the heating corridor completely. A real lifting vehicle does not hold lift up the whole way. It modulates bank angle, which is the [[subject of lesson 8|lesson8-bridge]].
:::

::: warning Lift is not free width
Every extra degree of corridor from lift comes with the $L/D$ it took to buy it. A real vehicle's $L/D$ is limited by its shape, its center-of-mass offset, and whether it stays stable at its hypersonic angle of attack. Nobody picks it for corridor width alone. A vehicle already committed to a low-$L/D$ shape for other reasons (packaging, mass, stability) cannot claim these corridor numbers without first confirming it can really fly at the assumed $L/D$.
:::

## Check yourself

::: check
What does skip entry give up in exchange for lower peak heating and deceleration on each atmospheric pass?
:::

::: answer
Total flight time and simplicity. Splitting the energy removal across two (or more) passes lowers the peak on each pass. But the vehicle takes longer overall to finish the entry, and the guidance must aim the second pass's entry angle precisely. An error there risks skipping again (removing too little energy) or diving too steeply on the second pass and breaking its limits (removing too much, too fast).
:::

::: check
A vehicle flies bank angle $\sigma = 90^\circ$ for its whole entry. What happens to its vertical lift relief and its crossrange authority? Is this a sustainable strategy?
:::

::: answer
At $\sigma = 90^\circ$, $\cos\sigma = 0$, so $L\cos\sigma = 0$: all of the lift acts sideways. The vehicle gets the most crossrange authority, but no vertical relief at all. For deceleration and corridor width it flies exactly as if it had no lift, while its ground track steers steadily away from the entry plane.

It is not sustainable for reaching a fixed target. The crossrange offset keeps growing the longer the bank is held. Real guidance uses bank angles well short of $90^\circ$ and reverses the sign periodically instead of committing to one side.
:::

::: check
Why must the $L/D = 0$ case of a lifting-entry model reproduce lesson 3's ballistic results exactly, and what would it mean if it did not?
:::

::: answer
A vehicle with zero lift-to-drag ratio has no lift. Substituting $L = (L/D)\cdot D = 0$ into the lifting equations removes the lift term, and what remains should be identical to lesson 3's ballistic equations.

If the two disagreed, the lifting-entry code would contain an error that has nothing to do with lift — a bug in the shared drag, gravity or curvature terms, which are supposed to be unchanged. So checking this limit is a necessary (though not sufficient) test of the whole extended model, not a statement about lift.
:::

::: check
At a fixed entry angle and speed, why does adding lift reduce peak deceleration, even though lift is square to the velocity and removes no kinetic energy?
:::

::: answer
Lift changes how the flight-path angle evolves instead of removing energy. It holds $\gamma$ shallower for longer than a ballistic trajectory would. Drag still removes the same total energy, but the vehicle does more of that removal higher up, at lower density, over a longer and gentler pass, before it dives as deep as the zero-lift case would. Spreading the same energy loss over more time lowers the peak rate of loss, and the peak rate of loss is the peak deceleration.
:::

::: check
Adding lift widens the $g$-limited corridor at $11{,}000\ \mathrm{m/s}$, yet the overshoot wall itself gets steeper with lift. How can both be true?
:::

::: answer
Lift makes it easier to skip at a given entry angle: the same upward lift that relieves deceleration also floats a near-skip trajectory back out. That moves the overshoot wall steeper, from $-5.16^\circ$ to $-5.49^\circ$, a shift of $0.33^\circ$. At the same time lift relieves deceleration enough to move the $g$-limit wall steeper by more, from $-5.71^\circ$ to $-6.16^\circ$, a shift of $0.45^\circ$. The width is the *difference* between the two walls, so it grows by $0.45 - 0.33 \approx 0.12^\circ$ — not because the overshoot wall stayed put, but because the other wall moved farther.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Skip entry | Deliberately grazing near the overshoot boundary to shed entry energy across more than one atmospheric pass |
| Energy lost per pass (worked example) | $0.04\%$ at $\gamma_E=-2^\circ$ rising to $16.0\%$ at $\gamma_E=-5^\circ$ (near the $-5.16^\circ$ overshoot wall), $v_E=11{,}000\ \mathrm{m/s}$ |
| $L/D$ | Lift-to-drag ratio, set by the trim angle of attack; about $0.3$ for an Apollo-class capsule |
| Bank angle $\sigma$ | Splits fixed-magnitude lift into vertical ($L\cos\sigma$, deceleration relief, downrange) and horizontal ($L\sin\sigma$, crossrange) components |
| $\dot\gamma = L\cos\sigma/v + \cos\gamma\,(v/r - g/v)$ | Where lift enters the equations of motion; the speed equation is unchanged |
| Bank reversal | Periodic sign flip of $\sigma$ that bounds accumulated crossrange while keeping the same vertical lift |
| Peak deceleration vs. $L/D$ (worked example) | $31.3\,g_0$ ($L/D=0$) falling to $16.4\,g_0$ ($L/D=0.3$) at fixed $\gamma_E=-8^\circ$, $v_E=11{,}000\ \mathrm{m/s}$ |
| Corridor width vs. $L/D$ (worked example) | $0.545^\circ$ ($L/D=0$) to $0.669^\circ$ ($L/D=0.1$) at $v_E=11{,}000\ \mathrm{m/s}$, $g$-limit only — both walls move, net corridor widens |

The next lesson shows how real vehicles turn this lift and bank authority into a closed-loop guidance law — Apollo's and the Shuttle's, the two entry-guidance families every crewed vehicle since has descended from.

::: context skip-stone Why a spacecraft skips
The stone on a pond is a picture, not the mechanism. A skipping spacecraft does not bounce off a hard surface. It is carried back up by its own speed. Moving faster than local circular speed, its path curves around the Earth less sharply than the Earth curves away beneath it — that is the $v/r$ centrifugal-relief term in $\dot\gamma$ from lesson 3. Drag slows it a little on the way through, but if not enough speed is lost, that relief term wins and the path turns upward again, out of the air.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <polyline fill="none" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="5 4" points="-5.5,129.6 11.9,126.0 29.4,122.8 47.0,120.0 64.6,117.5 82.3,115.4 100.0,113.6 117.8,112.2 135.5,111.1 153.3,110.4 171.1,110.0 188.9,110.0 206.7,110.4 224.5,111.1 242.2,112.2 260.0,113.6 277.7,115.4 295.4,117.5 313.0,120.0 330.6,122.8 348.1,126.0 365.5,129.6"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="0.7,158.9 17.6,155.5 34.5,152.4 51.5,149.7 68.5,147.3 85.6,145.2 102.7,143.5 119.8,142.1 137.0,141.1 154.2,140.4 171.4,140.0 188.6,140.0 205.8,140.4 223.0,141.1 240.2,142.1 257.3,143.5 274.4,145.2 291.5,147.3 308.5,149.7 325.5,152.4 342.4,155.5 359.3,158.9"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="-6.0,58.2 4.9,64.6 16.3,74.2 27.8,86.0 39.1,98.6 50.1,110.6 60.6,120.7 70.4,127.9 79.6,131.2 88.4,130.4 96.8,126.5 105.0,120.1 113.3,111.7 121.6,102.4 130.1,93.2 138.8,85.0 147.8,79.0 156.9,75.7 166.1,75.3 175.4,76.7 184.6,79.5 193.8,83.3 202.8,87.8 211.8,92.3 220.7,96.5 229.6,99.7 238.5,101.7 247.4,103.1 256.0,107.8 264.3,115.0 272.5,122.3 280.8,127.3 289.4,129.1 297.9,131.9 306.1,136.3 314.2,141.4 322.1,146.7 330.1,151.2 338.2,154.5 342.4,155.5"/>
  <text x="18" y="102" font-size="11" fill="#1f2a44">in</text>
  <text x="104" y="138" font-size="11" fill="#1f2a44">first pass</text>
  <text x="136" y="66" font-size="11" fill="#1f2a44">coast above the air</text>
  <text x="262" y="100" font-size="11" fill="#1f2a44">final pass</text>
  <text x="312" y="112" font-size="11" fill="#1d6fd1">edge of air</text>
  <text x="150" y="160" font-size="11" fill="#1d6fd1">Earth</text>
</svg>
```

Not to scale: the real atmosphere is far thinner next to the Earth than drawn.
:::

::: context real-skips Skip entries that have flown
The idea is old; flying it is newer. The Soviet Zond 7 spacecraft returned from a lunar flyby in 1969 with a skip entry and landed in the Soviet Union. China tested a skip return from lunar distance with Chang'e 5-T1 in 2014 and used it again for the Chang'e 5 sample return. NASA's uncrewed Orion capsule flew a skip entry at the end of Artemis I in December 2022, dipping into the atmosphere, climbing back out, and then descending to splash down in the Pacific off Baja California.
:::

::: context offset-cg How a round capsule makes lift
A capsule's heat shield is nearly symmetric, so flying straight into the flow it would make almost no lift. Designers shift the center of mass a little off the capsule's center line, with ballast if needed. The air's push then balances only when the capsule sits tilted, a few tens of degrees to the flow. Tilted, the heat shield deflects air to one side, and the reaction is lift. The tilt is set by where the mass sits, so it cannot be changed quickly in flight. Rolling the whole capsule, with small thrusters, is how the crew or computer points that lift.
:::

::: context bank-split The lift vector, seen from behind
Look at the capsule from behind, along its velocity. The lift arrow has a fixed length. Rolling by $\sigma = 35^\circ$ tilts it: the upright piece $L\cos 35^\circ = 0.82\,L$ still holds the vehicle up, and the sideways piece $L\sin 35^\circ = 0.57\,L$ pushes it to the side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="175" x2="320" y2="175" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3"/>
  <line x1="140" y1="175" x2="140" y2="68.5" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="140" y1="68.5" x2="214.6" y2="68.5" stroke="#f2b880" stroke-width="3" stroke-dasharray="6 4"/>
  <line x1="140" y1="175" x2="214.6" y2="68.5" stroke="#b4232c" stroke-width="3"/>
  <polygon points="214.6,68.5 204.3,74.5 212.5,80.2" fill="#b4232c"/>
  <path d="M140,135 A40,40 0 0,1 162.9,142.2" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="140" cy="175" r="8" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="146" y="128" font-size="12" fill="#1f2a44">σ</text>
  <text x="186" y="130" font-size="12" fill="#b4232c">lift L</text>
  <text x="64" y="115" font-size="12" fill="#1d6fd1">L cos σ</text>
  <text x="150" y="60" font-size="12" fill="#1f2a44">L sin σ</text>
  <text x="228" y="72" font-size="11" fill="#6c7a93">sideways: crossrange</text>
  <text x="46" y="190" font-size="11" fill="#6c7a93">vehicle, flying into the page</text>
</svg>
```
:::

::: context deadband What a deadband is
A **deadband** is a zone where a controller deliberately does nothing. A home thermostat set to $20^\circ\mathrm{C}$ does not switch the heater on at $19.99$; it waits until, say, $19.5$, then heats to $20.5$. Without that band it would click on and off constantly. Entry guidance does the same with crossrange: it lets the error wander inside a band and reverses the bank only at the edge. Each reversal costs something — the vehicle must roll through upright or through its side, and fuel for the roll thrusters is limited — so fewer reversals is better.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="45" x2="330" y2="79" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="40" y1="145" x2="330" y2="111" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="40" y1="95" x2="330" y2="95" stroke="#8fb8f0" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,95 97.7,51.8 197.4,126.6 270.1,72.0 323.2,111.8 330,106.7"/>
  <circle cx="97.7" cy="51.8" r="3.5" fill="#b4232c"/>
  <circle cx="197.4" cy="126.6" r="3.5" fill="#b4232c"/>
  <circle cx="270.1" cy="72.0" r="3.5" fill="#b4232c"/>
  <circle cx="323.2" cy="111.8" r="3.5" fill="#b4232c"/>
  <text x="44" y="36" font-size="11" fill="#6c7a93">deadband edge</text>
  <text x="120" y="160" font-size="11" fill="#b4232c">dots: bank reversals</text>
  <text x="214" y="30" font-size="11" fill="#1f2a44">crossrange error</text>
  <text x="250" y="160" font-size="11" fill="#1f2a44">time →</text>
</svg>
```

Here the band narrows as the vehicle nears the target, as it does in real guidance designs, so the reversals come closer together.
:::

::: context no-work Why a sideways force does no work
Work is force times distance moved *along* the force. Swing a ball on a string in a circle: the string pulls the ball toward your hand, square to its motion, and the ball never speeds up or slows down. The string bends the path and nothing more. Lift is the same for an entry vehicle. Only drag, pointing straight back, takes energy away. So adding lift cannot remove energy faster. It can only change *where* along the path the drag does its work.
:::

::: context lesson8-bridge Where bank modulation goes next
The corridor numbers in this lesson hold lift fully up, which is the simplest case and the worst one for the overshoot wall. Real guidance does something smarter: it keeps the bank angle changing all the way down, using lift up when the vehicle is too steep and banking away when it would float too far. Lesson 8 shows the two classic ways to decide the bank angle, and why both of them are driven by the one thing an entry vehicle can measure directly — its own deceleration.
:::
