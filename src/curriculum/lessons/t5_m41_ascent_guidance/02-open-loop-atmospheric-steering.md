---
id: l02-open-loop-atmospheric-steering
title: Open-loop steering and why the loop stays open in the atmosphere
minutes: 15
covers:
  - Open-loop atmospheric steering (the pitch program) and why closed-loop guidance is avoided in dense atmosphere
---

A guidance engineer's instinct is to close every loop available: sense the state, compare it to where you want to be, command a correction. The previous lesson's gravity turn already does this in one narrow sense — it self-steers by flying zero angle of attack — but it is not correcting toward any *target*. Nothing in it looks at the vehicle's actual position or velocity and asks whether they are on track for the intended orbit. Through the densest part of the atmosphere, that omission is deliberate. This lesson explains precisely why: not "closed-loop guidance is hard here," which is true of every phase of flight, but why closing it here is actively dangerous, in the same load-indicator language the atmospheric flight module built for the bending problem.

## What the pitch program actually is

The **pitch program** is a stored, open-loop attitude command — a function of time (or, in some implementations, of measured velocity) since liftoff, computed once, before flight, and flown without modification in response to the vehicle's actual trajectory. It has no error signal. If the vehicle is a little off the reference path the program was built for, the pitch program does not know and does not care; it commands the same attitude at second 90 whether the vehicle is exactly where the design intended or a kilometre off to one side.

This sounds like a liability, and outside the atmosphere it would be. Inside it, it is the point. The gravity turn from the previous lesson already generates most of the pitch program's shape — zero angle of attack, flown against a fixed initial kick — and a real flight computer typically stores the resulting attitude-versus-time (or attitude-versus-velocity) history from the offline-optimized reference trajectory, a process this module returns to when it discusses ascent trajectory optimization as an offline problem. The vehicle flies that stored program, corrected only for small deviations by the attitude control loop holding the *commanded* attitude against wind and disturbance torques — not by guidance changing what is commanded based on where the vehicle actually is.

::: key
The pitch program is a precomputed function of time (or velocity), flown open loop: no feedback from the vehicle's actual position or velocity changes what attitude is commanded next. The attitude control system still closes its own, much faster loop — holding the *commanded* attitude against disturbances — but guidance itself is not correcting toward the target orbit yet.
:::

## The argument against closing it here

The atmospheric flight module's load indicator, $\bar q\alpha$ — dynamic pressure times angle of attack — sets the bending moment on the airframe, and a launch vehicle is certified against a fixed envelope of it, typically of order 100 kPa·deg for a large vehicle. Any nonzero angle of attack, at high enough $\bar q$, threatens that envelope regardless of *why* the angle of attack is nonzero — wind, a control error, or a deliberate steering command from a guidance law trying to correct the trajectory. Closed-loop guidance, by construction, commands whatever attitude change gets the vehicle back on target, and it does not consult the structural envelope before doing so. Run that logic at max-Q and the guidance law is, unknowingly, choosing exactly the worst moment in the entire flight to spend the vehicle's load budget.

Put a number on it. At the max-Q point from the previous lesson's worked ascent — $\bar q = 44.6$ kPa, vehicle mass 375 t — take a representative normal-force slope $C_{N\alpha} = 4.0\ \mathrm{rad^{-1}}$ (a typical order of magnitude for a slender launcher; a real vehicle's own value comes from its aerodynamics database), giving $N_\alpha = \bar q\, S\, C_{N\alpha} = 44{,}610 \times 10.52 \times 4.0 = 1.877\ \mathrm{MN/rad}$.

::: example What a "small" correction actually demands
Suppose closed-loop guidance, mid-max-Q, wants to null a trajectory error using a lateral acceleration of $1.0\ \mathrm{m/s^2}$ — a modest ask; the vehicle's axial thrust acceleration at this point is over ten times that. The required angle of attack is

$$
\alpha = \frac{a_{\text{lat}}\, m}{N_\alpha} = \frac{1.0 \times 375{,}125}{1.877 \times 10^6} = 0.1999\ \mathrm{rad} = 11.45^\circ,
$$

giving a load indicator of $\bar q\alpha = 44.6 \times 11.45 = 510.7\ \mathrm{kPa\cdot deg}$ — five times a typical certified envelope, from a correction that would look unremarkable at any other point in the flight. Push the demand to $3.0\ \mathrm{m/s^2}$ and $\bar q\alpha$ reaches 1532 kPa·deg; at $5.0\ \mathrm{m/s^2}$, 2554 kPa·deg. There is no lateral acceleration a closed-loop law could reasonably want that stays inside the structural envelope at this dynamic pressure.
:::

