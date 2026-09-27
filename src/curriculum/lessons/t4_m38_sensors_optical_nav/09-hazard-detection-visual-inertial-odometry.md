---
id: l09-hazard-detection-visual-inertial-odometry
title: Hazard detection and avoidance; visual-inertial odometry basics
minutes: 24
covers:
  - 'Hazard detection and avoidance; visual-inertial odometry basics'
---

Picture choosing a spot for a picnic blanket in a park. You know exactly where you are — the map on your phone says so. That is not the question. The question is whether *this* patch of grass is any good. On a steep bank, your drinks roll away. On a patch full of tree roots and stones, you cannot sit comfortably even though the ground is level on average. A good spot has to pass both tests: not too steep, and not too bumpy.

A lander faces the same choice with much higher stakes. The previous lesson turned a descent camera into a position fix. This lesson asks what the same pictures, or the elevation map a lidar builds, say about the ground itself. Choosing a safe spot this way, in the last minutes of a descent, is called **hazard detection and avoidance**.

The second half of the lesson returns to a puzzle from the camera lesson: a single camera sees directions but never distances. Close one eye and try to touch two fingertips together at arm's length — it is surprisingly hard. Now move your head sideways while you try, and it gets easier. Motion helps, and the right kind of motion is what makes a camera measure real distances. Pairing a camera with an accelerometer to do that is **visual-inertial odometry**, and this lesson works out exactly when bearings alone can tell you where something is.

## Hazard detection: slope and roughness

A landing spot fails in one of two ways:

- it is **too steep**, so the lander slides or tips over, or its legs cannot all reach the ground at once;
- it is **too rough** — a boulder, a crater rim, a ditch — so a leg lands on a rock, or a rock hits the underside.

Both are properties of the ground in a small patch around the candidate spot, about the size of the lander. And both come from one calculation: fit the best flat **plane** (a perfectly flat, possibly tilted surface) to the ground's heights in that patch, then ask two questions:

1. How tilted is the plane? That is the **slope**.
2. How far does the real ground wander above and below the plane? That is the **roughness**.

### Fitting the plane

The **elevation map** (also called a digital elevation model, or DEM) gives the ground height $z_k$ at many points $(x_k, y_k)$, often one per metre. A tilted plane has the equation

$$
z = ax + by + c .
$$

Here $a$ is how much the height rises per metre you step in $x$, $b$ the same for $y$, and $c$ the height at $x = y = 0$. We want the $a, b, c$ that make the plane pass as close as possible to all the measured heights at once. That is exactly the **[[linear least-squares|plane-fit]]** problem from the least-squares module: put one row $(x_k, y_k, 1)$ per measured point into a matrix $\mathbf{A}$, and solve $\mathbf{A}(a, b, c)^\mathsf{T} \approx \mathbf{z}$.

### Slope

The steepest way up the plane rises $\sqrt{a^2 + b^2}$ metres per metre walked (Pythagoras on the two rates). The angle of that climb, which is also the angle between the plane's "straight up" direction (its normal) and true vertical, is the slope:

$$
\text{slope} = \arctan\sqrt{a^2 + b^2}.
$$

### Roughness

After the fit, each point has a **residual**, $z_k - (ax_k + by_k + c)$: how far the real ground is above (plus) or below (minus) the plane. Square the residuals, average them, take the square root, and you have the **[[RMS|rms]]** residual — the roughness. It is exactly the part of the ground a slope-only description throws away.

::: key Hazard tests
Fit $z = ax + by + c$ to the local elevation map by least squares. **Slope** $= \arctan\sqrt{a^2 + b^2}$; **roughness** $=$ RMS of the residuals. A safe site passes both limits; the two catch different hazards.
:::

::: example Checking one site by hand
A plane fit gives $a = 0.1$ and $b = 0.2$ (heights in metres, positions in metres). The lander tolerates at most $12^\circ$.

**Steepest rise.** $\sqrt{0.1^2 + 0.2^2} = \sqrt{0.05} \approx 0.224$: the ground climbs about $22\,\mathrm{cm}$ for every metre you walk uphill.

