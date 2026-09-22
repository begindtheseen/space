---
id: l08-slerp
title: SLERP, spherical linear interpolation of attitude
minutes: 18
covers:
  - SLERP
---

Attitude has to be interpolated more often than you would expect. A slew is planned as a sequence of waypoint attitudes and flown as a continuous profile between them. A star tracker reports at $4\,\mathrm{Hz}$ and a control loop runs at $100\,\mathrm{Hz}$, so the attitude between reports must be filled in. Two sensors are timestamped $3\,\mathrm{ms}$ apart and their measurements must be brought to a common instant. A ground tool resamples a telemetry log onto a uniform grid. Each of these needs a rule for "the attitude one third of the way from $q_0$ to $q_1$", and the rule is not obvious, because $SO(3)$ is curved and averaging four numbers is not the same as averaging two orientations.

**SLERP** — spherical linear interpolation — is that rule. It moves along the great-circle arc joining $q_0$ and $q_1$ on the unit sphere $S^3$ at constant speed. Translated back to $SO(3)$, that is a rotation about a fixed axis at a constant angular rate: exactly the principal-axis rotation of lesson 04, traversed uniformly. It is the shortest path between two attitudes and the one a rate-limited actuator flies most cheaply, which is why it is the default in flight software, in robotics and in every animation system.

The conventions of lesson 05 hold: unit, scalar-first, Hamilton. The sign guard of lesson 07 is not optional here — it is half the algorithm.

## The formula and where it comes from

Both $q_0$ and $q_1$ are unit vectors in $\mathbb{R}^4$, so they subtend an angle $\Omega$ with

$$
\cos\Omega = q_0\cdot q_1 = w_0w_1 + \mathbf{v}_0\cdot\mathbf{v}_1 .
$$

Note carefully: $\Omega$ is the angle on the four-dimensional sphere, and because of the half-angle it is **half** the principal rotation angle between the two attitudes. An $\Omega$ of $85^\circ$ means the vehicle must turn $170^\circ$.

The great circle through $q_0$ and $q_1$ lies in the two-dimensional plane they span, so write

$$
q(t) = a(t)\,q_0 + b(t)\,q_1
$$

and impose the two conditions that define constant-speed travel: the angle from $q_0$ must be $t\Omega$, and the angle from $q_1$ must be $(1-t)\Omega$. Dotting with each endpoint,

$$
a + b\cos\Omega = \cos t\Omega,
\qquad
a\cos\Omega + b = \cos(1-t)\Omega .
$$

Solve the pair. Substituting $\cos(1-t)\Omega = \cos\Omega\cos t\Omega + \sin\Omega\sin t\Omega$ into the first equation's solution,

$$
a = \frac{\cos t\Omega - \cos(1-t)\Omega\,\cos\Omega}{1 - \cos^2\Omega}
= \frac{\sin^2\Omega\,\cos t\Omega - \cos\Omega\sin\Omega\sin t\Omega}{\sin^2\Omega}
= \frac{\sin(1-t)\Omega}{\sin\Omega},
$$

and symmetrically $b = \sin t\Omega/\sin\Omega$. So

$$
\operatorname{slerp}(q_0, q_1, t) = \frac{\sin\bigl((1-t)\Omega\bigr)\,q_0 + \sin(t\Omega)\,q_1}{\sin\Omega},
\qquad \cos\Omega = q_0\cdot q_1 .
$$

At $t = 0$ it returns $q_0$ and at $t = 1$ it returns $q_1$. In between, the angle from $q_0$ is $t\Omega$ by construction, so the principal rotation angle from the starting attitude is $2t\Omega$: **linear in $t$**. Differentiating, the angular rate over a manoeuvre of duration $T$ is the constant

$$
\lVert\boldsymbol{\omega}\rVert = \frac{2\Omega}{T},
$$

about a fixed axis — the principal axis of $q_0^{*}\otimes q_1$.

There is an equivalent form that makes the fixed-axis structure explicit. Define the power of a unit quaternion by scaling its principal angle, $q^{t} = [\cos(t\Phi/2),\ \hat{\mathbf{e}}\sin(t\Phi/2)]$ for $q = [\cos(\Phi/2), \hat{\mathbf{e}}\sin(\Phi/2)]$. Then

$$
\operatorname{slerp}(q_0, q_1, t) = q_0\otimes\bigl(q_0^{*}\otimes q_1\bigr)^{t},
$$

which agrees with the sine formula to $2.2\times 10^{-16}$ over the whole range, for identity and non-identity starting attitudes alike. Read it aloud: take the relative rotation from $q_0$ to $q_1$, do a fraction $t$ of it, and apply that to $q_0$.

