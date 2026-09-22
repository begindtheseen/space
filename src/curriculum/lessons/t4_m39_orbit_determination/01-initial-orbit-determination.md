---
id: l01-initial-orbit-determination
title: "Initial orbit determination: Gibbs, Herrick-Gibbs and Gauss angles-only"
minutes: 27
covers:
  - "Initial orbit determination: angles-only (Gauss, Laplace, double-r), three position vectors (Gibbs, Herrick-Gibbs), range and range-rate methods"
---

Every orbit determination in this module starts either from a good estimate that more data will refine, or from nothing at all. A collision-avoidance screen flags a new piece of debris; a satellite drops out of contact and comes back after an anomaly; a payload separates and needs a first fix before an antenna can be pointed at it with any confidence. In every one of these the estimator has no prior state to linearize about — only a handful of raw measurements, taken over minutes to hours, from one sensor or a few. Initial orbit determination (IOD) is the set of classical, closed-form or nearly closed-form methods that turn that handful of measurements directly into a six-element state, with no dynamical iteration and no prior.

IOD is not where orbit determination ends — its output is deliberately rough, good enough to seed the differential-correction machinery of the next several lessons, which refines it against every observation with a full dynamical model and an honest covariance. But the classical methods reward the effort of learning them properly: they need no starting guess, they are fast, and the precise way each one fails teaches what "enough data" and "good geometry" mean for every estimator this module builds afterward.

Three families cover the practical cases. Given three inertial position vectors of the same object — from radar, laser, or a chain of earlier fixes — Gibbs' method and Herrick-Gibbs' method recover a velocity by pure geometry. Given only angles — right ascension and declination from an optical telescope that cannot measure range at all — the Gauss method, and its relatives Laplace's method and the double-r method, recover the missing ranges from the geometry of the observer's own motion. And if a single radar look gives range, angles, and all their rates at once, recovering the state is not an estimation problem at all: it is an exact coordinate transformation, with nothing to condition.

## Three positions, no times: Gibbs' method

Suppose three position vectors $\mathbf r_1, \mathbf r_2, \mathbf r_3$ of the same orbiting body are known exactly, with no times attached, and the goal is the velocity $\mathbf v_2$ at the middle one — which, together with $\mathbf r_2$, is a complete state. This is Gibbs' method, the natural tool whenever range-and-angle data has already been converted to Cartesian fixes.

The three vectors must first be coplanar: every point of a two-body orbit lies in the plane through the focus perpendicular to the fixed angular momentum $\mathbf h$. If they are not coplanar, either the three fixes are not the same object or one measurement is bad, and no amount of algebra recovers a real orbit from them. Check the angle between $\mathbf r_1$ and the plane of $\mathbf r_2,\mathbf r_3$: with $\mathbf N_{23}=\mathbf r_2\times\mathbf r_3$ normal to that plane, $\hat{\mathbf r}_1\cdot\hat{\mathbf N}_{23}$ is the cosine of the angle between $\mathbf r_1$ and the normal, and its complement is the angle between $\mathbf r_1$ and the plane itself:

$$
\varepsilon_{\text{coplanar}} = \arcsin\!\left(\frac{|\mathbf r_1\cdot\mathbf N_{23}|}{r_1 N_{23}}\right).
$$

Run this before anything else. A few thousandths of a degree is ordinary round-off; a degree or more means stop and look at the data, not the algorithm.

With coplanarity established, recall from the two-body module's Lagrange-coefficients lesson that any two points on the same orbit are linear combinations of $(\mathbf r_2,\mathbf v_2)$:

$$
\mathbf r_1 = f_1\mathbf r_2 + g_1\mathbf v_2, \qquad \mathbf r_3 = f_3\mathbf r_2 + g_3\mathbf v_2,
$$

for scalars $f_1,g_1,f_3,g_3$ depending only on the true-anomaly change to each point. Crossing the first relation with $\mathbf r_2$ kills the $f_1\mathbf r_2\times\mathbf r_2$ term and leaves $\mathbf r_1\times\mathbf r_2=g_1(\mathbf v_2\times\mathbf r_2)=-g_1\mathbf h$; symmetrically $\mathbf r_2\times\mathbf r_3=g_3(\mathbf r_2\times\mathbf v_2)=g_3\mathbf h$; and crossing the two relations together,

