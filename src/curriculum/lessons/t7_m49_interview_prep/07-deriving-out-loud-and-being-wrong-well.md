---
id: l07-deriving-out-loud-and-being-wrong-well
title: Deriving out loud, and how to be wrong well
minutes: 29
covers:
  - "Deriving out loud: narrating assumptions, stating what you are about to do before doing it, and recovering visibly from an error"
---

Think about a math teacher who asks you to "show your work". A right answer with no work tells the teacher one thing: you got there somehow. Maybe you knew it, maybe you copied it, maybe you guessed. The work shows *how* you think. It also shows the part the teacher cares about most — what you did when a step went sideways.

A **[[whiteboard round|whiteboard-round]]** in a GNC interview is "show your work", spoken aloud, in real time. A derivation done in silence tells the interviewer almost nothing. Narrated as it happens, it shows what you assumed and when, whether you had a plan, and — the part that separates candidates — what you did the moment something went wrong. In aerospace, a wrong number reported with confidence can be far worse than an honest "I need to check that", so how you behave when wrong is close to the central thing the round measures.

This lesson has two halves. First, the narration technique, shown on two derivations you have probably not memorized, so you practice deriving out loud, not reciting. Second, and more valuable, short scripts for three moments where this gets tested: not knowing something, catching your own error, and handling pushback on something you got right.

## The narration technique

Picture a friend giving you directions on the phone. "Turn left" is useless unless you already know where you are heading. "We're going to the library; first we get onto Main Street, so turn left here" is easy to follow. Narrating a derivation works the same way. Three habits do almost all of the work.

**1. Say what you are about to do before you do it.** Before the first line of algebra, say the plan: "I'm going to write the closed-loop characteristic equation for each controller and compare where the poles land." Five seconds buys two things: the interviewer can redirect you before you spend three minutes on the wrong path, and you show you are working from a plan, not searching.

**2. Introduce each assumption at the moment you make it.** An **assumption** is a simplification you accept so the problem becomes solvable: "I'll treat this as a point mass." Named at the point it starts doing work, it sounds like understanding. Bolted onto the end of the answer, it sounds like an excuse.

**3. Narrate the decision, not the arithmetic.** Not "now I add three and four", but "I'll substitute the steady-state condition here to get rid of this variable" — the *why* of a step. Narrating every tiny operation buries the one sentence that matters under noise.

::: key
Say the plan before executing it, introduce each assumption at the moment it is used, and narrate the reasoning behind a step rather than its arithmetic. All three exist for the same reason: they let the listener follow your thinking in real time, rather than receive only its output.
:::

## Demonstration: a controller you were not told to memorize

Picture a hockey puck on perfect ice. Push it and it speeds up; stop and it keeps gliding. Now steer it back to a spot using only pushes. One axis of a spacecraft turned by a reaction wheel is the same problem. Write the angle as $\theta$ (read "theta") and the torque command as $u$. After scaling the units so the numbers are clean, the model is

$$
\ddot\theta = u.
$$

Read $\ddot\theta$ as "theta double dot": the angular acceleration. This is a **[[double integrator|double-integrator]]** — the command is added up twice to become an angle — the simplest model of a reaction-wheel attitude axis or a thruster-driven translation axis.

Say the plan out loud: "I'll compare a proportional-only controller against a proportional-derivative one. For each, I'll write the closed-loop characteristic equation and read off where the poles sit."

### Proportional only

A **proportional** controller (P) pushes back in proportion to how far off you are: $u = -K_p\theta$. Here $K_p$ ("K sub p") is the **gain**, a positive number saying how hard it pushes. Substitute into the model:

$$
\ddot\theta + K_p\theta = 0.
$$

Pause on this out loud: it is the equation of a mass on an ideal spring, with nothing in it that slows anything down.