**Angle.** $\arctan(0.224) \approx 12.6^\circ$.

**Verdict.** $12.6^\circ$ is more than $12^\circ$, so the site fails on slope, however smooth it is. **Sanity check:** a rise of about one part in five feels like a steep driveway, and $12^\circ$ is about that steep, so the answer is in the right range.
:::

::: warning Keep the grid in metres
The formula $\arctan\sqrt{a^2 + b^2}$ only gives the real slope if $x$, $y$ and $z$ are in the same unit. Elevation maps are often stored by pixel index. If each pixel is $0.5\,\mathrm{m}$ and you fit heights in metres against positions in pixels, every rate comes out half as big as it should, and a $20^\circ$ slope reads as about $10^\circ$ — a dangerous site passed as safe. Convert pixel positions to metres before fitting.
:::

::: example A synthetic landing zone, surveyed for hazards
A $120\,\mathrm{m} \times 120\,\mathrm{m}$ elevation map, one height per metre, holds a gentle grade, a steep ramp and a field of boulders, with $1\,\mathrm{cm}$ of sensor noise. The lander allows $12^\circ$ of slope and $0.15\,\mathrm{m}$ of roughness over a $13\,\mathrm{m}$ square around each site.

```python
import numpy as np

rng = np.random.default_rng(9)
N = 120                                                      # a 120 m x 120 m area, one post per metre
xs, ys = np.meshgrid(np.arange(N), np.arange(N))

dem = 0.002 * xs                                             # a gentle regional grade
ramp = (xs > 70) & (xs < 110)
dem = dem + np.where(ramp, 0.28 * (xs - 70), 0.0)            # a steep ramp
for _ in range(35):                                          # a boulder field
    cx, cy = rng.uniform(10, 50), rng.uniform(60, 100)
    r, h = rng.uniform(1.5, 4.0), rng.uniform(0.3, 1.2)
    dem += h * np.exp(-(np.hypot(xs - cx, ys - cy) / r) ** 2)
dem += rng.normal(0, 0.01, dem.shape)                        # 1 cm of sensor noise

def local_slope_roughness(dem, cx, cy, half_win=6):
    """Fit z = a x + b y + c over a 13 m x 13 m window; return slope (deg) and roughness (m)."""
    xl, yl = np.meshgrid(np.arange(cx-half_win, cx+half_win+1), np.arange(cy-half_win, cy+half_win+1))
    zl = dem[cy-half_win:cy+half_win+1, cx-half_win:cx+half_win+1]
    A = np.column_stack([xl.ravel(), yl.ravel(), np.ones(xl.size)])
    coef, *_ = np.linalg.lstsq(A, zl.ravel(), rcond=None)
    a, b, _ = coef
    slope_deg = np.degrees(np.arctan(np.hypot(a, b)))
    roughness = np.std(zl.ravel() - A @ coef)                # RMS of what the plane leaves over
    return slope_deg, roughness

SLOPE_LIMIT, ROUGH_LIMIT = 12.0, 0.15                        # degrees, metres
sites = [(20, 20, "open plain"), (90, 90, "on the ramp"),
         (22, 90, "in the rock field"), (70, 20, "at the ramp's foot")]
for cx, cy, label in sites:
    slope, rough = local_slope_roughness(dem, cx, cy)
    safe = slope <= SLOPE_LIMIT and rough <= ROUGH_LIMIT
    print(f"{label:18s}: slope={slope:6.2f} deg  roughness={rough:.3f} m  -> {'SAFE' if safe else 'HAZARD'}")

centres = range(6, 114, 4)                                   # a 27 x 27 grid of candidate sites
ok = sum(all(v <= lim for v, lim in zip(local_slope_roughness(dem, cx, cy), (SLOPE_LIMIT, ROUGH_LIMIT)))
         for cx in centres for cy in centres)
print(f"safe sites: {ok} of {len(centres)**2}")
# open plain        : slope=  0.14 deg  roughness=0.010 m  -> SAFE
# on the ramp       : slope= 15.75 deg  roughness=0.010 m  -> HAZARD
# in the rock field : slope=  1.15 deg  roughness=0.424 m  -> HAZARD
# at the ramp's foot: slope=  8.09 deg  roughness=0.263 m  -> HAZARD
# safe sites: 333 of 729
```

