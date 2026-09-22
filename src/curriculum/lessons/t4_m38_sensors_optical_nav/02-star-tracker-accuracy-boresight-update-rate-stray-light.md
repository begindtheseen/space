---
id: l02-star-tracker-accuracy-boresight-update-rate-stray-light
title: 'Star tracker accuracy: boresight geometry, update rate, and stray light'
minutes: 28
covers:
  - 'Star tracker accuracy: cross-boresight vs about-boresight, update rate, exclusion angles, stray light'
---

The previous lesson's identification run ended on a specific, almost provocative number: the same attitude solution was accurate to $4.3''$ and $1.8''$ about two axes and only $53.2''$ about a third — a factor of roughly thirteen, from one instrument, one exposure, no moving parts. That is not an artifact of the particular field of stars this module happened to draw. Every star tracker ever flown reports two different numbers on its datasheet, a cross-boresight accuracy and an about-boresight, or roll, accuracy, and the second is always worse, typically by five to ten times. This lesson derives that ratio from the sensor's own geometry, so the number stops looking like a coincidence of one simulation and starts looking like an unavoidable consequence of pointing a narrow cone of view at a field of point sources.

Accuracy is only one of four things a star tracker's specification sheet has to promise, and the other three are just as consequential for a mission that depends on it. How often does it report a fix, and what does that rate cost in accuracy? What parts of the sky is it forbidden to look at, and why can no amount of baffle design remove that restriction entirely? And what happens on the day something the identification algorithm never budgeted for — a planet, a sunlit solar panel, a cosmic-ray hit — lands inside the field of view anyway? All four questions trace back to the same geometric fact: a star tracker's entire information about attitude comes from a handful of faint points crowded into a cone a few to twenty degrees wide, and nothing about the instrument works the way it would if those points were spread over the whole sky.

The tool for the first, central question already exists. The least-squares module's lesson on the covariance of an attitude solution and the effect of sensor geometry built the attitude information matrix for an arbitrary collection of vector observations, of any origin, pointing anywhere. A star tracker is the one instrument in this module whose vectors are not spread anywhere — every star it reports sits inside one shared field of view. Substituting that single constraint into the same matrix is most of this lesson's derivation; the rest is arithmetic on the field the previous lesson already solved.

## The attitude information matrix, specialized to one instrument

Recall the result in full. For vector observations $\mathbf{b}_i$ (body frame) of known reference directions $\mathbf{r}_i$, each weighted by $a_i=1/\sigma_i^2$, the linearized Fisher information for a small body-frame rotation $\boldsymbol{\delta\theta}$ is

$$
\mathbf{F} = \sum_i a_i\left(\mathbf{I} - \mathbf{b}_i\mathbf{b}_i^\mathsf{T}\right), \qquad \mathbf{P}_{\boldsymbol{\delta\theta}} = \mathbf{F}^{-1},
$$

with every vector contributing a rank-two term, blind exactly along its own direction $\mathbf{b}_i$. Nothing in that derivation assumed anything about where the $\mathbf{b}_i$ come from.

A star tracker's vectors are not spread over the whole sky. Every star it reports sits inside a cone of half-angle $\rho_{\max}=\mathrm{FOV}/2$ around one shared boresight direction, which we take as the body $z$-axis, $\hat{\mathbf{z}}$ — the field the previous lesson identified used a $15^\circ$ field of view, so $\rho_{\max}=7.5^\circ$. Write each star's angular offset from the boresight as $\rho_i=\arccos(b_{i,z})$, so $\rho_i\le\rho_{\max}$ for every star the tracker can report, by construction of the instrument. All $N$ stars share, to a good approximation, the same per-star noise $\sigma_c$ set by the centroiding chain built earlier, so $a_i=a=1/\sigma_c^2$ for every star. That one constraint — every vector confined to a narrow cone around one axis, all carrying equal weight — is the entire difference between this lesson and the general result it specializes.

## Roll is starved by construction

For any star, $b_{i,z}=\cos\rho_i$, so the $(3,3)$ entry of $\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}$ is $1-\cos^2\rho_i=\sin^2\rho_i$, and summing over the field,

$$
F_{zz} = \sum_i a\sin^2\rho_i .
$$

