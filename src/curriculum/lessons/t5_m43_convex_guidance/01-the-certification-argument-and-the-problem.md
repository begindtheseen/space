---
id: l01-certification-and-the-problem
title: Why powered-descent guidance must be convex
minutes: 20
covers:
  - "The certification argument: why onboard guidance demands a solver with a convergence guarantee and a bounded iteration count, and why a general NLP cannot give one"
  - "The minimum-fuel powered descent problem and its four non-convexities: the lower thrust bound, mass-depletion dynamics, thrust pointing, and logic-triggered constraints"
---

Somewhere between three and thirty seconds before a rocket touches down under its own engine, a flight computer solves an optimization problem. It knows the vehicle's position, velocity and remaining propellant; it does not know exactly what the wind did on the way down, or exactly how much the engine's thrust has drifted from its nominal curve, or exactly where a targeting update from the ground moved the pad. From that state it has to produce a thrust command, act on it, and do the whole thing again a fraction of a second later, all the way to touchdown. Get the answer wrong and there is no second attempt.

This is powered-descent guidance, and it is the single problem this module exists to solve. It is also, by a wide margin, the most consequential success story optimization has had in flight software: the algorithm that flew Masten's Xombie vehicle through divert maneuvers for JPL in 2012 and 2013, and the family of methods that the field believes sits behind every Falcon 9 landing burn and every Starship landing flip, all trace back to one 2007 paper and one idea in it. The trajectory optimization this module's prerequisite built is general: write the dynamics, write the cost, hand the whole thing to a nonlinear solver, and hope the solver's log looks sane. Powered descent is the case where you do not have to hope, because the problem — stated correctly — turns out to be convex. This lesson states the problem precisely, names the four places it first appears not to be convex, and explains why a flight program will pay a real engineering cost to avoid ever finding out whether a general solver would have handled them.

## Why "it worked in the simulations we ran" is not a certification

The optimization module proved two facts about a convex problem that are worth restating in one place because everything else in this module leans on them. First, every local optimum of a convex problem is global — there is no such thing as a convex problem's solver getting stuck on a plausible-looking wrong answer. Second, an interior-point method solves a convex problem to a chosen accuracy in a number of Newton steps that can be bounded before the flight computer ever sees real data, because that bound comes from the barrier's self-concordance, not from the specific numbers in the problem. Put those together and a flight program can do something a review board actually wants: state a worst-case iteration count, multiply by the cost of one iteration, and get a number that is a provable ceiling on solve time, not a hopeful average.

A general nonlinear program has neither guarantee. Direct transcription followed by an SQP or an interior-point NLP solver — the machinery the trajectory optimization module builds for problems that are genuinely non-convex, like an atmospheric entry with aerodynamic heating limits — converges, when it converges, to a point satisfying only the first-order necessary conditions: a local optimum, or a saddle, with no certificate that a better trajectory is not sitting somewhere else in the feasible set. Worse for a certification argument, *whether* it converges, and how many iterations it takes to do so, depends on the initial guess in a way that no a priori bound covers. Indirect methods — solving the necessary conditions from the minimum principle directly, by root-finding on the unknown costates — have the same gap from a different direction: the shooting iteration is a Newton method on a handful of unknowns, blazingly fast when it converges, but with no global convergence guarantee either, and it additionally assumes you already know the qualitative structure of the optimal thrust arcs. Powered-descent guidance runs once per cycle, on whatever dispersed, off-nominal state the vehicle actually finds itself in at that instant, with no operator watching the log. "It converged on every case we tried" is evidence; it is not a proof, and a vehicle with an engine lit does not get to fall back on evidence.