$$
\mathbf r_3\times\mathbf r_1 = (f_3\mathbf r_2+g_3\mathbf v_2)\times(f_1\mathbf r_2+g_1\mathbf v_2) = (f_3g_1-f_1g_3)(\mathbf r_2\times\mathbf v_2) = (f_3g_1-f_1g_3)\,\mathbf h,
$$

using $\mathbf r_2\times\mathbf r_2=\mathbf v_2\times\mathbf v_2=\mathbf 0$. All three cross products are along $\mathbf h$, so their sum

$$
\mathbf D \equiv \mathbf r_1\times\mathbf r_2 + \mathbf r_2\times\mathbf r_3 + \mathbf r_3\times\mathbf r_1
$$

is too — a fact you can check numerically on any coplanar triple. Weighting the same three cross products by the opposite point's distance, and by pairwise differences of distance, produces two companion vectors,

$$
\mathbf N \equiv r_1(\mathbf r_2\times\mathbf r_3) + r_2(\mathbf r_3\times\mathbf r_1) + r_3(\mathbf r_1\times\mathbf r_2), \qquad
\mathbf S \equiv (r_2-r_3)\mathbf r_1 + (r_3-r_1)\mathbf r_2 + (r_1-r_2)\mathbf r_3 .
$$

Carrying the same substitution through and assembling the result with the vector triple-product identity (the full page of algebra is in Curtis or Battin; it is not repeated here) gives Gibbs' closed form:

$$
\mathbf v_2 = \sqrt{\frac{\mu}{N D}}\left[\frac{\mathbf D\times\mathbf r_2}{r_2} + \mathbf S\right], \qquad N=|\mathbf N|,\ D=|\mathbf D| .
$$

::: key Gibbs' method
Given three coplanar position vectors $\mathbf r_1,\mathbf r_2,\mathbf r_3$ (no times needed), $\mathbf D=\sum\mathbf r_i\times\mathbf r_j$, $\mathbf N=\sum r_i(\mathbf r_j\times\mathbf r_k)$, $\mathbf S=\sum(r_i-r_j)\mathbf r_k$, then $\mathbf v_2=\sqrt{\mu/(ND)}\,[(\mathbf D\times\mathbf r_2)/r_2+\mathbf S]$. Exact for any separation in exact arithmetic; numerically it differences near-equal cross products, so it degrades as the three points crowd together.
:::

::: example Gibbs on a healthy arc
Take a 400 km-altitude, near-circular orbit ($a=6778.137\,\mathrm{km}$, $e=0.001$, $i=51.6^\circ$, $\Omega=45^\circ$, $\omega=90^\circ$, $\nu_0=0^\circ$; period $T=5553.6\,\mathrm s$), integrated numerically with `scipy.integrate.solve_ivp` and sampled at $t=445.73,\ 600.00,\ 754.27\,\mathrm s$ — a $20.03^\circ$ spread in true anomaly, a plausible multi-look radar pass:

```python
import numpy as np
from scipy.integrate import solve_ivp

MU = 3.986004418e14

def eom(t, y):
    r = y[:3]; v = y[3:]
    return np.concatenate([v, -MU*r/np.linalg.norm(r)**3])

def gibbs(r1, r2, r3, mu=MU):
    n1, n2, n3 = map(np.linalg.norm, (r1, r2, r3))
    N = n1*np.cross(r2, r3) + n2*np.cross(r3, r1) + n3*np.cross(r1, r2)
    D = np.cross(r1, r2) + np.cross(r2, r3) + np.cross(r3, r1)
    S = (n2-n3)*r1 + (n3-n1)*r2 + (n1-n2)*r3
    return np.sqrt(mu/(np.linalg.norm(N)*np.linalg.norm(D))) * (np.cross(D, r2)/n2 + S)

r0 = np.array([-2974101.4, 2974101.4, 5306669.6])
v0 = np.array([-5427.9, -5427.9, 0.0])
sol = solve_ivp(eom, (0, 800), np.concatenate([r0, v0]), rtol=1e-12, atol=1e-6, dense_output=True)
t1, t2, t3 = 445.7327, 600.0, 754.2673
r1, r2, r3 = (sol.sol(t)[:3] for t in (t1, t2, t3))
v2_true = sol.sol(t2)[3:]
v2 = gibbs(r1, r2, r3)
print("v2 (Gibbs) =", v2, "m/s")
print("v2 (truth) =", v2_true, "m/s")
print("error =", np.linalg.norm(v2 - v2_true), "m/s")
# v2 (Gibbs) = [-2103.5  -6339.6  -3779.3] m/s
# v2 (truth) = [-2103.5  -6339.6  -3779.3] m/s
# error = 7.25e-09 m/s
```

