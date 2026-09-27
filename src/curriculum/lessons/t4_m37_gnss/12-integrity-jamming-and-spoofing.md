---
id: l12-integrity-jamming-and-spoofing
title: Integrity, jamming and spoofing
minutes: 21
covers:
  - Jamming and spoofing; RAIM and integrity monitoring
---

Six friends do the same math homework and compare answers. If five agree and one does not, you can guess who slipped. With only two friends who disagree, you know *something* is wrong but not who. And if one friend secretly changes everyone's paper so that all the answers agree — wrongly — comparing papers will never catch it.

Now two more troublemakers. One stands in the room and blasts a fire alarm, so nobody can hear anyone else. That is annoying, but at least everyone knows something is wrong. The other is a smooth talker who whispers false answers to everyone in exactly the right voice. Nobody notices a thing.

Those three pictures are this lesson. Every lesson so far has trusted the satellites: a clock off by a modeled, small amount, an orbit off by a meter or so, and the rest noise of known size. **Integrity** is the question left once you stop assuming that trust: how sure can you be that the fix is not badly wrong, and will you be warned in time if it is? This lesson works out what a receiver can catch by checking its own measurements against each other (**RAIM**), how a **jammer** drowns the signal, and how a **spoofer** fakes it. The honest answers, worked through with real numbers, are not always comforting.

## Integrity: more than accuracy

Accuracy asks how big the error *usually* is. **[[Integrity|integrity]]** asks something harder: what is the chance of a large error that nobody notices? A receiver guiding an airplane onto a runway, or a rocket back to a landing pad, can live with a slightly worse fix. It cannot live with a badly wrong fix that it reports as fine.

The things that cause such errors are **faults**: a satellite clock that jumps, bad orbit data in the navigation message, a signal bouncing off a building, or a deliberate attack. A fault is not ordinary noise. It is a bias, often steady, on one or more measurements.

## RAIM: using spare satellites as a check

The navigation-solution lesson defined the **residual** $r_i$: measured pseudorange minus the pseudorange the solved position and clock predict. With exactly four satellites and four unknowns, the fit can always make every residual zero, whatever the data say. There is nothing to compare, so there is no check at all.

With $n$ satellites and $p = 4$ unknowns, there are $n - p$ spare measurements. These spares are the fit's **[[degrees of freedom|degrees-of-freedom]]**, the number of independent ways the data can disagree with the model. That is where a check can live.

Square each residual and add them up. This is the **sum of squared errors**:

$$
\mathrm{SSE} = \sum_i r_i^2.
$$

When nothing is wrong and the noise on each pseudorange is independent, bell-curve (Gaussian) noise of standard deviation $\sigma$, the number $\mathrm{SSE}/\sigma^2$ follows a known pattern, the **[[chi-square distribution|chi-square]]** with $n - p$ degrees of freedom. Write that $\chi^2_{n-p}$ ("chi-square with n minus p"). The navigation-solution lesson checked this by running thousands of noisy fits.

So you know how big $\mathrm{SSE}$ usually is when all is well. **Receiver autonomous integrity monitoring (RAIM)** picks a threshold that a healthy $\mathrm{SSE}$ crosses only rarely — with a chosen **false-alarm probability** $P_{fa}$ — and raises an alarm when it is crossed:

$$
\text{flag a fault if } \mathrm{SSE} > \sigma^2\,\chi^2_{n-p}(1-P_{fa}).
$$

Here $\chi^2_{n-p}(1-P_{fa})$ is the value that a chi-square number with $n-p$ degrees of freedom stays below with probability $1-P_{fa}$. Tables and software give it; in Python it is `scipy.stats.chi2.ppf(1 - P_fa, n - p)`.

::: example Setting a RAIM threshold
Six satellites, pseudorange noise $\sigma = 3\,\mathrm{m}$, and a false alarm allowed once in a hundred thousand fixes, $P_{fa} = 10^{-5}$.

**Step 1: degrees of freedom.** $n - p = 6 - 4 = 2$.

**Step 2: the chi-square value.** For two degrees of freedom, the value exceeded with probability $10^{-5}$ is $23.026$. (For two degrees of freedom there is a neat formula, $-2\ln P_{fa}$, which gives the same $23.026$.)

**Step 3: scale by the noise.** Multiply by $\sigma^2 = 9\,\mathrm{m}^2$:

$$
9 \times 23.026 = 207.2\,\mathrm{m}^2.
$$

**Sanity check.** A healthy fit's $\mathrm{SSE}$ averages $\sigma^2(n-p) = 18\,\mathrm{m}^2$. The threshold sits more than ten times higher, as it must if false alarms are to be that rare. The price is that a small fault can hide below it.
:::

### Five to detect, six to isolate

How many satellites does RAIM need?

- **Four satellites:** zero degrees of freedom. The residuals are always zero, so there is no test.
- **Five satellites:** one degree of freedom. That is enough to *detect* that something is wrong, but not which satellite is to blame — like two friends who disagree.
- **Six satellites:** two degrees of freedom. Now you can also *isolate* the fault. Redo the fit five-satellites-at-a-time, leaving each one out in turn. The version whose $\mathrm{SSE}$ drops back under its threshold is the one that left out the culprit.

::: key
RAIM — receiver autonomous integrity monitoring: use redundant satellites to test the residual against a chi-square threshold. Five satellites detect a fault; six isolate it. It is a consistency test, exactly like **[[NIS|nis]]** in a Kalman filter.
:::

## The slope: a dangerous fault can be a quiet one

Here is the surprise. The same size of fault can do very different damage on different satellites, *and* be very different in how easy it is to see. To measure both, go back to the least-squares machinery.

The navigation-solution lesson wrote the small correction to position and clock as $\hat{\boldsymbol\delta} = \mathbf{A}\,\Delta\boldsymbol\rho$, with

$$
\mathbf{A} = (\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T},
$$

where $\mathbf{G}$ is the geometry matrix and $\Delta\boldsymbol\rho$ is the list of pseudorange changes. The residuals are what the fit cannot explain: $\mathbf{r} = \mathbf{P}\,\Delta\boldsymbol\rho$, with $\mathbf{P} = \mathbf{I} - \mathbf{G}\mathbf{A}$. $\mathbf{P}$ is a **[[projector|projector]]**: it keeps only the part of the data that no position-and-clock change could produce.

Now put a bias $b$ on satellite $i$ alone. Its effect on the estimate is $b$ times column $i$ of $\mathbf{A}$, and the top three entries of that column, written $\mathbf{A}_{\mathrm{pos},:,i}$, give the position error. Its effect on the residual energy $\mathbf{r}^{\mathsf T}\mathbf{r}$ is $b^2 P_{ii}$, where $P_{ii}$ is the $i$-th diagonal entry of $\mathbf{P}$. The ratio of "how far the position moves" to "how much the test sees" is the **slope**:

$$
\mathrm{slope}_i = \frac{\|\mathbf{A}_{\mathrm{pos},:,i}\|}{\sqrt{P_{ii}}}.
$$

A satellite with a big slope is dangerous *because* it is hard to catch. A bias on it buys a lot of position error for very little residual. Compute it for the six-satellite geometry used throughout this module:

```python
import numpy as np

x_true = np.array([914936.61, -5526684.03, 3049186.55])   # receiver, ECEF, meters
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
A = np.linalg.inv(G.T @ G) @ G.T      # least-squares solution matrix
P = np.eye(6) - G @ A                  # residual projector
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

Satellite $1$ has the highest slope, $6.672$. Satellite $2$ has the lowest, $0.571$. That is nearly a twelvefold spread from the same six measurements, decided by geometry alone. Look at why: satellite $1$'s $P_{ii}$ is tiny, $0.0388$. Almost all of a bias on it is soaked up by moving the position, and almost none is left over in the residual for the test to see.

::: note Why the residual energy is b squared times P sub ii
A bias on satellite $i$ alone is $\Delta\boldsymbol\rho = b\,\mathbf{u}_i$, where $\mathbf{u}_i$ is a list of zeros with a $1$ in place $i$. The residual is $\mathbf{r} = b\,\mathbf{P}\mathbf{u}_i$, and its energy is $\mathbf{r}^{\mathsf T}\mathbf{r} = b^2\,\mathbf{u}_i^{\mathsf T}\mathbf{P}^{\mathsf T}\mathbf{P}\,\mathbf{u}_i$. A projector is symmetric ($\mathbf{P}^{\mathsf T} = \mathbf{P}$), and projecting twice is the same as projecting once ($\mathbf{P}\mathbf{P} = \mathbf{P}$), so $\mathbf{P}^{\mathsf T}\mathbf{P} = \mathbf{P}$. That leaves $b^2\,\mathbf{u}_i^{\mathsf T}\mathbf{P}\,\mathbf{u}_i$, and picking out row $i$ and column $i$ of $\mathbf{P}$ gives $b^2 P_{ii}$.
:::

::: example The fault that hides, and the fault that does not
Put the same $20\,\mathrm{m}$ bias — a plausible size for an uncorrected clock or orbit fault — first on satellite $1$, then on satellite $2$. Keep $\sigma = 3\,\mathrm{m}$ noise and the $207.2\,\mathrm{m}^2$ threshold from the first example. Solve the full nonlinear fit twenty thousand times with fresh noise each time, and count. This continues the code above:

```python
def solve(pr, x=np.zeros(3), b=0.0):
    for _ in range(10):                                   # Newton iteration, as in the fix lesson
        Gk = geometry_matrix(sats, x)
        d = np.linalg.lstsq(Gk, pr - np.linalg.norm(sats - x, axis=1) - b, rcond=None)[0]
        x, b = x + d[:3], b + d[3]
    return x, pr - np.linalg.norm(sats - x, axis=1) - b


