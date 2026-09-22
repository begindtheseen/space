---
id: l09-sensitivity-analysis-and-envelope-coverage
title: Sensitivity analysis and flight-envelope coverage
minutes: 16
covers:
  - 'Sensitivity analysis and driver identification: regression on the dispersion inputs, and scatter plots you actually look at'
  - Flight-envelope coverage and the difference between random coverage and designed coverage
---

A finished campaign answers "did it pass," but a review that stops there has wasted most of what the campaign actually contains. Every one of its ten thousand cases carries a full record of which dispersed inputs were drawn and what happened as a result, and that record answers two further questions a program genuinely needs: which of the dozen or more dispersed parameters actually drove the outcome, worth the engineering effort to tighten — and did the campaign's cases actually cover the part of the flight envelope that matters, or did they cluster somewhere convenient and leave a corner unexamined by chance. This lesson takes up both.

## Finding the drivers by regression

A dispersion set with a hundred parameters produces an output whose sensitivity to any one of them is invisible by inspection — the only way to find out which inputs matter is to regress the output against all of them at once and read off the result. Standardize every input first, so each one is expressed in units of its own standard deviation rather than its natural physical unit: a coefficient on a mass error in kilograms is not comparable to a coefficient on an alignment error in degrees, but a coefficient on each input's own standardized (zero-mean, unit-variance) version is directly comparable, because it answers the same question for every input — how many units does the output move for a one-standard-deviation move in this input.

Fitting $Y \approx \beta_0 + \sum_i \beta_i X_i$ by ordinary least squares against the standardized inputs $X_i$ gives exactly that: a **standardized regression coefficient** per input, and ranking the inputs by $|\beta_i|$ ranks them by how much of the output's variance each one is responsible for, to the extent the true relationship is close to linear over the dispersion's range.

::: example Recovering the true driver ranking from noisy campaign data
A campaign disperses five parameters — wind shear, Isp offset, mass offset, alignment error, and an aerodynamic coefficient — each drawn as an independent standardized Gaussian, and the true (unknown to the analyst) sensitivity of a downrange miss output to each is $\beta = (2.6,\ 1.1,\ -0.7,\ 0.35,\ 0.15)\,\mathrm{m}$ per standard deviation, plus independent measurement and modeling noise with standard deviation $3.0\,\mathrm{m}$.

Fitting the standardized regression to $N=2000$ simulated cases recovers $\hat\beta = (2.514,\ 1.082,\ -0.552,\ 0.320,\ 0.240)$ — every coefficient close to its true value, and, critically, in exactly the same rank order by magnitude as the truth: wind shear dominates, contributing an estimated $79.4\%$ of the explained output variance, Isp offset is second at $14.7\%$, and the remaining three trail well behind. The fitted regression explains only $R^2 = 0.474$ of the total output variance — the rest is noise the regression correctly does not claim to explain — and the ranking is trustworthy anyway, because ranking drivers by standardized coefficient does not require the regression to explain all of the variance, only to estimate each coefficient's relative size without much bias.

```python
import numpy as np

rng = np.random.default_rng(909)
X = rng.standard_normal((2000, 5))               # 5 standardized dispersed inputs
true_beta = np.array([2.6, 1.1, -0.7, 0.35, 0.15])
Y = X @ true_beta + rng.normal(0, 3.0, 2000)

Xd = np.column_stack([np.ones(2000), X])
beta_hat, *_ = np.linalg.lstsq(Xd, Y, rcond=None)
print(np.round(beta_hat[1:], 3))
# [ 2.514  1.082 -0.552  0.32   0.24 ]
```

This is the practical payoff: with a hundred dispersed parameters in a real dispersion set, this ranking is what tells a program which two or three to spend money tightening — the ones with the largest standardized coefficients — rather than spreading limited engineering effort evenly across every parameter the dispersion set happens to list.
:::

