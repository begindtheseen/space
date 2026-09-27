---
id: l07-material-condition-and-bonus
title: MMC, LMC, RFS and bonus tolerance
minutes: 20
covers:
  - Material condition modifiers MMC, LMC and RFS; bonus tolerance
---

Think about putting a key into a lock on a dark porch. If the keyhole is tight, your hand has to be right on target. If the keyhole were a little wider, you could be a little off and the key would still slide in. The extra width *buys* you aim.

A bolt through a hole works the same way. The hole's job is to let the bolt through. A hole made a bit bigger than its smallest allowed size has extra room around the bolt, so the hole can sit a bit farther from its perfect spot and the bolt still goes in. GD&T lets the drawing say exactly that, with one small circled letter in the feature control frame.

This lesson is about that letter. You will learn the three **material conditions** — ways of saying which size of a feature the tolerance is written for — and how one of them turns extra clearance into extra positional tolerance, called **bonus tolerance**. On a spacecraft this is everyday: the bolt holes in a star tracker bracket, an avionics box, or a thruster mounting flange very often carry position at maximum material condition. It lets the machine shop keep more parts, without ever letting a bolt fail to go in.

## Most metal, least metal

Lesson 6 gave you position: the axis of a hole must lie inside a round zone at its true position. But a real hole also has a size range. A drawing might say the hole is $\varnothing\,10.0$ to $10.3\,\mathrm{mm}$. Any diameter in that range is a good size.

Now ask a strange-sounding question: at which size does the part hold the *most metal*?

- For a **hole**, the most metal is left when the hole is *smallest*, because less was drilled away. So the hole's **maximum material condition**, or **MMC** — the size at which the feature contains the most material — is its smallest size: $10.0$.
- For a **shaft** or pin, the most metal is there when it is *largest*. Its MMC is its largest size.

The opposite end of the range is the **least material condition**, or **LMC** — the size with the least material. For a hole that is its largest size, $10.3$. For a shaft it is its smallest size.

This works for any **[[feature of size|feature-of-size]]** — a feature you can measure across between two opposite surfaces, like a hole, a pin, a slot or a tab. It does not work for a single flat face, because a face has no size.

::: key MMC, LMC and RFS
Maximum material condition is the size with the most material (largest shaft, smallest hole); LMC is the opposite; regardless of feature size means no bonus applies. MMC is used where assembly clearance is the function; LMC where wall thickness or minimum material matters.
:::

::: warning Holes turn it upside down
The most common slip is to say "maximum" means "biggest number". For a shaft it does. For a hole it is the *smallest* number. Say it the long way every time until it sticks: "most metal left on the part". A small hole leaves the most metal.
:::

Why would anyone care which end has the most metal? Because MMC is the *worst case for fitting things together*. The smallest hole meeting the fattest bolt is the tightest fit the drawing allows. If the parts go together at MMC, they go together at every other size too.

## The three modifiers in the frame

In lesson 1 you met the second box of a feature control frame: zone shape, zone size, then an optional modifier. There are three choices:

- **Ⓜ**, read "at M-M-C". The stated tolerance applies when the feature is at MMC. As the feature departs from MMC, the tolerance grows by the same amount.
- **Ⓛ**, read "at L-M-C". The stated tolerance applies when the feature is at LMC. As the feature departs from LMC, the tolerance grows.
- **No modifier**, which means **regardless of feature size**, or **RFS** — the tolerance is the same number whatever size the feature is made. No growth, no bonus. Under the current standard RFS is the **[[default when no symbol appears|rfs-default]]**, so you will never see a circled S on a modern drawing.

The extra tolerance you gain as the feature moves away from its stated condition is **bonus tolerance** — tolerance earned by the actual size of the part.

## Bonus tolerance at MMC

Here is the rule for Ⓜ, in words first. Measure the actual size of the feature. Find how far it is from MMC. That distance is the bonus. Add it to the tolerance printed in the frame.

$$
\text{bonus} = \left|\,\text{actual size} - \text{MMC size}\,\right|
$$