Now invert the question. Rather than asking what a wanted correction would cost, ask what correction the load budget can actually afford — and whether it is enough to call "guidance."

::: example The authority the structure allows is not enough to matter
Allow the *entire* certified envelope, 100 kPa·deg, to angle of attack at max-Q: $\alpha_{\max} = 100/44.6 = 2.242^\circ = 0.03913\ \mathrm{rad}$. The resulting normal force is $N = N_\alpha\alpha_{\max} = 1.877 \times 10^6 \times 0.03913 = 73.4\ \mathrm{kN}$, and the lateral acceleration it buys is

$$
a_{\text{lat}} = \frac{N}{m} = \frac{73{,}400}{375{,}125} = 0.1958\ \mathrm{m/s^2}.
$$

That is the absolute maximum correction authority available without exceeding the structural limit — and it is small. Correcting a 3 m/s lateral velocity error at that rate takes $3.0/0.1958 = 15.3$ s; a 10 m/s error takes 51.1 s; a 30 m/s error takes over two and a half minutes. Max-Q is not a two-and-a-half-minute event. Even spending the *entire* structural budget on correction, a closed-loop law would be too weak to usefully fix a realistic dispersion within the time available, while an open-loop program flying at (nominally) zero angle of attack spends none of that budget at all and leaves the error to be fixed later, cheaply, once the vehicle is out of the atmosphere and lateral acceleration is no longer rationed by a bending-load limit.
:::

::: key
At max dynamic pressure, the structural envelope permits so little angle of attack that even spending the entire budget on trajectory correction yields a lateral acceleration far too small to close a guidance loop usefully within the time available — while any correction large enough to matter overruns the envelope several times over. Closed-loop guidance is not merely unnecessary here; it is close to physically incapable of helping without breaking the vehicle first.
:::

## What runs instead

The atmospheric flight module develops the actual control-law answer in full: **load relief**, an autopilot mode that deliberately lets the vehicle weathervane partway into the wind rather than holding the reference attitude exactly, trading a bounded amount of trajectory drift for a large reduction in $\bar q\alpha$. It is switched on only through the high dynamic-pressure window and works from measured lateral acceleration or an estimated angle of attack, not from a guidance target — its job is to keep the airframe inside its load envelope, not to steer toward an orbit. Whatever position and velocity error load relief leaves behind at the end of that window becomes exoatmospheric guidance's problem, and this module returns to exactly how much that costs, and how the two systems hand off to each other, once the closed loop itself has been built.

There is a second, complementary answer, standing alongside load relief rather than replacing it: since the pitch program is computed offline before flight, it can be computed *for the actual wind* rather than for a generic design case, on launch day itself. This module returns to that day-of-launch update in a later lesson; for now, the point is that "open loop" does not mean "blind to the weather" — it means the correction for the weather is folded into the stored program in advance, rather than reacted to in flight by a guidance law watching the trajectory.

::: warning
Do not conclude that nothing is being controlled through max-Q. The attitude control loop is very much active — it is what makes the pitch program's commanded attitude actually happen against aerodynamic torques, engine misalignment and structural flexibility — and load relief is an active feedback law in its own right. What is absent is *guidance* feedback: nothing is comparing the vehicle's trajectory to the target orbit and adjusting the commanded attitude to close that gap. The distinction is between controlling attitude and guiding position, and only the second is switched off.
:::

## Check yourself

::: check
A guidance engineer argues that closed-loop trajectory correction should be enabled throughout ascent because "more feedback is always safer." Using the numbers in this lesson, explain what is wrong with that argument specifically at max-Q.
:::

::: answer
Feedback is not free here: any commanded angle of attack, whatever produces it, adds directly to the load indicator $\bar q\alpha$ at the moment $\bar q$ is largest. The worked example shows that even a modest desired correction (1 m/s² of lateral acceleration) demands over 11° of angle of attack and a load indicator roughly five times a typical certified envelope — meaning "more feedback" at this point in flight trades a trajectory problem for a structural failure, not a safer flight. Feedback is safe when the actuation it commands stays inside the vehicle's physical limits; at max-Q, useful guidance feedback does not.
:::

