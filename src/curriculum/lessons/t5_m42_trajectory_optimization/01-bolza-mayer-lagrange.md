---
id: l01-bolza-mayer-lagrange
title: The Bolza, Mayer and Lagrange cost forms
minutes: 22
covers:
  - The general optimal control problem in Bolza, Mayer and Lagrange form, and how to convert between them
---

Think about the cost of a road trip. Some of it piles up as you drive: every kilometer burns a little gas, every hour eats a little of your day. Some of it lands all at once at the very end: a toll booth at the exit, or a parking fee when you arrive. If a friend asks "what did the trip cost?", you add the two kinds together: the running total from the road, plus the one-time charge at the finish.

Every trajectory optimization problem is scored exactly like that road trip. You describe a rocket or spacecraft, you describe what it is allowed to do, and then you write down one number that says how good or bad a given flight was. That number is the **cost** — the score the computer tries to make as small as possible. This lesson is about the three standard shapes that score can take, called the **Bolza**, **Mayer** and **Lagrange** forms, and about how to turn any one of them into any other.

That sounds like bookkeeping, and partly it is. But every solver expects its cost in one particular shape, and the conversion trick in this lesson is used inside nearly all of them. The module works three real problems from start to finish: a Mars-style powered descent that must land at zero speed using as little propellant as possible, a low-thrust orbit transfer that must climb from one circular orbit to another in the least time, and later a powered ascent to orbit. All three are Bolza problems underneath.

## The general problem

Start with what moves. The vehicle's **state** is the list of numbers that tells you where it is and how it is moving right now — altitude, velocity, mass, and so on. We write it as a column of numbers $\mathbf{x}(t)$, read "bold x of t". If there are $n$ numbers in the list, we say $\mathbf{x}(t) \in \mathbb{R}^n$, read "x is in R n": a point in $n$-dimensional space.

The **control** is the list of knobs you are allowed to turn — throttle setting, steering angle, gimbal angle. We write it $\mathbf{u}(t) \in \mathbb{R}^m$, with $m$ knobs. The physics connects the two. The **dynamics** say how fast the state changes, given the state and the control:

$$
\dot{\mathbf{x}} = \mathbf{f}(\mathbf{x}, \mathbf{u}, t), \qquad \mathbf{x}(t_0) = \mathbf{x}_0 \text{ given}.
$$

Read $\dot{\mathbf{x}}$ as "x dot": the rate of change of the state, $d\mathbf{x}/dt$. The flight runs from a start time $t_0$ ("t naught") to a final time $t_f$ ("t f"). Sometimes $t_f$ is fixed in advance. Sometimes it is free, and choosing it is part of the problem — as in "get there as fast as you can".

Now the score. The **Bolza cost** has one term for each half of the road-trip bill:

$$
J = \phi\big(\mathbf{x}(t_f), t_f\big) + \int_{t_0}^{t_f} L\big(\mathbf{x}(t), \mathbf{u}(t), t\big)\, dt.
$$

- $\phi$ (the Greek letter "phi", said "fee" or "fie") is the **terminal cost**: the toll booth. It looks only at the state and the time at the one instant $t_f$, and it is counted once.
- $L$ is the **running cost**, also called the **Lagrangian**: the gas gauge. It looks at the state, the control and the time at every instant, and the integral sign $\int$ adds it up over the whole flight.
- $J$ is the total score. Because $J$ depends on the entire history $\mathbf{u}(t)$, not on a single number, mathematicians call it a **[[cost functional|functional]]** rather than a cost function.

Nothing here has to be simple. $\mathbf{f}$, $\phi$ and $L$ can be curved, lumpy, nonlinear — whatever the physics and the mission demand.

Two special cases come up so often that they have their own names, after the **[[mathematicians who studied them|three-names]]**:

- A **Mayer problem** has no running cost, $L \equiv 0$ (the triple bar, read "is identically", means "is zero at every instant"). Only the toll booth counts: $J = \phi(\mathbf{x}(t_f), t_f)$. Minimum time is Mayer with $\phi = t_f$. Maximum final mass is Mayer with $\phi = -m(t_f)$; the minus sign turns "make it big" into "make it small".
- A **Lagrange problem** has no terminal cost, $\phi \equiv 0$. Only the gas gauge counts: $J = \int_{t_0}^{t_f} L\, dt$. Minimum control effort, $L = \mathbf{u}^\top\mathbf{R}\mathbf{u}$ (a weighted sum of squares of the knobs, with $\mathbf{R}$ a matrix of weights), is Lagrange. So is minimum propellant written as $L = T/c$, where $T$ is the thrust in newtons and $c$ is the engine's **[[effective exhaust velocity|exhaust-velocity]]** in meters per second: $T/c$ is the propellant burned per second, in kg/s.

