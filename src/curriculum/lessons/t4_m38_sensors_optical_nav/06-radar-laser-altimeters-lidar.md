---
id: l06-radar-laser-altimeters-lidar
title: Radar altimeters, laser altimeters and lidar
minutes: 20
covers:
  - Radar altimeters, laser altimeters and lidar
---

Shout toward a cliff and count until the echo comes back. The longer the wait, the farther the cliff. Sound goes about $340$ meters every second, so a two-second echo means the sound traveled about $680\,\mathrm{m}$ in total, there and back. The cliff is half that, $340\,\mathrm{m}$ away. Bats and ships' depth sounders use exactly this trick.

A **radar altimeter** does the same with radio waves, and a **laser altimeter** does it with pulses of laser light. Both send a signal at the ground and time the echo. Every other sensor in this module so far measured a *direction*: to a star, to the Sun, along the magnetic field, toward nadir. These measure a *distance*. During a landing that is the number that matters most. Knowing which way is down is not enough; you need to know how far down.

A laser that sweeps its beam across a scene and builds a 3-D picture from many distances is called **lidar** ("light detection and ranging"). Radar and lidar share one idea, timing an echo, and differ in almost everything else. Nearly all of that difference comes from one number: the **wavelength**, the length of one wave of the signal. This lesson works out both sides of that trade with real numbers, and then shows why a range is not the same thing as an altitude.

## Time of flight: the idea both share

Send a pulse. It travels to the ground at the speed of light, $c \approx 3\times10^8\,\mathrm{m/s}$, bounces, and comes back. If the ground is a distance $R$ away along the beam (the **range**), the round trip covers $2R$ and takes $\Delta t = 2R/c$. Solve for $R$:

$$
R = \frac{c\,\Delta t}{2}.
$$

The $2$ is there because the signal goes out *and* back. Forgetting it doubles every range.

How precise is it? Any error in the timing becomes an error in range by the same rule:

$$
\sigma_R = \frac{c\,\sigma_{\Delta t}}{2},
$$

where $\sigma$ (Greek "sigma") means the size of the typical error. Light is fast, so timing has to be very fine. Timing good to one **nanosecond** (a billionth of a second) gives $(3\times10^8)(10^{-9})/2 = 0.15\,\mathrm{m}$. Timing good only to $10\,\mathrm{ns}$ gives $1.5\,\mathrm{m}$. A useful rule: light goes about **[[30 centimeters per nanosecond|light-per-nanosecond]]**.

Many radar altimeters do not send separate pulses. Instead they send a continuous tone whose pitch sweeps steadily upward, called **[[FMCW|fmcw]]** (frequency-modulated continuous wave). The echo comes back with the pitch it had a moment ago, so it is slightly lower than what is being sent now. Mixing the two gives a **beat frequency** proportional to the delay, and so to the range. The same echo also carries a **[[Doppler shift|doppler]]**, a pitch change from the vehicle's motion toward the ground. So one measurement gives both range and the rate the range is changing.

## Why wavelength decides almost everything

A radar altimeter uses radio waves a few gigahertz to a few tens of gigahertz in frequency. That is a wavelength of about $1$ to $10\,\mathrm{cm}$. A lidar uses light with a wavelength near $1\,\mathrm{\mu m}$, a micrometer. So the radar's waves are roughly ten thousand to a hundred thousand times longer. That gap decides two things: what gets in the way, and how narrow the beam can be.

### What gets in the way: dust and cloud

Think of ocean waves rolling past a post sticking out of the water. A thin post barely disturbs a long wave; the wave rolls right past it. A big breakwater stops the wave cold. What matters is the size of the object compared with the wavelength.

Light and radio behave the same way. When a particle is much *smaller* than the wavelength, it hardly scatters at all. This is **[[Rayleigh scattering|rayleigh]]**. In this regime, how strongly a particle scatters, compared with how much it would block just by its size, grows like the fourth power of (particle size ÷ wavelength). Make the particle ten times smaller compared with the wave, and it scatters $10^4 = 10{,}000$ times less.

