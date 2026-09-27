---
id: l02-open-loop-atmospheric-steering
title: Open-loop steering and why the loop stays open in the atmosphere
minutes: 18
covers:
  - Open-loop atmospheric steering (the pitch program) and why closed-loop guidance is avoided in dense atmosphere
---

A toaster and a thermostat both control heat, in two very different ways. The toaster runs for the time you set, then pops. It never checks whether the bread is actually brown. A thermostat keeps measuring the room and switches the heater on or off to hold the temperature you asked for. The toaster is **open loop**: it follows a plan and never looks at the result. The thermostat is **[[closed loop|open-closed-loop]]**: it measures, compares with the goal, and corrects.

A guidance engineer's instinct is to close every loop: measure where the rocket is, compare with where it should be, steer to fix the difference. Yet through the thickest part of the atmosphere, every orbital rocket flies open loop, like the toaster. The gravity turn from the last lesson steers itself, but it is not aiming at anything. Nothing in it asks whether the rocket is on track for the intended orbit.

That is on purpose. This lesson shows why — not "closed-loop guidance is hard here", which is true everywhere, but why closing the loop here would be actively dangerous. The argument uses the load measure from the atmospheric flight module and a few honest numbers.

## What the pitch program is

The **pitch program** is a stored list of attitude commands — which way to point the nose — as a function of time since liftoff (or, on some vehicles, of measured speed). **[[Attitude|attitude]]** here just means the rocket's orientation. The list is computed once, before flight, and flown without change, whatever the rocket's actual path turns out to be.

It has no error signal. If the rocket is a little off the path the program was built for, the program does not know and does not care. At second 90 it commands the same attitude whether the rocket is exactly on plan or a kilometre off to one side.

Outside the atmosphere that would be a weakness. Inside it, it is the point. Most of the program's shape comes from the gravity turn: a fixed kick, then zero angle of attack. In practice the flight computer stores the attitude history of a reference trajectory that engineers optimized on the ground beforehand (this module returns to that offline optimization later). The rocket flies that stored history.

Something *is* still correcting, though. The **attitude control system** — the fast inner loop that swivels the engines — holds the rocket at the commanded attitude against gusts and other disturbing twists. What it does not do is change the command itself based on where the rocket is. That job belongs to **guidance**, and guidance is switched off.

::: key
The pitch program is a precomputed function of time (or velocity), flown open loop: no feedback from the vehicle's actual position or velocity changes what attitude is commanded next. The attitude control system still closes its own, much faster loop — holding the *commanded* attitude against disturbances — but guidance itself is not correcting toward the target orbit yet.
:::

## The hand out of the car window

Hold your flat hand out of a car window at highway speed. Keep it level and the air slides past. Tilt it up a few degrees and the air shoves it up hard. Tilt it more and the shove grows. Go faster and the same tilt shoves harder still.

A rocket's long, thin body behaves like that hand. When its nose is tilted away from the airflow by an angle of attack $\alpha$, the air pushes sideways on it. That sideways push is the **normal force** $N$ — "normal" meaning at right angles to the body. For small angles it grows in proportion to $\alpha$:

$$
N = N_\alpha\,\alpha, \qquad N_\alpha = \bar q\, S\, C_{N\alpha}.
$$

Read $N_\alpha$ as "N sub alpha": the **normal-force slope**, newtons of side force per radian of tilt. It is built from three pieces:

- $\bar q$ ("q bar") — the dynamic pressure, $\tfrac12\rho v^2$, how hard the air is hitting;
- $S$ — the **reference area**, the rocket's cross-section: $10.52\ \mathrm{m^2}$ for a 3.66 m body;
- $C_{N\alpha}$ ("C N alpha") — a **[[shape number|normal-force-slope]]** from wind-tunnel tests, telling how strongly this particular shape turns tilt into side force.

A sideways push along a long tube bends it, like pressing on the middle of a ruler held at both ends. That bending is the **[[bending moment|bending-moment]]**. The atmospheric flight module showed that it scales with $\bar q$ times $\alpha$, so engineers track the product

$$
\bar q\alpha \quad \text{(the load indicator, in kPa·deg)}.
$$

Read it "q-alpha". A launch vehicle is certified to a fixed **[[envelope|load-envelope]]** of it — a largest allowed value, typically of order 100 kPa·deg for a large vehicle. Its units are kilopascals times degrees, which look odd but just mean "this much air pressure, at this much tilt".