::: key SLERP
$\operatorname{slerp}(q_0,q_1,t) = \bigl(\sin((1-t)\Omega)\,q_0 + \sin(t\Omega)\,q_1\bigr)/\sin\Omega$ with $\cos\Omega = q_0\cdot q_1$. Negate $q_1$ first if the dot product is negative, so you take the short way round. The principal angle traversed is $2\Omega$ and the angular rate is the constant $2\Omega/T$, about the fixed principal axis of $q_0^{*}\otimes q_1$.
:::

## The two guards

**The sign guard.** If $q_0\cdot q_1 < 0$, replace $q_1$ by $-q_1$. The attitude is unchanged, by lesson 07, but $\Omega$ becomes $180^\circ - \Omega$, which is less than $90^\circ$, so the traversed rotation $2\Omega$ is less than $180^\circ$. Without the guard, SLERP interpolates along the arc it was handed, which may be the long way round the sphere.

**The small-angle guard.** As $\Omega\to 0$, $\sin\Omega\to 0$ and the formula divides by something tiny; worse, $\arccos$ of a dot product very near $1$ loses most of its significant digits. When $\sin\Omega$ falls below a threshold — $10^{-6}$ or so — fall back to normalised linear interpolation, which is accurate to well within round-off for arcs that small.

```python
import numpy as np

def slerp(q0, q1, t, eps=1e-8):
    """Shortest-path SLERP between unit scalar-first quaternions."""
    d = float(q0 @ q1)
    if d < 0.0:                       # shortest-path guard
        q1, d = -q1, -d
    d = min(max(d, -1.0), 1.0)
    om = np.arccos(d)
    if np.sin(om) < eps:              # small-angle fallback
        q = (1.0 - t) * q0 + t * q1
        return q / np.linalg.norm(q)
    return (np.sin((1.0 - t) * om) * q0 + np.sin(t * om) * q1) / np.sin(om)
```

::: example SLERP against componentwise interpolation over a $170^\circ$ slew
Take $q_0 = [1,0,0,0]$ and a $170^\circ$ rotation about $\hat{\mathbf{e}} = (1,2,2)/3$,

$$
q_1 = [\,0.087156,\ 0.332065,\ 0.664130,\ 0.664130\,],
\qquad q_0\cdot q_1 = 0.087156,\quad \Omega = 85.000^\circ .
$$

The principal angle between the two attitudes is $170.000^\circ$, confirming $\Phi = 2\Omega$. Fly it in $T = 100\,\mathrm{s}$ and sample both interpolations.

| $t$ | SLERP angle | SLERP rate | NLERP angle | NLERP rate |
| --- | --- | --- | --- | --- |
| $0.0$ | $0.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $0.000^\circ$ | $1.1416^\circ/\mathrm{s}$ |
| $0.2$ | $34.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $27.396^\circ$ | $1.6126^\circ/\mathrm{s}$ |
| $0.4$ | $68.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $64.230^\circ$ | $2.0318^\circ/\mathrm{s}$ |
| $0.5$ | $85.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $85.000^\circ$ | $2.1001^\circ/\mathrm{s}$ |
| $0.6$ | $102.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $105.770^\circ$ | $2.0318^\circ/\mathrm{s}$ |
| $0.8$ | $136.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $142.604^\circ$ | $1.6126^\circ/\mathrm{s}$ |
| $1.0$ | $170.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $170.000^\circ$ | $1.1415^\circ/\mathrm{s}$ |

SLERP's angle is exactly $170t$ degrees and its rate holds at $2\Omega/T = 1.70000^\circ/\mathrm{s}$ across the whole manoeuvre, measured to six digits. Normalised linear interpolation reaches the same endpoints and the same midpoint but crawls at the ends and rushes in the middle: $1.1415$ to $2.1001^\circ/\mathrm{s}$, a ratio of $1.840$. Its path is also a different path — the largest attitude difference between the two profiles is $6.758^\circ$, at $t = 0.235$.

How the penalty scales with the size of the slew:

| principal angle $\Phi$ | $10^\circ$ | $45^\circ$ | $90^\circ$ | $120^\circ$ | $170^\circ$ | $179^\circ$ |
| --- | --- | --- | --- | --- | --- | --- |
| NLERP rate ratio | $1.015$ | $1.040$ | $1.172$ | $1.333$ | $1.840$ | $1.983$ |
| max path deviation | $0.001^\circ$ | $0.112^\circ$ | $0.919^\circ$ | $2.234^\circ$ | $6.758^\circ$ | $8.001^\circ$ |

Below about $45^\circ$ the difference is a few percent in rate and a tenth of a degree in path — which is why graphics engines use NLERP freely and why resampling attitude telemetry between $4\,\mathrm{Hz}$ samples of a slowly moving vehicle can use it too. For a real slew it matters: a profile whose rate varies by a factor of $1.84$ either peaks above the actuator's rate limit or wastes most of the manoeuvre below it, and its peak wheel momentum is $84\%$ higher than it needs to be.
:::