::: key The Bolza cost functional
$J = \phi(\mathbf{x}(t_f), t_f) + \int_{t_0}^{t_f} L(\mathbf{x}, \mathbf{u}, t)\, dt$. Mayer: $L \equiv 0$, terminal term only. Lagrange: $\phi \equiv 0$, integral only. Bolza is the general case; the other two are the special cases you get by zeroing one term. Bolza or Lagrange converts to Mayer by adding a state whose derivative is $L$; Mayer converts to Lagrange with $L = (\partial\phi/\partial\mathbf{x})^\top\mathbf{f} + \partial\phi/\partial t$.
:::

Here is the idea to hold onto. Bolza, Mayer and Lagrange do not change *which* flight is best. They are three ways of writing down the same number $J$ for the same flight, like writing a price as "\$12" or "twelve dollars". The reason to care is practical: which form is easiest to derive the optimality conditions from, and which form a computer handles most cleanly.

## Turning a running cost into a state

The conversion that matters most runs in one direction: any running cost can be folded into one extra state. That turns a Bolza or Lagrange problem into a pure Mayer problem.

The everyday picture is a car's **trip meter**. You do not add up your gas use in your head second by second. The car keeps one extra number on the dashboard, and that number climbs at exactly the rate you burn gas. At the end of the trip you read it once. The running total has become a reading at the finish.

Do the same thing with the running cost. Invent a new state, $x_{n+1}$ ("x sub n plus one"), whose only job is to be the trip meter:

$$
\dot{x}_{n+1} = L(\mathbf{x}, \mathbf{u}, t), \qquad x_{n+1}(t_0) = 0.
$$

It starts at zero, and its rate of climb at every instant is the running cost at that instant. By the **[[fundamental theorem of calculus|ftc]]**, which says that adding up a rate of change over time gives the total change,

$$
x_{n+1}(t_f) = x_{n+1}(t_0) + \int_{t_0}^{t_f} L\, dt = \int_{t_0}^{t_f} L\, dt.
$$

So the whole integral is now sitting in one number at the final time. Substitute it into the Bolza cost:

$$
J = \phi\big(\mathbf{x}(t_f), t_f\big) + x_{n+1}(t_f) = \tilde\phi\big(\tilde{\mathbf{x}}(t_f), t_f\big), \qquad \tilde{\mathbf{x}} = \begin{pmatrix}\mathbf{x} \\ x_{n+1}\end{pmatrix}.
$$

The squiggle on top, $\tilde{\mathbf{x}}$, is read "x tilde". It is the **augmented state** — the old state with the trip meter stacked underneath, $n+1$ numbers long. The new terminal cost $\tilde\phi$ ("phi tilde") is the old $\phi$ plus the last entry of $\tilde{\mathbf{x}}$. There is no integral left anywhere: this is a pure Mayer cost.

Nothing about the flight changed. The augmented dynamics are $\tilde{\mathbf{f}} = (\mathbf{f}, L)$ — the old ones plus one line, equally smooth. The trip meter might read propellant spent so far, or time elapsed so far; it rides along beside altitude and velocity.

### Why solvers insist on it

This is not a curiosity. Later lessons turn the dynamics into **[[defect constraints|defects-bridge]]**: equations that say "the state at the next time point must equal the state now plus the dynamics added up over the step". A solver built that way already has careful machinery for adding up the right-hand side of a state equation.

Now suppose you handed it the running cost separately. It would need a second adding-up rule for the cost — maybe a different rule, maybe on a different set of time points — and the two could quietly disagree. Hand it the running cost as an extra state instead, and the cost is added up by the very same defect equations, to the very same accuracy, on the very same time points, as everything else. That is less code, not more. So nearly every direct-transcription tool either does this augmentation for you or expects you to have done it. Mayer form, not the Bolza form the problem started in, is what actually reaches the solver.

