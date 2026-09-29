---
id: l04-cw-validity-and-tschauner-hempel
title: How good is CW? Validity limits and the eccentric-orbit break
minutes: 22
covers:
  - Tschauner-Hempel equations for eccentric reference orbits
---

A paper street map of your town is perfect for finding the library. Try to use the same flat map for a flight across the country and it goes wrong, because the Earth is round and the map pretends it is flat. The map was never "wrong". It had a range where the flat-Earth shortcut was excellent, and a range where it quietly stopped being true.

The Clohessy-Wiltshire (CW) equations are that kind of map. The last lesson checked that the state transition matrix $\boldsymbol\Phi(t)$ solves the CW equations exactly. That was a check of the arithmetic. It says nothing about how well the CW equations describe two *real* spacecraft. CW was built on two shortcuts: the separation is small compared with the orbit, and the reference orbit is a perfect circle. Each shortcut has a range where it is excellent and a range where it fails.

A GNC engineer who uses CW outside its range is not making a small error. She is using the wrong equation. Worse, the wrong answer comes out looking exactly as confident as a right one. This lesson measures the range directly. Then it breaks the shortcut that fails hardest — the circular orbit — and builds the equations that replace CW when it goes: the **Tschauner-Hempel equations**.

## The two shortcuts inside CW

Lesson 2 built CW in two moves. Keep them apart in your head, because they fail in different ways.

- **Small separation.** The pull of gravity on the chaser was replaced by a straight-line version, good when the chaser is close. This step is called **[[linearizing|linearizing]]** — swapping a curve for the straight line that touches it at one point. Close to that point the line and curve agree. Farther away they part.
- **Circular reference orbit.** The target's radius $r_t$ was frozen at one value $r_0$, and the frame's turning rate $\dot\theta$ (read "theta dot") was frozen at the constant $n$. On a circle, both really are constant.

Everything else in CW follows from those two moves. So the questions are: how big is the error from each, and when does it matter?

## How to test a model: compare it with the truth

You cannot test CW against CW. You need something better to compare with. In orbit work that is a **[[truth model|truth-model]]** — the most accurate simulation you have, with no shortcuts in it.

Here is the test, step by step.

1. **Pick a start.** Choose a relative state $(\boldsymbol\rho_0, \dot{\boldsymbol\rho}_0)$ — where the chaser is and how it moves, seen from the target — and a target orbit.
2. **Run CW.** Multiply by $\boldsymbol\Phi(t)$ to get the CW prediction $\boldsymbol\rho_{\mathrm{CW}}(t)$.
3. **Run the truth.** Use lesson 1's conversion to turn the relative state into the chaser's real position and velocity around Earth. Then fly *both* spacecraft forward with the full two-body gravity law, $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3$, using a high-accuracy **[[numerical integrator|integrator]]**. Nothing is linearized. At each output time, project the chaser's position back into the target's LVLH frame at that moment. That gives $\boldsymbol\rho_{\mathrm{truth}}(t)$.
4. **Compare.** The error is the distance between the two answers:

$$
\varepsilon(t) = \lVert\boldsymbol\rho_{\mathrm{truth}}(t)-\boldsymbol\rho_{\mathrm{CW}}(t)\rVert .
$$

Read $\varepsilon$ as "epsilon", the usual letter for an error, and $\lVert\cdot\rVert$ as "the length of".

This error is not a mistake in solving the CW equations — lesson 3 ruled that out. It is the true price of the two shortcuts. To be sure the truth side is itself trustworthy, every number below was checked by tightening the integrator's tolerance by two more factors of ten. Nothing changed before the fifth significant figure, and a second, independent integration method agreed.

## How the error grows with distance and time

Use this module's reference orbit: $r_0 = 6791\,\mathrm{km}$, $n = 1.1282\times10^{-3}\,\mathrm{rad/s}$, period $T = 5569.4\,\mathrm{s}$ (about 92.8 minutes).

