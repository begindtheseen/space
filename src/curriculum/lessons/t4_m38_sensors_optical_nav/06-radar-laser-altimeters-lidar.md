---
id: l06-radar-laser-altimeters-lidar
title: Radar altimeters, laser altimeters and lidar
minutes: 18
covers:
  - Radar altimeters, laser altimeters and lidar
---

Every sensor so far in this module measures a *direction* — a star's bearing, the Sun's bearing, a field's direction, nadir itself. A radar or laser altimeter measures something none of them can: a distance, timed directly rather than inferred from geometry. That single difference is what makes ranging sensors indispensable during descent, landing, and — a later lesson's subject — close proximity to another vehicle, where knowing which way is down or which way is toward the target matters far less than knowing exactly how far away it still is.

Radar and lidar altimeters share one measurement principle and differ in almost everything else that follows from it, and nearly all of that difference traces back to a single number: wavelength. A radar altimeter's centimetre-scale wavelength lets it shrug off dust, cloud, and full daylight at the cost of a wide beam that blurs together everything within its footprint; a laser altimeter's micron-scale wavelength focuses down to a beam narrow enough to resolve individual boulders at centimetre precision, at the cost of being scattered by the same dust a radar barely notices. This lesson derives both halves of that trade with real numbers, and works out what "altitude" even means once the sensor is not looking straight down.

## Time of flight: the one principle both share

Both instruments send a signal — a radio pulse or a laser pulse — toward the ground and time how long it takes to return. For a target at range $R$, the round trip takes $\Delta t = 2R/c$, so

$$
R = \frac{c\,\Delta t}{2}.
$$

Timing precision converts directly into range precision: differentiating, $\sigma_R = c\,\sigma_{\Delta t}/2$. A system that times its return to $1\,\mathrm{ns}$ resolves range to $c\times10^{-9}/2=0.15\,\mathrm{m}$; one limited to $10\,\mathrm{ns}$ resolves only to $1.5\,\mathrm{m}$. Many radar altimeters instead transmit a continuously frequency-modulated wave (FMCW) rather than discrete pulses, and read range from the beat frequency between the transmitted chirp and the returned echo — mathematically a different measurement, but subject to the identical trade between timing (here, frequency) precision and range precision, and with the advantage of delivering range-rate from the same return via its Doppler shift, without a second measurement.

## Why wavelength decides everything

A radar altimeter's wavelength is centimetres — a few gigahertz to a few tens of gigahertz corresponds to roughly $1$ to $10\,\mathrm{cm}$. A lidar's is close to a micron, five orders of magnitude shorter. That gap sets how each instrument's beam interacts with anything in the way, and how tightly each can be focused.

**Penetrating dust and cloud** depends on how a particle's size compares to the wavelength scattering off it. A particle far smaller than the wavelength scatters in the Rayleigh regime, where the scattering strength falls off as the *fourth power* of the particle-to-wavelength ratio — shrink that ratio by ten and the particle scatters ten thousand times less.

::: example How much better radar penetrates dust than lidar does
A representative dust or cloud droplet, $20\,\mathrm{\mu m}$ across, compared to a $3\,\mathrm{cm}$ radar wavelength and a $1\,\mathrm{\mu m}$ lidar wavelength:

```python
particle = 20e-6           # m
lam_radar, lam_lidar = 0.03, 1.0e-6   # m

ratio_radar = particle / lam_radar
ratio_lidar = particle / lam_lidar
print("radar: particle/wavelength =", ratio_radar, " Rayleigh suppression ~ ratio^4 =", ratio_radar**4)
print("lidar: particle/wavelength =", ratio_lidar, " (order 1, not a small-particle regime at all)")
# radar: particle/wavelength = 0.000667  Rayleigh suppression ~ ratio^4 = 1.98e-13
# lidar: particle/wavelength = 20.0      (order 1, not a small-particle regime at all)
```

For the radar, the dust particle is almost fifteen hundred times smaller than the wavelength, deep in the Rayleigh regime, where the scattering that fourth-power law predicts is suppressed by roughly thirteen orders of magnitude relative to a particle the size of the wavelength itself — a dust cloud that would be opaque at optical wavelengths is close to transparent to a radar altimeter. The lidar gets no such reprieve: at a micron wavelength, a $20\,\mathrm{\mu m}$ particle is *larger* than the wavelength, squarely in the Mie regime where scattering is strongest rather than suppressed. This is the physical content behind the module's own accuracy card — "radar: works through dust and in daylight… lidar: scattered by dust and plume" is not a rule of thumb, it is this ratio, raised to the fourth power, working in opposite directions for the two instruments.
:::

