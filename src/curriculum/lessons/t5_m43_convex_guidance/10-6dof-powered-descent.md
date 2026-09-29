---
id: l10-6dof-powered-descent
title: A 6-DoF powered descent, run end to end
minutes: 28
covers:
  - 6-DoF powered descent with quaternion attitude inside the optimization
---

Imagine a leaf blower strapped to your back, pointing straight down through your feet. It can hold you up. But it can only push the way your body faces. If you want to drift to the left, you cannot aim the blower left while you stay upright. You have to lean first, and leaning takes time: you start to tip, you keep tipping, and then you have to stop tipping before you fall over.

Every earlier landing in this module skipped that problem. It treated the thrust as an arrow the optimizer could point anywhere, at any instant, inside the cones of lesson 5. A real rocket is the person with the leaf blower. Its engine is bolted to the airframe, so the thrust points where the vehicle points, and turning the vehicle is itself a motion with its own speed limits.

A model that tracks both kinds of motion is called **[[6-DoF|six-dof-name]]** — six **degrees of freedom**, meaning six independent ways the vehicle can move: three ways to slide (up–down, left–right, forward–back) and three ways to turn. This lesson puts the turning inside the optimization and runs the whole successive-convexification loop of lessons 7 to 9 on it, from a deliberately bad first guess. It reports what really happened in the run, including the parts that did not go cleanly.

## Fourteen numbers for the state

The **state** is everything you need to know right now to predict what happens next. For the leaf-blower person it is: where you are, how fast you are going, how much fuel is left, which way you are leaning, and how fast you are tipping. The 6-DoF lander carries exactly those five things.

- $\mathbf{r}$, the position ($3$ numbers, in meters).
- $\mathbf{v}$, the velocity ($3$ numbers, in m/s).
- $z = \ln m$, the log-mass from lesson 3 ($1$ number).
- $\mathbf{q} = (q_w, q_x, q_y, q_z)$, the **attitude quaternion** ($4$ numbers). Read it as "q". It records which way the vehicle is pointing. A **[[quaternion|quaternion-why]]** is a set of four numbers with length exactly $1$ that describes a rotation. The upright vehicle is $\mathbf{q} = (1, 0, 0, 0)$. A tilt by an angle $\theta$ about a unit axis $\hat{\mathbf{a}}$ is $\mathbf{q} = (\cos\tfrac{\theta}{2},\ \hat{\mathbf{a}}\sin\tfrac{\theta}{2})$ — note the half angle.
- $\boldsymbol{\omega}$, the **body angular rate** ($3$ numbers, in rad/s). Read it "omega". It says how fast the vehicle is turning, measured about its own axes.

That adds up to $3 + 3 + 1 + 4 + 3 = 14$ numbers. The **controls** — the things the guidance chooses — are four numbers: the mass-normalized thrust $\sigma$ (the thrust acceleration, in $\mathrm{m/s^2}$, the same $\sigma$ as lessons 3 to 6) and a commanded angular acceleration $\boldsymbol{\alpha}_{\text{cmd}}$ (in $\mathrm{rad/s^2}$).

::: warning Two alphas
In lesson 3, $\alpha = 1/(I_{sp} g_0)$ is the mass-flow constant. Here $\boldsymbol{\alpha}_{\text{cmd}}$ is a bold vector with a subscript, and it is an angular acceleration. They have nothing to do with each other. The lesson after this one uses a plain $\alpha$ a third way, for angle of attack. Read the subscript and the boldness every time.
:::

## The equations of motion

Here is how each part of the state changes. The dot over a letter means "rate of change", so $\dot{\mathbf{r}}$ is read "r dot".

$$
\dot{\mathbf{r}} = \mathbf{v}, \quad \dot{\mathbf{v}} = \mathbf{R}(\mathbf{q})(0,0,\sigma)^\top + \mathbf{g}, \quad \dot z = -\alpha\sigma, \quad \dot{\mathbf{q}} = \tfrac12\Xi(\mathbf{q})\boldsymbol{\omega}, \quad \dot{\boldsymbol{\omega}} = \boldsymbol{\alpha}_{\text{cmd}}.
$$

Take them one at a time.

The first says position changes at the velocity. Nothing new.

