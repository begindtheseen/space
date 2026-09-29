---
id: l08-feature-tracking-terrain-relative-navigation-crater-matching
title: 'Feature detection and tracking, terrain relative navigation, and crater matching'
minutes: 24
covers:
  - 'Feature detection and tracking; terrain relative navigation; crater and landmark matching'
---

Look out of an airplane window as it comes in to land. At first the ground is a blur of fields. Then you spot something you recognize — a stadium, the bend of a river, a highway interchange — and suddenly you know exactly where you are. You did not count how far the plane had flown. You matched what you saw against a map in your head.

A spacecraft landing on the Moon or Mars can do the same thing. Its camera looks down, picks out distinctive spots, follows them from one picture to the next, and compares the scene with a map loaded before launch. That comparison is called **terrain relative navigation**, and it has changed how precisely spacecraft can land.

The star tracker from the first lesson had it easy. It looked at a black sky with a few thousand known stars and nothing else. A descent camera sees rocks, shadows, dust and slopes, with lighting that changes every minute, and most of what it sees is useless for navigation. This lesson builds the chain step by step:

1. find the patches of a picture worth following (**feature detection**);
2. find the same patch again in the next picture (**tracking**);
3. find the patch on a stored map (**terrain relative navigation**);
4. recognize craters by their pattern (**crater matching**).

## Finding spots worth following

Put your finger on a photo of a beach and slide it a little. If your fingertip was on smooth sand, the picture under it barely changes; you could not tell where you started. If it was on the long straight edge of the shoreline, sliding *along* the edge changes nothing, and only sliding *across* it does. But if it was on the corner of a beach towel, any slide in any direction changes what is under your finger. That spot can be found again without doubt.

A good **feature** is a small patch of picture that changes a lot whichever way you slide it. Corners, lone rocks and small craters qualify. Flat plains and long straight ridges do not.

### Measuring "changes in every direction"

A picture is a grid of brightness values $I$. The **image gradients** $I_x$ and $I_y$ (read "I sub x" and "I sub y") say how fast the brightness changes as you step one pixel right or one pixel down. On smooth sand both are near zero. Across an edge one of them is large.

To judge a whole patch, not one pixel, average the products of the gradients over a small neighbourhood. Those averages, written with angle brackets $\langle\;\rangle$ meaning "average nearby", fill the **structure tensor** — a $2 \times 2$ matrix:

$$
\mathbf{M} = \begin{pmatrix}\langle I_x^2\rangle & \langle I_xI_y\rangle \\ \langle I_xI_y\rangle & \langle I_y^2\rangle\end{pmatrix}.
$$

$\mathbf{M}$ has two **[[eigenvalues|eigenvalues-meaning]]**, $\lambda_1$ and $\lambda_2$ (read "lambda one" and "lambda two"). Each measures how strongly the brightness changes along one of two perpendicular directions:

- both small: a flat patch;
- one large, one small: an edge;
- both large: a corner — a good feature.

### The Harris test

The **Harris corner detector** turns that into one number without computing the eigenvalues. It uses two facts about any $2 \times 2$ matrix: its **determinant** equals $\lambda_1 \lambda_2$, and its **trace** (the sum down the diagonal) equals $\lambda_1 + \lambda_2$. The **Harris response** is

$$
R = \det(\mathbf{M}) - k\,\big(\operatorname{trace}\mathbf{M}\big)^2,
$$

with $k$ a small constant, usually $0.04$ to $0.06$, found by experience. Try it with $k = 0.05$ on three made-up patches:

- flat, $\lambda_1 = \lambda_2 = 0.01$: $R = 0.01 \times 0.01 - 0.05 \times 0.02^2 = 0.00008$, almost nothing;
- edge, $\lambda_1 = 1$, $\lambda_2 = 0.01$: $R = 1 \times 0.01 - 0.05 \times 1.01^2 \approx -0.041$, negative;
- corner, $\lambda_1 = \lambda_2 = 1$: $R = 1 \times 1 - 0.05 \times 2^2 = 0.8$, large and positive.

The product $\lambda_1\lambda_2$ is only big when *both* are big, and subtracting a little of the squared sum pushes edges below zero. A pixel where $R$ is a local peak above some threshold is marked as a feature.

