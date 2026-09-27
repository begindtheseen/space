---
id: l04-shooting-and-brittleness
title: The two-point boundary value problem and why shooting is brittle
minutes: 22
covers:
  - "The two-point boundary value problem; single and multiple shooting; costate sensitivity and why indirect methods are brittle"
---

Picture a basketball free throw. You cannot reach out and place the ball in the hoop. All you control is how you launch it: the angle and the speed. So you shoot, watch where it lands, and adjust. Too short? Push a little harder. Off to the left? Aim a little right. After a few tries, you are sinking it.

That is how engineers solve the necessary conditions from the last three lessons. The method is even called **[[shooting|shooting-name]]**. You cannot write down the answer directly, so you guess the launch, fly the whole trajectory on the computer, see how badly it misses the target, and correct the guess.

This lesson does it for real, on the low-thrust orbit transfer that lesson two set up. It converges. But it also shows, with numbers, why this approach has a reputation for being **brittle** — easy to break. The necessary conditions are perfectly correct. Getting a computer to *use* them is a different matter.

## Half the clues at each end

Put the last three lessons together and you have a complete recipe for the best trajectory:

- the state $\mathbf{x}$ obeys $\dot{\mathbf{x}}=\partial H/\partial\boldsymbol\lambda$, and it is known at the **start**, $\mathbf{x}(t_0)$;
- the costate $\boldsymbol\lambda$ ("lambda") obeys $\dot{\boldsymbol\lambda}=-\partial H/\partial\mathbf{x}$, and what you know about it is a transversality condition at the **end**, $t_f$;
- at every instant, the minimum principle picks the control $\mathbf{u}(t)$ from the state and costate together.

