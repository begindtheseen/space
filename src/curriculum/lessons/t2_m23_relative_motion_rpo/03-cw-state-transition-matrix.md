---
id: l03-cw-state-transition-matrix
title: Solving CW — closed-form motion and the state transition matrix
minutes: 15
covers:
  - the CW state transition matrix
---

Imagine a recipe card that works like a time machine. You write today's six numbers on it — where the chaser is, and how fast it is moving, along each of the three LVLH axes. You pick a time, say twenty minutes from now. The card tells you the six numbers at that time, with no step-by-step simulation in between.

For the Clohessy-Wiltshire equations, that card exists. The previous lesson ended with three **linear, constant-coefficient** differential equations: every term is a plain number times $x$, $y$, $z$ or one of their rates, and those numbers never change. Equations like that can always be solved exactly, as formulas. Once solved, the answer packs into a single $6\times6$ table of numbers called the **[[state transition matrix|state-vector]]**, or **STM**. It is the same kind of object the ODE and linear-algebra modules built in general, now made specific to two spacecraft.

Every later lesson in this module — the validity study, the football orbit, two-burn rendezvous targeting, the passive-safety analysis — moves a relative state forward by multiplying six numbers by this one matrix. Getting it right once, here, turns everything downstream into linear algebra instead of re-deriving physics each time.

## The cross-track motion

Start with the easy one. The cross-track equation from the last lesson is

$$
\ddot z + n^2 z = 0.
$$

This is the **harmonic oscillator** from the ODE module — the equation of a mass on a spring, or a swing. The further $z$ is from zero, the harder it is pulled back, so it swings back and forth forever. Its swing rate is $n$, the orbit's own turning rate.

The solution that starts at $z(0) = z_0$ with rate $\dot z(0) = \dot z_0$ is

$$
z(t) = z_0\cos nt + \frac{\dot z_0}{n}\sin nt.
$$

You can check it. At $t = 0$, $\cos 0 = 1$ and $\sin 0 = 0$, so $z(0) = z_0$. Its rate is $\dot z(t) = -n z_0\sin nt + \dot z_0\cos nt$, which is $\dot z_0$ at $t = 0$. And taking the rate once more gives $-n^2 z(t)$, as the equation demands.

This motion is bounded and repeats every $2\pi/n$ — exactly one orbital period — whatever the starting values. Cross-track motion never drifts away; it only [[swings back and forth|cross-track-swing]]. That fact matters a great deal later, when you compare errors out of the orbit plane with errors inside it.

## The in-plane motion

The radial and in-track equations are

$$
\ddot x - 3n^2x - 2n\dot y = 0, \qquad \ddot y + 2n\dot x = 0.
$$

They are **coupled**: each one contains the other's variable. The trick is to untangle them in one step.

**Step 1: integrate the in-track equation.** $\ddot y + 2n\dot x = 0$ says "the rate of $\dot y$ plus $2n$ times the rate of $x$ is zero". So $\dot y + 2nx$ never changes. At $t = 0$ it equals $\dot y_0 + 2nx_0$, so for all time

$$
\dot y(t) + 2nx(t) = \dot y_0 + 2nx_0 \quad\Longrightarrow\quad \dot y(t) = \dot y_0 + 2nx_0 - 2nx(t).
$$

This says something physical before it says anything mathematical. The in-track *speed* at any moment is fixed by the radial *position*. Sit higher (bigger $x$) and you move slower along the track; sit lower and you move faster.

**Step 2: substitute into the radial equation.** Replace $\dot y$:

$$
\ddot x - 3n^2 x - 2n\big(\dot y_0+2nx_0-2nx\big) = 0.
$$

Multiply out the bracket: $-2n\dot y_0 - 4n^2x_0 + 4n^2x$. The $+4n^2x$ joins the $-3n^2x$ to make $+n^2x$. Move the constants to the right:

$$
\ddot x + n^2 x = 2n\dot y_0 + 4n^2 x_0.
$$

The coupling is gone. In its place is a *constant* on the right side. Now $x$ alone obeys a harmonic oscillator with the same rate $n$ as the cross-track motion, plus a steady push.

**Step 3: solve it.** A steady push on a spring [[moves the resting point but not the swing rate|steady-push]]. So the solution is a constant (the new resting point) plus a free swing:

