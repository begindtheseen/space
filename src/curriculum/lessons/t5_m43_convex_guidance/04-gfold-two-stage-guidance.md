---
id: l04-gfold-two-stage-guidance
title: "G-FOLD: the two-stage guidance law, and its flight"
minutes: 20
covers:
  - G-FOLD (Guidance for Fuel-Optimal Large Diverts) and the two-stage minimum-landing-error then minimum-fuel solve
  - The JPL/Masten Xombie flight demonstrations of G-FOLD and what they proved
---

You are running for a bus. It is pulling away, and you already know you will not catch it. What do you do? You do not stop dead in the road. You still run to the stop, because being at the stop is better than being halfway down the street. And once you know you will get there, you stop sprinting and jog, because there is no prize for arriving out of breath.

That is two rules, in a strict order. **First**, get as close as you can. **Second**, among all the ways of getting that close, spend the least effort. You never trade the first for the second.

A lander diverting to a landing site faces exactly this. Every solve in this module so far has quietly assumed the target can be reached. A real flight computer cannot assume that. A navigation error, a gust that pushed the vehicle off its entry path, or a hazard sensor that moved the landing point at the last moment can leave the vehicle somewhere the target is out of reach. **G-FOLD** — **Guidance for Fuel-Optimal Large Diverts**, the landing algorithm built at NASA's Jet Propulsion Laboratory — answers with the bus-stop rule, written as two calls to the solver from the last three lessons. It is also the one member of this family that has flown, and this lesson ends with what that flight proved and what it did not.

## What a single solve cannot do

The minimum-fuel landing of the last two lessons ends with the equality $\mathbf{r}(t_f) = \mathbf{r}_{\text{target}}$: "the final position equals the target." Read $t_f$ as "t sub f", the final time. That one equation hides a promise: that some trajectory within the thrust, mass and time limits actually gets there.

When the promise fails, the problem is **[[infeasible|infeasible]]** — no point satisfies all the constraints at once. The solver then has nothing to return. At best it reports "infeasible". At worst it grinds without converging. Either way, flight software a few seconds above the ground cannot act on "no answer". It needs a defined, useful command for every state the vehicle might really be in, reachable or not.

Two tempting fixes fail, and it helps to see why.

- **Fall back to something else.** "Abort" is rarely possible this close to the ground. And any other fallback is itself a guidance law that needs its own justification.
- **Mix the two goals with a weight.** Minimize $\int\sigma\,dt + w\,\|\mathbf{r}(t_f)-\mathbf{r}_{\text{target}}\|$ — propellant plus $w$ times the miss distance. This never goes infeasible. But what is $w$? It is an exchange rate between meters of miss and kilograms of propellant, and there is no natural one. Different sensible choices give different landings, with no principled way to pick. Worse, $w$ has to be frozen into the flight software before launch, for a dispersion nobody can predict.

## The two-stage law

G-FOLD uses the bus-stop rule instead. It solves two convex programs in a fixed order, on the same constraint set this module has already built. Ordering goals "first this, and only on a tie, that" is called **[[lexicographic|lexicographic]]** ordering — the way a dictionary sorts words by the first letter and only looks at the second letter when the first ones match.

Write $\mathbf{E}$ for the matrix that keeps only the horizontal part of a vector (for a 3-D position $(x, y, h)$ it keeps $(x, y)$). Then $\|\mathbf{E}(\mathbf{r}(t_f)-\mathbf{r}_{\text{target}})\|_2$ is the horizontal miss distance. The altitude at touchdown is still pinned to the ground and the touchdown velocity to zero: the vehicle must land softly somewhere. Only the *where* is let go.

::: key The G-FOLD two-stage law
**Stage 1.** Minimize the horizontal landing error $e = \|\mathbf{E}(\mathbf{r}(t_f)-\mathbf{r}_{\text{target}})\|_2$ subject to every dynamics, thrust and mass constraint from this module — but *not* the equality $\mathbf{r}(t_f)=\mathbf{r}_{\text{target}}$, which is dropped. Call the optimal value $d^\star$ ("d star").

