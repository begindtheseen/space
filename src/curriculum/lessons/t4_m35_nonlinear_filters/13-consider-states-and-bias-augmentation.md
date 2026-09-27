---
id: l13-consider-states-and-bias-augmentation
title: Consider states and bias augmentation
minutes: 20
covers:
  - Consider states and bias augmentation
---

Picture a bathroom scale that might read a little heavy. Maybe it adds a kilogram, maybe two, maybe nothing — you are not sure. You step on it every morning. What should you do about the doubt?

You have three choices. You can pretend the scale is perfect and trust every number to the gram. You can admit "this could be off by a kilogram or two" and widen your error bars, without trying to work out the exact offset. Or you can try to *measure* the offset along with your weight. The third choice sounds best. But here is the catch: standing on that one scale can never tell you whether you gained a kilogram or the scale drifted by a kilogram. Both stories give exactly the same reading.

A spacecraft's sensors have the same problem. A gyro reads a small rate even when the vehicle is still. A star tracker is bolted on a fraction of a degree crooked. A radar's range carries a fixed offset from cable delays. Each of these is a **bias** — a steady error that does not average away like noise. A bias you care about only because it spoils the states you actually want is called a **[[nuisance parameter|nuisance]]**. This lesson compares the three ways a filter can treat one — **ignore** it, **consider** it, or **augment** the state to estimate it — with real numbers, and gives you a test for picking between them. Orbit-determination teams make exactly this choice in **[[real navigation software|deep-space]]** every day.

The Kalman filter module's last lesson met the **consider** idea as the Schmidt-Kalman filter. The Multiplicative EKF lesson in this module used the **augment** idea: its gyro-bias state was a bias added to the filter state, and there that was the right call. Now we put the choices side by side.

## One reading, two unknowns

Here is the simplest problem that shows everything. A target sits at range $r$ (read "r"), in metres, and moves away at a known $2\,\mathrm{m}$ every second. A sensor measures that range, but it adds a constant bias $c$ that nobody knows. Each measurement is

$$
z_k = r_k + c + v_k .
$$

Read it aloud: "z sub k equals r sub k plus c plus v sub k". The little $k$ counts the measurements: $k = 1, 2, 3, \ldots$. The term $v_k$ is ordinary random noise, with a standard deviation $\sigma_v = 3\,\mathrm{m}$ ($\sigma$ is the Greek letter "sigma"; a **standard deviation** is the typical size of a random error).

The bias is not totally unknown. Before any data arrives, we believe $c$ is about $0$, give or take $\sigma_c = 8\,\mathrm m$ — the **prior**, our belief before measuring. Squared, that is a prior variance $\sigma_c^2 = 64\,\mathrm{m^2}$. The starting range is known to $\pm 5\,\mathrm m$, a prior variance of $25\,\mathrm{m^2}$. In the simulation, the true bias is $c_{\text{true}} = 6\,\mathrm m$.

Look at the measurement again. It only ever contains the sum $r + c$. A target $1\,\mathrm m$ farther away and a sensor reading $1\,\mathrm m$ short give the same $z$. When two unknowns can trade off against each other like this, engineers say they are **[[confounded|confounded]]**: tangled together so that the data cannot fully pull them apart. Keep that word in mind; it decides everything below.

## Three strategies, stated precisely

To consider or augment, the filter carries a joint state — the two unknowns stacked into one vector — and a $2 \times 2$ covariance:

$$
\mathbf x = \begin{pmatrix} r \\ c \end{pmatrix}, \qquad
\mathbf P = \begin{pmatrix} P_{rr} & P_{rc} \\ P_{rc} & P_{cc} \end{pmatrix}, \qquad
\mathbf H = \begin{pmatrix} 1 & 1 \end{pmatrix}.
$$

$P_{rr}$ ("P sub r r") is the variance of the range estimate, $P_{cc}$ the variance of the bias estimate, and $P_{rc}$ the **covariance** between them — whether their errors tend to move together. The row $\mathbf H$ says "the measurement is one $r$ plus one $c$". The update uses the usual pieces: the innovation variance $S = \mathbf H\mathbf P\mathbf H^{\mathsf T} + \sigma_v^2$, and the gain $\mathbf K = \mathbf P\mathbf H^{\mathsf T}/S$. The gain has two rows: $K_r$ says how far to move $\hat r$ ("r hat", the estimate of $r$) per metre of surprise, and $K_c$ says how far to move $\hat c$.

