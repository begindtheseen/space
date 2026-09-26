---
id: l08-slerp
title: SLERP, spherical linear interpolation of attitude
minutes: 17
covers:
  - SLERP
---

A plane flying from Chicago to Rome does not tunnel through the Earth, even though a straight line through the rock would be shorter. It follows the curved surface along the shortest route that stays on the globe — a **[[great circle|great-circle]]**. And a good pilot flies it at a steady speed, not dawdling at the start and racing in the middle.

Attitude has the same problem. Quite often you know two attitudes and need the ones in between. That filling-in is called **interpolation** — finding values between two known ones. It comes up all the time on a spacecraft:

- A slew is planned as a list of waypoint attitudes and flown as a smooth motion between them.
- A **[[star tracker|star-tracker]]** reports attitude $4$ times a second, but the control loop runs $100$ times a second, so the attitudes in between must be filled in.
- Two sensors are timestamped $3\,\mathrm{ms}$ apart, and both measurements must be moved to the same instant.
- A ground tool resamples a telemetry log onto an even time grid.

Each of these needs a rule for "the attitude one third of the way from $q_0$ to $q_1$". The rule is not obvious. The set of rotations is curved, and averaging four numbers is not the same as averaging two orientations — just as averaging the latitudes and longitudes of two cities does not give the point halfway along the flight path.

**SLERP** — **spherical linear interpolation**, said "slurp" — is that rule. It moves along the great-circle arc joining $q_0$ and $q_1$ on the unit sphere $S^3$, at constant speed. Seen as a motion of the vehicle, that is a rotation about one fixed axis at one steady rate: exactly the principal-axis rotation of lesson 04, flown evenly. It is the shortest path between two attitudes and the cheapest one for a rate-limited vehicle, which is why it is the default in flight software, in robotics and in every animation system.

The conventions of lesson 05 hold: unit, scalar-first, Hamilton. The sign guard of lesson 07 is not optional here. It is half the algorithm.

## How far apart are two quaternions?

Both $q_0$ and $q_1$ are unit-length arrows in four-dimensional space. Like any two arrows, they have an angle between them. Call it $\Omega$ ("capital omega"). The dot product gives it, the same way it does in three dimensions:

$$
\cos\Omega = q_0\cdot q_1 = w_0w_1 + \mathbf{v}_0\cdot\mathbf{v}_1 .
$$

Here is the part to hold on to. $\Omega$ is an angle on the four-dimensional sphere. Because quaternions are built from half angles, it is **half** the actual rotation between the two attitudes. An $\Omega$ of $85^\circ$ means the vehicle must turn $170^\circ$:

$$
\Phi = 2\Omega .
$$

## The formula

### The idea

Any point on the arc from $q_0$ to $q_1$ is a mix of the two endpoints — some amount of $q_0$ plus some amount of $q_1$. The question is how much of each. The simplest guess, "$(1-t)$ of one plus $t$ of the other", slides along the straight chord *under* the arc, not along the arc. The points it gives are too short, and after you stretch them back out to unit length they are unevenly spaced — bunched at the ends, spread out in the middle ([[picture|chord-vs-arc]]).

SLERP picks the two weights so that the mix lands exactly on the arc, exactly a fraction $t$ of the way along it. Here $t$ runs from $0$ (the start) to $1$ (the end). The answer is

$$
\operatorname{slerp}(q_0, q_1, t) = \frac{\sin\bigl((1-t)\Omega\bigr)\,q_0 + \sin(t\Omega)\,q_1}{\sin\Omega},
\qquad \cos\Omega = q_0\cdot q_1 .
$$

Check the ends. At $t = 0$ the top is $\sin(\Omega)\,q_0 + \sin(0)\,q_1 = \sin(\Omega)\,q_0$, and dividing by $\sin\Omega$ gives $q_0$. At $t = 1$ it gives $q_1$ the same way. Good.

::: note Why it has to be true
The great circle through $q_0$ and $q_1$ lies in the flat plane those two arrows span, so every point on it can be written

$$
q(t) = a(t)\,q_0 + b(t)\,q_1
$$