**Stage 2.** Minimize propellant, $\sum_k\sigma_k\Delta t$, subject to the same constraints plus one more: $\|\mathbf{E}(\mathbf{r}(t_f)-\mathbf{r}_{\text{target}})\|_2 \le d^\star$.

Both stages are SOCPs with identical structure, differing only in the objective and one added bound. Lexicographic, so no error-versus-fuel weight has to be invented.
:::

Stage 1's objective is a norm, which is a second-order cone: introduce a new variable $e$ with $\|\mathbf{E}(\mathbf{r}_N-\mathbf{r}_{\text{target}})\|_2\le e$ and minimize $e$. Stage 2's extra bound is the same cone with the right side fixed at the number $d^\star$. So the second solve is a small change of data to the first, not a new problem.

Notice what happens in the two cases.

- **Target reachable.** Stage 1 returns $d^\star = 0$. Stage 2's bound becomes "miss distance at most zero", which is $\mathbf{r}(t_f)=\mathbf{r}_{\text{target}}$ again. Stage 2 *is* the minimum-fuel problem of the last two lessons, recovered as the special case it always was.
- **Target out of reach.** Stage 1 finds the closest point the vehicle can still land at — a real answer, not a failure. Stage 2 then spends the least propellant landing exactly that close. It never trades away accuracy the vehicle could have had, and never burns fuel it does not need.

No weight appears anywhere. The ordering itself carries the mission's priority: land as close as physically possible, and only then worry about propellant.

::: warning Stage 1's thrust slack need not be tight
Stage 1 does not charge for propellant. When the target is reachable, many trajectories tie at zero miss, and the solver may hand back one that wastes fuel — including one with $\sigma_k > \|\mathbf{u}_k\|$, a slack that is not tight. That is not a broken convexification: the tightness argument of lesson two used a cost that rises with propellant, and stage 1 has none. Stage 2 restores that cost, and with it tightness. So check the relaxation gap on the stage-2 answer, the one you fly — and do not be alarmed by a stage-1 gap.
:::

::: example The two stages agree when the target is reachable
Take the Mars lander from this module — $\rho_{\min}=4972\,\mathrm{N}$, $\rho_{\max}=13260\,\mathrm{N}$, $I_{sp}=225\,\mathrm{s}$, wet mass $1905\,\mathrm{kg}$, $g = 3.7114\,\mathrm{m/s^2}$ — starting at $\mathbf{r}_0=(200,0,600)\,\mathrm{m}$ with $\mathbf{v}_0=(-10,3,-25)\,\mathrm{m/s}$, target the origin. Use $N=10$ steps of $\Delta t=2\,\mathrm{s}$, so $t_f=20\,\mathrm{s}$.

**Step 1: stage 1.** The barrier solver returns $d^\star \approx 4\times10^{-12}\,\mathrm{m}$. That is zero to solver precision: the target is reachable. (Its thrust slack is loose — up to $3.5\,\mathrm{m/s^2}$ at one node — exactly as the warning above predicts.)

**Step 2: stage 2.** Add the cap $\|\mathbf{E}\mathbf{r}_N\|_2 \le d^\star + 1\,\mathrm{mm}$. The extra millimeter is a standard practical margin: $d^\star$ is only known to solver precision, and a cap of exactly $4\times10^{-12}\,\mathrm{m}$ leaves an interior-point method no room inside the constraint. Stage 2 burns $108.386\,\mathrm{kg}$, with every $\sigma_k - \|\mathbf{u}_k\|$ below $10^{-7}$.

**Step 3: compare.** Solving the fixed-target minimum-fuel problem directly also gives $108.386\,\mathrm{kg}$.

**Sanity check.** The two answers agree to the displayed digit, as they must when $d^\star = 0$. The two-stage machinery costs one extra solve in the easy case, and gives the same answer. It only starts doing real work when the easy case fails.
:::

## The footprint: where the vehicle can still land

Sweep stage 1 over many starting positions and record which ones return $d^\star=0$. The set of those positions is the **[[reachable landing footprint|footprint]]**: the region from which the target can still be hit. No separate reachability analysis is needed — it is the same convex solve as everything else, read off one number.

