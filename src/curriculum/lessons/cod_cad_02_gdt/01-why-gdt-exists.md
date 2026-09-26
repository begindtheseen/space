---
id: l01-why-gdt-exists
title: Why GD&T exists, and how to read a feature control frame
minutes: 22
covers:
  - 'Why GD&T exists: coordinate tolerancing makes square zones and ambiguous setups'
  - Anatomy of a feature control frame
---

Think about a game of darts. The bullseye is a small circle. A dart that lands a little to the left scores the same as one a little up, or a little down and to the right. What matters is *how far* from the center the dart lands, not which direction it missed in. Nobody would draw the scoring region as a square.

Now picture a drawing of a metal bracket with a hole in it. The hole is placed "50 mm from the left edge, plus or minus 0.1" and "30 mm up from the bottom, plus or minus 0.1". Without meaning to, that drawing has drawn a square bullseye. And it never said which edge to measure from if the edges themselves are a little crooked.

This lesson is about the fix. **Geometric Dimensioning and Tolerancing**, or **GD&T** — a symbol language that says what a part must *do*, not just where its edges are — is written down in a standard called **[[ASME Y14.5|asme-y145]]**. For a guidance, navigation and control (GNC) engineer it matters for a practical reason: when the attitude team says a star tracker may be tilted no more than a few hundredths of a degree, the mechanical drawing is where that promise is actually written. It is written in GD&T.

## The square zone hiding in plus-or-minus

In the drawings module you met **plus-or-minus tolerancing**, also called **coordinate tolerancing**: each dimension gets a nominal value and an allowed spread, like $50 \pm 0.1$. Read it aloud as "fifty, plus or minus one tenth". It means any measured value from $49.9$ to $50.1\,\mathrm{mm}$ is acceptable.

Put two of those on one hole. The center of the hole must have its $x$ between $49.9$ and $50.1$, *and* its $y$ between $29.9$ and $30.1$. Draw every allowed position for the center and you get a square, $0.2\,\mathrm{mm}$ on a side. That region — the set of places a feature is allowed to be — is called a **tolerance zone**.

Now ask what the hole is *for*. Say a bolt passes through it into a mating part. The bolt has some clearance around it. If the hole's center drifts $0.12\,\mathrm{mm}$ to the right, the bolt still fits, and it would still fit if the same drift pointed up, or down, or diagonally. The bolt does not care about $x$ and $y$ separately. It cares about the straight-line distance from where the hole should be — its **true position**, the exact, perfect location on the drawing — to where the hole really is. Everything at the same distance works equally well. The set of "good enough" places is a **circle**, just like the dartboard.

So the square is the wrong shape. And the mismatch is not small. The square's corners are farther from the center than its edges are. A hole at the corner of the square, off by $0.1$ in $x$ *and* $0.1$ in $y$, is really off by

$$
\sqrt{0.1^2 + 0.1^2} = 0.1414\,\mathrm{mm}
$$

in a straight line (Pythagoras). The drawing accepts that part. So the design must work with a hole $0.141\,\mathrm{mm}$ off — and if it works in the corner direction, it works in *every* direction, because the bolt cannot tell directions apart. The honest zone is the circle that passes through the square's four corners: radius $0.141\,\mathrm{mm}$, so diameter $0.283\,\mathrm{mm}$.

::: key The square versus the round zone
Plus-or-minus $t$ on both $x$ and $y$ gives a square zone $2t$ on a side. The circle through its corners has radius $\sqrt{2}\,t$ and area $\frac{\pi}{2}$ times the square's — about $57\%$ more. Every part in that extra area works just as well as the ones the square already accepts.
:::

::: example How much good hardware the square throws away
A hole is located $\pm 0.1\,\mathrm{mm}$ in $x$ and in $y$. Compare the square zone with the [[round zone through its corners|square-in-circle]].

**The square.** Side $2 \times 0.1 = 0.2\,\mathrm{mm}$. Area $0.2 \times 0.2 = 0.04\,\mathrm{mm^2}$.

**The circle's radius.** It reaches the corner, which is $0.1$ across and $0.1$ up: $r = \sqrt{0.1^2 + 0.1^2} = 0.1414\,\mathrm{mm}$. The diameter is $2 \times 0.1414 = 0.283\,\mathrm{mm}$.

**The circle's area.** $\pi r^2 = 3.1416 \times 0.02 = 0.0628\,\mathrm{mm^2}$. (Notice $r^2 = 0.1^2 + 0.1^2 = 0.02$ exactly, so no rounding sneaks in.)

