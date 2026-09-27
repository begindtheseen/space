---
id: l06-slide-count-and-the-carrying-diagram
title: "How many slides, and the one diagram that carries the talk"
minutes: 22
covers:
  - "how many slides for 10 to 20 minutes, and why fewer is safer"
---

Think about packing a suitcase for a short trip. You can cram in everything you own, sitting on the lid to close it. Or you can pack a bit less, with a little room to spare. The crammed case looks efficient — until the zipper jams at the airport, and there is nowhere to put the jacket you took off. The lighter case handles surprises.

A slide deck is a suitcase for your fifteen minutes. How many slides fit is not a matter of taste. It is a [[division|seconds-per-slide]], and the answer is uncomfortable enough that most candidates quietly ignore it — and then run out of time in front of the panel.

Fifteen minutes is $15 \times 60 = 900$ seconds. Share those out over the slides:

- across eight content slides, $900 \div 8 = 112.5$ seconds each;
- across twelve, $900 \div 12 = 75$ seconds each;
- across twenty, $900 \div 20 = 45$ seconds each.

Now think about what has to happen on one slide. You state a claim. The room reads a figure. You say the one thing about it that the figure cannot show. You take a breath. Forty-five seconds does not cover that. So a twenty-slide deck is not a denser talk. It is a talk that will be abandoned somewhere in the middle.

This module's deck exercise sets the target directly: 8 to 12 **content slides** — the slides you present in the main talk — for a fifteen-minute talk, plus an **appendix** of backup slides kept after the end. This lesson explains why the low end of that range is the safer one. Then it takes the single slide that matters most.

## Why fewer is safer, in numbers

The usual argument for fewer slides is that audiences prefer them. The real argument is about what happens when you fall behind, and it is arithmetic.

::: example Falling behind, on an eight-slide deck and a twelve-slide deck
Two candidates each plan a fifteen-minute talk. Both are nervous. Both spend longer than planned on the opening, and both are four minutes in — $240$ seconds — having only finished slide two. This is completely normal. The first slides always run long, because that is where you settle down and where the panel's first clarifying question usually lands.

**Step 1: how far behind is each?**

- Twelve slides: the plan was $75$ seconds a slide, so two slides should have taken $2 \times 75 = 150$ seconds. She is $240 - 150 = 90$ seconds over.
- Eight slides: the plan was $112.5$ seconds a slide, so two slides should have taken $2 \times 112.5 = 225$ seconds. She is $240 - 225 = 15$ seconds over.

**Step 2: how much time is left, and for how many slides?** Both have $900 - 240 = 660$ seconds. The twelve-slide deck has $10$ slides to go; the eight-slide deck has $6$.

**Step 3: what does the rest need?** Look at it two ways — if she goes back to her planned pace, and if she keeps the pace she has actually been speaking at, $240 \div 2 = 120$ seconds a slide.

| Deck | Slides left | Seconds per slide she can afford | Needed at planned pace | Needed at her real pace |
| --- | --- | --- | --- | --- |
| Twelve slides | 10 | $660 \div 10 = 66$ | $750$ s — $90$ s short | $1200$ s — $540$ s short |
| Eight slides | 6 | $660 \div 6 = 110$ | $675$ s — $15$ s short | $720$ s — $60$ s short |

**Reading the table.** The twelve-slide candidate must now run every remaining slide at $66$ seconds, faster than her plan of $75$ — and at the pace she has actually been talking she is nine minutes short. No amount of speeding up closes that honestly. What happens next is the familiar failure: she races, skips slides where everyone can see, and gets cut off in verification or results.

The eight-slide candidate can afford $110$ seconds a slide against a plan of $112.5$ — a trim of about two seconds each. Even at her slow real pace she is one minute short, which a few shortened sentences absorb. She does not need to race, skip, or make any visible decision.

**Sanity check.** The two candidates behaved identically. The difference in outcome was designed weeks earlier, when one of them decided how much material had to fit.
:::

There are three more reasons the low end is safer, and none of them is about attention spans.

**A skipped slide is visible.** Jumping past a slide in front of a panel announces that you misjudged the time. It also invites the question "what was on that one?" at the worst possible moment.

