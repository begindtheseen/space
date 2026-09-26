---
id: l08-finishes-welds-and-fasteners
title: Surface finish, welds, fasteners and materials
minutes: 22
covers:
  - 'Surface finish symbols; weld symbols'
  - 'Fastener and thread callouts; materials and specifications'
---

Run your hand along a wooden table, then along a pane of glass. Both are "flat", but one feels rough and one feels smooth. Slide a book across each and the book moves differently. How smooth a surface is changes how things rub, seal and wear, even when its size is exactly right.

Dimensions and tolerances, which you met in the last two lessons, say how big a part is and how far it may stray. They do not say how smooth a face must be, how two plates are joined, which screw goes in which hole, or what metal the part is made of. Drawings say those things with a set of compact symbols and **callouts** — short coded labels that point at a feature and name a requirement. This lesson teaches you to read four of them: **surface finish symbols**, **weld symbols**, **thread and fastener callouts**, and the **material and specification** block.

Each looks like shorthand, and it is. But every mark is a requirement a supplier is legally bound to meet and an inspector will check. And several of them land squarely in a GNC engineer's world: the finish on a gimbal bearing sets its friction, and the preload in a bolted sensor bracket decides whether that bracket stays aligned through launch.

## Surface finish: how rough is allowed

Look at a machined metal surface under a microscope and it is a mountain range. The cutting tool leaves tiny ridges and valleys. **Surface finish** (also called **surface texture**) is the drawing's rule for how tall that mountain range may be, and which way its ridges may run.

### Measuring roughness: Ra

The usual measure is **Ra**, read "R a", the **[[arithmetic average roughness|profilometer]]**. Drag a fine stylus across the surface and record the height of the surface above and below its average line at many points. Ra is the average of those heights *ignoring the sign* — how far, on average, the surface sits from its middle line.

$$
R_a = \frac{1}{n}\sum_{i=1}^{n} |z_i|,
$$

where $z_i$ ("z sub i") is the $i$-th measured height above (plus) or below (minus) the mean line, and the bars mean "size without sign". Ra is quoted in micrometers ($\mu\mathrm{m}$, millionths of a meter) on metric drawings and in **microinches** (millionths of an inch) on many US drawings. One micrometer is about $39.4$ microinches.

Typical values give you a feel:

| Ra in micrometers | Ra in microinches | Typical surface |
| --- | --- | --- |
| 6.3 | 250 | rough machining, saw cuts |
| 3.2 | 125 | ordinary machined face |
| 1.6 | 63 | good machined face, sealing surfaces |
| 0.8 | 32 | fine machining, grinding |
| 0.4 | 16 | ground bearing seats |

Each step halves the roughness. Each step also costs more machining time. A designer who writes $0.4$ everywhere "to be safe" has made the part slower and more expensive for no reason.

::: example Working out Ra from a trace
A profilometer records eight heights along a gimbal shaft, in micrometers, measured from the mean line: $+1.2$, $-0.8$, $+2.0$, $-1.6$, $+0.4$, $-1.2$, $+0.8$, $-0.8$. The drawing calls for Ra $1.6\,\mu\mathrm{m}$ maximum. Does it pass?

**Step 1: drop the signs.** $1.2, 0.8, 2.0, 1.6, 0.4, 1.2, 0.8, 0.8$.

**Step 2: add.** $1.2 + 0.8 + 2.0 + 1.6 + 0.4 + 1.2 + 0.8 + 0.8 = 8.8$.

**Step 3: average.** $8.8 / 8 = 1.1\,\mu\mathrm{m}$.

So Ra is $1.1\,\mu\mathrm{m}$, under the $1.6$ limit, and the shaft passes. **Sanity check:** the signed heights add to zero, as they must when measured from the mean line. That is exactly why Ra drops the signs — otherwise every surface would average to zero.
:::

### The symbol

The finish symbol is a check mark with a short left leg and a long right leg, its point touching the surface (or an extension line from it). Three versions say three things:

- the **basic symbol** — any process is allowed;
- with a **bar** closing the top of the short leg — material must be removed by machining;
- with a **circle** inside the V — material removal is *prohibited*; leave the surface as cast, forged or rolled.

The roughness value sits on or above the symbol. Next to its lower right, a small letter may give the **[[lay|lay]]** — the direction of the tool marks: $=$ parallel to the edge the symbol touches, $\perp$ perpendicular to it, $\mathrm{X}$ crossed at an angle, $\mathrm{M}$ multidirectional, $\mathrm{C}$ circular, $\mathrm{R}$ radial, $\mathrm{P}$ pitted or non-directional. Lay matters because a seal can leak along tool marks that run across it but not along marks that run around it.

::: key What a surface finish symbol controls
Roughness and lay of the surface. It matters where friction, sealing, fatigue or contact stiffness matter, and a bearing or gimbal interface with the wrong finish changes friction and therefore the actuator model you are tuning against.
:::

::: warning A finish is not a coating
"Surface finish" on a drawing means *texture* — roughness and lay. Paint, anodizing and plating are **finishes** in everyday speech, but on a drawing they are called out separately, usually in a note that names a process specification. Do not look for anodize in the check-mark symbol, and do not look for Ra in the finish note.
:::

## Weld symbols: joining plates on paper

When two metal pieces are welded, the drawing must say which joint, which side, what shape of weld, how big and how long. All of that is packed into one **[[weld symbol|weld-symbol]]**, built on a horizontal **reference line** with an **arrow** that touches the joint.

The key rule is about *sides*. Every joint has an **arrow side** (the side the arrow touches) and an **other side**. In the US convention:

- a weld shape drawn **below** the reference line goes on the arrow side;
- drawn **above** the line, it goes on the other side;
- drawn on **both**, it goes on both sides.

The shape itself is a small picture of the weld's cross-section. The most common is the **fillet weld**, drawn as a right triangle with its vertical leg on the left. A fillet weld fills the inside corner where two plates meet at a right angle, like caulk along a bathtub edge. **Groove welds** fill a gap between plate edges that have been prepared into a square, V, bevel, U or J shape, each with its own symbol.

Numbers sit around the shape: the **size** to its left (for a fillet, the leg length), the **length** to its right, and, for a weld made in short pieces, the **pitch** (center-to-center spacing) after a dash. Three extra marks finish it:

- a small **circle** where the arrow meets the reference line: weld **all around** the joint;
- a small **flag** there: a **field weld**, made at the installation site, not in the shop;
- a **tail** at the far end: a place to name the welding process or a specification.

::: example Reading and sizing a fillet weld
A weld symbol points at the joint between a thruster bracket and a plate. Below the reference line is a fillet triangle, with $6$ to its left and $100$ to its right, all in millimeters. There is no circle and no flag.

**Reading it.** Below the line means the arrow side. So: a fillet weld on the arrow side, with $6\,\mathrm{mm}$ legs, $100\,\mathrm{mm}$ long, made in the shop.

**How much metal carries the load?** A fillet weld is usually sized by its **[[throat|weld-throat]]** — the shortest distance from the corner to the weld's face. For equal legs, that is the leg times $\cos 45^\circ$, about $0.707$:

$$
\text{throat} = 0.707 \times 6 \approx 4.24\,\mathrm{mm}.
$$

The area that carries shear is throat times length: $4.24 \times 100 \approx 424\,\mathrm{mm}^2$. If the allowed shear stress on that area were $100\,\mathrm{MPa}$ (one megapascal is one newton per square millimeter), the weld could carry about $424 \times 100 = 42\,400\,\mathrm{N}$, roughly $42\,\mathrm{kN}$.

**Sanity check.** The throat ($4.24$) is shorter than the leg ($6$), as it must be: the diagonal of a corner is closer to the corner than either edge.
:::

