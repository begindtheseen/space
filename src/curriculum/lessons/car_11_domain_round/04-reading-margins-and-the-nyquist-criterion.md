---
id: l04-reading-margins-and-the-nyquist-criterion
title: "Reading margins off a plot, and when the numbers lie"
minutes: 24
covers:
  - "reading margins from a Bode plot and from a Nyquist plot; the Nyquist criterion"
  - "why a large gain margin with a small phase margin is still a fragile design"
---

Think about a bathroom scale whose needle has wrapped all the way around once. The number you read is perfectly clear and completely wrong. The skill is not only reading the dial. It is knowing when the dial can be trusted.

The previous lesson defined the three stability margins. This one is about what an interviewer does with them next: hand you a plot and ask you to read the margins off it, and hand you a pair of margins that look fine and ask whether you would fly the loop.

Both questions are often failed for the same reason. Margins are taught as a recipe for a **[[Bode plot|bode-plot]]**: find where one curve crosses a line, read the other curve there. When the loop is not the textbook shape, the recipe can give a number that is arithmetically correct and means the opposite of what you think. The **Nyquist criterion** — a rule that counts how a curve loops around one special point — tells you which case you are in.

A quick reminder of the names. $L(j\omega)$, read "L of j omega", is the **open-loop frequency response**: what one trip around the loop does to a wiggle of frequency $\omega$ (omega, in radians per second). Its size is $\lvert L\rvert$ and its phase — how far it delays the wiggle — is $\angle L$.

## Reading margins off a Bode plot

A Bode plot is two graphs stacked on top of each other, sharing the same frequency axis. The top one shows the loop's size, $\lvert L\rvert$, in **[[decibels|decibels]]** (dB, a log scale where $0\,\mathrm{dB}$ means "size exactly 1"). The bottom one shows the phase in degrees.

**Phase margin.** On the top graph, find where the curve crosses $0\,\mathrm{dB}$. That frequency is the **gain crossover**, $\omega_{gc}$ (read "omega g c"). Drop straight down to the phase graph at that same frequency and read the phase. The phase margin is how far that phase sits above $-180^\circ$.

**Gain margin.** On the bottom graph, find where the curve crosses $-180^\circ$. That frequency is the **phase crossover**, $\omega_{pc}$. Go straight up to the magnitude graph and read the size in dB. The gain margin is minus that number. If the magnitude there is $-12\,\mathrm{dB}$, the gain margin is $12\,\mathrm{dB}$.

Three complications an interviewer may build in on purpose:

**Several crossings.** If the phase crosses $-180^\circ$ more than once, each crossing gives a candidate gain margin. The one that counts — the **binding** one — is the crossing with the *largest* magnitude, because it is closest to instability. The same goes for several $0\,\mathrm{dB}$ crossings and the phase margin.

**No crossing.** A phase curve that never reaches $-180^\circ$ gives an infinite gain margin. That usually means the model left out something, like a time delay.

**The slope at crossover.** This is the fastest check on the whole plot. For a **[[minimum-phase|minimum-phase]]** loop, a rule of Bode's called the **gain–phase relation** ties the local slope of the magnitude curve to the local phase. Roughly, each $-20\,\mathrm{dB}$ per decade of slope comes with $-90^\circ$ of phase. (A **decade** is a factor of ten in frequency.) So:

- a loop that crosses $0\,\mathrm{dB}$ on a $-20\,\mathrm{dB/decade}$ slope has a phase near $-90^\circ$ and a healthy margin;
- a loop that crosses on a $-40\,\mathrm{dB/decade}$ slope has a phase near $-180^\circ$ and almost no margin.

So you can estimate the phase margin from the magnitude graph alone. Interviewers notice when you do.

::: key Reading a Bode plot
Phase margin: find $0\,\mathrm{dB}$ on the magnitude curve, read the phase there, measure up from $-180^\circ$. Gain margin: find $-180^\circ$ on the phase curve, read the magnitude there, negate it. With multiple crossings, the binding margin is the worst one. The slope at gain crossover predicts the phase margin on its own: $-20\,\mathrm{dB/decade}$ is comfortable, $-40\,\mathrm{dB/decade}$ is not.
:::

## The Nyquist criterion

The Bode recipe assumes that "how far is the phase from $-180^\circ$ at crossover?" is the right question. The rule that says when it is comes from complex numbers.

