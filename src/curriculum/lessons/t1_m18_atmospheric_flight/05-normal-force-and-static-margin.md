---
id: l05-normal-force-and-static-margin
title: Normal force, centre of pressure and static margin
minutes: 17
covers:
  - normal force, centre of pressure vs centre of gravity, static margin
---

Once a vehicle flies at an angle of attack, the air pushes on it sideways. The size of that push — the normal force — is what bends the airframe. Where it pushes, relative to where the vehicle's mass is concentrated, decides something else entirely: whether the vehicle wants to straighten out or to tumble. A model rocket with fins straightens out. A launch vehicle does not. The distance between the point where the normal force acts and the centre of mass, measured in body diameters, is the static margin, and its sign is the first thing a control engineer asks about any flying body.

This lesson derives the normal force on a slender body from first principles, defines the centre of pressure and shows how to compute it, then defines the static margin and the aerodynamic moment it produces. It closes with the reason every orbital launch vehicle is statically unstable in pitch and yaw — the geometry of a long, finless cylinder with a wide fairing at the front and heavy tanks and engines at the back — which is the fact the rest of this module is built around.

## The normal force

In body axes the aerodynamic force perpendicular to the longitudinal axis is the **normal force**, written like every aerodynamic force as dynamic pressure times reference area times a coefficient:

$$
N = \bar{q}\, S\, C_N(\alpha, M).
$$

For the small angles of attack of ascent, $C_N$ is proportional to $\alpha$, and the constant of proportionality is the **normal-force slope**

$$
C_N \approx C_{N\alpha}\,\alpha, \qquad N = \bar{q}\, S\, C_{N\alpha}\,\alpha ,
$$

with $\alpha$ in radians and $C_{N\alpha}$ in "per radian". The sign convention from the last lesson applies: for $\alpha > 0$ the normal force acts toward the side the nose is tilted, relative to the relative wind — it is the air, deflected by the inclined body, pushing back.

Slender-body theory tells you where this force comes from. Imagine the body moving through still air at speed $V$ with angle of attack $\alpha$; equivalently, each cross-sectional slab of air, as the body passes through it, is shoved sideways at speed $V\alpha$. A circular section of area $S(x)$ drags along an **apparent mass** of air equal to $\rho S(x)$ per unit length, so the lateral momentum per unit length imparted to the air is $\rho S(x)\, V\alpha$. In the body's frame the air streams past at $V$, so the rate at which this momentum changes along the body is $V\,d[\rho S V\alpha]/dx$, and by Newton's third law the force per unit length on the body is

$$
\frac{dN}{dx} = \rho V^2 \alpha\, \frac{dS}{dx} = 2\bar{q}\,\alpha\, \frac{dS}{dx}.
$$

Only where the cross-section *changes* is there normal force. The nose cone, where $S$ grows from zero to the base area, produces $N = 2\bar{q}\alpha S_{\text{base}}$; the constant-diameter cylinder produces nothing in this theory; a boat-tail, where $S$ shrinks, produces a *negative* contribution. Integrating over a plain cone-cylinder gives the classic slender-body result

$$
C_{N\alpha} = 2\ \text{per radian},
$$

referenced to the base area. Real bodies do better than this, because the cylinder's cross-flow separates and generates a viscous lift that grows as $\alpha^2$, and because the fairing shoulder, interstage flares and protuberances all count as area changes. Launch vehicles typically show $C_{N\alpha}$ of 2 to 4 per radian based on the core cross-section, rising through the transonic range and falling supersonically. Per degree that is $0.035$ to $0.07$: at a dynamic pressure of 31.3 kPa on a 10.52 m² core, every degree of angle of attack is 11 to 23 kN of side load.

::: example Normal force in the max-Q window
At a representative point in the max-Q window, $\bar{q} = 31.3\ \mathrm{kPa}$, $S = 10.52\ \mathrm{m^2}$ and the vehicle's database gives $C_{N\alpha} = 4.0$ per radian. The normal force at $\alpha = 2^\circ = 0.0349\ \mathrm{rad}$ is

$$
N = 31\,300 \times 10.52 \times 4.0 \times 0.0349 = 4.60 \times 10^4\ \mathrm{N} = 46\ \mathrm{kN},
$$

and the normal-force derivative is $N_\alpha = \bar{q} S C_{N\alpha} = 1.32\ \mathrm{MN}$ per radian, or 23.0 kN per degree. With the bare slender-body value $C_{N\alpha} = 2$, the numbers halve: 23 kN at $2^\circ$. The difference between 2 and 4 is the difference between an idealised cone-cylinder and a real vehicle with a flared fairing and separated cross-flow, and it is measured, not derived.
:::