$$
x(t) = \underbrace{\left(4x_0+\frac{2\dot y_0}{n}\right)}_{\text{resting point}} + A\cos nt + B\sin nt.
$$

The resting point is the constant $x_p$ that makes $n^2 x_p$ equal the right side: $x_p = (2n\dot y_0 + 4n^2x_0)/n^2 = 4x_0 + 2\dot y_0/n$.

**Step 4: fit the starting values.** At $t = 0$: $x_0 = 4x_0 + 2\dot y_0/n + A$, so $A = -3x_0 - 2\dot y_0/n$. The rate is $\dot x(t) = -nA\sin nt + nB\cos nt$, so $\dot x_0 = nB$ and $B = \dot x_0/n$. Putting those in and grouping by starting value:

$$
x(t) = (4-3\cos nt)\,x_0 + \frac{\sin nt}{n}\,\dot x_0 + \frac{2}{n}(1-\cos nt)\,\dot y_0.
$$

Check at $t = 0$: $(4 - 3)x_0 + 0 + 0 = x_0$. Good.

**Step 5: the in-track position.** Feed $x(t)$ back into Step 1 and multiply out:

$$
\dot y(t) = \dot y_0 + 2nx_0 - 2n\left[(4-3\cos nt)x_0 + \frac{\sin nt}{n}\dot x_0 + \frac{2}{n}(1-\cos nt)\dot y_0\right].
$$

Collect the terms for each starting value:

$$
\dot y(t) = 6n(\cos nt - 1)\,x_0 - 2\sin nt\,\dot x_0 + (4\cos nt - 3)\,\dot y_0.
$$

Now add up $\dot y$ over time, from $0$ to $t$, one term at a time. The total of $\cos$ over that span is $\sin nt / n$, and the total of $\sin$ is $(1 - \cos nt)/n$. Adding the starting position $y_0$:

$$
y(t) = 6(\sin nt - nt)\,x_0 + y_0 - \frac{2}{n}(1-\cos nt)\,\dot x_0 + \frac{1}{n}(4\sin nt-3nt)\,\dot y_0.
$$

Look closely at the $nt$ pieces. They are not inside a sine or cosine, so they do not swing back — they grow steadily with time. These are the **[[secular terms|secular-terms]]**, and they are the reason in-track drift dominates rendezvous. A later lesson is devoted to them.

Taking the rate of $x(t)$, $y(t)$ and $z(t)$ once more gives the three velocities. All six parts of the relative state are now known as formulas in time and the six starting values.

::: key The CW closed-form solution
$$
\begin{aligned}
x(t) &= (4-3\cos nt)x_0 + \frac{\sin nt}{n}\dot x_0 + \frac{2}{n}(1-\cos nt)\dot y_0, \\
y(t) &= 6(\sin nt-nt)x_0 + y_0 - \frac{2}{n}(1-\cos nt)\dot x_0 + \frac{1}{n}(4\sin nt-3nt)\dot y_0, \\
z(t) &= z_0\cos nt + \frac{\dot z_0}{n}\sin nt.
\end{aligned}
$$
Differentiating gives $\dot x(t)$, $\dot y(t)$, $\dot z(t)$.
:::

## Packaging it as a state transition matrix

Look at the formulas again. Every one of the six answers is a **linear combination** of the six starting values: each starting value times some number (which depends on $t$), all added up. That is exactly what multiplying by a matrix does.

Write the **state** as a column of six numbers, $\mathbf{s} = (x,y,z,\dot x,\dot y,\dot z)^\mathsf{T}$. Then

$$
\mathbf{s}(t) = \boldsymbol\Phi(t)\,\mathbf{s}(0), \qquad
\boldsymbol\Phi(t) =
\begin{bmatrix}
4-3c & 0 & 0 & s/n & (2/n)(1-c) & 0 \\
6(s-nt) & 1 & 0 & -(2/n)(1-c) & (4s-3nt)/n & 0 \\
0 & 0 & c & 0 & 0 & s/n \\
3ns & 0 & 0 & c & 2s & 0 \\
6n(c-1) & 0 & 0 & -2s & 4c-3 & 0 \\
0 & 0 & -ns & 0 & 0 & c
\end{bmatrix}
$$

