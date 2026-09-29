---
id: l12-relative-navigation-sensors
title: Relative navigation sensors
minutes: 19
covers:
  - "relative navigation sensors: relative GPS, lidar, cameras, retroreflectors"
---

Think about walking to a friend's house for the first time. Across town, the map on your phone gets you to the right street — it is only good to a few meters, but that is plenty. On the street, you stop looking at the phone and look for the house number. At the front door, you use your eyes and hands to find the doorbell. Three different "sensors", each good at one distance, and at each change you have to make sure the new one agrees with the old one before you trust it.

A spacecraft closing in on a space station works the same way. Every guidance law, safety check and abort in this module assumed the chaser already knows $\boldsymbol\rho$ (read "rho", its position relative to the target) and $\dot{\boldsymbol\rho}$ ("rho dot", its relative velocity) accurately. Nothing in the CW equations provides that knowledge. It has to come from sensors.

No single sensor covers the whole approach. Going from kilometers down to millimeters is a wider range than any one instrument handles well. This closing lesson covers the three-stage sensor suite a real rendezvous flies, the physics that sets each stage's precision, and why the hand-offs between stages matter as much as the sensors themselves.

## Three regimes, one approach

Engineers split the approach into three distance bands, each with its own sensors.

- **Far field**, kilometers down to hundreds of meters. Here the chaser uses **relative GPS**, the difference between two GPS receivers' answers, plus tracking from the ground.
- **Mid field**, kilometers down to meters. Here it uses **lidar** (laser ranging) or **radar** (radio ranging), often aimed at **retroreflectors** — special mirrors on the target that bounce the beam straight back.
- **Near field**, tens of meters down to contact. Here it uses **cameras** that recognize a known pattern painted or mounted on the docking target.

The bands overlap on purpose. That overlap is where one sensor hands the job to the next.

::: key Relative navigation sensors, by range
Far field: relative GPS and ground tracking, kilometers to hundreds of meters. Mid field: lidar and radar against retroreflectors, kilometers to meters. Near field: cameras with pattern recognition on docking targets, tens of meters to contact. Each hand-off is a point of failure that must be tested explicitly, not assumed to work because each sensor works on its own.
:::

## Far field: relative GPS

Imagine two friends stepping on the same bathroom scale, one after the other. The scale reads $2\,\mathrm{kg}$ too heavy. Each friend's weight is wrong. But the *difference* between their weights is exactly right, because the same $2\,\mathrm{kg}$ error is in both readings and cancels when you subtract.

Relative GPS uses the same trick. If both vehicles carry a GPS receiver, each can work out its own absolute position. Subtract one answer from the other and you get the relative position directly.

This works better than you might expect. Many of the biggest errors in a single GPS fix are nearly the same for two receivers a few kilometers apart:

- errors in the GPS satellites' clocks and in their reported positions (their **ephemeris**, the table of where each satellite is);
- delays as the signal passes through the upper atmosphere.

Both receivers look at the same GPS satellites, through almost the same slice of sky, at the same moment. So subtracting cancels the **common** part of the error. What is left is the part each receiver has on its own: its electronic noise and **multipath**, signals that bounce off the spacecraft's own structure before reaching the antenna.

::: example How much differencing helps
Here are some illustrative numbers. Suppose each receiver's position is off by a common error of $4.0\,\mathrm{m}$ (the same for both, from the satellites and the atmosphere) plus its own random error of about $0.5\,\mathrm{m}$.

**One receiver alone.** The two parts are unrelated, so they combine like the sides of a right triangle:

$$
\sqrt{4.0^2 + 0.5^2} = \sqrt{16 + 0.25} \approx 4.03\,\mathrm{m}.
$$

**The difference of two receivers.** The common $4.0\,\mathrm{m}$ appears in both and cancels. The two own errors are **[[independent|independent-errors]]** of each other, so they combine the same right-triangle way:

$$
\sqrt{0.5^2 + 0.5^2} = \sqrt{0.5} \approx 0.71\,\mathrm{m}.
$$

The relative position is more than five times better than either absolute position. Sanity check: it is a little worse than one receiver's own noise ($0.5\,\mathrm{m}$), because two noisy receivers are involved, and far better than the $4\,\mathrm{m}$ common error, because that part is gone.
:::

