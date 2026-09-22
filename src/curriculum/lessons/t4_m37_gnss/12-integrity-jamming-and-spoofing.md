---
id: l12-integrity-jamming-and-spoofing
title: Integrity, jamming and spoofing
minutes: 24
covers:
  - Jamming and spoofing; RAIM and integrity monitoring
---

Every lesson in this module so far has trusted the satellites: a clock is wrong by a modelled, bounded amount, an orbit is wrong by a metre or so, and the rest is noise with a known standard deviation. Integrity is what is left to ask once that trust is examined rather than assumed — a satellite whose clock has failed in a way the broadcast polynomial does not know about, a jammer raising the noise floor until nothing can be tracked, or a spoofer feeding a receiver a signal indistinguishable, by any test based on the measurements alone, from the truth. This lesson works out what a receiver can and cannot detect about each, and the honest answer, worked all the way through with real numbers, is not always reassuring.

## RAIM: turning redundancy into a consistency check

The navigation-solution lesson's residual — observed pseudorange minus modelled range — is zero for an exactly determined fit whatever the data contain, and informative only once there is redundancy: $n$ satellites solved for $p=4$ unknowns leave $n-p$ degrees of freedom in which the data can disagree with the model. Under the usual assumption that measurement noise is independent and Gaussian with standard deviation $\sigma$, the sum of squared residuals divided by $\sigma^2$ follows a chi-square distribution with $n-p$ degrees of freedom when nothing is wrong — exactly the residual-energy identity the navigation-solution lesson verified by Monte Carlo. **Receiver autonomous integrity monitoring (RAIM)** is nothing more exotic than comparing that statistic to a threshold set by how often you are willing to raise a false alarm:

$$
\mathrm{SSE} = \sum_i r_i^2, \qquad \text{flag a fault if } \mathrm{SSE} > \sigma^2\,\chi^2_{n-p}(1-P_{fa}).
$$

Four satellites give zero degrees of freedom and no check at all — the exactly-determined trap the navigation-solution lesson already warned about. Five satellites give one degree of freedom, enough to *detect* that something is wrong, but not enough to say which satellite is responsible. Six give two, enough to *isolate* the fault too: refit with each satellite excluded in turn, and the exclusion that brings the statistic back under threshold identifies the culprit. This is the "five to detect, six to isolate" rule stated without proof elsewhere in this module — it is nothing but a statement about how many spare degrees of freedom a chi-square test needs to do each job.

## The slope: why detectability and danger are not the same thing

A single faulty satellite biases one pseudorange by some amount $b$. Write the least-squares position-and-clock estimate as $\hat{\boldsymbol\delta} = \mathbf{A}\,\Delta\boldsymbol\rho$ with $\mathbf{A}=(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T}$, and the residual as $\mathbf{r}=\mathbf{P}\,\Delta\boldsymbol\rho$ with $\mathbf{P}=\mathbf{I}-\mathbf{G}\mathbf{A}$, the projector onto the residual space. A bias $b$ on satellite $i$ alone is $\Delta\boldsymbol\rho = b\,\boldsymbol\delta_i$ ($\boldsymbol\delta_i$ the $i$-th standard basis vector), so it moves the position estimate by $b\,\mathbf{A}_{:,i}$ (the $i$-th column of $\mathbf{A}$) and the residual by $b\,\mathbf{P}_{:,i}$. Because $\mathbf{P}$ is an idempotent projector ($\mathbf{P}^{\mathsf T}\mathbf{P}=\mathbf{P}$), the induced residual energy is $b^2\,P_{ii}$, the diagonal entry alone. The ratio of how much the *position* moves to how much the *test statistic* moves is the **slope**:

$$
\mathrm{slope}_i = \frac{\|\mathbf{A}_{\mathrm{pos},:,i}\|}{\sqrt{P_{ii}}}.
$$

A satellite with a large slope is dangerous precisely because it is hard to catch: its bias buys a lot of position error for very little residual. Compute it for the six-satellite geometry used throughout this module:

```python
import numpy as np

x_true = np.array([914936.61, -5526684.03, 3049186.55])   # the module's six-satellite geometry
sats = np.array([
    [11350562.41, -23441217.26, 5206502.33],
    [15228615.04, -6538895.01, 20754896.68],
    [-11200404.28, -23485162.13, -5332138.78],
    [-8420060.43, -15461050.49, 19886983.18],
    [4231690.58, -19962286.90, 17000985.17],
    [-4355633.71, -22609494.10, -13239064.60],
])


def geometry_matrix(sats, x):
    e = (sats - x) / np.linalg.norm(sats - x, axis=1)[:, None]
    return np.column_stack([-e, np.ones(len(sats))])


G = geometry_matrix(sats, x_true)
A = np.linalg.inv(G.T @ G) @ G.T
P = np.eye(6) - G @ A
for i in range(6):
    pos_sens = np.linalg.norm(A[:3, i])
    slope = pos_sens / np.sqrt(P[i, i])
    print(i, round(pos_sens, 4), round(P[i, i], 4), round(slope, 3))
# 0 1.1429 0.2871 2.133
# 1 1.3145 0.0388 6.672
# 2 0.4162 0.5319 0.571
# 3 0.7997 0.272 1.533
# 4 0.9985 0.5032 1.408
# 5 0.7552 0.367 1.247
```

Satellite $1$ has the highest slope, $6.672$, and satellite $2$ the lowest, $0.571$ — nearly a twelve-fold spread from the same six measurements, purely a function of geometry.

::: example The fault that hides, and the fault that does not
Inject an identical $20\,\mathrm{m}$ bias — a plausible size for an uncorrected clock or ephemeris fault — onto satellite $1$ in one run and satellite $2$ in another, with the same $\sigma=3\,\mathrm{m}$ noise and the same $\chi^2$ threshold ($207.2\,\mathrm{m}^2$ at a false-alarm probability of $10^{-5}$, two degrees of freedom) used throughout, and solve the actual nonlinear fit — not the linear approximation — twenty thousand times with fresh noise for each:

| | No fault | $+20\,\mathrm{m}$ on satellite $1$ (slope $6.67$) | $+20\,\mathrm{m}$ on satellite $2$ (slope $0.57$) |
| --- | --- | --- | --- |
| Mean position error | $6.21\,\mathrm{m}$ | $\mathbf{26.64\,\mathrm{m}}$ | $10.40\,\mathrm{m}$ |
| RAIM detection rate | $0.00\%$ | $\mathbf{0.04\%}$ | $56.29\%$ |

The high-slope satellite's fault more than quadruples the mean position error and is caught essentially never; the low-slope satellite's identical fault causes barely more than half the damage and is caught more than half the time. Detectability and danger are not correlated — they can run in exactly opposite directions — and a fault on a high-slope satellite is the case worth losing sleep over, not the case a naive reading of "RAIM protects you" would suggest.
:::

::: key
$\mathrm{slope}_i = \|\mathbf{A}_{\mathrm{pos},:,i}\|/\sqrt{P_{ii}}$: position-error sensitivity per unit of residual-energy sensitivity. High-slope satellites produce large position error for small residual growth — the geometry, not the size of the fault, decides whether RAIM can see it. Five satellites detect a fault (one degree of freedom); six isolate it, by leave-one-out exclusion (two degrees of freedom).
:::

## Spoofing's sharpest form: a fault RAIM cannot see even in principle

The slope framework describes an *accidental* single-satellite fault, more or less hard to catch depending on geometry. A deliberate, coordinated spoofer can do better than exploit a large slope — it can engineer a fault with no residual signature at all. $\mathbf{P}$ is the projector onto the space orthogonal to $\mathbf{G}$'s columns, so $\mathbf{P}\mathbf{G}=\mathbf{0}$ identically, for *any* geometry. If a spoofer crafts a coordinated bias across every satellite of the form $\Delta\boldsymbol\rho = \mathbf{G}\,\boldsymbol\delta$ — exactly the pseudorange perturbation a real position-and-clock shift $\boldsymbol\delta$ would produce — the residual moves by $\mathbf{P}\mathbf{G}\boldsymbol\delta = \mathbf{0}$, exactly, with no approximation.

```python
fake_shift = np.array([200.0, 0.0, 0.0, 0.0])    # spoofer's target: 200 m east, same clock
spoof_bias = G @ fake_shift                        # exactly what a real 200 m shift would do
print(np.round(np.abs(P @ spoof_bias), 10))
# [0. 0. 0. 0. 0. 0.]
```

Feed those exact biases into the receiver, and the least-squares solution shifts by exactly the $200\,\mathrm{m}$ the spoofer intended, with a residual indistinguishable — down past the $10^{-13}\,\mathrm{m}$ floor of the arithmetic — from a completely genuine fix. No threshold, no matter how sensitive, catches this, because there is nothing in the residual to catch: any consistency check built purely from the measurements is blind to a fault that lives entirely in the column space those same measurements span. This is the honest, information-theoretic limit of residual-based integrity monitoring, and it is why a serious spoofing defence never relies on RAIM alone.

