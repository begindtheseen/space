---
id: l12-drawings-pmi-and-special-modelling
title: Drawings from models, PMI, sheet metal and the outer mould line
minutes: 26
covers:
  - 'Drawings from models; PMI and model-based definition'
  - 'Sheet metal, weldments and surfacing (awareness); outer mould line'
---

Think of a shadow puppet. Your hand is the real thing. The shadow on the wall is a flat picture of it. Move your hand and the shadow moves with it, instantly, because the shadow is not a separate drawing — it is made from the hand, every moment.

A drawing made in 3D CAD works the same way. You do not draw the part again on the sheet. You point the software at the solid model, and it casts the flat views for you: front, top, side, a cut-away. Change the model and the views change with it. That link is the first idea of this lesson. The second is the step past the sheet entirely, where the annotated model itself is the official description of the part.

Then we look at three special ways of modelling that you will meet around flight hardware: bent **sheet metal**, welded frames called **weldments**, and smooth free-form **surfaces**. We finish with the one surface that aerodynamics, heating and your guidance software all care about most: the **outer mould line**, the outside skin of the vehicle.

## Drawings made from the model

In the last few lessons you built parts from sketches and features, and put them together in assemblies. A **drawing** in NX, SolidWorks, Onshape or CATIA is a separate file (or a separate tab) that *looks at* a part or assembly and lays out views of it on a sheet with a title block.

### Associative views

The first view you place is the **base view** — usually the front view, at a scale you choose, such as 1:2 (half size). From it you drag out **projected views** (top, side), each lined up with the base view by the same projection rules you learned in the drawings module. Then you add a **section view** (the part sliced along a line you draw) and a **detail view** (a small area circled and blown up at a bigger scale).

Every one of these views is **associative** — tied live to the model, so it updates when the model changes. Stretch the bracket by $20\,\mathrm{mm}$ and every view on the sheet grows by $20\,\mathrm{mm}$ at its own scale. Nobody redraws anything. This is the single biggest difference from the AutoCAD way of the first half of this module, where the drawing *is* the geometry and every change is made by hand.

### Two kinds of dimension on a drawing

The dimensions on a model-made drawing come from two places.

- **Model dimensions** are the driving dimensions you typed into sketches and features. The drawing can pull them straight in (SolidWorks calls this "model items", NX "inherit" or "retrieve"). They are two-way: in many programs, editing one on the drawing changes the model itself.
- **Reference dimensions** are measured on the drawing by picking edges, the way you would measure with a ruler. They are one-way. They *read* the model and update when it changes, but you cannot change the model by editing them.

Either way, the number on the sheet is the model's number. That is the whole promise: the drawing cannot quietly disagree with the part, because it is not allowed to hold numbers of its own.

::: warning The dimension that lost its edge
A reference dimension is attached to particular edges. If a model change deletes one of those edges — you replace a sharp corner with a fillet, say — the dimension has nothing to hang on to. CAD programs flag it as **[[dangling|dangling]]** (often drawn in a warning color) rather than deleting it. A dangling dimension that nobody notices can still be printed, showing the old number. Before you release a drawing, look for dangling annotations and fix every one.
:::

### The title block fills itself in

The title block is associative too. The part number, the revision, the material and the mass are stored as **properties** of the model. The drawing template has fields that read those properties. Change the material from aluminum to titanium in the model and the title block's material line changes.

This is also why a drawing and its model are released together: the drawing's revision must describe the model revision it was made from. The next two lessons come back to how a company keeps that pairing straight.

## PMI and model-based definition, from the tool side

In the drawings module you met **model-based definition** (MBD): under **ASME Y14.41**, the annotated 3D model, released under revision control, is the authoritative definition of the part. The annotations on it — dimensions, tolerances, datums, feature control frames, notes, surface finish — are called **PMI**, for product and manufacturing information. In the GD&T module you met the difference between **graphic PMI** (a picture of text for human eyes) and **semantic PMI** (the same tolerance stored as data that machines can read, tied to the actual faces).

Here is what that looks like inside the software.

