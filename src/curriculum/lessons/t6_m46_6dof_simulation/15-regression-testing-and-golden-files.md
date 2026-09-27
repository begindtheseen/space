---
id: l15-regression-testing-and-golden-files
title: Regression testing and golden files
minutes: 17
covers:
  - Regression testing and golden-file comparison; what to do when a legitimate model improvement breaks every golden file
---

Remember those "spot the difference" puzzles: two nearly identical pictures side by side, and you hunt for the seven small changes. You do not need to know what the picture is *supposed* to show. You only need yesterday's picture and today's, and a sharp eye for anything that moved.

The last lesson's checks — analytic cases and conservation laws — are precise instruments aimed at particular quantities: energy, angular momentum, a closed-form trajectory. They are also blind to everything they are not aimed at. A bug in the aerodynamic force table, a flipped sign on a sensor bias, a **[[fairing|fairing]]** jettison that quietly forgets to shrink the drag area: none of these touches energy conservation on a torque-free coast. Every one of them would sail through every check the previous lesson built.

**Regression testing** is the spot-the-difference puzzle for software: rerun old tests after every change, to catch anything that used to work and now does not (a **regression** — a step backward). With golden files, it answers not "is the physics right?" but "did anything change since yesterday?" Every serious simulation team runs a suite like this on every change to the code.

## What a golden file catches, and what it does not

A **golden file** is a saved, trusted output. You run the simulation on a fixed scenario and store the result — a full state history, or a set of summary numbers — as the reference. Every future run of the same scenario is compared against it. Any difference bigger than a small **[[tolerance|tolerance]]** (the largest difference the comparison is allowed to ignore) is flagged.

This is deliberately indiscriminate. The test does not know or care what the right answer is. It only asks whether today's answer matches yesterday's. That is its whole value. It catches changes in code paths no analytic case ever touches, changes nobody intended, changes nobody thought to write a targeted test for.

The price: a golden-file test can never tell you, by itself, whether a flagged difference is a bug or an improvement. That judgment is a separate step, and it is what this lesson is about.

## The dilemma, precisely

Here is the situation every team meets sooner or later. Someone improves a shared model — a better atmosphere table, a refined aerodynamic table, a more accurate thrust curve. The improvement touches almost every quantity downstream, in almost every scenario. So it breaks almost every golden file at once. The suite turns red from top to bottom.

Ignoring that is not an option. Most of those thousands of diffs are probably the intended improvement. But one of them could be an unrelated bug that landed in the same change. The right response has three parts, and each is checked with a number, not a feeling.

The key idea: **before you look at the diffs, work out what the intended change should do to each output — in which direction, and by how much.** Then check every diff against that prediction.

::: example A legitimate atmosphere change, and a bug riding along with it
The old atmosphere model uses a single **[[scale height|scale-height]]**:

$$
\rho_{\text{old}}(h) = \rho_0\, e^{-h/H_{\text{old}}}, \qquad H_{\text{old}} = 8{,}500\,\mathrm{m}.
$$

Read it as "density at height h equals sea-level density times e to the minus h over H". Here $\rho$ (the Greek letter "rho") is air density, $\rho_0 = 1.225\,\mathrm{kg/m^3}$ at sea level, and $H$ is the scale height — the climb over which density falls by a factor of $e \approx 2.72$. The improved fit uses $H_{\text{new}} = 7{,}000\,\mathrm{m}$.

**The prediction.** Drag force is proportional to density:

$$
F = \tfrac12 \rho v^2 C_d A.
$$

So at a fixed speed $v$, drag coefficient $C_d$ and reference area $A$, the ratio of new drag to old drag must equal the ratio of new density to old density. Divide the two exponentials and the exponents subtract:

$$
\frac{F_{\text{new}}}{F_{\text{old}}} = \frac{\rho_{\text{new}}(h)}{\rho_{\text{old}}(h)} = \exp\!\left[-h\left(\frac{1}{H_{\text{new}}} - \frac{1}{H_{\text{old}}}\right)\right].
$$