::: key Ignore, consider, or augment
**Ignore**: filter state is $r$ alone; $c$ is assumed exactly zero, and its uncertainty never enters $\mathbf S$ or $\mathbf P$ at all. **Consider (Schmidt-Kalman)**: filter state is $(r,c)$ jointly, propagated and folded into $\mathbf S$ normally, but the Kalman **gain's row for $c$ is forced to zero** every cycle — $c$'s own estimate never moves, while its correlation with $r$ still correctly shapes how much $r$'s own uncertainty shrinks. **Augment**: filter state is $(r,c)$ jointly, with an ordinary, unconstrained gain on both rows — $c$ is actively estimated, exactly like any other state.
:::

Back to the scale. Ignore is "trust the scale". Consider is "widen the error bars, but never adjust for the offset". Augment is "try to work out the offset too".

There is one technical point in the consider filter. Once you force $K_c = 0$, the gain is no longer the optimal one. The short covariance update $\mathbf P^+ = (\mathbf I - \mathbf K\mathbf H)\mathbf P^-$ is only true for the optimal gain, so it would now give the wrong answer. The consider filter uses the **[[Joseph form|joseph]]** instead, which is true for *any* gain:

$$
\mathbf P^+ = \mathbf P^- - \mathbf K\mathbf H\mathbf P^- - \mathbf P^-\mathbf H^{\mathsf T}\mathbf K^{\mathsf T} + \mathbf K S\,\mathbf K^{\mathsf T}.
$$

Here $\mathbf P^-$ ("P minus") is the covariance before the update and $\mathbf P^+$ ("P plus") the covariance after it. The augment filter uses the optimal gain, so the short form is fine there.

::: example Three strategies on an identical, weakly observable bias
Run all three filters on the same 40 measurements. The true range starts at $500\,\mathrm m$ and ends at $580\,\mathrm m$. Each filter starts at the true $500\,\mathrm m$, with $\hat c = 0$. After the 40th update:

| strategy | $\hat r$ | error | $P_{rr}$ | error in sigmas | $\hat c$ |
| --- | --- | --- | --- | --- | --- |
| ignore | $586.69\,\mathrm m$ | $+6.69\,\mathrm m$ | $0.34\,\mathrm{m^2}$ | $11.5$ | (n/a) |
| consider | $582.77\,\mathrm m$ | $+2.77\,\mathrm m$ | $18.93\,\mathrm{m^2}$ | $0.64$ | $0.00$ |
| augment | $581.85\,\mathrm m$ | $+1.85\,\mathrm m$ | $18.25\,\mathrm{m^2}$ | $0.43$ | $4.87\,\mathrm m$ |

The "error in sigmas" column is the error divided by the filter's own claimed standard deviation, $|\text{error}|/\sqrt{P_{rr}}$. For ignore: $\sqrt{0.34} \approx 0.58\,\mathrm m$, and $6.69 / 0.58 \approx 11.5$. An honest filter should land within about $1$ to $2$ sigmas most of the time.

**Ignore.** It explains every reading with $r$ alone, so it soaks up nearly the whole $6\,\mathrm m$ bias into $\hat r$. Worse, it claims to know $r$ to $\pm 0.58\,\mathrm m$. Being **[[11.5 standard deviations off|sigma-count]]** means the filter is badly **inconsistent** — its claimed accuracy is a fiction, the kind of failure the Kalman module's NEES test catches.

**Consider.** The error is $0.64$ sigmas: perfectly honest. And it never pretends to know $c$ — $\hat c$ stays at $0$.

**Augment.** Slightly better still ($0.43$ sigmas), and it learns something about the bias: $\hat c = 4.87\,\mathrm m$ against a true $6\,\mathrm m$. Now look at the price. The **[[correlation|correlation]]** between the errors in $\hat r$ and $\hat c$ ends up at $-0.991$, almost exactly $-1$. That is the confounding from the scale story, showing up as a number.

Sanity check: all three filters saw the same data and all three errors are positive, because a positive bias makes the target look farther away. The filter that knew least about the bias (ignore) was fooled the most.
:::

