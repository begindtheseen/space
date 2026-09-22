---
id: l01-star-trackers-photons-to-quaternion
title: 'Star trackers: from photons to a quaternion'
minutes: 24
covers:
  - 'Star trackers: optics, centroiding, star catalogs, lost-in-space identification (triangle and pyramid algorithms), tracking mode'
---

A star tracker is a camera that looks at the sky, works out which stars it is seeing, and reports the attitude of its own housing as a quaternion, a few times a second, to a few arcseconds. It is the most accurate attitude sensor a spacecraft carries and the one every fine-pointing mission depends on: an Earth-observation satellite geolocating its pixels, a telescope holding a target on a detector, a deep-space probe aiming a high-gain antenna. Nothing else on the vehicle knows where the stars are, so nothing else can correct the slow drift of the gyros.

The attitude modules gave you the algebra a tracker's output obeys: the direction cosine matrix, the quaternion, how frames compose. The least-squares module gave you the Wahba problem and its solutions. What neither gave you is the instrument. Between a photon arriving at the lens and a quaternion leaving the connector there is a chain of steps — integration, thresholding, centroiding, catalog lookup, pattern identification, a least-squares fit — and every arcsecond in the final accuracy, and every failure mode, lives in one of those steps. This lesson walks the chain once, with a synthetic sky and real numbers, and ends by running a lost-in-space identification on an actual pattern and solving for the attitude.

## The optics and the detector

A tracker's front end is a lens of focal length $f$ in front of a pixelated detector, almost always a CMOS array today, with pixel pitch $p$ and $N$ pixels on a side. Take the boresight as the sensor's $z$ axis. A star in direction $\hat{\mathbf{u}} = (u_x, u_y, u_z)$, in sensor axes, lands at the focal-plane coordinates

$$
x = f\,\frac{u_x}{u_z}, \qquad y = f\,\frac{u_y}{u_z},
$$

the pinhole model with the image plane drawn in front of the lens so that no sign flips appear. Inverting it, a detected spot at $(x, y)$ becomes the unit vector

$$
\hat{\mathbf{b}} = \frac{(x,\ y,\ f)}{\sqrt{x^2 + y^2 + f^2}},
$$

which is the quantity the rest of the tracker works with. Two angular numbers follow from the hardware. The angle subtended by one pixel, the **instantaneous field of view**, is $\mathrm{IFOV} = p/f$ radians; the full **field of view** is $\mathrm{FOV} = 2\arctan\!\big(Np/2f\big)$.

::: example The angular scale of a tracker
Take $f = 28.5\,\mathrm{mm}$, $p = 7.4\,\mathrm{\mu m}$ and a $1024 \times 1024$ array. Then $\mathrm{IFOV} = 7.4\times10^{-6}/0.0285 = 2.596\times10^{-4}\,\mathrm{rad} = 53.6''$ per pixel, and $\mathrm{FOV} = 2\arctan(1024 \times 7.4\times10^{-6}/(2 \times 0.0285)) = 15.15^\circ$. With a $25\,\mathrm{mm}$ aperture the lens is $f/1.14$: fast, because starlight is scarce. If the centroiding step locates a star to $0.05$ pixel, one star fixes its own direction to $0.05 \times 53.6'' = 2.7''$. These are the numbers the rest of the lesson uses.
:::

How much light is there? A magnitude-0 star delivers roughly $1000$ photons per second per square centimetre per ångström of bandwidth at visible wavelengths; over the $\sim 3000\,\text{Å}$ that a silicon detector uses efficiently that is about $3\times10^6\,\mathrm{photons\,s^{-1}\,cm^{-2}}$. Each magnitude step is a factor $10^{0.4} = 2.512$ fainter, so a magnitude-6 star, near the faint limit of a typical onboard catalog, gives $3\times10^6 \times 10^{-2.4} = 1.19\times10^4\,\mathrm{photons\,s^{-1}\,cm^{-2}}$. Through the $4.91\,\mathrm{cm^2}$ aperture above that is $5.86\times10^4$ photons per second; with an optical throughput times quantum efficiency of $0.4$ and a $100\,\mathrm{ms}$ exposure, about $2340$ electrons. That is the whole signal: a few thousand electrons, spread over a handful of pixels, each pixel adding a few electrons of read noise. Everything downstream is an exercise in extracting a direction from that.

