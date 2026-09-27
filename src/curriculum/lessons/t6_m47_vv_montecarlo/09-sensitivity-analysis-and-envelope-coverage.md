---
id: l09-sensitivity-analysis-and-envelope-coverage
title: Sensitivity analysis and flight-envelope coverage
minutes: 18
covers:
  - 'Sensitivity analysis and driver identification: regression on the dispersion inputs, and scatter plots you actually look at'
  - Flight-envelope coverage and the difference between random coverage and designed coverage
---

Imagine you bake a hundred batches of cookies. Each time the oven runs a little hot or cold, the timer is off by a bit, and the scoop of sugar is a little big or small. You write it all down, along with how crispy each batch came out. Now a friend asks: "What actually makes them crispy?" The answer is hiding in your notebook. You just have to dig it out.

A finished Monte Carlo campaign is that notebook. It answers "did it pass?" But a review that stops there throws away most of what the campaign holds. Every one of its ten thousand cases records which dispersed inputs were drawn and what happened as a result. That record answers two more questions a program really needs:

- **Which inputs drove the outcome?** Out of a dozen or a hundred dispersed parameters, which few are worth the engineering effort to tighten?
- **Did the campaign look everywhere?** Did its cases cover the whole part of the flight envelope that matters, or did they cluster somewhere and leave a corner unexamined, purely by chance?

This lesson takes up both.

## Finding the drivers by regression

With a hundred dispersed parameters, you cannot see by eye how much the output depends on any one of them. The way to find out is to fit all of them at once and read off the result. That fitting is called **[[regression|least-squares]]**: finding the straight-line formula that best predicts the output from the inputs.

**Standardize first.** Back to the cookies. Is one degree of oven heat more important than one gram of sugar? That question has no answer — a degree and a gram are different things. A better question is: is a *typical* wobble in oven heat more important than a *typical* wobble in sugar? That one you can answer.

So before fitting, **[[standardize|z-score]]** every input: subtract its mean and divide by its standard deviation. Each standardized input has mean zero and standard deviation one, and it is measured in "standard deviations of itself". A mass error in kilograms and an alignment error in degrees become directly comparable, because each coefficient now answers the same question: how far does the output move when this input moves by one of its own standard deviations?

**Fit.** With standardized inputs $X_1, X_2, \ldots$ and output $Y$, fit

$$
Y \approx \beta_0 + \sum_i \beta_i X_i
$$

by **ordinary least squares** — choose the $\beta$ values (read "beta") that make the sum of squared prediction errors as small as possible. Read $\sum_i$ as "the sum over all inputs $i$". Each $\beta_i$ is a **standardized regression coefficient**: the output change per one-standard-deviation change in input $i$. A hat on top, $\hat\beta_i$ ("beta hat"), marks the value estimated from data rather than the true one.

**Rank.** Sort the inputs by $|\hat\beta_i|$, the size of the coefficient ignoring its sign. That ranks them by how much of the output's variance each one causes — as far as the true relationship is close to a straight line over the dispersion's range.

When the inputs are independent, you can say exactly how much. Each standardized input has variance $1$, so the fitted part of the output has variance $\sum_i \beta_i^2$, and input $i$'s **share of the explained variance** is

$$
\frac{\beta_i^2}{\sum_j \beta_j^2}.
$$

::: example Recovering the true driver ranking from noisy campaign data
A campaign disperses five parameters: wind shear, $I_{sp}$ offset, mass offset, alignment error, and an aerodynamic coefficient. Each is drawn as an independent standardized Gaussian. The true sensitivities of a downrange miss to each — unknown to the analyst — are

$$
\beta = (2.6,\ 1.1,\ -0.7,\ 0.35,\ 0.15)\,\mathrm{m}\ \text{per standard deviation},
$$

plus independent measurement and modeling **noise** with standard deviation $3.0\,\mathrm{m}$.

**Fit.** Regressing $N = 2000$ simulated cases recovers

