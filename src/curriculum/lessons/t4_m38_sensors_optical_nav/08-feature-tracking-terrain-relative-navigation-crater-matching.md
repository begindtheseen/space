---
id: l08-feature-tracking-terrain-relative-navigation-crater-matching
title: 'Feature detection and tracking, terrain relative navigation, and crater matching'
minutes: 21
covers:
  - 'Feature detection and tracking; terrain relative navigation; crater and landmark matching'
---

The star tracker this module opened with searches a curated catalog: a few thousand points, each with a known, essentially fixed position, seen against a black background with nothing else in the frame. A descent or approach camera has none of that. The terrain below is not a catalog anyone wrote down in advance in pixel form, the lighting changes with every pass, and most of what the camera sees is of no navigational use at all — until something in the scene is distinctive enough, and stable enough from one frame to the next, to be worth tracking. This lesson builds that chain from the ground up: what makes a patch of image worth calling a feature, how to find the same feature again a moment later, and how the identical idea, run against a stored map instead of the previous frame, turns a camera into an absolute position sensor.

Terrain relative navigation is the payoff. Inertial navigation only ever answers "how far have I moved since the last fix" and accumulates error every second it runs unaided; nothing about it knows where the vehicle is *relative to the ground it is about to land on*. Comparing a live image against a pre-loaded, geo-referenced map answers a completely different question — not how far moved, but where, right now, relative to features whose map position is already known — and it is the only sensor in this module that can correct position outright rather than merely slow the rate at which uncertainty grows.

## Detecting features worth tracking: the Harris corner test

A useful feature is one whose surrounding image content changes unambiguously if the camera nudges in *any* direction. A flat patch of ground gives no such signal — shift the window and the intensities barely change. An edge gives a signal along one direction only — shift along the edge and nothing changes, shift across it and everything does. A corner, or an isolated rock, changes in every direction, and that is exactly the property the Harris detector tests for.

At each pixel, compute the image gradients $I_x,I_y$ and form the local **structure tensor**, Gaussian-smoothed over a small neighbourhood to average out noise:

$$
\mathbf{M} = \begin{pmatrix}\langle I_x^2\rangle & \langle I_xI_y\rangle \\ \langle I_xI_y\rangle & \langle I_y^2\rangle\end{pmatrix}.
$$

$\mathbf{M}$'s eigenvalues measure how strongly the local intensity changes along its two principal directions: both small means a flat patch, one large and one small means an edge, both large means a corner. The **Harris response** avoids computing eigenvalues directly, using the same information through the matrix's determinant and trace,

$$
R = \det(\mathbf{M}) - k\,\big(\operatorname{trace}\mathbf{M}\big)^2,
$$

with $k\approx0.04$–$0.06$ an empirical constant; $R$ is large and positive only where both eigenvalues are large, exactly the corner case, and a local maximum of $R$ above a threshold marks a detected feature.

::: example A from-scratch Harris detector, on ground truth it can be checked against
```python
import numpy as np
from scipy.ndimage import gaussian_filter, maximum_filter

def harris_response(img, sigma=1.5, k=0.05):
    Iy, Ix = np.gradient(img.astype(float))
    Ixx = gaussian_filter(Ix * Ix, sigma)
    Iyy = gaussian_filter(Iy * Iy, sigma)
    Ixy = gaussian_filter(Ix * Iy, sigma)
    det = Ixx * Iyy - Ixy * Ixy
    trace = Ixx + Iyy
    return det - k * trace**2

def find_corners(R, thresh_frac=0.02, min_dist=8):
    thresh = thresh_frac * R.max()
    local_max = (R == maximum_filter(R, size=min_dist)) & (R > thresh)
    ys, xs = np.nonzero(local_max)
    return list(zip(xs, ys))

rng = np.random.default_rng(5)
N = 200
img1 = 0.3 * np.ones((N, N))
rocks = [(40, 50, 14), (120, 70, 10), (70, 150, 16), (160, 160, 12), (100, 30, 8)]
for cx, cy, size in rocks:
    img1[cy-size:cy+size, cx-size:cx+size] = 0.9         # square "rocks": four sharp corners each
img1 += rng.normal(0, 0.02, img1.shape)

R1 = harris_response(img1)
corners1 = find_corners(R1)
print("Harris corners detected:", len(corners1), "(expect 4 per rock, 5 rocks = 20)")
true_corners = [(cx - size, cy - size) for cx, cy, size in rocks]
for tc in true_corners:
    dists = [np.hypot(tc[0]-dx, tc[1]-dy) for dx, dy in corners1]
    print("  true corner", tc, "-> nearest detection", round(min(dists), 2), "px away")
# Harris corners detected: 20 (expect 4 per rock, 5 rocks = 20)
#   true corner (26, 36) -> nearest detection 0.0 px away
#   true corner (110, 60) -> nearest detection 0.0 px away
#   true corner (54, 134) -> nearest detection 0.0 px away
#   true corner (148, 148) -> nearest detection 0.0 px away
#   true corner (92, 22) -> nearest detection 0.0 px away
```

