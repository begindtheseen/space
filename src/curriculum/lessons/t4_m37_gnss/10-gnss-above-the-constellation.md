---
id: l10-gnss-above-the-constellation
title: GNSS above the constellation
minutes: 22
covers:
  - "Space-based GNSS: use above the constellation, side-lobe reception, high-dynamics tracking, Doppler"
---

Every lesson so far has quietly assumed a receiver below the constellation, looking up at satellites $20{,}000\,\mathrm{km}$ overhead through a hemisphere of open sky. A spacecraft in a geostationary transfer orbit, at geostationary altitude itself, or on the way to the Moon is not in that situation at all — it can be as far from Earth as the GPS satellites are, or farther, and the constellation it is trying to use is no longer overhead but scattered around it, partly hidden behind the Earth, radiating in directions its designers never optimised for. This lesson works out what changes: which satellites are even visible, how weak they are when they are, how fast the geometry moves, and what all three do to the acquisition problem the first lesson's link budget only ever solved for the ground.

## Above the constellation, the geometry inverts

A satellite's antenna is built and aimed for one job: illuminate the Earth disk below it. From GPS altitude that disk subtends a half-angle of $13.9^\circ$, and the main lobe is shaped to cover it with margin. A user above the constellation is not below any of that — reaching such a user at all needs one of two things: a satellite on the far side of the user's local vertical whose main beam, aimed at Earth, happens to sweep close enough to the user's direction to still be usable, or a much weaker signal from the beam's skirts and side lobes. Which one applies, satellite by satellite, is a geometry problem worth setting up properly rather than guessing at.

Build a representative constellation — six orbital planes, four satellites each, $55^\circ$ inclination, GPS's own orbital radius, spread out enough that no two satellites coincide — and place a user at geostationary altitude, $42{,}164\,\mathrm{km}$ from Earth's centre:

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
    t_star = np.clip(-np.dot(user, d) / np.dot(d, d), 0.0, 1.0)   # closest approach to Earth's centre
    return np.linalg.norm(user + t_star * d) < R_E                # blocked if that point is inside Earth


sats = walker_constellation()
user = np.array([42164e3, 0.0, 0.0])
visible = np.array([s for s in sats if not occulted(user, s)])
print("visible:", len(visible), "of", len(sats))
# visible: 23 of 24
```

Only one of twenty-four satellites is fully blocked by Earth's solid body — from geostationary altitude, Earth is a comparatively small obstacle, not the hemisphere-filling disk it is from the ground. Almost the whole constellation is geometrically visible. Whether it is *usable* is a second question: for each unoccluded satellite, compute the angle between its nadir direction (aimed at Earth, where its main beam points) and the actual direction to the user.

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

Using $30^\circ$ as a rough stand-in for the edge of a GPS antenna's main coverage beam (a few degrees more generous than the bare $13.9^\circ$ Earth-disk angle, in the spirit of the real margin built into the design), only $4$ of the $23$ visible satellites fall inside it. The other $19$ are reachable only through the antenna's side lobes — by design, tens of decibels weaker than the main beam, the "roughly $15$ to $20\,\mathrm{dB}$" figure this module has attached to space-based GNSS from the start.

::: example Why a high-sensitivity receiver needs the side lobes, not only tolerates them
Compute dilution of precision, exactly as the DOP lesson defined it, for both populations:

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

Restricted to the four main-lobe satellites, PDOP is $253$ — worse by an order of magnitude than even the deliberately clustered "bad" terrestrial geometry the DOP lesson built, because those four satellites are all roughly aligned with the user's own radial direction from Earth, nearly the most degenerate spread four satellites can have. Opening the receiver up to all twenty-three visible satellites, weak side lobes included, brings PDOP down to $2.97$ — as good as the well-spread terrestrial constellation from the same lesson. The side lobes are not a fallback for when the main lobe is not enough; for a user above the constellation, they *are* the geometry. A receiver that cannot track tens of decibels below what a ground receiver considers usable does not have a slightly worse fix — for most of the sky, it has no fix at all.
:::

Ranges also spread far wider than they do on the ground: from $15{,}604\,\mathrm{km}$ for the nearest visible satellite to $63{,}773\,\mathrm{km}$ for the furthest, a factor of $4.1$ that alone costs $20\log_{10}(63{,}773/15{,}604)=12.2\,\mathrm{dB}$ of received-power spread from free-space path loss, on top of the main-lobe/side-lobe difference. Stack the two and the weakest usable satellite can be $30\,\mathrm{dB}$ or more below the strongest — comfortably past the $\sim24\,\mathrm{dB}$ point at which the constellation lesson's Gold-code cross-correlation floor exceeds a weak signal's own peak. This is exactly the near-far hazard that lesson flagged as "rare on the ground and routine for a spacecraft above the constellation": a strong, nearby, main-lobe satellite's cross-correlation residue can outweigh a distant side-lobe satellite's true correlation peak, and a receiver has to check every acquisition against the Doppler and satellite-identity it expects rather than trusting the strongest peak in its search space.

::: key
Above roughly $3{,}000\,\mathrm{km}$ altitude, a user is progressively outside the illuminated Earth disk; most visible satellites are reached through side lobes $15$–$20\,\mathrm{dB}$ weaker than the main beam. Geometry is sparse in the main lobe alone (PDOP in the hundreds) but recovers to ground-like quality (PDOP $\approx3$) once side-lobe tracking is included — a high-sensitivity receiver is not a luxury above the constellation, it is what makes the geometry usable at all. Received power spreads $30\,\mathrm{dB}$ or more across the visible satellites, well past the near-far cross-correlation threshold.
:::

## High-dynamics tracking and Doppler

A ground receiver's Doppler, the signal-structure lesson found, tops out around $\pm4.9\,\mathrm{kHz}$, set almost entirely by the GPS satellites' own $3.87\,\mathrm{km/s}$ orbital speed. A spacecraft above the constellation adds its *own* velocity to that budget, and above the constellation that velocity is not small. A representative geostationary transfer orbit, perigee $185\,\mathrm{km}$, apogee at geostationary altitude, has a perigee speed from the vis-viva equation of

$$
v_p = \sqrt{\mu\left(\frac{2}{r_p}-\frac{1}{a}\right)} = 10.25\,\mathrm{km/s},
$$

and even a spacecraft sitting at geostationary altitude on a circular orbit still moves at $3.07\,\mathrm{km/s}$ in inertial space. Combined with a GPS satellite's own $3.87\,\mathrm{km/s}$, in the worst case — closing head-on along the line of sight —

```python
mu, lam = 3.986e14, 0.1903
v_gps = 3873.96
for label, v_user in (("GTO perigee", 10252.23), ("GEO", 3074.66)):
    v_close = v_user + v_gps
    print(f"{label}: closing {v_close/1e3:.2f} km/s, Doppler {v_close/lam/1e3:.1f} kHz")