## Centroiding

After exposure the frame is thresholded, adjacent bright pixels are grouped into clusters, and each cluster's position is estimated by the **intensity-weighted centroid**

$$
\bar{x} = \frac{\sum_k I_k x_k}{\sum_k I_k}, \qquad \bar{y} = \frac{\sum_k I_k y_k}{\sum_k I_k},
$$

over the pixels $k$ of the cluster with intensities $I_k$ and centres $(x_k, y_k)$. The centroid is where the sub-pixel accuracy comes from, and it has a precondition that surprises people: the star must not be in focus.

Think about a perfectly focused star image, smaller than a pixel. All its photons land in one pixel. The centroid is that pixel's centre, wherever within the pixel the star actually is, and the direction is known to $\pm\tfrac{1}{2}$ pixel and no better. Now defocus the lens so the point-spread function has a width $\sigma_{\mathrm{psf}}$ of half a pixel or so. The light spills into neighbouring pixels in proportions that depend on exactly where the star is, and the weighted centroid reads those proportions. If $N$ photons arrive with a Gaussian spread $\sigma_{\mathrm{psf}}$ and nothing else limited you, the centroid's standard deviation would be the standard error of a mean, $\sigma_{\mathrm{psf}}/\sqrt{N}$: for $\sigma_{\mathrm{psf}} = 0.5$ pixel and $N = 2000$, $0.011$ pixel. Read noise, background and the finite window push the real figure up, and spreading the light too widely puts more noisy pixels under the star. The following simulation drops photons on a $7 \times 7$ window, adds $4$ electrons of read noise per pixel, thresholds at three times the read noise, and measures the error.

```python
import numpy as np

rng = np.random.default_rng(0)

def centroid_rms(sigma_psf, n_photons, read_noise=4.0, trials=3000):
    """RMS centroid error in pixels for a Gaussian star image on a 7x7 window."""
    edges = np.arange(-3.5, 4.5)                      # pixel boundaries
    centres = np.arange(-3, 4)
    err = np.empty((trials, 2))
    for t in range(trials):
        true = rng.uniform(-0.5, 0.5, 2)              # star position inside the central pixel
        n = rng.poisson(n_photons)
        hits = true + sigma_psf * rng.standard_normal((n, 2))
        img, _, _ = np.histogram2d(hits[:, 0], hits[:, 1], bins=[edges, edges])
        img += read_noise * rng.standard_normal(img.shape)
        img[img < 3 * read_noise] = 0.0               # threshold the background
        total = img.sum()
        cx = (img.sum(axis=1) * centres).sum() / total
        cy = (img.sum(axis=0) * centres).sum() / total
        err[t] = (cx - true[0], cy - true[1])
    return np.sqrt(np.mean(err**2))

for sigma_psf in (0.25, 0.5, 0.8):
    row = [f"{centroid_rms(sigma_psf, n):.3f}" for n in (300, 2000)]
    print(f"sigma_psf = {sigma_psf} px:  rms centroid error at 300 and 2000 photons = {row} px")
# sigma_psf = 0.25 px:  rms centroid error at 300 and 2000 photons = ['0.080', '0.066'] px
# sigma_psf = 0.5 px:   rms centroid error at 300 and 2000 photons = ['0.061', '0.017'] px
# sigma_psf = 0.8 px:   rms centroid error at 300 and 2000 photons = ['0.099', '0.025'] px
```

Read the middle column first. With $2000$ photons the sharp image ($\sigma_{\mathrm{psf}} = 0.25$ pixel) is the *worst* of the three, at $0.066$ pixel, and adding photons barely helps it: its error is not noise but a systematic pull toward the pixel centre, sometimes called pixel locking, and no amount of light removes it. The half-pixel image reaches $0.017$ pixel, within a factor of $1.6$ of the photon limit. The wider image spreads its light over more pixels, each contributing read noise, and comes in at $0.025$ pixel; at $300$ photons that penalty grows to $0.099$ pixel, the worst entry in the table. So there is an optimum, near a point-spread function about one pixel wide at half maximum, and a tracker's optics are deliberately built to it.