for some numbers $a$ and $b$. Constant-speed travel means two things: the angle from $q_0$ is $t\Omega$, and the angle from $q_1$ is $(1-t)\Omega$. For unit arrows the cosine of the angle between them is their dot product. Dot $q(t)$ with $q_0$, using $q_0\cdot q_0 = 1$ and $q_0\cdot q_1 = \cos\Omega$; then do the same with $q_1$:

$$
a + b\cos\Omega = \cos t\Omega,
\qquad
a\cos\Omega + b = \cos(1-t)\Omega .
$$

Two equations, two unknowns. Solve the pair for $a$ (multiply the second by $\cos\Omega$ and subtract it from the first), then replace $\cos(1-t)\Omega$ with its expansion $\cos\Omega\cos t\Omega + \sin\Omega\sin t\Omega$, and use $1 - \cos^2\Omega = \sin^2\Omega$:

$$
a = \frac{\cos t\Omega - \cos(1-t)\Omega\,\cos\Omega}{1 - \cos^2\Omega}
= \frac{\sin^2\Omega\,\cos t\Omega - \cos\Omega\sin\Omega\sin t\Omega}{\sin^2\Omega}
= \frac{\sin(1-t)\Omega}{\sin\Omega}.
$$

The last step cancels one $\sin\Omega$ and recognizes $\sin\Omega\cos t\Omega - \cos\Omega\sin t\Omega = \sin(\Omega - t\Omega)$. The same steps with the roles swapped give $b = \sin t\Omega/\sin\Omega$.
:::

### What the vehicle feels

By construction, the angle from $q_0$ to $q(t)$ on the sphere is $t\Omega$. So the rotation from the starting attitude to $q(t)$ is $2t\Omega$ — it grows **linearly** with $t$, like the distance on a car's odometer at steady speed. If the whole move takes time $T$, the spin rate is the constant

$$
\lVert\boldsymbol{\omega}\rVert = \frac{2\Omega}{T},
$$

and the axis never changes: it is the principal axis of the relative rotation $q_0^{*}\otimes q_1$.

There is a second way to write SLERP that makes the fixed axis plain to see. First define a **power** of a unit quaternion: $q^{t}$ is the same axis with the angle scaled by $t$. If $q = [\cos(\Phi/2), \hat{\mathbf{e}}\sin(\Phi/2)]$, then $q^{t} = [\cos(t\Phi/2),\ \hat{\mathbf{e}}\sin(t\Phi/2)]$. So $q^{1/2}$ is half the turn about the same axis. Then

$$
\operatorname{slerp}(q_0, q_1, t) = q_0\otimes\bigl(q_0^{*}\otimes q_1\bigr)^{t}.
$$

Read it aloud: take the relative rotation from $q_0$ to $q_1$, do a fraction $t$ of it, and apply that to $q_0$. Checked numerically against the sine formula over random pairs and the whole range of $t$, the two agree to about $4\times 10^{-16}$ — round-off, nothing more.

::: key SLERP
$\operatorname{slerp}(q_0,q_1,t) = \bigl(\sin((1-t)\Omega)\,q_0 + \sin(t\Omega)\,q_1\bigr)/\sin\Omega$ with $\cos\Omega = q_0\cdot q_1$. Negate $q_1$ first if the dot product is negative, so you take the short way round. The principal angle traversed is $2\Omega$ and the angular rate is the constant $2\Omega/T$, about the fixed principal axis of $q_0^{*}\otimes q_1$.
:::

## The two guards

The formula alone is not a working routine. Two checks turn it into one.

**The sign guard.** If $q_0\cdot q_1 < 0$, replace $q_1$ by $-q_1$ before doing anything else. By lesson 07 the attitude is unchanged. But the angle on the sphere becomes $180^\circ - \Omega$, which is less than $90^\circ$, so the turn flown, $2\Omega$, is less than $180^\circ$. Without the guard, SLERP faithfully follows whichever arc it was handed — possibly the long way round.

**The small-angle guard.** When the two attitudes are almost equal, $\Omega$ is almost zero and so is $\sin\Omega$. The formula then divides by something tiny. Worse, $\arccos$ of a number very close to $1$ loses most of its accurate digits, because the cosine curve is nearly flat there. So when $\sin\Omega$ falls below a small threshold, fall back to **NLERP** — **normalized linear interpolation**: mix the four components with plain weights $(1-t)$ and $t$, then divide by the length to get back onto the sphere. For arcs that short, NLERP is accurate to well within round-off.

