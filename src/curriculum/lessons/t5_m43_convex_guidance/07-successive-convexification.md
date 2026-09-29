---
id: l07-successive-convexification
title: "Successive convexification: the idea and its price"
minutes: 22
covers:
  - "Successive convexification (SCvx): linearise about a reference, solve, update, repeat"
---

Picture driving a winding mountain road at night. Your headlights reach about fifty meters. You cannot see the whole road, so you do something clever without thinking about it: you treat the lit stretch in front of you as if it were straight, steer for it, drive a little way, and look again. Every few seconds you make a fresh straight-line guess from wherever you now are. On a gentle road this works beautifully. On a hairpin bend, if you trust the straight-line guess too far, you drive off the edge.

That is the whole idea of this lesson. When a problem is curved in a way no trick can straighten, you approximate it by a straight-line (linear) version near where you are, solve that, move, and repeat. In guidance this is called **[[successive convexification|scvx-origin]]**, or **SCvx** — solving a hard curved problem as a chain of easy convex ones, each built around the answer to the one before.

Everything in this module up to now has been, in a precise sense, free. Lossless convexification is not an approximation. The change of variables is exact. The mass bounds cost a checked fraction of a percent. The flight-time search sits outside an inner solve that is still certified. It would be natural to expect the rest of powered-descent guidance to work the same way. It does not. A vehicle whose *attitude* — which way it is pointing — is part of the optimization brings in curves that no relaxation removes. SCvx handles them, but it pays with exactly what the first half of this module was built to avoid: no guarantee of the global optimum, no bound on how many rounds it takes, and a real chance of not converging at all. This lesson introduces the idea and is honest about that price from the start.

## What stays curved once the rocket can turn

So far the module has treated the rocket as a point with a thrust arrow you could aim anywhere, inside the cones already built. That is a **3-DoF** model — three **degrees of freedom**, the three directions the point can move. A real vehicle cannot swing its thrust arrow around freely. The thrust comes out of an engine bolted to the airframe, and the airframe has to rotate to point it. Add the three ways the body can rotate and you get a **[[6-DoF|six-dof]]** model: six degrees of freedom, three for moving and three for turning.

To describe which way the body points, guidance software uses a **[[unit quaternion|quaternion]]** $\mathbf{q}=(q_w,q_x,q_y,q_z)$ — four numbers that together encode a rotation, with the rule that their squares add to one. Read $q_w$ as "q sub w". Alongside it goes the **angular velocity** $\boldsymbol{\omega}$ (read "omega"), how fast the body is spinning about each axis, in radians per second. Both are now part of the state the optimizer chooses.

Three new things arrive with them, and each one resists every tool this module has used so far.

**The rotation itself.** Say the engine points along the body's own $+\hat{\mathbf{z}}$ axis and produces a mass-normalized thrust of size $\sigma$ (thrust divided by mass, in $\mathrm{m/s^2}$ — this module's $\sigma$ from the change-of-variables lesson). The acceleration it produces in the fixed, ground-based **inertial** frame is

$$
\mathbf{u} = \mathbf{R}(\mathbf{q})\begin{pmatrix}0\\0\\\sigma\end{pmatrix},
$$

where $\mathbf{R}(\mathbf{q})$ is the **rotation matrix** built from the quaternion: the grid of nine numbers that turns a body-frame arrow into a ground-frame arrow. Every entry of $\mathbf{R}(\mathbf{q})$ is a quadratic — things like $q_x q_z + q_w q_y$. So $\mathbf{u}$ is a genuinely curved function of the attitude. There is no division to undo, as with $\mathbf{T}/m$, and no norm to relax, as with the thrust band.

**The kinematics.** The attitude changes according to

$$
\dot{\mathbf{q}} = \tfrac12\,\Xi(\mathbf{q})\,\boldsymbol{\omega},
$$

read "q dot equals one half xi of q times omega". Here $\Xi(\mathbf{q})$ ("xi of q") is a $4\times3$ matrix whose entries are the quaternion's own components. So $\dot{\mathbf{q}}$ is a product of two unknowns, the attitude and the spin rate. That is the same **bilinear** shape — one unknown times another — that mass depletion had in $\mathbf{T}/m$. This time no substitution like $\mathbf{u}=\mathbf{T}/m$ exists, because both factors are needed as separate states elsewhere in the problem.

