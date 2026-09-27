---
id: l11-gnss-in-the-launch-vehicle-environment
title: GNSS in the launch vehicle environment
minutes: 21
covers:
  - "GNSS in a launch vehicle environment: acceleration, jerk, vibration, plume attenuation, antenna switching"
---

Imagine trying to hold a phone call from the back seat of a car. The driver floors the gas, then slams the brakes. The road is full of potholes. There is thick smoke outside the window. And every so often someone swaps your phone for a different one mid-sentence. You would lose the call — not because any one of those things is exotic, but because they all happen at once.

That is life for a GNSS receiver on a rocket. In a few minutes the vehicle speeds up until it pushes on everything inside with several times its own weight. It drops a stage in a few tenths of a second. It shakes hard enough to worry every box of electronics on board. Its exhaust can block a radio signal outright, not merely slow it down. And it switches which antenna is listening as it turns under the sky.

None of this needs new physics. It is the same pseudorange, the same Doppler formula and the same tracking loops this module has used all along. But the numbers are big enough to change what "good enough" means for a receiver. This lesson puts a number on each problem — acceleration, jerk, vibration, plume, antenna switching — and then asks what keeps the vehicle navigating when the receiver loses the signal anyway.

## Acceleration: the Doppler starts to run

The constellation lesson gave the Doppler shift as the rate at which the range changes, divided by the wavelength: $f_d = -\dot\rho/\lambda$. Read $\dot\rho$ as "rho dot": the range rate, how fast the distance to the satellite is changing. The minus sign says a shrinking range raises the frequency. On L1, $\lambda = 0.1903\,\mathrm{m}$.

By the time a rocket reaches orbit it moves several kilometers per second, like the spacecraft in the last lesson, so its Doppler is already far outside a ground receiver's $\pm4.9\,\mathrm{kHz}$ window. What a rocket adds is how *fast* the Doppler changes. Take the rate of change of both sides of the Doppler formula:

$$
\dot f_d = -\frac{\ddot\rho}{\lambda}.
$$

This is the **Doppler rate**. Read $\ddot\rho$ as "rho double dot": the rate of change of the range rate, which is the acceleration along the line to the satellite. So the Doppler rate is the **line-of-sight acceleration**, $a_{\mathrm{LOS}}$ — the part of the acceleration pointing along the line to the satellite — divided by the wavelength. Its size is $|\dot f_d| = a_{\mathrm{LOS}}/\lambda$, measured in hertz per second.

A receiver sitting on the ground sees Doppler rates below about $1\,\mathrm{Hz/s}$, from nothing but the slow drift of satellites across the sky. A rocket brings its own acceleration, and that acceleration grows during flight. The engines push with roughly constant force, while the propellant mass drains away. Same push, less mass, more acceleration. A vehicle that leaves the pad at a **[[thrust-to-weight ratio|thrust-to-weight]]** only a little over one can be pulling several times Earth's gravity when its tanks run dry.

::: example Doppler rate near engine cutoff
Near **main engine cutoff**, when the first stage shuts down, a typical booster accelerates at about $4g_0$, where $g_0 = 9.80665\,\mathrm{m/s^2}$ is standard gravity. Take the worst case: all of it along the line to a satellite.

**Step 1: the acceleration in SI units.**

$$
a = 4 \times 9.80665 = 39.23\,\mathrm{m/s^2}.
$$

**Step 2: divide by the wavelength.**

$$
\dot f_d = \frac{39.23}{0.1903} = 206.1\,\mathrm{Hz/s}.
$$

**Sanity check.** That is about two hundred times the ground receiver's $1\,\mathrm{Hz/s}$. It is big, but it is *steady* and predictable, so a tracking loop can be designed to follow it.
:::

## Jerk: the sudden change at staging

Staging is not steady. At main engine cutoff the thrust disappears within a few tenths of a second, and the vehicle goes from "four $g$" to free fall. The rate of change of acceleration is called **jerk** — the lurch you feel when a car's brakes grab. Jerk drives the *second* rate of change of the Doppler, the **Doppler acceleration**:

$$
\ddot f_d = \frac{j_{\mathrm{LOS}}}{\lambda},
$$