```python
import numpy as np

rng = np.random.default_rng(13)
dt, a = 1.0, 2.0                       # known motion: 2 m farther each second
sigma_v, sigma_c_prior, c_true, r0_true = 3.0, 8.0, 6.0, 500.0

r = r0_true; zs = []
for k in range(40):
    r += a*dt
    zs.append(r + c_true + rng.normal(0, sigma_v))
zs = np.array(zs)

# Ignore: the state is r alone
r_hat, P = r0_true, 5.0**2
for z in zs:
    r_hat += a*dt; P += 0.01
    S = P + sigma_v**2; K = P/S
    r_hat += K*(z-r_hat); P = (1-K)*P
print('ignore  ', r_hat, P)

# Consider: joint (r, c), gain row for c forced to zero, Joseph-form covariance
x, Pj = np.array([r0_true, 0.0]), np.diag([5.0**2, sigma_c_prior**2])
for z in zs:
    x = x + np.array([a*dt, 0.0]); Pj = Pj + np.diag([0.01, 0.0])
    H = np.array([1.0, 1.0]); S = H@Pj@H.T + sigma_v**2
    Kfull = Pj@H.T/S; K = np.array([Kfull[0], 0.0])
    x = x + K*(z - H@x)
    Pj = Pj - np.outer(K, H@Pj) - np.outer(Pj@H, K) + np.outer(K, K)*S
print('consider', x, Pj[0, 0])

# Augment: joint (r, c), ordinary gain on both rows
x2, Pj2 = np.array([r0_true, 0.0]), np.diag([5.0**2, sigma_c_prior**2])
for z in zs:
    x2 = x2 + np.array([a*dt, 0.0]); Pj2 = Pj2 + np.diag([0.01, 0.0])
    H = np.array([1.0, 1.0]); S = H@Pj2@H.T + sigma_v**2
    K = Pj2@H.T/S
    x2 = x2 + K*(z - H@x2); Pj2 = (np.eye(2)-np.outer(K, H))@Pj2
print('augment ', x2, Pj2[0, 0], Pj2[1, 1], Pj2[0, 1]/np.sqrt(Pj2[0, 0]*Pj2[1, 1]))
# ignore   586.686... 0.3387...
# consider [582.768...   0.        ] 18.925...
# augment  [581.845...   4.874...] 18.254... 18.158... -0.991...
```

## Why considering also aims better

You might expect the consider filter to be "ignore, but with honest error bars" — the same guess for $\hat r$, only a wider spread around it. It is not. Its guess was better too: $2.77\,\mathrm m$ of error against ignore's $6.69\,\mathrm m$. Why?

Look at the gain on $r$. The ignore filter believes each reading is a clean look at $r$, blurred only by $3\,\mathrm m$ of noise. So it keeps leaning on the readings: its $K_r$ is still about $0.038$ at the 40th step. Every reading pulls $\hat r$ a little further toward $r + c$, and the bias leaks in.

The consider filter knows every reading also carries an unknown offset worth $\pm 8\,\mathrm m$. After a few readings it has learned $r + c$ about as well as the data allows. Any further surprise could be bias as easily as range, so it stops chasing: its $K_r$ falls from $0.255$ at the first step to $0.039$, then $0.007$, and is down near $0.0002$ by the 40th. It leans on its motion model instead of the biased readings, so less of the bias gets in.

::: warning "Consider" does not mean "ignore, but honest" — it uses the correlation actively
The consider filter's $r$-update is computed from the full joint covariance, cross-term with $c$ included, even though $\hat c$ never moves. That changes how much it trusts each measurement: here its gain on $r$ ends up far *smaller* than the ignore filter's ($0.0002$ against $0.038$), because it knows most of each new surprise could be bias. So it beats ignore on the point estimate as well ($2.77\,\mathrm m$ against $6.69\,\mathrm m$ of error), not only on honesty. The edge is not guaranteed, though: in the lucky case where the bias really is zero, ignoring it gives the better estimate. What considering always buys is error bars you can trust.
:::

## Does more data resolve the bias fully?

If the bias were only *slow* to pin down, a longer run would fix it. Let us test that.

