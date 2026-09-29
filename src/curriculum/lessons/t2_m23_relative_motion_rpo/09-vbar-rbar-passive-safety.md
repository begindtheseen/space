---
id: l09-vbar-rbar-passive-safety
title: V-bar and R-bar approaches and passive safety
minutes: 26
covers:
  - V-bar and R-bar approaches and their safety properties
  - passive safety and safety ellipses
---

Imagine riding a bicycle toward a wall, and your brakes suddenly fail. What happens next depends on how you were riding. On flat ground you roll on into the wall. Riding up a gentle hill, the hill itself slows you down, and you may stop and roll back before you reach it. Same bike, same speed, same failure — very different ending, because the ground under you either helps or does nothing.

A spacecraft approaching a space station faces the same question. Every approach line a chaser can fly is a direction in the target's LVLH frame. Two of those directions dominate real rendezvous. One is straight in along the direction of flight. The other is straight up from below, along the local vertical. On a diagram they look like two equally good lines to the target. The moment a planned burn fails to fire, they behave completely differently.

This lesson works out *how* differently, with real numbers. It ends with the one idea that shapes every keep-out zone and approach corridor in use today: **an approach is only as good as what happens when the next planned burn does not fire.**

## V-bar and R-bar

Recall the LVLH frame from the first lesson: $x$ radial (up, away from Earth), $y$ in-track (the direction of flight), $z$ cross-track.

A **V-bar approach** flies along the in-track ($\hat{\mathbf{y}}$) line through the target. "V" is for velocity: this is the line along the target's direction of motion. A chaser closing from behind sits at $y < 0$ and moves toward $y = 0$. One closing from ahead sits at $y > 0$.

An **R-bar approach** flies along the radial ($\hat{\mathbf{x}}$) line through the target — the local vertical. "R" is for radius. It usually comes **[[from below|vbar-rbar-picture]]** ($x < 0$, closer to Earth, moving up toward $x = 0$). NASA calls that the **+R-bar** approach, because NASA's own station frame points its radial axis *toward* Earth. Occasionally an R-bar approach comes from above.

Both are flown in practice. Vehicles that dock at the station's forward port usually fly their final stretch along the V-bar. Cargo ships that are caught by the station's robotic arm — Japan's HTV, Northrop Grumman's Cygnus, and the first-generation Dragon — came up the R-bar from below. The **[[Space Shuttle|shuttle-rbar]]** also came up the R-bar before swinging around to the V-bar to dock. This lesson works out why the R-bar is so popular, instead of treating it as a historical habit.

::: key V-bar and R-bar
V-bar approaches along the velocity (in-track) direction; R-bar approaches along the radius, from below (+R-bar) or above. R-bar exploits the natural orbital-mechanics braking of the radial direction, so a missed burn tends to drop the chaser away rather than carry it into the target.
:::

## Passive safety

Here is the central idea of the lesson, in one sentence: assume the engine dies right now, and ask whether you still miss.

"Dies" means *every* later burn fails — a total loss of propulsion from this instant on. What is left is **free drift**: the chaser coasts under gravity alone, following the CW equations. If that free-drift path stays outside the **[[keep-out sphere|keep-out-sphere]]** — a protected bubble around the target — for a long enough time, the approach point is **passively safe**. "Passive" means the safety comes from the path itself, with nothing needing to work.

::: key Passive safety, defined
An approach point is **passively safe** if, assuming every subsequent maneuver fails to execute — total loss of propulsion from that instant on — the resulting free-drift trajectory stays outside the keep-out volume for a specified time, often **[[24 hours|twenty-four-hours]]**. It is a design requirement, not a hope. It is verified by propagating forward from every point on the planned approach with all later burns set to zero — never assumed because an approach's geometry looks careful.
:::

That last sentence matters. You will often hear "R-bar is the safe one". That is a half-truth repeated until it sounds like a law of physics. The numbers below show the R-bar advantage is real and measurable, but *not absolute*. They also show that the V-bar's weakness is a specific, computable amount, not a vague danger.

## The test: a missed burn at 200 m