That is a specific, computable number at every altitude, not merely "some difference".

**The hidden bug.** Suppose that, in the same change, an unrelated bug also slipped in. The reference area should switch from $A_{\text{before}} = 10\,\mathrm{m^2}$ to $A_{\text{after}} = 4\,\mathrm{m^2}$ when the fairing is jettisoned at $30\,\mathrm{km}$. Now it never switches. The code below computes the prediction and the golden-file ratio that each version of the code would produce:

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

**Reading the table.** Take $h = 10{,}000\,\mathrm{m}$ by hand. $1/7000 - 1/8500 = 2.52\times10^{-5}\,\mathrm{m^{-1}}$. Times $10{,}000$ is $0.252$, and $e^{-0.252} = 0.777$. The table agrees: $0.777166$. Air that thins faster means less drag up high, so a ratio below $1$ is the right direction.

Below $30\,\mathrm{km}$, every golden-file ratio matches the prediction to every digit shown. Those diffs are fully explained by the intended change and nothing else.

Above $30\,\mathrm{km}$, the buggy code's ratio is $0.912$ at $40\,\mathrm{km}$ and $0.551$ at $60\,\mathrm{km}$, against predictions of $0.365$ and $0.220$. Divide: $0.912 / 0.365 = 2.50$ and $0.551 / 0.220 = 2.50$. Exactly $2.5$ too large at both heights — and $A_{\text{before}}/A_{\text{after}} = 10/4 = 2.5$.

The mismatch does not only say "something else is wrong". *Where* it appears (only above the jettison altitude) and *its exact size* ($2.5$, not some random number) point straight at the fairing-area bug. It was found with no debugger, purely by checking whether every diff matched the one change that was supposed to happen.
:::

So the right response is:

1. **Predict.** Work out what the intended change should do, in direction and size, to each output.
2. **Check every diff against the prediction.** Diffs that match are the improvement working. Diffs that do not — like the fairing-area bug's, above $30\,\mathrm{km}$ only — are investigated and fixed.
3. **Only then regenerate.** Replace the golden files as a deliberate, reviewed change kept under **[[version control|version-control]]**, with the reason written down. Anyone looking six months later can then find out why the numbers moved.

## Why the analytic and conservation tests are the anchor

The previous lesson's checks are not just extra evidence. They are the fixed point the whole diff-checking argument leans on.

Think of a ship's anchor. When the wind shifts, everything on deck moves, but the anchor does not, so you can measure all the other movement against it. An atmosphere change should move every golden file that involves flying through air. It should move *none* of the vacuum analytic case, the ballistic energy-conservation check, or the torque-free angular-momentum check, because none of those scenarios has any air in it at all. The same goes for **[[symmetry checks|symmetry-checks]]**: a mirror-image scenario must still give a mirror-image answer.

Golden files record *history*: what the code did before. The anchor tests assert *physics*: what any correct code must do. When a supposedly atmosphere-only change also nudges the ballistic coast's energy error away from its usual $10^{-11}$ level, the change reached further than the model it was meant to touch. That is a genuine regression, caught by a test that has nothing to do with the atmosphere — the same spirit as the frame-bug case in the previous lesson.

::: key Responding to a golden-file break from a legitimate change
Review every diff against a specific, computed prediction of what the intended change should produce, in direction and magnitude — not merely "is there a difference". Keep the analytic and conservation tests as an independent anchor: they should not move at all, and if they do, the change reached further than intended, however reasonable the intended change was. Record the change and its justification, and regenerate the golden files as a deliberate, reviewed, version-controlled action — never as a way to make a red suite go quiet.
:::

## The tempting shortcut: loosening the tolerance

When the whole suite goes red, there is an easy way to make it green: widen the tolerance until the diffs fit. It feels harmless. It is the most common way a regression suite dies.