rng = np.random.default_rng(0)
true_range = np.linalg.norm(sats - x_true, axis=1)
threshold = 3.0**2 * 23.026                               # sigma^2 times chi-square(2 dof, 1 - 1e-5)
for faulty in (None, 1, 2):
    err, hits = [], 0
    for _ in range(20000):
        pr = true_range + 3.0 * rng.standard_normal(6)
        if faulty is not None:
            pr[faulty] += 20.0
        x, r = solve(pr)
        err.append(np.linalg.norm(x - x_true))
        hits += r @ r > threshold
    print(faulty, round(np.mean(err), 2), round(100 * hits / 20000, 2))
# None 6.2 0.0
# 1 26.64 0.05
# 2 10.44 57.09
```

| | No fault | $+20\,\mathrm{m}$ on satellite $1$ (slope $6.67$) | $+20\,\mathrm{m}$ on satellite $2$ (slope $0.57$) |
| --- | --- | --- | --- |
| Mean position error | $6.2\,\mathrm{m}$ | $26.6\,\mathrm{m}$ | $10.4\,\mathrm{m}$ |
| RAIM alarms | $0\%$ | $0.05\%$ | $57\%$ |

**Reading the table.** The fault on the high-slope satellite more than quadruples the position error, and RAIM catches it about once in two thousand tries. The identical fault on the low-slope satellite does less than half as much damage and is caught more than half the time.

**Sanity check.** The column of $\mathbf{A}$ predicts a position shift of $1.3145 \times 20 \approx 26.3\,\mathrm{m}$ for satellite $1$, close to the $26.6\,\mathrm{m}$ measured (noise adds a little). So how dangerous a fault is and how visible it is can point in opposite directions. The high-slope case is the one to worry about.
:::

::: key
$\mathrm{slope}_i = \|\mathbf{A}_{\mathrm{pos},:,i}\|/\sqrt{P_{ii}}$: position error per unit of test-statistic growth. High-slope satellites make large position errors while barely moving the residual — the geometry, not the size of the fault, decides whether RAIM can see it.
:::

## The spoof RAIM can never see

The slope describes an *accidental* fault on one satellite. A deliberate attacker who controls every signal can do better. It can make a fault with no residual at all.

Here is the idea in words. The residual only sees the part of the data that *no real position change could explain*. So fake a real position change. Move every pseudorange by exactly what it would move if the receiver were really $200\,\mathrm{m}$ east. The fit will happily explain the whole change as "the receiver moved", and nothing is left over to raise an alarm.

In symbols: a real change $\boldsymbol\delta$ in position and clock changes the pseudoranges by $\mathbf{G}\boldsymbol\delta$. A spoofer applies exactly that bias, $\Delta\boldsymbol\rho = \mathbf{G}\boldsymbol\delta$. The residual changes by $\mathbf{P}\mathbf{G}\boldsymbol\delta$, and $\mathbf{P}\mathbf{G} = \mathbf{0}$ for *every* geometry. This continues the slope code:

```python
fake_shift = np.array([200.0, 0.0, 0.0, 0.0])    # spoofer's target: 200 m along x, same clock
spoof_bias = G @ fake_shift                        # exactly what a real 200 m move would do
print(np.round(np.abs(P @ spoof_bias), 10))
# [0. 0. 0. 0. 0. 0.]
```

The solution moves by exactly the $200\,\mathrm{m}$ the spoofer wanted. The residual is unchanged, down to the last rounding of the computer's arithmetic. No threshold, however tight, catches this, because there is nothing in the residual to catch. Any check built only from the measurements is blind to a fault that looks exactly like a real position. That is a hard limit of residual-based integrity, not a weakness of one design.

::: note Why P times G is zero for any geometry
Write it out: $\mathbf{P}\mathbf{G} = \mathbf{G} - \mathbf{G}(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T}\mathbf{G}$. The last three factors are a matrix times its own inverse, $(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}(\mathbf{G}^{\mathsf T}\mathbf{G}) = \mathbf{I}$, so the second term is $\mathbf{G}\mathbf{I} = \mathbf{G}$. That leaves $\mathbf{G} - \mathbf{G} = \mathbf{0}$. Nothing in the argument used particular numbers, so it holds for every $\mathbf{G}$ and every $\boldsymbol\delta$.
:::

::: warning "The residual passed" does not mean "the fix is right"
A residual test can only catch faults that leave a mark outside what a real position change can produce. That covers most honest equipment failures. By construction, it says nothing about a fault made to look like a valid position. Real defenses against a skilled spoofer come from *outside* the pseudorange residuals: watching the received power and the receiver's **[[automatic gain control|agc]]** for levels no real constellation would produce, checking the **[[angle of arrival|angle-of-arrival]]** of each signal against where that satellite really is, and cross-checking against an independent source such as the inertial navigation system, which a spoofer working through the antenna cannot touch.
:::

## Jamming: drowning the signal

A jammer does not try to be clever. It transmits noise on the GNSS frequencies until the receiver cannot track anything. At least that announces itself: the receiver loses lock instead of quietly reporting a wrong position.

How much power does that take? The constellation lesson's link budget gives the numbers. Open-sky C/A power at the antenna is about $C = -158.5\,\mathrm{dBW}$. The receiver's bandwidth is about $B_r = 2.046\,\mathrm{MHz}$. And a typical receiver can keep tracking down to a carrier-to-noise density of about $C/N_{0,\min} = 25\,\mathrm{dB\text{-}Hz}$. A jammer spreads its power $J$ across the bandwidth, adding a noise density $J/B_r$. Tracking fails once $C/(J/B_r)$ drops below $C/N_{0,\min}$. In decibels, where multiplying becomes adding, the jammer power needed at the antenna is

$$
J_{\mathrm{rx}} = C - C/N_{0,\min} + 10\log_{10}(B_r),
$$

$$
-158.5 - 25 + 63.1 = -120.4\,\mathrm{dBW}.
$$

That is about a millionth of a millionth of a watt at the antenna.

::: example How little power it takes to deny a fix
Turn that into the power a jammer must transmit from a distance $d$ away, using the same **free-space path loss** the constellation lesson used for the satellite link, $L = 20\log_{10}(4\pi d/\lambda)$. The transmitter must supply $J_{\mathrm{rx}} + L$:

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
# 1000.0 96.4 3.985
# 5000.0 110.4 99.629
# 20000.0 122.4 1594.071
```