A ranked coefficient list is a summary, and summaries hide exactly the cases a summary is least equipped to describe: a genuinely nonlinear relationship, active only past some threshold, can show a small linear regression coefficient while still driving every one of a cluster of failures once the threshold is crossed. This is why a driver analysis is never complete without looking directly at the scatter plot of output against each of the top-ranked inputs — not the coefficient alone, but the actual cloud of points. A clean linear trend confirms the regression's premise. A trend that bends, a cluster of high-output points concentrated at one end of an input's range, or two separated clouds where a linear fit would only ever see their combined average, are all signs a linear coefficient is summarizing something the coefficient itself cannot show, and each is a direct pointer toward the kind of targeted follow-up — a corner-case sweep in exactly that region — the earlier lesson on tail risk described.

::: key
Standardize every dispersed input to zero mean, unit variance, then regress the output against all of them at once; rank drivers by $|\hat\beta_i|$. A low $R^2$ does not invalidate the ranking, but a nonlinear or thresholded relationship can hide inside a small linear coefficient — always look at the scatter for the top-ranked inputs, not only the coefficient table.
:::

## Random coverage versus designed coverage

A dispersed Monte Carlo campaign draws its cases at random from the input distributions, which is exactly what the reliability claims of earlier lessons require — the statistics only hold for genuinely random, independent draws. But "random" and "evenly spread" are not the same property, and a flight envelope has dimensions — Mach number, angle of attack, dynamic pressure, flight time — that a fixed budget of random draws covers unevenly by construction, leaving some regions dense with cases purely by chance and others thin or empty, purely by the same chance.

::: example How much of a two-dimensional envelope fifty random cases actually touch
Divide a Mach–angle-of-attack envelope into a $10\times10$ grid of $100$ cells and draw $50$ points uniformly at random across it. In one specific draw, only $38$ of the $100$ cells receive at least one point; averaged over $200$ independent repeats of the same $50$-point draw, the mean number of distinct cells touched is $39.2$ (standard deviation $2.3$) — a budget of $50$ cases reliably leaves more than sixty cells of the envelope completely unsampled, not as a rare event but as the ordinary behavior of random placement, because the same cell being hit twice by chance is exactly as likely as an empty cell going untouched.

A **designed** sweep of the identical $50$-point budget — a $5\times10$ factorial, five deliberately chosen Mach levels crossed against all ten angle-of-attack bins — instead touches exactly $50$ distinct cells, covering every one of the ten angle-of-attack bins and five of the ten Mach bins completely, by construction rather than by chance. The same number of evaluations produces structural coverage the random draw cannot guarantee at any budget short of exhaustively filling the grid.

```python
import numpy as np

hits = []
for seed in range(200):
    rng = np.random.default_rng(seed)
    pts = rng.uniform(0, 10, size=(50, 2))
    hits.append(len({(int(p[0]), int(p[1])) for p in pts}))
print(np.mean(hits), np.std(hits))
# 39.17 2.29   (of 100 cells, from a 50-point random draw)
```
:::

The two sampling strategies are not competitors for the same job — they answer different questions and a complete verification effort needs both. Random sampling from the true dispersion distributions is what makes the reliability-claim statistics of the earlier lessons in this module valid at all; replacing it with a deliberately structured grid would answer a different question (does the vehicle survive these chosen points) while invalidating the probabilistic one (what is the reliability). Designed coverage answers the complementary question the random campaign cannot: has every part of the operating envelope actually been looked at, including the corners a modest random budget is likely to have missed by chance. In practice this means the reliability claim is carried by the random dispersed campaign, while a separate, deliberately gridded sweep — dense in the dimensions that matter operationally, such as flight time and dynamic pressure — checks that no region of the envelope was left unexamined only because the random draws happened not to land there. The margin sweep the next lesson builds is exactly this kind of designed coverage, run across flight time rather than left to chance.

::: warning A clean random campaign does not mean the whole envelope was checked
Ten thousand clean random cases support a strong reliability claim about the distribution actually sampled — they say nothing about a narrow region of the envelope that, by chance, none of the ten thousand draws happened to visit. A requirement that depends on behavior across the whole envelope, such as a stability margin that must hold at every flight time, needs an explicit, designed sweep across that dimension in addition to the random dispersed campaign, not in place of it.
:::

## Check yourself

::: check
Why must the dispersed inputs be standardized to zero mean and unit variance before comparing their regression coefficients to rank driver importance?
:::

