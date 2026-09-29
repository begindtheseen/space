---
id: l11-mesh-refinement
title: Mesh refinement from an interpolated-defect error estimate
minutes: 19
covers:
  - Mesh refinement driven by an interpolated-defect error estimate
---

Imagine drawing a coastline on a map. You measure a handful of points along the shore, mark them, and join them with a smooth curve. At the measured points the drawing is right, because that is where you put the pencil. But is the curve right *between* them? The only way to find out is to walk the shore halfway between two marks and see whether the real water line is where your curve says. Where it is badly off — a hidden bay you stepped right over — you measure more points there. Along a straight beach you leave the drawing alone.

A collocation solve is that drawing. The nodes are the measured points. The solver makes the dynamics hold exactly at them, so checking there tells you nothing. This lesson builds the check that walks the shore in between. It is called the **interpolated-defect error estimate**: evaluate how badly the solution's own curve breaks the equations of motion at points strictly between the nodes. Then it builds the rule that uses it, **mesh refinement** — add nodes only in the segments where the estimate is large, re-solve, and repeat until every segment passes.

Real tools do exactly this. **[[GPOPS-II|real-tools]]**, the commercial pseudospectral solver on this module's reading list, and Betts's industrial SOCS code both decide their own meshes from an error estimate of this kind. By the end you will be able to run the loop by hand on the Mars descent and see it find the engine switch without being told where it is.

## A converged solve is not a correct one

Lesson eight turned the dynamics into **defect constraints**, one per segment. The Hermite-Simpson defect for segment $k$ says that the state at the next node equals the state at this node plus a Simpson's-rule estimate of the change:

$$
\mathbf{x}_{k+1} - \mathbf{x}_k - \frac{h}{6}\big(\mathbf{f}_k + 4\,\mathbf{f}_{\text{mid}} + \mathbf{f}_{k+1}\big) = \mathbf{0}.
$$

Here $h$ is the segment's length in time and $\mathbf{f}$ is the dynamics, the right-hand side of $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u}, t)$. When the solver says "converged", every one of these is zero to about $10^{-12}$.

That is a statement about the *discretized* problem. It says the nodes are consistent with a Simpson's rule. It does not say the curve between the nodes obeys the real equations of motion. A coarse **[[mesh|mesh-word]]** — the list of node times — can produce a perfectly converged answer that is wrong between its nodes. And you cannot tell by looking at the defects, because the solver drove them to zero whether the mesh was good or not.

So you need a second measurement, taken somewhere the solver was never asked to get right.

## The interpolated-defect estimate

Every collocation scheme comes with its own picture of the trajectory *between* nodes. For Hermite-Simpson the state on segment $k$ is a **[[cubic Hermite interpolant|hermite-cubic]]**: the one cubic curve that passes through $\mathbf{x}_k$ and $\mathbf{x}_{k+1}$ with slopes $\mathbf{f}_k$ and $\mathbf{f}_{k+1}$ at the two ends. The control is a straight line from $\mathbf{u}_k$ to $\mathbf{u}_{k+1}$. So at any fraction $\tau$ ("tau") of the way through the segment, from $0$ at the start to $1$ at the end, you have a state $\mathbf{x}_{\text{interp}}(\tau)$, its slope $\dot{\mathbf{x}}_{\text{interp}}(\tau)$ (read "x dot interp"), and a control $\mathbf{u}_{\text{interp}}(\tau)$.

If the curve were the true trajectory, its slope would equal the dynamics at every point. So measure how far apart they are:

$$
\mathbf{e}_k(\tau) = \dot{\mathbf{x}}_{\text{interp}}(\tau) - \mathbf{f}\big(\mathbf{x}_{\text{interp}}(\tau),\,\mathbf{u}_{\text{interp}}(\tau),\,t_k + \tau h\big).
$$

Read $\mathbf{e}_k(\tau)$ as "e sub k of tau": the **residual**, or leftover, of the equations of motion at that point. It is zero everywhere only if the curve really obeys the dynamics.

Two practical steps turn it into one number per segment. First, divide each state component by a typical size, so meters, meters per second and kilograms can be compared. For the Mars descent this lesson uses $1500\,\mathrm{m}$, $75\,\mathrm{m/s}$ and $1000\,\mathrm{kg}$ — the starting altitude, speed and mass — which makes the residual a fraction of the state per second. Second, sample $\tau$ at several interior points (this lesson uses $19$: $\tau = 0.05, 0.10, \dots, 0.95$) and keep the worst. Call that peak $\varepsilon_k$ ("epsilon sub k").

