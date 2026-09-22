---
id: l07-two-impulse-cw-targeting
title: Two-impulse CW rendezvous targeting
minutes: 17
covers:
  - two-impulse CW rendezvous targeting
---

Every lesson so far started from a burn and asked what relative motion it produced. Real rendezvous design usually runs the other direction: the chaser sits at a known relative state, the mission wants it at the target (or at some intermediate hold point) after a chosen elapsed time, and the question is what velocity to command right now to make that happen. This is the targeting problem, and because the CW equations are linear, it reduces to inverting a matrix — the same state transition matrix built two lessons ago, now put to active use instead of passive propagation.

## Setting up the targeting problem

Partition $\boldsymbol\Phi(t)$ as in the earlier lesson, into the four $3\times3$ blocks relating final position and velocity to initial position and velocity:

$$
\begin{bmatrix}\boldsymbol\rho(t)\\ \dot{\boldsymbol\rho}(t)\end{bmatrix} =
\begin{bmatrix}\boldsymbol\Phi_{rr}(t) & \boldsymbol\Phi_{rv}(t) \\ \boldsymbol\Phi_{vr}(t) & \boldsymbol\Phi_{vv}(t)\end{bmatrix}
\begin{bmatrix}\boldsymbol\rho_0\\ \dot{\boldsymbol\rho}_0\end{bmatrix}.
$$

The chaser's current position $\boldsymbol\rho_0$ is fixed — you cannot instantaneously relocate a spacecraft, only change its velocity. The mission specifies a desired position $\boldsymbol\rho_f$ at a chosen transfer time $T$ (for a direct rendezvous, $\boldsymbol\rho_f=\mathbf{0}$, meeting the target exactly). The one free quantity is the initial velocity $\dot{\boldsymbol\rho}_0$ immediately after the first burn — call it $\mathbf{v}_0$ — and the top row of the partitioned equation, evaluated at $t=T$, gives one linear equation for it:

$$
\boldsymbol\rho_f = \boldsymbol\Phi_{rr}(T)\boldsymbol\rho_0 + \boldsymbol\Phi_{rv}(T)\,\mathbf{v}_0
\ \Longrightarrow\
\mathbf{v}_0 = \boldsymbol\Phi_{rv}(T)^{-1}\big(\boldsymbol\rho_f - \boldsymbol\Phi_{rr}(T)\boldsymbol\rho_0\big).
$$

This is why the $\boldsymbol\Phi_{rv}$ block was worth naming when the STM was first partitioned: it is precisely the sensitivity of arrival position to departure velocity, and targeting a rendezvous is nothing more than reading that sensitivity backward. The first impulse is $\Delta\mathbf{v}_1 = \mathbf{v}_0 - \dot{\boldsymbol\rho}_0^{\,-}$, the difference between the required post-burn velocity and whatever velocity the chaser had immediately before the burn (often zero, if it was holding station).

Arriving at $\boldsymbol\rho_f$ with the right position says nothing about arrival velocity — the chaser gets there carrying whatever $\dot{\boldsymbol\rho}(T)$ the transfer produces, generally nonzero even for $\boldsymbol\rho_f=\mathbf{0}$. Read it off the bottom row:

$$
\mathbf{v}_f = \boldsymbol\Phi_{vr}(T)\boldsymbol\rho_0 + \boldsymbol\Phi_{vv}(T)\,\mathbf{v}_0.
$$

A true rendezvous — arriving *and stopping*, matching the target's velocity as well as its position — needs a second impulse, $\Delta\mathbf{v}_2 = \mathbf{v}_f^{\text{desired}} - \mathbf{v}_f$ (with $\mathbf{v}_f^{\text{desired}}=\mathbf{0}$ for docking). Two burns, one to shape the transfer and one to kill the leftover arrival velocity — the same two-impulse structure as a Hohmann transfer, now solved in the relative frame instead of two absolute orbits.

::: key Two-impulse CW targeting
$$
\mathbf{v}_0 = \boldsymbol\Phi_{rv}(T)^{-1}\big(\boldsymbol\rho_f-\boldsymbol\Phi_{rr}(T)\boldsymbol\rho_0\big), \qquad
\Delta\mathbf{v}_1 = \mathbf{v}_0-\dot{\boldsymbol\rho}_0^{\,-}, \qquad
\Delta\mathbf{v}_2 = \mathbf{v}_f^{\text{desired}} - \big(\boldsymbol\Phi_{vr}(T)\boldsymbol\rho_0+\boldsymbol\Phi_{vv}(T)\mathbf{v}_0\big).
$$
:::

