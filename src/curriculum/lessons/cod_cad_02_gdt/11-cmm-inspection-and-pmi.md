---
id: l11-cmm-inspection-and-pmi
title: Measuring GD&T — CMMs, gauges and PMI
minutes: 22
covers:
  - 'CMM inspection and how GD&T maps onto measurement'
  - 'PMI annotation in a model-based-definition workflow'
---

Close your eyes and pick up a coffee mug. With your fingertips alone you can tell a lot. Touch the rim in a few places and you know how wide it is. Run a finger down the side and you feel whether it bulges. Rest it on the table and you feel whether it rocks. Your brain is building a shape out of a handful of touches.

A **coordinate measuring machine**, or **CMM**, does the same thing with far more patience and far better fingers. It touches the part with a probe, records exactly where each touch happened, and hands the list of points to software. The software builds the datums, fits the features and checks every zone on the drawing. Nearly every precision aerospace part, from a star tracker bracket to a gimbal housing, has a CMM report behind it.

This last lesson of the module turns GD&T into measurement: how a CMM builds the datum reference frame from points, how each tolerance becomes a calculation, how many points and how good a machine you need, the functional gauge as a cheaper alternative, and how the annotated 3D model can feed the CMM directly.

## How a CMM touches a part

The most common kind is a **[[bridge CMM|bridge-cmm]]**. A granite table holds the part. Over it rides a bridge that moves front to back, a carriage that moves left to right, and a vertical arm that moves up and down. Each axis has a precise scale, so the machine always knows where the tip of its arm is in $x$, $y$ and $z$.

On the end of the arm is the **probe** — the sensor that touches the part. The usual tip is a tiny, hard **[[ruby ball|probe-tip]]**. The machine drives the ball toward the part until it touches, then records the position. A **touch-trigger probe** records one point per touch. A **scanning probe** stays in contact and slides along the surface, recording thousands of points. Some machines use light instead, with laser or optical scanners that never touch at all.

The output is always the same: a list of **points**, each with three coordinates. Everything else — datums, sizes, zones, pass or fail — is computed from that list.

## Building the datum reference frame in software

On a surface plate, the datum reference frame is physical: the primary face rests on granite, a pin expands into the datum hole, an edge butts against a fence. These are the **datum feature simulators** you met earlier — perfect shapes that stand in for the theoretical datums.

A CMM has no simulators. It has only points. So the software builds a mathematical simulator for each datum, one step at a time, in the order of precedence.

**Datum A, a flat face.** The CMM probes many points on the face. The software then finds a plane that rests on the face's high points, from outside the material, the way the granite plate would. That plane is datum A. It locks three degrees of freedom: tilt one way, tilt the other way, and height.

**Datum B, a hole.** The CMM probes points around the hole at several depths. The software finds the largest perfect cylinder that fits inside the hole while staying perpendicular to A — the mathematical twin of a pin expanding until it grips. Its axis is datum B. It locks two more degrees of freedom: sliding in $x$ and sliding in $y$.

**Datum C, a slot or an edge.** The software fits C with A and B already fixed, and uses it to stop the last freedom: rotation about B.

That is the 3-2-1 rule again, done in arithmetic instead of steel. The order matters here exactly as it did on the plate. Fit B first and A second and you get a different frame and different results on the same part.

::: key How a CMM maps GD&T onto measurement
The CMM probes points on each datum feature. The software fits a mathematical simulator to each one in the order of precedence — a plane on the high points for a planar datum, the largest inscribed perpendicular cylinder for a datum hole — and so builds the datum reference frame. Then it probes the toleranced features, expresses their points in that frame, and checks each against its tolerance zone.
:::

::: warning The default fit is often the wrong one
Many CMM programs fit a plane by **[[least squares|least-squares]]**, which runs the plane through the middle of the bumps, like an average. A real surface plate touches the highest bumps. On a face that is flat within $0.02\,\mathrm{mm}$, the two planes can sit about $0.01\,\mathrm{mm}$ apart and tilt differently. For a datum, pick the fit that copies the physical simulator. Always check which fit the program used before trusting a report.
:::

