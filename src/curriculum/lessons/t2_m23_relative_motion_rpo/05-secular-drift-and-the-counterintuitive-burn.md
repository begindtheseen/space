---
id: l05-secular-drift-and-the-counterintuitive-burn
title: Secular drift and the counterintuitive burn
minutes: 18
covers:
  - secular in-track drift and why it dominates
---

Of everything CW predicts, one behaviour matters more to a working rendezvous than all the others combined: some initial conditions produce a relative orbit that stays put, and some produce one that walks steadily away, forever, never to return on its own. The difference between the two is a single algebraic condition, and missing it is not a rounding error — it is the difference between a stable formation and a chaser drifting kilometres off course by the next orbit. This lesson isolates that condition, explains what it physically means, and uses it to resolve a result that looks wrong the first time you see it: firing forward, in the direction you are travelling, leaves you behind.

## Finding the secular term

Look again at the in-track solution from the state transition matrix lesson:

$$
y(t) = 6(\sin nt - nt)\,x_0 + y_0 - \frac{2}{n}(1-\cos nt)\,\dot x_0 + \frac{1}{n}(4\sin nt - 3nt)\,\dot y_0.
$$

Every term here is bounded except two: $-6nt\,x_0$, hiding inside $6(\sin nt-nt)x_0$, and $-3t\,\dot y_0$, hiding inside $(4\sin nt-3nt)\dot y_0/n$. Both grow without bound as $t\to\infty$, while $\sin nt$ and $\cos nt$ stay within $[-1,1]$ forever. Collect just these two terms:

$$
y_{\text{secular}}(t) = -\big(6n x_0 + 3\dot y_0\big)\,t = -3\big(\dot y_0 + 2n x_0\big)\,t.
$$

This is the whole story of long-term relative motion in one line. If $\dot y_0 = -2nx_0$, the secular part vanishes identically and $y(t)$ is purely oscillatory — the relative orbit closes on itself, forever, with no further input. If $\dot y_0 \ne -2nx_0$, the in-track separation grows linearly without limit, at a rate fixed the instant the initial condition is set and never diminishing on its own.

::: key The drift-free condition
$$
\dot y_0 = -2n x_0
$$
is necessary and sufficient for a closed (non-drifting) relative orbit under CW. Radial position and in-track velocity trade off exactly: any $x_0$ can be made drift-free by choosing the matching $\dot y_0$.
:::

## Why: a semi-major axis mismatch

The secular coefficient $-3(\dot y_0+2nx_0)$ is not an arbitrary combination — it is proportional to the difference between the chaser's semi-major axis and the target's. Converting a CW initial condition $(x_0, \dot y_0)$ to an absolute chaser orbit and computing its energy directly (as the two-body lessons taught) shows

$$
\delta a \approx 4x_0 + \frac{2\dot y_0}{n},
$$

confirmed against exact two-body energy to five significant figures for offsets up to hundreds of metres. Substituting into the secular rate: $-3(\dot y_0+2nx_0) = -\tfrac{3n}{2}\delta a$, so the in-track drift *rate* is $\dot y_{\text{secular}} = -\tfrac{3n}{2}\delta a$, and over one full target period $T=2\pi/n$ the drift *per orbit* is

$$
\Delta y_{\text{orbit}} = -\frac{3n}{2}\delta a \cdot \frac{2\pi}{n} = -3\pi\,\delta a.
$$

::: key Drift per orbit from a semi-major axis mismatch
$$
\Delta y \approx -3\pi\,\delta a \ \text{per orbit.}
$$
A $1\,\mathrm{km}$ difference in semi-major axis between chaser and target drifts the chaser nearly $9.4\,\mathrm{km}$ along-track every single revolution, with no bound and no tendency to self-correct.
:::

This is exactly why the drift-free condition reads the way it does. $\delta a=0$ is nothing more mysterious than "chaser and target have the same semi-major axis" — and two orbits with the same semi-major axis have, by Kepler's third law, exactly the same period. Equal periods mean the angular gap between the two vehicles neither grows nor shrinks, on average, orbit after orbit; any residual motion is purely the bounded oscillation left over from where in that shared-period orbit each vehicle happens to sit. A mismatched semi-major axis means mismatched periods, and two clocks running at even very slightly different rates drift apart by an amount that keeps growing for as long as you let them run — never averaging out, never correcting itself, because nothing in the physics pulls the periods back together.

::: example Sizing a real drift-free error
A chaser starts with a $50\,\mathrm{m}$ radial offset ($x_0=0.050\,\mathrm{km}$) but its in-track velocity is set to zero instead of the drift-free value. On this module's reference orbit, $n=1.1282\times10^{-3}\,\mathrm{rad/s}$, the correct drift-free velocity would have been $\dot y_0 = -2nx_0 = -1.128\times10^{-4}\,\mathrm{km/s} = -0.1128\,\mathrm{m/s}$; setting $\dot y_0=0$ leaves a full $0.1128\,\mathrm{m/s}$ of in-track velocity error. The implied semi-major axis mismatch is $\delta a \approx 4x_0+2(0)/n = 0.200\,\mathrm{km}$, and the drift is $\Delta y \approx -3\pi(0.200) = -1.885\,\mathrm{km}$ per orbit. A 50 m radial mis-set, with no compensating in-track velocity at all, walks the chaser nearly two kilometres away every 93 minutes — a station-keeping-sized error hiding inside what looked like a small, purely-radial mistake.
:::

