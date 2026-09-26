---
id: l09-perimeter-area-and-volume
title: Perimeter, area and volume
minutes: 21
covers:
  - perimeter, area and volume
---

Three questions come up about any object you can hold. How far is it *around* the edge? How much *surface* does it have? How much does it *hold*? The first is its **perimeter**, the second its **area**, the third its **volume**. You already use all three: a fence goes around a yard, paint covers a wall, and a water bottle holds half a litre.

A rocket is built almost entirely out of a few simple shapes. Its body and tanks are **cylinders** — the shape of a soup can. Its nose is close to a **cone**. Many of the small tanks that hold high-pressure gas are **spheres**. The hole at the narrowest point of an engine's nozzle is a **circle**. So when an engineer asks "how much **propellant** — the fuel and the oxygen it burns with — fits?", "how much air pushes on the front?" or "how much metal does the skin need?", the answer is one of the formulas in this lesson.

We start flat, with lengths and areas, then go up into three dimensions. At the end you will see the one idea that ties them together: what happens when you make something bigger.

## Perimeter: the distance around

Walk all the way around the edge of a soccer field and count your steps. That distance is the **perimeter** — the total length of the boundary. You find it by adding up the lengths of all the sides.

A **rectangle** has two long sides of length $l$ and two short sides of width $w$. Going around, you walk each one once:

$$
P = l + w + l + w = 2l + 2w = 2(l + w).
$$

A solar panel $2\,\mathrm{m}$ long and $1.5\,\mathrm{m}$ wide has perimeter $2 \times (2 + 1.5) = 2 \times 3.5 = 7\,\mathrm{m}$. That is the length of the metal frame around its edge.

Perimeter is a length, so it is measured in ordinary length units: metres, centimetres, kilometres.

### Around a circle: the circumference

The perimeter of a circle has its own name, the **circumference**. To talk about it we need two more words. The **radius** $r$ is the distance from the center to the edge. The **diameter** $d$ is the distance straight across, through the center — two radii end to end, so $d = 2r$.

Wrap a string around a can, then lay the string next to the can's diameter. The string is a bit more than three diameters long. It does not matter whether the can is tiny or huge: *every* circle's circumference is the same number of diameters. That number is called **[[π|where-pi-comes-from]]** (the Greek letter "pi", said like "pie"), and it is about $3.14159$. It never ends and never repeats, so we write the letter instead.

$$
C = \pi d = 2\pi r.
$$

The Falcon 9 rocket is about $3.7\,\mathrm{m}$ across. The distance around its body is $C = \pi \times 3.7 \approx 11.6\,\mathrm{m}$ — you would need about seven adults holding hands to hug it.

::: warning Radius or diameter?
Drawings and data sheets usually give the **diameter**, because that is what a tape measure across the rocket reads. Most formulas want the **radius**. Before you use any circle formula, write down $r$ on its own line. For Falcon 9, $d = 3.7\,\mathrm{m}$, so $r = 3.7 \div 2 = 1.85\,\mathrm{m}$.
:::

## Area: how much surface

Area is how much flat surface a shape covers. The trick is to measure it by counting **[[unit squares|why-squares]]**. A **square metre**, written $\mathrm{m^2}$ and read "square metre" or "metre squared", is the area of a square $1\,\mathrm{m}$ on each side. A floor with an area of $12\,\mathrm{m^2}$ could be covered by twelve such tiles.

### Rectangles

Lay tiles in a rectangle $4$ tiles long and $3$ tiles wide. You get $3$ rows of $4$, which is $12$ tiles. That is why the area of a rectangle is length times width:

$$
A = l \times w.
$$

The units multiply too: metres times metres gives square metres. The solar panel from before has area $2 \times 1.5 = 3\,\mathrm{m^2}$.

::: warning Perimeter and area are different things
Perimeter adds lengths and comes out in metres. Area multiplies lengths and comes out in square metres. A $1\,\mathrm{m}$ by $9\,\mathrm{m}$ strip and a $3\,\mathrm{m}$ by $3\,\mathrm{m}$ square both have area $9\,\mathrm{m^2}$. But their perimeters are $20\,\mathrm{m}$ and $12\,\mathrm{m}$. If your answer for an area is in plain metres, a length got added somewhere it should have been multiplied.
:::

### Triangles

Draw a rectangle, then draw a line from one corner to the opposite corner. You have cut it into two identical triangles. So each triangle is exactly half the rectangle.