::: warning
Do not treat "the residual passed" as "the fix is correct." A residual test can only ever rule out faults that leave a footprint in the space orthogonal to $\mathbf{G}$'s columns — which covers most honest sensor failures, but by construction says nothing about a fault engineered to look exactly like a valid position. Real defences against a competent spoof come from *outside* the pseudorange residuals entirely: monitoring received signal power and automatic-gain-control behaviour for anomalies a genuine constellation would not produce, checking angle of arrival against known satellite directions with more than one antenna, and cross-checking the GNSS solution against an independent source — the inertial solution the inertial navigation module builds, which a spoofer influencing only the RF environment cannot touch.
:::

## Jamming: denying the signal outright

Jamming does not try to be subtle — it raises the noise floor until the receiver cannot track anything, an outcome that at least announces itself as a loss of lock rather than a silently wrong fix. The signal-structure lesson's link budget gives the numbers directly: open-sky C/A power is about $-158.5\,\mathrm{dBW}$, the receiver bandwidth is about $2.046\,\mathrm{MHz}$, and a representative minimum tracking threshold is $C/N_0\approx25\,\mathrm{dB\text{-}Hz}$. A jammer denies tracking once its power, spread across that bandwidth, exceeds

$$
J_{\mathrm{rx}} = C - C/N_{0,\min} + 10\log_{10}(B_r) = -158.5-25+63.1 = -120.4\,\mathrm{dBW}
$$

at the receive antenna — a small fraction of a nanowatt.

::: example How little power it takes to deny a fix
Convert that antenna-level threshold to a transmitter power at a given standoff distance, using the same free-space path loss the signal-structure lesson's satellite link budget used:

```python
import numpy as np

C_dBW, Br, CN0_min = -158.5, 2.046e6, 25.0
J_rx_dBW = C_dBW - CN0_min + 10 * np.log10(Br)    # jammer power needed at the rx antenna
print(round(J_rx_dBW, 1))
# -120.4

for d in (1000.0, 5000.0, 20000.0):
    L = 20 * np.log10(4 * np.pi * d / 0.1903)
    P_tx_dBW = J_rx_dBW + L
    print(d, round(L, 1), round(10**(P_tx_dBW / 10) * 1000, 3))
# 1000.0  96.4   3.985
# 5000.0  110.4  99.629
# 20000.0 122.4  1594.071
```

Four milliwatts denies tracking at a kilometre, a tenth of a watt at five kilometres, under two watts at twenty — power levels well inside what a handheld, battery-powered device can produce, which is exactly why illegal GNSS jammers are cheap, small, and depressingly effective.
:::

There is no equivalent to ambiguity resolution or an ionosphere-free combination that fixes this: a receiver either has enough antenna gain, enough interference-rejection processing, or enough of an alternative navigation source to survive the outage, and the outage-reacquisition machinery the launch-vehicle lesson worked out applies exactly the same whether the lost lock came from a plume, a manoeuvre, or a jammer.

## Spoofing versus jamming, in practice

Jamming and spoofing share a mechanism — both add unwanted energy at the receiver's front end — and differ entirely in intent and detectability. A jammer is trying to deny a signal, and a receiver that loses lock knows immediately that something is wrong. A spoofer is trying to feed a *consistent, false* signal, strong enough to capture the tracking loops (or replayed and delayed to arrive as if from real satellites, the simplest form, called meaconing) without ever telling the receiver's ordinary health checks that anything is amiss — a receiver still reports a solid fix, solid residuals, and a wrong position. That asymmetry is why spoofing detection depends on evidence a residual check cannot see at all: monitoring for power levels or spectral shapes no genuine satellite would produce, watching for signals arriving from directions inconsistent with a real constellation, and comparing the GNSS solution's own reported motion against independent sensors that the spoofer, working purely through the antenna, has no way to influence.

## Check yourself

::: check
Seven satellites are used in a fit with four unknowns, pseudorange noise $\sigma=2.5\,\mathrm{m}$, and a target false-alarm probability of $10^{-4}$. How many degrees of freedom does the RAIM test have, and what is the resulting sum-of-squared-residuals threshold?
:::

::: answer
Degrees of freedom $=n-p=7-4=3$. The threshold is $\sigma^2\chi^2_3(1-10^{-4}) = 2.5^2\times21.11 = 131.9\,\mathrm{m}^2$.
:::

::: check
Two candidate faulty satellites have position-error sensitivities and residual sensitivities of $(\|\mathbf{A}_{\mathrm{pos}}\|, P_{ii}) = (0.9, 0.15)$ and $(0.3, 0.6)$. Compute both slopes and say which fault is more dangerous to miss.
:::