**Reading the four sites.** The open plain passes both tests. The ramp fails on slope alone: $15.75^\circ$, yet perfectly smooth ($1\,\mathrm{cm}$, which is only the sensor noise). The rock field is the surprise. On average it is nearly flat, $1.15^\circ$, and would sail through a slope-only check; only the roughness, $0.424\,\mathrm{m}$ against a $0.15\,\mathrm{m}$ limit, catches the boulders. The ramp's foot fails on roughness too: the window straddles the bend where flat ground turns into ramp, and no single plane fits a bend.

**Sanity check.** The ramp rises $0.28\,\mathrm{m}$ per metre plus the $0.002$ grade, and $\arctan(0.282) \approx 15.7^\circ$, matching the fit.

Surveying a $27 \times 27$ grid of sites finds $333$ of $729$ safe, about $45.7\%$. A real site selector does not stop at the first safe site: it picks the best one, far from any hazard, that the lander can still reach with its remaining fuel.
:::

This is what China's **[[Chang'e 3|change-hover]]** lander did on the Moon in 2013: it paused its descent to hover, scanned the ground below with a laser imager, ran exactly this kind of slope-and-roughness check, and moved sideways to the safest spot before touching down.

## Visual-inertial odometry: what the accelerometer adds

The camera lesson ended with a fact worth restating: a single camera cannot measure the size of anything. Make every point in the world and every camera position twice as far from the origin, and every picture stays the same. A camera alone recovers **shape** — where things are compared with each other — never **scale** in real metres.

An accelerometer measures something a camera cannot. Its reading has real units, metres per second squared. Integrate it once and you get a speed change in metres per second; integrate again and you get a distance in metres. If a vehicle starts from rest and accelerates at $0.25\,\mathrm{m/s^2}$ for $2\,\mathrm{s}$, it moves $\tfrac12 \times 0.25 \times 2^2 = 0.5\,\mathrm{m}$ — a real distance, not "some multiple of something".

**Visual-inertial odometry** (VIO) combines the two:

- the camera supplies rich, frequent shape information — where features sit relative to each other and to the vehicle — and drifts slowly, because it keeps seeing the same features;
- the **inertial measurement unit** (IMU: accelerometers plus gyros) supplies the metric scale, and carries the estimate through moments when the camera sees too few features, such as a blurry frame or a featureless plain.

Each covers the other's weakness. On its own an IMU's position error grows quickly, because **[[integrating twice|double-integration]]** turns a tiny bias into a large distance. A camera tracking features holds that growth down.

::: example Turning a bearing change into a distance
A camera sees a rock straight ahead. The IMU says the vehicle then slides $0.50\,\mathrm{m}$ sideways without turning. The rock now appears $5.71^\circ$ off the boresight. How far away is it?

**Draw it.** The sideways slide $b$ and the distance $Z$ to the rock are the two short sides of a right triangle, and the new bearing angle sits at the camera. So $\tan(5.71^\circ) = b / Z$.

**Solve.** $\tan(5.71^\circ) \approx 0.100$, so $Z = 0.50 / 0.100 = 5.0\,\mathrm{m}$.

**Where the scale came from.** The camera supplied only the angle. The $0.50\,\mathrm{m}$ came from the IMU. Had the IMU said $1.0\,\mathrm{m}$, the same angle would give $1.0 / 0.100 = 10\,\mathrm{m}$. The camera fixes the shape of the triangle; the IMU fixes its size. That is VIO in one triangle.
:::

## When can bearings alone find a target?

