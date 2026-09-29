---
id: l04-form-controls
title: 'Form: flat, straight, round and cylindrical'
minutes: 20
covers:
  - 'Form: flatness, straightness, circularity, cylindricity'
---

Lay a ruler on your kitchen table and look along it toward a light. If the table is flat, no light gets under the ruler. If a slit of light shows in the middle, the table sags. You have just checked **form** — the shape of a surface all by itself, with no reference to anything else on the part.

Form is the simplest family of GD&T controls. It asks four plain questions. Is this face flat? Is this line straight? Is this cross-section round? Is this whole shaft a true cylinder? None of those questions needs a datum. A table can be perfectly flat while standing crooked in the room. A pencil can be perfectly straight while lying at any angle. Shape alone has no "relative to what".

On a spacecraft, form is quiet but everywhere. The face a star tracker bolts onto must be flat, or the tracker rocks onto whichever three high spots it finds. A reaction wheel's bearing seat must be round and cylindrical, or the bearing runs rough. In the last two lessons you built datums from real surfaces. This lesson is about the shape of those surfaces themselves.

## The idea of a form zone

Every GD&T control works the same way: the drawing describes a **tolerance zone**, a region of space, and the real feature must fit inside it. For form controls the zone is made from two perfect shapes with a gap between them. The feature must squeeze into the gap.

The number in the feature control frame is the size of that gap. The zone may slide and tip any way it likes to swallow the feature — nothing ties it to a datum. That freedom is what makes it a *form* control.

Form is not the same as **[[surface roughness|roughness-vs-form]]**, the fine scratchy texture a cutting tool leaves. Roughness is tiny ripples you feel with a fingernail. Form is the overall shape you see with a straightedge.

::: key Form controls take no datums
Flatness, straightness, circularity and cylindricity control shape alone. Their feature control frames have two compartments — symbol and tolerance — and no datum references, because the zone may sit at any location and any angle.
:::

## Flatness: two parallel planes

**Flatness** — how nearly a surface is a perfect plane. Its symbol is a small parallelogram, like a tilted tile.

The zone is **[[two parallel planes|flatness-zone]]** a distance $t$ apart. Read $t$ as "tee", the tolerance. The whole real surface — every hill, every valley — must lie between those two planes. The planes may tilt any way that helps.

A frame reading `| ▱ | 0.02 |` says: "Flatness, within zero point zero two." The face must fit between two parallel planes $0.02\,\mathrm{mm}$ apart. That is about a quarter of the thickness of a sheet of paper.

How does an inspector check it? A simple way: rest the part on three adjustable supports on a surface plate, adjust them until the face is roughly level, then run a **[[dial indicator|dial-indicator]]** across the face and record the heights. The flatness is the highest reading minus the lowest.

::: example Checking a tracker seat for flatness
A star tracker bracket's seat is called out flat within $0.02\,\mathrm{mm}$. The inspector levels it and records nine heights across the face, in millimeters, relative to the first reading's zero:

$0.004,\ 0.011,\ -0.003,\ 0.007,\ 0.000,\ 0.013,\ 0.002,\ -0.005,\ 0.009$

**Find the highest point.** The biggest number is $0.013$.

**Find the lowest point.** The most negative number is $-0.005$.

**Subtract.** $0.013 - (-0.005) = 0.013 + 0.005 = 0.018\,\mathrm{mm}$. Subtracting a negative number adds it.

**Compare.** $0.018 \le 0.020$, so the seat passes, with $0.002\,\mathrm{mm}$ to spare.

**Sanity check.** Nine readings that all sit within about two hundredths of each other, on a face that must stay within two hundredths. Close to the limit, but inside it. On a real inspection the inspector would take many more points, because a high spot between the nine points would be missed.
:::

::: warning Leveling matters
If the face is not leveled first, a perfectly flat but tilted face shows a big range: a tilt of $0.05\,\mathrm{mm}$ across the face reads as $0.05$ of "unflatness". The zone is allowed to tip, so the tilt must be removed before you subtract. A coordinate measuring machine does this in software by finding the best-tilted pair of planes, the one with the smallest gap.
:::

A flat primary datum face matters for the reason you saw in the datums lesson: a warped face rocks onto different high points in different setups. So drawings very often put a flatness control on datum feature A.

## Straightness: two parallel lines, or a thin cylinder

**Straightness** — how nearly a line on the part is a perfect straight line. Its symbol is a short horizontal bar.