$F_{zz}$ is the information about rotation about $\hat{\mathbf{z}}$ itself, which is exactly roll, and every term in that sum is bounded by $a\sin^2\rho_{\max}$, because $\rho_i\le\rho_{\max}$ for every star in the field. For a $7.5^\circ$ half-field, $\sin^2(7.5^\circ)=0.0170$: no star, however it is placed, can contribute more than about $1.7\%$ of its full weight $a$ to roll.

The other two diagonal entries do not lose nearly as much, and the reason is an exact identity rather than an approximation. The trace of $\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}$ is $3-\lVert\mathbf{b}_i\rVert^2=2$ for every unit vector, regardless of $\rho_i$, so summing over the whole field, $\operatorname{trace}(\mathbf{F})=2Na$ exactly: none of the total information is destroyed by confining the stars to a cone, all of it is redistributed away from roll. Since $F_{xx}+F_{yy}+F_{zz}=2Na$,

$$
F_{xx}+F_{yy} = 2Na - \sum_i a\sin^2\rho_i = \sum_i a\left(2-\sin^2\rho_i\right),
$$

and whenever the stars are scattered across azimuth around the boresight rather than bunched to one side of it — true of essentially any real field, and exactly true for stars spaced evenly in azimuth — $F_{xx}$ and $F_{yy}$ come out close to equal, each near $\sum_i a\big(1-\sin^2\rho_i/2\big)$, close to $Na$ itself for a narrow field of view. Confining the stars to a cone barely touches cross-boresight information; it suppresses roll information by a factor of order $\sin^2\rho_{\max}$.

::: key The boresight accuracy split
For $N$ equally weighted stars ($a=1/\sigma_c^2$) confined to a cone of half-angle $\rho_{\max}$ around the boresight, with offsets $\rho_i\le\rho_{\max}$:
$$
F_{zz}=\sum_i a\sin^2\rho_i, \qquad F_{xx}\approx F_{yy}\approx\sum_i a\Big(1-\frac{\sin^2\rho_i}{2}\Big).
$$
Roll variance $1/F_{zz}$ is always far larger than either cross-boresight variance — about-boresight accuracy is the sensor's structurally starved direction, not a manufacturing shortfall. In the limiting case where every star sits at the rim, $\rho_i=\rho_{\max}$, the ratio reduces to $\sigma_{\text{roll}}/\sigma_{\text{cross}}=1/\sin\rho_{\max}\approx1/\tan\rho_{\max}$ for the small angles a field of view spans — the accuracy card's rule of thumb, achieved only in that best case.
:::

::: example The previous lesson's field, revisited
The same catalog, the same true attitude, the same twelve stars — only this time asking not "what attitude did we get" but "how good should that attitude have been."

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

The predicted roll accuracy, $28.34''$, against a mean cross-boresight accuracy of $(2.99+2.91)/2=2.95''$, gives a ratio of $9.6$ — worse than the $1/\tan(7.5^\circ)=7.60$ rim-only bound, because these twelve stars are not all pinned to the field's edge: half of them sit within $6^\circ$ of the boresight, one nearly on it, and each such star contributes almost nothing to $F_{zz}$ while still contributing close to its full weight to $F_{xx}$ and $F_{yy}$. That is the general rule, not a coincidence of this field: any real distribution of stars inside the cone does somewhat worse than the rim-only bound, which is exactly why the accuracy card quotes a range, five to ten times, rather than one number.

Compare this prediction — a covariance computed before any measurement is taken — against the single noisy realization the previous lesson actually produced: errors of $4.3''$, $1.8''$ and $53.2''$, a ratio of $53.2/\big((4.3+1.8)/2\big)=17.4$. That single draw is not wrong; a $53''$ roll error against a predicted $1\sigma$ of $28.3''$ is an outcome under two standard deviations, unremarkable for one realization of a Gaussian. The point is the same one the least-squares module's covariance lesson made: a covariance predicts how an ensemble of attempts scatters, and any single attempt is free to land anywhere inside that scatter.
:::

## Validating the prediction, and fixing roll with geometry

The closed form above rests on the same small-rotation linearization the least-squares module used throughout, and the prerequisite lesson found that approximation excellent for two vectors. It is worth checking again here, because a star tracker's roll axis is exactly the regime — large relative uncertainty, structurally different information along different axes — where a linearization is most likely to show cracks.

