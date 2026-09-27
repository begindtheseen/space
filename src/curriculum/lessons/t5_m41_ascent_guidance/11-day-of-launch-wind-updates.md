---
id: l11-day-of-launch-wind-updates
title: Day-of-launch trajectory updates from measured winds
minutes: 20
covers:
  - Day-of-launch trajectory updates from measured winds
---

Watch a football kicker line up a field goal on a windy day. Before the snap, the kicker glances at the flags on top of the goalposts. If the wind is blowing left to right, the kicker aims a little to the left, so the wind carries the ball back to the middle. The kick is the same kick practiced all week. Only the aim changes, and it changes because of the wind that is actually blowing *today*, not the wind from practice.

A rocket does the same thing. The previous lesson showed that the pitch program comes from an offline optimization, done on the ground. That optimization does not run only once, months before the first flight. It runs one last time, in the hours before *this* launch, fed the wind that is actually blowing that day instead of a made-up "design" wind. This is the **day-of-launch update**: re-optimizing the pitch program before liftoff with measured winds. On the Space Shuttle it was called the **[[day-of-launch I-load update|dolilu]]**, because it changed the I-loads, the stored constants in the flight software.

This lesson covers what gets measured, what the update changes, and how much it is worth — in the same currency this module has used for everything else: propellant, structural margin, and the kilograms of payload they turn into.

## What gets measured

The number the update needs is the **wind profile**: the wind's speed and direction at every height, from the ground up through the thick air the rocket crosses near max-Q.

Two tools measure it.

- **[[Weather balloons|weather-balloons]].** A balloon is released from near the launch site and tracked as it rises, so its sideways drift at each height gives the wind at that height.
- **[[Wind lidar|wind-lidar]].** A laser shines up into the sky. Tiny specks of dust and water send some of the light back, and a small shift in its color tells how fast the air is moving along the beam.

Wind high up is not gentle or even. Near the **tropopause** — the top of the weather layer, around 10 to 16 km up — there is often a **[[jet stream|jet-stream]]**, a river of fast air blowing tens of meters per second. It can be packed into a **wind shear** layer, a band only a few kilometers thick where the wind changes quickly with height. That is right where this module's lessons put max-Q and the peak of the load indicator: our rocket hits max-Q at 11.0 km.

That measured profile — not a statistical design wind, and not the profile used when the structure was first sized — is what feeds the day's run of the offline optimization.

## What the update changes

Go back to the kicker. The kicker does not change the kick. The kicker changes the aim.

The optimizer re-solves for a new pitch program that points the rocket's nose a little into the *measured* wind. That is **[[wind biasing|wind-bias]]**: shaping the planned attitude so that, with today's wind, the air meets the rocket nearly head-on. The goal is that the *average* angle of attack through the high-dynamic-pressure window is close to zero for the wind that will really be blowing, not for some other day's wind.

Several stored numbers can shift as a result:

- the pitch program itself — the kick angle and the shape of the gravity turn after it — plus the small sideways (yaw) steering that faces a crosswind;
- the load-relief gains, and any other **gain schedule** (a table saying how strongly the autopilot reacts at each point in the flight) that depends on the expected disturbance;
- the constraint tables that say which loads are allowed where.

The onboard guidance algorithm itself does not change at all. The code is the same code. Only the numbers it is handed change, exactly as the previous lesson said.

::: key
Day-of-launch I-load update: re-optimise the pitch program on launch day against the measured wind profile, so loads are sized for the actual atmosphere and not a worst-case envelope. Buys payload and launch availability.
:::

::: key
Day-of-launch update: the offline pitch-program optimization is re-run in the hours before launch using the actual measured wind profile, biasing the vehicle to fly nose-into that wind so mean angle of attack — and hence the load indicator — stays small for the wind that is actually present, not a statistical worst case.
:::

There is a catch. A new pitch program is new flight data, loaded only hours before launch. Before it can fly, the updated trajectory must be run through the loads checks — every load compared against its limit — automatically and quickly, inside the **[[countdown timeline|countdown-checks]]**. If it fails, or the checks cannot finish in time, the launch waits. So the update is also a real verification job, not just a calculation.