## The centre of pressure

The normal force is distributed along the body. Its resultant acts at the **centre of pressure**, the point about which the distributed load produces no net moment:

$$
x_{cp} = \frac{\int x\, \dfrac{dN}{dx}\, dx}{\int \dfrac{dN}{dx}\, dx},
$$

with $x$ measured from the nose tip, positive aft. For a cone of length $L_n$, the area grows as $x^2$ so $dS/dx \propto x$, and

$$
x_{cp} = \frac{\int_0^{L_n} x \cdot x\, dx}{\int_0^{L_n} x\, dx} = \frac{L_n^3/3}{L_n^2/2} = \tfrac{2}{3} L_n .
$$

The normal force of a cone-cylinder therefore acts two-thirds of the way down the nose cone — very near the front of the vehicle. Adding aft features moves it back: fins on a model rocket or a missile put a large $dN/dx$ near the tail and pull $x_{cp}$ toward the rear; a flared interstage does the same in a smaller way. Adding a boat-tail behind a wide fairing does the opposite.

::: example A fairing and its boat-tail
A 70 m vehicle has a 3.66 m core ($S_c = 10.52\ \mathrm{m^2}$) and a 5.2 m payload fairing ($S_f = 21.24\ \mathrm{m^2}$) with a 6 m nose cone, a cylindrical section to 13 m, then a boat-tail down to the core diameter centred at 14 m. In slender-body theory each area change contributes $2\bar{q}\alpha\,\Delta S$ at its own location: the nose contributes $+21.24$ (in units of $2\bar{q}\alpha$) acting at $\tfrac{2}{3} \times 6 = 4\ \mathrm{m}$, and the boat-tail contributes $-(21.24 - 10.52) = -10.72$ at 14 m. The net force is $+10.52$, the core area as expected, and the moment about the nose tip is $21.24 \times 4 - 10.72 \times 14 = 85.0 - 150.1 = -65.1$. The centre of pressure is at

$$
x_{cp} = \frac{-65.1}{10.52} = -6.2\ \mathrm{m},
$$

*ahead of the nose*. The idealised theory says the fairing-plus-boat-tail acts almost as a pure destabilising couple: a large forward force and a large rearward force in opposite directions, with a small net. Viscous cross-flow on the long cylinder pulls the real centre of pressure back to within the body, typically a quarter to a third of the length from the nose at small $\alpha$, but the lesson stands — a wide fairing on a narrow core is strongly destabilising.
:::

The centre of pressure is not fixed. It moves with Mach number, shifting noticeably through the transonic band as the shock pattern rearranges the pressure distribution, and it moves aft with increasing angle of attack as the cross-flow lift on the cylinder grows. The wind-tunnel database therefore tabulates $x_{cp}(M, \alpha)$ alongside $C_N(M, \alpha)$.

## Centre of gravity, static margin and the aerodynamic moment

The **centre of gravity** $x_{cg}$ is where the mass is. For a fully fuelled two-stage launcher most of the mass is propellant in the first-stage tanks, which occupy the aft half or more of the vehicle, with the engines at the very back: at lift-off the centre of gravity typically sits 55 to 70 % of the length from the nose. It moves during the burn as propellant drains, in a direction that depends on which tank is forward.

The normal force acting at $x_{cp}$ produces a moment about the centre of gravity. Take the moment positive in the direction that increases $\alpha$ (nose rotating further away from the relative wind). A normal force $N$ acting a distance $x_{cg} - x_{cp}$ *forward* of the centre of gravity rotates the nose in exactly that direction, so

$$
M_{cg} = N\,(x_{cg} - x_{cp}).
$$

Non-dimensionalise the lever arm by the body diameter $d$ to define the **static margin**

$$
SM = \frac{x_{cp} - x_{cg}}{d},
$$

measured in **calibres** (diameters). Then $M_{cg} = -N\, d\, SM$, and with $N = N_\alpha \alpha$,

$$
M_\alpha \equiv \frac{\partial M_{cg}}{\partial \alpha} = -\,\bar{q}\, S\, d\, C_{N\alpha}\, SM, \qquad
C_{m\alpha} = -C_{N\alpha}\, SM .
$$

If $SM > 0$ — centre of pressure aft of the centre of gravity — the moment opposes any angle of attack: disturb the body and the aerodynamic moment turns it back toward the wind. That is **static stability**, the weathervane. If $SM < 0$ the moment has the same sign as $\alpha$ and grows with it: disturb the body and the air pushes it further. That is **static instability**.

