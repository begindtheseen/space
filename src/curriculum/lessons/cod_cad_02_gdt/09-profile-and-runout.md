---
id: l09-profile-and-runout
title: Profile and runout
minutes: 22
covers:
  - Profile of a line and profile of a surface, increasingly dominant in aerostructures
  - 'Runout: circular and total'
---

Picture a car on a winding mountain road. The lane has two painted lines, a fixed distance apart, and they follow every bend. The driver does not need to know the car's $x$ and $y$ coordinates. There is one rule: stay between the lines, wherever the road goes. That rule works just as well on a hairpin turn as on a straight.

Now flip a bicycle upside down and spin the front wheel. Hold a finger near the rim. If the wheel is true, the rim slides past your finger at a steady distance. If it is bent, the rim swings toward your finger and away again, once every turn. You have measured the wheel's wobble without a single number on a drawing.

Those two pictures are this lesson's two controls. **Profile** is the lane: a zone of fixed width that follows a curved outline or surface, however complicated. It is the control that shapes the curved skins of rockets and aircraft. **Runout** is the spinning wheel: turn a round part about its axis and watch how much its surface wobbles. It is how shafts in gimbals, reaction wheels and pumps are checked.

## The true profile

Every profile control compares a real surface with a perfect one. The perfect shape is called the **true profile** — the exact outline or surface the designer intended. On an older drawing, it is set by basic dimensions: boxed exact numbers for radii, angles and points along the curve. On a modern program, it is usually the **[[CAD model itself|true-profile]]**. The model's surface *is* the basic geometry, with no plus-or-minus attached to any of its points.

The profile tolerance then says how far the real surface may stray from that perfect one.

## Profile of a surface: a lane in three dimensions

**Profile of a surface** — a control that keeps a whole real surface within a zone wrapped around the true surface. Its symbol is a half-circle closed by a straight line along the bottom, like a dome sitting on the ground.

The zone is made of two surfaces, one just outside the true profile and one just inside it, like a thin shell. The distance between them, measured **perpendicular to the surface** at every point, is the tolerance $t$. By default the zone is **equal-bilateral** — split evenly, $\frac{t}{2}$ outside and $\frac{t}{2}$ inside. So a profile of $0.8$ means the surface may sit anywhere from $0.4\,\mathrm{mm}$ proud of the model to $0.4\,\mathrm{mm}$ under it. The [[zone hugs every curve|profile-zone-picture]]. A designer who wants more room on one side than the other can say so with a special [[unequal zone symbol|unequal-profile]].

What profile controls depends on the datums in its frame. This is the part that makes it so powerful:

- **With a full datum reference frame** (A, B, C), the zone is locked in place on the part. The surface must have the right **shape** (form), the right **tilt** (orientation) and be in the right **place** (location). One frame controls all three.
- **With fewer datums**, the zone is fixed only in the ways those datums can fix it. With datum A alone, the zone must stay square to A and at its basic distance from A, but it may still slide sideways along A and turn about A's normal. Form, orientation and part of the location are controlled.
- **With no datums at all**, the zone may slide and tilt to fit. Only the shape — and its size, for a closed shape — is controlled.

So profile is like a Swiss Army knife. With datums it can do the job of flatness, parallelism and position together, on a surface of any shape.

::: key Why profile of a surface dominates in aerostructures
Because the features are complex curved surfaces rather than prismatic geometry, and profile controls form, orientation and location of the whole surface in one frame against the model. It also fits model-based definition naturally.
:::

::: example Checking a fairing panel
A curved fairing panel carries profile of a surface $0.8$ to datums A, B and C. A coordinate measuring machine probes eight points on the outer skin. At each point it reports the **deviation** — how far the real surface is from the model, measured perpendicular to the model's surface. Plus means proud (outside), minus means under (inside). In millimeters:

$0.12,\ -0.31,\ 0.27,\ 0.38,\ -0.05,\ -0.36,\ 0.19,\ -0.22$

**The zone.** Equal-bilateral $0.8$ means $\pm 0.4$: every deviation must be between $-0.4$ and $+0.4$.

**The extremes.** The largest is $+0.38$. The most negative is $-0.36$.

