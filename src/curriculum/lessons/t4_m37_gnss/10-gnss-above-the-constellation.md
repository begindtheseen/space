---
id: l10-gnss-above-the-constellation
title: GNSS above the constellation
minutes: 21
covers:
  - "Space-based GNSS: use above the constellation, side-lobe reception, high-dynamics tracking, Doppler"
---

Picture a road at night lined with streetlights. Every lamp is built to throw its light *down*, onto the road. Walk along the sidewalk and you are bathed in light. Now float above the lamps in a hot-air balloon. The bright pools of light are all below you, pointing away. What reaches you is the faint glow that leaks sideways out of each lamp, plus a little light from lamps far away whose beams happen to skim past at just the right angle.

That balloon is where a spacecraft sits when it flies higher than the GPS satellites. Every lesson so far assumed a receiver *below* the constellation, looking up at satellites about $20{,}000\,\mathrm{km}$ overhead through a half-dome of open sky. A satellite in a **[[geostationary transfer orbit|gto]]**, a weather satellite parked at geostationary height, or a probe on its way to the Moon is not in that situation at all. It can be as far from Earth as the GPS satellites are, or farther. The constellation is no longer overhead. It is scattered all around, partly hidden behind Earth, and it shines in directions its designers never cared about.

Using GNSS this way is called **space-based GNSS**: navigating a spacecraft with the same GPS (and Galileo, and other) signals a phone uses, from a place the signals were never aimed at. This lesson works out four things that change up there: which satellites you can see at all, how weak they are, how fast their Doppler moves, and what all of that does to finding a signal again after losing it.

## Which satellites can you see at all?

Start with the simplest question. From a given spot in space, which GPS satellites have a clear straight line to you, with Earth not in the way? A satellite hidden behind Earth is **occulted** — blocked by a body in between, the way the Moon blocks the Sun in an eclipse.

On the ground, Earth blocks half of everything: the whole sky below your horizon. Higher up, Earth shrinks. From a distance $r$ from Earth's center (read $r$ as "r", the distance), the Earth's disk looks like a circle whose edge is an angle $\arcsin(R_E/r)$ away from its center, where $R_E = 6378\,\mathrm{km}$ is Earth's radius. ("arcsine" is the inverse sine from the trigonometry module: the angle whose sine is $R_E/r$.) From GPS height, $r = 26{,}560\,\mathrm{km}$, that half-angle is $13.9^\circ$. From geostationary height, $r = 42{,}164\,\mathrm{km}$, it is only $8.7^\circ$. So from up there, **[[Earth is a small obstacle|earth-shrinks]]**.

To see what that means for real satellites, build a model constellation and count. The model has six orbit planes with four satellites each, tilted $55^\circ$ to the equator, at GPS's own orbit radius. It is a simple **[[Walker-style constellation|walker]]**, spread out so no two satellites sit on top of each other. Put the user at geostationary distance, $42{,}164\,\mathrm{km}$ from Earth's center, and test each satellite: does the straight line from user to satellite pass through Earth?

```python
import numpy as np

R_E, a_gps = 6378e3, 26560e3


def walker_constellation(n_planes=6, n_per_plane=4, inc_deg=55.0, a=a_gps, phase_step_deg=15.0):
    inc = np.radians(inc_deg)
    sats = []
    for p in range(n_planes):
        RAAN = np.radians(p * 60.0)
        offset = np.radians(p * phase_step_deg)
        Rz = np.array([[np.cos(RAAN), -np.sin(RAAN), 0], [np.sin(RAAN), np.cos(RAAN), 0], [0, 0, 1]])
        Rx = np.array([[1, 0, 0], [0, np.cos(inc), -np.sin(inc)], [0, np.sin(inc), np.cos(inc)]])
        for k in range(n_per_plane):
            u = np.radians(k * 90.0) + offset
            r_pf = a * np.array([np.cos(u), np.sin(u), 0.0])
            sats.append(Rz @ Rx @ r_pf)
    return np.array(sats)


def occulted(user, sat, R_E=R_E):
    d = sat - user
    t_star = np.clip(-np.dot(user, d) / np.dot(d, d), 0.0, 1.0)   # closest approach to Earth's center
    return np.linalg.norm(user + t_star * d) < R_E                # blocked if that point is inside Earth


sats = walker_constellation()
user = np.array([42164e3, 0.0, 0.0])
visible = np.array([s for s in sats if not occulted(user, s)])
print("visible:", len(visible), "of", len(sats))
# visible: 23 of 24
```