Set up a fair comparison. In both cases the chaser is $200\,\mathrm{m}$ from the target — the radius of the ISS keep-out sphere. It is closing at $0.1\,\mathrm{m/s}$. The next planned braking burn is about to fire. It does not. Propagate the free-drift CW motion for 24 hours and find the closest the chaser ever gets.

**V-bar case:** $\boldsymbol\rho_0 = (0,\ -200,\ 0)\,\mathrm{m}$ and $\dot{\boldsymbol\rho}_0 = (0,\ 0.1,\ 0)\,\mathrm{m/s}$. It is closing from behind, with no radial offset.

**R-bar case:** $\boldsymbol\rho_0 = (-200,\ 0,\ 0)\,\mathrm{m}$ and $\dot{\boldsymbol\rho}_0 = (0.1,\ 0,\ 0)\,\mathrm{m/s}$. It is closing from below, with no in-track offset.

| | V-bar | R-bar |
| --- | --- | --- |
| Starting range | 200.0 m | 200.0 m |
| Minimum range reached | **162.2 m** | **193.5 m** |
| Time to minimum | 553 s (9.2 min) | 130 s (2.2 min) |
| How far inside the 200 m sphere | 37.8 m | 6.5 m |
| Range $0.3$ of an orbit later | 432 m | 1265 m |

Both paths **[[dip inside the 200 m sphere|missed-burn-plot]]** before they turn away. So at this closing speed neither approach is passively safe. But the amounts are very different. The V-bar chaser coasts $37.8\,\mathrm{m}$ into the sphere before turning around. The R-bar chaser barely gets in — $6.5\,\mathrm{m}$ — and reverses almost at once. After the turn, the R-bar chaser also leaves nearly three times faster: $1265\,\mathrm{m}$ away after $0.3$ of an orbit, against $432\,\mathrm{m}$ for the V-bar.

::: example Why R-bar brakes and V-bar does not
The answer is in the CW radial equation, $\ddot x = 3n^2x + 2n\dot y$. Read $\ddot x$ as "x-double-dot", the radial acceleration. Evaluate it at the instant the thrust is lost. Use $n = 1.1282\times10^{-3}\,\mathrm{rad/s}$, so $n^2 = 1.2727\times10^{-6}\,\mathrm{s^{-2}}$.

**R-bar.** Here $x_0 = -200\,\mathrm{m}$ and $\dot y_0 = 0$:

$$
\ddot x(0) = 3n^2x_0 = 3 \times 1.2727\times10^{-6} \times (-200) \approx -7.64\times10^{-4}\,\mathrm{m/s^2}.
$$

It is negative — pointing down — while the chaser is moving up. So it acts as a brake. This is the **[[gravity-gradient term|gravity-gradient]]** $3n^2x$, the same term that made the CW radial equation unstable in the derivation. For a chaser *below* the target and climbing toward it, that term works *for* safety.

**How far does the brake let it go?** Treat the deceleration as roughly constant. Stopping from $0.1\,\mathrm{m/s}$ takes $0.1 / (7.64\times10^{-4}) \approx 131\,\mathrm{s}$, and covers $\frac{v^2}{2a} = \frac{0.1^2}{2 \times 7.64\times10^{-4}} \approx 6.5\,\mathrm{m}$. That matches the table: $130\,\mathrm{s}$ and $6.5\,\mathrm{m}$. The brake explains the whole result.

**V-bar.** Here $x_0 = 0$ and $\dot y_0 = 0.1\,\mathrm{m/s}$:

$$
\ddot x(0) = 2n\dot y_0 = 2 \times 1.1282\times10^{-3} \times 0.1 \approx 2.26\times10^{-4}\,\mathrm{m/s^2}.
$$

It is positive, pushing the chaser *up*, off the V-bar line. This is the **[[Coriolis|coriolis-coupling]]** coupling between in-track speed and radial motion. It does nothing, at first, to slow the closing speed itself.

The in-track closing only stops once the chaser has climbed high enough. From the CW in-track equation, $\dot y = \dot y_0 - 2n(x - x_0)$, so the closing speed reaches zero when the chaser has risen $x = \dot y_0/(2n) = 0.1/(2 \times 1.1282\times10^{-3}) \approx 44\,\mathrm{m}$. That takes about $640\,\mathrm{s}$. All that time the chaser keeps creeping forward. That is why it gets six times deeper into the sphere.
:::

