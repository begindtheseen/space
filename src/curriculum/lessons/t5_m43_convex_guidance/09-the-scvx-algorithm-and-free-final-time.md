---
id: l09-scvx-algorithm-free-final-time
title: Assembling SCvx, and free final time by dilation
minutes: 24
covers:
  - The convergence ratio rho and the accept/reject/resize rule
  - Free-final-time formulation by time dilation, and the notation clash with the thrust slack
---

Think about how you would check a weather forecast. The forecast said it would be sunny and $25\,^\circ\mathrm{C}$. You could read the forecast again and nod — but that tells you nothing. The only real check is to step outside. If it really is sunny and warm, you trust tomorrow's forecast a little more. If it is pouring, you trust it less.

The trust-region rule from the previous lesson works exactly this way. The linear model makes a forecast ("this step will cut the cost by $26$"), and $\rho$ compares that forecast with what really happened. But the previous lesson handed over the two numbers — "predicted" and "actual" — as if they simply arrived. This lesson shows where each one comes from inside a real solve, and why one of them requires stepping outside: running the true, nonlinear physics.

Then it removes the last fixed number in the problem. Every SCvx example so far has quietly held the flight time $t_f$ fixed, the very thing the flight-time lesson worked to free in the 3-DoF problem. Here it is freed by a method built for an iterative solver: stretching the clock. And that brings a warning about a letter, $\sigma$, that means two different things in the papers you will read next.

## Two costs: the real one and the forecast

SCvx keeps track of two versions of the cost, and $\rho$ is built from both.

The **[[penalized true cost|merit-function]]** $J$ scores a trajectory against the real physics. It is the original cost (propellant, say) plus the penalty weight $w$ times how badly the trajectory breaks the true dynamics. To measure that, take each step of the trajectory, start from $\mathbf{x}_k$ with control $\mathbf{u}_k$, and integrate the true nonlinear equations over one time step. Call where you land $F(\mathbf{x}_k,\mathbf{u}_k)$ — read "F of x k, u k", the true one-step flow. The **defect** is how far the trajectory's own next point misses it:

$$
\boldsymbol{\delta}_k = \mathbf{x}_{k+1} - F(\mathbf{x}_k,\mathbf{u}_k),
\qquad
J = J_{\text{original}} + w\sum_k \|\boldsymbol{\delta}_k\|_1 .
$$

A trajectory the real vehicle can fly has every defect equal to zero.

The **penalized linear cost** $L$ is the subproblem's own objective — the forecast. It is the original cost plus $w$ times the virtual controls:

$$
L = J_{\text{original}} + w\sum_k \|\boldsymbol{\nu}_k\|_1 .
$$

These two agree exactly at the reference. The linear model was built to be exact there: its constant term $\mathbf{c}_k$ was chosen so that $\mathbf{A}_k\bar{\mathbf{x}}_k+\mathbf{B}_k\bar{\mathbf{u}}_k+\mathbf{c}_k = F(\bar{\mathbf{x}}_k,\bar{\mathbf{u}}_k)$. So at the reference the virtual control equals the true defect, and $L = J$. Away from the reference they drift apart, quadratically, as lesson seven measured.

Now the two halves of $\rho$ are easy to state.

- The **predicted reduction** is $J(\text{reference}) - L(\text{new candidate})$: how much the forecast says the cost fell. It is essentially free, because the subproblem solver already reports $L$ at its answer.
- The **actual reduction** is $J(\text{reference}) - J(\text{new candidate})$: how much the cost really fell. It costs one extra nonlinear simulation per iteration, to get the new candidate's true defects.

::: key What $\rho$ actually compares
$$
\rho = \frac{J(\bar{\mathbf{x}},\bar{\mathbf{u}}) - J(\mathbf{x}^{\text{new}},\mathbf{u}^{\text{new}})}{J(\bar{\mathbf{x}},\bar{\mathbf{u}}) - L(\mathbf{x}^{\text{new}},\mathbf{u}^{\text{new}},\boldsymbol{\nu}^{\text{new}})} = \frac{\text{actual reduction}}{\text{predicted reduction}},
$$
where $J$ is the penalized cost measured with the true nonlinear dynamics and $L$ is the penalized cost of the convex subproblem. The denominator is free — the subproblem solver already computed it. The numerator costs one extra nonlinear simulation per iteration, and it is the one place in the whole SCvx loop where the algorithm checks its model against reality rather than against itself.
:::

