---
id: l09-hazard-detection-visual-inertial-odometry
title: Hazard detection and avoidance; visual-inertial odometry basics
minutes: 16
covers:
  - 'Hazard detection and avoidance; visual-inertial odometry basics'
---

Knowing where you are is not the same as knowing where it is safe to land. The previous lesson turned a descent camera into a position fix; this one asks what that same imagery, or the elevation map a lidar builds alongside it, has to say about the ground itself — whether the patch directly below is a plain or a boulder field, a flat pad or the side of a ridge. And it takes up a question this module has been circling since the camera lesson's own quiz claim about monocular scale: exactly what kind of motion does a camera-only sensor need before its bearings alone tell you where something actually is.

Both threads meet in the same place. A vehicle finding its own motion from a camera and an inertial measurement unit — visual-inertial odometry — and a vehicle deciding whether the ground below is safe both depend on turning bearings, which carry direction but not scale, into metric answers. This lesson works out precisely when that turn is possible from bearings alone, and precisely when it is not.

## Hazard detection: slope and roughness from a local plane fit

A landing site fails for one of two reasons: it slopes too steeply for the vehicle's legs or its thruster geometry to tolerate, or it is too rough — a rock, a crater rim, a ridge — for the vehicle's ground clearance. Both are properties of the terrain within a small neighbourhood of a candidate site, and both come from the same calculation: fit the best flat plane to the local elevation data, then ask two questions about the fit. How tilted is the plane itself? And how much does the real ground depart from it?

Given elevation samples $z_k$ at horizontal positions $(x_k,y_k)$ in a window around a candidate site, the plane $z=ax+by+c$ that best fits them is exactly the linear least-squares problem the least-squares module opened with: stack $(x_k,y_k,1)$ into the rows of $\mathbf{A}$ and solve $\mathbf{A}(a,b,c)^\mathsf{T}\approx\mathbf{z}$ by normal equations or SVD. The fitted plane's **slope** is the angle its normal makes with vertical, $\arctan\sqrt{a^2+b^2}$; the **roughness** is the RMS of the residuals $z_k-(ax_k+by_k+c)$ the fit leaves behind — exactly what a slope-only description throws away.

::: example A synthetic landing zone, surveyed for hazards
```python
import numpy as np

rng = np.random.default_rng(9)
N = 120
xs, ys = np.meshgrid(np.arange(N), np.arange(N))

dem = 0.002 * xs                                             # a gentle regional grade
ramp = (xs > 70) & (xs < 110)
dem = dem + np.where(ramp, 0.28 * (xs - 70), 0.0)             # a steep ramp
for _ in range(35):                                            # a boulder field
    cx, cy = rng.uniform(10, 50), rng.uniform(60, 100)
    r, h = rng.uniform(1.5, 4.0), rng.uniform(0.3, 1.2)
    dem += h * np.exp(-(np.hypot(xs - cx, ys - cy) / r) ** 2)
dem += rng.normal(0, 0.01, dem.shape)

def local_slope_roughness(dem, cx, cy, half_win=6):
    xl, yl = np.meshgrid(np.arange(cx-half_win, cx+half_win+1), np.arange(cy-half_win, cy+half_win+1))
    zl = dem[cy-half_win:cy+half_win+1, cx-half_win:cx+half_win+1]
    A = np.column_stack([xl.ravel(), yl.ravel(), np.ones(xl.size)])
    coef, *_ = np.linalg.lstsq(A, zl.ravel(), rcond=None)
    a, b, _ = coef
    slope_deg = np.degrees(np.arctan(np.hypot(a, b)))
    roughness = np.std(zl.ravel() - A @ coef)
    return slope_deg, roughness

SLOPE_LIMIT, ROUGH_LIMIT = 12.0, 0.15   # degrees, metres
sites = [(20, 20, "open plain"), (90, 90, "on the ramp"),
         (22, 90, "in the rock field"), (100, 20, "near the ramp's foot")]
for cx, cy, label in sites:
    slope, rough = local_slope_roughness(dem, cx, cy)
    safe = slope <= SLOPE_LIMIT and rough <= ROUGH_LIMIT
    print(f"{label:22s}: slope={slope:6.2f} deg  roughness={rough:.3f} m  -> {'SAFE' if safe else 'HAZARD'}")
# open plain            : slope=  0.14 deg  roughness=0.010 m  -> SAFE
# on the ramp           : slope= 15.75 deg  roughness=0.010 m  -> HAZARD
# in the rock field     : slope=  1.15 deg  roughness=0.424 m  -> HAZARD
# near the ramp's foot  : slope= 15.74 deg  roughness=0.011 m  -> HAZARD
```

