---
id: l02-star-tracker-accuracy-boresight-update-rate-stray-light
title: 'Star tracker accuracy: boresight geometry, update rate, and stray light'
minutes: 25
covers:
  - 'Star tracker accuracy: cross-boresight vs about-boresight, update rate, exclusion angles, stray light'
---

Put a coin near the middle of a spinning **[[lazy Susan|lever-arm]]** and another at its edge. Give the tray a small twist. The coin at the edge moves a lot; the coin near the middle hardly moves. Now tip the whole tray a little instead: every coin moves by about the same amount.

A star tracker's field of view is that tray. Last lesson's identification ended with an odd result: the attitude was good to $4.3''$ and $1.8''$ about two axes, but only $53.2''$ about the third — twelve times worse than even the weaker of the other two, from one instrument and one picture. That third axis was the **[[boresight|boresight-word]]**, the direction the camera looks. Turning about it is called **roll**, or **about-boresight** rotation. Tilting the boresight is **cross-boresight** rotation. Every star tracker's datasheet quotes both numbers, and roll is always worse, usually by five to ten times.

This lesson derives that ratio from geometry, so it stops looking like chance. Then it covers the other three promises on a tracker's datasheet: how often it reports, which parts of the sky it must never look at, and what happens when something bright wanders into the picture.

## Why roll is starved

Here is the idea without equations. Every star the tracker can see sits inside a narrow cone around the boresight — within $7.5^\circ$ of it for last lesson's $15^\circ$ field.

- **Tilt** the boresight by a small angle $\epsilon$ ("epsilon"), and every star in the image shifts by about $\epsilon$. Every star reports the tilt at full strength.
- **Roll** about the boresight by $\epsilon$, and a star at angle $\rho$ ("rho") from the boresight moves along a small circle. It moves by only $\epsilon\sin\rho$. Even a star at the rim, $\rho = 7.5^\circ$, moves by $\epsilon \sin 7.5^\circ = 0.13\,\epsilon$.

So the same centroid noise that hides a tiny tilt hides a roll about $1/\sin\rho$ times bigger. For small angles $\sin\rho \approx \tan\rho$, which gives the datasheet rule of thumb.

::: key Star tracker accuracy asymmetry
About-boresight (roll) error is roughly $1/\tan(\mathrm{FOV}/2)$ times worse than cross-boresight, typically $5$ to $10\times$. Fly two heads with different boresights to fix it.
:::

For a $15^\circ$ field, $1/\tan 7.5^\circ = 7.60$. That is the best case, when every star sits at the rim. Stars nearer the center help roll even less, so real fields do a bit worse.

## The information matrix, for one instrument

Now the precise version. The least-squares module built the **[[information matrix|information]]** for any set of vector measurements. For measured unit vectors $\mathbf{b}_i$ of known reference directions, each with weight $a_i = 1/\sigma_i^2$ (one over its noise squared), the information about a small rotation $\boldsymbol{\delta\theta}$ ("delta theta") is

$$
\mathbf{F} = \sum_i a_i\left(\mathbf{I} - \mathbf{b}_i\mathbf{b}_i^\mathsf{T}\right), \qquad \mathbf{P}_{\boldsymbol{\delta\theta}} = \mathbf{F}^{-1}.
$$

More information means less uncertainty: the **covariance** $\mathbf{P}$ is the inverse of $\mathbf{F}$, and the square roots of its diagonal are the one-sigma errors about each axis. Each star adds a term that is blind along its own direction $\mathbf{b}_i$: you cannot tell a rotation about a star's own line of sight from that star alone.

A star tracker adds one constraint. Take the boresight as the body $z$ axis, $\hat{\mathbf{z}}$. Write each star's angle from the boresight as $\rho_i = \arccos(b_{i,z})$, so $\rho_i \le \rho_{\max} = \mathrm{FOV}/2$. Every star has about the same centroid noise $\sigma_c$, so $a_i = a = 1/\sigma_c^2$ for all of them.

### The roll entry

For any star $b_{i,z} = \cos\rho_i$. The bottom-right entry of $\mathbf{I} - \mathbf{b}_i\mathbf{b}_i^\mathsf{T}$ is then $1 - \cos^2\rho_i = \sin^2\rho_i$. Adding up the stars:

$$
F_{zz} = \sum_i a\sin^2\rho_i .
$$

$F_{zz}$ is the information about rotation about $\hat{\mathbf{z}}$ — exactly roll. Every term is at most $a\sin^2\rho_{\max}$. For a $7.5^\circ$ half-field, $\sin^2(7.5^\circ) = 0.0170$: no star, wherever it sits, gives roll more than $1.7\%$ of its full weight.

### The other two entries

