---
id: l05-normal-force-and-static-margin
title: Normal force, center of pressure and static margin
minutes: 24
covers:
  - normal force, centre of pressure vs centre of gravity, static margin
---

Throw a dart at a board and it flies point-first, even if your throw was a little crooked. The feathers at the back catch the air, and the air pushes the tail back in line. Now try throwing the dart backward, feathers first. It flips around in the air almost at once. Same dart, same air. The only difference is *where* the air pushes compared with where the weight is.

A **[[weathervane|weathervane]]** works the same way. Its big flat tail sits behind the pivot, so whatever the wind does, the arrow swings around to point into it.

A launch vehicle is a dart with the feathers in the wrong place. Its widest part, the payload fairing, is at the front. Its heaviest parts — full tanks and engines — are at the back. It has no fins. So when the air hits it at an angle, the air does not straighten it out. It tips it further.

This lesson makes that precise. Once a vehicle flies at an angle of attack, the air pushes on it sideways. The *size* of that push, the **normal force**, is what bends the airframe. *Where* the push acts, compared with the center of mass, decides whether the vehicle straightens out or tips over. The distance between those two points, measured in body diameters, is the **static margin**. Its sign is the first thing a control engineer asks about any flying body.

By the end you will see why every orbital launch vehicle is unstable in pitch and yaw. The rest of this module is built on that fact.

## The normal force

In the last lesson you split the air's push along the body axes. The part at right angles to the long axis is the **normal force** $N$. Like every aerodynamic force, it is written as dynamic pressure times a reference area times a coefficient:

$$
N = \bar{q}\, S\, C_N(\alpha, M).
$$

Here $\bar{q}$ ("q bar") is the dynamic pressure, $S$ is the **reference area** (for a rocket, the area of the round cross-section of the core), and $C_N$ ("C sub N") is the **normal-force coefficient**, a pure number that depends on the angle of attack $\alpha$ and the Mach number $M$.

Tilt your hand out of the car window twice as far and the push roughly doubles. For the small angles of ascent, $C_N$ does the same: it is proportional to $\alpha$. The constant of proportionality is the **normal-force slope** $C_{N\alpha}$ ("C N alpha"):

$$
C_N \approx C_{N\alpha}\,\alpha, \qquad N = \bar{q}\, S\, C_{N\alpha}\,\alpha .
$$

Here $\alpha$ is in radians and $C_{N\alpha}$ is **[[per radian|per-radian]]**. The sign convention from the last lesson still holds: for $\alpha > 0$, the normal force points toward the side the nose is tilted, relative to the oncoming air. It is the air, pushed aside by the tilted body, pushing back.

### Where the force comes from

Stand still and watch one thin slice of air as the tilted rocket slides through it. The tilted body shoves that slice sideways, a little faster as the body gets wider. Shoving air sideways takes a force, and by Newton's third law the air shoves the body back equally hard.

That picture, called **slender-body theory**, gives a remarkably simple answer. The sideways force per meter of length is

$$
\frac{dN}{dx} = \rho V^2 \alpha\, \frac{dS}{dx} = 2\bar{q}\,\alpha\, \frac{dS}{dx}.
$$

Read $dN/dx$ as "the normal force per unit length", and $dS/dx$ as "how fast the cross-section area grows as you move back along the body". The second form uses $\bar{q} = \tfrac{1}{2}\rho V^2$, so $\rho V^2 = 2\bar{q}$.

The surprise is the $dS/dx$: **only where the cross-section changes is there normal force.**

- The nose cone, where the area grows from zero to the full base area $S_{\text{base}}$, produces $N = 2\bar{q}\alpha S_{\text{base}}$.
- The long straight cylinder produces nothing in this theory, because its area does not change.
- A **[[boat-tail|boat-tail]]**, where the body narrows, has $dS/dx < 0$ and so produces a *negative* push.

Add up the nose's contribution and divide by $\bar{q} S_{\text{base}} \alpha$, and a plain cone-cylinder gives the classic slender-body result

$$
C_{N\alpha} = 2\ \text{per radian},
$$

using the base area as the reference.

