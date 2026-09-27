---
id: l09-hypersonic-aerodynamics-and-transonic-transition
title: Hypersonic aerodynamics and the transonic transition
minutes: 19
covers:
  - hypersonic aerodynamics and the transonic transition
---

Hold your hand out of a car window on the highway. Flat and level, the air barely pushes it. Tilt it up a little and it is shoved up and back. Turn it square to the wind and it is pushed back hard. The force depends on two things: how fast you are going, and how your hand is tilted to the wind.

Every lesson so far has squeezed a vehicle's whole aerodynamic behavior into two numbers: the ballistic coefficient $\beta = m/(C_D A)$ and, from lesson 7, a lift-to-drag ratio $L/D$. Both treat the **drag coefficient** $C_D$ and **lift coefficient** $C_L$ — the numbers that say how strongly a shape is pushed for a given speed and air density — as constants. But a trajectory runs from a **[[Mach number|mach-number]]** in the high twenties or thirties at entry interface down through single digits by the time a parachute opens. Why should one number work across all of that?

It turns out to be an excellent assumption for most of an entry, and a badly wrong one in a narrow, critical band near the end. This lesson shows why it holds at hypersonic speed, and pins down where it stops holding.

## Newtonian impact theory

Picture a sandblaster aimed at a board. Each grain flies straight at the board, hits it, and loses the part of its speed that was aimed *into* the board. The part of its speed *along* the board it keeps, and it slides off. Tilt the board so it faces the stream more squarely and more grains hit it, each one harder. Tilt it edge-on and almost none hit at all.

At hypersonic speed, air around a blunt vehicle behaves remarkably like that sand. The air piles up in a very thin layer between the vehicle and a **[[shock wave|shock-layer]]** standing just in front of it. The faster the vehicle goes, the thinner that layer gets, and the more the flow looks like grains striking the surface directly. This is **[[Newtonian impact theory|newton-origin]]**.

Now make it exact. Let the air arrive at speed $v$ with density $\rho$ (read "rho"). Take a small patch of surface tilted so the flow meets it at the **local flow-incidence angle** $\theta$ ("theta") — the angle between the surface and the oncoming flow. Square-on to the flow is $\theta = 90^\circ$; lined up with it is $\theta = 0^\circ$.

**Step 1: how much air hits.** Only the part of the flow's speed aimed into the surface, $v\sin\theta$, carries air onto it. So the mass arriving per second, per square meter, is $\rho v\sin\theta$.

**Step 2: how much momentum each kilogram loses.** Each kilogram loses its speed into the surface, $v\sin\theta$, and keeps its speed along it ([[picture|incidence-picture]]).

**Step 3: pressure is the rate of momentum lost per area.** Multiply the two:

$$
\Delta p = (\rho\,v\sin\theta)(v\sin\theta) = \rho v^2 \sin^2\theta,
$$

where $\Delta p$ ("delta p") is the extra pressure above the undisturbed air.

**Step 4: make it a coefficient.** Engineers divide a pressure by the **dynamic pressure** $\tfrac{1}{2}\rho v^2$ to get a **[[pressure coefficient|pressure-coefficient]]** $C_p$, a pure number:

$$
C_p = \frac{\Delta p}{\tfrac{1}{2}\rho v^2} = 2\sin^2\theta.
$$

Check the two ends. At $\theta = 90^\circ$, $\sin\theta = 1$ and $C_p = 2$: the most a surface can feel in this model, at the point square-on to the flow, called the **stagnation point**. At $\theta = 0^\circ$, $C_p = 0$: a surface parallel to the flow is not struck at all. Surfaces facing away from the flow, in the "shadow" behind the vehicle, are also given $C_p = 0$ — the particles cannot reach them. That is a simplification, and we will come back to it.