::: example What tolerance-loosening costs
The fairing-area bug made the golden-file ratio $2.5$ times its prediction: $150\%$ too large, since $2.5 - 1 = 1.5$. Suppose someone widens the regression tolerance enough to let a $150\%$ deviation through: "the new atmosphere model changes a lot, let's widen the band so the suite goes quiet".

That does not target the fairing bug. It widens the band for *every* golden-file comparison in the suite.

Next month, someone else's change introduces a completely unrelated $30\%$ regression — exactly the kind of error worth catching. It passes without a single flag, because $30\%$ is far inside a band set to admit $150\%$. In fact, any regression smaller than $150\%$, anywhere in the suite, now passes.

The tolerance is not a dial tuned per bug. It is the sensitivity of the whole suite. Once it is spent, it does not come back — and nobody who was not in the room will remember why it was widened.
:::

::: warning Treating "many files changed" as evidence of a widespread bug
A model that legitimately affects most scenarios — atmosphere, mass properties, anything in the Environment box — is *supposed* to move most golden files at once. The number of files that turned red is not, by itself, evidence of anything wrong. What matters is whether each diff matches its predicted direction and size, checked file by file, as in the example, not counted.
:::

::: warning Regenerating goldens before understanding every diff
Regenerating replaces the reference. If the new output still contains the fairing-area bug, then every future run is compared against a baseline that *already has the bug in it*, and the bug becomes permanently invisible to this whole class of test. The order matters absolutely: explain every diff, fix what does not match, and only then regenerate. Regeneration is a **[[one-way door|one-way-door]]** for whatever is still wrong at the moment you walk through it.
:::

## Check yourself

::: check
Why is a golden-file test called "deliberately indiscriminate", and why is that a strength rather than a weakness?
:::

::: answer
It compares today's output with yesterday's without any idea of what the right answer is, so it flags any difference at all — including ones in code paths no analytic or conservation test was ever aimed at. That is a strength because verification and validation tests are narrow by design, each aimed at one quantity. A golden-file diff catches whatever those narrow tests were not looking at. The cost is that it never tells you, by itself, whether a flagged difference is good or bad.
:::

::: check
In the atmosphere example, why does a golden-file ratio that matches the prediction to six decimal places below $30\,\mathrm{km}$ count as strong evidence the change is correct there, while the mismatch above $30\,\mathrm{km}$ points to a bug rather than "more of the same kind of difference"?
:::

::: answer
The prediction was computed independently, from the intended change alone (the density ratio). Matching it to six decimal places means every part of the diff there is accounted for by the one change that was supposed to happen, with nothing left over. Above $30\,\mathrm{km}$, the diff is off from that same prediction by a clean, constant factor of $2.5$. It is not noise and not a smoothly growing discrepancy. It is an exact multiplier that switches on precisely at the fairing-jettison altitude — the signature of a second, separate change, not a bigger dose of the first.
:::

::: check
The new scale height makes the golden-file drag ratio at $20\,\mathrm{km}$ equal $0.604$. Check that number by hand, and say what a diff of $1.10$ at that altitude would tell you.
:::

::: answer
$1/7000 - 1/8500 = 2.521\times10^{-5}\,\mathrm{m^{-1}}$. Times $20{,}000\,\mathrm{m}$ gives $0.504$. Then $e^{-0.504} = 0.604$, matching the table. A diff of $1.10$ is not just the wrong size; it is in the wrong *direction*. The new atmosphere has less air at $20\,\mathrm{km}$, so drag must go down, and a ratio above $1$ says it went up. Something other than the atmosphere change is acting there, and it must be found before any golden file is regenerated.
:::

::: check
Why must the analytic and conservation checks from the previous lesson *not* move when an atmosphere-only model change goes in, and what would it mean if one did?
:::

::: answer
Those checks describe scenarios with no atmosphere at all — a vacuum trajectory, a ballistic coast, torque-free rotation — so an atmosphere change has no legitimate path to affect them. If one moved anyway, the change reached code it should never have touched. The change is broader, and so less understood, than its author believes — whether or not the atmosphere-specific diffs all look correct.
:::