$$
\text{allowed position tolerance} = \text{stated tolerance} + \text{bonus}
$$

The vertical bars $|\ |$ mean "size of, ignoring the sign" (read "the absolute value of"). They are there so the same rule works for holes, which grow away from MMC, and for shafts, which shrink away from it.

Take the hole from the flashcards: $\varnothing\,10.0$ to $10.3$, position $\varnothing\,0.2$ at MMC. MMC is $10.0$ and LMC is $10.3$. [[Watch the zone grow|bonus-picture]] as the hole gets bigger:

| Hole made at | Departure from MMC | Stated | Allowed zone |
| --- | --- | --- | --- |
| $10.0$ | $0.0$ | $0.2$ | $\varnothing\,0.2$ |
| $10.1$ | $0.1$ | $0.2$ | $\varnothing\,0.3$ |
| $10.2$ | $0.2$ | $0.2$ | $\varnothing\,0.4$ |
| $10.3$ | $0.3$ | $0.2$ | $\varnothing\,0.5$ |

At its biggest allowed size, the hole gets more than twice the positional tolerance it had at its smallest. The bonus can never be bigger than the whole size tolerance, $10.3 - 10.0 = 0.3$, because a hole outside its size range is rejected for size anyway.

::: key Bonus tolerance with a number
A hole with MMC diameter $10.0$ and LMC $10.3$ carrying position $\varnothing\,0.2$ at MMC: produced at $10.0$ you get $0.2$; produced at $10.3$ you get $0.2 + 0.3$, that is $0.5$ of positional tolerance, because the extra clearance can absorb the same assembly error.
:::

"Actual size" needs one more word of care. A real hole is never perfectly round and straight, so which diameter do you use? For bonus, you use the **[[actual mating size|actual-mating-size]]** — the diameter of the largest perfect pin that fits all the way into the hole. That is the size a bolt actually "feels".

::: example A clearance hole on an avionics bracket
An avionics bracket has clearance holes for M6 screws. Each hole is $\varnothing\,6.6$ to $6.8\,\mathrm{mm}$, with position $\varnothing\,0.25$ at MMC to A, B, C. An inspector measures one hole. Its actual mating size is $6.72\,\mathrm{mm}$. Its axis is $0.09\,\mathrm{mm}$ off true position in $x$ and $0.12\,\mathrm{mm}$ off in $y$.

**Size first.** $6.72$ is between $6.6$ and $6.8$. Size is good.

**MMC.** A hole's MMC is its smallest size: $6.6$.

**Bonus.** $6.72 - 6.6 = 0.12\,\mathrm{mm}$.

**Allowed zone.** $0.25 + 0.12 = 0.37\,\mathrm{mm}$ diameter.

**Actual miss as a diameter.** The straight-line miss is $\sqrt{0.09^2 + 0.12^2} = \sqrt{0.0081 + 0.0144} = \sqrt{0.0225} = 0.15\,\mathrm{mm}$. As a zone diameter that is $2 \times 0.15 = 0.30\,\mathrm{mm}$.

**Compare.** $0.30 \le 0.37$, so the hole passes, with $0.07\,\mathrm{mm}$ to spare.

**What if the frame had no Ⓜ?** Then it is RFS, the zone stays $\varnothing\,0.25$, and $0.30 > 0.25$ fails. The same bracket, the same screw, the same fit — rejected only because the drawing did not say the extra clearance counts.

**Sanity check.** The hole is $0.12$ bigger than its smallest size, so there is $0.06$ of extra room on each side of the screw. The axis may therefore wander $0.06$ farther in any direction, which adds $0.12$ to the zone's diameter. That matches.
:::

::: note Why the bonus is exactly the departure from MMC
Picture a perfect screw of diameter $F$ standing exactly at true position. A hole of diameter $H$ drops over it as long as the hole's axis is no more than $\frac{H - F}{2}$ away from the screw's axis. (Read $F$ as "fastener" and $H$ as "hole".) So the allowed zone *diameter* is $H - F$.