One more small defense: clamp the dot product into $[-1, 1]$ before calling $\arccos$, because round-off can push it to $1.0000000000000002$, and $\arccos$ of that is not a number at all.

```python
import numpy as np

def slerp(q0, q1, t, eps=1e-8):
    """Shortest-path SLERP between unit scalar-first quaternions."""
    d = float(q0 @ q1)
    if d < 0.0:                       # shortest-path guard
        q1, d = -q1, -d
    d = min(max(d, -1.0), 1.0)        # clamp round-off before arccos
    om = np.arccos(d)
    if np.sin(om) < eps:              # small-angle fallback
        q = (1.0 - t) * q0 + t * q1
        return q / np.linalg.norm(q)
    return (np.sin((1.0 - t) * om) * q0 + np.sin(t * om) * q1) / np.sin(om)

q0 = np.array([1.0, 0.0, 0.0, 0.0])
q1 = np.array([np.cos(np.radians(45)), 0.0, 0.0, np.sin(np.radians(45))])  # 90 deg about z
print(np.round(slerp(q0, q1, 0.5), 6))   # [0.92388  0.       0.       0.382683]  -> 45 deg about z
```

Sanity check on that last line: halfway through a $90^\circ$ turn should be $45^\circ$, whose quaternion is $[\cos 22.5^\circ, 0, 0, \sin 22.5^\circ] = [0.92388, 0, 0, 0.382683]$. It is.

::: example SLERP against NLERP over a $170^\circ$ slew
Start at $q_0 = [1,0,0,0]$ (no rotation) and end at a $170^\circ$ rotation about the axis $\hat{\mathbf{e}} = (1,2,2)/3$. (That axis has length $\sqrt{1+4+4}/3 = 1$, as an axis must.) Half of $170^\circ$ is $85^\circ$, so

$$
q_1 = [\cos 85^\circ,\ \hat{\mathbf{e}}\sin 85^\circ] = [\,0.087156,\ 0.332065,\ 0.664130,\ 0.664130\,].
$$

The dot product is $q_0\cdot q_1 = 0.087156$ (only the $w$ terms survive, since $q_0$ has no vector part), so $\Omega = \arccos(0.087156) = 85.000^\circ$. Twice that is $170^\circ$, confirming $\Phi = 2\Omega$.

Fly it in $T = 100\,\mathrm{s}$ and sample both methods. "Angle" is the rotation from the start; "rate" is the spin rate at that moment.

| $t$ | SLERP angle | SLERP rate | NLERP angle | NLERP rate |
| --- | --- | --- | --- | --- |
| $0.0$ | $0.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $0.000^\circ$ | $1.1416^\circ/\mathrm{s}$ |
| $0.2$ | $34.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $27.396^\circ$ | $1.6126^\circ/\mathrm{s}$ |
| $0.4$ | $68.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $64.230^\circ$ | $2.0318^\circ/\mathrm{s}$ |
| $0.5$ | $85.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $85.000^\circ$ | $2.1001^\circ/\mathrm{s}$ |
| $0.6$ | $102.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $105.770^\circ$ | $2.0318^\circ/\mathrm{s}$ |
| $0.8$ | $136.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $142.604^\circ$ | $1.6126^\circ/\mathrm{s}$ |
| $1.0$ | $170.000^\circ$ | $1.70000^\circ/\mathrm{s}$ | $170.000^\circ$ | $1.1416^\circ/\mathrm{s}$ |

**Read the SLERP columns.** The angle is exactly $170t$ degrees, and the rate holds at $2\Omega/T = 170^\circ/100\,\mathrm{s} = 1.70000^\circ/\mathrm{s}$ the whole way, to six digits.

**Read the NLERP columns.** It hits the same endpoints and the same midpoint, but it crawls at the ends and rushes in the middle: from $1.1416$ up to $2.1001^\circ/\mathrm{s}$, a peak-to-slowest ratio of $2.1001/1.1416 = 1.840$ ([[plot|rate-plot]]). It is also a slightly different *path*: the largest attitude difference between the two profiles is $6.758^\circ$, at $t = 0.235$ (and again at $t = 0.765$, by symmetry).

How the penalty grows with the size of the slew:

