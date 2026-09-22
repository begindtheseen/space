---
id: l04-reading-margins-and-the-nyquist-criterion
title: "Reading margins off a plot, and when the numbers lie"
minutes: 21
covers:
  - "reading margins from a Bode plot and from a Nyquist plot; the Nyquist criterion"
  - "why a large gain margin with a small phase margin is still a fragile design"
---

The previous lesson defined the three margins. This one is about the two things an interviewer does with them next: hand you a plot and ask you to read the numbers off it, and hand you a pair of numbers that look fine and ask whether you would fly the loop.

Both are fair questions and both are commonly failed, for the same underlying reason. Margins are usually taught as a recipe applied to a Bode plot — find where the curve crosses, read the other curve — and the recipe works until the loop is not the textbook shape. When it is not, the Bode reading can produce a number that is arithmetically correct and means the opposite of what the reader assumes. The Nyquist criterion is what tells you which case you are in, which is why it is worth being able to state rather than merely having heard of.

## Reading margins off a Bode plot

The procedure is two lookups in opposite directions.

**Phase margin.** On the magnitude plot, find where the curve crosses $0\,\mathrm{dB}$. That is $\omega_{gc}$. Drop to the phase plot at the same frequency, read the phase, and the margin is how far it sits above $-180^\circ$.

**Gain margin.** On the phase plot, find where the curve crosses $-180^\circ$. That is $\omega_{pc}$. Rise to the magnitude plot at the same frequency and read the magnitude in dB. The gain margin is minus that number: if the magnitude there is $-12\,\mathrm{dB}$, the gain margin is $12\,\mathrm{dB}$.

Three complications that an interviewer may deliberately build into the plot they hand you.

**Several crossings.** If the phase crosses $-180^\circ$ more than once, there are several candidate gain margins, and the binding one is the crossing with the *largest* magnitude — the one closest to instability. The same applies to multiple $0\,\mathrm{dB}$ crossings and phase margin.

**No crossing.** A phase curve that never reaches $-180^\circ$ gives infinite gain margin. As the previous lesson said, that is usually a modelling gap rather than a design triumph.

**The slope at crossover.** This is the fastest diagnostic on the whole plot and it is worth knowing cold. For a minimum-phase loop, Bode's gain–phase relation ties local slope to local phase: roughly $-90^\circ$ of phase for every $-20\,\mathrm{dB}$ per decade of slope. So a loop crossing over on a $-20\,\mathrm{dB/decade}$ slope has a phase near $-90^\circ$ and a healthy margin; a loop crossing over on a $-40\,\mathrm{dB/decade}$ slope has a phase near $-180^\circ$ and almost none. You can estimate the phase margin from the magnitude plot alone, before looking at the phase curve at all, and interviewers notice when you do.

::: key Reading a Bode plot
Phase margin: find $0\,\mathrm{dB}$ on the magnitude curve, read the phase there, measure up from $-180^\circ$. Gain margin: find $-180^\circ$ on the phase curve, read the magnitude there, negate it. With multiple crossings, the binding margin is the worst one. The slope at gain crossover predicts the phase margin on its own: $-20\,\mathrm{dB/decade}$ is comfortable, $-40\,\mathrm{dB/decade}$ is not.
:::

## The Nyquist criterion

The Bode recipe assumes that "distance from $-180^\circ$ at crossover" is the right question. The criterion that says when it is comes from complex analysis, and it is short enough to state in full.

Take the **Nyquist contour**: up the imaginary axis, clockwise around a semicircle of infinite radius through the right half plane, and back, with a small detour into the right half plane around any pole sitting on the imaginary axis — which for an integrator means around the origin. Traversed that way it encircles the entire right half plane once, clockwise. Plot $L(j\omega)$ along it: that is the Nyquist plot.

The argument principle says that the image of a clockwise contour encircles the origin $Z - P$ times clockwise, where $Z$ and $P$ count the zeros and poles of the function inside the contour. Apply it to $1 + L$: its zeros inside the contour are the closed-loop poles in the right half plane, its poles are the open-loop poles of $L$, and encirclements of the origin by $1 + L$ are encirclements of $-1$ by $L$.

::: key The Nyquist stability criterion
$Z = N + P$. $Z$ is the number of closed-loop poles in the right half plane, $N$ is the number of **clockwise** encirclements of the $-1$ point by the Nyquist plot of $L$, and $P$ is the number of open-loop unstable poles. Stability is $Z = 0$. An open-loop-unstable plant therefore *requires* counter-clockwise encirclements: $N = -P$.
:::

Counting by hand: draw a ray from $-1$ out to infinity in any direction that avoids awkward tangencies and count crossings of it, positive for clockwise and negative for counter-clockwise. Counting numerically: accumulate the unwrapped argument of $1 + L$ all the way round the contour and divide by $2\pi$.