At MMC the hole is $H_{\mathrm{MMC}}$, and the zone is $H_{\mathrm{MMC}} - F$. That is the number the designer prints in the frame. Now make the hole bigger, $H = H_{\mathrm{MMC}} + d$, where $d$ is the departure from MMC. The zone becomes $H_{\mathrm{MMC}} + d - F$, which is the printed number plus $d$. The bonus is $d$, exactly, because every bit of extra hole diameter is extra diameter of room around the screw.

With a $\varnothing\,6.0$ screw: a $6.4$ hole allows a zone of $0.4$; a $6.6$ hole allows $0.6$. The hole grew $0.2$, and so did the zone. This same subtraction is the heart of the [[fastener formula|clearance-bolt]] designers use to choose the number in the frame.
:::

::: example A pin on a gimbal bracket
Bonus works for shafts too, turned around. A locating pin on a gimbal bracket is $\varnothing\,11.85$ to $12.00\,\mathrm{mm}$, with position $\varnothing\,0.05$ at MMC. It is made at $11.92\,\mathrm{mm}$. How much positional tolerance does it get?

**MMC.** For a pin, MMC is the *largest* size: $12.00$.

**Bonus.** The pin is $12.00 - 11.92 = 0.08\,\mathrm{mm}$ smaller than MMC.

**Allowed zone.** $0.05 + 0.08 = 0.13\,\mathrm{mm}$ diameter.

**Sanity check.** A thinner pin has more room inside the hole it enters, so it can be farther off and still fit. More than double the stated $0.05$, and never more than $0.05 + 0.15 = 0.20$, which is what a pin at its smallest size, $11.85$, would get.
:::

::: warning The bonus comes from the part, not the drawing
Do not add the whole size tolerance ($0.3$ in the flashcard hole) to every hole. The bonus is what *this* hole earned by *its* actual size. A hole made at $10.05$ earns only $0.05$. You cannot know the bonus until you have measured the size.
:::

## Why MMC fits assembly

Ⓜ is the natural choice when the feature's job is **assembly clearance**: a bolt through a hole, a pin into a slot, a shaft into a housing. In every one of those jobs, a larger hole (or smaller pin) really does leave more room, so the extra tolerance costs nothing in function. The parts still go together. Meanwhile the shop keeps parts that an RFS callout would have scrapped.

There is a second benefit, which the next lesson builds on. With Ⓜ, the worst-case boundary the mating part must clear stays the same no matter what size the hole is made. That fixed boundary can be checked with a simple hard gauge: a plate with pins on it that either goes on or does not. That is [[the idea behind virtual condition|lesson8-bridge]].

## LMC: when too little metal is the danger

Now flip the worry. Sometimes the danger is not "will it fit?" but "is there enough metal left?". A hole near the edge of a plate leaves a thin **wall** between the hole and the edge. If the hole is big *and* shifted toward the edge, the wall gets thin enough to crack. A bore in a thin boss, a hole in a pressure fitting, a machined pocket next to an outside surface — all have this worry.

For these, the worst case is the *largest* hole (least metal), so the drawing writes the tolerance at **LMC** with Ⓛ. The stated number applies at LMC. As the hole shrinks away from LMC, more metal is left, and the bonus lets the hole wander more — but only as much as the extra metal can pay for.

::: example Holding a minimum wall with LMC
A hole is $\varnothing\,8.0$ to $8.2\,\mathrm{mm}$, with its true position $6.0\,\mathrm{mm}$ from the edge of a plate. Position is $\varnothing\,0.1$ at LMC. What is the thinnest [[wall between the hole and the edge|wall-picture]]?

The wall is the distance to the edge, minus the hole's radius, minus how far the axis may shift toward the edge (half the zone diameter):

$$
\text{wall} = 6.0 - \frac{\text{hole}}{2} - \frac{\text{zone}}{2}
$$

**At LMC, $8.2$.** Bonus is $0$, zone $0.1$. Wall $= 6.0 - 4.1 - 0.05 = 1.85\,\mathrm{mm}$.