::: note Why it has to be true
Watch one slice of air, of thickness $dx$, as the body passes through it at speed $V$ and angle $\alpha$. Relative to that slice, the body's surface moves sideways at speed $V\alpha$ (the body's forward speed times the small tilt).

A round cross-section moving sideways drags along an **[[apparent mass|apparent-mass]]** of air equal to $\rho S(x)$ per unit length, where $S(x)$ is the cross-section area at that point. So the sideways momentum the air carries, per unit length, is $\rho S(x)\, V\alpha$.

In the body's frame, the air streams past at speed $V$. As it moves a distance $dx$ back along the body, its sideways momentum changes by $d[\rho S V\alpha]$, and it takes time $dx/V$ to do so. Force is rate of change of momentum, so the force per unit length on the air is

$$
V\,\frac{d[\rho S V\alpha]}{dx} = \rho V^2 \alpha\,\frac{dS}{dx}.
$$

By Newton's third law the air pushes back on the body with the same force. Integrate over the nose, where $S$ grows from $0$ to $S_{\text{base}}$: $N = \rho V^2 \alpha\, S_{\text{base}} = 2\bar{q}\alpha S_{\text{base}}$, so $C_{N\alpha} = N/(\bar{q}S_{\text{base}}\alpha) = 2$.
:::

Real bodies do better than 2. On the long cylinder, air flowing across the body separates into swirls and adds a **viscous cross-flow lift** that grows like $\alpha^2$. The fairing shoulder, interstage flares and bumps on the skin all count as area changes too. Launch vehicles typically show $C_{N\alpha}$ of 2 to 4 per radian, based on the core cross-section. It rises through the transonic range and falls in supersonic flight.

Per degree, that is $2/57.3 = 0.035$ to $4/57.3 = 0.07$. At a dynamic pressure of 31.3 kPa on a 10.52 m² core, each degree of angle of attack is $31\,300 \times 10.52 \times 0.035 \approx 11\ \mathrm{kN}$ to $23\ \mathrm{kN}$ of sideways load.

::: example Normal force in the max-Q window
At one point in the max-Q window, $\bar{q} = 31.3\ \mathrm{kPa}$, $S = 10.52\ \mathrm{m^2}$, and the vehicle's aerodynamic database gives $C_{N\alpha} = 4.0$ per radian. Find the normal force at $\alpha = 2^\circ$.

**Convert the angle.** $2^\circ \times \pi/180 = 0.0349\ \mathrm{rad}$.

**Multiply it out.**

$$
N = 31\,300 \times 10.52 \times 4.0 \times 0.0349 = 4.60 \times 10^4\ \mathrm{N} = 46\ \mathrm{kN}.
$$

**The slope.** The **normal-force derivative** — the push per radian — is

$$
N_\alpha = \bar{q} S C_{N\alpha} = 31\,300 \times 10.52 \times 4.0 = 1.32 \times 10^6\ \mathrm{N/rad}.
$$

Multiply by $\pi/180$ to get $23.0\ \mathrm{kN}$ per degree.

**Compare with theory.** With the bare slender-body value $C_{N\alpha} = 2$, everything halves: 23 kN at $2^\circ$. The gap between 2 and 4 is the gap between an ideal cone-cylinder and a real vehicle with a flared fairing and separated cross-flow. It is measured in wind tunnels, not derived.

**Sanity check.** 46 kN is the weight of a 4.7-tonne truck, pushing sideways on a 380-tonne vehicle. Big enough to bend it, small next to its weight.
:::

## The center of pressure

The normal force is spread along the body. For working out how it turns the vehicle, you can replace it with one single push at one point. That point is the **center of pressure**, written $x_{cp}$ ("x sub c p").

Think of a seesaw with children sitting all along it. There is one spot where a single support would balance it. The center of pressure is that spot for a spread-out push: about it, the load produces no net twist. As a formula,

$$
x_{cp} = \frac{\int x\, \dfrac{dN}{dx}\, dx}{\int \dfrac{dN}{dx}\, dx},
$$

with $x$ measured from the nose tip, positive toward the tail. The top is the total twist about the nose tip; the bottom is the total force. Dividing them gives the lever arm of a single equivalent push.