- **Where you find it.** NX has a PMI toolset built into the modelling application. SolidWorks has a separate MBD add-on. Onshape, CATIA and Creo each have their own. The buttons differ; the job is the same.
- **Attached to faces.** You place a datum feature symbol by picking a face, and a feature control frame by picking the holes it controls. The software records those links. That link is what makes the PMI semantic.
- **Saved views.** A 3D model with fifty annotations floating around it is unreadable. So you create **saved views** (NX and SolidWorks both use this idea): a named camera angle that shows only the annotations for one job, such as "datums" or "hole pattern". They play the role the separate views on a sheet used to play.
- **The general note.** Every surface of a model has an exact position, so MBD models carry a general tolerance note covering any surface not otherwise toleranced, as you saw in the drawings module.
- **Release and export.** The annotated model is released like a drawing. To reach a supplier on different software it travels as a neutral file that can carry semantic PMI — **STEP AP242** is the usual one. The next lesson covers what survives that trip.

::: key Model-based definition, from the tool side
Under ASME Y14.41 the annotated 3D model is the authoritative definition. In the CAD tool, PMI is attached to faces (semantic), organized into saved views, backed by a general tolerance note, released under revision control and exported in a format such as STEP AP242 that can carry it.
:::

Model-made drawings and MBD are not rivals. Many programs make a 2D drawing from the model for the shop floor while the model stays the master. Others are fully MBD with no drawing at all. The rule from the drawings module still holds: find out which one is authoritative for *this* part before you trust any number.

## Sheet metal: parts made by bending

Take a strip of cardboard and fold it sharply. Look at the fold edge-on. The outside of the fold has stretched. The inside has squashed. Somewhere in between is a layer that did neither — it kept its length.

Sheet metal parts work exactly like that. An avionics box, a cable bracket, an electronics chassis, a cover plate: many are cut flat from a sheet and then bent in a press brake. CAD has a special **sheet metal** mode for them. You build the part as flanges and bends, and the software can **flatten** it back to the blank the shop has to cut, called the **flat pattern**.

### The neutral axis and the K-factor

The layer that keeps its length is the **neutral axis**. To get the flat pattern right, you need to know where that layer sits inside the thickness.

Name the pieces:

- $T$ is the sheet **thickness**.
- $R$ is the **inside bend radius** — the radius of the inside of the curve.
- $\theta$ ("theta") is the **bend angle**: how far the flange turns, measured in **[[radians|radians]]**.
- $K$ is the **K-factor**: where the neutral axis sits, as a fraction of the thickness measured from the inside. $K = 0$ would put it on the inside face; $K = 0.5$ puts it exactly in the middle.

Real metal pushes the neutral axis toward the inside of the bend, so $K$ is less than $0.5$, commonly between about $0.3$ and $0.5$. It depends on the material, the thickness, the radius and the way the shop bends. Shops publish their own values, and a good sheet metal model uses the shop's number, not the software default.

### Bend allowance

The **bend allowance** $BA$ is the length of the neutral axis through the curved part of the bend. It is how much flat material the bend eats. The neutral axis is an arc of radius $R + KT$ (inside radius plus $K$ of the thickness), and an arc's length is its angle in radians times its radius, so

$$
BA = \theta \,(R + K T).
$$

Read it aloud as "bend allowance equals theta times, R plus K T". With $\theta$ in radians and $R$, $T$ in millimetres, $BA$ comes out in millimetres. $K$ has no units.

The flat blank is then the flat lengths of every flange plus one bend allowance for every bend.

::: key Bend allowance
$BA = \theta\,(R + K T)$, with $\theta$ the bend angle in radians, $R$ the inside bend radius, $T$ the thickness and $K$ the K-factor (neutral-axis position as a fraction of $T$ from the inside, typically $0.3$ to $0.5$). Flat length = flat flange lengths + one $BA$ per bend.
:::

::: note Why it has to be true
The length of an arc is its radius times its angle in radians — that is what a radian means: an angle whose arc is one radius long. The inside face of the bend is an arc of radius $R$. The outside face is an arc of radius $R + T$. The neutral axis sits a distance $K T$ in from the inside face, so it is an arc of radius $R + K T$. Before bending, that layer was straight and had the same length, because the neutral axis is by definition the layer that does not stretch. So the flat material used up by the bend is $\theta(R + KT)$. As a check, $K = 0$ gives the inside arc length $\theta R$ and $K = 1$ gives the outside arc length $\theta(R+T)$; the true answer lies between.
:::

