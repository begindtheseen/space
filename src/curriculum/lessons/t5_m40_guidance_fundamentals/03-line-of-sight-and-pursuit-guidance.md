---
id: l03-line-of-sight-and-pursuit-guidance
title: Line-of-sight and pursuit guidance
minutes: 19
covers:
  - Line-of-sight guidance and pursuit guidance
---

Watch a dog chase a rolling ball across a park. The dog does not work out where the ball will be. It runs straight at where the ball *is*, right now, and keeps turning to face it. If the ball rolls straight away, the dog runs in a straight line. If the ball rolls across its path, the dog runs a curve that swings around behind the ball, turning harder and harder at the end.

Now picture a car driving down a lane. The driver does not aim at the end of the road. She stays on the lane — whenever she drifts toward the edge, she steers back to the middle.

Those are the two oldest guidance ideas, and this lesson is about both.

- **Pursuit guidance** says: point at the target and close in.
- **Line-of-sight guidance** says: stay on a chosen line toward the target.

Both are the natural first thing anyone invents. Both are still exactly right for some jobs. And both fail in a specific way you can work out. Seeing precisely how they fail is what makes the next lesson's law — proportional navigation — feel inevitable rather than clever.

These ideas are not only missile history. A spacecraft without a fancy guidance computer, closing slowly on a drifting satellite to grab it, can point its velocity at the target and burn. That is pursuit. A capsule approaching the Space Station along a planned **approach corridor** — a straight lane through space leading to the docking port — is flown by correcting any sideways drift off that lane. That is the spacecraft version of line-of-sight guidance.

## The words for the geometry

Before either law, we need a few words for "where is the target, as seen from me".

- The **line of sight** (LOS) is the straight line from the pursuer to the target. It is where you would look to see the target.
- The **range** $R$ is the distance along it.
- The **line-of-sight angle** $\lambda$ (the Greek letter "lambda") is the direction of that line, measured from some fixed reference direction.
- The **line-of-sight rate** $\dot\lambda$ ("lambda dot") is how fast that angle is changing, in radians per second.
- The **heading** $\chi$ (the Greek letter "chi", said "kye") is the direction the pursuer is moving, measured from the same reference.

The **[[geometry picture|los-geometry]]** in the notes draws all of these.

### How fast does the line of sight turn?

Stand next to a road and watch cars go by. A car far away creeps across your view. The same car passing close to you whips across it, and you have to turn your head fast. What matters is how fast the car moves *across* your view, compared with how far away it is.

That is exactly the rule for the line-of-sight rate. Split the target's motion relative to you into two parts: the part along the line of sight (straight toward or away from you) and the part across it. Only the across part turns the line. Call it $v_{rel,\perp}$ — read "v rel perp", the **transverse** (across-the-line) part of the relative velocity. Then

$$
\dot\lambda = \frac{v_{rel,\perp}}{R}.
$$

Check the units: meters per second over meters leaves "per second", which is radians per second for an angle rate. The next lesson derives the exact vector version of this identity. The key point for now is this: when the across speed stays about the same, halving the range doubles the line-of-sight rate.

::: note Why the angle rate is across-speed over distance
Picture the target moving across your view by a tiny distance $v_{rel,\perp}\,\Delta t$ in a short time $\Delta t$. At distance $R$, a sideways move of $s$ swings your line of sight by an angle of about $s/R$ radians — that is what a radian means (arc length over radius). So in time $\Delta t$ the angle changes by $v_{rel,\perp}\,\Delta t / R$. Divide by $\Delta t$ to get the rate: $\dot\lambda = v_{rel,\perp}/R$. The part of the motion along the line only changes $R$, not the direction, so it does not appear.
:::

## Pursuit guidance

**Pure pursuit** sets the pursuer's heading equal to the line-of-sight angle at every instant:

$$
\chi(t) = \lambda(t).
$$

In words: always steer straight at where the target is now, not where it is going to be.

That one rule has an immediate consequence. If two angles are equal at every instant, they change at the same rate too. So

$$
\dot\chi = \dot\lambda.
$$