**A cone.** For a cone of length $L_n$, the radius grows in step with $x$, so the area grows like $x^2$ and $dS/dx$ grows like $x$. Put $dN/dx \propto x$ into the formula (the constant cancels top and bottom):

$$
x_{cp} = \frac{\int_0^{L_n} x \cdot x\, dx}{\int_0^{L_n} x\, dx} = \frac{L_n^3/3}{L_n^2/2} = \tfrac{2}{3} L_n .
$$

So on a cone-cylinder, the whole normal force acts [[two-thirds of the way down the nose cone|cp-of-a-cone]] — very near the front of the vehicle.

Anything at the back that makes area changes pulls the center of pressure backward. Fins on a model rocket or a missile put a big $dN/dx$ near the tail and drag $x_{cp}$ toward the rear. A flared interstage does the same, more gently. A boat-tail behind a wide fairing does the opposite.

::: example A fairing and its boat-tail
A 70 m vehicle has a 3.66 m core, area $S_c = 10.52\ \mathrm{m^2}$. On top sits a wider 5.2 m payload fairing, area $S_f = 21.24\ \mathrm{m^2}$. The fairing has a 6 m nose cone, then a straight section to 13 m from the tip, then a boat-tail that narrows back to the core diameter, centered at 14 m. Where is the center of pressure?

**Each area change is one push.** In slender-body theory each change contributes $2\bar{q}\alpha\,\Delta S$ at its own location. Measure pushes in units of $2\bar{q}\alpha$ so the numbers stay simple.

- Nose cone: area grows by $+21.24$, acting at $\tfrac{2}{3} \times 6 = 4\ \mathrm{m}$.
- Boat-tail: area shrinks by $21.24 - 10.52 = 10.72$, so it contributes $-10.72$, acting at 14 m.

**Net force.** $21.24 - 10.72 = +10.52$. That is the core area, as it must be: the body starts at zero and ends at the core.

**Net twist about the nose tip.** Each push times its distance:

$$
21.24 \times 4 - 10.72 \times 14 = 85.0 - 150.1 = -65.1 .
$$

**Center of pressure.** Twist divided by force:

$$
x_{cp} = \frac{-65.1}{10.52} = -6.2\ \mathrm{m}.
$$

That is *ahead of the nose*. It sounds impossible, but it makes sense. The fairing and boat-tail act almost like a pure [[couple|fairing-couple]]: a big push forward and a big push backward in opposite directions, with a small total. A small force placed far forward produces the same twist.

**Sanity check.** Viscous cross-flow on the long cylinder pulls the real center of pressure back inside the body, typically a quarter to a third of the length from the nose at small $\alpha$. But the lesson stands: a wide fairing on a narrow core is strongly destabilizing.
:::

The center of pressure does not stay put. It shifts with Mach number, most of all through the transonic band, where shock waves rearrange the pressure on the body. It also moves backward as the angle of attack grows, because the cross-flow lift on the cylinder grows. So the wind-tunnel database lists $x_{cp}(M, \alpha)$ next to $C_N(M, \alpha)$.

## Center of gravity, static margin and the twisting moment

The **center of gravity** $x_{cg}$ is the balance point of the mass. (In the uniform gravity near Earth it is the same point as the center of mass, so engineers use the two names freely.)

For a fully fueled two-stage launcher, most of the mass is propellant in the first-stage tanks. Those tanks fill the back half or more of the vehicle, and the heavy engines sit at the very bottom. So at lift-off the center of gravity typically sits 55 to 70 % of the length back from the nose. It moves during the burn as propellant drains; which way depends on which tank empties.

### The moment about the center of gravity

A push that does not act through the balance point makes the vehicle turn. That turning effect is a **moment** (or torque): force times lever arm.

Take the moment as positive when it turns the nose further away from the oncoming air — that is, when it *increases* $\alpha$. If the normal force $N$ acts a distance $x_{cg} - x_{cp}$ *in front of* the center of gravity, it swings the nose exactly that way. So

$$
M_{cg} = N\,(x_{cg} - x_{cp}).
$$

