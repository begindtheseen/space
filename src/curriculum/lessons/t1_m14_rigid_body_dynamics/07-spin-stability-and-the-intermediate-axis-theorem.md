---
id: l07-spin-stability-and-the-intermediate-axis-theorem
title: Spin stability and the intermediate axis theorem
minutes: 18
covers:
  - major/minor axis spin stability and the intermediate axis theorem
---

Toss a book into the air spinning about its longest axis and it comes back spinning the same way. Toss it spinning about the axis through its face — the axis of largest inertia — and it also comes back cleanly. Toss it spinning about the third axis, the one along its spine's width, and it flips half a turn in mid-air no matter how carefully you release it. The same thing happens to a tennis racket, to a wing nut spun off a bolt in orbit — the Dzhanibekov effect, filmed on Salyut 7 in 1985 — and to any spacecraft unlucky enough to be spun about its intermediate principal axis.

This lesson proves that behaviour from Euler's equations. The proof is three lines of algebra: linearise about a steady spin, and the small transverse rates obey a harmonic-oscillator equation whose stiffness is positive for the major and minor axes and negative for the intermediate one. Negative stiffness means exponential growth. The lesson then puts numbers on the growth, reproduces the flip numerically, and states carefully what the result does and does not say — because the rigid-body answer, that the minor axis is stable, is contradicted by every real spinning spacecraft, and the next lesson explains why.

::: video 1VPfZ_XzisU
The Bizarre Behavior of Rotating Bodies · Veritasium · 14 min
:::

## What stability means here

A spin about a principal axis is an equilibrium of the torque-free Euler equations: with $\omega_1 = \omega_2 = 0$ and $\omega_3 = n$ every product on the right-hand side vanishes and the rates stay put. The question is what happens when the spin is not exactly about the axis — when the body is released with small rates $\omega_1$ and $\omega_2$ as well, as every real body is.

Call the equilibrium **stable** if small initial transverse rates remain small for all time, and **unstable** if they grow. This is stability in the sense of Lyapunov: bounded, not decaying. A torque-free rigid body conserves energy, so nothing can decay; the best a stable spin can do is oscillate with a small fixed amplitude, which is the small polhode loop of the previous lesson. An unstable spin leaves the neighbourhood of the equilibrium entirely, and for a rigid body it does so along the separatrix, transferring the spin to the opposite pole and back.

## Linearising Euler's equations about a spin

Take the torque-free equations in principal axes and suppose the body spins mostly about axis 3:

$$
\omega_3 = n + \epsilon_3, \qquad \omega_1, \omega_2, \epsilon_3 \ \text{small}.
$$

The third equation is $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2$. Its right-hand side is a product of two small quantities, second order, so to first order $\dot{\omega}_3 = 0$ and $\omega_3 = n$ stays constant. The first two equations, keeping only first-order terms, become

$$
I_1\dot{\omega}_1 = (I_2 - I_3)\,n\,\omega_2, \qquad
I_2\dot{\omega}_2 = (I_3 - I_1)\,n\,\omega_1 .
$$

These are linear with constant coefficients. Differentiate the first with respect to time and substitute the second for $\dot{\omega}_2$:

$$
I_1\ddot{\omega}_1 = (I_2 - I_3)\,n\,\dot{\omega}_2 = (I_2 - I_3)\,n\,\frac{(I_3 - I_1)\,n}{I_2}\,\omega_1 ,
$$

that is,

$$
\ddot{\omega}_1 = -k\,\omega_1, \qquad
k = n^2\,\frac{(I_3 - I_2)(I_3 - I_1)}{I_1 I_2} .
$$

The same equation holds for $\omega_2$ with the same $k$. This is the equation of a harmonic oscillator with stiffness $k$, and the whole theorem is in the sign of $k$. The denominator $I_1I_2$ and the factor $n^2$ are positive, so the sign is that of the product $(I_3 - I_2)(I_3 - I_1)$:

- If $I_3$ is the **largest** moment, both factors are positive, $k > 0$, and $\omega_1 = A\cos(\sqrt{k}\,t + \phi)$: the transverse rate oscillates with constant amplitude. Stable.
- If $I_3$ is the **smallest**, both factors are negative, their product is positive, $k > 0$ again. Stable.
- If $I_3$ is the **intermediate** moment, one factor is positive and the other negative, $k < 0$, and the solution is $\omega_1 = A\,e^{\sqrt{|k|}\,t} + B\,e^{-\sqrt{|k|}\,t}$. Any initial condition that is not exactly on the decaying branch grows exponentially. Unstable.