::: example Five times the data, essentially the same bias uncertainty
Run the augmented filter on the same scenario with $40$, $100$, $200$ and $400$ measurements. (The program below draws each run's noise from one continuing random generator, so the four runs see different noise.)

| measurements | augmented $P_{cc}$ | augmented $\hat c$ error |
| --- | --- | --- |
| $40$ | $18.16\,\mathrm{m^2}$ | $-1.13\,\mathrm m$ |
| $100$ | $18.14\,\mathrm{m^2}$ | $-1.67\,\mathrm m$ |
| $200$ | $18.13\,\mathrm{m^2}$ | $-1.33\,\mathrm m$ |
| $400$ | $18.13\,\mathrm{m^2}$ | $-1.43\,\mathrm m$ |

The bias variance started at the prior, $64\,\mathrm{m^2}$. It fell fast at first, then hit a **[[plateau|plateau]]** near $18.1\,\mathrm{m^2}$ and stopped. Its square root is $\sqrt{18.13} \approx 4.26\,\mathrm m$: after 400 readings, the bias is still only known to about $\pm 4\,\mathrm m$. Going from $100$ to $400$ readings — four times the data — bought nothing. The error in $\hat c$ wanders in a $1$ to $1.7\,\mathrm m$ band instead of shrinking toward zero.

This is not a filter that needs more patience. With this measurement, the bias and the range *cannot* be fully separated, no matter how much data arrives. The covariance has settled at exactly the doubt the problem leaves.

Rerun the first program with $200$ in place of $40$ for the other two strategies. Ignore is still badly overconfident ($10.98$ sigmas off). Consider ($0.64$ sigmas, $P_{rr} \approx 20.5\,\mathrm{m^2}$) and augment ($0.28$ sigmas) both stay honest. The consider filter's $P_{rr}$ creeps up slowly, from $18.9$ to $20.5\,\mathrm{m^2}$, because it adds its small process noise every step and has almost stopped correcting. Augment again gives the better point estimate, with the same near-total $r$–$c$ correlation.
:::

```python
import numpy as np

dt, a = 1.0, 2.0
sigma_v, sigma_c_prior, c_true, r0_true = 3.0, 8.0, 6.0, 500.0
rng2 = np.random.default_rng(13)   # one continuing generator, reused (not reset) across the four runs below

for nsteps in [40, 100, 200, 400]:
    r = r0_true; zs2 = []
    for k in range(nsteps):
        r += a*dt
        zs2.append(r + c_true + rng2.normal(0, sigma_v))
    x3, Pj3 = np.array([r0_true, 0.0]), np.diag([5.0**2, sigma_c_prior**2])
    for z in zs2:
        x3 = x3 + np.array([a*dt, 0.0]); Pj3 = Pj3 + np.diag([0.01, 0.0])
        H = np.array([1.0, 1.0]); S = H@Pj3@H.T + sigma_v**2
        K = Pj3@H.T/S
        x3 = x3 + K*(z - H@x3); Pj3 = (np.eye(2)-np.outer(K, H))@Pj3
    print(nsteps, x3[1]-c_true, Pj3[1, 1])
# 40  -1.126 18.158
# 100 -1.666 18.135
# 200 -1.328 18.135
# 400 -1.432 18.135
```

::: note Why it has to be true: the floor under the bias variance
Ignore the tiny process noise for a moment, so $r$ moves only by the known $2\,\mathrm m$ steps. Then every reading measures the same combination, $s = r_0 + c$ (the starting range plus the bias), with fresh noise. Infinitely many readings would pin $s$ down exactly — and still tell you nothing about how $s$ splits into $r_0$ and $c$.

So the best possible knowledge of $c$ is: "$c = s - r_0$, with $s$ known exactly and $r_0$ known only from its prior". Before the data, $r_0$ and $c$ are independent with variances $\sigma_r^2 = 25$ and $\sigma_c^2 = 64$. Learning their sum exactly leaves, by the standard rule for two independent Gaussians,

$$
P_{cc,\min} = \frac{\sigma_r^2\,\sigma_c^2}{\sigma_r^2 + \sigma_c^2} = \frac{25 \times 64}{25 + 64} = \frac{1600}{89} \approx 17.98\,\mathrm{m^2}.
$$

That is the floor. The filter's plateau, $18.13\,\mathrm{m^2}$, sits a little above it because the small process noise ($0.01\,\mathrm{m^2}$ per step) keeps blurring what the early readings said about $r_0$. And with $s = r_0 + c$ known exactly, an error in $r_0$ must be matched by an equal and opposite error in $c$, so their correlation is exactly $-1$. The filter's $-0.991$ is that limit, nearly reached.

One more fact worth noticing: in a linear Kalman filter, $\mathbf P$ never depends on the measured values, only on the model. You can compute this plateau before the vehicle ever flies.
:::

## Choosing between them

So which strategy should a designer pick? Ignore is almost never right when the bias is real: it produces a filter that lies about its own accuracy. The real choice is between consider and augment.

::: key When to consider, and when to augment
Consider when a parameter is poorly observable and estimating it risks **[[windup|windup]]** — the filter chasing noise into a direction the data cannot actually pin down, and in doing so distorting the states that matter. Augment when the parameter is genuinely observable enough that the filter's estimate will converge to something useful, as the Multiplicative EKF's **[[gyro bias|gyro-bias]]** did with two vector sensors. The correlation between the parameter and the states it is confounded with — $-0.991$ here — is the single most direct warning sign of the first case.
:::

In this lesson's clean simulation, augmenting happened to give the best point estimate. The filter model was exactly right: the bias truly was constant, the noise truly was $3\,\mathrm m$. On a real vehicle, the model of a nuisance parameter is often a little wrong — a bias that drifts with temperature, say. A weakly observable state is exactly where a small model error can grow into a large, confident, wrong correction. That is when consider earns its keep.

::: warning A converged-looking bias estimate is not proof the bias is well observed
The augmented filter's $\hat c = 4.87\,\mathrm m$ after $40$ measurements looks like a converged, useful estimate. It is a real number, well inside the prior's range, and it barely moved over hundreds of further measurements. The plateau example shows why that stability is not accuracy: the estimate stopped moving because the filter had pulled out everything the geometry allows, not because it had found the true value. Reading "the number changed little over hundreds of cycles" as "the number is now correct" is exactly the mistake a consider filter makes impossible, by refusing to update $c$ at all. Before trusting a bias estimate, check that its variance has actually become small, and that its correlation with the other states is well away from $\pm 1$.
:::

## Check yourself

::: check
State the one difference between the consider filter's update equations and the augmented filter's, given that both carry the identical joint state and covariance.
:::

::: answer
The only difference is the gain. The augmented filter uses the ordinary, unconstrained gain $\mathbf K = \mathbf P\mathbf H^{\mathsf T}\mathbf S^{-1}$ on every row of the joint state. The consider filter computes the same joint gain, then forces the row for the nuisance parameter to zero before applying it. So that parameter's estimate never moves. Its variance and its cross-covariance with the other states still propagate, and still shape the gains on the other rows. (Because the zeroed gain is no longer optimal, the consider filter must update its covariance with the Joseph form, which is valid for any gain.)
:::

::: check
In the first worked example, the ignore strategy's point estimate ($586.69\,\mathrm m$, error $+6.69\,\mathrm m$) was the *worst* of the three, while its reported uncertainty ($P_{rr} = 0.34\,\mathrm{m^2}$) was the *smallest*. Explain why both are consequences of the same modeling choice.
:::

::: answer
Treating $c$ as exactly zero forces the filter to explain every measurement using $r$ alone. So the whole true bias gets folded into $\hat r$ — the worst point estimate.

The same choice removes $c$'s uncertainty from $S$ entirely. The filter therefore believes each measurement tells it far more about $r$ than it really does, since none of the information is "spent" on an unknown offset. Its gain stays large and its $P_{rr}$ shrinks to an artificially small value.

Both symptoms have one root cause: a real source of disagreement in the measurements was assumed away instead of modeled.
:::

::: check
A design team sees that their augmented filter's nuisance-parameter estimate has been essentially unchanged for the last several hundred cycles, and concludes the parameter must now be well known. What would you check before accepting that?
:::

::: answer
Check whether the parameter's own reported variance ($P_{cc}$ in this lesson's notation) has actually become small over that period, and check its correlation with the states it might be confounded with.