::: warning Singular transfer times
$\boldsymbol\Phi_{rv}(t)$ is singular whenever $\sin nt = 0$ — that is, at $t$ equal to any integer multiple of half the orbital period. Physically this is the same fact that makes a simple harmonic oscillator's position insensitive to a velocity kick exactly at its own quarter-period turning points: the cross-track channel alone shows it cleanly, since $z(t)=z_0\cos nt+(\dot z_0/n)\sin nt$ loses all sensitivity to $\dot z_0$ whenever $\sin nt=0$, and the same $\sin nt$ factor sits inside the in-plane block too. Never target a transfer time that lands on, or very near, a multiple of a half-period; the required $\mathbf{v}_0$ blows up as the singularity is approached.
:::

## A worked transfer

Take a chaser sitting $1\,\mathrm{km}$ behind the target on V-bar, $\boldsymbol\rho_0=(0,-1.0,0)\,\mathrm{km}$, at rest relative to the target ($\dot{\boldsymbol\rho}_0^{\,-}=\mathbf{0}$), targeting $\boldsymbol\rho_f=\mathbf{0}$ (direct rendezvous). On this module's reference orbit ($n=1.1282\times10^{-3}\,\mathrm{rad/s}$, $T_{\text{orbit}}=5569.4\,\mathrm{s}$), solving the targeting equations for several transfer times:

| Transfer time $T$ | 1200 s | 1800 s | 2400 s | 2784.7 s (half orbit) |
| --- | --- | --- | --- | --- |
| $\lVert\Delta\mathbf{v}_1\rVert$ | 0.902 m/s | 0.560 m/s | 0.366 m/s | 0.282 m/s |
| $\lVert\Delta\mathbf{v}_2\rVert$ | 0.902 m/s | 0.560 m/s | 0.366 m/s | 0.282 m/s |
| Total $\Delta v$ | 1.804 m/s | 1.120 m/s | 0.731 m/s | 0.564 m/s |

The pattern is the familiar time–fuel trade from Lambert targeting: a faster transfer costs more propellant, and by symmetry of this particular start-and-end pair ($\boldsymbol\rho_0$ purely in-track, $\boldsymbol\rho_f=\mathbf{0}$, arriving with zero relative velocity), $\lVert\Delta\mathbf{v}_1\rVert = \lVert\Delta\mathbf{v}_2\rVert$ exactly in every row — the departure and arrival burns are mirror images of each other here, though that symmetry is a feature of this specific geometry, not a general law.

::: example Reading off the commanded burn
At $T=1800\,\mathrm{s}$: $\mathbf{v}_0 = (-0.535,\ 0.166,\ 0)\,\mathrm{m/s}$ — a radial (inward, since $\boldsymbol\rho_0$ has $x_0=0$ this is a pure new component) component more than three times the in-track one, which looks strange until you recall the previous two lessons: a large, uncompensated in-track velocity would send the chaser into unbounded secular drift rather than a clean arrival, so the targeting solution leans on the radial channel — the same $2n$ coupling that produces the football orbit — to steer the transfer, not on a naive straight-line push along $-y$. $\mathbf{v}_f = (0.535,\ 0.166,\ 0)\,\mathrm{m/s}$, the arrival velocity the second burn must cancel; $\Delta\mathbf{v}_2 = -\mathbf{v}_f$.
:::

## Checking a transfer against reality

The targeting solution above is exact *for the CW model*, by construction — the same guarantee the STM lesson already established. Applying the commanded $\Delta\mathbf{v}_1$ to the chaser's actual absolute orbit and propagating with full nonlinear two-body dynamics instead tests something new: how well a CW-designed transfer performs in the physics it was linearized away from.

::: example A 1 km transfer, nonlinear truth vs plan
Propagating the $T=1800\,\mathrm{s}$ transfer above through the real (nonlinear) two-body equations of motion, the chaser arrives not at $\boldsymbol\rho=\mathbf{0}$ but at $\boldsymbol\rho = (0.237,\ -0.304,\ 0)\,\mathrm{m}$ — a miss of $0.385\,\mathrm{m}$, and an arrival velocity of $(0.5349,\ 0.1655,\ 0)\,\mathrm{m/s}$, close to but not exactly the CW-predicted $(0.5348,\ 0.1660,\ 0)\,\mathrm{m/s}$. This is not a bug in the targeting arithmetic; it is exactly the validity gap the earlier lesson quantified, showing up here as a residual position error at the scale expected for a transfer that never separates the two vehicles by much more than a kilometre over roughly a third of an orbit.
:::

A 38.5 cm miss after a kilometre-scale transfer is a perfectly ordinary and manageable residual — well inside what a terminal-phase sensor and a small trim burn handle routinely — but it is not zero, and it grows if the transfer is larger or slower. This is precisely why no real rendezvous flies a single CW-targeted burn pair open-loop over any serious distance: the first burn gets the chaser close using exactly the linear algebra above, and everything from there in — closing the last few hundred metres — switches to the closed-loop, sensor-in-the-loop guidance the coming lessons on glideslope and approach corridors describe. Two-impulse CW targeting is the coarse solve; it is not, by itself, the whole guidance system.

