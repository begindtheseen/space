---
id: l01-root-finding
title: Root finding with brentq, newton, fsolve and root
minutes: 24
covers:
  - 'scipy.optimize: brentq, root, fsolve, newton'
---

Think of the game where a friend picks a number between 1 and 100 and you guess. After each guess they say "too high" or "too low". You would never guess 1, then 2, then 3. You guess 50, then 25 or 75, and you cut the range in half every time. Seven guesses are always enough. You win because every answer tells you which side the secret is on.

A lot of engineering is that game. You have an equation you cannot rearrange by hand, and you want the number that makes it true. The trick is to move everything to one side, so the question becomes "where does this function equal zero?" A value that makes a function zero is called a **root** — the spot where the graph of the function crosses the horizontal axis. Finding it by clever guessing is called **root finding**.

The most famous equation of this kind in spaceflight is **[[Kepler's equation|kepler-equation]]**. It tells you where a satellite is along its oval orbit at a given time. It has no answer you can write down with algebra, so every orbit program on Earth solves it by guessing well. In this lesson you will meet the four tools SciPy gives you for the job — `brentq`, `newton`, `fsolve` and `root` — see how each one guesses, and learn which one to pick.

## A root is where the function crosses zero

Suppose you want $x$ with $x^3 = 10$. Move the $10$ across and name the left-hand side:

$$
f(x) = x^3 - 10.
$$

Now "solve $x^3 = 10$" and "find where $f(x) = 0$" are the same question. Read $f(x)$ aloud as "f of x": the value the function $f$ gives back when you feed it $x$. Every root finder in SciPy wants its problem in this shape: a Python function that takes a guess and returns a number that is zero at the answer.

That returned number has a name. It is the **residual** — how far the equation is from being true at your current guess. A residual of $0.3$ means "not there yet". A residual of $10^{-15}$ means "as close as a computer can get".

### Kepler's equation in root form

An orbit is an ellipse, a stretched circle. How stretched it is, is the **eccentricity** $e$: $e = 0$ is a perfect circle, and values close to $1$ are long thin ovals. A satellite does not move around the ellipse at a steady speed. It races near the closest point, called **periapsis**, and dawdles far away.

Two angles describe where it is. Both are measured in radians from periapsis, and both have odd old names from astronomy, where an angle was called an **[[anomaly|anomaly-word]]**:

- the **mean anomaly** $M$ (read "capital M") grows steadily with time, like the hand of a clock. One full orbit adds $2\pi$ to it. If the orbit takes a time $T$ (the **period**), then after a time $t$ past periapsis, $M = 2\pi t / T$;
- the **eccentric anomaly** $E$ (read "capital E") is the angle that actually tells you the position. From $E$ you get the distance from Earth's center, $r = a(1 - e\cos E)$, where $a$ is the orbit's **semi-major axis**, half its longest width.

Kepler's equation links them:

$$
M = E - e \sin E.
$$

Going from $E$ to $M$ is easy: plug in and compute. Going from $M$ to $E$, which is what you need to find a satellite at a given time, is the hard direction. $E$ appears both on its own and inside a sine, and no amount of algebra gets it alone. So write it in root form:

$$
f(E) = E - e \sin E - M.
$$

For a given $M$ and $e$, the $E$ that makes $f(E) = 0$ is the answer.

## Trapping a root between two points

Here is the idea behind the guessing game, stated for functions. If a smooth, unbroken function is negative at one point $a$ and positive at another point $b$, then somewhere between them it must cross zero. It cannot get from below the axis to above it without passing through. When $f(a)$ and $f(b)$ have opposite signs, we say $[a, b]$ is a **bracket** — two points with a **[[sign change|sign-change]]** between them, so a root is trapped inside.

The simplest way to use a bracket is **bisection**. Look at the middle point $m = (a + b)/2$. Check the sign of $f(m)$. Whichever half still has a sign change keeps the root, so throw the other half away. Repeat. Each step halves the bracket.

Try it on Kepler's equation with $e = 0.5$ and $M = 1$. At $E = 0$, $f = 0 - 0 - 1 = -1$, which is negative. At $E = 2\pi \approx 6.2832$, $f = 2\pi - 0 - 1 \approx 5.28$, which is positive. So $[0, 2\pi]$ is a bracket. Now halve it:

| Step | $a$ | $b$ | middle $m$ | $f(m)$ | keep |
|---|---|---|---|---|---|
| 0 | 0 | 6.2832 | 3.1416 | +2.1416 | left half |
| 1 | 0 | 3.1416 | 1.5708 | +0.0708 | left half |
| 2 | 0 | 1.5708 | 0.7854 | −0.5682 | right half |
| 3 | 0.7854 | 1.5708 | 1.1781 | −0.2838 | right half |
| 4 | 1.1781 | 1.5708 | 1.3744 | −0.1159 | right half |
| 5 | 1.3744 | 1.5708 | 1.4726 | −0.0250 | right half |

After six steps the root is somewhere in $[1.4726, 1.5708]$. Bisection can never fail once you have a bracket, and that is its great strength. Its weakness is speed: each step buys about one third of a decimal digit, because halving is only a factor of 2. Getting 15 correct digits takes about 50 steps.

## brentq: bisection's safety, with better guesses

`scipy.optimize.brentq` keeps a bracket at all times, so it can never lose the root. But instead of always stepping to the middle, it tries a smarter guess first. It draws a straight line or a gentle curve through the last few points it has seen and jumps to where that line crosses zero. If the smart guess lands somewhere sensible, it takes it. If not, it falls back to a bisection step. The method is named after **[[Richard Brent|brent-history]]**, who published it in 1973. The "q" stands for the quadratic curve it sometimes fits.

```python
import numpy as np
from scipy.optimize import brentq

e, M = 0.5, 1.0

def f(E):
    return E - e * np.sin(E) - M

E, info = brentq(f, 0.0, 2 * np.pi, full_output=True)
print(round(E, 10))            # 1.4987011335
print(info.iterations)         # 9
print(abs(f(E)) < 1e-15)       # True
```

The call is `brentq(f, a, b)`: the function, then the two ends of the bracket. Nine steps gave an answer good to the last digit, where bisection needed about fifty. With `full_output=True` it also hands back an information object, which is how you see the step count.

::: key
brentq when you can bracket a sign change in one dimension: it is guaranteed to converge and needs no derivative.
:::

Two more settings decide when `brentq` stops. `xtol` is an absolute tolerance on $E$, and `rtol` is a relative one. It stops when the bracket is narrower than about `xtol + rtol * abs(E)`. The defaults are already tight, but for "solve to **[[machine precision|machine-epsilon]]**" you set both as small as SciPy allows: `xtol=1e-15` and `rtol=8.9e-16`. SciPy refuses an `rtol` below four times the spacing of floating-point numbers near 1, which is about $8.88 \times 10^{-16}$, because no answer can be pinned down finer than that.

::: warning Check the bracket before you trust it
If $f(a)$ and $f(b)$ have the same sign, `brentq` stops at once with `ValueError: f(a) and f(b) must have different signs`. That error is a gift: it means your bracket was wrong, not that the solver is broken. The fix is to find a real sign change, not to widen the interval at random. Note also that a root where the graph only touches the axis without crossing (like $x^2$ at $0$) has no sign change, so bracketing methods cannot see it.
:::

### Why $[0, 2\pi]$ always brackets Kepler

First reduce $M$ into one revolution, $0 \le M < 2\pi$. Then:

- $f(0) = 0 - 0 - M = -M$, which is zero or negative;
- $f(2\pi) = 2\pi - 0 - M$, which is positive because $M < 2\pi$.

So the sign changes across $[0, 2\pi]$ for every orbit with $0 \le e < 1$. Better still, the slope of $f$ is $f'(E) = 1 - e\cos E$. Read $f'(E)$ as "f prime of E": the slope of the graph at $E$. Because $e < 1$ and $\cos E \le 1$, that slope is always positive. The function only ever climbs, so it crosses zero exactly once. There is one answer, and the bracket holds it.

(When $M = 0$ exactly, $f(0) = 0$ and the root sits right on the edge. Pushing the left end a hair below zero, to $-10^{-12}$, keeps a strict sign change even then.)

Reducing $M$ is one line of NumPy. A satellite that has done three and a bit laps has a big $M$, but the extra whole laps do not change where it is on the ellipse:

```python
import numpy as np

M = 2 * np.pi * 3 + 1.25           # three full laps plus 1.25 rad
k = np.floor(M / (2 * np.pi))      # whole laps
M_reduced = M - k * 2 * np.pi
print(k, round(M_reduced, 4))      # 3.0 1.25
```

`np.floor` rounds down to a whole number, so it counts the complete laps. Solve with the reduced value, then add `k * 2 * np.pi` back onto the $E$ you find, so that your $E$ matches the original $M$ lap for lap.

::: example Where is a Molniya satellite one hour after perigee?
A Molniya communications orbit has eccentricity $e = 0.74$, semi-major axis $a \approx 26{,}600\,\mathrm{km}$ and a period of half a sidereal day, $T = 43{,}082\,\mathrm{s}$. How far from Earth's center is the satellite $t = 3{,}600\,\mathrm{s}$ after perigee (periapsis for an Earth orbit)?

**Step 1: the mean anomaly.** The clock-hand angle is the fraction of the orbit done, times $2\pi$:

$$
M = 2\pi \times \frac{3600}{43082} \approx 0.525\,\mathrm{rad}.
$$

**Step 2: solve for $E$.** $M$ is already inside one lap, so bracket with $[0, 2\pi]$:

```python
import numpy as np
from scipy.optimize import brentq

e, a = 0.74, 26600.0                 # -, km
M = 2 * np.pi * 3600.0 / 43082.0
E = brentq(lambda E: E - e * np.sin(E) - M, 0.0, 2 * np.pi,
           xtol=1e-15, rtol=8.9e-16)
r = a * (1 - e * np.cos(E))
print(round(M, 4), round(E, 4))      # 0.525 1.22
print(round(r))                      # 19835
```

So $E \approx 1.22\,\mathrm{rad}$, about $69.9°$. It is much larger than $M$: the satellite has swept a big angle quickly, because it moves fastest near perigee.

**Step 3: the distance.** $r = a(1 - e\cos E) \approx 19{,}800\,\mathrm{km}$.

**Sanity check.** Perigee distance is $a(1 - e) \approx 6{,}920\,\mathrm{km}$ and apogee is $a(1 + e) \approx 46{,}300\,\mathrm{km}$. One hour in, the satellite has climbed a good way out but is still far below apogee. That fits a 12-hour orbit that spends most of its time high up.
:::

## newton: fast, if you start close

Now a different kind of guessing. Stand on the graph of $f$ at your guess $x_0$ (read "x nought", the starting guess). Lay a ruler along the curve there, so it touches the curve and has the same slope. That ruler line is the **[[tangent|newton-tangent]]**. Follow it down to where it hits zero, and call that your next guess. Near a root, a smooth curve looks almost straight, so the tangent's zero is very close to the curve's zero.

The tangent at $x_n$ has height $f(x_n)$ and slope $f'(x_n)$. It reaches zero after a sideways step of $f(x_n)/f'(x_n)$. So the next guess is

$$
x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}.
$$

This is **Newton's method**. Read $x_{n+1}$ as "x sub n plus one", the guess after $x_n$.

For Kepler, $f'(E) = 1 - e\cos E$. Starting at $E_0 = M = 1$ with $e = 0.5$, here is how far each guess is from being a root:

| Guess | $E$ | residual $f(E)$ |
|---|---|---|
| 1 | 1.576469 | $7.6 \times 10^{-2}$ |
| 2 | 1.500208 | $1.5 \times 10^{-3}$ |
| 3 | 1.498702 | $5.7 \times 10^{-7}$ |
| 4 | 1.4987011335179 | $8.6 \times 10^{-14}$ |

Look at the residual column. Once it gets close, the number of correct digits roughly *doubles* every step. That is called **[[quadratic convergence|quadratic-convergence]]**, and it is why Newton's method is the fastest tool here when it works.

SciPy's version is `scipy.optimize.newton(f, x0, fprime=...)`. You give it the function, one starting guess (not a bracket), and optionally the derivative:

```python
import numpy as np
from scipy.optimize import newton

e, M = 0.5, 1.0
f = lambda E: E - e * np.sin(E) - M
fprime = lambda E: 1 - e * np.cos(E)

print(round(newton(f, M, fprime=fprime), 10))    # 1.4987011335
```

If you leave out `fprime`, `newton` estimates the slope from its last two guesses instead. That variant is called the **secant method**. It is a bit slower, but needs no derivative.

::: key
newton when you have a good initial guess and a derivative, for speed.
:::

### What can go wrong

Newton's method has no bracket. Nothing holds it near the root. If the tangent is nearly flat, $f'(x_n)$ is tiny, and dividing by it sends the next guess a very long way off.

A classic case is $f(x) = \arctan x$, whose only root is $x = 0$. Start at $x_0 = 1.5$ and the guesses go $-1.69$, $2.32$, $-5.11$, $32.3$, $-1575$, getting worse every time. SciPy gives up with a `RuntimeError` once the numbers blow up. Start at $x_0 = 1.3$ instead and it converges to $0$ in five steps. Same function, same method, different start.

::: example Kepler at e = 0.99: newton against brentq
Very eccentric orbits are where Newton's method struggles. Take $e = 0.99$ and $M = 0.2$. Near periapsis the slope $1 - e\cos E$ is only about $1 - 0.99 = 0.01$, a **[[nearly flat tangent|flat-tangent]]**.

```python
import numpy as np
from scipy.optimize import newton, brentq

e, M = 0.99, 0.2
f = lambda E: E - e * np.sin(E) - M
fp = lambda E: 1 - e * np.cos(E)

for E0 in (0.0, M, np.pi):
    E, info = newton(f, E0, fprime=fp, full_output=True)
    print(E0 == np.pi, round(E, 6), info.iterations)
# False 1.066997 25
# False 1.066997 18
# True 1.066997 7

E, info = brentq(f, 0.0, 2 * np.pi, full_output=True)
print(round(E, 6), info.iterations)      # 1.066997 14
```

**Reading the results.** From $E_0 = 0$ the very first step is $f(0)/f'(0) = -0.2/0.01$, so the guess jumps to $E = 20$, more than three laps away. From $E_0 = M$ the guesses bounce between about $-35$ and $+35$ before settling. Both do land on $E \approx 1.067$ in the end, but only because Kepler's function climbs everywhere and has one root. Starting at $E_0 = \pi$ takes 7 steps, because the slope there is $1 + e$, nowhere near flat.

`brentq` needs 14 steps and cannot wander, because it never leaves $[0, 2\pi]$.

**The lesson.** For Kepler, `newton` is fastest from a good start (such as $E_0 = \pi$ when $e$ is large), and `brentq` is the choice you can defend without testing every case. A **damped Newton** step, which shrinks any step that would jump too far, is a common middle road.
:::

## fsolve and root: several equations at once

So far there was one unknown and one equation. Many real problems have several of each. A spacecraft measures its distance to two radio beacons and wants its position $(x, y)$. That is two unknowns, and two equations — one per distance.

The bracket idea stops working here. On a line, "between $a$ and $b$" is a clear region, and a sign change traps a root. In a flat plane there is no "between", and two residuals can each change sign along different curves. There is no simple trap. So multi-dimensional solvers use a Newton-style idea instead: at the current guess, approximate every residual by a flat plane and solve for where all the planes are zero together. The table of slopes they need is called the **[[Jacobian|jacobian-preview]]** — the slope of every residual with respect to every unknown. If you do not supply it, SciPy estimates it by nudging each unknown a little.

SciPy has two front doors to this. `scipy.optimize.root(fun, x0)` is the modern one. It returns a result object with `.x` (the answer), `.success` (did it converge) and `.message` (why it stopped). `scipy.optimize.fsolve(fun, x0)` is the older one. It returns the answer array alone. Both use the same default method, called `hybr`, which mixes Newton steps with safer small steps.

::: key
fsolve/root for multi-dimensional systems, where bracketing no longer exists.
:::

::: example Position from two beacon ranges
Beacon A sits at $(0, 0)$ and beacon B at $(10, 0)$, in kilometers. The spacecraft measures $7\,\mathrm{km}$ to A and $5\,\mathrm{km}$ to B. Where is it?

The residuals are "computed distance minus measured distance", one per beacon:

```python
import numpy as np
from scipy.optimize import root

def residual(p, rA, rB):
    x, y = p
    return [np.hypot(x, y) - rA,
            np.hypot(x - 10.0, y) - rB]

sol = root(residual, x0=[5.0, 2.0], args=(7.0, 5.0))
print(sol.success, np.round(sol.x, 4))      # True [6.2    3.2496]

sol = root(residual, x0=[5.0, -2.0], args=(7.0, 5.0))
print(sol.success, np.round(sol.x, 4))      # True [ 6.2    -3.2496]
```

`np.hypot(x, y)` is $\sqrt{x^2 + y^2}$, the distance from the origin. `args` passes the measured ranges through to the function.

**Checking by hand.** Square both range equations: $x^2 + y^2 = 49$ and $(x - 10)^2 + y^2 = 25$. Subtract the second from the first: $20x - 100 = 24$, so $x = 6.2$. Then $y^2 = 49 - 6.2^2 = 10.56$, so $y = \pm 3.2496$. The two circles meet at two points, and **the starting guess picked which one** you got. That is normal for these solvers: they find the root nearest in spirit to where you start, so the start is part of the answer.
:::

::: warning fsolve does not stop you
If the problem has no solution, `root` sets `.success` to `False` and explains in `.message`. Try measured ranges of $7\,\mathrm{km}$ and $2\,\mathrm{km}$: those circles never meet, and `root` stops at about $(7.50, 0.00)$ with residuals near $0.5\,\mathrm{km}$ each, reporting "The iteration is not making good progress". `fsolve` returns that same wrong point as an ordinary array and only prints a warning, which is easy to miss in a long script. Always check `.success`, or at least look at the residual of the answer you got.
:::

## Choosing the tool

The four tools differ in what they need from you and what they promise back:

| Tool | Unknowns | You must supply | Promise |
|---|---|---|---|
| `brentq(f, a, b)` | 1 | a bracket with a sign change | always converges, no derivative |
| `newton(f, x0, fprime)` | 1 | a good starting guess, ideally a derivative | fastest near the root, can diverge |
| `root(fun, x0)` | many | a starting guess | local; check `.success` |
| `fsolve(fun, x0)` | many | a starting guess | same method, returns only the array |

Put the whole decision together and it reads like this:

::: key
brentq vs fsolve vs newton: brentq when you can bracket a sign change in one dimension: it is guaranteed to converge and needs no derivative. newton when you have a good initial guess and a derivative, for speed. fsolve/root for multi-dimensional systems, where bracketing no longer exists.
:::

For Kepler's equation you can always bracket, so `brentq` gives an answer you can defend in a design review: it converges for every $M$ and every $e$ below one, it reaches machine precision, and it needs no derivative or starting guess. Flight software that must solve it millions of times often uses a tuned Newton with a carefully chosen start instead, because it is faster — but only after testing that start across every eccentricity it will meet.

## Check yourself

::: check
Rewrite "find $x$ with $\cos x = x$" as a root problem, and find a bracket for it.
:::

::: answer
Move everything to one side: $f(x) = \cos x - x$. At $x = 0$, $f = 1 - 0 = 1$, which is positive. At $x = 1$, $f = \cos 1 - 1 \approx 0.540 - 1 = -0.460$, which is negative. The sign changes, so $[0, 1]$ is a bracket, and `brentq(lambda x: np.cos(x) - x, 0, 1)` returns about $0.7391$.
:::

::: check
Bisection halves the bracket each step. Starting from a bracket $2\pi$ wide, roughly how many steps does it take to get the width below $10^{-12}$?
:::

::: answer
After $n$ steps the width is $2\pi / 2^n$. You need $2^n > 2\pi \times 10^{12} \approx 6.28 \times 10^{12}$. Since $2^{42} \approx 4.4 \times 10^{12}$ is too small and $2^{43} \approx 8.8 \times 10^{12}$ is enough, it takes 43 steps. `brentq` usually does the same job in about ten, because its interpolated guesses are much better than the middle.
:::

::: check
A satellite has $M = 14.0\,\mathrm{rad}$. What reduced $M$ do you solve with, and what do you add back to the $E$ you get?
:::

::: answer
Whole laps: $k = \lfloor 14.0 / 2\pi \rfloor = \lfloor 2.228 \rfloor = 2$. Reduced mean anomaly: $14.0 - 2 \times 2\pi \approx 14.0 - 12.566 = 1.434\,\mathrm{rad}$. Solve Kepler with $M = 1.434$, then add $2 \times 2\pi \approx 12.566$ to the $E$ you find, so $E$ counts the same two laps that $M$ did.
:::

::: check
Why does Newton's method on Kepler's equation take a huge first step from $E_0 = 0$ when $e = 0.99$, but not when $e = 0.1$?
:::

::: answer
The step is $f(E_0)/f'(E_0)$, and $f'(0) = 1 - e\cos 0 = 1 - e$. With $e = 0.99$ that slope is $0.01$, so a residual of $-M$ becomes a step of $100M$ — for $M = 0.2$, a jump of 20 radians. With $e = 0.1$ the slope is $0.9$, so the step is about $1.1M$, which is sensible. A nearly flat tangent turns a small residual into a giant step.
:::

::: check
You call `fsolve` on a three-equation system and it hands back an array without complaint. What should you do before using the numbers?
:::

::: answer
Plug the answer back into your function and look at the residuals. If they are not near zero, `fsolve` did not converge and the array is only where it stopped. Better, call `root` instead and check `sol.success` and `sol.message`, or call `fsolve` with `full_output=True` and check that the returned status flag `ier` equals 1.
:::

## Summary

| Idea | Meaning | In SciPy |
|---|---|---|
| root | a value where $f(x) = 0$ | what every tool here returns |
| residual | how far from zero $f$ is at a guess | the value your function returns |
| Kepler's equation | $M = E - e\sin E$, solved as $f(E) = E - e\sin E - M$ | bracket $[0, 2\pi]$ after reducing $M$ |
| bracket | $[a, b]$ with $f(a)$, $f(b)$ of opposite sign | `brentq(f, a, b, xtol=..., rtol=...)` |
| Newton step | $x_{n+1} = x_n - f(x_n)/f'(x_n)$ | `newton(f, x0, fprime=...)` |
| system of equations | several unknowns, several residuals | `root(fun, x0)` and `.success`, or `fsolve` |
| machine precision | `rtol` cannot go below about $8.88 \times 10^{-16}$ | `rtol=8.9e-16` |

Root finding asks "where is this zero?" The next lesson asks a close cousin, "where is this smallest?", and uses it to fit models to noisy measurements with `minimize`, `least_squares` and `curve_fit`.

::: context kepler-equation An equation from 1609
Johannes Kepler published the equation in 1609, after years of fitting Mars's positions by hand. He could compute $M$ from $E$ but not the reverse, and he challenged the mathematicians of his day to find a direct solution. Four centuries later there is still no finite formula for $E$ using ordinary functions. Every method since is a clever guessing scheme. The picture shows what $E$ means: it is measured at the center of the orbit, to the point on a circle that sits directly above the satellite.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <circle cx="150" cy="110" r="100" fill="none" stroke="#8fb8f0" stroke-width="1.5" stroke-dasharray="5 4"/>
  <ellipse cx="150" cy="110" rx="100" ry="80" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="40" y1="110" x2="270" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="150" cy="110" r="3" fill="#1f2a44"/>
  <text x="140" y="128" font-size="11" fill="#1f2a44">center</text>
  <circle cx="210" cy="110" r="6" fill="#1d6fd1"/>
  <text x="200" y="130" font-size="11" fill="#1d6fd1">Earth</text>
  <line x1="150" y1="110" x2="200" y2="23.4" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="200" y1="23.4" x2="200" y2="110" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <circle cx="200" cy="23.4" r="3.5" fill="#b4232c"/>
  <circle cx="200" cy="40.7" r="5" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="208" y="44" font-size="11" fill="#1f2a44">satellite</text>
  <path d="M175,110 A25,25 0 0,0 162.5,88.3" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="178" y="97" font-size="12" fill="#b4232c">E</text>
  <text x="256" y="104" font-size="11" fill="#1f2a44">periapsis</text>
  <text x="255" y="40" font-size="11" fill="#8fb8f0">circle of radius a</text>
</svg>
```
:::

::: context anomaly-word Why an angle is called an anomaly
Ancient astronomers expected planets to move steadily around the sky. The irregular part of the motion — the part that did not fit — was the "anomaly", from a Greek word for uneven. The name stuck to the angles used to describe that uneven motion. There are three: the **mean** anomaly (the steady, averaged one), the **eccentric** anomaly (a helper angle on the ellipse) and the **true** anomaly (the actual angle seen from Earth). Orbit software converts between all three constantly.
:::

::: context sign-change Why a sign change traps a root
An unbroken curve that starts below the axis and ends above it has to cross the axis at least once. Mathematicians call this the intermediate value theorem. Here is Kepler's function for $e = 0.5$, $M = 1$ across $[0, 2\pi]$: negative at the left end, positive at the right, crossing near $E = 1.499$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="110" x2="335" y2="110" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,125.0 51.7,123.0 63.3,120.9 75.0,118.5 86.7,115.8 98.3,112.6 110.0,108.9 121.7,104.8 133.3,100.1 145.0,95.0 156.7,89.5 168.3,83.7 180.0,77.9 191.7,72.0 203.3,66.3 215.0,60.8 226.7,55.7 238.3,51.0 250.0,46.8 261.7,43.1 273.3,40.0 285.0,37.2 296.7,34.9 308.3,32.7 320.0,30.8"/>
  <circle cx="40" cy="125" r="4" fill="#b4232c"/>
  <text x="40" y="145" font-size="12" text-anchor="middle" fill="#b4232c">a = 0, f &lt; 0</text>
  <circle cx="320" cy="30.8" r="4" fill="#b4232c"/>
  <text x="300" y="22" font-size="12" text-anchor="middle" fill="#b4232c">b = 2π, f &gt; 0</text>
  <circle cx="106.8" cy="110" r="4.5" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="112" y="130" font-size="12" fill="#1f2a44">root</text>
</svg>
```

The sign test needs only two evaluations and no slope, which is why bracketing works on functions you cannot differentiate.
:::

::: context brent-history Brent and Dekker
Richard Brent, an Australian mathematician, described the method in his 1973 book *Algorithms for Minimization without Derivatives*. He built on a method by Theodorus Dekker from the late 1960s that also mixed bisection with interpolation. Brent's version added safeguards that guarantee it is never much slower than plain bisection, even on nasty functions. Versions of it sit inside many numerical libraries, including MATLAB's `fzero`.
:::

::: context machine-epsilon How close is as close as it gets
A standard Python float stores about 16 significant decimal digits. The gap between $1$ and the next larger float is about $2.22 \times 10^{-16}$, a number called machine epsilon. Near an answer of size $1$, you cannot name a value closer than that. So a residual of $10^{-16}$ on Kepler's equation is not "slightly wrong": it is exactly right to the precision the computer has. The exercise asks for better than $10^{-12}$, which leaves plenty of room.
:::

::: context newton-tangent The tangent step in a picture
Here Newton's method finds $\sqrt{2}$ as the root of $f(x) = x^2 - 2$, starting from $x_0 = 2$. The tangent there has slope $4$ and hits zero at $x_1 = 1.5$, already close to the true root $1.414$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="150" x2="335" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,193.8 54.0,191.0 68.0,187.8 82.0,184.0 96.0,179.8 110.0,175.0 124.0,169.8 138.0,164.0 152.0,157.8 166.0,151.0 180.0,143.8 194.0,136.0 208.0,127.7 222.0,119.0 236.0,109.8 250.0,100.0 264.0,89.8 278.0,79.0 292.0,67.8 306.0,56.0 320.0,43.8"/>
  <line x1="152" y1="170" x2="275" y2="77.5" stroke="#b4232c" stroke-width="1.8"/>
  <line x1="250" y1="100" x2="250" y2="150" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <circle cx="250" cy="100" r="4" fill="#b4232c"/>
  <text x="258" y="104" font-size="12" fill="#1f2a44">(x₀, f(x₀))</text>
  <text x="250" y="166" font-size="12" text-anchor="middle" fill="#1f2a44">x₀ = 2</text>
  <circle cx="180" cy="150" r="4" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <text x="192" y="185" font-size="12" text-anchor="middle" fill="#1f2a44">x₁ = 1.5</text>
  <circle cx="168" cy="150" r="3" fill="#1f2a44"/>
  <text x="130" y="140" font-size="11" fill="#1f2a44">root 1.414</text>
  <text x="300" y="36" font-size="12" fill="#1d6fd1">f(x)</text>
</svg>
```
:::

::: context quadratic-convergence Why the digits double
Near the root, the error after a Newton step is roughly a constant times the square of the error before it. If you are off by $10^{-3}$, the next step is off by something like $10^{-6}$, then $10^{-12}$. Squaring a small number doubles its count of leading zeros. Bisection only halves the error each step, a fixed gain, which is why it looks slow next to Newton once Newton is close.
:::

::: context flat-tangent The flat spot near periapsis
With $e$ near one, the graph of $f(E) = E - e\sin E - M$ is almost level near $E = 0$, because the $E$ and the $e\sin E$ nearly cancel there. A level tangent points almost parallel to the axis, so the place it meets zero is far away. Orbits like this are real: comets and some highly elliptical transfer orbits have eccentricities above 0.9, so solvers must handle them.
:::

::: context jacobian-preview A table of slopes
For two residuals $r_1, r_2$ and two unknowns $x, y$, the Jacobian is a 2-by-2 table: row one holds how $r_1$ changes with $x$ and with $y$, row two the same for $r_2$. It is the many-dimensional version of $f'(x)$. The Newton step then solves a small linear system instead of dividing by one slope. Lesson 3 of this module builds Jacobians by hand and shows why their shape decides how well a solver can work.
:::