::: example Validated against the nonlinear solver, and repaired with a second tracker
Continuing with the same twelve-star field: run the actual SVD solution to Wahba's problem, not the linear prediction, across thousands of independent noise draws, and compare the resulting RMS error to $\sqrt{\operatorname{diag}\mathbf{F}^{-1}}$.

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

Three components, agreement to within $1.5\%$ on every one of them, roll included — the linearization holds even for the sensor's worst-conditioned axis.

Now fix it. Mount a second, identical tracker with its boresight ninety degrees from the first — a standard flight configuration, not a hypothetical one — so that each tracker's own weak roll axis becomes a direction the *other* tracker senses well.

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

Every axis of the combined solution now sits within a factor of two of the best single-tracker cross-boresight number, and the vehicle's $y$-axis — the one direction neither tracker's boresight ever points along — comes out best of all, at $2.05''$: it receives strong cross-boresight information from both instruments at once, with neither one's roll blind spot ever landing on it. The worst axis overall improves by a factor of $9.85$. This is the least-squares module's own conclusion about adding a well-separated third vector to a near-degenerate pair, applied here to whole instruments instead of individual measurements: geometric diversity repairs a starved direction far more effectively than refining any one sensor's noise floor, which is why a spacecraft that needs reliable roll knowledge flies two or three star trackers at different orientations rather than one very expensive one.
:::

## Update rate: what tracking mode trades for speed

Tracking mode, once an attitude is known, runs exposure, windowed readout, centroiding and a small least-squares fit every cycle — no pattern search — which is why it settles at a few to ten hertz on typical flight hardware, while the lost-in-space acquisition this module opened with can take a second or more. That gap in speed is also a gap in what each mode can afford: acquisition searches a combinatorial space and can spend the time, while tracking mode has to close the loop fast enough for an attitude control system to use the result, and every millisecond of exposure it keeps for that purpose is a millisecond it cannot spend collecting photons.

That trade is the same photon-limited centroiding this module opened with, read in the other direction. A photon-limited centroid's standard deviation scales as $1/\sqrt{N_{\text{photons}}}$, and for a fixed star and a fixed optical throughput, $N_{\text{photons}}$ is directly proportional to exposure time. Halving the exposure time to double the update rate does not double the centroid noise — it multiplies it by $\sqrt{2}=1.414$; cutting exposure by a factor of five, to go from a $10\,\mathrm{Hz}$ tracker to something nearer $50\,\mathrm{Hz}$, multiplies the per-star noise by $\sqrt{5}=2.236$, and that noise increase carries straight through the covariance derived above into both cross-boresight and roll. A mission that wants a faster fix accepts a noisier one, at a rate set by the square root of how much exposure it gave up, and it can only partly buy the difference back with a larger aperture or a brighter magnitude cutoff. Many flight systems accept exactly this trade and lean on the gyro to fill the gap: the star tracker's fix corrects a propagated attitude only a few times a second, and the predict step between fixes — precisely the predict step the Kalman filter module derived — carries the estimate forward from the gyro in between, so the tracker's own update rate does not have to match the control loop's.

## Exclusion angles: what the baffle cannot overcome

A star tracker's front end has to reject light arriving from well outside its nominal field of view, because a bare lens scatters and diffracts some fraction of any bright off-axis source down the tube and onto the detector, however far outside the field of view that source sits. The fix is a baffle: a tube lined with a sequence of knife-edge vanes, each one absorbing and redirecting the light the previous vane failed to stop, so that a source has to come within some cutoff angle of the boresight before it delivers any measurable signal to the focal plane at all. No baffle economically built suppresses an arbitrarily bright source to the noise floor at every angle; it suppresses enough that, beyond some angle, the residual scattered light drops below the faintest star the tracker still needs to centroid. That angle — not any property of the stars — is where a manufacturer draws the keep-out cone, and it is set by how bright the excluded source is relative to the faintest catalog star.

::: example How much suppression the Sun actually demands
The Sun's apparent magnitude is about $-26.7$; the faint end of a typical onboard catalog sits near magnitude $6$. The magnitude scale is logarithmic, each step a factor of $10^{0.4}$ in flux, so the ratio between them is:

```python
import numpy as np
dm_sun = 6 - (-26.74)
ratio_sun = 10**(0.4 * dm_sun)
print("Sun/faint-star delta mag:", dm_sun, " flux ratio:", ratio_sun, " orders of magnitude:", np.log10(ratio_sun))

dm_moon = 6 - (-12.74)          # full Moon
ratio_moon = 10**(0.4 * dm_moon)
print("Moon/faint-star delta mag:", dm_moon, " flux ratio:", ratio_moon, " orders of magnitude:", np.log10(ratio_moon))
# Sun/faint-star delta mag: 32.74  flux ratio: 1.2473835142429381e+13  orders of magnitude: 13.096
# Moon/faint-star delta mag: 18.74  flux ratio: 31332857.243155953    orders of magnitude: 7.496
```

Thirteen orders of magnitude, for the Sun, against roughly seven and a half for a full Moon — a gap of nearly six orders of magnitude between the two, or about $4\times10^5$, entirely explained by the fourteen-magnitude difference between them. A baffle stage that comfortably suppresses the Moon to below the noise floor at some angle can be many orders of magnitude short of doing the same for the Sun at that same angle, which is exactly why Sun exclusion cones run wide — typically thirty to forty-five degrees — while Moon exclusion is markedly tighter for the same instrument. Earth's limb, brightened by the sunlight its dayside reflects, subtends a much wider angle from low orbit than the Sun's half-degree disk and stays bright across most of that angle, so its exclusion cone is measured in tens of degrees rather than fractions of one — wide enough that an Earth-observation slew has to treat it as a standing constraint on when the tracker can be trusted, not an occasional inconvenience.
:::

::: warning Keep-out cones are constraints on the command sequence, not on the sensor alone
A slew that carries the Sun, a sunlit Earth limb, or the Moon through a tracker's exclusion cone does not merely degrade that tracker's output for a frame or two — while a bright source sits inside the baffle's rejection angle, the tracker reports nothing usable at all, whatever a residual check downstream might otherwise catch. Attitude planning has to check every candidate slew against the current keep-out geometry before it is commanded, not after, and a vehicle carrying two or three trackers at different orientations still needs at least one of them clear at any moment it depends on stellar attitude. Treating an exclusion cone as a rare edge case rather than a routine planning constraint is how a mission discovers it the day a scheduled maneuver points the wrong instrument at the Sun.
:::

## Bright objects in the frame: blooming and false matches

A source bright enough to matter does more than add one more spot to identify. On a real detector it saturates the pixel wells it falls on, and the excess charge spreads into neighbouring pixels — blooming, on a CCD, or simply many adjacent saturated pixels on a CMOS array — destroying the centroid of anything unlucky enough to sit nearby and sometimes wiping out a whole row or column. The previous lesson's simulation already showed what happens to one *extra*, uncorrelated false detection: the triangle-and-pyramid pipeline almost never matches it to anything, and the residual gate discards it even on the rare pyramid it does slip through. A bright object's more damaging effect is different — it does not add a spot so much as it deletes several real ones, shrinking the number of stars the identification has to work with.

::: example How many stars can a bright object take out before identification fails
Reusing this module's identification pipeline exactly as the previous lesson built it (`identify`, `solve`, `match_triangle`, and the rest, omitted here for brevity), only the observation model changes: a bright source is simulated by keeping a random subset of the real stars actually in the field and discarding the rest, as blooming would.

```python
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
    trials = 80
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
# stars remaining=12: correct=80/80  wrong=0  loss of track=0
# stars remaining=8:  correct=80/80  wrong=0  loss of track=0
# stars remaining=6:  correct=80/80  wrong=0  loss of track=0
# stars remaining=5:  correct=79/80  wrong=1  loss of track=0
# stars remaining=4:  correct=79/80  wrong=0  loss of track=1
# stars remaining=3:  correct=0/80   wrong=0  loss of track=80
```

Identification is essentially unaffected down to six stars, costs the occasional trial at four or five, and fails on every single trial at three. That last row is not a statistical trend reaching its limit — it is exact. The pyramid step needs a *fourth* star to confirm any triangle, so with only three stars in the frame there is no fourth star to find, ever, no matter how favourable the noise. This is the same "loss of track" threshold tracking mode falls back from into lost-in-space acquisition: a bright object bad enough to bloom out most of a sparse field does not merely add noise to the attitude, it can take the tracker offline until the geometry — or the object — moves on.
:::