When a particle is about as big as the wavelength, or bigger, that suppression is gone. This is the **[[Mie regime|mie]]**. Each particle then blocks and scatters light about as much as its own size suggests, like a real breakwater.

::: example How much better radar gets through dust
Take a typical dust grain or cloud droplet $20\,\mathrm{\mu m}$ across. Compare it with a $3\,\mathrm{cm}$ radar wave and a $1\,\mathrm{\mu m}$ lidar wave.

```python
particle = 20e-6                      # m
lam_radar, lam_lidar = 0.03, 1.0e-6   # m

ratio_radar = particle / lam_radar
ratio_lidar = particle / lam_lidar
print(f"radar: particle/wavelength = {ratio_radar:.3g}   ratio^4 = {ratio_radar**4:.3g}")
print(f"lidar: particle/wavelength = {ratio_lidar:.3g}")
# radar: particle/wavelength = 0.000667   ratio^4 = 1.98e-13
# lidar: particle/wavelength = 20
```

**For the radar**, the grain is $0.03 / (20\times10^{-6}) = 1500$ times smaller than the wave. Raise the ratio to the fourth power: about $2\times10^{-13}$. The grain scatters about thirteen powers of ten less than its size alone would suggest. A dust cloud thick enough to hide the ground from your eyes is nearly clear to a radar.

**For the lidar**, the same grain is $20$ times *bigger* than the wave. There is no suppression at all: the grain is in the Mie regime and blocks light by its full size.

Sanity check: this is why you cannot see through fog, but a phone still gets a signal inside it. The grain did not change. Only its size compared with each wavelength did, and that ratio alone decides which regime applies.
:::

Sunlight is a second difference. A lidar's receiver looks for a faint flash of light, and in daylight the sunlit ground is also sending light back toward it. That background adds noise, so lidars use narrow color filters to fight it. Radio receivers do not see sunlight at all, so a radar works the same by day and by night.

### How narrow the beam can be

Now the other side of the trade. Any beam spreads out as it travels, by **[[diffraction|diffraction]]**. The spread angle, in radians, is roughly the wavelength divided by the size of the antenna or lens:

$$
\text{beam angle} \approx \frac{\lambda}{D},
$$

where $\lambda$ (Greek "lambda") is the wavelength and $D$ is the aperture, the width of the antenna or lens. A $3\,\mathrm{cm}$ radar wave from a $20\,\mathrm{cm}$ antenna spreads by about $0.03/0.2 = 0.15\,\mathrm{rad}$, around $8.6^\circ$. A $1\,\mathrm{\mu m}$ laser from a $1\,\mathrm{cm}$ lens spreads by only about $10^{-4}\,\mathrm{rad}$. Radar altimeter beams are commonly tens of degrees wide. Lidar beams are a milliradian or narrower.

The patch of ground the beam lights up is its **footprint**. For a beam pointing straight down from height $h$ with half-angle $\alpha$ ("alpha"), the footprint's radius is $h\tan\alpha$.

::: example What each beam lights up on the ground
Compare a radar with a $10^\circ$ half-angle and a lidar with a $1\,\mathrm{mrad}$ half-angle ($0.001$ radians, about $0.057^\circ$).

```python
import numpy as np

for h in (2000.0, 500.0, 30.0):
    r_radar = h * np.tan(np.radians(10.0))     # 10 deg half-angle radar beam
    r_lidar = h * np.tan(0.001)                # 1 mrad half-angle lidar beam
    print(f"h = {h:6.0f} m   radar footprint radius = {r_radar:6.1f} m   lidar = {r_lidar:.3f} m")
# h =   2000 m   radar footprint radius =  352.7 m   lidar = 2.000 m
# h =    500 m   radar footprint radius =   88.2 m   lidar = 0.500 m
# h =     30 m   radar footprint radius =    5.3 m   lidar = 0.030 m
```