| principal angle $\Phi$ | $10^\circ$ | $45^\circ$ | $90^\circ$ | $120^\circ$ | $170^\circ$ | $179^\circ$ |
| --- | --- | --- | --- | --- | --- | --- |
| NLERP rate ratio | $1.002$ | $1.040$ | $1.172$ | $1.333$ | $1.840$ | $1.983$ |
| max path deviation | $0.001^\circ$ | $0.112^\circ$ | $0.919^\circ$ | $2.234^\circ$ | $6.758^\circ$ | $8.001^\circ$ |

Below about $45^\circ$ the difference is a few percent in rate and a tenth of a degree in path. That is why [[graphics engines use NLERP freely|nlerp-games]], and why resampling telemetry between $4\,\mathrm{Hz}$ samples of a slowly turning vehicle can use it too.

For a real slew it matters. Over the same $100\,\mathrm{s}$, NLERP's peak rate of $2.1001^\circ/\mathrm{s}$ is $24\%$ above SLERP's steady $1.7^\circ/\mathrm{s}$, and wheel momentum follows peak rate. So an NLERP profile either peaks above the actuator's rate limit, or must be slowed down overall and wastes most of the maneuver well below it.
:::

::: example What the sign guard is actually preventing
Take the same $170^\circ$ attitude, but suppose it arrives from an estimator in its other form: $-q_1$, which is a $190^\circ$ rotation about $-\hat{\mathbf{e}}$.

$$
-q_1 = [-0.087156,\ -0.332065,\ -0.664130,\ -0.664130],
\qquad q_0\cdot(-q_1) = -0.087156 .
$$

It is the same attitude — the principal angle from $q_0$ is $170.000^\circ$ either way. But without the guard, $\Omega = \arccos(-0.087156) = 95.000^\circ$, and SLERP travels $2\Omega = 190.000^\circ$ instead of $170.000^\circ$.

The two paths are not near each other at all. At the halfway point, the guarded path is $85.000^\circ$ from the start about $\hat{\mathbf{e}}$. The unguarded one is $95.000^\circ$ from the start about $-\hat{\mathbf{e}}$ — the opposite axis. Those two midpoint attitudes are $180.000^\circ$ apart. A vehicle flying the unguarded profile sweeps through a completely different region of attitudes, at $190^\circ/100\,\mathrm{s} = 1.900^\circ/\mathrm{s}$ instead of $1.700^\circ/\mathrm{s}$, and arrives at the right attitude having pointed its instruments at everything on the wrong side of the sky along the way.

With the guard: the dot product is negative, so negate $-q_1$ back to $q_1$. That restores $\Omega = 85.000^\circ$, the $170.000^\circ$ path and the $1.700^\circ/\mathrm{s}$ rate. One comparison, one sign flip.
:::

::: warning $\Omega$ is half the rotation angle, every time
$\arccos(q_0\cdot q_1)$ is an angle on $S^3$, not a rotation. Reporting it as "the slew angle" understates every maneuver by a factor of two, and a rate limit checked against $\Omega/T$ instead of $2\Omega/T$ lets through profiles that spin twice as fast as the limit. The guarded dot product gives the rotation angle directly and safely: $\Phi = 2\arccos\lvert q_0\cdot q_1\rvert$, where the absolute value does the sign guard for you.
:::

::: warning SLERP is not the same as interpolating Euler angles
Sliding yaw, pitch and roll linearly from one set to the other is neither shortest nor constant-rate. Near the gimbal-lock region of lesson 03 it is not even continuous: two attitudes a fraction of a degree apart can have Euler triples that differ by $180^\circ$ in two of the three angles, and a linear interpolation between them swings the vehicle through a large rotation that never needed to happen. A display may show interpolated angles. A commanded profile must never be built from them.
:::

::: note Beyond two waypoints
SLERP between each pair of waypoints gives a path that is continuous in attitude, but the spin rate and axis change instantly at each waypoint. No real vehicle can do that — it would need infinite torque. So a profile through several attitudes does one of three things. It blends the corners. Or it uses a smoother scheme built from SLERP — the spherical cousin of a cubic **[[spline|spline-word]]**, usually credited to Ken Shoemake. Or, most often in flight software, it plans each segment with its own speed-up and slow-down ramps, as in lesson 04. The arc underneath is the same; what changes is how the speed along it varies.
:::