::: key Why R-bar is passively safer, and what it costs
On R-bar, the gravity-gradient term naturally decelerates an approaching vehicle, so an unplanned free drift tends to move it away along-track rather than into the target. The cost is continuous thrusting against the gradient — more propellant — and **[[plume impingement|plume-impingement]]** geometry to manage, with thrusters firing for a long time close to the target.
:::

The cost deserves a few sentences of its own. The same term that brakes a failed approach also pulls down on a working one. To keep climbing up the R-bar at the planned rate, the chaser must push *up* against that pull the whole way, so it uses more propellant than a V-bar approach, where sitting still costs nothing. And all that thrusting happens close to the station, for a long time, so the direction of every jet's exhaust has to be planned to keep it off the station's solar arrays and windows.

## Closing rate and offsets both matter

Passive safety at a given range is not set by the choice of line alone. How fast you were closing matters. So does whether you were exactly on the line or a little off it.

::: example Slower is safer, on both bars
Repeat the V-bar test from $200\,\mathrm{m}$ at three closing rates:

| Closing rate | Minimum range | Depth inside sphere |
| --- | --- | --- |
| 0.100 m/s | 162.2 m | 37.8 m |
| 0.050 m/s | 180.0 m | 20.0 m |
| 0.020 m/s | 191.7 m | 8.3 m |

Halving the closing rate roughly halves the depth: $37.8$ down to $20.0\,\mathrm{m}$. Cutting it by five, from $0.1$ to $0.02\,\mathrm{m/s}$, cuts the depth from $37.8$ to $8.3\,\mathrm{m}$.

The R-bar shows the same trend from a much smaller start. At $0.05\,\mathrm{m/s}$ its minimum range is already $198.4\,\mathrm{m}$, only $1.6\,\mathrm{m}$ inside. (The braking estimate predicts this: the depth $v^2/2a$ goes as the square of the speed, so half the speed gives a quarter of $6.5\,\mathrm{m}$, about $1.6\,\mathrm{m}$.)

This is the reason approach glideslopes slow the closing rate near a keep-out boundary instead of holding one speed all the way in. The rate itself is a passive-safety lever, not only a schedule.
:::

::: example A small offset changes the outcome, and its direction matters
Start the same $200\,\mathrm{m}$, $0.1\,\mathrm{m/s}$ V-bar test, but a little above or below the line — a **radial bias** $x_0$:

| Radial bias $x_0$ | Minimum range |
| --- | --- |
| $-20\,\mathrm{m}$ (toward Earth) | 149.1 m |
| $-10\,\mathrm{m}$ | 156.3 m |
| $0$ (on the line) | 162.2 m |
| $+10\,\mathrm{m}$ (away from Earth) | 167.6 m |
| $+20\,\mathrm{m}$ | 172.5 m |

Biasing the approach slightly *up* reduces the depth. Biasing it *down* makes it worse.

**Why?** Remember from the secular-drift lesson: higher means slower. A chaser sitting above the target is on a slightly higher, slower orbit, so it tends to drift backward — away from a target it is approaching from behind. A chaser below the target drifts forward, into it. The effect is not symmetric, and getting the sign wrong actively hurts the margin you meant to protect. A biased V-bar approach is a real design tool, but only when the direction is checked against the dynamics, never guessed.
:::

## A collision avoidance burn is not automatically effective

When a burn is missed, the instinct is to fire whatever thrusters still work, right away. That is a **collision avoidance maneuver**, or **CAM**, and the next lesson treats it properly. Here is a preview: not every CAM direction is equally good.

Add an instant upward (radially outward) kick to the missed-burn V-bar state above:

- $0.05\,\mathrm{m/s}$ upward raises the minimum range from $162.2$ to $178.0\,\mathrm{m}$.
- $0.10\,\mathrm{m/s}$ upward reaches only $186.0\,\mathrm{m}$ — still inside the $200\,\mathrm{m}$ sphere.