The second is the leaf blower. The engine pushes along the vehicle's own "up" axis, the **[[body frame|body-frame]]** $+\hat{\mathbf{z}}$ axis, with acceleration $\sigma$. In the body's own frame that push is the vector $(0, 0, \sigma)^\top$. The **rotation matrix** $\mathbf{R}(\mathbf{q})$ — a $3\times3$ table of numbers built from the quaternion — turns that body-frame arrow into the ground frame, where gravity $\mathbf{g}$ lives. Lesson 7 showed that every entry of $\mathbf{R}(\mathbf{q})$ is a quadratic in $q_w, q_x, q_y, q_z$. That is the new non-convexity, and it sits right in the middle of the dynamics.

The third is lesson 3's mass equation, unchanged.

The fourth is how the attitude changes. $\Xi$ is the capital Greek letter "xi". It is a $4\times3$ matrix whose entries are the quaternion's own components:

$$
\Xi(\mathbf{q}) = \begin{pmatrix} -q_x & -q_y & -q_z \\ q_w & -q_z & q_y \\ q_z & q_w & -q_x \\ -q_y & q_x & q_w \end{pmatrix}.
$$

So $\dot{\mathbf{q}}$ is a product of the attitude and the rate — bilinear, the same shape $\mathbf{T}/m$ had before lesson 3 fixed it. Here no substitution fixes it.

The fifth says the turning rate changes at the commanded angular acceleration.

### Where the thrust bound went

Something quietly good happened in the second equation. The thrust arrow is $\mathbf{R}(\mathbf{q})(0,0,\sigma)^\top$, and a rotation never changes a vector's length. So the thrust acceleration has length exactly $\sigma$, always. The bound on thrust becomes a bound on one positive number, $\rho_{\min} \le m\sigma \le \rho_{\max}$, written in log-mass with the same $\mu_1, \mu_2$ expansions as lesson 3. There is no annulus any more and nothing to relax.

The non-convexity did not disappear, though. It moved. In 3-DoF the hard part was the *length* of a freely pointed thrust vector. In 6-DoF the length is easy and the *direction* is the hard part, because it comes out of $\mathbf{R}(\mathbf{q})$. Lossless convexification has no answer for that. Successive convexification does.

::: key The 6-DoF model inside the optimization
State ($14$): $\mathbf{r}, \mathbf{v}, z, \mathbf{q}, \boldsymbol{\omega}$. Control ($4$): $\sigma, \boldsymbol{\alpha}_{\text{cmd}}$.

$\dot{\mathbf{v}} = \mathbf{R}(\mathbf{q})(0,0,\sigma)^\top + \mathbf{g}$ and $\dot{\mathbf{q}} = \tfrac12\Xi(\mathbf{q})\boldsymbol{\omega}$ are the two nonlinear equations; SCvx linearizes them about a reference each iteration. The thrust magnitude is $\sigma$ exactly, so the lower thrust bound needs no relaxation.
:::

::: example Where a tilted vehicle's thrust goes
The vehicle is tilted $6°$ about its pitch axis (the body $y$ axis) and thrusts at $\sigma = 5.0\,\mathrm{m/s^2}$ on Mars, $\mathbf{g} = (0, 0, -3.7114)\,\mathrm{m/s^2}$.

**The quaternion.** Half the angle is $3°$. So $\mathbf{q} = (\cos 3°, 0, \sin 3°, 0) = (0.99863, 0, 0.05234, 0)$.

**The thrust arrow.** For a tilt $\theta$ about $y$, $\mathbf{R}(\mathbf{q})(0,0,\sigma)^\top = (\sigma\sin\theta, 0, \sigma\cos\theta)$. With $\theta = 6°$: $(5.0 \times 0.10453,\ 0,\ 5.0 \times 0.99452) = (0.5226,\ 0,\ 4.9726)\,\mathrm{m/s^2}$.

**Add gravity.** $\dot{\mathbf{v}} = (0.5226,\ 0,\ 4.9726 - 3.7114) = (0.5226,\ 0,\ 1.2612)\,\mathrm{m/s^2}$.