**Beam width**, the other side of the trade, follows from ordinary diffraction: a physically realizable antenna or laser focuses a beam to an angular width roughly inversely proportional to its aperture size measured in wavelengths, so the same aperture that is comfortably large at a lidar's micron wavelength is minuscule at a radar's centimetre wavelength. A simple radar altimeter's beam is commonly tens of degrees wide; a lidar's is a milliradian or less — three to four orders of magnitude narrower.

::: example What each beam actually illuminates on the ground
```python
def footprint_radius(h, half_angle_deg):
    import numpy as np
    return h * np.tan(np.radians(half_angle_deg))

for h in (2000.0, 500.0, 30.0):
    r_radar = footprint_radius(h, 10.0)                       # a 10 deg half-angle radar beam
    r_lidar = footprint_radius(h, 0.0572957795)                # a 1 mrad half-angle lidar beam
    print(f"h={h:7.1f} m   radar footprint radius = {r_radar:8.1f} m   lidar footprint radius = {r_lidar:.3f} m")
# h=2000.0 m   radar footprint radius =    352.7 m   lidar footprint radius = 2.000 m
# h= 500.0 m   radar footprint radius =     88.2 m   lidar footprint radius = 0.500 m
# h=  30.0 m   radar footprint radius =      5.3 m   lidar footprint radius = 0.030 m
```

At $500\,\mathrm{m}$ altitude the radar illuminates a patch nearly $180\,\mathrm{m}$ across; the lidar illuminates one a metre wide. Whatever is inside each footprint contributes to the return the receiver actually sees.

What "inside the footprint" costs a radar altimeter, in practice, is resolved with a synthetic terrain profile: a regional slope plus boulder- and ridge-scale roughness at several length scales, sampled by a narrow lidar-like point reading and by a wide, antenna-weighted radar-like average over the same $176\,\mathrm{m}$-diameter footprint used above:

```python
import numpy as np

rng = np.random.default_rng(4)
xs = np.linspace(0, 500, 4000)
terrain = np.zeros_like(xs)
for amp, wavelength, phase in [(1.5, 40.0, 0.3), (0.6, 12.0, 1.7), (0.25, 4.0, 0.9)]:
    terrain += amp * np.sin(2 * np.pi * xs / wavelength + phase)
terrain += rng.normal(0, 0.05, xs.shape)

def radar_reading(x0, h=500.0, half_angle_deg=10.0):
    r = h * np.tan(np.radians(half_angle_deg))
    mask = np.abs(xs - x0) <= r
    w = np.exp(-0.5 * ((xs[mask] - x0) / (r / 2)) ** 2)     # antenna gain pattern
    return np.sum(w * terrain[mask]) / np.sum(w)

sample_x = xs[400:3600:20]
true_local = np.interp(sample_x, xs, terrain)                 # what a lidar point reads
radar_seen = np.array([radar_reading(x0) for x0 in sample_x])  # what the radar footprint reads
diff = true_local - radar_seen
print("terrain relief a lidar resolves, RMS:", np.std(true_local), "m")
print("radar's footprint-averaged reading, RMS:", np.std(radar_seen), "m")
print("difference (relief the radar smooths away), RMS:", np.sqrt(np.mean(diff**2)), "m")
# terrain relief a lidar resolves, RMS: 1.159 m
# radar's footprint-averaged reading, RMS: 0.018 m
# difference (relief the radar smooths away), RMS: 1.146 m
```

The terrain itself varies by more than a metre RMS, over four metres peak to peak — exactly what a narrow lidar beam, sampled point by point, would reconstruct as a terrain map. The radar's footprint-averaged reading barely moves at all, RMS $0.018\,\mathrm{m}$, a factor of sixty-four flatter than the true relief: the $176\,\mathrm{m}$ footprint spans several full cycles of every roughness scale present, and averaging over many cycles of a periodic feature drives its contribution toward zero. A radar altimeter reports a number that is real and useful — the vehicle's height above the general terrain level — but it is not, and structurally cannot be, a measurement of the ground point directly underneath.
:::

## Slant range is not altitude