::: warning The trip meter must start at zero
$x_{n+1}(t_0) = 0$ is a real boundary condition, not a default the solver assumes. Set up a shooting code or a direct transcription without pinning it, and the augmented state is free to start anywhere. Then $x_{n+1}(t_f)$ is no longer "the integral from zero", so it is no longer the cost. The symptom is a solver that reports success with a cost that looks wrong by a constant offset. Before you trust any answer, check that every augmented state's starting value was actually imposed, and not left as a free number the optimizer set to whatever was convenient.
:::

::: example Closing the propellant books on a landing burn
The descent problem, solved in full by indirect shooting a few lessons from now, is a lander of mass $m_0 = 1000\,\mathrm{kg}$ over [[Mars|mars-descent]]. Its engine has specific impulse $I_{sp} = 225\,\mathrm{s}$, so the effective exhaust velocity is

$$
c = I_{sp}\,g_0 = 225 \times 9.80665 = 2206.50\,\mathrm{m/s}.
$$

The best flight turns out to coast for a moment and then burn at full thrust, $T_{\max} = 6000\,\mathrm{N}$, for the rest of the way down. That burn lasts $\Delta t = 31.9051\,\mathrm{s}$. During the coast the engine is off, so it adds nothing to the cost.

**Lagrange form.** Minimum propellant is $J_L = \int (T/c)\, dt$. The thrust is constant during the burn, so the integral is a rate times a duration. First the rate:

$$
\frac{T_{\max}}{c} = \frac{6000}{2206.50} = 2.7192\,\mathrm{kg/s}.
$$

Then multiply by the burn time:

$$
J_L = 2.7192 \times 31.9051 = 86.7579\,\mathrm{kg}.
$$

**Mayer form.** Now let the mass itself be the trip meter. The rocket equation, $\dot m = -T/c$, is already a state equation. Integrate it over the same burn: the mass drops at $2.7192\,\mathrm{kg/s}$ for $31.9051\,\mathrm{s}$, so

$$
m(\Delta t) = m_0 - 86.7579 = 1000 - 86.7579 = 913.2421\,\mathrm{kg},
$$

and the propellant used is the mass at the start minus the mass at the end:

$$
J_M = m(0) - m(\Delta t) = 1000 - 913.2421 = 86.7579\,\mathrm{kg}.
$$

**Sanity check.** $J_L = J_M$ to every digit. That is not luck. The trip-meter state obeys $\dot x_{n+1} = T/c$, and the mass obeys $\dot m = -T/c$ — the same equation with the sign flipped. So $x_{n+1}(t) = m(0) - m(t)$ at every instant, exactly. About $87\,\mathrm{kg}$ out of a metric ton, under $9\,\%$, is a believable propellant bill for a short final landing burn.
:::

Here is the same bookkeeping as a few lines of Python. The mass and the trip meter are integrated side by side, as a solver would carry them:

```python
import numpy as np

c = 225 * 9.80665            # effective exhaust velocity, m/s
T = 6000.0                   # thrust during the burn, N
t_burn = 31.90515            # burn duration, s

def f(y):
    m, spent = y             # mass, and the extra "cost so far" state
    return np.array([-T / c, T / c])   # m-dot, and spent-dot = L

y = np.array([1000.0, 0.0])  # start full, with nothing spent yet
n = 1000
dt = t_burn / n
for _ in range(n):           # simple Euler steps, exact here: f is constant
    y = y + dt * f(y)

print(f"mass at end   {y[0]:.4f} kg")
print(f"cost state    {y[1]:.4f} kg")
print(f"m0 - m(end)   {1000.0 - y[0]:.4f} kg")
# mass at end   913.2421 kg
# cost state    86.7579 kg
# m0 - m(end)   86.7579 kg
```

## Turning a terminal cost into a running cost

The conversion runs the other way too, though you will use it far less. The picture is a hiking app. You could score a hike by your final height above the trailhead — a terminal cost. Or you could add up, step by step, how much height each step gained — a running cost. The two give the same number, because the final height is the sum of all the little gains.

In symbols, if $\phi$ changes smoothly along the flight, the fundamental theorem of calculus runs in reverse. The end value is the start value plus the sum of all the changes:

$$
\phi\big(\mathbf{x}(t_f), t_f\big) = \phi\big(\mathbf{x}_0, t_0\big) + \int_{t_0}^{t_f} \frac{d}{dt}\phi\big(\mathbf{x}(t), t\big)\, dt.
$$

