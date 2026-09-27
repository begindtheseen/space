---
id: l08-zem-zev-guidance
title: Zero-effort-miss and zero-effort-velocity guidance
minutes: 19
covers:
  - Zero-effort-miss and zero-effort-velocity guidance; the ZEM/ZEV feedback law for landing
---

Ride a bike toward a painted stop line. Getting your front wheel *to* the line is easy — you could do it at full speed. The hard part is getting there *and* being stopped at the same moment. You have to judge two things at once: where you will be, and how fast you will be going when you get there.

Proportional navigation only ever had to do the first part. An interceptor wants to reach the target; it does not care how fast it arrives. A lander cares about both. A lander that reaches zero altitude at $40\,\mathrm{m/s}$ has not landed. It has crashed, precisely on target.

This lesson builds the guidance law for that harder job: final position *and* final velocity both pinned. It rests on two predictions that are cheap to make in flight, the **zero-effort miss** and the **zero-effort velocity**. The law that uses them flies soft landings on the Moon and Mars in simulation, and the same idea sits at the heart of modern powered-descent guidance.

## Coast and see

The whole law grows out of one question. *If I switched the engine off right now and coasted for the time that is left, where would I end up, and how fast would I be going?*

Coasting means only gravity acts. With constant gravity $\mathbf{g}$ (a vector, pointing down), the physics of falling bodies gives the coasting position and velocity after $t_{go}$ seconds ("t go", the time left until touchdown):

$$
\mathbf{r}_{coast} = \mathbf{r} + \mathbf{v}\,t_{go} + \tfrac12\mathbf{g}\,t_{go}^2, \qquad \mathbf{v}_{coast} = \mathbf{v} + \mathbf{g}\,t_{go}.
$$

Here $\mathbf{r}$ and $\mathbf{v}$ are the current position and velocity. Read the first formula term by term: start where you are, add how far your current velocity carries you, then add how far gravity pulls you in that time.

Now compare the coast prediction with where you *want* to be. Call the target position $\mathbf{r}_f$ and the target velocity $\mathbf{v}_f$ ("r sub f" and "v sub f", f for final). The gaps are the two quantities this lesson is named for.

The **zero-effort miss**, $ZEM$, is the position error you would have at the end if you never thrust again:

::: key Zero-effort miss
$$
ZEM = \mathbf{r}_f - \big(\mathbf{r}+\mathbf{v}\,t_{go}+\tfrac12\mathbf{g}\,t_{go}^2\big)
$$
The terminal position error if you never thrust again. Compute it by propagating the *uncontrolled* dynamics, so it generalizes to any force model.
:::

The **zero-effort velocity**, $ZEV$, is the matching velocity error:

::: key Zero-effort velocity
$$
ZEV = \mathbf{v}_f - \big(\mathbf{v}+\mathbf{g}\,t_{go}\big)
$$
The terminal velocity error under no further control. You need it whenever the terminal velocity is constrained, as in a soft landing.
:::

Both are worked out from the current state alone. There is no stored reference trajectory. That is the **explicit guidance** pattern from lesson 2: solve the problem fresh from wherever you are. And both are exactly zero when the vehicle is already on an unpowered path that lands it softly on time. That is a precise, checkable way to say "no more effort is needed".

::: warning The sign of ZEM
$ZEM$ is *target minus prediction*, not the other way round. A positive vertical $ZEM$ means the coast would leave you *below* the target — you need to push up. If you flip the subtraction, the law pushes the wrong way and the lander dives into the ground. Check the sign on the first test case, every time.
:::

### Not only constant gravity

The closed forms above hold for constant gravity only. The *idea* does not care. $\mathbf{r}_{coast}$ and $\mathbf{v}_{coast}$ are simply whatever you get by running the true, [[uncontrolled dynamics|propagate]] forward for $t_{go}$ seconds.

Add drag, a gravity field that changes with height, or any other force the vehicle cannot switch off, and the definitions still make sense. Only the formula changes: you replace it with a short numerical run of the coast. That is why $ZEM$ and $ZEV$ — not one fixed formula — are what powered-descent guidance really carries around. The constant-gravity formula is the special case simple enough to derive a law from by hand.

