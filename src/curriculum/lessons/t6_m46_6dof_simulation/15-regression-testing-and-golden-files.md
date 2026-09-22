---
id: l15-regression-testing-and-golden-files
title: Regression testing and golden files
minutes: 19
covers:
  - Regression testing and golden-file comparison; what to do when a legitimate model improvement breaks every golden file
---

The validation lesson's checks — analytic cases, conservation laws — are precise instruments aimed at specific quantities: energy, angular momentum, a closed-form trajectory. They are also blind to everything they are not aimed at. A bug in the aerodynamic force table, a broken sensor bias sign, a fairing jettison that silently forgets to shrink the drag area — none of these touch energy conservation on a torque-free coast, and every one of them would sail through every check the previous lesson built. Golden-file regression testing exists to catch exactly this: not "is the physics right," but "did anything change since yesterday."

## What a golden file catches, and what it does not

A golden-file test runs the simulation on a fixed scenario and saves the output — a full state history, or a set of summary quantities — as the reference, the "golden" file. Every future run of the same scenario is compared against it, and any difference, however small, is flagged. This is deliberately indiscriminate: it does not know or care what the right answer is, only whether today's answer matches yesterday's. That indiscrimination is the whole value — it catches changes in code paths no analytic case ever exercises, changes an author never intended, changes nobody thought to write a targeted test for — at the cost of telling you nothing about whether a flagged difference is a bug or an improvement. That judgement is a separate step, and it is the step this lesson is about.

## The dilemma, precisely

A genuine improvement to a shared model — a better atmosphere table, a refined aerodynamic database, a more accurate thrust curve — touches almost every downstream quantity in almost every scenario, so it breaks almost every golden file at once. Silence in the face of that is not an option: some of those thousands of diffs could be the intended improvement, and one of them could be an unrelated bug that happened to land in the same commit. The right response has three parts, and each is checkable with a number rather than a feeling.

::: example A legitimate atmosphere change, and a bug riding along with it
An old, single-scale-height atmosphere model, $\rho_{\text{old}}(h) = \rho_0 e^{-h/H_{\text{old}}}$ with $H_{\text{old}} = 8{,}500\,\mathrm{m}$, is replaced by an improved fit, $H_{\text{new}} = 7{,}000\,\mathrm{m}$. Drag force is linear in density, $F = \tfrac12\rho v^2 C_d A$, so at fixed speed and reference area the golden-file diff ratio $F_{\text{new}}/F_{\text{old}}$ should exactly equal the density ratio $\rho_{\text{new}}(h)/\rho_{\text{old}}(h) = \exp[-h(1/H_{\text{new}} - 1/H_{\text{old}})]$ — a specific, computable prediction, not merely "some difference." Suppose, in the same change, an unrelated bug also landed: the reference area never switches from $A_{\text{before}} = 10\,\mathrm{m^2}$ to $A_{\text{after}} = 4\,\mathrm{m^2}$ after fairing jettison at $30\,\mathrm{km}$.

```python
import numpy as np

rho0 = 1.225
H_old, H_new = 8500.0, 7000.0            # old vs improved scale height
def rho_old(h): return rho0*np.exp(-h/H_old)
def rho_new(h): return rho0*np.exp(-h/H_new)

Cd, v = 0.5, 300.0
A_before, A_after = 10.0, 4.0             # m^2, reference area before/after fairing jettison
jettison_alt = 30000.0                    # m

def drag(h, rho_fn, A): return 0.5*rho_fn(h)*v**2*Cd*A

for h in [0, 5000, 10000, 20000, 40000, 60000]:
    predicted_ratio = np.exp(-h*(1.0/H_new - 1.0/H_old))    # from the atmosphere change alone
    A_correct = A_after if h > jettison_alt else A_before
    A_buggy = A_before                                        # bug: never switches to A_after
    F_old = drag(h, rho_old, A_correct)
    ratio_correct = drag(h, rho_new, A_correct) / F_old
    ratio_buggy = drag(h, rho_new, A_buggy) / F_old
    print(f"h={h:6.0f} m  predicted={predicted_ratio:.6f}  golden-diff(correct)={ratio_correct:.6f}  golden-diff(buggy)={ratio_buggy:.6f}")
# h=     0 m  predicted=1.000000  golden-diff(correct)=1.000000  golden-diff(buggy)=1.000000
# h=  5000 m  predicted=0.881570  golden-diff(correct)=0.881570  golden-diff(buggy)=0.881570
# h= 10000 m  predicted=0.777166  golden-diff(correct)=0.777166  golden-diff(buggy)=0.777166
# h= 20000 m  predicted=0.603988  golden-diff(correct)=0.603988  golden-diff(buggy)=0.603988
# h= 40000 m  predicted=0.364801  golden-diff(correct)=0.364801  golden-diff(buggy)=0.912002
# h= 60000 m  predicted=0.220335  golden-diff(correct)=0.220335  golden-diff(buggy)=0.550838
```