Scale is not the only thing bearings can miss. A tougher version of the question comes up whenever a spacecraft tracks another object — a satellite it wants to inspect, a small asteroid on approach — with a camera and no lidar or radar: can the bearing measurements *ever* reveal how far away the target is?

### Setting it up

Work on a flat plane to keep it simple. The target moves in a straight line at a steady speed. We do not know where it started, $(x_0, y_0)$, or its velocity, $(v_x, v_y)$: four unknowns. We know our own position $\mathbf{r}_{\text{obs}}(t)$ at every moment. The camera measures only the direction to the target, the bearing angle

$$
\theta(t)=\operatorname{atan2}\big(y(t)-y_{\text{obs}}(t),\ x(t)-x_{\text{obs}}(t)\big),
$$

a handful of times. Here $\operatorname{atan2}(\text{up}, \text{across})$ is the **[[angle of an arrow|atan2]]** that goes "across" to the right and "up": the direction of the arrow from us to the target.

### The hidden family of targets

Here is the key fact. Stretch the arrow to the target by any positive factor $\mu$ ("mu") and its direction does not change:

$$
\operatorname{atan2}(\mu y,\mu x)=\operatorname{atan2}(y,x) \quad \text{for any } \mu > 0 .
$$

So any change to the target that stretches the *whole relative path* — the arrow from observer to target, at every moment — by one fixed factor is invisible to every bearing, at every instant, exactly.

Now suppose we also fly in a straight line at a steady speed. Then the relative path is a straight line too: $\mathbf{r}_{\text{rel}}(t)=\mathbf{r}_{\text{rel},0}+\mathbf{v}_{\text{rel}}t$, starting arrow plus relative velocity times time. Stretch it by $\mu$ and you get $\mu\mathbf{r}_{\text{rel},0}+\mu\mathbf{v}_{\text{rel}}t$ — still a straight line at a steady speed. That is exactly the path a *different* target, starting farther away and moving faster, would have made. Every bearing would be the same. The data cannot tell those targets apart, for any $\mu$ near $1$: a whole **[[family of look-alike targets|scaled-paths]]**.

### Breaking the tie with a turn

Now let the observer change velocity once, partway through. The relative path is no longer one straight line. It is two straight pieces with a bend where the observer turned. Stretch that bent path by $\mu$ and the bend moves to a different place — but the observer's turn happened at a fixed place and time, which we know. No steadily moving target could produce the stretched, bent path. The look-alikes are gone, and the range can be found.

### Measuring it: the Fisher information

How do we check this numerically? Take the **Jacobian** $\mathbf{J}$ — the table of how much each predicted bearing changes when each unknown is nudged. Build the **[[Fisher information|fisher]]** matrix

$$
\mathbf{F} = \frac{\mathbf{J}^\mathsf{T}\mathbf{J}}{\sigma^2},
$$

where $\sigma$ ("sigma") is the bearing noise. Its eigenvalues say how strongly the data pin down each combination of unknowns. A big eigenvalue means that combination is measured well; the uncertainty along it is about $1/\sqrt{\lambda}$. An eigenvalue of zero means the data cannot feel that combination at all — the uncertainty along it is unlimited.

::: example The blind direction, found and then removed
A target starts at $(500, 1200)\,\mathrm{m}$ and moves at $(8, -3)\,\mathrm{m/s}$. The observer takes $13$ bearings over $60\,\mathrm{s}$ with $0.3^\circ$ noise, flying first straight, then with one velocity change at $t = 25\,\mathrm{s}$.