with $s = \sin nt$ and $c = \cos nt$ as shorthand. ($\boldsymbol\Phi$ is the Greek capital "phi".) The top three rows are the position formulas. The bottom three are their rates: for example, the rate of $x(t)$ is $\dot x(t) = 3ns\,x_0 + c\,\dot x_0 + 2s\,\dot y_0$, which is row four.

This is the **Clohessy-Wiltshire state transition matrix**. Each entry answers one question: "if I change *this* starting value by one unit, how much does *that* value change at time $t$?" Row $x$, column $z$ is zero at every time, for example. A cross-track offset on its own never creates a radial one. In-plane and out-of-plane motion [[never mix|stm-blocks]], because $z$ separated from $x$ and $y$ back in the original equations.

### Two checks every implementation should pass

**Check 1: $\boldsymbol\Phi(0) = \mathbf{I}$.** Set $t = 0$, so $s = 0$ and $c = 1$. Every entry becomes $1$ on the diagonal and $0$ elsewhere — the identity matrix. It must: moving forward by zero time changes nothing.

**Check 2: $\det\boldsymbol\Phi(t) = 1$ for every $t$** — exactly, not approximately. The **[[determinant|determinant-area]]** measures how a matrix stretches volume. A determinant of $1$ means the matrix may squash and shear a region of possible states, but never makes it bigger or smaller.

Why must it be $1$? The CW equations, like the two-body problem they came from, describe what physicists call a **Hamiltonian** system. Such systems are **[[symplectic|symplectic]]**: they carry a cloud of possible starting states forward without changing its six-dimensional volume. That is a strong check. A wrong sign or coefficient in most entries breaks it.

::: warning The determinant cannot see the in-track row
Look at the $y$ column (the second column): it is $(0, 1, 0, 0, 0, 0)$ at every time. A determinant can be expanded along any column, and this one has a single $1$. So $\det\boldsymbol\Phi$ equals the determinant of the other five rows and columns — and the entire $y$ row, secular terms included, drops out.

That means **no error in the $y(t)$ row can change the determinant**. Write $6(s + nt)$ instead of $6(s - nt)$, or forget a $1/n$, and the determinant is still exactly $1$. The in-track row — the one that carries drift — has to be checked another way: against a direct numerical integration of the CW equations, as in the second example below.
:::

### Four blocks

It is often handy to split $\boldsymbol\Phi(t)$ into four $3\times3$ blocks, separating position from velocity:

$$
\boldsymbol\Phi(t) = \begin{bmatrix} \boldsymbol\Phi_{rr}(t) & \boldsymbol\Phi_{rv}(t) \\ \boldsymbol\Phi_{vr}(t) & \boldsymbol\Phi_{vv}(t) \end{bmatrix},
\qquad
\boldsymbol\rho(t) = \boldsymbol\Phi_{rr}(t)\boldsymbol\rho_0 + \boldsymbol\Phi_{rv}(t)\dot{\boldsymbol\rho}_0.
$$

The subscripts say what goes in and what comes out: $\boldsymbol\Phi_{rv}$ (read "phi r-v") gives position ($r$) from starting velocity ($v$).

That top-right block is the one you will need to *invert* when you know where you are, know where you want to be, and must find the velocity that gets you there. That is the [[two-burn rendezvous targeting problem|targeting-bridge]] several lessons ahead. The matrix itself does not change between now and then — only which piece of it you read.

::: example Building and checking the STM
Use this module's reference orbit, $n = 1.1282\times10^{-3}\,\mathrm{rad/s}$, and $t = 1000\,\mathrm{s}$.

**The angle.** $nt = 1.1282\,\mathrm{rad}$ (about $64.6^\circ$). So $s = \sin nt = 0.9036$ and $c = \cos nt = 0.4283$.

**A few entries, worked out.**

- Top left: $4 - 3c = 4 - 3(0.4283) = 4 - 1.2849 = 2.7150$.
- Row $x$, column $\dot x$: $s/n = 0.9036 / 0.0011282 = 800.97\,\mathrm{s}$.
- Row $x$, column $\dot y$: $(2/n)(1 - c) = 1772.7 \times 0.5717 = 1013.46\,\mathrm{s}$.
- Row $y$, column $x$: $6(s - nt) = 6(0.90362 - 1.12815) = 6(-0.22453) = -1.3472$.
- Row $\dot y$, column $\dot y$: $4c - 3 = 1.7133 - 3 = -1.2867$.

