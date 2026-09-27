---
id: l09-differential-gnss-rtk-and-ppp
title: Differential GNSS, RTK and precise point positioning
minutes: 22
covers:
  - Differential GNSS, RTK, and precise point positioning
---

You and a friend step on the same bathroom scale, one after the other. The scale reads $2\,\mathrm{kg}$ too heavy. Neither reading is right. But subtract one from the other and the difference between your weights is exactly right, because the same $2\,\mathrm{kg}$ error sat in both and cancelled.

That is the whole idea of this lesson. Two GNSS receivers near each other see nearly the same errors: the same satellite clock error, the same orbit error, nearly the same atmosphere. Subtract their measurements and those shared errors cancel. The previous lesson promised that this subtraction also removes the clocks that stood in the way of finding the carrier's whole-number ambiguities. Here is how.

There are [[three answers|accuracy-ladder]] to the question "what do you do with a second source of information about the same errors?":

- **Differential GNSS (DGNSS)**: a nearby station at a known spot broadcasts corrections to the code ranges.
- **Real-time kinematic (RTK)**: a nearby station shares its carrier-phase measurements, and the rover resolves the integers for centimeter accuracy.
- **Precise point positioning (PPP)**: no nearby station at all; instead, very accurate satellite orbits and clocks computed by a worldwide network.

All three start from the same subtraction, so that comes first.

## Single differences: cancel the satellite

Take two receivers, $A$ and $B$, both tracking satellite $i$ at the same moment. The line between them is the **[[baseline|baseline-picture]]**. Write the pseudorange equation for each and subtract. The result is the **single difference** $\nabla\rho^i$ (read "[[nabla|nabla]] rho, superscript i"):

$$
\nabla\rho^i \equiv \rho_A^i - \rho_B^i = \big(\|\mathbf{s}_i-\mathbf{x}_A\| - \|\mathbf{s}_i-\mathbf{x}_B\|\big) + c(\delta t_A - \delta t_B) + (I_A^i-I_B^i) + (T_A^i-T_B^i) + (\varepsilon_A^i-\varepsilon_B^i).
$$

Superscripts name the satellite, subscripts the receiver. The sign $\equiv$ means "is defined as". Now go through what happened to each error.

- **The satellite clock** $c\,\delta t_{sat,i}$ is gone. It was the same number in both equations, since both receivers heard the same satellite at (very nearly) the same moment.
- **The atmosphere** shrinks. If $A$ and $B$ are close, their signal paths through the ionosphere and troposphere are nearly the same, so $I_A^i - I_B^i$ and $T_A^i - T_B^i$ are small. Over a few kilometers, in ordinary conditions, a few meters of delay become a small leftover.
- **The receiver clocks** survive as $c(\delta t_A - \delta t_B)$. Each receiver has its own clock, so their errors are different numbers and do not cancel.

A single difference removes the satellite's errors but not the receivers'.

## Double differences: cancel the receiver too

Form a second single difference to another satellite $j$, then subtract the two. The result is the **double difference** $\nabla\Delta\rho^{ij}$ (read "nabla delta rho, i j"):

$$
\nabla\Delta\rho^{ij} \equiv \nabla\rho^i - \nabla\rho^j = \Big[\big(\|\mathbf{s}_i-\mathbf{x}_A\|-\|\mathbf{s}_i-\mathbf{x}_B\|\big) - \big(\|\mathbf{s}_j-\mathbf{x}_A\|-\|\mathbf{s}_j-\mathbf{x}_B\|\big)\Big] + \big(\text{residual atmosphere}\big) + \big(\text{residual noise}\big).
$$

The receiver clock difference $c(\delta t_A - \delta t_B)$ was the same in both single differences, so it cancels exactly, the way the satellite clock did. What is left is pure geometry — only satellite positions and receiver positions, no clock of any kind — plus whatever atmosphere and multipath did not cancel, plus noise. With the clocks gone, the only unknown left is the baseline between the receivers. This double difference is what every example below, and the whole of the previous lesson's integer search, is built on.

### What subtraction does to the noise