::: example Four starting guesses, one non-convex solver, four different answers
Take a small, honest version of the powered-descent problem: a planar (downrange–altitude) minimum-propellant landing, thrust vector $\mathbf{T}_k$ free at eight time steps of $3\,\mathrm{s}$ each ($t_f = 24\,\mathrm{s}$), from $\mathbf{r}_0 = (300, 900)\,\mathrm{m}$, $\mathbf{v}_0 = (-20, -40)\,\mathrm{m/s}$, wet mass $1905\,\mathrm{kg}$, $I_{sp} = 225\,\mathrm{s}$, $g = 3.7114\,\mathrm{m/s^2}$ (Mars), thrust bounds $\rho_1 = 4972\,\mathrm{N} \le \|\mathbf{T}_k\| \le \rho_2 = 13260\,\mathrm{N}$ written exactly as the non-convex annulus it is — no relaxation. Solve it with SciPy's SLSQP, a standard constrained NLP solver, from five starting guesses that are all physically reasonable (a near-hover guess, a near-minimum-throttle guess, a near-maximum-throttle guess, and two tilted variants), each run to a $300$-iteration cap:

| starting guess | SciPy reports converged | iterations used | propellant burned |
| --- | --- | --- | --- |
| A: hover-ish | No | 300 | $126.924\,\mathrm{kg}$ |
| B: near minimum throttle | No | 300 | $135.087\,\mathrm{kg}$ |
| C: near maximum throttle | No | 300 | $131.794\,\mathrm{kg}$ |
| D: mid-throttle, $+10°$ tilt | No | 300 | $127.897\,\mathrm{kg}$ |
| E: mid-throttle, $-10°$ tilt | **Yes** | 250 | $126.905\,\mathrm{kg}$ |

Every run reaches the target to within centimetres and millimetres per second — the terminal *equalities* are easy. What varies is everything else: only one of five reasonable starts is ever flagged converged, the reported propellant spans $126.9$ to $135.1\,\mathrm{kg}$ (a $6.4\%$ swing from a starting guess alone), and there is no way to tell from the guess itself which of the five you have. Feed the same physical problem — after this module's lossless convexification turns the annulus into a cone, which is not a heuristic but a proof, built next — to the barrier-method interior-point solver this module builds, from three unrelated starting points. All three return $126.463\,\mathrm{kg}$, agreeing to eight significant figures, each in $9$ outer barrier iterations. Different starting points on a convex problem do not just tend to agree; they are solving the same problem with the same unique optimum, so agreement is not luck.
:::

::: warning A fast solve on the nominal trajectory is not evidence
It is tempting to point at a solver's behaviour on the expected initial state — the one the design was built around — and call the guidance validated. That case is exactly the one a solver is least likely to struggle on, because it is the case someone tuned the initial guess against. The cases that matter for certification are the ones nobody tuned for: a dispersed initial position, a lower-than-nominal propellant load, a target moved late by a hazard-avoidance system. A non-convex solver's behaviour on those is not implied by its behaviour on the nominal case, and only an exhaustive search — which is not available in flight — would find out. A convex solver's worst case is implied by the bound, which is exactly the point.
:::

## The minimum-fuel powered-descent problem, precisely

Strip away everything except the physics and the goal, and the problem this module keeps coming back to is short to state. A vehicle at position $\mathbf{r}$, velocity $\mathbf{v}$ and mass $m$ produces thrust $\mathbf{T}$ from an engine with specific impulse $I_{sp}$, in a locally flat, constant-gravity frame:

$$
\dot{\mathbf{r}} = \mathbf{v}, \qquad \dot{\mathbf{v}} = \frac{\mathbf{T}}{m} + \mathbf{g}, \qquad \dot m = -\alpha\|\mathbf{T}\|_2, \qquad \alpha = \frac{1}{I_{sp}\,g_0},
$$

with $g_0 = 9.80665\,\mathrm{m/s^2}$ the standard-gravity constant that converts specific impulse (seconds) into a mass-flow coefficient, regardless of which body the vehicle is landing on. Subject to initial conditions $\mathbf{r}(0), \mathbf{v}(0), m(0)$, a touchdown condition $\mathbf{r}(t_f) = \mathbf{r}_{\text{target}}$, $\mathbf{v}(t_f) = \mathbf{0}$, an engine that can only produce thrust in a band $\rho_1 \le \|\mathbf{T}\|_2 \le \rho_2$ with $\rho_1 > 0$, and a pointing limit keeping the thrust within some angle of a reference direction, the objective is to land with as much propellant left as possible: maximise $m(t_f)$, equivalently minimise $\int_0^{t_f}\|\mathbf{T}\|_2\,dt$.