::: example How far the footprint reaches
Use the planar lander from this module's very first lesson: downrange and altitude only, $N=8$ steps of $3\,\mathrm{s}$ ($t_f=24\,\mathrm{s}$), altitude $900\,\mathrm{m}$, $\mathbf{v}_0=(-20,-40)\,\mathrm{m/s}$ (moving toward the target at $20\,\mathrm{m/s}$ and falling at $40\,\mathrm{m/s}$), $400\,\mathrm{kg}$ of usable propellant. Move the starting downrange distance $x_0$ and run both stages each time:

| $x_0\,(\mathrm{m})$ | stage 1: $d^\star\,(\mathrm{m})$ | stage 2: propellant $(\mathrm{kg})$ |
| --- | --- | --- |
| $300$ | $0$ | $126.46$ |
| $495$ | $0$ | $143.48$ |
| $600$ | $104.70$ | $143.52$ |
| $1200$ | $704.70$ | $143.53$ |
| $2500$ | $2004.70$ | $143.53$ |

**Step 1: read the reachable rows.** At $300\,\mathrm{m}$ the target is hit, and stage 2 burns $126.46\,\mathrm{kg}$ — the same answer lesson one's convex solve gave for this start. At $495\,\mathrm{m}$ it is still hit, but only by burning much harder.

**Step 2: find the edge.** Subtract the miss from the start: $600 - 104.70 = 495.30$, $1200-704.70 = 495.30$, $2500 - 2004.70 = 495.30$. Every unreachable start lands at the same place: $495.30\,\mathrm{m}$ closer than it began. So the edge of the footprint, in this direction, is $x_0 = 495.30\,\mathrm{m}$.

**Step 3: see why it is a straight line.** Nothing in the dynamics depends on where the vehicle is sideways — gravity and thrust do not care about $x$. Once the target is out of reach, the best the vehicle can do is its hardest possible divert, the same shape from any start, shifted along. Hence $d^\star = x_0 - 495.30\,\mathrm{m}$ beyond the edge.

**Step 4: shrink the tanks.** Repeat with only $125\,\mathrm{kg}$ of usable propellant. The edge moves in to $271.28\,\mathrm{m}$, and the start at $300\,\mathrm{m}$ now misses by $28.71\,\mathrm{m}$. That fits the table: landing from $300\,\mathrm{m}$ needs $126.46\,\mathrm{kg}$, a little more than $125$. Cut the propellant to $115\,\mathrm{kg}$ and even stage 1 has no solution, as the warning below explains.

**Sanity check.** Beyond the edge the propellant is flat at about $143.5\,\mathrm{kg}$. Full throttle for $24\,\mathrm{s}$ burns $13260\times24/(225\times9.80665) = 144.2\,\mathrm{kg}$. So the unreachable cases are flying at nearly full throttle the whole way — flat out, as a vehicle trying its hardest should.
:::

A full footprint map for a flight program sweeps this solve over a fine grid of starting positions and velocities, and repeats it for several propellant loads. Less propellant pulls the edge inward from every direction at once, because less propellant means less authority to fix a bad start, whichever way it is bad.

::: warning Stage 1 can still be infeasible
G-FOLD lets go of *where* the vehicle lands, not *whether* it lands. Stage 1 still demands zero altitude and zero velocity at touchdown, within the propellant carried. A vehicle too low, too fast or too empty to stop at all makes stage 1 infeasible too, as the $115\,\mathrm{kg}$ case shows. That is a genuine emergency no guidance law can solve, and flight software needs a separate fault response for it.
:::

## The Xombie flights: what convex guidance proved by flying

Everything above is mathematics you can check on a laptop. G-FOLD also left the laptop. Under NASA's **[[ADAPT|adapt]]** project — the Autonomous Descent and Ascent Powered-flight Testbed — JPL and **[[Masten Space Systems|masten]]** flew the algorithm on Masten's XA-0.1B **Xombie**, a rocket that takes off and lands vertically, from the Mojave Air and Space Port in California.

The campaign had two parts, and the difference between them matters.