Now try a **retrograde** burn of the same $0.10\,\mathrm{m/s}$ instead — backward along the in-track line, canceling the closing speed. The minimum range is exactly $200.0\,\mathrm{m}$. The chaser never enters the sphere at all.

The reason: after that burn the chaser is sitting still on the V-bar, $200\,\mathrm{m}$ behind the target. That point is on the target's own orbit, so it is a natural parking spot. With no relative velocity and no radial offset, nothing pushes it anywhere. For this geometry, the best use of propellant is not to push away but to *stop closing*.

::: warning R-bar is safer, not safe
In the test, the R-bar went $6.5\,\mathrm{m}$ inside the sphere and the V-bar $37.8\,\mathrm{m}$. Smaller is not zero. At a higher closing rate, or from a smaller starting range, an R-bar approach can still be carried inside a keep-out boundary before its natural braking takes over. Passive safety belongs to a specific state — range, closing rate and offset, all together — and is checked by propagating from that exact state. It is never a permanent label on "R-bar" or "V-bar" as a category. This is exactly why this module's exercises ask you to check passive safety at *every* point along a planned approach, not once at the start.
:::

## Safety ellipses

So far the chaser has flown along a line. There is another way to stay safe near a target: park on a closed loop around it that *cannot* hit it, even when something goes wrong. That loop is a **safety ellipse**.

Start from the football orbit of the football-orbits lesson. A pure radial velocity kick $\dot x_0$ from a point on the V-bar gives a closed 2:1 ellipse in the $x$–$y$ plane. Its radial half-width is $A_x = \dot x_0/n$. Pick the start $y_0 = 2A_x$ ahead of the target and the loop is centered on it:

$$
x(t) = A_x\sin nt, \qquad y(t) = 2A_x\cos nt.
$$

That loop never touches the target *if the numbers are perfect*. But the loop crosses the V-bar line — the line $x = 0$ — twice every orbit. Now suppose the in-track velocity is slightly wrong. From the secular-drift lesson, that makes the whole loop slide along the V-bar, a little more every orbit. Sooner or later, one of those crossings of the V-bar happens right where the target is.

The fix is to add cross-track motion, timed so that the chaser is far off to the side exactly when it crosses the V-bar. Start with a cross-track offset $z_0 = A_z$ and no cross-track velocity:

$$
z(t) = A_z\cos nt.
$$

Now look along the V-bar, so you see only $x$ and $z$. When $x = 0$ ($\sin nt = 0$), $\cos nt = \pm 1$, so $z = \pm A_z$. When $z = 0$, $x = \pm A_x$. In the $x$–$z$ view the chaser traces an ellipse with half-widths $A_x$ and $A_z$ around the V-bar line, and never passes through it. Its distance from the line is always at least the smaller of $A_x$ and $A_z$.

That is what makes it safe. **[[Sliding along the V-bar|safety-ellipse-picture]]** — the drift an in-track error causes — never brings the chaser onto the line, so it can never pass *through* the target. It passes it off to one side.

::: key Safety ellipse
A **safety ellipse** combines a drift-free in-plane relative orbit ($x = A_x\sin nt$) with cross-track motion a quarter-cycle out of step ($z = A_z\cos nt$). Seen along the V-bar, the chaser circles the line on an ellipse with half-widths $A_x$ and $A_z$, so it never crosses the V-bar. Even if an in-track error makes it drift along the V-bar, its miss distance from the target stays near $\min(A_x, A_z)$.
:::

::: example A safety ellipse that survives an in-track error
Build a loop with $A_x = A_z = 100\,\mathrm{m}$ on this module's reference orbit. The start is $x_0 = 0$, $y_0 = 200\,\mathrm{m}$, $z_0 = 100\,\mathrm{m}$, with velocity $\dot x_0 = nA_x = 1.1282\times10^{-3} \times 100 \approx 0.113\,\mathrm{m/s}$, $\dot y_0 = 0$, $\dot z_0 = 0$.

**Perfect case.** The minimum range over 24 hours is $100\,\mathrm{m}$, and the chaser is always exactly $100\,\mathrm{m}$ from the V-bar line: $\sqrt{x^2 + z^2} = \sqrt{100^2\sin^2 nt + 100^2\cos^2 nt} = 100$.

