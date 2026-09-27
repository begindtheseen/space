---
id: l08-lookup-tables
title: Lookup tables for aerodynamic and engine data
minutes: 17
covers:
  - Lookup Table (n-D) for aerodynamic and engine data
---

Think of the mileage chart printed in an old road atlas. Find your starting city along the side, your destination along the top, and read the distance where the row and the column meet. Nobody wrote a formula for the distance from Denver to Omaha. Somebody measured it and put it in a grid.

A lot of what a rocket model needs looks like that chart. How hard the air pushes sideways on the vehicle depends on how fast it is going and how steeply it meets the air, and the best source for that is not a formula but a grid of numbers measured in a **[[wind tunnel|aero-database]]** or computed by a flow solver. An engine's thrust at each altitude comes from a test stand and a table. In the last lesson, the nonlinear blocks each had a one-line rule. Real vehicle data has no such rule, so Simulink reads it from a table.

The block that does this is the **n-D Lookup Table**, where "n-D" means "any number of dimensions": one input (a row of numbers), two inputs (a grid like the mileage chart), or more. This lesson shows how to fill it in, what it does between the numbers you gave it, and — the part that bites real teams — what it does beyond them.

## Breakpoints and table data

A lookup table has two kinds of numbers.

- **Breakpoints** are the input values where you have data. They are the city names down the side and across the top of the chart. Each input has its own list: **Breakpoints 1** for the first input, **Breakpoints 2** for the second, and so on. Each list must increase: every breakpoint larger than the one before it.
- **Table data** is the output value at each combination of breakpoints: the distances in the grid.

The n-D Lookup Table block lives in the **Lookup Tables** sub-library, next to the 1-D Lookup Table and 2-D Lookup Table blocks, which are the same block set up for one and two inputs. Its main parameters are **Number of table dimensions**, **Table data**, and one **Breakpoints** field per dimension. You can type the numbers in, or better, type the names of MATLAB variables that hold them.

For a two-input table the sizes must line up: the table has one **row** per entry of Breakpoints 1 and one **column** per entry of Breakpoints 2. The block's first input picks the position along the rows, and its second input picks the position along the columns.

::: key
A 2-D table with breakpoints `bp1` (length $m$) and `bp2` (length $n$) needs table data of size $m \times n$. Rows follow the first input; columns follow the second.
:::