## From zones to calculations

Once the frame exists, every control on the drawing becomes a fit and a comparison. The pattern is always the same: fit the feature, compare with the zone.

| Control | What the software does | Passes when |
|---|---|---|
| Flatness | Finds the two closest parallel planes that hold all points | Gap is at most t |
| Circularity | Finds two concentric circles that hold one slice | Radial gap at most t |
| Perpendicularity or angularity | Two parallel planes held at the exact angle to the datum | Gap is at most t |
| Position of a hole | Fits the hole, finds its axis in the datum frame | Axis inside the zone at true position |
| Profile of a surface | Distance of each point from the model surface | Every point inside the band |

For form, the two closest planes or circles are called the **[[minimum zone|minimum-zone]]** — the tightest possible pair. It is the same idea as leveling the part before reading a dial indicator, done by the computer.

For position, the software measures how far the real axis sits from true position, in $x$ and in $y$. Call those misses $\Delta x$ and $\Delta y$ (read "delta x", "delta y"). The axis is $\sqrt{\Delta x^2 + \Delta y^2}$ from true position. A round zone of diameter $t$ reaches a distance $t/2$, so the part passes if

$$
2\sqrt{\Delta x^2 + \Delta y^2} \le t.
$$

The left side is the **position deviation**, reported as a diameter so it can be compared directly with the number in the frame.

::: example A CMM checks a hole's position
A bracket hole has an MMC size of $6.00\,\mathrm{mm}$ and an LMC size of $6.20\,\mathrm{mm}$. Its frame is `| ⌖ | ⌀0.1 Ⓜ | A | B | C |`. The true position is at basic $(40, 25)\,\mathrm{mm}$ in the A–B–C frame.

**What the CMM found.** After building the frame, it reports the hole's axis at $(40.032, 24.981)$ and the hole's size — the largest perfect cylinder that fits inside it — as $6.05\,\mathrm{mm}$.

**The misses.** $\Delta x = 40.032 - 40 = 0.032$. $\Delta y = 24.981 - 25 = -0.019$.

**Distance from true position.** Square each: $0.032^2 = 0.001024$ and $(-0.019)^2 = 0.000361$. Add: $0.001385$. Square root: $\sqrt{0.001385} \approx 0.0372\,\mathrm{mm}$.

**Position deviation.** Double it: $\varnothing 0.0744$.

**Tolerance available.** The hole is $6.05 - 6.00 = 0.05$ larger than MMC, so the bonus is $0.05$. The zone is $\varnothing(0.1 + 0.05) = \varnothing 0.15$.

**Verdict.** $0.0744 \le 0.15$. The hole passes, and it would even pass without the bonus.

**Sanity check.** The axis is off by a few hundredths of a millimeter each way, and the zone is over a tenth across, so a pass makes sense. Notice the minus sign on $\Delta y$ disappeared when squared: direction does not matter for a round zone.
:::

## How many points?

A plane needs three points to exist, and a circle needs three points too. But three points on a real face tell you almost nothing about its flatness. Every point you skip is a place a high spot or a dip could hide.

So **point density** — how many points are taken, and how they are spread — is a real engineering choice.

- **Spread matters more than count.** Points bunched in one corner miss the far edge. Spread them across the whole feature, out to its edges.
- **Form needs more than location.** A hole's position can be found well from a few rings of points. Its circularity or cylindricity needs many more, because lobes and waves live between the points.
- **Datums need enough to find the high points.** Too few points on datum A, and the fitted plane may not rest where the plate would.
- **Scanning is cheap in points.** A scanning probe collects thousands of points in the time a touch probe takes dozens.

The trade is time: doubling the points roughly doubles the probing time on every part. Good programs put dense points where the function lives — a sensor seat, a bearing bore — and sparser points elsewhere.