## What an unbiased wind actually costs

Lesson 2 showed how little angle of attack a launcher can take at max dynamic pressure. Put a realistic jet-stream crosswind through that arithmetic and the stakes get concrete.

First, how does a wind make angle of attack? Stick your hand out of a moving car's window. With no wind, the air comes straight at your palm from the front. Now suppose a breeze also blows across the road. The air you feel comes partly from the front, partly from the side: slanted. The rocket feels the same slant. The **angle of attack** $\alpha$ ("alpha") is the angle between where the nose points and where the air is coming from.

Say the rocket moves through still air at speed $V$ along its nose, and a **[[crosswind|wind-triangle]]** — wind blowing sideways across the flight path — of speed $W$ is added. The air now comes at the rocket from a slanted direction, tilted from the nose by

$$
\alpha = \arctan\!\left(\frac{W}{V}\right).
$$

Read $\arctan$ as "arc tangent": the angle whose tangent is $W/V$. For small angles, $\alpha \approx W/V$ in radians — read "W over V". Multiply by $180/\pi \approx 57.3$ to get degrees.

::: note Why it has to be true
The air rushing past the rocket is the rocket's own velocity seen from the air, which is the ground velocity minus the wind velocity. Draw the rocket's air-relative velocity with no wind as an arrow of length $V$ along the nose. A crosswind adds an arrow of length $W$ at a right angle to it. Those two arrows are the two short sides of a right triangle, and the new air-relative velocity is the long side. The angle between the long side and the nose is the angle whose opposite side is $W$ and whose adjacent side is $V$, so $\tan\alpha = W/V$. For small angles $\tan\alpha \approx \alpha$ (in radians), which gives $\alpha \approx W/V$.
:::

The speed $V$ that matters here is the speed **relative to the air**, because it is the air that pushes on the rocket. At our max-Q point lesson 1 found an air-relative speed of 495 m/s.

::: warning Use the air-relative speed, not the inertial speed
At max-Q our rocket's speed in the non-spinning inertial frame is about 880 m/s, because that frame adds the 465 m/s eastward spin of the launch pad. The air spins along with the Earth, so that extra speed does nothing to the angle of attack. Using 880 m/s instead of 495 m/s would make a crosswind look about $880/495 \approx 1.8$ times less dangerous than it is.
:::

::: example A crosswind, biased and unbiased
At this module's max-Q point, $\bar q = 44.6\ \mathrm{kPa}$ and the air-relative speed is $V = 495\ \mathrm{m/s}$. Suppose a 45 m/s crosswind is present, a realistic jet-stream value near the tropopause.

**Step 1: the angle, unbiased.** Fly the pitch program with no wind bias at all:

$$
\alpha = \arctan\!\left(\frac{45}{495}\right) = 5.19^\circ .
$$

**Step 2: the load.** Multiply by $\bar q$: $\bar q\alpha = 44.6 \times 5.194 = 231.7\ \mathrm{kPa\cdot deg}$.

**Step 3: compare with the limit.** A typical certified envelope is 100 kPa·deg. This one ordinary wind, left uncorrected, uses more than twice the whole budget — before gusts or any other error are added. It is a structural failure by itself.

**Step 4: bias the pitch program.** Now aim into the *measured* wind. Only the error in the measurement or forecast is left as crosswind. Suppose the bias is poor, and 30% of the wind is left uncorrected (a cautious allowance for measurement and modeling error). The leftover crosswind is $0.30 \times 45 = 13.5$ m/s, so

$$
\alpha = \arctan\!\left(\frac{13.5}{495}\right) = 1.56^\circ, \qquad \bar q\alpha = 44.6 \times 1.562 = 69.7\ \mathrm{kPa\cdot deg}.
$$

That is inside the envelope.