### Static margin

Now measure that lever arm in body diameters $d$ instead of meters, and flip it so "positive" means "center of pressure behind center of gravity". That gives the **static margin**:

$$
SM = \frac{x_{cp} - x_{cg}}{d},
$$

measured in **[[calibres|calibres]]** (body diameters). Substituting $x_{cg} - x_{cp} = -d\,SM$ into the moment gives $M_{cg} = -N\, d\, SM$. Then put in $N = N_\alpha \alpha$ and ask how the moment changes with $\alpha$:

$$
M_\alpha \equiv \frac{\partial M_{cg}}{\partial \alpha} = -\,\bar{q}\, S\, d\, C_{N\alpha}\, SM, \qquad
C_{m\alpha} = -C_{N\alpha}\, SM .
$$

Here $M_\alpha$ ("M alpha") is the moment per radian of angle of attack, and $C_{m\alpha}$ is the same thing as a pure number, after dividing by $\bar{q} S d$. (The symbol $\equiv$ means "is defined as".)

Now read off the two cases:

- **$SM > 0$**: center of pressure *behind* the center of gravity. The moment fights any angle of attack. Knock the body off line and the air turns it back toward the wind. That is **static stability** — the weathervane, the dart thrown the right way.
- **$SM < 0$**: center of pressure *in front of* the center of gravity. The moment has the same sign as $\alpha$ and grows with it. Knock the body off line and the air pushes it further. That is **static instability** — the dart thrown backward.

"Static" means we only ask which way the first push goes, not how the motion plays out; the next lesson does that.

::: key
Static margin: $SM = (x_{cp} - x_{cg})/d$ in calibres, with $x$ measured from the nose. Positive — centre of pressure aft of the centre of mass — is statically stable, because a disturbance produces a restoring moment. The pitching-moment slope is $C_{m\alpha} = -C_{N\alpha}\,SM$.
:::

::: example Model rocket versus booster
**The model rocket.** A hobby rocket has its center of pressure, fins included, 0.62 m from the nose, found with a **[[Barrowman|barrowman]]**-style calculation. Its center of gravity is 0.55 m from the nose and its diameter is 5 cm. So

$$
SM = \frac{0.62 - 0.55}{0.05} = \frac{0.07}{0.05} = +1.4\ \text{calibres}.
$$

Comfortably stable: the hobbyist's rule of thumb is one to two calibres. Hold it at an angle in a breeze and it swings nose-into-wind.

**The booster.** The 70 m booster from the fairing example has, from its wind-tunnel data, a center of pressure 18 m from the nose at Mach 1.5 and small $\alpha$. Its center of gravity in the max-Q window is 44 m from the nose. So

$$
SM = \frac{18 - 44}{3.66} = \frac{-26}{3.66} = -7.1\ \text{calibres}.
$$

**Its moment slope.** At $\bar{q} = 31.3\ \mathrm{kPa}$ with $C_{N\alpha} = 4$, $N_\alpha = 1.317 \times 10^6$ N/rad from the first example. The lever arm is $x_{cg} - x_{cp} = 26$ m. So

$$
M_\alpha = N_\alpha (x_{cg} - x_{cp}) = 1.317 \times 10^6 \times 26 = 3.42 \times 10^7\ \mathrm{N\cdot m}\ \text{per radian}.
$$

At $\alpha = 2^\circ = 0.0349$ rad the moment is $3.42 \times 10^7 \times 0.0349 = 1.19\ \mathrm{MN\cdot m}$, pushing the nose *further* from the wind.

**What the engines must do.** To hold the vehicle steady, the engines must supply the opposite moment. Suppose the thrust is 7.6 MN, swiveled about a **[[gimbal|gimbal]]** point at the base, 26 m behind the center of gravity (at $70 - 44 = 26$ m). Each degree of gimbal ($0.01745$ rad) gives a sideways thrust of about $T \times 0.01745$, and a moment of

$$
7.6 \times 10^6 \times 26 \times 0.01745 = 3.45\ \mathrm{MN\cdot m}.
$$

