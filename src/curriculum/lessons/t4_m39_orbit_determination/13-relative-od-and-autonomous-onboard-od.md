---
id: l13-relative-od-and-autonomous-onboard-od
title: Relative orbit determination and autonomous onboard OD
minutes: 23
covers:
  - "Relative orbit determination for constellations; autonomous onboard orbit determination"
---

Two friends go hiking with copies of the same old paper map. The map was printed slightly wrong: everything on it sits $200\,\mathrm m$ east of where it really is. Each friend marks her position from the map, and each mark is $200\,\mathrm m$ off. But ask them how far apart they are, and the map's mistake vanishes. Both marks moved the same way, by the same amount, so the gap between the marks is exactly the real gap. Each friend knows her own position badly, and the distance between them perfectly.

Every estimator in this module has so far treated one object at a time: one epoch state, one covariance, tracked from the ground. This closing lesson looks at two situations that break that pattern. The first is the hiking map. A **[[constellation|constellation]]** or a formation of spacecraft often cares less about where each member is than about where each one is *relative to its neighbors*, and that relative state can be known far better than either member's absolute state. The second is a spacecraft that has to know its own orbit without waiting for a ground team — in deep space, or when things change faster than a ground loop can keep up. Then orbit determination runs **onboard**, with its own limits.

Neither needs a new estimator. Both reuse the whole module.

## Why relative accuracy can beat absolute accuracy

### Errors that move together

Two satellites tracked by the same ground station share more than a view of the sky. They share whatever systematic error that station's data carries: a range bias, a mismodeled delay through the lower atmosphere, a station location that is slightly off. Each of these pulls *both* satellites' fits in nearly the same direction. An error that hits two things almost equally is a **[[common-mode error|common-mode]]** — the hiking map again — and it mostly cancels when you subtract one from the other.

To say that precisely, we need one more piece of statistics: how two errors move together. Take two numbers with errors $e_A$ and $e_B$, each with sigma $\sigma_A$ and $\sigma_B$. Their **[[correlation coefficient|correlation]]** $\rho$ (read "rho") says how closely the errors track each other: $\rho = 1$ means they always move identically, $\rho = 0$ means they are unrelated, and $\rho = -1$ means they always move oppositely. Then the difference $e_A - e_B$ has variance

$$
\sigma_{A-B}^2 = \sigma_A^2 + \sigma_B^2 - 2\rho\,\sigma_A\sigma_B.
$$

The first two terms are what you would get if the errors were unrelated. The last term is the reward for them being related. When $\rho$ is close to $1$ and the two sigmas are similar, it cancels almost all of the first two.

::: example Two satellites, each known to four meters
Two satellites are each known to $\sigma_A = \sigma_B = 4\,\mathrm m$ in some direction. Most of that error comes from a shared station bias, so the correlation between the two errors is $\rho = 0.99$.

**Step 1: the variance of the difference.**

$$
\sigma_{A-B}^2 = 16 + 16 - 2 \times 0.99 \times 16 = 0.32\,\mathrm{m^2}.
$$

**Step 2: the sigma.** $\sigma_{A-B} = \sqrt{0.32} \approx 0.566\,\mathrm m$.

**Step 3: the naive answer.** Treat the two fits as unrelated ($\rho = 0$) and you would get $\sqrt{32} \approx 5.66\,\mathrm m$ — ten times worse, and bigger than either satellite's own error.

**Sanity check.** The separation is known to about half a meter while each position is known only to four. That is the hiking map in numbers.
:::

::: note Why it has to be true
Assume both errors average to zero. The variance of the difference is the average of its square: $\mathbb E[(e_A - e_B)^2] = \mathbb E[e_A^2] + \mathbb E[e_B^2] - 2\,\mathbb E[e_A e_B]$. The first two averages are $\sigma_A^2$ and $\sigma_B^2$. The last, $\mathbb E[e_A e_B]$, is the **covariance** of the two errors, and the correlation coefficient is defined as that covariance divided by $\sigma_A\sigma_B$. So $\mathbb E[e_A e_B] = \rho\,\sigma_A\sigma_B$.