```python
import numpy as np

rng = np.random.default_rng(21)
targ0_true, vtarg_true = np.array([500.0, 1200.0]), np.array([8.0, -3.0])   # m, m/s
true_state = np.concatenate([targ0_true, vtarg_true])       # the four unknowns
ts = np.linspace(0, 60, 13)                                  # 13 bearings over 60 s
sigma = np.radians(0.3)                                      # bearing noise, 0.3 degrees

def observer_pos(t, maneuver):
    v0 = np.array([15.0, 2.0])
    if not maneuver:
        return v0 * t                                        # straight line, constant speed
    t_turn, v1 = 25.0, np.array([-5.0, 18.0])                # one velocity change at t = 25 s
    return v0 * t if t <= t_turn else v0 * t_turn + v1 * (t - t_turn)

def predicted_bearings(state, obs):
    tgt = state[:2] + np.outer(ts, state[2:])
    rel = tgt - obs
    return np.arctan2(rel[:, 1], rel[:, 0])

def residuals(state, obs, theta):
    d = predicted_bearings(state, obs) - theta
    return (d + np.pi) % (2 * np.pi) - np.pi                 # wrap to [-pi, pi)

def jacobian(state, obs, eps=np.array([1.0, 1.0, 0.01, 0.01])):
    J = np.zeros((len(ts), 4))
    for k in range(4):
        up, dn = state.copy(), state.copy()
        up[k] += eps[k]; dn[k] -= eps[k]
        J[:, k] = (predicted_bearings(up, obs) - predicted_bearings(dn, obs)) / (2 * eps[k])
    return J

def gauss_newton(obs, theta, guess, iters=30):
    x = np.array(guess, float)
    for _ in range(iters):
        J = jacobian(x, obs)
        x = x + np.linalg.lstsq(J, -residuals(x, obs, theta), rcond=None)[0]
    return x

guess = true_state + np.array([150.0, -200.0, 1.0, 1.0])     # a rough starting guess
for maneuver in (False, True):
    obs = np.array([observer_pos(t, maneuver) for t in ts])
    theta = predicted_bearings(true_state, obs) + sigma * rng.standard_normal(len(ts))
    J = jacobian(true_state, obs)
    F = J.T @ J / sigma**2                                   # Fisher information
    eig = np.linalg.eigvalsh(F)
    est = gauss_newton(obs, theta, guess)
    print("maneuver:" if maneuver else "no maneuver:")
    print("   Fisher eigenvalues:", np.array2string(eig, precision=3))
    print(f"   estimate error after Gauss-Newton: {np.linalg.norm(est - true_state):.3g}")
# no maneuver:
#    Fisher eigenvalues: [-4.335e-14  4.939e-02  2.761e+00  6.201e+02]
#    estimate error after Gauss-Newton: 8.11e+14
# maneuver:
#    Fisher eigenvalues: [5.472e-04 6.116e-02 4.862e+01 6.936e+02]
#    estimate error after Gauss-Newton: 57.3
```

**Without a maneuver**, the smallest eigenvalue is about $-0.00000000000004$: zero, apart from the computer's rounding. That is the blind direction the argument predicted, and no number of extra bearings, however precise, can shrink it. The solver, fed real noisy bearings, runs off along that direction to an error near $10^{15}$ metres. There is nothing in the data to stop it.

**With one maneuver**, all four eigenvalues are positive. The smallest, $5.47 \times 10^{-4}$, means an uncertainty along the weakest direction of about $1/\sqrt{5.47 \times 10^{-4}} \approx 43\,\mathrm{m}$. The solver lands $57\,\mathrm{m}$ from the truth — a little over one of those uncertainties, which is what noisy data should give.

**Sanity check.** The weakest direction in both cases points almost along the line from observer to target, so it is the *range* the data struggle with, while the direction to the target is pinned down tightly. That is the camera lesson's lesson again.
:::

This is the moving version of the camera lesson's scale result, and the cure is the same. An **[[own-ship maneuver|tma]]** — the observer changing its own velocity — is exactly what an accelerometer measures, every time the vehicle's motion departs from a straight line at a steady speed. So an IMU does more than bolt a ruler onto a camera. It supplies precisely the kind of relative-motion information a bearings-only problem needs before position, and not only direction, can be recovered.

::: key Bearings-only observability
A target's position, tracked by bearings alone, can be recovered only if the relative motion between observer and target departs from a straight line at a steady relative velocity. A straight-line relative path leaves exactly one blind direction — a uniform rescaling — that no amount of data removes. Like a monocular camera's missing scale, it is fixed by an external range, a known baseline, or a real change in relative motion.
:::

