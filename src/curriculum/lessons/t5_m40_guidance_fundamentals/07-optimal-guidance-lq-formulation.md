---
id: l07-optimal-guidance-lq-formulation
title: Optimal guidance from a linear-quadratic formulation
minutes: 18
covers:
  - Optimal guidance from an LQ formulation and how PN emerges from it
---

Think about pulling a car into a garage. You could fuss with the steering wheel all the way in, making dozens of tiny corrections, and end up exactly centered to the millimeter. Or you could make a couple of relaxed turns and stop a few centimeters off-center. Which is better depends on how much you care. In a narrow garage with a bike on one wall, being off-center is expensive, so you work hard. In a wide garage, a few centimeters cost nothing, so you relax.

That "how much do I care" is a price. You are quietly trading two things against each other: effort spent now, and error left at the end. This lesson writes that trade down as mathematics, solves it, and finds something neat. Proportional navigation with $N = 3$, the law lesson 5 derived, is what you get when the price of missing is set to infinity.

On a real vehicle this is not a classroom curiosity. It is how guidance engineers think about any terminal law: write down what you care about as a cost, let optimal control produce the law, then decide how hard to lean on accuracy. The same recipe gives the landing law of the next lesson.

## A plan versus a law

Lesson 5 solved one sharp problem. Starting from one fixed position and one fixed velocity, find the acceleration history that hits the target exactly while spending the least effort. The answer was a **control history** — a list of what to do at every moment, worked out once, for that one starting point.

That is like printed driving directions. They are perfect if you start where they assume and nothing goes wrong. Take one wrong turn and the directions are useless.

What a guidance computer needs is more like a phone's map app that says "recalculating". It needs a **[[feedback law|plan-vs-law]]** — a rule that takes whatever state the vehicle is in right now, and however much time is left, and returns the best command from here. Feed it any state and it answers.

The tool that produces feedback laws for problems like this is the **linear-quadratic regulator**, usually shortened to **LQR** or just **LQ**. "Linear" means the motion obeys linear equations. "Quadratic" means the cost is built from squares. "Finite horizon" means the problem ends at a fixed time — here, the moment of intercept.

## Writing the price list

Keep the same simple model as lesson 5. Look only at the sideways direction, across the line of sight. Let $x_1$ ("x one") be the pursuer's sideways position relative to the target, so $x_1 = 0$ means dead on. Let $x_2$ ("x two") be how fast that sideways offset is changing. The command $u$ is the sideways acceleration.

Position changes by velocity, and velocity changes by acceleration:

$$
\dot x_1 = x_2, \qquad \dot x_2 = u .
$$

(Read $\dot x_1$ as "x one dot": the rate of change of $x_1$.) This pair is called a **[[double integrator|double-integrator]]**, because acceleration has to be integrated twice to become position. In matrix form it is $\dot{\mathbf{x}} = \mathbf{A}\mathbf{x} + \mathbf{B}u$ with

$$
\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}, \qquad \mathbf{B} = \begin{pmatrix}0\\1\end{pmatrix}.
$$

Now the price list. Call the time left $t_{go}$, read "t go", the time to go until intercept. The **[[cost function|cost-function]]** $J$ adds up everything we dislike:

$$
J = \frac12\int_0^{t_{go}} u^2\,ds + \frac12\,q_f\,x_1(t_{go})^2 .
$$

Read it in two pieces.

- The integral adds up $u^2$ over the rest of the flight. Here $s$ is the clock, counting seconds from now. Squaring means big pushes cost much more than small ones, and pushing left costs the same as pushing right. This is the **control effort**.
- The second piece charges for the miss left at the end, $x_1(t_{go})$, squared. This is the **terminal penalty**.

The number $q_f$ ("q sub f", the f for final) is the **weight**: how many units of effort one unit of squared miss is worth. It is the garage-width dial. A big $q_f$ says "missing is expensive". A small $q_f$ says "I'll accept some miss to save effort".

Notice what is *not* on the list. Nothing charges for being off-target during the flight — only at the end. And nothing charges for sideways velocity at the end. This is still the intercept problem: hit, and arrive however fast you like.