Practically, flight software does not lean on the residual gate alone to handle a bright solar-system body wandering through the field. Planets, and occasionally bright asteroids, move against the star background in a way no static catalog predicts, so an onboard ephemeris computes where each one will be at any given time and masks a small region around it before centroiding even runs, keeping it from ever becoming a candidate detection. The residual gate is the backstop for what an ephemeris cannot anticipate — a lens ghost, a glint off a deployed solar panel, a cosmic-ray hit on the detector — not the primary defence against a body whose position is already known.

## Check yourself

::: check
Using $\operatorname{trace}(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T})=2$ for a unit vector and $F_{zz}=\sum_i a\sin^2\rho_i$, derive $F_{xx}+F_{yy}$ in terms of the $\rho_i$, and explain why this identity holds exactly regardless of how the stars are scattered in azimuth.
:::

::: answer
Summing the trace over all $N$ stars gives $\operatorname{trace}(\mathbf{F})=F_{xx}+F_{yy}+F_{zz}=2Na$, since $\operatorname{trace}(\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T})=2$ for every unit vector $\mathbf{b}_i$, whatever direction it points. Subtracting $F_{zz}=\sum_i a\sin^2\rho_i$ gives $F_{xx}+F_{yy}=\sum_i a(2-\sin^2\rho_i)$. The identity holds regardless of azimuth because the trace of $\mathbf{I}-\mathbf{b}_i\mathbf{b}_i^\mathsf{T}$ depends only on $\lVert\mathbf{b}_i\rVert$, not on which direction it points; azimuthal scattering is only needed for the separate, weaker claim that $F_{xx}$ and $F_{yy}$ are individually close to equal.
:::

::: check
A different tracker has a $20^\circ$ field of view instead of $15^\circ$. Compute $1/\tan(\rho_{\max})$ and $1/\sin(\rho_{\max})$ for its $10^\circ$ half-angle, compare them to the $7.5^\circ$ values found in this lesson, and explain why the roll-to-cross-boresight ratio improves with a wider field even though the per-star cross-boresight sensitivity barely changes.
:::

::: answer
For $\rho_{\max}=10^\circ$, $1/\tan(10^\circ)=5.671$ and $1/\sin(10^\circ)=5.759$, both smaller than the $15^\circ$ tracker's $7.596$ and $7.661$. A wider field of view lets stars sit farther from the boresight, so $\sin\rho_{\max}$ is larger and $F_{zz}=\sum_i a\sin^2\rho_i$ collects more roll information per star; $F_{xx}$ and $F_{yy}$ hardly move, because $1-\sin^2\rho_i/2$ stays close to $1$ at these angles either way. The ratio improves because the denominator grows, not because the numerator shrinks — a genuinely different mechanism from adding more stars, which raises both $F_{xx}$ and $F_{zz}$ together and improves both accuracies without changing their ratio much.
:::

::: check
A program with a single star tracker giving $3''$ cross-boresight and $28''$ roll considers two fixes: buy a tracker with half the noise on every axis, or mount a second, identical tracker at a different orientation. Using this lesson's numbers, which does more for the worst-direction accuracy, and why?
:::

::: answer
Halving the noise on every axis of a single tracker halves $\sigma$ everywhere, including roll — a factor of $2$ on the worst axis, at the cost of an entirely new, presumably more expensive, instrument. Mounting a second, identical tracker at a different boresight orientation, per this lesson's worked example, improved the worst-axis accuracy by a factor of $9.85$, because it attacks the actual bottleneck — a direction with almost no information at all — with information the first tracker already has an abundance of, rather than incrementally improving a noise floor that was never the limiting factor. As in the least-squares module's own version of this comparison, fixing the geometry beats improving any one sensor when one direction is the one that is starved.
:::

::: check
An operations team doubles a tracker's update rate by halving its exposure time, with everything else about the optics and the star field unchanged. By what factor does the photon-limited centroid noise change, and does this affect roll and cross-boresight accuracy equally?
:::