::: key
Static margin: $SM = (x_{cp} - x_{cg})/d$ in calibres, with $x$ measured from the nose. Positive — centre of pressure aft of the centre of mass — is statically stable, because a disturbance produces a restoring moment. The pitching-moment slope is $C_{m\alpha} = -C_{N\alpha}\,SM$.
:::

::: example Model rocket versus booster
A model rocket has its centre of pressure (fins included, from a Barrowman-style calculation) 0.62 m from the nose, its centre of gravity 0.55 m from the nose, and a diameter of 5 cm: $SM = (0.62 - 0.55)/0.05 = +1.4$ calibres, comfortably stable — the hobbyist's rule of thumb is one to two calibres. Hold it at an angle in a breeze and it swings nose-into-wind.

The 70 m booster of the previous example has, from its wind-tunnel data, a centre of pressure 18 m from the nose at Mach 1.5 and small $\alpha$, and a centre of gravity 44 m from the nose in the max-Q window: $SM = (18 - 44)/3.66 = -7.1$ calibres. Its moment slope at $\bar{q} = 31.3\ \mathrm{kPa}$, $C_{N\alpha} = 4$ is

$$
M_\alpha = N_\alpha (x_{cg} - x_{cp}) = 1.317 \times 10^6 \times 26 = 3.42 \times 10^7\ \mathrm{N\cdot m}\ \text{per radian},
$$

so at $\alpha = 2^\circ$ the aerodynamic moment is $3.42 \times 10^7 \times 0.0349 = 1.19\ \mathrm{MN\cdot m}$, pushing the nose further from the wind. To hold trim the engines must produce the opposite moment. With 7.6 MN of thrust gimballed about a point 26 m aft of the centre of gravity, each degree of gimbal gives $7.6 \times 10^6 \times 26 \times 0.01745 = 3.45\ \mathrm{MN\cdot m}$, so trimming $2^\circ$ of angle of attack costs $0.35^\circ$ of gimbal. Authority is not the problem; the problem is that nothing holds the vehicle straight unless the gimbal is commanded to.
:::

## Why a launch vehicle is unstable

Put the pieces together. The normal force on a finless slender body is generated where the cross-section changes, which is at the nose and the fairing shoulder — the front. The mass is concentrated where the propellant and engines are — the back. So $x_{cp}$ is forward, $x_{cg}$ is aft, $SM$ is negative by several calibres, and any angle of attack produces a moment that increases the angle of attack. The vehicle is statically unstable in pitch, and by symmetry in yaw.

Fins would fix this, as they fix a model rocket, but at a price: they add mass and drag, they are useless above 40 km where the vehicle still needs control, and a fin large enough to stabilise a 70 m vehicle with a 5 m fairing at max-Q would be enormous. The Saturn V carried small fins on its first stage not to make it stable but to slow the divergence enough for a crew to escape after a control failure. Every modern orbital launcher instead accepts the instability and stabilises it actively with thrust vector control, which works at every altitude and costs no drag. The consequence — a control loop that can never be allowed to open while $\bar{q}$ is significant — is the subject of the next lesson.

::: key
A boosting launch vehicle is statically unstable in pitch because it is a slender body with its centre of pressure well forward (near the nose and payload fairing) and its centre of mass far aft over the full tanks and engines, and it carries no tail fins. Any $\alpha$ produces a moment that increases $\alpha$, so the TVC loop must actively stabilise it.
:::

::: warning
Static margin has a sign convention hidden in the direction of $x$. With $x$ measured from the nose, $SM = (x_{cp} - x_{cg})/d$ is positive when stable. Some references measure from the base or define the margin with the opposite subtraction; check before comparing numbers, and remember that the physics — the centre of pressure must be behind the centre of gravity for stability — does not depend on anyone's convention.
:::

::: warning
Both $x_{cp}$ and $x_{cg}$ move during flight — the first with Mach number and angle of attack, the second with propellant depletion. The static margin at lift-off, at max-Q and at staging can differ by a calibre or more, and the aerodynamic moment slope $M_\alpha$ scales with $\bar{q}$ on top of that. A single number for a vehicle is a snapshot.
:::

## Check yourself

::: check
A vehicle at $\bar{q} = 25\ \mathrm{kPa}$ has $S = 4.9\ \mathrm{m^2}$ and $C_{N\alpha} = 3.0$ per radian. What is the normal force at $\alpha = 3^\circ$, and what is $N_\alpha$ in kN per degree?
:::