$$
\hat\beta = (2.514,\ 1.082,\ -0.552,\ 0.320,\ 0.240)\,\mathrm{m}.
$$

Each estimate is close to its true value. More important, the order by size is exactly the true order.

**Shares.** Square each estimate and divide by the total: wind shear carries $2.514^2 / \sum_j \hat\beta_j^2 = 79.4\%$ of the explained variance, $I_{sp}$ offset $14.7\%$, and the other three together less than $6\%$.

**How much is explained?** The fit's **[[coefficient of determination|r-squared]]** is $R^2 = 0.474$: the straight-line formula explains $47.4\%$ of the output's total variance. The rest is the noise, which the fit correctly does not claim. As a check, the true value is $\sum \beta_i^2 / (\sum \beta_i^2 + 3.0^2) = 8.60 / 17.60 = 0.489$, close to what the fit found.

**Sanity check.** A low $R^2$ did not spoil the ranking. Ranking drivers does not need the fit to explain everything. It needs each coefficient's *relative size* to be estimated without much bias, and noise that is independent of the inputs adds scatter without adding bias.

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

This is the payoff. With a hundred parameters in a real dispersion set, this ranking tells a program which two or three to **[[spend money on|driver-actions]]**, instead of spreading limited effort evenly over every parameter on the list.
:::

### Look at the scatter, not only the table

A ranked list of coefficients is a summary, and summaries hide exactly the cases they are worst at describing. Picture an input that does nothing at all over most of its range, then suddenly matters past some **threshold**. A straight-line fit averages over the whole range, so it can report a small coefficient — while that input drives every case in a cluster of failures past the threshold.

That is why a driver analysis is never complete without the **[[scatter plot|threshold-scatter]]**: output plotted against each top-ranked input, one dot per case. Look at the actual cloud of points, not only the number.

- A clean straight trend confirms what the regression assumed.
- A trend that bends, a clump of high-output points bunched at one end of an input's range, or two separate clouds where a straight line only sees their average — each means the coefficient is summarizing something it cannot show.

Each of those patterns points to a targeted follow-up: a corner-case sweep in exactly that region, as the tail-risk lesson described.

::: key
Standardize every dispersed input to zero mean, unit variance, then regress the output against all of them at once; rank drivers by $|\hat\beta_i|$. A low $R^2$ does not invalidate the ranking, but a nonlinear or thresholded relationship can hide inside a small linear coefficient — always look at the scatter for the top-ranked inputs, not only the coefficient table.
:::

::: warning Ranking by raw coefficients
Skipping the standardizing step is the classic slip. A raw coefficient on a mass error in kilograms and one on a misalignment in degrees depend on the units chosen: change degrees to radians and that coefficient jumps by a factor of $57.3$ while nothing physical changed. Only standardized coefficients can be ranked against each other.
:::

## Random coverage versus designed coverage

Picture tossing a handful of seeds over a garden marked into square plots. Some plots get three seeds, and some get none — not because anyone chose, but because that is what random tossing does. Planting in neat rows instead puts a seed in every plot you pick, every time.

A dispersed Monte Carlo campaign tosses. It draws cases at random from the input distributions, which is exactly what the reliability claims of earlier lessons need — those statistics hold only for random, independent draws. But "random" is not the same as "evenly spread". A **[[flight envelope|flight-envelope]]** — the range of conditions the vehicle must handle — has dimensions such as Mach number, angle of attack, dynamic pressure and flight time. A fixed budget of random draws covers it unevenly: some regions dense with cases purely by chance, others thin or empty by the same chance.

::: example How much of an envelope fifty random cases touch
Divide a Mach–angle-of-attack envelope into a $10\times10$ grid of $100$ cells. Draw $50$ points uniformly at random across it.

**One draw.** With seed $0$, the $50$ points land in only $35$ different cells.

