---
id: l07-graphs-and-the-coordinate-plane
title: The coordinate plane and reading graphs
minutes: 17
covers:
  - the coordinate plane and reading graphs
---

Watch any rocket launch broadcast and you will see two numbers ticking up in the corner of the screen: speed and altitude. In the control room, the same numbers are drawn as lines creeping across a screen, second by second. An engineer glances at a line and knows at once whether the rocket is climbing, hovering or falling, and whether it is speeding up — long before anyone could read a column of numbers.

That line is a **graph**: a picture of how one quantity changes as another changes. Graphs are how engineers look at test data, how they spot a problem, and how they explain a flight to each other. They are also how the rest of this course draws almost every idea, from the path of a thrown ball to the shape of an orbit.

This lesson builds graphs from nothing. First comes the grid that every graph sits on, and the pair of numbers that names each point on it. Then plotting points, turning a table of numbers into a picture and back, and the one number that measures how steep a straight line is. It ends with reading real graphs of altitude and speed the way a flight engineer would.

## Two number lines make a grid

You already know the number line: zero in the middle, positive numbers to the right, negative numbers to the left. Now take a second number line and stand it straight up, crossing the first one at zero. Positive numbers go up, negative numbers go down.

Those two lines are the **axes** (one of them is an *axis*). The flat one is the **x-axis**, going left and right. The upright one is the **y-axis**, going up and down. The point where they cross, where both are zero, is the **origin**. The whole flat surface they sit in is the **[[coordinate plane|descartes]]**.

Every point on the plane can now be named by two numbers. Start at the origin. The first number says how far to go along — right if positive, left if negative. The second number says how far to go up if positive, or down if negative. The pair is written in brackets with a comma, like $(3, -2)$, and it is called an **ordered pair**, or the point's **coordinates**. "Ordered" matters: the order of the two numbers carries meaning.

::: key Reading a point
The point $(3, -2)$ means: start at the origin, go $3$ along the x-axis (right), then $2$ down the y-axis. The first number is always $x$, the second $y$.
:::

A few points to get the feel of it:

- $(2, 3)$: two right, three up.
- $(-4, 1)$: four left, one up.
- $(-3, -2)$: three left, two down.
- $(0, 5)$: no steps along at all, five up. This point sits on the y-axis.
- $(-2, 0)$: two left, no steps up. This point sits on the x-axis.
- $(0, 0)$: the origin itself.

Maps work the same way. A place on Earth is named by [[two numbers, longitude and latitude|map-grid]] — one for how far east or west, one for how far north or south.

::: warning Along first, then up
$(2, 5)$ and $(5, 2)$ are different points. One way to remember the order is "along the corridor, then up the stairs": walk along first ($x$), then climb ($y$). Another is that $x$ comes before $y$ in the alphabet, and it comes first in the brackets too.
:::

### The four quadrants

The two axes cut the plane into four regions called **quadrants**. They are numbered with Roman numerals, starting at the top right and going round counterclockwise — the opposite way to a clock's hands:

| Quadrant | Where | Sign of $x$ | Sign of $y$ | Example |
| --- | --- | --- | --- | --- |
| I | top right | $+$ | $+$ | $(2, 3)$ |
| II | top left | $-$ | $+$ | $(-4, 1)$ |
| III | bottom left | $-$ | $-$ | $(-3, -2)$ |
| IV | bottom right | $+$ | $-$ | $(3, -2)$ |

So the signs alone tell you the quadrant, without drawing anything. A point with a negative $x$ and a positive $y$ must be up and to the left, in quadrant II. The [[picture of the four quadrants|quadrant-picture]] shows all four example points.

This is more than a naming game. Later in the course, a direction is worked out from a pair of numbers like these, and getting the quadrant wrong makes a spacecraft point exactly the opposite way. Knowing the signs cold now is the first defence.

## From table to graph and back

A graph is usually made from a **table**: pairs of numbers that go together. Each row becomes one point. The first column gives the $x$ of the point and the second gives the $y$.

On real graphs the axes are rarely labelled plain "$x$" and "$y$". Time usually runs along the bottom, because time is what we count forward, and the quantity that changes with time goes up the side. The axes are labelled with what they measure and its units: "time $t$ (s)", "altitude (m)".