**Sanity check.** The length of the thrust arrow is $\sqrt{0.5226^2 + 4.9726^2} = 5.000$, exactly $\sigma$, as a rotation must give. A small tilt gives a small sideways push: $\sin 6° \approx 0.105$, about a tenth of the thrust. And the vertical part lost only $1 - \cos 6° \approx 0.5\%$. Tilting costs almost nothing upward at first, but that cost grows fast with the angle — the next example comes back to it.
:::

## Keeping the quaternion honest

A quaternion only means a rotation if its length is exactly $1$. The attitude equation respects that. The rate $\dot{\mathbf{q}}$ is always at right angles to $\mathbf{q}$ itself, so in exact continuous time the length never changes.

But a computer takes steps. Take one straight-line step of length $\Delta t$ ("delta t", the time step): $\mathbf{q}_{k+1} = \mathbf{q}_k + \Delta t\,\dot{\mathbf{q}}_k$. That step goes off along a tangent to the sphere of unit quaternions, and a tangent always leaves the sphere. So the new quaternion is a little too long.

::: example How far one step drifts
Start upright, $\mathbf{q} = (1, 0, 0, 0)$, turning at $\boldsymbol{\omega}_0 = (0.015, 0, 0)\,\mathrm{rad/s}$ — the starting rate of this lesson's landing. Use $\Delta t = 2\,\mathrm{s}$.

**The rate.** The first column of $\Xi$ at the upright attitude is $(0, 1, 0, 0)$, so $\dot{\mathbf{q}} = \tfrac12 \times 0.015 \times (0, 1, 0, 0) = (0, 0.0075, 0, 0)$ per second.

**One step.** $\mathbf{q}_1 = (1, 0, 0, 0) + 2 \times (0, 0.0075, 0, 0) = (1, 0.015, 0, 0)$.

**Its length.** $\sqrt{1^2 + 0.015^2} = 1.000112$.

The error is about $1.1 \times 10^{-4}$ per step: small, but it adds up over many steps and it makes $\mathbf{R}(\mathbf{q})$ stretch vectors slightly. The fix is to **[[renormalize|renormalize]]** — divide $\mathbf{q}$ by its length — after every propagation step, and to keep the optimizer's attitude close to the unit sphere with the trust region.

**Sanity check.** The vehicle turned $0.015 \times 2 = 0.03\,\mathrm{rad}$, about $1.7°$. The quaternion's $x$ part is $0.015$, which is $\sin(0.015)$ to four places — half the angle, as the half-angle rule says.
:::

::: note Why the length stays exactly 1 in continuous time
The squared length is $\mathbf{q}^\top\mathbf{q}$. Its rate of change is $2\mathbf{q}^\top\dot{\mathbf{q}} = \mathbf{q}^\top\Xi(\mathbf{q})\boldsymbol{\omega}$. Multiply out $\mathbf{q}^\top\Xi(\mathbf{q})$ column by column. The first column gives $-q_wq_x + q_xq_w + q_yq_z - q_zq_y = 0$, and the other two cancel the same way. So $\mathbf{q}^\top\Xi(\mathbf{q}) = \mathbf{0}$, the length never changes, and $\|\dot{\mathbf{q}}\| = \tfrac12\|\boldsymbol{\omega}\|$ for a unit $\mathbf{q}$ (because $\Xi^\top\Xi = \mathbf{I}$ then). That is also where the step's drift came from: $\|\mathbf{q}_1\|^2 = 1 + (\Delta t\,\|\boldsymbol{\omega}\|/2)^2$.
:::

## Two simplifications, stated up front

This model is honestly 6-DoF: attitude and rate are real states, and the thrust direction really depends on them. But two shortcuts keep the bookkeeping small, and it is better to name them now.

- **The engine is fixed along the body axis.** There is no separate **[[gimbal|gimbal]]** deflection on top of the attitude, so attitude alone steers the thrust. A real vehicle usually adds a few degrees of gimbal. That changes the size of the control vector, not the structure of the problem.
- **Angular acceleration is commanded directly.** A real actuator (thrusters, or the torque from a gimballed engine) produces a torque, and the vehicle's inertia turns torque into angular acceleration. This model skips that step.

A flight-grade model adds the inertia and the gimbal on top of exactly this skeleton, not in place of it.

## The landing problem

The vehicle starts tilted, sliding and turning:

- position $\mathbf{r}_0 = (12, 0, 28)\,\mathrm{m}$ (12 m downrange, 28 m up);
- velocity $\mathbf{v}_0 = (-2, 0, -4)\,\mathrm{m/s}$;
- a $6°$ tilt about the pitch axis;
- body rate $\boldsymbol{\omega}_0 = (0.015, 0, 0)\,\mathrm{rad/s}$;
- wet mass $1905\,\mathrm{kg}$.

It must reach the origin at rest, upright and not turning: $\mathbf{r}_N = \mathbf{0}$, $\mathbf{v}_N = \mathbf{0}$, $\mathbf{q}_N = (1, 0, 0, 0)$, $\boldsymbol{\omega}_N = \mathbf{0}$. The flight is cut into $N = 4$ to $6$ steps of $2\,\mathrm{s}$. The thrust bounds are convexified as before, and there is a bound on the commanded angular acceleration. The time step is fixed here; making the flight time free is the dilation trick of lesson 9, and it adds one more column to the same Jacobians.

The first reference for SCvx is a **straight-line guess**, the simplest one with no right to be good: position, velocity and body rate go in straight lines from start to target, attitude slides toward upright (renormalized), and thrust stays at a constant, roughly hovering value. No real vehicle could fly it.

## What the linear model forgets

Before running the loop, it helps to see what the linearization of the thrust direction actually looks like. Linearize $\mathbf{R}(\mathbf{q})(0,0,\sigma)^\top$ about the upright attitude, holding $\sigma$ fixed. The first-order model is

$$
\mathbf{R}(\mathbf{q})(0,0,\sigma)^\top \approx (2\sigma q_y,\ -2\sigma q_x,\ \sigma).
$$

Read it in words: tilting gives a sideways push that grows in proportion to the tilt, and the upward part stays at $\sigma$ no matter what. That last part is wrong. A tilted engine loses vertical push as $\sigma\cos\theta$, the **[[cosine loss|cosine-loss]]**, and a straight line cannot see a cosine bending away.

::: example The error grows faster than the tilt
Hold $\sigma = 5.0\,\mathrm{m/s^2}$ and tilt about $y$ by $\theta$. The true thrust arrow is $(\sigma\sin\theta, 0, \sigma\cos\theta)$. The linear model gives $(2\sigma\sin\tfrac{\theta}{2}, 0, \sigma)$.

| tilt $\theta$ | true $(x, z)$ in $\mathrm{m/s^2}$ | linear $(x, z)$ in $\mathrm{m/s^2}$ | error in $\mathrm{m/s^2}$ | velocity error after $2\,\mathrm{s}$ |
| --- | --- | --- | --- | --- |
| $6°$ | $(0.523, 4.973)$ | $(0.523, 5.000)$ | $0.027$ | $0.055\,\mathrm{m/s}$ |
| $15°$ | $(1.294, 4.830)$ | $(1.305, 5.000)$ | $0.171$ | $0.34\,\mathrm{m/s}$ |
| $30°$ | $(2.500, 4.330)$ | $(2.588, 5.000)$ | $0.676$ | $1.35\,\mathrm{m/s}$ |

**Read the table.** Going from $6°$ to $30°$ is five times the tilt, and the error grows about $25$ times ($0.676 / 0.027 \approx 25$). That is the square law lesson 7 found: error grows with the square of the distance from the reference.

**Sanity check.** Almost all the error is in the upward column: $5.000 - 4.330 = 0.670$ of the $0.676$ at $30°$. That is the cosine loss the linear model cannot see.
:::

This is why the trust region matters so much here. A reference that is upright and a candidate that tilts $30°$ are far apart, and the linear model lies by more than a meter per second every two seconds.

## What the first iterations actually do

The next two examples are measurements, not hand calculations. They were recorded from one run of this module's own teaching solver: a dense **[[barrier method|barrier-method]]** written in plain Python, on a shared machine. The counts are what that run logged. The times are that machine's, and yours will differ. The terminal "error" is a single number that rolls the position miss (in meters) and the velocity miss (in m/s) into one norm, so read it as a size, not a distance.

::: example A reference the loop correctly refuses
Run the $N = 6$ case with a generous starting trust region: $\Delta_{\mathbf{x}} = 40$ on the states and $\Delta_{\mathbf{u}} = 6$ on the controls ($\Delta$ is "delta", the trust-region radius of lesson 8). The point is to see what happens before the trust region is doing much restraining.