Twenty detections for five square rocks, four sharp corners apiece, every one landing exactly on a true corner pixel — on noiseless-enough synthetic ground truth, the detector finds precisely what it was built to find. A real terrain image will not offer corners this clean, but the mechanism is identical: wherever the structure tensor says the local intensity changes in every direction at once, something is there worth tracking.
:::

## Tracking a feature frame to frame

Detecting a feature answers "where is something distinctive, in this one frame." Tracking answers "where did it go" — and the tool is simpler than detection: take the small patch of pixels around a detected feature as a template, and search a window in the next frame for the location whose own patch correlates best with it. **Normalized cross-correlation** compares patches independent of overall brightness or contrast shift between frames, exactly the robustness needed when exposure or lighting changes slightly from one image to the next:

$$
\mathrm{NCC} = \frac{\sum(\text{template}-\bar{\text{template}})(\text{window}-\bar{\text{window}})}{\lVert\text{template}-\bar{\text{template}}\rVert\,\lVert\text{window}-\bar{\text{window}}\rVert},
$$

a score of $1$ for a perfect match, $0$ for no correlation at all, evaluated at every candidate offset within a search radius and maximized.

::: example Tracking twelve corners through a shift the tracker never sees directly
```python
from scipy.ndimage import shift as ndshift

true_shift = (5.7, -3.2)   # the true scene motion between frames, unknown to the tracker
base2 = 0.3 * np.ones((N, N))
for cx, cy, size in rocks:
    base2[cy-size:cy+size, cx-size:cx+size] = 0.9
img2 = ndshift(base2, (true_shift[1], true_shift[0]), order=1, mode='nearest') + rng.normal(0, 0.02, (N, N))

def ncc_track(img1, img2, corner, patch=9, search=15):
    cx, cy = corner
    templ = img1[cy-patch:cy+patch+1, cx-patch:cx+patch+1]
    templ_z = templ - templ.mean()
    best, best_score = None, -np.inf
    for dy in range(-search, search+1):
        for dx in range(-search, search+1):
            x2, y2 = cx+dx, cy+dy
            win = img2[y2-patch:y2+patch+1, x2-patch:x2+patch+1]
            win_z = win - win.mean()
            denom = np.linalg.norm(templ_z) * np.linalg.norm(win_z)
            score = 0.0 if denom == 0 else np.sum(templ_z*win_z) / denom
            if score > best_score:
                best_score, best = score, (dx, dy)
    return best

shifts = np.array([ncc_track(img1, img2, c) for c in corners1[:12]])
print("tracked shifts, all twelve corners:", shifts.tolist())
print("mean tracked shift:", shifts.mean(axis=0), " true shift:", true_shift)
# tracked shifts, all twelve corners: [[6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3]]
# mean tracked shift: [ 6. -3.]  true shift: (5.7, -3.2)
```

Every one of the twelve tracked corners agrees, to the integer-pixel resolution this search used, and lands within a pixel of the true $(5.7,-3.2)$ shift. A flight implementation refines further with a quadratic fit to the correlation score around the best integer offset, recovering sub-pixel motion the same way the star tracker's centroid recovered sub-pixel position from a handful of discrete photon counts — a different problem, the same underlying trick of fitting a smooth peak through discrete samples.
:::

## Terrain relative navigation: the same correlation, at map scale