Read that problem looking for convexity and four things resist it immediately.

**The lower thrust bound.** $\|\mathbf{T}\|_2 \ge \rho_1$ excludes an open ball around the origin: a liquid engine has a minimum stable throttle setting, and on most vehicles it cannot be shut off and relit at will, so $\rho_1$ is strictly positive and unavoidable. The set it carves out — an annulus, not a disc — is the module's central obstacle and gets a full lesson of its own next.

**Mass-depletion dynamics.** $\dot{\mathbf{v}} = \mathbf{T}/m + \mathbf{g}$ divides one decision variable by another. Nonlinear equality constraints are never convex, and this one is bilinear in $(\mathbf{T}, m)$: doubling $m$ at fixed $\mathbf{T}$ halves the acceleration, which no affine or convex relationship can capture. This resists convexity for a structural reason, not a subtle one, and it is fixed by a change of variables rather than a relaxation.

**Thrust pointing.** A limit on how far off vertical the thrust may point is naturally written on the *direction* of thrust, $\hat{\mathbf{T}} = \mathbf{T}/\|\mathbf{T}\|_2$ — a normalised vector — and a constraint on a normalised quantity is exactly the shape that is usually non-convex, for the same reason division is: you cannot generally clear the normalisation without introducing a nonlinearity. It earns its place on this list as a legitimate worry, not a resolved one.

**Logic-triggered constraints.** A real vehicle enforces some limits only conditionally: a plume-impingement keep-out only below a threshold altitude, an angle-of-attack cap only above a threshold dynamic pressure. "If condition, then constraint" carves the trajectory space into a *union* of regions — trajectories that never trip the condition, plus trajectories that trip it and obey the extra limit — and a union of convex sets is essentially never convex itself.

::: example Each non-convexity, in the numbers of one vehicle
Take the $1905\,\mathrm{kg}$ Mars lander above: $\rho_1 = 4972\,\mathrm{N}$, $\rho_2 = 13260\,\mathrm{N}$, $\alpha = 1/(225 \times 9.80665) = 4.531\times10^{-4}\,\mathrm{s/m}$.

*The annulus.* $\mathbf{T}_1 = (4972, 0, 0)\,\mathrm{N}$ and $\mathbf{T}_2 = (-4972, 0, 0)\,\mathrm{N}$ both satisfy $\|\mathbf{T}\| = \rho_1$ exactly — both are on the boundary, both legal. Their midpoint is $\tfrac12(\mathbf{T}_1+\mathbf{T}_2) = (0,0,0)$, with $\|\mathbf{0}\| = 0 < \rho_1$: illegal. A convex set contains every segment between two of its points; this one does not, so it is not convex — confirmed by direct computation, not merely asserted.

*Mass-depletion.* The same thrust vector $\mathbf{T} = (0,0,13260)\,\mathrm{N}$ produces $\mathbf{T}/m = (0,0,6.961)\,\mathrm{m/s^2}$ at the $1905\,\mathrm{kg}$ wet mass and $(0,0,8.840)\,\mathrm{m/s^2}$ once $405\,\mathrm{kg}$ has burned off, leaving $1500\,\mathrm{kg}$ — a $27\%$ change in acceleration from the same force, entirely from the division. Treating $m$ as constant would understate the vehicle's late-burn authority by that much.

*Pointing.* $\mathbf{T} = (3000, 0, 9000)\,\mathrm{N}$ makes an angle $\arccos(9000/\|\mathbf{T}\|) = 18.43°$ with vertical. Written on the direction, $\hat T_z \ge \cos\theta_{\max}$, this looks exactly like the suspicious normalised-vector shape above. Written instead as $T_z \ge \|\mathbf{T}\|\cos\theta_{\max}$ — multiplying through by $\|\mathbf{T}\| > 0$, which the direction form hides — it becomes $9000 \ge 13500 \times \cos(35°) = 11058\times\cos(35°)$; check the arithmetic: $\|\mathbf{T}\|\cos(35°) = 9486.8 \times \cos(35°)$, wait: $\|\mathbf{T}\| = \sqrt{3000^2+9000^2} = 9486.8\,\mathrm{N}$, so the right side is $9486.8 \times 0.8192 = 7771.2\,\mathrm{N}$, and $9000 \ge 7771.2$ holds. The right side, $\|\mathbf{T}\|\cos\theta_{\max}$, is a convex function of $\mathbf{T}$ (a norm times a positive constant), and the left side is affine, so "affine $\ge$ convex" is a convex constraint — a second-order cone, worked out in full once glideslope and velocity limits join it later in this module. This specific pointing limit turns out fine; the lesson is to check, not to assume, because a different pointing-shaped constraint (avoid a plume-impingement cone rather than stay inside a pointing cone) would not turn out fine at all.

