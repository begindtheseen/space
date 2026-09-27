---
id: l01-star-trackers-photons-to-quaternion
title: 'Star trackers: from photons to a quaternion'
minutes: 27
covers:
  - 'Star trackers: optics, centroiding, star catalogs, lost-in-space identification (triangle and pyramid algorithms), tracking mode'
---

Imagine waking up in an open field at night with no idea which way you are facing. No compass, no phone. Then you look up. If you know the sky, you spot the Big Dipper, follow it to the North Star, and now you know exactly which way you face. You did not need a map of the field. You needed a map of the *sky*, and the skill to recognise a pattern of dots in it.

A **star tracker** does exactly that, for a spacecraft. It is a small camera that looks at the sky, works out which stars it is seeing, and reports which way its own box is pointing. It sends that answer out as a **[[quaternion|quaternion]]** — four numbers that describe a 3-D orientation — a few times every second. Its accuracy is a few **[[arcseconds|arcsecond]]**, where one arcsecond is $1/3600$ of a degree. It is the most accurate attitude sensor a spacecraft carries. An Earth-observation satellite needs it to know where each pixel landed on the ground. A space telescope needs it to hold a target on its detector. A deep-space probe needs it to aim its antenna at Earth. And the gyros, which measure turning, slowly **[[drift|gyro-drift]]**; only the stars can correct them.

The attitude modules gave you the maths a tracker's output obeys, and the least-squares module gave you the Wahba problem. This lesson is about the instrument in between. From a photon hitting the lens to a quaternion leaving the connector there is a chain: collect light, find bright spots, locate each spot precisely, look up a star catalog, recognise the pattern, fit an attitude. Every arcsecond of accuracy, and every way it can fail, lives in one of those steps. We walk the chain once, with real numbers, and finish by identifying stars in a made-up sky.

## The optics and the detector

