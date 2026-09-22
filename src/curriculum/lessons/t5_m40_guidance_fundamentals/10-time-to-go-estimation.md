---
id: l10-time-to-go-estimation
title: Time-to-go estimation
minutes: 23
covers:
  - Time-to-go estimation and why it is the critical quantity
---

Every guidance law this module has derived — proportional navigation, its augmented and LQ-generalized forms, zero-effort-miss and zero-effort-velocity guidance — takes $t_{go}$ as an input, and every one of them has gains that scale as $1/t_{go}$ or $1/t_{go}^2$. None of them derived where $t_{go}$ actually comes from. This lesson closes that gap, and the reason it earns a lesson of its own rather than a footnote is that a wrong $t_{go}$ is never a small error — it feeds directly into the same gains that make each of these laws work, and near the end of a flight, exactly where getting it right matters most, it becomes the hardest quantity to know.

## The simple estimate

If both vehicles continue their current velocity unchanged, they close the remaining range at the current closing velocity $V_c$, and the time until $R=0$ is, by that definition alone,

$$
t_{go} = \frac{R}{V_c}.
$$

This is exact — not approximate — for a genuine constant-velocity collision course, because that is exactly the scenario $V_c$ and $R$ describe when neither party maneuvers further. It is the estimate every worked example so far has simply assumed.

## Why it drifts once the path curves

A converging PN engagement is a collision course only in the limit — everywhere short of that limit, the pursuer is actively curving its path to null a nonzero heading error, and $R/V_c$, which assumes straight-line closure, systematically **underestimates** how long the curved path actually takes.

::: example How far off R/V_c gets, and a refinement that fixes most of it
Same engagement style as the true/pure PN comparison two lessons ago — pursuer speed $V_M=90\,\mathrm{m/s}$, target at $(4000,0,0)\,\mathrm{m}$ closing at $(-30,0,0)\,\mathrm{m/s}$ — flown at $N=3$ across a range of initial heading errors $\theta_L$:

| $\theta_L$ | True $t_f$ | $R/V_c$ (error) | Refined (error) |
| --- | --- | --- | --- |
| $1^\circ$ | $33.338\,\mathrm{s}$ | $33.337\,\mathrm{s}$ ($-0.00\%$) | $33.338\,\mathrm{s}$ ($-0.00\%$) |
| $10^\circ$ | $33.835\,\mathrm{s}$ | $33.718\,\mathrm{s}$ ($-0.35\%$) | $33.820\,\mathrm{s}$ ($-0.04\%$) |
| $20^\circ$ | $35.429\,\mathrm{s}$ | $34.912\,\mathrm{s}$ ($-1.46\%$) | $35.338\,\mathrm{s}$ ($-0.26\%$) |
| $30^\circ$ | $38.425\,\mathrm{s}$ | $37.057\,\mathrm{s}$ ($-3.56\%$) | $38.073\,\mathrm{s}$ ($-0.92\%$) |
| $45^\circ$ | $47.404\,\mathrm{s}$ | $42.717\,\mathrm{s}$ ($-9.89\%$) | $45.352\,\mathrm{s}$ ($-4.33\%$) |

The refined column uses a standard series correction for the curvature a converging PN trajectory adds,

$$
t_{go} = \frac{R}{V_c}\left[1 + \frac{\theta_L^2}{2(2N-1)}\right],
$$

with $\theta_L$ in radians. At every heading error tested it cuts the naive estimate's error by a factor of three to eight — not perfect (the correction is itself a first-order approximation), but it turns a nearly $10\%$ error at a large heading error into one closer to $4\%$, and at moderate heading errors — the regime most engagements actually spend most of their time in — it is very accurate.

```python
def naive_tgo(R, Vc): return R/Vc
def refined_tgo(R, Vc, theta_L, N): return (R/Vc)*(1 + theta_L**2/(2*(2*N-1)))
```
:::

## Estimating t_go for a powered descent

A coasting intercept has a natural closing velocity to divide range by. A powered-descent burn does not — velocity is changing under thrust and gravity throughout, so there is no single "current closing rate" that stays valid for the rest of the flight. One practical way to seed a first $t_{go}$ estimate is to tie it to a constraint the vehicle actually has: solve for the $t_{go}$ at which the ZEM/ZEV command would exactly reach an actuator's limit, and treat that as the earliest reasonable point to commit to guided braking.

::: example Solving for an initial t_go against a thrust limit
Using the lunar descent from the ZEM/ZEV lesson ($\mathbf{r}_0=(300,1500)\,\mathrm{m}$, $\mathbf{v}_0=(-8,-40)\,\mathrm{m/s}$, $\mathbf{g}=(0,-1.62)\,\mathrm{m/s^2}$) and a $3.0\,\mathrm{m/s^2}$ available thrust acceleration, find the $t_{go}$ at which the commanded acceleration exactly saturates it:

```python
from scipy.optimize import brentq
def cmd_minus_limit(tgo, a_max=3.0):
    zem = -( r0 + v0*tgo + 0.5*g*tgo**2)   # rf = 0
    zev = -( v0 + g*tgo)                    # vf = 0
    a = (6/tgo**2)*zem - (2/tgo)*zev
    return np.linalg.norm(a) - a_max
tgo_seed = brentq(cmd_minus_limit, 5.0, 80.0)
print(tgo_seed)
# 30.384025...
```

$t_{go} = 30.384\,\mathrm{s}$ is where this particular state's ZEM/ZEV command exactly equals the $3.0\,\mathrm{m/s^2}$ limit; committing to a shorter $t_{go}$ than this from the same state would immediately demand more thrust than is available. Root-finding, not a closed form, is what this kind of constraint-consistent estimate generally needs — the command is a nonlinear function of the assumed $t_{go}$, and there is no algebraic shortcut to inverting it in general.
:::

## Why t_go is the critical quantity

Every gain in ZEM/ZEV scales as $1/t_{go}^2$ or $1/t_{go}$, and proportional navigation's $V_c$ is itself sensitive to whatever curvature $t_{go}$ errors are entangled with — so a $t_{go}$ error is not a separate error source alongside the others in a miss-distance budget; it is a direct error in the gains every other law applies to whatever state estimate is otherwise correct.

::: example The same fractional error, two very different costs
Early in the lunar descent above ($t_{go}=45\,\mathrm{s}$, commanded $\lvert\mathbf{a}\rvert = 0.752\,\mathrm{m/s^2}$), a $20\%$ underestimate of $t_{go}$ changes the command to $1.012\,\mathrm{m/s^2}$ — a $35\%$ change. Late in a different descent, close to touchdown ($t_{go}=3.0\,\mathrm{s}$, true command $0.380\,\mathrm{m/s^2}$), the *same* $20\%$ underestimate changes the command to $4.027\,\mathrm{m/s^2}$ — a **960%** change, nearly tenfold.

The gain exponents alone do not explain this — a fixed *fractional* error in $t_{go}$ produces the same fractional change in $1/t_{go}$ or $1/t_{go}^2$ regardless of how large $t_{go}$ actually is. The real mechanism is visible in $ZEM$ and $ZEV$ themselves. At the true late-flight $t_{go}=3.0\,\mathrm{s}$, $ZEM=(1.0,\,10.29)$ and $ZEV=(1.0,\,10.86)$ — individually large numbers — and the command $\mathbf{a} = (6/t_{go}^2)ZEM - (2/t_{go})ZEV$ comes out small only because its two terms, $(0.667,\,6.86)$ and $(0.667,\,7.24)$, very nearly **cancel**: the state is close to a well-tracked trajectory, and a well-tracked trajectory is exactly what makes those two large terms cancel down to a small residual command. At $t_{go}=2.4\,\mathrm{s}$ (the same $20\%$-low estimate), $ZEM$ and $ZEV$ evaluate to different numbers entirely, and the two terms — $(0.417,\,4.24)$ and $(0.833,\,8.24)$ — no longer cancel nearly as precisely, so a small absolute disruption in the cancellation shows up as an enormous *relative* change in an already-small true command. Early in the flight, where the true command is not the product of a delicate cancellation, the same fractional $t_{go}$ error costs far less.
:::

::: key Why every gain scaling as 1/t_go is a warning, not a footnote
Any ZEM-form or LQ-optimal guidance law has gains scaling as $1/t_{go}^2$ and $1/t_{go}$, so a $t_{go}$ error is a direct gain error: too small a $t_{go}$ produces enormous commands and saturation, too large produces a sluggish response that runs out of time. Plain proportional navigation is affected indirectly, through whatever curvature its own $\theta_L$-dependent $t_{go}$ error is entangled with. Near intercept, every term in every one of these laws becomes singular as $t_{go}\to0$, so a floor on $t_{go}$ or a switch to a terminal-hold law in the last fraction of a second is mandatory, not optional.
:::

::: warning A confident-looking t_go is not the same as a correct one
Nothing about $R/V_c$ or the refined series correction *announces* when it is wrong — both simply return a number, and a guidance loop will use whatever number it is given without complaint. The failure mode is silent: a badly estimated $t_{go}$ produces a badly scaled command that looks like ordinary guidance output right up until the terminal acceleration saturates the actuators or the vehicle arrives with an unacceptable residual velocity. Treat $t_{go}$ as a quantity to validate — cross-check $R/V_c$ against the refined estimate, watch for a commanded acceleration that is growing faster than the geometry alone explains — not as a number to trust because a formula produced it.
:::

## Check yourself

::: check
Why is $t_{go}=R/V_c$ exact for a true collision course but only approximate for a converging PN engagement with nonzero heading error?
:::

