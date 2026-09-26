---
id: l05-orientation-controls
title: 'Orientation: square, parallel and at an angle'
minutes: 21
covers:
  - 'Orientation: perpendicularity, angularity, parallelism'
---

Hang a picture on a wall and step back. It can be a perfect rectangle — flat, straight edges, sharp corners — and still look wrong, because it is crooked. Its shape is fine. Its *tilt* is off, relative to the floor and the ceiling.

That is the difference between the last lesson and this one. Form asked about shape alone, with no reference. **Orientation** asks about tilt: is this face square to that one, parallel to it, or at the right angle to it? You cannot answer "is it crooked?" without saying "crooked compared to what". So orientation controls bring the datums back.

For a guidance, navigation and control (GNC) engineer, orientation is where tolerances turn into physics. A thruster whose mounting seat is tipped by a few hundredths of a degree pushes a little sideways. A star tracker whose seat is tipped reports every attitude a little wrong. This lesson teaches the three orientation controls, then the one piece of geometry that converts a tolerance in millimeters into an angle, and that angle into a torque on the spacecraft.

## Three controls, one idea

There are three orientation controls, and they differ only in the angle they ask for.

- **Perpendicularity** — being at exactly $90^\circ$ to a datum. Its symbol is an upside-down T, like a wall standing on a floor.
- **Parallelism** — being at exactly $0^\circ$ to a datum, running alongside it. Its symbol is two slanted parallel lines.
- **Angularity** — being at some other exact angle to a datum, such as $30^\circ$ or $45^\circ$. Its symbol is a small angle, like a less-than sign lying down. The angle itself is given on the drawing as a **[[basic angle|basic-angle]]**, a boxed exact number.

In every case the zone for a surface is the same kind of thing: **two parallel planes $t$ apart**, held at the exact angle to the datum. The real surface must lie between them. The planes may slide back and forth — orientation does not say *where* the surface is — but they may not tip. The datum fixes their angle.

A frame reading `| ⊥ | 0.05 | A |` says: "Perpendicularity, within zero point zero five, relative to datum A." The face must lie between two parallel planes $0.05\,\mathrm{mm}$ apart that stand at exactly $90^\circ$ to datum A.

::: key Orientation controls
Perpendicularity ($90^\circ$), parallelism ($0^\circ$) and angularity (any other basic angle) each put the feature between two parallel planes $t$ apart, held at the exact angle to the datum reference. The zone may translate but not rotate; orientation controls tilt, not location.
:::

Compare this with flatness. Flatness planes may tip freely. Perpendicularity planes are locked at $90^\circ$ to A. So a face that passes perpendicularity $0.05$ must also be flat within $0.05$ — it has to fit between those planes — but the reverse is not true. A perfectly flat face leaning over would pass flatness and fail perpendicularity.

::: warning Orientation does not locate
A perpendicularity frame says nothing about how far the face is from anything. The zone can sit anywhere along the datum, as long as it stays square. Distance comes from a size dimension or a location control such as position, next lesson.
:::

### Orientation of an axis

Holes and pins have axes, and an axis can be tipped too. When the tolerance carries a diameter sign — `| ⊥ | ⌀0.02 | A |` — the zone is a **cylinder** of diameter $0.02\,\mathrm{mm}$ standing at exactly $90^\circ$ to datum A. The hole's axis must stay inside that cylinder along the whole depth of the hole. That is how a drawing keeps a bolt hole from being drilled at a slant.

## From a zone width to an angle

Here is the geometry that connects the drawing to the physics.

Picture a flat seat $L$ millimeters long, standing on datum A. Perpendicularity says the seat lies between two planes $t$ apart, both square to A. The worst the seat can lean is from one plane at the bottom to the other plane at the top. Over a height $L$, it drifts sideways by $t$. That is a right triangle: $t$ across, $L$ up. The tilt angle $\theta$ (read "theta") obeys

$$
\tan\theta = \frac{t}{L}.
$$

For the tiny angles of precision parts, there is a shortcut. When an angle is small and measured in **[[radians|radians]]**, its tangent and its sine are both almost exactly the angle itself. This is the **[[small-angle approximation|small-angle]]**:

$$
\theta \approx \frac{t}{L} \quad (\text{radians}).
$$

To get degrees, multiply radians by $\frac{180}{\pi} \approx 57.3$.

::: key Linear zone to angle
A zone of width $t$ over a feature length $L$ allows a tilt of at most $\theta = \arctan(t/L) \approx t/L$ radians, since for small angles $\tan\theta \approx \sin\theta \approx \theta$. Going the other way, an allowed angle $\theta$ over a length $L$ needs a zone no wider than $t \approx L\,\theta$.
:::

Two things follow. A **longer** feature makes the same $t$ into a smaller angle, because the lean is spread over more length. And the same angle needs a **tighter** $t$ on a short feature. That is why engineers care about the span of a seat, not only the tolerance number.

::: note Why the shortcut is safe
Picture a circle of radius $1$. An angle $\theta$ in radians is the length of arc it cuts off. Its sine is the height of the triangle under that arc, and its tangent is the height of the triangle that reaches out to the tangent line. For a thin sliver of angle, the arc, the sine height and the tangent height are three almost identical short lines. How close? At $1^\circ$ ($0.017453$ rad), $\tan 1^\circ = 0.017455$ — different by about one part in ten thousand. At $0.02^\circ$ the difference is four parts in a hundred million. Precision orientation tolerances live far below $1^\circ$, so $\theta \approx t/L$ is effectively exact.
:::

::: warning Radians, not degrees
$t/L$ gives the angle in radians. People forget and call $0.00125$ "$0.00125^\circ$", which is $57$ times too small. Convert every time: multiply by $57.3$ to get degrees.
:::

::: example A parallel spacer
A spacer plate $50\,\mathrm{mm}$ across must have its top face parallel to its bottom face, datum A, within $0.01\,\mathrm{mm}$. How much can the top face tilt?

**Set up.** The zone is two planes $0.01$ apart, parallel to A. Across the $50\,\mathrm{mm}$ face the top can rise by at most $t = 0.01$.

**Angle in radians.** $\theta \approx t/L = 0.01 / 50 = 0.0002\,\mathrm{rad}$.

**Angle in degrees.** $0.0002 \times 57.3 = 0.0115^\circ$.

**Sanity check.** A hundredth of a millimeter over five centimeters is a ratio of one in five thousand. A small fraction of a degree is what that should give.
:::

## From a tilted thruster to a torque

Now the physics. A small **thruster** is bolted by its flange to a seat on the spacecraft. The designers aim its **[[thrust line|thrust-misalignment]]** — the straight line along which it pushes — exactly through the spacecraft's **center of mass**, the balance point. A push through the balance point moves the vehicle without turning it.

Tilt the seat by $\theta$ and the thrust line tilts by $\theta$ too. Now it misses the center of mass. Picture pushing a floating book: shove through its middle and it slides; shove a little off-center and it slides *and* spins. The spin comes from a **torque** — a twisting effect, measured in newton-meters ($\mathrm{N \cdot m}$).

How far does the tilted line miss? Let the thruster sit a distance $\ell$ (read "ell") from the center of mass, along the intended line — the **lever arm**. The miss distance is $\ell \sin\theta$. The torque is force times miss distance:

$$
\tau = F \cdot \ell \cdot \sin\theta,
$$

where $\tau$ (read "tau") is the torque and $F$ the thrust. Because $\theta$ is tiny, $\sin\theta \approx \theta$, so $\tau \approx F \ell \theta$. This unwanted torque is a **[[disturbance torque|disturbance-torque]]**: something the attitude control system never asked for and must fight.

::: example Thruster seat perpendicularity to disturbance torque
A $22\,\mathrm{N}$ thruster mounts on a seat $40\,\mathrm{mm}$ across, called out perpendicular within $0.05\,\mathrm{mm}$ to datum A, the plane its thrust line should be square to. The thruster sits $1.5\,\mathrm{m}$ from the center of mass along its intended thrust line. What worst-case disturbance torque does the tolerance allow?

**Tilt in radians.** $\theta \approx t/L = 0.05 / 40 = 0.00125\,\mathrm{rad}$.