**At $8.1$.** Bonus $8.2 - 8.1 = 0.1$, zone $0.2$. Wall $= 6.0 - 4.05 - 0.10 = 1.85\,\mathrm{mm}$.

**At MMC, $8.0$.** Bonus $0.2$, zone $0.3$. Wall $= 6.0 - 4.0 - 0.15 = 1.85\,\mathrm{mm}$.

**What happened.** The worst-case wall is $1.85\,\mathrm{mm}$ at every size. Each $0.1$ the hole shrinks adds $0.05$ of metal on its radius, and the bonus spends exactly that $0.05$ on extra shift. The minimum wall is protected; nothing more.

**Sanity check with the wrong modifier.** Suppose the designer had written Ⓜ instead. A hole at $8.2$ would then get zone $0.1 + 0.2 = 0.3$, and the wall would be $6.0 - 4.1 - 0.15 = 1.75\,\mathrm{mm}$. Ⓜ hands out bonus exactly when the metal is thinnest. That is why wall thickness wants Ⓛ.
:::

## RFS: when centering is the function

Some features must be centered no matter what size they are made. A bearing bore that locates a reaction-wheel shaft is one. The bearing is pressed in, so there is no clearance to trade. A bigger bore does not make the rotor sit any closer to its true axis. There, bonus would be a lie, so the drawing leaves the modifier off and the tolerance is RFS.

RFS is also the honest choice when a feature is measured with a CMM anyway and the design has no clearance to give. It costs more to make, because the shop never earns extra tolerance. That is the trade.

::: warning A modifier needs a size
Ⓜ and Ⓛ only make sense on a feature of size. A flatness control on a flat face, or a profile control on a curved skin, has no MMC to depart from, so a modifier there is meaningless. If you see Ⓜ next to a flat face's tolerance, the drawing is wrong.
:::

Choosing the modifier is choosing what the feature is for:

| Function of the feature | Worst case | Modifier |
| --- | --- | --- |
| Clearance for a bolt or pin | smallest hole, largest pin | Ⓜ, MMC |
| Minimum wall or edge distance | largest hole, smallest pin | Ⓛ, LMC |
| Centering, press fits, balance | any size | none, RFS |

## Check yourself

::: check
A shaft is $\varnothing\,25.00$ to $24.90\,\mathrm{mm}$. Which size is its MMC, and which is its LMC? A hole is $\varnothing\,25.05$ to $25.15$. Same question.
:::

::: answer
For the shaft, the most metal is at the largest size, so MMC is $25.00$ and LMC is $24.90$. For the hole, the most metal is left when the hole is smallest, so MMC is $25.05$ and LMC is $25.15$. Notice that the two MMC sizes are the tightest fit the drawing allows: a $25.00$ shaft in a $25.05$ hole leaves $0.05$ of clearance.
:::

::: check
A hole is $\varnothing\,5.5$ to $5.7\,\mathrm{mm}$ with position $\varnothing\,0.15$ at MMC. It is made at $5.64$. What positional tolerance does it get? What would it get at $5.7$?
:::

::: answer
MMC is the smallest size, $5.5$. The departure is $5.64 - 5.5 = 0.14$, so the bonus is $0.14$ and the allowed zone is $0.15 + 0.14 = 0.29\,\mathrm{mm}$ diameter. At $5.7$ (LMC) the bonus is the full size tolerance, $0.2$, and the zone is $0.15 + 0.2 = 0.35\,\mathrm{mm}$.
:::

::: check
Same hole, but the frame has no modifier. The hole is made at $5.64$ and its axis is $0.08\,\mathrm{mm}$ off in $x$ and $0.06\,\mathrm{mm}$ off in $y$. Pass or fail? What if the Ⓜ were there?
:::

::: answer
Straight-line miss: $\sqrt{0.08^2 + 0.06^2} = \sqrt{0.01} = 0.10\,\mathrm{mm}$, so the zone it needs is $\varnothing\,0.20$. With no modifier the tolerance is RFS, fixed at $0.15$, and $0.20 > 0.15$ fails. With Ⓜ the zone is $0.29$ (from the last question), and $0.20 \le 0.29$ passes. Same hole, same bolt — only the modifier changed.
:::