That is the proof. The instability is produced at one identifiable step: the sign of $(I_3 - I_2)(I_3 - I_1)$, which is negative only when $I_3$ sits between the other two.

::: key The intermediate axis theorem
Torque-free rotation about the major (largest $I$) or minor (smallest $I$) principal axis is stable: small perturbations oscillate with bounded amplitude. Rotation about the intermediate axis is unstable: perturbations grow exponentially and the body periodically flips end over end.
:::

::: key Proof of the intermediate axis theorem
Linearise Euler's equations about a spin $\omega_3 = n$ on axis 3. The transverse pair obeys $\ddot{\omega}_1 = -k\,\omega_1$ with $k = n^2(I_3 - I_2)(I_3 - I_1)/(I_1I_2)$. If $I_3$ is largest or smallest both factors share a sign, so $k > 0$ and the motion is a bounded oscillation at frequency $\sqrt{k}$. If $I_3$ is intermediate the signs differ, $k < 0$, and the solution grows as $e^{\sqrt{|k|}\,t}$.
:::

## Rates, time scales and the flip

For a stable axis, $\sqrt{k}$ is the body-frame frequency at which the transverse rate circulates — the rate at which $\boldsymbol{\omega}$ runs around its small polhode loop. For the axisymmetric case $I_1 = I_2 = I_t$ it reduces to $\sqrt{k} = n\,|I_3 - I_t|/I_t = |\lambda|$, the precession rate of lesson 6, as it must. The amplitude ratio follows from the first linear equation: $\omega_2$ peaks at $\omega_1$ times $\sqrt{I_1(I_3 - I_1)/(I_2(I_3 - I_2))}$, so the loop is an ellipse in the $(\omega_1, \omega_2)$ plane, circular only for an axisymmetric body.

For the unstable axis, $\sigma = \sqrt{|k|}$ is the growth rate: the transverse rate multiplies by $e$ every $1/\sigma$ seconds. Starting from a perturbation $\epsilon$, it reaches order $n$ — the point where the linearisation has long since failed and the body is visibly tumbling — after roughly

$$
t_{\mathrm{flip}} \approx \frac{1}{\sigma}\ln\frac{n}{\epsilon}
$$

seconds. The logarithm makes this insensitive to $\epsilon$: a perturbation a thousand times smaller delays the flip by only $\ln 1000/\sigma \approx 7/\sigma$. There is no practical way to spin a body about its intermediate axis for long by being careful about the release.

What the linear theory cannot say is what happens after the growth. For that, return to the polhode. The intermediate-axis spin sits where the separatrix crosses itself, and a nearby initial condition lies on a polhode that follows the separatrix around the momentum sphere to the *opposite* intermediate pole. In body terms, the angular velocity swings from $+n$ on axis 3 to $-n$ on axis 3, passing through a phase where the transverse rates carry the whole spin: the body has turned over. It then lingers near $-n$, since near either pole the motion is slow, before swinging back. The result is a periodic sequence of flips, each fast, separated by intervals of near-steady spin, with a period set by how close the initial condition was to the separatrix. Throughout, $H$ and $T$ are exactly constant. The flip is not a loss of anything; it is the body exploring the whole of the polhode that it was released on.

## Reproducing the flip numerically