## Check yourself

::: check
Explain in one sentence why a rendezvous needs two impulses rather than one, even when the target position $\boldsymbol\rho_f$ is reached exactly by the first burn alone.
:::

::: answer
The first burn only fixes the transfer's initial velocity so that *position* matches $\boldsymbol\rho_f$ at time $T$; it says nothing about the *velocity* the chaser carries on arrival, which is generally nonzero, so a second impulse is needed to cancel that leftover relative velocity and actually stop at the target rather than fly through it.
:::

::: check
Why is $\boldsymbol\Phi_{rv}(T)$, specifically, the block that must be inverted to solve for the required departure velocity, rather than $\boldsymbol\Phi_{rr}(T)$ or one of the other blocks?
:::

::: answer
$\boldsymbol\Phi_{rv}(T)$ is the block multiplying the one free unknown, $\mathbf{v}_0$, in the equation for final position — the quantity being targeted. $\boldsymbol\Phi_{rr}(T)$ multiplies the already-known $\boldsymbol\rho_0$ and simply gets moved to the other side as a known offset; it is never inverted because nothing about it is unknown.
:::

::: check
A transfer is planned for $T$ equal to exactly one full orbital period. What goes wrong, and why does that particular choice of $T$ make physical sense as a bad one even before doing the algebra?
:::

::: answer
One orbital period is $2\pi/n$, and $\sin(n\cdot2\pi/n)=\sin(2\pi)=0$, so $\boldsymbol\Phi_{rv}(T)$ is singular and the targeting equations have no unique solution. Physically, after exactly one period every drift-free (and even most non-drift-free) trajectory has returned close to a state with the same phase relationship it started with, so a velocity change at $t=0$ has a vanishing net effect on position exactly one period later in the same way a full-period kick to any undamped oscillator returns it to a phase where the kick's timing has cancelled itself out.
:::

::: check
For the worked $1\,\mathrm{km}$ V-bar-to-origin transfer, the total $\Delta v$ drops from $1.804\,\mathrm{m/s}$ at $T=1200\,\mathrm{s}$ to $0.564\,\mathrm{m/s}$ at the half-orbit transfer time. What general trade does this illustrate, and where else in the curriculum have you seen the same trade?
:::

::: answer
This is the same time-versus-propellant trade seen in Lambert targeting between two absolute orbits: a shorter transfer time demands a larger velocity change to cover the same distance in less time, while a longer transfer can cover it more gently and for less $\Delta v$, up to the point where the transfer time becomes impractically long for the mission.
:::

::: check
Given the residual $0.385\,\mathrm{m}$ miss found by propagating the $T=1800\,\mathrm{s}$, $1\,\mathrm{km}$ transfer through nonlinear truth, would you expect a similarly-designed $10\,\mathrm{km}$ transfer over a proportionally longer time to show a smaller, similar, or larger residual miss, based on the validity-limits lesson?
:::

::: answer
Larger — substantially so. The validity-limits lesson showed CW's position error against nonlinear truth grows roughly with the square of separation at a fixed fraction of an orbit, so a $10\,\mathrm{km}$-scale transfer (ten times the separation) would be expected to show on the order of a hundred times the residual miss of the $1\,\mathrm{km}$ case at a comparable fraction of the orbit — tens of metres rather than tens of centimetres — reinforcing why large transfers need a mid-course correction rather than trusting a single open-loop CW solution all the way in.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $\mathbf{v}_0=\boldsymbol\Phi_{rv}(T)^{-1}(\boldsymbol\rho_f-\boldsymbol\Phi_{rr}(T)\boldsymbol\rho_0)$ | Required departure velocity for a chosen transfer time $T$ |
| $\Delta\mathbf{v}_1$ | First impulse: commanded $\mathbf{v}_0$ minus current relative velocity |
| $\mathbf{v}_f=\boldsymbol\Phi_{vr}(T)\boldsymbol\rho_0+\boldsymbol\Phi_{vv}(T)\mathbf{v}_0$ | Arrival relative velocity, generally nonzero |
| $\Delta\mathbf{v}_2$ | Second impulse: cancels $\mathbf{v}_f$ for a true rendezvous |
| $\sin nT=0$ | Singular transfer times: half-integer multiples of the orbital period |
| Shorter $T$ | Larger total $\Delta v$ — the same time/fuel trade as Lambert targeting |
| $1\,\mathrm{km}$, $1800\,\mathrm{s}$ worked transfer | Nonlinear truth misses the CW-planned arrival by $0.385\,\mathrm{m}$ |

Two-impulse targeting gets a chaser from one relative state to another at a chosen time, but it says nothing yet about the *shape* of a real, safe approach — how a chaser should close the last few hundred metres, and along which line. The next two lessons build that guidance, starting with the geometric law that governs a continuous, controlled closing rate.