**Many draws.** Repeat with $200$ different seeds. On average, $39.2$ cells are touched, with a standard deviation of $2.3$. So a $50$-case budget reliably leaves about sixty cells of the envelope completely unsampled. This is not bad luck. It is the ordinary behavior of random placement: some points land in cells already hit, and every such double hit is a point that did not go to an empty cell.

**A designed sweep.** Spend the same $50$ points as a **[[factorial|factorial]]** design: pick five Mach levels on purpose and cross each with all ten angle-of-attack bins, $5 \times 10 = 50$. Now exactly $50$ different cells are touched — every angle-of-attack bin, at each of five chosen Mach bins — by construction, not by chance. The same number of runs gives structural coverage that a random draw cannot promise at any budget short of filling the whole grid.

```python
import numpy as np

hits = []
for seed in range(200):
    rng = np.random.default_rng(seed)
    pts = rng.uniform(0, 10, size=(50, 2))
    hits.append(len({(int(p[0]), int(p[1])) for p in pts}))
print(hits[0], np.mean(hits), np.std(hits))
# 35 39.175 2.2944225853142224   (cells touched, of 100)
```

**Sanity check.** Fewer than $50$ cells, as there must be whenever two points share a cell; and far fewer than $100$, as the grid has twice as many cells as points.
:::

::: note Why about 39 cells, and not 50
Take any one cell. A single random point misses it with probability $99/100 = 0.99$. The $50$ points are independent, so all of them miss it with probability $0.99^{50} = 0.605$. So each cell is touched with probability $1 - 0.605 = 0.395$, and across $100$ cells the expected number touched is

$$
100\,(1 - 0.99^{50}) = 39.5.
$$

The $200$-seed average of $39.2$ matches that, within its own scatter. To expect to touch $95$ of the cells you would need $n$ with $0.99^{n} = 0.05$, which is $n = \ln 0.05 / \ln 0.99 \approx 298$ random points — six times the designed budget.
:::

The two sampling styles are not rivals for the same job. They answer different questions, and a complete verification effort needs both.

- **Random sampling** from the true dispersion distributions is what makes the reliability statistics of earlier lessons valid at all. Swap it for a chosen grid and you answer a different question (does the vehicle survive these points?) while losing the probabilistic one (what is the reliability?).
- **Designed coverage** answers the question the random campaign cannot: has every part of the operating envelope actually been looked at, including corners a modest random budget probably missed? (There is also a **[[middle road|latin-hypercube]]** that is partly both.)

In practice, the random dispersed campaign carries the reliability claim. A separate, deliberately gridded sweep — dense in the dimensions that matter operationally, such as flight time and dynamic pressure — checks that no region was left unexamined only because the random draws did not land there. The margin sweep in the next lesson is exactly this kind of designed coverage, run across flight time instead of left to chance.

::: warning A clean random campaign does not mean the whole envelope was checked
Ten thousand clean random cases support a strong reliability claim about the distribution actually sampled. They say nothing about a narrow region that, by chance, none of the ten thousand draws visited. A requirement that must hold across the whole envelope — such as a stability margin that must hold at every flight time — needs an explicit, designed sweep across that dimension in addition to the random campaign, not in place of it.
:::

## Check yourself

::: check
Why must the dispersed inputs be standardized to zero mean and unit variance before their regression coefficients are compared to rank drivers?
:::

::: answer
A raw coefficient's size depends on the physical units and natural scale of its input. A coefficient on a mass error in kilograms cannot be compared with one on an alignment error in degrees, because "one unit" means something completely different in each. Standardizing every input puts every coefficient in the same units — output change per one standard deviation of that input — and that is the only basis on which comparing their sizes to rank importance makes sense.
:::

::: check
A driver-ranking regression has $R^2 = 0.47$. Does this low value invalidate the ranking of the standardized coefficients? Why or why not?
:::

