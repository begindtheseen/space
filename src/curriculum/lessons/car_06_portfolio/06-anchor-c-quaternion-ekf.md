---
id: l06-anchor-c-quaternion-ekf
title: "Anchor C: the quaternion EKF, proved consistent"
minutes: 22
covers:
  - "anchor project C — multiplicative quaternion EKF fusing IMU and star tracker, with NEES and NIS consistency checks"
---

An attitude estimator that reports a covariance is making a specific, checkable claim: not merely "the attitude is approximately this," but "the true attitude lies within this stated uncertainty, with this much confidence." Everything downstream — a controller's gain margins, a Monte Carlo campaign's dispersion set, a go/no-go decision — trusts that claim without re-deriving it. An estimator that is accurate on average but reports a covariance far smaller than its actual error is not a minor imperfection; it is a filter lying about its own confidence, and the lie is invisible in an RMS-error number that only ever asks "how far off was it," never "did it know how far off it might be." This lesson covers what turns a multiplicative EKF fusing IMU and star-tracker data into a project that answers the second question, not only the first.

## What the project has to contain

The multiplicative EKF (MEKF) structure this anchor project should implement — a quaternion carrying the full, nonlinear attitude estimate, updated multiplicatively, with a linear error-state covariance propagated alongside it — is developed in full in this curriculum's nonlinear-filtering material; this lesson does not re-derive it. What it adds is the standard this project needs to be defensible: gyro propagation with an estimated bias, a star-tracker measurement update, and — the specific addition this anchor project is named for — a normalized estimation error squared (NEES) and normalized innovation squared (NIS) consistency test, run as an actual Monte Carlo with real numbers, not asserted.

A six-state error model captures the essential structure: attitude error $\delta\boldsymbol\theta$ and gyro bias error $\delta\mathbf b$, coupled through the body rate via $\dot{\delta\boldsymbol\theta} = -[\hat{\boldsymbol\omega}\times]\delta\boldsymbol\theta - \delta\mathbf b + \boldsymbol\eta_v$, $\dot{\delta\mathbf b} = \boldsymbol\eta_u$, with a star-tracker update built from the twice-vector-part of the error quaternion between the propagated estimate and the measurement, giving a direct, linear measurement of $\delta\boldsymbol\theta$. The worked example below runs this error-state structure directly as a linear Kalman filter — a compact stand-in for the full nonlinear-quaternion truth model a real anchor project should run — precisely because it lets every number below be shown in full and reproduced from a page of code; say exactly this in your own project's assumptions section if you take the same shortcut for a first pass, and run the full quaternion truth model, as this curriculum's estimation material develops it, for the version you actually submit.

## NEES and NIS, applied rather than defined

This curriculum's filtering material derives, in full, why the whitened state error $\mathbf e_k^{\mathsf T}(\mathbf P_k^+)^{-1}\mathbf e_k$ and the whitened innovation $\boldsymbol\nu_k^{\mathsf T}\mathbf S_k^{-1}\boldsymbol\nu_k$ are chi-square distributed for a consistent filter, with degrees of freedom equal to the state and measurement dimension respectively, and why averaging $r$ independent Monte Carlo runs gives a band $\big[\chi^2_{rn}(0.025)/r,\ \chi^2_{rn}(0.975)/r\big]$ around the expected value $n$. This lesson takes that result as given and applies it: NEES needs the true state, so it only ever runs in simulation; NIS needs only the measurement and the prior estimate, so it is the version that also runs on real flight data. A project that reports only one of the two is reporting half the available evidence for free — NEES catches an inconsistency anywhere in the full state, including a bias term the measurement might not directly excite, while NIS is the test that will still be available once there is no truth left to compare against.

::: key
NEES uses the true state and only runs in simulation; NIS uses only the innovation and runs on real flight data too. A filter is consistent when both sit inside their chi-square bands across a Monte Carlo of independent runs — not when a single run's plot looks smooth, and not from accuracy alone, since an overconfident filter can be accurate on average while still lying about its own uncertainty.
:::

::: example Computing the acceptance band itself, at two different sample sizes
For $n=6$ states, `scipy.stats.chi2.ppf` gives the two-sided $95\%$ band $\big[\chi^2_{6r}(0.025)/r,\ \chi^2_{6r}(0.975)/r\big]$ directly: at $r=300$ runs, $[5.614,\,6.398]$; at $r=100$ runs, $[5.340,\,6.698]$ — visibly wider around the same expected value of $6$. The band narrows as $r$ grows because it brackets the *average* of $r$ independent chi-square draws, and averaging concentrates a sample more tightly around its true mean. A project that reports a verdict without also reporting $r$ has not given a reviewer enough to judge how demanding the test actually was.
:::