Straightness comes in two flavors, and the feature control frame tells you which.

**Straightness of a surface line.** The frame points at a surface, drawn in a view where that surface shows as a line — say, the side of a shaft. Now picture slicing the shaft lengthwise. Each line along the surface, one slice at a time, must lie between two parallel lines $t$ apart. Each line is checked on its own. This is the ruler-and-light test.

**Straightness of an axis.** The frame sits next to the size dimension, and its tolerance carries a diameter sign: `| ⏤ | ⌀0.05 |`. Now it controls the **[[derived median line|derived-median-line]]** — the curve you get by joining the centers of every cross-section of the shaft. That center line must fit inside a cylinder $0.05\,\mathrm{mm}$ in diameter. A banana-shaped pin fails. A pin that is round but slightly wavy along its length may pass.

::: key Straightness
Straightness of a surface line element: each line lies between two parallel lines $t$ apart. Straightness of a derived median line (tolerance with $\varnothing$): the axis lies inside a cylinder of diameter $t$.
:::

## Circularity: two concentric circles

**Circularity** — how nearly each cross-section of a round feature is a perfect circle. It used to be called **roundness**. Its symbol is a plain circle.

Slice a shaft straight across. Look at the slice. The zone is **two concentric circles** — circles with the same center — whose radii differ by $t$. The slice's outline must fit in the ring between them. The circles may sit anywhere; only the gap counts. And each slice is judged separately: one slice may be centered a little off from the next, and circularity does not care.

::: example Circularity from radius readings
A bearing seat is $\varnothing\,24\,\mathrm{mm}$ with circularity $0.015\,\mathrm{mm}$. The part turns on a precision spindle, lined up so the spindle axis sits at the center of the circles that best fit this slice. A probe reads the radius every $45^\circ$:

$12.004,\ 11.998,\ 12.006,\ 11.995,\ 12.003,\ 11.999,\ 12.007,\ 11.996$

**Largest radius.** $12.007\,\mathrm{mm}$.

**Smallest radius.** $11.995\,\mathrm{mm}$.

**Radial gap.** $12.007 - 11.995 = 0.012\,\mathrm{mm}$. That is the width of the ring that just holds the outline.

**Compare.** $0.012 \le 0.015$. This slice passes. The inspector repeats it at other heights along the seat.

**Sanity check.** Every reading sits within about $\pm 0.006$ of $12.000$, so a ring about $0.012$ wide is what you would expect.
:::

::: warning A micrometer can be fooled
A micrometer measures a **two-point diameter** — the distance across between two opposite points. Some shapes have the same two-point diameter in every direction and still are not round. A part with three bumps, or **[[lobes|lobing]]**, is the classic case: a bump on one side always faces a dip on the other, so every measurement across reads the same. Circularity is judged by radius from a center, which catches the lobes. Measuring across with a micrometer does not.
:::

## Cylindricity: two coaxial cylinders

**Cylindricity** — how nearly a whole round surface is a perfect cylinder. Its symbol is a circle between two slanted lines.

The zone is **two coaxial cylinders** — cylinders sharing one axis — with radii differing by $t$. The *entire* surface, top to bottom, must fit between them at once.

That makes cylindricity the strict big sibling of circularity. Circularity lets each slice pick its own center. Cylindricity makes every slice share one axis. So cylindricity catches everything circularity catches, plus:

- **taper** — a shaft fatter at one end, like a carrot;
- **barrel** or **waist** — fatter or thinner in the middle;
- **bend** — the axis bowing like a banana.

Think of it as circularity, straightness and taper wrapped into one control.

::: key The four form zones
Flatness: two parallel planes $t$ apart. Straightness: two parallel lines $t$ apart (or a cylinder of diameter $t$ for an axis). Circularity: two concentric circles, radii differing by $t$, each cross-section separately. Cylindricity: two coaxial cylinders, radii differing by $t$, the whole surface at once.
:::

::: warning Circularity 0.01 is not "diameter within 0.01"
A circularity tolerance of $0.01$ is a *radial* gap. In diameter terms, a shape that fills the ring could measure up to $0.02$ larger across one way than another (twice the radial gap). Keep radius and diameter apart when you compare numbers.
:::

## How form relates to size: Rule #1

