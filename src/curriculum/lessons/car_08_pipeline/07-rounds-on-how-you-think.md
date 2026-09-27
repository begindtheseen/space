---
id: l07-rounds-on-how-you-think
title: "The onsite rounds on how you think"
minutes: 20
covers:
  - "onsite composition: past-project presentation, 2 to 3 coding rounds, 1 to 2 systems and architecture rounds, 1+ domain-knowledge round, abstract problem solving, physics puzzles and Fermi estimation"
---

Imagine a friend hands you a riddle you have never heard. You cannot search for it. You cannot ask anyone. All you have is what is already in your head. Some people freeze. Some blurt out a guess. And some say, "Okay — what do I actually know here?" and start working.

The second kind of onsite round is about which of those people you are. The last lesson covered the rounds about what you have **built**: the presentation, the coding and the systems rounds. This lesson covers the rounds about how you **think** when a problem arrives that you have not seen before, and there is nowhere to look it up.

Four items from the onsite day belong here. There are one or more **domain-knowledge rounds** — rounds on the engineering subject itself. And spread across the day there is **abstract problem solving**, **physics puzzles** and **[[Fermi estimation|fermi-name]]**. These rounds change how you prepare. There is nothing to collect in advance. You cannot bring a portfolio to a Fermi question. What you can bring is a **method** — a fixed set of steps — that you have run so many times it still works when you are nervous. That is what these rounds reward.

This lesson is the map: what each round looks at, and the answering standard all four share. The training happens later in this track. The eleventh module drills the domain material and the twelfth drills first-principles thinking, to a much higher standard than a map needs.

## The domain-knowledge round

At least one round, and maybe more, is about the subject matter of GNC (said "G-N-C": guidance, navigation and control). That means control, estimation and astrodynamics — steering a vehicle, working out where it is, and how things move in orbit. This is the round the whole technical track of this course exists to prepare you for. Twenty modules of stability margins, Kalman filtering, attitude determination and orbit determination get examined here by someone who does that work every day.

What is being tested is **ownership**, not recall. Owning an idea means you can use it, not only repeat it.

Here is the difference. You might have read that **[[phase margin|phase-margin]]** is the extra phase lag a feedback loop can absorb before it goes unstable. That is recall. Ownership means you can also say what it means for *this* loop, why gain margin alone does not tell the whole story, and what a time delay in the loop does to the picture. The first kind of knowledge survives a definition question and falls apart on the follow-up. The second kind is what an engineer on the team is looking for.

### A fixed answering order

For this round, learn one answering order and use it every time. It holds up under pressure, and it is the same order the domain module of this track teaches at length.

1. **State your assumptions.** This tells the interviewer which problem you are solving. When it is missing, most of the disagreements in these rounds begin.
2. **Write the equation.** This shows the mechanism — how the thing works — not only the conclusion.
3. **Interpret it physically.** Say in words what the symbols mean for the real object. This shows the symbols mean something to you.
4. **Sanity check.** Test the answer against something you already trust: a **[[limiting case|limiting-case]]** (push one quantity to zero or infinity and see if the answer behaves), a **[[dimensional argument|dimensions]]** (check the units come out right), or an **[[order-of-magnitude|order-of-magnitude]]** comparison (is it the right power of ten?).

The fourth step is the one that separates an engineer from someone who has only finished the algebra.

::: key
Domain-round answering standard: state your assumptions, write the equation, interpret it physically, then sanity check (a limiting case, a dimensional argument or an order-of-magnitude comparison).
:::

## Abstract problem solving and physics puzzles

Somewhere in the day you will be asked something that is not a GNC question at all. It might be a physical situation with a surprising answer. It might be a system you have never thought about. It might be a problem given to you on purpose without enough information.

The point is not to see whether you know the answer. The interviewer knows you have not seen it. The point is to watch you meet a problem with no practiced route to it. That is worth watching, because the real job brings unfamiliar problems every week.

