---
id: l02-datums-and-the-3-2-1-rule
title: Datums, six degrees of freedom and the 3-2-1 rule
minutes: 21
covers:
  - Datums, datum features, the datum reference frame, the 3-2-1 rule and degrees of freedom
---

A four-legged café table wobbles. You have sat at one: you lean on it, it clunks down onto the short leg, you let go, it rocks back. A three-legged stool never does that. It might lean, but it sits the same way every single time you put it down.

That difference is the whole secret of this lesson. Last lesson ended with a problem: three careful inspectors measured the same hole and got three different answers, because the drawing never said how to hold the part. GD&T fixes that by saying *exactly* which surfaces the part sits on, in what order, and touching how many points. Done right, a part sits in its measuring setup like a stool, not like a café table: the same way, every time, in every shop.

The ideas you need are **datums**, the **six degrees of freedom** and the **3-2-1 rule**. They are not only for machinists. A spacecraft in flight also has exactly six ways to move, and your guidance software spends its life measuring and controlling them. The same six show up here, on a bracket sitting on a granite table.

## Datum feature and datum: the real thing and the perfect idea

Start with a real metal part. Its bottom face looks flat, but under a microscope it is a landscape of tiny hills and valleys, a few thousandths of a millimeter high. No real surface is perfectly flat.

So GD&T keeps two words apart:

- A **datum feature** is the *real, imperfect* surface (or hole, or pin) on the part that the drawing picks as a reference. You can touch it.
- A **datum** is the *perfect* plane, line, axis or point that we get from that real surface. You cannot touch it. It is an idea — but a very precise one.

How do you get a perfect plane from a bumpy surface? You press the surface down onto something much flatter than it: a polished granite **[[surface plate|surface-plate]]**, flat to a tiny fraction of the part's tolerance. The part rests on its highest points. The plate's surface now stands in for the perfect plane. The hardware that does this — the surface plate, an angle plate, a gauge pin — is called a **[[datum feature simulator|simulator-cmm]]**. It is the bridge between the idea and the real metal.

On the drawing, a datum feature is tagged with a **datum feature symbol**: a capital letter in a small square, joined by a line to a triangle that touches the surface. The letters are usually A, B, C and onward, skipping [[a few confusing letters|datum-letters]]. The letter is the name the feature control frames use.

::: key Datum feature versus datum
A datum feature is the real, imperfect surface on the part. The datum is the perfect plane, axis or point derived from it, made real in the shop by a datum feature simulator such as a surface plate or gauge pin.
:::

::: warning The datum is not the surface
When someone says "measure from datum A", they do not mean "from wherever your probe happens to touch the bottom face". They mean from the plane the surface plate makes when the part is resting on its high points. Measuring off a random spot on the real surface brings back exactly the ambiguity GD&T was invented to remove.
:::

## Six degrees of freedom

Put your phone on a table and see how many different ways you can move it.

You can slide it left and right. You can slide it toward you and away. You can lift it straight up. Those are three **translations** — moves in a straight line, one along each direction.

You can also turn it. Spin it flat on the table, like a clock hand. Tip it forward onto its nose. Roll it sideways onto its edge. Those are three **rotations** — turns about each direction.

Three translations plus three rotations make six. Each independent way an object can move is called a **degree of freedom**, or DOF (say "D-O-F" or "dee-oh-eff"). Any free rigid object in space has exactly **six degrees of freedom**. Name the directions $x$, $y$ and $z$. The six are:

- translation along $x$, along $y$, along $z$;
- rotation about $x$, about $y$, about $z$.

Every possible motion of a solid object is some mix of those six. That is why, to hold a part completely still in a measuring setup, you must remove *all six*. Miss one, and the part can drift in that direction while you measure it, and your numbers mean nothing.

This is the same six a spacecraft has. Its position is three numbers; its attitude — which way it points — is three more. A [[six-degree-of-freedom simulation|six-dof-sim]] is exactly that: a program that tracks all six. On the ground we want the part to have zero freedom. In flight we control all six on purpose.