Here is the key point. The structure does not care *why* the angle of attack is nonzero. A gust, a control error, and a deliberate steering command from guidance all load the airframe exactly the same way. Closed-loop guidance, by design, commands whatever attitude brings the rocket back on target. It never checks the structural envelope first. Run it at max-Q and it would pick the worst moment of the whole flight to spend the rocket's load budget.

## Putting numbers on it

Use the max-Q point of last lesson's worked ascent: $\bar q = 44.6$ kPa, rocket mass 375 t (more exactly $375{,}125$ kg). Take $C_{N\alpha} = 4.0\ \mathrm{rad^{-1}}$ — a typical size for a slender launcher (a real vehicle's value comes from its own aerodynamic data). Then

$$
N_\alpha = \bar q\, S\, C_{N\alpha} = 44{,}610 \times 10.52 \times 4.0 = 1.877 \times 10^6\ \mathrm{N/rad} = 1.877\ \mathrm{MN/rad}.
$$

So every radian of tilt (about $57.3^\circ$) would give almost two meganewtons of side force. Every degree gives about 33 kN.

::: example What a "small" correction actually demands
Suppose closed-loop guidance, in the middle of max-Q, wants to fix a path error by pushing the rocket sideways at $a_{\text{lat}} = 1.0\ \mathrm{m/s^2}$. That is a modest ask. The engines are pushing the rocket forward at about $8.0\ \mathrm{MN} / 375\ \mathrm{t} \approx 21\ \mathrm{m/s^2}$ at this point, over ten times more.

**Force needed.** Newton's second law: side force = mass × sideways acceleration, $N = m\,a_{\text{lat}}$.

**Angle needed.** Since $N = N_\alpha\alpha$, divide by $N_\alpha$:

$$
\alpha = \frac{a_{\text{lat}}\, m}{N_\alpha} = \frac{1.0 \times 375{,}125}{1.877 \times 10^6} = 0.1999\ \mathrm{rad} = 11.45^\circ .
$$

**Load.** Multiply by $\bar q$: $\bar q\alpha = 44.6 \times 11.45 = 510.7\ \mathrm{kPa\cdot deg}$.

That is about five times a typical 100 kPa·deg envelope — from a correction that would be unremarkable at any other time of the flight. Ask for $3.0\ \mathrm{m/s^2}$ and $\bar q\alpha$ reaches 1532 kPa·deg; ask for $5.0\ \mathrm{m/s^2}$ and it reaches 2554 kPa·deg. (Those last two need tilts of about $34^\circ$ and $57^\circ$, far past where the straight-line force model even holds. The point only gets stronger.)

**Sanity check.** Doubling the requested acceleration doubles $\alpha$ and doubles $\bar q\alpha$, as a straight-line model should: $3 \times 510.7 \approx 1532$. No sideways push a guidance law could reasonably want stays inside the envelope at this dynamic pressure.
:::

Now turn the question around. Instead of asking what a wanted correction costs, ask what correction the load budget can afford — and whether that is enough to be worth calling guidance.

::: example The authority the structure allows is not enough to matter
Let guidance spend the *entire* 100 kPa·deg envelope on angle of attack at max-Q.

**Largest angle.** $\alpha_{\max} = 100 / 44.6 = 2.242^\circ$. In radians, multiply by $\pi/180$: $0.03913\ \mathrm{rad}$.

**Largest side force.** $N = N_\alpha\,\alpha_{\max} = 1.877 \times 10^6 \times 0.03913 = 73.4\ \mathrm{kN}$.

**Largest sideways acceleration.**

$$
a_{\text{lat}} = \frac{N}{m} = \frac{73{,}400}{375{,}125} = 0.1958\ \mathrm{m/s^2}.
$$

That is the most correcting push available without breaking the structural limit, and it is small — about 2% of $g$.

**How long would fixes take?** Time = velocity error ÷ acceleration. A 3 m/s sideways error takes $3.0 / 0.1958 = 15.3$ s. A 10 m/s error takes 51.1 s. A 30 m/s error takes $153$ s — over two and a half minutes.

**Compare with max-Q.** The high-$\bar q$ window lasts about twenty seconds, not minutes. Even spending the whole structural budget, a closed-loop law is too weak to fix a realistic error in the time it has. An open-loop program at (nominally) zero angle of attack spends none of that budget. It leaves the error to be fixed later, cheaply, above the air, where sideways pushes are no longer rationed.
:::