The **[[trace|trace]]** of a matrix is the sum of its diagonal. For any unit vector, the trace of $\mathbf{I} - \mathbf{b}_i\mathbf{b}_i^\mathsf{T}$ is $3 - \lVert\mathbf{b}_i\rVert^2 = 2$, wherever it points. So over the whole field, $\operatorname{trace}(\mathbf{F}) = 2Na$ exactly. Squeezing the stars into a cone destroys no information at all; it only moves it away from roll. Subtracting $F_{zz}$ from the total,

$$
F_{xx}+F_{yy} = 2Na - \sum_i a\sin^2\rho_i = \sum_i a\left(2-\sin^2\rho_i\right).
$$

When the stars are scattered all around the boresight rather than bunched to one side — true of almost any real field — $F_{xx}$ and $F_{yy}$ come out nearly equal. Each is then close to $\sum_i a\big(1 - \sin^2\rho_i/2\big)$, which is nearly $Na$ for a narrow field.

::: key The boresight accuracy split
For $N$ equally weighted stars ($a=1/\sigma_c^2$) confined to a cone of half-angle $\rho_{\max}$ around the boresight, with offsets $\rho_i\le\rho_{\max}$:
$$
F_{zz}=\sum_i a\sin^2\rho_i, \qquad F_{xx}\approx F_{yy}\approx\sum_i a\Big(1-\frac{\sin^2\rho_i}{2}\Big).
$$
Roll variance $1/F_{zz}$ is always far larger than either cross-boresight variance: about-boresight accuracy is the sensor's built-in weak direction, not a manufacturing flaw. If every star sits at the rim, $\rho_i=\rho_{\max}$, the ratio becomes $\sigma_{\text{roll}}/\sigma_{\text{cross}}=1/\sin\rho_{\max}\approx1/\tan\rho_{\max}$ — the rule of thumb, reached only in that best case.
:::

::: note Why the rim-only ratio is exactly $1/\sin\rho_{\max}$
Put all $N$ stars at $\rho_{\max}$, evenly spread around the boresight. Then $F_{zz} = Na\sin^2\rho_{\max}$ and $F_{xx} = F_{yy} = Na(1 - \sin^2\rho_{\max}/2)$. The one-sigma errors are one over the square roots, so

$$
\frac{\sigma_{\text{roll}}}{\sigma_{\text{cross}}} = \sqrt{\frac{F_{xx}}{F_{zz}}} = \frac{\sqrt{1 - \sin^2\rho_{\max}/2}}{\sin\rho_{\max}} \approx \frac{1}{\sin\rho_{\max}},
$$

because the square root on top is within $0.5\%$ of $1$ for $\rho_{\max} = 7.5^\circ$. And for small angles $\sin\rho$ and $\tan\rho$ differ by less than $1\%$.
:::

::: example Last lesson's field, revisited
Same catalog, same true attitude, same twelve stars. This time we ask not "what attitude did we get?" but "how good *should* it have been?"

```python
import numpy as np

arcsec = np.radians(1 / 3600)

def rotation(axis, ang):
    k = np.asarray(axis, float) / np.linalg.norm(axis)
    K = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + np.sin(ang) * K + (1 - np.cos(ang)) * K @ K

rng = np.random.default_rng(1)
cat = rng.standard_normal((3000, 3)); cat /= np.linalg.norm(cat, axis=1, keepdims=True)
fov = np.radians(15.0)
A_true = rotation([0.3, -0.5, 0.8], 1.1)

body = cat @ A_true.T                                  # every catalog star, in body axes
b_true = body[body[:, 2] > np.cos(fov / 2)]             # the 12 stars inside this tracker's FOV
rho = np.degrees(np.arccos(b_true[:, 2]))
print(len(b_true), "stars; rho (deg from boresight):", np.round(np.sort(rho), 2))

sigma_c = 10 * arcsec                                   # same per-star centroid noise as before
a = 1.0 / sigma_c**2
F = sum(a * (np.eye(3) - np.outer(b, b)) for b in b_true)
sig = np.sqrt(np.diag(np.linalg.inv(F)))
print("predicted 1-sigma, body axes x,y,z (arcsec):", np.round(sig / arcsec, 2))
print("roll / mean(cross-boresight):", sig[2] / (0.5 * (sig[0] + sig[1])))
half = fov / 2
print("1/tan(half FOV) =", 1 / np.tan(half), "   1/sin(half FOV) =", 1 / np.sin(half))
# 12 stars; rho (deg from boresight): [0.08 4.79 5.4  5.57 5.65 5.68 6.74 6.77 6.9  6.99 7.28 7.49]
# predicted 1-sigma, body axes x,y,z (arcsec): [ 2.99  2.91 28.34]
# roll / mean(cross-boresight): 9.595293553957069
# 1/tan(half FOV) = 7.595754112725151    1/sin(half FOV) = 7.66129757554039
```