Here is what the interviewer can see, and what you can practice on purpose:

- **Do you find out what is actually being asked** before you answer?
- **Do you name the governing principle** — the law of physics that controls the situation — instead of grabbing a problem that only looks similar?
- **Do you state the regime** — the range of conditions you are working in (slow or fast, small angle or large, air or vacuum) — and your assumptions?
- **Do you check the answer** against a limiting case?
- **When you are stuck, do you say so** cleanly and keep working, instead of producing confident noise?

### "I do not know" is allowed

That last point matters most, because candidates get it wrong in one specific, avoidable way.

"I do not know" is an acceptable thing to say. "I do not know, and here is how I would find out" is better. And it is not a politer version of the same answer — it is a *different* answer. It tells the interviewer what you would actually do at your desk on an ordinary Tuesday when you hit this gap. That is exactly what they are trying to learn.

Bluffing is the only choice that fails outright. The engineer asking can tell. And once they can tell, what they learn is no longer about the puzzle. It is about you.

::: warning Confident noise is worse than a clean stop
Filling a silence with physics that sounds right is the single most damaging habit in these rounds. It turns a question about a puzzle into a question about whether your confident statements can be trusted — a much worse question to have raised. Say what you know, say where it stops, and say what you would do to close the gap.
:::

## Fermi estimation

A **Fermi question** asks you to produce a number, correct to within an **order of magnitude** — the right power of ten — using only knowledge you already carry. No reference books. "How many piano tuners are in Chicago?" is the classic example. "How much air sits over one square meter of ground?" is a more physical one.

This is the most mechanical of the four rounds. That makes it the one that improves most with practice.

The method has five steps, and they are always the same:

1. **Decompose.** Break the quantity into factors you can each reason about.
2. **Bound.** Give each factor an upper and a lower value — numbers you would be surprised to be outside of.
3. **Multiply.** Combine the factors to get the estimate.
4. **Sanity check.** Compare the result with something you know independently — ideally a second, separate route to the same number.
5. **State your uncertainty.** Say how confident you are. A Fermi answer with no stated confidence is pretending to be more than it is.

The step candidates skip is the fourth. An estimate that has been cross-checked by a second, independent route is far stronger evidence than one that has not. The second route is usually cheap to produce. And it is the step that catches the arithmetic slip that would otherwise leave you defending a number a thousand times too big.

::: key
Fermi method: decompose into factors, bound each one, multiply, sanity check against something you know independently, and state your uncertainty. The sanity check is the step candidates skip and the one that earns the round.
:::

::: example A Fermi question, worked the way the round wants
Near the end of a domain round, a candidate is asked: roughly what mass of air sits above one square meter of ground at sea level? She has no reference and about three minutes.

**Say the principle first.** She starts by naming what she will use. Pressure is force per unit area. The force pushing down on the ground is the weight of the air column above it. So the mass over one square meter is the sea-level pressure divided by the acceleration of gravity:

$$
m = \frac{p \, A}{g}
$$

Here $p$ is the **[[air pressure|air-pressure]]**, $A$ is the area ($1\,\mathrm{m^2}$), and $g$ is the acceleration of gravity.

**State the inputs and assumptions.** She gives her two inputs: about $101\,\mathrm{kPa}$ (kilopascals — thousands of newtons per square meter) at sea level, and $g \approx 9.8\,\mathrm{m/s^2}$. She adds one assumption: the air is treated as **static**, not moving up or down, because that is what "the weight equals the pressure force" needs.

**Do the arithmetic.**

$$
m = \frac{101\,000\,\mathrm{N/m^2} \times 1\,\mathrm{m^2}}{9.8\,\mathrm{m/s^2}} \approx 10\,300\,\mathrm{kg}
$$

A newton is a $\mathrm{kg \cdot m/s^2}$, so dividing by $\mathrm{m/s^2}$ leaves kilograms, as a mass should. She says it aloud as "about ten tonnes per square meter — call it $10^4$ kilograms."