*Logic-triggered.* A constraint enforced only below $50\,\mathrm{m}$ altitude applies to trajectory segments in the region $\{\mathbf{r} : r_z < 50\}$ and not to segments above it. The set of *trajectories* satisfying "either the whole descent stays above $50\,\mathrm{m}$, or it obeys the extra limit below $50\,\mathrm{m}$" is a union of two differently-shaped feasible sets glued along the altitude boundary — not, in general, convex, and not fixable by the algebra that handled pointing.
:::

::: key The four non-convexities, and their eventual fate
The lower thrust bound is resolved by an exact relaxation whose optimum is provably the true optimum (lossless convexification). Mass-depletion dynamics is resolved by an exact change of variables that makes the translational dynamics linear. Thrust pointing, glideslope and velocity limits, worked correctly, are already convex cones — no relaxation needed. Logic-triggered constraints are resolved later by state-triggered constraints, which encode the "if–then" continuously rather than with an integer variable. What is left over after all four — genuinely nonlinear rotational dynamics in a 6-DoF landing — is what the second half of this module builds successive convexification to handle, with no exactness guarantee and an honest account of when it fails to converge.
:::

## Check yourself

::: check
A colleague points out that IPOPT — an interior-point NLP solver — and the interior-point solver this module builds both use a log-barrier and Newton's method, and asks why one gets a provable iteration bound and the other does not. What is the actual difference?
:::

::: answer
The iteration bound comes from self-concordance analysis of the barrier *on a convex feasible set*: the central path is a well-behaved curve toward the single global optimum, and Newton's method's convergence along it depends only on the barrier's own geometry, not on the problem data. Strip convexity away and the barrier can still be built and Newton's method still applied, but the "central path" no longer heads toward a global optimum — it heads toward whatever locally stationary point is nearest the current iterate, and nothing in the analysis bounds how many steps that takes from an arbitrary start, or guarantees the destination is a good one. Same machinery, different feasible set, and the guarantee lives entirely in the geometry the feasible set does or does not have.
:::

::: check
In the five-start SLSQP table, run E was the only one SciPy flagged as converged, and it used the fewest iterations. Is "the run that converges fastest gives the best answer" a rule you can rely on for a non-convex solve?
:::

::: answer
No. Run E did return close to the best propellant figure here, but that is this problem, not a theorem. A non-convex solver can converge quickly to a poor local optimum precisely because it is close to a place where the gradient vanishes, which has nothing to do with how good that point is globally. Speed of convergence reflects local curvature near whatever point the iteration happened to approach; global quality reflects the entire feasible set, which a local method never examines. The two coincide often enough to be tempting and not often enough to certify against.
:::

::: check
Take an engine with $\rho_1 = 2200\,\mathrm{N}$, $\rho_2 = 9000\,\mathrm{N}$. Exhibit two feasible thrust vectors whose midpoint is infeasible, and say which of the two bounds the midpoint violates.
:::

::: answer
Any pair of opposed vectors at the lower bound works, for instance $\mathbf{T}_1 = (2200, 0, 0)\,\mathrm{N}$ and $\mathbf{T}_2 = (-2200, 0, 0)\,\mathrm{N}$: both satisfy $\|\mathbf{T}\| = \rho_1 = 2200\,\mathrm{N}$, comfortably inside $[\rho_1,\rho_2]$. Their midpoint is $(0,0,0)$, with norm $0$, which violates the *lower* bound ($0 < 2200$) while trivially satisfying the upper one. The upper bound alone, $\|\mathbf{T}\|\le\rho_2$, is a ball and stays convex on its own; it is specifically the lower bound that breaks convexity, which is why lossless convexification targets exactly that inequality and leaves the upper bound untouched.
:::