::: warning Check the scale on each axis
On graph paper, one square does not have to mean $1$. On a time axis each square might be $10$ seconds; on an altitude axis, $20$ metres. The two axes can use different scales. Before reading anything off a graph, find out how much one square is worth on each axis — this is the most common way people misread a perfectly good graph.
:::

::: example Drawing and reading a ball's flight
A ball is thrown straight up from the top of a $100\,\mathrm{m}$ tower. Its height $h$, in metres, after $t$ seconds is given by the table below. (The numbers come from the formula $h = 100 + 20t - 4.903t^2$, which you will meet again in the Algebra module. Here we only need the table.)

| $t$ (s) | $0$ | $1$ | $2$ | $3$ | $4$ | $5$ | $6$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| $h$ (m) | $100$ | $115.1$ | $120.4$ | $115.9$ | $101.6$ | $77.4$ | $43.5$ |

**Draw it.** Put time along the bottom, one square per second, and height up the side, one square per $25\,\mathrm{m}$. Each column of the table gives a point: $(0, 100)$, $(1, 115.1)$, $(2, 120.4)$, and so on. Join the points with a smooth curve, because the ball moves smoothly between the moments we wrote down. You get a hump: up, over, and down. The [[finished graph|ball-graph]] is in the notes.

**Read it.** Now questions that would be slow to answer from a formula become quick to answer by eye.

- *How high does it go?* The top of the hump is a little above $120\,\mathrm{m}$, a little after $t = 2\,\mathrm{s}$.
- *When is it back at the height it started from?* Draw a flat line across at $h = 100$. It meets the curve at $t = 0$ and again just after $t = 4\,\mathrm{s}$ — the table shows $101.6$ at $4\,\mathrm{s}$, only slightly above $100$.
- *When does it hit the ground?* Following the curve down past $43.5\,\mathrm{m}$ at $6\,\mathrm{s}$, it reaches $h = 0$ at about $7\,\mathrm{s}$.

**Does it make sense?** A thrown ball rises, slows, stops for an instant at the top and falls back faster and faster. The curve is gentle near the top and steep at the right-hand end, which is exactly that story. Reading between the table's points like this is called **[[interpolating|interpolating]]**.
:::

## Straight lines and slope

Some tables make points that all sit on one straight line. That happens whenever the $y$ value goes up (or down) by the *same amount* for every equal step in $x$.

Here is a rocket that starts at $100\,\mathrm{m/s}$ and gains $4\,\mathrm{m/s}$ of speed every second. Its speed is $v = 100 + 4t$. A table every $10$ seconds:

| $t$ (s) | $0$ | $10$ | $20$ | $30$ |
| --- | --- | --- | --- | --- |
| $v$ (m/s) | $100$ | $140$ | $180$ | $220$ |

Every $10$ seconds, the speed goes up by exactly $40\,\mathrm{m/s}$. Plot the points and they line up perfectly: the graph is a straight line.

How steep is it? Pick two points on the line. Going from the first to the second, the **run** is how far you move along (the change in $x$), and the **rise** is how far you move up (the change in $y$). The **slope** is the rise divided by the run:

$$
\text{slope} = \frac{\text{rise}}{\text{run}} = \frac{\text{change in } y}{\text{change in } x}.
$$

From $(10, 140)$ to $(20, 180)$, the rise is $180 - 140 = 40\,\mathrm{m/s}$ and the run is $20 - 10 = 10\,\mathrm{s}$, so

$$
\text{slope} = \frac{40\,\mathrm{m/s}}{10\,\mathrm{s}} = 4\,\mathrm{m/s^2}.
$$

The slope is the amount $y$ goes up for each step of $1$ in $x$. Any two points on a straight line give the same slope — that is what makes it straight. Try $(0, 100)$ and $(30, 220)$: rise $120$, run $30$, slope $4$ again. The [[rise-and-run triangle|slope-triangle]] shows it on the graph.

::: key Slope of a straight line
$\text{slope} = \dfrac{\text{rise}}{\text{run}} = \dfrac{\text{change in } y}{\text{change in } x}$, the same between any two points on the line. It is how much $y$ changes for each step of $1$ in $x$. Its units are the $y$ units divided by the $x$ units.
:::