## A worked consistency test, including a fault deliberately injected to prove the test has teeth

Running a $300$-run, $180$-step Monte Carlo of the six-state error model above (gyro angle-random-walk density $\sigma_v=10^{-4}\,\mathrm{rad/s/\sqrt{Hz}}$, bias random-walk density $\sigma_u=10^{-6}\,\mathrm{rad/s/\sqrt{Hz}}$, $1\,\mathrm{Hz}$ star-tracker updates at $\sigma_{\text{st}}=5\times10^{-5}\,\mathrm{rad}$ per axis) at two settings of the filter's assumed process noise gives the bands $[5.614,\,6.398]$ for NEES ($n=6$, $r=300$) and $[2.729,\,3.283]$ for NIS ($m=3$, $r=300$).

::: example A correctly tuned filter, and the same filter with process noise deliberately underestimated a hundredfold
**Nominal.** With the filter's process-noise matrix set to match the truth model exactly, the $300$-run mean NEES over the settled window is $6.067$ — inside the band — and mean NIS is $2.984$, also inside. Checked step by step rather than only on the mean, NEES sits inside its band at $96.9\%$ of steps and NIS at $95.6\%$, both consistent with the roughly $95\%$ a two-sided band is built to tolerate by chance alone.

**Deliberately overconfident.** Re-running the identical Monte Carlo with the filter's assumed process noise cut to one hundredth of the true value — the filter believes its own state is far better known than it is — gives mean NEES of $404.9$, more than $63$ times the band's ceiling of $6.398$, and mean NIS of $32.3$, about $9.8$ times its ceiling. Both sit outside their band at every single step checked.

The second run is not a mistake to be corrected before reporting; it is included deliberately, because a consistency test that only ever reports "passed" on a filter you already believe is consistent tells a reviewer nothing about whether the test itself would have caught a real problem. Showing that a known, injected fault produces exactly the inconsistency the theory predicts — and by how much — is evidence the test has power, not just that it ran.
:::

::: warning
A filter tuned by adjusting the process-noise matrix until a single run's state-estimate plot looks smooth is the single most common failure mode named in this module for a reason: a smooth plot and a consistent filter are not the same claim, and an overconfident filter — one whose covariance has collapsed well below its true error — often produces the *smoothest*-looking plot of all, since a small reported covariance corresponds to a filter that trusts its own prediction and barely reacts to new measurements. The plot that looks best by eye can be the filter that is lying most confidently. Run NEES and NIS before trusting any tuning, not after a plot has already made you comfortable with it.
:::

## Verification versus validation, for this specific project

Every number above was established with truth known — this is a verification exercise, checking that the filter's covariance matches its actual error inside the simulation that generated both. It is not validation: nothing here checks whether the underlying sensor noise models, the $\sigma_v$ and $\sigma_u$ values, or the star-tracker noise assumption actually describe a real IMU or a real star tracker's behavior. A self-taught project can usually run the full verification exercise above end to end; validating the noise model itself against real hardware is a separate, harder step, and the hardware-adjacent lesson later in this module covers exactly what that step requires. State the boundary explicitly in the write-up rather than letting "consistent" imply "validated against real sensors" — they are not the same claim, and an experienced reviewer will ask which one you are making.

## What the interviewer asks, and what the project needs ready

Four questions recur on this project. Why check consistency rather than only reporting RMS attitude error — because an accurate filter with a badly wrong covariance is dangerous in every system that trusts that covariance downstream, and RMS error alone cannot distinguish an honest filter from an overconfident one. How do you know your NEES and NIS test would actually catch a real problem — the fault-injection result above is the direct answer, not an assertion that the test is sound in theory. Did you validate this or only verify it — the honest answer for a simulation-only project is verified, with validation against real hardware named as the explicit next step. And what would you do if NIS looked fine but NEES did not — a real and diagnostic question, since NIS depends only on $\mathbf S_k = \mathbf H\mathbf P_k^-\mathbf H^{\mathsf T}+\mathbf R$ while NEES sees the full state error directly, so a state component the measurement barely observes can carry a badly wrong covariance that NEES catches and NIS, built from what the sensor can actually see, does not.

## Check yourself

::: check
An estimator's RMS attitude error over a test campaign is small and looks excellent. Explain why this alone does not establish that the filter is consistent, and name the specific quantity that would.
:::

