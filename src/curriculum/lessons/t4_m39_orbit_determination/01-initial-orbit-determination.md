---
id: l01-initial-orbit-determination
title: "Initial orbit determination: Gibbs, Herrick-Gibbs and Gauss angles-only"
minutes: 26
covers:
  - "Initial orbit determination: angles-only (Gauss, Laplace, double-r), three position vectors (Gibbs, Herrick-Gibbs), range and range-rate methods"
---

A baseball player in the outfield hears the crack of the bat and looks up. She gets a few glimpses of the ball — here, a moment later there, then there — and from those glimpses alone she runs to where it will land. Nobody hands her the ball's speed. She works it out from a handful of positions and the fact that thrown things follow a known kind of curve.

Tracking a satellite starts the same way. A new piece of debris shows up on a radar. A satellite goes quiet after a fault and comes back. A payload separates from its rocket and needs a first fix before an antenna can be pointed at it. Each time, the tracking team has no earlier estimate to start from — only a few raw measurements taken over minutes to hours. **Initial orbit determination** (IOD) is the set of classic methods that turn that handful of measurements straight into a full state: a position and a velocity, six numbers, with no starting guess.

The answer is deliberately rough: it seeds the careful fitting of the next lessons. But the way each classic method fails teaches what "enough data" and "good geometry" mean for every estimator in this module. There are three families: three positions (Gibbs, Herrick-Gibbs), angles only (Gauss, Laplace, double-r), and one full radar look, which needs only a change of coordinates.

## Three positions, no clock: Gibbs' method

Suppose you know three position vectors $\mathbf r_1, \mathbf r_2, \mathbf r_3$ of one orbiting object exactly, but not the times they were taken. You want the velocity $\mathbf v_2$ at the middle one. Together with $\mathbf r_2$, that is a complete state. This is **Gibbs' method**.

### First, check the three points lie in one plane

A two-body orbit is a flat loop, like a race track painted on a tilted sheet of glass. Every point of it lies in one plane through Earth's center. That plane is perpendicular to the **angular momentum** vector $\mathbf h = \mathbf r \times \mathbf v$, which never changes in two-body motion. So the three points must be **[[coplanar|coplanar-check]]** — in one plane. If they are not, either the three fixes are not the same object or one measurement is bad. No algebra can recover a real orbit from them.

To check, take $\mathbf N_{23} = \mathbf r_2 \times \mathbf r_3$. It points straight out of the plane of $\mathbf r_2$ and $\mathbf r_3$. The angle between $\mathbf r_1$ and that plane is

$$
\varepsilon_{\text{coplanar}} = \arcsin\!\left(\frac{|\mathbf r_1\cdot\mathbf N_{23}|}{r_1 N_{23}}\right).
$$

(Read $\varepsilon$ as "epsilon". Here $r_1$ is the length of $\mathbf r_1$, and $N_{23}$ the length of $\mathbf N_{23}$.) The dot product over the two lengths is the cosine of the angle between $\mathbf r_1$ and the normal. The angle to the plane is the rest of $90^\circ$, so its sine equals that cosine. Run this check before anything else. A few thousandths of a degree is round-off. A degree or more means stop and look at the data, not the algorithm.

### The formula

Any two points on one orbit are tied together by the **[[Lagrange coefficients|lagrange-f-g]]** $f$ and $g$, which you met in the two-body module:

$$
\mathbf r_1 = f_1\mathbf r_2 + g_1\mathbf v_2, \qquad \mathbf r_3 = f_3\mathbf r_2 + g_3\mathbf v_2 .
$$

In words: any point on the orbit is some amount of "where you are now" plus some amount of "which way you are going now". The numbers $f_1, g_1, f_3, g_3$ depend on how far around the orbit each point is.

From these, three helper vectors are built out of cross products and lengths:

$$
\mathbf D = \mathbf r_1\times\mathbf r_2 + \mathbf r_2\times\mathbf r_3 + \mathbf r_3\times\mathbf r_1,
$$

$$
\mathbf N = r_1(\mathbf r_2\times\mathbf r_3) + r_2(\mathbf r_3\times\mathbf r_1) + r_3(\mathbf r_1\times\mathbf r_2), \qquad
\mathbf S = (r_2-r_3)\mathbf r_1 + (r_3-r_1)\mathbf r_2 + (r_1-r_2)\mathbf r_3 .
$$

Then Gibbs' closed form is

$$
\mathbf v_2 = \sqrt{\frac{\mu}{N D}}\left[\frac{\mathbf D\times\mathbf r_2}{r_2} + \mathbf S\right], \qquad N=|\mathbf N|,\quad D=|\mathbf D| ,
$$

where $\mu$ ("mew") is Earth's gravitational parameter, $3.986\times10^{14}\,\mathrm{m^3/s^2}$.

::: note Why it has to be true: every cross product points along h
Cross the first Lagrange relation with $\mathbf r_2$. The term $f_1\,\mathbf r_2\times\mathbf r_2$ vanishes, because any vector crossed with itself is zero. What is left is $\mathbf r_1\times\mathbf r_2 = g_1(\mathbf v_2\times\mathbf r_2) = -g_1\mathbf h$. In the same way, $\mathbf r_2\times\mathbf r_3 = g_3(\mathbf r_2\times\mathbf v_2) = g_3\mathbf h$. Crossing the two relations together,