::: key Newtonian impact pressure coefficient
$$
C_p = 2\sin^2\theta,
$$
$\theta$ the local flow-incidence angle. Derived from momentum flux alone — no viscosity, no compressibility parameter, nothing but geometry and the assumption that the shock layer is infinitesimally thin, which becomes an increasingly good approximation as Mach number rises.
:::

For real air the peak is a little under $2$. Theory for a strong shock in air gives a stagnation-point value of about $1.84$ at very high Mach number, so engineers often use the **[[modified Newtonian|modified-newtonian]]** form $C_p = C_{p,\max}\sin^2\theta$ with $C_{p,\max} \approx 1.84$. The shape of the rule — $\sin^2\theta$ — is the same.

::: example Newtonian drag coefficient of a sphere
Add up the Newtonian pressure over the front half of a sphere of radius $R$.

**Set up the angle.** Measure position on the sphere by the angle $\phi$ ("phi") from the stagnation point, the nose. At the nose $\phi = 0$ and the surface faces the flow squarely; at the rim, $\phi = 90^\circ$, it is edge-on. So the incidence angle is $\theta = 90^\circ - \phi$, and $\sin\theta = \cos\phi$. The pressure coefficient is $C_p = 2\cos^2\phi$.

**Cut the sphere into rings.** A thin ring at angle $\phi$ has radius $R\sin\phi$ and width $R\,d\phi$, so its area is $dA = 2\pi R^2\sin\phi\,d\phi$.

**Keep only the backward push.** Pressure pushes square to the surface. Only the part along the flow counts as drag, which brings in one more factor of $\cos\phi$. (The sideways parts cancel around the ring.)

**Divide by the reference area.** Drag coefficients use the frontal area, the shadow the sphere casts: $\pi R^2$. Putting it together,

$$
C_D = \frac{1}{\pi R^2}\int_0^{\pi/2} 2\cos^2\phi\cdot\cos\phi\cdot 2\pi R^2\sin\phi\,d\phi
= 4\int_0^{\pi/2}\cos^3\phi\,\sin\phi\,d\phi.
$$

**Do the integral.** Substitute $u = \cos\phi$, so $du = -\sin\phi\,d\phi$, and the limits $\phi = 0 \to \pi/2$ become $u = 1 \to 0$. Flipping the limits absorbs the minus sign:

$$
\int_0^{\pi/2}\cos^3\phi\,\sin\phi\,d\phi = \int_0^1 u^3\,du = \frac{1}{4}.
$$

So $C_D = 4 \times \tfrac{1}{4} = 1.0$ exactly. Note that $R$ cancelled: a big sphere and a small one have the same $C_D$.

**Compare with reality.** Measured hypersonic drag coefficients for spheres come out close to this, about $0.92$. That is exactly what the modified Newtonian form predicts: $C_D = C_{p,\max}/2 = 1.84/2 = 0.92$. So pure Newtonian theory slightly *over*-estimates a sphere.

Real capsules measure higher, typically around $1.3$ to $1.7$ depending on shape. The reason is not the sphere's physics being wrong but the shape: a capsule's heat shield is much **[[flatter than a hemisphere|flat-shield]]**, so more of its face meets the flow nearly square-on, where $C_p$ is largest.

What about the shadowed back, which the model sets to $C_p = 0$ (the undisturbed pressure)? The real base pressure is *lower* than that, which pulls backward and adds drag. But at hypersonic speed the largest possible addition — a perfect vacuum behind the vehicle — is only $2/(\gamma M^2)$, where $\gamma = 1.4$ for air and $M$ is the Mach number. At Mach $25$ that is $2/(1.4 \times 625) = 0.0023$. Negligible. The windward face is where the drag lives.
:::

## The Mach independence principle

Look again at $C_p = 2\sin^2\theta$. The Mach number is nowhere in it. It depends only on how the surface is tilted.

So once the flow is fast enough for the Newtonian picture to hold — a common rule of thumb is above about Mach $5$ — the pressure coefficient, and therefore $C_D$ and $C_L$, stop changing with speed. This is the **Mach independence principle**.