The rate of change of $\phi$ along the flight comes from the **chain rule**: $\phi$ changes because the state moves, and because the clock moves. The state moves at rate $\mathbf{f}$, so

$$
\frac{d\phi}{dt} = \frac{\partial\phi}{\partial\mathbf{x}}^{\!\top} \mathbf{f}(\mathbf{x},\mathbf{u},t) + \frac{\partial\phi}{\partial t}.
$$

The curly $\partial$ is read "partial": $\partial\phi/\partial\mathbf{x}$ is the list of slopes of $\phi$ with respect to each state, and the $\top$ ("transpose") lets us dot that list with $\mathbf{f}$.

Now look at the first term, $\phi(\mathbf{x}_0, t_0)$. The start state and start time are given data, so this term is the same for every possible flight. A constant added to every score cannot change which flight wins, so drop it. What is left is a pure Lagrange cost with

$$
L = \frac{\partial\phi}{\partial\mathbf{x}}^{\!\top}\mathbf{f} + \frac{\partial\phi}{\partial t}.
$$

Engineers rarely do this by hand: it swaps one clean number at the end for more bookkeeping, not less. But it proves the point. Bolza, Mayer and Lagrange are three spellings of the same quantity, and a problem is never stuck in one form.

::: example Minimum time is Mayer and Lagrange at once
A later lesson solves a low-thrust transfer from a circular orbit of radius $r_0 = 7000\,\mathrm{km}$ to one of radius $r_1 = 9000\,\mathrm{km}$, in minimum time. The answer is $t_f = 11\,475.16\,\mathrm{s}$. Divide by $3600$ seconds per hour: that is $3.1875\,\mathrm{hr}$.

**As Mayer:** $\phi = t_f$, so $J = t_f = 11\,475.16\,\mathrm{s}$ directly. No integral at all.

**As Lagrange:** $L = 1$, so $J = \int_0^{t_f} 1\, dt = t_f$. The area under a flat line of height $1$ and width $t_f$ is $t_f$: the [[same number again|area-is-time]]. Here the trip meter is the clock itself: $\dot x_{n+1} = 1$ and $x_{n+1}(0) = 0$, so $x_{n+1}(t) = t$ at every instant. This is the simplest possible running cost, and a handy check on your augmentation code before you try it on one that is not trivial.

**What the cost does not see.** The same transfer burns propellant while it steers. Thrust is $T_{\max} = 100\,\mathrm{N}$ and $c = 1800 \times 9.80665 = 17\,651.97\,\mathrm{m/s}$. The mass drops at $100 / 17\,651.97 = 0.005665\,\mathrm{kg/s}$, and over $11\,475.16\,\mathrm{s}$ that is $65.008\,\mathrm{kg}$. Out of a $1200\,\mathrm{kg}$ spacecraft, $65.008/1200 = 5.42\,\%$. A few percent of the vehicle for a modest orbit raise with an efficient engine is reasonable. Notice that this number is not part of the minimum-time cost at all. It falls out because mass is carried as a state alongside $r$, $v_r$ and $v_t$, no matter what $J$ penalizes. That is exactly why you carry mass as a state rather than as an afterthought.
:::

::: note Why any split of the cost gives the same answer
Take any flight $\mathbf{u}(t)$ and its state history $\mathbf{x}(t)$. The Bolza cost is $\phi$ at the end plus the integral of $L$. The augmented Mayer cost is $\phi$ at the end plus $x_{n+1}(t_f)$. Because $\dot x_{n+1} = L$ and $x_{n+1}(t_0) = 0$, the fundamental theorem of calculus makes $x_{n+1}(t_f)$ equal to the integral of $L$ for *that same flight*. So the two costs agree flight by flight, not merely at the optimum. Two scoring rules that give every flight the same score must pick the same winner. The reverse conversion differs only by the constant $\phi(\mathbf{x}_0, t_0)$, which is added to every flight's score equally, so it cannot change the winner either.
:::

## Why keep Bolza around at all

If every running cost can be pushed into a state, why does this module keep writing $J = \phi + \int L\,dt$ instead of always using pure Mayer form? Two reasons, and both are about people rather than mathematics.