Two of the four hazards are caught by slope, one is caught by roughness alone — the rock field is nearly flat on average, $1.15^\circ$, well inside the limit, and would pass a slope-only check; only the residual left behind by the plane fit, $0.424\,\mathrm{m}$ against a $0.15\,\mathrm{m}$ limit, flags it. Slope and roughness are testing genuinely different failure modes, and a hazard map needs both. Surveying the whole area at this resolution finds $333$ of $729$ sampled sites, $45.7\%$, passing both tests — a landing-site selector's actual job is choosing the best of those, not merely the first one found.
:::

## Visual-inertial odometry: what the "inertial" half actually fixes

The camera lesson's own closing fact was stated plainly and is worth restating precisely here: the scale of a purely monocular reconstruction is unobservable, because uniformly rescaling every three-dimensional point and every camera position leaves every bearing, and so every pixel, completely unchanged. A camera alone can recover *shape* — where things are relative to each other — never *size* in physical units.

An inertial measurement unit breaks that ambiguity because it measures something a camera cannot: an accelerometer's reading has physical units of length over time squared built directly into it, so integrating it twice gives a position change in real metres, not in an arbitrary, unknowable multiple of them. Visual-inertial odometry fuses the two: the camera supplies rich, frequent, low-drift *shape* information — where features sit relative to each other and to the vehicle, frame to frame — while the inertial unit supplies the one number the camera never could, anchoring that shape to an actual metric scale and carrying the estimate through the frames where too few features are visible to solve the vision problem alone.

## When does a bearings-only measurement become observable at all?

Scale is not the only thing bearings alone can fail to determine. A more demanding version of the same question shows up whenever a vehicle tracks another object — a nearby spacecraft, a small body during approach — using only a camera, with no lidar or radar supplying independent range: under what relative motion can bearing measurements alone ever recover the target's actual position, not merely its direction?

Set up the classic case. A target moves at constant velocity, unknown initial position $(x_0,y_0)$ and unknown velocity $(v_x,v_y)$ — four unknowns. An observer at a *known* position $\mathbf{r}_{\text{obs}}(t)$ measures only the bearing angle to the target, $\theta(t)=\operatorname{atan2}\big(y(t)-y_{\text{obs}}(t),\ x(t)-x_{\text{obs}}(t)\big)$, at a handful of times. The bearing angle is unchanged by rescaling the relative position vector by any positive constant — $\operatorname{atan2}(\mu y,\mu x)=\operatorname{atan2}(y,x)$ for any $\mu>0$ — so any perturbation that acts as a uniform, constant rescaling of the *entire relative trajectory* is invisible to every bearing measurement, at every instant, exactly.

If the observer also moves at constant velocity, the relative position is a single straight line, $\mathbf{r}_{\text{rel}}(t)=\mathbf{r}_{\text{rel},0}+\mathbf{v}_{\text{rel}}t$, and multiplying it by a constant $\mu$ near $1$ gives $\mu\mathbf{r}_{\text{rel},0}+\mu\mathbf{v}_{\text{rel}}t$ — still exactly affine in $t$, still exactly the form a *different*, equally valid choice of target initial position and velocity would produce. That one-parameter family of indistinguishable targets is a genuine, exact unobservable direction, not a numerical artefact. Once the observer maneuvers — a single velocity change partway through — the relative trajectory is no longer one straight line but two joined at an angle, and rescaling that bent path by a constant no longer produces anything a straight-line-velocity target could have generated; the coincidence that hid the target's scale disappears along with the straight line.