## Check yourself

::: check
Two attitude samples have $q_0\cdot q_1 = 0.9962$. What is the rotation between them? If they are $0.25\,\mathrm{s}$ apart, what is the average spin rate?
:::

::: answer
The dot product is positive, so no sign guard is needed.

$\Omega = \arccos(0.9962) = 0.0872\,\mathrm{rad} = 4.997^\circ$. The rotation is twice that: $\Phi = 2\Omega = 9.993^\circ$. Over $0.25\,\mathrm{s}$ the average rate is $9.993 / 0.25 = 39.97^\circ/\mathrm{s}$.

Notice how touchy this is. A dot product of $0.9963$ instead gives $\Phi = 9.86^\circ$ and $39.44^\circ/\mathrm{s}$ — a $1.33\%$ change in the answer from a change of $0.0001$ in the input. Near $q_0\cdot q_1 = 1$, $\arccos$ is badly behaved, exactly as in lesson 04. That is the other reason for the small-angle fallback.
:::

::: check
Show that $\operatorname{slerp}(q_0,q_1,t)$ always has length $1$, given that $q_0$ and $q_1$ do.
:::

::: answer
Write $a = \sin((1-t)\Omega)/\sin\Omega$ and $b = \sin(t\Omega)/\sin\Omega$. The squared length of $aq_0 + bq_1$ is found by dotting it with itself, using $q_0\cdot q_0 = q_1\cdot q_1 = 1$ and $q_0\cdot q_1 = \cos\Omega$:

$$
\lVert aq_0 + bq_1\rVert^2 = a^2 + b^2 + 2ab\cos\Omega .
$$

Multiply through by $\sin^2\Omega$ to clear the bottoms, and use short names: $s = \sin t\Omega$, $c = \cos t\Omega$, $S = \sin\Omega$, $C = \cos\Omega$. The angle-difference rule gives $\sin((1-t)\Omega) = Sc - Cs$. So the three terms are

$$
(Sc - Cs)^2 + s^2 + 2(Sc - Cs)sC
= S^2c^2 - 2SCcs + C^2s^2 + s^2 + 2SCcs - 2C^2s^2 .
$$

The $2SCcs$ terms cancel, and $C^2s^2 - 2C^2s^2 = -C^2s^2$, leaving $S^2c^2 + s^2 - C^2s^2 = S^2c^2 + (1 - C^2)s^2 = S^2c^2 + S^2s^2 = S^2(c^2 + s^2) = S^2$.

Divide back by $\sin^2\Omega = S^2$: the squared length is $1$.
:::

::: check
Why does SLERP's spin rate come out constant, and what does that say about the axis?
:::

::: answer
By construction, the angle on $S^3$ between $q(t)$ and $q_0$ is exactly $t\Omega$. The rotation from the start to $q(t)$ is $q_0^{*}\otimes q(t)$, and its scalar part is the dot product $q_0\cdot q(t) = \cos t\Omega$. So its principal angle is $2t\Omega$ — growing linearly in $t$, which means a constant rate $2\Omega/T$.

For the angle to grow steadily *and* the motion to be a single clean turn, the axis must stay put. And it does: $q_0^{*}\otimes q(t) = (q_0^{*}\otimes q_1)^{t}$, whose vector part always points along the vector part of $q_0^{*}\otimes q_1$. So SLERP is exactly the constant-rate, single-axis turn about the principal axis of the relative attitude — the shortest path in angle and, under a rate limit, the shortest in time.
:::

::: check
A profile generator interpolates between waypoints $120^\circ$ apart with NLERP, and the vehicle's rate limit is $0.5^\circ/\mathrm{s}$. The segment is timed so that the *average* rate is $0.45^\circ/\mathrm{s}$. Does it break the limit?
:::

::: answer
No — but only just. From the table, NLERP over $120^\circ$ has a peak-to-slowest rate ratio of $1.333$, with the peak at the midpoint. Over a $100\,\mathrm{s}$ segment for $120^\circ$, the measured extremes are $0.9924$ and $1.3232^\circ/\mathrm{s}$, around an average of $120/100 = 1.2^\circ/\mathrm{s}$. So the peak is $1.3232/1.2 = 1.103$ times the average.