The test finds the point on the line that comes closest to Earth's center. If that point is inside Earth, the satellite is blocked. Only one of the twenty-four is. Almost the whole constellation is in plain view.

::: note Why the Earth's disk shrinks with distance
Stand at distance $r$ from Earth's center and draw a line that just grazes Earth's edge. That grazing line, the radius to the grazing point, and the line to Earth's center make a right triangle: the radius $R_E$ meets the grazing line at a right angle. In that triangle the side opposite your viewing angle is $R_E$ and the longest side is $r$, so the sine of the angle is $R_E/r$. The angle from Earth's center to its edge is therefore $\arcsin(R_E/r)$, and the whole disk is twice that wide. As $r$ grows, $R_E/r$ falls, and so does the angle: $13.9^\circ$ at GPS height ($27.8^\circ$ across) and $8.7^\circ$ at geostationary height ($17.4^\circ$ across).
:::

## Main lobe and side lobes

Being visible is not the same as being *usable*. A GPS satellite's antenna is not a bare light bulb shining equally everywhere. It is built like a flashlight, to throw its power at one target: the Earth below it. The strong central cone of its pattern is the **main lobe** (or main beam). Around it, every real antenna also leaks weaker rings of power in other directions, called **[[side lobes|side-lobes]]**. They are a side effect of how antennas work, and designers try to keep them small.

From GPS height, Earth fills a cone of half-angle $13.9^\circ$, so the main beam is shaped to cover that with some margin. Now think about where a user above the constellation sits. A GPS satellite on the *near* side of Earth, between you and Earth, points its main beam away from you, down at Earth. A satellite on the *far* side points its main beam toward Earth and, beyond Earth, roughly toward you — but Earth sits right in the middle of that beam. Only the **[[outer rim of the beam|rim]]**, the part that skims past Earth's edge, can reach you. In short: **above about $3000\,\mathrm{km}$, the Earth blocks the main lobes**, and most of what you can hear comes from side lobes.

To count this for the model constellation, take each visible satellite and measure the angle between two directions: straight down to Earth (where its main beam points, called **nadir**) and the direction to the user. Call a satellite "main lobe" if that angle is $30^\circ$ or less. That $30^\circ$ is a rough, generous stand-in for the edge of the real main beam, a bit wider than the bare $13.9^\circ$ Earth angle, in the spirit of the margin designers build in.

```python
main_lobe, side_lobe = [], []
for s in visible:
    nadir = -s / np.linalg.norm(s)
    to_user = (user - s) / np.linalg.norm(user - s)
    ang = np.degrees(np.arccos(np.clip(np.dot(nadir, to_user), -1, 1)))
    (main_lobe if ang <= 30.0 else side_lobe).append(s)
print("main-lobe-illuminated (<=30 deg):", len(main_lobe), " side-lobe:", len(side_lobe))
# main-lobe-illuminated (<=30 deg): 4  side-lobe: 19
```

Only $4$ of the $23$ visible satellites reach the user with their main beam. The other $19$ reach it only through side lobes. Those are, by design, about $15$ to $20\,\mathrm{dB}$ weaker than the main beam. A **[[decibel|decibels]]** difference of $20\,\mathrm{dB}$ means a power ratio of $100$, and $15\,\mathrm{dB}$ means about $32$. So a side-lobe signal can be a hundredth of the power a main-lobe signal would bring.

::: key
GNSS above the constellation: above about $3000\,\mathrm{km}$ the Earth blocks the main lobes, so you fly on side lobes — roughly $15$–$20\,\mathrm{dB}$ weaker, sparse geometry, and terrible DOP. It works up to and beyond GEO with a high-sensitivity receiver and long integration, and has been demonstrated near lunar distance.
:::