At $500\,\mathrm{m}$ the radar lights a patch about $176\,\mathrm{m}$ across, longer than a football field. The lidar lights a spot $1\,\mathrm{m}$ across. Everything inside a footprint adds to the echo.

What does that cost the radar? Build a made-up strip of ground: a gentle rolling surface with bumps at three sizes ($40$, $12$ and $4\,\mathrm{m}$ from crest to crest) plus a little noise. A lidar reads the height at one point. The radar reads a weighted average over its whole footprint, heaviest at the center, the way a real antenna's beam is strongest in the middle.

```python
import numpy as np

rng = np.random.default_rng(4)
xs = np.linspace(0, 500, 4000)                         # 500 m of ground
terrain = np.zeros_like(xs)
for amp, wavelength, phase in [(1.5, 40.0, 0.3), (0.6, 12.0, 1.7), (0.25, 4.0, 0.9)]:
    terrain += amp * np.sin(2 * np.pi * xs / wavelength + phase)
terrain += rng.normal(0, 0.05, xs.shape)

def radar_reading(x0, h=500.0, half_angle_deg=10.0):
    r = h * np.tan(np.radians(half_angle_deg))
    mask = np.abs(xs - x0) <= r
    w = np.exp(-0.5 * ((xs[mask] - x0) / (r / 2)) ** 2)   # beam strongest at the center
    return np.sum(w * terrain[mask]) / np.sum(w)

sample_x = xs[400:3600:20]
lidar_seen = np.interp(sample_x, xs, terrain)             # one point per reading
radar_seen = np.array([radar_reading(x0) for x0 in sample_x])
print(f"relief the lidar sees, RMS:   {np.std(lidar_seen):.3f} m")
print(f"relief the radar sees, RMS:   {np.std(radar_seen):.3f} m")
print(f"ratio: {np.std(lidar_seen) / np.std(radar_seen):.0f}")
# relief the lidar sees, RMS:   1.159 m
# relief the radar sees, RMS:   0.018 m
# ratio: 64
```

(RMS, "root mean square", is a typical size of the ups and downs.) The ground really does go up and down by more than a meter, and a lidar sees that. The radar's reading barely moves: $0.018\,\mathrm{m}$, about $64$ times flatter. Its footprint spans many crests and troughs of every bump size, and averaging over many ups and downs cancels them out.

So a radar altimeter reports something real and useful: the vehicle's height above the *general* ground level. It does not, and cannot, report the height of the one spot directly below. For choosing a safe landing spot among boulders, you need the lidar.
:::

::: key Radar versus laser altimeter
Radar: long range, works through dust and in daylight, wide beam so it averages terrain. Lidar: narrow beam, centimeter precision, gives slant range and can build a hazard map — but it is scattered by dust and plume.
:::

The reasons behind each word of that card: the radar's centimeter wavelength puts dust in the Rayleigh regime, and sunlight is not noise to it. Its wide beam catches plenty of ground even from high up and even when the vehicle tilts, which is part of why radar altimeters lock on from many kilometers up. The lidar's micrometer wavelength gives a narrow beam and very fine timing, but puts dust in the Mie regime.

## Slant range is not altitude

Both instruments measure distance *along the beam*. That equals the vehicle's height only when the beam points straight down.

Picture a ladder leaning against a wall. The ladder is longer than the height it reaches, because it leans. A tilted beam is the ladder: its length is the **slant range** $R_{\text{slant}}$. The height is the side of the triangle next to the tilt angle $\theta$ ("theta"), measured from straight down. So

$$
h = R_{\text{slant}}\cos\theta.
$$

This assumes flat ground under the beam, which is the right first model for a landing site.

::: example What ignoring tilt costs
A lander's altimeter reads a slant range of $120\,\mathrm{m}$. Find the true height at several tilt angles.