There are two honest ways to run that simulation. **[[Multiple shooting|shooting]]** propagates each step separately, from each $\mathbf{x}_k$ of the new candidate, and records every defect $\boldsymbol{\delta}_k$ — the version written above, and the one most SCvx codes use. **Single shooting** takes only the new candidate's controls, starts from the true initial state, and integrates the whole flight in one go; the trajectory it produces is flyable by construction, and it is scored on its original cost and its terminal miss. Either way, the physics gets a vote. The one thing never to do is score the new candidate using only states from the linear model, with no true integration: that grades the forecast against itself.

::: example Forecast and reality on the cubic toy
Return to the cubic cost from the trust-region lesson: true cost $g_{\text{true}}(x)=-x+0.01x^3$, linear model $g_{\text{lin}}(x)=-x$ built at the reference $x=0$. Treat two candidate answers as real subproblem outputs. (There are no dynamics here, so no defects: $J$ is $g_{\text{true}}$ and $L$ is $g_{\text{lin}}$.)

**Candidate $x=5$.** Predicted reduction: $g_{\text{true}}(0)-g_{\text{lin}}(5) = 0-(-5)=5$. Actual reduction: $g_{\text{true}}(0)-g_{\text{true}}(5)=0-(-3.75)=3.75$. So $\rho=3.75/5=0.75$ — a solid, if imperfect, forecast. Under the common default thresholds ($\rho_1 = 0.25$, $\rho_2 = 0.7$), accept and grow.

**Candidate $x=20$.** Predicted reduction: $0-(-20)=20$. But the true cost at $x=20$ is $+60$, so the actual reduction is $0-60=-60$: the cost got *worse*. So $\rho=-60/20=-3.0$. Reject and shrink.

**Sanity check.** Both candidates came from the same linear model, used at different distances from the same reference. The forecast was only honest close in, and $\rho$ catches the difference without anyone deciding in advance how far is too far.
:::

::: example A full penalized ratio
Now a case with dynamics. Use a virtual-control weight $w=100$.

**Step 1: score the reference.** Its original cost is $10.0$. Integrating the true dynamics along it gives defects whose one-norms add up to $0.3$. So

$$
J(\text{reference}) = 10.0 + 100\times0.3 = 40.0 .
$$

**Step 2: read the forecast.** The subproblem returns a candidate with original cost $9.0$ and virtual controls whose one-norms add up to $0.05$:

$$
L(\text{candidate}) = 9.0 + 100\times0.05 = 14.0, \qquad \text{predicted reduction} = 40.0 - 14.0 = 26.0 .
$$

**Step 3: step outside.** Integrate the true dynamics along the candidate. Its true defects add up to $0.08$ — a bit more than the $0.05$ the linear model thought it needed:

$$
J(\text{candidate}) = 9.0 + 100\times0.08 = 17.0, \qquad \text{actual reduction} = 40.0 - 17.0 = 23.0 .
$$

**Step 4: the ratio.** $\rho = 23.0/26.0 = 0.885$. Above $\rho_2 = 0.7$: accept, and grow the trust region.

**Sanity check.** Most of the drop came from cleaning up the dynamics: the defect penalty fell from $30$ to $8$, while the fuel cost fell only from $10$ to $9$. That is typical of early SCvx passes, which spend their effort making the trajectory physically consistent before polishing the fuel.
:::

::: warning A big drop in the subproblem's objective proves nothing on its own
The subproblem's reported objective is $L$ — the forecast. A large drop in it means only that the linear model *believes* it found a much better point, which is exactly what happened at $x=20$ while the true cost got sharply worse. Real progress is the actual reduction, measured with the true dynamics. Log both, every iteration.
:::

## The complete algorithm

With $\rho$ properly sourced, every piece is in place. One pass of SCvx:

1. **Linearize** the dynamics and every non-convex constraint about the reference $(\bar{\mathbf{x}},\bar{\mathbf{u}})$, and discretize exactly.
2. **Solve** the convex subproblem: linearized dynamics with virtual control $\boldsymbol{\nu}_k$, linearized constraints with virtual buffers, a trust region of radius $\Delta$, and the penalized cost $L$.
3. **Score** the candidate: compute $L$ (from the solver) and $J$ (from a true nonlinear propagation), then $\rho$.
4. **Decide** with the four-band rule: reject if $\rho<\rho_0$; otherwise accept, and shrink, keep or grow $\Delta$ by where $\rho$ falls. Clip $\Delta$.
5. **Stop** when the virtual control is numerically zero at every node *and* the accepted step $\|\mathbf{x}-\bar{\mathbf{x}}\|$ is below a small tolerance. Otherwise go back to step 1 — with the new reference if the step was accepted, or with the same reference and a smaller $\Delta$ if it was rejected. The loop is [[not promised to arrive|scvx-guarantee]] in any fixed number of passes, so flight code also caps the count.

::: key The SCvx iteration
Linearise the dynamics and non-convex constraints about the reference; solve the convex subproblem with a trust region and penalised virtual control; compute rho = actual/predicted reduction; accept or reject and resize; repeat until the virtual control and the step are both negligible.
:::

Two details make this work in practice. The first reference is often crude — a **[[straight-line initial guess|straight-line-guess]]** from the start state to the landing state, with the vehicle upright and hovering thrust throughout. It breaks the dynamics badly, which is fine: the virtual control absorbs the mismatch and the penalty squeezes it out over the passes. And on a rejected step nothing is relinearized; the model around the old reference is still valid, so only the subproblem is re-solved with a smaller radius.

Why are both stopping tests needed? A small step alone could mean the trust region collapsed while the trajectory is still unphysical. Zero virtual control alone could happen on a trajectory that is still moving a lot from pass to pass. Both together say: the reference no longer changes, and the linear model reproduces it with no fake push.

## Free final time by time dilation

Picture a movie. It tells the same story whether you play it at normal speed or at double speed; only how long it takes changes. You could describe the movie by "fraction of the way through", from $0$ at the start to $1$ at the end, plus one number: the playback length.

**Time dilation** does this to a trajectory. Measure progress by a normalized time $\tau$ ("tau") that runs from $0$ to $1$, and let real time be $t = s\,\tau$. The **[[dilation factor|dilation-word]]** $s$ is the playback length: it equals the flight time $t_f$, now made a decision variable.

How do the dynamics look in $\tau$? Use the **[[chain rule|chain-rule]]**. The true dynamics say $d\mathbf{x}/dt = f(\mathbf{x},\mathbf{u})$. Since $t = s\tau$, one unit of $\tau$ is $s$ seconds, so $dt/d\tau = s$. Then

$$
\frac{d\mathbf{x}}{d\tau} = \frac{d\mathbf{x}}{dt}\,\frac{dt}{d\tau} = s\,f(\mathbf{x},\mathbf{u}).
$$

In words: in the stretched clock the state changes $s$ times faster per unit of $\tau$, because each unit of $\tau$ holds $s$ seconds of real flight.

::: key Free final time by time dilation
Normalise time to $\tau \in [0,1]$ and introduce the dilation factor $s = t_f$ as a decision variable, so
$$
\frac{d\mathbf{x}}{d\tau} = s\,f(\mathbf{x},\mathbf{u}).
$$
The nonlinearity in $s$ is then absorbed by the same successive linearisation as everything else.
:::

Why not do this in the 3-DoF convex problem? Because it does not remove the difficulty. The flight-time lesson's point stands: the discretized matrices depend on $t_f$, and normalizing time only moves $t_f$ into the dynamics as a multiplier. The product $s\,f(\mathbf{x},\mathbf{u})$ is still one unknown times a function of others — not convex. For a one-shot convex solve that would break the certificate, so there the right tool was a search over $t_f$ outside a certified inner SOCP. SCvx's inner solves protect no such global guarantee, and it linearizes curved things anyway. So it can fold $s$ straight in.

Expand $s\,f$ to first order about a reference $(\bar{\mathbf{x}},\bar{\mathbf{u}},\bar s)$ using the product rule:

$$
s\,f(\mathbf{x},\mathbf{u}) \approx \bar s\,f(\bar{\mathbf{x}},\bar{\mathbf{u}}) + \bar s\,\mathbf{A}(\mathbf{x}-\bar{\mathbf{x}}) + \bar s\,\mathbf{B}(\mathbf{u}-\bar{\mathbf{u}}) + f(\bar{\mathbf{x}},\bar{\mathbf{u}})\,(s-\bar s).
$$