::: check
A reviewer proposes widening the regression tolerance enough to absorb the fairing-area bug's $150\%$ deviation, arguing that "the new atmosphere model is a big change, so a wide tolerance makes sense here". What is wrong with tying the tolerance's width to the size of this particular change?
:::

::: answer
The tolerance belongs to the whole regression suite and applies to every future comparison; it is not a setting scoped to this one diff. Widening it to absorb a $150\%$ deviation from one already-identified bug also silently admits any future regression smaller than $150\%$, anywhere in the suite, including ones with nothing to do with the atmosphere. The suite's sensitivity is spent globally, once, and it does not come back when the bug that motivated the widening is later fixed.
:::

::: check
An inertia-tensor calculation is changed at the same time as an unrelated sensor-noise update, and every golden file involving rotation changes. How would you separate the two changes' effects using this lesson's method, without reverting either one first?
:::

::: answer
Compute an independent prediction for each change on its own. The inertia change should shift *true* quantities such as angular-rate response and momentum by amounts you can compute from the old and new inertia values, with no sensor noise involved. The sensor-noise update should affect only *measured* quantities, and in a way consistent with its new noise parameters; the true dynamics should not move. Then check each class of diff — true dynamics versus measurements — against its own prediction separately, just as the atmosphere example separated the density-ratio prediction from the fairing-area bug instead of treating the whole diff as one blob.
:::

## Summary

| Item | Statement |
| --- | --- |
| What a golden file catches | Any change in output versus a saved reference, including changes no targeted test was aimed at |
| What it cannot tell you | Whether a flagged difference is a bug or an intended improvement |
| The right response | Predict each intended change's effect in direction and size; check every diff against that prediction, not only its existence |
| The anchor | Analytic, conservation and symmetry checks should not move when an unrelated model changes; if they do, the change reached further than intended |
| Worked case | Atmosphere diffs matched $\exp[-h(1/H_{\text{new}} - 1/H_{\text{old}})]$ exactly below $30\,\mathrm{km}$; a fairing-area bug showed as an exact $2.5\times$ factor above it |
| Tolerance loosening | Widening the band to admit one bug's size silently admits every smaller, unrelated regression too: a one-time, global loss of sensitivity |
| Regeneration order | Explain every diff, fix what does not match, only then regenerate, as a deliberate, reviewed, recorded action |

Golden files catch that something changed and, checked carefully, help tell you whether it was the change you meant. The next lesson takes on a related problem: making sure that when you rerun one particular case — to chase exactly this kind of diff — you get the same answer, bit for bit, every time.

::: context fairing The nose cone that comes off
A **payload fairing** is the streamlined shell around the satellite at the top of a rocket. It protects the payload from air pressure and heating on the way up. Once the rocket is high enough that the air is too thin to matter, the fairing splits into halves and falls away, which saves mass. From then on the rocket's front end is smaller, so its drag reference area should shrink — which is exactly the switch the bug in this lesson forgets.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 150" font-family="Inter, Arial, sans-serif">
  <rect x="70" y="80" width="40" height="60" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <path d="M 64,80 L 64,50 Q 64,14 90,8 Q 116,14 116,50 L 116,80 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2"/>
  <text x="90" y="60" font-size="11" text-anchor="middle" fill="#1f2a44">fairing</text>
  <text x="90" y="114" font-size="11" text-anchor="middle" fill="#1f2a44">stage</text>
  <text x="170" y="80" font-size="20" text-anchor="middle" fill="#1f2a44">→</text>
  <rect x="250" y="80" width="40" height="60" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <rect x="258" y="58" width="24" height="22" fill="#f2b880" stroke="#1f2a44" stroke-width="2"/>
  <path d="M 222,74 L 222,44 Q 222,12 246,6 L 246,74 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2" transform="rotate(-20 234 74)"/>
  <path d="M 318,74 L 318,44 Q 318,12 294,6 L 294,74 Z" fill="#8fb8f0" stroke="#1f2a44" stroke-width="2" transform="rotate(20 306 74)"/>
  <text x="270" y="52" font-size="11" text-anchor="middle" fill="#1f2a44">payload</text>
  <text x="170" y="138" font-size="11" text-anchor="middle" fill="#b4232c">smaller front: less area</text>