**Tilt in degrees.** $0.00125 \times 57.3 = 0.0716^\circ$. (The exact $\arctan$ agrees to five figures.)

**Miss distance.** $\ell \sin\theta = 1.5 \times 0.00125 = 0.001875\,\mathrm{m}$, just under $2\,\mathrm{mm}$.

**Torque.** $\tau = F \ell \sin\theta = 22 \times 0.001875 = 0.0413\,\mathrm{N \cdot m}$.

**What it adds up to.** A ten-minute burn, $600\,\mathrm{s}$, at that torque delivers $0.0413 \times 600 = 24.7\,\mathrm{N \cdot m \cdot s}$ of unwanted angular momentum. Other thrusters or reaction wheels have to cancel it.

**Sanity check.** A thrust line that misses the balance point by about $2\,\mathrm{mm}$, pushed with $22\,\mathrm{N}$, gives about $22 \times 0.002 = 0.044\,\mathrm{N \cdot m}$. Close to $0.041$, as it should be.
:::

Look at what controls the answer. Halve $t$ and the torque halves. Double the seat's width and the torque also halves. When the attitude team says "we can tolerate at most so much disturbance torque", the mechanical engineer works this chain backward to pick $t$.

## Star trackers: angle becomes knowledge error

A thruster's tilt creates a torque. A sensor's tilt creates something sneakier: a wrong answer. A star tracker reports which way *it* points. The flight software turns that into which way the *spacecraft* points, assuming the tracker sits exactly as drawn. If the seat is tilted by $\theta$, every attitude it reports is off by $\theta$, in the same direction, forever. That steady error is an **[[attitude-knowledge bias|knowledge-bias]]**.

The GNC error budget gives the mounting a share of angle. The mechanical engineer turns that share into an orientation tolerance on the seat — perpendicularity or angularity to a datum, depending on how the tracker is meant to point — using $t \approx L\theta$.

::: example From 0.02 degrees to a seat tolerance
An error budget allows the tracker seat to contribute at most $0.02^\circ$ of tilt. The seat is $60\,\mathrm{mm}$ across. What orientation tolerance should the drawing carry?

**Degrees to radians.** $0.02 / 57.3 = 0.000349\,\mathrm{rad}$.

**Zone width.** $t \approx L\theta = 60 \times 0.000349 = 0.0209\,\mathrm{mm}$.

**Round the safe way.** Tolerances are rounded *down* when they protect a budget: call it $0.02\,\mathrm{mm}$.

**Sanity check.** Tipping $0.02\,\mathrm{mm}$ over $60\,\mathrm{mm}$ is one part in three thousand, $0.00033\,\mathrm{rad}$, about $0.019^\circ$. Inside the budget.
:::

The mounting holes matter too: if they are misplaced, the bolts can pull the tracker around. That is a position control, next lesson. The last lessons of this module assemble the whole chain.

::: key How GD&T reaches a control loop
Through alignment error budgets. Perpendicularity of a thruster seat becomes a thrust-vector misalignment and a disturbance torque; angularity of a star-tracker mount becomes attitude-knowledge bias; position of a gimbal bearing becomes **[[backlash|backlash]]** and friction variation.
:::

::: warning Use the length the zone applies over
The $L$ in $\theta \approx t/L$ is the length of the controlled feature — the seat's span — not the whole part and not the lever arm. A $0.05$ zone on a $40\,\mathrm{mm}$ seat allows ten times the tilt of the same zone on a $400\,\mathrm{mm}$ seat. Mixing them up can hide an error of ten or more.
:::

## Check yourself

::: check
A face passes flatness $0.03$. Does that mean it passes perpendicularity $0.03$ to datum A? What about the other way around?
:::

::: answer
No. Flatness lets its two planes tip any way, so a perfectly flat face leaning well away from square passes flatness and fails perpendicularity. The other way does hold: a face that fits between two planes $0.03$ apart, square to A, fits between two parallel planes $0.03$ apart, so it is flat within $0.03$. Orientation limits form; form does not limit orientation.
:::

::: check
A bracket face $25\,\mathrm{mm}$ tall carries perpendicularity $0.1\,\mathrm{mm}$ to datum A. What is the largest tilt it allows, in radians and degrees?
:::

