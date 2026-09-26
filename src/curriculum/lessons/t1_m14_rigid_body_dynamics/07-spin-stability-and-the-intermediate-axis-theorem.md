---
id: l07-spin-stability-and-the-intermediate-axis-theorem
title: Spin stability and the intermediate axis theorem
minutes: 22
covers:
  - major/minor axis spin stability and the intermediate axis theorem
---

Grab a hardback book, snap a rubber band around it so it stays shut, and toss it up spinning. A book has [[three natural axes|book-axes]]. Spin it about the long axis, the one running along the spine, and it comes back down spinning the same way. Spin it about the axis that pokes straight out through the cover, and it also comes back cleanly. Now spin it about the third axis, the one lying flat in the cover and running across the book from the spine to the open edge. It flips over in mid-air — half a turn — no matter how carefully you let go.

The same thing happens to a tennis racket, to a wing nut spinning off its bolt in weightlessness — the effect is sometimes named after the [[cosmonaut who noticed it|dzhanibekov]] — and to any spacecraft spun about the wrong axis. For a GNC engineer that is not a party trick. A satellite spun up after separation, or left turning slowly after a slew with its controller off, can end up upside down.

This lesson proves the rule from Euler's equations. The proof is short. Zoom in on a steady spin, and the small sideways rates obey the equation of a spring. That "spring" is stiff for the axis of largest inertia and for the axis of smallest inertia. For the middle axis it pushes the wrong way, and a spring that pushes the wrong way makes things run away exponentially. Then you will time the flip, reproduce it in Python, and see what the result does not promise — because the next lesson shows that half of it fails on every real spacecraft.

::: video 1VPfZ_XzisU
The Bizarre Behavior of Rotating Bodies · Veritasium · 14 min
:::

## What "stable" means here

Picture a marble. At the bottom of a bowl, a nudge rolls it up the side and back. On top of an upside-down bowl, a nudge rolls it off for good. The marble *can* sit still in both spots. The difference is what a small nudge does.

A spin is the same kind of thing. Recall the torque-free Euler equations in principal axes (lesson 5), with $I_1, I_2, I_3$ the principal moments and $\omega_1, \omega_2, \omega_3$ the body rates:

$$
I_1\dot{\omega}_1 = (I_2 - I_3)\,\omega_2\omega_3, \qquad
I_2\dot{\omega}_2 = (I_3 - I_1)\,\omega_3\omega_1, \qquad
I_3\dot{\omega}_3 = (I_1 - I_2)\,\omega_1\omega_2 .
$$

Put $\omega_1 = \omega_2 = 0$ and $\omega_3 = n$, a pure spin at rate $n$ about axis 3. Every right-hand side is a product with a zero in it, so nothing changes. A pure spin about any principal axis is an **equilibrium** — a state that, left exactly alone, stays put.

But no real body is released exactly. There are always small rates $\omega_1$ and $\omega_2$ as well — the **transverse** rates, meaning the ones sideways to the spin axis. So the real question is the marble's question. Call the spin **stable** if small transverse rates stay small forever, and **unstable** if they grow.