Here $\mathbf{A}$ and $\mathbf{B}$ are the usual Jacobians of $f$ at the reference. Read the terms one at a time. The first is the reference's own rate. The next two are the usual linearization, each multiplied by the constant $\bar s$. The last is new: a change in $s$ times the reference rate $f(\bar{\mathbf{x}},\bar{\mathbf{u}})$. Every term is affine in $(\mathbf{x},\mathbf{u},s)$, so the subproblem stays convex. Implementing free final time costs exactly one new column in the Jacobian, filled with a number the linearization step already computes.

::: note Why the new column has to be $f$
Treat $s\,f(\mathbf{x},\mathbf{u})$ as a function of three things and take the slope with respect to $s$ alone, holding $\mathbf{x}$ and $\mathbf{u}$ fixed. Since $f$ does not contain $s$, the product rule leaves only $\partial(s f)/\partial s = f$. Evaluated at the reference, that is $f(\bar{\mathbf{x}},\bar{\mathbf{u}})$. The slopes with respect to $\mathbf{x}$ and $\mathbf{u}$ are $s\,\partial f/\partial\mathbf{x} = s\mathbf{A}$ and $s\mathbf{B}$, evaluated at $s=\bar s$.
:::

::: example The dilation column is the reference's own rate
Take the velocity equation $f(\mathbf{u}) = \mathbf{u}+\mathbf{g}$ with Mars gravity $\mathbf{g}=(0,0,-3.7114)\,\mathrm{m/s^2}$. Use a reference thrust acceleration $\bar{\mathbf{u}}=(0.2,\,-0.1,\,6.9)\,\mathrm{m/s^2}$ and a reference dilation $\bar s=24.0\,\mathrm{s}$.

**Step 1: the reference rate.** $f(\bar{\mathbf{u}}) = \bar{\mathbf{u}}+\mathbf{g} = (0.2,\ -0.1,\ 6.9-3.7114) = (0.2,\ -0.1,\ 3.1886)\,\mathrm{m/s^2}$. The vertical part is positive: the engine out-pushes gravity, so the lander is slowing its fall.

**Step 2: the rate in stretched time.** $\bar s\,f = 24.0\times(0.2,-0.1,3.1886) = (4.8,\ -2.4,\ 76.53)\,\mathrm{m/s}$ per unit of $\tau$. Over the whole flight ($\tau$ from $0$ to $1$) that rate would change the velocity by about $76.5\,\mathrm{m/s}$ vertically if held — the same as $3.19\,\mathrm{m/s^2}$ for $24\,\mathrm{s}$.

**Step 3: check the new column numerically.** Nudge $s$ up and down by a tiny amount and measure the change in $s\,f$:

```python
import numpy as np

g = np.array([0.0, 0.0, -3.7114])        # Mars gravity, m/s^2
u_ref = np.array([0.2, -0.1, 6.9])       # reference thrust acceleration, m/s^2
s_ref = 24.0                              # reference dilation (flight time), s

def rhs(s, u):
    return s * (u + g)                   # d(velocity)/d(tau) = s * f(u)

h = 1e-6
column = (rhs(s_ref + h, u_ref) - rhs(s_ref - h, u_ref)) / (2 * h)
print(column.round(4))                    # [ 0.2    -0.1     3.1886]
print((u_ref + g).round(4))               # [ 0.2    -0.1     3.1886]
```

The finite-difference column equals $f(\bar{\mathbf{u}})$, as the product rule promised.

**Sanity check on the grid.** With $N=20$ equal steps in $\tau$, each step is $\Delta\tau = 1/20 = 0.05$, which is $0.05\times24.0 = 1.2\,\mathrm{s}$ of real flight. If the solver lengthens $s$ to $26\,\mathrm{s}$, each step becomes $1.3\,\mathrm{s}$: the grid stretches with the flight, and the number of nodes stays fixed.
:::

The dilation factor is treated like any other decision variable. It gets bounds — the solver needs $s>0$ and a sensible upper limit. It is penalized in the objective if the mission wants a short flight, or left free if only propellant matters. It sits inside the trust region, which now also limits how far $s$ may move from $\bar s$ in one pass. And it is accepted, rejected and resized by the same rule as everything else.