::: key Sub-pixel centroiding
Defocus the star deliberately across several pixels so an intensity-weighted centroid reaches roughly $1/10$ pixel or better. A perfectly focused point source lands on one pixel and gives you no sub-pixel information at all.
:::

::: warning
Thermal changes move the focus. A tracker qualified with a one-pixel spot can, at a different temperature, sharpen toward pixel locking or bloat into read noise, and both appear in the data as a rise in the noise-equivalent angle with no other symptom. If the accuracy of a tracker degrades with temperature, look at the spot size before anything else.
:::

## The star catalog

The reference the tracker compares against is a catalog of star directions in an inertial frame, built on the ground from Hipparcos, Tycho-2 or Gaia and trimmed to what the instrument can use. A catalog entry with right ascension $\alpha$ and declination $\delta$ becomes the unit vector

$$
\hat{\mathbf{r}} = (\cos\delta\cos\alpha,\ \cos\delta\sin\alpha,\ \sin\delta),
$$

with proper motion applied to bring it to the mission epoch; stellar parallax is far below an arcsecond for every catalog star and is ignored. Three trimming rules matter. Stars are cut at a magnitude limit chosen so that a typical field holds ten to thirty stars: there are about $5000$ stars brighter than magnitude $6$ over the whole sky and about $9000$ brighter than $6.5$, and a circular field of half-angle $\alpha_{\mathrm{h}}$ covers a fraction $(1 - \cos\alpha_{\mathrm{h}})/2$ of the sky, so a $15^\circ$ field ($\alpha_{\mathrm{h}} = 7.5^\circ$, fraction $0.00428$) holds on average $21$ stars from the magnitude-6 catalog. Stars with a neighbour closer than a few pixels are removed, since the centroider would merge them into one spot in the wrong place. Variable stars and stars whose colour makes their detector magnitude unreliable are removed too.

One correction is applied on board rather than on the ground, because it depends on the spacecraft's velocity: **stellar aberration**. A star's apparent direction is tilted toward the direction of motion by an angle $v/c$. Earth's orbital velocity of $29.78\,\mathrm{km/s}$ gives $29.78/299792 = 9.93\times10^{-5}\,\mathrm{rad} = 20.5''$; a low-Earth-orbit velocity of $7.7\,\mathrm{km/s}$ adds up to a further $5.3''$, changing direction around the orbit. Both are many times the accuracy the tracker is sold at, so the catalog vectors, or the measured ones, are corrected using the navigation solution's velocity before comparison. This is also the first place the tracker depends on something outside itself.

## Lost in space: the interstar angle

At power-up, or after a tumble, the tracker has an image full of spots and no idea where it is pointing. This is the **lost-in-space** problem, and it is solved by an invariant. If the true attitude is $\mathbf{A}$, the body-frame direction of star $i$ is $\hat{\mathbf{b}}_i = \mathbf{A}\hat{\mathbf{r}}_i$, and for any two stars

$$
\hat{\mathbf{b}}_i\cdot\hat{\mathbf{b}}_j = (\mathbf{A}\hat{\mathbf{r}}_i)^{\top}(\mathbf{A}\hat{\mathbf{r}}_j) = \hat{\mathbf{r}}_i^{\top}\mathbf{A}^{\top}\mathbf{A}\,\hat{\mathbf{r}}_j = \hat{\mathbf{r}}_i\cdot\hat{\mathbf{r}}_j,
$$

because $\mathbf{A}^{\top}\mathbf{A} = \mathbf{I}$. The angle between two stars is the same in the image as in the catalog, whatever the attitude. So the tracker never searches over attitudes at all. It measures angles between pairs of spots and looks them up in a table of catalog pair angles precomputed on the ground.

::: key The lost-in-space problem
Identify stars with no prior attitude. The invariant used is the interstar angle, which does not change under rotation: match observed angle patterns against a precomputed catalog index.
:::

The table only needs pairs closer than the field of view, since no other pair can appear in one image. Stored sorted by angle, it is searched by bisection in logarithmic time; this sorted, indexed table is what the literature calls a k-vector. Its size, and the ambiguity of a single lookup, are worth computing.