For full state vectors the same algebra, with matrices, gives

$$
\operatorname{Cov}(\hat{\mathbf x}_A-\hat{\mathbf x}_B)=\operatorname{Cov}(\hat{\mathbf x}_A)+\operatorname{Cov}(\hat{\mathbf x}_B)-\operatorname{Cov}(\hat{\mathbf x}_A,\hat{\mathbf x}_B)-\operatorname{Cov}(\hat{\mathbf x}_A,\hat{\mathbf x}_B)^\mathsf T.
$$

The cross-covariance appears twice, once as itself and once transposed, because the product $(\mathbf e_A - \mathbf e_B)(\mathbf e_A - \mathbf e_B)^\mathsf T$ has two mixed terms, $\mathbf e_A\mathbf e_B^\mathsf T$ and $\mathbf e_B\mathbf e_A^\mathsf T$.
:::

### Where the correlation comes from

The consider-covariance lesson showed how an unestimated parameter $\mathbf c$ — here, a station bias with covariance $\mathbf P_{cc}$ — leaks into a fit through the sensitivity matrix $\mathbf S$. If the *same* bias leaks into two fits, through $\mathbf S_A$ and $\mathbf S_B$, the two estimates share an error, and their **cross-covariance** is

$$
\operatorname{Cov}(\hat{\mathbf x}_A,\hat{\mathbf x}_B)=\mathbf S_A\mathbf P_{cc}\mathbf S_B^\mathsf T.
$$

That is the matrix version of $\rho\,\sigma_A\sigma_B$.

::: example A shared station bias, and what it does to relative accuracy
Two satellites in similar orbits, $237\,\mathrm{km}$ apart along-track, are each fitted from the module's three-pass ground-tracking arc. Both fits are hit by the same unestimated station range bias, whose size is varied. The table gives position sigmas (radial, in-track, cross-track, in meters), from a full simulation:

```python
# sigma_bias    absolute sigma (A, m)         relative sigma, correct     relative sigma, naive
#    5 m        (0.28, 0.16, 0.13)             (0.28, 0.15, 0.14)          (0.38, 0.20, 0.18)
#   30 m        (1.14, 0.65, 0.49)             (0.29, 0.21, 0.14)          (1.57, 0.83, 0.71)
#  100 m        (3.74, 2.15, 1.62)             (0.34, 0.52, 0.14)          (5.15, 2.71, 2.32)
```

**Read down the absolute column.** As the bias grows from $5$ to $100\,\mathrm m$, satellite $A$'s own uncertainty grows with it, to nearly four meters radially.

**Read down the correct relative column.** It barely moves, staying under about half a meter. The shared bias cancels almost exactly in $\hat{\mathbf x}_A - \hat{\mathbf x}_B$.

**Read the naive column.** It treats the fits as independent and throws away the cross-covariance. It grows with the bias, just like the absolute column, and at the largest bias it overstates the true relative uncertainty by up to about $16$ times: $2.32 / 0.14 \approx 16.6$ in cross-track.
:::

::: warning Throwing away the cross-covariance
It is easy to store each satellite's covariance on its own and forget the cross-covariance between them. Then the relative uncertainty you compute is the naive one: too big when the errors are shared, as here. It can also be too small when the errors run *opposite* ways ($\rho < 0$). Either way it is wrong. If two estimates came from shared data or shared models, keep their cross-covariance, or estimate them together in one fit.
:::

### Crosslinks: measuring the gap directly

There is a more direct way to get relative accuracy: measure the gap itself. A **crosslink** range is a radio or laser distance measurement between the two spacecraft, the inter-satellite link of the measurement-types lesson:

$$
\rho_{AB} = \lVert\mathbf r_A - \mathbf r_B\rVert.
$$

Here $\rho_{AB}$ is a range, not a correlation — the letter does double duty in orbit work, and the subscript tells you which. Its partial derivatives with respect to the two positions are equal and opposite:

$$
\frac{\partial\rho_{AB}}{\partial\mathbf r_A} = \hat{\boldsymbol\rho}_{AB}^\mathsf T = -\frac{\partial\rho_{AB}}{\partial\mathbf r_B},
$$

where $\hat{\boldsymbol\rho}_{AB} = (\mathbf r_A - \mathbf r_B)/\rho_{AB}$ is the unit vector from $B$ to $A$. Now shift both satellites by the same small error vector $\boldsymbol\epsilon$ (read "epsilon"). The range changes by

$$
\hat{\boldsymbol\rho}_{AB}^\mathsf T\boldsymbol\epsilon - \hat{\boldsymbol\rho}_{AB}^\mathsf T\boldsymbol\epsilon = 0.
$$

Not approximately zero — exactly zero. A crosslink is **structurally blind** to a common-mode error: its sensitivity to one is zero by construction. And the blindness does not even depend on the shift being small, because moving both ends of a ruler by the same amount never changes its length.

::: example Exactly zero, not merely small
This short script puts two satellites about $237\,\mathrm{km}$ apart, shifts both by the same $2.6\,\mathrm{km}$ error, and then shifts only one of them:

```python
import numpy as np

r_A = np.array([6798.0, 0.0, 0.0])        # km, satellite A
r_B = np.array([6793.9, 236.9, 0.0])      # km, satellite B, a little way ahead
shift = np.array([1.5, -2.0, 0.8])        # km, the same error for both

def crosslink(rA, rB):
    return np.linalg.norm(rA - rB)        # the range between them

print(round(crosslink(r_A, r_B), 3))                   # 236.935  true range
print(round(crosslink(r_A + shift, r_B + shift), 3))   # 236.935  both shifted
print(round(crosslink(r_A + shift, r_B), 3))           # 238.967  only A shifted
print(round(np.linalg.norm(shift), 3))                 # 2.625    size of the shift
```

**Both shifted.** The range is unchanged, to every digit.

**Only one shifted.** The range changes by $238.967 - 236.935 = 2.032\,\mathrm{km}$ — most of the $2.6\,\mathrm{km}$ shift, since much of it lies along the line between them.

**Compare with an absolute fix.** A ground-tracked position has no such protection. The same $2.6\,\mathrm{km}$ error would sit, in full, in each satellite's own position.
:::

The same trick runs through the GNSS module. **[[Differential and RTK positioning|differencing]]** subtract two receivers' measurements of the same signal, so every error that hits both receivers nearly equally cancels, and the baseline between them comes out far better than either receiver's own fix. A crosslink does in one measurement what differencing does with two.

::: key Relative accuracy is not bounded by absolute accuracy
Two objects can each be known to meters in an absolute sense while their *separation* is known to centimeters, whenever the dominant errors act on both nearly equally. Crosslinks exploit this directly. Two separate absolute fits with a shared error do the same thing more quietly — but only if their cross-covariance is kept, not thrown away by treating the fits as independent.
:::

For spacecraft flying close together, the relative motion itself is often worth modeling directly, instead of as the difference of two full orbits. The **[[Clohessy-Wiltshire equations|hill-cw]]**, from the earlier relative-motion module, do exactly that: a linearized model of one spacecraft's motion seen from another in a circular orbit. This lesson adds the reason to bother — relative tracking can see what absolute tracking cannot.

## Autonomous onboard orbit determination

Every tool in this module works the same whether the normal equations are solved on the ground or on the spacecraft. What changes onboard is which measurements are available, how much computing power and memory there is, and how long you can wait for an answer. On the ground, a batch fit can crunch days of data on a fast computer, with analysts checking every residual. Onboard, a small **[[radiation-hardened|rad-hard]]** processor has to keep up in real time, with nobody watching. That is why onboard orbit determination is almost always sequential — the EKF or UKF of the sequential lesson — rather than batch.

### With GNSS

A **GNSS** receiver (GPS, Galileo and their cousins) on a spacecraft works much like the one in a phone. It measures pseudoranges to the navigation satellites and solves for position and its own clock error by iterative least squares, as the GNSS module derived, with dilution of precision set by the geometry of the satellites in view. Space adds complications:

- The receiver moves at about $7.7\,\mathrm{km/s}$ in low orbit, so the Doppler shifts are large and change fast.
- A receiver *above* the GNSS constellation, around $20\,000\,\mathrm{km}$ up or higher, sees few signals, and mostly weak ones from the **[[side lobes|side-lobes]]** of antennas pointed at Earth, with poorer geometry.

Feed the GNSS fixes — or the raw pseudoranges — into an onboard sequential filter with a good dynamics model, and the spacecraft carries a continuously updated state and covariance with no ground contact at all. It is the same architecture the inertial-navigation module used to fuse GNSS with an IMU.

### Without GNSS

In deep space, or when the mission must survive a GNSS outage, the same filter runs on whatever measurements remain:

- **Crosslink ranges** inside a constellation give relative-state information with no ground link, exactly as in the first half of this lesson.
- **Optical observations** — a camera or star tracker measuring the direction to a planet, a moon or a landmark against the stars — give angles-only information, as in the initial-orbit-determination lesson, now processed one at a time instead of in a one-off closed-form solve. NASA's Deep Space 1 flew this idea as **[[AutoNav|autonav]]**.
- **No measurements at all.** Then the filter only predicts, and its covariance grows through the dynamics and the process noise.

::: example How fast does an onboard estimate go stale?
An onboard filter in the module's $420\,\mathrm{km}$ orbit loses GNSS. At that moment its estimate of the semi-major axis is off by $\delta a = 10\,\mathrm m$, and no other measurements arrive.

**Step 1: drift per orbit.** From the maneuver lesson, an error $\delta a$ turns into an along-track drift of $3\pi\,\delta a$ each orbit: $3\pi \times 10 \approx 94.2\,\mathrm m$.

**Step 2: drift per day.** At about $15.5$ orbits a day, that is $94.2 \times 15.5 \approx 1460\,\mathrm m$.

**Result.** After one day without measurements, the onboard along-track error is about $1.5\,\mathrm{km}$, from an orbit-size error of only $10\,\mathrm m$. The radial and cross-track errors stay far smaller.

**Sanity check.** This is the RIC lesson's cigar again: the in-track error grows steadily and the others do not. A filter whose covariance does not stretch in-track during an outage has a bad model.
:::

::: warning Onboard autonomy does not relax any of this module's cautions
A filter running without ground oversight has no analyst to notice a rising edit rate or a suspicious trend in the residuals. Those checks either run automatically on the spacecraft too, or the problems they catch — an undetected maneuver, a badly observed short arc, an optimistic covariance — go unnoticed longer. Autonomous onboard orbit determination is this module's machinery with less supervision. It needs more discipline, not less.
:::

## Where this module leaves you

The module opened with a hard question: recover an orbit from a handful of noisy measurements. Answering it well took nearly everything built since. Closed-form methods get started from nothing. The state transition matrix turns one epoch state into a fit against measurements spread over days. Sequential filtering updates the answer in real time. Honest accounting covers every force and parameter the model does not solve for. And a habit of checking — residuals, edit rates, the RIC shape, overlap comparisons — separates a fit that converged from a fit that is right.

None of that is special to one object tracked from the ground. It is the same discipline this lesson applied to a pair of spacecraft, and to a spacecraft working out its own orbit with nobody watching.

## Check yourself

::: check
Explain why the naive relative sigma in the shared-bias example grows with the bias, while the correctly computed relative sigma does not.
:::

::: answer
The naive version adds the two absolute covariances, $\operatorname{Cov}(\hat{\mathbf x}_A)+\operatorname{Cov}(\hat{\mathbf x}_B)$. Each contains the full consider contribution from the shared bias, so each grows with $\sigma_{\text{bias}}$, and so does their sum. The correct version also subtracts the cross-covariance and its transpose, built from $\mathbf S_A\mathbf P_{cc}\mathbf S_B^\mathsf T$. Because the same station affects both satellites in nearly the same way, $\mathbf S_A$ and $\mathbf S_B$ are similar, so the subtracted terms grow at almost the same rate as the added ones. The growing parts very nearly cancel, and what is left is mostly the measurement-noise part, which does not depend on the bias.
:::