::: warning The notation clash this module has been quietly avoiding
Open a paper on SCvx with time dilation and the dilation factor is very often written $\sigma$ — a natural choice, since $\sigma$ commonly means a stretch or scale factor in applied mathematics. But this module has used $\sigma=\Gamma/m$ for the mass-normalized thrust slack since the change-of-variables lesson. It is the quantity the tightness result is built around. Using $\sigma$ for both would put $\|\mathbf{u}_k\|\le\sigma_k$ and the dilation update in one set of equations, with one letter meaning two unrelated things. That turns a correct derivation into an unreadable one. This lesson writes $s$ for the dilation factor for that reason — not because the papers are wrong. When you read one that uses $\sigma$, tell them apart by what they do: one multiplies an entire dynamics equation and has units of seconds; the other bounds a thrust magnitude and has units of $\mathrm{m/s^2}$. Relabel on the way in.
:::

## Check yourself

::: check
A subproblem's own reported objective drops by a large amount from one pass to the next. Is that, by itself, evidence the iterate is improving?
:::

::: answer
No. The subproblem's reported value is $L$, the linear model's forecast, so a big drop says only that the linear model *believes* it found a much better point. That is exactly what happened at $x=20$ in the cubic example, where the forecast promised $20$ while the true cost got worse by $60$. Evidence of real improvement needs the actual reduction: propagate the new candidate through the true dynamics, compute $J$, and compare with the reference's $J$. A large forecast drop with no actual-reduction check is precisely the trap artificial unboundedness sets.
:::

::: check
Why must the actual reduction be computed with a true nonlinear propagation, instead of plugging the new candidate's states — which the subproblem already computed — straight into the cost?
:::

::: answer
The subproblem's states satisfy the *linearized* dynamics (plus whatever virtual control was needed), not the real ones. Scoring them with no true integration would compare the linear model's cost with the linear model's cost a second time — exactly what $\rho$ exists to avoid. A true propagation is needed somewhere. Multiple shooting integrates each step from the candidate's own $\mathbf{x}_k$ and measures the defects against its $\mathbf{x}_{k+1}$. Single shooting takes only the candidate's controls — a real command sequence the engine could fly — and integrates from the true start to get the states the vehicle would actually reach. Either way the real physics, not the model, decides the numerator.
:::

::: check
In the dilation expansion, the coefficient of $(s-\bar s)$ is $f(\bar{\mathbf{x}},\bar{\mathbf{u}})$, the reference's own rate. What would it mean physically for this coefficient to be nearly zero at some node?
:::

::: answer
$f(\bar{\mathbf{x}},\bar{\mathbf{u}})\approx\mathbf{0}$ means the reference is nearly standing still at that moment: velocity near zero ($\dot{\mathbf{r}} = \mathbf{v}\approx\mathbf{0}$) and thrust nearly cancelling gravity ($\dot{\mathbf{v}} = \mathbf{u}+\mathbf{g}\approx\mathbf{0}$) — an instant of hover. At that node the linearized subproblem sees almost no effect of stretching time, so changing $s$ barely changes the predicted trajectory there. Whatever influence $s$ has must come through the nodes where the vehicle is actively moving. The dilation column's usefulness varies node to node, tied to how dynamically busy the reference is.
:::

::: check
A paper defines a "normalized thrust" $\sigma = \|\mathbf{T}\|/T_{\max}$ (a fraction of maximum thrust, between $0$ and $1$) and also uses $\sigma$ for a time-dilation factor in the same derivation. Is this the same clash this lesson warned about, or a different one?
:::

::: answer
It is the same underlying problem — one symbol with two unrelated meanings in one derivation — but it makes things worse, because this module's own $\sigma=\Gamma/m$ is neither of those. It is not a fraction between $0$ and $1$, and it is not a dilation factor: it is a mass-normalized thrust *acceleration*, with units of $\mathrm{m/s^2}$. A reader carrying this module's notation into that paper would need to relabel twice: once for the paper's own clash, and again to avoid colliding with this module's $\sigma$. That is why the habit to build is to fix what each symbol means from the constraints and units it appears in, every time, rather than trusting that a familiar letter means the familiar thing.
:::