::: note How this looks in the standard LQR notation
The general finite-horizon LQR problem has a state weight $\mathbf{Q}$ charged all along the way, a control weight $R$, and a terminal weight $\mathbf{Q}_f$. This lesson's problem is the special case

$$
\mathbf{Q} = \mathbf{0}, \qquad R = 1, \qquad \mathbf{Q}_f = \begin{pmatrix} q_f & 0 \\ 0 & 0 \end{pmatrix}.
$$

$\mathbf{Q} = \mathbf{0}$ makes it a terminal-guidance problem, not a tracking problem. The zero in the corner of $\mathbf{Q}_f$ leaves terminal velocity free. The soft-landing problem of the next lesson puts a weight there too.
:::

## Solving it

We solve it with the same tool lesson 5 used: Pontryagin's method. Here is a quick reminder of how it goes. Each state gets a partner variable, a **[[costate|costate]]**, written $\lambda_1$ and $\lambda_2$ ("lambda one", "lambda two"). A costate measures how much the final cost would change if you nudged that state a little. The **Hamiltonian** bundles effort and costates together:

$$
H = \tfrac12 u^2 + \lambda_1 x_2 + \lambda_2 u .
$$

Four facts come out of it, exactly as in lesson 5.

1. The best command makes $H$ as small as possible. Setting $\partial H/\partial u = u + \lambda_2 = 0$ gives $u^\star = -\lambda_2$. (The star means "optimal".)
2. The costates change according to $\dot\lambda_1 = -\partial H/\partial x_1 = 0$ and $\dot\lambda_2 = -\partial H/\partial x_2 = -\lambda_1$. So $\lambda_1$ is a constant; call it $c_1$.
3. Terminal velocity costs nothing, so its costate must end at zero: $\lambda_2(t_{go}) = 0$. That gives $\lambda_2(s) = c_1(t_{go} - s)$, and so $u^\star(s) = -c_1(t_{go} - s)$. The command is a straight line in time, shrinking to zero at intercept.
4. **This is the one new piece.** In lesson 5, the miss was forced to be exactly zero. Now the miss is allowed but priced. The rule for a priced end point is that the costate at the end equals the slope of the penalty there. The penalty is $\tfrac12 q_f x_1^2$, whose slope is $q_f x_1$. So $\lambda_1(t_{go}) = q_f\,x_1(t_{go})$, which means $c_1 = q_f\,x_1(t_{go})$.

Now connect $c_1$ to where the vehicle is. Write $T$ for $t_{go}$ to keep things short. Integrating the straight-line command through the double integrator gives the final miss:

$$
x_1(T) = x_1(0) + x_2(0)\,T - \frac{c_1 T^3}{3}.
$$

The first two terms are where coasting would leave you. The last term is what the control did about it.

Replace $x_1(T)$ by $c_1/q_f$ (from fact 4) and gather the $c_1$ terms on the left:

$$
c_1\left(\frac{1}{q_f} + \frac{T^3}{3}\right) = x_1(0) + x_2(0)\,T .
$$

The right side is where the vehicle would end up if it coasted from here. The **zero-effort miss** is the gap between the target and that coasting point. The target is at $0$, so $ZEM = 0 - (x_1 + x_2 T) = -(x_1 + x_2 T)$. Therefore

$$
c_1 = \frac{-ZEM}{1/q_f + T^3/3}.
$$

The command right now is $u^\star(0) = -c_1 T$. Multiply top and bottom by $3q_f$ to clear the small fractions:

$$
u^\star(0) = \frac{3 q_f T}{3 + q_f T^3}\,\big({-x_1} - x_2 T\big) = -\frac{3 q_f T}{3 + q_f T^3}\,x_1 - \frac{3 q_f T^2}{3 + q_f T^3}\,x_2 .
$$

That is a feedback law. It says: multiply the current position by one **gain**, the current velocity by another, add, and flip the sign. The gains depend only on the time left. Write $\tau$ ("tau") for the time to go when it is the input to a gain.