**The prediction.** Roll: $28.34''$. Cross-boresight: the average of $2.99''$ and $2.91''$, which is $2.95''$. The ratio is $9.6$.

**Against the rule of thumb.** $9.6$ is worse than the rim-only $1/\tan(7.5^\circ) = 7.60$. That is expected: half these stars sit within $6^\circ$ of the boresight, and one almost on it. Such stars add almost nothing to $F_{zz}$ but nearly full weight to $F_{xx}$ and $F_{yy}$. Any real field does somewhat worse than the rim-only bound, which is why the rule of thumb is a range, five to ten times.

**Against last lesson's one run.** That run's errors were $4.3''$, $1.8''$ and $53.2''$, a ratio of $53.2/\big((4.3+1.8)/2\big) = 17.4$. Not wrong: a $53''$ roll error against a predicted one-sigma of $28.3''$ is under two sigma, ordinary for one draw. A covariance predicts how many attempts scatter; any single attempt can land anywhere in that scatter.
:::

## Checking the prediction, and fixing roll with geometry

The formula rests on a straight-line (small-rotation) approximation. Roll, where the uncertainty is largest, is where such an approximation would crack first. So test it with a **[[Monte Carlo|monte-carlo]]** run: thousands of noisy draws through the real, nonlinear solver.

::: example Tested against the real solver, and repaired with a second tracker
Continuing with the same field: run the SVD solution to Wahba's problem on $3000$ independent noise draws, and compare the RMS error with $\sqrt{\operatorname{diag}\mathbf{F}^{-1}}$.

```python
def wahba_svd(b, r):
    U, _, Vt = np.linalg.svd(b.T @ r)
    d = np.sign(np.linalg.det(U) * np.linalg.det(Vt))
    return U @ np.diag([1.0, 1.0, d]) @ Vt

def tangent_noise(rng, b, sigma):
    ref = np.array([1.0, 0.0, 0.0]) if abs(b[0]) < 0.9 else np.array([0.0, 1.0, 0.0])
    u = np.cross(b, ref); u /= np.linalg.norm(u)
    v = np.cross(b, u)
    bn = b + sigma * rng.standard_normal() * u + sigma * rng.standard_normal() * v
    return bn / np.linalg.norm(bn)

def rot_err_vec(A, A_true):
    dA = A @ A_true.T
    return 0.5 * np.array([dA[2, 1] - dA[1, 2], dA[0, 2] - dA[2, 0], dA[1, 0] - dA[0, 1]])

r_cat = cat[body[:, 2] > np.cos(fov / 2)]
trials = 3000
errs = np.empty((trials, 3))
for t in range(trials):
    b_noisy = np.array([tangent_noise(rng, b, sigma_c) for b in b_true])
    errs[t] = rot_err_vec(wahba_svd(b_noisy, r_cat), A_true)
rms = np.sqrt(np.mean(errs**2, axis=0))
print("linear prediction, sigma xyz (arcsec):", np.round(sig / arcsec, 3))
print("Monte Carlo RMS,    sigma xyz (arcsec):", np.round(rms / arcsec, 3))
# linear prediction, sigma xyz (arcsec): [ 2.993  2.914 28.34 ]
# Monte Carlo RMS,    sigma xyz (arcsec): [ 2.958  2.901 28.772]
```

All three axes agree within $1.5\%$, roll included. The approximation holds even on the weakest axis.

Now fix it. Mount a second, identical tracker with its boresight at $90^\circ$ to the first, a standard flight layout. Each tracker's weak roll axis then becomes a direction the *other* one senses well.

```python
b2 = (rotation([0, 1, 0], np.radians(90)) @ b_true.T).T   # tracker 2's field, boresight along vehicle +x
F2 = sum(a * (np.eye(3) - np.outer(b, b)) for b in b2)
Ftot = F + F2
sig2, sigtot = np.sqrt(np.diag(np.linalg.inv(F2))), np.sqrt(np.diag(np.linalg.inv(Ftot)))
print("tracker 2 alone, sigma xyz (arcsec):", np.round(sig2 / arcsec, 2))
print("both trackers,   sigma xyz (arcsec):", np.round(sigtot / arcsec, 3))
worst1 = np.sqrt(np.max(np.linalg.eigvalsh(np.linalg.inv(F))))
worst2 = np.sqrt(np.max(np.linalg.eigvalsh(np.linalg.inv(Ftot))))
print("worst axis, one tracker vs two (arcsec):", worst1 / arcsec, worst2 / arcsec, " improvement:", worst1 / worst2)
# tracker 2 alone, sigma xyz (arcsec): [28.34  2.91  2.99]
# both trackers,   sigma xyz (arcsec): [2.877 2.049 2.877]
# worst axis, one tracker vs two (arcsec): 28.351994827962706 2.8770930510068053  improvement: 9.854389248217485
```