**Cross-check by a second route.** Now the step that earns the round. Near the ground, air has a density of roughly $1.2\,\mathrm{kg/m^3}$. The atmosphere thins out with height over a distance of roughly eight or nine kilometers — the **[[scale height|scale-height]]**. So a crude column is density times that height:

$$
1.2\,\mathrm{kg/m^3} \times 8500\,\mathrm{m} = 10\,200\,\mathrm{kg}
$$

Two independent routes, landing about $1\%$ apart. That is far stronger than either one alone, and she says so rather than leaving the interviewer to notice.

**State the uncertainty.** She is confident in the pressure figure and much less sure of the scale height. So she quotes the answer as $10^4\,\mathrm{kg}$ per square meter and does not defend the third significant figure.

**Sanity check on the sanity check.** Ten tonnes over a square meter sounds huge. But it is the same thing as the familiar fact that air pressure is about $10\,\mathrm{N}$ on every square centimeter — roughly the weight of a one-kilogram bag of sugar on a fingernail-sized patch. We do not feel it because the air pushes equally from every side.

Three minutes: a stated method, a cross-check, and a claim with honest edges.
:::

## What you cannot know in advance

Several things about your particular day are not fixed by anything this course can rely on:

- whether Fermi questions and puzzles get a round of their own, or appear inside the domain and systems rounds;
- how many domain rounds you get beyond "one or more";
- which subject area a domain round lands on;
- whether any of this is scored separately.

The composition lists the ingredients, not the recipe for your day.

That uncertainty costs less here than it would elsewhere, because the preparation is the same whichever way the day is arranged. One method carries across all four rounds: assumptions first, mechanism visible, physical meaning, sanity check, and honest edges where your knowledge stops. A candidate with that habit is ready for a domain round, a puzzle and a Fermi question with the same work. The subject knowledge still has to be there — but *which* slice of it gets examined changes your preparation far less than having no method would.

::: example A domain question outside her preparation
A candidate has prepared hard on classical control and **[[Kalman filtering|kalman]]** — the standard way to blend a prediction with noisy measurements. The domain round opens with the **unscented** filter and its **sigma points**. She has read about them once and never built one.

**The tempting move.** She could recite two remembered sentences — something about sigma points capturing the distribution better than a linearization — say them confidently, and hope no follow-up comes. It always comes. She does not do this.

**Step one: say where she is.** She tells the interviewer plainly: she has built extended Kalman filters and understands the linearization they rest on. She has not built an unscented filter, and she is working from reading, not experience. That one sentence sets honest terms for everything that follows.

**Step two: reason forward from what she owns.** The extended filter **linearizes** — it replaces the curved, true dynamics with a straight-line approximation around the current best estimate, and pushes the uncertainty through that straight line. So it should get worse when the dynamics bend a lot across the spread of the current uncertainty. She names the mechanism: the **[[Jacobian|jacobian]]** at one point is standing in for the behavior over a whole region.

From there she can say what a method that avoids linearizing would have to do. It would push a small set of representative points through the true, curved dynamics, and then rebuild the average and spread from where those points land. She says this is what she understands sigma points to be for.

**Step three: say how she would close the gap.** She would implement the unscented filter on a problem where she already has a working extended filter, and compare the two where the nonlinearity is strongest — because that is where any difference should show.

**Sanity check on the outcome.** She did not know the material. But the interviewer now knows exactly how much she knows. They watched her work out the purpose of a method she has never used, from a mechanism she does own. They heard a concrete plan for learning it. That beats two confident sentences by a wide margin — and it was only possible because she started by saying where she really was.
:::

## Check yourself

::: check
State the four-step answering standard for a domain round, and say what each step earns.
:::

::: answer
State your assumptions, write the equation, interpret it physically, sanity check.

