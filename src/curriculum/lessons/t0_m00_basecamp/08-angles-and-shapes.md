---
id: l08-angles-and-shapes
title: Angles and shapes
minutes: 23
covers:
  - angles and shapes
---

Open a door a little way, then wider, then all the way until it lies flat against the wall. What changed each time was not a distance. The door stayed the same size. What changed was *how far it had turned*. That amount of turning is an **angle**.

A rocket is steered almost entirely by angles. Its engines swivel a [[few degrees|gimbal]] to one side to push the nose round. It leaves the pad pointing straight up and tips over, bit by bit, until it flies level with the ground. It is aimed along a compass direction chosen so its orbit passes over the right places. Aircraft, ships and spacecraft all report which way they are facing as an angle.

This lesson is the geometry the rest of the course is built on. You will learn to measure angles, the handful of facts about angles on lines and around points, why the angles of a triangle always add to the same total, how that grows into rules for every straight-sided shape, the words for the parts of a circle, and how compass headings work. The next time you meet these ideas they will be called trigonometry, and they will feel familiar.

## Measuring turn in degrees

To put a number on an angle, we split one complete turn into $360$ equal steps called **degrees**, written with a small circle: $360^\circ$. The choice of [[360|why-360]] is very old, and it is handy because $360$ divides evenly in so many ways.

Some turns are worth knowing by heart:

- a **full turn**, all the way round to face where you started: $360^\circ$;
- a **half turn**, to face the opposite way: $180^\circ$;
- a **quarter turn**, like the corner of a page: $90^\circ$.

An angle is drawn as two straight lines, called the **arms**, meeting at a point, called the **vertex**. The angle is the turn from one arm to the other. The length of the arms does not matter: a tiny corner of a stamp and the corner of a football field are both $90^\circ$.

### Names for angles

Angles get names by size. The [[picture of the four main types|angle-types]] shows them side by side.

| Name | Size | Everyday example |
| --- | --- | --- |
| **acute** | more than $0^\circ$, less than $90^\circ$ | the tip of a pizza slice |
| **right angle** | exactly $90^\circ$ | the corner of a book |
| **obtuse** | more than $90^\circ$, less than $180^\circ$ | a laptop opened wide |
| **straight** | exactly $180^\circ$ | a door lying flat against the wall |
| **reflex** | more than $180^\circ$, less than $360^\circ$ | the outside of a pizza slice |

A right angle is marked in drawings with a small square in the corner, instead of a curved arc. Two lines that meet at a right angle are called **[[perpendicular|perpendicular]]**. Walls and floors are perpendicular; so are the $x$- and $y$-axes of the last lesson.

### Using a protractor

A **protractor** is a half-circle of clear plastic marked from $0^\circ$ to $180^\circ$. To measure an angle:

1. Put the small center mark of the protractor exactly on the vertex.
2. Turn the protractor so its $0^\circ$ line lies along one arm.
3. Follow the *same* scale round from that $0$ until you reach the other arm, and read the number.

Before you trust the reading, look at the angle. Is it smaller than a corner of a page? Then it is acute, and the answer must be less than $90$.

::: warning A protractor has two scales
Most protractors have an inner scale and an outer scale running in opposite directions, so $50^\circ$ and $130^\circ$ sit at the same mark. Always start from the $0$ that lies on your first arm. If your angle is clearly narrow and you read $130^\circ$, you used the wrong scale — the true answer is $180 - 130 = 50^\circ$.
:::

## Angle facts on lines and around points

Three facts do most of the work in geometry. Each one comes straight from "a half turn is $180^\circ$" and "a full turn is $360^\circ$".

**Angles on a straight line add to $180^\circ$.** A straight line is a half turn. If another line leans against it, it splits that half turn into two angles, and together they still make $180^\circ$. So if one of them is $65^\circ$, the other is $180 - 65 = 115^\circ$.

**Angles around a point add to $360^\circ$.** Go all the way round a point and you have made one full turn. If three angles round a point are $90^\circ$, $130^\circ$ and $75^\circ$, the fourth is