**The material is not lost.** Anything cut from the main deck goes to the appendix, ready when asked. A question you answer by turning to a prepared backup slide is worth more than the same content shown to everyone whether they wanted it or not. That is the subject of the next lesson.

**Ten to twenty minutes is a range, and you do not control where in it you land.** A deck of eight to ten slides can be delivered in ten minutes or in eighteen, by changing how much you say on each slide. A deck of twenty can only be delivered in twenty — on a day that starts on time.

::: key
Eight to twelve content slides for a fifteen-minute talk, plus a backup appendix. Fewer is safer because slide count sets your recovery margin: at $900/8 = 112.5$ seconds a slide, a slow start is absorbed, and at $900/20 = 45$ seconds a slide there is nothing to absorb it with.
:::

## An eight-slide plan that fits the seven parts

The previous lesson split fifteen minutes across the seven parts of the talk. Here is that split turned into eight slides, with verification given two:

| Slide | Part it serves | Minutes |
| --- | --- | --- |
| 1 | Problem — the requirement, with a number | 1.5 |
| 2 | Why it was hard — the specific difficulty | 1.5 |
| 3 | Approach — the carrying diagram | 3 |
| 4 | The key decision, with the alternative named | 3 |
| 5 | Verification — the check and what it was measured against | 1.5 |
| 6 | Verification — evidence the check could have failed | 1.5 |
| 7 | Result — numbers, worst case as well as average | 2 |
| 8 | What I would do differently | 1 |

Check the sum: $1.5 + 1.5 + 3 + 3 + 1.5 + 1.5 + 2 + 1 = 15$ minutes. Eight slides, fifteen minutes, every part of the structure present. If the project really needs two approach slides or two results slides, go to ten. Twelve is the ceiling, not the target.

## The one diagram that carries the talk

Slide three is different from the others. It is the diagram the panel will point at for the rest of the session: *where is the bias estimated? where does the measurement come in? what rate does the loop run at? what did you write, and what did you call from a library?* Every other slide is used once. This one is used over and over. That is why it deserves an hour of drawing on paper before it deserves ten minutes in a drawing program.

A carrying diagram has to show five things.

1. **The boundary of the system you built.** Draw a box around it. What is inside is yours. What is outside is the environment, the **truth model** (the part of the simulation that knows what really happened), or somebody else's code.
2. **The signal flow, with rates.** Every arrow carries a named quantity and, where it matters, how often it arrives: gyro rate measurements at $100\,\mathrm{Hz}$ (a hundred times a second), star-tracker attitude at $1\,\mathrm{Hz}$ (once a second). An unlabeled arrow is a question you have invited.
3. **Where the uncertainty enters.** Noise sources, biases, dispersed parameters — drawn as inputs, not mentioned in passing. This is what turns an architecture picture into an engineering one.
4. **What you measured to prove it works.** Put the **tap points** for your verification — the places where your checks read their numbers — on the same diagram. Most decks miss this, and it pays for itself at once, because it answers a whole family of questions by sight.
5. **What you wrote versus what a library provided.** A dashed boundary or a shaded box, with the library names outside it. The contribution question is coming. Answering it before it is asked costs one label.

::: example The carrying diagram for anchor project C, box by box
Anchor C is the filter that estimates which way a spacecraft points. Here is its diagram, described region by region.

**Left edge: two sensors.**

- A **gyro** — a sensor that measures how fast the spacecraft is turning. Its arrow out is labeled $\boldsymbol\omega_m$ (read "omega sub m", the measured turn rate) at $100\,\mathrm{Hz}$. Two noise inputs are drawn into it: angle random walk $\sigma_v$ and bias random walk $\sigma_u$ (read "sigma sub v" and "sigma sub u") — the gyro's quick jitter and the slow wander of its bias, the small false turn rate it reports even when still.
- A **[[star tracker|star-tracker]]**. Its arrow out is a measured attitude at $1\,\mathrm{Hz}$, with a noise input of $5\times10^{-5}\,\mathrm{rad}$ per axis.

**Center: a solid box, with your name on it.** Inside:

- **bias correction**, subtracting the estimated bias $\hat{\mathbf b}$ (read "b hat") from $\boldsymbol\omega_m$;
- **quaternion propagation**, marked nonlinear, producing the attitude estimate $\hat{\mathbf q}$;
- **covariance propagation** through the six-state error model, drawn as a parallel track beside it, not in series.