::: example A coasting path that already lands needs no command
Lunar gravity, $\mathbf{g} = (0, 0, -1.62)\,\mathrm{m/s^2}$. The lander is at $\mathbf{r} = (0, 0, 1000)\,\mathrm{m}$, moving at $\mathbf{v} = (5, 0, 0)\,\mathrm{m/s}$, with $t_{go} = 20\,\mathrm{s}$.

Set the target to exactly where coasting would take it. Then compute $ZEM$, $ZEV$ and the command from the law we are about to derive:

```python
import numpy as np
g = np.array([0.0, 0.0, -1.62])
r = np.array([0.0, 0.0, 1000.0]); v = np.array([5.0, 0.0, 0.0]); tgo = 20.0
r_f = r + v * tgo + 0.5 * g * tgo**2
v_f = v + g * tgo
zem = r_f - (r + v * tgo + 0.5 * g * tgo**2)
zev = v_f - (v + g * tgo)
print(zem, zev, (6 / tgo**2) * zem - (2 / tgo) * zev)
# [0. 0. 0.] [0. 0. 0.] [0. 0. 0.]
```

All three are exactly zero. The law commands nothing when nothing is needed — the same comfort the collision-course principle gave proportional navigation.
:::

## The feedback law

Here is the law, before the proof:

::: key The ZEM/ZEV feedback law
$$
\mathbf{a} = \frac{6}{t_{go}^2}\,ZEM - \frac{2}{t_{go}}\,ZEV .
$$
The minimum-energy solution for a double integrator with both terminal position and velocity constrained. $\mathbf{a}$ is the *total* thrust acceleration to command right now. It already accounts for gravity, because $ZEM$ and $ZEV$ were built by coasting under the true gravity, not by ignoring it.
:::

Read it as two corrections added together.

The first term, $6\,ZEM/t_{go}^2$, pushes toward where you need to be. The less time is left, the harder it pushes. That part feels natural.

The second term has a *minus* sign, which looks strange. Why push *against* a velocity error? Here is the picture. Suppose your position is already on track ($ZEM = 0$) but you will arrive too slow. If you push forward now, you speed up — but you also move ahead of the plan, and ruin the position. The fix is a two-part move: ease off a little first, then push harder later. Done right, the position gains and losses cancel while the speed comes out right. The optimal command in that case starts at $-2\,ZEV/t_{go}$ and ramps up in a straight line to $+4\,ZEV/t_{go}$ at the end. The average is $+ZEV/t_{go}$, which fixes the velocity, and the position shift adds up to exactly zero.

::: warning Do not add a hover term on top
It is tempting to command "gravity cancel plus correction". Do not. Gravity is already inside $ZEM$ and $ZEV$, because the coast used the real $\mathbf{g}$. The law's $\mathbf{a}$ is the whole thrust acceleration. Adding $-\mathbf{g}$ on top would count gravity twice.
:::

### Where the numbers 6 and 2 come from

Look at one axis. The vertical motion obeys $\dot x_1 = x_2$ and $\dot x_2 = g + u$, where $x_1$ is height, $x_2$ is vertical velocity and $u$ is thrust acceleration. We want to spend the least effort, $\tfrac12\int_0^{T}u^2\,ds$, while landing with $x_1(T) = r_f$ **and** $x_2(T) = v_f$. Here $T = t_{go}$ and $s$ counts seconds from now.

This is lesson 5's minimum-energy problem with one more condition at the end. There, the final velocity was free, which forced its costate to end at zero. Here both ends are pinned, so neither costate is forced to zero. Both are set by the two landing conditions instead. Mathematicians call this a **[[two-point boundary value problem|tpbvp]]**: conditions at the start *and* the end.

The Hamiltonian machinery works as before. It gives $u^\star(s) = -\lambda_2(s)$, with $\lambda_1 = c_1$ constant and $\lambda_2(s) = A - c_1 s$ for two constants $A$ and $c_1$. So the best command is a [[straight line in time|ramp-picture]]:

$$
u^\star(s) = -A + c_1 s .
$$

Two unknowns, two landing conditions. Solving them (the note below does every step) gives