In practice, real-time relative GPS reaches a few meters with the basic signal. With more careful **[[carrier-phase|carrier-phase]]** processing it can get well below a meter — decimeters, and centimeters in the best cases. That is good enough to fly the far-field targeting of the earlier lessons. It is nowhere near good enough to steer into a docking port, and near a big station, the structure blocks and reflects GPS signals and makes things worse.

## Mid field: lidar, radar and retroreflectors

A **lidar** is a laser rangefinder. It fires a short pulse of light, waits for the echo, and times the **[[round trip|round-trip]]**. Light travels at $c = 2.998 \times 10^8\,\mathrm{m/s}$. The pulse goes out and back, so it covers twice the range:

$$
r = \frac{c\,\Delta t}{2}.
$$

Here $\Delta t$ ("delta t") is the measured round-trip time. For a target $1\,\mathrm{km}$ away, $\Delta t = 2 \times 1000 / (2.998 \times 10^8) \approx 6.67\,\mu\mathrm{s}$ — about seven millionths of a second.

The same formula tells you how precise the range is. If the clock can only tell times apart to within $\Delta t$, the range can only be told apart to within $c\,\Delta t / 2$.

::: example Range precision from timing resolution
**A clock good to 1 ns** (one nanosecond, a billionth of a second):

$$
\Delta r = \frac{c\,\Delta t}{2} = \frac{(2.998 \times 10^8)(10^{-9})}{2} \approx 0.150\,\mathrm{m} = 15\,\mathrm{cm}.
$$

**Ten times finer, 100 ps** (picoseconds, trillionths of a second): $1.5\,\mathrm{cm}$.

**Another ten times finer, 10 ps:** $1.5\,\mathrm{mm}$.

The trade is direct and linear: halve the timing step and you halve the range step. So much of a lidar's range precision comes down to its timing electronics. (The strength of the returned signal matters too — a weak, noisy echo is hard to time well, however good the clock.)
:::

To get a strong echo, many targets carry **retroreflectors**. The common kind is a **[[corner cube|corner-cube]]**: a glass or mirror piece with three flat reflecting faces, all at right angles to each other, like the inside corner of a box. Light entering it bounces off all three faces and leaves heading straight back the way it came — over a wide range of entry angles.

A corner cube needs no power, no electronics and no pointing. It guarantees a strong, unmistakable echo whenever the lidar beam sweeps across it. That makes it ideal for a passive target — one that is not powered or not actively helping — and for picking out the target from the clutter of a large station. Scanning lidars also measure the beam's direction when the echo returns, which gives the **bearing** (the direction to the target) as well as the range.

**Radar** plays the same mid-field role with radio waves instead of light. It gives up some resolution, but it does not care about sunlight or darkness and usually reaches farther. Real vehicles have used all of these, in **[[different combinations|real-sensors]]**.

## Near field: cameras and pattern recognition

Inside a few tens of meters, cameras take over. The target carries a **[[fiducial pattern|fiducial-word]]** — a docking target with a known shape and known dimensions. The camera finds the pattern in its image and works out not only range and bearing but the full **[[six-degree-of-freedom|six-dof]]** relative **pose**: three numbers for position and three for attitude.

How? The pattern's known size tells range (it looks smaller when farther away). Where it sits in the image tells bearing. How it is squashed and turned in the image tells attitude.

How finely can a camera tell sideways position? Each pixel sees a tiny slice of angle, its **instantaneous field of view**, or **IFOV** (read "eye-fov"), written $\theta_{\text{IFOV}}$. At range $r$, one pixel covers a sideways distance of

$$
d_{\text{lat}} = r\,\theta_{\text{IFOV}},
$$

with the angle in radians. This is the arc-length rule — arc equals radius times angle — for a very thin **[[pixel wedge|pixel-wedge]]**.

::: example Camera lateral precision at range
Take a camera with $0.05°$ per pixel. First convert to radians:

$$
\theta_{\text{IFOV}} = 0.05 \times \frac{\pi}{180} \approx 8.73 \times 10^{-4}\,\mathrm{rad}.
$$

**At 50 m:** $d_{\text{lat}} = 50 \times 8.73 \times 10^{-4} \approx 0.0436\,\mathrm{m}$, about $4.4\,\mathrm{cm}$.

**At 5 m**, a tenth of the range: $d_{\text{lat}} = 5 \times 8.73 \times 10^{-4} \approx 0.00436\,\mathrm{m}$, about $4.4\,\mathrm{mm}$ — a tenth as much.