::: answer
$R/V_c$ is the time until range reaches zero *if both parties continue their current velocity unchanged* — which is exactly what happens on a true collision course, so the estimate is exact there by construction. A converging PN engagement with nonzero heading error is not flying a straight line at constant velocity; the pursuer is actively curving its path to null $\dot\lambda$, so the actual remaining flight, which follows that curved path, takes longer than a straight-line closure at the current $V_c$ would — the estimate is only as good as the straight-line assumption behind it.
:::

::: check
An engagement has $R_0/V_{c,0} = 34.208\,\mathrm{s}$ at a heading error of $15^\circ$, flown at $N=4$. What does the refined estimate give?
:::

::: answer
$\theta_L = 15^\circ = 0.2618\,\mathrm{rad}$, so $t_{go} = 34.208\big[1+0.2618^2/(2(2\cdot4-1))\big] = 34.208\big[1+0.06854/14\big] = 34.208\times1.004896 = 34.375\,\mathrm{s}$ — a small correction here, about $0.5\%$, consistent with $15^\circ$ being a modest heading error.
:::

::: check
The worked example found a $20\%$ late-flight $t_{go}$ error produced nearly a tenfold change in the commanded acceleration, far worse than the same error early in the flight. Explain why the $1/t_{go}$-scaling of the gains alone does not account for this difference.
:::

::: answer
A fixed fractional error in $t_{go}$ produces the same fractional change in $1/t_{go}$ or $1/t_{go}^2$ no matter what $t_{go}$'s actual value is — a $20\%$ low $t_{go}$ inflates $1/t_{go}^2$ by the same factor whether $t_{go}$ is $45\,\mathrm{s}$ or $3\,\mathrm{s}$. The dramatic difference instead comes from $ZEM$ and $ZEV$ themselves depending on the assumed $t_{go}$, and from the true late-flight command being the *difference* of two much larger terms that very nearly cancel on a well-tracked trajectory. Perturbing $t_{go}$ disrupts that cancellation, so a small absolute change produces a huge relative change in an already-small true command — a mechanism the pure gain-scaling argument misses entirely.
:::

::: check
Why does powered-descent guidance need to *solve* for an initial t_go, such as the root-finding example against a thrust limit, rather than measuring it the way $R/V_c$ measures a coasting intercept's?
:::

::: answer
$R/V_c$ works because a coasting engagement has a well-defined current closing rate that, extrapolated, tells you exactly when range reaches zero. A powered-descent burn has no such fixed rate — velocity is changing under thrust and gravity for the whole remainder of the flight, so there is nothing to "measure" that stays constant long enough to divide range by. What can be pinned down instead is a self-consistency condition tied to something the vehicle actually cares about — here, the earliest $t_{go}$ whose ZEM/ZEV command does not exceed available thrust — and finding the $t_{go}$ that satisfies it is a genuine root-finding problem, not a measurement.
:::

::: check
A guidance engineer proposes fixing a badly-scaled terminal command by clamping the commanded acceleration to the actuator limit whenever it is exceeded, without changing how $t_{go}$ itself is estimated. Why might this hide rather than fix the real problem?
:::

::: answer
Clamping the output treats the symptom — an over-large command — without correcting the cause, a wrong $t_{go}$ feeding wrong gains into an otherwise correct law. A clamped command no longer reflects what the guidance law actually computed, so any downstream monitoring, tuning, or miss-distance analysis (as the last lesson built) that assumes the applied command *is* the law's true output will be silently wrong. Worse, clamping can mask exactly the failure mode this lesson's key point warns about — a diverging or singular command near $t_{go}=0$ looks, after clamping, like an ordinary saturated burn rather than the warning sign it actually is, which is why a $t_{go}$ floor or an explicit terminal-hold law, addressing the estimate itself, is the right fix rather than a clamp on its consequence.
:::

## Summary

| Quantity | Statement |
| --- | --- |
| Simple estimate | $t_{go} = R/V_c$; exact for a true constant-velocity collision course |
| Refined estimate | $t_{go} = (R/V_c)\big[1+\theta_L^2/(2(2N-1))\big]$; corrects most of the curvature error |
| Powered-descent seed | No natural closing rate exists; solve a self-consistency condition (e.g. against a thrust limit) instead |
| Why it is critical | Every ZEM-form and LQ-optimal gain scales as $1/t_{go}$ or $1/t_{go}^2$; a $t_{go}$ error is a direct gain error |
| Near-intercept amplification | True commands there are often a near-cancellation of large terms; a $t_{go}$ error disrupts the cancellation, not just the gain magnitude |
| Mandatory guard | A floor on $t_{go}$, or a switch to a terminal-hold law, near $t_{go}=0$ |

Every guidance law this module has built assumed the vehicle is free to command whatever acceleration the law produces. The next lesson turns to the ascent problem, where that assumption is only sometimes true, before this module's final lesson takes on what changes when it is not.