The same is true for a lopsided triangle. Draw a line straight down from its top corner to the bottom side: it splits the triangle into two right triangles, and each is half of its own small rectangle. Put the two small rectangles side by side and they make one big rectangle, as wide as the triangle's bottom side and as tall as the triangle. So the triangle is half of that.

To say it exactly, pick one side as the **base** $b$. The **height** $h$ is the straight-up distance from that base to the opposite corner, measured at a right angle to the base — not along a slanted side. Then

$$
A = \tfrac{1}{2}\, b\, h.
$$

A model rocket fin shaped like a right triangle, $8\,\mathrm{cm}$ along the body and $6\,\mathrm{cm}$ tall, has area $\tfrac{1}{2} \times 8 \times 6 = 24\,\mathrm{cm^2}$.

### Circles

A circle has no straight sides, so we cannot count tiles directly. But there is a beautiful trick. Cut a pizza into many thin slices and lay them side by side, pointing alternately up and down. They form a shape that is almost a rectangle. Its height is the radius $r$, and its length is half the crust, which is half the circumference, $\pi r$. So its area is $\pi r \times r$:

$$
A = \pi r^2.
$$

Here $r^2$ ("r squared") means $r \times r$. The note below walks through it slowly.

::: note Why a circle's area is πr²
Cut a circle into $8$ equal slices, like a pizza. Put the four slices from the bottom half in a row, pointing up. Slot the four from the top half between them, pointing down. The crust of each half forms one long, bumpy edge, and each edge is half the circumference: $\tfrac{1}{2} \times 2\pi r = \pi r$. The sides of the shape are slice edges, of length $r$.

With $8$ slices the shape is lumpy. With $100$ slices it is very nearly a rectangle, and with more slices still it gets as close to one as you like. A rectangle $\pi r$ long and $r$ tall has area $\pi r \times r = \pi r^2$, so that is the circle's area. [[See the slices drawn out|circle-slices]].
:::

::: key Circles
Circumference and area of a circle of radius $r$: $C = 2\pi r$ and $A = \pi r^2$, with $\pi \approx 3.14159$. The diameter is $d = 2r$.
:::

::: warning Square the radius, not the whole thing
$\pi r^2$ means "square $r$, then multiply by $\pi$". It does not mean $(\pi r)^2$. The little $2$ belongs to the $r$ alone, and powers always come before multiplying in the order of operations. For $r = 1.85\,\mathrm{m}$: $1.85^2 = 3.4225$, and $\pi \times 3.4225 \approx 10.75\,\mathrm{m^2}$.
:::

That $10.75\,\mathrm{m^2}$ is the area of the circular end of a Falcon 9. Aerodynamics engineers call it the rocket's **[[reference area|reference-area]]**, and every calculation of how hard the air pushes on the rocket multiplies by it.

## Surface area: wrapping a solid

Now step up to solid objects. The **surface area** of a solid is the total area of all its outside faces — how much wrapping paper you would need to cover it exactly.

### Boxes

A box (engineers say **rectangular prism** or **cuboid**) has six rectangular faces that come in three matching pairs: top and bottom, front and back, left and right. For a box of length $l$, width $w$ and height $h$:

$$
S = 2lw + 2lh + 2wh.
$$

Small satellites called **[[CubeSats|cubesat]]** are built in units of a $10\,\mathrm{cm}$ cube. A "three-unit" CubeSat is about $10\,\mathrm{cm} \times 10\,\mathrm{cm} \times 30\,\mathrm{cm}$. Its two square ends have $2 \times (10 \times 10) = 200\,\mathrm{cm^2}$ between them. Its four long sides have $4 \times (10 \times 30) = 1200\,\mathrm{cm^2}$. In all, $S = 1400\,\mathrm{cm^2}$. That number matters: the solar cells that power it are glued onto those faces, so surface area is power.

### Cylinders

Peel the label off a soup can and flatten it. It is a rectangle. One side of the rectangle went around the can, so it is as long as the circumference, $2\pi r$. The other side is the can's height $h$. So the curved side has area $2\pi r \times h$. Add the two circular ends, $\pi r^2$ each, and you have the whole [[surface of the can|cylinder-net]]:

$$
S = 2\pi r h + 2\pi r^2.
$$

### Spheres

A ball's surface can't be flattened without stretching, so its formula needs more advanced tools to prove. The result is famous and short: a sphere of radius $r$ has surface area