**The unit-norm constraint.** A quaternion describes a real attitude only if $\|\mathbf{q}\|_2=1$. That says "stay on the surface of a sphere" (a four-dimensional one). A sphere's surface is not a convex set: the midpoint of two points on it lies inside, off the surface. And unlike the mass bilinearity, no exact change of variables turns "stay on a sphere" into a straight-line statement everywhere at once.

::: example Checking the curve with numbers, not words
Take a body thrust of $\sigma = 6\,\mathrm{m/s^2}$ along the body $+\hat{\mathbf{z}}$ axis, and two attitudes: $\mathbf{q}_1 \propto (1,\,0.05,\,0.02,\,0)$ and $\mathbf{q}_2 \propto (1,\,-0.05,\,0.10,\,0.03)$. The symbol $\propto$ ("proportional to") means: divide each by its length so it becomes a unit quaternion. The first tilts the thrust about $6.2°$ from vertical, the second about $12.8°$, and the two attitudes are about $15°$ apart.

**Step 1: the two thrust directions.** Rotating $(0,0,6)$ by each attitude gives

$$
\mathbf{u}_1=(0.2393,\,-0.5983,\,5.9653), \qquad \mathbf{u}_2=(1.1664,\,0.6276,\,5.8520)\ \mathrm{m/s^2}.
$$

**Step 2: what a straight-line function would do.** If $\mathbf{u}(\mathbf{q})$ were **affine** (a straight-line function: a matrix times $\mathbf{q}$, plus a constant), then the thrust at the averaged attitude would equal the average of the two thrusts:

$$
\tfrac12(\mathbf{u}_1+\mathbf{u}_2) = (0.7028,\,0.0147,\,5.9086).
$$

**Step 3: what really happens.** Average the two quaternions, rescale to length one, and rotate: $\mathbf{u}(\mathbf{q}_{\text{mid}}) = (0.7160,\,0.0092,\,5.9571)$.

**Step 4: compare.** The two differ by $0.0505\,\mathrm{m/s^2}$. That is not rounding noise; it is the curve showing itself.

**Sanity check.** Both thrust vectors still have length $6$ (for example, $0.2393^2+0.5983^2+5.9653^2 \approx 36$), as a pure rotation must keep them. The straight-line average has length about $5.95$, a bit shorter — the average of two arrows on a sphere always falls inside it.
:::

## The straight-line guess, and how fast it goes wrong

The headlight trick has a mathematical name. **Linearizing** a function means replacing it, near one chosen point, by its tangent: the straight line (or flat plane) that touches it there and has the same slope. The point you build it at is the **reference**, written with a bar: $\bar{\mathbf{q}}$, read "q bar". The matrix of slopes — how much each output changes per unit change in each input — is the **[[Jacobian|jacobian]]**, and the linear guess is

$$
\mathbf{u}(\mathbf{q}) \approx \mathbf{u}(\bar{\mathbf{q}}) + \mathbf{J}\,(\mathbf{q}-\bar{\mathbf{q}}).
$$

In words: start from the true value at the reference, then add slope times how far you moved. At the reference itself the guess is exact. The question is how quickly it drifts as you move away.

::: example How fast the straight-line guess stops being a guess
Linearize $\mathbf{u}(\mathbf{q}) = \mathbf{R}(\mathbf{q})(0,0,6)^\top$ about the level attitude $\bar{\mathbf{q}}=(1,0,0,0)$, where the engine points straight up. Get the Jacobian by **finite differences** — nudge each quaternion component by a tiny amount and see how $\mathbf{u}$ changes. (A real implementation would use the exact formula or [[automatic differentiation|autodiff]]; the numbers agree.) Then tilt the vehicle about one body axis by growing angles and compare the true thrust with the linear guess.