::: example An L-bracket blank
An aluminum L-bracket is $T = 2\,\mathrm{mm}$ thick with an inside bend radius $R = 2\,\mathrm{mm}$ and one $90^\circ$ bend. The drawing gives the outside leg lengths as $40\,\mathrm{mm}$ and $30\,\mathrm{mm}$. The shop's K-factor is $K = 0.44$. How long is the flat blank?

**Step 1 — the angle in radians.** $90^\circ = \frac{\pi}{2} \approx 1.5708$.

**Step 2 — the neutral radius.** $R + KT = 2 + 0.44 \times 2 = 2 + 0.88 = 2.88\,\mathrm{mm}$.

**Step 3 — the bend allowance.** $BA = 1.5708 \times 2.88 \approx 4.52\,\mathrm{mm}$.

**Step 4 — the flat flanges.** The outside leg length runs to the sharp outside corner, but the curve starts earlier. For a $90^\circ$ bend the straight part of each leg ends $R + T = 4\,\mathrm{mm}$ short of the outside corner. (This distance is the **[[outside setback|setback]]**.) So the flat flanges are $40 - 4 = 36\,\mathrm{mm}$ and $30 - 4 = 26\,\mathrm{mm}$.

**Step 5 — add up.** Flat length $= 36 + 26 + 4.52 = 66.52\,\mathrm{mm}$.

**Sanity check.** Adding the outside legs gives $70\,\mathrm{mm}$, which counts the corner twice as if it were sharp. The real blank is shorter, about $66.5\,\mathrm{mm}$, because the bend is rounded. It is also longer than the inside path, as it must be, since the neutral axis lies outside the inside face. If the shop's K-factor were $0.33$ instead, $BA$ would be $4.18\,\mathrm{mm}$ and the blank $0.35\,\mathrm{mm}$ shorter — enough to put hole patterns across the bend out of position.
:::

::: example A 120-degree bend
A thin cover flange is bent through $\theta = 120^\circ$ from $T = 1.5\,\mathrm{mm}$ sheet, with $R = 3\,\mathrm{mm}$ and $K = 0.40$. Find the bend allowance.

**Angle.** $120^\circ \times \frac{\pi}{180^\circ} = \frac{2\pi}{3} \approx 2.0944$.

**Neutral radius.** $R + KT = 3 + 0.40 \times 1.5 = 3 + 0.6 = 3.6\,\mathrm{mm}$.

**Bend allowance.** $BA = 2.0944 \times 3.6 \approx 7.54\,\mathrm{mm}$.

**Sanity check.** The inside arc is $2.0944 \times 3 \approx 6.28\,\mathrm{mm}$ and the outside arc is $2.0944 \times 4.5 \approx 9.42\,\mathrm{mm}$. Our $7.54\,\mathrm{mm}$ sits between them, closer to the inside, as a K-factor under $0.5$ says it should.
:::

::: warning Degrees in a radian formula
Put $120$ into the formula instead of $2.0944$ and you get $BA = 120 \times 3.6 = 432\,\mathrm{mm}$ for a bend in a part a few centimetres long. The formula needs radians. Convert first, every time, and check the answer against the inside and outside arcs.
:::