where $j_{\mathrm{LOS}}$ is the jerk along the line of sight, in $\mathrm{m/s^3}$. Read $\ddot f_d$ as "f d double dot".

::: example The staging transient
Take the same $39.23\,\mathrm{m/s^2}$ of acceleration vanishing in $0.3\,\mathrm{s}$ at **[[main engine cutoff|meco]]**.

**Step 1: the jerk** is the change in acceleration over the time it took:

$$
j = \frac{39.23}{0.3} = 130.8\,\mathrm{m/s^3}.
$$

**Step 2: the Doppler acceleration** divides that by the wavelength:

$$
\ddot f_d = \frac{130.8}{0.1903} = 687.3\,\mathrm{Hz/s^2}.
$$

**What it means.** For those three tenths of a second, the Doppler rate itself is changing by nearly $700\,\mathrm{Hz/s}$ every second. A loop that follows the steady $206\,\mathrm{Hz/s}$ climb with ease can still be thrown off by a transient this sharp. Jerk is the term that breaks a **[[third-order phase-lock loop|loop-order]]**, and the tracking-loop lesson shows exactly why.
:::

::: key
Doppler rate $\dot f_d = a_{\mathrm{LOS}}/\lambda$; Doppler acceleration (from jerk) $\ddot f_d = j_{\mathrm{LOS}}/\lambda$. A representative booster near main engine cutoff: $\dot f_d \approx 200\,\mathrm{Hz/s}$ from steady $4g$ thrust acceleration, $\ddot f_d \approx 700\,\mathrm{Hz/s^2}$ from the staging transient — far beyond anything a static or orbital receiver design has to survive.
:::

## Vibration: the same push, back and forth

Hold a phone against a running washing machine. The phone does not go anywhere, but it is shaken hard every instant. A rocket's structure does the same thing. Its engines and airflow set it ringing at its natural frequencies, a **[[resonance|resonance]]**, and the antenna rides along.

Vibration couples into the Doppler exactly as thrust does. It is acceleration, only it swings back and forth instead of building steadily. Suppose a structural resonance shakes the antenna with peak acceleration $5g_0$:

$$
5 \times 9.80665 = 49.03\,\mathrm{m/s^2}, \qquad \dot f_{d,\mathrm{peak}} = \frac{49.03}{0.1903} = 257.6\,\mathrm{Hz/s}.
$$

That peak is bigger than the steady-thrust Doppler rate from the first example. Yet vibration barely moves the vehicle: over each shake cycle, the back cancels the forth, so the position error it causes is tiny. The danger is not where the vehicle ends up. The danger is the moment-to-moment stress on the tracking loop, which must follow the Doppler as it swings.

A tracking loop's **bandwidth** acts like a filter here. Shaking that is slow compared with the loop's bandwidth gets followed, and so it shows up as tracking error like any other motion. Shaking much faster than the bandwidth is smoothed away by the loop's own sluggishness before it can do much harm. Picking that bandwidth is the central trade the tracking-loop lesson works out.

Vibration also causes plain mechanical trouble that no loop design can fix. Connectors work loose. The antenna's protective cover, the **radome**, flexes. Cables bending at resonance can change the signal's strength in rhythm with the shaking. That is why a rocket's GNSS antenna and its cables are tested against the vehicle's real vibration and shock levels, not only against radio performance.

## Plume: from delay to blackout

A rocket's exhaust is hot enough to knock electrons loose from atoms. Gas full of free electrons is a **plasma**, the same kind of stuff as the ionosphere. The ionosphere lesson found that a plasma slows a GNSS signal a little, with refractive index $n \approx 1 - 40.3\,N_e/f^2$, where $N_e$ is the number of free electrons per cubic meter. That lesson assumed the signal's frequency $f$ was far above the plasma's own natural frequency, the **[[plasma frequency|plasma-frequency]]** $f_p$. Then the effect is only a small delay.

In a dense exhaust plume that assumption can fail. Below the plasma frequency, a radio wave does not slow down; it cannot travel through at all. It bounces back and is soaked up. Think of a fence: small balls pass through the gaps, but once the gaps get smaller than the ball, nothing gets through. The plasma frequency depends only on the electron density:

$$
f_p^2 = \frac{N_e e^2}{4\pi^2\varepsilon_0 m_e} = 80.6\,N_e,
$$

with $f_p$ in hertz and $N_e$ in electrons per cubic meter. Here $e$ is the electron's charge, $m_e$ its mass, and $\varepsilon_0$ (read "epsilon nought") the electric constant of empty space. To find the density that blocks L1, set $f_p$ equal to the L1 frequency and solve for $N_e$:

$$
N_e = \frac{f_{L1}^2}{80.6}, \qquad \frac{(1575.42\times10^{6})^2}{80.6} = 3.08\times10^{16}\,\mathrm{el/m^3}.
$$

That is $3.08\times10^{10}$ electrons in every cubic centimeter. The ionosphere's densest layer, at the peak of the Sun's activity cycle, holds about $10^{12}$ electrons per cubic meter. That is roughly four orders of magnitude short of the threshold, which is why the ionosphere only ever delays GNSS and never blocks it.

A rocket plume close to the nozzle is another matter. Some propellants leave the exhaust rich in atoms that give up electrons easily — sodium and potassium traces, for instance, which are common in **[[solid rocket motors|solid-motors]]**. Such a plume can plausibly approach the threshold. Whether a particular plume does, and over how much of the flight, takes a vehicle-specific electromagnetic analysis; it is not a number this module can hand you. What the physics does hand you is the *mechanism*: once the electron density crosses the line, an ordinary delay becomes a blackout.

It also tells you which signal goes first. The density needed scales with $f^2$, so for L5 at $1176.45\,\mathrm{MHz}$ it is

$$
\left(\frac{1176.45}{1575.42}\right)^2 = 0.558
$$