::: answer
Not necessarily. $R^2$ is the fraction of the output's total variance that the straight-line fit explains, and any real noise or unmodeled variation in the output lowers it — however accurately the fit estimates each coefficient's relative size. In the worked example, a regression with $R^2 = 0.474$ still recovered the true ranking exactly, because the noise was independent of the inputs and did not bias the coefficients. A low $R^2$ is a reason to look harder for missing structure, not an automatic verdict against the ranking.
:::

::: check
A regression gives an input a small standardized coefficient, but the scatter plot of output against that input shows a cluster of high-output points bunched at one extreme of its range. Reconcile the two and say what to do next.
:::

::: answer
A small linear coefficient reports only the best straight-line slope averaged across the input's whole range. That fits perfectly well with a relationship that is nearly flat over most of the range and only becomes strong past a threshold near one end: a few high-leverage points at one end do not move an average slope much. Treat the input as a suspect for a nonlinear or thresholded effect. Investigate the clustered high-output cases directly — replay them, as the tail-risk lesson described — rather than trusting the small coefficient to mean the input is unimportant.
:::

::: check
Replacing random Monte Carlo sampling with a deliberately designed grid across the whole dispersion set gives better envelope coverage. Explain why it would still break the reliability claims from earlier in this module.
:::

::: answer
The zero-failure formula and the confidence-bound machinery from earlier lessons require the cases to be independent draws from the actual dispersion distributions. A grid does not satisfy that: a grid point is chosen for its position, not drawn with the probability that combination actually occurs. A grid can certify that the vehicle survives the specific points tested, just as a corner-case analysis does, but it cannot support a probabilistic reliability claim, which needs the random sampling the grid replaced.
:::

::: check
A ten-thousand-case random campaign reports zero failures and a strong reliability claim. A reviewer asks whether the stability margin has been checked at every point along the nominal flight time. Does the clean Monte Carlo result answer that? If not, what evidence is needed?
:::

::: answer
It does not. A random campaign samples flight conditions according to the dispersion distributions, not systematically across flight time. A narrow window of flight time could have been rarely or never landed on by chance across all ten thousand cases, leaving the margin there effectively unexamined. Answering the reviewer needs a separate, deliberately designed sweep across flight time — the margin evaluated at closely and evenly spaced points along the whole trajectory — as a dedicated coverage exercise, not reliance on wherever the random draws happened to land.
:::

## Summary

| Item | Statement |
| --- | --- |
| Standardized regression coefficient | Regress output on zero-mean, unit-variance inputs; rank drivers by $|\hat\beta_i|$ |
| Share of explained variance | $\beta_i^2 / \sum_j \beta_j^2$ for independent standardized inputs ($79.4\%$ for wind shear in the example) |
| What a low $R^2$ does and does not mean | Reflects unexplained (often genuine) noise; does not by itself invalidate a correctly estimated ranking |
| Why look at the scatter | A small linear coefficient can hide a real nonlinear or thresholded effect in part of the input's range |
| Random coverage | Required for the probabilistic reliability claim; leaves gaps by chance — $50$ random points touch only about $39$ of $100$ cells, $100(1-0.99^{50})$ on average |
| Designed coverage | A deliberate grid or factorial sweep guarantees structural coverage, but on its own supports no probabilistic claim |
| Practice | The random dispersed campaign carries the reliability claim; a separate designed sweep (for example across flight time) checks that no region was left unexamined |

Flight time is exactly the dimension the next lesson sweeps on purpose, for the requirement that matters most along it: a stability margin that must hold not only at the nominal design point but everywhere from liftoff to the end of powered flight.

::: context least-squares Why "least squares"
Draw a straight line through a cloud of points. For each point, the vertical gap between the point and the line is that point's **residual** — how wrong the line's prediction is. Least squares picks the one line that makes the sum of the *squared* residuals as small as possible. Squaring makes every gap count as positive and punishes big misses much more than small ones. Carl Friedrich Gauss and Adrien-Marie Legendre both published the method around 1805–1809, to fit the orbits of planets and comets to telescope sightings — so it has been an aerospace tool from the start.
:::