Here is the picture. Tie a string to a tree, then walk once around a park holding the other end. If the tree is inside the park, the string ends up wrapped once around it. If the tree is outside, it comes back unwrapped. Counting wraps tells you what is inside without looking. The Nyquist criterion counts wraps the same way: the park is the unstable region, and the trees are closed-loop poles that would make the loop blow up.

A **pole** is a value of $s$ where a transfer function blows up. A closed-loop pole in the **[[right half plane|right-half-plane]]** — where $s$ has a positive real part — means a response that grows without limit. That is instability.

Take the **Nyquist contour**, a closed path in the $s$-plane. Go up the imaginary axis, then clockwise around a half-circle of infinite radius through the right half plane, and back to the start. If a pole sits right on the imaginary axis — an integrator puts one at the origin — make a tiny detour into the right half plane around it. Traced this way, the path wraps the whole right half plane once, clockwise. Plot $L(j\omega)$ along this path. That curve is the **Nyquist plot**.

A result called the **[[argument principle|argument-principle]]** says: trace a clockwise closed path, and the picture of it under a function wraps the origin $Z - P$ times clockwise. Here $Z$ counts the function's zeros inside the path and $P$ counts its poles inside the path.

Now apply it to $1 + L$, step by step.

1. The zeros of $1 + L$ are the closed-loop poles. So $Z$ counts closed-loop poles in the right half plane.
2. The poles of $1 + L$ are the poles of $L$ itself. So $P$ counts open-loop poles in the right half plane.
3. $1 + L$ wraps the origin exactly when $L$ wraps the point $-1$. So we count loops around $-1$.

::: key The Nyquist stability criterion
$Z = N + P$. $Z$ is the number of closed-loop poles in the right half plane, $N$ is the number of **clockwise** encirclements of the $-1$ point by the Nyquist plot of $L$, and $P$ is the number of open-loop unstable poles. Stability is $Z = 0$. An open-loop-unstable plant therefore *requires* counter-clockwise encirclements: $N = -P$.
:::

**Counting by hand.** Draw a ray from $-1$ out to infinity in any direction that does not graze the curve. Count each time the curve crosses the ray: $+1$ for a clockwise crossing, $-1$ for counter-clockwise. The total is $N$.

**Counting by computer.** Add up the unwrapped angle of $1 + L$ all the way round the contour and divide by $2\pi$.

### Margins on the Nyquist plot

Two margins can be read off the same curve.

- The **gain margin** is 1 divided by the size of $L$ where the curve crosses the negative real axis. Scaling the curve up by that factor would push the crossing onto $-1$.
- The **phase margin** is the angle between the negative real axis and the point where the curve crosses the unit circle (the circle of size 1). Rotating the curve by that angle would put that point on $-1$.

A third number shows up on the Nyquist plot and on no Bode plot: the plain straight-line distance from $-1$ to the nearest point of the curve. This is the **modulus margin**:

$$
\min_\omega\lvert 1 + L(j\omega)\rvert
$$

Read "min over omega" as "the smallest value at any frequency". The **[[sensitivity function|sensitivity]]** is $S = 1/(1+L)$. So the modulus margin equals $1/\lVert S\rVert_\infty$, where $\lVert S\rVert_\infty$ (read "the H-infinity norm of S", or the **peak sensitivity** $M_s$) is the largest size $S$ reaches at any frequency.

::: example A loop where the Bode reading means the opposite of what it looks like
Take $L(s) = K(s+1)^2/s^3$ — three integrators and a double zero. That is the shape a PID controller on a triple-integrating plant produces.

**Step 1: find the phase crossover.** Each integrator gives $-90^\circ$, and each zero at $s = -1$ adds $\arctan\omega$. So the phase is $-270^\circ + 2\arctan\omega$. It rises from $-270^\circ$ at low frequency toward $-90^\circ$ at high frequency. It passes $-180^\circ$ exactly once, when $2\arctan\omega = 90^\circ$, which is at $\omega = 1\,\mathrm{rad/s}$.

**Step 2: read the Bode gain margin.** At $K = 2$ the size there is $\lvert L(j1)\rvert = 2 \times \lvert 1 + j\rvert^2 / 1 = 2 \times 2 = 4$. So the Nyquist curve crosses the negative real axis at $-4$ — to the **left** of $-1$. A Bode reading gives a gain margin of $1/4$, which is $20\log_{10}(0.25) = -12.0\,\mathrm{dB}$. A candidate who says "negative gain margin, so unstable" has been caught.

