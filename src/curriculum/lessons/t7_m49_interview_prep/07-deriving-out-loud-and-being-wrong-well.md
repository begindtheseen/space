---
id: l07-deriving-out-loud-and-being-wrong-well
title: Deriving out loud, and how to be wrong well
minutes: 25
covers:
  - "Deriving out loud: narrating assumptions, stating what you are about to do before doing it, and recovering visibly from an error"
---

A correct derivation, done silently and handed over as a finished formula, tells an interviewer almost nothing about how you think — only that you could, at some point, reproduce a result. The same derivation, narrated as it happens, tells them everything: what you assumed and when, whether you had a plan before you started writing or were searching randomly, and — this is the part that actually separates candidates — what you do the moment something goes wrong. That last part is not a minor addendum to technical skill. In a field where a wrong number confidently reported can be far worse than an honest "I need to check that," how you behave when you are wrong is close to the central thing a whiteboard round exists to measure.

This lesson has two halves. The first is the narration technique itself, demonstrated on two derivations you are unlikely to have already memorized, so that what you are practicing is the skill of deriving out loud rather than the recall of a rehearsed answer. The second, and the more valuable half, is a set of concrete, practise-able scripts for the three moments this actually gets tested: not knowing something, catching your own error mid-derivation, and holding your ground — or correctly not holding it — against pushback on something you got right.

## The narration technique

Three habits, stated plainly, do almost all of the work.

**State what you are about to do before doing it.** Before writing the first line of algebra, say the plan: "I'm going to write the closed-loop characteristic equation for each controller and compare where the poles land." This costs five seconds and buys two things — it gives the interviewer a chance to redirect you before you spend three minutes down a path they were not asking about, and it demonstrates that you are working from a plan rather than searching.

**Introduce assumptions as you make them, not as a footnote at the end.** "I'll treat this as a point mass" or "I'm assuming small angles here" belongs at the moment it becomes relevant, not appended after the answer as a disclaimer. An assumption stated in passing, at the point it starts doing work, reads as understanding; the same assumption bolted onto the end reads as a hedge.

**Narrate at the level of the decision, not the arithmetic.** Do not narrate "now I add three and four." Do narrate "I'll substitute the steady-state condition here to eliminate this variable" — the *why* of a step, not a spoken transcript of mechanical computation. Narrating too finely is as unhelpful as not narrating at all; it buries the one sentence that matters in noise.

::: key
Say the plan before executing it, introduce each assumption at the moment it is used, and narrate the reasoning behind a step rather than its arithmetic. All three exist for the same reason: they let the listener follow your thinking in real time, rather than receive only its output.
:::

## Demonstration: a controller you have not been told to memorize

Take a single-axis rigid body under torque, normalized so $\ddot\theta = u$ — a double integrator, the simplest model of a reaction-wheel-controlled attitude axis or a thruster-controlled translation axis. Say the plan first: compare a proportional-only controller against a proportional-derivative one by writing each closed-loop characteristic equation and reading off the pole locations.

With $u = -K_p\theta$ (P only), the closed loop is $\ddot\theta + K_p\theta = 0$ — worth pausing on, out loud, because this is exactly the undamped harmonic oscillator equation, with no dissipative term anywhere in it. The characteristic equation $s^2 + K_p = 0$ gives roots $s = \pm j\sqrt{K_p}$: purely imaginary, for *any* positive $K_p$. That is marginal stability, not asymptotic stability — the state oscillates forever at constant amplitude, never decaying, and in practice never staying at constant amplitude either, because any unmodelled disturbance pumps energy into a system with no mechanism to dissipate it.

With $u = -(K_p\theta + K_d\dot\theta)$ (PD), the closed loop is $\ddot\theta + K_d\dot\theta + K_p\theta = 0$, and the characteristic equation $s^2 + K_ds + K_p = 0$ has roots with real part $-K_d/2$ — strictly negative for any $K_d > 0$, hence asymptotically stable, with damping ratio $\zeta = K_d/(2\sqrt{K_p})$.

The physical reason is worth stating as clearly as the algebra: derivative feedback is proportional to *velocity*, and a force proportional to and opposing velocity is precisely a dissipative, energy-removing term — a damper. Position feedback alone supplies only a restoring force, like an ideal spring, and an ideal spring with no damper oscillates forever. No amount of increasing $K_p$ fixes this, because $K_p$ only changes the oscillation's frequency, never introduces the missing dissipation. This is the whiteboard-length version of why every real position servo — attitude control included — needs rate information from somewhere, whether a rate gyro, a tachometer, or a derivative estimated from noisy position measurements.