Why put up with such weak signals? Why not use the four strong ones and ignore the rest? The next example answers that with numbers.

::: example Why a high-sensitivity receiver needs the side lobes
Compute the dilution of precision exactly as the DOP lesson defined it, once for the four main-lobe satellites alone and once for all twenty-three visible satellites.

```python
def dop(sats, user):
    e = (sats - user) / np.linalg.norm(sats - user, axis=1)[:, None]
    G = np.column_stack([-e, np.ones(len(sats))])
    Q = np.linalg.inv(G.T @ G)
    return np.sqrt(np.trace(Q)), np.sqrt(Q[0, 0] + Q[1, 1] + Q[2, 2])

gdop_all, pdop_all = dop(visible, user)
gdop_main, pdop_main = dop(np.array(main_lobe), user)
print(f"all 23 visible: PDOP={pdop_all:.2f}, GDOP={gdop_all:.2f}")
print(f"main-lobe-only 4: PDOP={pdop_main:.2f}, GDOP={gdop_main:.2f}")
# all 23 visible: PDOP=2.97, GDOP=3.86
# main-lobe-only 4: PDOP=253.26, GDOP=349.95
```

**Main lobes only.** PDOP is $253$. That is more than seven times worse than the deliberately bunched-up "bad" ground geometry in the DOP lesson, which had a PDOP of $34.3$. The reason is where those four satellites sit: all on the far side of Earth, all roughly in the same direction from the user. Their lines of sight are nearly parallel, which is about the worst spread four satellites can have. With a $3\,\mathrm{m}$ range error, a PDOP of $253$ means position errors of the order of $760\,\mathrm{m}$.

**All visible satellites.** PDOP drops to $2.97$, as good as the well-spread ground constellation in the DOP lesson.

**Sanity check.** DOP depends only on directions, never on signal strength. Adding satellites from new directions must help, and here it helps enormously. So the side lobes are not a backup for when the main lobes fall short. For a user above the constellation, the side lobes *are* the geometry. A receiver that cannot track signals far weaker than a ground receiver would ever accept does not get a slightly worse fix. For most of its orbit, it gets no fix at all.
:::

### The near–far problem comes back

Up there the distances to the satellites also spread out much more than on the ground. In the model, the nearest visible satellite is $15{,}604\,\mathrm{km}$ away and the farthest is $63{,}773\,\mathrm{km}$, about $4.1$ times farther. Received power falls with the square of distance, so that alone costs

$$
20\log_{10}\!\left(\frac{63{,}773}{15{,}604}\right) = 12.2\,\mathrm{dB}
$$

of difference between the strongest and weakest signals. Stack the main-lobe versus side-lobe gap on top, and the weakest usable satellite can be $30\,\mathrm{dB}$ or more below the strongest.

The constellation lesson showed that the Gold codes keep one satellite's leftover signal (its cross-correlation) about $24\,\mathrm{dB}$ below its own peak. That is plenty on the ground, where all satellites arrive within a few decibels of each other. It is not plenty here. A strong, near, main-lobe satellite's leftover can be bigger than a far side-lobe satellite's true peak. This is the **[[near–far problem|near-far]]**, and above the constellation it is routine. So a space receiver checks every "found it!" against the satellite and Doppler it expected to find, instead of trusting the biggest peak in its search.

## Hearing a whisper: sensitivity and long integration

How does a receiver hear signals $15$ to $20\,\mathrm{dB}$ weaker than normal? It listens longer. The receiver finds a signal by multiplying the incoming samples by its own copy of the code and adding up the result. That sum is called **integration**. Adding up for a time $T$ makes the true signal build up steadily, while random noise partly cancels itself. Double the time and the signal-to-noise ratio of the sum improves by a factor of two, which is $10\log_{10}(2) = 3.01$ decibels.

A ground receiver often integrates for $1\,\mathrm{ms}$, one repeat of the C/A code. Integrating for $20\,\mathrm{ms}$ instead gains