**Step 3: check the truth.** The closed-loop characteristic polynomial is $s^3 + Ks^2 + 2Ks + K$. At $K = 2$ its roots are $-0.681 \pm 1.633j$ and $-0.639$. All three have negative real parts, so the loop is **stable**. Adding up the angle of $1+L$ around the full contour gives $N = 0$. With $P = 0$, the criterion says $Z = 0$. It agrees.

**Step 4: lower the gain.** Reducing $K$ shrinks the whole curve toward the origin, so the crossing slides right. It lands exactly on $-1$ at $K = 0.5$. Below that, $-1$ is enclosed. At $K = 0.4$ the winding count is $N = 2$, so $Z = 2$. The roots confirm it: $+0.039 \pm 0.914j$ and $-0.478$. That pair has a positive real part — unstable.

**Sanity check.** At $K = 0.5$ the roots should sit right on the imaginary axis. They do: $\pm 1j$ and $-0.5$.

This is a **[[conditionally stable|conditionally-stable]]** loop: *lowering* the gain destabilizes it. The $-12\,\mathrm{dB}$ was arithmetically correct. But a Bode reader assumes it says how far the gain can be *raised*. Here it says the gain can be *lowered* by a factor of four. Only the encirclement count settles it — which is exactly what the Nyquist criterion is for.
:::

::: warning Which plot answers which question
Bode is faster for reading numbers, shows *where in frequency* a problem lives, and ties straight to the design tools — a lead network here, a notch filter there. Nyquist answers whether the loop is stable at all, handles an open-loop-unstable plant without special tricks, and shows how close the curve passes to $-1$ in *every* direction, not only the two the gain and phase margins measure. Read margins off Bode; reach for Nyquist the moment the loop is unusual: multiple crossings, an unstable plant, or a conditionally stable shape.
:::

## Why a large gain margin with a small phase margin is still fragile

Picture a bridge rated for four times its expected load, whose deck wobbles wildly whenever a truck crosses. The strength number looks great; you still would not drive across. Here is a control loop like that bridge.

::: example Twelve decibels of gain margin, and unflyable
$$
L(s) = \frac{250}{s\left(1 + \dfrac{s}{10}\right)\left(1 + \dfrac{s}{1000}\right)}
$$

| Quantity | Value |
| --- | --- |
| Gain crossover | $\omega_{gc} = 49.47\,\mathrm{rad/s}$ |
| Phase margin | $8.60^\circ$ |
| Phase crossover | $\omega_{pc} = 100.0\,\mathrm{rad/s}$ |
| Gain margin | $12.13\,\mathrm{dB}$, a factor of $4.04$ |
| Delay margin | $3.03\,\mathrm{ms}$ |
| Modulus margin | $0.147$, so $\lVert S\rVert_\infty = 6.80$ |

The gain margin clears the usual $6\,\mathrm{dB}$ requirement with room to spare. Everything else is a disaster.

**Why the two disagree.** The loop crosses $0\,\mathrm{dB}$ at $49.5\,\mathrm{rad/s}$. That is well past the pole at $10\,\mathrm{rad/s}$, so it crosses on a $-40\,\mathrm{dB/decade}$ slope. The slope rule predicts a tiny phase margin; the exact figure is $8.60^\circ$. But the magnitude keeps falling steeply. By the time the phase really reaches $-180^\circ$, at $100\,\mathrm{rad/s}$, the size has dropped to $0.2475$. One over $0.2475$ is $4.04$ — the comfortable gain margin. **Steep roll-off buys gain margin and destroys phase margin at the same time.** That is the whole mechanism.

**What it costs in time.** The closed-loop poles are $-3.744 \pm 49.797j$ and $-1002.5$. The slow pair has **[[damping ratio|damping-ratio]]** $\zeta = 3.744/\sqrt{3.744^2 + 49.797^2} = 0.0750$. The rule of thumb $\zeta \approx \mathrm{PM}/100$ estimates $8.60/100 = 0.086$ — close enough to be useful. A unit step overshoots by $78.9\%$ and takes $1.02\,\mathrm{s}$ to settle within $2\%$, ringing at about $50\,\mathrm{rad/s}$ the whole way. The standard second-order overshoot formula, $e^{-\pi\zeta/\sqrt{1-\zeta^2}}$, gives $79.0\%$ at $\zeta = 0.0750$, and the simulation agrees.