- The **assumptions** tell the interviewer which problem you are solving. Leaving them out is the usual source of disagreement in these rounds.
- The **equation** shows the mechanism, not only the conclusion.
- The **physical interpretation** shows the symbols mean something to you, rather than being pushed around on paper.
- The **sanity check** — a limiting case, a dimensional argument, an order-of-magnitude comparison — is what separates engineering from finished algebra.
:::

::: check
The interviewer knows you have never seen the physics puzzle before. So what is it actually testing?
:::

::: answer
Your approach, not your knowledge. The interviewer watches whether you find out what is being asked before answering; whether you name the governing principle instead of copying a problem that only looks similar; whether you state the regime and your assumptions; whether you check the result against a limiting case; and what you do when you are stuck.

That last one tells them the most. The real job brings unfamiliar problems every week, so how someone behaves in front of one predicts how they will do the job.
:::

::: check
Give the five steps of the Fermi method and name the one candidates skip.
:::

::: answer
Decompose into factors, bound each factor, multiply through, sanity check against something known independently, and state your uncertainty.

The skipped step is the **sanity check**. A second, independent route to the same quantity is usually cheap. It catches arithmetic errors that would otherwise go unnoticed, and it makes the estimate much stronger evidence than a single chain nobody checked.
:::

::: check
Why is "I do not know, and here is how I would find out" a different answer from "I do not know", and not only a politer one?
:::

::: answer
Because it carries information the first does not. It tells the interviewer what you would actually do at your desk when you hit this gap — which reference you would open, which experiment you would run, which simpler case you would try first. That behavior is a large part of what the round is watching for.

The first answer closes the topic. The second keeps it going, with evidence. Both are far better than bluffing, which turns a question about the problem into a question about whether your confident statements can be trusted.
:::

::: check
A candidate is told her onsite includes "one or more domain rounds" and cannot find out which subject they will cover. Why is this less costly than it sounds?
:::

::: answer
Because what these rounds reward is a method, not one specific syllabus, and the method is the same across all of them: assumptions first, mechanism visible, physical meaning, sanity check, and honest edges where knowledge stops. A candidate with that habit is equally ready for a control question, an estimation question, a puzzle and a Fermi problem.

The subject depth still has to exist. But which slice of it gets examined changes the preparation far less than having no method would.
:::

## Summary

| Round | What it examines | The move that works |
| --- | --- | --- |
| Domain knowledge (1+) | Ownership of control, estimation and astrodynamics | Assumptions, equation, physical interpretation, sanity check |
| Abstract problem solving | How you approach a problem you have not practiced | Find the real question, name the principle, state the regime |
| Physics puzzles | The same, with a physical system | Limiting cases and dimensional arguments as checks |
| Fermi estimation | A bounded number from what you already know | Decompose, bound, multiply, cross-check, state uncertainty |
| All four | What you do at the edge of your knowledge | "I do not know, and here is how I would find out" |

The next lesson covers the last kind of round, and the only one with no technical material at all: the behavioral and culture round, and the STAR structure it is answered in.

::: context fermi-name Named after a physicist who estimated everything
Enrico Fermi (said "FAIR-mee") was an Italian-American physicist who won the 1938 Nobel Prize and led the team that built the first nuclear reactor. He was famous for getting good numbers from almost nothing. At the first atomic bomb test in 1945 he dropped small scraps of paper as the blast wave passed, watched how far they drifted, and estimated the explosion's energy on the spot. His quick figure was about ten kilotons of TNT. The yield measured later was a few times larger — but the same power of ten, from a handful of paper. That is exactly the skill the round is named for.
:::

::: context phase-margin A safety gap in a feedback loop
A **feedback loop** measures what a system is doing and pushes it back toward what you want — like a thermostat, or an autopilot holding a heading. Every loop reacts a little late. **Phase margin** measures how much *more* lateness the loop could take before its corrections arrive so late that they make the wobble worse instead of better. At that point the loop goes unstable. A **time delay** — a slow sensor, a slow computer — eats straight into that margin. You will meet phase margin properly, with Bode plots, in the control modules of the technical track.
:::