Informations add, so the pair's matrix is $\mathbf{F} + \mathbf{F}_2$. Every axis now sits within a factor of two of the best single-tracker number. The vehicle's $y$ axis, which neither boresight points along, comes out best of all at $2.05''$: both trackers see it cross-boresight. The worst axis improves by a factor of $9.85$.
:::

This is the least-squares module's lesson again, now with whole instruments: when one direction is starved, **[[adding geometry|two-heads]]** beats refining any one sensor's noise. That is why spacecraft that need good roll knowledge fly two or three trackers pointing different ways, not one very expensive one.

## Update rate: speed costs photons

Tracking mode runs exposure, windowed readout, centroiding and a small fit each cycle, so it settles at a few to ten hertz. Lost-in-space acquisition can take a second or more. But every millisecond cut from the exposure to answer faster is a millisecond not spent collecting light.

Last lesson's photon limit says the centroid error goes as $1/\sqrt{N_{\text{photons}}}$, and the photon count is proportional to exposure time. So:

- Halve the exposure to double the rate, and the noise grows by $\sqrt{2} = 1.414$, not by $2$.
- Cut the exposure by five, say from a $10\,\mathrm{Hz}$ tracker toward $50\,\mathrm{Hz}$, and the noise grows by $\sqrt{5} = 2.236$.

That extra noise flows through the covariance above into every axis. A bigger aperture or brighter catalog stars buy some of it back. Most flight systems take a different path: they let the **[[gyro fill the gaps|gyro-between-fixes]]**. The tracker corrects the attitude a few times a second, and between fixes a filter carries the estimate forward on gyro data — the predict step of the Kalman filter module. The tracker's rate then need not match the control loop's.

## Exclusion angles: what the baffle cannot beat

A bare lens scatters some light from any bright source onto the detector, even a source far outside the field of view. Think of trying to see stars while someone shines a flashlight at your face from the side: the glare fills your eyes. The fix is a **[[baffle|baffle]]**: a tube in front of the lens lined with thin rings called **vanes**, each one catching light the ring before it let through.

No affordable baffle removes an arbitrarily bright source at every angle. It removes enough that, beyond some angle from the boresight, the leftover glare is fainter than the faintest star the tracker must still measure. That angle is the edge of the **exclusion angle**, or **keep-out cone**. It depends on how bright the source is compared with the faintest catalog star — not on the stars at all.

::: example How much suppression the Sun actually demands
The Sun's magnitude is about $-26.7$. The faint end of a typical onboard catalog is near magnitude $6$. Each magnitude is a factor of $10^{0.4}$ in brightness, so a **[[magnitude difference|magnitude-difference]]** $\Delta m$ ("delta m") is a brightness ratio of $10^{0.4\,\Delta m}$.

```python
import numpy as np
dm_sun = 6 - (-26.74)
ratio_sun = 10**(0.4 * dm_sun)
print("Sun/faint-star delta mag:", dm_sun, " flux ratio:", ratio_sun, " orders of magnitude:", np.log10(ratio_sun))

dm_moon = 6 - (-12.74)          # full Moon
ratio_moon = 10**(0.4 * dm_moon)
print("Moon/faint-star delta mag:", dm_moon, " flux ratio:", ratio_moon, " orders of magnitude:", np.log10(ratio_moon))
# Sun/faint-star delta mag: 32.739999999999995  flux ratio: 12473835142429.38  orders of magnitude: 13.095999999999998
# Moon/faint-star delta mag: 18.740000000000002  flux ratio: 31332857.243155953  orders of magnitude: 7.496000000000001
```

**The Sun** is about $10^{13}$ times brighter than the faintest star — thirteen **orders of magnitude** (powers of ten).

**The full Moon** is about $10^{7.5}$ times brighter.

**The gap between them** is $14$ magnitudes, a factor of $10^{0.4 \times 14} = 10^{5.6}$, about $4\times10^5$.

A baffle that pushes the Moon below the noise at some angle can be many powers of ten short of doing the same for the Sun there. So Sun keep-out cones run wide, typically $30^\circ$ to $45^\circ$, while the Moon's is noticeably tighter. Earth's sunlit limb, seen from low orbit, is a huge bright arc rather than a half-degree disk, so its keep-out cone is tens of degrees. For an Earth-pointing satellite that is a standing constraint, not an occasional one.
:::