::: key The interpolated-defect error estimate
A defect is zero at the nodes by construction, so it cannot judge the mesh. Sampling the equations-of-motion residual $\mathbf{e}_k(\tau) = \dot{\mathbf{x}}_{\text{interp}}(\tau) - \mathbf{f}(\mathbf{x}_{\text{interp}}(\tau), \mathbf{u}_{\text{interp}}(\tau), t_k+\tau h)$ strictly *between* nodes measures whether the mesh, not just the solver, did its job. Its scaled peak $\varepsilon_k$ on each segment ranks the segments by how urgently each one needs more nodes.
:::

::: warning Three blind spots, not two
It is tempting to sample at the nodes and at the Hermite-Simpson midpoint, because those are the points the method "uses". All three are blind. The residual is exactly zero at $\tau = 0$, $\tau = \tfrac12$ and $\tau = 1$ on every converged Hermite-Simpson segment, however bad the mesh. Sample anywhere else.
:::

::: note Why it has to be true
At the ends the cubic was built to have slope $\mathbf{f}_k$ and $\mathbf{f}_{k+1}$, which are exactly the dynamics there, so $\mathbf{e}_k(0) = \mathbf{e}_k(1) = \mathbf{0}$.

The midpoint takes two lines of algebra. Differentiate the Hermite cubic and set $\tau = \tfrac12$:

$$
\dot{\mathbf{x}}_{\text{interp}}\big(\tfrac12\big) = \frac{3}{2}\,\frac{\mathbf{x}_{k+1}-\mathbf{x}_k}{h} - \frac{\mathbf{f}_k + \mathbf{f}_{k+1}}{4}.
$$

A zero defect says $\mathbf{x}_{k+1}-\mathbf{x}_k = \tfrac{h}{6}(\mathbf{f}_k + 4\mathbf{f}_{\text{mid}} + \mathbf{f}_{k+1})$. Substitute it: $\tfrac32 \cdot \tfrac16(\mathbf{f}_k + 4\mathbf{f}_{\text{mid}} + \mathbf{f}_{k+1}) - \tfrac14(\mathbf{f}_k + \mathbf{f}_{k+1}) = \mathbf{f}_{\text{mid}}$. The value of the cubic at $\tau = \tfrac12$ is $\tfrac12(\mathbf{x}_k + \mathbf{x}_{k+1}) + \tfrac{h}{8}(\mathbf{f}_k - \mathbf{f}_{k+1})$, which is exactly lesson eight's midpoint state, and the straight-line control there is $\tfrac12(\mathbf{u}_k + \mathbf{u}_{k+1})$, lesson eight's midpoint control. So the slope equals the dynamics at the midpoint too: $\mathbf{e}_k(\tfrac12) = \mathbf{0}$. The solver enforced all three points. Everything else is free to be wrong.
:::

::: example A ten-segment mesh that never sees the switch
**The problem.** The Mars powered descent from lessons one and five: a $1000\,\mathrm{kg}$ lander at $1500\,\mathrm{m}$, falling at $75\,\mathrm{m/s}$, with thrust from $0$ to $6000\,\mathrm{N}$, landing softly on the least propellant. Indirect shooting found the true answer: coast for $1.8546\,\mathrm{s}$, then burn at full thrust for $31.9051\,\mathrm{s}$, using $86.7579\,\mathrm{kg}$.

**Step 1: solve on a uniform mesh.** Transcribe it with Hermite-Simpson on $10$ equal segments and a free final time. The solver converges cleanly. The final time is $33.8132\,\mathrm{s}$, so each segment is $3.381\,\mathrm{s}$ long — longer than the whole coast. The defects are below $10^{-14}$. The propellant is $86.8399\,\mathrm{kg}$, only $0.0946\,\%$ above the truth. From the summary numbers alone, it looks trustworthy.

**Step 2: look at the thrust.** It is $0$ at the first node, $t = 0$, and already $5668\,\mathrm{N}$ — $94.5\,\%$ of full — at the second node, $t = 3.381\,\mathrm{s}$. From there on it is full thrust. The real switch is an instant at $1.8546\,\mathrm{s}$. The mesh has replaced it with a ramp across the entire first segment, because a straight-line control inside one segment cannot jump.