::: context limiting-case Push a number to the edge and look
A **limiting case** is a quick test: make one quantity very large or very small, and check that your formula does what the real world would do.

Say you derive the time for a ball to fall a height $h$ as $t = \sqrt{2h/g}$. Set $h = 0$: the time is zero. Good — a ball already on the floor takes no time to land. Make gravity weaker (smaller $g$): the time grows. Good — things fall slowly on the Moon.

If a formula says a ball on the floor takes three seconds to land, something is wrong, and you found it without redoing any algebra.
:::

::: context dimensions Units as a free error detector
A **dimensional argument** checks that the units on both sides of an equation match. Distance is meters, time is seconds, mass is kilograms.

If your answer for a speed comes out in $\mathrm{m/s^2}$, you know it is wrong before you look at a single number. Units cannot tell you a formula is right — a stray factor of 2 has no units — but they catch a whole family of mistakes, like dividing when you should multiply. Engineers do this check almost without thinking, and interviewers notice when you do it out loud.
:::

::: context order-of-magnitude Counting in powers of ten
An **order of magnitude** is a factor of ten. Numbers are in the same order of magnitude when they start with the same power of ten: $3{,}000$ and $8{,}000$ are both "thousands", or about $10^3$. A person's height (about $1\,\mathrm{m}$) and a rocket's height (about $70\,\mathrm{m}$) are nearly two orders of magnitude apart.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 110" font-family="Inter, Arial, sans-serif">
  <line x1="20" y1="55" x2="340" y2="55" stroke="#1f2a44" stroke-width="2"/>
  <g stroke="#1f2a44" stroke-width="2">
    <line x1="20" y1="47" x2="20" y2="63"/><line x1="100" y1="47" x2="100" y2="63"/><line x1="180" y1="47" x2="180" y2="63"/><line x1="260" y1="47" x2="260" y2="63"/><line x1="340" y1="47" x2="340" y2="63"/>
  </g>
  <g font-size="12" fill="#1f2a44" text-anchor="middle">
    <text x="20" y="80">1</text><text x="100" y="80">10</text><text x="180" y="80">100</text><text x="260" y="80">1,000</text><text x="340" y="80">10,000</text>
  </g>
  <text x="60" y="40" font-size="11" fill="#1d6fd1" text-anchor="middle">×10</text>
  <text x="140" y="40" font-size="11" fill="#1d6fd1" text-anchor="middle">×10</text>
  <text x="220" y="40" font-size="11" fill="#1d6fd1" text-anchor="middle">×10</text>
  <text x="300" y="40" font-size="11" fill="#1d6fd1" text-anchor="middle">×10</text>
  <text x="180" y="102" font-size="11" fill="#6c7a93" text-anchor="middle">each equal step is one order of magnitude</text>