```python
import numpy as np

slant = 120.0   # m
for tilt_deg in (0, 10, 15, 25):
    alt = slant * np.cos(np.radians(tilt_deg))
    print(f"{tilt_deg:2d} deg tilt: true altitude {alt:6.2f} m, error if slant used: {slant - alt:5.2f} m")
#  0 deg tilt: true altitude 120.00 m, error if slant used:  0.00 m
# 10 deg tilt: true altitude 118.18 m, error if slant used:  1.82 m
# 15 deg tilt: true altitude 115.91 m, error if slant used:  4.09 m
# 25 deg tilt: true altitude 108.76 m, error if slant used: 11.24 m
```

Take the $25^\circ$ row by hand: $\cos 25^\circ = 0.9063$, and $120 \times 0.9063 = 108.76\,\mathrm{m}$. The raw reading overstates the height by more than $11\,\mathrm{m}$.

A $25^\circ$ tilt is ordinary during a landing, when the vehicle tips over to push itself sideways. The error has nothing to do with how good the sensor is, and it grows with height. Sanity check: at zero tilt the error is zero, and it grows as the beam leans more, as the ladder picture says it should.
:::

::: warning An altimeter never works alone
Every altimeter reading must be corrected with the vehicle's attitude *at the moment it was taken*. A reading paired with an old attitude, or with no attitude, is a slant range pretending to be a height. That is why altimeters sit inside a navigation filter together with the attitude sensors from earlier in this module, never on their own.
:::

## The hardest moment: the plume

Radar shrugs off ordinary dust and cloud. But in the last seconds before touchdown, the landing engine itself makes trouble. Its **[[exhaust plume|plume]]** is hot gas, which can weaken radio signals, and it blasts dust and small rocks off the ground into a thick cloud right under the vehicle. That cloud can scatter and weaken even a radar echo, not only a lidar's.

So the measurement is most needed in exactly the seconds when the vehicle's own engine is spoiling it. No choice of wavelength fixes that. Missions manage it instead. They decide in advance when each sensor's data is trusted. They shape the descent so the plume crosses the sensor's line of sight as briefly as possible. And in the final meters they often stop using the altimeter and carry on with the inertial measurement unit, which needs nothing from outside.

## Check yourself

::: check
A laser altimeter times its echoes to $200\,\mathrm{ps}$ (picoseconds, trillionths of a second). What range precision does that give? How does it compare with a radar timing to $10\,\mathrm{ns}$?
:::

::: answer
Use $\sigma_R = c\,\sigma_{\Delta t}/2$. For the laser, $(3\times10^8)(200\times10^{-12})/2 = 0.03\,\mathrm{m}$: three centimeters. For the radar, $(3\times10^8)(10\times10^{-9})/2 = 1.5\,\mathrm{m}$. The laser is $1.5/0.03 = 50$ times finer. That is why lidar reaches centimeter precision. In practice the radar's error is usually dominated by footprint averaging anyway, not by its timing.
:::

::: check
Explain why the *same* dust grain that a radar hardly notices can scatter a lidar strongly. Do not mention transmitter power.
:::

::: answer
How strongly a grain scatters depends on its size *compared with the wavelength*. The grain is far smaller than the radar's centimeter wave, so it is deep in the Rayleigh regime, where scattering falls with the fourth power of (size ÷ wavelength), a huge suppression. The same grain is larger than the lidar's micrometer wave, so it is in the Mie regime, where there is no such suppression and it blocks light by its full size. The grain is the same in both cases; only the ratio changes, and the ratio alone decides.
:::

::: check
A radar altimeter with a $15^\circ$ half-angle beam flies $1000\,\mathrm{m}$ up, over ground with bumps about $5\,\mathrm{m}$ across. How wide is its footprint? Will it see the bumps?
:::

::: answer
The footprint radius is $1000\tan 15^\circ = 1000 \times 0.26795 = 267.95\,\mathrm{m}$, so the footprint is about $536\,\mathrm{m}$ across. That is more than a hundred times the size of a bump, so the footprint covers on the order of a hundred of them. Averaging over that many ups and downs cancels them, as in the worked example. The radar will report a smooth reading and will not see the $5\,\mathrm{m}$ bumps. You would need a lidar with a footprint of a meter or less.
:::