## The counterintuitive burn

Now use the same machinery on a case designed to check intuition. Start the chaser exactly co-located with the target ($x_0=y_0=z_0=0$) and fire a small burn *prograde* — in the $+\hat{\mathbf{y}}$ direction, the direction the target (and, before the burn, the chaser) is travelling. A natural guess is that speeding up in the direction of travel should move you ahead. CW says the opposite.

With $\dot y_0 = \Delta v > 0$ and $x_0=\dot x_0=0$, the drift-free condition $\dot y_0=-2nx_0=0$ is violated ($\Delta v \ne 0$), so this burn drifts by construction. The secular rate is $-3(\dot y_0+2nx_0) = -3\Delta v$ — the chaser recedes in $-y$, *behind* the target, at a rate three times the size of the burn itself, and notably independent of $n$ (and therefore of altitude): the drift rate depends only on how hard you pushed, not on how fast the reference orbit is going around.

::: example A 5 cm/s forward burn, three ways
Fire $\Delta v = 0.05\,\mathrm{m/s}$ prograde from co-location on this module's reference orbit. **From the CW closed form:**

| Orbits elapsed | 0.25 | 0.5 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- | --- |
| $x$ (m) | 88.6 | 177.3 | 0.0 | 0.0 | 0.0 |
| $y$ (m) | $-31.6$ | $-417.7$ | $-835.4$ | $-1670.8$ | $-2506.2$ |

After exactly one orbit the chaser is $835\,\mathrm{m}$ *behind* the target, not ahead, and receding at a steady $-3\Delta v = -0.15\,\mathrm{m/s}$ on average (superimposed on a bounded oscillation, which is why $x$ returns to zero once per orbit even as $y$ keeps sliding back).

**Cross-checked against full nonlinear two-body propagation** of the chaser's actual orbit: at one, two and three orbits the truth gives $y=-835.4\,\mathrm{m}$, $-1670.9\,\mathrm{m}$, $-2506.3\,\mathrm{m}$ — indistinguishable from CW at this separation, exactly as the previous lesson's validity study would predict for a maximum separation under a kilometre.

**From Kepler's third law alone, without CW:** the burn changes the chaser's speed from $v_0=7.661292\,\mathrm{km/s}$ to $v_0+\Delta v$, and vis-viva gives a new semi-major axis $a_1 = 6791.0886\,\mathrm{km}$ — $88.6\,\mathrm{m}$ *higher* than the target's, confirming the burn does raise the orbit, exactly as prograde intuition expects. But a higher semi-major axis means a longer period: $\delta T/T = \tfrac{3}{2}\,\delta a/a = 1.958\times10^{-5}$, so the chaser's orbit takes $0.109\,\mathrm{s}$ longer than the target's. Over one target period the chaser completes that much less than a full revolution, falling behind by an angle $\delta\theta = -1.230\times10^{-4}\,\mathrm{rad}$, or an arc length $r_0\,\delta\theta = -835.4\,\mathrm{m}$ — the same number, reached without touching a CW formula at all.
:::

The physical story: a prograde burn *does* raise the orbit, exactly as intuition says. What intuition misses is what a higher orbit costs — by Kepler's third law, a longer period, hence a slower average angular rate. The target, unaffected, keeps circling at its original rate; the chaser, now on a slightly larger and slower orbit, gradually falls behind. "Forward" was never in question. What was wrong was assuming that a faster *speed* means a faster *angular rate* — on a higher orbit it means the opposite.

::: warning Prograde does not mean "ahead"
This result generalizes: any burn that raises semi-major axis (prograde, roughly, though not exactly along $+\hat{\mathbf{y}}$ in general) eventually leaves you behind; any burn that lowers it eventually leaves you ahead. A retrograde burn drops your orbit, shortens your period, and you gain on the target — arriving ahead of where a purely intuitive "braking equals falling back" guess would place you. Check the sign of $\delta a$, not the sign of the burn along your instantaneous direction of travel, before predicting where a burn leaves you after more than an orbit.
:::

## Why this dominates

Every other effect in this module — sensor noise, small navigation errors, imperfect burn execution — eventually shows up as some nonzero $\delta a$ between chaser and target, and every nonzero $\delta a$ produces exactly this unbounded drift, at a rate that does not shrink with time or distance already covered. A one-off radial position error is a fixed, bounded nuisance; a one-off velocity error that breaks the drift-free condition is a growing one. This is the entire reason station-keeping exists as an operational activity for anything meant to stay near a target for more than a few orbits — not because relative orbits are inherently unstable in the way an inverted pendulum is, but because the *undriven* dynamics have exactly one direction (in-track drift from a semi-major axis mismatch) with no restoring force at all, and every real burn has some finite execution error that nudges you into that direction sooner or later.