Look again at that slope: $4\,\mathrm{m/s^2}$. That is the rocket's acceleration — the "$4$" in $v = 100 + 4t$. This is no coincidence, and it is one of the most useful facts in the course. **The slope of a line has meaning, and its units tell you what the meaning is.** Slope on a speed–time graph is [[acceleration|slope-meaning]]. Slope on a distance–time graph is speed.

The other number in $v = 100 + 4t$ has a meaning on the graph too. At $t = 0$ the speed is $100$, so the line crosses the upright axis at $100$. That crossing point is called the **y-intercept**: the starting value.

### Up, down and flat

Slopes can be positive, negative or zero.

- **Positive slope**: the line goes uphill as you read left to right. The quantity is growing.
- **Negative slope**: downhill. The quantity is shrinking.
- **Zero slope**: perfectly flat. The quantity is not changing at all.

In the last two lessons we used the propellant formula $m = 411\,000 - 2540\,t$. Its graph is a straight line going downhill. From $t = 0$ to $t = 100\,\mathrm{s}$, the mass goes from $411\,000$ to $157\,000\,\mathrm{kg}$, so the "rise" is actually a fall:

$$
\text{slope} = \frac{157000 - 411000}{100 - 0} = \frac{-254000}{100} = -2540\,\mathrm{kg/s}.
$$

The minus sign says the mass is going down, and the size says by how much each second: exactly the burn rate we started from.

::: warning Subtract in the same order, top and bottom
When you work out a slope, take both points in the same order: (second $y$ minus first $y$) over (second $x$ minus first $x$). If you do the top one way round and the bottom the other way round, you get the right size with the wrong sign — a line that goes uphill reported as going downhill.
:::

## Reading real graphs

Engineers read graphs by asking three questions: *What is on each axis, and in what units? Where is the line high or low? Where is it steep or flat?* The height of the line tells you the value. The steepness tells you how fast it is changing.

On an **altitude–time graph** — height up the side, time along the bottom:

- a line going up means the vehicle is climbing, and the steeper it is, the faster it climbs;
- a flat line means it is holding its height, hovering;
- a line going down means it is descending.

On a **speed–time graph**:

- a line going up means speeding up;
- a flat line means steady speed — it is still moving, just not changing speed;
- a line going down means slowing.

::: warning A flat line does not always mean "stopped"
On an altitude graph, flat means "not climbing or falling". On a speed graph, flat means "the speed is not changing", which can mean moving at a steady $7.67\,\mathrm{km/s}$ in orbit. Always read the axis label before you decide what flat means.
:::

::: example Reading a hop test
Engineers test landing rockets with short "hops": the vehicle lifts off, rises, hovers, and comes back down. A test vehicle's altitude is recorded every $10$ seconds:

| time (s) | $0$ | $10$ | $20$ | $30$ | $40$ | $50$ | $60$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| altitude (m) | $0$ | $50$ | $100$ | $100$ | $100$ | $50$ | $0$ |

Plotted and joined, this makes a [[flat-topped hill|hop-graph]]: a straight climb, a flat top, a straight descent.

**Climb.** From $(0, 0)$ to $(20, 100)$, the slope is $\dfrac{100 - 0}{20 - 0} = 5\,\mathrm{m/s}$. The units are metres per second — a speed. The vehicle climbs at $5\,\mathrm{m/s}$.

**Hover.** From $(20, 100)$ to $(40, 100)$, the rise is $0$, so the slope is $0\,\mathrm{m/s}$. It holds $100\,\mathrm{m}$ for $20$ seconds.

**Descent.** From $(40, 100)$ to $(60, 0)$, the slope is $\dfrac{0 - 100}{60 - 40} = \dfrac{-100}{20} = -5\,\mathrm{m/s}$. The minus sign says it is coming down, at the same $5\,\mathrm{m/s}$ it went up.

**Check.** Up $100\,\mathrm{m}$ at $5\,\mathrm{m/s}$ takes $100 \div 5 = 20$ seconds, which matches the graph. The whole hop lasts one minute and ends where it began, at $0\,\mathrm{m}$.
:::