| tilt from reference | true $\mathbf{u}$ | linearized $\mathbf{u}$ | error |
| --- | --- | --- | --- |
| $1°$ | $(0,\,-0.1047,\,5.9991)$ | $(0,\,-0.1047,\,6.0000)$ | $0.00091$ |
| $5°$ | $(0,\,-0.5229,\,5.9772)$ | $(0,\,-0.5234,\,6.0000)$ | $0.02284$ |
| $10°$ | $(0,\,-1.0419,\,5.9088)$ | $(0,\,-1.0459,\,6.0000)$ | $0.09124$ |
| $20°$ | $(0,\,-2.0521,\,5.6382)$ | $(0,\,-2.0838,\,6.0000)$ | $0.36323$ |
| $30°$ | $(0,\,-3.0000,\,5.1962)$ | $(0,\,-3.1058,\,6.0000)$ | $0.81078$ |

(Errors in $\mathrm{m/s^2}$.)

**Step 1: read the pattern.** Doubling the tilt from $10°$ to $20°$ multiplies the error by $0.36323/0.09124 = 3.98$, about $4$. Going from $20°$ to $30°$ is a factor of $1.5$ in tilt and multiplies the error by $2.23$, about $1.5^2 = 2.25$. Going from $1°$ to $5°$ multiplies it by about $25 = 5^2$.

**Step 2: name it.** The error grows like the *square* of the distance from the reference. Double the distance, four times the error.

**Step 3: notice where it hides.** The linear guess keeps the vertical thrust at exactly $6$. Tilting does not change the vertical part to first order, because $\cos\theta \approx 1$ for small $\theta$. All the error at first sits in that vertical component, which really drops to $6\cos\theta$.

**Sanity check.** At $30°$ the true vertical thrust is $6\cos30° = 5.196$, matching the table. The guess still claims $6.000$ — a $15\%$ overestimate of the push holding the vehicle up.
:::

Here is the code that makes the table. It runs with NumPy alone.

```python
import numpy as np

def thrust(q, s=6.0):
    """Inertial acceleration from body thrust s along body +z (q is normalized first)."""
    w, x, y, z = q / np.linalg.norm(q)
    return s * np.array([2*(x*z + w*y), 2*(y*z - w*x), 1 - 2*(x*x + y*y)])

def thrust_raw(q, s=6.0):
    """Same formula without normalizing -- the smooth function we differentiate."""
    w, x, y, z = q
    return s * np.array([2*(x*z + w*y), 2*(y*z - w*x), 1 - 2*(x*x + y*y)])

q_ref = np.array([1.0, 0.0, 0.0, 0.0])
h = 1e-6
J = np.column_stack([(thrust_raw(q_ref + h*e) - thrust_raw(q_ref - h*e)) / (2*h)
                     for e in np.eye(4)])

for deg in [1, 5, 10, 20, 30]:
    th = np.radians(deg)
    q = np.array([np.cos(th/2), np.sin(th/2), 0.0, 0.0])   # tilt about body x
    guess = thrust_raw(q_ref) + J @ (q - q_ref)
    print(deg, np.linalg.norm(thrust(q) - guess).round(5))
# 1 0.00091
# 5 0.02284
# 10 0.09124
# 20 0.36323
# 30 0.81078
```

::: note Why the error has to grow like the square
Any smooth function can be expanded near a point as a **[[Taylor series|taylor]]**. In one variable,

$$
f(\bar x + d) = f(\bar x) + f'(\bar x)\,d + \tfrac12 f''(\xi)\,d^2
$$

for some point $\xi$ between $\bar x$ and $\bar x + d$. The linear guess keeps the first two terms. What it throws away is the last one, which is a number times $d^2$. Near the reference $f''$ hardly changes, so the error is close to (constant) $\times\,d^2$: double $d$ and the error goes up four times. The same argument works with many variables, with the Hessian (the matrix of second derivatives) in place of $f''$.

For the tilt, $6\cos\theta$ versus the guess of $6$ leaves an error of $6(1-\cos\theta)\approx 3\theta^2$ in the vertical, with $\theta$ in radians. At $10°$ that is $3\times0.1745^2 = 0.0914$, very close to the $0.0912$ in the table.
:::