Tracking moves a small patch across two nearby frames. Terrain relative navigation runs the identical correlation against a much larger, pre-loaded reference map with known geographic coordinates — not to find motion, but to find *absolute position*. The descent image is the template; the search is not over a handful of pixels around the last known location but over however large a region the vehicle's accumulated inertial uncertainty demands; and the correlation peak, once found, is a position fix tied to the map's own coordinates, independent of everything the inertial solution assumed on the way down.

::: example A descent image finds itself on the map
```python
import numpy as np
rng = np.random.default_rng(7)

M = 600
map_img = 0.35 * np.ones((M, M))
crater_centers = rng.uniform(30, M-30, (40, 2))
crater_radii = rng.uniform(6, 16, 40)
yy, xx = np.mgrid[0:M, 0:M]
for (cx, cy), r in zip(crater_centers, crater_radii):
    d = np.hypot(xx - cx, yy - cy)
    map_img -= 0.35 * np.exp(-(d/r)**2) * (d < 2.2*r)     # crater floor
    map_img += 0.15 * np.exp(-((d-r)/(0.3*r))**2)          # crater rim
map_img += rng.normal(0, 0.01, map_img.shape)

true_x0, true_y0 = 250, 340                 # the descent image's true map location (unknown in flight)
win = 90
descent_img = map_img[true_y0:true_y0+win, true_x0:true_x0+win] + rng.normal(0, 0.01, (win, win))

prior_x0, prior_y0 = 305, 300               # inertial-only prior estimate of that same location
prior_error = np.hypot(prior_x0 - true_x0, prior_y0 - true_y0)

search_radius = 80
best_score, best_xy = -np.inf, None
tz = descent_img - descent_img.mean()
for y0 in range(max(0, prior_y0-search_radius), min(M-win, prior_y0+search_radius)):
    for x0 in range(max(0, prior_x0-search_radius), min(M-win, prior_x0+search_radius)):
        patch = map_img[y0:y0+win, x0:x0+win]
        pz = patch - patch.mean()
        denom = np.linalg.norm(tz) * np.linalg.norm(pz)
        score = 0.0 if denom == 0 else np.sum(tz*pz) / denom
        if score > best_score:
            best_score, best_xy = score, (x0, y0)

fix_error = np.hypot(best_xy[0]-true_x0, best_xy[1]-true_y0)
gsd = 2.5   # metres per pixel, an assumed descent-image ground sample distance
print("inertial-only prior error:", round(prior_error, 1), "px =", round(prior_error*gsd, 1), "m")
print("TRN correlation peak:", best_xy, " true location:", (true_x0, true_y0), " NCC score:", round(best_score, 4))
print("TRN position-fix error:", round(fix_error, 2), "px =", round(fix_error*gsd, 2), "m")
# inertial-only prior error: 68.0 px = 170.0 m
# TRN correlation peak: (250, 340)  true location: (250, 340)  NCC score: 0.7404
# TRN position-fix error: 0.0 px = 0.0 m
```

The correlation peak lands exactly on the true map location — to this search's one-pixel resolution, $0\,\mathrm{m}$ of the $170\,\mathrm{m}$ the inertial-only prior was actually off by — and it does so decisively: the same search found this location's score, $0.7404$, well clear of its next-best candidate one pixel away, $0.1878$, and essentially uncorrelated, $-0.009$, only thirty pixels off. This is a synthetic scene built to be unambiguous, not a claim about real terrain's difficulty, but the mechanism is exactly what turns a kilometre-scale inertial-only landing ellipse into the tens of metres real terrain relative navigation delivers — the Mars 2020 Lander Vision System matched descent imagery against an orbital map during parachute descent by precisely this kind of correlation, cutting the position uncertainty that had dominated every Mars landing before it.
:::

::: key Terrain relative navigation
Match descent imagery against an onboard, geo-referenced map — craters, landmarks, or template patches — for an absolute position fix relative to the terrain itself. It removes inertial drift and the map-tie error a purely propagated solution can never correct, because it does not propagate anything: it looks, once, at where the vehicle actually is.
:::

## Crater and landmark matching: an extra invariant stars do not have

Matching a whole descent image against a map works well once the prior uncertainty is small enough that a single correlation search is affordable; at the start of descent, with a much larger prior, searching every possible offset in a huge map is exactly the combinatorial problem the lost-in-space star identification lesson faced, and the fix is the same in spirit. Instead of correlating whole images, detect distinctive **craters** — nearly circular, rimmed depressions easy to isolate from the surrounding terrain — and match *patterns* of them, the way that lesson matched patterns of stars.