**Now add an error.** Suppose the in-track velocity comes out $0.01\,\mathrm{m/s}$ too high. From the secular-drift lesson, the loop now slides $3 \times 0.01 \times 5569.4 \approx 167\,\mathrm{m}$ backward every orbit, so within a day it sweeps past the target again and again. Propagate for 24 hours:

| Version | Minimum range over 24 h |
| --- | --- |
| In-plane football only ($A_z = 0$) | 32.6 m |
| Safety ellipse ($A_z = 100\,\mathrm{m}$) | 98.5 m |

With the same $0.01\,\mathrm{m/s}$ error the other way ($\dot y_0 = -0.01\,\mathrm{m/s}$), the safety ellipse still keeps a minimum range of $81.3\,\mathrm{m}$.

**Does it make sense?** The football alone slid right up to $33\,\mathrm{m}$ from the target — deep inside any keep-out zone. The safety ellipse kept its distance close to $100\,\mathrm{m}$, because it never lines up with the V-bar. The error also nudges the loop's radial motion a little, which is why the margin shrinks from $100$ to about $80\,\mathrm{m}$ in the worst case, instead of staying exactly $100\,\mathrm{m}$.
:::

## Check yourself

::: check
At the instant a burn is missed, a chaser on the R-bar has $x_0 = -150\,\mathrm{m}$, $\dot x_0 = 0$ and $\dot y_0 = 0$. What is $\ddot x(0)$, and what does its sign tell you about the free drift that follows?
:::

::: answer
$$
\ddot x(0) = 3n^2x_0 = 3(1.1282\times10^{-3})^2(-150) \approx -5.73\times10^{-4}\,\mathrm{m/s^2}
$$

(that is $-5.73\times10^{-7}\,\mathrm{km/s^2}$).

It is negative, so the chaser starts accelerating downward — away from the target above it. It began at rest ($\dot x_0 = 0$), so even with no closing speed at all, the gravity-gradient term by itself starts moving it away from the target, not toward it. That is the source of the R-bar's passive-safety advantage.
:::

::: check
Without computing anything: why does a V-bar chaser's radial acceleration, at the moment of a missed burn, depend on its closing rate $\dot y_0$, while an R-bar chaser sitting still on the line ($\dot x_0 = 0$) has a radial acceleration even with zero velocity?
:::

::: answer
The radial acceleration is $\ddot x = 3n^2x_0 + 2n\dot y_0$.

On the V-bar, $x_0 = 0$, so only the Coriolis term $2n\dot y_0$ is left. It exists only because of the in-track *velocity*, and it vanishes if $\dot y_0 = 0$.

On the R-bar, $x_0 \ne 0$, so the gravity-gradient term $3n^2x_0$ is there whatever the velocity. It depends on *position* — how far the chaser sits above or below the target's orbit — so it needs no closing speed to act.
:::

::: check
Two identical missed-burn V-bar states are compared. One gets no further action. The other gets an instant $0.1\,\mathrm{m/s}$ retrograde impulse (backward along the in-track line, against the closing speed). Which reaches the larger minimum range, and why does that make physical sense?
:::

::: answer
The retrograde burn gives the larger minimum range: exactly $200.0\,\mathrm{m}$, with no entry into the sphere, against $162.2\,\mathrm{m}$ with no action.

The retrograde burn cancels the whole $0.1\,\mathrm{m/s}$ closing speed. The chaser is then at rest on the V-bar, $200\,\mathrm{m}$ behind the target, with no radial offset. That point lies on the target's own orbit, so it is an equilibrium: nothing pulls it toward the target or away. It stays put, and its closest approach is its starting range.
:::

::: check
Someone argues: "R-bar went less deep than V-bar at $0.1\,\mathrm{m/s}$, so R-bar must be passively safe at any closing rate and any starting range." Find the flaw, using only what this lesson showed.
:::

::: answer
The lesson's own numbers show the R-bar chaser *still* went inside the sphere at $0.1\,\mathrm{m/s}$: $193.5\,\mathrm{m}$ from a $200\,\mathrm{m}$ start. R-bar is *better*, not immune.