**Iteration 1.** The subproblem takes $70\,\mathrm{s}$ and $168$ Newton steps. The virtual control has fallen to a modest $0.10$. Then comes the check lesson 9 insists on: take the candidate's *controls* and re-simulate them through the true nonlinear dynamics. The combined terminal error is $54.7$. That is a real trajectory, but nowhere near the target. Computing $\rho$ ("rho", actual improvement over predicted improvement) confirms the linear model over-promised badly. The step is rejected and the trust region shrinks.

**Iteration 2.** With $\Delta_{\mathbf{x}} = 15$ and $\Delta_{\mathbf{u}} = 3$, the subproblem returns in $2.8\,\mathrm{s}$ and only $10$ Newton steps. A tighter trust region makes a smaller, better-behaved feasible set, so it is far cheaper. But the step is still rejected: $\rho < 0$, and the true terminal error is now $89.5$.

**The outcome.** Two iterations, two honest rejections. In that run the radius kept shrinking and fell from $40$ to below $2$ before a step was accepted.
:::

This is not a failure of the method. It is the method working as designed on a hard first reference. The tilt table shows why: the linearization error grows with the square of the distance from the reference, and $40$ units of state deviation is far past where it stays small. The trust-region rule's whole job is to notice this and correct it with no human in the loop. On this run it did.

::: example Necessary, and visibly not sufficient
A second, smaller run uses $N = 4$ and a gentler start (smaller tilt, shorter reach). It accepts on its very first iteration. The virtual control falls to $3.7 \times 10^{-4}$ — essentially zero, the signal lessons 7 and 8 said to watch for.

Now re-simulate that accepted candidate's controls through the true nonlinear dynamics anyway. The terminal error is $74.8$. Not small.

**What happened.** Near-zero virtual control says the *linearized* dynamics were satisfied almost exactly. It says nothing about whether that linearization, correct at the reference, stayed correct all the way out to where this trajectory actually went, over four steps whose errors pile on top of each other.

So: **virtual control near zero is necessary for trusting an iterate, and this run is direct evidence that it is not sufficient.** The true-dynamics check is not a formality added for rigor's sake. It is the check that catches exactly this case.
:::

::: warning What "the solve took 70 seconds" does and does not mean
None of these times is a flight timing claim. The teaching solver re-factors a full dense matrix at every Newton step, runs uncompiled, and shares its machine — every choice real-time flight code rules out.

What the numbers *do* show honestly is how much the Newton-step count swings with how well-posed a linearization is: $10$ steps for an easy subproblem, $758$ for a harder one in this lesson's runs. So an SCvx subproblem's cost is not the steady, nearly data-independent number a single convex SOCP solve gives you. Lesson 12 works out what a sparse, code-generated version costs against a real guidance cycle.
:::

## Reading the run as a whole

Read these runs the way a flight program reads the log of a **[[dispersion campaign|dispersion-campaign]]**, not as one lucky case. In the $N = 6$ run, the trust-region test refused a reference too far from any flyable trajectory, at a real, measured cost. In the $N = 4$ run, a step with virtual control at noise level still needed the true-dynamics check, which caught a large error the virtual-control number missed. Neither run is a finished landing. Both are the kind of evidence a certification argument has to be built from: not "it worked", but a record of what each safeguard caught, with numbers.

::: key What this run demonstrates
Successive convexification's safeguards are not decorative. In a real 6-DoF solve, the trust-region test rejected two genuinely bad steps from a deliberately naive reference, at a cost in Newton steps and time that varied by nearly two orders of magnitude between easy and hard subproblems. And an accepted step with near-zero virtual control still carried a large true-dynamics error ($74.8$), confirming that virtual control is a necessary, not sufficient, signal.
:::

## Check yourself

::: check
The $N = 6$ run's second iteration solved in $2.8\,\mathrm{s}$ with only $10$ Newton steps — far cheaper than the first iteration's $70\,\mathrm{s}$ and $168$ steps — and was still rejected. Does the cheap solve tell you anything about whether the answer was good?
:::

::: answer
No, and mixing the two up is a real trap. Solve time and Newton-step count say how easy the subproblem was to solve. Here the much smaller trust region made a smaller, better-behaved feasible set, which is why it solved faster.