Subtraction cancels shared errors, but it adds up errors that are *not* shared. If each one-way pseudorange has independent noise of size $\sigma$ (its **variance** — the square of the typical error — is $\sigma^2$), then **[[variances add|variances-add]]** when you subtract: a single difference has variance $2\sigma^2$, a double difference $4\sigma^2$. Taking square roots:

$$
\sigma_{\nabla\rho} = \sqrt{2}\,\sigma, \qquad \sigma_{\nabla\Delta\rho} = 2\sigma.
$$

A second effect matters just as much. Two double differences that share the same reference satellite $i$ both contain satellite $i$'s single difference. So their errors are linked — **correlated**. Their **covariance** (how much they vary together) is $2\sigma^2$, exactly half of each one's variance, so their correlation is $0.5$ whatever $\sigma$ is. A simulation with $\sigma = 0.3\,\mathrm{m}$ agrees:

```python
import numpy as np

rng = np.random.default_rng(0)
sigma = 0.3                                    # one-way noise, m
e = rng.normal(0, sigma, size=(500_000, 6))    # A-i, B-i, A-j, B-j, A-k, B-k
sd_i = e[:, 0] - e[:, 1]                       # single differences
sd_j = e[:, 2] - e[:, 3]
sd_k = e[:, 4] - e[:, 5]
dd_ij, dd_ik = sd_i - sd_j, sd_i - sd_k        # double differences sharing i
print(f"{sd_i.var():.3f} {dd_ij.var():.3f} {np.cov(dd_ij, dd_ik)[0, 1]:.3f}")
# 0.180 0.360 0.180
```

The predictions are $2 \times 0.3^2 = 0.18$, $4 \times 0.3^2 = 0.36$ and $2 \times 0.3^2 = 0.18$ square meters. Lesson 3 warned that differencing correlates the noise; this is the exact size of it. A properly weighted double-difference solution needs the full covariance matrix, not only the diagonal.

::: note Why it has to be true
For independent errors, the variance of a sum or a difference is the sum of the variances: $\mathrm{Var}(a - b) = \mathrm{Var}(a) + \mathrm{Var}(b)$. A single difference combines two one-way errors, so $2\sigma^2$. A double difference combines four, with signs $(+1, -1, -1, +1)$, so $4\sigma^2$.

For the covariance, write $\nabla\Delta\rho^{ij} = \nabla\rho^i - \nabla\rho^j$ and $\nabla\Delta\rho^{ik} = \nabla\rho^i - \nabla\rho^k$. The pieces from $j$ and $k$ are independent of everything else, so only the shared $\nabla\rho^i$ contributes: the covariance is $\mathrm{Var}(\nabla\rho^i) = 2\sigma^2$. Divide by the variance $4\sigma^2$ of each to get the correlation $0.5$.
:::

::: key
Single difference (two receivers, one satellite) cancels the satellite clock; $\sigma_{\nabla\rho} = \sqrt2\,\sigma$. Double difference (two receivers, two satellites) also cancels the receiver clock difference, leaving pure geometry plus residual atmosphere; $\sigma_{\nabla\Delta\rho} = 2\sigma$, and double differences sharing a reference satellite are correlated with $\mathrm{Cov} = 2\sigma^2$ (correlation $0.5$).
:::

## DGNSS: corrections from a station that knows where it is

A **[[reference station|reference-station]]** sits at a precisely surveyed spot. For each satellite it knows the true range, because it knows its own position and the satellite's. It compares that with the range it actually measures. The difference is the **correction**. It soaks up the satellite clock error, the ephemeris error and, over a short enough baseline, most of the atmosphere — the same terms a single difference cancels. The station broadcasts the correction, and a nearby **rover** (the receiver being positioned) adds it to its own raw range. DGNSS is a single difference done over a radio link instead of in one computer.

::: example A correction shrinking a four-meter error
A base and a rover are $5.4\,\mathrm{km}$ apart. Their true ranges to a satellite are $20{,}844{,}346.9\,\mathrm{m}$ and $20{,}843{,}278.3\,\mathrm{m}$. Both carry the same $4.6\,\mathrm{m}$ of clock, orbit and atmosphere error, and each has its own $0.5\,\mathrm{m}$ of independent noise and multipath:

```python
import numpy as np

rng = np.random.default_rng(5)
true_range_A, true_range_B = 20_844_346.9, 20_843_278.3
common_err = 4.6
sigma_code = 0.5

rho_A = true_range_A + common_err + rng.normal(0, sigma_code)
rho_B_raw = true_range_B + common_err + rng.normal(0, sigma_code)

correction = true_range_A - rho_A          # base broadcasts this
rho_B_corrected = rho_B_raw + correction

print("uncorrected rover error (m):", round(rho_B_raw - true_range_B, 2))
print("DGNSS-corrected rover error (m):", round(rho_B_corrected - true_range_B, 2))
# uncorrected rover error (m): 3.94
# DGNSS-corrected rover error (m): -0.26
```

**Step by step.** The base knows its true range, so its correction is true minus measured, about $-4.6\,\mathrm{m}$ plus its own noise. The rover adds that to its measurement. The shared $4.6\,\mathrm{m}$ cancels. What is left is the two receivers' independent noise, which never cancels because it was never shared.

Sanity check: the leftover $0.26\,\mathrm{m}$ is about the size of one receiver's $0.5\,\mathrm{m}$ noise, not the $4.6\,\mathrm{m}$ common error. That is the "meter to decimeter" of DGNSS: it removes what two receivers share and leaves what they do not.
:::

The correction weakens with distance and with age. As the baseline grows, the atmosphere stops being shared. As the correction gets older, the satellite clock it captured has drifted on. A rover using a distant or stale correction is trusting a cancellation that has partly stopped working.

::: warning Stale and distant corrections fail quietly
Use a correction from hundreds of kilometers away, or minutes old, and nothing breaks outright. It still removes most of the satellite clock error, which is the same everywhere. But it quietly lets back in the atmosphere and orbit error it was supposed to remove, growing with distance and age, and nothing in the rover's own measurements raises a flag.
:::

## RTK: carrier phase, a nearby base, and resolved integers

**Real-time kinematic** positioning runs the same double-difference machinery on carrier phase, with its millimeter noise, and with the whole-number ambiguities from the previous lesson resolved. "Kinematic" means the rover may be moving.

The unknown is the baseline vector $\mathbf{b} = \mathbf{x}_B - \mathbf{x}_A$. With both clocks gone there is no fourth unknown, only the three parts of $\mathbf{b}$. The row of the Jacobian (the table of slopes from lesson 4) for a double difference against a reference satellite is

$$
\mathbf{e}_i(\mathbf{x}_B) - \mathbf{e}_{\mathrm{ref}}(\mathbf{x}_B),
$$

the difference of two unit line-of-sight vectors from the rover — the same vectors lesson 4 built its geometry matrix $\mathbf{G}$ from.

::: example A baseline recovered to a centimeter
Use the six Cape Canaveral satellites from lessons 4 and 5 and a $5.4\,\mathrm{km}$ baseline. Give each receiver $3\,\mathrm{mm}$ of carrier noise, add a shared error of several meters per satellite, and give the two receivers very different clock errors. The ambiguities are taken as already resolved, so they are left out:

```python
import numpy as np

x_A = np.array([914936.61, -5526684.03, 3049186.55])         # base, ECEF, m
baseline_true = np.array([4778.13, 1751.28, 1761.41])          # rover minus base, m
x_B_true = x_A + baseline_true

sats = np.array([                                               # the module's six-satellite geometry
    [11350562.41, -23441217.26, 5206502.33],
    [15228615.04, -6538895.01, 20754896.68],
    [-11200404.28, -23485162.13, -5332138.78],
    [-8420060.43, -15461050.49, 19886983.18],
    [4231690.58, -19962286.90, 17000985.17],
    [-4355633.71, -22609494.10, -13239064.60],
])
s_ref, sats_dd = sats[0], sats[1:]

rng = np.random.default_rng(77)
common_err = rng.normal(0, 5.0, size=6)                          # shared error, up to several metres
b_A, b_B = 18500.0, -7340.0                                       # different receiver clocks, m
sigma_phi = 0.003                                                 # 3 mm carrier noise, resolved ambiguities


def phase(sats, x, b, common):
    return np.linalg.norm(sats - x, axis=1) + b + common


rA = phase(sats, x_A, b_A, common_err) + rng.normal(0, sigma_phi, 6)
rB = phase(sats, x_B_true, b_B, common_err) + rng.normal(0, sigma_phi, 6)
DD_obs = ((rA - rB) - (rA - rB)[0])[1:]                            # double difference vs satellite 0


def dd_model_and_jac(baseline, sats_dd, s_ref, x_A):
    x_B = x_A + baseline
    e_dd = (sats_dd - x_B) / np.linalg.norm(sats_dd - x_B, axis=1)[:, None]
    e_ref = (s_ref - x_B) / np.linalg.norm(s_ref - x_B)
    model = (np.linalg.norm(sats_dd - x_A, axis=1) - np.linalg.norm(sats_dd - x_B, axis=1)) \
          - (np.linalg.norm(s_ref - x_A) - np.linalg.norm(s_ref - x_B))
    return model, e_dd - e_ref                # Jacobian row: e_i(B) - e_ref(B)

baseline_est = np.zeros(3)
for it in range(10):
    model, J = dd_model_and_jac(baseline_est, sats_dd, s_ref, x_A)
    step, *_ = np.linalg.lstsq(J, DD_obs - model, rcond=None)
    baseline_est += step
    if np.linalg.norm(step) < 1e-8:
        break

print(it + 1, np.round((baseline_est - baseline_true) * 1000, 2))
print("error magnitude (mm):", round(np.linalg.norm(baseline_est - baseline_true) * 1000, 2))
# 4 [-1.13  7.94 -5.47]
# error magnitude (mm): 9.71
```

**What happened.** Starting from a guess of zero baseline, four rounds of the same Gauss-Newton step as lesson 4 land within $9.7\,\mathrm{mm}$ of the truth in three dimensions. The meters of shared error vanished in the subtraction. The $25{,}840\,\mathrm{m}$ gap between the two clocks never appeared at all.

Sanity check: $9.7\,\mathrm{mm}$ is a few times the $3\,\mathrm{mm}$ noise, which is what the noise growth ($2\sigma = 6\,\mathrm{mm}$ per double difference) and the geometry together should give. That is what "resolve the ambiguity and you have centimeter positioning" means in practice.
:::

The catch is the baseline length. As $A$ and $B$ move apart, the atmosphere left in the double difference grows. A leftover of even a few centimeters is enough to send the previous lesson's integer search to the wrong candidate, or make it fail the ratio test. Fixing integers needs the leftover error to be small next to a fraction of a $19\,\mathrm{cm}$ wavelength — a far tighter demand than DGNSS's meter-level target. That is why RTK baselines are usually kept to a few tens of kilometers, why **[[network RTK|network-rtk]]** services blend corrections from several stations to reach farther, and why, beyond some distance, the honest fallback is to stop fixing integers and accept the float solution's decimeter accuracy.

## PPP: no base station, precise products instead

**Precise point positioning** drops the second receiver. Instead, it replaces the broadcast orbits and clocks — good to about half a meter, lesson 7 found — with **[[precise orbit and clock products|precise-products]]**, computed from a worldwide tracking network and good to a few centimeters.

With no nearby receiver there is nothing to subtract the atmosphere against. So PPP handles it directly:

- the **ionosphere** is removed with the dual-frequency ionosphere-free combination from lesson 6;
- the **troposphere's wet part** is carried as an unknown to estimate — the **zenith wet delay**, the extra delay straight up caused by water vapor. It is modeled as a slowly wandering **[[random walk|random-walk]]**, exactly the kind of state the Kalman filter module handles.

### Why PPP is slow to settle

At any single moment, three unknowns look alike to the measurements.

- The **receiver clock** adds the same amount to every satellite's range.
- The **height** adds an amount to each range that grows with the satellite's elevation.
- The **zenith wet delay** adds an amount that grows as the satellite gets *lower*, through the troposphere's mapping function from lesson 6.