The **characteristic equation** — the polynomial whose roots say how the system behaves — is $s^2 + K_p = 0$. Subtract $K_p$ and take the square root: $s = \pm j\sqrt{K_p}$. Here $j$ is the imaginary unit, $j^2 = -1$. These roots are the **[[poles|poles]]** of the closed loop. They are purely imaginary, with zero real part, for *any* positive $K_p$.

That is **marginal stability**, not true stability. The angle swings forever and never settles — and in practice not even at the same size, because any unmodeled disturbance pumps energy into a system with no way to get rid of it.

### Proportional plus derivative

A **proportional-derivative** controller (PD) also pushes against the turning *rate*: $u = -(K_p\theta + K_d\dot\theta)$, where $\dot\theta$ ("theta dot") is the rate and $K_d$ is its gain. Substitute:

$$
\ddot\theta + K_d\dot\theta + K_p\theta = 0.
$$

The characteristic equation is $s^2 + K_d s + K_p = 0$. By the quadratic formula its roots are

$$
s = \frac{-K_d \pm \sqrt{K_d^2 - 4K_p}}{2}.
$$

When the square root is imaginary, the real part of both roots is $-K_d/2$. Even when the square root is real, it is smaller than $K_d$, so both roots stay negative. Either way, the real part is strictly negative for any $K_d > 0$. The system is **asymptotically stable**: every swing dies away. Its **[[damping ratio|damping-ratio]]** is

$$
\zeta = \frac{K_d}{2\sqrt{K_p}},
$$

read "zeta equals K sub d over two root K sub p".

### The physical reason

Say this as plainly as the algebra. Derivative feedback is a force proportional to velocity and opposing it. That is exactly a **damper**, like a car's shock absorber: it removes energy. Position feedback alone is only a restoring force, an ideal spring, and a spring with no damper bounces forever. Turning up $K_p$ only makes it bounce faster. The missing ingredient is structural, not a tuning problem.

That is why every real position servo, attitude control included, needs rate information from somewhere: a rate gyro, a tachometer, or a derivative estimated from noisy position measurements.

::: example P versus PD, checked numerically
Take $K_p = 4$ and $K_d = 3$.

**P only.** The roots of $s^2 + 4 = 0$ are $s = \pm\sqrt{-4} = \pm 2j$. Real part zero: on the imaginary axis, marginally stable.

**PD.** The roots of $s^2 + 3s + 4 = 0$ come from the quadratic formula: $s = (-3 \pm \sqrt{9 - 16})/2 = (-3 \pm \sqrt{-7})/2 = -1.5 \pm 1.32j$.

The real part is $-1.5$, which is exactly $-K_d/2 = -3/2$, as predicted. The damping ratio is $\zeta = 3/(2\sqrt{4}) = 3/4 = 0.75$.

**Sanity check.** A damping ratio between about 0.5 and 1 means a response that settles quickly with only a small overshoot. So 0.75 is a well-damped loop, as a real design should be.
:::

## Demonstration: why orbital energy depends only on the semi-major axis

Picture a skateboarder in a half-pipe: fastest at the bottom, slowest at the top, but total energy — speed plus height — never changes. A satellite on an elliptical orbit does the same. It is fastest at **periapsis**, its closest point to Earth, and slowest at **apoapsis**, its farthest.

The claim to prove: the total energy depends only on the **[[semi-major axis|semi-major-axis]]** $a$, half the long width of the ellipse. How stretched the ellipse is — its **eccentricity** $e$, a number from 0 (a circle) up toward 1 (very stretched) — drops out completely.

Say the plan: "I'll use conservation of angular momentum and energy between periapsis and apoapsis, where the velocity is purely sideways, and eliminate everything except $a$."

Some symbols first. $r_p$ and $r_a$ are the distances from Earth's center at periapsis and apoapsis. $v_p$ and $v_a$ are the speeds there. $\mu$ ("mu") is Earth's gravitational parameter, $3.986 \times 10^{14}\,\mathrm{m^3/s^2}$.