**It reads like a sentence.** A powered-descent cost with $\phi = -m(t_f)$ and $L = w\,\|\mathbf{u}\|^2$ (with $w$ a small weight and $\|\mathbf{u}\|$ the size of the control) tells a reader at a glance: "keep as much mass as possible, but also prefer smooth commands". After full Mayer augmentation the same problem is one scalar $\tilde\phi$ on an $(n+2)$-number terminal state, with the trade-off buried inside. Keeping $\phi$ and $L$ apart is documentation.

**The two terms show up in different places in the optimality conditions.** That is the subject of the next two lessons. A term in $\phi$ enters only through the conditions at the final time, checked once at $t_f$. A term in $L$ enters the Hamiltonian at every instant and shapes the flight all the way through. Seeing which one you have is often the fastest way to guess what the answer looks like before you derive it. A running cost that is linear in $\mathbf{u}$ hints at **[[bang-bang|bang-bang-peek]]** control — the knob slammed to one limit, then the other — worked out properly a few lessons ahead. A terminal cost never does, because it never touches $\mathbf{u}$ at all.

## Check yourself

::: check
A problem charges for control effort throughout the flight and for a position error at the end: $L = \mathbf{u}^\top\mathbf{u}$ and $\phi = \mathbf{e}(t_f)^\top\mathbf{Q}_f\,\mathbf{e}(t_f)$, with $\mathbf{e} = \mathbf{x} - \mathbf{x}_{\text{target}}$. Write the fully augmented Mayer form, naming the new state and its dynamics.
:::

::: answer
Add a trip-meter state $x_{n+1}$ with $\dot x_{n+1} = \mathbf{u}^\top\mathbf{u}$ and $x_{n+1}(t_0) = 0$. The augmented state is $\tilde{\mathbf{x}} = (\mathbf{x}, x_{n+1})$, and the cost becomes pure Mayer:

$$
J = \tilde\phi(\tilde{\mathbf{x}}(t_f)) = \big(\mathbf{x}(t_f) - \mathbf{x}_{\text{target}}\big)^\top\mathbf{Q}_f\big(\mathbf{x}(t_f) - \mathbf{x}_{\text{target}}\big) + x_{n+1}(t_f),
$$

a function of the final augmented state alone. The original $\phi$ did not need to change at all, since it already depended only on $\mathbf{x}(t_f)$. Only the running term needed a state to carry it.
:::

::: check
Why do direct-transcription codes almost always want the problem in Mayer form inside, even when you hand them a Bolza problem?
:::

::: answer
A transcription already enforces the dynamics through defect constraints, each built from one specific adding-up rule on one specific set of time points. If the running cost were added up separately — with a different rule, or on different points — the discrete cost and the discrete dynamics would no longer use the same arithmetic. That creates a mismatch that has nothing to do with the real problem and everything to do with bookkeeping. Making the running cost a state means the same defect constraints that integrate altitude and velocity also integrate the cost, to the same accuracy. It is less code, not more, which is why it is standard practice rather than a purist's preference.
:::

::: check
The descent example gave $J_L = J_M = 86.7579\,\mathrm{kg}$ for the burn. Is it a coincidence that a Lagrange integral and a Mayer mass difference came out identical?
:::

::: answer
No. They are one computation written two ways, not two independent calculations that happened to agree. The trip meter obeys $\dot x_{n+1} = T/c$ with $x_{n+1}(0) = 0$, so $x_{n+1}(t_f) = \int_0^{t_f}(T/c)\,dt$, which is $J_L$ by definition. The mass obeys $\dot m = -T/c$, the same equation with the sign flipped, so $x_{n+1}(t) = m(0) - m(t)$ at every instant. Therefore $J_M = m(0) - m(t_f) = x_{n+1}(t_f) = J_L$ exactly. Nothing independently computed had to cancel.
:::

::: check
A Mayer problem has $\phi(\mathbf{x}(t_f), t_f) = -m(t_f)$ and no running cost at all. A colleague argues that with "no Lagrangian", the Euler-Lagrange machinery of the next lesson does not apply. Are they right?
:::

::: answer
No. $L \equiv 0$ is a perfectly good running cost; it happens to be zero. The next lesson builds the Hamiltonian $H = L + \boldsymbol\lambda^\top\mathbf{f}$, which here becomes $H = \boldsymbol\lambda^\top\mathbf{f}$, and every condition derived for the general Bolza problem still holds with $L = 0$ put in. Nothing in that derivation needs $L$ to be nonzero. A Mayer problem is not an exception to the theory; it is the theory with one term set to zero, in the same way a Lagrange problem is the theory with $\phi$ set to zero. That is why the general Bolza statement is worth carrying: derive the conditions once, and every special case comes free.
:::