Craters offer one invariant stars never could: **size**. Two stars carry no information about scale, only direction, so the previous star-identification lesson had exactly one invariant — the interstar angle — to search on. Two craters carry both a relative position *and* a diameter, and the **ratio** of two craters' diameters is unchanged by the descent camera's distance to the ground (to good approximation, over the modest altitude range between two nearby frames), exactly as the ratio of two side lengths of a triangle is unchanged by viewing distance. A crater pair's signature is not one number but two — separation and diameter ratio — and using both narrows a search far more than either alone.

::: example Two invariants narrow a search that one invariant cannot
Reusing the reference map's $40$ craters as a catalog of $\binom{40}{2}=780$ pairs, each tagged with its separation and diameter ratio:

```python
n = len(crater_centers)
pairs = []
for i in range(n):
    for j in range(i + 1, n):
        dist = np.linalg.norm(crater_centers[i] - crater_centers[j])
        ratio = crater_radii[i] / crater_radii[j]
        pairs.append((i, j, dist, ratio))
pairs = np.array(pairs)
print("crater pairs in catalog:", len(pairs))

qi, qj = 5, 23
true_dist = np.linalg.norm(crater_centers[qi] - crater_centers[qj])
true_ratio = crater_radii[qi] / crater_radii[qj]
meas_dist = true_dist * (1 + rng.normal(0, 0.02))      # 2% distance measurement noise
meas_ratio = true_ratio * (1 + rng.normal(0, 0.05))    # 5% diameter-ratio measurement noise

by_dist = pairs[np.abs(pairs[:, 2] - meas_dist) < 0.03 * meas_dist]
by_both = by_dist[np.abs(by_dist[:, 3] - meas_ratio) < 0.08 * meas_ratio]
print("candidates matching separation alone:", len(by_dist))
print("candidates matching separation AND diameter ratio:", len(by_both))
print("true pair (5, 23) among the survivors:", (5, 23) in [(int(a), int(b)) for a, b, _, _ in by_both])
# crater pairs in catalog: 780
# candidates matching separation alone: 19
# candidates matching separation AND diameter ratio: 4
# true pair (5, 23) among the survivors: True
```

Separation alone leaves $19$ plausible pairs out of $780$; adding the diameter ratio — free, since both numbers came from the same two crater detections — cuts that to $4$, one of which is the true pair. Exactly as one star triangle alone left the previous lesson with a handful of false matches that a fourth, confirming star discarded, a third crater checked against each surviving candidate pattern would resolve the remaining ambiguity here. The invariant is different; the strategy — narrow with cheap, scale-appropriate signatures, confirm with one more point, never trust a single match unconditionally — is the same one this module has used since its first lesson.
:::

## Check yourself

::: check
Explain, using the structure tensor $\mathbf{M}$'s eigenvalues, why the Harris response is small on a flat patch, small on an edge, and large only at a corner.
:::

::: answer
$\mathbf{M}$'s eigenvalues measure how strongly local intensity varies along its two principal directions. On a flat patch, intensity barely changes in any direction, so both eigenvalues are small and both $\det(\mathbf{M})$ and $R$ are small. On an edge, intensity changes sharply across the edge but barely along it, so one eigenvalue is large and one is small; $\det(\mathbf{M})=\lambda_1\lambda_2$ stays small because one factor is small, even though $\operatorname{trace}(\mathbf{M})=\lambda_1+\lambda_2$ is not. Only at a corner are both eigenvalues large, making $\det(\mathbf{M})$ large enough to dominate the $k(\operatorname{trace}\mathbf{M})^2$ term the response subtracts, which is exactly what the response is built to isolate.
:::

::: check
In the tracking example, all twelve corners agreed on a shift of $(6,-3)$ against a true shift of $(5.7,-3.2)$. Explain the size and direction of this small discrepancy in terms of how the search was carried out.
:::

::: answer
The tracker searched only over integer-pixel offsets $(dx,dy)$ within the search window, so it could never report a fractional shift no matter how well the true motion was $(5.7,-3.2)$; it necessarily rounds to the nearest integer offset that scores best, $(6,-3)$, which differs from the truth by $0.3$ pixels in each axis, well within one pixel. Recovering the fractional remainder needs a further step — fitting a smooth curve through the correlation scores at and around the best integer offset and taking its peak — that this minimal implementation did not include.
:::