**Compare.** $0.06283 / 0.04 = 1.571$. The round zone is $57\%$ bigger.

**Sanity check.** The circle contains the whole square, so it must be bigger. And it cannot be twice as big: the four curved slivers outside the square are thin. About one and a half times is right.

**What it means on the shop floor.** If the machine's errors scatter the hole evenly around the target, the square rejects parts that would have bolted up perfectly. Those parts get scrapped, reworked or argued over, and every one of them was fine.
:::

::: note Why the ratio is always π/2
Call the plus-or-minus amount $t$. The square has side $2t$, so its area is $4t^2$. The circle through its corners has radius $\sqrt{t^2 + t^2} = \sqrt{2}\,t$, so its area is $\pi(\sqrt{2}\,t)^2 = 2\pi t^2$. Divide: $\frac{2\pi t^2}{4t^2} = \frac{\pi}{2} \approx 1.571$. The $t$ cancels, so the answer is the same for $\pm 0.01$ or $\pm 1$. It is a fact about squares and circles, not about any one part.
:::

::: example A hole the square rejects and the circle accepts
An inspector finds a hole's center $0.12\,\mathrm{mm}$ to the right of true position and $0.02\,\mathrm{mm}$ above it. The drawing says $\pm 0.1$ in each direction.

**Coordinate check.** $0.12$ is more than $0.1$. The part fails.

**Distance check.** The straight-line miss is $\sqrt{0.12^2 + 0.02^2} = \sqrt{0.0148} = 0.1217\,\mathrm{mm}$.

**Round-zone check.** A round zone of diameter $0.283$ has radius $0.141$. Since $0.1217 < 0.141$, the hole's center is inside. It passes.

**In GD&T words.** GD&T reports the miss as the diameter of the smallest round zone that would hold the center: $2 \times 0.1217 = 0.243\,\mathrm{mm}$. That is less than $0.283$, so it passes.

**Sanity check.** This hole is closer to true position ($0.122$) than a corner-of-the-square hole ($0.141$) that the old drawing happily accepts. Rejecting it was never about function.
:::

::: warning Plus-or-minus 0.1 is not a round zone of diameter 0.2
People convert "$\pm 0.1$" into "a round zone of $0.2$" because the numbers look alike. But a circle of diameter $0.2$ fits *inside* the square — it rejects the corners the old drawing accepted. The circle that keeps every part the square accepted has diameter $0.283$. Which one you choose is a design decision; make it on purpose, not by copying digits.
:::

## The ambiguous setup

The square zone is the first problem. The second is sneakier. A plus-or-minus dimension says "$80$ from the left edge", but a real edge is never perfectly straight or perfectly square to the bottom. So *which* part of the edge do you measure from?

Picture measuring your height against a door frame that leans a little. Stand at the bottom hinge side or at the top latch side and you get different numbers. Nobody lied. The frame just never promised to be straight, and nobody said where to put the ruler.

::: example Three honest inspectors, three answers
A plate's left edge is $100\,\mathrm{mm}$ tall. It leans: its top sits $0.10\,\mathrm{mm}$ farther left than its bottom corner. A hole is dimensioned $80 \pm 0.08\,\mathrm{mm}$ from the left edge, $60\,\mathrm{mm}$ up from the bottom. The hole was machined exactly $80.00\,\mathrm{mm}$ from the bottom corner. [[Three inspectors measure it|leaning-edge]].

**Inspector 1** measures from the bottom corner: $80.00\,\mathrm{mm}$. Pass.

**Inspector 2** measures straight across at the hole's own height. At $60\,\mathrm{mm}$ up the edge has leaned $\frac{60}{100} \times 0.10 = 0.06\,\mathrm{mm}$ farther left. Reading: $80.06\,\mathrm{mm}$. Pass, barely.

**Inspector 3** stands the plate on a flat table and slides its left edge against an upright fence. The fence touches the edge's leftmost point, the top corner, $0.10\,\mathrm{mm}$ out. Reading: $80.10\,\mathrm{mm}$. Fail, because $80.10 > 80.08$.

**Sanity check.** The three answers differ by exactly the lean, $0.10\,\mathrm{mm}$, which is bigger than the whole tolerance band's half-width. The part did not change. Only the setup changed.
:::

On a real program this becomes a fight. The machine shop says the part is good. Receiving inspection says it is bad. Both followed the drawing. The drawing was the problem.

## What GD&T does instead

