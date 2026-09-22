---
id: l06-slide-count-and-the-carrying-diagram
title: "How many slides, and the one diagram that carries the talk"
minutes: 20
covers:
  - "how many slides for 10 to 20 minutes, and why fewer is safer"
---

How many slides fit in a fifteen-minute talk is not a matter of taste. It is a division, and the answer it gives is uncomfortable enough that most candidates quietly ignore it and then run out of time in front of the panel.

Fifteen minutes is $900$ seconds. Across eight content slides that is $900/8 = 112.5$ seconds each; across twelve it is $900/12 = 75$; across twenty it is $900/20 = 45$. Now ask what has to happen on one slide: state a claim, let the room read a figure, say the one thing about it that is not visible, and take a breath. Forty-five seconds does not cover that, so a twenty-slide deck is not a denser talk — it is a talk that will be abandoned somewhere in the middle.

The portfolio-deck exercise attached to this module sets the target directly: 8 to 12 content slides for a fifteen-minute talk, plus an appendix of backup slides. This lesson explains why the low end of that range is the safer one, and then takes the single slide that matters most inside it.

## Why fewer is safer, in numbers rather than in principle

The usual argument for fewer slides is that audiences prefer them. The real argument is about what happens when you fall behind, and it is arithmetic.

::: example Falling behind, on an eight-slide deck and a twelve-slide deck
Both candidates plan a fifteen-minute talk. Both are nervous, both spend longer than intended on the opening, and both find themselves four minutes in — $240$ seconds — having finished slide two. This is entirely normal; the first slides always run long, because that is where the speaker is settling down and where the panel's first clarifying question usually lands.

**Twelve-slide deck.** The plan was $75$ seconds a slide, so two slides should have taken $150$ seconds. She is already $90$ seconds over. Ten slides remain and, at the pace she has actually been speaking, they need $10\times120 = 1200$ seconds. She has $900-240 = 660$. The deficit is $1200-660 = 540$ seconds — nine minutes — and no amount of speeding up closes it honestly. What happens next is the familiar failure: she races, skips visibly, and gets cut off in verification or results.

**Eight-slide deck.** The plan was $112.5$ seconds a slide, so two slides should have taken $225$ seconds. She is $15$ seconds over, not ninety. Six slides remain with $660$ seconds available, which is $660/6 = 110$ seconds each against a plan of $112.5$. She has already recovered. She does not need to race, skip, or make any visible decision at all.

The two candidates behaved identically. The difference in outcome was designed in weeks earlier, when one of them decided how much material had to fit.
:::

There are three further reasons the low end is safer, and none of them is about attention spans.

**A skipped slide is visible.** Jumping past a slide in front of a panel announces that you misjudged the time, and it invites the question "what was on that one?" at the worst possible moment.

**The material is not lost.** Anything cut from the main deck goes to the appendix, where it is available on demand. A question you answer by turning to a prepared backup slide is worth more than the same content shown to everyone whether they wanted it or not — that is the subject of the next lesson.

**Ten to twenty minutes is a range, and you do not control where in it you land.** A deck built at eight to ten slides can be delivered at ten minutes or at eighteen by changing how much you say per slide. A deck built at twenty can only be delivered at twenty, on a day that starts on time.

::: key
Eight to twelve content slides for a fifteen-minute talk, plus a backup appendix. Fewer is safer because slide count sets your recovery margin: at $900/8 = 112.5$ seconds a slide, a slow start is absorbed, and at $900/20 = 45$ seconds a slide there is nothing to absorb it with.
:::

## An inventory that maps onto the seven parts

| Slide | Part it serves | Minutes |
| --- | --- | --- |
| 1 | Problem — the requirement, with a number | 1.5 |
| 2 | Why it was hard — the specific difficulty | 1.5 |
| 3 | Approach — the carrying diagram | 3 |
| 4 | The key decision, with the alternative named | 3 |
| 5 | Verification — the check and what it was measured against | 1.5 |
| 6 | Verification — evidence the check could have failed | 1.5 |
| 7 | Result — numbers, worst case as well as mean | 2 |
| 8 | What I would do differently | 1 |

Eight slides, fifteen minutes, every part of the structure present. If the project genuinely needs two approach slides or two results slides, take it to ten. Twelve is the ceiling, not the target.

## The one diagram that carries the talk

Slide three is different from the others. It is the diagram the panel will point at for the rest of the session — when they ask where the bias is estimated, where the measurement enters, what rate the loop runs at, what you wrote versus what you called. Every other slide is used once. This one is used continuously, which is why it is worth an hour of drawing on paper before it is worth ten minutes in a drawing tool.

