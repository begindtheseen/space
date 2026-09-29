---
id: l09-the-feature-tree-and-design-intent
title: The feature tree and design intent
minutes: 21
covers:
  - The feature tree, parent-child relationships, design intent, robust versus fragile modeling
---

Think about a recipe for a layer cake. Bake the sponge. Cut it in half. Spread jam on one half. Put the other half on top. Ice the whole thing. Each step works on whatever the step before it produced. Now suppose you decide, after it is iced, that the sponge should have been baked in a bigger pan. In a kitchen that means starting over. In a CAD program it does not: you go back, change the pan size, and the program re-runs every step after it, by itself, in order.

That is the power of a parametric model, and also its trap. Every later step has to still make sense on the new, bigger sponge. "Cut it in half" still works. But a step that said "spread the jam starting 3 cm from that lumpy bit on the left edge" might land somewhere silly, or fail, because the lumpy bit is gone.

Last lesson you learned the features. This lesson is about the list they sit in, how features lean on each other, and how to build a model that bends the way you meant when someone changes a number, instead of breaking. That skill is what the module's objective means by "a feature tree that survives a dimension change".

## The feature tree is the recipe

The **[[feature tree|tree-travels]]** (or **history tree**) is the ordered list of every sketch and feature in a part, from the first to the last. Onshape calls it the **Feature list**. SolidWorks calls it the FeatureManager design tree. NX shows it in the **[[Part Navigator|nx-navigator]]**. The names differ; the idea is the same.

At the top sit the origin and the three default planes. Below them come the features, in the order you made them. When anything changes, the program **rebuilds** — or **regenerates** — the part by replaying the list from the top, one feature at a time.

Here is a typical tree for a small [[reaction wheel|reaction-wheel]] mounting bracket:

1. Origin, Top plane, Front plane, Right plane
2. Sketch 1 on Top — the plate outline
3. Extrude 1 — the plate, $6\,\mathrm{mm}$ thick
4. Sketch 2 on the top face of the plate — the upright's outline
5. Extrude 2 — the upright
6. Fillet 1 — where the upright meets the plate
7. Sketch 3 — the positions of the mounting holes
8. Hole 1 — clearance holes for the wheel
9. Linear pattern 1 — copies of the hole

Three tools let you work with the list. The **[[rollback bar|rollback-bar]]** lets you drag back to an earlier point, see the part as it was then, and insert a feature there. **Reorder** moves a feature up or down the list, when that is allowed. **Suppress** turns a feature off temporarily without deleting it — handy for making a simplified version of a part.

## Parents and children

When a feature uses another one, they become **parent** and **child**. The **parent** is the feature being leaned on; the **child** is the feature that leans on it. A feature can have many parents and many children.

A child is created whenever you:

- **sketch on a face** — the feature that made the face becomes a parent of the sketch;
- **dimension or constrain to an edge, face or vertex** of the solid — the feature that made that edge becomes a parent;
- **select edges or faces for a feature** — a fillet is a child of every feature whose edges it rounds;
- **use an end condition like "up to face"** — the feature that made the face is a parent.

In the tree above, Sketch 2 is a child of Extrude 1 because it sits on the plate's top face. Fillet 1 is a child of both extrudes. Hole 1 is a child of Sketch 3, and the pattern is a child of Hole 1.

The rule that follows is simple and strict. **A child can only exist after its parents in the tree.** You cannot reorder a child above its parent. And if you delete or change a parent, every child — and every child of those children — may be affected. Most programs can show you the parents and children of any feature; it is worth looking before you delete something.

::: warning A long chain is a fragile chain
If every feature is a child of the one before it, a change near the top ripples all the way down. A model where most sketches sit on the default planes, and most dimensions go to the origin, has short chains. A change to one feature then touches only its own few children.
:::

## Design intent

Two bracket models can look exactly alike on screen today and behave completely differently tomorrow. The difference is what each model *knows* about why it is shaped the way it is.

**Design intent** is the set of rules about a part that must stay true when something changes. It is the engineer's reasons, written into the model as constraints, dimensions and references.

::: key Design intent, concretely
The set of relationships that should survive a change: this hole stays concentric with that boss, this wall stays 2 mm thick, this flange follows the mounting pattern. A model with design intent updates correctly when a dimension changes; one without it breaks.
:::