::: check
Why is a crosslink range called "structurally blind" to a common-mode error, rather than just "less sensitive" to one?
:::

::: answer
Its partial derivatives with respect to the two positions are exactly equal and opposite, $\partial\rho_{AB}/\partial\mathbf r_A=-\partial\rho_{AB}/\partial\mathbf r_B$. A shift $\boldsymbol\epsilon$ applied to both positions changes the predicted range by $\hat{\boldsymbol\rho}_{AB}^\mathsf T\boldsymbol\epsilon - \hat{\boldsymbol\rho}_{AB}^\mathsf T\boldsymbol\epsilon = 0$, exactly. The sensitivity is zero by the structure of the measurement, not small by luck of the numbers — and since the range is the distance between the two points, an identical shift of both leaves it unchanged even when the shift is large.
:::

::: check
Two satellites each have a $2\,\mathrm m$ along-track sigma. Find the sigma of their along-track separation if the correlation between their errors is $\rho = 0.9$, and again if $\rho = -0.5$.
:::

::: answer
With $\rho = 0.9$: $\sigma_{A-B}^2 = 4 + 4 - 2 \times 0.9 \times 4 = 0.8\,\mathrm{m^2}$, so $\sigma_{A-B} = \sqrt{0.8} \approx 0.894\,\mathrm m$ — better than either satellite alone.

With $\rho = -0.5$: $\sigma_{A-B}^2 = 4 + 4 + 2 \times 0.5 \times 4 = 12\,\mathrm{m^2}$, so $\sigma_{A-B} = \sqrt{12} \approx 3.46\,\mathrm m$. When errors run in opposite directions, subtracting makes them add up, and the separation is known *worse* than either position.
:::

::: check
An autonomous onboard filter loses its GNSS signal for a long time. Which machinery from this module keeps it working, and what does the tracking-geometry lesson say to expect of its covariance?
:::

::: answer
The sequential filter keeps running: predict with $\boldsymbol\Phi$ and the process noise $\mathbf Q$, and update with whatever measurements remain — crosslink ranges, star-tracker or camera angles. With no measurements at all it only predicts, and the covariance grows through the dynamics and $\mathbf Q$. The tracking-geometry lesson's point still holds: the remaining measurements pin some directions of the state much better than others. An angles-only sensor, for instance, gives no range information at all, as the initial-orbit-determination lesson showed. So the covariance should grow unevenly, not the same in every direction — and fastest in-track, as the outage example showed.
:::

::: check
A mission designer argues that because relative orbit determination can reach centimeter accuracy, the constellation's absolute orbit determination effort can be cut back. Is that right?
:::

::: answer
Not in general. The great relative accuracy came from a *shared* error canceling between two satellites tracked the same way. It says nothing about absolute accuracy, which still depends on the tracking geometry, arc length and data quality of every earlier lesson. Some jobs need absolute accuracy directly — conjunction assessment against a third object tracked independently, for instance. That object does not share the constellation's errors, so nothing cancels. Relative and absolute orbit determination answer different questions, and doing one well does not replace the other.
:::

## Summary

| Symbol or idea | Meaning |
| --- | --- |
| $\sigma_{A-B}^2 = \sigma_A^2 + \sigma_B^2 - 2\rho\,\sigma_A\sigma_B$ | Variance of a difference; correlated errors cancel when $\rho$ is near $1$ |
| $\operatorname{Cov}(\hat{\mathbf x}_A,\hat{\mathbf x}_B)=\mathbf S_A\mathbf P_{cc}\mathbf S_B^\mathsf T$ | Cross-covariance from a shared unestimated error between two fits |
| $\operatorname{Cov}(\hat{\mathbf x}_A-\hat{\mathbf x}_B)$ | Sum of the two covariances minus the cross-covariance and its transpose |
| Naive relative covariance | Drops the cross terms; wrong whenever the fits share data or models |
| $\partial\rho_{AB}/\partial\mathbf r_A=-\partial\rho_{AB}/\partial\mathbf r_B$ | Why a crosslink is exactly blind to a common-mode shift |
| Clohessy-Wiltshire equations | Linearized relative motion for close formations, from the relative-motion module |
| Onboard OD | Sequential filter on GNSS, crosslinks or optical data; less supervision, same discipline |
| $3\pi\,\delta a$ per orbit | Along-track drift of an unrefreshed onboard estimate |