::: key Star tracker exclusion angles
Keep-out cones around the Sun (typically $30$–$45^\circ$), Earth limb (tens of degrees) and Moon. Violating them blinds the tracker, so they are a hard constraint on attitude planning, not a preference.
:::

::: warning Keep-out cones constrain the command sequence, not just the sensor
While the Sun, a sunlit Earth limb or the Moon sits inside a tracker's keep-out cone, the tracker reports nothing usable at all. So attitude planning must check every slew against the keep-out geometry *before* it is commanded. A vehicle with two or three trackers still needs at least one of them clear whenever it depends on stars. Treating keep-out cones as a rare edge case is how a mission finds out the day a planned maneuver points the wrong tracker at the Sun.
:::

## Bright objects in the picture

Something bright inside the field does worse than add one extra spot. It fills its pixels to the brim — **saturation** — and the spare charge spills into neighbors, called **[[blooming|blooming]]**. That can wreck the centroids of nearby stars and sometimes wipe out a whole row or column. Last lesson showed that one *extra* false spot does no harm: the pyramid ignores it and the residual gate drops it. A bright object's real damage is different. It *removes* real stars.

::: example How many stars can a bright object take out?
This block reuses last lesson's identification code (`identify`, `solve`, `random_rotation`, `tol` and the rest), so run it after that code. Only the observation changes: to mimic blooming, keep a random subset of the stars in the field and lose the rest.

```python
rng = np.random.default_rng(3)

def observe_keep(A, n_keep, sigma=10 * arcsec, n_false=0):
    body = cat @ A.T
    seen = np.flatnonzero(body[:, 2] > np.cos(fov / 2))
    if len(seen) > n_keep:
        seen = rng.choice(seen, size=n_keep, replace=False)   # the rest are lost to saturation
    obs = body[seen] + sigma * rng.standard_normal((len(seen), 3))
    false = np.column_stack([rng.uniform(-0.1, 0.1, (n_false, 2)), np.ones(n_false)])
    obs = np.vstack([obs, false]) if n_false else obs
    obs /= np.linalg.norm(obs, axis=1, keepdims=True)
    return obs, np.concatenate([seen, -np.ones(n_false, int)])

for n_keep in (12, 8, 6, 5, 4, 3):
    n_ok = n_wrong = n_none = 0
    trials = 200
    for _ in range(trials):
        obs2, truth2 = observe_keep(random_rotation(), n_keep, n_false=1)
        pyramid2 = identify(obs2, tol)
        if not pyramid2:
            n_none += 1; continue
        _, ident2, _ = solve(obs2, pyramid2, gate=3 * tol)
        if all(ident2[k] == truth2[k] for k in ident2) and len(ident2) == int(np.sum(truth2 >= 0)):
            n_ok += 1
        else:
            n_wrong += 1
    print(f"stars remaining={n_keep}: correct={n_ok}/{trials}  wrong={n_wrong}  loss of track={n_none}")
# stars remaining=12: correct=200/200  wrong=0  loss of track=0
# stars remaining=8: correct=200/200  wrong=0  loss of track=0
# stars remaining=6: correct=200/200  wrong=0  loss of track=0
# stars remaining=5: correct=200/200  wrong=0  loss of track=0
# stars remaining=4: correct=198/200  wrong=0  loss of track=2
# stars remaining=3: correct=0/200  wrong=0  loss of track=200
```

**Down to five stars:** every field identified correctly.

**Four stars:** two fields in two hundred fail to identify. With only four real stars there is exactly one all-real pyramid, and if one of its six angles lands outside the tolerance, nothing confirms.

**Three stars:** every field fails. That is not a trend reaching its end; it is certain. The pyramid needs a *fourth* star to confirm any triangle, and with three there is none, whatever the noise. A bright object that blooms out most of a sparse field can knock a lost tracker offline until the geometry, or the object, moves on.
:::

Flight software does not leave bright solar-system bodies to the residual gate. Planets, and sometimes bright asteroids, move against the stars in ways no fixed catalog predicts. So an onboard **[[ephemeris|ephemeris]]** computes where each one is and masks a small patch around it before centroiding runs. The residual gate is the backstop for what an ephemeris cannot predict: a lens reflection, a glint off a solar panel, a cosmic-ray hit on the detector.

## Check yourself

::: check
Using $\operatorname{trace}(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T})=2$ for a unit vector and $F_{zz}=\sum_i a\sin^2\rho_i$, derive $F_{xx}+F_{yy}$ in terms of the $\rho_i$. Why does this hold exactly, however the stars are spread around the boresight?
:::

::: answer
Adding the trace over all $N$ stars gives $F_{xx}+F_{yy}+F_{zz}=2Na$, since every unit vector contributes exactly $2$. Subtract $F_{zz}=\sum_i a\sin^2\rho_i$ to get $F_{xx}+F_{yy}=\sum_i a(2-\sin^2\rho_i)$.