The pursuer's turn rate *is* the line-of-sight rate.

How hard must the pursuer push sideways to turn at that rate? To turn at rate $\omega$ while moving at speed $V$, you need a sideways acceleration of $V\omega$ — the same **[[turning acceleration|turn-accel]]** that holds a car on a curve. With speed $V_p$ ("V sub p", the pursuer's speed) and turn rate $\dot\chi = \dot\lambda$:

$$
a_{lat} = V_p\,\dot\lambda.
$$

Here $a_{lat}$ ("a lat") is the **lateral acceleration** — the push sideways to the direction of travel.

Remember the shape of this formula. It comes back, almost unchanged, at the heart of proportional navigation.

Whether pursuit is a good law or a bad one depends entirely on how $\dot\lambda$ behaves. And $\dot\lambda$ is set by the geometry, $\dot\lambda = v_{rel,\perp}/R$, not by anything pursuit chooses. If the target has any motion across the line of sight, then $v_{rel,\perp}$ is not zero. As $R$ shrinks toward zero near intercept, $\dot\lambda$ grows — and pursuit's demand, $V_p\dot\lambda$, grows right along with it. The closer it gets to a crossing target, the harder it has to turn, up to the point where no real actuator can keep up.

::: example Two targets, two very different turns
A chaser starts at the origin and flies pure pursuit at a constant $V_p = 1.5\,\mathrm{m/s}$. The code below flies the chase in a flat plane, one hundredth of a second at a time, and records the range and line-of-sight rate. (It uses the cross-product form $\dot\lambda = (x\,v_y - y\,v_x)/R^2$ of the identity above, where $(x, y)$ is the target's position relative to the chaser and $(v_x, v_y)$ its relative velocity.)

```python
import numpy as np

Vp = 1.5                                    # pursuer speed, m/s

def fly_pursuit(rT0, vT, dt=0.01):
    """Pure pursuit in a plane. Returns a list of (time, range, lambda_dot)."""
    rT0, vT = np.array(rT0), np.array(vT)
    def vel(t, rP):                         # always head straight at the target
        rel = rT0 + vT * t - rP
        return Vp * rel / np.linalg.norm(rel)
    t, rP, log = 0.0, np.zeros(2), []
    while True:
        rel = rT0 + vT * t - rP
        R = np.linalg.norm(rel)
        if R < 1.0:
            return log
        vrel = vT - vel(t, rP)
        lam_dot = (rel[0] * vrel[1] - rel[1] * vrel[0]) / R**2
        log.append((t, R, lam_dot))
        k1 = vel(t, rP); k2 = vel(t + dt/2, rP + dt/2 * k1)   # Runge-Kutta step
        k3 = vel(t + dt/2, rP + dt/2 * k2); k4 = vel(t + dt, rP + dt * k3)
        rP = rP + dt/6 * (k1 + 2*k2 + 2*k3 + k4)
        t += dt

still = fly_pursuit([1500.0, -300.0], [0.0, 0.0])
print("stationary: max |lambda_dot| =", max(abs(x[2]) for x in still))

drift = fly_pursuit([2000.0, 500.0], [-0.6, 0.2])
for R_mark in [2000, 1000, 500, 200, 100, 50, 20, 10]:
    t, R, ld = next(x for x in drift if x[1] <= R_mark)
    print(f"R = {R:7.1f} m   lambda_dot = {ld:.3e} rad/s   a_lat = {Vp*ld:.3e} m/s^2")
# stationary: max |lambda_dot| = 4.979...e-17   (zero, up to rounding)
# R =  2000.0 m   lambda_dot = 1.711e-04 rad/s   a_lat = 2.567e-04 m/s^2
# R =  1000.0 m   lambda_dot = 4.080e-04 rad/s   a_lat = 6.120e-04 m/s^2
# R =   500.0 m   lambda_dot = 9.575e-04 rad/s   a_lat = 1.436e-03 m/s^2
# R =   200.0 m   lambda_dot = 2.845e-03 rad/s   a_lat = 4.268e-03 m/s^2
# R =   100.0 m   lambda_dot = 6.187e-03 rad/s   a_lat = 9.281e-03 m/s^2
# R =    50.0 m   lambda_dot = 1.262e-02 rad/s   a_lat = 1.893e-02 m/s^2
# R =    20.0 m   lambda_dot = 2.790e-02 rad/s   a_lat = 4.185e-02 m/s^2
# R =    10.0 m   lambda_dot = 4.404e-02 rad/s   a_lat = 6.606e-02 m/s^2
```

**Stationary target.** The target holds still at $(1500,\ -300)\,\mathrm{m}$. The line of sight from the chaser to a fixed point never turns, because the chaser always moves straight along it. So $\dot\lambda$ stays zero (the tiny $10^{-17}$ is computer rounding), no turning is ever needed, and the chaser flies a dead-straight line. That is exactly what the rule predicts when $v_{rel,\perp}$ is zero.

**Drifting target.** This target starts at $(2000,\ 500)\,\mathrm{m}$ and drifts at $(-0.6,\ 0.2)\,\mathrm{m/s}$ — a modest leftover velocity, the kind a satellite might carry after a failed capture attempt. It has real motion across the line of sight. Read the table from top to bottom:

- From $R = 2000\,\mathrm{m}$ to $R = 20\,\mathrm{m}$, the range falls by a factor of $2000/20 = 100$.
- Over the same stretch, the sideways acceleration demanded rises by a factor of $0.04185/0.0002567 \approx 163$.

That is *faster* than the plain one-over-range the identity would give if the across speed stayed fixed. The reason is that the across speed does not stay fixed. Under pure pursuit the chaser's own velocity lies exactly along the line of sight, so all of $v_{rel,\perp}$ comes from the target's velocity. As the line of sight swings around, the target's motion points more and more across it. Here $v_{rel,\perp} = R\,\dot\lambda$ grows from $2000 \times 0.0001711 \approx 0.34\,\mathrm{m/s}$ to $20 \times 0.0279 \approx 0.56\,\mathrm{m/s}$. Shrinking range and a growing across speed multiply together.

**Sanity check.** At $R = 1000\,\mathrm{m}$: $a_{lat} = V_p\dot\lambda = 1.5 \times 0.000408 = 0.000612\,\mathrm{m/s^2}$, matching the table. And the demand keeps climbing all the way in: $0.066\,\mathrm{m/s^2}$ at $10\,\mathrm{m}$, more than $250$ times the starting value, with the chaser's heading swinging from about $60$ degrees to over $150$ degrees in the last $75$ seconds or so.
:::

That growth is not a quirk of the numbers. It is the defining weakness of pure pursuit, and the path it traces has a name: the **[[curve of pursuit|curve-of-pursuit]]**. Near the end, the pursuer is forced to whip around behind the target. Whether the turn rate actually grows without limit depends on the **[[speed ratio|speed-ratio]]** — here the chaser is $2.37$ times faster than the target, and in that case it does.

One patch is to aim ahead of the target by a fixed **lead angle** $\delta$ ("delta"): **deviated pursuit**, $\chi = \lambda + \delta$. It softens the problem for one particular engagement. It does not remove it in general, because the real cause is untouched: the heading is chained to the line of sight, with no separate dial to tune how it responds.

## Line-of-sight guidance

**Line-of-sight guidance** asks a different question. Not "am I pointed at the target?" but "am I *on* a chosen line?"

In its classic form, called **command guidance** or **[[beam riding|beam-riding]]**, a third party — usually a radar on the ground — tracks the target and defines the reference line from itself to the target. The pursuer is steered to cancel its sideways distance from that line, wherever the line points at the moment.

Spacecraft rendezvous has a close cousin with no beam at all: flying an approach corridor. A **V-bar** approach holds the chaser on the line through the station along the station's direction of travel. An **R-bar** approach holds it on the line through the station toward Earth's center. Either way, the line is fixed in advance by mission design. Guidance's job in flight is to cancel the **cross-track deviation** $y$ — the sideways distance off the line.

This is the reference-trajectory-following idea from the last lesson, with the reference shrunk down from a whole planned state history to a single straight line. So the same kind of linear feedback does the job:

$$
a_{\perp} = -k_1\, y - k_2\, \dot y .
$$

Here $a_\perp$ ("a perp") is the commanded acceleration across the line, $k_1$ pushes back against the offset, and $k_2$ pushes back against the drift rate. Matching to the spring-and-damper form as before gives $k_1 = \omega_n^2$ and $k_2 = 2\zeta\omega_n$.

A good choice for a corridor is **[[critical damping|critical-damping]]**, $\zeta = 1$: the fastest return that does not swing back and forth across the line.

::: example Cancelling a sideways drift on a V-bar approach
A chaser is $y_0 = 8\,\mathrm{m}$ off the V-bar line and drifting further off at $\dot y_0 = 0.02\,\mathrm{m/s}$. Choose critical damping, $\zeta = 1$, with natural frequency $\omega_n = 0.02\,\mathrm{rad/s}$. That is slow enough not to fight the approach's own forward closing, and fast enough to settle well before contact.

**Gains.** Square the natural frequency, and double it:

$$
k_1 = \omega_n^2 = 0.02^2 = 4.00\times10^{-4}\,\mathrm{s^{-2}}, \qquad k_2 = 2\zeta\omega_n = 2 \times 1 \times 0.02 = 0.0400\,\mathrm{s^{-1}}.
$$

**The motion.** A critically damped system has a neat exact answer:

$$
y(t) = \big(y_0 + (\dot y_0 + \omega_n y_0)\,t\big)\,e^{-\omega_n t}.
$$

With our numbers, $\dot y_0 + \omega_n y_0 = 0.02 + 0.02 \times 8 = 0.18\,\mathrm{m/s}$, so $y(t) = (8 + 0.18\,t)\,e^{-0.02t}$.

```python
import math
w, y0, yd0 = 0.02, 8.0, 0.02
B = yd0 + w * y0                          # 0.18 m/s
for t in [60, 150, 300, 600]:
    e = math.exp(-w * t)
    y = (y0 + B * t) * e
    ydot = (B - w * (y0 + B * t)) * e
    print(t, round(y, 4), round(ydot, 5))
# 60 5.6625 -0.05903
# 150 1.7425 -0.02589
# 300 0.1537 -0.00263
# 600 0.0007 -1e-05
```

| $t$ | $y$ | $\dot y$ |
| --- | --- | --- |
| $60\,\mathrm{s}$ | $5.662\,\mathrm{m}$ | $-0.0590\,\mathrm{m/s}$ |
| $150\,\mathrm{s}$ | $1.743\,\mathrm{m}$ | $-0.0259\,\mathrm{m/s}$ |
| $300\,\mathrm{s}$ | $0.154\,\mathrm{m}$ | $-0.0026\,\mathrm{m/s}$ |
| $600\,\mathrm{s}$ | $0.0007\,\mathrm{m}$ | $-0.00001\,\mathrm{m/s}$ |

**Check one row by hand.** At $t = 60\,\mathrm{s}$: $8 + 0.18 \times 60 = 18.8$, and $e^{-1.2} \approx 0.3012$, so $y \approx 18.8 \times 0.3012 \approx 5.66\,\mathrm{m}$. It matches.

**What it shows.** The chaser first drifts out a little further — to about $8.05\,\mathrm{m}$ at $t \approx 5\,\mathrm{s}$ — while the correction cancels its outward drift. Then it comes smoothly back. Since $8 + 0.18\,t$ is always positive, $y$ never crosses zero: the chaser never overshoots through the corridor centerline. By the ten-minute mark it is inside a millimeter of the line, from an eight-meter start.
:::

This is where line-of-sight guidance shows its limit. It needs the reference line itself to be right — chosen by mission design or supplied by an outside tracker. And canceling your distance from a line does not, by itself, bring the range to a *moving* target down to zero on any schedule. That is why classic beam riding worked best when the target was not moving much relative to the beam's aim. It is also why spacecraft corridor approaches plan and control the forward closing separately from the sideways correction shown here.

::: key Two ideas, two different failure modes
Pursuit guidance: $\chi = \lambda$, giving $a_{lat} = V_p\dot\lambda$. It is simple and needs only a bearing to the target, but against any target with crossing motion $\dot\lambda$ grows as the range shrinks, demanding the most lateral acceleration exactly when there is the least time left. Line-of-sight guidance: cancel the sideways deviation from a reference line supplied by a third party or by mission design, $a_\perp = -k_1 y - k_2 \dot y$. It is well behaved and is exactly a reference-following problem, but it is only as good as that outside reference, and it says nothing about the intercept geometry itself.
:::

::: warning Pursuit's formula looks like the answer, but it is not, yet
$a_{lat} = V_p\dot\lambda$ has exactly the shape of the law the next lesson derives, and that is no coincidence. But two things are wrong with it as it stands. First, it uses the pursuer's own speed $V_p$, where the right quantity turns out to be the **[[closing velocity|closing-velocity]]** $V_c$ — how fast the range is shrinking — which behaves very differently near intercept. Second, it has no free gain at all, so there is nothing to tune against sensor noise, lag or a target that maneuvers. Recognizing the shape is the useful part of studying pursuit. Trusting the formula as written is the mistake.
:::

::: note Deviated pursuit is a patch, not a fix
A fixed lead angle, $\chi = \lambda + \delta$, can be chosen to match one target speed and one crossing angle. For exactly that engagement, it removes the turn-rate problem. For any other — a target that maneuvers, or the same target approached from a different angle — the fixed $\delta$ is wrong and the problem is back. It is worth knowing mainly because it explains why the real fix, in the next lesson, is not a better fixed angle but a law that responds to the line-of-sight *rate*, with a gain you can tune.
:::

## Check yourself

::: check
Under pure pursuit, why is $\dot\chi = \dot\lambda$ true at every instant? What does that have to do with the lateral acceleration the pursuer needs?
:::

::: answer
Pure pursuit is *defined* by $\chi(t) = \lambda(t)$: the heading is set equal to the line-of-sight angle at every instant, by design, not as a result of the physics. Two quantities that are equal at every instant change at the same rate, so $\dot\chi = \dot\lambda$ follows straight from the definition.

Turning at rate $\dot\chi$ at constant speed $V_p$ needs a sideways (centripetal) acceleration $V_p\dot\chi$. Since $\dot\chi = \dot\lambda$, the lateral acceleration is exactly $V_p\dot\lambda$. So everything pursuit does, good and bad, comes straight from whatever $\dot\lambda$ is doing.
:::

::: check
At some instant, a pursuer flying pure pursuit at $V_p = 1.2\,\mathrm{m/s}$ measures a line-of-sight rate of $\dot\lambda = 0.008\,\mathrm{rad/s}$. What lateral acceleration is it commanding at that instant?
:::

::: answer
Use $a_{lat} = V_p\dot\lambda$:

$$
a_{lat} = 1.2 \times 0.008 = 0.0096\,\mathrm{m/s^2}.
$$

Nothing else about the engagement is needed. Under pure pursuit, the current line-of-sight rate and speed alone set the command.
:::

::: check
In the worked example, why did the stationary-target chase fly a perfectly straight line, while the drifting-target chase did not?
:::

::: answer
The line-of-sight rate is the across-the-line part of the relative velocity divided by the range.

Against a stationary target, the target's own velocity is zero. The pursuer's velocity, under pure pursuit, always points exactly along the current line of sight. So the relative velocity lies entirely along the line, its across part is zero, and $\dot\lambda = 0$. The line of sight never turns, the heading never has to change, and the path is straight.

A drifting target has velocity that is generally not along the line of sight, so the across part is not zero, $\dot\lambda \ne 0$, and the pursuer's heading — chained to $\lambda$ by the definition of pursuit — has to keep turning to follow it.
:::

::: check
A sideways deviation from an approach corridor starts at $y_0 = 5\,\mathrm{m}$ with $\dot y_0 = -0.01\,\mathrm{m/s}$ (already heading back). It is canceled with critically damped gains and $\omega_n = 0.03\,\mathrm{rad/s}$. What are $y$ and $\dot y$ at $t = 200\,\mathrm{s}$?
:::

::: answer
The gains are $k_1 = \omega_n^2 = 9\times10^{-4}\,\mathrm{s^{-2}}$ and $k_2 = 2\omega_n = 0.06\,\mathrm{s^{-1}}$.

Use the critically damped solution. First, $\dot y_0 + \omega_n y_0 = -0.01 + 0.03 \times 5 = 0.14\,\mathrm{m/s}$. So $y(t) = (5 + 0.14\,t)\,e^{-0.03t}$.

At $t = 200\,\mathrm{s}$: $5 + 0.14 \times 200 = 33$, and $e^{-6} \approx 0.002479$, so $y \approx 33 \times 0.002479 \approx 0.0818\,\mathrm{m}$.

For the rate, differentiate: $\dot y(t) = \big(0.14 - 0.03\,(5 + 0.14\,t)\big)\,e^{-0.03t}$. At $t = 200$: $(0.14 - 0.03 \times 33) \times 0.002479 = -0.85 \times 0.002479 \approx -0.00211\,\mathrm{m/s}$.

The five-meter offset has shrunk to under $10\,\mathrm{cm}$ and is still closing gently. Because $5 + 0.14\,t$ stays positive, it has not overshot and never will.
:::

::: check
In what exact sense is flying a V-bar approach corridor an example of reference-trajectory following from the last lesson, rather than something new?
:::

::: answer
Reference-trajectory following measures the deviation from a precomputed reference and feeds it back through a gain: $\mathbf{u} = \mathbf{u}^\star + \mathbf{K}(t)(\mathbf{x}^\star - \hat{\mathbf{x}})$.

Corridor-following is exactly this, with two things narrowed. The reference shrinks from a full state history $\mathbf{x}^\star(t)$ to one fixed line in space. And the fed-back quantity shrinks from the whole state deviation to only the sideways offset from that line: $a_\perp = -k_1 y - k_2\dot y$.

It inherits the same strength — a fixed reference you can inspect, plus an ordinary linear feedback with well-understood margins. It also inherits the same weakness: the law says nothing about anything the line does not encode, such as the schedule for closing the forward distance. Corridor approaches always manage that separately.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Line-of-sight rate | How fast the line to the target turns | $\dot\lambda = v_{rel,\perp}/R$, across speed over range |
| Pure pursuit | Always head straight at the target | $\chi = \lambda$, so $\dot\chi = \dot\lambda$ and $a_{lat} = V_p\dot\lambda$ |
| Pursuit's weakness | Turn demand grows near intercept | $\dot\lambda$ grows as $R \to 0$ against any crossing target |
| Deviated pursuit | Aim ahead by a fixed angle | $\chi = \lambda + \delta$; right for one engagement only |
| Line-of-sight (beam-rider) guidance | Stay on a reference line set by a third party or mission design | $a_\perp = -k_1 y - k_2\dot y$ |
| Critical damping | Fastest return with no swinging across | $\zeta = 1$: $k_1 = \omega_n^2$, $k_2 = 2\omega_n$; $y = (y_0 + (\dot y_0 + \omega_n y_0)t)\,e^{-\omega_n t}$ |
| Corridor following | V-bar or R-bar approach | Reference-trajectory following with the reference shrunk to a line |

Both ideas point at the same missing piece: a law shaped like $a_{lat} = V_p\dot\lambda$, but with the pursuer's own speed replaced by something better behaved, and with a gain you can tune. The next lesson derives exactly that law — proportional navigation.

::: context los-geometry Naming the angles
The pursuer P looks at the target T along the line of sight, a distance $R$ away. Both $\lambda$ and the heading $\chi$ are measured from the same fixed reference direction (dashed). Under pure pursuit the pursuer's velocity lies along the line of sight, so $\chi = \lambda$. The target's velocity splits into a part along the line (gray), which only changes $R$, and a part across it (red), which turns the line.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <defs>
    <marker id="lg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="#1f2a44"/>
    </marker>
    <marker id="lr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0 L10 5 L0 10 z" fill="#b4232c"/>
    </marker>
  </defs>
  <line x1="50" y1="140" x2="200" y2="140" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <line x1="50" y1="140" x2="290" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M110 140 A60 60 0 0 0 106.2 118.9" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="120" y="134" font-size="12" fill="#1d6fd1">λ</text>
  <line x1="50" y1="140" x2="124.9" y2="111.9" stroke="#1d6fd1" stroke-width="3" marker-end="url(#lg)"/>
  <text x="52" y="116" font-size="11" fill="#1d6fd1">pursuer velocity</text>
  <circle cx="50" cy="140" r="5" fill="#1f2a44"/>
  <text x="40" y="158" font-size="12" fill="#1f2a44">P</text>
  <circle cx="290" cy="50" r="5" fill="#1f2a44"/>
  <text x="298" y="46" font-size="12" fill="#1f2a44">T</text>
  <text x="178" y="84" font-size="12" fill="#1f2a44">R</text>
  <text x="200" y="66" font-size="11" fill="#1f2a44" text-anchor="end">line of sight</text>
  <line x1="290" y1="50" x2="270" y2="100" stroke="#1f2a44" stroke-width="2" marker-end="url(#lg)"/>
  <text x="276" y="118" font-size="11" fill="#1f2a44" text-anchor="middle">target velocity</text>
  <line x1="290" y1="50" x2="256" y2="62.8" stroke="#6c7a93" stroke-width="2" stroke-dasharray="4 3"/>
  <line x1="256" y1="62.8" x2="270" y2="100" stroke="#b4232c" stroke-width="2" marker-end="url(#lr)"/>
  <text x="300" y="86" font-size="11" fill="#b4232c">across</text>
  <text x="300" y="99" font-size="11" fill="#b4232c">the line</text>
</svg>
```
:::

::: context turn-accel Why turning takes V times omega
Picture the velocity as an arrow of length $V$. Turning at rate $\omega$ swings the arrow's tip around a circle of radius $V$. The tip moves at speed $V\omega$ — and the rate the velocity arrow changes is, by definition, the acceleration. So turning needs an acceleration of size $V\omega$, pointing sideways, toward the inside of the turn.

You may know it as $v^2/r$ for circular motion. It is the same thing: going around a circle of radius $r$ at speed $v$ means turning at $\omega = v/r$, and $v \cdot v/r = v^2/r$.
:::

::: context curve-of-pursuit An old puzzle with a new job
The curve a chaser traces while always heading at a moving target was studied by the French mathematician Pierre Bouguer in 1732, as the path of a pirate ship chasing a merchant ship. Four dogs at the corners of a square, each chasing the next, trace a famous version of it.

The picture shows the chaser's heading in the worked example. For most of the chase it barely changes, from $14°$ toward $40°$. In the last $75$ seconds or so it swings from about $60°$ to over $150°$ as the chaser whips around behind the target.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="150" x2="50" y2="25" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="30" x2="340" y2="30" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <line x1="50" y1="90" x2="340" y2="90" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="50.0,140.6 76.4,140.0 102.7,139.2 129.1,138.3 155.5,137.2 181.8,135.9 208.2,134.3 234.5,132.1 260.9,128.9 287.3,123.5 300.5,118.9 303.1,117.7 305.7,116.4 308.4,114.8 311.0,113.0 313.6,111.0 316.3,108.5 318.9,105.5 321.5,101.8 324.2,97.0 326.8,90.4 329.5,80.7 330.8,73.9 331.3,70.6 331.8,66.9 332.4,62.6 332.9,57.7 333.4,51.6 333.6,48.7"/>
  <text x="44" y="154" font-size="11" fill="#1f2a44" text-anchor="end">0°</text>
  <text x="44" y="94" font-size="11" fill="#1f2a44" text-anchor="end">90°</text>
  <text x="44" y="34" font-size="11" fill="#1f2a44" text-anchor="end">180°</text>
  <text x="50" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="181.8" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">500</text>
  <text x="313.6" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">1000 s</text>
  <text x="60" y="20" font-size="11" fill="#1f2a44">chaser heading</text>
  <text x="200" y="118" font-size="11" fill="#b4232c" text-anchor="middle">slow drift for 15 minutes</text>
  <text x="300" y="62" font-size="11" fill="#b4232c" text-anchor="end">sharp swing at the end</text>
</svg>
```
:::

::: context speed-ratio When the turn rate runs away
Call the speed ratio $k = V_p/V_T$, pursuer speed over target speed. Here $V_T = \sqrt{0.6^2 + 0.2^2} \approx 0.632\,\mathrm{m/s}$, so $k = 1.5/0.632 \approx 2.37$.

The classic result for pure pursuit of a target moving in a straight line: if the pursuer is less than twice as fast ($1 < k < 2$), its turn rate falls back toward zero at the very end of the tail chase. If it is more than twice as fast ($k > 2$), the turn rate grows without limit as the range goes to zero. Real interceptors are usually much faster than their targets, so they land in the bad case.
:::

::: context beam-riding Riding a radar beam
Early guided missiles of the late 1940s and 1950s, such as some of the first ship-launched antiaircraft missiles, used beam riding. A radar on the ground or on a ship kept its beam pointed at the target. The missile sensed where it sat inside the beam and steered to stay in the center.

The missile needed no radar of its own, which was a big advantage. The drawbacks: the beam spreads wider with distance, so accuracy gets worse farther out, and against a crossing target the beam itself has to swing fast, which drags the missile into hard turns near the end.
:::

::: context critical-damping Three ways to come back
The picture plots the V-bar example exactly: $y(t) = (8 + 0.18\,t)\,e^{-0.02t}$ over ten minutes. It bulges out slightly at first while the outward drift is canceled, then glides in without ever crossing the line.

With less damping ($\zeta < 1$) it would get back sooner but swing across the centerline and back. With more ($\zeta > 1$) it would creep in more slowly. Critical damping is the dividing line between the two.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.2"/>
  <line x1="50" y1="150" x2="50" y2="20" stroke="#1f2a44" stroke-width="1.2"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="50.0,30.0 52.4,29.2 57.2,31.1 64.4,39.7 71.6,51.8 78.8,65.1 86.0,78.0 93.2,90.0 100.4,100.6 107.6,109.7 114.8,117.4 122.0,123.9 129.2,129.1 136.4,133.4 143.6,136.9 150.8,139.7 158.0,141.9 165.2,143.7 172.4,145.1 179.6,146.2 186.8,147.0 194.0,147.7 201.2,148.2 208.4,148.6 215.6,148.9 222.8,149.2 230.0,149.4 237.2,149.5 244.4,149.6 251.6,149.7 258.8,149.8 266.0,149.8 273.2,149.9 280.4,149.9 287.6,149.9 294.8,149.9 302.0,150.0 309.2,150.0 316.4,150.0 323.6,150.0 330.8,150.0 338.0,150.0"/>
  <text x="44" y="154" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="44" y="34" font-size="11" fill="#1f2a44" text-anchor="end">8 m</text>
  <text x="50" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">0</text>
  <text x="194" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">300</text>
  <text x="338" y="166" font-size="11" fill="#1f2a44" text-anchor="middle">600 s</text>
  <text x="200" y="120" font-size="11" fill="#1d6fd1">offset from the V-bar line</text>
</svg>
```
:::

::: context closing-velocity The number that replaces the pursuer's speed
Closing velocity $V_c$ is how fast the range is shrinking: $V_c = -\dot R$, positive when you are getting closer. It is not the same as your own speed. Racing head-on toward a target, $V_c$ is your speed plus the target's. Chasing it from behind, it is your speed minus the target's.

The next lesson shows that putting $V_c$ where pursuit had $V_p$ — and adding a tunable gain $N$ — gives proportional navigation, the most widely used guidance law there is.
:::
