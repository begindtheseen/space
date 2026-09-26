---
id: l06-anchor-c-quaternion-ekf
title: "Anchor C: the quaternion EKF, proved consistent"
minutes: 21
covers:
  - "anchor project C — multiplicative quaternion EKF fusing IMU and star tracker, with NEES and NIS consistency checks"
---

Two friends promise to meet you at the park at 3 o'clock. The first says, "I'll be there at 3, give or take five minutes," and arrives at 3:40. The second says, "Somewhere between 2:30 and 3:30," and arrives at 3:10. On average, the first friend may even be closer to on time over a month. But you can only *plan* around the second one, because the second one's "give or take" is honest.

An **estimator** — software that works out a vehicle's state from imperfect sensors — makes the same kind of promise. When it reports a **covariance** (its stated uncertainty, its "give or take"), it is making a specific, checkable claim. Not only "the attitude is about this," but "the true attitude lies within this uncertainty, with this much confidence." Everything downstream trusts that claim without checking it again: a controller's gain margins, a Monte Carlo campaign's dispersions, a go/no-go decision.

An estimator that is accurate on average but reports a covariance far smaller than its real error is not slightly imperfect. It is a filter lying about its own confidence. And the lie is invisible in an RMS error number (root-mean-square, the typical size of the error), which asks only "how far off was it?" — never "did it know how far off it might be?" This lesson covers what turns the third anchor project, a **multiplicative EKF** fusing a gyro and a star tracker, into a project that answers the second question as well as the first.

## What the project has to contain

A **[[Kalman filter|kalman]]** is the standard recipe for blending a prediction with a measurement, each weighted by how much it can be trusted. An **EKF** (extended Kalman filter, said "E-K-F") stretches that recipe to problems that are not straight-line. The version this anchor needs is the **multiplicative EKF**, or **MEKF** (said "M-E-K-F"):

- a **[[quaternion|quaternion]]** — a set of four numbers that describes which way the vehicle points — carries the full attitude estimate;
- the estimate is corrected by **[[multiplying in a small rotation|multiplicative]]**, not by adding numbers to it;
- alongside it, a small **error state** — the gap between the estimate and the truth — is tracked with an ordinary, linear covariance.

That structure is derived in full in this course's nonlinear-filtering material; this lesson does not repeat it. What it adds is the standard the project needs to be defensible:

1. **gyro propagation with an estimated bias** — the gyro measures turning rate, and the filter steps the attitude forward with it while also estimating the gyro's slow built-in error;
2. **a [[star tracker|star-tracker]] measurement update** — a camera that recognizes star patterns reports the attitude directly, and the filter corrects itself with it;
3. **the part this anchor is named for**: a NEES and NIS **consistency test**, run as a real Monte Carlo with real numbers, not asserted.

### The six-state error model

Six numbers capture the essential structure. Three are the **attitude error** $\delta\boldsymbol\theta$ (read "delta theta": the small angles between the estimated and true attitude). Three are the **gyro bias error** $\delta\mathbf{b}$ ("delta b": how wrong the bias estimate is). They evolve as:

$$
\dot{\delta\boldsymbol\theta} = -[\hat{\boldsymbol\omega}\times]\,\delta\boldsymbol\theta - \delta\mathbf{b} + \boldsymbol\eta_v, \qquad \dot{\delta\mathbf{b}} = \boldsymbol\eta_u.
$$

In words: the attitude error is turned around by the vehicle's estimated body rate $\hat{\boldsymbol\omega}$ (read $[\hat{\boldsymbol\omega}\times]$ as "omega-hat cross", the matrix that does a cross product with the rate). It grows with any uncorrected bias. And it is jostled by the gyro's random noise $\boldsymbol\eta_v$ ("eta sub v"). The bias error itself wanders slowly, driven by noise $\boldsymbol\eta_u$.

The star-tracker update compares the propagated estimate with the measured attitude. It forms the **error quaternion** between them and takes twice its vector part — twice the last three numbers — which for small errors is the rotation angle about each axis. That gives a direct, linear measurement of $\delta\boldsymbol\theta$.