**Compare.** $0.38 \le 0.4$ and $-0.36 \ge -0.4$. Every point is in the zone. The panel passes.

**The same panel against a profile of $0.6$.** Now the zone is $\pm 0.3$. Three points break it: $-0.31$, $+0.38$ and $-0.36$. The panel fails.

**Sanity check.** The spread from the lowest to the highest point is $0.38 - (-0.36) = 0.74$, less than $0.8$, so the surface fits a zone that wide *if* the zone were centered in the right place. With datums the zone is not free to move, so the center matters too. Here the points happen to straddle zero nicely, which is why the $0.8$ check passed.
:::

::: warning Profile 0.8 is plus-or-minus 0.4, not plus-or-minus 0.8
The number in the frame is the **total** width of the zone. For an equal-bilateral zone, half goes each way. Reading "$0.8$" as "$\pm 0.8$" doubles the tolerance and passes bad parts. And the width is measured perpendicular to the surface, not straight up in $z$: on a steeply sloping surface, a vertical measurement exaggerates the deviation.
:::

## Profile of a line: one slice at a time

**Profile of a line** — the same idea, applied to one cross-section at a time. Its symbol is the same arc *without* the line along the bottom.

Imagine slicing a part like a loaf of bread. At each slice, the real outline must lie between two lines, $t$ apart, that follow the true outline of that slice. Each slice is checked on its own. Nothing ties one slice to the next, so the slices may each be good while the surface as a whole is slightly twisted.

That makes profile of a line the right tool when the part is really made of sections: an airfoil-shaped fin, a machined rib, a long **extrusion** (metal pushed through a shaped die, like toothpaste, so that every slice has the same outline). The designer often uses both. Profile of a surface keeps the whole surface in place, loosely. Profile of a line then keeps each section's shape, tightly.

## Why profile dominates aerostructures

An **[[aerostructure|aerostructure-word]]** is the structure that meets the air or carries the flight loads: skins, fairings, nose cones, wing ribs, inlet ducts, interstages. Almost none of it is a box. It is double-curved skin and blended shapes.

Try to tolerance a nose cone's outer surface with plus-or-minus coordinates. You would need a table of $x$, $y$ and $z$ values at dozens of stations, each with its own tolerance. They would make square zones (lesson 1's problem), they would stack on each other, and they would still say nothing about the surface *between* the stations. Now compare: one profile frame, one number, referenced to A, B and C. It covers every point of the surface, in the direction that matters — perpendicular to the skin, which is the direction a gap, a step or an aerodynamic bump would show.

It also matches how modern programs work. In **[[model-based definition|mbd-colour-map]]** (MBD) the 3D model is the official definition of the part, and the tolerances are attached to it directly. Profile fits that perfectly: the model already *is* the true profile, and a CMM can compare thousands of measured points to it and report every deviation. That is why profile is increasingly dominant on aerostructures, and why it often replaces plus-or-minus dimensions on outlines of all kinds.

::: warning Profile does not remove the need for datums
A profile frame with no datums says nothing about where the surface is. On a skin panel that must meet its neighbor without a step, the frame needs the datums that set up the mating interface. A beautiful shape in the wrong place is still a step in the airflow.
:::

## Runout: spin it and watch the needle

Now the second control. Runout is for round parts that **spin**: shafts, rotors, wheels, pulleys, bearing journals.

The setup is always the same. First, the part is held on its **datum axis** — often the axis through the two bearing journals it will really run on, supported in V-blocks or between centers. Then a **[[dial indicator|fim-word]]** — a gauge whose needle moves when its plunger is pushed — rests against the surface being checked. The part is turned one full revolution. The **full indicator movement**, or **FIM**, is the highest reading minus the lowest. That number *is* the runout.

Runout catches anything that makes the surface move toward and away from the indicator as the part turns: the surface being **[[off-center|eccentric-picture]]**, being out of round, or, on a face, being tilted or wavy. It cannot tell those causes apart, and it does not need to. A bearing, a seal or a spinning wheel feels the sum of them, and runout measures the sum.

One off-center fact is worth memorizing. If a perfectly round surface sits a distance $e$ off the datum axis ($e$ for **eccentricity**, "off-centerness"), the indicator reads $e$ too high on one side and $e$ too low on the other side, half a turn later. So the runout is **twice** the offset:

$$
\text{FIM} = 2e
$$

::: example A gimbal shaft that sits off-center
A gimbal shaft's bearing journals set datum axis A–B. A seat for a gear is supposed to be centered on that axis, with circular runout $0.03\,\mathrm{mm}$. The seat is perfectly round, but it was machined $0.015\,\mathrm{mm}$ off-center. Does it pass?

**Top of the turn.** The side of the seat nearest the indicator sticks out $0.015$ more than a centered seat would. Reading: $+0.015$.

**Half a turn later.** Now that side is away from the indicator, and the opposite side is $0.015$ low. Reading: $-0.015$.

**FIM.** $0.015 - (-0.015) = 0.030\,\mathrm{mm}$.

**Compare.** $0.030 \le 0.03$. It passes, exactly at the limit.

**Sanity check.** $\text{FIM} = 2e = 2 \times 0.015 = 0.030$. The rule and the step-by-step agree. And it makes sense that a gear seat $0.015$ off-center would make the gear's teeth swing in and out by $0.03$ each turn — that is what the gear's mesh would feel.
:::

::: warning Runout is twice the offset
A shaft that is $0.01$ off-center shows $0.02$ of runout. People who read FIM as "how far off-center" think the part is twice as bad as it is, or write a tolerance half as tight as they meant. Divide FIM by two to get the offset; multiply the allowed offset by two to get the runout tolerance.
:::

## Circular runout and total runout

There are two runout controls. The difference is whether the indicator stays put during the turn.

**Circular runout** — its symbol is one slanted arrow. The indicator is held at one spot along the shaft, the part turns once, and the FIM is read. Then the indicator is moved to another spot and the check is repeated. *Each* circle must pass on its own. Circular runout on a cylinder catches off-center and out-of-round, one slice at a time. On a flat face square to the axis, it catches wobble around each circle.

**Total runout** — its symbol is two slanted arrows joined at the bottom. The part turns *while* the indicator slides the whole length of the surface. One FIM is read for the whole surface: highest reading anywhere minus lowest reading anywhere. So a total runout control also catches a surface that is tapered, bent or bowed along its length — errors that look fine one slice at a time. On a face, total runout controls flatness and squareness to the axis together.

Total runout is always the tighter check of the two, for the same number. Any part that passes total runout $0.02$ passes circular runout $0.02$, but not the other way round.

::: key Circular versus total runout
Runout is checked by rotating the part about its datum axis under a dial indicator; the full indicator movement (FIM) must not exceed the tolerance. Circular runout applies the FIM to each circular element separately. Total runout applies one FIM to the whole surface, with the indicator traversed along it while the part turns. For a round surface offset by $e$, $\text{FIM} = 2e$.
:::

::: example A reaction wheel shaft, circle by circle and all at once
A reaction wheel shaft's rotor seat is checked at three stations along its length. At each, the part is turned once and the lowest and highest readings noted, in millimeters (every reading is from the same zero):

station 1: $-0.004$ to $0.008$; station 2: $0.002$ to $0.017$; station 3: $-0.006$ to $0.004$.

**Circular runout at each station.** Station 1: $0.008 - (-0.004) = 0.012$. Station 2: $0.017 - 0.002 = 0.015$. Station 3: $0.004 - (-0.006) = 0.010$.

**Against circular runout $0.02$.** The worst station is $0.015 \le 0.02$. Pass.

**Total runout.** One number over the [[whole surface|runout-bars]]: highest reading anywhere, $0.017$, minus lowest anywhere, $-0.006$. That is $0.017 - (-0.006) = 0.023\,\mathrm{mm}$.

**Against total runout $0.02$.** $0.023 > 0.02$. Fail.

**What happened.** Station 2's readings sit higher than the others: the surface there is slightly farther from the axis. Each circle is nearly round and centered, but the seat bulges or bends along its length. Only total runout sees it.

**Sanity check.** The total ($0.023$) is bigger than every single station ($0.012$, $0.015$, $0.010$), as it must be: it takes the extremes of all of them together.
:::

