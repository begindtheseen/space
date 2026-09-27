---
id: l11-sensor-fusion-architectures-measurement-models
title: Sensor fusion architectures and per-sensor measurement models
minutes: 20
covers:
  - Sensor fusion architectures and per-sensor measurement models
---

You want to know the time. Your phone says 3:02. A friend's watch says 3:05. A stranger glances at the sun and says "about three." You would not average the three. You would mostly trust the phone, glance at the watch, and nearly ignore the guess. And if you later learned that your friend had set his watch from your phone that morning, you would realize his "second opinion" was really your phone's opinion again.

That is the whole of this lesson in one scene. Combining sensors — **sensor fusion** — means weighting each one by how much it is worth, and never counting the same information twice.

Every lesson in this module ended the same way: a measurement, a prediction of that measurement from the current best guess of the vehicle's state, and a noise level that says how far apart the two may be. This lesson gathers those pieces in one place. Then it asks what flight software has to decide: when a spacecraft carries several sensors at once, how are their measurements combined? It compares two designs, builds with real numbers the most common way to get it wrong — a filter that becomes more confident than it has any right to be — and shows the standard safe fix.

## One recipe for every sensor

Think of a weather forecast. Yesterday the forecaster predicted $20^\circ\mathrm{C}$ for today. Today the thermometer reads $23^\circ\mathrm{C}$. The $3$-degree difference is the *surprise*: the part of today's reading the forecast did not already know. A good forecaster uses exactly that surprise to improve tomorrow's forecast, and uses it more if the thermometer is trustworthy, less if it is not.

A navigation filter works the same way. It keeps a **state** $\mathbf{x}$ — everything it is trying to know, such as attitude, position and velocity. For each sensor it needs three things:

- the **measurement** $\mathbf{z}$, what the sensor actually reported;
- the **measurement model** $h(\mathbf{x})$, read "h of x", a formula that predicts what the sensor *should* report if the state were $\mathbf{x}$;
- the **noise covariance** $\mathbf{R}$, which says how much the sensor's readings scatter around the truth.

Before a measurement arrives, the filter has a prediction of the state, written $\hat{\mathbf{x}}^-$ ("x hat minus": the hat means an estimate, the minus means "before this measurement"). The surprise is the **[[innovation|innovation-word]]**:

$$
\boldsymbol{\nu} = \mathbf{z} - h(\hat{\mathbf{x}}^-),
$$

read "nu equals z minus h of x hat minus." The filter nudges its state in proportion to $\boldsymbol{\nu}$, trusting it more when $\mathbf{R}$ is small. That is the update step of the Kalman filter module. The point here is that **[[every sensor plugs into the same equation|predict-not-invert]]**. Only $h(\cdot)$ and $\mathbf{R}$ change from sensor to sensor.

Here is every sensor in this module, written in that one form.

| Sensor | Measurement $\mathbf{z}$ | Model $h(\mathbf{x})$ |
| --- | --- | --- |
| Star tracker | Identified star directions $\hat{\mathbf{b}}_i$ | $\mathbf{A}(\mathbf{q})\hat{\mathbf{r}}_i$, catalog direction rotated by attitude |
| Coarse sun sensor | Six photodiode currents $I_j$ | $I_0\max(0,\hat{\mathbf{n}}_j\cdot\mathbf{A}(\mathbf{q})\hat{\mathbf{s}})$ |
| Magnetometer | Calibrated field vector $\mathbf{m}$ | $\mathbf{A}(\mathbf{q})\,\mathbf{B}_{\text{IGRF}}(\mathbf{r},t)$ |
| Horizon sensor | Crossing phases $(\phi_N,\Delta\phi)$ | Spherical-trigonometry function of attitude and orbit position |
| Radar or laser altimeter | Range $R$ | $\lVert\mathbf{r}_{\text{ground}}-\mathbf{r}_{\text{vehicle}}\rVert$ along the beam |
| Navigation camera | Pixel $(u,v)$ | $\mathbf{K}\,\mathbf{R}(\mathbf{P}_{\text{world}}-\mathbf{t})$, projected landmark |
| Docking retroreflector | Range and bearing, or full 3-D position | Relative position from the estimated relative state |