::: warning Arrow side versus other side
The arrow side is the side the arrow *touches*, not the side the symbol is drawn on. Below the line means arrow side in the US (the AWS convention). The international ISO convention adds a dashed line and reads it differently, so check which standard the drawing cites — exactly the kind of trap you met with first-angle and third-angle projection.
:::

For a GNC engineer, welds matter mostly through **distortion**. A weld shrinks as it cools and pulls the parts slightly out of position. A welded bracket may need to be machined *after* welding so its sensor face ends up where the alignment budget needs it. That is why you sometimes see a note "machine after welding" on a mount drawing.

## Threads and fasteners

A screw thread is a ramp wrapped around a cylinder. Turn the screw once, and it moves forward by one **pitch** — the distance from one thread crest to the next. A thread callout tells you the diameter, how fine the thread is, and how tightly it must fit its mate.

### Metric callouts

A metric callout looks like $\mathrm{M8 \times 1.25 - 6g}$:

- $\mathrm{M}$ — ISO metric thread;
- $8$ — the **major diameter**, the outside diameter of the thread, in millimeters;
- $1.25$ — the pitch in millimeters (left out when the standard coarse pitch is meant);
- $\mathrm{6g}$ — the **tolerance class**. Lower-case letters are for external threads (bolts), upper-case for internal (nuts and tapped holes). $\mathrm{6g}$ and $\mathrm{6H}$ are the common general-purpose pair.

### Inch callouts

A US inch callout looks like $\tfrac{1}{4}\text{-}20\ \mathrm{UNC}\text{-}2\mathrm{A}$:

- $\tfrac{1}{4}$ — major diameter in inches;
- $20$ — threads per inch (TPI), so the pitch is $1/20$ inch;
- $\mathrm{UNC}$ — Unified National Coarse ($\mathrm{UNF}$ is fine). Aerospace often uses $\mathrm{UNJ}$, whose rounded thread root resists fatigue cracking;
- $2\mathrm{A}$ — the **class of fit**. $\mathrm{A}$ is external, $\mathrm{B}$ internal; class $2$ is general purpose and class $3$ is tighter.

A tapped hole also gets a depth, for example "THRU" or a depth symbol with a number, and often a note calling for a **[[helical insert|helical-insert]]** in soft metals.

::: example Decoding two threads
**Inch.** $\tfrac{1}{4}\text{-}20\ \mathrm{UNC}\text{-}2\mathrm{A}$. The diameter is $0.25 \times 25.4 = 6.35\,\mathrm{mm}$. The pitch is $1/20 = 0.05$ inch, which is $0.05 \times 25.4 = 1.27\,\mathrm{mm}$. It is an external thread (the $\mathrm{A}$), general-purpose fit.

**Metric.** $\mathrm{M8 \times 1.25 - 6g}$. To engage $10\,\mathrm{mm}$ of thread, the bolt must turn $10 / 1.25 = 8$ full turns.

**How much engagement is enough?** A common rule of thumb is at least one diameter of engagement in steel and about one and a half to two diameters in aluminum, which is softer. For an $\mathrm{M6}$ screw into aluminum, that means about $1.5 \times 6 = 9\,\mathrm{mm}$ or more. **Sanity check:** the inch thread's $1.27\,\mathrm{mm}$ pitch is close to the metric $\mathrm{M8}$'s $1.25$, which fits: both are ordinary coarse threads of similar size.
:::

### Fasteners as parts

On aerospace drawings, screws, bolts, nuts and washers are rarely described in words. They are called out by standard **part numbers** from industry and government standards (for example the NAS and MS series), each of which fixes material, strength, head shape and plating. The drawing or its notes then add the **installation torque** and any **locking feature**: safety wire, a self-locking nut or insert, or a thread-locking compound. A launch vehicle shakes hard, and a fastener without a locking feature can back itself out.

The torque matters to you for a reason beyond "don't let it fall off". Torque sets the bolt's **[[preload|preload]]** — how hard it clamps the joint. A well-clamped joint is stiff and holds a sensor exactly where it was aligned. A loose one can slip a few micrometers under vibration, and by the small-angle rule from the last lesson, a few micrometers over a short bracket is tens of arcseconds.