You can see it in the modified Newtonian peak value too. Shock theory for air gives the stagnation-point $C_{p,\max}$ as $1.809$ at Mach $5$, $1.832$ at Mach $10$, and $1.838$ at Mach $25$. From Mach $5$ to Mach $25$ — five times the speed — it changes by about $1.6\%$.

This is the physical reason this module could treat $\beta$ as one constant across the whole hypersonic part of every trajectory. From entry interface at Mach $25$–$30$ down to about Mach $5$–$6$, the drag coefficient really does not change enough to matter. The peak-deceleration and peak-heating formulas of lessons 2 through 4 are built on exactly that.

::: key Mach independence
Above roughly Mach $5$, aerodynamic force coefficients ($C_D$, $C_L$) are essentially constant with further increases in Mach number, because the Newtonian $C_p = 2\sin^2\theta$ depends on surface geometry alone. This is what justifies a single constant $\beta$ and $L/D$ through the hypersonic part of an entry.
:::

::: warning Mach independence is a hypersonic-regime result, not a universal one
$C_p = 2\sin^2\theta$ says nothing about how the pressure coefficient depends on Mach number at supersonic or transonic speeds. There, compressibility effects that the Newtonian model ignores completely are in charge. The principle's value is that it tells you where it is safe to ignore Mach number — high hypersonic. By construction it cannot tell you anything about the regime where Mach number matters most.
:::

::: example What a 40 percent drag-coefficient error costs
Suppose a vehicle's true hypersonic $C_D$ is $1.4$, but a design estimate — say, the pure Newtonian sphere value from the example above — assumed $C_D = 1.0$. The true value is $40\%$ higher.

**Step 1, the ballistic coefficient.** Since $\beta = m/(C_D A)$, with the same mass and area,

$$
\frac{\beta_{\text{real}}}{\beta_{\text{estimate}}} = \frac{C_{D,\text{estimate}}}{C_{D,\text{real}}} = \frac{1.0}{1.4} = 0.714.
$$

The real $\beta$ is $1 - 0.714 = 28.6\%$ lower than the design assumed.

**Step 2, the peak altitude.** From lesson 2, the altitude of peak deceleration is $h^* = H\ln\!\left(\rho_0 H/(\beta|\sin\gamma_E|)\right)$. Everything inside stays the same except $\beta$, so the change is

$$
\Delta h^* = H\ln\frac{\beta_{\text{estimate}}}{\beta_{\text{real}}} = 7200\ln(1.4) = 7200 \times 0.3365 = 2423\ \mathrm{m}.
$$

The real vehicle peaks about $2.4\ \mathrm{km}$ *higher* than predicted, in a different thermal environment.

**Step 3, what does not move.** The peak deceleration itself, $a_{\max} = v_E^2|\sin\gamma_E|/(2eH)$, has no $\beta$ in it, so it is unchanged. But every $\beta$-dependent number in this module moves: peak altitude, peak heating rate, downrange, duration, impact speed.

Sanity check on the direction: more drag means the vehicle slows sooner, in thinner air, so higher. That matches.

Getting $C_D$ right is not a cosmetic concern.
:::

## Where it breaks: the transonic transition

Mach independence holds because the shock stays thin and keeps the same shape across the hypersonic and most of the supersonic range. As the vehicle slows toward Mach $1$, that pattern falls apart.

Through the **transonic** band — roughly Mach $0.8$ to $1.2$, the same band t1_m18 identified for a grid fin's drag rise — the flow around a blunt body is part supersonic and part subsonic at once. Pockets of supersonic flow sit inside an otherwise subsonic flow field, appearing and vanishing as the speed drops. Shock waves move and weaken. The drag coefficient typically *rises* toward a local peak near Mach $1$, then settles to a lower, roughly constant subsonic value once the flow is fully subsonic.

A single constant $C_D$ — and with it a single constant $\beta$ — is the wrong model here. This is exactly the regime the Newtonian derivation excluded.