Coplanarity error on this triple is $1.7\times10^{-15}$ degrees — exactly zero within double-precision round-off, as it must be for noiseless two-body data — and Gibbs returns the velocity to nine significant figures. This is the regime Gibbs was built for: well-separated points, no truncation, no sensitivity problem.
:::

## When positions are close together: Herrick-Gibbs

Gibbs' formula is exact for any separation, in exact arithmetic. In floating point it is not: $\mathbf D$, $\mathbf N$ and $\mathbf S$ are each built from differences of cross products that shrink as $\mathbf r_1,\mathbf r_2,\mathbf r_3$ crowd together, so a fixed relative error in the inputs produces a growing relative error in $\mathbf v_2$ as the separation shrinks — catastrophic cancellation, not a flaw in the geometry. Herrick-Gibbs is the fix: instead of pure geometry it Taylor-expands position about the middle time, using the two-body acceleration $\ddot{\mathbf r}=-\mu\mathbf r/r^3$ explicitly, so nothing is ever divided by a small cross product.

For times $t_1<t_2<t_3$ (not necessarily evenly spaced), write $\Delta t_{21}=t_2-t_1$, $\Delta t_{32}=t_3-t_2$, $\Delta t_{31}=t_3-t_1$. Expanding $\mathbf r(t)$ to third order about $t_2$ at each of the three times and eliminating the unknown acceleration and jerk between the three expansions — an unevenly-spaced finite-difference construction for the derivative, corrected with the known $-\mu\mathbf r/r^3$ curvature term instead of left as pure round-off-limited differencing — gives

$$
\mathbf v_2 = -\Delta t_{32}\left(\frac{1}{\Delta t_{21}\Delta t_{31}}+\frac{\mu}{12\,r_1^3}\right)\mathbf r_1
+ (\Delta t_{32}-\Delta t_{21})\left(\frac{1}{\Delta t_{21}\Delta t_{32}}+\frac{\mu}{12\,r_2^3}\right)\mathbf r_2
+ \Delta t_{21}\left(\frac{1}{\Delta t_{32}\Delta t_{31}}+\frac{\mu}{12\,r_3^3}\right)\mathbf r_3 .
$$

Every term is a weighted sum, never a difference of near-equal quantities, so the formula stays well conditioned as the points crowd together. What it does have is truncation error from stopping the Taylor series at third order, and that error grows — slowly — as the points spread apart. Gibbs has zero truncation error and growing conditioning error as separation shrinks; Herrick-Gibbs has negligible conditioning error and growing truncation error as separation grows. Somewhere between, the two must cross.

::: key Herrick-Gibbs' method
Same three position vectors as Gibbs, plus their times. $\mathbf v_2$ is a weighted sum of $\mathbf r_1,\mathbf r_2,\mathbf r_3$ with $\mu/(12r_i^3)$ correction terms — no cross products, no differences of near-equal quantities — so it stays well conditioned at small separation, at the cost of Taylor-series truncation error that grows at large separation.
:::

::: example Where Gibbs and Herrick-Gibbs cross
Same orbit as above. Sweep the half-span of the three sample times from $1100\,\mathrm s$ down to $0.02\,\mathrm s$ (capped well under one period, so the true-anomaly spread never wraps past itself), and compare each method's velocity error against the numerically integrated truth:

```python
# separation(deg)   e_Gibbs (m/s)   e_HerrickGibbs (m/s)   winner
#     38.545           5.69e-09           1.907e+00          Gibbs
#     10.403           6.53e-09           1.018e-02          Gibbs
#      4.344           3.56e-09           3.099e-04          Gibbs
#      1.814           8.87e-08           9.426e-06          Gibbs
#      1.172           9.20e-08           1.699e-06          Gibbs
#      0.758           1.20e-06           3.498e-07          Herrick-Gibbs
#      0.316           6.20e-06           2.034e-08          Herrick-Gibbs
#      0.085           5.59e-04           5.054e-10          Herrick-Gibbs
```