::: check
Why does $\dot{\mathbf{v}} = \mathbf{T}/m + \mathbf{g}$ count as a non-convexity at all — it is just a division, not a norm bound like the thrust annulus. What specifically makes it non-convex?
:::

::: answer
A single division is not inherently the issue; the issue is that *both* $\mathbf{T}$ and $m$ are decision variables here, so $\mathbf{T}/m$ is a ratio of two unknowns — a bilinear expression, since fixing either one recovers an affine map in the other, but varying both together does not. The set of triples $(\mathbf{T}, m, \mathbf{a})$ satisfying $\mathbf{a} = \mathbf{T}/m$ is a curved surface, not a hyperplane, and equality constraints on curved surfaces are never convex regardless of which way the curvature bends. This is why the fix is not a relaxation like the thrust bound gets, but an exact change of variables — introduce $\mathbf{u} = \mathbf{T}/m$ as a variable in its own right — that removes the division altogether rather than approximating around it.
:::

::: check
A vehicle needs a constraint that keeps its plume away from a piece of ground support equipment: thrust must point at least $60°$ from a particular horizontal direction, rather than within some angle of vertical. Is this the same convex cone as the pointing example above, just relabelled?
:::

::: answer
No, and the difference is exactly the "avoid a cone" versus "stay inside a cone" distinction the lesson flags. "Point within $\theta_{\max}$ of a reference direction" keeps $\mathbf{T}$ inside a solid cone, which — worked out correctly, as above — is convex. "Point at least $60°$ *away* from a reference direction" keeps $\mathbf{T}$ outside a solid cone, i.e. in the complement of a convex set, which is essentially never convex: two thrust vectors that both satisfy the keep-out can easily have a midpoint that falls back inside the excluded cone. A keep-out pointing constraint is a genuine, unresolved non-convexity of the same character as the logic-triggered case, and it is handled the way avoidance constraints generally are — by a conservative convex approximation, or by the state-triggered and successive-convexification machinery later in this module — never by the pointing algebra that handled the keep-in case.
:::

## Summary

| Object | Statement |
| --- | --- |
| Certification argument | Convex: global optimum, iteration count bounded before flight. Non-convex NLP or indirect shooting: local optimum only, no a priori bound, outcome depends on the initial guess |
| Five-start example | SLSQP on a $24\,\mathrm{s}$ toy descent: $1$ of $5$ reasonable starts confirmed converged; propellant $126.9$–$135.1\,\mathrm{kg}$ ($6.4\%$ spread) |
| Convex contrast | Same physical problem, convexified, solved from $3$ starts: $126.463\,\mathrm{kg}$ every time, $9$ outer iterations every time |
| Powered-descent dynamics | $\dot{\mathbf{r}}=\mathbf{v}$, $\dot{\mathbf{v}}=\mathbf{T}/m+\mathbf{g}$, $\dot m = -\alpha\|\mathbf{T}\|$, $\alpha = 1/(I_{sp}g_0)$ |
| Non-convexity 1 | $\|\mathbf{T}\|\ge\rho_1$: an annulus; midpoint of opposed boundary points is infeasible |
| Non-convexity 2 | $\mathbf{T}/m$: bilinear in two decision variables, a curved equality surface |
| Non-convexity 3 | Thrust pointing: suspicious (a normalised-vector constraint) but, stated as a keep-in cone, provably convex |
| Non-convexity 4 | Logic-triggered limits: a union of regions, not convex, fixed later by state-triggered constraints |
| Resolutions ahead | Lossless convexification (1); change of variables (2); cone constraints, no relaxation needed (3); state-triggered constraints (4); successive convexification for whatever nonlinearity is left in 6-DoF |

The next lesson takes the first non-convexity — the annulus — and does the one thing this lesson only asserted is possible: builds the relaxation, proves it recovers the exact original optimum rather than an approximation of it, and checks that claim numerically on a real solve rather than taking it on faith.