::: check
Why would a designer choose LMC instead of MMC for a hole drilled close to the edge of a thin flange?
:::

::: answer
The risk at that hole is a thin wall, and the wall is thinnest when the hole is largest — at LMC. Writing the tolerance at LMC means the stated number applies at that worst size, and bonus is earned only as the hole shrinks and leaves more metal. With MMC the bonus would be handed out exactly when the hole is largest, making the thin wall even thinner.
:::

::: check
A reaction wheel's bearing bore is toleranced with position and no modifier. A technician asks why the drawing "wastes" the bonus. What do you tell them?
:::

::: answer
The bearing is a press fit, so there is no clearance to trade. A bigger bore does not let the bearing sit any closer to its true axis, so bonus tolerance would let the rotor run off-center without anything paying for it. The tolerance is RFS on purpose: the function is centering, not clearance.
:::

## Summary

| Idea | Meaning | Fact to carry |
| --- | --- | --- |
| MMC, Ⓜ | size with the most material | smallest hole, largest shaft |
| LMC, Ⓛ | size with the least material | largest hole, smallest shaft |
| RFS | no modifier | tolerance fixed, no bonus |
| Bonus at MMC | extra tolerance from actual size | departure of actual size from MMC |
| Allowed tolerance | what the part may use | stated tolerance plus bonus |
| Flashcard hole | MMC $10.0$, LMC $10.3$, $\varnothing\,0.2$ at MMC | $0.2$ at $10.0$, $0.5$ at $10.3$ |
| Choosing a modifier | follow the function | clearance → MMC, wall → LMC, centering → RFS |

Next lesson turns MMC into a boundary: the virtual condition a mating part or a hard gauge must clear, then composite position for hole patterns and projected zones for threaded holes.


::: context feature-of-size Things you can measure across
A **feature of size** is a feature with two opposite surfaces, or one round surface, that you can put calipers or a pin across: a hole, a pin, a slot, a tab, the thickness of a plate. It has a size, so it has an MMC and an LMC. A single flat face does not: there is nothing on the other side to measure to. That is why material condition modifiers, bonus tolerance and Rule #1 from lesson 4 all apply only to features of size.
:::

::: context rfs-default Why you never see a circled S
Older drawings, made to editions of the standard before 1994, sometimes showed a circled S for RFS. Today the standard says that when a tolerance has no modifier, RFS applies automatically, so the symbol is no longer used. Engineers sometimes call this "Rule #2". Datum letters in a frame follow a similar default: with no modifier, the datum feature is held regardless of its size, a condition the standard calls **regardless of material boundary** (RMB). A datum letter can also carry Ⓜ or Ⓛ, which lets the datum feature itself shift a little in its gauge.
:::

::: context bonus-picture The zone grows with the hole
The same hole from the flashcards, drawn at its smallest and largest sizes (grey). The blue circle at the center is the zone the hole's axis must stay inside, drawn much larger than the holes so you can see it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <circle cx="95" cy="90" r="60" fill="#ffffff" stroke="#6c7a93" stroke-width="2"/>
  <circle cx="95" cy="90" r="10" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="95" cy="90" r="2" fill="#1f2a44"/>
  <text x="95" y="172" font-size="12" text-anchor="middle" fill="#1f2a44">hole ⌀10.0 (MMC)</text>
  <text x="95" y="186" font-size="12" text-anchor="middle" fill="#1d6fd1">zone ⌀0.2</text>
  <circle cx="265" cy="90" r="61.8" fill="#ffffff" stroke="#6c7a93" stroke-width="2"/>
  <circle cx="265" cy="90" r="25" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="265" cy="90" r="2" fill="#1f2a44"/>
  <text x="265" y="172" font-size="12" text-anchor="middle" fill="#1f2a44">hole ⌀10.3 (LMC)</text>
  <text x="265" y="186" font-size="12" text-anchor="middle" fill="#1d6fd1">zone ⌀0.5</text>
  <text x="180" y="20" font-size="11" text-anchor="middle" fill="#6c7a93">hole outlines to scale with each other; zones enlarged</text>