::: key The LQ guidance gain
$$
k_1(\tau) = \frac{3q_f\tau}{3+q_f\tau^3}, \qquad k_2(\tau) = \frac{3q_f\tau^2}{3+q_f\tau^3}, \qquad u^\star = -k_1(\tau)\,x_1 - k_2(\tau)\,x_2,
$$
valid from any current state $(x_1, x_2)$ with $\tau = t_{go}$ remaining. $q_f$ prices a unit of terminal miss against a unit of control effort; it is the single knob that moves the whole family of guidance laws this problem produces.
:::

Check the units. $q_f$ has units of $1/\mathrm{s}^3$ here, because $u^2$ integrated over time ($\mathrm{m^2/s^3}$) must match $q_f$ times a squared miss ($\mathrm{m^2}$). So $q_f\tau^3$ has no units, and the $3$ beside it makes sense. Then $k_1$ comes out in $1/\mathrm{s}^2$ and $k_2$ in $1/\mathrm{s}$. Multiply by meters and meters per second and both terms are accelerations, as they must be.

::: note Why the final-miss formula has a $T^3/3$ in it
Push with acceleration $u(s)$ at time $s$. By the end, that push has had $T - s$ seconds to turn into extra position. So the push's contribution to the final position is $(T - s)\,u(s)$, and adding them all up gives

$$
x_1(T) = x_1(0) + x_2(0)\,T + \int_0^T (T - s)\,u(s)\,ds .
$$

Put in $u(s) = -c_1(T - s)$:

$$
\int_0^T (T-s)\big({-c_1}(T-s)\big)\,ds = -c_1\int_0^T (T-s)^2\,ds = -c_1\frac{T^3}{3}.
$$

The last step is the area under a parabola: $\int_0^T w^2\,dw = T^3/3$ with $w = T - s$.
:::

## PN as the infinite-weight limit

Now turn the dial all the way up. Let $q_f \to \infty$. An infinitely expensive miss is the same thing as a hard rule: "hit the target, whatever it costs." That was exactly lesson 5's problem.

To see the limit, divide the top and the bottom of each gain by $q_f$:

$$
k_1(\tau) = \frac{3\tau}{3/q_f+\tau^3} \xrightarrow{q_f\to\infty} \frac{3\tau}{\tau^3} = \frac{3}{\tau^2}, \qquad k_2(\tau) = \frac{3\tau^2}{3/q_f+\tau^3} \xrightarrow{q_f\to\infty} \frac{3}{\tau}.
$$

As $q_f$ grows, $3/q_f$ shrinks to nothing, and only $\tau^3$ is left on the bottom. Put these limit gains back into the law:

$$
u^\star = -\frac{3}{\tau^2}x_1 - \frac{3}{\tau}x_2 = \frac{-3\,(x_1 + x_2\tau)}{\tau^2} = \frac{3\,ZEM}{\tau^2}.
$$

Lesson 4 showed that for a target that does not maneuver, $ZEM/t_{go}^2 = V_c\dot\lambda$, the closing velocity times the line-of-sight rate. So $u^\star = 3V_c\dot\lambda$. That is proportional navigation with $N = 3$, exactly.

So **proportional navigation with $N = 3$ is the infinite-terminal-weight limit of the linear-quadratic guidance problem.** It is not a separate result that happens to agree. It is the same optimization, posed more generally, then specialized back down by treating a hard rule as a soft one with an infinite price.

::: key PN as a ZEM law
$$
a_c = N\,\frac{ZEM}{t_{go}^2}.
$$
For a non-maneuvering target this is identical to $N V_c\dot\lambda$, which is why $N = 3$ is the minimum-energy constant: it is the $q_f \to \infty$ limit of the LQ gains.
:::

Turn the dial the other way too. As $q_f \to 0$, the top of each gain carries a factor $q_f$, while the bottom tends to $3$. Both gains shrink to zero. A miss that costs nothing is not worth any effort, so the best plan is to [[coast|q-zero]].

::: example Watching the gain approach PN
Take $\tau = 3\,\mathrm{s}$ to go. The PN value of $k_1$ is $3/\tau^2 = 3/9 = 0.33333\,\mathrm{s^{-2}}$. Now compute $k_1$ for growing weights.

