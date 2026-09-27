---
id: l14-scaling-and-conditioning
title: "Scaling and conditioning: non-dimensionalise before you solve anything"
minutes: 22
covers:
  - "Scaling and conditioning: non-dimensionalising states, controls and constraints before you solve anything"
---

Imagine you are lost in hilly country at night, and all you can feel is which way the ground slopes under your feet. To find the lowest point, you take a step downhill, feel the slope again, and repeat. In a round bowl-shaped valley this works beautifully: every step points straight at the bottom.

Now imagine someone redraws the map with east–west distances in millimeters and north–south distances in kilometers. The ground has not changed. But on this map, the round bowl has become a **[[long, narrow canyon|narrow-valley]]**. "Downhill" now points almost straight at the canyon wall instead of along the canyon floor. You step, hit the far wall, step back, hit the near wall, and zigzag for hours while barely moving toward the bottom.

A trajectory solver lives on that map. It sees only numbers, never units. If you hand it a radius in meters (about $10^7$) next to a steering angle in radians (about $1$), it walks the canyon. This lesson is about redrawing the map before the solver starts. The fix has a name, **non-dimensionalizing** — choosing your own units so every number the solver sees is near $1$. Every orbit-transfer example in this module quietly did this: the radius sat near $1.0$, the speeds near $0.9$ to $1.0$, the flight time near $12$. Here you will see why that was never cosmetic, and what happens on the identical problem the moment it is dropped.

## Why the units a solver sees matter

A solver like IPOPT, or an SQP (sequential quadratic programming) code, has a handful of habits. All of them quietly assume that every unknown, and every constraint, is about the same size:

- **One step length for everything.** A line search (lesson 4) picks one number $\alpha$ ("alpha") and moves every unknown by $\alpha$ times its piece of the search direction. That single $\alpha$ must suit every unknown at once.
- **One tolerance for everything.** "Converged" means every constraint residual is below, say, $10^{-8}$. A residual of $10^{-8}$ is superb for a radius measured in meters and useless for one measured in units of $7000\,\mathrm{km}$.
- **One curvature model for everything.** The quasi-Newton updates that build up the Hessian learn curvature from the steps taken. Steps that are lopsided teach it lopsided curvature.

Mix a radius in meters with an angle in radians and these habits break. A step small enough not to overshoot the angle does nothing visible to the radius. A step big enough to move the radius sends the angle spinning. There is no step that suits both.

The trouble also lands in the matrix at the heart of every iteration. Lesson 13 showed that each step solves a linear system built from the constraint Jacobian — the table of slopes $\partial c_i/\partial z_j$. If one column holds slopes with respect to meters and another holds slopes with respect to radians, its entries span many powers of ten. A matrix like that is **ill-conditioned**: it magnifies small errors hugely in some directions and barely at all in others.

We say a quantity is **[[order unity|order-unity]]** (or "order one") when it sits somewhere around $1$ — say between $0.1$ and $10$ — rather than near a million or a millionth. The goal of scaling is to make every number the solver touches order unity.

## Conditioning: how much a matrix magnifies errors

Here is the precise idea. A matrix $\mathbf{A}$ takes an input vector and stretches it, by different amounts in different directions. Its **singular values** measure those stretches: $\sigma_{\max}$ ("sigma max") is the most it stretches any direction, and $\sigma_{\min}$ the least. The **[[condition number|turing-condition]]** is their ratio:

$$
\kappa(\mathbf{A}) = \frac{\sigma_{\max}}{\sigma_{\min}}.
$$

Read $\kappa$ as "kappa". It is always at least $1$. A value of $1$ means the matrix **[[stretches every direction equally|singular-values]]**, like a perfect magnifying glass. A value of $10^6$ means some direction is stretched a million times more than another.

Why that matters: when you solve $\mathbf{A}\mathbf{x} = \mathbf{b}$, a small relative error in $\mathbf{b}$ can grow into a relative error up to $\kappa$ times bigger in $\mathbf{x}$. Computers store numbers to about **[[16 significant digits|double-precision]]**. As a rule of thumb, solving with a matrix of condition number $10^k$ can cost you about $k$ of those digits. At $\kappa \approx 10^5$ you keep about 11. At $\kappa \approx 10^9$ you keep about 7 — and the finite-difference errors in how the Jacobian was built are usually far bigger than rounding, so the real loss is worse.

::: example A lopsided matrix, and the one-line fix
Take two equations in two unknowns, where the second equation happens to be written in tiny units:

$$
\mathbf{A} = \begin{bmatrix} 1 & 0 \\ 0 & 10^{-6} \end{bmatrix}, \qquad \mathbf{b} = \begin{bmatrix} 1 \\ 10^{-6} \end{bmatrix}, \qquad \mathbf{x} = \begin{bmatrix} 1 \\ 1 \end{bmatrix}.
$$

**Step 1: the condition number.** For a diagonal matrix the stretches are the diagonal entries. So $\sigma_{\max} = 1$, $\sigma_{\min} = 10^{-6}$, and $\kappa = 1/10^{-6} = 10^6$.

**Step 2: a tiny error.** Suppose rounding changes $b_2$ by $10^{-9}$ — a change of about one part in a billion of $\mathbf{b}$'s size. The second equation reads $10^{-6}\,x_2 = 10^{-6} + 10^{-9}$. Divide both sides by $10^{-6}$: $x_2 = 1 + 10^{-3} = 1.001$.

**Step 3: how much it grew.** The answer moved by $10^{-3}$, out of a vector of length $\sqrt{2} \approx 1.414$. That is a relative error of $10^{-3}/1.414 = 7.07\times10^{-4}$. The input's relative error was $10^{-9}$. So the error grew by about $7.07\times10^{5}$ — less than $\kappa = 10^6$, as the bound promises, and in the same ballpark.

**Step 4: the fix.** Multiply the second equation by $10^6$. That changes nothing about the answer — it is the same equation in sensible units. Now $\mathbf{A}$ is the identity matrix, with $\kappa = 1$, and a one-in-a-billion error in $\mathbf{b}$ stays a one-in-a-billion error in $\mathbf{x}$.

**Sanity check.** Rescaling a row cannot change the solution, only how carefully it can be computed. $\mathbf{x} = (1, 1)$ both times. Good.
:::

::: note Why the error can grow by at most kappa
Start from $\mathbf{A}\mathbf{x} = \mathbf{b}$ and a perturbed version $\mathbf{A}(\mathbf{x} + \delta\mathbf{x}) = \mathbf{b} + \delta\mathbf{b}$. Subtract the first from the second: $\mathbf{A}\,\delta\mathbf{x} = \delta\mathbf{b}$, so $\delta\mathbf{x} = \mathbf{A}^{-1}\delta\mathbf{b}$.

The inverse stretches by at most $1/\sigma_{\min}$, so $\lVert\delta\mathbf{x}\rVert \le \lVert\delta\mathbf{b}\rVert/\sigma_{\min}$. (The double bars $\lVert\cdot\rVert$ mean length.)

The matrix stretches by at most $\sigma_{\max}$, so $\lVert\mathbf{b}\rVert = \lVert\mathbf{A}\mathbf{x}\rVert \le \sigma_{\max}\lVert\mathbf{x}\rVert$. Flip it: $1/\lVert\mathbf{x}\rVert \le \sigma_{\max}/\lVert\mathbf{b}\rVert$.

Multiply the two inequalities:

$$
\frac{\lVert\delta\mathbf{x}\rVert}{\lVert\mathbf{x}\rVert} \le \frac{\sigma_{\max}}{\sigma_{\min}}\,\frac{\lVert\delta\mathbf{b}\rVert}{\lVert\mathbf{b}\rVert} = \kappa\,\frac{\lVert\delta\mathbf{b}\rVert}{\lVert\mathbf{b}\rVert}.
$$

The worst case happens when $\mathbf{x}$ lies along the most-stretched direction and $\delta\mathbf{b}$ along the least-stretched one — exactly the situation in the example.
:::

## The same transfer, only the units changed

Now the real thing. Recall the minimum-time orbit raise from lessons 4 and 8: a $1200\,\mathrm{kg}$ spacecraft with $T_{\max} = 100\,\mathrm{N}$ climbs from $r_0 = 7000\,\mathrm{km}$ to $r_1 = 9000\,\mathrm{km}$. Lesson 8 solved it by Hermite-Simpson collocation with $N = 20$ segments, from a straight-line guess, in under two seconds.

That solve worked in **[[canonical units|canonical-units]]**: the length unit was $L = r_0$, and the time unit was

$$
T_U = \sqrt{\frac{r_0^3}{\mu}} = \sqrt{\frac{(7\times10^6)^3}{3.986\times10^{14}}} = 927.64\,\mathrm{s}.
$$