::: key Six degrees of freedom
A free rigid body has six degrees of freedom: three translations (along $x$, $y$, $z$) and three rotations (about $x$, $y$, $z$). Fully locating a part means removing all six.
:::

## The 3-2-1 rule

Here is the plan for taking away all six, one datum at a time. Picture a small rectangular block, like a domino lying flat.

**Primary datum: three points.** Set the block's big bottom face onto the surface plate. Three points of contact are exactly enough to define a plane — that is the stool. A fourth point would make it a café table: one of the four would always be a little high, and the part would rock. Once the block sits on three well-spread points, it can no longer:

- move down along $z$ (the plate is in the way; gravity or a gentle push holds it down);
- tip about $x$;
- tip about $y$.

Three degrees of freedom gone. The block can still slide around on the plate and spin flat, like the phone.

**Secondary datum: two points.** Now slide the block sideways until one long side touches an upright wall — an angle plate — at two points. Two points define a line. The block can no longer:

- move along $y$ (into the wall);
- spin about $z$ (the two points stop it turning flat).

Two more gone. Five in total. The block can still slide along the wall.

**Tertiary datum: one point.** Finally, slide it along the wall until its short end touches a stop at one point. Now it cannot:

- move along $x$.

The last one gone. Three plus two plus one is six. The block is fully located.

That is the **3-2-1 rule**, and the three ideal planes it creates — one from each datum — are called the **[[datum reference frame|frame-picture]]**. They are three perfect planes at right angles to each other, like the floor and two walls in the corner of a room. Every basic dimension on the drawing is measured from them.

::: key The 3-2-1 rule
A primary datum plane constrains three degrees of freedom by contacting at three points, the secondary constrains two more with two points, and the tertiary constrains the last with one point. It is how a part is fully located for both manufacture and inspection.
:::

::: note Why three, two and one — and not some other split
Start by asking how many points it takes to pin down each kind of shape. A plane in space needs three points not in a line; any fewer and it can swing, any more and the extra points usually do not lie exactly on it. So the first surface gets three.

Once the primary plane is fixed, the part can only slide and spin *in* that plane. That is three leftover freedoms: two slides and one spin. A line drawn in the plane needs two points. Touching a wall at two points stops one slide and the spin — two freedoms. One slide is left, and a single point stops a single slide.

Count: $3 + 2 + 1 = 6$. It matches the six degrees of freedom exactly, with nothing to spare and nothing missing. Any other split either leaves the part free to move or asks it to touch more points than it can all touch at once.
:::

::: example Taking a star tracker bracket down to zero
A star tracker bracket is an L-shaped aluminum part. Its big mounting face is $120 \times 80\,\mathrm{mm}$. It has a long straight edge along the $120\,\mathrm{mm}$ side and a short edge along the $80\,\mathrm{mm}$ side. The drawing names the mounting face datum A, the long edge datum B, the short edge datum C. Track the degrees of freedom as the inspector sets it up.

**Before anything.** Free on the bench: $6$ degrees of freedom.

**Seat on A.** The mounting face goes down on the surface plate and rests on its three high points. Removed: translation along $z$, rotation about $x$, rotation about $y$. Left: $6 - 3 = 3$ (slide along $x$, slide along $y$, spin about $z$).

**Push against B.** The long edge is slid against an angle plate, touching at two points spread far apart along its $120\,\mathrm{mm}$ length. Removed: translation along $y$, rotation about $z$. Left: $3 - 2 = 1$ (slide along $x$).

**Push against C.** The short edge is slid against a stop and touches at one point. Removed: translation along $x$. Left: $1 - 1 = 0$.

**Sanity check.** Zero is what we need: with nothing left free, every inspector who follows A, then B, then C gets the part in the same place. The long edge was the right choice for B: two contact points $120\,\mathrm{mm}$ apart stop the spin far better than two points squeezed onto the $80\,\mathrm{mm}$ side would.
:::

::: warning Five points on a secondary surface are not better
It is tempting to think "more contact is more accurate" and press the secondary edge against a wall along its whole length. But a real edge is not perfectly straight, so it will touch at its two high points anyway, and if the setup *forces* more points into contact, it bends the part or lifts it off the primary. Let each datum take only the freedoms that are still left.
:::