::: example A Harris detector on rocks with known corners
A synthetic $200 \times 200$ picture holds five bright square "rocks" on a darker background, with a little noise. Every square has four sharp corners, so the right answer is $5 \times 4 = 20$ features.

```python
import numpy as np
from scipy.ndimage import gaussian_filter, maximum_filter

def harris_response(img, sigma=1.5, k=0.05):
    Iy, Ix = np.gradient(img.astype(float))      # brightness change per pixel, down and across
    Ixx = gaussian_filter(Ix * Ix, sigma)          # the three entries of M, averaged
    Iyy = gaussian_filter(Iy * Iy, sigma)          # over a small neighbourhood
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

corners1 = find_corners(harris_response(img1))
print("corners found:", len(corners1), "(5 rocks x 4 corners = 20)")
for cx, cy, size in rocks:
    tc = (cx - size, cy - size)                         # each rock's top-left corner
    miss = min(np.hypot(tc[0] - x, tc[1] - y) for x, y in corners1)
    print("  corner", tc, "-> nearest detection", round(float(miss), 2), "px away")
# corners found: 20 (5 rocks x 4 corners = 20)
#   corner (26, 36) -> nearest detection 0.0 px away
#   corner (110, 60) -> nearest detection 0.0 px away
#   corner (54, 134) -> nearest detection 0.0 px away
#   corner (148, 148) -> nearest detection 0.0 px away
#   corner (92, 22) -> nearest detection 0.0 px away
```

Twenty detections, each on a true corner pixel. The flat background and the straight sides of the squares produced none — exactly the flat-edge-corner rule. Real terrain is messier, but the idea is the same: wherever brightness changes in every direction, there is something worth following.
:::

## Following a feature from one picture to the next

Detecting answers "where is something distinctive in this picture?" **Tracking** answers "where did it go in the next one?" The tool is simpler than detection.

Cut out a small square of pixels around the feature. Call it the **template**, like a puzzle piece. Then slide the puzzle piece around a small search area in the next picture and, at each position, score how well it matches. The best score marks the new position.

The score used is **normalized cross-correlation**, or NCC. It subtracts each patch's average brightness (so a picture that got brighter overall still matches) and divides by each patch's spread (so a picture with more contrast still matches):

$$
\mathrm{NCC} = \frac{\sum(\text{template}-\bar{\text{template}})(\text{window}-\bar{\text{window}})}{\lVert\text{template}-\bar{\text{template}}\rVert\,\lVert\text{window}-\bar{\text{window}}\rVert}.
$$

The bar over a word, as in $\bar{\text{template}}$, means its average; the double bars $\lVert\;\rVert$ mean "size of", the square root of the sum of squares. NCC is $1$ for a perfect match, near $0$ for no resemblance, and $-1$ for a perfect photo-negative. Picking the offset with the highest score is how the tracker decides where the feature went.

::: example Tracking twelve corners through a hidden shift
Continuing from the previous code, a second picture shows the same rocks after the whole scene has moved $5.7$ pixels right and $3.2$ pixels up, with fresh noise. The tracker is not told the shift.

```python
from scipy.ndimage import shift as ndshift

true_shift = (5.7, -3.2)          # how far the scene really moved (the tracker is not told)
base2 = 0.3 * np.ones((N, N))
for cx, cy, size in rocks:
    base2[cy-size:cy+size, cx-size:cx+size] = 0.9
img2 = ndshift(base2, (true_shift[1], true_shift[0]), order=1, mode='nearest')
img2 += rng.normal(0, 0.02, (N, N))

def ncc(a, b):
    a = a - a.mean(); b = b - b.mean()
    den = np.linalg.norm(a) * np.linalg.norm(b)
    return 0.0 if den == 0 else float(np.sum(a * b) / den)

def track(img1, img2, corner, patch=9, search=15):
    cx, cy = corner
    templ = img1[cy-patch:cy+patch+1, cx-patch:cx+patch+1]
    best, best_score = None, -np.inf
    for dy in range(-search, search + 1):
        for dx in range(-search, search + 1):
            x2, y2 = cx + dx, cy + dy
            if min(x2, y2) < patch or max(x2, y2) >= N - patch:
                continue                                  # window would fall off the picture
            score = ncc(templ, img2[y2-patch:y2+patch+1, x2-patch:x2+patch+1])
            if score > best_score:
                best_score, best = score, (dx, dy)
    return best

shifts = np.array([track(img1, img2, c) for c in corners1[:12]])
print("tracked shifts:", shifts.tolist())
print("mean:", shifts.mean(axis=0), " truth:", true_shift)
# tracked shifts: [[6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3], [6, -3]]
# mean: [ 6. -3.]  truth: (5.7, -3.2)
```