The worked example below runs this error-state model as a plain linear Kalman filter. That is a compact stand-in for the full nonlinear-quaternion truth model a real anchor project should run, chosen so every number can be shown and reproduced from a page of code. If you take the same shortcut for a first pass, say exactly this in your project's assumptions section. For the version you submit, run the full quaternion truth model this course's estimation material develops.

## NEES and NIS, applied rather than defined

Here are the two tests. Each takes an error, divides it by the uncertainty the filter claimed, and squares it — a "how many claimed standard deviations off were you?" score.

The **NEES** (normalized estimation error squared, said "neez") uses the true error $\mathbf{e}_k$ — the difference between the true state and the estimate at step $k$ — and the filter's updated [[covariance|covariance]] $\mathbf{P}_k^+$ ("P k plus"):

$$
\text{NEES}_k = \mathbf{e}_k^{\mathsf T}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k.
$$

The **NIS** (normalized innovation squared, said "niss") uses the **[[innovation|innovation]]** $\boldsymbol\nu_k$ ("nu") — the measurement minus what the filter predicted it would be — and that prediction's covariance $\mathbf{S}_k$:

$$
\text{NIS}_k = \boldsymbol\nu_k^{\mathsf T}\mathbf{S}_k^{-1}\boldsymbol\nu_k, \qquad \mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf T} + \mathbf{R}.
$$

Here $\mathbf{P}_k^-$ is the covariance right before the update, $\mathbf{H}$ maps the state to what the sensor sees, and $\mathbf{R}$ is the sensor's noise covariance.

The course's filtering material proves that, for a **consistent** filter — one whose claimed uncertainty matches its real error — NEES follows a **[[chi-square distribution|chi-square]]** (said "kai-square") with $n$ degrees of freedom ($n$ = number of states, here 6). NIS follows one with $m$ degrees of freedom ($m$ = number of measurements, here 3). Its average value is $n$ (or $m$). Averaging over $r$ independent Monte Carlo runs gives a 95% acceptance band around that average:

$$
\left[\frac{\chi^2_{rn}(0.025)}{r},\ \frac{\chi^2_{rn}(0.975)}{r}\right].
$$

Read $\chi^2_{rn}(0.025)$ as "the chi-square value, with $rn$ degrees of freedom, that has 2.5% of the distribution below it".

The practical difference between the two tests is what they need.

- **NEES needs the true state**, so it only ever runs in simulation.
- **NIS needs only the measurement and the prior estimate**, so it also runs on real flight data.

A project that reports only one is giving up half the evidence for free. NEES catches an inconsistency anywhere in the full state — including a bias term the measurement might barely excite. NIS is the test that is still available once there is no truth to compare against.

::: key
NEES uses the true state and only runs in simulation; NIS uses only the innovation and runs on real flight data too. A filter is consistent when both sit inside their chi-square bands across a Monte Carlo of independent runs — not when a single run's plot looks smooth, and not from accuracy alone, since an overconfident filter can be accurate on average while still lying about its own uncertainty.
:::

::: example Computing the acceptance band at two sample sizes
Take $n = 6$ states. The chi-square percentage points come from `scipy.stats.chi2.ppf` in Python.

**At $r = 300$ runs.** The band is $\big[\chi^2_{1800}(0.025)/300,\ \chi^2_{1800}(0.975)/300\big] = [5.614,\ 6.398]$.

**At $r = 100$ runs.** The band is $\big[\chi^2_{600}(0.025)/100,\ \chi^2_{600}(0.975)/100\big] = [5.340,\ 6.698]$.

Both bands surround the expected value $6$. The $100$-run band is visibly wider: its width is $6.698 - 5.340 = 1.358$, against $6.398 - 5.614 = 0.784$ for $300$ runs.

Why? The band brackets the *average* of $r$ independent chi-square draws, and averaging more draws pulls the average more tightly toward its true mean — the same reason a bigger survey gives a tighter answer. Sanity check: three times the runs should shrink the width by about $\sqrt{3} \approx 1.73$, and $1.358 / 0.784 = 1.73$.

So a verdict reported without $r$ does not tell a reviewer how demanding the test actually was.
:::

## A worked consistency test, with a fault injected on purpose

Set up a Monte Carlo of the six-state model: $300$ runs of $180$ steps each. The truth uses these sensor values:

- gyro **angle random walk** density $\sigma_v = 10^{-4}\,\mathrm{rad/s/\sqrt{Hz}}$ — the gyro's jitter;
- bias random-walk density $\sigma_u = 10^{-6}\,\mathrm{rad/s/\sqrt{Hz}}$ — how fast its bias drifts;
- star-tracker updates at $1\,\mathrm{Hz}$ (once per second), with noise $\sigma_{\text{st}} = 5 \times 10^{-5}\,\mathrm{rad}$ per axis.

The acceptance bands at $r = 300$ are $[5.614,\ 6.398]$ for NEES ($n = 6$) and $[2.729,\ 3.283]$ for NIS ($m = 3$). Run it twice, at two settings of the filter's assumed **[[process noise|process-noise]]** — how much random wandering the filter believes the world adds each step.

::: example A correctly tuned filter, and the same filter with process noise cut a hundredfold
**Nominal.** Set the filter's process-noise matrix to match the truth model exactly. Over the settled part of the run, the 300-run mean NEES is $6.067$ — inside $[5.614,\ 6.398]$. Mean NIS is $2.984$ — inside $[2.729,\ 3.283]$.

Check it step by step too, not only on the overall mean. NEES sits inside its band at $96.9\%$ of steps and NIS at $95.6\%$. A two-sided 95% band is built to be missed about 5% of the time by pure chance, so both are what a healthy filter should show.

**Deliberately overconfident.** Now rerun the identical Monte Carlo with the filter's assumed process noise cut to one hundredth of the true value. The filter now believes its state is far better known than it is.

- Mean NEES is $404.9$. Compared with the band's ceiling: $404.9 / 6.398 = 63.3$, more than $63$ times too high.
- Mean NIS is $32.3$. Compared with its ceiling: $32.3 / 3.283 = 9.8$ times too high.
- Both sit outside their bands at every single step checked.

Sanity check: NEES jumps far more than NIS. That fits: NIS includes the sensor noise $\mathbf{R}$, which the fault did not touch, so its denominator cannot shrink as much as the state covariance does.

The second run is not a mistake to fix before reporting. It is there on purpose. A consistency test that has only ever said "passed" on a filter you already believe is healthy tells a reviewer nothing about whether the test would catch a real problem. Showing that a known, injected fault produces the inconsistency the theory predicts — and by how much — is evidence the test has power, not only that it ran.
:::

::: warning
The most common tuning failure this module names: adjusting the process-noise matrix until a single run's state-estimate plot looks smooth. A smooth plot and a consistent filter are not the same claim. An overconfident filter — one whose covariance has collapsed well below its true error — often gives the *smoothest* plot of all. A small reported covariance means the filter trusts its own prediction and barely reacts to new measurements. The plot that looks best by eye can be the filter that is lying most confidently. Run NEES and NIS before trusting any tuning, not after a plot has made you comfortable.
:::

## Verification versus validation, for this project

Every number above was produced with the truth known. That makes it **[[verification|v-and-v]]**: checking that the filter's covariance matches its actual error inside the simulation that generated both.

It is not **validation**. Nothing here checks whether the noise models — the $\sigma_v$ and $\sigma_u$ values, the star-tracker noise — describe a real IMU or a real star tracker. A self-taught project can usually run the full verification above end to end. Validating the noise models against real hardware is a separate, harder step; the hardware-adjacent lesson later in this module covers what it requires.

State the boundary in the write-up. Do not let "consistent" imply "validated against real sensors". They are different claims, and an experienced reviewer will ask which one you are making.

::: key
Report consistency with the numbers, not a verdict: mean NEES and NIS against their chi-square bands, the number of runs $r$ the bands came from, and a deliberately injected fault that the test caught. Call it verification in simulation; validation against real sensors is a separate step.
:::

## What the interviewer asks, and what the project needs ready

Four questions recur on this project.