::: answer
RMS error measures only the average size of the estimate's deviation from truth; it says nothing about whether the filter's own reported covariance matches that deviation. A filter can be accurate on average while reporting a covariance far smaller than its actual error — overconfident — which is dangerous precisely because everything downstream treats that covariance as trustworthy. Consistency is established by comparing the actual error against the reported covariance directly: NEES, $\mathbf e_k^{\mathsf T}(\mathbf P_k^+)^{-1}\mathbf e_k$, checked against a chi-square band, or NIS where truth is unavailable.
:::

::: check
Why does this lesson treat the deliberately overconfident filter run — process noise cut a hundredfold — as necessary evidence to include, rather than a mistake to fix before reporting results?
:::

::: answer
A consistency test that has only ever been run on a filter already believed to be healthy provides no evidence that the test itself is capable of detecting a real inconsistency — a test with no statistical power would also "pass" a good filter, indistinguishably from a real one. Deliberately injecting a known fault and showing the test catches it, by the expected mechanism and to a degree consistent with the size of the fault, is direct evidence the test has teeth; the result (mean NEES over sixty times the band's ceiling here) makes the healthy filter's clean result meaningfully more credible than it would be alone.
:::

::: check
A colleague suggests skipping NEES in a project's Monte Carlo campaign, since NIS is the version that runs on real flight hardware anyway. What is lost by doing this in a simulation where the true state is available?
:::

::: answer
NIS depends only on the innovation, built from $\mathbf S_k = \mathbf H\mathbf P_k^-\mathbf H^{\mathsf T} + \mathbf R$, which only reflects the part of the state the measurement actually observes well; a state component the measurement is weakly sensitive to — here, potentially the gyro bias, which the star-tracker update only influences indirectly through the coupled dynamics — can carry a badly wrong covariance without disturbing the innovation enough for NIS to catch it. NEES compares the full state error against the full covariance directly and does not have this blind spot. Skipping NEES in simulation, where truth costs nothing extra to compare against, trades a strictly stronger test for a strictly weaker one to save an experiment that is already available.
:::

::: check
Using the acceptance-band formula $\big[\chi^2_{rn}(0.025)/r,\ \chi^2_{rn}(0.975)/r\big]$, explain qualitatively why a NEES band computed from $r=50$ runs is wider than the $[5.614,\,6.398]$ band this lesson computed from $r=300$ runs at the same $n=6$, and what that implies about a filter that a 50-run campaign passed.
:::

::: answer
The band brackets the average of $r$ independent chi-square draws, and averaging more draws concentrates the average more tightly around its expected value $n$ — the same reason a larger sample narrows a confidence interval generally. With fewer runs the band widens around $6$, so a $50$-run campaign is a less demanding test: a filter whose true average NEES is somewhat above the ideal value of $6$ might still fall inside a wide $50$-run band while the same filter would fail a properly narrow $300$-run band computed on more data. Passing a small-sample consistency campaign is weaker evidence of true consistency than passing the same test run on more independent trials, so the sample size used belongs in the write-up alongside the verdict itself.
:::

::: check
A project's write-up says: "The filter is consistent; NEES and NIS were checked." What three specific things does this lesson say should be added for the claim to be defensible?
:::

::: answer
The actual numbers against the actual band — mean NEES and NIS with the chi-square band they were checked against, not only a pass/fail verdict; the number of independent Monte Carlo runs the band was computed from, since the band's width depends on it; and a statement of whether the test was shown to have power to catch a real fault, ideally with a deliberately injected inconsistency and its detected magnitude, as this lesson's overconfident-filter example demonstrated. "Checked" without the numbers, the sample size, and evidence the test can actually fail is a claim a skeptical reviewer has no way to evaluate.
:::

## Summary

| Item | Statement |
| --- | --- |
| NEES | $\mathbf e_k^{\mathsf T}(\mathbf P_k^+)^{-1}\mathbf e_k \sim \chi^2_n$; needs truth, simulation only |
| NIS | $\boldsymbol\nu_k^{\mathsf T}\mathbf S_k^{-1}\boldsymbol\nu_k \sim \chi^2_m$; needs only the innovation, runs on real data |
| This lesson's bands | NEES $[5.614,6.398]$ ($n=6$), NIS $[2.729,3.283]$ ($m=3$), both at $r=300$ |
| Nominal filter | Mean NEES $6.067$, mean NIS $2.984$ — both inside band, in-band at $\sim$95–97% of steps |
| Deliberately overconfident filter ($Q\times0.01$) | Mean NEES $404.9$ ($63\times$ the ceiling), mean NIS $32.3$ — both outside at every step |
| Verified vs validated | This exercise verifies covariance-to-error consistency in simulation; validating the noise model against real hardware is a separate, later step |

The next lesson turns from an estimator's uncertainty to a different correctness question again: fitting an orbit to data with real measurement imperfection, in anchor project D, batch least-squares orbit determination.
