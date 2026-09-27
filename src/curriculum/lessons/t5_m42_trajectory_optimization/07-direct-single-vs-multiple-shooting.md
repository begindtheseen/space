---
id: l07-direct-single-vs-multiple-shooting
title: Direct single shooting vs direct multiple shooting
minutes: 23
covers:
  - Direct single shooting vs direct multiple shooting, and the conditioning difference between them
---

Picture trying to land a basketball in a trash can on the far side of a gym. You throw once, from where you stand. A tiny twitch of your wrist at the moment of release becomes a miss of a meter by the time the ball gets across the room. Now picture the same job done by a line of friends passing the ball hand to hand. Each friend throws only a short way. A wobble in one throw is caught and corrected by the next person before it can grow. The ball still crosses the gym, but no single throw has to be perfect.

Those are the two methods in this lesson. The one long throw is **direct single shooting**: the computer chooses only the controls and simulates the whole flight in one go. The chain of friends is **direct multiple shooting**: the flight is chopped into pieces, each piece is simulated on its own, and extra equations make the pieces join up.

The previous lesson built **direct transcription** — every state and every control at every time point becomes an unknown, tied together by defect constraints. That is one choice, not the only one. Direct single shooting is the opposite extreme: only the controls are unknown. It is a direct method (discretize first, then optimize), and it has no costate anywhere in it. But it inherits the oldest weakness of the indirect shooting from two lessons ago in a new form. Seeing exactly how is what makes multiple shooting, and the full collocation of the next lesson, worth their extra bookkeeping. On real vehicles this choice is live: long low-thrust spirals and flights near unstable points in space defeat single shooting, while short, gentle problems do not.

## Direct single shooting

Fix a **mesh** — a list of time points $t_0, t_1, \dots, t_N$ that splits the flight into $N$ steps. In single shooting the **decision vector** (the list of numbers the optimizer is allowed to change) is controls only:

$$
\mathbf{z} = (\mathbf{u}_0, \dots, \mathbf{u}_{N-1}, [t_f]).
$$

The square brackets mean "include $t_f$ if the final time is free". There are no state variables in $\mathbf{z}$ at all.

So where do the states come from? They are *computed*, not guessed. Start from the known initial state $\mathbf{x}_0$. Push it forward one step at a time with a **one-step integration map**:

$$
\mathbf{x}_{k+1} = \mathbf{F}(\mathbf{x}_k, \mathbf{u}_k), \qquad k = 0, \dots, N-1.
$$

Read $\mathbf{F}$ as "the simulator for one step". It could be one step of the classic **[[RK4|rk4]]** method, or anything else that turns "state now, control now" into "state one step later". Whatever comes out after $N$ steps is $\mathbf{x}_N$, the final state.