All twelve corners agree on a shift of $(6, -3)$, within a third of a pixel of the truth in each direction. That small gap is not an error in the matching: the search only tried whole-pixel offsets, so it could not have said $5.7$. Flight software adds a **[[sub-pixel refinement|sub-pixel]]** step to recover the fraction.
:::

::: warning A feature can walk off, or be replaced
Two things go wrong in real tracking. A feature near the edge of the picture can leave the frame, and a feature's appearance changes as the camera gets closer, turns, or the shadows shift. A good tracker drops features whose best score falls below a threshold, and detects fresh ones to replace them. Never trust a match only because it was the best available: the best of a bad set is still bad.
:::

## Terrain relative navigation: tracking against a map

Tracking compares a picture with the *previous* picture. That tells you how far you moved, but not where you are — in the same way that counting your steps tells you how far you walked, not which street you are on.

An **inertial navigation system**, the accelerometers and gyros of an earlier module, has the same limitation. It adds up measured motion, so it answers "how far have I moved since I started?" Its errors pile up the longer it runs (that pile-up is called **drift**). Worse, even a perfect inertial solution does not know exactly where the landing site's map sits in its own coordinates. That mismatch between the vehicle's frame and the map's frame is the **[[map-tie error|map-tie]]**, and inertial navigation can never remove it.

**Terrain relative navigation**, or **TRN**, does something different. It runs the same correlation as tracking, but the reference is a large, pre-loaded map with known coordinates, usually built from an orbiter's photos. The descent picture is the template. The search covers as much of the map as the vehicle's uncertainty demands. And the correlation peak is not a motion — it is a **position fix**: "the patch I am looking at is *here* on the map." It depends on nothing the inertial system assumed on the way down.

::: key Terrain relative navigation
Match descent imagery to an onboard map (craters, landmarks, template patches) for an **absolute** position fix relative to the terrain. It removes both inertial drift and map-tie error, which is what turns a kilometer-sized landing ellipse into tens of meters.
:::

::: example A descent image finds itself on the map
A $600 \times 600$ pixel map holds $300$ craters, each a dark dished floor with a bright rim. The descent camera sees one $90 \times 90$ patch of it with new noise and a different exposure (brighter and higher contrast). Each map pixel covers $2.5\,\mathrm{m}$ of ground; that is the **[[ground sample distance|gsd]]**.

The inertial system thinks the patch starts at map pixel $(305, 300)$. The truth, which the code hides from the search, is $(250, 340)$.