::: example How ambiguous is one angle?
A catalog of $3000$ stars has $3000 \times 2999/2 = 4.50\times10^6$ pairs. A second star lies within $15^\circ$ of a first with probability $(1 - \cos 15^\circ)/2 = 0.0170$, so about $76{,}600$ pairs go into the index for a $15^\circ$ field; the synthetic catalog below produces $76{,}597$. A measured angle carries the noise of two centroids: with $10''$ per star per axis, the angle noise is $10\sqrt{2} = 14.1''$, and a $3\sigma$ tolerance is $\pm 42.4''$. The index holds $76{,}600$ angles spread over $15^\circ = 54{,}000''$, on average $1.42$ per arcsecond, so a window $84.8''$ wide contains about $120$ candidate pairs; the run below finds $139$ for its first angle. One angle narrows $4.5$ million pairs to a hundred-odd, which is useful and nowhere near an answer.
:::

## Triangles, handedness, and the pyramid

Three observed stars give three angles, and a catalog triple must match all three. The false-match rate drops sharply, since the second and third angles must each hold within the same tolerance for the same three stars. But a subtlety remains that the angle invariant hides: angles are also preserved by *reflections*. A star pattern and its mirror image have identical interstar angles, so a catalog triple that is the mirror of the observed one passes the test. The cure is the sign of the triple product $(\hat{\mathbf{u}}\times\hat{\mathbf{v}})\cdot\hat{\mathbf{w}}$, which a rotation preserves and a reflection flips; require the candidate to have the same handedness. In the run below, the handedness check cuts the wrong triangle matches in one field from $27$ to $8$.

Eight wrong triangles in a field of $286$ is still eight ways to report the wrong attitude, and it is why identification does not stop at a triangle. Two schemes are in use. **Triangle voting** matches every triple in the image, casts a vote for each implied observed-to-catalog assignment, and accepts assignments with many votes: true stars accumulate votes from every triangle they take part in, false matches scatter theirs. The **pyramid** scheme, due to Mortari, is more direct. Take a matched triangle and ask whether a *fourth* observed star has a catalog counterpart at the right angle from all three catalog stars. A true triangle confirms at once; a false one almost never does, because the fourth star would have to sit at the intersection of three narrow annuli on the sky by pure chance. Then use the confirmed four to solve a provisional attitude, predict where every catalog star should fall, and identify the rest of the image by proximity. A spot with no catalog star near its prediction is a false detection — a hot pixel, a planet, a piece of debris — and is dropped.

::: key Pyramid star identification
Triangle matching votes on triples of stars; the pyramid step confirms with a fourth star consistent with all three angles. The confirmation is what collapses the false-identification rate in a crowded or noisy field.
:::

Here is the whole thing on a synthetic sky: $3000$ stars placed uniformly, a $15^\circ$ field, $10''$ centroid noise and one false detection. The attitude at the end comes from the SVD solution to the Wahba problem, which the least-squares module derived: with the attitude profile matrix $\mathbf{B} = \sum_i \hat{\mathbf{b}}_i\hat{\mathbf{r}}_i^{\top} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^{\top}$, the optimal rotation is $\mathbf{A} = \mathbf{U}\,\mathrm{diag}(1, 1, \det\mathbf{U}\det\mathbf{V})\,\mathbf{V}^{\top}$.