GD&T fixes both problems at once.

- **It gives the zone the shape the function needs.** A hole that takes a bolt gets a round (really, cylindrical) zone. A face that must sit flat gets a zone between two parallel planes. The zone matches what the part does.
- **It says exactly how to hold the part while measuring.** The drawing names certain real surfaces as **datum features** — the surfaces the part is located from — and says in what order to seat them. From them come ideal planes and axes, the **datum reference frame**, that every measurement starts from. The machinist and the inspector build the *same* frame, so they get the same answer. The next lesson builds this frame from scratch.

The perfect location is given by **[[basic dimensions|basic-dimension]]** — numbers drawn inside a rectangle, like $\boxed{80}$, which are exact, with no plus-or-minus of their own. The allowed error is not attached to the dimension at all. It lives in one place: a small boxed sentence called a feature control frame.

::: key Why GD&T exists
Plus-or-minus coordinate tolerancing creates square tolerance zones that do not match how a round feature actually functions, and leaves the inspection setup ambiguous. GD&T states the functional requirement and fixes the datum reference frame, so designer, machinist and inspector agree.
:::

## Reading a feature control frame

A **feature control frame** is a row of boxes attached to a feature by a leader arrow. It is one complete sentence about that feature. You read it left to right, box by box, and each box — each **compartment** — has one job. Here is the most common one on any bracket, [[drawn out box by box|fcf-picture]]:

`| ⌖ | ⌀0.2 Ⓜ | A | B | C |`

(Each vertical bar is a wall between boxes. The first box holds the position symbol ⌖, a small circle with a cross through it.)

**Box 1 — the geometric characteristic symbol.** What kind of control this is. The position symbol ⌖ says "this controls location". There are about a dozen symbols, in five families. You will meet each family in its own lesson:

| Family | Symbols it contains | Controls |
| --- | --- | --- |
| Form | flatness, straightness, circularity, cylindricity | shape alone, no datums |
| Orientation | perpendicularity, angularity, parallelism | tilt relative to datums |
| Location | position, concentricity, symmetry | where a feature sits |
| Profile | profile of a line, profile of a surface | a whole outline or surface |
| Runout | circular runout, total runout | wobble when spun on an axis |

**Box 2 — the tolerance compartment.** Three things, in this order:

1. *The zone shape.* The diameter sign ⌀ (read "diameter") means the zone is round — a cylinder around the true axis. No ⌀ means the zone is the space between two parallel lines or planes, and the number is their distance apart.
2. *The zone size*, in the drawing's units: here $0.2\,\mathrm{mm}$.
3. *A material condition modifier*, if any. Ⓜ (read "at M-M-C") means **[[maximum material condition|mmc-meaning]]**, MMC — the size at which the feature holds the most material: the smallest hole or the largest pin. Ⓛ means least material condition, LMC, the opposite. No modifier means **regardless of feature size**, RFS: the number stays fixed. A later lesson shows how Ⓜ lets the zone grow.

**Boxes 3, 4, 5 — the datum references**, in order of **precedence**: the **primary** datum first, then **secondary**, then **tertiary**. The order is *not* alphabetical. It is the order the part is seated in, and it changes the answer — lesson 3 proves it with numbers. Each datum letter may carry its own modifier.

Read the whole frame aloud as one sentence: *"Position, within a diameter of zero point two at maximum material condition, relative to datum A primary, B secondary, C tertiary."*

::: key Anatomy of a feature control frame
Geometric characteristic symbol, then the tolerance zone shape and size (with a diameter symbol if cylindrical) and any material-condition modifier, then the datum references in order of precedence with their own modifiers.
:::

What does that sentence *permit*? Say it slowly, one piece at a time. The hole's axis — the imaginary center line running through it — must lie inside a cylinder. The cylinder is $0.2\,\mathrm{mm}$ across. The cylinder's center sits exactly at the basic dimensions, measured in the frame built from A, then B, then C. And because of Ⓜ, if the hole is made bigger than its smallest allowed size, the cylinder gets bigger by the same amount — a bigger hole leaves more room around the bolt.

::: key Position ⌀0.2 at MMC to A, B, C
The feature axis must lie within a cylindrical zone of $0.2\,\mathrm{mm}$ diameter located exactly at the basic dimensions in the datum reference frame A primary, B secondary, C tertiary, and that zone grows by the amount the feature departs from maximum material condition.
:::

