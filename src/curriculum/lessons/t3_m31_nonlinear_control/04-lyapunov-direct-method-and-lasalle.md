---
id: l04-lyapunov-direct-method-and-lasalle
title: The direct method, Lyapunov functions and LaSalle
minutes: 22
covers:
  - 'The Lyapunov direct method, Lyapunov functions, LaSalle invariance principle'
---

Drop a marble into a salad bowl. It rolls, rocks, slows down and ends at the bottom. You know that without solving any equation of motion. You only need two facts: the bowl is lowest at the bottom, and friction keeps taking energy away. The marble's height can only go down, and the only place it can stop going down is the bottom.

That idea, made precise, is the most important tool in nonlinear control. It comes from **[[Aleksandr Lyapunov's 1892 thesis|lyapunov-thesis]]**. Find a number that depends on the state, is zero at the equilibrium and positive everywhere else — a "bowl" — and show that it goes down along every motion of the system. Then the state has nowhere to go but the equilibrium. You never solve the differential equation. You never linearize. The system can have any number of states, can be discontinuous, and can be far from any operating point.

That is the **direct method** — the stability test that works on the equations directly, without solving them. Everything later in this module is built on it. Sliding-mode design picks the bowl $V = \tfrac{1}{2}s^\mathsf{T}s$ and forces it downhill. Backstepping builds the bowl one state at a time. Passivity-based control uses the vehicle's physical energy as the bowl. The next lesson turns the inside of a bowl into a certified safe region.

People often say finding the bowl feels like magic. It is not, and most of this lesson is about where good bowls come from. It ends with the standard spacecraft case worked in full: the quaternion attitude law $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$, its Lyapunov function, the LaSalle argument that finishes the proof, and exactly which equilibrium the proof certifies.

## Bowls, and the theorem

Start with a system $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$ — read "x dot equals f of x": the state $\mathbf{x}$ changes at a rate set by where it is. Slide the coordinates so the equilibrium sits at the origin, $\mathbf{f}(\mathbf{0}) = \mathbf{0}$. That costs nothing; it only relabels the state as "error from equilibrium".

Now the words for the bowl.

- A scalar function $V(\mathbf{x})$ is **positive definite** — a proper bowl — if $V(\mathbf{0}) = 0$ and $V(\mathbf{x}) > 0$ for every other $\mathbf{x}$ in some region $D$ around the origin.
- It is **positive semi-definite** — a bowl that may have flat spots at zero height — if all you can say is $V(\mathbf{x}) \ge 0$.
- It is **radially unbounded** — a bowl whose walls keep rising forever — if $V(\mathbf{x}) \to \infty$ as $\lVert\mathbf{x}\rVert \to \infty$.

The quantity that matters is how fast $V$ changes as the system moves. Call it $\dot{V}$, "V dot", the derivative **along the trajectories**. By the chain rule,

$$
\dot{V}(\mathbf{x}) = \frac{\partial V}{\partial\mathbf{x}}\,\dot{\mathbf{x}} = \nabla V(\mathbf{x})\cdot\mathbf{f}(\mathbf{x}) .
$$

Read $\nabla V$ as "grad V": the **[[gradient|gradient-dot]]**, the arrow pointing straight uphill on the bowl. Dotting it with the velocity $\mathbf{f}$ tells you how fast you are climbing. Notice what this formula needs: only the state. You plug in $\mathbf{x}$, you get a number. No solution of the differential equation is required. That single substitution is what makes the method usable.

::: key Lyapunov's direct method
For $\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x})$ with equilibrium at the origin, suppose $V$ is continuously differentiable with $V(\mathbf{0}) = 0$ and $V(\mathbf{x}) > 0$ for $\mathbf{x} \ne \mathbf{0}$ (positive definite). If $\dot{V}(\mathbf{x}) \le 0$ along trajectories, the origin is **stable**. If $\dot{V}(\mathbf{x}) < 0$ for $\mathbf{x} \ne \mathbf{0}$ (negative definite), the origin is **asymptotically stable**. If in addition $V$ is radially unbounded, the origin is **globally asymptotically stable**.
:::

Here is the picture behind it. The sets $\{V(\mathbf{x}) = c\}$ are like the contour lines on a hiking map of the bowl: closed rings around the origin, nested inside each other, shrinking to the origin as $c \to 0$. The set inside a ring, $\{V \le c\}$, is called a **sublevel set**.

::: note Why it has to be true
Saying $\dot{V} \le 0$ says the state never crosses a contour ring outward. So a motion that starts inside the ring $\{V \le c\}$ stays inside it forever. A set with that property is **positively invariant** — once in, never out. Pick $c$ small and the ring is a tiny neighborhood of the origin, so starting close means staying close. That is exactly what "stable" means.

Now make $\dot{V}$ strictly negative away from the origin. The state must keep crossing rings inward. $V$ keeps falling and is bounded below by zero, so it settles to some limit. If that limit were above zero, the state would stay in the band between two rings, where $\dot{V}$ is below some fixed negative number — and $V$ would fall forever, which is impossible. So $V \to 0$, and the state goes to the origin.
:::

Two conditions are more than bookkeeping.

First, the ring must be **bounded** for the argument to trap anything. Radial unboundedness is what guarantees that for every ring. Here is what goes wrong without it. The function $V = x_1^2/(1 + x_1^2) + x_2^2$ is positive definite. But its "ring" $V = 1$ is the curve $x_2^2 = 1/(1 + x_1^2)$, which **[[never closes|unbounded-level-set]]**: it runs off to $x_1 = \pm\infty$. A trajectory can slide out along that channel to infinity with $V$ decreasing the whole way.

Second, $\dot{V}$ must be computed with the real $\mathbf{f}$. A $V$ that decreases in some directions, but not along the actual flow, proves nothing.

## Where good bowls come from

Four sources cover most of practice. In control design there is a fifth trick: you often choose $V$ *first*, then design the control law to make $\dot{V}$ negative. That turns "find a Lyapunov function" from a puzzle into a design step.

**1. Physical energy.** For a mechanical system at rest, kinetic plus potential energy is a natural bowl, and $\dot{V}$ is the net power flowing in. For a rigid body, $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$ is the rotational kinetic energy. Here $\mathbf{J}$ is the inertia matrix and $\boldsymbol{\omega}$ ("omega") is the body rate. It works because Euler's equations conserve this energy when no torque acts. So $\dot{V}$ is the power of whatever torque you add, and nothing else.

**2. Energy plus the potential your controller creates.** This is the source that makes attitude control work, and it is a construction, not a guess. Say the control has a "spring" part $\mathbf{u}_p(\mathbf{x})$ and a "damper" part $-\mathbf{P}\boldsymbol{\omega}$. Take $V = \text{kinetic energy} + U$, where you choose $U$ so that $\dot{U} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{u}_p$. Then the spring part's power cancels exactly and $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$, whatever the spring law was. Your job is to find that $U$ — to integrate the spring into a potential — and check it is a bowl. The quaternion example below does this in two lines.

