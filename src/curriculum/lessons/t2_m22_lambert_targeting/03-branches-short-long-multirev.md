---
id: l03-branches-short-long-multirev
title: "Branches, honestly: short way, long way, and multiple revolutions"
minutes: 18
covers:
  - multi-revolution solutions and their multiplicity
---

Think of driving to a friend's house across town. You could take the direct road. You could take the ring road the other way around. And if you have the whole afternoon, you could circle the ring road once or twice before turning off. Every one of those routes starts at your door and ends at theirs. They differ in how far you go, how fast you must drive to arrive on time, and how much fuel you burn.

The last lesson solved one Lambert problem and proved the answer right. It is tempting to think that was *the* answer. It was not. The same two points and the same flight time allow several genuinely different orbits. The solver found one because it was told, without much fuss, which one to look for: the short way, no extra laps. Change either choice and $F(z) = 0$ has a different root, a different orbit, and — as the numbers below show — a very different cost.

This lesson asks the same solver different questions about the same two points. First: going the short way versus the long way, in the same time, what does each cost? Then: if the trip is slow enough to loop around the Earth an extra time or more, how many solutions are there, and is there a shortest possible trip for each number of loops? Everything comes from last lesson's $F(z)$. The only new thing is which part of its range you search.

## Short way versus long way

Keep last lesson's problem: $\mathbf{r}_1 = (5000,\ 10\,000,\ 2100)\,\mathrm{km}$, $\mathbf{r}_2=(-14\,600,\ 2500,\ 7000)\,\mathrm{km}$, $\Delta t=3600\,\mathrm{s}$.

Traveling **[[prograde|prograde-retrograde]]** — counterclockwise, seen from above — the spacecraft sweeps the short angle, $\Delta\nu = 100.293°$. That was last lesson's answer, $\mathbf{v}_1 = (-5.9925,\ 1.9254,\ 3.2456)\,\mathrm{km/s}$.

Traveling the opposite way around the *same* plane, the spacecraft must sweep the rest of the circle: $\Delta\nu' = 360° - 100.293° = 259.707°$. That is the long way. Nothing in the solver changes except $A$. Its formula now contains $\sin(259.707°)$, which is negative, so $A$ is negative.

To compare the two, you need a way to measure cost. The standard measure is **[[delta-v|delta-v]]**, written $\Delta v$: the total change of velocity the engines must provide, in km/s. Here, picture the spacecraft sitting on a **[[circular orbit|circular-reference]]** through $\mathbf{r}_1$ before the trip, and wanting to end on a circular orbit through $\mathbf{r}_2$. Each circle lies in the transfer's plane and turns the same way the transfer does. Then

$$
\Delta v = \lVert \mathbf{v}_1 - \mathbf{v}_{\text{circ},1}\rVert + \lVert \mathbf{v}_{\text{circ},2} - \mathbf{v}_2\rVert ,
$$

the size of the kick to leave the first circle, plus the size of the kick to join the second.

::: example The same two points, the other way around
**Step 1 — the new $A$.** With $\Delta\nu' = 259.707°$, the formula $A = \sin\Delta\nu\sqrt{r_1r_2/(1-\cos\Delta\nu)}$ gives $A = -12\,372.272\,\mathrm{km}$: the same size as before, opposite sign.

**Step 2 — solve.** The same $F(z) = 0$, with the same $\Delta t = 3600\,\mathrm{s}$, now has its root at $z = 4.1295$, giving
$$
\mathbf{v}_1 = (0.8886,\ -6.6353,\ -3.1117)\,\mathrm{km/s} .
$$

**Step 3 — prove it.** Flown forward $3600\,\mathrm{s}$, this $\mathbf{v}_1$ lands on $\mathbf{r}_2$ within about $1\times10^{-11}\,\mathrm{km}$ — the same tight closure as the short way. It is a genuine second solution, not a glitch.

**Step 4 — cost both.** The circular speeds are $\sqrt{\mu/r_1} = 5.919\,\mathrm{km/s}$ and $\sqrt{\mu/r_2} = 4.933\,\mathrm{km/s}$. Adding the two kicks for each transfer:
$$
\Delta v_{\text{short way}} = 1.204 + 2.147 = 3.351\,\mathrm{km/s}, \qquad \Delta v_{\text{long way}} = 6.237 + 5.302 = 11.538\,\mathrm{km/s} .
$$
For this one-hour trip, the long way costs about $3.4$ times as much.