::: warning Class and letter are not decoration
$2\mathrm{A}$ and $2\mathrm{B}$ are a matched pair; so are $\mathrm{6g}$ and $\mathrm{6H}$. Mixing classes or reading $\mathrm{A}$ (external) as $\mathrm{B}$ (internal) buys the wrong gauge at inspection. And a callout that leaves off the pitch means the *coarse* pitch, not "any pitch".
:::

## Materials and specifications

Somewhere in the title block or the notes, every part drawing names its material. It does not say "aluminum". It says something like:

> MATERIAL: ALUMINUM ALLOY 6061-T6 PER AMS 4027

Read it in three pieces.

- **Alloy** — $6061$ names a specific recipe of aluminum with small amounts of magnesium and silicon. $7075$ is a stronger aluminum; Ti-6Al-4V is the workhorse titanium alloy (6 percent aluminum, 4 percent vanadium).
- **[[Temper|temper]]** — the $\mathrm{T6}$ after the dash says how the metal was heat-treated. The same alloy in a different temper can be far weaker.
- **[[Specification|material-spec]]** — "PER AMS 4027" names a published **material specification**, a document that fixes the chemistry, the heat treatment, the form (sheet, bar, forging), the tests and the paperwork the mill must supply.

Coatings are called out the same way, in a note such as "ANODIZE PER MIL-A-8625, TYPE II, CLASS 2, BLACK" or "CHEMICAL CONVERSION COAT PER MIL-DTL-5541". The specification, not the word, is the requirement.

Why this fuss? Because the specification is what makes a part traceable. Each batch of metal arrives with a **certification** — a record of its tests — that ties back to the specification on the drawing. If a flight part fails, the investigation can trace it to the mill lot it came from. A drawing that says only "aluminum" or "or equivalent" gives up that chain.

::: key Reading a material callout
Alloy, temper and specification together define the material. The specification fixes chemistry, heat treatment, testing and certification, and it is what the supplier is bound to. Coatings are called out by process specification in notes, separately from surface-texture symbols.
:::

For a GNC engineer, material choice shows up in two places. Different metals expand by different amounts when they warm up, so a titanium tracker on an aluminum bracket bends slightly as the spacecraft moves in and out of sunlight — a thermal alignment error that belongs in the same budget as the stack-up. And a black anodized surface absorbs and radiates heat very differently from bare metal, which changes the temperatures that drive those distortions.

## Check yourself

::: check
A drawing shows the check-mark finish symbol with a small circle inside its V, and the number $3.2$. What does it require?
:::

::: answer
The circle means material removal is prohibited: the surface must be left as produced (cast, forged or rolled), not machined. The $3.2$ is the maximum Ra, $3.2\,\mu\mathrm{m}$ (about $125$ microinches). So the as-produced surface must already be no rougher than an ordinary machined face.
:::

::: check
Five profilometer heights, in micrometers from the mean line, are $+0.5$, $-0.3$, $+0.2$, $-0.6$, $+0.2$. Find Ra and say whether it meets a $0.4\,\mu\mathrm{m}$ maximum.
:::

::: answer
Drop the signs: $0.5, 0.3, 0.2, 0.6, 0.2$. Add: $1.8$. Divide by $5$: Ra $= 0.36\,\mu\mathrm{m}$. That is under $0.4$, so it passes. Check: the signed values sum to $0$, as they should from a mean line.
:::

::: check
A weld symbol has a fillet triangle drawn above the reference line, a $5$ to its left, a circle at the arrow's corner and a flag. Say in words what the welder must do.
:::

::: answer
Above the line means the other side of the joint (the side the arrow does not touch). The triangle means a fillet weld with $5\,\mathrm{mm}$ legs. The circle means weld all around the joint. The flag means it is a field weld, made where the parts are installed rather than in the shop.
:::