**Step 1: angular momentum.** At those two points the velocity is at right angles to the radius, so the angular momentum per kilogram is just radius times speed. It is conserved:

$$
r_p v_p = r_a v_a = h \quad\Longrightarrow\quad v_a = v_p\,\frac{r_p}{r_a}.
$$

**Step 2: energy.** The **[[specific orbital energy|specific-energy]]** — energy per kilogram — is speed energy minus the depth of the gravity well. It is the same at both points:

$$
\tfrac12 v_p^2 - \frac{\mu}{r_p} = \tfrac12 v_a^2 - \frac{\mu}{r_a}.
$$

**Step 3: substitute and collect.** Put Step 1's $v_a$ into Step 2. Move the speed terms to the left and the gravity terms to the right. Then factor $r_a^2 - r_p^2$ as a difference of squares:

$$
\tfrac12 v_p^2\Big(1 - \frac{r_p^2}{r_a^2}\Big) = \mu\Big(\frac1{r_p}-\frac1{r_a}\Big) \;\Longrightarrow\; \tfrac12 v_p^2\,\frac{(r_a-r_p)(r_a+r_p)}{r_a^2} = \mu\,\frac{r_a-r_p}{r_p r_a}.
$$

**Step 4: cancel and use $2a$.** The factor $(r_a - r_p)$ appears on both sides. It is not zero for a real ellipse, so divide it out. Then use $r_p + r_a = 2a$. That is the definition: the long width of the ellipse, periapsis to apoapsis, is exactly $r_p + r_a$, and $a$ is half of it. Solve for $v_p^2$:

$$
v_p^2 = \frac{2\mu\,r_a}{r_p(r_a+r_p)} = \frac{\mu\,r_a}{r_p\,a}.
$$

**Step 5: compute the energy at periapsis.** Write the energy as $\varepsilon$ ("epsilon") and substitute:

$$
\varepsilon = \frac{\mu\,r_a}{2r_p a} - \frac{\mu}{r_p} = \frac{\mu}{r_p}\left(\frac{r_a}{2a} - 1\right) = \frac{\mu}{r_p}\cdot\frac{r_a - 2a}{2a}.
$$

**Step 6: let $r_p$ cancel.** For an ellipse, $r_a = a(1+e)$ and $r_p = a(1-e)$. So $r_a - 2a = a(e-1) = -a(1-e) = -r_p$. The $r_p$ cancels completely:

$$
\varepsilon = \frac{\mu}{r_p}\cdot\frac{-r_p}{2a} = -\frac{\mu}{2a}.
$$

Everything that depended on eccentricity — $r_p$, $r_a$, $v_p$ — canceled. That cancellation *is* the result, not a lucky tidy-up: two orbits with very different eccentricity but the same semi-major axis carry exactly the same energy.

::: key
Specific orbital energy is $\varepsilon = -\mu/(2a)$: it depends only on the semi-major axis, not on the eccentricity.
:::

::: example Orbital energy, checked numerically
Take $a = 10\,000\,\mathrm{km}$ and three orbits: $e = 0$, $0.1$ and $0.3$. The periapsis radii are $10\,000$, $9\,000$ and $7\,000\,\mathrm{km}$, all safely above Earth's $6\,371\,\mathrm{km}$ radius.

For $e = 0.3$: $r_p = 7\,000\,\mathrm{km}$ and $r_a = 13\,000\,\mathrm{km}$. From Step 4, $v_p = 8\,604\,\mathrm{m/s}$, and from Step 1, $v_a = 8\,604 \times 7/13 = 4\,633\,\mathrm{m/s}$.

- At periapsis: $\tfrac12 v_p^2 = 37.01\,\mathrm{MJ/kg}$ and $\mu/r_p = 56.94\,\mathrm{MJ/kg}$. Subtract: $-19.93\,\mathrm{MJ/kg}$.
- At apoapsis: $\tfrac12 v_a^2 = 10.73\,\mathrm{MJ/kg}$ and $\mu/r_a = 30.66\,\mathrm{MJ/kg}$. Subtract: $-19.93\,\mathrm{MJ/kg}$.