Runout has two more rules worth knowing. It always needs a datum axis, because "spinning" means spinning about something. And it never takes Ⓜ or Ⓛ; it is always applied regardless of feature size. A spinning shaft gets no bonus: a bigger journal does not wobble any less.

Where does this matter on a spacecraft? Anywhere something turns. A **[[reaction wheel|wheel-jitter]]** spins a heavy rotor thousands of times a minute; a rotor seat that runs out makes the wheel shake the spacecraft. A gimbal that points an engine or an antenna turns on bearings whose seats must run true, or the gimbal binds and its friction changes as it turns. Lesson 6 said that runout usually replaces concentricity. Now you can see why: a dial indicator and one turn of the part answer the question the bearing actually asks.

## Check yourself

::: check
A machined bulkhead edge carries profile of a surface $0.5$, equal-bilateral, to A, B, C. At one point the CMM reports $+0.27$. Pass or fail? What is the largest deviation, either way, the edge may have?
:::

::: answer
An equal-bilateral zone of $0.5$ gives $\frac{0.5}{2} = 0.25$ on each side, so every point must lie between $-0.25$ and $+0.25$. The point at $+0.27$ is $0.02$ outside. The edge fails. The largest allowed deviation is $0.25\,\mathrm{mm}$, either proud or under.
:::

::: check
The same profile tolerance, $0.5$, is written three ways: with datums A, B, C; with datum A only; and with no datums. What does each one control?
:::

::: answer
With A, B and C the zone is fixed in place, so it controls form, orientation and location of the surface. With A only, the zone must keep its tilt and its distance relative to A but may slide sideways along A, so it controls form, orientation to A, and location only in the direction away from A. With no datums the zone may slide and tilt to fit, so it controls only form (and size, for a closed shape). The number is the same; what it promises is not.
:::

::: check
A drafter wants to tolerance a nose cone's curved outer skin with a table of plus-or-minus coordinates at forty stations. Give two reasons a profile of a surface callout is the better choice.
:::

::: answer
First, profile covers every point of the surface, not only forty stations, and it measures deviation perpendicular to the skin, the direction that makes a step or a bump in the airflow. Second, it states form, orientation and location in one frame against the model, with one number and one datum reference frame, instead of many square zones that stack. A third reason: in a model-based workflow the model is already the true profile, so a CMM can compare measured points to it directly.
:::

::: check
A shaft's seat is perfectly round but $0.008\,\mathrm{mm}$ off the datum axis. What circular runout does it show? Does it meet circular runout $0.015$?
:::

::: answer
FIM is twice the offset: $2 \times 0.008 = 0.016\,\mathrm{mm}$. Step by step, the indicator reads $+0.008$ on the near side and $-0.008$ half a turn later, and $0.008 - (-0.008) = 0.016$. That is more than $0.015$, so it fails — even though the offset, $0.008$, looks like it is well inside $0.015$.
:::

::: check
Three stations on a gimbal journal read $0.000$ to $0.010$, $0.004$ to $0.016$, and $-0.003$ to $0.006$. Check circular runout $0.015$ and total runout $0.015$.
:::

::: answer
Circular runout, station by station: $0.010 - 0.000 = 0.010$, $0.016 - 0.004 = 0.012$, $0.006 - (-0.003) = 0.009$. The worst is $0.012 \le 0.015$: pass. Total runout: highest anywhere $0.016$, lowest anywhere $-0.003$, so $0.016 - (-0.003) = 0.019 > 0.015$: fail. The journal is good circle by circle but not along its length.
:::

## Summary

| Control | Zone or test | Fact to carry |
| --- | --- | --- |
| True profile | perfect shape from basic dimensions or the model | no tolerance of its own |
| Profile of a surface | shell of width $t$ about the true surface | equal-bilateral: $\frac{t}{2}$ each side |
| Profile with A, B, C | zone locked to the part | form, orientation and location together |
| Profile with no datums | zone floats | form only |
| Profile of a line | two lines $t$ apart, each cross-section | slices checked separately |
| Circular runout | FIM at each circle, part rotated | catches off-center and out-of-round |
| Total runout | one FIM, indicator traversed | also catches taper and bend |
| Off-center surface | offset $e$ | $\text{FIM} = 2e$ |