The crossover — computed, not assumed — falls between $0.76^\circ$ and $1.17^\circ$ of true-anomaly spread on this orbit, at the low end of the one-to-five-degree range usually quoted for it. That quoted range describes data with real measurement noise, not double-precision arithmetic; the worked case below shows why realistic noise pushes the practical crossover much wider than round-off alone would suggest.

At $\pm 3\,\mathrm s$ about the centre ($0.390^\circ$ separation, still noiseless), Gibbs and Herrick-Gibbs agree to nine figures with the truth, but their *errors* differ by a factor of 73: Gibbs misses by $2.95\times10^{-6}\,\mathrm{m/s}$, Herrick-Gibbs by $4.03\times10^{-8}\,\mathrm{m/s}$ — both invisible operationally, but the gap is the same mechanism that becomes decisive once real noise is added.
:::

::: warning The textbook crossover assumes clean data
Add a representative $1\,\mathrm m$ (one-sigma, per axis) position error to the same three vectors and re-run both formulas $600$ times per separation. Herrick-Gibbs now wins out to nearly $20^\circ$ of separation (at $12^\circ$: Gibbs' RMS error is $0.117\,\mathrm{m/s}$ against Herrick-Gibbs' $0.023\,\mathrm{m/s}$; only past about $20^\circ$ does Gibbs' better conditioning start to beat Herrick-Gibbs' now-larger truncation bias). The crossover is not a universal constant: it is set by where the input noise floor sits relative to each method's own error curve, and dirtier data always favours Herrick-Gibbs over a wider range.
:::

## Angles only: the Gauss method

Neither Gibbs nor Herrick-Gibbs helps when the sensor cannot measure range at all — an optical telescope returns a direction, right ascension $\alpha$ and declination $\delta$, and nothing else. Three such looks, each from a known observer position $\mathbf R_i$ (a ground station's position in the same inertial frame, computed from its latitude, longitude and the observation time through Earth's rotation) at a known time $t_i$, are enough to recover the full orbit, because the observer moves between looks and that motion, combined with two-body dynamics, breaks the range ambiguity. This is the Gauss method.

Each observed direction is a unit line-of-sight vector,
$$
\hat{\boldsymbol\rho}_i = (\cos\delta_i\cos\alpha_i,\ \cos\delta_i\sin\alpha_i,\ \sin\delta_i),
$$
and the unknown geocentric position is $\mathbf r_i = \mathbf R_i + \rho_i\hat{\boldsymbol\rho}_i$ for an unknown slant range $\rho_i>0$. Three vector equations, three unknown scalars $\rho_1,\rho_2,\rho_3$: this is a well-posed root-finding problem once the geometry connects the three epochs.