$$
c_1 = -\frac{12}{T^3}\left(ZEM - \frac{T\,ZEV}{2}\right), \qquad A = -\frac{6}{T^2}ZEM+\frac{2}{T}ZEV.
$$

The command right now is $u^\star(0) = -A$, which is

$$
u^\star(0) = \frac{6}{T^2}\,ZEM - \frac{2}{T}\,ZEV .
$$

Each axis works the same way, so the vector law follows.

::: note Why it has to be true: solving for A and c₁
Gravity is in the coasting part. The thrust adds extra velocity and extra position on top.

**Velocity.** The extra velocity from thrust is $\int_0^T u\,ds = \int_0^T(-A + c_1 s)\,ds = -AT + \tfrac12 c_1 T^2$. This must make up the velocity gap, so

$$
-AT + \tfrac12 c_1 T^2 = ZEV.
$$

**Position.** A push at time $s$ has $T - s$ seconds to turn into extra position. So the extra position is

$$
\int_0^T (T-s)(-A + c_1 s)\,ds = -A\frac{T^2}{2} + c_1\left(\frac{T^3}{2} - \frac{T^3}{3}\right) = -\frac{AT^2}{2} + \frac{c_1T^3}{6}.
$$

This must make up the position gap: $-\tfrac12 AT^2 + \tfrac16 c_1 T^3 = ZEM$.

**Solve.** From the velocity line, $A = \tfrac12 c_1 T - ZEV/T$. Put that into the position line:

$$
-\frac{T^2}{2}\left(\frac{c_1T}{2} - \frac{ZEV}{T}\right) + \frac{c_1T^3}{6} = -\frac{c_1T^3}{4} + \frac{T\,ZEV}{2} + \frac{c_1T^3}{6} = -\frac{c_1T^3}{12} + \frac{T\,ZEV}{2} = ZEM.
$$

So $c_1 = -\dfrac{12}{T^3}\left(ZEM - \dfrac{T\,ZEV}{2}\right)$. Put it back: $A = \tfrac12 c_1 T - ZEV/T = -\dfrac{6\,ZEM}{T^2} + \dfrac{3\,ZEV}{T} - \dfrac{ZEV}{T} = -\dfrac{6\,ZEM}{T^2} + \dfrac{2\,ZEV}{T}$.

**Check the picture from above.** With $ZEM = 0$: $c_1 = 6\,ZEV/T^2$ and $A = 2\,ZEV/T$. So $u$ starts at $-2\,ZEV/T$ and ends at $-2\,ZEV/T + 6\,ZEV/T = 4\,ZEV/T$, as promised.
:::

## Flying it: two landings

A [[real guidance computer|apollo-lineage]] does not compute the command once. Every cycle it measures the state, recomputes $ZEM$, $ZEV$ and $\mathbf{a}$ with the new, smaller $t_{go}$, and sends that. Because the law is optimal from *any* state, recomputing it never changes the plan when nothing goes wrong — and fixes the plan when something does.

::: example A lunar descent, flown to touchdown
Take a two-dimensional descent: downrange and up. The lander starts at $\mathbf{r}_0 = (300, 1500)\,\mathrm{m}$ with velocity $\mathbf{v}_0 = (-8, -40)\,\mathrm{m/s}$. The target is the origin, at rest: $\mathbf{r}_f = \mathbf{v}_f = (0, 0)$. Time to go is $45\,\mathrm{s}$ and $\mathbf{g} = (0, -1.62)\,\mathrm{m/s^2}$.

**Coast prediction.** $\mathbf{r} + \mathbf{v}t_{go} = (300 - 360,\ 1500 - 1800) = (-60, -300)$. Gravity adds $\tfrac12(-1.62)(45^2) = -1640.25$ to the height. So coasting ends at $(-60, -1940.25)\,\mathrm{m}$ — nearly two kilometers underground.

**ZEM and ZEV.** $ZEM = (0,0) - (-60, -1940.25) = (60.0,\ 1940.25)\,\mathrm{m}$. The coast velocity is $(-8,\ -40 - 72.9) = (-8, -112.9)$, so $ZEV = (8.0,\ 112.9)\,\mathrm{m/s}$.