::: example What the sign guard is actually preventing
The same $170^\circ$ attitude, but the endpoint arrives from an estimator in its other representation, as a $190^\circ$ rotation about the same axis:

$$
q_1' = [-0.087156,\ 0.332065,\ 0.664130,\ 0.664130],
\qquad q_0\cdot q_1' = -0.087156 .
$$

It is the same attitude — the principal angle from $q_0$ is $170.000^\circ$ either way. But now $\Omega = \arccos(-0.087156) = 95.000^\circ$, and an unguarded SLERP travels $2\Omega = 190.000^\circ$ instead of $170.000^\circ$.

The two paths are not neighbours. At the halfway point, the guarded interpolation is $85.000^\circ$ from the start and the unguarded one is $95.000^\circ$ from the start — about the *opposite* axis, so the two midpoint attitudes are $180.000^\circ$ apart. A vehicle following the unguarded profile sweeps through a completely different region of attitude space, at $1.900^\circ/\mathrm{s}$ instead of $1.700^\circ/\mathrm{s}$, and arrives at the correct attitude having pointed its instruments at everything on the wrong side of the sky on the way.

With the guard, negating $q_1'$ restores $\Omega = 85.000^\circ$, the $170.000^\circ$ path and the $1.700^\circ/\mathrm{s}$ rate. One comparison, one sign flip.
:::

::: warning $\Omega$ is half the rotation angle, every time
The quantity $\arccos(q_0\cdot q_1)$ is an angle on $S^3$, not a rotation. Reporting it as "the slew angle" understates every manoeuvre by a factor of two, and a rate limit imposed on $2\Omega/T$ is twice as tight as one imposed on $\Omega/T$. The guarded dot product also gives the rotation angle directly and safely: $\Phi = 2\arccos\lvert q_0\cdot q_1\rvert$, where the absolute value performs the sign guard.
:::

::: warning SLERP is not the same as interpolating Euler angles
Interpolating yaw, pitch and roll linearly is neither shortest nor constant-rate, and near the gimbal-lock region of lesson 03 it is not even continuous: two attitudes a fraction of a degree apart can have Euler triples $180^\circ$ apart in two of the three angles, and a linear interpolation between them sweeps the vehicle through a full rotation that never happened. A display may show interpolated angles; a commanded profile must not be built from them.
:::

::: note Beyond two waypoints
SLERP between consecutive waypoints gives a path that is continuous in attitude but has a discontinuous angular velocity at each waypoint, because the axis and rate change instantaneously. A vehicle cannot fly that, so a profile through several attitudes either blends the transitions, or uses a higher-order scheme built from SLERP — the spherical analogue of a cubic spline, usually credited to Shoemake — or, in practice, plans each segment with its own acceleration and braking ramps as in lesson 04. The underlying arc is the same; what changes is how the speed along it varies.
:::

## Check yourself

::: check
Two attitude samples have $q_0\cdot q_1 = 0.9962$. What is the rotation between them, and if they are $0.25\,\mathrm{s}$ apart, what is the mean angular rate?
:::

::: answer
The dot product is positive so no sign guard is needed. $\Omega = \arccos(0.9962) = 0.0872\,\mathrm{rad} = 4.997^\circ$, so the principal angle is $\Phi = 2\Omega = 9.99^\circ$. Over $0.25\,\mathrm{s}$ that is a mean rate of $9.99/0.25 = 39.98^\circ/\mathrm{s}$. Note how sensitive this is: a dot product of $0.9963$ instead would give $\Phi = 9.86^\circ$ and $39.44^\circ/\mathrm{s}$, a $1.33\%$ change from a change of $10^{-4}$ in the input. Near $q_0\cdot q_1 = 1$ the $\arccos$ is ill-conditioned exactly as in lesson 04, which is the other reason for the small-angle fallback.
:::

::: check
Show that $\operatorname{slerp}(q_0,q_1,t)$ has unit norm for all $t$, given that $q_0$ and $q_1$ do.
:::

::: answer
With $a = \sin((1-t)\Omega)/\sin\Omega$ and $b = \sin(t\Omega)/\sin\Omega$, and $q_0\cdot q_1 = \cos\Omega$,

$\lVert aq_0 + bq_1\rVert^2 = a^2 + b^2 + 2ab\cos\Omega$. Multiply through by $\sin^2\Omega$: the numerator is $\sin^2((1-t)\Omega) + \sin^2(t\Omega) + 2\sin((1-t)\Omega)\sin(t\Omega)\cos\Omega$. Expand $\sin((1-t)\Omega) = \sin\Omega\cos t\Omega - \cos\Omega\sin t\Omega$ and write $s = \sin t\Omega$, $c = \cos t\Omega$, $S = \sin\Omega$, $C = \cos\Omega$. The three terms become $(Sc - Cs)^2 + s^2 + 2(Sc - Cs)sC = S^2c^2 - 2SCcs + C^2s^2 + s^2 + 2SCcs - 2C^2s^2 = S^2c^2 + s^2 - C^2s^2 = S^2c^2 + S^2s^2 = S^2$. Dividing by $\sin^2\Omega = S^2$ gives $1$.
:::