::: warning Few points make parts look better than they are
With fewer points, the measured flatness or circularity can only come out smaller or equal, never larger. Missed high spots never show up in the report. So a sparse measurement is biased toward passing. If a critical form result sits close to its limit, measure again with more points before you believe it.
:::

## How good must the measurement be?

Every measurement has some doubt in it. The machine's scales, its temperature, the probe's bending, the fit — each adds a little. The size of that doubt is the **[[measurement uncertainty|measurement-uncertainty]]**.

A widely used **rule of thumb** says the measuring system should be about **ten times better than the tolerance** it checks. A $0.1\,\mathrm{mm}$ tolerance wants a measurement good to about $0.01\,\mathrm{mm}$. It is a rule of thumb, not a law: when ten to one is out of reach, teams often accept less, such as four to one, and then treat results near the limits with care.

::: key Measurement uncertainty rule of thumb
The gauge or CMM should be roughly ten times better than the tolerance it checks. A result closer to a limit than the uncertainty cannot be called a clean pass or fail.
:::

::: example Can the shop's CMM check the tracker bracket?
The bracket from the last lesson carries angularity $0.04$, flatness $0.01$ and dowel-hole position $\varnothing 0.02\,\mathrm{mm}$. Suppose the shop's CMM, for features this size, has an uncertainty of about $0.003\,\mathrm{mm}$.

**Angularity 0.04.** Ten to one wants $0.04/10 = 0.004$. The machine's $0.003$ is better than that. The ratio is $0.04/0.003 \approx 13$ to 1. Good.

**Position 0.02.** Ten to one wants $0.002$. The ratio is only $0.02/0.003 \approx 6.7$ to 1. Usable, with care near the limit.

**Flatness 0.01.** Ten to one wants $0.001$. The ratio is $0.01/0.003 \approx 3.3$ to 1. Too coarse. This seat's flatness should go to a better instrument, such as an optical flat or a higher-grade machine in a temperature-controlled room.

**Near the limit.** The CMM reports one dowel hole at $\varnothing 0.0185$. The true value could be anywhere from $0.0185 - 0.003 = 0.0155$ to $0.0185 + 0.003 = 0.0215$. The top of that range is outside $0.02$. The honest statement is "probably in, not proven in". Many quality systems handle this with a **guard band** — a stricter internal acceptance limit, here perhaps $0.017$, so that a part accepted is in tolerance even after the doubt.

**Sanity check.** Tighter tolerances ran out of measuring ability first, which is exactly what the ten-to-one rule predicts.
:::

## Functional gauges versus the CMM

There is an older, faster way to check an MMC position tolerance: a **functional gauge**. It is a hard block made to the mating part's worst case. For a hole pattern it is a plate with datum simulators and a pin at each hole's true position. Each pin is made at the hole's **virtual condition** — the worst-case boundary from MMC size and position tolerance together. For a hole that is $\mathrm{MMC} - \text{tolerance}$.