This module set out to recover an orbit from a handful of noisy measurements, and to be honest about what that orbit and its covariance really mean. Each lesson added one more piece of that honesty — in the estimator, the dynamics, the frame the answer is read in, and the judgment of a team that checks its own work instead of trusting a fit because it converged.

::: context constellation Many satellites doing one job
A **constellation** is a group of satellites spread around the Earth so that together they cover it: GPS keeps about thirty satellites in six orbit planes so that any spot on Earth sees several at once, and communication constellations such as Starlink fly thousands. A **formation** is tighter — a few spacecraft flying close together on purpose, often to act as one bigger instrument. For both, the operators constantly ask "where is each satellite compared with its neighbors?" as well as "where is each one?"
:::

::: context common-mode The same error in both places
Both dots move by the same arrow, so the gap between them does not change.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <circle cx="60" cy="110" r="7" fill="#1d6fd1"/>
  <circle cx="220" cy="110" r="7" fill="#1d6fd1"/>
  <text x="60" y="136" font-size="12" fill="#1d6fd1" text-anchor="middle">A true</text>
  <text x="220" y="136" font-size="12" fill="#1d6fd1" text-anchor="middle">B true</text>
  <circle cx="120" cy="50" r="7" fill="#b4232c"/>
  <circle cx="280" cy="50" r="7" fill="#b4232c"/>
  <text x="120" y="30" font-size="12" fill="#b4232c" text-anchor="middle">A estimate</text>
  <text x="280" y="30" font-size="12" fill="#b4232c" text-anchor="middle">B estimate</text>
  <line x1="66" y1="104" x2="110" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="114,56 103,60 110,67" fill="#1f2a44"/>
  <line x1="226" y1="104" x2="270" y2="60" stroke="#1f2a44" stroke-width="1.5"/>
  <polygon points="274,56 263,60 270,67" fill="#1f2a44"/>
  <line x1="67" y1="110" x2="213" y2="110" stroke="#1d6fd1" stroke-width="1.5" stroke-dasharray="5 4"/>
  <line x1="127" y1="50" x2="273" y2="50" stroke="#b4232c" stroke-width="1.5" stroke-dasharray="5 4"/>
  <text x="140" y="96" font-size="11" fill="#1f2a44" text-anchor="middle">same gap, same direction</text>