::: note Where this comes back
- In [Functions, domain, range, composition and inverses](#/module/t0_m01_algebra_precalc?lesson=l06-functions) a graph becomes the picture of a *function*: every point $(x, f(x))$, with the thrown ball's height as a main example.
- In [atan2, quadrants and angle wrapping](#/module/t0_m02_trigonometry?lesson=l03-atan2-quadrants-wrapping) the four quadrants decide which way a vector points — and the signs of $x$ and $y$ are how software tells them apart.
- In [The derivative from first principles](#/module/t0_m06_calculus_single?lesson=l02-the-derivative) slope is taken for curves as well as straight lines, and the slope of a position graph becomes the velocity at an instant.
:::

## Check yourself

::: check
Without drawing, say where each point is: $(-5, 2)$, $(4, -7)$, $(-1, -1)$ and $(0, 3)$.
:::

::: answer
$(-5, 2)$: $x$ negative, $y$ positive, so up and to the left — quadrant II.

$(4, -7)$: $x$ positive, $y$ negative, so down and to the right — quadrant IV.

$(-1, -1)$: both negative, so down and to the left — quadrant III.

$(0, 3)$: no steps along, three up. It lies on the y-axis, so it is not in any quadrant.
:::

::: check
A classmate plots the point $(2, 5)$ by going up $2$ and right $5$. What did they actually plot, and where should the point be?
:::

::: answer
They plotted $(5, 2)$: five along, two up. The first number is always $x$ (along), so $(2, 5)$ is two to the right and then five up. The two points are in the same quadrant but in different places.
:::

::: check
A car's distance from the start is recorded: at $0\,\mathrm{s}$ it is $0\,\mathrm{m}$, at $2\,\mathrm{s}$ it is $30\,\mathrm{m}$, at $4\,\mathrm{s}$ it is $60\,\mathrm{m}$ and at $6\,\mathrm{s}$ it is $90\,\mathrm{m}$. Is the graph a straight line? What is its slope, and what does the slope mean?
:::

::: answer
Every $2$ seconds the distance grows by the same $30\,\mathrm{m}$, so the points lie on a straight line. Slope $= \dfrac{30\,\mathrm{m}}{2\,\mathrm{s}} = 15\,\mathrm{m/s}$. The units are metres per second, so the slope is the car's speed: a steady $15\,\mathrm{m/s}$. It passes through the origin, $(0, 0)$, because the car started at distance zero.
:::

::: check
In the last lesson, tank A held $500$ litres at $t = 0$ and $320$ litres at $t = 15$ minutes, draining steadily. What is the slope of its graph? Is it uphill or downhill?
:::

::: answer
Take the points in order, $(0, 500)$ then $(15, 320)$. Slope $= \dfrac{320 - 500}{15 - 0} = \dfrac{-180}{15} = -12$ litres per minute. It is negative, so the line runs downhill: the tank loses $12$ litres every minute, just as the problem said.
:::

::: check
Look back at the ball's table. At what times is the ball about $115\,\mathrm{m}$ up? Why are there two answers?
:::

::: answer
The table shows $115.1\,\mathrm{m}$ at $t = 1\,\mathrm{s}$ and $115.9\,\mathrm{m}$ at $t = 3\,\mathrm{s}$, so the ball is at about $115\,\mathrm{m}$ at about $1\,\mathrm{s}$ and again at about $3\,\mathrm{s}$. A flat line drawn at $115\,\mathrm{m}$ crosses the hump twice: once while the ball is going up and once while it is coming down.
:::

## Summary

| Idea | In one line |
| --- | --- |
| Axes and origin | the x-axis goes across, the y-axis goes up; they cross at the origin $(0, 0)$ |
| Ordered pair | $(x, y)$: go $x$ along, then $y$ up; the first number is always $x$ |
| Quadrants | I $(+, +)$, II $(-, +)$, III $(-, -)$, IV $(+, -)$, counterclockwise from top right |
| Table to graph | each row is one point; label each axis with its quantity and units |
| Scale | check what one square is worth on each axis before reading anything |
| Slope | $\dfrac{\text{rise}}{\text{run}} = \dfrac{\text{change in } y}{\text{change in } x}$; units are $y$ units over $x$ units |
| Signs of slope | uphill positive, downhill negative, flat zero |
| y-intercept | where the line crosses the upright axis: the starting value |
| Meaning of slope | on distance–time it is speed; on speed–time it is acceleration |

Next lesson turns from grids to angles and shapes — how far something has turned, why a triangle's angles always add to the same total, and how a compass heading is measured. Together with the coordinate plane, that is everything trigonometry is built from.

::: context descartes A grid named after a philosopher
This grid is often called the **Cartesian plane**, after the French thinker René Descartes. In a book published in 1637 he showed how to describe shapes with numbers and equations, so that geometry problems could be solved with algebra. Pierre de Fermat, another French mathematician, worked out the same idea at about the same time.

The big insight was that a picture and an equation can be two views of one thing. A straight line *is* an equation like $v = 100 + 4t$, and an equation *is* a line. Nearly everything in this course leans on that idea.
:::

::: context map-grid A launch pad as an ordered pair
Longitude measures east or west of a line through Greenwich, England; latitude measures north or south of the equator. Both are angles in degrees. Treat east and north as positive, and a map is a coordinate plane: longitude along, latitude up.

Kennedy Space Center's Launch Complex 39A in Florida is at about $28.6^\circ$ north and $80.6^\circ$ west. As an ordered pair (longitude, latitude), that is $(-80.6, 28.6)$ — west makes the first number negative, so Florida sits in quadrant II of this map. The Earth is round, not flat, so the Trigonometry module deals with the curve properly.
:::

::: context quadrant-picture The four quadrants
Here are the four example points from the table, one in each quadrant. The signs of the two numbers tell you the quadrant before you draw anything.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <g stroke="#8fb8f0" stroke-width="0.8"><line x1="90" y1="20" x2="90" y2="200"/><line x1="90" y1="20" x2="270" y2="20"/><line x1="108" y1="20" x2="108" y2="200"/><line x1="90" y1="38" x2="270" y2="38"/><line x1="126" y1="20" x2="126" y2="200"/><line x1="90" y1="56" x2="270" y2="56"/><line x1="144" y1="20" x2="144" y2="200"/><line x1="90" y1="74" x2="270" y2="74"/><line x1="162" y1="20" x2="162" y2="200"/><line x1="90" y1="92" x2="270" y2="92"/><line x1="180" y1="20" x2="180" y2="200"/><line x1="90" y1="110" x2="270" y2="110"/><line x1="198" y1="20" x2="198" y2="200"/><line x1="90" y1="128" x2="270" y2="128"/><line x1="216" y1="20" x2="216" y2="200"/><line x1="90" y1="146" x2="270" y2="146"/><line x1="234" y1="20" x2="234" y2="200"/><line x1="90" y1="164" x2="270" y2="164"/><line x1="252" y1="20" x2="252" y2="200"/><line x1="90" y1="182" x2="270" y2="182"/><line x1="270" y1="20" x2="270" y2="200"/><line x1="90" y1="200" x2="270" y2="200"/></g>
  <line x1="82" y1="110" x2="278" y2="110" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="208" x2="180" y2="12" stroke="#1f2a44" stroke-width="2"/>
  <text x="284" y="114" font-size="12" fill="#1f2a44">x</text>
  <text x="186" y="12" font-size="12" fill="#1f2a44">y</text>
  <text x="310" y="40" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">I</text>
  <text x="310" y="55" font-size="11" text-anchor="middle" fill="#6c7a93">(+, +)</text>
  <text x="50" y="40" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">II</text>
  <text x="50" y="55" font-size="11" text-anchor="middle" fill="#6c7a93">(−, +)</text>
  <text x="50" y="180" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">III</text>
  <text x="50" y="195" font-size="11" text-anchor="middle" fill="#6c7a93">(−, −)</text>
  <text x="310" y="180" font-size="13" text-anchor="middle" fill="#1f2a44" font-weight="700">IV</text>
  <text x="310" y="195" font-size="11" text-anchor="middle" fill="#6c7a93">(+, −)</text>
  <circle cx="234" cy="146" r="4" fill="#b4232c"/>
  <text x="240" y="140" font-size="11" text-anchor="start" fill="#b4232c">(3, −2)</text>
  <circle cx="216" cy="56" r="4" fill="#1d6fd1"/>
  <text x="222" y="50" font-size="11" text-anchor="start" fill="#1d6fd1">(2, 3)</text>
  <circle cx="108" cy="92" r="4" fill="#1d6fd1"/>
  <text x="102" y="86" font-size="11" text-anchor="end" fill="#1d6fd1">(−4, 1)</text>
  <circle cx="126" cy="146" r="4" fill="#1d6fd1"/>
  <text x="120" y="140" font-size="11" text-anchor="end" fill="#1d6fd1">(−3, −2)</text>
  <text x="176" y="123" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
</svg>
```

Quadrant I is where both numbers are positive. The numbering then goes round counterclockwise — the same direction that angles are measured in trigonometry.
:::

::: context ball-graph The ball's flight, drawn
Each point from the table sits on this curve, joined smoothly. The top is a little over $120\,\mathrm{m}$ just after $2\,\mathrm{s}$, and the ball lands at about $7\,\mathrm{s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#8fb8f0" stroke-width="0.6"><line x1="90" y1="170" x2="90" y2="20"/><line x1="130" y1="170" x2="130" y2="20"/><line x1="170" y1="170" x2="170" y2="20"/><line x1="210" y1="170" x2="210" y2="20"/><line x1="250" y1="170" x2="250" y2="20"/><line x1="290" y1="170" x2="290" y2="20"/><line x1="330" y1="170" x2="330" y2="20"/><line x1="50" y1="140" x2="330" y2="140"/><line x1="50" y1="110" x2="330" y2="110"/><line x1="50" y1="80" x2="330" y2="80"/><line x1="50" y1="50" x2="330" y2="50"/><line x1="50" y1="20" x2="330" y2="20"/></g>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="50.0,50.0 54.0,47.7 58.0,45.4 62.0,43.3 66.0,41.3 70.0,39.5 74.0,37.7 78.0,36.1 82.0,34.6 86.0,33.2 90.0,31.9 94.0,30.7 98.0,29.7 102.0,28.7 106.0,27.9 110.0,27.2 114.0,26.7 118.0,26.2 122.0,25.9 126.0,25.6 130.0,25.5 134.0,25.5 138.0,25.7 142.0,25.9 146.0,26.3 150.0,26.8 154.0,27.4 158.0,28.1 162.0,28.9 166.0,29.9 170.0,31.0 174.0,32.1 178.0,33.4 182.0,34.9 186.0,36.4 190.0,38.1 194.0,39.9 198.0,41.7 202.0,43.8 206.0,45.9 210.0,48.1 214.0,50.5 218.0,53.0 222.0,55.6 226.0,58.3 230.0,61.1 234.0,64.1 238.0,67.2 242.0,70.4 246.0,73.7 250.0,77.1 254.0,80.6 258.0,84.3 262.0,88.1 266.0,92.0 270.0,96.0 274.0,100.1 278.0,104.4 282.0,108.7 286.0,113.2 290.0,117.8 294.0,122.5 298.0,127.4 302.0,132.3 306.0,137.4 310.0,142.6 314.0,147.9 318.0,153.3 322.0,158.9 326.0,164.5 329.8,170.0"/>
  <text x="50" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="90" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">1</text>
  <text x="130" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">2</text>
  <text x="170" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">3</text>
  <text x="210" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">4</text>
  <text x="250" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">5</text>
  <text x="290" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">6</text>
  <text x="330" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">7</text>
  <text x="44" y="174" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="44" y="114" font-size="11" text-anchor="end" fill="#1f2a44">50</text>
  <text x="44" y="54" font-size="11" text-anchor="end" fill="#1f2a44">100</text>
  <circle cx="131.6" cy="25.5" r="4" fill="#b4232c"/>
  <text x="139.6" y="21.5" font-size="11" fill="#b4232c">top: about 120 m at 2 s</text>
  <text x="330" y="196" font-size="11" text-anchor="end" fill="#1f2a44">time t (s)</text>
  <text x="56" y="14" font-size="11" fill="#1f2a44">height h (m)</text>
</svg>
```

The hump is symmetric around its top, but the graph does not stop at about $4\,\mathrm{s}$, when the ball is back at $100\,\mathrm{m}$. The ball started on a tower, so it keeps falling past its starting height, all the way to the ground.
:::

::: context interpolating Reading between the points
A table only gives values at some moments. **Interpolating** means estimating a value between two of them, by assuming the quantity changes smoothly in between. If a ball is at $101.6\,\mathrm{m}$ at $4\,\mathrm{s}$ and $77.4\,\mathrm{m}$ at $5\,\mathrm{s}$, at $4.5\,\mathrm{s}$ it is somewhere around $90\,\mathrm{m}$.

Flight computers do this constantly. Air density, engine performance and steering plans are stored as tables, and the computer interpolates between the stored rows many times a second. Guessing *beyond* the last row is called **extrapolating**, and it is far riskier — the table cannot warn you if things change.
:::

::: context slope-triangle Rise over run, on the graph
The speed line $v = 100 + 4t$ starts at $100\,\mathrm{m/s}$ and climbs. Between $t = 10$ and $t = 20$ it runs $10\,\mathrm{s}$ across and rises $40\,\mathrm{m/s}$, so the slope is $40 \div 10 = 4\,\mathrm{m/s^2}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="320" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="120" x2="290" y2="48" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="50" cy="120" r="4" fill="#1f2a44"/>
  <text x="50" y="194" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <circle cx="130" cy="96" r="4" fill="#1f2a44"/>
  <text x="130" y="194" font-size="11" text-anchor="middle" fill="#1f2a44">10</text>
  <circle cx="210" cy="72" r="4" fill="#1f2a44"/>
  <text x="210" y="194" font-size="11" text-anchor="middle" fill="#1f2a44">20</text>
  <circle cx="290" cy="48" r="4" fill="#1f2a44"/>
  <text x="290" y="194" font-size="11" text-anchor="middle" fill="#1f2a44">30</text>
  <line x1="130" y1="96" x2="210" y2="96" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="210" y1="96" x2="210" y2="72" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="170.0" y="112" font-size="11" text-anchor="middle" fill="#b4232c">run 10 s</text>
  <text x="216" y="88" font-size="11" fill="#b4232c">rise 40 m/s</text>
  <text x="44" y="184" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="44" y="124" font-size="11" text-anchor="end" fill="#1f2a44">100</text>
  <text x="44" y="64" font-size="11" text-anchor="end" fill="#1f2a44">200</text>
  <text x="320" y="170" font-size="11" text-anchor="end" fill="#1f2a44">time t (s)</text>
  <text x="56" y="24" font-size="11" fill="#1f2a44">speed v (m/s)</text>
  <text x="56" y="112" font-size="11" fill="#1d6fd1">starts at 100</text>
</svg>
```

Draw the triangle anywhere on the line, big or small, and the rise divided by the run comes out the same.
:::

::: context slope-meaning Slope is a rate
Slope always means "how much of the up-the-side quantity, per one of the along-the-bottom quantity". On a distance–time graph that is metres per second: speed. On a speed–time graph it is metres per second, per second: acceleration, $\mathrm{m/s^2}$. On a propellant-mass graph it is kilograms per second: burn rate.

Calculus, later in the course, is largely the study of slope when the graph is curved rather than straight — finding the slope at a single instant. It is how a navigation computer turns a list of positions into a speed.
:::

::: context hop-graph The hop, drawn
Climb, hover, descend: three straight pieces. The steepness of the first and last pieces is the vertical speed, $5\,\mathrm{m/s}$ up and then down; the flat top is the hover.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="3" points="50.0,170 140.0,50 230.0,50 320.0,170"/>
  <text x="50.0" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="140.0" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">20</text>
  <text x="230.0" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">40</text>
  <text x="320.0" y="184" font-size="11" text-anchor="middle" fill="#1f2a44">60</text>
  <text x="44" y="174" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="44" y="114" font-size="11" text-anchor="end" fill="#1f2a44">50</text>
  <text x="44" y="54" font-size="11" text-anchor="end" fill="#1f2a44">100</text>
  <text x="86.0" y="104" font-size="11" text-anchor="end" fill="#1f2a44">climb</text>
  <text x="185.0" y="42" font-size="11" text-anchor="middle" fill="#1f2a44">hover</text>
  <text x="284.0" y="104" font-size="11" fill="#1f2a44">descend</text>
  <text x="340" y="196" font-size="11" text-anchor="end" fill="#1f2a44">time (s)</text>
  <text x="56" y="24" font-size="11" fill="#1f2a44">altitude (m)</text>
</svg>
```

Real landing tests are messier — the line wobbles as the engine and the steering work against wind — but engineers read them in exactly this way.
:::