Two margins are read directly off the same polar curve. The gain margin is the reciprocal of the magnitude where the curve crosses the negative real axis, because scaling by that factor pushes the crossing onto $-1$. The phase margin is the angle between the negative real axis and the point where the curve crosses the unit circle, because rotating by that angle does the same. A third quantity is visible on the Nyquist plot and on no Bode plot: the plain Euclidean distance from $-1$ to the curve, $\min_\omega\lvert 1 + L(j\omega)\rvert$, the **modulus margin**. Since the sensitivity function is $S = 1/(1+L)$, that distance equals $1/\lVert S\rVert_\infty$.

::: example A loop where the Bode reading means the opposite of what it looks like
Take $L(s) = K(s+1)^2/s^3$ — three integrators and a double zero, which is the shape a PID controller on a triple-integrating plant produces. The phase is $-270^\circ + 2\arctan\omega$, rising from $-270^\circ$ at low frequency toward $-90^\circ$ at high frequency, and it passes through $-180^\circ$ exactly once, at $\omega = 1\,\mathrm{rad/s}$.

At $K = 2$ the magnitude there is $\lvert L(j1)\rvert = 4$, so the Nyquist curve crosses the negative real axis at $-4$ — to the **left** of the critical point. A Bode reading gives a gain margin of $1/4$, which is $-12.0\,\mathrm{dB}$, and a candidate who reports "negative gain margin, therefore unstable" has just been caught.

The closed-loop characteristic polynomial is $s^3 + Ks^2 + 2Ks + K$. At $K = 2$ its roots are $-0.681 \pm 1.633j$ and $-0.639$: all in the left half plane, so the loop is stable. Accumulating the argument of $1+L$ around the full contour gives $N = 0$, and with $P = 0$ the criterion returns $Z = 0$, in agreement.

Now *lower* the gain. Reducing $K$ shrinks the curve radially, and the negative-real-axis crossing moves right, reaching $-1$ exactly at $K = 0.5$. Below that the critical point is enclosed: at $K = 0.4$ the winding count is $N = 2$, so $Z = 2$, and the roots confirm it — $+0.039 \pm 0.914j$ and $-0.478$, an unstable pair.

This is a **conditionally stable** loop: reducing the gain destabilises it. The number $-12\,\mathrm{dB}$ was arithmetically correct and meant something entirely different from what a Bode reader assumes, which is that the gain can be raised by that factor. Here it says the gain can be *lowered* by a factor of four. The only thing that settles it is the encirclement count, which is exactly what the Nyquist criterion is for.
:::

::: warning Which plot answers which question
Bode is faster for reading numbers, better for seeing *where in frequency* a problem lives, and directly tied to the design levers — a lead network here, a notch there. Nyquist is the one that answers whether the loop is stable at all, is the only one that handles an open-loop-unstable plant without special pleading, and is the only one that shows how close the curve passes to the critical point rather than how close it passes along two particular directions. In a domain round, read margins off Bode and reach for Nyquist the moment the loop is unusual: multiple crossings, an unstable plant, or a conditionally stable shape.
:::

## Why a large gain margin with a small phase margin is still fragile

Now the second question. Here is a loop with an entirely respectable gain margin that no one should fly.

::: example Twelve decibels of gain margin, and unflyable
$$L(s) = \frac{250}{s\left(1 + \dfrac{s}{10}\right)\left(1 + \dfrac{s}{1000}\right)}$$

| Quantity | Value |
| --- | --- |
| Gain crossover | $\omega_{gc} = 49.47\,\mathrm{rad/s}$ |
| Phase margin | $8.60^\circ$ |
| Phase crossover | $\omega_{pc} = 100.0\,\mathrm{rad/s}$ |
| Gain margin | $12.13\,\mathrm{dB}$, a factor of $4.04$ |
| Delay margin | $3.03\,\mathrm{ms}$ |
| Modulus margin | $0.147$, so $\lVert S\rVert_\infty = 6.80$ |

The gain margin clears the usual $6\,\mathrm{dB}$ requirement with room to spare. Everything else is a disaster.

**Why the two disagree.** The loop crosses $0\,\mathrm{dB}$ at $49.5\,\mathrm{rad/s}$, which is well past the pole at $10\,\mathrm{rad/s}$, so it is crossing over on a $-40\,\mathrm{dB/decade}$ slope. By the slope rule that alone predicts a phase near $-180^\circ$ and a tiny margin, and the exact figure is $8.60^\circ$. But the magnitude keeps falling at that steep rate, so by the time the phase actually reaches $-180^\circ$ at $100\,\mathrm{rad/s}$ the magnitude has dropped to $0.2475$ — hence a comfortable gain margin. **Steep roll-off buys gain margin and destroys phase margin at the same time**, and that is the whole mechanism.