Before you model anything, ask the questions a reviewer will ask. What does this part attach to? Which numbers come from somewhere else — a bolt pattern on the wheel, a panel thickness, a harness clearance — and so must never drift? Which numbers are free and only need to be "enough"? What is symmetric *because it has to be*, not by accident? What is likely to change?

Then capture the answers with the tools from the last two lessons:

- a **symmetric** constraint about a default plane, when the part must be centered;
- a **concentric** constraint between a hole and the boss around it, rather than two matching numbers;
- a **named variable or equation** when one number depends on another, such as the plate width being hole spacing plus $20\,\mathrm{mm}$;
- the right **end condition**: Through all for a hole that must go through, "up to" a plane when a face must line up with something else.

## Robust and fragile modeling

A **robust** model rebuilds correctly, and still means what it meant, when a dimension changes. A **fragile** model either fails to rebuild, or — worse — rebuilds without complaint into the wrong shape.

The habits that make models robust:

1. **Sketch on default planes or datum planes**, not on faces, when you can. The Top plane never disappears. A face might.
2. **Dimension to the origin and default planes**, not to edges of the solid, especially not to edges made by fillets or chamfers.
3. **Never reference an edge that might disappear.** Fillet edges, the seam where two faces meet, the edge of a pocket that a later change could remove — these come and go.
4. **Put fillets, chamfers and cosmetic features near the end.** Few things should ever be children of a fillet.
5. **Use end conditions that say what you mean.** "Through all", not "blind 6 mm" for a through hole.
6. **Keep sketches fully defined.** A loose sketch is fragile before anything else happens.
7. **Name the features that matter.** "Wheel bolt holes" tells a colleague more than "Sketch 7".

Then test it. Change the key dimensions to their likely extremes, rebuild, and look. This habit is sometimes called [[flexing the model|flex-test]].

::: example Widening the bracket: a silent break
Here is the story of a real kind of mistake. A bracket base plate is $80\,\mathrm{mm}$ wide. It carries two holes for a reaction wheel whose bolt holes are $60\,\mathrm{mm}$ apart.

**The fragile version.** The modeler put each hole $10\,\mathrm{mm}$ from the nearest end edge. On the $80\,\mathrm{mm}$ plate the spacing comes out as $80 - 2 \times 10 = 60\,\mathrm{mm}$. It fits. It passes review, because the drawing shows the right numbers.

Months later, a harness needs more room and the plate is widened to $100\,\mathrm{mm}$. The model rebuilds with no error. The holes are still $10\,\mathrm{mm}$ from each edge, so their spacing is now $100 - 2 \times 10 = 80\,\mathrm{mm}$. The wheel's holes are $60\,\mathrm{mm}$ apart. They miss by $80 - 60 = 20\,\mathrm{mm}$ — $10\,\mathrm{mm}$ at each hole. Nothing turned red. The error is only found when a technician tries to bolt the wheel on.

**The robust version.** The two holes are symmetric about the Right plane, and the dimension between them is $60\,\mathrm{mm}$ — the number that actually came from the wheel. Widen the plate to $100\,\mathrm{mm}$ and the holes stay $60\,\mathrm{mm}$ apart and centered. Their distance to each edge grows from $(80 - 60)/2 = 10\,\mathrm{mm}$ to $(100 - 60)/2 = 20\,\mathrm{mm}$, which is fine, because that number never carried any intent.

Both models were "correct" at $80\,\mathrm{mm}$. Only one of them knew *why* it was correct.
:::

::: warning Silent breaks are worse than loud ones
A rebuild error is annoying but safe: you see it and fix it. A model that rebuilds into the wrong shape is dangerous, because the drawing, the mass properties and the part all come out wrong and look right. Robust modeling is mostly about turning silent breaks into either correct updates or loud errors.
:::

## The topological naming problem

There is one more way models break, and it has a name you will hear in every CAD discussion.

When a feature says "round *this* edge" or "sketch on *that* face", the program has to remember which edge or face you meant. Inside the software, faces and edges are the solid's **topology** — its list of faces, the edges between them, and the corners. The program gives each one an internal name based on how it was made. When an earlier feature changes, the solid is rebuilt from scratch, and a new set of faces and edges comes out. The program then has to match the new ones to the old names.