**3. The Lyapunov equation.** If part of the system is linear with a Hurwitz matrix $\mathbf{A}$ (all eigenvalues in the left half-plane), solve $\mathbf{A}^\mathsf{T}\mathbf{P} + \mathbf{P}\mathbf{A} = -\mathbf{Q}$ for a chosen positive definite $\mathbf{Q}$ and take $V = \mathbf{x}^\mathsf{T}\mathbf{P}\mathbf{x}$. That is the bowl the previous lesson used to prove the indirect method. It is the standard start when you have a linear design and want to certify a region around it.

**4. Weighted sums of squared errors.** For tracking, take $V = \tfrac{1}{2}\mathbf{e}^\mathsf{T}\mathbf{M}\mathbf{e}$ with the weighting $\mathbf{M}$ chosen to make awkward cross terms cancel. Sliding-mode design uses the one-dimensional version, $V = \tfrac{1}{2}s^2$, and gets its reaching condition from it.

::: example Detumble, with a rate you can certify
A spacecraft with $\mathbf{J} = \mathrm{diag}(120, 100, 80)\,\mathrm{kg\,m^2}$ is tumbling. The only feedback is rate: $\mathbf{u} = -\mathbf{P}\boldsymbol{\omega}$ with $\mathbf{P} = 80\,\mathbf{I}\,\mathrm{N\,m\,s}$. The dynamics are Euler's equations,

$$
\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times(\mathbf{J}\boldsymbol{\omega}) + \mathbf{u} .
$$

**Pick the bowl.** Take $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$, the kinetic energy. It is positive definite in $\boldsymbol{\omega}$ and radially unbounded.

**Differentiate along trajectories.**

$$
\dot{V} = \boldsymbol{\omega}^\mathsf{T}\mathbf{J}\dot{\boldsymbol{\omega}}
= -\boldsymbol{\omega}^\mathsf{T}\left(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}\right) + \boldsymbol{\omega}^\mathsf{T}\mathbf{u}
= -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} .
$$

The middle term vanished because $\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}$ is **[[perpendicular to $\boldsymbol{\omega}$|cross-perpendicular]]**, so its dot product with $\boldsymbol{\omega}$ is zero, always. The gyroscopic term does no work. That is why the messy nonlinearity never shows up in the proof. With $\mathbf{P}$ positive definite, $\dot{V} < 0$ for every $\boldsymbol{\omega} \ne \mathbf{0}$: globally asymptotically stable. No linearization, no limit on the rate.

**Get a speed out of it.** Write $\lambda_{\min}$ and $\lambda_{\max}$ ("lambda min", "lambda max") for the **[[smallest and largest eigenvalues|eigen-bounds]]** of a matrix. The energy is squeezed between the weakest and strongest axis:

$$
\tfrac{1}{2}\lambda_{\min}(\mathbf{J})\lVert\boldsymbol{\omega}\rVert^2 \le V \le \tfrac{1}{2}\lambda_{\max}(\mathbf{J})\lVert\boldsymbol{\omega}\rVert^2 .
$$

Here $\dot{V} = -\lambda_{\min}(\mathbf{P})\lVert\boldsymbol{\omega}\rVert^2$, and the right-hand inequality gives $\lVert\boldsymbol{\omega}\rVert^2 \ge 2V/\lambda_{\max}(\mathbf{J})$. Put them together:

$$
\dot{V} \le -\frac{2\lambda_{\min}(\mathbf{P})}{\lambda_{\max}(\mathbf{J})}\,V = -\frac{2(80)}{120}V = -\tfrac{4}{3}V
\quad\Longrightarrow\quad
V(t) \le V(0)\,e^{-4t/3} .
$$

**Put in numbers.** Start at $\boldsymbol{\omega}(0) = (0.30, -0.20, 0.15)\,\mathrm{rad/s}$. Then $V(0) = \tfrac{1}{2}(120 \cdot 0.09 + 100 \cdot 0.04 + 80 \cdot 0.0225) = \tfrac{1}{2}(10.8 + 4 + 1.8) = 8.30\,\mathrm{J}$, and $\lVert\boldsymbol{\omega}(0)\rVert = 0.3905\,\mathrm{rad/s}$.

We want $\lVert\boldsymbol{\omega}\rVert < 10^{-3}\,\mathrm{rad/s}$. The left inequality says that is guaranteed once $V < \tfrac{1}{2}\lambda_{\min}(\mathbf{J})(10^{-3})^2 = \tfrac{1}{2}(80)(10^{-6}) = 4\times10^{-5}\,\mathrm{J}$. The bound promises that by

$$
t = \frac{\ln\!\left(8.30/4\times10^{-5}\right)}{4/3} = \frac{12.243}{1.3333} = 9.18\,\mathrm{s} .
$$

**Compare with the truth.** **[[Runge–Kutta integration|runge-kutta]]** of the full nonlinear equations with a $1\,\mathrm{ms}$ step reaches $10^{-3}\,\mathrm{rad/s}$ at $8.576\,\mathrm{s}$:

| $t$ | $\lVert\boldsymbol{\omega}\rVert$ ($\mathrm{rad/s}$) | $V$ (J) | Bound $V(0)e^{-4t/3}$ |
| --- | --- | --- | --- |
| $1\,\mathrm{s}$ | $1.867\times10^{-1}$ | $1.950$ | $2.188$ |
| $2\,\mathrm{s}$ | $9.112\times10^{-2}$ | $0.4730$ | $0.5767$ |
| $5\,\mathrm{s}$ | $1.131\times10^{-2}$ | $7.506\times10^{-3}$ | $1.056\times10^{-2}$ |
| $10\,\mathrm{s}$ | $3.835\times10^{-4}$ | $8.768\times10^{-6}$ | $1.344\times10^{-5}$ |

**Sanity check.** The bound sits above the truth in every row — by 12 percent at $1\,\mathrm{s}$, growing to 53 percent by $10\,\mathrm{s}$ — and it is $0.6\,\mathrm{s}$ pessimistic on settling time. That is the right way round. A Lyapunov bound is conservative by construction, and a conservative guarantee is what a flight program wants.
:::

## When $\dot{V}$ only reaches zero: LaSalle

Good bowls often give $\dot{V} \le 0$ with equality on a whole set, not only at one point. In the detumble example, damping acted on every state, so $\dot{V}$ was strictly negative. Now add attitude feedback. You still get $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$, which is zero whenever the vehicle is at rest — at *any* attitude. The bowl has a flat valley floor. Lyapunov's theorem gives stability and stops.

Think about a hockey puck sliding to rest on a gently sloped rink. Friction is the only thing removing energy, and friction does nothing when the puck is still. So energy stops falling whenever the puck is still. But a puck held still on a slope does not *stay* still — gravity starts it moving again, and friction resumes. The only place it can stay still is the lowest point. LaSalle's invariance principle is exactly this argument: being at rest in the wrong place is not something the system can keep doing.