```python
import numpy as np
rng = np.random.default_rng(7)

# Build a cratered landscape and the orbital map of it
M = 600                                             # map size, pixels
n_craters = 300
centers = rng.uniform(20, M - 20, (n_craters, 2))
radii = rng.uniform(5, 15, n_craters)
yy, xx = np.mgrid[0:M, 0:M]
terrain = 0.35 * np.ones((M, M))
for (cx, cy), r in zip(centers, radii):
    d = np.hypot(xx - cx, yy - cy)
    terrain -= 0.25 * np.exp(-(d / r) ** 2)                 # dark, dished floor
    terrain += 0.12 * np.exp(-((d - r) / (0.3 * r)) ** 2)   # bright rim
map_img = terrain + rng.normal(0, 0.02, (M, M))           # the stored map, with its own noise

# The descent camera sees one 90 x 90 patch, with new noise and a different exposure
true_x0, true_y0, win = 250, 340, 90
patch = terrain[true_y0:true_y0 + win, true_x0:true_x0 + win]
descent = 1.4 * patch + 0.1 + rng.normal(0, 0.02, (win, win))

prior_x0, prior_y0 = 305, 300        # where the inertial solution thinks the patch is
gsd = 2.5                            # ground sample distance: metres per pixel

def ncc(a, b):
    a = a - a.mean(); b = b - b.mean()
    return float(np.sum(a * b) / (np.linalg.norm(a) * np.linalg.norm(b)))

R = 80                               # search radius around the prior, pixels
scores = {}
for y0 in range(prior_y0 - R, prior_y0 + R + 1):
    for x0 in range(prior_x0 - R, prior_x0 + R + 1):
        scores[(x0, y0)] = ncc(descent, map_img[y0:y0 + win, x0:x0 + win])

best = max(scores, key=scores.get)
prior_err = np.hypot(prior_x0 - true_x0, prior_y0 - true_y0)
fix_err = np.hypot(best[0] - true_x0, best[1] - true_y0)
runner_up = max(s for (x, y), s in scores.items() if np.hypot(x - best[0], y - best[1]) > 10)
print(f"offsets tried: {len(scores)}")
print(f"inertial prior error: {prior_err:.0f} px = {prior_err * gsd:.0f} m")
print(f"best match {best}, score {scores[best]:.3f}; best score >10 px away {runner_up:.3f}")
print(f"TRN fix error: {fix_err:.0f} px = {fix_err * gsd:.0f} m")
# offsets tried: 25921
# inertial prior error: 68 px = 170 m
# best match (250, 340), score 0.964; best score >10 px away 0.481
# TRN fix error: 0 px = 0 m
```

**Reading the result.** The inertial guess was off by $\sqrt{55^2 + 40^2} \approx 68$ pixels, which is $68 \times 2.5 = 170\,\mathrm{m}$. The correlation peak landed exactly on the true spot, so the fix error is zero to the one-pixel resolution of the search. The peak is decisive: $0.964$ at the right place, and nothing better than $0.481$ anywhere more than ten pixels away. The brighter exposure did not matter, because NCC ignores overall brightness and contrast.

**Sanity check.** The search tried $161 \times 161 = 25\,921$ offsets — every whole-pixel position within $80$ pixels of the guess. Since the guess was $68$ pixels off, the truth was inside the search box, as it has to be.

This scene was built to be clean; real terrain is harder. But it is the same mechanism that NASA's **[[Lander Vision System|lvs]]** used to land the Perseverance rover in Jezero crater in 2021.
:::

::: warning The search box must contain the truth
The search only looks within its radius of the inertial guess. If the true position lies outside that box, the search cannot find it — and it will still return *some* best score, a confident wrong answer. Size the box from the inertial uncertainty (a few standard deviations), and reject fixes whose peak is not clearly above the runner-up.
:::

## Crater matching: a pattern with sizes

Correlating whole pictures works well when the guess is already good, so the search box is small. At the start of a descent the uncertainty can be kilometers, and searching every offset of a huge map is far too slow. This is the same wall the lost-in-space star identification of the first lesson hit, and the escape is the same: stop comparing whole pictures and compare *patterns* of distinctive points.

The points here are **[[craters|slim-craters]]** — round, rimmed pits that stand out from the ground around them and are easy to detect.

### Craters carry one more clue than stars

A pair of stars gives you one number that does not depend on how the camera is turned: the angle between them. That was the star identification **[[invariant|invariant]]**.

A pair of craters gives two. The first is their separation. The second is **size**: stars are points, but craters have diameters. By the pinhole model of the previous lesson, a crater of true diameter $D$ at range $Z$ appears about $fD/Z$ pixels wide. For two craters at nearly the same range, the ratio of their pixel sizes is

$$
\frac{f D_1 / Z}{f D_2 / Z} = \frac{D_1}{D_2},
$$

because $f$ and $Z$ cancel. So the **diameter ratio** seen by the camera equals the true diameter ratio on the map, no matter the altitude. Two clues per pair narrow a search much faster than one.

::: example Two clues, then a third crater
A catalog holds $40$ mapped craters in a landing region, so it has $\binom{40}{2} = 780$ pairs ($\binom{40}{2}$, read "40 choose 2", is the number of ways to pick 2 out of 40: $40 \times 39 / 2 = 780$). The camera sees three craters, A, B and C. It measures separations with $1\%$ noise and the A-B diameter ratio with $3\%$ noise.