**What it costs in the time domain.** The closed-loop poles are $-3.744 \pm 49.797j$ and $-1002.5$. The dominant pair has damping $\zeta = 0.0750$ — which the rule of thumb $\zeta \approx \mathrm{PM}/100$ estimates as $0.086$, close enough to be useful. A unit step overshoots by $78.9\%$ and takes $1.02\,\mathrm{s}$ to settle within $2\%$, ringing at about $50\,\mathrm{rad/s}$ the whole way. The standard second-order overshoot formula at $\zeta = 0.0750$ predicts $79.0\%$, and the simulation agrees.

**What it costs in robustness.** The delay margin is $3.03\,\mathrm{ms}$. A $200\,\mathrm{Hz}$ control task's zero-order hold alone contributes about $2.5\,\mathrm{ms}$ of equivalent delay, so implementing this loop digitally at a very respectable rate consumes most of the entire budget before a single filter or bus transfer is added.

**The one number that catches it.** The modulus margin is $0.147$: the Nyquist curve passes within $0.147$ of the critical point. A common requirement is $\ge 0.5$, equivalently a peak sensitivity $\lVert S\rVert_\infty \le 2$. This loop's peak sensitivity is $6.80$, meaning there is a frequency at which the feedback *amplifies* disturbances by a factor of nearly seven rather than rejecting them.

The consistency of it is worth checking. A peak sensitivity of $M_s$ guarantees $\mathrm{GM} \ge M_s/(M_s-1)$ and $\mathrm{PM} \ge 2\arcsin\!\left(1/(2M_s)\right)$. With $M_s = 6.80$ those floors are a gain margin of $1.17$ — only $1.38\,\mathrm{dB}$ — and a phase margin of $8.43^\circ$. The actual gain margin sits far above its floor while the actual phase margin, $8.60^\circ$, sits barely above its own. The single number has located the problem exactly.
:::

::: key Why a big gain margin does not rescue a small phase margin
They are read at different frequencies off different features and protect against different errors, so neither bounds the other. A steep roll-off after crossover buys gain margin precisely by costing phase, so the combination "large $\mathrm{GM}$, small $\mathrm{PM}$" is not a coincidence but a signature. The symptoms are a lightly damped closed loop that rings and overshoots badly, and a delay margin small enough that ordinary digital implementation eats it. The number that catches the case is the modulus margin, $\min_\omega\lvert1+L\rvert = 1/\lVert S\rVert_\infty$, with a common requirement of $\ge 0.5$.
:::

::: example "This loop has 20 dB of gain margin and 10 degrees of phase margin. Would you fly it?"
**A weak answer:** "The gain margin is good but the phase margin is low — you would want at least thirty degrees. I would add a lead compensator to increase the phase margin."

Correct as far as it goes, and it stops at the point where the interviewer was expecting the answer to start.

**A strong answer:**

"No, and I would expect those two numbers to come together rather than being an unlucky pair. Ten degrees of phase margin with twenty decibels of gain margin says the loop is crossing over on a steep slope — something like minus forty decibels per decade — so the phase is already near minus one-eighty at crossover, and then the magnitude keeps dropping fast, which is what buys the gain margin. One cause, two symptoms.

What I would expect to see: closed-loop damping of about one tenth, from the rule of thumb that zeta is roughly the phase margin over a hundred, so a step response that overshoots by something like seventy or eighty percent and rings for many cycles. And a delay margin of ten degrees in radians, $0.1745$, divided by the crossover frequency — so if it crosses over at fifty radians per second that is about three and a half milliseconds, which a digital implementation at any ordinary rate will consume on its own.

The number I would actually ask for is the peak sensitivity, or equivalently the distance from the Nyquist curve to minus one. Ten degrees of phase margin means the curve passes within about $2\sin(5^\circ)$, roughly $0.174$, of the critical point at crossover, so the peak sensitivity is at least about $5.7$. That means there is a frequency band where this loop amplifies disturbances by five or six times instead of rejecting them, which is a statement about performance and not only about stability.

The fix depends on which constraint is real. If the bandwidth is negotiable, lower the crossover so it happens on the shallower slope. If it is not, add phase lead near crossover, at the cost of noise amplification. I would not accept the loop on the gain margin."

**What the interviewer learns:** the strong answer diagnoses a common cause behind both numbers instead of treating them as independent, predicts the time-domain behaviour, converts the phase margin into a latency figure, reaches for the modulus margin as the discriminating quantity, and states the design trade rather than naming a compensator reflexively.
:::