For each separation $d$, start the chaser at $x_0 = d$ (straight above the target) with in-track velocity $\dot y_0 = -2nd$ and everything else zero. That puts it on a closed loop around the target, the 2:1 ellipse that lesson 6 explains in full. The point of this choice is that the loop's size grows in step with $d$, so bigger $d$ really does mean "farther away".

Here is the position error, in meters, at several times (in fractions of an orbit):

| Separation | 0.05 $T$ | 0.25 $T$ | 0.50 $T$ | 1 $T$ | 2 $T$ | 3 $T$ | 5 $T$ |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 100 m | 0.0002 | 0.0030 | 0.0075 | 0.0139 | 0.0278 | 0.0416 | 0.0694 |
| 1 km | 0.021 | 0.299 | 0.754 | 1.387 | 2.774 | 4.162 | 6.936 |
| 10 km | 2.12 | 29.9 | 75.3 | 138 | 276 | 415 | 691 |
| 50 km | 52.7 | 742 | 1869 | 3393 | 6787 | 10180 | 16970 |

Two patterns stand out.

**Pattern one: ten times farther, a hundred times worse.** Pick any column. Going from 100 m to 1 km — ten times the distance — multiplies the error by very close to 100. Going from 1 km to 10 km does the same. So the error grows as $d^2$, "d squared". That is exactly what lesson 2 predicted. The straight-line gravity model misses a piece of the acceleration whose size grows like $d^2$. Nothing grows faster than that.

**Pattern two: the error grows steadily with time.** Read along the 1 km row after the first orbit: $1.387,\ 2.774,\ 4.162,\ 6.936$ m at $1, 2, 3, 5$ orbits. That is $1.387$ m added every orbit, the same to four figures. The error does not wobble around an average. It climbs. A small, consistent error in the acceleration gets added up — once into velocity, once again into position — orbit after orbit, into a bigger and bigger miss.

Put the two patterns together and you get one rule.

::: key CW's error rate
Once past the first orbit, CW's position error against nonlinear truth grows at approximately
$$
\dot\varepsilon \approx 1.39\ \mathrm{m/orbit} \times \left(\frac{d}{1\,\mathrm{km}}\right)^{2}
$$
confirmed from 100 m to 50 km of separation (within about 2% even at 50 km, where the $d^2$ scaling begins to show its own higher-order correction).
:::

The dot over $\varepsilon$ means "rate of change": meters of error added per orbit.

### What that means for an approach

Now you can say plainly where CW can be trusted.

- **At 100 m**, the error does not reach 1 m until about 72 orbits — nearly five days. For any real close-in operation, CW is good to well under a meter.
- **At 1 km**, the error passes 1 m after only 0.57 orbits, about 53 minutes. Fine for a single transfer; tight for anything longer.
- **At 10 km**, the error is past 2 m within $0.05\,T$, under five minutes. At that range CW is a planning tool, not a meter-level guidance model.

This is why real rendezvous profiles use CW-style targeting at kilometer ranges, then switch to **[[closed-loop|closed-loop]]** guidance — steering by fresh sensor measurements — once inside a few hundred meters. They do not trust a single open-loop CW prediction there for more than the shortest times.

::: example Reading the table as a design rule
A planner wants to know whether a 30-minute transfer computed with CW, starting 1 km out, stays accurate to 1 m the whole way.

**Step 1: convert the time to orbits.** $30\,\mathrm{min} = 1800\,\mathrm{s}$, and $1800 / 5569.4 = 0.323$. So the transfer lasts $0.323\,T$.

**Step 2: find it in the table.** $0.323\,T$ sits between the $0.25\,T$ and $0.50\,T$ columns. In the 1 km row those errors are $0.299$ m and $0.754$ m.

**Step 3: estimate between them.** $0.323$ is $(0.323 - 0.25)/0.25 = 0.29$ of the way from $0.25$ to $0.50$. So the error is about $0.299 + 0.29 \times (0.754 - 0.299) = 0.299 + 0.132 = 0.43$ m.