The second worked example showed a case where the estimate stopped moving by $100$ measurements while $P_{cc}$ had plateaued at $18.1\,\mathrm{m^2}$ — far from zero, and not much below the $64\,\mathrm{m^2}$ prior. The estimate's stability reflected a converged but *incomplete* amount of information. Only a small, shrinking $P_{cc}$ and a correlation well away from $\pm 1$ would support "now well known".
:::

::: check
Why might a designer choose "consider" over "augment" even for a parameter that is, in principle, fully observable given enough time?
:::

::: answer
Observability in principle does not guarantee good behavior during the transient, before enough data has built up. In the short run, an augmented filter can chase a poorly constrained early estimate of the parameter, and in doing so temporarily distort the states that matter more. That is the windup effect.

A designer who cares more about the other states during that transient than about eventually recovering the parameter might consider it instead — or augment it only after enough data has arrived to make the early transient less risky. The trade is a less accurate long-run bias estimate in exchange for protection against short-run misbehavior in the states the mission depends on. The same choice also protects against a nuisance model that is slightly wrong, such as a "constant" bias that actually drifts.
:::

::: check
Suppose a second, independent sensor were added to this lesson's scenario — one with no bias of its own, measuring $r$ directly with the same $3\,\mathrm m$ noise. Would you expect the $r$–$c$ correlation of $-0.991$ to persist under augmentation?
:::