The consequence is more than an awkward drag coefficient. Blunt capsules can become **unstable** at transonic and low-supersonic speeds. As the shock pattern reorganizes, the **center of pressure** — the point where the total air force effectively acts — can shift enough to shrink, or even reverse, the vehicle's static margin (t1_m18). The capsule can also start to wobble in pitch, with each swing a little larger than the last. A capsule perfectly stable heat-shield-first at hypersonic speed is not guaranteed to stay that way through this band. That is why real capsules carry thrusters or a **[[drogue parachute|drogue]]** sized with this transition in mind, instead of carrying the hypersonic aerodynamic data straight over.

::: key The transonic transition
Roughly Mach $0.8$–$1.2$: shock structure reorganises, drag coefficient rises toward a local peak near Mach $1$ before falling to its subsonic value, and centre-of-pressure shifts can destabilise a shape that was perfectly stable hypersonically. The constant-$\beta$, constant-$L/D$ assumption behind every earlier lesson in this module is valid above this band and must be replaced by Mach-dependent aerodynamic data within and below it.
:::

### Timing the terminal events

This is also why the timing of the late events matters so much. A parachute is tested and qualified for a range of Mach number and dynamic pressure. Open a supersonic parachute too early and it meets a flow it was never qualified for. And a vehicle still inside the transonic instability band cannot be counted on to hold the attitude a parachute mortar or a propulsive phase needs.

So a parachute trigger has to land the deployment inside that qualified window on every flight, not only the nominal one. Altitude and elapsed time both shift from flight to flight with atmospheric and trajectory dispersions (lesson 5). On Mars, where the air is so thin that the window is narrow, landers open their supersonic parachutes on the onboard estimate of speed, so the chute opens at the **[[Mach number it was qualified for|mars-trigger]]**. Lesson 13 makes this concrete. On Earth, capsules usually open their drogues on a barometric altitude switch, because by that altitude Earth's thick air has already slowed them to well below the speed of sound — the Mach window is guaranteed by the altitude.

## Check yourself

::: check
Derive the Newtonian pressure coefficient $C_p = 2\sin^2\theta$ from the momentum-flux argument, and state the model's central assumption.
:::

::: answer
The model treats the flow as independent particles that lose all their momentum normal to a surface on impact, while sliding freely along it. Its central assumption is that the shock layer is infinitely thin, so the free stream strikes the surface directly.

A surface at local incidence $\theta$ receives a mass flux of $\rho v\sin\theta$ per unit area. Each unit of mass loses normal momentum $v\sin\theta$. The pressure is the rate of momentum loss per area: $\Delta p = (\rho v\sin\theta)(v\sin\theta) = \rho v^2\sin^2\theta$. Dividing by the dynamic pressure $\tfrac12\rho v^2$ gives $C_p = 2\sin^2\theta$.
:::

::: check
The pure Newtonian calculation gives $C_D = 1.0$ for a sphere, while real capsules measure around $1.3$–$1.5$. What explains the gap — and is it the model's treatment of the shadowed base?
:::

::: answer
Mostly it is shape. A capsule's heat shield is much flatter than a hemisphere, so more of its face meets the flow nearly square-on, where $C_p$ is largest. Newtonian theory itself shows this: a flat face gives $C_D = 2$, and a shallow spherical cap like Apollo's gives about $1.8$ (about $1.7$ with the modified $C_{p,\max} = 1.84$). Real capsules come out lower than that because they fly tilted and the flow does not follow the ideal model exactly.

It is not the base. Newtonian theory sets the shadowed base to $C_p = 0$, the undisturbed pressure. The real base pressure is a bit lower, which does add drag, but at hypersonic speed the most it can add is $2/(\gamma M^2)$, about $0.002$ at Mach $25$. For a sphere, in fact, real measurements (about $0.92$) come in slightly *below* the Newtonian $1.0$, because the true stagnation pressure coefficient is about $1.84$, not $2$.
:::