Nothing here shows the margin holds at every rate or range. The lesson showed that a higher closing rate means a deeper dip (on both bars — the braking depth grows as the square of the speed). So a fast enough R-bar approach, or one starting close enough, will go well inside the boundary. It has to be checked from each state, not assumed.
:::

::: check
Biasing a V-bar approach slightly upward (positive $x_0$) reduces how deep the chaser goes. But the initial V-bar acceleration $\ddot x(0) = 2n\dot y_0$ does not depend on $x_0$ at all. How can the bias help?
:::

::: answer
The acceleration at the first instant is only the start of the story. $x_0$ enters the full CW solution: through $(4 - 3\cos nt)x_0$ in $x(t)$, and through $6(\sin nt - nt)x_0$ in $y(t)$.

The second term is the one that matters. A chaser above the target is on a slightly higher orbit with a longer period, so it drifts backward along the in-track line. When it is approaching from behind, backward means *away* from the target. The drift fights the closing motion, so the chaser stops short sooner. A bias toward Earth does the opposite: a lower, faster orbit drifts it forward, into the target.
:::

::: check
A plain football orbit centered on a target is closed and never touches the target in the CW model. Why is it still not considered passively safe for a long stay, and what does adding cross-track motion fix?
:::

::: answer
The football crosses the V-bar line twice each orbit. Any small in-track velocity error makes the whole loop drift along the V-bar, so sooner or later a crossing happens right at the target. In the worked example, a $0.01\,\mathrm{m/s}$ error brought it to $32.6\,\mathrm{m}$.

Adding cross-track motion a quarter-cycle out of step, $z = A_z\cos nt$, means the chaser is always off to the side when it crosses $x = 0$. Seen along the V-bar it circles the line and never touches it. Drift along the V-bar then slides it *past* the target at roughly $\min(A_x, A_z)$ instead of into it — $98.5\,\mathrm{m}$ with the same error in the example.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| V-bar / R-bar | Approach along the in-track ($y$) / radial ($x$) line through the target; +R-bar comes from below |
| Passive safety | Free drift after total loss of propulsion still misses by more than the keep-out distance, for a stated time (often 24 h) |
| $\ddot x(0)=3n^2x_0+2n\dot y_0$ | Radial acceleration when thrust is lost — explains both bars |
| R-bar, missed burn from 200 m at 0.1 m/s | Dips to 193.5 m (6.5 m inside), leaves fast; braking $3n^2x_0$ does it |
| V-bar, same test | Dips to 162.2 m (37.8 m inside), leaves slowly |
| R-bar cost | Continuous thrust against the gradient; long thruster firings close to the target |
| Closing rate | A lower rate reduces the dip on both bars |
| Radial bias | Upward bias reduces the V-bar dip; downward bias increases it |
| Best single CAM here | A retrograde burn that stops the closing beats an equal upward push |
| Safety ellipse | $x = A_x\sin nt$, $z = A_z\cos nt$: circles the V-bar, never crosses it |

Passive safety at a single point is the building block. The next lesson scales it up to a whole approach: the corridor and keep-out sphere that bound where a chaser may be, and the collision avoidance maneuvers that rescue a trajectory when a burn really does fail partway in.

::: context vbar-rbar-picture The two lines through the target
Stand in the target's frame. The V-bar runs forward and backward along the direction of flight. The R-bar runs straight up and down, toward and away from Earth. A chaser can come in along either one; the circle is the $200\,\mathrm{m}$ keep-out sphere.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="0" y="182" width="360" height="18" fill="#8fb8f0"/>
  <text x="180" y="195" font-size="11" text-anchor="middle" fill="#1f2a44">Earth (down)</text>
  <line x1="20" y1="90" x2="340" y2="90" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <line x1="180" y1="10" x2="180" y2="175" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <circle cx="180" cy="90" r="50" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <rect x="173" y="83" width="14" height="14" fill="#1f2a44"/>
  <text x="338" y="82" font-size="11" text-anchor="end" fill="#1f2a44">V-bar → flight</text>
  <text x="186" y="20" font-size="11" fill="#1f2a44">R-bar (up)</text>
  <line x1="40" y1="90" x2="118" y2="90" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="126,90 114,84 114,96" fill="#1d6fd1"/>
  <text x="40" y="110" font-size="11" fill="#1d6fd1">V-bar approach</text>
  <line x1="180" y1="170" x2="180" y2="152" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="180,144 174,156 186,156" fill="#1d6fd1"/>
  <text x="190" y="168" font-size="11" fill="#1d6fd1">+R-bar approach</text>
  <text x="236" y="130" font-size="11" fill="#b4232c">keep-out sphere</text>