**$q_f = 10$:** the top is $3 \times 10 \times 3 = 90$. The bottom is $3 + 10 \times 27 = 273$. So $k_1 = 90/273 = 0.32967$. Already within about $1\%$ of PN.

**$q_f = 1000$:** the top is $9000$ and the bottom is $3 + 27\,000 = 27\,003$. So $k_1 = 0.33330$, within $0.01\%$.

**$q_f = 10^6$:** $k_1 = 0.333333$, matching $1/3$ to six figures.

```python
def k1(qf, tau):
    return 3 * qf * tau / (3 + qf * tau**3)

for qf in (10, 1e3, 1e6, 1e10):
    print(qf, round(k1(qf, 3.0), 7), round(3 / 3.0**2, 7))
# 10 0.3296703 0.3333333
# 1000.0 0.3332963 0.3333333
# 1000000.0 0.3333333 0.3333333
# 10000000000.0 0.3333333 0.3333333
```

Sanity check: every value is a little *below* $1/3$, and creeps up toward it. That makes sense. A finite price means the law is a little more relaxed than "hit at any cost".

There is a second, independent check. The general LQR machinery finds gains by solving a matrix equation called the **[[Riccati equation|riccati]]** backward from the end. Solving it numerically for this problem gives $k_1 = 0.32967$, $k_2 = 0.98901$ at $q_f = 10$ and $k_1 = 0.33330$, $k_2 = 0.99989$ at $q_f = 1000$ — the same numbers as the closed form, to every digit shown.
:::

## What a finite weight buys

Hitting exactly at any cost is not always the right question. Suppose you already know the seeker's noise, or the autopilot's slowness, puts a floor of, say, half a meter under the miss you can really achieve. A law that keeps spending effort to shave the miss thinner than that floor is buying nothing. The LQ form has a dial for exactly this. PN alone does not.

How much accuracy does each extra bit of effort buy? The formulas answer it without any simulation. From fact 4, the final miss is $x_1(T) = c_1/q_f$. Put in $c_1$ and simplify:

$$
x_1(T) = \frac{-ZEM}{1 + q_f T^3/3}, \qquad \int_0^T u^2\,ds = c_1^2\,\frac{T^3}{3}.
$$

As $q_f$ grows, the miss shrinks toward zero and the effort rises toward its PN value, $3\,ZEM^2/T^3$ (the minimum-energy cost from lesson 5).

::: example Softening the terminal weight
Start at $x_1(0) = 200\,\mathrm{m}$ sideways, moving at $x_2(0) = -3\,\mathrm{m/s}$ toward the line, with $t_{go} = 12\,\mathrm{s}$ left.

**Step 1: the zero-effort miss.** Coasting for $12\,\mathrm{s}$ at $-3\,\mathrm{m/s}$ moves $-36\,\mathrm{m}$, ending at $200 - 36 = 164\,\mathrm{m}$. So $ZEM = -164\,\mathrm{m}$. That is a large predicted miss, far from a free hit.

**Step 2: one weight by hand, $q_f = 1$.** Here $q_f T^3/3 = 1728/3 = 576$. The miss is $164/(1 + 576) = 164/577 = 0.284\,\mathrm{m}$.

**Step 3: the whole family.** Fly the feedback law in closed loop for each weight and measure the miss and the effort. (The simulated numbers match the formulas above.)

| $q_f$ | Final miss $\lvert x_1\rvert$ | Control effort $\int u^2\,ds$ |
| --- | --- | --- |
| $0.01$ | $24.260\,\mathrm{m}$ | $33.901$ |
| $0.1$ | $2.799\,\mathrm{m}$ | $45.114$ |
| $1$ | $0.284\,\mathrm{m}$ | $46.533$ |
| $10$ | $0.028\,\mathrm{m}$ | $46.678$ |
| $\infty$ (PN) | $0.000\,\mathrm{m}$ | $46.694$ |

(Effort is in $\mathrm{m^2/s^3}$.)

**Sanity check.** The PN row should equal lesson 5's minimum cost, $3\,ZEM^2/t_{go}^3 = 3 \times 164^2 / 12^3 = 80\,688/1728 = 46.694$. It does.