The last column is milliwatts. **About $4\,\mathrm{mW}$** denies tracking a kilometer away. **About a tenth of a watt** does it at $5\,\mathrm{km}$, and **under $2\,\mathrm{W}$** at $20\,\mathrm{km}$.

**Sanity check.** A phone transmits up to a couple of watts. So a battery-powered gadget can blank GPS over a whole town. That is why illegal **[[GPS jammers|jammer-incidents]]** are cheap, small, and far too effective.
:::

There is no clever combination, like the ionosphere-free one, that cancels a jammer. A receiver survives only with better antennas that turn away from the jammer's direction, more interference-rejecting processing, or another navigation source to carry it through. The launch-vehicle lesson's coasting and reacquisition apply unchanged, whether the lock was lost to a plume, a maneuver or a jammer.

## Jamming and spoofing side by side

Both attacks put unwanted energy into the receiver's antenna. They differ in aim and in how visible they are.

A jammer wants to deny the signal, and the receiver knows the moment it loses lock. A spoofer wants to feed a **consistent but false** signal. It may generate fake satellite signals strong enough to capture the tracking loops. Or, in the simplest form, called **[[meaconing|meaconing]]**, it records real signals and replays them with a delay. Either way, the receiver's ordinary health checks see a solid fix, small residuals, and a wrong position.