Below $30\,\mathrm{km}$, the golden-file diff matches the atmosphere-only prediction to every digit shown — those diffs are fully explained by the intended change and nothing else. Above $30\,\mathrm{km}$, the diff is $0.912$ and $0.551$ against a prediction of $0.365$ and $0.220$ — a factor of exactly $2.5$ too large at both altitudes, which is exactly $A_{\text{before}}/A_{\text{after}} = 10/4$. The mismatch does not merely say "something else is wrong" — its *location* (only above jettison) and its *exact factor* ($2.5$, not some unexplained number) point directly at the fairing-area bug, found without a debugger, purely by checking whether every diff matched the one change that was supposed to have happened.
:::

That is the shape of the right response: regenerate nothing until every diff has been checked against a specific, computed prediction of what the intended change should do, in that direction and by that magnitude. Diffs that match the prediction are the improvement working as intended. Diffs that do not — as the fairing-area bug's did, above the jettison altitude only — are found, investigated, and fixed before anything is regenerated. Only then does the golden file get replaced, as a deliberate, reviewed, version-controlled change with the justification recorded, so that anyone looking six months later can find out why the numbers moved.

## Why the analytic and conservation tests are the anchor

The previous lesson's checks are not merely additional evidence — they are the fixed point the diff-checking argument above depends on. An atmosphere model change should move every golden file that involves flying through air and should move *none* of the vacuum analytic case, the ballistic energy-conservation check, or the torque-free angular-momentum check, because none of those scenarios has any atmosphere in them at all. If a supposedly atmosphere-only change also nudges the ballistic coast's energy conservation away from its usual $10^{-11}$-scale tolerance, something in the change reaches further than the model it was supposed to touch — a genuine regression, caught by a test that has nothing to do with the atmosphere, in exactly the same spirit as the frame-bug case the previous lesson built.

::: example What tolerance-loosening actually costs
The fairing-area bug above produced a $150\%$ deviation from the atmosphere-only prediction at both $40\,\mathrm{km}$ and $60\,\mathrm{km}$. Loosening the regression tolerance to let a $150\%$ deviation through — "the new atmosphere model changes a lot of things, let's widen the band so the suite goes quiet" — does not target the fairing bug specifically; it widens the band for *every* golden-file comparison in the suite. A completely unrelated, genuinely worth-catching $30\%$ regression introduced by someone else's change next month passes through that same widened tolerance without a single flag, because $30\%$ is comfortably inside a band that was set to admit $150\%$. The tolerance is not a dial tuned per bug; it is the sensitivity of the entire regression suite, spent once and not recoverable by anyone who was not there to remember why it was widened.
:::

::: key Responding to a golden-file break from a legitimate change
Review every diff against a specific, computed prediction of what the intended change should produce, in direction and magnitude — not merely "is there a difference." Keep the analytic and conservation tests as an independent anchor: they should not move at all, and if they do, the change reached further than intended regardless of how reasonable the intended change was. Record the change and its justification, and regenerate the golden files as a deliberate, reviewed, version-controlled action — never as a way to make a red suite go quiet.
:::

::: warning Treating "many files changed" as evidence of a widespread bug
A model that legitimately affects most scenarios — atmosphere, mass properties, anything in the Environment box — is *supposed* to move most golden files at once; the number of files that changed is not, by itself, evidence of anything wrong. What matters is whether each specific diff matches its predicted direction and size, which the example above checked file by file, not by counting how many turned red.
:::

::: warning Regenerating goldens before understanding every diff
Regenerating the golden files closes the very evidence that would have shown the fairing-area bug: once the new, buggy output becomes the reference, every future run compares against a baseline that already contains the bug, and the bug becomes permanently invisible to this entire class of test. The order matters absolutely — explain every diff first, fix what does not match, and only then regenerate, because regeneration is a one-way door for whatever is still wrong at the moment it happens.
:::

## Check yourself

::: check
Why is a golden-file test described as "deliberately indiscriminate," and why is that indiscrimination valuable rather than a weakness?
:::

::: answer
It compares today's output against yesterday's with no model of what the right answer should be, so it flags any difference at all — including ones in code paths no analytic or conservation test was ever aimed at. The indiscrimination is valuable precisely because verification and validation tests are narrow by design, aimed at specific quantities; a golden-file diff catches whatever those narrow tests were not looking at, at the cost of never telling you, by itself, whether a flagged difference is good or bad.
:::