In the drawings module, a shaft might be dimensioned $\varnothing\,10.00$ to $10.10\,\mathrm{mm}$. That size limit seems to be only about *diameter*. But under Y14.5 it quietly controls form too. The rule is so basic it is called **Rule #1** ("rule number one"), or the **envelope principle**.

Picture a pin sliding into a perfectly straight, perfectly round tube whose bore is exactly the largest allowed pin size, $10.10\,\mathrm{mm}$. Rule #1 says the pin must always fit in that tube. The tube is the **[[envelope of perfect form|rule-one-envelope]]** at **maximum material condition** — MMC, the size with the most metal, which for a pin is its largest size.

What follows?

- A pin made at exactly $10.10$ fills the tube. It has no room to bend, so it must be perfectly straight and round.
- A pin made at $10.04$ has $10.10 - 10.04 = 0.06\,\mathrm{mm}$ of room. It may bow by up to $0.06$ and still slide in.
- A pin made at $10.00$, the smallest size, may bow by up to $0.10$.

For a hole it is the same idea, turned inside out. A perfect pin at the hole's smallest size — its MMC — must always slide in.

::: key Rule #1, the envelope principle
Unless the drawing says otherwise, a feature of size must not break a boundary of perfect form at maximum material condition. The size limits therefore also limit form: the further the feature is made from MMC, the more form error it may have.
:::

::: example How much a pin may bend
A pin is $\varnothing\,10.00$ to $10.10\,\mathrm{mm}$. It is made at a diameter of $10.04\,\mathrm{mm}$ all along its length. How far may its axis bow and still obey Rule #1?

**The envelope.** A perfect cylinder of $\varnothing\,10.10$, the MMC size.

**The room left over.** $10.10 - 10.04 = 0.06\,\mathrm{mm}$ across the diameter.

**What the bend uses.** If the axis bows by an amount $b$, the pin sweeps out a width of $10.04 + b$. It must stay within $10.10$, so $b \le 0.06\,\mathrm{mm}$.

**Adding a tighter control.** If the pin must stay straight within $\varnothing\,0.02$, the designer adds a straightness frame on the axis. Now the pin at $10.04$ may bow only $0.02$, even though Rule #1 alone would allow $0.06$.

**Sanity check.** At $10.10$ the room is zero and the pin must be perfect; at $10.00$ it is $0.10$. The allowed bend grows as the pin gets thinner, which is what "the envelope is fixed" means.
:::

That last step shows the design logic. A surface form control on a feature of size is useful only when it is *tighter* than the size tolerance. A circularity of $0.2$ on a pin whose size range is $0.1$ adds nothing, because Rule #1 already holds it tighter. The one exception is straightness of the axis, written with ⌀ in the frame: it replaces Rule #1's perfect-form envelope for that feature, so it may be larger than the size tolerance and let the pin bend beyond its maximum-material boundary, up to its virtual condition.

::: warning Rule #1 does not cover flatness of a plain face
Rule #1 applies to **features of size** — things with two opposed surfaces you can measure across, like a pin, a hole or the thickness of a plate. A single face on its own, like a bracket's mounting face, has no size to hang an envelope on. If it must be flat, the drawing must say so with a flatness frame.
:::

The next lesson picks up where form stops. Form says a face is flat. **[[Orientation|form-to-bridge]]** says that flat face is also square to something else — and that is where datums return.

## Check yourself

::: check
Why does a flatness feature control frame never show a datum letter, while the datums lesson said every measurement starts from a datum reference frame?
:::

::: answer
Flatness asks only whether the surface is a good plane. The two parallel planes of the zone are free to sit at any height and any tilt, so no reference is needed to place them. The datum reference frame matters for controls that say *where* or *at what angle* a feature must be, like orientation and position. Shape alone has no "relative to what".
:::

::: check
An inspector levels a face and reads heights of $0.006$, $-0.008$, $0.002$, $0.010$ and $-0.001\,\mathrm{mm}$. The face is called out flat within $0.015$. Does it pass?
:::

::: answer
Highest reading $0.010$, lowest $-0.008$. Flatness $= 0.010 - (-0.008) = 0.018\,\mathrm{mm}$. That is more than $0.015$, so on these readings it fails. If the leveling was only rough, the inspector could fit the best-tilted planes before deciding, since the zone may tip; the tilt must not be counted as unflatness.
:::

::: check
A shaft is inspected at four heights. Every cross-section is a perfect circle, but the diameters are $20.00$, $20.02$, $20.04$ and $20.06\,\mathrm{mm}$ from bottom to top. Does it pass circularity $0.01$? Would it pass cylindricity $0.01$?
:::