The lesson for guidance is sharp. A reference close to the true best trajectory gives SCvx a trustworthy linear model to solve against. A reference far away hands the convex subproblem a description of the dynamics that is confidently, quadratically wrong. The subproblem's solver has no way to know the model is bad. It will happily exploit the wrong part of the model and report an excellent-looking answer that the real vehicle cannot fly.

## The successive-convexification loop

Since none of this bends into an exact convex form, SCvx does not try to convert the problem once and for all. It approximates, solves, and repeats — the headlight trick, written as an algorithm.

::: key The SCvx loop
1. **Linearise** every non-convex term (dynamics, unit-norm constraint) about the current reference trajectory $(\bar{\mathbf{x}}(t),\bar{\mathbf{u}}(t))$, producing locally affine dynamics $\dot{\mathbf{x}} \approx \mathbf{A}(t)\mathbf{x}+\mathbf{B}(t)\mathbf{u}+\mathbf{c}(t)$.
2. **Discretise** the linearised, time-varying system exactly over each zero-order-hold step (the same augmented-matrix-exponential construction used for any linear time-invariant system, applied fresh at each step since $\mathbf{A}(t),\mathbf{B}(t)$ now vary node to node).
3. **Solve** the resulting convex SOCP — every constraint this module already knows how to write, plus the linearised dynamics in place of the true ones.
4. **Update** the reference to the new solution (subject to the safeguards the next lesson builds) and **repeat** until the reference stops changing.
:::

Some words in that box need unpacking. The **reference trajectory** $(\bar{\mathbf{x}}(t),\bar{\mathbf{u}}(t))$ is the current best guess at the whole flight: states and controls at every moment. The first one is often crude, such as a straight line to the pad. The matrices $\mathbf{A}(t)$ and $\mathbf{B}(t)$ are the Jacobians of the dynamics with respect to the state and the control, evaluated along the reference. The vector $\mathbf{c}(t)$ is the leftover constant that makes the linear model exact on the reference itself. Because the reference changes over the flight, these matrices are **time-varying**: different at every node.

Step 2 extends the flight-time lesson's zero-order hold. For a linear system $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x}+\mathbf{B}\mathbf{u}$ with the control held over a step of length $\Delta t$, stack the two matrices into one bigger one and take its **matrix exponential** (the matrix version of $e^x$):

$$
\exp\!\left(\begin{pmatrix}\mathbf{A} & \mathbf{B}\\ \mathbf{0} & \mathbf{0}\end{pmatrix}\Delta t\right) = \begin{pmatrix}\mathbf{A}_k & \mathbf{B}_k\\ \mathbf{0} & \mathbf{I}\end{pmatrix}.
$$

Read the exact step matrices off the top row. For the falling point mass this gives back the familiar $\Delta t$ and $\tfrac12\Delta t^2$ terms. Here it is redone at every step, because $\mathbf{A}$ and $\mathbf{B}$ change from node to node (real codes integrate the matrices along the reference, which handles change within a step too). The result is one update per step, $\mathbf{x}_{k+1}=\mathbf{A}_k\mathbf{x}_k+\mathbf{B}_k\mathbf{u}_k+\mathbf{c}_k$, where $k$ counts the nodes.

Now hold on to step 3. *That* solve is a genuine second-order cone program, with every guarantee this module has established: a global optimum of the linearized subproblem, reached in a bounded number of interior-point iterations. What SCvx gives up lives entirely in the loop *around* that solve. The linearized subproblem is not the real problem. It is the real problem's best straight-line guess at the current reference. Solving it exactly tells you nothing certified about the true, curved problem until the loop has converged — and nothing in the loop's construction proves that it will.

::: warning "The subproblem solved exactly" is not "the problem solved exactly"
This is the easiest mistake to make with SCvx. Every SOCP inside the loop finishes with a **[[duality gap|duality-gap]]** certificate — a checkable proof that *that* convex problem was solved to the stated accuracy. None of that certifies the *trajectory*, because the trajectory is only as good as the linearization it was built from. "The guidance solver converged" said about an SCvx iterate is true and much weaker than the same sentence said about a lossless-convexification solve. It needs a second, separate claim: that the loop itself converged, to a reference close enough to a truly flyable trajectory that the linearization error no longer matters. Making that claim checkable is exactly the job of the next two lessons' trust region and virtual control.
:::