With $\tau_1=t_1-t_2$ and $\tau_3=t_3-t_2$, the same Lagrange relations used for Gibbs — now with times available — give, to leading order for a short arc (the two-body module's own small-$\Delta t$ expansion of $f,g$, applied here to $\tau_1$ and $\tau_3$ about the unknown $r_2=|\mathbf r_2|$):
$$
f_1 \approx 1-\frac{\mu}{2r_2^3}\tau_1^2,\qquad g_1\approx\tau_1-\frac{\mu}{6r_2^3}\tau_1^3,\qquad
f_3 \approx 1-\frac{\mu}{2r_2^3}\tau_3^2,\qquad g_3\approx\tau_3-\frac{\mu}{6r_2^3}\tau_3^3 .
$$
Because $\mathbf r_1=f_1\mathbf r_2+g_1\mathbf v_2$ and $\mathbf r_3=f_3\mathbf r_2+g_3\mathbf v_2$, eliminating $\mathbf v_2$ between them expresses $\mathbf r_2$ as a combination of $\mathbf r_1$ and $\mathbf r_3$ — a Gibbs-style relation with coefficients built from $f,g$ rather than assumed geometry:
$$
c_1 = \frac{g_3}{f_1g_3-f_3g_1}, \qquad c_3 = \frac{-g_1}{f_1g_3-f_3g_1}, \qquad c_1\mathbf r_1 - \mathbf r_2 + c_3\mathbf r_3 = \mathbf 0 .
$$
Substituting $\mathbf r_i=\mathbf R_i+\rho_i\hat{\boldsymbol\rho}_i$ turns this single vector equation into three scalar equations, linear in the three unknown ranges once $r_2$ (hence $c_1,c_3$) is fixed:
$$
\underbrace{\big[\,c_1\hat{\boldsymbol\rho}_1 \ \ {-\hat{\boldsymbol\rho}_2} \ \ c_3\hat{\boldsymbol\rho}_3\,\big]}_{\mathbf M(r_2)}
\begin{pmatrix}\rho_1\\ \rho_2\\ \rho_3\end{pmatrix} = -c_1\mathbf R_1+\mathbf R_2-c_3\mathbf R_3 .
$$
Solving this $3\times3$ system gives $\rho_2$, hence $\mathbf r_2=\mathbf R_2+\rho_2\hat{\boldsymbol\rho}_2$, hence a new value of $r_2=|\mathbf r_2|$ — which must equal the $r_2$ assumed when building $c_1,c_3$. That self-consistency condition is one scalar equation in one unknown, solved by any one-dimensional root finder (the classical presentation instead clears denominators into an eighth-degree polynomial in $r_2$ and solves it in closed form; the root-finding view here is the same physics, easier to implement correctly, and identical once converged). Once $\mathbf r_1,\mathbf r_2,\mathbf r_3$ are known, Gibbs' method of the previous section hands back $\mathbf v_2$ directly — Gauss's method *is* Gibbs' method with the ranges supplied by angle geometry instead of a rangefinder.

The determinant of $\mathbf M$ is, up to the scalars $c_1,c_3$, exactly $D_0=\hat{\boldsymbol\rho}_1\cdot(\hat{\boldsymbol\rho}_2\times\hat{\boldsymbol\rho}_3)$ — the scalar triple product of the three *line-of-sight directions*. $D_0\to0$ exactly when the three sightlines are coplanar with each other, which is what a short observation arc looks like: three closely spaced looks point in almost the same direction, and three nearly parallel vectors are always nearly coplanar. So the same failure mode as Gibbs' method reappears here, in the geometry of the *observations* rather than the *orbit*: a short arc drives $D_0\to0$, $\mathbf M$ toward singular, and $\operatorname{cond}(\mathbf M)$ — the same conditioning language used for the normal matrix throughout the least-squares module — toward infinity.

Because the truncated $f,g$ series above is only good for a short $\tau$, real implementations refine the first guess: once $(\mathbf r_2,\mathbf v_2)$ are available, use them to compute the *exact* Lagrange coefficients for $\tau_1,\tau_3$ (universal-variable form, from the two-body module), rebuild $\mathbf M$, and re-solve — iterating a handful of times to convergence, exactly as the module's flashcard for this method says.

::: key Gauss' angles-only method
Three line-of-sight unit vectors $\hat{\boldsymbol\rho}_i$, three observer positions $\mathbf R_i$, three times. Solve $\mathbf M(r_2)\boldsymbol\rho=-c_1\mathbf R_1+\mathbf R_2-c_3\mathbf R_3$ self-consistently for $r_2$ (classically, an eighth-degree polynomial), then hand the three recovered position vectors to Gibbs for $\mathbf v_2$. $\det\mathbf M\propto D_0=\hat{\boldsymbol\rho}_1\cdot(\hat{\boldsymbol\rho}_2\times\hat{\boldsymbol\rho}_3)$: a short arc makes the three sightlines nearly coplanar, $D_0\to0$, and the method ill-conditioned. Refine with the exact (universal-variable) Lagrange coefficients once a first solution exists.
:::

::: example A good arc, a short arc, and what one arcsecond of noise does to each
A $600\,\mathrm{km}$-altitude orbit ($a=6978.137\,\mathrm{km}$, $e=0.001$, $i=51.6^\circ$) passes almost directly over a station at $6.77^\circ$ latitude. Two three-observation arcs are centred on the overhead point at $t_2=300\,\mathrm s$: a **good arc** at $t=(50, 300, 550)\,\mathrm s$ (elevations $11.3^\circ,\,90.0^\circ,\,11.3^\circ$) and a **short arc** at $t=(297,300,303)\,\mathrm s$ (elevations $87.9^\circ,\,90.0^\circ,\,87.9^\circ$) — both perfectly plausible optical passes, differing only in how much of the sky they cover.

Noiseless, both converge (after 4–6 refinement iterations) to the truth almost exactly:

| Arc | $D_0$ | $\operatorname{cond}(\mathbf M)$ | position error | velocity error |
| --- | --- | --- | --- | --- |
| good ($600\,\mathrm s$ span) | $-7.81\times10^{-5}$ | $3.49\times10^{4}$ | $0.0008\,\mathrm m$ | $1.1\times10^{-5}\,\mathrm{m/s}$ |
| short ($6\,\mathrm s$ span) | $-1.30\times10^{-9}$ | $1.20\times10^{8}$ | $0.155\,\mathrm m$ | $1.9\times10^{-3}\,\mathrm{m/s}$ |

Both look excellent — the short arc even edges out the good one, because its truncated-series first guess needs less correction. $D_0$ and $\operatorname{cond}(\mathbf M)$, computed from the geometry alone, before any data is used, already differ by four orders of magnitude between the two arcs. Nothing in the noiseless numbers above reveals that this matters. Add $1$ arcsecond of Gaussian noise to each right ascension and declination — a good, achievable optical precision — and run $300$ independent draws through the same solver:

```python
# 1" noise, 300 draws each, iteratively refined Gauss solution:
#
#              N solved   median pos err   median vel err
# good arc      300/300        20.9 km        492.8 m/s
# short arc        4/300       548.5 km      6738.6 m/s   (296 draws found no valid root at all)
```

The good arc degrades to a rough but entirely usable preliminary orbit — tens of kilometres and hundreds of metres per second, exactly the kind of state a differential-correction filter is built to clean up. The short arc fails outright 99% of the time, and the rare draw that does return an answer is off by half the radius of the Earth. Nothing about the setup looked different between the two cases; the failure shows up only in the answer, exactly as the geometry's condition number predicted it would.
:::

## Laplace's method and the double-r method

Two other classical angles-only methods solve the same problem with a different trade. **Laplace's method** uses a *single* site tracking continuously, fits a short polynomial to the line-of-sight direction near the centre time to get its own rate and curvature, $\hat{\boldsymbol\rho}$, $\dot{\hat{\boldsymbol\rho}}$, $\ddot{\hat{\boldsymbol\rho}}$, and substitutes directly into Newton's law to solve for the range algebraically — no second or third observation epoch needed as separate data, only a good local derivative of the one continuous track. The price is that estimating a second derivative from noisy angle data by numerical differentiation amplifies noise badly, which is why Laplace's method is more noise-sensitive than Gauss's for a typical tracking cadence and is used less often operationally, even though it needs less raw data in principle.

The **double-r method** takes the opposite approach to Gauss: instead of solving self-consistently for $r_2$ alone, it guesses two ranges directly (commonly $r_1$ and $r_3$), builds the corresponding position vectors, and checks the *time of flight* an orbit through those two points would take against the known $t_1,t_3$ — a Lambert-style consistency check — then corrects both guesses with a two-dimensional Newton iteration. It avoids the polynomial-degree blow-up of Gauss's construction and tends to be the more robust choice for longer arcs, where Gauss's truncated-series starting guess needs the most correction; the trade is a heavier iteration (two coupled unknowns instead of one) for each attempt.

Both remain angles-only methods, and both inherit the same underlying sensitivity to a short or nearly degenerate arc that the worked example above demonstrated for Gauss's construction — spreading the observations further apart in time is the fix for all three, not a change of algorithm.

## A single look: range, range-rate and angles together

A tracking radar that measures slant range $\rho$, azimuth $Az$, elevation $El$, and all three of their rates in one instant hands over something qualitatively different from an angles-only fix: a complete instantaneous description of the line-of-sight vector *and* its rate of change. Converting it to an inertial state is not an estimation problem — there is nothing to condition, because six independent numbers map to six state components through an invertible coordinate transformation, exactly once, with no iteration.

Work in the station's local East-North-Up (ENU) frame, related to right-handed ECI axes $(\hat{\mathbf E},\hat{\mathbf N},\hat{\mathbf U})$ that themselves rotate with the Earth. The slant-range vector in ENU components is
$$
\boldsymbol\rho_{ENU} = \rho\big(\cos El\sin Az,\ \cos El\cos Az,\ \sin El\big),
$$
and its ENU-frame rate — differentiating with $\rho,Az,El$ all functions of time —
$$
\dot{\boldsymbol\rho}_{ENU} = \begin{pmatrix}
\dot\rho\cos El\sin Az + \rho\dot{Az}\cos El\cos Az - \rho\dot{El}\sin El\sin Az\\
\dot\rho\cos El\cos Az - \rho\dot{Az}\cos El\sin Az - \rho\dot{El}\sin El\cos Az\\
\dot\rho\sin El + \rho\dot{El}\cos El
\end{pmatrix} .
$$
Rotating $\boldsymbol\rho_{ENU}$ into ECI with the station's (time-varying) rotation matrix and adding the station's own ECI position gives $\mathbf r$; rotating $\dot{\boldsymbol\rho}_{ENU}$ into ECI, adding the *derivative* of the rotation acting on $\boldsymbol\rho_{ENU}$ (because the ENU axes themselves rotate with Earth at $\omega_\oplus$), and adding the station's ECI velocity $\boldsymbol\omega_\oplus\times\mathbf R_{\text{site}}$ gives $\mathbf v$. Every step is closed-form matrix and vector algebra.

::: example One radar look, inverted exactly
A satellite at $\mathbf r=(2270.980,\ 4457.293,\ 4690.496)\,\mathrm{km}$, $\mathbf v=(-7.0601,\ 0.5652,\ 2.9943)\,\mathrm{km/s}$ is tracked from a station that reports
$$
\rho = 1539.650\,\mathrm{km}, \quad Az=35.178^\circ,\quad El=11.675^\circ, \quad
\dot\rho = 6510.571\,\mathrm{m/s},\quad \dot{Az}=0.074949^\circ/\mathrm s,\quad \dot{El}=-0.106624^\circ/\mathrm s .
$$
Running the coordinate transform above (station rotation matrix built from its latitude and the sidereal angle at the observation time) recovers
$$
\mathbf r_{\text{recovered}} = (2270.980,\ 4457.293,\ 4690.496)\,\mathrm{km}, \qquad
\mathbf v_{\text{recovered}} = (-7.0601,\ 0.5652,\ 2.9943)\,\mathrm{km/s},
$$
matching the truth to $10^{-9}\,\mathrm m$ in position and $10^{-12}\,\mathrm{m/s}$ in velocity — machine precision, because the map is an exact, invertible change of coordinates rather than a fit. There is no crossover to find, no condition number to compute, and no iteration: every one of the six inputs is used exactly once.
:::

::: warning What each family actually needs
Gibbs and Herrick-Gibbs need positions (no times for Gibbs, times for Herrick-Gibbs) and nothing about the sensor. Gauss, Laplace and the double-r method need angles *and* the observer's own position at each time — without the observer's motion between looks, angles-only data has no way to resolve range at all. Range-and-range-rate needs neither times spread over an arc nor iteration, because one look already carries the full state; what it needs is knowing the station's precise position and orientation at that instant.
:::

## Check yourself

::: check
A survey turns up three "position fixes" of the same catalogued object with a coplanarity error of $4.2^\circ$. Is Gibbs' method still usable here, and what should you do first?
:::

::: answer
No — $4.2^\circ$ is far above the round-off level of a genuinely coplanar triple (which should read a few thousandths of a degree or less for real orbital data). Running Gibbs anyway would produce a velocity for an orbit that does not exist. The right move is to check the data association first: one of the three "fixes" may belong to a different object, may be mistimed, or may carry a large angular or timing error; only after finding and fixing (or discarding) the bad point does it make sense to run Gibbs on the remaining, genuinely coplanar set.
:::

::: check
For a fixed separation between the three points, why does Herrick-Gibbs' error stay roughly the same size if the input positions are perturbed by measurement noise, while Gibbs' error grows sharply as that same separation shrinks?
:::

::: answer
Herrick-Gibbs is a weighted sum of $\mathbf r_1,\mathbf r_2,\mathbf r_3$ with no cross products and no differences of near-equal terms, so a perturbation to any input feeds into the output with an essentially fixed, separation-independent gain. Gibbs divides by $\sqrt{ND}$, both built from cross products between the three (near-parallel, at small separation) vectors; those cross products shrink as the points crowd together, so the same absolute input perturbation is divided by an ever-smaller number, and the output error grows — the defining symptom of an ill-conditioned computation, not a change in the true sensitivity of the physical problem.
:::

::: check
In the Gauss-method worked example, $D_0$ for the short arc is about $60{,}000$ times smaller than for the good arc, but $\operatorname{cond}(\mathbf M)$ is only about $3400$ times larger. Is this a contradiction?
:::

::: answer
No. $\det\mathbf M$ is proportional to $D_0$ times the scalars $c_1,c_3$ (which also change somewhat between the two arcs, since they depend on $\tau_1,\tau_3$ and the truncated $f,g$ series), and the condition number of a matrix depends on the ratio of its largest to smallest singular value, not on its determinant alone — a matrix can have a very small determinant while still having one large singular value, which keeps $\operatorname{cond}(\mathbf M)$ from scaling in exact lockstep with $\det\mathbf M$. Both numbers agree on the qualitative point that matters: the short arc is very much worse conditioned than the good one.
:::

::: check
Why does the range-and-range-rate method of the last section have no analogue of a "short arc" failure, when every angles-only method in this lesson does?
:::

::: answer
The angles-only methods (and Gibbs/Herrick-Gibbs, in the time domain) all extract information from the *change* in geometry between separated observations — a short arc means a small change, which some intermediate quantity divides by, and the result is ill-conditioned. A single range-and-range-rate look needs no change between observations at all: all six numbers (three geometric, three rates) are measured simultaneously and combine through one fixed, invertible coordinate transform. There is no small denominator anywhere in the calculation for a short arc to shrink.
:::

::: check
A colleague proposes skipping Gauss's iterative refinement step and using only the truncated-series first guess, since "it's already close." Using the numbers in the worked example, argue for or against this for the good arc case.
:::

::: answer
Against, if accuracy matters: the first (unrefined) truncated-series guess for the good arc was off by roughly a kilometre in position and tens of metres per second in velocity (visible in the intermediate iteration history), while six refinement iterations using the exact universal-variable Lagrange coefficients brought that down to sub-millimetre and micrometre-per-second level in the noiseless case. The refinement is cheap (a handful of linear solves) compared with the accuracy it buys, and since Gauss's output normally feeds a differential-correction fit that assumes it starts reasonably close to the truth, skipping refinement risks handing that fit a worse starting point than necessary for free.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\varepsilon_{\text{coplanar}}=\arcsin(|\mathbf r_1\cdot\mathbf N_{23}|/(r_1 N_{23}))$ | Coplanarity check before Gibbs or Herrick-Gibbs |
| $\mathbf v_2=\sqrt{\mu/(ND)}\,[(\mathbf D\times\mathbf r_2)/r_2+\mathbf S]$ | Gibbs: exact for any separation, ill-conditioned at small separation |
| $\mathbf v_2 = \sum_i w_i(\Delta t)\,\mathbf r_i$, $w_i$ containing $\mu/(12r_i^3)$ | Herrick-Gibbs: well conditioned at small separation, truncation-limited at large separation |
| Crossover | Computed on this orbit: $\sim\!1^\circ$ noiseless; widens toward the arc's own noise level with real measurement error |
| $\hat{\boldsymbol\rho}_i=(\cos\delta_i\cos\alpha_i,\cos\delta_i\sin\alpha_i,\sin\delta_i)$ | Line-of-sight unit vector from right ascension/declination |
| $\mathbf M(r_2)\boldsymbol\rho = -c_1\mathbf R_1+\mathbf R_2-c_3\mathbf R_3$ | Gauss's method: solve self-consistently for $r_2$, then Gibbs for $\mathbf v_2$ |
| $D_0=\hat{\boldsymbol\rho}_1\cdot(\hat{\boldsymbol\rho}_2\times\hat{\boldsymbol\rho}_3)$ | Vanishes as the observation arc shortens; drives $\operatorname{cond}(\mathbf M)\to\infty$ |
| Laplace | Single site, fits $\dot{\hat{\boldsymbol\rho}},\ddot{\hat{\boldsymbol\rho}}$; noise-sensitive numerical differentiation |
| Double-r | Guesses $r_1,r_3$, iterates on time-of-flight consistency; robust for longer arcs |
| Range/range-rate | One look, six numbers, exact invertible transform — no conditioning, no iteration |

Every method here hands off a state that is only approximately right, seeded from as little data as the geometry allows. The next lesson takes that state as a starting guess and builds the machinery — the state transition matrix and the batch normal equations — that turns it, plus every later observation, into the best fit the data actually supports.