- **2012: ground-planned diverts.** The divert trajectories were computed *on the ground, ahead of time*, then flown. These flights tested whether the vehicle could fly a large sideways divert at all, not whether G-FOLD could run onboard. Across three flights the divert grew to $550\,\mathrm{m}$, then $650\,\mathrm{m}$, then $750\,\mathrm{m}$.
- **2013: onboard G-FOLD.** G-FOLD itself, coded in C, ran on a computer carried by Xombie. It computed the divert *in flight*, from the vehicle's actual state, instead of having it loaded before launch. That is the claim this module has been building toward, tested in the air.

The hardest flight, on 20 September 2013, was built to stress the algorithm, not flatter it. Xombie launched heading diagonally *away* from its landing pad — a stand-in for a badly dispersed approach. At about $290\,\mathrm{m}$ altitude, G-FOLD computed onboard, in roughly $100\,\mathrm{ms}$, a fully three-dimensional path of about $800\,\mathrm{m}$ that reversed direction and crossed back over its own track to reach the pad. The vehicle climbed to about $1200$ feet ($370\,\mathrm{m}$), traveled nearly half a mile downrange at more than $50$ miles per hour ($22\,\mathrm{m/s}$), and touched down within about $9$ inches ($23\,\mathrm{cm}$) of its target.

::: note What this flight history establishes, and what it does not
It establishes that this module's central claim is not only elegant on paper. A second-order-cone landing solve, of the size this module builds and solves on a laptop, ran to convergence on flight hardware, in real time, during an actual rocket flight, more than once — including a flight designed to be a hard case. JPL put the payoff in numbers: for a lander of the Mars Curiosity rover's class, G-FOLD gives about six times the divert range of the guidance that landed Curiosity in August 2012. Curiosity itself targeted a **[[landing ellipse|landing-ellipse]]** about $20\,\mathrm{km}$ by $7\,\mathrm{km}$.

What it does not establish is anything about one company's flight software. Nobody outside SpaceX has published what runs during a Falcon 9 or Starship landing burn, and this module will not claim to know. What can be said is narrower and still substantial: the published algorithm this module derives has flown, on real hardware, computing its own answers in the air.
:::

## Check yourself

::: check
A mission designer proposes dropping stage 1 and always solving the single-stage minimum-fuel problem toward the nominal target: "If it's reachable we get the same answer anyway, so why carry two solves?" What is wrong with the argument?
:::

::: answer
The claim is true exactly in the reachable case — and that is the case where the extra solve is cheapest, since stage 1 returns $d^\star=0$ quickly on an easy problem. The two-stage law exists for the case the proposal ignores. When the target is *not* reachable, the single-stage problem has no feasible point at all, and flight software fed an infeasible problem gets nothing it can fly, at the moment it most needs an answer. The extra solve is not wasted work in the easy case. It is insurance that the hard case has a defined, still-optimal answer — land as close as possible, as cheaply as possible — instead of none.
:::

::: check
Why does stage 1 drop the terminal equality $\mathbf{r}(t_f)=\mathbf{r}_{\text{target}}$, instead of keeping it and simply watching for the solver to report "infeasible"?
:::

::: answer
Because "infeasible" is not something a vehicle can fly. A well-built conic solver can return a certificate proving no trajectory reaches the target, but a certificate says "no" and nothing more: it gives no thrust command, and it does not say how close the vehicle *could* get. Dropping the equality and minimizing the miss distance instead turns "is this reachable?" into an ordinary convex minimization that always has an answer, $d^\star\ge0$, computed by the same machinery as everything else. Reachability is then read off the *value* of $d^\star$ — zero means reachable, positive means not — and in the unreachable case the solve has also produced the best trajectory to fly.
:::

::: check
In the Xombie history, why does the lesson keep the 2012 flights (ground-planned diverts) separate from the 2013 flights (onboard G-FOLD) instead of counting all of them as evidence for one claim?
:::

::: answer
They support two different claims, and lumping them together overstates the weaker one. The 2012 flights show the *vehicle* can fly a large, fast sideways divert and land safely. That is a hardware and flight-control result, and it says nothing about where the trajectory came from, since it was computed on the ground in advance. The 2013 flights show the *algorithm*, running on flight computing hardware, can solve the convex program quickly and reliably enough to fly on, with the trajectory computed after launch from the vehicle's real state. This module's certification argument is about the second claim — a bounded, real-time, onboard solve — so the flights that test it are the ones where G-FOLD ran in the air.
:::