**Step 3: compute the estimate.** Sample the scaled residual at $19$ interior points of each segment and keep each segment's worst:

| Segment | Time span (s) | Peak scaled residual $\varepsilon_k$ |
| --- | --- | --- |
| $0$ | $0$ to $3.381$ | $1.60\times10^{-5}$ |
| $1$ | $3.381$ to $6.763$ | $1.81\times10^{-7}$ |
| $2$ to $9$ | $6.763$ to $33.813$ | $1.93\times10^{-8}$ to $2.37\times10^{-8}$ |

**Step 4: read the ranking.** Segment $0$ is $1.60\times10^{-5}/1.93\times10^{-8} \approx 830$ times worse than the best segment, and $1.60\times10^{-5}/1.81\times10^{-7} \approx 88$ times worse than its own neighbor. Nobody told the estimate where the switch was, and it pointed straight at the one segment that contains it. Segments $2$ to $9$ sit inside the smooth full-thrust burn, and their estimates agree to within $25\,\%$ of each other: no alarm there, correctly.

**Sanity check.** The worst residual is in the velocity equation, the one the thrust drives, and it is shaped like a letter S across the segment: zero at the start, the middle and the end, and peaking near $\tau = 0.2$ and $\tau = 0.8$. That is the **[[shape of the residual|residual-shape]]** the note above predicts.
:::

## The refinement rule

Now turn the ranking into action. The rule has four parts.

1. **Pick a tolerance.** Choose $\varepsilon_{\text{tol}}$, the largest residual the mission can live with. This lesson uses $\varepsilon_{\text{tol}} = 10^{-6}$ per second in scaled units.
2. **Find the failures.** Every segment with $\varepsilon_k > \varepsilon_{\text{tol}}$ gets refined. Every other segment is left exactly as it is.
3. **Decide how many pieces.** On a smooth stretch the Hermite-Simpson residual shrinks like $h^3$: halve a segment and its residual falls about eightfold. On the Mars descent's burn it fell from $2.13\times10^{-8}$ to $2.66\times10^{-9}$ when $h$ was halved, a factor of $8.0$. So to bring a residual down by the factor $\varepsilon_k/\varepsilon_{\text{tol}}$, cut the segment into
$$
M_k = \left\lceil \left(\frac{\varepsilon_k}{\varepsilon_{\text{tol}}}\right)^{1/3} \right\rceil
$$
equal pieces. The brackets $\lceil\ \rceil$ mean **round up** to a whole number.
4. **Re-solve and repeat.** Start the new solve from the old answer, interpolated onto the new mesh — a **[[warm start|warm-start]]** — so it begins almost converged. Recompute the estimate. Stop when no segment fails.

This is the same idea as the **[[adaptive step size|adaptive-step]]** inside an ordinary differential-equation integrator, which shrinks its steps where the solution is changing fast. Here the "step" is a mesh segment, and the adjustment happens once per NLP solve instead of once per step.

::: key The refinement rule
Rank segments by their peak estimate $\varepsilon_k$; split each one with $\varepsilon_k > \varepsilon_{\text{tol}}$ into $M_k = \lceil(\varepsilon_k/\varepsilon_{\text{tol}})^{1/p}\rceil$ pieces, where $p$ is the rate at which the residual shrinks with $h$ ($p = 3$ for Hermite-Simpson on smooth arcs); leave the rest alone; warm-start, re-solve, repeat until every segment passes. That turns "how many nodes?" from a guess into a computed answer.
:::

::: example Four rounds to find a switch nobody announced
Start from the ten-segment answer above, with $\varepsilon_{\text{tol}} = 10^{-6}$.

**Round 0.** Only segment $0$ fails, with $\varepsilon_0 = 1.60\times10^{-5}$. Its ratio to the tolerance is $16.0$, and $16.0^{1/3} = 2.52$, which rounds up to $M = 3$. So segment $0$ becomes three segments of $1.13\,\mathrm{s}$ each. Segment $1$, at $1.81\times10^{-7}$, passes and is left alone.

**Round 1.** Re-solve on $12$ segments. Propellant: $86.7720\,\mathrm{kg}$. The switch now sits in the segment from $1.13$ to $2.25\,\mathrm{s}$, whose estimate is $4.25\times10^{-6}$. It fails; $4.25^{1/3} = 1.62$, so it is split in two.