Usually it can. But if the change [[splits a face in two|topology-split]], *merges* two faces into one, or makes an edge vanish, the old name may point to nothing, or to the wrong face. This is the **topological naming problem**: references to faces and edges can be lost or re-attached to the wrong geometry when an upstream change alters the solid's topology.

Commercial systems — NX, CATIA, Creo, SolidWorks, Onshape — have spent decades on clever matching, and they get it right most of the time. None of them can be right every time, because sometimes there is no single right answer: if one face became two, which one did you mean? The open-source program [[FreeCAD|freecad]] was long known for how often it tripped on this, and its developers worked on it for years. The defense is the same everywhere, and it is the list above: reference planes and the origin, which never change, instead of faces and edges, which can.

::: example Thickening the plate: two loud breaks and one quiet one
Take the robust bracket from the last example, but with three shortcuts in it. The plate is $6\,\mathrm{mm}$ thick. The wheel holes were cut **blind, $6\,\mathrm{mm}$ deep**, which went exactly through. Sketch 3, which places the wheel holes, was dimensioned $8\,\mathrm{mm}$ from the edge of **Fillet 1** where the upright meets the plate. And the upright was sketched on the plate's top face.

A stress analysis asks for a stiffer plate: $6\,\mathrm{mm}$ becomes $8\,\mathrm{mm}$.

**The quiet one.** The wheel holes rebuild without complaint, still $6\,\mathrm{mm}$ deep. The plate is now $8\,\mathrm{mm}$ thick, so $8 - 6 = 2\,\mathrm{mm}$ of metal is left at the bottom of each hole. They no longer go through. With "Through all" they would have.

**Fine, as intended.** The upright's sketch sits on the top face of the plate, so the upright moves up with it: its base goes from $6$ to $8\,\mathrm{mm}$ above the bottom, and if it is $10\,\mathrm{mm}$ tall its top goes from $6 + 10 = 16$ to $8 + 10 = 18\,\mathrm{mm}$. Whether that is right depends on the intent. If the wheel must sit at exactly $16\,\mathrm{mm}$, the upright should have been extruded *up to* a datum plane at $16\,\mathrm{mm}$ instead.

**The loud ones.** Next, for a simplified analysis model, someone suppresses Fillet 1. Sketch 3's dimension now points to an edge that does not exist. The sketch reports a missing reference, Hole 1 fails, and the pattern that copies it fails too — three red features from one suppressed fillet. Dimensioning the hole from the Front plane would have avoided all three.
:::

::: note Why "reference the planes" works
The default planes and the origin are the only geometry that exists before any feature. They are made by nothing, so no change to any feature can move, split or delete them. Anything tied only to them has no parent features at all, and no topology change upstream can reach it. A datum plane you create from the default planes (say, $16\,\mathrm{mm}$ above Top) is almost as safe: its only parent is a plane that cannot change.
:::

## Reading someone else's tree

At work you will open far more models than you build. A quick check tells you a lot:

- **Are the sketches fully defined?** Any under-defined sketch is a warning sign.
- **Where do the sketches sit?** Mostly on default or datum planes is good. A long chain of sketches each on the face of the last feature is fragile.
- **Are fillets near the end?** Fillets early in the tree, with many children, are fragile.
- **Are the key features named?**
- **Does it flex?** Change the main dimension, rebuild, and look at what moves.

These are the same questions a mechanical [[design review|design-review]] asks, and a GNC engineer who can ask them earns trust with the mechanical team. Next lesson, the same ideas return one level up: parts reference each other in an **[[assembly|assembly-bridge]]**, and the danger of a hidden parent gets bigger.

## Check yourself

::: check
In the example tree, Fillet 1 rounds the edge where Extrude 2 meets Extrude 1. Name its parents, and explain why you cannot drag it above Extrude 2 in the list.
:::

::: answer
Its parents are Extrude 1 and Extrude 2, because the edge it rounds is made by both of them. A child must come after all of its parents in the tree: when the rebuild reaches Fillet 1, the edge has to exist already. Above Extrude 2, the edge would not exist yet, so the software will not allow the reorder.
:::