$$
S = 4\pi r^2,
$$

exactly four times the area of a circle with the same radius. Later in the course you will use it to find the area of the whole Earth.

## Volume: how much it holds

**Volume** is how much space a solid takes up — how much water it would hold if it were hollow. We count it in **cubic** units. A **cubic metre**, $\mathrm{m^3}$, is the space inside a box $1\,\mathrm{m}$ on every side. A cubic centimetre, $\mathrm{cm^3}$, is a sugar cube.

### Boxes

Fill a box with sugar cubes. A layer on the bottom that is $l$ cubes long and $w$ cubes wide holds $l \times w$ cubes. Stack $h$ layers and you have

$$
V = l \times w \times h.
$$

Length times width times height: three lengths multiplied, so the units are metres cubed. The CubeSat above has volume $10 \times 10 \times 30 = 3000\,\mathrm{cm^3}$.

### Cylinders: the end times the height

A box's volume is really "the area of the bottom layer, times how many layers". That idea works for any shape with straight sides and the same cross-section all the way up. A cylinder is a [[stack of coins|stack-of-coins]]: each coin is a thin circle of area $\pi r^2$, and the stack is $h$ tall. So

$$
V = \pi r^2 h.
$$

::: key Cylinder
Volume of a cylinder of radius $r$ and height $h$: $V = \pi r^2 h$ — the area of the circular end times the height. Rocket tanks are cylinders.
:::

::: example The Falcon 9 first stage as a cylinder
Treat the Falcon 9 first stage as a plain cylinder, $3.7\,\mathrm{m}$ across and about $41\,\mathrm{m}$ tall. How much could it hold, and how much skin does it have?

**Radius first.** $r = 3.7 \div 2 = 1.85\,\mathrm{m}$.

**End area.** $A = \pi r^2 = \pi \times 1.85^2 = \pi \times 3.4225 \approx 10.75\,\mathrm{m^2}$.

**Volume.** Multiply by the height: $V = 10.75 \times 41 \approx 441\,\mathrm{m^3}$. That is the space inside the whole stage, if every metre of it were tank.

**Does it make sense?** The stage carries about $411\,\mathrm{t}$ of propellant, and every cubic metre of that propellant has a mass of about $1015\,\mathrm{kg}$ (a tonne, $\mathrm{t}$, is $1000\,\mathrm{kg}$). So it fills about $411\,000 \div 1015 \approx 405\,\mathrm{m^3}$. That is less than the $441\,\mathrm{m^3}$ upper limit, as it has to be — the engines and the gaps between the tanks take up the rest.

**Skin.** The curved side is circumference times height: $2\pi r h = 2 \times \pi \times 1.85 \times 41 \approx 477\,\mathrm{m^2}$. The two ends add $2 \times 10.75 = 21.5\,\mathrm{m^2}$, for about $498\,\mathrm{m^2}$ in all. Nearly all of the skin is the long side, because the stage is eleven times taller than it is wide.
:::

### Spheres and cones

Two more shapes finish the set.

A **cone** has a circular base and comes to a point. If a cone and a cylinder have the same base and the same height, the cone holds exactly one third as much. Fill the cone with water three times and pour it into the cylinder: the cylinder is exactly full. So

$$
V_{\text{cone}} = \tfrac{1}{3}\pi r^2 h.
$$

A **sphere** of radius $r$ holds

$$
V_{\text{sphere}} = \tfrac{4}{3}\pi r^3.
$$

Here $r^3$ ("r cubed") means $r \times r \times r$. A sphere tank $1\,\mathrm{m}$ across has $r = 0.5\,\mathrm{m}$, so it holds $\tfrac{4}{3} \times \pi \times 0.5^3 = \tfrac{4}{3} \times \pi \times 0.125 \approx 0.524\,\mathrm{m^3}$.

::: note Why the sphere formula has 4/3 in it
More than two thousand years ago, [[Archimedes|archimedes]] found a lovely way to see it. Put a ball inside a can that fits it exactly: the can's radius is $r$ and its height is $2r$. The can holds $\pi r^2 \times 2r = 2\pi r^3$. Archimedes showed that the ball takes up exactly two thirds of the can. Two thirds of $2\pi r^3$ is $\tfrac{2}{3} \times 2\pi r^3 = \tfrac{4}{3}\pi r^3$.