A carrying diagram has to show five things.

**The boundary of the system you built.** Draw a box around it. What is inside is yours; what is outside is the environment, the truth model, or somebody else's code.

**The signal flow, with rates.** Every arrow carries a named quantity and, where it matters, the rate it flows at: gyro rate measurement at $100\,\mathrm{Hz}$, star-tracker attitude at $1\,\mathrm{Hz}$. An unlabelled arrow is a question you have invited.

**Where the uncertainty enters.** Noise sources, biases, dispersed parameters — drawn as inputs, not mentioned in passing. This is what turns an architecture picture into an engineering one.

**What you measured to prove it works.** Put the tap points for your verification on the same diagram. This is the detail that most decks miss and it pays for itself immediately, because it answers a whole class of questions visually.

**What you wrote versus what a library provided.** A dashed boundary, or a shaded box, with the library names outside it. The contribution question is coming; answering it before it is asked costs one annotation.

::: example The carrying diagram for anchor project C, box by box
Left edge: two sensor blocks. **Gyro**, arrow out labelled $\boldsymbol\omega_m$ at $100\,\mathrm{Hz}$, with two noise inputs drawn into it — angle random walk $\sigma_v$ and bias random walk $\sigma_u$. **Star tracker**, arrow out labelled as a measured attitude at $1\,\mathrm{Hz}$, with a noise input of $5\times10^{-5}\,\mathrm{rad}$ per axis.

Centre, inside a solid box labelled with your name on it: **bias correction** subtracting $\hat{\mathbf b}$ from $\boldsymbol\omega_m$; **quaternion propagation**, marked nonlinear, producing $\hat{\mathbf q}$; and, drawn as a parallel track rather than in series, **covariance propagation** through the six-state error model. The star-tracker branch forms an **error quaternion** against the propagated estimate, whose twice-vector-part is the innovation — a $3\times1$ arrow into the **gain**, out to the error state $[\delta\boldsymbol\theta,\ \delta\mathbf b]$, and back as a **multiplicative reset** into $\hat{\mathbf q}$ and an additive one into $\hat{\mathbf b}$. That reset arrow closing the loop is the whole reason the filter is multiplicative, and it is worth drawing as the one accented line on the slide.

Top edge, outside the box: the **truth model and Monte Carlo loop**, feeding simulated measurements in.

Now the part that earns the hour. Mark two tap points. **NEES** taps the difference between the truth line and the estimate, against the propagated covariance. **NIS** taps the innovation and its covariance, entirely inside your box. Anyone looking at the diagram can now see, without being told, why NIS survives on real flight data and NEES does not: the NEES tap is connected to a line that does not exist outside a simulation. One of the most common questions in this round has been answered by a figure, at a cost of two labels.

Bottom right, small: "NumPy for linear algebra; SciPy for the chi-square bands; everything in the box is mine."
:::

::: warning
The most common mistake on this slide is drawing a software architecture diagram instead of a signal-flow diagram: modules, files, class names, arrows meaning "calls". A GNC panel is not asking how your repository is laid out. They are asking what information flows where, at what rate, and where the uncertainty is. If your diagram would look the same for a project with completely different physics, it is the wrong diagram.
:::

## Making it legible from the back of the room

The smallest label on that diagram has to be readable by somebody who is not sitting near the screen, and this is a geometry problem with an answer rather than a matter of preference.

::: example How large the smallest label has to be
Take a conference-room screen $2.0\,\mathrm{m}$ wide, so $1.125\,\mathrm{m}$ tall at 16:9, with the back of the room $6\,\mathrm{m}$ from it. A letter at the standard 20/20 acuity limit subtends about 5 arcminutes, which is $1.45\,\mathrm{mrad}$; at $6\,\mathrm{m}$ that is a cap height of $8.7\,\mathrm{mm}$. That is the threshold of *resolving* the letter, which is not the same as reading a label without effort, so take a factor of four as design margin: $34.9\,\mathrm{mm}$, which is $3.1\%$ of the slide's height.

In the units you will actually be working in, that is about 34 pixels on a slide exported 1080 pixels tall, or about 17 points on a slide 7.5 inches tall. Deeper room, larger floor: at $8\,\mathrm{m}$ the same margin gives $4.1\%$ of slide height, about 22 points.