::: key LaSalle's invariance principle
Let $\Omega$ be a compact set that trajectories cannot leave (for instance a bounded sublevel set $\{V \le c\}$, which is positively invariant when $\dot{V} \le 0$ on it). Let $E = \{\mathbf{x} \in \Omega : \dot{V}(\mathbf{x}) = 0\}$ and let $M$ be the largest invariant set contained in $E$. Then every trajectory starting in $\Omega$ approaches $M$ as $t \to \infty$. If $M$ is the origin alone, the origin is asymptotically stable with region of attraction containing $\Omega$.
:::

**Compact** means closed and bounded — a set with its edge included that does not run off to infinity. **Invariant** means a trajectory that starts in the set stays in it for all time, forward and backward. The recipe is mechanical:

1. Write down $E$: solve $\dot{V}(\mathbf{x}) = 0$.
2. Suppose a trajectory *stays* in $E$ for all time, and differentiate that assumption.
3. Feed the result back into the dynamics to see what else is forced to zero.
4. Whatever survives is $M$.

Try it on a small case: $\dot{x}_1 = x_2$, $\dot{x}_2 = -x_1 - x_2^3$. This is the system whose Jacobian at the origin had eigenvalues $\pm j$ and told you nothing. Take $V = \tfrac{1}{2}(x_1^2 + x_2^2)$. Then

$$
\dot{V} = x_1\dot{x}_1 + x_2\dot{x}_2 = x_1x_2 + x_2(-x_1 - x_2^3) = -x_2^4 \le 0 .
$$

Negative semi-definite, so Lyapunov alone gives only stability. Now LaSalle.

1. $E = \{x_2 = 0\}$, the whole horizontal axis.
2. If a trajectory stays in $E$, then $x_2 \equiv 0$ (read "$\equiv$" as "equals for all time"), so $\dot{x}_2 \equiv 0$.
3. The second equation then says $0 = -x_1 - 0$, so $x_1 \equiv 0$.
4. $M = \{\mathbf{0}\}$.

The origin is asymptotically stable, and since $V$ is radially unbounded, **[[globally|lasalle-spiral]]**. Integration confirms it and shows how slow it is. From $(1, 0)$, $\lVert\mathbf{x}\rVert$ is $0.349$ at $10\,\mathrm{s}$, $0.114$ at $100\,\mathrm{s}$, $0.0365$ at $1000\,\mathrm{s}$ and $0.0258$ at $2000\,\mathrm{s}$. Convergent, but not exponentially — exactly as the previous lesson's marginal case predicted. Remove the cubic damping and $\lVert\mathbf{x}\rVert$ is still $1.0000$ at $2000\,\mathrm{s}$. The term LaSalle used is doing all the work.

## The quaternion attitude law, proved

Here is the result this module is organized around. It is the standard spacecraft regulator, the proof is a few lines of algebra, and every line has a physical meaning.

The vehicle is a rigid body with inertia $\mathbf{J}$, body rate $\boldsymbol{\omega}$ and control torque $\mathbf{u}$:

$$
\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times(\mathbf{J}\boldsymbol{\omega}) + \mathbf{u} .
$$

The attitude error is a unit **[[quaternion|quaternion-refresher]]** $\mathbf{q} = (q_0, \mathbf{q}_v)$: a scalar part $q_0$ ("q zero") first, then a three-component vector part $\mathbf{q}_v$ ("q sub v"), with $q_0^2 + \mathbf{q}_v^\mathsf{T}\mathbf{q}_v = 1$. For a rotation by angle $\Phi$ ("capital phi") about a unit axis $\hat{\mathbf{n}}$,

$$
q_0 = \cos(\Phi/2), \qquad \mathbf{q}_v = \hat{\mathbf{n}}\sin(\Phi/2),
$$

so $\mathbf{q} = (1, \mathbf{0})$ means zero error. The kinematics, from the attitude kinematics module, are

$$
\dot{q}_0 = -\tfrac{1}{2}\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega},
\qquad
\dot{\mathbf{q}}_v = \tfrac{1}{2}\left(q_0\boldsymbol{\omega} + \mathbf{q}_v\times\boldsymbol{\omega}\right).
$$

The control law is a spring on the vector part of the error and a damper on the rate:

$$
\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega},
\qquad K > 0, \quad \mathbf{P} = \mathbf{P}^\mathsf{T} > 0 .
$$

::: example Constructing the candidate and closing the proof
**Build $V$ instead of guessing it.** Start from kinetic energy $\tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$. Look for a potential $U(\mathbf{q})$ whose rate cancels the work done by the spring term. The spring's power is $\boldsymbol{\omega}^\mathsf{T}(-K\mathbf{q}_v) = -K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$, so you need $\dot{U} = +K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$. The kinematics hand you that for free. Since $\dot{q}_0 = -\tfrac{1}{2}\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$, multiplying by $-2K$ gives

$$
\frac{d}{dt}\left(-2Kq_0\right) = K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega} .
$$

Add the constant $2K$ so the potential is zero at zero error. Because $q_0 \le 1$, it is never negative:

$$
\boxed{\,V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1 - q_0)\,}
$$

This is kinetic energy plus the potential energy of the "spring" the gain $K$ creates. Every attitude law in this module gets its candidate the same way.

**Check it is a bowl.** The first term is positive definite in $\boldsymbol{\omega}$ because $\mathbf{J}$ is. The second satisfies $2K(1 - q_0) \ge 0$, with equality only at $q_0 = 1$, which on the unit sphere forces $\mathbf{q}_v = \mathbf{0}$. So $V \ge 0$, and $V = 0$ only at $(\boldsymbol{\omega}, \mathbf{q}) = (\mathbf{0}, (1,\mathbf{0}))$. The attitude part is largest, $4K$, at $q_0 = -1$.

**Differentiate along the closed loop.**

$$
\begin{aligned}
\dot{V} &= \boldsymbol{\omega}^\mathsf{T}\mathbf{J}\dot{\boldsymbol{\omega}} - 2K\dot{q}_0 \\
&= \boldsymbol{\omega}^\mathsf{T}\left(-\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u}\right) + K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega} \\
&= \boldsymbol{\omega}^\mathsf{T}\mathbf{u} + K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega} \\
&= -K\boldsymbol{\omega}^\mathsf{T}\mathbf{q}_v - \boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} + K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega} \\
&= -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} \ \le\ 0 .
\end{aligned}
$$

Line by line: line one differentiates each term. Line two substitutes the dynamics and the $\dot{q}_0$ kinematics. Line three drops $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}) = 0$. Line four substitutes the control law. Line five cancels, because $K\boldsymbol{\omega}^\mathsf{T}\mathbf{q}_v$ and $K\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$ are the same number. Nothing is approximated and nothing is assumed small.

**Apply LaSalle.** $\dot{V}$ is only negative *semi*-definite: it is zero on $E = \{\boldsymbol{\omega} = \mathbf{0}\}$, at every attitude. Take $\Omega = \{V \le c\}$ with $c < 4K$. It is positively invariant because $\dot{V} \le 0$. It is compact because the quaternion lives on the unit sphere and $V \le c$ caps $\boldsymbol{\omega}$. On a trajectory that stays in $E$, $\boldsymbol{\omega} \equiv \mathbf{0}$, so $\dot{\boldsymbol{\omega}} \equiv \mathbf{0}$, and the closed-loop dynamics give