::: check
State the Mach independence principle, and explain from the form of $C_p = 2\sin^2\theta$ why it follows from Newtonian theory instead of being an extra assumption.
:::

::: answer
The Mach independence principle says that above roughly Mach $5$, aerodynamic force coefficients (drag, lift) become essentially constant as Mach number increases further.

It follows at once from $C_p = 2\sin^2\theta$, which contains no Mach number — only the local surface angle. $C_D$ and $C_L$ are built by adding up $C_p$ over the surface. If $C_p$ does not depend on Mach number, neither can anything built from it. Mach independence is not an extra assumption; it is what the model already says once you accept it.
:::

::: check
Why does the constant-$\beta$ assumption fail specifically in the transonic band, instead of failing gradually across the whole supersonic-to-subsonic range?
:::

::: answer
Mach independence relies on the shock layer staying thin, stable and the same shape over a wide hypersonic-to-supersonic range, which is why $C_D$ stays nearly constant there.

Near Mach $1$ the flow around a blunt body changes character. Pockets of supersonic flow inside an otherwise subsonic field appear and vanish as speed changes, and the shock pattern no longer keeps its shape. So $C_D$ becomes strongly, not gradually, Mach-dependent exactly in this band: it rises toward a local peak, then settles to a different, roughly constant subsonic value once the reorganization is complete.
:::

::: check
Why is a Mars lander's supersonic parachute triggered from the vehicle's estimated speed rather than from a fixed altitude or a fixed time since entry?
:::

::: answer
The parachute is only qualified for a window of Mach number and dynamic pressure, and the speed is what decides which flow regime it will open into — including whether the vehicle is past the transonic instability band and holding a stable attitude.

Altitude and elapsed time both vary from flight to flight with atmospheric density and trajectory dispersions (lesson 5). A fixed altitude or time trigger could therefore open the chute in the wrong flow regime on an off-nominal flight. A speed-based trigger tracks the actual aerodynamic state directly, at the cost of needing a reliable in-flight estimate of velocity (and, for Mach number, of the local speed of sound). On Earth the thick air makes altitude a safe proxy for late, subsonic events, which is why capsule drogues there often use a barometric switch.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $C_p = 2\sin^2\theta$ | Newtonian impact pressure coefficient; $\theta$ = local flow-incidence angle; no Mach dependence |
| $C_{p,\max} \approx 1.84$ | Modified Newtonian stagnation value for air at high Mach ($1.809$ at Mach $5$, $1.838$ at Mach $25$) |
| $C_D = 1.0$ (Newtonian sphere) | Windward-hemisphere estimate; real sphere about $0.92$; real capsules about $1.3$–$1.7$ because their shields are flatter; base pressure adds at most $2/(\gamma M^2)$ |
| Mach independence principle | Above roughly Mach $5$, $C_D$ and $C_L$ are essentially constant — the basis for treating $\beta$ as fixed throughout lessons 2–8 |
| $40\%$ $C_D$ error example | $\beta$ $28.6\%$ lower; peak-altitude prediction off by $H\ln(1.4) = 2.42\ \mathrm{km}$; peak-$g$ magnitude unaffected |
| Transonic transition | Roughly Mach $0.8$–$1.2$: $C_D$ rises toward a local peak near Mach $1$, shock structure reorganises, centre of pressure can shift and destabilise the vehicle |
| Terminal-event triggers | Must land inside the parachute's qualified Mach window; Mars uses onboard speed, Earth capsules often a barometric altitude switch once safely subsonic |

The next lesson leaves pure aerodynamic deceleration behind and opens the propulsive part of descent: the entry burn, the aerodynamically guided phase that lessons 6 through 9 have covered, and the landing burn that brings the vehicle the rest of the way to the ground under thrust.