**Step 5: better biases.** Leaving 20% uncorrected gives 9.0 m/s, $\alpha = 1.04^\circ$, $\bar q\alpha = 46.5\ \mathrm{kPa\cdot deg}$. Leaving 10% gives 4.5 m/s, $\alpha = 0.52^\circ$, $\bar q\alpha = 23.2\ \mathrm{kPa\cdot deg}$.

**Sanity check.** The leftover wind and the load shrink together: 30%, 20% and 10% of the wind give $69.7$, $46.5$ and $23.2$ kPa·deg, which are 30%, 20% and 10% of 231.7 to within rounding. That matches $\alpha \approx W/V$: the load is proportional to the leftover wind. The update does not need to be perfect to matter enormously. Even a rough bias turns a structural failure into a modest, ordinary contributor.
:::

::: warning
Wind biasing corrects for the *mean* of the measured profile, not gusts or shear on top of it. The leftover angle of attack in the example is what remains after biasing for the measured wind itself. The load-relief control law of lesson 9 is what handles the turbulence and shear that a static wind-bias update cannot foresee. The two work together; one does not replace the other.
:::

## What the accuracy buys back

Imagine packing for a trip without knowing the weather. You pack a heavy coat, boots, an umbrella and sunscreen, just in case. Most days you carry things you never use. Now imagine you could check the forecast the morning you leave. You pack only what today needs, and the bag gets lighter.

A rocket whose pitch program had to be fixed long in advance is in the first situation. It must survive a **worst-case wind envelope** — a wind big enough to cover nearly every day it might ever launch. So on every ordinary, calmer day, it carries margin it does not need. The design had no way to know in advance which day would be calm and which would be windy.

The day-of-launch update is the forecast check. It turns the always-careful picture into a specific one. On a calmer-than-worst-case day, less of the load budget must be held back for wind, and the previous lesson's constrained optimization can spend the freed margin on performance.

::: example What margin a calm day actually recovers
**Step 1: recall the prize.** The previous lesson found the loss-minimizing kick angle near $2.70^\circ$, with a total loss $99.1$ m/s smaller than the $2.0^\circ$ this module flies. But at $2.70^\circ$ peak $\bar q$ is already 84.4 kPa.

**Step 2: what that leaves for wind.** With a 100 kPa·deg envelope, the angle of attack allowed at peak $\bar q$ is the envelope divided by $\bar q$:

- at $2.0^\circ$: $100 / 44.6 = 2.24^\circ$;
- at $2.70^\circ$: $100 / 84.4 = 1.18^\circ$ — about half.

**Step 3: turn the $2.0^\circ$ budget into wind.** At 495 m/s, $2.24^\circ$ of angle of attack is what an unbiased crosswind of $495 \times \tan 2.24^\circ = 19.4$ m/s would use up. A worst-case jet stream is far stronger than that, so a design that could not bias for the day's wind would have to keep the flatter, gentler trajectory and still hope.

**Step 4: what biasing changes.** With the pitch program biased to the measured wind, only the leftover error eats into the budget — a few tens of kPa·deg in the first example, not hundreds. On a calmer day even less is needed. That day's optimization can then move toward the $2.70^\circ$ side, recovering part of the $99.1$ m/s.

**Step 5: turn m/s into kilograms.** For stage 2, the rocket equation $\Delta v = v_e \ln(m_0/m_f)$ says what one more kilogram of payload costs. Adding $\delta$ kg to both the start mass $m_0 = 112{,}400$ kg and the burnout mass $m_f = 18{,}457$ kg changes $\Delta v$ by about

$$
v_e\left(\frac{1}{m_0} - \frac{1}{m_f}\right)\delta = 3412.7 \times \left(8.897 \times 10^{-6} - 5.418 \times 10^{-5}\right)\delta = -0.155\,\delta\ \mathrm{m/s}.
$$

So one m/s of loss saved is worth about $1/0.155 \approx 6.5$ kg of payload. Recovering even 20 m/s on a calm day is about 130 kg more payload.

**Sanity check.** 130 kg is about 1.4% of the 9 t payload — a real but modest gain, as you would expect from a correction to one phase of the flight. (This is a first estimate: it assumes speed saved in stage 1 carries straight into stage 2.)
:::