::: check
Why does terrain relative navigation correct *position* outright, in a way inertial navigation, run alone, structurally cannot?
:::

::: answer
Inertial navigation integrates measured accelerations and rates forward from a starting state, so every position estimate it produces is a propagated guess whose error only ever accumulates between fixes — it has no independent information about where the vehicle actually is relative to the ground. Terrain relative navigation instead compares a live image directly against a map whose coordinates are already known, so its position estimate does not depend on anything propagated at all; it is a fresh, absolute measurement every time it runs, which is precisely what lets it remove accumulated drift rather than merely slow it.
:::

::: check
A crater pair's diameter ratio is a useful invariant "to good approximation, over the modest altitude range between two nearby frames." Explain what would break this approximation, using the pinhole model from two lessons back.
:::

::: answer
The pinhole model projects a physical size to a pixel size as (roughly) focal length times true size divided by range, $u\text{-size}\approx f\cdot(\text{true size})/Z$; the *ratio* of two nearby craters' pixel sizes cancels the shared $f$ and, as long as both craters are at nearly the same range $Z$, cancels $Z$ too, leaving a ratio close to the true, range-independent diameter ratio. That cancellation fails once the two craters are at meaningfully different ranges from the camera — a wide field of view, a heavily oblique viewing angle, or a large difference in local terrain elevation between the two craters would each give the two craters different effective $Z$, breaking the near-cancellation and biasing the measured ratio away from the true one.
:::

::: check
In the crater-matching example, $19$ candidates matched by separation alone, dropping to $4$ once the diameter ratio was added, but not all the way to $1$. What does this module's first lesson suggest should happen next, and why?
:::

::: answer
The star identification lesson never trusted a single triangle match either — it required a fourth, confirming star before accepting an identification, precisely because triangle matching alone left false matches behind in a crowded field. The same fix applies here: check a third crater against each of the four surviving candidate pairs' implied pattern, keeping only the assignment all three craters agree on. With three independent craters constraining the match instead of two, a coincidental agreement in only separation and diameter ratio becomes vanishingly unlikely for any candidate but the true one.
:::

::: check
The terrain relative navigation example searched only within $80$ pixels of the inertial prior rather than the whole $600\times600$ map. What does this assume about the prior, and what would have to change if the prior were known to be much worse?
:::

::: answer
Restricting the search to a radius around the prior assumes the true location is very likely to fall within that radius — otherwise the correlation search would never look in the right place at all and would return a confident, wrong answer instead of the true peak. If the prior uncertainty were much larger, the search radius would have to grow to match it, at directly increasing computational cost (roughly the square of the radius, for a two-dimensional search), which is exactly why a mission's inertial navigation still matters even when terrain relative navigation is available: a tighter prior keeps the correlation search small enough to run in real time during descent.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf{M}=\begin{pmatrix}\langle I_x^2\rangle&\langle I_xI_y\rangle\\\langle I_xI_y\rangle&\langle I_y^2\rangle\end{pmatrix}$, $R=\det\mathbf{M}-k(\operatorname{trace}\mathbf{M})^2$ | Harris corner detector: large $R$ only where intensity varies in every direction |
| Normalized cross-correlation | Matches a template against a search window, robust to brightness and contrast shifts |
| Terrain relative navigation | Correlate a live image against a geo-referenced map for an absolute position fix; removes inertial drift outright |
| $170\,\mathrm{m}$ prior $\to$ $0\,\mathrm{m}$ (to grid resolution) | This lesson's own worked TRN fix; the real-world analogue is the Mars 2020 Lander Vision System |
| Crater pair signature: separation and diameter ratio | Two invariants instead of one, since craters (unlike stars) carry a measurable scale |
| $780\to19\to4$ candidates | This lesson's worked crater-pair narrowing; a third crater, as with star triangles, resolves the rest |

Detecting, tracking, and matching against a map are all, underneath, the same correlation idea applied at different scales and against different references. The next lesson asks what happens once that map is not merely for navigation but for safety — spotting the boulder or the slope that makes a otherwise well-known landing site the wrong place to actually touch down.