**The full matrix.**

$$
\boldsymbol\Phi(1000\,\mathrm{s}) =
\begin{bmatrix}
2.7150 & 0 & 0 & 800.97 & 1013.46 & 0 \\
-1.3472 & 1 & 0 & -1013.46 & 203.90 & 0 \\
0 & 0 & 0.4283 & 0 & 0 & 800.97 \\
0.003058 & 0 & 0 & 0.4283 & 1.8072 & 0 \\
-0.003870 & 0 & 0 & -1.8072 & -1.2867 & 0 \\
0 & 0 & -0.001019 & 0 & 0 & 0.4283
\end{bmatrix}
$$

**Units.** Position-from-position entries have no units. Position-from-velocity entries are in seconds (meters per meter-per-second). Velocity-from-position entries are in $\mathrm{s^{-1}}$.

**The check.** Its determinant, computed to twelve decimal places, is $1.000000000000$. The same holds at $t = 0$, at a quarter period $T/4 = 1392.36\,\mathrm{s}$ and at a half period $T/2 = 2784.72\,\mathrm{s}$ — and at every other $t$, not only these. Remember the warning, though: this confirms every row except $y$.
:::

::: example STM propagation against direct numerical integration
**The start.** Take the relative state

$$
\mathbf{s}_0 = (100,\ -300,\ 50)\,\mathrm{m},\ (0.20,\ -0.10,\ 0.05)\,\mathrm{m/s}.
$$

The chaser is $100\,\mathrm{m}$ above, $300\,\mathrm{m}$ behind and $50\,\mathrm{m}$ out of plane.

**Two ways forward.** First, multiply $\mathbf{s}_0$ by $\boldsymbol\Phi(1000\,\mathrm{s})$ from the last example. For instance, the new $x$ is

$$
2.7150(100) + 800.97(0.20) + 1013.46(-0.10) = 271.50 + 160.20 - 101.35 = 330.35\,\mathrm{m}.
$$

Second, integrate the raw CW equations, $\ddot x = 3n^2x + 2n\dot y$, $\ddot y = -2n\dot x$, $\ddot z = -n^2 z$, from the same start with a very accurate [[Runge-Kutta method|runge-kutta]].

**The result.** Both give

$$
\mathbf{s}(1000\,\mathrm{s}) = (330.350,\ -657.801,\ 61.465)\,\mathrm{m},\ (0.21077,\ -0.61974,\ -0.02955)\,\mathrm{m/s},
$$

agreeing to about $2\times10^{-12}\,\mathrm{m}$ in position — computer rounding, nothing more. This time the $y$ row *is* checked: the in-track answer $-657.801\,\mathrm{m}$ matches.

**Why they agree.** This is expected, not lucky. $\boldsymbol\Phi(t)$ is not an approximation to the CW equations; it *is* their exact solution. The place to look for disagreement with reality is the next lesson, which compares CW — by either method — against the full, curved two-body motion that CW simplified.
:::

::: warning STM versus truth are different comparisons
Checking $\boldsymbol\Phi(t)$ against a numerical integration of the *CW equations* only shows that you solved the linear equations correctly. Both sides of that comparison contain the same simplification, so it says nothing about how well CW matches two real spacecraft. That second, more important comparison — CW against an accurate simulation of the two actual orbits — is the next lesson. The two checks do not replace each other.
:::

## Check yourself

::: check
Explain in one sentence why the cross-track column of $\boldsymbol\Phi(t)$ (the $z_0$ column) is zero in every row except the $z$ and $\dot z$ rows.
:::

::: answer
The cross-track equation $\ddot z + n^2 z = 0$ is completely separate from $x$, $y$ and their rates — the frame's spin terms never touch $z$ — so $x(t)$, $y(t)$ and their rates do not depend on $z_0$ at all. In the same way, $z(t)$ and $\dot z(t)$ depend only on $z_0$ and $\dot z_0$. Together, those two facts zero out the cross-track column everywhere outside its own $2\times2$ corner.
:::

::: check
Without working out the whole matrix, what is $\boldsymbol\Phi(0)$? Explain why this must hold for *any* correctly derived state transition matrix, not only this one.
:::