::: warning A frame with no datums is not broken
Form controls — flatness, straightness, circularity, cylindricity — have only two boxes: symbol and tolerance. A flatness frame of $0.05$ says the surface must lie between two parallel planes $0.05\,\mathrm{mm}$ apart, *wherever they sit*. Shape alone needs no reference. Do not go hunting for missing datum letters.
:::

::: warning Diameter or width
Position $\varnothing\,0.2$ allows the axis to wander $0.1\,\mathrm{mm}$ from true position — half the diameter. Position $0.2$ with no ⌀ is a band $0.2\,\mathrm{mm}$ wide, also $0.1$ each side, but only in one direction. Read the ⌀ before you read the number.
:::

## Where this lives on a spacecraft

A star tracker is a small camera that recognizes star patterns to tell the vehicle which way it points. If its mounting seat is tilted, every attitude it reports is off by that tilt. The GNC team writes that down in an **[[error budget|error-budget]]** — a list of how much each source may contribute. The mechanical team turns the tracker's share into feature control frames: an orientation control on the seat, a position control on the bolt holes, a flatness control on the face. Late in this module you will do that conversion yourself. Everything in between is learning to read and write those frames.

## Check yourself

::: check
A drawing locates a pin $\pm 0.05\,\mathrm{mm}$ in $x$ and $\pm 0.05\,\mathrm{mm}$ in $y$. What is the diameter of the round zone through the corners of that square, and how much bigger is its area?
:::

::: answer
The corner is $0.05$ across and $0.05$ up, so its distance from the center is $\sqrt{0.05^2 + 0.05^2} = 0.0707\,\mathrm{mm}$. That is the radius, so the diameter is $2 \times 0.0707 = 0.141\,\mathrm{mm}$. The area ratio is always $\frac{\pi}{2} \approx 1.57$: square $0.1 \times 0.1 = 0.01\,\mathrm{mm^2}$, circle $\pi \times 0.0707^2 = 0.0157\,\mathrm{mm^2}$. About $57\%$ bigger, the same as for any square.
:::

::: check
A hole's center is measured $0.09\,\mathrm{mm}$ left and $0.09\,\mathrm{mm}$ down from true position. It carries position $\varnothing\,0.25$. Does it pass? Would it pass $\pm 0.1$ coordinate tolerancing?
:::

::: answer
Straight-line miss: $\sqrt{0.09^2 + 0.09^2} = 0.1273\,\mathrm{mm}$. As a zone diameter that is $2 \times 0.1273 = 0.255\,\mathrm{mm}$, which is more than $0.25$, so it **fails** position. Under $\pm 0.1$ it passes, since $0.09 < 0.1$ in each direction. This is the corner of the square: the one place the square is *more* generous than a round zone of similar size. Neither scheme is "looser" everywhere; they have different shapes.
:::

::: check
Two inspectors measure the same part and disagree, and both followed a plus-or-minus drawing exactly. What did the drawing leave out, and what part of GD&T supplies it?
:::

::: answer
It never said how to hold the part or which points on an imperfect edge to measure from, so each inspector made a reasonable but different choice. GD&T supplies the datum reference frame: it names the datum features and the order they are seated in (primary, secondary, tertiary), so everyone builds the same starting planes and gets the same measurement.
:::

::: check
Read this frame aloud and say what each box does: a perpendicularity symbol, then $0.05$ with no diameter sign and no modifier, then $A$.
:::

::: answer
"Perpendicularity, within zero point zero five, relative to datum A." Box 1 says the control is orientation — being square to something. Box 2 has no ⌀, so the zone is two parallel planes $0.05\,\mathrm{mm}$ apart; with no modifier it is regardless of feature size, so the number stays fixed. Box 3 says the planes are held at exactly $90^\circ$ to datum A. The surface must fit between them.
:::

::: check
Why is it wrong to read the datum letters in a frame as "just labels, in alphabetical order"?
:::

::: answer
Their order is precedence: the first is the primary datum, which the part is seated on first and hardest; the second is seated next; the third last. The drawing could legally read $B$, $A$, $C$, and that would be a different setup giving a different measurement. The order is part of the requirement, not tidy bookkeeping.
:::

## Summary