$$
360 - (90 + 130 + 75) = 360 - 295 = 65^\circ.
$$

**Vertically opposite angles are equal.** When two straight lines cross, they make an X with four angles. The angles facing each other across the crossing are equal. Why? Each of them sits on a straight line with the same neighbor, so each is $180^\circ$ minus that neighbor.

::: key Angle facts
A full turn is $360^\circ$, a half turn (a straight line) $180^\circ$ and a right angle $90^\circ$. Angles on a straight line add to $180^\circ$; angles around a point add to $360^\circ$; vertically opposite angles are equal.
:::

::: example The angles of a climbing rocket
Some time after lift-off, a rocket is flying in a straight line at $70^\circ$ above the flat ground. (Engineers call this the **[[flight-path angle|flight-path-angle]]**: $90^\circ$ is straight up, $0^\circ$ is level.)

**How far is it tipped from straight up?** Straight up and the ground meet at a right angle, $90^\circ$. The rocket's path splits that right angle into two parts: $70^\circ$ from the ground and the rest from the upright. So it is tipped

$$
90 - 70 = 20^\circ
$$

away from vertical.

**What angle does its path make with the ground behind it?** The ground is a straight line. The path makes $70^\circ$ with the ground ahead, so with the ground behind it makes

$$
180 - 70 = 110^\circ.
$$

**Check.** $20^\circ$ is acute and small, which fits a rocket still climbing steeply. $110^\circ$ is obtuse, which fits the wide angle on the far side. And $70 + 110 = 180$, the whole straight line.
:::

## Triangles

A **triangle** is a shape with three straight sides and three corners. It is the simplest shape that encloses a space, and every other straight-sided shape can be cut into triangles. That makes it the most important shape in this course.

Here is its central fact. Draw any triangle — tall, flat, lopsided — cut off the three corners and put them together, point to point. They always fit exactly along a straight line. So:

::: key The angles of a triangle
The three angles of any triangle add up to $180^\circ$. A right angle is $90^\circ$, a full turn $360^\circ$.
:::

This means that if you know two angles of a triangle, you know the third. A triangle with angles $50^\circ$ and $60^\circ$ has a third angle of $180 - 50 - 60 = 70^\circ$.

::: note Why the angles must add to 180°
Take a triangle with angles $a$, $b$ and $c$, where $c$ is at the top. Through the top corner, draw a line parallel to the bottom side — parallel means it runs alongside and never meets it. That line is straight, so the three angles along it at the top add to $180^\circ$.

The middle one of the three is $c$ itself. The left one is equal to $a$, and the right one is equal to $b$. (These are "alternate angles", from the next section: a line crossing two parallel lines makes equal angles in a Z shape.) So $a + c + b = 180^\circ$, and that is true for every triangle there is. The [[picture of this proof|triangle-proof]] shows the three angles lining up.
:::

### Kinds of triangle

Triangles are named by their sides and by their angles.

By sides:

- **equilateral** — all three sides equal. All three angles are then equal too, so each is $180 \div 3 = 60^\circ$;
- **isosceles** — two sides equal. The two angles at the ends of the third side are then equal;
- **scalene** — no two sides equal, and no two angles equal.

By angles:

- **acute triangle** — all three angles are acute;
- **right triangle** — one angle is exactly $90^\circ$;
- **obtuse triangle** — one angle is obtuse.

A triangle can have at most one right angle or one obtuse angle. Two right angles would already use up $180^\circ$ and leave nothing for the third corner.

In a right triangle, the side opposite the right angle is always the longest. It has its own name, the **hypotenuse**. The two shorter sides, which form the right angle, are called the **legs**. The other two angles must add to $90^\circ$, so both are acute. The famous [[3–4–5 triangle|three-four-five]] is a right triangle, and it will come back again and again.