It holds exactly because the trace of $\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}$ depends only on the length of $\mathbf{b}_i$, not its direction. Stars spread all around the boresight are needed only for the separate, weaker claim that $F_{xx}$ and $F_{yy}$ are each close to half the sum.
:::

::: check
Another tracker has a $20^\circ$ field of view instead of $15^\circ$. Find $1/\tan(\rho_{\max})$ and $1/\sin(\rho_{\max})$ for its $10^\circ$ half-angle, compare with the $7.5^\circ$ values, and explain why the roll-to-cross ratio improves even though the cross-boresight information per star barely changes.
:::

::: answer
For $\rho_{\max}=10^\circ$: $1/\tan(10^\circ)=5.671$ and $1/\sin(10^\circ)=5.759$, both below the $15^\circ$ tracker's $7.596$ and $7.661$.

A wider field lets stars sit farther from the boresight, so $\sin\rho$ is bigger and each star adds more to $F_{zz}=\sum_i a\sin^2\rho_i$. Meanwhile $1-\sin^2\rho_i/2$ stays close to $1$, so $F_{xx}$ and $F_{yy}$ hardly move. The ratio improves because roll information grows. Adding more stars is a different lever: it raises $F_{xx}$ and $F_{zz}$ together, improving both accuracies without changing their ratio much.
:::

::: check
A program with one star tracker giving $3''$ cross-boresight and $28''$ roll considers two fixes: buy a tracker with half the noise on every axis, or add a second identical tracker pointing a different way. Using this lesson's numbers, which helps the worst axis more, and why?
:::

::: answer
Halving the noise halves every error, roll included: a factor of $2$ on the worst axis, for a new and costlier instrument.

The second tracker at $90^\circ$ improved the worst axis by a factor of $9.85$ in the worked example. It attacks the real bottleneck — a direction with almost no information — with information the first tracker lacks and the second has plenty of. When one direction is starved, fixing the geometry beats improving any one sensor.
:::

::: check
An operations team doubles a tracker's update rate by halving its exposure time, with nothing else changed. By what factor does the photon-limited centroid noise change, and does it hurt roll and cross-boresight equally?
:::

::: answer
The noise goes as $1/\sqrt{N_{\text{photons}}}$, and halving the exposure halves the photons, so the noise grows by $\sqrt{2}=1.414$.

The weight is $a=1/\sigma_c^2$, and every entry of $\mathbf{F}$ — $F_{zz}=\sum_i a\sin^2\rho_i$ and $F_{xx}\approx F_{yy}\approx\sum_i a(1-\sin^2\rho_i/2)$ alike — is proportional to $a$. So every axis's error grows by the same $\sqrt{2}$, and the roll-to-cross ratio does not change. A faster rate costs accuracy evenly; it does not single out roll.
:::

::: check
Why is a star tracker's Sun keep-out cone so much wider than its Moon keep-out cone, when both are small bright disks the baffle must reject?
:::

::: answer
They are nowhere near equally bright. The Sun at magnitude about $-26.7$ and the full Moon at about $-12.7$ differ by $14$ magnitudes, a brightness ratio of about $4\times10^5$. Against a magnitude-6 star, the Sun is about thirteen powers of ten brighter and the Moon about seven and a half.

A baffle's suppression gets stronger with angle from the boresight but is always finite. Pushing a source thirteen powers of ten down to the noise floor takes a much larger angle than pushing one about seven and a half powers down. The keep-out cone follows the source's brightness compared with the faintest star that must still be trusted, not its size.
:::

::: check
With exactly three stars left in the frame, the blooming example's identification failed every time. Explain why this is certain rather than just unlikely — and why a tracker already in tracking mode can still keep going with three stars.
:::

::: answer
The pyramid confirms a triangle only by finding a *fourth* star whose angles to all three match one catalog star. With three stars in the frame there is no fourth star to try, so confirmation can never happen, whatever the noise or which three stars they are. Lost-in-space identification by this method needs at least four stars.