The star-tracker branch forms an **error quaternion** against the propagated estimate — the small rotation between where the filter thought it pointed and where the star tracker says it points. Twice its vector part is the **innovation**, the surprise. That is a $3\times1$ arrow into the **gain**, out to the error state $[\delta\boldsymbol\theta,\ \delta\mathbf b]$ (read "delta theta, delta b"), and back as a **[[multiplicative reset|multiplicative-reset]]** into $\hat{\mathbf q}$ and an additive one into $\hat{\mathbf b}$. That reset arrow closing the loop is the whole reason the filter is called multiplicative. Draw it as the one colored line on the slide.

**Top edge, outside the box:** the truth model and the Monte Carlo loop, feeding simulated measurements in.

**Now the part that earns the hour.** Mark [[two tap points|tap-points]].

- **NEES** taps the difference between the truth line and the estimate, and compares it with the propagated covariance.
- **NIS** taps the innovation and its covariance — entirely inside your box.

Anyone looking at the diagram can now see, without being told, why NIS still works on real flight data and NEES does not. The NEES tap is wired to a line — the truth — that does not exist outside a simulation. One of the most common questions in this round has been answered by a figure, for the cost of two labels.

**Bottom right, small:** "NumPy for linear algebra; SciPy for the chi-square bands; everything in the box is mine."
:::

::: warning
The most common mistake on this slide is drawing a software architecture diagram instead of a **[[signal-flow diagram|signal-flow]]**: modules, files, class names, and arrows that mean "calls". A GNC panel is not asking how your code folders are laid out. They are asking what information flows where, how often, and where the uncertainty is. If your diagram would look the same for a project with completely different physics, it is the wrong diagram.
:::

## Making it readable from the back of the room

The smallest label on that diagram has to be readable by someone sitting far from the screen. This is a geometry problem with an answer, not a matter of taste.

The idea: what matters is not how big a letter is, but how big it *looks* — the angle it fills in your eye. A coin held close fills a big angle; the same coin across the room fills a tiny one. So you work out the smallest angle that is comfortable to read, then turn it into a height on the slide.

::: example How large the smallest label has to be
**The room.** A conference-room screen $2.0\,\mathrm{m}$ wide. Slides are shaped [[16:9|aspect-ratio]], so the screen is $2.0 \times 9 \div 16 = 1.125\,\mathrm{m}$ tall. The back row sits $6\,\mathrm{m}$ from it.

**The smallest readable angle.** A letter at the edge of what [[20/20 vision|twenty-twenty]] can make out fills about 5 **[[arcminutes|arcminute]]** — an arcminute is one sixtieth of a degree. In radians (the unit where the angle times the distance gives the height), 5 arcminutes is $\frac{5}{60} \times \frac{\pi}{180} \approx 0.001454\,\mathrm{rad}$, or $1.45\,\mathrm{mrad}$ (milliradians).

**The height at the back row.** For small angles, height ≈ distance × angle: $6\,\mathrm{m} \times 0.001454 \approx 0.00873\,\mathrm{m}$, so a capital letter about $8.7\,\mathrm{mm}$ tall.

**Add margin.** That is the height where you can just barely *make out* the letter — not the height where you read a label without effort. Take a factor of four as design margin: $4 \times 8.73 \approx 34.9\,\mathrm{mm}$.

**As a share of the slide.** $34.9\,\mathrm{mm} \div 1125\,\mathrm{mm} \approx 0.031$, which is $3.1\%$ of the slide's height.

**In the units you actually work in.**

- On a slide exported $1080$ pixels tall: $0.031 \times 1080 \approx 33.5$, so about $34$ pixels.
- On a slide $7.5$ inches tall, which is $7.5 \times 72 = 540$ **[[points|points-unit]]**: $0.031 \times 540 \approx 17$ points.

**A deeper room.** At $8\,\mathrm{m}$ the same margin gives $8 \times 0.001454 \times 4 \approx 46.5\,\mathrm{mm}$, which is $4.1\%$ of the slide's height — about $22$ points.