So holding $2^\circ$ of angle of attack costs $1.19/3.45 = 0.35^\circ$ of gimbal.

**Sanity check.** The engines have plenty of strength to spare. The problem is not strength. The problem is that nothing holds the vehicle straight *unless the gimbal is told to*, every moment of the flight.
:::

## Why a launch vehicle is unstable

Now put the pieces together.

- On a finless slender body, normal force is made where the cross-section changes: at the nose and the fairing shoulder. That is the front.
- The mass sits where the propellant and engines are. That is the back.
- So $x_{cp}$ is forward, $x_{cg}$ is aft, and $SM$ is negative by several calibres.
- Any angle of attack produces a moment that increases the angle of attack.

The vehicle is statically unstable in pitch, and — because it is round — in yaw too.

::: key
A boosting launch vehicle is statically unstable in pitch because it is a slender body with its centre of pressure well forward (near the nose and payload fairing) and its centre of mass far aft over the full tanks and engines, and it carries no tail fins. Any $\alpha$ produces a moment that increases $\alpha$, so the TVC loop must actively stabilise it.
:::

Fins would fix this, as they fix a model rocket. But they come at a price:

- they add mass and drag for the whole climb;
- they stop working above about 40 km, where the air is too thin, yet the vehicle still needs steering for minutes after that;
- a fin big enough to stabilize a 70 m vehicle with a 5 m fairing at max-Q would be enormous.