Tracking mode is different: it already knows the attitude, so it matches each spot to its predicted star by position and needs no pattern confirmation. Three well-spread stars still fix all three axes, which is why three is the usual loss-of-track threshold. But once track is lost, reacquiring needs four.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| Tilt moves every star by $\epsilon$; roll moves a star at $\rho$ by $\epsilon\sin\rho$ | Why roll is the weak axis |
| $\rho_i=\arccos(b_{i,z})\le\rho_{\max}$ | A star's angle from the boresight, at most the half field of view |
| $F_{zz}=\sum_i a\sin^2\rho_i$ | Roll (about-boresight) information; at most $\sin^2\rho_{\max}$ of the full weight per star |
| $F_{xx}\approx F_{yy}\approx\sum_i a(1-\sin^2\rho_i/2)$ | Cross-boresight information; barely reduced by the cone |
| $\sigma_{\text{roll}}/\sigma_{\text{cross}} \gtrsim 1/\sin\rho_{\max}\approx1/\tan\rho_{\max}$ | Best-case ratio, $7.6$ for a $15^\circ$ field; $9.6$ for last lesson's real field |
| Two trackers, boresights $90^\circ$ apart | Informations add; worst axis improved $9.85\times$ — geometry, not better sensors |
| Noise $\propto 1/\sqrt{\text{exposure time}}$ | Doubling the rate costs $\sqrt2$ on every axis equally |
| Sun / faint-star flux ratio $\approx 10^{13.1}$; Moon $\approx 10^{7.5}$ | Why Sun keep-out cones ($30$–$45^\circ$) are far wider than the Moon's |
| Pyramid needs a fourth star | Lost-in-space identification is impossible with three stars; tracking can hold with three |
| Ephemeris mask, then residual gate | Known bodies are masked before centroiding; the residual gate catches the rest |

A star tracker gets its attitude from a few faint points crowded into a narrow cone. The next lesson turns to a sensor with the opposite problem: one overwhelmingly bright source, sometimes not there at all. It shows how a handful of light cells on a cube turn "which way is the Sun?" into a vector, and what Earth's reflected light does to the answer.

::: context lever-arm The lever arm for a twist
A roll by angle $\epsilon$ moves a star along a small circle whose radius is its distance from the boresight axis, $\sin\rho$. A tilt moves it along a circle of radius about $1$. The drawing exaggerates $\rho$; in a real $15^\circ$ tracker the roll lever arm is at most $\sin 7.5^\circ = 0.13$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 185" font-family="Inter, Arial, sans-serif">
  <path d="M 60 160 A 120 120 0 0 1 300 160" fill="none" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="40" y1="160" x2="320" y2="160" stroke="#6c7a93" stroke-width="1"/>
  <line x1="180" y1="160" x2="180" y2="30" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="180,24 175,34 185,34" fill="#1f2a44"/>
  <text x="108" y="36" font-size="12" fill="#1f2a44">boresight</text>
  <line x1="180" y1="160" x2="230.7" y2="51.2" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="230.7" cy="51.2" r="5" fill="#1d6fd1"/>
  <text x="240" y="48" font-size="12" fill="#1d6fd1">star</text>
  <line x1="180" y1="51.2" x2="230.7" y2="51.2" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="186" y="70" font-size="12" fill="#b4232c">sin ρ</text>
  <path d="M 180 125 A 35 35 0 0 1 194.8 128.3" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="186" y="118" font-size="12" fill="#1f2a44">ρ</text>
  <text x="40" y="178" font-size="11" fill="#6c7a93">unit sphere of directions, ρ drawn larger than real</text>
</svg>
```
:::

::: context boresight-word Where "boresight" comes from
Gunsmiths bore the barrel of a rifle, and "boresighting" meant lining up the sights with the barrel by looking straight down the bore. The word moved to any instrument's main line of sight: an antenna's, a telescope's, a camera's. "Roll", "pitch" and "yaw" came from ships and aircraft; for a sensor, roll always means turning about its own boresight.
:::

::: context information What "information" means here
The statistician Ronald Fisher defined information as, roughly, how sharply the data pin down an unknown. For a single noisy number with standard deviation $\sigma$, the information is $1/\sigma^2$: halve the noise and you get four times the information. Information from independent measurements simply adds, which is why the matrix $\mathbf{F}$ is a sum over stars, and why two trackers give $\mathbf{F}_1 + \mathbf{F}_2$. Inverting $\mathbf{F}$ turns information back into variance.
:::

::: context trace The trace, and why it stays at 2
The trace of a matrix is the sum of the numbers on its main diagonal. For $\mathbf{I} - \mathbf{b}\mathbf{b}^\mathsf{T}$ with $\mathbf{b} = (b_x, b_y, b_z)$, the diagonal is $1 - b_x^2$, $1 - b_y^2$, $1 - b_z^2$, which adds to $3 - (b_x^2 + b_y^2 + b_z^2) = 3 - 1 = 2$. Each star therefore carries exactly two units of weighted information in total, however it points. Geometry decides only how those two units are shared among the three axes.
:::

::: context monte-carlo Testing by rolling dice
A Monte Carlo test runs the real calculation thousands of times with fresh random noise each time, then measures the spread of the answers. It needs no approximations, so it is the standard way to check a formula that does use them. The name, after the casino town of Monte Carlo, was coined in the late 1940s at Los Alamos, where scientists used the method for nuclear-weapons calculations.
:::

::: context two-heads Two trackers, two weak axes
Each tracker is weak only about its own boresight. Point the two boresights $90^\circ$ apart and each weak axis is a strong axis of the other. The third axis, out of the page, is seen cross-boresight by both.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="110" width="50" height="50" fill="#ffffff" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="125,110 100,35 150,35" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <polygon points="150,135 230,110 230,160" fill="#f2b880" stroke="#b4232c" stroke-width="1.5"/>
  <line x1="125" y1="110" x2="125" y2="20" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="4 3"/>
  <line x1="150" y1="135" x2="255" y2="135" stroke="#b4232c" stroke-width="2" stroke-dasharray="4 3"/>
  <text x="160" y="40" font-size="12" fill="#1d6fd1">tracker 1: weak about z</text>
  <text x="200" y="100" font-size="12" fill="#b4232c">tracker 2: weak about x</text>
  <circle cx="125" cy="135" r="6" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="125" cy="135" r="2" fill="#1f2a44"/>
  <text x="20" y="150" font-size="12" fill="#1f2a44">y (out of page):</text>
  <text x="20" y="166" font-size="12" fill="#1f2a44">strong in both</text>
</svg>
```
:::