**The desk test, no arithmetic needed.** In this room the back row sits $6 \div 1.125 \approx 5.33$ screen-heights away. Copy that ratio at your desk. A 27-inch monitor (measured on the diagonal) is about $33.6\,\mathrm{cm}$ tall, so stand back about $5.33 \times 33.6 \approx 179\,\mathrm{cm}$ — roughly $1.8\,\mathrm{m}$ — and look at your slide full-screen. Whatever you cannot read from there, the back row cannot read either. The axis labels on a figure pasted in from a plotting script are almost always the first thing to fail.

**Sanity check.** Seventeen points is a little bigger than ordinary printed body text, which is usually 10 to 12 points and is read at arm's length. A far-away screen needs bigger letters, so that makes sense.
:::

The same geometry explains why a figure taken straight out of a paper or a notebook rarely survives on a slide. Default label sizes are chosen for a page held at arm's length — roughly a tenth of the distance to a projected slide. So those labels fill about a tenth of the angle they need. Scaling the picture up cannot fix that: the figure is already about as big as the slide allows, and its labels stay the same small fraction of it. Regenerate the figure at presentation size instead, with the font sizes set so the smallest label is at least about $3\%$ of the slide's height.

## Check yourself

::: check
Two candidates each spend four minutes reaching the end of slide two. One planned eight slides, the other twelve. Work out where each stands, and say what the difference tells you about when a deck's fate is decided.
:::

::: answer
The eight-slide plan allowed $112.5$ seconds a slide, so two slides should have taken $225$ seconds against the $240$ used — fifteen seconds over. She has six slides and $660$ seconds left, which is $110$ seconds each against a plan of $112.5$. She is effectively on plan.

The twelve-slide plan allowed $75$ seconds a slide, so two should have taken $150$ seconds. She is ninety seconds over. Ten slides remain with $660$ seconds, so only $66$ seconds each; at her real pace of $120$ seconds a slide they would need $1200$ seconds, a deficit of $540$ seconds.

The behavior was identical; only the slide count differed. The deck's fate was decided when the material was chosen, not on the day.
:::

::: check
Name the five things the carrying diagram has to show, and say which one most candidates leave out.
:::

::: answer
1. The boundary of the system you built.
2. The signal flow, with named quantities and their rates.
3. Where the uncertainty enters.
4. The tap points of whatever you measured to prove it works.
5. What you wrote versus what a library provided.

The one most often missing is the verification tap points. Most diagrams show the architecture and stop, leaving the evidence to a separate slide. Putting the taps on the same figure answers a whole family of questions by sight, for free.
:::

::: check
Explain how marking the NEES and NIS tap points on the anchor-C diagram answers a common panel question without anyone saying a word.
:::

::: answer
The NEES tap connects the estimate to the truth line coming from the simulation's truth model. The NIS tap sits entirely inside the filter, on the innovation and its covariance.

Drawn that way, the figure shows directly that NEES needs a quantity that exists only inside a simulation, while NIS needs only things the filter computes itself. That is exactly why NIS is the test that still works on real flight data and NEES is not. The answer is visible in how the diagram is wired, instead of needing to be stated.
:::

::: check
Why does a figure copied straight out of a notebook or a paper usually fail on a projected slide, and what is the fix?
:::

::: answer
Default label sizes are chosen for a page read at arm's length, roughly a tenth of the viewing distance to a projected screen. So the labels fill far too small an angle for the back of the room.

Scaling the image up does not rescue it. The figure is already close to the full size of the slide, and the labels stay the same small fraction of the figure as it grows, so they cannot reach the needed size.

The fix is to regenerate the figure at presentation size, setting the font sizes so the smallest label is at least about $3\%$ of the slide's height.
:::

::: check
A candidate argues that twenty slides is fine because he will speak faster. Give the two reasons from this lesson that this does not work.
:::

::: answer
First, the arithmetic. Twenty slides in fifteen minutes is $900 \div 20 = 45$ seconds each. That is not enough to state a claim, let the room read a figure, and add the one thing the figure cannot show. The plan fails even if he carries it out perfectly.

Second, there is no recovery margin. Any slow start, or one clarifying question from the panel, creates a deficit that speaking faster cannot close. The visible results are skipped slides and being cut off in the sections at the end — verification and results.
:::

## Summary