**Sanity check.** Both orbits lie in the same plane — the one holding the Earth's center, $\mathbf{r}_1$ and $\mathbf{r}_2$ — but they circulate in opposite directions, so their angular momentum vectors point opposite ways. That is what you would expect from "the other way around".
:::

Why is the long way so expensive here? It has to swing the spacecraft through $260°$ instead of $100°$ in the same hour. More angle in the same time means a faster, more energetic orbit, and a velocity much further from the circular one you started on.

::: warning A valid answer can fly through the planet
Lambert's problem knows nothing about the Earth's surface. The one-hour long-way orbit above has $a = 25\,586\,\mathrm{km}$ and eccentricity $0.876$, so its closest point to the center, $a(1-e)$, is only $3167\,\mathrm{km}$ — and the transfer arc passes through it. The Earth's radius is $6378\,\mathrm{km}$. This "solution" [[crashes|long-way-crash]]. Always check the lowest point of a Lambert arc against the planet's radius (plus its atmosphere) before trusting it.
:::

A mission designer takes the long way only on purpose: when the short way is not available for the dates the mission needs, or for a geometric reason such as lighting at arrival.

::: warning "Short way" is about the angle, not about cost
It is tempting to assume the short way is always cheaper. It usually is for fast trips, but Lambert's theorem says the cost depends on $a$, $c$ and $s$ together, not on $\Delta\nu$ alone. Give the same two points $2\,\mathrm{h}$ instead of $1\,\mathrm{h}$, and the short way costs $4.61\,\mathrm{km/s}$ while the long way costs only $3.77\,\mathrm{km/s}$ — and this time the long-way arc stays above the surface, dipping to about $1090\,\mathrm{km}$ altitude. Compute both before assuming.
:::

## Multiple revolutions: where the extra solutions live

On an ellipse, $z = (\Delta E)^2$, where $\Delta E$ is the total change in **[[eccentric anomaly|anomaly-odometer]]** — an angle that keeps count as the spacecraft goes around. One full lap adds $2\pi$ to it. Nothing caps $\Delta E$ at $2\pi$. A trip that loops around once before reaching $\mathbf{r}_2$ has $\Delta E = 2\pi + \Delta E_{\text{part}}$, where $\Delta E_{\text{part}}$ is the part of a lap left over.

Here is the key point. Cosine and sine repeat every $2\pi$. So the *positions* — $f$, $g$, and therefore $y$ — cannot tell a trip with an extra lap from one without. Only the *time* can, because the extra lap takes time to fly. So the formulas from last lesson do not change at all. You only let $z$ run higher. For $N$ complete extra revolutions before arrival, search the range

$$
(2\pi N)^2 \;<\; z \;<\; \big(2\pi(N+1)\big)^2 .
$$

For $N = 1$ that is $39.48 < z < 157.91$.

### The shape of the curve changes

Inside the $N = 0$ range, last lesson showed that $\Delta t(z)$ only ever rises. That is why there was exactly one single-arc answer.

Inside an $N \ge 1$ range, the curve is a **[[valley|two-branch-curve]]**. At the lower edge the flight time is infinite: the orbit needed there is enormous, with a huge period. Moving up, the time falls, reaches a lowest point, and climbs again to infinity at the upper edge, for the same reason. A valley means that any flight time above its floor is hit *twice* — once on the way down, once on the way up. Two values of $z$, two different orbits, two different $\mathbf{v}_1$'s, for the identical $\mathbf{r}_1$, $\mathbf{r}_2$, $\Delta t$ and $N$. Below the floor, that $N$ has no solution at all.

The two solutions differ in size. One has the smaller semi-major axis, so it has the shorter period and the lower energy ($\varepsilon = -\mu/2a$ is more negative): the **short-period, low-energy** branch. The other has the larger semi-major axis, the longer period and the higher energy: the **long-period, high-energy** branch.

::: key Multi-revolution multiplicity
For each revolution count $N \ge 1$ there are generally two solutions — a short-period (low-energy) and a long-period (high-energy) branch — that merge into one at a minimum time of flight for that $N$; below that minimum, $N$ has no solution at all. Counting the single zero-revolution solution, up to $N$ revolutions gives $2N+1$ solutions in total, for one direction of travel.
:::

So a complete Lambert request is "revolution count $N$, direction of travel, and — for $N \ge 1$ — which branch". A solver that returns one answer without asking is choosing for you.