| Idea | Meaning | Fact to carry |
| --- | --- | --- |
| Coordinate tolerancing | plus-or-minus on each of $x$ and $y$ | makes a square zone of side $2t$ |
| Round zone through the corners | what a bolted hole really needs | radius $\sqrt{2}\,t$, area $\frac{\pi}{2}$ times the square |
| Position miss as a diameter | size of round zone the axis needs | $2\sqrt{\Delta x^2 + \Delta y^2}$ |
| Ambiguous setup | which part of an imperfect edge to measure from | fixed by the datum reference frame |
| Basic dimension | boxed exact number | no plus-or-minus of its own |
| Feature control frame | symbol, then zone shape, size, modifier, then datums | datums in order of precedence |
| Ⓜ, Ⓛ, none | MMC, LMC, RFS | MMC lets the zone grow as the feature departs from MMC |

Next lesson builds the datum reference frame properly: what a datum is, why a part has six ways to move, and how three points, two points and one point take them all away.

::: context asme-y145 The rulebook and its name
ASME is the American Society of Mechanical Engineers, which publishes many engineering standards. "Y14" is its family of drawing standards, and Y14.5 is the one on dimensioning and tolerancing. The 2018 revision is the current one. Drawings say which revision they follow, because the rules changed between editions.

Outside the United States, many companies use the ISO system for the same job, often called GPS (geometrical product specifications). The symbols mostly look alike, but some default rules differ, so an engineer always checks which standard a drawing invokes before reading it.
:::

::: context square-in-circle The square inside the circle
The plus-or-minus square (blue) and the round zone through its corners (orange outline). The dot is the hole from the second example: outside the square, inside the circle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="100" r="70.71" fill="#fdf1e4" stroke="#f2b880" stroke-width="3"/>
  <rect x="70" y="50" width="100" height="100" fill="#8fb8f0" fill-opacity="0.6" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="120" y1="100" x2="170" y2="50" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="120" cy="100" r="3" fill="#1f2a44"/>
  <text x="104" y="70" font-size="11" fill="#1f2a44">0.141</text>
  <line x1="70" y1="162" x2="170" y2="162" stroke="#1f2a44" stroke-width="1"/>
  <line x1="70" y1="157" x2="70" y2="167" stroke="#1f2a44" stroke-width="1"/>
  <line x1="170" y1="157" x2="170" y2="167" stroke="#1f2a44" stroke-width="1"/>
  <text x="120" y="182" font-size="11" text-anchor="middle" fill="#1f2a44">0.2 (±0.1)</text>
  <circle cx="180" cy="90" r="4" fill="#b4232c"/>
  <text x="212" y="44" font-size="12" fill="#1d6fd1">square: 0.040 mm²</text>
  <text x="212" y="64" font-size="12" fill="#1f2a44">circle ⌀0.283:</text>
  <text x="212" y="80" font-size="12" fill="#1f2a44">0.063 mm²</text>
  <text x="212" y="120" font-size="12" fill="#b4232c">hole at (+0.12, +0.02)</text>
  <text x="212" y="136" font-size="12" fill="#b4232c">outside square,</text>
  <text x="212" y="152" font-size="12" fill="#b4232c">inside circle</text>
</svg>
```

The four orange slivers outside the blue square are the $57\%$ of good positions the square refuses.
:::

::: context leaning-edge Where do you put the ruler?
The lean is drawn far bigger than $0.10\,\mathrm{mm}$ so you can see it. Each arrow starts from a different, reasonable reference.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <rect x="14" y="30" width="8" height="160" fill="#6c7a93"/>
  <text x="18" y="22" font-size="11" text-anchor="middle" fill="#6c7a93">fence</text>
  <polygon points="40,180 330,180 330,40 22,40" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="10" y1="190" x2="345" y2="190" stroke="#6c7a93" stroke-width="3"/>
  <circle cx="250" cy="96" r="10" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="250" y1="70" x2="250" y2="176" stroke="#1f2a44" stroke-width="1" stroke-dasharray="6 3"/>
  <line x1="40" y1="165" x2="250" y2="165" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="250,165 242,161 242,169" fill="#1d6fd1"/>
  <text x="130" y="160" font-size="11" fill="#1d6fd1">from corner: 80.00</text>
  <line x1="29" y1="96" x2="238" y2="96" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="238,96 230,92 230,100" fill="#1f2a44"/>
  <text x="70" y="90" font-size="11" fill="#1f2a44">at hole height: 80.06</text>
  <line x1="22" y1="56" x2="250" y2="56" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="250,56 242,52 242,60" fill="#b4232c"/>
  <text x="70" y="51" font-size="11" fill="#b4232c">from fence: 80.10</text>
</svg>
```

GD&T ends the argument by naming which surface is a datum and how it is contacted.
:::