::: check
Decode $\mathrm{M5 \times 0.8 - 6H}$ and $\tfrac{3}{8}\text{-}24\ \mathrm{UNF}\text{-}3\mathrm{A}$. For the second, give the pitch in millimeters.
:::

::: answer
$\mathrm{M5 \times 0.8 - 6H}$: ISO metric, $5\,\mathrm{mm}$ major diameter, $0.8\,\mathrm{mm}$ pitch, internal thread (capital $\mathrm{H}$), general-purpose class $6$. $\tfrac{3}{8}\text{-}24\ \mathrm{UNF}\text{-}3\mathrm{A}$: $0.375$ inch diameter, $24$ threads per inch, Unified fine, external thread (the $\mathrm{A}$) with the tighter class $3$ fit. Pitch is $1/24$ inch, and $25.4 / 24 \approx 1.06\,\mathrm{mm}$.
:::

::: check
A gimbal's bearing seat is machined rougher than its drawing allows, but its diameter is in tolerance. Why might the control engineer still object?
:::

::: answer
A rougher seat changes how the bearing sits and rubs, which changes the friction in the gimbal. The actuator model the control loop was tuned against assumed a certain friction. More (or less predictable) friction means sluggish or jumpy response, and a controller that behaves differently in flight from the one on the test bench. Finish controls friction; diameter alone does not.
:::

## Summary

| Symbol or idea | Meaning | Key fact |
| --- | --- | --- |
| Ra | Average height from the mean line, signs dropped | In micrometers or microinches; $1\,\mu\mathrm{m} \approx 39.4$ microinches |
| Finish symbol | Check mark; bar = must machine; circle = no machining | Controls roughness and lay |
| Lay | Direction of tool marks | $=$, $\perp$, X, M, C, R, P |
| Weld symbol | Reference line, arrow, weld shape | Below the line = arrow side (US) |
| Fillet weld | Triangle; size left, length right | Throat $\approx 0.707 \times$ leg |
| Weld extras | Circle, flag, tail | All around, field weld, process |
| Metric thread | $\mathrm{M8 \times 1.25 - 6g}$ | Diameter, pitch, class; g external, H internal |
| Inch thread | $\tfrac{1}{4}\text{-}20\ \mathrm{UNC}\text{-}2\mathrm{A}$ | Diameter, TPI, series, class; A external, B internal |
| Material callout | Alloy, temper, specification | The specification is the requirement |

The next lesson steps back from the individual symbols to the standards that govern the whole drawing, the move from paper drawings to the annotated 3D model, and the export-control markings that decide who may even look at it.

::: context profilometer How roughness is measured
The instrument is a **profilometer**: a diamond-tipped stylus, finer than a hair, dragged slowly across the surface while a sensor records its rise and fall. Optical versions do the same with light. Ra is only one of many numbers it can report; Rz, for example, looks at the tallest peaks and deepest valleys. Ra is the default because it is stable and easy to compare, but two very different surfaces can share the same Ra.
:::

::: context lay Reading the finish symbol
Here are the three versions of the symbol side by side, each with a roughness value, and one with a lay mark.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="100" x2="350" y2="100" stroke="#6c7a93" stroke-width="1.5"/>
  <polyline points="50,83 60,100 82,62" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="68" y="56" font-size="12" text-anchor="middle" fill="#1f2a44">3.2</text>
  <text x="62" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">any process</text>
  <polyline points="170,83 180,100 202,62" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="170" y1="83" x2="190" y2="83" stroke="#1f2a44" stroke-width="2"/>
  <text x="188" y="56" font-size="12" text-anchor="middle" fill="#1f2a44">1.6</text>
  <text x="208" y="96" font-size="12" fill="#1d6fd1">⊥</text>
  <text x="182" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">must machine</text>
  <polyline points="290,83 300,100 322,62" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="301" cy="87" r="5" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="308" y="56" font-size="12" text-anchor="middle" fill="#1f2a44">6.3</text>
  <text x="302" y="122" font-size="11" text-anchor="middle" fill="#1f2a44">no machining</text>