</svg>
```

Engineers borrowed "common mode" from electronics, where a common-mode signal is one that appears equally on two wires; a circuit that listens only to the *difference* between the wires ignores it. Differencing two measurements does the same with errors.
:::

::: context correlation Seeing a correlation
Plot many pairs of errors, $e_A$ across and $e_B$ up, one dot per pair. The correlation coefficient describes the shape of the cloud.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="15" width="90" height="90" fill="#ffffff" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="93.6" cy="44.0" r="3" fill="#1d6fd1"/>
  <circle cx="70.9" cy="56.9" r="3" fill="#1d6fd1"/>
  <circle cx="58.7" cy="67.0" r="3" fill="#1d6fd1"/>
  <circle cx="36.7" cy="87.9" r="3" fill="#1d6fd1"/>
  <circle cx="52.9" cy="57.0" r="3" fill="#1d6fd1"/>
  <circle cx="68.2" cy="58.5" r="3" fill="#1d6fd1"/>
  <circle cx="61.1" cy="66.7" r="3" fill="#1d6fd1"/>
  <circle cx="50.2" cy="75.7" r="3" fill="#1d6fd1"/>
  <circle cx="71.7" cy="54.6" r="3" fill="#1d6fd1"/>
  <circle cx="78.4" cy="48.1" r="3" fill="#1d6fd1"/>
  <circle cx="65.3" cy="52.9" r="3" fill="#1d6fd1"/>
  <circle cx="72.6" cy="55.0" r="3" fill="#1d6fd1"/>
  <circle cx="62.4" cy="60.1" r="3" fill="#1d6fd1"/>
  <circle cx="92.1" cy="35.4" r="3" fill="#1d6fd1"/>
  <text x="65" y="124" font-size="12" fill="#1f2a44" text-anchor="middle">ρ near 1</text>
  <rect x="135" y="15" width="90" height="90" fill="#ffffff" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="176.6" cy="46.0" r="3" fill="#1d6fd1"/>
  <circle cx="167.6" cy="64.1" r="3" fill="#1d6fd1"/>
  <circle cx="192.4" cy="51.9" r="3" fill="#1d6fd1"/>
  <circle cx="181.3" cy="50.6" r="3" fill="#1d6fd1"/>
  <circle cx="140.4" cy="45.7" r="3" fill="#1d6fd1"/>
  <circle cx="166.6" cy="83.4" r="3" fill="#1d6fd1"/>
  <circle cx="183.9" cy="50.2" r="3" fill="#1d6fd1"/>
  <circle cx="173.8" cy="75.1" r="3" fill="#1d6fd1"/>
  <circle cx="180.4" cy="60.7" r="3" fill="#1d6fd1"/>
  <circle cx="199.7" cy="49.5" r="3" fill="#1d6fd1"/>
  <circle cx="182.7" cy="44.4" r="3" fill="#1d6fd1"/>
  <circle cx="177.1" cy="73.0" r="3" fill="#1d6fd1"/>
  <circle cx="188.2" cy="51.8" r="3" fill="#1d6fd1"/>
  <circle cx="177.0" cy="71.0" r="3" fill="#1d6fd1"/>
  <text x="180" y="124" font-size="12" fill="#1f2a44" text-anchor="middle">ρ near 0</text>
  <rect x="250" y="15" width="90" height="90" fill="#ffffff" stroke="#6c7a93" stroke-width="1"/>
  <circle cx="298.2" cy="73.9" r="3" fill="#1d6fd1"/>
  <circle cx="304.7" cy="67.0" r="3" fill="#1d6fd1"/>
  <circle cx="272.1" cy="37.9" r="3" fill="#1d6fd1"/>
  <circle cx="281.5" cy="43.9" r="3" fill="#1d6fd1"/>
  <circle cx="266.5" cy="36.9" r="3" fill="#1d6fd1"/>
  <circle cx="304.9" cy="64.4" r="3" fill="#1d6fd1"/>
  <circle cx="264.8" cy="33.5" r="3" fill="#1d6fd1"/>
  <circle cx="299.6" cy="67.0" r="3" fill="#1d6fd1"/>
  <circle cx="317.3" cy="86.4" r="3" fill="#1d6fd1"/>
  <circle cx="300.0" cy="69.3" r="3" fill="#1d6fd1"/>
  <circle cx="314.7" cy="78.8" r="3" fill="#1d6fd1"/>
  <circle cx="289.8" cy="62.6" r="3" fill="#1d6fd1"/>
  <circle cx="318.5" cy="79.1" r="3" fill="#1d6fd1"/>
  <circle cx="305.5" cy="65.0" r="3" fill="#1d6fd1"/>
  <text x="295" y="124" font-size="12" fill="#1f2a44" text-anchor="middle">ρ near −1</text>
  <text x="180" y="143" font-size="11" fill="#6c7a93" text-anchor="middle">across: error in A · up: error in B</text>
</svg>
```

Near $+1$, the dots hug a rising line: when $A$ is off one way, $B$ is off the same way, so $A - B$ hardly varies. Near $0$ they form a round blob. Near $-1$ they hug a falling line, and the difference swings twice as hard. A shared station bias pushes two fits toward the left-hand picture.
:::