(In the camera row, $\mathbf{R}$ is the camera's rotation, not a noise covariance.) In the table, $\mathbf{A}(\mathbf{q})$ is the attitude matrix built from the attitude quaternion $\mathbf{q}$: it turns a direction known in space into the same direction seen from the spacecraft body. Nothing in the table is new. Each row is the model its own lesson built, with its own noise budget. What is new is using more than one row at a time.

::: key One form for every sensor
Every sensor is a measurement $\mathbf{z}$, a model $h(\mathbf{x})$ that predicts it from the state, and a noise covariance $\mathbf{R}$. The filter consumes each one through the innovation $\boldsymbol{\nu}=\mathbf{z}-h(\hat{\mathbf{x}}^-)$, weighted by how much the sensor is trusted.
:::

## Noise in the model's own units

A model is only half the job. $\mathbf{R}$ must describe the noise *in the same units as the innovation*. A sensor's data sheet often gives noise in its own raw units instead, and converting it is part of writing the model.

The camera is the clearest case. Its raw noise is in pixels: the centroid of a landmark wobbles by about $\sigma_{\text{px}}$ pixels. But pixels are not what the filter should compare. A better residual uses **normalized image coordinates**, $x_n = (u - c_x)/f_x$ and $y_n = (v - c_y)/f_y$: subtract the image center $(c_x, c_y)$ (the principal point from the camera lesson) and divide by the focal length measured in pixels. These equal $X/Z$ and $Y/Z$, the tangent of the angle off the camera's axis, so they no longer depend on the particular lens and chip. Dividing by $f$ divides the noise by $f$ too. Near the image center, where the tangent of a small angle is the angle itself,

$$
\sigma_{\text{angle}} \approx \frac{\sigma_{\text{px}}}{f},
$$

in radians, with $f$ in pixels. (Toward the image edges a pixel covers slightly less angle, so this is a slight overestimate there.)

::: example A navigation camera's noise in radians
A camera has $f = 2000$ pixels and centroids landmarks to $\sigma_{\text{px}} = 0.2$ pixel. The angular noise is $0.2/2000 = 0.0001\,\mathrm{rad}$. In arcseconds, multiply by $206{,}265$: about $20.6''$. For a crater $10\,\mathrm{km}$ away, that angle spans $0.0001 \times 10000 = 1$ meter sideways.

**Sanity check.** A longer focal length spreads the same scene over more pixels, so each pixel covers a smaller angle and the same $0.2$-pixel wobble means less. Doubling $f$ halves the angular noise, as the formula says.
:::

::: key Noise in the model's units
Write $\mathbf{R}$ in the units of the innovation. For a camera, express the residual in normalized image coordinates or as an angle, with $\sigma_{\text{angle}}\approx\sigma_{\text{px}}/f$ (focal length in pixels).
:::

## Information adds up

Two thermometers hang side by side. One is good, with a noise of $\sigma_1 = 1^\circ\mathrm{C}$. The other is cheap, with $\sigma_2 = 2^\circ\mathrm{C}$. How good is the best combination of the two?

The trick is to stop thinking in noise and think in **information**: one over the variance, $1/\sigma^2$. A precise sensor has small variance and so lots of information. When independent measurements of the same thing are combined in the best way, their **[[information adds|information-word]]**:

$$
\frac{1}{\sigma^2_{\text{combined}}} = \frac{1}{\sigma_1^2} + \frac{1}{\sigma_2^2}.
$$

For the thermometers: $1/1^2 = 1$ and $1/2^2 = 0.25$, so the combined information is $1 + 0.25 = 1.25$. Turn that back into a noise: $1/\sqrt{1.25} = 0.894$ degrees. The cheap thermometer helped, but only a little — about 11 percent. It carried a fifth of the total information, so it could not do more.

Push that further. A sensor with a hundred times the noise has ten thousand times less information. Added to a good sensor, it changes the answer by about one part in twenty thousand. Its geometry does not matter; its share of the information is simply too small.

For attitude, the same rule works with matrices. Each direction measurement $\hat{\mathbf{b}}_i$, trusted with weight $a_i = 1/\sigma_i^2$, adds its own piece to the **attitude information matrix**

$$
\mathbf{F}=\sum_i a_i\,(\mathbf{I}-\hat{\mathbf{b}}_i\hat{\mathbf{b}}_i^\mathsf{T}).
$$

This is the matrix this module has used since the star tracker accuracy lesson. The piece $\mathbf{I}-\hat{\mathbf{b}}_i\hat{\mathbf{b}}_i^\mathsf{T}$ says a direction tells you about rotations *across* it, and nothing about rotation *around* it. The attitude uncertainty is the inverse, $\mathbf{F}^{-1}$. **Centralized fusion** of several sensors means one thing here: sum their pieces into one $\mathbf{F}$, across sensor types as well as across stars.

::: example Does a coarse sensor help a star tracker's weak axis?
The star tracker accuracy lesson showed a second star tracker, mounted $90^\circ$ away, improving the first one's weak roll axis by $9.85$ times. Try the same idea with two far coarser sensors: a sun sensor ($2^\circ$) and a magnetometer ($3^\circ$), each giving one direction, along body axes the star tracker's roll axis cannot see well.

```python
import numpy as np
arcsec = np.radians(1/3600)

sigma_c = 10*arcsec
rng = np.random.default_rng(1)
cat = rng.standard_normal((3000,3)); cat /= np.linalg.norm(cat, axis=1, keepdims=True)
fov = np.radians(15.0)

def rotation(axis, ang):
    k = np.asarray(axis, float)/np.linalg.norm(axis)
    K = np.array([[0,-k[2],k[1]],[k[2],0,-k[0]],[-k[1],k[0],0]])
    return np.eye(3) + np.sin(ang)*K + (1-np.cos(ang))*K@K

A_true = rotation([0.3,-0.5,0.8], 1.1)
body = cat @ A_true.T
b_star = body[body[:,2] > np.cos(fov/2)]
F_star = sum((1/sigma_c**2)*(np.eye(3)-np.outer(b,b)) for b in b_star)

sigma_sun, sigma_mag = np.radians(2.0), np.radians(3.0)     # this module's own accuracy figures
F_sun = (1/sigma_sun**2) * (np.eye(3) - np.outer([1.,0,0], [1.,0,0]))   # boresight along body x
F_mag = (1/sigma_mag**2) * (np.eye(3) - np.outer([0.,1,0], [0.,1,0]))   # boresight along body y

def sigma_xyz(F):
    return np.sqrt(np.diag(np.linalg.inv(F))) / arcsec

print("star tracker alone,                sigma xyz (arcsec):", np.round(sigma_xyz(F_star), 3))
F_all = F_star + F_sun + F_mag
print("star tracker + sun + magnetometer, sigma xyz (arcsec):", np.round(sigma_xyz(F_all), 3))
print("F_star zz vs F_sun zz contribution:", F_star[2,2], "vs", F_sun[2,2],
      " ratio:", round(F_star[2,2]/F_sun[2,2]))
# star tracker alone,                sigma xyz (arcsec): [ 2.993  2.914 28.34 ]
# star tracker + sun + magnetometer, sigma xyz (arcsec): [ 2.993  2.914 28.339]
# F_star zz vs F_sun zz contribution: 57322056.22555028 vs 820.701587502936  ratio: 69845
```

**What the star tracker gives.** About $3''$ (arcseconds) on the two cross-boresight axes and $28.34''$ on roll, the $z$ axis — its known weak direction.

**What the sun sensor adds to roll.** Its noise is $2^\circ$, which is $0.03491\,\mathrm{rad}$. Its information about roll is one over that squared: $1/0.03491^2 \approx 821$ per radian squared. The star tracker's own roll information is about $5.73\times10^{7}$. The ratio is about $70{,}000$ to $1$.

**The result.** Roll goes from $28.340''$ to $28.339''$ — about one thousandth of a percent better. Adding two well-placed directions barely moved it.

**Sanity check.** $2^\circ$ is $7200''$, hundreds of times coarser than even the tracker's weak axis. By the thermometer rule, a sensor that much noisier can only nudge the answer by a tiny fraction. The second star tracker helped because it was just as precise. Geometric diversity pays off only between sensors whose accuracies are in the same neighborhood.
:::

::: key A sensor's benefit is capped by its own information
Information ($1/\sigma^2$, or the matrix $\mathbf{F}$) adds across independent sensors. A sensor can improve an axis only by the share of information it brings to that axis: a $2^\circ$ sensor cannot meaningfully backstop a $28''$ axis, however well it is oriented. Knowing each sensor's real noise level is what tells a designer which combinations are worth the complexity.
:::

## Two ways to combine: centralized and federated

Picture a school with three classes taking the same test. In one design, the principal grades every paper herself. In the other, each teacher grades her own class and sends the principal a class average and a note on how reliable it is. The first is the most accurate. The second is easier to run, and a teacher can spot a cheating student before the principal ever sees the results.

Flight software faces the same choice.

- **Centralized fusion** feeds every raw measurement into one filter, in one update. It is the statistically best a filter can do, because every measurement meets the prior exactly once. But every sensor is tied into one big design.
- **[[Federated fusion|federated]]** (or decentralized fusion) runs a separate **local filter** for each sensor. Each produces its own estimate and covariance. A **master filter** then combines those *estimates*, usually at a slower rate.

The federated design gives up some statistical efficiency for real engineering benefits:

1. A bad sensor can be caught and shut out at the local level, before it contaminates anything else — the same residual-checking idea this module used from the star tracker lesson onward.
2. Each local filter can run at its sensor's own natural rate, instead of forcing every sensor onto one clock.
3. A sensor can be added, removed or swapped without redesigning one giant filter.

::: key Fusion architectures
Centralized fusion — one filter, every raw measurement — is statistically optimal but couples every sensor into one design. Federated fusion — local filters, combined estimates — is modular and fault-tolerant, at the cost of a real hazard: combining estimates that secretly share prior information as though they were independent double-counts that information and gives an overconfident, inconsistent result. Covariance Intersection fuses without assuming independence and is guaranteed conservative rather than wrong.
:::

## The double-counting trap

Here is the hazard. Suppose you hear a rumor from two friends and think, "two people told me, so it must be true." But both heard it from the same person. You really have one source, **[[counted twice|double-count]]**.

In a federated filter, the "same person" is the shared **prior** — the estimate both local filters started from, such as the one state predicted from the vehicle's dynamics. Each local filter blends that prior with its own sensor. If the master then treats the two results as independent, the prior's information gets counted twice.

Work it with numbers. Everything is one number (a scalar), so information is one over variance.

- The shared prior: $x_0 = 100$ with variance $P_0 = 25$. Its information is $1/25 = 0.04$.
- Sensor A reads $z_A = 102$ with variance $R_A = 4$, information $0.25$.
- Sensor B reads $z_B = 96$ with variance $R_B = 9$, information $0.1111$.

**Local filter A** blends the prior with sensor A, so its information is $0.04 + 0.25 = 0.29$ and its variance is $1/0.29 = 3.448$. **Local filter B** gets $0.04 + 0.1111 = 0.1511$, a variance of $1/0.1511 = 6.618$.

**The correct answer** uses the prior once and each sensor once: $0.04 + 0.25 + 0.1111 = 0.4011$, a variance of $1/0.4011 = 2.493$.

**The naive federated answer** adds the two local informations as if independent: $0.29 + 0.1511 = 0.4411$, a variance of $1/0.4411 = 2.267$. It claims more information than exists. The excess is $0.4411 - 0.4011 = 0.04$ — exactly the prior's information, counted a second time.

::: example A shared prior, double-counted, and the conservative fix
The same numbers in code, including the estimates themselves, not only the variances.

```python
P0, x0 = 25.0, 100.0                       # a shared prior both local filters start from
R_A, R_B = 4.0, 9.0                        # two independent sensors' own measurement variances
z_A, z_B = 102.0, 96.0

def scalar_update(x_prior, P_prior, z, R):
    K = P_prior / (P_prior + R)
    return x_prior + K*(z - x_prior), (1-K)*P_prior

x_A, P_A = scalar_update(x0, P0, z_A, R_A)   # local filter A's posterior
x_B, P_B = scalar_update(x0, P0, z_B, R_B)   # local filter B's posterior, same shared prior
print("local posterior A: x=%.4f P=%.4f   local posterior B: x=%.4f P=%.4f" % (x_A, P_A, x_B, P_B))

P_central = 1.0/(1.0/P0 + 1.0/R_A + 1.0/R_B)                 # the correct answer: fuse the prior once
x_central = P_central*(x0/P0 + z_A/R_A + z_B/R_B)
print("centralized (correct):   x=%.4f  P=%.4f" % (x_central, P_central))

P_naive = 1.0/(1.0/P_A + 1.0/P_B)                             # treats A, B as independent -- they are not
x_naive = P_naive*(x_A/P_A + x_B/P_B)
print("naive federated (wrong): x=%.4f  P=%.4f  -- double-counts 1/P0=%.4f exactly (1/P_naive-1/P_central=%.4f)"
      % (x_naive, P_naive, 1/P0, 1/P_naive - 1/P_central))
# local posterior A: x=101.7241 P=3.4483   local posterior B: x=97.0588 P=6.6176
# centralized (correct):   x=100.1385  P=2.4931
# naive federated (wrong): x=100.1259  P=2.2670  -- double-counts 1/P0=0.0400 exactly (1/P_naive-1/P_central=0.0400)
```

**The local updates.** Filter A's gain is $K = 25/(25+4) = 0.862$, so it moves from $100$ toward $102$ by $0.862 \times 2 = 1.724$, landing at $101.724$. Filter B's gain is $25/(25+9) = 0.735$, so it moves toward $96$ by $0.735 \times 4 = 2.94$, landing at $97.059$.

**The comparison.** The correct combined estimate is $100.1385$ with variance $2.4931$. The naive one is close in value, $100.1259$, but reports variance $2.2670$ — smaller than the truth allows.

**Sanity check.** The naive filter's extra information, $1/P_{\text{naive}} - 1/P_{\text{central}}$, comes out to $0.0400$, which is $1/P_0$ to every printed digit. The code agrees with the hand calculation. The naive filter is **[[overconfident|overconfident]]**: not merely wrong, but wrong while claiming to be more sure than ever.

**The fix, Covariance Intersection.** When two estimates may share information in an unknown way, fuse them with **Covariance Intersection**:

$$
\frac{1}{P_{\text{CI}}} = \frac{\omega}{P_A} + \frac{1-\omega}{P_B},
$$

choosing the weight $\omega$ (Greek "omega") between $0$ and $1$ that makes $P_{\text{CI}}$ smallest. Its answer is **[[guaranteed never to claim too much|covariance-intersection]]**, however the two inputs are correlated.

```python
# in one dimension, 1/P_CI(w) is linear in w, so its minimum P_CI sits at one of the two endpoints
P_ci = min(P_A, P_B)
x_ci = x_A if P_A < P_B else x_B
print("covariance intersection: x=%.4f  P=%.4f  (the more precise single source)" % (x_ci, P_ci))
print("consistent (P_ci >= P_central)?", P_ci >= P_central, "   naive was overconfident (P_naive < P_central)?", P_naive < P_central)
# covariance intersection: x=101.7241  P=3.4483  (the more precise single source)
# consistent (P_ci >= P_central)? True    naive was overconfident (P_naive < P_central)? True
```

In one dimension, $1/P_{\text{CI}}$ is a straight-line function of $\omega$, so its best value sits at an end, $\omega = 0$ or $\omega = 1$. Covariance Intersection here simply keeps the more precise local estimate, A, and drops B. Its variance, $3.4483$, is larger than the correct $2.4931$: it pays some precision to be safe. Its real value shows in two or more dimensions, where one source can be strong along one axis and the other along another, and a blend keeps the best of both.
:::

::: note Why it has to be true
Each local filter fused the same prior with its own independent measurement, so their informations are

$$
\frac{1}{P_A}=\frac{1}{P_0}+\frac{1}{R_A}, \qquad \frac{1}{P_B}=\frac{1}{P_0}+\frac{1}{R_B}.
$$

Adding them as if independent gives

$$
\frac{1}{P_{\text{naive}}}=\frac{1}{P_A}+\frac{1}{P_B}=\frac{2}{P_0}+\frac{1}{R_A}+\frac{1}{R_B},
$$

while the correct centralized information is $1/P_{\text{central}}=1/P_0+1/R_A+1/R_B$. Subtract: exactly $1/P_0$ is left over. The prior appears twice in the naive sum and once in the correct one. That holds for any numbers, not only these.

For Covariance Intersection in one dimension: each input is honest on its own, so neither $1/P_A$ nor $1/P_B$ overstates what its source knows. A weighted average $\omega/P_A+(1-\omega)/P_B$, with weights that add to one, can never be larger than the larger of the two. So the fused estimate never claims more information than the better honest source already had. The full proof, in several dimensions and for every possible correlation, takes more work, but it rests on the same idea: an average of two honest outlines cannot be tighter than both.
:::

::: warning
Do not "fix" double counting by using Covariance Intersection everywhere. When the correlation between two estimates is actually known — as it is inside one centralized filter — the exact fusion is more precise ($2.4931$ against $3.4483$ here). Covariance Intersection is for correlations you cannot track, not a replacement for tracking the ones you can.
:::

## Check yourself

::: check
From this lesson's numbers, explain why adding a $2^\circ$ sun sensor to a star tracker whose worst axis is $28.34''$ improves that axis by only a tiny fraction, even though the sun sensor is mounted along a body axis that sees roll well.
:::

::: answer
Good placement means the sun sensor's information lands on the roll axis, but it says nothing about *how much* information it brings. Its noise, $2^\circ$ or $0.03491\,\mathrm{rad}$, gives roll information of about $1/0.03491^2\approx821$ per radian squared. The star tracker's own roll information is about $5.73\times10^{7}$, roughly $70{,}000$ times more — almost five orders of magnitude. Information adds, so the sun sensor changes the total by about one part in seventy thousand, and the roll accuracy moves from $28.340''$ to $28.339''$. Geometry only helps when the sensor's precision is not swamped first.
:::

::: check
Give one real engineering advantage of federated fusion over centralized fusion, and one real advantage of centralized over federated.
:::

::: answer
Federated: a bad sensor can be detected and shut out in its own local filter before it contaminates the combined estimate, and sensors can be added, removed or run at their own rates without redesigning one shared filter. Centralized: it is statistically optimal, because it processes every raw measurement against the true prior exactly once, so it can never discard or double-count information the way a careless federated combination can.
:::

::: check
In the double-counting example, $1/P_{\text{naive}}-1/P_{\text{central}}$ came out to exactly $1/P_0$. Explain why the difference is exactly the shared prior's information, not just approximately.
:::

::: answer
Each local posterior's information is the prior's plus its own sensor's: $1/P_A=1/P_0+1/R_A$ and $1/P_B=1/P_0+1/R_B$. Adding them as if independent gives $1/P_{\text{naive}}=2/P_0+1/R_A+1/R_B$. The correct centralized information is $1/P_{\text{central}}=1/P_0+1/R_A+1/R_B$. Subtracting leaves exactly $1/P_0$: the prior is counted twice in the naive sum and once in the correct one. It is algebra, true for any values, not an approximation.
:::

::: check
Why does Covariance Intersection in the one-dimensional example reduce to picking the more precise local estimate outright, instead of blending the two?
:::

::: answer
It chooses $\omega$ between $0$ and $1$ to make $P_{\text{CI}}$ smallest, which is the same as making $1/P_{\text{CI}}=\omega/P_A+(1-\omega)/P_B$ largest. In one dimension that expression is a straight line in $\omega$. A straight line on an interval reaches its largest value at one end, so the best choice is always $\omega=0$ or $\omega=1$. The "fused" estimate is then one of the two inputs, whichever had the smaller variance — here A, with $3.4483$. Real blending needs at least two dimensions, where each source can be strong along a different axis.
:::

::: check
A mission argues that because Covariance Intersection is "always safe," it should replace centralized fusion everywhere, even where the correlation between estimates is known and handled. Judge this argument using this lesson's numbers.
:::

::: answer
The centralized result has variance $2.4931$; Covariance Intersection gives $3.4483$. Covariance Intersection is conservative on purpose: it assumes nothing about how its inputs are correlated, and that caution costs real precision when the correlation is in fact known, as it is in the centralized filter where the shared prior is tracked explicitly. Using it everywhere would throw away that knowledge and report an estimate less precise than the data support. That is the opposite failure from the naive federated case — underconfident instead of overconfident — but still a real cost.
:::

::: check
A flight team can add either a second star tracker or a second sun sensor to improve its worst attitude axis. Which is the better investment, and why?
:::

::: answer
The second star tracker. This lesson showed that a sensor far coarser than the axis it is meant to help adds a negligible share of information, however well it is placed. The star tracker accuracy lesson showed a second, equally precise tracker mounted $90^\circ$ away improving the same worst axis by $9.85$ times, close to an order of magnitude. The general rule: an extra sensor helps only when its own precision is within reach of the axis it should strengthen, not merely when it points the right way.
:::

## Summary

| Symbol or idea | Meaning | Formula or fact |
| --- | --- | --- |
| $\mathbf{z}$, $h(\mathbf{x})$, $\mathbf{R}$ | Measurement, its predicted value, its noise | Every sensor in this module has this form |
| Innovation | The surprise in a measurement | $\boldsymbol{\nu}=\mathbf{z}-h(\hat{\mathbf{x}}^-)$ |
| $\sigma_{\text{angle}}\approx\sigma_{\text{px}}/f$ | Camera noise in the model's units | Residual in normalized image coordinates or as an angle; $f$ in pixels |
| Information | One over variance | Adds across independent sensors: $1/\sigma^2=1/\sigma_1^2+1/\sigma_2^2$ |
| Attitude information matrix | Centralized attitude fusion | $\mathbf{F}=\sum_i a_i(\mathbf{I}-\hat{\mathbf{b}}_i\hat{\mathbf{b}}_i^\mathsf{T})$, summed across sensor types |
| Benefit capped by information | Coarse sensors cannot rescue fine axes | A $2^\circ$ sensor barely moves a $28''$ axis, whatever its geometry |
| Federated fusion | Local filters, combined estimates | Modular and fault-isolating, but must avoid double counting |
| Double-counting error | Naive combination of shared-prior estimates | $1/P_{\text{naive}}-1/P_{\text{central}}=1/P_0$ exactly |
| Covariance Intersection | Fusion with unknown correlation | $1/P_{\text{CI}}=\omega/P_A+(1-\omega)/P_B$, minimized over $\omega$; conservative, never overconfident |

Everything here assumed each sensor was working as designed. The last lesson of the module asks what happens when that fails — an alignment that drifts, a sensor that suddenly lies — and shows that the innovation built here is the same tool that catches it.

::: context innovation-word Why "innovation"
The word means "the new thing." After the filter has predicted what a sensor should read, the only part of the actual reading that teaches it anything is the part it could not predict. Engineers call that leftover the innovation. If a filter is healthy, its innovations look like pure random noise with no pattern, because anything predictable has already been used. A pattern in the innovations — a drift, a steady offset, a sudden jump — is the first sign something is wrong.
:::

::: context predict-not-invert Why predict the reading instead of solving for the state
It might seem simpler to turn each sensor's reading straight into a state: a magnetometer reading into an attitude, say. But one magnetometer vector cannot fix a full attitude, and one camera pixel cannot fix a position. Going the other way always works. Given a guessed state, you can always predict what any sensor should read. So the filter compares readings with predictions, and each sensor contributes whatever partial information it has, even when it could never solve for the state alone.
:::

::: context information-word Why information adds but noise does not
Statisticians, following Ronald Fisher's work in the 1920s, measure how much a measurement tells you by its information, one over its variance. Two independent measurements carry the sum of their informations, like adding the flow of two pipes into one bucket. Noise levels do not add that way: two sensors of noise $1$ do not give noise $2$ or $0.5$, but $1/\sqrt{2} \approx 0.71$. Working in information turns the messy rule into plain addition.
:::

::: context federated Where the name comes from, and the two shapes
A federation is a group of states that run their own affairs and send decisions up to a central government. Neal Carlson proposed the federated filter around 1990 for navigation systems with many sensors, each with its own local processing.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <text x="90" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">centralized</text>
  <text x="272" y="18" font-size="12" text-anchor="middle" fill="#1f2a44">federated</text>
  <line x1="180" y1="28" x2="180" y2="170" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <g fill="#fff" stroke="#1f2a44" stroke-width="1.5">
    <rect x="15" y="40" width="50" height="22"/>
    <rect x="15" y="85" width="50" height="22"/>
    <rect x="15" y="130" width="50" height="22"/>
    <rect x="105" y="75" width="62" height="42" fill="#8fb8f0"/>
    <rect x="188" y="40" width="42" height="22"/>
    <rect x="188" y="85" width="42" height="22"/>
    <rect x="188" y="130" width="42" height="22"/>
    <rect x="243" y="40" width="42" height="22" fill="#f2b880"/>
    <rect x="243" y="85" width="42" height="22" fill="#f2b880"/>
    <rect x="243" y="130" width="42" height="22" fill="#f2b880"/>
    <rect x="303" y="75" width="50" height="42" fill="#8fb8f0"/>
  </g>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="65" y1="51" x2="105" y2="86"/>
    <line x1="65" y1="96" x2="105" y2="96"/>
    <line x1="65" y1="141" x2="105" y2="106"/>
    <line x1="230" y1="51" x2="243" y2="51"/>
    <line x1="230" y1="96" x2="243" y2="96"/>
    <line x1="230" y1="141" x2="243" y2="141"/>
    <line x1="285" y1="51" x2="303" y2="86"/>
    <line x1="285" y1="96" x2="303" y2="96"/>
    <line x1="285" y1="141" x2="303" y2="106"/>
  </g>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="40" y="55">star</text>
    <text x="40" y="100">sun</text>
    <text x="40" y="145">mag</text>
    <text x="136" y="94">one</text>
    <text x="136" y="108">filter</text>
    <text x="209" y="55">star</text>
    <text x="209" y="100">sun</text>
    <text x="209" y="145">mag</text>
    <text x="264" y="55">local</text>
    <text x="264" y="100">local</text>
    <text x="264" y="145">local</text>
    <text x="328" y="100">fuse</text>
  </g>
</svg>
```
:::

::: context double-count One fact, heard twice
Both friends passed on the same rumor from the same source. You heard two voices but only one piece of evidence.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <g stroke="#1d6fd1" stroke-width="2">
    <line x1="60" y1="85" x2="160" y2="40"/>
    <line x1="60" y1="85" x2="160" y2="130"/>
    <line x1="180" y1="40" x2="290" y2="85"/>
    <line x1="180" y1="130" x2="290" y2="85"/>
  </g>
  <circle cx="45" cy="85" r="18" fill="#f2b880" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="170" cy="40" r="16" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="170" cy="130" r="16" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="305" cy="85" r="18" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" text-anchor="middle" fill="#1f2a44">
    <text x="45" y="120">shared prior</text>
    <text x="170" y="16">filter A</text>
    <text x="170" y="162">filter B</text>
    <text x="305" y="120">master</text>
  </g>
  <text x="240" y="160" font-size="11" fill="#b4232c">prior arrives twice</text>
</svg>
```
:::

::: context overconfident Why an overconfident filter is dangerous
A filter uses its own covariance to decide how much to trust new measurements. If it believes it is very precise, it gives new data very little weight. So an overconfident filter starts ignoring its sensors, its real error grows while its reported error stays small, and it can drift far from the truth while claiming to know exactly where it is. Engineers call this filter divergence. It is why a filter that reports too little uncertainty is treated as more dangerous than one that reports too much.
:::

::: context covariance-intersection The safe outline
Simon Julier and Jeffrey Uhlmann introduced Covariance Intersection in 1997. In two dimensions, each estimate's uncertainty is an ellipse. Estimate A is sure vertically, B is sure sideways. Whatever the hidden correlation, the truth lies inside both, so it lies in their overlap. The Covariance Intersection ellipse (dashed, $\omega = 0.5$) always encloses that overlap and passes through its four corners.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="100" rx="80" ry="25" fill="none" stroke="#1d6fd1" stroke-width="2"/>
  <ellipse cx="180" cy="100" rx="25" ry="60" fill="none" stroke="#f2b880" stroke-width="2.5"/>
  <ellipse cx="180" cy="100" rx="33.7" ry="32.6" fill="none" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <g fill="#1f2a44">
    <circle cx="157.1" cy="76.0" r="2.5"/>
    <circle cx="202.9" cy="76.0" r="2.5"/>
    <circle cx="157.1" cy="124.0" r="2.5"/>
    <circle cx="202.9" cy="124.0" r="2.5"/>
  </g>
  <text x="270" y="104" font-size="12" fill="#1d6fd1">A</text>
  <text x="186" y="30" font-size="12" fill="#1f2a44">B</text>
  <text x="230" y="160" font-size="11" fill="#b4232c">covariance</text>
  <text x="230" y="174" font-size="11" fill="#b4232c">intersection</text>
</svg>
```
:::