::: answer
No. An unbiased measurement of $r$ lets the filter pin down $r$ without relying on the biased sensor at all. That breaks the tie that produced the $-0.991$ correlation. With $r$ known from an independent source, whatever the biased sensor still disagrees by can be blamed on $c$ specifically.

Running the augmented covariance recursion with both sensors for $40$ steps confirms it: $P_{cc}$ falls to about $0.44\,\mathrm{m^2}$ (the bias known to $\pm 0.67\,\mathrm m$, against $\pm 4.3\,\mathrm m$ with one sensor), and the correlation weakens to about $-0.58$. Augmenting becomes the safer and more useful choice. It is the scale story again: weigh a known one-kilogram bag and the scale's offset stops being a mystery.
:::

## Summary

| Item | Statement |
| --- | --- |
| Ignore | No nuisance state; badly overconfident when the nuisance is real — $11.5\sigma$ off in this lesson's example |
| Consider | Joint state and covariance, gain forced to zero on the nuisance row, Joseph-form covariance; consistent ($0.64\sigma$), never claims to know the nuisance parameter |
| Augment | Joint state, ordinary gain on every row; best point estimate here ($0.43\sigma$), at the cost of near-total correlation ($-0.991$) with the confounded state |
| Why consider also aims better | It knows readings carry bias, so its gain on $r$ shrinks (to about $0.0002$ against ignore's $0.038$) and less bias leaks in |
| Structural vs data-limited | From $100$ to $400$ measurements $P_{cc}$ stayed near $18.13\,\mathrm{m^2}$; the floor is $\sigma_r^2\sigma_c^2/(\sigma_r^2+\sigma_c^2) \approx 17.98\,\mathrm{m^2}$ — the ambiguity is geometric, not a shortage of data |
| Choosing between them | Check the correlation between the candidate parameter and the states it might be confounded with; strong correlation favors considering, weak correlation favors augmenting |

The next and final lesson in this module turns from choices inside one filter to a different question: what to do when the vehicle's dynamics themselves switch between several models, and the filter has to weigh those models against each other in real time.

::: context nuisance A word borrowed from statistics
Statisticians call a quantity a **nuisance parameter** when it affects the data but is not what you are trying to learn. You still have to deal with it, or it spoils the answer you do want. On a spacecraft, the list is long: gyro biases, accelerometer scale factors (a sensor that reads $1.001$ times the truth), the tilt of a star tracker on its bracket, the timing offset between two computers' clocks. A filter designer's first job is to list them all, then decide for each one: ignore, consider, or augment.
:::

::: context deep-space Where consider parameters live in real navigation
Consider analysis is standard practice in orbit determination, the job of working out a spacecraft's path from tracking data. Deep-space navigation teams, for example, routinely treat quantities such as the exact positions of the tracking antennas on Earth and the signal delays through Earth's atmosphere as consider parameters. They are not the point of the analysis, and trying to estimate them from one spacecraft's data could be unreliable, but their uncertainty must widen the reported error bars. A navigator who hands the mission a trajectory with error bars that are too small can cause a missed target just as surely as one with a wrong trajectory.
:::

::: context confounded A long, thin cloud of doubt
Draw the error in $r$ across and the error in $c$ up. The prior is the tall grey ellipse: $\pm 5\,\mathrm m$ across, $\pm 8\,\mathrm m$ up, no tilt. After 40 readings, the augmented filter's one-sigma ellipse is the thin blue sliver. Along the direction "$r$ up, $c$ down by the same amount" it is still about $\pm 6\,\mathrm m$ long, because the readings cannot see that direction at all. Across it, where $r + c$ changes, it is only about $\pm 0.4\,\mathrm m$ thick. The tilt is the correlation of $-0.991$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" font-family="Inter, Arial, sans-serif">
  <line x1="60" y1="110" x2="300" y2="110" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="180" y1="20" x2="180" y2="200" stroke="#6c7a93" stroke-width="1.5"/>
  <line x1="100" y1="30" x2="260" y2="190" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <ellipse cx="180" cy="110" rx="40" ry="64" fill="none" stroke="#6c7a93" stroke-width="2"/>
  <ellipse cx="180" cy="110" rx="48.2" ry="3.3" transform="rotate(45 180 110)" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="220" y1="106" x2="220" y2="114" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="140" y1="106" x2="140" y2="114" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="220" y="127" font-size="11" fill="#1f2a44" text-anchor="middle">+5</text>
  <text x="140" y="127" font-size="11" fill="#1f2a44" text-anchor="middle">−5</text>
  <text x="304" y="114" font-size="12" fill="#1f2a44">error in r (m)</text>
  <text x="186" y="18" font-size="12" fill="#1f2a44">error in c (m)</text>
  <text x="228" y="54" font-size="12" fill="#6c7a93">prior</text>
  <text x="232" y="178" font-size="12" fill="#1d6fd1">after 40 readings</text>
  <text x="28" y="44" font-size="11" fill="#6c7a93">only r + c is measured</text>
</svg>
```
:::

::: context joseph A covariance update that forgives any gain
The Joseph form is named for Peter Joseph, who worked on guidance filtering in the early 1960s. Its selling point is that it gives the true covariance of the error after an update with **any** gain, good or bad — it is the covariance of $(\mathbf I - \mathbf K\mathbf H)\mathbf e + \mathbf K\mathbf v$ worked out directly. The short form $(\mathbf I - \mathbf K\mathbf H)\mathbf P$ only equals it when $\mathbf K$ is the optimal gain. That is why a consider filter, whose gain is deliberately not optimal, must use the Joseph form. It also stays symmetric and positive under rounding error, which is why many flight filters use it everywhere.
:::

::: context sigma-count How far is 11.5 sigmas?
For a Gaussian error, about $68\%$ of outcomes land within one standard deviation and $99.7\%$ within three. An error of $11.5$ sigmas is so far out that the chance of it happening by bad luck is smaller than one in $10^{29}$. When a filter reports such an error, the filter is not unlucky; its covariance is wrong. The consider and augment filters' errors, at $0.64$ and $0.43$ sigmas, sit near the middle of the bell, where an honest filter's errors belong.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <line x1="6" y1="120" x2="350" y2="120" stroke="#1f2a44" stroke-width="1.5"/>
  <path d="M10.0,119.8 L15.0,119.6 L20.0,119.1 L25.0,118.2 L30.0,116.5 L35.0,113.6 L40.0,109.2 L45.0,102.7 L50.0,94.0 L55.0,83.4 L60.0,71.5 L65.0,59.6 L70.0,49.4 L75.0,42.5 L80.0,40.0 L85.0,42.5 L90.0,49.4 L95.0,59.6 L100.0,71.5 L105.0,83.4 L110.0,94.0 L115.0,102.7 L120.0,109.2 L125.0,113.6 L130.0,116.5 L135.0,118.2 L140.0,119.1 L145.0,119.6 L150.0,119.8" fill="#8fb8f0" fill-opacity="0.5" stroke="#1d6fd1" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="80" y1="116" x2="80" y2="124"/><line x1="100" y1="116" x2="100" y2="124"/><line x1="120" y1="116" x2="120" y2="124"/><line x1="140" y1="116" x2="140" y2="124"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="80" y="137">0</text><text x="100" y="137">1σ</text><text x="120" y="137">2σ</text><text x="140" y="137">3σ</text><text x="310" y="137">11.5σ</text>
  </g>
  <line x1="88.6" y1="30" x2="88.6" y2="120" stroke="#1d6fd1" stroke-width="2"/>
  <line x1="92.8" y1="30" x2="92.8" y2="120" stroke="#1f2a44" stroke-width="2"/>
  <line x1="310" y1="30" x2="310" y2="120" stroke="#b4232c" stroke-width="2.5"/>
  <text x="96" y="26" font-size="11" fill="#1f2a44">augment, consider</text>
  <text x="310" y="24" font-size="11" fill="#b4232c" text-anchor="middle">ignore</text>
</svg>
```
:::

::: context correlation Reading a correlation of −0.991
The **correlation coefficient** between two estimate errors is $\rho = P_{rc}/\sqrt{P_{rr}P_{cc}}$ ($\rho$ is "rho"). It always lies between $-1$ and $+1$. Zero means knowing one error tells you nothing about the other. Plus one means they move in lockstep; minus one means one goes up exactly as the other goes down. Here $\rho = -18.04/\sqrt{18.25 \times 18.16} \approx -0.991$: if $\hat r$ is too big, $\hat c$ is almost certainly too small by the same amount. That is the fingerprint of two unknowns the data cannot separate.
:::

::: context plateau Fast learning, then a flat line
The augmented filter's bias variance $P_{cc}$ against the number of readings. The first reading cuts it from the prior $64\,\mathrm{m^2}$ to about $22\,\mathrm{m^2}$, because the filter suddenly learns $r + c$. After that it creeps down and levels off near $18.1\,\mathrm{m^2}$, just above the theoretical floor of $17.98\,\mathrm{m^2}$. Nothing more to learn; more data only confirms what it already knows.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="180" x2="345" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="15" x2="50" y2="180" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="44" y1="130" x2="50" y2="130"/><line x1="44" y1="80" x2="50" y2="80"/><line x1="44" y1="30" x2="50" y2="30"/>
    <line x1="108" y1="180" x2="108" y2="186"/><line x1="166" y1="180" x2="166" y2="186"/><line x1="224" y1="180" x2="224" y2="186"/><line x1="282" y1="180" x2="282" y2="186"/><line x1="340" y1="180" x2="340" y2="186"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="end">
    <text x="41" y="184">0</text><text x="41" y="134">20</text><text x="41" y="84">40</text><text x="41" y="34">60</text>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="108" y="199">20</text><text x="166" y="199">40</text><text x="224" y="199">60</text><text x="282" y="199">80</text><text x="340" y="199">100</text>
  </g>
  <line x1="50" y1="135.05" x2="340" y2="135.05" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 4"/>
  <polyline points="50.0,20.0 52.9,124.5 55.8,129.5 58.7,131.3 61.6,132.2 64.5,132.8 67.4,133.1 73.2,133.6 79.0,133.8 93.5,134.2 108.0,134.4 137.0,134.6 166.0,134.6 224.0,134.7 340.0,134.7" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="58" y="24" font-size="11" fill="#1f2a44">prior 64 m²</text>
  <text x="200" y="125" font-size="11" fill="#1d6fd1">plateau ≈ 18.1 m²</text>
  <text x="200" y="155" font-size="11" fill="#6c7a93">floor 17.98 m²</text>
  <text x="196" y="170" font-size="11" fill="#1f2a44" text-anchor="middle">number of readings</text>
</svg>
```
:::

::: context windup Where "windup" comes from
The word is borrowed from control engineering. A controller with an integral term keeps adding up error; if the actuator is stuck at its limit, that running sum keeps growing — it "winds up" — and when the limit releases, the stored-up sum drives a big overshoot. In an estimator, windup is the same flavor of trouble: a weakly observable state soaks up errors that really belong elsewhere, drifts to a confident but wrong value, and then pushes that error back into the states you care about. Considering the parameter, or delaying its augmentation, stops the soaking.
:::

::: context gyro-bias Why the gyro bias was worth augmenting
In the Multiplicative EKF, the gyro bias makes attitude errors grow steadily in a particular direction over time, while two vector sensors (a sun sensor and a magnetometer, say) measure attitude directly and without bias. That combination breaks the tie: attitude is pinned down by the vector sensors, so the steady drift between them and the integrated gyro can only be bias. The same test returns in the inertial navigation module, where accelerometer and gyro biases are augmented because GNSS fixes and vehicle motion make them observable — and where a bias that the trajectory cannot excite is a classic candidate for considering instead.
:::