::: answer
$\boldsymbol\Phi(0) = \mathbf{I}_6$, the $6\times6$ identity.

It must hold for any STM, because $\mathbf{s}(t) = \boldsymbol\Phi(t)\mathbf{s}(0)$ at $t = 0$ has to give back $\mathbf{s}(0)$ unchanged. Moving forward by zero time cannot change the state. So the zero-time matrix has to leave *every* possible starting state alone — and the only matrix that does that is the identity.
:::

::: check
A newly coded CW STM gives $\det\boldsymbol\Phi(500\,\mathrm{s}) = 1.000$ but $\det\boldsymbol\Phi(3000\,\mathrm{s}) = 0.87$. What does this pattern suggest about the bug, and which row can you rule out?
:::

::: answer
**Which row it is not.** The bug cannot be in the $y$ row. As the warning explained, the $y$ column is always $(0,1,0,0,0,0)$, so the determinant ignores the $y$ row entirely.

**What kind of bug.** The determinant is almost right at $500\,\mathrm{s}$ and clearly wrong at $3000\,\mathrm{s}$, so the error is small early and grows as $nt$ grows. That points to a mistake in how an entry depends on time: a wrong factor inside a $\sin nt$ or $\cos nt$ (say, a period in minutes instead of seconds in one row), or a velocity row that is not truly the rate of its position row. Mistakes like these look fine for small angles and drift wrong later.

**What to do next.** Also compare against numerical integration of the CW equations. That catches this bug and any $y$-row bug the determinant cannot see.
:::

::: check
Starting from $\ddot x + n^2 x = 2n\dot y_0 + 4n^2x_0$, confirm that $x_p = 4x_0 + 2\dot y_0/n$ is a particular solution.
:::

::: answer
$x_p$ does not change with time, so $\ddot x_p = 0$.

Put it into the left side: $\ddot x_p + n^2x_p = 0 + n^2(4x_0 + 2\dot y_0/n) = 4n^2x_0 + 2n\dot y_0$. That is exactly the right side.

Since the push on the right is itself constant, a constant is the natural first guess for a particular solution — and here it works.
:::

::: check
The lesson says $\boldsymbol\Phi(t)$ has determinant exactly $1$ at every $t$, while the linearization it comes from is only approximate. Do these two facts contradict each other?
:::

::: answer
No. Having determinant $1$ is a property of the *linear equations themselves*, not of how well they match the real, curved dynamics.

The CW equations, however accurate they are as a model, are exactly a linear Hamiltonian system. Any exact solution of such a system keeps volume exactly. The approximation error lives in the gap between the CW equations and the true equations of the previous lesson. It does not leak into how faithfully $\boldsymbol\Phi(t)$ solves the CW equations.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $z(t) = z_0\cos nt+(\dot z_0/n)\sin nt$ | Cross-track: a harmonic swing, always bounded, period $2\pi/n$ |
| $\dot y + 2nx = \text{constant}$ | First integral of the in-track equation; untangles the coupling |
| $\ddot x+n^2x = 2n\dot y_0+4n^2x_0$ | Radial oscillator with a steady push, used to find $x(t)$ |
| $x(t) = (4-3\cos nt)x_0+(\sin nt/n)\dot x_0+(2/n)(1-\cos nt)\dot y_0$ | Radial closed-form solution |
| $y(t) = 6(\sin nt-nt)x_0+y_0-(2/n)(1-\cos nt)\dot x_0+(1/n)(4\sin nt-3nt)\dot y_0$ | In-track solution; the $nt$ pieces grow without limit (secular) |
| $\boldsymbol\Phi(t)$ | $6\times6$ CW state transition matrix; $\mathbf{s}(t)=\boldsymbol\Phi(t)\mathbf{s}(0)$ |
| $\boldsymbol\Phi(0)=\mathbf{I}$ | Zero time changes nothing — first check on any implementation |
| $\det\boldsymbol\Phi(t)=1$ for all $t$ | Volume-keeping (symplectic) flow — second check, blind to the $y$ row |
| $\boldsymbol\Phi_{rr}, \boldsymbol\Phi_{rv}, \boldsymbol\Phi_{vr}, \boldsymbol\Phi_{vv}$ | Position/velocity blocks; $\boldsymbol\Phi_{rv}$ is inverted for targeting |
| In-plane / cross-track split | $x, y, \dot x, \dot y$ never mix with $z, \dot z$ |