::: check
Minimum-time transfer was written as Mayer ($\phi = t_f$) and as Lagrange ($L = 1$), both giving $J = t_f$. Write the same minimum-time problem in Bolza form with both terms nonzero, and explain why that would be a strange thing to do.
:::

::: answer
Split the cost with any number $\alpha$ between $0$ and $1$: $\phi = \alpha t_f$ and $L = 1 - \alpha$. Then

$$
J = \alpha t_f + (1-\alpha)\int_0^{t_f}dt = \alpha t_f + (1-\alpha)t_f = t_f,
$$

still correct for every choice of $\alpha$. It is strange because it adds a knob that changes nothing about the best flight or its cost — the split is invisible in the answer — while cosmetically changing the running-cost term in the Hamiltonian, and so the bookkeeping used to derive the solution. There is no engineering reason to introduce a distinction with no effect. Minimum time is written as pure Mayer or pure Lagrange because splitting it buys nothing.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Bolza cost | $J = \phi(\mathbf{x}(t_f),t_f) + \int_{t_0}^{t_f}L(\mathbf{x},\mathbf{u},t)\,dt$: toll at the end plus running total |
| Mayer | $L \equiv 0$; terminal cost only |
| Lagrange | $\phi \equiv 0$; running cost only |
| Bolza or Lagrange to Mayer | Add a trip-meter state $\dot x_{n+1}=L$, $x_{n+1}(t_0)=0$; then $J = \phi + x_{n+1}(t_f)$ |
| Mayer to Lagrange | $L = (\partial\phi/\partial\mathbf{x})^\top\mathbf{f} + \partial\phi/\partial t$, dropping the constant $\phi(\mathbf{x}_0,t_0)$ |
| Why augment | The solver's defect constraints integrate the cost state to the same accuracy, on the same time points, as the dynamics |
| Descent check | $J_L = (T_{\max}/c)\,\Delta t = 86.7579\,\mathrm{kg}$ and $J_M = m_0-m(\Delta t) = 86.7579\,\mathrm{kg}$: identical by construction |
| Minimum time | Mayer with $\phi=t_f$, or Lagrange with $L=1$; both give $J=t_f$ |
| Why keep Bolza | It reads clearly, and $\phi$ and $L$ enter the optimality conditions in different places |

The next lesson takes the general Bolza problem and derives, step by step, the Hamiltonian, the costate equation and the conditions at the final time — the Euler-Lagrange machinery this lesson has been setting up.

::: context functional A function of a whole flight
An ordinary function takes a number in and gives a number out: $f(3) = 9$. A **functional** takes a whole curve in — an entire throttle history from launch to landing — and gives one number out. That is why "which flight is best?" is harder than "which number is best?": you are choosing a curve, which is like choosing infinitely many numbers at once. The branch of mathematics that does this is called the **calculus of variations**, and it is what the next lesson uses.
:::

::: context three-names Who Bolza, Mayer and Lagrange were
Joseph-Louis Lagrange (1736–1813) developed much of the calculus of variations, the maths of finding the best curve. Adolph Mayer (1839–1908) was a German mathematician who studied the problem of optimizing a quantity at the end point. Oskar Bolza (1857–1942), a German mathematician who spent years teaching at the University of Chicago, studied the combined problem with both terms, which now carries his name. Their names stuck to the three cost shapes long before anyone flew a rocket with them.
:::

::: context exhaust-velocity Why T over c is propellant per second
An engine pushes by throwing mass out of the back. If it throws $\dot m$ kilograms per second at speed $c$ meters per second, the push is $T = \dot m\, c$. Flip that around: $\dot m = T/c$. A higher $c$ means less propellant for the same push, which is why engineers prize it. Engineers often quote specific impulse $I_{sp}$ in seconds instead; multiply by $g_0 = 9.80665\,\mathrm{m/s^2}$ to get $c$. A throttleable lander engine near $I_{sp} = 225\,\mathrm{s}$ has $c \approx 2207\,\mathrm{m/s}$.
:::