**Step 4: decide.** $0.43$ m is under the 1 m budget. The straight-line estimate is a little cautious here: the error curve bends upward, so the true value at $0.323\,T$, from the truth model, is $0.37$ m. Either way, the answer is yes.

**Same question, 10 km out.** The 10 km row gives $29.9$ and $75.3$ m, so the estimate is $29.9 + 0.29 \times 45.4 = 43$ m; the truth model gives $36$ m. That is not rounding. It is the difference between arriving where you planned and needing a sizeable correction burn.

**Sanity check.** Ten times the distance gave about a hundred times the error ($0.37$ m to $36$ m), exactly as pattern one says.
:::

## When the reference orbit is not circular

Everything so far kept the target on a perfect circle. Now change only that. Put the target on an orbit with the same **semi-major axis** — its average size — $a = 6791\,\mathrm{km}$, but with **[[eccentricity|eccentricity]]** $e = 0.05$. Eccentricity measures how stretched an orbit is: $e = 0$ is a circle, and the closer $e$ gets to 1, the longer and thinner the oval.

Start at **periapsis**, the orbit's lowest point. Repeat the 1 km test exactly. Run CW the way a program that ignores eccentricity would, with the constant $n = \sqrt{\mu/a^3}$ (read "the square root of mu over a cubed").

| $t/T$ | Circular reference, error (m) | $e=0.05$ reference, error (m) |
| --- | --- | --- |
| 0.05 | 0.021 | 6.65 |
| 0.10 | 0.079 | 29.1 |
| 0.25 | 0.30 | 274.0 |
| 0.50 | 0.75 | 1656 |
| 0.75 | 1.37 | 3046 |
| 1.00 | 1.39 | 3343 |

Same 1 km separation, same quarter orbit: a 30 cm error became a 274 m error. That is about 900 times worse — nearly a thousand.

And the orbit barely looks different from a circle. Its radius swings only $\pm ae = \pm 0.05 \times 6791 = \pm 340\,\mathrm{km}$ around the mean, about 5%. Drawn on paper you could not tell it from a circle by eye. Separation was never the problem in this test. The circle shortcut was, and it fails far harder than the small-separation shortcut. "Close enough to circular by eye" is not the same claim as "close enough to circular for CW".

## Why a small eccentricity hurts so much

CW froze the frame's turning rate at $n$. On an eccentric orbit the target speeds up near periapsis and slows down near **apoapsis**, the highest point. So the real turning rate $\dot\theta$ changes all the way around.

::: example How much the turning rate really changes
Take $e = 0.05$ and $a = 6791\,\mathrm{km}$, so $n = 1.1282\times10^{-3}\,\mathrm{rad/s}$. The rate of an orbit at any point is

$$
\dot\theta = n\,\frac{(1 + e\cos f)^2}{(1-e^2)^{3/2}},
$$

where $f$ is the **true anomaly**, the angle traveled since periapsis. It follows from the conservation of angular momentum, $r^2\dot\theta = h$, which you met in the two-body module.

**At periapsis**, $f = 0$ and $\cos f = 1$:

$$
\dot\theta_p = n\,\frac{(1.05)^2}{(0.9975)^{3/2}} = n \times \frac{1.1025}{0.99625} = 1.1066\,n = 1.2485\times10^{-3}\,\mathrm{rad/s}.
$$

**At apoapsis**, $f = 180^\circ$ and $\cos f = -1$:

$$
\dot\theta_a = n\,\frac{(0.95)^2}{(0.9975)^{3/2}} = n \times \frac{0.9025}{0.99625} = 0.9059\,n = 1.0220\times10^{-3}\,\mathrm{rad/s}.
$$