These three patterns are different, but not very different, over the handful of satellites in view at one instant. On top of them ride the float carrier ambiguities, one per satellite, each another constant to estimate. More satellites at one moment do not untangle this. **Time** does. Over the next tens of minutes the satellites move across the sky, the patterns stop looking alike, and a Kalman filter holding position, clock, zenith wet delay and every ambiguity gradually pins them all down.

The result after that convergence is decimeter accuracy with no base station anywhere near. With extra **[[fractional-cycle-bias|fcb]]** products, PPP can also resolve its integers, even without a local double difference, and reach close to RTK precision. The long wait to converge remains.

::: key
DGNSS: broadcast code corrections from a surveyed base, meter to decimeter, degrading with baseline distance and correction age. RTK: carrier phase double-differenced against a nearby base, resolved integer ambiguities, centimeter — limited by how far the atmosphere can be trusted to cancel. PPP: precise orbit and clock products, no base station, estimated ionosphere and zenith wet delay, decimeter after a convergence of tens of minutes (close to RTK precision with fixed ambiguities via fractional-cycle-bias products).
:::

::: key DGNSS, RTK and PPP
DGNSS: broadcast code corrections, meter to decimeter. RTK: carrier phase plus a nearby base station, centimeter, short baselines. PPP: precise orbit and clock products with no base station, decimeter after a long convergence.
:::

## Check yourself

::: check
Write the single-difference and double-difference pseudorange equations, and say exactly what cancels in each.
:::

::: answer
Single difference, $\nabla\rho^i = \rho_A^i - \rho_B^i$: the satellite clock term $c\,\delta t_{sat,i}$ cancels exactly, because it is identical in both receivers' measurements. The receiver clock difference $c(\delta t_A - \delta t_B)$ remains. The atmosphere terms shrink as the baseline shortens but do not cancel exactly.

Double difference, $\nabla\Delta\rho^{ij} = \nabla\rho^i - \nabla\rho^j$: the receiver clock difference also cancels, since it is the same in both single differences. What is left is pure geometry plus residual atmosphere and noise.
:::

::: check
Pseudorange noise is $\sigma = 0.4\,\mathrm{m}$ at each receiver. What are the single-difference and double-difference noise levels?
:::

::: answer
Single difference: $\sigma_{\nabla\rho} = \sqrt2 \times 0.4 = 0.566\,\mathrm{m}$. Double difference: $\sigma_{\nabla\Delta\rho} = 2 \times 0.4 = 0.8\,\mathrm{m}$. Subtraction removed the shared errors but doubled the independent noise.
:::

::: check
Two double differences share the same reference satellite. What is their covariance, in terms of the one-way variance $\sigma^2$, and their correlation?
:::

::: answer
Both contain the reference satellite's single difference, made of two one-way terms, so the shared part has variance $2\sigma^2$: $\mathrm{Cov} = 2\sigma^2$. Each double difference has variance $4\sigma^2$, so the correlation is $2\sigma^2 / 4\sigma^2 = 0.5$, whatever $\sigma$ is.
:::

::: check
Why does a single difference remove the satellite clock but not the receiver clock?
:::

::: answer
The satellite clock error is one number, the same in both receivers' equations, because both heard the same satellite at nearly the same moment. Subtracting cancels it. The receiver clock errors are two different numbers, one per receiver, each with its own oscillator. Subtracting leaves their difference. Removing that takes a second subtraction, against a second satellite — which is what makes a double difference.
:::

::: check
DGNSS and RTK both rely on the atmosphere cancelling over a short baseline. Why does RTK need much shorter baselines?
:::

::: answer
DGNSS only needs the leftover atmosphere to be small next to its target of about a meter, a loose demand. RTK's integer search needs the leftover to be small next to a fraction of a carrier wavelength — centimeters — because it can only pick the right integer, and pass its ratio test, when the float solution is already close enough that the right integer clearly wins. A leftover that is harmless at the meter level can be big enough to flip which integer looks best. So RTK baselines are measured in tens of kilometers, while DGNSS corrections stay useful over distances about ten times larger.
:::

## Summary