```python
import numpy as np
from itertools import combinations

rng = np.random.default_rng(1)
arcsec = np.radians(1 / 3600)

# --- a synthetic sky: 3000 stars, roughly the count brighter than magnitude 5.5
n_cat = 3000
cat = rng.standard_normal((n_cat, 3))
cat /= np.linalg.norm(cat, axis=1, keepdims=True)

# --- the interstar-angle index: every catalog pair closer than the 15 degree field
fov = np.radians(15.0)
i, j = np.triu_indices(n_cat, 1)
cosang = (cat @ cat.T)[i, j]
keep = cosang > np.cos(fov)
order = np.argsort(-cosang[keep])                 # ascending angle
pair_i, pair_j = i[keep][order], j[keep][order]
pair_ang = np.arccos(cosang[keep][order])
print(len(pair_ang))                              # 76597 pairs in the index

def angle(u, v):
    return np.arccos(np.clip(u @ v, -1.0, 1.0))

def pairs_near(ang, tol):
    lo, hi = np.searchsorted(pair_ang, [ang - tol, ang + tol])
    return zip(pair_i[lo:hi], pair_j[lo:hi])

def partners(ang, tol):
    """Catalog star -> the catalog stars at angle ang (within tol) from it."""
    m = {}
    for a, b in pairs_near(ang, tol):
        m.setdefault(a, set()).add(b)
        m.setdefault(b, set()).add(a)
    return m

def match_triangle(u, v, w, tol):
    """Catalog triples (I, J, K) with the interstar angles and the handedness of (u, v, w)."""
    M_vw, M_wu = partners(angle(v, w), tol), partners(angle(w, u), tol)
    hand = np.sign(np.cross(u, v) @ w)
    out = []
    for a, b in pairs_near(angle(u, v), tol):
        for I, J in ((a, b), (b, a)):             # either catalog star may play u
            for K in M_vw.get(J, ()):
                if K in M_wu.get(I, ()) and np.sign(np.cross(cat[I], cat[J]) @ cat[K]) == hand:
                    out.append((I, J, K))
    return out

def identify(obs, tol):
    """Pyramid identification: the first triangle a fourth star confirms wins."""
    n = len(obs)
    for a, b, c in combinations(range(n), 3):
        for I, J, K in match_triangle(obs[a], obs[b], obs[c], tol):
            for r in range(n):
                if r in (a, b, c):
                    continue
                R = set(partners(angle(obs[a], obs[r]), tol).get(I, ()))
                R &= partners(angle(obs[b], obs[r]), tol).get(J, set())
                R &= partners(angle(obs[c], obs[r]), tol).get(K, set())
                if len(R) == 1:
                    return {a: int(I), b: int(J), c: int(K), r: int(R.pop())}
    return {}

def wahba_svd(b, r):
    """Rotation minimising sum |b_i - A r_i|^2: the SVD method of the least-squares module."""
    U, _, Vt = np.linalg.svd(b.T @ r)
    d = np.sign(np.linalg.det(U) * np.linalg.det(Vt))
    return U @ np.diag([1.0, 1.0, d]) @ Vt

def solve(obs, ident, gate):
    """Attitude from the identified stars, then every star matched against the prediction."""
    ids = list(ident)
    A = wahba_svd(obs[ids], cat[[ident[k] for k in ids]])
    for _ in range(2):                            # identify everything, resolve, check residuals
        pred = cat @ A.T
        ident = {k: int(np.argmax(pred @ u)) for k, u in enumerate(obs)}
        ident = {k: s for k, s in ident.items() if angle(pred[s], obs[k]) < gate}
        ids = list(ident)
        A = wahba_svd(obs[ids], cat[[ident[k] for k in ids]])
    resid = np.array([angle(A @ cat[ident[k]], obs[k]) for k in ids])
    return A, ident, resid

# --- one exposure: a true attitude, 10 arcsec centroid noise, one false detection
def rotation(axis, ang):
    k = np.asarray(axis, float) / np.linalg.norm(axis)
    K = np.array([[0, -k[2], k[1]], [k[2], 0, -k[0]], [-k[1], k[0], 0]])
    return np.eye(3) + np.sin(ang) * K + (1 - np.cos(ang)) * K @ K

def observe(A, sigma=10 * arcsec, n_false=1):
    body = cat @ A.T
    seen = np.flatnonzero(body[:, 2] > np.cos(fov / 2))       # boresight is body +z
    obs = body[seen] + sigma * rng.standard_normal((len(seen), 3))
    false = np.column_stack([rng.uniform(-0.1, 0.1, (n_false, 2)), np.ones(n_false)])
    obs = np.vstack([obs, false])
    obs /= np.linalg.norm(obs, axis=1, keepdims=True)
    return obs, np.concatenate([seen, -np.ones(n_false, int)])   # -1 marks a false star

A_true = rotation([0.3, -0.5, 0.8], 1.1)
obs, truth = observe(A_true)
tol = 3 * np.sqrt(2) * 10 * arcsec                # 3 sigma on an angle between two noisy stars
print(len(obs), sum(truth >= 0))                  # 13 12   -> 13 spots, 12 of them real stars
print(sum(1 for _ in pairs_near(angle(obs[0], obs[1]), tol)))   # 139 catalog pairs match ONE angle

pyramid = identify(obs, tol)
print(pyramid)                                    # {0: 3, 1: 181, 2: 446, 3: 651}
A, ident, resid = solve(obs, pyramid, gate=3 * tol)
print(len(ident), all(ident[k] == truth[k] for k in ident), (len(obs) - 1) in ident)
# 12 True False   -> all 12 real stars identified correctly; the false one is not
print(np.round(resid / arcsec, 1))                # per-star residuals, arcsec
# [ 8.7  7.7 16.2 11.   3.5  8.9 11.1 21.7 10.2  8.9  5.9 23.4]
dA = A @ A_true.T                                 # error rotation, body axes
err = 0.5 * np.array([dA[2, 1] - dA[1, 2], dA[0, 2] - dA[2, 0], dA[1, 0] - dA[0, 1]])
print(np.round(err / arcsec, 1))                  # [-4.3 -1.8 53.2]
```

