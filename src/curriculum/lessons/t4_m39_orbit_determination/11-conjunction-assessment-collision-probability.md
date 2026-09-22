---
id: l11-conjunction-assessment-collision-probability
title: Conjunction assessment and collision probability
minutes: 13
covers:
  - Conjunction assessment and collision probability
---

A RIC covariance ellipsoid is not an end in itself — the reason an orbit determination team computes one at all, day to day, is usually to answer a specific operational question: how likely is it that this object and that one actually hit each other? Conjunction assessment turns two independent orbit solutions, each with its own covariance from everything built in this module so far, into a single number, the collision probability $P_c$, and this lesson derives that number rather than quoting it, including the counter-intuitive fact that a *less* certain orbit can report a *lower* risk than a more certain one.

## Reducing three dimensions to two: the conjunction plane

At the time of closest approach (TCA), the relative velocity between the two objects is, for the short duration that matters, effectively constant — the encounter happens fast compared with either orbit's own curvature. This makes the problem two-dimensional: project the miss vector and the *combined* covariance (the sum of the two objects' individual covariances, assuming independent errors) onto the plane perpendicular to the relative velocity at TCA, the **conjunction plane** (or B-plane). Motion strictly along the relative-velocity direction does not change whether the objects pass through each other's hard bodies at TCA — only where they are, and how uncertain that is, within the plane the relative velocity does not point through.

With $\mathbf P_{\text{comb}}=\mathbf P_A+\mathbf P_B$ (each already available in RIC or any common inertial frame from the previous lesson) and a $2\times3$ matrix $\mathbf B$ whose rows are an orthonormal basis for the plane perpendicular to $\hat{\mathbf v}_{\text{rel}}$, the projected covariance is $\mathbf P_{\text{plane}}=\mathbf B\mathbf P_{\text{comb}}\mathbf B^\mathsf T$, a $2\times2$ matrix in general — not circular. Its eigenvalues give the semi-axes of an uncertainty ellipse in the plane; a representative combination of a well-tracked primary and a poorly-tracked debris object gives a major-to-minor axis ratio around $2.9$ in one worked case below, which is typical — real conjunction-plane covariances are usually elongated, not round. The fully general treatment integrates the bivariate Gaussian over the hard-body disc directly against this elliptical covariance (the Foster or Akella-Alfriend formulations, standard in operational conjunction-screening software); a common practical simplification instead replaces the ellipse with an "equivalent" circle of the same area, $\sigma_{\text{eq}}=\sqrt{\sigma_{\text{major}}\sigma_{\text{minor}}}$, and applies the closed-form circular result this lesson derives. That closed form is exact only for a genuinely circular (isotropic) conjunction-plane covariance, and it is what the module's own exercise and quiz content are built around.

## The circular collision probability, derived

For an isotropic $2$-D Gaussian in the conjunction plane with standard deviation $\sigma$ in every direction, centred (without loss of generality) at the origin, the miss vector's actual realization is Gaussian-distributed around the predicted miss distance $d$. The probability of an actual collision is the integral of that density over a disc of radius $R_{\text{hb}}$ (the combined hard-body radius) centred at distance $d$:
$$
P_c = \int_{\text{disc}} \frac{1}{2\pi\sigma^2}\exp\!\left(-\frac{x^2+y^2}{2\sigma^2}\right) dA.
$$
When the hard body is small compared with $\sigma$ (the overwhelmingly common case — metres against hundreds of metres or more), the Gaussian density is nearly constant across the small disc, equal to its value at the disc's centre, and the integral reduces to that density times the disc's area:
$$
P_c \approx \frac{R_{\text{hb}}^2}{2\sigma^2}\exp\!\left(-\frac{d^2}{2\sigma^2}\right).
$$

::: key The circular collision probability
$$
P_c \approx \frac{R_{\text{hb}}^2}{2\sigma^2}\exp\!\left(-\frac{d^2}{2\sigma^2}\right),
$$
valid in the small-hard-body limit ($R_{\text{hb}}\ll\sigma$): the density at the miss distance, times the disc's area. $\sigma$ is the (isotropic) conjunction-plane position uncertainty; $d$ is the predicted miss distance; $R_{\text{hb}}$ is the sum of the two objects' physical radii.
:::

::: example How good is the small-hard-body approximation?
Comparing the closed form against a direct, exact numerical integral (`scipy.integrate.dblquad` in polar coordinates) over the actual disc, for a fixed miss distance of $500\,\mathrm m$:

```python
# radius(m)  sigma(m)   Pc closed-form    Pc exact (dblquad)    relative error
#      1       300       1.385e-06          1.385e-06            1.1e-06
#      5       300       3.463e-05          3.463e-05            2.7e-05
#     20       300       5.541e-04          5.544e-04            4.3e-04
#     20       100       7.453e-08          8.338e-08            1.1e-01
#     50       100       4.658e-07          8.713e-07            4.7e-01
#     20        40       1.471e-35          3.318e-34            9.6e-01
```

While $R_{\text{hb}}/\sigma$ stays under about $0.07$, the closed form is accurate to four significant figures or better. Once the hard body becomes a non-negligible fraction of $\sigma$ — a very tight orbit solution meeting a physically large object, or a very close approach — the approximation degrades badly, understating $P_c$ by up to two orders of magnitude at $R_{\text{hb}}/\sigma\approx0.5$. Knowing this failure mode, not only the formula, is what tells an analyst when the closed form can be trusted and when the exact integral (or at minimum, a numerical check like this one) is required.
:::

## The dilution peak

$P_c$ as a function of $\sigma$, with $d$ and $R_{\text{hb}}$ fixed, is not monotonic. Differentiating $\ln P_c = 2\ln R_{\text{hb}} - \ln 2 - 2\ln\sigma - d^2/(2\sigma^2)$ with respect to $\sigma$ and setting the result to zero,
$$
\frac{d\ln P_c}{d\sigma} = -\frac{2}{\sigma} + \frac{d^2}{\sigma^3} = 0 \quad\Longrightarrow\quad \sigma^{*} = \frac{d}{\sqrt2},
$$
independent of the hard-body radius entirely — a clean result that survives the small-hard-body approximation exactly, since $R_{\text{hb}}$ only ever appears as a multiplicative constant in $\ln P_c$ and drops out of the derivative.

::: example The peak, located and confirmed
For $d=500\,\mathrm m$, the formula predicts $\sigma^{*}=500/\sqrt2=353.6\,\mathrm m$. A fine numerical sweep of $\sigma$ around that value, holding $d$ and $R_{\text{hb}}=20\,\mathrm m$ fixed, locates the actual maximum of $P_c(\sigma)$ at $\sigma=353.553\,\mathrm m$ — matching to six significant figures, and the same match holds at $d=100\,\mathrm m$ ($\sigma^{*}=70.711\,\mathrm m$) and $d=2500\,\mathrm m$ ($\sigma^{*}=1767.767\,\mathrm m$). Sweeping $\sigma$ broadly at $d=500\,\mathrm m$:

```python
# sigma (m)      Pc
#      10.0     ~0 (underflow)
#      31.6      1.03e-55
#     100.0      7.45e-08
#     316.2      5.73e-04   <- near the peak
#    1000.0      1.77e-04
#    3162.3      1.97e-05
#   10000.0      2.00e-06
```

$P_c$ rises through more than fifty orders of magnitude between $\sigma=10\,\mathrm m$ and the peak near $\sigma=354\,\mathrm m$, then falls steadily as $\sigma$ grows further — the same non-monotonic shape the module's own exercise asks you to reproduce.
:::

## What the dilution paradox means for a real decision

The physical reason for the peak is the two competing effects a growing $\sigma$ has: a larger uncertainty spreads more of the probability mass toward the actual conjunction point when the orbit solution is still tight enough that $d$ sits many sigmas away ($\sigma\ll d$, so growing $\sigma$ helps), but past $\sigma^{*}=d/\sqrt2$ the same growth spreads that mass over an ever-larger area faster than it moves any more of it toward the hard body, and the *density* right at the conjunction point falls — dilution. A very large $\sigma$ — a poorly determined orbit — reports a *small* $P_c$ not because the risk is small, but because the analysis genuinely does not know where the object is well enough to concentrate probability anywhere, including at the collision point.

::: warning A small $P_c$ from a poor solution is not reassurance
This is precisely the trap the module's own flashcard for this topic names: a small $P_c$ can come from two entirely different situations — a precise orbit solution that confidently predicts a safe miss, or an imprecise one that cannot rule out disaster because it cannot rule out much of anything. The RIC-frame lesson showed exactly how fast a covariance's in-track component can grow with propagation time; a conjunction predicted days in advance, worked with a covariance that has not yet grown to reflect that much elapsed time honestly, can report a dangerously optimistic $P_c$ for the opposite reason — too *small* a $\sigma$, sitting well below the dilution peak, understating how much of the probability mass genuinely could reach the hard body. Reading $P_c$ without also reading $\sigma$ against $\sigma^{*}=d/\sqrt2$ is reading only half the answer.
:::