**Command.** $6/45^2 = 0.002963$ and $2/45 = 0.04444$. So

$$
\mathbf{a} = 0.002963\,(60,\ 1940.25) - 0.04444\,(8,\ 112.9) = (0.178 - 0.356,\ 5.749 - 5.018) = (-0.178,\ 0.731)\,\mathrm{m/s^2}.
$$

That is a gentle $0.75\,\mathrm{m/s^2}$ in total, with most of it upward. Sanity check: $0.731$ is less than lunar gravity's $1.62$, so the lander keeps speeding up its fall for now. With $45\,\mathrm{s}$ left, it has time.

**Closed loop to touchdown.** Now fly it, recomputing every millisecond:

```python
import numpy as np

def zem_zev(r, v, r_f, v_f, g, tgo):
    zem = r_f - (r + v * tgo + 0.5 * g * tgo**2)
    zev = v_f - (v + g * tgo)
    return zem, zev

def land(r, v, g, T, dt=0.001):
    r_f = v_f = np.zeros(2)
    peak = dv = 0.0
    for i in range(int(round(T / dt))):
        tgo = T - i * dt                      # counts down to one step, never 0
        zem, zev = zem_zev(r, v, r_f, v_f, g, tgo)
        a = 6 / tgo**2 * zem - 2 / tgo * zev  # recomputed every step
        r = r + v * dt + 0.5 * (g + a) * dt**2
        v = v + (g + a) * dt
        peak = max(peak, np.linalg.norm(a))
        dv += np.linalg.norm(a) * dt           # delta-v spent
    return r, v, peak, dv

r, v, peak, dv = land(np.array([300.0, 1500.0]), np.array([-8.0, -40.0]),
                      np.array([0.0, -1.62]), 45.0)
print(np.linalg.norm(r) < 1e-9, np.linalg.norm(v) < 1e-9, round(peak, 2), round(dv, 1))
# True True 4.32 113.4
```

The final position and velocity errors come out around $10^{-17}\,\mathrm{m}$ and $10^{-13}\,\mathrm{m/s}$ — computer [[round-off|round-off]], not "close". The command grows from $0.75\,\mathrm{m/s^2}$ to a peak of $4.32\,\mathrm{m/s^2}$ at touchdown, as the $6/t_{go}^2$ and $2/t_{go}$ gains grow. That rising braking burn is exactly the shape of a real lunar landing. The whole descent spends about $113\,\mathrm{m/s}$ of [[delta-v|energy-vs-fuel]].
:::

::: example A Mars descent, same law, different gravity
Start at $\mathbf{r}_0 = (650, 2200)\,\mathrm{m}$ with $\mathbf{v}_0 = (-15, -60)\,\mathrm{m/s}$, $t_{go} = 40\,\mathrm{s}$ and [[Mars gravity|mars-powered]] $\mathbf{g}$ = (0, -3.71)\,\mathrm{m/s^2}$. Nothing in the law changes except the gravity fed into $ZEM$ and $ZEV$.

**Coast.** $\mathbf{r} + \mathbf{v}t_{go} = (650 - 600,\ 2200 - 2400) = (50, -200)$, and gravity adds $\tfrac12(-3.71)(1600) = -2968$ to the height: $(50, -3168)$.

**ZEM and ZEV.** $ZEM = (-50.0,\ 3168.0)\,\mathrm{m}$. Coast velocity is $(-15,\ -60 - 148.4) = (-15, -208.4)$, so $ZEV = (15.0,\ 208.4)\,\mathrm{m/s}$.

**Command.** $6/1600 = 0.00375$ and $2/40 = 0.05$:

$$
\mathbf{a} = 0.00375\,(-50,\ 3168) - 0.05\,(15,\ 208.4) = (-0.188 - 0.750,\ 11.880 - 10.420) = (-0.938,\ 1.460)\,\mathrm{m/s^2}.
$$

**Closed loop.** Flying it with the same code (`land` with these numbers) lands to round-off again, with a peak command of $9.12\,\mathrm{m/s^2}$ and about $211\,\mathrm{m/s}$ of delta-v.