Read the output line by line. The first triangle a fourth star confirms is stars $0$, $1$, $2$ with $3$ as the confirming star, all four correctly assigned. The provisional attitude then identifies all twelve real stars and leaves the false detection, spot $12$, unassigned: no catalog star sits within the gate of its predicted position. The per-star residuals run from $3.5''$ to $23.4''$, consistent with $10''$ noise in each of two tangent-plane axes. And the attitude error is $4.3''$ and $1.8''$ about the two cross-boresight axes but $53''$ about the boresight itself. That last number is not a fluke of this draw; it is the geometry of the instrument, and it is the subject of the next lesson.

The residual line is the safety net that the pyramid is not. At a looser $4\sigma$ tolerance, an exhaustive scan of this same field confirmed $227$ pyramids of which $7$ were wrong, all of them swapping catalog stars $181$ and $1878$, which lie $305''$ apart with the other stars of the field sitting almost perpendicular to the line joining them, so their angles to those stars agree within tolerance. The four-star solution built on the swap had residuals of $121''$ and $145''$ on two of its stars, twelve and fifteen times the noise, and a roll error of $1028''$; the residual gate in `solve` rejected the swapped star and the final answer was correct. The pyramid confirms the *pattern*. Only the residuals confirm each *star*.

How reliable is the whole procedure? The following block reuses the functions above on $200$ random attitudes with three false detections in every image.

```python
def random_rotation():
    Q, _ = np.linalg.qr(rng.standard_normal((3, 3)))
    return Q if np.linalg.det(Q) > 0 else -Q

n_ok = n_wrong = n_none = n_tri_wrong = 0
for _ in range(200):
    obs, truth = observe(random_rotation(), n_false=3)
    first = next(((a, b, c), m) for a, b, c in combinations(range(len(obs)), 3)
                 for m in [match_triangle(obs[a], obs[b], obs[c], tol)] if m)
    (a, b, c), m = first
    if list(m[0]) != [truth[a], truth[b], truth[c]]:
        n_tri_wrong += 1                          # the first matching triangle is wrong
    pyramid = identify(obs, tol)
    if not pyramid:
        n_none += 1
        continue
    _, ident, _ = solve(obs, pyramid, gate=3 * tol)
    if all(ident[k] == truth[k] for k in ident) and len(ident) == sum(truth >= 0):
        n_ok += 1
    else:
        n_wrong += 1
print(n_ok, n_wrong, n_none, n_tri_wrong)         # 200 0 0 2
```

Two hundred fields, two hundred correct identifications of every real star with every false star rejected, and no field where identification failed. Trusting the first matching triangle instead would have been wrong in two fields of the two hundred. The module's coding exercise asks you to push this further, measuring the identification and false-identification rates against centroid noise and against the number of spurious detections; the functions here are a starting point, not a finished answer.

::: warning
The tolerance is a knob with two failure modes. Too tight, and a star with an unlucky centroid finds no catalog partner, the pyramid never confirms, and the tracker reports no attitude. Too loose, and the candidate lists grow, wrong triangles multiply, and the near-doubles that a real catalog is full of start to swap. Set it from the measured centroid noise, at three to four standard deviations of the *angle* noise, which is $\sqrt{2}$ times the per-star figure, and let the residual check catch what slips through.
:::