| Idea | Meaning | Formula or fact |
| --- | --- | --- |
| Single difference | Two receivers, one satellite | $\nabla\rho^i = \rho_A^i - \rho_B^i$; cancels satellite clock; $\sigma_{\nabla\rho} = \sqrt2\,\sigma$ |
| Double difference | Two receivers, two satellites | $\nabla\Delta\rho^{ij} = \nabla\rho^i - \nabla\rho^j$; also cancels receiver clocks; $\sigma_{\nabla\Delta\rho} = 2\sigma$; $\mathrm{Cov} = 2\sigma^2$ with a shared reference |
| DGNSS | Code corrections from a surveyed base | Meter to decimeter; worse with distance and age |
| RTK | Double-differenced carrier, integers fixed | Centimeter; baseline limited by atmosphere |
| PPP | Precise orbits and clocks, no base | Estimates ionosphere and zenith wet delay; decimeter after tens of minutes |
| RTK baseline Jacobian | Slopes for the baseline | Row $i$: $\mathbf{e}_i(\mathbf{x}_B) - \mathbf{e}_{\mathrm{ref}}(\mathbf{x}_B)$; three unknowns, no clock |

Every technique here assumed a receiver sitting still or moving gently near Earth's surface. The next two lessons drop that assumption: first a receiver above the constellation, then one riding a launch vehicle through the harshest motion any GNSS receiver has to survive.

::: context accuracy-ladder Four rungs of accuracy
Each technique buys roughly a factor of ten over the one before. The bars show typical horizontal accuracy on a log scale, where each tick is ten times the last.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <line x1="80" y1="140" x2="300" y2="140" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="80" y1="136" x2="80" y2="144"/><line x1="150" y1="136" x2="150" y2="144"/>
    <line x1="220" y1="136" x2="220" y2="144"/><line x1="290" y1="136" x2="290" y2="144"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="158">1 cm</text><text x="150" y="158">10 cm</text><text x="220" y="158">1 m</text><text x="290" y="158">10 m</text>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="end">
    <text x="72" y="30">standalone</text><text x="72" y="60">DGNSS</text><text x="72" y="90">PPP</text><text x="72" y="120">RTK</text>
  </g>
  <rect x="220" y="20" width="48.9" height="14" fill="#6c7a93"/>
  <rect x="150" y="50" width="70" height="14" fill="#f2b880"/>
  <rect x="128.9" y="80" width="42.2" height="14" fill="#8fb8f0"/>
  <rect x="80" y="110" width="33.4" height="14" fill="#1d6fd1"/>
</svg>
```

Standalone: 1 to 5 m. DGNSS: 10 cm to 1 m. PPP after convergence: 5 to 20 cm. RTK: 1 to 3 cm.
:::

::: context baseline-picture Two receivers, two satellites, four ranges
A double difference uses four one-way ranges: each receiver to each satellite. The baseline $\mathbf{b}$ from base $A$ to rover $B$ is what RTK solves for.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <g stroke="#8fb8f0" stroke-width="2">
    <line x1="90" y1="30" x2="120" y2="140"/><line x1="90" y1="30" x2="240" y2="140"/>
    <line x1="270" y1="30" x2="120" y2="140"/><line x1="270" y1="30" x2="240" y2="140"/>
  </g>
  <rect x="82" y="22" width="16" height="16" fill="#1f2a44"/>
  <rect x="262" y="22" width="16" height="16" fill="#1f2a44"/>
  <text x="60" y="34" font-size="13" fill="#1f2a44">i</text>
  <text x="290" y="34" font-size="13" fill="#1f2a44">j</text>
  <line x1="120" y1="150" x2="228" y2="150" stroke="#b4232c" stroke-width="3"/>
  <polygon points="240,150 228,144 228,156" fill="#b4232c"/>
  <circle cx="120" cy="140" r="6" fill="#1d6fd1"/>
  <circle cx="240" cy="140" r="6" fill="#1d6fd1"/>
  <text x="120" y="172" font-size="12" text-anchor="middle" fill="#1f2a44">A (base)</text>
  <text x="240" y="172" font-size="12" text-anchor="middle" fill="#1f2a44">B (rover)</text>
  <text x="180" y="168" font-size="13" text-anchor="middle" fill="#b4232c">b</text>
</svg>
```