## Check yourself

::: check
The roughness in the hazard example is the RMS of the plane fit's *residuals*. Why not use the plain spread (standard deviation) of the heights in the window instead?
:::

::: answer
On any tilted patch the heights vary because of the tilt alone. A perfectly smooth, safe ramp would show a large spread of heights with no rocks at all, and would be wrongly called rough.

Fitting the plane first removes the tilt. What is left over — the residuals — is only the part of the ground the plane cannot explain: bumps, rocks and pits. That is what roughness is meant to measure. The slope is judged separately, from the plane itself.
:::

::: check
In the survey, the rock-field site had a slope of only $1.15^\circ$ but was still flagged. What would a slope-only check have missed, and why does it matter?
:::

::: answer
A slope-only check would have passed the site, since $1.15^\circ$ is far below the $12^\circ$ limit. It would have missed the $0.424\,\mathrm{m}$ of roughness from the boulders, almost three times the $0.15\,\mathrm{m}$ limit.

A lander sent there would expect flat, even ground and instead set a leg on a boulder, or hit one with its underside, and could tip or be damaged. Slope and roughness are separate ways to fail; passing one says nothing about the other.
:::

::: check
Using $\operatorname{atan2}(\mu y,\mu x)=\operatorname{atan2}(y,x)$ for $\mu > 0$, show why stretching a straight-line relative path by a constant factor cannot be seen in any bearing.
:::

::: answer
At any time $t$ the measured bearing is $\theta(t)=\operatorname{atan2}(y_{\text{rel}}(t),x_{\text{rel}}(t))$. Replace the relative position by $\mu\,\mathbf{r}_{\text{rel}}(t)$ for a fixed $\mu > 0$. Then the bearing becomes $\operatorname{atan2}(\mu y_{\text{rel}}(t),\mu x_{\text{rel}}(t))=\operatorname{atan2}(y_{\text{rel}}(t),x_{\text{rel}}(t))=\theta(t)$ — the same, at every time at once.

And the stretched path $\mu\mathbf{r}_{\text{rel},0}+\mu\mathbf{v}_{\text{rel}}t$ is still a straight line at a steady speed, so it is a path that some other, equally possible target could really have made. No bearing, at any time, can tell the two apart.
:::

::: check
Without a maneuver, the example found exactly *one* zero eigenvalue, not two or three. What does that say about the other three directions in the four-number target state?
:::

::: answer
The other three combinations of the unknowns are already pinned down by the bearings, even without a maneuver: the way the bearing changes over time fixes everything except the overall size of the relative path. Only the single stretch direction is truly invisible. So a maneuver is not needed to make the problem solvable from nothing; it is needed to recover that one missing direction, the range.
:::

::: check
In your own words, and without the algebra, why does one observer maneuver remove the look-alike targets?
:::

::: answer
The look-alikes exist because a straight relative path, stretched, is still a straight path — exactly what a different steadily moving target would produce.

After a maneuver, the relative path has a bend at the moment the observer turned. Stretch that bent path and the bend moves somewhere else. But we know where and when we turned, and a target moving steadily cannot create a bend of its own. So the stretched path is no longer something any possible target could have made, and only the true range fits the data.
:::

::: check
A spacecraft inspecting another satellite uses only a camera, no lidar. The two are drifting apart at a steady relative velocity. What should the operations team expect about the range estimate, and what is the most direct fix if the inspector has working thrusters?
:::

::: answer
They should expect the direction to the target to be well known but the range to be essentially unknown, with an uncertainty along the stretch direction that does not shrink however long the camera keeps watching.

The most direct fix is a deliberate maneuver: fire the thrusters to change the inspector's own velocity. That bends the relative path, breaks the straight-line look-alikes, and makes the range observable, exactly as the single velocity change did in the worked example. The IMU measures that maneuver, so the filter knows precisely what bend to expect.
:::

## Summary