```python
import numpy as np
from itertools import combinations

rng = np.random.default_rng(4)
n = 40                                        # mapped craters in the landing region
centers = rng.uniform(0, 600, (n, 2))         # map position, pixels
diam = rng.uniform(12, 32, n)                 # diameter, pixels

def sep(i, j):
    return np.linalg.norm(centers[i] - centers[j])

# Catalog: every pair, tagged with its separation and its diameter ratio (big / small)
catalog = np.array([(i, j, sep(i, j), max(diam[i], diam[j]) / min(diam[i], diam[j]))
                    for i, j in combinations(range(n), 2)])
print("crater pairs in the catalog:", len(catalog))

A, B, C = 5, 23, 31                           # three craters the camera actually sees
noisy = lambda value, frac: value * (1 + rng.normal(0, frac))
sAB, sAC, sBC = noisy(sep(A, B), 0.01), noisy(sep(A, C), 0.01), noisy(sep(B, C), 0.01)
rAB = noisy(max(diam[A], diam[B]) / min(diam[A], diam[B]), 0.03)

by_sep = catalog[np.abs(catalog[:, 2] - sAB) < 0.03 * sAB]
by_both = by_sep[np.abs(by_sep[:, 3] - rAB) < 0.08 * rAB]
print("pairs that fit the separation:", len(by_sep))
print("pairs that also fit the diameter ratio:", len(by_both))

triples = []
for i, j, _, _ in by_both:
    for a, b in ((int(i), int(j)), (int(j), int(i))):     # either one could be crater A
        for c in range(n):
            if c not in (a, b) and abs(sep(a, c) - sAC) < 0.03 * sAC \
                               and abs(sep(b, c) - sBC) < 0.03 * sBC:
                triples.append((a, b, c))
print("triples that also fit the third crater:", triples)
# crater pairs in the catalog: 780
# pairs that fit the separation: 35
# pairs that also fit the diameter ratio: 9
# triples that also fit the third crater: [(5, 23, 31)]
```

**Step by step.** Separation alone cuts $780$ pairs to $35$. Adding the diameter ratio — free, because it came from the same two detections — cuts $35$ to $9$. One of the nine is the true pair, but the camera cannot yet tell which. Then the third crater: for each of the $9$ candidates, tried both ways round, is there a catalog crater at the right distances from both? Only one triple survives, and it is the truth, $(5, 23, 31)$.

The strategy is the one this module has used since the star tracker: narrow the field with cheap clues, then confirm with one more point, and never trust a single match on its own.
:::

## Check yourself

::: check
Using the eigenvalues of the structure tensor $\mathbf{M}$, explain why the Harris response is small on a flat patch, small (or negative) on an edge, and large only at a corner.
:::

::: answer
The eigenvalues $\lambda_1, \lambda_2$ measure how strongly brightness changes along two perpendicular directions.

- **Flat patch:** brightness barely changes anywhere, so both eigenvalues are small. Then $\det\mathbf{M} = \lambda_1\lambda_2$ is tiny and so is $R$.
- **Edge:** brightness changes sharply across the edge but not along it, so one eigenvalue is large and one is small. The product $\lambda_1\lambda_2$ stays small because one factor is small, while $\operatorname{trace}\mathbf{M} = \lambda_1 + \lambda_2$ is not small, so subtracting $k(\operatorname{trace}\mathbf{M})^2$ leaves $R$ small or negative.
- **Corner:** both eigenvalues are large, so the product is large enough to beat the subtracted term, and $R$ is large and positive.
:::

::: check
In the tracking example all twelve corners reported a shift of $(6, -3)$ while the true shift was $(5.7, -3.2)$. Explain the size and direction of the difference from how the search worked.
:::

::: answer
The tracker only tried whole-pixel offsets $(dx, dy)$, so it could never report a fraction. The nearest whole-pixel offset to $(5.7, -3.2)$ is $(6, -3)$, and that is where the score peaked. The differences, $0.3$ pixels in $x$ and $0.2$ pixels in $y$, are rounding to the grid, each less than half a pixel. Recovering the fraction needs one more step: fit a smooth curve through the scores around the best offset and take the curve's peak.
:::

::: check
Why can terrain relative navigation correct position outright, when inertial navigation on its own cannot?
:::