**Rounds 2 and 3.** The same thing happens twice more. Each time only the segment holding the switch fails, and each time it is halved.

**Round 4.** On $15$ segments, the segment holding the switch runs from $1.829$ to $1.969\,\mathrm{s}$ — only $0.14\,\mathrm{s}$ wide — and its estimate is $3.45\times10^{-7}$. Every segment passes. Stop.

| Round | Segments | Propellant (kg) | Error | Worst $\varepsilon_k$ |
| --- | --- | --- | --- | --- |
| $0$ | $10$ | $86.8399$ | $0.0946\,\%$ | $1.60\times10^{-5}$ |
| $1$ | $12$ | $86.7720$ | $0.0163\,\%$ | $4.25\times10^{-6}$ |
| $2$ | $13$ | $86.7620$ | $0.0047\,\%$ | $1.88\times10^{-6}$ |
| $3$ | $14$ | $86.7586$ | $0.0008\,\%$ | $1.21\times10^{-6}$ |
| $4$ | $15$ | $86.7582$ | $0.0004\,\%$ | $3.45\times10^{-7}$ |

**Read the answer.** The final mesh has nodes at $0$, $1.125$, $1.688$, $1.829$, $1.969$, $2.251$ and $3.376\,\mathrm{s}$, then every $3.38\,\mathrm{s}$ to landing. The thrust is $0$ through $1.688\,\mathrm{s}$, $1888\,\mathrm{N}$ at $1.829\,\mathrm{s}$, and full from $1.969\,\mathrm{s}$ on — see the **[[mesh before and after|mesh-picture]]**. The ramp that used to span $3.38\,\mathrm{s}$ now spans $0.28\,\mathrm{s}$, and it brackets the true switch at $1.8546\,\mathrm{s}$. The final time is $33.7600\,\mathrm{s}$ against the true $33.7597\,\mathrm{s}$.

**Compare with brute force.** A uniform mesh of $20$ segments — more than the refined one — gives $86.8065\,\mathrm{kg}$, an error of $0.056\,\%$. Thirty uniform segments give $0.0163\,\%$. The refined $15$-segment mesh is about $150$ times more accurate than the first and $45$ times more accurate than the second, because it spent its nodes where the trouble was.

**Sanity check.** The segments from $6.76\,\mathrm{s}$ to landing were never touched. Their estimates were around $2\times10^{-8}$ from the start, forty to fifty times under the tolerance. Refining them would have cost solver time and bought nothing.
:::

## What refinement can and cannot do

Look again at the estimates of the segment holding the switch: $1.60\times10^{-5}$, then $4.25\times10^{-6}$, $1.88\times10^{-6}$, $1.21\times10^{-6}$, $3.45\times10^{-7}$ as the segment shrank from $3.38$ to $0.14\,\mathrm{s}$. The width fell by a factor of $24$; the estimate fell by a factor of $46$. On a smooth segment, a factor of $24$ in $h$ would have bought $24^3 \approx 14\,000$. A jump does not obey the $h^3$ law. Near a switch the residual shrinks roughly in proportion to $h$ — a little faster here, but nowhere near $h^3$ — which is why the cube-root rule under-split that segment every round and the loop needed four rounds instead of one.

::: warning Refinement narrows a jump; it never removes it
A straight-line control inside one segment cannot jump. However many times you split the segment holding the switch, some segment still holds it, and the thrust still ramps across that segment. Refinement squeezes the ramp from $3.38\,\mathrm{s}$ to $0.28\,\mathrm{s}$ and would keep squeezing, but it never reaches a true step.

The cure is to stop fighting the jump. Once the estimate has located the switch, put a **mesh break** there: end one segment and start the next exactly at the switch time — better, make the switch time itself an unknown, a boundary between two **phases** the NLP can move. Each side is then smooth, and each converges at its full rate. This is the $h$ half of lesson ten's hp-adaptive idea. It is also how you fix **[[ringing|ringing]]** at the junctions of a singular arc, such as the Goddard rocket's in this module's exercise: let the estimate find the junctions, then refine hard around them or break the mesh there.
:::