Notice what is missing: **defect constraints**. A defect measures how badly a guessed state disagrees with the dynamics. Here nothing is guessed, so there is nothing for a defect to measure. Every $\mathbf{z}$ the optimizer tries is a flight that obeys $\dot{\mathbf{x}} = \mathbf{f}$ (to the simulator's accuracy) by construction. What is left for the optimizer is the mission's own terminal and path constraints, checked on the simulated states. The whole problem becomes a **[[nonlinear program|nlp]]**:

$$
\min_{\mathbf{u}_0,\dots,\mathbf{u}_{N-1}} \tilde\phi\big(\mathbf{x}_N(\mathbf{z})\big) \quad\text{s.t.}\quad \boldsymbol\psi\big(\mathbf{x}_N(\mathbf{z})\big)=\mathbf{0},\quad \mathbf{u}_k\in\mathcal{U}.
$$

Read it aloud as "minimize phi tilde of the final state, over all the controls, such that psi of the final state is zero and every control is allowed". Here $\tilde\phi$ is the Mayer-form cost from the first lesson, $\boldsymbol\psi$ ("psi") is the list of things that must be true at the end (land at zero altitude, arrive at the target orbit), and $\mathcal{U}$ is the set of allowed control values (for example, thrust between zero and full). The notation $\mathbf{x}_N(\mathbf{z})$ is a reminder that the final state is a function of the controls, found by running the simulator.

That is a small problem: few variables, few constraints. And there is a real bonus while you are developing a solver. Every single guess the optimizer tries is a trajectory you could plot and sanity-check, because obeying the dynamics was never up for negotiation. Remember that property. It is why direct single shooting has not disappeared, even though the rest of this lesson explains why it scales badly.

## Why early controls shout and late controls whisper

Go back to the basketball. The final state $\mathbf{x}_N$ depends on *every* control. But it does not depend on all of them equally.

The last control, $\mathbf{u}_{N-1}$, acts for one step and then the flight is over. The first control, $\mathbf{u}_0$, acts at the very start, and whatever it does is carried forward, and grown or shrunk, through every one of the remaining steps. In calculus terms, the **sensitivity** $\partial\mathbf{x}_N/\partial\mathbf{u}_0$ (read "partial x N by partial u zero": how much the final state moves per unit nudge of the first control) is a chain rule through all $N$ steps. The sensitivity $\partial\mathbf{x}_N/\partial\mathbf{u}_{N-1}$ goes through only one.

If the dynamics have a **growing mode** — some direction in which small errors get bigger on their own, the way a pencil balanced on its tip falls faster and faster — those two numbers can differ by orders of magnitude. The optimizer's main tool, the **[[Jacobian|jacobian]]**, is the table of all these sensitivities. When its columns range over many orders of magnitude, it is **[[ill-conditioned|conditioning]]**: tiny rounding errors in the numbers turn into large errors in the step the solver takes. That is the whole problem with single shooting, and the next example puts a number on it.

::: example A closed-form amplification factor
Take the simplest system with a growing mode, a scalar $\dot x = a x + u$ with $a = 0.5\,\mathrm{s^{-1}}$. That is a mild instability: left alone, $x$ doubles about every $\ln 2 / a = 1.39\,\mathrm{s}$. Fly it for $t_f = 10\,\mathrm{s}$ with $N = 20$ steps of $h = 0.5\,\mathrm{s}$.

**Step 1: turn the dynamics into a step-by-step rule.** Hold the control constant across each step (a **[[zero-order hold|zoh]]**) and solve the differential equation exactly over the step. That gives

$$
x_{k+1} = A_d\,x_k + B_d\,u_k, \qquad A_d = e^{ah}, \quad B_d = \frac{A_d - 1}{a}.
$$

Put in the numbers: $ah = 0.5 \times 0.5 = 0.25$, so $A_d = e^{0.25} = 1.28403$. Then $B_d = (1.28403 - 1)/0.5 = 0.56805$. Read $A_d$ as "how much $x$ grows in one step" and $B_d$ as "how much one step of control adds".

**Step 2: unroll the rule.** Apply it $N$ times and collect terms:

$$
x_N = A_d^N x_0 + \sum_{k=0}^{N-1} A_d^{\,N-1-k}B_d\,u_k \qquad\Longrightarrow\qquad \frac{\partial x_N}{\partial u_k} = A_d^{\,N-1-k}B_d.
$$

**Step 3: compare the first and last control.** For the first control, $k = 0$, the power is $N - 1 = 19$: $A_d^{19} = 115.58$, so $\partial x_N/\partial u_0 = 115.58 \times 0.56805 = 65.658$. For the last control, $k = 19$, the power is $0$: $\partial x_N/\partial u_{19} = B_d = 0.56805$.

**Step 4: take the ratio.** $65.658 / 0.56805 = 115.6$. That is $A_d^{19} = e^{a(t_f - h)} = e^{4.75}$: the growth over the $9.5\,\mathrm{s}$ between the first and the last control. It sits a little under the full-horizon growth $e^{a t_f} = e^{5} = 148.4$, which is the number to remember: the spread is set by the growth rate and the length of the flight.

**Sanity check.** One Newton step on this problem has to work with a Jacobian whose first column is about $116$ times bigger than its last. Refining the mesh does not help: double $N$ and the ratio stays near $e^{a t_f}$, because it is set by $a$ and $t_f$ alone. The finer mesh only packs more columns into the same enormous range.
:::

Here is the same calculation in a few lines of Python, with the multiple-shooting numbers from the next section added at the end:

```python
import numpy as np

a, t_f, N = 0.5, 10.0, 20        # growth rate 1/s, horizon s, steps
h = t_f / N
A_d = np.exp(a * h)              # how much x grows in one step
B_d = (A_d - 1.0) / a            # how much one step of u adds

# sensitivity of the final state to each control: A_d^(N-1-k) * B_d
k = np.arange(N)
s = A_d ** (N - 1 - k) * B_d
print(f"dx_N/du_0  = {s[0]:.3f}")
print(f"dx_N/du_19 = {s[-1]:.5f}")
print(f"ratio      = {s[0] / s[-1]:.1f}")

for m in (1, 2, 4):              # number of shooting segments
    print(f"{m} segment(s): worst growth e^(a t_f/m) = {np.exp(a * t_f / m):.2f}")
# dx_N/du_0  = 65.658
# dx_N/du_19 = 0.56805
# ratio      = 115.6
# 1 segment(s): worst growth e^(a t_f/m) = 148.41
# 2 segment(s): worst growth e^(a t_f/m) = 12.18
# 4 segment(s): worst growth e^(a t_f/m) = 3.49
```

::: note Why it has to be true: the sensitivity formula
Nudge $u_0$ by a small amount $\delta u_0$ ("delta u zero") and leave every other control alone. The nudge enters the dynamics exactly once, at the first step: it changes $x_1$ by $B_d\,\delta u_0$. After that, $u_0$ never appears again. The change in $x_1$ is carried forward like any other change in the state: the rule $x_{k+1} = A_d x_k + \dots$ multiplies it by $A_d$ at every later step. There are $N - 1$ later steps, so by the end the change is $A_d^{N-1}B_d\,\delta u_0$. Divide by $\delta u_0$ and you have $\partial x_N/\partial u_0 = A_d^{N-1}B_d$. The same argument for control $k$ counts $N - 1 - k$ later steps. For a stable system, $|A_d| < 1$ and the early controls are *quieter* instead. It is the growing mode that makes them shout.
:::

There is a second cost hiding here. Every terminal constraint depends on every control, so every entry of single shooting's Jacobian is filled in: it is **dense**. A solver cannot skip any of it, and the work to factor it grows fast with $N$.

## Direct multiple shooting

The fix is the chain of friends. Pick some **breakpoints** — interior times $t_0 < \tau_1 < \dots < \tau_{m-1} < t_f$ that cut the flight into $m$ **segments** ($\tau$ is the Greek letter "tau"). Then:

1. Give each segment its own controls, as before.
2. Also give each segment its own **free initial state** $\mathbf{y}_i$ ("y sub i"), a guess for where the vehicle is at the start of segment $i$. It is an unknown, like a control.
3. Simulate each segment forward from its own $\mathbf{y}_i$, exactly as single shooting simulates the whole flight.
4. Add **[[continuity constraints|continuity]]**: the simulated end of segment $i$ must equal $\mathbf{y}_{i+1}$, the start of the next one. Each is $n$ equations, one per state.
5. Put the original terminal conditions on the end of the last segment only.

At the start of a solve the segment ends usually do not meet — the trajectory has gaps. The optimizer closes the gaps while it improves the cost. At the solution they are all closed, and the pieces form one continuous flight.

Why does this help? No sensitivity now has to survive longer than one segment. A nudge to a control can only grow until the end of its segment. There, the next segment starts from its own free $\mathbf{y}_{i+1}$, and the continuity equation that ties them together is simple and linear in $\mathbf{y}_{i+1}$. For the growing-mode system, the worst amplification inside a segment of length $t_f/m$ is $e^{a t_f/m}$.

::: example How many segments tame the toy problem
Stay with $\dot x = 0.5x + u$ over $10\,\mathrm{s}$.

**One segment** (single shooting): worst growth $e^{0.5 \times 10} = e^{5} = 148.4$.

**Two segments** of $5\,\mathrm{s}$: worst growth $e^{0.5 \times 5} = e^{2.5} = 12.18$. The price is $1$ extra state unknown ($y_2$) and $1$ continuity equation. With $n$ states it would be $n$ of each.

**Four segments** of $2.5\,\mathrm{s}$: worst growth $e^{0.5 \times 2.5} = e^{1.25} = 3.49$. The price is $3$ extra unknowns and $3$ continuity equations — one per interior breakpoint.

**Sanity check.** Each doubling of $m$ takes the square root of the growth: $\sqrt{148.4} = 12.18$ and $\sqrt{12.18} = 3.49$. That is what exponents do when you halve them. The total span over which the dynamics can amplify anything is now capped by the segment length, not by the length of the mission.
:::

::: key Why segmenting helps, in one line
Direct single shooting's Jacobian entries scale like the dynamics' amplification over the *entire* horizon, about $e^{a t_f}$. Multiple shooting's scale like the amplification over one *segment*, about $e^{a t_f/m}$, however short you choose to make it. The price is carrying the segment start states as explicit unknowns, tied together by continuity constraints.
:::

The shape of the Jacobian changes too. A continuity equation for the boundary between segments $i$ and $i+1$ involves only segment $i$'s start state and controls, and $\mathbf{y}_{i+1}$. It does not care about segment $5$ when it sits between segments $1$ and $2$. So the Jacobian is mostly zeros, with the nonzero entries in small blocks along the diagonal: it is **[[block-banded|block-banded]]**. A sparse solver skips the zeros, and its work grows only in proportion to the number of segments. More unknowns, but much better behaved ones.

Now push the idea to its limit. Make *every* mesh interval its own segment, of length $h$. Then "simulate the segment forward" shrinks to a single-step formula, and the continuity constraint becomes an equation linking a node's state to its neighbor's. That is exactly the defect constraint of the previous lesson. **Collocation**, the subject of the next lesson, is multiple shooting taken to the extreme: the defect constraint *is* a one-step multiple-shooting continuity condition, no more and no less.

## Do you actually need it?

The toy problem was chosen to have a growing mode. Real problems vary, and the honest way to decide is to measure.

::: example The orbit transfer, honestly graded
Take the minimum-time orbit transfer of the shooting lessons: $7000\,\mathrm{km}$ to $9000\,\mathrm{km}$, $100\,\mathrm{N}$ of thrust on a $1200\,\mathrm{kg}$ spacecraft, controlled by the steering angle $\beta$ ("beta", the angle of the thrust away from the direction of travel). Set it up as direct single shooting with $40$ values $\beta_0, \dots, \beta_{39}$, each held for one fortieth of $t_f = 12.370316$ nondimensional time units (the optimal flight time from the shooting lesson).

**Step 1: pick a candidate.** Use the simplest one a person would write down: $\beta_k = 0$ for every $k$, thrust always pointed along the direction of travel.

**Step 2: measure each column.** Nudge one $\beta_k$ at a time by a tiny amount, re-simulate with RK4, and record how far the final state $(r, v_r, v_t)$ moves per unit nudge. The size of that change is the length of column $k$ of the Jacobian.

**Step 3: read the spread.** The first column has length $3.2\times10^{-3}$. The smallest is $2.2\times10^{-3}$ and the largest is $5.7\times10^{-3}$, about four-fifths of the way through the transfer. The biggest is only $2.6$ times the smallest. Repeating the measurement about the optimal steering history instead gives a spread of $4.1$.

**Sanity check.** Compare $2.6$ to the toy problem's $116$. This matches the shooting lesson's [[monodromy|monodromy]] result that the transfer amplifies errors by at most about $3.4$ over its whole length. For a two-orbit transfer with a fairly strong thrust, single shooting's columns are all about the same size. Nothing here demands multiple shooting.
:::

The lesson is not "multiple shooting never matters for real vehicles". It is that whether it matters depends on the *dynamics' amplification over the horizon in question*, and you now know how to measure that directly: linearize, then look at the spread of the sensitivities or at the monodromy eigenvalues. Do not assume it.

Plenty of real problems are the other kind. A many-orbit low-thrust spiral, a multi-year trip to another planet, or any flight near a genuinely unstable direction — the region around a **[[libration point|libration]]**, or an atmospheric entry corridor — will show the toy problem's $100$-fold spread or worse. There, direct single shooting is not a little slower. It usually fails to converge from any first guess a person would write down, for exactly the reason the closed-form example showed.

::: warning Do not throw away single shooting's real advantage by accident
It is tempting to count "no defect constraints" purely as a weakness. It is not only that. Because the dynamics are always satisfied, single shooting never needs a sensible guess for the *states* — only a plausible control history. Collocation needs a state guess too, and if that guess breaks the dynamics badly, the solver starts far from satisfying its own defects. On a short, well-behaved problem, that can make single shooting easier to get running at all, even though it conditions worse as the horizon grows. Multiple shooting keeps a version of the same advantage: each segment's simulated piece obeys the dynamics even before the gaps are closed. That is one reason multiple shooting is a common middle ground, rather than everyone jumping straight to fine-grained collocation.
:::

## Check yourself

::: check
Direct transcription in general, and direct multiple shooting in particular, are built around defect (or continuity) constraints. Why does direct single shooting have none at all?
:::

::: answer
A defect constraint exists to force a *free* state variable to agree with the dynamics. It has no job when the state is not free in the first place. Direct single shooting never makes a state an unknown. Each $\mathbf{x}_k$ is computed from $\mathbf{x}_0$ and the controls $\mathbf{u}_0, \dots, \mathbf{u}_{k-1}$ by simulation, so agreement with $\dot{\mathbf{x}} = \mathbf{f}$ is guaranteed by how $\mathbf{x}_k$ was built, not imposed afterward. Multiple shooting brings back exactly enough freedom (a state unknown at the start of every segment after the first) to need exactly enough equations (one continuity condition per interior breakpoint) to remove it again.
:::

::: check
The closed-form example found $\partial x_N/\partial u_0 = A_d^{19}B_d$. Explain in words, without redoing the algebra, why this sensitivity involves $B_d$ only once and $A_d$ nineteen times, and why no other control appears in it.
:::

::: answer
A nudge to $u_0$ enters the dynamics only once, at the first step, where it adds $B_d\,\delta u_0$ to $x_1$. From then on it is carried forward like any other change in the state: each later step multiplies it by $A_d$, and $u_0$ never adds anything again. There are $N - 1 = 19$ later steps, so at the end the change is $A_d^{19}B_d\,\delta u_0$. The other controls add their own terms to $x_N$, but those terms do not change when $u_0$ is nudged (the system is linear), so they drop out of this particular sensitivity.
:::

::: check
A four-segment multiple-shooting solve of the unstable toy problem converges easily. A two-segment solve from the same first guess is noticeably harder. Is that consistent with this lesson?
:::

::: answer
Yes. With $m$ equal segments the worst growth a segment must survive is $e^{a t_f/m}$. For four segments that is $e^{0.5 \times 10/4} = e^{1.25} = 3.49$. For two it is $e^{0.5 \times 10/2} = e^{2.5} = 12.18$. That is a real difference in how well each piece is conditioned, even though both are far better than single shooting's $e^{5} = 148.4$. More segments trade extra unknowns and continuity equations for a smaller exponent per segment. The theory predicts the problem gets steadily easier as $m$ grows, with diminishing returns once the growth per segment is already close to $1$.
:::

::: check
Someone argues: "Collocation is multiple shooting with every mesh interval as its own segment, so it must always be better conditioned than any coarser multiple-shooting split." What is wrong with that argument?
:::

::: answer
Finer segments reduce the amplification any one segment's sensitivities must survive. But they increase the *number* of unknowns and constraints, which grows with the number of segments. A system made of thousands of well-conditioned local blocks is not automatically well-conditioned as a whole, especially once the solver's own numerical linear algebra, rather than the dynamics' amplification, becomes the main source of error. In practice collocation usually *is* the better-conditioned choice, for the reasons in this lesson. But "finer is strictly better with no downside" proves too much: it would also say an arbitrarily fine mesh is always free, and the later lesson on mesh refinement shows what extra nodes really cost.
:::

::: check
Single shooting on the orbit transfer showed a column spread of about $2.6$. A colleague plans a single-shooting solver for a $400$-day low-thrust spiral that circles Earth hundreds of times on the way out to the Moon. Using this lesson's reasoning, what would you tell them to check first?
:::

::: answer
Check the amplification over the whole horizon before writing the solver. Linearize about a plausible spiral and measure the spread of $\partial\mathbf{x}_N/\partial\mathbf{u}_k$ across the controls, or the size of the monodromy eigenvalues. The two-orbit transfer's spread was small because its horizon was short. Hundreds of revolutions give the dynamics hundreds of times as long to amplify an early steering error, and the spiral ends close to the Moon, where the dynamics have genuinely unstable directions. If the spread comes out in the hundreds or thousands, single shooting will likely fail to converge, and the problem should be split into segments (multiple shooting) or transcribed by collocation.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Direct single shooting | Only controls are unknown; $\mathbf{x}_k$ computed by simulation; no defect constraints; every iterate obeys the dynamics |
| Why it conditions badly | $\partial\mathbf{x}_N/\partial\mathbf{u}_k$ passes through $N-1-k$ further steps; with a growing mode, early controls are far more sensitive than late ones |
| Closed-form example | $\dot x = 0.5x + u$, $t_f = 10\,\mathrm{s}$, $N = 20$: $\partial x_N/\partial u_0 = 65.658$, $\partial x_N/\partial u_{19} = 0.56805$, ratio $115.6$, near $e^{a t_f} = 148.4$ |
| Jacobian shape | Single shooting: dense. Multiple shooting and collocation: block-banded |
| Direct multiple shooting | Free state at each segment start, continuity constraints between segments; worst growth $e^{a t_f/m}$ for $m$ segments |
| Segment count example | $m = 1$: $148.4$; $m = 2$: $12.18$; $m = 4$: $3.49$ |
| Orbit-transfer check | Column spread $2.6$ about $\beta \equiv 0$, $4.1$ about the optimum: mild, matching the monodromy amplification of about $3.4$ |
| Collocation | The limit of multiple shooting with one segment per mesh interval: a defect is a one-step continuity condition |
| Trade-off | Shooting keeps every iterate dynamically feasible; collocation conditions better but needs a state guess |

The next lesson builds that limiting case in full: the trapezoidal and Hermite-Simpson defect constraints that make collocation what most people mean by "direct transcription" in practice, and the convergence order that makes the choice between them matter.

::: context rk4 The workhorse simulator
RK4 is the fourth-order Runge-Kutta method, the most common way to step a differential equation forward on a computer. Instead of using the slope only at the start of a step, it samples the slope four times — at the start, twice in the middle, and at the end — and takes a weighted average with weights $1, 2, 2, 1$ out of $6$. Halving the step size cuts its error over a whole flight by about $16$. Flight software, trajectory tools and this module's own checks use it constantly.
:::

::: context nlp What a nonlinear program is
A **nonlinear program**, NLP for short, is the standard form a general-purpose optimizer accepts: a finite list of unknown numbers, one number to minimize, and a list of equations and inequalities the unknowns must satisfy, where any of these may be curved rather than straight-line functions. "Program" here is old wording for "plan", from the 1940s, not computer code. Every direct method in this module, whatever its details, ends by handing an NLP to a solver such as IPOPT or SNOPT.
:::

::: context jacobian A table of sensitivities
The **Jacobian** is the table of first derivatives of a list of outputs with respect to a list of inputs: row $i$, column $j$ holds how much output $i$ moves per unit change in input $j$. For single shooting the outputs are the final-state constraints and the inputs are the controls, so column $k$ says what control $k$ does to the landing point. Newton-type solvers use this table to decide which way to step. It is named after the German mathematician Carl Gustav Jacobi (1804–1851).
:::

::: context conditioning When small errors become big ones
A problem is **ill-conditioned** when tiny errors in the inputs cause large errors in the answer. The picture: find where two lines cross. If they meet at a right angle, wiggling one line barely moves the crossing. If they are nearly parallel, a small wiggle slides the crossing far along. The **condition number** measures this; a rough rule is that a condition number of $10^k$ can cost you about $k$ of your digits.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="30" x2="150" y2="120" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="30" y1="120" x2="150" y2="30" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="30" y1="112" x2="150" y2="22" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="90" cy="75" r="4" fill="#b4232c"/>
  <circle cx="84.7" cy="71" r="4" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="90" y="142" font-size="12" text-anchor="middle" fill="#1f2a44">well-conditioned</text>
  <line x1="200" y1="90" x2="340" y2="60" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="200" y1="80" x2="340" y2="70" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="200" y1="72" x2="340" y2="62" stroke="#1f2a44" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="270" cy="75" r="4" fill="#b4232c"/>
  <circle cx="326" cy="63" r="4" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="270" y="142" font-size="12" text-anchor="middle" fill="#1f2a44">ill-conditioned</text>
</svg>
```

The dashed line is the same small shift in both pictures. The crossing (red) barely moves on the left and slides far on the right.
:::

::: context zoh Holding the knob still
A **zero-order hold** means the control is set at the start of each step and held flat until the next one, so the control history looks like a staircase. It is how a flight computer really commands an actuator: a new value every cycle, constant in between. With the control constant across a step, a linear system like $\dot x = ax + u$ can be solved exactly over the step, which is where $A_d = e^{ah}$ and $B_d = (e^{ah}-1)/a$ come from.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="110" x2="340" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40,80 L100,80 L100,50 L160,50 L160,65 L220,65 L220,35 L280,35 L280,70 L340,70" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="40" cy="80" r="3.5" fill="#b4232c"/>
  <circle cx="100" cy="50" r="3.5" fill="#b4232c"/>
  <circle cx="160" cy="65" r="3.5" fill="#b4232c"/>
  <circle cx="220" cy="35" r="3.5" fill="#b4232c"/>
  <circle cx="280" cy="70" r="3.5" fill="#b4232c"/>
  <text x="40" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">t0</text>
  <text x="100" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">t1</text>
  <text x="160" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">t2</text>
  <text x="220" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">t3</text>
  <text x="280" y="126" font-size="11" text-anchor="middle" fill="#1f2a44">t4</text>
  <text x="30" y="30" font-size="12" text-anchor="end" fill="#1f2a44">u</text>
  <text x="340" y="126" font-size="11" text-anchor="end" fill="#6c7a93">time</text>
</svg>
```

Each red dot is a control value the optimizer picks; the blue staircase is what the vehicle actually feels.
:::

::: context continuity Closing the gaps
Picture multiple shooting's first guess: several short pieces of trajectory, each starting from its own guessed state, and their ends not quite meeting. Each continuity constraint says "this gap must be zero". The solver works on all gaps at once, and at the solution the pieces join into one smooth flight.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <path d="M20,120 C50,108 80,95 110,88" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M120,76 C150,66 180,60 210,56" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <path d="M220,40 C250,34 290,30 330,28" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="20" cy="120" r="4" fill="#1f2a44"/>
  <circle cx="120" cy="76" r="4" fill="#1f2a44"/>
  <circle cx="220" cy="40" r="4" fill="#1f2a44"/>
  <line x1="110" y1="88" x2="120" y2="76" stroke="#b4232c" stroke-width="2" stroke-dasharray="3 2"/>
  <line x1="210" y1="56" x2="220" y2="40" stroke="#b4232c" stroke-width="2" stroke-dasharray="3 2"/>
  <text x="20" y="140" font-size="11" text-anchor="middle" fill="#1f2a44">x0</text>
  <text x="120" y="100" font-size="11" text-anchor="middle" fill="#1f2a44">y2</text>
  <text x="220" y="64" font-size="11" text-anchor="middle" fill="#1f2a44">y3</text>
  <text x="170" y="115" font-size="12" text-anchor="middle" fill="#b4232c">gaps = continuity errors</text>
</svg>
```

Black dots are the free segment start states; the red dashes are the gaps the constraints drive to zero.
:::

::: context block-banded Where the nonzeros live
Draw the multiple-shooting Jacobian as a grid, one row per constraint and one column per unknown, and shade the entries that can be nonzero. Each continuity constraint touches only one segment's unknowns and the next segment's start state, so the shading forms a staircase of small blocks down the diagonal. Single shooting's grid is shaded everywhere.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="20" width="120" height="120" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="80" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">single shooting: dense</text>
  <rect x="210" y="20" width="120" height="120" fill="#ffffff" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="210" y="20" width="45" height="30" fill="#1d6fd1"/>
  <rect x="240" y="50" width="45" height="30" fill="#1d6fd1"/>
  <rect x="270" y="80" width="45" height="30" fill="#1d6fd1"/>
  <rect x="300" y="110" width="30" height="30" fill="#1d6fd1"/>
  <text x="270" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">multiple shooting: banded</text>
</svg>
```

A sparse solver stores and factors only the blue blocks, so its work grows in step with the number of segments.
:::

::: context monodromy A callback to the shooting lesson
Lesson four measured how much the orbit transfer amplifies a small error, using the **monodromy matrix** — the table of sensitivities of the whole state and costate at the end of a flight to their values at the start. Its largest eigenvalue over the full transfer was about $3.38$. That is a small number: errors grow, but only a few times over. The column spread of $2.6$ found here is the same story told through the controls instead of the costates.
:::

::: context libration Balancing points in space
A **libration point** (or Lagrange point) is one of five places where a spacecraft can hover in step with two big bodies, such as the Sun and Earth. Three of them lie on the line through the two bodies and are unstable, like a ball balanced on a hilltop: a small push grows with time. The James Webb Space Telescope orbits the Sun-Earth L2 point, about $1.5$ million km from Earth, and fires thrusters every few weeks to stay there. Trajectories near such points have exactly the growing modes that break single shooting.
:::