The formulas and their matrix are exact for the CW equations. The next lesson asks what those equations cannot answer about themselves: over what distances and times do they still describe two real spacecraft — and where exactly do they stop?

::: context state-vector Six numbers say everything
To predict where a coasting spacecraft goes, you need exactly six numbers: three for where it is and three for how fast it moves along each axis. Nothing else about its past matters. Engineers call those six numbers the **state**, and write them as one column, the **state vector**. A **state transition matrix** is any matrix that turns the state at one time into the state at another. You will meet STMs again in navigation filters, where they carry uncertainty forward in time, not only the state itself.
:::

::: context cross-track-swing Two tilted orbits cross twice
Why does cross-track motion swing? If the chaser's orbit plane is tilted a little from the target's, the two planes cross along a line through Earth's center. Half an orbit the chaser is on one side of the target's plane, half on the other, crossing it twice per orbit. Seen from the target, it slides out and back like a pendulum. Here is $z(t)$ for $z_0 = 1$ and $\dot z_0 = 0$:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="90" x2="335" y2="90" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="30" x2="40" y2="150" stroke="#6c7a93" stroke-width="1"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,40.0 48.8,41.0 57.5,43.8 66.2,48.4 75.0,54.6 83.8,62.2 92.5,70.9 101.2,80.2 110.0,90.0 118.8,99.8 127.5,109.1 136.2,117.8 145.0,125.4 153.8,131.6 162.5,136.2 171.2,139.0 180.0,140.0 188.8,139.0 197.5,136.2 206.2,131.6 215.0,125.4 223.8,117.8 232.5,109.1 241.2,99.8 250.0,90.0 258.8,80.2 267.5,70.9 276.2,62.2 285.0,54.6 293.8,48.4 302.5,43.8 311.2,41.0 320.0,40.0"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="110" y="104">T/4</text><text x="180" y="104">T/2</text><text x="250" y="104">3T/4</text><text x="320" y="104">T</text>
  </g>
  <text x="34" y="44" font-size="11" text-anchor="end" fill="#1f2a44">+1</text>
  <text x="34" y="144" font-size="11" text-anchor="end" fill="#1f2a44">−1</text>
  <text x="180" y="22" font-size="12" text-anchor="middle" fill="#1d6fd1">z(t) = cos nt: back where it started after one orbit</text>
</svg>
```
:::

::: context steady-push A weight hanging on a spring
Hang a weight on a spring and it settles lower than the spring's natural length. Pull it and let go, and it bounces around that *new* resting point — at the same bouncing rate it would have had without the weight. A constant push shifts the middle of the swing but not how fast it swings. That is exactly what the constant $2n\dot y_0 + 4n^2x_0$ does to the radial motion: it moves the center of the swing to $4x_0 + 2\dot y_0/n$.
:::

::: context secular-terms Why "secular"?
The word comes from the Latin *saeculum*, "an age" or "a century". Astronomers used it for slow, steady changes that keep going one way for ages, as opposed to *periodic* changes that swing back. In the CW solution, terms like $-3nt$ are secular: they never come back. The next-but-one lesson shows they vanish exactly when $\dot y_0 = -2nx_0$ — the condition for the two vehicles to have the same orbital period.
:::

::: context stm-blocks The shape of the matrix
Shaded squares are the entries that are not zero (drawn at $t = 1000\,\mathrm{s}$). Blue entries belong to the in-plane motion; orange ones to the cross-track motion. They never share a row.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <rect x="60" y="30" width="20" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="80" y="30" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="100" y="30" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="120" y="30" width="20" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="140" y="30" width="20" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="160" y="30" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="60" y="50" width="20" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="80" y="50" width="20" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="100" y="50" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="120" y="50" width="20" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="140" y="50" width="20" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="160" y="50" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="60" y="70" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="80" y="70" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="100" y="70" width="20" height="20" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="120" y="70" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="140" y="70" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="160" y="70" width="20" height="20" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="60" y="90" width="20" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="80" y="90" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="100" y="90" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="120" y="90" width="20" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="140" y="90" width="20" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="160" y="90" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="60" y="110" width="20" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="80" y="110" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="100" y="110" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="120" y="110" width="20" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="140" y="110" width="20" height="20" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <rect x="160" y="110" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="60" y="130" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="80" y="130" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="100" y="130" width="20" height="20" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <rect x="120" y="130" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="140" y="130" width="20" height="20" fill="#fff" stroke="#1f2a44" stroke-width="1"/>
  <rect x="160" y="130" width="20" height="20" fill="#f2b880" stroke="#1f2a44" stroke-width="1"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="70" y="24">x</text><text x="90" y="24">y</text><text x="110" y="24">z</text><text x="130" y="24">ẋ</text><text x="150" y="24">ẏ</text><text x="170" y="24">ż</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="54" y="44">x</text><text x="54" y="64">y</text><text x="54" y="84">z</text><text x="54" y="104">ẋ</text><text x="54" y="124">ẏ</text><text x="54" y="144">ż</text>
  </g>
  <text x="200" y="60" font-size="11" fill="#1d6fd1">in-plane: x, y, ẋ, ẏ</text>
  <text x="200" y="80" font-size="11" fill="#b4232c">cross-track: z, ż</text>
  <text x="200" y="110" font-size="11" fill="#1f2a44">y column: a single 1</text>
</svg>
```