::: context basic-dimension Exact numbers in boxes
A **basic dimension** is drawn inside a rectangle and has no tolerance of its own. It describes the perfect part: where the true position is, what the true angle is. Old drawings sometimes called these "true position dimensions". The word "basic" means "the base value everything is measured against". The real-world slop is allowed only by the feature control frame, so it is stated once, in one place, instead of being scattered across a chain of plus-or-minus dimensions that pile up. That pile-up is the tolerance stack-up you met in the drawings module.
:::

::: context fcf-picture The frame, box by box
The five compartments of a typical position frame, and what each one says.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="50" width="44" height="40" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="74" y="50" width="116" height="40" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="190" y="50" width="40" height="40" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="230" y="50" width="40" height="40" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="270" y="50" width="40" height="40" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="52" cy="70" r="9" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="38" y1="70" x2="66" y2="70" stroke="#1f2a44" stroke-width="2"/>
  <line x1="52" y1="56" x2="52" y2="84" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="92" cy="70" r="7" fill="none" stroke="#1f2a44" stroke-width="1.8"/>
  <line x1="84" y1="79" x2="100" y2="61" stroke="#1f2a44" stroke-width="1.8"/>
  <text x="106" y="76" font-size="17" fill="#1f2a44">0.2</text>
  <circle cx="165" cy="70" r="10" fill="none" stroke="#1f2a44" stroke-width="1.8"/>
  <text x="165" y="75" font-size="13" text-anchor="middle" fill="#1f2a44">M</text>
  <text x="210" y="76" font-size="17" text-anchor="middle" fill="#1f2a44">A</text>
  <text x="250" y="76" font-size="17" text-anchor="middle" fill="#1f2a44">B</text>
  <text x="290" y="76" font-size="17" text-anchor="middle" fill="#1f2a44">C</text>
  <line x1="52" y1="50" x2="52" y2="30" stroke="#6c7a93" stroke-width="1"/>
  <text x="52" y="24" font-size="11" text-anchor="middle" fill="#1f2a44">position</text>
  <line x1="92" y1="90" x2="92" y2="118" stroke="#6c7a93" stroke-width="1"/>
  <text x="92" y="132" font-size="11" text-anchor="middle" fill="#1d6fd1">round zone</text>
  <line x1="120" y1="50" x2="120" y2="30" stroke="#6c7a93" stroke-width="1"/>
  <text x="130" y="24" font-size="11" text-anchor="middle" fill="#1d6fd1">size 0.2 mm</text>
  <line x1="165" y1="90" x2="165" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <text x="165" y="164" font-size="11" text-anchor="middle" fill="#b4232c">at MMC</text>
  <line x1="210" y1="90" x2="210" y2="118" stroke="#6c7a93" stroke-width="1"/>
  <text x="210" y="132" font-size="11" text-anchor="middle" fill="#1f2a44">primary</text>
  <line x1="250" y1="90" x2="250" y2="140" stroke="#6c7a93" stroke-width="1"/>
  <text x="250" y="154" font-size="11" text-anchor="middle" fill="#1f2a44">secondary</text>
  <line x1="290" y1="90" x2="290" y2="162" stroke="#6c7a93" stroke-width="1"/>
  <text x="300" y="176" font-size="11" text-anchor="middle" fill="#1f2a44">tertiary</text>
  <text x="180" y="196" font-size="11" text-anchor="middle" fill="#6c7a93">read left to right as one sentence</text>
</svg>
```

Symbol, then the zone (shape, size, modifier), then the datums in the order the part is seated.
:::

::: context mmc-meaning Most metal on the part
"Maximum material" means the part is as heavy as its size limits allow. For a hole that is the *smallest* allowed hole, because less metal was cut away. For a pin it is the *largest* allowed pin. MMC is the worst case for fitting things together: the tightest hole meets the fattest bolt. That is why a position tolerance at MMC is written for the tightest case, and why any hole made bigger than that has extra room to spare. Lesson 7 turns that extra room into a number called bonus tolerance.
:::

::: context error-budget A budget made of errors
An error budget works like a household budget, except the money is error. The GNC team decides how much total pointing error the mission can afford, then shares it out: so much for the star tracker's own noise, so much for thermal bending of the structure, so much for how the tracker is bolted on. The mounting share is the part a mechanical drawing must guarantee. When that share is a few hundredths of a degree, the feature control frames on the bracket are where the guarantee is written, and the inspection report is where it is checked. The last lessons of this module trace one such allocation all the way to a frame.
:::