::: check
A lander's altimeter reads a slant range of $85\,\mathrm{m}$ while the vehicle is tilted $18^\circ$ from vertical. What is its true height? What goes wrong if the tilt correction is skipped?
:::

::: answer
$h = 85\cos 18^\circ = 85 \times 0.9511 = 80.84\,\mathrm{m}$. Using the raw $85\,\mathrm{m}$ would overstate the height by about $85 - 80.84 = 4.16\,\mathrm{m}$. Guidance would believe it has more room than it does, and a braking burn timed from that number would start late, closer to the ground than planned.
:::

::: check
In the footprint example, the radar's reading moved by only $0.018\,\mathrm{m}$ RMS while the ground moved by more than a meter. A friend says the radar must just be very low-noise. What is really going on?
:::

::: answer
It has nothing to do with sensor noise. All the bumps in the made-up ground were $4$ to $40\,\mathrm{m}$ from crest to crest, much smaller than the radar's $176\,\mathrm{m}$ footprint. So each reading averages over many crests and troughs of every bump size, and the ups cancel the downs. The average comes out close to the mean ground level every time. The flat reading shows detail the radar never resolved, not a quiet sensor.
:::

::: check
Why is the last phase of a powered landing the hardest time for *both* radar and lidar?
:::

::: answer
The radar's advantage comes from ordinary dust and cloud particles being far smaller than its wavelength. The landing engine's plume is something else: hot exhaust gas that can weaken radio signals, plus a dense cloud of dust and rock blasted up right under the vehicle. That can spoil a radar echo as well as a lidar's. So both sensors lose their protection in the very seconds when a wrong range is hardest to recover from. Missions handle it with planned trust windows, a descent path that keeps the plume out of the beam, and a switch to inertial navigation for the final meters.
:::

## Summary

| Symbol or idea | Meaning |
| --- | --- |
| $R=c\,\Delta t/2$ | Range from the round-trip time of an echo |
| $\sigma_R=c\,\sigma_{\Delta t}/2$ | Timing precision sets range precision; about $0.15\,\mathrm{m}$ per nanosecond |
| FMCW | Swept-pitch radar: beat frequency gives range, Doppler gives range rate |
| Rayleigh regime, particle much smaller than $\lambda$ | Scattering suppressed as (size ÷ wavelength)$^4$: why radar sees through dust |
| Mie regime, particle about $\lambda$ or larger | No suppression: why dust and plume scatter lidar |
| Beam angle $\approx\lambda/D$ | Radar beams tens of degrees; lidar a milliradian or less |
| Footprint radius $=h\tan\alpha$ | $176\,\mathrm{m}$ across for a $10^\circ$ radar at $500\,\mathrm{m}$; the radar averages over it |
| $h=R_{\text{slant}}\cos\theta$ | True height from slant range; needs the attitude at that instant |
| Landing plume | Can blind both sensors in the last seconds; handled by planning and inertial fallback |

An altimeter tells you how far away the ground is, but not where things are within it. The next lesson turns to the camera, which measures the opposite: exactly where, in angle, each point sits in the picture, and nothing about how far away it is.

::: context light-per-nanosecond A foot per nanosecond
Light covers $299{,}792{,}458$ meters every second. Divide by a billion: about $0.30\,\mathrm{m}$ in one nanosecond, close to one foot. Because the echo goes out and back, each nanosecond of timing is worth half that in range, $15\,\mathrm{cm}$. Computer engineers meet the same number: in a nanosecond, a signal crosses only part of a circuit board, which is why fast chips care about wire length.
:::