::: check
In the atmosphere-model example, why does the golden-file diff below $30\,\mathrm{km}$ matching the predicted ratio to six decimal places count as strong evidence the change is correct there, while the mismatch above $30\,\mathrm{km}$ is evidence of a bug rather than "more of the same kind of difference"?
:::

::: answer
A prediction computed independently from the intended change (the density ratio alone) either matches the observed diff or it does not; matching to six decimal places below $30\,\mathrm{km}$ means every part of the diff there is accounted for by the one change that was supposed to happen, with nothing left over. Above $30\,\mathrm{km}$ the diff is a clean, constant factor of $2.5$ away from that same prediction — not noise, not a smoothly growing discrepancy, but an exact, unexplained multiplier that starts precisely at the fairing-jettison altitude, which is the signature of a second, distinct change rather than a larger dose of the first one.
:::

::: check
Why must the analytic and conservation checks from the previous lesson specifically *not* move when an atmosphere-only model change is introduced, and what would it mean if one of them did?
:::

::: answer
Those checks describe scenarios with no atmosphere in them at all — a vacuum trajectory, a ballistic coast, torque-free rotation — so an atmosphere model change has no path by which it could legitimately affect them. If one of them moved anyway, the change reached code it should have had no effect on, meaning the change is broader (and therefore less understood) than its author believes, independent of whether the atmosphere-specific diffs all look correct.
:::

::: check
A reviewer proposes widening the regression tolerance from a tight band to one loose enough to absorb the fairing-area bug's $150\%$ deviation, reasoning that "the new atmosphere model is a big change, so a wide tolerance makes sense here." What is wrong with tying the tolerance's width to how big this particular change happens to be?
:::

::: answer
The tolerance is a property of the whole regression suite, applied to every future comparison, not a per-change setting scoped to this one diff alone. Widening it to absorb a $150\%$ deviation from one specific, already-identified bug also silently admits any future regression smaller than $150\%$ anywhere else in the suite, including ones with no relationship at all to the atmosphere model — the suite's sensitivity is spent globally, once, and does not return when the specific bug that motivated the widening is later fixed.
:::

::: check
Why does the text insist that golden files be regenerated only *after* every diff is explained, rather than regenerating first and investigating any diffs that still look suspicious afterward?
:::

::: answer
Regeneration replaces the reference that future comparisons run against; once a buggy result becomes the new golden file, every future run is compared against a baseline that already contains the bug, and no future golden-file diff will ever flag it again, because from that point on the buggy behaviour *is* the expected behaviour. Investigating after regeneration only works for the diffs a human happens to remember to double-check — anything not specifically re-examined is now permanently absorbed into the baseline.
:::

::: check
A vehicle's inertia tensor calculation is changed at the same time as an unrelated sensor noise model update, and every golden file involving rotational dynamics changes. How would you separate the two changes' effects using this lesson's method, without reverting either change first?
:::

::: answer
Compute an independent prediction for what each change should do on its own: the inertia change should shift quantities like angular rate response and momentum by an amount computable from the old and new inertia values with no sensor noise involved at all, while the sensor noise update should only affect measured (not true) quantities and should do so consistently with its new noise parameters. Compare each class of diff — true dynamics versus measured values — against its own independent prediction separately, the same way the atmosphere example separated the density-ratio prediction from the fairing-area bug rather than treating the whole diff as one undifferentiated blob.
:::

## Summary

| Item | Statement |
| --- | --- |
| What a golden file catches | Any change in output versus a saved reference — including changes no targeted test was aimed at |
| What it cannot tell you | Whether a flagged difference is a bug or an intended improvement |
| The right response | Predict each intended change's effect in direction and magnitude; check every diff against that prediction, not only its existence |
| The anchor | Analytic and conservation checks from the previous lesson should not move at all when an unrelated model changes — if they do, the change reached further than intended |
| Worked case | Atmosphere-model diffs matched their prediction exactly below $30\,\mathrm{km}$; a fairing-area bug showed as an exact, unexplained $2.5\times$ factor above it |
| Tolerance-loosening | Widening the band to admit one explained bug's size silently admits every smaller, unrelated regression too — a one-time, global loss of sensitivity |
| Regeneration order | Explain every diff, fix what does not match, only then regenerate — as a deliberate, reviewed, recorded action |

Golden files catch that something changed and, checked carefully, help tell you whether the change was the one you meant to make. The next lesson turns to a related but distinct problem: making sure that when you deliberately re-run a specific case — to investigate exactly this kind of diff — you get bit-for-bit the same answer every time.
