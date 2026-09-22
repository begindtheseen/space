---
id: l12-relative-navigation-sensors
title: Relative navigation sensors
minutes: 19
covers:
  - "relative navigation sensors: relative GPS, lidar, cameras, retroreflectors"
---

Every guidance law, safety check and abort trajectory in this module assumed the chaser already knows $\boldsymbol\rho$ and $\dot{\boldsymbol\rho}$ accurately. Nothing in the CW equations produces that knowledge; it has to come from a sensor, and no single sensor covers the whole approach — kilometres down to millimetres is a wider dynamic range than any one instrument handles well. This closing lesson covers the three-stage sensor suite a real rendezvous flies, the physics behind each stage's precision, and why the transitions between them matter as much as the sensors themselves.

## Three regimes, one approach

::: key Relative navigation by range
**Far field** (kilometres to hundreds of metres): relative GPS and ground-based tracking. **Mid field** (kilometres to metres): lidar or radar, often against retroreflectors mounted on the target for an unambiguous return. **Near field** (tens of metres to contact): cameras with pattern recognition against a known docking target. Each hand-off between stages is a point of failure that must be tested explicitly, not assumed to work because each sensor works on its own.
:::

## Far field: relative GPS

Both vehicles, if each carries its own GPS receiver, can independently compute absolute position — and differencing the two solutions gives a relative position directly. The reason this works better than it sounds is that many of the largest error sources in a single GPS fix — satellite clock and ephemeris errors, atmospheric delay — are nearly identical for two receivers separated by only a few kilometres, since both are looking at the same GPS satellites through almost the same slice of atmosphere. Differencing cancels the *common* part of the error and leaves mostly the part that is not shared: each receiver's own thermal noise and multipath. Representative relative-GPS accuracy achieved this way is on the order of a few metres in real time, dropping toward the metre level with more careful (carrier-phase) processing — good enough to fly the far-field targeting of the earlier lessons, nowhere near good enough for final approach.

## Mid field: lidar, radar and retroreflectors

A lidar measures range by timing a laser pulse's round trip: $r = c\Delta t/2$, with $c=2.998\times10^8\,\mathrm{m/s}$. Precision in $r$ follows directly from timing precision:

::: example Range precision from timing resolution
A timing resolution of $1\,\mathrm{ns}$ gives $\Delta r = c\Delta t/2 = (2.998\times10^8)(10^{-9})/2 = 0.150\,\mathrm{m}$ — 15 cm. Tightening the timing electronics to $100\,\mathrm{ps}$ improves this tenfold, to $1.5\,\mathrm{cm}$; $10\,\mathrm{ps}$ reaches $1.5\,\mathrm{mm}$. This is a direct, linear trade: lidar range precision is fundamentally a timing-electronics problem, not an optics problem, and it scales exactly as the timing resolution does.
:::

Many targets carry passive **retroreflectors** — corner-cube prisms that return an incoming beam directly back along the direction it arrived from, regardless of the angle it arrived at, using nothing but the geometry of three mutually perpendicular reflecting surfaces. A corner cube needs no power, no electronics, and no pointing of its own; it guarantees a strong, unambiguous return whenever the lidar's beam happens to sweep across it, which is exactly what a passive target (a satellite with no cooperating GNC of its own) needs to be trackable at all. Radar plays the same mid-field role using radio rather than light, trading resolution for weather- and lighting-independence and typically longer range.

## Near field: cameras and pattern recognition

Inside a few tens of metres, cameras take over, using a known fiducial pattern on the target — a docking target with a specific, recognized geometry — to solve for not only range and bearing but the full six-degree-of-freedom relative pose (position and attitude together) from the pattern's apparent size, shape and orientation in the image. Lateral position precision at a given range follows directly from the camera's angular resolution (its instantaneous field of view per pixel, IFOV):

$$
d_{\text{lat}} = r\,\theta_{\text{IFOV}}.
$$

::: example Camera lateral precision at range
A camera with $0.05°$ IFOV per pixel, at $50\,\mathrm{m}$ range: $d_{\text{lat}} = 50\times(0.05\pi/180) = 0.0436\,\mathrm{m}$, about $4.4\,\mathrm{cm}$. The same camera at $5\,\mathrm{m}$ — a tenth the range — gives a tenth the lateral uncertainty, $4.4\,\mathrm{mm}$, because angular resolution converts to *linear* resolution in direct proportion to range: the same pixel that spans several centimetres far out spans only millimetres up close. This is exactly why cameras take over for the near field rather than the far field — their absolute angular precision does not change with range, but the *position* precision it buys keeps improving as the target closes in, precisely where the corridor tolerance from the earlier lesson is shrinking fastest and needs it most.
:::

Far-field or wide-angle camera use, before a target's fiducial pattern is resolvable in detail, typically gives bearing (two angles) without a reliable range — useful for coarse tracking and identifying which of several objects is the actual target, but not a substitute for the range-capable sensors of the earlier stages.