The cone's $\tfrac{1}{3}$ and the sphere's $\tfrac{2}{3}$ can both be checked by pouring water, and both are proved exactly in the calculus module, by slicing the shape into many thin coins and adding them up — the same stack-of-coins idea as the cylinder.
:::

::: warning Squared means area, cubed means volume
Every area formula has two lengths multiplied ($lw$, $\pi r^2$, $2\pi rh$). Every volume formula has three ($lwh$, $\pi r^2 h$, $\tfrac{4}{3}\pi r^3$). Use this as a check. If a "volume" formula you have written has only $r$ times $h$, a length is missing — often the second $r$ in $r^2$. For a tank, $\pi r h$ instead of $\pi r^2 h$ gives an answer that is wrong by a factor of $r$, and has the wrong units too.
:::

::: example How tall is the oxygen tank?
A stage needs to carry $244\,\mathrm{m^3}$ of liquid oxygen in a cylindrical tank $3.7\,\mathrm{m}$ across. How tall must the tank be?

**Write the formula and fill in what you know.** $V = \pi r^2 h$ with $V = 244$ and $r = 1.85$. The end area is $\pi \times 1.85^2 \approx 10.75\,\mathrm{m^2}$, so

$$
244 = 10.75 \times h.
$$

**Solve for $h$.** Divide both sides by $10.75$: $h = 244 \div 10.75 \approx 22.7\,\mathrm{m}$.

**Check.** Put it back: $10.75 \times 22.7 \approx 244$. And the size is sensible: a tank over $22\,\mathrm{m}$ tall fits inside a $41\,\mathrm{m}$ stage, with room left for the fuel tank. The fuel, kerosene, needs about $150\,\mathrm{m^3}$, which by the same steps is another $150 \div 10.75 \approx 14\,\mathrm{m}$ of tank.
:::

## Making things bigger: the scaling rule

Here is the idea that ties all of this together. Build a cube out of sugar cubes, $2$ along each edge. Each face shows $2 \times 2 = 4$ small squares, and the whole cube uses $2 \times 2 \times 2 = 8$ sugar cubes. Every length doubled. The area went up $4$ times. The volume went up $8$ times.

That is true for *any* shape, not only cubes. If you make every length $k$ times bigger:

- lengths (perimeter, circumference, height) grow $k$ times;
- areas (surface area, end area) grow $k \times k = k^2$ times;
- volumes grow $k \times k \times k = k^3$ times.

The reason is in the formulas themselves. An area is two lengths multiplied, and each one grew by $k$. A volume is three lengths multiplied, so it picks up three factors of $k$.

::: key Scaling a shape
Double every length of a shape and its area becomes $4\times$ as big and its volume $8\times$ as big. Scale by $k$: lengths $\times k$, areas $\times k^2$, volumes $\times k^3$.
:::

::: example Doubling a tank
A small tank is a cylinder with radius $1\,\mathrm{m}$ and height $4\,\mathrm{m}$. A designer builds one with radius $2\,\mathrm{m}$ and height $8\,\mathrm{m}$ — every length doubled. Compare how much each holds and how much metal skin each needs.

**Small tank.** Volume: $\pi \times 1^2 \times 4 \approx 12.6\,\mathrm{m^3}$. Skin: $2\pi \times 1 \times 4 + 2\pi \times 1^2 = 8\pi + 2\pi = 10\pi \approx 31.4\,\mathrm{m^2}$.

**Big tank.** Volume: $\pi \times 2^2 \times 8 = \pi \times 4 \times 8 = 32\pi \approx 100.5\,\mathrm{m^3}$. Skin: $2\pi \times 2 \times 8 + 2\pi \times 2^2 = 32\pi + 8\pi = 40\pi \approx 125.7\,\mathrm{m^2}$.

**Compare.** Volume: $100.5 \div 12.6 \approx 8$. Skin: $125.7 \div 31.4 = 4$. Exactly the scaling rule.

**What it means.** The big tank holds $8$ times the propellant but needs only $4$ times the metal. Each square metre of skin now looks after twice as much propellant. This is part of [[why big rockets are efficient|square-cube]].
:::