::: check
Write down one piece of design intent for a reaction wheel bracket and say which constraint or setting captures it.
:::

::: answer
For example: "the two mounting holes must be $60\,\mathrm{mm}$ apart, because that is the wheel's bolt pattern, and centered on the plate". Capture it with a symmetric constraint about the Right plane and a single $60\,\mathrm{mm}$ dimension between the holes. Another: "the holes must always go right through" — capture it with a Through all end condition. Another: "each hole stays concentric with its boss" — a concentric constraint.
:::

::: check
A mounting hole on a housing is dimensioned from the edge of a $3\,\mathrm{mm}$ fillet. Explain in terms of the topological naming problem what can go wrong, and give a robust fix.
:::

::: answer
The fillet's edge is topology made by the fillet feature. If the fillet's radius changes, the edge moves; if the fillet is suppressed or replaced by a chamfer, the edge disappears or becomes a different edge. The sketch's reference then points to nothing (a rebuild error) or gets re-attached to a different edge (a silent shift). The fix is to dimension the hole from a default plane or the origin, or from a datum plane, which cannot change.
:::

::: check
A plate is $120\,\mathrm{mm}$ wide with two holes placed $15\,\mathrm{mm}$ from each end. The part it bolts to has holes $90\,\mathrm{mm}$ apart. Does it fit now? What happens if the plate is shortened to $110\,\mathrm{mm}$, and how should it have been modeled?
:::

::: answer
Now: spacing $120 - 2 \times 15 = 90\,\mathrm{mm}$, so it fits. At $110\,\mathrm{mm}$: $110 - 2 \times 15 = 80\,\mathrm{mm}$, which misses the $90\,\mathrm{mm}$ pattern by $10\,\mathrm{mm}$, and the model rebuilds with no warning. It should have had the holes symmetric about the center plane with a $90\,\mathrm{mm}$ dimension between them; then each hole would sit $(110 - 90)/2 = 10\,\mathrm{mm}$ from its end after the change.
:::

::: check
Why is a model that fails to rebuild after a change often *better* than one that rebuilds into the wrong shape?
:::

::: answer
A failed rebuild is visible: features turn red and someone has to fix them before the model can be used. A wrong-but-successful rebuild is invisible: the drawing, the mass properties and the parts made from them all carry the error, and it may only be found at assembly, in test, or later. Robust modeling aims for correct updates, and where that is impossible, for loud failures rather than silent ones.
:::

## Summary

| Idea | Meaning | What to do |
|---|---|---|
| Feature tree | Ordered list of sketches and features, replayed on rebuild | Read it top to bottom; use rollback, reorder, suppress |
| Parent, child | A child references geometry made by its parent | A child must come after its parents; check before deleting |
| Design intent | Relationships that must survive a change | Capture with symmetric, concentric, equations, end conditions |
| Robust model | Rebuilds correctly after a change | Reference planes and origin; fillets late; Through all |
| Fragile model | Fails or silently rebuilds wrong | Avoid references to fillet edges and faces that may vanish |
| Topological naming problem | Face and edge references lost or re-attached after upstream changes | Reference geometry that cannot change |
| Flex test | Change key dimensions to extremes and look | Do it before review |

The next lesson puts parts together into assemblies with mates, and shows how referencing one part from another spreads parent-child links across a whole vehicle.

::: context tree-travels The tree lives in the native file
The feature tree exists only in the CAD program's own file format. Export the part as a neutral file such as STEP and what arrives is the finished shape — no sketches, no constraints, no history. The person receiving it cannot change the plate width and watch the holes follow. Lesson 13 covers the exchange formats and what each one keeps.
:::

::: context nx-navigator The tool you would meet at SpaceX
SpaceX designs its vehicles in Siemens NX, with Teamcenter managing the data. In NX the feature list is shown in the Part Navigator, and NX calls sketch-and-feature modeling with a history "history mode". The ideas in this lesson carry over directly; only the button names change.
:::