::: key
At max dynamic pressure, the structural envelope permits so little angle of attack that even spending the entire budget on trajectory correction yields a lateral acceleration far too small to close a guidance loop usefully within the time available — while any correction large enough to matter overruns the envelope several times over. Closed-loop guidance is not merely unnecessary here; it is close to physically incapable of helping without breaking the vehicle first.
:::

::: key Why guidance is open loop through max-Q
Bending load is driven by $\bar q\alpha$ (q times alpha). Closed-loop trajectory correction commands angle of attack exactly when $\bar q$ peaks. So: open-loop pitch program plus load relief, with explicit guidance enabled after $\bar q$ decays.
:::

::: note Why it has to be true
The two examples are one fact seen from two sides. Combine $N = m\,a_{\text{lat}}$ with $N = \bar q S C_{N\alpha}\alpha$:

$$
a_{\text{lat}} = \frac{S\, C_{N\alpha}}{m}\,(\bar q\alpha).
$$

The sideways acceleration guidance can buy is set *only* by the load indicator it is willing to spend, times a vehicle constant $S C_{N\alpha}/m$. For our rocket that constant is $10.52 \times 4.0 / 375{,}125 = 1.12 \times 10^{-4}\ \mathrm{m^2/kg}$, with $\bar q$ in pascals and $\alpha$ in radians. Check: $1.12 \times 10^{-4} \times 44{,}600 \times 0.03913 \approx 0.196\ \mathrm{m/s^2}$, the second example's answer. Capping $\bar q\alpha$ caps $a_{\text{lat}}$, whatever the guidance law is. No clever algorithm gets around it.
:::

## What runs instead

Two things fill the gap.

**Load relief.** The atmospheric flight module develops it in full, and lesson 9 of this module returns to it. **Load relief** is an autopilot mode that deliberately lets the rocket **[[weathervane|weathervane]]** partway into the wind, instead of holding the planned attitude exactly. It trades a small, bounded drift off the planned path for a big cut in $\bar q\alpha$. It works from measured sideways acceleration or an estimate of the angle of attack — not from any target orbit. Its job is to keep the airframe inside its envelope, not to steer toward orbit. It is switched on only through the high-$\bar q$ window. Whatever position and velocity error it leaves behind becomes the problem of exoatmospheric guidance, later.

**A pitch program built for today's wind.** Because the program is computed on the ground, it can be computed for the *actual* wind on launch day, not a generic worst case. Weather balloons measure the winds aloft in the hours before launch, and the program is re-optimized and loaded. This is the **[[day-of-launch update|i-load]]**, the subject of lesson 11. So "open loop" does not mean "blind to the weather". It means the weather correction is baked into the stored program in advance, instead of reacted to in flight.

::: warning
Do not conclude that nothing is being controlled through max-Q. The attitude control loop is fully active — it is what makes the commanded attitude actually happen against aerodynamic twisting, engine misalignment and the flexing of the structure. Load relief is an active feedback law too. What is switched off is *guidance* feedback: nothing compares the rocket's path with the target orbit and changes the command to close the gap. The difference is between controlling attitude and guiding position, and only the second is off.
:::

## Check yourself

::: check
A guidance engineer argues that closed-loop trajectory correction should run through the whole ascent, because "more feedback is always safer". Using the numbers in this lesson, explain what is wrong with that argument at max-Q.
:::

::: answer
Feedback is not free here. Any commanded angle of attack, whatever the reason for it, adds directly to $\bar q\alpha$ at the moment $\bar q$ is largest. The first example shows that even a modest correction — 1 m/s² of sideways acceleration — needs over $11^\circ$ of angle of attack and a load indicator about five times a typical certified envelope. So "more feedback" at this moment swaps a path problem for a structural failure. Feedback is safe when the actions it commands stay inside the vehicle's physical limits; at max-Q, useful guidance feedback does not.
:::

::: check
With $N_\alpha = \bar q S C_{N\alpha}$ and a tighter certified envelope of 80 kPa·deg, recompute the largest sideways acceleration available at max-Q ($\bar q = 44.6$ kPa, $m = 375{,}125$ kg, $C_{N\alpha} = 4.0\ \mathrm{rad^{-1}}$, $S = 10.52\ \mathrm{m^2}$) without leaving the envelope.
:::