**What it costs in robustness.** The delay margin is $8.60^\circ$ in radians over the crossover: $0.1500/49.47 = 3.03\,\mathrm{ms}$. A control task running at $200\,\mathrm{Hz}$ has a **[[zero-order hold|zero-order-hold]]** that alone adds about half a sample, $2.5\,\mathrm{ms}$, of equivalent delay. So a digital version at a respectable rate eats most of the budget before any filter or data-bus transfer is added.

**The one number that catches it.** The modulus margin is $0.147$: the Nyquist curve passes within $0.147$ of $-1$. A common requirement is $\ge 0.5$, which is the same as a peak sensitivity $\lVert S\rVert_\infty \le 2$. This loop's peak sensitivity is $6.80$. So at some frequency the feedback *amplifies* disturbances by nearly seven times instead of shrinking them.

**Checking it hangs together.** A peak sensitivity of $M_s$ guarantees

$$
\mathrm{GM} \ge \frac{M_s}{M_s-1}, \qquad \mathrm{PM} \ge 2\arcsin\!\left(\frac{1}{2M_s}\right)
$$

With $M_s = 6.80$, the floors are a gain margin of $6.80/5.80 = 1.17$ — only $1.38\,\mathrm{dB}$ — and a phase margin of $8.43^\circ$. The real gain margin sits far above its floor. The real phase margin, $8.60^\circ$, sits barely above its own. The single number has put its finger exactly on the problem.
:::

::: note Why the bounds from $M_s$ have to be true
Every point of the Nyquist curve is at least $1/M_s$ away from $-1$. Where the curve crosses the negative real axis at $-a$ (with $a < 1$), that distance is $1 - a$. So $1 - a \ge 1/M_s$, which gives $a \le (M_s - 1)/M_s$, and the gain margin $1/a \ge M_s/(M_s - 1)$. Where the curve crosses the unit circle at angle $\mathrm{PM}$ from the negative real axis, the distance from $-1$ is the chord of the unit circle across that angle, $2\sin(\mathrm{PM}/2)$. So $2\sin(\mathrm{PM}/2) \ge 1/M_s$, which gives $\mathrm{PM} \ge 2\arcsin(1/(2M_s))$. The same chord gives the estimate in the next example: $10^\circ$ of phase margin puts the curve within $2\sin 5^\circ \approx 0.174$ of $-1$.
:::

::: key Why a big gain margin does not rescue a small phase margin
They are read at different frequencies off different features and protect against different errors, so neither bounds the other. A steep roll-off after crossover buys gain margin precisely by costing phase, so the combination "large $\mathrm{GM}$, small $\mathrm{PM}$" is not a coincidence but a signature. The symptoms are a lightly damped closed loop that rings and overshoots badly, and a delay margin small enough that ordinary digital implementation eats it. The number that catches the case is the modulus margin, $\min_\omega\lvert1+L\rvert = 1/\lVert S\rVert_\infty$, with a common requirement of $\ge 0.5$.
:::

::: example "This loop has 20 dB of gain margin and 10 degrees of phase margin. Would you fly it?"
**A weak answer:** "The gain margin is good but the phase margin is low — you would want at least thirty degrees. I would add a lead compensator to increase the phase margin."

Correct, but it stops where the interviewer expected the answer to start.

**A strong answer:**

"No — and I would expect those two numbers to come together, not as an unlucky pair. Ten degrees of phase margin with twenty decibels of gain margin says the loop crosses over on a steep slope, something like minus forty decibels per decade. The phase is near minus one-eighty at crossover, then the magnitude keeps dropping fast, which buys the gain margin. One cause, two symptoms.

I would expect closed-loop damping of about one tenth — zeta is roughly the phase margin over a hundred — so a step that overshoots seventy or eighty percent and rings for many cycles. And a delay margin of ten degrees in radians, $0.1745$, divided by the crossover frequency. If it crosses over at fifty radians per second, that is about three and a half milliseconds, which a digital implementation at any ordinary rate will use up on its own.

The number I would actually ask for is the peak sensitivity — the distance from the Nyquist curve to minus one. Ten degrees of phase margin means the curve passes within about $2\sin(5^\circ)$, roughly $0.174$, of the critical point at crossover. So the peak sensitivity is at least about $5.7$. Somewhere this loop amplifies disturbances five or six times instead of rejecting them — a performance problem, not only a stability one.