::: context reaction-wheel Why a GNC engineer cares about this bracket
A reaction wheel is a heavy flywheel driven by a motor. Spin it faster one way and the spacecraft turns the other way, which is how many satellites point their cameras and antennas without burning propellant. The wheel's spin axis must sit where the attitude control design says it does, so the bracket that holds it is a GNC-critical part: a hole in the wrong place tilts the axis.
:::

::: context rollback-bar Going back in time inside a part
The rollback bar is a line at the bottom of the feature list that you can drag upward. Everything below it is hidden, and the part appears as it was at that step. New features are inserted where the bar sits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="20" y="22">Sketch 1</text>
    <text x="20" y="42">Extrude 1 (plate)</text>
    <text x="20" y="62">Sketch 2</text>
    <text x="20" y="82">Extrude 2 (upright)</text>
  </g>
  <line x1="15" y1="92" x2="200" y2="92" stroke="#b4232c" stroke-width="3"/>
  <text x="210" y="96" font-size="12" fill="#b4232c">rollback bar</text>
  <g font-size="12" fill="#6c7a93">
    <text x="20" y="112">Fillet 1</text>
    <text x="20" y="132">Hole 1</text>
    <text x="20" y="152">Linear pattern 1</text>
  </g>
  <text x="210" y="140" font-size="11" fill="#6c7a93">grey: not yet rebuilt</text>
</svg>
```

It is how you add a feature early in the tree without rebuilding everything by hand.
:::

::: context flex-test Bend it before someone else does
Flexing a model means deliberately changing its main dimensions — much bigger, much smaller, thicker, thinner — and rebuilding, to see whether it behaves. Anything that fails, or moves in a way you did not expect, shows a place where the intent is missing. It takes a few minutes, and it finds the problem while you still remember why each feature is there. Then set the numbers back.
:::

::: context topology-split When one face becomes two
A fillet was placed on the top edge of face F. Then a slot is cut across the part, splitting F into two faces. Which one does "face F" mean now?

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="40" width="140" height="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="90" y="75" font-size="13" text-anchor="middle" fill="#1f2a44">face F</text>
  <text x="90" y="125" font-size="11" text-anchor="middle" fill="#1f2a44">before</text>
  <rect x="200" y="40" width="55" height="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <rect x="285" y="40" width="55" height="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="227" y="75" font-size="13" text-anchor="middle" fill="#1f2a44">F?</text>
  <text x="312" y="75" font-size="13" text-anchor="middle" fill="#1f2a44">F?</text>
  <text x="270" y="125" font-size="11" text-anchor="middle" fill="#b4232c">after a slot: which is F?</text>
</svg>
```

The software has to guess. It usually picks sensibly, but no rule works for every case, which is why references to planes are safer.
:::

::: context freecad A free program and a famous problem
FreeCAD is a free, open-source parametric modeler. For years, users met the topological naming problem there more often than in commercial tools: change an early sketch and a later feature might jump to the wrong face or fail. Reducing it was a major part of the work toward FreeCAD's 1.0 release in 2024. The lesson it teaches applies in every program: the fewer references to faces and edges, the fewer chances to go wrong.
:::

::: context design-review What a model review looks at
In a design review, other engineers look over a part before it is released. For the drawing they check dimensions and tolerances. For the model they check that sketches are fully defined, that the tree is clean, that the material is right, and that the model flexes. Many companies keep a written checklist, and an under-defined sketch or a reference to a fillet edge is a finding that must be fixed.
:::

::: context assembly-bridge Parents in other files
Inside one part, parent-child links are visible in one list. In an assembly, you can model one part by referencing geometry of another part — a bracket whose holes are copied from the panel it bolts to. That is called in-context design. It captures real intent, but the parent now lives in a different file, and changing it can quietly change the child. Lesson 10 treats it in detail.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="35" width="120" height="44" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">panel.prt</text>
  <rect x="220" y="35" width="120" height="44" rx="6" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="280" y="62" font-size="12" text-anchor="middle" fill="#1f2a44">bracket.prt</text>
  <line x1="140" y1="57" x2="210" y2="57" stroke="#b4232c" stroke-width="2"/>
  <polygon points="220,57 208,51 208,63" fill="#b4232c"/>
  <text x="180" y="100" font-size="11" text-anchor="middle" fill="#b4232c">hole pattern copied from parent</text>
</svg>
```
:::