::: check
Using $N_\alpha = \bar q S C_{N\alpha}$ and a certified envelope of 80 kPa·deg (somewhat tighter than the 100 kPa·deg used in the lesson), recompute the maximum lateral acceleration available at max-Q ($\bar q = 44.6$ kPa, $m = 375{,}125$ kg, $C_{N\alpha} = 4.0\ \mathrm{rad^{-1}}$, $S = 10.52\ \mathrm{m^2}$) without exceeding the envelope.
:::

::: answer
The allowed angle of attack is $\alpha_{\max} = 80/44.6 = 1.794^\circ = 0.03131\ \mathrm{rad}$. $N_\alpha$ is unchanged at 1.877 MN/rad, so $N = 1.877\times10^6 \times 0.03131 = 58{,}770\ \mathrm{N}$, giving $a_{\text{lat}} = 58{,}770/375{,}125 = 0.1567\ \mathrm{m/s^2}$ — even less authority than the 100 kPa·deg case, reinforcing that a tighter structural margin only sharpens the argument against closing the loop here.
:::

::: check
Explain the difference between the attitude control loop and the guidance loop during the atmospheric phase, and why one is closed while the other is open.
:::

::: answer
The attitude control loop compares the vehicle's actual attitude to whatever attitude is currently *commanded* and drives gimbal deflections to null that error; it runs continuously and is very much closed, because without it the vehicle could not hold the pitch program's commanded attitude against wind and disturbance torques at all. The guidance loop would compare the vehicle's actual position and velocity to the *target orbit* and change what attitude is commanded to close that gap. It is this second loop that stays open through the atmosphere, because closing it means commanding whatever angle of attack a trajectory correction requires, and this lesson's numbers show that cost is unaffordable at high dynamic pressure.
:::

::: check
A colleague proposes closing the guidance loop only very weakly at max-Q — using a tiny feedback gain, so any commanded correction is small. Does this solve the problem? Use the "correction time" argument to support your answer.
:::

::: answer
A weak gain avoids overrunning the structural envelope, but the lesson's second worked example shows the cost of doing so: even spending the *entire* allowed load budget yields only about 0.2 m/s² of lateral acceleration, correcting a realistic error over many tens of seconds to minutes. A gain weak enough to stay safely inside the envelope is weaker still, and max-Q is a short event. A weak closed loop here is not a smaller version of useful guidance; it is functionally no guidance at all, with the small extra risk of a control law doing something unpredictable near the load limit for no real benefit. The dispersion is better left uncorrected until dynamic pressure has decayed.
:::

::: check
Why is a day-of-launch update to the pitch program not a form of closed-loop guidance, even though it changes the stored attitude command based on real data?
:::

::: answer
Closed-loop guidance reacts to the vehicle's own, in-flight state — it changes the commanded attitude *during* the flight in response to where the vehicle actually is relative to the target. A day-of-launch update changes the stored program *before liftoff*, using measured wind data, and the resulting attitude-versus-time history is then flown exactly as any other open-loop pitch program would be: fixed once the vehicle leaves the pad, with no further reaction to the vehicle's actual trajectory. It makes the open-loop program more accurate for the day's actual atmosphere; it does not make the program closed loop.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Pitch program | stored attitude command vs. time (or velocity), flown without trajectory feedback |
| $\bar q\alpha$ | load indicator; any commanded angle of attack adds to it, regardless of source |
| $N_\alpha = \bar q S C_{N\alpha}$ | normal-force slope; 1.877 MN/rad at max-Q for the worked vehicle ($C_{N\alpha}=4.0\,\mathrm{rad^{-1}}$) |
| A modest correction's cost | 1 m/s² of lateral accel needs $11.45^\circ$ of AoA $\Rightarrow$ 510.7 kPa·deg, several times a typical envelope |
| The structure's own limit | spending the *whole* 100 kPa·deg budget buys only $\approx 0.196\ \mathrm{m/s^2}$ — too weak to correct a realistic error inside the max-Q window |
| Attitude control vs. guidance | attitude loop (closed) holds the commanded attitude; guidance loop (open here) would change the command toward the target orbit |
| What runs instead | load relief (a structural-protection control law) plus a day-of-launch–updated, still open-loop pitch program |

Guidance does close eventually — the next lesson derives the steering law it uses once it does, starting from the optimal-control machinery the calculus-of-variations and Pontryagin-minimum-principle work already gave you.