# GTO perigee: closing 14.13 km/s, Doppler 74.2 kHz
# GEO: closing 6.95 km/s, Doppler 36.5 kHz
```

$74.2\,\mathrm{kHz}$ at GTO perigee, fifteen times the ground receiver's design window; $36.5\,\mathrm{kHz}$ even sitting at rest in a geostationary slot, seven times as much. The Doppler *rate* rises with it, for the same reason the constellation lesson flagged for a launch vehicle: high relative velocity crossing a fixed geometry changes the line-of-sight rate faster, stressing the same tracking loops the tracking-loop lesson works out the limits of. None of this is exotic — GNSS has flown and navigated successfully well above the constellation, including missions reporting fixes near lunar distance — but every part of the receiver has to be built for a Doppler budget an order of magnitude wider than a ground design ever needs.

## The reacquisition problem

Wider Doppler and weaker signal compound where a receiver needs speed most: reacquiring lock after losing it, whether from an attitude manoeuvre that swings the antenna away from the constellation, an eclipse, or flying through a patch of sky with too few usable satellites. Acquisition is a search over two dimensions, code phase and Doppler frequency, and the number of cells to search scales with the *span* of each. A ground receiver searching $\pm4.9\,\mathrm{kHz}$ in $500\,\mathrm{Hz}$ bins (a resolution set by roughly a millisecond of coherent integration) covers about $20$ Doppler bins per code-phase hypothesis; a receiver at GTO perigee searching $\pm74.2\,\mathrm{kHz}$ at the same resolution covers close to $300$ — a search space fifteen times larger, at the same per-cell dwell time, for the same number of parallel correlators.

::: example Fifteen times the search, at a lower starting signal
$$
\frac{2\times74.2\,\mathrm{kHz}}{2\times4.9\,\mathrm{kHz}} = 15.1.
$$
A receiver above the constellation facing a cold reacquisition — no prior estimate of its own Doppler — is fifteen times slower to lock, or needs fifteen times the correlator hardware to hold the same reacquisition time, than a ground receiver with an identical search algorithm, and it is doing that search on signals that started $15$ to $20\,\mathrm{dB}$ weaker to begin with. Neither factor is small on its own; together they are why a receiver designed only against a ground Doppler and power budget can lose lock above the constellation and never find it again.
:::

::: warning
A receiver's acquisition search window and minimum tracking $C/N_0$ threshold are firmware and hardware choices, not laws of physics — carrying a ground receiver's $\pm4.9\,\mathrm{kHz}$ search window and open-sky sensitivity budget into a space application unchanged is a design error this lesson's numbers make precise, not a minor oversight. A receiver built only against ground assumptions will search too narrow a Doppler range to find satellites it can, in principle, see, and will demand more signal than side-lobe reception above the constellation can ever supply.
:::

Nothing about the search geometry changes this on its own — what changes it is *not searching blindly*: if the receiver's own velocity is known even approximately, from orbit propagation or from an inertial measurement, the Doppler search window collapses from the full $\pm74\,\mathrm{kHz}$ span to a band around the predicted value, and the same fifteen-fold penalty shrinks with it. That is precisely what vector tracking and deep coupling, taken up at the end of this module, are built to exploit, and it is also why a spacecraft's attitude and orbit determination system and its GNSS receiver are rarely designed in isolation from each other.

## Check yourself

::: check
Why does the fraction of the sky occluded by Earth's solid body *shrink* as a receiver moves from GPS altitude to geostationary altitude, even though the receiver is now much further from Earth?
:::

::: answer
The angle Earth's disk subtends from a distance $r$ is $2\arcsin(R_E/r)$, which shrinks as $r$ grows: at GPS altitude ($r\approx26{,}560\,\mathrm{km}$) it is a wide $27.8^\circ$ across, while at geostationary altitude ($r\approx42{,}164\,\mathrm{km}$) it is narrower still. A receiver above the constellation is further from Earth than the satellites it is trying to see, so Earth blocks a smaller fraction of its sky than it does for a satellite looking back down at the ground.
:::

::: check
A receiver above the constellation restricted to main-lobe-only satellites found a PDOP of $253$; opening it to all visible satellites, including weak side lobes, brought PDOP down to $2.97$. Explain why in terms of the satellites' geometric spread, not their signal strength.
:::

::: answer
The handful of satellites within the main-lobe cone are, by the geometry of "aimed at Earth and also roughly aimed at this particular user," clustered close to the user's own radial direction from Earth — nearly parallel lines of sight, the same kind of near-degenerate spread the dilution-of-precision lesson showed drives DOP to very large values. The full set of visible satellites spans a much wider range of directions around the user, closer to the well-spread terrestrial case, and DOP is purely a function of that directional spread — signal strength does not enter the geometry matrix at all, only which satellites can be tracked well enough to contribute a measurement.
:::

::: check
Compute the worst-case Doppler, in kilohertz, for a spacecraft moving at $7.0\,\mathrm{km/s}$ relative to Earth's centre, closing head-on with a GPS satellite moving at its own orbital speed of $3.87\,\mathrm{km/s}$, on L1.
:::

::: answer
$v_{\mathrm{close}} = 7.0+3.87 = 10.87\,\mathrm{km/s}$; $f_d = v_{\mathrm{close}}/\lambda = 10{,}870/0.1903 = 57.1\,\mathrm{kHz}$ — over eleven times the ground receiver's $\pm4.9\,\mathrm{kHz}$ design window.
:::

::: check
Why does a wider Doppler search window cost acquisition time roughly in direct proportion to its width, rather than some smaller penalty?
:::

::: answer
Acquisition searches a two-dimensional grid of code-phase and Doppler-frequency hypotheses, testing each for a correlation peak; at fixed bin resolution and fixed dwell time per cell, the number of Doppler bins is the window's width divided by the bin size, so doubling the window doubles the number of cells that must be tested for every code-phase hypothesis, and the total search time (or the correlator hardware needed to search in parallel) scales the same way.
:::

::: check
Why does knowing a spacecraft's own velocity, even approximately, help solve the reacquisition problem, when the underlying Doppler physics has not changed?
:::

::: answer
The Doppler *budget* — the full range the receiver's own motion plus every visible satellite's motion could in principle produce — has not changed, but the search only has to cover the *uncertainty* in where the true Doppler lies, not the full budget. An independent velocity estimate, from orbit propagation or an inertial sensor, narrows the search to a small band around the predicted Doppler for each satellite instead of the entire possible range, shrinking the acquisition search by the same factor the window itself shrinks by — the same principle vector tracking and deep coupling use to reacquire lock quickly at the end of this module.
:::

## Summary

| Item | Statement |
| --- | --- |
| Occultation | Earth blocks a shrinking fraction of the sky as altitude grows past GPS altitude; from GEO, $23$ of $24$ representative satellites remain geometrically visible |
| Main lobe vs. side lobe | Only satellites whose main beam happens to sweep near the user are strong; most visible satellites are reached through side lobes, $15$–$20\,\mathrm{dB}$ weaker |
| DOP: main-lobe-only vs. all visible | $253$ (four clustered satellites) vs. $2.97$ (twenty-three well-spread satellites, side lobes included) |
| Near-far hazard | Range spread ($12.2\,\mathrm{dB}$) plus main/side-lobe spread ($15$–$20\,\mathrm{dB}$) exceeds the $\sim24\,\mathrm{dB}$ Gold-code cross-correlation floor |
| High-dynamics Doppler | Add the user's own velocity to the satellite's $3.87\,\mathrm{km/s}$; $74.2\,\mathrm{kHz}$ worst case at GTO perigee, $36.5\,\mathrm{kHz}$ at GEO, against $4.9\,\mathrm{kHz}$ on the ground |
| Reacquisition | Search cost scales with Doppler window width; a $15\times$ wider window is a $15\times$ larger blind search, on a weaker signal to start with |
| Mitigation | An independent velocity estimate narrows the search window in direct proportion — the basis of vector tracking and deep coupling |

Everything in this lesson assumed a spacecraft coasting smoothly through space. The next lesson returns to Earth's surface for the one environment that stresses a receiver even harder in a different way entirely — not by weak signals and wide Doppler, but by acceleration, jerk and vibration measured in tens of $g$, on a vehicle that cannot afford to lose its fix at the moment it matters most.