The formula gives $-\mu/(2a) = -3.986\times10^{14}/(2 \times 10^7) = -1.993\times10^7\,\mathrm{J/kg}$, the same $-19.93\,\mathrm{MJ/kg}$.

The same for $e = 0$ and $e = 0.1$ gives $-19.93\,\mathrm{MJ/kg}$ at both points too. Six evaluations, one number: periapsis and apoapsis agree, as conservation requires, and eccentricity really does drop out.
:::

::: warning
"It can be shown that energy depends only on $a$" is not an acceptable whiteboard answer when you are asked to show it. The full derivation takes under two minutes once you have two moves ready: $r_p + r_a = 2a$, and factoring $r_a^2 - r_p^2$. Rehearse those two moves, not only the final formula.
:::

## When you do not know the answer

Picture a hiker who has lost the trail. Marching confidently in a random direction is the worst move; sitting down to wait is next worst. The good move: "The river is east and the road is south, so the trailhead is in between — let me check the map." That is the four-part script for a question you cannot fully answer:

1. **Bound it.** Say what you *do* know that limits the answer.
2. **Name the gap.** Say precisely what you are unsure of.
3. **Reason toward it.** Work out loud toward a plausible answer with what you have.
4. **Say what would settle it.** Name the calculation, test or document.

Skip the first and you look empty-handed. Skip the last and you look like you stopped short of where the reasoning could go.

::: key
Answering past the edge of your knowledge — bound it: say what you do know, state exactly what you are unsure of, reason out loud toward an answer, and say what would settle it. Bluffing is disqualifying in a safety-critical field; silence forfeits the round.
:::

::: example The bounding script, worked
The question: "What's the momentum storage capacity of a Blue Canyon RWp100?" A **[[reaction wheel|reaction-wheel]]** is a spinning disk a spacecraft speeds up or slows down to turn itself, and this is a specific product number you may not have memorized.

"I don't have that number memorized precisely. What I do know is the order of magnitude. Cubesat-class wheels in that product line store somewhere around a tenth of a newton-meter-second, with torque in the single-digit millinewton-meters. If I needed a precise figure, I'd reason it out from the rotor: momentum is $I\omega_{\max}$, the rotor's inertia times its top spin rate. For a real design, though, I'd pull the datasheet rather than work from memory. A wheel-sizing decision shouldn't ride on a recalled figure I'm not fully sure of."

**Why it works.** It bounds the answer with real information (the product class, a rough size, the formula for the exact number), states plainly what is not known (the rated value), and names what would settle it (the datasheet). The reasoning holds up even if the remembered number is somewhat off.
:::

## When you catch your own error mid-derivation

Picture a grocery total that looks too big. You do not start over from the first item, and you do not pretend you didn't notice. You glance back for the one item you misread. Do the same at the whiteboard.

- **Stop as soon as you notice,** and say it plainly: "I think there's an error a step back."
- **Locate it with a targeted check,** not by redoing everything. A **[[sanity check|sanity-check]]** is a fast test an answer must pass: units, a known special case, a believable sign and size.
- **Fix that specific step and continue.**

Do not silently erase the board and restart: that looks as though the whole derivation failed, when really one fixable slip was caught.

::: example Catching a slip, worked
Back in the PD derivation, computing the damping ratio:

"So $\zeta$ is $K_d$ over... $2\sqrt{K_p}$, giving $3/(2 \times 2) = 0.75$. Wait — let me check that against the pole locations directly, rather than trust a formula from memory. The real part of the pole should be $-\zeta\omega_n$, and I already found the real part directly as $-K_d/2 = -1.5$. The natural frequency is $\omega_n = \sqrt{K_p} = 2$. So $\zeta = 1.5/2 = 0.75$. Same answer. The formula was right, and I wanted to be sure before building on it."