::: answer
$\mathrm{slope}_1 = 0.9/\sqrt{0.15}=2.324$; $\mathrm{slope}_2=0.3/\sqrt{0.6}=0.387$. The first satellite has roughly six times the slope: the same size of bias produces about six times as much position error per unit of residual growth, making it the one a fixed detection threshold is least able to catch before real damage is done.
:::

::: check
Show algebraically why a bias vector of the form $\mathbf{G}\boldsymbol\delta$ produces exactly zero change in the least-squares residual, for any geometry $\mathbf{G}$ and any $\boldsymbol\delta$.
:::

::: answer
The residual projector is $\mathbf{P}=\mathbf{I}-\mathbf{G}(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T}$. Applying it to $\mathbf{G}\boldsymbol\delta$: $\mathbf{P}\mathbf{G}\boldsymbol\delta = \big[\mathbf{G}-\mathbf{G}(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T}\mathbf{G}\big]\boldsymbol\delta = \big[\mathbf{G}-\mathbf{G}(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}(\mathbf{G}^{\mathsf T}\mathbf{G})\big]\boldsymbol\delta = [\mathbf{G}-\mathbf{G}]\boldsymbol\delta = \mathbf{0}$, using $(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}(\mathbf{G}^{\mathsf T}\mathbf{G})=\mathbf{I}$. This holds for every $\mathbf{G}$ and every $\boldsymbol\delta$, not only for a particular geometry or bias size — it is a structural fact about least squares, not a property that better redundancy or a tighter threshold can work around.
:::

::: check
A jammer needs to deny tracking at $2\,\mathrm{km}$ standoff, against the same receiver budget used in the lesson ($-120.4\,\mathrm{dBW}$ required at the antenna). What transmit power is required?
:::

::: answer
Path loss at $2\,\mathrm{km}$: $L=20\log_{10}(4\pi\times2000/0.1903)=102.4\,\mathrm{dB}$. Required transmit power: $-120.4+102.4=-18.0\,\mathrm{dBW}=15.9\,\mathrm{mW}$ — again, a trivially small, easily portable amount of power.
:::

::: check
Why does a receiver that has recently lost lock to a jammer know something is wrong, while a receiver being fed a competent spoof typically does not?
:::

::: answer
Jamming raises the noise floor until the correlator peaks a tracking loop depends on disappear outright, so the receiver's own carrier-to-noise measurements and loss-of-lock indicators report the problem directly — there is no signal to hide behind. A competent spoofer supplies a strong, internally consistent signal that the tracking loops lock onto normally and that, if crafted as a coordinated bias in the column space of the geometry matrix, produces a residual identical to a genuine fix; every ordinary receiver health check, built from the same pseudoranges the spoof controls, has nothing to disagree with.
:::

## Summary

| Item | Statement |
| --- | --- |
| RAIM statistic | $\mathrm{SSE}/\sigma^2 \sim \chi^2_{n-p}$ under no fault; flag if $\mathrm{SSE}$ exceeds the threshold set by the target false-alarm probability |
| Detect vs. isolate | $5$ satellites (1 dof): detect only; $6$ satellites (2 dof): isolate by leave-one-out exclusion |
| Slope | $\mathrm{slope}_i = \|\mathbf{A}_{\mathrm{pos},:,i}\|/\sqrt{P_{ii}}$; high slope means large position error for small residual growth |
| Worked contrast | Same $20\,\mathrm{m}$ bias: slope-$6.67$ satellite $\to26.6\,\mathrm{m}$ error, $0.04\%$ detected; slope-$0.57$ satellite $\to10.4\,\mathrm{m}$ error, $56\%$ detected |
| Spoofing's sharp form | Bias $\mathbf{G}\boldsymbol\delta$ (any $\boldsymbol\delta$) gives $\mathbf{P}(\mathbf{G}\boldsymbol\delta)=\mathbf{0}$ exactly — structurally invisible to any residual-based test |
| Jamming power | $J_{\mathrm{rx}}=C-C/N_{0,\min}+10\log_{10}(B_r)$; milliwatts to a couple of watts at kilometre-scale standoff |
| Beyond the residual | Power/AGC monitoring, angle of arrival, cross-check against an independent sensor (inertial navigation module) |

RAIM and its slope are properties of the geometry matrix $\mathbf{G}$, exactly the same object the navigation-solution and dilution-of-precision lessons built — and $\mathbf{G}$'s rows are unit line-of-sight vectors that a receiver's tracking loops have to actually acquire and hold before any of this machinery has data to work with. The final two lessons return to those loops directly: how they track code and carrier at all, and how aiding them with an independent sensor closes the loop this lesson's spoofing defence, the launch-vehicle lesson's reacquisition problem, and the space-based lesson's search-window penalty all pointed toward.