## Hand-offs are where approaches actually fail

No single sensor covers a full approach, so every real mission profile includes at least one, usually two, transitions — relative GPS to lidar, lidar to camera — and each is a point where the incoming state estimate must survive a change of instrument, of measurement type, and often of the software processing it. A hand-off is tested by running both sensors simultaneously through an overlap in their usable ranges and confirming their reported states agree, *before* trusting the new sensor alone — never by switching over at a nominal range and hoping the new sensor's first reading is correct.

::: warning A sensor that works does not mean a hand-off that works
Each sensor stage in this lesson can be validated extensively in isolation — bench-tested, flown on other missions, characterized to the precision levels quoted above — and the hand-off between two individually-proven sensors can still fail, because the failure mode lives in the transition logic itself: a stale estimate from the outgoing sensor blended incorrectly with a noisy first read from the incoming one, or a coordinate-frame mismatch between the two that never mattered while each sensor ran alone. Test the hand-off as its own event, with both sensors live and compared, not merely as the sum of two already-tested parts.
:::

## Check yourself

::: check
Explain, without reference to any specific accuracy number, why differencing two GPS solutions gives a better *relative* position than either receiver's own *absolute* position accuracy would suggest.
:::

::: answer
Both receivers, being close together, see nearly the same satellites through nearly the same atmosphere and are subject to nearly the same satellite clock and ephemeris errors; differencing the two solutions cancels whatever is common to both, leaving mostly each receiver's own independent noise and multipath — a much smaller residual than either receiver's full absolute error budget.
:::

::: check
A lidar's timing electronics are upgraded from $1\,\mathrm{ns}$ to $200\,\mathrm{ps}$ resolution. By what factor does its range precision improve, and what is the new precision in centimetres?
:::

::: answer
Range precision scales linearly with timing resolution ($\Delta r=c\Delta t/2$), so a $5\times$ improvement in timing (1000 ps to 200 ps) gives a $5\times$ improvement in range precision: from $15\,\mathrm{cm}$ to $3\,\mathrm{cm}$.
:::

::: check
Why are retroreflectors specifically useful on an uncooperative or simple target, rather than requiring an active transponder?
:::

::: answer
A retroreflector needs no power, no electronics and no active pointing — its corner-cube geometry passively returns an incoming beam back along its arrival direction regardless of angle — so it works on any target that can carry a small passive optical component, including one with no GNC or power system of its own, whereas an active transponder would require the target itself to be a cooperating, powered spacecraft.
:::

::: check
A camera's angular resolution stays fixed as range decreases from 50 m to 5 m. Explain why its *position* precision nonetheless improves by the same factor of ten.
:::

::: answer
Lateral position precision is $d_{\text{lat}}=r\,\theta_{\text{IFOV}}$ — a fixed angular resolution multiplied by range — so halving, or here reducing tenfold, the range reduces the linear (position) uncertainty by the same factor even though the angular resolution itself, a property of the optics, never changes.
:::

::: check
A mission validates its relative GPS sensor and its lidar independently, each meeting its own accuracy specification, and concludes the far-field-to-mid-field hand-off needs no separate test. What is wrong with that conclusion, based on this lesson?
:::

::: answer
Validating each sensor alone does not validate the transition between them — the hand-off can fail from causes that never appear while either sensor runs independently, such as a stale estimate persisting into the new sensor's first readings or a frame mismatch that only two simultaneously-active sources would reveal. The hand-off must be tested as its own event, with both sensors live over an overlapping range and their outputs compared, not inferred from the two sensors' separate specifications.
:::

## Summary

| Symbol or fact | Meaning |
| --- | --- |
| Far field | Relative GPS / ground tracking; km to hundreds of metres; metre-level accuracy from differencing out common errors |
| Mid field | Lidar / radar against retroreflectors; km to metres; $\Delta r=c\Delta t/2$ |
| Near field | Cameras with pattern recognition; tens of metres to contact; $d_{\text{lat}}=r\,\theta_{\text{IFOV}}$ |
| Retroreflector | Passive corner-cube prism; returns a beam along its arrival direction with no power or pointing |
| Lidar timing example | 1 ns → 15 cm range precision; 100 ps → 1.5 cm; 10 ps → 1.5 mm |
| Camera example | 0.05° IFOV at 50 m → 4.4 cm lateral precision; at 5 m → 4.4 mm |
| Sensor hand-off | Each transition is an independent failure point; validate it live, with both sensors overlapping, not by summing individual specs |

This closes the module. You can now derive and solve the CW equations from first principles, state precisely where they stop matching reality and what replaces them on an eccentric target, explain why burns drift the way they do and use that to design closed inspection loops, target a two-impulse transfer and fly it down a glideslope, and specify — with real, checked numbers — the corridors, keep-out volumes, abort manoeuvres and sensors a real approach needs to be not only planned, but safe. The same tools, at different scales and against different kinds of targets, are exactly what satellite servicing, formation flying and active debris removal build on next.