</svg>
```

The middle symbol says: machine this face to Ra $1.6\,\mu\mathrm{m}$ or smoother, with tool marks perpendicular to the edge the symbol touches.
:::

::: context weld-symbol The parts of a weld symbol
Here is a full weld symbol. The arrow touches the joint. The triangle sits below the reference line, so the fillet goes on the arrow side.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="90" y1="60" x2="290" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <line x1="90" y1="60" x2="40" y2="115" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="36,120 39,106 47,113" fill="#1f2a44"/>
  <circle cx="90" cy="60" r="7" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="160,60 160,84 184,60" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="148" y="80" font-size="12" text-anchor="end" fill="#1f2a44">6</text>
  <text x="192" y="80" font-size="12" fill="#1f2a44">100</text>
  <line x1="290" y1="60" x2="306" y2="44" stroke="#1f2a44" stroke-width="2"/>
  <line x1="290" y1="60" x2="306" y2="76" stroke="#1f2a44" stroke-width="2"/>
  <text x="312" y="64" font-size="11" fill="#1f2a44">tail</text>
  <text x="190" y="40" font-size="11" text-anchor="middle" fill="#1f2a44">reference line</text>
  <text x="100" y="92" font-size="11" fill="#1d6fd1">all around</text>
  <text x="40" y="138" font-size="11" fill="#1f2a44">arrow touches joint</text>
  <text x="172" y="106" font-size="11" text-anchor="middle" fill="#b4232c">below = arrow side</text>
</svg>
```

Size sits left of the triangle, length right. A field weld would add a small flag at the circle's position.
:::

::: context weld-throat Anatomy of a fillet weld
A fillet weld seen end-on is a triangle filling the corner between two plates. Its two legs lie along the plates. The throat is the line from the corner to the middle of the weld's face.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="40" y="130" width="280" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="120" y="20" width="20" height="110" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="140,130 140,70 200,130" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="140" y1="130" x2="170" y2="100" stroke="#b4232c" stroke-width="2"/>
  <text x="178" y="98" font-size="12" fill="#b4232c">throat ≈ 0.707 × leg</text>
  <text x="184" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">leg</text>
  <text x="152" y="112" font-size="11" text-anchor="middle" fill="#1f2a44" transform="rotate(-90 152 112)">leg</text>
</svg>
```

Welds usually crack through the throat, the thinnest path, so strength calculations use its area.
:::

::: context helical-insert Steel threads in soft metal
Aluminum is light but its threads are soft and wear out after repeated assembly. A **helical insert** is a coil of hard stainless-steel wire screwed into an oversize tapped hole. It gives the screw a hard, standard thread to bite into and spreads the load over more aluminum. Flight brackets that are assembled and taken apart many times during testing often call for them.
:::

::: context preload A bolt is a stiff spring
Tightening a bolt stretches it very slightly, like a very stiff spring, and the stretch clamps the joint together. That clamping force is the preload. As long as the preload is bigger than the forces trying to pull the joint apart or slide it, the joint acts like one solid piece. Torque is only a rough stand-in for preload, because much of it goes into friction in the threads and under the head, which is why critical joints sometimes measure bolt stretch directly.
:::

::: context temper Same alloy, different strength
Heat treatment rearranges the tiny structure inside a metal. For aluminum, "O" means annealed (soft), "T4" and "T6" are different solution heat treatments and agings, and 6061-T6 is much stronger than 6061-O. A part made from the right alloy in the wrong temper looks identical and passes a dimensional check, which is why the temper is written into the callout and verified by the material certification.
:::

::: context material-spec Who writes the specifications
**AMS** specifications are Aerospace Material Specifications, published by SAE International. **MIL** specifications were written by the US Department of Defense, and many are still in use. Companies also write their own internal specifications for processes they control closely. In every case the idea is the same: a short name on the drawing points to a long, controlled document, so the drawing stays readable while the requirement stays complete.
:::