::: check
Stage 2's added constraint is the inequality $\|\mathbf{E}(\mathbf{r}(t_f)-\mathbf{r}_{\text{target}})\|_2 \le d^\star$, not the equality $= d^\star$. Does writing it as an inequality change what stage 2 can return?
:::

::: answer
No. Stage 1 already proved that $d^\star$ is the *smallest* miss distance any trajectory satisfying the other constraints can achieve. So no point of stage 2's feasible set can have a miss below $d^\star$, and "at most $d^\star$" allows exactly the same landing points as "exactly $d^\star$". The inequality cannot be met with room to spare. Writing it as an inequality is a convenience: it is a second-order cone, the kind of constraint the solver already handles, while "a norm equals a number" is not convex at all. Nothing is given away. (In practice the cap is loosened by a tiny margin, such as the millimeter in the example, because $d^\star$ itself is only known to solver precision.)
:::

::: check
In the footprint example, every start beyond the edge missed by exactly $x_0 - 495.30\,\mathrm{m}$. Predict $d^\star$ for $x_0 = 1800\,\mathrm{m}$ without solving anything, and say what would have to change in the problem for this shortcut to stop working.
:::

::: answer
$d^\star = 1800 - 495.30 = 1304.70\,\mathrm{m}$. The shortcut works because nothing in the problem depends on the vehicle's sideways position: gravity, thrust and mass behave the same at any $x$, so the best divert from any unreachable start is the same maneuver, shifted. It stops working as soon as some constraint *does* depend on where the vehicle is. A glideslope cone standing on the landing site is the next lesson's example: it constrains the path relative to the target, so a start far away is shaped differently from a start close in, and the edge need no longer be a simple shift.
:::

## Summary

| Idea | Statement |
| --- | --- |
| The gap in one solve | $\mathbf{r}(t_f)=\mathbf{r}_{\text{target}}$ silently assumes reachability; no flyable answer when it fails |
| Rejected fix | A weighted sum of fuel and miss: no natural exchange rate $w$, and it must be frozen before the dispersion is known |
| G-FOLD stage 1 | Minimize $\|\mathbf{E}(\mathbf{r}(t_f)-\mathbf{r}_{\text{target}})\|_2$ with no terminal-position equality; optimal value $d^\star$ |
| G-FOLD stage 2 | Minimize propellant subject to miss $\le d^\star$; same structure as stage 1, one added cone |
| Reachable case | $d^\star=0$; stage 2 is exactly the single-stage minimum-fuel problem |
| Stage-1 slack | May be loose, since stage 1 does not charge for fuel; check tightness on stage 2 |
| Worked instance | $20\,\mathrm{s}$ lander: $d^\star\approx0$, stage 2 and the direct solve both $108.386\,\mathrm{kg}$ |
| Footprint | Starts with $d^\star=0$; planar $24\,\mathrm{s}$ lander reaches $495.30\,\mathrm{m}$ ($271.28\,\mathrm{m}$ with $125\,\mathrm{kg}$ of propellant) |
| ADAPT | JPL and Masten Space Systems, XA-0.1B Xombie, Mojave |
| 2012 flights | Ground-planned diverts of $550$, $650$, $750\,\mathrm{m}$ |
| 2013 flights | G-FOLD in C, run onboard, computing diverts in flight |
| 20 Sep 2013 | Launched away from the pad; about $800\,\mathrm{m}$ divert computed onboard in about $100\,\mathrm{ms}$; about $1200$ ft up, nearly half a mile downrange, landed within about $9$ in |
| Scale | About six times the divert range of Curiosity-era guidance; Curiosity's ellipse about $20 \times 7\,\mathrm{km}$ |
| Not established | Any specific company's flight software |

The next lesson adds the remaining safety limits — a glideslope, a speed cap and a pointing limit — as cones, and checks that the thrust-bound tightness survives the pointing limit.