Whether the candidate is a *good step* is a separate question, and only $\rho$ answers it: the true improvement divided by the predicted improvement. A fast solve of a small, easy subproblem can describe a trajectory the true dynamics reject just as firmly as a slow solve of a big one. That is exactly what happened.
:::

::: check
Why must the check re-simulate the *controls* of the accepted $N = 4$ candidate through the true dynamics, instead of reading off the candidate's states directly?
:::

::: answer
The candidate's *states* satisfy the linearized dynamics almost exactly by construction — that is what near-zero virtual control means. Reading them back only confirms that the linear model agrees with itself.

The candidate's *controls* are a real command sequence a vehicle could apply. Propagating them from the true initial state through the actual nonlinear, $\mathbf{R}(\mathbf{q})$-coupled dynamics is the only step in the whole pipeline that consults the real physics instead of a local model of it. The $74.8$ gap lives entirely in the difference between those two things. Checking states instead of re-simulating controls would have hidden it completely.
:::

::: check
Suppose the teaching solver were replaced by a sparse, flight-representative implementation of the same subproblem, and the $N = 6$ run's two rejections still happened, only faster. Would that change how a certification argument should treat this run?
:::

::: answer
The *speed* would change: a flight-representative solver would reach the same reject decisions in milliseconds instead of tens of seconds. That is the whole point of the real-time engineering in lesson 12.

The *substance* would not change. Two genuinely bad candidate steps were correctly identified and refused, from a reference chosen to be hard on purpose. A certification argument cares whether the safeguards catch what they are meant to catch, and this run shows that regardless of how fast the hardware is. The timing matters for a different question: whether the whole loop fits inside a guidance cycle.
:::

::: check
A propagation code steps the attitude $20$ times with $\Delta t = 2\,\mathrm{s}$ at a steady rate $\|\boldsymbol{\omega}\| = 0.015\,\mathrm{rad/s}$, and never renormalizes. Roughly how long does the quaternion end up? What goes wrong physically?
:::

::: answer
Each step multiplies the length by $\sqrt{1 + (\Delta t\,\|\boldsymbol{\omega}\|/2)^2} = \sqrt{1 + 0.015^2} \approx 1.0001125$. After $20$ steps the length is about $1.0001125^{20} \approx 1.00225$.

Written in its all-quadratic form, every entry of $\mathbf{R}(\mathbf{q})$ is a product of two quaternion components, so the matrix scales with the length squared. The thrust arrow comes out about $1.0045$ times too long ($1.00225^2 \approx 1.0045$) — roughly half a percent of phantom thrust that the vehicle does not have. Renormalizing after every step removes it.
:::

::: check
The linear model of the thrust direction keeps the upward part at $\sigma$ for every tilt. If the optimizer finds that a $30°$ tilt helps it reach the target, which way is it fooled, and what stops it from exploiting that?
:::

::: answer
The linear model thinks a $30°$ tilt still delivers the full $5.0\,\mathrm{m/s^2}$ upward, when the truth is $4.33\,\mathrm{m/s^2}$. So it believes large tilts are free sideways pushes with no loss of lift, and it will over-use them. The vehicle would sink faster than planned — about $1.35\,\mathrm{m/s}$ of extra downward speed per two-second step at $30°$.

The trust region stops it. It keeps each iterate's attitude close to the reference's, where the linear model is accurate, and the $\rho$ test shrinks the region whenever the true re-simulation shows the model over-promised.
:::

## Summary