::: example The shortest trip for one, two and three extra laps
Keep the same points and the short-way angle, $\Delta\nu = 100.293°$, $A = 12\,372.272\,\mathrm{km}$. For each $N$, search its $z$ range for the bottom of the valley:

| $N$ | $z$ at the bottom | Minimum $\Delta t$ |
| --- | --- | --- |
| 1 | $70.803$ | $19\,665.76\,\mathrm{s}$ ($5.463\,\mathrm{h}$) |
| 2 | $219.438$ | $33\,546.89\,\mathrm{s}$ ($9.319\,\mathrm{h}$) |
| 3 | $447.114$ | $47\,275.71\,\mathrm{s}$ ($13.132\,\mathrm{h}$) |

**Why there has to be a floor.** Every ellipse through these two points has $a \ge a_{\min} = 12\,327\,\mathrm{km}$ (lesson 1). A bigger ellipse has a longer period, so no connecting ellipse has a period shorter than that of the minimum-energy one:
$$
T_{\min} = 2\pi\sqrt{\frac{a_{\min}^3}{\mu}} = 2\pi\sqrt{\frac{12\,327^3}{398\,600}} = 13\,621\,\mathrm{s} = 3.784\,\mathrm{h} .
$$
A trip with $N$ extra laps flies $N$ whole periods plus the leftover arc, so it takes more than $N \times 3.784\,\mathrm{h}$.

**Sanity check.** $5.463 > 3.784$, $9.319 > 7.568$, and $13.132 > 11.351$. Each floor clears its bound. Each extra lap adds about $3.8$ to $3.9\,\mathrm{h}$, a bit more than $T_{\min}$, as it should.
:::

::: example The two branches, made concrete
Ask for a one-lap transfer in $\Delta t = 25\,000\,\mathrm{s}$, comfortably above the $19\,665.76\,\mathrm{s}$ floor.

**Step 1 — split the search.** The valley's bottom is at $z = 70.803$. Search $39.48 < z < 70.803$ for one root and $70.803 < z < 157.91$ for the other. Each half has exactly one, because the curve only falls on the left side and only rises on the right.

**Step 2 — the two answers.**

| Branch | $z$ | $a$ (km) | Period | $\mathbf{v}_1$ (km/s) | Total $\Delta v$ |
| --- | --- | --- | --- | --- | --- |
| long-period (high-energy) | $60.061$ | $16\,472$ | $5.84\,\mathrm{h}$ | $(-5.508,\ 2.300,\ 3.203)$ | $2.426\,\mathrm{km/s}$ |
| short-period (low-energy) | $85.539$ | $13\,213$ | $4.20\,\mathrm{h}$ | $(-2.545,\ 4.900,\ 3.070)$ | $6.681\,\mathrm{km/s}$ |

**Step 3 — prove both.** Each $\mathbf{v}_1$, flown forward $25\,000\,\mathrm{s}$, lands on $\mathbf{r}_2$ within about $10^{-10}\,\mathrm{km}$. Both are genuine answers to one problem.

**Step 4 — compare.** The costs differ by a factor of $6.681 / 2.426 = 2.75$. Notice that the *low-energy* branch is the *expensive* one here. Energy measures the transfer orbit itself; $\Delta v$ measures how different it is from the circles you start and end on. The long-period orbit has eccentricity $0.311$, much rounder than the short-period one's $0.605$, so it is closer to those circles and cheaper to join.

**Sanity check — the ground.** The short-period orbit has lowest point $a(1-e) = 13\,213 \times 0.395 = 5220\,\mathrm{km}$, [[inside the Earth|branch-orbits]], and a full lap certainly passes it. So in practice only the long-period branch, whose lowest point is $11\,357\,\mathrm{km}$, can be flown.

**Compared with no laps.** The short-way single arc cost $3.351\,\mathrm{km/s}$ for a $3600\,\mathrm{s}$ trip. The one-lap long-period branch, with almost seven times as long, costs less: $2.426\,\mathrm{km/s}$. More time often buys a cheaper transfer — the reason extra-lap solutions are worth having for a mission that is not in a hurry.
:::

## Reading the branches

The practical lesson: "solve Lambert's problem" is not a complete instruction. It is shorthand for "solve it for revolution count $N$, this direction of travel, and — for $N \ge 1$ — this branch". A real targeting system either fixes those choices from the mission's needs or searches over them on purpose.