$$
\mathbf{0} = \mathbf{J}\dot{\boldsymbol{\omega}} = -\mathbf{0}\times\mathbf{J}\mathbf{0} - K\mathbf{q}_v - \mathbf{P}\mathbf{0} = -K\mathbf{q}_v
\quad\Longrightarrow\quad \mathbf{q}_v = \mathbf{0} .
$$

So $M = \{\boldsymbol{\omega} = \mathbf{0},\ \mathbf{q}_v = \mathbf{0}\}$, which on the unit sphere means $q_0 = \pm1$. Inside $\Omega$ the point $q_0 = -1$ is excluded, because $V = 4K > c$ there. Therefore every trajectory that starts with $V(0) < 4K$ converges to $\mathbf{q} = (1, \mathbf{0})$ with $\boldsymbol{\omega} = \mathbf{0}$. Asymptotically stable, with a certified region of attraction $\{V < 4K\}$.

**Fly it.** Take $\mathbf{J} = \mathrm{diag}(120, 100, 80)\,\mathrm{kg\,m^2}$, $K = 20\,\mathrm{N\,m}$, $\mathbf{P} = 80\,\mathbf{I}\,\mathrm{N\,m\,s}$, an initial error of $150^\circ$ about the axis $\hat{\mathbf{n}} = (1,2,2)/3$, and $\boldsymbol{\omega}(0) = (0.02, -0.03, 0.01)\,\mathrm{rad/s}$. Then $q_0(0) = \cos 75^\circ = 0.25882$, the kinetic energy is $\tfrac{1}{2}(120 \cdot 0.0004 + 100 \cdot 0.0009 + 80 \cdot 0.0001) = 0.0730\,\mathrm{J}$, and

$$
V(0) = 0.0730 + 2(20)(1 - 0.25882) = 29.720\,\mathrm{J} < 4K = 80\,\mathrm{J} ,
$$

so the start is inside the certified region. Integrating with fourth-order Runge–Kutta at $\Delta t = 1\,\mathrm{ms}$, renormalizing the quaternion each step:

| $t$ | $V$ (J) | Error angle $\Phi$ | $\lVert\boldsymbol{\omega}\rVert$ ($\mathrm{rad/s}$) |
| --- | --- | --- | --- |
| $0$ | $29.7202$ | $150.00^\circ$ | $3.74\times10^{-2}$ |
| $5\,\mathrm{s}$ | $16.0864$ | $99.45^\circ$ | $2.03\times10^{-1}$ |
| $10\,\mathrm{s}$ | $4.7832$ | $51.77^\circ$ | $1.27\times10^{-1}$ |
| $20\,\mathrm{s}$ | $0.2560$ | $11.75^\circ$ | $3.12\times10^{-2}$ |
| $40\,\mathrm{s}$ | $5.86\times10^{-4}$ | $0.564^\circ$ | $1.49\times10^{-3}$ |
| $100\,\mathrm{s}$ | $9.39\times10^{-12}$ | $0.0001^\circ$ | $1.87\times10^{-7}$ |
| $200\,\mathrm{s}$ | $< 10^{-13}$ | $0.0000^\circ$ | $7.4\times10^{-14}$ |

**Sanity checks.** $V$ goes down at every one of the first $60000$ steps; the largest change is $-4.2\times10^{-10}$, never positive. The rate first *rises* — the spring is swinging the vehicle toward the target — while $V$ still falls, because potential energy is being turned into kinetic energy and the damper eats some on the way. And the identity itself can be checked: computing $\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\dot{\boldsymbol{\omega}} - 2K\dot{q}_0$ from the simulated derivatives and comparing with $-\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$ gives $-0.11200000$ against $-0.11200000$ at $t = 0$, and $-2.46963488$ against $-2.46963488$ at $t = 1.5\,\mathrm{s}$. The algebra is what the simulation does.

```python
import numpy as np

J = np.diag([120.0, 100.0, 80.0])
K, P = 20.0, 80.0 * np.eye(3)

def deriv(s):
    q0, qv, w = s[0], s[1:4], s[4:]
    u = -K * qv - P @ w
    wd = np.linalg.solve(J, -np.cross(w, J @ w) + u)
    return np.concatenate(([-0.5 * qv @ w], 0.5 * (q0 * w + np.cross(qv, w)), wd))

def lyap(s):
    return 0.5 * s[4:] @ J @ s[4:] + 2 * K * (1 - s[0])

ang, n = np.radians(150.0), np.array([1.0, 2.0, 2.0]) / 3.0
s = np.concatenate(([np.cos(ang / 2)], np.sin(ang / 2) * n, [0.02, -0.03, 0.01]))
dt = 1e-3
for step in range(200_000):
    k1 = deriv(s); k2 = deriv(s + 0.5 * dt * k1)
    k3 = deriv(s + 0.5 * dt * k2); k4 = deriv(s + dt * k3)
    s = s + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
    s[:4] /= np.linalg.norm(s[:4])
print(round(lyap(s), 12), np.round(s[:4], 9))
# 0.0 [1. 0. 0. 0.]
```
:::

::: key Lyapunov function for the quaternion law
For $\mathbf{J}\dot{\boldsymbol{\omega}} = -\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega} + \mathbf{u}$ with $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$, $K$ and $\mathbf{P}$ positive definite, take $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1 - q_0)$. Then $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$, only negative semi-definite, and LaSalle gives asymptotic stability: the largest invariant set in $\{\boldsymbol{\omega} = \mathbf{0}\}$ is $\{\boldsymbol{\omega} = \mathbf{0}, \mathbf{q}_v = \mathbf{0}\}$, and $V < 4K$ keeps only $q_0 = +1$.
:::

## What the proof certifies, and what it leaves open

Read the last LaSalle step again. The set $M$ held **two** points: $\mathbf{q} = (1,\mathbf{0})$ and $\mathbf{q} = (-1,\mathbf{0})$. Both are real equilibria of the closed loop, because $\mathbf{q}_v = \mathbf{0}$ makes the control zero at either one. The proof shut out the second by staying inside $V < 4K$, the sublevel set that does not reach $q_0 = -1$.

That is not a lazy proof. The two points are the *same physical attitude*. A unit quaternion and its negative describe the same rotation, because turning an extra $360^\circ$ — $\Phi \to \Phi + 2\pi$ — flips the sign of both $\cos(\Phi/2)$ and $\sin(\Phi/2)$. So the law has been proved to drive the vehicle to one particular *label* for "no error". If the attitude estimator hands it the other label, the vehicle will turn almost all the way around to reach it. That is the **[[unwinding problem|unwinding-bridge]]**, and the spacecraft attitude control lesson later in this module fixes it with one sign.

The same reasoning hands you a region of attraction for free: $\{V < 4K\}$, that is,

$$
\tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1 - q_0) < 4K .
$$