::: note Where this comes back
- [Signed numbers, fractions and ratios](#/module/t0_m01_algebra_precalc?lesson=l01-signed-numbers-and-fractions) turns a propellant mass into tank volumes — the volumes you now know how to fit into a cylinder.
- [Exponents, radicals and scaling laws](#/module/t0_m01_algebra_precalc?lesson=l02-exponents-and-radicals) takes the $k^2$ and $k^3$ rule and uses it to explain why bigger rockets carry propellant more efficiently.
- [Order-of-magnitude estimation](#/module/t0_m01_algebra_precalc?lesson=l12-fermi-estimation) estimates a whole stage's propellant from its cylinder volume, and weighs Earth's atmosphere using the sphere area $4\pi R^2$.
- [Dynamic pressure and max-Q](#/module/t1_m18_atmospheric_flight?lesson=l02-dynamic-pressure-and-max-q) multiplies every air force by the rocket's circular end area, written there as $\pi d^2/4$ — the same as $\pi r^2$, using the diameter.
:::

## Check yourself

::: check
A rectangular launch pad is $30\,\mathrm{m}$ long and $20\,\mathrm{m}$ wide. How much fence goes around it, and how much concrete surface does it have? Give units.
:::

::: answer
Fence is perimeter: $P = 2 \times (30 + 20) = 2 \times 50 = 100\,\mathrm{m}$.

Surface is area: $A = 30 \times 20 = 600\,\mathrm{m^2}$.

The fence is a length (metres), the concrete is an area (square metres).
:::

::: check
An engine nozzle's narrowest point, its throat, is a circle $40\,\mathrm{cm}$ across. Find the distance around it and the area of the opening.
:::

::: answer
Diameter $40\,\mathrm{cm}$, so the radius is $r = 20\,\mathrm{cm}$.

Circumference: $C = 2\pi r = 2 \times \pi \times 20 \approx 125.7\,\mathrm{cm}$.

Area: $A = \pi r^2 = \pi \times 20^2 = \pi \times 400 \approx 1257\,\mathrm{cm^2}$.

Sanity check: a $40\,\mathrm{cm}$ square would have area $1600\,\mathrm{cm^2}$, and a circle that fits inside it must be smaller. It is.
:::

::: check
A satellite keeps helium in a spherical tank $60\,\mathrm{cm}$ across. Find its volume in cubic metres.
:::

::: answer
Work in metres: $60\,\mathrm{cm} = 0.6\,\mathrm{m}$ across, so $r = 0.3\,\mathrm{m}$.

$r^3 = 0.3 \times 0.3 \times 0.3 = 0.027$.

$V = \tfrac{4}{3} \times \pi \times 0.027 \approx 0.113\,\mathrm{m^3}$.

Check: a cube $0.6\,\mathrm{m}$ on a side holds $0.216\,\mathrm{m^3}$. A ball that fits inside that cube should hold about half, and $0.113$ is about half.
:::

::: check
A nose cone has the same base as the Falcon 9 body (end area $10.75\,\mathrm{m^2}$) and is $4\,\mathrm{m}$ tall. How much space is inside it? How much would a $4\,\mathrm{m}$ cylinder with the same base hold?
:::

::: answer
Cylinder: $V = \pi r^2 h = 10.75 \times 4 = 43\,\mathrm{m^3}$.

Cone: one third of that, $43 \div 3 \approx 14.3\,\mathrm{m^3}$.

The cone's pointed shape wastes a lot of room, which is why rockets keep the pointy part short and put their tanks in the cylinder.
:::

::: check
A model rocket kit comes in two sizes. The large one is exactly $3$ times the small one in every direction. How many times more paint does the large one need, and how many times more room is inside it?
:::

::: answer
Paint covers surface, which is an area, so it grows by $3^2 = 3 \times 3 = 9$ times.

Room inside is a volume, so it grows by $3^3 = 3 \times 3 \times 3 = 27$ times.

The volume always grows faster than the area when you scale up.
:::

## Summary

| Shape or idea | Formula | Units |
| --- | --- | --- |
| Rectangle | $P = 2(l + w)$, $A = lw$ | m, $\mathrm{m^2}$ |
| Triangle | $A = \tfrac{1}{2} b h$ ($h$ at a right angle to $b$) | $\mathrm{m^2}$ |
| Circle | $d = 2r$, $C = 2\pi r$, $A = \pi r^2$, $\pi \approx 3.14159$ | m, $\mathrm{m^2}$ |
| Box | $S = 2lw + 2lh + 2wh$, $V = lwh$ | $\mathrm{m^2}$, $\mathrm{m^3}$ |
| Cylinder | $S = 2\pi r h + 2\pi r^2$, $V = \pi r^2 h$ | $\mathrm{m^2}$, $\mathrm{m^3}$ |
| Sphere | $S = 4\pi r^2$, $V = \tfrac{4}{3}\pi r^3$ | $\mathrm{m^2}$, $\mathrm{m^3}$ |
| Cone | $V = \tfrac{1}{3}\pi r^2 h$ | $\mathrm{m^3}$ |
| Scaling by $k$ | lengths $\times k$, areas $\times k^2$, volumes $\times k^3$ | — |

Next, the squares that keep appearing here — $r^2$, $k^2$ — get a lesson of their own. Undoing a square gives a square root, and with it one of the most useful facts in all of geometry: the Pythagorean theorem.

::: context where-pi-comes-from The number that is the same for every circle
Measure any circle — a coin, a bike wheel, the Moon — and divide the distance around by the distance across. You always get $3.14159\ldots$ The ancient Greeks already knew this ratio was fixed. The letter $\pi$ was first used for it in 1706, and it caught on after the great mathematician Leonhard Euler used it too.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <circle cx="50" cy="50" r="30" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="20" y1="50" x2="80" y2="50" stroke="#b4232c" stroke-width="2"/>
  <text x="50" y="96" font-size="12" text-anchor="middle" fill="#b4232c">diameter d</text>
  <line x1="100" y1="50" x2="288.5" y2="50" stroke="#1d6fd1" stroke-width="4"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="100" y1="42" x2="100" y2="58"/><line x1="160" y1="42" x2="160" y2="58"/>
    <line x1="220" y1="42" x2="220" y2="58"/><line x1="280" y1="42" x2="280" y2="58"/>
    <line x1="288.5" y1="42" x2="288.5" y2="58"/>
  </g>
  <g font-size="12" text-anchor="middle" fill="#1f2a44">
    <text x="130" y="74">1 d</text><text x="190" y="74">1 d</text><text x="250" y="74">1 d</text>
  </g>
  <text x="194" y="28" font-size="12" text-anchor="middle" fill="#1d6fd1">circumference unrolled = π × d</text>
  <text x="310" y="74" font-size="11" text-anchor="middle" fill="#1f2a44">+0.14 d</text>
</svg>
```

The blue line is the circle's edge unrolled flat: three diameters and a little bit more.
:::

::: context why-squares Why area comes in squares
You could measure area in any shape of tile — triangles, hexagons, circles. Squares win because they fit together with no gaps, and a rectangle $l$ squares long and $w$ squares wide holds exactly $l \times w$ of them. That is also why "squared" means "times itself": a square with side $a$ has area $a \times a = a^2$. When you see $\mathrm{m^2}$, picture a floor tile one metre on each side.
:::

::: context circle-slices The pizza rearranged
Eight slices, bottom half pointing up (blue), top half pointing down (orange). The long edges are each half the crust, $\pi r$; the short sides are the radius $r$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <path d="M70,80 L110,80 A40,40 0 0,1 30,80 Z" fill="#8fb8f0"/>
  <path d="M70,80 L30,80 A40,40 0 0,1 110,80 Z" fill="#f2b880"/>
  <circle cx="70" cy="80" r="40" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.2">
    <line x1="30" y1="80" x2="110" y2="80"/><line x1="70" y1="40" x2="70" y2="120"/>
    <line x1="41.72" y1="51.72" x2="98.28" y2="108.28"/><line x1="41.72" y1="108.28" x2="98.28" y2="51.72"/>
  </g>
  <text x="140" y="85" font-size="18" text-anchor="middle" fill="#1f2a44">→</text>
  <g stroke="#1f2a44" stroke-width="1.2">
    <polygon points="180,110 211.42,110 195.71,70" fill="#8fb8f0"/>
    <polygon points="211.42,110 242.84,110 227.13,70" fill="#8fb8f0"/>
    <polygon points="242.84,110 274.26,110 258.55,70" fill="#8fb8f0"/>
    <polygon points="274.26,110 305.68,110 289.97,70" fill="#8fb8f0"/>
    <polygon points="195.71,70 227.13,70 211.42,110" fill="#f2b880"/>
    <polygon points="227.13,70 258.55,70 242.84,110" fill="#f2b880"/>
    <polygon points="258.55,70 289.97,70 274.26,110" fill="#f2b880"/>
    <polygon points="289.97,70 321.39,70 305.68,110" fill="#f2b880"/>
  </g>
  <text x="243" y="132" font-size="12" text-anchor="middle" fill="#1f2a44">πr (half the crust)</text>
  <text x="176" y="95" font-size="12" text-anchor="end" fill="#1f2a44">r</text>
  <text x="243" y="152" font-size="12" text-anchor="middle" fill="#1d6fd1">area ≈ πr × r = πr²</text>
</svg>
```
:::

::: context reference-area The area the air pushes on
As a rocket climbs, air rams into its front. The force depends on how fast it goes, how thick the air is, and how big a hole the rocket punches through the air — the area of its circular end. Engineers agree to use that circle's area as the "reference area". For a body $3.66\,\mathrm{m}$ across it is $\pi \times 1.83^2 \approx 10.5\,\mathrm{m^2}$. You will multiply by it in every air-force calculation in the atmospheric flight module.
:::

::: context cubesat Satellites the size of a loaf of bread
A CubeSat is a small satellite built from standard $10\,\mathrm{cm}$ cubes called "units". Universities and companies launch them because they are cheap and many can ride along on one rocket. A 1U CubeSat is one cube; a 3U is three stacked end to end, about the size of a loaf of bread. Because they are so small, every square centimetre of surface is fought over — for solar cells, antennas and cameras.
:::

::: context cylinder-net Unrolling a can
Cut a can's label straight down and flatten it: a rectangle as wide as the can's circumference. Add the lid and the base.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <circle cx="163" cy="24" r="20" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="100.2" y="44" width="125.7" height="90" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="163" cy="154" r="20" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="163" y="94" font-size="12" text-anchor="middle" fill="#1f2a44">2πr × h</text>
  <text x="92" y="94" font-size="12" text-anchor="end" fill="#1f2a44">h</text>
  <text x="235" y="28" font-size="12" fill="#1f2a44">lid: πr²</text>
  <text x="235" y="158" font-size="12" fill="#1f2a44">base: πr²</text>
  <text x="235" y="94" font-size="12" fill="#1f2a44">width = 2πr</text>
</svg>
```

Add the three pieces: $2\pi r h + 2\pi r^2$.
:::

::: context stack-of-coins Why the height multiplies the end
Picture a stack of identical coins. One coin's volume is its face area times its thickness. Stack a hundred and the volume is a hundred times bigger, and so is the height. So the volume is the face area times the total height. This works for any "straight-up" solid — a box, a cylinder, a hexagonal pencil — as long as every slice is the same shape. It fails for a cone, whose slices shrink toward the tip, which is why the cone gets its $\tfrac{1}{3}$.
:::

::: context archimedes The formula on a tombstone
Archimedes lived in Syracuse, on the island of Sicily, around 250 BC. He was so proud of the sphere-in-a-cylinder result that he asked for it to be carved on his tomb. The Roman writer Cicero reported finding the overgrown grave, marked by a sphere and a cylinder, well over a century later.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="135" y="40" width="90" height="100" fill="#fff" stroke="none"/>
  <ellipse cx="180" cy="140" rx="45" ry="10" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="135" y1="40" x2="135" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="225" y1="40" x2="225" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="180" cy="90" r="45" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <ellipse cx="180" cy="40" rx="45" ry="10" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="90" x2="225" y2="90" stroke="#b4232c" stroke-width="2"/>
  <text x="203" y="84" font-size="12" text-anchor="middle" fill="#b4232c">r</text>
  <line x1="245" y1="40" x2="245" y2="140" stroke="#1f2a44" stroke-width="1"/>
  <text x="252" y="94" font-size="12" fill="#1f2a44">height 2r</text>
  <text x="180" y="170" font-size="12" text-anchor="middle" fill="#1f2a44">ball = 2/3 of the can</text>
</svg>
```

The cylinder holds $2\pi r^3$; the ball fills two thirds of it, $\tfrac{4}{3}\pi r^3$.
:::

::: context square-cube The square–cube rule on real rockets
Propellant fills a volume, which grows like $k^3$. The tank walls are an area, which grows like $k^2$. So when you make a tank bigger, the propellant grows faster than the metal holding it, and a bigger stage can be a lighter fraction metal. It is one reason the rockets that reach orbit are large. The same rule explains why an elephant needs much thicker legs than a mouse, for its size: its weight grows like $k^3$, but the strength of its bones grows only like their cross-section area, $k^2$.
:::