::: answer
Inertial navigation adds up measured accelerations and turn rates from a starting point. Every position it reports is a propagated guess, and its errors only pile up between fixes; it also has no way to learn where the map sits in its own frame.

Terrain relative navigation compares a live picture directly with a map whose coordinates are already known. Its answer does not depend on anything propagated, so each fix is a fresh, absolute measurement. That is what lets it *remove* accumulated drift and map-tie error instead of only slowing their growth.
:::

::: check
The diameter ratio of a crater pair is a good invariant "when both craters are at nearly the same range". Using the pinhole model, explain what would break it.
:::

::: answer
A crater of true diameter $D$ at range $Z$ appears about $fD/Z$ pixels wide. The ratio of two craters' pixel sizes is $(fD_1/Z_1)/(fD_2/Z_2)$. The $f$ always cancels, but the ranges only cancel if $Z_1 = Z_2$.

So anything that puts the two craters at clearly different ranges breaks it: a very wide field of view, a steeply slanted view of the ground (one crater much nearer the camera than the other), or a big difference in ground height between the two craters. The measured ratio is then off by $Z_2/Z_1$, and a correct match can be rejected, or a wrong one accepted.
:::

::: check
In the crater example, why is checking a third crater so much more powerful than tightening the tolerances on the pair?
:::

::: answer
Tightening the tolerances fights noise with less noise, and it quickly starts throwing away the true pair when the measurement is a little off. It also cannot separate two catalog pairs that happen to have the same separation and ratio.

A third crater adds two new, independent distances that a false candidate must *also* match, both at once, with the right crater at the right spot. For a wrong pair that is very unlikely, so almost every false candidate fails at once. In the example, the third crater cut $9$ candidates to $1$ — the same idea as the fourth star of the pyramid method in the first lesson.
:::

::: check
The TRN example searched only within $80$ pixels of the inertial guess instead of the whole $600 \times 600$ map. What does this assume, and what would change if the inertial guess were much worse?
:::

::: answer
It assumes the true position is almost certainly within $80$ pixels of the guess. If it were not, the search would never look in the right place and would still return its best score — a confident, wrong fix.

With a worse guess the radius has to grow to match the uncertainty. The number of offsets grows with the square of the radius (a radius of $80$ needs $161 \times 161$ tries; a radius of $160$ needs about four times as many), so the search gets slow. That is why good inertial navigation still matters when TRN is available, and why a coarse method like crater-pattern matching is used first when the uncertainty is large.
:::

## Summary

| Symbol or idea | Meaning |
| --- | --- |
| $\mathbf{M}=\begin{pmatrix}\langle I_x^2\rangle&\langle I_xI_y\rangle\\\langle I_xI_y\rangle&\langle I_y^2\rangle\end{pmatrix}$ | Structure tensor: how brightness changes around a pixel |
| $R=\det\mathbf{M}-k(\operatorname{trace}\mathbf{M})^2$ | Harris response: large only when both eigenvalues are large, at corners |
| Normalized cross-correlation | Template-matching score from $-1$ to $1$, blind to brightness and contrast changes |
| Tracking | Find the same template in the next frame; whole-pixel search, then sub-pixel refinement |
| Terrain relative navigation | Correlate a descent image with a geo-referenced map for an absolute fix; removes drift and map-tie error |
| This lesson's TRN example | $170\,\mathrm{m}$ inertial error reduced to $0\,\mathrm{m}$ at one-pixel resolution |
| Crater pair clues | Separation and diameter ratio; the ratio cancels focal length and range |
| This lesson's crater example | $780 \to 35 \to 9$ pairs, then a third crater leaves $1$ |

Detection, tracking and map matching are all one correlation idea at different scales. The next lesson asks what the same pictures, and a lidar's elevation map, say about safety: whether a well-located landing spot is flat and clear enough to touch down on.

::: context eigenvalues-meaning Two stretch numbers
Think of $\mathbf{M}$ as describing an oval. Draw an arrow for how much the brightness changes in each direction you could slide: the tips trace out an ellipse. The eigenvalues are the lengths of the ellipse's longest and shortest axes.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <circle cx="60" cy="58" r="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <ellipse cx="180" cy="58" rx="46" ry="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="300" cy="58" r="44" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="60" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">flat: both small</text>
  <text x="180" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">edge: one large</text>
  <text x="300" y="122" font-size="12" text-anchor="middle" fill="#1f2a44">corner: both large</text>