## Holes and pins can be datums too

Not every datum feature is a flat face. Many brackets bolt down with a big face and locate on a hole. The hole can be a datum feature — a **datum feature of size**, because it has a size you can measure.

The simulator for a hole is a pin inside it. Imagine a pin that expands until it fills the hole snugly. Its center line becomes the **[[datum axis|expanding-pin]]**. With the part already seated on primary face A, a hole B perpendicular to A stops both slides in the plane: along $x$ *and* along $y$. That is two degrees of freedom, the same count as a secondary edge, taken in a different way.

What is left is the spin about the hole's axis. A second hole or a slot, some distance away, becomes tertiary datum C and stops that spin with one more contact.

This "face, hole, slot" scheme is how a great many bolted aerospace brackets are located, because it copies how the bracket really sits in the vehicle: clamped flat on its face, held in place by its bolts. A good datum scheme imitates the assembly.

## Choosing which surface is primary

The drawing lists the datums in order, and the first one gets three points of contact. So the most important choice is which surface goes first. The rule of thumb: the primary datum should be the **largest, most stable surface that does the real job** — usually the face the part is bolted down on.

::: example What a tiny burr does to each choice
A bracket carries a hole $100\,\mathrm{mm}$ away from where it rests. A small **[[burr|burr]]** $0.02\,\mathrm{mm}$ high is left on whichever surface the part sits on, at one end of it. Compare seating the part on its $120\,\mathrm{mm}$ mounting face with seating it on a $10\,\mathrm{mm}$ wide edge. [[See the tilt|burr-tilt]].

**How much the part tips.** Sitting on a burr at one end, the part tilts by about the burr height divided by the length of the surface:

- mounting face: $0.02 / 120 = 0.000167$, which is about $0.0095^\circ$;
- narrow edge: $0.02 / 10 = 0.002$, which is about $0.115^\circ$.

**How far the hole moves.** For small tilts, a point a distance $d$ away moves about $d$ times the tilt:

- mounting face: $100 \times 0.000167 = 0.0167\,\mathrm{mm}$;
- narrow edge: $100 \times 0.002 = 0.2\,\mathrm{mm}$.

**Compare.** The narrow edge makes the same speck of dirt $12$ times worse: $0.2 / 0.0167 = 12$, which is also $120 / 10$.

**Sanity check.** $0.2\,\mathrm{mm}$ would use up the whole position tolerance from the last lesson, just from a burr. And a $0.115^\circ$ tilt is almost six times a $0.02^\circ$ star tracker allowance. The big face is the right primary.
:::

This is also why drawings so often put a **flatness** control on the primary datum face. The flatter the face, the more surely its three high points are the same three points in the vehicle, and the better the measurement predicts the real assembly. You will meet flatness properly in the form lesson.

::: warning The order is the drawing's decision, not the inspector's
It is natural to seat a part on whatever face is easiest to reach. But the primary, secondary and tertiary datums are named, in order, in every feature control frame. Seating in a different order builds a different datum reference frame, and the next lesson shows with real numbers that the same part then measures differently.
:::

## Check yourself

::: check
What is the difference between datum feature A and datum A? Name the piece of shop equipment that connects them.
:::

::: answer
Datum feature A is the real surface on the part — imperfect, with high points and low spots. Datum A is the perfect plane derived from it. The datum feature simulator, here a surface plate that the face rests on, connects them: its flat surface, touching the part's high points, stands in for datum A.
:::

::: check
List the six degrees of freedom of a rigid body, and say which ones a primary plane datum removes.
:::

::: answer
Translation along $x$, $y$ and $z$; rotation about $x$, $y$ and $z$. A primary plane lying in the $x$–$y$ directions, contacted at three points, removes translation along $z$ (the part cannot sink through it) and the two tipping rotations, about $x$ and about $y$. Three are left: sliding along $x$ and $y$ and spinning about $z$.
:::

::: check
Why does the primary datum get three contact points instead of four?
:::