| Object | Statement |
| --- | --- |
| State / control | $14$ states ($\mathbf{r}, \mathbf{v}, z, \mathbf{q}, \boldsymbol{\omega}$); $4$ controls ($\sigma, \boldsymbol{\alpha}_{\text{cmd}}$) |
| Nonlinear pieces | $\dot{\mathbf{v}} = \mathbf{R}(\mathbf{q})(0,0,\sigma)^\top + \mathbf{g}$ (quadratic in $\mathbf{q}$); $\dot{\mathbf{q}} = \tfrac12\Xi(\mathbf{q})\boldsymbol{\omega}$ (bilinear) |
| Thrust bound | Magnitude is $\sigma$ exactly; the non-convexity moved from the thrust length to its direction |
| Quaternion length | Exactly $1$ in continuous time ($\mathbf{q}^\top\Xi = \mathbf{0}$); a discrete step drifts by $\sqrt{1 + (\Delta t\|\boldsymbol{\omega}\|/2)^2}$, so renormalize |
| Linear model's blind spot | $(2\sigma q_y, -2\sigma q_x, \sigma)$ misses the cosine loss; error grows with the square of the tilt |
| Simplifications | Thrust fixed along the body axis (no gimbal); angular acceleration commanded directly (no inertia) |
| $N = 6$, wide trust region | Iteration 1: $70\,\mathrm{s}$, $168$ Newton steps, rejected, error $54.7$. Iteration 2: $2.8\,\mathrm{s}$, $10$ steps, rejected, error $89.5$ |
| $N = 4$, gentler start | Accepted with virtual control $3.7 \times 10^{-4}$, yet true terminal error $74.8$ |
| Core finding | Small virtual control is necessary, not sufficient; only re-simulating the controls through the true dynamics catches the gap |
| What varies wildly | Newton steps per subproblem: $10$ to $758$ in these runs |
| What these numbers are not | A flight timing claim; the teaching solver is dense and uncompiled on purpose |

The next lesson adds the last of the four non-convexities from lesson 1 — logic, "enforce this limit only when that is true" — and hands it to the same SCvx loop. Lesson 12 then turns to whether that loop can be proven to converge and what it costs to run inside a real guidance cycle.

::: context six-dof-name Counting the ways to move
A **degree of freedom** is one independent way something can move. A bead on a wire has one. A hockey puck on ice has three: slide two ways and spin. A rigid body in space has six: slide along three axes and turn about three. Engineers call the turns roll, pitch and yaw. A "3-DoF" landing model keeps only the three slides and treats the vehicle as a point with a freely aimed thrust. A "6-DoF" model keeps all six.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="150" y="70" width="60" height="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="70" x2="180" y2="18" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="180,12 175,22 185,22" fill="#1d6fd1"/>
  <line x1="210" y1="100" x2="290" y2="100" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="296,100 286,95 286,105" fill="#1d6fd1"/>
  <line x1="150" y1="130" x2="100" y2="165" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="95,168 101,158 106,166" fill="#1d6fd1"/>
  <path d="M 164 30 A 16 6 0 1 0 196 30" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <path d="M 262 86 A 6 16 0 1 1 262 114" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <path d="M 112 142 A 14 8 0 1 0 132 160" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="192" y="16" font-size="12" fill="#1f2a44">z</text>
  <text x="300" y="104" font-size="12" fill="#1f2a44">x</text>
  <text x="80" y="170" font-size="12" fill="#1f2a44">y</text>
  <text x="20" y="40" font-size="12" fill="#1d6fd1">3 slides (blue)</text>
  <text x="20" y="58" font-size="12" fill="#b4232c">3 turns (red)</text>
</svg>
```
:::

::: context quaternion-why Why the half angle
A tilt of $\theta$ puts $\cos\tfrac{\theta}{2}$ and $\sin\tfrac{\theta}{2}$ into the quaternion, not $\cos\theta$ and $\sin\theta$. The reason is that a quaternion rotates a vector by being multiplied in twice, once on each side ($\mathbf{q}\,\mathbf{v}\,\mathbf{q}^{*}$), so each side supplies half the turn. One odd result: $\mathbf{q}$ and $-\mathbf{q}$ give exactly the same attitude, because the two minus signs cancel. Flight software usually picks the one with $q_w \ge 0$ so that small rotations look like small numbers — and a $6°$ tilt gives $q_y = \sin 3° \approx 0.052$.
:::

::: context body-frame Two sets of axes
The **ground frame** is fixed to the landing site: $z$ up, $x$ downrange. The **body frame** is glued to the vehicle and turns with it: its $z$ axis runs up through the engine's thrust line. The engine always pushes along body $+z$, but gravity and the target are described in the ground frame. The rotation matrix $\mathbf{R}(\mathbf{q})$ is the translator between the two.
:::

::: context renormalize Pulling the quaternion back to length 1
To **renormalize** means to divide a vector by its own length, so it has length exactly $1$ again. The picture: a sphere of radius $1$ holds every valid attitude. A straight-line step slides off along the tangent, a little outside the sphere. Renormalizing pulls it straight back in toward the center until it lands on the surface. It changes the direction by a hair and the length back to exactly $1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M 30 160 A 140 140 0 0 1 310 160" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="170" y1="160" x2="170" y2="20" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <circle cx="170" cy="20" r="4" fill="#1f2a44"/>
  <line x1="170" y1="20" x2="270" y2="20" stroke="#b4232c" stroke-width="2"/>
  <circle cx="270" cy="20" r="4" fill="#b4232c"/>
  <line x1="270" y1="20" x2="170" y2="160" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <circle cx="251.4" cy="46.0" r="4" fill="#1d6fd1"/>
  <text x="120" y="16" font-size="12" fill="#1f2a44">q now</text>
  <text x="276" y="18" font-size="12" fill="#b4232c">after a step</text>
  <text x="262" y="60" font-size="12" fill="#1d6fd1">renormalized</text>
  <text x="100" y="150" font-size="12" fill="#1d6fd1">unit sphere, |q| = 1</text>
</svg>
```