::: context gyro-between-fixes Between the star fixes
A gyro reports turn rate hundreds of times a second, with little noise but a slow drift. A star tracker reports absolute attitude a few times a second, with more noise but no drift. A Kalman filter uses each where it is strong: it predicts forward on the gyro between fixes, then corrects when a star fix arrives, and along the way estimates the gyro's drift. This pairing is the core of nearly every precision attitude system, and later modules build it in full.
:::

::: context baffle Light that has to bounce to get in
Starlight from inside the field travels straight down the tube to the lens. Sunlight from far off to the side hits a vane and is absorbed; to reach the lens it would have to scatter many times, losing most of its light at each bounce.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="50" x2="280" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <line x1="60" y1="130" x2="280" y2="130" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="100" y1="50" x2="100" y2="68"/><line x1="140" y1="50" x2="140" y2="68"/><line x1="180" y1="50" x2="180" y2="68"/><line x1="220" y1="50" x2="220" y2="68"/><line x1="260" y1="50" x2="260" y2="68"/>
    <line x1="100" y1="130" x2="100" y2="112"/><line x1="140" y1="130" x2="140" y2="112"/><line x1="180" y1="130" x2="180" y2="112"/><line x1="220" y1="130" x2="220" y2="112"/><line x1="260" y1="130" x2="260" y2="112"/>
  </g>
  <ellipse cx="290" cy="90" rx="6" ry="36" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="330" y1="60" x2="330" y2="120" stroke="#1f2a44" stroke-width="3"/>
  <text x="300" y="150" font-size="12" fill="#1f2a44">detector</text>
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="10" y1="82" x2="284" y2="82"/><line x1="10" y1="98" x2="284" y2="98"/>
  </g>
  <text x="10" y="76" font-size="12" fill="#1d6fd1">starlight</text>
  <line x1="20" y1="15" x2="100" y2="120" stroke="#b4232c" stroke-width="2.5"/>
  <text x="112" y="24" font-size="12" fill="#b4232c">sunlight stops on a vane</text>
  <text x="120" y="160" font-size="12" fill="#1f2a44">baffle tube with vanes</text>
</svg>
```
:::

::: context magnitude-difference From magnitudes to ratios
Because five magnitudes is exactly a factor of $100$, a difference of $\Delta m$ magnitudes is a brightness ratio of $100^{\Delta m/5} = 10^{0.4\,\Delta m}$. So $5$ magnitudes is $100\times$, $10$ is $10^4$, and $32.74$ is $10^{13.1}$. Engineers often talk in "orders of magnitude" — powers of ten — because the ratios are too large to picture any other way.
:::

::: context blooming When a pixel overflows
Each pixel is a tiny bucket that collects electrons during the exposure. A bright source overfills it, and on older CCD detectors the extra charge runs along the column into the next buckets, making a bright streak. CMOS detectors mostly stop that spill, but a bright source still saturates a blob of pixels and scatters light around it. Either way, stars under or near the blob are lost.
:::

::: context ephemeris A timetable for the sky
An ephemeris is a table, or a formula, giving where a moving body will be at any time. Spacecraft carry compact ephemerides of the Sun, Moon and planets. The word comes from the Greek for "daily", because the old printed ones listed positions day by day. The same data drives the keep-out checks: to know whether a slew will point a tracker at the Moon, you must know where the Moon is.
:::