| Symbol or idea | Meaning |
| --- | --- |
| $z = ax + by + c$ | Least-squares plane fitted to the local elevation map |
| $\arctan\sqrt{a^2+b^2}$ | Slope of the fitted plane |
| RMS of residuals | Roughness: what the plane cannot explain |
| Slope and roughness | Two separate hazard tests; the rock field failed on roughness alone |
| Monocular scale | A camera recovers shape, never size, without outside help |
| Visual-inertial odometry | The IMU supplies metric scale and bridges featureless moments; the camera holds IMU drift down |
| $\operatorname{atan2}(\mu y,\mu x)=\operatorname{atan2}(y,x)$, $\mu>0$ | Why a stretched straight relative path looks identical in every bearing |
| $\mathbf{F} = \mathbf{J}^\mathsf{T}\mathbf{J}/\sigma^2$ | Fisher information; a zero eigenvalue marks a blind direction |
| Observer maneuver | Bends the relative path and restores the range |

Hazard maps and observability both ask what a sensor's geometry really lets you know, and what it can never tell you however much data arrives. The next lesson takes that question into the last metres before docking, where the target is close enough to touch and its surface may barely return a signal at all.

::: context plane-fit The best tilted board
Imagine laying a stiff board over a bumpy patch of ground so that it sits as close as possible to every point at once. That board is the least-squares plane. Its tilt is the slope; the gaps between board and ground are the residuals.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="120" x2="330" y2="60" stroke="#1d6fd1" stroke-width="3"/>
  <g stroke="#b4232c" stroke-width="1.5">
    <line x1="60" y1="114" x2="60" y2="104"/>
    <line x1="100" y1="106" x2="100" y2="116"/>
    <line x1="140" y1="98" x2="140" y2="84"/>
    <line x1="180" y1="90" x2="180" y2="97"/>
    <line x1="220" y1="82" x2="220" y2="70"/>
    <line x1="260" y1="74" x2="260" y2="83"/>
    <line x1="300" y1="66" x2="300" y2="58"/>
  </g>
  <g fill="#1f2a44">
    <circle cx="60" cy="104" r="3.5"/><circle cx="100" cy="116" r="3.5"/><circle cx="140" cy="84" r="3.5"/>
    <circle cx="180" cy="97" r="3.5"/><circle cx="220" cy="70" r="3.5"/><circle cx="260" cy="83" r="3.5"/>
    <circle cx="300" cy="58" r="3.5"/>
  </g>
  <text x="200" y="130" font-size="12" fill="#1d6fd1">fitted plane: its tilt is the slope</text>
  <text x="40" y="40" font-size="12" fill="#b4232c">red gaps: residuals (roughness)</text>