Here is a small table of the **normal-force coefficient** $C_N$ ("C sub N") — a number with no units that says how hard the air pushes sideways on the body — against **[[Mach number|mach-and-alpha]]** $M$ and **angle of attack** $\alpha$ ("alpha", the angle between the vehicle's nose and the oncoming air, in degrees). The numbers are made up but have a realistic shape: $C_N$ grows with $\alpha$ and peaks near Mach 1.2.

| $M$ \ $\alpha$ | 0° | 4° | 8° | 12° | 16° |
|---|---|---|---|---|---|
| 0.5 | 0 | 0.30 | 0.64 | 1.02 | 1.44 |
| 0.9 | 0 | 0.34 | 0.72 | 1.14 | 1.60 |
| 1.2 | 0 | 0.40 | 0.84 | 1.32 | 1.84 |
| 2.0 | 0 | 0.33 | 0.70 | 1.11 | 1.56 |
| 3.0 | 0 | 0.28 | 0.60 | 0.96 | 1.36 |

In MATLAB you would store it like this, and then type `M`, `alpha` and `CN` into the block's Breakpoints 1, Breakpoints 2 and Table data fields:

```matlab
M     = [0.5 0.9 1.2 2.0 3.0];   % Breakpoints 1 (rows): Mach
alpha = [0 4 8 12 16];           % Breakpoints 2 (columns): deg
CN = [0 0.30 0.64 1.02 1.44
      0 0.34 0.72 1.14 1.60
      0 0.40 0.84 1.32 1.84
      0 0.33 0.70 1.11 1.56
      0 0.28 0.60 0.96 1.36];    % 5 x 5: one row per Mach, one column per alpha
```

## Between the breakpoints: interpolation

The vehicle will rarely sit exactly at Mach 0.9 and 4°. Most of the time the inputs fall between breakpoints, and the block must guess. That guess is **interpolation**: estimating a value between known points. How it guesses is the block's **Interpolation method**. The main choices are:

- **Flat**: use the value at the breakpoint at or below the input. The output is a staircase.
- **Nearest**: use the value at the closest breakpoint. Also a staircase, with the steps shifted.
- **Linear** (shown as *Linear point-slope* in recent releases): draw a straight line between neighbors. In two dimensions this is **[[bilinear interpolation|bilinear]]**: straight lines along one input, then along the other.
- **Cubic spline**: a smooth curve through the points, with no corners at the breakpoints.

Linear is the default and the workhorse. It never overshoots the data between two breakpoints, it is cheap, and it matches what almost every aerodynamic database assumes. Its one flaw is a corner at each breakpoint, where the slope changes suddenly.

::: example Reading C_N at Mach 1.0 and 5 degrees
Use the table above with linear interpolation. The input $M = 1.0$ sits between the rows for $0.9$ and $1.2$. The input $\alpha = 5°$ sits between the columns for $4°$ and $8°$. So only four numbers matter: $0.34$ and $0.72$ in the Mach 0.9 row, and $0.40$ and $0.84$ in the Mach 1.2 row.

**Step 1: how far along each input.** Along $\alpha$: $(5 - 4)/(8 - 4) = 0.25$ of the way. Along Mach: $(1.0 - 0.9)/(1.2 - 0.9) = 1/3$ of the way.

**Step 2: interpolate along $\alpha$ in each row.** Mach 0.9 row: $0.34 + 0.25 \times (0.72 - 0.34) = 0.34 + 0.095 = 0.435$. Mach 1.2 row: $0.40 + 0.25 \times (0.84 - 0.40) = 0.40 + 0.11 = 0.51$.

**Step 3: interpolate along Mach between those two.** $0.435 + \tfrac{1}{3} \times (0.51 - 0.435) = 0.435 + 0.025 = 0.46$.

**Step 4: turn it into a force.** The normal force is $N = q\,S\,C_N$, where $q$ is the **dynamic pressure** (how hard the oncoming air hits, in pascals) and $S$ is a reference area. With $q = 30\,\mathrm{kPa}$ and a 3.66 m diameter body, $S = \pi \times 1.83^2 \approx 10.5\,\mathrm{m^2}$, so $N \approx 30{,}000 \times 10.5 \times 0.46 \approx 145\,\mathrm{kN}$.

**Sanity check.** $0.46$ lies between the four corner values, $0.34$ and $0.84$, and closer to the low corner, because the point is nearer $4°$ and nearer Mach 0.9. With Flat or Nearest the block would return $0.34$ here, 26% low. A python `RegularGridInterpolator` and Octave's `interpn` both give $0.46$.
:::

## Beyond the edges: extrapolation and clipping

Now the question that matters most. What does the block output when an input is *outside* the breakpoints, say $\alpha = 20°$ in a table that stops at $16°$? It has no data there. Whatever it outputs is an invention, and you choose which invention with the **Extrapolation method**:

- **Clip**: hold the value at the last breakpoint. For $\alpha = 20°$ the block acts as if $\alpha = 16°$. This is **clipping**, the same idea as a Saturation block on the input.
- **Linear**: continue the straight line through the last two breakpoints, forever.
- **Cubic spline**: continue the spline's end curve.

In a new block, extrapolation is **Linear**. That default is convenient for smooth data and dangerous at the edge of a flight **[[envelope|envelope]]**, where the real physics often changes: past about $15°$–$20°$ angle of attack a wing or fin can stall and lose lift, not gain it. Linear extrapolation says the force keeps growing at the same slope. Clip says it stops growing. Neither is backed by data. That is why the table's edge is a design decision.

A third option does not invent anything: the block's **Diagnostic for out-of-range input** can be set to None, Warning or Error, so that leaving the table is reported instead of silently extrapolated. Many teams turn on a warning in simulation to learn whether the vehicle ever gets there.

::: key
What is a Lookup Table (n-D) used for in aerospace models? Aerodynamic coefficients and engine data as functions of Mach, angle of attack and control deflection. Interpolation method and extrapolation behaviour at the table edges are design decisions with real consequences at the envelope boundary.
:::

For the $C_N$ table at Mach 1.0 and $\alpha = 20°$: linear extrapolation continues each row's last slope, giving $2.06$ at Mach 0.9 and $2.36$ at Mach 1.2, so $2.16$ after interpolating along Mach. Clip holds $\alpha$ at $16°$ and gives $1.68$. The two answers differ by 29%, and the table itself cannot tell you which is closer to the truth.

::: example Engine thrust against altitude, and a thrust that cannot exist
A rocket engine pushes harder in vacuum than at sea level, because the outside air pressure $p_a$ pushes back on its nozzle exit. A good model is $F = F_{\text{vac}} - p_a A_e$, where $F_{\text{vac}}$ is the vacuum thrust and $A_e$ the **[[nozzle exit area|nozzle-exit]]**. Take $F_{\text{vac}} = 900\,\mathrm{kN}$ and $A_e = 0.9\,\mathrm{m^2}$, and use pressures from the **[[standard atmosphere|standard-atmosphere]]**. A 1-D table built every 5 km up to 20 km:

| Altitude (km) | 0 | 5 | 10 | 15 | 20 |
|---|---|---|---|---|---|
| $p_a$ (kPa) | 101.3 | 54.0 | 26.4 | 12.0 | 5.47 |
| $F$ (kN) | 808.8 | 851.4 | 876.2 | 889.2 | 895.1 |

**Step 1: inside the table, at 7 km.** Linear interpolation: 7 km is $2/5 = 0.4$ of the way from 5 km to 10 km, so $F = 851.4 + 0.4 \times (876.2 - 851.4) = 851.4 + 9.9 = 861.3\,\mathrm{kN}$. The true pressure at 7 km is $41.1\,\mathrm{kPa}$, which gives $900 - 0.9 \times 41.1 = 863.0\,\mathrm{kN}$. The table is off by $1.7\,\mathrm{kN}$, about 0.2%, because pressure falls along a curve, not a straight line.

**Step 2: outside the table, at 40 km, with Linear extrapolation.** The slope between the last two breakpoints is $(895.1 - 889.2)/5 \approx 1.18\,\mathrm{kN}$ per km. Twenty more kilometers of that adds about $23.6\,\mathrm{kN}$, giving $F \approx 918.7\,\mathrm{kN}$.

**Step 3: the same point with Clip.** The block holds the 20 km value: $895.1\,\mathrm{kN}$. The truth, from the formula, is $899.8\,\mathrm{kN}$.

**Sanity check.** No engine can beat its own vacuum thrust, so $918.7\,\mathrm{kN}$ is impossible: linear extrapolation invented about 19 kN that does not exist. Clip is 4.7 kN low, which is the honest error of a table that stops too early. The real fix is a breakpoint at a high altitude (say 80 km, where $F$ is essentially $900\,\mathrm{kN}$), so the vehicle never leaves the table.
:::

::: warning Extend the table, do not trust the edge
Before you pick an extrapolation method, find out whether the vehicle can reach the edge at all. Log the table's inputs, or set the out-of-range diagnostic to Warning, and run the worst trajectories you have. If it gets there, the fix is more data at the edge, with breakpoints that cover the whole envelope, not a cleverer extrapolation.
:::

## Checking a table against MATLAB

The first habit from lesson 4 applies here too: compute an answer you trust outside Simulink and compare. MATLAB's `interpn` uses the same layout as the block, with the first grid vector running down the rows. Its cousin `interp2` does not, and that difference catches people:

```matlab
interpn(M, alpha, CN, 1.0, 5)    % 0.4600  rows follow the first input, like the block
interp2(alpha, M, CN, 5, 1.0)    % 0.4600  interp2 wants the column variable first
interp2(M, alpha, CN, 1.0, 5)    % 0.4867  wrong: rows and columns swapped
```

The last call does not raise an error, because this table happens to be square: both grids have five entries, so MATLAB cannot tell they are swapped. It returns a plausible number that is 6% off.

::: warning MATLAB's own interpolators do not clip or extrapolate by default
`interp1(h, F, 40)` with the thrust table above returns `NaN`, because MATLAB's `interp1` gives `NaN` outside the data unless you ask otherwise. `interp1(h, F, 40, 'linear', 'extrap')` returns `918.7`, matching the block's Linear extrapolation. When a script and a model disagree only at the edges, the two tools are probably set to handle the edge differently.
:::

## A few settings worth knowing

**Evenly spaced breakpoints** let the block find the right cell with one division instead of a search. The **Breakpoints specification** parameter can be set to Even spacing, where you give a first point and a spacing. For flight code on a small processor this can matter.

**More dimensions** work the same way. A real aerodynamic database may give a coefficient against Mach, angle of attack, sideslip angle and fin deflection: a 4-D table. Each extra dimension multiplies the number of table entries, and the linear method blends $2^n$ corners, 16 of them for four inputs.

**One table per coefficient** is the usual layout: $C_N$, $C_A$ (axial force), $C_m$ (pitching moment) and so on, each in its own block, all sharing the same Mach and $\alpha$ breakpoints. When many tables share breakpoints, the **[[Prelookup|prelookup]]** block can find the cell once and feed several Interpolation Using Prelookup blocks.

**Testing a table** is its own job. Each cell of a table is a small piece of behavior, and a later module shows how a coverage tool reports which cells and edges your tests actually reached: **[[lookup-table coverage|table-coverage]]**.

## Check yourself

::: check
A table has Breakpoints 1 with 7 entries (Mach) and Breakpoints 2 with 11 entries (angle of attack). What size must Table data be, and which block input should carry Mach?
:::

::: answer
It must be $7 \times 11$: one row per Mach breakpoint and one column per angle-of-attack breakpoint. Mach goes to the first input, because the first input moves along the rows, which belong to Breakpoints 1.
:::

::: check
Using the $C_N$ table, find $C_N$ at Mach 2.5 and $\alpha = 10°$ with linear interpolation.
:::

::: answer
Mach 2.5 is halfway between 2.0 and 3.0; $\alpha = 10°$ is halfway between 8° and 12°. Mach 2.0 row: $0.70 + 0.5 \times (1.11 - 0.70) = 0.905$. Mach 3.0 row: $0.60 + 0.5 \times (0.96 - 0.60) = 0.78$. Halfway between: $0.905 + 0.5 \times (0.78 - 0.905) = 0.8425$, about $0.84$. It sits between the corner values $0.60$ and $1.11$, as it should.
:::

::: check
In the thrust table, what does the block output at an altitude of $-1$ km (no real flight is there, but a bug upstream could send it) with Clip, and with Linear extrapolation?
:::

::: answer
Clip holds the 0 km value: $808.8\,\mathrm{kN}$. Linear continues the slope from 0 to 5 km, which is $(851.4 - 808.8)/5 = 8.52\,\mathrm{kN}$ per km, backwards by 1 km: $808.8 - 8.52 = 800.3\,\mathrm{kN}$. Either way, a negative altitude reaching the table is worth an out-of-range warning, because it means something upstream is wrong.
:::

::: check
Why might a team choose Clip for an aerodynamic table's angle-of-attack edge even though it is also wrong?
:::

::: answer
Clip cannot run away. It keeps the output inside the range of measured values, so a controller or a simulation cannot be handed a force far larger than anything in the data. Linear extrapolation can grow without limit and, near stall, grows in the wrong direction. Clip's error is bounded by how much the true value changes past the edge; linear's is not bounded at all. The real answer is still to extend the data.
:::

::: check
Someone checks a lookup table block with `interp2(M, alpha, CN, Mq, aq)` and finds the model is "a few percent off". What would you check first?
:::

::: answer
The argument order. `interp2` takes the column grid first and the row grid second, so with Mach on the rows the correct call is `interp2(alpha, M, CN, aq, Mq)`, or `interpn(M, alpha, CN, Mq, aq)`, which uses the block's own layout. With a square table the swapped call runs without an error and gives a plausible but wrong answer, exactly like a few percent disagreement.
:::

## Summary

| Idea | Meaning | Fact to keep |
|---|---|---|
| Breakpoints | Input values where data exists | One list per input, each increasing |
| Table data | Output at each breakpoint combination | Size $m \times n$; rows follow input 1 |
| Interpolation method | How it fills between breakpoints | Flat, Nearest, Linear (default), Cubic spline |
| Extrapolation method | What it does past the edge | Clip, Linear (default), Cubic spline |
| Clipping | Holding the edge value | Bounded error, never runs away |
| Out-of-range diagnostic | Reports leaving the table | None, Warning or Error |
| Thrust with altitude | $F = F_{\text{vac}} - p_a A_e$ | Never exceeds $F_{\text{vac}}$ |
| Checking in MATLAB | `interpn` matches the block layout | `interp2` takes columns first; `interp1` gives `NaN` outside |

Tables cover data. Some logic is easier to write as a few lines of code than as a diagram. The next lesson puts MATLAB code inside a model with the MATLAB Function block, and explains why the language it accepts is a careful subset of MATLAB.

::: context aero-database Where the numbers come from
A launch vehicle's aerodynamic database starts with quick estimates from semi-empirical tools such as Missile DATCOM, a program developed for the US Air Force in the 1980s to predict missile aerodynamics from geometry. Computational fluid dynamics refines it, and wind-tunnel tests of a scale model confirm it. The result is thousands of numbers, organized by Mach, angle of attack and other inputs, delivered to the GNC team as tables. The team rarely touches the numbers; it owns how the model reads them.
:::

::: context mach-and-alpha The two inputs almost every aero table has
**Mach number** is speed divided by the local speed of sound: Mach 1 is about 340 m/s at sea level and about 295 m/s high in the stratosphere. **Angle of attack** is the angle between the vehicle's long axis and the direction the air is coming from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <g transform="rotate(-15 225 81)">
    <rect x="145" y="71" width="140" height="20" rx="4" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
    <polygon points="285,71 315,81 285,91" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  </g>
  <line x1="80" y1="120" x2="331" y2="53" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="5 3"/>
  <line x1="80" y1="120" x2="330" y2="120" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 3"/>
  <path d="M140,120 A60,60 0 0 0 138,104.5" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="148" y="117" font-size="13" fill="#1f2a44">α</text>
  <line x1="120" y1="142" x2="320" y2="142" stroke="#b4232c" stroke-width="2"/>
  <polygon points="112,142 122,137 122,147" fill="#b4232c"/>
  <text x="220" y="156" font-size="11" fill="#b4232c">oncoming air</text>
  <text x="236" y="40" font-size="11" fill="#1f2a44">vehicle axis</text>
</svg>
```

A launch vehicle flies at small $\alpha$ on purpose, because the side force grows with it.
:::

::: context bilinear Four corners and a point inside
Bilinear interpolation looks at the grid cell the input falls in. It blends the four corner values, each weighted by how close the point is to the opposite corner. The two-step recipe in the example (along one input, then the other) gives exactly the same answer in either order.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="30" width="160" height="120" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="100" cy="30" r="4" fill="#1d6fd1"/>
  <circle cx="260" cy="30" r="4" fill="#1d6fd1"/>
  <circle cx="100" cy="150" r="4" fill="#1d6fd1"/>
  <circle cx="260" cy="150" r="4" fill="#1d6fd1"/>
  <text x="60" y="34" font-size="11" fill="#1f2a44">0.34</text>
  <text x="266" y="34" font-size="11" fill="#1f2a44">0.72</text>
  <text x="60" y="154" font-size="11" fill="#1f2a44">0.40</text>
  <text x="266" y="154" font-size="11" fill="#1f2a44">0.84</text>
  <circle cx="140" cy="70" r="5" fill="#b4232c"/>
  <text x="148" y="66" font-size="11" fill="#b4232c">0.46</text>
  <text x="180" y="20" font-size="11" fill="#6c7a93" text-anchor="middle">Mach 0.9: 4° to 8°</text>
  <text x="180" y="166" font-size="11" fill="#6c7a93" text-anchor="middle">Mach 1.2</text>
</svg>
```

The red point is a quarter of the way across and a third of the way down, like $\alpha = 5°$ and Mach 1.0.
:::

::: context envelope The edge of where the vehicle may fly
The **flight envelope** is the set of conditions the vehicle is designed and certified to fly in: ranges of Mach, angle of attack, dynamic pressure, altitude. Tables are usually built to cover the envelope with some margin. A simulation that leaves the table has often also left the envelope, which is worth knowing for its own sake. Monte Carlo runs, covered later in the course, are the usual way teams find those corners.
:::

::: context nozzle-exit Why thrust grows with altitude
Thrust has two parts: the momentum of the exhaust, and the pressure difference across the nozzle's exit plane, $(p_e - p_a) A_e$. The outside pressure $p_a$ pushes back on the whole exit area. At sea level that is $101{,}325\,\mathrm{Pa}$ on every square meter; in vacuum it is zero. So the same engine gains thrust as it climbs, often by 10% or more between the pad and vacuum. The rocket-propulsion module derives this from a control volume around the engine.
:::

::: context standard-atmosphere One agreed-upon sky
The US Standard Atmosphere 1976 is a model of how temperature, pressure and density vary with altitude, agreed on so that everyone's calculations start from the same sky. It gives $101{,}325\,\mathrm{Pa}$ at sea level, about $26.4\,\mathrm{kPa}$ at 10 km and about $5.5\,\mathrm{kPa}$ at 20 km. The real atmosphere differs by season, latitude and weather, which is why launch teams also run with measured weather balloons on the day. MATLAB's Aerospace Toolbox provides `atmoscoesa` for this model.
:::

::: context prelookup Finding the cell once
With twenty coefficient tables that all use the same Mach and $\alpha$ breakpoints, twenty n-D Lookup Table blocks would each search the same breakpoints for the same cell. A Prelookup block does that search once and outputs the cell index and the fraction of the way across. Interpolation Using Prelookup blocks then take those and read each table. The result is the same; the work is done once. Large aerodynamic models and their generated flight code use this pattern.
:::

::: context table-coverage Did the tests visit every cell?
A lookup table hides behavior inside its data: each cell is a small piece of logic. Simulink Coverage can report **lookup-table coverage**, which counts how many cells and edge regions of each table a set of tests actually reached. A table whose extrapolation region no test ever touched is a gap. The verification module later in the Simulink sequence uses this measure.
:::