The fix depends on which constraint is real. If the bandwidth can move, lower the crossover so it happens on the shallower slope. If it cannot, add **[[phase lead|phase-lead]]** near crossover, at the cost of more noise. I would not accept the loop on the gain margin."

**What the interviewer learns:** the strong answer finds one cause behind both numbers, predicts the time response, turns phase margin into a latency figure, reaches for the modulus margin as the deciding number, and states the design trade instead of naming a compensator by reflex.
:::

## Check yourself

::: check
State the Nyquist criterion, define every symbol in it, and say what it requires of a loop around an open-loop-unstable plant.
:::

::: answer
$Z = N + P$. $Z$ is the number of closed-loop poles in the right half plane. $N$ is the number of clockwise encirclements of the $-1$ point by the Nyquist plot of the open-loop transfer function $L$. $P$ is the number of open-loop poles in the right half plane. Stability is $Z = 0$. For an open-loop-unstable plant, $P > 0$, so $N$ must equal $-P$: the curve must circle $-1$ counter-clockwise exactly $P$ times. A design that stays clear of $-1$ entirely — the instinct stable plants train into you — is then guaranteed unstable.
:::

::: check
A magnitude plot crosses $0\,\mathrm{dB}$ on a $-40\,\mathrm{dB}$ per decade slope. Estimate the phase margin without looking at the phase curve, and say what assumption the estimate rests on.
:::

::: answer
Bode's gain–phase relation gives roughly $-90^\circ$ of phase per $-20\,\mathrm{dB}$ per decade of local slope. A $-40\,\mathrm{dB}$ per decade crossover therefore means a phase near $-180^\circ$ and a phase margin near zero — in practice small, ten or twenty degrees, depending on how far away the neighboring break frequencies are. The assumption is that the loop is **minimum phase**: the relation holds only for transfer functions with no right-half-plane zeros and no time delay. A delay or a right-half-plane zero adds lag that the magnitude plot does not show. So the estimate is an upper bound on the margin, never a lower one.
:::

::: check
Why can a loop have a comfortable gain margin and a dangerously small phase margin at the same time? Give the mechanism, not only the fact.
:::

::: answer
The two are read at different frequencies, and a steep magnitude roll-off helps one while wrecking the other. If the loop crosses $0\,\mathrm{dB}$ on a slope of about $-40\,\mathrm{dB}$ per decade, the phase there is already near $-180^\circ$, so the phase margin is small. But that same steep slope means the magnitude has fallen a long way by the time the phase actually reaches $-180^\circ$ — and the gain margin is one over the magnitude *there*. So the fast roll-off causes both the small phase margin and the large gain margin. They are one design fact showing up twice.
:::

::: check
For the fragile loop in this lesson, the phase margin is $8.60^\circ$, and the modulus margin bound says any loop with $\lVert S\rVert_\infty = 6.80$ must have at least $8.43^\circ$. What does the tightness of that inequality tell you about where the sensitivity peak sits?
:::

::: answer
The bound $\mathrm{PM} \ge 2\arcsin(1/(2M_s))$ comes from the chord between $-1$ and the point where the curve crosses the unit circle. It is tight exactly when the closest approach to $-1$ happens at, or very near, the gain crossover. Here the real margin beats the floor by less than two-tenths of a degree, so the sensitivity peak must sit almost exactly at crossover. It does: at about $50\,\mathrm{rad/s}$, against a crossover of $49.5\,\mathrm{rad/s}$. The gain margin's floor, by contrast, is $1.38\,\mathrm{dB}$ against an actual $12.13\,\mathrm{dB}$. That says the negative-real-axis crossing is nowhere near the closest approach. Together, the two comparisons locate the problem in frequency.
:::

::: check
An interviewer gives you a Bode plot whose phase curve crosses $-180^\circ$ at three frequencies, with magnitudes there of $-3\,\mathrm{dB}$, $-14\,\mathrm{dB}$ and $-30\,\mathrm{dB}$. What is the gain margin, and what else should you check before reporting it?
:::

::: answer
The binding crossing is the one with the largest magnitude, $-3\,\mathrm{dB}$, so the gain margin is $3\,\mathrm{dB}$ — a factor of about $1.41$, well under the usual $6\,\mathrm{dB}$ requirement. Reporting $30\,\mathrm{dB}$, or an average, would be the error. Before reporting it, check whether the plant is open-loop stable. With several $-180^\circ$ crossings the loop may be conditionally stable, so a gain *reduction* may also be dangerous, and the encirclement count is the only reliable verdict. Also check whether the magnitude curve crosses $0\,\mathrm{dB}$ more than once, since the phase margin has the same multiple-crossing problem.
:::