Next lesson leaves the rigid, perfect setup behind: thin-wall parts that sag under their own weight, and how geometric tolerances add up in a stack-up that ends in a GNC error budget.

::: context true-profile The model is the drawing
On a model-based program the CAD surface is not a sketch of the intent; it is the intent. Every point on it is exact, as if it carried a basic dimension. That is what lets a single profile number stand for a whole curved skin: "stay within $0.4$ of this surface". The model's own accuracy then matters a great deal. If the model is wrong, the parts will be wrong in exactly the same way, all within tolerance. So programs control the model's revision as carefully as they once controlled paper drawings.
:::

::: context profile-zone-picture The zone that follows the curve
A curved skin in cross-section. The dashed blue line is the true profile; the two solid lines are the zone boundaries, $0.4$ out and $0.4$ in (sideways distances enlarged). The red dots are the eight CMM points from the example, joined up.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M 22.5 158.1 A 212 212 0 0 1 337.5 158.1" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <path d="M 40.3 174.2 A 188 188 0 0 1 319.7 174.2" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <path d="M 31.4 166.2 A 200 200 0 0 1 328.6 166.2" fill="none" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="6 4"/>
  <polyline points="28.7,163.8 72.6,142.4 106.9,105.2 154.8,90.1 203.7,102.9 246.5,122.9 295.9,130.0 323.7,170.6" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <circle cx="28.7" cy="163.8" r="3" fill="#b4232c"/>
  <circle cx="72.6" cy="142.4" r="3" fill="#b4232c"/>
  <circle cx="106.9" cy="105.2" r="3" fill="#b4232c"/>
  <circle cx="154.8" cy="90.1" r="3" fill="#b4232c"/>
  <circle cx="203.7" cy="102.9" r="3" fill="#b4232c"/>
  <circle cx="246.5" cy="122.9" r="3" fill="#b4232c"/>
  <circle cx="295.9" cy="130.0" r="3" fill="#b4232c"/>
  <circle cx="323.7" cy="170.6" r="3" fill="#b4232c"/>
  <text x="180" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">profile 0.8: boundaries 0.4 out and 0.4 in</text>
  <text x="180" y="48" font-size="11" text-anchor="middle" fill="#1d6fd1">dashed: true profile from the model</text>
  <text x="180" y="190" font-size="11" text-anchor="middle" fill="#b4232c">measured surface stays inside both</text>