::: answer
Three points not in a line define exactly one plane, so the part sits the same way every time, like a three-legged stool. With four, the four points of a real surface almost never lie on one plane, so the part would rest on three of them and rock onto a different three when disturbed — a wobbly café table. That rocking is exactly the kind of setup difference that makes measurements disagree.
:::

::: check
A plate is seated on face A. Then a snug pin goes into hole B, which is square to A. How many degrees of freedom are left, which are they, and what would you use to remove them?
:::

::: answer
The face removed three (translation along $z$ and the two tips). The pin in the hole stops sliding along $x$ and along $y$, two more. That leaves one: spinning about the hole's axis. A tertiary datum removes it — a second hole or a slot some distance away, or an edge touched at one point. The farther from B it is, the better it stops the spin.
:::

::: check
A $6\,\mathrm{mm}$ tall side edge is chosen as primary on a part whose features sit up to $90\,\mathrm{mm}$ away. A $0.03\,\mathrm{mm}$ speck sits under one end of the edge. Roughly how far does a feature $90\,\mathrm{mm}$ away move? What does that tell you?
:::

::: answer
Tilt $\approx 0.03 / 6 = 0.005$. Movement $\approx 90 \times 0.005 = 0.45\,\mathrm{mm}$. That is huge next to typical position tolerances of a few tenths or less. A short edge makes a poor primary: any error in how it seats is multiplied by the long distance to the features. Choose the large functional face as primary instead.
:::

## Summary

| Idea | Meaning | Fact to carry |
| --- | --- | --- |
| Datum feature | real surface, hole or pin on the part | imperfect; tagged with a boxed letter |
| Datum | perfect plane, axis or point from it | made real by a datum feature simulator |
| Degrees of freedom | independent ways a body can move | six: three translations, three rotations |
| Primary datum | seated first, three points | removes three DOF: one slide, two tips |
| Secondary datum | seated second, two points | removes two DOF: one slide, one spin |
| Tertiary datum | seated last, one point | removes the last DOF |
| Datum reference frame | three perfect perpendicular planes | basic dimensions are measured from it |
| Hole as datum | datum feature of size | its axis removes two slides |

Next lesson handles the surfaces too rough or floppy to sit on whole — datum targets — and shows with numbers why swapping primary and secondary changes the answer.

::: context surface-plate A slab of very flat stone
Most inspection rooms have a big block of polished granite on sturdy legs. Granite is used because it is stable, does not rust and barely changes size when the room warms up. The best plates are lapped flat to within a few thousandths of a millimeter across their whole top. When a part rests on the plate, the plate is the perfect plane, for all practical purposes. A height gauge sliding across it measures everything as "height above datum A".
:::

::: context simulator-cmm Simulators made of math
In a modern inspection lab, much of the measuring is done by a coordinate measuring machine, or CMM: a probe on precise rails that records the positions of points it touches. A CMM has no granite wall pressing on datum B. Instead, its software takes the points probed on each datum feature and fits the plane or axis a physical simulator would have made — resting on the high points, in the order the frame says. Done right, it builds the same datum reference frame. Done carelessly, with a plain average through the points, it builds a different one. The last lesson of this module is about exactly that.
:::

::: context datum-letters Letters a drawing avoids
Datum letters are ordinary capital letters, but a few are skipped because they are too easy to misread on a drawing: I looks like the number 1, O and Q look like 0. When a big drawing runs past Z, it continues with double letters like AA and AB. The letter only names the feature. It says nothing about order; the order comes from where the letter sits in each feature control frame.
:::

::: context six-dof-sim The same six, in flight
Engineers call a full spacecraft or rocket simulation a "6-DOF sim": it tracks three position numbers and three attitude numbers, and how forces and torques change them. The rigid body in the sim and the bracket on the granite table are the same kind of object with the same six freedoms. One difference: in the sim, attitude is usually not stored as three angles but in a way that avoids the trouble three angles cause at certain orientations. You will meet that in the attitude modules. The count, six, never changes.
:::

