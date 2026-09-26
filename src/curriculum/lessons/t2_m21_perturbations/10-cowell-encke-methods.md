---
id: l10-cowell-encke-methods
title: Cowell's method and Encke's method
minutes: 23
covers:
  - Cowell and Encke methods
---

Every perturbation in this module ends up as one more term in the same equation of motion:

$$
\ddot{\mathbf{r}} = -\frac{\mu\mathbf{r}}{r^3} + \mathbf{a}_p .
$$

Read it aloud as "the acceleration equals the two-body pull plus the perturbing acceleration". Sooner or later that sum has to be stepped forward in time on a computer. In the language of the first lesson, that is **special perturbations** — numbers, not formulas.

There are two classic ways to do it, and they make opposite bets. **[[Cowell's method|who-uses-which]]** bets that simplicity wins: add up every acceleration and integrate the whole thing. **Encke's method** bets that the computer should never work hard on the part of the motion you already know exactly — the two-body ellipse — and should spend all its effort on the small part you do not know.

This lesson builds both. Then it measures them against each other on the same orbit, with the same number of steps. You will see Encke's advantage, which is real and can be enormous, and then watch it shrink as the perturbation grows, until keeping Encke accurate takes careful tuning that Cowell never needed.

## The job an integrator does

Picture a friend riding a merry-go-round while also slowly walking toward the center. You could describe her motion two ways.

You could track her full path: a fast circle, bent slightly inward each turn. That path changes direction every second, so you would need to look often to follow it.

Or you could say, "she rides the merry-go-round, which I understand perfectly, and on top of that she drifts a few steps inward." Now the only thing you need to watch is the slow drift. You can glance at it once in a while.

A numerical integrator faces the same choice. A **numerical integrator** is a recipe that takes the state now — position $\mathbf{r}$ and velocity $\mathbf{v}$ — and steps it forward by a small time $h$, the **step size**. The one used throughout this lesson is the classical fourth-order **[[Runge–Kutta method|rk4-reminder]]**, RK4, with a fixed step.

Every step makes a small error, called the **local truncation error**. It is larger when the thing being followed curves or changes quickly within one step. A fast-turning orbit forces small steps. A slow, smooth drift allows big ones. That single fact is the whole difference between the two methods.

## Cowell's method

Cowell's method is the propagator this module has used in every numerical example so far. You integrate

$$
\ddot{\mathbf{r}} = -\frac{\mu\mathbf{r}}{r^3} + \mathbf{a}_p(\mathbf{r},\mathbf{v},t)
$$

directly, with any integrator. The two-body term and every perturbation are treated the same way — as pieces of one total acceleration. Here $\mathbf{a}_p(\mathbf{r},\mathbf{v},t)$ means the perturbing acceleration, which may depend on position, velocity and time.

Its appeal is that it could not be simpler to build or extend. Adding a new force model is one more term in a sum. It puts no limit on how big $\mathbf{a}_p$ is or how eccentric the orbit is.

Its cost is that the integrator has to follow the *entire* trajectory. That includes the large, fast-turning two-body motion, which you already know exactly in closed form from the two-body module. The integrator re-derives it, step by step, only to pick out the comparatively tiny effect of $\mathbf{a}_p$ on top.

At a given step size, almost all of a fixed-step integrator's error goes into representing that fast ellipse. Only a sliver of accuracy is left for the perturbation itself. So to get the *perturbation's* effect right, you must choose a step size fine enough for the whole orbit, not for the much smaller, much smoother part that is actually unknown.

## Encke's method

Encke's method integrates only the difference between the true path and a reference two-body orbit. The integrator then only ever follows something small and slowly changing.

### The reference orbit

Fix a reference state $\mathbf{r}_{\text{ref}0}, \mathbf{v}_{\text{ref}0}$ at some epoch. (Read "r sub ref zero": the reference position at the start.) Propagate it with the **[[universal-variable and Lagrange-coefficient machinery|exact-reference]]** of the two-body module. That needs no numerical integration at all. It is exact, in closed form, for any time you ask about.

Then track the **[[deviation|deviation-picture]]**, the gap between the true position and the reference position:

$$
\boldsymbol\delta\mathbf{r} = \mathbf{r} - \mathbf{r}_{\text{ref}}(t).
$$

Read $\boldsymbol\delta\mathbf{r}$ as "delta r". It is a small vector — at first zero, then growing only as fast as the perturbation pushes the spacecraft off the ellipse.

### The deviation's equation of motion

Subtract the reference's acceleration from the true acceleration:

$$
\ddot{\boldsymbol\delta\mathbf{r}} = -\frac{\mu\mathbf{r}}{r^3} + \mathbf{a}_p - \left(-\frac{\mu\mathbf{r}_{\text{ref}}}{r_{\text{ref}}^3}\right).
$$

Computing this difference directly is dangerous. The vectors $\mathbf{r}$ and $\mathbf{r}_{\text{ref}}$ start equal and stay close. So $\mathbf{r}/r^3 - \mathbf{r}_{\text{ref}}/r_{\text{ref}}^3$ is a difference of two nearly equal vectors. That is the **[[catastrophic cancellation|catastrophic-cancellation]]** trap the universal-variables lesson warned about for the Stumpff functions: subtract two nearly equal numbers and most of your correct digits vanish.

The standard fix defines a small number $q$:

$$
q = \frac{\boldsymbol\delta\mathbf{r}\cdot(\mathbf{r}+\mathbf{r}_{\text{ref}})}{r^2},
$$

which is small whenever $\boldsymbol\delta\mathbf{r}$ is small. Then, with $u = \sqrt{1-q}$,

$$
f(q) = \frac{q\,(1+u+u^2)}{(1+u)\,u^3}, \qquad \Delta\mathbf{a}_{\text{2-body}} = \frac{\mu}{r^3}\Big[f(q)\,\mathbf{r}_{\text{ref}} - \boldsymbol\delta\mathbf{r}\Big].
$$

Here $\Delta\mathbf{a}_{\text{2-body}}$ ("delta a two-body") is the difference between the two-body pull on the true spacecraft and on the reference.

The function $f(q)$ is algebraically identical to $(1-q)^{-3/2} - 1$. The difference is how the computer evaluates it. The form $(1-q)^{-3/2} - 1$ subtracts two numbers that are both nearly $1$ when $q$ is small — and $q$ is smallest right after a reset, which is exactly when Encke runs. The rewritten $f(q)$ computes the same quantity as a product and quotient of well-behaved positive numbers, with no subtraction of similar-sized numbers anywhere.

::: note Why it has to be true
**Where $q$ comes from.** Start from $\mathbf{r}_{\text{ref}} = \mathbf{r} - \boldsymbol\delta\mathbf{r}$ and square it:

$$
r_{\text{ref}}^2 = r^2 - 2\,\boldsymbol\delta\mathbf{r}\cdot\mathbf{r} + \delta r^2 = r^2 - \boldsymbol\delta\mathbf{r}\cdot(2\mathbf{r} - \boldsymbol\delta\mathbf{r}) = r^2 - \boldsymbol\delta\mathbf{r}\cdot(\mathbf{r} + \mathbf{r}_{\text{ref}}).
$$

Divide by $r^2$: $r_{\text{ref}}^2/r^2 = 1 - q$. So $r^3/r_{\text{ref}}^3 = (1-q)^{-3/2}$.

**The two-body difference.** Pull $\mu/r^3$ out of the two gravity terms:

$$
-\frac{\mu\mathbf{r}}{r^3} + \frac{\mu\mathbf{r}_{\text{ref}}}{r_{\text{ref}}^3} = \frac{\mu}{r^3}\left[\frac{r^3}{r_{\text{ref}}^3}\mathbf{r}_{\text{ref}} - \mathbf{r}\right] = \frac{\mu}{r^3}\Big[\big((1-q)^{-3/2} - 1\big)\mathbf{r}_{\text{ref}} - \boldsymbol\delta\mathbf{r}\Big],
$$

using $\mathbf{r} = \mathbf{r}_{\text{ref}} + \boldsymbol\delta\mathbf{r}$ in the last step.

**The safe form of $f$.** Since $u^2 = 1-q$, we have $u^{-3} = (1-q)^{-3/2}$, so

$$
(1-q)^{-3/2} - 1 = \frac{1 - u^3}{u^3} = \frac{(1-u)(1+u+u^2)}{u^3}.
$$

The factor $1-u$ is itself a subtraction of nearly equal numbers. Rationalize it: $1 - u = \frac{(1-u)(1+u)}{1+u} = \frac{1-u^2}{1+u} = \frac{q}{1+u}$. Substituting gives exactly $f(q) = \frac{q(1+u+u^2)}{(1+u)u^3}$, with no dangerous subtraction left.
:::

The full deviation equation of motion is then

$$
\ddot{\boldsymbol\delta\mathbf{r}} = \frac{\mu}{r^3}\Big[f(q)\,\mathbf{r}_{\text{ref}} - \boldsymbol\delta\mathbf{r}\Big] + \mathbf{a}_p(\mathbf{r},\mathbf{v},t), \qquad \mathbf{r} = \mathbf{r}_{\text{ref}}(t) + \boldsymbol\delta\mathbf{r}.
$$

The integrator steps $\boldsymbol\delta\mathbf{r}$ and its rate forward, while $\mathbf{r}_{\text{ref}}(t)$ comes from the closed-form propagator at every evaluation.

Here is the cancellation problem, seen on a computer:

```python
import numpy as np

def f_direct(q):
    return (1 - q) ** -1.5 - 1

def f_safe(q):
    u = np.sqrt(1 - q)
    return q * (1 + u + u * u) / ((1 + u) * u**3)

for q in [1e-4, 1e-8, 1e-12]:
    print(f"q={q:.0e}  direct={f_direct(q):.15e}  safe={f_safe(q):.15e}")
# q=1e-04  direct=1.500187521876750e-04  safe=1.500187521877461e-04
# q=1e-08  direct=1.500000035292715e-08  safe=1.500000018750000e-08
# q=1e-12  direct=1.499911306268586e-12  safe=1.500000000001875e-12
```

For small $q$ the true value is very close to $1.5q + 1.875q^2$. The safe form nails it every time. The direct form is already wrong in the eighth digit at $q = 10^{-8}$, and in the fifth digit at $q = 10^{-12}$.

::: example One evaluation of the Encke correction
Take a reference position on the $x$-axis at $550\,\mathrm{km}$ altitude, $\mathbf{r}_{\text{ref}} = (6928.137,\ 0,\ 0)\,\mathrm{km}$, and a small deviation $\boldsymbol\delta\mathbf{r} = (1,\ 0.5,\ 0)\,\mathrm{km}$. Use $\mu = 398\,600.4418\,\mathrm{km^3/s^2}$.

**Step 1: the true position.** Add the two vectors: $\mathbf{r} = (6929.137,\ 0.5,\ 0)\,\mathrm{km}$. Its length squared is $r^2 = 6929.137^2 + 0.5^2 = 48\,012\,939.8\,\mathrm{km^2}$, so $r = 6929.137\,\mathrm{km}$.

**Step 2: the dot product.** $\mathbf{r} + \mathbf{r}_{\text{ref}} = (13\,857.274,\ 0.5,\ 0)$. Dot it with $\boldsymbol\delta\mathbf{r}$: $1 \times 13\,857.274 + 0.5 \times 0.5 = 13\,857.524\,\mathrm{km^2}$.

**Step 3: $q$.** Divide by $r^2$: $q = 13\,857.524 / 48\,012\,939.8 = 2.886\times10^{-4}$. Small, as promised.

**Step 4: $f(q)$.** $u = \sqrt{1 - 2.886\times10^{-4}} = 0.999\,855\,68$. Then $f(q) = 4.3309\times10^{-4}$. Sanity check: $1.5q = 4.329\times10^{-4}$, very close, as it should be for small $q$.

**Step 5: the bracket.** $f(q)\,\mathbf{r}_{\text{ref}} = (3.0005,\ 0,\ 0)\,\mathrm{km}$. Subtract $\boldsymbol\delta\mathbf{r}$: $(2.0005,\ -0.5,\ 0)\,\mathrm{km}$.

**Step 6: multiply by $\mu/r^3$.** $\mu/r^3 = 1.19812\times10^{-6}\,\mathrm{s^{-2}}$, so

$$
\Delta\mathbf{a}_{\text{2-body}} = (2.397\times10^{-6},\ -5.99\times10^{-7},\ 0)\,\mathrm{km/s^2} = (2.40\times10^{-3},\ -5.99\times10^{-4},\ 0)\,\mathrm{m/s^2}.
$$

**Does it make sense?** Being $1\,\mathrm{km}$ farther out, the spacecraft feels slightly weaker gravity than the reference, so relative to the reference it is pulled *outward*: $+x$. The size should be about $2 \times (1/6929) \times 8.30\,\mathrm{m/s^2} = 2.40\times10^{-3}\,\mathrm{m/s^2}$, where $8.30\,\mathrm{m/s^2}$ is the full two-body pull there. It matches. Being $0.5\,\mathrm{km}$ off to the side, gravity tilts it back toward the reference: $-y$, of size $8.30 \times 0.5/6929 = 5.99\times10^{-4}\,\mathrm{m/s^2}$. It matches too. The whole correction is a few thousandths of a $\mathrm{m/s^2}$ — tiny next to $8.30$, which is exactly what makes it easy to integrate.
:::

### Rectification

Because $\boldsymbol\delta\mathbf{r}$ starts at zero and grows only as fast as the perturbation pushes it, it stays small and smooth for a while. That is exactly the kind of quantity a coarse-step integrator handles well.

But it keeps growing. Eventually the reference ellipse is no longer a good description of where the spacecraft is, and the "small deviation" is not small. At that point you **[[rectify|rectify-sawtooth]]** — reset the reference to the current true state:

1. Set $\mathbf{r}_{\text{ref}0}, \mathbf{v}_{\text{ref}0}$ to the current true position and velocity.
2. Restart the reference epoch at the current time.
3. Continue with $\boldsymbol\delta\mathbf{r} = \mathbf{0}$ and zero deviation velocity.

::: key Cowell vs Encke
**Cowell** integrates the total acceleration $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3 + \mathbf{a}_p$ directly — simple, general, and demanding on step size, because the integrator must resolve the full two-body motion.

**Encke** integrates only the *deviation* $\boldsymbol\delta\mathbf{r} = \mathbf{r} - \mathbf{r}_{\text{ref}}(t)$ from a reference conic, with $\mathbf{r}_{\text{ref}}(t)$ from an exact closed-form propagation and the cancellation-safe $f(q)$ correcting for the reference's own two-body acceleration. The integrator sees a small quantity and can take larger steps, at the cost of periodic rectification.
:::

## Head to head: a weak perturbation

Now the measurement. How much does Encke's bet actually pay?

::: example Cowell and Encke at the same step count, under J2 alone
**Setup.** A $550\,\mathrm{km}$ orbit with eccentricity $e = 0.01$ and inclination $i = 51.6^\circ$, under $J_2$ alone. Propagate $10$ orbits with fixed-step RK4. Encke rectifies once per orbit. Compare each method's final position against a reference run made with a high-accuracy adaptive integrator at a very tight tolerance, which stands in for the truth.

| Steps/orbit | Total steps | Cowell error | Encke error (rectify once/orbit) | Ratio |
| --- | --- | --- | --- | --- |
| $10$ | $100$ | $6.7\times10^5\,\mathrm{km}$ | $437\,\mathrm{km}$ | $1526\times$ |
| $20$ | $200$ | $1935\,\mathrm{km}$ | $28.5\,\mathrm{km}$ | $68\times$ |
| $40$ | $400$ | $61.9\,\mathrm{km}$ | $1.82\,\mathrm{km}$ | $34\times$ |
| $80$ | $800$ | $2.12\,\mathrm{km}$ | $0.115\,\mathrm{km}$ | $18.4\times$ |
| $160$ | $1600$ | $0.078\,\mathrm{km}$ | $0.0072\,\mathrm{km}$ | $11\times$ |

**Reading the first row.** Cowell's error is $6.7\times10^5\,\mathrm{km}$. The orbit's diameter is only about $2 \times 6928 \approx 13\,900\,\mathrm{km}$, so Cowell has completely diverged — the answer is meaningless. With the same $100$ steps, Encke is off by $437\,\mathrm{km}$. That is bad, but it is still an orbit. The ratio is $667\,000 / 437 \approx 1526$.

**Reading down the table.** Doubling the steps shrinks both errors a lot. RK4's error falls roughly like $h^4$, so each doubling should cut it about $2^4 = 16$ times once the step is fine enough. From $80$ to $160$ steps per orbit, Cowell's error drops $2.12/0.078 \approx 27$ times and Encke's $0.115/0.0072 \approx 16$ times — in the right range.

**The ratio shrinks too.** It falls from over a thousand toward ten. Encke's advantage is largest exactly where it is most needed: at coarse steps, the ones a mission would like to use for a long propagation. Once the step is fine enough that Cowell is doing well on its own, the advantage is less decisive.
:::

## Turning up the perturbation

Everything above used $J_2$ alone, with one rectification per orbit — ten in a ten-orbit run, which costs almost nothing. Now keep the budget fixed at $800$ steps over $10$ orbits and the rectification at once per orbit. Add a **[[synthetic drag term|synthetic-drag]]** whose strength is dialed up compared with $J_2$. (Its form is the usual $-k\,v_{\text{rel}}\mathbf{v}_{\text{rel}}$ against the rotating air, with $k$ set so the drag-to-$J_2$ ratio at the start takes the value in the first column.)

| $\lVert a_{\text{drag}}\rVert/\lVert a_{J_2}\rVert$ | Cowell error | Encke error | Ratio |
| --- | --- | --- | --- |
| $0$ ($J_2$ only) | $2.12\,\mathrm{km}$ | $0.115\,\mathrm{km}$ | $18.4\times$ |
| $0.02$ | $2.14\,\mathrm{km}$ | $0.126\,\mathrm{km}$ | $17.0\times$ |
| $0.23$ | $2.40\,\mathrm{km}$ | $0.239\,\mathrm{km}$ | $10.0\times$ |
| $1.14$ | $4.51\,\mathrm{km}$ | $1.69\,\mathrm{km}$ | $2.7\times$ |
| $4.55$ | $643\,\mathrm{km}$ | $1844\,\mathrm{km}$ | $0.35\times$ |

The last row is worth sitting with. Once drag is about four and a half times $J_2$, Encke — using the *exact same* once-per-orbit schedule that worked so well for $J_2$ alone — is now **worse** than Cowell. A ratio of $0.35$ means Encke's error is about three times Cowell's.

Why? The deviation $\boldsymbol\delta\mathbf{r}$ now grows too fast between rectifications. The reference orbit goes stale long before the next scheduled reset. By then $\boldsymbol\delta\mathbf{r}$ is no longer small or smooth, and the coarse RK4 steps cannot follow it. Encke is paying for a cleverness it is no longer delivering.

::: example Tightening the rectification schedule
Same drag level ($4.55\times J_2$), same $800$-step budget, Cowell still at $643\,\mathrm{km}$. Now rectify more often:

| Rectify every (steps) | Rectifications | Encke error | Cowell/Encke |
| --- | --- | --- | --- |
| $80$ (once/orbit) | $10$ | $1844\,\mathrm{km}$ | $0.35\times$ |
| $40$ | $20$ | $441\,\mathrm{km}$ | $1.5\times$ |
| $20$ | $40$ | $70.7\,\mathrm{km}$ | $9.1\times$ |
| $10$ | $80$ | $0.234\,\mathrm{km}$ | $2749\times$ |
| $5$ | $160$ | $3.63\,\mathrm{km}$ | $177\times$ |
| $1$ (every step) | $800$ | $7.31\,\mathrm{km}$ | $88\times$ |

**The first few rows.** Halving the interval from $80$ to $40$ steps cuts the error $1844/441 \approx 4.2$ times. Halving again cuts it $441/70.7 \approx 6.2$ times. At every $10$ steps — ten times per orbit — the error is down to $0.234\,\mathrm{km}$, and Encke beats Cowell by about $2750$ times ($643$ divided by $0.234$).

**The last rows.** Rectifying *more* often does not keep helping. At every $5$ steps the error rises to $3.63\,\mathrm{km}$. At every single step it is $7.31\,\mathrm{km}$ — still $88$ times better than Cowell, but about $31$ times worse than the best schedule.

**Why more is not better.** Encke's error has two sources. One is the growth of $\boldsymbol\delta\mathbf{r}$ between resets, which rectification removes. The other is the integrator's error in following how $\mathbf{a}_p$ itself changes along the orbit within each step. Rectification cannot touch that second source — it is set by the step size alone. Once resets are frequent, the first source is gone and the error settles onto the floor set by the second. The unusually low value at every $10$ steps is partly luck: there the two sources happen to partly cancel, and a slightly different drag level moves the sweet spot. (A rerun of the $J_2$-only case shows the same pattern in miniature: best near every $20$ steps, a little worse at every step.) Each reset also costs one extra closed-form solve — small, but not free.
:::

Put the tables together and the honest summary is this. Encke's edge is real, large and measured for a weak, slowly evolving perturbation with a sensible, infrequent rectification schedule. As the perturbation grows, the advantage shrinks, but you can win it back by rectifying more often. How often is right depends on the case, and beyond a certain point tightening the schedule stops paying at all. Get the schedule wrong in the loose direction, and Encke silently loses to plain Cowell.

::: warning Choosing a rectification interval requires knowing what you are propagating
There is no universal "rectify every $N$ orbits" rule. The right interval depends on how fast the *current* perturbation grows the deviation, and that can change during a mission: a satellite's drag grows as it sinks into denser air, the lifetime scenario of the drag lesson. A propagator built with a fixed schedule, tuned for the perturbation level at the start of a mission, can slide into the "Encke loses to Cowell" regime as conditions change. The fix is to tie the rectification trigger to a measured quantity — the size of $\boldsymbol\delta\mathbf{r}$ itself, or the value of $q$ — rather than to a fixed step count.
:::

## Check yourself

::: check
Explain, without quoting any numbers, why Cowell's method needs a finer step size than Encke's to reach the same accuracy on a weakly perturbed orbit.
:::

::: answer
Cowell's integrator has to follow the entire trajectory, including the large, fast-turning two-body motion. A fixed-step method's local error is larger when the thing it follows changes quickly within a step, so the fast ellipse eats most of the error budget.

Encke's integrator only follows the deviation from a reference two-body orbit. By construction that deviation starts at zero and grows only as fast as the weak perturbation pushes it — a much smaller, much more slowly changing quantity. So the same step size gives Encke a far smaller error. Equivalently, Encke can use a much coarser step for the same accuracy.
:::

::: check
Why is $f(q) = (1-q)^{-3/2} - 1$ evaluated through the $u = \sqrt{1-q}$ rewrite rather than directly, even though the two expressions are algebraically identical?
:::

::: answer
Encke's method works where $q$ is small, because $q$ is built from the small deviation $\boldsymbol\delta\mathbf{r}$. For small $q$, the direct form subtracts two numbers both very close to $1$, and most of the correct digits cancel — the same failure the universal-variables lesson found in the naive Stumpff-function formulas. The printout above shows it: at $q = 10^{-12}$ the direct form is wrong in the fifth digit.

The rewrite rationalizes the troublesome factor, $1 - u = q/(1+u)$, so the whole expression is built from products, sums and quotients of well-behaved positive numbers. It stays accurate as $q \to 0$, exactly where the direct formula is weakest.
:::

::: check
A ten-orbit propagation shows Cowell and Encke reaching nearly the same small error once the step count is made very fine. Does this mean Encke's method has stopped being useful at fine step sizes?
:::

::: answer
Not useful in the same way. At a fine enough step, both methods follow the two-body motion well, so Cowell's extra burden — representing the whole fast orbit numerically — is no longer the main source of error. The accuracy gap narrows, as the first table shows: the ratio falls from $1526\times$ at $10$ steps per orbit to about $11\times$ at $160$.

Encke can still be preferred there for other reasons. For example, over very many orbits, its larger allowable step for a given accuracy can cut the total computation. But its *accuracy* advantage specifically is largest at coarse steps and shrinks once both methods are already accurate.
:::

::: check
A propagator uses Encke's method with a fixed once-per-orbit rectification schedule, tuned during testing on a $J_2$-only orbit. The mission later adds a high-drag phase before re-entry. What failure should the team expect if the schedule is not changed?
:::

::: answer
Encke's accuracy will degrade, and it may become worse than plain Cowell at the same step count. That is exactly the crossover measured in this lesson: with drag at $4.55$ times $J_2$ and the schedule fixed at once per orbit, Encke's error was $1844\,\mathrm{km}$ against Cowell's $643\,\mathrm{km}$.

The reason is that the deviation from the reference grows much faster once strong drag is present. A schedule tuned for the gentle $J_2$-only case lets the deviation grow far past the point where it is small and smooth enough for the coarse steps to follow. The cure is to rectify when $\lVert\boldsymbol\delta\mathbf{r}\rVert$ or $q$ passes a threshold, not on a fixed clock.
:::

::: check
Why does rectifying on every single integration step not give Encke's method its best accuracy, even though it keeps the deviation as small as possible at every step?
:::

::: answer
Rectification only removes one of Encke's two error sources: the growth of the deviation between resets. The other source is the integrator's error in following how the perturbing acceleration itself changes along the orbit within one step, and that is set by the step size, not by the reset schedule. Once resets are frequent, the first source is gone and the error sits on the floor set by the second — in the measured case, $7.31\,\mathrm{km}$ at every step.

The much lower error at every $10$ steps ($0.234\,\mathrm{km}$) came partly from the two error sources happening to cancel there, which is why the best interval moves when the case changes. Each reset also costs an extra closed-form solve. So the curve is not "more rectification is always better": it improves steeply at first, then flattens or even rises.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Cowell | Integrate $\ddot{\mathbf{r}} = -\mu\mathbf{r}/r^3 + \mathbf{a}_p$ directly; simple, general, step size set by the whole orbit |
| Encke | Integrate $\boldsymbol\delta\mathbf{r} = \mathbf{r} - \mathbf{r}_{\text{ref}}(t)$; step size set by the small deviation; needs periodic rectification |
| $q = \boldsymbol\delta\mathbf{r}\cdot(\mathbf{r}+\mathbf{r}_{\text{ref}})/r^2$, $f(q) = q(1+u+u^2)/[(1+u)u^3]$, $u = \sqrt{1-q}$ | Cancellation-safe form of $(1-q)^{-3/2} - 1$, correcting for the reference's own two-body pull |
| $\ddot{\boldsymbol\delta\mathbf{r}} = \frac{\mu}{r^3}[f(q)\mathbf{r}_{\text{ref}} - \boldsymbol\delta\mathbf{r}] + \mathbf{a}_p$ | Encke's equation of motion for the deviation |
| Rectify | Reset the reference to the current true state and set $\boldsymbol\delta\mathbf{r} = \mathbf{0}$ |
| Weak perturbation ($J_2$ only) | Encke beats Cowell by about $10$–$1500\times$ at the same step count, most at coarse steps |
| Growing perturbation, fixed schedule | Encke's advantage shrinks and can invert (Encke worse than Cowell) once the reference goes stale between resets |
| Recovering accuracy | Rectify more often; past a point it stops helping, because the remaining error is set by the step size |
| Trigger on $\lVert\boldsymbol\delta\mathbf{r}\rVert$ or $q$ | Safer than a fixed rectification clock when conditions change |

The next lesson turns to the general-perturbations side of the same coin: SGP4, the compact analytic theory behind every publicly distributed satellite element set, and why its elements must never be treated as an ordinary osculating state.

::: context who-uses-which Where these names come from, and what is used today
Johann Franz Encke, a German astronomer, developed his method in the mid-1800s, when every step was done by hand. Saving steps meant saving weeks of human computing, so integrating only a small deviation was a huge win.

Philip Cowell and Andrew Crommelin used direct integration in the early 1900s to predict the 1910 return of Halley's comet. With electronic computers, the balance tipped back toward simplicity. Today most high-precision orbit software uses Cowell's formulation with high-order, variable-step integrators. Encke's idea lives on wherever a trajectory stays close to a known reference.
:::

::: context rk4-reminder What RK4 does in one step
RK4 looks at the slope four times per step: once at the start, twice at the middle (each time using a better guess of where you will be), and once at the end. It then takes a weighted average, $\tfrac{1}{6}(k_1 + 2k_2 + 2k_3 + k_4)$, and steps forward with it.

The payoff is accuracy that improves fast as the step shrinks. The error over a whole run falls roughly like $h^4$, so halving the step cuts the error about $16$ times. That is why the first table's errors drop so steeply between rows. The numerical-methods module built RK4 from scratch.
:::

::: context exact-reference The reference costs no integration
The two-body module solved the unperturbed problem completely. Given a position and velocity at one time, the universal-variable Kepler solver and the Lagrange coefficients $f$, $g$, $\dot f$, $\dot g$ give the position and velocity at any other time:

$$
\mathbf{r}(t) = f\,\mathbf{r}_0 + g\,\mathbf{v}_0, \qquad \mathbf{v}(t) = \dot f\,\mathbf{r}_0 + \dot g\,\mathbf{v}_0.
$$

No stepping, and no accumulated error. (These $f$ and $g$ are the Lagrange coefficients — a different $f$ from Encke's $f(q)$.) That is what makes Encke possible: the big, fast part of the motion is handed to a formula that is exact at every instant, and only the leftover is integrated.
:::

::: context deviation-picture What Encke actually integrates
The reference ellipse comes from a formula. The true path peels slowly away from it. Encke integrates only the short arrow between them, $\boldsymbol\delta\mathbf{r}$, and gets the true position by adding it back: $\mathbf{r} = \mathbf{r}_{\text{ref}} + \boldsymbol\delta\mathbf{r}$. The gap is drawn hugely exaggerated here so you can see it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="40" cy="195" r="24" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="69.5,27.6 76.8,29.0 84.0,30.8 91.1,32.9 98.1,35.3 105.1,37.9 111.8,40.9 118.5,44.2 125.0,47.8 131.3,51.6 137.5,55.7 143.5,60.1 149.3,64.8 154.9,69.7 160.2,74.8 165.3,80.1 170.2,85.7 174.9,91.5 179.3,97.5 183.4,103.7 187.2,110.0 190.8,116.5 194.1,123.2 197.1,129.9 199.7,136.9 202.1,143.9 204.2,151.0 206.0,158.2 207.4,165.5 208.5,172.8 209.4,180.2" fill="none" stroke="#6c7a93" stroke-width="2" stroke-dasharray="6,4"/>
  <polyline points="69.5,27.6 76.5,30.3 83.3,33.4 89.9,36.7 96.3,40.3 102.5,44.1 108.5,48.2 114.2,52.5 119.7,57.0 124.9,61.7 129.9,66.7 134.6,71.8 139.0,77.0 143.1,82.4 147.0,88.0 150.6,93.7 153.9,99.4 156.9,105.3 159.6,111.3 162.0,117.3 164.1,123.3 166.0,129.4 167.5,135.6 168.7,141.7 169.7,147.8 170.3,153.9 170.7,160.0 170.8,166.0 170.7,172.0 170.2,177.9 169.5,183.7" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="40" y1="195" x2="187.2" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="40" y1="195" x2="164.1" y2="123.3" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="187.2" y1="110" x2="167.5" y2="121.4" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="164.1,123.3 170.8,116.5 173.3,121.0" fill="#b4232c"/>
  <circle cx="187.2" cy="110" r="3" fill="#6c7a93"/>
  <circle cx="164.1" cy="123.3" r="3" fill="#1d6fd1"/>
  <text x="192" y="100" font-size="12" fill="#b4232c">δr</text>
  <text x="222" y="60" font-size="11" fill="#6c7a93">reference ellipse:</text>
  <text x="222" y="74" font-size="11" fill="#6c7a93">exact formula</text>
  <text x="222" y="170" font-size="11" fill="#1d6fd1">true path =</text>
  <text x="222" y="184" font-size="11" fill="#1d6fd1">reference + δr</text>
  <text x="40" y="199" font-size="11" fill="#1f2a44" text-anchor="middle">Earth</text>
  <text x="222" y="212" font-size="11" fill="#1f2a44">(gap not to scale)</text>
</svg>
```

Right after a rectification the two curves touch, $\boldsymbol\delta\mathbf{r} = \mathbf{0}$, and the gap starts growing again.
:::

::: context catastrophic-cancellation Losing digits by subtracting
A computer stores about $16$ significant digits of any number. Suppose two numbers agree in their first $12$ digits: $1.000000000001234$ and $1.000000000000000$. Their difference is $1.234\times10^{-12}$, but only the last four digits of each number took part — the difference has at most four correct digits, not sixteen. Any rounding in the last digits of the inputs is now a large fraction of the answer.

That is catastrophic cancellation. It is not a bug in the computer; it is what subtraction of nearly equal numbers does. The cure is always the same: rearrange the algebra so the subtraction happens on paper, not in the machine — exactly what the $f(q)$ rewrite does.
:::

::: context rectify-sawtooth The deviation's life between resets
"Rectify" comes from Latin for "to make straight" or "set right". In Encke's method it means throwing the stale reference away and starting a fresh one on the current true state.

The size of $\boldsymbol\delta\mathbf{r}$ therefore traces a sawtooth: it grows from zero, is reset to zero, and grows again. The picture below is a sketch of the shape, not measured data.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="345" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M40,130 Q100,128 115,70 L115,130 Q175,128 190,70 L190,130 Q250,128 265,70 L265,130 Q325,128 340,70" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="40" y1="70" x2="345" y2="70" stroke="#b4232c" stroke-width="1.2" stroke-dasharray="5,4"/>
  <text x="343" y="62" font-size="11" fill="#b4232c" text-anchor="end">too big: reset</text>
  <text x="115" y="148" font-size="11" fill="#1f2a44" text-anchor="middle">rectify</text>
  <text x="190" y="148" font-size="11" fill="#1f2a44" text-anchor="middle">rectify</text>
  <text x="265" y="148" font-size="11" fill="#1f2a44" text-anchor="middle">rectify</text>
  <text x="192" y="165" font-size="11" fill="#1f2a44" text-anchor="middle">time</text>
  <text x="30" y="30" font-size="12" fill="#1f2a44" text-anchor="end">|δr|</text>
</svg>
```

Rectifying when the curve hits a threshold, rather than on a fixed clock, is the adaptive trigger the warning recommends.
:::

::: context synthetic-drag A stress test, not a real satellite
Real drag at $550\,\mathrm{km}$ is roughly $10^{-8}$ to $10^{-6}\,\mathrm{m/s^2}$, while $J_2$ there is about $10^{-2}\,\mathrm{m/s^2}$. So real drag is somewhere between a millionth and a ten-thousandth of $J_2$ — nowhere near the ratios in the table.

The drag here is deliberately exaggerated to make the deviation grow fast. It is strong enough that, in the rows at $1.14$ and $4.55$, the simulated spacecraft would have spiraled down into Earth within the ten orbits (the test treats Earth as a point, so the numbers still run). Treat the table as a test of the numerics — how each method copes with a fast-growing deviation — not as a prediction about any real spacecraft.
:::