</svg>
```

The hole grew by $0.3$; the zone grew by the same $0.3$, from $0.2$ to $0.5$.
:::

::: context actual-mating-size The biggest pin that fits
A real hole may be a little oval, a little bent, a little tapered. Measured with calipers in different directions, it gives different numbers. For bonus tolerance, what counts is how the hole behaves when something goes into it. So the size used is the **actual mating size**: imagine the largest perfectly round, perfectly straight pin that slides all the way through. Its diameter is the hole's actual mating size. For a shaft, it is the smallest perfect ring that slides over it. A CMM computes this in software; a set of gauge pins finds it by hand.
:::

::: context clearance-bolt The number designers put in the frame
When bolts pass through clearance holes in two plates and a nut holds them, each plate's holes can use the whole gap. Designers call this the **floating fastener** case, and the frame's tolerance is

$$
T = H - F
$$

where $H$ is the hole's MMC diameter and $F$ is the bolt's largest diameter. For a $\varnothing\,6.0$ bolt in holes whose MMC is $6.4$, $T = 0.4$. When one part is threaded instead, so the bolt is fixed in it, the gap must be shared between the two parts, and each gets less. Later, in stack-ups, you will meet these again as the line items in a fit calculation.
:::

::: context lesson8-bridge The gauge that never needs a ruler
Here is a preview of the payoff. The flashcard hole at $10.0$ may shift within $\varnothing\,0.2$; at $10.3$ within $\varnothing\,0.5$. In both cases, the space inside the hole that is guaranteed clear is a perfect cylinder of diameter $10.0 - 0.2 = 9.8$ and $10.3 - 0.5 = 9.8$. The same number. So a pin of $\varnothing\,9.8$ at true position fits every good hole, whatever its size. That constant boundary is the virtual condition, and a plate carrying such pins is a functional gauge. Lesson 8 builds it.
:::

::: context wall-picture A wall that stays the same
Two copies of the hole from the example. The big one, at LMC, may shift only $0.05\,\mathrm{mm}$ toward the edge; the smaller one, at MMC, may shift $0.15$. Either way the thinnest wall to the edge is the same $1.85\,\mathrm{mm}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="40" width="10" height="130" fill="#6c7a93"/>
  <rect x="190" y="40" width="10" height="130" fill="#6c7a93"/>
  <text x="25" y="34" font-size="11" text-anchor="middle" fill="#6c7a93">edge</text>
  <text x="195" y="34" font-size="11" text-anchor="middle" fill="#6c7a93">edge</text>
  <line x1="90" y1="40" x2="90" y2="170" stroke="#1f2a44" stroke-width="1" stroke-dasharray="5 3"/>
  <line x1="260" y1="40" x2="260" y2="170" stroke="#1f2a44" stroke-width="1" stroke-dasharray="5 3"/>
  <text x="180" y="16" font-size="11" text-anchor="middle" fill="#1f2a44">dashed: true position, 6.0 from the edge</text>
  <circle cx="89.5" cy="105" r="41" fill="#f2b880" fill-opacity="0.35" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="258.5" cy="105" r="40" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="30" y1="105" x2="48.5" y2="105" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="200" y1="105" x2="218.5" y2="105" stroke="#b4232c" stroke-width="2.5"/>
  <text x="39" y="98" font-size="11" text-anchor="middle" fill="#b4232c">1.85</text>
  <text x="209" y="98" font-size="11" text-anchor="middle" fill="#b4232c">1.85</text>
  <text x="90" y="186" font-size="11" text-anchor="middle" fill="#1f2a44">⌀8.2 at LMC, zone 0.1</text>
  <text x="260" y="186" font-size="11" text-anchor="middle" fill="#1d6fd1">⌀8.0 at MMC, zone 0.3</text>
</svg>
```

Drawn to scale; each hole is shifted toward the edge by half its zone. The red lines are the worst-case walls: equal, because Ⓛ spends only the metal the smaller hole leaves behind.
:::