**Compare.** The rate runs from 10.7% above CW's frozen $n$ to 9.4% below it. From apoapsis to periapsis it grows by a factor $\dot\theta_p / \dot\theta_a = (1.05/0.95)^2 = 1.22$ — a 22% swing, from an orbit whose radius changes by only 5%.

**Sanity check.** The rate goes as one over the radius *squared*, so a 5% change in radius each way should give roughly $2 \times 5\% = 10\%$ each way in the rate. It does.
:::

That 22% swing is the whole trouble. CW's rotating frame turns at the wrong rate most of the time. It runs ahead of the real frame for half the orbit and behind it for the other half, and those mismatches do not cancel out in the chaser's position. They pile up. You can see the rate [[wander above and below the frozen value|thetadot-wander]] over one orbit.

::: warning Eccentricity is not "small e"
$e = 0.05$ sounds negligible, and most people would call that orbit "basically circular" on sight. The 900-fold jump in error shows that the feeling does not carry over to relative motion. CW freezes $\dot\theta$, which itself swings by a factor $\big(\tfrac{1+e}{1-e}\big)^2 \approx 1.22$ between periapsis and apoapsis at $e = 0.05$. That mismatch compounds over an orbit rather than averaging out. Check the target's eccentricity *before* reaching for CW, not after the result looks strange.
:::

## The Tschauner-Hempel equations

To fix it, keep the good shortcut and drop the bad one.

Go back to the exact relative equations from lesson 2, written before the orbit was made circular:

$$
\begin{aligned}
\ddot x - 2\dot\theta\dot y - \ddot\theta y - \dot\theta^2x &= -\frac{\mu(r_t+x)}{r_c^3}+\frac{\mu}{r_t^2}, \\
\ddot y+2\dot\theta\dot x+\ddot\theta x-\dot\theta^2y &= -\frac{\mu y}{r_c^3}, \\
\ddot z &= -\frac{\mu z}{r_c^3}.
\end{aligned}
$$

Here $r_t$ is the target's distance from Earth's center, $r_c$ the chaser's, $\dot\theta$ the frame's turning rate, and $\ddot\theta$ ("theta double-dot") how fast that rate is changing.

**Step 1: linearize gravity, as before.** Lesson 2's small-separation algebra never used the fact that $r_t$ was constant. So the right-hand sides become $2(\mu/r_t^3)\,x$, then $-(\mu/r_t^3)\,y$, then $-(\mu/r_t^3)\,z$ — the same as before.