</svg>
```

The same least-squares machinery that fitted orbits and calibrations earlier in the course does this in a few microseconds per site.
:::

::: context rms Root mean square
RMS stands for **root mean square**, and it is done in the reverse of that order: *square* each residual, take the *mean* (average) of the squares, then the square *root*. Squaring makes every residual positive, so bumps above the plane and pits below it both count instead of cancelling. The square root brings the answer back to metres. Residuals of $+0.3$, $-0.3$, $+0.3$ and $-0.3\,\mathrm{m}$ average to zero, but their RMS is $0.3\,\mathrm{m}$ — the honest size of the bumps.
:::

::: context change-hover Hover, look, then land
China's Chang'e 3 landed in Mare Imbrium in December 2013. About $100\,\mathrm{m}$ above the surface it stopped descending and hovered, building a 3-D map of the ground below with a laser imager. Its computer checked the map for slopes and rocks, picked a safe spot, moved sideways to it, and then descended slowly to touchdown. Chang'e 4 used the same approach in 2019 for the first landing on the Moon's far side, where the terrain is rougher. Hovering costs fuel, so the whole check has to run in seconds.
:::

::: context double-integration Why a small bias grows so fast
An accelerometer with a tiny constant error $b$ makes the computed speed wrong by $bt$ after time $t$, and the computed position wrong by $\tfrac12 bt^2$. The error grows with the *square* of time. A bias of $0.01\,\mathrm{m/s^2}$ — about a thousandth of Earth's gravity — gives $\tfrac12 \times 0.01 \times 60^2 = 18\,\mathrm{m}$ of position error after one minute, and $72\,\mathrm{m}$ after two. A camera that keeps re-seeing the same features catches that growth early, which is why the pair works better than either alone.
:::

::: context atan2 An angle that knows its quadrant
The ordinary inverse tangent sees only the ratio $y/x$, so it cannot tell the arrow $(-70, 60)$ from the arrow $(70, -60)$: both have ratio $-0.857$. The function $\operatorname{atan2}(y, x)$ is given the two numbers separately, so it knows which quarter of the circle the arrow points into and returns the full angle.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="100" x2="300" y2="100" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="180" y1="20" x2="180" y2="160" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="180" y1="100" x2="110" y2="40" stroke="#1d6fd1" stroke-width="3"/>
  <circle cx="110" cy="40" r="4" fill="#1d6fd1"/>
  <path d="M210,100 A30,30 0 0,0 157.2,80.5" fill="none" stroke="#b4232c" stroke-width="2"/>
  <text x="104" y="30" font-size="12" text-anchor="middle" fill="#1f2a44">(−70, 60)</text>
  <text x="228" y="70" font-size="12" fill="#b4232c">atan2 gives 139°</text>
  <text x="200" y="140" font-size="12" fill="#1f2a44">y/x alone would say −41°</text>
</svg>
```

A bearing tracker needs the full angle, which is why it always uses atan2.
:::

::: context scaled-paths The look-alike paths
Every bearing ray from the observer passes through both the true relative path and a stretched copy of it, at the same moments. From the observer's point of view the two are indistinguishable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <g stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="4 3">
    <line x1="20" y1="175" x2="96" y2="89.5"/>
    <line x1="20" y1="175" x2="191" y2="61"/>
    <line x1="20" y1="175" x2="286" y2="32.5"/>
  </g>
  <line x1="60" y1="130" x2="160" y2="100" stroke="#1d6fd1" stroke-width="3"/>
  <line x1="96" y1="89.5" x2="286" y2="32.5" stroke="#b4232c" stroke-width="3"/>
  <g fill="#1d6fd1"><circle cx="60" cy="130" r="4"/><circle cx="110" cy="115" r="4"/><circle cx="160" cy="100" r="4"/></g>
  <g fill="#b4232c"><circle cx="96" cy="89.5" r="4"/><circle cx="191" cy="61" r="4"/><circle cx="286" cy="32.5" r="4"/></g>
  <circle cx="20" cy="175" r="5" fill="#1f2a44"/>
  <text x="32" y="182" font-size="12" fill="#1f2a44">observer</text>
  <text x="175" y="118" font-size="12" fill="#1d6fd1">true path</text>
  <text x="210" y="24" font-size="12" fill="#b4232c">stretched ×1.9</text>
</svg>
```

The dots are the target's positions at three equal time steps. The stretched path is farther, faster, and still a straight line at a steady speed.
:::

::: context fisher Information you can count
The **Fisher information**, named after the statistician Ronald Fisher, measures how much a set of noisy measurements can tell you about unknown quantities. For a least-squares problem it is $\mathbf{J}^\mathsf{T}\mathbf{J}/\sigma^2$, and its inverse is the best covariance any unbiased estimator can achieve — the **Cramér–Rao bound**. Big information means small uncertainty. You met the same matrix in the least-squares module as the normal-equation matrix, and it returns in the Kalman filter, where the covariance update adds information from each new measurement.
:::

::: context tma An old submarine problem
Submarines listening with passive sonar hear a ship's direction but not its distance — a bearings-only problem, called **target motion analysis**. Sonar crews learned long ago that sailing a straight course leaves the range unknown, so the standard technique is to run one leg, turn, and run a second leg. The bearing changes on the two legs, compared, reveal the range. A spacecraft camera tracking another satellite faces exactly the same geometry, and the same cure: change your own velocity.
:::