That difference is why spoofing detection has to use evidence the residual cannot see: power levels or signal shapes no real satellite would produce, signals arriving from the wrong directions, and a position that moves in ways the vehicle's own inertial sensors say it did not.

::: key
Jamming versus spoofing: jamming raises the noise floor and you lose lock, which is obvious. Spoofing feeds a consistent but false solution, which is not — detect it with signal-power monitoring, angle-of-arrival checks, and cross-checks against the inertial solution.
:::

## Check yourself

::: check
A fit uses seven satellites and four unknowns, with pseudorange noise $\sigma = 2.5\,\mathrm{m}$ and a target false-alarm probability of $10^{-4}$. How many degrees of freedom does the RAIM test have? The chi-square value for that many degrees of freedom at $1 - 10^{-4}$ is $21.11$. What is the SSE threshold?
:::

::: answer
Degrees of freedom: $n - p = 7 - 4 = 3$. Threshold: $\sigma^2$ times the chi-square value, $2.5^2\times21.11 = 131.9\,\mathrm{m}^2$. With three spare measurements, this fit can detect a fault and also isolate it.
:::

::: check
Two satellites have position sensitivity and residual sensitivity $(\|\mathbf{A}_{\mathrm{pos}}\|, P_{ii})$ of $(0.9,\ 0.15)$ and $(0.3,\ 0.6)$. Find both slopes. Which fault is more dangerous to miss?
:::

::: answer
First: $0.9/\sqrt{0.15} = 2.324$. Second: $0.3/\sqrt{0.6} = 0.387$. The first slope is about six times the second. The same bias on the first satellite moves the position about six times as much for each unit of growth in the test statistic, so a fixed threshold is least able to catch it before real damage is done. The first is the dangerous one.
:::

::: check
Show that a bias of the form $\mathbf{G}\boldsymbol\delta$ leaves the least-squares residual unchanged, for any geometry $\mathbf{G}$ and any $\boldsymbol\delta$.
:::

::: answer
The residual changes by $\mathbf{P}\mathbf{G}\boldsymbol\delta$ with $\mathbf{P} = \mathbf{I} - \mathbf{G}(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}\mathbf{G}^{\mathsf T}$. Multiply out: $\mathbf{P}\mathbf{G}\boldsymbol\delta = [\mathbf{G} - \mathbf{G}(\mathbf{G}^{\mathsf T}\mathbf{G})^{-1}(\mathbf{G}^{\mathsf T}\mathbf{G})]\boldsymbol\delta = [\mathbf{G} - \mathbf{G}]\boldsymbol\delta = \mathbf{0}$, because a matrix times its inverse is $\mathbf{I}$. No particular numbers were used, so it holds for every geometry and every shift. More satellites or a tighter threshold cannot get around it.
:::

::: check
A jammer must deny tracking from $2\,\mathrm{km}$ away, against the lesson's receiver ($-120.4\,\mathrm{dBW}$ needed at the antenna). What transmit power does it need?
:::

::: answer
Path loss: $L = 20\log_{10}(4\pi\times2000/0.1903) = 102.4\,\mathrm{dB}$. Transmit power: $-120.4 + 102.4 = -18.0\,\mathrm{dBW}$. Converting, $10^{-1.8}\,\mathrm{W}$ is about $0.016\,\mathrm{W}$, or $16\,\mathrm{mW}$ — a tiny, easily carried amount of power.
:::

::: check
Why does a receiver hit by a jammer know something is wrong, while one fed a skilled spoof usually does not?
:::

::: answer
A jammer raises the noise until the correlation peaks the tracking loops depend on disappear. The receiver's own carrier-to-noise readings drop and its loss-of-lock flags go up, so the problem reports itself. A skilled spoofer supplies a strong, self-consistent signal that the loops lock onto normally. If its biases have the form $\mathbf{G}\boldsymbol\delta$, the residual looks exactly like a genuine fix's. Every ordinary health check is built from the same pseudoranges the spoofer controls, so none of them has anything to disagree with. Only outside evidence — power, direction, inertial cross-checks — can catch it.
:::