::: context mach-number How fast is Mach 28?
The **Mach number** is speed divided by the local speed of sound. The speed of sound depends on air temperature: about $340\ \mathrm{m/s}$ at sea level on a mild day, and about $280\ \mathrm{m/s}$ in the cold air near $80\ \mathrm{km}$ altitude. A capsule returning from low orbit at $7.8\ \mathrm{km/s}$ is therefore flying at around Mach $28$ up there. The name honors Ernst Mach, a 19th-century Austrian physicist who photographed shock waves around bullets. Above about Mach $5$, flow is called **hypersonic**.
:::

::: context shock-layer The thin layer in front of the heat shield
Air ahead of a hypersonic vehicle cannot "hear" it coming — the vehicle outruns sound — so the air is hit all at once. It is squeezed and heated almost instantly across a **shock wave**, a sheet a few molecules thick that stands just ahead of the vehicle. Between the shock and the heat shield is the **shock layer**. The faster the vehicle, the closer the shock hugs the body, which is what makes the sandblaster picture work.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M236,30 A150,150 0 0,0 236,170" fill="none" stroke="#1f2a44" stroke-width="3"/>
  <line x1="236" y1="30" x2="316" y2="75" stroke="#1f2a44" stroke-width="2"/>
  <line x1="236" y1="170" x2="316" y2="125" stroke="#1f2a44" stroke-width="2"/>
  <line x1="316" y1="75" x2="316" y2="125" stroke="#1f2a44" stroke-width="2"/>
  <path d="M250,6 Q150,100 250,194" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="20" y1="60" x2="198" y2="60"/>
    <line x1="20" y1="100" x2="190" y2="100"/>
    <line x1="20" y1="140" x2="198" y2="140"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="110,56 120,60 110,64"/>
    <polygon points="110,96 120,100 110,104"/>
    <polygon points="110,136 120,140 110,144"/>
  </g>
  <text x="26" y="48" font-size="12" fill="#1d6fd1">air, Mach 25</text>
  <text x="150" y="24" font-size="12" fill="#b4232c">bow shock</text>
  <text x="228" y="104" font-size="11" fill="#1f2a44">heat</text>
  <text x="228" y="118" font-size="11" fill="#1f2a44">shield</text>
  <text x="20" y="190" font-size="11" fill="#6c7a93">thin shock layer between them</text>
</svg>
```

Drawn thicker than it is, so you can see it.
:::

::: context newton-origin Newton's idea, a few centuries early
Isaac Newton proposed this particle model of air resistance in the *Principia* in 1687. For the slow flows of his day it was poor: real air flows smoothly around objects instead of striking them like shot, and his model got the forces badly wrong. The idea sat mostly unused for centuries, until engineers in the 1950s working on missile nose cones and entry vehicles found that at hypersonic speed, air really does behave much the way Newton imagined.
:::

::: context incidence-picture Hitting a tilted plate
Flow arrives from the left and meets a plate tilted at $\theta = 30^\circ$. Only the speed component into the plate, $v\sin\theta = 0.5\,v$, is lost on impact. The component along the plate, $v\cos\theta = 0.87\,v$, is kept, so the air slides off.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="120" y1="170" x2="293.2" y2="70" stroke="#1f2a44" stroke-width="4"/>
  <line x1="40" y1="170" x2="330" y2="170" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M160,170 A40,40 0 0,0 154.6,150" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="166" y="160" font-size="12" fill="#1f2a44">θ</text>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="30" y1="150" x2="152" y2="150"/>
    <line x1="30" y1="120" x2="204" y2="120"/>
    <line x1="30" y1="90" x2="256" y2="90"/>
  </g>
  <g fill="#1d6fd1">
    <polygon points="146,146 154.6,150 146,154"/>
    <polygon points="198,116 206.6,120 198,124"/>
    <polygon points="250,86 258.6,90 250,94"/>
  </g>
  <line x1="206.6" y1="120" x2="274.1" y2="81.0" stroke="#f2b880" stroke-width="3"/>
  <polygon points="274.1,81.0 262.5,83.4 267.0,91.2" fill="#f2b880"/>
  <text x="36" y="112" font-size="12" fill="#1d6fd1">flow, speed v</text>
  <text x="236" y="62" font-size="11" fill="#1f2a44">slides off: v cos θ</text>
  <text x="226" y="150" font-size="11" fill="#b4232c">lost: v sin θ</text>
</svg>
```
:::