**Step 2: do not freeze the orbit.** Leave $r_t$, $\dot\theta$ and $\ddot\theta$ as what they really are on an eccentric orbit: known functions of time, which you can compute exactly from **[[Kepler's equation|keplers-equation]]**. The result is

$$
\begin{aligned}
\ddot x-2\dot\theta(t)\dot y-\ddot\theta(t)y-\dot\theta(t)^2x &= \frac{2\mu}{r_t(t)^3}x, \\
\ddot y+2\dot\theta(t)\dot x+\ddot\theta(t)x-\dot\theta(t)^2y &= -\frac{\mu}{r_t(t)^3}y, \\
\ddot z &= -\frac{\mu}{r_t(t)^3}z.
\end{aligned}
$$

Look at what kind of equations these are. They are still **linear** in $x$, $y$, $z$ — no squares, no products of the unknowns — because small separation is still assumed. But their **coefficients**, the numbers multiplying $x$, $y$, $z$ and their rates, now change over the orbit, repeating once per revolution. In CW every coefficient was a fixed number built from $n$. Here they move.

**Step 3: change the clock.** Tschauner and Hempel, in a 1965 paper, rewrote this system with the target's true anomaly $f$ in place of time as the thing that counts progress around the orbit. That swap is natural because $\dot\theta$, the rate that causes all the trouble, is exactly the rate at which $f$ advances. The rewritten system is the **Tschauner-Hempel equations**.

They make exactly the small-separation shortcut that CW makes, and none of the circular-orbit shortcut. The price is that a closed-form state transition matrix is much harder to find, because the coefficients no longer stay put. A clean one was published by **[[Yamanaka and Ankersen|yamanaka-ankersen]]** in 2002. It plays the same role for an eccentric target that $\boldsymbol\Phi(t)$ plays for a circular one.

::: key When CW fails and what replaces it
The CW equations assume a circular reference orbit, so $n$ and the gravity-gradient coefficients are constant. At meaningful eccentricity the linearization must keep the time-varying terms $r_t(t)$, $\dot\theta(t)$, $\ddot\theta(t)$. Use the **Tschauner-Hempel equations** — or the **Yamanaka-Ankersen** closed-form state transition matrix — for an eccentric reference orbit.
:::

::: example Confirming the fix
Integrate the time-varying linear system above for the same $e = 0.05$, 1 km case. Feed it the target's true $r_t(t)$, $\dot\theta(t)$ and $\ddot\theta(t)$ from an exact Kepler solution, instead of freezing them. Compare both models with the truth:

| $t/T$ | Fixed-$n$ CW error (m) | Time-varying (T-H-type) error (m) |
| --- | --- | --- |
| 0.05 | 6.65 | 0.026 |
| 0.25 | 274.0 | 0.41 |
| 0.50 | 1656 | 1.00 |
| 1.00 | 3343 | 2.58 |

**Read the ratios.** At $0.05\,T$: $6.65 / 0.026 \approx 260$. At $0.5\,T$: $1656 / 1.00 \approx 1700$. Across the table, restoring the true, changing rate cuts the error by a factor of about 250 to 1700.

**Compare with the circle.** The remaining errors, $0.026$ m to $2.58$ m, are the same size as the circular-orbit errors in the first table at 1 km ($0.021$ m to $1.39$ m). What is left is the small-separation error, which the T-H system still carries.

**The lesson.** The eccentricity error and the separation error are two separate effects. Fixing the first does not touch the second. But here the first was a thousand times bigger, so fixing it is what mattered.
:::

## Check yourself

::: check
At 1 km separation, CW's error reaches 1 m after about 0.57 orbits. Using the error rate near 1 km, $1.39\,\mathrm{m/orbit}$, estimate how many orbits it takes to reach 1 m at 300 m separation. Is your estimate consistent with the 100 m figure of about 72 orbits?
:::

::: answer
The rate scales as $d^2$. At 300 m: $(0.3\,\mathrm{km}/1\,\mathrm{km})^2 = 0.09$, so the rate is $1.39 \times 0.09 = 0.125\,\mathrm{m/orbit}$. Reaching 1 m takes about $1 / 0.125 = 8$ orbits. (The truth model gives 8.2.)

Consistency check: 300 m is three times 100 m, so its error grows $3^2 = 9$ times faster. It should reach 1 m in about $72 / 9 = 8$ orbits. It agrees. And 8 orbits sits between the 100 m figure (72 orbits) and the 1 km figure (0.57 orbits), as it must.
:::

::: check
In the circular-reference study, why does the error grow as $d^2$ rather than in step with $d$?
:::

::: answer
CW keeps the part of the gravity difference that is proportional to $d$. What it drops is the next piece, whose relative size is about $d/r_0$ — lesson 2's worked example showed it. So the missing acceleration is about $d \times (d/r_0) = d^2/r_0$. Adding that up twice over time (into velocity, then into position) gives a position error that keeps the same $d^2$ scaling.
:::

::: check
The eccentric test started at periapsis. Would starting at apoapsis, or anywhere else, change the conclusion that eccentricity breaks CW badly?
:::

::: answer
No. The trouble is that $r_t$ and $\dot\theta$ vary around the orbit while CW holds them fixed. That variation belongs to the whole orbit, not to the starting point. Starting elsewhere changes which part of the variation you meet first, not whether you meet it. Periapsis was chosen only because it is a clean, repeatable place to start (true anomaly zero), not because it favors CW.
:::

::: check
A colleague says: "The T-H-type system is still linearized in separation, so its error must still grow as $d^2$, like CW on a circle." Is she right?
:::

::: answer
Yes, for the separation part. The T-H system makes exactly the same small-separation shortcut as CW, so its remaining error grows with separation in the same way. The confirming table shows it: the T-H error (0.026 to 2.58 m) is the same size as the circular CW error at 1 km (0.021 to 1.39 m). What T-H removes is only the *extra* error from pretending the reference orbit is a circle. The two shortcuts are independent; fixing one leaves the other.
:::

::: check
A target has $e = 0.001$ — essentially circular by any operational standard. Would you expect to need the Tschauner-Hempel equations?
:::

::: answer
No. At $e = 0.05$ the turning rate swung by about 22% between periapsis and apoapsis. The swing is about $4e$ for small $e$, so at $e = 0.001$ it is about $0.4\%$ (exactly, $(1.001/0.999)^2 = 1.004$) — roughly fifty times smaller. The extra error would be far below the thousand-fold jump seen at $e = 0.05$ and likely small next to the ordinary separation error CW already has. The warning's rule cuts both ways: check the actual eccentricity, and do not reach for heavier machinery when plain CW is enough.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\varepsilon(t) = \lVert\boldsymbol\rho_{\mathrm{truth}}-\boldsymbol\rho_{\mathrm{CW}}\rVert$ | CW's position error against a nonlinear two-body truth model |
| $\dot\varepsilon \approx 1.39\,\mathrm{m/orbit}\times(d/1\,\mathrm{km})^2$ | CW's steady error growth rate, circular reference, confirmed 100 m–50 km |
| 100 m, 1 km, 10 km separation | Good to 1 m for about 72 orbits, 0.57 orbits, and under 0.05 orbits |
| $e=0.05$ at 1 km, quarter orbit | 274 m error against 0.30 m for a circle — about 900 times worse |
| $\dot\theta = n(1+e\cos f)^2/(1-e^2)^{3/2}$ | The real turning rate; swings by $((1+e)/(1-e))^2 \approx 1.22$ at $e = 0.05$ |
| Tschauner-Hempel equations | Exact relative equations with gravity linearized only: linear in separation, coefficients $r_t(t)$, $\dot\theta(t)$, $\ddot\theta(t)$ varying over the orbit; written with true anomaly as the clock |
| Yamanaka-Ankersen (2002) | Closed-form state transition matrix for the Tschauner-Hempel equations |
| Two independent error sources | Separation ($\propto d^2$, present even for $e=0$) and eccentricity (present even for small $d$) — fixing one leaves the other |

With CW's range now measured instead of assumed, the next two lessons step back inside it. They use the closed-form solution to explain the two most important behaviors of relative motion: why some starting states drift away forever while others do not, and why firing forward leaves you behind.

::: context linearizing Swapping a curve for a straight line
Gravity weakens as one over distance squared: a curve. Near the target's radius, CW replaces that curve with the straight line touching it there. Close in, you cannot tell them apart. Farther out, the gap opens — and it opens like the distance *squared*, which is exactly the $d^2$ in this lesson's error table.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="175" x2="340" y2="175" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="175" x2="40" y2="12" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,20.0 54.5,29.7 69.0,38.9 83.5,47.5 98.0,55.7 112.5,63.4 127.0,70.7 141.5,77.6 156.0,84.2 170.5,90.5 185.0,96.4 199.5,102.0 214.0,107.4 228.5,112.5 243.0,117.4 257.5,122.1 272.0,126.5 286.5,130.8 301.0,134.8 315.5,138.7 330.0,142.4"/>
  <line x1="40" y1="20" x2="257.5" y2="170" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="257.5" y1="122.1" x2="257.5" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="40" cy="20" r="4" fill="#1f2a44"/>
  <text x="50" y="16" font-size="12" fill="#1f2a44">touch point (the target)</text>
  <text x="340" y="116" font-size="12" fill="#1d6fd1" text-anchor="end">true gravity</text>
  <text x="206" y="152" font-size="12" fill="#b4232c" text-anchor="end">straight-line version</text>
  <text x="264" y="152" font-size="12" fill="#1f2a44">the gap</text>
  <text x="190" y="193" font-size="12" fill="#1f2a44" text-anchor="middle">distance from the target (exaggerated)</text>
</svg>
```

The picture stretches distances enormously; at real rendezvous ranges the gap is a few parts in ten thousand.
:::

::: context truth-model Why engineers call a simulation "truth"
Nobody believes a computer model *is* reality. "Truth model" is shorthand for "the most complete model we have, used as the yardstick". Here it is full two-body gravity with nothing linearized. For a real mission, the truth model would also include Earth's bulge ($J_2$), air drag, and sometimes the Moon and Sun.

The rule of the trade: the model you fly with (here CW) must always be checked against a model that has strictly *more* physics in it than the one being tested. Checking a model against itself only proves you did the algebra right.
:::

::: context integrator What a numerical integrator does
Most orbits cannot be written down as a neat formula once you add real effects, so a computer walks them forward in tiny time steps. At each step it asks "what is the acceleration here?", nudges the velocity, then nudges the position. A **Runge-Kutta** method (named after two German mathematicians, Carl Runge and Wilhelm Kutta, around 1900) samples the acceleration several times inside each step to be much more accurate.

The standard trust test is the one used in this lesson: make the steps much smaller. If the answer does not change, the steps were small enough, and what you are seeing is physics, not arithmetic error.
:::

::: context closed-loop Open loop and closed loop
**Open loop** means: compute a plan, then fly it with your eyes shut. **Closed loop** means: measure where you actually are, compare with where you should be, and correct — again and again.

A CW prediction flown open loop inherits every error in the model. Close in, a visiting vehicle measures its range and angle to the target several times a second with lidar or cameras and corrects continuously. The model's error stops mattering much, because every new measurement resets it. Lesson 12 covers those sensors.
:::

::: context eccentricity How round is e = 0.05?
Here is an orbit with $e = 0.05$ (solid) drawn over a circle of the same average size (dashed), to scale. The oval is only about 0.1% narrower than it is long. What *does* show is that Earth, marked by the dot, sits off-center, at a **focus** of the ellipse. That offset, $ae = 340\,\mathrm{km}$ here, is what makes the target speed up and slow down.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <circle cx="120" cy="100" r="90" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <ellipse cx="120" cy="100" rx="90" ry="89.89" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="124.5" cy="100" r="4" fill="#1f2a44"/>
  <circle cx="120" cy="100" r="1.5" fill="#6c7a93"/>
  <circle cx="210" cy="100" r="4" fill="#b4232c"/>
  <circle cx="30" cy="100" r="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="228" y="60" font-size="12" fill="#1f2a44">dot: Earth at the focus,</text>
  <text x="228" y="75" font-size="12" fill="#1f2a44">340 km off-centre</text>
  <text x="228" y="104" font-size="12" fill="#b4232c">periapsis 6451 km</text>
  <text x="228" y="140" font-size="12" fill="#1f2a44">apoapsis 7131 km</text>
  <text x="228" y="155" font-size="12" fill="#1f2a44">(left, orange)</text>
  <text x="120" y="196" font-size="12" fill="#1f2a44" text-anchor="middle">e = 0.05, drawn to scale</text>
</svg>
```

"Looks like a circle" and "behaves like a circle" are different claims.
:::

::: context thetadot-wander The turning rate over one orbit
The blue curve is the real turning rate $\dot\theta$ of an $e = 0.05$ orbit, divided by CW's frozen $n$, over one orbit starting at periapsis. The dashed line at 1 is what CW assumes. The real rate starts 10.7% high, dips 9.4% low at apoapsis halfway round, and climbs back.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="335" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="170" x2="50" y2="25" stroke="#6c7a93" stroke-width="1"/>
  <line x1="50" y1="100" x2="330" y2="100" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="6 4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,50.2 54.7,50.6 59.3,51.5 64.0,53.2 68.7,55.4 73.3,58.1 78.0,61.4 82.7,65.2 87.3,69.3 92.0,73.7 96.7,78.3 101.3,83.2 106.0,88.1 110.7,93.1 115.3,98.0 120.0,102.9 124.7,107.7 129.3,112.2 134.0,116.6 138.7,120.7 143.3,124.6 148.0,128.2 152.7,131.4 157.3,134.3 162.0,136.8 166.7,139.0 171.3,140.7 176.0,142.1 180.7,143.1 185.3,143.7 190.0,143.9 194.7,143.7 199.3,143.1 204.0,142.1 208.7,140.7 213.3,139.0 218.0,136.8 222.7,134.3 227.3,131.4 232.0,128.2 236.7,124.6 241.3,120.7 246.0,116.6 250.7,112.2 255.3,107.7 260.0,102.9 264.7,98.0 269.3,93.1 274.0,88.1 278.7,83.2 283.3,78.3 288.0,73.7 292.7,69.3 297.3,65.2 302.0,61.4 306.7,58.1 311.3,55.4 316.0,53.2 320.7,51.5 325.3,50.6 330.0,50.2"/>
  <text x="44" y="57" font-size="11" fill="#1f2a44" text-anchor="end">1.1</text>
  <text x="44" y="104" font-size="11" fill="#1f2a44" text-anchor="end">1.0</text>
  <text x="44" y="150" font-size="11" fill="#1f2a44" text-anchor="end">0.9</text>
  <text x="50" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="190" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">T/2</text>
  <text x="330" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">T</text>
  <text x="200" y="94" font-size="12" fill="#b4232c" text-anchor="middle">CW's frozen n</text>
  <text x="112" y="40" font-size="12" fill="#1d6fd1">real rate (periapsis: fast)</text>
  <text x="190" y="162" font-size="12" fill="#1f2a44" text-anchor="middle">apoapsis: slow</text>
</svg>
```

The curve spends a shorter time above the line than below it — the orbit whips quickly through periapsis — yet the angle it gains averages out to exactly $2\pi$ per orbit. It is the *timing* of the angle that CW gets wrong.
:::

::: context keplers-equation Where r(t) comes from
On an eccentric orbit you cannot write the position as a plain function of time. You use **Kepler's equation**, $M = E - e\sin E$. The **mean anomaly** $M = n t$ grows steadily with time. The **eccentric anomaly** $E$ is a helper angle, found from $M$ by a few rounds of Newton's method. Then $r_t = a(1 - e\cos E)$, and the true anomaly $f$ follows from $E$.

Once you have $r_t$ and $f$, the rest is quick: $\dot\theta = h/r_t^2$ from angular momentum, and $\ddot\theta = -2\dot r_t\,\dot\theta / r_t$. The two-body module derived all of these.
:::

::: context yamanaka-ankersen The true-anomaly trick
Tschauner and Hempel published their equations in German in 1965, in the journal *Astronautica Acta*. The closed-form state transition matrix most engineers now use came from Koji Yamanaka and Finn Ankersen in the *Journal of Guidance, Control, and Dynamics* in 2002.

The trick that makes it solvable: scale each coordinate by $\rho = 1 + e\cos f$ and use $f$ as the clock. Writing a prime for "rate of change with $f$", with $\tilde x = \rho x$, $\tilde y = \rho y$, $\tilde z = \rho z$, the equations become

$$
\tilde x'' = \frac{3\tilde x}{\rho} + 2\tilde y', \qquad \tilde y'' = -2\tilde x', \qquad \tilde z'' = -\tilde z .
$$

Set $e = 0$ and $\rho = 1$: out come the CW equations, with $f = nt$ as the clock.
:::