**Reading the table.** Going from $q_f = 0.01$ to $q_f = 1$ cuts the miss from $24\,\mathrm{m}$ to under a third of a meter, for about $37\%$ more effort ($46.533/33.901 = 1.37$). Going from $q_f = 1$ all the way to PN removes the last $0.284\,\mathrm{m}$ for only $0.16$ more units of effort — under half a percent. Once the weight is big enough that accuracy already dominates, pushing it to "PN exactly" is nearly free. The real design question is whether your $q_f$ is anywhere near that regime at all.
:::

That bend in the numbers — big gains first, then almost nothing — is the shape of a **[[trade-off curve|trade-off-curve]]** as it approaches a hard rule.

::: warning PN is not wrong to demand a hard hit — it is a choice
Nothing here says $q_f = \infty$ is a mistake. When a genuine, no-compromise intercept is the requirement, the infinite-weight limit is exactly the right model, and PN is exactly its law. The LQ view matters when that assumption deserves a question — when noise or actuator limits mean "hit exactly" was never achievable anyway. Then you can pick a finite $q_f$ on purpose, instead of discovering the trade by accident in flight test.
:::

::: warning Two different "taus"
In lesson 5, $\tau$ was a clock running forward through the remaining flight. In the gains $k_1(\tau)$ and $k_2(\tau)$ here, $\tau$ is the *time left*, $t_{go}$. That is why this lesson used $s$ for the forward clock inside the integrals. When you read other books, check which one they mean before plugging numbers in.
:::

## Check yourself

::: check
Write the LQ guidance cost from this lesson. Then explain what the two limits $q_f \to 0$ and $q_f \to \infty$ mean physically.
:::

::: answer
$J = \tfrac12\int_0^{t_{go}}u^2\,ds + \tfrac12 q_f\, x_1(t_{go})^2$.

As $q_f \to 0$, a terminal miss costs nothing. The cheapest plan is then to apply no control at all and coast. The gains confirm it: both have a factor $q_f$ on top and tend to $0$.

As $q_f \to \infty$, any miss is infinitely costly. That is the same as a hard rule, "hit the target regardless of effort". The gains tend to $3/\tau^2$ and $3/\tau$, which is proportional navigation with $N = 3$.
:::

::: check
Using $k_1(\tau) = 3q_f\tau/(3+q_f\tau^3)$ and $k_2(\tau) = 3q_f\tau^2/(3+q_f\tau^3)$, find both gains for $q_f = 200$ and $\tau = 4\,\mathrm{s}$.
:::

::: answer
The bottom first: $3 + 200 \times 4^3 = 3 + 200 \times 64 = 3 + 12\,800 = 12\,803$.

Then $k_1 = \dfrac{3 \times 200 \times 4}{12\,803} = \dfrac{2400}{12\,803} = 0.18746\,\mathrm{s^{-2}}$.

And $k_2 = \dfrac{3 \times 200 \times 16}{12\,803} = \dfrac{9600}{12\,803} = 0.74982\,\mathrm{s^{-1}}$.

Sanity check: PN would give $3/16 = 0.1875$ and $3/4 = 0.75$. Ours are a hair smaller, as a finite weight should give.
:::

::: check
This lesson ends up with the same $N = 3$ law that lesson 5 derived. In what exact sense is this lesson's derivation more general, when the answer is the same?
:::

::: answer
Lesson 5 found the best control *history* $u^\star(s)$ for one fixed starting state. Any other starting state would need the whole calculation redone.

This lesson found *feedback gains* $k_1(\tau)$ and $k_2(\tau)$. They depend only on the time left, not on the current state. So you can apply them to *any* current $(x_1, x_2)$ and get the best command from there on.

Lesson 5's answer is this feedback law evaluated once, at one particular state, in the $q_f \to \infty$ limit. It is a special case of a law that also covers every other state and every finite $q_f$ in between.
:::

::: check
In the softening example, why does effort rise steeply between $q_f = 0.01$ and $q_f = 1$, but hardly at all between $q_f = 1$ and $q_f = \infty$?
:::