Real satellites are about $20{,}000\,\mathrm{km}$ up and a baseline a few kilometers, so the two lines to each satellite are almost parallel — which is why their atmosphere nearly matches.
:::

::: context nabla Reading the triangles
$\nabla$ is **nabla**, named after an ancient harp with a triangular frame. $\Delta$ is the Greek capital **delta**, the usual sign for "a difference". In this lesson $\nabla$ marks the difference between two receivers and $\Delta$ the difference between two satellites, so $\nabla\Delta$ is both at once. Books do not agree on which triangle means which; always check a text's own definition before reading its equations.
:::

::: context variances-add Why the noise grows by the square root of two
Independent errors do not add like ordinary numbers, because they are as likely to partly cancel as to pile up. Their typical sizes combine like the sides of a right triangle: two errors of $0.3\,\mathrm{m}$ give a typical total of $\sqrt{0.3^2 + 0.3^2} = 0.424\,\mathrm{m}$, not $0.6\,\mathrm{m}$. Subtracting does the same as adding, because flipping the sign of a random error does not change its size. Four errors give $\sqrt{4} = 2$ times one.
:::

::: context reference-station Corrections by radio, over whole continents
The base knows exactly where it is, so it can tell how wrong each satellite's range is and pass that on.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="172" y="12" width="16" height="16" fill="#1f2a44"/>
  <text x="196" y="25" font-size="12" fill="#1f2a44">satellite</text>
  <line x1="180" y1="28" x2="70" y2="110" stroke="#8fb8f0" stroke-width="2"/>
  <line x1="180" y1="28" x2="290" y2="110" stroke="#8fb8f0" stroke-width="2"/>
  <polygon points="62,120 78,120 70,104" fill="#1d6fd1"/>
  <circle cx="290" cy="114" r="6" fill="#1d6fd1"/>
  <line x1="84" y1="118" x2="272" y2="118" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <polygon points="282,118 270,112 270,124" fill="#b4232c"/>
  <text x="180" y="110" font-size="12" text-anchor="middle" fill="#b4232c">correction</text>
  <text x="70" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">base: known spot</text>
  <text x="290" y="140" font-size="12" text-anchor="middle" fill="#1f2a44">rover</text>
</svg>
```

The United States runs a network of more than a thousand continuously operating reference stations. Aircraft use a continent-wide version called WAAS, whose corrections come down from geostationary satellites.
:::

::: context network-rtk Many bases pretending to be one
A single RTK base covers a circle a few tens of kilometers across. **Network RTK** links many bases. A central computer models how the atmosphere and orbit errors change across the region between them, then builds corrections for a *virtual* base right next to each rover. Farm tractors that steer themselves to within a couple of centimeters, road-building machines and survey crews use these services every day.
:::

::: context precise-products Better orbits, a little later
The **International GNSS Service** (IGS), a voluntary federation of agencies and universities, runs hundreds of tracking stations worldwide. From their data it computes satellite orbits good to a few centimeters and clocks good to a fraction of a nanosecond. The most accurate "final" products come out about two weeks after the fact; faster versions follow within a day, and real-time streams are sent over the internet. A satellite's orbit determined after the fact beats any forecast.
:::

::: context random-walk A delay that wanders slowly
A **random walk** is a quantity that each moment takes a small random step from wherever it was. Water vapor over a site changes like that: not jumping around, but drifting as weather moves through. Modeling the zenith wet delay as a random walk tells the Kalman filter "expect this to change a little, slowly". The size of the steps is the filter's process noise, the same idea the Kalman filter module used for any slowly changing state.
:::

::: context fcb Why PPP's integers are not whole numbers
Each satellite's and receiver's electronics add a small delay to the carrier that is not a whole number of cycles. RTK's double difference cancels these delays. PPP has no second receiver to subtract, so its estimated ambiguities come out as whole numbers plus an unknown fraction. **Fractional-cycle-bias** products, computed by a network and published alongside the precise orbits and clocks, supply the satellite fractions. Remove them, and the leftover ambiguities are whole numbers again, ready for the same integer search as the previous lesson.
:::