::: example The unobservable direction, found and then removed
```python
import numpy as np

rng = np.random.default_rng(21)
targ0_true, vtarg_true = np.array([500.0, 1200.0]), np.array([8.0, -3.0])
ts = np.linspace(0, 60, 13)

def target_pos(t):
    return targ0_true + vtarg_true * t

def observer_pos(t, maneuver):
    v0 = np.array([15.0, 2.0])
    if not maneuver:
        return v0 * t
    t_turn, v1 = 25.0, np.array([-5.0, 18.0])
    return v0 * t if t <= t_turn else v0 * t_turn + v1 * (t - t_turn)

def residuals(state, obs, theta):
    tgt = state[:2] + np.outer(ts, state[2:])
    pred = np.arctan2((tgt - obs)[:, 1], (tgt - obs)[:, 0])
    d = pred - theta
    return (d + np.pi) % (2 * np.pi) - np.pi

def bearings(maneuver, sigma=np.radians(0.3)):
    obs = np.array([observer_pos(t, maneuver) for t in ts])
    theta = np.arctan2((np.array([target_pos(t) for t in ts]) - obs)[:, 1],
                        (np.array([target_pos(t) for t in ts]) - obs)[:, 0])
    return obs, theta + sigma * rng.standard_normal(len(ts))

def jacobian(state, obs, eps):
    J = np.zeros((len(ts), 4))
    for k in range(4):
        s1, s2 = np.array(state, float), np.array(state, float)
        s1[k] += eps[k]; s2[k] -= eps[k]
        J[:, k] = (residuals(s1, obs, np.zeros(len(ts))) - residuals(s2, obs, np.zeros(len(ts)))) / (2 * eps[k])
    return J

true_state = np.concatenate([targ0_true, vtarg_true])
eps = np.array([1.0, 1.0, 0.01, 0.01])
sigma = np.radians(0.3)
for maneuver, label in [(False, "no maneuver"), (True, "one velocity-change maneuver")]:
    obs, theta = bearings(maneuver)
    F = jacobian(true_state, obs, eps).T @ jacobian(true_state, obs, eps) / sigma**2
    print(label, "Fisher-information eigenvalues:", np.round(np.sort(np.linalg.eigvalsh(F)), 6))
# no maneuver Fisher-information eigenvalues: [0.00000000e+00 4.93910000e-02 2.76092000e+00 6.20134102e+02]
# one velocity-change maneuver Fisher-information eigenvalues: [5.47000000e-04 6.11590000e-02 4.86212590e+01 6.93634774e+02]
```

Without a maneuver, one eigenvalue of the Fisher information is exactly zero — the single unobservable direction the argument above predicted, and no amount of additional bearing measurements, however precise, will ever shrink it. With one maneuver, all four eigenvalues are strictly positive; the state, including the target's actual range, becomes fully observable from bearings alone. The practical consequence is not subtle: run from the same starting guess, a Gauss-Newton solve for the target's state ends with an error of about $19$ units against the true state with the maneuver, and an error of about $1.1\times10^{16}$ units without one — nearly fifteen orders of magnitude worse — because the iteration has nothing at all to stop it running away along the one direction the data can never constrain.
:::

This is the dynamic cousin of the camera lesson's static scale result, and the same fix applies. An "own-ship maneuver" is exactly what an accelerometer supplies automatically, every time the vehicle's own motion departs from a straight line at constant speed — which is why visual-inertial odometry does not merely bolt an independent scale reference onto vision, it supplies the specific kind of relative-motion information that a bearings-only problem needs before position, not merely direction, can be recovered from it at all.

::: key Bearings-only observability
A target's position, tracked from bearing angles alone, is exactly recoverable only when the relative motion between observer and target departs from a straight line at constant relative velocity — an accelerating or maneuvering relative trajectory removes the exact scale ambiguity that a straight one cannot. This is the same underlying fact as a monocular camera's unobservable scale: a bearings-only sensor never sees the "size" of anything, and needs either external range, a known baseline, or a genuine change in relative motion to recover it.
:::

## Check yourself

::: check
Explain why the roughness metric in the hazard example is defined as the RMS of the plane fit's *residuals*, rather than, say, the raw elevation's own standard deviation within the window.
:::

::: answer
The raw elevation's standard deviation would be dominated by any regional slope or grade within the window — a perfectly smooth, safe ramp would show a large raw standard deviation purely from its tilt, with no rocks or roughness involved at all. Subtracting the best-fit plane first removes exactly that tilt, leaving only the departure from flatness the plane fit could not explain, which is what roughness is actually meant to capture: bumps and rocks, not slope the plane already accounts for.
:::

::: check
In the hazard survey, the rock-field site had a slope of only $1.15^\circ$ but was still flagged a hazard. What would a slope-only hazard check have missed, and why does this matter operationally?
:::

::: answer
A slope-only check would have passed this site, since $1.15^\circ$ is far inside the $12^\circ$ limit; it would have missed the $0.424\,\mathrm{m}$ of roughness, well above the $0.15\,\mathrm{m}$ limit, from the boulders scattered through the window. Operationally, a vehicle landing there on a slope-only check would touch down expecting flat, even ground and instead find itself in contact with rocks that could tip it or damage its structure — the two hazard criteria are independent failure modes, and passing one says nothing about the other.
:::