::: context fmcw Ranging with a rising tone
The radar sends a tone whose frequency climbs steadily. The echo is a copy delayed by the round-trip time, so at any moment it is a little lower than what is being sent. The gap between the two lines is the beat frequency.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="340" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="150" x2="40" y2="20" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="300" y="168" font-size="12" fill="#1f2a44">time</text>
  <text x="46" y="28" font-size="12" fill="#1f2a44">frequency</text>
  <line x1="60" y1="140" x2="300" y2="40" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="110" y1="140" x2="330" y2="48.3" stroke="#b4232c" stroke-width="2.5"/>
  <text x="170" y="84" font-size="12" fill="#1d6fd1">sent</text>
  <text x="238" y="112" font-size="12" fill="#b4232c">echo</text>
  <line x1="60" y1="146" x2="110" y2="146" stroke="#6c7a93" stroke-width="1.2"/>
  <text x="62" y="140" font-size="11" fill="#6c7a93">delay</text>
  <line x1="240" y1="65" x2="240" y2="85.8" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="246" y="72" font-size="11" fill="#1f2a44">beat</text>
</svg>
```

With a sweep of $100\,\mathrm{MHz}$ per millisecond and ground $500\,\mathrm{m}$ away, the delay is about $3.33\,\mathrm{\mu s}$ and the beat is about $333\,\mathrm{kHz}$, easy to measure precisely.
:::

::: context doppler The pitch of a passing siren
An ambulance siren sounds higher as it comes toward you and lower as it goes away. The waves bunch up ahead of a moving source and stretch out behind it. A radar echo from ground that the vehicle is falling toward comes back at a slightly higher frequency, and the size of the shift tells the rate at which the range is shrinking. Landing radars on Mars rovers used this to measure how fast they were moving, not just how high they were.
:::

::: context rayleigh Why the sky is blue
The same fourth-power law paints the sky. Air molecules are far smaller than the wavelength of visible light, so they scatter in the Rayleigh regime. Blue light has a shorter wavelength than red, so the ratio (size ÷ wavelength) is bigger for blue, and blue is scattered several times more strongly. Look anywhere away from the Sun and you see that scattered blue. A radar wave is so long that even a dust grain acts like a tiny molecule to it.
:::

::: context mie Why clouds are white
Cloud droplets are ten or more times bigger than the wavelength of visible light. In this regime a droplet scatters all colors about equally, so a cloud looks white instead of blue. It also scatters them strongly: a cloud a few hundred meters thick is opaque. The regime is named for Gustav Mie, who worked out the full theory of light scattering by spheres in 1908.
:::

::: context diffraction Why a small dish makes a wide beam
Every wave spreads as it leaves an opening. Push ripples through a narrow gap in a pond and they fan out in a half circle; through a wide gap they go on nearly straight. What counts is the gap measured in wavelengths. A lidar lens a centimeter wide is ten thousand light-wavelengths across, so its beam barely spreads. A radar dish must be many wavelengths wide to make a narrow beam, and a centimeter-wave radar small enough to fit on a lander is only a few wavelengths wide.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <rect x="160" y="14" width="40" height="18" rx="3" fill="#6c7a93" stroke="#1f2a44" stroke-width="1.2"/>
  <text x="208" y="28" font-size="12" fill="#1f2a44">lander</text>
  <polygon points="180,32 90.4,160 269.6,160" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="180" y1="32" x2="180" y2="160" stroke="#b4232c" stroke-width="2"/>
  <line x1="40" y1="160" x2="320" y2="160" stroke="#1f2a44" stroke-width="2"/>
  <text x="96" y="178" font-size="12" fill="#1d6fd1">radar footprint: wide</text>
  <text x="188" y="100" font-size="12" fill="#b4232c">lidar: a thin line</text>
</svg>
```

The radar cone here is drawn with a $35^\circ$ half-angle, wider than the lesson's example, so both beams fit in one picture.
:::

::: context plume What landing pilots saw
Apollo astronauts described blowing dust hiding the Moon's surface in the last tens of meters before touchdown; some said the ground seemed to vanish under a sheet of moving dust. The same effect on Mars and the Moon is a main reason modern landers plan exactly when their altimeters can be trusted, and it comes back when this module reaches hazard detection, where a lidar builds a map of rocks and slopes before the plume arrives.
:::