**Notice the shape:** doubt said out loud, a fast check against a more basic quantity already derived (the pole's real part) instead of re-deriving $\zeta$, then a clean continuation.

This time the check found no error. When there really is a slip, the same check finds it just as fast.
:::

## When the interviewer pushes back on something correct

Picture a coach questioning a referee's call. A good referee neither flips the call the moment someone frowns nor refuses to listen: the referee explains the call and asks what the coach saw.

When an interviewer doubts a correct answer, do not cave, and do not dig in defensively. Restate your reasoning briefly and ask what specifically they doubt. That question does real work. Often it shows they are testing your confidence, not disputing the answer; sometimes it reveals an assumption you had not heard. If they give a real reason, actually re-examine your answer. If after honest reconsideration you still think you are right, say so calmly, with the specific reason.

::: example Holding ground correctly, worked
Earlier you claimed the Kalman gain goes to zero as the measurement noise grows large. The interviewer asks: "Are you sure it's $R$ that dominates there, not $P$?" Here $R$ is the measurement-noise covariance, $P$ the filter's own uncertainty, and $H$ the matrix that turns the state into a predicted measurement.

"Let me walk through why. The gain is $K = P H^T(HPH^T+R)^{-1}$. If $R$ grows without bound while $P$ stays fixed, the term inside the inverse is dominated by $R$, so $K$ scales like $P H^T / R$, which goes to zero. Is there a specific case you're thinking of where that doesn't hold — maybe one where $P$ is growing at the same time, like right after a long gap with no measurements?"

That last question is not a concession; it checks honestly for a real counter-example. If they were only probing, the answer stands and the conversation moves on.
:::

::: warning
Do not treat "are you sure?" as evidence you are wrong. It is one of the most common probes in a technical interview, and it carries no information on its own. Interviewers ask it after correct answers as often as after wrong ones, to see whether your confidence follows the evidence or follows the social pressure.
:::

## Check yourself

::: check
Name the three narration habits from this lesson, and say briefly what each one tells the listener that a silent derivation does not.
:::

::: answer
1. **Stating the plan first** shows you are working from a structure, not searching, and lets the listener redirect you before time goes down an unwanted path.
2. **Introducing each assumption where it is used** shows you know which parts of the result depend on which simplifications.
3. **Narrating the reasoning behind a step** shows the actual decisions — why this substitution, why this simplification — which a correct final formula alone cannot show.
:::

::: check
Why is $\ddot\theta + K_p\theta = 0$ called "marginally stable" rather than "stable", and why does that difference matter for a real attitude control loop?
:::

::: answer
Marginal stability means the poles sit exactly on the imaginary axis: in the exact model the system neither grows nor decays, but oscillates at constant amplitude forever.

That is a knife edge. Every real system has unmodeled disturbances, sensor noise or extra dynamics, and a system on the stability boundary has no decaying term to absorb them, so an arbitrarily small modeling error can tip it into real instability. A proportional-only attitude loop is not merely "a bit wobbly"; it is one unmodeled effect away from diverging.
:::

::: check
Physically, why does derivative (rate) feedback add damping to a double integrator, when proportional (position) feedback cannot, no matter how it is tuned?
:::

::: answer
A damping force opposes velocity and removes energy: it is proportional to $\dot\theta$, with the sign that resists motion. Derivative feedback, $-K_d\dot\theta$, is exactly that.

Proportional feedback, $-K_p\theta$, is proportional to *position* — the form of an ideal spring, which stores energy and gives it back but never removes it. Raising $K_p$ changes the frequency (a stiffer spring bounces faster) but gives energy no way to leave. The missing ingredient is structural, not a matter of tuning.
:::

::: check
Walk through the four-part "don't know" script for this question: "What's the exact numerical stability margin requirement in the relevant flight software standard for this class of vehicle?"
:::

::: answer
1. **Bound it.** Typical practice targets a **[[gain margin|stability-margins]]** around 6 dB and a phase margin around 30 to 45 degrees for a well-behaved single-loop design; the exact numbers vary by program and by how much model uncertainty the design must absorb.
2. **Name the gap.** The specific number in a particular program's standard — program documentation, not a physical fact.
3. **Reason toward it.** Expect a tighter requirement for a less well-known plant (more model uncertainty), or for a safety-critical function with little tolerance for degraded performance.
4. **Say what would settle it.** That program's control design standard or its verification and validation plan: this number is defined by a document, not derived from physics.
:::

::: check
You are narrating a derivation and realize, mid-sentence, that you made a sign error two lines back. What do you do in the next fifteen seconds, and what should you avoid?
:::

::: answer
**Do:** stop where you noticed. Say plainly that you think there is an error a step or two back. Use a fast, targeted check — units, a known special case, or a comparison against a more basic quantity you already trust — to find the specific step, rather than re-deriving everything. Fix that step and carry on.

**Avoid** pushing forward and hoping the error will not matter — it usually surfaces later, more confusingly, and costs more time then. And avoid silently erasing everything and restarting, which looks as if the whole derivation failed. What really happened — a specific, fixable mistake was caught and corrected — is both more accurate and more favorable to you.
:::

::: check
An interviewer says "hm, I don't think that's right" about an answer you are confident is correct. What is the single best next move, and why is it better than restating your answer more firmly or conceding at once?
:::

::: answer
Briefly restate your reasoning, then ask what specifically they doubt.

Restating more firmly adds no information, does not address what is driving their doubt, and can read as defensive. Conceding throws away a correct answer under mild social pressure.

The question is useful either way. A real counter-argument gives you new information to reason with. If they were only probing, you have shown exactly what the probe tests: holding your ground when you are right.
:::

## Summary

| Idea | Statement |
| --- | --- |
| Narration | State the plan before executing, introduce assumptions as they are used, narrate the reasoning behind a step rather than its arithmetic |
| P vs PD | $\ddot\theta+K_p\theta=0$ gives imaginary poles (marginal); $\ddot\theta+K_d\dot\theta+K_p\theta=0$ gives poles with real part $-K_d/2$ (stable), damping ratio $\zeta = K_d/(2\sqrt{K_p})$ — derivative feedback supplies the missing dissipation |
| Orbital energy | $\varepsilon = -\mu/(2a)$, from periapsis/apoapsis conservation, with $r_p+r_a=2a$ eliminating eccentricity entirely |
| Not knowing | Bound it with what you know, name the specific gap, reason toward an answer, say what would settle it |
| Catching a slip | Stop, say it plainly, find it with a targeted check, fix that step, continue |
| Pushback | Restate your reasoning, ask what specifically is doubted, reconsider honestly if given a real reason, hold your ground calmly if not |

The next two lessons turn to the other two technical rounds in this module: the embedded-flavored C++ coding round, and the systems and architecture round. Both expect the same narrated, defensible reasoning you practiced here.

::: context whiteboard-round What a whiteboard round looks like
In a whiteboard round an interviewer names a result — "derive the rocket equation", "show me why PD control is stable" — and you work it out standing at a board, or in a shared document on a video call, with no notes. It usually lasts 30 to 60 minutes and covers one to three problems. The interviewer is allowed to interrupt, and usually will. The final formula is rarely in doubt; most candidates at this level can get there eventually. What gets written in the interviewer's notes afterward is how you got there: what you assumed, how you checked yourself, and how you responded to a hint or a challenge.
:::

::: context double-integrator Why "double integrator"
To **integrate** is to add something up over time. Add up acceleration and you get velocity. Add up velocity and you get position. The command $u$ is an acceleration, so it has to be integrated twice to become the angle $\theta$.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 100" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="50" x2="92" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="92,45 102,50 92,55" fill="#1f2a44"/>
  <text x="45" y="40" font-size="13" text-anchor="middle" fill="#1f2a44">u</text>
  <rect x="102" y="28" width="50" height="44" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="127" y="56" font-size="18" text-anchor="middle" fill="#1f2a44">∫</text>
  <line x1="152" y1="50" x2="202" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="202,45 212,50 202,55" fill="#1f2a44"/>
  <text x="180" y="40" font-size="13" text-anchor="middle" fill="#1f2a44">θ̇</text>
  <rect x="212" y="28" width="50" height="44" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="237" y="56" font-size="18" text-anchor="middle" fill="#1f2a44">∫</text>
  <line x1="262" y1="50" x2="322" y2="50" stroke="#1f2a44" stroke-width="2"/>
  <polygon points="322,45 332,50 322,55" fill="#1f2a44"/>
  <text x="295" y="40" font-size="13" text-anchor="middle" fill="#1f2a44">θ</text>
  <text x="180" y="92" font-size="12" text-anchor="middle" fill="#6c7a93">acceleration → rate → angle</text>
</svg>
```

With nothing slowing it, a double integrator keeps whatever speed it is given — the hockey puck on ice. That is why it is the classic test case for "does your controller supply damping?"
:::

::: context poles Where the poles sit
A **pole** is a root of the characteristic equation. Plot each one on a flat map: real part left to right, imaginary part up and down. The real part says whether motion grows or dies away. The imaginary part says how fast it wobbles.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="20" y="10" width="160" height="160" fill="#8fb8f0" fill-opacity="0.25"/>
  <line x1="20" y1="90" x2="330" y2="90" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="10" x2="180" y2="170" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="325" y="84" font-size="12" text-anchor="end" fill="#1f2a44">real</text>
  <text x="186" y="22" font-size="12" fill="#1f2a44">imaginary</text>
  <g stroke="#b4232c" stroke-width="2.5">
    <line x1="175" y1="40" x2="185" y2="50"/><line x1="185" y1="40" x2="175" y2="50"/>
    <line x1="175" y1="130" x2="185" y2="140"/><line x1="185" y1="130" x2="175" y2="140"/>
  </g>
  <text x="192" y="49" font-size="12" fill="#b4232c">P: ±2j</text>
  <g stroke="#1d6fd1" stroke-width="2.5">
    <line x1="141" y1="55" x2="151" y2="65"/><line x1="151" y1="55" x2="141" y2="65"/>
    <line x1="141" y1="115" x2="151" y2="125"/><line x1="151" y1="115" x2="141" y2="125"/>
  </g>
  <text x="110" y="80" font-size="12" text-anchor="middle" fill="#1d6fd1">PD: −1.5 ± 1.32j</text>
  <text x="100" y="160" font-size="12" text-anchor="middle" fill="#1f2a44">left half: dies away</text>
</svg>
```

The scale is 22.5 pixels per unit. The P poles sit on the dividing line: no decay. The PD poles sit 1.5 units into the shaded left half, where every oscillation shrinks.
:::

::: context damping-ratio What the damping ratio measures
The **damping ratio** $\zeta$ says how quickly a wobble dies compared with how fast it wobbles. At $\zeta = 0$ it never dies — the P-only case. At $\zeta = 1$, called critical damping, the system returns as fast as it can without overshooting at all. In between, it overshoots a little and settles. For $\zeta = 0.75$ the first overshoot is about 3% of the step, which is why values from about 0.5 to 0.8 are a common design target. The **natural frequency** $\omega_n$ ("omega sub n") is how fast the system would oscillate with no damping; here $\omega_n = \sqrt{K_p}$, and the real part of the poles is $-\zeta\omega_n$.
:::

::: context semi-major-axis Periapsis, apoapsis and the long width
Earth sits at one **focus** of the ellipse, not at its center. So the orbit's closest point, periapsis, and farthest point, apoapsis, are at opposite ends of the long axis, on either side of Earth.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 215" font-family="Inter, Arial, sans-serif">
  <ellipse cx="180" cy="95" rx="100" ry="80" fill="none" stroke="#1d6fd1" stroke-width="2.5"/>
  <circle cx="240" cy="95" r="10" fill="#8fb8f0" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="240" y="76" font-size="12" text-anchor="middle" fill="#1f2a44">Earth</text>
  <circle cx="280" cy="95" r="4" fill="#1f2a44"/>
  <circle cx="80" cy="95" r="4" fill="#1f2a44"/>
  <text x="286" y="99" font-size="12" fill="#1f2a44">periapsis</text>
  <text x="74" y="99" font-size="12" text-anchor="end" fill="#1f2a44">apoapsis</text>
  <line x1="80" y1="95" x2="240" y2="95" stroke="#b4232c" stroke-width="2"/>
  <line x1="240" y1="95" x2="280" y2="95" stroke="#f2b880" stroke-width="3"/>
  <text x="160" y="113" font-size="12" text-anchor="middle" fill="#b4232c">r_a</text>
  <text x="260" y="113" font-size="12" text-anchor="middle" fill="#1f2a44">r_p</text>
  <line x1="80" y1="195" x2="280" y2="195" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="80" y1="189" x2="80" y2="201" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="280" y1="189" x2="280" y2="201" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="180" y="210" font-size="12" text-anchor="middle" fill="#1f2a44">r_a + r_p = 2a</text>
</svg>
```

Drawn with eccentricity 0.6, so Earth sits 0.6 of the way from the center to the end. The two distances laid end to end span the whole long axis, which is why $r_p + r_a = 2a$.
:::

::: context specific-energy Why the energy is negative
"Specific" means per kilogram, so the units are joules per kilogram. Gravitational energy is counted as zero far away from Earth and negative close in: you are down in a well, and it takes energy to climb out. A bound orbit does not have enough speed energy to escape, so its total is below zero. The deeper the orbit, the more negative. At zero total energy the path stops closing and becomes a parabola — escape. This is why $-\mu/(2a)$ has a minus sign, and why a bigger orbit (larger $a$) has energy closer to zero: raising an orbit means adding energy.
:::

::: context reaction-wheel How a spacecraft turns without pushing on anything
A **reaction wheel** is a heavy disk driven by an electric motor. Spin it up one way and the spacecraft turns the other way, because the total angular momentum stays fixed. The **momentum storage** is how much angular momentum the wheel can hold at its top speed, in newton-meter-seconds. Once a wheel reaches that top speed it is **saturated** and can no longer absorb disturbances, so the spacecraft has to "dump" momentum using thrusters or magnetic torquers. That is why the storage number matters for sizing: too small, and you dump momentum constantly.
:::

::: context sanity-check Three checks that find most slips
**Units.** Both sides of an equation must have the same units. If a speed comes out in $\mathrm{m^2/s}$, a step is wrong. **A special case you know.** Set eccentricity to zero and a result about ellipses must reduce to the circle answer. Set a gain to zero and a controller result must reduce to the uncontrolled plant. **Sign and size.** An energy for a bound orbit must be negative; a damping ratio for a stable loop must be positive; a spacecraft speed near Earth should be a few kilometers per second. Each check takes seconds, and each points to *where* the slip is, which is what makes it faster than redoing the whole thing.
:::

::: context stability-margins What gain and phase margins mean
A **gain margin** says how much the loop gain could grow before the closed loop goes unstable. It is written in decibels, and 6 dB means a factor of $10^{6/20} \approx 2$: the gain could double. A **phase margin** says how much extra delay, measured as phase angle, the loop could tolerate at the frequency where its gain crosses one. Both are safety buffers against a model that is not quite right. This module's controls lesson comes back to them in detail, along with how they are read off a Bode plot.
:::