::: context ftc Adding up a rate gives the total change
If you know how fast something is changing at every moment, adding up all those little changes gives how much it changed overall. Drive at $20\,\mathrm{m/s}$ for $10\,\mathrm{s}$ and you moved $200\,\mathrm{m}$: the area under the speed-versus-time line. The trip meter is exactly that: its rate is $L$, so its reading at the end is the area under the $L$ curve.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="80" x2="330" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="15" x2="40" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40,80 L40,55 C90,30 140,30 190,45 C240,60 280,50 320,40 L320,80 Z" fill="#8fb8f0" stroke="none"/>
  <path d="M40,55 C90,30 140,30 190,45 C240,60 280,50 320,40" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="48" y="24" font-size="12" fill="#1f2a44">running cost L(t)</text>
  <text x="180" y="72" font-size="12" text-anchor="middle" fill="#1f2a44">shaded area = total</text>
  <line x1="40" y1="185" x2="330" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="110" x2="40" y2="185" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40,185 C100,165 150,145 190,140 C240,133 280,125 320,118" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="320" cy="118" r="4" fill="#b4232c"/>
  <text x="48" y="124" font-size="12" fill="#1f2a44">trip meter x(n+1)</text>
  <text x="316" y="108" font-size="11" text-anchor="end" fill="#b4232c">reading at t_f</text>
  <text x="330" y="198" font-size="11" text-anchor="end" fill="#6c7a93">time</text>
</svg>
```

The meter climbs fastest where $L$ is tallest, and its final height equals the blue area.
:::

::: context defects-bridge Where defect constraints come back
From lesson six on, the computer does not integrate the dynamics by marching forward. Instead it guesses the state at a list of time points and adds one equation per step saying "the jump in state across this step equals the dynamics added up over it". Each such equation is a **defect constraint**, and the solver drives them all to zero at once. Because the cost is a state, it gets its own defect equations too, and is added up with the same accuracy as everything else.
:::

::: context mars-descent Landing on Mars
Mars has thin air, too thin for parachutes to slow a lander all the way down, so the last stretch is flown on rocket thrust: the powered descent. Surface gravity on Mars is about $3.71\,\mathrm{m/s^2}$, a bit over a third of Earth's, and that is the value this module's descent problem uses. Every kilogram of propellant saved in the landing burn is a kilogram that could have been science instruments instead, which is why "land softly on the least propellant" is a real design question.
:::

::: context area-is-time Area under a flat line
Plot $L = 1$ against time. It is a flat line one unit high. The area under it, from $0$ to $t_f$, is a rectangle of height $1$ and width $t_f$, so the area is $t_f$. That is why a running cost of $1$ measures elapsed time.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="330" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="40" y="50" width="240" height="50" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="32" y="54" font-size="12" text-anchor="end" fill="#1f2a44">1</text>
  <text x="32" y="104" font-size="12" text-anchor="end" fill="#1f2a44">0</text>
  <text x="40" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="280" y="118" font-size="12" text-anchor="middle" fill="#1f2a44">t_f</text>
  <text x="160" y="80" font-size="12" text-anchor="middle" fill="#1f2a44">area = 1 × t_f = t_f</text>
  <text x="48" y="40" font-size="12" fill="#1d6fd1">L = 1</text>
</svg>
```
:::

::: context bang-bang-peek A preview of bang-bang
When the cost grows in a straight line with the knob, there is no sweet spot in the middle: if a little more thrust helps, all of it helps more. So the best control sits at a limit — full on or full off — and jumps between them. That is **bang-bang** control. The descent's best thrust history, drawn to scale, is one: off for $1.85\,\mathrm{s}$, then full thrust until touchdown at $33.76\,\mathrm{s}$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="335" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="20" x2="40" y2="100" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="40" x2="318" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <path d="M40,100 L55.2,100 L55.2,40 L318,40 L318,100" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="34" y="44" font-size="11" text-anchor="end" fill="#1f2a44">6000 N</text>
  <text x="34" y="104" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="55" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">1.85 s</text>
  <text x="318" y="116" font-size="11" text-anchor="middle" fill="#1f2a44">33.76 s</text>
  <text x="186" y="32" font-size="12" text-anchor="middle" fill="#1f2a44">full thrust</text>
  <text x="186" y="132" font-size="11" text-anchor="middle" fill="#6c7a93">time since the start of the descent</text>
</svg>
```

Lesson five explains exactly when this happens and how to find the switch times.
:::