## What the loop keeps, and what it gives up

What SCvx **keeps**: every inner solve is convex. It is fast, it has an iteration bound, and it always returns either an answer or a clear "infeasible". The machinery from the first half of the module — cones, the SOCP form, the solver — is reused unchanged.

What SCvx **gives up**: any promise about the outer loop. It might need three passes or thirty. It might settle on a locally good trajectory that is not the global best, like the fog-bound walker from lesson one. It might wander without settling. In flight, that means a budget for the number of passes and a plan for what to fly if the budget runs out — the real-time lesson later in this module takes that up.

Why accept the trade? The alternative for a 6-DoF landing is a general nonlinear solver, with all the same weaknesses *and* no iteration bound inside. SCvx keeps as much certainty as the problem allows, and pushes the uncertainty into one place — the loop — where it can be watched, measured and managed.

## Check yourself

::: check
Why does the unit-norm constraint $\|\mathbf{q}\|_2=1$ count as a new kind of non-convexity, rather than something the lossless-convexification slack trick could handle the way it handled the thrust band?
:::

::: answer
The thrust band removed an *open region* (a ball around the origin) from an otherwise convex set. The fix was to enlarge the feasible set with a slack variable, then prove the optimizer never wants to use the extra room. The unit sphere $\{\mathbf{q}:\|\mathbf{q}\|=1\}$ is a different shape of non-convexity: it is a thin *surface*, not a solid region with a hole in it. Relaxing $\|\mathbf{q}\|=1$ to $\|\mathbf{q}\|\le1$ gives a convex ball, but nothing pushes the answer back out to the surface. If shrinking $\|\mathbf{q}\|$ toward zero ever lowered the cost, the optimizer would do it, and there is no link to the cost like the one that forced $\|\mathbf{T}\|=\Gamma$ in the thrust case. So SCvx handles the sphere by linearizing it locally — replacing it with its tangent plane at the reference, rebuilt at each new reference — rather than by an exact convex rewrite.
:::

::: check
A colleague reports: "Our SCvx solve converged in eight iterations with a tiny duality gap on the final subproblem." They ask whether that is enough evidence to fly the trajectory. What is missing from the report?
:::

::: answer
The duality gap certifies only that the *last linear subproblem* was solved accurately. It says nothing about how well that subproblem's linearized dynamics matched the true dynamics at the final reference. The missing evidence is what the next lesson's virtual control reports — how large the mismatch between the linear step and the true step is at the converged reference — and whether the trust region had shrunk to a size where the linearization is trustworthy. A converged subproblem with a large leftover virtual control describes a trajectory the real vehicle cannot fly, no matter how small the SOCP's own duality gap is.
:::

::: check
Using the tilt table, predict the linearization error at a $2°$ tilt from the $1°$ value, without computing any rotation. Then say how far you would trust the model if you needed errors below $0.1\,\mathrm{m/s^2}$.
:::

::: answer
The error grows like the square of the tilt. Going from $1°$ to $2°$ doubles the tilt, so the error goes up by $2^2 = 4$: about $4\times0.00091 = 0.00364\,\mathrm{m/s^2}$. (The exact value is $0.00366$, so the rule works well.) For the second part, the table shows $0.091$ at $10°$ and $0.363$ at $20°$. The $0.1$ limit is crossed a little past $10°$: solving $0.00091\,\theta^2 = 0.1$ gives $\theta \approx 10.5°$. So you would keep each step's change in tilt to about $10°$ — which is exactly the kind of limit the next lesson's trust region enforces.
:::

::: check
The quadratic growth suggests that halving the allowed step size per iteration cuts the linearization error by four, not two. Why might a real SCvx implementation not shrink the allowed step as fast as possible on every iteration?
:::