The pixel's angle never changes. But the distance it covers shrinks in step with range. The same pixel that spans several centimeters far out spans only millimeters up close. That is exactly why cameras belong in the near field. Their position precision keeps getting better as the target closes in — exactly where the corridor from the earlier lesson is shrinking fastest and needs it most.
:::

Far out, before the pattern's details are visible, a camera still helps. It gives bearing (two angles) without a trustworthy range. That is useful for rough tracking and for telling which of several objects is the actual target. It does not replace the range sensors of the earlier stages.

## Hand-offs are where approaches actually fail

Because no sensor covers the whole approach, every real profile has at least one hand-off, usually two: relative GPS to lidar, then lidar to camera. At each one, the vehicle's estimate of its state has to survive a change of instrument, a change of the kind of measurement, and often a change of the software processing it.

A hand-off is tested by running both sensors at once through a stretch of range where both work, and confirming their answers agree — *before* trusting the new sensor alone. It is never done by switching over at a set range and hoping the new sensor's first reading is right.

::: warning A sensor that works does not mean a hand-off that works
Each sensor in this lesson can be tested thoroughly on its own — on the bench, on other missions, measured to the precisions quoted above. The hand-off between two proven sensors can still fail, because the fault lives in the switch-over itself. Examples: an old estimate from the outgoing sensor mixed badly with a noisy first reading from the new one, or two sensors reporting in slightly different coordinate frames — a mismatch that never mattered while each ran alone. Test the hand-off as its own event, with both sensors live and compared, not as the sum of two already-tested parts. Real missions have been **[[lost this way|dart-mishap]]**.
:::

## Check yourself

::: check
Without using any accuracy numbers, explain why subtracting two GPS answers gives a better *relative* position than either receiver's *absolute* accuracy would suggest.
:::

::: answer
The two receivers are close together. They see nearly the same GPS satellites, through nearly the same atmosphere, with nearly the same satellite clock and ephemeris errors. Subtracting the two answers cancels everything they share. What is left is mostly each receiver's own noise and multipath, which is much smaller than either receiver's full absolute error.
:::

::: check
A lidar's timing electronics are upgraded from $1\,\mathrm{ns}$ to $200\,\mathrm{ps}$ resolution. By what factor does its range precision improve, and what is the new precision in centimeters?
:::

::: answer
Range precision is $\Delta r = c\,\Delta t / 2$, so it scales in direct proportion to the timing step. The timing gets $1000\,\mathrm{ps} / 200\,\mathrm{ps} = 5$ times finer, so the range precision gets 5 times finer too.

It goes from $15\,\mathrm{cm}$ to $15 / 5 = 3\,\mathrm{cm}$. Check directly: $(2.998 \times 10^8)(200 \times 10^{-12}) / 2 \approx 0.030\,\mathrm{m}$.
:::

::: check
Why are retroreflectors especially useful on a simple or uncooperative target, compared with an active radio transponder?
:::

::: answer
A retroreflector needs no power, no electronics and no pointing. Its corner-cube shape sends an incoming beam straight back toward where it came from, over a wide range of angles. So it works on any target that can carry a small passive optical part — including one with no GNC or power of its own.

An active transponder would need the target to be a powered spacecraft that is working and cooperating.
:::

::: check
A camera's angular resolution stays the same as range drops from 50 m to 5 m. Explain why its *position* precision still improves by a factor of ten.
:::

::: answer
Lateral position precision is $d_{\text{lat}} = r\,\theta_{\text{IFOV}}$: a fixed angle times the range. Cutting the range by a factor of ten cuts the sideways distance one pixel covers by the same factor of ten, even though the angle — a property of the optics — never changes. So $4.4\,\mathrm{cm}$ at $50\,\mathrm{m}$ becomes $4.4\,\mathrm{mm}$ at $5\,\mathrm{m}$.
:::

::: check
A mission tests its relative GPS and its lidar separately. Each meets its own accuracy specification. The team concludes the GPS-to-lidar hand-off needs no separate test. What is wrong with that?
:::

::: answer
Testing each sensor alone does not test the switch between them. The hand-off can fail for reasons that never show up while either sensor runs by itself — an old estimate carried into the new sensor's first readings, or a coordinate-frame mismatch that only appears when two sources are live together.