Different jobs need different subsets. A **[[porkchop plot|porkchop-bridge]]** generator, a later lesson's subject, usually needs only the single-arc solutions, because it scans departure and arrival *dates* and lets the transfer angle itself slide past $180°$ as the dates change. A search for a **[[low-thrust|low-thrust]]** trajectory often wants every branch of every small $N$, because a many-lap, low-energy Lambert arc makes a good first guess for a slow spiral that an optimizer then refines. Hand the optimizer a guess on the wrong branch and it goes looking in the wrong part of the solution space entirely.

::: warning Two ellipses per size is a different fact
Lesson 1 showed that for a fixed *semi-major axis* above $a_{\min}$ there are generally two ellipses through $\mathbf{r}_1$ and $\mathbf{r}_2$. Do not confuse that with the two branches here. For $N = 0$, a fixed $a$ gives two orbits, but a fixed *flight time* still gives only one, because $\Delta t(z)$ only rises. The branch pair for $N \ge 1$ comes from the valley in $\Delta t(z)$ — two orbits for one flight time — not from the two-ellipses-per-size fact.
:::

## Check yourself

::: check
For the same $\mathbf{r}_1$, $\mathbf{r}_2$ and $\Delta t$, do the short-way and long-way transfers lie in the same orbital plane? Explain.
:::

::: answer
Yes. Any transfer between two fixed points lies in the plane through the focus, $\mathbf{r}_1$ and $\mathbf{r}_2$, and as long as those three are not on one line there is only one such plane. Short way and long way use different arcs of that plane and circulate in opposite directions — their angular momentum vectors point opposite ways — but the plane is the same.
:::

::: check
Explain why a one-lap Lambert transfer cannot be made arbitrarily fast, using the idea of a shortest possible period.
:::

::: answer
Every ellipse through the two points has $a \ge a_{\min} = s/2$. The period $2\pi\sqrt{a^3/\mu}$ grows with $a$, so no connecting ellipse has a period shorter than $T_{\min} = 2\pi\sqrt{a_{\min}^3/\mu}$. A one-lap transfer flies one whole period plus a leftover arc, so it always takes more than $T_{\min}$, however much energy you spend. The true floor — the bottom of the $N=1$ valley in $\Delta t(z)$ — sits somewhat above that bound: $5.463\,\mathrm{h}$ against $T_{\min} = 3.784\,\mathrm{h}$ in this lesson's example.
:::

::: check
A certain $\mathbf{r}_1$, $\mathbf{r}_2$ and $\Delta t$ allow a two-lap transfer (and $\Delta t$ is above the floors for $N = 1$ and $N = 2$). For one fixed direction of travel, how many Lambert solutions are there in total, counting every $N$ from $0$ to $2$ and every branch?
:::

::: answer
One single-arc solution, two branches for $N = 1$, and two branches for $N = 2$: $1 + 2 + 2 = 5$. That matches $2N + 1$ with $N = 2$. The other direction of travel has its own set, so considering both directions can double the count.
:::

::: check
In the two-branch example, both $N=1$ answers landed on $\mathbf{r}_2$ within about $10^{-10}\,\mathrm{km}$. What would it mean if the long-period branch closed that well but the short-period branch missed by $50\,\mathrm{km}$?
:::

::: answer
The short-period root was not really found. Most likely its search used the wrong range — for instance the whole $N=1$ range instead of only the part to the right of the valley's bottom, so the bracket held two roots or none — or it stopped early with a loose tolerance. A correctly found root on either branch satisfies the same equation $F(z) = 0$ to the same precision, so it closes as tightly as the other.
:::

::: check
The table of shortest trips showed the floor rising with $N$: $5.463$, $9.319$, $13.132\,\mathrm{h}$. Why does each extra lap push the floor up, and by roughly how much?
:::

::: answer
Each extra lap means flying one more whole period on top of everything else. No connecting ellipse has a period shorter than $T_{\min} = 3.784\,\mathrm{h}$, the period of the minimum-energy ellipse. So each added lap adds at least about that much time. In the table the steps are $9.319 - 5.463 = 3.856\,\mathrm{h}$ and $13.132 - 9.319 = 3.813\,\mathrm{h}$ — a little more than $T_{\min}$, because the fastest orbits for each $N$ are slightly larger than the minimum-energy ellipse.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Short way / long way | $\Delta\nu$ below $180°$, or $360°-\Delta\nu$; same plane, opposite directions; $A$ changes sign |
| $\Delta v$ | Total velocity change the engines supply; the usual measure of cost |
| $N$ | Whole extra laps before arrival; search $\big((2\pi N)^2,\ (2\pi(N+1))^2\big)$ in $z$ |
| $N=0$ | $\Delta t(z)$ only rises; one solution per direction |
| $N\ge1$ | $\Delta t(z)$ is a valley; two solutions (short-period low-energy, long-period high-energy) above the floor, none below |
| Floor for $N$ laps | More than $N\,T_{\min}$, with $T_{\min} = 2\pi\sqrt{a_{\min}^3/\mu}$ |
| $2N+1$ | Solutions with up to $N$ laps, for one direction |
| Always check | The arc's lowest point against the planet's radius; the math does not |