## Check yourself

::: check
A chaser has $x_0 = -0.2\,\mathrm{km}$ (below the target) with $\dot y_0 = 0$. Is this drift-free? If not, find the $\dot y_0$ that would make it so, using $n=1.1282\times10^{-3}\,\mathrm{rad/s}$.
:::

::: answer
Drift-free requires $\dot y_0=-2nx_0 = -2(1.1282\times10^{-3})(-0.2) = 4.513\times10^{-4}\,\mathrm{km/s} = 0.4513\,\mathrm{m/s}$. Since the actual $\dot y_0=0\ne0.4513\,\mathrm{m/s}$, this state is not drift-free; it needs a positive (prograde) in-track velocity of $0.4513\,\mathrm{m/s}$ to close the relative orbit.
:::

::: check
Without recomputing from scratch, state the sign and rough size of the secular drift rate for the state in the previous question ($x_0=-0.2\,\mathrm{km}$, $\dot y_0=0$), and say whether the chaser ends up ahead of or behind the target.
:::

::: answer
Secular rate $= -3(\dot y_0+2nx_0) = -3(0 + 2(1.1282\times10^{-3})(-0.2)) = -3(-4.513\times10^{-4}) = 1.354\times10^{-3}\,\mathrm{km/s} = 1.354\,\mathrm{m/s}$, positive — the chaser drifts in $+y$, ahead of the target, and the drift grows without bound.
:::

::: check
A retrograde ($-y$) burn of the same $0.05\,\mathrm{m/s}$ magnitude as the worked example is fired instead of prograde. Predict $y$ after one orbit, using the symmetry of the secular-rate formula.
:::

::: answer
The secular rate is linear in $\dot y_0$, so reversing the sign of the burn reverses the sign of the drift: $y(T) \approx +835\,\mathrm{m}$ — the chaser ends up *ahead* of the target by essentially the same distance the prograde burn left it behind, consistent with a retrograde burn lowering the orbit, shortening the period, and letting the chaser out-pace the target's angular rate.
:::

::: check
Explain why the drift rate from a pure in-track velocity error, $-3\dot y_0$, does not depend on $n$, while the drift rate from a pure radial position error, $-6n x_0$, does.
:::

::: answer
Both are special cases of $-3(\dot y_0+2nx_0)$. An in-track velocity error changes the chaser's energy (and hence $\delta a$) by a fixed amount independent of the reference orbit's own angular rate — a given $\Delta v$ does the same thing to any orbit's energy regardless of $n$ — so its contribution to the drift rate carries no factor of $n$. A radial *position* offset, by contrast, only becomes a drift because the frame itself is rotating at rate $n$ under it (it is the Coriolis-coupling route to a semi-major-axis mismatch, not a direct energy change), so its contribution scales with how fast that frame turns.
:::

::: check
Two chasers both have $\delta a = +0.5\,\mathrm{km}$ relative to their targets, but one is on this module's reference orbit ($r_0=6791\,\mathrm{km}$) and the other orbits at four times the altitude. Which one drifts away faster, measured in metres per hour rather than per orbit?
:::

::: answer
Drift per *orbit* is $-3\pi\,\delta a$, the same for both since it depends only on $\delta a$, not on $n$ or $r_0$ — both drift $-3\pi(0.5) = -4.712\,\mathrm{km}$ per orbit. But the higher orbit has a longer period (Kepler's third law: $T\propto a^{3/2}$), so it drifts that same distance over more elapsed time. Per hour, the reference-orbit chaser (shorter period) therefore drifts away faster than the higher-altitude one, even though they lose the same distance per revolution.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| $y_{\text{secular}}(t) = -3(\dot y_0+2nx_0)\,t$ | The unbounded, linear-in-time part of the in-track solution |
| $\dot y_0=-2nx_0$ | Drift-free condition: closed relative orbit, no secular term |
| $\delta a \approx 4x_0+2\dot y_0/n$ | Semi-major axis mismatch implied by a CW initial condition |
| $\Delta y \approx -3\pi\,\delta a$ | Drift per orbit; $1\,\mathrm{km}$ of $\delta a$ gives about $9.4\,\mathrm{km}$/orbit |
| Prograde burn from co-location | Raises $a$ (confirmed by vis-viva), lengthens period, chaser ends up **behind** |
| Retrograde burn from co-location | Lowers $a$, shortens period, chaser ends up **ahead** |
| Drift rate from $\dot y_0$ alone | $-3\dot y_0$, independent of $n$ |
| Drift rate from $x_0$ alone | $-6nx_0$, proportional to $n$ |

The next lesson uses the drift-free condition constructively: instead of avoiding drift, it builds closed relative orbits on purpose — the football orbit and its three-dimensional cousin, natural motion circumnavigation — and shows exactly which burn produces a bounded loop and which produces the drift this lesson just explained.