::: context infeasible When no answer exists
A problem is **feasible** if at least one point satisfies every constraint, and **infeasible** if none does. Infeasible is different from "hard": no solver, however clever, can return a point that does not exist. Many solvers can instead return a *certificate of infeasibility* — a short mathematical proof that the constraints contradict each other. That is useful on the ground for debugging. In the air it is useless, because a proof is not a thrust command. That is why G-FOLD reshapes the question so that it always has an answer.
:::

::: context lexicographic Sorting like a dictionary
A dictionary puts "cab" before "car" by looking at letters in order: the first letters tie, the second tie, and the third decides. **Lexicographic optimization** does the same with goals. Optimize the first goal. Among everything that ties on it, optimize the second. A later goal can never buy back an earlier one. Sports standings often work this way: rank by points, and use goal difference only to break ties. G-FOLD ranks by miss distance first and propellant second.
:::

::: context footprint The footprint as a picture
Plot the stage-1 miss $d^\star$ against starting distance $x_0$ for the planar lander in the example. It sits at zero out to the edge at $495.30\,\mathrm{m}$, then rises in a straight line with slope one. Every meter farther out is a meter more miss.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="160" x2="300" y2="160" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="160" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="50,160 149.1,160 290,19.1" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="149.1" y1="160" x2="149.1" y2="40" stroke="#b4232c" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="153" y="52" font-size="11" fill="#b4232c">edge 495 m</text>
  <text x="95" y="152" font-size="11" text-anchor="middle" fill="#1f2a44">reachable</text>
  <text x="228" y="110" font-size="11" fill="#1d6fd1">d* = x0 − 495</text>
  <text x="50" y="176" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="250" y="176" font-size="11" text-anchor="middle" fill="#1f2a44">1000</text>
  <text x="290" y="176" font-size="11" text-anchor="middle" fill="#1f2a44">1200</text>
  <text x="170" y="188" font-size="11" text-anchor="middle" fill="#1f2a44">start distance x0 (m)</text>
  <text x="44" y="164" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="44" y="23" font-size="11" text-anchor="end" fill="#1f2a44">705</text>
  <text x="56" y="40" font-size="11" fill="#1f2a44">miss d* (m)</text>
</svg>
```

Both axes use the same scale, $0.2$ pixel per meter, so the rising part is drawn at its true slope of one.
:::

::: context adapt A testbed for landers
ADAPT was a JPL project that used a real, free-flying rocket to test the guidance and navigation a future planetary lander would need — a way to fly Mars landing software on Earth without going to Mars. Its flights were funded partly through NASA's Flight Opportunities program, which buys rides on commercial suborbital vehicles for technology tests. Besides G-FOLD, the same testbed later carried terrain-relative navigation, the camera-based technique that helped the Perseverance rover pick a safe spot in 2021.
:::

::: context masten A small rocket company in the desert
Masten Space Systems was a small company at the Mojave Air and Space Port that built vertical-takeoff, vertical-landing rockets for flight tests. Xombie (XA-0.1B) was one of them: a rocket that could lift off, fly sideways under engine power, and land again on its own legs, like a very small version of a booster landing. That made it a natural stand-in for a lander's last kilometer of descent. Masten won the NASA Lunar Lander Challenge prize in 2009 and later closed in 2022.
:::

::: context landing-ellipse Aiming at an oval, not a point
A Mars lander cannot aim at a spot. Uncertain winds, atmosphere and navigation spread its possible landing points over an oval called the **landing ellipse**, and mission planners must find a site where the whole oval is safe. Curiosity's was about $20\,\mathrm{km}$ long and $7\,\mathrm{km}$ wide, about $12$ by $4$ miles. A lander that can divert hundreds of meters or more near the ground can shrink that oval, or steer away from a rock it sees at the last moment.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="70" rx="150" ry="52.5" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="30" y1="135" x2="330" y2="135" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="148" font-size="11" text-anchor="middle" fill="#1f2a44">20 km</text>
  <line x1="342" y1="17.5" x2="342" y2="122.5" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="338" y="74" font-size="11" text-anchor="end" fill="#1f2a44">7 km</text>
  <circle cx="180" cy="70" r="3" fill="#b4232c"/>
  <text x="186" y="66" font-size="11" fill="#b4232c">aim point</text>
</svg>
```

Drawn to scale: $15$ pixels per kilometer both ways.
:::