That recovered margin is what "turning a worst-case design problem into a day-specific one" means. It buys two things at once:

- **Payload** on an average day, as the example just priced.
- **[[Launch availability|launch-availability]]** on a windy day. A marginal wind day that a fixed, unbiased design would have to scrub can instead fly, biased, inside the same structural envelope.

## Check yourself

::: check
Compute the load indicator from a 30 m/s crosswind, unbiased, at this module's max-Q condition ($\bar q = 44.6\ \mathrm{kPa}$, air-relative speed $V = 495\ \mathrm{m/s}$). Would it alone break a 100 kPa·deg envelope?
:::

::: answer
$\alpha = \arctan(30/495) = 3.47^\circ$, so $\bar q\alpha = 44.6 \times 3.468 = 154.7\ \mathrm{kPa\cdot deg}$. Yes: this one moderate crosswind, left completely unbiased, already exceeds a 100 kPa·deg envelope by more than half, with nothing left for gusts, leftover bias error or control error. Even a 20 m/s crosswind gives $103.2$ kPa·deg, just over the limit. Only below about 19 m/s does an unbiased crosswind fit at all.
:::

::: check
Explain why the day-of-launch update changes the pitch program's numbers but not the onboard guidance algorithm's code.
:::

::: answer
The pitch program is a stored, open-loop table of attitude against time (or speed). The update re-runs the same offline optimization as the previous lesson with one new input — the measured wind profile — and produces new numbers for that same table. It does not touch the onboard guidance software, whether the open-loop atmospheric steering or the exoatmospheric explicit guidance this module built. Those algorithms take the pitch program (or, later, the target orbit) as an input, whatever produced it. Changing the input changes what is flown without changing what is running.
:::

::: check
Why does even an imperfect wind bias — one that leaves 30% of the true wind uncorrected — recover most of the benefit, instead of needing near-perfect wind knowledge to be worthwhile?
:::

::: answer
The load indicator depends on the *leftover* angle of attack after biasing, not on the raw wind. For small angles, crosswind and angle of attack are in simple proportion, $\alpha \approx W/V$. So cutting the effective wind by 70% cuts the angle of attack, and the load indicator, by the same 70%. In the example the unbiased 45 m/s wind gives 231.7 kPa·deg, about 2.3 times the envelope. Keeping 30% of it gives 69.7 kPa·deg, back under the limit with room to spare. A good-but-imperfect measurement is therefore well worth having; it does not need to be perfect.
:::

::: check
A mission is scrubbed on a day when the measured upper-level winds are too strong for any pitch-program bias to bring inside the structural envelope. Is this a failure of the day-of-launch update process?
:::

::: answer
No — it is the process working as intended. The update's job is to make the vehicle's performance and structural margin match the actual wind on a given day. On most days that recovers margin a worst-case design would waste. On a day whose wind is so severe that no achievable bias keeps the load indicator inside the envelope, spotting that and scrubbing is the update doing its job. The alternative — flying anyway and hoping a bias too small to matter is enough — is exactly the outcome the whole procedure exists to prevent.
:::

::: check
In your own words, explain why the day-of-launch update is as much a payload question as a safety question.
:::

::: answer
The offline pitch-program optimization is limited by the structural load envelope, and the previous lesson showed that the propellant-cheapest kick angle sits well past where an unbiased, worst-case-wind design can safely fly. Replacing the worst-case wind with the actual, usually milder, measured wind frees part of the load budget the worst-case design had to hold back. That lets the day's pitch program move closer to the loss-minimizing angle and waste less speed for the same orbit. For this vehicle each m/s saved is worth about 6.5 kg of payload. So the update adds payload capability on an average day, not only safety margin on a severe one.
:::

## Summary