The practical test needs no arithmetic at all. The room's geometry here is a viewing distance of about $5.3$ times the screen height. Reproduce that ratio at your desk: for a 27-inch monitor, whose height is about $33.6\,\mathrm{cm}$, stand back about $1.8\,\mathrm{m}$ and look at your slide full-screen. Whatever you cannot read from there, the back row cannot read either — and the axis labels on a figure you pasted in from a plotting script are almost always the first thing to fail.
:::

The same geometry is why a figure taken straight out of a paper or a notebook rarely survives on a slide: default axis-label sizes are chosen for a page held at arm's length, roughly a tenth of the viewing distance of a projected slide. Regenerate the figure at presentation size rather than scaling it up, or the labels stay small while everything around them grows.

## Check yourself

::: check
Two candidates each spend four minutes reaching the end of slide two. One planned eight slides, the other twelve. Work out where each stands, and say what the difference implies about when a deck's fate is decided.
:::

::: answer
The eight-slide plan allowed $112.5$ seconds a slide, so two slides should have taken $225$ seconds against the $240$ actually used — fifteen seconds over, with six slides and $660$ seconds left, which is $110$ seconds each. She is effectively on plan. The twelve-slide plan allowed $75$ seconds a slide, so two should have taken $150$ seconds: she is ninety seconds over, with ten slides needing about $1200$ seconds at her real pace against $660$ remaining, a deficit of $540$ seconds. The behaviour was identical; only the slide count differed. The deck's fate was decided when the material was chosen, not on the day.
:::

::: check
Name the five things the carrying diagram has to show, and say which of them most candidates leave out.
:::

::: answer
The boundary of the system you built; the signal flow with named quantities and their rates; where the uncertainty enters; the tap points of whatever you measured to prove it works; and what you wrote versus what a library provided. The one most often missing is the verification tap points — most diagrams show the architecture and stop, leaving the evidence to live on a separate slide, when putting the taps on the same figure answers a whole class of questions visually and for free.
:::

::: check
Explain how marking the NEES and NIS tap points on the anchor-C diagram answers a common panel question without anyone saying a word.
:::

::: answer
The NEES tap connects the estimate to the truth line coming from the simulation's truth model, while the NIS tap sits entirely inside the filter, on the innovation and its covariance. Drawn that way, the figure shows directly that NEES requires a quantity that exists only inside a simulation while NIS requires only things the filter itself computes — which is exactly why NIS is the test that survives on real flight data and NEES is not. The answer is visible in the topology of the diagram rather than needing to be asserted.
:::

::: check
Why does a figure copied straight out of a notebook or a paper usually fail on a projected slide, and what is the fix?
:::

::: answer
Default axis-label sizes are chosen for a page read at arm's length, which is on the order of a tenth of the viewing distance to a projected screen, so the labels subtend far too small an angle for the back of the room even when the figure as a whole is large. Scaling the image up does not help proportionally, because everything grows together and the relationship between label size and the room stays wrong only if the whole figure is already at its maximum size. The fix is to regenerate the figure at presentation size, setting the font sizes so the smallest label is at least about $3\%$ of the slide's height.
:::

::: check
A candidate argues that twenty slides is fine because he will simply speak faster. Give the two reasons from this lesson that this does not work.
:::

::: answer
First, the arithmetic: twenty slides in fifteen minutes is $900/20 = 45$ seconds each, which is not enough to state a claim, let the room read a figure, and add the one thing that is not visible on it — so the plan fails even when it is executed perfectly. Second, there is no recovery margin: any slow start, or one clarifying question from the panel, immediately creates a deficit that cannot be closed by speaking faster, and the visible consequences are skipped slides and being cut off in the sections at the end, which are verification and results.
:::

## Summary

| Item | Value |
| --- | --- |
| Target | 8 to 12 content slides for 15 minutes, plus a backup appendix |
| Seconds per slide | $900/8 = 112.5$, $900/12 = 75$, $900/20 = 45$ |
| Why fewer | Recovery margin: an eight-slide deck absorbs a four-minute first two slides, a twelve-slide deck does not |
| The carrying diagram | Boundary, signal flow with rates, where uncertainty enters, verification tap points, your work versus the library's |
| Its wrong version | A software architecture diagram of modules and calls |
| Smallest label | About $3\%$ of slide height at a $6\,\mathrm{m}$ back row; more in a deeper room |
| Desk test | View your slide full-screen from about $5.3$ screen-heights away — roughly $1.8\,\mathrm{m}$ for a 27-inch monitor |

The next lesson takes the material this one just cut from the main deck, and turns it into the appendix that makes a hard question look like something you were expecting.