::: example P versus PD, checked numerically
$K_p = 4$, $K_d = 3$. P-only: roots of $s^2+4=0$ are $\pm 2j$ — on the imaginary axis, marginal. PD: roots of $s^2+3s+4=0$ are $-1.5 \pm 1.32j$ — real part $-1.5 = -K_d/2$ exactly as predicted, with $\zeta = 3/(2\sqrt4) = 0.75$, a well-damped closed loop.
:::

## Demonstration: why orbital energy depends only on semi-major axis

Say the plan: use conservation of angular momentum and energy between periapsis and apoapsis, where velocity is purely tangential, and eliminate everything except $a$.

At periapsis and apoapsis, angular momentum conservation gives $r_p v_p = r_a v_a = h$, so $v_a = v_p r_p/r_a$. Energy conservation between the same two points gives $\tfrac12 v_p^2 - \mu/r_p = \tfrac12 v_a^2 - \mu/r_a$. Substitute for $v_a$ and rearrange:

$$
\tfrac12 v_p^2\Big(1 - \frac{r_p^2}{r_a^2}\Big) = \mu\Big(\frac1{r_p}-\frac1{r_a}\Big) \;\Longrightarrow\; \tfrac12 v_p^2\,\frac{(r_a-r_p)(r_a+r_p)}{r_a^2} = \mu\,\frac{r_a-r_p}{r_p r_a}.
$$

Cancel $(r_a - r_p)$ — nonzero for any real ellipse — and use $r_p + r_a = 2a$ (the definition of the semi-major axis, half the major axis, which is exactly $r_p+r_a$):

$$
v_p^2 = \frac{2\mu\,r_a}{r_p(r_a+r_p)} = \frac{\mu\,r_a}{r_p\,a}.
$$

Now compute the specific orbital energy at periapsis, $\varepsilon = \tfrac12v_p^2 - \mu/r_p$, and substitute:

$$
\varepsilon = \frac{\mu\,r_a}{2r_p a} - \frac{\mu}{r_p} = \frac{\mu}{r_p}\left(\frac{r_a}{2a} - 1\right) = \frac{\mu}{r_p}\cdot\frac{r_a - 2a}{2a}.
$$

With $r_a = a(1+e)$, $r_a - 2a = a(e-1) = -a(1-e) = -r_p$ (since $r_p = a(1-e)$), the $r_p$ cancels completely:

$$
\varepsilon = \frac{\mu}{r_p}\cdot\frac{-r_p}{2a} = -\frac{\mu}{2a}.
$$

Every quantity that depended on eccentricity individually — $r_p$, $r_a$, $v_p$ — cancelled along the way, leaving a result that depends on $a$ alone. That cancellation is the content of the result, not an incidental simplification: two orbits with wildly different eccentricity but the same semi-major axis carry exactly the same total energy.

::: example Vis-viva energy, checked numerically
For $a = 8000\,\mathrm{km}$ and $e \in \{0, 0.2, 0.6\}$, computing $\varepsilon$ independently at periapsis and at apoapsis for each case gives the same value in all six evaluations, matching $-\mu/(2a)$ to full numerical precision — confirming both that periapsis and apoapsis energies agree (as conservation requires) and that the eccentricity genuinely drops out.
:::

::: warning
"It can be shown that energy depends only on $a$" is not an acceptable whiteboard answer if you are asked to show it. The full derivation above takes under two minutes once the two substitutions — $r_p+r_a=2a$ and the factoring of $r_a^2-r_p^2$ — are in hand; have those two moves ready rather than the final formula alone.
:::

## When you do not know the answer

The script: state what you *do* know that bounds the answer, name precisely what you are unsure of, reason out loud toward a plausible answer using what you have, and say what would settle it. All four parts matter — skipping the first makes you look empty-handed, skipping the last makes you look like you gave up short of where the reasoning could have taken you.

::: example The bounding script, worked
"What's the momentum storage capacity of a Blue Canyon RWp100?" — a specific number you may not have memorized.

"I don't have that number memorized precisely. What I do know is the order of magnitude: cubesat-class wheels in that product line store somewhere around a tenth of a newton-metre-second, with torque in the single-digit millinewton-metres — I'd reason it out from the wheel's rotor inertia and maximum spin rate if I needed a precise figure, since momentum is $I\omega_{\max}$ for the rotor. If I needed the exact number for a real design, I'd pull the datasheet rather than work from memory, because a wheel-sizing decision shouldn't ride on a recalled figure I'm not fully certain of."