## Check yourself

::: check
State the Nyquist criterion, define every symbol in it, and say what it requires of a loop around an open-loop-unstable plant.
:::

::: answer
$Z = N + P$, where $Z$ is the number of closed-loop poles in the right half plane, $N$ is the number of clockwise encirclements of the $-1$ point by the Nyquist plot of the open-loop transfer function $L$, and $P$ is the number of open-loop poles in the right half plane. Stability is $Z = 0$. For an open-loop-unstable plant, $P > 0$, so $N$ must equal $-P$: the curve must encircle $-1$ counter-clockwise exactly $P$ times. A design that avoids the critical point entirely, which is the instinct trained by stable plants, is guaranteed unstable in that case.
:::

::: check
A magnitude plot crosses $0\,\mathrm{dB}$ on a $-40\,\mathrm{dB}$ per decade slope. Estimate the phase margin without looking at the phase curve, and say what assumption the estimate rests on.
:::

::: answer
Bode's gain–phase relation gives roughly $-90^\circ$ of phase per $-20\,\mathrm{dB}$ per decade of local slope, so a $-40\,\mathrm{dB}$ per decade crossover implies a phase near $-180^\circ$ and therefore a phase margin near zero — in practice small, ten or twenty degrees depending on how far the neighbouring break frequencies are. The assumption is that the loop is **minimum phase**: the gain–phase relation holds for transfer functions with no right-half-plane zeros and no transport delay. A delay or a non-minimum-phase zero adds lag that the magnitude plot does not show, so the estimate is an upper bound on the margin, never a lower one.
:::

::: check
Why can a loop have a comfortable gain margin and a dangerously small phase margin at the same time? Give the mechanism, not just the fact.
:::

::: answer
Because the two are read at different frequencies and a steep magnitude roll-off improves one while destroying the other. If the loop crosses $0\,\mathrm{dB}$ on a slope of about $-40\,\mathrm{dB}$ per decade, the phase there is already near $-180^\circ$, so the phase margin is small. But that same steep slope means the magnitude has fallen a long way by the time the phase actually reaches $-180^\circ$, and the gain margin is the reciprocal of the magnitude *there*. So the fast roll-off simultaneously causes the small phase margin and the large gain margin. They are one design fact showing up twice, not two independent measurements that happened to disagree.
:::

::: check
For the fragile loop in this lesson, the phase margin is $8.60^\circ$ and the modulus margin bound says any loop with $\lVert S\rVert_\infty = 6.80$ must have at least $8.43^\circ$. What does the tightness of that inequality tell you about where the sensitivity peak sits?
:::

::: answer
The bound $\mathrm{PM} \ge 2\arcsin(1/(2M_s))$ comes from the chord between $-1$ and the point where the curve crosses the unit circle: it is tight exactly when the closest approach to $-1$ happens at, or very near, the gain crossover. Here the actual margin exceeds the floor by less than two-tenths of a degree, so the sensitivity peak must sit essentially at crossover — and it does, at about $50\,\mathrm{rad/s}$ against a crossover of $49.5\,\mathrm{rad/s}$. The gain margin's own floor, by contrast, is $1.38\,\mathrm{dB}$ against an actual $12.13\,\mathrm{dB}$, which says the negative-real-axis crossing is nowhere near the closest approach. The two comparisons together locate the problem in frequency without any further computation.
:::

::: check
An interviewer gives you a Bode plot whose phase curve crosses $-180^\circ$ at three frequencies, with magnitudes there of $-3\,\mathrm{dB}$, $-14\,\mathrm{dB}$ and $-30\,\mathrm{dB}$. What is the gain margin, and what else should you check before reporting it?
:::

::: answer
The binding crossing is the one with the largest magnitude, $-3\,\mathrm{dB}$, so the gain margin is $3\,\mathrm{dB}$ — a factor of about $1.41$, well under the usual $6\,\mathrm{dB}$ requirement. Reporting $30\,\mathrm{dB}$ or averaging the three would be the error. Before reporting even that number, check whether the plant is open-loop stable: with multiple $-180^\circ$ crossings the loop may be conditionally stable, in which case a gain *reduction* may also be dangerous and the encirclement count is the only reliable verdict. Also check whether the magnitude curve crosses $0\,\mathrm{dB}$ more than once, since the phase margin has the same multiplicity problem.
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
| Conditionally stable loop | $K(s+1)^2/s^3$: stable at $K=2$, unstable at $K=0.4$; lowering gain destabilises |

The next lesson leaves the frequency domain for the other subject that opens domain rounds: PID structure, what each term buys and costs, and the two pathologies — windup and derivative noise — that every implementation has to handle.