Scale to an average of $0.45^\circ/\mathrm{s}$: the peak is $1.103 \times 0.45 = 0.496^\circ/\mathrm{s}$ — inside the limit, but only because the average was already backed off by $10\%$. Timed for an average of $0.5^\circ/\mathrm{s}$, it would peak at $0.551^\circ/\mathrm{s}$ and break the limit. SLERP would hold $0.5^\circ/\mathrm{s}$ exactly and finish sooner.
:::

::: check
Your interpolation routine sometimes returns NaN ("not a number"), even though the inputs are always unit quaternions. What are the two likely causes, and the fix for each?
:::

::: answer
First: $\arccos$ of a dot product a hair outside $[-1, 1]$. Two nearly identical unit quaternions can give $q_0\cdot q_1 = 1 + 10^{-16}$ after round-off, and $\arccos$ of that is NaN. Fix: clamp the dot product before the call.

Second: dividing by $\sin\Omega$ when $\Omega$ is tiny. If the clamp rescues $\arccos$ but $\Omega$ comes out as $10^{-8}$, the formula divides both terms by about $10^{-8}$ and loses its precision; at exactly $\Omega = 0$ it divides zero by zero. Fix: the small-angle fallback to NLERP.

Both happen in ordinary operation — any time the vehicle is nearly still between two samples — so both guards belong inside the routine, not left to whoever calls it.
:::

## Summary

| Symbol or result | Meaning |
| --- | --- |
| $\cos\Omega = q_0\cdot q_1$ | Angle on $S^3$; the rotation angle is $\Phi = 2\Omega$ |
| $\operatorname{slerp} = \bigl(\sin((1-t)\Omega)q_0 + \sin(t\Omega)q_1\bigr)/\sin\Omega$ | Great-circle arc at constant speed |
| $q_0\otimes(q_0^{*}\otimes q_1)^{t}$ | Same thing as a power; the fixed axis made plain |
| Angle from $q_0$ | $2t\Omega$, linear in $t$; rate $2\Omega/T$, constant |
| Sign guard | Negate $q_1$ when $q_0\cdot q_1 < 0$; otherwise the long path may be flown |
| Small-angle guard | Clamp the dot product; fall back to NLERP when $\sin\Omega$ is tiny |
| $\Phi = 2\arccos\lvert q_0\cdot q_1\rvert$ | Rotation angle with the guard built in |
| NLERP | Mix components, then normalize: same endpoints, uneven rate, slightly different path |
| Worked figures | $170^\circ$ slew: SLERP holds $1.70000^\circ/\mathrm{s}$; NLERP runs $1.1416$ to $2.1001$, path off by up to $6.758^\circ$ |
| Worked figures | A missing sign guard turns a $170^\circ$ path into a $190^\circ$ one, with midpoints $180^\circ$ apart |

Quaternions now have an algebra, a sign convention and an interpolation rule. The next lesson goes back to three numbers — but chosen so that the singularity can be pushed out of reach instead of lived with.

::: context great-circle The straightest line on a ball
A great circle is any circle on a sphere whose center is the sphere's center — the equator, or any line of longitude. It is the biggest circle the sphere can hold, and an arc of one is the shortest route between two points if you must stay on the surface. That is why flights from North America to Europe arc up toward Greenland on a flat map. Quaternions live on a four-dimensional sphere, and SLERP follows a great circle there.
:::

::: context star-tracker A camera that reads the sky
A star tracker is a small camera that photographs the stars, matches the pattern against a built-in catalog, and works out which way the spacecraft is pointing — often to a few arcseconds. Each solution takes computing time, so many trackers report a handful of times a second. Between reports, gyroscopes and interpolation carry the attitude forward at the control loop's much faster pace.
:::