| Symbol or fact | Meaning / value |
| --- | --- |
| Day-of-launch update | offline pitch-program optimization re-run hours before launch, using measured (not design-case) wind |
| Wind profile | wind speed and direction at each height, from balloons or lidar |
| Wind biasing | points the nose into the measured wind so mean angle of attack stays near zero for that day's wind |
| $\alpha = \arctan(W/V) \approx W/V$ | angle of attack from a crosswind $W$ at air-relative speed $V$ |
| Unbiased 45 m/s crosswind at max-Q | $V = 495$ m/s: $\alpha = 5.19^\circ$, $\bar q\alpha = 231.7\ \mathrm{kPa\cdot deg}$ — over twice a 100 kPa·deg envelope |
| Biased, 30% / 20% / 10% left | $\bar q\alpha = 69.7$ / $46.5$ / $23.2\ \mathrm{kPa\cdot deg}$ — inside it |
| What bias does not cover | gusts and shear on top of the measured mean — load relief's job |
| Verification | updated loads are checked automatically against limits inside the countdown |
| What accuracy buys | frees load budget a worst-case design must hold back: about 6.5 kg of payload per m/s saved, and flights on days that would otherwise be scrubbed |
| Algorithm vs. parameters | onboard guidance code is unchanged; only the pitch-program numbers it flies are updated |

So far everything has assumed the flight goes essentially as planned, wind aside. The next lesson takes up the other half of what can go wrong: not a scatter guidance can quietly absorb, but a failure bad enough that the mission itself has to change, and the vocabulary and decision logic built to handle it.

::: context dolilu A Shuttle-era name
The Space Shuttle program called it DOLILU, for Day-Of-Launch I-Load Update. In the hours before a launch, wind measurements were fed into trajectory software on the ground, a new set of ascent steering constants came out, it was checked against the loads limits, and it was loaded into the orbiter's computers during the countdown.

Modern launchers do the same job under other names. The idea outlived the acronym: measure today's air, re-plan today's climb.
:::

::: context weather-balloons Chasing a balloon
A weather balloon carries a small instrument box, a **radiosonde**, that radios back its position (today by GPS), temperature and pressure. It drifts with the wind, so its sideways motion between one height and the next is the wind at that height.

It rises at roughly 5 m/s, so reaching 15 km takes about $15{,}000 / 5 = 3000$ s — some 50 minutes. That is one reason the measurements start hours before liftoff. At Kennedy Space Center the Shuttle team also used a special radar-tracked balloon with little cone-shaped bumps on its skin, the Jimsphere, whose bumps keep it from wobbling so it follows the wind more faithfully.
:::

::: context wind-lidar Seeing wind with light
"Lidar" is like radar but with laser light. A pulse goes up. Tiny particles in the air scatter a little of it back. If the air is moving toward or away from the instrument, the returning light's frequency is shifted slightly — the same **Doppler effect** that makes a passing siren drop in pitch. Measure the shift, and you know the wind speed along the beam. Point the beam in a few directions and you get the full wind at each height.

Lidar can measure again every few minutes, which a balloon cannot. That helps when the wind is changing close to launch time.
:::

::: context jet-stream A river of air at max-Q height
Jet streams are narrow bands of fast wind near the tropopause, driven by the temperature difference between warm tropical air and cold polar air. Over Florida in winter the subtropical jet often sits almost overhead. The sketch shows the typical shape: calm near the ground, a peak around 10 to 12 km, and weaker winds above. The peak lands close to the rocket's max-Q height, which is why this one feature matters so much.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="340" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="180" x2="50" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="230" y="196" font-size="12" fill="#1f2a44">wind speed →</text>
  <text x="8" y="22" font-size="12" fill="#1f2a44">height</text>
  <g font-size="11" fill="#6c7a93" text-anchor="end">
    <text x="45" y="184">0</text><text x="45" y="104">10 km</text><text x="45" y="24">20 km</text>
  </g>
  <path d="M 55 180 C 90 150, 150 120, 230 96 C 300 76, 170 50, 110 20" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="50" y1="92" x2="340" y2="92" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="250" y="86" font-size="12" fill="#b4232c">max-Q, 11 km</text>
  <text x="140" y="150" font-size="12" fill="#1d6fd1">sketch, not data</text>