In a real sheet metal tool you rarely type this by hand. You set $T$, $R$ and $K$ (or pick the shop's **bend table**) once for the part, and every flange and flat pattern uses them. What you must know is what those numbers mean, so you can tell when a default is wrong.

## Weldments: frames from a skeleton

Picture building a climbing frame from lengths of pipe. You decide the shape first — a box with a diagonal brace — then you pick which pipe to use for each edge, then you cut every piece to length.

A **weldment** in CAD is built the same way. You draw a **skeleton**: lines in 3D showing where each member runs. Then you pick a **structural profile** — square tube, angle, I-beam, round tube — and the software sweeps that profile along each line. You choose how corners meet (mitred or butted), and it trims the members to fit. It then writes a **cut list**: every member, its profile and its cut length, which the shop uses to saw the stock. Weld beads can be shown, and weld symbols from the drawings module go on the drawing.

Where do you meet weldments at a launch company? Mostly on the ground: test-stand frames, engine and stage handling fixtures, transport cradles, work platforms. That is the same ground support world where AutoCAD layouts live, but the frames themselves are usually modelled in 3D so their mass, loads and fit can be checked.

## Surfacing: shapes without thickness

Most parts are **solids**: closed volumes with an inside and an outside. Some shapes are hard to build from sketches and extrudes: a nose cone that blends into a fairing, a duct that curves in two directions at once. For those, designers use **surfacing** — modelling with **surfaces**, which are infinitely thin skins, like soap film on a wire frame.

You build curves, span surfaces between them, trim them and stitch them together. When the skins close up with no gaps, the software **knits** them into a solid, or you **thicken** a skin into a wall. At an awareness level, you need three ideas:

- A surface has no thickness and no volume until it is closed into a solid or thickened.
- How smoothly two surfaces meet is graded by **[[continuity|continuity]]**: G0 (they touch), G1 (they share a slope, like the tangent join from sketching), G2 (they share curvature too, so light reflects without a visible crease). Aerodynamic skins usually want at least G1, often G2.
- Surfacing is a specialist skill. On a large program a few people own the aero surfaces, and everyone else builds parts that attach to them.

## The outer mould line

Now the surface that matters most to a vehicle in flight.

The **outer mould line** — the OML, in American documents usually spelled *outer mold line* — is the outside surface of the vehicle: the skin the air touches. On a rocket it is the barrel of each stage, the interstage, the fairing and the nose, plus everything that sticks out of them, such as cable raceways and fins. The matching inside surface of the structure is the **inner mould line** (IML). The name comes from the old practice of making skins and tools from moulds, where the mould set the outside shape.

Why does it get its own name? Because for the airflow, *only* the OML exists. Nothing inside it can change the pressure on the vehicle or the heat going into it.

- **Aerodynamics** computes lift, drag and moments from the OML. Wind tunnel models are scaled copies of it. Every [[CFD|cfd]] run meshes it.
- **Thermal protection** protects what is inside the OML. On a vehicle with a heat shield or sprayed-on insulation, the OML is the outside of that protection, and the structure sits inside it. So the protection thickness sets where the structure can be.
- **GNC** inherits the OML through the **aerodynamic database**: tables of force and moment coefficients, each computed on the OML and scaled by a **[[reference area|reference-area]]** and length. Your 6-DOF simulation reads those tables.

So the OML is usually one of the most controlled pieces of geometry on a program. Changing it means re-running aerodynamics and heating, and the aero database the guidance and control engineers use.

::: key Outer mould line
The OML is the outermost surface of the vehicle, the one the airflow sees, including the thermal protection and any protuberances. Aerodynamic forces, heating and the aero database are all computed on it; the structure lives inside it, bounded by the inner mould line.
:::

::: example What 5 mm of insulation does to the reference area
A rocket stage has a $3.7\,\mathrm{m}$ diameter. Its aerodynamic reference area is the circle of that diameter:

$$
A_{ref} = \frac{\pi d^2}{4} = \frac{\pi \times 3.7^2}{4} \approx 10.75\,\mathrm{m^2}.
$$

Now suppose a $5\,\mathrm{mm}$ layer of sprayed-on insulation is added on the outside. The OML diameter becomes $3.7 + 2 \times 0.005 = 3.71\,\mathrm{m}$ (the layer is on both sides of the diameter). The area of that circle is $\frac{\pi \times 3.71^2}{4} \approx 10.81\,\mathrm{m^2}$, about $0.54\%$ bigger.

**What it means.** Half a percent is small but not nothing: drag is proportional to the area the air sees, so a drag estimate made on the bare-metal shape runs about half a percent low. The bigger lesson is bookkeeping. Anyone building an aero model must know whether they were handed the bare structure or the true OML, and which diameter the database's reference area uses.
:::

::: warning The OML is not the structure
The CAD model of a tank is usually modelled to the structure. The OML may include insulation, protection, raceways and fairings that belong to other teams' models. Taking the tank diameter as the OML, or the OML as the structure, is a classic interface mistake. Ask which one a model is.
:::

## Check yourself

::: check
A designer adds a fillet to a corner of a part. On the drawing, one dimension turns orange and another updates to a new value. Explain both.
:::

::: answer
The views and dimensions are associative. The dimension that updated was attached to edges that still exist; it read the model again and shows the new value. The orange one was attached to the sharp corner edge that the fillet removed, so it is dangling: it has nothing to measure. It must be re-attached or deleted before the drawing is released, or it may print an old, wrong number.
:::

::: check
What is the difference between graphic PMI and semantic PMI, and which one does a CMM program generator need?
:::

::: answer
Graphic PMI is text and symbols drawn in 3D for people to read; the software only knows it as a picture. Semantic PMI stores the tolerance type, value, modifiers, datum references and the faces it applies to as data linked to the geometry. A CMM (or CAM) program generator needs semantic PMI, because it has to know which faces to measure and what zone to check them against.
:::

::: check
A $90^\circ$ bend is made in $3\,\mathrm{mm}$ steel with inside radius $R = 4.5\,\mathrm{mm}$ and $K = 0.45$. Find the bend allowance.
:::

::: answer
Angle: $\frac{\pi}{2} \approx 1.5708$. Neutral radius: $R + KT = 4.5 + 0.45 \times 3 = 4.5 + 1.35 = 5.85\,\mathrm{mm}$. Bend allowance: $BA = 1.5708 \times 5.85 \approx 9.19\,\mathrm{mm}$. It lies between the inside arc ($1.5708 \times 4.5 \approx 7.07\,\mathrm{mm}$) and the outside arc ($1.5708 \times 7.5 \approx 11.78\,\mathrm{mm}$), as it should.
:::

::: check
Why is the K-factor less than $0.5$ for real bends, and why should a model use the shop's value rather than the software's default?
:::

::: answer
During bending the inside of the bend is squeezed and the outside stretched, and the layer that keeps its length ends up pulled toward the inside, so it sits less than halfway through the thickness. The exact position depends on material, thickness, radius and the bending method, which the shop knows and the software does not. A wrong K-factor gives a wrong flat blank, and features placed across the bend (holes, slots) end up in the wrong place.
:::

::: check
A test-stand frame, a nose fairing and a cable bracket need to be modelled. Which of sheet metal, weldment and surfacing fits each best?
:::

::: answer
The test-stand frame is a weldment: members swept along a skeleton, with a cut list for the shop. The nose fairing's outside shape is a surfacing job, because it is a smooth doubly curved skin that becomes part of the OML. The cable bracket is sheet metal: cut flat, bent, and flattened in CAD to give the blank.
:::

::: check
Name three groups of engineers who work from the outer mould line and say what each uses it for.
:::

::: answer
Aerodynamicists compute forces and moments on it, in CFD and with wind tunnel models. Thermal engineers size the protection that forms it and work out the heating across it. GNC engineers use the aero database computed on it, scaled by its reference area, inside their 6-DOF simulation. (Structures engineers also care: the structure must fit inside it, bounded by the inner mould line.)
:::

## Summary

| Idea | Meaning | Formula or fact |
|---|---|---|
| Associative view | A drawing view made from the model | Updates when the model changes |
| Model vs reference dimension | Driving number vs measured number | Reference dimensions are one-way; watch for dangling ones |
| MBD (ASME Y14.41) | Annotated model is the definition | Semantic PMI on faces, saved views, general note, STEP AP242 |
| K-factor | Neutral-axis position as a fraction of $T$ | Typically $0.3$ to $0.5$ |
| Bend allowance | Flat length used by one bend | $BA = \theta(R + KT)$, $\theta$ in radians |
| Weldment | Profiles swept along a skeleton | Produces a cut list; test stands and fixtures |
| Surfacing | Zero-thickness skins | Continuity G0, G1, G2; knit or thicken into solids |
| Outer mould line | The surface the airflow sees | Aero, heating and the aero database live on it |

Next lesson: what happens when a model leaves its home program — the neutral formats STEP, IGES, Parasolid and JT, what each one keeps and loses — and which companies use which CAD system.

::: context dangling A dimension with nothing to hold
"Dangling" is the CAD word for an annotation whose anchor is gone. Think of a label tied to a balloon that has popped: the tag is still there, but it no longer points at anything. The software keeps the dimension so you can see what was lost and re-attach it, rather than silently deleting information. That is helpful, but only if someone looks. Many companies make "no dangling annotations" a checklist item in drawing review, alongside "every sketch fully defined".
:::

::: context radians Measuring angles by arc length
A radian measures an angle by how much arc it sweeps out. Wrap a string one radius long around the edge of a circle: the angle it covers is one radian, about $57.3^\circ$. A full circle is $2\pi$ radians ($360^\circ$), so to convert, multiply degrees by $\frac{\pi}{180}$. The payoff is that arc length becomes a plain product: arc $= $ angle $\times$ radius. That is why the bend allowance formula is so short.
:::

::: context setback Where the straight part of a flange ends
Dimensions on sheet metal drawings are often given to the **mold line** (sheet metal borrows the word too) — where the flat outside faces would meet if the corner were sharp. The real metal curves away before it gets there. The distance from that imaginary sharp corner back to where the curve starts is the **outside setback**, $(R + T)\tan(\theta/2)$. For a $90^\circ$ bend, $\tan 45^\circ = 1$, so it is $R + T$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M40,30 L40,120 A40,40 0 0,0 80,160 L300,160" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M60,30 L60,120 A20,20 0 0,0 80,140 L300,140" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <path d="M40,120 L40,160 L80,160" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <circle cx="40" cy="160" r="4" fill="#b4232c"/>
  <line x1="40" y1="176" x2="80" y2="176" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="182" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="80" y1="170" x2="80" y2="182" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="90" y="192" font-size="12" fill="#1f2a44">setback = R + T (90° bend)</text>
  <text x="120" y="40" font-size="12" fill="#b4232c">red dot: imaginary sharp corner</text>
  <text x="96" y="126" font-size="12" fill="#1f2a44">inside radius R</text>
  <line x1="310" y1="140" x2="310" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="318" y="155" font-size="12" fill="#1f2a44">T</text>
</svg>
```

Subtract the setback from each outside leg length to get the straight flange lengths before adding the bend allowance.
:::

::: context continuity How smooth is smooth
Picture a skateboard ramp. G0: the ramp and the ground touch, but there may be a sharp lip — you trip. G1: the ramp meets the ground at the same slope, no lip, but you feel a jolt where the curve starts. G2: the curve itself eases in, so the ride is smooth all the way. The G stands for geometric continuity. For airflow, a G1 crease can still trigger a change in the flow, which is why aerodynamic skins often demand G2.
:::

::: context cfd Air flow by computer
CFD stands for computational fluid dynamics: solving the equations of airflow on a computer. The software fills the space around the OML with a mesh of millions of small cells and works out pressure and velocity in each one. Summing the pressure over the OML gives the forces and moments. Small defects in the OML surface — a gap, a tiny sliver of surface, a bump from a badly joined patch — can wreck the mesh, which is one reason the aero surfaces are kept so clean.
:::

::: context reference-area The area the coefficients are scaled by
Aerodynamic data are stored as dimensionless coefficients. The drag force is

$$
D = q\, C_D\, A_{ref},
$$

where $q$ is the dynamic pressure (how hard the air is hitting), $C_D$ the drag coefficient and $A_{ref}$ a chosen reference area — for a rocket, usually the circle of the body diameter. The choice is a convention, so the same vehicle can have different-looking coefficients in two databases. What must never happen is a coefficient computed with one reference area being used with another.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <path d="M40,55 L230,55 L300,75 L230,95 L40,95 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="45" x2="40" y2="105" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="48" y="122" font-size="12" fill="#1f2a44">diameter d</text>
  <ellipse cx="320" cy="75" rx="12" ry="20" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <text x="268" y="130" font-size="12" fill="#1f2a44">A = πd²/4</text>
  <text x="100" y="30" font-size="12" fill="#b4232c">airflow sees only the OML</text>
</svg>
```
:::