This is **[[stability in Lyapunov's sense|lyapunov]]**: staying close, not settling back. A torque-free rigid body keeps its energy, so nothing can die away. The best a stable spin can do is wobble with a small, fixed size — the small polhode loop of lesson 6. An unstable spin leaves the neighborhood completely. For a rigid body it runs along the separatrix of lesson 6 to the opposite pole and back again.

## Linearizing Euler's equations about a spin

Zoom in far enough on any smooth curve and it looks like a straight line. That trick, keeping only the straight-line part of an equation near a point, is called **[[linearizing|linearize]]**. Here the "point" is the steady spin.

Suppose the body spins mostly about axis 3:

$$
\omega_3 = n + \epsilon_3, \qquad \omega_1, \omega_2, \epsilon_3 \ \text{small}.
$$

($\epsilon_3$, read "epsilon three", is a small change in the spin rate.)

**Step 1: the spin rate stays put.** The third equation is $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2$. Its right-hand side is one small number times another small number. If each is a thousandth, their product is a millionth — "second order small". To first order, then, $\dot{\omega}_3 = 0$, and $\omega_3 = n$ stays constant.

**Step 2: the two sideways equations.** In the first two equations, replace $\omega_3$ by $n$ and keep only terms with one small factor:

$$
I_1\dot{\omega}_1 = (I_2 - I_3)\,n\,\omega_2, \qquad
I_2\dot{\omega}_2 = (I_3 - I_1)\,n\,\omega_1 .
$$

These are linear — no products of unknowns — with constant coefficients.

**Step 3: combine them.** Take the time derivative of the first equation. That puts $\dot{\omega}_2$ on the right. Then use the second equation to replace $\dot{\omega}_2$ by $(I_3 - I_1)\,n\,\omega_1/I_2$:

$$
I_1\ddot{\omega}_1 = (I_2 - I_3)\,n\,\dot{\omega}_2 = (I_2 - I_3)\,n\,\frac{(I_3 - I_1)\,n}{I_2}\,\omega_1 .
$$

**Step 4: tidy up.** Divide by $I_1$, and move the minus sign so that $(I_2 - I_3)$ becomes $-(I_3 - I_2)$:

$$
\ddot{\omega}_1 = -k\,\omega_1, \qquad
k = n^2\,\frac{(I_3 - I_2)(I_3 - I_1)}{I_1 I_2} .
$$

The same steps, starting from the second equation, give the same equation for $\omega_2$ with the same $k$.

Now read it. $\ddot{\omega}_1 = -k\,\omega_1$ is the equation of a mass on a spring: the "pull back" is proportional to how far you are from zero. It is a **[[harmonic oscillator|spring-or-hill]]**, and $k$ is its **stiffness** — how hard it pulls back. The whole theorem is in the sign of $k$. The factor $n^2$ is positive, and so is $I_1 I_2$. So $k$ has the sign of the product $(I_3 - I_2)(I_3 - I_1)$:

- If $I_3$ is the **largest** moment, both factors are positive, so $k > 0$. The solution is $\omega_1 = A\cos(\sqrt{k}\,t + \phi)$: the sideways rate swings back and forth with constant size $A$. Stable.
- If $I_3$ is the **smallest**, both factors are negative. Negative times negative is positive, so $k > 0$ again. Stable.
- If $I_3$ is the **intermediate** (middle) moment, one factor is positive and the other negative, so $k < 0$. The spring pushes outward, and the solution is $\omega_1 = A\,e^{\sqrt{|k|}\,t} + B\,e^{-\sqrt{|k|}\,t}$. Unless the start happens to sit exactly on the dying branch ($A = 0$ exactly), the first term grows exponentially. Unstable.

That is the proof. The instability comes from one identifiable step: the sign of $(I_3 - I_2)(I_3 - I_1)$. That product is negative only when $I_3$ sits between the other two.

::: key The intermediate axis theorem
Torque-free rotation about the major (largest $I$) or minor (smallest $I$) principal axis is stable: small perturbations oscillate with bounded amplitude. Rotation about the intermediate axis is unstable: perturbations grow exponentially and the body periodically flips end over end.
:::

::: key Proof of the intermediate axis theorem
Linearize Euler's equations about a spin $\omega_3 = n$ on axis 3. The transverse pair obeys $\ddot{\omega}_1 = -k\,\omega_1$ with $k = n^2(I_3 - I_2)(I_3 - I_1)/(I_1I_2)$. If $I_3$ is largest or smallest both factors share a sign, so $k > 0$ and the motion is a bounded oscillation at frequency $\sqrt{k}$. If $I_3$ is intermediate the signs differ, $k < 0$, and the solution grows as $e^{\sqrt{|k|}\,t}$.
:::

::: warning Relabel so the spin axis is "3"
The formula for $k$ is written for a spin about axis 3. To test a spin about axis 1 or axis 2, put the spin axis's moment where $I_3$ is and the other two moments where $I_1$ and $I_2$ are. Which of the other two goes first does not matter — the formula treats them the same way. Forgetting to relabel, and plugging a spin about axis 2 straight into the axis-3 formula, is the usual way to get the wrong sign.
:::

## Rates, time scales and the flip

### A stable spin: how fast the wobble goes round

For a stable axis, $\sqrt{k}$ (in radians per second) is the frequency at which the sideways rate circulates, seen from the body. It is the rate at which $\boldsymbol{\omega}$ runs around its small polhode loop.

Check it against something you already know. For an axisymmetric body, $I_1 = I_2 = I_t$ ("I sub t", the transverse moment), and the formula gives $\sqrt{k} = n\,|I_3 - I_t|/I_t$. That is $|\lambda|$, the body-frame precession rate of lesson 6. It must be, since both describe the same motion.

The loop is not always a circle. The first linear equation says how big $\omega_2$ gets compared with $\omega_1$: its peak is $\omega_1$'s peak times

$$
\sqrt{\frac{I_1(I_3 - I_1)}{I_2(I_3 - I_2)}} .
$$

So in the $(\omega_1, \omega_2)$ plane the loop is an ellipse. It is a circle only when $I_1 = I_2$, which makes that square root equal to $1$.

### An unstable spin: how fast it runs away

For the intermediate axis, write $\sigma = \sqrt{|k|}$ ("sigma"), the **growth rate**. The sideways rate multiplies by $e \approx 2.718$ every $1/\sigma$ seconds; that span is one **[[e-folding time|e-folding]]**.

Start from a small sideways rate $\epsilon$. When has it grown to the size of the spin itself, $n$? Solve $\epsilon\,e^{\sigma t} = n$ for $t$: take the natural log of both sides to get $\sigma t = \ln(n/\epsilon)$, so

$$
t_{\mathrm{flip}} \approx \frac{1}{\sigma}\ln\frac{n}{\epsilon} .
$$

By then the linear model has long since stopped being accurate, and the body is visibly tumbling.

The logarithm is the important part. It grows very slowly. Make the starting nudge a thousand times smaller and you delay the flip by only $\ln 1000/\sigma \approx 7/\sigma$ — about seven e-folding times. There is no practical way to keep a body spinning about its intermediate axis by being careful when you let go.

### What happens after the growth

The linear model predicts growth forever, which cannot be right: energy and angular momentum are both fixed. Go back to the polhode picture of lesson 6.

The intermediate-axis spin sits exactly where the separatrix crosses itself. A start just next to it lies on a polhode that follows the separatrix around the momentum sphere to the *opposite* intermediate pole. In body terms, the spin swings from $+n$ about axis 3 to $-n$ about axis 3. On the way, for a moment, the sideways rates carry the whole spin. The body has turned over.

Near either pole the motion is slow, so the body lingers near $-n$ for a while, then swings back. The result is a [[regular sequence of flips|flip-history]]: each one quick, with long stretches of nearly steady spin in between. The time between flips depends on how close the start was to the separatrix. All the way through, $H$ and $T$ stay exactly constant. The flip loses nothing. The body is just exploring the whole polhode it was released on.

## Reproducing the flip numerically

The body with $\mathbf{I} = \mathrm{diag}(1, 2, 3)\,\mathrm{kg\,m^2}$ is this module's standard test case. ($\mathrm{diag}(1, 2, 3)$ means the diagonal matrix with $1, 2, 3$ on the diagonal: principal moments $1$, $2$ and $3$.) Work out $k$ for each axis, relabeling each time so the spin axis plays the part of "3":

- **About axis 3 (major):** $k = n^2\,\dfrac{(3 - 2)(3 - 1)}{1\times 2} = n^2\,\dfrac{2}{2} = n^2$.
- **About axis 1 (minor):** put $I = 1$ in the "3" slot and $2, 3$ in the others: $k = n^2\,\dfrac{(1 - 2)(1 - 3)}{2\times 3} = n^2\,\dfrac{(-1)(-2)}{6} = \dfrac{n^2}{3}$.
- **About axis 2 (intermediate):** $k = n^2\,\dfrac{(2 - 3)(2 - 1)}{1\times 3} = n^2\,\dfrac{(-1)(1)}{3} = -\dfrac{n^2}{3}$.

With $n = 1\,\mathrm{rad/s}$: an oscillation at $\sqrt{1} = 1\,\mathrm{rad/s}$ about the major axis, an oscillation at $\sqrt{1/3} = 0.577\,\mathrm{rad/s}$ about the minor axis, and growth at $\sigma = 0.577\,\mathrm{s^{-1}}$ about the intermediate axis.

The code below steps the full equations forward with the **[[fourth-order Runge–Kutta|rk4]]** method and finds when $\omega_2$ changes sign — the flips.

```python
import numpy as np

def euler_deriv(w, I):
    return np.array([(I[1] - I[2]) * w[1] * w[2] / I[0],
                     (I[2] - I[0]) * w[2] * w[0] / I[1],
                     (I[0] - I[1]) * w[0] * w[1] / I[2]])

def propagate(w, I, dt, t_end):
    out = [w.copy()]
    for _ in range(int(round(t_end / dt))):
        k1 = euler_deriv(w, I)
        k2 = euler_deriv(w + 0.5 * dt * k1, I)
        k3 = euler_deriv(w + 0.5 * dt * k2, I)
        k4 = euler_deriv(w + dt * k3, I)
        w = w + dt / 6 * (k1 + 2 * k2 + 2 * k3 + k4)
        out.append(w.copy())
    return np.array(out)

I = np.array([1.0, 2.0, 3.0])
hist = propagate(np.array([0.001, 1.0, 0.001]), I, 0.001, 60.0)
t = np.arange(hist.shape[0]) * 0.001
flips = t[1:][np.diff(np.sign(hist[:, 1])) != 0]
print(np.round(flips, 1))                      # [14.9 42.4]
H = np.linalg.norm(hist * I, axis=1)
T = 0.5 * np.sum(hist**2 * I, axis=1)
print(np.ptp(H) / H[0], np.ptp(T) / T[0])      # ~2e-14 and ~4e-14
```

::: example The unit body about its intermediate axis
Release $\mathbf{I} = \mathrm{diag}(1, 2, 3)$ with $\boldsymbol{\omega} = (0.001, 1.0, 0.001)\,\mathrm{rad/s}$. That is a spin of $1\,\mathrm{rad/s}$ about the intermediate axis, with a nudge of one tenth of one percent on each of the other two.

**Growth rate.** $\sigma = \sqrt{1/3} = 0.577\,\mathrm{s^{-1}}$, so one e-folding time is $1/0.577 = 1.73\,\mathrm{s}$.

**Test the linear theory first.** Here the spin axis is 2, so the linear equation for $\omega_1$ reads $I_1\dot{\omega}_1 = (I_2 - I_3)\,n\,\omega_3$. At the start, $\dot{\omega}_1(0) = (2 - 3)\times 1\times 0.001/1 = -0.001\,\mathrm{rad/s^2}$. A solution of $\ddot{\omega}_1 = \sigma^2\omega_1$ that matches the starting value and starting slope is

$$
\omega_1(t) = \omega_1(0)\cosh\sigma t + \frac{\dot{\omega}_1(0)}{\sigma}\sinh\sigma t
$$

($\cosh$ and $\sinh$ are the [[hyperbolic cosine and sine|cosh-sinh]]). The second coefficient is $-0.001/0.577 = -0.001732$. At $t = 5\,\mathrm{s}$, $\sigma t = 2.887$, so

$$
\omega_1(5\,\mathrm{s}) = 0.001\cosh 2.887 - 0.001732\sinh 2.887 = -0.00649\,\mathrm{rad/s}.
$$

The integrator gives $-0.00649$. While the nudge is small, the linear model is right to three figures.

**Then watch it fail.** The linear estimate of the flip time is $\ln(1/0.001)/0.577 = 6.91/0.577 = 12\,\mathrm{s}$. The simulation shows $\omega_2$ changing sign at $t = 14.9\,\mathrm{s}$ and again at $42.4\,\mathrm{s}$ — the same size as the estimate, which is all a rough estimate promises. Between those times the body spins at $\omega_2 \approx -1\,\mathrm{rad/s}$, upside down compared with how it started. At the middle of the flip, $|\omega_1|$ peaks at $1.00\,\mathrm{rad/s}$: for an instant the entire spin is about the minor axis.

**Conservation.** Across the whole run, $\lVert\mathbf{H}\rVert$ and $T$ stay constant to a few parts in $10^{14}$. That is [[round-off|round-off]], nothing more. Instability is not the same as failing to conserve.

**Compare the stable axes.** Release the same body at $\boldsymbol{\omega} = (0.01, 0.01, 1.0)$, about the major axis. $\omega_1$ swings between $\pm 0.0141\,\mathrm{rad/s}$ and crosses zero every $3.14\,\mathrm{s}$ — twice per cycle — so the period is $6.28\,\mathrm{s} = 2\pi/\sqrt{k}$ with $k = 1$, as predicted. Release it at $(1.0, 0.01, 0.01)$, about the minor axis: $\omega_2$ swings with size $0.020$ and $\omega_3$ with size $0.0115\,\mathrm{rad/s}$, with period $2\pi/0.577 = 10.9\,\mathrm{s}$. Nothing grows.
:::

::: example A communications bus spun about its intermediate axis
A satellite bus has $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ about its $x$, $y$, $z$ axes. It is spun about $y$, its intermediate axis, at $n = 0.10\,\mathrm{rad/s}$, with leftover rates of $0.001\,\mathrm{rad/s}$ about $x$ and $z$.

**Stiffness.** Relabel so the spin axis $y$ is "3":

$$
k = n^2\,\frac{(I_y - I_z)(I_y - I_x)}{I_x I_z} = 0.01\times\frac{(1500 - 2000)(1500 - 1200)}{1200\times 2000} = 0.01\times\frac{(-500)(300)}{2{,}400{,}000} = -6.25\times 10^{-4}\,\mathrm{s^{-2}}.
$$

Negative, as it must be for the middle axis. The growth rate is $\sigma = \sqrt{6.25\times 10^{-4}} = 0.025\,\mathrm{s^{-1}}$, an e-folding time of $1/0.025 = 40\,\mathrm{s}$.

**When does it flip?** The estimate is $t_{\mathrm{flip}} \approx \ln(0.1/0.001)/0.025 = 4.61/0.025 = 184\,\mathrm{s}$: a few minutes. Integration agrees on the scale: $\omega_y$ first changes sign at $251\,\mathrm{s}$, then at $697$ and $1144\,\mathrm{s}$. So the bus flips end over end about every $446\,\mathrm{s}$. It spends most of each stretch spinning at nearly $\pm 0.1\,\mathrm{rad/s}$ about $y$, and a few tens of seconds in each flip.

The moments differ by only $25$ and $33$ percent, so the growth is slower than the unit body's. But slow is not stable. A slew that leaves a spacecraft turning about its intermediate axis for a few minutes, with the controller off, will find it upside down.

**The other two axes.** Spun about $z$, the major axis, $k = 0.01\times(2000 - 1500)(2000 - 1200)/(1200\times 1500) = +2.22\times 10^{-3}\,\mathrm{s^{-2}}$. The sideways rates circulate at $\sqrt{k} = 0.0471\,\mathrm{rad/s}$ — the $133\,\mathrm{s}$ period found in lesson 5. Spun about $x$, the minor axis, $k = 0.01\times(1200 - 1500)(1200 - 2000)/(1500\times 2000) = +8.0\times 10^{-4}\,\mathrm{s^{-2}}$, a circulation rate of $0.0283\,\mathrm{rad/s}$ and a period of $2\pi/0.0283 = 222\,\mathrm{s}$. Both bounded. Both, for a rigid body, stable.
:::

## What the theorem says and what it does not

The theorem treats the major and minor axes the same: a rigid body spins stably about either one. For a rigid body that is exactly true, and every simulation of Euler's equations confirms it.

It is also wrong for every spacecraft ever flown. Spinning spacecraft are built to spin about their major axis. A spacecraft spun about its minor axis ends up in a flat spin about its major axis. The first one to do it was Explorer 1, in 1958, within its first few orbits. Rigid-body theory has no room for that. It has no way to change the energy $T$ while the angular momentum $H$ stays fixed, and the fixed energy is exactly what keeps the minor-axis polhode a small loop.

Hold both facts at once. The rigid-body result is exactly true for the equations it describes. The linearization is the right first step for any attitude stability study — attitude controllers are designed from linearized Euler equations of this very form. The flight result tells you that "rigid" is an approximation, and it fails in a specific, predictable way the moment anything inside the body can soak up energy. The next lesson adds that and shows how it breaks the tie between the major and minor axes.

::: warning Instability is not a conservation failure
People who first simulate the tumble often shrink the time step, sure the integrator is wrong. It is not. The exponential growth is real, $\lVert\mathbf{H}\rVert$ and $T$ stay constant, and a correct integrator shows all three at once. The other way round, a run in which $\lVert\mathbf{H}\rVert$ drifts *is* an integrator problem, whichever axis is spinning. Check conservation in every case, stable or not, before trusting the motion.
:::

::: warning The linearization is local
$\ddot{\omega}_1 = -k\omega_1$ describes the motion only while $\omega_1$ and $\omega_2$ are much smaller than $n$. For a stable axis that is forever, as long as the first nudge was small. For the unstable axis it lasts a few e-folding times. After that the full nonlinear equations take over and produce the flip, and the linear model's unbounded growth is replaced by the regular back-and-forth of the real motion. Never stretch a linear growth rate out to predict a final state — go back to the polhode or to the integrator.
:::

::: note Spin about an axis that is not principal
Everything above assumes the planned spin is about a principal axis, because only there is a steady spin an equilibrium. A body released spinning about some other axis is not at an equilibrium at all. It is already on a polhode loop. Whether that loop is small depends on how close the axis is to the major or minor axis, and how far from the separatrix. The practical test is the one from lesson 6: compute $H^2$ and compare it with $2TI_2$.
:::

## Check yourself

::: check
A body has $I_1 = 5$, $I_2 = 8$ and $I_3 = 10\,\mathrm{kg\,m^2}$ and spins about axis 2 at $n = 2\,\mathrm{rad/s}$. Is the spin stable? Work out $k$ and the growth rate or oscillation frequency.
:::

::: answer
Axis 2 has the middle moment, so the spin is unstable. Put the spin axis in the "3" slot of the formula:

$$
k = n^2\,\frac{(I_2 - I_3)(I_2 - I_1)}{I_1 I_3} = 4\times\frac{(8 - 10)(8 - 5)}{5\times 10} = 4\times\frac{-6}{50} = -0.48\,\mathrm{s^{-2}}.
$$

The growth rate is $\sigma = \sqrt{0.48} = 0.693\,\mathrm{s^{-1}}$, an e-folding time of $1/0.693 = 1.44\,\mathrm{s}$. A nudge of one percent of the spin grows to the size of the spin in about $\ln 100/0.693 = 4.61/0.693 = 6.6\,\mathrm{s}$.
:::

::: check
In the proof, why is it fair to treat $\omega_3$ as constant while solving for $\omega_1$ and $\omega_2$?
:::

::: answer
The third Euler equation is $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2$. Both $\omega_1$ and $\omega_2$ are small, so their product is second-order small. The linearization keeps only first-order terms everywhere else, and to that order $\dot{\omega}_3 = 0$.

The approximation holds as long as the sideways rates stay small: forever for a stable axis, and for the first few e-folding times for the unstable one. The simulations bear it out. About the major axis of the unit body, $\omega_3$ stayed within two parts in $100{,}000$ of its starting value.
:::

::: check
For an axisymmetric body, $I_1 = I_2 = I_t$, show that the stiffness $k$ is never negative, whatever $I_3$ is. What does that mean?
:::

::: answer
Put $I_1 = I_2 = I_t$ into the formula. Both factors on top become $(I_3 - I_t)$, and the bottom becomes $I_t^2$:

$$
k = n^2\,\frac{(I_3 - I_t)^2}{I_t^2} \ge 0,
$$

a perfect square. It is zero only when $I_3 = I_t$, the inertially spherical case, where there is no coupling at all.

An axisymmetric body has no intermediate axis. Its symmetry axis is either the major axis (oblate, like a coin) or the minor axis (prolate, like a pencil), and the two transverse axes share the other moment. So there is no axis about which a rigid axisymmetric body spins unstably. The oscillation frequency $\sqrt{k} = n|I_3 - I_t|/I_t$ is the body-frame precession rate $|\lambda|$ of lesson 6.
:::

::: check
A simulation of a spin about the intermediate axis is run again with the starting nudge cut from $10^{-3}$ to $10^{-6}$ of the spin rate. The growth rate is $\sigma = 0.577\,\mathrm{s^{-1}}$. How much later does the first flip come?
:::

::: answer
The time to grow from $\epsilon$ to about $n$ is $\ln(n/\epsilon)/\sigma$. Cutting $\epsilon$ by a factor of $1000$ adds

$$
\frac{\ln 1000}{\sigma} = \frac{6.91}{0.577} = 12.0\,\mathrm{s}.
$$

The first flip moves from about $15\,\mathrm{s}$ to about $27\,\mathrm{s}$. No smaller nudge, short of exactly zero, would stop it — and exactly zero is impossible in a real body and cannot even be stored exactly in a computer once the numbers start moving. The logarithm is why the flip cannot be avoided in practice.
:::

::: check
A colleague argues: "Minor-axis spin is proven stable, so it is safe to spin-stabilize a long, slender probe about its long axis." What is right and what is wrong with that argument?
:::

::: answer
Right: for a rigid body, the intermediate axis theorem does make minor-axis spin stable. The sideways rates stay bounded, and a simulation of Euler's equations will confirm it.

Wrong: that conclusion depends on the body being rigid, which means its rotational kinetic energy cannot change. Any real probe has flexible antennas, propellant or a damper, and all of them soak up energy while the angular momentum stays fixed. Lesson 8 shows that this drives the spin to the axis of *largest* inertia — for a slender body, a flat spin across the long axis. Explorer 1 did exactly that. The slender probe must either be spun about its major axis or be actively controlled.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Equilibrium | Pure spin $\omega_3 = n$ about any principal axis; stable if small transverse rates stay small |
| $\ddot{\omega}_1 = -k\,\omega_1$ | Linearized transverse dynamics about a spin on axis 3 |
| $k = n^2(I_3 - I_2)(I_3 - I_1)/(I_1I_2)$ | Stiffness; positive for the major or minor axis, negative for the intermediate axis |
| $\sqrt{k}$ | Body-frame circulation frequency of a stable spin; equals $\lvert\lambda\rvert$ for an axisymmetric body |
| $\sigma = \sqrt{\lvert k\rvert}$ | Growth rate of an intermediate-axis spin; flip after roughly $\ln(n/\epsilon)/\sigma$ |
| Unit body $\mathrm{diag}(1, 2, 3)$, $n = 1$ | $k = 1$, $\tfrac{1}{3}$, $-\tfrac{1}{3}$ about axes 3, 1, 2; flips at 14.9 s and 42.4 s from a $10^{-3}$ nudge |
| Bus about $y$ at 0.1 rad/s | $\sigma = 0.025\,\mathrm{s^{-1}}$; flips at 251, 697, 1144 s |
| Conservation | $\lVert\mathbf{H}\rVert$ and $T$ constant through the flip; instability is not non-conservation |
| Rigid-body limit | Minor-axis stability is exact for a rigid body and fails for any body that dissipates energy |

The next lesson adds the smallest possible amount of internal energy loss to Euler's equations. It shows that, with $H$ fixed, the only place the spin can end up is the major axis — and reads Explorer 1's first hours in orbit as the experiment that proved it.

::: context book-axes The three axes of a book
Every rigid body has three principal axes at right angles. For a closed book they are easy to see. The long axis, parallel to the spine, has the least inertia, because the mass is packed close to it: that is the **minor** axis. The axis straight out through the cover has the most, because every page corner is far from it: the **major** axis. The one lying in the cover, across the book, is in between: the **intermediate** axis — the one that flips.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="130" y="20" width="100" height="160" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <rect x="130" y="20" width="10" height="160" fill="#1d6fd1"/>
  <line x1="180" y1="6" x2="180" y2="194" stroke="#1f2a44" stroke-width="2" stroke-dasharray="6 4"/>
  <line x1="110" y1="100" x2="250" y2="100" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="180" cy="100" r="8" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <circle cx="180" cy="100" r="2.5" fill="#1f2a44"/>
  <text x="186" y="16" font-size="12" fill="#1f2a44">minor (along spine)</text>
  <text x="256" y="96" font-size="12" fill="#b4232c">intermediate</text>
  <text x="256" y="112" font-size="12" fill="#b4232c">(flips)</text>
  <text x="12" y="96" font-size="12" fill="#1f2a44">major: out of</text>
  <text x="12" y="112" font-size="12" fill="#1f2a44">the cover (dot)</text>
  <text x="112" y="194" font-size="11" fill="#1d6fd1">spine</text>
</svg>
```
:::

::: context dzhanibekov A wing nut on Salyut 7
In 1985 the Soviet cosmonaut Vladimir Dzhanibekov, aboard the Salyut 7 space station, unscrewed a wing nut and watched it spin off its bolt. It drifted across the cabin spinning steadily — then, every few seconds, flipped over and kept going the other way.

The mathematics was far older. Louis Poinsot published his geometric picture of free rotation in 1834, and the instability of the middle axis follows from it. The flipping wing nut is that theorem, seen live.
:::

::: context lyapunov Named after a Russian mathematician
Aleksandr Lyapunov worked out a precise meaning for "stable" in 1892. His idea: an equilibrium is stable if you can guarantee the motion stays as close as you like to it, provided you start close enough. It does not have to come back — it only has to stay near.

A marble at the bottom of a frictionless bowl is stable in this sense: nudge it and it rolls back and forth forever, never far away. If friction also brings it to rest at the bottom, engineers call it **asymptotically stable**. Lesson 8 shows that energy loss turns major-axis spin from the first kind into the second.
:::

::: context linearize Zooming in until it looks straight
Near a point, a curve looks like its tangent line. For small numbers, $x^2$ is far smaller than $x$: if $x = 0.001$, then $x^2 = 0.000001$. So close to an equilibrium, any term that multiplies two small quantities together can be dropped, and what is left is linear — easy to solve exactly.

The price is that the answer is only good close to the point. That is why this lesson's linear model predicts the start of the flip well and says nothing reliable about the flip itself.
:::

::: context spring-or-hill A spring or a hilltop
$\ddot{x} = -kx$ with $k > 0$ is a marble in a bowl: the further it goes, the harder it is pulled back, so it swings. With $k < 0$ it is a marble on a hilltop: the further it goes, the harder it is pushed *away*, so it runs off exponentially.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <path d="M 20 40 Q 90 150 160 40" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <circle cx="90" cy="85" r="9" fill="#1d6fd1"/>
  <path d="M 70 70 L 58 58" stroke="#1d6fd1" stroke-width="1.5"/>
  <path d="M 110 70 L 122 58" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="90" y="132" font-size="12" text-anchor="middle" fill="#1d6fd1">k &gt; 0: swings (major, minor)</text>
  <path d="M 200 110 Q 270 0 340 110" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <circle cx="270" cy="46" r="9" fill="#b4232c"/>
  <path d="M 290 60 L 312 84" stroke="#b4232c" stroke-width="2"/>
  <polygon points="316,89 305,83 312,77" fill="#b4232c"/>
  <text x="270" y="132" font-size="12" text-anchor="middle" fill="#b4232c">k &lt; 0: runs off (intermediate)</text>
</svg>
```
:::

::: context e-folding Growing by a factor of e
An **e-folding time** is how long something growing exponentially takes to multiply by $e \approx 2.718$. For $e^{\sigma t}$ it is $1/\sigma$. After two e-folding times the growth is $e^2 \approx 7.4$; after seven it is $e^7 \approx 1100$. That is why a thousandfold smaller nudge buys only about seven e-folding times.

It is the growing twin of the **time constant** of a decaying quantity like $e^{-t/\tau}$, which you will meet in lesson 8.
:::

::: context flip-history What the flips look like
Here is $\omega_2$ (blue) and $\omega_1$ (red) for the unit body released about its intermediate axis, over the first $60\,\mathrm{s}$. The spin sits near $+1\,\mathrm{rad/s}$, flips to $-1$ at $14.9\,\mathrm{s}$, sits there, and flips back at $42.4\,\mathrm{s}$. During each flip, $\omega_1$ briefly carries the whole spin.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="95" x2="345" y2="95" stroke="#6c7a93" stroke-width="1"/>
  <line x1="40" y1="20" x2="40" y2="170" stroke="#6c7a93" stroke-width="1"/>
  <text x="34" y="34" font-size="11" text-anchor="end" fill="#1f2a44">+1</text>
  <text x="34" y="99" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="34" y="164" font-size="11" text-anchor="end" fill="#1f2a44">−1</text>
  <text x="340" y="112" font-size="11" text-anchor="end" fill="#6c7a93">60 s</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40.0,30.0 80.0,30.0 85.0,30.1 87.5,30.3 90.0,30.4 92.5,30.8 95.0,31.4 97.5,32.5 100.0,34.4 102.5,37.6 105.0,43.0 107.5,51.4 110.0,63.8 112.5,80.0 115.0,98.5 117.5,116.5 120.0,131.3 122.5,142.2 125.0,149.4 127.5,153.8 130.0,156.4 132.5,158.0 135.0,158.9 137.5,159.4 140.0,159.6 145.0,159.9 150.0,160.0 217.5,160.0 222.5,159.9 225.0,159.8 227.5,159.6 230.0,159.2 232.5,158.6 235.0,157.6 237.5,155.8 240.0,152.6 242.5,147.5 245.0,139.2 247.5,127.1 250.0,111.1 252.5,92.6 255.0,74.6 257.5,59.5 260.0,48.4 262.5,41.0 265.0,36.4 267.5,33.7 270.0,32.1 272.5,31.2 275.0,30.7 277.5,30.4 280.0,30.2 285.0,30.1 290.0,30.0 340.0,30.0"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="40.0,94.9 60.0,95.2 70.0,95.8 75.0,96.4 80.0,97.4 85.0,99.3 90.0,102.6 92.5,105.2 95.0,108.5 97.5,112.8 100.0,118.5 102.5,125.5 105.0,133.9 107.5,143.2 110.0,152.0 112.5,158.3 115.0,159.9 117.5,156.4 120.0,148.9 122.5,139.7 125.0,130.6 127.5,122.7 130.0,116.2 132.5,111.1 135.0,107.1 137.5,104.1 140.0,101.8 145.0,98.9 150.0,97.2 155.0,96.2 160.0,95.7 170.0,95.2 180.0,95.0 200.0,94.7 205.0,94.4 210.0,94.0 215.0,93.2 220.0,91.8 225.0,89.4 227.5,87.5 230.0,85.0 232.5,81.7 235.0,77.5 237.5,71.9 240.0,65.0 242.5,56.6 245.0,47.4 247.5,38.5 250.0,32.0 252.5,30.0 255.0,33.3 257.5,40.6 260.0,49.7 262.5,58.8 265.0,66.9 267.5,73.5 270.0,78.7 272.5,82.7 275.0,85.7 280.0,89.8 285.0,92.1 290.0,93.4 300.0,94.5 310.0,94.8 320.0,95.0 340.0,95.4"/>
  <text x="300" y="24" font-size="12" fill="#1d6fd1">ω₂</text>
  <text x="120" y="176" font-size="12" fill="#b4232c">ω₁</text>
  <text x="114" y="185" font-size="11" text-anchor="middle" fill="#1f2a44">14.9 s</text>
  <text x="252" y="185" font-size="11" text-anchor="middle" fill="#1f2a44">42.4 s</text>
</svg>
```
:::

::: context rk4 Stepping forward in small pieces
A computer cannot solve Euler's equations in one go. It steps forward in time by a small $dt$. The simplest step uses the slope at the start of the step. The **fourth-order Runge–Kutta** method, named after two German mathematicians, samples the slope four times across each step (once at the start, twice at the middle, once at the end) and averages them with weights $1, 2, 2, 1$. Its error shrinks like $dt^4$, so halving the step makes it about sixteen times more accurate. It is the workhorse integrator of this module's exercises.
:::

::: context cosh-sinh Exponentials in disguise
The hyperbolic functions are sums of the two exponentials:

$$
\cosh x = \frac{e^{x} + e^{-x}}{2}, \qquad \sinh x = \frac{e^{x} - e^{-x}}{2}.
$$

They are handy here because $\cosh 0 = 1$ and $\sinh 0 = 0$, and each is the other's derivative. So $\omega_1(0)\cosh\sigma t$ carries the starting value, and $(\dot{\omega}_1(0)/\sigma)\sinh\sigma t$ carries the starting slope. For large $t$ both grow like $e^{\sigma t}/2$.
:::

::: context round-off The last digit a computer keeps
Ordinary computer numbers ("double precision") keep about 16 significant digits. Each calculation can be off in the last digit, about one part in $10^{16}$. Hundreds of thousands of steps let those tiny errors pile up a little, which is why the conservation check shows a few parts in $10^{14}$ rather than exactly zero. That is round-off. A real modeling or integrator mistake shows up thousands of times bigger.
:::