::: answer
Circularity judges each slice alone. Each slice is a perfect circle, so every slice passes. Cylindricity needs the whole surface between two coaxial cylinders whose radii differ by $0.01$. The radius grows from $10.00$ to $10.03$, a radial change of $0.03\,\mathrm{mm}$. So the zone would need to be at least $0.03$ wide. It fails cylindricity. This shaft has pure taper, which circularity cannot see.
:::

::: check
A hole is $\varnothing\,8.00$ to $8.05\,\mathrm{mm}$. It is made at $8.03$ all along. Under Rule #1, what perfect pin must still pass through it, and how much may the hole's axis bow?
:::

::: answer
The envelope for a hole is a perfect pin at the hole's MMC, its smallest size: $\varnothing\,8.00$. The hole was made $8.03$, so there is $8.03 - 8.00 = 0.03\,\mathrm{mm}$ of room. The axis may bow up to $0.03\,\mathrm{mm}$ and the $8.00$ pin still slides through.
:::

::: check
Why can a micrometer pass a part that fails circularity?
:::

::: answer
A micrometer measures across, between two opposite points. On a lobed shape, each bump faces a dip on the far side, so the distance across comes out the same in every direction. Circularity measures how the *radius* changes around a center, and on a lobed part the radius swings up and down with each lobe. So the micrometer reads a constant diameter while the part is not round.
:::

## Summary

| Control | Zone | Datums? |
| --- | --- | --- |
| Flatness | two parallel planes $t$ apart | never |
| Straightness, line | two parallel lines $t$ apart, each line element | never |
| Straightness, axis | cylinder of diameter $t$ around the derived median line | never |
| Circularity | two concentric circles, radial gap $t$, each slice | never |
| Cylindricity | two coaxial cylinders, radial gap $t$, whole surface | never |
| Rule #1 | perfect-form envelope at MMC | limits form through size |

Next lesson brings the datums back: perpendicularity, angularity and parallelism, and the small-angle geometry that turns a tilted thruster seat into a torque on the spacecraft.

::: context roughness-vs-form Texture versus shape
Every machined surface has several layers of imperfection. Up close are the tool marks: tiny grooves a few thousandths of a millimeter deep, called roughness, and specified with a surface finish symbol from the drawings module. Farther out is waviness, gentle ripples from vibration. Farthest out is form: the overall bow, twist or lobing of the whole surface. Flatness, straightness, circularity and cylindricity are about that big picture. A mirror-smooth surface can still be badly out of flat, and a rough cast surface can be very flat.
:::

::: context flatness-zone The surface between two planes
Seen edge-on, the flatness zone is two parallel lines $t$ apart. The real surface wanders up and down, but every point stays inside. The zone is free to tip, so it is lined up with the surface, not with the part's edges.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="50" x2="330" y2="50" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="30" y1="90" x2="330" y2="90" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <path d="M 30 72 C 60 58, 80 60, 110 78 S 160 88, 190 66 S 240 54, 270 74 S 310 86, 330 70 L 330 130 L 30 130 Z" fill="#8fb8f0" fill-opacity="0.5" stroke="#1f2a44" stroke-width="2"/>
  <line x1="340" y1="50" x2="340" y2="90" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="334" y1="50" x2="346" y2="50" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="334" y1="90" x2="346" y2="90" stroke="#b4232c" stroke-width="1.5"/>
  <text x="318" y="74" font-size="13" fill="#b4232c">t</text>
  <text x="30" y="36" font-size="11" fill="#1d6fd1">two parallel planes, seen edge-on</text>
  <text x="180" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">real surface (bumps exaggerated)</text>