(As in lessons two and three, these lessons write the costate $\boldsymbol\lambda$; the module's flashcards write it $\mathbf{p}$. Same object.)

So half the clues sit at the start and half sit at the end. A problem like that is called a **two-point boundary value problem**, or **BVP**: differential equations whose conditions are split between two different times.

Why is that awkward? A computer integrates a differential equation by marching forward one small step at a time. To march, it needs *every* number at the starting line. Here it has the starting state but not the starting costate. It is like being told where a hiker started and which campsite she reached at sunset, and being asked what direction she set off in.

::: key State forward, costate backward
The costate equation $\dot{\mathbf{p}}=-\partial H/\partial\mathbf{x}$ is naturally integrated **backward** from its terminal condition $\mathbf{p}(t_f)=\partial\phi/\partial\mathbf{x}(t_f)$, while the state runs **forward** from $\mathbf{x}(t_0)$. The state goes forward, the costate goes backward — that is what makes it a two-point boundary value problem.
:::

## Shooting: guess, fly, miss, correct

**Single shooting** turns the BVP into a guessing game with a scorecard.

1. **Guess** the missing starting numbers: the costate $\boldsymbol\lambda(t_0)$, and the final time $t_f$ too if it is free. Stack them into one **guess vector** $\mathbf{z} = \big(\boldsymbol\lambda(t_0), t_f\big)$.
2. **Fly.** Now every number at the start is known, so integrate the state and costate together, forward, from $t_0$ to the guessed $t_f$. This is an ordinary initial value problem.
3. **Score the miss.** At the end, check every condition that should hold there: the target state, the transversality equations. Each one becomes a number that should be zero. Stack them into the **residual vector** $F(\mathbf{z})$. ("Residual" means "what is left over" — the leftover error.)
4. **Correct.** Hand the equation $F(\mathbf{z})=\mathbf{0}$ to a root finder, which proposes a better $\mathbf{z}$. Go back to step 2.

The usual root finder is **[[Newton's method|newton]]**. It measures how each residual changes when each guess is nudged — a table of slopes called the **Jacobian** — and jumps to where a straight-line model of $F$ says zero should be. Near the answer it is fast: the number of correct digits roughly doubles every step. Far from the answer, the straight-line model can be badly wrong, so good codes shorten the jump until the miss actually shrinks. That safety habit is called a **line search**.

When $F(\mathbf{z})$ reaches zero, every necessary condition holds, and the best trajectory is simply the flight you just integrated.

::: example Shooting a minimum-time orbit raise
A $1200\,\mathrm{kg}$ spacecraft has a steady electric engine: thrust $T_{\max}=100\,\mathrm{N}$ and $I_{sp}=1800\,\mathrm{s}$, so $c = 1800\times9.80665 = 17\,651.97\,\mathrm{m/s}$. It must climb from a circular orbit of radius $r_0=7000\,\mathrm{km}$ (speed $7546.05\,\mathrm{m/s}$) to one of radius $r_1=9000\,\mathrm{km}$ (speed $6654.99\,\mathrm{m/s}$) in minimum time.

**Step 1: the states.** In polar coordinates the state is $(r,\theta,v_r,v_t)$: radius, angle, outward speed, sideways speed. Lesson two showed that the angle $\theta$ and its costate drop out completely. That leaves three states, $(r, v_r, v_t)$.

**Step 2: the control.** For minimum time, more thrust never hurts, so the engine is always on at $T_{\max}$. What is left to choose is the direction: the **steering angle** $\beta(t)$, measured from the sideways direction. Minimizing $H$ over $\beta$ says the thrust points exactly opposite the velocity costates $(\lambda_{v_r},\lambda_{v_t})$:

$$
\sin\beta^\star = -\frac{\lambda_{v_r}}{\sqrt{\lambda_{v_r}^2+\lambda_{v_t}^2}}, \qquad \cos\beta^\star=-\frac{\lambda_{v_t}}{\sqrt{\lambda_{v_r}^2+\lambda_{v_t}^2}}.
$$

This is the classic **[[primer-vector|primer]]** steering law. It is smooth, not bang-bang, because $\beta$ enters $H$ through $\sin$ and $\cos$, not in a straight line.

**Step 3: unknowns and residuals.** Four guesses, $\mathbf{z}=\big(\lambda_r(0),\lambda_{v_r}(0),\lambda_{v_t}(0),t_f\big)$. Four residuals: the three final-state errors $r(t_f)-r_1$, $v_r(t_f)$ and $v_t(t_f)-6654.99\,\mathrm{m/s}$, plus $H(t_f)=0$ for the free final time. Four equations, four unknowns: a square system, as root finding needs.

**Step 4: solve.** The computer works in **[[nondimensional units|canonical-units]]**: lengths in units of $r_0 = 7000\,\mathrm{km}$, times in units of $927.64\,\mathrm{s}$ (the starting orbit's period divided by $2\pi$). Newton's method converges to

$$
\boldsymbol\lambda(0) = (-76.7223,\ -17.7768,\ -92.4553), \qquad t_f = 12.370307 \times 927.64\,\mathrm{s} = 11\,475.16\,\mathrm{s}.
$$

**Step 5: check it.** That is $3.19$ hours, about $1.97$ laps of the starting orbit. The spacecraft arrives within a millimeter of the target radius, with speed errors below $10^{-7}\,\mathrm{m/s}$, and $H(t_f) = 3.9\times10^{-12}$ — zero, up to computer round-off. The engine burns $100/17\,651.97 = 0.005665\,\mathrm{kg/s}$ for $11\,475.16\,\mathrm{s}$, which is $65.01\,\mathrm{kg}$, or $5.42\,\%$ of the spacecraft. A push of $100/1200 \approx 0.08\,\mathrm{m/s^2}$ kept up for two laps sensibly buys a climb of this size.
:::

::: warning Here $H$ alone is not constant, and that is correct
Lesson three said a time-invariant problem has a constant $H$. Evaluate this transfer's $H$ along the flight and it drifts from $0.0355$ at the start to $0$ at arrival. Nothing is wrong. The code treats the mass as a known function of the clock, $m(t) = m_0 - (T_{\max}/c)\,t$, so the dynamics depend on time directly and lesson three's rule does not apply. Carry mass as a proper state, with its own costate $\lambda_m$, and the full Hamiltonian $H + \lambda_m\dot m$ stays at $0$ (to $10^{-9}$) the whole way. Before you call a drifting $H$ a bug, ask whether the clock is hiding somewhere in your dynamics.
:::

## Guessing is the hard part

Converging is not the hard part. **Guessing well enough to converge is.** Here is what happened with some natural first guesses, using Newton's method with a line search, up to $100$ steps, all in the nondimensional units above.

- **All costates zero.** The steering law divides by $\sqrt{\lambda_{v_r}^2+\lambda_{v_t}^2} = 0$. The thrust direction is undefined at the very first instant, and Newton cannot take a single step.
- **Costates chosen to point the thrust forward**, $\boldsymbol\lambda(0) = (0,0,-1)$. A sensible physical idea: push along the direction of motion to speed up and climb. It fails. The search stalls with the residual stuck at $0.39$.
- **Small costates**, $0.1$ in every component. Also fails, stalling at $0.37$.
- **$25$ random guesses**, each costate drawn evenly from $-3$ to $3$ and $t_f$ from $10$ to $15$ (near the right size, so the one unknown with an obvious physical scale is not sabotaged). Only $11$ converged. All $11$ found the same, correct solution. In $11$ of the $14$ failures, the first few Newton steps slashed $t_f$ to less than half its true value, and the search stuck there.

That is a $44\,\%$ hit rate on a problem where everything else — the dynamics, the target, the engine — is known exactly.

Why is it so hard? A costate is a **price** — lesson two showed it is the slope of the best remaining cost with respect to the state. You cannot know a price before you know the best plan it prices.

::: key Why the costates resist a physical guess
Unlike a state, which has units and a size you can reason about, a costate is the sensitivity of the remaining optimal cost to that state. You cannot picture it until a best trajectory exists to compute it from. There is no feel for guessing $\lambda_r(0)$ the way there is for an initial speed.
:::

There is a second clue in the steering law. It depends only on the *direction* of $(\lambda_{v_r},\lambda_{v_t})$, and the costate equations are straight-line (linear) in $\boldsymbol\lambda$. So doubling every costate changes nothing about the flight. Only the "$1$" in $H = 1 + \boldsymbol\lambda^\top\mathbf{f}$ makes the condition $H(t_f)=0$ pin down the overall size.

### The other half of brittleness: new constraints mean new math

Guessing is the *numerical* half of the problem. There is also an *analytical* half. Suppose the mission adds a rule this transfer never had: a maximum outward speed, say, so the vehicle never dives too fast toward its lowest point. In the indirect method, that rule does not slot into the existing Hamiltonian. Wherever it is active, the flight has a **[[constrained arc|constrained-arc]]** with its own multiplier. The costates can jump at the **junctions** where the rule switches on and off, and you must work out the jump conditions by hand. You must also re-decide which pieces the trajectory now has — bang-bang, singular, constrained — and in what order.

None of that shows up in a residual. It shows up earlier, in how much algebra you redo before there is a residual at all. The direct methods later in this module answer the same request with one more inequality at every mesh point.

## Why errors grow: the sensitivity matrix

Suppose your guess for $\boldsymbol\lambda(0)$ is off by a small error. How big is the miss at the end?

For small errors, the answer is a matrix. Stack the state and costate into one six-number vector. Let $\Phi(t,0)$ ("capital phi") be the table of how each of the six numbers at time $t$ changes when each of the six numbers at time $0$ is nudged:

$$
\Phi(t,0) = \frac{\partial(\mathbf{x},\boldsymbol\lambda)(t)}{\partial(\mathbf{x},\boldsymbol\lambda)(0)}.
$$

At the final time it is often called the **[[monodromy matrix|monodromy]]**. A guessing error $\delta\boldsymbol\lambda(0)$ becomes a final error of $\Phi(t_f,0)$ times $(\mathbf{0},\delta\boldsymbol\lambda(0))$.

Computed along the converged transfer, $\Phi(t_f,0)$ is a $6\times6$ matrix with determinant $1.000000$ and eigenvalues

$$
3.3766,\quad -2.1443,\quad 0.29615,\quad -0.46635,\quad -0.0672\pm0.9977i.
$$

Look at them in pairs: $3.3766\times0.29615 = 1.0000$, and $2.1443\times0.46635 = 1.0000$. The complex pair has size exactly $1$, so it is its own partner. The eigenvalues come in **reciprocal pairs**: every one that stretches (bigger than $1$) is matched by one that squeezes by the same factor. That is the signature of a **[[symplectic|symplectic]]** flow — the same Hamiltonian structure that gives $\dot{\mathbf{x}}=\partial H/\partial\boldsymbol\lambda$, $\dot{\boldsymbol\lambda}=-\partial H/\partial\mathbf{x}$ its name.

The pairing means you cannot escape the stretching. A random guessing error almost always has some part along a stretching direction, and that part grows.

::: note Why it has to be true: reciprocal pairs
Write the six-number vector as $\mathbf{w} = (\mathbf{x},\boldsymbol\lambda)$ and the equations as $\dot{\mathbf{w}} = \mathbf{J}\,\nabla H$ with $\mathbf{J} = \begin{pmatrix}\mathbf{0} & \mathbf{I}\\ -\mathbf{I} & \mathbf{0}\end{pmatrix}$. (Check: the top half says $\dot{\mathbf{x}}=\partial H/\partial\boldsymbol\lambda$, the bottom half $\dot{\boldsymbol\lambda}=-\partial H/\partial\mathbf{x}$.) Notice $\mathbf{J}^\top=-\mathbf{J}$ and $\mathbf{J}^2=-\mathbf{I}$.

A small error obeys $\delta\dot{\mathbf{w}} = \mathbf{J}\mathbf{S}\,\delta\mathbf{w}$, where $\mathbf{S}$ is the symmetric table of second derivatives of $H$. So $\dot\Phi = \mathbf{J}\mathbf{S}\Phi$. Now differentiate $\Phi^\top\mathbf{J}\Phi$:

$$
\frac{d}{dt}\big(\Phi^\top\mathbf{J}\Phi\big) = \Phi^\top\big(\mathbf{S}\mathbf{J}^\top\mathbf{J} + \mathbf{J}\mathbf{J}\mathbf{S}\big)\Phi = \Phi^\top\big(\mathbf{S} - \mathbf{S}\big)\Phi = \mathbf{0}.
$$

At $t=0$, $\Phi = \mathbf{I}$, so $\Phi^\top\mathbf{J}\Phi = \mathbf{J}$ forever. Rearranged, $\Phi^{-1} = \mathbf{J}^{-1}\Phi^\top\mathbf{J}$: the inverse is a disguised transpose. A transpose has the same eigenvalues, so $\Phi$ and $\Phi^{-1}$ share their eigenvalues. But the eigenvalues of $\Phi^{-1}$ are the reciprocals $1/\mu$ of those of $\Phi$. So for every eigenvalue $\mu$, its reciprocal $1/\mu$ is one too. Taking determinants of $\Phi^\top\mathbf{J}\Phi = \mathbf{J}$ also gives $(\det\Phi)^2=1$, and since $\det\Phi$ starts at $1$ and changes smoothly, it stays $1$.
:::

### How much does the miss grow?

The eigenvalues show the structure. The actual gain from a costate error to a final *state* error is the top-right $3\times3$ block of $\Phi(t_f,0)$, the part that maps $\delta\boldsymbol\lambda(0)$ to $\delta\mathbf{x}(t_f)$. Its largest **singular value** — the most any unit-sized input can be stretched — is $0.0150$. Its smallest is zero: that is the "double every costate, nothing changes" direction from before.

What happens as the flight gets longer? Here is the largest eigenvalue size of $\Phi$ at a quarter, half, three quarters and all of the transfer:

| Fraction of $t_f$ | $\tfrac14$ | $\tfrac12$ | $\tfrac34$ | $1$ |
| --- | --- | --- | --- | --- |
| Largest eigenvalue size | $1.31$ | $1.96$ | $1.67$ | $3.38$ |

The trend is up, but not smoothly: the dip at three quarters happens because the fastest-stretching direction rotates as the trajectory curves.

This transfer is mild: two orbits, a stretch of about $3.4$. The real danger is compounding. Stretch factors *multiply*. If each lap of a long spiral stretched errors by a factor of $2$ — an illustration, not a computed number — twenty laps would stretch them by $2^{20}$, about a million. For many-orbit spirals and multi-year interplanetary flights, the **[[basin of convergence|basin]]** around the answer is so small that no guess a human would write down lands inside it.

The cure follows directly: shoot over a shorter stretch, and an error has less time to grow before you correct it.

## Multiple shooting: anchor the middle

Picture a long bridge. Nobody builds it by launching one span from the near bank and hoping it reaches the far one. You put piers in the river and build short spans between them. Each span only has to reach the next pier.

**Multiple shooting** does the same with time. Cut $[t_0,t_f]$ into segments at interior times $t_0<\tau_1<\cdots<\tau_{k-1}<t_f$. Now guess the **full** state-and-costate vector at the start of every segment, not only the costate at $t_0$. Integrate each segment on its own, from its own guessed start. Then demand two kinds of residual vanish together:

- **continuity** — each segment's integrated end must match the next segment's guessed start (the spans must meet at the piers);
- the original **terminal conditions**, checked on the last segment's end.

No single integration has to survive the whole stretch, only its own short piece.

::: example Two segments on the same transfer
**Step 1: count.** Cut the transfer at its midpoint, $\tau = t_f/2$. The unknowns are the $3$ starting costates, the $6$ state-and-costate values guessed at the midpoint, and $t_f$: $10$ in all. The residuals are $6$ continuity equations, $3$ terminal state errors and $H(t_f)=0$: also $10$. A $10\times10$ system instead of $4\times4$.

**Step 2: seed it with the known answer.** Build the midpoint guess by integrating the converged single-shooting solution to $\tau$. The two-segment system is already satisfied to $6\times10^{-12}$, with $t_f = 12.370307$ nondimensional units, exactly as before. That confirms the formulation is right.

**Step 3: seed it naively.** Guess the midpoint by drawing a straight line between the end states ($r$ and $v_t$ halfway between their start and target values, $v_r = 0$), with small costates, $0.1$ everywhere — no better than the guesses that failed above. It does **not** converge either. It stalls after $6$ steps with the residual stuck at $1.03$.

**Step 4: compare the conditioning.** The **condition number** of a Jacobian measures how much it can magnify small errors when you solve with it; smaller is better. At the solution, single shooting's $4\times4$ Jacobian has condition number $10.4$. The two-segment $10\times10$ Jacobian has $1.1\times10^{5}$ — *worse*, not better. It stacks continuity blocks (exactly $-\mathbf{I}$, the slope of each guessed segment start) next to integration blocks of very different sizes.

**Sanity check.** For a transfer this short and this mild (a stretch of $3.4$, not a million), guessing six more numbers costs more than the shorter spans save.
:::

::: warning Multiple shooting is not a free upgrade
Its benefit grows with how bad single shooting's stretching already is. On a mildly sensitive problem it can lose, as the example showed. It earns its keep on long, strongly stretching problems — many-orbit spirals, multi-year trajectories with several flybys — where the alternative is not "single shooting, slightly worse" but "single shooting never converges from any guess a person would write". Let the stretch factor decide, and find it by computing $\Phi$, not by guessing.
:::

## Check yourself

::: check
Why must a shooting residual function return a large but *finite* value for guesses that make no physical sense — a negative $t_f$, an integration that blows up — instead of crashing?
:::

::: answer
A root finder explores by taking Newton-type steps, and early on those steps can land far outside any sensible region. If evaluating the residual there throws an error or hangs, the whole run dies. Returning a large, finite, clearly bad residual (this lesson's code returns $1000$ per component) lets the root finder treat a nonsense guess like any other bad step: something to back away from.
:::

::: check
The reciprocal pairing means $\Phi$ and $\Phi^{-1}$ have the same eigenvalue sizes. So would integrating the costate backward from $t_f$, instead of forward from $t_0$, escape the stretching?
:::

::: answer
No. Going backward means propagating with $\Phi(t_0,t_f) = \Phi(t_f,t_0)^{-1}$, and the pairing says its eigenvalues are the same set: $3.38$ and $0.296$ swap roles, but a stretch of $3.38$ is still there. Every direction that squeezed going forward stretches going backward. Methods that really escape the stretching change what they propagate. Multiple shooting cuts the horizon into short pieces. The backward Riccati sweep of the optimal control module does not propagate one guessed trajectory at all: it propagates a *relationship*, a matrix linking costate to state, which settles onto the right directions by itself. Direct methods, from lesson six on, avoid propagating over the whole horizon altogether.
:::

::: check
Of $25$ random costate guesses, $11$ converged, and all $11$ found the same solution — none converged to some other, unphysical answer. Is that reassuring?
:::

::: answer
Partly. It suggests that, in the region searched, this problem has one dominant solution of the necessary conditions, so a guess that converges finds it. It does not help with the real difficulty, guessing: $14$ of $25$ starts, and all three physically motivated ones, produced no answer at all. And it says nothing about other problems. One with a singular arc, several bang-bang switches, or a longer horizon can easily have several solutions of the necessary conditions, only one of which is the true minimum.
:::

::: check
Your costate guess for the transfer is off by some error $\delta\boldsymbol\lambda$. Using the linear gain computed in the lesson, how small must the error be to guarantee the final radius lands within $1\,\mathrm{km}$ of the target? Compare that with the size of the costates.
:::

::: answer
The worst-case gain from a costate error to a final state error is the largest singular value of the $\partial\mathbf{x}(t_f)/\partial\boldsymbol\lambda(0)$ block: $0.0150$ (nondimensional state per nondimensional costate). One kilometer in the length unit $r_0 = 7000\,\mathrm{km}$ is $1/7000 = 1.43\times10^{-4}$.

So the error must satisfy $0.0150\,\lvert\delta\boldsymbol\lambda\rvert \lesssim 1.43\times10^{-4}$, which gives $\lvert\delta\boldsymbol\lambda\rvert \lesssim 1.43\times10^{-4}/0.0150 \approx 9.5\times10^{-3}$.

The costate vector has size $\sqrt{76.72^2+17.78^2+92.46^2} \approx 121$. So the guess would need to be right to about $1$ part in $13\,000$ — four significant figures. That is why Newton's method, not a person, must close the last few digits, and why the practical bottleneck is the *basin* in which Newton converges at all, not the final accuracy once it has.

(Do not use the eigenvalue $3.38$ here. An eigenvalue describes one special direction; the most a single application can stretch *any* vector is the largest singular value.)
:::

::: check
The all-zero guess fails before Newton's method takes a single step, while $(0.1,0.1,0.1)$ at least runs. Explain both, and say which condition in the residual sets the overall size of the costates.
:::

::: answer
The steering law divides by $\sqrt{\lambda_{v_r}^2+\lambda_{v_t}^2}$, the size of the velocity costates. At all zeros, that size is zero, the thrust direction is undefined, and the very first integration cannot run, so there is no residual to improve. With $0.1$ everywhere the direction is defined (pointing partly inward and backward, a poor choice), so the integration runs; it merely misses badly.

Multiplying every costate by the same number changes nothing in the flight, so the state residuals cannot see the overall size. Only $H(t_f)=0$ can, because $H = 1 + \boldsymbol\lambda^\top\mathbf{f}$ contains the fixed $1$.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Two-point BVP | $\mathbf{x}(t_0)$ known, a condition on $\boldsymbol\lambda$ known at $t_f$; $\boldsymbol\lambda(t_0)$ unknown; state forward, costate backward |
| Single shooting | Guess $\mathbf{z}=(\boldsymbol\lambda(t_0), t_f)$, integrate forward, root-find $F(\mathbf{z})=\mathbf{0}$ on the terminal residuals |
| Transfer result | $\boldsymbol\lambda(0)=(-76.72,-17.78,-92.46)$, $t_f=11\,475.16\,\mathrm{s}$, propellant $65.01\,\mathrm{kg}$ ($5.42\,\%$), $H(t_f)\approx4\times10^{-12}$ |
| Drifting $H$ | Mass as a function of the clock makes $H$ drift; the full $H+\lambda_m\dot m$ stays $0$ |
| Guessing | Zero, forward-pointing and small guesses all fail; $11$ of $25$ random guesses converge, all to the same answer |
| Scale | Steering uses only the costate direction; $H(t_f)=0$ fixes the size |
| Sensitivity matrix | $\Phi(t_f,0)$: eigenvalues in reciprocal pairs, $\det\Phi=1$ (symplectic); largest size $3.38$ |
| Costate-to-state gain | Largest singular value of $\partial\mathbf{x}(t_f)/\partial\boldsymbol\lambda(0)$: $0.0150$ |
| Growth with horizon | Largest eigenvalue size at $\tfrac14,\tfrac12,\tfrac34,1$ of $t_f$: $1.31,\ 1.96,\ 1.67,\ 3.38$; stretch factors multiply over long flights |
| Multiple shooting | Guess the full state and costate at each segment start; solve continuity and terminal residuals together |
| This transfer | Two segments: naive guess stalls at $1.03$; condition number $1.1\times10^5$ versus $10.4$ for single shooting |
| When it wins | Long horizons and strong stretching, where single shooting has no usable basin |

Guessing costates is one difficulty of indirect methods. The next lesson takes on the other thing the minimum principle hands you: the switching structure of bang-bang control, the Mars descent solved in full by shooting, and the singular arcs where the principle stops naming the control at all.

::: context shooting-name Why it is called shooting
The name comes from artillery. A gunner cannot choose where the shell lands, only the barrel's angle. Fire, see whether it falls short or long, adjust the angle, fire again. Shooting methods do the same with numbers: the "angle" is the missing starting costate, the "landing spot" is the final state, and the adjustment is a Newton step.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="140" x2="345" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="30" cy="136" r="5" fill="#1f2a44"/>
  <path d="M30,136 Q110,40 190,140" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 3"/>
  <path d="M30,136 Q200,-20 345,140" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="5 3"/>
  <path d="M30,136 Q155,10 280,140" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <rect x="272" y="128" width="16" height="12" fill="#b4232c"/>
  <text x="190" y="156" font-size="11" text-anchor="middle" fill="#6c7a93">short</text>
  <text x="330" y="156" font-size="11" text-anchor="middle" fill="#6c7a93">long</text>
  <text x="280" y="120" font-size="12" text-anchor="middle" fill="#b4232c">target</text>
  <text x="120" y="60" font-size="12" fill="#1d6fd1">corrected</text>
</svg>
```
:::

::: context newton Newton's method in one picture
To find where a curve crosses zero, stand at your guess, draw the tangent line there, and slide down it to where the line crosses zero. That is the next guess. Near the root, each step roughly doubles the number of correct digits. Far away, the tangent can point somewhere silly, which is why real codes shorten the step whenever the miss does not shrink.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="120" x2="345" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40,150 C120,140 200,110 330,20" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="274.7" cy="56.6" r="4" fill="#1f2a44"/>
  <line x1="274.7" y1="56.6" x2="274.7" y2="120" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <line x1="325" y1="25" x2="157.8" y2="130" stroke="#b4232c" stroke-width="2"/>
  <circle cx="173.7" cy="120" r="4" fill="#b4232c"/>
  <text x="275" y="137" font-size="11" text-anchor="middle" fill="#1f2a44">guess</text>
  <text x="174" y="150" font-size="11" text-anchor="middle" fill="#b4232c">next guess</text>
  <text x="40" y="112" font-size="11" fill="#1f2a44">zero line</text>
  <text x="250" y="24" font-size="11" fill="#b4232c">tangent</text>
</svg>
```
:::

::: context primer Lawden's primer vector
In the 1950s and 1960s the British mathematician Derek Lawden studied the best way to point a rocket's thrust. He found that the best direction always lies along one special vector, built from the velocity costates, which he called the **primer vector** (it "primes" the thrust). With the sign convention used here, the primer vector is $-(\lambda_{v_r},\lambda_{v_t})$, and the thrust points along it. His book *Optimal Trajectories for Space Navigation* (1963) is still cited in orbit-transfer work.
:::

::: context canonical-units Why the computer works without meters
In meters and seconds, this problem mixes a radius of $7\,000\,000$ with an acceleration of $0.08$. Numbers that far apart in size make root finders and matrix solvers lose accuracy. Choosing the starting radius as the unit of length and $927.64\,\mathrm{s}$ as the unit of time puts every state near $1$ and makes gravity's strength exactly $1$. Astrodynamicists call these **canonical units**. Lesson fourteen of this module is all about this kind of scaling, and why skipping it is the most common reason a trajectory solver fails.
:::

::: context constrained-arc Why a path limit is so much work indirectly
On a stretch where a limit like "outward speed at most $V$" is pressing, the vehicle is riding along the limit, and the Hamiltonian gains a new term with its own multiplier. Where the flight joins or leaves that stretch, the costates may jump, and the size of the jump is one more unknown with one more condition. Each new limit means deriving all of this by hand, and guessing again which stretches are where. That is a large part of why industry designs trajectories with direct methods.
:::

::: context monodromy Where the name comes from
"Monodromy" is Greek for "running once around". Mathematicians first used it for what happens when you follow something once around a loop — for example, once around a periodic orbit — and see how small changes have grown on return. Trajectory people borrowed the word for the sensitivity matrix over one whole flight. Many books call $\Phi$ the **state transition matrix** instead; it is the same object you may have met in the state-space and orbit-determination modules.
:::

::: context symplectic Stretch one way, squeeze the other
A symplectic map can stretch a patch of starting points enormously in one direction, but it must squeeze the matching direction by exactly the same factor, so area is kept. That is why the eigenvalues come in pairs $\mu$ and $1/\mu$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="30" y="45" width="60" height="60" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="125" font-size="11" text-anchor="middle" fill="#1f2a44">area 1</text>
  <line x1="110" y1="75" x2="160" y2="75" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="168,75 158,70 158,80" fill="#1f2a44"/>
  <text x="138" y="65" font-size="11" text-anchor="middle" fill="#1f2a44">flow</text>
  <rect x="185" y="63" width="150" height="24" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="260" y="45" font-size="11" text-anchor="middle" fill="#1f2a44">stretched 2.5 times</text>
  <text x="260" y="112" font-size="11" text-anchor="middle" fill="#1f2a44">squeezed to 0.4 times</text>
  <text x="260" y="128" font-size="11" text-anchor="middle" fill="#1f2a44">area still 1</text>
</svg>
```

Drawn to scale: the $60\times60$ square becomes a $150\times24$ strip, because $2.5\times0.4 = 1$.
:::

::: context basin The basin of convergence
Think of the guesses as a landscape, and the answer as the bottom of a valley. The **basin** is every starting point from which Newton's method rolls down into that valley. A wide basin forgives a rough guess. A narrow one needs a guess that is already almost right. Stretching sensitivity squeezes the basin, so on long, sensitive flights the basin can shrink until no sensible guess falls inside it. Lesson fifteen shows the standard escape: solve an easy version first, and walk its answer step by step into the hard one.
:::