::: context frame-picture The 3-2-1 contacts, seen from above
Looking down on a block. The blue dots are the three primary points underneath it. The two red points touch the long side (secondary). The orange point touches the short end (tertiary).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="70" y="40" width="220" height="110" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="110" cy="70" r="7" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="110" cy="122" r="7" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="250" cy="96" r="7" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="180" y="100" font-size="12" text-anchor="middle" fill="#1d6fd1">A: 3 points below</text>
  <line x1="60" y1="162" x2="300" y2="162" stroke="#6c7a93" stroke-width="4"/>
  <polygon points="100,150 92,160 108,160" fill="#b4232c"/>
  <polygon points="260,150 252,160 268,160" fill="#b4232c"/>
  <text x="180" y="182" font-size="12" text-anchor="middle" fill="#b4232c">B: 2 points on the long side</text>
  <line x1="56" y1="30" x2="56" y2="160" stroke="#6c7a93" stroke-width="4"/>
  <polygon points="70,95 60,87 60,103" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="30" y="24" font-size="12" fill="#1f2a44">C: 1 point</text>
  <line x1="300" y1="40" x2="340" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="344,40 334,35 334,45" fill="#1f2a44"/>
  <text x="330" y="30" font-size="12" fill="#1f2a44">x</text>
  <line x1="320" y1="150" x2="320" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="320,56 315,66 325,66" fill="#1f2a44"/>
  <text x="328" y="70" font-size="12" fill="#1f2a44">y</text>
</svg>
```

$3 + 2 + 1 = 6$ contacts, one for each degree of freedom.
:::

::: context expanding-pin A pin that grows to fit
For a hole used as a datum, the simulator is a pin that expands until it touches the hole all round, like a balloon inflated inside a tube. Its center line is the datum axis. Because the pin fills the hole, the part cannot slide in any direction across the axis.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="30" width="300" height="90" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="110" cy="75" r="26" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="78" y1="75" x2="142" y2="75" stroke="#1f2a44" stroke-width="1" stroke-dasharray="5 3"/>
  <line x1="110" y1="43" x2="110" y2="107" stroke="#1f2a44" stroke-width="1" stroke-dasharray="5 3"/>
  <text x="110" y="136" font-size="11" text-anchor="middle" fill="#1d6fd1">B: pin fills hole</text>
  <rect x="226" y="63" width="52" height="24" rx="12" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="240" y="63" width="24" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="252" y="136" font-size="11" text-anchor="middle" fill="#1f2a44">C: slot stops the spin</text>
  <path d="M 160 64 A 60 60 0 0 1 190 80" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <polygon points="194,84 184,80 190,74" fill="#b4232c"/>
  <text x="182" y="50" font-size="11" text-anchor="middle" fill="#b4232c">spin left after B</text>
</svg>
```

The slot is narrow across and long toward B, so it stops only the spin and never fights the pin.
:::

::: context burr A tiny ridge of leftover metal
A **burr** is a thin, sharp lip of metal left on an edge after cutting, drilling or milling. It is often smaller than a hair is thick, but it is harder and higher than the surface around it, so a part resting on it tips. Shops remove burrs with files, brushes or tumbling, which is why many drawings carry a note like "break all sharp edges". Dirt, a chip or a fingerprint of grease on the surface plate has the same effect as a burr.
:::

::: context burr-tilt Short base, big tilt
The same speck under a long base and a short base, drawn with the tilt exaggerated. The shorter the base, the steeper the tilt, and the farther a distant feature swings.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="140" x2="350" y2="140" stroke="#6c7a93" stroke-width="3"/>
  <circle cx="160" cy="137" r="3" fill="#b4232c"/>
  <polygon points="20,140 160,134 159,110 19,116" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="90" y="104" font-size="11" text-anchor="middle" fill="#1d6fd1">long base: slight tilt</text>
  <circle cx="300" cy="137" r="3" fill="#b4232c"/>
  <polygon points="260,140 300,134 286,40 246,46" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="190" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">short base:</text>
  <text x="190" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">same speck,</text>
  <text x="190" y="88" font-size="11" text-anchor="middle" fill="#1f2a44">steep tilt</text>
  <text x="180" y="160" font-size="11" text-anchor="middle" fill="#b4232c">red dots: the same burr</text>
</svg>
```

Tilt is about burr height divided by base length, so a base $12$ times shorter tilts $12$ times more.
:::