$$
\mathbf r_3\times\mathbf r_1 = (f_3\mathbf r_2+g_3\mathbf v_2)\times(f_1\mathbf r_2+g_1\mathbf v_2) = (f_3g_1-f_1g_3)\,\mathbf h ,
$$

using $\mathbf r_2\times\mathbf r_2=\mathbf v_2\times\mathbf v_2=\mathbf 0$. All three cross products point along $\mathbf h$, so $\mathbf D$ and $\mathbf N$ do too. Carrying the same substitution through $\mathbf S$ and tidying with the vector triple-product identity gives the formula above. The full page of algebra is in Curtis's *Orbital Mechanics for Engineering Students*, Chapter 5.
:::

::: key Gibbs' method
Given three coplanar position vectors $\mathbf r_1,\mathbf r_2,\mathbf r_3$ (no times needed), $\mathbf D=\sum\mathbf r_i\times\mathbf r_j$, $\mathbf N=\sum r_i(\mathbf r_j\times\mathbf r_k)$, $\mathbf S=\sum(r_i-r_j)\mathbf r_k$, then $\mathbf v_2=\sqrt{\mu/(ND)}\,[(\mathbf D\times\mathbf r_2)/r_2+\mathbf S]$. It is purely geometric and exact for any separation in exact arithmetic. In a computer it subtracts nearly equal cross products, so it breaks down when the three points crowd within a few degrees of each other.
:::