$$
10\log_{10}\!\left(\frac{20}{1}\right) = 13.0\,\mathrm{dB},
$$

most of the side-lobe penalty. Going past $20\,\mathrm{ms}$ in one straight sum runs into the **[[navigation message bits|data-bits]]**, which can flip the signal's sign every $20\,\mathrm{ms}$. Receivers get around that by adding up the *power* of many $20\,\mathrm{ms}$ sums, which gains less per doubling, or by knowing the data bits in advance. A receiver built this way is called **high-sensitivity**. It is the key tool for GNSS in high orbits.

Listening longer has a price, and it matters in the last section. A longer sum is also pickier about frequency. If the receiver's guess of the Doppler is off, the signal drifts out of step with the copy during the sum and cancels itself. Roughly, a sum of length $T$ can only tolerate a frequency error of about $1/(2T)$. For $T = 1\,\mathrm{ms}$ that is $500\,\mathrm{Hz}$. For $T = 20\,\mathrm{ms}$ it is only $25\,\mathrm{Hz}$, so the receiver must try twenty times as many Doppler guesses.

## High speeds and big Doppler

The constellation lesson found that a receiver on the ground sees Doppler shifts of at most about $\pm4.9\,\mathrm{kHz}$. That comes almost entirely from the GPS satellite's own orbital speed, $3.87\,\mathrm{km/s}$, since a person on the ground barely moves by comparison. Recall the rule: the Doppler shift is the closing speed divided by the wavelength, $f_d = v/\lambda$, with $\lambda = 0.1903\,\mathrm{m}$ on L1.

A spacecraft adds its *own* speed, and up there that speed is large. Take a typical geostationary transfer orbit: lowest point (perigee) $185\,\mathrm{km}$ above Earth, highest point (apogee) at geostationary height. The **[[vis-viva equation|vis-viva]]** from the two-body module gives the speed at any radius $r$ on an orbit with semi-major axis $a$ (half the long axis of the ellipse). Here $r_p = 6563\,\mathrm{km}$ and $a = 24{,}364\,\mathrm{km}$, so the speed at perigee is

$$
v_p = \sqrt{\mu\left(\frac{2}{r_p}-\frac{1}{a}\right)} = 10.25\,\mathrm{km/s},
$$

with $\mu = 3.986\times10^{14}\,\mathrm{m^3/s^2}$, Earth's gravity constant. Even a spacecraft sitting in a geostationary slot moves at $3.07\,\mathrm{km/s}$ through space; it only looks still from the turning Earth.

The worst case is when the spacecraft and a GPS satellite fly straight toward each other along the line between them. Then the two speeds add:

```python
mu, lam = 3.986e14, 0.1903
v_gps = 3873.96
for label, v_user in (("GTO perigee", 10252.23), ("GEO", 3074.66)):
    v_close = v_user + v_gps
    print(f"{label}: closing {v_close/1e3:.2f} km/s, Doppler {v_close/lam/1e3:.1f} kHz")
# GTO perigee: closing 14.13 km/s, Doppler 74.2 kHz
# GEO: closing 6.95 km/s, Doppler 36.5 kHz
```

That is $74.2\,\mathrm{kHz}$ at GTO perigee, fifteen times the ground receiver's window. Even parked at geostationary height it is $36.5\,\mathrm{kHz}$, more than seven times the window. The **Doppler rate**, how fast the Doppler changes, rises too, because high speed past a fixed geometry swings the lines of sight faster. That stresses the same tracking loops that a later lesson opens up.

None of this is science fiction. GNSS receivers have flown and navigated well above the constellation, with fixes reported at a large fraction of the way to the Moon ([[real missions|records]] below). But every part of such a receiver has to be built for a Doppler range ten times wider than a ground design ever needs.

## Finding the signal again

Wider Doppler and weaker signals hit hardest at one moment: getting the signal back after losing it. That can happen when the spacecraft turns and points its antenna away, in an eclipse, or while it crosses a stretch of orbit where too few satellites are usable.