::: check
Show, using $\operatorname{atan2}(\mu y,\mu x)=\operatorname{atan2}(y,x)$ for $\mu>0$, why a uniform positive rescaling of a straight-line relative trajectory is invisible to every bearing measurement taken along it.
:::

::: answer
At any instant $t$, the bearing measured is $\theta(t)=\operatorname{atan2}(y_{\text{rel}}(t),x_{\text{rel}}(t))$. Replacing the relative position with $\mu\,\mathbf{r}_{\text{rel}}(t)$ for any fixed $\mu>0$ gives $\operatorname{atan2}(\mu y_{\text{rel}}(t),\mu x_{\text{rel}}(t))=\operatorname{atan2}(y_{\text{rel}}(t),x_{\text{rel}}(t))=\theta(t)$, identical to the original bearing, at every single instant $t$ simultaneously. Since a straight-line relative trajectory scaled by a constant $\mu$ remains a straight-line trajectory of exactly the same affine form, the rescaled version is indistinguishable from the original by any bearing measurement taken at any time.
:::

::: check
The worked example found exactly one zero Fisher-information eigenvalue without a maneuver, not two or three. What does this indicate about the other three directions in the four-dimensional target state, even without any observer maneuver?
:::

::: answer
It indicates that the other three directions in the state — everything except the one-parameter uniform-rescaling direction identified above — are already observable from bearing measurements alone, even without a maneuver: the discrete set of bearing measurements over time constrains the target's motion enough to pin down three of the four dimensions, and only the exact scale-ambiguity direction survives as genuinely unconstrained. A maneuver is needed to recover that last, specific direction, not to make the problem observable from nothing.
:::

::: check
Explain, in your own words, why an observer maneuver removes the exact degeneracy that a straight-line relative trajectory has, without redoing the full algebra.
:::

::: answer
The degeneracy exists because a straight-line relative trajectory, uniformly rescaled by a constant, is still a straight-line trajectory of the same affine form — the rescaled version is a trajectory an equally valid, different target initial position and velocity could have produced. Once the observer maneuvers, the relative trajectory bends at the maneuver point rather than continuing as one straight line, and rescaling that bent path by a constant produces a bent path with a different bend location than any straight-line, constant-velocity target could generate; the rescaled version is no longer a trajectory any valid alternative target explanation could produce, which is exactly what breaks the ambiguity.
:::

::: check
A spacecraft doing proximity operations relies on a camera alone, no lidar, to track a tumbling but otherwise non-maneuvering (constant relative velocity) target. Based on this lesson, what should the operations team expect about the range estimate, and what is the most direct fix available to a vehicle with a functioning propulsion system?
:::

::: answer
They should expect the range to the target to be effectively unobservable from bearings alone — the vehicle's shape and direction to the target will be well determined, but its distance will carry a large, possibly unbounded uncertainty along the one degenerate direction this lesson identified, however long the camera keeps measuring. The most direct fix available to a vehicle with propulsion is to perform its own deliberate maneuver — a planned velocity change — which breaks the straight-line relative geometry and restores observability of the range, exactly as the worked example's single velocity change did.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $z=ax+by+c$ (least-squares plane fit) | Local terrain plane; slope $=\arctan\sqrt{a^2+b^2}$, roughness $=$ RMS residual |
| Two independent hazard tests | Slope and roughness catch different failure modes; this lesson's rock field failed on roughness alone |
| Monocular scale unobservable | A camera recovers shape, never physical size, without external information (from the camera lesson) |
| VIO | An accelerometer supplies the metric scale a camera cannot, plus continuity where visual features run out |
| $\operatorname{atan2}(\mu y,\mu x)=\operatorname{atan2}(y,x)$, $\mu>0$ | Why a uniformly rescaled straight-line relative trajectory is invisible to bearings alone |
| Straight-line relative motion | Exactly one unobservable direction in target position/velocity, found here as a zero Fisher-information eigenvalue |
| An observer maneuver | Bends the relative trajectory, removing the scale ambiguity; restores full observability |

Hazard maps and observability both come down to the same question — what does a sensor's geometry actually let you know, and what does it structurally never tell you no matter how much data arrives. The next lesson takes that question into the final approach itself, where a target is close enough to touch and the sensor doing the measuring has to contend with a return that can be dark, specular, or barely there at all.