::: answer
$\theta \approx t/L = 0.1 / 25 = 0.004\,\mathrm{rad}$. In degrees, $0.004 \times 57.3 = 0.229^\circ$. That is about ten times the star tracker allowance in this lesson, which shows how quickly a loose tolerance on a short face eats an angle budget.
:::

::: check
A $445\,\mathrm{N}$ main engine sits $1.2\,\mathrm{m}$ from the center of mass. Its seat is $80\,\mathrm{mm}$ across with perpendicularity $0.03\,\mathrm{mm}$. Find the worst-case disturbance torque.
:::

::: answer
Tilt: $\theta \approx 0.03 / 80 = 0.000375\,\mathrm{rad}$ ($0.0215^\circ$). Miss distance: $1.2 \times 0.000375 = 0.00045\,\mathrm{m}$. Torque: $\tau = F\ell\sin\theta = 445 \times 0.00045 = 0.200\,\mathrm{N \cdot m}$. The tilt is small, but the big thrust makes the torque about five times the small thruster's.
:::

::: check
Why is a star tracker's seat tilt called a *bias* and not noise?
:::

::: answer
Because it is the same every time. Noise jumps around and partly averages away. A tilted seat makes every reported attitude off by the same angle in the same direction, so no amount of averaging removes it. It must be kept small by the tolerance, or measured after assembly and corrected in software.
:::

::: check
A seat must hold a tilt of $0.01^\circ$. The designer can make it $30\,\mathrm{mm}$ or $90\,\mathrm{mm}$ across. What orientation tolerance does each need?
:::

::: answer
$0.01^\circ = 0.01 / 57.3 = 0.000175\,\mathrm{rad}$. For $30\,\mathrm{mm}$: $t \approx 30 \times 0.000175 = 0.0052\,\mathrm{mm}$. For $90\,\mathrm{mm}$: $t \approx 0.0157\,\mathrm{mm}$. The wider seat allows three times the zone for the same angle, which is often cheaper to make than a very tight small seat.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Perpendicularity | square to a datum | two planes $t$ apart at $90^\circ$ to the datum |
| Parallelism | alongside a datum | two planes $t$ apart at $0^\circ$ to the datum |
| Angularity | at a basic angle to a datum | two planes $t$ apart at the basic angle |
| Axis orientation | tolerance with $\varnothing$ | cylinder of diameter $t$ at the exact angle |
| Zone to angle | small-angle geometry | $\theta \approx t/L$ radians; $t \approx L\theta$ |
| Radians to degrees | unit change | multiply by $57.3$ |
| Disturbance torque | tilted thrust line | $\tau = F \ell \sin\theta \approx F\ell\theta$ |
| Star tracker tilt | attitude-knowledge bias | same error every time |

Next lesson adds *where*: position, which locates a feature in the datum reference frame with a round zone, and the two older location controls, concentricity and symmetry, that the current standard steers designers away from.

::: context basic-angle An exact angle in a box
Angularity needs to know which angle is "right". The drawing gives it as a basic angle, such as a boxed $30^\circ$, with no plus-or-minus. The tolerance in the frame is not in degrees at all — it is the width of the zone, in millimeters. This surprises people: you might expect "$30^\circ \pm 0.5^\circ$". An angle tolerance makes a fan-shaped zone that is wide far from the corner and narrow near it. Two parallel planes give the same allowance all along the surface, which matches how a mating part touches it.
:::

::: context radians Measuring angles by length
A radian is the angle that cuts off an arc as long as the circle's radius. A full turn is $2\pi$ radians, the same as $360^\circ$, so one radian is $\frac{180}{\pi} \approx 57.3^\circ$. Engineers like radians because they turn angles into simple ratios: arc length is radius times angle, with nothing else to remember. That is exactly why $t/L$ comes out as an angle in radians, and why physics and flight software do almost all their work in radians.
:::