**Sanity check.** Mars gravity is $3.71/1.62 = 2.29$ times the Moon's, and this lander also starts faster. The peak is $9.12/4.32 = 2.11$ times the lunar one, and the delta-v about $1.9$ times — the same ballpark, as you would expect. The derivation never cared which world the lander was over; only the number for $\mathbf{g}$ changed.
:::

## Why these particular gains

The $6/t_{go}^2$ and $-2/t_{go}$ are not a different idea from PN's $3/t_{go}^2$. They come from the same construction as the last lesson, with a richer price list.

Last lesson priced only the miss: $\mathbf{Q}_f = \operatorname{diag}(q_f, 0)$. Price both position *and* velocity at the end, $\mathbf{Q}_f = \operatorname{diag}(q_f, q_f)$, and solve the Riccati equation. You get a family of gains. As $q_f \to \infty$ they settle on exactly this law.

In terms of the state (no gravity, target at rest at the origin), the law reads $u = -\tfrac{6}{T^2}x_1 - \tfrac{4}{T}x_2$. Solving the Riccati equation numerically at $T = 5\,\mathrm{s}$ with $q_f = 10^6$ gives gains $0.2400$ and $0.8000$ — and $6/25 = 0.24$ and $4/5 = 0.8$.

The extra condition is what changes the numbers. Pinning velocity takes away a freedom that the intercept problem had. The optimizer pays for that with bigger gains close to $t_{go} = 0$ — which is the steep late rise in command that both landings showed.

::: warning ZEM/ZEV needs t_go from somewhere else
Every piece of this law — $ZEM$, $ZEV$, the $1/t_{go}^2$ and $1/t_{go}$ gains — needs $t_{go}$. Nothing in this lesson said where that number comes from; both examples simply chose it. It matters more here than almost anywhere: the gains blow up as $t_{go} \to 0$, so a wrong $t_{go}$ near touchdown is not a small error. Lesson 10 takes this on.
:::

## Check yourself

::: check
Define zero-effort miss and zero-effort velocity in one sentence each, without using the constant-gravity formula.
:::

::: answer
Zero-effort miss is the position error you would have at the planned arrival time if you applied no more control from now on: the gap between the target position and where coasting under the true, uncontrolled dynamics would leave you.

Zero-effort velocity is the same idea for velocity: the gap between the target velocity and the velocity coasting would leave you with.

Neither definition mentions gravity. The idea is "run the uncontrolled dynamics forward, whatever they are". The constant-gravity formula is only the closed form that one case happens to have.
:::

::: check
One vertical axis, up positive: $r = 500\,\mathrm{m}$, $v = -25\,\mathrm{m/s}$, target $r_f = v_f = 0$, $t_{go} = 15\,\mathrm{s}$, Mars gravity $g = -3.71\,\mathrm{m/s^2}$. Find $ZEM$, $ZEV$ and the commanded acceleration. What does the sign of the command tell you?
:::

::: answer
**Coast position:** $500 + (-25)(15) + \tfrac12(-3.71)(15^2) = 500 - 375 - 417.375 = -292.375\,\mathrm{m}$. So $ZEM = 0 - (-292.375) = 292.375\,\mathrm{m}$.

**Coast velocity:** $-25 + (-3.71)(15) = -25 - 55.65 = -80.65\,\mathrm{m/s}$. So $ZEV = 80.65\,\mathrm{m/s}$.

**Command:** $\dfrac{6}{225}(292.375) - \dfrac{2}{15}(80.65) = 7.797 - 10.753 = -2.957\,\mathrm{m/s^2}$.

The command is *negative*: thrust pointing down, pushing the lander toward the ground faster. That is not a mistake in the arithmetic. To be on the ground in exactly $15\,\mathrm{s}$, the lander must average $500/15 = 33.3\,\mathrm{m/s}$ downward, but it is only doing $25\,\mathrm{m/s}$. So the minimum-energy plan speeds up first, then brakes hard: the command crosses zero after about $2.7\,\mathrm{s}$ and reaches $+13.7\,\mathrm{m/s^2}$ at touchdown.