::: warning Only in flat drawings
The $180^\circ$ fact is true for triangles drawn on a flat surface. A triangle drawn on a ball — say, on the Earth, with corners at the North Pole and two points on the equator — has angles that add to *more* than $180^\circ$. For everything in Basecamp the surface is flat. The Trigonometry module shows how navigators handle the round Earth.
:::

::: example A missing angle in a tracking triangle
A radar on the ground watches a rocket. The line from the radar to the rocket points $30^\circ$ above the ground. Picture a triangle with corners at the radar, the rocket, and the spot on the ground straight below the rocket. What is the angle at the rocket's corner?

**Spot the right angle.** "Straight below" means the line from the rocket down to the ground is perpendicular to the ground. So the corner on the ground below the rocket is $90^\circ$.

**Use the angle sum.** The three angles add to $180^\circ$:

$$
180 - 90 - 30 = 60^\circ.
$$

**Check.** $30 + 90 + 60 = 180$. It is a right triangle, and its two other angles, $30^\circ$ and $60^\circ$, add to $90^\circ$ as they must. The side from the radar to the rocket is opposite the right angle, so it is the hypotenuse and the longest side.
:::

## Parallel lines

Two straight lines are **parallel** if they run side by side forever without meeting, like the two rails of a railway track. They stay the same distance apart everywhere.

Draw a third line crossing both of them. That crossing line meets each parallel line at the same slant, so the angles it makes there are copies of each other:

- **[[corresponding angles|parallel-angles]]** are equal — the angle in the same position at each crossing, like the two corners of a letter F;
- **alternate angles** are equal — the angles on opposite sides of the crossing line, between the parallels, like the two corners of a letter Z.

That Z shape is what proves the triangle angle sum. It also explains why a rocket's flight-path angle can be measured against any level line: every level line at the same place is parallel to every other, so each one makes the same angle with the path.

## Polygons

A **polygon** is any flat shape made of straight sides joined end to end, closing up. A triangle has $3$ sides, a **quadrilateral** $4$ (squares and rectangles are quadrilaterals), a **pentagon** $5$, a **hexagon** $6$ and an **octagon** $8$. A polygon whose sides are all equal and whose angles are all equal is called **regular**. A square is a regular quadrilateral; a stop sign is a regular octagon.

How do the angles inside a polygon add up? Pick one corner and draw straight lines from it to every other corner you can reach without crossing a side. A shape with $n$ sides (read "$n$" as "however many sides it has") splits into $n - 2$ triangles, and each triangle holds $180^\circ$. So

$$
\text{sum of the angles inside a polygon} = (n - 2) \times 180^\circ.
$$

Try it on a square: $n = 4$, so $(4 - 2) \times 180 = 360^\circ$. And indeed a square has four right angles, $4 \times 90 = 360^\circ$. The rule works.

For a regular polygon, divide the total equally among the corners:

| Shape | Sides $n$ | Angle sum | Each angle if regular |
| --- | --- | --- | --- |
| triangle | $3$ | $180^\circ$ | $60^\circ$ |
| square | $4$ | $360^\circ$ | $90^\circ$ |
| pentagon | $5$ | $540^\circ$ | $108^\circ$ |
| hexagon | $6$ | $720^\circ$ | $120^\circ$ |
| octagon | $8$ | $1080^\circ$ | $135^\circ$ |

Regular hexagons are special: three of them meet at a point with $3 \times 120 = 360^\circ$, a full turn, so they fit together with no gaps. That is why bees build hexagons — and why [[spacecraft are full of them|hexagons-in-space]].

::: warning Count the triangles from one corner only
The rule is $n - 2$ triangles, not $n$. If you draw lines from a point in the *middle* of the shape to every corner, you get $n$ triangles — but their angles include a full $360^\circ$ around the middle point that is not an angle of the polygon. Take it away and you are back to $n \times 180 - 360 = (n - 2) \times 180$.
:::

## Circles

A **circle** is every point that is the same distance from one fixed point, its **center**. Draw one with a pencil tied to a pin by a string: the pin is the center, and the string is the distance.