This bounds the answer with real information (product class, rough order of magnitude, and the formula that would produce an exact number given the missing inputs), states plainly what is not known (the precise rated value), and names exactly what would resolve it (the datasheet) — reasoning that would hold up even if the specific number is off.
:::

## When you catch your own error mid-derivation

Stop as soon as you notice — do not push forward hoping it resolves itself, and do not silently erase and restart from the top. Say plainly that you think there is an error a step back, use a sanity check (a dimensional check, a known limiting case, a sign or magnitude check) to relocate it rather than blindly redoing everything, fix the specific step, and continue from there.

::: example Catching a slip, worked
Continuing the PD-controller derivation above, computing the damping ratio: "So $\zeta$ is $K_d$ over... $2\sqrt{K_p}$, giving $3/(2 \times 2) = 0.75$ — wait, let me check that against the pole locations directly rather than trust the formula from memory. The real part of the pole should be $-\zeta\omega_n$, and I computed the real part directly as $-K_d/2 = -1.5$ earlier. With $\omega_n = \sqrt{K_p} = 2$, that means $\zeta = 1.5/2 = 0.75$ — same answer, so the formula was right and I wanted to be sure before relying on it for the next step."

Notice the shape: a moment of doubt stated plainly, a specific and fast check (cross-referencing against an already-derived, more primitive quantity — the pole's real part — rather than re-deriving $\zeta$ from scratch), and a clean continuation. This is a case where the check confirmed no error existed; the same technique, run when there genuinely is a slip, finds it equally fast, because the cross-check does not care in advance whether it will pass.
:::

## When the interviewer pushes back on something correct

Do not cave immediately, and do not dig in defensively either — both are worse than the third option, which is to restate your reasoning concisely and ask, directly, what specifically they are skeptical of. That question does real work: it often reveals that the interviewer is testing your confidence rather than disputing the answer, or that they are working from a different assumption you have not yet heard. If they give a substantive reason, genuinely re-examine it rather than reflexively defending your first answer. If, after that genuine reconsideration, you still believe you were right, say so, with the specific reason, calmly.

::: example Holding ground correctly, worked
"Are you sure it's $R$ that dominates there, not $P$?" — pushback on the earlier claim that the Kalman gain goes to zero as measurement noise grows large.

"Let me walk through why: the gain is $K = P H^T(HPH^T+R)^{-1}$, and if $R$ grows without bound while $P$ stays fixed, the term inside the inverse is dominated by $R$, so $K$ scales like $P H^T / R \to 0$. Is there a specific case you're thinking of where that doesn't hold — maybe one where $P$ is growing at the same time, like right after a long gap with no measurements?" That last question is not a concession; it is a genuine check for whether the interviewer has a real counter-scenario in mind, and if they confirm they were only probing confidence, the original answer stands unchanged and the conversation moves on.
:::

::: warning
Do not treat "are you sure?" as evidence you are wrong. It is one of the most common and most content-free probes in a technical interview, asked as often after a correct answer as an incorrect one, specifically to see whether confidence tracks correctness or tracks social pressure.
:::

## Check yourself

::: check
Name the three narration habits from this lesson, and explain briefly what each one specifically communicates to the listener that silent derivation does not.
:::

::: answer
Stating the plan before executing communicates that you are working from a structure rather than searching — it also gives the listener a chance to redirect before time is spent on an unwanted path. Introducing assumptions at the point they are used, rather than after, communicates that you know precisely which parts of the result depend on which simplifications, rather than treating the assumptions as an afterthought. Narrating the reasoning behind a step, not its arithmetic, communicates the actual decision-making — why this substitution, why this simplification — which is the part a correct final formula, on its own, cannot convey at all.
:::

::: check
Why is $\ddot\theta + K_p\theta = 0$ described as "marginally stable" rather than "stable" outright, and why does that distinction matter for a real attitude control loop?
:::

::: answer
Marginal stability means the poles sit exactly on the imaginary axis — the system neither grows nor decays, oscillating at constant amplitude indefinitely for the idealized, exact model. It matters because "constant amplitude forever" is a knife-edge property: any real system has some unmodelled disturbance, sensor noise, or parasitic dynamics, and a system sitting exactly on the stability boundary can be tipped into genuine instability by an arbitrarily small modelling error or disturbance, since there is no margin — no decaying term — to absorb it. A real attitude loop built with proportional feedback alone is not merely "a bit oscillatory"; it is one unmodelled effect away from diverging.
:::

::: check
Physically, why does derivative (rate) feedback introduce damping into a double-integrator system, when proportional (position) feedback structurally cannot, no matter how it is tuned?
:::

::: answer
A damping force is, by definition, one that opposes velocity and removes energy from the system — proportional to $\dot\theta$ with a sign that resists motion. Derivative feedback, $-K_d\dot\theta$, is exactly that: a force proportional to and opposing velocity. Proportional feedback, $-K_p\theta$, is proportional to *position*, which is precisely the mathematical form of an ideal spring — a restoring force that stores and returns energy but never removes it. Increasing $K_p$ changes the oscillation frequency (a stiffer spring oscillates faster) but introduces no mechanism for energy to leave the system, which is why no amount of proportional gain alone can produce a decaying response; the missing ingredient is structural, not a matter of tuning.
:::

::: check
Walk through the four-part "don't know" script for this question: "What's the exact numerical stability margin requirement in the relevant flight software standard for this class of vehicle?"
:::

::: answer
State what you do know that bounds it: typical practice targets gain margins on the order of 6 dB and phase margins on the order of 30 to 45 degrees for a well-behaved single-loop design, though the exact required numbers vary by program and by how much model uncertainty the design needs to absorb. State precisely what you are unsure of: the specific numerical requirement written into a particular program's flight software standard, which is programme-specific documentation, not a universal physical fact. Reason toward a plausible answer: a tighter margin requirement would be expected for a less well-characterized plant (more model uncertainty) or a safety-critical function with less tolerance for degraded performance. Say what would settle it: pulling the actual verification and validation plan or control design standard for that specific program, since this is exactly the kind of number that is defined by a document, not derived from physics.
:::

::: check
You are narrating a derivation and realize, mid-sentence, that you wrote a sign error two lines back. What do you do in the next fifteen seconds, and what should you specifically avoid doing?
:::

::: answer
Stop at the point you noticed, state plainly that you think there is an error a step or two back, and use a fast, targeted check — a dimensional check, a known special case, or cross-referencing against a more primitive quantity you already trust — to relocate the specific error rather than re-deriving the whole thing from scratch. What to avoid: pushing forward hoping the error will not matter (it usually surfaces later, more confusingly, and costs more time to untangle then), and silently erasing everything to restart without saying anything (which looks like the derivation failed outright, rather than like a specific, locatable, fixable mistake was caught and corrected — which is the more accurate and more favourable description of what actually happened).
:::

::: check
An interviewer says "hm, I don't think that's right" in response to an answer you are confident is correct. What is the single best next move, and why is it better than either restating your answer more firmly or immediately conceding?
:::

::: answer
Ask what specifically they are skeptical of, after briefly restating your reasoning. This is better than restating more firmly, because firmness with no new information does not address whatever is actually driving their doubt and can read as defensiveness rather than confidence. It is better than immediately conceding, because a correct answer abandoned under mild social pressure is a worse outcome than a correct answer defended and confirmed — and it is genuinely informative either way: if they reveal a real counter-consideration, you now have new information to actually reason with; if they confirm they were only probing, you have demonstrated exactly the standing-your-ground-when-right behaviour the probe was designed to test for.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Narration | State the plan before executing, introduce assumptions as they are used, narrate the reasoning behind a step rather than its arithmetic |
| P vs PD | $\ddot\theta+K_p\theta=0$ gives imaginary poles (marginal); $\ddot\theta+K_d\dot\theta+K_p\theta=0$ gives poles with real part $-K_d/2$ (stable) — derivative feedback supplies the missing dissipation |
| Orbital energy | $\varepsilon = -\mu/(2a)$, from periapsis/apoapsis conservation with $r_p+r_a=2a$ eliminating eccentricity entirely |
| Not knowing | Bound it with what you know, name the specific gap, reason toward an answer, say what would settle it |
| Catching a slip | Stop, state it plainly, relocate it with a targeted check, fix the specific step, continue |
| Pushback | Restate reasoning, ask what specifically is doubted, genuinely reconsider if given a real reason, hold ground calmly if not |

The next lessons turn from derivations to the other two technical rounds this module covers: the embedded-flavoured C++ coding round, and the systems and architecture round, each with the same expectation of narrated, defensible reasoning built here.