::: check
Why does the angular rate of a SLERP come out constant, and what does that imply about the axis?
:::

::: answer
By construction the angle between $q(t)$ and $q_0$ on $S^3$ is exactly $t\Omega$. The rotation from the initial attitude to $q(t)$ is $q_0^{*}\otimes q(t)$, whose scalar part is $q_0\cdot q(t) = \cos t\Omega$, so its principal angle is $2t\Omega$ — linear in $t$, hence a constant rate $2\Omega/T$. For the rate to be constant while the angle grows linearly, the relative rotation must be about a fixed axis; indeed $q_0^{*}\otimes q(t) = (q_0^{*}\otimes q_1)^{t}$, whose vector part is always along the vector part of $q_0^{*}\otimes q_1$. So SLERP is exactly the constant-rate, single-axis rotation about the principal axis of the relative attitude — the shortest path in angle and, under a rate limit, the shortest in time.
:::

::: check
A profile generator interpolates between waypoints $120^\circ$ apart with NLERP and the vehicle's rate limit is $0.5^\circ/\mathrm{s}$. If the segment is sized so that the *average* rate is $0.45^\circ/\mathrm{s}$, does it violate the limit?
:::

::: answer
Yes. From the table, NLERP over $120^\circ$ has a rate ratio of $1.333$ between its peak and its minimum, with the peak at the midpoint. The measured extremes over a $100\,\mathrm{s}$ segment were $0.9924$ and $1.3232^\circ/\mathrm{s}$ for a $120^\circ$ slew, so the peak is $1.3232/1.2 = 1.103$ times the average of $1.2^\circ/\mathrm{s}$. Scaling to an average of $0.45^\circ/\mathrm{s}$, the peak is $0.496^\circ/\mathrm{s}$ — marginally inside, and only because the average was already backed off by $10\%$. Sized for an average of $0.5^\circ/\mathrm{s}$ it would peak at $0.551^\circ/\mathrm{s}$ and violate. SLERP would hold $0.5^\circ/\mathrm{s}$ exactly and finish sooner.
:::

::: check
Your interpolation routine occasionally returns NaN. The inputs are always unit quaternions. What are the two likely causes and their fixes?
:::

::: answer
First, $\arccos$ of a dot product slightly outside $[-1,1]$. Two unit quaternions that are nearly identical give $q_0\cdot q_1 = 1 + 10^{-16}$ after round-off, and $\arccos$ of that is NaN. Fix: clamp the dot product before the call. Second, division by $\sin\Omega$ when $\Omega$ is tiny — if the clamp saves $\arccos$ but $\Omega$ comes out at $10^{-8}$, the formula divides both terms by $10^{-8}$ and loses all precision, and at exactly $\Omega = 0$ it divides by zero. Fix: the small-angle fallback to normalised linear interpolation. Both cases arise in ordinary operation, whenever the vehicle is nearly still between two samples, so both guards belong in the routine rather than in the caller.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\cos\Omega = q_0\cdot q_1$ | Angle on $S^3$; the rotation angle is $\Phi = 2\Omega$ |
| $\operatorname{slerp} = \bigl(\sin((1-t)\Omega)q_0 + \sin(t\Omega)q_1\bigr)/\sin\Omega$ | Great-circle arc, constant speed |
| $q_0\otimes(q_0^{*}\otimes q_1)^{t}$ | Equivalent power form; fixed axis made explicit |
| Angle from $q_0$ | $2t\Omega$, linear in $t$; rate $2\Omega/T$ constant |
| Sign guard | Negate $q_1$ when $q_0\cdot q_1 < 0$; otherwise the long path is flown |
| Small-angle guard | Fall back to normalised linear interpolation when $\sin\Omega$ underflows |
| $\Phi = 2\arccos\lvert q_0\cdot q_1\rvert$ | Rotation angle with the guard built in |
| NLERP | Same endpoints, varying rate, different path |
| Worked figures | $170^\circ$ slew: SLERP holds $1.70000^\circ/\mathrm{s}$; NLERP varies $1.1415$ to $2.1001$, path off by $6.758^\circ$ |
| Worked figures | Missing sign guard turns a $170^\circ$ path into a $190^\circ$ one with midpoints $180^\circ$ apart |

Quaternions now have an algebra, a sign convention and an interpolation rule. The next lesson goes back to three parameters — but chosen so that the singularity can be pushed out of reach instead of lived with.