::: answer
At very small $q_f$ the miss is cheap compared with effort. The optimizer accepts a big miss and spends little. There is a lot of slack to give up, so as $q_f$ grows, effort rises quickly to buy back most of the accuracy.

By about $q_f = 1$, the terminal penalty already dominates. The miss is already under a third of a meter, against a $164\,\mathrm{m}$ starting error. The optimizer is already flying almost the full-effort path. Raising $q_f$ further only asks it to close a small leftover, which costs little extra energy.

This shape is general. Any smooth, bowl-shaped trade that approaches a hard constraint behaves this way, not only this problem.
:::

::: check
Map this lesson's problem onto the standard finite-horizon LQR notation $(\mathbf{A}, \mathbf{B}, \mathbf{Q}, \mathbf{Q}_f, R)$.
:::

::: answer
$\mathbf{A} = \begin{pmatrix}0&1\\0&0\end{pmatrix}$ and $\mathbf{B}=\begin{pmatrix}0\\1\end{pmatrix}$: the double integrator.

$\mathbf{Q} = \mathbf{0}$: nothing is charged for being off-target *during* the flight, only at the end. That is what makes this terminal guidance rather than trajectory tracking.

$R = 1$: a plain control-effort cost.

$\mathbf{Q}_f = \operatorname{diag}(q_f, 0)$: the terminal weight falls entirely on the miss (the first state) and not at all on the final sideways rate (the second). That fits an intercept. The soft-landing problem in the next lesson weights both.
:::

## Summary

| Idea | Statement |
| --- | --- |
| LQ guidance cost | $J = \tfrac12\int u^2\,ds + \tfrac12 q_f x_1(t_{go})^2$, with $\mathbf{Q}=\mathbf{0}$, $R=1$, $\mathbf{Q}_f=\operatorname{diag}(q_f,0)$ |
| Plan vs law | a control history fits one start; a feedback law works from any state |
| New costate condition | $\lambda_1(t_{go}) = q_f\,x_1(t_{go})$ for a priced (soft) miss |
| Feedback gains | $k_1(\tau) = 3q_f\tau/(3+q_f\tau^3)$, $k_2(\tau)=3q_f\tau^2/(3+q_f\tau^3)$ |
| $q_f \to 0$ | gains go to zero: coast |
| $q_f \to \infty$ | $k_1\to3/\tau^2$, $k_2\to3/\tau$: $u = 3\,ZEM/\tau^2 = 3V_c\dot\lambda$, PN with $N=3$ |
| PN as a ZEM law | $a_c = N\,ZEM/t_{go}^2$ |
| Finite weight | miss $= -ZEM/(1 + q_f T^3/3)$; most accuracy is cheap, the last bit is nearly free |

PN's law is fixed once you assume a non-maneuvering target and price the miss infinitely. The next lesson asks for more at the end: not only the right place, but the right speed too — a soft landing — and derives the feedback law that results.

::: context plan-vs-law Directions versus a navigator
A printed list of turns is a plan. It was computed once, for one start, and it breaks the moment you leave the route. A map app that says "recalculating" holds a law: from wherever you are, it produces the next move.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <circle cx="320" cy="80" r="9" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="320" cy="80" r="3" fill="#b4232c"/>
  <text x="320" y="108" font-size="11" fill="#b4232c" text-anchor="middle">target</text>
  <path d="M 30 80 Q 170 20 311 80" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="30" cy="80" r="4" fill="#1d6fd1"/>
  <text x="120" y="30" font-size="11" fill="#1d6fd1">the one planned path</text>
  <circle cx="120" cy="120" r="4" fill="#1f2a44"/>
  <path d="M 120 120 Q 220 125 311 84" fill="none" stroke="#1f2a44" stroke-width="2" stroke-dasharray="5 4"/>
  <circle cx="60" cy="140" r="4" fill="#1f2a44"/>
  <path d="M 60 140 Q 200 150 312 86" fill="none" stroke="#1f2a44" stroke-width="2" stroke-dasharray="5 4"/>
  <text x="20" y="155" font-size="11" fill="#1f2a44">other starts: the law still finds a way</text>