::: context chord-vs-arc Why the chord bunches up
A two-dimensional slice of the picture. Blue dots: SLERP at $t = 0, \tfrac14, \tfrac12, \tfrac34, 1$, evenly spaced along the arc. Grey dots: the straight-line mix at the same $t$ values, evenly spaced along the chord. Red dots: those chord points pushed out to the circle (NLERP). The red dots crowd toward the middle, so NLERP covers the middle faster — its angular rate peaks there.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <g transform="translate(0,-20)">
  <path d="M72.8,85.0 A140,140 0 0 1 287.2,85.0" fill="none" stroke="#1f2a44" stroke-width="2"/>
  <line x1="72.8" y1="85.0" x2="287.2" y2="85.0" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <g stroke="#6c7a93" stroke-width="1">
    <line x1="126.4" y1="85.0" x2="108.3" y2="54.7"/>
    <line x1="233.6" y1="85.0" x2="251.7" y2="54.7"/>
    <line x1="180.0" y1="85.0" x2="180.0" y2="35.0"/>
  </g>
  <g fill="#6c7a93"><circle cx="126.4" cy="85.0" r="3.5"/><circle cx="180.0" cy="85.0" r="3.5"/><circle cx="233.6" cy="85.0" r="3.5"/></g>
  <g fill="#1d6fd1"><circle cx="72.8" cy="85.0" r="5"/><circle cx="120.8" cy="48.1" r="5"/><circle cx="180.0" cy="35.0" r="5"/><circle cx="239.2" cy="48.1" r="5"/><circle cx="287.2" cy="85.0" r="5"/></g>
  <g fill="#b4232c"><circle cx="108.3" cy="54.7" r="3.5"/><circle cx="251.7" cy="54.7" r="3.5"/></g>
  <text x="40" y="104" font-size="13" fill="#1f2a44">q₀</text>
  <text x="298" y="104" font-size="13" fill="#1f2a44">q₁</text>
  <text x="150" y="104" font-size="12" fill="#6c7a93">straight chord</text>
  </g>
</svg>
```
:::

::: context rate-plot Rate across the 170° slew
Spin rate against $t$ for the worked $170^\circ$ slew in $100\,\mathrm{s}$. SLERP (blue) is flat at $1.7^\circ/\mathrm{s}$. NLERP (red) starts at $1.14$, climbs to $2.10$ at the midpoint and falls back. Both cover the same $170^\circ$, so the areas under the two curves are equal.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="170" x2="336" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="170" x2="50" y2="26" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#6c7a93" stroke-width="0.8" stroke-dasharray="3 4">
    <line x1="50" y1="111.7" x2="330" y2="111.7"/><line x1="50" y1="53.3" x2="330" y2="53.3"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="44" y="174">0</text><text x="44" y="115.7">1</text><text x="44" y="57.3">2</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="50" y="186">0</text><text x="190" y="186">0.5</text><text x="330" y="186">1</text>
  </g>
  <text x="190" y="199" font-size="11" fill="#1f2a44" text-anchor="middle">t</text>
  <text x="56" y="20" font-size="11" fill="#1f2a44">deg/s</text>
  <line x1="50" y1="70.8" x2="330" y2="70.8" stroke="#1d6fd1" stroke-width="2.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="50.0,103.4 64.0,97.1 78.0,90.3 92.0,83.2 106.0,75.9 120.0,68.7 134.0,62.0 148.0,56.1 162.0,51.5 176.0,48.5 190.0,47.5 204.0,48.5 218.0,51.5 232.0,56.1 246.0,62.0 260.0,68.7 274.0,75.9 288.0,83.2 302.0,90.3 316.0,97.1 330.0,103.4"/>
  <text x="58" y="64" font-size="12" fill="#1d6fd1">SLERP 1.7</text>
  <text x="200" y="38" font-size="12" fill="#b4232c">NLERP peak 2.10</text>
</svg>
```
:::

::: context nlerp-games Why games get away with NLERP
Video games redraw a character's joints about 60 times a second, and between two frames a joint turns only a few degrees. At that size NLERP's error is tiny — the table shows a rate unevenness of about $0.2\%$ at $10^\circ$ — and it skips the $\arccos$ and two sines, which matters when you do it for thousands of joints every frame. A spacecraft slew of $120^\circ$ is a different story, which is the point of the worked example.
:::

::: context spline-word Splines and Shoemake
A spline was originally a thin flexible strip of wood that shipbuilders bent through pegs to draw smooth hull curves. In mathematics it means a smooth curve stitched from simple pieces so that even the speed changes smoothly at the joins. Ken Shoemake introduced SLERP to computer graphics in a 1985 paper on animating rotations with quaternion curves, and showed how to build smooth multi-waypoint curves from it. Nearly every 3D game and animation tool since has used his ideas.
:::