::: context z-score Comparing across different scales
Standardizing turns a value into a **z-score**: how many standard deviations it sits above or below its own average. It is how you compare a $92$ on an easy test with an $81$ on a hard one. If the easy test averaged $85$ with a spread of $7$, the $92$ is $z = (92 - 85)/7 = 1.0$. If the hard test averaged $66$ with a spread of $10$, the $81$ is $z = (81 - 66)/10 = 1.5$ — the more impressive score, even though the number is lower.
:::

::: context r-squared What R² measures
$R^2$, read "R squared", is the fraction of the output's variance that the fitted formula accounts for. $R^2 = 1$ means the formula predicts every case exactly; $R^2 = 0$ means it does no better than guessing the average every time. In a Monte Carlo driver study, part of the output always comes from things the regression does not include — unmodeled effects, noise, many tiny inputs — so an $R^2$ well below $1$ is normal. What matters for ranking is whether the coefficients themselves are unbiased.
:::

::: context driver-actions What a program does with a top driver
Once a driver is found, there are three kinds of fix. **Tighten the hardware**: buy a better sensor, calibrate more carefully, or screen parts so their spread shrinks. **Change the design**: make the vehicle less sensitive to that input, for example by adding control authority or changing the guidance law. **Carry the margin**: accept the spread and hold enough reserve to absorb it. Each costs something different — money, schedule or payload — and the ranking tells you where that spending buys the most.
:::

::: context threshold-scatter A threshold hiding in a scatter
Sixty simulated cases. The output barely responds to the input until it passes a threshold (dashed), then climbs steeply. The best straight line (red) splits the difference: too steep for the flat part, far too shallow for the five cases past the threshold, which are the ones that matter.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 190" font-family="Inter, Arial, sans-serif">
  <line x1="30" y1="170" x2="345" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="30" y1="170" x2="30" y2="15" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="340" y="185" font-size="11" text-anchor="end" fill="#1f2a44">input (std devs)</text>
  <text x="36" y="24" font-size="11" fill="#1f2a44">output</text>
  <line x1="236.4" y1="20" x2="236.4" y2="170" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="232" y="34" font-size="11" text-anchor="end" fill="#6c7a93">threshold</text>
  <g fill="#1d6fd1">
    <circle cx="51.3" cy="144.7" r="3"/> <circle cx="194.1" cy="145.9" r="3"/> <circle cx="146.7" cy="135.8" r="3"/> <circle cx="152.3" cy="155.1" r="3"/> <circle cx="163.7" cy="146.8" r="3"/> <circle cx="77.0" cy="139.1" r="3"/> <circle cx="162.9" cy="132.4" r="3"/> <circle cx="132.5" cy="156.8" r="3"/> <circle cx="184.8" cy="137.3" r="3"/> <circle cx="157.1" cy="145.0" r="3"/> <circle cx="160.5" cy="129.4" r="3"/> <circle cx="141.9" cy="149.7" r="3"/> <circle cx="123.4" cy="139.6" r="3"/> <circle cx="155.2" cy="148.1" r="3"/> <circle cx="197.1" cy="129.2" r="3"/> <circle cx="162.5" cy="140.6" r="3"/> <circle cx="220.0" cy="140.7" r="3"/> <circle cx="164.4" cy="152.4" r="3"/> <circle cx="175.2" cy="128.2" r="3"/> <circle cx="200.2" cy="133.6" r="3"/> <circle cx="149.7" cy="133.0" r="3"/> <circle cx="165.2" cy="137.9" r="3"/> <circle cx="199.9" cy="143.4" r="3"/> <circle cx="161.1" cy="146.1" r="3"/> <circle cx="162.3" cy="130.9" r="3"/> <circle cx="222.1" cy="148.2" r="3"/> <circle cx="131.4" cy="145.9" r="3"/> <circle cx="160.0" cy="142.8" r="3"/> <circle cx="216.4" cy="136.7" r="3"/> <circle cx="201.9" cy="134.8" r="3"/> <circle cx="178.4" cy="148.6" r="3"/> <circle cx="206.2" cy="150.8" r="3"/> <circle cx="38.2" cy="145.7" r="3"/> <circle cx="223.0" cy="129.5" r="3"/> <circle cx="127.9" cy="136.6" r="3"/> <circle cx="93.9" cy="141.8" r="3"/> <circle cx="187.3" cy="141.7" r="3"/> <circle cx="207.6" cy="136.5" r="3"/> <circle cx="152.7" cy="142.6" r="3"/> <circle cx="122.3" cy="136.4" r="3"/> <circle cx="175.3" cy="145.5" r="3"/> <circle cx="171.5" cy="139.2" r="3"/> <circle cx="209.9" cy="134.7" r="3"/> <circle cx="183.3" cy="138.0" r="3"/> <circle cx="227.4" cy="119.9" r="3"/> <circle cx="164.1" cy="129.9" r="3"/> <circle cx="129.6" cy="131.4" r="3"/> <circle cx="202.0" cy="153.1" r="3"/> <circle cx="202.0" cy="141.2" r="3"/> <circle cx="163.7" cy="144.7" r="3"/> <circle cx="136.4" cy="137.8" r="3"/> <circle cx="185.0" cy="155.5" r="3"/> <circle cx="54.3" cy="136.8" r="3"/> <circle cx="207.1" cy="131.2" r="3"/> <circle cx="197.6" cy="148.1" r="3"/>
  </g>
  <g fill="#b4232c">
    <circle cx="272.0" cy="98.8" r="3.5"/> <circle cx="333.5" cy="31.8" r="3.5"/> <circle cx="248.2" cy="104.8" r="3.5"/> <circle cx="266.9" cy="97.8" r="3.5"/> <circle cx="241.5" cy="117.3" r="3.5"/>
  </g>
  <line x1="30" y1="165.5" x2="342" y2="101.9" stroke="#b4232c" stroke-width="2"/>
  <text x="300" y="124" font-size="11" fill="#b4232c">fitted line</text>