::: answer
**Allowed angle:** $\alpha_{\max} = 80 / 44.6 = 1.794^\circ$, which is $1.794 \times \pi/180 = 0.03131\ \mathrm{rad}$.

**Slope:** $N_\alpha$ is unchanged at $1.877\ \mathrm{MN/rad}$.

**Side force:** $N = 1.877 \times 10^6 \times 0.03131 = 58{,}770\ \mathrm{N}$.

**Acceleration:** $a_{\text{lat}} = 58{,}770 / 375{,}125 = 0.1567\ \mathrm{m/s^2}$.

That is even less than the $0.196\ \mathrm{m/s^2}$ of the 100 kPa·deg case — exactly $80/100$ of it, as the straight-line model says. A tighter structural margin only sharpens the case against closing the loop here.
:::

::: check
Explain the difference between the attitude control loop and the guidance loop during atmospheric flight, and why one is closed while the other is open.
:::

::: answer
The **attitude control loop** compares the rocket's actual attitude with whatever attitude is currently *commanded*, and swivels the engines to remove the difference. It runs all the time and is closed, because without it the rocket could not hold the pitch program's attitude against wind and disturbing twists at all.

The **guidance loop** would compare the rocket's actual position and velocity with the *target orbit*, and change the commanded attitude to close that gap. This is the loop left open in the atmosphere, because closing it means commanding whatever angle of attack a correction needs — and this lesson's numbers show that cost is unaffordable at high dynamic pressure.
:::

::: check
A colleague suggests closing the guidance loop only very weakly at max-Q, with a tiny feedback gain so every commanded correction is small. Does that solve the problem? Use the correction-time argument.
:::

::: answer
A weak gain avoids breaking the structural envelope, but look at what it buys. Even spending the *entire* allowed load budget gives only about $0.2\ \mathrm{m/s^2}$ of sideways acceleration, so fixing a realistic error takes tens of seconds to minutes. A gain weak enough to stay safely inside the envelope is weaker still, and max-Q lasts about twenty seconds. So a weak closed loop here is not a smaller version of useful guidance; it is effectively no guidance at all — plus the small extra risk of a control law acting near the load limit for no real benefit. Better to leave the error alone until dynamic pressure has decayed.
:::

::: check
A day-of-launch update changes the stored pitch program using real measured data. Why is it still not closed-loop guidance?
:::

::: answer
Closed-loop guidance reacts to the rocket's own state *during* flight: it changes the command in response to where the rocket actually is compared with the target. A day-of-launch update changes the stored program *before liftoff*, using measured winds. The new program is then flown exactly like any other open-loop program — fixed once the rocket leaves the pad, with no reaction to its actual path. It makes the open-loop program better suited to the day's real atmosphere; it does not close the loop.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Open loop / closed loop | follows a stored plan / measures, compares with a goal, corrects |
| Pitch program | stored attitude command vs. time (or velocity), flown without trajectory feedback |
| $\bar q\alpha$ | load indicator; any commanded angle of attack adds to it, whatever its source |
| $N_\alpha = \bar q S C_{N\alpha}$ | normal-force slope; 1.877 MN/rad at max-Q for the worked vehicle ($C_{N\alpha}=4.0\,\mathrm{rad^{-1}}$) |
| A modest correction's cost | 1 m/s² of sideways acceleration needs $11.45^\circ$ of AoA, so 510.7 kPa·deg, several times a typical envelope |
| The structure's own limit | spending the *whole* 100 kPa·deg budget buys only $\approx 0.196\ \mathrm{m/s^2}$ — too weak to fix a realistic error inside the max-Q window |
| Attitude control vs. guidance | attitude loop (closed) holds the commanded attitude; guidance loop (open here) would change the command toward the target orbit |
| What runs instead | load relief (a structure-protecting control law) plus a day-of-launch–updated, still open-loop pitch program |

Guidance does close eventually. The next lesson derives the steering law it uses once it does, starting from the optimal-control tools — the calculus of variations and Pontryagin's minimum principle — you already have.