1. **Why check consistency instead of only reporting RMS attitude error?** Because an accurate filter with a badly wrong covariance is dangerous in every system that trusts that covariance. RMS error alone cannot tell an honest filter from an overconfident one.
2. **How do you know your NEES and NIS test would catch a real problem?** The fault-injection result is the direct answer — not a claim that the test is sound in theory.
3. **Did you validate this, or only verify it?** For a simulation-only project the honest answer is "verified", with validation against real hardware named as the next step.
4. **What would you do if NIS looked fine but NEES did not?** A real, diagnostic question. NIS depends only on $\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf T} + \mathbf{R}$ — the part of the state the sensor sees. NEES sees the full state error. So a state component the measurement barely observes can carry a badly wrong covariance that NEES catches and NIS does not.

## Check yourself

::: check
An estimator's RMS attitude error over a test campaign is small and looks excellent. Explain why this alone does not show the filter is consistent, and name the quantity that would.
:::

::: answer
RMS error measures only the typical size of the estimate's distance from truth. It says nothing about whether the filter's own reported covariance matches that distance. A filter can be accurate on average while reporting a covariance far smaller than its real error — overconfident — which is dangerous because everything downstream treats that covariance as trustworthy. Consistency is shown by comparing the actual error against the reported covariance directly: NEES, $\mathbf{e}_k^{\mathsf T}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k$, checked against a chi-square band — or NIS where truth is not available.
:::

::: check
Why does this lesson treat the deliberately overconfident run — process noise cut a hundredfold — as evidence to include, rather than a mistake to fix before reporting?
:::

::: answer
A test that has only ever run on a filter already believed healthy gives no evidence it can detect a real inconsistency. A test with no statistical power would also "pass" a good filter, and you could not tell the difference. Injecting a known fault and showing the test catches it — by the expected mechanism, and by an amount that fits the size of the fault — shows the test has teeth. Here mean NEES came out more than sixty times the band's ceiling, which makes the healthy filter's clean result far more believable than it would be alone.
:::

::: check
A colleague suggests skipping NEES in a project's Monte Carlo, since NIS is the version that runs on real flight hardware anyway. What is lost by doing this in a simulation where the true state is available?
:::

::: answer
NIS depends only on the innovation, whose covariance $\mathbf{S}_k = \mathbf{H}\mathbf{P}_k^-\mathbf{H}^{\mathsf T} + \mathbf{R}$ reflects only the part of the state the measurement observes well. A component the measurement is weakly sensitive to — here, possibly the gyro bias, which the star-tracker update reaches only indirectly through the coupled dynamics — can carry a badly wrong covariance without disturbing the innovation enough for NIS to notice. NEES compares the full state error with the full covariance and has no such blind spot. In simulation the truth costs nothing extra, so skipping NEES trades a stronger test for a weaker one to save an experiment that is already available.
:::

::: check
Using the band formula, the NEES band for $n = 6$ at $r = 50$ runs is $[5.078,\ 6.997]$. Compare it with the $[5.614,\ 6.398]$ band at $r = 300$. Explain why it is wider, and what that means for a filter that passed a 50-run campaign.
:::

::: answer
The $50$-run band is $6.997 - 5.078 = 1.919$ wide, against $0.784$ for $300$ runs — about $2.45$ times wider, close to $\sqrt{6} \approx 2.45$, since there are six times fewer runs. The band brackets the average of $r$ independent chi-square draws, and averaging more draws pulls the average more tightly toward $n = 6$. So a $50$-run campaign is a less demanding test. A filter whose true average NEES is, say, $6.6$ — somewhat overconfident — would pass the $50$-run band but fail the $300$-run one. Passing a small-sample campaign is weaker evidence, so the sample size belongs in the write-up next to the verdict.
:::

::: check
A project's write-up says: "The filter is consistent; NEES and NIS were checked." What three specific things should be added for the claim to be defensible?
:::

::: answer
First, the actual numbers against the actual bands — mean NEES and NIS with the chi-square bands they were compared to, not only pass or fail. Second, the number of independent Monte Carlo runs the bands came from, since their width depends on it. Third, evidence the test has power to catch a real fault — ideally a deliberately injected inconsistency and the size of what was detected, as in this lesson's overconfident-filter run. "Checked", without the numbers, the sample size and proof the test can fail, is a claim a skeptical reviewer has no way to judge.
:::

## Summary