::: answer
$N_\alpha = \bar{q} S C_{N\alpha} = 25\,000 \times 4.9 \times 3.0 = 3.68 \times 10^5\ \mathrm{N}$ per radian, which is $3.68 \times 10^5 \times 0.01745 = 6.41\ \mathrm{kN}$ per degree. At $3^\circ$ the normal force is $N = 6.41 \times 3 = 19.2\ \mathrm{kN}$.
:::

::: check
Using slender-body theory, where is the centre of pressure of a 4 m cone followed by a 30 m cylinder of constant diameter, and what is its $C_{N\alpha}$? Why do real measurements put the centre of pressure further aft?
:::

::: answer
Only the cone changes cross-section, so all the theoretical normal force comes from it, acting at $\tfrac{2}{3} \times 4 = 2.67\ \mathrm{m}$ from the tip, with $C_{N\alpha} = 2$ per radian based on the base area. Real measurements include viscous cross-flow lift on the 30 m cylinder, which acts roughly at the cylinder's midpoint (about 19 m from the tip) and grows with $\alpha$; it adds to $C_{N\alpha}$ and pulls the combined centre of pressure aft, increasingly so at larger angles of attack.
:::

::: check
A vehicle has $x_{cp} = 12\ \mathrm{m}$, $x_{cg} = 27\ \mathrm{m}$ from the nose and $d = 3\ \mathrm{m}$. Compute the static margin and $C_{m\alpha}$ if $C_{N\alpha} = 3.5$ per radian. Is it stable?
:::

::: answer
$SM = (12 - 27)/3 = -5.0$ calibres, so $C_{m\alpha} = -C_{N\alpha} SM = -3.5 \times (-5.0) = +17.5$ per radian. The positive moment slope means the aerodynamic moment grows in the same direction as $\alpha$: statically unstable. Per degree of angle of attack the moment coefficient is $17.5 \times 0.01745 = 0.305$, referenced to $\bar{q} S d$.
:::

::: check
Propellant burns from a forward tank first, moving the centre of gravity aft by 3 m while the centre of pressure stays fixed. For the booster of the worked example ($x_{cp} = 18$, $x_{cg} = 44$, $d = 3.66$), how does the static margin change, and what happens to the destabilising moment at a given $\bar{q}$ and $\alpha$?
:::

::: answer
The centre of gravity moves from 44 to 47 m, so $SM$ goes from $-7.1$ to $(18 - 47)/3.66 = -7.9$ calibres: more unstable. The lever arm $x_{cg} - x_{cp}$ grows from 26 to 29 m, so the destabilising moment $N (x_{cg} - x_{cp})$ at fixed $\bar{q}$ and $\alpha$ grows by 29/26, about 12 %. Whether the vehicle's unstable *dynamics* get faster depends also on how the inertia changes, which is the next lesson's business.
:::

::: check
Why are fins the wrong fix for a launch vehicle's instability, when they are exactly the right fix for a model rocket?
:::

::: answer
Fins work by generating normal force far aft, moving the centre of pressure behind the centre of gravity. On a model rocket that costs little mass or drag and the rocket flies entirely in dense air. A launch vehicle would need very large fins to overcome the destabilising couple of a wide fairing on a 70 m body, paying in mass and drag through the whole ascent; the fins would lose effectiveness as $\bar{q}$ collapses above 40 km while the vehicle still needs attitude control for another six minutes; and thrust vector control, which the vehicle must carry anyway for steering, stabilises it at every altitude at no aerodynamic cost. The Saturn V's small fins were an abort aid, not a stability fix.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $N = \bar{q} S C_{N\alpha}\alpha$ | normal force; $N_\alpha = \bar{q} S C_{N\alpha}$ per radian |
| $dN/dx = 2\bar{q}\alpha\, dS/dx$ | slender-body theory: force only where the cross-section changes |
| $C_{N\alpha} = 2$ per rad | cone-cylinder ideal; real launchers 2–4 per rad on core area |
| $x_{cp}$ | centre of pressure; $\tfrac{2}{3}L_n$ for a cone; moves with $M$ and $\alpha$ |
| $x_{cg}$ | centre of gravity; 55–70 % of length from the nose at lift-off |
| $SM = (x_{cp} - x_{cg})/d$ | static margin in calibres; positive is stable |
| $M_{cg} = N(x_{cg} - x_{cp}) = -N d\, SM$ | aerodynamic pitching moment about the cg |
| $C_{m\alpha} = -C_{N\alpha} SM$ | moment slope; positive means unstable |
| Launch vehicle | cp forward (fairing), cg aft (tanks, engines), no fins: $SM$ of several negative calibres |

The next lesson turns the destabilising moment into dynamics: an unstable pole whose time-to-double is of order a second, and the thrust-vector control loop that has to close around it.