- The **radius** $r$ is the distance from the center to the edge — the string. The word comes from the Latin for the [[spoke of a wheel|radius-word]].
- The **diameter** $d$ is the distance straight across, through the center. It is two radii end to end, so $d = 2r$.
- The **circumference** is the distance all the way round the edge. The next lesson shows how to work it out from the radius.

Falcon 9's body is about $3.7\,\mathrm{m}$ across. That is its diameter, so its radius is half of that, $3.7 \div 2 = 1.85\,\mathrm{m}$.

A full turn around the center is $360^\circ$, so equal slices of a circle split the $360^\circ$ equally. A pizza cut into $8$ equal slices has $360 \div 8 = 45^\circ$ at the tip of each slice.

::: warning Radius or diameter?
Drawings and data sheets give whichever is easier to measure — usually the diameter, because you can put a tape measure straight across. Formulas in this course almost always use the radius. Before you use a width, ask which one it is, and halve a diameter to get the radius.
:::

## Compass headings

On a map, the direction something is facing is called its **heading** (or **bearing**). It is measured in a particular way:

- start from **north**, which is $0^\circ$;
- turn **clockwise** — the way a clock's hands go;
- give the answer as three digits, from $000^\circ$ up to $359^\circ$.

So due east is $090^\circ$, due south is $180^\circ$ and due west is $270^\circ$. Northeast, halfway between north and east, is $045^\circ$. The [[compass picture|compass-rose]] shows a heading of $070^\circ$.

::: key Compass headings
A heading is measured clockwise from north: north $000^\circ$, east $090^\circ$, south $180^\circ$, west $270^\circ$. The opposite direction is the heading plus or minus $180^\circ$.
:::

This is *not* how angles are measured on the coordinate plane. There, mathematicians start from the positive $x$-axis (pointing east) and turn counterclockwise. Both are fine, but mixing them up turns east into north. Always check which one a number uses.

::: example Out to the landing zone and back
A recovery ship leaves port on a heading of $070^\circ$ to reach a rocket's landing zone out at sea.

**The way home.** The opposite direction is half a turn away. Add $180^\circ$: $70 + 180 = 250^\circ$. The ship comes home on a heading of $250^\circ$, which is between south ($180^\circ$) and west ($270^\circ$) — west-southwest, as it should be for the reverse of an east-northeast trip.

**A small correction.** Later the ship is heading $350^\circ$ and must change to $020^\circ$. Subtracting gives $350 - 20 = 330$, which would mean turning most of the way round. But going clockwise from $350^\circ$, it takes $10^\circ$ to reach north ($360^\circ$, the same as $000^\circ$) and another $20^\circ$ to reach $020^\circ$. The short way is a $30^\circ$ turn to the right, through north.

**Check.** A $30^\circ$ turn plus the $330^\circ$ long way round make $360^\circ$, a full turn. You always have two ways round a circle, and they add to $360^\circ$; the short one is the one less than $180^\circ$.
:::

Rockets are aimed with headings too. A rocket flying from Florida to meet the International Space Station heads off at an angle called the [[launch azimuth|launch-azimuth]], about $45^\circ$ — northeast, out over the ocean.