::: context open-closed-loop Feedback in one picture
A closed loop feeds its own result back to the start. The thermostat measures the room, compares it with the setting, and the difference drives the heater. An open loop has no return path.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <text x="10" y="42" font-size="12" fill="#1f2a44">goal</text>
  <line x1="40" y1="38" x2="72" y2="38" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="82" cy="38" r="10" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="82" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">−</text>
  <line x1="92" y1="38" x2="130" y2="38" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="130" y="22" width="90" height="32" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="175" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">controller</text>
  <line x1="220" y1="38" x2="250" y2="38" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="250" y="22" width="80" height="32" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="290" y="42" font-size="12" text-anchor="middle" fill="#1f2a44">vehicle</text>
  <polyline points="330,38 345,38 345,100 82,100 82,48" fill="none" stroke="#b4232c" stroke-width="2"/>
  <polygon points="82,48 77,58 87,58" fill="#b4232c"/>
  <text x="213" y="118" font-size="12" text-anchor="middle" fill="#b4232c">measurement fed back: the loop</text>
  <text x="180" y="142" font-size="11" text-anchor="middle" fill="#6c7a93">remove the red path and it is open loop</text>
</svg>
```
:::

::: context attitude Which way it points
In aerospace, "attitude" has nothing to do with mood. It is the vehicle's orientation in space: which way the nose points (pitch and yaw) and how it is rolled about its long axis. Position says *where* the rocket is; attitude says *which way it faces*. A rocket can be in exactly the right place with the wrong attitude, and the attitude control system's whole job is to keep the actual attitude equal to the commanded one.
:::

::: context normal-force-slope How strongly a shape turns tilt into push
$C_{N\alpha}$ is a pure number per radian, measured in wind tunnels and computed with flow simulations for each vehicle, and it changes with Mach number. Multiply it by $\bar q S$ and you get newtons of side force per radian of tilt. For small tilts the side force rises in a straight line with $\alpha$ — which is why a single slope is enough.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="130" x2="330" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="40" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="130" x2="300" y2="26" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="170" y1="130" x2="170" y2="78" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <line x1="40" y1="78" x2="170" y2="78" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="185" y="148" font-size="12" text-anchor="middle" fill="#1f2a44">angle of attack α</text>
  <text x="46" y="14" font-size="12" fill="#1f2a44">side force N</text>
  <text x="235" y="80" font-size="12" fill="#1d6fd1">slope = q̄ S C_Nα</text>
</svg>
```

Double the tilt, double the push; double $\bar q$, double the slope.
:::

::: context bending-moment A ruler pressed in the middle
Hold a ruler by its ends and press the middle: it bows. The farther the push sits from where the ruler is held, and the harder it is, the more it bends. That turning effect is the bending moment. A launch vehicle is a very long, very thin tube of mostly liquid, held up at the bottom by the engines. Side force from the air acts along its front section, and the bending moment near the middle can buckle thin tank walls.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <path d="M 30 60 Q 180 90 330 60" fill="none" stroke="#1d6fd1" stroke-width="8"/>
  <polygon points="30,60 20,80 40,80" fill="#6c7a93"/>
  <polygon points="330,60 320,80 340,80" fill="#6c7a93"/>
  <line x1="180" y1="18" x2="180" y2="62" stroke="#b4232c" stroke-width="2.5"/>
  <polygon points="180,70 174,58 186,58" fill="#b4232c"/>
  <text x="190" y="28" font-size="12" fill="#b4232c">push</text>
  <text x="180" y="110" font-size="12" text-anchor="middle" fill="#1f2a44">held at the ends, bent in the middle</text>
</svg>
```
:::

::: context load-envelope The limit the structure is built to
Structural engineers design the rocket to survive loads up to a set limit, with a safety margin, and then test and certify it to that limit. The launch team must never fly past it. Expressing the limit as a maximum $\bar q\alpha$ lets the trajectory team check it with two numbers they already track. Real limits come from each vehicle's own structural analysis; "of order 100 kPa·deg" is a typical size for a large launcher.
:::

::: context weathervane Nose into the wind
A weathervane on a roof has a big tail, so the wind swings it until its arrow points into the wind, where the push on it is smallest. Load relief lets a rocket do a little of the same: when a gust hits from the side, the autopilot yields and turns the nose partway toward the new airflow. That shrinks $\alpha$, and with it $\bar q\alpha$. The price is that the rocket drifts a little off its planned path, which guidance fixes later above the air.
:::

::: context i-load The word "I-load"
On the Space Shuttle, mission-specific numbers stored in the flight software were called initialization loads, or I-loads. The pitch program's values were among them. A day-of-launch I-load update means recomputing those values from that day's measured winds — from weather balloons released in the hours before launch — checking them against the load limits, and loading them into the rocket before liftoff. Lesson 11 of this module works through it.
:::