::: warning The estimate is not free
Every sample point costs one evaluation of the dynamics. This lesson's $19$ samples per segment are ten times the two evaluations per segment (node and midpoint) that the defects themselves need. For a cheap model that does not matter. For an expensive one — a detailed atmosphere, a gravity model with thousands of terms — the check itself can rival the solve. Production tools use a handful of sample points, or integrate the residual across each segment with a quadrature rule to get an estimate of the state error, and they run the check once per mesh, not once per solver iteration.
:::

## Check yourself

::: check
Why would checking the equations-of-motion residual at the nodes and at the Hermite-Simpson midpoints fail as a test of the mesh?
:::

::: answer
Those are exactly the three points per segment where the residual is zero by construction. At the nodes the interpolating cubic was built with slopes equal to the dynamics. At the midpoint, a zero defect forces the cubic's slope to equal $\mathbf{f}_{\text{mid}}$, and its value and control there are exactly the midpoint state and control the method used. So a converged solve shows zero residual at all three points on any mesh, fine or coarse. That measures whether the *solver* did its job, not whether the *mesh* can represent the trajectory. A one-segment mesh across the whole flight would pass that test. The check has to sample points the solver was never asked to get right.
:::

::: check
In the ten-segment example, segment $1$ (from $3.381$ to $6.763\,\mathrm{s}$) is right next to the segment holding the switch, yet its estimate is $88$ times smaller. Why is it not flagged?
:::

::: answer
The switch happens at $1.8546\,\mathrm{s}$, inside segment $0$. By $3.381\,\mathrm{s}$ the true thrust has been constant at full for about $1.5\,\mathrm{s}$, and it stays constant through all of segment $1$. So segment $1$ contains no jump; the true state there is smooth, and a cubic follows it well. Its residual is not zero — the mass is dropping and the acceleration $T/m$ is slowly changing, so there is ordinary discretization error — but it is the small error of a well-behaved stretch. With $\varepsilon_{\text{tol}} = 10^{-6}$ it passes ($1.81\times10^{-7}$), and the rule correctly leaves it alone.
:::

::: check
A colleague proposes skipping the estimate: double the number of segments everywhere and stop when the propellant stops changing. What does that lose?
:::

::: answer
Two things. First, efficiency: doubling everywhere spends most of the new nodes on the long burn, which was already forty to fifty times under tolerance, while the one segment that needed help gets no more than everyone else. The uniform $20$-segment mesh is about $150$ times less accurate than the refined $15$-segment one. Second, it can stop too early. The ten-segment propellant was already within $0.1\,\%$ of the truth while its thrust history was qualitatively wrong — a $3.4\,\mathrm{s}$ ramp in place of an instant switch. A stopping rule that watches only the cost can declare victory without ever looking at the control. The estimate looks at the dynamics everywhere, segment by segment.
:::

::: check
A segment has $\varepsilon_k = 5\times10^{-5}$ and the tolerance is $10^{-6}$. How many pieces does the rule split it into, and what should the new estimate be if the segment is smooth? What if it holds a switch?
:::

::: answer
The ratio is $5\times10^{-5}/10^{-6} = 50$, and $50^{1/3} = 3.68$, which rounds up to $M = 4$ pieces, each a quarter as long.

If the segment is smooth, the residual scales like $h^3$, so it should fall by $4^3 = 64$: the new estimate is about $5\times10^{-5}/64 = 7.8\times10^{-7}$, under the tolerance. One round fixes it.

If the segment holds a switch, the residual shrinks only about in proportion to $h$: the piece holding the switch would come out near $5\times10^{-5}/4 = 1.25\times10^{-5}$, still twelve times over. The rule would flag it again next round. That is the signal to stop splitting and put a mesh break at the switch instead.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Converged is not correct | Defects are zero at the nodes by construction, on any mesh |
| Interpolated-defect estimate | $\mathbf{e}_k(\tau) = \dot{\mathbf{x}}_{\text{interp}}(\tau) - \mathbf{f}(\mathbf{x}_{\text{interp}}, \mathbf{u}_{\text{interp}}, t_k+\tau h)$, scaled, peak over interior samples $= \varepsilon_k$ |
| Blind spots | Hermite-Simpson residual is exactly zero at $\tau = 0, \tfrac12, 1$ |
| Refinement rule | Split each segment with $\varepsilon_k > \varepsilon_{\text{tol}}$ into $\lceil(\varepsilon_k/\varepsilon_{\text{tol}})^{1/3}\rceil$ pieces; warm-start; repeat |
| Ten-segment descent | Propellant $86.8399\,\mathrm{kg}$ ($0.0946\,\%$ high) but a $3.38\,\mathrm{s}$ thrust ramp; segment $0$'s estimate $830\times$ the best |
| After four rounds | $15$ segments, $86.7582\,\mathrm{kg}$ ($0.0004\,\%$), ramp $0.28\,\mathrm{s}$ around the true $1.8546\,\mathrm{s}$ switch |
| Uniform comparison | $20$ equal segments: $0.056\,\%$, about $150\times$ worse |
| Rates | Smooth: residual $\propto h^3$; at a switch only about $\propto h$ |
| Limit and cure | Refinement narrows a jump but never removes it; break the mesh (or add a phase) at the switch |