## Check yourself

::: check
Explain, using the derivative $d(\ln P_c)/d\sigma$, why the dilution peak location $\sigma^{*}=d/\sqrt2$ does not depend on the hard-body radius $R_{\text{hb}}$.
:::

::: answer
$R_{\text{hb}}$ enters $\ln P_c$ only through the additive constant term $2\ln R_{\text{hb}}$, which has zero derivative with respect to $\sigma$; the two terms that do depend on $\sigma$, $-2\ln\sigma$ and $-d^2/(2\sigma^2)$, involve only $\sigma$ and $d$. Setting the derivative of those two terms to zero and solving is therefore a calculation that $R_{\text{hb}}$ never participates in, so the peak's location is fixed by $d$ alone, however large or small the hard body actually is.
:::

::: check
Two conjunctions have identical miss distances and identical hard-body radii, but Object $1$'s combined covariance has $\sigma=50\,\mathrm m$ and Object $2$'s has $\sigma=5000\,\mathrm m$, with $d=500\,\mathrm m$ in both cases. Without computing $P_c$ numerically, state which side of the dilution peak ($\sigma^{*}\approx354\,\mathrm m$) each sits on and what that implies about trusting a low reported $P_c$ from each.
:::

::: answer
Object $1$ ($\sigma=50\,\mathrm m$) sits well *below* the peak — a tight, confident solution — so a low $P_c$ there is genuine good news: the orbit is well enough known to say the objects are unlikely to occupy the same small region. Object $2$ ($\sigma=5000\,\mathrm m$) sits well *above* the peak — the orbit solution is diluted — so a low $P_c$ there is not reassuring in the same way; it reflects that the uncertainty is spread so widely that no particular outcome, including a collision, concentrates much probability, not that a collision has been ruled out with any confidence.
:::

::: check
Why does the conjunction-plane projection use the *combined* covariance $\mathbf P_A+\mathbf P_B$ rather than either object's covariance alone?
:::

::: answer
The quantity that matters for a collision is the *relative* position of the two objects, and if each object's position error is modelled as an independent random variable, the variance of their difference (or, equivalently here, of the discrepancy between the predicted and actual relative position) is the sum of the two individual covariances, exactly as it would be for the difference of any two independent random vectors — neither object's uncertainty alone describes how uncertain the encounter geometry itself is.
:::

::: check
The worked example found the small-hard-body approximation understated $P_c$ by roughly a factor of two at $R_{\text{hb}}/\sigma\approx0.5$. Explain, qualitatively, why the approximation *understates* rather than overstates $P_c$ in that regime.
:::

::: answer
The approximation evaluates the Gaussian density only at the centre of the disc (the predicted miss point) and multiplies by the disc's area, implicitly assuming the density is constant across it. In reality the density is highest at the point on the disc closest to the distribution's peak (the origin) and falls off toward the far side of the disc; once the disc is large enough to reach appreciably closer to the origin than its centre does, the true integral picks up extra probability from that nearer, higher-density region that the constant-density approximation — evaluated only at the centre — misses entirely, so the approximation systematically understates the true $P_c$ once the disc is not small.
:::

## Summary

| Symbol or formula | Meaning |
| --- | --- |
| $\mathbf P_{\text{plane}}=\mathbf B\,(\mathbf P_A+\mathbf P_B)\,\mathbf B^\mathsf T$ | Combined covariance projected onto the plane perpendicular to relative velocity at TCA |
| $P_c\approx\dfrac{R_{\text{hb}}^2}{2\sigma^2}\exp\!\left(-\dfrac{d^2}{2\sigma^2}\right)$ | Circular (isotropic) collision probability; small-hard-body limit |
| Valid for $R_{\text{hb}}/\sigma\lesssim0.1$ | Beyond that, the approximation understates $P_c$; use the exact integral or Foster/Akella-Alfriend |
| $\sigma^{*}=d/\sqrt2$ | The dilution peak; independent of hard-body radius |
| $P_c$ rises then falls with $\sigma$ | The dilution paradox: a very uncertain orbit reports low risk for the wrong reason |
| Elliptical conjunction-plane covariance | The general case (typical in practice); the circular formula is a special/approximate case |

Everything in this lesson assumed both orbits' epoch states and covariances were already correct. The next lesson asks what happens to that assumption the moment one of the two objects manoeuvres — deliberately or not — partway through the tracking arc that was supposed to be describing it.