At zero rate this allows any $q_0 > -1$ — every attitude except the exact opposite label. At zero attitude error it guarantees recovery from any rate with $\lVert\boldsymbol{\omega}\rVert$ below $\sqrt{8K/\lambda_{\max}(\mathbf{J})} = \sqrt{160/120} = 1.155\,\mathrm{rad/s}$, whatever its direction. That is a number a reviewer can check, and it came from a proof, not from a pile of simulations.

::: warning
$\dot{V} \le 0$ alone gives stability, not asymptotic stability. Writing "$\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega} \le 0$, therefore the attitude converges" skips the only step that mentions attitude at all. Without LaSalle, the vehicle drifting to rest at $90^\circ$ of error fits everything you have written.
:::

::: warning
A failed candidate proves nothing. If your $V$ gives $\dot{V} > 0$ somewhere, the system may still be perfectly stable — you picked the wrong bowl. Lyapunov's theorems are sufficient conditions only. A failed test sends you back for a better candidate, not to the conclusion that the loop is unstable.
:::

::: note Is there always a bowl?
**[[Converse theorems|converse-theorems]]** say yes: whenever the equilibrium is asymptotically stable, a suitable $V$ exists, so the search is never hopeless in principle. But their proofs build $V$ out of the unknown solutions, so they do not tell you how to write it down. That is why the practical answer is still the short list above — plus a numerical route: write $V$ as a polynomial with unknown coefficients and let a computer find coefficients that make $V$ and $-\dot{V}$ non-negative. That is the sum-of-squares method, in the next lesson.
:::

## Check yourself

::: check
For $\dot{x} = -x + x^3$, test $V = \tfrac{1}{2}x^2$. What do you conclude, and about which region?
:::

::: answer
Differentiate: $\dot{V} = x\dot{x} = -x^2 + x^4 = -x^2(1 - x^2)$. This is negative for $0 < |x| < 1$ and positive for $|x| > 1$. So the candidate certifies asymptotic stability of the origin on $|x| < 1$. The sublevel set of $V$ that fits inside that region is $\{V < 1/2\}$, which is $|x| < 1$ itself.

It is not a global result, and it should not be: $x = \pm1$ are equilibria of the system ($-1 + 1 = 0$), so nothing starting there moves toward the origin. The true region of attraction is exactly $|x| < 1$, so the estimate is tight here. That is unusual — most Lyapunov estimates are strictly conservative.
:::

::: check
A colleague proposes $V = \tfrac{1}{2}\mathbf{q}_v^\mathsf{T}\mathbf{q}_v$ for the quaternion law. Why does it fail?
:::

::: answer
It is not positive definite in the full state. It is zero for every $\boldsymbol{\omega}$ when $\mathbf{q}_v = \mathbf{0}$, so it cannot see rate at all: the state $(\mathbf{q}_v, \boldsymbol{\omega}) = (\mathbf{0}, \text{large})$ has $V = 0$ while being far from equilibrium.

Its derivative does not help either. Using $\mathbf{q}_v^\mathsf{T}(\mathbf{q}_v\times\boldsymbol{\omega}) = 0$, $\dot{V} = \mathbf{q}_v^\mathsf{T}\dot{\mathbf{q}}_v = \tfrac{1}{2}q_0\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$. That has no fixed sign and contains no damping term to make it negative. A candidate must see every state the dynamics move.
:::

::: check
In the detumble example, how would the guaranteed settling bound change if $\mathbf{P}$ were $\mathrm{diag}(80, 60, 40)$ instead of $80\,\mathbf{I}$?
:::

::: answer
The bound uses the weakest direction, so $\lambda_{\min}(\mathbf{P}) = 40$ replaces $80$:

$$
\dot{V} \le -\frac{2(40)}{120}V = -\tfrac{2}{3}V ,
$$

half the previous rate. Reaching $V < 4\times10^{-5}\,\mathrm{J}$ from $V(0) = 8.30\,\mathrm{J}$ then takes $12.243/0.6667 = 18.4\,\mathrm{s}$ instead of $9.18\,\mathrm{s}$. The real settling would be faster, because two of the three axes are damped harder than the bound assumes. But the certificate is set by the weakest axis, and no reviewer should accept a better one.
:::

::: check
Write out the LaSalle steps for $\dot{x}_1 = x_2$, $\dot{x}_2 = -x_1^3 - x_2$ with $V = \tfrac{1}{4}x_1^4 + \tfrac{1}{2}x_2^2$.
:::

::: answer
Differentiate: $\dot{V} = x_1^3\dot{x}_1 + x_2\dot{x}_2 = x_1^3x_2 + x_2(-x_1^3 - x_2) = -x_2^2 \le 0$. Negative semi-definite, so $E = \{x_2 = 0\}$.

Suppose a trajectory stays in $E$. Then $x_2 \equiv 0$, so $\dot{x}_2 \equiv 0$, and the second equation gives $-x_1^3 - 0 = 0$, so $x_1 \equiv 0$. Hence $M = \{\mathbf{0}\}$ and the origin is asymptotically stable. $V$ is radially unbounded and $\dot{V} \le 0$ everywhere, so the result is global.

Notice that the Jacobian at the origin is $\begin{bmatrix}0 & 1\\ 0 & -1\end{bmatrix}$, with eigenvalues $0$ and $-1$. The indirect method is inconclusive; the direct method settles it.
:::

::: check
The certified region for the quaternion law is $V < 4K$. A mission requires recovery from any attitude with rates up to $2\,\mathrm{rad/s}$ on the worst axis. What does the proof demand of $K$, and what does raising $K$ cost?
:::

::: answer
"Any attitude" lets $q_0$ approach $-1$, where the attitude term alone is already $4K$ — the edge of the certified set. So no rate at all can be certified on top of the worst attitude, whatever $K$ is.

Relax the requirement to "rates up to $2\,\mathrm{rad/s}$ at moderate attitude error". The kinetic part is at most $\tfrac{1}{2}(120)(2)^2 = 240\,\mathrm{J}$ (worst axis, $\lambda_{\max} = 120$). You need $240 + 2K(1 - q_0) < 4K$.

- For $q_0 \ge 0$ the worst case is $q_0 = 0$: $240 + 2K < 4K$, so $K > 120\,\mathrm{N\,m}$.
- For $q_0 = -0.5$: $240 + 3K < 4K$, so $K > 240\,\mathrm{N\,m}$.