## Tracking mode

Lost-in-space identification is expensive, a second or more of processing on a flight computer, and it is run only when needed. Once an attitude is known, the tracker switches to **tracking mode**. From the last attitude, and a rate estimate from its own recent frames or from a gyro feed, it predicts where each identified star will fall in the next exposure, reads out only small windows around those predictions, centroids within them, and matches each spot to its predicted star by proximity. No pattern search is needed. Stars leaving the field are dropped; catalog stars entering it are predicted, looked for, and picked up. This is why a tracker runs at $5$ to $10\,\mathrm{Hz}$ with a fraction of the processing of an initial acquisition, and why its output arrives with a nearly constant latency: exposure, readout, centroiding, a small least-squares fit.

Tracking mode also defines the tracker's operational limits. If the vehicle slews faster than the prediction can follow, or the stars smear into streaks the centroider rejects, the tracked-star count falls; below a minimum, usually three, the tracker declares loss of track and returns to lost-in-space acquisition. The time stamp on each quaternion refers to the middle of the exposure, not to the moment the message leaves the connector, and a filter that ignores the difference at a slew rate of $1^\circ/\mathrm{s}$ and a latency of $100\,\mathrm{ms}$ introduces a $360''$ error into an instrument accurate to a few arcseconds.

::: example From a spot to a unit vector
A star is centroided at $(x, y) = (2.4180\,\mathrm{mm},\ -1.1050\,\mathrm{mm})$ on the tracker above, with $f = 28.5\,\mathrm{mm}$. The unnormalised direction is $(2.4180, -1.1050, 28.5)$ with norm $\sqrt{2.4180^2 + 1.1050^2 + 28.5^2} = 28.624\,\mathrm{mm}$, so $\hat{\mathbf{b}} = (0.08448, -0.03861, 0.99567)$, a star $5.33^\circ$ from the boresight. A centroid error of $0.05$ pixel $= 0.37\,\mathrm{\mu m}$ moves it by $0.37\times10^{-3}/28.5 = 1.3\times10^{-5}\,\mathrm{rad} = 2.7''$, the figure from the first example: the unit-vector step is linear at this scale and neither adds nor removes accuracy.
:::

## Check yourself

::: check
A tracker has $f = 50\,\mathrm{mm}$, $5.5\,\mathrm{\mu m}$ pixels and a $2048 \times 2048$ array. What are its IFOV and full field of view, and what angular accuracy does a $0.1$-pixel centroid give for a single star?
:::

::: answer
$\mathrm{IFOV} = 5.5\times10^{-6}/0.050 = 1.10\times10^{-4}\,\mathrm{rad} = 22.7''$. The half-width of the array is $1024 \times 5.5\,\mathrm{\mu m} = 5.632\,\mathrm{mm}$, so $\mathrm{FOV} = 2\arctan(5.632/50) = 12.85^\circ$. A $0.1$-pixel centroid is $2.3''$ per star. Compared with the lesson's tracker this one has finer pixels and a narrower field, and it will therefore see fewer stars per image from the same catalog; the next lesson shows how that trade plays out in the about-boresight accuracy.
:::

::: check
A magnitude-6 catalog has $5000$ stars. How many stars does a circular $20^\circ$ field hold on average, and how many pairs does the interstar-angle index for that field contain?
:::

::: answer
The half-angle is $10^\circ$ and the sky fraction is $(1 - \cos 10^\circ)/2 = 0.00760$, so the field holds $5000 \times 0.00760 = 38$ stars on average. The index needs every pair closer than $20^\circ$: $5000 \times 4999/2 = 1.25\times10^7$ pairs, times $(1 - \cos 20^\circ)/2 = 0.0302$, about $377{,}000$ entries. Both numbers grow quickly with the field: a wide field sees more stars, which helps the attitude, and stores more pairs, which slows and confuses the lookup.
:::

::: check
Why does the triangle matcher check the sign of $(\hat{\mathbf{u}}\times\hat{\mathbf{v}})\cdot\hat{\mathbf{w}}$ as well as the three angles?
:::