Finding a signal, called **acquisition**, is a search over a two-dimensional grid, like looking for a friend in a stadium by row and seat. One direction is code phase: where in its $1023$-chip repeat is the code? The other is Doppler: what frequency shift is it arriving with? Each square of the grid, a **[[search cell|search-grid]]**, has to be tested. The number of Doppler squares is the width of the Doppler window divided by the size of one square.

A ground receiver searching $\pm4.9\,\mathrm{kHz}$ with $500\,\mathrm{Hz}$ squares (the size that goes with $1\,\mathrm{ms}$ sums) checks about $20$ Doppler squares for each code phase. A receiver at GTO perigee searching $\pm74.2\,\mathrm{kHz}$ with the same squares checks about $300$.

::: example Fifteen times the search, on a weaker signal
Compare the two Doppler windows. Each is twice its half-width:

$$
\frac{2\times74.2}{2\times4.9} = 15.1.
$$

So a spacecraft doing a **cold** reacquisition, with no idea of its own Doppler, faces a search space $15.1$ times bigger than a ground receiver running the same method. Either it takes about fifteen times as long, or it needs fifteen times as many **correlators** — the receiver's search workers, each testing one cell at a time — working in parallel to finish in the same time.

And it does this on signals that start $15$ to $20\,\mathrm{dB}$ weaker. If it answers that with $20\,\mathrm{ms}$ sums, its Doppler squares shrink from $500\,\mathrm{Hz}$ to $25\,\mathrm{Hz}$, and the square count grows another twenty times.

**Sanity check.** Neither factor is small alone, and they multiply. That is why a receiver designed only for ground Doppler and ground signal strength can lose lock above the constellation and never find the signal again.
:::

::: warning Ground settings do not carry into space
A receiver's Doppler search window and its weakest trackable signal are firmware and hardware choices, not laws of nature. Carrying a ground receiver's $\pm4.9\,\mathrm{kHz}$ window and open-sky sensitivity into space unchanged is a design error, not a small oversight. Such a receiver searches too narrow a Doppler range to find satellites it could see, and it demands more signal than side lobes can ever supply.
:::

The fix is not a faster blind search. It is *not searching blindly*. If the receiver knows its own velocity even roughly — from predicting its orbit, or from an inertial sensor — it can predict each satellite's Doppler. Then it only searches a narrow band around the prediction instead of the full $\pm74\,\mathrm{kHz}$, and the fifteen-fold penalty shrinks with it. That idea drives vector tracking and deep coupling at the end of this module. It is also why a spacecraft's orbit-determination system and its GNSS receiver are rarely designed apart from each other.

## Check yourself