## Summary

| Item | Content |
| --- | --- |
| Bode phase margin | Find $0\,\mathrm{dB}$ on magnitude, read phase there, measure up from $-180^\circ$ |
| Bode gain margin | Find $-180^\circ$ on phase, read magnitude there, negate |
| Multiple crossings | The binding margin is the worst one |
| Slope rule | About $-90^\circ$ of phase per $-20\,\mathrm{dB/decade}$; minimum-phase loops only |
| Nyquist criterion | $Z = N + P$; $N$ counts clockwise encirclements of $-1$; stability is $Z = 0$ |
| Unstable plant | $P > 0$ demands $N = -P$, counter-clockwise encirclements |
| Modulus margin | $\min_\omega\lvert1+L\rvert = 1/\lVert S\rVert_\infty$; common requirement $\ge 0.5$ |
| Bounds from $M_s$ | $\mathrm{GM} \ge M_s/(M_s-1)$, $\mathrm{PM} \ge 2\arcsin(1/(2M_s))$ |
| Fragile loop worked above | $\mathrm{GM} = 12.13\,\mathrm{dB}$, $\mathrm{PM} = 8.60^\circ$, $\tau_d = 3.03\,\mathrm{ms}$, $\lVert S\rVert_\infty = 6.80$, $78.9\%$ overshoot |
| Conditionally stable loop | $K(s+1)^2/s^3$: stable at $K=2$, unstable at $K=0.4$; lowering gain destabilizes |

The next lesson leaves the frequency domain for the other subject that opens domain rounds: PID structure, what each term buys and costs, and the two problems — windup and derivative noise — that every real implementation has to handle.

::: context bode-plot Two graphs, one frequency axis
The Bode plot is named after Hendrik Bode, who worked on feedback amplifiers at Bell Telephone Laboratories. Here is the fragile loop from this lesson drawn to scale, from $1$ to $1000\,\mathrm{rad/s}$. The magnitude crosses $0\,\mathrm{dB}$ at about $49.5\,\mathrm{rad/s}$, where the phase is only $8.6^\circ$ above $-180^\circ$. The phase reaches $-180^\circ$ at $100\,\mathrm{rad/s}$, where the magnitude is $12.1\,\mathrm{dB}$ below zero.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 210" font-family="Inter, Arial, sans-serif">
  <line x1="40" y1="51" x2="340" y2="51" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <line x1="40" y1="164" x2="340" y2="164" stroke="#6c7a93" stroke-width="1" stroke-dasharray="4 3"/>
  <text x="36" y="55" font-size="11" text-anchor="end" fill="#1f2a44">0 dB</text>
  <text x="36" y="168" font-size="11" text-anchor="end" fill="#1f2a44">−180°</text>
  <polyline fill="none" stroke="#1d6fd1" stroke-width="2" points="40.0,13.6 50.0,15.2 60.0,16.8 70.0,18.4 80.0,20.0 90.0,21.7 100.0,23.5 110.0,25.3 120.0,27.2 130.0,29.3 140.0,31.5 150.0,34.0 160.0,36.6 170.0,39.3 180.0,42.2 190.0,45.1 200.0,48.1 210.0,51.2 220.0,54.2 230.0,57.3 240.0,60.5 250.0,63.6 260.0,66.7 270.0,69.9 280.0,73.1 290.0,76.3 300.0,79.6 310.0,83.0 320.0,86.5 330.0,90.1 340.0,93.9"/>
  <polyline fill="none" stroke="#1f2a44" stroke-width="2" points="40.0,115.3 50.0,116.2 60.0,117.3 70.0,118.6 80.0,120.2 90.0,122.2 100.0,124.7 110.0,127.5 120.0,130.8 130.0,134.5 140.0,138.3 150.0,142.2 160.0,145.9 170.0,149.3 180.0,152.3 190.0,154.9 200.0,157.2 210.0,159.1 220.0,160.9 230.0,162.5 240.0,164.0 250.0,165.5 260.0,167.1 270.0,168.9 280.0,170.8 290.0,173.1 300.0,175.7 310.0,178.7 320.0,182.1 330.0,185.8 340.0,189.7"/>
  <line x1="209" y1="51" x2="209" y2="164" stroke="#b4232c" stroke-width="1" stroke-dasharray="2 2"/>
  <line x1="240" y1="51" x2="240" y2="164" stroke="#f2b880" stroke-width="1.5" stroke-dasharray="2 2"/>
  <line x1="240" y1="51" x2="240" y2="60.5" stroke="#f2b880" stroke-width="4"/>
  <line x1="209" y1="159" x2="209" y2="164" stroke="#b4232c" stroke-width="4"/>
  <text x="250" y="42" font-size="11" fill="#1f2a44">GM 12.1 dB at 100</text>
  <text x="120" y="185" font-size="11" fill="#b4232c">PM 8.6° at 49.5</text>
  <text x="60" y="12" font-size="11" fill="#1d6fd1">magnitude |L|</text>
  <text x="60" y="108" font-size="11" fill="#1f2a44">phase ∠L</text>
  <text x="190" y="205" font-size="11" text-anchor="middle" fill="#6c7a93">frequency, 1 to 1000 rad/s (log scale)</text>