## Summary

| Idea | What to remember |
| --- | --- |
| RAIM statistic | $\mathrm{SSE}/\sigma^2 \sim \chi^2_{n-p}$ with no fault; alarm when $\mathrm{SSE} > \sigma^2\chi^2_{n-p}(1-P_{fa})$ |
| Detect vs. isolate | $5$ satellites (1 degree of freedom): detect only; $6$ (2 degrees of freedom): isolate by leaving each out in turn |
| Slope | $\mathrm{slope}_i = \|\mathbf{A}_{\mathrm{pos},:,i}\|/\sqrt{P_{ii}}$; high slope means big position error for small residual |
| Worked contrast | same $20\,\mathrm{m}$ bias: slope $6.67$ gives $26.6\,\mathrm{m}$ error, $0.05\%$ caught; slope $0.57$ gives $10.4\,\mathrm{m}$, $57\%$ caught |
| Invisible spoof | a bias $\mathbf{G}\boldsymbol\delta$ gives $\mathbf{P}\mathbf{G}\boldsymbol\delta = \mathbf{0}$ — no residual test can see it |
| Jamming power | $J_{\mathrm{rx}} = C - C/N_{0,\min} + 10\log_{10}(B_r) = -120.4\,\mathrm{dBW}$; milliwatts to a couple of watts at kilometers |
| Beyond the residual | power and AGC monitoring, angle of arrival, cross-check with the inertial solution |

RAIM and its slope are built from the same geometry matrix $\mathbf{G}$ as the navigation solution and DOP. But every row of $\mathbf{G}$ needs a satellite that the receiver's tracking loops have found and held. The last two lessons open those loops up: how they follow code and carrier at all, and how aiding them with inertial sensors answers the spoofing defense, the reacquisition problem and the search-window penalty from the lessons before.

::: context integrity Why airplanes care most
Aviation invented the word's GNSS meaning. An aircraft landing on satellite guidance must get an alarm within a few seconds if its position could be wrong by more than a set limit, and the chance of a missed alarm must be tiny — on the order of one in ten million per approach. A receiver that is usually accurate but occasionally silent about a big error is useless for that job. Launch vehicles and landing boosters borrow the same thinking.
:::

::: context degrees-of-freedom Spare measurements
Four unknowns need four measurements to pin them down, and with exactly four there is no slack: some answer always fits perfectly. Each extra measurement is one **degree of freedom**, one independent chance for the data to disagree with the model. You can only test consistency with room to be inconsistent — which is why a four-satellite fix, however good it looks, carries no integrity check at all.
:::

::: context chi-square The shape of healthy residuals
Add up the squares of $k$ independent bell-curve numbers, each scaled to standard deviation $1$, and the total follows the **chi-square distribution** with $k$ degrees of freedom. Its average is $k$. For $k = 2$ the curve is a plain falling exponential, and by $23$ it has all but vanished: a healthy fit lands past that line only once in a hundred thousand tries.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="40" y1="170" x2="40" y2="40" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="40,50 50,97.2 60,125.9 70,143.2 80,153.8 90,160.1 100,164 110,166.4 120,167.8 130,168.7 140,169.2 150,169.5 160,169.7 170,169.8 180,169.9 200,170 340,170"/>
  <line x1="270.3" y1="70" x2="270.3" y2="170" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="270.3" y="62" font-size="11" fill="#b4232c" text-anchor="middle">threshold 23.03</text>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="40" y="186">0</text><text x="140" y="186">10</text><text x="240" y="186">20</text><text x="340" y="186">30</text>
  </g>
  <text x="190" y="198" font-size="11" fill="#6c7a93" text-anchor="middle">SSE divided by sigma squared, 2 degrees of freedom</text>
  <text x="120" y="90" font-size="11" fill="#1d6fd1">healthy fits land here</text>