</svg>
```

The bumps are drawn thousands of times larger than life.
:::

::: context dial-indicator A clock face for tiny heights
A dial indicator is a small gauge with a spring-loaded plunger and a needle on a round dial. Push the plunger up by a thousandth of a millimeter and the needle swings visibly. Mounted on a stand and slid across a part that rests on a surface plate, it shows how the height changes from spot to spot. It does not measure absolute height; it measures differences, which is exactly what flatness needs. The same tool, held against a spinning shaft, measures runout, which you will meet later in this module.
:::

::: context derived-median-line The line through the middles
Cut a shaft into many thin slices, like a salami. Each slice has a center: the center of the circle that best fits its outline. Join all those centers from one end to the other and you get a line that may wiggle a little. That line is the derived median line. "Derived" means it is computed from measured points, not a surface you can touch. Straightness with a diameter sign controls this line, and several other controls in this module — position of a hole, for one — act on axes derived the same way.
:::

::: context lobing Round in every direction you measure
A three-lobed outline, drawn far out of proportion. Its distance straight across is the same in every direction, so a micrometer reads one steady number. But its radius from the center goes up and down three times each turn, so it sits in a thick ring between two concentric circles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="110" cy="100" r="68.5" fill="none" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 3"/>
  <circle cx="110" cy="100" r="55.5" fill="none" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 3"/>
  <polygon points="176.8,100.0 177.1,105.9 176.3,111.7 174.3,117.2 171.2,122.3 167.4,126.8 163.2,130.7 158.9,134.2 154.8,137.6 150.8,140.8 147.0,144.2 143.2,147.4 139.1,150.4 134.7,153.1 130.1,155.2 125.2,156.9 120.3,158.3 115.2,159.5 110.0,160.8 104.6,162.0 98.9,163.0 93.0,163.5 87.1,163.0 81.3,161.5 76.1,158.8 71.5,155.0 67.6,150.5 64.4,145.6 61.6,140.6 59.1,135.7 56.8,130.7 54.8,125.7 53.3,120.6 52.3,115.5 51.9,110.2 52.2,105.1 52.8,100.0 53.5,95.1 54.1,90.2 54.5,85.1 54.7,79.9 55.0,74.4 55.8,68.7 57.3,63.1 59.8,57.8 63.2,53.2 67.3,49.2 72.1,45.8 77.1,43.0 82.3,40.7 87.7,38.7 93.2,37.1 98.7,36.2 104.4,36.0 110.0,36.8 115.4,38.5 120.4,40.9 125.1,43.7 129.5,46.5 133.7,49.1 138.1,51.4 142.6,53.4 147.3,55.5 152.0,58.0 156.6,60.9 160.7,64.5 164.2,68.7 167.2,73.3 169.8,78.2 172.0,83.4 174.0,88.7 175.7,94.3" fill="#8fb8f0" fill-opacity="0.5" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="110" cy="100" r="2.5" fill="#1f2a44"/>
  <text x="200" y="70" font-size="12" fill="#1f2a44">three lobes</text>
  <text x="200" y="100" font-size="12" fill="#1d6fd1">dashed: circularity zone</text>
  <text x="200" y="130" font-size="12" fill="#b4232c">width across: the same</text>
  <text x="200" y="146" font-size="12" fill="#b4232c">in every direction</text>
</svg>
```

Lobing is common from centerless grinding, which is why good inspection rotates the part against a precise center instead of measuring across it.
:::

::: context rule-one-envelope The pin inside its tube
A pin made smaller than MMC may bend, as long as it still fits inside a perfect tube at the MMC size. The thinner the pin, the more it may bend.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="40" width="300" height="70" fill="#ffffff" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="7 4"/>
  <path d="M 30 54 Q 180 26 330 54 L 330 106 Q 180 78 30 106 Z" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="180" y="30" font-size="11" text-anchor="middle" fill="#1d6fd1">envelope: perfect cylinder at MMC, ⌀10.10</text>
  <text x="180" y="72" font-size="11" text-anchor="middle" fill="#1f2a44">pin ⌀10.04, bowed</text>
  <line x1="342" y1="40" x2="342" y2="110" stroke="#1f2a44" stroke-width="1"/>
  <line x1="336" y1="40" x2="348" y2="40" stroke="#1f2a44" stroke-width="1"/>
  <line x1="336" y1="110" x2="348" y2="110" stroke="#1f2a44" stroke-width="1"/>
  <text x="180" y="132" font-size="11" text-anchor="middle" fill="#b4232c">bow may use the 0.06 of room left over</text>
</svg>
```

Engineers also call this the Taylor principle; a "go" gauge shaped like the tube checks it in one push.
:::

::: context form-to-bridge Where form comes back
Form keeps returning in this module. Flatness on a primary datum face makes the three-point setup repeatable. Orientation, next lesson, puts its own zone relative to a datum and so limits form as a side effect. Profile of a surface, later, controls form, orientation and location in one frame. And in the error-budget lessons, the flatness of a star tracker seat becomes one line in the list of things that can tilt the tracker.
:::