The step in the picture is exaggerated so it can be seen; its length error is about $0.23$, while the lesson's real step drifts by about $0.0001$ — some $2000$ times less.
:::

::: context gimbal Swivelling the engine
A **gimbal** is a pivot mount that lets an engine swivel a few degrees in two directions, so the thrust can point slightly away from the body axis. It is how most rockets steer: a Falcon 9 booster's engines gimbal. Swivelling the thrust off the center of mass also makes a torque that turns the vehicle, which is why a real model couples gimbal angle, attitude and angular acceleration. This lesson leaves the gimbal out and lets attitude do all the aiming.
:::

::: context cosine-loss Leaning costs lift
Tilt a push of length $\sigma$ by an angle $\theta$ and only $\sigma\cos\theta$ of it points up. The straight-line model keeps the whole $\sigma$ pointing up. At small tilts the two nearly agree; at $30°$ the model is $0.67\,\mathrm{m/s^2}$ too optimiztic. The picture is drawn to scale with $\sigma = 5$: the red arrow is the truth, the dashed arrow is what the linear model believes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="175" x2="340" y2="175" stroke="#6c7a93" stroke-width="1"/>
  <line x1="60" y1="175" x2="60" y2="15" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="60" y1="175" x2="137.6" y2="25" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="137.6" cy="25" r="3.5" fill="#1d6fd1"/>
  <line x1="60" y1="175" x2="135" y2="45.1" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="135" cy="45.1" r="3.5" fill="#b4232c"/>
  <line x1="135" y1="45.1" x2="135" y2="25" stroke="#1f2a44" stroke-width="1"/>
  <line x1="130" y1="25" x2="140" y2="25" stroke="#1f2a44" stroke-width="1"/>
  <path d="M 60 125 A 50 50 0 0 1 85 131.7" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="68" y="118" font-size="12" fill="#1f2a44">30°</text>
  <text x="150" y="30" font-size="12" fill="#1d6fd1">linear model: up part 5.00</text>
  <text x="150" y="52" font-size="12" fill="#b4232c">truth: up part 4.33</text>
  <text x="150" y="110" font-size="12" fill="#1f2a44">gap 0.67 m/s² = cosine loss</text>
</svg>
```
:::

::: context barrier-method The solver inside each iteration
Each SCvx subproblem is a convex cone program, solved here by a **barrier method**, a kind of interior-point method. It replaces each inequality with a steep wall that pushes the solution away from the boundary, then takes **Newton steps** — each one solves a big linear system — to walk down to the best point, lowering the walls a little each round. So there are two nested loops: SCvx iterations outside, Newton steps inside each one. The "168 Newton steps" in the run is the inner count for one outer iteration.
:::

::: context dispersion-campaign Thousands of landings, not one
A **dispersion campaign**, also called a Monte Carlo campaign, runs the guidance on thousands of simulated flights, each starting from slightly different conditions drawn at random: position, velocity, mass, wind, engine performance. Engineers then study the whole log — the worst case, the failures, what each safeguard caught — instead of the one flight that happened to look good. Flight programs base their confidence on these campaigns, and lesson 12 uses them to size an iteration cap.
:::