::: answer
A small allowed step also limits how far the reference can move toward the true best trajectory on each pass. Each step's linearization gets more trustworthy, but the number of passes needed to travel from a poor first guess to the answer grows. It trades quality per iteration for number of iterations. The next lesson's trust-region rule does better: it grows the allowed step when the linear model predicted the true cost change well, and shrinks it only when the prediction was poor. That spends the big, fast steps a good linearization allows, while still guarding against the quadratic blow-up the table shows.
:::

::: check
Which of the four steps of the SCvx loop comes with a certificate, and which step is the reason the whole algorithm does not?
:::

::: answer
Step 3, the SOCP solve, is certified: it reaches the global optimum of the linearized subproblem in a bounded number of iterations, with a duality gap to prove it. Step 4, updating the reference and repeating, is where the guarantee is lost. Nothing proves that the chain of references settles down, how many passes it needs, or that where it settles is the true best trajectory.
:::

## Summary

| Object | Statement |
| --- | --- |
| What 6-DoF adds | Attitude $\mathbf{q}$, rate $\boldsymbol{\omega}$; thrust direction becomes $\mathbf{R}(\mathbf{q})(0,0,\sigma)^\top$ |
| Three new non-convexities | $\mathbf{R}(\mathbf{q})$ quadratic in $\mathbf{q}$; $\dot{\mathbf{q}}=\tfrac12\Xi(\mathbf{q})\boldsymbol{\omega}$ bilinear; $\|\mathbf{q}\|=1$ a sphere's surface, not a region |
| Confirmed curvature | Averaging two attitudes' thrust vectors differs from the thrust at the averaged attitude by $0.0505\,\mathrm{m/s^2}$ |
| Linearization | $\mathbf{u}(\mathbf{q}) \approx \mathbf{u}(\bar{\mathbf{q}}) + \mathbf{J}(\mathbf{q}-\bar{\mathbf{q}})$: exact at the reference, drifting away from it |
| Error scaling | Roughly quadratic in distance from the reference: $4\times$ error for $2\times$ tilt, $2.23\times$ for $1.5\times$ tilt |
| The SCvx loop | Linearise about a reference $\to$ discretise exactly $\to$ solve the convex subproblem $\to$ update the reference $\to$ repeat |
| What step 3 keeps | A genuine, certified SOCP solve of the *linearized* subproblem — global optimum, bounded iterations, for that subproblem only |
| What the loop gives up | Any guarantee of global optimality, convergence, or even feasibility for the true, nonlinear problem |
| The core warning | A subproblem's duality gap certifies the subproblem, never the trajectory, without the loop-level evidence the next two lessons build |

The next lesson builds the two devices that make this loop usable rather than merely hopeful: virtual control, which stops a bad linearization from making the subproblem impossible to solve, and the trust region, which stops the subproblem from exploiting the model past the point where it means anything.

::: context scvx-origin Where the name and the method come from
"Successive" means one after another; "convexification" means making something convex. The method in this form was set out by Yuanqi Mao, Michael Szmuk and Behçet Açıkmeşe at the University of Washington in 2016, with a convergence analysis. Szmuk and Açıkmeşe then applied it to a 6-DoF Mars landing with free final time in 2018 — the paper this module's later lessons follow. The underlying idea, repeatedly solving a local model, is much older: it is the same spirit as Newton's method and sequential quadratic programming.
:::

::: context six-dof Six ways to move
A rigid body can move in six independent ways. Three are sliding: forward-back, left-right, up-down. Three are turning: **roll**, **pitch** and **yaw**, rotations about three axes through the body. A point model only needs the first three. A rocket that must rotate to aim its engine needs all six.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="160" y="40" width="40" height="100" rx="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <line x1="180" y1="90" x2="180" y2="20" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="180,12 175,22 185,22" fill="#1d6fd1"/>
  <line x1="180" y1="90" x2="260" y2="90" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="268,90 258,85 258,95" fill="#1d6fd1"/>
  <line x1="180" y1="90" x2="125" y2="135" stroke="#1d6fd1" stroke-width="2.5"/>
  <polygon points="119,140 124,129 131,136" fill="#1d6fd1"/>
  <text x="188" y="22" font-size="12" fill="#1f2a44">z: up-down, yaw</text>
  <text x="272" y="94" font-size="12" fill="#1f2a44">x: roll</text>
  <text x="30" y="150" font-size="12" fill="#1f2a44">y: pitch</text>
  <path d="M 240 78 A 14 14 0 1 1 240 102" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M 166 26 A 16 8 0 1 0 194 26" fill="none" stroke="#b4232c" stroke-width="2"/>
  <path d="M 136 112 A 12 12 0 1 1 150 124" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="20" y="30" font-size="12" fill="#6c7a93">blue: slide along an axis</text>
  <text x="20" y="48" font-size="12" fill="#b4232c">red: turn about it</text>