</svg>
```
:::

::: context decibels Why engineers count in decibels
A decibel turns multiplying into adding. For a gain ratio $g$, the size in decibels is $20\log_{10} g$. So a factor of $10$ is $20\,\mathrm{dB}$, a factor of $2$ is about $6\,\mathrm{dB}$ (more exactly $6.02$), and a factor of $1$ — no change — is $0\,\mathrm{dB}$. A factor below one is negative: a quarter is about $-12\,\mathrm{dB}$. Chaining parts of a loop together multiplies their gains, which on a decibel scale stacks their curves on top of each other. That is why Bode plots are drawn this way. The "deci" means one tenth of a bel, a unit named after Alexander Graham Bell.
:::

::: context minimum-phase What "minimum phase" rules out
A transfer function is **minimum phase** when it has no zeros in the right half plane and no pure time delay. For those systems, the magnitude curve fully decides the phase curve — which is why the slope rule works. A time delay changes the phase without touching the magnitude at all: it keeps the size at 1 but adds lag that grows with frequency. A right-half-plane zero does something similar; you can spot one in a step response when the output first moves the *wrong* way before heading the right way. Both add lag the magnitude plot cannot show, so the slope rule over-promises for them.
:::

::: context right-half-plane Where the unstable poles live
Each pole of a system gives a piece of the response shaped like $e^{st}$. Write $s = \sigma + j\omega$. The real part $\sigma$ (sigma) decides growth: if it is negative, the piece dies away; if it is positive, it grows forever. So stability is a question of which side of the imaginary axis the closed-loop poles sit.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 160" font-family="Inter, Arial, sans-serif">
  <rect x="180" y="10" width="170" height="140" fill="#f2b880" opacity="0.35"/>
  <line x1="10" y1="80" x2="350" y2="80" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="180" y1="10" x2="180" y2="150" stroke="#1f2a44" stroke-width="1.5"/>
  <text x="344" y="96" font-size="11" text-anchor="end" fill="#1f2a44">real part σ</text>
  <text x="186" y="22" font-size="11" fill="#1f2a44">imaginary part jω</text>
  <text x="90" y="40" font-size="12" text-anchor="middle" fill="#1d6fd1">left half: dies away</text>
  <text x="265" y="130" font-size="12" text-anchor="middle" fill="#b4232c">right half: grows</text>
  <g stroke="#1d6fd1" stroke-width="2"><line x1="95" y1="55" x2="105" y2="65"/><line x1="105" y1="55" x2="95" y2="65"/><line x1="95" y1="95" x2="105" y2="105"/><line x1="105" y1="95" x2="95" y2="105"/></g>
  <g stroke="#b4232c" stroke-width="2"><line x1="245" y1="65" x2="255" y2="75"/><line x1="255" y1="65" x2="245" y2="75"/></g>
</svg>
```

The crosses mark example poles: a stable pair on the left, an unstable one on the right.
:::

::: context argument-principle Counting laps around a point
"Argument" here is the old word for the angle of a complex number. The argument principle, a classic result of complex analysis, says that if you follow a function's value around a closed path, the total angle it turns through tells you how many zeros minus poles are inside. Every zero inside adds one full lap; every pole inside takes one away. Harry Nyquist, another Bell Labs engineer, turned this into a stability test for feedback amplifiers in a 1932 paper. The appeal was practical: you can measure $L(j\omega)$ on a test bench at a range of frequencies, without ever solving for the closed-loop poles.
:::