($\mu$, "mew", is Earth's gravitational parameter.) In those units $r$ runs from $1.0$ to $9000/7000 = 1.29$, the speeds from $6655/7546 = 0.88$ to $1.0$, and $t_f$ is about $12.37$.

::: example One transfer, two sets of units
Transcribe the **identical physical problem** — same dynamics, same targets, same solver, same tolerances — in raw SI units instead. Now $r$ runs from $7\times10^6$ to $9\times10^6\,\mathrm{m}$, the speeds from about $6655$ to $7546\,\mathrm{m/s}$, and $t_f$ is about $11\,475\,\mathrm{s}$. Start from the equivalent straight-line guess. In one run with an SQP solver:

| | Canonical units | Raw SI |
| --- | --- | --- |
| Converged? | Yes | No — iteration limit reached |
| Final constraint violation | about $10^{-13}$ | $2.6\times10^{-5}$ |
| Wall time | about $1.7\,\mathrm{s}$ | $57.4\,\mathrm{s}$ (300 iterations, still not done) |
| Reported $t_f$ | $12.372090$ (correct to the digits shown) | $31\,941.5\,\mathrm{s}$ |

**Read the last row.** The correct answer is $12.372090 \times 927.64 \approx 11\,477\,\mathrm{s}$. The raw-SI run reports $31\,941.5\,\mathrm{s}$, which is $31\,941.5/11\,477 \approx 2.78$ times too long. Nearly three times wrong.

**Look at the matrix.** Build the constraint Jacobian at the matching starting guess in each set of units (66 rows: 60 defects plus 6 boundary conditions; 85 columns: 63 states, 21 steering angles and $t_f$) and compute its condition number:

- canonical units: $\kappa \approx 1210$;
- raw SI: $\kappa \approx 2.52\times10^{5}$.

The ratio is $2.52\times10^5 / 1210 \approx 208$. The problem got about 200 times worse from the choice of units alone — on the very first evaluation, before the solver has taken a single step.

**Sanity check.** In SI, the Jacobian's nonzero entries run from about $10^{-5}$ to about $2400$: more than eight powers of ten. In canonical units the largest entry is about $1$. Nothing about the physics changed. Only the ruler did.
:::

::: key The fix, in one line
Non-dimensionalize: choose a characteristic length, time and mass (and from them velocity, acceleration and force) so that every state, control and constraint residual the solver actually sees sits at order unity. The physics does not care about units. The solver's numerical linear algebra does.
:::

## Choosing the scales

Here is the recipe the module has been following all along.

1. Pick a **length scale** $L$ from a natural size in the problem: the starting orbit radius, the starting altitude.
2. Pick a **time scale** $T_U$ from a natural rate: $\sqrt{L^3/\mu}$ for an orbit, or a rough guess of the flight time.
3. Pick a **mass scale** $M$: usually the vehicle's starting mass $m_0$.
4. Build every other unit from those three, so the units stay consistent. Velocity: $L/T_U$. Acceleration: $L/T_U^2$. Force: $ML/T_U^2$. The exhaust velocity $c$ is a velocity, so it too is divided by $L/T_U$.
5. Divide every state, control and constraint by its matching unit before handing anything to the solver. Multiply back only when you report a physical answer.

Why build the derived units instead of picking each one freely? Because then the equations of motion keep their shape. If velocity is measured in $L/T_U$, then "$\dot h = v$" is still true in the new numbers. Pick the velocity unit independently and a stray conversion factor appears in every equation — a classic source of bugs.

::: example Scaling the Mars descent
The descent from earlier lessons: start at $h_0 = 1500\,\mathrm{m}$, $v_0 = -75\,\mathrm{m/s}$, $m_0 = 1000\,\mathrm{kg}$; Mars gravity $g = 3.71\,\mathrm{m/s^2}$; $T_{\max} = 6000\,\mathrm{N}$; $c = 2206.5\,\mathrm{m/s}$. The best flight coasts $1.8546\,\mathrm{s}$ and burns $31.9051\,\mathrm{s}$, $33.7597\,\mathrm{s}$ in all.

**Step 1: the three base scales.** Length $L = 1500\,\mathrm{m}$ (the starting altitude). Time $T_U = 40\,\mathrm{s}$ (a round guess at the flight time). Mass $M = 1000\,\mathrm{kg}$.

**Step 2: the derived units.**

- velocity: $L/T_U = 1500/40 = 37.5\,\mathrm{m/s}$;
- acceleration: $L/T_U^2 = 1500/1600 = 0.9375\,\mathrm{m/s^2}$;
- force: $M L/T_U^2 = 1000 \times 0.9375 = 937.5\,\mathrm{N}$.

**Step 3: the numbers the solver now sees.** Divide each quantity by its unit:

| Quantity | SI value | Unit | Scaled value |
| --- | --- | --- | --- |
| $h_0$ | $1500\,\mathrm{m}$ | $1500\,\mathrm{m}$ | $1$ |
| $v_0$ | $-75\,\mathrm{m/s}$ | $37.5\,\mathrm{m/s}$ | $-2$ |
| $m_0$ | $1000\,\mathrm{kg}$ | $1000\,\mathrm{kg}$ | $1$ |
| $g$ | $3.71\,\mathrm{m/s^2}$ | $0.9375\,\mathrm{m/s^2}$ | $3.957$ |
| $T_{\max}$ | $6000\,\mathrm{N}$ | $937.5\,\mathrm{N}$ | $6.4$ |
| $c$ | $2206.5\,\mathrm{m/s}$ | $37.5\,\mathrm{m/s}$ | $58.84$ |
| $t_f$ | $33.76\,\mathrm{s}$ | $40\,\mathrm{s}$ | $0.844$ |

Every number sits within a factor of about 60 of $1$, most within a factor of 7. The propellant cost, $86.7579\,\mathrm{kg}$, becomes $0.0868$ mass units.

**Step 4: measure it.** The program below builds the Hermite-Simpson Jacobian ($N = 20$) at a straight-line guess (thrust $3000\,\mathrm{N}$, $t_f = 40\,\mathrm{s}$) and prints its condition number in [[three sets of units|cond-bars]]: raw SI, the scaled units above, and a deliberately silly set — millimeters, grams and seconds.

**Read the results.** Raw SI gives about $4870$. Scaled gives $100$, about 49 times better. Millimeters and grams give about $4.76\times10^9$ — a million times worse than SI.

**Sanity check.** Why was raw SI survivable here? The descent's own numbers happen to span only about four powers of ten (from about $1$ up to $6000\,\mathrm{N}$, which is $10^{3.8}$). The orbit transfer's meters-versus-radians mix spans about seven. The descent examples in this module converged in SI by luck of the numbers chosen, not by design. Pose the same problem in millimeters and grams, or start from a much higher altitude, and the luck runs out.
:::

```python
import numpy as np

g, c = 3.71, 2206.5                        # Mars gravity (m/s^2), exhaust velocity (m/s)
N = 20                                     # Hermite-Simpson segments

def f(x, T):                               # descent dynamics: altitude, velocity, mass
    h, v, m = x
    return np.array([v, T / m - g, -T / c])

def defects(z, L, V, M, F, TU):
    """Constraints as the solver sees them: every unknown in z is a scaled number."""
    X = z[:3 * (N + 1)].reshape(N + 1, 3) * [L, V, M]      # back to SI inside
    T = z[3 * (N + 1):-1] * F
    tf = z[-1] * TU
    dt = tf / N
    rows = []
    for k in range(N):
        fk, fk1 = f(X[k], T[k]), f(X[k + 1], T[k + 1])
        xm = (X[k] + X[k + 1]) / 2 + dt / 8 * (fk - fk1)
        fm = f(xm, (T[k] + T[k + 1]) / 2)
        d = X[k + 1] - X[k] - dt / 6 * (fk + 4 * fm + fk1)
        rows.append(d / [L, V, M])                           # residuals scaled too
    ends = [(X[0, 0] - 1500) / L, (X[0, 1] + 75) / V, (X[0, 2] - 1000) / M,
            X[-1, 0] / L, X[-1, 1] / V]
    return np.concatenate(rows + [np.array(ends, dtype=z.dtype)])

def condition_number(L, V, M, F, TU):
    s = np.linspace(0, 1, N + 1)           # straight-line guess, 3000 N, 40 s
    X = np.column_stack([1500 * (1 - s), -75 * (1 - s), 1000 - 90 * s])
    z = np.concatenate([(X / [L, V, M]).ravel(), np.full(N + 1, 3000 / F), [40 / TU]])
    J = np.zeros((len(defects(z, L, V, M, F, TU)), len(z)))
    for j in range(len(z)):                # complex-step derivative, one column at a time
        dz = np.zeros(len(z), complex)
        dz[j] = 1e-30j
        J[:, j] = defects(z + dz, L, V, M, F, TU).imag / 1e-30
    return np.linalg.cond(J)

print(f"metres, kg, N, s   : {condition_number(1, 1, 1, 1, 1):.3g}")
print(f"scaled (L, T, M)   : {condition_number(1500, 37.5, 1000, 937.5, 40):.3g}")
print(f"millimetres, grams : {condition_number(1e-3, 1e-3, 1e-3, 1e-6, 1):.3g}")
# metres, kg, N, s   : 4.87e+03
# scaled (L, T, M)   : 100
# millimetres, grams : 4.76e+09
```

The loop builds the Jacobian one column at a time with the **[[complex-step trick|complex-step]]**, which gives slopes exact to rounding. The unknowns are always divided by their units, so the solver's view changes while the physics inside `f` stays in SI.

### Scale the residuals and the cost too

Scaling the unknowns is only half the job. The **constraint residuals** — the numbers that must be driven to zero — should be order unity too. A boundary condition $r(t_f) - r_1 = 0$ written in meters is a number of size $10^6$ before it converges. A tolerance of $10^{-8}$ on it asks for a hundredth of a micrometer.

The good news: if every state and control inside a residual has been divided by its unit, the residual comes out in those same consistent units automatically. The boundary condition becomes $r_n(t_f) - r_{1,n} = 0$ ("r sub n", the scaled radius) with no extra choice to make. The defects in the program above are divided by $[L, V, M]$ for the same reason. So one consistent set of length, time and mass scales, chosen once, flows through the whole transcription.

The cost wants the same treatment. A cost of $86.76$ in kilograms is fine. A cost of $8.676\times10^{7}$ in milligrams would make every gradient enormous, and the solver's stopping test on the gradient would never be met.

::: key Two standard fixes for a trajectory NLP that will not converge
First, non-dimensionalize: get states, controls, constraint residuals and cost to order one, since a problem in poorly chosen units carries condition numbers as large as $10^9$ (the descent in millimeters and grams: $4.76\times10^9$) and fails restoration before it fails to find the optimum. Second, homotopy: solve an easy version (more thrust, no path constraints, shorter horizon) and sweep a parameter toward the real problem, warm starting each solve from the last — the subject of the next lesson.
:::

::: warning Choose the scaling up front, not as a rescue
When a solve fails, it is tempting to loosen the tolerance or raise the iteration limit. The raw-SI transfer above would need both, and even then it might never crawl to the answer. That treats the symptom. It usually buys a less accurate answer for more computing, not a fix. Scaling belongs in the problem setup, before the first solve — not after the fifth failure. A well-scaled problem does not only converge faster. It converges to a tighter tolerance in fewer iterations at no extra cost, as the canonical column of the table shows.
:::

Many solvers try to help. IPOPT, for example, applies its own [[automatic rescaling|ipopt-scaling]] at the start. But those heuristics only multiply each row or column by a single number, chosen from the slopes at the starting guess. They do not know that $r$ is a radius and $v$ a speed, and they cannot fix a problem whose trouble changes as the solve moves. Your own physically meaningful scales are much better. Choose them, and let the solver's heuristics polish.

## What good scaling does not fix

Scaling removes *artificial* ill-conditioning — the kind that comes from the choice of ruler. It does not remove *physical* sensitivity that is built into the problem.

Two examples from this module. Indirect shooting's costates (lesson 4) are exponentially sensitive over a long flight: a tiny change at the start really does move the end a lot, in any units. And some dynamics are **[[stiff|stiff]]**, with fast and slow motions mixed together. Scaling cannot make a fast motion slow.

A singular-arc problem like the Goddard rocket (lesson 5, and the module's Goddard exercise) is the case where both kinds pile up. Altitude in meters (thousands), mass in kilograms (hundreds to a thousand) and thrust in newtons (tens of thousands) add unit-driven trouble on top of the real difficulty of a singular arc. Scale first, and whatever difficulty remains is the physics.

That separation is the first diagnostic step whenever a trajectory NLP misbehaves: is this hard because of the physics, or because of the units? Fix the units first — it is cheap and always helps — and then see what is left. Lesson 17 turns this into a full [[checklist for failures|restoration-bridge]].

## Check yourself

::: check
Why does mixing a state in meters (about $10^7$) with a control in radians (about $1$) hurt a solver's *line search* in particular — beyond "the numbers are big"?
:::

::: answer
A line search picks one step length $\alpha$ and applies it to the whole search direction, balancing improvement against constraint violation along that one direction. Suppose the direction has a piece of size $10^7$ in the radius and a piece of size $1$ in the angle. An $\alpha$ that suits the angle (say $0.1$, a $10\,\%$ change) is far too small to matter for the radius. An $\alpha$ big enough to move the radius meaningfully sends the angle far outside the region where the solver's local model of the problem can be trusted. No single step length serves both sizes. That is a structural problem with the line search itself, not a complaint about large numbers in the output.
:::

::: check
The transfer's constraint Jacobian was about $200$ times worse conditioned in raw SI than in canonical units, measured at the *same* starting guess. Mechanically, why does a worse-conditioned Jacobian lead to slow or failed convergence?
:::

::: answer
Every Newton-type step solves a linear system built from the constraint Jacobian (inside the KKT matrix) to find the search direction. A high condition number means that system is close to singular, numerically. Small errors on the right-hand side — rounding, or the finite-difference errors in how the Jacobian was estimated — can be magnified by up to the condition number when the step is computed: here up to about $2.5\times10^5$ times. A step computed that unreliably is a poor stand-in for the true Newton step. A solver taking poor steps either creeps along, spending iterations correcting bad directions, or eventually stops making progress at all. That is the "iteration limit reached" outcome in the table.
:::

::: check
A colleague argues that modern solvers use adaptive step sizes and internal scaling, so manual non-dimensionalizing hardly matters. What does the transfer example say about that?
:::

::: answer
The example used the same solver, with its own built-in heuristics, on the same problem, changing only the units. The result was the difference between converging in $1.7\,\mathrm{s}$ and failing after $57\,\mathrm{s}$ with a flight time nearly three times too long. Built-in heuristics help at the margins, but they work on the problem as handed to them. They are typically single numbers per row or column chosen at the start, and they do not know the problem's structure the way a modeler choosing physical scales does. The colleague is right that solvers try to help. They are wrong that trying is the same as succeeding, and this problem is direct evidence.
:::

::: check
Why does non-dimensionalizing the *states* automatically non-dimensionalize the *constraint residuals*, instead of needing a separate choice for each constraint?
:::

::: answer
Every constraint in these transcriptions — a defect, a boundary condition — is built by combining state and control values: differences, and weighted sums through a quadrature rule. Once every state and control in that combination has been divided by its unit, the residual comes out in those same consistent units, not the raw physical ones. A boundary condition $r(t_f) - r_1 = 0$ becomes $r_n(t_f) - r_{1,n} = 0$ purely by substituting the scaled variables. There is no extra, independent choice to make. That is why one consistent set of length, time and mass scales, chosen once, carries through the whole transcription without being re-derived constraint by constraint.
:::

::: check
For the orbit transfer, the base scales are $L = 7000\,\mathrm{km}$, $T_U = 927.64\,\mathrm{s}$ and $M = 1200\,\mathrm{kg}$. What is the force unit, and what number does the solver see for the $100\,\mathrm{N}$ thrust? Is it order unity?
:::

::: answer
The acceleration unit is $L/T_U^2 = 7\times10^6/927.64^2 = 8.135\,\mathrm{m/s^2}$. The force unit is $M L/T_U^2 = 1200 \times 8.135 = 9762\,\mathrm{N}$. The thrust becomes $100/9762 = 0.0102$.

That is about a hundredth — small, but only two powers of ten from $1$, compared with the seven-power spread of meters against radians. It is small for a physical reason: the engine's push is about one percent of the gravity the spacecraft feels at $7000\,\mathrm{km}$, which is exactly why the transfer takes about two laps. Scaling does not have to make every number exactly $1$. It has to stop them from spanning many powers of ten for no reason.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Why scaling matters | Line searches, Hessian updates and stopping tests all assume order-unity, comparable numbers |
| Condition number | $\kappa = \sigma_{\max}/\sigma_{\min}$; errors can grow up to $\kappa$ times; about $\log_{10}\kappa$ digits lost |
| The fix | Choose $L$, $T_U$, $M$ from the problem; derive velocity $L/T_U$, acceleration $L/T_U^2$, force $ML/T_U^2$; divide every variable, residual and the cost before solving |
| Transfer example | Canonical units converge in about $1.7\,\mathrm{s}$; raw SI fails after $57.4\,\mathrm{s}$ with $t_f$ about $2.8$ times too long |
| Transfer Jacobian | $\kappa \approx 1210$ (canonical) against $2.52\times10^5$ (SI): about $208$ times worse from units alone |
| Descent Jacobian | $\kappa \approx 4870$ (SI), $100$ (scaled), $4.76\times10^9$ (millimeters and grams) |
| Residuals | Scaled automatically once the states and controls are |
| Not fixed by scaling | Real physical sensitivity: shooting's exponential growth, stiff dynamics, singular arcs |
| Discipline | Scale before the first solve; never treat non-convergence as a tolerance to loosen |

Scaling fixes the numbers. The next lesson fixes the starting point: instead of a cold guess, warm up from an easier version of the same problem and walk toward the real one.

::: context narrow-valley Why stretched units make a canyon
On the left, the valley is round: the downhill direction points straight at the bottom, and one step gets you most of the way. On the right, the same valley is drawn with one axis stretched. Downhill now points mostly across the canyon, so each step bounces off the walls and progress along the floor is slow.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g fill="none" stroke="#8fb8f0" stroke-width="1.5">
    <circle cx="80" cy="80" r="20"/><circle cx="80" cy="80" r="40"/><circle cx="80" cy="80" r="60"/>
  </g>
  <circle cx="80" cy="80" r="3" fill="#1f2a44"/>
  <line x1="122" y1="38" x2="84" y2="76" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="84,76 86,66 94,74" fill="#b4232c"/>
  <text x="80" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">good units</text>
  <g fill="none" stroke="#8fb8f0" stroke-width="1.5">
    <ellipse cx="255" cy="80" rx="30" ry="8"/><ellipse cx="255" cy="80" rx="60" ry="16"/><ellipse cx="255" cy="80" rx="90" ry="24"/>
  </g>
  <circle cx="255" cy="80" r="3" fill="#1f2a44"/>
  <polyline points="335,70 322,93 309,68 296,91 283,71 272,88 262,76" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="255" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">one axis in the wrong units</text>
</svg>
```

Same valley, same bottom. Only the ruler changed.
:::

::: context order-unity What "order one" means
"Order of magnitude" means the power of ten a number is closest to. $3$ and $0.4$ are both "order one". $2500$ is order $10^3$. Engineers say a quantity is order unity when it is within a factor of ten or so of $1$. It is a loose phrase on purpose: scaling does not need every number to be exactly $1$, only to keep them from spanning many powers of ten.
:::

::: context turing-condition A name from Alan Turing
The phrase "condition number" comes from Alan Turing, in a 1948 paper on rounding errors in matrix calculations — written while the first electronic computers were being built and people were discovering, painfully, that some matrices lose all their digits. A patient in poor "condition" is fragile; an ill-conditioned matrix is fragile in the same way. Every numerical library today, including NumPy's `np.linalg.cond`, reports the number he named.
:::

::: context singular-values A circle becomes an ellipse
Feed a matrix every arrow of length $1$ — a whole circle of them — and it hands back an ellipse. The ellipse's longest half-axis is $\sigma_{\max}$ and its shortest is $\sigma_{\min}$. Here the matrix stretches by $3$ one way and squeezes to $0.5$ the other, so $\kappa = 3/0.5 = 6$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <circle cx="55" cy="60" r="30" fill="#ffffff" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="55" y1="60" x2="85" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="55" y="112" font-size="12" text-anchor="middle" fill="#1f2a44">radius 1</text>
  <line x1="100" y1="60" x2="135" y2="60" stroke="#6c7a93" stroke-width="2"/>
  <polygon points="140,60 131,55 131,65" fill="#6c7a93"/>
  <text x="118" y="50" font-size="12" text-anchor="middle" fill="#6c7a93">A</text>
  <ellipse cx="245" cy="60" rx="90" ry="15" fill="#ffffff" stroke="#b4232c" stroke-width="2"/>
  <line x1="245" y1="60" x2="335" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="245" y1="60" x2="245" y2="45" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="92" font-size="12" text-anchor="middle" fill="#1f2a44">σmax = 3</text>
  <text x="245" y="36" font-size="12" text-anchor="middle" fill="#1f2a44">σmin = 0.5</text>
  <text x="245" y="112" font-size="12" text-anchor="middle" fill="#1f2a44">κ = 3 / 0.5 = 6</text>
</svg>
```
:::

::: context double-precision Sixteen digits, and no more
Computers normally store a decimal number in "double precision": 64 bits, good for about 15 to 16 significant digits. Every sum and product is rounded to that many. It sounds like plenty — and it is, until a calculation magnifies the rounding. A condition number of $10^{9}$ can turn a rounding error in the 16th digit into an error in the 7th. Solvers then ask for tolerances like $10^{-8}$ that the arithmetic can no longer deliver, and they stall.
:::

::: context canonical-units Astrodynamicists did this first
Astrodynamicists have long worked in "canonical units": one distance unit equal to a natural radius, and one time unit chosen so that the gravitational parameter $\mu$ equals exactly $1$. For Earth's surface radius, $6378\,\mathrm{km}$, that time unit is about $806.8\,\mathrm{s}$, and the speed unit is about $7.905\,\mathrm{km/s}$ — the speed of a circular orbit skimming the surface. This module's transfer uses the same idea with $7000\,\mathrm{km}$, so the starting circular speed is exactly $1$.
:::

::: context cond-bars Three rulers, one descent
The same Mars descent Jacobian, with its condition number drawn on a scale of powers of ten. Each tick is a factor of ten. Nothing changes between the bars except the units of the numbers the solver sees.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="110" y1="20" x2="110" y2="115" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="110" y1="115" x2="350" y2="115" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="134" y1="115" x2="134" y2="120"/><line x1="158" y1="115" x2="158" y2="120"/><line x1="182" y1="115" x2="182" y2="120"/>
    <line x1="206" y1="115" x2="206" y2="120"/><line x1="230" y1="115" x2="230" y2="120"/><line x1="254" y1="115" x2="254" y2="120"/>
    <line x1="278" y1="115" x2="278" y2="120"/><line x1="302" y1="115" x2="302" y2="120"/><line x1="326" y1="115" x2="326" y2="120"/>
    <line x1="350" y1="115" x2="350" y2="120"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="110" y="133">1</text><text x="158" y="133">10²</text><text x="206" y="133">10⁴</text>
    <text x="254" y="133">10⁶</text><text x="302" y="133">10⁸</text><text x="350" y="133">10¹⁰</text>
  </g>
  <rect x="110" y="28" width="48" height="18" fill="#1d6fd1"/>
  <rect x="110" y="56" width="88.5" height="18" fill="#8fb8f0"/>
  <rect x="110" y="84" width="232.3" height="18" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="104" y="41">scaled</text><text x="104" y="69">meters, kg</text><text x="104" y="97">mm, grams</text>
  </g>
  <g font-size="11" fill="#1f2a44">
    <text x="164" y="41">100</text><text x="204" y="69">4870</text>
  </g>
  <text x="336" y="97" font-size="11" fill="#ffffff" text-anchor="end">4.76 × 10⁹</text>
</svg>
```
:::

::: context complex-step A derivative with no subtraction
The usual way to estimate a slope subtracts two nearly equal numbers, which throws away digits. The complex-step trick adds a tiny *imaginary* nudge, $10^{-30}i$, to one input instead. For a function built from ordinary arithmetic and smooth functions, the imaginary part of the output, divided by $10^{-30}$, is the slope, correct to rounding. Nothing is subtracted, so nothing is lost. It is a neat way to get a trustworthy Jacobian for a demonstration like this one.
:::

::: context ipopt-scaling What IPOPT does on its own
By default IPOPT looks at the gradients at the starting point and scales down any constraint or cost whose largest slope is above $100$, so no single row dominates. It is a sensible safety net. But it is one number per row, chosen once, from a guess that may be far from the answer. It cannot know that one column is a radius and another an angle. Engineers who use IPOPT daily still hand it a problem already written in sensible units.
:::

::: context stiff Fast and slow at the same time
A system is "stiff" when it contains motions on very different time scales: a fast wobble that dies out in milliseconds alongside a slow drift over minutes. A rocket's engine-pressure dynamics next to its trajectory are an example. Stiffness is a property of the physics, not of the units, so no choice of ruler removes it. It is handled instead by implicit integration rules and by meshes fine enough to follow the fast part.
:::

::: context restoration-bridge Where this comes back
When IPOPT cannot even reduce its constraint violation, it enters a "restoration phase", and if that fails it reports "restoration failed". Lesson 17 works through what that message means. The first item on the checklist is exactly this lesson: check that states, controls and residuals are order one. Only after that do you ask whether the constraints could ever be met at all.
:::