::: answer
Photon-limited centroid noise scales as $1/\sqrt{N_{\text{photons}}}$, and halving exposure time halves $N_{\text{photons}}$, so the noise increases by a factor of $\sqrt{2}=1.414$. Because that noise enters the weight as $a=1/\sigma_c^2$ and $F$ scales linearly in $a$ on every axis alike — $F_{zz}=\sum_i a\sin^2\rho_i$ and $F_{xx}\approx F_{yy}\approx\sum_i a(1-\sin^2\rho_i/2)$ both scale the same way with $a$ — the standard deviation on every axis scales by the same $\sqrt{2}$, and the roll-to-cross-boresight ratio itself is unchanged. A faster update rate costs accuracy uniformly; it does not selectively worsen the already-weak roll axis.
:::

::: check
Why is a star tracker's Sun exclusion cone so much wider than its Moon exclusion cone, given that both are, geometrically, small bright disks the baffle has to reject?
:::

::: answer
The two disks are not comparably bright. The Sun's apparent magnitude of about $-26.7$ against a full Moon's roughly $-12.7$ is a difference of $14$ magnitudes, a flux ratio of about $4\times10^5$ — the Sun delivers roughly thirteen orders of magnitude more flux than a magnitude-6 catalog star, the Moon roughly seven and a half. A baffle's off-axis suppression improves with angle from the boresight but is finite at any given angle, so reaching a workable noise floor against a source thirteen orders of magnitude brighter than the faintest star takes a substantially larger angular margin than reaching the same floor against a source five to six orders of magnitude fainter than the Sun. The exclusion cone size tracks the source's brightness relative to the faintest star that still has to be trusted, not the source's apparent size.
:::

::: check
Explain, structurally rather than statistically, why the identification pipeline in this lesson's blooming example always fails with exactly three stars in the frame, regardless of noise level or which three stars they are.
:::

::: answer
The pyramid identification scheme confirms a candidate triangle only by finding a *fourth* star whose measured angles to the three triangle stars match a single catalog star consistent with all three. With only three stars present in the entire frame, no fourth star exists to attempt that confirmation against, so the confirmation step can never succeed — not "rarely," but never, by the structure of the algorithm itself. This is why tracking mode's minimum star count before declaring loss of track is set at three: below four stars, lost-in-space re-acquisition by this method is not merely unreliable, it is impossible.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\rho_i=\arccos(b_{i,z})\le\rho_{\max}$ | Angular offset of star $i$ from the boresight; bounded by the half field of view |
| $F_{zz}=\sum_i a\sin^2\rho_i$ | Roll (about-boresight) information; suppressed by $\sin^2\rho_{\max}$ or better |
| $F_{xx}\approx F_{yy}\approx\sum_i a(1-\sin^2\rho_i/2)$ | Cross-boresight information; barely reduced by confinement to the cone |
| $\sigma_{\text{roll}}/\sigma_{\text{cross}} \gtrsim 1/\sin\rho_{\max}\approx1/\tan\rho_{\max}$ | Best-case ratio, from this lesson's F-matrix derivation; $9.6$–$10.2$ found for real fields against a $7.6$ rim-only bound |
| Two trackers, boresights $90^\circ$ apart | Worst-axis accuracy improved $9.85\times$ in this lesson's worked example — geometric diversity, not better sensors |
| Noise $\propto 1/\sqrt{\text{exposure time}}$ | Update rate versus accuracy trade; doubling the rate costs a factor of $\sqrt2$ on every axis equally |
| Sun / faint-star flux ratio $\approx 10^{13.1}$; Moon $\approx 10^{7.5}$ | Why Sun exclusion cones ($30$–$45^\circ$) run far wider than Moon exclusion cones |
| Pyramid needs a 4th star | Below four stars in the frame, identification is structurally impossible, not merely unreliable |
| Ephemeris mask, then residual gate | Known bodies (planets) are excluded before centroiding; the residual gate backstops what an ephemeris cannot predict |

Every number in this lesson came from an instrument looking at points of light scattered thinly across the sky. The next lesson turns to a sensor with the opposite problem — a single, overwhelmingly bright source that is sometimes not there at all — and asks how a handful of photodiodes on a cube turn "which way is the Sun" into a vector, and what Earth's reflected light does to that answer.