::: context conditionally-stable Stable only in a window of gain
For $L(s) = K(s+1)^2/s^3$ the Nyquist curve crosses the negative real axis at $-2K$. The loop is stable only while that crossing stays to the left of $-1$, that is, for $K > 0.5$. Raise the gain and the loop stays stable; lower it past one half and it goes unstable.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="55" x2="345" y2="55" stroke="#1f2a44" stroke-width="1.5"/>
  <g stroke="#1f2a44" stroke-width="1.5">
    <line x1="30" y1="50" x2="30" y2="60"/><line x1="100" y1="50" x2="100" y2="60"/><line x1="170" y1="50" x2="170" y2="60"/><line x1="240" y1="50" x2="240" y2="60"/><line x1="310" y1="50" x2="310" y2="60"/>
  </g>
  <g font-size="11" fill="#1f2a44" text-anchor="middle">
    <text x="30" y="76">−4</text><text x="100" y="76">−3</text><text x="170" y="76">−2</text><text x="240" y="76">−1</text><text x="310" y="76">0</text>
  </g>
  <circle cx="240" cy="55" r="5" fill="#b4232c"/>
  <text x="240" y="98" font-size="11" text-anchor="middle" fill="#b4232c">critical point</text>
  <circle cx="30" cy="55" r="5" fill="#1d6fd1"/>
  <text x="34" y="36" font-size="11" text-anchor="middle" fill="#1d6fd1">K = 2: stable</text>
  <circle cx="254" cy="55" r="5" fill="#f2b880" stroke="#1f2a44"/>
  <text x="290" y="36" font-size="11" text-anchor="middle" fill="#1f2a44">K = 0.4: unstable</text>
</svg>
```
:::

::: context sensitivity What the sensitivity function measures
Suppose a gust pushes the vehicle. Without feedback, the full push shows up in the output. With feedback, the push at each frequency is multiplied by $S = 1/(1+L)$. Where $\lvert L\rvert$ is large, $S$ is small and the loop squashes the gust. Where $\lvert 1+L\rvert$ is small — the curve passing close to $-1$ — $S$ is large and the loop makes things *worse* than no control at all. The peak sensitivity is the worst-case magnification. A limit of $2$ means feedback never more than doubles a disturbance at any frequency.
:::

::: context damping-ratio Reading ζ
$\zeta$ is the Greek letter zeta. The damping ratio says how quickly a ringing motion dies. At $\zeta = 1$ there is no overshoot at all; at $\zeta = 0$ the ringing never stops. A car's shock absorbers aim for somewhere around $0.3$ to $0.7$. At $\zeta = 0.075$ each swing is only a little smaller than the one before — like a guitar string rather than a car door closing. For a pole pair $-a \pm bj$, $\zeta = a/\sqrt{a^2+b^2}$: the share of the pole's distance from the origin that points to the left.
:::

::: context zero-order-hold Why a digital loop adds half a sample of delay
A flight computer computes a new command once per sample and holds it flat until the next — a staircase. The staircase follows the smooth signal it stands in for, but on average it sits half a step behind. At $200\,\mathrm{Hz}$ one step is $5\,\mathrm{ms}$, so the hold behaves roughly like a $2.5\,\mathrm{ms}$ delay.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 130" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="110" x2="345" y2="110" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="110" x2="20" y2="10" stroke="#1f2a44" stroke-width="1.5"/>
  <line x1="20" y1="100" x2="340" y2="20" stroke="#1d6fd1" stroke-width="2"/>
  <polyline fill="none" stroke="#b4232c" stroke-width="2" points="20,100 80,100 80,85 140,85 140,70 200,70 200,55 260,55 260,40 320,40 320,25 340,25"/>
  <text x="200" y="124" font-size="11" text-anchor="middle" fill="#1f2a44">time: one step = one sample</text>
  <text x="120" y="36" font-size="11" fill="#1d6fd1">smooth command</text>
  <text x="228" y="92" font-size="11" fill="#b4232c">held staircase</text>
</svg>
```
:::

::: context phase-lead What phase lead is
A **lead compensator** is a small filter that pushes the phase *up* — toward less lag — over a chosen band of frequencies. Put that band around crossover and the phase margin grows. The catch is that lead also raises the gain at higher frequencies, so the loop passes more sensor noise to the actuator. That is the "cost in noise" the strong answer mentions, and it is the same trade you will meet with the derivative term of a PID controller in the next lesson.
:::