Mesh refinement makes a direct method trustworthy after the fact. The next lesson steps sideways to a method with no mesh and no defects at all: iLQR, the shooting-flavored alternative, which simulates every trajectory exactly and improves it with a backward sweep instead.

::: context real-tools Who refines meshes for a living
**GPOPS-II**, by Michael Patterson and Anil Rao, is a MATLAB tool that solves optimal control problems with Radau pseudospectral collocation and refines its own mesh: it estimates the error on each mesh interval and then either raises the polynomial degree or splits the interval. **SOCS**, John Betts's Sparse Optimal Control Software developed at Boeing, uses low-order collocation and refines by estimating the local error on each segment. NASA's **Dymos** library also offers automatic grid refinement. None of them asks you for the right number of nodes; they compute it.
:::

::: context mesh-word Why it is called a mesh
In engineering simulation a **mesh** is the net of points and cells a continuous object is cut into so a computer can handle it — a wing cut into thousands of little triangles, for example. A trajectory mesh is the one-dimensional version: the list of node times that cut the flight into segments. **Refining** a mesh means cutting some cells smaller. The same words come back whenever a continuous problem is turned into a finite one, from stress analysis to weather forecasting.
:::

::: context hermite-cubic One cubic, four facts
A cubic polynomial has four numbers to choose, so it can match four facts. The Hermite cubic uses the value and the slope at each end of the segment. Here it is through two points, with the prescribed slopes drawn as short arrows.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="330" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <path d="M60,120 C140,70 220,40 300,70" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="60" y1="120" x2="93.9" y2="98.8" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="102.4,93.5 96.6,103.0 91.3,94.6" fill="#b4232c"/>
  <line x1="300" y1="70" x2="328.1" y2="80.5" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="337.5,84.0 326.3,85.2 329.8,75.9" fill="#b4232c"/>
  <circle cx="60" cy="120" r="5" fill="#1f2a44"/>
  <circle cx="300" cy="70" r="5" fill="#1f2a44"/>
  <text x="60" y="140" font-size="12" fill="#1f2a44" text-anchor="middle">x_k</text>
  <text x="300" y="100" font-size="12" fill="#1f2a44" text-anchor="middle">x_k+1</text>
  <text x="104" y="116" font-size="12" fill="#b4232c">slope f_k</text>
  <text x="250" y="118" font-size="12" fill="#b4232c">slope f_k+1</text>
  <text x="180" y="40" font-size="12" fill="#1d6fd1" text-anchor="middle">cubic between the nodes</text>