::: example Gibbs on a well-spread arc
Take a near-circular orbit at $400\,\mathrm{km}$ altitude: semi-major axis $a=6778.137\,\mathrm{km}$, eccentricity $e=0.001$, inclination $51.6^\circ$ (the space station's), period $5553.6\,\mathrm s$. Integrate it numerically and sample it at $t = 445.73$, $600.00$ and $754.27\,\mathrm s$. That spreads the three points $20.03^\circ$ around the orbit, like a radar pass with three looks.

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 3.986004418e14                      # Earth's mu, m^3/s^2

def eom(t, y):                           # two-body equations of motion
    r, v = y[:3], y[3:]
    return np.concatenate([v, -MU*r/np.linalg.norm(r)**3])

def gibbs(r1, r2, r3, mu=MU):
    n1, n2, n3 = map(np.linalg.norm, (r1, r2, r3))
    N = n1*np.cross(r2, r3) + n2*np.cross(r3, r1) + n3*np.cross(r1, r2)
    D = np.cross(r1, r2) + np.cross(r2, r3) + np.cross(r3, r1)
    S = (n2 - n3)*r1 + (n3 - n1)*r2 + (n1 - n2)*r3
    return np.sqrt(mu/(np.linalg.norm(N)*np.linalg.norm(D))) * (np.cross(D, r2)/n2 + S)

def coplanarity_deg(r1, r2, r3):
    N23 = np.cross(r2, r3)
    return np.degrees(np.arcsin(abs(r1 @ N23)/(np.linalg.norm(r1)*np.linalg.norm(N23))))

r0 = np.array([-2974101.394, 2974101.394, 5306669.638])   # m
v0 = np.array([-5427.914687, -5427.914687, 0.0])          # m/s
sol = solve_ivp(eom, (0, 800), np.concatenate([r0, v0]), method="DOP853",
                rtol=1e-13, atol=1e-8, dense_output=True)
t1, t2, t3 = 445.73, 600.00, 754.27
r1, r2, r3 = (sol.sol(t)[:3] for t in (t1, t2, t3))
v2_true = sol.sol(t2)[3:]
v2 = gibbs(r1, r2, r3)
print("coplanarity (deg):", coplanarity_deg(r1, r2, r3))
print("v2 Gibbs:", np.round(v2, 1), "m/s")
print("v2 truth:", np.round(v2_true, 1), "m/s")
print("error:", np.linalg.norm(v2 - v2_true), "m/s")
# coplanarity (deg): 4.9e-15
# v2 Gibbs: [-2103.5 -6339.6 -3779.3] m/s
# v2 truth: [-2103.5 -6339.6 -3779.3] m/s
# error: 6.5e-09 m/s
```

The coplanarity angle is $5\times10^{-15}$ degrees — zero, up to round-off, as it must be for clean two-body data. The velocity error is about $7\times10^{-9}\,\mathrm{m/s}$ on a speed of $7676\,\mathrm{m/s}$: right to about twelve figures. Well-spread points and no approximations: this is the case Gibbs was built for.
:::

## When the points are close together: Herrick-Gibbs

Gibbs' formula is exact in exact arithmetic. A computer, though, keeps only about sixteen digits. As the three points crowd together, the cross products in $\mathbf D$, $\mathbf N$ and $\mathbf S$ become differences of nearly equal numbers. Subtracting nearly equal numbers wipes out most of their digits. This is called **[[catastrophic cancellation|cancellation]]**: the same tiny error in the inputs becomes a bigger and bigger error in $\mathbf v_2$ as the separation shrinks. The geometry is fine. The arithmetic is not.

**Herrick-Gibbs' method** takes a different road. It uses the three times as well as the three positions. It writes the position near the middle time as a short **[[Taylor series|taylor-series]]** — position, plus velocity times time, plus acceleration times time squared over two, and so on — and it knows the acceleration exactly, because two-body gravity is $\ddot{\mathbf r} = -\mu\mathbf r/r^3$. Eliminating the unknown higher terms between the three expansions gives the velocity.

For times $t_1<t_2<t_3$ (they need not be evenly spaced), write $\Delta t_{21}=t_2-t_1$, $\Delta t_{32}=t_3-t_2$ and $\Delta t_{31}=t_3-t_1$. Then

$$
\mathbf v_2 = -\Delta t_{32}\left(\frac{1}{\Delta t_{21}\Delta t_{31}}+\frac{\mu}{12\,r_1^3}\right)\mathbf r_1
+ (\Delta t_{32}-\Delta t_{21})\left(\frac{1}{\Delta t_{21}\Delta t_{32}}+\frac{\mu}{12\,r_2^3}\right)\mathbf r_2
+ \Delta t_{21}\left(\frac{1}{\Delta t_{32}\Delta t_{31}}+\frac{\mu}{12\,r_3^3}\right)\mathbf r_3 .
$$

Look at its shape. With the gravity terms removed, and even spacing, it is $(\mathbf r_3-\mathbf r_1)/\Delta t_{31}$: the distance traveled divided by the time taken, like working out a car's speed from two photos. The $\mu/(12r_i^3)$ terms correct for the bend of the orbit between the photos.

So Herrick-Gibbs has two errors. **Truncation error** comes from cutting the Taylor series short; it is tiny for close points and grows as they spread, because the orbit bends more. **Noise sensitivity** comes from dividing a difference of positions by a time; it grows like one over the separation. Gibbs has no truncation error, but its noise sensitivity grows like one over the separation *squared*, because it multiplies small cross products together. Somewhere in between, the two must cross.

::: key Herrick-Gibbs' method
Same three positions as Gibbs, plus their times. $\mathbf v_2$ is a weighted sum of $\mathbf r_1,\mathbf r_2,\mathbf r_3$, with $\mu/(12r_i^3)$ correction terms from the known two-body acceleration. It is a truncated Taylor expansion, so it wants SMALL separation: its error from input noise grows only like one over the separation, while its truncation error grows as the points spread. The crossover with Gibbs is usually quoted as one to five degrees of arc.
:::

::: example Where Gibbs and Herrick-Gibbs cross
Same orbit. Center the three times on $t_2=600\,\mathrm s$, spread them evenly, and shrink the total separation from $30^\circ$ down to $0.1^\circ$. Compare each method's velocity error against the exact two-body answer. No noise is added — the only errors are truncation and the computer's own round-off:

```python
# separation(deg)   err Gibbs (m/s)   err Herrick-Gibbs (m/s)   better
#     30.0             3.1e-11            7.1e-01               Gibbs
#     10.0             9.8e-10            8.8e-03               Gibbs
#      3.0             7.8e-09            7.1e-05               Gibbs
#      1.5             2.0e-07            4.4e-06               Gibbs
#      1.0             9.8e-07            8.8e-07               Herrick-Gibbs
#      0.7             1.6e-07            2.1e-07               Gibbs
#      0.5             6.3e-07            5.5e-08               Herrick-Gibbs
#      0.3             2.0e-05            7.0e-09               Herrick-Gibbs
#      0.1             4.7e-04            1.3e-09               Herrick-Gibbs
```

Read down the Gibbs column: it gets worse as the points close in, from $3\times10^{-11}$ to $5\times10^{-4}\,\mathrm{m/s}$. Read down the Herrick-Gibbs column: it gets *better*, because its truncation error shrinks. The crossover sits between about $0.5^\circ$ and $1^\circ$. Right around there the winner flips back and forth, because both errors are down at round-off size. At $0.3^\circ$ Herrick-Gibbs is already about $3000$ times more accurate.

That is at the low end of the "one to five degrees" usually quoted. The quoted range is for data with real measurement noise, not for sixteen-digit perfect numbers — and the warning below shows why that matters so much.
:::

::: warning The textbook crossover assumes clean data
Add a random $1\,\mathrm m$ error (one standard deviation, on each axis) to the same three positions, and re-run both methods $600$ times at each separation. Now Herrick-Gibbs wins all the way out to about $16^\circ$. At $12^\circ$, Gibbs' root-mean-square error is $0.126\,\mathrm{m/s}$ against Herrick-Gibbs' $0.022\,\mathrm{m/s}$. At $1^\circ$ it is $17.9$ against $0.16\,\mathrm{m/s}$. The crossover is not a constant of nature. It is set by where the noise sits against each method's own error curve, and dirtier data always favors Herrick-Gibbs over a wider range.
:::

## Angles only: the Gauss method

Neither method helps when the sensor cannot measure distance at all. A telescope sees only a direction, given as two sky angles: **[[right ascension and declination|ra-dec]]**, written $\alpha$ ("alpha") and $\delta$ ("delta"). Picture looking out of a moving train at an airplane. You can point at it, but you cannot tell how far away it is. Point again a minute later, from a different spot on the tracks, and again after that — now the plane's path is pinned down, because you know where *you* were each time and planes fly along smooth paths. The Gauss method does exactly this, with the telescope riding on the spinning Earth.

Each observed direction is a unit **line-of-sight** vector, read "rho hat":

$$
\hat{\boldsymbol\rho}_i = (\cos\delta_i\cos\alpha_i,\ \cos\delta_i\sin\alpha_i,\ \sin\delta_i).
$$

The telescope sits at a known position $\mathbf R_i$ at time $t_i$, worked out from its latitude, longitude and Earth's rotation. The object is somewhere along the sightline, at an unknown **slant range** $\rho_i > 0$ from the telescope:

$$
\mathbf r_i = \mathbf R_i + \rho_i\hat{\boldsymbol\rho}_i .
$$

Three looks give three unknown slant ranges. We need three equations that tie the looks together, and orbital motion supplies them.

### Tying the three looks together

Let $\tau_1 = t_1 - t_2$ and $\tau_3 = t_3 - t_2$ (read "tau"). For a short arc, the Lagrange coefficients have a simple approximate form that depends only on the unknown middle distance $r_2 = |\mathbf r_2|$:

$$
f_1 \approx 1-\frac{\mu}{2r_2^3}\tau_1^2,\qquad g_1\approx\tau_1-\frac{\mu}{6r_2^3}\tau_1^3,\qquad
f_3 \approx 1-\frac{\mu}{2r_2^3}\tau_3^2,\qquad g_3\approx\tau_3-\frac{\mu}{6r_2^3}\tau_3^3 .
$$

Take the two relations $\mathbf r_1=f_1\mathbf r_2+g_1\mathbf v_2$ and $\mathbf r_3=f_3\mathbf r_2+g_3\mathbf v_2$ and eliminate $\mathbf v_2$ between them. What is left says the middle position is a fixed mix of the outer two:

$$
c_1 = \frac{g_3}{f_1g_3-f_3g_1}, \qquad c_3 = \frac{-g_1}{f_1g_3-f_3g_1}, \qquad c_1\mathbf r_1 - \mathbf r_2 + c_3\mathbf r_3 = \mathbf 0 .
$$

Now put in $\mathbf r_i=\mathbf R_i+\rho_i\hat{\boldsymbol\rho}_i$. Once $r_2$ is fixed, $c_1$ and $c_3$ are plain numbers, and the vector equation becomes three ordinary linear equations in the three slant ranges:

$$
\underbrace{\big[\,c_1\hat{\boldsymbol\rho}_1 \ \ {-\hat{\boldsymbol\rho}_2} \ \ c_3\hat{\boldsymbol\rho}_3\,\big]}_{\mathbf M(r_2)}
\begin{pmatrix}\rho_1\\ \rho_2\\ \rho_3\end{pmatrix} = -c_1\mathbf R_1+\mathbf R_2-c_3\mathbf R_3 .
$$

Solve this $3\times3$ system and you have $\rho_2$, so $\mathbf r_2=\mathbf R_2+\rho_2\hat{\boldsymbol\rho}_2$, so a new value of $r_2$. That must match the $r_2$ you assumed when you built $c_1$ and $c_3$. Matching them is one equation in one unknown, which any one-dimensional root finder solves. The classic textbook route clears the fractions and turns it into an **[[eighth-degree polynomial|eighth-degree]]** in $r_2$. Both routes give the same answer.

With all three positions known, the velocity comes from the same two relations. Multiply the first by $f_3$, the second by $f_1$, and subtract; the $\mathbf r_2$ terms cancel:

$$
\mathbf v_2 = \frac{f_1\mathbf r_3 - f_3\mathbf r_1}{f_1g_3-f_3g_1}.
$$

(For a long arc you could hand the three positions to Gibbs instead. For a short arc, Gibbs is the wrong tool, as the last section showed.)

### Where it breaks: nearly parallel sightlines

The determinant of $\mathbf M$ is $-c_1c_3D_0$, where

$$
D_0=\hat{\boldsymbol\rho}_1\cdot(\hat{\boldsymbol\rho}_2\times\hat{\boldsymbol\rho}_3)
$$

is the **scalar triple product** of the three sightlines — the volume of the slanted box they span. Three looks close together in time point in almost the same direction. Three nearly parallel arrows span almost no volume, so $D_0 \to 0$ and $\mathbf M$ becomes nearly impossible to invert. Its **[[condition number|condition-number]]**, $\operatorname{cond}(\mathbf M)$, shoots up. It is the same failure as Gibbs, now in the geometry of the *looks* instead of the orbit.

### Refining the first answer

The short-arc $f$ and $g$ above are approximations. Once a first $(\mathbf r_2,\mathbf v_2)$ exists, compute the *exact* $f$ and $g$ for $\tau_1$ and $\tau_3$ from it (the universal-variable form from the two-body module). Rebuild $\mathbf M$, solve again, and repeat until the answer stops changing.

::: key Gauss angles-only IOD
Three optical observations (right ascension and declination) plus the observer positions $\mathbf R_i$ and times give the orbit. Solve $\mathbf M(r_2)\boldsymbol\rho=-c_1\mathbf R_1+\mathbf R_2-c_3\mathbf R_3$ self-consistently for the middle geocentric distance $r_2$ (classically, an eighth-degree polynomial in $r_2$); the middle slant range $\rho_2$ follows. Then $\mathbf v_2=(f_1\mathbf r_3-f_3\mathbf r_1)/(f_1g_3-f_3g_1)$. $\det\mathbf M\propto D_0=\hat{\boldsymbol\rho}_1\cdot(\hat{\boldsymbol\rho}_2\times\hat{\boldsymbol\rho}_3)$, so it is sensitive to observation spacing: a short arc makes the sightlines nearly coplanar. Refine by iteration with the exact Lagrange coefficients.
:::

::: example A good arc, a short arc, and one arcsecond of noise
A near-circular orbit at about $600\,\mathrm{km}$ altitude ($a=6978.137\,\mathrm{km}$, $e=0.001$, $i=51.6^\circ$) passes straight over a telescope at $6.77^\circ$ latitude at $t_2=300\,\mathrm s$. Two sets of three looks are centered on that moment:

- a **good arc** at $t=(50,\,300,\,550)\,\mathrm s$, with elevations $11.4^\circ$, $90.0^\circ$, $11.3^\circ$;
- a **short arc** at $t=(297,\,300,\,303)\,\mathrm s$, with elevations $87.9^\circ$, $90.0^\circ$, $87.9^\circ$.

They differ only in how much sky they cover. First, with perfect angles:

| Arc | $D_0$ | $\operatorname{cond}(\mathbf M)$ | first-guess error | after 12 refinements |
| --- | --- | --- | --- | --- |
| good ($500\,\mathrm s$) | $-7.77\times10^{-5}$ | $3.51\times10^{4}$ | $3.5\,\mathrm{km}$, $25\,\mathrm{m/s}$ | $1\,\mathrm{\mu m}$, $2.5\times10^{-8}\,\mathrm{m/s}$ |
| short ($6\,\mathrm s$) | $-1.30\times10^{-9}$ | $1.20\times10^{8}$ | $0.30\,\mathrm m$, $3.6\,\mathrm{mm/s}$ | $5\,\mathrm{mm}$, $6\times10^{-5}\,\mathrm{m/s}$ |

The short arc's first guess is actually *better*, because the short-arc $f$ and $g$ are nearly exact over six seconds; the good arc starts kilometers off, and each refinement cuts its error about eightfold. Both look fine. But $D_0$ and $\operatorname{cond}(\mathbf M)$, computed from the geometry alone, already differ by four orders of magnitude. Now add $1$ arcsecond ($1/3600$ of a degree) of random noise to each angle, a good optical precision, and run $300$ independent tries through the same solver:

```python
# 1 arcsecond noise, 300 tries each, 12 refinements
#              valid answers   median position error   median velocity error
# good arc        300/300            18.9 km                 445 m/s
# short arc       155/300            591 km                 7250 m/s
```

The good arc degrades to a rough but usable first orbit — exactly what the next lesson's fitting is built to clean up. The short arc falls apart. Half the tries find no answer with positive slant ranges. The other half put the satellite a few kilometers above the telescope, $591\,\mathrm{km}$ from where it really is. The condition number warned you; nothing else did.
:::

## Laplace's method and the double-r method

Two other classic angles-only methods trade things differently.

**Laplace's method** uses one site tracking continuously. It fits a short curve to the sightline direction near the middle time to get its rate $\dot{\hat{\boldsymbol\rho}}$ ("rho hat dot") and curvature $\ddot{\hat{\boldsymbol\rho}}$, puts them into Newton's law, and solves for the range by algebra. The price is steep: estimating a *second* derivative from noisy angles magnifies the noise badly. So it is more noise-sensitive than Gauss's method and used less in operations.

The **double-r method** guesses two distances directly, usually $r_1$ and $r_3$. It builds the two positions, asks how long an orbit through them would take to fly between them (a Lambert-style time-of-flight check), compares that with the real $t_3-t_1$, and corrects both guesses by Newton's method. It tends to be more robust on longer arcs, where Gauss's short-arc start is poorest, at the cost of a heavier iteration.

All three are angles-only methods, and all three suffer on a short arc. The cure for all three is the same: spread the observations further apart in time. Changing algorithm does not fix a bad arc.

## A single look: range, range-rate and angles together

A tracking radar can measure, at one instant, the slant range $\rho$, the **[[azimuth and elevation|az-el]]** angles $Az$ and $El$, and all three of their rates: six numbers describing the sightline *and* how it is changing. Turning them into a state is not estimation at all, only an exactly reversible change of coordinates.

Work in the station's local **East-North-Up** (ENU) frame. The slant-range vector is

$$
\boldsymbol\rho_{ENU} = \rho\big(\cos El\sin Az,\ \cos El\cos Az,\ \sin El\big).
$$

Differentiate each component with the product rule, treating $\rho$, $Az$ and $El$ as functions of time:

$$
\dot{\boldsymbol\rho}_{ENU} = \begin{pmatrix}
\dot\rho\cos El\sin Az + \rho\dot{Az}\cos El\cos Az - \rho\dot{El}\sin El\sin Az\\
\dot\rho\cos El\cos Az - \rho\dot{Az}\cos El\sin Az - \rho\dot{El}\sin El\cos Az\\
\dot\rho\sin El + \rho\dot{El}\cos El
\end{pmatrix} .
$$

Rotate $\boldsymbol\rho_{ENU}$ into inertial axes and add the station's position to get $\mathbf r$. For the velocity there is one catch: the ENU axes spin with Earth at $\omega_\oplus = 7.292\times10^{-5}\,\mathrm{rad/s}$. So rotate $\dot{\boldsymbol\rho}_{ENU}$ into inertial axes, then add $\boldsymbol\omega_\oplus\times\mathbf r$. That one term carries both the station's own motion and the turning of its axes. Every step is closed-form.

::: example One radar look, turned into a state
A station sits at $40^\circ$ latitude on a round Earth, at a moment when its sidereal angle (its longitude measured from the inertial $x$ axis) is $60^\circ$. It reports

$$
\rho = 655.415\,\mathrm{km},\quad Az=34.436^\circ,\quad El=45.034^\circ,\quad
\dot\rho = 4603.8\,\mathrm{m/s},\quad \dot{Az}=0.319152^\circ/\mathrm s,\quad \dot{El}=-0.451164^\circ/\mathrm s .
$$

```python
import numpy as np
RE, WE = 6378.137e3, 7.292115e-5          # Earth radius (m), spin rate (rad/s)

def radar_to_eci(rho, az, el, rhod, azd, eld, lat, lst):
    R = RE*np.array([np.cos(lat)*np.cos(lst), np.cos(lat)*np.sin(lst), np.sin(lat)])
    E = np.array([-np.sin(lst), np.cos(lst), 0.0])
    N = np.array([-np.sin(lat)*np.cos(lst), -np.sin(lat)*np.sin(lst), np.cos(lat)])
    Q = np.column_stack([E, N, R/RE])     # ENU components -> inertial components
    ce, se, ca, sa = np.cos(el), np.sin(el), np.cos(az), np.sin(az)
    p = rho*np.array([ce*sa, ce*ca, se])
    pd = np.array([rhod*ce*sa + rho*azd*ce*ca - rho*eld*se*sa,
                   rhod*ce*ca - rho*azd*ce*sa - rho*eld*se*ca,
                   rhod*se + rho*eld*ce])
    r = R + Q@p
    v = Q@pd + np.cross([0.0, 0.0, WE], r)
    return r, v

d = np.radians
r, v = radar_to_eci(655.415e3, d(34.436), d(45.034), 4603.8, d(0.319152), d(-0.451164), d(40.0), d(60.0))
print(np.round(r/1e3, 3), "km")           # [2270.983 4457.293 4690.497] km
print(np.round(v/1e3, 4), "km/s")         # [-7.0601  0.5652  2.9943] km/s
```

The true state was $\mathbf r=(2270.980,\ 4457.293,\ 4690.496)\,\mathrm{km}$ and $\mathbf v=(-7.0601,\ 0.5652,\ 2.9943)\,\mathrm{km/s}$. The answer is off by $2.9\,\mathrm m$ and $0.05\,\mathrm{m/s}$, all of it from rounding the six inputs as printed: a thousandth of a degree seen from $655\,\mathrm{km}$ is about $11\,\mathrm m$ sideways. Fed unrounded values, the code agrees to under a nanometer. No crossover, no iteration: each input error passes through once, at its own size.
:::

::: warning What each family actually needs
Gibbs needs three positions and no times; Herrick-Gibbs needs the times too. Gauss, Laplace and double-r need angles *and* the observer's own position at each time — without the observer moving between looks, angles alone cannot pin down range. The single radar look needs neither an arc nor iteration, but it does need the station's exact position and orientation at that instant.
:::

## Check yourself

::: check
A survey turns up three "position fixes" of one cataloged object, with a coplanarity error of $4.2^\circ$. Can you use Gibbs' method? What should you do first?
:::

::: answer
No. $4.2^\circ$ is far above the round-off level of a truly coplanar triple (a few thousandths of a degree or less). Gibbs would return a velocity for an orbit that does not exist. First check the data association: one fix may belong to another object, be mistimed, or carry a large angle error. Find and fix (or discard) the bad point, then run Gibbs on a truly coplanar set.
:::

::: check
The three input positions each carry $1\,\mathrm m$ of noise. When you halve the separation, roughly how does each method's noise-driven velocity error change, and why?
:::

::: answer
Herrick-Gibbs' error roughly doubles; Gibbs' roughly quadruples. Herrick-Gibbs is at heart $(\mathbf r_3-\mathbf r_1)/\Delta t_{31}$: halve the time and the same position noise is divided by half as much, so the error doubles. Gibbs builds $\mathbf D$ and $\mathbf N$ from cross products of nearly parallel vectors, each shrinking with the separation, and combining them makes its error grow like one over the separation squared. The 1 m runs show it: from $1^\circ$ to $0.5^\circ$, Herrick-Gibbs went from $0.16$ to $0.31\,\mathrm{m/s}$, Gibbs from $17.9$ to $72\,\mathrm{m/s}$.
:::

::: check
In the Gauss example, $D_0$ for the short arc is about $60{,}000$ times smaller than for the good arc, but $\operatorname{cond}(\mathbf M)$ is only about $3400$ times larger. Is that a contradiction?
:::

::: answer
No. The determinant of $\mathbf M$ is $-c_1c_3D_0$, and $c_1$, $c_3$ change between the arcs too. More importantly, the condition number is the *ratio* of the largest to the smallest singular value — the matrix's strongest and weakest stretch — while the determinant is their *product*. Squashing one direction shrinks one and raises the other, but not in lockstep. Both agree on what matters: the short arc is far worse conditioned.
:::

::: check
Why does the single range-and-range-rate look have no "short arc" failure, when every angles-only method does?
:::

::: answer
The angles-only methods (and Gibbs and Herrick-Gibbs) get their information from the *change* in geometry between separate observations. A short arc means a small change, which some step then divides by, and the answer becomes ill-conditioned. A single radar look measures all six numbers at once — three for where the sightline points, three for how it is moving — and a fixed, reversible change of coordinates turns them into a state. There is no small denominator for a short arc to shrink.
:::

::: check
A colleague wants to skip Gauss's refinement and use the first short-arc guess, "since it's already close." Using the example's numbers, argue for or against, for the good arc.
:::

::: answer
Against. On the good arc the first guess was about $3.5\,\mathrm{km}$ and $25\,\mathrm{m/s}$ off even with perfect angles; twelve refinements brought that to about a micrometer and $2.5\times10^{-8}\,\mathrm{m/s}$. Each refinement is one propagation and one $3\times3$ solve — cheap. Gauss's output seeds a fit that assumes a reasonably close start, so skipping refinement gives it a worse start for no saving. (With 1-arcsecond noise the refined answer is still kilometers off, but that is noise, which refinement cannot remove, not approximation, which it can.)
:::

## Summary

| Symbol or idea | Meaning |
| --- | --- |
| $\varepsilon_{\text{coplanar}}=\arcsin(\lvert\mathbf r_1\cdot\mathbf N_{23}\rvert/(r_1 N_{23}))$ | Coplanarity check before Gibbs or Herrick-Gibbs |
| $\mathbf v_2=\sqrt{\mu/(ND)}\,[(\mathbf D\times\mathbf r_2)/r_2+\mathbf S]$ | Gibbs: geometry only, no times; fails at small separation |
| $\mathbf v_2 = \sum_i w_i\,\mathbf r_i$, weights with $\mu/(12r_i^3)$ | Herrick-Gibbs: uses times; wants small separation |
| Crossover | About $1^\circ$ with perfect data; about $16^\circ$ with $1\,\mathrm m$ noise; usually quoted as one to five degrees |
| $\hat{\boldsymbol\rho}_i=(\cos\delta_i\cos\alpha_i,\cos\delta_i\sin\alpha_i,\sin\delta_i)$ | Line-of-sight unit vector from right ascension and declination |
| $\mathbf M(r_2)\boldsymbol\rho = -c_1\mathbf R_1+\mathbf R_2-c_3\mathbf R_3$ | Gauss: solve self-consistently for $r_2$ (eighth-degree polynomial), then refine |
| $D_0=\hat{\boldsymbol\rho}_1\cdot(\hat{\boldsymbol\rho}_2\times\hat{\boldsymbol\rho}_3)$ | Shrinks on a short arc and drives $\operatorname{cond}(\mathbf M)$ up |
| Laplace | One site; fits sightline rate and curvature; noise-sensitive |
| Double-r | Guesses $r_1,r_3$, iterates on time of flight; robust on longer arcs |
| Range, angles and rates | One look, six numbers, exact change of coordinates |

Every method here hands off a state that is only roughly right. The next lesson takes that state as a starting guess and builds the batch least-squares machinery — the state transition matrix and the normal equations — that turns it, plus every later observation, into the best fit the data supports.

::: context coplanar-check Why one flat plane
Gravity from a round Earth always pulls straight toward Earth's center. A pull toward the center cannot twist the orbit, so the angular momentum $\mathbf h=\mathbf r\times\mathbf v$ never changes direction. Since $\mathbf r$ is always perpendicular to $\mathbf h$, the satellite stays in the one plane perpendicular to $\mathbf h$ forever.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <polygon points="40,110 250,140 330,60 120,30" fill="#8fb8f0" fill-opacity="0.35" stroke="#1f2a44" stroke-width="1.5"/>
  <ellipse cx="185" cy="85" rx="95" ry="32" fill="none" stroke="#1d6fd1" stroke-width="2" transform="rotate(-8 185 85)"/>
  <circle cx="185" cy="85" r="7" fill="#1f2a44"/>
  <line x1="185" y1="85" x2="185" y2="12" stroke="#b4232c" stroke-width="2"/>
  <polygon points="185,8 180,18 190,18" fill="#b4232c"/>
  <text x="193" y="20" font-size="12" fill="#b4232c">h</text>
  <circle cx="98" cy="108" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="149" cy="119" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <circle cx="236" cy="106" r="4" fill="#f2b880" stroke="#1f2a44"/>
  <text x="80" y="104" font-size="11" fill="#1f2a44">r1</text>
  <text x="140" y="135" font-size="11" fill="#1f2a44">r2</text>
  <text x="242" y="122" font-size="11" fill="#1f2a44">r3</text>
  <text x="20" y="152" font-size="11" fill="#6c7a93">all three fixes lie in the orbit plane, perpendicular to h</text>
</svg>
```

Real orbits wobble out of their plane slowly, because Earth's bulge does twist them a little. Over the minutes of one pass the effect is far below the "one degree means bad data" level.
:::

::: context lagrange-f-g The same f and g, back again
In the two-body module, $f$ and $g$ let you jump from one point on an orbit to any other without integrating: $\mathbf r(t) = f\,\mathbf r_0 + g\,\mathbf v_0$. They exist because the whole orbit lies in the plane spanned by $\mathbf r_0$ and $\mathbf v_0$, so any later position is some mix of the two. Near the start, $f \approx 1$ and $g \approx t$: you are where you were, plus velocity times time. Every method in this lesson leans on that one fact.
:::

::: context cancellation Losing digits by subtracting
Say two numbers are each known to eight digits: $1.2345678$ and $1.2345671$. Their difference is $0.0000007$ — and only its first digit means anything, because the other seven were identical in both numbers and canceled. You started with eight good digits and kept one.

A computer keeps about sixteen digits. When Gibbs crosses two nearly parallel position vectors, most of those digits cancel in the same way, and any noise in the inputs is suddenly huge compared with what survives. Nothing is wrong with the formula; the subtraction ate the information.
:::

::: context taylor-series Predicting from here and now
A Taylor series predicts where something will be a moment from now using what you know right now: position, plus velocity times time, plus half the acceleration times time squared, plus smaller terms. For short times the first few terms are nearly perfect. For long times the dropped terms matter, and the prediction drifts. That drift is Herrick-Gibbs' truncation error, and it is why the method wants points close together. Taylor series come back in the next two lessons, where they explain what "linearizing" an orbit means.
:::

::: context ra-dec Latitude and longitude for the sky
Astronomers paint an imaginary globe around Earth and give every star two angles on it. **Declination** is like latitude: degrees north or south of the sky's equator. **Right ascension** is like longitude, measured eastward from a fixed direction among the stars. Because the grid is fixed to the stars, not to the spinning Earth, a telescope's reading means the same direction in inertial space no matter when it was taken. The formula for $\hat{\boldsymbol\rho}$ is the usual spherical-to-Cartesian conversion, with declination playing the part of latitude.
:::

::: context eighth-degree Why degree eight, and who first did it
Write $\rho_2$ in terms of $r_2$ from the linear system: it comes out as $\rho_2 = A + \mu B/r_2^3$, with $A$ and $B$ fixed by the geometry. Then use the triangle Earth-center, telescope, satellite: $r_2^2 = R_2^2 + 2\rho_2(\mathbf R_2\cdot\hat{\boldsymbol\rho}_2) + \rho_2^2$. Substituting and multiplying through by $r_2^6$ gives $r_2^8 + a\,r_2^6 + b\,r_2^3 + c = 0$.

Carl Friedrich Gauss built the first version of this method at age 24 to find the dwarf planet Ceres, which had been seen for only about six weeks in 1801 before it vanished into the Sun's glare. Using his predicted position, astronomers found it again that December.
:::

::: context condition-number How much a problem magnifies errors
The condition number of a matrix tells you how much a small error in the input can grow in the output of a solve. A condition number of $10^4$ means you may lose about four of your sixteen digits; $10^8$ means about eight. It depends only on the matrix — the geometry — not on the measurements. That is why it can warn you about a bad arc before any data arrives. The least-squares module used the same number for its design matrices, and the next lesson meets it again in the batch normal equations.
:::

::: context az-el Pointing a dish
**Azimuth** is the compass direction: $0^\circ$ north, $90^\circ$ east. **Elevation** is the angle above the horizon: $0^\circ$ on the horizon, $90^\circ$ straight overhead.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <ellipse cx="170" cy="120" rx="140" ry="36" fill="#fff" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="170" y1="120" x2="170" y2="84" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="176" y="80" font-size="11" fill="#6c7a93">N</text>
  <line x1="170" y1="120" x2="310" y2="120" stroke="#6c7a93" stroke-width="1.5"/>
  <text x="314" y="124" font-size="11" fill="#6c7a93">E</text>
  <line x1="170" y1="120" x2="170" y2="20" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="176" y="24" font-size="11" fill="#6c7a93">Up</text>
  <line x1="170" y1="120" x2="256" y2="100" stroke="#1d6fd1" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="170" y1="120" x2="256" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <line x1="256" y1="100" x2="256" y2="40" stroke="#6c7a93" stroke-width="1" stroke-dasharray="3 3"/>
  <circle cx="256" cy="40" r="5" fill="#b4232c"/>
  <text x="264" y="40" font-size="12" fill="#b4232c">satellite</text>
  <path d="M170,96 A24,24 0 0,1 193,114" fill="none" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="192" y="100" font-size="12" fill="#1d6fd1">Az</text>
  <path d="M212,110 A43,43 0 0,0 202,90" fill="none" stroke="#b4232c" stroke-width="1.5"/>
  <text x="214" y="86" font-size="12" fill="#b4232c">El</text>
  <text x="120" y="164" font-size="11" fill="#1f2a44">Az measured from north on the ground, El up from it</text>
</svg>
```

A radar reports these two angles plus the range. Watching them change also gives their rates, and those rates hold the velocity information.
:::