::: check
An SCvx run has reference penalized cost $J = 52.0$. The subproblem's candidate has $L = 20.0$, and after a true propagation $J = 44.0$. With the default thresholds $\rho_0=0$, $\rho_1=0.25$, $\rho_2=0.7$ and $\alpha=\beta=2$, what happens to the step and to a trust radius of $4.0$?
:::

::: answer
Predicted reduction: $52.0-20.0 = 32.0$. Actual reduction: $52.0-44.0 = 8.0$. So $\rho = 8.0/32.0 = 0.25$. That lands exactly on $\rho_1$, which belongs to the "accept, keep" band ($\rho_1\le\rho<\rho_2$). The candidate becomes the new reference and the radius stays $4.0$. Had $\rho$ been a hair lower, say $0.24$, the step would still be accepted but the radius halved to $2.0$. The model promised four times what it delivered, so the rule does not reward it with a bigger step.
:::

## Summary

| Object | Statement |
| --- | --- |
| Penalized true cost $J$ | Original cost plus $w\sum_k\|\boldsymbol{\delta}_k\|_1$, with defects $\boldsymbol{\delta}_k = \mathbf{x}_{k+1}-F(\mathbf{x}_k,\mathbf{u}_k)$ from the true dynamics |
| Penalized linear cost $L$ | The subproblem objective: original cost plus $w\sum_k\|\boldsymbol{\nu}_k\|_1$; equals $J$ at the reference |
| Predicted reduction | $J(\text{reference}) - L(\text{candidate})$: free, from the solver |
| Actual reduction | $J(\text{reference}) - J(\text{candidate})$: one true nonlinear propagation — the one place the loop checks reality |
| Worked $\rho$ values | Cubic: $x=5$ gives $\rho=0.75$; $x=20$ gives $\rho=-3.0$. Penalized example: $\rho = 23/26 = 0.885$ |
| Stopping test | Virtual control numerically zero at every node *and* accepted step below tolerance |
| Time dilation | $\tau\in[0,1]$, $t=s\tau$, $s = t_f$: $d\mathbf{x}/d\tau = s\,f(\mathbf{x},\mathbf{u})$ |
| Linearized dilation | $s f \approx \bar s f(\bar{\mathbf{x}},\bar{\mathbf{u}}) + \bar s\mathbf{A}(\mathbf{x}-\bar{\mathbf{x}}) + \bar s\mathbf{B}(\mathbf{u}-\bar{\mathbf{u}}) + f(\bar{\mathbf{x}},\bar{\mathbf{u}})(s-\bar s)$ |
| The new column | Exactly $f(\bar{\mathbf{x}},\bar{\mathbf{u}})$ — confirmed by finite differences |
| The notation clash | Papers often write $\sigma$ for dilation; this module's $\sigma=\Gamma/m$ is the thrust slack, so dilation is $s$ here |

With $\rho$ properly sourced and free final time folded in, SCvx is complete: linearize, discretize (now with the dilation column), solve the convex subproblem with virtual control and a trust region, score it against a true propagation, accept or reject, resize, repeat. The next lesson runs all of it on a real 6-DoF landing.

::: context merit-function One number for two goals
A cost that mixes the real objective with a penalty for breaking the rules is called a **merit function** in optimization. It lets one number answer "is this candidate better?" even when a candidate can be better on fuel and worse on physics at the same time. The weight $w$ sets the exchange rate. It must be large enough that no amount of fuel saving is worth a real dynamics violation — that is what makes the $\ell_1$ penalty *exact*, as the trust-region lesson explained.
:::