| Item | Statement |
| --- | --- |
| MEKF | Quaternion carries the attitude, corrected by multiplying in a small rotation; six-state error $(\delta\boldsymbol\theta, \delta\mathbf{b})$ carries the covariance |
| NEES | $\mathbf{e}_k^{\mathsf T}(\mathbf{P}_k^+)^{-1}\mathbf{e}_k \sim \chi^2_n$; needs truth, simulation only |
| NIS | $\boldsymbol\nu_k^{\mathsf T}\mathbf{S}_k^{-1}\boldsymbol\nu_k \sim \chi^2_m$; needs only the innovation, runs on real data |
| Acceptance band | $\big[\chi^2_{rn}(0.025)/r,\ \chi^2_{rn}(0.975)/r\big]$; narrows as $r$ grows |
| This lesson's bands | NEES $[5.614, 6.398]$ ($n = 6$), NIS $[2.729, 3.283]$ ($m = 3$), both at $r = 300$ |
| Nominal filter | Mean NEES $6.067$, mean NIS $2.984$ — both inside, in-band at about 95–97% of steps |
| Overconfident filter ($Q \times 0.01$) | Mean NEES $404.9$ ($63\times$ the ceiling), mean NIS $32.3$ — outside at every step |
| Verified vs validated | This exercise verifies covariance-to-error consistency in simulation; validating the noise model against real hardware is a separate, later step |

The next lesson turns from an estimator's uncertainty to another correctness question: fitting an orbit to data with real measurement imperfection, in anchor project D, batch least-squares orbit determination.

::: context kalman From Apollo to your phone
Rudolf Kálmán published the filter that carries his name in 1960. Almost at once, Stanley Schmidt's group at NASA Ames adapted it to the curved, nonlinear problem of navigating to the Moon — the "extended" Kalman filter — and a version of it flew in the Apollo guidance computer. Today the same idea runs in phones, cars and every spacecraft attitude system. Its core is a weighted average: trust the prediction more when the sensor is noisy, and the sensor more when the prediction has drifted.
:::

::: context quaternion Four numbers for a direction
Three angles (like roll, pitch and yaw) can describe any orientation, but at certain attitudes they jam up — two axes line up and one degree of freedom is lost, a problem called **gimbal lock**. A **quaternion** uses four numbers instead, with the rule that their squares add to one. It never jams, and combining two rotations is one multiplication. William Rowan Hamilton invented quaternions in 1843 and, the story goes, scratched the key formula into Broom Bridge in Dublin when it came to him on a walk.
:::

::: context multiplicative Why multiply instead of add
A quaternion for attitude must keep length one. If a filter added a correction to its four numbers, the result would drift off length one and stop being a pure rotation. So the MEKF does something smarter: it turns the correction into a tiny rotation of its own and *multiplies* it onto the estimate, the way you would turn a map a few degrees rather than redraw it. The three small angles of that correction are the error state the covariance tracks, which is why the covariance is 3-by-3 for attitude rather than 4-by-4.
:::

::: context star-tracker A camera that knows the sky
A **star tracker** photographs a patch of sky, finds the bright dots, and matches their pattern against a star catalog stored on board. From which stars it sees, and where, it computes the spacecraft's attitude. Good ones are accurate to a few arcseconds. The lesson's $5 \times 10^{-5}\,\mathrm{rad}$ per axis is about $10.3$ arcseconds — one arcsecond is $1/3600$ of a degree. Star trackers are precise but slow and can be blinded by the Sun, which is why they are paired with a fast gyro.
:::

::: context covariance Uncertainty as a shape
A **covariance** describes an estimate's uncertainty as a shape around it — an ellipse in two dimensions. An honest filter draws an ellipse the truth usually falls inside. An overconfident one draws a tiny ellipse and the truth often lands well outside it. NEES measures exactly this: how far outside, in units of the ellipse's own size, the truth lands.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <ellipse cx="90" cy="70" rx="60" ry="36" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="90" cy="70" r="5" fill="#1f2a44"/>
  <circle cx="122" cy="82" r="5" fill="#b4232c"/>
  <ellipse cx="270" cy="70" rx="14" ry="9" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <circle cx="270" cy="70" r="5" fill="#1f2a44"/>
  <circle cx="302" cy="82" r="5" fill="#b4232c"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="128">honest: truth inside</text><text x="270" y="128">overconfident: truth outside</text>
  </g>
  <g font-size="11">
    <text x="20" y="20" fill="#1f2a44">dark dot = estimate</text><text x="200" y="20" fill="#b4232c">red dot = truth</text>
  </g>