</svg>
```
:::

::: context shuttle-rbar How the Shuttle came in
The Space Shuttle approached Mir from below, up the R-bar, and on its later ISS missions it came up the R-bar too. Coming from below meant the natural braking in this lesson did part of the slowing down, so fewer braking jets had to fire toward the station. The Shuttle also had a special jet mode, called Low-Z, that reduced how hard its exhaust hit the target. After the loss of Columbia in 2003, each Shuttle paused below the ISS and did a slow back-flip, the Rendezvous Pitch Maneuver, so the station crew could photograph its heat shield. It then moved around to the V-bar, ahead of the station, for the final docking.
:::

::: context keep-out-sphere The protected bubble
A **keep-out sphere** is an imaginary ball around the target. A visiting vehicle may enter it only with explicit permission and a trajectory already shown to be safe. For the ISS it has a radius of $200\,\mathrm{m}$. Around it sits a larger **approach ellipsoid**, $4\,\mathrm{km}$ long in the in-track direction and $2\,\mathrm{km}$ across in the other two, which sets where the tighter rules begin. Inside the sphere the vehicle must stay in a narrow corridor — the subject of the next lesson.
:::

::: context twenty-four-hours Why a full day?
Twenty-four hours is about fifteen and a half orbits in low Earth orbit. That is long enough for secular drift to show itself: a loop that looks fine for one orbit can slide into the target after five. A day is also a realistic time for people on the ground to notice a failure, diagnose it and plan a rescue burn with whatever thrusters still work. So the free-drift check asks: will the chaser still be clear by the time anyone could act?
:::

::: context missed-burn-plot The two dips side by side
Range against time after the missed burn, both starting $200\,\mathrm{m}$ out and closing at $0.1\,\mathrm{m/s}$. The R-bar case (red) dips a little and climbs away fast. The V-bar case (blue) dips deeper and later, then leaves slowly. The dashed line is the $200\,\mathrm{m}$ keep-out radius.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 205" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="20" x2="50" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="148" x2="345" y2="148" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5,4"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,148.0 54.8,149.3 59.7,150.7 64.5,152.0 69.3,153.3 74.2,154.6 79.0,155.8 83.8,157.1 88.7,158.3 93.5,159.4 98.3,160.6 103.2,161.6 108.0,162.6 112.8,163.6 117.7,164.4 122.5,165.2 127.3,166.0 132.2,166.6 137.0,167.1 141.8,167.5 146.7,167.9 151.5,168.1 156.3,168.1 161.2,168.1 166.0,167.9 170.8,167.6 175.7,167.1 180.5,166.5 185.3,165.8 190.2,164.9 195.0,163.8 199.8,162.6 204.7,161.2 209.5,159.7 214.3,158.0 219.2,156.2 224.0,154.2 228.8,152.0 233.7,149.7 238.5,147.3 243.3,144.7 248.2,141.9 253.0,139.0 257.8,136.0 262.7,132.8 267.5,129.5 272.3,126.0 277.2,122.4 282.0,118.6 286.8,114.8 291.7,110.8 296.5,106.6 301.3,102.3 306.2,97.9 311.0,93.4 315.8,88.8 320.7,84.0 325.5,79.1 330.3,74.0 335.2,68.9 340.0,63.6"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="50.0,148.0 54.8,149.2 59.7,150.2 64.5,150.9 69.3,151.3 74.2,151.5 79.0,151.4 83.8,151.1 88.7,150.5 93.5,149.6 98.3,148.5 103.2,147.1 108.0,145.5 112.8,143.7 117.7,141.6 122.5,139.2 127.3,136.6 132.2,133.7 137.0,130.6 141.8,127.2 146.7,123.6 151.5,119.8 156.3,115.6 161.2,111.3 166.0,106.6 170.8,101.7 175.7,96.5 180.5,91.1 185.3,85.3 190.2,79.3 195.0,73.0 199.8,66.3 204.7,59.4 209.5,52.1 214.3,44.6 219.2,36.7 224.0,28.4"/>
  <text x="46" y="152" font-size="11" text-anchor="end" fill="#1f2a44">200</text>
  <text x="46" y="98" font-size="11" text-anchor="end" fill="#1f2a44">300</text>
  <text x="46" y="45" font-size="11" text-anchor="end" fill="#1f2a44">400</text>
  <text x="50" y="14" font-size="11" fill="#1f2a44">range (m)</text>
  <text x="50" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">0</text>
  <text x="147" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">500</text>
  <text x="243" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">1000</text>
  <text x="340" y="196" font-size="11" text-anchor="middle" fill="#1f2a44">1500 s</text>
  <text x="228" y="40" font-size="11" fill="#b4232c">R-bar: 193.5 m at 130 s</text>
  <text x="120" y="176" font-size="11" fill="#1d6fd1">V-bar: 162.2 m at 553 s</text>
</svg>
```
:::