::: check
A receiver climbs from GPS height ($26{,}560\,\mathrm{km}$ from Earth's center) to geostationary height ($42{,}164\,\mathrm{km}$). Does Earth block more or less of its sky, and how wide does Earth's disk look from each place?
:::

::: answer
Less. The disk's full width is $2\arcsin(R_E/r)$, which shrinks as $r$ grows. At GPS height it is $2\arcsin(6378/26{,}560) = 27.8^\circ$ across. At geostationary height it is $2\arcsin(6378/42{,}164) = 17.4^\circ$ across. Being farther from Earth makes Earth look smaller, so it hides fewer satellites — which is why $23$ of $24$ satellites in the model were in view.
:::

::: check
Using main-lobe satellites only gave PDOP $253$. Using all visible satellites, side lobes included, gave $2.97$. Explain the difference in terms of where the satellites are, not how strong they are.
:::

::: answer
The satellites whose main beams reach a high user are the ones on the far side of Earth, aiming past Earth's edge toward the user. They all sit in roughly the same direction from the user, so their lines of sight are nearly parallel — the bunched-up geometry the DOP lesson showed makes DOP huge. All the visible satellites together surround the user from many directions, like a well-spread ground sky. DOP is built only from the line-of-sight directions in $\mathbf{G}$; signal strength never enters it. Strength only decides which satellites can be tracked well enough to add a row.
:::

::: check
A spacecraft moves at $7.0\,\mathrm{km/s}$ and flies head-on toward a GPS satellite moving at $3.87\,\mathrm{km/s}$. What is the Doppler shift on L1, in kilohertz?
:::

::: answer
Closing speed: $7.0 + 3.87 = 10.87\,\mathrm{km/s}$, which is $10{,}870\,\mathrm{m/s}$. Doppler: $f_d = v/\lambda = 10{,}870/0.1903 = 57{,}120\,\mathrm{Hz}$, about $57.1\,\mathrm{kHz}$. That is more than eleven times the ground receiver's $4.9\,\mathrm{kHz}$ window.
:::

::: check
Why does doubling the width of the Doppler search window roughly double the time acquisition takes, instead of costing something smaller?
:::

::: answer
Acquisition tests every cell of a grid: code phase one way, Doppler the other. With the cell size and the time spent per cell kept the same, the number of Doppler cells is the window width divided by the cell size. Doubling the window doubles the Doppler cells for every code phase, so it doubles the total number of cells. The total search time, or the number of correlators needed to search in parallel, doubles with it.
:::

::: check
The physics of the Doppler does not change when a spacecraft knows its own velocity. So why does knowing it, even roughly, fix the reacquisition problem?
:::

::: answer
The full range of Doppler that is *possible* stays the same. But the search only has to cover the range where the Doppler *might actually be*, given what the receiver knows. A velocity estimate from orbit prediction or an inertial sensor lets the receiver predict each satellite's Doppler, so it searches only a narrow band around that prediction. The search shrinks by the same factor the window shrinks by. Vector tracking and deep coupling, at the end of this module, use exactly this idea.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| Earth's disk from distance $r$ | half-angle $\arcsin(R_E/r)$: $13.9^\circ$ at GPS height, $8.7^\circ$ at GEO; from GEO, $23$ of $24$ model satellites are in view |
| Main lobe vs. side lobe | above about $3000\,\mathrm{km}$ Earth blocks the main lobes; most satellites are heard through side lobes $15$–$20\,\mathrm{dB}$ weaker |
| DOP up there | main lobes only: PDOP $253$ (four bunched satellites); all visible: PDOP $2.97$ |
| Near–far | range spread ($12.2\,\mathrm{dB}$) plus lobe gap ($15$–$20\,\mathrm{dB}$) beats the $\sim24\,\mathrm{dB}$ Gold-code margin |
| Long integration | each doubling of $T$ gains about $3\,\mathrm{dB}$; $20\,\mathrm{ms}$ gains $13.0\,\mathrm{dB}$ over $1\,\mathrm{ms}$, but Doppler cells shrink to about $1/(2T)$ |
| Doppler | $f_d = v/\lambda$ with the user's speed added: $74.2\,\mathrm{kHz}$ at GTO perigee, $36.5\,\mathrm{kHz}$ at GEO, against $4.9\,\mathrm{kHz}$ on the ground |
| Reacquisition | search cost grows with window width: $15\times$ wider means a $15\times$ bigger blind search, on a weaker signal |
| The fix | a velocity estimate narrows the search window — the idea behind vector tracking and deep coupling |

This lesson's spacecraft coasted smoothly through space. The next lesson goes back down to the launch pad, to a receiver riding a rocket: not weak signals and wide Doppler this time, but hard acceleration, sudden jolts, shaking and flame, on a vehicle that cannot afford to lose its fix.

::: context gto A road from low orbit to high orbit
A **geostationary transfer orbit** (GTO) is a long, stretched ellipse. Its low point is just above the atmosphere, where the rocket drops the satellite off. Its high point is at geostationary height, $35{,}786\,\mathrm{km}$ above the equator. The satellite rides the ellipse up, then fires its own engine at the high point to make the orbit round. A satellite in GTO swings from very low and very fast to very high and slow twice a day, passing *below* the GPS satellites and then far *above* them. That makes GTO the hardest test of everything in this lesson. The drawing shows the three orbits to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="180" cy="75" r="66.1" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <circle cx="180" cy="75" r="41.6" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <ellipse cx="152.1" cy="75" rx="38.2" ry="26.1" fill="none" stroke="#b4232c" stroke-width="2"/>
  <circle cx="180" cy="75" r="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1"/>
  <text x="252" y="30" font-size="11" fill="#6c7a93">GEO</text>
  <text x="224" y="62" font-size="11" fill="#1d6fd1">GPS</text>
  <line x1="62" y1="116" x2="125" y2="93.5" stroke="#b4232c" stroke-width="1"/>
  <text x="40" y="126" font-size="11" fill="#b4232c">GTO</text>
  <text x="300" y="80" font-size="11" fill="#1f2a44">Earth, to scale</text>
</svg>
```
:::

::: context earth-shrinks Earth from far away
From the ground, Earth hides the whole lower half of your sky. From geostationary height, it is a disk only about $17^\circ$ across — a little less than your spread hand held at arm's length. Most of the sky is open, so almost every GPS satellite is in plain view. The trouble up there is not that Earth hides the satellites; it is that their beams point the wrong way.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="290" cy="75" r="40" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <text x="290" y="80" font-size="12" fill="#1f2a44" text-anchor="middle">Earth</text>
  <circle cx="26" cy="75" r="4" fill="#b4232c"/>
  <text x="30" y="100" font-size="11" fill="#1f2a44" text-anchor="middle">you at GEO</text>
  <line x1="26" y1="75" x2="284" y2="35.5" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 3"/>
  <line x1="26" y1="75" x2="284" y2="114.5" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 3"/>
  <path d="M 79.4 66.8 A 54 54 0 0 1 79.4 83.2" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="88" y="79" font-size="11" fill="#1f2a44">17.4°</text>
  <text x="150" y="22" font-size="11" fill="#1f2a44" text-anchor="middle">the rest of the sky is open</text>
</svg>
```
:::

::: context walker A tidy way to fill the sky
A **Walker constellation** spreads satellites evenly: several orbit planes turned equal amounts around Earth's axis, the same number of satellites in each, and each plane's satellites shifted a little along their orbit so they do not line up with the neighbors. The real GPS constellation is not a perfect Walker pattern — it has six planes with uneven spacing and more than four satellites in some — but the model is close enough to count visibility and DOP honestly. The name honors John Walker, a British engineer who worked out these patterns in the 1970s.
:::

::: context side-lobes Why every antenna leaks
An antenna focuses power by making waves from different parts of it add up in one direction. In other directions they mostly cancel, but never perfectly, so small bumps of power leak out around the main beam. Those bumps are the **side lobes**. A GPS antenna's side lobes are tens of times weaker than its main beam. No one designed them for navigation, and the official GPS specifications make almost no promises about them. So engineers have measured them from spacecraft in high orbits to learn what a high-orbit receiver can count on.
:::

::: context rim Only the rim gets past
Draw it to scale and the picture is plain. A GPS satellite on the far side of Earth aims its main beam at Earth. Earth, $27.8^\circ$ across as seen from the satellite, soaks up the middle of the beam and casts a shadow behind it. Only the thin ring of beam between Earth's edge and the beam's edge carries on into high space. A user at geostationary height catches that ring only when it is in just the right spot.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <polygon points="58,100 291.4,10.4 291.4,189.6" fill="#8fb8f0" fill-opacity="0.35"/>
  <line x1="58" y1="100" x2="291.4" y2="10.4" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="58" y1="100" x2="291.4" y2="189.6" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="144.7,78.6 330,33 330,167 144.7,121.4" fill="#6c7a93" fill-opacity="0.45"/>
  <circle cx="150" cy="100" r="22" fill="#1d6fd1" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150" y="104" font-size="11" fill="#ffffff" text-anchor="middle">Earth</text>
  <rect x="52" y="94" width="12" height="12" fill="#1f2a44"/>
  <text x="58" y="126" font-size="11" fill="#1f2a44" text-anchor="middle">GPS</text>
  <text x="58" y="139" font-size="11" fill="#1f2a44" text-anchor="middle">satellite</text>
  <text x="240" y="104" font-size="11" fill="#1f2a44" text-anchor="middle">Earth's shadow</text>
  <text x="120" y="40" font-size="11" fill="#1d6fd1" text-anchor="middle">main beam</text>
  <line x1="58" y1="100" x2="282" y2="38" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 3"/>
  <circle cx="282" cy="38" r="5" fill="#b4232c"/>
  <text x="300" y="30" font-size="11" fill="#b4232c" text-anchor="middle">user</text>
</svg>
```
:::

::: context decibels Counting powers of ten
A **decibel** (dB) compares two powers by counting powers of ten: $10\,\mathrm{dB}$ is a factor of $10$, $20\,\mathrm{dB}$ a factor of $100$, $30\,\mathrm{dB}$ a factor of $1000$. The rule is $10\log_{10}$ of the power ratio. Decibels are popular because gains and losses multiply along a radio link, and with decibels you add them instead. A signal "$15$ to $20\,\mathrm{dB}$ weaker" carries between about a thirtieth and a hundredth of the power.
:::

::: context near-far A shout drowns a whisper
Imagine a friend whispering to you across a room while someone else shouts nearby. Even if you know your friend's voice, the shouting leaks into everything you hear. GPS codes are designed so one satellite's code looks like faint noise to the receiver's copy of another code, about $24\,\mathrm{dB}$ down. When a strong satellite is more than that much louder than a weak one, its faint leftover can look bigger than the weak satellite's real signal. The receiver may lock onto a phantom that is really the loud satellite in disguise.
:::

::: context data-bits Why twenty milliseconds is a wall
On top of the repeating code, each GPS satellite sends its **navigation message** — orbit and clock data — at $50$ bits per second, so each bit lasts $20\,\mathrm{ms}$. A bit change flips the sign of the whole signal. If a $40\,\mathrm{ms}$ sum straddles a flip, the first half adds up and the second half subtracts, and the signal can cancel itself out. Newer signals such as L5 and L1C include a *pilot* part with no data on it, made to let receivers listen as long as they like.
:::

::: context vis-viva The orbit's speed rule
The vis-viva equation, $v^2 = \mu\left(\frac{2}{r} - \frac{1}{a}\right)$, is energy conservation written for an orbit. Close to Earth ($r$ small), the $\frac{2}{r}$ term is big and the spacecraft is fast; far away it is slow. "Vis viva" is Latin for "living force", an old name for what we now call kinetic energy. You met it in the two-body module; here it tells you the fastest speed the receiver will have to cope with.
:::

::: context records How high GPS has worked
NASA's four MMS spacecraft, which study Earth's magnetic field, carry a high-sensitivity GPS receiver. In 2019 they got GPS fixes about $187{,}000\,\mathrm{km}$ from Earth, roughly half the way to the Moon. In 2025 NASA's LuGRE experiment rode Firefly's Blue Ghost lander to the Moon, tracking GPS and Galileo signals along the way and on the lunar surface. Both used exactly this lesson's tricks: side lobes, long integration, and an orbit model to predict Doppler.
:::

::: context search-grid Looking for a friend in a stadium
Acquisition is like finding one friend in a stadium: you check seat by seat, row by row. One direction of the grid is code phase, the other is Doppler. The wider the Doppler range you must cover, the more rows you have to check.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <text x="20" y="20" font-size="12" fill="#1f2a44">Doppler window width, to scale</text>
  <rect x="170" y="34" width="20" height="30" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="200" y="54" font-size="11" fill="#1f2a44">ground: about 20 cells</text>
  <rect x="29" y="80" width="302" height="30" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <text x="180" y="99" font-size="11" fill="#1f2a44" text-anchor="middle">GTO perigee: about 300 cells</text>
  <line x1="180" y1="30" x2="180" y2="116" stroke="#1f2a44" stroke-width="1" stroke-dasharray="3 3"/>
  <text x="180" y="126" font-size="11" fill="#6c7a93" text-anchor="middle">zero Doppler</text>
</svg>
```
:::