</svg>
```

The truth is the same distance from the estimate in both drawings; only the claimed uncertainty differs.
:::

::: context innovation The filter's surprise
The **innovation** is how surprised the filter is by a measurement: what the sensor reported minus what the filter expected it to report. A healthy filter is surprised by about as much as it predicted it would be — that prediction is $\mathbf{S}_k$. If the surprises keep coming out bigger than $\mathbf{S}_k$ says they should, NIS rises and the filter is overconfident. The name comes from time-series statistics: it is the genuinely new information each measurement brings.
:::

::: context chi-square Adding up squared surprises
Draw a random number from a bell curve with standard deviation one and square it. Do that $n$ times and add the squares. The total follows a **chi-square** distribution ("kai-square") with $n$ degrees of freedom, and its average is exactly $n$. A consistent filter's NEES is that kind of sum, so it should average $6$ for six states. For one single draw, 95% of values fall between about $1.24$ and $14.45$ — which is why one run cannot judge a filter, and averaging many runs is needed for a tight band.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="150" x2="345" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline points="40,150.0 48,139.6 55,117.5 62,93.1 70,71.2 78,54.1 85,42.4 92,36.0 100,34.0 108,35.7 115,40.1 122,46.4 130,54.0 138,62.2 145,70.7 152,79.1 160,87.2 168,94.8 175,101.8 182,108.2 190,113.9 198,119.0 205,123.5 212,127.5 220,130.9 228,133.8 235,136.4 242,138.6 250,140.4 258,142.0 265,143.3 272,144.5 280,145.4 288,146.2 295,146.8 302,147.4 310,147.9 318,148.2 325,148.6 332,148.8 340,149.0" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="59" y1="150" x2="59" y2="106" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="257" y1="150" x2="257" y2="142" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="130" y1="150" x2="130" y2="54" stroke="#1f2a44" stroke-width="1.5"/>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="166">0</text><text x="130" y="166">6</text><text x="190" y="166">10</text><text x="265" y="166">15</text><text x="340" y="166">20</text>
    <text x="150" y="46">mean = 6</text>
  </g>
  <g font-size="11" fill="#b4232c" text-anchor="middle">
    <text x="59" y="98">1.24</text><text x="262" y="132">14.45</text>
  </g>
</svg>
```

The curve is chi-square with 6 degrees of freedom; the red dashed lines hold the middle 95% of single draws.
:::

::: context process-noise How much the world wanders
**Process noise**, the matrix $\mathbf{Q}$, is the filter's belief about how much unpredictable change sneaks in between measurements — gyro jitter, bias drift. Set it too small and the filter thinks its prediction is nearly perfect, so its covariance shrinks and it largely ignores new measurements: overconfident. Set it too large and the filter chases every noisy measurement and claims more uncertainty than it has: conservative. Tuning $\mathbf{Q}$ honestly, and proving it with NEES and NIS, is much of the real work of building a filter.
:::

::: context v-and-v Two different questions
Engineers pair these words as **V&V**. **Verification** asks, "did we build it right?" — does the code do what its own equations say? **Validation** asks, "did we build the right thing?" — do those equations describe the real world? A filter can pass every verification test against a simulation whose sensor model is wrong, and still fail on real hardware.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <rect x="15" y="20" width="150" height="80" rx="8" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <rect x="195" y="20" width="150" height="80" rx="8" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="90" y="44" font-weight="700">Verification</text><text x="90" y="64">code vs its own math</text><text x="90" y="82">truth known in sim</text>
    <text x="270" y="44" font-weight="700">Validation</text><text x="270" y="64">model vs real sensors</text><text x="270" y="82">needs hardware data</text>
  </g>
  <text x="90" y="120" font-size="11" fill="#1d6fd1" text-anchor="middle">this lesson: done</text>
  <text x="270" y="120" font-size="11" fill="#6c7a93" text-anchor="middle">a later, separate step</text>
</svg>
```
:::