</svg>
```
:::

::: context quaternion Why four numbers for three turns
Three angles (like roll, pitch and yaw) can describe any attitude, but they have a flaw called **gimbal lock**: at certain attitudes two of the angles do the same thing and the description breaks down. A quaternion uses four numbers with one rule, $q_w^2+q_x^2+q_y^2+q_z^2=1$, and never breaks down. For a turn by angle $\theta$ about a unit axis $\hat{\mathbf{n}}$, $\mathbf{q} = (\cos\tfrac{\theta}{2},\ \hat{\mathbf{n}}\sin\tfrac{\theta}{2})$. The price is that fourth number and the unit-length rule — which is the sphere this lesson calls non-convex.
:::

::: context jacobian A table of slopes
The Jacobian is named after the 19th-century German mathematician Carl Gustav Jacob Jacobi. For a function with $n$ inputs and $m$ outputs it is an $m\times n$ grid: row $i$, column $j$ holds how fast output $i$ changes when input $j$ is nudged. For the thrust example it is $3\times4$ (three thrust components, four quaternion numbers). At the level attitude it holds $12$ and $-12$ in the horizontal rows and all zeros in the vertical row — which is why the guess never changes the vertical thrust.
:::

::: context autodiff Exact slopes without the calculus by hand
**Automatic differentiation** is a way for a computer to get exact derivatives of any function written as code. Every step of a program is a simple operation — add, multiply, sine — whose derivative is known, and the chain rule stitches them together. It is exact to machine precision, unlike finite differences, which have to pick a nudge size (too big: truncation error; too small: rounding error). Tools like JAX and CasADi do this, and SCvx codes use them to build $\mathbf{A}$ and $\mathbf{B}$.
:::

::: context taylor The tangent line and the gap
The tangent line touches a curve at the reference and shares its slope there. Move a distance $d$ away and the gap between curve and line grows like $d^2$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="160" x2="340" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <path d="M 30 150 Q 180 -10 330 150" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="60" y1="108.4" x2="300" y2="6" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="120" cy="82.8" r="4" fill="#1d6fd1"/>
  <text x="96" y="70" font-size="12" fill="#1d6fd1">reference</text>
  <line x1="180" y1="57.2" x2="180" y2="70" stroke="#b4232c" stroke-width="3"/>
  <line x1="240" y1="31.6" x2="240" y2="82.8" stroke="#b4232c" stroke-width="3"/>
  <line x1="290" y1="10.3" x2="290" y2="113" stroke="#b4232c" stroke-width="3"/>
  <text x="248" y="72" font-size="12" fill="#b4232c">gap</text>
  <text x="300" y="24" font-size="12" fill="#1d6fd1">tangent</text>
  <text x="230" y="156" font-size="12" fill="#1f2a44">true curve</text>
</svg>
```

The red gaps grow faster and faster as you move right: that is the $\tfrac12 f''d^2$ term.
:::

::: context duality-gap A certificate you can check
Every convex problem has a partner problem, the **dual**, whose best value is a floor under the original's best value. An interior-point solver tracks both. The distance between the current cost and the current floor is the **duality gap**. When it is below $10^{-8}$, say, you know the answer is within $10^{-8}$ of optimal — not because the solver says so, but because the floor proves nothing better exists. That is why it counts as a certificate. It proves the optimum of the problem it was given, though, and SCvx gives it a linear stand-in.
:::