Notice the $y$ column: only one shaded square. Moving the chaser along the track changes nothing else — the whole picture slides along with it.
:::

::: context determinant-area Stretching without changing size
In two dimensions, a matrix's determinant is how much it scales areas. The square on the left is sheared into the parallelogram on the right. The shape changes, but base and height are both still $60$, so the area is the same: determinant $1$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <polygon points="40,130 100,130 100,70 40,70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="70" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">area 60 × 60</text>
  <text x="130" y="104" font-size="16" text-anchor="middle" fill="#1f2a44">→</text>
  <polygon points="160,130 220,130 280,70 220,70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="145" font-size="11" text-anchor="middle" fill="#1f2a44">same base, same height</text>
  <text x="200" y="40" font-size="12" text-anchor="middle" fill="#1f2a44">sheared, not grown: determinant 1</text>
</svg>
```

The CW matrix does the same in six dimensions: a cloud of possible starting states gets squashed and sheared as time passes, but its six-dimensional volume stays fixed.
:::

::: context symplectic Hamilton and Liouville
William Rowan Hamilton, an Irish mathematician of the 1830s, rewrote mechanics in a form where positions and momenta come in matched pairs. Systems that fit his form, including gravity without friction or drag, are called **Hamiltonian**. Joseph Liouville showed that such systems keep volume in the space of states. For a linear system $\dot{\mathbf{s}} = \mathbf{A}\mathbf{s}$ there is a quick test: the determinant of its STM stays $1$ whenever the diagonal of $\mathbf{A}$ adds to zero. For CW, the diagonal of $\mathbf{A}$ is all zeros. Air drag would break this, because drag removes energy and shrinks the cloud.
:::

::: context targeting-bridge Solving for the burn
Suppose you are at $\boldsymbol\rho_0$ and want to be at $\boldsymbol\rho_f$ after time $t$. The block formula says $\boldsymbol\rho_f = \boldsymbol\Phi_{rr}\boldsymbol\rho_0 + \boldsymbol\Phi_{rv}\dot{\boldsymbol\rho}_0$. Everything is known except $\dot{\boldsymbol\rho}_0$, so

$$
\dot{\boldsymbol\rho}_0 = \boldsymbol\Phi_{rv}^{-1}\left(\boldsymbol\rho_f - \boldsymbol\Phi_{rr}\boldsymbol\rho_0\right).
$$

The first burn is the difference between that velocity and the one you have. A second burn at arrival stops you. That is two-impulse CW targeting, and it is only a few lines of code once $\boldsymbol\Phi$ is right.
:::

::: context runge-kutta How the computer integrates
A **Runge-Kutta** method steps a differential equation forward in small time steps. At each step it samples the slope a few times — at the start, in the middle, near the end — and blends them, which is far more accurate than using only the slope at the start. Good versions also estimate their own error and shrink the step when needed. Named after the German mathematicians Carl Runge and Martin Kutta, who developed the idea around 1900, these methods are the workhorse of orbit simulation.
:::