::: note Where this comes back
- In [Angles, radians and the unit circle](#/module/t0_m02_trigonometry?lesson=l01-angles-radians-unit-circle) the full turn of $360^\circ$ gets a second unit, the radian, and the circle becomes the picture that defines every angle.
- In [Sine, cosine, tangent and their inverses](#/module/t0_m02_trigonometry?lesson=l02-sin-cos-tan-inverses) the right triangle — hypotenuse, legs and the two acute angles — is where sine, cosine and tangent come from.
- In [atan2, quadrants and angle wrapping](#/module/t0_m02_trigonometry?lesson=l03-atan2-quadrants-wrapping) compass headings clockwise from north meet the counterclockwise angles of mathematics, and the "short way round through north" becomes a rule that flight software must get right.
- In [Gravity, drag and steering losses on ascent](#/module/t1_m13_classical_mechanics?lesson=l07-ascent-losses-gravity-turn) the flight-path angle — $90^\circ$ straight up, $0^\circ$ level — decides how much speed a rocket loses to gravity.
:::

## Check yourself

::: check
Name each angle: $35^\circ$, $90^\circ$, $145^\circ$, $180^\circ$, $250^\circ$.
:::

::: answer
$35^\circ$ is acute (less than $90^\circ$). $90^\circ$ is a right angle. $145^\circ$ is obtuse (between $90^\circ$ and $180^\circ$). $180^\circ$ is a straight angle. $250^\circ$ is reflex (more than $180^\circ$ but less than a full turn).
:::

::: check
Two angles sit side by side on a straight line, and one is three times the other. How big is each? (Use the equation skills from the lesson on solving equations.)
:::

::: answer
Call the smaller angle $x$. The larger is $3x$. Angles on a straight line add to $180^\circ$, so $x + 3x = 180$. Collect like terms: $4x = 180$. Divide both sides by $4$: $x = 45^\circ$. The larger angle is $3 \times 45 = 135^\circ$.

Check: $45 + 135 = 180$, and $135$ is three times $45$.
:::

::: check
A triangle has angles of $47^\circ$ and $68^\circ$. Find the third angle, and say whether the triangle is acute, right or obtuse.
:::

::: answer
$180 - 47 - 68 = 65^\circ$. Check: $47 + 68 + 65 = 180$. All three angles are less than $90^\circ$, so it is an acute triangle.
:::

::: check
A regular decagon has $10$ equal sides. What do its angles add up to, and how big is each one?
:::

::: answer
Split it into $n - 2 = 10 - 2 = 8$ triangles from one corner. The angle sum is $8 \times 180 = 1440^\circ$. Shared equally among $10$ corners, each angle is $1440 \div 10 = 144^\circ$.

Does it make sense? The more sides a regular polygon has, the closer it gets to a circle and the flatter each corner becomes: $120^\circ$ for a hexagon, $135^\circ$ for an octagon, and now $144^\circ$ for a decagon.
:::

::: check
A drone is flying on a heading of $135^\circ$. Which rough direction is that, and what heading takes it straight back? If it is then told to change from heading $010^\circ$ to $340^\circ$, what is the shortest turn?
:::

::: answer
$135^\circ$ is halfway between east ($090^\circ$) and south ($180^\circ$): southeast. Straight back is $135 + 180 = 315^\circ$, northwest.

From $010^\circ$ to $340^\circ$: turning left (counterclockwise) takes $10^\circ$ back to north and another $20^\circ$ past it to $340^\circ$, a $30^\circ$ turn to the left. The other way round is $360 - 30 = 330^\circ$, so the left turn is the short one.
:::

::: check
A round hatch has a diameter of $1.2\,\mathrm{m}$. What is its radius? If its edge has $12$ bolts spaced equally around it, what angle at the center separates neighboring bolts?
:::

::: answer
The radius is half the diameter: $1.2 \div 2 = 0.6\,\mathrm{m}$. Twelve equal spaces share the full turn: $360 \div 12 = 30^\circ$ between neighboring bolts — the same as the gap between the hours on a clock face.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Degrees | full turn $360^\circ$, half turn $180^\circ$, right angle $90^\circ$ |
| Angle names | acute $< 90^\circ$, right $= 90^\circ$, obtuse between $90^\circ$ and $180^\circ$, straight $= 180^\circ$, reflex $> 180^\circ$ |
| On a straight line | angles add to $180^\circ$ |
| Around a point | angles add to $360^\circ$ |
| Crossing lines | vertically opposite angles are equal |
| Triangle | the three angles add to $180^\circ$ |
| Right triangle | one $90^\circ$ angle; the hypotenuse is opposite it and longest; the other two add to $90^\circ$ |
| Parallel lines | corresponding (F) and alternate (Z) angles are equal |
| Polygon with $n$ sides | angle sum $(n - 2) \times 180^\circ$ |
| Circle | center, radius $r$, diameter $d = 2r$, circumference is the distance round |
| Heading | clockwise from north: N $000^\circ$, E $090^\circ$, S $180^\circ$, W $270^\circ$; reverse by $\pm 180^\circ$ |

Next lesson measures the space inside shapes — perimeters, areas and volumes — using the rectangles, triangles and circles from here, and ends with the cylinder, the shape of every rocket tank.

::: context gimbal How a rocket steers with a few degrees
A rocket in space has no air to push against with fins, and even in the air fins are not enough at lift-off. Instead, the engine itself is mounted on a pivot called a **gimbal**, and motors tilt it a few degrees to one side. The engine's push then points slightly off the rocket's center line, which swings the nose round.

A few degrees sounds tiny, but a large engine pushes with hundreds of thousands of newtons, so even a small tilt gives a strong turning push. The guidance computer adjusts that angle many times a second for the whole flight.
:::

::: context why-360 Why a full turn is 360 degrees
Nobody is quite sure, but the choice most likely comes down to us from astronomers in ancient Babylon, who counted in sixties and noticed that the Sun moves across the sky by about one step a day through a year of roughly $360$ days.

Whatever the reason, $360$ is a very convenient number. It can be divided exactly by $2$, $3$, $4$, $5$, $6$, $8$, $9$, $10$, $12$ and many more, so halves, thirds, quarters, sixths and eighths of a turn are all whole numbers of degrees. Mathematicians later invented a second unit, the radian, which you will meet in trigonometry.
:::

::: context angle-types The four main kinds of angle
The arms can be any length — only the turn between them counts. The small square marks a right angle exactly; the curved arcs mark the others.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <path d="M22.0,80.0 L38.0,80.0 A16,16 0 0,0 33.3,68.7 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <line x1="22" y1="80" x2="62" y2="80" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="22" y1="80" x2="50.3" y2="51.7" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="42" y="102" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">acute</text>
  <text x="42" y="117" font-size="11" text-anchor="middle" fill="#6c7a93">less than 90°</text>
  <rect x="115" y="68" width="12" height="12" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <line x1="115" y1="80" x2="155" y2="80" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="115" y1="80" x2="115.0" y2="40.0" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="135" y="102" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">right</text>
  <text x="135" y="117" font-size="11" text-anchor="middle" fill="#6c7a93">exactly 90°</text>
  <path d="M222.0,80.0 L238.0,80.0 A16,16 0 0,0 210.7,68.7 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <line x1="222" y1="80" x2="262" y2="80" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="222" y1="80" x2="193.7" y2="51.7" stroke="#1f2a44" stroke-width="2.5"/>
  <text x="225" y="102" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">obtuse</text>
  <text x="225" y="117" font-size="11" text-anchor="middle" fill="#6c7a93">90° to 180°</text>
  <line x1="278" y1="80" x2="358" y2="80" stroke="#1f2a44" stroke-width="2.5"/>
  <path d="M318.0,80.0 L334.0,80.0 A16,16 0 0,0 302.0,80.0 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="318" y="102" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">straight</text>
  <text x="318" y="117" font-size="11" text-anchor="middle" fill="#6c7a93">exactly 180°</text>
</svg>
```

A reflex angle is the "long way round" the outside of any of the first three: an acute angle of $45^\circ$ has a reflex angle of $360 - 45 = 315^\circ$ on its other side.
:::

::: context perpendicular Where perpendicular comes from
The word comes from the Latin for a plumb line: a weight hanging on a string, which always points straight down. Builders have used plumb lines for thousands of years to make walls stand at a right angle to level ground.

Engineers use the word constantly. A rocket's three body axes are all perpendicular to each other, like the edges meeting at the corner of a box. Being perpendicular is what lets each axis be controlled on its own.
:::

::: context flight-path-angle From straight up to level
A rocket leaves the pad with a flight-path angle of $90^\circ$ — straight up — because it needs to climb out of the thickest air quickly. Then it tips gently over. By the time it reaches orbit, its flight-path angle is close to $0^\circ$: it is moving level with the ground below, sideways, fast.

Why tip over at all? Orbit is mostly about going sideways fast enough that you keep falling around the Earth instead of into it. Height alone does not do it. The whole climb is a steady swing of this one angle, from $90^\circ$ to about $0^\circ$.
:::

::: context triangle-proof The proof in one picture
The red dashed line runs through the top corner, parallel to the bottom. The two blue angles are equal (alternate angles, in a Z) and so are the two orange ones. Along the straight dashed line, $a$, $c$ and $b$ fill a half turn.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M60.0,170.0 L88.0,170.0 A28,28 0 0,0 80.5,150.9 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <path d="M300.0,170.0 L282.9,147.8 A28,28 0 0,0 272.0,170.0 Z" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <path d="M200.0,40.0 L172.0,40.0 A28,28 0 0,0 179.5,59.1 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <path d="M200.0,40.0 L217.1,62.2 A28,28 0 0,0 228.0,40.0 Z" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <path d="M200.0,40.0 L183.9,55.0 A22,22 0 0,0 213.4,57.4 Z" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <polygon points="60,170 300,170 200,40" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="40" x2="340" y2="40" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <text x="102" y="164" font-size="13" fill="#1f2a44" font-weight="700">a</text>
  <text x="258" y="164" font-size="13" fill="#1f2a44" font-weight="700">b</text>
  <text x="200" y="80" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">c</text>
  <text x="158" y="58" font-size="13" fill="#1f2a44" font-weight="700">a</text>
  <text x="232" y="58" font-size="13" fill="#1f2a44" font-weight="700">b</text>
  <text x="36" y="32" font-size="11" fill="#b4232c">line through the top, parallel to the base</text>
  <text x="180" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">a + c + b make a straight line: 180°</text>
</svg>
```

For this triangle the angles are about $42.9^\circ$, $84.7^\circ$ and $52.4^\circ$ — which add to $180.0^\circ$.
:::

::: context three-four-five The 3–4–5 triangle
A triangle with sides $3$, $4$ and $5$ always has a right angle between the $3$ and $4$ sides. Builders have used this for centuries: knot a rope into $12$ equal lengths, stretch it into a $3$–$4$–$5$ triangle, and you have a perfect right-angled corner.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M70.0,170.0 L100.0,170.0 A30,30 0 0,0 94.0,152.0 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <path d="M230.0,50.0 L210.8,64.4 A24,24 0 0,0 230.0,74.0 Z" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="216" y="156" width="14" height="14" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="70,170 230,170 230,50" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <text x="150" y="188" font-size="12" text-anchor="middle" fill="#1f2a44">4</text>
  <text x="240" y="114" font-size="12" fill="#1f2a44">3</text>
  <text x="138" y="100" font-size="12" text-anchor="end" fill="#1f2a44">5 (hypotenuse)</text>
  <text x="108" y="164" font-size="11" fill="#1d6fd1">36.87°</text>
  <text x="222" y="92" font-size="11" text-anchor="end" fill="#b4232c">53.13°</text>
  <text x="250" y="170" font-size="11" fill="#1f2a44">90°</text>
</svg>
```

Its other two angles are about $36.87^\circ$ and $53.13^\circ$, which add to $90^\circ$. You will see these exact numbers again in the Trigonometry module, and the reason $3$, $4$ and $5$ fit together comes in the Pythagoras lesson.
:::

::: context parallel-angles F and Z angles in a picture
The red line crosses two parallel lines at the same slant, here $60^\circ$. The two blue angles sit in the same position at each crossing — top right — so they are **corresponding** angles, the two corners of an F. The orange angle and the lower blue angle sit on opposite sides of the red line, between the parallels, like the corners of a Z. They are **alternate** angles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <path d="M230.0,60.0 L252.0,60.0 A22,22 0 0,0 241.0,40.9 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <path d="M183.8,140.0 L205.8,140.0 A22,22 0 0,0 194.8,120.9 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <path d="M230.0,60.0 L208.0,60.0 A22,22 0 0,0 219.0,79.1 Z" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <line x1="30" y1="60" x2="330" y2="60" stroke="#1f2a44" stroke-width="2"/>
  <line x1="30" y1="140" x2="330" y2="140" stroke="#1f2a44" stroke-width="2"/>
  <line x1="160.7" y1="180.0" x2="253.1" y2="20.0" stroke="#b4232c" stroke-width="2"/>
  <text x="256" y="54" font-size="11" fill="#1f2a44">60°</text>
  <text x="209.8" y="134" font-size="11" fill="#1f2a44">60°</text>
  <text x="204" y="76" font-size="11" text-anchor="end" fill="#1f2a44">60°</text>
  <text x="30" y="52" font-size="11" fill="#6c7a93">parallel</text>
  <text x="30" y="132" font-size="11" fill="#6c7a93">parallel</text>
</svg>
```

All three marked angles are $60^\circ$. Slide the lower crossing up along the red line and it lands exactly on the upper one, which is why the angles must match.
:::

::: context hexagons-in-space Hexagons in spacecraft
The James Webb Space Telescope's main mirror is made of $18$ hexagonal segments fitted together into one mirror about $6.5$ metres across. Hexagons were chosen because they tile with no gaps and make a nearly round overall shape.

Inside spacecraft walls, you will often find **honeycomb panels**: a layer of thin metal hexagon cells glued between two sheets. The honeycomb makes the panel very stiff for very little mass, which is exactly what a spacecraft needs.
:::

::: context radius-word Spokes and measuring across
**Radius** is Latin for the spoke of a wheel, or a ray — a straight line from the center out to the rim. Its plural is **radii** (said "RAY-dee-eye"). **Diameter** comes from Greek words meaning "measure across". Picture a bicycle wheel: each spoke is a radius, and two spokes in a straight line through the hub make a diameter.
:::

::: context compass-rose Reading a heading
North is at the top, $000^\circ$. Turn clockwise: east is $090^\circ$, south $180^\circ$, west $270^\circ$. The red arrow points along a heading of $070^\circ$, a bit north of east.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="110" r="78" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="32" x2="180" y2="188" stroke="#6c7a93" stroke-width="1"/>
  <line x1="102" y1="110" x2="258" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <text x="180" y="24" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">N 000°</text>
  <text x="264" y="114" font-size="12" text-anchor="start" fill="#1f2a44" font-weight="700">E 090°</text>
  <text x="180" y="205" font-size="12" text-anchor="middle" fill="#1f2a44" font-weight="700">S 180°</text>
  <text x="96" y="114" font-size="12" text-anchor="end" fill="#1f2a44" font-weight="700">W 270°</text>
  <path d="M180,110 L180,76 A34,34 0 0,1 211.9,98.4 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <line x1="180" y1="110" x2="245.8" y2="86.1" stroke="#b4232c" stroke-width="3"/>
  <polygon points="253.3,83.3 247.5,90.8 244.1,81.4" fill="#b4232c"/>
  <text x="194" y="70" font-size="12" fill="#1f2a44">70°</text>
  <text x="257.3" y="77.3" font-size="12" fill="#b4232c">heading 070°</text>
</svg>
```

Going on round past $359^\circ$ brings you back to north, so $360^\circ$ and $000^\circ$ are the same direction.
:::

::: context launch-azimuth Why Florida launches head northeast
The space station's orbit is tilted $51.6^\circ$ to the equator. To slide neatly into that tilted orbit from Kennedy Space Center, at about $28.5^\circ$ north, a rocket has to leave on a heading of roughly $45^\circ$. Heading east of north like this also puts the rocket's path over the Atlantic Ocean, so anything that drops off on the way falls into the sea, not onto towns.

Launching toward the east has one more bonus: the Earth spins eastward, so the rocket starts with the ground's own speed added to its own.
:::