The front of a tracker is a lens with **focal length** $f$ — the distance from the lens to where it forms a sharp image. Behind it sits a **detector**, a grid of light-sensitive pixels (almost always a CMOS chip today, like a phone camera's). Each pixel is $p$ wide (the **pixel pitch**), and there are $N$ pixels on a side.

Call the direction the camera looks its **boresight**, and make it the sensor's $z$ axis. A star in direction $\hat{\mathbf{u}} = (u_x, u_y, u_z)$ ("u hat", a unit vector, measured in sensor axes) lands on the focal plane at

$$
x = f\,\frac{u_x}{u_z}, \qquad y = f\,\frac{u_y}{u_z}.
$$

This is the **[[pinhole model|pinhole-picture]]**. Similar triangles give it: a star tilted a little sideways lands a little off-centre, and the offset grows with $f$. Here the image plane is drawn in front of the lens, so no minus signs appear. Run it backwards and a spot at $(x, y)$ becomes the unit vector

$$
\hat{\mathbf{b}} = \frac{(x,\ y,\ f)}{\sqrt{x^2 + y^2 + f^2}},
$$

("b hat", b for *body*). That vector is what the rest of the tracker works with.

Two angles follow from the hardware. The angle one pixel covers is the **instantaneous field of view**, $\mathrm{IFOV} = p/f$ radians. The whole width of sky the camera sees is the **field of view**, $\mathrm{FOV} = 2\arctan\!\big(Np/2f\big)$: half the detector's width, $Np/2$, over $f$, gives the tangent of the half-angle.

::: example The angular scale of a tracker
Take $f = 28.5\,\mathrm{mm}$, $p = 7.4\,\mathrm{\mu m}$ and a $1024 \times 1024$ detector.

**One pixel.** $\mathrm{IFOV} = 7.4\times10^{-6}/0.0285 = 2.596\times10^{-4}\,\mathrm{rad}$. Multiply by $206\,265$ arcseconds per radian: $53.6''$ per pixel.

**The whole field.** $\mathrm{FOV} = 2\arctan(1024 \times 7.4\times10^{-6}/(2 \times 0.0285)) = 15.15^\circ$.

**The lens.** With a $25\,\mathrm{mm}$ opening (the **aperture**), the lens is "$f/1.14$" (focal length over aperture, $28.5/25$). That is a fast lens, because starlight is scarce.

**One star.** If we can locate a star's spot to $0.05$ pixel, we know that star's direction to $0.05 \times 53.6'' = 2.7''$.

Sanity check: $15^\circ$ is about the width of your hand held at arm's length, a sensible patch of sky. The rest of the lesson uses these numbers.
:::

How much light is there? Astronomers measure brightness in **[[magnitudes|magnitude-scale]]**, where bigger numbers mean fainter stars. A magnitude-0 star sends roughly $1000$ photons per second, per square centimetre, per ångström of wavelength band (an ångström is $10^{-10}\,\mathrm{m}$). A silicon detector uses about $3000$ ångströms well, so that is about $3\times10^6$ photons per second per square centimetre. Each step of one magnitude is a factor of $10^{0.4} = 2.512$ fainter. So a magnitude-6 star, near the faint limit of a typical onboard catalog, gives

$$
3\times10^6 \times 10^{-2.4} = 1.19\times10^4\ \text{photons per second per cm}^2.
$$

The $25\,\mathrm{mm}$ aperture has area $4.91\,\mathrm{cm^2}$, so $5.86\times10^4$ photons per second get in. About $40\%$ of them survive the optics and get turned into electrons (this fraction is the throughput times the **quantum efficiency**). In a $100\,\mathrm{ms}$ exposure that leaves about $2340$ electrons. That is the whole signal: a few thousand electrons, spread over a handful of pixels, and each pixel adds a few electrons of random **read noise** of its own. Everything after this is about squeezing a direction out of that.

## Centroiding

After the exposure, the tracker keeps only pixels brighter than a **threshold**, groups touching bright pixels into clusters, and finds each cluster's centre with the **intensity-weighted centroid**

$$
\bar{x} = \frac{\sum_k I_k x_k}{\sum_k I_k}, \qquad \bar{y} = \frac{\sum_k I_k y_k}{\sum_k I_k}.
$$

Read $\bar{x}$ as "x bar", the average position. The sum runs over the pixels $k$ in the cluster; $I_k$ is how bright pixel $k$ is and $(x_k, y_k)$ is its centre. It is a balance point: a seesaw loaded with each pixel's brightness balances at $\bar{x}$.

The centroid is where accuracy finer than a pixel comes from. And it has a surprising requirement: **the star must be out of focus.**

Picture a perfectly focused star, a dot smaller than one pixel. All its light lands in one pixel. The centroid is then that pixel's centre, no matter where inside the pixel the star really is. You know the direction to half a pixel and no better. Now blur the lens a little, so the spot — its **point-spread function** — has a width $\sigma_{\mathrm{psf}}$ ("sigma psf") of about half a pixel. The light now spills into the neighbours, in shares that depend on exactly where the star sits. The weighted centroid reads those shares and finds the star between pixel centres.

How well can it do? If $N$ photons arrive, each scattered with spread $\sigma_{\mathrm{psf}}$, the centroid is an average of $N$ positions. An average of $N$ random numbers wobbles by the spread divided by $\sqrt{N}$, so the best possible error is $\sigma_{\mathrm{psf}}/\sqrt{N}$. For $\sigma_{\mathrm{psf}} = 0.5$ pixel and $N = 2000$, that is $0.011$ pixel. Read noise, background light and the small window push the real figure up. And spreading the light too widely puts more noisy pixels under the star. The simulation below drops photons on a $7 \times 7$ window, adds $4$ electrons of read noise per pixel, throws away pixels below three times the read noise, and measures the error.

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

Read the $2000$-photon column first. The sharpest image ($\sigma_{\mathrm{psf}} = 0.25$ pixel) is the *worst*, at $0.066$ pixel, and more light barely helps it. Its error is not random noise. It is a steady pull toward the pixel centre, called **[[pixel locking|pixel-locking]]**, and no amount of light removes it. The half-pixel spot reaches $0.017$ pixel, within a factor of $1.6$ of the photon limit. The widest spot spreads its light over more pixels, each adding read noise, and gets $0.025$ pixel. At only $300$ photons that penalty grows to $0.099$ pixel, the worst entry in the table. So there is a best blur: a spot about one pixel wide at half its peak brightness. Tracker optics are deliberately built to it.

::: key Sub-pixel centroiding
Defocus the star deliberately across several pixels so an intensity-weighted centroid reaches roughly $1/10$ pixel or better. A perfectly focused point source lands on one pixel and gives you no sub-pixel information at all.
:::

::: warning
Temperature moves the focus. A tracker tested with a one-pixel spot can, when hotter or colder, sharpen toward pixel locking or bloat into read noise. Either one shows up in the data only as a rise in the angle noise, with no other symptom. If a tracker's accuracy gets worse with temperature, check the spot size before anything else.
:::

## The star catalog

To recognise stars, the tracker needs a list to compare against: a **star catalog**, holding each star's direction in an inertial (non-rotating) frame. It is built on the ground from big survey **[[catalogs|star-surveys]]** such as Hipparcos, Tycho-2 or Gaia, then trimmed to what this instrument can use. Each entry gives a star's **right ascension** $\alpha$ ("alpha", its longitude on the sky) and **declination** $\delta$ ("delta", its latitude). These become the unit vector

$$
\hat{\mathbf{r}} = (\cos\delta\cos\alpha,\ \cos\delta\sin\alpha,\ \sin\delta),
$$

("r hat", r for *reference*). Stars drift slowly across the sky over the years (their **proper motion**), so that is applied to bring the catalog to the mission date. The small wobble from Earth's changing viewpoint (**parallax**) is far below an arcsecond for every catalog star, so it is ignored.

Three trimming rules matter.

1. **Brightness cut.** Keep stars brighter than a limit chosen so a typical image holds ten to thirty stars. About $5000$ stars are brighter than magnitude $6$ over the whole sky, and about $9000$ brighter than $6.5$. A circular field of half-angle $\alpha_{\mathrm{h}}$ covers a fraction $(1 - \cos\alpha_{\mathrm{h}})/2$ of the sky. So a $15^\circ$ field ($\alpha_{\mathrm{h}} = 7.5^\circ$, fraction $0.00428$) holds on average $5000 \times 0.00428 \approx 21$ stars from the magnitude-6 catalog.
2. **Close pairs out.** A star with a neighbour closer than a few pixels is removed. The centroider would merge the two into one spot, in the wrong place.
3. **Unreliable stars out.** Stars that change brightness, and stars whose colour makes their brightness on this detector hard to predict, are removed too.

One correction must be made on board, because it depends on the spacecraft's own speed: **[[stellar aberration|aberration]]**. A moving observer sees every star tilted toward its direction of motion, by an angle of about $v/c$ (speed over the speed of light). Earth's orbital speed of $29.78\,\mathrm{km/s}$ gives $29.78/299792 = 9.93\times10^{-5}\,\mathrm{rad}$, which is $20.5''$. A low-Earth-orbit speed of $7.7\,\mathrm{km/s}$ adds up to another $5.3''$, changing direction around each orbit. Both are many times the accuracy the tracker is sold at. So the catalog vectors, or the measured ones, are corrected using the velocity from the navigation system. This is the first place the tracker depends on something outside itself.

## Lost in space: the interstar angle

Switch the tracker on, or let the spacecraft tumble, and it faces an image full of spots with no idea where it is pointing. This is the **lost-in-space** problem. It is the field-at-night problem from the start of the lesson.

The trick is something that does not change when you turn around. Hold two fingers up at two stars. The angle between your fingers is the same whether you face north or south, stand on your head, or spin. Turning your body changes where the stars appear, but not how far apart they are.

In symbols: if the true attitude is the rotation matrix $\mathbf{A}$, the body-frame direction of star $i$ is $\hat{\mathbf{b}}_i = \mathbf{A}\hat{\mathbf{r}}_i$. For any two stars,

$$
\hat{\mathbf{b}}_i\cdot\hat{\mathbf{b}}_j = (\mathbf{A}\hat{\mathbf{r}}_i)^{\top}(\mathbf{A}\hat{\mathbf{r}}_j) = \hat{\mathbf{r}}_i^{\top}\mathbf{A}^{\top}\mathbf{A}\,\hat{\mathbf{r}}_j = \hat{\mathbf{r}}_i\cdot\hat{\mathbf{r}}_j,
$$

because a rotation matrix satisfies $\mathbf{A}^{\top}\mathbf{A} = \mathbf{I}$. The dot product of two unit vectors is the cosine of the angle between them. So the **interstar angle** — the angle between two stars — is the same in the image as in the catalog, whatever the attitude. The tracker never has to search over attitudes. It measures angles between pairs of spots and looks them up in a table of catalog angles, computed on the ground ahead of time.

::: key The lost-in-space problem
Identify stars with no prior attitude. The invariant used is the interstar angle, which does not change under rotation: match observed angle patterns against a precomputed catalog index.
:::

The table only needs pairs closer than the field of view, because no wider pair can appear in one image. Stored sorted by angle, it can be searched by repeatedly halving the range (**bisection**), which is fast even for millions of entries. This sorted, indexed table is what the research papers call a **k-vector**. How big is it, and how much does one angle narrow things down?

::: example How ambiguous is one angle?
**Size of the table.** A catalog of $3000$ stars has $3000 \times 2999/2 = 4.50\times10^6$ pairs. A second star lies within $15^\circ$ of a first with probability $(1 - \cos 15^\circ)/2 = 0.0170$. So about $4.50\times10^6 \times 0.0170 \approx 76{,}600$ pairs go into the index for a $15^\circ$ field. The synthetic catalog below gives $76{,}597$.

**Noise on one angle.** An angle involves two centroids, and their errors add like the sides of a right triangle. With $10''$ per star per axis, the angle noise is $10\sqrt{2} = 14.1''$. A three-sigma window is $\pm 42.4''$, which is $84.8''$ wide.

**How many pairs fit in the window.** The index spreads $76{,}600$ angles over $15^\circ = 54{,}000''$, about $1.42$ per arcsecond. So the window holds about $1.42 \times 84.8 \approx 120$ candidate pairs. The run below finds $139$ for its first angle.

One angle narrows $4.5$ million pairs to a hundred or so. That is useful, and nowhere near an answer.
:::

## Triangles, handedness, and the pyramid

Three spots give three angles, and a catalog triple must match all three. That cuts the false matches sharply, because the second and third angles must also fit, for the same three stars.

But the angle trick hides a catch. Angles are also unchanged by a **[[mirror image|mirror-triangle]]**. A star pattern and its reflection have exactly the same angles, so a catalog triple that is the mirror of what we see passes the test. The fix is the sign of the **triple product** $(\hat{\mathbf{u}}\times\hat{\mathbf{v}})\cdot\hat{\mathbf{w}}$. It measures whether going $u \to v \to w$ turns one way or the other. A rotation keeps that sign; a reflection flips it. So we demand that the candidate turns the same way — has the same **handedness**. In the run below, the handedness check cuts the wrong triangle matches in one field from $27$ to $8$.

Eight wrong triangles among the $286$ triangles in that field is still eight ways to report a wrong attitude. So identification does not stop at a triangle. Two schemes are used.

- **Triangle voting.** Match every triangle in the image. Each match casts a vote for "spot 3 is catalog star 181", and so on. Accept the assignments with many votes. True stars collect votes from every triangle they are in; false matches scatter theirs.
- **The pyramid.** This scheme, due to Daniele Mortari, is more direct. Take a matched triangle and ask: is there a *fourth* spot whose angles to all three triangle stars match one catalog star? A true triangle confirms at once. A false one almost never does, because the fourth star would have to land where three narrow rings on the sky cross, by pure chance.

After a confirmed pyramid, solve a first attitude from the four stars. Use it to predict where every catalog star should appear, and identify the remaining spots by who is closest. A spot with no catalog star near its predicted place is a false detection — a hot pixel, a planet, a piece of debris — and is dropped.

::: key Pyramid star identification
Triangle matching votes on triples of stars; the pyramid step confirms with a fourth star consistent with all three angles. The confirmation is what collapses the false-identification rate in a crowded or noisy field.
:::

Here is the whole chain on a synthetic sky: $3000$ stars scattered at random, a $15^\circ$ field, $10''$ centroid noise and one false detection. The attitude at the end comes from the SVD solution to the **[[Wahba problem|wahba]]**, which the least-squares module derived. Build the attitude profile matrix $\mathbf{B} = \sum_i \hat{\mathbf{b}}_i\hat{\mathbf{r}}_i^{\top}$, split it as $\mathbf{B} = \mathbf{U}\boldsymbol{\Sigma}\mathbf{V}^{\top}$, and the best rotation is $\mathbf{A} = \mathbf{U}\,\mathrm{diag}(1, 1, \det\mathbf{U}\det\mathbf{V})\,\mathbf{V}^{\top}$.

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

Read the output line by line.

- The first triangle that a fourth star confirms is spots $0$, $1$, $2$, confirmed by spot $3$. All four are assigned correctly.
- The first attitude then identifies all twelve real stars. It leaves the false detection, spot $12$, unassigned, because no catalog star sits near its predicted place.
- The per-star **residuals** — the leftover angle between each measured star and where the solved attitude puts it — run from $3.5''$ to $23.4''$. That fits $10''$ of noise in each of two directions.
- The attitude error is $4.3''$ and $1.8''$ about the two axes across the boresight, but $53''$ about the boresight itself. That last number is not bad luck. It comes from the geometry of the instrument, and it is the subject of the next lesson.

The residuals are the safety net the pyramid is not. Loosen the tolerance to four sigma and scan every pyramid in this same field: $227$ triangles get confirmed, and $7$ of them are wrong. All seven swap catalog stars $181$ and $1878$, which lie only $305''$ apart. The other stars sit almost at right angles to the line joining that pair, so their angles to either one agree within tolerance. The four-star attitude built on the swap has residuals of $121''$ and $145''$ on two stars — twelve and fifteen times the noise — and a roll error of $1028''$. The residual gate in `solve` rejects the swapped star, and the final answer comes out right. The pyramid confirms the *pattern*. Only the residuals confirm each *star*.

How reliable is the whole thing? This block reuses the functions above on $200$ random attitudes, with three false detections in every image.

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

Two hundred fields, two hundred correct identifications of every real star, every false star rejected, and no field where it failed. Trusting the first matching triangle instead would have been wrong in two of the two hundred. The module's coding exercise asks you to push further: measure the identification and false-identification rates as the centroid noise and the number of false spots grow. These functions are a starting point, not a finished answer.

::: warning
The tolerance is a knob with two ways to fail. Too tight, and a star with an unlucky centroid finds no catalog partner, the pyramid never confirms, and the tracker reports nothing. Too loose, and the candidate lists grow, wrong triangles multiply, and the close pairs a real catalog is full of start to swap. Set it from the measured centroid noise, at three to four standard deviations of the *angle* noise — which is $\sqrt{2}$ times the per-star noise — and let the residual check catch what slips through.
:::

## Tracking mode

Lost-in-space identification is slow: a second or more on a flight computer. So it runs only when needed. Once the attitude is known, the tracker switches to **tracking mode**.

Think of following a friend through a crowd. You don't re-scan every face each second; you look where your friend was a moment ago, plus a step. The tracker does the same. From the last attitude, and a turn rate from its own recent frames or from a gyro, it predicts where each known star will be in the next image. It reads out only small windows around those spots, finds the centroids, and matches each spot to the nearest prediction. No pattern search. Stars leaving the field are dropped; catalog stars entering it are predicted and picked up.

That is why a tracker can run at $5$ to $10\,\mathrm{Hz}$ with a small fraction of the computing of a first acquisition. It is also why its answers arrive with a nearly constant delay: exposure, readout, centroiding, a small least-squares fit.

Tracking mode sets the tracker's limits. If the spacecraft turns faster than the prediction can follow, or the stars smear into streaks the centroider rejects, the number of tracked stars falls. Below a minimum, usually three, the tracker declares **loss of track** and goes back to lost-in-space.

One more detail bites people. Each quaternion's **[[time stamp|time-tag]]** refers to the middle of the exposure, not the moment the message leaves the box. Turning at $1^\circ/\mathrm{s}$, a $100\,\mathrm{ms}$ delay is $0.1^\circ = 360''$ of motion. A filter that ignores that delay adds a $360''$ error to an instrument good to a few arcseconds.

::: example From a spot to a unit vector
A star's centroid is at $(x, y) = (2.4180\,\mathrm{mm},\ -1.1050\,\mathrm{mm})$ on the tracker above, with $f = 28.5\,\mathrm{mm}$.

**Stack it with $f$.** The direction before normalising is $(2.4180, -1.1050, 28.5)$.

**Its length.** $\sqrt{2.4180^2 + 1.1050^2 + 28.5^2} = 28.624\,\mathrm{mm}$.

**Divide by the length.** $\hat{\mathbf{b}} = (0.08448, -0.03860, 0.99568)$. The last component is the cosine of the angle from the boresight, so the star is $\arccos(0.99568) = 5.33^\circ$ off-centre — inside the $7.5^\circ$ half-field, as it must be.

**How much does centroid error matter?** A $0.05$-pixel error is $0.05 \times 7.4 = 0.37\,\mathrm{\mu m}$ on the detector. That moves the direction by $0.37\times10^{-3}/28.5 = 1.3\times10^{-5}\,\mathrm{rad}$, or $2.7''$ — the same figure as the first example. Turning a spot into a unit vector neither adds accuracy nor loses it.
:::

## Check yourself

::: check
A tracker has $f = 50\,\mathrm{mm}$, $5.5\,\mathrm{\mu m}$ pixels and a $2048 \times 2048$ detector. What are its IFOV and full field of view, and what angular accuracy does a $0.1$-pixel centroid give for one star?
:::

::: answer
$\mathrm{IFOV} = 5.5\times10^{-6}/0.050 = 1.10\times10^{-4}\,\mathrm{rad}$, and multiplying by $206\,265$ gives $22.7''$ per pixel.

Half the detector is $1024 \times 5.5\,\mathrm{\mu m} = 5.632\,\mathrm{mm}$ wide, so $\mathrm{FOV} = 2\arctan(5.632/50) = 12.85^\circ$.

A $0.1$-pixel centroid is $0.1 \times 22.7'' \approx 2.3''$ per star.

Compared with the lesson's tracker, this one has finer pixels and a narrower field, so it sees fewer stars per image from the same catalog. The next lesson shows what that costs in accuracy about the boresight.
:::

::: check
A magnitude-6 catalog has $5000$ stars. On average, how many stars fall in a circular $20^\circ$ field, and how many pairs does the interstar-angle index for that field hold?
:::

::: answer
The half-angle is $10^\circ$. The sky fraction is $(1 - \cos 10^\circ)/2 = 0.00760$, so the field holds $5000 \times 0.00760 = 38$ stars on average.

The index needs every pair closer than $20^\circ$. There are $5000 \times 4999/2 = 1.25\times10^7$ pairs in all, and a fraction $(1 - \cos 20^\circ)/2 = 0.0302$ of them are that close: about $377{,}000$ entries.

Both numbers grow fast with the field. A wide field sees more stars, which helps the attitude, and stores more pairs, which slows the lookup and makes it more confusing.
:::

::: check
Why does the triangle matcher check the sign of $(\hat{\mathbf{u}}\times\hat{\mathbf{v}})\cdot\hat{\mathbf{w}}$ as well as the three angles?
:::

::: answer
Because interstar angles are unchanged not only by rotations but also by reflections. A mirror image of a star triangle has exactly the same three angles. A catalog triple that is the mirror of the observed one therefore passes the angle test, yet no rotation can turn it into what the camera sees.

The triple product is a signed volume: its sign says which way $u \to v \to w$ turns. Rotations keep that sign and reflections flip it. Requiring the same sign throws out the mirror candidates. In the lesson's field it removed $19$ of the $27$ wrong triangle matches.
:::

::: check
A deep-space probe is moving at $32\,\mathrm{km/s}$ relative to the centre of mass of the solar system. At most, how far is a star's apparent direction shifted, and why must the tracker or its host correct for it?
:::

::: answer
The aberration angle is $v/c = 32/299792 = 1.07\times10^{-4}\,\mathrm{rad}$, which is $22.0''$. That is for a star at right angles to the velocity; a star at angle $\theta$ from the velocity shifts less, by a factor $\sin\theta$.

A tracker good to a few arcseconds that compared uncorrected measurements with the catalog would report an attitude wrong by up to $22''$, and the error would swing around as the velocity direction changed over the mission. The correction needs the velocity vector, which only the navigation solution knows. So it is the first way the tracker depends on the rest of the system.
:::

::: check
In the worked identification, spot $12$ was a false detection. Describe, step by step, what happened to it and why it did no harm.
:::

::: answer
Every triangle containing spot $12$ had an angle that matched no true pattern. So those triangles either found no catalog triple or, rarely, a chance one.

None of the chance ones could be confirmed by a fourth star. That would need a catalog star sitting where three narrow rings cross, by accident. So the confirmed pyramid was built entirely from real stars.

When the first attitude predicted every catalog star's position, no catalog star fell within the gate around spot $12$. It was left unassigned and never entered the final Wahba solution. Its only cost was computing time.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $x = f u_x/u_z$, $y = f u_y/u_z$ | Pinhole projection of a star direction onto the focal plane |
| $\hat{\mathbf{b}} = (x, y, f)/\sqrt{x^2 + y^2 + f^2}$ | Measured unit vector from a centroid |
| $\mathrm{IFOV} = p/f$, $\mathrm{FOV} = 2\arctan(Np/2f)$ | Angle per pixel and full field; $53.6''$ and $15.15^\circ$ for the lesson's tracker |
| $\bar{x} = \sum I_k x_k / \sum I_k$ | Intensity-weighted centroid; needs a defocused spot about one pixel wide |
| $\sigma_{\mathrm{psf}}/\sqrt{N}$ | Photon-limited centroid error; $0.011$ px at $\sigma_{\mathrm{psf}} = 0.5$ px, $N = 2000$ |
| $\hat{\mathbf{r}} = (\cos\delta\cos\alpha, \cos\delta\sin\alpha, \sin\delta)$ | Catalog unit vector from right ascension and declination |
| $v/c$ | Stellar aberration; $20.5''$ for Earth's orbital speed, $5.3''$ for low Earth orbit |
| $\hat{\mathbf{b}}_i\cdot\hat{\mathbf{b}}_j = \hat{\mathbf{r}}_i\cdot\hat{\mathbf{r}}_j$ | The interstar angle does not change under rotation: the basis of lost-in-space identification |
| $\mathrm{sign}\,(\hat{\mathbf{u}}\times\hat{\mathbf{v}})\cdot\hat{\mathbf{w}}$ | Handedness; angles alone cannot tell a pattern from its mirror image |
| Triangle, then pyramid, then residuals | Match three angles; confirm with a fourth star; check every star against the solved attitude |
| $\mathbf{A} = \mathbf{U}\,\mathrm{diag}(1,1,\det\mathbf{U}\det\mathbf{V})\mathbf{V}^{\top}$ | SVD solution of the Wahba problem from $\mathbf{B} = \sum_i \hat{\mathbf{b}}_i\hat{\mathbf{r}}_i^{\top}$ |
| Tracking mode | Predict, window, centroid, match by proximity; $5$ to $10\,\mathrm{Hz}$; back to lost-in-space below three stars |

The identification in this lesson ended with an attitude error of about $4''$ across the boresight and $53''$ about it. The next lesson explains that gap from the geometry of the field, and then follows the tracker through its update rate, the keep-out cones around the Sun, Earth and Moon, and the baffle that makes the whole instrument possible.

::: context quaternion Four numbers for a turn
Any orientation can be reached from a starting one by a single turn through some angle $\theta$ about some axis $\hat{\mathbf{e}}$. A quaternion packs that turn into four numbers: $\big(\hat{\mathbf{e}}\sin(\theta/2),\ \cos(\theta/2)\big)$. Its length is always $1$. Spacecraft like quaternions because they never hit the "gimbal lock" dead spots that three angles (roll, pitch, yaw) suffer, and they are cheap to combine. The attitude-representations module built them from scratch; here you only need to know that the tracker's final answer is one of them.
:::

::: context arcsecond How small is an arcsecond?
A degree splits into $60$ arcminutes, and an arcminute into $60$ arcseconds, so one arcsecond is $1/3600$ of a degree, or about $4.85\times10^{-6}$ radians. A US quarter, $24\,\mathrm{mm}$ across, looks one arcsecond wide from about $5\,\mathrm{km}$ away. The symbol is a double prime: $53.6''$ means $53.6$ arcseconds. A good star tracker knows its pointing to a few of these.
:::

::: context gyro-drift Why the gyros need the stars
A gyro measures turning rate, and the flight computer adds up (integrates) those rates to keep track of attitude. Every gyro has a tiny steady error, a **bias**. Integrated for an hour, a bias of $0.01^\circ$ per hour becomes a $0.01^\circ$ error — $36''$, far more than a tracker's accuracy — and it keeps growing. The star tracker gives an absolute answer that does not grow with time, so a filter uses it to pull the attitude back and to estimate the gyro bias itself. The Kalman-filter modules later in the course show exactly how.
:::

::: context pinhole-picture The pinhole, drawn
A star at angle $\theta$ from the boresight lands a distance $f\tan\theta$ from the centre of the image. In components, $\tan\theta$ along $x$ is $u_x/u_z$, which gives $x = f u_x/u_z$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="130" x2="330" y2="130" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="300" y="150" font-size="12" fill="#6c7a93">boresight z</text>
  <line x1="260" y1="20" x2="260" y2="150" stroke="#1f2a44" stroke-width="2"/>
  <text x="266" y="30" font-size="12" fill="#1f2a44">image plane</text>
  <circle cx="60" cy="130" r="4" fill="#1f2a44"/>
  <text x="40" y="152" font-size="12" fill="#1f2a44">lens</text>
  <line x1="60" y1="130" x2="300" y2="46" stroke="#1d6fd1" stroke-width="2"/>
  <polygon points="300,46 288,46 292,56" fill="#1d6fd1"/>
  <text x="170" y="78" font-size="12" fill="#1d6fd1">toward the star</text>
  <circle cx="260" cy="60" r="5" fill="#b4232c"/>
  <text x="200" y="56" font-size="12" fill="#b4232c">spot</text>
  <line x1="272" y1="60" x2="272" y2="130" stroke="#b4232c" stroke-width="1.5"/>
  <text x="278" y="100" font-size="12" fill="#b4232c">x = f tan θ</text>
  <line x1="60" y1="116" x2="258" y2="116" stroke="#1f2a44" stroke-width="1"/>
  <text x="150" y="112" font-size="12" fill="#1f2a44">f</text>
  <path d="M 100 130 A 40 40 0 0 0 98 117" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="104" y="126" font-size="11" fill="#1f2a44">θ</text>
</svg>
```
:::

::: context magnitude-scale Backwards brightness
About 2000 years ago the Greek astronomer Hipparchus sorted stars into six classes: the brightest were "first magnitude", the faintest he could see "sixth". Astronomers later made it exact: five magnitudes is a factor of exactly $100$ in brightness, so one magnitude is $100^{1/5} = 10^{0.4} \approx 2.512$. That is why the scale runs backwards (bigger means fainter) and why very bright objects have negative magnitudes: Sirius is about $-1.5$, the full Moon about $-12.7$, the Sun about $-26.7$.
:::

::: context pixel-locking Why a sharp star is a bad star
Left: a focused star sits off-centre in one pixel, but only that pixel lights, so the centroid (cross) lands on the pixel centre. Right: a blurred star lights its neighbours unevenly, and the balance point lands on the star.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1" fill="#ffffff">
    <rect x="30" y="30" width="36" height="36"/><rect x="66" y="30" width="36" height="36"/><rect x="102" y="30" width="36" height="36"/>
    <rect x="30" y="66" width="36" height="36"/><rect x="66" y="66" width="36" height="36" fill="#1d6fd1"/><rect x="102" y="66" width="36" height="36"/>
    <rect x="30" y="102" width="36" height="36"/><rect x="66" y="102" width="36" height="36"/><rect x="102" y="102" width="36" height="36"/>
  </g>
  <g stroke="#6c7a93" stroke-width="1">
    <rect x="210" y="30" width="36" height="36" fill="#ffffff"/><rect x="246" y="30" width="36" height="36" fill="#8fb8f0"/><rect x="282" y="30" width="36" height="36" fill="#8fb8f0"/>
    <rect x="210" y="66" width="36" height="36" fill="#ffffff"/><rect x="246" y="66" width="36" height="36" fill="#1d6fd1"/><rect x="282" y="66" width="36" height="36" fill="#1d6fd1"/>
    <rect x="210" y="102" width="36" height="36" fill="#ffffff"/><rect x="246" y="102" width="36" height="36" fill="#ffffff"/><rect x="282" y="102" width="36" height="36" fill="#ffffff"/>
  </g>
  <circle cx="94" cy="76" r="5" fill="#b4232c"/>
  <path d="M 78 84 L 90 84 M 84 78 L 84 90" stroke="#f2b880" stroke-width="3"/>
  <circle cx="282" cy="66" r="5" fill="#b4232c"/>
  <path d="M 276 66 L 288 66 M 282 60 L 282 72" stroke="#f2b880" stroke-width="3"/>
  <text x="30" y="160" font-size="12" fill="#1f2a44">focused: centroid stuck</text>
  <text x="206" y="160" font-size="12" fill="#1f2a44">blurred: centroid on star</text>
  <text x="140" y="22" font-size="11" fill="#b4232c">dot = true star</text>
  <text x="250" y="22" font-size="11" fill="#1f2a44">cross = centroid</text>
</svg>
```
:::

::: context star-surveys Where the star maps come from
Hipparcos was a European satellite (1989–1993) that measured about $118{,}000$ star positions to around a thousandth of an arcsecond. Tycho-2, built from its companion instrument, lists about $2.5$ million stars less precisely. Gaia, launched in 2013, has mapped more than a billion. A tracker's onboard catalog keeps only a few thousand of the brightest, most reliable stars from these, because that is all its camera can see and all its computer needs.
:::

::: context aberration Running through rain
Stand still in rain that falls straight down, and it hits you from above. Run forward, and it seems to come slanting at your face. Starlight does the same thing: a spacecraft's motion tilts every star's apparent direction toward where it is heading, by about speed over light speed. Earth's $29.78\,\mathrm{km/s}$ around the Sun gives $20.5''$ — tiny by eye, huge for an instrument that measures arcseconds. The English astronomer James Bradley discovered the effect in 1727 while trying to measure something else.
:::

::: context mirror-triangle Same angles, opposite turn
Both triangles have identical side angles, so the angle test cannot tell them apart. But going $u \to v \to w$ turns counterclockwise on the left and clockwise on the right. The sign of the triple product catches that.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="180" y1="20" x2="180" y2="140" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="186" y="152" font-size="11" fill="#6c7a93">mirror</text>
  <polygon points="40,120 140,120 70,40" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="320,120 220,120 290,40" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="13" fill="#1f2a44">
    <text x="26" y="136">u</text><text x="142" y="136">v</text><text x="64" y="34">w</text>
    <text x="324" y="136">u</text><text x="206" y="136">v</text><text x="286" y="34">w</text>
  </g>
  <text x="44" y="152" font-size="12" fill="#1d6fd1">counterclockwise</text>
  <text x="236" y="152" font-size="12" fill="#b4232c">clockwise</text>
</svg>
```
:::

::: context wahba The Wahba problem, in one line
In 1965 the mathematician Grace Wahba posed it as a puzzle: given several measured directions $\hat{\mathbf{b}}_i$ and the matching catalog directions $\hat{\mathbf{r}}_i$, find the rotation $\mathbf{A}$ that makes $\sum_i w_i\lVert\hat{\mathbf{b}}_i - \mathbf{A}\hat{\mathbf{r}}_i\rVert^2$ as small as possible. The SVD answer used here, and the faster QUEST method used on many flight computers, both solve it exactly. Every star tracker ends its chain by solving it.
:::

::: context time-tag When was that picture taken?
An exposure takes time, and so do readout and processing. If a tracker exposes from $t = 0$ to $t = 100\,\mathrm{ms}$ and sends its answer at $t = 250\,\mathrm{ms}$, the attitude it reports belongs to $t = 50\,\mathrm{ms}$. A navigation filter must apply the measurement at that time, not when it arrived. Getting the time tag wrong is one of the commonest real bugs in attitude software, because on a slowly turning spacecraft on the ground it is invisible.
:::