The hand-off must be tested as its own event: both sensors running over an overlapping range, their outputs compared. It cannot be inferred from two separate specifications.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Far field | Relative GPS and ground tracking; km to hundreds of m; common errors cancel when two receivers are subtracted |
| Mid field | Lidar or radar, often against retroreflectors; km to m; range $r = c\,\Delta t/2$ |
| Near field | Cameras with pattern recognition; tens of m to contact; full pose; $d_{\text{lat}} = r\,\theta_{\text{IFOV}}$ |
| Retroreflector | Passive corner cube; sends a beam straight back, no power or pointing |
| Lidar timing example | 1 ns gives 15 cm; 100 ps gives 1.5 cm; 10 ps gives 1.5 mm |
| Camera example | 0.05° per pixel: 4.4 cm at 50 m, 4.4 mm at 5 m |
| GPS differencing example | 4.03 m absolute error per receiver, about 0.71 m relative |
| Sensor hand-off | A failure point of its own; test it live, with both sensors overlapping |

This closes the module. You can now derive and solve the CW equations, say where they stop matching reality and what replaces them for an eccentric target, explain why burns drift the way they do and use that to design closed inspection loops, target a two-impulse transfer and fly it down a glideslope, and specify — with real, checked numbers — the corridors, keep-out zones, aborts and sensors that make an approach not only planned but safe. The same tools, at other scales and against other kinds of targets, are what satellite servicing, formation flying and active debris removal build on next.

::: context independent-errors Why independent errors add like a right triangle
Two errors are **independent** when knowing one tells you nothing about the other — like two separate dice. They do not add up directly, because sometimes one is high while the other is low and they partly cancel. On average, their combined size is the square root of the sum of their squares, the same rule as the long side of a right triangle. So two independent $0.5\,\mathrm{m}$ errors combine to about $0.71\,\mathrm{m}$, not $1.0\,\mathrm{m}$. You will meet this rule again, properly, when the course covers probability and Kalman filters.
:::

::: context carrier-phase Counting the waves themselves
A basic GPS receiver times a coded pattern in the signal, and that pattern's "ticks" are hundreds of meters long, so it can only be timed to about a meter or worse. But the radio wave carrying the pattern has a wavelength of only about $19\,\mathrm{cm}$ (the GPS L1 signal at $1575.42\,\mathrm{MHz}$). A receiver can track where it is within one wave to a small fraction of a wavelength — millimeters. The hard part is knowing *how many whole waves* lie between satellite and receiver. Once that count is pinned down, positions become far more precise. Between two nearby receivers it is much easier to pin down, which is why relative GPS benefits so much.
:::

::: context round-trip Why divide by two
The lidar starts its clock when the pulse leaves and stops it when the echo comes back. In that time the light has traveled to the target *and back* — twice the range. Distance equals speed times time, so the light covered $c\,\Delta t$, and the range is half of that.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="40" width="24" height="40" fill="#1f2a44"/>
  <text x="32" y="98" font-size="11" fill="#1f2a44" text-anchor="middle">lidar</text>
  <rect x="316" y="30" width="14" height="60" fill="#6c7a93"/>
  <text x="323" y="108" font-size="11" fill="#1f2a44" text-anchor="middle">target</text>
  <line x1="50" y1="50" x2="306" y2="50" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="310,50 300,45 300,55" fill="#1d6fd1"/>
  <line x1="310" y1="70" x2="54" y2="70" stroke="#b4232c" stroke-width="2"/>
  <polygon points="50,70 60,65 60,75" fill="#b4232c"/>
  <text x="180" y="42" font-size="12" fill="#1d6fd1" text-anchor="middle">out: r</text>
  <text x="180" y="88" font-size="12" fill="#b4232c" text-anchor="middle">back: r</text>
  <text x="180" y="120" font-size="12" fill="#1f2a44" text-anchor="middle">total path 2r = c Δt</text>