The next lesson pushes the transfer angle toward the one value every branch here assumed was harmless — $180°$ — and shows with numbers how badly the problem behaves there.

::: context prograde-retrograde Which way round
**Prograde** means orbiting in the same direction the Earth spins — counterclockwise when seen from above the North Pole. Almost every satellite goes this way, because launching eastward borrows up to about $0.46\,\mathrm{km/s}$ of free speed from the Earth's rotation. **Retrograde** is the opposite direction. In a Lambert solver the `prograde` flag picks the direction of travel, and with it whether $\Delta\nu$ is the short angle or the long one.
:::

::: context delta-v The currency of spaceflight
$\Delta v$ is how much the engines must change the spacecraft's velocity, added up over every burn. Engineers budget it the way a family budgets money, because the rocket equation turns it directly into propellant: the more $\Delta v$, the more of the vehicle's mass must be fuel. A few km/s is a lot. Reaching low Earth orbit from the ground takes about $9.4\,\mathrm{km/s}$ including losses; the long-way transfer above would need more than that again.
:::

::: context circular-reference Why compare with circles
A cost needs a starting point. Lambert tells you the velocity the transfer needs, but not the velocity you already have. Assuming circular orbits at both ends is the simplest honest choice, and many real departures and arrivals are close to circular. The circular speed at radius $r$ is $\sqrt{\mu/r}$: $5.919\,\mathrm{km/s}$ at $r_1$ and $4.933\,\mathrm{km/s}$ at $r_2$ here. A real mission would use the actual orbits it starts and ends on.
:::