::: context differencing Subtracting away the errors
In the GNSS module, a receiver's error budget included satellite clock errors, orbit errors and delays through the upper and lower atmosphere. Two receivers a few kilometers apart see nearly the same values of all of these. Subtract their measurements of the same satellite — **differencing** — and those errors cancel. Real-time kinematic (**RTK**) positioning pushes this further with the phase of the radio carrier wave and reaches centimeter-level baselines. Surveyors and self-steering farm tractors rely on it; so do spacecraft pairs such as GRACE, which used differenced GPS to help measure their relative positions.
:::

::: context hill-cw Relative motion, from the Moon to rendezvous
The equations are named after George William Hill, who wrote linearized equations of this kind in 1878 while studying the Moon's motion, and W. H. Clohessy and R. S. Wiltshire, who applied them to spacecraft rendezvous in 1960, early in the space race. They describe how one spacecraft drifts and loops as seen from another in a circular orbit, in the same radial, in-track and cross-track axes as this module's RIC frame. The relative-motion module derived them; a formation-flying filter can use them as its dynamics model in place of two full orbits.
:::

::: context rad-hard Why spacecraft computers are slow
Above the atmosphere, fast charged particles from the Sun and from cosmic rays pass through electronics. One particle can flip a stored bit or, worse, latch a chip into a short circuit. **Radiation-hardened** processors are designed and tested to survive this, and the extra care leaves them years behind the chips in a phone. The RAD750, flown on the Curiosity and Perseverance Mars rovers, runs at up to about $200\,\mathrm{MHz}$. That is why flight software favors a compact sequential filter over a big batch fit.
:::

::: context side-lobes Listening to signals meant for someone else
GNSS satellites point their antennas at Earth. Most of the power goes into a main beam a little wider than the Earth; weaker **side lobes** spill out at wider angles. A spacecraft far above the constellation hears mostly the edges of main beams from satellites on the far side of the Earth, sneaking past its rim, plus the faint side lobes. The picture is not to scale.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <polygon points="180,190 37.4,20 104.9,60" fill="#f2b880" opacity="0.5"/>
  <polygon points="180,190 322.6,20 255.1,60" fill="#f2b880" opacity="0.5"/>
  <line x1="180" y1="190" x2="37.4" y2="20" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="180" y1="190" x2="322.6" y2="20" stroke="#1d6fd1" stroke-width="1.5"/>
  <circle cx="180" cy="120" r="70" fill="none" stroke="#6c7a93" stroke-width="1.2" stroke-dasharray="5 4"/>
  <circle cx="180" cy="120" r="35" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="124" font-size="12" fill="#1f2a44" text-anchor="middle">Earth</text>
  <text x="268" y="160" font-size="11" fill="#6c7a93">GNSS orbits</text>
  <rect x="174" y="184" width="12" height="12" fill="#1f2a44"/>
  <text x="196" y="200" font-size="11" fill="#1f2a44">GNSS satellite</text>
  <circle cx="85.4" cy="54.8" r="6" fill="#b4232c"/>
  <text x="96" y="46" font-size="12" fill="#b4232c">high user</text>
  <text x="180" y="18" font-size="11" fill="#1f2a44" text-anchor="middle">Earth blocks the middle of the beam</text>
</svg>
```

Receivers built for this can still navigate: NASA's Magnetospheric Multiscale mission used GPS at about $187\,000\,\mathrm{km}$ from Earth, around halfway to the Moon.
:::

::: context autonav A spacecraft that navigated itself
Deep Space 1, launched by NASA in 1998, carried an experiment called AutoNav. Its camera photographed asteroids against the background stars; the directions to them, fed into an onboard estimator, gave the spacecraft its own trajectory without waiting for tracking from Earth. It then planned small corrections to its ion-engine thrusting from that trajectory. Later missions used descendants of the same software for close flybys, where the time for a signal to travel to Earth and back is far too long to steer by.
:::