</svg>
```
:::

::: context nis The same test in a Kalman filter
In the Kalman filter module, the **normalized innovation squared** (NIS) took each new measurement's surprise, weighed it by how big the filter expected surprises to be, and compared the result with a chi-square threshold. RAIM is the same idea applied to a single least-squares fix: the residuals play the part of the innovation, and $\sigma^2$ plays the part of the expected spread. Both ask one question: is the data more surprising than honest noise should be?
:::

::: context projector Splitting the data in two
Think of the pseudoranges as one arrow in a six-dimensional space. The moves a real position-and-clock change can make form a flat four-dimensional "floor" inside it. The fit drops the arrow straight down onto the floor; the leftover sticking up is the residual. $\mathbf{P}$ keeps only that leftover. A spoof that slides the arrow *along* the floor leaves the leftover exactly as it was.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <polygon points="30,160 250,160 330,110 110,110" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="1.5"/>
  <text x="60" y="176" font-size="11" fill="#1f2a44">what a real position change can do</text>
  <line x1="90" y1="145" x2="200" y2="130" stroke="#1d6fd1" stroke-width="2.5"/>
  <line x1="90" y1="145" x2="200" y2="40" stroke="#1f2a44" stroke-width="2"/>
  <line x1="200" y1="130" x2="200" y2="40" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="150" y="60" font-size="11" fill="#1f2a44" text-anchor="end">measured</text>
  <text x="206" y="90" font-size="11" fill="#b4232c">residual</text>
  <line x1="200" y1="130" x2="280" y2="120" stroke="#f2b880" stroke-width="3"/>
  <line x1="280" y1="120" x2="280" y2="30" stroke="#b4232c" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="286" y="70" font-size="11" fill="#b4232c">same residual</text>
  <text x="252" y="143" font-size="11" fill="#1f2a44">spoof slides along</text>
</svg>
```
:::

::: context agc The receiver's volume knob
A receiver's **automatic gain control** (AGC) turns its amplifier up or down to keep the incoming noise at a steady level. Real GNSS signals sit far below the noise, so they barely move it. A jammer, or a spoofer transmitting stronger than real satellites would ever be, makes the AGC turn the gain down sharply. Watching the AGC is one of the cheapest spoofing and jamming alarms there is.
:::

::: context angle-of-arrival Where the signal comes from
Real satellites are spread across the sky, and the receiver knows from their orbits where each should be. A simple spoofer transmits every fake signal from one antenna, so they all arrive from the same direction. A receiver with two or more antennas can measure the tiny difference in arrival time between them, work out each signal's direction, and notice when "satellites" all over the sky are in fact coming from one point on the horizon.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M 40 140 A 140 120 0 0 1 320 140" fill="none" stroke="#6c7a93" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="20" y1="140" x2="340" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="172" y="132" width="16" height="8" fill="#1f2a44"/>
  <g stroke="#1d6fd1" stroke-width="1.5">
    <line x1="80" y1="70" x2="176" y2="132"/><line x1="180" y1="22" x2="180" y2="132"/><line x1="285" y1="80" x2="184" y2="132"/>
  </g>
  <g fill="#1d6fd1"><circle cx="80" cy="70" r="5"/><circle cx="180" cy="22" r="5"/><circle cx="285" cy="80" r="5"/></g>
  <text x="70" y="58" font-size="11" fill="#1d6fd1" text-anchor="middle">real satellites</text>
  <g stroke="#b4232c" stroke-width="1.5">
    <line x1="330" y1="128" x2="189" y2="134"/><line x1="330" y1="130" x2="189" y2="136"/><line x1="330" y1="132" x2="189" y2="138"/>
  </g>
  <circle cx="332" cy="128" r="5" fill="#b4232c"/>
  <text x="340" y="167" font-size="11" fill="#b4232c" text-anchor="end">spoofer: every signal from one spot</text>
  <text x="180" y="153" font-size="11" fill="#1f2a44" text-anchor="middle">receiver</text>
</svg>
```
:::

::: context jammer-incidents A truck driver and an airport
Illegal "personal privacy devices" are sold to hide vehicles from company trackers. Around 2009 to 2011, a truck driver's jammer, switched on as he drove past Newark airport, kept disrupting a satellite-based landing aid being tested there. Engineers traced the interference to his truck, and in 2013 the U.S. Federal Communications Commission moved to fine him. His gadget was the kind of milliwatt-class device this lesson's example describes.
:::

::: context meaconing Echoes played back
**Meaconing**, an old military word from the days of radio beacons, means recording real signals and rebroadcasting them with a delay. Because the replayed signals are genuine, codes, navigation data and all, they pass every check on signal format. The receiver computes the position and time of the *rebroadcast antenna*, a little late. Newer signals with cryptographic authentication, such as Galileo's OSNMA, stop fake data from being made up, but even they cannot stop a genuine signal from being replayed.
:::