::: context long-way-crash Both one-hour arcs, to scale
The short-way arc (blue) and the long-way arc (red, dashed) for the one-hour Curtis transfer, drawn to scale in their shared plane. The gray disc is the Earth, radius $6378\,\mathrm{km}$. The short way never comes closer than $11\,332\,\mathrm{km}$ to the center. The long way swings around the back and dips to $3167\,\mathrm{km}$ — deep inside the planet.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <circle cx="140" cy="120" r="47.8" fill="#6c7a93" fill-opacity="0.35" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="205.4,174.8 206.5,173.3 207.6,171.8 208.7,170.2 209.8,168.6 210.9,167.0 211.9,165.4 212.9,163.7 213.9,162.1 214.8,160.4 215.7,158.7 216.6,157.0 217.5,155.3 218.3,153.6 219.1,151.8 219.9,150.1 220.7,148.3 221.4,146.5 222.1,144.8 222.8,143.0 223.4,141.2 224.0,139.4 224.6,137.6 225.2,135.8 225.7,133.9 226.2,132.1 226.7,130.3 227.1,128.5 227.5,126.6 227.9,124.8 228.3,122.9 228.6,121.1 228.9,119.3 229.2,117.4 229.4,115.6 229.6,113.7 229.8,111.9 230.0,110.1 230.1,108.2 230.2,106.4 230.3,104.6 230.4,102.8 230.4,101.0 230.4,99.2 230.4,97.4 230.4,95.6 230.3,93.8 230.2,92.0 230.1,90.2 230.0,88.4 229.8,86.7 229.6,84.9 229.4,83.2 229.2,81.5 229.0,79.7 228.7,78.0 228.4,76.3 228.1,74.6 227.8,72.9 227.4,71.2 227.1,69.6 226.7,67.9 226.3,66.3 225.9,64.7 225.4,63.0 225.0,61.4 224.5,59.8 224.0,58.2 223.5,56.7 223.0,55.1 222.5,53.6 221.9,52.0 221.3,50.5 220.8,49.0 220.2,47.5 219.6,46.0 218.9,44.5 218.3,43.1 217.7,41.6 217.0,40.2 216.3,38.8 215.6,37.3 214.9,35.9 214.2,34.6 213.5,33.2 212.8,31.8 212.0,30.5 211.3,29.1 210.5,27.8 209.8,26.5 209.0,25.2 208.2,23.9 207.4,22.7 206.6,21.4 205.8,20.2 204.9,18.9 204.1,17.7 203.2,16.5 202.4,15.3 201.5,14.2 200.9,13.3"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3" points="205.4,174.8 203.4,174.7 201.3,174.5 199.3,174.3 197.2,174.0 195.1,173.8 193.0,173.5 190.8,173.2 188.6,172.8 186.4,172.5 184.2,172.1 181.9,171.6 179.6,171.1 177.3,170.6 174.9,170.0 172.5,169.4 170.1,168.8 167.6,168.0 165.1,167.3 162.5,166.4 160.0,165.5 157.3,164.5 154.7,163.4 152.0,162.2 149.3,160.9 146.5,159.4 143.8,157.9 141.0,156.1 138.2,154.3 135.5,152.2 132.7,149.9 130.0,147.4 127.4,144.7 125.0,141.7 122.7,138.4 120.6,134.9 118.8,131.2 117.4,127.3 116.3,123.3 115.7,119.2 115.3,115.2 115.4,111.2 115.7,107.3 116.3,103.5 117.1,99.9 118.0,96.5 119.2,93.2 120.4,90.1 121.7,87.1 123.1,84.2 124.6,81.4 126.1,78.8 127.7,76.3 129.3,73.9 130.9,71.6 132.5,69.4 134.1,67.2 135.7,65.1 137.4,63.2 139.0,61.2 140.7,59.4 142.3,57.6 144.0,55.8 145.6,54.1 147.3,52.5 148.9,50.9 150.5,49.3 152.2,47.8 153.8,46.3 155.4,44.9 157.0,43.5 158.6,42.2 160.2,40.8 161.7,39.5 163.3,38.3 164.9,37.0 166.4,35.8 168.0,34.6 169.5,33.5 171.0,32.4 172.6,31.3 174.1,30.2 175.6,29.1 177.1,28.1 178.5,27.1 180.0,26.1 181.5,25.1 183.0,24.1 184.4,23.2 185.9,22.2 187.3,21.3 188.7,20.4 190.1,19.6 191.6,18.7 193.0,17.9 194.4,17.0 195.7,16.2 197.1,15.4 198.5,14.6 199.9,13.8 200.9,13.3"/>
  <circle cx="140" cy="120" r="3" fill="#1f2a44"/>
  <circle cx="205.4" cy="174.8" r="4" fill="#1f2a44"/>
  <circle cx="200.9" cy="13.3" r="4" fill="#1f2a44"/>
  <text x="214" y="182" font-size="12" fill="#1f2a44">r₁</text>
  <text x="210" y="16" font-size="12" fill="#1f2a44">r₂</text>
  <text x="250" y="80" font-size="12" fill="#1d6fd1">short way</text>
  <text x="250" y="98" font-size="12" fill="#b4232c">long way</text>
  <text x="250" y="116" font-size="12" fill="#6c7a93">Earth</text>