The cost is torque. The spring term alone is $K\lVert\mathbf{q}_v\rVert$, up to $240\,\mathrm{N\,m}$ at $K = 240$, which no reaction wheel will deliver. That is the honest shape of the trade. It is also the strongest argument for the sign fix, which never lets $q_0$ go negative and so halves the worst-case attitude term from $4K$ to $2K$.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $V(\mathbf{x})$ positive definite | $V(\mathbf{0}) = 0$, $V > 0$ elsewhere — a bowl |
| $\dot{V} = \nabla V\cdot\mathbf{f}(\mathbf{x})$ | Derivative along trajectories; no solution needed |
| $\dot{V} \le 0$ | Stable; sublevel sets positively invariant |
| $\dot{V} < 0$ | Asymptotically stable; plus radially unbounded, globally so |
| LaSalle | Trajectories approach the largest invariant set $M$ inside $\{\dot{V} = 0\}$ |
| $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$, $\mathbf{u} = -\mathbf{P}\boldsymbol{\omega}$ | $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$; global detumble, $V \le V(0)e^{-2\lambda_{\min}(\mathbf{P})t/\lambda_{\max}(\mathbf{J})}$ |
| $\boldsymbol{\omega}^\mathsf{T}(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}) = 0$ | The gyroscopic term does no work — why the proof is short |
| $\mathbf{u} = -K\mathbf{q}_v - \mathbf{P}\boldsymbol{\omega}$ | Canonical quaternion feedback law |
| $V = \tfrac{1}{2}\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} + 2K(1 - q_0)$ | Its Lyapunov function; $\dot{V} = -\boldsymbol{\omega}^\mathsf{T}\mathbf{P}\boldsymbol{\omega}$ |
| $\dot{q}_0 = -\tfrac{1}{2}\mathbf{q}_v^\mathsf{T}\boldsymbol{\omega}$ | The kinematic identity that builds the potential $-2Kq_0$ |
| $M = \{\boldsymbol{\omega} = \mathbf{0}, \mathbf{q}_v = \mathbf{0}\}$ | Two points, $q_0 = \pm1$; $V < 4K$ keeps only the first |
| $\mathbf{J} = \mathrm{diag}(120,100,80)$, $K = 20$, $\mathbf{P} = 80\mathbf{I}$ | From $150^\circ$: $V(0) = 29.72\,\mathrm{J}$, error $0.564^\circ$ at $40\,\mathrm{s}$ |

The proof handed you a region of attraction as a by-product — the sublevel set $V < 4K$. The next lesson makes that the goal: how to choose $V$ and the level $c$ so the certified region is as large as the true one, and how sum-of-squares programming automates the search.

::: context lyapunov-thesis The thesis behind the method
Aleksandr Lyapunov (1857–1918) was a Russian mathematician who studied under Pafnuty Chebyshev in Saint Petersburg. His doctoral thesis, *The General Problem of the Stability of Motion*, was published in 1892. It went largely unnoticed outside Russia for decades; a French translation appeared in 1907, and control engineers took it up in earnest in the mid-twentieth century. Today his name is on the main stability tool of nonlinear control, and the same "bowl" argument is used to certify flight control laws.
:::

::: context gradient-dot Climbing rate on a hill
Stand on a hillside. The gradient $\nabla V$ is an arrow pointing straight uphill, and its length is how steep the slope is. Now walk with velocity $\mathbf{f}$. The dot product $\nabla V \cdot \mathbf{f}$ is how fast your height changes: big and positive if you walk straight uphill, zero if you walk along a contour line, negative if you walk downhill. So "$\dot{V} < 0$ everywhere" means the system's velocity always points somewhere downhill on the bowl.
:::

::: context unbounded-level-set A bowl with an open channel
The curves below are the level sets of $V = x_1^2/(1 + x_1^2) + x_2^2$, drawn for $x_1$ from $-6$ to $6$. The rings for $V = 0.25$, $0.5$ and $0.75$ (blue) are closed. The level $V = 1$ (red) never closes: it is $x_2 = \pm 1/\sqrt{1 + x_1^2}$, which creeps toward the axis but reaches $x_1 = \pm\infty$. A state can slide out along the channel between the two red curves with $V$ always below $1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="10" y1="105" x2="350" y2="105" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="20" x2="180" y2="190" stroke="#6c7a93" stroke-width="1"/>
  <path d="M165.0,105.0 L165.8,96.4 L166.5,92.9 L167.3,90.2 L168.1,87.9 L168.8,86.0 L169.6,84.2 L170.4,82.7 L171.1,81.3 L171.9,80.1 L172.7,78.9 L173.5,77.9 L174.2,77.1 L175.0,76.3 L175.8,75.6 L176.5,75.1 L177.3,74.7 L178.1,74.3 L178.8,74.1 L179.6,74.0 L180.4,74.0 L181.2,74.1 L181.9,74.3 L182.7,74.7 L183.5,75.1 L184.2,75.6 L185.0,76.3 L185.8,77.1 L186.5,77.9 L187.3,78.9 L188.1,80.1 L188.9,81.3 L189.6,82.7 L190.4,84.2 L191.2,86.0 L191.9,87.9 L192.7,90.2 L193.5,92.9 L194.2,96.4 L195.0,105.0 L194.2,113.6 L193.5,117.1 L192.7,119.8 L191.9,122.1 L191.2,124.0 L190.4,125.8 L189.6,127.3 L188.9,128.7 L188.1,129.9 L187.3,131.1 L186.5,132.1 L185.8,132.9 L185.0,133.7 L184.2,134.4 L183.5,134.9 L182.7,135.3 L181.9,135.7 L181.2,135.9 L180.4,136.0 L179.6,136.0 L178.8,135.9 L178.1,135.7 L177.3,135.3 L176.5,134.9 L175.8,134.4 L175.0,133.7 L174.2,132.9 L173.5,132.1 L172.7,131.1 L171.9,129.9 L171.1,128.7 L170.4,127.3 L169.6,125.8 L168.8,124.0 L168.1,122.1 L167.3,119.8 L166.5,117.1 L165.8,113.6 Z" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <path d="M154.0,105.0 L155.3,94.9 L156.7,90.6 L158.0,87.2 L159.3,84.2 L160.7,81.5 L162.0,79.0 L163.3,76.7 L164.7,74.5 L166.0,72.5 L167.3,70.6 L168.7,68.8 L170.0,67.2 L171.3,65.8 L172.7,64.5 L174.0,63.4 L175.3,62.5 L176.7,61.9 L178.0,61.4 L179.3,61.2 L180.7,61.2 L182.0,61.4 L183.3,61.9 L184.7,62.5 L186.0,63.4 L187.3,64.5 L188.7,65.8 L190.0,67.2 L191.3,68.8 L192.7,70.6 L194.0,72.5 L195.3,74.5 L196.7,76.7 L198.0,79.0 L199.3,81.5 L200.7,84.2 L202.0,87.2 L203.3,90.6 L204.7,94.9 L206.0,105.0 L204.7,115.1 L203.3,119.4 L202.0,122.8 L200.7,125.8 L199.3,128.5 L198.0,131.0 L196.7,133.3 L195.3,135.5 L194.0,137.5 L192.7,139.4 L191.3,141.2 L190.0,142.8 L188.7,144.2 L187.3,145.5 L186.0,146.6 L184.7,147.5 L183.3,148.1 L182.0,148.6 L180.7,148.8 L179.3,148.8 L178.0,148.6 L176.7,148.1 L175.3,147.5 L174.0,146.6 L172.7,145.5 L171.3,144.2 L170.0,142.8 L168.7,141.2 L167.3,139.4 L166.0,137.5 L164.7,135.5 L163.3,133.3 L162.0,131.0 L160.7,128.5 L159.3,125.8 L158.0,122.8 L156.7,119.4 L155.3,115.1 Z" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <path d="M135.0,105.0 L137.3,96.2 L139.6,92.2 L141.9,88.9 L144.2,85.9 L146.5,83.0 L148.8,80.2 L151.1,77.4 L153.4,74.7 L155.8,71.9 L158.1,69.2 L160.4,66.4 L162.7,63.8 L165.0,61.2 L167.3,58.7 L169.6,56.5 L171.9,54.6 L174.2,53.0 L176.5,51.9 L178.8,51.4 L181.2,51.4 L183.5,51.9 L185.8,53.0 L188.1,54.6 L190.4,56.5 L192.7,58.7 L195.0,61.2 L197.3,63.8 L199.6,66.4 L201.9,69.2 L204.2,71.9 L206.6,74.7 L208.9,77.4 L211.2,80.2 L213.5,83.0 L215.8,85.9 L218.1,88.9 L220.4,92.2 L222.7,96.2 L225.0,105.0 L222.7,113.8 L220.4,117.8 L218.1,121.1 L215.8,124.1 L213.5,127.0 L211.2,129.8 L208.9,132.6 L206.6,135.3 L204.2,138.1 L201.9,140.8 L199.6,143.6 L197.3,146.2 L195.0,148.8 L192.7,151.3 L190.4,153.5 L188.1,155.4 L185.8,157.0 L183.5,158.1 L181.2,158.6 L178.8,158.6 L176.5,158.1 L174.2,157.0 L171.9,155.4 L169.6,153.5 L167.3,151.3 L165.0,148.8 L162.7,146.2 L160.4,143.6 L158.1,140.8 L155.8,138.1 L153.4,135.3 L151.1,132.6 L148.8,129.8 L146.5,127.0 L144.2,124.1 L141.9,121.1 L139.6,117.8 L137.3,113.8 Z" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M18.8,95.1 L32.0,94.3 L45.1,93.3 L58.3,92.0 L71.4,90.6 L84.6,88.7 L97.8,86.3 L110.9,83.2 L124.1,78.9 L130.7,76.1 L137.2,72.8 L143.8,68.8 L150.4,64.1 L157.0,58.6 L163.6,52.6 L170.1,47.0 L176.7,43.5 L183.3,43.5 L189.9,47.0 L196.4,52.6 L203.0,58.6 L209.6,64.1 L216.2,68.8 L222.8,72.8 L229.3,76.1 L235.9,78.9 L249.1,83.2 L262.2,86.3 L275.4,88.7 L288.6,90.6 L301.7,92.0 L314.9,93.3 L328.0,94.3 L341.2,95.1" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <path d="M18.8,114.9 L32.0,115.7 L45.1,116.7 L58.3,118.0 L71.4,119.4 L84.6,121.3 L97.8,123.7 L110.9,126.8 L124.1,131.1 L130.7,133.9 L137.2,137.2 L143.8,141.2 L150.4,145.9 L157.0,151.4 L163.6,157.4 L170.1,163.0 L176.7,166.5 L183.3,166.5 L189.9,163.0 L196.4,157.4 L203.0,151.4 L209.6,145.9 L216.2,141.2 L222.8,137.2 L229.3,133.9 L235.9,131.1 L249.1,126.8 L262.2,123.7 L275.4,121.3 L288.6,119.4 L301.7,118.0 L314.9,116.7 L328.0,115.7 L341.2,114.9" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="340" y="100" font-size="12" fill="#1f2a44" text-anchor="end">x₁</text>
  <text x="186" y="30" font-size="12" fill="#1f2a44">x₂</text>
  <text x="250" y="62" font-size="12" fill="#b4232c">V = 1: never closes</text>
  <text x="232" y="150" font-size="12" fill="#1d6fd1">V = 0.75</text>
  <text x="20" y="190" font-size="11" fill="#6c7a93">x₁ from −6 to 6</text>