::: answer
Because interstar angles are invariant not only under rotations but under reflections, and a mirror image of a star triangle has exactly the same three angles. A catalog triple that is the mirror of the observed one therefore passes the angle test but cannot be brought onto the observation by any rotation. The triple product is a signed volume; rotations preserve its sign and reflections reverse it, so requiring the same sign discards the mirror candidates. In the lesson's field it removed $19$ of the $27$ wrong triangle matches.
:::

::: check
A deep-space probe is moving at $32\,\mathrm{km/s}$ relative to the solar-system barycentre. By how much is a star's apparent direction displaced, at most, and why must the tracker or its host correct for it?
:::

::: answer
The aberration angle is $v/c = 32/299792 = 1.07\times10^{-4}\,\mathrm{rad} = 22.0''$ for a star perpendicular to the velocity, and smaller by $\sin\theta$ for a star at angle $\theta$ from it. A tracker accurate to a few arcseconds that compared uncorrected measurements against the catalog would report an attitude wrong by up to $22''$, and the error would rotate with the velocity direction over the mission. The correction needs the velocity vector, which only the navigation solution knows, so it is the first dependence of the tracker on the rest of the system.
:::

::: check
In the worked identification, spot $12$ was a false detection. Describe, step by step, what happened to it and why it did no damage.
:::

::: answer
Every triangle containing spot $12$ had one angle that matched no true pattern, so those triangles either found no catalog triple or, rarely, a chance one; none of the chance ones could be confirmed by a fourth star, because that would have required a catalog star at the intersection of three annuli by accident. The confirmed pyramid was built entirely from real stars. When the provisional attitude predicted every catalog star's position, no catalog star fell within the gate of spot $12$, so it was left unassigned and did not enter the final Wahba solution. Its only cost was processing time.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $x = f u_x/u_z$, $y = f u_y/u_z$ | Pinhole projection of a star direction onto the focal plane |
| $\hat{\mathbf{b}} = (x, y, f)/\sqrt{x^2 + y^2 + f^2}$ | Measured unit vector from a centroid |
| $\mathrm{IFOV} = p/f$, $\mathrm{FOV} = 2\arctan(Np/2f)$ | Angular pixel scale and full field; $53.6''$ and $15.15^\circ$ for the reference tracker |
| $\bar{x} = \sum I_k x_k / \sum I_k$ | Intensity-weighted centroid; needs a defocused spot about one pixel wide |
| $\sigma_{\mathrm{psf}}/\sqrt{N}$ | Photon-limited centroid error; $0.011$ px at $\sigma_{\mathrm{psf}} = 0.5$ px, $N = 2000$ |
| $\hat{\mathbf{r}} = (\cos\delta\cos\alpha, \cos\delta\sin\alpha, \sin\delta)$ | Catalog unit vector from right ascension and declination |
| $v/c$ | Stellar aberration; $20.5''$ for Earth's orbital speed, $5.3''$ for LEO |
| $\hat{\mathbf{b}}_i\cdot\hat{\mathbf{b}}_j = \hat{\mathbf{r}}_i\cdot\hat{\mathbf{r}}_j$ | The interstar angle is invariant under rotation: the basis of lost-in-space identification |
| $\mathrm{sign}\,(\hat{\mathbf{u}}\times\hat{\mathbf{v}})\cdot\hat{\mathbf{w}}$ | Handedness; angles alone cannot tell a pattern from its mirror image |
| Triangle, then pyramid, then residuals | Match three angles; confirm with a fourth star; check every star against the solved attitude |
| $\mathbf{A} = \mathbf{U}\,\mathrm{diag}(1,1,\det\mathbf{U}\det\mathbf{V})\mathbf{V}^{\top}$ | SVD solution of the Wahba problem from $\mathbf{B} = \sum_i \hat{\mathbf{b}}_i\hat{\mathbf{r}}_i^{\top}$ |
| Tracking mode | Predict, window, centroid, match by proximity; $5$ to $10\,\mathrm{Hz}$; fall back to lost-in-space below three stars |

The identification in this lesson ended with an attitude error of $4''$ across the boresight and $53''$ about it. The next lesson explains that ratio from the geometry of the field, derives the covariance of a tracker's output, and follows the consequences through a pointing budget, the update rate, the keep-out cones around the Sun, Earth and Moon, and the baffle that makes the whole instrument possible.