</svg>
```
:::

::: context wind-bias Leaning into the wind
On the left, the rocket points straight along its planned path while a crosswind (red) blows from the side. The air it feels comes in slanted, so it flies at an angle of attack and the air bends it. On the right, the pitch and yaw program has been re-planned so the nose leans slightly into the measured wind. Now the air it feels comes straight down its nose again, and the side load mostly disappears. The lean is exaggerated here so you can see it; in reality it is a few degrees.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g transform="translate(90,95)">
    <rect x="-8" y="-40" width="16" height="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <polygon points="-8,-40 8,-40 0,-58" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  </g>
  <g transform="translate(260,95) rotate(-15)">
    <rect x="-8" y="-40" width="16" height="70" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
    <polygon points="-8,-40 8,-40 0,-58" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  </g>
  <g stroke="#b4232c" stroke-width="2">
    <line x1="10" y1="70" x2="50" y2="70"/><line x1="10" y1="110" x2="50" y2="110"/>
    <line x1="180" y1="70" x2="220" y2="70"/><line x1="180" y1="110" x2="220" y2="110"/>
  </g>
  <g fill="#b4232c">
    <polygon points="50,70 42,65 42,75"/><polygon points="50,110 42,105 42,115"/>
    <polygon points="220,70 212,65 212,75"/><polygon points="220,110 212,105 212,115"/>
  </g>
  <text x="20" y="60" font-size="11" fill="#b4232c">crosswind</text>
  <text x="54" y="170" font-size="12" fill="#1f2a44">unbiased: side load</text>
  <text x="206" y="170" font-size="12" fill="#1f2a44">biased: nose into wind</text>
</svg>
```
:::

::: context countdown-checks Checking the new numbers in time
A new pitch program is only useful if everyone can trust it before liftoff. So the update runs through an automatic chain: re-optimize, fly the new trajectory in simulation with the measured winds, compute the structural loads at many points along it, and compare each against its limit. Only a passing result is loaded, and the launch director hears a clear go or no-go.

That chain has to fit inside the countdown's schedule, with room to redo it if the wind changes. Building software that does all of this reliably, fast, and without a person hand-checking every number is a large part of the real engineering cost of day-of-launch updates.
:::

::: context wind-triangle The wind triangle, drawn to scale
The blue arrow is the rocket's 495 m/s through still air, along its nose. The red arrow is the effect of a 45 m/s crosswind: the air now also slides past sideways. The dark arrow is the air the rocket really feels. The small angle between blue and dark is the angle of attack, $5.19^\circ$ — drawn here at its true size.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="100" x2="315" y2="100" stroke="#1d6fd1" stroke-width="3"/>
  <polygon points="315,100 303,94 303,106" fill="#1d6fd1"/>
  <line x1="315" y1="100" x2="315" y2="125" stroke="#b4232c" stroke-width="3"/>
  <polygon points="315,125 310,115 320,115" fill="#b4232c"/>
  <line x1="40" y1="100" x2="315" y2="125" stroke="#1f2a44" stroke-width="2"/>
  <text x="150" y="90" font-size="12" fill="#1d6fd1">V = 495 m/s along the nose</text>
  <text x="322" y="118" font-size="12" fill="#b4232c">W</text>
  <text x="130" y="138" font-size="12" fill="#1f2a44">air the rocket feels</text>
  <text x="52" y="120" font-size="12" fill="#1f2a44">α = 5.19°</text>
  <text x="250" y="150" font-size="11" fill="#6c7a93">W = 45 m/s, to scale</text>
</svg>
```
:::

::: context launch-availability Days you can fly
**Launch availability** is the fraction of days on which a rocket can launch. Every scrub costs money: the team, the range, sometimes a missed chance to reach a moving target such as a space station or another planet. Upper-level wind is one of the classic reasons to wait, alongside lightning, storms and high seas for booster recovery.

A vehicle that can bias its trajectory to the day's wind turns many "too windy" days into flyable ones, without making the structure any heavier. That is often worth as much to a launch company as the extra payload.
:::