::: context pressure-coefficient Why divide by dynamic pressure?
Dividing a pressure by $\tfrac{1}{2}\rho v^2$ strips out how fast and how dense the flow is, and leaves a number that depends on the shape and angle alone. That is what lets a wind-tunnel model at one speed tell you the pressure on a full-size vehicle at another. The same trick makes $C_D$ and $C_L$: drag is $C_D \cdot \tfrac{1}{2}\rho v^2 \cdot A$, so $C_D$ is the drag with the speed, density and size divided out.
:::

::: context modified-newtonian Lees' fix to Newton
In 1955 the aerodynamicist Lester Lees suggested keeping Newton's $\sin^2\theta$ shape but replacing the $2$ with the true stagnation-point value $C_{p,\max}$, found from shock-wave theory. For air at very high Mach number that value is about $1.84$. This "modified Newtonian" rule predicts the pressure on blunt noses and heat shields remarkably well, and it is still the first estimate engineers make for a new entry shape, long before a wind-tunnel test or a detailed computer simulation.
:::

::: context flat-shield Why a flatter shield has more drag
Repeat the sphere calculation, but stop the integral at the rim of a shallow spherical cap, where $\phi$ reaches only $\phi_c$. The result is $C_D = 1 + \cos^2\phi_c$. A full hemisphere ($\phi_c = 90^\circ$) gives $1$; a flat disk ($\phi_c \to 0$) gives $2$. Apollo's shield had a sphere radius about $1.2$ times its diameter, so $\sin\phi_c = 0.5/1.2$ and $C_D = 1.83$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <path d="M120,40 A60,60 0 0,0 120,160" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="120" y1="40" x2="120" y2="160" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M280,40 A144,144 0 0,0 280,160" fill="#f2b880" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="280" y1="40" x2="280" y2="160" stroke="#b4232c" stroke-width="2"/>
  <g stroke="#6c7a93" stroke-width="1.2">
    <line x1="10" y1="80" x2="44" y2="80"/>
    <line x1="10" y1="120" x2="44" y2="120"/>
  </g>
  <text x="10" y="70" font-size="11" fill="#6c7a93">flow</text>
  <text x="90" y="182" font-size="12" fill="#1d6fd1">C_D = 1.00</text>
  <text x="236" y="182" font-size="12" fill="#b4232c">C_D = 1.83</text>
  <text x="70" y="26" font-size="11" fill="#1f2a44">hemisphere</text>
  <text x="212" y="26" font-size="11" fill="#1f2a44">Apollo-like cap</text>
</svg>
```

Both shapes have the same diameter. The cap bulges only about a tenth of its diameter.
:::

::: context drogue What a drogue does
A **drogue** is a small parachute opened before the main ones, while the capsule is still fast. Its first job is not to slow the capsule much but to hold it steady, pointing the right way, like the tail of a kite. Apollo opened two drogues at about $7.3\ \mathrm{km}$ ($24{,}000$ feet) to steady and slow the capsule, then pulled out the three main parachutes lower down. Without that step, a capsule wobbling in the low-speed air could tangle or overload its mains.
:::

::: context mars-trigger How Mars landers decide when to open
Mars parachutes open supersonically, around Mach $1.7$–$2.1$, and are tested for a narrow window of speed and dynamic pressure. Curiosity (2012) opened its chute when its navigated speed fell to a set value. Perseverance (2021) went a step further with a "range trigger": within the allowed speed window, it chose the moment to open based on how far it still was from the target, which shrank its landing ellipse further.
:::