::: context shooting Firing each segment or firing once
The names come from the trajectory optimization module: "shooting" means integrating the dynamics forward, like firing a cannon and seeing where the ball lands.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <text x="10" y="18" font-size="12" fill="#1f2a44">multiple shooting: one short shot per step</text>
  <circle cx="40" cy="70" r="4" fill="#1f2a44"/>
  <circle cx="120" cy="50" r="4" fill="#1f2a44"/>
  <circle cx="200" cy="45" r="4" fill="#1f2a44"/>
  <circle cx="280" cy="60" r="4" fill="#1f2a44"/>
  <path d="M 40 70 Q 80 52 118 60" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M 120 50 Q 160 40 198 56" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <path d="M 200 45 Q 240 44 278 72" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="118" y1="60" x2="120" y2="50" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="198" y1="56" x2="200" y2="45" stroke="#b4232c" stroke-width="2.5"/>
  <line x1="278" y1="72" x2="280" y2="60" stroke="#b4232c" stroke-width="2.5"/>
  <text x="292" y="72" font-size="12" fill="#b4232c">defects</text>
  <text x="10" y="118" font-size="12" fill="#1f2a44">single shooting: one long shot from the start</text>
  <circle cx="40" cy="165" r="4" fill="#1f2a44"/>
  <path d="M 40 165 Q 160 125 290 158" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="290" cy="158" r="4" fill="#1d6fd1"/>
  <text x="250" y="182" font-size="12" fill="#6c7a93">no gaps, but errors pile up</text>
</svg>
```

Multiple shooting starts every segment from the candidate's own node, so the red gaps (defects) show exactly where the physics disagrees. Single shooting leaves no gaps, but a small error early is carried and magnified all the way to the end.
:::

::: context scvx-guarantee What SCvx does promise
SCvx is not guarantee-free. Mao, Szmuk and Açıkmeşe proved in 2016 that, under technical assumptions, the accepted iterates converge to a point satisfying the first-order optimality conditions of the original non-convex problem — and, near such a point, converge quickly. What is missing compared with lossless convexification is the *global* part (it may be a local optimum) and a fixed bound on the number of passes. Lesson twelve takes up that theory and its cousin, GuSTO.
:::

::: context straight-line-guess Starting from almost nothing
A **straight-line initial guess** interpolates the state from start to finish: position slides in a straight line to the pad, velocity blends from its initial value to zero, the attitude stays upright, and the thrust holds the vehicle against gravity. It is not flyable — the defects are large — but it costs nothing to build and makes no assumptions. Being able to converge from it, usually in ten to twenty passes, is the practical test of an SCvx implementation, and it is the success bar in this module's SCvx exercise. Later lessons improve on it with **warm starting**: using the previous guidance cycle's answer as the next cycle's first reference.
:::

::: context dilation-word Stretching, not relativity
**Dilation** comes from the Latin *dilatare*, "to spread out" — the same word a doctor uses for widening the pupil of an eye. In physics you may have heard of relativity's time dilation, where moving clocks run slow. That is a different idea. Here nothing physical happens to time: the optimizer simply describes the flight on a rubber ruler from $0$ to $1$ and chooses how far to stretch it.
:::

::: context chain-rule Rates multiply
The **chain rule** says that when one quantity depends on a second, which depends on a third, the rates multiply. If a car's odometer gains $30\,\mathrm{m}$ per second, and one "movie unit" of $\tau$ lasts $24$ seconds, then the odometer gains $30\times24 = 720\,\mathrm{m}$ per unit of $\tau$. In symbols, $\frac{dx}{d\tau} = \frac{dx}{dt}\frac{dt}{d\tau}$. The fractions look like they cancel, and that is a good way to remember it — though the real proof works with limits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="40" x2="320" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="95" x2="320" y2="95" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="40" y1="34" x2="40" y2="46" stroke="#1f2a44" stroke-width="2"/>
  <line x1="320" y1="34" x2="320" y2="46" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="89" x2="40" y2="101" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="89" x2="180" y2="101" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="320" y1="89" x2="320" y2="101" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="180" y1="34" x2="180" y2="46" stroke="#1f2a44" stroke-width="2"/>
  <text x="36" y="26" font-size="12" fill="#1f2a44">τ = 0</text>
  <text x="166" y="26" font-size="12" fill="#1f2a44">0.5</text>
  <text x="304" y="26" font-size="12" fill="#1f2a44">τ = 1</text>
  <text x="34" y="118" font-size="12" fill="#1d6fd1">t = 0 s</text>
  <text x="166" y="118" font-size="12" fill="#1d6fd1">12 s</text>
  <text x="296" y="118" font-size="12" fill="#1d6fd1">t = 24 s</text>
  <line x1="180" y1="46" x2="180" y2="89" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="200" y="72" font-size="12" fill="#6c7a93">t = s τ, with s = 24 s</text>
</svg>
```
:::