::: context small-angle The triangle inside the zone
The worst lean the zone allows: the face runs from one side of the zone at the bottom to the other side at the top. Drawn with the tilt hugely exaggerated.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="60,170 150,170 190,30 60,30" fill="#8fb8f0" fill-opacity="0.5" stroke="#1f2a44" stroke-width="2"/>
  <line x1="150" y1="20" x2="150" y2="170" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="6 4"/>
  <line x1="190" y1="20" x2="190" y2="170" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="6 4"/>
  <line x1="30" y1="170" x2="330" y2="170" stroke="#1f2a44" stroke-width="3"/>
  <text x="300" y="188" font-size="12" fill="#1f2a44">datum A</text>
  <line x1="150" y1="14" x2="190" y2="14" stroke="#b4232c" stroke-width="1.5"/>
  <text x="170" y="11" font-size="12" text-anchor="middle" fill="#b4232c">t</text>
  <line x1="205" y1="30" x2="205" y2="170" stroke="#1f2a44" stroke-width="1"/>
  <text x="212" y="104" font-size="12" fill="#1f2a44">L</text>
  <path d="M 150 130 A 40 40 0 0 1 161.3 131.6" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="158" y="124" font-size="12" fill="#b4232c">θ</text>
  <text x="240" y="60" font-size="11" fill="#1d6fd1">zone: two planes</text>
  <text x="240" y="75" font-size="11" fill="#1d6fd1">square to A</text>
  <text x="240" y="120" font-size="11" fill="#1f2a44">tan θ = t / L</text>
</svg>
```

For real tolerances the triangle is a sliver, and $\theta \approx t/L$.
:::

::: context thrust-misalignment How a tilt becomes a lever
The intended thrust line (grey) passes through the center of mass. The tilted line (red) misses it by $\ell\sin\theta$, and that miss is the lever the thrust twists on. Angle exaggerated to $15^\circ$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="180" x2="180" y2="20" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="6 4"/>
  <line x1="180" y1="180" x2="223" y2="20" stroke="#b4232c" stroke-width="2"/>
  <line x1="180" y1="40" x2="215" y2="49.4" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="40" r="6" fill="#1d6fd1"/>
  <rect x="166" y="180" width="28" height="18" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="120" y="36" font-size="12" fill="#1d6fd1">center</text>
  <text x="112" y="50" font-size="12" fill="#1d6fd1">of mass</text>
  <text x="120" y="194" font-size="12" fill="#1f2a44">thruster</text>
  <text x="140" y="116" font-size="12" fill="#6c7a93">ℓ</text>
  <text x="232" y="56" font-size="12" fill="#1f2a44">miss = ℓ sin θ</text>
  <text x="208" y="140" font-size="12" fill="#b4232c">tilted thrust</text>
  <path d="M 180 150 A 30 30 0 0 1 188 151" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="187" y="162" font-size="12" fill="#b4232c">θ</text>
</svg>
```

Torque is thrust times the miss: $\tau = F\ell\sin\theta$.
:::

::: context disturbance-torque Twists nobody ordered
A disturbance torque is any twist on the spacecraft the control system did not command. Thrust misalignment is one. Others include sunlight pressing unevenly on the solar panels, thin air dragging on one side in low orbit, gravity pulling slightly harder on the nearer end, and fuel sloshing. The attitude control system must measure the resulting drift and push back with reaction wheels or thrusters. Knowing the size of each disturbance lets engineers size those actuators, which is why a seat tolerance ends up in a control engineer's spreadsheet.
:::

::: context knowledge-bias Wrong, but consistently
Attitude knowledge is what the spacecraft believes about its own pointing. A bias is a fixed offset in that belief. The spacecraft can hold its estimated attitude perfectly steady and still point the camera slightly off target, because it believes the wrong thing. Some biases can be estimated in flight by comparing sensors, or by looking at known targets, and then corrected. Whatever is not calibrated out must come from the mechanical tolerance, which is why the error budget gives the mounting its own share.
:::

::: context backlash Play in a mechanism
Backlash is the small free motion in a mechanism before the parts engage, like the wiggle in a loose steering wheel before the wheels turn. In a gimbal that steers an engine or points an antenna, misplaced bearing seats can leave play in some directions and pinch the bearing in others, which changes the friction as it turns. A control loop sees backlash as a dead zone and uneven friction as a disturbance, and both make precise pointing harder. The position control that prevents it is the subject of the next lesson.
:::