::: context gravity-gradient The stretch that helps
Gravity weakens with height, so across the small gap between two spacecraft it pulls a little harder on the lower one. Seen from the target, that difference — together with the frame's spin — stretches the pair apart along the vertical. That is the $3n^2x$ term. A chaser below the target is pulled further down; one above is pushed further up. When you are coming *up* toward the target from below, that downward pull acts as a brake. It is the same stretching that some satellites use to keep one face pointed at Earth without any fuel.
:::

::: context coriolis-coupling Sideways from speed
In a spinning frame, moving in one direction makes you drift sideways — the Coriolis effect. In the target's frame, flying forward along the V-bar produces an upward acceleration $2n\dot y$. The physical meaning is simpler: moving a bit faster than the target along its orbit means your orbit is a bit bigger, so you start to rise. Rising, you slow relative to the target, which is why the V-bar chaser's closing speed eventually dies away — but only after it has climbed about $44\,\mathrm{m}$.
:::

::: context plume-impingement When exhaust hits the target
**Plume impingement** is the exhaust of a thruster striking another object. Even small thrusters throw out gas fast enough to push on a light structure like a solar array, heat its surface, and leave a thin film of unburned propellant on windows, radiators and sensors. Near a crewed station that is a real design limit. Approach rules cap how hard and how often a visitor may fire jets toward the station, and a long R-bar climb, with the chaser thrusting close to the station the whole way, is one of the places where those rules bite.
:::

::: context safety-ellipse-picture Looking down the V-bar
Look along the V-bar, so the target is a dot and the V-bar is a point in the middle. Left: a plain football orbit moves only up and down in this view, straight through the V-bar line — any drift along the V-bar can bring it onto the target. Right: add cross-track motion a quarter-cycle out of step and the chaser circles the line, never touching it. Here $A_x = 100\,\mathrm{m}$ and $A_z = 60\,\mathrm{m}$, so it always stays at least $60\,\mathrm{m}$ from the V-bar.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="90" y1="35" x2="90" y2="175" stroke="#b4232c" stroke-width="3"/>
  <circle cx="90" cy="105" r="6" fill="#1f2a44"/>
  <text x="90" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">football only</text>
  <text x="100" y="140" font-size="11" fill="#b4232c">crosses the line</text>
  <ellipse cx="270" cy="105" rx="42" ry="70" fill="none" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="270" cy="105" r="6" fill="#1f2a44"/>
  <line x1="270" y1="105" x2="312" y2="105" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3,3"/>
  <text x="270" y="22" font-size="11" text-anchor="middle" fill="#1f2a44">safety ellipse</text>
  <text x="316" y="101" font-size="11" fill="#6c7a93">60 m</text>
  <text x="180" y="192" font-size="11" text-anchor="middle" fill="#1f2a44">across: cross-track z · up: radial x · dot: V-bar</text>
</svg>
```
:::