</svg>
```

Forgetting the factor of two doubles every range — a classic slip. Bats and ships' sonar use the same rule with sound, which travels about $343\,\mathrm{m/s}$ in air instead of $3 \times 10^8\,\mathrm{m/s}$.
:::

::: context corner-cube How a corner cube sends light back
Here is the idea with two mirrors at right angles, seen from the side. Each bounce flips one part of the ray's direction. Two bounces flip both, so the ray leaves exactly parallel to how it came in, heading back. A real corner cube adds a third mirror to flip the third direction too, which works in 3D.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="300" y1="30" x2="300" y2="170" stroke="#1f2a44" stroke-width="4"/>
  <line x1="150" y1="170" x2="300" y2="170" stroke="#1f2a44" stroke-width="4"/>
  <line x1="80" y1="10" x2="300" y2="120" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="190,65 179.3,64.8 183.8,55.9" fill="#1d6fd1"/>
  <line x1="300" y1="120" x2="200" y2="170" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="200" y1="170" x2="40" y2="90" stroke="#b4232c" stroke-width="2"/>
  <polygon points="110,125 120.7,125.2 116.2,134.1" fill="#b4232c"/>
  <text x="66" y="30" font-size="12" fill="#1d6fd1">beam in</text>
  <text x="30" y="112" font-size="12" fill="#b4232c">beam out</text>
  <text x="308" y="80" font-size="11" fill="#1f2a44">mirror</text>
  <text x="200" y="190" font-size="11" fill="#1f2a44">mirror</text>
  <text x="250" y="160" font-size="11" fill="#6c7a93">90°</text>
</svg>
```

The in and out beams are parallel, only shifted sideways — the shift is why a real reflector has some size.
:::

::: context real-sensors Sensors that have really flown
Different programs chose different mixes. Russia's Soyuz and Progress ships use **Kurs**, a radio system that measures range, rate and direction to antennas on the station. Europe's ATV cargo ship used two laser sensors aimed at retroreflectors mounted on the station. The Space Shuttle carried a lidar called the Trajectory Control Sensor plus hand-held laser rangefinders. SpaceX's Dragon uses a sensor package called DragonEye, with lidar and thermal cameras. Relative GPS was used by several of these for the far field.
:::

::: context fiducial-word Where "fiducial" comes from
**Fiducial** comes from the Latin *fiducia*, "trust". A fiducial mark is a mark you trust as a fixed reference — surveyors, microscopists and chip makers all use them. On a docking target it is a set of shapes or lights whose exact size and layout are known in advance, so that any change in how they look in the camera can only be due to where the camera is and how it is pointed.
:::

::: context six-dof Six numbers to say where something is
To pin down where one rigid object sits relative to another, you need six numbers. Three say where it is: radial, in-track, cross-track. Three say how it is turned: roll, pitch and yaw. These are the six **degrees of freedom**. Docking needs all six, because arriving at the right spot while tilted by a few degrees can still jam the mechanism. Radar or lidar ranging alone usually gives only range and direction; a camera looking at a known pattern can recover all six.
:::

::: context pixel-wedge One pixel, near and far
A pixel sees a thin wedge of space. Twice as far away, the wedge is twice as wide. The angle below is drawn much larger than a real $0.05°$ so you can see it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="30,100 320,69.52 320,130.48" fill="#8fb8f0" fill-opacity="0.35" stroke="#1d6fd1" stroke-width="1.5"/>
  <rect x="14" y="90" width="16" height="20" fill="#1f2a44"/>
  <line x1="57" y1="97.16" x2="57" y2="102.84" stroke="#b4232c" stroke-width="3"/>
  <line x1="300" y1="71.62" x2="300" y2="128.38" stroke="#b4232c" stroke-width="3"/>
  <text x="57" y="125" font-size="12" fill="#1f2a44" text-anchor="middle">r</text>
  <text x="300" y="150" font-size="12" fill="#1f2a44" text-anchor="middle">10 r</text>
  <text x="200" y="40" font-size="12" fill="#1f2a44" text-anchor="middle">same angle, 10 times the width</text>
  <text x="22" y="130" font-size="11" fill="#1f2a44" text-anchor="middle">camera</text>
</svg>
```

Read it backward and you have the lesson: bring the target ten times closer and one pixel covers a tenth of the distance.
:::

::: context dart-mishap A rendezvous test that ended in a bump
In April 2005, NASA's DART spacecraft (Demonstration for Autonomous Rendezvous Technology) was meant to approach an old satellite called MUBLCOM on its own and fly close formation around it. Its navigation software kept a wrong estimate of its own velocity, which made it fire its thrusters far more than planned and burn through its propellant. Late in the approach it bumped into MUBLCOM at low speed. The investigation pointed to the navigation software and how it handled its measurements, not to any single broken sensor — the kind of fault that only shows up when the parts run together.
:::