Both instruments measure range along the beam, which is *vertical altitude* only when the beam points straight down. A vehicle pitched or rolled by an angle $\theta$ from vertical returns a slant range $R_{\text{slant}}$ related to true altitude by simple trigonometry, $h = R_{\text{slant}}\cos\theta$ — the same projection that turns a hypotenuse into an adjacent side.

::: example What ignoring tilt costs
```python
import numpy as np

slant = 120.0   # m
for tilt_deg in (0, 10, 15, 25):
    alt = slant * np.cos(np.radians(tilt_deg))
    print(f"{tilt_deg:3d} deg tilt -> true altitude {alt:6.2f} m  (error if slant range used directly: {slant - alt:5.2f} m)")
# 0 deg tilt -> true altitude 120.00 m  (error if slant range used directly:  0.00 m)
# 10 deg tilt -> true altitude 118.18 m  (error if slant range used directly:  1.82 m)
# 15 deg tilt -> true altitude 115.91 m  (error if slant range used directly:  4.09 m)
# 25 deg tilt -> true altitude 108.76 m  (error if slant range used directly: 11.24 m)
```

A $25^\circ$ tilt — unremarkable during a landing's braking or translation phase, when the vehicle actively tips to redirect thrust horizontally — turns a $120\,\mathrm{m}$ slant range into a true altitude more than $11\,\mathrm{m}$ lower than the raw reading suggests, an error that grows with altitude itself and has nothing to do with the sensor's own precision. Every altimeter reading a guidance system uses has to be corrected by the attitude solution at the instant it was taken, which is exactly why this sensor never works alone: it needs the attitude this module's other instruments already supply.
:::

## Dust, and the harder problem of a plume

Rayleigh scattering explains why a radar altimeter tolerates ordinary atmospheric dust and cloud that would blind a lidar. Neither instrument gets the same reprieve from a landing engine's own exhaust plume in the final seconds before touchdown: a dense, often partially ionized cloud of combustion products and lofted surface material, thick enough that it can scatter and attenuate even a radar return, not only a lidar's. This is the sharpest edge of the ranging problem in this module — the measurement is most safety-critical in exactly the last few seconds and metres where the vehicle's own propulsion is actively degrading it — and it is a standing, unsolved-in-general operational risk rather than a limitation either wavelength choice fixes. Missions manage it by timing when each sensor's data is trusted, by descent profiles that keep the plume's interaction with the sensor's line of sight as short as possible, and by falling back, in the final phase, on inertial propagation alone when the ranging data itself becomes unreliable.

::: key Radar versus laser altimeter
Radar: centimetre-scale wavelength, penetrates dust and cloud and works in full daylight (Rayleigh scattering suppresses interaction with particles far smaller than the wavelength), but a wide beam averages terrain over a large footprint. Lidar: micron-scale wavelength, gives slant range at centimetre precision and, scanned or arrayed, a hazard map — but the wavelength is comparable to dust and cloud particle sizes (Mie scattering), so it is far more readily scattered by dust and by a landing plume.
:::

## Check yourself

::: check
A laser altimeter times its return to $200\,\mathrm{ps}$. What range resolution does that give, and how does it compare to a radar altimeter timing to $10\,\mathrm{ns}$?
:::

::: answer
$\sigma_R=c\sigma_{\Delta t}/2$, so $200\,\mathrm{ps}$ gives $\sigma_R=(3\times10^8)(200\times10^{-12})/2=0.03\,\mathrm{m}$, three centimetres, against $1.5\,\mathrm{m}$ for the radar's $10\,\mathrm{ns}$ timing — fifty times finer, consistent with why lidar reaches centimetre-level precision while a simple pulsed radar does not, quite apart from the much larger footprint-averaging effect that dominates the radar's error in practice.
:::

::: check
Explain, using the Rayleigh scattering result, why the *same* dust particle that a radar altimeter barely notices can still scatter a lidar strongly, without appealing to lidar power or radar power at all.
:::

::: answer
Scattering strength in the Rayleigh regime depends on the ratio of particle size to wavelength, not on the particle or the transmitted power alone. A given particle is many times smaller than a radar's centimetre wavelength, deep in the regime where the fourth-power Rayleigh law suppresses scattering by many orders of magnitude, but that same particle can be comparable to or larger than a lidar's micron wavelength, placing it in the Mie regime where scattering is strong. The particle has not changed; only its size relative to each instrument's own wavelength has, and that ratio alone decides which regime applies.
:::