A real lander's engine can only push up, so it cannot fly this. The real message is that $t_{go} = 15\,\mathrm{s}$ is too long for this state. A shorter, better-chosen $t_{go}$ would give an upward command throughout — one more reason why choosing $t_{go}$ well matters.
:::

::: check
ZEM/ZEV guidance uses $6/t_{go}^2$ and $-2/t_{go}$, while PN uses $3/t_{go}^2$. Both are called "the minimum-energy law". Why are the numbers different?
:::

::: answer
They solve different problems. PN's derivation left the final velocity free — hit the target, arrive at any speed. That is one condition at the end.

ZEM/ZEV pins both the final position *and* the final velocity. That is one more condition, which makes a two-point boundary value problem with less freedom in how the path can end. Meeting both conditions at once takes a stronger, differently shaped correction, and $6/t_{go}^2$ with $-2/t_{go}$ is what that harder optimization produces.

Each is the minimum-energy law for its own problem. The problems are not the same.
:::

::: check
Why is the ZEM/ZEV command $\mathbf{a}$ the *entire* thrust acceleration, rather than a correction to add on top of a separate thrust that cancels gravity?
:::

::: answer
Because gravity is already inside $ZEM$ and $ZEV$. The coast prediction $\mathbf{r}+\mathbf{v}t_{go}+\tfrac12\mathbf{g}t_{go}^2$ used the real $\mathbf{g}$, not zero. So the errors the law reacts to are the errors *after* gravity has been counted.

The derivation says the same thing. The dynamics were $\dot x_2 = g + u$, with $u$ the only control. Solving for $u^\star$ gave the law directly; there was never a separate "hover" term. Adding one would count gravity twice and give the wrong command.
:::

::: check
In the Mars example, the peak command was about double the lunar one, and Mars gravity is about $2.3$ times the Moon's. Does the law guarantee that the peak scales with gravity?
:::

::: answer
No. The peak depends on $t_{go}$ and on the starting $ZEM$ and $ZEV$, and those depend on the whole starting state — height, speed, sideways offset, flight time — not on gravity alone.

In these two examples the starting conditions were broadly similar (similar descent geometry, similar $t_{go}$), so gravity's effect showed through. A lunar and a Martian descent that start from very different conditions could easily have peaks that do not follow the gravity ratio at all.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Zero-effort miss | $ZEM = \mathbf{r}_f - (\mathbf{r}+\mathbf{v}t_{go}+\tfrac12\mathbf{g}t_{go}^2)$: the final position error if no more control is applied |
| Zero-effort velocity | $ZEV = \mathbf{v}_f - (\mathbf{v}+\mathbf{g}t_{go})$: the matching velocity error |
| ZEM/ZEV feedback law | $\mathbf{a} = (6/t_{go}^2)\,ZEM - (2/t_{go})\,ZEV$, the whole thrust acceleration |
| Where it comes from | minimum energy for a double integrator with final position and velocity both pinned |
| Shape of the plan | thrust is a straight line in time, $u = -A + c_1 s$ |
| Link to PN | the same infinite-weight limit, with a terminal cost on both states |
| Beyond constant $g$ | propagate the real uncontrolled dynamics for $ZEM$, $ZEV$; only the closed form is gravity-specific |

Both landings simply assumed a value for $t_{go}$. Before tackling where that number comes from, the next lesson asks a different question: when real disturbances hit a guidance loop, how much miss does each one cause, and does it matter *when* it hits?

::: context propagate "Propagate the dynamics"
To propagate means to run the equations of motion forward in time on a computer, step by step, starting from the current state. Guidance engineers say "propagate" all the time: propagate the orbit, propagate the coast. For $ZEM$ and $ZEV$ you propagate with the engine off, keeping every force you cannot turn off — gravity, drag, even the planet's rotation — and read off where the vehicle ends up. For constant gravity you can skip the computer and use the formula. For anything more realistic, a few hundred small steps do the job, fast enough to repeat every guidance cycle.
:::