The **[[Saturn V's small fins|saturn-fins]]** were there not to make it stable, but to slow the tipping enough for a crew to escape after a control failure. Every modern orbital launcher instead accepts the instability and fixes it actively with **thrust vector control** (TVC): swiveling the engines to push the tail sideways. TVC works at every altitude and adds no drag. The price is a control loop that must never be allowed to stop while the dynamic pressure is significant. That loop is the subject of the next lesson.

::: warning The sign of static margin depends on where you measure from
With $x$ measured from the nose, $SM = (x_{cp} - x_{cg})/d$ is positive when stable. Some references measure from the base, or subtract the other way round. Check before comparing numbers from two sources. The physics does not depend on anyone's choice: the center of pressure must be *behind* the center of gravity for stability.
:::

::: warning Static margin is a snapshot
Both points move during flight. $x_{cp}$ moves with Mach number and angle of attack; $x_{cg}$ moves as propellant drains. The static margin at lift-off, at max-Q and at staging can differ by a calibre or more. On top of that, the moment slope $M_\alpha$ grows and shrinks with $\bar{q}$. A single static margin for a vehicle is true only for one moment of its flight.
:::

## Check yourself

::: check
A vehicle at $\bar{q} = 25\ \mathrm{kPa}$ has $S = 4.9\ \mathrm{m^2}$ and $C_{N\alpha} = 3.0$ per radian. What is the normal force at $\alpha = 3^\circ$, and what is $N_\alpha$ in kN per degree?
:::

::: answer
**Per radian.** $N_\alpha = \bar{q} S C_{N\alpha} = 25\,000 \times 4.9 \times 3.0 = 3.68 \times 10^5\ \mathrm{N}$ per radian.

**Per degree.** Multiply by $0.01745$ rad per degree: $3.68 \times 10^5 \times 0.01745 = 6.41\ \mathrm{kN}$ per degree.

**At $3^\circ$.** $N = 6.41 \times 3 = 19.2\ \mathrm{kN}$.
:::

::: check
Using slender-body theory, where is the center of pressure of a 4 m cone followed by a 30 m cylinder of constant diameter, and what is its $C_{N\alpha}$? Why do real measurements put the center of pressure further back?
:::

::: answer
**Theory.** Only the cone changes cross-section, so all the theoretical normal force comes from it. It acts at $\tfrac{2}{3} \times 4 = 2.67\ \mathrm{m}$ from the tip, with $C_{N\alpha} = 2$ per radian based on the base area.

**Reality.** Real measurements include viscous cross-flow lift on the 30 m cylinder. That push acts roughly at the cylinder's middle, $4 + 15 = 19$ m from the tip, and grows with $\alpha$. It adds to $C_{N\alpha}$ and pulls the combined center of pressure back — more so at larger angles of attack.
:::

::: check
A vehicle has $x_{cp} = 12\ \mathrm{m}$ and $x_{cg} = 27\ \mathrm{m}$ from the nose, and $d = 3\ \mathrm{m}$. Compute the static margin, and $C_{m\alpha}$ if $C_{N\alpha} = 3.5$ per radian. Is it stable?
:::

::: answer
**Static margin.** $SM = (12 - 27)/3 = -15/3 = -5.0$ calibres.

**Moment slope.** $C_{m\alpha} = -C_{N\alpha}\, SM = -3.5 \times (-5.0) = +17.5$ per radian. Two minus signs make a plus.

**Verdict.** A positive moment slope means the twist grows in the same direction as $\alpha$: statically unstable. Per degree, the moment coefficient is $17.5 \times 0.01745 = 0.305$, measured against $\bar{q} S d$.
:::

::: check
Propellant drains from a forward tank first, moving the center of gravity back by 3 m while the center of pressure stays put. For the booster of the worked example ($x_{cp} = 18$ m, $x_{cg} = 44$ m, $d = 3.66$ m), how does the static margin change, and what happens to the destabilizing moment at the same $\bar{q}$ and $\alpha$?
:::

::: answer
**New static margin.** The center of gravity moves from 44 to 47 m, so $SM = (18 - 47)/3.66 = -29/3.66 = -7.9$ calibres, down from $-7.1$. More unstable.

**Moment.** The lever arm $x_{cg} - x_{cp}$ grows from 26 to 29 m. At fixed $\bar{q}$ and $\alpha$ the destabilizing moment $N(x_{cg} - x_{cp})$ grows by $29/26 = 1.115$, about 12 %.

Whether the tipping gets *faster* also depends on how the moment of inertia changes — the next lesson's business.
:::

::: check
Why are fins the wrong fix for a launch vehicle's instability, when they are exactly the right fix for a model rocket?
:::

::: answer
Fins work by making normal force far back, which moves the center of pressure behind the center of gravity.

- On a model rocket they cost little mass or drag, and the rocket flies its whole flight in thick air.
- A launch vehicle would need very large fins to beat the destabilizing push of a wide fairing on a 70 m body. It would carry their mass and drag through the whole climb.
- The fins would lose their grip as $\bar{q}$ collapses above about 40 km, while the vehicle still needs attitude control for another six minutes.
- Thrust vector control, which the vehicle carries anyway for steering, stabilizes it at every altitude with no aerodynamic cost.

The Saturn V's small fins were an escape aid, not a stability fix.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| $N = \bar{q} S C_{N\alpha}\alpha$ | normal force; $N_\alpha = \bar{q} S C_{N\alpha}$ per radian |
| $dN/dx = 2\bar{q}\alpha\, dS/dx$ | slender-body theory: force only where the cross-section changes |
| $C_{N\alpha} = 2$ per rad | ideal cone-cylinder; real launchers 2–4 per rad on core area |
| $x_{cp}$ | center of pressure; $\tfrac{2}{3}L_n$ for a cone; moves with $M$ and $\alpha$ |
| $x_{cg}$ | center of gravity; 55–70 % of the length from the nose at lift-off |
| $SM = (x_{cp} - x_{cg})/d$ | static margin in calibres; positive is stable |
| $M_{cg} = N(x_{cg} - x_{cp}) = -N d\, SM$ | aerodynamic pitching moment about the center of gravity |
| $C_{m\alpha} = -C_{N\alpha} SM$ | moment slope; positive means unstable |
| Launch vehicle | cp forward (fairing), cg aft (tanks, engines), no fins: $SM$ several calibres negative |

The next lesson turns this destabilizing moment into motion: an unstable pole whose time-to-double is about a second, and the thrust vector control loop that has to close around it.

::: context weathervane The dart and the weathervane
Both rockets below meet the air at the same small angle, and the air pushes up (red arrow) at the center of pressure. On the finned model rocket (top) that push is behind the center of gravity, so it lifts the tail and swings the nose back toward the oncoming air. On the booster (bottom) the push is in front, so it lifts the nose further away.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="wv-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
    <marker id="wv-k" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1f2a44"/></marker>
  </defs>
  <circle cx="24" cy="14" r="5" fill="#b4232c"/>
  <text x="34" y="18" font-size="11" fill="#1f2a44">center of pressure</text>
  <circle cx="184" cy="14" r="5" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="194" y="18" font-size="11" fill="#1f2a44">center of gravity</text>
  <rect x="60" y="62" width="220" height="16" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="280,62 310,70 280,78" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="60,62 60,46 84,62" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <polygon points="60,78 60,94 84,78" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.2"/>
  <circle cx="172.5" cy="70" r="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="155" cy="70" r="5" fill="#b4232c"/>
  <line x1="155" y1="62" x2="155" y2="34" stroke="#b4232c" stroke-width="2.5" marker-end="url(#wv-r)"/>
  <path d="M320,58 A16,16 0 0,1 322,80" fill="none" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#wv-k)"/>
  <text x="40" y="116" font-size="12" fill="#1f2a44">model rocket: nose swings back, stable</text>
  <rect x="60" y="152" width="220" height="16" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="280,148 280,172 296,172 296,148" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="296,148 322,160 296,172" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="157.3" cy="160" r="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="254.6" cy="160" r="5" fill="#b4232c"/>
  <line x1="254.6" y1="152" x2="254.6" y2="124" stroke="#b4232c" stroke-width="2.5" marker-end="url(#wv-r)"/>
  <path d="M332,172 A16,16 0 0,1 330,150" fill="none" stroke="#1f2a44" stroke-width="1.5" marker-end="url(#wv-k)"/>
  <text x="40" y="206" font-size="12" fill="#1f2a44">booster: nose swings further away, unstable</text>
</svg>
```
:::

::: context per-radian Why "per radian"
A **radian** is the angle whose arc is as long as the circle's radius: about $57.3^\circ$. Engineers quote slopes like $C_{N\alpha}$ per radian because the small-angle rules, $\sin\alpha \approx \alpha$ and $\tan\alpha \approx \alpha$, are only true with $\alpha$ in radians. Every formula in this lesson quietly assumes that.

To turn a per-radian slope into a per-degree one, divide by 57.3 (or multiply by $\pi/180 = 0.01745$). Forgetting the conversion gives answers 57 times too big — a mistake loud enough that you will usually catch it, but only if you check.
:::

::: context boat-tail Why a narrowing gets its name
A **boat-tail** is a section where a body narrows toward the back, like the stern of a boat. Bullets and artillery shells have them to cut drag.

On a launch vehicle the boat-tail sits at the bottom of a payload fairing that is wider than the rocket below it, where the fairing steps down to the core diameter. In slender-body theory its shrinking area gives a push *opposite* to the nose's — which is why a wide fairing on a narrow rocket behaves so oddly.
:::

::: context apparent-mass Air that comes along for the ride
Wave your hand sideways underwater and it feels heavier than in air. You are not only moving your hand; you are shoving the water around it too. That extra water acts like extra mass, called **apparent mass** or **added mass**.

For a long round body moving sideways, the added mass per unit length turns out to be exactly the mass of fluid that would fill the body's own cross-section: $\rho S$. That neat result is what makes slender-body theory so short. You will meet added mass again in the slosh lesson, where the propellant plays the role of the fluid.
:::

::: context cp-of-a-cone Where a cone's push lands
Along the nose cone, the push per meter grows steadily from zero at the tip to its biggest value where the cone meets the cylinder, because the area grows faster and faster. Along the straight cylinder the push is zero. The single equivalent push lands two-thirds of the way down the cone, where a spread-out load shaped like a triangle balances.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="cc-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
  </defs>
  <polygon points="30,50 110,34 110,66" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="110" y="34" width="220" height="32" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="24" font-size="12" fill="#1f2a44" text-anchor="middle">cone</text>
  <text x="220" y="24" font-size="12" fill="#1f2a44" text-anchor="middle">cylinder</text>
  <line x1="30" y1="150" x2="330" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="30,150 110,100 110,150" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="140" y="118" font-size="12" fill="#1d6fd1">push per meter, dN/dx</text>
  <text x="220" y="143" font-size="12" fill="#1d6fd1" text-anchor="middle">zero along the cylinder</text>
  <line x1="83.3" y1="96" x2="83.3" y2="72" stroke="#b4232c" stroke-width="2.5" marker-end="url(#cc-r)"/>
  <line x1="83.3" y1="150" x2="83.3" y2="100" stroke="#b4232c" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="30" y="170" font-size="12" fill="#b4232c">N acts at 2/3 of the cone length</text>
</svg>
```
:::

::: context fairing-couple A push forward, a push back
A **couple** is a pair of equal and opposite forces that do not act along the same line. It produces a pure twist with no net push. The fairing example is almost a couple: $+21.2$ units up at the nose, $-10.7$ units down at the boat-tail (drawn to scale here). The net push is small, but the twist is large, so the single equivalent force has to sit far forward — 6.2 m ahead of the tip — to twist as hard.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="fc-r" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#b4232c"/></marker>
    <marker id="fc-b" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="#1d6fd1"/></marker>
  </defs>
  <polygon points="20,100 47,88.3 47,111.7" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="47" y="88.3" width="31.5" height="23.4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="78.5,88.3 87.5,91.8 87.5,108.2 78.5,111.7" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="87.5" y="91.8" width="247.5" height="16.4" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="38" y1="86" x2="38" y2="26" stroke="#b4232c" stroke-width="2.5" marker-end="url(#fc-r)"/>
  <text x="46" y="36" font-size="12" fill="#b4232c">+21.2 at 4 m</text>
  <line x1="83" y1="112" x2="83" y2="142" stroke="#1d6fd1" stroke-width="2.5" marker-end="url(#fc-b)"/>
  <text x="92" y="140" font-size="12" fill="#1d6fd1">−10.7 at 14 m</text>
  <circle cx="218" cy="100" r="6" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="218" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">cg, 44 m</text>
</svg>
```
:::

::: context calibres A unit borrowed from gunnery
**Calibre** (spelled caliber in most American writing) is the inside diameter of a gun barrel — and so the diameter of the shell or bullet that fits it. Gunners measured barrel lengths "in calibres" (a 50-calibre barrel is fifty bores long), and rocketry kept the habit of measuring lengths in diameters.

Measuring static margin in body diameters makes it fair to compare a 5 cm model rocket with a 3.66 m booster. One calibre on the model is 5 cm; on the booster it is 3.66 m. The model's $+1.4$ and the booster's $-7.1$ can then be set side by side.
:::

::: context barrowman The model-rocket method
In 1966 and 1967 James Barrowman, then a young engineer at NASA's Goddard Space Flight Center, worked out a short set of formulas for the center of pressure of a finned rocket: a nose, a body, maybe a shoulder or boat-tail, and fins. It is slender-body theory plus a fin formula, simple enough to do by hand.

The **Barrowman equations** are still what model-rocket design programs use to check a rocket is stable before it flies. Hobbyists are told to aim for one to two calibres.
:::

::: context gimbal Steering by swiveling the engine
A **gimbal** is a pivot that lets something swing in two directions — the same mount that keeps a ship's compass level. A rocket engine on a gimbal can tilt its nozzle a few degrees in pitch and yaw, pushed by hydraulic or electric actuators.

Tilting the nozzle by an angle $\delta$ ("delta") gives a sideways thrust of about $T\delta$ at the tail. Pushing the tail one way swings the nose the other. That is **thrust vector control**, and it is the only steering a launch vehicle has in the thick air. The next lesson builds the control loop around it.
:::

::: context saturn-fins What the Saturn V's fins were for
The Saturn V's first stage carried four fins at its base. They did not make the rocket stable. What they did was shift the center of pressure back, which eased the load on the steering and slowed the tipping if the steering failed — buying time for the crew's escape tower to pull the capsule away safely.

Later rockets designed without a crew on top, or with faster escape systems, dropped them. The Falcon 9 has no fins at all on the way up; the grid fins it carries are stowed flat until it falls back.
:::