</svg>
```
:::

::: context double-integrator Why "double integrator"
Integrating means adding up a rate over time to get a total. Add up acceleration and you get velocity. Add up velocity and you get position. So a command $u$ passes through two integrations before it moves the vehicle sideways. That is all the name says. It is the simplest model of anything you push: a cart on ice, a spacecraft in free fall, a missile's sideways motion near a collision course. Its simplicity is the point. The answers come out in closed form, and they turn out to be close to what real vehicles need.
:::

::: context cost-function A single number that says "how bad"
A cost function turns a whole flight into one number, so that "better" and "worse" have a precise meaning. Engineers choose squares on purpose. A square is never negative, so errors to the left and right both count. It punishes big errors much more than small ones. And it makes the calculus clean: the derivative of $\tfrac12u^2$ is $u$, which is why the optimal command came out as a simple $u^\star = -\lambda_2$. The weights, like $q_f$, are the designer's opinion written as numbers.
:::

::: context costate A costate is a shadow price
Think of the costate as a price tag. $\lambda_1$ says how much the final cost would go up if the sideways position were nudged by one meter. At the end, the cost is $\tfrac12 q_f x_1^2$, and nudging $x_1$ by one meter changes that by about $q_f x_1$. That is why $\lambda_1(t_{go}) = q_f\,x_1(t_{go})$. Economists call the same kind of quantity a "shadow price". In optimal control it appears as a Lagrange multiplier that is allowed to change over time.
:::

::: context q-zero Why coasting is the cheap answer
If a miss costs nothing, every push is pure expense, so the best number of pushes is zero. It sounds silly, but it is a useful check on any formula: set the price of the thing you want to zero, and the optimizer should stop trying to get it. Here both gains carry a $q_f$ on top, so they vanish as $q_f \to 0$. A formula that failed this test would have a mistake in it.
:::

::: context riccati The Riccati equation
The Riccati equation, named after the Italian mathematician Jacopo Riccati, is the engine inside every LQR design. You start at the final time with the terminal weight, $\mathbf{P}(t_f) = \mathbf{Q}_f$, and run a matrix differential equation backward. At each moment the gain is $\mathbf{B}^\top\mathbf{P}$. For this problem it can be solved by hand, and its answer is exactly $k_1$ and $k_2$. For bigger problems it is solved by computer. Rudolf Kalman's work around 1960 made LQR the standard way to design feedback from a cost.
:::

::: context trade-off-curve The knee of the curve
Plot effort across and miss up, one dot per weight $q_f$ from the example. The dots fall steeply at first and then flatten along the bottom. The bend is the knee: past it, each extra unit of effort buys almost no accuracy.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="195" y="192" font-size="11" fill="#1f2a44" text-anchor="middle">control effort (33 to 47)</text>
  <text x="20" y="95" font-size="11" fill="#1f2a44" text-anchor="middle" transform="rotate(-90 20 95)">final miss (m)</text>
  <text x="44" y="35" font-size="11" fill="#6c7a93" text-anchor="end">24</text>
  <text x="44" y="174" font-size="11" fill="#6c7a93" text-anchor="end">0</text>
  <polyline points="68,34 292,154 321,168 324,170" fill="none" stroke="#8fb8f0" stroke-width="2"/>
  <circle cx="68" cy="34" r="4" fill="#1d6fd1"/>
  <circle cx="292" cy="154" r="4" fill="#1d6fd1"/>
  <circle cx="321" cy="168" r="4" fill="#1d6fd1"/>
  <circle cx="324" cy="170" r="4" fill="#b4232c"/>
  <text x="78" y="32" font-size="11" fill="#1f2a44">weight 0.01</text>
  <text x="282" y="150" font-size="11" fill="#1f2a44" text-anchor="end">0.1</text>
  <text x="316" y="160" font-size="11" fill="#1f2a44" text-anchor="end">1</text>
  <text x="330" y="160" font-size="11" fill="#b4232c">PN</text>
</svg>
```

The dots sit at efforts $33.9$, $45.1$, $46.5$ and $46.7$ with misses $24.3$, $2.8$, $0.28$ and $0$ meters.
:::