For the hole in the CMM example, MMC $6.00$ with position $\varnothing 0.1$ at MMC, the gauge pin is $6.00 - 0.1 = 5.90\,\mathrm{mm}$ (less a small gauge-maker's tolerance). The inspector seats the part on the datums and pushes it onto the pins. If it goes on, every hole's axis is within its zone, bonus included, because a bigger hole automatically has more room around a fixed pin. This is why an MMC modifier makes a control checkable with a hard gauge.

| | Functional gauge | CMM |
|---|---|---|
| Answer | Go or no go | Numbers for every feature |
| Speed per part | Seconds | Minutes to hours |
| Cost | A gauge built for one part | One machine for every part |
| Works for | MMC controls, virtual condition | RFS, LMC, MMC, profile, form |
| Helps improve the process | Barely: no numbers | Yes: trends show drift |

A **[[go/no-go gauge|go-no-go]]** suits a line making hundreds of identical parts. A CMM wins for low volumes, for controls without MMC, and whenever the numbers matter — to catch a machine drifting before it makes scrap, or to feed a measured alignment into a GNC error budget. Aerospace builds mostly in low volumes, so the CMM is its everyday tool.

::: key Functional gauge versus CMM
A functional gauge is built at virtual condition and gives a fast go or no-go answer for MMC controls. A CMM builds the datum reference frame by fitting probed points and gives numbers for any control, including RFS and profile, at the cost of time and programming.
:::

## PMI: the model that tells the CMM what to check

In the drawings module you met **model-based definition** (MBD): under ASME Y14.41, the annotated 3D model, not a 2D sheet, is the authoritative definition of the part. The annotations on it — dimensions, datums, feature control frames, notes, finish — are **PMI**, product and manufacturing information. The model is released under revision control like any drawing, and when the model and an old printout disagree, the model wins.

GD&T gives PMI its most important content. A datum feature symbol in a model is attached to the actual face. A feature control frame points at the actual holes it controls. That link is the whole point.

### Semantic versus graphic PMI

PMI can be stored two ways, and they look identical on screen.

**Graphic PMI**, also called presentation PMI, is lines and text drawn in 3D for a human to read. It shows `| ⌖ | ⌀0.1 Ⓜ | A | B | C |`, but the software only knows it as a picture. It does not know which holes the frame controls, what the number means, or which faces are A, B and C.

**[[Semantic PMI|semantic-pmi]]** is the same information stored as data the software understands. It records: this is a position tolerance; its zone is a cylinder of diameter $0.1$; it has an MMC modifier; its datums are A, B and C in that order; it applies to these four hole faces; A is this face. A human sees the same frame. A machine can read it.

::: key Semantic versus graphic PMI
Graphic PMI is annotation drawn for human eyes. Semantic PMI stores the tolerance type, value, modifiers, datum references and the faces they apply to as machine-readable data linked to the geometry. Under Y14.41 the annotated model is the authority, and semantic PMI lets CAM and CMM software use it directly.
:::

### From model to CMM program

With semantic PMI, the chain from designer to inspector no longer needs anyone to retype a number.

1. The designer models the part and applies datums and feature control frames as semantic PMI, attached to faces.
2. A checker reviews the model: every feature toleranced, often by a general profile note for anything not called out.
3. The model is released, and a neutral file such as **STEP AP242** can carry the geometry and its semantic PMI to a supplier on different CAD software.
4. The CMM software imports the model and its PMI. It creates the datum fits, the features to measure, a starting pattern of points and the zone checks, automatically.
5. An inspection programmer reviews and adjusts it — probe angles, point density, fit types — and runs it.
6. The results report against the same features, so a failed hole links straight back to the frame that controls it.

The gain is not only speed. A drawing that said $\varnothing 0.1$ and a hand-typed CMM program that checked $\varnothing 0.2$ would pass bad parts for years without anyone noticing. When the program reads the tolerance from the same data the designer wrote, that whole class of error disappears.

::: warning Automatic does not mean correct
A CMM program generated from PMI inherits every mistake in the PMI, and it makes default choices — a least-squares fit, a thin ring of points — that may not match the function. A human who understands the GD&T still reviews the program. And graphic-only PMI generates nothing: it looks complete on screen, while the machine sees no tolerances at all.
:::

## Check yourself

::: check
Why does a CMM fit datum A as a plane touching the high points rather than as an average plane through all the points?
:::

::: answer
Because the datum is defined by what a physical simulator would do. A surface plate touches the part's highest points; it cannot pass through the bumps. A least-squares plane sits between them, shifted and tilted compared with the plate, and every measurement made from it moves too. Copying the plate makes the CMM agree with a traditional setup.
:::

::: check
A CMM finds a hole's axis $0.021\,\mathrm{mm}$ off in $x$ and $0.028\,\mathrm{mm}$ off in $y$. The frame is position $\varnothing 0.06$, RFS. Pass or fail?
:::

::: answer
Distance from true position: $\sqrt{0.021^2 + 0.028^2} = \sqrt{0.000441 + 0.000784} = \sqrt{0.001225} = 0.035\,\mathrm{mm}$. Position deviation is twice that, $\varnothing 0.070$. RFS means no bonus, so the zone stays $\varnothing 0.06$. $0.070 > 0.06$, so it fails, even though each single miss is well under $0.06$.
:::

::: check
A tolerance is $0.05\,\mathrm{mm}$. Using the ten-to-one rule of thumb, how good must the measurement be? What would you do with a result $0.002$ under the limit if the machine's uncertainty is $0.004$?
:::

::: answer
About $0.05/10 = 0.005\,\mathrm{mm}$. The machine's $0.004$ meets that. But a result $0.002$ inside the limit is closer to the limit than the uncertainty, so the true value could be up to $0.002$ over. It is not a clean pass. Remeasure more carefully, use a better instrument, or apply a guard band that rejects or reviews results that close.
:::

::: check
A hole pattern has MMC $8.0$ and position $\varnothing 0.15$ at MMC. What size are the pins on its functional gauge, and why does a larger hole still pass on that gauge?
:::

::: answer
The pins are made at virtual condition: $8.0 - 0.15 = 7.85\,\mathrm{mm}$ (less a small gauge tolerance). A larger hole has more room around a fixed pin, so its axis can wander further and still clear it. That extra room is exactly the bonus tolerance, which is why the gauge checks the bonus automatically.
:::

::: check
Two models look identical on screen, and both show the same feature control frames. One has semantic PMI, the other graphic PMI. What happens when each is loaded into the CMM software?
:::

::: answer
The semantic model gives the software the tolerance type, value, modifiers, datum order and the faces each applies to, so it can build the datum fits and zone checks automatically. The graphic model gives only drawn lines and text, which the software cannot interpret, so a programmer must build the whole inspection by hand and retype every number, with the risk of typos that brings.
:::

## Summary

| Idea | Meaning | Fact |
|---|---|---|
| CMM | Machine that records probed points | Software does every calculation |
| Datum fit | Mathematical simulator | Plane on high points; largest inscribed cylinder |
| Position deviation | Twice the axis miss | Twice the root of dx squared plus dy squared |
| Minimum zone | Tightest pair of planes or circles | Used for form results |
| Point density | How many points, how spread | Few points bias results toward passing |
| Ten-to-one rule | Rule of thumb for measurement | Measure about ten times finer than the tolerance |
| Functional gauge | Hard gauge at virtual condition | Go or no go for MMC controls |
| Semantic PMI | Machine-readable annotations | Feeds CAM and CMM programs directly |
| Y14.41 | Model-based definition | The annotated model is the authority |

That closes the GD&T module: you can now read a feature control frame, trace a budget to it and say how it will be checked. The next module, on CAD tools, puts your hands on the software where all this lives — 2D drafting in AutoCAD, and parametric 3D modeling, where the PMI of this lesson is applied.

::: context bridge-cmm The machine in the quiet room
The bridge CMM's granite table and bridge are heavy and stiff on purpose, so the frame does not bend as the arm moves. Most live in temperature-controlled rooms, because metal grows with heat: a 500 mm aluminum part grows about 0.012 mm for each degree Celsius, enough to spoil a tight tolerance on its own.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="150" width="300" height="24" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="167" font-size="11" text-anchor="middle" fill="#ffffff">granite table</text>
  <rect x="60" y="40" width="16" height="110" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="284" y="40" width="16" height="110" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="60" y="28" width="240" height="16" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">bridge (front to back)</text>
  <rect x="160" y="44" width="30" height="20" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="222" y="58" font-size="11" fill="#1f2a44">carriage</text>
  <rect x="169" y="64" width="12" height="54" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="112" y="96" font-size="11" text-anchor="middle" fill="#1f2a44">arm (up, down)</text>
  <circle cx="175" cy="122" r="4" fill="#b4232c"/>
  <rect x="140" y="126" width="80" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="142" font-size="11" text-anchor="middle" fill="#1f2a44">part</text>
  <text x="250" y="125" font-size="11" fill="#b4232c">probe tip</text>
</svg>
```
:::

::: context probe-tip Why the tip is a ball
A ball touches a surface at a single point whatever angle it arrives from, and its size is known precisely. The machine records the ball's center, not the touch point, so the software shifts every reading by the ball's radius along the surface normal. Ruby is used because it is very hard, very round when polished, and wears slowly.
:::

::: context least-squares Average plane versus resting plane
A least-squares plane makes the sum of the squared distances to all points as small as possible, so it runs through the middle of the bumps. A surface plate cannot do that; it rests on the tallest bumps.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <path d="M 30 60 Q 70 40 110 62 T 190 58 T 270 66 T 330 56" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <path d="M 30 60 Q 70 40 110 62 T 190 58 T 270 66 T 330 56 L 330 110 L 30 110 Z" fill="#f2b880" fill-opacity="0.6" stroke="none"/>
  <line x1="20" y1="58" x2="340" y2="58" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="20" y1="47" x2="340" y2="47" stroke="#b4232c" stroke-width="2"/>
  <text x="180" y="36" font-size="11" text-anchor="middle" fill="#b4232c">resting plane: touches the high points</text>
  <text x="180" y="128" font-size="11" text-anchor="middle" fill="#1d6fd1">dashed: least-squares plane through the middle</text>
  <text x="180" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">part surface, material below</text>
</svg>
```

Least squares is fine for many toleranced features. For a datum, the resting plane copies the physical setup.
:::

::: context minimum-zone The tightest squeeze
A minimum-zone fit tries every tilt and position of a pair of parallel planes, or concentric circles, and keeps the pair with the smallest gap that still holds every point. It is the exact definition of a form zone in Y14.5, which is why it gives the true form error. A least-squares fit can report a slightly larger value, which errs on the safe side but may reject a good part.
:::

::: context measurement-uncertainty Doubt with a number on it
Measurement uncertainty is not a mistake. It is an honest statement of how far the true value could be from the reading, given everything known about the instrument, the temperature, the operator and the method. Calibration labs state it for every certificate they issue. An inspection report without it is a number with no error bars, and a GNC engineer should ask for them before loading a measured alignment into a budget.
:::

::: context go-no-go A gauge that only says yes or no
A functional gauge for a four-hole pattern: pins at virtual condition, placed at the basic positions from the datums.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="30" width="180" height="120" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="80" cy="60" r="9" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="60" r="9" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="80" cy="120" r="9" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="120" r="9" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="36" y1="30" x2="36" y2="150" stroke="#b4232c" stroke-width="4"/>
  <line x1="40" y1="154" x2="220" y2="154" stroke="#b4232c" stroke-width="4"/>
  <text x="240" y="64" font-size="11" fill="#1d6fd1">pins at virtual</text>
  <text x="240" y="78" font-size="11" fill="#1d6fd1">condition, basic</text>
  <text x="240" y="92" font-size="11" fill="#1d6fd1">locations</text>
  <text x="240" y="140" font-size="11" fill="#b4232c">datum rails B, C</text>
  <text x="130" y="94" font-size="11" text-anchor="middle" fill="#1f2a44">gauge plate = A</text>
</svg>
```

If the part drops onto all four pins while touching the rails and plate, it passes.
:::

::: context semantic-pmi Data a machine can read
Think of the difference between a photo of a spreadsheet and the spreadsheet itself. Both show the same numbers to a person. Only the real spreadsheet lets a computer add them up. Semantic PMI is the spreadsheet. Standards such as STEP AP242 carry it between CAD systems, and the metrology world has its own formats too, such as DMIS for CMM programs and QIF for inspection plans and results, so the same tolerance can travel from design to inspection report without being retyped.
:::