The body with $\mathbf{I} = \mathrm{diag}(1, 2, 3)\,\mathrm{kg\,m^2}$ is the module's standard test case. About axis 3 (major), $k = n^2(3 - 2)(3 - 1)/(1\times 2) = n^2$. About axis 1 (minor), relabelling so that the spin axis plays the role of "3" in the formula, $k = n^2(1 - 2)(1 - 3)/(2\times 3) = n^2/3$. About axis 2 (intermediate), $k = n^2(2 - 3)(2 - 1)/(1\times 3) = -n^2/3$. With $n = 1\,\mathrm{rad/s}$: oscillation at $1\,\mathrm{rad/s}$ about the major axis, oscillation at $0.577\,\mathrm{rad/s}$ about the minor axis, and growth at $\sigma = 0.577\,\mathrm{s^{-1}}$ about the intermediate axis.

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
print(np.round(flips, 1))           # [14.9 42.4]
H = np.linalg.norm(hist * I, axis=1)
T = 0.5 * np.sum(hist**2 * I, axis=1)
print(H.ptp() / H[0], T.ptp() / T[0])  # ~1e-16 each
```

::: example The unit body about its intermediate axis
Release $\mathbf{I} = \mathrm{diag}(1, 2, 3)$ with $\boldsymbol{\omega} = (0.001, 1.0, 0.001)\,\mathrm{rad/s}$ — a spin about the intermediate axis with a tenth-of-a-per-cent perturbation on the other two. The growth rate is $\sigma = \sqrt{1/3} = 0.577\,\mathrm{s^{-1}}$, an e-folding time of $1.73\,\mathrm{s}$.

Check the linear theory first. The initial slopes from the linearised equations are $\dot{\omega}_1(0) = (I_2 - I_3)n\,\omega_3/I_1 = -0.001$ and the general solution $\omega_1 = 0.001\cosh\sigma t + (\dot{\omega}_1(0)/\sigma)\sinh\sigma t$ predicts $\omega_1(5\,\mathrm{s}) = 0.001\cosh 2.887 - 0.001732\sinh 2.887 = -0.00649\,\mathrm{rad/s}$. The integrator gives $-0.00649$. The linearisation is exact to three figures while the perturbation is small.

Then watch it fail. The linear estimate of the flip time is $t \approx \ln(1/0.001)/0.577 = 12\,\mathrm{s}$ for the transverse rate to reach the spin rate; the simulation shows $\omega_2$ changing sign at $t = 14.9\,\mathrm{s}$ and again at $42.4\,\mathrm{s}$. Between those times the body spins at $\omega_2 \approx -1\,\mathrm{rad/s}$, upside down relative to how it started. At the flip itself $|\omega_1|$ peaks at $1.00\,\mathrm{rad/s}$: for an instant the entire spin is about the minor axis. Across the whole run, $\lVert\mathbf{H}\rVert$ and $T$ are constant to a few parts in $10^{16}$ — round-off, nothing more. Instability is not non-conservation.

For comparison, release the same body with $\boldsymbol{\omega} = (0.01, 0.01, 1.0)$ about the major axis: $\omega_1$ oscillates between $\pm 0.0141\,\mathrm{rad/s}$ with zero crossings $6.28\,\mathrm{s}$ apart, a period of $2\pi/\sqrt{k} = 2\pi\,\mathrm{s}$. And about the minor axis with $(1.0, 0.01, 0.01)$: $\omega_2$ oscillates with amplitude $0.020$ and $\omega_3$ with $0.0115\,\mathrm{rad/s}$, period $2\pi/0.577 = 10.9\,\mathrm{s}$, as predicted, and nothing grows.
:::

::: example A communications bus spun about its intermediate axis
The bus with $\mathbf{I} = \mathrm{diag}(1200, 1500, 2000)\,\mathrm{kg\,m^2}$ is spun about $y$, its intermediate axis, at $n = 0.10\,\mathrm{rad/s}$ with residual rates of $0.001\,\mathrm{rad/s}$ about $x$ and $z$. Relabel so the spin axis is "3" in the formula: $k = n^2(I_y - I_z)(I_y - I_x)/(I_xI_z) = 0.01\times(-500)(300)/(1200\times 2000) = -6.25\times 10^{-4}\,\mathrm{s^{-2}}$. The growth rate is $\sigma = 0.025\,\mathrm{s^{-1}}$: a time constant of $40\,\mathrm{s}$.

The estimate $t_{\mathrm{flip}} \approx \ln(0.1/0.001)/0.025 = 184\,\mathrm{s}$ says the tumble is a few minutes away. Integration confirms it: $\omega_y$ first changes sign at $251\,\mathrm{s}$, then at $697$ and $1144\,\mathrm{s}$, so the bus flips end over end every $446\,\mathrm{s}$ or so, spending most of each interval spinning at nearly $\pm 0.1\,\mathrm{rad/s}$ about $y$ and a few tens of seconds in transition. The moments here differ by only 25 and 33 per cent, which makes the growth slow compared with the unit body's, but slow is not stable. A slew that leaves a spacecraft rotating about its intermediate axis for a few minutes, with the controller off, will find it inverted.

Spun about $z$ instead, the major axis, the same body has $k = +2.22\times 10^{-3}$ and its transverse rates circulate at $0.0471\,\mathrm{rad/s}$ — the $133\,\mathrm{s}$ period measured in lesson 5. Spun about $x$, the minor axis, $k = 0.01\times(1200 - 1500)(1200 - 2000)/(1500\times 2000) = +8.0\times 10^{-4}$ and the circulation rate is $0.0283\,\mathrm{rad/s}$, a period of $222\,\mathrm{s}$. Both bounded; both, for a rigid body, stable.
:::

## What the theorem says and what it does not

The theorem is symmetric between the major and minor axes: a rigid body spins stably about either. That symmetry is real for a rigid body and is confirmed by every simulation of Euler's equations. It is also wrong for every spacecraft ever flown. Spinners are built to spin about their major axis, and a spacecraft spun about its minor axis — Explorer 1 in 1958, the first case — ends up in a flat spin about its major axis within hours. The rigid-body theory has no room for this, because it has no mechanism for changing $T$ at fixed $H$; energy conservation is what keeps the minor-axis polhode a small loop.

Hold both facts at once. The rigid-body result is exactly true for the equations it describes, and the linearisation is the right first step for any attitude stability analysis — controllers are designed from linearised Euler equations of precisely this form. The flight result tells you that "rigid" is an approximation that fails in a specific, predictable way as soon as anything inside the body can absorb energy. The next lesson adds that mechanism and shows how it breaks the major–minor symmetry.

::: warning Instability is not a conservation failure
Students who first simulate the tumble often reach for a smaller time step, convinced the integrator has gone wrong. It has not. The exponential growth is exact, $\lVert\mathbf{H}\rVert$ and $T$ stay constant, and a correct integrator shows all three at once. Conversely, a run in which $\lVert\mathbf{H}\rVert$ drifts *is* an integrator problem regardless of which axis is spinning. Check conservation in every case, stable or not, before trusting the dynamics.
:::

::: warning The linearisation is local
$\ddot{\omega}_1 = -k\omega_1$ describes the motion only while $\omega_1, \omega_2 \ll n$. For a stable axis that is forever, provided the initial perturbation is small. For the unstable axis it is a few e-folding times; after that the full nonlinear equations take over and produce the flip, and the linear model's prediction of unbounded growth is replaced by the periodic reality. Never extrapolate a linear growth rate to a final state — go back to the polhode or to the integrator.
:::

::: note The stability of a spin about a non-principal axis
The analysis above assumes the nominal spin is about a principal axis, because only there is a steady spin an equilibrium. A body released spinning about a non-principal axis is not at equilibrium at all; it is already on a polhode loop, and whether that loop is small depends on how close the axis is to the major or minor axis and how far from the separatrix. The practical test is the one from lesson 6: compute $H^2$ and compare it with $2TI_2$.
:::

## Check yourself

::: check
A body has $I_1 = 5$, $I_2 = 8$, $I_3 = 10\,\mathrm{kg\,m^2}$ and spins about axis 2 at $n = 2\,\mathrm{rad/s}$. Is the spin stable? Compute $k$ and the growth rate or oscillation frequency.
:::

::: answer
Axis 2 has the intermediate moment, so the spin is unstable. With the spin axis in the role of "3" in the formula, $k = n^2(I_2 - I_3)(I_2 - I_1)/(I_1I_3) = 4\times(8 - 10)(8 - 5)/(5\times 10) = 4\times(-6)/50 = -0.48\,\mathrm{s^{-2}}$. The growth rate is $\sigma = \sqrt{0.48} = 0.693\,\mathrm{s^{-1}}$, an e-folding time of $1.44\,\mathrm{s}$. A perturbation of one per cent of the spin reaches the spin rate in about $\ln 100/0.693 = 6.6\,\mathrm{s}$.
:::

::: check
In the proof, why is it legitimate to treat $\omega_3$ as constant while solving for $\omega_1$ and $\omega_2$?
:::

::: answer
The third Euler equation is $I_3\dot{\omega}_3 = (I_1 - I_2)\omega_1\omega_2$. Both $\omega_1$ and $\omega_2$ are first-order small, so their product is second-order small, and to the first order kept everywhere else in the linearisation $\dot{\omega}_3 = 0$. The approximation is consistent as long as the transverse rates stay small — always, for a stable axis; for the first few e-folding times, for the unstable one. The simulations bear it out: about the major axis of the unit body $\omega_3$ stayed within $0.9999$ to $1.0000$ of its initial value.
:::

::: check
For an axisymmetric body, $I_1 = I_2 = I_t$, show that the stiffness $k$ is always positive whatever $I_3$ is, and interpret.
:::

::: answer
With $I_1 = I_2 = I_t$, $k = n^2(I_3 - I_t)^2/I_t^2 \ge 0$, a perfect square. It is zero only for $I_3 = I_t$, the inertially spherical case with no coupling at all. An axisymmetric body has no intermediate axis — its symmetry axis is either the major axis (oblate) or the minor axis (prolate), and the two transverse axes share the remaining moment — so there is no direction about which a rigid axisymmetric body is unstable. The oscillation frequency $\sqrt{k} = n|I_3 - I_t|/I_t$ is the body-frame precession rate $|\lambda|$ of lesson 6.
:::

::: check
A simulation of a spin about the intermediate axis is repeated with the initial perturbation reduced from $10^{-3}$ to $10^{-6}$ of the spin rate. By how much does the first flip move, if the growth rate is $\sigma = 0.577\,\mathrm{s^{-1}}$?
:::

::: answer
The time to grow from $\epsilon$ to order $n$ is $\ln(n/\epsilon)/\sigma$. Reducing $\epsilon$ by a factor of $1000$ adds $\ln 1000/\sigma = 6.91/0.577 = 12.0\,\mathrm{s}$. The first flip moves from about $15\,\mathrm{s}$ to about $27\,\mathrm{s}$ — and no further reduction of the perturbation short of exactly zero (impossible in a real body and unrepresentable in floating point) would prevent it. The logarithmic dependence is why the flip is unavoidable in practice.
:::

::: check
Your colleague argues that because minor-axis spin is proven stable, it is safe to spin-stabilise a long slender probe about its long axis. What is right and what is wrong in that argument?
:::

::: answer
Right: for a rigid body, the intermediate axis theorem does make minor-axis spin stable, with bounded oscillation of the transverse rates, and a simulation of Euler's equations will confirm it. Wrong: the conclusion depends on the body being rigid, which means its rotational kinetic energy cannot change. Any real probe has flexible antennas, propellant, or a damper, all of which dissipate energy at constant angular momentum, and lesson 8 shows that this drives the spin to the axis of *maximum* inertia — for a slender body, a flat spin perpendicular to the long axis. Explorer 1 did exactly that. The long slender probe must either be spun about its major axis or actively controlled.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| Equilibrium | Pure spin $\omega_3 = n$ about any principal axis; stable if small transverse rates stay small |
| $\ddot{\omega}_1 = -k\,\omega_1$ | Linearised transverse dynamics about a spin on axis 3 |
| $k = n^2(I_3 - I_2)(I_3 - I_1)/(I_1I_2)$ | Stiffness; positive for the major or minor axis, negative for the intermediate axis |
| $\sqrt{k}$ | Body-frame circulation frequency of a stable spin; equals $\lvert\lambda\rvert$ for an axisymmetric body |
| $\sigma = \sqrt{\lvert k\rvert}$ | Growth rate of an intermediate-axis spin; flip after roughly $\ln(n/\epsilon)/\sigma$ |
| Unit body $\mathrm{diag}(1, 2, 3)$, $n = 1$ | $k = 1$, $\tfrac{1}{3}$, $-\tfrac{1}{3}$ about axes 3, 1, 2; flips at 14.9 s and 42.4 s from a $10^{-3}$ perturbation |
| Bus about $y$ at 0.1 rad/s | $\sigma = 0.025\,\mathrm{s^{-1}}$; flips at 251, 697, 1144 s |
| Conservation | $\lVert\mathbf{H}\rVert$ and $T$ constant through the flip; instability is not non-conservation |
| Rigid-body limit | Minor-axis stability is exact for a rigid body and fails for any body that dissipates energy |

The next lesson adds the smallest possible amount of internal energy dissipation to Euler's equations, shows that at fixed $H$ the only end state is spin about the major axis, and reads Explorer 1's first day in orbit as the experiment that proved it.