times the L1 threshold. A plume that has not yet blocked L1 can already be blocking L5. (The plasma *frequency* at which L5 is blocked is $1176.45/1575.42 = 0.747$ times L1's; the density, which goes as the square, is what drops to $0.558$.)

::: note Why the constant is 80.6
Push a cloud of electrons a little to one side of the heavier ions. The separated charges pull them back, they overshoot, and the cloud sloshes back and forth. That sloshing has a natural angular frequency $\omega_p = \sqrt{N_e e^2/(\varepsilon_0 m_e)}$, the plasma frequency. Divide by $2\pi$ to turn angular frequency into hertz and square both sides: $f_p^2 = N_e e^2/(4\pi^2\varepsilon_0 m_e)$. Put in $e = 1.602\times10^{-19}\,\mathrm{C}$, $m_e = 9.109\times10^{-31}\,\mathrm{kg}$ and $\varepsilon_0 = 8.854\times10^{-12}\,\mathrm{F/m}$, and the constant comes out $80.6$. It is the same $80.6$ hiding in the ionosphere lesson: $40.3$ is exactly half of it.
:::

::: example Antenna placement is a radio decision, not only a structural one
**The problem.** A single antenna, wherever it sits on the vehicle, will at some point look at part of the sky through the plume. It may happen during a pitch maneuver. It may happen because the plume trails straight behind the rocket, along much of its own flight path, and some satellites sit in that direction.

**The standard answer.** Mount several antennas at different places on the body — for example on opposite sides — and select or combine them so at least one always has a clear, plume-free view of enough satellites.

**The consequence.** The receiver will have to change antennas during flight. That makes antenna switching, the next section, a routine part of every flight rather than an afterthought.
:::

## Antenna switching

Changing from one antenna to another in flight changes the electrical path from sky to receiver in an instant. The cable length is different. The antenna's **[[phase center|phase-center]]**, the point the range is really measured to, is in a different place. Sometimes the amplifier is different too. All of it adds up to a sudden jump in the apparent range to every satellite the new antenna sees.

The code measurement handles this fairly well. The jump is a step the code tracking loop has to settle through, usually within its ordinary pull-in range. The carrier phase handles it badly. An abrupt phase jump of unknown size looks exactly like the **[[cycle slip|cycle-slip]]** the carrier-phase lesson's detector was built to catch — because that is what it is. The path length really changed, so the count of whole cycles really needs a new starting point. A receiver that is not told a switch happened will, correctly, flag a slip. Then it must either solve a fresh ambiguity from that moment or drop that satellite's carrier phase until it can.

::: warning Switching is not invisible
Do not assume a switch is harmless because the code measurement recovers quickly. The code loop can absorb the jump in well under a second, and a crude health check will say nothing happened. The carrier phase is a different story. Its wavelength is $19\,\mathrm{cm}$ on L1, so it notices a jump of a few centimeters that the code loop shrugs off. Any software that uses carrier phase — for a precise fix, or for velocity — must be told exactly when a switch happens, so it can treat the jump as a planned event instead of a mystery slip to chase down later.
:::

## Riding through an outage

Staging, an antenna in the plume's shadow, or a jolt that exceeds a loop's limits can each cost lock outright. Every one of them is most likely at exactly the moments a rocket can least afford bad navigation.

What carries the vehicle through the gap is not GNSS at all. It is the **inertial navigation system (INS)**: gyroscopes and accelerometers, called together an **[[IMU|imu-grade]]** (inertial measurement unit), feeding a computer that adds up measured acceleration to get velocity and position. It never loses lock, because it needs nothing from outside — not radio, not plume-free sky. Its weakness is that its errors grow the longer it runs without a correction, so it *coasts*: continuous, but slowly getting worse.

How fast does it get worse? The simplest error is an accelerometer **bias** $b$: a small constant offset in what it reads. Added up once, it becomes a velocity error $bt$. Added up twice, it becomes a position error that grows with the square of time:

$$
\delta r = \tfrac{1}{2}\,b\,t^2.
$$

Accelerometer biases are quoted in **milli-g** (mg), thousandths of $g_0$: $1\,\mathrm{mg} = 0.00981\,\mathrm{m/s^2}$. A **tactical-grade** IMU has a bias around $1\,\mathrm{mg}$. After a $60\,\mathrm{s}$ coast,

$$
\tfrac{1}{2}\times0.00981\times60^2 = 17.7\,\mathrm{m},
$$

and after $120\,\mathrm{s}$ it is $70.6\,\mathrm{m}$. A **navigation-grade** IMU, with a bias around $0.025\,\mathrm{mg}$, forty times smaller, gets forty times less error from this term: under $2\,\mathrm{m}$ after the same two minutes. Doubling the outage quadruples this error, so a short outage is cheap and a long one is expensive. Real coasts also carry the velocity and tilt errors that existed when lock was lost, and those often grow faster still; the inertial navigation module works out the full error budget. How long a coast a vehicle can tolerate is a requirements calculation: pick the IMU grade, grow its errors over the longest expected outage, and compare with the accuracy needed at the end. Other sensors can hold the drift down too — a **radar altimeter** measuring height above the ground, or a camera matching terrain below — which matters most for a booster coming back to land.

### Getting the signal back

When the signals return, the receiver must find them again, and the last lesson's search-space argument applies with new numbers. The INS knows the vehicle's acceleration only to within some uncertainty $\delta a$. During an outage of length $\Delta t$ that uncertainty piles up into an unpredicted change in velocity, and so an unpredicted change in Doppler:

$$
\delta f_d = \frac{\delta a\,\Delta t}{\lambda}.
$$

::: note Where the reacquisition formula comes from
A velocity error is acceleration error added up over time: $\delta v = \delta a\,\Delta t$ when $\delta a$ stays constant. A Doppler shift is velocity along the line of sight divided by the wavelength, so a velocity error of $\delta v$ becomes a Doppler error of $\delta v/\lambda$. Put the two together and you get $\delta f_d = \delta a\,\Delta t/\lambda$. With $\delta a = 2g_0$ and $\Delta t = 5\,\mathrm{s}$ on L1:

$$
\frac{2\times9.80665\times5}{0.1903} = 515.3\,\mathrm{Hz}.
$$
:::

That extra width — about $515\,\mathrm{Hz}$ for a five-second outage with a $2g_0$ uncertainty — comes on top of whatever window the vehicle's known motion already demands. Every second of outage widens the search. So a shorter outage is doubly good: less INS drift, and a cheaper search when the signal returns.

Deep coupling, at the end of this module, attacks this from the other side. When the INS helps steer the receiver, the INS prediction of each satellite's Doppler — even while degraded — narrows the search a great deal, so the receiver reacquires far faster. That is a second reason to tie the two systems tightly together, beyond holding lock longer in the first place.

::: key
Why GNSS is hard on a launch vehicle: high acceleration and jerk stress the tracking loops, vibration modulates the carrier, the exhaust plume attenuates and refracts the signal, the vehicle body shadows antennas so switching is needed, and staging events cause transients — all at once. The inertial navigation system carries the vehicle through a lock outage, with error growth set by the IMU grade.
:::

## Check yourself

::: check
A vehicle accelerates at $2.5g_0$ straight along a satellite's line of sight. What Doppler rate does that produce on L1?
:::

::: answer
First the acceleration in SI units: $2.5 \times 9.80665 = 24.52\,\mathrm{m/s^2}$. Then divide by the wavelength: $24.52/0.1903 = 128.8\,\mathrm{Hz/s}$. That is over a hundred times what a ground receiver sees.
:::

::: check
A staging event drops the acceleration by $3g_0$ over $0.2\,\mathrm{s}$. Find the jerk and the Doppler acceleration on L1.
:::

::: answer
Jerk is the change in acceleration over the time: $3 \times 9.80665 / 0.2 = 147.1\,\mathrm{m/s^3}$. Doppler acceleration divides by the wavelength: $147.1/0.1903 = 773.0\,\mathrm{Hz/s^2}$. That is sharper than the lesson's $4g_0$-in-$0.3\,\mathrm{s}$ example, even though the drop is smaller, because it happens faster.
:::

::: check
Vibration hardly changes where the vehicle ends up. Why is it still a threat to a tracking loop?
:::

::: answer
Vibration swings back and forth, so over each cycle its effect on position nearly cancels, and the net position error is tiny. But the loop has to follow the Doppler *moment by moment*, and a swinging acceleration makes the Doppler rate swing too. At its peak, that rate can match or beat the Doppler rate of steady thrust — $257.6\,\mathrm{Hz/s}$ at a $5g_0$ peak, against $206.1\,\mathrm{Hz/s}$ for $4g_0$ of thrust. It is that peak stress, not the position, that can break lock.
:::

::: check
What electron density blocks L5 ($1176.45\,\mathrm{MHz}$)? Compare it with the L1 threshold from the lesson.
:::

::: answer
$N_e = f_{L5}^2/80.6$, and $\frac{(1176.45\times10^{6})^2}{80.6} = 1.72\times10^{16}\,\mathrm{el/m^3}$. The L1 threshold is $3.08\times10^{16}\,\mathrm{el/m^3}$, and $3.08/1.72 = 1.79$, so L5 is blocked by $1.79$ times less electron density. It is the same $f^2$ scaling the ionosphere lesson used for delay, here setting a blackout threshold: a plume dense enough to block L5 may still let L1 through.
:::

::: check
Why does switching antennas mid-flight cause more trouble for the carrier phase than for the code on the same satellite?
:::

::: answer
Both see the same sudden jump in path length, but they measure at very different scales. The code measurement is only good to about meters, so a jump of centimeters to a few meters sits inside what the code loop absorbs anyway. The carrier phase is precise to millimeters, with a $19\,\mathrm{cm}$ wavelength, so the same jump is many wavelengths. Unless the receiver is told about the switch, the jump looks exactly like a cycle slip and forces a fresh ambiguity solution.
:::

::: check
A rocket loses GNSS lock for $8\,\mathrm{s}$, and its INS knows the acceleration only to within $1.5g_0$. How much extra Doppler search width does that add on L1 when the signal returns?
:::

::: answer
$\delta f_d = \delta a\,\Delta t/\lambda$, so

$$
\frac{1.5\times9.80665\times8}{0.1903} = 618.4\,\mathrm{Hz},
$$

added on top of the window the vehicle's known motion already needs. A longer outage or a worse acceleration estimate would widen it further.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| Doppler rate | $\dot f_d = a_{\mathrm{LOS}}/\lambda$; about $206\,\mathrm{Hz/s}$ at $4g_0$ on L1, against under $1\,\mathrm{Hz/s}$ on the ground |
| Doppler acceleration | $\ddot f_d = j_{\mathrm{LOS}}/\lambda$; about $687\,\mathrm{Hz/s^2}$ when $4g_0$ vanishes in $0.3\,\mathrm{s}$ at staging |
| Vibration | same coupling, swinging; $257.6\,\mathrm{Hz/s}$ peak at $5g_0$; loop bandwidth smooths fast shaking |
| Plume blackout | $f_p^2 = 80.6\,N_e$; blocks L1 above $3.08\times10^{16}\,\mathrm{el/m^3}$, about four orders above the ionosphere's peak; L5 goes first |
| Antenna switching | instant path jump; the code absorbs it, the carrier phase sees a cycle slip unless told |
| Coasting | the INS carries the outage; accelerometer bias gives $\delta r = \tfrac{1}{2}bt^2$; a better IMU grade buys a longer coast |
| Reacquisition | extra search width $\delta f_d = \delta a\,\Delta t/\lambda$; inertial aiding narrows it |

This lesson and the last both ended at a search that outside knowledge can narrow, and at motion sharp enough to break a loop not built for it. Both point at the tracking loops, which the last two lessons open up. First, though, the next lesson asks a different question: what can a receiver do when one of its measurements is wrong — by accident, or on purpose?

::: context thrust-to-weight Push against pull
The **thrust-to-weight ratio** compares the engines' push with the vehicle's weight. Above $1$ the rocket can climb; at exactly $1$ it hovers. Big launchers leave the pad at around $1.2$ to $1.5$, so at first they climb slowly. As propellant burns off, the push stays nearly the same while the weight keeps falling, so the ratio — and the acceleration — climbs all the way to cutoff. That is why the hardest acceleration comes at the end of a stage's burn, not the start.
:::

::: context meco The moment the push stops
**Main engine cutoff** (MECO) is when a stage's engines shut down. Acceleration that has been climbing for two minutes drops to nothing in a few tenths of a second. The steep cliff at the end is the jerk.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="36" y1="30" x2="44" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="32" y="34" font-size="11" fill="#1f2a44" text-anchor="end">4 g</text>
  <text x="32" y="174" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <path d="M 40 124.5 Q 220 110 300 30" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="300" y1="30" x2="303" y2="170" stroke="#b4232c" stroke-width="2.5"/>
  <text x="250" y="60" font-size="11" fill="#1f2a44" text-anchor="end">acceleration grows</text>
  <text x="250" y="74" font-size="11" fill="#1f2a44" text-anchor="end">as propellant burns</text>
  <text x="310" y="110" font-size="11" fill="#b4232c">MECO</text>
  <text x="310" y="124" font-size="11" fill="#b4232c">jerk</text>
  <text x="190" y="190" font-size="11" fill="#1f2a44" text-anchor="middle">time</text>
</svg>
```
:::

::: context loop-order Why jerk is the killer
A tracking loop's **order** says which rate of change it can follow with no steady lag. A second-order loop follows a steady Doppler perfectly but lags behind a steady Doppler *rate*. A third-order loop, the usual choice for a receiver that must handle real acceleration, follows a steady Doppler rate perfectly but lags behind jerk. A staging cliff is a burst of jerk, one step beyond what even a third-order loop follows. The tracking-loop lesson derives the size of that lag, and shows why widening the loop to cope lets in more noise.
:::

::: context resonance Every structure has a note
Tap a wine glass and it rings at one pitch: its **resonance**. A rocket's body, tanks and brackets ring too, each at its own frequencies. When the engine's rumble or the rushing air contains those frequencies, the shaking builds up, the way a swing goes higher when you push it in time. Vibration tests on the ground hunt for these frequencies so nothing important sits on top of one.
:::

::: context plasma-frequency Too dense to pass
Below its plasma frequency a plasma acts like a mirror. The ionosphere does exactly this for AM radio: its plasma frequency is a few megahertz, so AM broadcasts at night bounce off it and travel beyond the horizon. GNSS signals, at over a gigahertz, sail through. The scale below shows how far a plasma would have to go to stop them.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="70" x2="330" y2="70" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="65" x2="30" y2="75"/><line x1="105" y1="65" x2="105" y2="75"/><line x1="180" y1="65" x2="180" y2="75"/><line x1="255" y1="65" x2="255" y2="75"/><line x1="330" y1="65" x2="330" y2="75"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="90">10^10</text><text x="105" y="90">10^12</text><text x="180" y="90">10^14</text><text x="255" y="90">10^16</text><text x="330" y="90">10^18</text>
  </g>
  <text x="180" y="110" font-size="11" fill="#6c7a93" text-anchor="middle">electrons per cubic meter (log scale)</text>
  <circle cx="105" cy="70" r="5" fill="#1d6fd1"/>
  <text x="105" y="50" font-size="11" fill="#1d6fd1" text-anchor="middle">ionosphere peak</text>
  <line x1="263.8" y1="58" x2="263.8" y2="82" stroke="#f2b880" stroke-width="3"/>
  <line x1="273.3" y1="58" x2="273.3" y2="82" stroke="#b4232c" stroke-width="3"/>
  <text x="250" y="30" font-size="11" fill="#1f2a44" text-anchor="middle">blocks L5</text>
  <text x="300" y="46" font-size="11" fill="#b4232c" text-anchor="middle">blocks L1</text>
</svg>
```
:::

::: context solid-motors Why solid boosters are worst
**Solid rocket motors** burn a rubbery mix of fuel and oxidizer, usually with aluminum powder added. Traces of sodium and potassium in the ingredients give up electrons at flame temperatures, making the exhaust far more ionized than, say, a kerosene–oxygen flame. Radio engineers have long known that solid-booster plumes can weaken or cut radio links to a vehicle, which is why antenna placement on vehicles with solid boosters gets special care.
:::

::: context phase-center Where the range ends
A range must be measured to *some* point on the antenna, and that point — the **phase center** — is not a bolt you can touch. It is the point the arriving waves seem to spread out from, a few centimeters inside or above the antenna, and it shifts a little with the satellite's direction. Two antennas on opposite sides of a rocket have phase centers a meter or more apart, so switching between them really does move the measurement point.
:::

::: context cycle-slip A skipped count
Carrier phase measures range by counting whole wavelengths plus a fraction, like counting laps on a track. A **cycle slip** is a lost count: the fraction is still measured perfectly, but the whole-lap number jumps by some unknown amount. Everything precise built on the count must then be re-solved. The carrier-phase lesson built a detector for exactly this.
:::

::: context imu-grade Buying time with better sensors
IMUs come in grades, and a better grade buys a longer coast. The curves show only the accelerometer-bias term, $\tfrac{1}{2}bt^2$, for a $1\,\mathrm{mg}$ tactical unit and a $0.025\,\mathrm{mg}$ navigation-grade unit. Real coasts add the velocity and tilt errors present at loss of lock, but the shape — slow at first, then running away — is the same.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="340" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="30" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2.5" points="40,170 64,169.2 88,166.7 112,162.5 136,156.7 160,149.2 184,140 208,129.2 232,116.7 256,102.5 280,86.6 304,69.1 328,50"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,170 88,169.9 136,169.7 184,169.2 232,168.7 280,167.9 328,167"/>
  <line x1="36" y1="50" x2="44" y2="50" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="32" y="54" font-size="11" fill="#1f2a44" text-anchor="end">71 m</text>
  <text x="32" y="174" font-size="11" fill="#1f2a44" text-anchor="end">0</text>
  <text x="328" y="186" font-size="11" fill="#1f2a44" text-anchor="middle">120 s</text>
  <text x="190" y="195" font-size="11" fill="#1f2a44" text-anchor="middle">outage length</text>
  <text x="250" y="78" font-size="11" fill="#b4232c" text-anchor="end">tactical, 1 mg</text>
  <text x="330" y="158" font-size="11" fill="#1d6fd1" text-anchor="end">navigation grade</text>
</svg>
```
:::