::: context tpbvp Conditions at both ends
Most physics problems are "initial value" problems: you know how things start and ask what happens. A two-point boundary value problem knows some things at the start and some at the end, and asks for the path that joins them. Throwing a ball to a friend is one: you know where it starts and where it must arrive, and you must find the throw. Guidance is full of these, which is why lesson 2 described explicit guidance as re-solving a boundary value problem every cycle. The ZEM/ZEV law is special because this one can be solved in closed form, in a few multiplications.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="130" x2="340" y2="130" stroke="#6c7a93" stroke-width="1.5"/>
  <path d="M 40 30 Q 200 40 300 128" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="40" cy="30" r="5" fill="#1f2a44"/>
  <line x1="40" y1="30" x2="85" y2="45" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="85,45 74,46 78,38" fill="#1f2a44"/>
  <text x="40" y="18" font-size="11" fill="#1f2a44">known: start position and velocity</text>
  <circle cx="300" cy="128" r="5" fill="#b4232c"/>
  <text x="300" y="112" font-size="11" fill="#b4232c" text-anchor="end">known: land here, at rest</text>
  <text x="150" y="95" font-size="11" fill="#1d6fd1" text-anchor="middle">find the path between</text>
</svg>
```
:::

::: context ramp-picture What the thrust plan looks like
The minimum-energy thrust is a straight line in time. For the lunar example, the upward part starts at $0.73\,\mathrm{m/s^2}$ and climbs steadily to $4.29\,\mathrm{m/s^2}$ at touchdown. The dashed line is lunar gravity, $1.62$: below it the lander's fall still speeds up; above it the lander brakes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="330" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="150" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="190" y="172" font-size="11" fill="#1f2a44" text-anchor="middle">time (0 to 45 s)</text>
  <text x="44" y="154" font-size="11" fill="#6c7a93" text-anchor="end">0</text>
  <text x="44" y="41" font-size="11" fill="#6c7a93" text-anchor="end">4.3</text>
  <line x1="50" y1="107" x2="330" y2="107" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="54" y="101" font-size="11" fill="#6c7a93">gravity 1.62</text>
  <line x1="50" y1="131" x2="330" y2="37" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="240" y="85" font-size="11" fill="#1d6fd1">upward thrust</text>
  <text x="332" y="30" font-size="11" fill="#1d6fd1" text-anchor="end">4.29</text>
</svg>
```
:::

::: context apollo-lineage Guidance that recomputes itself
The idea of recomputing the command every cycle from the current state, the target and the time left is old. The Apollo lunar module's descent guidance, designed at MIT, worked the same way: every two seconds the onboard computer took the latest navigation state and computed a fresh command toward a target state at a chosen time-to-go. Modern ZEM/ZEV papers generalize that pattern and connect it cleanly to optimal control.
:::

::: context round-off Why the error is not exactly zero
A computer stores each number with about 16 significant digits. Every multiplication rounds the last digit a little. After forty-five thousand guidance steps, those tiny roundings leave a position error near $10^{-17}\,\mathrm{m}$ — far smaller than an atom. Engineers call that "round-off" and read it as "exactly right, as far as this computer can tell". A real landing is limited by other things long before round-off: navigation error, engine response, wind, and the lag between command and thrust.
:::

::: context energy-vs-fuel Minimum energy is not minimum fuel
Delta-v is the total change in velocity the engine produces, the sum of $|\mathbf{a}|$ over the flight. Propellant used grows with delta-v. The ZEM/ZEV law minimizes $\int u^2$ — "energy" — not $\int |u|$, which tracks fuel. Squares punish big pushes, so the energy-optimal plan spreads thrust out smoothly. The truly fuel-optimal landing with a throttle range tends to run the engine at full, then minimum, then full thrust. ZEM/ZEV usually costs a little more propellant, in exchange for a closed-form law you can compute every cycle. This course's exercise asks you to measure that gap.
:::

::: context mars-powered Why Mars landings end on rockets
Mars has an atmosphere, but a thin one: the pressure at the surface is less than one percent of Earth's. Heat shields and parachutes remove most of the arrival speed, but not enough to land a heavy vehicle gently. So every heavy Mars lander finishes on rocket thrust, steering to a chosen spot in the last minute or so of flight. That final phase is a powered-descent guidance problem of exactly the kind this lesson solves, with Mars gravity of about $3.71\,\mathrm{m/s^2}$ in place of the Moon's $1.62$.
:::