</svg>
```
:::

::: context tolerance Why not demand an exact match
Computer arithmetic rounds at about the sixteenth digit, and a different compiler, processor or order of operations can change those last digits without anything being wrong. So golden-file comparisons usually allow a small **relative tolerance**: pass if $|x_{\text{new}} - x_{\text{gold}}| \le \text{tol} \times |x_{\text{gold}}|$, with tol something like $10^{-9}$. Some teams insist on bit-exact matches instead, which is stricter and only works if the build is fully deterministic — the subject of the next lesson.
:::

::: context scale-height Two guesses at how fast air thins
Air gets thinner as you climb, roughly exponentially. The **scale height** $H$ sets how fast: every $H$ meters of climb, density drops by a factor of $e \approx 2.72$. A smaller $H$ means the air thins faster. At $10\,\mathrm{km}$ the old model keeps $e^{-10000/8500} = 0.31$ of sea-level density; the new one keeps $e^{-10000/7000} = 0.24$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <line x1="50" y1="130" x2="335" y2="130" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="50" y1="135" x2="50" y2="12" stroke="#1f2a44" stroke-width="1.5"/>
  <polyline fill="none" stroke="#6c7a93" stroke-width="2.5" points="50.0,20.0 78.0,43.1 106.0,61.3 134.0,75.7 162.0,87.1 190.0,96.1 218.0,103.2 246.0,108.8 274.0,113.3 302.0,116.8 330.0,119.5"/>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2.5" points="50.0,20.0 78.0,47.3 106.0,67.9 134.0,83.3 162.0,94.9 190.0,103.6 218.0,110.2 246.0,115.1 274.0,118.8 302.0,121.6 330.0,123.7"/>
  <text x="44" y="24" font-size="11" text-anchor="end" fill="#1f2a44">1</text>
  <text x="44" y="134" font-size="11" text-anchor="end" fill="#1f2a44">0</text>
  <text x="190" y="146" font-size="11" text-anchor="middle" fill="#1f2a44">10 km</text>
  <text x="330" y="146" font-size="11" text-anchor="middle" fill="#1f2a44">20 km</text>
  <line x1="190" y1="127" x2="190" y2="133" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="330" y1="127" x2="330" y2="133" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="150" y="70" font-size="12" fill="#6c7a93">old, H = 8500 m</text>
  <text x="200" y="124" font-size="12" fill="#1d6fd1">new, H = 7000 m</text>
  <text x="58" y="14" font-size="11" fill="#1f2a44">density ÷ sea-level density</text>
</svg>
```
:::

::: context version-control Every change, with its reason
**Version control** software, such as Git, records every change ever made to a set of files: what changed, who changed it, when, and a message saying why. Any old version can be brought back exactly. Keeping golden files under version control means that "the drag numbers all dropped in March" can be traced to one reviewed change with one written reason — instead of being a mystery that someone has to reconstruct from memory.
:::

::: context symmetry-checks Mirror images must stay mirror images
If a scenario is the exact mirror image of another — the same launch, but with the crosswind blowing from the left instead of the right — then the answers must be exact mirror images too: the sideways drift flips sign and everything else stays the same. Like conservation, that follows from the physics, not from any particular numbers in the model. So a symmetry check, like the conservation checks, should never move when a model is improved; if it breaks, something asymmetric crept into code that should have none.
:::

::: context one-way-door Why regeneration cannot be undone in practice
Strictly, version control can bring back the old golden files. The trouble is that nobody knows they should. Once the suite is green again, there is no red flag pointing anyone at the lost evidence. The diffs that would have exposed the bug existed only while the old reference and the new output sat side by side. After regeneration, the buggy behavior *is* the expected behavior, and the test that could have caught it now defends it.
:::