</svg>
```

The zone is measured perpendicular to the curve everywhere, so it stays the same width on the steep ends as on the top.
:::

::: context unequal-profile More room on one side
Sometimes the two sides of a surface are not equally dangerous. A skin that sits under a seal may be allowed to sink a little but must never stand proud. Since the 2009 edition, Y14.5 lets the designer write a circled U after the tolerance, followed by how much of the zone lies on the "outside" (the side with more material). "Profile $0.8$ Ⓤ $0.2$" means $0.2$ outside and $0.6$ inside. A Ⓤ $0$ puts the whole zone inside the model's surface: the part may be smaller than the model, never bigger.
:::

::: context aerostructure-word Structure that flies
**Aerostructures** are the parts of an aircraft or rocket whose shape the air sees, or that carry the loads of flight: the outer skins and their stiffening frames, fairings, nose cones, wings and fins, and the rings that join stages. They are large, light and curved, and many are made of thin aluminum or carbon-fiber composite. Their outer shape sets the drag and heating; their fit sets whether panels meet without steps and gaps. Both are statements about curved surfaces, which is profile's natural job.
:::

::: context mbd-colour-map The color map
When a CMM or a laser scanner measures a part against its model, the software can paint the model with color: green where the surface is close to nominal, shading to red where it stands proud and blue where it sinks. Inspectors call this a deviation color map, or heat map. It is a direct picture of a profile check, with the tolerance zone as the color scale's limits. The last lesson of this module returns to MBD and to how the tolerances ride along inside the model file.
:::

::: context fim-word Full indicator movement
The **dial indicator** is a clock-faced gauge: push its plunger in by $0.01\,\mathrm{mm}$ and the needle moves one small division. For runout, only the needle's swing matters, not where it started, so the dial is usually zeroed on the part. Y14.5 calls the swing **full indicator movement**, FIM. Older drawings and shop talk still use **TIR**, total indicator reading, and FIR, full indicator reading, for the same thing. Electronic probes that log readings as the part turns have largely replaced the needle, but the idea and the name have stayed.
:::

::: context eccentric-picture Why off-center reads double
A round seat whose center (dot) sits $e$ from the datum axis (cross), drawn with $e$ hugely enlarged. As it turns, the surface under the indicator moves from $r + e$ to $r - e$ from the axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="135" cy="100" r="60" fill="#8fb8f0" fill-opacity="0.6" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="112" y1="100" x2="128" y2="100" stroke="#1f2a44" stroke-width="2"/>
  <line x1="120" y1="92" x2="120" y2="108" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="135" cy="100" r="3" fill="#1f2a44"/>
  <line x1="195" y1="100" x2="250" y2="100" stroke="#1f2a44" stroke-width="3"/>
  <rect x="250" y="80" width="40" height="40" rx="6" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <text x="270" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">indicator</text>
  <line x1="120" y1="170" x2="195" y2="170" stroke="#b4232c" stroke-width="1.5"/>
  <text x="158" y="188" font-size="11" text-anchor="middle" fill="#b4232c">now: r + e</text>
  <line x1="120" y1="30" x2="165" y2="30" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="143" y="22" font-size="11" text-anchor="middle" fill="#1d6fd1">half a turn later: r − e</text>
  <line x1="120" y1="35" x2="120" y2="175" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="230" y="30" font-size="12" fill="#1f2a44">FIM</text>
  <text x="230" y="46" font-size="12" fill="#1f2a44">= (r+e) − (r−e)</text>
  <text x="230" y="62" font-size="12" fill="#1f2a44">= 2e</text>
</svg>
```

A seat $0.015$ off-center swings the needle $0.030$.
:::

::: context runout-bars Three circles and the whole surface
Each bar is one station's readings, from lowest to highest, drawn on one shared scale. Circular runout is the length of each bar; total runout is the span from the lowest bottom to the highest top.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="120" x2="250" y2="120" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="34" y="124" font-size="11" text-anchor="end" fill="#6c7a93">0</text>
  <rect x="70" y="80" width="26" height="60" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="140" y="35" width="26" height="75" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="210" y="100" width="26" height="50" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="83" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">0.012</text>
  <text x="153" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">0.015</text>
  <text x="223" y="166" font-size="11" text-anchor="middle" fill="#1f2a44">0.010</text>
  <line x1="275" y1="35" x2="275" y2="150" stroke="#b4232c" stroke-width="2"/>
  <line x1="268" y1="35" x2="282" y2="35" stroke="#b4232c" stroke-width="2"/>
  <line x1="268" y1="150" x2="282" y2="150" stroke="#b4232c" stroke-width="2"/>
  <line x1="166" y1="35" x2="268" y2="35" stroke="#b4232c" stroke-width="1" stroke-dasharray="2 3"/>
  <line x1="236" y1="150" x2="268" y2="150" stroke="#b4232c" stroke-width="1" stroke-dasharray="2 3"/>
  <text x="290" y="90" font-size="12" fill="#b4232c">total</text>
  <text x="290" y="106" font-size="12" fill="#b4232c">0.023</text>
  <text x="153" y="20" font-size="11" text-anchor="middle" fill="#1f2a44">stations 1, 2, 3 along the shaft</text>
</svg>
```

Drawn to scale. Every bar passes $0.02$ alone; together they do not.
:::

::: context wheel-jitter Why a wobbling wheel matters
A reaction wheel is a heavy flywheel that the spacecraft spins faster or slower to turn itself the other way. If the rotor's mass is not centered on its spin axis, it pushes the spacecraft around once per revolution, a small shaking that attitude engineers call **jitter**. A space telescope or a camera pointing at a target feels that shaking directly. Runout on the rotor seat and bearing journals is one of the mechanical controls that keeps the rotor centered, alongside balancing the finished wheel. You will meet jitter again in the attitude control modules, as a disturbance the controller cannot fully cancel.
:::