</svg>
```

The curve is a cubic Bézier whose inner control points lie along the two end slopes, which is exactly how a Hermite cubic can be drawn: each inner control point sits one third of a segment along the end's tangent.
:::

::: context residual-shape The residual across the switch segment
This is the scaled velocity residual across segment $0$ of the ten-segment solve, computed at $41$ points and drawn to scale. It is zero at both ends and exactly at the middle, where the method checked, and reaches $\pm1.60\times10^{-5}$ near $\tau = 0.2$ and $\tau = 0.8$, where nothing did.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="90" x2="330" y2="90" stroke="#6c7a93" stroke-width="1.2"/>
  <line x1="40" y1="20" x2="40" y2="160" stroke="#1f2a44" stroke-width="1.2"/>
  <polyline points="40.0,90.0 47.2,104.4 54.5,116.5 61.8,126.6 69.0,134.7 76.2,140.9 83.5,145.4 90.8,148.3 98.0,149.6 105.2,149.6 112.5,148.2 119.8,145.7 127.0,142.2 134.2,137.7 141.5,132.4 148.8,126.4 156.0,119.9 163.2,112.8 170.5,105.4 177.8,97.8 185.0,90.0 192.2,82.2 199.5,74.6 206.8,67.2 214.0,60.1 221.2,53.5 228.5,47.4 235.8,42.1 243.0,37.6 250.3,34.0 257.5,31.4 264.8,30.1 272.0,30.0 279.2,31.3 286.5,34.2 293.8,38.7 301.0,44.9 308.2,53.1 315.5,63.2 322.8,75.5 330.0,90.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <g fill="#b4232c"><circle cx="40" cy="90" r="5"/><circle cx="185" cy="90" r="5"/><circle cx="330" cy="90" r="5"/></g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="178">τ = 0</text><text x="185" y="178">τ = 1/2</text><text x="330" y="178">τ = 1</text>
  </g>
  <line x1="36" y1="30" x2="44" y2="30" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="36" y1="150" x2="44" y2="150" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="48" y="34" font-size="11" fill="#1f2a44">+1.6e-5</text>
  <text x="48" y="154" font-size="11" fill="#1f2a44">−1.6e-5</text>
  <text x="200" y="120" font-size="11" fill="#b4232c">red: enforced points, zero by construction</text>
</svg>
```
:::

::: context warm-start Starting from the last answer
A **warm start** begins a solve from a previous answer instead of from scratch. After refinement, the old solution is read off at the new node times — the Hermite cubic gives the states, the straight lines give the controls — and handed to the solver as its first guess. Most of the new mesh is already nearly right, so the solver needs only a few iterations. Lesson fifteen makes warm starting a tool in its own right.
:::

::: context adaptive-step The same trick inside every good integrator
Integrators such as the Runge-Kutta-Fehlberg and Dormand-Prince methods compute two answers for every step, with a lower-order and a higher-order formula that share most of their work, and use the difference as an estimate of the error. If the estimate is too big, they redo the step with a smaller size; if it is tiny, they lengthen the next step. The step-size formula even uses the same root: to cut the error by a factor $r$ with a method whose error grows like $h^{p}$, shrink the step by $r^{1/p}$.
:::

::: context mesh-picture The mesh, before and after
The first seven seconds of the descent, drawn to scale. Top: the uniform ten-segment mesh, whose first segment swallows the switch. Bottom: the mesh after four rounds, with nodes crowding in on the switch at $1.8546\,\mathrm{s}$ and the rest of the flight untouched.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="45" x2="330" y2="45" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="100" x2="330" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="109.5" y1="20" x2="109.5" y2="120" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="109.5" y="14" font-size="11" fill="#b4232c" text-anchor="middle">switch 1.85 s</text>
  <g fill="#1d6fd1">
    <circle cx="30" cy="45" r="4"/><circle cx="174.9" cy="45" r="4"/><circle cx="319.8" cy="45" r="4"/>
  </g>
  <g fill="#1d6fd1">
    <circle cx="30" cy="100" r="4"/><circle cx="78.2" cy="100" r="4"/><circle cx="102.3" cy="100" r="4"/>
    <circle cx="108.4" cy="100" r="4"/><circle cx="114.4" cy="100" r="4"/><circle cx="126.5" cy="100" r="4"/>
    <circle cx="174.7" cy="100" r="4"/><circle cx="319.4" cy="100" r="4"/>
  </g>
  <text x="335" y="49" font-size="11" fill="#1f2a44" text-anchor="end" dy="-12">round 0</text>
  <text x="335" y="104" font-size="11" fill="#1f2a44" text-anchor="end" dy="-12">round 4</text>
  <g font-size="11" fill="#6c7a93" text-anchor="middle">
    <text x="30" y="140">0 s</text><text x="244.3" y="140">5 s</text><text x="330" y="140">7 s</text>
  </g>
</svg>
```
:::

::: context ringing Why junctions ring
Where the true control has a corner or a jump — the edge of a singular arc, a switch between full and zero thrust — a coarse mesh cannot follow it, and a direct solver often answers with a control that zig-zags from node to node near the junction. That zig-zag is called **ringing** or **chattering**. On this kind of problem it is usually a symptom of too little resolution at the junction, not real physics, and it goes away when the estimate-driven refinement concentrates nodes there or a mesh break is placed at the junction.
:::