</svg>
```

A small round blob means nothing changes much anywhere. A long thin oval means change in one direction only. A big round one means change everywhere — a corner.
:::

::: context sub-pixel Finding the top between the grid points
The tracker's scores sit on a whole-pixel grid, but the true peak can fall between grid points. Take the best score $s_0$ and its two neighbors $s_-$ and $s_+$ along one axis, fit a parabola through the three, and move to the parabola's top. The shift from the best whole pixel is

$$
\delta = \frac{s_- - s_+}{2(s_- - 2s_0 + s_+)},
$$

always between $-\tfrac12$ and $+\tfrac12$ pixel. Do it once for $x$ and once for $y$. It is the same trick as the star tracker's centroid: a smooth peak fitted through a few discrete samples.
:::

::: context map-tie Where exactly is the map?
A map of Mars made from orbiter photos is very detailed, but the map as a whole is only known to sit in the planet's coordinate frame to within some tens to hundreds of meters. A lander's inertial system, even a perfect one, works in its own frame. So "the safe spot is at these map coordinates" carries that map-tie uncertainty into the landing, no matter how good the inertial system is. Looking at the ground and matching it to the same map sidesteps the problem entirely: the fix is *relative to the map*, which is exactly the frame the landing target is written in.
:::

::: context gsd Ground sample distance
**Ground sample distance** is how much ground one pixel covers. It grows with altitude: a camera with $f = 1000$ pixels looking straight down from $2500\,\mathrm{m}$ covers $2500 / 1000 = 2.5\,\mathrm{m}$ per pixel, while from $250\,\mathrm{m}$ it covers $0.25\,\mathrm{m}$. That matters for TRN because the descent image must be scaled to match the map's pixel size before correlating. It also sets the fix's resolution: a one-pixel search step at $2.5\,\mathrm{m}$ per pixel can place the vehicle to within about a meter or two, not to centimeters.
:::

::: context lvs How Perseverance used it
Perseverance's landing target in Jezero crater sat inside an ellipse about $7.7 \times 6.6\,\mathrm{km}$ — a region full of cliffs, boulder fields and dunes. During the parachute descent, the Lander Vision System took pictures of the ground and matched them against an onboard map built from orbiter images, getting a position fix good to tens of meters. The rover then chose the safest reachable spot from a pre-made safety map and steered to it during the powered descent. Earlier Mars landers had no way to do this; they had to pick landing ellipses flat and safe *everywhere*, which ruled out many of the most interesting places.
:::

::: context slim-craters A lander that navigated by craters
The Moon and Mars are covered in craters of every size, and new craters form rarely, so an orbiter's crater catalog stays valid for a very long time. Japan's SLIM lander ("Smart Lander for Investigating Moon") used exactly this in January 2024: its camera detected craters during descent and matched their pattern against an onboard catalog to find its position. It touched down about $55\,\mathrm{m}$ from its target — a pinpoint landing by lunar standards, where earlier landers had accepted uncertainties of kilometers.
:::

::: context invariant What stays the same
An **invariant** is a quantity that does not change when something else does. The angle between two stars does not change when the spacecraft turns, so it can be looked up in a catalog without knowing the attitude. A crater diameter ratio does not change with altitude, so it can be looked up without knowing the height.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <circle cx="60" cy="60" r="24" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="130" cy="60" r="12" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="230" cy="60" r="12" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <circle cx="265" cy="60" r="6" fill="none" stroke="#b4232c" stroke-width="2.5"/>
  <text x="95" y="112" font-size="12" text-anchor="middle" fill="#1f2a44">low: 48 px and 24 px</text>
  <text x="248" y="112" font-size="12" text-anchor="middle" fill="#1f2a44">high: 24 px and 12 px</text>
  <text x="180" y="20" font-size="12" text-anchor="middle" fill="#1f2a44">ratio 2 at both heights</text>
</svg>
```

From twice as high, everything looks half as big — the separation too — but the ratio of the two sizes is still $2$.
:::