</svg>
```

A Fermi answer aims to land on the right tick.
:::

::: context air-pressure Air has weight
Air feels like nothing, but it has mass: a cubic meter of it near the ground is about $1.2\,\mathrm{kg}$. Stack kilometers of it over your head and the weight adds up. **Air pressure** at sea level, about $101\,\mathrm{kPa}$, is the weight of that whole column pressing on each square meter.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 180" font-family="Inter, Arial, sans-serif">
  <rect x="140" y="20" width="60" height="30" fill="#8fb8f0" fill-opacity="0.15" stroke="#8fb8f0" stroke-width="1.5"/>
  <rect x="140" y="50" width="60" height="30" fill="#8fb8f0" fill-opacity="0.4" stroke="#8fb8f0" stroke-width="1.5"/>
  <rect x="140" y="80" width="60" height="30" fill="#8fb8f0" fill-opacity="0.7" stroke="#8fb8f0" stroke-width="1.5"/>
  <rect x="140" y="110" width="60" height="30" fill="#8fb8f0" stroke="#1d6fd1" stroke-width="1.5"/>
  <line x1="100" y1="140" x2="260" y2="140" stroke="#1f2a44" stroke-width="3"/>
  <text x="170" y="160" font-size="12" fill="#1f2a44" text-anchor="middle">1 m² of ground</text>
  <text x="215" y="40" font-size="11" fill="#6c7a93">thin air, high up</text>
  <text x="215" y="130" font-size="11" fill="#1d6fd1">dense air, low down</text>
  <line x1="120" y1="30" x2="120" y2="130" stroke="#b4232c" stroke-width="2"/>
  <polygon points="120,138 114,126 126,126" fill="#b4232c"/>
  <text x="20" y="75" font-size="12" fill="#b4232c">weight of</text>
  <text x="20" y="91" font-size="12" fill="#b4232c">column ≈ 10⁴ kg</text>
</svg>
```

The column really goes up for tens of kilometers and fades out slowly; the picture only shows it getting thinner with height.
:::

::: context scale-height Why density times height works
Air gets thinner as you climb. Near the ground, every $8$ to $9\,\mathrm{km}$ or so of height divides its density by about $2.7$ (the number $e$). That distance is the **scale height**, $H$.

Here is the neat part. If density falls off this way, $\rho(z) = \rho_0 e^{-z/H}$, the total mass in the column is

$$
\int_0^\infty \rho_0 e^{-z/H}\,dz = \rho_0 H,
$$

exactly as if the air kept its ground-level density $\rho_0$ up to height $H$ and then stopped. So "density times scale height" is not a crude trick — it is the right answer for an exponential atmosphere. The real atmosphere is not perfectly exponential, which is why the two routes differ by about $1\%$.
:::

::: context kalman Blending a guess with a measurement
A **Kalman filter** keeps a best guess of a vehicle's state — say, its position and speed — and how uncertain that guess is. Each time step it predicts where the vehicle should be next, then compares that with a noisy sensor reading, and blends the two. It trusts whichever one is less uncertain more. It was worked out around 1960 by Rudolf Kálmán, and a version of it helped navigate the Apollo spacecraft. The estimation modules of this course build one from scratch.
:::

::: context jacobian A straight line standing in for a curve
The **Jacobian** is the set of slopes of a function at one point — the steepness in each direction. An extended Kalman filter uses it to treat curved dynamics as a straight line near the current guess. That works when the uncertainty is small. When the uncertainty is wide and the curve bends a lot across it, the straight line misses.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 170" font-family="Inter, Arial, sans-serif">
  <path d="M30,150 Q180,-30 330,150" fill="none" stroke="#1f2a44" stroke-width="2.5"/>
  <line x1="40" y1="112.8" x2="260" y2="7.2" stroke="#b4232c" stroke-width="2" stroke-dasharray="6 4"/>
  <circle cx="120" cy="74.4" r="4.5" fill="#1f2a44"/>
  <circle cx="75" cy="104.1" r="4.5" fill="#1d6fd1"/>
  <circle cx="165" cy="60.9" r="4.5" fill="#1d6fd1"/>
  <text x="112" y="96" font-size="11" fill="#1f2a44">current guess</text>
  <text x="200" y="20" font-size="11" fill="#b4232c">straight-line stand-in</text>
  <text x="230" y="118" font-size="11" fill="#1d6fd1">sample points ride</text><text x="230" y="132" font-size="11" fill="#1d6fd1">the true curve</text>
  <text x="30" y="165" font-size="11" fill="#1f2a44">true curved dynamics</text>
</svg>
```

Near the guess, the red line and the curve agree. Farther away, the line runs off while the curve turns down. Pushing a few sample points (the guess and the two blue dots on either side) through the true curve — the sigma-point idea — follows the bend instead.
:::