| Item | Value |
| --- | --- |
| Target | 8 to 12 content slides for 15 minutes, plus a backup appendix |
| Seconds per slide | $900/8 = 112.5$, $900/12 = 75$, $900/20 = 45$ |
| Why fewer | Recovery margin: after a four-minute start on two slides, an eight-slide deck needs a two-second trim per slide; a twelve-slide deck is out of time |
| The carrying diagram | Boundary, signal flow with rates, where uncertainty enters, verification tap points, your work versus the library's |
| Its wrong version | A software architecture diagram of modules and calls |
| Smallest label | About $3\%$ of slide height for a $6\,\mathrm{m}$ back row; more in a deeper room |
| Desk test | View your slide full-screen from about $5.3$ screen-heights away — roughly $1.8\,\mathrm{m}$ for a 27-inch monitor |

The next lesson takes the material this one cut from the main deck, and turns it into the appendix that makes a hard question look like something you were expecting.

::: context seconds-per-slide Same fifteen minutes, sliced three ways
Each bar is one slide's share of $900$ seconds, drawn to scale. The dashed line marks roughly how long one slide needs — claim, figure, one spoken point, a breath — if we call it a minute. Only the twenty-slide bar falls short of it.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 140" font-family="Inter, Arial, sans-serif">
  <g font-size="12" fill="#1f2a44">
    <text x="10" y="34">8 slides</text><text x="10" y="70">12 slides</text><text x="10" y="106">20 slides</text>
  </g>
  <rect x="80" y="20" width="225" height="22" fill="#1d6fd1"/>
  <rect x="80" y="56" width="150" height="22" fill="#8fb8f0"/>
  <rect x="80" y="92" width="90" height="22" fill="#b4232c"/>
  <g font-size="12" fill="#1f2a44"><text x="311" y="36">112.5 s</text><text x="236" y="72">75 s</text></g>
  <text x="125" y="108" font-size="12" fill="#fff" text-anchor="middle">45 s</text>
  <line x1="200" y1="12" x2="200" y2="122" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="200" y="136" font-size="11" fill="#6c7a93" text-anchor="middle">60 s</text>
</svg>
```

The scale is 2 pixels per second, starting from the left edge of the bars.
:::

::: context star-tracker A camera that reads the sky
A **star tracker** is a small camera that photographs the stars, matches the pattern against a built-in star catalog, and works out which way the spacecraft is pointing. It is very accurate but slow — here, one answer a second. A gyro is the opposite: fast but slowly drifting. A filter blends the two, using the gyro between star fixes and the star tracker to cancel the drift. Sailors did something similar for centuries, with a compass for heading and the stars to check it.
:::

::: context multiplicative-reset Why rotations multiply instead of add
You can add distances: 3 steps plus 4 steps is 7 steps. Rotations do not work that way in general. Turn a book 90° forward and then 90° to the side, and you get a different result from doing the same two turns in the other order. So to combine two orientations you *compose* them — for quaternions, that means multiplying. A **multiplicative** filter keeps its correction as a small rotation and multiplies it into the estimate, which keeps the quaternion a proper rotation. Adding the correction instead would slowly bend it into something that is not a rotation at all.
:::

::: context tap-points The two taps, drawn
A sketch of anchor C's carrying diagram, cut down to what the tap points need. NIS reads only lines inside your box. NEES also needs the truth line, which comes from the simulation.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 200" font-family="Inter, Arial, sans-serif">
  <rect x="100" y="12" width="250" height="30" fill="#fff" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <text x="225" y="32" font-size="12" fill="#6c7a93" text-anchor="middle">truth model (simulation only)</text>
  <rect x="10" y="70" width="70" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="45" y="89" font-size="12" fill="#1f2a44" text-anchor="middle">gyro</text>
  <rect x="10" y="130" width="70" height="30" fill="#f2b880" stroke="#1f2a44"/>
  <text x="45" y="149" font-size="11" fill="#1f2a44" text-anchor="middle">star tracker</text>
  <rect x="100" y="58" width="250" height="126" fill="#fff" stroke="#1f2a44" stroke-width="2"/>
  <text x="340" y="176" font-size="11" fill="#1f2a44" text-anchor="end">your filter</text>
  <line x1="80" y1="85" x2="130" y2="85" stroke="#1f2a44"/>
  <line x1="80" y1="145" x2="130" y2="145" stroke="#1f2a44"/>
  <rect x="130" y="72" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="170" y="89" font-size="11" fill="#1f2a44" text-anchor="middle">estimate</text>
  <rect x="130" y="132" width="80" height="26" fill="#8fb8f0" stroke="#1f2a44"/>
  <text x="170" y="149" font-size="11" fill="#1f2a44" text-anchor="middle">innovation</text>
  <line x1="170" y1="132" x2="170" y2="98" stroke="#1d6fd1" stroke-width="2.5"/>
  <text x="176" y="119" font-size="11" fill="#1d6fd1">reset</text>
  <circle cx="265" cy="85" r="7" fill="#b4232c"/>
  <text x="278" y="89" font-size="12" fill="#b4232c">NEES</text>
  <line x1="210" y1="85" x2="258" y2="85" stroke="#1f2a44"/>
  <line x1="265" y1="42" x2="265" y2="78" stroke="#6c7a93" stroke-dasharray="4 3"/>
  <circle cx="265" cy="145" r="7" fill="#1d6fd1"/>
  <text x="278" y="149" font-size="12" fill="#1d6fd1">NIS</text>
  <line x1="210" y1="145" x2="258" y2="145" stroke="#1f2a44"/>
</svg>
```