</svg>
```
:::

::: context flight-envelope The box a vehicle must fly in
The **flight envelope** is the set of conditions a vehicle is designed to handle — how fast (Mach number, speed compared with the speed of sound), at what angle to the oncoming air (**angle of attack**), under how much air pressure from its own motion (**dynamic pressure**), and when in the flight. Aircraft engineers draw it as a boundary on a chart of speed against altitude. A rocket's envelope changes second by second as it burns propellant and climbs, which is why flight time is one of its most important dimensions.
:::

::: context factorial Planting in rows
A **factorial design** tests every combination of chosen levels: here $5$ Mach levels times $10$ angle-of-attack levels. The statistician Ronald Fisher developed these designs for crop experiments at the Rothamsted agricultural station in England in the 1920s. Left: $50$ random points (seed $0$) touch $35$ cells. Right: the $5 \times 10$ design touches $50$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <g fill="#8fb8f0">
    <rect x="20" y="155" width="15" height="15"/><rect x="20" y="140" width="15" height="15"/><rect x="20" y="80" width="15" height="15"/><rect x="20" y="35" width="15" height="15"/><rect x="35" y="50" width="15" height="15"/><rect x="35" y="20" width="15" height="15"/><rect x="50" y="155" width="15" height="15"/><rect x="50" y="95" width="15" height="15"/><rect x="50" y="65" width="15" height="15"/><rect x="65" y="140" width="15" height="15"/><rect x="65" y="35" width="15" height="15"/><rect x="80" y="140" width="15" height="15"/><rect x="80" y="95" width="15" height="15"/><rect x="80" y="50" width="15" height="15"/><rect x="80" y="35" width="15" height="15"/><rect x="80" y="20" width="15" height="15"/><rect x="95" y="110" width="15" height="15"/><rect x="95" y="50" width="15" height="15"/><rect x="95" y="20" width="15" height="15"/><rect x="110" y="125" width="15" height="15"/><rect x="110" y="110" width="15" height="15"/><rect x="110" y="65" width="15" height="15"/><rect x="110" y="50" width="15" height="15"/><rect x="110" y="20" width="15" height="15"/><rect x="125" y="140" width="15" height="15"/><rect x="125" y="125" width="15" height="15"/><rect x="125" y="95" width="15" height="15"/><rect x="125" y="20" width="15" height="15"/><rect x="140" y="155" width="15" height="15"/><rect x="140" y="80" width="15" height="15"/><rect x="140" y="35" width="15" height="15"/><rect x="140" y="20" width="15" height="15"/><rect x="155" y="110" width="15" height="15"/><rect x="155" y="95" width="15" height="15"/><rect x="155" y="20" width="15" height="15"/>
    <rect x="190" y="20" width="15" height="150"/><rect x="220" y="20" width="15" height="150"/><rect x="250" y="20" width="15" height="150"/><rect x="280" y="20" width="15" height="150"/><rect x="310" y="20" width="15" height="150"/>
  </g>
  <g fill="#1f2a44">
    <circle cx="115.5" cy="129.5" r="2"/><circle cx="26.1" cy="167.5" r="2"/><circle cx="142.0" cy="33.1" r="2"/><circle cx="111.0" cy="60.6" r="2"/><circle cx="101.5" cy="29.7" r="2"/><circle cx="142.4" cy="169.6" r="2"/><circle cx="148.6" cy="165.0" r="2"/><circle cx="129.4" cy="143.7" r="2"/><circle cx="149.5" cy="88.8" r="2"/><circle cx="65.0" cy="106.6" r="2"/><circle cx="24.2" cy="151.4" r="2"/><circle cx="120.6" cy="72.9" r="2"/><circle cx="112.3" cy="112.4" r="2"/><circle cx="169.6" cy="22.9" r="2"/><circle cx="122.8" cy="72.4" r="2"/><circle cx="123.3" cy="111.7" r="2"/><circle cx="40.3" cy="61.8" r="2"/><circle cx="98.8" cy="123.5" r="2"/><circle cx="92.9" cy="36.6" r="2"/><circle cx="160.1" cy="116.3" r="2"/><circle cx="105.7" cy="121.7" r="2"/><circle cx="109.1" cy="119.3" r="2"/><circle cx="78.7" cy="36.5" r="2"/><circle cx="54.1" cy="76.5" r="2"/><circle cx="32.6" cy="45.1" r="2"/><circle cx="138.1" cy="134.1" r="2"/><circle cx="151.5" cy="161.2" r="2"/><circle cx="70.4" cy="147.5" r="2"/><circle cx="87.6" cy="50.6" r="2"/><circle cx="54.6" cy="162.2" r="2"/><circle cx="80.7" cy="140.2" r="2"/><circle cx="33.6" cy="83.0" r="2"/><circle cx="64.8" cy="69.2" r="2"/><circle cx="49.9" cy="28.7" r="2"/><circle cx="74.8" cy="154.2" r="2"/><circle cx="114.4" cy="30.9" r="2"/><circle cx="86.1" cy="26.8" r="2"/><circle cx="95.0" cy="106.2" r="2"/><circle cx="113.0" cy="20.7" r="2"/><circle cx="162.3" cy="101.0" r="2"/><circle cx="133.7" cy="95.4" r="2"/><circle cx="99.4" cy="52.1" r="2"/><circle cx="82.2" cy="59.8" r="2"/><circle cx="126.7" cy="30.2" r="2"/><circle cx="37.2" cy="60.6" r="2"/><circle cx="159.1" cy="24.8" r="2"/><circle cx="22.2" cy="40.5" r="2"/><circle cx="167.2" cy="26.4" r="2"/><circle cx="42.3" cy="24.1" r="2"/><circle cx="153.5" cy="46.6" r="2"/>
  </g>
  <g fill="#1f2a44">
    <circle cx="197.5" cy="27.5" r="2"/><circle cx="197.5" cy="42.5" r="2"/><circle cx="197.5" cy="57.5" r="2"/><circle cx="197.5" cy="72.5" r="2"/><circle cx="197.5" cy="87.5" r="2"/><circle cx="197.5" cy="102.5" r="2"/><circle cx="197.5" cy="117.5" r="2"/><circle cx="197.5" cy="132.5" r="2"/><circle cx="197.5" cy="147.5" r="2"/><circle cx="197.5" cy="162.5" r="2"/>
    <circle cx="227.5" cy="27.5" r="2"/><circle cx="227.5" cy="42.5" r="2"/><circle cx="227.5" cy="57.5" r="2"/><circle cx="227.5" cy="72.5" r="2"/><circle cx="227.5" cy="87.5" r="2"/><circle cx="227.5" cy="102.5" r="2"/><circle cx="227.5" cy="117.5" r="2"/><circle cx="227.5" cy="132.5" r="2"/><circle cx="227.5" cy="147.5" r="2"/><circle cx="227.5" cy="162.5" r="2"/>
    <circle cx="257.5" cy="27.5" r="2"/><circle cx="257.5" cy="42.5" r="2"/><circle cx="257.5" cy="57.5" r="2"/><circle cx="257.5" cy="72.5" r="2"/><circle cx="257.5" cy="87.5" r="2"/><circle cx="257.5" cy="102.5" r="2"/><circle cx="257.5" cy="117.5" r="2"/><circle cx="257.5" cy="132.5" r="2"/><circle cx="257.5" cy="147.5" r="2"/><circle cx="257.5" cy="162.5" r="2"/>
    <circle cx="287.5" cy="27.5" r="2"/><circle cx="287.5" cy="42.5" r="2"/><circle cx="287.5" cy="57.5" r="2"/><circle cx="287.5" cy="72.5" r="2"/><circle cx="287.5" cy="87.5" r="2"/><circle cx="287.5" cy="102.5" r="2"/><circle cx="287.5" cy="117.5" r="2"/><circle cx="287.5" cy="132.5" r="2"/><circle cx="287.5" cy="147.5" r="2"/><circle cx="287.5" cy="162.5" r="2"/>
    <circle cx="317.5" cy="27.5" r="2"/><circle cx="317.5" cy="42.5" r="2"/><circle cx="317.5" cy="57.5" r="2"/><circle cx="317.5" cy="72.5" r="2"/><circle cx="317.5" cy="87.5" r="2"/><circle cx="317.5" cy="102.5" r="2"/><circle cx="317.5" cy="117.5" r="2"/><circle cx="317.5" cy="132.5" r="2"/><circle cx="317.5" cy="147.5" r="2"/><circle cx="317.5" cy="162.5" r="2"/>
  </g>
  <rect x="20" y="20" width="150" height="150" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <rect x="190" y="20" width="150" height="150" fill="none" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="95" y="188" font-size="12" text-anchor="middle" fill="#1f2a44">random: 35 cells</text>
  <text x="265" y="188" font-size="12" text-anchor="middle" fill="#1f2a44">designed: 50 cells</text>
  <text x="95" y="13" font-size="11" text-anchor="middle" fill="#6c7a93">Mach →, angle of attack ↑</text>
</svg>
```
:::

::: context latin-hypercube A middle road between the two
There is a well-known compromise called **Latin hypercube sampling**, introduced by McKay, Beckman and Conover in 1979. It splits each input's range into equal-probability slices and makes sure every slice of every input gets exactly one sample, while pairing the slices at random. The result is still random enough for many statistical uses, but it cannot leave a whole slice of any single input empty. Many aerospace Monte Carlo tools offer it as an option — though the zero-failure run-count formula from earlier assumes plain independent draws, so check before mixing the two.
:::