</svg>
```
:::

::: context cross-perpendicular Why the gyroscopic term does no work
The cross product $\mathbf{a}\times\mathbf{b}$ always points at right angles to both $\mathbf{a}$ and $\mathbf{b}$. The dot product of two perpendicular vectors is zero. So $\boldsymbol{\omega}\cdot(\boldsymbol{\omega}\times\mathbf{J}\boldsymbol{\omega}) = 0$ for any $\boldsymbol{\omega}$ and any $\mathbf{J}$. Physically, the gyroscopic torque only swings the spin axis around; it never speeds the body up or slows it down. That is why a torque-free tumbling body keeps its kinetic energy exactly.
:::

::: context eigen-bounds The weakest and strongest axis
For a symmetric matrix like $\mathbf{J}$, the eigenvalues are the values it takes along its special directions. For a diagonal inertia matrix they are the diagonal entries: here $80$, $100$ and $120\,\mathrm{kg\,m^2}$. The quantity $\boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega}$ is smallest, for a given $\lVert\boldsymbol{\omega}\rVert$, when the spin is about the $80$ axis, and largest about the $120$ axis. Any spin direction lands in between. That is all the sandwich $\lambda_{\min}\lVert\boldsymbol{\omega}\rVert^2 \le \boldsymbol{\omega}^\mathsf{T}\mathbf{J}\boldsymbol{\omega} \le \lambda_{\max}\lVert\boldsymbol{\omega}\rVert^2$ says.
:::

::: context runge-kutta How the "truth" is computed
Runge–Kutta methods march a differential equation forward in small time steps. The fourth-order version samples the slope four times per step — at the start, twice in the middle and at the end — and takes a weighted average. Its error per unit time shrinks like the fourth power of the step, so halving the step cuts the error about sixteen times. With a $1\,\mathrm{ms}$ step on a system that changes over seconds, the result is accurate to many digits, which is why it can serve as the "truth" a Lyapunov bound is checked against.
:::

::: context lasalle-spiral Crossing the rings, touching the floor
The blue circles are levels of $V = \tfrac{1}{2}(x_1^2 + x_2^2)$ at radius $1$, $0.75$, $0.5$ and $0.25$. The red curve is the real trajectory of $\dot{x}_1 = x_2$, $\dot{x}_2 = -x_1 - x_2^3$ from $(1, 0)$ for $12\,\mathrm{s}$, ending at radius $0.31$. It crosses the rings inward everywhere except where it passes the horizontal axis ($x_2 = 0$), where $\dot{V} = -x_2^4$ is momentarily zero and the curve only grazes a ring. It never *stays* on that axis, so it keeps losing $V$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="80" y1="110" x2="280" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="15" x2="180" y2="205" stroke="#6c7a93" stroke-width="1"/>
  <g fill="none" stroke="#8fb8f0" stroke-width="1.5">
    <circle cx="180" cy="110" r="85"/><circle cx="180" cy="110" r="63.75"/>
    <circle cx="180" cy="110" r="42.5"/><circle cx="180" cy="110" r="21.25"/>
  </g>
  <path d="M265.0,110.0 L264.6,118.5 L263.3,126.9 L261.2,135.0 L258.3,142.6 L254.7,149.6 L250.4,155.8 L245.6,161.0 L240.3,165.2 L234.6,168.4 L228.6,170.6 L222.5,172.0 L216.3,172.6 L210.0,172.5 L203.8,171.8 L197.6,170.7 L191.6,169.2 L185.8,167.3 L180.2,165.2 L174.8,162.7 L169.6,160.1 L164.8,157.2 L160.2,154.1 L156.0,150.9 L152.0,147.4 L148.5,143.8 L145.3,140.1 L142.5,136.1 L140.1,132.1 L138.1,127.9 L136.5,123.5 L135.4,119.1 L134.7,114.6 L134.5,110.0 L134.7,105.5 L135.4,101.0 L136.5,96.6 L138.0,92.4 L140.0,88.4 L142.3,84.7 L145.0,81.3 L148.1,78.4 L151.4,75.8 L154.9,73.7 L158.6,72.1 L162.5,71.0 L166.4,70.2 L170.4,70.0 L174.4,70.1 L178.4,70.6 L182.3,71.4 L186.1,72.6 L189.7,74.1 L193.2,75.8 L196.5,77.8 L199.7,80.1 L202.5,82.5 L205.1,85.1 L207.5,88.0 L209.5,90.9 L211.3,94.0 L212.7,97.3 L213.8,100.6 L214.6,104.1 L215.0,107.6 L215.1,111.1 L214.8,114.6 L214.2,118.0 L213.2,121.4 L211.9,124.6 L210.3,127.7 L208.4,130.5 L206.2,133.1 L203.8,135.4 L201.1,137.4 L198.3,139.0 L195.3,140.4 L192.3,141.3 L189.1,142.0 L185.9,142.2 L182.6,142.2 L179.4,141.9 L176.3,141.2 L173.2,140.3 L170.2,139.1 L167.4,137.7 L164.7,136.0 L162.2,134.1 L159.9,132.0 L157.8,129.8 L155.9,127.4 L154.3,124.9 L153.0,122.2 L151.9,119.4 L151.1,116.5 L150.6,113.6 L150.4,110.7 L150.5,107.7 L150.8,104.8 L151.5,101.9 L152.5,99.1 L153.7,96.4 L155.2,93.9 L156.9,91.6 L158.8,89.5 L161.0,87.6 L163.3,86.0 L165.8,84.6 L168.4,83.6 L171.1,82.8 L173.8,82.4 L176.6,82.2 L179.3,82.3 L182.1,82.6 L184.8,83.3 L187.4,84.1 L190.0,85.2 L192.4,86.5 L194.7,88.0 L196.8,89.8 L198.7,91.6" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="265" cy="110" r="4" fill="#b4232c"/>
  <text x="270" y="104" font-size="12" fill="#1f2a44">start (1, 0)</text>
  <text x="284" y="114" font-size="12" fill="#1f2a44">x₁</text>
  <text x="185" y="24" font-size="12" fill="#1f2a44">x₂</text>
  <text x="18" y="30" font-size="11" fill="#1d6fd1">rings: V = const</text>
  <text x="18" y="46" font-size="11" fill="#b4232c">path: 12 s</text>
</svg>
```
:::