On a real spacecraft the dashed box is gone. NIS keeps working; NEES has nothing to compare against.
:::

::: context signal-flow Boxes and arrows, the control engineer's way
Control engineers have drawn **block diagrams** since long before modern computers: each box changes a signal, each arrow carries one named quantity, and loops show where a result is fed back to correct the next step. That language is how a GNC panel thinks. A software diagram answers "which file calls which?" A signal-flow diagram answers "what does the vehicle know, when, and how sure is it?" — the questions this round is really about.
:::

::: context aspect-ratio What 16:9 means
**16:9**, said "sixteen by nine", is the shape of most modern screens and slides: 16 units wide for every 9 units tall. Televisions, laptops and projectors mostly use it. If you know a 16:9 screen's width, its height is the width times $9 \div 16$ — so a $2.0\,\mathrm{m}$ wide screen is $1.125\,\mathrm{m}$ tall.
:::

::: context twenty-twenty What 20/20 vision means
**20/20 vision**, said "twenty-twenty", comes from the eye chart. It means you can read at 20 feet what a typical healthy eye reads at 20 feet. The letters on that line are drawn so that, from 20 feet, each one fills 5 arcminutes of your view top to bottom. Someone with 20/40 vision needs to stand at 20 feet to read what a typical eye reads from 40. Many people in any room see worse than 20/20, which is another reason for the design margin.
:::

::: context arcminute How big a letter looks
A full circle has $360$ degrees, and each degree splits into $60$ **arcminutes**. What your eye cares about is the angle a letter fills. Double the distance and the same letter fills half the angle — so it must be twice as tall to look the same.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 120" font-family="Inter, Arial, sans-serif">
  <circle cx="24" cy="70" r="10" fill="#fff" stroke="#1f2a44" stroke-width="1.5"/>
  <circle cx="28" cy="70" r="3" fill="#1f2a44"/>
  <line x1="34" y1="70" x2="330" y2="40" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="34" y1="70" x2="330" y2="100" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="330" y1="40" x2="330" y2="100" stroke="#b4232c" stroke-width="3"/>
  <text x="340" y="74" font-size="12" fill="#b4232c">h</text>
  <text x="44" y="50" font-size="12" fill="#1d6fd1">angle at the eye</text>
  <line x1="34" y1="112" x2="330" y2="112" stroke="#6c7a93"/>
  <text x="182" y="108" font-size="11" fill="#6c7a93" text-anchor="middle">distance d (not to scale)</text>
</svg>
```

For small angles, height $h \approx d \times \text{angle}$, with the angle in radians. The real angle is tiny; the picture stretches it so you can see it.
:::

::: context points-unit The printer's point
Type is measured in **points**. The modern point is exactly $1/72$ of an inch, a size that came from printers setting metal letters by hand and was fixed when desktop publishing took over in the 1980s. So a slide $7.5$ inches tall is $7.5 \times 72 = 540$ points tall, and a 17-point label is about $3.1\%$ of it. Slide programs show font sizes in points, which is why the lesson converts to them.
:::