::: check
A radar altimeter with a $15^\circ$ half-angle beam flies at $1000\,\mathrm{m}$ altitude over terrain with roughness features roughly $5\,\mathrm{m}$ across. Estimate the footprint diameter and state whether this radar is likely to resolve or average away that roughness.
:::

::: answer
The footprint radius is $1000\tan(15^\circ)=268\,\mathrm{m}$, a diameter of about $536\,\mathrm{m}$ — over a hundred times the $5\,\mathrm{m}$ roughness scale, so the footprint spans on the order of a hundred cycles of that roughness. Following this lesson's worked example, averaging over that many cycles of a small-scale feature drives its contribution toward zero, so this radar will report a smooth reading and will not resolve $5\,\mathrm{m}$-scale terrain features at all — a lidar with a metre-scale or smaller footprint would be needed for that.
:::

::: check
A lander's ranging sensor reads a slant range of $85\,\mathrm{m}$ while the vehicle is tilted $18^\circ$ from vertical during a translation manoeuvre. What is the true altitude, and by how much would guidance be wrong if the tilt correction were skipped?
:::

::: answer
$h=85\cos(18^\circ)=85\times0.9511=80.85\,\mathrm{m}$, so skipping the correction and using the raw slant range directly would overstate altitude by about $4.15\,\mathrm{m}$ — a guidance system commanding a burn timed off that number would start it late, closer to the ground than intended.
:::

::: check
In the footprint-averaging worked example, the radar's reading had an RMS of only $0.018\,\mathrm{m}$ even though the true terrain relief was over a metre RMS. Explain this factor-of-sixty difference in terms of spatial frequency rather than sensor noise.
:::

::: answer
The terrain's roughness features have wavelengths of a few to a few tens of metres, all much shorter than the roughly $176\,\mathrm{m}$ footprint diameter, so the footprint spans several full cycles of every roughness component present. Averaging a periodic signal over many of its own cycles drives the average toward the signal's mean, which is close to zero here since the relief was defined around zero — so the near-flat radar reading is not evidence of a smooth sensor or low noise, it is the direct arithmetic consequence of spatial averaging over many wavelengths of real terrain structure the instrument never resolved in the first place.
:::

::: check
Why is the final phase of a powered landing the hardest for both radar and lidar altimeters, given everything this lesson has established about why each tolerates or fails to tolerate obscurants?
:::

::: answer
Radar's advantage over lidar rests on ordinary atmospheric dust and cloud particles being far smaller than its wavelength, deep in the Rayleigh regime; a landing engine's plume in the final seconds is a much denser, often partially ionized cloud of combustion products and lofted surface debris that can be thick and energetic enough to scatter and attenuate even a radar return, not only degrade a lidar's. Both instruments lose the specific physical advantage that protects them from ordinary dust at exactly the moment — final approach to touchdown — when a wrong or missing range reading is least recoverable, which is why missions manage this phase by timing, descent-profile design, and inertial fallback rather than by trusting either sensor to simply keep working through it.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $R=c\,\Delta t/2$, $\sigma_R=c\,\sigma_{\Delta t}/2$ | Time-of-flight range and how timing precision sets range precision |
| FMCW | Frequency-modulated continuous-wave radar; range and range-rate from one beat-frequency measurement |
| Rayleigh regime (particle $\ll\lambda$) vs Mie regime (particle $\sim\lambda$) | Why radar penetrates dust and cloud (scattering $\propto(\text{particle}/\lambda)^4$) and lidar does not |
| Beam width $\sim1/(\text{aperture in wavelengths})$ | Radar beams tens of degrees wide; lidar beams a milliradian or less |
| Footprint radius $=h\tan(\text{half-angle})$ | Sets what a radar averages over; $176\,\mathrm{m}$ diameter at $500\,\mathrm{m}$, $10^\circ$ half-angle |
| $h=R_{\text{slant}}\cos\theta$ | True altitude from slant range; needs the vehicle's own attitude to correct |
| Landing plume | Denser and more energetic than ordinary dust; can degrade radar as well as lidar in the final phase |

Radar and lidar altimeters answer "how far to the ground, straight down." The next lesson turns the same time-of-flight idea, and a great deal more geometry, toward a camera instead — a sensor that answers a different question about the same kind of target, not how far away it is but where, in angle, it sits in the frame, and what a single such measurement can and cannot determine about position.