</svg>
```
:::

::: context anomaly-odometer An angle that keeps counting
Think of a car's odometer rather than its compass. A compass reading goes back to north after a full circle; an odometer keeps adding up. Angles in orbit formulas are usually written like compass readings, but the eccentric anomaly change $\Delta E$ inside $z = (\Delta E)^2$ is an odometer. After one lap it reads $2\pi$, after two $4\pi$. That is why higher $z$ ranges hold the extra-lap solutions.
:::

::: context two-branch-curve One valley, two answers
Flight time against $z$ for the Curtis pair, short way. On the left, the single-arc curve rises once through $3600\,\mathrm{s}$. Past $z = 4\pi^2 \approx 39.5$ the one-lap curve is a valley with its floor at $19\,666\,\mathrm{s}$. The line at $25\,000\,\mathrm{s}$ crosses the valley twice: $z = 60.1$ (long-period) and $z = 85.5$ (short-period).

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="131.8" y1="170" x2="131.8" y2="20" stroke="#6c7a93" stroke-width="1" stroke-dasharray="2 3"/>
  <line x1="50" y1="76.25" x2="340" y2="76.25" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,159.6 51.6,158.1 53.3,156.4 54.9,154.6 56.6,152.7 58.2,150.7 59.8,148.4 61.5,146.0 63.1,143.3 64.7,140.3 66.4,137.0 68.0,133.4 69.7,129.4 71.3,124.8 72.9,119.8 74.6,114.1 76.2,107.7 77.8,100.4 79.5,92.1 81.1,82.7 82.8,71.9 84.4,59.4 86.0,45.0 87.7,28.2 88.5,20.0"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="162.6,20.2 163.9,30.1 165.1,38.7 166.4,46.1 167.6,52.6 168.9,58.3 170.1,63.3 171.4,67.6 172.6,71.5 173.9,74.9 175.1,77.9 176.4,80.5 177.6,82.9 178.9,85.0 180.1,86.8 181.4,88.4 182.6,89.8 183.9,91.1 185.1,92.1 186.4,93.1 187.6,93.8 188.9,94.5 190.1,95.0 191.4,95.5 192.6,95.8 193.9,96.0 195.1,96.2 196.4,96.3 197.6,96.2 198.9,96.1 200.1,96.0 201.4,95.7 202.6,95.4 203.9,95.0 205.1,94.6 206.4,94.1 207.6,93.5 208.9,92.8 210.1,92.1 211.4,91.4 212.6,90.6 213.9,89.7 215.1,88.7 216.4,87.7 217.6,86.7 218.9,85.5 220.1,84.3 221.4,83.1 222.6,81.7 223.9,80.3 225.1,78.9 226.4,77.3 227.6,75.7 228.9,74.0 230.1,72.2 231.4,70.4 232.6,68.5 233.9,66.4 235.1,64.3 236.4,62.2 237.6,59.9 238.9,57.5 240.1,55.0 241.4,52.4 242.6,49.7 243.9,46.8 245.1,43.9 246.4,40.8 247.6,37.6 248.9,34.3 250.1,30.8 251.4,27.1 252.6,23.3 253.6,20.0"/>
  <circle cx="174.4" cy="76.25" r="4.5" fill="#b4232c"/>
  <circle cx="227.2" cy="76.25" r="4.5" fill="#b4232c"/>
  <circle cx="196.7" cy="96.3" r="4" fill="#1f2a44"/>
  <text x="196.7" y="114" font-size="12" fill="#1f2a44" text-anchor="middle">floor 19 666 s</text>
  <text x="338" y="70" font-size="12" fill="#6c7a93" text-anchor="end">25 000 s</text>
  <text x="92" y="150" font-size="12" fill="#1d6fd1">N = 0</text>
  <text x="258" y="40" font-size="12" fill="#1d6fd1">N = 1</text>
  <text x="46" y="174" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="46" y="24" font-size="11" fill="#1f2a44" text-anchor="end">40k</text>
  <text x="50" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="132.9" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">40</text>
  <text x="215.7" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">80</text>
  <text x="298.6" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">120</text>
  <text x="195" y="201" font-size="12" fill="#1f2a44" text-anchor="middle">z</text>
  <text x="58" y="34" font-size="12" fill="#1f2a44">Δt (s)</text>
</svg>
```
:::