::: answer
A coefficient's raw magnitude depends on the physical units and natural scale of its input — a coefficient on a mass error measured in kilograms is not comparable to one on an alignment error measured in degrees, since a "one-unit" change means something completely different in each case. Standardizing every input to zero mean and unit variance puts every coefficient in the same units — output change per one standard deviation of input change — which is the only basis on which comparing coefficient magnitudes to rank importance is meaningful.
:::

::: check
A driver-ranking regression achieves $R^2 = 0.47$. Does this low value invalidate the ranking of the standardized coefficients, and why or why not?
:::

::: answer
Not necessarily: $R^2$ measures how much of the total output variance the linear fit explains, which is reduced by any genuine noise or unmodeled variability in the output regardless of how accurately the fit estimates each coefficient's relative size. As the worked example showed, a regression with $R^2=0.474$ still recovered the true driver ranking correctly, because the noise was independent of the inputs and did not bias the coefficient estimates — a low $R^2$ is a reason to look more closely at whether important structure is missing, not an automatic invalidation of the ranking itself.
:::

::: check
A regression on a dispersed input returns a small standardized coefficient, but a scatter plot of output against that input shows a cluster of high-output points concentrated at one extreme of the input's range. Reconcile these two observations and say what to do next.
:::

::: answer
A small linear coefficient reports only the best-fit straight-line slope averaged across the input's whole range; it is fully consistent with a relationship that is nearly flat over most of that range and only becomes strongly influential past a threshold near one extreme, since a small number of high-leverage points at one end do not move an average linear slope very much. The correct next step is to treat that input as a suspect for a nonlinear or thresholded effect and investigate the clustered high-output cases directly — replaying them, as the tail-risk lesson described, rather than trusting the small linear coefficient to mean the input is unimportant.
:::

::: check
Explain why replacing random Monte Carlo sampling with a deliberately designed grid across the whole dispersion set would break the reliability claims from earlier in this module, even though the grid provides better envelope coverage.
:::

::: answer
The zero-failure formula and the confidence-interval machinery built earlier in this module require the campaign's cases to be independent, identically distributed draws from the actual dispersion distributions — a probabilistic sampling assumption a deliberately chosen grid does not satisfy, since a grid point is picked for its position, not drawn according to the probability of that combination actually occurring. A grid can certify that the vehicle survives the specific points tested, exactly as a corner-case analysis does, but it cannot support a probabilistic reliability claim, which needs the random sampling a designed grid deliberately replaces.
:::

::: check
A ten-thousand-case random dispersed campaign reports zero failures and a strong reliability claim. A separate reviewer asks whether the vehicle's stability margin has been checked at every point along the nominal flight time. Is the clean Monte Carlo result sufficient to answer that question, and if not, what additional evidence is needed?
:::

::: answer
It is not sufficient: a random dispersed campaign samples flight conditions according to the dispersion distributions, not systematically across flight time, so it is entirely possible that a narrow window of flight time was rarely or never landed on by chance across all ten thousand cases, leaving that window's margin behavior effectively unexamined by the campaign. Answering the reviewer's question needs a separate, deliberately designed sweep across flight time — evaluating the margin at closely and evenly spaced points along the whole trajectory, as a dedicated coverage exercise rather than relying on wherever the random draws happened to land.
:::

## Summary

| Item | Statement |
| --- | --- |
| Standardized regression coefficient | Regress output on zero-mean, unit-variance inputs; rank drivers by $|\hat\beta_i|$ |
| What a low $R^2$ does and does not mean | Reflects unexplained (often genuine) noise; does not by itself invalidate a correctly estimated coefficient ranking |
| Why look at the scatter | A small linear coefficient can hide a real nonlinear or thresholded effect concentrated in part of the input's range |
| Random coverage | Required for the probabilistic reliability claim; leaves envelope gaps by chance — $50$ random points left $60+$ of $100$ grid cells untouched in the worked example |
| Designed coverage | A deliberate grid or factorial sweep guarantees structural coverage of the envelope, at the cost of no longer supporting a probabilistic claim on its own |
| Practice | Random dispersed campaign carries the reliability claim; a separate designed sweep (e.g. across flight time) checks that no region of the envelope was left unexamined |

Flight time is exactly the dimension the next lesson sweeps deliberately, for the requirement that matters most across it: a stability margin that has to hold not only at the nominal design point, but everywhere between liftoff and the end of powered flight.