::: context quaternion-refresher One turn, two labels
The scalar part of the quaternion is $q_0 = \cos(\Phi/2)$ — half the angle. The curve below plots $q_0$ as the rotation angle $\Phi$ goes from $0^\circ$ to $720^\circ$. At $0^\circ$, $q_0 = 1$. At $360^\circ$ the body is back where it started, yet $q_0 = -1$. Only after $720^\circ$ does $q_0$ return to $1$. Every physical attitude therefore has two quaternion labels, $\mathbf{q}$ and $-\mathbf{q}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="345" y2="100" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="22" x2="40" y2="178" stroke="#6c7a93" stroke-width="1"/>
  <path d="M40.0,30.0 L44.2,30.3 L48.3,31.1 L52.5,32.4 L56.7,34.2 L60.8,36.6 L65.0,39.4 L69.2,42.7 L73.3,46.4 L77.5,50.5 L81.7,55.0 L85.8,59.8 L90.0,65.0 L94.2,70.4 L98.3,76.1 L102.5,81.9 L106.7,87.8 L110.8,93.9 L115.0,100.0 L119.2,106.1 L123.3,112.2 L127.5,118.1 L131.7,123.9 L135.8,129.6 L140.0,135.0 L144.2,140.2 L148.3,145.0 L152.5,149.5 L156.7,153.6 L160.8,157.3 L165.0,160.6 L169.2,163.4 L173.3,165.8 L177.5,167.6 L181.7,168.9 L185.8,169.7 L190.0,170.0 L194.2,169.7 L198.3,168.9 L202.5,167.6 L206.7,165.8 L210.8,163.4 L215.0,160.6 L219.2,157.3 L223.3,153.6 L227.5,149.5 L231.7,145.0 L235.8,140.2 L240.0,135.0 L244.2,129.6 L248.3,123.9 L252.5,118.1 L256.7,112.2 L260.8,106.1 L265.0,100.0 L269.2,93.9 L273.3,87.8 L277.5,81.9 L281.7,76.1 L285.8,70.4 L290.0,65.0 L294.2,59.8 L298.3,55.0 L302.5,50.5 L306.7,46.4 L310.8,42.7 L315.0,39.4 L319.2,36.6 L323.3,34.2 L327.5,32.4 L331.7,31.1 L335.8,30.3 L340.0,30.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="40" cy="30" r="4" fill="#1f2a44"/><circle cx="190" cy="170" r="4" fill="#b4232c"/><circle cx="340" cy="30" r="4" fill="#1f2a44"/>
  <g font-size="12" fill="#1f2a44">
    <text x="34" y="34" text-anchor="end">1</text><text x="34" y="104" text-anchor="end">0</text><text x="34" y="174" text-anchor="end">−1</text>
    <text x="115" y="116" text-anchor="middle">180°</text><text x="265" y="116" text-anchor="middle">540°</text>
    <text x="190" y="190" text-anchor="middle" fill="#b4232c">360°: same attitude, q₀ = −1</text>
    <text x="340" y="20" text-anchor="end">720°</text>
    <text x="50" y="20">q₀ = cos(Φ/2)</text>
  </g>
</svg>
```
:::

::: context unwinding-bridge Where the missing sign comes back
Lesson 11 of this module returns to this proof. It shows a vehicle only $5^\circ$ from its target, handed the quaternion label with $q_0 < 0$, turning $355^\circ$ the long way round. The fix multiplies the spring term by $\mathrm{sign}(q_0)$, so the law always heads for whichever label is closer. That fix makes the control jump at $q_0 = 0$, and there is a deep reason some jump is unavoidable: no continuous feedback can make one attitude globally asymptotically stable on the space of rotations.
:::

::: context converse-theorems Stability guarantees a bowl exists
The converse Lyapunov theorems were proved from the late 1940s onward, with José Luis Massera and Jaroslav Kurzweil among the main contributors. The idea: if every trajectory near the equilibrium converges, define $V(\mathbf{x})$ from the trajectory that starts at $\mathbf{x}$ — for example, a weighted total of how far it strays on its way in. That function is a valid Lyapunov function. But computing it needs the very solutions the direct method was meant to avoid, so it is an existence proof, not a recipe.
:::