::: context branch-orbits The two one-lap orbits, to scale
Both one-lap orbits drawn to scale in their plane, with the Earth as the gray disc. Each leaves $\mathbf{r}_1$, loops once around, and arrives at $\mathbf{r}_2$ after $25\,000\,\mathrm{s}$. The long-period orbit (blue) stays well clear of the ground; the short-period one (red, dashed) cuts through the Earth.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <circle cx="190" cy="110" r="28.7" fill="#6c7a93" fill-opacity="0.35" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="229.2,142.9 233.9,136.9 237.9,130.5 241.2,123.8 243.6,116.8 245.3,109.7 246.2,102.7 246.4,95.7 246.0,88.9 245.0,82.3 243.4,76.0 241.4,70.0 238.9,64.3 236.1,59.0 232.9,54.0 229.5,49.4 225.8,45.2 221.9,41.3 217.9,37.8 213.7,34.6 209.4,31.8 205.0,29.3 200.6,27.2 196.1,25.4 191.6,23.9 187.1,22.7 182.6,21.8 178.1,21.2 173.6,20.8 169.2,20.8 164.9,21.0 160.7,21.5 156.5,22.2 152.4,23.2 148.4,24.3 144.6,25.8 140.8,27.4 137.2,29.3 133.7,31.3 130.3,33.6 127.1,36.0 124.1,38.7 121.2,41.5 118.5,44.4 116.0,47.6 113.6,50.9 111.5,54.3 109.5,57.9 107.8,61.7 106.2,65.5 104.9,69.5 103.9,73.6 103.0,77.8 102.5,82.0 102.1,86.4 102.1,90.8 102.3,95.3 102.8,99.9 103.6,104.4 104.7,109.0 106.1,113.6 107.8,118.2 109.9,122.7 112.3,127.2 115.1,131.7 118.2,136.0 121.7,140.1 125.6,144.2 129.8,148.0 134.4,151.5 139.5,154.8 144.8,157.8 150.6,160.3 156.7,162.5 163.1,164.1 169.7,165.2 176.6,165.6 183.7,165.4 190.9,164.4 198.0,162.7 205.0,160.2 211.8,156.9 218.2,152.8 224.1,148.0 229.5,142.6 234.2,136.6 238.1,130.1 241.3,123.4 243.7,116.4 245.4,109.3 246.3,102.3 246.4,95.3 246.0,88.5 244.9,82.0 243.3,75.7 241.3,69.7 238.8,64.0 235.9,58.7 232.7,53.8 229.3,49.2 226.5,46.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3" points="229.2,142.9 235.8,141.0 241.8,138.6 247.2,136.0 252.1,133.1 256.5,130.0 260.4,126.8 264.0,123.5 267.1,120.1 269.8,116.6 272.2,113.2 274.3,109.7 276.0,106.2 277.5,102.7 278.6,99.3 279.5,95.9 280.0,92.5 280.4,89.2 280.4,85.9 280.2,82.7 279.8,79.6 279.1,76.6 278.2,73.6 277.0,70.8 275.6,68.0 274.0,65.4 272.2,62.9 270.1,60.5 267.9,58.2 265.4,56.1 262.7,54.2 259.7,52.4 256.6,50.8 253.3,49.4 249.7,48.1 245.9,47.1 241.9,46.4 237.7,45.9 233.3,45.7 228.7,45.8 223.8,46.3 218.8,47.1 213.5,48.4 208.1,50.2 202.5,52.5 196.8,55.5 190.9,59.2 185.1,63.8 179.4,69.5 174.0,76.5 169.3,84.9 166.1,94.9 165.3,106.5 168.0,118.4 174.5,128.9 183.3,136.6 193.0,141.4 202.5,144.0 211.4,144.8 219.6,144.5 227.1,143.4 233.9,141.6 240.0,139.4 245.6,136.8 250.7,134.0 255.2,131.0 259.3,127.8 262.9,124.5 266.2,121.1 269.0,117.7 271.5,114.2 273.7,110.7 275.5,107.3 277.1,103.8 278.3,100.3 279.2,96.9 279.9,93.5 280.3,90.2 280.4,86.9 280.3,83.7 279.9,80.6 279.3,77.5 278.5,74.5 277.4,71.7 276.1,68.9 274.5,66.2 272.8,63.7 270.8,61.2 268.6,58.9 266.1,56.8 263.5,54.8 260.7,52.9 257.6,51.2 254.3,49.8 250.8,48.5 247.1,47.4 243.2,46.6 239.0,46.0 234.7,45.7 230.1,45.7 226.5,46.0"/>
  <circle cx="229.2" cy="142.9" r="4" fill="#1f2a44"/>
  <circle cx="226.5" cy="46.0" r="4" fill="#1f2a44"/>
  <text x="238" y="160" font-size="12" fill="#1f2a44">r₁</text>
  <text x="214" y="62" font-size="12" fill="#1f2a44">r₂</text>
  <text x="12" y="24" font-size="12" fill="#1d6fd1">long-period</text>
  <text x="12" y="42" font-size="12" fill="#b4232c">short-period</text>
  <text x="12" y="60" font-size="12" fill="#6c7a93">Earth</text>
</svg>
```
:::

::: context porkchop-bridge Where the branches show up next
Interplanetary designers name transfers by angle: **Type I** sweeps less than $180°$ around the Sun, **Type II** more. On a porkchop plot — a map of launch cost over departure and arrival dates — they appear as two separate islands of cheap trips, split by a ridge where the angle passes $180°$. Lessons 4 and 8 explain the ridge and build the plot.
:::

::: context low-thrust Engines that push gently for months
Electric engines, such as the ion engines on NASA's Dawn probe that visited Vesta and Ceres, push with about the weight of a sheet of paper but can keep going for years on little propellant. Their paths are slow spirals with many loops, not quick arcs. Designers often start the optimizer from a many-lap Lambert arc, because it already connects the right points in roughly the right time.
:::
